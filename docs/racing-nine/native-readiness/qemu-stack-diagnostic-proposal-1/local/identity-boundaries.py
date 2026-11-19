"""Local ownership gate prototype; never invokes a debugger or signals a target."""
from pathlib import Path
import hashlib,json,os,subprocess,unittest
ROOT=Path(__file__).resolve().parent

def identity(pid):
 assert type(pid) is int and pid>1 and pid!=os.getpid()
 base=Path('/proc')/str(pid);parts=(base/'stat').read_text().rsplit(')',1)[1].split();start=int(parts[19]);assert parts[0]!='Z'
 executable=base/'exe';sha=hashlib.sha256(executable.read_bytes()).hexdigest();path=str(executable.resolve(strict=True))
 status=(base/'status').read_text();tracer=int(next(x.split(':',1)[1] for x in status.splitlines() if x.startswith('TracerPid:')))
 again=(base/'stat').read_text().rsplit(')',1)[1].split();assert int(again[19])==start and again[0]!='Z'
 return {'pid':pid,'starttimeTicks':start,'parentPid':int(parts[1]),'executableSha256':sha,'executablePath':path,'tracerPid':tracer}

def validate(expected):
 assert expected['parentPid']==os.getpid()
 actual=identity(expected['pid']);assert actual==expected
 assert actual['tracerPid']==0
 return actual

class Boundaries(unittest.TestCase):
 def setUp(self):
  self.child=subprocess.Popen([str(ROOT/'attach-fixture')]);self.expected=identity(self.child.pid)
 def tearDown(self):
  if self.child.poll() is None:self.child.terminate()
  self.child.wait(timeout=3)
 def test_owned_actual_process_passes_without_attaching(self):self.assertEqual(validate(self.expected),self.expected)
 def test_recycled_start_identity_rejected(self):
  bad=dict(self.expected,starttimeTicks=self.expected['starttimeTicks']+1)
  with self.assertRaises(AssertionError):validate(bad)
 def test_wrong_parent_rejected(self):
  with self.assertRaises(AssertionError):validate(dict(self.expected,parentPid=os.getpid()+1))
 def test_wrong_executable_hash_rejected(self):
  with self.assertRaises(AssertionError):validate(dict(self.expected,executableSha256='0'*64))
 def test_wrong_path_rejected(self):
  with self.assertRaises(AssertionError):validate(dict(self.expected,executablePath='/other/fixture'))
 def test_false_pid_zero_and_self_rejected(self):
  for pid in [False,0,1,os.getpid()]:
   with self.subTest(pid=pid),self.assertRaises(AssertionError):validate(dict(self.expected,pid=pid))
 def test_preexisting_tracer_identity_rejected(self):
  with self.assertRaises(AssertionError):validate(dict(self.expected,tracerPid=123))
 def test_exited_original_process_rejected(self):
  self.child.terminate();self.child.wait(timeout=3)
  with self.assertRaises((AssertionError,OSError)):validate(self.expected)

if __name__=='__main__':unittest.main(verbosity=2)
