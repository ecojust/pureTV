#!/usr/bin/env python3
"""Import verified gameplay-icon APKs and receipts from the Android CI artifacts."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
from io import BytesIO
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import zipfile

from PIL import Image

from android_game_icons import compare_contents, drawable_paths, manifest_tree
from game_icons import save_banner, save_png, source_bytes, source_image
from resource_catalog import apk_info, digest, expected_release_certificate

ROOT = Path(__file__).resolve().parents[1]
RAW = 'https://raw.githubusercontent.com/ecojust/pureTV/master/'


def read(path):
    return json.loads(path.read_text())


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def receipts(assets, games):
    found = {}
    for path in sorted(assets.glob('android-icons-*.json')):
        receipt = read(path)
        assert re.fullmatch(r'[0-9a-f]{40}', receipt['sourceSha']), path
        assert re.fullmatch(r'https://github.com/ecojust/pureTV/actions/runs/[1-9][0-9]*', receipt['buildRun']), path
        for row in receipt['games']:
            key = row['gameDir']
            if key in games:
                assert key not in found and key == 'resource/apps/' + row['id'], key
                found[key] = (row, receipt['sourceSha'], receipt['buildRun'], path)
    assert found.keys() == games.keys(), f'Missing resource receipts: {sorted(games.keys() - found.keys())}'
    return found


def baseline(metadata, original):
    candidates = [metadata, *metadata.get('previousReleases', [])]
    matches = [item for item in candidates if item.get('sha256') == original['sha256']]
    assert len(matches) == 1, 'Original APK is missing from resource release history'
    return matches[0]


def game_apk(row):
    return Path('joystick-games') / row['id'] / row['filename']


def input_apk(assets, row):
    packaged = assets / game_apk(row)
    return packaged if packaged.is_file() else assets / row['filename']


def verify(inputs, tools, assets, evidence):
    row, commit, build_run, shard = evidence
    before, after = row['original'], row['updated']
    directory = ROOT / row['gameDir']
    current = read(directory / 'resource.json')
    old = baseline(current, before)
    assert current['sha256'] in (before['sha256'], after['sha256']), directory
    assert row['originalUrl'] == inputs['apk'] and inputs['apkSha256'] == before['sha256'], directory
    assert inputs['version'] == before['versionName'] == old['version'], directory
    assert inputs['versionCode'] == before['versionCode'] == old['versionCode'], directory
    assert inputs['packageName'] == before['packageName'] == after['packageName'] == old['packageName'], directory
    assert old['certificateSha256'] == before['certificateSha256'] == after['certificateSha256'] == expected_release_certificate(ROOT, after), directory
    stem, patch = before['versionName'].rsplit('.', 1)
    assert after['versionName'] == stem + '.' + str(int(patch) + 1) and after['versionCode'] == before['versionCode'] + 1, directory
    assert row['filename'] == directory.name + '-' + after['versionName'] + '.apk', directory
    apk = input_apk(assets, row)
    original = directory / old['apk']
    assert before['bytes'] == old['apkBytes'] == original.stat().st_size and digest(original) == before['sha256'], directory
    assert apk_info(apk, tools) == after and manifest_tree(tools, original) == manifest_tree(tools, apk), directory
    installed = row['installed']
    assert all(installed[key] == 'passed' for key in ('upgrade', 'leanbackLaunch', 'launcherArtwork')), directory
    assert installed['installedApkSha256'] == after['sha256'] and int(installed['emulatorApi']) >= 26, directory
    assert row['sourceImage'] == source_image(directory).relative_to(ROOT).as_posix(), directory
    assert hashlib.sha256(source_bytes(directory)).hexdigest() == row['sourceImageSha256'], directory
    if (directory / 'game.json').is_file():
        game = read(directory / 'game.json')
        assert (game['version'], game['versionCode']) == (after['versionName'], after['versionCode']), directory
        assert after['bytes'] < 10_000_000, 'Game Kit APK exceeds the catalog limit: ' + directory.name
    else:
        gradle = (directory / 'build.gradle').read_text()
        assert f"versionName '{after['versionName']}'" in gradle and re.search(r'\bversionCode ' + str(after['versionCode']) + r'\b', gradle), directory

    roles = row['launcherResources']
    assert set(roles.values()) == {'banner', 'icon'}, directory
    assert row['icon']['size'] == [192, 192] and row['banner']['size'] == [320, 180], directory
    rendered = {'icon': BytesIO(), 'banner': BytesIO()}
    save_png(directory, rendered['icon'], 192)
    save_banner(directory, rendered['banner'])
    with zipfile.ZipFile(original) as src, zipfile.ZipFile(apk) as dst:
        files = set(src.namelist())
        originals, artwork = {}, {}
        for updated, role in roles.items():
            assert updated.startswith('res/') and updated.endswith('.png'), updated
            name = updated if updated in files else updated.removesuffix('.png') + '.xml'
            assert name in files, name
            originals[name] = role
            artwork[name] = dst.read(updated)
            assert hashlib.sha256(artwork[name]).hexdigest() == row[role]['sha256'], updated
            with Image.open(rendered[role]) as expected, Image.open(BytesIO(artwork[name])) as actual:
                assert actual.size == expected.size and actual.convert('RGB').tobytes() == expected.convert('RGB').tobytes(), updated
        table, paths = drawable_paths(src.read('resources.arsc'), originals)
        manifest = dst.read('AndroidManifest.xml')
    checksum, count = compare_contents(original, apk, paths, artwork, manifest, table)
    assert (count, checksum) == (row['preservedFiles'], row['preservedFilesDigest']), directory
    dest = directory / row['filename']
    assert not dest.exists() or digest(dest) == after['sha256'], dest
    return {**row, 'sourceSha': commit, 'buildRun': build_run,
            'receiptFile': shard.name, 'releaseReceiptSha256': digest(shard)}


def publish(directory, evidence, assets):
    old_info = read(directory / 'resource.json')
    old = baseline(old_info, evidence['original'])
    history = list(old_info.get('previousReleases', []))
    if old_info['sha256'] == old['sha256']:
        history.append({key: value for key, value in old.items() if key != 'previousReleases'})
    obsolete = {'previousReleases', 'testSourceCommit', 'verification', 'gameplayVideo', 'gameplayMetadata',
                'controllerStatusVideo', 'controllerStatusMetadata', 'historicalGameplayVideo'}
    info = {key: value for key, value in old.items() if key not in obsolete}
    actual = evidence['updated']
    receipt = 'docs/releases/' + actual['versionName'] + '/android-icon-receipt.json'
    info.update(version=actual['versionName'], versionCode=actual['versionCode'],
                sha256=actual['sha256'], apk=evidence['filename'], apkBytes=actual['bytes'],
                sourceCommit=evidence['sourceSha'], buildRun=evidence['buildRun'],
                downloadUrl=RAW + game_apk(evidence).as_posix(),
                coverSource=f"Capture retained from the {old['version']} release. " + old['coverSource'],
                verification={'status': 'passed', 'scope': 'Android launcher icon and TV banner update',
                              'signatureVerified': True, 'inPlaceUpgradeInstalled': True, 'leanbackLaunchPassed': True,
                              'launcherArtworkVerified': True, 'gamePayloadMatchesPreviousApk': True,
                              'actualAndroidEmulator': True, 'fullGameplayAcceptancePerformedInThisUpdate': False,
                              'physicalTvTested': False, 'physicalPhoneTested': False, 'verificationReport': receipt},
                previousReleases=history)
    if old.get('gameplayVideo'):
        info['historicalGameplayVideo'] = {
            'version': old['version'], 'video': old['gameplayVideo'],
            'metadata': old.get('gameplayMetadata'), 'currentUiEvidence': False}
    elif old.get('historicalGameplayVideo'):
        info['historicalGameplayVideo'] = old['historicalGameplayVideo']
    for target in (ROOT / game_apk(evidence), directory / info['apk']):
        if target.exists():
            assert digest(target) == actual['sha256'], target
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=target.parent, prefix='.apk-import-', delete=False) as temporary:
            temp = Path(temporary.name)
        try:
            shutil.copyfile(input_apk(assets, evidence), temp)
            assert digest(temp) == actual['sha256']
            temp.chmod(0o644)
            temp.replace(target)
        finally:
            temp.unlink(missing_ok=True)
    receipt_path = directory / receipt
    # Keep the original receipt URL when reimporting the same historical shard.
    if receipt_path.is_file():
        archived = read(receipt_path)
        if archived.get('releaseReceipt') and all(archived.get(k) == v for k, v in evidence.items() if k != 'receiptFile'):
            evidence = archived
    write_json(receipt_path, evidence)
    write_json(directory / 'resource.json', info)


def checksums(directory, baseline_commit):
    """Keep historical rows even in a sparse checkout; refresh this release's changed files."""
    checksum_path = directory / 'SHA256SUMS.txt'
    rows = {}
    for line in checksum_path.read_text().splitlines():
        value, name = line.split('  ', 1)
        assert re.fullmatch(r'[a-f0-9]{64}', value) and name not in rows, line
        rows[name] = value
    sorted_manifest = list(rows) == sorted(rows)
    relative = directory.relative_to(ROOT)
    changed = subprocess.check_output(['git', 'diff', '--diff-filter=ACMRT', '--name-only', '-z',
                                       baseline_commit, '--', str(relative)], cwd=ROOT)
    untracked = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard', '-z',
                                         '--', str(relative)], cwd=ROOT)
    active = read(directory / 'resource.json')
    entries = set((changed + untracked).decode().split('\0')) - {''}
    entries.update(str(relative / name) for name in (active['apk'], active['verification']['verificationReport']))
    for entry in sorted(entries):
        path = ROOT / entry
        if path == checksum_path:
            continue
        if path.is_file():
            value = digest(path)
        else:
            state = subprocess.check_output(['git', 'ls-files', '-t', '--', entry], text=True, cwd=ROOT)
            assert state.startswith('S '), 'Missing release file: ' + entry
            blob = subprocess.check_output(['git', 'show', ':' + entry], cwd=ROOT)
            value = hashlib.sha256(blob).hexdigest()
        rows[path.relative_to(directory).as_posix()] = value
    names = sorted(rows) if sorted_manifest else rows
    checksum_path.write_text(''.join(f'{rows[name]}  {name}\n' for name in names))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--assets', required=True, type=Path, help='Merged Actions artifact directory containing joystick-games/ and android-icons-*.json (also accepts legacy flat APKs)')
    parser.add_argument('--build-tools', required=True, type=Path)
    args = parser.parse_args()
    games = {row['gameDir']: row for row in read(ROOT / 'tools/game-client-icon-inputs.json') if row['gameDir'].startswith('resource/apps/')}
    assert set(games) == {'resource/' + key for key in read(ROOT / 'tools/resource-order.json')['game']}
    evidence = receipts(args.assets, games)
    with ThreadPoolExecutor(max_workers=4) as workers:
        results = list(workers.map(lambda key: verify(games[key], args.build_tools, args.assets, evidence[key]), games))
    for row in results:
        directory = ROOT / row['gameDir']
        publish(directory, row, args.assets)
        originals = (row['gameDir'], game_apk(row).parent.as_posix())
        locations = '|'.join(map(re.escape, originals))
        match = re.fullmatch(r'https://raw\.githubusercontent\.com/ecojust/pureTV/([a-f0-9]{40})/(?:' + locations + r')/[^/]+\.apk', row['originalUrl'])
        assert match, row['originalUrl']
        checksums(directory, match[1])
    print(f'Imported {len(results)} individually verified Android APKs.')


if __name__ == '__main__':
    main()
