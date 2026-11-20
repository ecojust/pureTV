import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

output = Path(__file__).resolve().parent
supported = {'turbo-kart-rally', 'clawd-pop', 'saber-magic-tower', 'operation-ironhold', 'lumenrift'}
games = [g for g in os.environ['GAMES'].split(',') if g in supported]
assert games
report = {'sourceSha': os.environ['GITHUB_SHA'], 'runId': os.environ['GITHUB_RUN_ID'],
          'runAttempt': os.environ['GITHUB_RUN_ATTEMPT'], 'scope': 'installation', 'games': {}}

def adb(*args):
    command = [str(Path(os.environ['ANDROID_HOME']) / 'platform-tools/adb'), '-s', 'emulator-5554', *args]
    result = subprocess.run(command, capture_output=True, text=True, timeout=120)
    if result.returncode:
        raise RuntimeError(f'{args[0]} exited {result.returncode}: {result.stdout} {result.stderr}')
    return result.stdout.strip()

def verifier_settings():
    return {key: adb('shell', 'settings', 'get', 'global', key)
            for key in ('package_verifier_enable', 'verifier_verify_adb_installs')}

def package_present(package):
    return 'package:' + package in adb('shell', 'pm', 'list', 'packages', package).splitlines()

def check_game(game, row):
    folder = Path(os.environ['RUNNER_TEMP']) / 'signed' / 'packages' / game
    receipt = json.loads((folder / 'signing-receipt.json').read_text())
    package = receipt['packageName']
    apk = folder / (game + '-' + receipt['versionName'] + '.apk')
    row.update(packageName=package, apkSha256=hashlib.sha256(apk.read_bytes()).hexdigest(),
               signingCertificateSha256=receipt['certificateSha256'])
    assert row['apkSha256'] == receipt['sha256'], 'APK hash differs from the verified receipt'
    assert not package_present(package), 'Package already present on clean AVD'
    try:
        row['install'] = adb('install', str(apk))
        assert 'Success' in row['install'].splitlines(), row['install']
        dump = adb('shell', 'dumpsys', 'package', package)
        (output / (game + '-dumpsys.txt')).write_text(dump + '\n')
        assert re.search(r'^\s*Package \[' + re.escape(package) + r'\] \(', dump, re.M), 'Wrong package'
        name = re.search(r'^\s*versionName=(\S+)\s*$', dump, re.M)
        code = re.search(r'^\s*versionCode=(\d+)\b', dump, re.M)
        target = re.search(r'\btargetSdk=(\d+)\b', dump)
        assert name and code and target, 'Installed package metadata missing'
        row.update(versionName=name[1], versionCode=int(code[1]), targetSdk=int(target[1]))
        assert all(row[k] == receipt[k] for k in ('versionName', 'versionCode', 'targetSdk')), 'Installed metadata mismatch'
        assert (row['versionName'], row['targetSdk']) == ('0.1.1', 35), 'Unexpected expansion package revision'
    finally:
        if package_present(package):
            row['uninstall'] = adb('uninstall', package)
            assert row['uninstall'] == 'Success' and not package_present(package), 'Uninstall incomplete'
    assert row.get('uninstall') == 'Success'

try:
    report['device'] = {key: adb('shell', 'getprop', key) for key in
                        ('sys.boot_completed', 'ro.build.version.sdk', 'ro.build.fingerprint', 'ro.product.cpu.abi')}
    assert report['device']['sys.boot_completed'] == '1' and report['device']['ro.build.version.sdk'] == '36'
    assert 'feature:android.software.leanback' in adb('shell', 'pm', 'list', 'features').splitlines()
    report['verifierBefore'] = verifier_settings()
    assert all(value in ('1', 'null') for value in report['verifierBefore'].values()), 'Unexpected verifier setting'
    for game in games:
        row = report['games'][game] = {'passed': False}
        try:
            check_game(game, row)
            row['passed'] = True
        except Exception as exc:
            row['error'] = str(exc)
    report['verifierAfter'] = verifier_settings()
    assert report['verifierBefore'] == report['verifierAfter'], 'Verifier settings changed'
    assert all(row['passed'] for row in report['games'].values()), 'Package installation checks failed'
    report['status'] = 'passed'
except Exception as exc:
    report.update(status='failed', error=str(exc))
finally:
    (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        print('### Android TV 16 signed-package installation\n', file=summary)
        print('| Game | Result | Version | Code | Target SDK |\n| --- | --- | --- | --- | --- |', file=summary)
        for game in games:
            row = report['games'].get(game, {})
            status = 'Passed' if row.get('passed') else 'Failed' if row else 'Unverified'
            print('|', game, '|', status, '|', row.get('versionName', ''), '|',
                  row.get('versionCode', ''), '|', row.get('targetSdk', ''), '|', file=summary)
print(json.dumps(report, indent=2))
raise SystemExit(report['status'] != 'passed')
