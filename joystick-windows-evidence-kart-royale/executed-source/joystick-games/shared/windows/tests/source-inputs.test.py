#!/usr/bin/env python3
import importlib.util,subprocess,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
spec=importlib.util.spec_from_file_location('windows_builder',ROOT/'joystick-games/tools/windows-build.py');builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
class FrozenInputs(unittest.TestCase):
    def test_long_path_retains_exact_committed_bytes_and_detects_change(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);original=builder.ROOT;builder.ROOT=root
            try:
                def git(*args):return subprocess.check_output(['git','-C',str(root),*args])
                git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');git('config','core.autocrlf','false');git('config','core.longpaths','true')
                relative='/'.join(['native-evidence-segment-'+str(i) for i in range(13)]+['observed-source.txt']);self.assertGreater(len(relative),260)
                path=root/relative;path.parent.mkdir(parents=True);content=b'actual frozen bytes\r\nwith Windows line endings\r\n';path.write_bytes(content)
                git('add','.');git('commit','-qm','fixed input fixture');sha=git('rev-parse','HEAD').decode().strip()
                mapping=builder.committed_blobs(sha);self.assertEqual(builder.committed_bytes(mapping,relative),content)
                path.write_bytes(content+b'local mutation');self.assertNotEqual(path.read_bytes(),builder.committed_bytes(mapping,relative))
                self.assertEqual(builder.committed_bytes(mapping,relative),content,'Original object unchanged')
            finally:builder.ROOT=original
    def test_untracked_and_symlink_entries_are_rejected(self):
        with self.assertRaises(AssertionError):builder.committed_bytes({},'untracked')
        with self.assertRaises(AssertionError):builder.committed_bytes({'link':{'mode':'120000','oid':'0'*40}},'link')
if __name__=='__main__':unittest.main()
