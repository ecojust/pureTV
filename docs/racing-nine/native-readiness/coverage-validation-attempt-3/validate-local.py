import ast,hashlib,importlib.util,json,os,shutil,subprocess
from pathlib import Path
ROOT=Path('/dev/shm/puretv-submit');os.chdir(ROOT)
previous=ROOT/'docs/racing-nine/native-readiness/coverage-validation-attempt-2'
out=ROOT/'docs/racing-nine/native-readiness/coverage-validation-attempt-3';out.mkdir(exist_ok=False)
old=json.loads((previous/'source-inventory.json').read_text())
def digest(data):return hashlib.sha256(data).hexdigest()
files={}
for name in old:
 data=(ROOT/name).read_bytes();files[name]={'bytes':len(data),'sha256':digest(data)};target=out/'executed-source'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
(out/'source-inventory.json').write_text(json.dumps(files,indent=2)+'\n')
commands=[('capability',['python3','joystick-games/shared/macos/tests/capability.test.py']),('coverage',['python3','joystick-games/shared/macos/tests/coverage.test.py']),('actionlint-1.7.12',['/dev/shm/racing-native-readiness/actionlint-1.7.12',*sorted(n for n in files if n.endswith('.yml'))])]
results=[]
for name,argv in commands:
 p=subprocess.run(argv,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env={**os.environ,'TMPDIR':'/dev/shm/racing-native-readiness','PYTHONDONTWRITEBYTECODE':'1'});(out/(name+'.log')).write_bytes(p.stdout);results.append({'name':name,'command':argv,'returncode':p.returncode});assert p.returncode==0,p.stdout.decode()
parsed={}
for name in files:
 if name.endswith('.py'):ast.parse((ROOT/name).read_text(),filename=name)
 if not name.endswith('.yml'):continue
 lines=(ROOT/name).read_text().splitlines();count=0
 for index,line in enumerate(lines):
  if line.strip()!="python3 - <<'PY'":continue
  indent=len(line)-len(line.lstrip());code=[]
  for following in lines[index+1:]:
   if following.strip()=='PY':break
   code.append(following[indent:])
  ast.parse('\n'.join(code),filename=name);count+=1
 parsed[name]=count
spec=importlib.util.spec_from_file_location('coverage',ROOT/'joystick-games/tools/macos-coverage.py');coverage=importlib.util.module_from_spec(spec);spec.loader.exec_module(coverage)
replay=[]
for run,folder,export in [(44584471562,'original-final-export','937730de874d89ada809625fb4a167d33a9ca972'),(44593224015,'original-export','b2cfc46f1a40edca7e8cf687304b70f7dcfb2a5c')]:
 base=ROOT/f'docs/racing-nine/native-readiness/ci-{run}-attempt-1'/folder
 before={p.relative_to(base).as_posix():digest(p.read_bytes()) for p in base.rglob('*') if p.is_file()};plan=json.loads((base/'provenance/plan.json').read_text());registry=json.loads((base/'provenance/catalog-registry.json').read_text());games=[]
 for game in plan['games']:
  meta=json.loads((base/f'packages/joystick-catalog-macos-packages-adventure-01/{game}/build-manifest.json').read_text())
  record=coverage.assess_game(game,meta,plan,registry['games'][game],base/'evidence/joystick-catalog-macos-qa-adventure-01-macos-latest',base/'evidence/joystick-catalog-macos-qa-adventure-01-macos-15-intel');assert record['coveragePolicy']=='full-v1' and record['overallGameplayVerification']=='complete';games.append(record)
 after={p.relative_to(base).as_posix():digest(p.read_bytes()) for p in base.rglob('*') if p.is_file()};assert before==after
 entry={'method':'Read-only current classifier over original immutable sample evidence; no new native execution','runId':run,'exportCommit':export,'originalInputFilesUnchanged':True,'originalInputFileCount':len(before),'games':games};replay.append(entry);(out/f'original-{run}-full-policy-reassessment.json').write_text(json.dumps(entry,indent=2)+'\n')
assert all({'bytes':(ROOT/n).stat().st_size,'sha256':digest((ROOT/n).read_bytes())}==v for n,v in files.items())
result={'sourceFiles':files,'changedSinceAttempt2':[n for n in files if files[n]!=old[n]],'results':results,'embeddedPythonScriptsParsed':parsed,'nativeCapabilityProbeExecuted':False,'nativeGameplayRerun':False,'sourceUnchangedDuringTests':True,'priorUnchangedSourceRegressionEvidence':'../coverage-validation-attempt-2/result.json','originalFullPolicyReassessment':[{'runId':r['runId'],'inputFiles':r['originalInputFileCount'],'games':[{'game':g['game'],'result':g['overallGameplayVerification']} for g in r['games']]} for r in replay]}
(out/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'results':results,'sourceFiles':len(files),'embeddedScripts':sum(parsed.values())}))
