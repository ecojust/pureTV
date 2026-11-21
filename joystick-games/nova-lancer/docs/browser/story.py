"""Follow the original story and resume its first mission using its own displayed password."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from pathlib import Path
from threading import Thread
import argparse
import hashlib
import json
import re
from playwright.sync_api import sync_playwright


def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument("--chromium")
    args.add_argument("--output", type=Path, required=True)
    options = args.parse_args()
    options.output.mkdir(parents=True, exist_ok=True)
    game = Path(__file__).resolve().parents[2]
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(game / "dist")))
    Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(executable_path=options.chromium,
                                         args=["--enable-unsafe-swiftshader", "--use-angle=swiftshader",
                                               "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"])
            errors = []
            def open_menu():
                context = browser.new_context(viewport={"width": 960, "height": 540})
                page = context.new_page()
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(origin + "/tv.html", wait_until="domcontentloaded")
                page.wait_for_function('()=>window.JoystickGameQA?.snapshot().stage==="menu"', timeout=120000)
                page.keyboard.press("Enter")
                page.locator("#mainmenu:not([hidden])").wait_for()
                return context, page
            def press(page, key, selector):
                page.keyboard.press(key)
                page.locator(selector).wait_for(timeout=40000)
            context, page = open_menu()
            press(page, "ArrowDown", '#mainmenu [data-act="chars"].sel')
            press(page, "ArrowDown", '#mainmenu [data-act="diff"].sel')
            initial = page.locator("#diffval").inner_text()
            page.keyboard.press("ArrowRight")
            page.wait_for_function("v=>document.querySelector('#diffval').textContent!==v", arg=initial)
            difficulty = page.locator("#diffval").inner_text()
            press(page, "ArrowUp", '#mainmenu [data-act="chars"].sel')
            press(page, "ArrowUp", '#mainmenu [data-act="story"].sel')
            press(page, "Enter", "#storymenu:not([hidden])")
            press(page, "Enter", "#story.on")
            press(page, "Escape", "#briefing.on")
            shown = page.locator("#br-pass b").inner_text()
            assert re.fullmatch(r"[0-9A-Z]{5}-[0-9A-Z]{5}", shown), shown
            mission = page.locator("#br-title").inner_text()
            assert "AZURE" in mission.upper(), mission
            page.screenshot(path=options.output / "story-briefing.jpg", quality=85)
            print("Displayed checkpoint", mission, difficulty, flush=True)
            context.close()
            context, page = open_menu()
            press(page, "Enter", "#storymenu:not([hidden])")
            assert not page.locator("#mi-continue").is_visible()
            press(page, "ArrowDown", '#storymenu [data-act="password"].sel')
            press(page, "Enter", "#password.on")
            page.keyboard.type(shown.replace("-", ""), delay=60)
            press(page, "Enter", "#briefing.on")
            assert page.locator("#br-pass b").inner_text() == shown
            assert page.locator("#br-title").inner_text() == mission
            press(page, "Escape", "#br-menu:not([hidden])")
            page.keyboard.press("Enter")
            page.wait_for_function("()=>window.JoystickGameQA.snapshot().stage==='playing'", timeout=120000)
            assert not errors, errors
            report = {"game":"nova-lancer","mission":mission,"difficulty":difficulty,
                      "steps":["title menu navigation","change difficulty","new story","skip prologue",
                               "read mission password","open a fresh browser profile","type that password",
                               "restore the same mission and loadout","launch sortie from briefing"],
                      "missionPasswordEqual":True, "restoredStage":"playing", "pageErrors":errors,
                      "htmlSha256":hashlib.sha256((game / "dist/tv.html").read_bytes()).hexdigest(),
                      "scriptSha256":hashlib.sha256((game / "dist/nova-lancer.js").read_bytes()).hexdigest()}
            (options.output / "story.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n")
            context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
