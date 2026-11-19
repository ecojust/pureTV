#!/usr/bin/env python3
"""Offline small fixtures only. Never use credentials, network or real package bytes."""
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

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('fixed_android_upload_test', HERE / 'backroad-android-release-upload.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
FIX = HERE / 'fixtures/backroad-android-release-upload'
GAME, NAME = m.GAME, m.NAME
BODY, OBS = b'original APK small fixture', b'original Observer small fixture'
SMALL, SMALL_OBS = m.record(BODY), {**m.OBSERVER, **m.record(OBS)}
SMALL_PACKAGE = {**m.PACKAGE, **SMALL}
PLAN = {'steps': [{'name': 'Drive using real SDK', 'keys': ['UP'], 'holdMs': 2500, 'expect': {'gameplay.speed': {'gt': 2}}}]}
SOURCES = {m.PLAN_PATH: json.dumps(PLAN).encode(), 'joystick-games/qa/android/run.py': b'# exact fixed original QA source fixture\n'}
SOURCE_RECORDS = {n: m.record(v) for n, v in SOURCES.items()}


def encoded(value): return json.dumps(value).encode()
def blobsha(data): return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
def load(path): return json.loads(path.read_text())
def origin_fields(): return {'game': GAME, 'sourceSha': m.REQUEST['source'], 'runId': str(m.REQUEST['run'])}


def archive_bytes(change=None, names=None, symlink=False):
    receipt = {**origin_fields(), **SMALL_PACKAGE, 'signatureVerified': True, 'unsignedSha256': '1' * 64, 'contentSha256': {'AndroidManifest.xml': '2' * 64}}
    build = {**origin_fields(), 'unsigned': True, 'committedInputsVerified': True, 'sha256': '1' * 64, 'contentSha256': receipt['contentSha256']}
    observer = {**origin_fields(), 'targetPackage': SMALL_PACKAGE['packageName'], 'apkIdentity': SMALL_OBS, 'modelWrites': False, 'clockOverrides': False, 'signatureVerified': True}
    entries = {f'packages/{GAME}/{NAME}': BODY, f'packages/{GAME}/signing-receipt.json': encoded(receipt),
               f'packages/{GAME}/build-receipt.json': encoded(build), f'packages/{GAME}/SHA256SUMS.txt': (SMALL['sha256'] + '  ' + NAME + '\n').encode(),
               f'observers/{GAME}/observer-{GAME}.apk': OBS, f'observers/{GAME}/observer-build.json': b'{"signed":false}',
               f'observers/{GAME}/observer-signing-receipt.json': encoded(observer)}
    if change: change(entries)
    out = io.BytesIO()
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', UserWarning)
        with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
            for index, name in enumerate(names or entries):
                item = zipfile.ZipInfo(name)
                if symlink and index == 0: item.external_attr = (stat.S_IFLNK | 0o777) << 16
                z.writestr(item, entries.get(name, b'extra unsafe fixture'))
    return out.getvalue()


class Fake:
    def __init__(self, body=None):
        self.body = body or archive_bytes()
        self.artifact_constant = {'name': m.ARTIFACT['name'], **m.record(self.body)}
        self.release = load(FIX / 'release.json'); self.assets = copy.deepcopy(self.release['assets'])
        self.uploads, self.gets, self.downloads = [], [], 0
        self.fail_upload, self.change_release, self.change_artifact, self.change_ref = False, False, False, False
        self.qa = load(FIX / 'pending-qa-run.json'); self.qa.update(status='completed', conclusion='success')
        self.qa_jobs = [{'id': 100 + i, 'name': name, 'run_id': m.QA['run'], 'run_attempt': 1, 'head_sha': m.QA['source'], 'status': 'completed', 'conclusion': 'success', 'started_at': '2026-11-19T23:00:00Z', 'completed_at': '2026-11-19T23:10:00Z'} for i, name in enumerate(('select', 'runtime (backroad-rally)', 'export'))]
        req = m.REQUEST
        self.run = {'id': req['run'], 'run_attempt': 1, 'head_sha': req['source'], 'head_branch': 'build-source/original', 'repository': {'id': 7, 'full_name': m.origin.REPO}, 'head_repository': {'id': 7, 'full_name': m.origin.REPO}, 'path': m.archive_tools.WORKFLOW, 'event': 'workflow_dispatch', 'status': 'completed', 'conclusion': 'failure'}
        self.artifact = {'id': req['artifact'], 'name': m.ARTIFACT['name'], 'expired': False, 'expires_at': '2099-01-01T00:00:00Z', 'size_in_bytes': len(self.body), 'digest': 'sha256:' + self.artifact_constant['sha256'], 'created_at': '2026-11-19T22:00:25Z', 'workflow_run': {'id': req['run'], 'head_sha': req['source'], 'head_branch': self.run['head_branch'], 'repository_id': 7, 'head_repository_id': 7}}
        self.jobs = [{'id': 81 + i, 'name': name, 'run_id': req['run'], 'run_attempt': 1, 'head_sha': req['source'], 'status': 'completed', 'conclusion': 'success', 'started_at': '2026-11-19T22:00:00Z', 'completed_at': '2026-11-19T22:01:00Z', 'steps': [{'name': 'Run actions/upload-artifact@v4', 'number': n, 'status': 'completed', 'conclusion': 'success', 'started_at': a, 'completed_at': b} for n, a, b in [(6, '2026-11-19T22:00:20Z', '2026-11-19T22:00:30Z'), (7, '2026-11-19T22:00:40Z', '2026-11-19T22:00:50Z')]]} for i, name in enumerate(('sign', 'build (backroad-rally)'))]
        self.files = self.evidence()
        self.rebuild_export()

    def evidence(self):
        root = 'evidence/joystick-android-runtime-backroad-rally/'
        art = {'kind': 'github-actions-signed-artifact', 'repository': m.origin.REPO, 'artifactId': m.REQUEST['artifact'], 'artifactRunAttempt': 1, 'artifactRunId': str(m.REQUEST['run']), 'artifactSourceSha': m.REQUEST['source'], 'zip': {k: self.artifact_constant[k] for k in ('bytes', 'sha256')}}
        binding = {'status': 'passed', 'qaSourceSha': m.QA['source'], 'qaRunId': str(m.QA['run']), 'artifactSourceSha': m.REQUEST['source'], 'artifactRunId': str(m.REQUEST['run']), 'artifactExportCommit': None, 'artifactOrigin': art, 'games': [{'game': GAME, 'package': SMALL_PACKAGE, 'observer': SMALL_OBS, 'frozenSourceInputsVerified': 914, 'assetsVerified': 338}]}
        values = {'archive-verification.json': {'status': 'passed', 'errors': [], 'jobs': [{'game': GAME}]},
                  'runtime-verification.json': {'status': 'passed', 'errors': [], 'checks': [{'game': GAME, 'mode': mode, 'apkSha256': SMALL['sha256'], 'status': 'passed'} for mode in ('normal', 'occupied')]},
                  root + GAME + '/verified-inputs/input-verification.json': binding,
                  root + GAME + '/verified-inputs/package-file-references.json': {'status': 'verified-original-reference', 'artifactOrigin': art, 'files': {f'packages/{GAME}/{NAME}': SMALL, f'observers/{GAME}/observer-{GAME}.apk': m.record(OBS)}},
                  root + GAME + '-outcomes.json': [{'mode': mode, 'exitCode': 0} for mode in ('normal', 'occupied')]}
        for mode in ('normal', 'occupied'):
            folder = root + GAME + '-' + mode + '/'
            report = {'status': 'passed', 'game': GAME, 'sourceCommit': m.QA['source'], 'defaultPortOccupiedFixture': mode == 'occupied', 'modelWrites': False, 'clockOverrides': False, 'apk': SMALL, 'observer': m.record(OBS), 'sourceFiles': SOURCE_RECORDS, 'tests': [{'name': n, 'status': 'passed'} for n in m.REQUIRED_TESTS], 'wire': {'acceptedSdkMessages': 100, 'matchingAcks': 100, 'keysSent': m.KEYS, 'rejectedConnections': ['busy'], **{k: [] for k in ('missingAcks', 'errors', 'unexpectedReplies', 'duplicateAcks')}}}
            report['tests'] += [{'name': 'actual SDK gameplay: ' + s['name'], 'status': 'passed', 'details': {'expect': s['expect'], 'holdMs': s['holdMs']}} for s in PLAN['steps']]
            values[folder + 'report.json'] = report
        files = {n: encoded(v) for n, v in values.items()}
        for mode in ('normal', 'occupied'):
            for name, raw in SOURCES.items(): files[root + GAME + '-' + mode + '/source/' + name] = raw
        return files

    def rebuild_export(self, manifest_change=None):
        manifest = {'qaSourceSha': m.QA['source'], 'qaRunId': str(m.QA['run']), 'qaRunAttempt': '1', 'artifactSourceSha': m.REQUEST['source'], 'artifactRunId': str(m.REQUEST['run']), 'artifactId': str(m.REQUEST['artifact']), 'artifactRunAttempt': '1', 'artifactExportCommit': '', 'games': [GAME], 'runtimeResult': 'success', 'runtimeAccepted': True, 'reusedSignedPackagesAndObservers': True, 'files': {n: m.record(v) for n, v in self.files.items() if n != 'export-manifest.json'}}
        if manifest_change: manifest_change(manifest)
        self.files['export-manifest.json'] = encoded(manifest)
        self.tree_sha, self.commit_sha = 'a' * 40, 'b' * 40
        self.blobs = {blobsha(raw): {'sha': blobsha(raw), 'encoding': 'base64', 'size': len(raw), 'content': base64.encodebytes(raw).decode()} for raw in self.files.values()}
        self.tree = {'sha': self.tree_sha, 'truncated': False, 'tree': [{'path': n, 'sha': blobsha(v), 'size': len(v), 'type': 'blob', 'mode': '100644'} for n, v in self.files.items()]}
        self.commit = {'sha': self.commit_sha, 'parents': [], 'tree': {'sha': self.tree_sha}, 'message': f'Catalog Android QA for immutable signed packages {m.QA["run"]} attempt 1', 'committer': {'date': '2026-11-19T23:05:00Z'}}

    def change_json(self, name, callback):
        value = json.loads(self.files[name]); callback(value); self.files[name] = encoded(value); self.rebuild_export()

    def apk_asset(self):
        return {'id': 999, 'name': NAME, 'size': SMALL['bytes'], 'digest': 'sha256:' + SMALL['sha256'], 'state': 'uploaded', 'content_type': 'application/vnd.android.package-archive', 'url': f'{m.origin.API}/repos/{m.origin.REPO}/releases/assets/999', 'browser_download_url': f'https://github.com/{m.origin.REPO}/releases/download/{m.TAG}/{NAME}'}

    def get(self, path):
        self.gets.append(path)
        if '/actions/runs/' in path: return copy.deepcopy(self.qa if f'/{m.QA["run"]}/' in path else self.run)
        if '/actions/artifacts/' in path:
            out = copy.deepcopy(self.artifact)
            if self.change_artifact and self.downloads: out['expired'] = True
            return out
        if '/git/ref/' in path: return {'ref': 'refs/heads/' + m.QA_BRANCH, 'object': {'type': 'commit', 'sha': 'c' * 40 if self.change_ref and self.downloads else self.commit_sha}}
        if '/git/commits/' in path: return copy.deepcopy(self.commit)
        if '/git/trees/' in path: return copy.deepcopy(self.tree)
        if '/git/blobs/' in path: return copy.deepcopy(self.blobs[path.rsplit('/', 1)[1]])
        if '/releases/assets/' in path: return copy.deepcopy(next(a for a in self.assets if str(a['id']) == path.rsplit('/', 1)[1]))
        if '/releases/' in path:
            out = copy.deepcopy(self.release)
            if self.change_release and self.downloads: out['prerelease'] = False
            return out
        raise AssertionError(path)

    def pages(self, path, field=None):
        if field == 'jobs': return copy.deepcopy(self.qa_jobs if f'/{m.QA["run"]}/' in path else self.jobs)
        if field == 'artifacts': return [copy.deepcopy(self.artifact)]
        if path.endswith('/assets'): return copy.deepcopy(self.assets)
        raise AssertionError(path)

    def download(self, artifact, destination, size):
        assert artifact == m.REQUEST['artifact'] and size == len(self.body)
        self.downloads += 1; destination.write_bytes(self.body)
        return len(self.body), hashlib.sha256(self.body).hexdigest()

    def upload(self, release, name, path, size):
        assert release == m.RELEASE and name == NAME and path.read_bytes() == BODY and size == len(BODY)
        self.uploads.append(name)
        if self.fail_upload: raise RuntimeError('DO-NOT-SERIALIZE-SECRET-SIGNED-URL')
        self.assets.append(self.apk_asset()); return copy.deepcopy(self.assets[-1])


class Transfer(unittest.TestCase):
    def execute(self, fake):
        with tempfile.TemporaryDirectory() as tmp, mock.patch.multiple(m, APK=SMALL, PACKAGE=SMALL_PACKAGE, OBSERVER=SMALL_OBS, ARTIFACT=fake.artifact_constant, SOURCE_FILES=SOURCE_RECORDS):
            out = Path(tmp) / 'result'; passed = m.execute(fake, out)
            raw = (out / 'receipts/transfer.json').read_text()
            self.assertNotIn('DO-NOT-SERIALIZE', raw); self.assertLess(len(raw), 128000)
            self.assertEqual([p.name for p in (out / 'receipts').iterdir()], ['transfer.json'])
            return passed, json.loads(raw)

    def test_fixed_real_production_constants(self):
        self.assertEqual(m.REQUEST, {'run': 44625676430, 'attempt': 1, 'source': '4b6cf0b8cba288eae66bcae2ef2784acc279a695', 'artifact': 14579726223})
        self.assertEqual(m.QA, {'run': 44630023214, 'attempt': 1, 'source': '382de3792628050773abec8821920348503f72ce'})
        self.assertEqual(m.APK, {'bytes': 105024551, 'sha256': '2cd35f145f5362264a720708325c22e283a3828d21899058f17422ba87103c08'})
        self.assertEqual(m.ARTIFACT, {'name': 'joystick-android-signed', 'bytes': 104996375, 'sha256': 'b6690049690175943c906ddd4277705c46c5e235770aa5c1ffbd6da1ab4c94fc'})
        self.assertEqual(m.RELEASE, 451969286); self.assertEqual(m.TAG, 'joystick-backroad-rally-v0.1.0')
        self.assertEqual(len(m.SOURCE_FILES), 10)
        self.assertEqual(m.CERT, 'eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23')

    def test_actual_observed_pending_qa_stops_before_artifact_release_or_download(self):
        f = Fake(); f.qa = load(FIX / 'pending-qa-run.json')
        self.assertEqual(f.qa['status'], 'in_progress')
        ok, result = self.execute(f)
        self.assertFalse(ok); self.assertEqual(result['failureCode'], 'qa_not_completed_successfully')
        self.assertEqual(len(f.gets), 1); self.assertEqual(f.downloads, 0); self.assertFalse(f.uploads)

    def test_happy_path_fixed_complete_original_and_preserved_mac_only_one_upload(self):
        f = Fake(); before = copy.deepcopy(f.assets)
        ok, result = self.execute(f); self.assertTrue(ok, result)
        self.assertEqual(f.assets[:2], before); self.assertEqual(f.uploads, [NAME]); self.assertEqual(f.downloads, 1)
        self.assertEqual(result['asset']['operation'], 'uploaded-original-bytes')
        self.assertEqual([r['planStepsPassed'] for r in result['qaGate']['modes']], [1, 1])
        self.assertFalse(result['releaseFieldsChanged']); self.assertFalse(result['packagesRebuiltOrResigned'])

    def test_identical_existing_apk_reused_after_all_checks_and_no_upload(self):
        f = Fake(); f.assets.append(f.apk_asset())
        ok, result = self.execute(f); self.assertTrue(ok, result)
        self.assertFalse(f.uploads); self.assertEqual(f.downloads, 1); self.assertEqual(result['asset']['operation'], 'reused-identical')

    def test_qa_run_job_failure_source_attempt_and_fork_rejected(self):
        mutations = [lambda f: f.qa.update(conclusion='failure'), lambda f: f.qa.update(head_sha='0' * 40), lambda f: f.qa.update(run_attempt=2), lambda f: f.qa.update(id=True), lambda f: f.qa['head_repository'].update(id=999), lambda f: f.qa.update(path='other.yml'), lambda f: f.qa_jobs[1].update(conclusion='failure'), lambda f: f.qa_jobs[2].update(head_sha='0' * 40), lambda f: f.qa_jobs.append(copy.deepcopy(f.qa_jobs[1]))]
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                f = Fake(); mutate(f); self.assertFalse(self.execute(f)[0]); self.assertEqual(f.downloads, 0); self.assertFalse(f.uploads)

    def test_qa_export_manifest_wrong_origin_and_status_rejected(self):
        for key, value in [('runtimeAccepted', False), ('runtimeAccepted', 1), ('runtimeResult', 'failure'), ('qaSourceSha', '0' * 40), ('artifactId', '1'), ('artifactSourceSha', m.QA['source']), ('artifactExportCommit', 'a' * 40), ('games', ['night-racer'])]:
            f = Fake(); f.rebuild_export(lambda v: v.update({key: value}))
            with self.subTest(key=key): self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)

    def test_both_original_mode_reports_all_plan_steps_and_sdk_ack_required(self):
        prefix = 'evidence/joystick-android-runtime-backroad-rally/backroad-rally-'
        changes = [lambda v: v.update(status='failed'), lambda v: v.update(sourceCommit='0' * 40), lambda v: v.update(defaultPortOccupiedFixture=None), lambda v: v.update(modelWrites=True), lambda v: v['apk'].update(sha256='0' * 64), lambda v: v['tests'].pop(), lambda v: v['tests'][-1]['details'].update(holdMs=1), lambda v: v['tests'][0].update(status='failed'), lambda v: v['wire']['missingAcks'].append('missing'), lambda v: v['wire'].update(keysSent=[]), lambda v: v['sourceFiles'].clear()]
        for mode in ('normal', 'occupied'):
            for mutate in changes:
                f = Fake(); f.change_json(prefix + mode + '/report.json', mutate)
                with self.subTest(mode=mode,mutate=mutate): self.assertFalse(self.execute(f)[0]); self.assertEqual(f.downloads, 0)

    def test_matching_ack_count_is_required_exact_integer_and_matches_accepted_sdk_messages(self):
        for mode in ('normal', 'occupied'):
            for change in [lambda v: v['wire'].pop('matchingAcks'), lambda v: v['wire'].update(matchingAcks=99), lambda v: v['wire'].update(matchingAcks=True)]:
                f = Fake(); f.change_json('evidence/joystick-android-runtime-backroad-rally/backroad-rally-' + mode + '/report.json', change)
                with self.subTest(mode=mode, change=change):
                    ok, result = self.execute(f); self.assertFalse(ok); self.assertEqual(result['failureCode'], 'qa_wire_not_accepted')
                    self.assertEqual(f.downloads, 0); self.assertFalse(f.uploads)

    def test_verified_apk_references_and_bound_original_payload_required(self):
        prefix = 'evidence/joystick-android-runtime-backroad-rally/backroad-rally/verified-inputs/'
        for file, mutate in [('input-verification.json', lambda v: v['artifactOrigin'].update(artifactId=1)), ('input-verification.json', lambda v: v['games'][0].update(frozenSourceInputsVerified=1)), ('input-verification.json', lambda v: v['games'][0]['observer'].update(sha256='0'*64)), ('package-file-references.json', lambda v: v['files'].clear())]:
            f = Fake(); f.change_json(prefix + file, mutate)
            with self.subTest(file=file): self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)

    def test_git_hash_manifest_and_fixed_source_copies_bound(self):
        for mode in ('blob', 'manifest', 'source', 'truncated', 'parent', 'message', 'date'):
            f = Fake()
            if mode == 'blob': next(iter(f.blobs.values()))['content'] = base64.b64encode(b'tampered').decode()
            if mode == 'manifest': f.rebuild_export(lambda v: next(iter(v['files'].values())).update(sha256='0' * 64))
            if mode == 'source':
                path = next(n for n in f.files if '/source/' in n); f.files[path] = b'changed'; f.rebuild_export()
            if mode == 'truncated': f.tree['truncated'] = True
            if mode == 'parent': f.commit['parents'] = [{'sha': 'f' * 40}]
            if mode == 'message': f.commit['message'] = 'wrong run'
            if mode == 'date': f.commit['committer']['date'] = '2026-11-18T00:00:00Z'
            with self.subTest(mode=mode): self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)

    def test_original_producer_sign_build_attempt_and_upload_bound(self):
        for change in [lambda f: f.run.update(head_sha='0' * 40), lambda f: f.run.update(run_attempt=2), lambda f: f.artifact.update(expired=True), lambda f: f.artifact.update(created_at='2026-11-19T22:00:00Z'), lambda f: f.jobs[0].update(conclusion='failure'), lambda f: f.jobs[1].update(conclusion='failure'), lambda f: f.jobs[0]['steps'][0].update(conclusion='failure')]:
            f = Fake(); change(f)
            with self.subTest(change=change): self.assertFalse(self.execute(f)[0]); self.assertEqual(f.downloads, 0); self.assertFalse(f.uploads)

    def test_release_target_body_and_published_state_must_be_preserved(self):
        for key, val in [('id', 1), ('tag_name', 'other'), ('draft', True), ('prerelease', False), ('published_at', None), ('target_commitish', m.REQUEST['source']), ('body', 'changed'), ('upload_url', 'https://other.invalid'), ('name', 'other')]:
            f = Fake(); f.release[key] = val
            with self.subTest(key=key): self.assertFalse(self.execute(f)[0]); self.assertEqual(f.downloads, 0); self.assertFalse(f.uploads)

    def test_mac_assets_missing_replaced_changed_extra_duplicate_and_apk_collision_rejected(self):
        for change in [lambda f: f.assets.pop(), lambda f: f.assets[0].update(id=1), lambda f: f.assets[0].update(digest='sha256:'+'0'*64), lambda f: f.assets[0].update(size=1), lambda f: f.assets.append(copy.deepcopy(f.assets[0])), lambda f: f.assets.append({'id': 8, 'name': 'extra'}), lambda f: f.assets.append({**f.apk_asset(), 'digest': 'sha256:'+'0'*64})]:
            f = Fake(); change(f)
            with self.subTest(change=change): self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads); self.assertEqual(f.downloads, 0)

    def test_rechecks_original_artifact_qa_ref_and_release_immediately_before_upload(self):
        for key in ('change_artifact', 'change_ref', 'change_release'):
            f = Fake(); setattr(f, key, True)
            with self.subTest(key=key): self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads); self.assertEqual(f.downloads, 1)

    def test_failed_uncertain_upload_has_one_attempt_no_secret_and_no_retry(self):
        f = Fake(); f.fail_upload = True
        ok, result = self.execute(f); self.assertFalse(ok); self.assertEqual(f.uploads, [NAME]); self.assertEqual(result['failureCode'], 'RuntimeError')
        self.assertEqual(result['uploadAttempt'], {'name': NAME, **SMALL})

    def test_download_disk_hash_is_checked_not_just_api_metadata(self):
        f = Fake(); original = f.download
        def corrupt(artifact, destination, size):
            result = original(artifact, destination, size); destination.write_bytes(b'bad'); return result
        f.download = corrupt
        ok, result = self.execute(f); self.assertFalse(ok); self.assertEqual(result['failureCode'], 'original_wrapper_digest_mismatch'); self.assertFalse(f.uploads)

    def test_original_zip_exact_members_traversal_case_alias_link_extra_and_receipt_fail_closed(self):
        original = archive_bytes()
        with zipfile.ZipFile(io.BytesIO(original)) as z: names = z.namelist()
        cases = [archive_bytes(names=names + ['../outside']), archive_bytes(names=names + [names[0]]), archive_bytes(names=names + [names[0].upper()]), archive_bytes(names=names[:-1]), archive_bytes(symlink=True), archive_bytes(change=lambda e: e.update({f'packages/{GAME}/{NAME}': b'changed'})), archive_bytes(change=lambda e: e.update({f'packages/{GAME}/signing-receipt.json': b'{"signatureVerified":false}'})), archive_bytes(change=lambda e: e.update({f'packages/{GAME}/SHA256SUMS.txt': b'wrong'}))]
        for raw in cases:
            f = Fake(raw)
            with self.subTest(digest=hashlib.sha256(raw).hexdigest()): self.assertFalse(self.execute(f)[0]); self.assertFalse(f.uploads)

    def test_no_network_needed_and_workflow_exposes_no_arbitrary_inputs_or_publication_command(self):
        helper = (HERE/'backroad-android-release-upload.py').read_text()
        workflow = (HERE.parents[1]/'.github/workflows/joystick-backroad-android-release-upload.yml').read_text()
        self.assertNotIn('inputs:', workflow); self.assertNotIn('gh release', workflow); self.assertNotIn('make_latest', helper)
        self.assertNotIn("putrequest('PATCH'", helper); self.assertNotIn("putrequest('DELETE'", helper)
        self.assertIn('backroad-android-release-upload-test.py', workflow)

    def test_duplicate_json_fields_rejected(self):
        with self.assertRaises(m.origin.Rejected): m.json_bytes(b'{"status":"passed","status":"failed"}')


class HttpUpload(unittest.TestCase):
    def test_fixed_post_mime_original_stream_and_connection_closed(self):
        response = mock.Mock(status=201); response.read.return_value = b'{"id":999}'
        conn = mock.Mock(); conn.getresponse.return_value = response
        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(m, 'APK', SMALL), mock.patch.object(m.http.client, 'HTTPSConnection', return_value=conn) as ctor:
            path = Path(tmp) / NAME; path.write_bytes(BODY)
            result = m.GitHub('fixture-token').upload(m.RELEASE, NAME, path, len(BODY))
            self.assertEqual(result, {'id': 999}); ctor.assert_called_once_with('uploads.github.com', timeout=30)
            conn.putrequest.assert_called_once_with('POST', f'/repos/ecojust/pureTV/releases/{m.RELEASE}/assets?name={NAME}')
            self.assertIn(mock.call('Content-Type', 'application/vnd.android.package-archive'), conn.putheader.call_args_list)
            self.assertEqual(b''.join(c.args[0] for c in conn.send.call_args_list), BODY); conn.close.assert_called_once()

    def test_wrong_scope_or_file_fails_before_http_and_error_never_retries(self):
        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(m, 'APK', SMALL), mock.patch.object(m.http.client, 'HTTPSConnection') as ctor:
            path = Path(tmp)/NAME; path.write_bytes(BODY)
            for args in [(1, NAME, path, len(BODY)), (m.RELEASE, 'other.apk', path, len(BODY)), (m.RELEASE, NAME, path, 1)]:
                with self.assertRaises(m.origin.Rejected): m.GitHub('fixture-token').upload(*args)
            path.write_bytes(b'changed')
            with self.assertRaises(m.origin.Rejected): m.GitHub('fixture-token').upload(m.RELEASE, NAME, path, len(BODY))
            ctor.assert_not_called()
            path.write_bytes(BODY); ctor.return_value.getresponse.side_effect = OSError('uncertain upload')
            with self.assertRaises(OSError): m.GitHub('fixture-token').upload(m.RELEASE, NAME, path, len(BODY))
            ctor.assert_called_once(); ctor.return_value.close.assert_called_once()


if __name__ == '__main__': unittest.main(verbosity=2)
