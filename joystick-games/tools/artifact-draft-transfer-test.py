#!/usr/bin/env python3
"""Offline boundary tests: fake API only; no token, network or Release writes."""
import copy
import base64
import datetime as dt
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import io
import urllib.error
from unittest import mock
import unittest

spec = importlib.util.spec_from_file_location('transfer', Path(__file__).with_name('artifact-draft-transfer.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
REQ = {'run': 71, 'attempt': 2, 'source': 'a' * 40, 'artifact': 91, 'release': 81}
BODY = b'PK\x03\x04original immutable archive bytes'
DIGEST = hashlib.sha256(BODY).hexdigest()
MAC_GAMES = ['backroad-rally', 'ponpoko-kart', 'night-racer']

def registry_item(raw=None):
    if raw is None:
        raw = json.dumps({'schemaVersion': 1, 'games': {game: {} for game in MAC_GAMES}, 'batches': {'racing-01': MAC_GAMES}}, indent=2).encode()
    blob = hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
    return {'type': 'file', 'path': m.REGISTRY_PATH, 'name': 'catalog-registry.json', 'url': f'{m.API}/repos/{m.REPO}/contents/{m.REGISTRY_PATH}?ref={REQ["source"]}', 'sha': blob, 'git_url': f'{m.API}/repos/{m.REPO}/git/blobs/{blob}', 'size': len(raw), 'encoding': 'base64', 'content': base64.encodebytes(raw).decode()}

def fixture():
    run = {'id': 71, 'run_attempt': 2, 'head_sha': 'a'*40, 'head_branch': 'source/frozen', 'repository': {'id': 7, 'full_name': m.REPO}, 'head_repository': {'id': 7, 'full_name': m.REPO}, 'path': '.github/workflows/joystick-catalog-android.yml', 'event': 'workflow_dispatch', 'status': 'in_progress', 'conclusion': None}
    artifact = {'id': 91, 'name': 'joystick-android-signed', 'expired': False, 'expires_at': '2099-01-01T00:00:00Z', 'size_in_bytes': len(BODY), 'digest': 'sha256:' + DIGEST, 'created_at': '2026-11-19T00:00:30Z', 'workflow_run': {'id': 71, 'head_sha': 'a'*40, 'head_branch': 'source/frozen', 'repository_id': 7, 'head_repository_id': 7}}
    job = {'id': 61, 'name': 'sign', 'run_id': 71, 'run_attempt': 2, 'head_sha': 'a'*40, 'status': 'completed', 'conclusion': 'success', 'started_at': '2026-11-19T00:00:00Z', 'completed_at': '2026-11-19T00:01:00Z', 'steps': [{'name': 'Run actions/upload-artifact@v4', 'number': 4, 'status': 'completed', 'conclusion': 'success', 'started_at': '2026-11-19T00:00:20Z', 'completed_at': '2026-11-19T00:00:40Z'}]}
    job['steps'].append({'name': 'Run actions/upload-artifact@v4', 'number': 5, 'status': 'completed', 'conclusion': 'success', 'started_at': '2026-11-19T00:00:40Z', 'completed_at': '2026-11-19T00:00:55Z'})
    release = {'id': 81, 'draft': True, 'tag_name': 'racing-package-staging-71-attempt-2', 'target_commitish': 'a'*40, 'url': 'https://api.github.com/repos/ecojust/pureTV/releases/81', 'upload_url': 'https://uploads.github.com/repos/ecojust/pureTV/releases/81/assets{?name,label}'}
    return run, artifact, [job], release

class Fake:
    def __init__(self):
        self.run, self.artifact, self.jobs, self.release = fixture()
        self.assets = []
        self.uploads = []
        self.download_body = BODY
        self.asset_digest = 'sha256:' + DIGEST
        self.fail_upload = False
        self.release_reads = 0
        self.publish_at_read = None
        self.listed_artifact = None
        self.registry = registry_item()
        self.reads = []
    def get(self, path):
        self.reads.append(path)
        if '/contents/' in path:
            assert path == f'/repos/{m.REPO}/contents/{m.REGISTRY_PATH}?ref={REQ["source"]}'
            return copy.deepcopy(self.registry)
        if '/actions/runs/' in path: return copy.deepcopy(self.run)
        if '/actions/artifacts/' in path: return copy.deepcopy(self.artifact)
        if '/releases/assets/' in path: return copy.deepcopy(self.assets[0])
        if '/releases/' in path:
            self.release_reads += 1
            r = copy.deepcopy(self.release)
            if self.release_reads == self.publish_at_read: r['draft'] = False
            return r
        raise AssertionError(path)
    def pages(self, path, field=None):
        if field == 'jobs': return copy.deepcopy(self.jobs)
        if field == 'artifacts': return [copy.deepcopy(self.listed_artifact or self.artifact)]
        if path.endswith('/assets'): return copy.deepcopy(self.assets)
        raise AssertionError(path)
    def download(self, artifact, destination, expected_size):
        destination.write_bytes(self.download_body)
        return len(self.download_body), hashlib.sha256(self.download_body).hexdigest()
    def upload(self, release, name, path, size):
        self.uploads.append((release, name, path.read_bytes(), size))
        if self.fail_upload: raise RuntimeError('secret token and https://signed.example/?sig=SECRET')
        asset = {'id': 101, 'name': name, 'state': 'uploaded', 'size': size, 'digest': self.asset_digest}
        self.assets.append(asset)
        return {'id': 101}

class TransferTests(unittest.TestCase):
    def execute(self, fake, request=None):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / 'transfer'
            passed = m.execute(fake, request or REQ, out)
            record = json.loads((out/'receipts/transfer.json').read_text())
            self.assertLess((out/'receipts/transfer.json').stat().st_size, 128000)
            return passed, record
    def test_exact_bytes_to_draft_while_original_runtime_still_running(self):
        fake = Fake()
        passed, record = self.execute(fake)
        self.assertTrue(passed)
        self.assertEqual(fake.uploads, [(81, 'artifact-91.zip', BODY, len(BODY))])
        self.assertEqual(record['asset']['sha256'], DIGEST)
        self.assertFalse(record['packageSignatureOrGameplayVerified'])
        self.assertFalse(record['zip']['repacked'])
    def test_queued_android_runtime_with_successful_signing_job(self):
        fake = Fake()
        fake.run['status'] = 'queued'
        passed, record = self.execute(fake)
        self.assertTrue(passed)
        self.assertEqual(record['asset']['sha256'], DIGEST)

    def test_queued_run_requires_completed_successful_signing_and_upload(self):
        for mutation in (
            lambda f: f.jobs[0].update(status='in_progress'),
            lambda f: f.jobs[0].update(conclusion='failure'),
            lambda f: f.jobs[0]['steps'][0].update(conclusion='failure'),
            lambda f: f.jobs[0]['steps'][0].update(status='in_progress'),
            lambda f: f.jobs[0].update(head_sha='b' * 40),
        ):
            fake = Fake()
            fake.run['status'] = 'queued'
            mutation(fake)
            self.assertFalse(self.execute(fake)[0])
            self.assertFalse(fake.uploads)

    def test_identity_rejections_never_upload(self):
        mutations = [
            lambda f: f.run.update(head_sha='b'*40),
            lambda f: f.run.update(run_attempt=1),
            lambda f: f.run.update(event='pull_request'),
            lambda f: f.run.update(path='.github/workflows/arbitrary.yml'),
            lambda f: f.run['repository'].update(full_name='attacker/repo'),
            lambda f: f.artifact['workflow_run'].update(head_repository_id=8),
            lambda f: f.artifact.update(id=92),
            lambda f: f.artifact.update(expired=True),
            lambda f: f.artifact.update(expires_at='2000-01-01T00:00:00Z'),
            lambda f: f.artifact.update(digest=None),
            lambda f: f.artifact.update(digest='sha1:'+'a'*40),
            lambda f: f.artifact.update(size_in_bytes=m.MAX_BYTES+1),
            lambda f: f.artifact.update(size_in_bytes=True),
            lambda f: f.artifact.update(name='joystick-android-report-sign'),
            lambda f: f.artifact.update(created_at='2026-11-19T00:00:10Z'),
            lambda f: f.jobs[0].update(run_attempt=1),
            lambda f: f.jobs[0].update(status='in_progress'),
            lambda f: f.jobs[0]['steps'][0].update(conclusion='failure'),
            lambda f: f.jobs.append(copy.deepcopy(f.jobs[0])),
            lambda f: f.release.update(draft=False),
            lambda f: f.release.update(tag_name='unrelated'),
            lambda f: f.release.update(target_commitish='master'),
            lambda f: f.release.update(upload_url='https://attacker.example/upload'),
            lambda f: f.assets.append({'id': 5, 'name': 'artifact-91.zip'}),
        ]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                fake = Fake(); mutation(fake)
                passed, record = self.execute(fake)
                self.assertFalse(passed)
                self.assertFalse(fake.uploads)
                self.assertEqual(record['status'], 'failed')
    def test_source_membership_mismatch(self):
        f = Fake(); f.listed_artifact = copy.deepcopy(f.artifact); f.listed_artifact['digest'] = 'sha256:'+'0'*64
        self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
    def test_wrong_zip_hash_or_size_never_uploads(self):
        for body in (BODY+b'x', BODY[:-1], b'x'*len(BODY)):
            f = Fake(); f.download_body = body
            self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
    def test_draft_rechecked_before_and_after_upload(self):
        for read in (2, 3):
            f = Fake(); f.publish_at_read = read
            self.assertFalse(self.execute(f)[0]); self.assertEqual(len(f.uploads), 0 if read == 2 else 1)
    def test_bad_uploaded_digest_preserves_asset_identity(self):
        f = Fake(); f.asset_digest = 'sha256:'+'0'*64
        passed, record = self.execute(f)
        self.assertFalse(passed); self.assertEqual(record['assetId'], 101); self.assertEqual(len(f.uploads), 1)
    def test_upload_failure_not_retried_and_no_secret_in_receipt(self):
        f = Fake(); f.fail_upload = True
        passed, record = self.execute(f)
        self.assertFalse(passed); self.assertEqual(len(f.uploads), 1)
        self.assertNotIn('SECRET', json.dumps(record)); self.assertNotIn('signed.example', json.dumps(record))
    def test_allowed_platform_artifact_names_bind_producer_job(self):
        cases = [('android', 'joystick-android-unsigned-backroad-rally', 'build (backroad-rally)'), ('macos', 'joystick-catalog-macos-packages-racing-01', 'build (racing-01, backroad-rally, ponpoko-kart, night-racer)'), ('windows', 'joystick-windows-packages-backroad-rally', 'verify (backroad-rally)')]
        for platform, name, job in cases:
            f = Fake(); f.run['path'] = f'.github/workflows/joystick-catalog-{platform}.yml'; f.artifact['name'] = name; f.jobs[0]['name'] = job
            if platform in ('macos', 'windows'): f.artifact['created_at'] = '2026-11-19T00:00:50Z'
            passed, record = self.execute(f)
            self.assertTrue(passed)
            if platform == 'macos':
                matrix = record['source']['producerMatrix']
                self.assertEqual(matrix['games'], MAC_GAMES)
                self.assertEqual(matrix['registry']['sourceCommit'], REQ['source'])
                self.assertEqual(matrix['registry']['gitBlobSha'], f.registry['sha'])
                self.assertEqual(matrix['registry']['sha256'], hashlib.sha256(base64.b64decode(f.registry['content'])).hexdigest())
                self.assertEqual([p for p in f.reads if '/contents/' in p], [matrix['registry']['apiPath']])
            else:
                self.assertNotIn('producerMatrix', record['source'])
                self.assertFalse(any('/contents/' in p for p in f.reads))

    def macos_fake(self):
        f = Fake()
        f.run['path'] = m.MACOS_WORKFLOW
        f.artifact.update(name='joystick-catalog-macos-packages-racing-01', created_at='2026-11-19T00:00:50Z')
        f.jobs[0]['name'] = 'build (racing-01, backroad-rally, ponpoko-kart, night-racer)'
        return f

    def test_macos_job_must_match_entire_ordered_frozen_matrix(self):
        for name in ['build (racing-01)', 'build (racing-01, backroad-rally)', 'build (racing-01, ponpoko-kart, backroad-rally, night-racer)', 'build (racing-01, backroad-rally, ponpoko-kart, night-racer, extra)', 'build (racing-01, backroad-rally, ponpoko-kart, night-racer) suffix']:
            with self.subTest(name=name):
                f = self.macos_fake(); f.jobs[0]['name'] = name
                self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
        f = self.macos_fake(); f.jobs.append(copy.deepcopy(f.jobs[0]))
        self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)

    def test_macos_registry_unknown_ambiguous_or_unregistered_batch_rejected(self):
        valid = json.loads(base64.b64decode(registry_item()['content']))
        mutations = [
            lambda r: r.update(schemaVersion=True),
            lambda r: r.update(schemaVersion=2),
            lambda r: r.update(batches={}),
            lambda r: r['batches'].update({'racing-01': []}),
            lambda r: r['batches'].update({'racing-01': MAC_GAMES + [MAC_GAMES[0]]}),
            lambda r: r['batches'].update({'racing-01': 'backroad-rally'}),
            lambda r: r['batches'].update({'racing-01': ['bad, game']}),
            lambda r: r['games'].pop('night-racer'),
            lambda r: r['games'].update({'night-racer': None}),
        ]
        for mutate in mutations:
            f = self.macos_fake(); registry = copy.deepcopy(valid); mutate(registry)
            f.registry = registry_item(json.dumps(registry).encode())
            self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
        # Duplicate JSON keys cannot silently select a different batch or game.
        f = self.macos_fake()
        f.registry = registry_item(b'{"schemaVersion":1,"games":{},"batches":{"racing-01":[],"racing-01":["night-racer"]}}')
        passed, record = self.execute(f)
        self.assertFalse(passed); self.assertFalse(f.uploads)
        self.assertEqual(record['failureCode'], 'registry_duplicate_json_key')

    def test_macos_registry_original_source_and_bytes_are_bound(self):
        mutations = [
            lambda r: r.update(type='symlink'),
            lambda r: r.update(path='other/catalog-registry.json'),
            lambda r: r.update(url=r['url'].replace(REQ['source'], 'master')),
            lambda r: r.update(url=r['url'].replace(REQ['source'], 'b'*40)),
            lambda r: r.update(git_url=r['git_url'].replace(m.REPO, 'attacker/repo')),
            lambda r: r.update(sha='b'*40),
            lambda r: r.update(encoding='none'),
            lambda r: r.update(size=True),
            lambda r: r.update(size=r['size']+1),
            lambda r: r.update(content=base64.b64encode(b'x'*r['size']).decode()),
        ]
        for mutate in mutations:
            f = self.macos_fake(); mutate(f.registry)
            self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
        f = self.macos_fake()
        registry, evidence = m.source_registry(f, REQ['source'])
        evidence['sourceCommit'] = 'b'*40
        with self.assertRaisesRegex(m.Rejected, 'registry_source_mismatch'):
            m.source_identity(f.run, f.artifact, f.jobs, REQ, registry_source=(registry, evidence))

    def test_macos_uses_original_registry_order_not_current_checkout(self):
        f = self.macos_fake()
        registry = json.loads(base64.b64decode(f.registry['content']))
        registry['batches']['racing-01'] = list(reversed(MAC_GAMES))
        f.registry = registry_item(json.dumps(registry).encode())
        self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
        f.jobs[0]['name'] = 'build (racing-01, night-racer, ponpoko-kart, backroad-rally)'
        with mock.patch.object(Path, 'read_text', side_effect=AssertionError('No current checkout registry')):
            info = m.source_identity(f.run, f.artifact, f.jobs, REQ, registry_source=m.source_registry(f, REQ['source']))
        self.assertEqual(info['producerMatrix']['games'], list(reversed(MAC_GAMES)))

    def test_macos_exact_name_still_requires_original_attempt_source_and_upload(self):
        for mutate in [lambda f: f.jobs[0].update(head_sha='b'*40), lambda f: f.jobs[0].update(run_attempt=1), lambda f: f.jobs[0].update(run_id=72), lambda f: f.jobs[0]['steps'][1].update(conclusion='failure'), lambda f: f.artifact.update(created_at='2026-11-19T00:00:30Z')]:
            f = self.macos_fake(); mutate(f)
            self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)

    def test_original_upload_end_registration_offset_is_explicit_and_bounded(self):
        for seconds, passed in [(1, True), (2, True), (3, False)]:
            with self.subTest(offset=seconds):
                f = self.macos_fake()
                f.artifact['created_at'] = f'2026-11-19T00:00:{55+seconds}Z'
                actual, record = self.execute(f)
                self.assertEqual(actual, passed)
                self.assertEqual(len(f.uploads), 1 if passed else 0)
                if passed:
                    binding = record['source']['uploadTimestampBinding']
                    self.assertEqual(binding['offsetSeconds'], seconds)
                    self.assertEqual(binding['maxEndOffsetSeconds'], 2)
                    self.assertEqual(binding['startToleranceSeconds'], 0)
                    self.assertTrue(binding['jobBoundsStrict'])
                    self.assertTrue(binding['toleranceApplied'])
                    self.assertIn('44602407034', binding['toleranceBasis'])

    def test_upload_registration_tolerance_does_not_relax_job_start_or_source(self):
        mutations = [
            lambda f: f.jobs[0].update(completed_at='2026-11-19T00:00:55Z'),
            lambda f: f.jobs[0].update(head_sha='b'*40),
            lambda f: f.jobs[0].update(run_attempt=1),
            lambda f: f.jobs[0]['steps'][1].update(conclusion='failure'),
            lambda f: f.jobs[0]['steps'][1].update(started_at='2026-11-19T00:00:57Z'),
            lambda f: f.jobs[0]['steps'][1].update(started_at='2026-11-19T00:00:56Z'),
            lambda f: f.jobs[0]['steps'].append(copy.deepcopy(f.jobs[0]['steps'][1])),
        ]
        for mutate in mutations:
            f = self.macos_fake(); f.artifact['created_at'] = '2026-11-19T00:00:56Z'; mutate(f)
            self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)
    def test_foreign_and_invalid_inputs_fail_before_upload(self):
        for key, value in [('run', True), ('attempt', 0), ('source', 'main'), ('artifact', -1), ('release', 0)]:
            f = Fake(); r = dict(REQ); r[key] = value
            self.assertFalse(self.execute(f, r)[0]); self.assertFalse(f.uploads)
    def test_existing_receipt_directory_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d); (root/'receipts').mkdir(); (root/'receipts/transfer.json').write_text('original')
            with self.assertRaises(FileExistsError): m.execute(Fake(), REQ, root)
            self.assertEqual((root/'receipts/transfer.json').read_text(), 'original')

class NetworkBoundaryTests(unittest.TestCase):
    def test_signed_redirect_strips_token_and_streams_original_bytes(self):
        requests = []
        class Opener:
            def open(self, request, timeout):
                requests.append(request)
                if len(requests) == 1:
                    raise urllib.error.HTTPError(request.full_url, 302, 'redirect', {'Location': 'https://test.blob.core.windows.net/archive?sig=SECRET'}, None)
                return io.BytesIO(BODY)
        client = m.GitHub('PRIVATE_TOKEN'); client.opener = Opener()
        with tempfile.TemporaryDirectory() as d:
            path = Path(d)/'original.zip'
            self.assertEqual(client.download(91, path, len(BODY)), (len(BODY), DIGEST))
            self.assertEqual(path.read_bytes(), BODY)
        self.assertEqual(requests[0].get_header('Authorization'), 'Bearer PRIVATE_TOKEN')
        self.assertIsNone(requests[1].get_header('Authorization'))

    def test_untrusted_or_plaintext_redirects_are_rejected(self):
        for target in ['http://test.blob.core.windows.net/x', 'https://attacker.example/x', 'https://test.blob.core.windows.net.attacker.example/x', 'https://u:p@test.blob.core.windows.net/x', 'https://test.blob.core.windows.net:444/x']:
            class Opener:
                def open(self, request, timeout):
                    raise urllib.error.HTTPError(request.full_url, 302, 'redirect', {'Location': target}, None)
            client=m.GitHub('PRIVATE_TOKEN'); client.opener=Opener()
            with tempfile.TemporaryDirectory() as d, self.assertRaises(m.Rejected):
                client.download(91, Path(d)/'x.zip', len(BODY))

    def test_stream_excess_or_truncation_rejected(self):
        for body in (BODY+b'x', BODY[:-1]):
            class Opener:
                def open(self, request, timeout): return io.BytesIO(body)
            client=m.GitHub('PRIVATE_TOKEN'); client.opener=Opener()
            with tempfile.TemporaryDirectory() as d, self.assertRaises(m.Rejected):
                client.download(91, Path(d)/'x.zip', len(BODY))

    def test_only_upload_mutation_uses_fixed_host_and_unmodified_body(self):
        calls=[]; sent=[]
        class Response(io.BytesIO):
            status=201
        class Connection:
            def __init__(self, host, timeout): calls.append(('host',host,timeout))
            def putrequest(self,*args): calls.append(args)
            def putheader(self,*args): pass
            def endheaders(self): pass
            def send(self,data): sent.append(data)
            def getresponse(self): return Response(b'{"id":101}')
            def close(self): pass
        client=m.GitHub('PRIVATE_TOKEN')
        with tempfile.TemporaryDirectory() as d, mock.patch.object(m.http.client,'HTTPSConnection',Connection):
            path=Path(d)/'source.zip';path.write_bytes(BODY)
            self.assertEqual(client.upload(81,'artifact-91.zip',path,len(BODY)),{'id':101})
        self.assertEqual(calls,[('host','uploads.github.com',30),('POST','/repos/ecojust/pureTV/releases/81/assets?name=artifact-91.zip')])
        self.assertEqual(b''.join(sent),BODY)

    def test_export_refuses_zip_and_adds_only_receipt_on_create_only_branch(self):
        env={'GITHUB_REPOSITORY':m.REPO,'GITHUB_RUN_ID':'123','GITHUB_RUN_ATTEMPT':'1'}
        calls=[]
        def command(args,**kwargs):
            self.assertIsInstance(args,list); self.assertNotIn('shell',kwargs);calls.append(args)
            return type('Result',(),{'stdout':b''})()
        with tempfile.TemporaryDirectory() as d, mock.patch.dict(m.os.environ,env), mock.patch.object(m.subprocess,'run',command):
            p=Path(d); (p/'transfer.json').write_text(json.dumps({'repository':m.REPO,'status':'failed'}));(p/'x.zip').write_bytes(BODY)
            with self.assertRaises(m.Rejected):m.export_receipt(p)
            self.assertFalse(calls);(p/'x.zip').unlink();m.export_receipt(p)
            self.assertIn(['git','-C',str(p),'add','--','transfer.json'],calls)
            self.assertEqual(calls[-1],['git','-C',str(p),'push','--force-with-lease=refs/heads/build-assets/artifact-draft-transfer-123-attempt-1:','origin','HEAD:refs/heads/build-assets/artifact-draft-transfer-123-attempt-1'])

if __name__ == '__main__':
    unittest.main()
