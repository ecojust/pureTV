#!/usr/bin/env python3
"""Exercise signing validation with actual APKs and a simulated read-only git transport.

No keystore, signing, commits, remote mutation or workflow dispatch is performed.
"""
import argparse
import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from unittest.mock import patch
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', required=True, type=Path)
parser.add_argument('--apk', required=True, type=Path)
parser.add_argument('--build-tools', required=True, type=Path)
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args()
spec = importlib.util.spec_from_file_location('sign_request', Path(__file__).with_name('sign-request.py'))
signer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(signer)
meta = json.loads((args.source / 'resource/apps/gravity-courier/game.json').read_text())
raw = args.apk.read_bytes()
source_sha, request_commit = 'a' * 40, 'b' * 40
original_command = signer.command
checks = []


def rewrite(raw_bytes, changes, folder):
    with zipfile.ZipFile(io.BytesIO(raw_bytes)) as archive:
        data = {name: archive.read(name) for name in archive.namelist()}
    data.update(changes)
    unaligned, aligned = folder / 'unaligned.apk', folder / 'rewritten.apk'
    with zipfile.ZipFile(unaligned, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for name, value in data.items():
            archive.writestr(name, value)
    subprocess.run([str(args.build_tools / 'zipalign'), '-f', '4', str(unaligned), str(aligned)], check=True)
    return aligned.read_bytes()


def invoke(folder, requested=raw, rebuilt=None, changed_request=None, commit=request_commit, validate=True):
    request = {'schema': 1, 'slug': meta['id'], 'sourceSha': source_sha,
               **{key: meta[key] for key in ('packageName', 'version', 'versionCode')},
               'unsignedSha256': hashlib.sha256(requested).hexdigest(), 'unsignedBytes': len(requested)}
    if changed_request:
        request.update(changed_request)
    def fake_git(command, *, cwd=None, quiet=False):
        if command[0] == 'git':
            if command[1:3] == ['rev-parse', 'HEAD']:
                return source_sha.encode()
            if command[1:3] == ['rev-parse', 'FETCH_HEAD']:
                return commit.encode()
            if command[1] == 'fetch':
                return b''
            raise AssertionError('Unexpected git call')
        return original_command(command, cwd=cwd, quiet=quiet)
    def blob(_source, _commit, name, maximum):
        data = json.dumps(request).encode() if name.endswith('request.json') else requested
        assert len(data) <= maximum
        return data
    argv = ['sign-request.py', '--source', str(args.source), '--source-sha', source_sha,
            '--slug', meta['id'], '--request-branch', 'build-assets/game-kit-requests-regression',
            '--rebuilt', str(rebuilt or args.apk), '--build-tools', str(args.build_tools), '--output', str(folder)]
    if validate:
        argv.append('--validate-only')
    with patch.object(sys, 'argv', argv), patch.object(signer, 'command', fake_git), patch.object(signer, 'git_blob', blob), contextlib.redirect_stdout(io.StringIO()):
        signer.main()


def rejects(label, expected, function):
    try:
        function()
    except ValueError as error:
        assert expected in str(error), (label, error)
    else:
        raise AssertionError(label + ' unexpectedly passed')
    checks.append(label)


with tempfile.TemporaryDirectory(prefix='game-kit-signing-test-') as temporary:
    work = Path(temporary)
    valid = work / 'valid'
    invoke(valid)
    receipt = json.loads((valid / 'validated-request.json').read_text())
    assert receipt['localBuildMatchesCi'] is True and receipt['nativeSourceSha256'] and receipt['assetsSha256']
    assert (valid / 'validated-unsigned.apk').read_bytes() == raw
    checks.append('Valid requested APK matches source, clean rebuild, identity and size')
    native_changed = rewrite(raw, {'classes.dex': b'not executable source bytecode'}, work)
    altered = work / 'native-different'
    invoke(altered, native_changed)
    assert json.loads((altered / 'validated-request.json').read_text())['localBuildMatchesCi'] is False
    assert (altered / 'validated-unsigned.apk').read_bytes() == raw
    checks.append('Different requested bytecode is never selected for signing; CI rebuild is retained')
    asset_changed = rewrite(raw, {'assets/game.js': b'changed source'}, work)
    rejects('Reject mismatched requested asset', 'APK assets differ from source', lambda: invoke(work / 'bad-asset', asset_changed))
    rebuilt_changed = work / 'bad-rebuilt.apk'; rebuilt_changed.write_bytes(asset_changed)
    rejects('Reject mismatched CI asset', 'CI rebuild assets differ from source', lambda: invoke(work / 'bad-ci', rebuilt=rebuilt_changed))
    rejects('Reject requested package substitution', 'package/version differs from source', lambda: invoke(work / 'bad-id', changed_request={'packageName':'com.ecojust.other'}))
    rejects('Reject false request digest', 'Unsigned APK differs from request', lambda: invoke(work / 'bad-sha', changed_request={'unsignedSha256':'0'*64}))
    rejects('Reject signing without prior validation', 'separate validation step', lambda: invoke(work / 'no-validation', validate=False))
    rejects('Reject request branch change before secret signing step', 'Request branch moved', lambda: invoke(valid, commit='c'*40, validate=False))
    duplicate = work / 'duplicate.apk'
    with zipfile.ZipFile(duplicate, 'w') as archive:
        archive.writestr('classes.dex', b'a')
        archive.writestr('classes.dex', b'b')
    rejects('Reject duplicate APK entries', 'Duplicate or excessive', lambda: signer.entries(duplicate))
    report = {'passed': len(checks), 'checks': checks, 'transport': 'simulated read-only git; real APK/aapt/zipalign', 'signed': False, 'secretAccessed': False}
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
