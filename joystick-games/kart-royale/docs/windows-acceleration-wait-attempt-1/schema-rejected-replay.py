#!/usr/bin/env python3
"""Replay immutable failed observations through the real held-observation gate.

The command adapter is inert: no SDK socket, native process, model changes, clock
patches or synthetic successful game state. Exhausted original observations fail.
"""
from pathlib import Path
import copy,hashlib,importlib.util,json,subprocess,types,unittest
ROOT=Path(__file__).resolve().parents[4]
HERE=Path(__file__).resolve().parent
SOURCE='232d544079a472aa0ffb259c1bc73c692b94504d'
spec=importlib.util.spec_from_file_location('royale_real_windows_observer',ROOT/'joystick-games/tools/windows-verify.py')
verify=importlib.util.module_from_spec(spec);spec.loader.exec_module(verify)
PLAN=ROOT/'joystick-games/kart-royale/qa-plan.json'
ORIGINAL=HERE.parent/'windows-44628818020-analysis/original/joystick-windows-evidence-kart-royale'
class OriginalEvidenceExhausted(Exception):pass
class AccelerationEvidence(unittest.TestCase):
 def test_only_failed_acceleration_step_opts_in_and_all_other_plan_fields_remain_exact(self):
  old=json.loads(subprocess.check_output(['git','show',SOURCE+':joystick-games/kart-royale/qa-plan.json'],cwd=ROOT));new=json.loads(PLAN.read_text());self.assertIs(new['steps'][12].pop('windowsHoldUntilExpect'),True);self.assertEqual(new,old);self.assertEqual(len(new['steps']),20);self.assertEqual(new['steps'][12]['timeoutSeconds'],60);self.assertEqual(new['steps'][12]['holdMs'],3500)
  verify.plan_api.load_plan(PLAN)
 def test_original_native_raw_observation_and_final_failure_never_become_semantic_success(self):
  findings=[]
  for mode in ['normal','occupied']:
   with self.subTest(mode=mode):
    report=json.loads((ORIGINAL/f'runtime-{mode}/report.json').read_text());final=json.loads((ORIGINAL/f'runtime-{mode}/diagnostics/state.json').read_text());snapshots={x['label']:x['state'] for x in report['snapshots']}
    before=snapshots['Start race and wait original countdown bounded released observation'];observed=snapshots['Accelerate original kart from grid actual SDK input'];sequence=iter([copy.deepcopy(observed),copy.deepcopy(final)])
    subject=object.__new__(verify.WindowsCheck);subject.report={'wire':[],'observerErrors':[],'snapshots':[]};subject.held=set();subject.renderers=['webgl2'];subject.client=types.SimpleNamespace(identity=before['input']['players'][0]['controllerId'],seq=1,lock=__import__('threading').RLock());commands=[]
    def press(key):commands.append(('press',key));subject.held.add(key);subject.client.seq+=1
    def clear():commands.append(('clear',));subject.held.clear()
    def read(deadline):
     try:return next(sequence)
     except StopIteration:raise OriginalEvidenceExhausted('No additional original native snapshots; failure remains failure') from None
    subject.press=press;subject.clear=clear;subject.deadline_snapshot=read
    owner=subject.player(before);native=subject.player(observed)
    self.assertTrue(subject.fresh(observed,before,True));self.assertEqual(native['session'],owner['session']);self.assertTrue(native['buttons']['UP']);self.assertEqual(native['buttonCounters']['UP'],owner['buttonCounters']['UP']+1)
    self.assertFalse(observed['game']['controller']['buttons']['UP']);self.assertEqual(observed['game']['gameplay']['controls']['accel'],0)
    step=verify.plan_api.load_plan(PLAN)['steps'][12]
    self.assertFalse(verify.plan_api.matches(step['expect'],observed['game'],before['game']));self.assertFalse(verify.plan_api.matches(step['expect'],final['game'],before['game']))
    with self.assertRaises(OriginalEvidenceExhausted):subject.bounded_gameplay_step(step,before)
    record=subject.report['boundedGameplayObservations'][0];self.assertEqual(record['status'],'failed');self.assertFalse(record['semanticHeldObserved']);self.assertNotIn('firstMatchingHeldState',record);self.assertEqual(record['snapshotReads'],2);self.assertEqual(commands,[('press','UP'),('clear',)]);self.assertFalse(subject.held)
    findings.append({'mode':mode,'originalRawGateWouldAccept':True,'originalSemanticHeld':False,'originalFinalSpeed':final['game']['gameplay']['speed'],'replayedStates':2,'helperStatus':record['status'],'semanticHeldObserved':record['semanticHeldObserved'],'cleanupObserved':True,'noSuccessfulStateInvented':True})
  (HERE/'replay-observations.json').write_text(json.dumps(findings,indent=2)+'\n')
if __name__=='__main__':unittest.main(verbosity=2)
