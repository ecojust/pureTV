#!/usr/bin/env python3
"""Install all six apps together and exercise their individual TV launchers on a disposable emulator."""
import argparse
import hashlib
import json
import os
import subprocess
from pathlib import Path
import socketserver
import threading
import time
from urllib.parse import urlsplit
import zipfile

from qa import Device, find_label


class OpeningRequests(socketserver.ThreadingTCPServer):
    # Hold the author connection at the HTTPS CONNECT handshake while driving the native guide.
    # This tests cold launch routing for all six apps without depending on author site availability.
    daemon_threads = True

    def __init__(self):
        super().__init__(('127.0.0.1', 0), OpeningRequest)
        self.requests = []
        self.condition = threading.Condition()
        self.finished = threading.Event()


class OpeningRequest(socketserver.StreamRequestHandler):
    def handle(self):
        self.request.settimeout(10)
        parts = self.rfile.readline(2048).decode('ascii', 'replace').split()
        if len(parts) != 3 or parts[0] != 'CONNECT':
            return
        with self.server.condition:
            self.server.requests.append(parts[1].lower())
            self.server.condition.notify_all()
        self.server.finished.wait(120)


def resumed(device):
    for line in device.shell('dumpsys', 'activity', 'activities').splitlines():
        if any(name in line for name in ('topResumedActivity=', 'mResumedActivity=')):
            return line
    return ''


def activity_state(device, package):
    summary = device.shell('dumpsys', 'activity', 'activities')
    foreground = [line.strip() for line in summary.splitlines()
                  if 'topResumedActivity=' in line or 'mResumedActivity=' in line]
    records = [line.strip() for line in summary.splitlines()
               if 'Hist #' in line and package + '/' in line]
    return {'resumed': foreground[:4], 'gameHistory': records[:4]}


def probe(device, proxy, record, game, entry):
    package = record['packageName']
    expected = package + '/com.ecojust.hostedgames.MainActivity'
    intent = ('-a', 'android.intent.action.MAIN', '-c', 'android.intent.category.LEANBACK_LAUNCHER', '-p', package)
    component = device.shell('cmd', 'package', 'resolve-activity', '--brief', *intent).strip().splitlines()[-1]
    if component != expected:
        raise RuntimeError('Incorrect leanback activity')
    with proxy.condition:
        first = len(proxy.requests)
    device.shell('am', 'force-stop', package)
    device.shell('am', 'start', '-W', '-a', 'android.settings.SETTINGS')
    device.shell('am', 'start', '-W', '-a', 'android.intent.action.MAIN', '-c',
                 'android.intent.category.LEANBACK_LAUNCHER', '-n', component)
    origin = urlsplit(game['url'])
    author = f'{origin.hostname}:{origin.port or 443}'
    with proxy.condition:
        if not proxy.condition.wait_for(lambda: author in proxy.requests[first:], timeout=35):
            raise RuntimeError(f'Cold launch did not request {author}')
    if expected not in resumed(device):
        raise RuntimeError('Expected game activity is not in the foreground')
    entry.update(launcherActivity=component, requestedAuthor=author, catalogUrl=game['url'])
    title = record['title'] + ' · 操作说明'
    # Wait for the TV window and native input overlay before dispatching the first remote key.
    device.label('游戏光标', timeout=25)
    device.key('KEYCODE_MENU')
    device.label(title, timeout=25)
    entry['guideTitle'] = title
    device.select_dialog_button('继续游戏')
    device.until('guide closed', lambda tree: find_label(tree, title) is None, timeout=20)
    entry['continued'] = True
    device.key('KEYCODE_BACK')
    device.label(title, timeout=25)
    entry['backOpenedGuide'] = True
    device.select_dialog_button('退出游戏')
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        state = activity_state(device, package)
        if not state['gameHistory'] and all(package + '/' not in line for line in state['resumed']):
            entry.update(exited=True, finalActivity=state)
            return
        time.sleep(0.5)
    entry['finalActivity'] = state
    raise RuntimeError('Exit did not finish the game activity')



def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--signed', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    receipt = json.loads((args.signed / 'packages.json').read_text())
    report = {'sourceSha': receipt['sourceSha'], 'signingRun': receipt['runId'], 'physicalTvTested': False,
              'qaSourceSha': os.environ.get('GITHUB_SHA'), 'deviceRun': os.environ.get('GITHUB_RUN_ID'),
              'networkCheck': 'HTTPS CONNECT destination observed through a holding proxy on the emulator',
              'packages': {}}
    device = Device('emulator-5554', args.out)
    def save():
        (args.out / 'device.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    save()
    device.wait_for_ready(report)
    if not (device.shell('getprop', 'ro.kernel.qemu') == '1'
            or device.shell('getprop', 'ro.boot.qemu') == '1'):
        raise RuntimeError('Use a disposable Android TV emulator')
    if ('android.software.leanback' not in device.shell('pm', 'list', 'features')
            or device.shell('getprop', 'ro.build.version.sdk') != '36'):
        raise RuntimeError('Expected an API 36 Android TV image')
    report['fingerprint'] = device.shell('getprop', 'ro.build.fingerprint')
    games = {}
    for record in receipt['packages']:
        apk = args.signed / record['file']
        if hashlib.sha256(apk.read_bytes()).hexdigest() != record['sha256']:
            raise ValueError('Signed APK checksum differs')
        if 'Success' not in device.adb('install', '-r', apk.resolve()):
            raise RuntimeError('Installation failed for ' + record['id'])
        with zipfile.ZipFile(apk) as z:
            games[record['id']], = json.loads(z.read('assets/hosted-games.json'))
    packages = {r['packageName'] for r in receipt['packages']}
    installed = {line.removeprefix('package:') for line in device.shell('pm', 'list', 'packages').splitlines()}
    if len(packages) != 6 or not packages.issubset(installed):
        raise RuntimeError('Expected six concurrent installations')
    report['installedTogether'] = sorted(packages)
    save()
    previous = device.shell('settings', 'get', 'global', 'http_proxy')
    with OpeningRequests() as proxy:
        thread = threading.Thread(target=proxy.serve_forever, daemon=True)
        thread.start()
        port = proxy.server_address[1]
        device.adb('reverse', 'tcp:23884', 'tcp:' + str(port))
        try:
            device.shell('settings', 'put', 'global', 'http_proxy', '127.0.0.1:23884')
            for record in receipt['packages']:
                entry = {'packageName': record['packageName'], 'apkSha256': record['sha256']}
                try:
                    probe(device, proxy, record, games[record['id']], entry)
                except Exception as error:
                    entry['error'] = str(error)
                    if isinstance(error, subprocess.CalledProcessError):
                        entry['adbError'] = (error.stderr or error.stdout or b'').decode(errors='replace')[:600]
                finally:
                    device.shell('am', 'force-stop', record['packageName'])
                report['packages'][record['id']] = entry
                save()
        finally:
            device.shell('settings', 'put', 'global', 'http_proxy', previous if previous != 'null' else ':0')
            if previous == 'null':
                device.shell('settings', 'delete', 'global', 'http_proxy')
            device.adb('reverse', '--remove', 'tcp:23884')
            proxy.finished.set()
            proxy.shutdown()
    if any('error' in v for v in report['packages'].values()):
        raise SystemExit('One or more standalone TV launcher checks failed')


if __name__ == '__main__':
    main()
