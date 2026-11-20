"""Drive Sunny Circuit using a real Chromium keyboard and a Mesa software GPU."""
import argparse
import hashlib
import json
import os
import shutil
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


class Assets(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


GAME = Path(__file__).resolve().parents[2]
STATE = """() => {
    const s = window.JoystickGameQA.snapshot();
    const g = s.gameplay;
    return {frames: s.frames, mode: g.mode, course: g.course, speed: g.speed,
            renderer: s.renderer, postfxEnabled: g.postfxEnabled, errors: s.errors};
}"""
GPU = """() => {
    const gl = document.querySelector('canvas.game-canvas').getContext('webgl2');
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return gl.getParameter(info.UNMASKED_RENDERER_WEBGL);
}"""


def wait_for_game(page, predicate, timeout):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        state = page.evaluate(STATE)
        if state['errors']:
            raise RuntimeError(state)
        if predicate(state):
            return state
        page.wait_for_timeout(1000)
    raise TimeoutError(state)


def drive(browser, address, width, height, output):
    page = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=1)
    try:
        page.goto(address)
        page.wait_for_function('window.JoystickGameQA?.snapshot().frames > 2', timeout=120_000)
        renderer = page.evaluate(GPU)
        assert 'llvmpipe' in renderer.lower(), renderer
        states = [page.evaluate(STATE)]
        assert states[0]['mode'] == 'title' and states[0]['postfxEnabled'] is False
        for mode in ('characterSelect', 'trackSelect', 'racing'):
            page.keyboard.press('Enter', delay=80)
            states.append(wait_for_game(page, lambda s: s['mode'] == mode, timeout=900))
        page.keyboard.down('ArrowUp')
        try:
            states.append(wait_for_game(page, lambda s: s['speed'] > 2, timeout=120))
            assert states[-1]['course'] == 'sunny_circuit'
            shot = output / f'driving-{width}x{height}.png'
            page.screenshot(path=str(shot), timeout=60_000)
        finally:
            page.keyboard.up('ArrowUp')
        return {'viewport': [width, height], 'gpu': renderer, 'states': states,
                'screenshot': shot.name, 'screenshotSha256': hashlib.sha256(shot.read_bytes()).hexdigest()}
    finally:
        page.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Assets, directory=str(GAME / 'dist')))
    server.daemon_threads = True
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(executable_path=shutil.which('chromium'), headless=True,
                    args=['--no-sandbox', '--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'],
                    env={**os.environ, 'LIBGL_ALWAYS_SOFTWARE': '1'})
            address = f'http://127.0.0.1:{server.server_port}/tv.html'
            results = [drive(browser, address, w, h, args.output) for w, h in ((960, 540), (1280, 720))]
            report = {'chromium': browser.version, 'input': 'Chromium keyboard Enter and ArrowUp',
                      'distGameJsSha256': hashlib.sha256((GAME / 'dist/game.js').read_bytes()).hexdigest(),
                      'results': results}
            (args.output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
