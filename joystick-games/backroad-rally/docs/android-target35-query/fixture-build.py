#!/usr/bin/env python3
"""Actual aapt/javac/d8 tiny unsigned fixtures, not a Backroad build or TV run."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[4]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('sdk', 'jdk', 'zxing', 'output'): parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args()
    out = args.output.resolve(); assert not out.is_relative_to(ROOT) and not out.exists()
    out.mkdir(parents=True)
    spec = importlib.util.spec_from_file_location('actual_gamekit_builder', ROOT / 'resource/game-kit/build.py')
    build = importlib.util.module_from_spec(spec); spec.loader.exec_module(build)
    kit = out / 'kit'
    shutil.copytree(ROOT / 'resource/game-kit/android/src/main', kit / 'android/src/main')
    (kit / 'web').mkdir()
    for name in ('controller.html', 'controller.js', 'controller.css'):
        shutil.copyfile(ROOT / 'resource/game-kit/web' / name, kit / 'web' / name)
    game = out / 'game'; (game / 'src/main/assets').mkdir(parents=True)
    (game / 'game.json').write_text(json.dumps({'id': 'sdk-fixture', 'packageName': 'com.ecojust.sdkfixture',
        'name': 'SDK fixture', 'nameEn': 'SDK fixture', 'version': '0.1.0', 'versionCode': 1}))
    (game / 'src/main/assets/tv.html').write_text('<!doctype html><meta charset="utf-8"><title>Unsigned build fixture only</title>')
    receipts = []; content = []
    for target in (29, 35):
        folder = out / ('target-' + str(target))
        argv = ['--game', str(game), '--kit', str(kit), '--output', str(folder),
                '--sdk', str(args.sdk), '--jdk', str(args.jdk), '--zxing', str(args.zxing), '--cache', str(out / 'dex-cache')]
        if target == 29: build.main(argv)  # Exercise the actual untouched default.
        else: build.main(argv, target_sdk=35)
        apk = folder / 'unsigned.apk'
        badging = subprocess.check_output([str(args.sdk / 'build-tools/34.0.0/aapt'), 'dump', 'badging', str(apk)], text=True)
        (folder / 'actual-badging.txt').write_text(badging)
        assert re.findall(r"^sdkVersion:'(\d+)'$", badging, re.M) == ['26']
        assert re.findall(r"^targetSdkVersion:'(\d+)'$", badging, re.M) == [str(target)]
        assert "compileSdkVersion='35'" in badging
        receipt = json.loads((folder / 'build-receipt.json').read_text())
        assert receipt['minSdk'] == 26 and receipt['targetSdk'] == target and receipt['unsigned'] is True
        receipts.append(receipt)
        with zipfile.ZipFile(apk) as archive:
            assert archive.testzip() is None
            content.append({name: hashlib.sha256(archive.read(name)).hexdigest() for name in archive.namelist()})
    assert set(content[0]) == set(content[1])
    changed = [name for name in content[0] if content[0][name] != content[1][name]]
    assert changed == ['AndroidManifest.xml'], changed
    assert receipts[0]['assets'] == receipts[1]['assets'] and receipts[0]['hostDexCacheKey'] == receipts[1]['hostDexCacheKey']
    sources = [ROOT / 'resource/game-kit/build.py', *sorted((ROOT / 'resource/game-kit/android/src/main').rglob('*'))]
    result = {'scope': __doc__, 'status': 'passed', 'actualTools': ['aapt2', 'javac', 'd8', 'zipalign', 'aapt'],
              'actualMinSdk': [26, 26], 'actualTargetSdk': [29, 35], 'actualCompileSdk': [35, 35],
              'changedApkEntries': changed, 'assetBytesEqualAcrossTargets': True, 'dexBytesEqualAcrossTargets': True,
              'nativeSources': {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sources if p.is_file()},
              'fixtureApks': [{'targetSdk': t, 'bytes': r['bytes'], 'sha256': r['sha256']} for t, r in zip((29, 35), receipts)],
              'productionBackroadBuilt': False, 'signed': False, 'installed': False, 'actualWebViewTested': False}
    (out / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__': main()
