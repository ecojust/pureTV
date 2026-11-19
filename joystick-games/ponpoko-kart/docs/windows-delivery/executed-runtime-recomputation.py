from pathlib import Path
import collections,hashlib,importlib.util,json,subprocess
ROOT=Path('/dev/shm/puretv-submit');OUT=Path(__file__).resolve().parent;SOURCE='232d544079a472aa0ffb259c1bc73c692b94504d';BASE=Path('/dev/shm/windows-host-tmp/three-diagnostics-232d/original-small-export/joystick-windows-evidence-ponpoko-kart')
raw=subprocess.check_output(['git','show',SOURCE+':joystick-games/tools/qa-plan.py'],cwd=ROOT);script=OUT/'executed-frozen-qa-plan.py';script.write_bytes(raw);spec=importlib.util.spec_from_file_location('frozen_qa',script);qa=importlib.util.module_from_spec(spec);spec.loader.exec_module(qa)
result={'sourceCommit':SOURCE,'runtimeRunId':44628818020,'scope':'Read-only original SDK ACK and plan predicate recomputation; no native execution','qaPlanToolSha256':hashlib.sha256(raw).hexdigest(),'modes':{}}
for mode in ['normal','occupied']:
 r=json.loads((BASE/f'runtime-{mode}/report.json').read_bytes());assert r['status']=='passed' and r['sourceHashes']['joystick-games/tools/qa-plan.py']==hashlib.sha256(raw).hexdigest()
 sent=collections.Counter((w['connection'],w['message']['seq']) for w in r['wire'] if w['direction']=='sdk-to-game');acks=collections.Counter((w['connection'],w['message']['seq']) for w in r['wire'] if w['direction']=='game-to-sdk' and w['message']['type']=='ack');assert sent==acks and all(v==1 for v in sent.values())
 assert not r['observerErrors'];claimed=r['tests'][7]['details'];assert claimed=={'messages':sum(sent.values()),'matchingAcks':sum(acks.values())}
 cases=r['tests'][3]['details']['planSteps'];assert len(cases)==len(r['qaPlan']['steps'])==11
 for step,case in zip(r['qaPlan']['steps'],cases):
  assert all(case[k]==step[k] for k in ['name','keys','holdMs']);assert qa.matches(step['expect'],case['after'],case['before'])
 stable=r['tests'][3]['details']['pauseStability'];assert stable['samples']>=4 and len(set(stable['freshSnapshotTimestamps']))>=4 and stable['realSeconds']>=.5 and stable['controllerFramesAdvanced']>0 and stable['controllerPollingRequired'] is True
 cycles=r['tests'][4]['details']['cycles'];assert len(cycles)==3
 for c in cycles:
  assert all(c[k] is True for k in ['samePort','sameSocket','sameSession','heldSuppressed','restoredPollingVerified','freshStartRequired']);b=c['backgroundStability'];assert b['background'] is True and b['samples']>=4 and b['realSeconds']>=.5
 assert r['tests'][5]['details']['heldSyncNoResume'] is True
 storage=r['storageRestart'];expected={'ponpoko.prefs':'{"characterId":"kitsune","courseId":"inaka","difficulty":"100cc"}'}
 assert storage['status']=='passed' and storage['nativeSaved']==storage['nativeSavedAfterQuit']==storage['after']['initial']==expected
 result['modes'][mode]={'originalSdkMessages':sum(sent.values()),'uniqueMatchingAcks':sum(acks.values()),'originalPlanStepsRecomputed':len(cases),'pauseFreshSnapshots':len(set(stable['freshSnapshotTimestamps'])),'pauseRealSeconds':stable['realSeconds'],'pauseControllerPollAdvance':stable['controllerFramesAdvanced'],'backgroundRestoreCycles':3,'restoredPreferences':expected,'reportSha256':hashlib.sha256((BASE/f'runtime-{mode}/report.json').read_bytes()).hexdigest()}
(OUT/'runtime-recomputation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
