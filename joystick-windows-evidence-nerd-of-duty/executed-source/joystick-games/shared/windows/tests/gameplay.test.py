#!/usr/bin/env python3
"""Synthetic opt-in QA boundaries; this is not evidence of native gameplay."""
import copy
import importlib.util
import json
import threading
import time
import types
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[4]
spec = importlib.util.spec_from_file_location('windows_gameplay_verify', ROOT / 'joystick-games/tools/windows-verify.py')
verify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verify)
plan_api = verify.plan_api


class PlanBoundaries(unittest.TestCase):
    def plan(self, game):
        return json.loads((ROOT / 'joystick-games' / game / 'qa-plan.json').read_text())

    def test_current_three_plans_preserve_original_shared_limits(self):
        for name in ['backroad-rally', 'kart-royale', 'turbo-kart-rush']:
            plan_api.validate_plan(self.plan(name))
        royale = self.plan('kart-royale')['steps'][11]
        self.assertEqual(royale['timeoutSeconds'], 60)
        self.assertEqual(royale['windowsStartupWait'], {'timeoutSeconds': 600})
        turbo = self.plan('turbo-kart-rush')['steps'][4]
        self.assertEqual(turbo['holdMs'], 2500)
        self.assertEqual(turbo['timeoutSeconds'], 60)

    def test_ordinary_step_cannot_bypass_default_240_second_cap(self):
        plan = self.plan('kart-royale')
        plan['steps'][11].pop('windowsStartupWait')
        for timeout in [241, 600, True, float('inf'), float('nan')]:
            plan['steps'][11]['timeoutSeconds'] = timeout
            with self.subTest(timeout=timeout), self.assertRaises(AssertionError):
                plan_api.validate_plan(plan)

    def test_startup_limit_is_exact_and_phase_only(self):
        original = self.plan('kart-royale')
        updates = [
            {'windowsStartupWait': True},
            {'windowsStartupWait': {'timeoutSeconds': 601}},
            {'windowsStartupWait': {'timeoutSeconds': True}},
            {'windowsStartupWait': {'timeoutSeconds': 600.0}},
            {'windowsStartupWait': {'timeoutSeconds': 600, 'skipCountdown': True}},
            {'keys': ['UP']}, {'keys': ['A', 'UP']}, {'holdMs': 1001},
            {'menuTap': True}, {'windowsHoldUntilExpect': True},
            {'expect': [{'path': 'gameplay.phase', 'op': 'eq', 'value': 'countdown'}]},
            {'expect': [{'path': 'stage', 'op': 'eq', 'value': 'playing'}]},
            {'expect': [{'path': 'gameplay.time', 'op': 'gt', 'value': 0}]},
        ]
        for update in updates:
            plan = copy.deepcopy(original)
            plan['steps'][11].update(update)
            with self.subTest(update=update), self.assertRaises(AssertionError):
                plan_api.validate_plan(plan)

    def test_held_mode_requires_bounded_throttle_and_original_motion_expectation(self):
        original = self.plan('turbo-kart-rush')
        updates = [
            {'windowsHoldUntilExpect': 1}, {'keys': ['START']},
            {'keys': ['UP', 'LEFT']}, {'menuTap': True}, {'timeoutSeconds': 61},
            {'expect': [{'path': 'gameplay.speed', 'op': 'gt', 'value': 0}, {'path': 'gameplay.progress', 'op': 'changed'}]},
            {'expect': [{'path': 'gameplay.speed', 'op': 'gt', 'value': 2}, {'path': 'gameplay.time', 'op': 'increased'}]},
            {'expect': [{'path': 'stage', 'op': 'eq', 'value': 'playing'}]},
        ]
        for update in updates:
            plan = copy.deepcopy(original)
            plan['steps'][4].update(update)
            with self.subTest(update=update), self.assertRaises(AssertionError):
                plan_api.validate_plan(plan)


    def test_position_motion_uses_original_predicate_and_keeps_throttle_boundaries(self):
        original = self.plan('kart-royale')
        step = original['steps'][12]
        self.assertIs(step['windowsHoldUntilExpect'], True)
        self.assertEqual(step['expect'], [{'path': 'gameplay.speed', 'op': 'gt', 'value': 1},
                                         {'path': 'gameplay.position', 'op': 'changed'}])
        self.assertEqual(step['timeoutSeconds'], 60)
        plan_api.validate_plan(original)
        for update in [{'keys':['UP','A']}, {'timeoutSeconds':61}, {'menuTap':True},
                       {'expect':[step['expect'][0], {'path':'gameplay.position','op':'increased'}]},
                       {'expect':[step['expect'][0], {'path':'gameplay.position.0','op':'changed'}]},
                       {'expect':[step['expect'][0], {'path':'gameplay.position','op':'changed','value':[0,0,0]}]},
                       {'expect':[step['expect'][0], {'path':'gameplay.time','op':'changed'}]},
                       {'expect':[{'path':'gameplay.speed','op':'gt','value':0}, step['expect'][1]]}]:
            plan = copy.deepcopy(original); plan['steps'][12].update(update)
            with self.subTest(update=update), self.assertRaises(AssertionError): plan_api.validate_plan(plan)

    def test_release_observation_is_explicit_bounded_and_only_after_held_throttle(self):
        original = self.plan('kart-royale')
        self.assertEqual(original['steps'][12]['windowsReleaseWait'], {'timeoutSeconds': 45})
        plan_api.validate_plan(original)
        for value in [None, True, {}, {'timeoutSeconds': True}, {'timeoutSeconds': 0},
                      {'timeoutSeconds': 61}, {'timeoutSeconds': 45.0}, {'timeoutSeconds': float('nan')},
                      {'timeoutSeconds': 45, 'skipRelease': True}]:
            plan = copy.deepcopy(original); plan['steps'][12]['windowsReleaseWait'] = value
            with self.subTest(value=value), self.assertRaises(AssertionError): plan_api.validate_plan(plan)
        for index in [0, 11, 13, 17]:
            plan = copy.deepcopy(original); plan['steps'][index]['windowsReleaseWait'] = {'timeoutSeconds': 45}
            with self.subTest(index=index), self.assertRaises(AssertionError): plan_api.validate_plan(plan)
        for value in [None, False, 1]:
            plan = copy.deepcopy(original); plan['steps'][12]['windowsHoldUntilExpect'] = value
            with self.subTest(held=value), self.assertRaises(AssertionError): plan_api.validate_plan(plan)

    def test_pause_observation_opt_in_keeps_a_separate_finite_cap(self):
        original = self.plan('kart-royale')
        self.assertEqual(original['windowsPauseWait'], {'timeoutSeconds': 45})
        for value in [None, True, {}, {'timeoutSeconds': True}, {'timeoutSeconds': 30},
                      {'timeoutSeconds': 61}, {'timeoutSeconds': 45.0}, {'timeoutSeconds': float('inf')},
                      {'timeoutSeconds': 45, 'skipModel': True}]:
            plan = copy.deepcopy(original); plan['windowsPauseWait'] = value
            with self.subTest(value=value), self.assertRaises(AssertionError): plan_api.validate_plan(plan)
        plan = copy.deepcopy(original); plan['pauseStablePaths'] = []
        with self.assertRaises(AssertionError): plan_api.validate_plan(plan)
        for game in ['backroad-rally', 'turbo-kart-rush']:
            plan = self.plan(game)
            self.assertNotIn('windowsPauseWait', plan)
            self.assertTrue(all('windowsReleaseWait' not in step for step in plan['steps']))


class BoundedObservation(unittest.TestCase):
    def fixture(self, startup=False, *, interval=.3, semantic=True, target=True, frozen=False,
                mutate=None, missing_ack=False, duplicate_ack=False, wrong_ack_connection=False):
        subject = object.__new__(verify.WindowsCheck)
        subject.report = {'wire': [], 'observerErrors': [], 'snapshots': []}
        subject.held = set()
        subject.renderers = ['webgl2']
        clock = [0.0]
        counters = {k: 0 for k in verify.base.KEYS}
        native = {k: False for k in verify.base.KEYS}
        cached = dict(native)
        frames = [1]
        consumed = [0]
        started = [False]
        matched_at = []
        releases = []
        last_fresh = [-1]
        model = {'phase': 'menu' if startup else 'racing', 'speed': 0.0, 'progress': 0.0}
        subject.client = types.SimpleNamespace(identity='fixture-original-sdk', seq=10, lock=threading.RLock())
        key = 'A' if startup else 'UP'
        step = {'name': 'synthetic bounded observation', 'keys': [key], 'holdMs': 180 if startup else 2500,
                'timeoutSeconds': 60, 'expect': [{'path': 'gameplay.phase', 'op': 'eq', 'value': 'racing'}] if startup else
                [{'path': 'gameplay.speed', 'op': 'gt', 'value': 2}, {'path': 'gameplay.progress', 'op': 'changed'}]}
        step.update({'windowsStartupWait': {'timeoutSeconds': 600}} if startup else {'windowsHoldUntilExpect': True})

        def button(k, action, duration=None):
            subject.client.seq += 1
            seq = subject.client.seq
            if action == 'down':
                counters[k] += 1
                native[k] = True
            else:
                native[k] = False
                releases.append(clock[0])
            at = verify.base.datetime.datetime.fromtimestamp(clock[0], verify.base.datetime.timezone.utc).isoformat()
            subject.report['wire'].append({'at': at, 'connection': 1, 'direction': 'sdk-to-game', 'message':
                {'type': 'button', 'key': k, 'action': action, 'pressed': action == 'down', 'controller_id': subject.client.identity, 'seq': seq}})
            if not missing_ack:
                ack = {'at': at, 'connection': 2 if wrong_ack_connection else 1, 'direction': 'game-to-sdk', 'message': {'type': 'ack', 'seq': seq}}
                subject.report['wire'].append(ack)
                if duplicate_ack:
                    subject.report['wire'].append(copy.deepcopy(ack))

        subject.client.button = button

        def read():
            n = 1 if frozen else int(clock[0] / interval) + 1
            if n != last_fresh[0]:
                frames[0] = n
                last_fresh[0] = n
                # The native button/counter precedes the game's next input poll.
                cached.update(native if semantic else {k: False for k in verify.base.KEYS})
                if startup and counters['A']:
                    started[0] = True
                    consumed[0] += 1
                    model['phase'] = 'racing' if target and consumed[0] >= 88 else 'countdown'
                if not startup and cached['UP']:
                    consumed[0] += 1
                    if target and consumed[0] >= 3:
                        model.update(speed=3.0, progress=.2)
                        matched_at.append(clock[0])
                if not startup and releases:
                    model['speed'] = 0.0  # Natural coasting cannot erase the held proof.
            player = {'connected': True, 'controllerId': subject.client.identity, 'session': 'original-session', 'cancelSeq': 3,
                      'buttons': dict(native), 'buttonCounters': dict(counters)}
            game = {'game': 'fixture', 'stage': 'playing' if not startup or started[0] else 'menu', 'paused': False,
                    'renderer': 'webgl2', 'frames': frames[0], 'gameplay': dict(model),
                    'controller': {'connected': True, 'cancelled': False, 'pollCount': frames[0], 'buttons': dict(cached), 'players': [copy.deepcopy(player)]}}
            state = {'timestamp': clock[0] + 1, 'documentEpoch': 1, 'document': {'epoch': 1}, 'ready': True, 'active': True,
                     'server': {'wifiController': {'inputEnabled': True}}, 'input': {'players': [player]}, 'game': game}
            if mutate and clock[0] >= .4:
                mutate(state)
            subject.last = state
            return state

        subject.read = read
        before = read()

        def run():
            with patch.object(verify.time, 'monotonic', side_effect=lambda: clock[0]), patch.object(verify.time, 'sleep', side_effect=lambda value: clock.__setitem__(0, clock[0] + value)):
                return subject.bounded_gameplay_step(step, before)
        return types.SimpleNamespace(subject=subject, step=step, before=before, run=run, clock=clock, releases=releases, matched_at=matched_at)

    def test_slow_original_countdown_runs_beyond_240_and_finishes_with_released_fresh_frames(self):
        f = self.fixture(True, interval=5.9)
        result = f.run()
        record = f.subject.report['boundedGameplayObservations'][0]
        self.assertGreater(record['elapsedSeconds'], 500)
        self.assertLess(record['elapsedSeconds'], 600)
        self.assertEqual(record['status'], 'passed')
        self.assertEqual(len(f.releases), 1)
        self.assertLess(f.releases[0], .1)
        self.assertGreaterEqual(result['releasedFreshFrames'], 2)
        self.assertTrue(any(row['phase'] == 'countdown' for row in record['samples']))
        self.assertEqual(record['samples'][-1]['phase'], 'racing')

    def test_throttle_waits_for_semantic_consumption_and_first_expectation_then_releases(self):
        f = self.fixture(interval=1.38)
        result = f.run()
        record = f.subject.report['boundedGameplayObservations'][0]
        self.assertTrue(record['semanticHeldObserved'])
        self.assertGreater(record['releasedAtSeconds'], 2.5)
        self.assertEqual(f.releases[0], f.matched_at[0])
        self.assertEqual(result['firstExpected']['gameplay']['speed'], 3)
        self.assertEqual(result['after']['gameplay']['speed'], 0)
        self.assertEqual(result['releasedFreshFrames'], 2)
        self.assertEqual(record['sdkMessagesThroughRelease'], record['matchingAcksThroughRelease'])

    def test_position_vector_is_evaluated_by_real_held_observer_without_runner_change(self):
        for moved in [True, False]:
            def vector(state):
                progress = state['game']['gameplay']['progress'] if moved else 0.0
                state['game']['gameplay']['position'] = [progress, 0.0, 0.0]
            fixture = self.fixture(interval=1.38, mutate=vector)
            fixture.before['game']['gameplay']['position'] = [0.0, 0.0, 0.0]
            fixture.step['expect'][1] = {'path':'gameplay.position','op':'changed'}
            fixture.step['timeoutSeconds'] = 10
            with self.subTest(moved=moved):
                if moved:
                    result = fixture.run()
                    self.assertEqual(result['firstExpected']['gameplay']['position'], [.2, 0.0, 0.0])
                    self.assertEqual(result['firstExpected']['gameplay']['speed'], 3.0)
                    self.assertEqual(fixture.releases[0], fixture.matched_at[0])
                    self.assertEqual(result['releasedFreshFrames'], 2)
                    record = fixture.subject.report['boundedGameplayObservations'][0]
                    self.assertTrue(record['semanticHeldObserved'])
                    self.assertEqual(record['sdkMessagesThroughRelease'], record['matchingAcksThroughRelease'])
                else:
                    with self.assertRaises(AssertionError): fixture.run()
                    self.assertNotIn('firstMatchingHeldState', fixture.subject.report['boundedGameplayObservations'][0])
                self.assertEqual(len(fixture.releases), 1)
                self.assertFalse(fixture.subject.held)

    def test_raw_counter_without_semantic_input_cannot_prove_throttle(self):
        f = self.fixture(semantic=False)
        f.step['timeoutSeconds'] = 1
        with self.assertRaises(AssertionError):
            f.run()
        self.assertFalse(f.subject.report['boundedGameplayObservations'][0]['semanticHeldObserved'])
        self.assertEqual(len(f.releases), 1)
        self.assertFalse(f.subject.held)

    def test_never_matching_or_stalled_frames_times_out_and_releases(self):
        for update in [{'target': False}, {'frozen': True}]:
            f = self.fixture(**update)
            f.step['timeoutSeconds'] = 1
            with self.subTest(update=update), self.assertRaises(AssertionError):
                f.run()
            self.assertEqual(len(f.releases), 1)
            self.assertFalse(f.subject.held)
            self.assertLessEqual(f.clock[0], 1.001)

    def test_extended_startup_rejects_no_progress_long_before_600(self):
        f = self.fixture(True, frozen=True)
        with self.assertRaisesRegex(AssertionError, 'No fresh game frame'):
            f.run()
        self.assertLess(f.clock[0], 61)
        self.assertFalse(f.subject.held)

    def test_identity_cancel_reload_focus_and_unrequested_buttons_cannot_certify(self):
        mutations = [
            lambda s: s['input']['players'][0].update(session='replacement'),
            lambda s: s['input']['players'][0].update(cancelSeq=4),
            lambda s: s.update(documentEpoch=2),
            lambda s: s.update(active=False),
            lambda s: s['game']['controller']['players'][0].update(controllerId='other'),
            lambda s: s['input']['players'][0]['buttons'].update(LEFT=True),
            lambda s: s['game']['controller']['buttons'].update(LEFT=True),
        ]
        for mutate in mutations:
            f = self.fixture(mutate=mutate)
            with self.subTest(mutate=mutate), self.assertRaises(AssertionError):
                f.run()
            self.assertFalse(f.subject.held)

    def test_missing_duplicate_or_wrong_connection_acks_cannot_pass(self):
        for update in [{'missing_ack': True}, {'duplicate_ack': True}, {'wrong_ack_connection': True}]:
            f = self.fixture(**update)
            f.step['timeoutSeconds'] = 2
            with self.subTest(update=update), self.assertRaises(AssertionError):
                f.run()
            self.assertFalse(f.subject.held)

    def test_already_satisfied_expectation_is_rejected_before_sdk_input(self):
        f = self.fixture(True)
        f.before['game']['gameplay']['phase'] = 'racing'
        with self.assertRaisesRegex(AssertionError, 'already satisfied'):
            f.run()
        self.assertEqual(f.subject.report['wire'], [])

    def test_late_snapshot_cannot_extend_the_hard_deadline(self):
        f = self.fixture()
        original = f.subject.read
        def delayed():
            f.clock[0] = 61
            return original()
        f.subject.read = delayed
        with self.assertRaisesRegex(AssertionError, 'after gameplay observation deadline'):
            f.run()
        self.assertFalse(f.subject.held)

    def test_stalled_reader_is_bounded_without_waiting_for_its_return(self):
        subject = object.__new__(verify.WindowsCheck)
        gate = threading.Event()
        subject.read = lambda: gate.wait(1)
        started = time.monotonic()
        try:
            with self.assertRaisesRegex(AssertionError, 'Snapshot exceeded'):
                subject.deadline_snapshot(started + .03)
            self.assertLess(time.monotonic() - started, .3)
        finally:
            gate.set()

    def royale_cadence(self, *, opt_in=True, never_release_semantics=False):
        """Synthetic timing schedule; the final66.1s frame was NOT in original CI."""
        f = self.fixture(target=False)
        if opt_in: f.step['windowsReleaseWait'] = {'timeoutSeconds': 45}
        f.step['expect'][0]['value'] = 1
        f.step['expect'][1] = {'path': 'gameplay.position', 'op': 'changed'}
        f.before['game']['gameplay']['position'] = [0, 0, 0]
        schedule = iter([7.391, 14.484, 21.688, 29.297, 36.406, 43.547, 51.25, 58.656, 66.1])
        original = f.subject.read
        def read():
            f.clock[0] = max(f.clock[0], next(schedule, f.clock[0] + 7.5))
            state = original(); game = state['game']
            game['controller']['buttons']['UP'] = f.clock[0] >= 21.688 and (never_release_semantics or f.clock[0] < 51.25)
            game['gameplay'].update(position=[.2, 0, 0] if f.clock[0] >= 29.297 else [0, 0, 0],
                                    speed=1.488 if f.clock[0] >= 29.297 else .744 if f.clock[0] >= 21.688 else 0)
            return state
        f.subject.read = read
        return f

    def test_original_slow_schedule_only_completes_after_extra_synthetic_release_frame(self):
        old = self.royale_cadence(opt_in=False)
        with self.assertRaisesRegex(AssertionError, 'deadline'): old.run()
        self.assertEqual(old.releases, [29.297])
        f = self.royale_cadence(); result = f.run()
        record = f.subject.report['boundedGameplayObservations'][0]
        self.assertEqual(f.releases, [29.297])
        self.assertEqual(record['actionTimeoutSeconds'], 60)
        self.assertAlmostEqual(record['releaseDeadlineAtSeconds'], 74.297)
        self.assertAlmostEqual(record['elapsedSeconds'], 66.1)
        self.assertEqual(record['phase'], 'complete')
        self.assertEqual(result['releasedFreshFrames'], 2)
        self.assertEqual(record['sdkMessagesThroughRelease'], record['matchingAcksThroughRelease'])

    def test_release_opt_in_does_not_extend_unmatched_or_unconsumed_action(self):
        for update in [{'target': False}, {'semantic': False}, {'frozen': True}]:
            f = self.fixture(**update); f.step['windowsReleaseWait'] = {'timeoutSeconds': 45}
            with self.subTest(update=update), self.assertRaises(AssertionError): f.run()
            self.assertLessEqual(f.clock[0], 60.001)
            self.assertEqual(len(f.releases), 1)
            self.assertFalse(f.subject.held)
            self.assertEqual(f.subject.report['boundedGameplayObservations'][0]['phase'], 'action')
            self.assertNotIn('releaseDeadlineAtSeconds', f.subject.report['boundedGameplayObservations'][0])

    def test_late_action_snapshot_and_late_sdk_release_cannot_open_new_budget(self):
        f = self.royale_cadence(); original = f.subject.read
        def late_read():
            state = original(); f.clock[0] = 60
            state['game']['gameplay'].update(speed=3,position=[.2,0,0])
            state['game']['controller']['buttons']['UP']=True
            return state
        f.subject.read = late_read
        with self.assertRaisesRegex(AssertionError, 'deadline'): f.run()
        self.assertNotIn('firstMatchingHeldState', f.subject.report['boundedGameplayObservations'][0])
        f = self.royale_cadence(); button = f.subject.client.button
        def late_release(key, action, duration=None):
            button(key, action, duration)
            if action == 'tap': f.clock[0] = 60
        f.subject.client.button = late_release
        with self.assertRaisesRegex(AssertionError, 'Release completed after action deadline'): f.run()
        self.assertEqual(f.subject.report['boundedGameplayObservations'][0]['phase'], 'action')
        self.assertNotIn('releaseDeadlineAtSeconds', f.subject.report['boundedGameplayObservations'][0])
        self.assertFalse(f.subject.held)

    def test_release_failure_does_not_start_observation_or_certify(self):
        f = self.royale_cadence(); button = f.subject.client.button; attempts = []
        def fail_once(key, action, duration=None):
            if action == 'tap':
                attempts.append(action)
                if len(attempts) == 1: raise OSError('synthetic SDK release failure')
            button(key, action, duration)
        f.subject.client.button = fail_once
        with self.assertRaisesRegex(OSError, 'SDK release failure'): f.run()
        self.assertEqual(len(attempts), 2)  # Original finally cleanup retries the failed release.
        self.assertFalse(f.subject.held)
        self.assertEqual(f.subject.report['boundedGameplayObservations'][0]['phase'], 'action')

    def test_release_deadline_never_accepts_stale_or_still_held_semantic_input(self):
        f = self.royale_cadence(never_release_semantics=True)
        with self.assertRaisesRegex(AssertionError, 'deadline'): f.run()
        record = f.subject.report['boundedGameplayObservations'][0]
        self.assertEqual(f.releases, [29.297])
        self.assertEqual(record['releasedFreshFrames'], 0)
        f = self.royale_cadence(); original = f.subject.read; last = []
        def stale_after_one_followup():
            if f.clock[0] >= 58.656 and last:
                f.clock[0] += 1
                return copy.deepcopy(last[0])
            state = original(); last[:] = [state]; return state
        f.subject.read = stale_after_one_followup
        with self.assertRaisesRegex(AssertionError, 'deadline'): f.run()
        self.assertEqual(f.subject.report['boundedGameplayObservations'][0]['releasedFreshFrames'], 1)
        self.assertFalse(f.subject.held)

    def test_release_phase_keeps_identity_counter_input_and_ack_guards(self):
        mutations = [
            lambda s: s['input']['players'][0].update(session='other'),
            lambda s: s['input']['players'][0].update(cancelSeq=9),
            lambda s: s['input']['players'][0]['buttonCounters'].update(UP=2),
            lambda s: s.update(documentEpoch=2),
            lambda s: s.update(active=False),
            lambda s: s['game'].update(paused=True),
            lambda s: s['input']['players'][0]['buttons'].update(LEFT=True),
            lambda s: s['game']['controller']['buttons'].update(LEFT=True),
        ]
        for mutate in mutations:
            f = self.royale_cadence(); original = f.subject.read
            def read():
                state = original()
                if f.releases: mutate(state)
                return state
            f.subject.read = read
            with self.subTest(mutate=mutate), self.assertRaises(AssertionError): f.run()
            self.assertFalse(f.subject.held)
        for update in [{'missing_ack': True}, {'duplicate_ack': True}, {'wrong_ack_connection': True}]:
            f = self.fixture(**update); f.step['windowsReleaseWait'] = {'timeoutSeconds': 1}
            with self.subTest(update=update), self.assertRaises(AssertionError): f.run()
            self.assertFalse(f.subject.held)


if __name__ == '__main__':
    unittest.main()
