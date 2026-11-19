from pathlib import Path
import importlib.util,json,os,subprocess,time
ROOT=Path('/dev/shm/puretv-submit');HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('trace',HERE/'trace-session-smoke-attempt-2/executed-android-qemu-stack.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
out=HERE/'trace-session-smoke-attempt-2'
for mode in ['fatal','handled','timeout']:
 child=subprocess.Popen([str(HERE/'signal-fixture'),mode],stdout=subprocess.PIPE,stderr=subprocess.PIPE);assert child.stdout.readline()==b'ready\n';expected=m.proc_identity(child.pid);capture=m.TraceSession(expected,out/mode,gdb_path=HERE/'minimal/usr/bin/gdb',seconds=.1 if mode=='timeout' else 5,environment={'PATH':'/usr/bin:/bin','LANG':'C','LC_ALL':'C','LD_LIBRARY_PATH':str(HERE/'minimal/usr/lib/x86_64-linux-gnu')},module_roots=[HERE,'/usr/lib','/lib']);error=None
 try:
  assert capture.start(),capture.report
  deadline=time.monotonic()+7
  while time.monotonic()<deadline and child.poll() is None:
   capture.tick();time.sleep(.01)
  capture.finish();stdout,stderr=child.communicate(timeout=3)
  result={'mode':mode,'originalParentWait':child.returncode,'events':len(capture.report['events']),'cleanup':capture.report['cleanup'],'status':capture.report['status'],'stdout':stdout.decode(),'stderr':stderr.decode()};(out/(mode+'-result.json')).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result),flush=True)
  assert child.returncode==(0 if mode=='timeout' else -11),result
  assert capture.report['cleanup']['confirmed'],result
  if mode=='handled':assert len(capture.report['events'])==2 and 'handled' in stdout.decode()
 finally:
  capture.finish()
  if child.poll() is None:child.terminate();child.wait(timeout=3)
