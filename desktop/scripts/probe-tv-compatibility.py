#!/usr/bin/env python3
"""Collect bounded, read-only Android TV command capabilities for one device.

The device must already appear as authorized in ``adb devices -l``. This tool
never connects, scans a network, installs packages, changes HOME, or writes a
launcher layout. Exit 0 means collection completed, not full TV compatibility.
Only selected property values and parsed summaries are saved; raw command
output, device addresses, user names and application names are not saved.
"""
import argparse
from dataclasses import dataclass
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import threading
import time


PROPERTIES = {
    "manufacturer": "ro.product.manufacturer",
    "brand": "ro.product.brand",
    "model": "ro.product.model",
    "androidVersion": "ro.build.version.release",
    "sdk": "ro.build.version.sdk",
    "abiList": "ro.product.cpu.abilist",
    "abi": "ro.product.cpu.abi",
    "securityPatch": "ro.build.version.security_patch",
    "firmwareBuild": "ro.build.display.id",
}
LEGACY_USER_SDKS = {"19", "21", "22", "23"}
INTENT = ("-a", "android.intent.action.MAIN", "-c", "android.intent.category.HOME")
FIXED_READS = {
    ("cat", "/proc/meminfo"), ("df", "-k", "/data"), ("df", "/data"), ("wm", "size"),
    ("am", "get-current-user"), ("cmd", "activity", "get-current-user"),
    ("dumpsys", "activity", "processes"), ("stat", "-f", "-c", "%S:%b:%a", "/data"),
}
PACKAGE = r"[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)*"
COMPONENT = re.compile(PACKAGE + r"/[A-Za-z0-9_.$]+")
RESOLVE_METADATA = re.compile(
    r"priority=-?[0-9]{1,10} preferredOrder=-?[0-9]{1,10} match=0x[0-9a-fA-F]{1,8} "
    r"specificIndex=-?[0-9]{1,10} isDefault=(?:true|false)")
REPORT_NAME = "compatibility-report.json"
# AOSP android-4.4_r1 bionic linker.cpp/linker.h and the API19 E3 image:
# legacy ADB shell merges this non-fatal Dalvik stderr diagnostic into pm output.
KITKAT_DALVIK_WARNING = ("WARNING: linker: libdvm.so has text relocations. This is wasting memory "
                         "and is a security risk. Please fix.")


@dataclass
class Result:
    status: str
    text: str = ""
    exit_code: int | None = None


def valid_user(value):
    value = value.strip()
    if not re.fullmatch(r"[0-9]+", value) or len(value) > 10:
        return None
    number = int(value)
    return number if number <= 2147483647 else None


def legacy_user(value):
    fields = [line.strip()[len("mUserLru:"):].strip()
              for line in value.splitlines() if line.strip().startswith("mUserLru:")]
    if len(fields) != 1 or not re.fullmatch(r"\[[^\[\]]*\]", fields[0]):
        return None
    items = fields[0][1:-1].split(",")
    if not 1 <= len(items) <= 1024:
        return None
    users = [valid_user(item) for item in items]
    if None in users or len(users) != len(set(users)):
        return None
    return users[-1]


def allowed_shell(command):
    command = tuple(command)
    if command in FIXED_READS:
        return True
    if len(command) == 2 and command[0] == "getprop":
        return command[1] in PROPERTIES.values()
    if len(command) == 5 and command[:3] == ("pm", "list", "packages"):
        return command[3] == "--user" and valid_user(command[4]) is not None
    for prefix in (("cmd", "package"), ("pm",)):
        for action, flag in (("query-activities", "--components"), ("resolve-activity", "--brief")):
            head = prefix + (action, flag, "--user")
            if (len(command) == len(head) + 1 + len(INTENT)
                    and command[:len(head)] == head and command[-len(INTENT):] == INTENT
                    and valid_user(command[len(head)]) is not None):
                return True
    return False


def classify(text, code):
    if re.search(r"(?im)^\s*usage(?:\s|:)", text):
        return "usage"
    if re.search(r"(?im)(?:^\s*(?:error:\s*)?(?:unknown (?:command|option)|unsupported|not supported)|"
                 r"(?:^|\s)(?:not found|can't find service|cannot find service)(?:\s|$))", text):
        return "unsupported"
    if code != 0 or re.search(r"(?im)^\s*(?:error[: ]|failure\s*\[|"
                              r"(?:[\w.$]+\.)?\w*Exception(?:\s|:)|permission (?:denied|denial))", text):
        return "command_failed"
    return "ok"


def run_bounded(argv, timeout, max_output, deadline):
    """Limit combined stdout/stderr while reading, including on Windows pipes."""
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        return Result("budget_exhausted")
    end = time.monotonic() + min(timeout, remaining)
    try:
        process = subprocess.Popen(argv, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                   stderr=subprocess.STDOUT, bufsize=0)
    except OSError:
        return Result("execution_error")
    data = bytearray()
    overflow = threading.Event()
    read_error = threading.Event()
    finished = threading.Event()

    def read_output():
        try:
            while True:
                chunk = os.read(process.stdout.fileno(), 4096)
                if not chunk:
                    break
                space = max_output - len(data)
                data.extend(chunk[:max(space, 0)])
                if len(chunk) > space:
                    overflow.set()
                    break
        except (OSError, ValueError):
            read_error.set()
        finally:
            # The reading thread owns the stream. On Windows, closing it in
            # another thread can wait for os.read's CRT fd lock indefinitely
            # when a descendant still holds the inherited write end open.
            try:
                process.stdout.close()
            except (OSError, ValueError):
                read_error.set()
            finished.set()

    reader = threading.Thread(target=read_output, daemon=True)
    reader.start()
    status = None
    while not (process.poll() is not None and finished.is_set()):
        if overflow.is_set():
            status = "output_limit"
            break
        if read_error.is_set():
            status = "read_error"
            break
        if time.monotonic() >= end:
            status = "budget_exhausted" if deadline <= end else "timeout"
            break
        finished.wait(0.01) if not finished.is_set() else time.sleep(0.01)
    if overflow.is_set():
        status = "output_limit"
    elif read_error.is_set():
        status = "read_error"
    if status:
        try:
            process.kill()
        except OSError:
            pass
    try:
        code = process.wait(timeout=0.5)
    except subprocess.TimeoutExpired:
        code = None
    reader.join(timeout=0.1)
    if status:
        return Result(status, exit_code=code)
    text = bytes(data).decode("utf-8", errors="replace")
    return Result(classify(text, code), text, code)


class AdbReader:
    def __init__(self, adb, serial, timeout=5.0, total_timeout=90.0,
                 max_output=524288, command_prefix=None):
        self.prefix = tuple(command_prefix) if command_prefix else (str(adb),)
        self.serial = serial
        self.timeout = timeout
        self.max_output = max_output
        self.deadline = time.monotonic() + total_timeout

    def devices(self):
        return self._run(("devices", "-l"))

    def version(self):
        return self._run(("version",))

    def shell(self, command):
        if not allowed_shell(command):
            raise ValueError("Command is outside the read-only allowlist")
        return self._run(("-s", self.serial, "shell", *command))

    def _run(self, args):
        return run_bounded((*self.prefix, *args), self.timeout, self.max_output, self.deadline)


def redacted(value, serial):
    """Property values are bounded and remove addresses even if firmware embeds them."""
    value = value.replace(serial, "[redacted]")
    value = re.sub(r"(?<!\w)(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]+)?(?!\w)", "[redacted]", value)
    value = re.sub(r"(?i)(?<![0-9a-f])(?:[0-9a-f]{2}:){5}[0-9a-f]{2}(?![0-9a-f])", "[redacted]", value)
    value = re.sub(r"(?i)(?<!\w)(?:[0-9a-f]{0,4}:){2,}[0-9a-f:.%\w-]*(?!\w)", "[redacted]", value)
    return value


def property_summary(text):
    value = text.strip()
    if not value or len(value) > 160 or any(ord(c) < 32 or ord(c) == 127 for c in value):
        return None
    return {"value": value}


def adb_version_summary(text):
    bridge = []
    tools = []
    for line in text.splitlines():
        match = re.fullmatch(r"Android Debug Bridge version ([0-9]{1,4}(?:\.[0-9]{1,4}){2})", line.strip())
        if match:
            bridge.append(match[1])
        match = re.fullmatch(r"Version ([0-9]{1,4}(?:\.[0-9]{1,4}){2}(?:-[0-9]{1,16})?)", line.strip())
        if match:
            tools.append(match[1])
    if len(bridge) != 1 or len(tools) > 1:
        return None
    return {"bridgeVersion": bridge[0], "platformToolsVersion": tools[0] if tools else None}


def memory_summary(text):
    fields = {}
    for line in text.splitlines():
        match = re.fullmatch(r"(MemTotal|MemAvailable|MemFree|Buffers|Cached):\s+([0-9]+) kB", line.strip())
        if match:
            if match[1] in fields or len(match[2]) > 16:
                return None
            fields[match[1]] = int(match[2]) * 1024
    total = fields.get("MemTotal", 0)
    if not total or total > 2**63 - 1:
        return None
    available = fields.get("MemAvailable")
    if available is None and all(k in fields for k in ("MemFree", "Buffers", "Cached")):
        available = sum(fields[k] for k in ("MemFree", "Buffers", "Cached"))
    if available is not None and not 0 <= available <= total:
        return None
    return {"totalBytes": total, "availableBytes": available}


def disk_summary(text):
    lines = [line.split() for line in text.splitlines() if line.strip()]
    if not lines:
        return None
    header = lines[0]
    if header[:4] == ["Filesystem", "1K-blocks", "Used", "Available"]:
        rows = [line for line in lines[1:] if len(line) == 6 and line[-1] == "/data"]
        if len(rows) == 1 and all(re.fullmatch(r"[0-9]{1,16}", v) for v in rows[0][1:4]):
            total, used, free = [int(v) * 1024 for v in rows[0][1:4]]
            if total > 0 and 0 <= used <= total and 0 <= free <= total:
                return {"format": "kib", "totalBytes": total, "availableBytes": free}
    if header == ["Filesystem", "Size", "Used", "Free", "Blksize"]:
        rows = [line for line in lines[1:] if len(line) == 5 and line[0] == "/data"]
        if len(rows) == 1:
            def human(value):
                m = re.fullmatch(r"([0-9]{1,12})(?:\.([0-9]{1,3}))?([KMGTP]?)", value)
                if not m:
                    return None
                decimal = (m[2] or "")
                numerator = int(m[1] + decimal)
                return numerator * 1024**("KMGTP".index(m[3]) + 1 if m[3] else 0) // 10**len(decimal)
            total, used, free = [human(v) for v in rows[0][1:4]]
            if (None not in (total, used, free) and total > 0 and total <= 2**63 - 1
                    and used <= total and free <= total and rows[0][4].isdigit()):
                return {"format": "legacy-human", "totalBytes": total, "availableBytes": free}
    return None


def stat_fs_summary(text):
    """Parse only the fixed stat -f format for the explicitly queried /data."""
    match = re.fullmatch(r"([0-9]{1,20}):([0-9]{1,20}):([0-9]{1,20})", text.strip())
    if not match:
        return None
    block_size, total_blocks, available_blocks = map(int, match.groups())
    maximum = 2**64 - 1
    if (not 0 < block_size <= maximum or not 0 < total_blocks <= maximum
            or not 0 <= available_blocks <= total_blocks):
        return None
    total = block_size * total_blocks
    available = block_size * available_blocks
    if total > maximum or available > maximum:
        return None
    return {"format": "stat-f", "totalBytes": total, "availableBytes": available}


def display_summary(text):
    matches = []
    for line in text.splitlines():
        match = re.fullmatch(r"(?:Physical|Override) size:\s*([0-9]{1,5})x([0-9]{1,5})", line.strip())
        if not match or not all(0 < int(v) <= 16384 for v in match.groups()):
            return None
        matches.append([int(v) for v in match.groups()])
    return {"width": matches[-1][0], "height": matches[-1][1]} if matches else None


def packages_summary(text):
    lines = [line.strip() for line in text.splitlines()
             if line.strip() and line.strip() != KITKAT_DALVIK_WARNING]
    # This probe reads the primary installed catalogue, not an empty filter.
    if not lines or any(not re.fullmatch("package:" + PACKAGE, line) for line in lines):
        return None
    return {"packageCount": len(set(lines))}


def homes_summary(text, resolving=False):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if resolving:
        # AOSP resolve-activity --brief prints this exact metadata line before
        # the flattened component. It identifies no HOME on its own.
        lines = [line for line in lines if not RESOLVE_METADATA.fullmatch(line)]
    if lines in (["No activities found"], ["No activity found"]):
        return {"componentCount": 0, **({"resolved": False} if resolving else {})}
    if not lines or any(not COMPONENT.fullmatch(line) for line in lines):
        return None
    components = set()
    for line in lines:
        package, name = line.split("/", 1)
        if not re.search(r"[A-Za-z]", name):
            return None
        components.add(package + "/" + (package + name if name.startswith(".") else name))
    summary = {"componentCount": len(components)}
    if resolving:
        actual = [value for value in components if "ResolverActivity" not in value and "ChooserActivity" not in value]
        summary["resolved"] = len(components) == 1 and len(actual) == 1
    return summary


def collect(reader, serial):
    report = {
        "schemaVersion": 1, "collectedAt": datetime.now(timezone.utc).isoformat(),
        "readOnlyProbe": True, "deviceAccessVerified": False,
        "physicalTvTested": False, "fullPhysicalCompatibilityVerified": False,
        "scope": "Only listed read-only probes; no end-to-end physical compatibility certification.",
        "host": {name: redacted(value, serial) for name, value in
                 (("os", platform.system()), ("release", platform.release()), ("architecture", platform.machine()))},
        "adbVersion": None,
        "identity": {}, "currentUser": {"verified": False}, "commands": {},
        "writeOperations": {name: "not_verified_on_device" for name in
                            ("install", "uninstall", "enableDisable", "setDefaultLauncher", "writeLauncherLayout")},
    }

    def record(label, result, parser=None):
        entry = {"status": result.status}
        if result.exit_code is not None:
            entry["exitCode"] = result.exit_code
        if result.status == "ok" and parser:
            summary = parser(result.text)
            if summary is None:
                entry["status"] = "invalid_output"
            else:
                entry["summary"] = summary
        report["commands"][label] = entry
        return entry.get("summary")

    result = reader.devices()
    record("deviceAccess", result)
    if result.status == "ok":
        lines = [line.split() for line in result.text.splitlines()]
        matches = [line[1] for line in lines if len(line) >= 2 and line[0] == serial]
        header = any(line == ["List", "of", "devices", "attached"] for line in lines)
        state = matches[0] if header and len(matches) == 1 else "ambiguous" if len(matches) > 1 else "not_present"
        if state not in ("device", "offline", "unauthorized", "ambiguous", "not_present"):
            state = "not_ready"
        report["commands"]["deviceAccess"]["targetState"] = state
        report["deviceAccessVerified"] = state == "device"
        if state != "device":
            report["commands"]["deviceAccess"]["status"] = "target_not_ready"
    if not report["deviceAccessVerified"]:
        report["probeCompleted"] = False
        return report

    report["adbVersion"] = record("adbVersion", reader.version(), adb_version_summary)
    for name, prop in PROPERTIES.items():
        summary = record("property." + name, reader.shell(("getprop", prop)), property_summary)
        if summary:
            value = redacted(summary["value"], serial)
            summary["value"] = value
            if name == "sdk" and not re.fullmatch(r"[1-9][0-9]{0,2}", value):
                report["commands"]["property.sdk"] = {"status": "invalid_output"}
            else:
                report["identity"][name] = value
    for name, command, parser in (
        ("memory", ("cat", "/proc/meminfo"), memory_summary),
        ("display", ("wm", "size"), display_summary),
    ):
        record(name, reader.shell(command), parser)
    storage = record("dataStorage", reader.shell(("df", "-k", "/data")), disk_summary)
    if storage is None:
        storage = record("dataStorage.legacy", reader.shell(("df", "/data")), disk_summary)
    else:
        report["commands"]["dataStorage.legacy"] = {"status": "not_run", "reason": "primary_query_succeeded"}
    if storage is None:
        # Android can report a bind-mount alias for df /data. Preserve strict
        # df parsing and ask statfs about the exact fixed path instead.
        record("dataStorage.statFs", reader.shell(("stat", "-f", "-c", "%S:%b:%a", "/data")), stat_fs_summary)
    else:
        report["commands"]["dataStorage.statFs"] = {"status": "not_run", "reason": "df_query_succeeded"}

    user = None
    for label, command in (("currentUser.am", ("am", "get-current-user")),
                           ("currentUser.cmd", ("cmd", "activity", "get-current-user"))):
        if user is not None:
            report["commands"][label] = {"status": "not_run", "reason": "earlier_source_verified"}
            continue
        summary = record(label, reader.shell(command), lambda text:
                         {"userId": valid_user(text)} if valid_user(text) is not None else None)
        if summary:
            user = summary["userId"]
            report["currentUser"] = {"verified": True, "source": label, "id": user}
    sdk = report["identity"].get("sdk", "")
    if user is None and sdk in LEGACY_USER_SDKS:
        label = "currentUser.legacyUserLru"
        summary = record(label, reader.shell(("dumpsys", "activity", "processes")), lambda text:
                         {"userId": legacy_user(text)} if legacy_user(text) is not None else None)
        if summary:
            user = summary["userId"]
            report["currentUser"] = {"verified": True, "source": label, "id": user}
    else:
        report["commands"]["currentUser.legacyUserLru"] = {
            "status": "not_run", "reason": "earlier_source_verified" if user is not None else "sdk_not_eligible"}

    scoped = [("packages", ("pm", "list", "packages", "--user"), (), packages_summary)]
    for prefix, label in ((("cmd", "package"), "cmd"), (("pm",), "pm")):
        for action, flag in (("query-activities", "--components"), ("resolve-activity", "--brief")):
            parser = (lambda text: homes_summary(text, resolving=True)) if action == "resolve-activity" else homes_summary
            scoped.append(("home." + label + "." + action, prefix + (action, flag, "--user"), INTENT, parser))
    for label, prefix, suffix, parser in scoped:
        if user is None:
            report["commands"][label] = {"status": "not_run", "reason": "current_user_unverified"}
        else:
            record(label, reader.shell((*prefix, str(user), *suffix)), parser)
    report["probeCompleted"] = not any(entry["status"] in
        {"timeout", "output_limit", "budget_exhausted", "execution_error", "read_error"}
        for entry in report["commands"].values())
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--adb", type=Path, required=True, help="Explicit path to adb/adb.exe")
    parser.add_argument("--serial", required=True, help="One already-authorized ADB serial or address")
    parser.add_argument("--output", type=Path, required=True, help="Directory for a new redacted JSON report")
    parser.add_argument("--command-timeout", type=float, default=5.0)
    parser.add_argument("--total-timeout", type=float, default=90.0)
    parser.add_argument("--max-output-bytes", type=int, default=524288)
    args = parser.parse_args(argv)
    if (not re.fullmatch(r"[A-Za-z0-9._:\[\]-]{1,255}", args.serial) or args.serial.startswith("-")
            or not 0 < args.command_timeout <= 15 or not 0 < args.total_timeout <= 180
            or not 128 <= args.max_output_bytes <= 1048576):
        parser.error("Invalid serial or limits; command <= 15s, total <= 180s, output 128..1048576 bytes")
    if not args.adb.is_file():
        parser.error("The explicitly selected ADB executable does not exist")
    destination = args.output / REPORT_NAME
    if destination.exists():
        parser.error("The output directory already contains a report; choose a new directory")
    reader = AdbReader(args.adb.resolve(), args.serial, args.command_timeout,
                       args.total_timeout, args.max_output_bytes)
    report = collect(reader, args.serial)
    try:
        args.output.mkdir(parents=True, exist_ok=True)
        with destination.open("x", encoding="utf-8") as stream:
            json.dump(report, stream, ensure_ascii=False, indent=2)
            stream.write("\n")
    except OSError:
        print("Could not write the compatibility report; existing reports were not replaced.")
        return 2
    print("Wrote compatibility-report.json. This is a read-only capability report, not full compatibility certification.")
    return 0 if report["deviceAccessVerified"] and report["probeCompleted"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
