#!/usr/bin/env python3
"""Offline boundaries; synthetic signing commands never load or use a real key."""
import base64
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import stat
import subprocess
import tempfile
import shutil
import unittest
from unittest import mock
import warnings
import zipfile

SPEC = importlib.util.spec_from_file_location('graphics_sign', Path(__file__).with_name('backroad-graphics-observer-sign.py'))
m = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(m)
SHA = 'a' * 40
IDENTITY = {'sourceSha': SHA, 'runId': '12345', 'runAttempt': 1}


class SigningBoundaries(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base / 'repo'
        self.root.mkdir()
        self.input = self.base / 'unsigned'
        self.input.mkdir()
        self.output = self.base / 'signed'
        self.tools = self.base / 'tools'
        self.origin = self.base / 'origin.json'
        self.origin.write_text('{"unitFixture":true}\n')
        self.entries = {'AndroidManifest.xml': b'synthetic compiled manifest', 'classes.dex': b'synthetic dex',
                        'resources.arsc': bytes.fromhex('02000c002800000000000000') + bytes(28),
                        'assets/graphics.js': b'unit fixture graphics'}
        for name in m.SOURCE_NAMES | m.SIGNER_NAMES:
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(self.entries['assets/graphics.js'] if name.endswith('/graphics.js') else b'unit fixture source')
        self.write_zip(self.input / m.UNSIGNED)
        self.receipt = {'schemaVersion': 1, 'scope': 'unit fixture', 'game': 'backroad-rally',
                        'packageName': m.PACKAGE, 'targetPackage': m.TARGET, 'instrumentationRunner': m.RUNNER,
                        'component': m.PACKAGE + '/' + m.RUNNER, 'sourceCommit': SHA,
                        'committedInputsVerified': True, 'minSdk': 26, 'targetSdk': 35,
                        'testOnly': True, 'signed': False, 'targetApkBuilt': False, 'targetApkChanged': False,
                        'modelWrites': False, 'clockOverrides': False, 'nativeInputPolls': False, 'glContextCalls': True,
                        'readonlyEndpoints': ['/status', '/console', '/graphics', '/capabilities'], 'apk': m.UNSIGNED,
                        'apkIdentity': m.record(self.input / m.UNSIGNED),
                        'content': {name: m.record_bytes(value) for name, value in self.entries.items()},
                        'sourceFiles': {name: m.record(self.root / name) for name in m.SOURCE_NAMES}}
        self.save()
        self.patch(m, 'ROOT', new=self.root)
        self.patch(m, 'frozen', side_effect=lambda commit, name: (self.root / name).read_bytes())
        self.patch(m, 'source_identity', return_value=IDENTITY)
        self.inspect = self.patch(m, 'inspect_apk', side_effect=self.fake_inspect)
        self.origin_check = self.patch(m, 'validate_origin_metadata', side_effect=lambda path: m.record(path))

    def patch(self, owner, name, **options):
        p = mock.patch.object(owner, name, **options)
        value = p.start()
        self.addCleanup(p.stop)
        return value

    def save(self):
        (self.input / m.BUILD).write_text(json.dumps(self.receipt))

    def write_zip(self, path, signed=False, entries=None):
        with zipfile.ZipFile(path, 'w') as archive:
            for name, value in (entries or self.entries).items():
                archive.writestr(name, value)
            if signed:
                for name in m.SIGNATURES:
                    archive.writestr(name, b'unit synthetic signature member')

    def fake_inspect(self, apk, tools, signed):
        return dict(m.record(apk), packageName=m.PACKAGE, versionCode=1, versionName='1.0',
                    certificateSha256=m.PIN if signed else None, minSdk=26, targetSdk=35, testOnly=True)

    def prepare_signed(self):
        self.output.mkdir()
        self.write_zip(self.output / m.SIGNED, True)
        (self.output / m.BUILD).write_bytes((self.input / m.BUILD).read_bytes())
        (self.output / m.ORIGIN).write_bytes(self.origin.read_bytes())
        receipt = dict(IDENTITY, schemaVersion=1, repository=m.REPO, game='backroad-rally',
                       originalTarget=m.ORIGINAL, packageName=m.PACKAGE, targetPackage=m.TARGET,
                       instrumentationRunner=m.RUNNER, component=m.PACKAGE + '/' + m.RUNNER,
                       signed=True, testArtifactOnly=True, formalAcceptance=False, targetApkBuilt=False,
                       targetApkSigned=False, targetApkChanged=False, apk=m.SIGNED,
                       apkIdentity=self.fake_inspect(self.output / m.SIGNED, self.tools, True),
                       buildReceipt=m.record(self.output / m.BUILD), unsignedApkIdentity=self.receipt['apkIdentity'],
                       originalOrigin=m.record(self.output / m.ORIGIN), sourceFiles=self.receipt['sourceFiles'],
                       signerSourceFiles=m.source_records(m.SIGNER_NAMES, SHA), content=self.receipt['content'],
                       readonlyEndpoints=self.receipt['readonlyEndpoints'], diagnosticPort=63487)
        (self.output / m.RECEIPT).write_text(json.dumps(receipt))
        return receipt

    def test_exact_unsigned_build_and_distinct_signed_receipt(self):
        self.assertEqual(m.validate_build(self.input, self.tools, IDENTITY), self.receipt)
        expected = self.prepare_signed()
        self.assertEqual(m.verify(self.output, self.tools), expected)
        self.assertNotEqual(m.PACKAGE, m.TARGET)
        self.assertFalse(expected['formalAcceptance'])

    def test_build_identity_and_boolean_claims_fail_closed(self):
        changes = {'committedInputsVerified': False, 'sourceCommit': 'b' * 40, 'testOnly': 1,
                   'signed': True, 'targetPackage': 'other', 'packageName': m.TARGET,
                   'modelWrites': True, 'clockOverrides': True, 'nativeInputPolls': True,
                   'glContextCalls': False, 'apk': '../target.apk', 'targetSdk': 36,
                   'readonlyEndpoints': ['/status', '/snapshot']}
        old = copy.deepcopy(self.receipt)
        for name, value in changes.items():
            with self.subTest(name=name):
                self.receipt = dict(old, **{name: value}); self.save()
                with self.assertRaises(m.Rejected): m.validate_build(self.input, self.tools, IDENTITY)

    def test_changed_source_and_payload_rejected(self):
        name = next(iter(m.SOURCE_NAMES))
        (self.root / name).write_text('changed source')
        with self.assertRaises(m.Rejected): m.validate_build(self.input, self.tools, IDENTITY)
        self.receipt['sourceFiles'][name] = m.record(self.root / name); self.save()
        self.write_zip(self.input / m.UNSIGNED, entries=dict(self.entries, **{'classes.dex': b'changed dex'}))
        with self.assertRaises(m.Rejected): m.validate_build(self.input, self.tools, IDENTITY)

    def test_uncommitted_source_rejected(self):
        with mock.patch.object(m, 'frozen', return_value=b'different frozen source'):
            with self.assertRaises(m.Rejected): m.source_records(m.SOURCE_NAMES, SHA)

    def test_extra_missing_duplicate_and_symlink_zip_members(self):
        for name in ['../target.apk', 'assets/model.js', 'META-INF/PURETV.RSA']:
            with self.subTest(name=name):
                self.write_zip(self.input / m.UNSIGNED, entries=dict(self.entries, **{name: b'x'}))
                with self.assertRaises(m.Rejected): m.content(self.input / m.UNSIGNED, False)
        self.write_zip(self.input / m.UNSIGNED)
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            with zipfile.ZipFile(self.input / m.UNSIGNED, 'a') as z: z.writestr('classes.dex', b'duplicate')
        with self.assertRaises(m.Rejected): m.content(self.input / m.UNSIGNED, False)
        with zipfile.ZipFile(self.input / m.UNSIGNED, 'w') as z:
            for name, value in self.entries.items():
                entry = zipfile.ZipInfo(name); entry.external_attr = (stat.S_IFLNK | 0o777) << 16
                z.writestr(entry, value)
        with self.assertRaises(m.Rejected): m.content(self.input / m.UNSIGNED, False)

    def test_apk_and_resource_budgets_and_unsigned_signature_block(self):
        for changed in [{'resources.arsc': b'x' * 40}, {'classes.dex': b'APK Sig Block 42'},
                        {'classes.dex': b'x' * (m.MAX_APK + 1)}]:
            with self.subTest(changed=list(changed)):
                self.write_zip(self.input / m.UNSIGNED, entries=dict(self.entries, **changed))
                with self.assertRaises(m.Rejected): m.content(self.input / m.UNSIGNED, False)

    def test_unsigned_symlink_rejected(self):
        original = self.input / m.UNSIGNED
        dest = self.base / 'other.apk'; original.rename(dest); original.symlink_to(dest)
        with self.assertRaises(m.Rejected): m.validate_build(self.input, self.tools, IDENTITY)

    def test_duplicate_json_rejected(self):
        (self.input / m.BUILD).write_text('{"signed":false,"signed":true}')
        with self.assertRaisesRegex(m.Rejected, 'duplicate_json_key'): m.load(self.input / m.BUILD)

    def test_wrong_unsigned_rejected_before_signing_credentials(self):
        self.receipt['targetPackage'] = 'wrong'; self.save()
        with mock.patch.object(m.os.environ, 'get') as get, mock.patch.object(m, 'command') as command:
            with self.assertRaises(m.Rejected): m.sign(self.input, self.output, self.tools, self.origin)
        get.assert_not_called(); command.assert_not_called()

    def test_bad_origin_and_existing_output_rejected_before_secret(self):
        with (mock.patch.object(m, 'validate_origin_metadata', side_effect=m.Rejected('original_artifact')),
              mock.patch.object(m.os.environ, 'get') as get):
            with self.assertRaises(m.Rejected): m.sign(self.input, self.output, self.tools, self.origin)
            get.assert_not_called()
        self.output.mkdir()
        with mock.patch.object(m.os.environ, 'get') as get:
            with self.assertRaises(m.Rejected): m.sign(self.input, self.output, self.tools, self.origin)
            get.assert_not_called()

    def test_signed_receipt_identity_and_original_target_mutations(self):
        valid = self.prepare_signed()
        for key, value in [('sourceSha', 'b'*40), ('runId', '1'), ('runAttempt', 2),
                           ('formalAcceptance', True), ('testArtifactOnly', 1), ('targetApkSigned', True),
                           ('component', 'other/Runner'), ('originalTarget', dict(m.ORIGINAL, artifactId=1))]:
            with self.subTest(key=key):
                (self.output / m.RECEIPT).write_text(json.dumps(dict(valid, **{key: value})))
                with self.assertRaises(m.Rejected): m.verify(self.output, self.tools)

    def test_signed_apk_payload_tamper_and_extra_files_rejected(self):
        self.prepare_signed()
        (self.output / 'target.apk').write_bytes(b'not allowed')
        with self.assertRaises(m.Rejected): m.verify(self.output, self.tools)
        (self.output / 'target.apk').unlink()
        self.write_zip(self.output / m.SIGNED, True, dict(self.entries, **{'classes.dex': b'changed'}))
        with self.assertRaises(m.Rejected): m.verify(self.output, self.tools)

    def test_key_certificate_mismatch_no_apksigner_and_key_cleanup(self):
        calls = []
        def run(args, **kwargs):
            calls.append([str(v) for v in args])
            key = Path(args[args.index('-keystore')+1])
            self.assertEqual(stat.S_IMODE(key.stat().st_mode), 0o600)
            return subprocess.CompletedProcess(args, 0, b'synthetic wrong public certificate', b'')
        with (mock.patch.dict(os.environ, {'PURETV_KEYSTORE_BASE64': base64.b64encode(b'unit fake key').decode(),
                                          'PURETV_KEYSTORE_PASSWORD': 'unit fake password'}),
              mock.patch.object(m, 'command', side_effect=run)):
            with self.assertRaisesRegex(m.Rejected, 'key_certificate'): m.sign(self.input, self.output, self.tools, self.origin)
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0][0], 'keytool')
        self.assertNotIn('unit fake password', calls[0])
        self.assertFalse(Path(calls[0][calls[0].index('-keystore')+1]).exists())
        self.assertFalse((self.output / m.RECEIPT).exists())

    def test_synthetic_signer_only_targets_observer_and_unknown_result_never_retries(self):
        real_hash = hashlib.sha256
        certificate = b'unit synthetic public certificate'
        def digest(data=b''):
            return mock.Mock(hexdigest=lambda: m.PIN) if data == certificate else real_hash(data)
        for mode in ['success', 'timeout', 'changed_payload']:
            calls = []
            output = self.base / ('signed-' + mode)
            def run(args, **kwargs):
                args = [str(v) for v in args]; calls.append(args)
                if args[0] == 'keytool':
                    return subprocess.CompletedProcess(args, 0, certificate, b'')
                if Path(args[0]).name == 'zipalign':
                    self.assertEqual(Path(args[-2]), self.input / m.UNSIGNED)
                    shutil.copyfile(args[-2], args[-1])
                elif Path(args[0]).name == 'apksigner':
                    self.assertEqual(args[1], 'sign')
                    self.assertEqual(Path(args[args.index('--out') + 1]), output / m.SIGNED)
                    self.assertEqual(Path(args[-1]).name, 'observer-aligned.apk')
                    self.assertEqual(args[args.index('--ks-pass') + 1], 'env:PURETV_KEYSTORE_PASSWORD')
                    self.assertNotIn(m.ORIGINAL['file'], ' '.join(args))
                    self.write_zip(output / m.SIGNED, True,
                                   dict(self.entries, **{'classes.dex': b'altered'}) if mode == 'changed_payload' else None)
                    if mode == 'timeout': raise subprocess.TimeoutExpired(args[0], 120)
                else: self.fail('Unexpected command')
                return subprocess.CompletedProcess(args, 0, b'', b'')
            with (self.subTest(mode=mode), mock.patch.object(m, 'command', side_effect=run),
                  mock.patch.object(m.hashlib, 'sha256', side_effect=digest),
                  mock.patch.dict(os.environ, {'PURETV_KEYSTORE_BASE64': base64.b64encode(b'unit fake key').decode(),
                                              'PURETV_KEYSTORE_PASSWORD': 'unit fake password'})):
                if mode == 'success':
                    receipt = m.sign(self.input, output, self.tools, self.origin)
                    self.assertTrue(receipt['testArtifactOnly'])
                    self.assertFalse(receipt['targetApkSigned'])
                    self.assertEqual(m.verify(output, self.tools), receipt)
                else:
                    with self.assertRaises((m.Rejected, subprocess.TimeoutExpired)):
                        m.sign(self.input, output, self.tools, self.origin)
                    self.assertFalse((output / m.RECEIPT).exists())
                self.assertEqual(sum(Path(c[0]).name == 'apksigner' for c in calls), 1)
                key = Path(calls[0][calls[0].index('-keystore') + 1])
                self.assertFalse(key.exists())


class ActualParsing(unittest.TestCase):
    def test_preserved_original_producer_shape_and_failures(self):
        fixture = Path(__file__).parent / 'fixtures/backroad-graphics-observer-sign/original-origin-metadata.json'
        value = json.loads(fixture.read_text())
        self.assertIn('synthetic one-item index', value['_fixtureConstruction']['scope'])
        self.assertEqual(m.validate_origin_metadata(fixture), m.record(fixture))
        def mutate(case):
            data = copy.deepcopy(value)
            sign = next(j for j in data['jobs'] if j['name'] == 'sign')
            build = next(j for j in data['jobs'] if j['name'] == 'build (backroad-rally)')
            if case == 'sign_failed': sign['conclusion'] = 'failure'
            elif case == 'build_failed': build['conclusion'] = 'failure'
            elif case == 'upload_failed':
                next(s for s in sign['steps'] if s['name'] == 'Run actions/upload-artifact@v4')['conclusion'] = 'failure'
            elif case == 'wrong_source': data['run']['head_sha'] = 'f' * 40
            elif case == 'duplicate_artifact': data['runArtifacts'].append(copy.deepcopy(data['artifact']))
            elif case == 'expired': data['artifact']['expired'] = True; data['runArtifacts'] = [data['artifact']]
            elif case == 'wrong_workflow': data['run']['path'] = '.github/workflows/other.yml'
            elif case == 'wrong_job_attempt': sign['run_attempt'] = 2
            return data
        with tempfile.TemporaryDirectory() as t:
            path = Path(t) / 'origin.json'
            for case in ['sign_failed','build_failed','upload_failed','wrong_source',
                         'duplicate_artifact','expired','wrong_workflow','wrong_job_attempt']:
                with self.subTest(case=case):
                    path.write_text(json.dumps(mutate(case)))
                    with self.assertRaises(Exception): m.validate_origin_metadata(path)

    def test_exact_checkout_run_repository_and_original_pin(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t); (root/m.PIN_PATH).parent.mkdir(parents=True); (root/m.PIN_PATH).write_text(m.PIN+'\n')
            env={'GITHUB_REPOSITORY':m.REPO,'GITHUB_SHA':SHA,'GITHUB_RUN_ID':'12345','GITHUB_RUN_ATTEMPT':'1'}
            with (mock.patch.object(m,'ROOT',root),mock.patch.object(m,'frozen',return_value=(m.PIN+'\n').encode()),
                  mock.patch.object(m,'command',return_value=subprocess.CompletedProcess([],0,(SHA+'\n').encode(),b''))):
                with mock.patch.dict(os.environ,env):self.assertEqual(m.source_identity(),IDENTITY)
                for key,value in [('GITHUB_REPOSITORY','other/repo'),('GITHUB_SHA','b'*40),
                                  ('GITHUB_RUN_ID','0'),('GITHUB_RUN_ATTEMPT','true')]:
                    with self.subTest(key=key),mock.patch.dict(os.environ,dict(env,**{key:value})):
                        with self.assertRaises(m.Rejected):m.source_identity()
                with mock.patch.dict(os.environ,env),mock.patch.object(m,'frozen',return_value=b'f'*64):
                    with self.assertRaisesRegex(m.Rejected,'fixed_certificate'):m.source_identity()

    def test_manifest_no_extra_permission_hook_component_or_sdk(self):
        with tempfile.TemporaryDirectory() as t:
            apk=Path(t)/'test.apk'; apk.write_bytes(b'unit fixture')
            for old,new in [('INTERNET','READ_CONTACTS'), ('0x1a','0x15'), (m.TARGET,'other'),
                            ('android:testOnly(0x01010272)=(type 0x12)0xffffffff','android:testOnly(0x01010272)=(type 0x12)0x0')]:
                with self.subTest(old=old):
                    result=subprocess.CompletedProcess([],0,m.expected_manifest().replace(old,new).encode(),b'')
                    with mock.patch.object(m,'command',return_value=result):
                        with self.assertRaisesRegex(m.Rejected,'observer_manifest'):m.inspect_apk(apk,Path(t),False)

    def test_certificate_and_unsigned_status(self):
        with tempfile.TemporaryDirectory() as t:
            apk=Path(t)/'test.apk'; apk.write_bytes(b'unit fixture')
            tree=subprocess.CompletedProcess([],0,m.expected_manifest().encode(),b'')
            for signed,code,cert in [(True,1,m.PIN),(True,0,'f'*64),(False,0,m.PIN),(False,1,m.PIN)]:
                sig=subprocess.CompletedProcess([],code,('Signer #1 certificate SHA-256 digest: '+cert).encode(),b'')
                with self.subTest(signed=signed,code=code,cert=cert),mock.patch.object(m,'command',side_effect=[tree,sig]):
                    with self.assertRaises(m.Rejected):m.inspect_apk(apk,Path(t),signed)

    def test_fixed_original_metadata_mismatch_precedes_imported_validation(self):
        request={'run':m.ORIGINAL['runId'],'attempt':1,'source':m.ORIGINAL['sourceSha'],'artifact':m.ORIGINAL['artifactId']}
        artifact={'id':m.ORIGINAL['artifactId'],'name':m.ORIGINAL['artifactName'],
                  'size_in_bytes':m.ORIGINAL['artifactBytes'],'digest':'sha256:'+m.ORIGINAL['artifactSha256']}
        with tempfile.TemporaryDirectory() as t:
            path=Path(t)/'origin.json'
            for change in [dict(request,run=1),dict(request,attempt=2),dict(request,source='f'*40),dict(request,artifact=1)]:
                path.write_text(json.dumps({'request':change,'artifact':artifact}))
                with self.assertRaisesRegex(m.Rejected,'original_request'):m.validate_origin_metadata(path)
            for key,value in [('id',1),('name','other'),('size_in_bytes',1),('digest','sha256:'+'f'*64)]:
                path.write_text(json.dumps({'request':request,'artifact':dict(artifact,**{key:value})}))
                with self.assertRaisesRegex(m.Rejected,'original_artifact'):m.validate_origin_metadata(path)


if __name__ == '__main__':
    unittest.main(verbosity=2)
