import hashlib,importlib.util,json,subprocess,os,sys,time
from pathlib import Path
ROOT=Path('/dev/shm/puretv-submit');S=Path(__file__).parent;C=S/'candidate';BASE='c5ad63e8c6a0ccfada5f763d1d26afa27f45002e'
old=json.loads((S/'preflight.json').read_text());kept=['joystick-games/qa/android/run.py','joystick-games/qa/android/test_runner.py','joystick-games/tools/qa-plan.py']
for name in kept:
 b=subprocess.check_output(['git','show',BASE+':'+name],cwd=ROOT);(C/name).write_bytes(b)
old['sourceFiles']=[x for x in old['sourceFiles'] if x['path'] not in kept]
old['protectedOriginalSources'].update({name:{'bytes':(C/name).stat().st_size,'sha256':hashlib.sha256((C/name).read_bytes()).hexdigest()} for name in kept})
old['candidateRevision']=2
old['reasonForNarrowerOverlay']='Retain the original c5 Android input runner/tests/plan schema: Penguin uses ordinary held steps, not Night-specific menuTap/reload. This preserves all original acceptance logic and avoids importing unrelated Night source-proof tests that require post-c5 Night production bytes.'
old['firstCandidateFailure']={'log':'test_runner.log','errors':3,'observed':'Local sparse support copy omitted Night production files required by new Night-specific tests. Actual c5 Night tv-adapter hash48a3a52f differs from the newer helper-required e6feee45, so adding the real c5 files would still fail the exact-source proof. No production files are overlaid to silence this check.'}
spec=importlib.util.spec_from_file_location('candidate_plan',C/'joystick-games/tools/qa-plan.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.validate_plan(json.loads((C/'joystick-games/penguintrack/qa-plan.json').read_text()))
assert len(old['sourceFiles'])==19
(S/'preflight-final.json').write_text(json.dumps(old,indent=2)+'\n')
start=time.monotonic();log=S/'test_runner-final.log'
with log.open('wb') as f:r=subprocess.run([sys.executable,'-B',str(C/'joystick-games/qa/android/test_runner.py')],cwd=C,env={**os.environ,'TMPDIR':str(S),'PYTHONDONTWRITEBYTECODE':'1'},stdout=f,stderr=subprocess.STDOUT,timeout=120)
assert r.returncode==0,log
result={'command':'joystick-games/qa/android/test_runner.py','returncode':r.returncode,'seconds':time.monotonic()-start,'log':log.name,'bytes':log.stat().st_size,'sha256':hashlib.sha256(log.read_bytes()).hexdigest()}
(S/'local-final-changed-tests.json').write_text(json.dumps(result,indent=2)+'\n')
select=subprocess.check_output([sys.executable,'-B',str(C/'joystick-games/tools/android-catalog.py'),'select','--batch','racing-02','--games','penguintrack'],cwd=C);x=json.loads(select);assert x['games']=='penguintrack';(S/'selection.json').write_bytes(select)
print(json.dumps({'overlayFiles':len(old['sourceFiles']),'newRunnerTest':result,'selected':x}))
