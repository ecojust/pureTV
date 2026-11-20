#!/usr/bin/env python3
"""Compile Night Racer's exact nested payload; unsigned packaging check, not gameplay QA."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[4]
spec = importlib.util.spec_from_file_location('nested_android_build', ROOT / 'joystick-games/tools/android-build.py')
android = importlib.util.module_from_spec(spec)
spec.loader.exec_module(android)

def main():
    scratch, toolchain = map(Path, sys.argv[1:3])
    assert not scratch.exists(), 'Use a new attempt directory'
    scratch.mkdir(parents=True)
    inputs = android.sources('night-racer')
    (scratch / 'input-files-before.json').write_text(json.dumps(inputs, indent=2) + '\n')
    kit, game, expected = android.prepare('night-racer', scratch / 'composition')
    builder = android.builder()
    builder.main(['--kit', str(kit), '--game', str(game), '--output', str(scratch / 'output'),
                  '--sdk', str(toolchain / 'android-sdk'), '--jdk', str(toolchain / 'jdk-17.0.21+9'),
                  '--zxing', str(toolchain / 'core-3.5.3.jar'), '--cache', str(scratch / 'dex-cache')],
                 limits=android.asset_policy.android_limits(android.metadata('night-racer'), android.policy_registration('night-racer')))
    apk = scratch / 'output/unsigned.apk'
    with zipfile.ZipFile(apk) as archive:
        assert len(archive.namelist()) == len(set(archive.namelist()))
        actual = {n[7:]: archive.read(n) for n in archive.namelist() if n.startswith('assets/')}
    assert actual == expected, 'Nested APK payload differs from original bytes'
    after = android.sources('night-racer')
    (scratch / 'input-files-after.json').write_text(json.dumps(after, indent=2) + '\n')
    assert inputs == after, 'Packaging inputs changed during compile'
    report = {'status': 'passed', 'game': 'night-racer', 'signed': False,
              'runtimeTested': False, 'sourceCommitFrozen': False,
              'scope': 'Actual JDK17/aapt2/D8 compile and complete asset byte equality only.',
              'apk': android.record(apk), 'assetCount': len(actual),
              'inputFiles': inputs, 'assets': {name: {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
                                               for name, data in actual.items()}}
    (scratch / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k not in ('inputFiles', 'assets')}))

if __name__ == '__main__':
    main()
