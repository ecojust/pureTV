#!/usr/bin/env python3
"""Capture official macOS apps against public Gitee, without installing/posting.

Native screencapture supplies every image. OCR and CGEvent only observe/operate
original apps. No app source, version, DOM, response, or traffic is modified.
Evidence is an explicit allowlist: no profile, session, or token is copied.
"""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import signal
import struct
import subprocess
import threading
import time
import traceback
import urllib.request

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'evidence'
OUT.mkdir(exist_ok=True)
WORK = Path(os.environ['RUNNER_TEMP']) / f'manager-050-promo-{os.getpid()}'
WORK.mkdir()
HELPER = WORK / 'screen'
API = 'https://gitee.com/api/v5/repos/juzisang331/pure-tv-store'
SOURCE = 'https://gitee.com/juzisang331/pure-tv-store'
EXPECTED = {
    ('0.4.19', 'arm64'): 'f2ee92b8c5f268896acdce24d99d260828ccb002fe83ed11778c6fe28bad3729',
    ('0.4.19', 'x64'): '4cd070c85ca1cd33b93831920d75dc2ec5a08b5ffafdf9231b684c81c7f8189c',
    ('0.5.0', 'arm64'): 'f61e68cb4c2cbdb023ba8336926610c05b42e2d8694faef11d030a826b182534',
    ('0.5.0', 'x64'): '33c170215d6ba4e451ed91bfd5c37ba3977f291beec5ea26f59ee0d6ff3d75b6',
}
START = time.monotonic()
EVENTS = []
RESULT = {'pass': False, 'source': SOURCE, 'capture': 'original native apps',
          'readOnly': True, 'installedUpdate': False, 'posted': False,
          'versions': {}, 'segments': [], 'publicRequests': []}
CURRENT = None
SCALE_X = SCALE_Y = 1.0
DISPLAY_BOUNDS = {'x': 0, 'y': 0, 'width': 1, 'height': 1}
SCREENSHOT_INDEX = 0
DATA = Path.home() / 'Library/Application Support/com.ecojust.puretv.manager'


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2))


def event(kind, **details):
    value = {'elapsed': round(time.monotonic() - START, 3),
             'utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
             'kind': kind, **details}
    EVENTS.append(value)
    save('actions.json', EVENTS)
    print(json.dumps(value, ensure_ascii=False), flush=True)
    return value


def run(args, timeout=90, check=True):
    value = subprocess.run(list(map(str, args)), capture_output=True, text=True, timeout=timeout)
    if check and value.returncode:
        raise RuntimeError(f'{args[0]} exited {value.returncode}: {value.stderr[-1600:]}')
    return value


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def public_bytes(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'pureTV-Manager-promo-readonly/0.5.0'})
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read()
        metadata = {'url': url, 'status': response.status, 'bytes': len(data),
                    'sha256': hashlib.sha256(data).hexdigest()}
    return data, metadata


def public_json(label, url):
    data, metadata = public_bytes(url)
    (OUT / f'public-{label}.json').write_bytes(data)
    RESULT['publicRequests'].append(metadata)
    return json.loads(data)


def package(version, platform):
    name = f'pureTV-Manager-{version}-macos-{platform}.dmg'
    base = f'https://github.com/ecojust/pureTV/releases/download/desktop-v{version}/'
    checksums, metadata = public_bytes(base + 'SHA256SUMS.txt')
    (OUT / f'SHA256SUMS-{version}.txt').write_bytes(checksums)
    table = dict((line.split()[1], line.split()[0]) for line in checksums.decode().splitlines() if line.strip())
    assert table[name] == EXPECTED[(version, platform)], 'Published checksum differs from reviewed release'
    payload, payload_metadata = public_bytes(base + name)
    destination = WORK / name
    destination.write_bytes(payload)
    assert sha(destination) == table[name], 'Downloaded DMG checksum mismatch'
    return version, destination, {'fileName': name, 'sha256': table[name], 'bytes': len(payload),
                                  'download': payload_metadata, 'checksums': metadata}


def extract_package(version, dmg, metadata):
    mount = WORK / f'mount-{version}'
    app = WORK / version / 'pureTV Manager.app'
    app.parent.mkdir()
    run(['hdiutil', 'attach', '-quiet', '-nobrowse', '-mountpoint', mount, dmg])
    try:
        run(['ditto', mount / 'pureTV Manager.app', app])
    finally:
        run(['hdiutil', 'detach', '-quiet', mount])
    info = plistlib.loads((app / 'Contents/Info.plist').read_bytes())
    assert info['CFBundleShortVersionString'] == version
    executable = app / 'Contents/MacOS' / info['CFBundleExecutable']
    metadata.update({'bundleVersion': info['CFBundleShortVersionString'],
                     'binarySha256Before': sha(executable)})
    RESULT['versions'][version] = metadata
    return {'version': version, 'app': app, 'executable': executable}


def snapshot(label):
    global SCREENSHOT_INDEX, SCALE_X, SCALE_Y
    SCREENSHOT_INDEX += 1
    stem = f'{SCREENSHOT_INDEX:03d}-{label}'
    path = OUT / f'{stem}.png'
    run(['screencapture', '-x', '-C', '-m', path], timeout=15)
    width, height = struct.unpack('>II', path.read_bytes()[16:24])
    SCALE_X, SCALE_Y = width / DISPLAY_BOUNDS['width'], height / DISPLAY_BOUNDS['height']
    items = json.loads(run([HELPER, 'ocr', path], timeout=30).stdout)
    save(f'{stem}-ocr.json', items)
    event('screenshot', file=path.name, ocrFile=f'{stem}-ocr.json', sha256=sha(path),
          pixels=[width, height], scale=[SCALE_X, SCALE_Y])
    return items


def compact(value):
    return re.sub(r'\s+', '', value).lower()


def has(items, text):
    return compact(text) in compact('\n'.join(item['text'] for item in items))


def has_version(items, version):
    # Native evidence from the first run read the real v0.4.19 label as
    # "vO.4.19". Normalize only OCR version tokens; pixels and bundle metadata
    # remain untouched. Download hashes and bundle versions are checked above.
    return any(token.removeprefix('v').replace('o', '0') == version
               for item in items
               for token in re.findall(r'v?[0-9o]+\.[0-9o]+\.[0-9o]+', compact(item['text'])))


def match(items, text, exact=False, left=False):
    found = [item for item in items if (compact(item['text']) == compact(text) if exact
                                      else compact(text) in compact(item['text']))]
    if not found and re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+', text):
        found = [item for item in items if has_version([item], text)]
    if exact and not found:
        # Vision sometimes recognizes an adjacent SVG icon as a character. Limit
        # the fallback to a short individual label, never a merged toolbar row.
        found = [item for item in items if compact(text) in compact(item['text'])
                 and len(compact(item['text'])) <= len(compact(text)) + 4]
    if left:
        found = [item for item in found if item['x'] / SCALE_X < 230]
    if not found:
        raise RuntimeError('Native screenshot lacks actionable text: ' + text)
    return min(found, key=lambda item: len(item['text']))


def point(items, text, click=False, exact=False, left=False):
    # External posting/install buttons are never eligible for clicking.
    allowed = ('论坛', '大家可以在这里', '刷新回复', '返回列表', '检查更新',
               '重新检查', '发现新版本', '关闭')
    if click:
        assert any(text.startswith(label) for label in allowed), ('Non-readonly click', text)
    item = match(items, text, exact=exact, left=left)
    x, y = item['x'] / SCALE_X + DISPLAY_BOUNDS['x'], item['y'] / SCALE_Y + DISPLAY_BOUNDS['y']
    run([HELPER, 'move', str(x), str(y), '0.65'], timeout=5)
    time.sleep(.35)
    if click:
        run([HELPER, 'click', str(x), str(y)], timeout=5)
    event('click' if click else 'hover', target=text, recognized=item['text'], x=x, y=y)


def wait_screen(label, predicate, timeout=80):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        items = snapshot(label)
        if dismiss_local_network_prompt(items):
            time.sleep(1)
            continue
        if predicate(items):
            return items
        time.sleep(1.2)
    raise RuntimeError('Timed out waiting for native UI: ' + label)


def dismiss_local_network_prompt(items):
    """Deny only the known app/isolated-runner local-network system request.

    Public HTTPS forum/update reads need no local-device access. The earlier
    runner names its controlling process hosted-compute- in this system alert.
    No unknown prompt, update, or external posting confirmation is accepted.
    """
    text = compact('\n'.join(item['text'] for item in items)).replace('“', '"').replace('”', '"')
    network_request = 'devicesonlocalnetworks?' in text or '本地网络' in text
    scoped_title = any(f'allow"{name}' in text or f'"{name}"想要' in text
                       for name in ('puretvmanager', 'puretv-desktop', 'hosted-compute-'))
    if not (network_request and scoped_title):
        return False
    denied = [item for item in items if compact(item['text']).replace('’', "'") in ("don'tallow", '不允许')]
    if len(denied) != 1:
        raise RuntimeError('Recognized scoped local-network alert but cannot safely identify denial button')
    item = denied[0]
    x, y = item['x'] / SCALE_X + DISPLAY_BOUNDS['x'], item['y'] / SCALE_Y + DISPLAY_BOUNDS['y']
    run([HELPER, 'move', x, y, '.4'], timeout=5)
    run([HELPER, 'click', x, y], timeout=5)
    event('system-permission-denied', permission='local network', recognized=item['text'], x=x, y=y)
    return True


def launch(bundle):
    global CURRENT, SCALE_X, SCALE_Y, DISPLAY_BOUNDS
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / 'interface-preferences.json').write_text(json.dumps({'locale': 'zh-CN', 'theme': 'emerald'}))
    # A missing ADB path prevents unrelated discovery/TV actions; does not alter
    # the updater, forum, app version, or any response.
    (DATA / 'state.json').write_text(json.dumps({'adb_path': str(WORK / 'no-adb-for-readonly-recording')}))
    log = (OUT / f'app-{bundle["version"]}.log').open('w')
    process = subprocess.Popen([str(bundle['executable'])], stdout=log, stderr=subprocess.STDOUT)
    CURRENT = {**bundle, 'process': process, 'log': log}
    time.sleep(5)
    run(['osascript', '-e', f'tell application "{bundle["app"]}" to activate'])
    run(['osascript', '-e', f'tell application "System Events" to tell (first process whose unix id is {process.pid}) to set position of window 1 to {{40, 45}}'], check=False)
    run(['osascript', '-e', f'tell application "System Events" to tell (first process whose unix id is {process.pid}) to set size of window 1 to {{1440, 860}}'], check=False)
    metadata = json.loads(run([HELPER, 'metadata', process.pid]).stdout)
    save(f'window-{bundle["version"]}.json', metadata)
    assert any(window.get('title') == 'pure TV' for window in metadata['windows']), 'Native Manager window missing'
    main = next((display for display in metadata.get('displays', []) if display.get('main')), None)
    if main:
        SCALE_X, SCALE_Y = main['scaleX'], main['scaleY']
        DISPLAY_BOUNDS = main['bounds']
    event('launch', version=bundle['version'], pid=process.pid,
          binarySha256=sha(bundle['executable']), screenshotScale=[SCALE_X, SCALE_Y])
    # Vision can omit the tiny sidebar version entirely. Verified bundle and
    # executable identify the launch; larger update-dialog versions are checked
    # separately before the updater footage can succeed.
    return wait_screen('launch-' + bundle['version'], lambda items: has(items, '设备连接') and has(items, '论坛'), timeout=40)


def quit_app():
    global CURRENT
    if not CURRENT:
        return
    process = CURRENT['process']
    if process.poll() is None:
        run(['osascript', '-e', f'tell application "{CURRENT["app"]}" to quit'], check=False, timeout=20)
        try:
            process.wait(timeout=15)
        except subprocess.TimeoutExpired:
            process.terminate()
            process.wait(timeout=10)
    CURRENT['log'].close()
    after = sha(CURRENT['executable'])
    RESULT['versions'][CURRENT['version']]['binarySha256After'] = after
    assert after == RESULT['versions'][CURRENT['version']]['binarySha256Before']
    event('quit', version=CURRENT['version'], binaryUnchanged=True)
    CURRENT = None


class Recording:
    def __init__(self, name, video_flags):
        self.name, self.flags = name, video_flags
        self.process = None
        self.done = threading.Event()
        self.frames = []

    def __enter__(self):
        self.start = time.monotonic()
        self.path = OUT / f'{self.name}.mov'
        if self.flags is not None:
            self.log = (OUT / f'{self.name}-capture.log').open('w')
            self.process = subprocess.Popen(['screencapture', '-v', '-V', '100', *self.flags, str(self.path)],
                                            stdout=self.log, stderr=subprocess.STDOUT)
            time.sleep(1.2)
            if self.process.poll() is not None:
                raise RuntimeError('Native video recorder exited before the segment')
        else:
            self.directory = OUT / f'{self.name}-frames'
            self.directory.mkdir()
            self.thread = threading.Thread(target=self.capture_frames, daemon=True)
            self.thread.start()
        event('record-start', segment=self.name, mode='native-video' if self.process else 'native-screenshot-sequence')
        return self

    def capture_frames(self):
        while not self.done.is_set():
            path = self.directory / f'{len(self.frames):05d}.png'
            started = time.monotonic()
            value = run(['screencapture', '-x', '-C', '-m', path], timeout=15, check=False)
            if value.returncode == 0 and path.exists():
                self.frames.append({'file': path.name, 'elapsed': round(started - self.start, 4),
                                    'capturedAtElapsed': round(time.monotonic() - self.start, 4)})
            self.done.wait(.35)

    def __exit__(self, exc_type, exc, tb):
        if self.process:
            exited_early = self.process.poll() is not None
            if not exited_early:
                self.process.send_signal(signal.SIGINT)
                try:
                    self.process.wait(timeout=15)
                except subprocess.TimeoutExpired:
                    self.process.terminate()
                    self.process.wait(timeout=10)
            self.log.close()
            assert not exited_early, 'Native recording ended before the last action'
            assert self.path.exists() and self.path.stat().st_size > 1000, 'Native movie missing'
        else:
            self.done.set()
            self.thread.join(timeout=20)
            assert not self.thread.is_alive() and len(self.frames) >= 2, 'Native screenshot sequence incomplete'
            save(f'{self.name}-frames.json', self.frames)
        item = {'name': self.name, 'elapsedDuration': round(time.monotonic() - self.start, 3),
                'mode': 'native-video' if self.process else 'native-screenshot-sequence',
                'file': self.path.name if self.process else self.directory.name,
                'completedActions': exc is None}
        RESULT['segments'].append(item)
        event('record-stop', **item)


def video_probe():
    for index, flags in enumerate((['-C', '-k', '-x'], ['-C', '-x'])):
        destination = OUT / f'video-probe-{index}.mov'
        try:
            value = run(['screencapture', '-v', '-V', '1', *flags, destination], timeout=15, check=False)
        except (subprocess.TimeoutExpired, OSError) as error:
            save(f'video-probe-{index}.json', {'flags': flags, 'error': str(error)})
            continue
        save(f'video-probe-{index}.json', {'flags': flags, 'returnCode': value.returncode,
                                        'stdout': value.stdout, 'stderr': value.stderr,
                                        'bytes': destination.stat().st_size if destination.exists() else 0})
        if value.returncode == 0 and destination.exists() and destination.stat().st_size > 1000:
            # Verify the same interruption/finalization path used by segments.
            interrupted = OUT / f'video-probe-{index}-interrupted.mov'
            with (OUT / f'video-probe-{index}-interrupted.log').open('w') as log:
                process = subprocess.Popen(['screencapture', '-v', '-V', '10', *flags, str(interrupted)],
                                            stdout=log, stderr=subprocess.STDOUT)
                time.sleep(2)
                running = process.poll() is None
                if running:
                    process.send_signal(signal.SIGINT)
                try:
                    process.wait(timeout=12)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
                    continue
            if running and interrupted.exists() and interrupted.stat().st_size > 1000:
                return flags
    event('video-unavailable', fallback='timestamped genuine native screenshot sequence')
    return None


def main():
    assert os.uname().sysname == 'Darwin', 'Native macOS only'
    assert not DATA.exists(), 'Use a fresh isolated runner account'
    platform = 'arm64' if os.uname().machine == 'arm64' else 'x64'
    RESULT['platform'] = 'macos-' + platform
    repository = public_json('repository', API)
    branch = public_json('branch', API + '/branches/' + repository['default_branch'])
    revision = branch['commit']['sha']
    tree = public_json('tree', API + '/git/trees/' + revision + '?recursive=1')
    assert not tree.get('truncated')
    client = [item for item in tree['tree'] if item['path'] == f'client/pureTV-Manager-0.5.0-macos-{platform}.dmg']
    assert len(client) == 1, 'Actual Gitee does not publish required 0.5.0 package'
    RESULT['giteeRevision'], RESULT['giteeCandidate'] = revision, client[0]
    public_json('forum-list', API + '/issues?state=all&sort=updated&direction=desc&page=1&per_page=20')
    post = public_json('forum-post-IKS14W', API + '/issues/IKS14W')
    replies = public_json('forum-replies-IKS14W', API + '/issues/IKS14W/comments?page=1&per_page=20&order=asc')
    assert post['number'] == 'IKS14W' and replies, 'Expected public forum evidence unavailable'
    run(['swiftc', ROOT / 'screen.swift', '-o', HELPER], timeout=90)
    # This exact mode exists on the observed runner. It leaves room for the
    # complete 1440x860 window above the native Dock.
    display = run([HELPER, 'display-size', '1920', '1080'], check=False)
    (OUT / 'display-configuration.txt').write_text(display.stdout + display.stderr)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        downloaded = list(pool.map(lambda version: package(version, platform), ('0.4.19', '0.5.0')))
    bundles = {version: extract_package(version, path, metadata) for version, path, metadata in downloaded}
    items = launch(bundles['0.4.19'])
    items = wait_screen('old-update-ready', lambda items: has(items, '发现新版本') and has_version(items, '0.5.0'))
    flags = video_probe()
    with Recording('01-update-0419-to-050', flags):
        time.sleep(2)
        point(items, '发现新版本', click=True)
        items = wait_screen('old-update-dialog', lambda items: has(items, '当前版本') and has(items, '仓库版本') and has_version(items, '0.4.19') and has_version(items, '0.5.0'))
        assert has(items, '有适用于当前系统的新版本') and has(items, 'macOS')
        time.sleep(3)
        point(items, '检查更新', click=True, exact=True)
        items = wait_screen('old-update-rechecked', lambda items: has(items, '有适用于当前系统的新版本') and has_version(items, '0.4.19') and has_version(items, '0.5.0'))
        point(items, '0.4.19')
        time.sleep(2)
        point(items, '0.5.0')
        time.sleep(3)
        point(items, '下载并安装', exact=True)  # Hover only.
        time.sleep(4)
        snapshot('old-update-final')
    quit_app()
    # Explicit app switch, never represented as an installed update.
    items = launch(bundles['0.5.0'])
    point(items, '论坛', click=True, exact=True, left=True)
    items = wait_screen('forum-preload-list', lambda items: has(items, 'IKS14W') and has(items, '大家可以在这里'))
    point(items, '大家可以在这里', click=True)
    items = wait_screen('forum-preload-detail', lambda items: has(items, '畅所欲言') and has(items, '我来测试一下'))
    point(items, '返回列表', click=True, exact=True)
    items = wait_screen('forum-ready-list', lambda items: has(items, '发布帖子') and has(items, 'IKS14W'))
    with Recording('02-forum-050', flags):
        time.sleep(2)
        point(items, '发布帖子')  # Hover only; the OCR may include an external-link icon.
        time.sleep(2)
        point(items, '大家可以在这里', click=True)
        items = wait_screen('forum-detail', lambda items: has(items, '畅所欲言') and has(items, '我来测试一下'))
        time.sleep(4)
        point(items, '刷新回复', click=True, exact=True)
        items = wait_screen('forum-refreshed-reply', lambda items: has(items, '我来测试一下')
                            and has(items, '刷新回复') and not has(items, '正在读取回复')
                            and not has(items, '暂时无法刷新') and not has(items, '请稍后重试'))
        time.sleep(3)
        point(items, '去回复')  # Hover only.
        time.sleep(3)
        point(items, '返回列表', click=True, exact=True)
        items = wait_screen('forum-final-list', lambda items: has(items, '发布帖子') and has(items, 'IKS14W'))
        time.sleep(3)
        snapshot('forum-final')
    quit_app()
    assert not (DATA / 'client-update-last-result.json').exists(), 'Unexpected installer receipt'
    assert not list((DATA / 'client-update-install').glob('*')), 'Unexpected installer handoff'
    RESULT['pass'] = True
    event('complete', installedUpdate=False, posted=False)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        RESULT['error'] = str(error)
        traceback.print_exc()
        try:
            snapshot('failure')
        except Exception:
            pass
        raise
    finally:
        try:
            quit_app()
        finally:
            RESULT['elapsed'] = round(time.monotonic() - START, 3)
            save('result.json', RESULT)
