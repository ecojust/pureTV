"""Issue an artwork-only Android update from each game's published, signed APK."""

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
import xml.etree.ElementTree as ET
import zipfile

import game_icons
from resource_catalog import apk_info, digest


ROOT = Path(__file__).resolve().parents[1]
ANDROID = '{http://schemas.android.com/apk/res/android}'
SIGNATURE = re.compile(r'META-INF/(?:MANIFEST\.MF|[^/]+\.(?:SF|RSA|DSA|EC))$', re.I)
APKTOOL_SHA = '66cf4524a4a45a7f56567d08b2c9b6ec237bcdd78cee69fd4a59c8a0243aeafa'
RELEASE = 'gameplay-icons-2026.11.21'


def command(*args):
    return subprocess.check_output([str(a) for a in args], text=True)


def manifest_tree(tools, apk):
    xml = command(tools / 'aapt', 'dump', 'xmltree', apk, 'AndroidManifest.xml')
    return [re.sub(r' \(line=\d+\)', '', line) for line in xml.splitlines()
            if not re.search(r'A: android:version(?:Code|Name)\(', line)]


def launcher_resources(tools, apk, manifest):
    """Find every drawable referenced by the app, its launch activities and aliases."""
    app = ET.parse(manifest).getroot().find('application')
    components = [app]
    for element in app:
        if element.tag not in ('activity', 'activity-alias'):
            continue
        categories = {c.get(ANDROID + 'name') for c in element.findall('intent-filter/category')}
        if categories & {'android.intent.category.LAUNCHER', 'android.intent.category.LEANBACK_LAUNCHER'}:
            components.append(element)
    assert app.get(ANDROID + 'icon') and app.get(ANDROID + 'banner'), 'Missing app icon or TV banner'
    roles = {}
    for element in components:
        for attribute in ('icon', 'roundIcon', 'banner'):
            ref = element.get(ANDROID + attribute)
            if not ref:
                continue
            assert re.fullmatch(r'@(drawable|mipmap)/[a-zA-Z0-9_.]+', ref), ref
            role = 'banner' if attribute == 'banner' else 'icon'
            assert roles.setdefault(ref[1:], role) == role
    resources = command(tools / 'aapt', 'dump', '--values', 'resources', apk)
    resolved = {}
    for name, role in roles.items():
        matches = re.findall(r'\bresource 0x[0-9a-f]+ [\w.]+:' + re.escape(name) +
                             r':[^\n]*\n\s*\(string(?:8|16)?\) "([^"]+)"', resources)
        assert matches, 'No Android resource file for ' + name
        for path in matches:
            assert path.startswith('res/') and '..' not in Path(path).parts
            assert resolved.setdefault(path, role) == role
    return resolved


def updated_manifest(apk, work, apktool, tools, before, version):
    # Only native resources enter this compiler. Game assets, bytecode and native
    # libraries are copied directly from the signed input APK below.
    thin = work / 'manifest-input.apk'
    with zipfile.ZipFile(apk) as source, zipfile.ZipFile(thin, 'w') as target:
        for info in source.infolist():
            if info.filename in ('AndroidManifest.xml', 'resources.arsc') or info.filename.startswith('res/'):
                target.writestr(info, source.read(info))
    decoded = work / 'decoded'
    command('java', '-jar', apktool, 'd', '--no-src', '--no-assets', '-j', '1', thin, '-o', decoded)
    paths = launcher_resources(tools, apk, decoded / 'AndroidManifest.xml')
    project = decoded / 'apktool.yml'
    config = project.read_text()
    for key, old, new in [('versionCode', before['versionCode'], before['versionCode'] + 1),
                          ('versionName', before['versionName'], version)]:
        config, count = re.subn(rf'^(  {key}: )[\"\']?{re.escape(str(old))}[\"\']?$', rf'\g<1>{new}', config, flags=re.M)
        assert count == 1, 'Missing APK version metadata: ' + key
    project.write_text(config)
    native = work / 'manifest-output.apk'
    # Apktool sets the executable bit even when the SDK binary is already
    # executable; the system SDK on a hosted runner belongs to root.
    compiler = work / 'aapt2'
    shutil.copy2(tools / 'aapt2', compiler)
    command('java', '-jar', apktool, 'b', '-j', '1', '--aapt', compiler, '-o', native, decoded)
    assert manifest_tree(tools, native) == manifest_tree(tools, apk), 'Android manifest changed beyond the two version fields'
    with zipfile.ZipFile(native) as z:
        return z.read('AndroidManifest.xml'), paths


def drawable_paths(table, roles):
    """Rename only the resource table strings for XML drawables that become PNGs."""
    paths = {}
    for old in roles:
        if old.endswith('.png'):
            paths[old] = old
            continue
        assert old.endswith('.xml'), 'Unexpected Android drawable file: ' + old
        new = old[:-4] + '.png'
        # These Android resource path strings have the same encoded length and
        # trailing NUL. Offsets, resource IDs and all other table data stay intact.
        found = 0
        for encoding in ('utf-8', 'utf-16le'):
            needle = (old + '\0').encode(encoding)
            count = table.count(needle)
            if count:
                assert count == 1
                table = table.replace(needle, (new + '\0').encode(encoding))
            found += count
        assert found == 1, 'Missing or ambiguous Android resource path: ' + old
        paths[old] = new
    assert len(set(paths.values())) == len(paths)
    return table, paths


def compare_contents(original, updated, paths, artwork, manifest, table):
    unchanged = {}
    with zipfile.ZipFile(original) as src, zipfile.ZipFile(updated) as dst:
        expected = {paths.get(n, n) for n in src.namelist() if not SIGNATURE.fullmatch(n)}
        assert expected == {n for n in dst.namelist() if not SIGNATURE.fullmatch(n)}
        assert len(dst.namelist()) == len(set(dst.namelist()))
        for info in src.infolist():
            name = info.filename
            if SIGNATURE.fullmatch(name):
                continue
            if name in paths:
                assert dst.read(paths[name]) == artwork[name]
            elif name == 'resources.arsc':
                assert dst.read(name) == table
            elif name == 'AndroidManifest.xml':
                assert dst.read(name) == manifest
            else:
                data = dst.read(name)
                assert data == src.read(info), 'Changed original game content: ' + name
                unchanged[name] = hashlib.sha256(data).hexdigest()
    assert 'classes.dex' in unchanged
    return hashlib.sha256(json.dumps(unchanged, sort_keys=True).encode()).hexdigest(), len(unchanged)


def build(row, original, output, scratch, apktool, tools, key):
    game = ROOT / row['gameDir']
    before = apk_info(original, tools)
    assert before['certificateSha256'] == (ROOT / 'tools/puretv-release-certificate-v2.sha256').read_text().strip()
    assert before['packageName'].startswith('com.ecojust.')
    assert before['sha256'] == row['apkSha256'], 'Published APK checksum mismatch: ' + row['id']
    assert before['packageName'] == row['packageName'], 'Published package mismatch: ' + row['id']
    assert (before['versionName'], before['versionCode']) == (row['version'], row['versionCode']), row['id']
    match = re.fullmatch(r'(\d+\.\d+\.)(\d+)(-preview\.\d+)?', before['versionName'])
    assert match, 'Unexpected Android version: ' + before['versionName']
    version = match[1] + str(int(match[2]) + 1) + (match[3] or '')
    manifest, roles = updated_manifest(original, scratch, apktool, tools, before, version)
    icon, banner = scratch / 'icon.png', scratch / 'banner.png'
    game_icons.save_png(game, icon, 192)
    game_icons.save_banner(game, banner)
    artwork = {path: (banner if role == 'banner' else icon).read_bytes() for path, role in roles.items()}
    unsigned = scratch / 'unsigned.apk'
    with zipfile.ZipFile(original) as src, zipfile.ZipFile(unsigned, 'w') as dst:
        assert len(src.namelist()) == len(set(src.namelist()))
        table, paths = drawable_paths(src.read('resources.arsc'), roles)
        assert all(new == old or new not in src.namelist() for old, new in paths.items())
        for info in src.infolist():
            name = info.filename
            if SIGNATURE.fullmatch(name):
                continue
            data = artwork.get(name)
            if data is None:
                if name == 'resources.arsc':
                    data = table
                elif name == 'AndroidManifest.xml':
                    data = manifest
                else:
                    data = src.read(info)
            info.filename = paths.get(name, name)
            dst.writestr(info, data)
    aligned = scratch / 'aligned.apk'
    dest = output / (row['id'] + '-' + version + '.apk')
    command(tools / 'zipalign', '-p', '-f', '4', unsigned, aligned)
    command(tools / 'apksigner', 'sign', '--ks', key, '--ks-key-alias', 'puretv',
            '--ks-pass', 'env:PURETV_KEYSTORE_PASSWORD', '--key-pass', 'env:PURETV_KEYSTORE_PASSWORD',
            '--v4-signing-enabled', 'false', '--out', dest, aligned)
    command(tools / 'zipalign', '-c', '-p', '4', dest)
    after = apk_info(dest, tools)
    assert after['packageName'] == before['packageName'] and after['certificateSha256'] == before['certificateSha256']
    assert (after['versionName'], after['versionCode']) == (version, before['versionCode'] + 1)
    assert manifest_tree(tools, original) == manifest_tree(tools, dest)
    unchanged_sha, count = compare_contents(original, dest, paths, artwork, manifest, table)
    badging = command(tools / 'aapt', 'dump', 'badging', dest)
    assert 'leanback-launchable-activity:' in badging
    assert re.search(r"^application:.* icon='[^']+\.png' banner='[^']+\.png'", badging, re.M)
    return {'id': row['id'], 'gameDir': row['gameDir'], 'original': before, 'updated': after, 'filename': dest.name,
            'sourceImage': game_icons.source_image(game).relative_to(ROOT).as_posix(),
            'sourceImageSha256': hashlib.sha256(game_icons.source_bytes(game)).hexdigest(),
            'icon': {'size': [192, 192], 'sha256': digest(icon)}, 'banner': {'size': [320, 180], 'sha256': digest(banner)},
            'preservedFiles': count, 'preservedFilesDigest': unchanged_sha,
            'launcherResources': {paths[p]: role for p, role in roles.items()}}


def dataset():
    rows = json.loads((ROOT / 'tools/game-client-icon-inputs.json').read_text())
    selected = [r for r in rows if r.get('apk')]
    assert selected and len({r['id'] for r in selected}) == len(selected)
    for r in selected:
        assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', r['id'])
        assert r['gameDir'] in ('resource/apps/' + r['id'], 'joystick-games/' + r['id'])
        assert r['apk'].startswith(('https://raw.githubusercontent.com/ecojust/pureTV/',
                                    'https://github.com/ecojust/pureTV/'))
    return selected


def prepare(args):
    assert digest(args.apktool) == APKTOOL_SHA, 'APK resource compiler checksum mismatch'
    rows = dataset()[args.shard::args.shards]
    assert rows
    args.output.mkdir(parents=True, exist_ok=True)
    args.originals.mkdir(parents=True, exist_ok=True)
    receipts = []
    with tempfile.TemporaryDirectory() as temp:
        key = Path(temp) / 'signing-key'
        key.write_bytes(base64.b64decode(os.environ.pop('PURETV_KEYSTORE_BASE64'), validate=True))
        key.chmod(0o600)
        cert = subprocess.check_output(['keytool', '-exportcert', '-alias', 'puretv', '-keystore', key,
                                       '-storepass:env', 'PURETV_KEYSTORE_PASSWORD'])
        assert hashlib.sha256(cert).hexdigest() == (ROOT / 'tools/puretv-release-certificate-v2.sha256').read_text().strip()
        for row in rows:
            print('Updating Android launcher art for', row['id'], flush=True)
            src = args.originals / (row['id'] + '.apk')
            command('curl', '--fail', '--silent', '--show-error', '--location', '--retry', '4',
                    '--output', src, row['apk'])
            with tempfile.TemporaryDirectory() as work:
                receipt = build(row, src, args.output, Path(work), args.apktool, args.tools, key)
            receipt['originalUrl'] = row['apk']
            receipts.append(receipt)
    args.report.write_text(json.dumps({'sourceSha': os.environ['GITHUB_SHA'],
                                      'buildRun': 'https://github.com/ecojust/pureTV/actions/runs/' + os.environ['GITHUB_RUN_ID'],
                                      'games': receipts}, indent=2) + '\n')


def adb_call(adb, *args, timeout=45):
    """Allow ADB to recover from the TV image's boot-time transport restart."""
    invocation = [str(adb), *(str(a) for a in args)]
    for attempt in range(3):
        print('ADB:', ' '.join(invocation[1:]), flush=True)
        try:
            result = subprocess.run(invocation, capture_output=True, text=True, timeout=timeout)
            if result.returncode == 0:
                return result.stdout
            message = (result.stderr + result.stdout).strip()
            if not re.search(r'offline|closed|no devices|not found.*emulator|device .*not found|transport error', message, re.I):
                raise RuntimeError(' '.join(invocation[1:]) + ': ' + message)
        except subprocess.TimeoutExpired:
            message = f'timed out after {timeout}s'
        print('ADB transport:', message, flush=True)
        if attempt < 2:
            try:
                subprocess.run([str(adb), 'wait-for-device'], check=False, timeout=30)
            except subprocess.TimeoutExpired:
                pass
            time.sleep(2)
    raise RuntimeError('ADB did not recover: ' + ' '.join(invocation[1:]) + ': ' + message)


def foreground(adb, package, component):
    """Check the activity stack after the same explicit launch used by Android TV."""
    start = adb_call(adb, 'shell', 'am', 'start', '-a', 'android.intent.action.MAIN',
                     '-c', 'android.intent.category.LEANBACK_LAUNCHER', '-n', package + '/' + component)
    assert 'Error' not in start and package in start, start
    deadline = time.monotonic() + 45
    while True:
        activities = adb_call(adb, 'shell', 'dumpsys', 'activity', 'activities', timeout=20)
        resumed = [line for line in activities.splitlines() if re.search(r'(?:topResumedActivity|mResumedActivity|ResumedActivity|mFocusedApp)', line)]
        if any(package + '/' in line for line in resumed):
            assert adb_call(adb, 'shell', 'pidof', package).strip()
            return
        if time.monotonic() >= deadline:
            raise RuntimeError(f'{package}: activity did not become foreground: {resumed}')
        time.sleep(1)


def device(args):
    data = json.loads(args.report.read_text())
    adb = args.adb
    assert 'package:' in adb_call(adb, 'shell', 'pm', 'path', 'android')
    assert 'Success' in adb_call(adb, 'install', '-r', '-t', args.probe, timeout=90)
    api = adb_call(adb, 'shell', 'getprop', 'ro.build.version.sdk').strip()
    for game in data['games']:
        print('Checking installed Android TV update for', game['id'], flush=True)
        package = game['updated']['packageName']
        assert 'Success' in adb_call(adb, 'install', '-r', args.originals / (game['id'] + '.apk'), timeout=150)
        assert 'Success' in adb_call(adb, 'install', '-r', args.output / game['filename'], timeout=150)
        probe = adb_call(adb, 'shell', 'am', 'instrument', '-w', '-e', 'game', package, '-e', 'icon', game['icon']['sha256'],
                         '-e', 'banner', game['banner']['sha256'], 'com.ecojust.iconprobe/.Probe', timeout=60)
        assert 'INSTRUMENTATION_CODE: -1' in probe and 'PASS' in probe, probe
        component = re.search(r'^INSTRUMENTATION_RESULT: leanbackComponent=([\w.$]+)$', probe, re.M)
        assert component, probe
        foreground(adb, package, component[1])
        installed = adb_call(adb, 'shell', 'pm', 'path', package).strip().split(':', 1)[1]
        checksum = adb_call(adb, 'shell', 'sha256sum', installed).split()[0]
        assert checksum == game['updated']['sha256']
        game['installed'] = {'upgrade': 'passed', 'leanbackLaunch': 'passed', 'launcherArtwork': 'passed',
                             'installedApkSha256': checksum, 'emulatorApi': api}
        adb_call(adb, 'uninstall', package)
        args.report.write_text(json.dumps(data, indent=2) + '\n')
        print('Android TV upgrade, foreground launch and installed artwork verified:', game['id'], flush=True)


def draft_assets():
    release = json.loads(command('gh', 'release', 'view', RELEASE, '--repo', 'ecojust/pureTV', '--json', 'apiUrl,isDraft,tagName'))
    assert release['isDraft'] and release['tagName'] == RELEASE
    entries = {}
    page = 1
    while True:
        assets = json.loads(command('gh', 'api', release['apiUrl'] + f'/assets?per_page=100&page={page}'))
        for asset in assets:
            assert asset['name'] not in entries
            entries[asset['name']] = asset
        if len(assets) < 100:
            return entries
        page += 1


def cached(args):
    """Reuse a successful shard only when its signed and installed bytes and exact input art still match."""
    assets = draft_assets()
    item = assets.get(f'android-icons-{args.shard}.json')
    if item is None:
        print('false')
        return
    receipt = subprocess.check_output(['gh', 'api', '-H', 'Accept: application/octet-stream', item['url']])
    assert item['digest'] == 'sha256:' + hashlib.sha256(receipt).hexdigest()
    games = json.loads(receipt)['games']
    rows = dataset()[args.shard::args.shards]
    assert [r['id'] for r in rows] == [g['id'] for g in games], 'Changed APK input selection'
    pin = (ROOT / 'tools/puretv-release-certificate-v2.sha256').read_text().strip()
    with tempfile.TemporaryDirectory() as temp:
        icon, banner = Path(temp) / 'icon.png', Path(temp) / 'banner.png'
        for row, game in zip(rows, games):
            before, after, validation = game['original'], game['updated'], game['installed']
            assert before['sha256'] == row['apkSha256'] and before['packageName'] == after['packageName'] == row['packageName']
            assert before['versionName'] == row['version'] and before['versionCode'] == row['versionCode']
            assert before['certificateSha256'] == after['certificateSha256'] == pin
            assert after['versionCode'] == before['versionCode'] + 1
            assert game['filename'] == row['id'] + '-' + after['versionName'] + '.apk'
            assert game['gameDir'] == row['gameDir'] and game['originalUrl'] == row['apk']
            staged = assets[game['filename']]
            assert staged['digest'] == 'sha256:' + after['sha256'] and staged['size'] == after['bytes']
            assert validation['installedApkSha256'] == after['sha256']
            assert all(validation[k] == 'passed' for k in ('upgrade','leanbackLaunch','launcherArtwork'))
            folder = ROOT / row['gameDir']
            assert game['sourceImageSha256'] == hashlib.sha256(game_icons.source_bytes(folder)).hexdigest()
            game_icons.save_png(folder, icon, 192)
            game_icons.save_banner(folder, banner)
            assert game['icon']['sha256'] == digest(icon) and game['banner']['sha256'] == digest(banner)
    print('true')


def upload(args):
    # The fixed draft is shared with desktop builders. A retry may reuse only an identical asset.
    existing = draft_assets()
    games = json.loads(args.report.read_text())['games']
    for game in games:
        assert game['installed']['installedApkSha256'] == game['updated']['sha256']
    files = [args.output / game['filename'] for game in games] + [args.report]
    for path in files:
        if path.name in existing:
            assert existing[path.name]['digest'] == 'sha256:' + digest(path), 'Conflicting release asset: ' + path.name
        else:
            command('gh', 'release', 'upload', RELEASE, path, '--repo', 'ecojust/pureTV')


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    commands = cli.add_subparsers(required=True)
    build_cli = commands.add_parser('prepare')
    build_cli.set_defaults(run=prepare)
    build_cli.add_argument('--apktool', required=True, type=Path)
    build_cli.add_argument('--tools', required=True, type=Path)
    build_cli.add_argument('--shard', required=True, type=int)
    build_cli.add_argument('--shards', required=True, type=int)
    qa = commands.add_parser('device')
    qa.set_defaults(run=device)
    qa.add_argument('--probe', required=True, type=Path)
    qa.add_argument('--adb', required=True, type=Path)
    check = commands.add_parser('cached')
    check.set_defaults(run=cached)
    check.add_argument('--shard', required=True, type=int)
    check.add_argument('--shards', required=True, type=int)
    pub = commands.add_parser('upload')
    pub.set_defaults(run=upload)
    for c in (build_cli, qa):
        c.add_argument('--originals', required=True, type=Path)
    for c in (build_cli, qa, pub):
        c.add_argument('--output', required=True, type=Path)
        c.add_argument('--report', required=True, type=Path)
    args = cli.parse_args()
    args.run(args)


if __name__ == '__main__':
    main()
