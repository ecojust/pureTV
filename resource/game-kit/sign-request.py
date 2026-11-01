#!/usr/bin/env python3
"""Validate one local request and sign the clean CI rebuild to an artifact.

Only this script from the workflow's pinned revision is executed. The request
branch supplies JSON and APK bytes, never scripts. There are no git writes.
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
import tempfile
import zipfile

MAX_BYTES = 10_000_000


def require(value, message):
    if not value:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def command(args, *, cwd=None, quiet=False):
    result = subprocess.run([str(a) for a in args], cwd=cwd, capture_output=True)
    if result.returncode:
        raise RuntimeError('Tool failed: ' + Path(str(args[0])).name + ('' if quiet else ': ' + result.stderr.decode(errors='replace')[:1000]))
    return result.stdout


def git_blob(source, commit, path, maximum):
    row = command(['git', 'ls-tree', commit, '--', path], cwd=source).decode().strip()
    require(re.fullmatch(r'100(?:644|755) blob [a-f0-9]{40}\t' + re.escape(path), row), 'Request input must be a regular git blob')
    identity = row.split()[2]
    require(0 < int(command(['git', 'cat-file', '-s', identity], cwd=source)) <= maximum, 'Request input size is invalid')
    return command(['git', 'cat-file', 'blob', identity], cwd=source)


def entries(path):
    with zipfile.ZipFile(path) as archive:
        infos = archive.infolist()
        require(len(infos) == len(set(i.filename for i in infos)) and len(infos) < 1024, 'Duplicate or excessive APK entries')
        require(sum(i.file_size for i in infos) < 40_000_000, 'APK expansion exceeds budget')
        for item in infos:
            require(not item.is_dir() and '..' not in Path(item.filename).parts and not item.filename.startswith('/'), 'Invalid APK entry path')
            require((item.external_attr >> 16) & 0o170000 != 0o120000, 'APK contains symlink')
            require(not re.match(r'META-INF/.*\.(RSA|DSA|EC|SF)$', item.filename, re.I), 'Requested APK is already signed')
        require(archive.testzip() is None, 'APK CRC check failed')
        return {item.filename: archive.read(item) for item in infos}


def identity(tools, apk):
    badging = command([tools / 'aapt', 'dump', 'badging', apk]).decode()
    match = re.search(r"^package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'", badging, re.M)
    require(match is not None, 'Cannot read APK identity')
    return {'packageName': match[1], 'versionCode': int(match[2]), 'version': match[3]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--source-sha', required=True)
    parser.add_argument('--slug', required=True)
    parser.add_argument('--request-branch', required=True)
    parser.add_argument('--rebuilt', type=Path, required=True)
    parser.add_argument('--build-tools', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--validate-only', action='store_true')
    args = parser.parse_args()
    require(re.fullmatch(r'[a-f0-9]{40}', args.source_sha), 'Exact source SHA required')
    require(re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', args.slug), 'Invalid slug')
    require(re.fullmatch(r'build-assets/game-kit-requests-[a-z0-9][a-z0-9-]{0,63}', args.request_branch), 'Invalid request branch')
    source = args.source.resolve()
    previous_validation = None
    if not args.validate_only:
        prior = args.output / 'validated-request.json'
        require(prior.is_file(), 'Run the separate validation step before providing signing secrets')
        previous_validation = json.loads(prior.read_text())
        require(previous_validation.get('sourceSha') == args.source_sha and previous_validation.get('slug') == args.slug, 'Previous validation does not match this request')
    require(command(['git', 'rev-parse', 'HEAD'], cwd=source).decode().strip() == args.source_sha, 'Source checkout mismatch')
    command(['git', 'fetch', '--depth=1', 'origin', 'refs/heads/' + args.request_branch], cwd=source)
    request_commit = command(['git', 'rev-parse', 'FETCH_HEAD'], cwd=source).decode().strip()
    if previous_validation is not None:
        require(request_commit == previous_validation.get('requestCommit'), 'Request branch moved after validation; validate again before signing')
    prefix = 'requests/' + args.slug + '/'
    request = json.loads(git_blob(source, request_commit, prefix + 'request.json', 16_384))
    require(isinstance(request, dict) and set(request) == {'schema', 'slug', 'sourceSha', 'packageName', 'version', 'versionCode', 'unsignedSha256', 'unsignedBytes'}, 'Invalid request schema')
    require(request['schema'] == 1 and request['slug'] == args.slug and request['sourceSha'] == args.source_sha, 'Request source identity mismatch')
    require(re.fullmatch(r'[a-f0-9]{64}', request['unsignedSha256']) and type(request['unsignedBytes']) is int, 'Invalid requested digest/size')
    raw = git_blob(source, request_commit, prefix + 'unsigned.apk', MAX_BYTES - 1)
    require(len(raw) == request['unsignedBytes'] and digest(raw) == request['unsignedSha256'], 'Unsigned APK differs from request')
    require(b'APK Sig Block 42' not in raw, 'Requested APK has a signing block')
    game = source / 'resource/apps' / args.slug
    require(game.resolve().is_relative_to(source) and not game.is_symlink(), 'Game source escapes checkout')
    # Import only the builder next to this trusted signer; source data is never imported.
    spec = importlib.util.spec_from_file_location('trusted_game_kit_build', Path(__file__).with_name('build.py'))
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    builder.KIT = source / 'resource/game-kit'
    meta = builder.metadata(game)
    require(meta['id'] == args.slug, 'Source game id differs')
    expected = {key: meta[key] for key in ('packageName', 'version', 'versionCode')}
    require({key: request[key] for key in expected} == expected, 'Requested package/version differs from source')
    args.output.mkdir(parents=True, exist_ok=True)
    requested_apk = args.output / 'requested-unsigned.apk'
    requested_apk.write_bytes(raw)
    actual_entries = entries(requested_apk)
    rebuilt_raw = args.rebuilt.read_bytes()
    require(0 < len(rebuilt_raw) < MAX_BYTES and b'APK Sig Block 42' not in rebuilt_raw, 'CI rebuild must be unsigned and below the size limit')
    rebuilt_entries = entries(args.rebuilt)
    expected_assets = builder.payload(game)
    require({name[7:]: data for name, data in actual_entries.items() if name.startswith('assets/')} == expected_assets, 'APK assets differ from source')
    require({name[7:]: data for name, data in rebuilt_entries.items() if name.startswith('assets/')} == expected_assets, 'CI rebuild assets differ from source')
    for apk in (requested_apk, args.rebuilt):
        require(identity(args.build_tools, apk) == expected, 'APK package/version differs from source')
        command([args.build_tools / 'zipalign', '-c', '4', apk])
    # Always sign the CI build. Local compiler/platform revisions can differ;
    # mismatching native bytes from the request are never sent to the signer.
    unsigned = args.output / 'validated-unsigned.apk'
    unsigned.write_bytes(rebuilt_raw)
    native_source = {}
    native_dir = source / 'resource/game-kit/android/src/main'
    for file in sorted(native_dir.rglob('*')):
        require(not file.is_symlink(), 'Native source must not contain symlinks')
        if file.is_file():
            native_source[file.relative_to(source).as_posix()] = digest(file.read_bytes())
    icon = builder.game_icon(game)
    if icon is not None:
        native_source[(game / 'icon.xml').relative_to(source).as_posix()] = digest(icon)
    require(native_source, 'Missing native host source')
    validation = {'schema': 1, 'slug': args.slug, 'sourceSha': args.source_sha, 'requestCommit': request_commit,
                  **expected, 'requestedUnsignedSha256': digest(raw), 'requestedUnsignedBytes': len(raw),
                  'unsignedSha256': digest(rebuilt_raw), 'unsignedBytes': len(rebuilt_raw),
                  'sourceAssetsMatchApk': True, 'localBuildMatchesCi': actual_entries == rebuilt_entries,
                  'signedInput': 'CI rebuild from sourceSha using the workflow-pinned builder',
                  'nativeSourceSha256': native_source,
                  'assetsSha256': {name: digest(data) for name, data in expected_assets.items()},
                  'checkedAssets': len(expected_assets), 'physicalTvTested': False}
    if previous_validation is not None:
        require(validation == previous_validation, 'Source or rebuilt APK changed after validation')
    (args.output / 'validated-request.json').write_text(json.dumps(validation, indent=2) + '\n')
    if args.validate_only:
        print(json.dumps({'validated': args.slug, 'bytes': len(raw), 'sourceSha': args.source_sha}))
        return
    pin = Path(__file__).resolve().parents[2] / 'tools/puretv-release-certificate-v2.sha256'
    expected_cert = pin.read_text().strip()
    require(re.fullmatch(r'[a-f0-9]{64}', expected_cert), 'Invalid pinned release certificate')
    encoded = os.environ.get('PURETV_KEYSTORE_BASE64')
    require(encoded and os.environ.get('PURETV_KEYSTORE_PASSWORD'), 'Existing repository release signing secrets are required')
    with tempfile.TemporaryDirectory(prefix='puretv-signing-') as temporary:
        key = Path(temporary) / 'release.jks'
        key.write_bytes(base64.b64decode(encoded, validate=True)); key.chmod(0o600)
        try:
            certificate = command(['keytool', '-exportcert', '-alias', 'puretv', '-keystore', key, '-storepass:env', 'PURETV_KEYSTORE_PASSWORD'], quiet=True)
            require(digest(certificate) == expected_cert, 'Existing signing key does not match pinned certificate')
            apk = args.output / (args.slug + '-' + meta['version'] + '.apk')
            command([args.build_tools / 'apksigner', 'sign', '--v4-signing-enabled', 'false', '--ks', key, '--ks-key-alias', 'puretv',
                     '--ks-pass', 'env:PURETV_KEYSTORE_PASSWORD', '--key-pass', 'env:PURETV_KEYSTORE_PASSWORD', '--out', apk, unsigned], quiet=True)
        finally:
            key.unlink(missing_ok=True)
    signed = apk.read_bytes()
    require(0 < len(signed) < MAX_BYTES, 'Signed APK exceeds 10,000,000 bytes')
    verified = command([args.build_tools / 'apksigner', 'verify', '--verbose', '--print-certs', apk]).decode()
    certificate_match = re.search(r'Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]+)', verified)
    require(certificate_match and certificate_match[1].lower() == expected_cert, 'Signed APK certificate verification failed')
    require(identity(args.build_tools, apk) == expected, 'Signed package/version changed')
    command([args.build_tools / 'zipalign', '-c', '4', apk])
    receipt = {**validation, 'file': apk.name, 'sha256': digest(signed), 'bytes': len(signed), 'certificateSha256': expected_cert,
               'signatureVerified': True, 'workflowRun': os.environ.get('GITHUB_RUN_ID'), 'signerCommit': os.environ.get('GITHUB_SHA')}
    (args.output / 'signing-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'signed': apk.name, 'bytes': len(signed), 'sha256': digest(signed)}))


if __name__ == '__main__':
    main()
