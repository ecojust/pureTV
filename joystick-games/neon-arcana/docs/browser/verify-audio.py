"""Compare the original and patched offline pages across their native lifecycle entry points."""
import argparse
import functools
import hashlib
import http.server
import json
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--before', type=Path, help='Optional directory with the original frozen tv.html')
parser.add_argument('--after', type=Path, default=Path(__file__).resolve().parents[2] / 'dist')
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--chromium', default='/usr/bin/chromium')
args = parser.parse_args()


class QuietFiles(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def verify(browser, label, root):
    with http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietFiles, directory=root)) as host:
        threading.Thread(target=host.serve_forever, daemon=True).start()
        ctx = browser.new_context(viewport=dict(width=640, height=360), device_scale_factor=0.35)
        try:
            page = ctx.new_page()
            page.set_default_timeout(240000)
            page.on('pageerror', lambda e: print(label, 'JavaScript:', e, flush=True))
            print(label, 'opening packed game', flush=True)
            page.goto(f'http://127.0.0.1:{host.server_port}/tv.html', wait_until='commit')
            page.wait_for_function('window.JoystickGameQA?.snapshot().frames > 1', polling=500)
            print(label, 'model ready', flush=True)
            page.get_by_role('button', name='Begin the Restoration').click()
            page.wait_for_function("JoystickGameQA.snapshot().stage==='playing' && JoystickGameQA.snapshot().audioState==='running'")
            def state():
                return page.evaluate('''() => {const s=JoystickGameQA.snapshot();return {stage:s.stage,audio:s.audioState,frames:s.frames,errors:s.errors}}''')
            def wait_frames():
                page.wait_for_function('n=>JoystickGameQA.snapshot().frames >= n',arg=state()['frames']+2)
            def key(name):
                page.evaluate('k=>PureGame.key(k,true)',name)
                wait_frames()
                page.evaluate('k=>PureGame.key(k,false)',name)
                wait_frames()
            result = dict(sha256=hashlib.sha256((root/'tv.html').read_bytes()).hexdigest(), initial=state(), cases=[])
            print(label, 'initial', result['initial'], flush=True)
            for lose, gain in [('PureGame.focus(false)', 'PureGame.focus(true)'),
                               ('PureGame.suspend(true)', 'PureGame.suspend(false)')]:
                page.evaluate(lose)
                wait_frames()
                hidden = state()
                assert hidden['stage'] == 'paused'
                expected = 'suspended' if label == 'after' else 'running'
                assert hidden['audio'] == expected, hidden
                page.evaluate(gain)
                key('b')
                ordinary = state()
                assert ordinary['stage'] == 'paused' and ordinary['audio'] == expected, ordinary
                key('Start')
                page.wait_for_function("JoystickGameQA.snapshot().stage==='playing' && JoystickGameQA.snapshot().audioState==='running'")
                continued = state()
                assert not any(s['errors'] for s in [hidden, ordinary, continued])
                case=dict(lifecycle=lose, loss=hidden, foregroundWithB=ordinary, explicitStart=continued)
                result['cases'].append(case)
                print(label, lose, hidden['audio'], ordinary['audio'], continued['audio'], flush=True)
            return result
        finally:
            ctx.close()
            host.shutdown()


with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=args.chromium, args=[
        '--no-sandbox','--use-gl=angle','--use-angle=gl-egl','--ignore-gpu-blocklist',
        '--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
    try:
        results={'chromium':browser.version}
        for label, root in [('before',args.before),('after',args.after)]:
            if root:
                results[label] = verify(browser,label,root.resolve())
                args.output.write_text(json.dumps(results,indent=2)+'\n')
    finally:
        browser.close()
