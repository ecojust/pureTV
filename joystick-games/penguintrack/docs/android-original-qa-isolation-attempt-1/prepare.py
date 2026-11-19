import ast,fnmatch,hashlib,importlib.util,json,os,subprocess,sys,time
from pathlib import Path
ROOT=Path('/dev/shm/puretv-submit');SCRATCH=Path(__file__).parent;CANDIDATE=SCRATCH/'candidate';CANDIDATE.mkdir(exist_ok=False)
BASE='c5ad63e8c6a0ccfada5f763d1d26afa27f45002e';QA='d3b9178bfc4748ef0d8b983f4c6775969f946625';PLAN='ff645cc2f195d4071150be1fffd2b7952c265129'
paths=['.github/workflows/joystick-catalog-android-runtime.yml','joystick-games/qa/android','joystick-games/tools/android-catalog.py','joystick-games/tools/android-runtime-inputs.py','joystick-games/tools/android-runtime-copies.py','joystick-games/tools/android-runtime-artifact.py','joystick-games/tools/android-runtime-artifact-tests.py','joystick-games/tools/artifact-draft-transfer.py','joystick-games/tools/android-environment-diagnostics.py','joystick-games/tools/android-emulator-supervisor.py','joystick-games/tools/qa-plan.py','joystick-games/tools/fixtures/android-runtime-artifact']
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def blob(commit,name):return git('show',commit+':'+name)
def record(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
overlay={n:QA for n in git('diff','--name-only',BASE,QA,'--',*paths).decode().splitlines()};overlay['joystick-games/penguintrack/qa-plan.json']=PLAN
assert len(overlay)==22
basepaths=git('ls-tree','-r','--name-only',BASE,'--','joystick-games/tools','joystick-games/qa/android','joystick-games/catalog-registry.json','joystick-games','resource/game-kit','puretv-joystick/joystick_sdk.py','tools/resource_catalog.py','tools/puretv-release-certificate-v2.sha256','.github/workflows').decode().splitlines()
selected=[]
for name in basepaths:
 if (name.startswith('joystick-games/tools/') and (name.endswith('.py') or '/fixtures/' in name)) or name.startswith('joystick-games/qa/android/') or name.startswith('resource/game-kit/android/src/main/') or name in ['resource/game-kit/build.py','puretv-joystick/joystick_sdk.py','tools/resource_catalog.py','tools/puretv-release-certificate-v2.sha256','joystick-games/catalog-registry.json'] or name.startswith('.github/workflows/') or fnmatch.fnmatch(name,'joystick-games/*/game.json') or fnmatch.fnmatch(name,'joystick-games/*/qa-plan.json') or name in ['resource/game-kit/web/'+x for x in ['controller.html','controller.js','controller.css']]:
  if '/docs/' in name:continue
  selected.append(name)
  p=CANDIDATE/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(blob(BASE,name))
sourcefiles=[]
for name,commit in overlay.items():
 b=blob(commit,name);p=CANDIDATE/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
 sourcefiles.append({'path':name,'copyFromCommit':commit,**record(b)})
# No production or observer/SDK inputs are overlaid, including the build module pinned in Observer receipt.
spec=importlib.util.spec_from_file_location('isolation_inputs',CANDIDATE/'joystick-games/tools/android-runtime-inputs.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
inputs=m.expected_inputs(ROOT,BASE,'penguintrack')
production=sorted(n for n in inputs if m.production_path(n,'penguintrack'))
assert not set(overlay)&set(production)
protected=['joystick-games/tools/android-build.py','joystick-games/qa/android/build-observer.py','joystick-games/qa/android/src/com/ecojust/controllerqa/Observer.java','puretv-joystick/joystick_sdk.py','tools/puretv-release-certificate-v2.sha256']
assert not set(overlay)&set(protected)
for n in protected:assert (CANDIDATE/n).read_bytes()==blob(BASE,n)
new=json.loads((CANDIDATE/'joystick-games/penguintrack/qa-plan.json').read_text());old=json.loads(blob(BASE,'joystick-games/penguintrack/qa-plan.json'))
assert new['steps'][2:]==old['steps'] and {k:v for k,v in new.items() if k!='steps'}=={k:v for k,v in old.items() if k!='steps'}
assert [s['keys'] for s in new['steps'][:2]]==[['UP'],['DOWN']] and all(s['holdMs']==80 for s in new['steps'][:2])
spec=importlib.util.spec_from_file_location('strict_plan',CANDIDATE/'joystick-games/tools/qa-plan.py');plan=importlib.util.module_from_spec(spec);spec.loader.exec_module(plan);plan.validate_plan(new)
preflight={'parentCommit':BASE,'qaImportsCommit':QA,'planCommit':PLAN,'sourceFiles':sourcefiles,'unchangedProductionPaths':production,'protectedOriginalSources':{n:record(blob(BASE,n)) for n in protected},'productionPathOverlap':[],'originalStepsUnchanged':len(old['steps']),'addedMenuSteps':2,'planSchemaPassed':True,'baseSupportFilesMaterializedForLocalTests':len(selected),'candidateIsNotACommit':True,'noRefCreated':True}
(SCRATCH/'preflight.json').write_text(json.dumps(preflight,indent=2)+'\n')
commands=['joystick-games/qa/android/test_runner.py','joystick-games/tools/android-tests.py','joystick-games/tools/android-runtime-artifact-tests.py','joystick-games/qa/android/test_environment_diagnostics.py','joystick-games/qa/android/test_install_confirmation.py','joystick-games/qa/android/test_emulator_supervisor.py']
results=[]
for path in commands:
 log=SCRATCH/(Path(path).stem+'.log');start=time.monotonic()
 with log.open('wb') as out:r=subprocess.run([sys.executable,'-B',str(CANDIDATE/path)],cwd=CANDIDATE,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1','TMPDIR':str(SCRATCH)},stdout=out,stderr=subprocess.STDOUT,timeout=180)
 result={'command':path,'returncode':r.returncode,'seconds':time.monotonic()-start,'log':log.name,**record(log.read_bytes())};results.append(result);print(json.dumps(result),flush=True)
(SCRATCH/'local-test-results.json').write_text(json.dumps(results,indent=2)+'\n');assert all(r['returncode']==0 for r in results)
