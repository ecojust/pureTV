#!/usr/bin/env python3
"""Build a separate, unsigned read-only instrumentation APK; never generates a key."""
import argparse
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PACKAGES = {'cf-transport-ship': 'com.ecojust.joystickcf', 'qq-speed': 'com.ecojust.joystickqqspeed'}


def identity(path):
    return {'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--game', choices=PACKAGES, required=True)
    for name in ['sdk', 'jdk', 'output']:
        p.add_argument('--' + name, type=Path, required=True)
    a = p.parse_args()
    out = a.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    assert not list(out.iterdir()), 'Use an empty output directory; previous attempts are immutable'
    package = PACKAGES[a.game]
    observer = 'com.ecojust.joystickqa.' + a.game.replace('-', '')
    source = HERE / 'src/com/ecojust/controllerqa/Observer.java'
    android = a.sdk / 'platforms/android-35/android.jar'
    bt = a.sdk / 'build-tools/34.0.0'
    classes = out / 'classes'; classes.mkdir()
    dex = out / 'dex'; dex.mkdir()
    manifest = out / 'AndroidManifest.xml'
    manifest.write_text(f'''<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="{observer}" android:versionCode="1" android:versionName="1.0"><uses-sdk android:minSdkVersion="26" android:targetSdkVersion="35"/><uses-permission android:name="android.permission.INTERNET"/><application android:label="pureTV joystick read-only observer" android:hasCode="true" android:testOnly="true"/><instrumentation android:name="com.ecojust.controllerqa.Observer" android:targetPackage="{package}" android:functionalTest="true" android:handleProfiling="false"/></manifest>''')
    def run(*command):
        subprocess.run([str(v) for v in command], check=True)
    run(a.jdk / 'bin/javac', '-source', '8', '-target', '8', '-bootclasspath', android, '-d', classes, source)
    run(bt / 'd8', '--min-api', '26', '--lib', android, '--output', dex, *sorted(classes.rglob('*.class')))
    apk = out / f'observer-{a.game}-unsigned.apk'
    run(bt / 'aapt2', 'link', '--manifest', manifest, '-I', android, '-o', apk)
    with zipfile.ZipFile(apk, 'a', compression=zipfile.ZIP_DEFLATED) as z:
        for f in sorted(dex.glob('*.dex')):
            z.write(f, f.name)
    report = {'game': a.game, 'targetPackage': package, 'observerPackage': observer, 'packageName': observer,
              'instrumentationRunner': 'com.ecojust.controllerqa.Observer',
              'component': observer + '/com.ecojust.controllerqa.Observer', 'diagnosticPort': 63486,
              'readonlyEndpoints': ['/status', '/snapshot'], 'modelWrites': False, 'clockOverrides': False,
              'signed': False, 'apk': apk.name, 'apkIdentity': identity(apk),
              'sourceFiles': {str(f.relative_to(ROOT)): identity(f) for f in [source, Path(__file__)]},
              'classFiles': {str(f.relative_to(classes)): identity(f) for f in sorted(classes.rglob('*.class'))}}
    (out / 'observer-build.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'apk': str(apk), 'component': report['component'], 'signed': False}))


if __name__ == '__main__':
    main()
