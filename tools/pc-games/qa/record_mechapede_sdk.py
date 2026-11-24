"""Record actual Mechapede play through the signed APK host. Prints the capture receipt to stdout."""

from pathlib import Path
from urllib.parse import urlsplit
import json
import shutil
import sys
import subprocess
import tempfile
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(root / "tools/pc-games/qa"))
from signed_apk_plans import desktop, pad, press, wait, qa, digest  # noqa: E402 - repository-local host harness

sys.path.insert(0, str(root / "joystick-games/gogh-strike/tests"))
from recording import Recording  # noqa: E402 - frame capture helper

slug = "mechapede"
d = root / "joystick-games" / slug
apk = d / "mechapede-0.1.0.apk"
manifest = json.loads((d / "packages.json").read_text())["android"]
assert digest(apk) == manifest["sha256"]
output = d / "docs/browser/gameplay.mp4"
with tempfile.TemporaryDirectory() as scratch, sync_playwright() as pw, desktop(slug, apk) as (url, tcp):
    b = pw.chromium.launch(
        executable_path=shutil.which("chromium"), args=["--no-sandbox", "--disable-dev-shm-usage"]
    )
    pg = b.new_page(viewport={"width": 960, "height": 540})
    local = urlsplit(url).netloc
    errors = []
    external = []

    def route(r):
        target = urlsplit(r.request.url)
        if target.netloc == local or target.scheme in ["blob", "data"]:
            r.continue_()
        else:
            external.append(r.request.url)
            r.abort()

    pg.route("**/*", route)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("response", lambda r: errors.append(f"{r.status} {r.url}") if r.status >= 400 else None)
    pg.goto(url, wait_until="domcontentloaded")
    wait(pg, "menu", lambda s: s["stage"] == "menu")
    with pad(tcp) as client:
        wait(
            pg,
            "controller",
            lambda s: s["controller"]["connected"] and s["controller"]["transport"] == "wifi",
        )
        plan = qa.load_plan(d / "qa-plan.json")
        press(pg, client, plan["steps"][0])

        def read():
            s = pg.evaluate("JoystickGameQA.snapshot()")
            return {
                "stage": s["stage"],
                **{
                    key: s["gameplay"].get(key)
                    for key in ["frame", "playerX", "playerY", "shots", "score", "lives"]
                    if key in s["gameplay"]
                },
            }

        record = Recording(pg, Path(scratch) / "session.webm")
        observations = [{"input": "START", **read()}]
        for direction in ["RIGHT", "LEFT", "UP", "RIGHT", "DOWN", "LEFT", "RIGHT", "UP"]:
            before = read()
            assert before["stage"] == "playing", before
            client.button(direction, "down")
            wait(pg, f"{direction} held", lambda s: s["controller"]["buttons"][direction])
            for _ in range(2):
                client.button("A", "down")
                pg.wait_for_timeout(210)
                client.button("A", "up")
                pg.wait_for_timeout(180)
            client.button(direction, "up")
            wait(pg, f"{direction} released", lambda s: not s["controller"]["buttons"][direction])
            observations.append({"input": direction + " + A twice", **read()})
        assert observations[-1]["shots"] > observations[0]["shots"]
        assert any(o["playerX"] != observations[0]["playerX"] for o in observations)
        record.finish()
        assert not errors and not external, (errors, external)
        subprocess.run(
            [
                "ffmpeg",
                "-v",
                "error",
                "-y",
                "-i",
                str(Path(scratch) / "session.webm"),
                "-an",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                "21",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                str(output),
            ],
            check=True,
        )
        video = json.loads(
            subprocess.check_output(
                [
                    "ffprobe",
                    "-v",
                    "error",
                    "-show_entries",
                    "stream=codec_name,width,height,avg_frame_rate:format=duration,size",
                    "-of",
                    "json",
                    str(output),
                ]
            )
        )
        print(
            json.dumps(
                {
                    "apk": apk.relative_to(root).as_posix(),
                    "apkSha256": digest(apk),
                    "videoSha256": digest(output),
                    "video": video,
                    "browser": b.version,
                    "renderer": pg.evaluate("JoystickGameQA.snapshot().renderer"),
                    "environment": "Linux Chromium, PC player host.py opening the signed APK, official JoystickClient TCP over loopback",
                    "viewport": [960, 540],
                    "audio": False,
                    "observations": observations,
                    "pageErrors": errors,
                    "externalRequests": external,
                },
                indent=2,
            )
        )
    b.close()
