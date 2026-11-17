#!/usr/bin/env python3
"""Observe existing release APKs on a fresh disposable Android TV emulator.

This does not rebuild, resign, patch, or inject a JavaScript/native test bridge.
A surviving process is not proof that a WebGL game rendered or became playable.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET


CASES = (
    ("neon-rush-0.1.1", "resource/apps/neon-rush/neon-rush-0.1.1.apk",
     "com.ecojust.neonrushtv", "com.ecojust.gamekit.MainActivity",
     "7a76f3fb85f006cefa95afbc876fe4a0abbda52c537f28f560241b42c9018376"),
    ("hifini-0.5.0", "resource/apps/hifini/hifini-0.5.0.apk",
     "com.ecojust.hifinitv", "com.ecojust.hifinitv.MainActivity",
     "11953adb659f93838f37535ba73bf7cf8a73e3409374abe0e9016f46240ee2af"),
    ("neon-rush-0.1.0", "resource/apps/neon-rush/neon-rush-0.1.0.apk",
     "com.ecojust.neonrushtv", "com.ecojust.gamekit.MainActivity",
     "7582c084f14d2ef951a51237a9d2b2641f0f55d845f38926c2e8d138ad8f47a9"),
)


def stamp():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def require(value, message):
    if not value:
        raise RuntimeError(message)


class Probe:
    def __init__(self, serial, output):
        self.serial = serial
        self.output = output
        self.commands = []

    def run(self, folder, name, *args, timeout=45, binary=False):
        command = ["adb", "-s", self.serial, *args]
        began = time.monotonic()
        try:
            result = subprocess.run(command, capture_output=True, timeout=timeout)
            code, stdout, stderr = result.returncode, result.stdout, result.stderr
            error = None
        except subprocess.TimeoutExpired as exc:
            code, stdout, stderr = -1, exc.stdout or b"", exc.stderr or b""
            error = "command_timeout"
        destination = folder / (name + (".png" if binary else ".stdout.txt"))
        destination.write_bytes(stdout)
        (folder / (name + ".stderr.txt")).write_bytes(stderr)
        record = {"argv": command, "exitCode": code, "elapsedSeconds": round(time.monotonic() - began, 3),
                  "stdout": str(destination.relative_to(self.output)),
                  "stderr": str((folder / (name + ".stderr.txt")).relative_to(self.output))}
        if error:
            record["error"] = error
        self.commands.append(record)
        return code, stdout.decode("utf-8", errors="replace") if not binary else stdout

    def observation(self, folder, package, label):
        _, pid = self.run(folder, label + "-pid", "shell", "pidof", package)
        _, activities = self.run(folder, label + "-activities", "shell", "dumpsys", "activity", "activities")
        _, windows = self.run(folder, label + "-window", "shell", "dumpsys", "window")
        code, picture = self.run(folder, label + "-screen", "exec-out", "screencap", "-p", binary=True)
        foreground = [line.strip() for line in (activities + "\n" + windows).splitlines()
                      if any(key in line for key in ("topResumedActivity", "mResumedActivity", "mCurrentFocus", "mFocusedApp"))]
        remote = "/data/local/tmp/puretv-launch-probe-" + folder.name + "-" + label + ".xml"
        self.run(folder, label + "-ui-remove-old", "shell", "rm", "-f", remote)
        dump_code, _ = self.run(folder, label + "-ui-dump", "shell", "uiautomator", "dump", remote, timeout=25)
        ui_code, xml = None, ""
        if dump_code == 0:
            ui_code, xml = self.run(folder, label + "-ui", "exec-out", "cat", remote)
        visible_text = []
        if dump_code == 0 and ui_code == 0:
            try:
                for node in ET.fromstring(xml).iter("node"):
                    for key in ("text", "content-desc"):
                        value = node.get(key, "").strip()
                        if value and value not in visible_text:
                            visible_text.append(value)
            except ET.ParseError:
                pass
        return {"observedAt": stamp(), "pid": pid.strip(), "processAlive": bool(pid.strip()),
                "foregroundLines": foreground, "packageInForeground": any(package in line for line in foreground),
                "screenshotValidPng": code == 0 and picture.startswith(b"\x89PNG\r\n\x1a\n"),
                "uiDumpExitCode": dump_code, "uiReadExitCode": ui_code,
                "visibleAccessibilityText": visible_text,
                "note": "Process, foreground and screenshots are observations, not an assertion of WebGL gameplay."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--serial", required=True)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    require(os.environ.get("PURETV_DISPOSABLE_EMULATOR") == "1", "Explicit disposable-emulator flag required")
    require(args.serial == "emulator-5554", "Only this CI's emulator-5554 is permitted")
    root = Path(__file__).resolve().parents[1]
    output = args.output.resolve()
    require(not output.exists() or not any(output.iterdir()), "Use an empty evidence directory")
    output.mkdir(parents=True, exist_ok=True)
    probe = Probe(args.serial, output)
    report = {"schema": 1, "startedAt": stamp(), "status": "running", "sourceCommit": os.environ.get("GITHUB_SHA"),
              "method": "Install unchanged published APKs, launch their normal activities, observe ADB process/window/UI/screenshots, and send one ordinary DPAD_CENTER key to a surviving game.",
              "physicalTvTested": False, "physicalPhoneTested": False, "physicalEsp32Tested": False,
              "appleSiliconTested": False, "apkCheckerHostTested": False,
              "scope": "Linux Android TV API36 x86_64 emulator with SwiftShader; different CPU/GPU path from APK Checker on Apple Silicon API36 arm64 with gpu=auto.",
              "webglGameplayAutomaticallyVerified": False, "cases": [], "commands": probe.commands}
    mutation_allowed = False
    try:
        _, qemu = probe.run(output, "safety-qemu", "shell", "getprop", "ro.kernel.qemu")
        require(qemu.strip() == "1", "Target is not an Android emulator")
        code, avd = probe.run(output, "safety-avd-name", "emu", "avd", "name")
        require(code == 0 and avd.splitlines()[0].strip() == "GameApkLaunch_Validation", "Unexpected AVD; refusing package changes")
        for package in sorted({case[2] for case in CASES}):
            _, installed = probe.run(output, "safety-package-" + package, "shell", "pm", "path", package)
            require(not installed.strip(), "Test package already installed; refusing to delete existing app data: " + package)
        for label, relative, _, _, digest in CASES:
            file = root / relative
            require(file.is_file() and hashlib.sha256(file.read_bytes()).hexdigest() == digest, "Published APK hash mismatch: " + label)
        mutation_allowed = True
        probe.run(output, "device-properties", "shell", "getprop")
        probe.run(output, "device-features", "shell", "pm", "list", "features")
        probe.run(output, "device-display", "shell", "wm", "size")
        probe.run(output, "webview-provider", "shell", "dumpsys", "webviewupdate")
        probe.run(output, "device-surfaceflinger", "shell", "dumpsys", "SurfaceFlinger")
        for label, relative, package, activity, digest in CASES:
            folder = output / label
            folder.mkdir()
            file = root / relative
            case = {"id": label, "apk": relative, "apkSha256": digest, "apkBytes": file.stat().st_size,
                    "package": package, "activity": activity, "startedAt": stamp(), "status": "running"}
            report["cases"].append(case)
            try:
                probe.run(folder, "logcat-clear", "logcat", "-c")
                probe.run(folder, "crash-clear", "logcat", "-b", "crash", "-c")
                code, result = probe.run(folder, "install", "install", "--user", "0", str(file), timeout=120)
                require(code == 0 and "Success" in result, "APK install failed")
                probe.run(folder, "installed-package", "shell", "dumpsys", "package", package)
                code, launch = probe.run(folder, "launch", "shell", "am", "start", "-W", "-n", package + "/" + activity)
                case["amStartExitCode"] = code
                case["amStartReportedError"] = bool(re.search(r"(?:Error:|Exception|does not exist)", launch))
                time.sleep(10)
                case["afterTenSeconds"] = probe.observation(folder, package, "after-ten-seconds")
                if package == "com.ecojust.neonrushtv" and case["afterTenSeconds"]["processAlive"] and case["afterTenSeconds"]["packageInForeground"]:
                    probe.run(folder, "ordinary-confirm", "shell", "input", "keyevent", "KEYCODE_DPAD_CENTER")
                    time.sleep(5)
                    case["afterOrdinaryConfirm"] = probe.observation(folder, package, "after-confirm")
                observation = case.get("afterOrdinaryConfirm", case["afterTenSeconds"])
                case["status"] = "process-survived" if observation["processAlive"] and observation["packageInForeground"] else "not-running-in-foreground"
            except Exception as exc:
                case["status"] = "probe-or-app-failure"
                case["error"] = type(exc).__name__ + ": " + str(exc)
            finally:
                probe.run(folder, "logcat", "logcat", "-d", "-v", "threadtime", "-t", "4000")
                _, crash = probe.run(folder, "logcat-crash", "logcat", "-b", "crash", "-d", "-v", "threadtime")
                _, console = probe.run(folder, "webview-console", "logcat", "-d", "-v", "threadtime", "chromium:V", "WebViewFactory:V", "AndroidRuntime:V", "*:S")
                case["crashBufferMentionsPackage"] = package in crash
                case["javaFatalExceptionObserved"] = "FATAL EXCEPTION" in crash and package in crash
                case["webviewErrorCandidates"] = [line for line in console.splitlines() if any(term in line.lower() for term in ("error", "uncaught", "failed", "exception", "webgl"))][-80:]
                probe.run(folder, "stop", "shell", "am", "force-stop", package)
                cleanup_code, cleanup = probe.run(folder, "uninstall", "uninstall", package)
                case["cleanupSucceeded"] = cleanup_code == 0 and "Success" in cleanup
                case["finishedAt"] = stamp()
        report["status"] = "observations-complete"
        report["allProcessesSurvived"] = all(case["status"] == "process-survived" for case in report["cases"])
    except Exception as exc:
        report["status"] = "setup-failed"
        report["error"] = type(exc).__name__ + ": " + str(exc)
    finally:
        report["packageMutationAuthorized"] = mutation_allowed
        report["finishedAt"] = stamp()
        (output / "summary.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        files = [p for p in sorted(output.rglob("*")) if p.is_file()]
        (output / "SHA256SUMS.txt").write_text("".join(hashlib.sha256(p.read_bytes()).hexdigest() + "  " + str(p.relative_to(output)) + "\n" for p in files))
        print(json.dumps({"status": report["status"], "cases": [{key: case.get(key) for key in ("id", "status", "javaFatalExceptionObserved", "error")} for case in report["cases"]]}, ensure_ascii=False))
    return 0 if report["status"] == "observations-complete" else 1


if __name__ == "__main__":
    raise SystemExit(main())
