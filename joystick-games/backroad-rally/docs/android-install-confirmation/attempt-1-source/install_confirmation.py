#!/usr/bin/env python3
"""Opt-in ordinary confirmation for one frozen Backroad APK, never global verifier changes.

The captured 44614635591 page is collapsed: no Install anyway has been observed.
Expanded-page fixtures are synthetic boundary tests, not evidence of Android success.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import struct
import time
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('confirmation_observations', HERE / 'install_failure.py')
observations = importlib.util.module_from_spec(spec)
spec.loader.exec_module(observations)

PACKAGE = 'com.ecojust.joystick.backroadrally'
LABEL = 'Backroad Rally'
APK = {'bytes': 105020455, 'sha256': '8596350c7868352a9494d0667037ef4a75709af25cf50066df137bab3bcd8808'}
ACTIVITY = 'com.android.vending/com.google.android.finsky.protectdialogs.activity.PlayProtectDialogsActivity'
REASON = "This app was built for an older version of Android and doesn't include the latest privacy protections."
MAX_SECONDS = 120


def require(condition, message):
    if not condition:
        raise ValueError(message)


def original_identity(apk, package, failed_command, adb, expected_apk):
    require(package == PACKAGE, 'Only the frozen Backroad package is authorized')
    require({key: expected_apk.get(key) for key in APK} == APK, 'Not the authorized signed APK identity')
    require(failed_command.get('command') == list(adb) + ['install', '-r', str(apk)] and
            failed_command.get('status') == 'timed-out', 'Not the original target install timeout')
    digest = hashlib.sha256()
    with Path(apk).open('rb') as source:
        for block in iter(lambda: source.read(512 * 1024), b''):
            digest.update(block)
    require({'bytes': Path(apk).stat().st_size, 'sha256': digest.hexdigest()} == APK,
            'Actual APK bytes differ from the authorized original')


def session_identity(text, failed_command):
    active = text.split('Finalized install sessions:', 1)[0]
    blocks = re.findall(r'Active Session (\d+):\s*([\s\S]*?)(?=\n\s*Active Session |\Z)', active)
    require(len(blocks) == 1, 'Exactly one active installation session is required; no residual sessions')
    ident, block = blocks[0]
    values = dict(re.findall(r'\b([A-Za-z]\w*)=([^\s]*)', block))
    expected = {'userId': '0', 'mOriginalInstallerUid': '2000', 'mInstallerUid': '2000',
                'installInitiatingPackageName': 'com.android.shell', 'sizeBytes': str(APK['bytes']),
                'mCommitted': 'true', 'mSealed': 'true', 'mDestroyed': 'false',
                'mSessionApplied': 'false', 'mSessionFailed': 'false', 'mSessionReady': 'false',
                'isMultiPackage': 'false', 'isStaged': 'false', 'mParentSessionId': '-1',
                'mChildSessionIds': '[]', 'mSessionErrorCode': '0'}
    require(all(values.get(key) == value for key, value in expected.items()), 'Unexpected active installer session state')
    require(values.get('appPackageName') in ('null', PACKAGE), 'Session names another package')
    # Host/device timestamps can differ by <1s in the recorded emulator; SHA below is the exact binding.
    start, end = float(failed_command['startedAt']), float(failed_command['endedAt'])
    require(start <= end and 0 < end - start <= 245, 'Invalid original installation interval')
    created, committed = int(values['createdMillis']) / 1000, int(values['committedMillis']) / 1000
    require(start - 5 <= created <= committed <= end + 5, 'Session does not belong to this timed-out install')
    stage = '/data/app/vmdl' + ident + '.tmp'
    require(values.get('stageDir') == stage, 'Unexpected staged APK location')
    return {'id': int(ident), 'stageApk': stage + '/base.apk', 'createdAt': created, 'committedAt': committed}


def dialog_action(folder, label, failed_command):
    """Read fresh captured facts, not coordinates guessed from a prior screenshot."""
    folder = Path(folder)
    report = json.loads((folder / 'report.json').read_text())
    require(report.get('apk') == APK and report.get('targetPackage') == PACKAGE, 'Capture identity mismatch')
    commands = {record.get('outputPath'): record for record in report.get('commands', [])}
    for name in ('foreground.txt', 'windows.txt', 'installer-sessions.txt', 'screen.png', 'ui-dump-command.txt', 'ui.xml'):
        item = commands.get(name, {})
        require(item.get('status') == 'completed' and item.get('exitCode') == 0, 'Incomplete fresh capture: ' + name)
        require(item.get('output') == observations.info(folder / name), 'Capture bytes changed: ' + name)
    foreground = (folder / 'foreground.txt').read_text()
    tops = re.findall(r'^\s*topResumedActivity=.*?\bu0 ([^\s}]+)', foreground, re.M)
    focuses = re.findall(r'^\s*mCurrentFocus=.*?\bu0 ([^\s}]+)', foreground, re.M)
    require(tops == [ACTIVITY] and focuses == [ACTIVITY], 'Play Protect is not the unique resumed and focused activity')
    require(ACTIVITY in (folder / 'windows.txt').read_text(), 'Dialog window is absent')
    png = (folder / 'screen.png').read_bytes()
    require(observations.complete_png(png), 'Incomplete actual screenshot')
    width, height = struct.unpack('>II', png[16:24])
    require(0 < width <= 8192 and 0 < height <= 8192, 'Invalid screenshot bounds')
    xml = (folder / 'ui.xml').read_bytes()
    require(b'<!DOCTYPE' not in xml and b'<!ENTITY' not in xml, 'XML declarations not allowed')
    root = ET.fromstring(xml)
    require(root.tag == 'hierarchy', 'Not a UI hierarchy')
    nodes = list(root.iter('node'))
    require(nodes and len(nodes) <= 300 and all(n.get('package') == 'com.android.vending' for n in nodes),
            'Unexpected UI package or ambiguous overlay')
    texts = [n.get('text') for n in nodes if n.get('text')]
    for expected in ('Google Play Protect', 'Unsafe app blocked', LABEL, REASON):
        require(texts.count(expected) == 1, 'Missing or ambiguous expected dialog text: ' + expected)
    matches = [n for n in nodes if n.get('text') == label]
    require(len(matches) == 1, 'Required explicit control not uniquely present: ' + label)
    parents = {child: parent for parent in root.iter() for child in parent}
    target = matches[0]
    while target.get('clickable') != 'true':
        target = parents.get(target)
        require(target is not None and target.tag == 'node', 'Text has no real clickable ancestor')
    require(target.get('enabled') == 'true', 'Control is disabled')
    bounds = re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', target.get('bounds', ''))
    require(bounds is not None, 'Malformed control bounds')
    x1, y1, x2, y2 = map(int, bounds.groups())
    require(0 <= x1 < x2 <= width and 0 <= y1 < y2 <= height, 'Control lies outside actual screenshot')
    require((x2 - x1) * (y2 - y1) < width * height / 2, 'Clickable ancestor is not a specific control')
    session = session_identity((folder / 'installer-sessions.txt').read_text(), failed_command)
    return {'label': label, 'bounds': [x1, y1, x2, y2], 'tap': [(x1 + x2) // 2, (y1 + y2) // 2],
            'session': session, 'xml': observations.info(folder / 'ui.xml'), 'screen': observations.info(folder / 'screen.png')}


def confirm(adb, apk, package, output, failed_command, *, expected_apk, original_evidence, seconds=MAX_SECONDS):
    """Return installed-exact-apk only after a fresh package-manager path and device SHA/size match.

    There are at most two ordinary UI taps, zero install retries and zero settings writes.
    Any mismatch/unknown label/session/hash stops; original timeout evidence is untouched.
    """
    require(0 < seconds <= MAX_SECONDS, 'Invalid confirmation budget')
    output = Path(output)
    output.mkdir(parents=True, exist_ok=False)
    started = time.monotonic()
    deadline = started + seconds - 2
    report = {'schemaVersion': 1, 'status': 'blocked', 'targetPackage': package,
              'scope': 'Explicit opt-in confirmation for one frozen APK; not gameplay acceptance',
              'apk': dict(APK), 'originalFailurePreserved': True, 'originalEvidence': str(original_evidence),
              'settingsChanged': False, 'installRetried': False, 'maximumSeconds': seconds,
              'actions': [], 'commands': [], 'captures': []}

    def command(name, args, timeout=8):
        result = observations.bounded_command(list(adb) + args, output / name,
                                              min(deadline, time.monotonic() + timeout), 65536)
        report['commands'].append(result)
        require(result.get('status') == 'completed' and result.get('exitCode') == 0, 'ADB observation/action failed: ' + name)
        return (output / name).read_text().strip()

    def capture(name):
        remaining = deadline - time.monotonic()
        require(remaining >= 5, 'Capture budget exhausted')
        receipt = observations.capture(adb, apk, package, output / name, failed_command,
                                       seconds=min(40, remaining), expected_apk=APK)
        report['captures'].append(receipt)
        return output / name

    def stage_hash(action, prefix):
        expected = APK['sha256'] + '  ' + action['session']['stageApk']
        require(command(prefix + '-stage-sha256.txt', ['shell', 'sha256sum', action['session']['stageApk']]) == expected,
                'Cannot bind unique staged session to the exact authorized APK')

    def tap(action, name):
        # Only validated current XML-node coordinates, never an unconditional screen coordinate.
        result = command(name + '-tap.txt', ['shell', 'input', 'tap', *map(str, action['tap'])])
        report['actions'].append({**action, 'commandResult': result, 'completedAt': time.time()})

    try:
        original_identity(apk, package, failed_command, adb, expected_apk)
        original = json.loads((Path(original_evidence) / 'report.json').read_text())
        require(original.get('apk') == APK and original.get('targetPackage') == PACKAGE and
                original.get('originalFailedInstallCommand') == failed_command and
                original.get('uiActionsSent') is False, 'Original timeout observations missing or mismatched')
        before = dialog_action(capture('before-details'), 'More details', failed_command)
        stage_hash(before, 'before')
        tap(before, 'more-details')
        expanded = dialog_action(capture('expanded-details'), 'Install anyway', failed_command)
        require(expanded['session'] == before['session'], 'Installation session changed while expanding details')
        stage_hash(expanded, 'expanded')
        tap(expanded, 'install-anyway')
        # Preserve the immediate post-click UI even when installation never completes.
        capture('after-confirmation')
        for attempt in range(20):
            require(time.monotonic() < deadline, 'Installed APK verification budget exhausted')
            value = command(f'installed-path-{attempt}.txt', ['shell', 'pm', 'path', PACKAGE])
            if value:
                require(re.fullmatch(r'package:/data/app/[A-Za-z0-9_./=+\-]+/base\.apk', value) is not None and
                        '..' not in value.split('/'), 'Unexpected installed package path or split APK')
                installed = value.removeprefix('package:')
                require(command('installed-sha256.txt', ['shell', 'sha256sum', installed]) == APK['sha256'] + '  ' + installed,
                        'Installed APK SHA differs from the authorized original')
                require(command('installed-size.txt', ['shell', 'stat', '-c', '%s', installed]) == str(APK['bytes']),
                        'Installed APK size differs from the authorized original')
                report.update(status='installed-exact-apk', installedPath=installed, installedIdentity=dict(APK))
                break
            time.sleep(min(.5, max(0, deadline - time.monotonic())))
        require(report['status'] == 'installed-exact-apk', 'No exact installed APK was observed')
    except Exception as error:
        report.update(status='blocked', errorType=type(error).__name__, error=str(error))
    finally:
        for source in (Path(__file__), HERE / 'install_failure.py'):
            target = output / ('executed-' + source.name)
            target.write_bytes(source.read_bytes())
        report['executedSources'] = {p.name: observations.info(p) for p in output.glob('executed-*.py')}
        report['elapsedSeconds'] = time.monotonic() - started
        report['uiActionsSent'] = bool(report['actions'])
        (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    return {'path': output.name + '/report.json', **observations.info(output / 'report.json'),
            'status': report['status'], 'uiActionsSent': report['uiActionsSent'],
            'settingsChanged': False, 'originalFailurePreserved': True}
