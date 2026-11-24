#!/usr/bin/env python3
"""Record the offline game by driving its keypad, using Playwright and FFmpeg."""
import argparse
import base64
import functools
import http.server
import pathlib
import shutil
import subprocess
import tempfile
import threading

from playwright.sync_api import sync_playwright


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def record(args, work):
    root = pathlib.Path(__file__).resolve().parents[1]
    handler = functools.partial(Handler, directory=root / 'dist')
    with http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler) as server, sync_playwright() as pw:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        origin = f'http://127.0.0.1:{server.server_port}'
        browser = pw.chromium.launch(executable_path=args.chromium, args=[
            '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'
        ] if args.software else [])
        page = browser.new_page(viewport={'width': 960, 'height': 540}, device_scale_factor=1)
        page.set_default_timeout(300_000)
        page.route('**/*', lambda route: route.continue_() if route.request.url.startswith(origin + '/') else route.abort())
        page.goto(origin + '/tv.html', wait_until='domcontentloaded')
        page.wait_for_function("window.JoystickGameQA?.snapshot().ready && !document.getElementById('boot')")
        client = page.context.new_cdp_session(page)
        frames = []

        def save_frame(event):
            client.send('Page.screencastFrameAck', {'sessionId': event['sessionId']})
            name = f'{len(frames):05}.jpg'
            (work / name).write_bytes(base64.b64decode(event['data']))
            frames.append((name, event['metadata']['timestamp']))

        client.on('Page.screencastFrame', save_frame)
        client.send('Page.startScreencast', {'format': 'jpeg', 'quality': 83, 'everyNthFrame': 1})

        def drive(keys, condition, frames_after=2):
            before = page.evaluate('JoystickGameQA.snapshot()')
            for key in keys:
                page.keyboard.down(key)
            try:
                page.wait_for_function(
                    'before => { const after = JoystickGameQA.snapshot(); return ' + condition + '; }',
                    arg=before)
                # Keep recording through at least two further real rendered frames.
                start = page.evaluate('JoystickGameQA.snapshot().frames')
                page.wait_for_function('end => JoystickGameQA.snapshot().frames >= end', arg=start + frames_after)
            finally:
                for key in reversed(keys):
                    page.keyboard.up(key)

        drive(['Numpad5'], "after.stage === 'playing' && after.gameplay.wave === 1")
        drive(['Numpad6'], 'Math.abs(after.gameplay.x - before.gameplay.x) > 0.25')
        drive(['Numpad7', 'Numpad4'], 'Math.abs(after.gameplay.yaw - before.gameplay.yaw) > 0.12')
        drive(['Numpad1'], 'after.gameplay.shots > before.gameplay.shots + 2')
        drive(['Numpad3'], 'after.gameplay.y > before.gameplay.y + 0.1')
        drive(['Numpad5'], "after.stage === 'paused'")
        client.send('Page.stopScreencast')
        browser.close()
        server.shutdown()

    if len(frames) < 6:
        raise RuntimeError('Too few actual frames to encode a clip')
    with (work / 'frames.txt').open('w') as sink:
        for (name, first), (_, second) in zip(frames, frames[1:]):
            sink.write(f"file '{name}'\nduration {max(.001, second-first):.6f}\n")
        sink.write(f"file '{frames[-1][0]}'\n")
    subprocess.run([
        'ffmpeg', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(work / 'frames.txt'),
        '-vf', 'fps=15', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '25',
        '-movflags', '+faststart', '-y', str(args.output.resolve())
    ], check=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=pathlib.Path)
    parser.add_argument('--chromium', default=shutil.which('chromium'), help='Chromium executable')
    parser.add_argument('--software', action='store_true', help='Use the SwiftShader WebGL2 backend')
    args = parser.parse_args()
    with tempfile.TemporaryDirectory() as directory:
        record(args, pathlib.Path(directory))
