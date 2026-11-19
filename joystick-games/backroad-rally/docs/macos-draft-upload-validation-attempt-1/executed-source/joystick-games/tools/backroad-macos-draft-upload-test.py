#!/usr/bin/env python3
"""Small offline fixtures only; no real API, Release mutation or large artifact download."""
import base64
import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import stat
import tempfile
import unittest
from unittest import mock
import warnings
import zipfile

spec = importlib.util.spec_from_file_location('backroad_transfer', Path(__file__).with_name('backroad-macos-draft-upload.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
NAMES = list(m.PACKAGES)
BODIES = {NAMES[0]: b'original signed ZIP fixture', NAMES[1]: b'original signed DMG fixture'}
SMALL = {name: {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()} for name, raw in BODIES.items()}


def archive_bytes(change=None):
    manifest = {'game': m.GAME, 'version': '0.1.0', 'sourceCommit': m.REQUEST['source'], 'committedInputsVerified': True, 'packages': SMALL}
    entries = {name: b'other original artifact member' for name in m.EXPECTED_MEMBERS}
    entries.update({m.GAME + '/' + name: raw for name, raw in BODIES.items()})
    entries[m.GAME + '/build-manifest.json'] = json.dumps(manifest).encode()
    entries[m.GAME + '/SHA256SUMS.txt'] = ''.join(f'{v["sha256"]}  {n}\n' for n, v in SMALL.items()).encode()
    if change:
        change(entries)
    out = io.BytesIO()
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, raw in entries.items():
            z.writestr(name, raw)
    return out.getvalue()


class Fake:
    def __init__(self, body=None):
        self.body = body or archive_bytes()
        self.artifact_constant = {'name': m.ARTIFACT['name'], 'bytes': len(self.body), 'sha256': hashlib.sha256(self.body).hexdigest()}
        req = m.REQUEST
        self.run = {'id': req['run'], 'run_attempt': 1, 'head_sha': req['source'], 'head_branch': 'build-source/original', 'repository': {'id': 7, 'full_name': m.origin.REPO}, 'head_repository': {'id': 7, 'full_name': m.origin.REPO}, 'path': m.origin.MACOS_WORKFLOW, 'event': 'workflow_dispatch', 'status': 'completed', 'conclusion': 'failure'}
        self.artifact = {'id': req['artifact'], 'name': self.artifact_constant['name'], 'expired': False, 'expires_at': '2099-01-01T00:00:00Z', 'size_in_bytes': len(self.body), 'digest': 'sha256:' + self.artifact_constant['sha256'], 'created_at': '2026-11-19T00:00:45Z', 'workflow_run': {'id': req['run'], 'head_sha': req['source'], 'head_branch': self.run['head_branch'], 'repository_id': 7, 'head_repository_id': 7}}
        self.jobs = [{'id': 81, 'name': 'build (racing-01, backroad-rally, ponpoko-kart, night-racer)', 'run_id': req['run'], 'run_attempt': 1, 'head_sha': req['source'], 'status': 'completed', 'conclusion': 'success', 'started_at': '2026-11-19T00:00:00Z', 'completed_at': '2026-11-19T00:01:00Z', 'steps': [{'name': 'Run actions/upload-artifact@v4', 'number': n, 'status': 'completed', 'conclusion': 'success', 'started_at': a, 'completed_at': b} for n, a, b in [(6, '2026-11-19T00:00:20Z', '2026-11-19T00:00:30Z'), (7, '2026-11-19T00:00:40Z', '2026-11-19T00:00:50Z')]]}]
        self.release = {'id': req['release'], 'draft': True, 'published_at': None, 'tag_name': m.TAG, 'target_commitish': req['source'], 'url': f'{m.origin.API}/repos/{m.origin.REPO}/releases/{req["release"]}', 'upload_url': f'https://uploads.github.com/repos/{m.origin.REPO}/releases/{req["release"]}/assets{{?name,label}}'}
        raw = json.dumps({'schemaVersion': 1, 'games': {g: {} for g in ['backroad-rally', 'ponpoko-kart', 'night-racer']}, 'batches': {'racing-01': ['backroad-rally', 'ponpoko-kart', 'night-racer']}}).encode()
        blob = hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
        self.registry = {'type': 'file', 'path': m.origin.REGISTRY_PATH, 'name': 'catalog-registry.json', 'url': f'{m.origin.API}/repos/{m.origin.REPO}/contents/{m.origin.REGISTRY_PATH}?ref={req["source"]}', 'sha': blob, 'git_url': f'{m.origin.API}/repos/{m.origin.REPO}/git/blobs/{blob}', 'size': len(raw), 'encoding': 'base64', 'content': base64.encodebytes(raw).decode()}
        self.assets, self.uploads = [], []
        self.downloads = 0
        self.artifact_reads = 0
        self.release_reads = 0
        self.fail_on_upload = None
        self.publish_at = None
        self.change_artifact_at = None
        self.list_override = None
    def asset(self, name, asset_id):
        return {'id': asset_id, 'name': name, 'state': 'uploaded', 'size': SMALL[name]['bytes'], 'digest': 'sha256:' + SMALL[name]['sha256'], 'url': f'{m.origin.API}/repos/{m.origin.REPO}/releases/assets/{asset_id}', 'browser_download_url': f'https://github.com/{m.origin.REPO}/releases/download/{m.TAG}/{name}'}
    def get(self, path):
        if '/contents/' in path:
            return copy.deepcopy(self.registry)
        if '/actions/runs/' in path:
            return copy.deepcopy(self.run)
        if '/actions/artifacts/' in path:
            self.artifact_reads += 1
            out = copy.deepcopy(self.artifact)
            if self.artifact_reads == self.change_artifact_at:
                out['expired'] = True
            return out
        if '/releases/assets/' in path:
            return copy.deepcopy(next(a for a in self.assets if str(a['id']) == path.rsplit('/', 1)[1]))
        if '/releases/' in path:
            self.release_reads += 1
            out = copy.deepcopy(self.release)
            if self.release_reads == self.publish_at:
                out['draft'] = False
            return out
        raise AssertionError(path)
    def pages(self, path, field=None):
        if field == 'jobs':
            return copy.deepcopy(self.jobs)
        if field == 'artifacts':
            return copy.deepcopy(self.list_override if self.list_override is not None else [self.artifact])
        if path.endswith('/assets'):
            return copy.deepcopy(self.assets)
        raise AssertionError(path)
    def download(self, artifact, destination, size):
        assert artifact == m.REQUEST['artifact']
        self.downloads += 1
        destination.write_bytes(self.body)
        return len(self.body), hashlib.sha256(self.body).hexdigest()
    def upload(self, release, name, path, size):
        assert release == m.REQUEST['release'] and path.read_bytes() == BODIES[name] and size == SMALL[name]['bytes']
        self.uploads.append(name)
        if len(self.uploads) == self.fail_on_upload:
            raise RuntimeError('DO-NOT-SERIALIZE-TOKEN-SIGNED-URL')
        value = self.asset(name, 100 + len(self.assets))
        self.assets.append(value)
        return copy.deepcopy(value)


class TransferTests(unittest.TestCase):
    def execute(self, fake):
        with tempfile.TemporaryDirectory() as d, mock.patch.object(m, 'PACKAGES', SMALL), mock.patch.object(m, 'ARTIFACT', fake.artifact_constant):
            output = Path(d) / 'output'
            passed = m.execute(fake, output)
            receipt = (output / 'receipts/transfer.json').read_text()
            self.assertLess(len(receipt.encode()), 128000)
            self.assertNotIn('DO-NOT-SERIALIZE', receipt)
            self.assertEqual([p.name for p in (output / 'receipts').iterdir()], ['transfer.json'])
            return passed, json.loads(receipt)
    def test_production_constants_are_exact(self):
        self.assertEqual(m.REQUEST, {'run': 44608415225, 'attempt': 1, 'source': '68d343d22c762c904eb83854d4ab9c4113a7c30f', 'artifact': 14570673468, 'release': 451969286})
        self.assertEqual(m.TAG, 'joystick-backroad-rally-v0.1.0')
        self.assertEqual(m.ARTIFACT['bytes'], 259564880)
        self.assertEqual(m.ARTIFACT['sha256'], 'a8bfc0f08fdf71fc88719792075953f76a22cf4a64a308e597db169a3ccd7476')
        self.assertEqual(m.PACKAGES[NAMES[0]], {'bytes': 105275042, 'sha256': '61ac58f2f75ff5ede9850d43e1bc77448731f870dd309efbb2af5d9236d57323'})
        self.assertEqual(m.PACKAGES[NAMES[1]], {'bytes': 108258927, 'sha256': 'f1eb37f1ec24e75365f40f7c71a631a722f5657a849e984d0d7f7f515b60bd28'})
    def test_original_complete_artifact_and_two_original_bytes_only(self):
        f = Fake()
        ok, result = self.execute(f)
        self.assertTrue(ok, result)
        self.assertEqual(f.uploads, NAMES)
        self.assertEqual(f.downloads, 1)
        self.assertTrue(result['archiveValidation']['allMembersCrcVerified'])
        self.assertFalse(result['releaseCreatedOrPublished'])
        self.assertFalse(result['packagesRebuiltOrResigned'])
        self.assertEqual(result['source']['runConclusion'], 'failure')
    def test_existing_matching_assets_reuse_after_full_original_validation(self):
        f = Fake()
        f.assets = [f.asset(n, 101 + i) for i, n in enumerate(NAMES)]
        ok, result = self.execute(f)
        self.assertTrue(ok, result)
        self.assertEqual(f.uploads, [])
        self.assertEqual(f.downloads, 1)
        self.assertEqual([a['operation'] for a in result['assets']], ['reused-identical'] * 2)
    def test_real_draft_untagged_download_url_is_preserved_without_publication(self):
        f = Fake()
        f.assets = [f.asset(n, 101 + i) for i, n in enumerate(NAMES)]
        for asset in f.assets:
            asset['browser_download_url'] = asset['browser_download_url'].replace(m.TAG, 'untagged-202f02493ce058d40550')
        ok, result = self.execute(f)
        self.assertTrue(ok, result)
        self.assertFalse(f.uploads)
        self.assertIn('/untagged-', result['assets'][0]['downloadUrl'])
        self.assertTrue(result['release']['draft'])
    def test_partial_upload_failure_is_preserved_and_resume_uploads_only_missing(self):
        f = Fake(); f.fail_on_upload = 2
        ok, result = self.execute(f)
        self.assertFalse(ok)
        self.assertEqual(len(result['assets']), 1)
        self.assertEqual(result['uploadAttempt']['name'], NAMES[1])
        f.fail_on_upload = None; f.uploads = []
        ok, result = self.execute(f)
        self.assertTrue(ok, result)
        self.assertEqual(f.uploads, [NAMES[1]])
    def test_existing_different_or_incomplete_asset_never_uploads(self):
        for change in [lambda a: a.update(size=1), lambda a: a.update(digest='sha256:' + '0' * 64), lambda a: a.update(state='starter'), lambda a: a.update(url='https://other.invalid'), lambda a: a.update(browser_download_url='https://other.invalid')]:
            with self.subTest(change=change):
                f = Fake(); f.assets = [f.asset(NAMES[1], 101)]; change(f.assets[0])
                self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads); self.assertEqual(f.downloads, 0)
    def test_duplicate_asset_names_and_ids_rejected(self):
        for same_name in (True, False):
            f = Fake(); f.assets = [f.asset(NAMES[0], 101), f.asset(NAMES[0] if same_name else NAMES[1], 102 if same_name else 101)]
            self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
    def test_original_run_attempt_source_producer_and_membership_rejections(self):
        changes = [lambda f: f.run.update(head_sha='0' * 40), lambda f: f.run.update(run_attempt=2), lambda f: f.run.update(path='.github/workflows/other.yml'), lambda f: f.artifact.update(expired=True), lambda f: f.jobs[0].update(conclusion='failure'), lambda f: f.jobs[0].update(name='build (racing-01, night-racer, ponpoko-kart, backroad-rally)'), lambda f: f.jobs[0]['steps'][1].update(conclusion='failure'), lambda f: f.artifact.update(created_at='2026-11-19T00:00:20Z'), lambda f: setattr(f, 'list_override', []), lambda f: setattr(f, 'list_override', [f.artifact, f.artifact])]
        for change in changes:
            with self.subTest(change=change):
                f = Fake(); change(f)
                self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
    def test_wrong_draft_tag_target_and_publication_rejected(self):
        for key, value in [('id', 1), ('draft', False), ('published_at', '2026-01-01T00:00:00Z'), ('tag_name', 'other'), ('target_commitish', 'master'), ('upload_url', 'https://other.invalid')]:
            f = Fake(); f.release[key] = value
            self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
    def test_rechecks_before_each_upload_and_no_retry(self):
        f = Fake(); f.publish_at = 2
        self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
        f = Fake(); f.change_artifact_at = 2
        self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
        f = Fake(); f.fail_on_upload = 1
        self.assertFalse(self.execute(f)[0]); self.assertEqual(len(f.uploads), 1)
    def test_outer_digest_mismatch_never_extracts_or_uploads(self):
        f = Fake(); f.body += b'tampered'
        self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
    def test_archive_traversal_extra_missing_symlink_duplicate_crc_rejected(self):
        changes = [lambda e: e.__setitem__('../escape', b'x'), lambda e: e.pop(next(iter(e))), lambda e: e.__setitem__('backroad-rally/extra', b'x')]
        for change in changes:
            f = Fake(archive_bytes(change)); self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
        raw = archive_bytes()
        for kind in ['symlink', 'duplicate', 'crc']:
            stream = io.BytesIO(raw)
            with warnings.catch_warnings():
                warnings.simplefilter('ignore', UserWarning)
                with zipfile.ZipFile(stream, 'a') as z:
                    if kind == 'symlink':
                        info = zipfile.ZipInfo('backroad-rally/extra'); info.external_attr = (stat.S_IFLNK | 0o777) << 16; z.writestr(info, b'target')
                    elif kind == 'duplicate':
                        z.writestr(next(iter(m.EXPECTED_MEMBERS)), b'x')
            data = bytearray(stream.getvalue())
            if kind == 'crc':
                with zipfile.ZipFile(io.BytesIO(data)) as z:
                    info = z.infolist()[0]
                    data[info.header_offset + 30 + len(info.filename.encode()) + len(info.extra) + 1] ^= 1
            f = Fake(bytes(data)); self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
    def test_package_bytes_manifest_source_and_sums_rejected(self):
        def manifest_change(entries):
            key = m.GAME + '/build-manifest.json'; value = json.loads(entries[key]); value['sourceCommit'] = '0' * 40; entries[key] = json.dumps(value).encode()
        for change in [lambda e: e.__setitem__(m.GAME + '/' + NAMES[0], b'changed original bytes'), lambda e: e.__setitem__(m.GAME + '/SHA256SUMS.txt', b'wrong'), manifest_change]:
            f = Fake(archive_bytes(change)); self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
    def test_single_post_fixed_endpoint_correct_mime_no_retry(self):
        calls = []
        class Connection:
            def __init__(self, host, timeout): calls.append(('host', host, timeout))
            def putrequest(self, method, path): calls.append((method, path))
            def putheader(self, key, value): calls.append((key, value))
            def endheaders(self): pass
            def send(self, raw): calls.append(('body', raw))
            def getresponse(self): return type('Response', (), {'status': 201, 'read': lambda self, limit: b'{"id": 1}'})()
            def close(self): calls.append(('close',))
        client = m.GitHub('fake-token')
        with tempfile.TemporaryDirectory() as d, mock.patch.object(m, 'PACKAGES', SMALL), mock.patch.object(m.http.client, 'HTTPSConnection', Connection):
            path = Path(d) / NAMES[1]; path.write_bytes(BODIES[NAMES[1]])
            self.assertEqual(client.upload(m.REQUEST['release'], NAMES[1], path, SMALL[NAMES[1]]['bytes']), {'id': 1})
        self.assertEqual([c for c in calls if c[0] == 'POST'], [('POST', f'/repos/ecojust/pureTV/releases/451969286/assets?name={NAMES[1]}')])
        self.assertIn(('Content-Type', 'application/x-apple-diskimage'), calls)
        self.assertIn(('body', BODIES[NAMES[1]]), calls)
        calls.clear()
        with tempfile.TemporaryDirectory() as d, mock.patch.object(m, 'PACKAGES', SMALL), mock.patch.object(m.http.client, 'HTTPSConnection', Connection), mock.patch.object(Connection, 'getresponse', lambda self: type('Response', (), {'status': 500})()):
            path = Path(d) / NAMES[1]; path.write_bytes(BODIES[NAMES[1]])
            with self.assertRaisesRegex(m.origin.Rejected, 'asset_upload_rejected'):
                client.upload(m.REQUEST['release'], NAMES[1], path, SMALL[NAMES[1]]['bytes'])
        self.assertEqual(len([c for c in calls if c[0] == 'POST']), 1)
    def test_archive_symlink_at_expected_name_is_rejected(self):
        original = archive_bytes()
        output = io.BytesIO()
        with zipfile.ZipFile(io.BytesIO(original)) as source, zipfile.ZipFile(output, 'w') as target:
            for info in source.infolist():
                data = source.read(info)
                if info.filename == m.GAME + '/' + NAMES[0]:
                    info.external_attr = (stat.S_IFLNK | 0o777) << 16
                target.writestr(info, data)
        f = Fake(output.getvalue())
        ok, result = self.execute(f)
        self.assertFalse(ok)
        self.assertEqual(result['failureCode'], 'archive_nonregular_member')
        self.assertFalse(f.uploads)


if __name__ == '__main__':
    unittest.main(verbosity=2)
