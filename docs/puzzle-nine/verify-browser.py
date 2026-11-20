"""Run a game's native QA plan in Chromium with the original SDK and a loopback receiver."""
import argparse
from contextlib import contextmanager
import functools
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
import json
from pathlib import Path
import shutil
import sys
import threading
import time
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'puretv-joystick'))
from joystick_sdk import JoystickClient, KEYS
import server as receiver

spec = importlib.util.spec_from_file_location('qa_plan', ROOT / 'joystick-games/tools/qa-plan.py')
plans = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plans)

BRIDGE = """
(() => {
  let latest = '{"players":[]}';
  window.PureGameHost = {
    snapshot: () => latest,
    getInfo: () => JSON.stringify({wifiController: {state: 'ready', port: TCP_PORT,
      serviceName: 'pureTV loopback test', addresses: ['127.0.0.1']}})
  };
  async function sample() {
    try { latest = await (await fetch('/_controller', {cache:'no-store'})).text(); }
    finally { setTimeout(sample, 25); }
  }
  sample();
})();
"""


class WebHost(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path != '/_controller':
            return super().do_GET()
        with receiver.state_lock:
            players = [
                dict(id=1, controllerId=identity, connected=True, inputActive=True,
                     transport='wifi', session=str(id(state['owner'])),
                     buttons={k: k in state['pressed'] for k in KEYS})
                for identity, state in receiver.controllers.items() if state['owner'] is not None
            ]
        data = json.dumps({'players': players, 'inputActive': True}).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):
        pass


@contextmanager
def serving(server):
    with server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield server.server_address[1]
        finally:
            server.shutdown()
            thread.join()


@contextmanager
def keep_alive(client):
    stop = threading.Event()
    def ping():
        while not stop.wait(3):
            try:
                client.ping()
            except OSError:
                pass
    worker = threading.Thread(target=ping, daemon=True)
    worker.start()
    try:
        yield
    finally:
        stop.set()
        worker.join()


def wait_state(page, condition, label, timeout=30):
    deadline = time.monotonic() + timeout
    last = None
    while time.monotonic() < deadline:
        last = page.evaluate('() => window.JoystickGameQA?.snapshot()')
        if last:
            if last.get('errors'):
                raise AssertionError((label, last['errors']))
            if condition(last):
                return last
        page.wait_for_timeout(80)
    raise TimeoutError((label, last))


def press(page, client, keys, hold, condition, label, timeout=30):
    for key in keys:
        client.button(key, 'down')
    try:
        wait_state(page, lambda s: all(s['controller']['buttons'][k] for k in keys), label + ' pressed', timeout)
        page.wait_for_timeout(hold)
    finally:
        for key in keys:
            client.button(key, 'up')
    return wait_state(page, lambda s: not any(s['controller']['buttons'].values()) and condition(s), label, timeout)


def run_case(browser, game, plan, out, width, height):
    handler = functools.partial(WebHost, directory=str(game / 'dist'))
    context = browser.new_context(viewport={'width': width, 'height': height})
    errors, external = [], []
    report = {'viewport': [width, height], 'steps': [], 'status': 'running'}
    prefix = out / str(width)
    prefix.mkdir(parents=True, exist_ok=True)
    with serving(receiver.Server(('127.0.0.1', 0), receiver.Receiver)) as tcp_port, \
         serving(ThreadingHTTPServer(('127.0.0.1', 0), handler)) as http_port:
        page = context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        def route(request):
            url = urlsplit(request.request.url)
            if url.scheme in ('blob', 'data') or url.netloc == f'127.0.0.1:{http_port}':
                request.continue_()
            else:
                external.append(request.request.url)
                request.abort()
        context.route('**/*', route)
        page.add_init_script(BRIDGE.replace('TCP_PORT', str(tcp_port)))
        client = JoystickClient('127.0.0.1', tcp_port)
        with keep_alive(client):
            try:
                client.connect()
                page.goto(f'http://127.0.0.1:{http_port}/tv.html', wait_until='domcontentloaded')
                menu = wait_state(page, lambda s: s['stage'] == 'menu' and s['frames'] > 2 and
                                  s['controller']['connected'], 'menu and SDK')
                assert menu['renderer'] in plans.accepted_renderers(plan)
                assert menu['game'] == game.name
                page.screenshot(path=str(prefix / 'menu.jpg'), quality=82)
                for step in plan['steps']:
                    before = page.evaluate('() => JoystickGameQA.snapshot()')
                    result = press(page, client, step['keys'], step['holdMs'],
                                   lambda s: plans.matches(step['expect'], s, before),
                                   step['name'], step.get('timeoutSeconds', 30))
                    observations = {e['path']: plans.read_path(result, e['path']) for e in step['expect']}
                    report['steps'].append({'name': step['name'], 'keys': step['keys'], 'observed': observations})
                playing = wait_state(page, lambda s: s['stage'] == 'playing', 'playing')
                page.screenshot(path=str(prefix / 'playing.jpg'), quality=85)
                client.disconnect()
                paused = wait_state(page, lambda s: s['paused'] and not s['controller']['connected'], 'disconnect')
                fresh = wait_state(page, lambda s: s['frames'] >= paused['frames'] + 3, 'paused frames')
                for path in plan['pauseStablePaths']:
                    assert plans.read_path(paused, path) == plans.read_path(fresh, path), path
                client.connect()
                wait_state(page, lambda s: s['controller']['connected'] and s['paused'], 'reconnect paused')
                press(page, client, ['START'], 120, lambda s: s['stage'] == 'playing' and not s['paused'], 'resume')
                assert not external and not errors, (external, errors)
                report.update(status='passed', renderer=playing['renderer'], disconnectPause=True, explicitResume=True)
            finally:
                report.update(externalRequests=external, pageErrors=errors)
                client.disconnect()
                context.close()
                (prefix / 'report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    return report


def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('game')
    args.add_argument('output', type=Path)
    args.add_argument('--chromium', default=shutil.which('chromium'))
    args.add_argument('--width', type=int, choices=(960, 1280), action='append')
    options = args.parse_args()
    game = ROOT / 'joystick-games' / options.game
    plan = plans.load_plan(game / 'qa-plan.json')
    hashes = {p.relative_to(game / 'dist').as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
              for p in sorted((game / 'dist').rglob('*')) if p.is_file()}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=options.chromium, args=[
            '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        results = [run_case(browser, game, plan, options.output, width, width * 9 // 16)
                   for width in options.width or (960, 1280)]
        browser.close()
    report = dict(game=game.name, dist=hashes, results=results, transport='original SDK over loopback TCP; browser host shim',
                  physicalControllerTested=False, physicalTvTested=False)
    (options.output / 'browser.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
