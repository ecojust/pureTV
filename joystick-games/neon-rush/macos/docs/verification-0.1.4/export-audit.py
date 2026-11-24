"""Audit an untouched Neon macOS workflow export against its frozen source."""
from pathlib import Path
import argparse
import hashlib
import json
import plistlib
import struct
import subprocess
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--export', type=Path, required=True)
parser.add_argument('--repo', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
SOURCE = '37f180164803c035e2fa9127580ada96c7cc1cec'
PRODUCTION_FREEZE = '802c48bcec9d060bdce691045330c822c4f1cf83'
RUN = 43847934677
VERSION, BUILD = '0.1.4', '4'
OUT = args.export.resolve()
GAME = 'resource/apps/neon-rush/'
MAC = GAME + 'macos/'
TEST = MAC + 'tests/'
SHARED = 'resource/game-kit/web/puretv-controller.js'
EXPECTED_QA_SOURCES = {
    TEST + 'verify-native.py', TEST + 'native-drive.mjs', TEST + 'official-virtual-native.mjs',
    TEST + 'allow-local-network.py', 'puretv-joystick/joystick_sdk.py',
    'puretv-joystick/bridge.py', 'puretv-joystick/virtual.html', GAME + 'tests/automation.mjs',
    GAME + 'source/model.mjs', GAME + 'source/tracks.mjs', MAC + 'Sources/main.swift', SHARED,
}
EXPORTED_SOURCES = {
    'executed-verify-native.py': TEST + 'verify-native.py',
    'executed-main.swift': MAC + 'Sources/main.swift',
    'executed-puretv-controller.js': SHARED,
    'executed-native-drive.mjs': TEST + 'native-drive.mjs',
    'executed-allow-local-network.py': TEST + 'allow-local-network.py',
    'executed-official-virtual-native.mjs': TEST + 'official-virtual-native.mjs',
}
BASE_TESTS = {
    'Local HTTP assets match the bundle and reject invalid requests',
    'Bonjour resolves the actual TCP port and version',
    'Unmodified SDK connects and synchronizes nine keys',
    'Directions, A/X aggregation, long hold and sync suppression',
    'Three real focus changes keep TCP stable and quarantine background input',
    'Every observed SDK message has the same-sequence ACK',
    'Normal quit closes TCP and withdraws Bonjour',
}
GRAPHICAL_TESTS = {
    'SDK LEFT and RIGHT move toward their actual screen directions',
    'Real race using TCP A/B and X/Y, drift, nitro and pause',
    'Disconnect cancellation and held-sync reconnect safety',
    'Official virtual page controls the actual native application',
}

def sha(data):
    return hashlib.sha256(data).hexdigest()

def git(path):
    return subprocess.check_output(['git', 'show', SOURCE + ':' + path], cwd=args.repo)

def checked_file(path, metadata):
    data = path.read_bytes()
    assert len(data) == metadata['bytes'], str(path)
    assert sha(data) == metadata['sha256'], str(path)
    return data

def read(path):
    return json.loads(path.read_text())

manifest = read(OUT / 'export-manifest.json')
source_changes = subprocess.check_output(['git', 'diff', '--name-only', PRODUCTION_FREEZE, SOURCE], cwd=args.repo, text=True).splitlines()
assert source_changes == [GAME + 'tests/runtime-hooks.test.mjs']
assert manifest['sourceCommit'] == SOURCE and manifest['runId'] == RUN
assert manifest['runAttempt'] == 1 and manifest['installPackagesValidated'] is True
assert manifest['buildResult'] == manifest['verifyResult'] == 'success'
assert manifest['exportBranch'] == f'build-assets/neon-rush-macos-{RUN}-attempt-1'
for name, item in manifest['files'].items():
    assert not Path(name).is_absolute() and '..' not in Path(name).parts
    checked_file(OUT / name, item)

build = read(OUT / 'packages/build-manifest.json')
assert (build['sourceCommit'], build['version'], build['buildVersion']) == (SOURCE, VERSION, BUILD)
assert set(build['architectures']) == {'arm64', 'x86_64'}
assert build['minimumMacOS'] == '11.0'
assert build['signature'] == 'ad-hoc' and build['appleNotarized'] is False
tracked = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', SOURCE], cwd=args.repo, text=True).splitlines()
input_names = {MAC + 'build.py', GAME + 'package.json', GAME + 'package-lock.json', GAME + 'game.json',
               GAME + 'logo.svg', GAME + 'LICENSE', GAME + 'NOTICE.md',
               'resource/game-kit/build.py', '.github/workflows/neon-rush-macos.yml'}
input_prefixes = tuple([MAC + name + '/' for name in ('Sources', 'Web', 'tools', 'tests')]
                       + [GAME + name + '/' for name in ('source', 'tests', 'tools', 'src/main/assets')]
                       + ['resource/game-kit/web/', 'resource/game-kit/qa/'])
input_names.update(path for path in tracked if path.startswith(input_prefixes) and '__pycache__' not in Path(path).parts)
assert set(build['inputFiles']) == input_names, {'missing': sorted(input_names - set(build['inputFiles'])),
                                              'extra': sorted(set(build['inputFiles']) - input_names)}
for name, item in build['inputFiles'].items():
    data = git(name)
    assert len(data) == item['bytes'] and sha(data) == item['sha256'], name
for name, item in build['packages'].items():
    checked_file(OUT / 'packages' / name, item)
sums = {name: hashcode for hashcode, name in
        (line.split('  ', 1) for line in (OUT / 'packages/SHA256SUMS.txt').read_text().splitlines())}
assert set(sums) == set(build['packages'])
assert all(sums[name] == item['sha256'] for name, item in build['packages'].items())

with zipfile.ZipFile(OUT / f'packages/NeonRush-{VERSION}-macos-universal.zip') as archive:
    for name, item in build['appFiles'].items():
        data = archive.read('Neon Rush.app/' + name)
        assert len(data) == item['bytes'] and sha(data) == item['sha256'], name
    plist = plistlib.loads(archive.read('Neon Rush.app/Contents/Info.plist'))
    assert (plist['CFBundleShortVersionString'], plist['CFBundleVersion']) == (VERSION, BUILD)
    assert archive.read('Neon Rush.app/Contents/Resources/Web/puretv-controller.js') == git('resource/game-kit/web/puretv-controller.js')
    binary = archive.read('Neon Rush.app/Contents/MacOS/NeonRush')
    assert struct.unpack('>I', binary[:4])[0] == 0xcafebabe
    cpu_types = [struct.unpack('>IIIII', binary[8 + 20 * i:28 + 20 * i])[0]
                 for i in range(struct.unpack('>I', binary[4:8])[0])]
    assert set(cpu_types) == {0x1000007, 0x100000c}

reports = {}
for platform, mode in [('macos-arm64', 'native-occupied-port'), ('macos-arm64', 'native'),
                       ('macos-arm64', 'rosetta'), ('macos-x64', 'native')]:
    platform_root = OUT / 'evidence' / ('neon-rush-macos-qa-' + platform)
    report_root = platform_root / mode
    package_check = read(platform_root / 'package-verification.json')
    assert (package_check['sourceCommit'], package_check['version'], package_check['buildVersion']) == (SOURCE, VERSION, BUILD)
    assert all(package_check[key] is True for key in ('sameUniversalPackage', 'zipBytesVerified',
                                                     'dmgBytesVerified', 'dmgInstalledCopyVerified'))
    assert package_check['signature'] == 'ad-hoc' and package_check['appleNotarized'] is False
    assert package_check['architecture'] == ('arm64' if platform == 'macos-arm64' else 'x86_64')
    report = read(report_root / 'report.json')
    graphical = report['status'] == 'passed'
    assert graphical or (platform == 'macos-x64' and report['status'] == 'limited_graphics'
                         and report['webglAvailable'] is False)
    assert report['architecture'] == ('arm64' if platform == 'macos-arm64' else 'x86_64')
    assert report['nativeProcessArchitecture'] == ('arm64' if platform == 'macos-arm64' and mode != 'rosetta' else 'x86_64')
    if graphical:
        assert report['webglAvailable'] is True
    assert report['binarySha256'] == sha(binary)
    assert all(t['status'] == 'passed' for t in report['tests'])
    assert {t['name'] for t in report['tests']} == BASE_TESTS | (GRAPHICAL_TESTS if graphical else set())
    assert len(report['tests']) == (11 if graphical else 7)
    assert set(report['sourceHashes']) == EXPECTED_QA_SOURCES
    for name, expected in report['sourceHashes'].items():
        assert sha(git(name)) == expected, name
    for exported_name, source_name in EXPORTED_SOURCES.items():
        assert (report_root / exported_name).read_bytes() == git(source_name), exported_name
    for item in report['screenshots']:
        checked_file(report_root / item['file'], item)
    messages = [row['message'] for row in report['wire'] if row['direction'] == 'sdk-to-game']
    sent = {(row['connection'], row['message']['seq']) for row in report['wire'] if row['direction'] == 'sdk-to-game'}
    acks = {(row['connection'], row['message']['seq']) for row in report['wire']
            if row['direction'] == 'game-to-sdk' and row['message'].get('type') == 'ack'}
    assert sent == acks and len(sent) > 9 and not report['observerErrors']
    assert messages[0]['type'] == 'hello'
    identity = messages[0]['controller_id']
    assert isinstance(identity, str) and identity.startswith('virtual-')
    identities = report['controllerIdentityDisplay']
    assert len(identities) == (6 if graphical else 1), (platform, mode, len(identities))
    assert identities[0]['expectedConnected'] is True
    assert identities[0]['screenshot'] == 'diagnostics/controller-menu.png'
    assert 'diagnostics/controller-menu.png' in {s['file'] for s in report['screenshots']}
    assert report['controllerIdentityScope'] == ('menu, actual racing, pause, disconnect and reconnect'
                                                if graphical else 'menu only; no WebGL driving claim')
    for row in identities:
        visible = [card for card in row['document']['controllerClients'] if card['visible']]
        if row['expectedConnected']:
            assert row['expectedControllerId'] == row['nativeControllerId'] == identity
            assert len(visible) == 1
            card = visible[0]
            assert card['controllerId'] == identity and card['playerId'] == '1'
            assert card['idText'] == 'ID: ' + identity
            assert all(card[key] is True for key in ('visible', 'fullyVisible', 'iconVisible', 'idTextFullyVisible'))
            assert card['idTextOverflow'] != 'ellipsis'
            assert card['statusText'] == ('已连接' if report['language'] == 'zh' else 'Connected')
        else:
            assert not visible and row['nativeControllerId'] is None
    assert identities[0]['gamePhase'] == 'menu'
    if graphical:
        assert [row['expectedConnected'] for row in identities] == [True, True, True, False, True, True]
        assert identities[1]['gamePhase'] == 'playing' and identities[1]['paused'] is False
        assert identities[2]['paused'] is True and identities[-1]['paused'] is True
        required_pngs = {'controller-menu.png', 'controller-playing.png', 'driving-paused.png',
                         'controller-disconnected.png', 'reconnected.png'}
        assert required_pngs.issubset({Path(s['file']).name for s in report['screenshots']})
        steering = report['steeringDirection']
        assert steering['passed'] is True and steering['sdkUnmodified'] is True
        assert steering['gameStateWrites'] is False
        cases = steering['cases']
        assert len(cases) == 2 and {case['input'] for case in cases} == {'LEFT', 'RIGHT'}
        for case in cases:
            expected = -1 if case['input'] == 'LEFT' else 1
            assert case['expectedSign'] == expected and case['screenDeltaX'] * expected > 0
    stability = report['portStability']
    assert stability['cycles'] == 3 and stability['port'] == report['initialControllerPort']
    assert all(stability[key] is True for key in ('sameConnection', 'samePort', 'backgroundInputSuppressed',
                                                 'foregroundHeldKeysQuarantined', 'freshPressWorks'))
    assert {row['port'] for row in stability['observations']} == {stability['port']}
    assert {row['session'] for row in stability['observations']} == {stability['session']}
    assert report['mdns']['txtVersion'] == '1'
    if mode == 'native-occupied-port':
        assert report['defaultPortOccupied'] is True and stability['port'] != 63485
        assert report['defaultPortOccupation']['port'] == 63485
    else:
        assert report['defaultPortOccupied'] is False and stability['port'] == 63485
    if mode == 'rosetta':
        assert report['nativeProcessArchitecture'] == 'x86_64'
    reports[platform + '/' + mode] = {
        key: report.get(key) for key in ['status', 'architecture', 'nativeProcessArchitecture', 'language',
            'initialControllerPort', 'defaultPortOccupied', 'webglAvailable', 'mdns', 'portStability',
            'steeringDirection', 'limitations', 'controllerIdentityScope']}
    reports[platform + '/' + mode].update({
        'tests': [{'name': item['name'], 'status': item['status']} for item in report['tests']],
        'controllerIdFromOriginalHello': identity,
        'controllerIdentityDisplay': [{key: row.get(key) for key in
            ('label', 'expectedConnected', 'expectedControllerId', 'nativeControllerId', 'gamePhase', 'paused', 'screenshot')}
            for row in identities],
        'sourceFilesVerified': len(report['sourceHashes']),
        'screenshotsVerified': len(report['screenshots']),
        'matchingSdkAcks': len(acks),
    })

summary = {'status': 'passed', 'sourceCommit': SOURCE, 'runId': RUN,
           'productionSourceCommit': PRODUCTION_FREEZE, 'differenceFromProductionFreeze': source_changes,
           'statusScope': 'Export provenance and each mode within its explicitly reported full-graphics or menu-only scope',
           'exportFilesVerified': len(manifest['files']), 'inputFilesVerified': len(build['inputFiles']),
           'appFilesVerified': len(build['appFiles']), 'version': VERSION, 'buildVersion': BUILD,
           'binarySha256': sha(binary), 'packages': build['packages'], 'reports': reports}
args.output.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: value for key, value in summary.items() if key != 'reports'}, ensure_ascii=False, indent=2))
