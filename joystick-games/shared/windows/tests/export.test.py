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



GAME='dirt-crown'
SOURCE='a'*40
BINARY='b'*64
ZIP='DirtCrown-0.1.0-windows-x64.zip'
EXE='DirtCrown-0.1.0-windows-x64-setup.exe'

def retention_fixture():
    repository={'id':9,'full_name':m.REPO}
    run={'id':123,'run_attempt':2,'head_sha':SOURCE,'head_branch':'build-source/fixture','path':m.WORKFLOW,'event':'workflow_dispatch','status':'in_progress','repository':repository,'head_repository':copy.deepcopy(repository)}
    def step(name,number,start,end,conclusion='success'):
        return {'name':name,'number':number,'status':'completed','conclusion':conclusion,'started_at':'2026-11-19T09:'+start+':00Z','completed_at':'2026-11-19T09:'+end+':00Z'}
    job={'id':456,'name':'verify ('+GAME+')','run_id':123,'run_attempt':2,'head_sha':SOURCE,'status':'completed','conclusion':'failure','started_at':'2026-11-19T09:00:00Z','completed_at':'2026-11-19T09:10:00Z','steps':[step(m.BUILD_STEP,6,'01','04'),step('Run actions/upload-artifact@v4',11,'07','08'),step('Run actions/upload-artifact@v4',12,'08','09')]}
    artifact={'id':789,'name':'joystick-windows-packages-'+GAME,'expired':False,'expires_at':'2099-01-01T00:00:00Z','created_at':'2026-11-19T09:09:00Z','size_in_bytes':1234,'digest':'sha256:'+'c'*64,'workflow_run':{'id':123,'head_sha':SOURCE,'head_branch':run['head_branch'],'repository_id':9,'head_repository_id':9}}
    return {'run':run,'jobs':[job],'artifacts':[artifact],'game':GAME,'source':SOURCE,'run_id':123,'attempt':2}

def report_fixture():
    installed={'status':'passed','game':GAME,'sourceCommit':SOURCE,'binarySha256':BINARY,'installedBytesMatchPortable':True,'completeFileSetVerified':True,'uninstallPreservesUnrelatedFiles':True,'uninstallRemovesOnlyPackagedFiles':True}
    report={'status':'passed','game':GAME,'qaSourceCommit':SOURCE,'binarySha256':BINARY,'sourceHashes':{PATH:DIGEST},'tests':[{'status':'passed'} for _ in range(10)],'storageRestart':{'status':'passed','initialHydrationEqual':True,'cleanBrowserCacheVerified':True,'nativeSavedAfterQuit':{'fixture.save':'{"level":1}'}},'qaPlan':{'storageRestartRequired':True}}
    return {'game':GAME,'source':SOURCE,'binary_sha':BINARY,'installed':installed,'reports':{'runtime-normal':copy.deepcopy(report),'runtime-occupied':copy.deepcopy(report)},'job_conclusion':'success'}

class RetentionIdentityTests(unittest.TestCase):
    def reject(self,change):
        value=retention_fixture();change(value)
        with self.assertRaises((AssertionError,ValueError,KeyError,TypeError)):m.retained_artifact(**value)
    def test_failed_runtime_job_retains_original_successful_build_and_upload_without_verifying(self):
        value=retention_fixture();before=copy.deepcopy(value);result=m.retained_artifact(**value)
        self.assertEqual(result['producerJobConclusion'],'failure');self.assertEqual(result['artifactId'],789)
        self.assertEqual(result['artifactDigest'],'sha256:'+'c'*64);self.assertTrue(result['retentionIsNotRuntimeVerification']);self.assertNotIn('runtimeVerified',result);self.assertEqual(value,before)
    def test_source_attempt_repository_workflow_and_unique_producer_are_mandatory(self):
        for field,wrong in [('id',124),('run_attempt',3),('head_sha','d'*40),('path','.github/workflows/other.yml'),('event','push'),('status','queued')]:
            with self.subTest(field=field):self.reject(lambda v:v['run'].__setitem__(field,wrong))
        self.reject(lambda v:v['run']['repository'].__setitem__('full_name','other/pureTV'))
        self.reject(lambda v:v['jobs'].append(copy.deepcopy(v['jobs'][0])))
        self.reject(lambda v:v['jobs'][0].__setitem__('run_attempt',1))
        self.reject(lambda v:v['jobs'][0].__setitem__('head_sha','d'*40))
        self.reject(lambda v:v['jobs'][0].__setitem__('status','in_progress'))
    def test_failed_build_or_upload_never_qualifies_for_retention(self):
        for index in (0,2):
            for value in ('failure','skipped','cancelled'):
                with self.subTest(step=index,value=value):self.reject(lambda v:v['jobs'][0]['steps'][index].__setitem__('conclusion',value))
        self.reject(lambda v:v['jobs'][0]['steps'].append(copy.deepcopy(v['jobs'][0]['steps'][0])))
    def test_wrong_expired_missing_digest_and_duplicate_artifact_rejected(self):
        for field,value in [('expired',True),('expires_at','2000-01-01T00:00:00Z'),('digest',None),('digest','sha256:'+'C'*64),('size_in_bytes',0),('size_in_bytes',1000000001),('size_in_bytes',True),('name','joystick-windows-packages-other')]:
            with self.subTest(field=field,value=value):self.reject(lambda v:v['artifacts'][0].__setitem__(field,value))
        self.reject(lambda v:v['artifacts'].append(copy.deepcopy(v['artifacts'][0])))
        for field,value in [('id',122),('head_sha','d'*40),('repository_id',8),('head_branch','other')]:
            with self.subTest(field=field):self.reject(lambda v:v['artifacts'][0]['workflow_run'].__setitem__(field,value))
    def test_artifact_creation_binds_successful_upload_with_only_existing_two_second_tolerance(self):
        value=retention_fixture();value['artifacts'][0]['created_at']='2026-11-19T09:09:02Z';self.assertEqual(m.retained_artifact(**value)['uploadEndOffsetSeconds'],2)
        self.reject(lambda v:v['artifacts'][0].__setitem__('created_at','2026-11-19T09:09:03Z'))
        self.reject(lambda v:v['artifacts'][0].__setitem__('created_at','2026-11-19T09:07:59Z'))
        self.reject(lambda v:v['jobs'][0]['steps'][0].__setitem__('completed_at','2026-11-19T09:08:01Z'))

class RetainedPackageTests(unittest.TestCase):
    def artifact(self):return m.retained_artifact(**retention_fixture())
    def packages(self,first=99999999,second=100000000):return {ZIP:{'bytes':first,'sha256':'d'*64},EXE:{'bytes':second,'sha256':'e'*64}}
    def test_exact_git_boundary_retains_large_original_as_explicit_unpublished_reference(self):
        packages=self.packages();before=copy.deepcopy(packages);result=m.package_export_plan(packages,self.artifact())
        self.assertEqual(result['included'],{ZIP:packages[ZIP]});ref=result['references'][EXE]
        self.assertEqual(ref['sha256'],packages[EXE]['sha256']);self.assertEqual(ref['bytes'],100000000)
        self.assertEqual(ref['sourceRunAttempt'],2);self.assertEqual(ref['artifactDigest'],'sha256:'+'c'*64)
        self.assertFalse(ref['gitBytesIncluded']);self.assertFalse(ref['publicPackageDeliveryComplete']);self.assertEqual(packages,before)
        self.assertEqual(len(m.package_export_plan(self.packages(127999999,127999999),self.artifact())['references']),2)
    def test_limits_names_and_hashes_cannot_be_relaxed_for_failed_qa(self):
        for value in [0,-1,True,128000000]:
            with self.subTest(bytes=value),self.assertRaises(AssertionError):m.package_export_plan(self.packages(value),self.artifact())
        for change in [lambda p:p[ZIP].__setitem__('sha256','bad'),lambda p:p.__setitem__('../'+ZIP,p.pop(ZIP)),lambda p:p.__setitem__('source.py',p.pop(ZIP)),lambda p:p.__setitem__('Other-windows-x64-setup.exe',p.pop(EXE))]:
            value=self.packages();change(value)
            with self.assertRaises(AssertionError):m.package_export_plan(value,self.artifact())
    def test_real_staging_omits_large_package_but_never_removes_original_or_rewrites_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);original=root/'download';folder=original/('joystick-windows-packages-'+GAME);folder.mkdir(parents=True)
            (folder/ZIP).write_bytes(b'exact small original zip fixture');large=folder/EXE
            with large.open('wb') as stream:stream.truncate(m.GIT_FILE_LIMIT)
            evidence=original/'evidence.json';evidence.write_bytes(b'{"status":"failed"}\r\n')
            records=m.stage_export(original,root/'git',[str(large.relative_to(original))])
            self.assertTrue(large.is_file());self.assertEqual(large.stat().st_size,m.GIT_FILE_LIMIT)
            self.assertFalse((root/'git'/large.relative_to(original)).exists());self.assertEqual((root/'git/evidence.json').read_bytes(),evidence.read_bytes())
            self.assertEqual(records['evidence.json']['sha256'],hashlib.sha256(evidence.read_bytes()).hexdigest())
    def test_nonpackage_large_file_or_missing_omission_cannot_enter_git(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);original=root/'download';original.mkdir()
            with (original/'evidence.log').open('wb') as stream:stream.truncate(m.GIT_FILE_LIMIT)
            with self.assertRaisesRegex(AssertionError,'Non-package'):m.stage_export(original,root/'git',[])
            with self.assertRaisesRegex(AssertionError,'Only original package'):m.stage_export(original,root/'git',['evidence.log'])
            (original/'evidence.log').unlink()
            with self.assertRaisesRegex(AssertionError,'Missing referenced'):m.stage_export(original,root/'git',['joystick-windows-packages-'+GAME+'/'+EXE])
    def test_package_bytes_must_match_before_any_status_assessment(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/ZIP;path.write_bytes(b'original');item={'bytes':8,'sha256':hashlib.sha256(b'original').hexdigest()};m.same(path,item)
            path.write_bytes(b'modified')
            with self.assertRaisesRegex(AssertionError,'Original bytes differ'):m.same(path,item)

class DownloadLayoutTests(unittest.TestCase):
    def fixture(self,directory):
        root=Path(directory);(root/('joystick-windows-evidence-'+GAME)).mkdir()
        return root
    def test_failed_build_may_omit_packages_but_every_game_requires_original_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            root=self.fixture(directory);m.validate_download_layout(root,[GAME])
            (root/('joystick-windows-packages-'+GAME)).mkdir();m.validate_download_layout(root,[GAME])
            with self.assertRaisesRegex(AssertionError,'Missing evidence'):m.validate_download_layout(root,[GAME,'other-game'])
    def test_unrequested_artifacts_and_loose_files_cannot_enter_export(self):
        with tempfile.TemporaryDirectory() as directory:
            root=self.fixture(directory)
            for name in ('joystick-windows-packages-other-game','source.py','retention-provenance'):
                path=root/name;path.write_text('not an original requested artifact')
                with self.subTest(name=name),self.assertRaisesRegex(AssertionError,'unrelated'):m.validate_download_layout(root,[GAME])
                path.unlink()
    @unittest.skipIf(os.name=='nt','Creating symlinks requires Windows privileges; export runs on Linux')
    def test_package_root_symlink_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root=self.fixture(directory);(root/('joystick-windows-packages-'+GAME)).symlink_to(root/('joystick-windows-evidence-'+GAME),target_is_directory=True)
            with self.assertRaisesRegex(AssertionError,'real directory'):m.validate_download_layout(root,[GAME])

class QaStatusSeparationTests(unittest.TestCase):
    def test_eight_original_reports_preserve_actual_native_saved_string_maps(self):
        fixture=json.loads((Path(__file__).parent/'fixtures/windows-runtime-storage-44615299245.json').read_text())
        self.assertEqual(fixture['sourceRunId'],44615299245)
        self.assertEqual(len(fixture['games']),4)
        count=0
        for game,original in fixture['games'].items():
            before=copy.deepcopy(original)
            for report in original['reports'].values():
                self.assertIsInstance(report['storageRestart']['nativeSavedAfterQuit'],dict)
                self.assertTrue(report['storageRestart']['nativeSavedAfterQuit']);count+=1
            result=m.assess_reports(game,fixture['sourceCommit'],original['installation']['binarySha256'],original['installation'],original['reports'],'success')
            self.assertEqual(result['status'],'runtime-verified')
            self.assertTrue(result['runtimeVerified']);self.assertFalse(result['publicPackageDeliveryComplete'])
            self.assertEqual(original,before)
        self.assertEqual(count,8)
    def test_saved_storage_requires_actual_nonempty_string_map_not_boolean_placeholder(self):
        for saved in [True,False,None,{},[],{'save':1},{'save':True},{1:'value'},'saved']:
            value=report_fixture();value['reports']['runtime-normal']['storageRestart']['nativeSavedAfterQuit']=saved
            with self.subTest(saved=saved),self.assertRaisesRegex(AssertionError,'actual persisted'):m.assess_reports(**value)
    def test_mixed_success_and_failure_never_promotes_failed_original_package(self):
        success=report_fixture();failed=copy.deepcopy(success);failed['reports']['runtime-occupied']['status']='failed';failed['reports']['runtime-occupied']['tests'][0]['status']='failed';failed['job_conclusion']='failure';before=copy.deepcopy(failed)
        results=[m.assess_reports(**success),m.assess_reports(**failed)]
        self.assertEqual([r['status'] for r in results],['runtime-verified','built-unverified']);self.assertEqual([r['runtimeVerified'] for r in results],[True,False]);self.assertEqual(failed,before)
        self.assertTrue(all(r['publicPackageDeliveryComplete'] is False for r in results))
    def test_missing_installation_or_runtime_is_retained_unverified(self):
        value=report_fixture();value['installed']=None;value['reports']['runtime-normal']=None
        result=m.assess_reports(**value);self.assertFalse(result['runtimeVerified']);self.assertIn('installation_report_missing',result['unverifiedReasons']);self.assertIn('runtime-normal_report_missing',result['unverifiedReasons'])
    def test_failed_reports_with_wrong_source_or_executable_are_rejected_not_hidden(self):
        for key,wrong in [('game','other'),('qaSourceCommit','c'*40),('binarySha256','c'*64)]:
            value=report_fixture();value['reports']['runtime-normal']['status']='failed';value['reports']['runtime-normal'][key]=wrong
            with self.subTest(key=key),self.assertRaisesRegex(AssertionError,'identity'):m.assess_reports(**value)
    def test_claimed_pass_still_requires_all_old_checks_and_storage_guards(self):
        for change in [lambda v:v['reports']['runtime-normal']['tests'].pop(),lambda v:v['reports']['runtime-normal']['tests'][0].__setitem__('status','failed'),lambda v:v['reports']['runtime-normal']['storageRestart'].__setitem__('nativeSavedAfterQuit',False),lambda v:v['installed'].__setitem__('completeFileSetVerified',False)]:
            value=report_fixture();change(value)
            with self.assertRaises(AssertionError):m.assess_reports(**value)
        value=report_fixture();value['job_conclusion']='failure';self.assertFalse(m.assess_reports(**value)['runtimeVerified'])
    def test_workflow_requires_actual_build_success_but_preserves_two_upload_identity_layout(self):
        workflow=(Path(__file__).resolve().parents[4]/m.WORKFLOW).read_text()
        self.assertIn('name: '+m.BUILD_STEP+'\n        id: build\n',workflow)
        self.assertIn("if: ${{ always() && steps.build.outcome == 'success' }}",workflow)
        self.assertEqual(workflow.count('uses: actions/upload-artifact@v4'),2)
        self.assertNotIn('continue-on-error:',workflow)
        self.assertLess(workflow.index('name: joystick-windows-evidence-'),workflow.index('name: joystick-windows-packages-'))

if __name__=='__main__':unittest.main()
