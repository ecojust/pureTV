#!/usr/bin/env python3
"""Static/diff verification only; no native run or network request."""
import ast,hashlib,importlib.util,json,os,subprocess
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
before=json.loads((HERE/'before.json').read_text())
def record(data):return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
records={}
for path in before['files']:
 original=(HERE/'original-source'/path).read_bytes();assert record(original)==before['files'][path]
 data=(ROOT/path).read_bytes();target=HERE/'executed-source'/path
 target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);records[path]=record(data)
planpath='joystick-games/kart-royale/qa-plan.json'
old=json.loads((HERE/'original-source'/planpath).read_text());new=json.loads((ROOT/planpath).read_text())
assert new.pop('windowsPauseWait')=={'timeoutSeconds':45}
assert new['steps'][12].pop('windowsReleaseWait')=={'timeoutSeconds':45}
assert new==old

def class_methods(data):
 tree=ast.parse(data)
 return {node.name+'.'+method.name:ast.dump(method) for node in tree.body if isinstance(node,ast.ClassDef) for method in node.body if isinstance(method,(ast.FunctionDef,ast.AsyncFunctionDef))}
unchanged=[]
for path in ['joystick-games/shared/windows/tests/gameplay.test.py','joystick-games/shared/windows/tests/window-lifecycle.test.py']:
 old=class_methods((HERE/'original-source'/path).read_bytes());new=class_methods((ROOT/path).read_bytes())
 assert all(new[key]==value for key,value in old.items());unchanged.extend(old)
path='joystick-games/tools/windows-verify.py'
a=ast.parse((HERE/'original-source'/path).read_bytes());b=ast.parse((ROOT/path).read_bytes())
ca=next(x for x in a.body if isinstance(x,ast.ClassDef));cb=next(x for x in b.body if isinstance(x,ast.ClassDef))
ma={x.name:x for x in ca.body if isinstance(x,ast.FunctionDef)};mb={x.name:x for x in cb.body if isinstance(x,ast.FunctionDef)}
assert set(mb)-set(ma)=={'bounded_pause_stability'}
for name in ma:
 if name not in ['pause_stability','bounded_gameplay_step']:assert ast.dump(ma[name])==ast.dump(mb[name]),name
assert ast.dump(ast.Module(body=ma['pause_stability'].body,type_ignores=[]))==ast.dump(ast.Module(body=mb['pause_stability'].body[1:],type_ignores=[]))
spec=importlib.util.spec_from_file_location('plan_validation_only',ROOT/'joystick-games/tools/qa-plan.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
checked=[]
for path in sorted((ROOT/'joystick-games').glob('*/qa-plan.json')):
 value=module.load_plan(path);checked.append(path.parent.name)
 if path.parent.name!='kart-royale':assert 'windowsPauseWait' not in value and all('windowsReleaseWait' not in step for step in value['steps'])
unchanged_sources={}
for path in ['joystick-games/tools/macos-verify.py','joystick-games/qa/android/run.py','.github/workflows/joystick-catalog-windows.yml']:
 data=(ROOT/path).read_bytes()
 assert data==subprocess.check_output(['git','show',before['head']+':'+path],cwd=ROOT,env=dict(os.environ,GIT_NO_LAZY_FETCH='1'))
 unchanged_sources[path]=record(data)
subprocess.run(['git','diff','--check','--',*before['files']],cwd=ROOT,check=True)
log=(HERE/'tests-final.log').read_text();assert 'Ran 53 tests' in log and log.rstrip().endswith('OK') and 'skipped=' not in log
result={'status':'passed','candidateFiles':records,'originalExistingTestMethodsAndFixturesAstUnchanged':len(unchanged),'originalPauseDefaultAstIdenticalAfterOptInDispatch':True,'otherWindowsMethodsUnchanged':len(ma)-2,'onlyNewWindowsMethod':'bounded_pause_stability','allPlansSchemaChecked':checked,'otherGamesOptInUnchanged':True,'unchangedMacosAndroidAndWorkflow':unchanged_sources,'finalTestLog':record((HERE/'tests-final.log').read_bytes()),'finalSyntheticTests':53,'skipped':0,'originalReportsReclassified':False,'nativeTestsExecuted':False,'workflowDispatches':0}
(HERE/'static-validation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'status':'passed','schemaPlans':len(checked),'unchangedOriginalTestMethodsAndFixtures':len(unchanged),'finalSyntheticTests':53,'candidateFiles':records},indent=2))
