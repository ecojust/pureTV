"""Browser input regression. python tests/browser.py --output /tmp/clawd-evidence"""
import argparse
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import shutil
import threading
import time

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def wait(page, expression, timeout=180):
    # CDP evaluate avoids Playwright's injected predicate compiler on this
    # page, whose upstream content policy intentionally disallows unsafe-eval.
    until = time.monotonic() + timeout
    while time.monotonic() < until:
        if page.evaluate(expression):
            print("Confirmed", expression, flush=True)
            return
        page.wait_for_timeout(180)
    last = page.evaluate("window.JoystickGameQA?.snapshot() || {title: document.title}")
    raise AssertionError((expression, last))


def canvas(page):
    return page.locator('#view').bounding_box()


def run(pw, output):
    handler = functools.partial(SimpleHTTPRequestHandler, directory=ROOT / 'dist')
    server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    browser = pw.chromium.launch(executable_path=shutil.which('chromium'), args=[
        '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
        '--no-sandbox', '--autoplay-policy=no-user-gesture-required'
    ])
    page = browser.new_page(viewport={'width': 960, 'height': 540})
    errors = []
    def record_error(message):
        print(message, flush=True)
        errors.append(message)
    page.on('pageerror', lambda exc: record_error(str(exc)))
    page.on('console', lambda msg: record_error(msg.text) if msg.type == 'error' else None)
    page.add_init_script("""window.bridgeFixture = {players: []};
      window.PureGameHost = { snapshot: () => JSON.stringify(window.bridgeFixture),
        getInfo: () => JSON.stringify({ wifiController: {port: 63485, serviceName:'Browser fixture'} }) };""")
    try:
        page.goto(f'http://127.0.0.1:{server.server_port}/tv.html?quality=phone&seed=clawd-bench', wait_until='domcontentloaded')
        wait(page, "window.game?.readyState === 'ready'")
        snap = lambda: page.evaluate('JoystickGameQA.snapshot()')
        checks = {'renderer': snap()['webglVersion']}
        assert checks['renderer'].startswith('WebGL 2')
        for width, height in [(1280, 720), (960, 540)]:
            page.set_viewport_size({'width': width, 'height': height})
            page.screenshot(path=output / f'menu-{width}.png', timeout=120000)
            assert canvas(page)['width'] == width
        leads = [item for room in snap()['gameplay']['encounters'] for item in room.get('lead', [])]
        assert {'codexSentinel', 'emberHopper'} <= set(leads)
        checks['seededIntroductions'] = sorted(set(leads))
        before = canvas(page)
        page.keyboard.press('p', delay=150)
        wait(page, "game.screen==='none' && game.state.stats.timeAlive > 2")
        page.keyboard.down('z')
        wait(page, 'game.state.stats.shots > 0')
        page.keyboard.up('z')
        checks['keyboardShots'] = snap()['gameplay']['shots']
        page.keyboard.down('ArrowUp')
        start = snap()['gameplay']['position']
        wait(page, f'JSON.stringify(JoystickGameQA.snapshot().gameplay.position)!=={json.dumps(json.dumps(start, separators=(",", ":")))}')
        page.keyboard.up('ArrowUp')
        page.screenshot(path=output / 'playing-960.png', timeout=120000)
        # Cross the same native snapshot boundary used by the phone and Wi-Fi
        # hosts. This does not simulate the transport or modify game state.
        for transport in ['wifi', 'phone']:
            player = {'id': 1, 'connected': True, 'transport': transport,
                      'controllerId': 'clawd-fixture', 'session': transport,
                      'buttons': {}, 'x': 0, 'y': 0}
            def send(**keys):
                player.update(keys)
                page.evaluate('(p) => window.bridgeFixture = {players: [p]}', player)
            send()
            wait(page, f"JoystickGameQA.snapshot().controller.transport === '{transport}'")
            if snap()['paused']:
                send(buttons={'START': True}, start=True)
                wait(page, "game.screen==='none'")
                send(buttons={}, start=False)
            previous = snap()['gameplay']['shots']
            send(buttons={'A': True}, a=True)
            wait(page, f'game.state.stats.shots > {previous}')
            checks[transport + 'Shots'] = snap()['gameplay']['shots']
            assert canvas(page) == before
            page.evaluate('window.bridgeFixture = {players: []}')
            wait(page, "game.screen==='pause'")
            paused = snap()['gameplay']
            page.wait_for_timeout(250)
            after = snap()['gameplay']
            for key in ['position', 'shots', 'time']:
                assert after[key] == paused[key]
            assert canvas(page) == before
        assert not errors, errors
        (output / 'summary.json').write_text(json.dumps(checks, indent=2) + '\n')
        print(checks, flush=True)
    finally:
        if errors:
            print('Browser errors:', errors, flush=True)
        browser.close()
        server.shutdown()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        run(playwright, args.output)
