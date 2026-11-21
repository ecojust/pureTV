"""Install each desktop game on its native OS and exercise the installed application."""
import argparse
from contextlib import contextmanager, nullcontext
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import shlex
import signal
import socket
import struct
import subprocess
import sys
import tempfile
import time
from urllib.parse import quote
from urllib.request import ProxyHandler, build_opener
from zipfile import ZipFile

HTTP = build_opener(ProxyHandler({}))
BRIDGE = Path(__file__).with_name('pc-bridge.js')
INJECTION = '<script src="/__puretv/bridge.js"></script>'


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


@contextmanager
def installed(package, game, work, system):
    root = work / 'game'
    if system == 'windows':
        quiet = ['/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART']
        subprocess.run([str(package), *quiet, '/SP-', '/DIR=' + str(root)], check=True, timeout=120)
        try:
            exe = root / (game['id'] + '.exe')
            with exe.open('rb') as stream:
                stream.seek(0x3c)
                stream.seek(struct.unpack('<I', stream.read(4))[0])
                if stream.read(6) != b'PE\0\0\x64\x86':
                    raise ValueError(f'{exe} is not a Windows x64 binary')
            yield exe, root
        finally:
            subprocess.run([str(root / 'unins000.exe'), *quiet], check=True, timeout=120)
    else:
        root.mkdir()
        subprocess.run(['hdiutil', 'attach', '-readonly', '-nobrowse',
                        '-mountpoint', str(root), str(package)], check=True, timeout=120)
        try:
            (app,) = root.glob('*.app')
            with (app / 'Contents/Info.plist').open('rb') as plist:
                info = plistlib.load(plist)
            exe = app / 'Contents/MacOS' / info['CFBundleExecutable']
            subprocess.run(['codesign', '--verify', '--deep', '--strict', str(app)], check=True)
            subprocess.run(['lipo', str(exe), '-verify_arch', 'arm64', 'x86_64'], check=True)
            yield exe, app / 'Contents/Resources'
        finally:
            subprocess.run(['hdiutil', 'detach', str(root)], check=True, timeout=120)


def controller_input(base, port):
    """Send an actual controller key and observe the game's browser event stream."""
    with socket.create_connection(('127.0.0.1', port), timeout=6) as pad, pad.makefile('rb') as replies:
        for seq, fields in enumerate(({'type': 'hello'},
                                      {'type': 'button', 'key': 'A', 'action': 'down', 'pressed': True},
                                      {'type': 'button', 'key': 'A', 'action': 'tap', 'pressed': False})):
            message = dict(fields, controller_id='puretv-package-qa', seq=seq)
            pad.sendall(json.dumps(message).encode() + b'\n')
            if json.loads(replies.readline()) != {'type': 'ack', 'seq': seq}:
                raise ValueError(f'Controller did not acknowledge {fields}')
            with HTTP.open(base + '/__puretv/events', timeout=6) as events:
                state = next(json.loads(line[6:]) for line in events if line.startswith(b'data: '))
            player = next(p for p in state['players'] if p['controllerId'] == message['controller_id'])
            if not player['connected'] or player['buttons']['A'] != (seq == 1):
                raise ValueError(f'Wrong controller state after {fields}')


def verify_server(base, game, source, log, child):
    deadline = time.monotonic() + 90
    while child.poll() is None and time.monotonic() < deadline:
        try:
            with HTTP.open(base + '/tv.html', timeout=2) as response:
                served = response.read().decode('utf-8')
            break
        except OSError:
            time.sleep(.2)
    else:
        raise RuntimeError(f"{game['id']} failed to open its page: exit {child.poll()}\n"
                           + log.read_text(encoding='utf-8', errors='replace')[-4000:])

    with ZipFile(source / 'game.apk') as archive:
        original = archive.read('assets/tv.html').decode('utf-8-sig')
        if served.count(INJECTION) != 1 or served.replace(INJECTION, '', 1) != original:
            raise ValueError(f"{game['id']} returned a different game's page")
        assets = [i.filename for i in archive.infolist()
                  if i.filename.startswith('assets/') and not i.is_dir() and i.filename != 'assets/tv.html']
        for asset in assets:
            with HTTP.open(base + quote(asset.removeprefix('assets')), timeout=10) as response:
                if response.read() != archive.read(asset):
                    raise ValueError(f"Incorrect asset in {game['id']}: {asset}")

    with HTTP.open(base + '/__puretv/bridge.js', timeout=6) as response:
        config, script = response.read().split(b'\n', 1)
    if script.replace(b'\r\n', b'\n') != BRIDGE.read_bytes().replace(b'\r\n', b'\n'):
        raise ValueError('Controller bridge does not match the build source')
    settings = json.loads(config.removeprefix(b'const pureTVPCConfig=').removesuffix(b';'))
    pad = settings['info']['wifiController']
    if not pad['serviceName'].startswith('pureTV-' + game['id']):
        raise ValueError('The controller is advertising a different game')
    controller_input(base, pad['port'])
    return len(assets)


def edge_command(work):
    # Use the real Windows client's webbrowser.open call. A private profile
    # isolates each game's data from other CI jobs and enables observing the
    # actual page Edge opens without rendering a second copy of the game.
    edge = next(path for env in ('ProgramFiles(x86)', 'ProgramFiles', 'LocalAppData')
                if env in os.environ
                for path in [Path(os.environ[env]) / 'Microsoft/Edge/Application/msedge.exe']
                if path.is_file())
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', 0))
        port = probe.getsockname()[1]
    command = shlex.join([str(edge), '--headless=new', '--no-first-run',
                          '--remote-debugging-address=127.0.0.1', f'--remote-debugging-port={port}',
                          '--user-data-dir=' + str(work / 'edge-profile'), '--window-size=960,540',
                          '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
                          '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '%s'])
    # The stdlib webbrowser module uses shlex to parse BROWSER and treats
    # a trailing ampersand as an asynchronous application launch.
    return command + ' &', f'http://127.0.0.1:{port}'


def browser_boot(pw, inspector, base):
    deadline = time.monotonic() + 45
    while True:
        try:
            with HTTP.open(inspector + '/json/version', timeout=2):
                break
        except OSError:
            if time.monotonic() >= deadline:
                raise RuntimeError('The installed game failed to launch its Edge window')
            time.sleep(.2)
    with pw.chromium.connect_over_cdp(inspector) as browser:
        deadline = time.monotonic() + 180
        while True:
            pages = [p for context in browser.contexts for p in context.pages
                     if p.url == base + '/tv.html']
            if pages:
                break
            if time.monotonic() >= deadline:
                raise RuntimeError(f'The installed game opened no tab for {base}/tv.html')
            time.sleep(.2)
        page = pages[0]
        # Several games enforce CSP. Evaluate their read-only state directly
        # instead of injecting an in-page predicate which could be blocked.
        while True:
            ready = page.evaluate('''() => {
                const s = window.PureTVQA?.snapshot() ?? window.JoystickGameQA?.snapshot();
                if (s?.webglError || s?.error || s?.phase === 'error' || s?.stage === 'error') {
                    throw new Error(s.error || s.message || "Game failed to initialize");
                }
                return s?.phase || s?.stage;
            }''')
            if ready and ready != 'loading':
                break
            if time.monotonic() >= deadline:
                raise RuntimeError(f'{base} did not reach the menu (last state {ready!r})')
            page.wait_for_timeout(250)
        result = {'initialGameState': ready}
        from playwright.sync_api import TimeoutError as ScreenshotTimeout
        try:
            result['pngSha256'] = hashlib.sha256(page.screenshot(timeout=30000)).hexdigest()
        except ScreenshotTimeout:
            # Edge may time out copying a software-rendered 3D frame even
            # after the game has reached its menu and exposes its live state.
            result['screenshotNote'] = 'Frame capture timed out after the game reached its ready state.'
        return result


def verify_game(package, source, work, system, pw):
    game = json.loads((source / 'game.json').read_text(encoding='utf-8'))
    with installed(package, game, work, system) as (exe, data):
        if json.loads((data / 'game.json').read_text(encoding='utf-8')) != game:
            raise ValueError(f'Wrong installed game metadata in {package}')
        if digest(data / 'game.apk') != game['sha256']:
            raise ValueError(f'Wrong game data installed by {package}')
        slug = game['id']
        # Start the same binary and use the same defaults as the Finder/Start Menu entry.
        port = 34000 + int.from_bytes(hashlib.sha256(slug.encode()).digest()[:2], 'big') % 24000
        base = f'http://127.0.0.1:{port}'
        log = work / 'start.log'
        env = {**os.environ, 'PURETV_GAME_VERIFY': '1'}
        if pw is not None:
            env['BROWSER'], inspector = edge_command(work)
        with log.open('wb') as output:
            child = subprocess.Popen([str(exe)], cwd=work, stdout=output, stderr=subprocess.STDOUT,
                                     start_new_session=system != 'windows',
                                     env=env)
            try:
                assets = verify_server(base, game, source, log, child)
                result = dict(id=slug, version=game['version'], installer=package.name,
                              installerSha256=digest(package), apkSha256=game['sha256'],
                              httpAssets=assets, controllerKey='A', normalLaunch=True)
                if pw is not None:
                    result['browser'] = browser_boot(pw, inspector, base)
                if system == 'macos':
                    deadline = time.monotonic() + 75
                    while True:
                        snapshot = re.search(rb'^WK game ready: ([^\r\n]+)', log.read_bytes(), re.MULTILINE)
                        if snapshot:
                            stage = snapshot[1].decode()
                            if stage.lower() == 'error':
                                raise RuntimeError(f'{slug} reported an error inside WKWebView')
                            result['wkGameState'] = stage
                            break
                        if child.poll() is not None or time.monotonic() >= deadline:
                            raise RuntimeError('Game did not reach its ready state in WKWebView: ' +
                                               log.read_text(encoding='utf-8', errors='replace')[-4000:])
                        time.sleep(.2)
            finally:
                if system == 'windows' and child.poll() is None:
                    # Some Edge subprocesses may exit during tree enumeration;
                    # the wait below verifies that the game itself has exited.
                    subprocess.run(['taskkill', '/PID', str(child.pid), '/T', '/F'], check=False)
                elif system == 'macos' and child.poll() is None:
                    # Ask AppKit to quit, so applicationWillTerminate stops the
                    # frozen helper before the read-only disk image is detached.
                    request = ('ObjC.import("AppKit"); '
                               f'$.NSRunningApplication.runningApplicationWithProcessIdentifier({child.pid}).terminate')
                    try:
                        subprocess.run(['osascript', '-l', 'JavaScript', '-e', request], timeout=8)
                        child.wait(timeout=12)
                    except subprocess.TimeoutExpired:
                        if child.poll() is None:
                            os.killpg(child.pid, signal.SIGTERM)
                child.wait(timeout=20)
    return result


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--platform', choices=['macos', 'windows'], required=True)
    p.add_argument('--packages', type=Path, required=True)
    p.add_argument('--inputs', type=Path, required=True)
    p.add_argument('--report', type=Path, required=True)
    p.add_argument('--browser-channel', choices=['msedge'], help='Observe the Edge window opened by the Windows client')
    args = p.parse_args()
    if {'macos': 'darwin', 'windows': 'win32'}[args.platform] != sys.platform:
        p.error('The verification must run on the target platform')
    if args.browser_channel:
        from playwright.sync_api import sync_playwright
        playwright = sync_playwright()
    else:
        playwright = nullcontext()
    report = []
    suffix = '-macos.dmg' if args.platform == 'macos' else '-windows-x64-setup.exe'
    args.report.parent.mkdir(parents=True, exist_ok=True)
    with playwright as pw:
        for metadata in sorted(args.inputs.glob('*/game.json')):
            source = metadata.parent
            if args.platform not in json.loads(metadata.read_text(encoding='utf-8'))['platforms']:
                continue
            package = (args.packages / (source.name + suffix)).resolve(strict=True)
            with tempfile.TemporaryDirectory() as temp:
                report.append(verify_game(package, source, Path(temp), args.platform, pw))
            args.report.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
            print(f'Checked {package.name}', flush=True)
    if not report:
        p.error('No matching game packages were verified')


if __name__ == '__main__':
    main()
