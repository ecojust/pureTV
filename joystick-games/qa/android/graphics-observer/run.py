#!/usr/bin/env python3
"""One normal-mode graphics diagnosis of the fixed original Backroad APK.

This is not acceptance. Only the unchanged SDK sends input; the separate test
Observer reads cached diagnostics/DOM and records console messages. No game
clock, model, renderer or GL context is changed by this driver.
"""
import argparse
from contextlib import contextmanager
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import threading
import time
from http.client import RemoteDisconnected
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


original = module('graphics_original_sdk_qa', HERE.parent / 'run.py')
signer = module('graphics_separate_signer', ROOT / 'joystick-games/tools/backroad-graphics-observer-sign.py')
KEYS = original.KEYS
TARGET = signer.TARGET
ORIGINAL = signer.ORIGINAL
PLAN_PATH = 'joystick-games/backroad-rally/qa-plan.json'
PLAN_SHA = '8306e5b2ad54cf35eb2602db045711572e35a728478e668fc65a6fb962ad157f'
OLD_OBSERVER = {'bytes': 16783, 'sha256': 'd3fd4701e55a27ca9c5822d79b39635a71b802f7d44aacb722e45116d4f51a5f'}
# Original one-based steps. Skip career/save, all driving, pause, lifecycle,
# occupied-port and reconnection acceptance; retain every selected predicate.
SUBSET = tuple(range(1, 21)) + tuple(range(24, 34))
ENTRY = 'https://game-kit.invalid/tv.html'
STAGE_URL = ENTRY + '?mode=quick&stage=finland&car=swift&cond=stage&weather=stage'


def require(value, message):
    if not value:
        raise AssertionError(message)


@contextmanager
def observation_deadline(deadline):
    """Interrupt one main-thread read/parse, including a slowly dripping body.

    This diagnostic runs on Linux CI. Refuse an existing process timer rather
    than taking ownership of another caller's alarm. No worker can continue a
    timed-out GET or publish a late observation after this context returns.
    """
    require(threading.current_thread() is threading.main_thread(), 'Observer deadline requires the main thread')
    require(signal.getitimer(signal.ITIMER_REAL) == (0.0, 0.0), 'Observer deadline refuses an existing alarm')
    previous = signal.getsignal(signal.SIGALRM)

    def expired(_signum, _frame):
        raise TimeoutError('Read-only menu observation deadline expired')

    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise TimeoutError('Read-only menu observation deadline expired')
    signal.signal(signal.SIGALRM, expired)
    try:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError('Read-only menu observation deadline expired')
        signal.setitimer(signal.ITIMER_REAL, remaining)
        yield
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, previous)


def record(path):
    require(path.is_file() and not path.is_symlink(), 'Expected a regular input file')
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return {'bytes': path.stat().st_size, 'sha256': digest.hexdigest()}


def write(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')


def original_plan():
    data = subprocess.check_output(['git', 'show', ORIGINAL['sourceSha'] + ':' + PLAN_PATH], cwd=ROOT)
    require(hashlib.sha256(data).hexdigest() == PLAN_SHA, 'Frozen original plan changed')
    value = original.plan.validate_plan(json.loads(data))
    require(len(value['steps']) == 39 and all(value['steps'][i - 1].get('menuTap') is True for i in SUBSET), 'Original menu subset')
    return data, [(i, value['steps'][i - 1]) for i in SUBSET]


def validate_binding(binding, source):
    require(binding.get('status') == 'passed' and binding.get('localPreflightOnly') is False, 'Original input verifier did not pass in CI')
    require(binding.get('qaSourceSha') == source and binding.get('qaRunId') == os.environ.get('GITHUB_RUN_ID'), 'Wrong QA input binding')
    require(binding.get('artifactSourceSha') == ORIGINAL['sourceSha'] and binding.get('artifactRunId') == str(ORIGINAL['runId']), 'Wrong original package source/run')
    origin = binding.get('artifactOrigin', {})
    for key, value in {'kind': 'github-actions-signed-artifact', 'repository': 'ecojust/pureTV',
                       'artifactId': ORIGINAL['artifactId'], 'artifactRunId': str(ORIGINAL['runId']),
                       'artifactRunAttempt': 1, 'artifactSourceSha': ORIGINAL['sourceSha'],
                       'zip': {'bytes': ORIGINAL['artifactBytes'], 'sha256': ORIGINAL['artifactSha256']}}.items():
        require(type(origin.get(key)) is type(value) and origin[key] == value, 'Wrong original artifact ' + key)
    games = binding.get('games')
    require(isinstance(games, list) and len(games) == 1 and games[0].get('game') == 'backroad-rally', 'Only fixed Backroad input accepted')
    game = games[0]
    for key in ('package', 'observer'):
        item = game.get(key, {})
        expected = {k: ORIGINAL[k] for k in ('bytes', 'sha256')} if key == 'package' else OLD_OBSERVER
        require(all(type(item.get(k)) is type(v) and item[k] == v for k, v in expected.items()), 'Wrong original ' + key)
        require(item.get('certificateSha256') == signer.PIN, 'Wrong original certificate')
    require(game['package']['packageName'] == TARGET and game['observer']['packageName'] == 'com.ecojust.joystickqa.backroadrally', 'Original package identities')
    require(game.get('frozenSourceInputsVerified') == 915 and game.get('currentProductionInputsUnchanged') == 887
            and game.get('assetsVerified') == 338, 'Original source/asset verification scope changed')
    return game


def game(state):
    return state.get('cachedGame') or {}


def initialized(state):
    value = game(state)
    frames, poll = value.get('frames'), value.get('pollCount')
    return (state.get('graphicsRead') is True and value.get('game') == 'backroad-rally'
            and value.get('renderer') == 'webgl2' and value.get('webglVersion') == 2
            and type(frames) is int and frames > 0 and type(poll) is int and poll > 0)


def initial_menu_ready(state):
    return (initialized(state) and game(state).get('stage') == 'menu'
            and state.get('url') == ENTRY and (state.get('controllerService') or {}).get('port') == 63485)


def owner(state, identity):
    players = [p for p in (game(state).get('controller') or {}).get('players', []) if p.get('connected') is True]
    return players[0] if len(players) == 1 and players[0].get('controllerId') == identity else {}


def released(state, before, identity):
    a, b = owner(before, identity), owner(state, identity)
    controller = game(state).get('controller') or {}
    return bool(isinstance(a.get('session'), str) and a['session'] and b.get('session') == a['session']
                and type(a.get('id')) is int and type(b.get('id')) is int and b['id'] == a['id'] == 1
                and type(a.get('cancelSeq')) is int and type(b.get('cancelSeq')) is int
                and b.get('cancelSeq') == a.get('cancelSeq') and b.get('inputActive') is True
                and controller.get('cancelled') is False and controller.get('inputAvailable') is True
                and all(b.get('buttons', {}).get(k) is False and controller.get('buttons', {}).get(k) is False for k in KEYS)
                and state.get('activityState') == 'resumed' and state.get('windowFocused') is True
                and state.get('hidden') is False and state.get('focused') is True)


def fresh(state, before):
    a, b = game(state).get('pollCount'), game(before).get('pollCount')
    return state.get('url') == before.get('url') and type(a) is int and type(b) is int and a > b


def menu_qualified(state, before, identity, index, step):
    expected = original.plan.matches(step['expect'], game(state), game(before))
    new_document = (index == 33 and before.get('url') == ENTRY and state.get('url') == STAGE_URL
                    and initialized(state))
    return (fresh(state, before) or new_document) and expected and released(state, before, identity)


def validated(state):
    require(not state.get('error'), 'Observer reported an error')
    require(initialized(state), 'Actual renderer/frame/poll not initialized')
    require(state.get('contextRead') is False and state.get('nativeSnapshotPolled') is False, 'Unexpected diagnostic side effect')
    require(state.get('consoleAttachedBeforeLoad') is True, 'Startup console was not attached before load')
    require(state.get('url') in (ENTRY, STAGE_URL), 'Unexpected target document')
    require(not game(state).get('errors') and type(game(state).get('paused')) is bool, 'Original game reported error/invalid paused state')
    service = state.get('controllerService') or {}
    require(service.get('port') == 63485 and service.get('serviceType') == '_puretv._tcp' and service.get('version') == '1', 'Original SDK service changed')
    require(any(c.get('width', 0) > 0 and c.get('height', 0) > 0 for c in state.get('canvases', [])), 'No initialized canvas dimensions')


class Diagnosis:
    def __init__(self, args):
        self.args = args
        self.out = args.output.resolve()
        require(not self.out.exists() and not self.out.is_relative_to(ROOT), 'Use a new external evidence directory')
        self.out.mkdir(parents=True)
        self.adb = [args.adb]
        self.clients = []
        self.proxy = self.instrument = None
        self.stop = threading.Event()
        self.forwards = []
        self.last = None
        self.device_confirmed = False
        self.report = {'schemaVersion': 1, 'status': 'running', 'game': 'backroad-rally', 'mode': 'normal',
                       'scope': 'Graphics diagnosis only: original SDK menu subset and read-only graphics/console',
                       'formalAcceptance': False, 'visualPass': None, 'manualPixelReviewRequired': True,
                       'modelWrites': False, 'clockOverrides': False, 'rendererChanges': False, 'existingGlCapabilitiesReadAtCheckpoints': True,
                       'targetApkBuilt': False, 'targetApkChanged': False, 'originalTarget': ORIGINAL,
                       'physicalTvTested': False, 'physicalPhoneTested': False, 'steps': [], 'captures': [],
                       'notTested': ['career/save', 'driving-input acceptance', 'pause/resume', 'reconnect', 'occupied port', 'storage restart']}

    def save(self):
        self.report['lastObservation'] = self.last
        write(self.out / 'report.json', self.report)

    def command(self, *args, timeout=45, limit=2 * 1024 * 1024, check=True, binary=None):
        started = time.time()
        try:
            result = subprocess.run(self.adb + list(args), capture_output=True, timeout=timeout)
        except subprocess.TimeoutExpired as error:
            row = {'command': list(args), 'startedAt': started, 'endedAt': time.time(), 'timeoutSeconds': timeout,
                   'status': 'timeout', 'stdout': (error.stdout or b'')[:limit].decode(errors='replace'),
                   'stderr': (error.stderr or b'')[:limit].decode(errors='replace')}
            with (self.out / 'adb-commands.jsonl').open('a') as f: f.write(json.dumps(row) + '\n')
            raise
        require(len(result.stdout) <= limit and len(result.stderr) <= limit, 'ADB output budget exceeded')
        row = {'command': list(args), 'startedAt': started, 'endedAt': time.time(), 'timeoutSeconds': timeout,
               'status': 'completed', 'exitCode': result.returncode, 'stderr': result.stderr.decode(errors='replace')}
        if binary:
            (self.out / binary).write_bytes(result.stdout)
            row['outputFile'] = {'path': binary, **record(self.out / binary)}
        else:
            row['stdout'] = result.stdout.decode(errors='replace')
        with (self.out / 'adb-commands.jsonl').open('a') as f: f.write(json.dumps(row) + '\n')
        if check: require(result.returncode == 0, 'ADB failed: ' + args[0])
        return result.stdout

    def get(self, endpoint, timeout=15, save=None, deadline=None):
        require(endpoint in ('status', 'console', 'graphics', 'capabilities'), 'Read-only Observer endpoint')
        entry = {'endpoint': endpoint, 'startedAt': time.time(), 'timeoutSeconds': timeout}
        try:
            def read():
                with urlopen('http://127.0.0.1:' + str(self.port) + '/' + endpoint, timeout=timeout) as response:
                    data = response.read(512 * 1024 + 1)
                require(len(data) <= 512 * 1024, 'Observer response budget exceeded')
                value = json.loads(data)
                require(isinstance(value, dict), 'Observer object expected')
                return data, value, hashlib.sha256(data).hexdigest()

            if deadline is None:
                data, value, digest = read()
            else:
                until = min(deadline, time.monotonic() + timeout)
                with observation_deadline(until):
                    data, value, digest = read()
                # Never publish a body that completed/parsed after the budget.
                if time.monotonic() >= until:
                    raise TimeoutError('Read-only menu observation deadline expired')
            entry.update(status='completed', bytes=len(data), sha256=digest)
            if save: (self.out / save).write_bytes(data); entry['savedAs'] = save
            if endpoint == 'graphics': self.last = value
            return value
        except Exception as error:
            entry.update(status='failed', errorType=type(error).__name__, error=str(error)[:2048])
            raise
        finally:
            entry['endedAt'] = time.time()
            with (self.out / 'observer-http.jsonl').open('a') as f: f.write(json.dumps(entry) + '\n')

    def wait(self, predicate, timeout, label, allow_initial_blank=False):
        deadline = time.monotonic() + timeout
        last_error = None
        while time.monotonic() < deadline:
            try:
                state = self.get('graphics', min(15, max(.001, deadline - time.monotonic())))
                require(not state.get('error') and not game(state).get('errors'), 'Actual Observer/game error')
                if state.get('pendingInitialDocument') is True:
                    require(allow_initial_blank and state.get('url') == 'about:blank'
                            and state.get('graphicsRead') is False and not game(state), 'Unexpected empty document')
                if predicate(state): return state
            except (RemoteDisconnected, ConnectionError, TimeoutError, URLError) as error:
                if isinstance(error, HTTPError): raise
                last_error = type(error).__name__
                require(self.instrument.poll() is None, 'Instrumentation exited while observing')
            time.sleep(min(.12, max(0, deadline - time.monotonic())))
        self.report['timeout'] = {'label': label, 'seconds': timeout, 'lastTransportError': last_error}
        raise AssertionError(label + ' timed out; final actual observation retained')

    def menu_graphics(self, deadline):
        """Same 45s/three-new-GET transport policy as the original QA reader.

        Keep this driver's bounded body reader and raw HTTP log. The original
        menu deadline also caps the read; no input or cached result is replayed.
        """
        until = min(deadline, time.monotonic() + original.OBSERVER_SNAPSHOT_TIMEOUT)
        call = getattr(self, '_menu_graphics_calls', 0) + 1
        self._menu_graphics_calls = call
        transport = (RemoteDisconnected, ConnectionResetError, ConnectionAbortedError,
                     ConnectionRefusedError, TimeoutError)
        failures = 0
        for attempt in range(1, original.OBSERVER_SNAPSHOT_ATTEMPTS + 1):
            remaining = until - time.monotonic()
            if remaining <= 0:
                raise TimeoutError('Read-only menu observation deadline expired')
            request_timeout = min(original.OBSERVER_REQUEST_TIMEOUT, remaining)
            started = time.time()
            try:
                value = self.get('graphics', request_timeout, deadline=until)
                if time.monotonic() > until:
                    raise TimeoutError('Read-only menu observation deadline expired')
            except transport + (URLError,) as error:
                if isinstance(error, HTTPError) or (isinstance(error, URLError) and not isinstance(error.reason, transport)):
                    raise
                failures += 1
                remaining = until - time.monotonic()
                retry = attempt < original.OBSERVER_SNAPSHOT_ATTEMPTS and remaining > 0
                self.report.setdefault('observerTransportEvents', []).append({
                    'operation': 'GET /graphics', 'menuReadCall': call, 'status': 'transport-failed',
                    'attempt': attempt, 'maximumAttempts': original.OBSERVER_SNAPSHOT_ATTEMPTS,
                    'maximumWallSeconds': original.OBSERVER_SNAPSHOT_TIMEOUT,
                    'requestTimeoutSeconds': request_timeout, 'startedAt': started, 'endedAt': time.time(),
                    'errorType': type(error).__name__, 'retryScheduled': retry,
                    'remainingStepSeconds': max(0, deadline-time.monotonic())})
                if not retry:
                    raise
                time.sleep(min(.12, remaining / 2))
                continue
            if failures:
                self.report.setdefault('observerTransportEvents', []).append({
                    'operation': 'GET /graphics', 'menuReadCall': call, 'status': 'transport-recovered',
                    'attempt': attempt, 'priorTransportFailures': failures, 'startedAt': started,
                    'endedAt': time.time(), 'responseFromNewGet': True})
            return value
        raise AssertionError('Unreachable menu observation retry state')

    def provenance(self):
        receipt = signer.verify(self.args.observer_input, self.args.build_tools)
        source = receipt['sourceSha']
        binding_path = self.args.input / 'input-verification.json'
        binding = signer.load(binding_path)
        validate_binding(binding, source)
        self.apk = self.args.input / 'packages/backroad-rally' / ORIGINAL['file']
        old = self.args.input / 'observers/backroad-rally/observer-backroad-rally.apk'
        require(record(self.apk) == {k: ORIGINAL[k] for k in ('bytes', 'sha256')}, 'Original APK bytes changed')
        require(record(old) == OLD_OBSERVER, 'Original Observer bytes changed')
        self.observer = self.args.observer_input / signer.SIGNED
        self.report.update(sourceCommit=source, originalInputVerification=binding,
                           originalObserver={'verified': True, 'installed': False, 'started': False, **OLD_OBSERVER},
                           graphicsObserver=receipt)
        names = [Path(__file__), HERE.parent / 'run.py', ROOT / 'puretv-joystick/joystick_sdk.py',
                 ROOT / 'joystick-games/tools/qa-plan.py', ROOT / signer.SELF]
        names += [HERE.parent / name for name in ('install_failure.py', 'install_confirmation.py')]
        names += [ROOT / name for name in signer.SIGNER_NAMES]
        names += [ROOT / name for name in ('joystick-games/tools/android-build.py', 'joystick-games/tools/asset-policy.py',
                                           'joystick-games/catalog-registry.json')]
        names += [p for p in HERE.rglob('*') if p.is_file() and p.suffix in ('.py', '.java', '.js', '.cjs')]
        self.report['sourceFiles'] = {}
        for path in sorted(set(names)):
            name = path.relative_to(ROOT).as_posix()
            data = path.read_bytes()
            require(subprocess.check_output(['git', 'show', source + ':' + name], cwd=ROOT) == data, 'Uncommitted diagnostic source')
            dest = self.out / 'executed-source' / name; dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(data)
            self.report['sourceFiles'][name] = record(path)
        data, self.steps = original_plan()
        (self.out / 'original-qa-plan.json').write_bytes(data)
        self.report['planSubset'] = {'originalSource': ORIGINAL['sourceSha'], 'originalPlanSha256': PLAN_SHA,
                                     'oneBasedIndices': list(SUBSET), 'originalSteps': 39, 'executedSteps': len(SUBSET),
                                     'allSelectedPredicatesUnchanged': True, 'tapMs': 16, 'originalDeclaredHoldMsPreservedInReport': True}
        self.save()

    def installed_hash(self, package, digest):
        lines = self.command('shell', 'pm', 'path', package).decode().strip().splitlines()
        require(len(lines) == 1 and lines[0].startswith('package:/data/app/'), 'Unexpected installed base APK')
        path = lines[0][8:]
        require(path.endswith('/base.apk') and re.fullmatch(r'/data/app/[A-Za-z0-9_./+=~-]+', path) and '..' not in path, 'Unsafe installed APK path')
        require(self.command('shell', 'sha256sum', path).decode().split()[0] == digest, 'Installed APK differs from verified bytes')

    def setup(self):
        self.provenance()
        require(os.environ.get('PURETV_DISPOSABLE_EMULATOR') == '1', 'Only the explicitly disposable CI emulator')
        self.command('wait-for-device')
        require(self.command('shell', 'getprop', 'ro.kernel.qemu').strip() == b'1', 'Refuse a physical device')
        self.device_confirmed = True
        for args in [('version',), ('shell', 'getprop', 'ro.build.version.sdk'), ('shell', 'dumpsys', 'webviewupdate')]: self.command(*args)
        install_started = time.time()
        try:
            self.command('install', '-r', str(self.apk), timeout=240)
        except Exception:
            # The target35 original installed directly in v7. The old target29
            # per-app confirmation guard does not apply to these different bytes.
            # Observe a failure, never retry installation or click installer UI.
            try:
                self.report['installFailureEvidence'] = original.install_failure.capture(
                    self.adb, self.apk, TARGET, self.out / 'install-failure',
                    {'command': self.adb + ['install', '-r', str(self.apk)], 'startedAt': install_started,
                     'endedAt': time.time(), 'timeoutSeconds': 240, 'originalFailurePreserved': True}, expected_apk=ORIGINAL)
            except Exception as error:
                self.report['installFailureEvidence'] = {'status': 'unavailable', 'errorType': type(error).__name__, 'uiActionsSent': False}
            raise
        self.installed_hash(TARGET, ORIGINAL['sha256'])
        self.command('install', '-r', '-t', str(self.observer))
        self.installed_hash(signer.PACKAGE, self.report['graphicsObserver']['apkIdentity']['sha256'])
        self.command('shell', 'am', 'force-stop', TARGET)
        require(self.command('shell', 'pm', 'clear', TARGET).strip() == b'Success', 'Original fresh-install scenario reset failed')
        self.report['installationSetup'] = 'Original normal scenario: pm clear only fixed target on disposable emulator before launch'
        self.port = int(self.command('forward', 'tcp:0', 'tcp:63487').strip()); self.forwards.append(self.port)
        self.instrument_log = (self.out / 'instrumentation.log').open('wb')
        self.instrument = subprocess.Popen(self.adb + ['shell', 'am', 'instrument', '-w', '-r', '-e', 'diagnosticPort', '63487',
                                                     signer.PACKAGE + '/' + signer.RUNNER], stdout=self.instrument_log, stderr=subprocess.STDOUT)
        initial = self.wait(initial_menu_ready, 150, 'initialized-original-menu', allow_initial_blank=True)
        validated(initial)
        self.report['initialMenu'] = initial
        self.capture('initial-menu')
        forwarded = int(self.command('forward', 'tcp:0', 'tcp:63485').strip()); self.forwards.append(forwarded)
        self.proxy = original.WireProxy(('127.0.0.1', forwarded), self.out / 'wire.jsonl')
        client = original.JoystickClient('127.0.0.1', self.proxy.port); self.clients.append(client); client.connect()
        threading.Thread(target=self.heartbeat, daemon=True).start()
        connected = self.wait(lambda s: bool(owner(s, client.identity).get('session')) and released(s, s, client.identity), 60, 'original-sdk-connected-and-released')
        self.report['sdkIdentity'] = {'controllerId': client.identity, 'session': owner(connected, client.identity)['session']}
        self.report['connected'] = connected
        self.save()

    def heartbeat(self):
        while not self.stop.wait(2):
            for client in self.clients:
                with client.lock:
                    if client.sock is not None:
                        try: client.ping()
                        except OSError: pass

    def capture(self, label):
        before = self.get('graphics', save=label + '-graphics-before.json')
        self.get('capabilities', save=label + '-capabilities.json')
        self.get('console', save=label + '-console.json')
        self.get('status', save=label + '-status.json')
        image = self.command('exec-out', 'screencap', '-p', limit=16 * 1024 * 1024, binary=label + '.png')
        require(image.startswith(b'\x89PNG\r\n\x1a\n'), 'System screenshot is not PNG')
        after = self.get('graphics', save=label + '-graphics-after.json')
        self.report['captures'].append({'name': label, 'screenshot': record(self.out / (label + '.png')),
                                       'beforePoll': game(before).get('pollCount'), 'afterPoll': game(after).get('pollCount'),
                                       'manualPixelReviewRequired': True})
        self.save()

    def menu(self, index, step):
        client = self.clients[0]
        before = self.get('graphics'); validated(before)
        require(game(before)['stage'] == 'menu' and released(before, before, client.identity), 'Menu input precondition')
        require(not original.plan.matches(step['expect'], game(before), game(before)), 'Menu expectation was already true')
        item = {'originalIndex': index, 'step': step, 'status': 'running', 'before': before, 'samples': []}
        self.report['steps'].append(item)
        deadline = time.monotonic() + step['timeoutSeconds']
        key = step['keys'][0]
        with client.lock:
            client.button(key, 'down'); down = client.seq
        try:
            time.sleep(.016)
        finally:
            with client.lock:
                client.button(key, 'tap', duration=180); up = client.seq
        for seq in (down, up): original.Acceptance.wait_sent_ack(self, client, seq, timeout=min(10, max(.001, deadline-time.monotonic())))
        item['wire'] = original.Acceptance.menu_wire_pair(self, key, down, up)
        candidate = None
        stable = 0
        while time.monotonic() < deadline:
            state = self.menu_graphics(deadline)
            require(not state.get('error') and not game(state).get('errors'), 'Actual Observer/game error during menu')
            expected = original.plan.matches(step['expect'], game(state), game(before))
            # Only the source-proven original Start action may navigate to this
            # exact query. No low counter alone is treated as a new document.
            qualifies = menu_qualified(state, before, client.identity, index, step)
            item['samples'].append({'poll': game(state).get('pollCount'), 'url': state.get('url'), 'phase': game(state).get('gameplay', {}).get('phase'),
                                    'released': released(state, before, client.identity), 'expected': expected, 'qualified': qualifies})
            if len(item['samples']) > 64: del item['samples'][16]
            if qualifies:
                if candidate is None: candidate, stable = state, 0
                elif fresh(state, candidate): candidate, stable = state, stable + 1
                elif game(state).get('pollCount', 0) < game(candidate).get('pollCount', 0): candidate, stable = None, 0
            else: candidate, stable = None, 0
            if stable >= 2:
                validated(state)
                item.update(status='observed', after=state, subsequentFreshPolls=stable)
                self.save()
                if index == 18: self.capture('original-low-settings')
                return
            time.sleep(min(.08, max(0, deadline-time.monotonic())))
        item['status'] = 'timed-out'
        raise AssertionError('Original menu subset predicate not stably observed: ' + step['name'])

    def run(self):
        try:
            self.setup()
            for index, step in self.steps: self.menu(index, step)
            self.capture('original-stage-running')
            client = self.clients[0]
            with client.lock: client.ping(); seq = client.seq
            original.Acceptance.wait_sent_ack(self, client, seq)
            summary = self.proxy.summary()
            require(not summary['missingAcks'] and not summary['unexpectedReplies'] and not summary['duplicateAcks'] and not summary['errors'], 'Actual SDK wire evidence incomplete')
            self.report['wireSummary'] = summary
            self.report['status'] = 'diagnostic-completed'
        except Exception as error:
            self.report.update(status='failed', errorType=type(error).__name__, error=str(error))
            if self.report['steps'] and self.report['steps'][-1]['status'] == 'running':
                self.report['steps'][-1].update(status='failed', errorType=type(error).__name__)
        finally:
            self.stop.set()
            # Independent of /graphics and the UI thread: preserve the actual
            # system display even if initialization/console observation failed.
            if self.device_confirmed:
                try:
                    screen = original.install_failure.bounded_command(self.adb + ['exec-out', 'screencap', '-p'],
                        self.out / 'final-system-screen.png', time.monotonic() + 15, 12 * 1024 * 1024)
                    path = self.out / 'final-system-screen.png'
                    screen['completePng'] = path.is_file() and original.install_failure.complete_png(path.read_bytes())
                    self.report['finalSystemScreenshot'] = screen
                except Exception as error: self.report['finalSystemScreenshot'] = {'status': 'unavailable', 'errorType': type(error).__name__}
            if hasattr(self, 'port'):
                for endpoint in ('status', 'console', 'graphics', 'capabilities'):
                    try: self.get(endpoint, save='final-' + endpoint + '.json')
                    except Exception as error: self.report.setdefault('finalReadErrors', {})[endpoint] = type(error).__name__
            for client in self.clients: client.disconnect()
            if self.proxy: self.proxy.close(); self.report['finalWireSummary'] = self.proxy.summary()
            for name, args in ([('final-logcat.txt', ('logcat', '-d', '-t', '6000')), ('final-window.txt', ('shell', 'dumpsys', 'window', 'windows')),
                               ('final-gfxinfo.txt', ('shell', 'dumpsys', 'gfxinfo', TARGET))] if self.device_confirmed else []):
                try: self.command(*args, check=False, binary=name)
                except Exception as error: self.report.setdefault('finalSystemErrors', {})[name] = type(error).__name__
            if self.instrument:
                try:
                    self.command('shell', 'am', 'force-stop', TARGET, check=False)
                    try: self.instrument.wait(timeout=10)
                    except subprocess.TimeoutExpired: self.instrument.terminate(); self.instrument.wait(timeout=5)
                except Exception as error: self.report.setdefault('cleanupErrors', []).append(type(error).__name__)
                finally: self.instrument_log.close()
            for port in self.forwards:
                try: self.command('forward', '--remove', 'tcp:' + str(port), check=False)
                except Exception as error: self.report.setdefault('cleanupErrors', []).append(type(error).__name__)
            self.save()
        return self.report['status'] == 'diagnostic-completed'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('input', 'observer-input', 'output', 'build-tools'): parser.add_argument('--' + key, type=Path, required=True)
    parser.add_argument('--adb', required=True)
    args = parser.parse_args()
    raise SystemExit(0 if Diagnosis(args).run() else 1)


if __name__ == '__main__':
    main()
