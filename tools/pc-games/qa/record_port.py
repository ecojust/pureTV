"""Exercise a built game through the desktop host and a loopback Wi-Fi SDK controller."""

import argparse
from collections import Counter
from contextlib import contextmanager
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory
from time import monotonic
from urllib.parse import urlsplit
from zipfile import ZipFile

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'tools/pc-games'))
sys.path.insert(0, str(ROOT / 'joystick-games/gogh-strike/tests'))
from verify_resource_inputs import desktop, pad
from recording import Recording


def wait(page, condition, arg=None):
    print('Checking', condition, flush=True)
    page.wait_for_function('arg => { const s = window.JoystickGameQA?.snapshot(); return s && (' + condition + '); }',
                           arg=arg, polling=150, timeout=240_000)


def state(page):
    return page.evaluate('JoystickGameQA.snapshot()')


@contextmanager
def gamepad_stick(page, x, y):
    # Chromium's standard Gamepad API, with the stick held by a synthetic device.
    page.evaluate("""([x, y]) => {
        const pad = {id: 'QA standard gamepad', index: 0, mapping: 'standard', connected: true,
            axes: [x, y, 0, 0], buttons: Array.from({length: 17}, () => ({pressed: false, touched: false, value: 0}))};
        Object.defineProperty(navigator, 'getGamepads', {configurable: true, value: () => [pad, null, null, null]});
        dispatchEvent(Object.assign(new Event('gamepadconnected'), {gamepad: pad}));
    }""", [x, y])
    try:
        yield
    finally:
        page.evaluate("""() => {
            const [pad] = navigator.getGamepads();
            delete navigator.getGamepads;
            dispatchEvent(Object.assign(new Event('gamepaddisconnected'), {gamepad: pad}));
        }""")


@contextmanager
def held(client, key):
    client.button(key, 'down')
    try:
        yield
    finally:
        client.button(key, 'up')


def tcp_press(page, client, key, condition, arg=None):
    with held(client, key):
        wait(page, f's.controller.buttons[{json.dumps(key)}] && ({condition})', arg)
    wait(page, f'!s.controller.buttons[{json.dumps(key)}]')


def run(game, play):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path, help='Directory for screenshots, video and the JSON report')
    parser.add_argument('--apk', type=Path, help='Exercise the assets of this APK instead of the local dist/')
    parser.add_argument('--chromium', default=shutil.which('chromium'))
    opts = parser.parse_args()
    out = opts.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory() as temporary:
        tmp = Path(temporary)
        package = opts.apk
        if not package:
            dist = ROOT / 'joystick-games' / game / 'dist'
            assert (dist / 'tv.html').is_file(), f'Build {game} before recording'
            package = tmp / 'assets.zip'
            with ZipFile(package, 'w') as z:
                for path in sorted(dist.rglob('*')):
                    if path.is_file():
                        z.write(path, 'assets/' + path.relative_to(dist).as_posix())
        with ZipFile(package) as z:
            contents = {name: hashlib.sha256(z.read(name)).hexdigest() for name in sorted(z.namelist())
                        if name.startswith('assets/') and not name.endswith('/')}
        digest = hashlib.sha256(json.dumps(contents, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        with sync_playwright() as pw, desktop(game, package, language='zh') as (url, port):
            browser = pw.chromium.launch(executable_path=opts.chromium, args=['--enable-unsafe-swiftshader', '--disable-dev-shm-usage'])
            page = browser.new_page(viewport={'width': 960, 'height': 540}, locale='zh-CN')
            page.set_default_timeout(240_000)
            errors, external, missing = [], set(), set()
            def offline(route):
                address = urlsplit(route.request.url)
                if address.netloc == urlsplit(url).netloc or address.scheme in ('blob', 'data'):
                    route.continue_()
                else:
                    external.add(route.request.url)
                    route.abort()
            page.route('**/*', offline)
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('response', lambda r: missing.add(urlsplit(r.url).path) if r.status >= 400 else None)
            started = monotonic()
            page.goto(url, wait_until='commit')
            try:
                wait(page, "s.ready && s.stage === 'menu'")
                menu_seconds = monotonic() - started
                print('Menu loaded.', flush=True)
                with pad(port) as client:
                    wait(page, "s.controller.connected && s.controller.transport === 'wifi'")
                    print('SDK client joined.', flush=True)
                    report = play(page, client, out, tmp)
            except Exception:
                page.screenshot(path=out / 'failure.png', timeout=15_000)
                print('Page errors:', errors, 'Missing resources:', sorted(missing), flush=True)
                raise
            browser.close()
            assert not errors, errors
            report.update(game=game, chromium=browser.version, assetTreeSha256=digest, assetFiles=len(contents),
                          softwareBrowserMenuLoadSeconds=round(menu_seconds, 2),
                          pageErrors=errors, failedLocalResponses=sorted(missing),
                          blockedExternalRequests=dict(Counter(urlsplit(u).netloc for u in external)),
                          inputTransport='loopback TCP from JoystickClient', standardGamepadSimulated=True,
                          physicalTvTested=False, physicalPhoneTested=False)
        (out / 'browser.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps(report, ensure_ascii=False), flush=True)


@contextmanager
def gameplay_video(page, out, tmp):
    capture = Recording(page, tmp / 'session.webm')
    yield
    capture.finish()
    output = out / 'gameplay.mp4'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(tmp / 'session.webm'), '-an', '-c:v', 'libx264',
                    '-threads', '2', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(output)], check=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(output), '-f', 'null', '-'], check=True)
    assert 0 < output.stat().st_size < 10_000_000
