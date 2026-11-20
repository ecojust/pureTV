#!/usr/bin/env python3
"""Host-side boundaries only: no APK install, WebView, signing or native claim."""
import copy
import importlib.util
import json
import io
import os
from pathlib import Path
import unittest
import tempfile
from types import SimpleNamespace
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, HTTPServer
import socket
import signal
import threading
import time
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('graphics_driver_tests', HERE.parent / 'run.py')
driver = importlib.util.module_from_spec(spec); spec.loader.exec_module(driver)
ROOT = driver.ROOT
FROZEN = ROOT / 'joystick-games/backroad-rally/docs/android-initial-ready-v7-44630023214/original-export/evidence/joystick-android-runtime-backroad-rally'


def state():
    # Relevant cached fields from the real v7 normal report (source 382de379).
    report = json.loads((FROZEN / 'backroad-rally-normal/report.json').read_text())
    snap = next(s['snapshot'] for s in report['snapshots'] if s['label'] == 'before-plan-Focus quick stage')
    value = copy.deepcopy(snap['game'])
    value['pollCount'] = value['controller']['pollCount']
    value['controller'].pop('info', None)
    return {'graphicsRead': True, 'cachedGame': value, 'url': driver.ENTRY,
            'controllerService': snap['info']['wifiController'], 'nativeSnapshotPolled': False,
            'contextRead': False, 'consoleAttachedBeforeLoad': True, 'canvases': [{'width': 1920, 'height': 1080}],
            'activityState': 'resumed', 'windowFocused': True, 'hidden': False, 'focused': True}


@contextmanager
def loopback_observer(responses):
    """Real local HTTP transport only; no Android/game model is executed."""
    calls = []
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args): pass
        def do_GET(self):
            calls.append(self.path)
            kind, body = responses[min(len(calls)-1, len(responses)-1)]
            if kind == 'drop':
                self.connection.shutdown(socket.SHUT_RDWR); self.connection.close(); return
            if kind == 'late': time.sleep(.08)
            data = body if isinstance(body, bytes) else json.dumps(body).encode()
            try:
                if kind in ('slow-header', 'slow-body'):
                    header = ('HTTP/1.0 200 OK\r\nContent-Length: ' + str(len(data)) + '\r\n\r\n').encode()
                    if kind == 'slow-body': self.wfile.write(header)
                    for byte in header if kind == 'slow-header' else data:
                        self.wfile.write(bytes([byte])); self.wfile.flush(); time.sleep(.01)
                    if kind == 'slow-header': self.wfile.write(data)
                    return
                self.send_response(500 if kind == 'http-error' else 200)
                self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError): pass
    server = HTTPServer(('127.0.0.1', 0), Handler)
    worker = threading.Thread(target=lambda: server.serve_forever(poll_interval=.01), daemon=True)
    worker.start()
    try: yield server.server_port, calls
    finally: server.shutdown(); server.server_close(); worker.join(2)


class DriverBoundaries(unittest.TestCase):
    def setUp(self):
        self.state = state()
        self.identity = self.state['cachedGame']['controller']['players'][0]['controllerId']

    def test_actual_cached_menu_readiness_and_strict_observer_fields(self):
        self.assertTrue(driver.initial_menu_ready(self.state))
        driver.validated(self.state)
        for key, value in [('renderer', 'loading'), ('frames', 0), ('frames', True), ('pollCount', False), ('pollCount', 0), ('webglVersion', 0)]:
            s = copy.deepcopy(self.state); s['cachedGame'][key] = value
            self.assertFalse(driver.initial_menu_ready(s), (key, value))
        for key in ('contextRead', 'nativeSnapshotPolled'):
            s = copy.deepcopy(self.state); s[key] = True
            with self.assertRaises(AssertionError): driver.validated(s)
        s = copy.deepcopy(self.state); s['consoleAttachedBeforeLoad'] = False
        with self.assertRaises(AssertionError): driver.validated(s)

    def test_unexpected_service_document_game_error_rejected(self):
        for mutate in [lambda s: s.update(url=driver.ENTRY + '?mode=other'),
                       lambda s: s['controllerService'].update(port=63486),
                       lambda s: s['cachedGame'].update(errors=['actual error']),
                       lambda s: s.update(error='Observer failed')]:
            s = copy.deepcopy(self.state); mutate(s)
            with self.assertRaises(AssertionError): driver.validated(s)

    def test_same_owner_release_requires_every_key_and_live_focus(self):
        self.assertTrue(driver.released(self.state, self.state, self.identity))
        mutations = [lambda s: s.update(windowFocused=False), lambda s: s.update(hidden=True),
                     lambda s: s.update(focused=False), lambda s: s.update(activityState='paused'),
                     lambda s: s['cachedGame']['controller'].update(cancelled=True)]
        for key in driver.KEYS:
            mutations.append(lambda s, k=key: s['cachedGame']['controller']['buttons'].update({k: True}))
            mutations.append(lambda s, k=key: s['cachedGame']['controller']['players'][0]['buttons'].pop(k))
        for key, value in [('session', 'different'), ('cancelSeq', 100), ('cancelSeq', True), ('id', 2), ('id', True), ('inputActive', False), ('controllerId', 'other')]:
            mutations.append(lambda s, k=key, v=value: s['cachedGame']['controller']['players'][0].update({k: v}))
        for mutate in mutations:
            s = copy.deepcopy(self.state); mutate(s)
            self.assertFalse(driver.released(s, self.state, self.identity))

    def test_source_bound_subset_excludes_formal_acceptance_actions(self):
        raw, subset = driver.original_plan()
        self.assertEqual([i for i, _ in subset], list(range(24, 34)))
        self.assertEqual(len(subset), 10)
        original = json.loads(raw)
        for i, step in subset:
            self.assertEqual(step, original['steps'][i-1])
        self.assertEqual(subset[-1][1]['timeoutSeconds'], 240)
        self.assertEqual(subset[-1][1]['expect'], [{'path':'gameplay.phase','op':'eq','value':'running'}, {'path':'stage','op':'eq','value':'playing'}])

    def test_exact_start_query_only_can_reset_poll_count(self):
        _, subset = driver.original_plan(); step = subset[-1][1]
        before = self.state
        after = copy.deepcopy(before)
        after['url'] = driver.STAGE_URL
        after['cachedGame'].update(stage='playing', pollCount=2)
        after['cachedGame']['gameplay']['phase'] = 'running'
        self.assertTrue(driver.menu_qualified(after, before, self.identity, 33, step))
        self.assertFalse(driver.menu_qualified(after, before, self.identity, 32, step))
        after['url'] = driver.ENTRY
        self.assertFalse(driver.menu_qualified(after, before, self.identity, 33, step))
        after['url'] = driver.STAGE_URL + '&extra=1'
        self.assertFalse(driver.menu_qualified(after, before, self.identity, 33, step))
        after['url'] = driver.STAGE_URL
        after['cachedGame']['gameplay']['phase'] = 'intro'
        self.assertFalse(driver.menu_qualified(after, before, self.identity, 33, step))

    def test_fresh_samples_require_same_document_positive_progress(self):
        after = copy.deepcopy(self.state)
        self.assertFalse(driver.fresh(after, self.state))
        after['cachedGame']['pollCount'] += 1
        self.assertTrue(driver.fresh(after, self.state))
        after['url'] = driver.STAGE_URL
        self.assertFalse(driver.fresh(after, self.state))
        after['url'] = driver.ENTRY; after['cachedGame']['pollCount'] = True
        self.assertFalse(driver.fresh(after, self.state))

    def test_candidate_binding_exact_source_and_scope(self):
        binding = json.loads((FROZEN / 'backroad-rally/verified-inputs/input-verification.json').read_text())
        with patch.dict(os.environ, {'GITHUB_RUN_ID': binding['qaRunId']}):
            with self.assertRaises(AssertionError):
                driver.validate_binding(binding, binding['qaSourceSha'])
            # Adapt the preserved v7 layout to the independently pinned v0.1.1 identities.
            expected = driver.ORIGINAL
            binding.update(artifactSourceSha=expected['sourceSha'], artifactRunId=str(expected['runId']))
            binding['artifactOrigin'].update(artifactRunId=str(expected['runId']), artifactSourceSha=expected['sourceSha'],
                artifactId=expected['artifactId'], zip={'bytes':expected['artifactBytes'],'sha256':expected['artifactSha256']})
            target = binding['games'][0]
            target.update(frozenSourceInputsVerified=915)
            target['package'].update(bytes=expected['bytes'],sha256=expected['sha256'])
            target['observer'].update(driver.OLD_OBSERVER)
            driver.validate_binding(binding, binding['qaSourceSha'])
            mutations = [lambda b: b.update(localPreflightOnly=True), lambda b: b.update(status='failed'),
                         lambda b: b.update(qaRunId='other'), lambda b: b.update(qaSourceSha='0'*40),
                         lambda b: b['artifactOrigin'].update(artifactRunAttempt=2),
                         lambda b: b['artifactOrigin'].update(artifactId=1),
                         lambda b: b['artifactOrigin']['zip'].update(sha256='0'*64),
                         lambda b: b['games'][0].update(assetsVerified=337),
                         lambda b: b['games'][0]['package'].update(sha256='0'*64),
                         lambda b: b['games'][0]['observer'].update(certificateSha256='0'*64),
                         lambda b: b['games'].append(copy.deepcopy(b['games'][0]))]
            for mutate in mutations:
                b = copy.deepcopy(binding); mutate(b)
                with self.assertRaises(AssertionError): driver.validate_binding(b, binding['qaSourceSha'])

    def test_transport_failure_never_reuses_a_previous_ready_observation(self):
        instance = object.__new__(driver.Diagnosis)
        instance.report = {}; instance.last = copy.deepcopy(self.state)
        class Running:
            def poll(self): return None
        instance.instrument = Running()
        with patch.object(instance, 'get', side_effect=driver.RemoteDisconnected('closed')):
            with self.assertRaisesRegex(AssertionError, 'timed out'):
                instance.wait(driver.initial_menu_ready, .025, 'fixture-transport')
        self.assertEqual(instance.report['timeout']['lastTransportError'], 'RemoteDisconnected')
        self.assertEqual(instance.last, self.state)  # retained as old evidence, never returned as fresh success

    def test_actual_game_error_is_not_hidden_by_initial_wait(self):
        instance = object.__new__(driver.Diagnosis); instance.report = {}
        observed = copy.deepcopy(self.state); observed['cachedGame']['errors'] = ['actual runtime error']
        with patch.object(instance, 'get', return_value=observed):
            with self.assertRaisesRegex(AssertionError, 'Actual Observer/game error'):
                instance.wait(driver.initial_menu_ready, 150, 'fixture-error')
        self.assertNotIn('timeout', instance.report)

    def test_each_http_failure_and_fresh_success_is_recorded(self):
        instance = object.__new__(driver.Diagnosis); instance.port = 63487; instance.last = None
        with tempfile.TemporaryDirectory() as directory:
            instance.out = Path(directory)
            with patch.object(driver, 'urlopen', side_effect=driver.RemoteDisconnected('first request closed')):
                with self.assertRaises(driver.RemoteDisconnected): instance.get('graphics')
            self.assertIsNone(instance.last)
            raw = json.dumps(self.state).encode()
            with patch.object(driver, 'urlopen', return_value=io.BytesIO(raw)):
                self.assertEqual(instance.get('graphics'), self.state)
            with patch.object(driver, 'urlopen', return_value=io.BytesIO(b'x' * (512 * 1024 + 1))):
                with self.assertRaisesRegex(AssertionError, 'budget'): instance.get('graphics')
            self.assertEqual(instance.last, self.state)  # prior evidence retained, overbudget result was rejected
            rows = [json.loads(line) for line in (instance.out / 'observer-http.jsonl').read_text().splitlines()]
            self.assertEqual([r['status'] for r in rows], ['failed', 'completed', 'failed'])
            self.assertEqual(rows[0]['errorType'], 'RemoteDisconnected')
            self.assertEqual(rows[1]['sha256'], driver.hashlib.sha256(raw).hexdigest())
            self.assertEqual(rows[2]['errorType'], 'AssertionError')
            self.assertTrue(all(r['endedAt'] >= r['startedAt'] for r in rows))

    def test_failed_preflight_has_no_final_device_observation(self):
        with tempfile.TemporaryDirectory() as directory:
            instance = driver.Diagnosis(SimpleNamespace(output=Path(directory)/'new-output', adb='must-not-run'))
            with patch.object(instance, 'setup', side_effect=AssertionError('rejected preflight')), \
                 patch.object(instance, 'command') as adb, \
                 patch.object(driver.original.install_failure, 'bounded_command') as capture:
                self.assertFalse(instance.run())
                adb.assert_not_called(); capture.assert_not_called()
            self.assertEqual(instance.report['status'], 'failed')

    def test_only_initial_blank_is_pending_before_actual_initialized_menu(self):
        instance = object.__new__(driver.Diagnosis); instance.report = {}
        pending = {'pendingInitialDocument': True, 'url': 'about:blank', 'graphicsRead': False}
        with patch.object(instance, 'get', side_effect=[pending, self.state]):
            self.assertEqual(instance.wait(driver.initial_menu_ready, 150, 'initial', allow_initial_blank=True), self.state)
        with patch.object(instance, 'get', return_value=pending):
            with self.assertRaisesRegex(AssertionError, 'Unexpected empty document'):
                instance.wait(driver.initial_menu_ready, 60, 'after-initial')
        for changed in [dict(pending, url='https://outside.invalid'), dict(pending, graphicsRead=True),
                        dict(pending, cachedGame={'game':'backroad-rally'}), dict(pending, error='actual error')]:
            with patch.object(instance, 'get', return_value=changed):
                with self.assertRaises(AssertionError):
                    instance.wait(driver.initial_menu_ready, 150, 'initial', allow_initial_blank=True)

    def test_real_dropped_menu_get_recovers_only_from_a_new_json_response(self):
        newer = copy.deepcopy(self.state); newer['cachedGame']['pollCount'] += 25
        with tempfile.TemporaryDirectory() as directory, loopback_observer([('drop', b''), ('json', newer)]) as (port, calls):
            instance = driver.Diagnosis(SimpleNamespace(output=Path(directory)/'out', adb='must-not-run'))
            instance.port = port; instance.last = copy.deepcopy(self.state)
            self.assertEqual(instance.menu_graphics(time.monotonic()+2), newer)
            self.assertEqual(instance.last, newer)
            self.assertEqual(calls, ['/graphics', '/graphics'])
            events = instance.report['observerTransportEvents']
            self.assertEqual([r['status'] for r in events], ['transport-failed', 'transport-recovered'])
            self.assertTrue(events[0]['retryScheduled']); self.assertTrue(events[1]['responseFromNewGet'])
            rows = [json.loads(line) for line in (instance.out/'observer-http.jsonl').read_text().splitlines()]
            self.assertEqual([r['status'] for r in rows], ['failed', 'completed'])
            self.assertEqual(rows[0]['errorType'], 'RemoteDisconnected')
            self.assertEqual(instance.clients, [])  # read recovery has no SDK client or button side effect

    def test_menu_get_attempt_and_original_step_deadline_are_bounded(self):
        with tempfile.TemporaryDirectory() as directory, loopback_observer([('drop', b'')]) as (port, calls):
            instance = driver.Diagnosis(SimpleNamespace(output=Path(directory)/'out', adb='must-not-run'))
            instance.port = port; instance.last = copy.deepcopy(self.state)
            with self.assertRaises(driver.RemoteDisconnected): instance.menu_graphics(time.monotonic()+240)
            self.assertEqual(len(calls), 3)
            self.assertEqual([r['retryScheduled'] for r in instance.report['observerTransportEvents']], [True, True, False])
            self.assertTrue(all(r['maximumWallSeconds'] == 45 and r['requestTimeoutSeconds'] <= 15 for r in instance.report['observerTransportEvents']))
            self.assertEqual(instance.last, self.state)
            with patch.object(instance, 'get') as read:
                with self.assertRaises(TimeoutError): instance.menu_graphics(time.monotonic()-1)
                read.assert_not_called()
        with tempfile.TemporaryDirectory() as directory, loopback_observer([('late', self.state)]) as (port, calls):
            instance = driver.Diagnosis(SimpleNamespace(output=Path(directory)/'out', adb='must-not-run'))
            instance.port = port; instance.last = None
            with self.assertRaises(TimeoutError): instance.menu_graphics(time.monotonic()+.025)
            self.assertLessEqual(len(calls), 1)
            self.assertIsNone(instance.last)
            self.assertFalse(instance.report['observerTransportEvents'][-1]['retryScheduled'])
            self.assertLessEqual(instance.report['observerTransportEvents'][0]['requestTimeoutSeconds'], .025)

    def test_menu_get_does_not_retry_http_json_budget_or_game_errors(self):
        for kind, body, error in [('http-error', b'actual HTTP failure', driver.HTTPError),
                                  ('json', b'not JSON', json.JSONDecodeError),
                                  ('json', b'x'*(512*1024+1), AssertionError)]:
            with self.subTest(kind=kind, error=error), tempfile.TemporaryDirectory() as directory, loopback_observer([(kind, body)]) as (port, calls):
                instance = driver.Diagnosis(SimpleNamespace(output=Path(directory)/'out', adb='must-not-run')); instance.port=port
                with self.assertRaises(error): instance.menu_graphics(time.monotonic()+2)
                self.assertEqual(calls, ['/graphics']); self.assertNotIn('observerTransportEvents', instance.report)
        bad = copy.deepcopy(self.state); bad['cachedGame']['errors'] = ['actual game error']
        with tempfile.TemporaryDirectory() as directory, loopback_observer([('json', bad)]) as (port, calls):
            instance = driver.Diagnosis(SimpleNamespace(output=Path(directory)/'out', adb='must-not-run')); instance.port=port
            result = instance.menu_graphics(time.monotonic()+2)
            with self.assertRaises(AssertionError): driver.validated(result)
            self.assertEqual(calls, ['/graphics']); self.assertNotIn('observerTransportEvents', instance.report)

    def test_real_slow_headers_and_body_obey_absolute_deadline_without_late_state(self):
        # A socket idle timeout alone accepts bytes every 10ms indefinitely.
        for kind in ('slow-header', 'slow-body'):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as directory, loopback_observer([(kind, b'{"late":true}')]) as (port, calls):
                instance = driver.Diagnosis(SimpleNamespace(output=Path(directory)/'out', adb='must-not-run'))
                instance.port = port; instance.last = copy.deepcopy(self.state)
                previous = signal.getsignal(signal.SIGALRM)
                start = time.monotonic()
                with self.assertRaises(TimeoutError): instance.menu_graphics(start + .025)
                elapsed = time.monotonic() - start
                self.assertLess(elapsed, .10, (kind, elapsed))  # scheduler allowance, old 142ms body fails
                self.assertEqual(instance.last, self.state)
                self.assertEqual(calls, ['/graphics'])
                self.assertEqual(signal.getitimer(signal.ITIMER_REAL), (0.0, 0.0))
                self.assertIs(signal.getsignal(signal.SIGALRM), previous)
                rows = [json.loads(line) for line in (instance.out/'observer-http.jsonl').read_text().splitlines()]
                self.assertEqual([r['status'] for r in rows], ['failed'])
                self.assertFalse(instance.report['observerTransportEvents'][-1]['retryScheduled'])
                time.sleep(.04)
                self.assertEqual(instance.last, self.state)  # no background reader can publish later
                self.assertEqual(len((instance.out/'observer-http.jsonl').read_text().splitlines()), 1)

    def test_deadline_restores_signal_state_and_refuses_other_owner_or_thread(self):
        previous = signal.getsignal(signal.SIGALRM)
        def custom_handler(_number, _frame): pass
        signal.signal(signal.SIGALRM, custom_handler)
        try:
            with driver.observation_deadline(time.monotonic()+1): pass
            self.assertIs(signal.getsignal(signal.SIGALRM), custom_handler)
            with self.assertRaisesRegex(RuntimeError, 'fixture failure'):
                with driver.observation_deadline(time.monotonic()+1): raise RuntimeError('fixture failure')
            self.assertEqual(signal.getitimer(signal.ITIMER_REAL), (0.0, 0.0))
            self.assertIs(signal.getsignal(signal.SIGALRM), custom_handler)
            signal.setitimer(signal.ITIMER_REAL, 60)
            with self.assertRaisesRegex(AssertionError, 'existing alarm'):
                with driver.observation_deadline(time.monotonic()+1): self.fail('must not enter')
            self.assertGreater(signal.getitimer(signal.ITIMER_REAL)[0], 59)
            self.assertIs(signal.getsignal(signal.SIGALRM), custom_handler)
        finally:
            signal.setitimer(signal.ITIMER_REAL, 0); signal.signal(signal.SIGALRM, previous)
        errors = []
        def other_thread():
            try:
                with driver.observation_deadline(time.monotonic()+1): pass
            except Exception as error: errors.append(error)
        worker = threading.Thread(target=other_thread); worker.start(); worker.join(1)
        self.assertFalse(worker.is_alive())
        self.assertEqual(len(errors), 1); self.assertIn('main thread', str(errors[0]))

    def test_deadline_includes_json_parse_and_never_publishes_expired_body(self):
        with tempfile.TemporaryDirectory() as directory:
            instance = driver.Diagnosis(SimpleNamespace(output=Path(directory)/'out', adb='must-not-run'))
            instance.port = 63487; instance.last = copy.deepcopy(self.state)
            def delayed_parse(_data): time.sleep(.10); return {'late': True}
            with patch.object(driver, 'urlopen', return_value=io.BytesIO(b'{}')), patch.object(driver.json, 'loads', side_effect=delayed_parse):
                with self.assertRaises(TimeoutError): instance.get('graphics', deadline=time.monotonic()+.025)
            self.assertEqual(instance.last, self.state)
            row = json.loads((instance.out/'observer-http.jsonl').read_text())
            self.assertEqual(row['status'], 'failed'); self.assertEqual(row['errorType'], 'TimeoutError')
            self.assertEqual(signal.getitimer(signal.ITIMER_REAL), (0.0, 0.0))


if __name__ == '__main__':
    unittest.main()
