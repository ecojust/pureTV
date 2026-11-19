#!/usr/bin/env python3
"""Synthetic timing boundaries; native lifecycle evidence still requires Windows."""
import importlib.util,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[4]
spec=importlib.util.spec_from_file_location('windows_verify',ROOT/'joystick-games/tools/windows-verify.py');verify=importlib.util.module_from_spec(spec);spec.loader.exec_module(verify)
class PauseTiming(unittest.TestCase):
    def observe(self,background,*,polling=True,native_fresh=True,active=None,input_enabled=None,held=False,model_changes=False,paused=True,native_interval=None,model_change_at=None):
        subject=object.__new__(verify.WindowsCheck);subject.plan={'pauseStablePaths':['gameplay.tick']};subject.report={};clock=[0.0];reads=[0]
        def read():
            reads[0]+=1
            count=reads[0] if native_interval is None else int(clock[0]/native_interval)+1
            tick=reads[0] if model_changes else 8 if model_change_at is not None and clock[0]>=model_change_at else 7
            return {'timestamp':count if native_fresh else 1,'active':not background if active is None else active,'server':{'wifiController':{'inputEnabled':not background if input_enabled is None else input_enabled}},'input':{'players':[{'connected':True,'buttons':{'A':held}}]},'game':{'stage':'paused' if paused else 'playing','paused':paused,'controller':{'pollCount':count if polling else 10},'gameplay':{'tick':tick}}}
        def until(predicate,label):
            for _ in range(100):
                value=read()
                if predicate(value):return value
            raise AssertionError(label+' timed out in synthetic boundary fixture')
        subject.read=read;subject.until=until
        def sleep(value):clock[0]+=value
        with patch.object(verify.time,'monotonic',side_effect=lambda:clock[0]),patch.object(verify.time,'sleep',side_effect=sleep):
            result=subject.pause_stability(background=background);result['_fixtureObservation']=subject.report['pauseObservations'][-1];return result
    def test_minimized_raf_can_stop_but_new_native_snapshots_and_frozen_model_are_required(self):
        result=self.observe(True,polling=False);self.assertFalse(result['controllerPollingRequired']);self.assertEqual(result['controllerFramesAdvanced'],0);self.assertGreaterEqual(result['samples'],4);self.assertGreaterEqual(result['realSeconds'],.5)
    def test_foreground_pause_still_requires_actual_poll_growth(self):
        with self.assertRaisesRegex(AssertionError,'Controller keeps polling'):self.observe(False,polling=False)
        result=self.observe(False);self.assertTrue(result['controllerPollingRequired']);self.assertGreater(result['controllerFramesAdvanced'],0)
    def test_stale_native_snapshot_is_never_accepted_as_background_stability(self):
        with self.assertRaisesRegex(AssertionError,'Insufficient fresh'):self.observe(True,polling=False,native_fresh=False)
    def test_background_active_input_or_held_button_is_rejected(self):
        for update in ({'active':True},{'input_enabled':True},{'held':True}):
            with self.subTest(update=update),self.assertRaises(AssertionError):self.observe(True,polling=False,**update)
    def test_background_model_motion_or_automatic_resume_is_rejected(self):
        with self.assertRaisesRegex(AssertionError,'Gameplay progressed'):self.observe(True,polling=False,model_changes=True)
        with self.assertRaises(AssertionError):self.observe(True,polling=False,paused=False)
    def test_slow_native_callbacks_still_require_four_distinct_frozen_snapshots(self):
        result=self.observe(False,native_interval=2)
        self.assertGreaterEqual(result['realSeconds'],8);self.assertLess(result['realSeconds'],15);self.assertEqual(result['samples'],4)
        record=result['_fixtureObservation'];self.assertEqual(record['status'],'passed');self.assertEqual(record['timeoutSeconds'],15)
        self.assertEqual(sum(row['freshNativeSnapshot'] for row in record['samples']),4)
        self.assertTrue(all(row['paths']=={'gameplay.tick':7} for row in record['samples']))
    def test_fewer_than_four_samples_within_fifteen_seconds_still_fails(self):
        with self.assertRaisesRegex(AssertionError,'Insufficient fresh'):self.observe(False,native_interval=4)
    def test_model_motion_late_in_extended_window_remains_a_failure(self):
        with self.assertRaisesRegex(AssertionError,'Gameplay progressed'):self.observe(False,native_interval=3.5,model_change_at=12)
if __name__=='__main__':unittest.main()
