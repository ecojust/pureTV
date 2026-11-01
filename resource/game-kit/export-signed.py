#!/usr/bin/env python3
"""Verify a signed result and create one isolated, immutable-per-run export ref.

This runs from the workflow SHA, never from game source. It does not sign,
read release keys, execute source scripts, or update an existing Git ref.
"""
import argparse
import base64
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.request
import zipfile

REPOSITORY = 'ecojust/pureTV'
WORKFLOW_PATH = '.github/workflows/sign-game-kit.yml'
MAX_APK_BYTES = 10_000_000


def require(value, message):
    if not value:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def coordinates(source_sha, workflow_sha, slug, run_id):
    require(re.fullmatch(r'[a-f0-9]{40}', source_sha), 'Exact source SHA required')
    require(re.fullmatch(r'[a-f0-9]{40}', workflow_sha), 'Exact workflow SHA required')
    require(len(slug) <= 80 and re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', slug), 'Invalid game slug')
    require(re.fullmatch(r'[1-9][0-9]{0,19}', run_id), 'Invalid workflow run ID')
    return 'build-assets/game-kit-signed-' + run_id


def command(args, *, cwd=None):
    result = subprocess.run([str(a) for a in args], cwd=cwd, capture_output=True)
    require(result.returncode == 0, 'Verification tool failed: ' + Path(str(args[0])).name)
    return result.stdout


def load_builder():
    # Only the builder checked out alongside this trusted export script is imported.
    spec = importlib.util.spec_from_file_location('trusted_export_builder', Path(__file__).with_name('build.py'))
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    return builder


def verify_artifact(*, source, source_sha, workflow_sha, slug, run_id, artifact, build_tools, expected_cert):
    coordinates(source_sha, workflow_sha, slug, run_id)
    require(re.fullmatch(r'[a-f0-9]{64}', expected_cert), 'Invalid trusted certificate pin')
    builder = load_builder()
    source = builder.checked_directory(source, 'source checkout')
    require(command(['git', 'rev-parse', 'HEAD'], cwd=source).decode().strip() == source_sha, 'Source checkout mismatch')
    builder.KIT = builder.checked_directory(source / 'resource/game-kit', 'source game kit')
    builder.validate_native_source(builder.KIT)
    game = builder.checked_directory(source / 'resource/apps' / slug, 'game source')
    meta = builder.metadata(game)
    require(meta['id'] == slug, 'Source game id mismatch')
    icon = builder.game_icon(game)
    apk_name = slug + '-' + meta['version'] + '.apk'
    artifact = builder.checked_directory(artifact, 'downloaded artifact')
    require({path.name for path in artifact.iterdir()} == {apk_name, 'signing-receipt.json'}, 'Artifact must contain exactly the expected APK and receipt')
    for path in artifact.iterdir():
        require(path.is_file() and not path.is_symlink(), 'Artifact files must be regular files')
    apk = artifact / apk_name
    receipt_file = artifact / 'signing-receipt.json'
    require(0 < apk.stat().st_size < MAX_APK_BYTES and 0 < receipt_file.stat().st_size <= 262_144, 'Artifact file size exceeds limits')
    raw, receipt_raw = apk.read_bytes(), receipt_file.read_bytes()
    receipt = json.loads(receipt_raw)
    require(isinstance(receipt, dict) and receipt.get('schema') == 1, 'Invalid signing receipt schema')
    require(receipt.get('sourceSha') == source_sha and receipt.get('slug') == slug, 'Receipt source or game mismatch')
    require(str(receipt.get('workflowRun')) == run_id and receipt.get('signerCommit') == workflow_sha, 'Receipt belongs to a different signing run or workflow revision')
    require(receipt.get('file') == apk_name, 'Receipt filename mismatch')
    require(type(receipt.get('bytes')) is int and receipt['bytes'] == len(raw) and receipt.get('sha256') == digest(raw), 'APK digest/size differs from receipt')
    expected_identity = {key: meta[key] for key in ('packageName', 'version', 'versionCode')}
    require({key: receipt.get(key) for key in expected_identity} == expected_identity, 'Receipt package/version differs from source')
    require(receipt.get('signatureVerified') is True and receipt.get('sourceAssetsMatchApk') is True, 'Receipt has not passed signing/source verification')
    require(receipt.get('certificateSha256') == expected_cert, 'Receipt certificate differs from the trusted pin')
    expected_assets = builder.payload(game)
    with zipfile.ZipFile(apk) as archive:
        entries = archive.infolist()
        require(len(entries) < 1024 and len(entries) == len({item.filename for item in entries}), 'Duplicate or excessive APK entries')
        require(sum(item.file_size for item in entries) < 40_000_000, 'APK expansion exceeds limit')
        for item in entries:
            require(not item.is_dir() and not item.filename.startswith('/') and '..' not in Path(item.filename).parts, 'Invalid APK entry path')
            require((item.external_attr >> 16) & 0o170000 != 0o120000, 'APK contains symlink')
        require(archive.testzip() is None, 'APK CRC verification failed')
        actual_assets = {item.filename[7:]: archive.read(item) for item in entries if item.filename.startswith('assets/')}
        require(actual_assets == expected_assets, 'APK assets differ from exact source checkout')
        require(archive.read('res/raw/license.txt') == (builder.KIT / 'android/src/main/res/raw/license.txt').read_bytes(), 'APK copyright notice differs from source')
    expected_asset_hashes = {name: digest(data) for name, data in expected_assets.items()}
    require(receipt.get('assetsSha256') == expected_asset_hashes and receipt.get('checkedAssets') == len(expected_assets), 'Receipt asset hashes are incomplete or incorrect')
    native_hashes = {}
    for file in sorted((builder.KIT / 'android/src/main').rglob('*')):
        if file.is_file():
            native_hashes[file.relative_to(source).as_posix()] = digest(file.read_bytes())
    if icon is not None:
        native_hashes[(game / 'icon.xml').relative_to(source).as_posix()] = digest(icon)
    require(receipt.get('nativeSourceSha256') == native_hashes, 'Receipt native/icon hashes differ from source')
    verified = command([build_tools / 'apksigner', 'verify', '--verbose', '--print-certs', apk]).decode()
    certificates = re.findall(r'Signer #\d+ certificate SHA-256 digest: ([a-fA-F0-9]+)', verified)
    require(len(certificates) == 1 and certificates[0].lower() == expected_cert, 'APK certificate verification failed')
    badging = command([build_tools / 'aapt', 'dump', 'badging', apk]).decode()
    identity = re.search(r"^package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'", badging, re.M)
    require(identity is not None and {'packageName': identity[1], 'versionCode': int(identity[2]), 'version': identity[3]} == expected_identity, 'APK package/version differs from source')
    command([build_tools / 'zipalign', '-c', '4', apk])
    # Retain immutable verified bytes. The publishing step never rereads input files.
    return {'files': {apk_name: raw, 'signing-receipt.json': receipt_raw},
            'sourceSha': source_sha, 'workflowSha': workflow_sha, 'slug': slug, 'runId': run_id,
            'version': meta['version'], 'sha256': digest(raw), 'bytes': len(raw), 'certificateSha256': expected_cert,
            'receiptSha256': digest(receipt_raw)}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class GitHubApi:
    def __init__(self, token):
        require(bool(token), 'GitHub export token is required')
        self.token = token
        self.opener = urllib.request.build_opener(NoRedirect())

    def __call__(self, method, path, payload=None, *, missing=False):
        data = None if payload is None else json.dumps(payload).encode()
        request = urllib.request.Request('https://api.github.com/repos/' + REPOSITORY + '/' + path,
            data=data, method=method, headers={'Authorization': 'Bearer ' + self.token,
            'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json'})
        try:
            with self.opener.open(request, timeout=45) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if missing and error.code == 404:
                return None
            raise RuntimeError('GitHub export operation failed with HTTP ' + str(error.code)) from None


def create_export_branch(api, verified):
    branch = coordinates(verified['sourceSha'], verified['workflowSha'], verified['slug'], verified['runId'])
    require(re.fullmatch(r'\d+\.\d+\.\d+', verified['version']), 'Invalid export version')
    apk_name = verified['slug'] + '-' + verified['version'] + '.apk'
    files = verified['files']
    require(set(files) == {apk_name, 'signing-receipt.json'}, 'Unexpected export file injection')
    require(all(type(data) is bytes for data in files.values()), 'Export files must be verified bytes')
    require(digest(files[apk_name]) == verified['sha256'] and len(files[apk_name]) == verified['bytes'], 'Verified APK bytes changed before export')
    require(digest(files['signing-receipt.json']) == verified['receiptSha256'], 'Verified receipt bytes changed before export')
    receipt = json.loads(files['signing-receipt.json'])
    require(receipt.get('sha256') == verified['sha256'] and receipt.get('sourceSha') == verified['sourceSha']
            and receipt.get('slug') == verified['slug'] and str(receipt.get('workflowRun')) == verified['runId']
            and receipt.get('signerCommit') == verified['workflowSha'], 'Verified receipt changed before export')
    require(api('GET', 'git/ref/heads/' + branch, missing=True) is None, 'Export branch already exists; existing refs are never updated')
    run = api('GET', 'actions/runs/' + verified['runId'])
    require(run.get('repository', {}).get('full_name') == REPOSITORY and run.get('head_repository', {}).get('full_name') == REPOSITORY, 'Run belongs to a different repository')
    require(run.get('head_sha') == verified['workflowSha'] and run.get('path') == WORKFLOW_PATH and run.get('event') == 'workflow_dispatch', 'Run does not match the trusted signing workflow')
    # Include prior attempts: rerunning only a failed export can reuse the same
    # completed sign job and immutable artifact from this exact workflow run.
    jobs = api('GET', 'actions/runs/' + verified['runId'] + '/jobs?filter=all&per_page=100')
    require(jobs.get('total_count', 0) <= 100 and any(job.get('name') == 'sign' and job.get('status') == 'completed'
            and job.get('conclusion') == 'success' for job in jobs.get('jobs', [])), 'This run has no successful signing job')
    entries = []
    for name in (apk_name, 'signing-receipt.json'):
        blob = api('POST', 'git/blobs', {'content': base64.b64encode(files[name]).decode(), 'encoding': 'base64'})
        require(re.fullmatch(r'[a-f0-9]{40}', blob.get('sha', '')), 'Invalid Git blob response')
        entries.append({'path': verified['slug'] + '/' + name, 'mode': '100644', 'type': 'blob', 'sha': blob['sha']})
    tree = api('POST', 'git/trees', {'tree': entries})
    require(re.fullmatch(r'[a-f0-9]{40}', tree.get('sha', '')), 'Invalid Git tree response')
    commit = api('POST', 'git/commits', {'message': 'Export verified ' + verified['slug'] + ' APK from signing run ' + verified['runId'], 'tree': tree['sha'], 'parents': []})
    require(re.fullmatch(r'[a-f0-9]{40}', commit.get('sha', '')), 'Invalid Git commit response')
    # POST creates only a new reference; a concurrent creator causes a failure.
    # There is deliberately no PATCH, force-push, delete, or default-branch path.
    created = api('POST', 'git/refs', {'ref': 'refs/heads/' + branch, 'sha': commit['sha']})
    require(created.get('ref') == 'refs/heads/' + branch and created.get('object', {}).get('sha') == commit['sha'], 'Export ref response mismatch')
    return {'branch': branch, 'commit': commit['sha'], 'sourceSha': verified['sourceSha'],
            'apk': verified['slug'] + '/' + apk_name, 'bytes': verified['bytes'], 'sha256': verified['sha256'], 'files': 2}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--source-sha', required=True)
    parser.add_argument('--workflow-sha', required=True)
    parser.add_argument('--slug', required=True)
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--artifact', required=True, type=Path)
    parser.add_argument('--build-tools', required=True, type=Path)
    args = parser.parse_args()
    coordinates(args.source_sha, args.workflow_sha, args.slug, args.run_id)
    require(os.environ.get('GITHUB_REPOSITORY') == REPOSITORY, 'Exporter is restricted to ecojust/pureTV')
    require(os.environ.get('GITHUB_RUN_ID') == args.run_id and os.environ.get('GITHUB_SHA') == args.workflow_sha, 'Export arguments do not match this workflow run')
    trusted_root = Path(__file__).resolve().parents[2]
    require(command(['git', 'rev-parse', 'HEAD'], cwd=trusted_root).decode().strip() == args.workflow_sha, 'Exporter checkout is not the workflow SHA')
    certificate = (trusted_root / 'tools/puretv-release-certificate-v2.sha256').read_text().strip()
    verified = verify_artifact(source=args.source, source_sha=args.source_sha, workflow_sha=args.workflow_sha,
        slug=args.slug, run_id=args.run_id, artifact=args.artifact, build_tools=args.build_tools, expected_cert=certificate)
    result = create_export_branch(GitHubApi(os.environ.get('GH_TOKEN')), verified)
    print(json.dumps(result))


if __name__ == '__main__':
    main()
