#!/usr/bin/env python3
"""Compile the actual shared Android host around a >10 MB resource fixture.

The deterministic bytes are deliberately not a playable game or valid model.
This verifies packaging, native Java compilation and payload preservation only.
It never signs or installs the APK and never reads a release key.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import random
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec); spec.loader.exec_module(value)
    return value


def record(path):
    data = path.read_bytes()
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['scratch', 'sdk', 'jdk', 'zxing', 'evidence']:
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    assert not args.scratch.exists() and not args.scratch.resolve().is_relative_to(ROOT)
    assert not args.evidence.exists()
    args.scratch.mkdir(parents=True); args.evidence.mkdir(parents=True)
    builder = module('fixture_original_builder', ROOT / 'resource/game-kit/build.py')
    policy = module('fixture_resource_policy', ROOT / 'joystick-games/tools/asset-policy.py')
    declaration = {'schemaVersion': 1, 'maxAssetBytes': 16_000_000,
                   'maxTotalBytes': 128_000_000, 'maxApkBytes': 128_000_000}
    meta = {'id': 'asset-fixture', 'packageName': 'com.ecojust.joystick.assetfixture',
            'name': '仅资源边界测试', 'nameEn': 'Asset packaging fixture only',
            'version': '0.1.0', 'versionCode': 1, 'assetPolicy': declaration}
    registration = {'packageName': meta['packageName'], 'assetPolicy': declaration}
    limits = policy.android_limits(meta, registration)
    composed = args.scratch / 'kit'
    shutil.copytree(ROOT / 'resource/game-kit/android/src/main', composed / 'android/src/main')
    (composed / 'web').mkdir()
    for name in ['controller.html', 'controller.js', 'controller.css']:
        shutil.copyfile(ROOT / 'resource/game-kit/web' / name, composed / 'web' / name)
    builder.KIT = composed
    game = args.scratch / 'game'; assets = game / 'src/main/assets'; assets.mkdir(parents=True)
    (game / 'game.json').write_text(json.dumps(meta, ensure_ascii=False) + '\n')
    (assets / 'tv.html').write_text('<!doctype html><meta charset="utf-8"><title>Packaging fixture only</title><p>No game included.</p>')
    random_bytes = random.Random(63485)
    for name, size in [('fixture.glb', 8_000_001), ('fixture.ogg', 4_000_003)]:
        (assets / name).write_bytes(random_bytes.randbytes(size))
    audio_fixtures=ROOT/'joystick-games/tools/fixtures/audio'
    audio_records=json.loads((audio_fixtures/'provenance.json').read_text())['files']
    for name in ['backfire.opus','backfire.m4a']:
        assert record(audio_fixtures/name)=={key:audio_records[name][key] for key in ['bytes','sha256']}
        shutil.copyfile(audio_fixtures/name,assets/name)
    try:
        builder.payload(game)
    except ValueError as error:
        old_rejection = str(error)
    else:
        raise AssertionError('Default small-game builder accepted the large 3D fixture')
    source_paths = [ROOT / 'resource/game-kit/build.py', ROOT / 'joystick-games/tools/asset-policy.py',
                    Path(__file__), *sorted((ROOT / 'resource/game-kit/android/src/main').rglob('*')),
                    *sorted((ROOT / 'resource/game-kit/web').iterdir()),*sorted(audio_fixtures.iterdir())]
    source = {str(path.relative_to(ROOT)): record(path) for path in source_paths if path.is_file()}
    builder.main(['--kit', str(composed), '--game', str(game), '--output', str(args.scratch / 'output'),
                  '--cache', str(args.scratch / 'dex-cache'), '--sdk', str(args.sdk),
                  '--jdk', str(args.jdk), '--zxing', str(args.zxing)], limits=limits)
    apk = args.scratch / 'output/unsigned.apk'
    assert 10_000_000 < apk.stat().st_size < declaration['maxApkBytes']
    # Exercise the unchanged *CLI* cap independently: ordinary audio files each
    # below 8 MB, total below 32 MB, but an incompressible APK above 10 MB.
    old_game = args.scratch / 'old-default-game'; old_assets = old_game / 'src/main/assets'
    old_assets.mkdir(parents=True)
    old_meta = {key: value for key, value in meta.items() if key != 'assetPolicy'}
    (old_game / 'game.json').write_text(json.dumps(old_meta) + '\n')
    (old_assets / 'tv.html').write_bytes((assets / 'tv.html').read_bytes())
    combined = (assets / 'fixture.glb').read_bytes() + (assets / 'fixture.ogg').read_bytes()
    (old_assets / 'first.ogg').write_bytes(combined[:6_000_002])
    (old_assets / 'second.ogg').write_bytes(combined[6_000_002:])
    old_command = [sys.executable, str(ROOT / 'resource/game-kit/build.py'),
                   '--kit', str(composed), '--game', str(old_game),
                   '--output', str(args.scratch / 'old-default-output'),
                   '--cache', str(args.scratch / 'dex-cache'), '--sdk', str(args.sdk),
                   '--jdk', str(args.jdk), '--zxing', str(args.zxing)]
    old_cli = subprocess.run(old_command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    (args.evidence / 'default-cli-rejection.log').write_bytes(old_cli.stdout)
    assert old_cli.returncode != 0 and b'APK exceeds explicit budget: 10000000' in old_cli.stdout
    old_apk = args.scratch / 'old-default-output/unsigned.apk'
    assert old_apk.stat().st_size > 10_000_000
    receipt = args.scratch / 'output/build-receipt.json'
    (args.evidence / 'original-build-receipt.json').write_bytes(receipt.read_bytes())
    result = {'status': 'passed', 'method': 'Actual shared Java host compilation and unsigned APK ZIP/payload verification',
              'baseCommit': subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], text=True).strip(),
              'dirtySourceExpected': True, 'sourceInputs': source,
              'fixtureFiles': {str(path.relative_to(game)): record(path) for path in game.rglob('*') if path.is_file()},
              'randomFixtureSeed': 63485, 'policy': declaration, 'originalDefaultRejected': old_rejection,
              'originalDefaultCliApkCap': {'command': old_command, 'exitCode': old_cli.returncode,
                                          'rejectedUnsignedApk': record(old_apk), 'capBytes': 10_000_000},
              'apk': record(apk), 'scratchApkPath': str(apk), 'signed': False,
              'installed': False, 'nativeGameplayVerified': False, 'physicalTvTested': False}
    (args.evidence / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': 'passed', 'apkBytes': apk.stat().st_size, 'nativeGameplayVerified': False}))


if __name__ == '__main__':
    main()
