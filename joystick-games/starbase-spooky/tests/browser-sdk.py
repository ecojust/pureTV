"""Exercise the offline TV build through the public Python TCP controller SDK.

Requires Python Playwright and a local Chromium. Only the native host layer is
replaced, using a loopback TCP receiver and a read-only browser snapshot bridge.
The test sends real button events and uses the on-screen wire labels to solve
the shuffled puzzle. It does not write the simulation or save state.
"""

import argparse
import functools
import http.server
import json
import pathlib
import shutil
import socketserver
import sys
import tempfile
import threading
import time

from playwright.sync_api import sync_playwright

GAME = pathlib.Path(__file__).resolve().parents[1]
cli = argparse.ArgumentParser(description=__doc__)
cli.add_argument(
    "--output",
    type=pathlib.Path,
    help="directory for captured PNGs and report (default: a fresh temporary directory)",
)
cli.add_argument(
    "--chromium",
    default=shutil.which("chromium"),
    help="path to the Chromium executable",
)
args = cli.parse_args()
sys.path.insert(0, str(GAME.parents[1] / "puretv-joystick"))
from joystick_sdk import KEYS, JoystickClient

lock = threading.Lock()
state = {"players": []}
wire = []
serial = 0


class Bridge(socketserver.StreamRequestHandler):
    def handle(self):
        global serial
        ident = None
        try:
            for line in self.rfile:
                msg = json.loads(line)
                with lock:
                    if msg["type"] == "hello":
                        serial += 1
                        ident = msg["controller_id"]
                        state["players"] = [
                            {
                                "id": 1,
                                "controllerId": ident,
                                "session": str(serial),
                                "connected": True,
                                "transport": "wifi",
                                "buttons": dict.fromkeys(KEYS, False),
                            }
                        ]
                    elif msg["type"] == "button":
                        state["players"][0]["buttons"][msg["key"]] = msg["pressed"]
                    wire.append((serial, msg["seq"], msg["type"]))
                self.wfile.write(
                    (json.dumps(dict(type="ack", seq=msg["seq"])) + "\n").encode()
                )
        finally:
            with lock:
                if state["players"] and state["players"][0]["controllerId"] == ident:
                    state["players"] = []


class Site(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        if self.path != "/input":
            return super().do_GET()
        with lock:
            out = json.dumps(state).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)


tcp = socketserver.ThreadingTCPServer(("127.0.0.1", 0), Bridge)
tcp.daemon_threads = True
web = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0), functools.partial(Site, directory=str(GAME / "dist"))
)
for server in (tcp, web):
    threading.Thread(target=server.serve_forever, daemon=True).start()
sdk = JoystickClient("127.0.0.1", tcp.server_address[1])
sdk.connect()
out = args.output or pathlib.Path(tempfile.mkdtemp(prefix="starbase-spooky-"))
out.mkdir(parents=True, exist_ok=True)
print("Evidence directory:", out, flush=True)
results = []
with sync_playwright() as pw:
    browser = pw.chromium.launch(
        executable_path=args.chromium,
        headless=True,
        args=[
            "--no-sandbox",
            "--autoplay-policy=no-user-gesture-required",
            "--disable-dev-shm-usage",
        ],
    )
    for width, height in ((960, 540), (1280, 720)):
        page = browser.new_page(viewport={"width": width, "height": height})
        errors = []
        external = []
        init = """(()=>{let last='{"players":[]}';window.PureGameHost={getInfo:()=>JSON.stringify({wifiController:{port:PORT,serviceName:'Starbase Spooky',addresses:['127.0.0.1'],state:'listening'}}),snapshot:()=>last};async function read(){const r=await fetch('/input');last=await r.text();setTimeout(read,20)}read()})();""".replace(
            "PORT", str(tcp.server_address[1])
        )
        page.add_init_script(init)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on(
            "request",
            lambda r: external.append(r.url)
            if r.url.split("/")[2] != f"127.0.0.1:{web.server_port}"
            else None,
        )
        page.on(
            "response",
            lambda r: errors.append(f"{r.status} {r.url}") if r.status >= 400 else None,
        )
        page.goto(f"http://127.0.0.1:{web.server_port}/tv.html")

        def snap():
            return page.evaluate("JoystickGameQA.snapshot()")

        def game():
            return snap()["gameplay"]

        def wait(pred):
            end = time.monotonic() + 12
            while time.monotonic() < end:
                s = snap()
                if pred(s):
                    return s
                page.wait_for_timeout(40)
            raise AssertionError(("timeout", snap()))

        def tap(k):
            sdk.button(k, "down")
            wait(lambda s: s["controller"]["buttons"][k])
            sdk.button(k, "up")
            wait(lambda s: not s["controller"]["buttons"][k])
            page.wait_for_timeout(50)

        def focus(key):
            for _ in range(18):
                if game()["focus"] == key:
                    return
                tap("DOWN")
            raise AssertionError(("no focus", key, game()))

        def photo(name):
            page.screenshot(path=out / f"{name}-{width}.png")

        page.wait_for_function("window.JoystickGameQA?.snapshot().frames>1")
        wait(
            lambda s: s["stage"] == "menu"
            and s["controller"]["connected"]
            and not s["loading"]
        )
        photo("title")
        # Keyboard activates an original menu before the TCP Wi-Fi controller starts the campaign.
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(60)
        page.keyboard.press("Enter")
        wait(lambda s: s["gameplay"]["screen"] == "howto")
        page.keyboard.press("Escape")
        wait(lambda s: s["gameplay"]["screen"] == "title")
        tap("START")
        assert game()["line"] == "ada.d1"
        photo("briefing")
        for l in ("orby.hello", "orby.break.garden", ""):
            tap("A")
            wait(lambda s: s["gameplay"]["line"] == l)
        tap("X")
        assert game()["map"]
        tap("B")
        assert not game()["map"]
        tap("Y")
        assert game()["screen"] == "notebook"
        tap("B")
        tap("B")
        assert game()["bag"]
        tap("RIGHT")
        tap("B")
        tap("LEFT")
        wait(lambda s: s["gameplay"]["room"] == "garden")
        keys = []
        tap("DOWN")
        keys.append(game()["focus"])
        while game()["focus"] != "spot:panel":
            tap("DOWN")
            keys.append(game()["focus"])
            assert len(keys) < 20
        print("garden focus order", keys, flush=True)
        tap("A")
        wait(lambda s: s["gameplay"]["line"] == "orby.pz.wires")
        tap("A")
        wait(lambda s: s["gameplay"]["puzzle"] == "wires")
        for i in range(4):
            focus("wl" + str(i))
            color = page.locator("#label").inner_text()
            tap("A")
            assert game()["wireSelected"] == i
            if i == 0:
                photo("wires")
                sdk.disconnect()
                paused = wait(
                    lambda s: s["paused"] and not s["controller"]["connected"]
                )
                tick = paused["gameplay"]["tick"]
                page.wait_for_timeout(360)
                assert game()["tick"] == tick
                sdk.connect()
                wait(lambda s: s["paused"] and s["controller"]["connected"])
                tap("START")
                assert not snap()["paused"]
            for j in range(4):
                focus("wr" + str(j))
                if page.locator("#label").inner_text().split()[0] == color.split()[0]:
                    tap("A")
                    break
            else:
                raise AssertionError(color)
        wait(lambda s: "garden" in s["gameplay"]["solved"])
        for _ in range(12):
            if not game()["line"]:
                break
            tap("A")
        assert not game()["line"]
        focus("spot:goo")
        tap("A")
        wait(lambda s: s["gameplay"]["line"] == "orby.clue.goo")
        tap("A")
        wait(lambda s: "goo" in s["gameplay"]["clues"])
        photo("clue")
        tap("START")
        photo("pause")
        assert snap()["paused"]
        tap("START")
        assert not snap()["paused"]
        # Normal save + restart the page and choose Continue using the same controller.
        tap("START")
        page.reload()
        wait(
            lambda s: s["stage"] == "menu" and s["gameplay"]["menuFocus"] == "continue"
        )
        tap("A")
        wait(
            lambda s: "goo" in s["gameplay"]["clues"]
            and "garden" in s["gameplay"]["solved"]
        )
        assert not errors and not external, (errors, external)
        results.append(
            {
                "width": width,
                "height": height,
                "gardenFocusPath": keys,
                "room": game()["room"],
                "solved": game()["solved"],
                "clues": game()["clues"],
                "sdkDisconnectPaused": True,
                "saveSurvivedReload": True,
                "errors": errors,
                "externalRequests": external,
            }
        )
        print(results[-1], flush=True)
        page.close()
    browser.close()
sdk.disconnect()
tcp.shutdown()
web.shutdown()
(out / "report.json").write_text(
    json.dumps(
        {
            "scope": "Chromium, loopback original Python SDK and in-process browser host fixture",
            "nativeHostTested": False,
            "physicalControllerTested": False,
            "results": results,
            "wireMessages": len(wire),
        },
        indent=2,
    )
    + "\n"
)
