"""Chromium regression. Run after npm run build. Optional argument: screenshot directory."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import shutil
import sys
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = Path(sys.argv[1]) if len(sys.argv) > 1 else None
snapshot = "window.JoystickGameQA.snapshot()"


def check(page, expression):
    page.wait_for_function("() => " + expression, polling=150, timeout=180_000)


def capture(page, name):
    if SCREENSHOTS:
        SCREENSHOTS.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SCREENSHOTS / (name + ".jpg")), type="jpeg", timeout=120_000)


def native_button(page, source, name, condition):
    set_button(page, source, name, True)
    check(page, condition)
    set_button(page, source, name, False)
    check(page, f"!{snapshot}.controller.buttons.{name}")


def set_button(page, source, name, held):
    page.evaluate("""([source, key, held]) => {
        const player = window.testSeat;
        if (source === 'wifi') player.buttons[key] = held;
        else if (key === 'UP') player.y = held ? -1 : 0;
        else player[({ START:'start', A:'a', B:'b', X:'buttonX', Y:'buttonY' })[key]] = held;
    }""", [source, name, held])


def play(browser, url, width, height, source):
    page = browser.new_page(viewport={"width": width, "height": height})
    page.set_default_timeout(180_000)
    errors = []
    def on_error(error):
        print(str(error), file=sys.stderr, flush=True)
        errors.append(str(error))
    page.on("pageerror", on_error)
    # Only feed external controller state, never mutate the simulation.
    page.add_init_script("""window.testSeat = null;
        window.PureGameHost = {
            snapshot: () => JSON.stringify({players: window.testSeat ? [window.testSeat] : []}),
            getInfo: () => JSON.stringify({url:'http://127.0.0.1/test', wifiController:{port:63485}}),
        }""")
    page.goto(url, wait_until="commit", timeout=30_000)
    check(page, "window.JoystickGameQA && " + snapshot + ".stage === 'menu'")
    print(f'{source} menu ready', file=sys.stderr, flush=True)
    original = page.evaluate("document.getElementById('c').getBoundingClientRect().toJSON()")
    capture(page, f"{width}-menu")
    if source == "keyboard":
        page.keyboard.press("Enter")
        check(page, snapshot + ".stage === 'playing'")
        page.keyboard.down("ArrowRight")
        check(page, snapshot + ".gameplay.yaw < -0.01")
        page.keyboard.up("ArrowRight")
        page.keyboard.down("w")
        point = page.evaluate(snapshot + ".gameplay.position")
        check(page, f"JSON.stringify({snapshot}.gameplay.position) !== JSON.stringify({json.dumps(point)})")
        page.keyboard.up("w")
        page.keyboard.press("z")
        check(page, snapshot + ".gameplay.shots > 0")
        page.keyboard.press("p")
    else:
        player = {"connected": True, "id": 1, "transport": source, "x": 0, "y": 0,
                  "buttons": {}, "session": "test", "controllerId": "fixture-01"}
        page.evaluate("seat => { window.testSeat = seat }", player)
        check(page, snapshot + ".controller.connected")
        native_button(page, source, "START", snapshot + ".stage === 'playing'")
        native_button(page, source, "UP", snapshot + ".gameplay.position[2] < " + str(page.evaluate(snapshot + ".gameplay.position[2]")))
        native_button(page, source, "B", snapshot + ".gameplay.aiming === true")
        native_button(page, source, "A", snapshot + ".gameplay.shots > 0")
        native_button(page, source, "Y", snapshot + ".gameplay.weapon === 1")
        capture(page, f"{width}-{source}-playing")
        set_button(page, source, "A", True)
        page.evaluate("window.testSeat = null")
    check(page, snapshot + ".paused")
    frozen = page.evaluate(snapshot + ".gameplay")
    page.wait_for_timeout(250)
    assert page.evaluate(snapshot + ".gameplay") == frozen
    assert page.evaluate("document.getElementById('c').getBoundingClientRect().toJSON()") == original
    if source != "keyboard":
        # Reconnect with fire already held. Resume requires START, and a
        # stale fire edge must not be delivered when the controller returns.
        player["buttons"]["A"] = True
        player["a"] = True
        page.evaluate("seat => { window.testSeat = seat }", player)
        check(page, snapshot + ".controller.connected")
        assert page.evaluate(snapshot + ".paused")
        native_button(page, source, "START", snapshot + ".stage === 'playing'")
        assert page.evaluate(snapshot + ".gameplay.shots") == frozen["shots"]
    else:
        page.keyboard.press("Enter")
        check(page, snapshot + ".stage === 'playing'")
    assert not errors, errors
    assert page.evaluate("document.querySelector('#err').textContent") == ""
    result = {"viewport": [width, height], "input": source,
              "renderer": page.evaluate(snapshot + ".renderer"),
              "canvas": original, "observedShots": frozen["shots"]}
    print(json.dumps(result), flush=True)
    page.close()


with ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=ROOT / "dist")) as server, sync_playwright() as playwright:
    Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/tv.html"
    browser = playwright.chromium.launch(executable_path=shutil.which("chromium"), headless=True,
        env={**os.environ, "LIBGL_ALWAYS_SOFTWARE": "1"},
        args=["--no-sandbox", "--disable-accelerated-2d-canvas", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=gl-egl"])
    try:
        for case in [(960, 540, "keyboard"), (960, 540, "phone"), (1280, 720, "wifi")]:
            play(browser, url, *case)
    finally:
        browser.close()
