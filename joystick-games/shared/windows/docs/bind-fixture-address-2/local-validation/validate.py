from pathlib import Path
import hashlib,json,os,re,subprocess
ROOT=Path('/dev/shm/puretv-submit')
OUT=Path(__file__).resolve().parent
SOURCE='772c99ae35583ad1594cd9fffcc6368aa4df7201'
TEST='joystick-games/shared/windows/tests/controller-bind.test.cpp'
UNCHANGED=['joystick-games/shared/windows/Sources/main.cpp','joystick-games/shared/windows/Sources/ControllerBind.hpp','joystick-games/shared/windows/CMakeLists.txt','joystick-games/tools/windows-evidence.py']
def rec(raw):return {'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
def git(path):return subprocess.check_output(['git','show',SOURCE+':'+path],cwd=ROOT)
result={'baselineSourceCommit':SOURCE,'sourceFiles':{},'unchangedProductionAndIntegration':{},'nativeWindowsExecutedLocally':False}
for path in UNCHANGED:
 raw=(ROOT/path).read_bytes();assert raw==git(path),path
 result['unchangedProductionAndIntegration'][path]=rec(raw)
raw=(ROOT/TEST).read_bytes();old=git(TEST)
(OUT/'executed-controller-bind.test.cpp').write_bytes(raw)
(OUT/'previous-controller-bind.test.cpp').write_bytes(old)
result['sourceFiles'][TEST]=rec(raw)
begin=b'static void policy(){';end=b'\n#ifdef _WIN32\nstruct Wsa'
assert raw[raw.index(begin):raw.index(end)]==old[old.index(begin):old.index(end)]
for pair in ('false,false','true,false','false,true','true,true'):
 assert raw.count(('nativeBoundSocket('+pair+')').encode())==1
assert b'const int expectedError=specific?WSAEACCES:WSAEADDRINUSE;' in raw
assert b'WSAENOTSOCK' in raw and b'attempts==1' in raw
assert b'preferred=DefaultControllerPort' in (ROOT/UNCHANGED[1]).read_bytes()
command=['g++','-std=c++17','-O2','-DNDEBUG','-Wall','-Wextra','-Werror','-I',str(ROOT/'joystick-games/shared/windows/Sources'),str(ROOT/TEST),'-o',str(OUT/'controller-bind-test')]
env={**os.environ,'TMPDIR':str(OUT),'PYTHONDONTWRITEBYTECODE':'1'}
compiled=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env)
(OUT/'compile.log').write_bytes(compiled.stdout);assert compiled.returncode==0
tested=subprocess.run([str(OUT/'controller-bind-test')],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env,timeout=20)
(OUT/'tests.log').write_bytes(tested.stdout);assert tested.returncode==0
assert b'synthetic-policy-cases=7 passed' in tested.stdout and b'actual-windows-cases=NOT-RUN' in tested.stdout
result.update({'compile':{'command':command,'exitCode':compiled.returncode},'portablePolicy':{'exitCode':tested.returncode,'caseCount':7,'nativeWindowsCaseCount':0},'unchangedPolicyFunction':True,'expectedWindowsCases':[{'holderListening':listening,'candidateAddress':address,'requiredError':error,'requiredStableConnections':3} for listening in (False,True) for address,error in (('0.0.0.0',10048),('127.0.0.1',10013))],'invalidSocketRequiredError':10038,'status':'portable_policy_passed_native_cases_pending'})
(OUT/'validation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
