#!/usr/bin/env python3
"""Actual Android WebView + unchanged pureTV SDK acceptance, using read-only observation.

All control comes through TCP from puretv-joystick/joystick_sdk.py. The observer
only reads cached production diagnostics and DOM; it cannot set model state.
"""
import argparse
import hashlib
import json
import math
import shutil
import socket
import subprocess
import sys
import threading
import time
import traceback
from pathlib import Path
from urllib.request import urlopen

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / 'puretv-joystick'))
from joystick_sdk import JoystickClient, KEYS

PACKAGES = {'cf-transport-ship': 'com.ecojust.joystickcf', 'qq-speed': 'com.ecojust.joystickqqspeed'}


def file_info(path):
    return {'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


class WireProxy:
    """Byte-transparent TCP relay. Records original SDK messages and actual host ACKs."""
    def __init__(self, target, output):
        self.target = target
        self.records = []
        self.errors = []
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
        sent = [r for r in records if r['direction'] == 'sdk-to-game']
        replies = [r for r in records if r['direction'] == 'game-to-sdk']
        acknowledgements = {(r['connection'], r['message'].get('seq')) for r in replies if r['message'].get('type') == 'ack'}
        missing = [{'connection': r['connection'], 'seq': r['message']['seq']} for r in sent if (r['connection'], r['message']['seq']) not in acknowledgements]
        return {'sdkMessages': len(sent), 'hostReplies': len(replies), 'matchingAcks': len(sent) - len(missing), 'missingAcks': missing,
                'keysSent': sorted({r['message']['key'] for r in sent if r['message'].get('type') == 'button'}), 'errors': list(self.errors)}

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
        for source in [Path(__file__), HERE / 'build-observer.py', HERE / 'src/com/ecojust/controllerqa/Observer.java', ROOT / 'puretv-joystick/joystick_sdk.py']:
            relative = source.relative_to(ROOT)
            self.report['sourceFiles'][str(relative)] = file_info(source)
            dest = provenance / relative; dest.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(source, dest)

    def command(self, *args, check=True):
        result = subprocess.run(self.adb + list(args), capture_output=True, check=False, timeout=45)
        with (self.out / 'adb-commands.jsonl').open('a') as f:
            f.write(json.dumps({'command': self.adb + list(args), 'exitCode': result.returncode, 'stdout': result.stdout.decode(errors='replace'), 'stderr': result.stderr.decode(errors='replace')}) + '\n')
        if check and result.returncode:
            raise RuntimeError('ADB command failed: ' + ' '.join(args) + ': ' + result.stderr.decode(errors='replace'))
        return result.stdout

    def snapshot(self):
        with urlopen('http://127.0.0.1:' + str(self.observer_port) + '/snapshot', timeout=15) as response:
            value = json.load(response)
        port = (value.get('info') or {}).get('wifiController', {}).get('port')
        if hasattr(self, 'service_port') and port and port != self.service_port:
            raise AssertionError('Live game changed controller TCP port within the same process/session')
        return value

    def wait(self, predicate, timeout=20, label='condition'):
        until = time.monotonic() + timeout; last = None; error = None
        while time.monotonic() < until:
            try:
                last = self.snapshot()
                if predicate(last): return last
            except Exception as caught:
                error = repr(caught)
            time.sleep(0.12)
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
    def visible_ids(snapshot):
        return [r['controllerId'] for c in snapshot.get('page', {}).get('controllerClients', {}).get('containers', []) if c['visible']
                for r in c['rows'] if r['visible'] and r['iconVisible'] and r['idText'] == r['controllerId']]

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

    def setup(self):
        self.command('wait-for-device')
        self.command('install', '-r', str(self.args.apk))
        self.command('install', '-r', '-t', str(self.args.observer))
        self.command('shell', 'am', 'force-stop', self.package)
        self.observer_port = int(self.command('forward', 'tcp:0', 'tcp:63486').strip())
        self.instrument_log = (self.out / 'instrumentation.log').open('wb')
        component = 'com.ecojust.joystickqa.' + self.args.game.replace('-', '') + '/com.ecojust.controllerqa.Observer'
        self.instrument = subprocess.Popen(self.adb + ['shell', 'am', 'instrument', '-w', '-r', '-e', 'diagnosticPort', '63486',
                                                        '-e', 'occupyDefaultPort', str(self.args.occupy_default_port).lower(), component], stdout=self.instrument_log, stderr=subprocess.STDOUT)
        initial = self.wait(lambda s: self.game(s).get('stage') == 'menu' and self.game(s).get('loading') is not True
                            and self.game(s).get('controller', {}).get('pollCount', 0) > 0
                            and (s.get('info') or {}).get('wifiController', {}).get('port', 0) > 0, timeout=150, label='initial-menu')
        service = initial['info']['wifiController']
        self.service_port = service['port']
        assert service['serviceType'] == '_puretv._tcp' and service['version'] == '1', service
        assert (self.service_port != 63485) if self.args.occupy_default_port else (self.service_port == 63485), service
        assert self.game(initial)['webglVersion'].startswith('WebGL 2'), self.game(initial)['webglVersion']
        self.forwarded_port = int(self.command('forward', 'tcp:0', 'tcp:' + str(self.service_port)).strip())
        self.report['adbForwards'] = {'observer': self.observer_port, 'controller': self.forwarded_port}
        self.report['controllerService'] = service
        self.report['targetPid'] = self.command('shell', 'pidof', self.package).decode().strip()
        assert self.report['targetPid'], 'Target process is not running'
        self.record('initial-menu', initial)
        assert self.visible_ids(initial) == []
        self.passed('installed target launches WebGL menu with no controller card')
        self.recording_log = (self.out / 'screenrecord.log').open('wb')
        self.recorder = subprocess.Popen(self.adb + ['shell', 'screenrecord', '--time-limit', '180', '--bit-rate', '4000000', self.remote_video], stdout=self.recording_log, stderr=subprocess.STDOUT)
        self.proxy = WireProxy(('127.0.0.1', self.forwarded_port), self.out / 'wire.jsonl')
        client = JoystickClient('127.0.0.1', self.proxy.port); self.clients.append(client); client.connect()
        threading.Thread(target=self.heartbeat, daemon=True).start()
        self.wait(lambda s: self.visible_ids(s) == [client.identity], label='single-controller')
        self.capture('connected', [client.identity])
        self.passed('original SDK hello and nine sync messages create actual controller ID card', {'identity': client.identity})

    def scenarios(self):
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
        second = JoystickClient('127.0.0.1', self.proxy.port); self.clients.append(second); second.connect()
        identities = [c.identity for c in self.clients]
        self.wait(lambda s: sorted(self.visible_ids(s)) == sorted(identities), label='two-identities')
        dual = self.record('two-identities')
        rows = [row for container in dual['page']['controllerClients']['containers'] if container['visible'] for row in container['rows'] if row['visible']]
        assert sorted((row['playerId'], row['controllerId']) for row in rows) == [(1, identities[0]), (2, identities[1])], rows
        self.capture('two-controllers', identities); self.passed('two controllers have independent visible identities')
        second.disconnect()
        self.wait(lambda s: self.visible_ids(s) == [self.clients[0].identity], label='second-disconnect')
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
        assert wire['sdkMessages'] > 30 and not wire['missingAcks'] and not wire['errors'], wire
        assert wire['keysSent'] == sorted(KEYS)
        self.report['wire'] = wire; self.passed('every SDK message has an actual matching host ACK', wire)
        assert self.snapshot()['info']['wifiController']['port'] == self.service_port
        assert self.command('shell', 'pidof', self.package).decode().strip() == self.report['targetPid'], 'Game process restarted during the purported same-session check'
        self.passed('controller service keeps the same port throughout live session and reconnection', self.service_port)

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
    p.add_argument('--occupy-default-port', action='store_true', help='Bind 63485 in the instrumentation launch fixture before starting the unchanged game')
    a = p.parse_args()
    acceptance = Acceptance(a)
    try:
        acceptance.setup(); acceptance.scenarios(); acceptance.report['status'] = 'passed'
    except Exception:
        acceptance.report['status'] = 'failed'; acceptance.report['error'] = traceback.format_exc()
        acceptance.save(); raise
    finally:
        acceptance.cleanup()
    if acceptance.report['status'] != 'passed':
        raise SystemExit('Android acceptance failed; original report and logs retained')


if __name__ == '__main__': main()
