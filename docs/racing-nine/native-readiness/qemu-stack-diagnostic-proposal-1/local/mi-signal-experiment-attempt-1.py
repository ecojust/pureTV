from pathlib import Path
import collections,hashlib,json,os,re,selectors,subprocess,time
ROOT=Path(__file__).resolve().parent
class MI:
 def __init__(self):
  self.p=subprocess.Popen([str(ROOT/'minimal/usr/bin/gdb'),'-q','-nx','-nh','--interpreter=mi2'],env=dict(os.environ,LD_LIBRARY_PATH=str(ROOT/'minimal/usr/lib/x86_64-linux-gnu')),stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  self.sel=selectors.DefaultSelector();self.sel.register(self.p.stdout,selectors.EVENT_READ);self.sel.register(self.p.stderr,selectors.EVENT_READ);self.buf={self.p.stdout:b'',self.p.stderr:b''};self.lines=[];self.events=collections.deque();self.seq=0;self.commands=[]
 def next(self,deadline):
  while time.monotonic()<deadline:
   for fd,key in self.sel.select(max(0,deadline-time.monotonic())):
    data=os.read(fd.fileobj.fileno(),65536)
    if not data:self.sel.unregister(fd.fileobj);continue
    self.buf[fd.fileobj]+=data
    assert len(self.buf[fd.fileobj])<65536
    while b'\n' in self.buf[fd.fileobj]:
     line,self.buf[fd.fileobj]=self.buf[fd.fileobj].split(b'\n',1);text=line.decode(errors='replace');self.lines.append(text)
     if text.startswith('*stopped'):self.events.append(text)
     yield text
 def command(self,value):
  self.seq+=1;token=str(self.seq);self.commands.append(value);self.p.stdin.write((token+value+'\n').encode());self.p.stdin.flush()
  for line in self.next(time.monotonic()+3):
   if line.startswith(token+'^'):
    assert not line.startswith(token+'^error'),line
    return line
  raise TimeoutError(value)
 def stop(self):
  if self.events:return self.events.popleft()
  for _ in self.next(time.monotonic()+3):
   if self.events:return self.events.popleft()
  raise TimeoutError('stop')
 def close(self):
  if self.p.poll() is None:
   try:self.command('-gdb-exit')
   except Exception:pass
  self.p.wait(timeout=3);self.sel.close()

def case(mode,detach_at_fault=False):
 child=subprocess.Popen([str(ROOT/'signal-fixture'),mode],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 assert child.stdout.readline()==b'ready\n';mi=MI();report={'mode':mode,'detachAtFault':detach_at_fault,'pid':child.pid,'stops':[]}
 try:
  for cmd in ['-gdb-set pagination off','-gdb-set confirm off','-gdb-set auto-load off','-gdb-set debuginfod enabled off','-gdb-set print frame-arguments none','-gdb-set print entry-values no','-gdb-set mi-async on','-interpreter-exec console "handle all nostop noprint pass"','-interpreter-exec console "handle SIGSEGV stop print pass"']:
   mi.command(cmd)
  mi.command('-target-attach '+str(child.pid));mi.events.clear();mi.command('-exec-continue')
  if mode=='timeout':
   mi.command('-exec-interrupt');report['interruptStop']=mi.stop();mi.command('-target-detach');report['targetAliveAfterDetach']=child.poll() is None
  else:
   for _ in range(2 if mode=='handled' else 1):
    event=mi.stop();assert 'signal-name="SIGSEGV"' in event,event;report['stops'].append(event);report.setdefault('stacks',[]).append(mi.command('-stack-list-frames --no-frame-filters 0 11'))
    if detach_at_fault:mi.command('-target-detach');break
    mi.command('-exec-continue')
  stdout,stderr=child.communicate(timeout=3);report.update(originalParentWait=child.returncode,targetStdout=stdout.decode(),targetStderr=stderr.decode(),commands=mi.commands)
  assert child.returncode==(0 if mode=='timeout' else -11),report
  if mode=='handled':assert 'handled' in stdout.decode()
  if mode=='timeout':assert report['targetAliveAfterDetach'] and b'continued-after-detach' in stdout
  assert 'DO_NOT_ARCHIVE_ARGUMENT_OR_LOCAL_SECRET' not in '\n'.join(mi.lines)
  report['argumentAndLocalSecretAbsent']=True;report['status']='passed'
 finally:
  try:mi.close()
  finally:
   if child.poll() is None:child.terminate();child.wait(timeout=3)
 (ROOT/(mode+('-detach-fault' if detach_at_fault else '')+'.json')).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['mode','detachAtFault','originalParentWait','status']}),flush=True)

for mode,detach in [('fatal',False),('handled',False),('timeout',False),('fatal',True)]:case(mode,detach)
