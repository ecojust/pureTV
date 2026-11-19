import hashlib,importlib.util,json,subprocess
from pathlib import Path
root=Path('/dev/shm/puretv-submit');out=Path(__file__).resolve().parent;p=root/'joystick-games/night-racer/qa-plan.json';old=p.read_bytes();(out/'qa-plan-before.json').write_bytes(old);before=json.loads(old);assert len(before['steps'])==20 and all('menuTap' not in x for x in before['steps'])
after=json.loads(old)
for step in after['steps'][:11]:step['menuTap']=True
p.write_text(json.dumps(after,indent=2)+'\n');(out/'qa-plan-after.json').write_bytes(p.read_bytes())
check=json.loads(p.read_bytes())
for step in check['steps'][:11]:assert step.pop('menuTap') is True
assert check==before;assert after['steps'][11:]==before['steps'][11:]
spec=importlib.util.spec_from_file_location('qa',root/'joystick-games/tools/qa-plan.py');qa=importlib.util.module_from_spec(spec);spec.loader.exec_module(qa);qa.validate_plan(after)
diff=subprocess.check_output(['git','diff','--','joystick-games/night-racer/qa-plan.json'],cwd=root);(out/'qa-plan.diff').write_bytes(diff)
sha=lambda b:hashlib.sha256(b).hexdigest();summary={'status':'passed-plan-only','baseCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'markedIndices':list(range(11)),'changedFieldsOnly':'menuTap:true added to first 11 menu steps','originalKeysHoldMsExpectUnchanged':True,'remainingNineGameplayStepsUnchanged':True,'strictSchemaPassed':True,'nativeExecutionPerformed':False,'testsOrGameSourceChanged':False,'before':{'bytes':len(old),'sha256':sha(old)},'after':{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())},'schemaValidator':{'path':'joystick-games/tools/qa-plan.py','sha256':sha((root/'joystick-games/tools/qa-plan.py').read_bytes())}}
(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary))
