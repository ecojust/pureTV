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
        self.assertEqual([i for i, _ in subset], list(range(1, 21)) + list(range(24, 34)))
        self.assertEqual(len(subset), 30)
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

    def test_real_original_binding_exact_source_and_scope(self):
        binding = json.loads((FROZEN / 'backroad-rally/verified-inputs/input-verification.json').read_text())
        with patch.dict(os.environ, {'GITHUB_RUN_ID': binding['qaRunId']}):
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


if __name__ == '__main__':
    unittest.main()
