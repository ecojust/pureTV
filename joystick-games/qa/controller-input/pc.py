"""Start each actual PC web payload, then observe SDK and keyboard input in the game."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright
from sdk import MeasuredClient, ROOT

SNAPSHOT = "window.JoystickGameQA?.snapshot?.()"
FLAGS = ['--disable-dev-shm-usage', '--disable-background-timer-throttling', '--enable-unsafe-swiftshader']


def verify(browser, host_path, slug, archive, timeout, editable_text=None):
    with archive.open('rb') as packed:
        result = {'game': slug, 'payloadSha256': hashlib.file_digest(packed, 'sha256').hexdigest()}
    proc = subprocess.Popen([sys.executable, str(host_path), '--game', slug, '--apk', str(archive),
                             '--http-port', '0', '--controller-port', '0', '--no-browser'],
                            stdout=subprocess.PIPE, text=True)
    page = client = None
    phase = "host startup"
    errors = []
    start = time.monotonic()
    try:
        url = proc.stdout.readline().strip().removeprefix('Game: ')
        port = re.match(r'^Controller: TCP (\d+) ', proc.stdout.readline()).group(1)
        assert url.startswith('http://127.0.0.1:'), url
        page = browser.new_page(viewport={'width': 960, 'height': 540})
        page.set_default_timeout(timeout * 1000)
        page.on('pageerror', lambda exc: errors.append(str(exc)[:400]))
        phase = 'game startup'
        print(slug, phase, flush=True)
        page.goto(url, wait_until='commit')
        page.wait_for_function(f"() => {{const s={SNAPSHOT}; return s?.stage === 'error' || s?.webglError || s?.controller?.pollCount > 2;}}")
        state = page.evaluate(f"() => {{const s={SNAPSHOT}; return {{stage:s.stage, error:s.webglError, messages:s.errors}};}}")
        assert state.get('stage') != 'error' and not state.get('error'), state
        result['initial'] = page.evaluate(f"() => {{const s={SNAPSHOT}; return {{stage:s.stage, renderer:s.renderer ?? s.render?.type ?? null, polls:s.controller.pollCount}};}}")
        result['startupSeconds'] = round(time.monotonic() - start, 1)
        phase = 'SDK connection and input'
        print(slug, phase, result['startupSeconds'], flush=True)
        client = MeasuredClient(int(port))
        client.connect()
        page.wait_for_function(f"{SNAPSHOT}?.controller?.connected === true")
        identity = page.locator('[data-puretv-controller-id-text]').first
        assert client.identity in identity.inner_text() and identity.is_visible()
        for key, down, action in [('DOWN', True, 'down'), ('DOWN', False, 'tap')]:
            client.button(key, action, 0 if down else 100)
            page.wait_for_function(f"{SNAPSHOT}?.controller?.buttons?.{key} === {str(down).lower()}")
        result.update(tcpIdentity=client.identity, acknowledged=client.acknowledged())
        client.disconnect()
        phase = 'keyboard after disconnect'
        page.wait_for_function(f"{SNAPSHOT}?.controller?.connected === false")
        # A directional input may land on an editable game field (e.g. Emberbrood's world seed).
        # Let the browser leave it with Tab before testing gameplay shortcuts.
        editable = "input, textarea, select, [contenteditable]:not([contenteditable=false])"
        if editable_text is not None:
            phase = 'typing into the focused game field'
            field = page.locator('input:focus, textarea:focus')
            assert field.count() == 1, 'The tested game must have focused its text field'
            page.keyboard.press('ControlOrMeta+a')
            page.keyboard.type(editable_text, delay=40)
            result['typedValue'] = field.input_value()
            assert result['typedValue'] == editable_text, result['typedValue']
            phase = 'keyboard after disconnect'
        tab_count = 0
        while page.evaluate("(s) => !!document.activeElement?.closest(s)", editable):
            assert tab_count < 12, 'Could not leave the editable game controls with Tab'
            page.keyboard.press('Tab')
            tab_count += 1
        result['tabsToLeaveEditable'] = tab_count
        page.keyboard.down('Numpad8')
        page.wait_for_function(f"{SNAPSHOT}?.controller?.buttons?.UP === true")
        page.keyboard.up('Numpad8')
        page.wait_for_function(f"{SNAPSHOT}?.controller?.buttons?.UP === false")
        result['passed'] = True
    except Exception as error:
        result.update(passed=False, phase=phase, error=str(error).splitlines()[0], pageErrors=errors[-3:])
    finally:
        if client: client.disconnect()
        if page: page.close()
        proc.terminate()
        try: proc.wait(timeout=5)
        except subprocess.TimeoutExpired: proc.kill(); proc.wait()
    result['seconds'] = round(time.monotonic() - start, 1)
    return result


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--host', type=Path, default=ROOT / 'tools/pc-games/host.py')
    p.add_argument('--payloads', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--chromium', default='/usr/bin/chromium')
    p.add_argument('--timeout', type=int, default=300)
    p.add_argument('--editable-text', help='Type this value when the tested game focuses its text input')
    p.add_argument('--angle', choices=['auto', 'swiftshader', 'gl-egl'], default='auto')
    p.add_argument('games', nargs='+')
    args = p.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        flags = FLAGS.copy()
        if args.angle != 'auto':
            flags.extend(['--use-gl=angle', '--use-angle=' + args.angle, '--ignore-gpu-blocklist'])
        browser = pw.chromium.launch(executable_path=args.chromium, args=flags, timeout=180_000)
        try:
            ok = True
            for slug in args.games:
                report = verify(browser, args.host, slug, args.payloads / (slug + '.zip'), args.timeout, args.editable_text)
                report.update(browser=browser.version, angle=args.angle)
                (args.output / (slug + '.json')).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
                print(slug, report.get('passed'), report.get('error', ''), flush=True)
                ok = ok and report['passed']
        finally: browser.close()
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
