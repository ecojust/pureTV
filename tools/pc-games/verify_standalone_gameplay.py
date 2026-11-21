"""Exercise the 21 standalone game payloads using real keyboard events in Chromium.

python tools/pc-games/verify_standalone_gameplay.py INPUT_DIRECTORY --browser /usr/bin/chromium
Each INPUT_DIRECTORY/<game>/game.apk is the signed input used by the package builders.
"""
import argparse
from contextlib import contextmanager
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright


MOVEMENT = {'adventure-island', 'alien-shooter', 'bomb-jack', 'jackal', 'super-mario', 'tank'}
PIECES = {'tetris': 'piece', 'jewel': 'active'}
RESOURCE = MOVEMENT | PIECES.keys() | {'coast-kart', 'neon-rush', 'tower-overlap', 'used-car-racing'}
JOYSTICK = {'cf-transport-ship', 'clawd-pop', 'emberbrood', 'glup', 'lumenrift', 'operation-ironhold',
            'qq-speed', 'saber-magic-tower', 'turbo-kart-rally'}
SOFTWARE_2D = (RESOURCE - {'alien-shooter', 'coast-kart', 'neon-rush', 'used-car-racing'}) | {
    'emberbrood', 'glup', 'lumenrift'}


@contextmanager
def desktop(slug, apk):
    command = [sys.executable, '-u', str(Path(__file__).with_name('host.py')), '--game', slug,
               '--apk', str(apk), '--http-port', '0', '--controller-port', '0', '--no-browser']
    proc = subprocess.Popen(command, stdout=subprocess.PIPE, text=True)
    try:
        address = proc.stdout.readline()
        if not address.startswith('Game: '):
            raise RuntimeError(f'{slug} host failed to start: {address}')
        yield address.split()[1]
    finally:
        proc.terminate()
        proc.wait(timeout=20)
        proc.stdout.close()


def field(state, path):
    for key in path.split('.'):
        if isinstance(state, list) and key.isdecimal() and int(key) < len(state):
            state = state[int(key)]
        elif isinstance(state, dict) and key in state:
            state = state[key]
        else:
            return None
    return state


def exercise(page, url, slug):
    errors, checks = [], []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.goto(url + ('?quality=low' if slug == 'clawd-pop' else ''), wait_until='domcontentloaded',
              timeout=180000)
    page.bring_to_front()
    api = 'PureTVQA' if slug in RESOURCE else 'JoystickGameQA'

    def read():
        return page.evaluate(f'() => window.{api}?.snapshot() || {{}}')

    def wait(path, accepts, timeout=120):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            state = read()
            value = field(state, path)
            if state.get('webglError') or state.get('stage') == 'error':
                raise RuntimeError(str(state.get('error') or state.get('message') or state['stage']))
            if accepts(value):
                return value
            page.wait_for_timeout(100)
        raise TimeoutError(f'{slug}: {path} stayed at {value!r}')

    def press(key):
        page.keyboard.press(key, delay=180)
        page.wait_for_timeout(120)

    def act(key, path, accepts):
        before = field(read(), path)
        if accepts(before):
            raise ValueError(f'{slug}: expected a change in {path}, initially {before!r}')
        page.keyboard.down(key)
        try:
            after = wait(path, accepts)
        finally:
            page.keyboard.up(key)
        checks.append(dict(key=key, field=path, before=before, after=after))
        page.wait_for_timeout(150)

    def equals(value):
        return lambda actual: actual == value

    def increase(key, path):
        start = field(read(), path)
        act(key, path, lambda value: value is not None and value > start)

    def changed(key, path):
        start = field(read(), path)
        act(key, path, lambda value: value is not None and value != start)

    stage = 'phase' if slug in RESOURCE else 'stage'
    wait(stage, lambda value: bool(value) and value != 'loading', 180)
    if slug in RESOURCE:
        target = {'jackal': 'intro', 'tank': 'stageintro', 'used-car-racing': 'countdown'}.get(slug, 'playing')
        start_key = 'Enter' if slug == 'neon-rush' else 'p'
        act(start_key, stage, equals(target))
        if slug == 'tank':
            # The second START confirms the selected stage. Wait for the tank to spawn.
            press(start_key)
            wait('players.0.alive', equals(True))
            wait('players.0.spawnFrames', lambda ticks: not ticks)
        if slug == 'jackal':
            wait(stage, equals('playing'))
        if slug in MOVEMENT:
            increase('ArrowRight', 'players.0.x')
        elif slug in PIECES:
            increase('ArrowRight', f'players.0.{PIECES[slug]}.x')
        elif slug == 'tower-overlap':
            increase('Space', 'model.drops')
        elif slug == 'neon-rush':
            wait('model.cars.0.speed', lambda speed: speed is not None and speed > 10)
            increase('b', 'model.stats.nitros')
        elif slug == 'used-car-racing':
            wait(stage, equals('race'))
            act('ArrowUp', 'players.0.speed', lambda speed: speed is not None and speed > 1)
        elif slug == 'coast-kart':
            wait('players.0.speed', lambda speed: speed is not None and speed > 10)
            start = field(read(), 'players.0.x')
            act('ArrowLeft', 'players.0.x', lambda x: x is not None and x < start - .05)
    elif slug == 'emberbrood':
        act('Enter', 'gameplay.rosterCount', equals(1))
    elif slug == 'glup':
        for screen in ('cine', 'title', 'select', 'play'):
            if screen == 'select':
                wait('gameplay.titleTick', lambda tick: tick is not None and tick >= 170)
            if screen == 'title':
                wait('gameplay.introTick', lambda tick: tick is not None and tick >= 30)
            act('Enter', 'gameplay.screen', equals(screen))
        wait('gameplay.arrival', equals(False))
        increase('ArrowRight', 'gameplay.playerX')
    elif slug == 'turbo-kart-rally':
        act('Enter', 'gameplay.mode', equals('select'))
        increase('ArrowRight', 'gameplay.characterIndex')
        press('Enter')
        act('Enter', 'gameplay.mode', equals('intro'))
        # The first moment of the intro can still be loading its course.
        for _ in range(5):
            page.wait_for_timeout(750)
            if field(read(), 'gameplay.mode') == 'racing':
                break
            press('Enter')
        wait('gameplay.mode', equals('racing'))
        act('ArrowUp', 'gameplay.speed', lambda speed: speed is not None and speed > 4)
    elif slug in ('qq-speed', 'cf-transport-ship'):
        page.locator('#start' if slug == 'qq-speed' else '#btnStart').focus()
        # HTML activates a focused button on a complete Enter keypress.
        before = field(read(), stage)
        press('Enter')
        after = wait(stage, lambda value: value in ('race', 'countdown', 'playing'))
        checks.append(dict(key='Enter', field=stage, before=before, after=after))
        if slug == 'qq-speed':
            act('p', stage, equals('paused'))
        else:
            changed('w', 'player.position')
    else:
        key = {'saber-magic-tower': 'z', 'operation-ironhold': 'Enter'}.get(slug, 'p')
        act(key, stage, equals('playing'))
        if slug == 'lumenrift':
            act('l', 'gameplay.toolbar', equals(True))
        elif slug == 'saber-magic-tower':
            increase('ArrowRight', 'gameplay.steps')
        else:
            if slug == 'clawd-pop':
                wait('gameplay.time', lambda elapsed: elapsed is not None and elapsed > 1.5)
            increase('z', 'gameplay.shots')
    if errors:
        raise RuntimeError(str(errors))
    return checks


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('inputs', type=Path)
    parser.add_argument('games', nargs='*', help='default: all 21 standalone payloads')
    parser.add_argument('--browser', help='installed Chromium executable')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    games = args.games or sorted(RESOURCE | JOYSTICK)
    unknown = set(games) - (RESOURCE | JOYSTICK)
    if unknown:
        parser.error(f'Unrecognized games: {sorted(unknown)}')
    results = []
    with sync_playwright() as playwright:
        for slug in games:
            result = {'game': slug}
            try:
                apk = args.inputs / slug / 'game.apk'
                with apk.open('rb') as stream:
                    result['sha256'] = hashlib.file_digest(stream, 'sha256').hexdigest()
                flags = []
                if sys.platform == 'linux':
                    flags = (['--disable-gpu', '--disable-software-rasterizer'] if slug in SOFTWARE_2D
                             else ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist',
                                   '--enable-unsafe-swiftshader'])
                with desktop(slug, apk) as url:
                    browser = playwright.chromium.launch(executable_path=args.browser, args=flags)
                    try:
                        page = browser.new_page(viewport={'width': 640, 'height': 360}, device_scale_factor=.5)
                        result['checks'] = exercise(page, url, slug)
                        result['ok'] = True
                    finally:
                        browser.close()
            except Exception as exc:
                result.update(ok=False, error=str(exc))
            results.append(result)
            print(json.dumps(result, ensure_ascii=False), flush=True)
    if args.report:
        args.report.write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return not all(result['ok'] for result in results)


if __name__ == '__main__':
    sys.exit(main())
