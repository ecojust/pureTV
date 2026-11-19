#!/usr/bin/env python3
"""Bound opaque Foundation atomic-write remnants in read-only evidence exports."""
import hashlib,os,re,tempfile,textwrap,unittest
from pathlib import Path,PurePosixPath
from types import SimpleNamespace
WORKFLOW=Path(__file__).resolve().parents[4]/'.github/workflows/joystick-catalog-macos-evidence.yml'
source=WORKFLOW.read_text();start=source.index("          allowed={'.json'");end=source.index("          plan=os.environ",start);VALIDATION=textwrap.dedent(source[start:end])
class EvidenceFiles(unittest.TestCase):
 def validate(self,root,kind='qa-intel'):
  scope={'artifact':root,'capability':False,'os':SimpleNamespace(environ={'EVIDENCE_KIND':kind}),'Path':Path,'PurePosixPath':PurePosixPath,'re':re,'hashlib':hashlib}
  exec(compile(VALIDATION,str(WORKFLOW),'exec'),scope);return scope
 def check(self,path,kind='qa-intel',size=10):
  with tempfile.TemporaryDirectory() as temporary:return self.validate(Path(temporary))['atomic_diagnostic_temporary'](path,kind,size)
 def test_exact_original_file_is_retained_as_opaque_bytes(self):
  with tempfile.TemporaryDirectory() as temporary:
   root=Path(temporary);relative='ponpoko-kart/native/diagnostics/.dat.nosync537F.s44g2n';p=root/relative;p.parent.mkdir(parents=True);data=b'not JSON\0\xfforiginal bytes';p.write_bytes(data)
   value=self.validate(root);self.assertEqual(value['atomic_temporaries'],{relative:{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}});self.assertEqual(p.read_bytes(),data)
 def test_only_bounded_qa_modes_and_safe_exact_paths(self):
  original='ponpoko-kart/native/diagnostics/.dat.nosync537F.s44g2n'
  for kind in ('plan','build','capability-intel','unknown'):
   with self.subTest(kind=kind):self.assertFalse(self.check(original,kind))
  for path in ('/x/'+original,'../'+original,original.replace('/native/','/assets/'),original.replace('/diagnostics/','/docs/'),original.replace('/native/','/native//'),original.replace('ponpoko-kart','../ponpoko-kart'),original.replace('537F','a'*17),original+'x'*17,original.replace('.dat.nosync','.other.'),original.replace('.s44g2n','.sh'),original.replace('/native/','\\native/')):
   with self.subTest(path=path):self.assertFalse(self.check(path))
  self.assertTrue(self.check(original.replace('native','rosetta').replace('diagnostics','diagnostics-restart'),'qa-arm64'))
 def test_per_file_size_and_kind_are_not_coerced(self):
  name='ponpoko-kart/native/diagnostics/.dat.nosync537F.s44g2n'
  self.assertTrue(self.check(name,size=8_000_000));self.assertTrue(self.check(name,size=0))
  for size in (-1,8_000_001,True,'20'):
   with self.subTest(size=size):self.assertFalse(self.check(name,size=size))
 def test_symlink_is_rejected_before_bytes_are_read(self):
  with tempfile.TemporaryDirectory() as temporary:
   root=Path(temporary)/'artifact';root.mkdir();target=Path(temporary)/'outside';target.write_text('preserve')
   p=root/'ponpoko-kart/native/diagnostics/.dat.nosync537F.s44g2n';p.parent.mkdir(parents=True);p.symlink_to(target)
   with self.assertRaisesRegex(AssertionError,'Symlink'):self.validate(root)
   self.assertEqual(target.read_text(),'preserve')
 def test_unknown_extensions_are_still_rejected(self):
  with tempfile.TemporaryDirectory() as temporary:
   root=Path(temporary);(root/'unknown.bin').write_bytes(b'original')
   with self.assertRaisesRegex(AssertionError,'Unexpected non-evidence'):self.validate(root)
 def test_count_and_total_temporary_budgets_fail_closed(self):
  with tempfile.TemporaryDirectory() as temporary:
   root=Path(temporary);folder=root/'ponpoko-kart/native/diagnostics';folder.mkdir(parents=True)
   for i in range(17):(folder/('.dat.nosync'+str(i)+'.raw')).write_bytes(b'x')
   with self.assertRaisesRegex(AssertionError,'temporary budget'):self.validate(root)
   for p in folder.iterdir():p.unlink()
   for i in range(3):
    with (folder/('.dat.nosync'+str(i)+'.raw')).open('wb') as stream:stream.truncate(6_000_000)
   with self.assertRaisesRegex(AssertionError,'temporary budget'):self.validate(root)
 def test_original_batch_membership_is_required(self):
  line=next(line.strip() for line in source.splitlines() if "assert all(name.split('/')[0]" in line)
  scope={'atomic_temporaries':{'ponpoko-kart/native/diagnostics/.dat.nosync537F.s44g2n':{}},'report':{'games':[{'game':'ponpoko-kart'}]}};exec(line,scope)
  scope['report']={'games':[{'game':'night-racer'}]}
  with self.assertRaisesRegex(AssertionError,'outside original batch'):exec(line,scope)
if __name__=='__main__':unittest.main()
