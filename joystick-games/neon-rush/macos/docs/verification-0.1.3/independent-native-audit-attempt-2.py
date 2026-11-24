#!/usr/bin/env python3
"""Independently audit exported Mac CI bytes and recorded native observations."""
import datetime
import hashlib
import json
import math
import plistlib
import struct
import subprocess
import sys
import traceback
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[5]
EXPORT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/dev/shm/neon-macos-ci/43724380197/export')
TARGET = 'cc04129f0369c1e9f9262ab798b353f276f1dc3b'
RUN = 43724380197
OUTPUT = HERE / 'independent-native-audit.json'
SDK = 'puretv-joystick/joystick_sdk.py'
ORIGINAL_SDK_SHA = 'c5e18886fce56edf6c653640f056e01fe588403378f174c48553a054c1f9b023'
KEYS = ('UP', 'DOWN', 'LEFT', 'RIGHT', 'START', 'A', 'B', 'X', 'Y')
context = {}


def sha(body):
    return hashlib.sha256(body).hexdigest()


def read(path):
    return json.loads(path.read_text())


def committed(name):
    return subprocess.check_output(['git', 'show', TARGET + ':' + name], cwd=REPO)


def exported_bytes():
    manifest_path = EXPORT / 'export-manifest.json'
    manifest = read(manifest_path)
    assert manifest['sourceCommit'] == TARGET and manifest['runId'] == RUN
    assert manifest['runAttempt'] == 1
    assert manifest['buildResult'] == manifest['verifyResult'] == 'success'
    assert manifest['installPackagesValidated'] is True
    assert manifest['githubReleaseCreated'] is False and manifest['masterUpdated'] is False
    present = {str(p.relative_to(EXPORT)) for p in EXPORT.rglob('*') if p.is_file()}
    assert present == set(manifest['files']) | {'export-manifest.json'}
    for name, metadata in manifest['files'].items():
        body = (EXPORT / name).read_bytes()
        assert len(body) == metadata['bytes'] and sha(body) == metadata['sha256'], name
    return {'exportManifestSha256': sha(manifest_path.read_bytes()),
            'allListedFilesVerified': len(manifest['files']), 'noMissingOrUnlistedFiles': True,
            'workflowUrl': manifest['workflowUrl'], 'sourceCommit': TARGET,
            'scope': 'Computed manifest digest and verified every local exported file against its size/SHA-256 index.'}


def mach_architectures(body):
    magic, count = struct.unpack_from('>II', body)
    assert magic == 0xCAFEBABE and count == 2, 'Expected a two-slice universal Mach-O'
    names = {0x01000007: 'x86_64', 0x0100000C: 'arm64'}
    records = []
    for index in range(count):
        cpu, subtype, offset, size, align = struct.unpack_from('>IIIII', body, 8 + index * 20)
        assert cpu in names and offset + size <= len(body)
        thin_magic, thin_cpu = struct.unpack_from('<II', body, offset)
        assert thin_magic == 0xFEEDFACF and thin_cpu == cpu
        records.append({'architecture': names[cpu], 'offset': offset, 'bytes': size,
                        'sliceSha256': sha(body[offset:offset + size])})
    assert {r['architecture'] for r in records} == {'arm64', 'x86_64'}
    return records


def package():
    manifest = read(EXPORT / 'packages/build-manifest.json')
    assert manifest['sourceCommit'] == TARGET
    assert manifest['version'] == '0.1.3' and manifest['buildVersion'] == '3'
    assert set(manifest['architectures']) == {'arm64', 'x86_64'}
    assert manifest['signature'] == 'ad-hoc' and manifest['appleNotarized'] is False
    assert manifest['physicalControllerTested'] is False
    names = {'NeonRush-0.1.3-macos-universal.zip', 'NeonRush-0.1.3-macos-universal.dmg'}
    assert set(manifest['packages']) == names
    package_rows = []
    for name, metadata in manifest['packages'].items():
        body = (EXPORT / 'packages' / name).read_bytes()
        assert len(body) == metadata['bytes'] and sha(body) == metadata['sha256']
        package_rows.append({'name': name, **metadata})
    sums = {line.split()[1]: line.split()[0] for line in (EXPORT / 'packages/SHA256SUMS.txt').read_text().splitlines()}
    assert sums == {name: metadata['sha256'] for name, metadata in manifest['packages'].items()}
    for name, metadata in manifest['inputFiles'].items():
        body = committed(name)
        assert len(body) == metadata['bytes'] and sha(body) == metadata['sha256'], name
    with zipfile.ZipFile(EXPORT / 'packages/NeonRush-0.1.3-macos-universal.zip') as archive:
        prefix = 'Neon Rush.app/'
        names = {name[len(prefix):] for name in archive.namelist() if name.startswith(prefix) and not name.endswith('/')}
        assert names == set(manifest['appFiles'])
        for name, metadata in manifest['appFiles'].items():
            body = archive.read(prefix + name)
            assert len(body) == metadata['bytes'] and sha(body) == metadata['sha256'], name
        info = plistlib.loads(archive.read(prefix + 'Contents/Info.plist'))
        assert info['CFBundleShortVersionString'] == '0.1.3' and info['CFBundleVersion'] == '3'
        binary = archive.read(prefix + 'Contents/MacOS/' + info['CFBundleExecutable'])
        architectures = mach_architectures(binary)
        context['binarySha256'] = sha(binary)
        assets = []
        for name in ('game-model.js', 'game.js'):
            body = archive.read(prefix + 'Contents/Resources/Web/' + name)
            assert body == committed('resource/apps/neon-rush/src/main/assets/' + name)
            assets.append({'file': name, 'sha256': sha(body), 'matchesCommitByteForByte': True})
    for platform, architecture in [('macos-arm64', 'arm64'), ('macos-x64', 'x86_64')]:
        evidence = read(EXPORT / 'evidence' / ('neon-rush-macos-qa-' + platform) / 'package-verification.json')
        assert evidence['sourceCommit'] == TARGET and evidence['version'] == '0.1.3'
        assert evidence['buildVersion'] == '3' and evidence['architecture'] == architecture
        assert all(evidence[key] is True for key in ('sameUniversalPackage', 'zipBytesVerified', 'dmgBytesVerified', 'dmgInstalledCopyVerified'))
    return {'version': '0.1.3', 'buildVersion': '3', 'packages': package_rows,
            'zipAppFilesVerified': len(manifest['appFiles']),
            'committedBuildInputsVerified': len(manifest['inputFiles']),
            'binarySha256': context['binarySha256'], 'machOSlices': architectures, 'webAssets': assets,
            'dmgBoundary': 'DMG bytes independently hash-checked here; mounted/installed app checks are the archived Mac CI observations, not a new Linux mount.',
            'signature': 'ad-hoc', 'appleNotarized': False, 'physicalControllerTested': False}


def project(matrix, car):
    assert len(matrix) == 16 and all(math.isfinite(v) for v in matrix)
    p = (car['x'], car['y'] + .5, car['z'], 1)
    clip = [sum(matrix[column * 4 + row] * p[column] for column in range(4)) for row in range(4)]
    assert clip[3] > .01
    return clip[0] / clip[3]


def player(state):
    return state['input']['players'][0]


def neutral(state):
    p = player(state)
    return p['x'] == p['y'] == 0 and not any(p[key] for key in ('a', 'b', 'start', 'select'))


def native(platform, mode, graphics, process_architecture):
    directory = EXPORT / 'evidence' / ('neon-rush-macos-qa-' + platform) / mode
    report = read(directory / 'report.json')
    assert report['status'] == ('passed' if graphics else 'limited_graphics')
    assert 'error' not in report and report['observerErrors'] == []
    assert report['webglAvailable'] is graphics and report['nativeMacOSAppTested'] is True
    assert report['nativeProcessArchitecture'] == process_architecture
    assert report['architecture'] == ('arm64' if platform == 'macos-arm64' else 'x86_64')
    assert report['binarySha256'] == context['binarySha256']
    assert all(report[key] is False for key in ('physicalTvTested', 'physicalPhoneTested', 'physicalEsp32Tested'))
    assert len(report['tests']) == (11 if graphics else 7)
    assert all(row['status'] == 'passed' for row in report['tests'])
    assert report['sourceHashes'][SDK] == ORIGINAL_SDK_SHA == sha(committed(SDK))
    for name, digest in report['sourceHashes'].items():
        assert sha(committed(name)) == digest, name
    for filename in ('verify-native.py', 'native-drive.mjs', 'official-virtual-native.mjs', 'allow-local-network.py'):
        assert (directory / ('executed-' + filename)).read_bytes() == committed('resource/apps/neon-rush/macos/tests/' + filename)
    sent = {(r['connection'], r['message']['seq']) for r in report['wire'] if r['direction'] == 'sdk-to-game'}
    acks = {(r['connection'], r['message']['seq']) for r in report['wire'] if r['direction'] == 'game-to-sdk' and r['message']['type'] == 'ack'}
    assert sent == acks
    port = report['initialControllerPort']
    occupied = mode == 'native-occupied-port'
    assert report['defaultPortOccupied'] is occupied
    assert port != 63485 if occupied else port == 63485
    if occupied:
        occupation = report['defaultPortOccupation']
        assert occupation['port'] == 63485 and occupation['listeningBeforeApplicationStart'] and occupation['heldUntilApplicationExit']
    stability = report['portStability']
    assert stability['port'] == port and stability['cycles'] == 3
    assert stability['defaultPortOccupied'] is occupied
    assert stability['nativeGameplayAvailable'] is graphics
    assert all(stability[key] is True for key in ('sameConnection', 'samePort', 'backgroundInputSuppressed', 'foregroundHeldKeysQuarantined', 'freshPressWorks'))
    snapshots = {row['label']: row['state'] for row in report['snapshots']}
    startup = []
    available_seen = False
    for label, state in snapshots.items():
        info = state['server']['wifiController']
        if info['state'] == 'available':
            available_seen = True
            assert info['port'] == port
        else:
            # Before the first successful listener registration, zero means no
            # advertised endpoint yet; this is not a change of a bound port.
            assert not available_seen and info['state'] == 'registering' and info['port'] == 0
            assert not state['input']['players']
            startup.append({'label': label, 'state': info['state'], 'port': 0})
    assert available_seen
    cycles = []
    for cycle, observation in enumerate(stability['observations'], 1):
        assert observation['cycle'] == cycle and observation['port'] == port
        assert observation['session'] == stability['session']
        baseline = snapshots['Background clears game input ' + str(cycle)]
        frozen, counters = baseline['game']['model'], player(baseline)['pulseCounters']
        selected = [baseline] + [snapshots['Background suppresses ' + key + ' ' + str(cycle)] for key in KEYS]
        for state in selected:
            assert state['active'] is False and state['server']['wifiController']['inputEnabled'] is False
            assert neutral(state) and state['game']['model'] == frozen
            assert player(state)['pulseCounters'] == counters and player(state)['session'] == stability['session']
            assert state['input']['connections'] == 1
        for label in ('Game foreground ', 'Release quarantined keys '):
            state = snapshots[label + str(cycle)]
            assert state['active'] is True and state['server']['wifiController']['inputEnabled'] is True
            assert neutral(state) and state['game']['model'] == frozen
            assert player(state)['pulseCounters'] == counters and player(state)['session'] == stability['session']
        seq = observation['backgroundPingAckSequence']
        assert (1, seq) in acks
        if graphics:
            resumed = snapshots['Fresh START works after focus ' + str(cycle)]
            assert resumed['game']['paused'] is False and resumed['game']['tick'] > baseline['game']['tick']
        cycles.append({'cycle': cycle, 'sessionUnchanged': True, 'backgroundModelAndPulsesFrozen': True,
                       'heldKeysQuarantined': True, 'sameConnectionHeartbeatAckSequence': seq})
    assert report['mdns']['port'] == port and report['mdns']['txtVersion'] == '1'
    direction_rows = []
    if graphics:
        steering = report['steeringDirection']
        assert steering['passed'] and steering['sdkUnmodified'] and steering['gameStateWrites'] is False
        assert sorted(row['input'] for row in steering['cases']) == ['LEFT', 'RIGHT']
        for row in steering['cases']:
            sign = {'LEFT': -1, 'RIGHT': 1}[row['input']]
            before, after = row['before'], row['after']
            matrix = before['renderer']['cameraViewProjection']
            delta = project(matrix, after['model']['player']) - project(matrix, before['model']['player'])
            assert row['expectedSign'] == sign and delta * sign > .015
            assert math.isclose(delta, row['screenDeltaX'], rel_tol=1e-12, abs_tol=1e-12)
            assert after['model']['stats']['collisions'] == before['model']['stats']['collisions']
            assert before['connection']['controllerKind'] == after['connection']['controllerKind'] == 'wifi'
            assert before['renderer']['drawCalls'] > 0 and after['renderer']['drawCalls'] > 0
            assert any(r['direction'] == 'sdk-to-game' and r['connection'] == 1 and r['message'].get('key') == row['input'] and r['message'].get('action') == 'down' and r['message'].get('pressed') is True for r in report['wire'])
            direction_rows.append({'input': row['input'], 'expectedSign': sign, 'recomputedScreenDeltaX': delta})
        assert report['officialVirtualWebPageTested'] is True
        virtual = read(directory / 'official-virtual/report.json')
        assert virtual['status'] == 'passed' and virtual['errors'] == []
        assert all(row['status'] == 'passed' for row in virtual['tests'])
        assert virtual['originalHtmlSha256'] == sha(committed('puretv-joystick/virtual.html'))
        assert report['virtualControllerPort'] == port
    else:
        assert report['officialVirtualWebPageTested'] is False
        assert 'steeringDirection' not in report and report['limitations']
        assert all(row['freshStartResumesGame'] is None for row in stability['observations'])
    shutdown = next(row['details'] for row in report['tests'] if row['name'].startswith('Normal quit'))
    assert shutdown == {'normalExit': True, 'mdnsWithdrawn': True, 'tcpClosed': True}
    return {'mode': platform + '/' + mode, 'status': report['status'], 'testsPassed': len(report['tests']),
            'nativeProcessArchitecture': process_architecture, 'sdkSha256': ORIGINAL_SDK_SHA,
            'sdkMatchesOriginalAndCommit': True, 'binaryMatchesPackage': True,
            'gameStateWritesDeclared': False if graphics else 'No 3D direction test run',
            'directionCases': direction_rows, 'initialAndStablePort': port, 'defaultPortOccupied': occupied,
            'preRegistrationSnapshots': startup,
            'focusCyclesIndependentlyChecked': cycles, 'wireMessagesWithMatchingAck': len(sent),
            'limitations': report.get('limitations', []), 'physicalControllerTested': False}


def main():
    assert not OUTPUT.exists(), 'Preserve earlier audit output'
    result = {'status': 'running', 'auditedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'sourceCommit': TARGET, 'runId': RUN, 'exportDirectory': str(EXPORT),
              'auditScriptSha256': sha(Path(__file__).read_bytes()), 'gameRerun': False,
              'scope': 'Read-only verification of exported CI files, package bytes and native diagnostic/wire observations. No game state writes or additional hardware test.',
              'checks': []}
    checks = [('export_manifest_and_all_file_hashes', exported_bytes), ('package_and_committed_app_bytes', package)]
    checks += [(platform + '/' + mode, lambda p=platform, m=mode, g=graphics, a=architecture: native(p, m, g, a))
               for platform, mode, graphics, architecture in [('macos-arm64', 'native', True, 'arm64'),
                   ('macos-arm64', 'native-occupied-port', True, 'arm64'),
                   ('macos-arm64', 'rosetta', True, 'x86_64'), ('macos-x64', 'native', False, 'x86_64')]]
    for name, action in checks:
        try:
            result['checks'].append({'name': name, 'status': 'passed', 'details': action()})
        except Exception:
            result['checks'].append({'name': name, 'status': 'failed', 'error': traceback.format_exc()})
    result['status'] = 'passed' if all(row['status'] == 'passed' for row in result['checks']) else 'failed'
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'output': str(OUTPUT)}))
    return 0 if result['status'] == 'passed' else 1


if __name__ == '__main__':
    sys.exit(main())
