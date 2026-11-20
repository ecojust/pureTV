#!/usr/bin/env python3
"""Bounded installation-failure observations. No taps, installation retries or settings writes."""
import hashlib
import json
import os
from pathlib import Path
import re
import selectors
import signal
import struct
import subprocess
import time
import xml.etree.ElementTree as ET
import zlib

MAX_SECONDS = 60


def info(path):
    data = path.read_bytes()
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def complete_png(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        return False
    offset, first, image_data = 8, True, False
    while offset + 12 <= len(data):
        size = struct.unpack('>I', data[offset:offset + 4])[0]
        end = offset + 12 + size
        if end > len(data):
            return False
        kind = data[offset + 4:offset + 8]
        if first and (kind != b'IHDR' or size != 13):
            return False
        if zlib.crc32(data[offset + 4:end - 4]) & 0xffffffff != struct.unpack('>I', data[end - 4:end])[0]:
            return False
        if kind == b'IDAT':
            image_data = True
        if kind == b'IEND':
            return size == 0 and end == len(data) and not first and image_data
        first, offset = False, end
    return False


def bounded_command(argv, target, deadline, limit):
    """Drain one owned process with fixed output/time budgets; keep original partial bytes."""
    record = {'command': list(argv), 'startedAt': time.time(), 'outputPath': target.name,
              'maximumStdoutBytes': limit, 'maximumStderrBytes': 8192}
    if time.monotonic() >= deadline:
        return dict(record, status='not-started-budget-exhausted', exitCode=None)
    child = None
    selector = selectors.DefaultSelector()
    stderr = bytearray()
    written = 0
    status = 'completed'
    try:
        child = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
        selector.register(child.stdout, selectors.EVENT_READ, 'stdout')
        selector.register(child.stderr, selectors.EVENT_READ, 'stderr')
        with target.open('xb') as output:
            while selector.get_map():
                if time.monotonic() >= deadline:
                    status = 'timed-out'
                    break
                for key, _ in selector.select(min(.05, max(0, deadline - time.monotonic()))):
                    data = os.read(key.fileobj.fileno(), 65536)
                    if not data:
                        selector.unregister(key.fileobj)
                        continue
                    if key.data == 'stdout':
                        kept = data[:max(0, limit - written)]
                        output.write(kept)
                        written += len(kept)
                        if len(kept) != len(data):
                            status = 'output-budget-exceeded'
                            break
                    else:
                        remaining = max(0, 8192 - len(stderr))
                        stderr.extend(data[:remaining])
                        if len(data) > remaining:
                            status = 'output-budget-exceeded'
                            break
                if status != 'completed':
                    break
        if child.poll() is None and status != 'completed':
            os.killpg(child.pid, signal.SIGKILL)
        try:
            code = child.wait(timeout=max(.01, min(1, deadline - time.monotonic())))
        except subprocess.TimeoutExpired:
            status = 'timed-out'
            os.killpg(child.pid, signal.SIGKILL)
            code = child.wait(timeout=1)
        record.update(status=status if status != 'completed' or code == 0 else 'command-failed', exitCode=code)
    except Exception as error:
        record.update(status='unavailable', errorType=type(error).__name__, exitCode=child.poll() if child else None)
    finally:
        if child is not None:
            if child.poll() is None:
                os.killpg(child.pid, signal.SIGKILL)
                child.wait(timeout=1)
            child.stdout.close()
            child.stderr.close()
        selector.close()
    record.update(endedAt=time.time(), stderr=stderr.decode('utf-8', errors='replace'))
    if target.is_file():
        record['output'] = info(target)
    return record


def capture(adb, apk, package, output, failed_command, *, seconds=MAX_SECONDS, expected_apk=None):
    assert 0 < seconds <= MAX_SECONDS and re.fullmatch(r'[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+', package)
    started = time.monotonic()
    # Reserve two seconds for process reaping and the final evidence receipt.
    deadline = started + max(0, seconds - 2)
    output = Path(output)
    output.mkdir(parents=True, exist_ok=False)
    apk = Path(apk)
    assert failed_command['command'] == list(adb) + ['install', '-r', str(apk)]
    digest = hashlib.sha256()
    with apk.open('rb') as source:
        while block := source.read(512 * 1024):
            digest.update(block)
            if time.monotonic() >= deadline:
                raise TimeoutError('APK identity observation exceeded diagnostic budget')
    apk_identity = {'bytes': apk.stat().st_size, 'sha256': digest.hexdigest()}
    if expected_apk is not None:
        assert apk_identity == {key: expected_apk[key] for key in ('bytes', 'sha256')}, 'Original APK identity changed'
    report = {'schemaVersion': 1, 'targetPackage': package, 'apk': apk_identity,
              'originalFailedInstallCommand': failed_command,
              'scope': 'Post-timeout installation UI observations; not a successful installation or game test',
              'maximumWallSeconds': seconds, 'uiActionsSent': False, 'settingsChanged': False,
              'installRetried': False, 'originalFailurePreserved': True, 'commands': []}
    remote_xml = '/sdcard/puretv-install-diagnostic-' + str(time.monotonic_ns()) + '.xml'
    report['temporaryUiDumpPath'] = remote_xml
    commands = [
        ('foreground.txt', ['shell', 'dumpsys', 'activity', 'activities'], 1024 * 1024, 8),
        ('windows.txt', ['shell', 'dumpsys', 'window', 'windows'], 1024 * 1024, 8),
        ('installer-sessions.txt', ['shell', 'dumpsys', 'package', 'installs'], 2 * 1024 * 1024, 8),
        ('screen.png', ['exec-out', 'screencap', '-p'], 12 * 1024 * 1024, 12),
        ('ui-dump-command.txt', ['shell', 'uiautomator', 'dump', remote_xml], 65536, 12),
        ('ui.xml', ['exec-out', 'cat', remote_xml], 1024 * 1024, 8),
    ]
    dumped = False
    for name, args, limit, per_command in commands:
        if name == 'ui.xml' and not dumped:
            report['commands'].append({'outputPath': name, 'status': 'not-read-without-successful-fresh-dump'})
            continue
        result = bounded_command(list(adb) + args, output / name, min(deadline, time.monotonic() + per_command), limit)
        if name == 'ui-dump-command.txt':
            dumped = result.get('status') == 'completed' and result.get('exitCode') == 0
        if name == 'screen.png' and (output / name).is_file():
            result['completePng'] = complete_png((output / name).read_bytes())
        if name == 'ui.xml' and (output / name).is_file():
            try:
                value = ET.fromstring((output / name).read_bytes())
                result['validHierarchyXml'] = value.tag == 'hierarchy'
            except (ET.ParseError, ValueError):
                result['validHierarchyXml'] = False
        report['commands'].append(result)
    report['elapsedSeconds'] = time.monotonic() - started
    source_path = Path(__file__)
    (output / 'executed-install_failure.py').write_bytes(source_path.read_bytes())
    report['executedSource'] = info(output / 'executed-install_failure.py')
    (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    return {'path': output.name + '/report.json', **info(output / 'report.json'),
            'elapsedSeconds': report['elapsedSeconds'], 'originalFailurePreserved': True,
            'uiActionsSent': False, 'settingsChanged': False}
