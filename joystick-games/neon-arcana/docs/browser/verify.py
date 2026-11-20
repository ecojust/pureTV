"""Exercise the packaged offline page using the repository TCP SDK and a browser host fixture."""
import argparse
import functools
import hashlib
import http.server
import json
import socketserver
import sys
import threading
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

game_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(game_dir.parents[1] / 'puretv-joystick'))
from joystick_sdk import JoystickClient, KEYS

parser = argparse.ArgumentParser()
parser.add_argument('--chromium', default='/usr/bin/chromium')
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
args.output.mkdir(exist_ok=True, parents=True)
plan = json.loads((game_dir / 'qa-plan.json').read_text())
lock = threading.Lock()
players = {}


class PadHost(socketserver.ThreadingTCPServer):
    daemon_threads = True


class Pad(socketserver.StreamRequestHandler):
    def handle(self):
        ident = None
        try:
            for line in self.rfile:
                data = json.loads(line)
                with lock:
                    if data['type'] == 'hello':
                        ident = data['controller_id']
                        players[ident] = dict(id=1, controllerId=ident, connected=True, transport='wifi',
                                              session=str(time.monotonic_ns()), buttons=dict.fromkeys(KEYS, False))
                    elif ident and data['type'] == 'button':
                        players[ident]['buttons'][data['key']] = data['pressed']
        finally:
            with lock:
                players.pop(ident, None)


class Files(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        if self.path != '/controls':
            return super().do_GET()
        with lock:
            data = json.dumps({'players': list(players.values())}).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)


def get(snapshot, path):
    for key in path.split('.'):
        snapshot = snapshot[key]
    return snapshot


def matches(before, current, checks):
    for item in checks:
        new, old = get(current, item['path']), get(before, item['path'])
        if item['op'] == 'eq' and new != item['value']: return False
        if item['op'] == 'changed' and new == old: return False
        if item['op'] == 'increased' and new <= old: return False
    return True


def wait_for(test, seconds=40):
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        if result := test(): return result
        time.sleep(.05)
    raise TimeoutError('Timed out waiting for the browser or physical button state')


with PadHost(('127.0.0.1', 0), Pad) as server, http.server.ThreadingHTTPServer(
        ('127.0.0.1', 0), functools.partial(Files, directory=game_dir / 'dist')) as web, sync_playwright() as pw:
    for host in (server, web):
        threading.Thread(target=host.serve_forever, daemon=True).start()
    browser = pw.chromium.launch(executable_path=args.chromium, args=[
        '--no-sandbox', '--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist',
        '--enable-unsafe-swiftshader', '--disable-dev-shm-usage',
    ])
    base = 'http://127.0.0.1:' + str(web.server_port)
    results = []
    try:
        for width, height in [(960, 540), (1280, 720)]:
            client = JoystickClient('127.0.0.1', server.server_address[1])
            client.connect()
            ctx = browser.new_context(viewport=dict(width=width, height=height))
            page = ctx.new_page()
            external, errors = [], []
            page.on('pageerror', lambda error: (errors.append(str(error)), print('JavaScript:', error, flush=True)))
            page.on('request', lambda req: external.append(req.url) if not req.url.startswith((base, 'data:')) else None)
            page.add_init_script("""(() => {
              let last = {players:[]};
              window.PureGameHost = {snapshot:()=>JSON.stringify(last),getInfo:()=>JSON.stringify({
                wifiController:{state:'ready',serviceName:'pureTV SDK',addresses:['127.0.0.1'],port:PORT}})};
              async function poll() {try { last = await (await fetch('/controls')).json(); } finally {setTimeout(poll, 20);}}
              poll();
            })()""".replace('PORT', str(server.server_address[1])))
            print(width, 'opening offline page', flush=True)
            page.goto(base + '/tv.html', wait_until='commit', timeout=120000)
            page.wait_for_function('window.JoystickGameQA?.snapshot().controller.connected', polling=500, timeout=240000)
            snap = lambda: page.evaluate('JoystickGameQA.snapshot()')
            def press(key):
                client.button(key, 'down')
                wait_for(lambda: snap()['controller']['buttons'][key])
                client.button(key, 'up')
                wait_for(lambda: not snap()['controller']['buttons'][key])
            initial = snap()
            assert initial['stage'] == 'menu' and not initial['paused']
            assert initial['renderer'] == 'webgl2' and initial['webglVersion'].startswith('WebGL 2')
            driver = page.evaluate("""() => {const g=document.querySelector('#view').getContext('webgl2');
                const e=g.getExtension('WEBGL_debug_renderer_info');return e&&g.getParameter(e.UNMASKED_RENDERER_WEBGL);}""")
            page_hash = hashlib.sha256((game_dir / 'dist/tv.html').read_bytes()).hexdigest()
            record = dict(resolution=[width, height], chromium=browser.version, driver=driver, htmlSHA256=page_hash,
                          webgl=initial['webglVersion'], steps=[])
            print(width, 'ready', driver, flush=True)
            for step in plan['steps']:
                prior = snap()
                press(step['keys'][0])
                current = snap()
                assert matches(prior, current, step['expect']), (step['name'], prior, current)
                record['steps'].append(dict(name=step['name'], observed={k['path']:get(current,k['path']) for k in step['expect']}))
                print(width, step['name'], record['steps'][-1]['observed'], flush=True)
            # Use both vertical controls on the real board; selection starts on row three.
            prior = snap()
            press('UP')
            assert snap()['gameplay']['cursorY'] == prior['gameplay']['cursorY'] - 1
            press('DOWN')
            assert snap()['gameplay']['cursorY'] == prior['gameplay']['cursorY']
            page.screenshot(path=args.output / f'board-{width}x{height}.png', timeout=120000)
            # Cancelling from a nested deck must land at Pause; a reconnect or A/Y may not resume it.
            press('START')
            press('DOWN')
            press('A')
            assert snap()['gameplay']['screen'] == 'deck'
            client.disconnect()
            wait_for(lambda: snap()['gameplay']['screen'] == 'pause' and not snap()['controller']['connected'])
            disconnected = snap()
            print(width, 'disconnected in deck and returned to pause', flush=True)
            client.connect()
            wait_for(lambda: snap()['controller']['connected'])
            press('A')
            press('Y')
            assert snap()['gameplay'] == disconnected['gameplay']
            press('START')
            assert snap()['stage'] == 'playing'
            page.evaluate('PureGame.focus(false)')
            suspended = snap()
            assert suspended['stage'] == 'paused'
            page.evaluate('PureGame.focus(true)')
            wait_for(lambda: snap()['frames'] > suspended['frames'] + 1)
            press('B')
            assert snap()['gameplay'] == suspended['gameplay']
            press('START')
            assert snap()['stage'] == 'playing'
            print(width, 'held pause through focus and resumed only on Start', flush=True)
            saved = snap()['gameplay']
            page.reload(wait_until='commit', timeout=120000)
            page.wait_for_function("window.JoystickGameQA?.snapshot().controller.connected", polling=500, timeout=240000)
            assert snap()['stage'] == 'menu'
            press('START')
            restored = snap()['gameplay']
            assert all(saved[k] == restored[k] for k in ['score','moves','cells','hand'])
            assert not external and not errors and not snap()['errors'], (external,errors,snap()['errors'])
            record.update(allNineButtons=True, pausedOnDeckDisconnect=True, focusAndExplicitResume=True,
                          savedReadingRestored=True, moves=saved['moves'], score=saved['score'], externalRequests=external, errors=errors)
            results.append(record)
            (args.output / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2)+'\n')
            client.disconnect()
            ctx.close()
    finally:
        browser.close()
        for host in (server, web): host.shutdown()
