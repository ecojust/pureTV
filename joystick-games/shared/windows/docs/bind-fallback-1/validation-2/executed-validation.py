from pathlib import Path
import subprocess,json,os,hashlib,datetime
root=Path('/dev/shm/puretv-submit');out=Path('/dev/shm/windows-host-tmp/bind-fallback-validation-2');out.mkdir(exist_ok=False);binary=out/'controller-bind-test'
paths=['joystick-games/shared/windows/Sources/main.cpp','joystick-games/shared/windows/Sources/ControllerBind.hpp','joystick-games/shared/windows/tests/controller-bind.test.cpp','joystick-games/shared/windows/CMakeLists.txt'];sources=[]
for path in paths:
 b=(root/path).read_bytes();p=out/'executed-source'/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);sources.append({'path':path,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
commands=[['g++','-std=c++17','-O2','-DNDEBUG','-Wall','-Wextra','-Werror','-I',str(root/'joystick-games/shared/windows/Sources'),str(root/'joystick-games/shared/windows/tests/controller-bind.test.cpp'),'-o',str(binary)],[str(binary)]];runs=[]
for n,command in enumerate(commands,1):
 r=subprocess.run(command,cwd=root,env={**os.environ,'TMPDIR':'/dev/shm/windows-host-tmp','PYTHONDONTWRITEBYTECODE':'1'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT);log=out/f'{n}.log';log.write_bytes(r.stdout);runs.append({'argv':command,'returncode':r.returncode,'log':log.name,'bytes':len(r.stdout),'sha256':hashlib.sha256(r.stdout).hexdigest()});print(r.stdout.decode(errors='replace'))
 if r.returncode:break
result={'status':'passed' if len(runs)==2 and all(x['returncode']==0 for x in runs) else 'failed','scope':'Linux optimized NDEBUG build and seven synthetic binder-policy cases; require() checks remain active in Release. Does not compile or run the _WIN32 native branch or production WebView host. CMake unavailable; first attempt preserved.','nativeWindowsValidated':False,'cmakeIntegrationValidated':False,'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceFiles':sources,'commands':runs};(out/'result.json').write_text(json.dumps(result,indent=2)+'\n');assert result['status']=='passed'
