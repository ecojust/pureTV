#!/usr/bin/env python3
"""Run the fixed E3 matrix on an isolated GitHub-hosted Linux runner only.

No serial/address option is accepted. SDK images are virtual devices, not vendor
firmware certification. APKs and the disposable test signing key stay outside
the uploaded diagnostic directory. --check-config performs no SDK/device work.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import signal
import socket
import stat
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = ROOT / "desktop/tests/fixtures/tv-compatibility"
SERIAL = "emulator-5554"
ADB_OVERRIDES = ("ADB_SERVER_SOCKET", "ANDROID_ADB_SERVER_ADDRESS", "ANDROID_ADB_SERVER_PORT", "ADB_SERVER_PORT")
ANDROID_NS = "{http://schemas.android.com/apk/res/android}"


class Failure(Exception):
    pass


class Interrupted(Failure):
    pass


class EmulatorFailure(Failure):
    pass


def revision(value):
    if not re.fullmatch(r"[0-9]+(?:\.[0-9]+){0,2}", value):
        raise Failure("Invalid SDK revision")
    values = tuple(int(part) for part in value.split("."))
    return values + (0,) * (3 - len(values))


def configuration():
    config = json.loads((FIXTURES / "system-images.json").read_text())
    expected = {"api19-default": (19, "default"), "api23-tv": (23, "android-tv"), "api30-tv": (30, "android-tv")}
    if set(config["images"]) != set(expected):
        raise Failure("The emulator matrix is not the reviewed fixed set")
    if (config["fixturePackage"], config["fixtureMinSdk"], config["fixtureTargetSdk"],
            config["buildTools"], config["buildPlatform"], config["minimumFreeBytes"]) != (
            "org.puretv.compatfixture", 19, 28, "35.0.0", "android-35", 10 * 1024**3):
        raise Failure("Fixture or disk requirements differ from the reviewed configuration")
    for key, (sdk, tag) in expected.items():
        image = config["images"][key]
        if (image["sdk"], image["tag"], image["abi"], image["package"]) != (
                sdk, tag, "x86", f"system-images;android-{sdk};{tag};x86"):
            raise Failure("Unexpected system image identity")
    for item in [config["emulator"], *config["images"].values()]:
        revision(item["revision"])
        if (item["checksumType"] != "sha1" or not re.fullmatch(r"[a-f0-9]{40}", item["checksum"])
                or item["bytes"] <= 0 or not all(value.startswith("https://dl.google.com/android/repository/")
                for value in (item["repository"], item["url"]))):
            raise Failure("Invalid fixed official SDK archive metadata")
    manifest = ET.parse(FIXTURES / "AndroidManifest.xml").getroot()
    sdk = manifest.find("uses-sdk")
    app = manifest.find("application")
    if (manifest.attrib.get("package") != "org.puretv.compatfixture"
            or sdk is None or app is None or list(app)
            or sdk.attrib.get(ANDROID_NS + "minSdkVersion") != "19"
            or sdk.attrib.get(ANDROID_NS + "targetSdkVersion") != "28"
            or app.attrib.get(ANDROID_NS + "hasCode") != "false"
            or app.attrib.get(ANDROID_NS + "debuggable") != "true"
            or [item.tag for item in manifest] != ["uses-sdk", "application"]):
        raise Failure("Fixture must be the component-free, debuggable test package")
    return config


def properties(path):
    values = {}
    for line in path.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()
    return values


def stop_owned(process, grace=2):
    """Signal only the process group created by our own Popen handle."""
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    end = time.monotonic() + grace
    while time.monotonic() < end:
        try:
            os.killpg(process.pid, 0)
        except ProcessLookupError:
            break
        time.sleep(0.05)
    try:
        os.killpg(process.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    try:
        process.wait(timeout=1)
    except subprocess.TimeoutExpired:
        pass


class Run:
    def __init__(self, artifacts, environment):
        self.artifacts = artifacts
        self.environment = environment
        self.deadline = time.monotonic() + 1800
        self.command_number = 0
        self.monitor = None

    def command(self, name, args, timeout=30, input_text=None, required=True, diagnostic=False):
        if self.monitor is not None and not diagnostic:
            self.monitor()
        self.command_number += 1
        path = self.artifacts / f"{self.command_number:02d}-{name}.log"
        remaining = 20 if diagnostic else self.deadline - time.monotonic()
        if remaining <= 0:
            raise Failure("Overall 30-minute test budget exhausted")
        end = time.monotonic() + min(timeout, remaining)
        with path.open("wb") as log:
            try:
                process = subprocess.Popen([str(value) for value in args],
                    stdin=subprocess.PIPE if input_text is not None else subprocess.DEVNULL,
                    stdout=log, stderr=subprocess.STDOUT, env=self.environment,
                    start_new_session=True)
            except OSError as error:
                log.write((type(error).__name__ + " while starting command\n").encode())
                raise Failure(f"Could not start {name}") from None
            if input_text is not None:
                try:
                    process.stdin.write(input_text.encode())
                except BrokenPipeError:
                    pass
                finally:
                    process.stdin.close()
            failure = None
            try:
                while process.poll() is None:
                    if self.monitor is not None and not diagnostic:
                        self.monitor()
                    if time.monotonic() >= end:
                        failure = "timeout"
                        break
                    if path.stat().st_size > 16 * 1024 * 1024:
                        failure = "diagnostic output limit"
                        break
                    time.sleep(0.1)
            finally:
                if process.poll() is None:
                    stop_owned(process)
            code = process.wait(timeout=1)
        if self.monitor is not None and not diagnostic:
            self.monitor()
        size = path.stat().st_size
        if size > 16 * 1024 * 1024:
            failure = failure or "diagnostic output limit"
        if failure:
            with path.open("ab") as log:
                log.write(("\nRunner stopped this command: " + failure + "\n").encode())
            raise Failure(f"{name}: {failure}")
        text = path.read_text(errors="replace")
        if code != 0 and required:
            raise Failure(f"{name} exited {code}; see diagnostic log")
        return code, text

    def repository(self, expected, name):
        with urllib.request.urlopen(expected["repository"], timeout=30) as response:
            data = response.read(2 * 1024 * 1024 + 1)
        if len(data) > 2 * 1024 * 1024:
            raise Failure("SDK repository metadata exceeds its bound")
        (self.artifacts / f"repository-{name}.xml").write_bytes(data)
        root = ET.fromstring(data)
        local = lambda element: element.tag.rsplit("}", 1)[-1]
        def child(element, key):
            return next((value for value in element if local(value) == key), None)
        def text(element, key):
            value = child(element, key)
            return value.text if value is not None else None
        for package in root:
            if local(package) != "remotePackage" or package.attrib.get("path") != expected["package"]:
                continue
            version = child(package, "revision")
            actual = tuple(int(text(version, key) or "0") for key in ("major", "minor", "micro"))
            channel = child(package, "channelRef")
            if actual != revision(expected["revision"]) or channel is None or channel.attrib.get("ref") != "channel-0":
                continue
            for archive in child(package, "archives"):
                if text(archive, "host-os") not in (None, "linux"):
                    continue
                complete = child(archive, "complete")
                checksum = child(complete, "checksum")
                if (urllib.parse.urljoin(expected["repository"], text(complete, "url")) == expected["url"]
                        and int(text(complete, "size")) == expected["bytes"]
                        and checksum.attrib.get("type") == expected["checksumType"]
                        and checksum.text == expected["checksum"]):
                    return
        raise Failure(f"Official {name} metadata no longer matches the pinned stable archive")


def fixture_apks(run, config, sdk, work):
    tools = sdk / "build-tools" / config["buildTools"]
    manifest = FIXTURES / "AndroidManifest.xml"
    key = work / "ephemeral-test-key.jks"
    # This fixed password protects a disposable CI test key, never a release key.
    run.command("fixture-key", ["keytool", "-genkeypair", "-noprompt", "-keystore", key,
        "-storepass", "android", "-keypass", "android", "-alias", "fixture", "-keyalg", "RSA",
        "-keysize", "2048", "-sigalg", "SHA256withRSA", "-validity", "2",
        "-dname", "CN=pureTV disposable emulator fixture"], timeout=60)
    apks = []
    metadata = {"package": config["fixturePackage"], "signing": "ephemeral-test-key-not-release",
                "apksUploaded": False, "keyUploaded": False, "versions": []}
    for version in (1, 2):
        unsigned, aligned, signed = [work / f"fixture-v{version}-{suffix}.apk" for suffix in ("unsigned", "aligned", "signed")]
        run.command(f"fixture-v{version}-link", [tools / "aapt2", "link", "-I",
            sdk / "platforms" / config["buildPlatform"] / "android.jar", "--manifest", manifest,
            "--min-sdk-version", "19", "--target-sdk-version", "28", "--version-code", str(version),
            "--version-name", str(version), "-o", unsigned])
        run.command(f"fixture-v{version}-align", [tools / "zipalign", "-f", "4", unsigned, aligned])
        run.command(f"fixture-v{version}-sign", [tools / "apksigner", "sign", "--ks", key,
            "--ks-key-alias", "fixture", "--ks-pass", "pass:android", "--key-pass", "pass:android",
            "--min-sdk-version", "19", "--v1-signing-enabled", "true", "--v2-signing-enabled", "true",
            "--v3-signing-enabled", "false", "--out", signed, aligned])
        _, signing = run.command(f"fixture-v{version}-verify", [tools / "apksigner", "verify",
            "--min-sdk-version", "19", "--verbose", signed])
        if "Verified using v1 scheme (JAR signing): true" not in signing:
            raise Failure("Fixture is not verified with Android 4.4-compatible v1 signing")
        _, badging = run.command(f"fixture-v{version}-identity", [tools / "aapt2", "dump", "badging", signed])
        package = next((line for line in badging.splitlines() if line.startswith("package: ")), "")
        if (f"name='{config['fixturePackage']}'" not in package or f"versionCode='{version}'" not in package
                or "sdkVersion:'19'" not in badging or "targetSdkVersion:'28'" not in badging
                or "launchable-activity:" in badging or not 0 < signed.stat().st_size < 1048576):
            raise Failure("Built fixture identity, SDK bounds, or size is incorrect")
        metadata["versions"].append({"versionCode": version, "bytes": signed.stat().st_size,
            "sha256": hashlib.sha256(signed.read_bytes()).hexdigest(), "v1SignatureVerified": True})
        apks.append(signed)
    (run.artifacts / "fixture.json").write_text(json.dumps(metadata, indent=2) + "\n")
    return apks


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", choices=("api19-default", "api23-tv", "api30-tv"))
    parser.add_argument("--artifacts", type=Path)
    parser.add_argument("--check-config", action="store_true")
    args = parser.parse_args(argv)
    config = configuration()
    if args.check_config:
        print("Reviewed 3 fixed SDK images and the component-free emulator-only APK manifest")
        return 0
    if args.image is None or args.artifacts is None:
        parser.error("--image and --artifacts are required")
    artifacts = args.artifacts.resolve()
    artifacts.mkdir(parents=True, exist_ok=False)
    image = config["images"][args.image]
    summary = {"schemaVersion": 1, "status": "RUNNING", "stage": "setup", "image": image,
        "sourceCommit": os.environ.get("GITHUB_SHA"), "startedAt": datetime.now(timezone.utc).isoformat(),
        "attemptedEvidenceLevel": "E3", "evidenceLevel": "E0", "emulatorTested": False,
        "physicalTvTested": False, "fullPhysicalCompatibilityVerified": False,
        "scope": "Official SDK image; does not certify Xiaomi/vendor firmware or a physical television.",
        "archiveChecksumSource": "Official SDK repository metadata; sdkmanager performs the archive installation.",
        "archiveChecksumIndependentlyRecomputed": False}
    environment = os.environ.copy()
    java = environment.get("JAVA_HOME_17_X64") or environment.get("JAVA_HOME")
    if java:
        environment["JAVA_HOME"] = java
        environment["PATH"] = str(Path(java) / "bin") + os.pathsep + environment.get("PATH", "")
    run = Run(artifacts, environment)
    emulator = None
    emulator_log = None
    adb = None
    work = None
    previous_signals = {}
    def interrupt(signum, frame):
        raise Interrupted("CI execution interrupted; incomplete evidence is retained")
    for signum in (signal.SIGTERM, signal.SIGINT):
        previous_signals[signum] = signal.signal(signum, interrupt)
    try:
        if (platform.system() != "Linux" or os.environ.get("GITHUB_ACTIONS") != "true"
                or os.environ.get("RUNNER_ENVIRONMENT") != "github-hosted"
                or os.environ.get("PURETV_EMULATOR_TEST") != "1"):
            raise Failure("Execution requires the explicit isolated GitHub-hosted Linux emulator job")
        if any(name in os.environ for name in ADB_OVERRIDES):
            raise Failure("ADB server override variables are forbidden")
        temp_root = Path(os.environ["RUNNER_TEMP"]).resolve()
        work = Path(tempfile.mkdtemp(prefix="puretv-emulator-", dir=temp_root))
        summary["host"] = {"os": platform.system(), "release": platform.release(), "architecture": platform.machine(),
                           "freeBytesBeforeSetup": shutil.disk_usage(work).free}
        if summary["host"]["freeBytesBeforeSetup"] < config["minimumFreeBytes"]:
            raise Failure("Less than 10 GiB free for the independent SDK image job")
        if not Path("/dev/kvm").exists() or not stat.S_ISCHR(Path("/dev/kvm").stat().st_mode):
            raise Failure("The runner does not expose a KVM character device")
        run.command("kvm-permissions", ["sudo", "-n", "chmod", "0666", "/dev/kvm"])
        if not os.access("/dev/kvm", os.R_OK | os.W_OK):
            raise Failure("KVM is not accessible to the runner user")
        sdk_value = environment.get("ANDROID_SDK_ROOT") or environment.get("ANDROID_HOME")
        if not sdk_value:
            raise Failure("Runner Android SDK location is unavailable")
        sdk = Path(sdk_value).resolve()
        sdkmanager = sdk / "cmdline-tools/latest/bin/sdkmanager"
        avdmanager = sdk / "cmdline-tools/latest/bin/avdmanager"
        if not sdkmanager.is_file() or not avdmanager.is_file():
            raise Failure("Runner Android command-line tools are unavailable")
        environment["ANDROID_AVD_HOME"] = str(work / "avds")
        Path(environment["ANDROID_AVD_HOME"]).mkdir()
        run.command("java-version", ["java", "-version"])
        run.command("sdkmanager-version", [sdkmanager, "--version"])
        run.repository(image, "image")
        run.repository(config["emulator"], "emulator")
        run.command("sdk-install", [sdkmanager, f"--sdk_root={sdk}", "--channel=0", "--install",
            "platform-tools", "emulator", f"build-tools;{config['buildTools']}",
            f"platforms;{config['buildPlatform']}", image["package"]], timeout=900, input_text="y\n" * 128)
        installed = sdk / "system-images" / f"android-{image['sdk']}" / image["tag"] / image["abi"] / "source.properties"
        actual = properties(installed)
        if (revision(actual.get("Pkg.Revision", "")) != revision(image["revision"])
                or actual.get("AndroidVersion.ApiLevel") != str(image["sdk"])
                or actual.get("SystemImage.Abi") != image["abi"] or actual.get("SystemImage.TagId") != image["tag"]):
            raise Failure("Installed system image does not match the pinned API/tag/ABI/revision")
        emulator_properties = properties(sdk / "emulator/source.properties")
        if revision(emulator_properties.get("Pkg.Revision", "")) != revision(config["emulator"]["revision"]):
            raise Failure("Installed emulator does not match the pinned stable version")
        shutil.copyfile(installed, artifacts / "image-source.properties")
        shutil.copyfile(sdk / "emulator/source.properties", artifacts / "emulator-source.properties")
        summary["installedImageProperties"] = actual
        summary["installedEmulatorProperties"] = emulator_properties
        adb = sdk / "platform-tools/adb"
        emulator_binary = sdk / "emulator/emulator"
        run.command("adb-version", [adb, "version"])
        run.command("emulator-version", [emulator_binary, "-version"])
        _, acceleration = run.command("emulator-acceleration", [emulator_binary, "-accel-check"])
        if not re.search(r"KVM.*(?:installed and usable|is usable)", acceleration, re.I):
            raise Failure("Hardware KVM acceleration was not verified; software fallback is forbidden")
        _, existing = run.command("adb-before-boot", [adb, "devices", "-l"])
        if any(re.match(r"^\S+\s+(?:device|offline|unauthorized)\b", line) for line in existing.splitlines()):
            raise Failure("Runner already has an ADB target; refusing to touch it")
        for port in (5554, 5555):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as check:
                check.bind(("127.0.0.1", port))
        avd = "puretv-compatibility"
        run.command("avd-create", [avdmanager, "create", "avd", "--name", avd, "--package", image["package"]],
                    timeout=120, input_text="no\n")
        summary["stage"] = "boot"
        emulator_log = (artifacts / "emulator-boot.log").open("wb")
        emulator = subprocess.Popen([str(emulator_binary), "-avd", avd, "-port", "5554",
            "-no-window", "-no-audio", "-no-snapshot", "-no-boot-anim", "-accel", "on",
            "-gpu", "swiftshader", "-memory", "2048"], stdin=subprocess.DEVNULL,
            stdout=emulator_log, stderr=subprocess.STDOUT, env=environment, start_new_session=True)
        def monitor_emulator():
            if (artifacts / "emulator-boot.log").stat().st_size > 64 * 1024 * 1024:
                stop_owned(emulator)
                raise EmulatorFailure("Emulator diagnostics exceeded 64 MiB; not a Manager failure")
            if emulator.poll() is not None:
                raise EmulatorFailure(f"Emulator exited ({emulator.returncode}); not a Manager failure")
        run.monitor = monitor_emulator
        boot_deadline = min(run.deadline, time.monotonic() + 300)
        while True:
            monitor_emulator()
            if time.monotonic() >= boot_deadline:
                raise Failure("Emulator did not finish boot within 300 seconds; not a Manager failure")
            try:
                code, value = run.command("boot-complete", [adb, "-s", SERIAL, "shell", "getprop", "sys.boot_completed"],
                                          timeout=5, required=False)
            except Interrupted:
                raise
            except Failure as error:
                if "timeout" not in str(error):
                    raise
                code, value = 1, ""
            if code == 0 and value.strip() == "1":
                break
            time.sleep(2)
        boot = {}
        for key in ("ro.kernel.qemu", "ro.build.version.sdk", "sys.boot_completed"):
            _, output = run.command("boot-identity", [adb, "-s", SERIAL, "shell", "getprop", key])
            boot[key] = output.strip()
        if boot != {"ro.kernel.qemu": "1", "ro.build.version.sdk": str(image["sdk"]), "sys.boot_completed": "1"}:
            raise Failure("Booted target is not the expected emulator SDK")
        summary["bootVerified"] = boot
        run.command("adb-after-boot", [adb, "devices", "-l"])
        summary["stage"] = "read-only-probe"
        run.command("read-only-probe", [sys.executable, ROOT / "desktop/scripts/probe-tv-compatibility.py",
            "--adb", adb, "--serial", SERIAL, "--output", artifacts / "probe"], timeout=120)
        probe_report = json.loads((artifacts / "probe/compatibility-report.json").read_text())
        if not probe_report.get("deviceAccessVerified") or probe_report.get("identity", {}).get("sdk") != str(image["sdk"]):
            raise Failure("Read-only probe did not verify the expected SDK")
        summary["stage"] = "fixture-build"
        v1, v2 = fixture_apks(run, config, sdk, work)
        summary["stage"] = "core-tests"
        core_report_path = artifacts / "core-report.json"
        code, _ = run.command("manager-core", ["cargo", "run", "--locked", "--manifest-path",
            ROOT / "desktop/core/Cargo.toml", "--example", "tv_compatibility", "--", "--adb", adb,
            "--expected-sdk", str(image["sdk"]), "--fixture-v1", v1, "--fixture-v2", v2,
            "--report", core_report_path], timeout=600, required=False)
        core_report = json.loads(core_report_path.read_text()) if core_report_path.is_file() else {}
        summary["evidenceLevel"] = core_report.get("evidenceLevel", "E0")
        summary["emulatorTested"] = core_report.get("emulatorTested", False)
        monitor_emulator()
        if code != 0 or core_report.get("status") != "PASS" or summary["evidenceLevel"] != "E3":
            if summary["evidenceLevel"] != "E3":
                summary["stage"] = "core-guard"
            raise Failure("Manager checks did not pass; see the separate core report")
        summary["testedScopeCompatibility"] = core_report.get("testedScopeCompatibility")
        summary["status"] = "PASS"
        summary["stage"] = "completed"
        print(f"PASS E3 SDK {image['sdk']}: official emulator image, no physical-TV claim")
        return 0
    except Exception as error:
        if isinstance(error, EmulatorFailure) and summary["stage"] != "boot":
            summary["stage"] = "emulator-runtime"
        summary["status"] = "INTERRUPTED" if isinstance(error, Interrupted) else "FAIL"
        summary["failure"] = str(error) if isinstance(error, Failure) else type(error).__name__
        print(f"{summary['status']} {summary['stage']}: {summary['failure']}")
        return 1
    finally:
        if adb is not None and adb.is_file():
            try:
                run.command("adb-final-diagnostic", [adb, "devices", "-l"], timeout=5, required=False, diagnostic=True)
            except (Failure, OSError):
                pass
        if emulator is not None:
            stop_owned(emulator)
            summary["emulatorProcessExited"] = emulator.poll() is not None
        if emulator_log is not None:
            emulator_log.close()
        if work is not None:
            key = work / "ephemeral-test-key.jks"
            if key.exists():
                key.unlink()
        summary["finishedAt"] = datetime.now(timezone.utc).isoformat()
        (artifacts / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
        for signum, previous in previous_signals.items():
            signal.signal(signum, previous)


if __name__ == "__main__":
    raise SystemExit(main())
