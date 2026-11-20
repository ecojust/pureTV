#!/usr/bin/env python3
"""Build only the unsigned Backroad graphics test Observer; never builds/signs the target."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
PACKAGE = 'com.ecojust.joystickgraphicsqa.backroadrally'
TARGET = 'com.ecojust.joystick.backroadrally'
RUNNER = 'com.ecojust.graphicsqa.GraphicsObserver'


def record(path):
    data = path.read_bytes()
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def sources():
    files = [Path(__file__).resolve(), HERE / 'graphics.js', *sorted((HERE / 'src').rglob('*.java'))]
    assert len(files) == 4 and all(p.is_file() and not p.is_symlink() for p in files)
    return {str(p.relative_to(ROOT)): record(p) for p in files}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    for name in ('sdk', 'jdk', 'output'):
        p.add_argument('--' + name, type=Path, required=True)
    p.add_argument('--require-committed', action='store_true')
    args = p.parse_args()
    out = args.output.resolve()
    assert not out.is_relative_to(ROOT), 'Build outputs belong outside the checkout'
    out.mkdir(parents=True, exist_ok=True)
    assert not list(out.iterdir()), 'Use a new empty attempt directory'
    source_files = sources()
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    if args.require_committed:
        for name in source_files:
            assert subprocess.check_output(['git', 'show', commit + ':' + name], cwd=ROOT) == (ROOT / name).read_bytes()
    android = args.sdk / 'platforms/android-35/android.jar'
    bt = args.sdk / 'build-tools/34.0.0'
    manifest = out / 'AndroidManifest.xml'
    manifest.write_text(f'''<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="{PACKAGE}" android:versionCode="1" android:versionName="1.0"><uses-sdk android:minSdkVersion="26" android:targetSdkVersion="35"/><uses-permission android:name="android.permission.INTERNET"/><application android:label="pureTV graphics diagnostic observer" android:hasCode="true" android:testOnly="true"/><instrumentation android:name="{RUNNER}" android:targetPackage="{TARGET}" android:functionalTest="true" android:handleProfiling="false"/></manifest>''')
    classes = out / 'classes'; classes.mkdir()
    dex = out / 'dex'; dex.mkdir()
    def run(*command):
        subprocess.run([str(x) for x in command], check=True)
    run(args.jdk / 'bin/javac', '-source', '8', '-target', '8', '-bootclasspath', android,
        '-d', classes, *sorted((HERE / 'src').rglob('*.java')))
    run(bt / 'd8', '--min-api', '26', '--lib', android, '--output', dex, *sorted(classes.rglob('*.class')))
    apk = out / 'backroad-graphics-observer-unsigned.apk'
    run(bt / 'aapt2', 'link', '--manifest', manifest, '-I', android, '-o', apk)
    with zipfile.ZipFile(apk, 'a', compression=zipfile.ZIP_DEFLATED) as archive:
        for f in sorted(dex.glob('*.dex')):
            archive.write(f, f.name)
        archive.write(HERE / 'graphics.js', 'assets/graphics.js')
    assert sources() == source_files, 'Diagnostic sources changed during compilation'
    with zipfile.ZipFile(apk) as archive:
        assert archive.testzip() is None
        assert set(archive.namelist()) == {'AndroidManifest.xml', 'classes.dex', 'assets/graphics.js'}
        contents = {name: {'bytes': len(archive.read(name)), 'sha256': hashlib.sha256(archive.read(name)).hexdigest()} for name in archive.namelist()}
    receipt = {'schemaVersion': 1, 'scope': 'Separate unsigned test Observer only', 'game': 'backroad-rally',
               'packageName': PACKAGE, 'targetPackage': TARGET, 'instrumentationRunner': RUNNER,
               'component': PACKAGE + '/' + RUNNER, 'sourceCommit': commit,
               'committedInputsVerified': args.require_committed, 'sourceFiles': source_files,
               'minSdk': 26, 'targetSdk': 35, 'testOnly': True, 'signed': False,
               'targetApkBuilt': False, 'targetApkChanged': False, 'modelWrites': False, 'clockOverrides': False,
               'nativeInputPolls': False, 'glContextCalls': False,
               'readonlyEndpoints': ['/status', '/console', '/graphics'],
               'apk': apk.name, 'apkIdentity': record(apk), 'content': contents}
    (out / 'observer-build.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'apk': str(apk), 'identity': receipt['apkIdentity'], 'signed': False, 'targetApkBuilt': False}))


if __name__ == '__main__':
    main()
