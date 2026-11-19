from pathlib import Path
import subprocess,json,os,hashlib
r=Path('/dev/shm/puretv-submit');out=r/'docs/racing-nine/native-readiness/runtime-qa-refs';created=json.loads((out/'creation.json').read_text());results=[]
for branch in created['branches']:
 root=Path('/dev/shm/racing-native-readiness/runtime-qa-ref-tests')/branch['label'];root.mkdir(parents=True,exist_ok=False);commit=branch['commit'];names=subprocess.check_output(['git','ls-tree','-r','--name-only',commit],cwd=r,text=True).splitlines();selected=[]
 for name in names:
  if ((name.startswith('joystick-games/tools/macos-') and name.endswith('.py')) or name in ['joystick-games/tools/qa-plan.py','joystick-games/tools/asset-policy.py','joystick-games/catalog-registry.json','puretv-joystick/joystick_sdk.py'] or name.startswith('joystick-games/shared/macos/tests/') or name.startswith('joystick-games/shared/macos/tools/') or name.startswith('joystick-games/shared/macos/Sources/') or (name.startswith('joystick-games/') and name.endswith('/qa-plan.json')) or name.startswith('.github/workflows/joystick-catalog-macos')):
   selected.append(name)
 records={}
 for name in selected:
  data=subprocess.check_output(['git','show',commit+':'+name],cwd=r);p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);records[name]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 checks=[]
 for test in ['native-observation','catalog-tools']+(['coverage'] if branch['label']=='A' else []):
  argv=['python3','joystick-games/shared/macos/tests/'+test+'.test.py'];done=subprocess.run(argv,cwd=root,env=dict(os.environ,TMPDIR='/dev/shm/racing-native-readiness/tmp',PYTHONDONTWRITEBYTECODE='1'),stdout=subprocess.PIPE,stderr=subprocess.PIPE);prefix=branch['label']+'-'+test
  for ext,data in [('stdout',done.stdout),('stderr',done.stderr)]: (out/(prefix+'-'+ext+'.log')).write_bytes(data)
  checks.append({'command':argv,'returncode':done.returncode,'stdout':prefix+'-stdout.log','stderr':prefix+'-stderr.log'});print(branch['label'],test,done.returncode,done.stderr.decode().strip().splitlines()[-3:],flush=True)
 results.append({'label':branch['label'],'commit':commit,'extractedExactGitFiles':records,'checks':checks,'status':'passed' if all(x['returncode']==0 for x in checks) else 'failed'})
(out/'isolated-qa-tests.json').write_text(json.dumps({'scope':'Unit checks on exact QA commit bytes in an isolated sparse file view; no native game, package, Swift build, CI dispatch or production source changes.','branches':results},indent=2)+'\n');(out/'executed-test-runtime-qa-refs.py').write_bytes(Path(__file__).read_bytes())
assert all(x['status']=='passed' for x in results)
