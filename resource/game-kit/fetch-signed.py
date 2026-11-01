#!/usr/bin/env python3
"""Read one isolated export through GitHub blobs, verify it, and save to scratch.

Only read-only GitHub API requests are made. Downloaded JSON/APK data is never
executed. Existing files with different bytes are not replaced.
"""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import zipfile

REPOSITORY = 'ecojust/pureTV'
REPO = Path(__file__).resolve().parents[2]
MAX_APK_BYTES = 10_000_000


def require(value, message):
    if not value:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def github_read(path):
    result = subprocess.run(['gh', 'api', '--method', 'GET', 'repos/' + REPOSITORY + '/' + path], capture_output=True)
    require(result.returncode == 0, 'GitHub metadata/blob read failed')
    return json.loads(result.stdout)


def command(args):
    result = subprocess.run([str(a) for a in args], capture_output=True)
    require(result.returncode == 0, 'Verification tool failed: ' + Path(str(args[0])).name)
    return result.stdout


def decode_blob(body, expected_sha, maximum):
    require(body.get('encoding') == 'base64' and body.get('sha') == expected_sha, 'Unexpected Git blob encoding/identity')
    require(type(body.get('size')) is int and 0 < body['size'] <= maximum, 'Git blob exceeds size limit')
    encoded = body.get('content')
    require(isinstance(encoded, str) and len(encoded) <= maximum * 2, 'Invalid Git blob content')
    raw = base64.b64decode(''.join(encoded.split()), validate=True)
    require(len(raw) == body['size'], 'Git blob size mismatch')
    require(hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == expected_sha, 'Git blob object checksum mismatch')
    return raw


def fetch_bundle(api, *, run_id, slug, source_sha, build_tools, expected_cert):
    require(re.fullmatch(r'[1-9][0-9]{0,19}', run_id), 'Invalid workflow run ID')
    require(len(slug) <= 80 and re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', slug), 'Invalid game slug')
    require(re.fullmatch(r'[a-f0-9]{40}', source_sha), 'Exact source SHA required')
    require(re.fullmatch(r'[a-f0-9]{64}', expected_cert), 'Invalid trusted certificate pin')
    branch = 'build-assets/game-kit-signed-' + run_id
    ref = api('git/ref/heads/' + branch)
    require(ref.get('ref') == 'refs/heads/' + branch and ref.get('object', {}).get('type') == 'commit', 'Unexpected export ref')
    commit_sha = ref['object'].get('sha', '')
    require(re.fullmatch(r'[a-f0-9]{40}', commit_sha), 'Invalid export commit')
    commit = api('git/commits/' + commit_sha)
    require(commit.get('sha') == commit_sha and commit.get('parents') == [], 'Export must be an isolated root commit')
    tree_sha = commit.get('tree', {}).get('sha', '')
    require(re.fullmatch(r'[a-f0-9]{40}', tree_sha), 'Invalid export tree')
    tree = api('git/trees/' + tree_sha + '?recursive=1')
    require(tree.get('truncated') is False and len(tree.get('tree', [])) == 3, 'Unexpected export tree layout')
    blobs = {}
    for row in tree['tree']:
        if row.get('type') == 'tree':
            require(row.get('path') == slug and row.get('mode') == '040000', 'Unexpected export directory')
        else:
            require(row.get('type') == 'blob' and row.get('mode') == '100644' and re.fullmatch(r'[a-f0-9]{40}', row.get('sha', '')), 'Export contains a non-regular file')
            require(row.get('path') not in blobs, 'Duplicate export path')
            blobs[row['path']] = row
    require(len(blobs) == 2 and slug + '/signing-receipt.json' in blobs, 'Export must contain exactly two files')
    receipt_entry = blobs[slug + '/signing-receipt.json']
    require(0 < receipt_entry.get('size', 0) <= 262_144, 'Receipt exceeds size limit')
    receipt_raw = decode_blob(api('git/blobs/' + receipt_entry['sha']), receipt_entry['sha'], 262_144)
    receipt = json.loads(receipt_raw)
    require(isinstance(receipt, dict) and receipt.get('schema') == 1, 'Invalid signing receipt')
    require(receipt.get('sourceSha') == source_sha and receipt.get('slug') == slug and str(receipt.get('workflowRun')) == run_id, 'Receipt belongs to a different source/game/run')
    version = receipt.get('version', '')
    require(re.fullmatch(r'\d+\.\d+\.\d+', version), 'Invalid receipt version')
    apk_name = slug + '-' + version + '.apk'
    require(receipt.get('file') == apk_name and set(blobs) == {slug + '/' + apk_name, slug + '/signing-receipt.json'}, 'Unexpected APK filename or injected file')
    require(receipt.get('signatureVerified') is True and receipt.get('sourceAssetsMatchApk') is True, 'Receipt lacks successful verification')
    require(receipt.get('certificateSha256') == expected_cert, 'Receipt certificate differs from trusted pin')
    workflow_sha = receipt.get('signerCommit', '')
    require(re.fullmatch(r'[a-f0-9]{40}', workflow_sha), 'Invalid signing workflow SHA')
    run = api('actions/runs/' + run_id)
    require(run.get('repository', {}).get('full_name') == REPOSITORY and run.get('head_repository', {}).get('full_name') == REPOSITORY, 'Signing run belongs to a different repository')
    require(run.get('head_sha') == workflow_sha and run.get('path') == '.github/workflows/sign-game-kit.yml' and run.get('event') == 'workflow_dispatch', 'Receipt does not match the signing workflow run')
    require(run.get('status') == 'completed' and run.get('conclusion') == 'success', 'Wait for the complete signing/export workflow to succeed')
    metadata_blob = api('contents/resource/apps/' + slug + '/game.json?ref=' + source_sha)
    require(metadata_blob.get('type') == 'file', 'Game metadata is not a regular source file')
    metadata = json.loads(decode_blob(metadata_blob, metadata_blob.get('sha', ''), 16_384))
    require(metadata.get('id') == slug and re.fullmatch(r'com\.ecojust\.[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*', metadata.get('packageName', '')), 'Invalid source game identity')
    expected_identity = {key: metadata[key] for key in ('packageName', 'version', 'versionCode')}
    require({key: receipt.get(key) for key in expected_identity} == expected_identity, 'Receipt package/version differs from source metadata')
    apk_entry = blobs[slug + '/' + apk_name]
    require(type(apk_entry.get('size')) is int and 0 < apk_entry['size'] < MAX_APK_BYTES, 'APK exceeds size limit')
    raw = decode_blob(api('git/blobs/' + apk_entry['sha']), apk_entry['sha'], MAX_APK_BYTES - 1)
    require(type(receipt.get('bytes')) is int and receipt['bytes'] == len(raw) and receipt.get('sha256') == digest(raw), 'APK digest/size differs from receipt')
    with tempfile.TemporaryDirectory(prefix='puretv-download-verify-') as temporary:
        apk = Path(temporary) / apk_name
        apk.write_bytes(raw)
        with zipfile.ZipFile(apk) as archive:
            entries = archive.infolist()
            require(len(entries) < 1024 and len(entries) == len({item.filename for item in entries}), 'Duplicate or excessive APK entries')
            require(sum(item.file_size for item in entries) < 40_000_000 and archive.testzip() is None, 'APK expansion/CRC verification failed')
            for item in entries:
                require(not item.is_dir() and not item.filename.startswith('/') and '..' not in Path(item.filename).parts
                        and (item.external_attr >> 16) & 0o170000 != 0o120000, 'Invalid APK entry')
            assets = {item.filename[7:]: digest(archive.read(item)) for item in entries if item.filename.startswith('assets/')}
            require(assets == receipt.get('assetsSha256') and len(assets) == receipt.get('checkedAssets'), 'APK assets differ from signing receipt')
        output = command([build_tools / 'apksigner', 'verify', '--verbose', '--print-certs', apk]).decode()
        certificates = re.findall(r'Signer #\d+ certificate SHA-256 digest: ([a-fA-F0-9]+)', output)
        require(len(certificates) == 1 and certificates[0].lower() == expected_cert, 'APK signature certificate mismatch')
        badging = command([build_tools / 'aapt', 'dump', 'badging', apk]).decode()
        identity = re.search(r"^package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'", badging, re.M)
        require(identity is not None and {'packageName': identity[1], 'versionCode': int(identity[2]), 'version': identity[3]} == expected_identity, 'APK package/version differs from source')
        command([build_tools / 'zipalign', '-c', '4', apk])
    return {'files': {apk_name: raw, 'signing-receipt.json': receipt_raw}, 'summary': {
        'runId': run_id, 'branch': branch, 'exportCommit': commit_sha, 'sourceSha': source_sha, 'workflowSha': workflow_sha,
        'apk': apk_name, 'bytes': len(raw), 'sha256': digest(raw), 'certificateSha256': expected_cert,
        'receiptSha256': digest(receipt_raw),
        'signatureVerified': True, 'zipalignVerified': True, 'crcVerified': True, 'sourceIdentityVerified': True,
        'assetsMatchSigningReceipt': True, 'assetCount': len(assets), 'transport': 'read-only GitHub Git blobs API'}}


def store_bundle(bundle, output):
    files = dict(bundle['files'])
    summary = bundle['summary']
    require(set(files) == {summary['apk'], 'signing-receipt.json'}, 'Unexpected downloaded file injection')
    require(digest(files[summary['apk']]) == summary['sha256'] and len(files[summary['apk']]) == summary['bytes'], 'Verified downloaded APK changed before writing')
    require(digest(files['signing-receipt.json']) == summary['receiptSha256'], 'Verified downloaded receipt changed before writing')
    output = Path(output)
    require('..' not in output.parts, 'Output must not contain parent traversal')
    if not output.is_absolute():
        output = Path.cwd() / output
    for part in (output, *output.parents):
        require(not part.is_symlink(), 'Output must not traverse symlinks')
    require(not output.resolve().is_relative_to(REPO), 'Download to a scratch directory outside the repository')
    output.mkdir(parents=True, exist_ok=True)
    files['fetch-verification.json'] = (json.dumps(bundle['summary'], indent=2) + '\n').encode()
    for name, data in files.items():
        require(Path(name).name == name and '/' not in name and '\\' not in name and name not in ('.', '..'), 'Invalid output filename')
        path = output / name
        require(not path.is_symlink(), 'Refusing to replace an output symlink')
        if path.exists():
            require(path.is_file() and digest(path.read_bytes()) == digest(data), 'Existing output has different bytes: ' + name)
    for name, data in files.items():
        target = output / name
        with tempfile.NamedTemporaryFile(prefix='.verified-', dir=output, delete=False) as temporary:
            temporary.write(data)
            temporary.flush()
            os.fsync(temporary.fileno())
            staged = Path(temporary.name)
        try:
            staged.chmod(0o644)
            try:
                os.link(staged, target)  # Atomic create, never overwrite a racing writer.
            except FileExistsError:
                require(not target.is_symlink() and target.is_file() and digest(target.read_bytes()) == digest(data), 'Output appeared with different bytes: ' + name)
        finally:
            staged.unlink(missing_ok=True)
    return {**bundle['summary'], 'directory': str(output)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--slug', required=True)
    parser.add_argument('--source-sha', required=True)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--build-tools', type=Path, default=Path(os.environ.get('ANDROID_HOME', '/workspace/scratch/usedcar-android-sdk')) / 'build-tools/34.0.0')
    args = parser.parse_args()
    pin = (REPO / 'tools/puretv-release-certificate-v2.sha256').read_text().strip()
    bundle = fetch_bundle(github_read, run_id=args.run_id, slug=args.slug, source_sha=args.source_sha,
                          build_tools=args.build_tools, expected_cert=pin)
    print(json.dumps(store_bundle(bundle, args.output)))


if __name__ == '__main__':
    main()
