#!/usr/bin/env python3
"""Actual Android WebView + unchanged pureTV SDK acceptance, using read-only observation.

All control comes through TCP from puretv-joystick/joystick_sdk.py. The observer
only reads cached production diagnostics and DOM; it cannot set model state.
"""
import argparse
import importlib.util
from http.client import RemoteDisconnected
from collections import Counter
import hashlib
import json
import math
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
import traceback
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / 'puretv-joystick'))
from joystick_sdk import JoystickClient, KEYS

spec = importlib.util.spec_from_file_location('joystick_android_build', ROOT / 'joystick-games/tools/android-build.py')
build = importlib.util.module_from_spec(spec); spec.loader.exec_module(build)
PACKAGES = build.registered_packages()
spec = importlib.util.spec_from_file_location('joystick_qa_plan', ROOT / 'joystick-games/tools/qa-plan.py')
plan = importlib.util.module_from_spec(spec); spec.loader.exec_module(plan)
spec = importlib.util.spec_from_file_location('joystick_install_failure', HERE / 'install_failure.py')
install_failure = importlib.util.module_from_spec(spec); spec.loader.exec_module(install_failure)
spec = importlib.util.spec_from_file_location('joystick_install_confirmation', HERE / 'install_confirmation.py')
install_confirmation = importlib.util.module_from_spec(spec); spec.loader.exec_module(install_confirmation)


def file_info(path):
    return {'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def backroad_scene_colors(path):
    """Count sampled colors in two world regions outside the racing HUD and controller card."""
    width, height = 160, 90
    image = subprocess.check_output(
        ['ffmpeg', '-nostdin', '-v', 'error', '-i', str(path), '-frames:v', '1',
         '-vf', f'scale={width}:{height}:flags=neighbor', '-pix_fmt', 'rgb24',
         '-f', 'rawvideo', '-threads', '1', 'pipe:1'], timeout=20)
    if len(image) != width * height * 3:
        raise ValueError('Incomplete gameplay screenshot')
    colors = set()
    # In 16:9 gameplay the stage card/countdown sits in the middle, the HUD around the edges.
    # Sample both the upper-left scenery and the lower driving area. The empty canvas and
    # black GPU output are uniformly colored even while the timer and controller ID change.
    for top, bottom in ((22, 32), (59, 72)):
        for y in range(top, bottom):
            row = image[(y * width + 20) * 3:(y * width + 115) * 3]
            colors.update(zip(row[0::3], row[1::3], row[2::3]))
    return len(colors)


OBSERVER_REQUEST_TIMEOUT = 15
OBSERVER_SNAPSHOT_TIMEOUT = 45
OBSERVER_SNAPSHOT_ATTEMPTS = 3
NIGHT_LOW_RELOAD_APK = '66e2589ece8a13bc03d9796259b2662aef34c56c166265db0a63d3baa2b72c91'
NIGHT_LOW_RELOAD_SOURCES = {
    'joystick-games/night-racer/src/src/main.js': 'ad1edb9d785799db5cd357d614005d2e044b79bed7c7635e019e693e65b49004',
    'joystick-games/night-racer/src/src/tv-adapter.js': 'e6feee4583e79cebcabf86a038699ca7062cd960d7a732386c5817ed28164d23',
}


def install_timeout(apk_bytes):
    """Bound installation transfer/verification time; never change game clocks."""
    assert type(apk_bytes) is int and 0 < apk_bytes < build.asset_policy.HARD_LIMITS['maxApkBytes'], 'APK exceeds existing hard size limit'
    # 30 seconds of installer overhead plus two seconds per decimal MB; the
    # original small-package floor remains 45 seconds and all installs cap at 4m.
    return min(240, max(45, 30 + 2 * math.ceil(apk_bytes / 1_000_000)))


def read_observer_snapshot(url, timeout=OBSERVER_SNAPSHOT_TIMEOUT, event=None):
    """Retry only failed read-only transports; never reuse a previous snapshot.

    The original Observer closes its HTTP request after a 10-second WebView
    callback timeout, but keeps accepting requests. A successful response must
    therefore come from a new GET; HTTP/JSON/model errors are not retried here.
    """
    assert 0 < timeout <= OBSERVER_SNAPSHOT_TIMEOUT
    deadline = time.monotonic() + timeout
    failures = 0
    transport_errors = (RemoteDisconnected, ConnectionResetError, ConnectionAbortedError,
                        ConnectionRefusedError, TimeoutError)
    caught_errors = transport_errors + (URLError,)
    for attempt in range(1, OBSERVER_SNAPSHOT_ATTEMPTS + 1):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError('Read-only observer snapshot wall deadline expired')
        started = time.time()
        request_timeout = min(OBSERVER_REQUEST_TIMEOUT, remaining)
        try:
            with urlopen(url, timeout=request_timeout) as response:
                value = json.load(response)
            if time.monotonic() > deadline:
                raise TimeoutError('Read-only observer snapshot wall deadline expired')
        except caught_errors as error:
            # HTTPError is also a URLError: a valid HTTP error is not a dropped
            # connection. Unknown URL errors and malformed JSON remain fatal.
            if isinstance(error, HTTPError) or (isinstance(error, URLError) and not isinstance(error.reason, transport_errors)):
                raise
            failures += 1
            remaining = deadline - time.monotonic()
            retry = attempt < OBSERVER_SNAPSHOT_ATTEMPTS and remaining > 0
            if event:
                event({'status': 'transport-failed', 'attempt': attempt,
                       'maximumAttempts': OBSERVER_SNAPSHOT_ATTEMPTS,
                       'maximumWallSeconds': timeout, 'requestTimeoutSeconds': request_timeout,
                       'startedAt': started, 'endedAt': time.time(),
                       'errorType': type(error).__name__, 'error': str(error), 'retryScheduled': retry})
            if not retry:
                raise
            time.sleep(min(0.12, remaining / 2))
            continue
        if event and failures:
            event({'status': 'transport-recovered', 'attempt': attempt,
                   'priorTransportFailures': failures, 'startedAt': started,
                   'endedAt': time.time(), 'responseFromNewGet': True})
        return value
    raise AssertionError('Unreachable observer retry state')


class WireProxy:
    """Byte-transparent TCP relay. Records original SDK messages and actual host ACKs."""
    def __init__(self, target, output):
        self.target = target
        self.records = []
        self.errors = []
        self.expected_busy_ids = set()
        self.lock = threading.Lock()
        self.closed = threading.Event()
        self.workers = []
        self.log = output.open('w')
        self.server = socket.socket()
        self.server.bind(('127.0.0.1', 0))
        self.server.listen(4)
        self.server.settimeout(0.3)
        self.port = self.server.getsockname()[1]
        self.connections = []
        self.session = 0
        self.acceptor = threading.Thread(target=self.accept, daemon=True); self.acceptor.start()

    def accept(self):
        while not self.closed.is_set():
            try:
                downstream, _ = self.server.accept()
            except socket.timeout:
                continue
            except OSError:
                break
            try:
                upstream = socket.create_connection(self.target, timeout=5)
                upstream.settimeout(None); downstream.settimeout(None)
                self.session += 1
                self.connections.extend([upstream, downstream])
                for source, dest, direction in [(downstream, upstream, 'sdk-to-game'), (upstream, downstream, 'game-to-sdk')]:
                    worker = threading.Thread(target=self.pipe, args=(source, dest, direction, self.session), daemon=True)
                    self.workers.append(worker); worker.start()
            except Exception as error:
                self.errors.append(repr(error)); downstream.close()

    def pipe(self, source, dest, direction, session):
        pending = b''
        try:
            while not self.closed.is_set():
                data = source.recv(65536)
                if not data:
                    break
                dest.sendall(data)
                pending += data
                while b'\n' in pending:
                    line, pending = pending.split(b'\n', 1)
                    record = {'wallTime': time.time(), 'monotonic': time.monotonic(), 'direction': direction, 'connection': session, 'line': line.decode('utf-8')}
                    record['message'] = json.loads(record['line'])
                    with self.lock:
                        self.records.append(record)
                        self.log.write(json.dumps(record) + '\n'); self.log.flush()
        except (OSError, ValueError) as error:
            if not self.closed.is_set() and not isinstance(error, OSError):
                self.errors.append(repr(error))
        finally:
            try: dest.shutdown(socket.SHUT_WR)
            except OSError: pass

    def summary(self):
        with self.lock:
            records = list(self.records)
            expected_busy_ids = set(self.expected_busy_ids)
        sent = [r for r in records if r['direction'] == 'sdk-to-game']
        replies = [r for r in records if r['direction'] == 'game-to-sdk']
        rejected = []
        for connection in sorted({r['connection'] for r in sent}):
            outbound = [r['message'] for r in sent if r['connection'] == connection]
            inbound = [r['message'] for r in replies if r['connection'] == connection]
            hello = outbound[0]
            identity = hello.get('controller_id')
            # The unchanged SDK sends hello followed by up to nine held-state
            # sync frames. The single-seat server rejects and closes this whole
            # connection; these are recorded as rejected, never as ACKed.
            expected_syncs = [{'type': 'button', 'seq': i + 2,
                               'controller_id': identity, 'key': key, 'action': 'sync',
                               'pressed': False, 'duration_ms': 0} for i, key in enumerate(KEYS)]
            expected_tail = expected_syncs[:len(outbound)-1]
            expected_tail += [{'type': 'ping', 'seq': i + 1, 'controller_id': identity}
                              for i in range(len(KEYS) + 1, len(outbound))]
            if (identity in expected_busy_ids and type(hello.get('seq')) is int
                    and hello == {'type': 'hello', 'seq': 1, 'controller_id': identity}
                    and outbound[1:] == expected_tail
                    and inbound == [{'type': 'error', 'message': 'controller_busy', 'seq': 1}]
                    and type(inbound[0].get('seq')) is int):
                rejected.append({'connection': connection, 'controllerId': identity, 'helloSeq': 1,
                                 'sdkMessages': len(outbound), 'response': inbound[0]})
        rejected_connections = {r['connection'] for r in rejected}
        accepted = [r for r in sent if r['connection'] not in rejected_connections]
        acknowledgements = Counter((r['connection'], r['message'].get('seq')) for r in replies
                                   if r['message'].get('type') == 'ack' and type(r['message'].get('seq')) is int)
        expected = Counter((r['connection'], r['message']['seq']) for r in accepted)
        missing = [{'connection': r['connection'], 'seq': r['message']['seq']} for r in accepted
                   if acknowledgements[(r['connection'], r['message']['seq'])] != 1]
        unexpected = [r for r in replies if r['connection'] not in rejected_connections
                      and (r['message'].get('type') != 'ack' or type(r['message'].get('seq')) is not int
                           or expected[(r['connection'], r['message'].get('seq'))] != 1)]
        duplicate_acks = [{'connection': conn, 'seq': seq, 'count': count}
                          for (conn, seq), count in acknowledgements.items() if count != 1]
        return {'sdkMessages': len(sent), 'acceptedSdkMessages': len(accepted), 'rejectedSdkMessages': len(sent)-len(accepted),
                'hostReplies': len(replies), 'matchingAcks': len(accepted) - len(missing), 'missingAcks': missing,
                'expectedBusyIds': sorted(expected_busy_ids), 'rejectedConnections': rejected,
                'unexpectedReplies': unexpected, 'duplicateAcks': duplicate_acks,
                'keysSent': sorted({r['message']['key'] for r in accepted if r['message'].get('type') == 'button'}), 'errors': list(self.errors)}

    def expect_busy(self, identity):
        with self.lock:
            self.expected_busy_ids.add(identity)

    def close(self):
        self.closed.set(); self.server.close()
        for connection in self.connections:
            try: connection.shutdown(socket.SHUT_RDWR)
            except OSError: pass
            connection.close()
        self.acceptor.join(1)
        for worker in self.workers: worker.join(1)
        self.log.close()


class Acceptance:
    def __init__(self, args):
        self.args = args
        self.out = args.output.resolve()
        self.out.mkdir(parents=True, exist_ok=True)
        assert not list(self.out.iterdir()), 'Use a new output directory; never overwrite a previous result'
        self.adb = [args.adb] + (['-s', args.serial] if args.serial else [])
        self.package = PACKAGES[args.game]
        self.plan_path = ROOT / 'joystick-games' / args.game / 'qa-plan.json'
        self.plan = plan.load_plan(self.plan_path) if args.game not in build.LEGACY_PACKAGES else None
        self.tests = []; self.snapshots = []; self.captures = []; self.clients = []
        self.stop = threading.Event(); self.proxy = None; self.instrument = None; self.recorder = None
        self.observer_port = None; self.forwarded_port = None
        self.remote_video = '/sdcard/joystick-qa-' + args.game + '.mp4'
        self.report = {'game': args.game, 'targetPackage': self.package, 'status': 'running',
                       'scope': 'Actual Android installed game controlled through the unchanged Python SDK and observed read-only',
                       'modelWrites': False, 'clockOverrides': False, 'physicalTvTested': False, 'physicalPhoneTested': False,
                       'defaultPortOccupiedFixture': args.occupy_default_port,
                       'physicalEsp32Tested': False, 'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
                       'apk': {'path': str(args.apk), **file_info(args.apk)}, 'observer': {'path': str(args.observer), **file_info(args.observer)},
                       'sourceFiles': {}, 'tests': self.tests, 'snapshots': self.snapshots, 'captures': self.captures}
        provenance = self.out / 'source'; provenance.mkdir()
        source_paths = [Path(__file__), HERE / 'install_failure.py', HERE / 'install_confirmation.py', HERE / 'build-observer.py', HERE / 'src/com/ecojust/controllerqa/Observer.java', ROOT / 'puretv-joystick/joystick_sdk.py', ROOT / 'joystick-games/tools/android-build.py', ROOT / 'joystick-games/tools/qa-plan.py']
        if self.plan: source_paths += [self.plan_path, ROOT / build.REGISTRY]
        for source in source_paths:
            relative = source.relative_to(ROOT)
            self.report['sourceFiles'][str(relative)] = file_info(source)
            dest = provenance / relative; dest.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(source, dest)

    def command(self, *args, check=True):
        timeout = 45
        record = {'command': self.adb + list(args), 'startedAt': time.time()}
        if args and args[0] == 'install':
            record['apkBytes'] = Path(args[-1]).stat().st_size
            timeout = install_timeout(record['apkBytes'])
        record['timeoutSeconds'] = timeout
        def log(value):
            with (self.out / 'adb-commands.jsonl').open('a') as f:
                f.write(json.dumps({**record, 'endedAt': time.time(), **value}) + '\n')
        try:
            result = subprocess.run(record['command'], capture_output=True, check=False, timeout=timeout)
        except subprocess.TimeoutExpired as error:
            log({'status': 'timed-out', 'exitCode': None, 'errorType': type(error).__name__,
                 'error': str(error), 'stdout': (error.stdout or b'').decode(errors='replace'),
                 'stderr': (error.stderr or b'').decode(errors='replace')})
            if args[:2] == ('install', '-r') and str(getattr(getattr(self, 'args', None), 'apk', '')) == args[-1]:
                failed_record = dict(record, status='timed-out', endedAt=time.time())
                try:
                    self.report['installFailureEvidence'] = install_failure.capture(
                        self.adb, self.args.apk, self.package, self.out / 'install-failure',
                        failed_record, expected_apk=self.report.get('apk'))
                    self.save()
                except Exception as diagnostic_error:
                    self.report['installFailureEvidence'] = {'status': 'unavailable', 'errorType': type(diagnostic_error).__name__,
                                                            'originalFailurePreserved': True, 'uiActionsSent': False}
                if (getattr(self.args, 'confirm_backroad_install', False) and self.args.game == 'backroad-rally'
                        and self.report['installFailureEvidence'].get('status') != 'unavailable'):
                    self.report['installConfirmation'] = install_confirmation.confirm(
                        self.adb, self.args.apk, self.package, self.out / 'install-confirmation',
                        failed_record, expected_apk=self.report['apk'], original_evidence=self.out / 'install-failure')
                    self.save()
                    if self.report['installConfirmation']['status'] == 'installed-exact-apk':
                        # The original install command still timed out. Continue only because the
                        # separately recorded per-app flow verified actual installed APK SHA/size.
                        return b''
            raise  # Do not retry installation or treat an uncertain install as successful.
        log({'status': 'completed', 'exitCode': result.returncode,
             'stdout': result.stdout.decode(errors='replace'), 'stderr': result.stderr.decode(errors='replace')})
        if check and result.returncode:
            raise RuntimeError('ADB command failed: ' + ' '.join(args) + ': ' + result.stderr.decode(errors='replace'))
        return result.stdout

    def snapshot(self, timeout=OBSERVER_SNAPSHOT_TIMEOUT):
        self._snapshot_calls = getattr(self, '_snapshot_calls', 0) + 1
        call = self._snapshot_calls
        def event(value):
            self.report.setdefault('observerTransportEvents', []).append(
                {'snapshotCall': call, 'operation': 'GET /snapshot', **value})
            if hasattr(self, 'out'):
                self.save()
        value = read_observer_snapshot('http://127.0.0.1:' + str(self.observer_port) + '/snapshot', timeout, event)
        port = (value.get('info') or {}).get('wifiController', {}).get('port')
        if hasattr(self, 'service_port') and port and port != self.service_port:
            raise AssertionError('Live game changed controller TCP port within the same process/session')
        return value

    def wait(self, predicate, timeout=20, label='condition'):
        until = time.monotonic() + timeout; last = None; error = None
        while time.monotonic() < until:
            try:
                last = self.snapshot(timeout=min(OBSERVER_SNAPSHOT_TIMEOUT, max(0.001, until - time.monotonic())))
                if predicate(last): return last
            except Exception as caught:
                error = repr(caught)
            time.sleep(min(0.12, max(0, until - time.monotonic())))
        self.snapshots.append({'label': 'timeout-' + label, 'snapshot': last, 'error': error})
        raise AssertionError(label + ' timed out; last snapshot retained')

    @classmethod
    def frame_advanced(cls, after, before, frames=1):
        a = cls.game(after).get('controller', {}).get('pollCount')
        b = cls.game(before).get('controller', {}).get('pollCount')
        return type(a) is int and type(b) is int and a >= b + frames

    def wait_fresh(self, before, predicate=lambda s: True, timeout=60, label='fresh-frame', frames=1):
        started = time.time()
        after = self.wait(lambda s: self.frame_advanced(s, before, frames) and predicate(s), timeout=timeout, label=label)
        self.report.setdefault('freshnessChecks', []).append({'label': label, 'startedAt': started, 'endedAt': time.time(),
            'beforePollCount': self.game(before)['controller']['pollCount'], 'afterPollCount': self.game(after)['controller']['pollCount'],
            'minimumFrames': frames, 'maximumWallSeconds': timeout})
        return after

    def record(self, label, snapshot=None):
        snapshot = snapshot or self.snapshot()
        self.snapshots.append({'label': label, 'wallTime': time.time(), 'snapshot': snapshot})
        return snapshot

    def passed(self, label, details=None):
        self.tests.append({'name': label, 'status': 'passed', 'details': details})
        self.save()
        print(json.dumps({'passed': label}), flush=True)

    def save(self):
        (self.out / 'report.json').write_text(json.dumps(self.report, ensure_ascii=False, indent=2) + '\n')

    def heartbeat(self):
        while not self.stop.wait(2):
            for client in list(self.clients):
                with client.lock:
                    if client.sock is not None:
                        try: client.ping()
                        except (OSError, ConnectionError): pass

    def button(self, key, down=True, client=None):
        (client or self.clients[0]).button(key, 'down' if down else 'tap', duration=0 if down else 180)

    def press_observed(self, key, effective=False):
        before = self.snapshot()
        self.button(key)
        return self.wait_fresh(before, lambda s: self.native_buttons(s).get(key) is True
                               and (not effective or self.button_state(s, key)), label='observed-down-' + key)

    def release_observed(self, key):
        before = self.snapshot()
        self.button(key, False)
        return self.wait_fresh(before, lambda s: not self.native_buttons(s).get(key), label='observed-release-' + key)

    def tap(self, key):
        observed = self.press_observed(key)
        self.release_observed(key)
        return observed

    def release(self):
        before = self.snapshot()
        for key in KEYS:
            self.button(key, False)
        return self.wait_fresh(before, lambda s: not any(self.native_buttons(s).get(k) for k in KEYS), label='all-released')

    def wait_sent_ack(self, client, sequence, timeout=10):
        until = time.monotonic() + timeout
        while time.monotonic() < until:
            with self.proxy.lock:
                rows = list(self.proxy.records)
            connections = {r['connection'] for r in rows if r['direction'] == 'sdk-to-game'
                           and r['message'].get('controller_id') == client.identity and r['message'].get('seq') == sequence}
            if any(r['direction'] == 'game-to-sdk' and r['connection'] in connections
                   and r['message'].get('type') == 'ack' and r['message'].get('seq') == sequence for r in rows):
                return
            time.sleep(0.05)
        raise AssertionError('Actual host ACK did not arrive for sequence ' + str(sequence))

    @staticmethod
    def game(snapshot):
        return snapshot.get('game') or {}

    @classmethod
    def button_state(cls, snapshot, key):
        return bool(cls.game(snapshot).get('controller', {}).get('buttons', {}).get(key, False))

    @classmethod
    def paused(cls, snapshot):
        return cls.game(snapshot).get('stage') in ('paused', 'pause') and cls.game(snapshot).get('paused') is True

    def native_buttons(self, snapshot):
        # This is already-cached input consumed by the production frame. START
        # intentionally quarantines its held state when it enters the pause UI.
        players = self.game(snapshot).get('controller', {}).get('players', [])
        return next((p.get('buttons', {}) for p in players if p.get('controllerId') == self.clients[0].identity and p.get('connected')), {})

    @staticmethod
    def full_id_text(row):
        identity = row.get('controllerId')
        return isinstance(identity, str) and bool(identity) and row.get('idText') in (identity, 'ID: ' + identity)

    @staticmethod
    def visible_ids(snapshot):
        return [r['controllerId'] for c in snapshot.get('page', {}).get('controllerClients', {}).get('containers', []) if c['visible']
                for r in c['rows'] if r['visible'] and r['iconVisible'] and Acceptance.full_id_text(r)]

    @classmethod
    def single_seat_session(cls, snapshot, identity):
        players = [p for p in cls.game(snapshot).get('controller', {}).get('players', []) if p.get('connected')]
        rows = [r for c in snapshot.get('page', {}).get('controllerClients', {}).get('containers', []) if c['visible']
                for r in c['rows'] if r['visible']]
        if (len(players) != 1 or players[0].get('id') != 1 or players[0].get('controllerId') != identity
                or not players[0].get('session') or len(rows) != 1 or rows[0].get('playerId') != 1
                or cls.visible_ids(snapshot) != [identity]):
            return None
        return players[0]['session']

    def reject_second_controller(self):
        primary = self.clients[0]
        baseline = self.record('before-second-controller')
        session = self.single_seat_session(baseline, primary.identity)
        assert session, 'Primary player must own the only seat before rejection check'
        second = JoystickClient('127.0.0.1', self.proxy.port)
        self.proxy.expect_busy(second.identity)
        try:
            try:
                second.connect()
            except OSError as error:
                # A genuine server rejection can close during the SDK's sync
                # burst. Only the exact wire rejection below proves success.
                self.report['secondConnectError'] = repr(error)
            until = time.monotonic() + 10
            rejection = None
            while time.monotonic() < until:
                rejection = next((r for r in self.proxy.summary()['rejectedConnections']
                                  if r['controllerId'] == second.identity), None)
                if rejection: break
                time.sleep(0.05)
            assert rejection, 'Second SDK hello did not receive exact controller_busy on its own connection'
        finally:
            second.disconnect()
        stable = self.record('second-controller-rejected', self.wait_fresh(baseline, frames=3, label='single-seat-rejection-fresh-frames'))
        assert self.single_seat_session(stable, primary.identity) == session, 'Rejected controller stole or replaced the primary seat'
        assert self.game(stable)['stage'] == self.game(baseline)['stage'], 'Second connection changed game stage'
        self.tap('START')
        paused = self.wait_fresh(stable, (lambda s: self.game(s).get('stage') == 'playing') if self.paused(baseline) else self.paused, label='primary-toggles-after-rejection')
        self.tap('START')
        controlled = self.record('primary-controls-after-rejection', self.wait_fresh(paused,
            lambda s: self.game(s)['stage'] == self.game(baseline)['stage'], label='primary-resumes-after-rejection'))
        assert self.single_seat_session(controlled, primary.identity) == session
        assert self.command('shell', 'pidof', self.package).decode().strip() == self.report['targetPid']
        self.capture('second-rejected', [primary.identity])
        self.passed('single-seat host rejects second SDK with controller_busy and preserves active primary input', rejection)

    def capture(self, name, expected_ids):
        # A real wait helps compositor settling; never represented as a presentation fence.
        time.sleep(1.5)
        before = self.snapshot()
        assert sorted(self.visible_ids(before)) == sorted(expected_ids), name + ': ID before screenshot'
        started = time.time()
        data = subprocess.check_output(self.adb + ['exec-out', 'screencap', '-p'])
        assert data.startswith(b'\x89PNG\r\n\x1a\n')
        path = self.out / (name + '.png'); path.write_bytes(data)
        after = self.snapshot()
        assert sorted(self.visible_ids(after)) == sorted(expected_ids), name + ': ID after screenshot'
        self.captures.append({'path': path.name, **file_info(path), 'startedAt': started, 'endedAt': time.time(),
                              'before': before, 'after': after, 'manualPixelReviewRequired': True})
        self.save()

    def initial_menu_ready(self, snapshot):
        game = self.game(snapshot)
        poll = game.get('controller', {}).get('pollCount', 0)
        if not (game.get('stage') == 'menu' and game.get('loading') is not True
                and poll > 0 and (snapshot.get('info') or {}).get('wifiController', {}).get('port', 0) > 0):
            return False
        if not self.plan:
            return True
        # An adapter can expose its menu/first input poll before asynchronous
        # renderer initialization. Keep the same deadline and strict validation
        # below; a loading observation is not an initialized catalog menu.
        frames = game.get('frames')
        return (game.get('renderer') in plan.accepted_renderers(self.plan)
                and type(frames) is int and frames > 0 and type(poll) is int)

    def setup(self):
        self.command('wait-for-device')
        self.command('install', '-r', str(self.args.apk))
        self.command('install', '-r', '-t', str(self.args.observer))
        self.command('shell', 'am', 'force-stop', self.package)
        if self.plan:
            # Each catalog scenario replays its plan from first-install state.
            # install -r preserves WebView storage, including viewed-story flags.
            assert self.args.game not in build.LEGACY_PACKAGES
            assert self.package == PACKAGES[self.args.game], 'Refuse to clear an unregistered target'
            setup = {'mode': 'fresh-install-app-data', 'targetPackage': self.package,
                     'method': 'pm clear', 'phase': 'before-target-launch', 'status': 'running'}
            self.report['installationSetup'] = setup
            try:
                output = self.command('shell', 'pm', 'clear', self.package).decode(errors='replace').strip()
                setup['stdout'] = output
                assert output == 'Success', 'Catalog app-data reset did not return Success: ' + output
            except Exception:
                setup['status'] = 'failed'
                self.save()
                raise
            setup['status'] = 'passed'
            self.passed('catalog scenario starts with fresh app data before launch', dict(setup))
        self.observer_port = int(self.command('forward', 'tcp:0', 'tcp:63486').strip())
        self.instrument_log = (self.out / 'instrumentation.log').open('wb')
        component = 'com.ecojust.joystickqa.' + self.args.game.replace('-', '') + '/com.ecojust.controllerqa.Observer'
        self.instrument = subprocess.Popen(self.adb + ['shell', 'am', 'instrument', '-w', '-r', '-e', 'diagnosticPort', '63486',
                                                        '-e', 'occupyDefaultPort', str(self.args.occupy_default_port).lower(), component], stdout=self.instrument_log, stderr=subprocess.STDOUT)
        initial = self.wait(self.initial_menu_ready, timeout=150, label='initial-menu')
        # Keep the actual observation even when the renderer/port assertions below fail.
        self.record('initial-menu', initial)
        self.save()
        service = initial['info']['wifiController']
        self.service_port = service['port']
        assert service['serviceType'] == '_puretv._tcp' and service['version'] == '1', service
        assert (self.service_port != 63485) if self.args.occupy_default_port else (self.service_port == 63485), service
        if self.plan:
            self.validate_catalog_snapshot(initial)
        else:
            assert self.game(initial)['webglVersion'].startswith('WebGL 2'), self.game(initial)['webglVersion']
        self.forwarded_port = int(self.command('forward', 'tcp:0', 'tcp:' + str(self.service_port)).strip())
        self.report['adbForwards'] = {'observer': self.observer_port, 'controller': self.forwarded_port}
        self.report['controllerService'] = service
        self.report['targetPid'] = self.command('shell', 'pidof', self.package).decode().strip()
        assert self.report['targetPid'], 'Target process is not running'
        assert self.visible_ids(initial) == []
        self.passed('installed target launches initialized game menu with no controller card')
        self.recording_log = (self.out / 'screenrecord.log').open('wb')
        self.recorder = subprocess.Popen(self.adb + ['shell', 'screenrecord', '--time-limit', '180', '--bit-rate', '4000000', self.remote_video], stdout=self.recording_log, stderr=subprocess.STDOUT)
        self.proxy = WireProxy(('127.0.0.1', self.forwarded_port), self.out / 'wire.jsonl')
        client = JoystickClient('127.0.0.1', self.proxy.port); self.clients.append(client); client.connect()
        threading.Thread(target=self.heartbeat, daemon=True).start()
        self.wait(lambda s: self.visible_ids(s) == [client.identity], label='single-controller')
        self.capture('connected', [client.identity])
        self.passed('original SDK hello and nine sync messages create actual controller ID card', {'identity': client.identity})

    def scenarios(self):
        if self.plan:
            return self.catalog_scenarios()
        self.tap('START')
        playing = {'playing'} if self.args.game == 'cf-transport-ship' else {'countdown', 'race'}
        self.wait(lambda s: self.game(s).get('stage') in playing, label='START-start')
        self.passed('START starts from menu')
        if self.args.game == 'cf-transport-ship': self.cf_gameplay()
        else: self.qq_gameplay()
        # Independent held/release checks use only the cached production input frame.
        for key in KEYS:
            if self.paused(self.snapshot()):
                self.tap('START')
                self.wait(lambda s: self.game(s).get('stage') in playing, label='resume-before-' + key)
            self.release()
            down = self.press_observed(key)
            buttons = self.native_buttons(down)
            assert [k for k in KEYS if buttons.get(k)] == [key], (key, buttons)
            self.record('key-down-' + key, down)
            up = self.release_observed(key)
            assert not any(self.native_buttons(up).get(k) for k in KEYS)
            self.record('key-up-' + key, up)
            self.passed('independent cached input down/release ' + key)
        if not self.paused(self.snapshot()): self.tap('START')
        self.wait(self.paused, label='START-pause')
        before = self.snapshot()
        after = self.wait_fresh(before, self.paused, frames=3, label='pause-fresh-frames')
        assert self.game(before).get('time') == self.game(after).get('time'), 'simulation advances while paused'
        self.capture('paused', [self.clients[0].identity]); self.passed('START pauses simulation and preserves controller card')
        self.tap('START')
        self.wait(lambda s: self.game(s).get('stage') in playing, label='START-resume'); self.passed('START resumes gameplay')
        self.reject_second_controller()
        self.press_observed('UP', effective=True)
        self.clients[0].disconnect()
        self.wait(lambda s: not self.visible_ids(s) and not any(self.button_state(s, k) for k in KEYS), label='disconnect-cancels')
        self.capture('disconnected', []); self.passed('disconnect clears held movement and removes ID card')
        self.clients[0].connect()
        self.wait(lambda s: self.visible_ids(s) == [self.clients[0].identity], label='reconnect-identity')
        self.capture('reconnected', [self.clients[0].identity]); self.passed('same SDK client reconnects with original ID')
        baseline = self.record('before-held-sync')
        with self.clients[0].lock:
            self.clients[0].send('button', key='START', action='sync', pressed=True, duration_ms=0)
            sync_seq = self.clients[0].seq
        self.wait_sent_ack(self.clients[0], sync_seq)
        acked = self.record('held-sync-acked')
        assert self.game(acked)['stage'] == self.game(baseline)['stage'], 'held sync triggered START action before observation'
        synced = self.record('held-start-sync', self.wait_fresh(acked, frames=3, label='held-start-sync-fresh-frames'))
        assert self.game(synced)['stage'] == self.game(baseline)['stage'], 'held sync triggered START action'
        self.clients[0].button('START', 'sync')
        self.passed('reconnect held START sync cannot trigger start/pause action')
        self.stop.set(); self.clients[0].ping()
        until = time.monotonic() + 10
        while time.monotonic() < until:
            time.sleep(0.15)
            if not self.proxy.summary()['missingAcks']: break
        wire = self.proxy.summary()
        assert wire['acceptedSdkMessages'] > 30 and not wire['missingAcks'] and not wire['errors'], wire
        assert not wire['unexpectedReplies'] and not wire['duplicateAcks'], wire
        assert len(wire['rejectedConnections']) == 1, wire
        assert wire['keysSent'] == sorted(KEYS)
        self.report['wire'] = wire; self.passed('every accepted SDK message has a matching host ACK; second connection has exact busy rejection', wire)
        assert self.snapshot()['info']['wifiController']['port'] == self.service_port
        assert self.command('shell', 'pidof', self.package).decode().strip() == self.report['targetPid'], 'Game process restarted during the purported same-session check'
        self.passed('controller service keeps the same port throughout live session and reconnection', self.service_port)

    def validate_catalog_snapshot(self, snapshot, dom_menu_step=None):
        game = self.game(snapshot)
        assert game.get('game') == self.args.game, 'Snapshot game identity mismatch'
        assert game.get('renderer') in plan.accepted_renderers(self.plan), 'Actual renderer differs from QA plan'
        if game['renderer'] in ('webgl1', 'webgl2'):
            version = game.get('webglVersion')
            expected = 2 if game['renderer'] == 'webgl2' else 1
            # Catalog games report the actual context's numeric API version;
            # legacy adapters use gl.getParameter(gl.VERSION). Both must agree
            # with the selected renderer; bools/floats are not API versions.
            matching = type(version) is int and version == expected
            matching = matching or (isinstance(version, str) and re.match(
                r'^WebGL ' + str(expected) + r'(?:\.0)?(?:\s|\(|$)', version) is not None)
            assert matching, 'No matching initialized WebGL context: ' + repr(version)
        assert game.get('stage') in ('menu', 'playing', 'paused', 'ended')
        assert type(game.get('paused')) is bool and type(game.get('frames')) is int
        assert isinstance(game.get('gameplay'), dict) and game['gameplay'], 'Missing actual gameplay observations'
        assert not game.get('error') and not game.get('errors'), 'Game initialization or runtime error'
        if dom_menu_step is not None:
            assert game['stage'] == 'menu' and not game['paused']
            assert snapshot.get('activityState') == 'resumed' and snapshot.get('windowFocused') is True
            page = snapshot['page']
            assert page.get('hidden') is False and page.get('focused') is True
            assert page.get('width', 0) > 0 and page.get('height', 0) > 0
            # These HTML/SVG menus hide the WebGL canvas using CSS visibility.
            # Its laid-out backing surface remains underneath the focused menu.
            assert any(c.get('width', 0) > 0 and c.get('height', 0) > 0 and
                       c.get('clientWidth') == page['width'] and c.get('clientHeight') == page['height']
                       for c in page.get('canvases', [])), 'Missing retained full-screen game canvas'
            assert plan.matches(dom_menu_step['expect'], game, game), 'Unexpected focused game menu'
        elif self.plan['renderer'] != 'dom':
            assert any(c.get('width', 0) > 0 and c.get('height', 0) > 0 and c.get('visible')
                       for c in snapshot.get('page', {}).get('canvases', [])), 'No visible initialized rendering canvas'
        if game['stage'] in ('playing', 'paused'):
            for path in self.plan['pauseStablePaths']:
                plan.read_path(game, path)

    def catalog_playing(self):
        before = self.snapshot()
        if self.game(before).get('stage') != 'playing':
            self.tap('START')
            before = self.wait(lambda s: self.game(s).get('stage') == 'playing', label='catalog-start-or-resume')
        return before

    def catalog_pause(self):
        if not self.paused(self.snapshot()):
            self.catalog_playing()
            self.tap('START')
        before = self.wait(self.paused, label='catalog-paused')
        time.sleep(0.5)
        after = self.wait_fresh(before, self.paused, frames=3, label='catalog-pause-fresh-frames')
        values = {}
        for path in self.plan['pauseStablePaths']:
            a, b = plan.read_path(self.game(before), path), plan.read_path(self.game(after), path)
            assert a == b, 'Simulation advances while paused: ' + path
            values[path] = {'before': a, 'after': b}
        assert any(plan.numeric(value['before']) for value in values.values()), 'Pause plan must include an actual finite numeric model observation'
        self.record('paused-model-stable', after)
        self.passed('explicit actual model observations remain stable while paused', values)
        return after

    def ack_barrier(self):
        client = self.clients[0]
        with client.lock:
            client.ping()
            sequence = client.seq
        self.wait_sent_ack(client, sequence)

    def menu_player(self, snapshot):
        players = [p for p in self.game(snapshot).get('controller', {}).get('players', []) if p.get('connected') is True]
        return players[0] if len(players) == 1 and players[0].get('controllerId') == self.clients[0].identity else {}

    def menu_released(self, snapshot, before):
        owner, player = self.menu_player(before), self.menu_player(snapshot)
        controller = self.game(snapshot).get('controller', {})
        return bool(owner.get('session') and player.get('session') == owner['session']
                    and player.get('id') == owner.get('id') and player.get('cancelSeq') == owner.get('cancelSeq')
                    and player.get('inputActive') is True and controller.get('cancelled') is False
                    and all(player.get('buttons', {}).get(k) is False and controller.get('buttons', {}).get(k) is False for k in KEYS)
                    and snapshot.get('activityState') == 'resumed' and snapshot.get('windowFocused') is True
                    and snapshot.get('page', {}).get('hidden') is False and snapshot.get('page', {}).get('focused') is True)

    def menu_reload_basis(self, step, before):
        # Original Android observations have no document epoch or native button
        # counters. This exact APK's module-constant gfxId can change only after
        # the normal Low preference handler reloads the document. Do not infer
        # a reload from a decreasing poll counter or an arbitrary changed field.
        game = self.game(before)
        expected = [{'path': 'gameplay.renderPreset', 'op': 'eq', 'value': 'low'},
                    {'path': 'gameplay.menu.root', 'op': 'eq', 'value': 'title'},
                    {'path': 'gameplay.menu.focusId', 'op': 'eq', 'value': 'start'},
                    {'path': 'gameplay.ready', 'op': 'eq', 'value': True}]
        if not (self.args.game == 'night-racer' and game.get('game') == 'night-racer'
                and self.report.get('apk', {}).get('sha256') == NIGHT_LOW_RELOAD_APK
                and self.report.get('apk', {}).get('bytes') == 22465268
                and step.get('keys') == ['A'] and step.get('expect') == expected
                and game.get('gameplay', {}).get('renderPreset') == 'high'
                and game.get('gameplay', {}).get('menu', {}).get('root') == 'volume'
                and game.get('gameplay', {}).get('menu', {}).get('focusIndex') == 1):
            return None
        for name, digest in NIGHT_LOW_RELOAD_SOURCES.items():
            assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest, 'Night reload source proof changed'
        return {'kind': 'exact-apk-module-constant-high-to-low', 'apkSha256': NIGHT_LOW_RELOAD_APK,
                'sourceSha256': dict(NIGHT_LOW_RELOAD_SOURCES), 'documentEpochAvailable': False,
                'postReloadFreshPollsRequired': 2}

    def menu_wire_pair(self, key, down_seq, release_seq):
        identity = self.clients[0].identity
        with self.proxy.lock:
            rows = list(self.proxy.records)
        sent = [r for r in rows if r['direction'] == 'sdk-to-game' and r['message'].get('controller_id') == identity
                and down_seq <= r['message'].get('seq', -1) <= release_seq and r['message'].get('type') == 'button']
        assert len(sent) == 2 and sent[0]['connection'] == sent[1]['connection'], 'Exact menu SDK wire pair missing or duplicated'
        expected = [(down_seq, 'down', True), (release_seq, 'tap', False)]
        assert [(r['message'].get('seq'), r['message'].get('action'), r['message'].get('pressed')) for r in sent] == expected, 'Unexpected menu SDK actions'
        assert all(r['message'].get('key') == key for r in sent), 'Unexpected additional menu key'
        for row in sent:
            acks = [r for r in rows if r['direction'] == 'game-to-sdk' and r['connection'] == row['connection']
                    and r['message'].get('type') == 'ack' and r['message'].get('seq') == row['message']['seq']]
            assert len(acks) == 1, 'Menu SDK action needs exactly one original same-connection ACK'
        return {'controllerId': identity, 'connection': sent[0]['connection'], 'downSequence': down_seq,
                'releaseSequence': release_seq, 'downCounts': {k: int(k == key) for k in KEYS},
                'matchingAcks': 2, 'countScope': 'Original SDK wire; native Android button counters are unavailable',
                'observedWireHeldMs': (sent[1]['monotonic'] - sent[0]['monotonic']) * 1000}

    def catalog_menu_tap(self, step, before):
        assert step.get('menuTap') is True and len(step['keys']) == 1
        assert self.game(before).get('stage') == 'menu', 'menuTap starts only in an actual menu'
        assert not plan.matches(step['expect'], self.game(before), self.game(before)), 'menuTap expectation is already satisfied'
        assert self.menu_released(before, before), 'Menu must start focused with the original SDK owner and all keys released'
        key, client = step['keys'][0], self.clients[0]
        basis = self.menu_reload_basis(step, before)
        record = {'name': step['name'], 'key': key, 'status': 'running', 'requestedTapMs': 16,
                  'declaredHoldMs': step['holdMs'], 'beforePollCount': self.game(before)['controller']['pollCount'],
                  'reloadBasis': basis, 'samples': [], 'sampleCount': 0, 'samplesTruncated': False}
        self.report.setdefault('menuTapObservations', []).append(record)
        started = time.monotonic(); deadline = started + step.get('timeoutSeconds', 15)
        candidate = None; stable = 0; down_sent = False; released = False
        try:
            with client.lock:
                down_at = time.monotonic(); self.button(key); down_seq = client.seq; down_sent = True
            try:
                time.sleep(.016)
            finally:
                with client.lock:
                    self.button(key, False); release_seq = client.seq; released = True
            record.update(sdkCallHeldMs=(time.monotonic() - down_at) * 1000, downSequence=down_seq, releaseSequence=release_seq)
            for sequence in (down_seq, release_seq):
                remaining = deadline - time.monotonic()
                assert remaining > 0, 'Menu tap ACK deadline expired'
                self.wait_sent_ack(client, sequence, timeout=min(10, remaining))
            record['wire'] = self.menu_wire_pair(key, down_seq, release_seq)
            while time.monotonic() < deadline:
                state = self.snapshot(timeout=min(OBSERVER_SNAPSHOT_TIMEOUT, max(.001, deadline - time.monotonic())))
                game = self.game(state); count = game.get('controller', {}).get('pollCount')
                assert not game.get('error') and not game.get('errors'), 'Game error during menu tap'
                release_seen = self.menu_released(state, before)
                expected = bool(game) and plan.matches(step['expect'], game, self.game(before))
                # In the one source-proven reload, the first new Low document
                # snapshot is only a baseline, never itself a successful frame.
                fresh = self.frame_advanced(state, before) or (basis is not None and type(count) is int and count > 0)
                qualified = fresh and release_seen and expected
                record['sampleCount'] += 1
                record['samples'].append({'pollCount': count, 'released': release_seen, 'expectationMatches': expected,
                                          'qualified': qualified, 'elapsedSeconds': time.monotonic() - started})
                if len(record['samples']) > 64:
                    del record['samples'][16]; record['samplesTruncated'] = True
                if qualified:
                    if candidate is None:
                        candidate = state; stable = 0
                    elif self.frame_advanced(state, candidate):
                        candidate = state; stable += 1
                    elif type(count) is int and count < self.game(candidate)['controller']['pollCount']:
                        candidate = None; stable = 0
                else:
                    candidate = None; stable = 0
                if stable >= 2:
                    self.validate_catalog_snapshot(state)
                    record.update(status='passed', stableFreshSamples=stable, afterPollCount=count,
                                  elapsedSeconds=time.monotonic() - started)
                    return state
                time.sleep(min(.08, max(0, deadline - time.monotonic())))
            raise AssertionError(step['name'] + ' released menu tap did not remain stable across two subsequent fresh polls')
        except Exception as error:
            record.update(status='failed', errorType=type(error).__name__, elapsedSeconds=time.monotonic() - started)
            raise
        finally:
            if down_sent and not released:
                try: self.button(key, False)
                except Exception: pass

    def catalog_scenarios(self):
        # The per-game plan owns startup/menu navigation as well as gameplay inputs.
        assert self.game(self.snapshot()).get('stage') == 'menu'
        for step in self.plan['steps']:
            self.release()
            before = self.record('before-plan-' + step['name'])
            if step.get('menuTap') is True:
                after = self.catalog_menu_tap(step, before)
                self.record('after-plan-' + step['name'], after)
                self.passed('actual SDK gameplay: ' + step['name'], {'expect': step['expect'], 'holdMs': step['holdMs'], 'menuTap': True})
                continue
            for key in step['keys']: self.button(key)
            held = self.wait_fresh(before, lambda s: all(self.native_buttons(s).get(k) is True for k in step['keys']),
                                   label='plan-held-' + step['name'])
            time.sleep(step['holdMs'] / 1000)
            # Capture gameplay while input is still held; release-only changes can also satisfy the plan below.
            if step.get('androidHoldUntilExpect'):
                try:
                    observed = self.wait_fresh(
                        held, lambda s: self.native_buttons(s).get('UP') is True
                        and plan.matches(step['expect'], self.game(s), self.game(before)),
                        timeout=step.get('timeoutSeconds', 15), label='plan-held-throttle-' + step['name'])
                finally:
                    self.button('UP', False)
            else:
                observed = self.snapshot()
            self.release()
            after = observed if plan.matches(step['expect'], self.game(observed), self.game(before)) else self.wait_fresh(
                held, lambda s: plan.matches(step['expect'], self.game(s), self.game(before)),
                timeout=step.get('timeoutSeconds', 15), label='plan-gameplay-' + step['name'])
            self.validate_catalog_snapshot(after, step if step.get('androidDomMenu') else None)
            if step.get('androidDomMenu'):
                self.capture('dom-menu-' + str(self.plan['steps'].index(step)), [self.clients[0].identity])
            self.record('after-plan-' + step['name'], after)
            self.passed('actual SDK gameplay: ' + step['name'], {'expect': step['expect'], 'holdMs': step['holdMs']})
        self.capture('playing', [self.clients[0].identity])
        self.catalog_pause()
        self.capture('paused', [self.clients[0].identity])
        # Test independent raw physical keys in the paused screen, avoiding unintended game deaths.
        for key in KEYS:
            self.catalog_pause()
            self.release()
            down = self.press_observed(key)
            buttons = self.native_buttons(down)
            assert [k for k in KEYS if buttons.get(k)] == [key], (key, buttons)
            self.record('key-down-' + key, down)
            up = self.release_observed(key)
            assert not any(self.native_buttons(up).get(k) for k in KEYS)
            self.record('key-up-' + key, up)
            # A/B and directions may legitimately navigate menus. Return through normal START input.
            self.catalog_pause()
            self.passed('independent cached input down/release ' + key)
        self.reject_second_controller()
        self.catalog_playing()
        self.press_observed('UP', effective=True)
        self.ack_barrier()
        # Native foreground transition only; all gameplay inputs still come from the original SDK.
        self.command('shell', 'input', 'keyevent', 'KEYCODE_BACK')
        lost_focus = self.wait(lambda s: self.paused(s) and s.get('windowFocused') is False, label='native-dialog-focus-loss')
        self.record('native-exit-dialog-paused', lost_focus)
        self.command('shell', 'input', 'keyevent', 'KEYCODE_BACK')
        focused = self.wait(lambda s: s.get('activityState') == 'resumed' and s.get('windowFocused') is True and self.paused(s), label='native-dialog-return-remains-paused')
        assert not any(self.button_state(focused, key) for key in KEYS), 'Focus loss left effective input held'
        self.release()
        self.catalog_pause()
        self.capture('focus-restored-paused', [self.clients[0].identity])
        self.passed('native exit dialog and focus return cancel input and never automatically resume gameplay')
        self.catalog_playing()
        self.press_observed('UP', effective=True)
        self.ack_barrier()
        self.clients[0].disconnect()
        lost = self.wait(lambda s: self.paused(s) and not self.visible_ids(s) and not any(self.button_state(s, k) for k in KEYS), label='disconnect-pauses-clears')
        self.record('disconnect-paused', lost)
        self.capture('disconnected', [])
        self.clients[0].connect()
        connected = self.wait(lambda s: self.visible_ids(s) == [self.clients[0].identity] and self.paused(s), label='reconnect-same-id-paused')
        after = self.wait_fresh(connected, self.paused, frames=3, label='reconnect-does-not-resume')
        self.capture('reconnected', [self.clients[0].identity])
        self.passed('disconnect clears keys; reconnect keeps original ID and remains paused')
        client = self.clients[0]
        with client.lock:
            client.send('button', key='START', action='sync', pressed=True, duration_ms=0)
            sequence = client.seq
        self.wait_sent_ack(client, sequence)
        acked = self.record('held-sync-acked')
        assert self.paused(acked), 'Held sync resumed gameplay'
        self.record('held-start-sync', self.wait_fresh(acked, self.paused, frames=3, label='held-sync-no-resume'))
        client.button('START', 'sync')
        self.release()
        self.passed('held START reconnect sync cannot resume gameplay')
        self.stop.set()
        self.ack_barrier()
        wire = self.proxy.summary()
        assert wire['acceptedSdkMessages'] > 30 and not wire['missingAcks'] and not wire['errors'], wire
        assert not wire['unexpectedReplies'] and not wire['duplicateAcks'], wire
        assert len(wire['rejectedConnections']) == 1 and wire['keysSent'] == sorted(KEYS), wire
        self.report['wire'] = wire
        self.passed('every accepted SDK message has exactly one original host ACK; busy rejection separately verified', wire)
        assert self.snapshot()['info']['wifiController']['port'] == self.service_port
        assert self.command('shell', 'pidof', self.package).decode().strip() == self.report['targetPid']
        self.passed('same native process and service port survive focus, disconnect and reconnect', self.service_port)

    def cf_gameplay(self):
        base = self.wait(lambda s: self.game(s)['player']['alive'], timeout=60, label='CF-alive')
        origin = self.game(base)['player']['position']
        observed = self.press_observed('UP', effective=True)
        def moved_position(s):
            p = self.game(s)['player']
            return p['alive'] and math.hypot(p['position']['x'] - origin['x'], p['position']['z'] - origin['z']) > 0.05
        moved = self.wait_fresh(observed, moved_position, label='CF-move-actual-position')
        self.release_observed('UP'); self.record('cf-movement', moved)
        self.passed('CF forward movement changes actual position')
        self.press_observed('B', effective=True)
        yaw_base = self.snapshot()
        yaw = self.game(yaw_base)['player']['yaw']
        observed = self.press_observed('RIGHT', effective=True)
        def turned(s):
            p = self.game(s)['player']; delta = p['yaw'] - yaw
            return p['alive'] and math.atan2(math.sin(delta), math.cos(delta)) < -0.02
        self.record('cf-yaw', self.wait_fresh(observed, turned, label='CF-right-actual-yaw'))
        self.release_observed('RIGHT')
        pitch = self.game(self.snapshot())['player']['pitch']
        observed = self.press_observed('UP', effective=True)
        aimed = self.wait_fresh(observed, lambda s: self.game(s)['player']['alive'] and self.game(s)['player']['pitch'] > pitch + 0.02,
                                label='CF-up-actual-pitch')
        self.release_observed('UP'); self.release_observed('B'); self.record('cf-aim', aimed)
        self.passed('CF B+direction changes actual yaw and pitch')
        shots = self.game(self.snapshot())['player']['shotsFired']
        observed = self.press_observed('A', effective=True)
        fired = self.wait_fresh(observed, lambda s: self.game(s)['player']['shotsFired'] > shots, label='CF-shoot')
        self.release_observed('A'); self.record('cf-fired', fired)
        self.passed('CF A fires actual weapon', {'before': shots, 'after': self.game(fired)['player']['shotsFired']})
        before = self.snapshot()
        self.press_observed('X', effective=True)
        reloading = self.wait_fresh(before, lambda s: self.game(s)['player']['reloading'], label='CF-reload')
        self.release_observed('X'); self.record('cf-reloading', reloading)
        self.passed('CF X starts actual reload')
        self.capture('playing', [self.clients[0].identity])

    def qq_gameplay(self):
        self.wait(lambda s: self.game(s).get('stage') == 'race', timeout=120, label='QQ-countdown')
        observed = self.press_observed('UP', effective=True)
        before = self.wait_fresh(observed, lambda s: self.game(s)['player']['speed'] > 20, timeout=120, label='QQ-accelerate')
        heading = self.game(before)['player']['h']
        delta = lambda a, b: math.atan2(math.sin(a - b), math.cos(a - b))
        observed = self.press_observed('LEFT', effective=True)
        left_frame = self.wait_fresh(observed, lambda s: delta(self.game(s)['player']['h'], heading) > 0.01, label='QQ-left-actual-heading')
        left = self.game(self.record('qq-left', left_frame))['player']['h']
        self.release_observed('LEFT')
        heading_before_right = self.game(self.snapshot())['player']['h']
        observed = self.press_observed('RIGHT', effective=True)
        right_frame = self.wait_fresh(observed, lambda s: delta(self.game(s)['player']['h'], heading_before_right) < -0.01,
                                      label='QQ-right-actual-heading')
        right = self.game(self.record('qq-right', right_frame))['player']['h']
        self.release_observed('RIGHT')
        assert delta(left, heading) > 0.01 and delta(right, heading_before_right) < -0.01
        self.passed('QQ left and right steer in original vehicle coordinates', {'before': heading, 'left': left, 'right': right})
        self.press_observed('A', effective=True)
        observed = self.press_observed('LEFT', effective=True)
        drifting = self.wait_fresh(observed, lambda s: self.game(s)['player']['drift'], label='QQ-drift')
        self.record('qq-drifting', drifting)
        self.passed('QQ A+direction enters actual drift')
        self.release_observed('A'); self.release_observed('LEFT')
        self.tap('X')
        self.record('qq-small-boost-attempt')
        self.release_observed('UP')
        self.capture('playing', [self.clients[0].identity])

    def cleanup(self):
        self.stop.set()
        for client in self.clients: client.disconnect()
        if self.proxy:
            self.report['wire'] = self.proxy.summary(); self.proxy.close()
        if self.recorder:
            pids = self.command('shell', 'pidof', 'screenrecord', check=False).decode().split()
            for pid in pids:
                if pid.isdigit(): self.command('shell', 'kill', '-2', pid, check=False)
            try: self.recorder.wait(timeout=10)
            except subprocess.TimeoutExpired: self.recorder.terminate()
            self.command('pull', self.remote_video, str(self.out / 'controller-gameplay.mp4'), check=False)
            video = self.out / 'controller-gameplay.mp4'
            if video.exists():
                self.report['video'] = {'path': video.name, **file_info(video), 'scope': 'Actual screen recording of SDK-driven acceptance; no model or clock changes'}
            elif self.report['status'] == 'passed':
                self.report['status'] = 'failed'; self.report['error'] = 'Required actual screen recording was not produced'
            self.recording_log.close()
        self.command('logcat', '-d', '-v', 'threadtime', check=False)
        self.command('shell', 'dumpsys', 'package', self.package, check=False)
        if self.instrument:
            self.command('shell', 'am', 'force-stop', self.package, check=False)
            try: self.instrument.wait(timeout=10)
            except subprocess.TimeoutExpired: self.instrument.terminate()
            self.instrument_log.close()
        for port in [self.observer_port, self.forwarded_port]:
            if port: self.command('forward', '--remove', 'tcp:' + str(port), check=False)
        self.report['finishedAt'] = time.time(); self.save()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--game', choices=PACKAGES, required=True)
    for name in ['apk', 'observer', 'output']: p.add_argument('--' + name, required=True, type=Path)
    p.add_argument('--adb', default='adb'); p.add_argument('--serial')
    p.add_argument('--confirm-backroad-install', action='store_true',
                   help='Opt in to bounded per-app confirmation for the one frozen Backroad APK only')
    p.add_argument('--occupy-default-port', action='store_true', help='Bind 63485 in the instrumentation launch fixture before starting the unchanged game')
    a = p.parse_args()
    assert not a.confirm_backroad_install or a.game == 'backroad-rally', 'Per-app confirmation is Backroad-only'
    acceptance = Acceptance(a)
    try:
        acceptance.setup()
        acceptance.scenarios()
        if a.game == 'backroad-rally':
            colors = backroad_scene_colors(acceptance.out / 'playing.png')
            acceptance.report['playingSceneColors'] = colors
            if colors <= 1:
                raise AssertionError('Backroad gameplay screenshot has a uniform world behind the HUD')
        acceptance.report['status'] = 'passed'
    except Exception:
        acceptance.report['status'] = 'failed'; acceptance.report['error'] = traceback.format_exc()
        acceptance.save(); raise
    finally:
        acceptance.cleanup()
    if acceptance.report['status'] != 'passed':
        raise SystemExit('Android acceptance failed; original report and logs retained')


if __name__ == '__main__': main()
