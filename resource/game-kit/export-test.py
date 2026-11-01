#!/usr/bin/env python3
"""Portable export/download protocol regressions (standard library only).

GitHub responses and Android verification-tool outputs are fixtures. No network,
Android SDK, signing key, installed game, Git mutation or external command is
needed. These tests complement real per-release APK signature verification.
"""
import base64
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


exporter = load('protocol_exporter', 'export-signed.py')
fetcher = load('protocol_fetcher', 'fetch-signed.py')
SOURCE = 'a' * 40
WORKFLOW = 'b' * 40
RUN = '1234567'
SLUG = 'protocol-fixture'
APK = SLUG + '-0.1.0.apk'
PIN = hashlib.sha256(b'public test certificate fixture, not a key').hexdigest()


def git_blob(data):
    return {'sha': hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest(),
            'size': len(data), 'encoding': 'base64', 'content': base64.b64encode(data).decode()}


class ExportApi:
    def __init__(self, existing=False, race=False, repository='ecojust/pureTV', signed=True):
        self.existing, self.race, self.repository, self.signed = existing, race, repository, signed
        self.calls = []

    def __call__(self, method, path, payload=None, **kwargs):
        self.calls.append((method, path, payload))
        if method == 'GET':
            if path.startswith('git/ref/heads/'):
                return {'ref': 'existing ref'} if self.existing else None
            if '/jobs?' in path:
                return {'total_count': 1, 'jobs': [{'name': 'sign', 'status': 'completed', 'conclusion': 'success' if self.signed else 'failure'}]}
            if path.startswith('actions/runs/'):
                return {'repository': {'full_name': self.repository}, 'head_repository': {'full_name': self.repository},
                        'head_sha': WORKFLOW, 'path': '.github/workflows/sign-game-kit.yml', 'event': 'workflow_dispatch'}
        if method == 'POST':
            if path == 'git/blobs':
                return {'sha': git_blob(base64.b64decode(payload['content']))['sha']}
            if path in ('git/trees', 'git/commits'):
                return {'sha': ('c' if path == 'git/trees' else 'd') * 40}
            if path == 'git/refs':
                if self.race:
                    raise RuntimeError('GitHub export operation failed with HTTP 422')
                return {'ref': payload['ref'], 'object': {'sha': payload['sha']}}
        raise AssertionError('Unexpected API method/path')


class FetchApi:
    def __init__(self, fixture, receipt=None, injected=False, wrong_ref=False, corrupt_blob=False):
        self.fixture, self.injected, self.wrong_ref, self.corrupt_blob = fixture, injected, wrong_ref, corrupt_blob
        self.receipt = git_blob(json.dumps(receipt).encode() if receipt is not None else fixture.receipt_raw)
        self.apk = git_blob(fixture.raw)
        self.metadata = git_blob(fixture.metadata_raw)
        self.calls = []

    def __call__(self, path):
        self.calls.append(path)
        if path.startswith('git/ref/heads/'):
            return {'ref': 'refs/heads/master' if self.wrong_ref else 'refs/heads/build-assets/game-kit-signed-' + RUN,
                    'object': {'type': 'commit', 'sha': 'c' * 40}}
        if path == 'git/commits/' + 'c' * 40:
            return {'sha': 'c' * 40, 'parents': [], 'tree': {'sha': 'd' * 40}}
        if path == 'git/trees/' + 'd' * 40 + '?recursive=1':
            rows = [{'path': SLUG, 'mode': '040000', 'type': 'tree', 'sha': 'e' * 40},
                    {'path': SLUG + '/' + APK, 'mode': '100644', 'type': 'blob', 'sha': self.apk['sha'], 'size': self.apk['size']},
                    {'path': SLUG + '/signing-receipt.json', 'mode': '100644', 'type': 'blob', 'sha': self.receipt['sha'], 'size': self.receipt['size']}]
            if self.injected:
                rows.append({'path': '../injected.py', 'mode': '100644', 'type': 'blob', 'sha': 'f' * 40, 'size': 1})
            return {'truncated': False, 'tree': rows}
        if path == 'git/blobs/' + self.receipt['sha']:
            return self.receipt
        if path == 'git/blobs/' + self.apk['sha']:
            result = copy.deepcopy(self.apk)
            if self.corrupt_blob:
                result['content'] = base64.b64encode(b'x' + self.fixture.raw[1:]).decode()
            return result
        if path == 'actions/runs/' + RUN:
            return {'repository': {'full_name': 'ecojust/pureTV'}, 'head_repository': {'full_name': 'ecojust/pureTV'},
                    'head_sha': WORKFLOW, 'path': '.github/workflows/sign-game-kit.yml', 'event': 'workflow_dispatch',
                    'status': 'completed', 'conclusion': 'success'}
        if path == 'contents/resource/apps/' + SLUG + '/game.json?ref=' + SOURCE:
            return {**self.metadata, 'type': 'file'}
        raise AssertionError('Unexpected read-only API path')


class Fixture:
    def __init__(self, root):
        self.root = root
        self.source, self.artifact = root / 'source', root / 'artifact'
        kit = self.source / 'resource/game-kit'
        game = self.source / 'resource/apps' / SLUG
        for path in (kit / 'web', kit / 'android/src/main/java', kit / 'android/src/main/res/raw', game / 'src/main/assets', self.artifact):
            path.mkdir(parents=True)
        self.metadata_raw = (json.dumps({'id': SLUG, 'name': '测试', 'nameEn': 'Protocol fixture',
            'packageName': 'com.ecojust.protocolfixture', 'version': '0.1.0', 'versionCode': 1}) + '\n').encode()
        (game / 'game.json').write_bytes(self.metadata_raw)
        (game / 'icon.xml').write_text('<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="64dp"/>')
        (kit / 'android/src/main/java/MainActivity.java').write_text('// Source hashing fixture; never compiled.\n')
        (kit / 'android/src/main/res/raw/license.txt').write_text('Public protocol test fixture.\n')
        for name in ('tv.html', 'controller.html', 'controller.js', 'controller.css'):
            (kit / 'web' / name).write_text('/* public fixture */')
        (game / 'src/main/assets/game.js').write_text('/* source bytes, never executed */')
        # If source code is accidentally imported instead of trusted helpers, fail.
        (kit / 'build.py').write_text('raise RuntimeError("Untrusted source code executed")')
        builder = exporter.load_builder()
        builder.KIT = kit
        assets = builder.payload(game)
        with zipfile.ZipFile(self.artifact / APK, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
            for name, data in assets.items():
                archive.writestr('assets/' + name, data)
            archive.writestr('classes.dex', b'protocol fixture, not executable dex')
            archive.writestr('res/raw/license.txt', (kit / 'android/src/main/res/raw/license.txt').read_bytes())
        self.raw = (self.artifact / APK).read_bytes()
        native = {path.relative_to(self.source).as_posix(): exporter.digest(path.read_bytes())
                  for path in (kit / 'android/src/main').rglob('*') if path.is_file()}
        native[(game / 'icon.xml').relative_to(self.source).as_posix()] = exporter.digest((game / 'icon.xml').read_bytes())
        self.receipt = {'schema': 1, 'slug': SLUG, 'sourceSha': SOURCE, 'signerCommit': WORKFLOW, 'workflowRun': RUN,
            'file': APK, 'packageName': 'com.ecojust.protocolfixture', 'version': '0.1.0', 'versionCode': 1,
            'bytes': len(self.raw), 'sha256': exporter.digest(self.raw), 'certificateSha256': PIN,
            'signatureVerified': True, 'sourceAssetsMatchApk': True, 'checkedAssets': len(assets),
            'assetsSha256': {name: exporter.digest(data) for name, data in assets.items()}, 'nativeSourceSha256': native}
        self.receipt_raw = json.dumps(self.receipt).encode()
        (self.artifact / 'signing-receipt.json').write_bytes(self.receipt_raw)
        self.tool_certificate = PIN
        self.tool_calls = []

    def command(self, args, *, cwd=None):
        self.tool_calls.append(Path(str(args[0])).name)
        if args == ['git', 'rev-parse', 'HEAD']:
            return SOURCE.encode()
        tool = Path(str(args[0])).name
        if tool == 'apksigner':
            return ('Signer #1 certificate SHA-256 digest: ' + self.tool_certificate + '\n').encode()
        if tool == 'aapt':
            return b"package: name='com.ecojust.protocolfixture' versionCode='1' versionName='0.1.0'\n"
        if tool == 'zipalign':
            return b''
        raise AssertionError('Unexpected external command')


class ProtocolTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='puretv-protocol-')
        self.addCleanup(temporary.cleanup)
        self.fixture = Fixture(Path(temporary.name))
        for module in (exporter, fetcher):
            mocked = patch.object(module, 'command', self.fixture.command)
            mocked.start()
            self.addCleanup(mocked.stop)

    def verify(self, **overrides):
        args = dict(source=self.fixture.source, source_sha=SOURCE, workflow_sha=WORKFLOW, slug=SLUG, run_id=RUN,
            artifact=self.fixture.artifact, build_tools=Path('/unused-tools'), expected_cert=PIN)
        args.update(overrides)
        return exporter.verify_artifact(**args)

    def fetch(self, api=None, **overrides):
        args = dict(run_id=RUN, slug=SLUG, source_sha=SOURCE, build_tools=Path('/unused-tools'), expected_cert=PIN)
        args.update(overrides)
        return fetcher.fetch_bundle(api or FetchApi(self.fixture), **args)

    def test_export_checks_source_and_creates_only_two_new_files(self):
        verified = self.verify()
        api = ExportApi()
        result = exporter.create_export_branch(api, verified)
        self.assertEqual(result['branch'], 'build-assets/game-kit-signed-' + RUN)
        self.assertIn('apksigner', self.fixture.tool_calls)
        tree = next(data for method, path, data in api.calls if path == 'git/trees')
        self.assertEqual({item['path'] for item in tree['tree']}, {SLUG + '/' + APK, SLUG + '/signing-receipt.json'})
        commit = next(data for method, path, data in api.calls if path == 'git/commits')
        self.assertEqual(commit['parents'], [])
        self.assertEqual(sum(method == 'POST' and path == 'git/refs' for method, path, _ in api.calls), 1)

    def test_existing_ref_prevents_all_writes(self):
        api = ExportApi(existing=True)
        with self.assertRaisesRegex(ValueError, 'already exists'):
            exporter.create_export_branch(api, self.verify())
        self.assertTrue(all(method == 'GET' for method, _, _ in api.calls))

    def test_concurrent_ref_creation_never_updates_or_deletes(self):
        api = ExportApi(race=True)
        with self.assertRaisesRegex(RuntimeError, 'HTTP 422'):
            exporter.create_export_branch(api, self.verify())
        self.assertTrue(all(method in ('GET', 'POST') for method, _, _ in api.calls))
        self.assertEqual(sum(path == 'git/refs' for _, path, _ in api.calls), 1)

    def test_export_rejects_coordinates_files_and_mutated_bytes(self):
        original = self.verify()
        for field, value in (('runId', '../master'), ('slug', '../outside')):
            with self.subTest(field=field), self.assertRaises(ValueError):
                changed = copy.deepcopy(original); changed[field] = value
                exporter.create_export_branch(ExportApi(), changed)
        for filename in ('../outside.py', 'extra.txt'):
            with self.subTest(filename=filename), self.assertRaisesRegex(ValueError, 'file injection'):
                changed = copy.deepcopy(original); changed['files'][filename] = b'bad'
                exporter.create_export_branch(ExportApi(), changed)
        changed = copy.deepcopy(original); changed['files']['signing-receipt.json'] += b' '
        with self.assertRaisesRegex(ValueError, 'receipt bytes changed'):
            exporter.create_export_branch(ExportApi(), changed)

    def test_receipt_source_run_workflow_package_and_pin_are_bound(self):
        for key, value in (('sourceSha', 'c' * 40), ('workflowRun', '99'), ('signerCommit', 'd' * 40),
                           ('packageName', 'com.ecojust.other'), ('certificateSha256', '0' * 64)):
            with self.subTest(key=key):
                receipt = copy.deepcopy(self.fixture.receipt); receipt[key] = value
                (self.fixture.artifact / 'signing-receipt.json').write_text(json.dumps(receipt))
                with self.assertRaises(ValueError): self.verify()

    def test_missing_asset_or_native_icon_hash_is_rejected(self):
        for field in ('assetsSha256', 'nativeSourceSha256'):
            receipt = copy.deepcopy(self.fixture.receipt)
            removed = 'game.js' if field == 'assetsSha256' else 'resource/apps/' + SLUG + '/icon.xml'
            receipt[field].pop(removed)
            (self.fixture.artifact / 'signing-receipt.json').write_text(json.dumps(receipt))
            with self.subTest(field=field), self.assertRaises(ValueError): self.verify()

    def test_certificate_tool_output_must_match_the_pin(self):
        self.fixture.tool_certificate = '0' * 64
        with self.assertRaisesRegex(ValueError, 'certificate verification failed'): self.verify()
        with self.assertRaisesRegex(ValueError, 'signature certificate mismatch'): self.fetch()

    def test_extra_artifact_file_is_rejected(self):
        (self.fixture.artifact / 'untrusted.py').write_text('raise RuntimeError()')
        with self.assertRaisesRegex(ValueError, 'exactly the expected APK'): self.verify()

    def test_other_repository_or_failed_sign_job_prevents_writes(self):
        for api in (ExportApi(repository='attacker/repository'), ExportApi(signed=False)):
            with self.subTest(api=api), self.assertRaises(ValueError):
                exporter.create_export_branch(api, self.verify())
            self.assertTrue(all(method == 'GET' for method, _, _ in api.calls))

    def test_fetch_reads_fixed_ref_tree_blobs_and_source_identity(self):
        api = FetchApi(self.fixture)
        bundle = self.fetch(api)
        self.assertEqual(bundle['files'][APK], self.fixture.raw)
        self.assertTrue(bundle['summary']['sourceIdentityVerified'])
        self.assertTrue(all(path.startswith(('git/', 'contents/', 'actions/runs/')) for path in api.calls))

    def test_fetch_rejects_input_injection_before_api_access(self):
        for field, value in (('run_id', '../master'), ('slug', '../evil'), ('source_sha', 'invalid')):
            api = FetchApi(self.fixture)
            with self.subTest(field=field), self.assertRaises(ValueError): self.fetch(api, **{field: value})
            self.assertEqual(api.calls, [])

    def test_fetch_rejects_wrong_ref_extra_file_and_corrupted_blob(self):
        for api in (FetchApi(self.fixture, wrong_ref=True), FetchApi(self.fixture, injected=True), FetchApi(self.fixture, corrupt_blob=True)):
            with self.subTest(api=api), self.assertRaises(ValueError): self.fetch(api)

    def test_fetch_rejects_receipt_source_run_pin_and_digest_mismatch(self):
        for field, value in (('sourceSha', 'c' * 40), ('workflowRun', '99'), ('certificateSha256', '0' * 64), ('sha256', '0' * 64)):
            receipt = copy.deepcopy(self.fixture.receipt); receipt[field] = value
            with self.subTest(field=field), self.assertRaises(ValueError): self.fetch(FetchApi(self.fixture, receipt=receipt))

    def test_same_files_are_idempotent_and_different_files_are_preserved(self):
        bundle = self.fetch(); output = self.fixture.root / 'download'
        fetcher.store_bundle(bundle, output)
        stamp = (output / APK).stat().st_mtime_ns
        fetcher.store_bundle(bundle, output)
        self.assertEqual((output / APK).stat().st_mtime_ns, stamp)
        other = self.fixture.root / 'different'; other.mkdir()
        (other / 'signing-receipt.json').write_bytes(b'existing different bytes')
        with self.assertRaisesRegex(ValueError, 'different bytes'): fetcher.store_bundle(bundle, other)
        self.assertFalse((other / APK).exists())
        self.assertEqual((other / 'signing-receipt.json').read_bytes(), b'existing different bytes')

    def test_output_symlink_file_injection_and_mutation_are_rejected(self):
        bundle = self.fetch(); destination = self.fixture.root / 'destination'; destination.mkdir()
        alias = self.fixture.root / 'alias'; alias.symlink_to(destination, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'symlinks'): fetcher.store_bundle(bundle, alias)
        changed = copy.deepcopy(bundle); changed['files']['../extra.py'] = b'bad'
        with self.assertRaisesRegex(ValueError, 'file injection'): fetcher.store_bundle(changed, destination)
        changed = copy.deepcopy(bundle); changed['files']['signing-receipt.json'] += b' '
        with self.assertRaisesRegex(ValueError, 'receipt changed'): fetcher.store_bundle(changed, destination)

    def test_file_appearing_after_precheck_is_never_skipped_or_overwritten(self):
        bundle = self.fetch(); output = self.fixture.root / 'race'; output.mkdir(); target = output / APK
        actual_exists = Path.exists; armed = [True]
        def appear_after_precheck(path):
            result = actual_exists(path)
            if path == target and not result and armed[0]:
                armed[0] = False; path.write_bytes(b'concurrent different file')
            return result
        with patch.object(Path, 'exists', appear_after_precheck):
            with self.assertRaisesRegex(ValueError, 'appeared with different bytes'): fetcher.store_bundle(bundle, output)
        self.assertEqual(target.read_bytes(), b'concurrent different file')
        self.assertFalse((output / 'signing-receipt.json').exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
