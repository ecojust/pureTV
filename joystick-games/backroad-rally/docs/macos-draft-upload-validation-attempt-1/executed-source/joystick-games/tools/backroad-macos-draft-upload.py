#!/usr/bin/env python3
"""Upload two fixed original Backroad packages to one existing draft; never build/publish."""
import argparse
import hashlib
import http.client
import importlib.util
import json
import os
from pathlib import Path
import re
import stat
import sys
import time
import urllib.parse
import zipfile


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


archive_tools = load('backroad_archive_tools', 'android-runtime-artifact.py')
origin = archive_tools.origin
require = origin.require
REQUEST = {'run': 44608415225, 'attempt': 1, 'source': '68d343d22c762c904eb83854d4ab9c4113a7c30f', 'artifact': 14570673468, 'release': 451969286}
TAG = 'joystick-backroad-rally-v0.1.0'
GAME = 'backroad-rally'
ARTIFACT = {'name': 'joystick-catalog-macos-packages-racing-01', 'bytes': 259564880, 'sha256': 'a8bfc0f08fdf71fc88719792075953f76a22cf4a64a308e597db169a3ccd7476'}
PACKAGES = {
    'BackroadRally-0.1.0-macos-universal.zip': {'bytes': 105275042, 'sha256': '61ac58f2f75ff5ede9850d43e1bc77448731f870dd309efbb2af5d9236d57323'},
    'BackroadRally-0.1.0-macos-universal.dmg': {'bytes': 108258927, 'sha256': 'f1eb37f1ec24e75365f40f7c71a631a722f5657a849e984d0d7f7f515b60bd28'},
}
EXPECTED_MEMBERS = {f'{game}/{name}' for game, stem in [('backroad-rally', 'BackroadRally'), ('ponpoko-kart', 'PonpokoKart'), ('night-racer', 'NightRacer')] for name in ['SHA256SUMS.txt', 'build-manifest.json', f'{stem}-0.1.0-macos-universal.zip', f'{stem}-0.1.0-macos-universal.dmg']}


def draft_identity(value):
    require(type(value.get('id')) is int and value['id'] == REQUEST['release'], 'wrong_release_id')
    require(value.get('draft') is True and value.get('published_at') is None, 'release_not_draft')
    require(value.get('tag_name') == TAG and value.get('target_commitish') == REQUEST['source'], 'wrong_release_tag_or_source')
    require(value.get('url') == f'{origin.API}/repos/{origin.REPO}/releases/{REQUEST["release"]}', 'wrong_release_url')
    require(value.get('upload_url') == f'https://uploads.github.com/repos/{origin.REPO}/releases/{REQUEST["release"]}/assets{{?name,label}}', 'wrong_upload_url')
    return {'id': value['id'], 'tag': TAG, 'targetCommitish': REQUEST['source'], 'draft': True}


def asset_identity(value, name):
    expected = PACKAGES[name]
    asset_id = origin.positive(value.get('id'))
    require(value.get('name') == name and value.get('state') == 'uploaded', 'wrong_asset_name_or_state')
    require(type(value.get('size')) is int and value['size'] == expected['bytes'] and origin.sha(value.get('digest')) == expected['sha256'], 'asset_bytes_mismatch')
    require(value.get('url') == f'{origin.API}/repos/{origin.REPO}/releases/assets/{asset_id}', 'wrong_asset_url')
    # GitHub uses a temporary untagged URL while a release remains a draft.
    prefix = f'https://github.com/{origin.REPO}/releases/download/'
    url = value.get('browser_download_url')
    require(isinstance(url, str) and re.fullmatch(re.escape(prefix) + '(?:' + re.escape(TAG) + '|untagged-[0-9a-f]{20})/' + re.escape(name), url), 'wrong_asset_download_url')
    return {'id': asset_id, 'name': name, **expected, 'downloadUrl': value['browser_download_url']}


def existing_asset(client, release_path, name):
    assets = client.pages(release_path + '/assets')
    require(all(isinstance(a, dict) and type(a.get('id')) is int for a in assets), 'invalid_asset_list')
    require(len({a['id'] for a in assets}) == len(assets), 'duplicate_asset_id')
    matches = [a for a in assets if a.get('name') == name]
    require(len(matches) <= 1, 'duplicate_asset_name')
    if not matches:
        return None
    listed = asset_identity(matches[0], name)
    direct = asset_identity(client.get(f'/repos/{origin.REPO}/releases/assets/{listed["id"]}'), name)
    require(direct == listed, 'asset_list_direct_mismatch')
    return direct


def extract_packages(archive, directory):
    """Validate every ZIP member and CRC, then stream only the fixed original two files."""
    with zipfile.ZipFile(archive) as zipped:
        members = zipped.infolist()
        require(len(members) == len(EXPECTED_MEMBERS), 'wrong_archive_member_count')
        names = [archive_tools.safe_name(i.filename) for i in members]
        require(len(set(n.casefold() for n in names)) == len(names) and set(names) == EXPECTED_MEMBERS, 'wrong_archive_members')
        require(sum(i.file_size for i in members) <= origin.MAX_BYTES, 'archive_unpacked_bound')
        for info in members:
            require(not info.is_dir() and stat.S_IFMT(info.external_attr >> 16) in (0, stat.S_IFREG), 'archive_nonregular_member')
            require(0 < info.file_size <= 128_000_000 and not info.flag_bits & 1 and info.compress_type in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED), 'archive_member_bound_or_encoding')
            if info.filename.endswith(('.json', '.txt')):
                require(info.file_size <= origin.MAX_JSON, 'archive_metadata_too_large')
        require(zipped.testzip() is None, 'archive_crc_failed')
        manifest = json.loads(zipped.read(GAME + '/build-manifest.json'))
        require(manifest.get('game') == GAME and manifest.get('version') == '0.1.0' and manifest.get('sourceCommit') == REQUEST['source'], 'wrong_package_manifest_identity')
        require(manifest.get('committedInputsVerified') is True and manifest.get('packages') == PACKAGES, 'wrong_package_manifest_bytes')
        sums = zipped.read(GAME + '/SHA256SUMS.txt').decode('ascii')
        require(sorted(sums.splitlines()) == sorted(f'{meta["sha256"]}  {name}' for name, meta in PACKAGES.items()), 'wrong_package_checksum_file')
        directory.mkdir(exist_ok=False)
        files = {}
        for name, expected in PACKAGES.items():
            info = zipped.getinfo(GAME + '/' + name)
            require(info.file_size == expected['bytes'], 'wrong_package_size')
            target = directory / name
            digest, size = hashlib.sha256(), 0
            with zipped.open(info) as source, target.open('xb') as out:
                while block := source.read(1024 * 1024):
                    size += len(block)
                    require(size <= expected['bytes'], 'package_exceeds_bound')
                    digest.update(block)
                    out.write(block)
            require({'bytes': size, 'sha256': digest.hexdigest()} == expected, 'package_sha_mismatch')
            files[name] = target
        return files, {'allMembersCrcVerified': True, 'memberCount': len(members), 'unpackedBytes': sum(i.file_size for i in members), 'extractedOnly': [GAME + '/' + n for n in files]}


class GitHub(origin.GitHub):
    def upload(self, release_id, name, path, size):
        # Same single-POST streaming contract as origin.upload; correct MIME for the DMG.
        require(release_id == REQUEST['release'] and name in PACKAGES and size == PACKAGES[name]['bytes'], 'upload_scope')
        require(archive_tools.record(path) == PACKAGES[name], 'upload_file_changed')
        connection = http.client.HTTPSConnection('uploads.github.com', timeout=30)
        endpoint = f'/repos/{origin.REPO}/releases/{release_id}/assets?name=' + urllib.parse.quote(name, safe='')
        deadline = time.monotonic() + 900
        try:
            connection.putrequest('POST', endpoint)
            mime = 'application/zip' if name.endswith('.zip') else 'application/x-apple-diskimage'
            for key, value in {**self.headers(), 'Content-Type': mime, 'Content-Length': str(size)}.items():
                connection.putheader(key, value)
            connection.endheaders()
            digest, sent = hashlib.sha256(), 0
            with path.open('rb') as source:
                while block := source.read(1024 * 1024):
                    require(time.monotonic() <= deadline, 'upload_deadline')
                    sent += len(block)
                    require(sent <= size, 'upload_file_changed')
                    digest.update(block)
                    connection.send(block)
            require(sent == size and digest.hexdigest() == PACKAGES[name]['sha256'], 'upload_file_changed')
            response = connection.getresponse()
            require(response.status == 201, 'asset_upload_rejected')
            data = response.read(origin.MAX_JSON + 1)
            require(len(data) <= origin.MAX_JSON, 'upload_response_too_large')
            return json.loads(data)
        finally:
            connection.close()


def execute(client, output):
    receipts = output / 'receipts'
    receipts.mkdir(parents=True, exist_ok=False)
    downloads = output / 'download'
    downloads.mkdir()
    report = {'schemaVersion': 1, 'repository': origin.REPO, 'kind': 'fixed-backroad-macos-draft-packages', 'request': REQUEST.copy(), 'game': GAME, 'status': 'running', 'phase': 'validate-original-identity', 'releaseCreatedOrPublished': False, 'packagesRebuiltOrResigned': False, 'packageSignatureOrGameplayVerifiedByThisTransfer': False, 'assets': []}
    report['executedSources'] = {name: archive_tools.record(Path(__file__).with_name(name)) for name in [Path(__file__).name, 'artifact-draft-transfer.py', 'android-runtime-artifact.py']}
    report['executor'] = {key: os.environ.get(name) for key, name in [('run', 'GITHUB_RUN_ID'), ('attempt', 'GITHUB_RUN_ATTEMPT'), ('source', 'GITHUB_SHA')]}
    def save():
        raw = json.dumps(report, indent=2) + '\n'
        require(len(raw.encode()) < 128_000, 'receipt_too_large')
        (receipts / 'transfer.json').write_text(raw)
    save()
    try:
        base = '/repos/' + origin.REPO
        run = client.get(f'{base}/actions/runs/{REQUEST["run"]}/attempts/{REQUEST["attempt"]}')
        artifact = client.get(f'{base}/actions/artifacts/{REQUEST["artifact"]}')
        jobs = client.pages(f'{base}/actions/runs/{REQUEST["run"]}/attempts/{REQUEST["attempt"]}/jobs', 'jobs')
        require(run.get('path') == origin.MACOS_WORKFLOW, 'wrong_original_workflow')
        registry = origin.source_registry(client, REQUEST['source'])
        info = origin.source_identity(run, artifact, jobs, REQUEST, registry_source=registry)
        require(info['jobConclusion'] == 'success' and info['artifactName'] == ARTIFACT['name'] and info['artifactBytes'] == ARTIFACT['bytes'] and info['artifactSha256'] == ARTIFACT['sha256'], 'wrong_fixed_artifact')
        listed = client.pages(f'{base}/actions/runs/{REQUEST["run"]}/artifacts', 'artifacts')
        matches = [a for a in listed if a.get('id') == REQUEST['artifact'] or a.get('name') == ARTIFACT['name']]
        require(len(matches) == 1 and matches[0] == artifact, 'artifact_run_membership_mismatch')
        report['source'] = info
        release_path = f'{base}/releases/{REQUEST["release"]}'
        report['release'] = draft_identity(client.get(release_path))
        # Validate every existing target before any upload, including partial previous attempts.
        for name in PACKAGES:
            existing_asset(client, release_path, name)
        report['phase'] = 'download-complete-original-artifact'
        save()
        archive = downloads / f'artifact-{REQUEST["artifact"]}.zip'
        size, digest = client.download(REQUEST['artifact'], archive, ARTIFACT['bytes'])
        require({'bytes': size, 'sha256': digest} == {k: ARTIFACT[k] for k in ('bytes', 'sha256')}, 'original_artifact_digest_mismatch')
        require(archive_tools.record(archive) == {'bytes': size, 'sha256': digest}, 'download_disk_digest_mismatch')
        report['originalArchive'] = {'bytes': size, 'sha256': digest, 'repacked': False}
        report['phase'] = 'validate-and-extract-original-packages'
        save()
        files, report['archiveValidation'] = extract_packages(archive, downloads / 'packages')
        for name, path in files.items():
            require(client.get(f'{base}/actions/artifacts/{REQUEST["artifact"]}') == artifact, 'artifact_metadata_changed')
            draft_identity(client.get(release_path))
            existing = existing_asset(client, release_path, name)
            if existing:
                report['assets'].append({**existing, 'operation': 'reused-identical'})
                save()
                continue
            report['phase'] = 'upload-original-package'
            report['uploadAttempt'] = {'name': name, **PACKAGES[name]}
            save()
            uploaded = client.upload(REQUEST['release'], name, path, PACKAGES[name]['bytes'])
            confirmed = asset_identity(uploaded, name)
            actual = existing_asset(client, release_path, name)
            require(actual == confirmed, 'uploaded_asset_not_in_release')
            draft_identity(client.get(release_path))
            report['assets'].append({**confirmed, 'operation': 'uploaded-original-bytes'})
            save()
        draft_identity(client.get(release_path))
        for item in report['assets']:
            require(existing_asset(client, release_path, item['name']) == {k: v for k, v in item.items() if k != 'operation'}, 'final_asset_changed')
        report.update(status='passed', phase='verified-two-original-packages-in-existing-draft')
        save()
        return True
    except Exception as error:
        report.update(status='failed', failureCode=str(error) if isinstance(error, origin.Rejected) else type(error).__name__)
        save()
        return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('transfer').add_argument('--output', type=Path, required=True)
    commands.add_parser('export-receipt').add_argument('--directory', type=Path, required=True)
    args = parser.parse_args()
    try:
        require(os.environ.get('GITHUB_REPOSITORY') == origin.REPO, 'wrong_executor_repository')
        if args.command == 'export-receipt':
            origin.export_receipt(args.directory)
            return 0
        require(os.environ.get('GITHUB_ACTIONS') == 'true' and os.environ.get('GITHUB_EVENT_NAME') == 'workflow_dispatch', 'actions_dispatch_only')
        return 0 if execute(GitHub(os.environ.get('GH_TOKEN')), args.output) else 1
    except Exception as error:
        print('Draft package transfer failed: ' + (str(error) if isinstance(error, origin.Rejected) else type(error).__name__), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
