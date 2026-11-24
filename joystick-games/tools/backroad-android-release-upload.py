#!/usr/bin/env python3
"""Historical Backroad transfer checks, retained for the offline publication evidence tests."""
import base64
import hashlib
import http.client
import importlib.util
import json
import os
from pathlib import Path
import re
import stat
import time
import urllib.parse
import urllib.request
import zipfile

SPEC = importlib.util.spec_from_file_location('backroad_android_artifact', Path(__file__).with_name('android-runtime-artifact.py'))
archive_tools = importlib.util.module_from_spec(SPEC); SPEC.loader.exec_module(archive_tools)
origin = archive_tools.origin
require = origin.require
GAME = 'backroad-rally'
TAG = 'joystick-backroad-rally-v0.1.0'
RELEASE = 451969286
REQUEST = {'run': 44625676430, 'attempt': 1, 'source': '4b6cf0b8cba288eae66bcae2ef2784acc279a695', 'artifact': 14579726223}
ARTIFACT = {'name': 'joystick-android-signed', 'bytes': 104996375, 'sha256': 'b6690049690175943c906ddd4277705c46c5e235770aa5c1ffbd6da1ab4c94fc'}
NAME = 'backroad-rally-0.1.0.apk'
APK = {'bytes': 105024551, 'sha256': '2cd35f145f5362264a720708325c22e283a3828d21899058f17422ba87103c08'}
CERT = 'eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23'
PACKAGE = {'packageName': 'com.ecojust.joystick.backroadrally', 'versionCode': 1, 'versionName': '0.1.0', 'certificateSha256': CERT, **APK}
OBSERVER = {'packageName': 'com.ecojust.joystickqa.backroadrally', 'versionCode': 1, 'versionName': '1.0', 'certificateSha256': CERT,
            'bytes': 16783, 'sha256': 'c8402dcc9b204e4aa405a9edae4efa72d8a2b7621f0df989b9e4bcf96ad0c4f2'}
QA = {'run': 44630023214, 'attempt': 1, 'source': '382de3792628050773abec8821920348503f72ce'}
QA_WORKFLOW = '.github/workflows/joystick-catalog-android-runtime.yml'
QA_BRANCH = 'build-assets/joystick-catalog-android-runtime-44630023214-attempt-1'
PLAN_PATH = 'joystick-games/backroad-rally/qa-plan.json'
MAX_EVIDENCE_FILE = 32 * 1024 * 1024
MAC_ASSETS = {
    'BackroadRally-0.1.0-macos-universal.zip': {'id': 769411847, 'bytes': 105275042, 'sha256': '61ac58f2f75ff5ede9850d43e1bc77448731f870dd309efbb2af5d9236d57323', 'contentType': 'application/zip'},
    'BackroadRally-0.1.0-macos-universal.dmg': {'id': 769412154, 'bytes': 108258927, 'sha256': 'f1eb37f1ec24e75365f40f7c71a631a722f5657a849e984d0d7f7f515b60bd28', 'contentType': 'application/x-apple-diskimage'},
}
SOURCE_FILES = {
    'joystick-games/qa/android/run.py': {'bytes': 63089, 'sha256': '51f6aad21a8e9963a0ebd71d5de9f57fd67db924253464dd59565efc7d5f93a9'},
    'joystick-games/qa/android/install_failure.py': {'bytes': 8042, 'sha256': '25e8d63885664620b6be47c2bceb340189057e62b3f99391f0c1f0cf9307f712'},
    'joystick-games/qa/android/install_confirmation.py': {'bytes': 13439, 'sha256': '22c0b48fa13d0f3dc072b0049f5dc07efeef70d02d3bb8b2fa2de743aef09ac4'},
    'joystick-games/qa/android/build-observer.py': {'bytes': 3661, 'sha256': '7010b023cfd691d7a2179c45e91a25639d97a1af31622886e90954a3e0b7e4df'},
    'joystick-games/qa/android/src/com/ecojust/controllerqa/Observer.java': {'bytes': 11264, 'sha256': 'c3c3389d80a713c86c294453fdf70ab65042fda1fe65b5fd44f68218a0492305'},
    'puretv-joystick/joystick_sdk.py': {'bytes': 2188, 'sha256': 'c5e18886fce56edf6c653640f056e01fe588403378f174c48553a054c1f9b023'},
    'joystick-games/tools/android-build.py': {'bytes': 13049, 'sha256': 'be47887c8fa964e0a17c8fc3d8ba3195e5ae503af4bbd728afab24bd9453277b'},
    'joystick-games/tools/qa-plan.py': {'bytes': 7106, 'sha256': '8fa99646235d8d3369e6606b94b1facaafda934dcc1df3ad693233f9bcfe6e54'},
    PLAN_PATH: {'bytes': 12109, 'sha256': '8306e5b2ad54cf35eb2602db045711572e35a728478e668fc65a6fb962ad157f'},
    'joystick-games/catalog-registry.json': {'bytes': 7735, 'sha256': 'eae4cd09a6fe75c0c95eb8526365168e3934e681becb0ba356f89d4298da9c6d'},
}
KEYS = sorted(['UP', 'DOWN', 'LEFT', 'RIGHT', 'START', 'A', 'B', 'X', 'Y'])
REQUIRED_TESTS = [
    'catalog scenario starts with fresh app data before launch',
    'installed target launches initialized game menu with no controller card',
    'original SDK hello and nine sync messages create actual controller ID card',
    'explicit actual model observations remain stable while paused',
    'single-seat host rejects second SDK with controller_busy and preserves active primary input',
    'native exit dialog and focus return cancel input and never automatically resume gameplay',
    'disconnect clears keys; reconnect keeps original ID and remains paused',
    'held START reconnect sync cannot resume gameplay',
    'every accepted SDK message has exactly one original host ACK; busy rejection separately verified',
    'same native process and service port survive focus, disconnect and reconnect',
] + ['independent cached input down/release ' + key for key in KEYS]


def record(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def json_bytes(data):
    def unique(pairs):
        value = {}
        for key, item in pairs:
            require(key not in value, 'duplicate_json_key'); value[key] = item
        return value
    return json.loads(data, object_pairs_hook=unique)


def validate_qa_run(run):
    for key in ('id', 'run_attempt'): origin.positive(run.get(key))
    require((run['id'], run['run_attempt'], run.get('head_sha')) == (QA['run'], QA['attempt'], QA['source']), 'wrong_qa_identity')
    require(run.get('path') == QA_WORKFLOW and run.get('event') == 'workflow_dispatch', 'wrong_qa_workflow')
    repo, head = run.get('repository', {}), run.get('head_repository', {})
    require(repo.get('full_name') == head.get('full_name') == origin.REPO and origin.positive(repo.get('id')) == origin.positive(head.get('id')), 'wrong_qa_repository')
    require(run.get('status') == 'completed' and run.get('conclusion') == 'success', 'qa_not_completed_successfully')


def validate_qa_jobs(jobs):
    selected = {}
    for name in ('select', 'runtime (backroad-rally)', 'export'):
        found = [j for j in jobs if j.get('name') == name]
        require(len(found) == 1, 'qa_job_not_unique')
        job = found[0]; origin.positive(job.get('id'))
        require(type(job.get('run_id')) is int and type(job.get('run_attempt')) is int and
                (job['run_id'], job['run_attempt'], job.get('head_sha')) == (QA['run'], QA['attempt'], QA['source']), 'wrong_qa_job_identity')
        require(job.get('status') == 'completed' and job.get('conclusion') == 'success', 'qa_job_not_successful')
        require(origin.stamp(job['started_at']) <= origin.stamp(job['completed_at']), 'qa_job_time_order')
        selected[name] = job
    return selected


class ExportReader:
    """Resolve only the fixed QA export, then bind bounded small files to its Git tree."""
    def __init__(self, client, export_job):
        self.client, self.cache, self.records = client, {}, {}
        base = '/repos/' + origin.REPO
        self.ref_path = base + '/git/ref/heads/' + QA_BRANCH
        ref = client.get(self.ref_path)
        require(ref.get('ref') == 'refs/heads/' + QA_BRANCH and ref.get('object', {}).get('type') == 'commit', 'wrong_qa_export_ref')
        self.commit = ref['object']['sha']
        require(isinstance(self.commit, str) and re.fullmatch('[a-f0-9]{40}', self.commit), 'invalid_qa_export_commit')
        commit = client.get(base + '/git/commits/' + self.commit)
        require(commit.get('sha') == self.commit and commit.get('parents') == [], 'wrong_qa_export_commit')
        require(commit.get('message', '').strip() == f'Catalog Android QA for immutable signed packages {QA["run"]} attempt {QA["attempt"]}', 'wrong_qa_export_message')
        when = origin.stamp(commit['committer']['date'])
        require(origin.stamp(export_job['started_at']) <= when <= origin.stamp(export_job['completed_at']), 'qa_export_outside_job')
        tree_sha = commit['tree']['sha']
        require(isinstance(tree_sha, str) and re.fullmatch('[a-f0-9]{40}', tree_sha), 'invalid_qa_tree')
        tree = client.get(base + '/git/trees/' + tree_sha + '?recursive=1')
        require(tree.get('sha') == tree_sha and tree.get('truncated') is False and isinstance(tree.get('tree'), list), 'incomplete_qa_export_tree')
        require(0 < len(tree['tree']) <= 10000, 'qa_tree_size')
        self.files = {}
        for item in tree['tree']:
            name = archive_tools.safe_name(item['path'])
            require(name not in self.files, 'duplicate_qa_tree_path')
            if item['type'] == 'blob':
                require(item.get('mode') == '100644', 'qa_export_nonregular_file')
                require(type(item.get('size')) is int and 0 <= item['size'] <= origin.MAX_BYTES, 'qa_blob_size')
                self.files[name] = item
            else:
                require(item['type'] == 'tree' and item.get('mode') == '040000', 'qa_export_nonregular_entry')
        self.manifest = json_bytes(self.read('export-manifest.json', bind=False))
        require(isinstance(self.manifest.get('files'), dict) and set(self.manifest['files']) == set(self.files) - {'export-manifest.json'}, 'qa_export_inventory_mismatch')
        for name, expected in self.manifest['files'].items():
            require(set(expected) == {'bytes', 'sha256'} and type(expected['bytes']) is int and expected['bytes'] == self.files[name]['size'] and re.fullmatch('[a-f0-9]{64}', expected['sha256']), 'qa_manifest_record_invalid')

    def read(self, name, bind=True):
        archive_tools.safe_name(name)
        require(name in self.files and self.files[name]['size'] <= MAX_EVIDENCE_FILE, 'qa_evidence_missing_or_large')
        if name not in self.cache:
            item = self.files[name]
            value = self.client.get('/repos/' + origin.REPO + '/git/blobs/' + item['sha'])
            require(value.get('sha') == item['sha'] and value.get('size') == item['size'] and value.get('encoding') == 'base64', 'qa_blob_identity')
            data = base64.b64decode(value['content'].replace('\n', ''), validate=True)
            require(len(data) == item['size'] and hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == item['sha'], 'qa_blob_hash')
            self.cache[name] = data
        data = self.cache[name]
        if bind: require(record(data) == self.manifest['files'][name], 'qa_file_digest_mismatch')
        self.records[name] = record(data)
        return data

    def json(self, name):
        return json_bytes(self.read(name))

    def unchanged(self):
        require(self.client.get(self.ref_path).get('object', {}).get('sha') == self.commit, 'qa_export_ref_changed')


def validate_qa_export(reader):
    manifest = reader.manifest
    expected = {'qaSourceSha': QA['source'], 'qaRunId': str(QA['run']), 'qaRunAttempt': '1',
                'artifactSourceSha': REQUEST['source'], 'artifactRunId': str(REQUEST['run']),
                'artifactId': str(REQUEST['artifact']), 'artifactRunAttempt': '1', 'artifactExportCommit': '',
                'games': [GAME], 'runtimeResult': 'success', 'runtimeAccepted': True, 'reusedSignedPackagesAndObservers': True}
    require(all(manifest.get(k) == v and type(manifest.get(k)) is type(v) for k, v in expected.items()), 'qa_export_not_accepted_exact_origin')
    archive = reader.json('archive-verification.json')
    require(archive.get('status') == 'passed' and not archive.get('errors') and [j.get('game') for j in archive.get('jobs', [])] == [GAME], 'qa_archive_not_verified')
    accepted = reader.json('runtime-verification.json')
    require(accepted.get('status') == 'passed' and not accepted.get('errors') and
            accepted.get('checks') == [{'game': GAME, 'mode': mode, 'apkSha256': APK['sha256'], 'status': 'passed'} for mode in ('normal', 'occupied')], 'qa_modes_not_verified')
    prefix = 'evidence/joystick-android-runtime-backroad-rally/'
    binding = reader.json(prefix + GAME + '/verified-inputs/input-verification.json')
    require(binding.get('status') == 'passed' and binding.get('qaSourceSha') == QA['source'] and str(binding.get('qaRunId')) == str(QA['run']), 'qa_input_binding_failed')
    require(binding.get('artifactSourceSha') == REQUEST['source'] and str(binding.get('artifactRunId')) == str(REQUEST['run']) and binding.get('artifactExportCommit') is None, 'qa_wrong_package_source')
    art = binding.get('artifactOrigin', {})
    require(art.get('kind') == 'github-actions-signed-artifact' and art.get('repository') == origin.REPO and
            type(art.get('artifactId')) is int and art['artifactId'] == REQUEST['artifact'] and
            type(art.get('artifactRunAttempt')) is int and art['artifactRunAttempt'] == 1 and
            str(art.get('artifactRunId')) == str(REQUEST['run']) and art.get('artifactSourceSha') == REQUEST['source'] and
            art.get('zip') == {k: ARTIFACT[k] for k in ('bytes', 'sha256')}, 'qa_wrong_original_artifact')
    games = binding.get('games', [])
    require(len(games) == 1 and games[0].get('game') == GAME, 'qa_wrong_game_selection')
    game = games[0]
    require(all(game.get('package', {}).get(k) == v for k, v in PACKAGE.items()) and game.get('observer') == OBSERVER and
            game.get('frozenSourceInputsVerified') == 914 and game.get('assetsVerified') == 338, 'qa_package_binding_mismatch')
    refs = reader.json(prefix + GAME + '/verified-inputs/package-file-references.json')
    require(refs.get('status') == 'verified-original-reference' and refs.get('artifactOrigin') == art and
            refs.get('files') == {f'packages/{GAME}/{NAME}': APK, f'observers/{GAME}/observer-{GAME}.apk': {k: OBSERVER[k] for k in ('bytes', 'sha256')}}, 'qa_original_package_references_mismatch')
    outcomes = reader.json(prefix + GAME + '-outcomes.json')
    require(outcomes == [{'mode': mode, 'exitCode': 0} for mode in ('normal', 'occupied')], 'qa_outcomes_failed')
    plan = None
    modes = []
    for mode in ('normal', 'occupied'):
        folder = prefix + GAME + '-' + mode + '/'
        report = reader.json(folder + 'report.json')
        require(report.get('status') == 'passed' and report.get('game') == GAME and report.get('sourceCommit') == QA['source'] and
                report.get('defaultPortOccupiedFixture') is (mode == 'occupied') and report.get('modelWrites') is False and report.get('clockOverrides') is False, 'qa_report_not_passed')
        require({k: report.get('apk', {}).get(k) for k in APK} == APK and
                {k: report.get('observer', {}).get(k) for k in ('bytes', 'sha256')} == {k: OBSERVER[k] for k in ('bytes', 'sha256')}, 'qa_report_wrong_apk')
        require(report.get('sourceFiles') == SOURCE_FILES, 'qa_executed_source_mismatch')
        for name, expected_file in SOURCE_FILES.items():
            data = reader.read(folder + 'source/' + name)
            require(record(data) == expected_file, 'qa_executed_source_copy_mismatch')
            if name == PLAN_PATH: plan = json_bytes(data)
        tests = report.get('tests', [])
        require(isinstance(tests, list) and tests and all(t.get('status') == 'passed' for t in tests), 'qa_test_failed')
        require(all(any(t.get('name') == name for t in tests) for name in REQUIRED_TESTS), 'qa_required_test_missing')
        # The original plan intentionally repeats "Focus quick stage". Preserve
        # its complete ordered execution; names are labels, not unique IDs.
        gameplay_tests = [t for t in tests if t.get('name', '').startswith('actual SDK gameplay: ')]
        require(len(gameplay_tests) == len(plan['steps']), 'qa_original_plan_step_count')
        for step, executed in zip(plan['steps'], gameplay_tests):
            require(executed.get('name') == 'actual SDK gameplay: ' + step['name'] and
                    executed.get('details', {}).get('expect') == step['expect'] and executed['details'].get('holdMs') == step['holdMs'], 'qa_original_plan_step_missing_or_changed')
        wire = report.get('wire', {})
        require(type(wire.get('acceptedSdkMessages')) is int and wire['acceptedSdkMessages'] > 30 and
                type(wire.get('matchingAcks')) is int and wire['matchingAcks'] == wire['acceptedSdkMessages'] and wire.get('keysSent') == KEYS and
                len(wire.get('rejectedConnections', [])) == 1 and all(wire.get(k) == [] for k in ('missingAcks', 'errors', 'unexpectedReplies', 'duplicateAcks')), 'qa_wire_not_accepted')
        modes.append({'mode': mode, 'testsPassed': len(tests), 'planStepsPassed': len(plan['steps']), 'acceptedSdkMessages': wire['acceptedSdkMessages'], 'report': record(reader.read(folder + 'report.json'))})
    return {'run': QA['run'], 'attempt': 1, 'source': QA['source'], 'exportCommit': reader.commit, 'modes': modes, 'files': reader.records}


def release_identity(value):
    require(type(value.get('id')) is int and value['id'] == RELEASE and value.get('tag_name') == TAG, 'wrong_release_identity')
    require(value.get('draft') is False and value.get('prerelease') is True and value.get('published_at') == '2026-11-19T22:02:50Z', 'release_publication_state_changed')
    require(value.get('target_commitish') == '68d343d22c762c904eb83854d4ab9c4113a7c30f' and value.get('name') == 'Backroad Rally · 乡野拉力 0.1.0', 'release_target_or_title_changed')
    require(isinstance(value.get('body'), str) and hashlib.sha256(value['body'].encode()).hexdigest() == '2c9164c7f9680b62cdef920818fc067c443c882c71a090e14bdfd42d0d695d05', 'release_body_changed')
    require(value.get('url') == f'{origin.API}/repos/{origin.REPO}/releases/{RELEASE}' and
            value.get('upload_url') == f'https://uploads.github.com/repos/{origin.REPO}/releases/{RELEASE}/assets{{?name,label}}', 'release_url_changed')
    return {'id': RELEASE, 'tag': TAG, 'draft': False, 'prerelease': True, 'targetCommitish': value['target_commitish'], 'bodySha256': hashlib.sha256(value['body'].encode()).hexdigest()}


def asset_identity(value, name):
    expected = APK if name == NAME else MAC_ASSETS[name]
    asset_id = origin.positive(value.get('id'))
    if name != NAME: require(asset_id == expected['id'], 'original_mac_asset_replaced')
    require(value.get('name') == name and value.get('state') == 'uploaded' and type(value.get('size')) is int and
            value['size'] == expected['bytes'] and origin.sha(value.get('digest')) == expected['sha256'], 'asset_bytes_mismatch')
    require(value.get('content_type') == ('application/vnd.android.package-archive' if name == NAME else expected['contentType']), 'asset_mime_mismatch')
    require(value.get('url') == f'{origin.API}/repos/{origin.REPO}/releases/assets/{asset_id}' and
            value.get('browser_download_url') == f'https://github.com/{origin.REPO}/releases/download/{TAG}/{name}', 'asset_url_mismatch')
    return {'id': asset_id, 'name': name, 'bytes': expected['bytes'], 'sha256': expected['sha256'], 'downloadUrl': value['browser_download_url']}


def check_assets(client):
    path = f'/repos/{origin.REPO}/releases/{RELEASE}/assets'
    assets = client.pages(path)
    require(all(isinstance(a, dict) for a in assets), 'invalid_asset_list')
    ids = [origin.positive(a.get('id')) for a in assets]
    names = [a.get('name') for a in assets]
    require(len(ids) == len(set(ids)) and len(names) == len(set(names)) and set(MAC_ASSETS) <= set(names) <= {*MAC_ASSETS, NAME}, 'release_asset_set_changed')
    result = {}
    for asset in assets:
        name = asset['name']; listed = asset_identity(asset, name)
        direct = asset_identity(client.get(f'/repos/{origin.REPO}/releases/assets/{listed["id"]}'), name)
        require(listed == direct, 'asset_list_direct_mismatch'); result[name] = listed
    return result


def extract_apk(archive, destination):
    expected_names = {f'packages/{GAME}/{n}' for n in ('build-receipt.json', 'signing-receipt.json', 'SHA256SUMS.txt', NAME)}
    expected_names |= {f'observers/{GAME}/{n}' for n in ('observer-build.json', 'observer-signing-receipt.json', 'observer-' + GAME + '.apk')}
    with zipfile.ZipFile(archive) as zipped:
        members = zipped.infolist()
        names = [archive_tools.safe_name(i.filename) for i in members]
        require(len(names) == 7 and len(set(n.casefold() for n in names)) == 7 and set(names) == expected_names, 'wrong_signed_archive_members')
        require(sum(i.file_size for i in members) < 128_000_000, 'signed_archive_unpacked_limit')
        for item in members:
            require(not item.is_dir() and stat.S_IFMT(item.external_attr >> 16) in (0, stat.S_IFREG) and not item.flag_bits & 1 and
                    item.compress_type in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED) and 0 < item.file_size < 128_000_000, 'unsafe_signed_archive_member')
            if not item.filename.endswith('.apk'): require(item.file_size <= origin.MAX_JSON, 'signed_archive_metadata_large')
        require(zipped.testzip() is None, 'signed_archive_crc_failed')
        receipt = json_bytes(zipped.read(f'packages/{GAME}/signing-receipt.json'))
        require(receipt.get('game') == GAME and receipt.get('sourceSha') == REQUEST['source'] and str(receipt.get('runId')) == str(REQUEST['run']) and
                receipt.get('signatureVerified') is True and all(receipt.get(k) == v for k, v in PACKAGE.items()), 'signed_receipt_mismatch')
        unsigned = json_bytes(zipped.read(f'packages/{GAME}/build-receipt.json'))
        require(unsigned.get('sourceSha') == REQUEST['source'] and str(unsigned.get('runId')) == str(REQUEST['run']) and unsigned.get('game') == GAME and
                unsigned.get('unsigned') is True and unsigned.get('committedInputsVerified') is True and unsigned.get('sha256') == receipt.get('unsignedSha256') and
                unsigned.get('contentSha256') == receipt.get('contentSha256'), 'original_build_receipt_mismatch')
        require(zipped.read(f'packages/{GAME}/SHA256SUMS.txt').decode('ascii').splitlines() == [APK['sha256'] + '  ' + NAME], 'original_checksum_mismatch')
        observer = json_bytes(zipped.read(f'observers/{GAME}/observer-signing-receipt.json'))
        require(observer.get('sourceSha') == REQUEST['source'] and str(observer.get('runId')) == str(REQUEST['run']) and observer.get('game') == GAME and
                observer.get('targetPackage') == PACKAGE['packageName'] and observer.get('apkIdentity') == OBSERVER and observer.get('modelWrites') is False and
                observer.get('clockOverrides') is False and observer.get('signatureVerified') is True, 'original_observer_receipt_mismatch')
        require(record(zipped.read(f'observers/{GAME}/observer-{GAME}.apk')) == {k: OBSERVER[k] for k in ('bytes', 'sha256')}, 'original_observer_bytes_mismatch')
        item = zipped.getinfo(f'packages/{GAME}/{NAME}')
        require(item.file_size == APK['bytes'] and not destination.exists(), 'original_apk_size_or_destination')
        digest, total = hashlib.sha256(), 0
        with zipped.open(item) as source, destination.open('xb') as out:
            while block := source.read(1024 * 1024):
                total += len(block); require(total <= APK['bytes'], 'original_apk_overflow')
                digest.update(block); out.write(block)
        require({'bytes': total, 'sha256': digest.hexdigest()} == APK, 'original_apk_digest_mismatch')
    return {'memberCount': 7, 'allMembersCrcVerified': True, 'extractedOnly': f'packages/{GAME}/{NAME}', 'rebuiltOrResigned': False}


class GitHub(origin.GitHub):
    def get(self, path):
        if not re.fullmatch(r'/repos/ecojust/pureTV/git/blobs/[a-f0-9]{40}', path): return super().get(path)
        with self.opener.open(urllib.request.Request(origin.API + path, headers=self.headers()), timeout=30) as response:
            data = response.read(MAX_EVIDENCE_FILE * 2 + 1)
            require(len(data) <= MAX_EVIDENCE_FILE * 2, 'qa_blob_response_large')
            return json_bytes(data)

    def upload(self, release, name, path, size):
        require(type(release) is int and release == RELEASE and name == NAME and size == APK['bytes'], 'upload_scope')
        require(archive_tools.record(path) == APK, 'upload_file_changed')
        connection = http.client.HTTPSConnection('uploads.github.com', timeout=30)
        deadline = time.monotonic() + 900
        try:
            connection.putrequest('POST', f'/repos/{origin.REPO}/releases/{RELEASE}/assets?name=' + urllib.parse.quote(NAME, safe=''))
            for key, value in {**self.headers(), 'Content-Type': 'application/vnd.android.package-archive', 'Content-Length': str(size)}.items(): connection.putheader(key, value)
            connection.endheaders(); digest, sent = hashlib.sha256(), 0
            with path.open('rb') as source:
                while block := source.read(1024 * 1024):
                    require(time.monotonic() <= deadline, 'upload_deadline'); sent += len(block)
                    require(sent <= size, 'upload_file_changed'); digest.update(block); connection.send(block)
            require(sent == size and digest.hexdigest() == APK['sha256'], 'upload_file_changed')
            response = connection.getresponse(); require(response.status == 201, 'asset_upload_rejected')
            data = response.read(origin.MAX_JSON + 1); require(len(data) <= origin.MAX_JSON, 'upload_response_large')
            return json_bytes(data)
        finally: connection.close()


def execute(client, output):
    receipts = output / 'receipts'; receipts.mkdir(parents=True, exist_ok=False)
    report = {'schemaVersion': 1, 'repository': origin.REPO, 'kind': 'fixed-backroad-android-original-apk', 'status': 'running', 'phase': 'fixed-native-qa-gate',
              'request': REQUEST, 'qaRequest': QA, 'releaseId': RELEASE, 'releaseCreatedOrPublished': False, 'releaseFieldsChanged': False,
              'packagesRebuiltOrResigned': False, 'apkSignatureReverifiedByTransfer': False, 'newNativeExecution': False}
    report['executedSources'] = {name: archive_tools.record(Path(__file__).with_name(name)) for name in [Path(__file__).name, 'artifact-draft-transfer.py', 'android-runtime-artifact.py']}
    report['executor'] = {key: os.environ.get(name) for key, name in [('run', 'GITHUB_RUN_ID'), ('attempt', 'GITHUB_RUN_ATTEMPT'), ('source', 'GITHUB_SHA')]}
    def save():
        data = json.dumps(report, indent=2) + '\n'; require(len(data.encode()) < 128_000, 'receipt_too_large')
        (receipts / 'transfer.json').write_text(data)
    save()
    try:
        base = '/repos/' + origin.REPO; qa_path = f'{base}/actions/runs/{QA["run"]}/attempts/{QA["attempt"]}'
        validate_qa_run(client.get(qa_path))  # Pending/failure stops before package download or Release access.
        jobs = validate_qa_jobs(client.pages(qa_path + '/jobs', 'jobs'))
        reader = ExportReader(client, jobs['export']); report['qaGate'] = validate_qa_export(reader)
        report['phase'] = 'validate-original-signed-artifact'; save()
        original, info = archive_tools.inspect(client, REQUEST, [GAME])
        require(info['artifactName'] == ARTIFACT['name'] and info['artifactBytes'] == ARTIFACT['bytes'] and info['artifactSha256'] == ARTIFACT['sha256'], 'wrong_fixed_original_artifact')
        report['source'] = info
        release_path = f'{base}/releases/{RELEASE}'
        report['release'] = release_identity(client.get(release_path)); initial_assets = check_assets(client)
        report['originalMacAssets'] = {n: initial_assets[n] for n in MAC_ASSETS}
        report['phase'] = 'download-complete-original-wrapper'; save()
        download = output / 'download'; download.mkdir()
        archive = download / 'original-signed.zip'
        size, digest = client.download(REQUEST['artifact'], archive, ARTIFACT['bytes'])
        require({'bytes': size, 'sha256': digest} == {k: ARTIFACT[k] for k in ('bytes', 'sha256')} == archive_tools.record(archive), 'original_wrapper_digest_mismatch')
        report['originalArchive'] = {'bytes': size, 'sha256': digest, 'repacked': False}
        apk = download / NAME; report['extraction'] = extract_apk(archive, apk)
        require(client.get(f'{base}/actions/artifacts/{REQUEST["artifact"]}') == original['artifact'], 'original_artifact_changed')
        validate_qa_run(client.get(qa_path)); require(validate_qa_jobs(client.pages(qa_path + '/jobs', 'jobs')) == jobs, 'qa_jobs_changed'); reader.unchanged()
        require(release_identity(client.get(release_path)) == report['release'], 'release_changed')
        assets = check_assets(client)
        require({n: assets[n] for n in MAC_ASSETS} == report['originalMacAssets'], 'original_mac_assets_changed')
        if NAME in assets:
            report['asset'] = {**assets[NAME], 'operation': 'reused-identical'}
        else:
            report['phase'] = 'upload-one-original-apk'; report['uploadAttempt'] = {'name': NAME, **APK}; save()
            uploaded = asset_identity(client.upload(RELEASE, NAME, apk, APK['bytes']), NAME)
            actual = check_assets(client); require(actual.get(NAME) == uploaded, 'uploaded_apk_not_in_release')
            report['asset'] = {**uploaded, 'operation': 'uploaded-original-bytes'}
        require(release_identity(client.get(release_path)) == report['release'], 'release_changed')
        final = check_assets(client)
        require({n: final[n] for n in MAC_ASSETS} == report['originalMacAssets'] and final.get(NAME) == {k: v for k, v in report['asset'].items() if k != 'operation'}, 'final_assets_changed')
        report.update(status='passed', phase='verified-original-apk-in-existing-public-prerelease'); save(); return True
    except Exception as error:
        code = str(error) if isinstance(error, origin.Rejected) and re.fullmatch('[a-z0-9_]+', str(error)) else type(error).__name__
        report.update(status='failed', failureCode=code); save(); return False
