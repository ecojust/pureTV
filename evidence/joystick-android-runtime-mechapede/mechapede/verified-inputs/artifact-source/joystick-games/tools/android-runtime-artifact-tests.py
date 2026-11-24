#!/usr/bin/env python3
"""Offline boundary regressions using original Actions identity and small ZIPs."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import stat
import tempfile
import unittest
import warnings
import zipfile

HERE = Path(__file__).resolve().parent
def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec); spec.loader.exec_module(value); return value
artifact = module('actions_input_test', HERE / 'android-runtime-artifact.py')
inputs = module('runtime_input_test', HERE / 'android-runtime-inputs.py')
copies = module('runtime_copies_test', HERE / 'android-runtime-copies.py')
FIXTURE = HERE / 'fixtures/android-runtime-artifact'
GAME = 'backroad-rally'
def load(path): return json.loads(path.read_text())
def write(path, value): path.parent.mkdir(parents=True, exist_ok=True); path.write_text(json.dumps(value))


class Provenance(unittest.TestCase):
    def setUp(self):
        run = load(FIXTURE / 'run.json'); item = load(FIXTURE / 'artifact.json')
        self.value = {'schemaVersion': 1, 'kind': 'github-actions-signed-artifact', 'run': run, 'artifact': item,
                      'jobs': load(FIXTURE / 'jobs.json')['jobs'], 'runArtifacts': [copy.deepcopy(item)],
                      'request': {'run': run['id'], 'attempt': run['run_attempt'], 'source': run['head_sha'], 'artifact': item['id']}}
        self.now = artifact.origin.stamp('2026-11-19T20:00:00Z')
    def valid(self, value=None): return artifact.validate_origin(value or self.value, [GAME], now=self.now)
    def test_real_sign_build_and_upload_are_bound_to_original_attempt(self):
        result = self.valid()
        self.assertEqual(result['jobId'], 135828563319)
        self.assertEqual(result['artifactSha256'], '7266f2a123eda2c8196abf6f9156fcacc453f3d70258dba75ca3b3afa6a7bd95')
        self.assertEqual(result['buildJobs'][0]['jobId'], 135826920535)
    def test_wrong_source_attempt_repository_or_artifact_is_rejected(self):
        for key, value in [('source', '0' * 40), ('attempt', 2), ('run', 1), ('artifact', 1)]:
            bad = copy.deepcopy(self.value); bad['request'][key] = value
            with self.subTest(key=key), self.assertRaises((AssertionError, artifact.origin.Rejected)): self.valid(bad)
        bad = copy.deepcopy(self.value); bad['run']['head_repository']['full_name'] = 'fork/pureTV'
        with self.assertRaises(artifact.origin.Rejected): self.valid(bad)
    def test_unsuccessful_build_sign_or_upload_cannot_be_reused(self):
        for name in ['sign', 'build (' + GAME + ')']:
            for field in ['job', 'upload']:
                bad = copy.deepcopy(self.value); job = next(j for j in bad['jobs'] if j['name'] == name)
                if field == 'job': job['conclusion'] = 'failure'
                else: next(s for s in job['steps'] if s['name'] == 'Run actions/upload-artifact@v4')['conclusion'] = 'failure'
                with self.subTest(name=name,field=field), self.assertRaises((AssertionError, artifact.origin.Rejected)): self.valid(bad)
    def test_duplicate_signed_name_changed_digest_and_wrong_upload_time_rejected(self):
        bad = copy.deepcopy(self.value); bad['runArtifacts'].append(copy.deepcopy(bad['artifact']))
        with self.assertRaises(AssertionError): self.valid(bad)
        bad = copy.deepcopy(self.value); bad['runArtifacts'][0]['digest'] = 'sha256:' + '0' * 64
        with self.assertRaises(AssertionError): self.valid(bad)
        bad = copy.deepcopy(self.value); bad['artifact']['created_at'] = '2026-11-19T00:00:00Z'
        with self.assertRaises(artifact.origin.Rejected): self.valid(bad)


class Archive(unittest.TestCase):
    def setUp(self): self.tmp = tempfile.TemporaryDirectory(); self.root = Path(self.tmp.name)
    def tearDown(self): self.tmp.cleanup()
    def names(self):
        return [f'packages/{GAME}/{name}' for name in [GAME + '-0.1.0.apk','signing-receipt.json','build-receipt.json','SHA256SUMS.txt']] + [f'observers/{GAME}/{name}' for name in ['observer-' + GAME + '.apk','observer-build.json','observer-signing-receipt.json']]
    def zip(self, names=None, symlink=False):
        path = self.root / 'artifact.zip'
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', UserWarning)
            with zipfile.ZipFile(path,'w') as z:
                for index, name in enumerate(names or self.names()):
                    info = zipfile.ZipInfo(name)
                    if symlink and index == 0: info.external_attr = (stat.S_IFLNK | 0o777) << 16
                    z.writestr(info, b'fixture original bytes')
        return path
    def test_exact_seven_file_archive_safely_extracts(self):
        archive = self.zip(); result = artifact.extract_archive(archive,self.root/'extracted',[GAME])
        self.assertEqual(set(result),set(self.names()))
        self.assertTrue(all(value == artifact.record(self.root/'extracted'/name) for name,value in result.items()))
    def test_zip_traversal_duplicate_case_alias_symlink_and_extra_are_rejected(self):
        for names in [self.names()+['../outside'],self.names()+[self.names()[0]], self.names()+[self.names()[0].upper()], self.names()+['packages/backroad-rally/unlisted.bin'],self.names()[:-1]]:
            with self.subTest(names=names[-1]), self.assertRaises(AssertionError): artifact.archive_inventory(self.zip(names),[GAME])
        with self.assertRaises(AssertionError): artifact.archive_inventory(self.zip(symlink=True),[GAME])
        self.assertFalse((self.root.parent/'outside').exists())
    def test_extracted_content_must_match_digest_verified_zip_not_only_manifest(self):
        provenance = Provenance(); provenance.setUp(); value = provenance.value
        archive = self.zip(); entry = artifact.record(archive)
        for item in [value['artifact'],value['runArtifacts'][0]]: item.update(size_in_bytes=entry['bytes'],digest='sha256:'+entry['sha256'])
        folder = self.root/'artifact'; value['files']=artifact.extract_archive(archive,folder,[GAME]);write(folder/'actions-artifact-origin.json',value)
        artifact.verify_local(folder,value['request'],[GAME],now=provenance.now)
        changed=folder/self.names()[0];changed.write_bytes(b'tampered');value['files'][self.names()[0]]=artifact.record(changed);write(folder/'actions-artifact-origin.json',value)
        with self.assertRaises(AssertionError): artifact.verify_local(folder,value['request'],[GAME],now=provenance.now)


class Payload(unittest.TestCase):
    def setUp(self):
        self.meta=load(HERE.parent/'backroad-rally/game.json')
        self.registration=load(HERE.parent/'catalog-registry.json')['games'][GAME]
        self.files={'resource/game-kit/build.py':(HERE.parents[1]/'resource/game-kit/build.py').read_bytes(),
                    **{name:b'phone fixture' for name in inputs.PHONE},
                    f'joystick-games/{GAME}/dist/tv.html':b'<html>fixture</html>',
                    f'joystick-games/{GAME}/dist/assets/track.glb':b'original nested geometry'}
    def replay(self, meta, registration, files):
        registry = load(HERE.parent / 'catalog-registry.json')
        registry['games'][GAME] = registration
        frozen = dict(files)
        frozen['joystick-games/tools/android-build.py'] = (HERE / 'android-build.py').read_bytes()
        frozen['joystick-games/tools/asset-policy.py'] = (HERE / 'asset-policy.py').read_bytes()
        frozen[f'joystick-games/{GAME}/game.json'] = json.dumps(meta).encode()
        frozen['joystick-games/catalog-registry.json'] = json.dumps(registry).encode()
        frozen['resource/game-kit/android/src/main/AndroidManifest.xml'] = b'<manifest/>'
        return inputs.frozen_payload(frozen, GAME)

    def test_explicit_matching_policy_preserves_nested_assets_and_index(self):
        payload=self.replay(self.meta,self.registration,self.files)
        self.assertEqual(payload['assets/track.glb'],b'original nested geometry')
        self.assertEqual(json.loads(payload['game-config.json'])['phoneControllerButtons'], 9)
        self.assertIn('assets/track.glb',json.loads(payload['assets-index.json']))
    def test_legacy_policy_still_rejects_nested_assets(self):
        self.meta.pop('assetPolicy');self.registration.pop('assetPolicy')
        with self.assertRaises((AssertionError,ValueError,RuntimeError)): self.replay(self.meta,self.registration,self.files)
    def test_mismatched_policy_and_case_alias_and_reserved_paths_rejected(self):
        altered=copy.deepcopy(self.registration);altered['assetPolicy']['maxTotalBytes']-=1
        with self.assertRaises(AssertionError):self.replay(self.meta,altered,self.files)
        for name in ['assets/TRACK.glb','game-config.json','../outside','assets/../outside.js']:
            bad=dict(self.files);bad[f'joystick-games/{GAME}/dist/'+name]=b'bad'
            with self.subTest(name=name),self.assertRaises((AssertionError,ValueError,RuntimeError)):self.replay(self.meta,self.registration,bad)
    def test_default_flat_payload_retains_original_bytes(self):
        self.meta.pop('assetPolicy');self.registration.pop('assetPolicy');self.files.pop(f'joystick-games/{GAME}/dist/assets/track.glb')
        payload=self.replay(self.meta,self.registration,self.files)
        self.assertEqual(set(payload),{'tv.html','controller.html','controller.js','controller.css','game-config.json','assets-index.json'})


class Evidence(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.source=self.root/'input';self.out=self.root/'evidence'
        self.package={'versionName':'0.1.0','bytes':3,'sha256':hashlib.sha256(b'apk').hexdigest()}
        self.observer={'bytes':3,'sha256':hashlib.sha256(b'obs').hexdigest()}
        files={f'packages/{GAME}/{GAME}-0.1.0.apk':b'apk',f'observers/{GAME}/observer-{GAME}.apk':b'obs'}
        for name,data in files.items():p=self.source/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
        manifest={'sourceSha':'1'*40,'runId':'123','files':{name:artifact.record(self.source/name) for name in files}}
        write(self.source/'original-export-manifest.json',manifest)
        origin={'kind':'immutable-git-export','artifactSourceSha':'1'*40,'artifactRunId':'123','exportCommit':'2'*40,'originManifestSha256':artifact.record(self.source/'original-export-manifest.json')['sha256']}
        self.binding={'status':'passed','artifactSourceSha':'1'*40,'artifactRunId':'123','artifactExportCommit':'2'*40,'originalExportManifestSha256':origin['originManifestSha256'],'artifactOrigin':origin,'games':[{'game':GAME,'package':self.package,'observer':self.observer}]}
        write(self.source/'input-verification.json',self.binding)
        write(self.source/f'packages/{GAME}/signing-receipt.json',self.package)
        write(self.source/f'observers/{GAME}/observer-signing-receipt.json',{'apk':'observer-'+GAME+'.apk','apkIdentity':self.observer})
        for p in [self.source/f'packages/{GAME}/signing-receipt.json',self.source/f'observers/{GAME}/observer-signing-receipt.json']:
            manifest['files'][p.relative_to(self.source).as_posix()]=artifact.record(p)
        write(self.source/'original-export-manifest.json',manifest)
        origin['originManifestSha256']=artifact.record(self.source/'original-export-manifest.json')['sha256']
        self.binding['originalExportManifestSha256']=origin['originManifestSha256'];write(self.source/'input-verification.json',self.binding)
        path=self.source/'artifact-source/.github/workflows/original.yml';path.parent.mkdir(parents=True);path.write_text('preserved exact frozen source')
    def tearDown(self):self.tmp.cleanup()
    def test_small_evidence_preserves_source_and_explicit_original_package_hashes(self):
        inputs.preserve_evidence(self.source,self.out)
        self.assertEqual(len(copies.package_references(self.out,self.binding)),2)
        self.assertFalse(list(self.out.rglob('*.apk')))
        self.assertEqual((self.out/'artifact-source/.github/workflows/original.yml').read_bytes(),(self.source/'artifact-source/.github/workflows/original.yml').read_bytes())
    def test_missing_hash_mismatch_wrong_origin_and_duplicate_binary_fail_closed(self):
        inputs.preserve_evidence(self.source,self.out);p=self.out/'package-file-references.json';original=load(p)
        for change in ['missing','hash','origin']:
            bad=copy.deepcopy(original)
            if change=='missing':bad['files'].pop(next(iter(bad['files'])))
            elif change=='hash':next(iter(bad['files'].values()))['sha256']='0'*64
            else:bad['artifactOrigin']['artifactRunId']='999'
            write(p,bad)
            with self.subTest(change=change),self.assertRaises(AssertionError):copies.package_references(self.out,self.binding)
        write(p,original);apk=next(self.source.rglob('*.apk'));shutil.copyfile(apk,self.out/apk.relative_to(self.source))
        with self.assertRaises(AssertionError):copies.package_references(self.out,self.binding)
    def test_actions_reference_requires_original_identity_zip_hash_and_file_hashes(self):
        provenance=Provenance();provenance.setUp();value=provenance.value
        value['verifiedAt']='2026-11-19T20:00:00Z'
        value['files']={p.relative_to(self.source).as_posix():artifact.record(p) for p in self.source.rglob('*') if p.is_file() and p.parts[-3] in ('packages','observers')}
        original=self.source/'original-actions-artifact-origin.json';write(original,value)
        origin={'kind':'github-actions-signed-artifact','repository':artifact.origin.REPO,
                'artifactSourceSha':value['request']['source'],'artifactRunId':str(value['request']['run']),
                'artifactRunAttempt':value['request']['attempt'],'artifactId':value['request']['artifact'],
                'zip':{'bytes':value['artifact']['size_in_bytes'],'sha256':value['artifact']['digest'][7:]},
                'originManifestSha256':artifact.record(original)['sha256']}
        self.binding.update(artifactOrigin=origin,artifactSourceSha=origin['artifactSourceSha'],artifactRunId=origin['artifactRunId'],artifactExportCommit=None)
        write(self.source/'input-verification.json',self.binding);inputs.preserve_evidence(self.source,self.out)
        self.assertEqual(len(copies.package_references(self.out,self.binding)),2)
        altered=copy.deepcopy(self.binding);altered['artifactOrigin']['zip']['sha256']='0'*64
        references=load(self.out/'package-file-references.json');references['artifactOrigin']=altered['artifactOrigin'];write(self.out/'package-file-references.json',references)
        with self.assertRaises(AssertionError):copies.package_references(self.out,altered)
    def test_receipt_inventory_cannot_be_shortened_after_package_verification(self):
        inputs.preserve_evidence(self.source,self.out)
        p=self.out/f'packages/{GAME}/signing-receipt.json';value=load(p);value['sourceInputs']={};write(p,value)
        with self.assertRaises(AssertionError):copies.package_references(self.out,self.binding)


if __name__=='__main__':unittest.main(verbosity=2)
