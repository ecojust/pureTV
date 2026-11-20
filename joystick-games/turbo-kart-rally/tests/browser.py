"""Run with Python Playwright and Chromium. Only normal input drives the game."""
import argparse
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SNAP = 'window.JoystickGameQA.snapshot()'


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@contextmanager
def serve():
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=ROOT / 'dist'))
    with server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f'http://127.0.0.1:{server.server_port}/tv.html'
        finally:
            server.shutdown()
            thread.join()


def verify(browser, url, width, height, out):
    page = browser.new_page(viewport=dict(width=width, height=height))
    page.set_default_timeout(180000)
    errors, requests = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
    page.on('request', lambda req: requests.append(req.url))
    bridge = width == 1280
    if bridge:
        page.add_init_script("""
          window.fixture = { id: 1, session: 'test', controllerId: 'test-ESP', connected: true, transport: 'wifi', buttons: {} };
          window.PureGameHost = {
            getInfo: () => JSON.stringify({ wifiController: { port: 63485 } }),
            snapshot: () => JSON.stringify({ players: [window.fixture] })
          };
        """)
    page.goto(url, wait_until='domcontentloaded')
    def mode(value):
        page.wait_for_function(f'window.JoystickGameQA && {SNAP}.gameplay.mode === "{value}"', timeout=240000)
        print(f"{width}×{height}: {value}", flush=True)

    snapshot = lambda: page.evaluate(SNAP)
    def frame():
        target = snapshot()['frames'] + 2
        page.wait_for_function(f'{SNAP}.frames >= {target}')
    def press(key, btn):
        if bridge:
            page.evaluate('(key) => fixture.buttons[key] = true', btn)
            frame()
            page.evaluate('(key) => fixture.buttons[key] = false', btn)
            frame()
        else:
            page.keyboard.press(key)
    mode('title')
    press('Enter', 'START')
    mode('select')
    press('ArrowRight', 'RIGHT')
    assert snapshot()['gameplay']['characterIndex'] == 1
    press('Enter', 'A')
    button = page.locator('.race-btn').bounding_box()
    assert button and button['y'] + button['height'] <= height
    page.screenshot(path=out / f'select-{width}.png')
    press('Enter', 'START')
    mode('intro')
    press('Enter', 'A')
    mode('racing')
    before = snapshot()
    if bridge:
        page.evaluate('fixture.buttons.UP = true')
    else:
        page.keyboard.down('ArrowUp')
    page.wait_for_function(f'{SNAP}.gameplay.speed > 4')
    after = snapshot()
    assert before['gameplay']['progress'] != after['gameplay']['progress']
    assert after['gameplay']['racers'] == 8
    page.screenshot(path=out / f'race-{width}.png')
    if bridge:
        page.evaluate('fixture.buttons.X = true; fixture.buttons.A = true; fixture.buttons.LEFT = true')
        page.wait_for_function(f'{SNAP}.gameplay.lookBack && {SNAP}.gameplay.driftHeld')
        page.evaluate('fixture.connected = false')
    else:
        page.keyboard.up('ArrowUp')
        press('p', 'START')
    mode('paused')
    stopped = snapshot()
    assert not stopped['gameplay']['driftHeld']
    if bridge:
        page.evaluate('fixture.buttons = { START:true }; fixture.connected = true;')
        frame()
        page.evaluate('fixture.buttons = {}')
        frame()
    assert stopped['gameplay']['time'] == snapshot()['gameplay']['time']
    assert stopped['gameplay']['progress'] == snapshot()['gameplay']['progress']
    press('Enter', 'START')
    mode('racing')
    final = snapshot()
    assert not errors and not final['errors'], (errors, final['errors'])
    external = [req for req in requests if not req.startswith((url.rsplit('/', 1)[0], 'data:', 'blob:'))]
    assert not external, external
    print(f"{width}×{height}: {after['gameplay']['course']}, speed {after['gameplay']['speed']}, pause and resume verified", flush=True)
    page.close()
    return {'viewport': [width, height], 'input': 'native bridge fixture' if bridge else 'keyboard',
            'speed': after['gameplay']['speed'], 'progress': after['gameplay']['progress'],
            'raceButton': button, 'reducedEffects': final['gameplay']['reducedEffects'], 'errors': errors}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--chromium', default='/usr/bin/chromium')
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw, serve() as url:
        browser = pw.chromium.launch(executable_path=args.chromium, env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE':'1'}, args=[
            '--no-sandbox', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=gl-egl',
            '--autoplay-policy=no-user-gesture-required'])
        results = [verify(browser, url, w, h, args.output) for w, h in [(960, 540), (1280, 720)]]
        (args.output / 'browser.json').write_text(json.dumps(results, indent=2, ensure_ascii=False) + '\n')
        browser.close()
