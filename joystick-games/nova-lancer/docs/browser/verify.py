"""Exercise the game in Chromium with its original keyboard or a pureTV TCP controller."""
import argparse
import hashlib
import json
from pathlib import Path
import socket
import time
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright


KEYS = {"START": "KeyP", "A": "KeyJ", "B": "KeyK", "RIGHT": "ArrowRight", "X": "KeyL", "Y": "KeyI"}
STATE = "window.JoystickGameQA?.snapshot()"


class Pad:
    def __init__(self, hostname, port):
        self.connection = socket.create_connection((hostname, port), timeout=10)
        self.replies = self.connection.makefile("rb")
        self.seq = 0
        self.send(type="hello")

    def send(self, **fields):
        self.seq += 1
        message = dict(fields, controller_id="nova-flight-qa", seq=self.seq)
        self.connection.sendall(json.dumps(message).encode() + b"\n")
        reply = json.loads(self.replies.readline())
        if reply != {"type": "ack", "seq": self.seq}:
            raise AssertionError(reply)

    def close(self):
        self.replies.close()
        self.connection.close()


def verify(page, args):
    failures, requests = [], []
    page.on("request", lambda req: requests.append(req.url))
    page.on("pageerror", lambda exc: failures.append(str(exc)))
    page.goto(args.url + "/tv.html", wait_until="domcontentloaded", timeout=120000)

    def wait(condition):
        page.wait_for_function(f"() => {{ const s={STATE}; return s && ({condition}); }}",
                               timeout=180000, polling=250)

    def snap():
        return page.evaluate(STATE)

    def screenshot(phase):
        page.screenshot(path=args.output / f"{args.mode}-{phase}.jpg",
                        type="jpeg", quality=85, timeout=60000)

    wait('s.ready && s.stage==="menu"')
    screenshot("menu")
    pad = Pad(urlsplit(args.url).hostname, args.controller_port) if args.mode == "wifi" else None

    def button(key, pressed):
        if pad:
            pad.send(type="button", key=key, action="down" if pressed else "tap", pressed=pressed)
        else:
            (page.keyboard.down if pressed else page.keyboard.up)(KEYS[key])

    def hold_until(key, condition):
        button(key, True)
        try:
            wait(condition)
        finally:
            button(key, False)
        if pad:
            wait(f"s.controller.buttons[{json.dumps(key)}]===false")
        page.wait_for_timeout(100)

    try:
        if pad:
            wait('s.controller.connected && s.controller.transport==="wifi"')
        hold_until("START", 's.stage==="playing"')
        wait("s.gameplay.controllable")
        before = snap()["gameplay"]
        hold_until("RIGHT", f's.gameplay.x>{before["x"] + 2}')
        hold_until("A", f's.gameplay.shots>{before["shots"]}')
        hold_until("B", f's.gameplay.bombs<{before["bombs"]}')
        hold_until("X", "s.gameplay.boost")
        hold_until("Y", "s.gameplay.brake")
        after = snap()
        layout = page.evaluate("""() => {
            const hud = document.querySelector('.hud-tr').getBoundingClientRect();
            const card = document.querySelector('#puretv-controller-panel').getBoundingClientRect();
            return {scoreBottom:hud.bottom, cardTop:card.top, clear:card.top>=hud.bottom};
        }""")
        assert layout["clear"], layout
        screenshot("flight")
        hold_until("START", 's.stage==="paused"')
        paused = snap()["gameplay"]["distance"]
        page.wait_for_timeout(500)
        assert snap()["gameplay"]["distance"] == paused
        button("START", True)
        try:
            wait('s.stage==="playing"')
            first = snap()["controller"]["pollCount"]
            started = time.monotonic()
            deadline = started + 45
            while True:
                sample = snap()
                assert sample["stage"] == "playing", "A held resume press triggered another pause"
                frames = sample["controller"]["pollCount"] - first
                duration = time.monotonic() - started
                if frames >= 4 and duration >= 0.6:
                    break
                assert time.monotonic() < deadline, "No frames while holding resume"
                page.wait_for_timeout(60)
        finally:
            button("START", False)
        if pad:
            wait('s.controller.buttons.START===false')
        hold_until("START", 's.stage==="paused"')
        hold_until("START", 's.stage==="playing"')
    finally:
        if pad:
            pad.close()

    assert not failures, failures
    assert all(u.startswith((args.url + "/", "data:", "blob:")) for u in requests), requests
    assets = Path(__file__).resolve().parents[2] / "dist"
    report = {
        "game": "nova-lancer", "mode": args.mode, "viewport": page.viewport_size,
        "renderer": after["renderer"], "initialStage": "menu", "webglVersion": after["webglVersion"],
        "wideHUD": layout, "beforeActions": before, "afterActions": after["gameplay"],
        "checks": ["steer", "laser shots increased", "bombs decreased", "boost engaged",
                   "brake engaged", "pause froze distance", "resume"],
        "htmlSha256": hashlib.sha256((assets / "tv.html").read_bytes()).hexdigest(),
        "scriptSha256": hashlib.sha256((assets / "nova-lancer.js").read_bytes()).hexdigest(),
        "heldResume": {"observedFrames": frames, "seconds": round(duration, 3), "newPressPaused": True},
        "pauseStableDistance": paused, "resumed": True, "pageErrors": failures,
        "externalRequests": [], "physicalDeviceTested": False,
    }
    (args.output / (args.mode + ".json")).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=["keyboard", "wifi"])
    parser.add_argument("--url", required=True, help="Loopback origin serving dist (or host.py for Wi-Fi)")
    parser.add_argument("--controller-port", type=int, default=63485)
    parser.add_argument("--chromium", help="Path to system Chromium")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=args.chromium,
                                     args=["--no-sandbox", "--enable-unsafe-swiftshader",
                                           "--use-angle=swiftshader", "--disable-dev-shm-usage",
                                           "--autoplay-policy=no-user-gesture-required"])
        viewport = {"width": 960, "height": 540} if args.mode == "wifi" else {"width": 1280, "height": 720}
        try:
            verify(browser.new_page(viewport=viewport), args)
        finally:
            browser.close()


if __name__ == "__main__":
    main()
