#!/usr/bin/env python3
"""Drive the installed APK with Android input. Save screenshots and accessibility evidence."""
import argparse
from contextlib import contextmanager, suppress
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET
import zipfile

from PIL import Image, ImageChops, ImageDraw, ImageStat

from controllers import phone_input, wifi_input, wifi_play
from window_snapshot import install_sampler, read_snapshot


PACKAGE = 'com.ecojust.hostedgames'
COMPONENT = PACKAGE + '/.MainActivity'
REMOTE_XML = '/data/local/tmp/puretv-hosted-qa.xml'
AUTHOR_MARKERS = {
    'bandit': 'PLAY',
    'fish-loop': 'Fish Loop',
    'noir-extreme': 'begin',
    'struggle-bus': 'Struggle Bus',
    'vespertine': 'BEGIN THE NIGHTS',
    'daejeon-campus': '미니게임',
}


def find_label(tree, label):
    for node in tree.iter('node'):
        if any(node.get(key, '').strip().casefold() == label.casefold() for key in ('text', 'content-desc')):
            return node
    return None


def box(node):
    return tuple(map(int, re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node.get('bounds')).groups()))


class Device:
    def __init__(self, serial, out):
        sdk = os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT')
        adb = Path(sdk) / 'platform-tools/adb' if sdk else Path('adb')
        self.prefix = [str(adb)]
        if serial:
            self.prefix += ['-s', serial]
        self.out = out
        self.last_xml = None
        self.sampler_ready = False

    def adb(self, *args, binary=False):
        result = subprocess.run([*self.prefix, *map(str, args)], capture_output=True, timeout=45, check=True)
        return result.stdout if binary else result.stdout.decode('utf-8', errors='replace').strip()

    def shell(self, *args):
        return self.adb('shell', *args)

    def wait_for_ready(self, report):
        # sys.boot_completed may precede an adbd restart. Wait for the package manager
        # and consecutive, stable transport responses before installing the APK.
        ready = 0
        deadline = time.monotonic() + 120
        issue = 'Android package manager is not ready'
        while time.monotonic() < deadline:
            try:
                booted = self.shell('getprop', 'sys.boot_completed') == '1'
                if booted and self.shell('pm', 'path', 'android').startswith('package:'):
                    ready += 1
                    if ready == 2:
                        return
                else:
                    ready = 0
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
                ready = 0
                issue = (error.stderr or b'ADB did not respond').decode(errors='replace').strip()
                report['lastBootTransportError'] = issue
            time.sleep(2)
        raise RuntimeError('Emulator did not stabilize: ' + issue)

    def key(self, *keys):
        self.shell('input', 'keyevent', *keys)

    def tree(self):
        if self.sampler_ready:
            try:
                raw = read_snapshot(self)
                tree = ET.fromstring(raw)
                self.last_xml = raw
                return tree
            except (ET.ParseError, OSError, subprocess.SubprocessError) as error:
                print('Live accessibility sampler unavailable; retrying Android system dump:', str(error)[:250], flush=True)
        # Native catalog trees can also be captured with the SDK's stock command.
        self.shell('rm', '-f', REMOTE_XML)
        message = self.shell('uiautomator', 'dump', REMOTE_XML)
        if 'ERROR:' in message:
            raise RuntimeError(message[:300])
        raw = self.adb('exec-out', 'cat', REMOTE_XML, binary=True)
        tree = ET.fromstring(raw)
        self.last_xml = raw
        return tree

    def until(self, description, check, timeout=40):
        deadline = time.monotonic() + timeout
        last_issue = ''
        captures = 0
        while time.monotonic() < deadline:
            try:
                tree = self.tree()
            except (ET.ParseError, RuntimeError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
                last_issue = str(error)[:250]
                time.sleep(.5)
                continue
            captures += 1
            result = check(tree)
            if result is not None and result is not False:
                return result
            time.sleep(.4)
        detail = f'{captures} fresh snapshots' + (', last capture failure: ' + last_issue if last_issue else '')
        raise RuntimeError(f'Android UI did not show {description} ({detail})')

    def label(self, text, timeout=40):
        return self.until(text, lambda tree: find_label(tree, text), timeout)

    def select_dialog_button(self, text):
        for _ in range(5):
            tree = self.until('fresh dialog hierarchy', lambda tree: tree)
            focus = next((n for n in tree.iter('node') if n.get('focused') == 'true'), None)
            target = find_label(tree, text)
            if focus is None or target is None:
                break
            if focus.get('text') == text:
                self.key('KEYCODE_DPAD_CENTER')
                return
            x0, y0, x1, y1 = box(target)
            a, b, c, d = box(focus)
            dx, dy = x0 + x1 - a - c, y0 + y1 - b - d
            if abs(dy) > abs(dx):
                direction = 'DOWN' if dy > 0 else 'UP'
            else:
                direction = 'RIGHT' if dx > 0 else 'LEFT'
            self.key('KEYCODE_DPAD_' + direction)
        raise RuntimeError('Could not select dialog button with TV remote: ' + text)

    def cursor_click(self, target):
        """Aim with remote D-pad pulses and confirm the on-screen cursor is over the target."""
        x0, y0, x1, y1 = target
        web = self.until('game WebView', lambda tree: next(
            (n for n in tree.iter('node') if n.get('class') == 'android.webkit.WebView'), None))
        left, top, right, bottom = box(web)
        step = .009 * max(right - left, bottom - top)
        for _ in range(8):
            mx0, my0, mx1, my1 = box(self.label('游戏光标'))
            mx, my = (mx0 + mx1) / 2, (my0 + my1) / 2
            if x0 <= mx < x1 and y0 <= my < y1:
                self.key('KEYCODE_DPAD_CENTER')
                return
            directions = []
            for pos, low, high, backwards, forwards in (
                    (mx, x0, x1, 'LEFT', 'RIGHT'), (my, y0, y1, 'UP', 'DOWN')):
                if low <= pos < high:
                    continue
                delta = (low + high) / 2 - pos
                nudge = 'KEYCODE_DPAD_' + (backwards if delta < 0 else forwards)
                directions.extend([nudge] * max(1, min(32, round(abs(delta) / step))))
            self.key(*directions)
        raise RuntimeError('TV cursor did not reach author control at ' + str(target))

    def click_author_label(self, label):
        self.cursor_click(box(self.label(label)))

    def focused(self, title):
        def probe(tree):
            return next((n for n in tree.iter('node') if n.get('focused') == 'true' and n.get('text') == title), None)
        return self.until('remote focus on ' + title, probe)

    def screenshot(self, name, *, mask_pairing=False):
        data = self.adb('exec-out', 'screencap', '-p', binary=True)
        image = Image.open(io.BytesIO(data)).convert('RGB')
        if mask_pairing:
            # Pairing addresses and QR codes can appear in the launcher and the native guide.
            # Obtain fresh bounds and mask the full view of each code or address.
            draw = ImageDraw.Draw(image)
            for node in self.until('fresh pairing bounds', lambda tree: tree).iter('node'):
                label = node.get('content-desc', '') + ' ' + node.get('text', '')
                if '二维码' in label or 'room=' in label:
                    draw.rectangle(box(node), fill='black')
            image.save(self.out / (name + '.png'))
        else:
            (self.out / (name + '.png')).write_bytes(data)
        return image

    def xml(self, name):
        if self.last_xml:
            tree = ET.fromstring(self.last_xml)
            for node in tree.iter('node'):
                for attribute in ('text', 'content-desc'):
                    label = node.get(attribute, '')
                    if 'room=' in label:
                        node.set(attribute, '[pairing address omitted]')
            (self.out / (name + '.xml')).write_bytes(ET.tostring(tree, encoding='utf-8'))

    def verify_pointer(self):
        before = box(self.label('游戏光标'))
        self.key('KEYCODE_DPAD_RIGHT')
        def moved(tree):
            node = find_label(tree, '游戏光标')
            return box(node) if node is not None and box(node)[0] > before[0] else None
        after = self.until('rightward movement of the native game cursor', moved)
        return {'before': before, 'afterDpadRight': after}


@contextmanager
def offline_proxy(device):
    # Keep ADB connected. Affect only the disposable emulator's HTTP(S) traffic.
    old = device.shell('settings', 'get', 'global', 'http_proxy')
    try:
        device.shell('settings', 'put', 'global', 'http_proxy', '127.0.0.1:1')
        yield
    finally:
        device.shell('settings', 'put', 'global', 'http_proxy', old if old != 'null' else ':0')
        if old == 'null':
            device.shell('settings', 'delete', 'global', 'http_proxy')


def fish_action(device):
    # The author uses a centered 1080x1920 FIT canvas; level 1's first bus is at (540,490).
    # Undo's fixed icon visibly changes from disabled to enabled after the first move.
    web = device.until('game WebView', lambda tree: next(
        (n for n in tree.iter('node') if n.get('class') == 'android.webkit.WebView'), None))
    left, top, right, bottom = box(web)
    scale = min((right - left) / 1080, (bottom - top) / 1920)

    def point(x, y):
        return (round((left + right) / 2 + (x - 540) * scale), round((top + bottom) / 2 + (y - 960) * scale))

    undo = (*point(316, 1766), *point(364, 1814))
    # Wait for the fixed colored control, excluding the loading screen and flat page background.
    deadline = time.monotonic() + 80
    while True:
        before = device.screenshot('fish-loop-before')
        if max(ImageStat.Stat(before.crop(undo)).stddev) >= 15:
            break
        if time.monotonic() > deadline:
            raise RuntimeError('Fish Loop Undo control did not render')
        time.sleep(.8)
    device.cursor_click((*point(450, 455), *point(630, 525)))
    time.sleep(1)
    after = device.screenshot('fish-loop-after')
    difference = ImageStat.Stat(ImageChops.difference(before.crop(undo), after.crop(undo))).mean
    if max(difference) < 8:
        raise RuntimeError('Fish Loop Undo icon did not change after the fish bus was tapped')
    return {'action': 'D-pad and OK selected the first bus; Undo icon changed', 'undoRegion': undo, 'meanChannelDifference': difference}


def author_action(device, game_id):
    if game_id == 'fish-loop':
        return fish_action(device)
    if game_id == 'bandit':
        device.click_author_label('PLAY')
        device.label('SAFEHOUSE', timeout=85)
        return {'observed': 'PLAY joined the author’s multiplayer SAFEHOUSE lobby'}
    if game_id == 'daejeon-campus':
        device.click_author_label('미니게임')
        device.until('a Korean game start button', lambda tree: next(
            (n for n in tree.iter('node') if '게임 시작' in (n.get('text', '') + n.get('content-desc', ''))), None))
        return {'observed': 'Korean minigame selection opened'}
    if game_id == 'vespertine':
        device.click_author_label('BEGIN THE NIGHTS')
        device.click_author_label('ROW OUT')
        device.label('DAWN')
        device.key('KEYCODE_BUTTON_Y')
        device.label('BEGIN THE NIGHTS')
        return {'observed': 'Rowed out, DAWN appeared, controller Y returned to shore'}
    if game_id == 'noir-extreme':
        device.click_author_label('begin')
        device.until('NOIR title menu to close', lambda tree:
                     find_label(tree, '游戏光标') is not None and find_label(tree, 'begin') is None)
        return {'observed': 'Selected BEGIN and the title menu closed'}
    if game_id == 'struggle-bus':
        # This title draws its HUD in canvases and has no accessibility state for steering.
        # Capture its pixels before and after input; retain the scope of what was observable.
        device.key('KEYCODE_MEDIA_PLAY_PAUSE')
        device.until('driving mode (cursor hidden)', lambda tree:
                     find_label(tree, '游戏光标') is None and find_label(tree, 'Struggle Bus') is not None)
        device.key('KEYCODE_DPAD_RIGHT', 'KEYCODE_BUTTON_A')
        return {'observed': 'Driving mode selected', 'inputsSent': ['D-pad right', 'A'],
                'unverified': 'Steering and paint effects inside the author canvas'}


def run_game(device, game, result, save):
    title, game_id = game['zh'], game['id']
    device.focused(title)
    device.xml(game_id + '-card')
    result["cardFocused"] = title
    save()
    if game_id == "bandit":
        with offline_proxy(device):
            device.key('KEYCODE_DPAD_CENTER')
            device.label('游戏加载失败')
            device.screenshot('offline-error')
        device.focused('重试')
        result['offlineRetryFocused'] = True
        save()
    device.key('KEYCODE_DPAD_CENTER')
    device.label(AUTHOR_MARKERS[game_id], timeout=110)
    device.xml(game_id + '-author')
    result['authorMarker'] = AUTHOR_MARKERS[game_id]
    save()
    result['cursor'] = device.verify_pointer()
    save()
    if game_id == 'fish-loop':
        result['wifiController'] = wifi_play(device, title)
    result.update(author_action(device, game_id))
    save()
    device.screenshot(game_id + '-played')
    device.key('KEYCODE_BACK')
    device.label(title + ' · 操作说明')
    device.label('手机手柄二维码')
    device.xml(game_id + '-guide')
    device.screenshot(game_id + '-guide', mask_pairing=True)
    device.focused('继续游戏')
    device.key('KEYCODE_DPAD_CENTER')
    device.label('游戏光标' if game_id != 'struggle-bus' else 'Struggle Bus')
    device.key('KEYCODE_MENU')
    device.label(title + ' · 操作说明')
    device.select_dialog_button('返回游戏列表')
    device.focused(title)
    result['returnedFocus'] = title
    save()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apk', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--serial', help='Disposable Android TV emulator (defaults to the ADB selection)')
    parser.add_argument('--case', choices=['all', 'controllers', *AUTHOR_MARKERS], default='all')
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    device = Device(args.serial or os.environ.get('ANDROID_SERIAL'), args.out)
    report = {'case': args.case, 'passed': False, 'apkSha256': hashlib.sha256(args.apk.read_bytes()).hexdigest(), 'adb': device.prefix[0],
              'physicalTvTested': False, 'physicalControllerTested': False, 'games': {}, 'controllers': {}}
    def save():
        partial = args.out / 'report.partial'
        partial.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        partial.replace(args.out / 'report.json')

    def fresh_catalog():
        device.shell('am', 'force-stop', PACKAGE)
        device.shell('am', 'start', '-W', '-n', COMPONENT)
        device.focused(games[0]['zh'])

    save()
    try:
        device.wait_for_ready(report)
        if device.shell('getprop', 'ro.kernel.qemu') != '1' and device.shell('getprop', 'ro.boot.qemu') != '1':
            raise RuntimeError('Use a disposable Android emulator for the offline retry check')
        if 'android.software.leanback' not in device.shell('pm', 'list', 'features'):
            raise RuntimeError('Use an Android TV system image')
        report['fingerprint'] = device.shell('getprop', 'ro.build.fingerprint')
        report['webview'] = device.shell('dumpsys', 'webviewupdate').splitlines()[:8]
        with zipfile.ZipFile(args.apk) as archive:
            games = json.loads(archive.read('assets/hosted-games.json'))
        if [g['id'] for g in games] != list(AUTHOR_MARKERS):
            raise ValueError('APK catalog must contain the six requested author games, in menu order')
        try:
            install_sampler(device)
            device.sampler_ready = True
            report['accessibilitySampler'] = 'Android UiDevice.dumpWindowHierarchy'
        except (OSError, subprocess.SubprocessError, KeyError) as error:
            report['accessibilitySampler'] = 'stock uiautomator dump; sampler setup failed: ' + str(error)[:250]
            print(report['accessibilitySampler'], flush=True)
        save()
        device.adb('install', '-r', args.apk.resolve())
        if args.case in ('all', 'controllers'):
            for transport, probe in [('phone', phone_input), ('wifi', wifi_input)]:
                try:
                    fresh_catalog()
                    if transport == 'phone':
                        device.screenshot('catalog-preview', mask_pairing=True)
                    report['controllers'][transport] = probe(device, [g['zh'] for g in games])
                except Exception as error:
                    # WebSocket diagnostics can contain the ephemeral room token.
                    report['controllers'][transport] = {'error': re.sub(
                        r'room=[^\s&]+', 'room=[omitted]', str(error))}
                save()
        for index, game in enumerate(games):
            game_id = game['id']
            if args.case not in ('all', game_id):
                continue
            result = {}
            report['games'][game_id] = result
            save()
            try:
                fresh_catalog()
                if index:
                    device.key(*(['KEYCODE_DPAD_DOWN'] * index))
                run_game(device, game, result, save)
            except Exception as error:
                result['error'] = str(error)
                if device.last_xml:
                    labels = [n.get('text') or n.get('content-desc') for n in ET.fromstring(device.last_xml).iter('node')]
                    result['lastVisibleLabels'] = [v[:96] for v in labels if v and 'room=' not in v][:30]
                save()
                # Diagnostics are secondary to per-game results. Android logcat filters can
                # wait indefinitely for a matching line when the requested buffer is empty.
                with suppress(OSError, ValueError):
                    device.xml(game_id + '-failure')
            print(game_id, result, flush=True)
            save()
        report['passed'] = not any('error' in entry for group in ('games', 'controllers')
                                   for entry in report[group].values())
    except Exception as error:
        report['fatal'] = str(error)
        if isinstance(error, subprocess.CalledProcessError):
            report['adbStderr'] = (error.stderr or b'').decode(errors='replace')[:1500]
        raise
    finally:
        save()
        with suppress(subprocess.SubprocessError):
            device.shell('rm', '-f', REMOTE_XML)
    if not report['passed']:
        raise SystemExit('Android TV QA failed; see report.json and per-game evidence')


if __name__ == '__main__':
    main()
