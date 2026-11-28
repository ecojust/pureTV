#!/usr/bin/env python3
"""Check the installed TV game using screen pixels and ordinary Android input."""
import argparse
import csv
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import time
import zipfile

from PIL import Image, ImageChops, ImageDraw, ImageStat

from qa import COMPONENT, Device


def normalize(label):
    return ''.join(c for c in label.casefold() if c.isalnum())


def locate_text(image, labels, lang):
    # Read text from the actual screen. Preserve line/word geometry for multi-word buttons.
    encoded = io.BytesIO()
    image.save(encoded, format='PNG')
    result = subprocess.run(['tesseract', 'stdin', 'stdout', '-l', lang, '--psm', '11', 'tsv'],
                            input=encoded.getvalue(), capture_output=True, timeout=15, check=True)
    lines = {}
    for row in csv.DictReader(io.StringIO(result.stdout.decode()), delimiter='\t', quoting=csv.QUOTE_NONE):
        word = row.get('text', '').strip()
        if word and row['level'] == '5':
            group = tuple(row[k] for k in ('block_num', 'par_num', 'line_num'))
            lines.setdefault(group, []).append(row)
    for label in labels:
        wanted = normalize(label)
        for words in lines.values():
            for i in range(len(words)):
                joined = ''
                for j in range(i, len(words)):
                    joined += normalize(words[j]['text'])
                    if wanted in joined:
                        hit = words[i:j + 1]
                        # Prefer the shortest word sequence containing the requested label.
                        while len(hit) > 1 and wanted in normalize(''.join(w['text'] for w in hit[1:])):
                            hit = hit[1:]
                        x0 = min(int(w['left']) for w in hit)
                        y0 = min(int(w['top']) for w in hit)
                        x1 = max(int(w['left']) + int(w['width']) for w in hit)
                        y1 = max(int(w['top']) + int(w['height']) for w in hit)
                        return {'text': ' '.join(w['text'] for w in hit), 'bounds': (x0, y0, x1, y1)}
    return None


class Screen:
    def __init__(self, device, game_id, report):
        self.device = device
        self.game_id = game_id
        self.report = report
        self.start = None
        self.reference = None

    def raw(self):
        image = self.device.adb('exec-out', 'screencap', '-p', binary=True)
        return Image.open(io.BytesIO(image)).convert('RGB')

    def begin(self):
        # A native catalog uses the left half for the six card buttons and the right
        # half for its pairing data. No WebView accessibility session is needed.
        self.reference = self.raw()
        self.device.key('KEYCODE_DPAD_CENTER')
        self.start = time.monotonic()

    def frame(self):
        image = self.raw()
        width, height = image.size
        signature = (0, 0, width // 2, height // 8)
        delta = ImageStat.Stat(ImageChops.difference(image.crop(signature), self.reference.crop(signature))).mean
        if max(delta) < 3:
            draw = ImageDraw.Draw(image)
            draw.rectangle((int(width * .40), height // 8, width, height), fill='black')
        elapsed = time.monotonic() - self.start
        for threshold in (15, 45, 90):
            name = str(threshold) + 's'
            if elapsed >= threshold and name not in self.report['frames']:
                self.write(image, name)
        return image

    def write(self, image, name):
        path = self.device.out / f'{self.game_id}-visual-{name}.png'
        image.save(path)
        self.report['frames'][name] = round(time.monotonic() - self.start, 1)

    def capture(self, name):
        image = self.frame()
        self.write(image, name)
        return image

    def key(self, *keys):
        self.device.key(*keys)

    def tap(self, x, y):
        self.device.shell('input', 'tap', round(x), round(y))

    def see_text(self, labels, lang='eng', timeout=90):
        until = time.monotonic() + timeout
        while time.monotonic() < until:
            hit = locate_text(self.frame(), labels, lang)
            if hit:
                return hit
            time.sleep(1)
        raise RuntimeError('Could not read ' + ' / '.join(labels) + ' on the author screen')

    def tap_text(self, labels, lang='eng', timeout=90):
        hit = self.see_text(labels, lang, timeout)
        x0, y0, x1, y1 = hit['bounds']
        self.tap((x0 + x1) / 2, (y0 + y1) / 2)
        return hit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apk', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--case', choices=['daejeon-campus', 'noir-extreme'], required=True)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    device = Device(os.environ.get('ANDROID_SERIAL'), args.out)
    game = {'frames': {}}
    report = {'case': args.case, 'passed': False, 'physicalTvTested': False, 'physicalControllerTested': False,
              'apkSha256': hashlib.sha256(args.apk.read_bytes()).hexdigest(), 'method': 'ADB screenshots and normal input',
              'controllers': {}, 'games': {args.case: game}}
    screen = Screen(device, args.case, game)
    try:
        device.wait_for_ready(report)
        if 'android.software.leanback' not in device.shell('pm', 'list', 'features'):
            raise RuntimeError('Expected an Android TV image')
        report['fingerprint'] = device.shell('getprop', 'ro.build.fingerprint')
        with zipfile.ZipFile(args.apk) as z:
            games = json.loads(z.read('assets/hosted-games.json'))
        index = next(i for i, entry in enumerate(games) if entry['id'] == args.case)
        device.adb('install', '-r', args.apk.resolve())
        device.shell('am', 'start', '-W', '-n', COMPONENT)
        device.focused(games[0]['zh'])
        device.key(*(['KEYCODE_DPAD_DOWN'] * index))
        device.focused(games[index]['zh'])
        game['cardFocused'] = games[index]['zh']
        screen.begin()
        from visual_actions import play_visual
        game.update(play_visual(screen, args.case))
        screen.capture('played')
        report['passed'] = True
    except Exception as error:
        game['error'] = str(error)
        if screen.start:
            try:
                screen.capture('failure')
            except (OSError, subprocess.SubprocessError) as failure:
                game['screenshotError'] = str(failure)
    finally:
        try:
            text = device.shell('dumpsys', 'activity', 'activities')
            match = re.search(r'(?:topResumedActivity|mResumedActivity)=ActivityRecord\{[^\n]*?\bu\d+\s+(\S+)', text)
            if match:
                report['foreground'] = match[1]
        except (OSError, subprocess.SubprocessError):
            pass
        (args.out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps(report, ensure_ascii=False), flush=True)
    raise SystemExit(0 if report['passed'] else 1)


if __name__ == '__main__':
    main()
