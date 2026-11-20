#!/usr/bin/env python3
"""Exercise the signed Opera TV APK through ordinary UI on a fresh TV emulator.

No production hooks are used. A generated local video proves the media clock,
pause and persisted resume; public CCTV playback is reported independently.
"""
from __future__ import annotations

import argparse
import contextlib
import datetime as dt
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import threading
import time
from urllib.parse import urlsplit
import uuid
import xml.etree.ElementTree as ET
import zipfile


PACKAGE = "com.ecojust.operatv"
FIXTURE_TITLE = "Opera fixture"
FIXTURE_URL = "http://10.0.2.2:8765/opera-fixture.mp4"
PLAYLIST_URL = "http://10.0.2.2:8765/opera-fixture.m3u"
PAUSED = {"Paused", "已暂停"}


def stamp() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def seconds(value: str) -> int:
    parts = value.strip().split(":")
    require(2 <= len(parts) <= 3 and all(part.isdigit() for part in parts),
            "Invalid visible playback timestamp: " + repr(value))
    require(all(int(part) < 60 for part in parts[1:]), "Invalid time component")
    total = 0
    for part in parts:
        total = total * 60 + int(part)
    return total


def parse_position(value: str) -> tuple[int, int]:
    parts = value.split(" / ")
    require(len(parts) == 2, "Missing visible elapsed / duration text")
    return seconds(parts[0]), seconds(parts[1])


def bounds(node: ET.Element) -> tuple[int, int]:
    match = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", node.get("bounds", ""))
    require(match is not None, "UI element has no valid visible bounds")
    left, top, right, bottom = map(int, match.groups())
    require(right > left and bottom > top, "UI element is not visible")
    require(node.get("enabled") == "true", "UI element is disabled")
    return (left + right) // 2, (top + bottom) // 2


def find(tree: ET.Element, description: str) -> ET.Element | None:
    return next((n for n in tree.iter("node") if n.get("content-desc") == description), None)


def card(tree: ET.Element, description=None, title=None, prefix="card:"):
    return next((n for n in tree.iter("node")
                 if n.get("content-desc", "").startswith(prefix)
                 and (description is None or n.get("content-desc") == description)
                 and (title is None or title in n.get("text", ""))), None)


def locate_tool(name: str) -> str:
    found = shutil.which(name)
    if found:
        return found
    for variable in ("ANDROID_HOME", "ANDROID_SDK_ROOT"):
        sdk = os.environ.get(variable)
        if not sdk:
            continue
        candidates = ([Path(sdk) / "platform-tools" / name] if name == "adb"
                      else sorted((Path(sdk) / "build-tools").glob("*/" + name), reverse=True))
        for candidate in candidates:
            if candidate.is_file():
                return str(candidate)
    raise RuntimeError(name + " is required on this Android CI runner")


class FixtureServer:
    """Expose only the two generated fixture files, including HTTP byte ranges."""

    def __init__(self, folder: Path):
        self.folder = folder
        self.requests = []
        self.lock = threading.Lock()
        owner = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_):
                pass

            def do_HEAD(self):
                self.serve(False)

            def do_GET(self):
                self.serve(True)

            def serve(self, body):
                name = urlsplit(self.path).path.removeprefix("/")
                if name not in {"opera-fixture.mp4", "opera-fixture.m3u"}:
                    self.send_error(404)
                    return
                file = owner.folder / name
                size = file.stat().st_size
                start, end, status = 0, size - 1, 200
                requested = self.headers.get("Range")
                if requested:
                    match = re.fullmatch(r"bytes=(\d*)-(\d*)", requested)
                    if not match or not any(match.groups()):
                        self.send_error(416)
                        return
                    a, b = match.groups()
                    if a:
                        start = int(a)
                        end = min(int(b), size - 1) if b else size - 1
                    else:
                        start = max(0, size - int(b))
                    if start > end or start >= size:
                        self.send_response(416)
                        self.send_header("Content-Range", "bytes */" + str(size))
                        self.end_headers()
                        return
                    status = 206
                self.send_response(status)
                self.send_header("Content-Type", "video/mp4" if name.endswith(".mp4") else "application/x-mpegURL")
                self.send_header("Content-Length", str(end - start + 1))
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Cache-Control", "no-store")
                if status == 206:
                    self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
                self.end_headers()
                sent = 0
                try:
                    if body:
                        with file.open("rb") as source:
                            source.seek(start)
                            remaining = end - start + 1
                            while remaining:
                                block = source.read(min(65536, remaining))
                                if not block:
                                    break
                                self.wfile.write(block)
                                remaining -= len(block)
                                sent += len(block)
                except (BrokenPipeError, ConnectionResetError):
                    pass  # MediaPlayer may cancel a range when seeking or closing.
                finally:
                    with owner.lock:
                        if len(owner.requests) < 1000:
                            owner.requests.append({"at": stamp(), "method": self.command,
                                                   "path": "/" + name, "range": requested,
                                                   "status": status, "bodyBytes": sent})

        self.server = ThreadingHTTPServer(("127.0.0.1", 8765), Handler)
        self.server.daemon_threads = True
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)

    def start(self):
        self.thread.start()

    def close(self):
        if self.thread.is_alive():
            self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=5)


class Smoke:
    def __init__(self, apk: Path, output: Path, serial: str):
        require(re.fullmatch(r"emulator-\d+", serial), "Only an explicit emulator serial is accepted")
        require(apk.is_file(), "Signed APK is missing")
        require(not output.exists() or not any(output.iterdir()), "Evidence output must be empty; previous failures must not be overwritten")
        output.mkdir(parents=True, exist_ok=True)
        self.apk, self.output, self.serial = apk.resolve(), output.resolve(), serial
        self.adb = locate_tool("adb")
        self.commands, self.counter = [], 0
        self.user = None
        self.install_attempted = False
        self.remote_xml = "/sdcard/Download/opera-smoke-" + uuid.uuid4().hex + ".xml"
        self.report = {"schemaVersion": 1, "startedAt": stamp(), "status": "failed", "serial": serial,
                       "packageName": PACKAGE, "apkSha256": hashlib.sha256(apk.read_bytes()).hexdigest(),
                       "stages": [], "publicPlayback": {"status": "not-run"},
                       "physicalTvTested": False, "audioAudibilityVerified": False,
                       "screenshotVisualReviewPerformed": False, "fixtureMedia": "generated H264/AAC color-pattern video, not opera content"}

    def command(self, args, timeout=25, check=True):
        started = time.monotonic()
        try:
            result = subprocess.run([str(x) for x in args], capture_output=True, timeout=timeout)
        except subprocess.TimeoutExpired as failure:
            self.commands.append({"args": [str(x) for x in args], "timeoutSeconds": timeout,
                                  "error": "command timed out"})
            raise RuntimeError("Command timed out: " + " ".join(map(str, args))) from failure
        self.commands.append({"args": [str(x) for x in args], "exitCode": result.returncode,
                              "seconds": round(time.monotonic() - started, 3),
                              "stdout": result.stdout.decode("utf-8", "replace")[:6000] if not result.stdout.startswith(b"\x89PNG") else "[PNG; saved separately]",
                              "stderr": result.stderr.decode("utf-8", "replace")[:6000]})
        if check and result.returncode:
            raise RuntimeError("Command failed: " + " ".join(map(str, args)) + "\n" + result.stderr.decode("utf-8", "replace")[-2000:])
        return result

    def adb_run(self, *args, **kwargs):
        return self.command([self.adb, "-s", self.serial, *args], **kwargs)

    def shell(self, *args, **kwargs):
        return self.adb_run("shell", *args, **kwargs).stdout.decode("utf-8", "replace")

    def key(self, code):
        self.shell("input", "keyevent", code)

    def tap(self, node):
        x, y = bounds(node)
        self.shell("input", "tap", str(x), str(y))

    def dump(self):
        last = ""
        for _ in range(3):
            result = self.adb_run("shell", "uiautomator", "dump", "--compressed", self.remote_xml, timeout=18, check=False)
            last = (result.stdout + result.stderr).decode("utf-8", "replace")
            if result.returncode or "ERROR:" in last:
                time.sleep(0.4)
                continue
            raw = self.adb_run("exec-out", "cat", self.remote_xml, timeout=10, check=False).stdout
            try:
                tree = ET.fromstring(raw)
            except ET.ParseError:
                last = raw.decode("utf-8", "replace")[:300]
                continue
            self.counter += 1
            (self.output / "ui").mkdir(exist_ok=True)
            (self.output / "ui" / f"{self.counter:03}.xml").write_bytes(raw)
            return tree
        raise RuntimeError("Could not capture UI hierarchy: " + last)

    def dismiss_legacy_warning(self, tree):
        text = " ".join(n.get("text", "") for n in tree.iter("node"))
        known = ("built for an older version of android" in text.lower()
                 or ("Android" in text and any(s in text for s in ("旧版", "较旧版本"))))
        button = next((n for n in tree.iter("node") if n.get("package") == "android"
                       and n.get("resource-id") == "android:id/button1"
                       and n.get("text", "").strip() in {"OK", "确定", "好"}), None)
        if known and button is not None:
            self.report.setdefault("legacyTargetWarnings", []).append({"text": text, "at": stamp()})
            self.tap(button)
            return True
        return False

    def wait(self, predicate, description, timeout=30):
        deadline = time.monotonic() + timeout
        last_text = ""
        while time.monotonic() < deadline:
            tree = self.dump()
            if self.dismiss_legacy_warning(tree):
                continue
            found = predicate(tree)
            if found is not None and found is not False:
                return found
            last_text = " | ".join(n.get("text", "") for n in tree.iter("node") if n.get("text"))
            time.sleep(0.4)
        raise RuntimeError("Timed out waiting for " + description + ": " + last_text[:2000])

    def click(self, description):
        self.tap(self.wait(lambda t: find(t, description), description))

    def screenshot(self, name):
        data = self.adb_run("exec-out", "screencap", "-p", timeout=20).stdout
        require(data.startswith(b"\x89PNG\r\n\x1a\n"), "Android screenshot was not a PNG")
        (self.output / (name + ".png")).write_bytes(data)

    def foreground(self, activity):
        text = self.shell("dumpsys", "activity", "activities")
        self.counter += 1
        (self.output / f"activity-{self.counter:03}.txt").write_text(text)
        rows = [line.strip() for line in text.splitlines()
                if re.search(r"\b(?:topResumedActivity|mResumedActivity|ResumedActivity)\s*[=:]", line)]
        expected = PACKAGE + "/."
        require(any(f"u{self.user} " in row and (expected + activity in row or PACKAGE + "/" + PACKAGE + "." + activity in row) for row in rows),
                "Expected app activity is not resumed: " + str(rows))
        return rows

    def current_package_present(self):
        text = self.shell("pm", "list", "packages", "--user", self.user, PACKAGE)
        return ("package:" + PACKAGE) in text.splitlines()

    @contextlib.contextmanager
    def stage(self, name):
        row = {"name": name, "startedAt": stamp(), "status": "running"}
        self.report["stages"].append(row)
        start = time.monotonic()
        try:
            yield row
            row["status"] = "passed"
        except Exception as failure:
            row.update(status="failed", error=str(failure))
            raise
        finally:
            row["durationSeconds"] = round(time.monotonic() - start, 3)
            print(json.dumps(row, ensure_ascii=False), flush=True)

    def start(self):
        result = self.shell("am", "start", "--user", self.user, "-W", "-n", PACKAGE + "/.MainActivity")
        require("Error:" not in result and "Exception" not in result, result)
        self.wait(lambda t: find(t, "nav-mine"), "main navigation")
        self.foreground("MainActivity")

    def sample_paused(self, minimum=0, timeout=35, play_first=True, max_attempts=8):
        """Pause with a real media key before UI inspection to avoid idle races.

        The displayed times come from MediaPlayer. No seek or state injection is
        used; the test observes actual progress after ordinary playback.
        """
        deadline = time.monotonic() + timeout
        last = ""
        attempts = 0
        while time.monotonic() < deadline and attempts < max_attempts:
            attempts += 1
            if play_first:
                self.key("KEYCODE_MEDIA_PLAY")
                time.sleep(3.2)
            self.key("KEYCODE_MEDIA_PAUSE")
            self.key("KEYCODE_DPAD_UP")
            time.sleep(0.6)
            tree = self.dump()
            state, position = find(tree, "player-status"), find(tree, "player-position")
            last = " | ".join(n.get("text", "") for n in tree.iter("node") if n.get("text"))
            if find(tree, "player-retry") is not None:
                raise RuntimeError("Player reported a playback error: " + last[:1800])
            if state is not None and position is not None and state.get("text") in PAUSED:
                try:
                    at, duration = parse_position(position.get("text", ""))
                except RuntimeError:
                    at, duration = -1, -1
                if at >= minimum and duration > at:
                    return {"positionSeconds": at, "durationSeconds": duration,
                            "visibleStatus": state.get("text"), "observedAt": stamp(),
                            "foreground": self.foreground("PlaybackActivity")}
            require(play_first, "Paused player sample unavailable: " + last[:1800])
        raise RuntimeError("Media clock did not reach the required position: " + last[:1800])

    def capture_final_evidence(self):
        failures = []
        for filename, args in [("logcat-crash.txt", ["logcat", "-d", "-b", "crash", "-v", "threadtime"]),
                               ("logcat-main-system.txt", ["logcat", "-d", "-b", "main", "-b", "system", "-v", "threadtime"]),
                               ("exit-info.txt", ["shell", "dumpsys", "activity", "exit-info", PACKAGE])]:
            try:
                result = self.adb_run(*args, timeout=30, check=False)
                (self.output / filename).write_bytes(result.stdout)
                if result.stderr:
                    (self.output / (filename + ".stderr")).write_bytes(result.stderr)
                if result.returncode:
                    failures.append({"file": filename, "exitCode": result.returncode})
            except Exception as error:
                failures.append({"file": filename, "error": str(error)})
        try:
            self.screenshot("final-android")
        except Exception as error:
            failures.append({"file": "final-android.png", "error": str(error)})
        self.report["evidenceCollectionErrors"] = failures

    def run(self):
        server = None
        temporary = tempfile.TemporaryDirectory(prefix="opera-smoke-media-")
        try:
            with self.stage("Check explicit clean emulator and APK identity") as row:
                require(self.adb_run("get-state").stdout.strip() == b"device", "Emulator is not online")
                require(self.shell("getprop", "ro.kernel.qemu").strip() == "1", "Target is not an Android emulator")
                self.user = self.shell("am", "get-current-user").strip()
                require(re.fullmatch(r"\d+", self.user), "Current Android user is not numeric")
                require("RUNNING_UNLOCKED" in self.shell("am", "get-started-user-state", self.user), "Android user is locked")
                present = self.shell("dumpsys", "package", PACKAGE)
                require(not re.search(r"Package\s+\[" + re.escape(PACKAGE) + r"\]", present), "Refusing to overwrite a pre-existing Opera TV package for any user")
                require(not self.current_package_present(), "Opera TV is already installed")
                badging = self.command([locate_tool("aapt"), "dump", "badging", self.apk]).stdout.decode("utf-8", "replace")
                require(re.search(r"^package: name='" + re.escape(PACKAGE) + "'", badging, re.M), "APK package identity mismatch")
                with zipfile.ZipFile(self.apk) as package:
                    require(not any(n.lower().endswith(".so") for n in package.namelist()), "Unexpected bundled native library")
                (self.output / "apk-badging.txt").write_text(badging)
                properties = {name: self.shell("getprop", name).strip() for name in
                              ("ro.build.version.sdk", "ro.build.fingerprint", "ro.product.cpu.abilist", "ro.product.cpu.abilist32", "ro.product.cpu.abilist64", "ro.build.characteristics")}
                self.report.update(currentUser=self.user, deviceProperties=properties)
                row.update(currentUser=self.user, deviceProperties=properties)

            with self.stage("Generate local H264/AAC media and serve bounded fixture") as row:
                folder = Path(temporary.name)
                self.command(["ffmpeg", "-hide_banner", "-nostdin", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=20",
                              "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000", "-t", "40", "-c:v", "libx264", "-threads", "2",
                              "-preset", "ultrafast", "-profile:v", "baseline", "-level", "3.0", "-pix_fmt", "yuv420p", "-b:v", "500k",
                              "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", folder / "opera-fixture.mp4"], timeout=55)
                (folder / "opera-fixture.m3u").write_text('#EXTM3U\n#EXTINF:-1 group-title="Smoke fixture",' + FIXTURE_TITLE + "\n" + FIXTURE_URL + "\n")
                server = FixtureServer(folder)
                server.start()
                row.update(videoSha256=hashlib.sha256((folder / "opera-fixture.mp4").read_bytes()).hexdigest(),
                           bytes=(folder / "opera-fixture.mp4").stat().st_size, durationSeconds=40,
                           videoCodec="H264 baseline", audioCodec="AAC", playlistUrl=PLAYLIST_URL)

            with self.stage("Install original signed APK for the current user and open main UI"):
                require(self.shell("am", "get-current-user").strip() == self.user, "Android user changed before installation")
                self.install_attempted = True
                result = self.adb_run("install", "--user", self.user, str(self.apk), timeout=120)
                require("Success" in result.stdout.decode("utf-8", "replace"), "Install did not report success")
                require(self.current_package_present(), "Installed package not present for the selected user")
                self.start()
                self.screenshot("01-main")

            with self.stage("Import generated playlist through the visible UI") as row:
                self.click("nav-mine")
                self.click("import-menu")
                self.click("import-playlist")
                self.click("import-url")
                self.shell("input", "text", PLAYLIST_URL)
                self.wait(lambda t: (n if (n := find(t, "import-url")) is not None and n.get("text") == PLAYLIST_URL else None), "entered playlist URL")
                ime = self.shell("dumpsys", "input_method")
                if re.search(r"(?:mInputShown|mIsInputViewShown)=true\b", ime):
                    self.key("KEYCODE_BACK")
                self.click("import-confirm")
                item = self.wait(lambda t: card(t, title=FIXTURE_TITLE), "imported fixture card")
                fixture_card = item.get("content-desc")
                row["cardDescription"] = fixture_card
                self.screenshot("02-imported")

            with self.stage("Save favorite and open the imported video"):
                self.tap(self.wait(lambda t: card(t, description=fixture_card), "fixture card"))
                self.click("detail-favorite")
                self.click("nav-favorites")
                self.tap(self.wait(lambda t: card(t, description=fixture_card), "favorite fixture card"))
                self.click("detail-play")
                # PlaybackActivity receives only the ordinary detail button's Intent.
                time.sleep(0.8)

            with self.stage("Observe genuine local playback and pause") as row:
                first = self.sample_paused(minimum=2)
                require(38 <= first["durationSeconds"] <= 42, "Playing an unexpected media duration")
                row["sample"] = first
                self.screenshot("03-fixture-paused")

            with self.stage("Confirm pause keeps the media clock still") as row:
                time.sleep(3.2)
                paused = self.sample_paused(play_first=False)
                require(abs(paused["positionSeconds"] - first["positionSeconds"]) <= 1, "Paused media continued advancing")
                row.update(before=first, after=paused)

            with self.stage("Resume and verify the real media clock advances") as row:
                continued = self.sample_paused(minimum=max(10, paused["positionSeconds"] + 2))
                row.update(before=paused, after=continued)
                require(continued["positionSeconds"] >= 10, "Insufficient progress for an unambiguous restart-resume test")
                self.screenshot("04-fixture-resumed")

            with self.stage("Restart application and resume saved favorite") as row:
                saved = continued["positionSeconds"]
                self.key("KEYCODE_BACK")
                self.wait(lambda t: find(t, "nav-favorites"), "main UI after player exit")
                self.foreground("MainActivity")
                self.shell("am", "force-stop", "--user", self.user, PACKAGE)
                self.start()
                self.click("nav-favorites")
                self.tap(self.wait(lambda t: card(t, description=fixture_card), "favorite persisted across process restart"))
                play = self.wait(lambda t: find(t, "detail-play"), "continue button")
                require(play.get("text") in {"继续播放", "Continue watching"}, "Saved progress is not offered in the UI")
                self.tap(play)
                # Observe within a short, fixed playback window. A full restart at
                # zero must not be allowed to catch up to the saved position.
                resumed = self.sample_paused(minimum=0, timeout=18, max_attempts=1)
                require(saved - 1 <= resumed["positionSeconds"] <= saved + 8,
                        f"Saved progress was not restored: saved={saved}, observed={resumed}")
                row.update(savedPositionSeconds=saved, restartedSample=resumed)
                self.screenshot("05-persisted-resume")

            requests = list(server.requests)
            require(any(r["path"].endswith(".m3u") and r["bodyBytes"] > 0 for r in requests), "App never fetched the fixture playlist")
            require(any(r["path"].endswith(".mp4") and r["bodyBytes"] > 1000 for r in requests), "App never fetched media bytes")
            self.report["corePlayback"] = "passed"

            public = self.report["publicPlayback"] = {"status": "running", "startedAt": stamp(), "source": "first visible public CCTV item; no fixture substitution"}
            try:
                self.key("KEYCODE_BACK")
                self.click("nav-featured")
                def public_card(tree):
                    retry = find(tree, "retry")
                    if retry is not None:
                        raise RuntimeError("Public catalog failed: " + " | ".join(n.get("text", "") for n in tree.iter("node") if n.get("text")))
                    return card(tree, prefix="card:cctv:")
                item = self.wait(public_card, "first public CCTV card", timeout=45)
                public.update(cardDescription=item.get("content-desc"), title=item.get("text"))
                self.tap(item)
                self.click("detail-play")
                result = self.sample_paused(minimum=2, timeout=50)
                public.update(status="passed", sample=result)
                self.screenshot("06-public-paused")
            except Exception as error:
                public.update(status="failed", error=str(error))
            public["finishedAt"] = stamp()
            self.report["status"] = "passed" if public["status"] == "passed" else "partial"
        except Exception as error:
            self.report.update(status="failed", error=str(error))
        finally:
            if self.install_attempted:
                self.capture_final_evidence()
                try:
                    require(self.shell("am", "get-current-user").strip() == self.user, "User changed; refusing cleanup against a different user")
                    if self.current_package_present():
                        result = self.shell("pm", "uninstall", "--user", self.user, PACKAGE)
                        require("Success" in result and not self.current_package_present(), "Owned test package cleanup failed")
                    self.shell("rm", "-f", self.remote_xml)
                    self.report["cleanup"] = {"status": "passed", "scope": "only this run's package/current user and UI XML; emulator left running"}
                except Exception as error:
                    self.report.update(status="failed", cleanup={"status": "failed", "error": str(error)})
            if server:
                server.close()
                self.report["fixtureHttpRequests"] = server.requests
            temporary.cleanup()
            self.report["finishedAt"] = stamp()
            (self.output / "commands.json").write_text(json.dumps(self.commands, ensure_ascii=False, indent=2) + "\n")
            (self.output / "report.json").write_text(json.dumps(self.report, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps({"status": self.report["status"], "corePlayback": self.report.get("corePlayback", "failed"),
                          "publicPlayback": self.report["publicPlayback"], "report": str(self.output / "report.json")}, ensure_ascii=False), flush=True)
        return 0 if self.report["status"] in {"passed", "partial"} else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apk", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--serial", required=True)
    args = parser.parse_args()
    return Smoke(args.apk, args.output, args.serial).run()


if __name__ == "__main__":
    raise SystemExit(main())
