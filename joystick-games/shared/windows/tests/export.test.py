#!/usr/bin/env python3
"""Synthetic path boundaries and real temporary Git blobs; no game or upload."""
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('windows_export',Path(__file__).resolve().parents[3]/'tools/windows-export.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
PATH='joystick-games/tools/windows-verify.py'
# This exact Windows key is visible in original Win10 run 44605307930's
# FileNotFoundError. The payload below is a synthetic Git fixture, not native QA.
WINDOWS_KEY=r'joystick-games\tools\windows-verify.py'
PAYLOAD=b'original frozen QA source\n'
DIGEST=hashlib.sha256(PAYLOAD).hexdigest()

class PathTests(unittest.TestCase):
    def test_two_original_win10_reports_retain_all_seven_source_hashes(self):
        fixture=json.loads((Path(__file__).parent/'fixtures/win10-source-hashes.json').read_text())
        self.assertEqual(fixture['sourceRunId'],44605307930)
        self.assertEqual(set(fixture['reports']),{'runtime-normal','runtime-occupied'})
        for report in fixture['reports'].values():
            before=copy.deepcopy(report['sourceHashes']);normalized=m.canonical_source_hashes(before)
            self.assertEqual(len(normalized),7)
            self.assertEqual(normalized[PATH],{'reportedPath':WINDOWS_KEY,'sha256':'5b235e7bdf55b8cde2d64bbe2a765fb7b7b2c1522258eae27a28c5636397c755'})
            self.assertEqual(sum(value['reportedPath']!=key for key,value in normalized.items()),5)
            self.assertEqual(before,report['sourceHashes'])

    def test_original_win10_key_and_new_posix_key_have_one_canonical_path(self):
        for key in [WINDOWS_KEY,PATH]:
            original={key:DIGEST};before=copy.deepcopy(original)
            self.assertEqual(m.canonical_source_hashes(original),{PATH:{'reportedPath':key,'sha256':DIGEST}})
            self.assertEqual(original,before)

    def test_unsafe_or_ambiguous_paths_rejected(self):
        names=['','/etc/passwd',r'\root\x',r'\\server\share\x',r'C:\source\x','C:x','../x','a/../x','a/./x','a//x','a/','a\\','a%2fb','é.py','a./x','a/b\\c','a/'*16+'x','a'*1025]
        for name in names:
            with self.subTest(name=name),self.assertRaises(AssertionError):m.canonical_source_hashes({name:DIGEST})

    def test_alias_and_case_collisions_rejected(self):
        for other in [WINDOWS_KEY,PATH.upper()]:
            with self.assertRaises(AssertionError):m.canonical_source_hashes({PATH:DIGEST,other:DIGEST})

    def test_invalid_hash_or_empty_source_set_rejected(self):
        for value in ['',DIGEST.upper(),'a'*63,None,True]:
            with self.assertRaises(AssertionError):m.canonical_source_hashes({PATH:value})
        with self.assertRaises(AssertionError):m.canonical_source_hashes({})

class GitBindingTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
        self.path=self.root/PATH;self.path.parent.mkdir(parents=True);self.path.write_bytes(PAYLOAD)
        self.git('init','--quiet');self.git('config','core.autocrlf','false');self.git('add','--',PATH)
        self.commit();self.source=self.git('rev-parse','HEAD').decode().strip()
        self.inputs={PATH:{'bytes':len(PAYLOAD),'sha256':DIGEST}}
    def git(self,*args):
        return subprocess.check_output(['git','-C',str(self.root),*args],stderr=subprocess.PIPE)
    def commit(self):
        self.git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','Synthetic source fixture')
    def verify(self,values=None,inputs=None,source=None):
        return m.verify_source_hashes(self.root,source or self.source,values or {WINDOWS_KEY:DIGEST},self.inputs if inputs is None else inputs)

    def test_original_windows_path_binds_identical_frozen_git_bytes(self):
        self.assertEqual(self.verify(),[{'reportedPath':WINDOWS_KEY,'canonicalPath':PATH,'bytes':len(PAYLOAD),'sha256':DIGEST}])
        self.assertEqual(self.verify({PATH:DIGEST}),[])

    def test_manifest_membership_bytes_and_hash_are_mandatory(self):
        for inputs in [{},{PATH:{'bytes':len(PAYLOAD)+1,'sha256':DIGEST}},{PATH:{'bytes':True,'sha256':DIGEST}},{PATH:{'bytes':len(PAYLOAD),'sha256':'b'*64}}]:
            with self.assertRaises(AssertionError):self.verify(inputs=inputs)

    def test_report_and_manifest_cannot_agree_on_non_git_bytes(self):
        modified=b'changed source\n';digest=hashlib.sha256(modified).hexdigest()
        self.path.write_bytes(modified)
        with self.assertRaisesRegex(AssertionError,'frozen Git bytes'):
            self.verify({WINDOWS_KEY:digest},{PATH:{'bytes':len(modified),'sha256':digest}})

    def test_checkout_change_is_rejected_even_when_report_matches_git(self):
        self.path.write_bytes(b'modified checkout\n')
        with self.assertRaisesRegex(AssertionError,'Checkout differs'):self.verify()

    def test_explicit_original_commit_is_authority_not_new_head(self):
        self.path.write_bytes(b'new commit\n');self.git('add','--',PATH);self.commit()
        self.assertNotEqual(self.git('rev-parse','HEAD').decode().strip(),self.source)
        self.path.write_bytes(PAYLOAD)
        self.assertEqual(self.verify()[0]['sha256'],DIGEST)

    @unittest.skipIf(os.name=='nt','Creating symlinks requires Windows privileges; export runs on Linux')
    def test_git_symlink_and_checkout_symlink_are_rejected(self):
        self.path.unlink();self.path.symlink_to('other.py')
        with self.assertRaisesRegex(AssertionError,'Symlink'):self.verify()
        self.git('add','--',PATH);self.commit();source=self.git('rev-parse','HEAD').decode().strip()
        digest=hashlib.sha256(b'other.py').hexdigest()
        with self.assertRaisesRegex(AssertionError,'regular blob'):
            self.verify({WINDOWS_KEY:digest},{PATH:{'bytes':8,'sha256':digest}},source)

    def test_source_sha_and_git_path_must_be_exact(self):
        with self.assertRaises(AssertionError):self.verify(source='HEAD')
        with self.assertRaises(AssertionError):self.verify({'other.py':DIGEST},{'other.py':self.inputs[PATH]})

if __name__=='__main__':unittest.main()
