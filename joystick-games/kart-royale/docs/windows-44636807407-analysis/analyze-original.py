#!/usr/bin/env python3
"""Read fixed original Windows evidence; no native execution or model writes."""
from pathlib import Path
import collections,datetime,hashlib,json,os,re,subprocess
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
SOURCE='d750c0c68c430503be06d18fe5b76af825c72e58'
EXPORT='09167e91d63bfea2a069dbb62ba6127db238a9f7'
SCRATCH=Path('/dev/shm/windows-host-tmp/navigation-v6-d750')
PREFIX='joystick-windows-evidence-kart-royale/'

def record(data):return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def read(path):return json.loads(path.read_text())
def archive(source,target):
 target.parent.mkdir(parents=True,exist_ok=True)
 if not target.exists():os.link(source,target)
 assert target.read_bytes()==source.read_bytes()

def smallgame(game):
 c=game['controller'];v=game['gameplay']
 return {'frames':game['frames'],'pollCount':c['pollCount'],'phase':v['phase'],'time':v['time'],'speed':v['speed'],'position':v['position'],'controls':v['controls'],'buttons':c['buttons'],'cancelled':c['cancelled']}

def original_file(name):return HERE/'original'/name

# Hard links preserve original bytes without another large copy.
if not original_file('export-tree.json').exists():
 for name in ['original-export-tree.json','small-report-verification-kart-royale.json']:
  archive(SCRATCH/name,original_file('export-tree.json' if 'tree' in name else 'recovery-verification.json'))
 verification=read(original_file('recovery-verification.json'))
 for name in verification['files']:archive(SCRATCH/'original-small-export'/name,original_file(name))
verification=read(original_file('recovery-verification.json'))
assert verification['sourceCommit']==SOURCE and verification['immutableExportCommit']==EXPORT
assert verification['sourceRunId']==44636807407 and verification['packagesDownloaded'] is False
export=read(original_file('export-manifest.json')); evidence=read(original_file(PREFIX+'evidence-manifest.json'))
assert export['sourceCommit']==evidence['sourceCommit']==SOURCE
assert int(export['runId'])==int(evidence['runId'])==44636807407
assert int(export['runAttempt'])==int(evidence['runAttempt'])==1
assert export['verifiedGames']==[]
tree=read(original_file('export-tree.json'));assert not tree['truncated']; blobs={v['path']:v for v in tree['tree'] if v['type']=='blob'}
for name,expected in verification['files'].items():
 data=original_file(name).read_bytes();assert record(data)==expected
 assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==blobs[name]['sha']
 if name!='export-manifest.json':assert export['files'][name]==expected
 if name.startswith(PREFIX) and name!=PREFIX+'evidence-manifest.json':assert evidence['files'][name[len(PREFIX):]]==expected

paths=['joystick-games/kart-royale/qa-plan.json','joystick-games/tools/windows-verify.py','joystick-games/tools/macos-verify.py','joystick-games/tools/qa-plan.py','puretv-joystick/joystick_sdk.py','joystick-games/tools/windows-display.py','joystick-games/tools/windows-observation.py','joystick-games/shared/windows/Sources/main.cpp','joystick-games/shared/windows/Web/bridge.js','joystick-games/shared/web/input.js','joystick-games/kart-royale/src/src/tv-input.ts','joystick-games/kart-royale/src/src/core/Input.ts','joystick-games/kart-royale/src/src/main.ts']
sources={}
for name in paths:
 target=HERE/'fixed-source'/name
 if not target.exists():
  data=subprocess.check_output(['git','show',SOURCE+':'+name],cwd=ROOT,env=dict(os.environ,GIT_NO_LAZY_FETCH='1'))
  target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 sources[name]=record(target.read_bytes())
build=read(original_file(PREFIX+'build-manifest.json'))
for name in paths:
 if name in build['inputFiles']:assert sources[name]==build['inputFiles'][name]
plan=read(HERE/'fixed-source/joystick-games/kart-royale/qa-plan.json')
assert len(plan['steps'])==20 and plan['steps'][12]['windowsHoldUntilExpect'] is True
findings={}
for mode in ['normal','occupied']:
 report=read(original_file(PREFIX+f'runtime-{mode}/report.json')); final=read(original_file(PREFIX+f'runtime-{mode}/diagnostics/state.json'))
 assert report['qaSourceCommit']==SOURCE and report['qaPlan']==plan and report['status']=='failed'
 for name,digest in report['sourceHashes'].items():assert sources[name]['sha256']==digest
 assert len(report['menuTapObservations'])==11 and all(x['status']=='passed' for x in report['menuTapObservations'])
 start,held=report['boundedGameplayObservations'];assert start['status']=='passed' and held['semanticHeldObserved'] is True
 assert held['inputConsumed']['gameplay']['controls']['accel']==1
 assert held['firstMatchingHeldState']['gameplay']['controls']['accel']==1
 assert held['firstMatchingHeldState']['gameplay']['speed']>1
 assert held['firstMatchingHeldState']['gameplay']['position']!=held['before']['gameplay']['position']
 raw=report['wire'];pair=[x for x in raw if x['direction']=='sdk-to-game' and x['message'].get('type')=='button' and x['message'].get('seq') in [held['sdkDownSequence'],held['sdkReleaseSequence']]]
 assert len(pair)==2 and [x['message']['action'] for x in pair]==['down','tap'] and all(x['message']['key']=='UP' for x in pair)
 connection=pair[0]['connection'];assert pair[1]['connection']==connection
 sent=[x for x in raw if x['direction']=='sdk-to-game' and x['connection']==connection]
 sequences=[x['message']['seq'] for x in sent];acks=collections.Counter(x['message'].get('seq') for x in raw if x['direction']=='game-to-sdk' and x['connection']==connection and x['message'].get('type')=='ack')
 assert len(sequences)==len(set(sequences)) and all(acks[n]==1 for n in sequences)
 assert not report['observerErrors'] and not report['observerConnectionEnds']
 ring=final['inputEvents'];assert ring['discarded']==0 and ring['total']==9
 after_connect=[x for x in ring['events'] if x['sequence']>8]
 assert [x['event'] for x in after_connect]==['first_active_poll']
 snapshots=[x['state'] for x in report['snapshots'] if isinstance(x.get('state'),dict)]
 owner_states=[p for x in snapshots for p in x.get('input',{}).get('players',[]) if p.get('connected') is True]
 identity={(x['controllerId'],x['session'],x['cancelSeq']) for x in owner_states};assert len(identity)==1
 assert all(x.get('documentEpoch')==1 for x in snapshots if x.get('game'))
 released=[x for x in held['samples'] if x['elapsedSeconds']>=held['releasedAtSeconds'] and x['raw'] is False and x['semantic'] is False]
 # Every unrequested key is checked false before a sample can be appended by
 # bounded_gameplay_step; thus UP false here represents all-nine released.
 final_released_followups=max(0,len(released)-1)
 facts={'report':record(original_file(PREFIX+f'runtime-{mode}/report.json').read_bytes()),'status':report['status'],'passedTopLevelChecks':sum(t['status']=='passed' for t in report['tests']),'failedTopLevelCheck':next(t['name'] for t in report['tests'] if t['status']=='failed'),'error':report['error'].strip().splitlines()[-1],'passedMenuTapSteps':11,
  'startup':{k:start[k] for k in ['status','elapsedSeconds','firstMatchedAtSeconds','releasedFreshFrames','wireHeldSeconds']},
  'acceleration':{**{k:held[k] for k in ['status','timeoutSeconds','elapsedSeconds','firstMatchedAtSeconds','releasedAtSeconds','sdkDownSequence','sdkReleaseSequence']},'before':smallgame(held['before']),'firstConsumed':smallgame(held['inputConsumed']),'firstMatchWhileHeld':smallgame(held['firstMatchingHeldState']),'samples':held['samples'],'firstReleasedBaseline':released[0] if released else None,'releasedFollowupsRecomputed':final_released_followups,'reportedReleasedFreshFrames':held['releasedFreshFrames'],'reportedCounterNote':'The observer updates releasedFreshFrames only on successful completion. Failure retains its initialized zero; samples preserve actual progress.'},
  'wire':{'connection':connection,'messages':len(sent),'uniqueSequences':len(set(sequences)),'matchingAcks':sum(acks[n] for n in sequences),'pressRelease':pair,'actualHeldSeconds':(datetime.datetime.fromisoformat(pair[1]['at'])-datetime.datetime.fromisoformat(pair[0]['at'])).total_seconds(),'errors':report['observerErrors'],'connectionEnds':report['observerConnectionEnds']},
  'inputEventRing':ring,'observedOwnerIdentities':list(identity),'final':smallgame(final['game'])}
 if mode=='normal':
  assert held['status']=='failed' and final_released_followups==1 and held['elapsedSeconds']>=60
  assert 'Snapshot arrived after gameplay observation deadline' in report['error']
  facts['completedPlanSteps']=12;facts['failingPlanIndexZeroBased']=12
 else:
  assert held['status']=='passed' and final_released_followups==2
  labels={x['label'] for x in report['snapshots']}
  for step in plan['steps'][13:]:assert step['name']+' actual gameplay observation' in labels and 'Plan controls released: '+step['name'] in labels
  assert 'Paused before model stability observation' in labels
  pause,=report['pauseObservations'];fresh=[x for x in pause['samples'] if x['freshNativeSnapshot']]
  assert len(fresh)==3 and pause['status']=='failed' and pause['timeoutSeconds']==30
  assert all(x['paths']==pause['expectedPaths'] and x['paused'] is True and x['active'] is True and x['inputEnabled'] is True for x in pause['samples'])
  assert 'Insufficient fresh real snapshots during pause' in report['error']
  facts.update(completedPlanSteps=20,failingPlanIndexZeroBased=None,failureAfterPlan=True,pauseObservation={k:v for k,v in pause.items() if k!='samples'})
  facts['pauseObservation'].update(totalReadSamples=len(pause['samples']),freshSamples=fresh,requiredFreshSamples=4,allObservedModelValuesUnchanged=True)
 findings[mode]=facts
result={'status':'original-failures-explained-no-native-acceptance','sourceCommit':SOURCE,'originalRunId':44636807407,'attempt':1,'exportCommit':EXPORT,'originalFilesVerified':len(verification['files']),'originalBytesVerified':sum(v['bytes'] for v in verification['files'].values()),'fixedSourceFiles':sources,'modes':findings,'conclusions':[
 'Both original modes consumed held UP in the semantic frame, set original controls.accel=1, and exceeded speed 1 with changed position before releasing. Permanent input-mapping failure is contradicted by these observations.',
 'Normal fails after the original held expectation already matched. Semantic release reaches frame190 at 51.25s; frame191 at 58.656s is only the first subsequent fresh frame. The unchanged 60-second total budget expires before the second subsequent frame required by the observer.',
 'Occupied completes all20 original plan steps, then fails the additional pause-stability observation. In30seconds it records only3 new native timestamps of the4 required. Every observed pause model field is identical and polling advances224to228.',
 'The complete9-event rings discard nothing and show only initial bootstrap suspension. No post-connection blur/suspend/input-disable/cancel event is present; observed owner/session/cancelSeq and documentepoch remain fixed.',
 'The original native callback samples live protocol state after asynchronous JavaScript diagnostics. Raw and semantic fields can therefore represent different moments. This run directly shows delayed-but-eventual consumption and release; raw/semantic disagreement alone is not evidence of wrong mapping.',
 'The fixed original frame clamps dt to0.05seconds and polls once per animationframe. Both startup sequences progress naturally in about567seconds; no clock or physics modification is justified. The evidence measures this runner only, not physical Windows/TV performance.'
 ],'remainingUncertainty':['The precise rendering/scheduling cause of approximately7-to8second fresh observations was not instrumented; no confirmed GPU-driver or game-physics cause is asserted.','No screenshots were requested or visually reviewed in this narrow analysis; no package delivery claim is made.','Later top-level disconnect/reconnect, background and storage acceptance was not reached. Both modes remain failed.'],'recommendedNextStep':'Review a narrowly bounded QA observation-budget separation only if root authorizes it: preserve held input<=60s, original speed/position predicate, exact ACKs and full post-release/pause fresh-frame counts. Do not loosen physics, assert stale frames, extrapolate a pass or blindly rerun.','nativeRunsPerformed':0,'workflowDispatches':0,'productionOrQaSourceEdits':0,'nativeAcceptanceAllowed':False}
(HERE/'findings.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'file':'findings.json',**record((HERE/'findings.json').read_bytes()),'originalFilesVerified':result['originalFilesVerified'],'modes':{k:{'completedPlanSteps':v['completedPlanSteps'],'error':v['error'],'wireMessages':v['wire']['messages']} for k,v in findings.items()}},ensure_ascii=False))
