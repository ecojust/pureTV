#!/usr/bin/env python3
"""Against a local tv.html, press the trigger on the first resumed input frame."""
import argparse
import json
import shutil
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

PAD = """
(() => {
  const pad = window.testPad = {
    id: 'QA USB', index: 0, mapping: 'standard', connected: true,
    axes: [0, 0, 0, 0],
    buttons: Array.from({length: 17}, () => ({ pressed: false })),
  };
  Object.defineProperty(navigator, 'getGamepads', {value: () => [pad]});
  window.PureGameHost = {
    getInfo: () => '{}',
    snapshot: () => '{"players":[]}',
    publish: payload => {
      if (window.testResume && JSON.parse(payload).stage === 'playing') {
        window.testResume = false;
        pad.buttons[9].pressed = false;
        pad.buttons[7].pressed = true;
        pad.axes = [.65, 0, .55, -.6];
      }
    }
  };
})();
"""


def run(args):
    parsed = urlsplit(args.url)
    if parsed.scheme != 'http' or parsed.hostname not in ('127.0.0.1', 'localhost', '::1'):
        raise ValueError('Pass an HTTP URL served on loopback')
    origin = f'{parsed.scheme}://{parsed.netloc}/'
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=args.chromium, args=[
            '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
        ] if args.software else [])
        page = browser.new_page(viewport={'width': 960, 'height': 540})
        page.set_default_timeout(240_000)
        page.route('**/*', lambda r: r.continue_() if r.request.url.startswith(origin) else r.abort())
        page.add_init_script(PAD)
        page.goto(args.url, wait_until='domcontentloaded')
        page.wait_for_function('window.JoystickGameQA?.snapshot().ready')
        for stage in ('playing', 'paused'):
            page.evaluate('testPad.buttons[9].pressed = true')
            page.wait_for_function("stage => JoystickGameQA.snapshot().stage === stage", arg=stage)
            page.evaluate('testPad.buttons[9].pressed = false')
            page.wait_for_function('!JoystickGameQA.snapshot().controller.buttons.START')
        before = page.evaluate('JoystickGameQA.snapshot().gameplay')
        page.evaluate('window.testResume = true; testPad.buttons[9].pressed = true')
        page.wait_for_function("""before => {
            const g = JoystickGameQA.snapshot().gameplay;
            return g.shots > before.shots && Math.abs(g.yaw-before.yaw) > .002 &&
              Math.abs(g.pitch-before.pitch) > .002 && (g.x !== before.x || g.z !== before.z);
        }""", arg=before, timeout=90_000)
        print(json.dumps({'before': before, 'after': page.evaluate('JoystickGameQA.snapshot().gameplay')}))
        browser.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('url')
    parser.add_argument('--chromium', default=shutil.which('chromium'))
    parser.add_argument('--software', action='store_true')
    run(parser.parse_args())
