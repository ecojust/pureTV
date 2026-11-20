#!/usr/bin/env python3
"""Synthetic timing boundaries; native lifecycle evidence still requires Windows."""
import copy,importlib.util,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[4]
spec=importlib.util.spec_from_file_location('windows_verify',ROOT/'joystick-games/tools/windows-verify.py');verify=importlib.util.module_from_spec(spec);spec.loader.exec_module(verify)
class PauseTiming(unittest.TestCase):
    def observe(self,background,*,polling=True,native_fresh=True,active=None,input_enabled=None,held=False,model_changes=False,paused=True,native_interval=None,model_change_at=None,read_delay=0):
        subject=object.__new__(verify.WindowsCheck);subject.plan={'pauseStablePaths':['gameplay.tick']};subject.report={};clock=[0.0];reads=[0]
        def read():
            clock[0]+=read_delay
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
        self.assertGreaterEqual(result['realSeconds'],8);self.assertLess(result['realSeconds'],30);self.assertEqual(result['samples'],4)
        record=result['_fixtureObservation'];self.assertEqual(record['status'],'passed');self.assertEqual(record['timeoutSeconds'],30)
        self.assertEqual(sum(row['freshNativeSnapshot'] for row in record['samples']),4)
        self.assertTrue(all(row['paths']=={'gameplay.tick':7} for row in record['samples']))
    def test_fewer_than_four_samples_within_thirty_seconds_still_fails(self):
        with self.assertRaisesRegex(AssertionError,'Insufficient fresh'):self.observe(False,native_interval=8)
    def test_model_motion_late_in_extended_window_remains_a_failure(self):
        with self.assertRaisesRegex(AssertionError,'Gameplay progressed'):self.observe(False,native_interval=7,model_change_at=20)
    def test_four_point_two_second_callbacks_need_four_fresh_observations(self):
        result=self.observe(False,native_interval=4.2)
        self.assertEqual(result['samples'],4);self.assertGreaterEqual(result['realSeconds'],16.8);self.assertLess(result['realSeconds'],30)
        self.assertEqual(result['_fixtureObservation']['uniqueNativeSnapshots'],4)
        self.assertGreater(result['controllerFramesAdvanced'],0)
    def test_late_read_cannot_pass_after_the_thirty_second_deadline(self):
        with self.assertRaisesRegex(AssertionError,'Pause snapshot arrived after observation deadline'):self.observe(False,read_delay=31)

class BoundedPauseTiming(unittest.TestCase):
    def fixture(self, *, opt_in=True, background=False, polling=True, schedule=None, mutate=None):
        subject=object.__new__(verify.WindowsCheck)
        values={'time':1.8,'position':[1,2,3],'speed':1.49,'lap':0,'driftCharge':0,'boostTime':0}
        subject.plan={'pauseStablePaths':['gameplay.'+key for key in values]};subject.report={}
        if opt_in:subject.plan['windowsPauseWait']={'timeoutSeconds':45}
        # Only the first three fresh times are measured in original CI. 30.4
        # is an explicit synthetic fourth frame, never an original pass claim.
        times=list([0,7.672,15.672,22.86,30.4] if schedule is None else schedule)
        clock=[0.0];reads=[0];latest=[0]
        def read():
            if reads[0]<len(times):
                latest[0]=reads[0];clock[0]=max(clock[0],times[reads[0]])
            else:clock[0]+=1
            reads[0]+=1;count=latest[0]
            state={'timestamp':100+count,'documentEpoch':1,'document':{'epoch':1},'ready':True,
                   'active':not background,'server':{'wifiController':{'inputEnabled':not background}},
                   'input':{'players':[{'connected':True,'buttons':{k:False for k in verify.base.KEYS}}]},
                   'game':{'stage':'paused','paused':True,'renderer':'webgl2','frames':100+count,
                           'controller':{'pollCount':100+count if polling else 100},'gameplay':copy.deepcopy(values)}}
            if mutate and count:mutate(state)
            subject.last=state;return state
        def until(predicate,label):
            for _ in range(100):
                state=read()
                if predicate(state):return state
            raise AssertionError(label+' timed out in synthetic fixture')
        subject.read=read;subject.until=until
        def run():
            with patch.object(verify.time,'monotonic',side_effect=lambda:clock[0]),patch.object(verify.time,'sleep',side_effect=lambda n:clock.__setitem__(0,clock[0]+n)):
                return subject.pause_stability(background)
        return subject,clock,run

    def test_fourth_synthetic_frame_after_thirty_requires_explicit_opt_in(self):
        subject,clock,run=self.fixture(opt_in=False)
        with self.assertRaisesRegex(AssertionError,'deadline'):run()
        subject,clock,run=self.fixture();result=run()
        self.assertEqual(result['samples'],4);self.assertAlmostEqual(result['realSeconds'],30.4)
        observation=subject.report['pauseObservations'][0]
        self.assertEqual(observation['timeoutSeconds'],45);self.assertEqual(observation['status'],'passed')
        self.assertEqual(sum(row['freshNativeSnapshot'] for row in observation['samples']),4)
        self.assertEqual(len(result['paths']),6);self.assertEqual(result['controllerFramesAdvanced'],4)

    def test_three_fresh_or_late_fourth_never_satisfies_bounded_pause(self):
        for schedule in [[0,7.672,15.672,22.86],[0,7.672,15.672,22.86,45]]:
            subject,clock,run=self.fixture(schedule=schedule)
            with self.subTest(schedule=schedule),self.assertRaisesRegex(AssertionError,'deadline|Insufficient fresh'):run()
            observation=subject.report['pauseObservations'][0]
            self.assertEqual(observation['status'],'failed')
            self.assertEqual(sum(row['freshNativeSnapshot'] for row in observation['samples']),3)

    def test_each_original_pause_model_field_must_stay_frozen(self):
        for name in ['time','position','speed','lap','driftCharge','boostTime']:
            def mutate(state):state['game']['gameplay'][name]=[8,9,10] if name=='position' else 99
            subject,clock,run=self.fixture(mutate=mutate)
            with self.subTest(field=name),self.assertRaisesRegex(AssertionError,'Gameplay progressed'):run()
            self.assertEqual(subject.report['pauseObservations'][0]['status'],'failed')

    def test_final_foreground_poll_requirement_cannot_take_an_extra_until_budget(self):
        subject,clock,run=self.fixture(polling=False)
        with self.assertRaisesRegex(AssertionError,'deadline|Insufficient fresh'):run()
        self.assertLess(clock[0],46.1)
        self.assertEqual(subject.report['pauseObservations'][0]['status'],'failed')
        subject,clock,run=self.fixture(background=True,polling=False);result=run()
        self.assertEqual(result['samples'],4);self.assertFalse(result['controllerPollingRequired'])

    def test_pause_foreground_background_and_manual_resume_guards_remain(self):
        for mutate in [lambda s:s.update(active=False),
                       lambda s:s['server']['wifiController'].update(inputEnabled=False),
                       lambda s:s['game'].update(stage='playing',paused=False)]:
            subject,clock,run=self.fixture(mutate=mutate)
            with self.subTest(mutate=mutate),self.assertRaises(AssertionError):run()
        for mutate in [lambda s:s.update(active=True),
                       lambda s:s['server']['wifiController'].update(inputEnabled=True),
                       lambda s:s['input']['players'][0]['buttons'].update(UP=True)]:
            subject,clock,run=self.fixture(background=True,mutate=mutate)
            with self.subTest(mutate=mutate),self.assertRaises(AssertionError):run()

    def test_baseline_read_is_inside_the_same_hard_pause_budget(self):
        subject,clock,run=self.fixture(schedule=[45])
        with self.assertRaisesRegex(AssertionError,'deadline'):run()
        self.assertEqual(subject.report['pauseObservations'][0]['phase'],'baseline')

    def test_four_rapid_snapshots_do_not_remove_minimum_pause_observation(self):
        subject,clock,run=self.fixture(schedule=[0,.1,.2,.3,.4]);result=run()
        self.assertEqual(result['samples'],4)
        self.assertGreaterEqual(result['realSeconds'],.5)

    def test_late_baseline_does_not_count_as_half_second_of_frozen_observation(self):
        subject,clock,run=self.fixture(schedule=[44.6,44.7,44.8,44.9,44.95])
        with self.assertRaisesRegex(AssertionError,'deadline|Insufficient fresh'):run()
        observation=subject.report['pauseObservations'][0]
        self.assertEqual(observation['status'],'failed')
        self.assertEqual(sum(row['freshNativeSnapshot'] for row in observation['samples']),4)
        self.assertAlmostEqual(observation['baselineElapsedSeconds'],44.6)

class DocumentFreshness(unittest.TestCase):
    def setUp(self):
        self.subject=object.__new__(verify.WindowsCheck);self.subject.renderers=['webgl2']
    def state(self,epoch=1,polls=100,timestamp=1):
        return {'timestamp':timestamp,'documentEpoch':epoch,'document':{'epoch':epoch},'ready':True,'game':{'stage':'menu','paused':False,'renderer':'webgl2','webglVersion':'WebGL 2.0','frames':polls,'controller':{'pollCount':polls},'gameplay':{'menu':'title'}}}
    def test_same_document_still_requires_native_timestamp_and_poll_growth(self):
        before=self.state();self.assertTrue(self.subject.fresh(self.state(polls=101,timestamp=2),before,True))
        self.assertFalse(self.subject.fresh(self.state(polls=101),before,True))
        self.assertFalse(self.subject.fresh(self.state(timestamp=2),before,True))
        self.assertTrue(self.subject.fresh(self.state(timestamp=2),before))
    def test_reload_accepts_new_rendered_document_without_comparing_old_poll_counter(self):
        before=self.state();after=self.state(epoch=2,polls=2,timestamp=2);original=copy.deepcopy((before,after))
        self.assertTrue(self.subject.fresh(after,before,True));self.assertEqual((before,after),original)
    def test_native_epoch_cannot_relabel_old_dom_snapshot(self):
        before=self.state();after=self.state(polls=101,timestamp=2);after['documentEpoch']=2
        self.assertFalse(self.subject.fresh(after,before,True));self.assertFalse(self.subject.fresh(after,before))
        before['documentEpoch']=2;after=self.state(epoch=2,polls=102,timestamp=3)
        self.assertFalse(self.subject.fresh(after,before,True))
    def test_missing_or_malformed_identity_is_not_legacy_compatibility(self):
        before=self.state()
        for value in [None,0,-1,True,1.0,'1',9007199254740992]:
            after=self.state(polls=101,timestamp=2);after['documentEpoch']=after['document']['epoch']=value
            with self.subTest(value=value):self.assertFalse(self.subject.fresh(after,before,True))
        for which in ['native','document','both']:
            after=self.state(polls=101,timestamp=2)
            if which in ['native','both']:after.pop('documentEpoch')
            if which in ['document','both']:after['document'].pop('epoch')
            with self.subTest(which=which):self.assertFalse(self.subject.fresh(after,before,True));self.assertFalse(self.subject.fresh(before,after,True))
        for document in [None,[],1]:
            after=self.state(polls=101,timestamp=2);after['document']=document
            with self.subTest(document=document):self.assertFalse(self.subject.fresh(after,before,True))
    def test_epoch_regression_is_never_fresh(self):
        self.assertFalse(self.subject.fresh(self.state(1,200,3),self.state(2,100,2),True))
    def test_temporary_absent_game_or_controller_remains_pending(self):
        before=self.state();after=self.state(polls=101,timestamp=2)
        for side in ['before','after']:
            for field in ['game','controller']:
                left=copy.deepcopy(before);right=copy.deepcopy(after);target=left if side=='before' else right
                if field=='game':target['game']=None
                else:target['game']['controller']=None
                with self.subTest(side=side,field=field):self.assertFalse(self.subject.fresh(right,left,True))
    def test_reload_requires_real_initialized_renderer_and_polls(self):
        before=self.state()
        for update in [{'ready':False},{'lastJavaScriptError':'failure'},{'diagnosticError':'failure'}]:
            after=self.state(2,2,2);after.update(update)
            with self.subTest(update=update):self.assertFalse(self.subject.fresh(after,before,True))
        for update in [{'stage':'boot'},{'renderer':'canvas2d'},{'webglVersion':None},{'frames':0},{'controller':{'pollCount':0}},{'errors':['unrelated failure']},{'stage':'error'},{'paused':True}]:
            after=self.state(2,2,2);after['game'].update(update)
            with self.subTest(update=update):self.assertFalse(self.subject.fresh(after,before,True))
    def test_bad_or_stale_timestamp_is_rejected_after_reload(self):
        for timestamp in [0,1,None,True,float('nan'),float('inf'),'2']:
            with self.subTest(timestamp=timestamp):self.assertFalse(self.subject.fresh(self.state(2,2,timestamp),self.state(),True))
    def test_query_page_can_render_race_directly_but_countdown_never_satisfies_running_expectation(self):
        before=self.state();after=self.state(2,2,2);after['game'].update(stage='playing',gameplay={'phase':'warmup'})
        expectation=[{'path':'stage','op':'eq','value':'playing'},{'path':'gameplay.phase','op':'eq','value':'running'}]
        self.assertTrue(self.subject.fresh(after,before,True));self.assertFalse(verify.plan_api.matches(expectation,after['game'],before['game']))
        after['game']['gameplay']['phase']='countdown'
        self.assertTrue(self.subject.fresh(after,before,True));self.assertFalse(verify.plan_api.matches(expectation,after['game'],before['game']))
        after['game']['gameplay']['phase']='running'
        self.assertTrue(self.subject.fresh(after,before,True));self.assertTrue(verify.plan_api.matches(expectation,after['game'],before['game']))
    def test_direct_race_still_requires_actual_renderer_identity_frames_and_clean_epoch(self):
        before=self.state();original=self.state(2,2,2);original['game'].update(stage='playing',gameplay={'phase':'running'})
        for update in [{'renderer':'canvas2d'},{'webglVersion':'WebGL 1.0'},{'frames':1},{'controller':None},{'controller':{'pollCount':1}},{'controller':{'pollCount':True}},{'controller':{'pollCount':float('inf')}},{'errors':['runtime failure']},{'error':'runtime failure'},{'paused':True},{'stage':'boot'},{'gameplay':None}]:
            after=copy.deepcopy(original);after['game'].update(update)
            with self.subTest(update=update):self.assertFalse(self.subject.fresh(after,before,True))
        for update in [{'ready':False},{'lastJavaScriptError':'failure'},{'diagnosticError':'failure'},{'document':{'epoch':1}},{'documentEpoch':1},{'timestamp':1}]:
            after=copy.deepcopy(original);after.update(update)
            with self.subTest(update=update):self.assertFalse(self.subject.fresh(after,before,True))
    def test_legacy_hosts_keep_old_counter_rule_only_when_both_omit_identity(self):
        before=self.state();after=self.state(polls=101,timestamp=2)
        for state in [before,after]:state.pop('documentEpoch');state['document'].pop('epoch')
        self.assertTrue(self.subject.fresh(after,before,True));after['game']['controller']['pollCount']=2
        self.assertFalse(self.subject.fresh(after,before,True));self.assertTrue(self.subject.fresh(after,before))
# Keep the opt-in gameplay boundaries in the existing CI entrypoint. The new
# file is also selected by the shared Windows source closure.
gameplay_spec=importlib.util.spec_from_file_location('windows_gameplay_boundaries',Path(__file__).with_name('gameplay.test.py'))
gameplay_tests=importlib.util.module_from_spec(gameplay_spec);gameplay_spec.loader.exec_module(gameplay_tests)
PlanBoundaries=gameplay_tests.PlanBoundaries
BoundedObservation=gameplay_tests.BoundedObservation
if __name__=='__main__':unittest.main()
