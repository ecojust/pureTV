import ast,hashlib,importlib.util,json,os,subprocess,sys,time,fnmatch,tempfile,types
from pathlib import Path
R=Path('/dev/shm/puretv-submit');S=Path(__file__).parent;C=S/'candidate-minimal';BASE='c5ad63e8c6a0ccfada5f763d1d26afa27f45002e';PLAN='ff645cc2f195d4071150be1fffd2b7952c265129'
def git(*args):return subprocess.check_output(['git',*args],cwd=R)
def blob(n):return git('show',BASE+':'+n)
def rec(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
plan='joystick-games/penguintrack/qa-plan.json';inputs='joystick-games/tools/android-runtime-inputs.py';tests='joystick-games/tools/android-tests.py'
sourcefiles=[{'path':n,**rec((C/n).read_bytes())} for n in [plan,inputs,tests]]
protected=['.github/workflows/joystick-catalog-android-runtime.yml','joystick-games/qa/android/run.py','joystick-games/qa/android/test_runner.py','joystick-games/tools/qa-plan.py','joystick-games/tools/android-catalog.py','joystick-games/tools/android-build.py','joystick-games/qa/android/build-observer.py','joystick-games/qa/android/src/com/ecojust/controllerqa/Observer.java']
for n in protected:assert (C/n).read_bytes()==blob(n)
log=S/'minimal-android-tests.log';assert b'Ran 20 tests' in log.read_bytes() and log.read_text().rstrip().endswith('OK')
result=types.SimpleNamespace(returncode=0);start=time.monotonic();tempfile.tempdir=str(S)
script=(S/'minimal.py').read_text();tail=script[script.index('# Actual original payload'):];exec(compile(tail,str(S/'minimal.py'),'exec'))
