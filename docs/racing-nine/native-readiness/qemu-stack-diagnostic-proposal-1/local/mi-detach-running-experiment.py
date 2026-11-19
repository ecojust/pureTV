from pathlib import Path
import importlib.util,json,subprocess
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('local_mi',ROOT/'mi-signal-experiment.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
child=subprocess.Popen([str(ROOT/'signal-fixture'),'timeout'],stdout=subprocess.PIPE,stderr=subprocess.PIPE);assert child.stdout.readline()==b'ready\n';mi=m.MI();report={'scope':'Controlled local ELF only','artificialInterruptSent':False}
try:
 for cmd in ['-gdb-set confirm off','-gdb-set auto-load off','-gdb-set debuginfod enabled off','-gdb-set print frame-arguments none','-gdb-set print entry-values no','-gdb-set mi-async on','-interpreter-exec console "handle all nostop noprint pass"','-interpreter-exec console "handle SIGSEGV stop print pass"','-interpreter-exec console "handle SIGINT stop print pass"']:
  mi.command(cmd)
 mi.command('-target-attach '+str(child.pid));mi.stop();mi.command('-exec-continue')
 report['detachResponse']=mi.command('-target-detach');report['aliveAfterDetach']=child.poll() is None;stdout,stderr=child.communicate(timeout=3);report['originalParentWait']=child.returncode;report['stdout']=stdout.decode();report['stderr']=stderr.decode();assert child.returncode==0 and report['aliveAfterDetach'];report['status']='passed'
except Exception as e:report['status']='failed';report['error']=str(e);raise
finally:
 try:mi.close()
 finally:
  if child.poll() is None:child.terminate();child.wait(timeout=3)
 report['commands']=mi.commands;(ROOT/'detach-running.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
