from pathlib import Path
import subprocess,json,os,hashlib,datetime
root=Path('/dev/shm/puretv-submit');out=Path('/dev/shm/windows-host-tmp/bind-fallback-validation-1');out.mkdir(exist_ok=False);build=out/'cmake-build';deps=out/'unused-dependencies';deps.mkdir()
paths=['joystick-games/shared/windows/Sources/main.cpp','joystick-games/shared/windows/Sources/ControllerBind.hpp','joystick-games/shared/windows/tests/controller-bind.test.cpp','joystick-games/shared/windows/CMakeLists.txt'];sources=[]
for path in paths:
 src=root/path;data=src.read_bytes();target=out/'executed-source'/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);sources.append({'path':path,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
commands=[['cmake','-S',str(root/'joystick-games/shared/windows'),'-B',str(build),'-DPURETV_DEPS='+str(deps),'-DCMAKE_BUILD_TYPE=Release'],['cmake','--build',str(build),'--target','controller-bind-test'],['ctest','--test-dir',str(build),'-R','^controller-bind$','--output-on-failure','-V']];runs=[]
for n,command in enumerate(commands,1):
 r=subprocess.run(command,cwd=root,env={**os.environ,'TMPDIR':'/dev/shm/windows-host-tmp','PYTHONDONTWRITEBYTECODE':'1'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT);p=out/f'{n}.log';p.write_bytes(r.stdout);runs.append({'argv':command,'returncode':r.returncode,'log':p.name,'bytes':len(r.stdout),'sha256':hashlib.sha256(r.stdout).hexdigest()});print(r.stdout.decode(errors='replace'))
 if r.returncode:break
result={'status':'passed' if len(runs)==3 and all(r['returncode']==0 for r in runs) else 'failed','scope':'First CMake Release build and CTest integration of the new binder target on Linux; seven synthetic policy cases. Actual Windows socket tests explicitly not run on this platform. No native game or other tests rerun.','nativeWindowsValidated':False,'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceFiles':sources,'commands':runs};(out/'result.json').write_text(json.dumps(result,indent=2)+'\n');assert result['status']=='passed'
