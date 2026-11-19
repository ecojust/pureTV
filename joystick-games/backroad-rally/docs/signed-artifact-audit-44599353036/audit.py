#!/usr/bin/env python3
"""Independently verify an existing signed artifact; never build, sign or install."""
import argparse
import datetime
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import zipfile

SOURCE = 'd548bccbe816bd4c03620388556ceef507b67d30'
RUN = 44599353036
ATTEMPT = 1
ARTIFACT = 14567692465
ASSET = 769042251
GAME = 'backroad-rally'
ARCHIVE_SHA = '7266f2a123eda2c8196abf6f9156fcacc453f3d70258dba75ca3b3afa6a7bd95'
ARCHIVE_BYTES = 104995469
APK_SHA = '8596350c7868352a9494d0667037ef4a75709af25cf50066df137bab3bcd8808'
APK_BYTES = 105020455
EXPECTED_NAMES = {
    'observers/backroad-rally/observer-backroad-rally.apk',
    'observers/backroad-rally/observer-signing-receipt.json',
    'observers/backroad-rally/observer-build.json',
    'packages/backroad-rally/SHA256SUMS.txt',
    'packages/backroad-rally/backroad-rally-0.1.0.apk',
    'packages/backroad-rally/build-receipt.json',
    'packages/backroad-rally/signing-receipt.json',
}
DOCS = Path(__file__).resolve().parent


def digest(data):
    return hashlib.sha256(data).hexdigest()


def record(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
    return {'bytes': path.stat().st_size, 'sha256': h.hexdigest()}


def load(path):
    return json.loads(path.read_text())


def safe_name(name):
    assert isinstance(name, str) and name and not any(ord(c) < 32 for c in name)
    p = PurePosixPath(name)
    assert name == p.as_posix() and not p.is_absolute() and '..' not in p.parts
    assert '\\' not in name and '.git' not in p.parts
    return name


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--repo', type=Path, required=True)
    p.add_argument('--archive', type=Path, required=True)
    p.add_argument('--scratch', type=Path, required=True)
    p.add_argument('--build-tools', type=Path, required=True)
    p.add_argument('--jdk', type=Path, required=True)
    a = p.parse_args()
    repo = a.repo.resolve()
    assert not a.scratch.exists(), 'Use a new scratch directory; never overwrite prior evidence'
    assert not a.scratch.resolve().is_relative_to(repo)
    assert not (DOCS / 'result.json').exists(), 'Never overwrite a completed audit'
    assert record(a.archive) == {'bytes': ARCHIVE_BYTES, 'sha256': ARCHIVE_SHA}
    run = load(DOCS / 'original-run-attempt.json')
    assert (run['id'], run['run_attempt'], run['head_sha']) == (RUN, ATTEMPT, SOURCE)
    assert run['repository']['full_name'] == 'ecojust/pureTV'
    assert run['path'] == '.github/workflows/joystick-catalog-android.yml'
    assert run['status'] == 'completed'
    jobs = load(DOCS / 'original-jobs.json')
    assert jobs['total_count'] == len(jobs['jobs'])
    for name in ('build (backroad-rally)', 'sign'):
        matches = [j for j in jobs['jobs'] if j['name'] == name]
        assert len(matches) == 1 and matches[0]['status'] == 'completed' and matches[0]['conclusion'] == 'success'
    artifact = load(DOCS / 'original-artifact-metadata.json')
    assert artifact['id'] == ARTIFACT and artifact['size_in_bytes'] == ARCHIVE_BYTES
    assert artifact['workflow_run']['id'] == RUN and artifact['workflow_run']['head_sha'] == SOURCE
    assert artifact['digest'] == 'sha256:' + ARCHIVE_SHA
    asset = load(DOCS / 'draft-asset-metadata.json')
    assert asset['id'] == ASSET and asset['size'] == ARCHIVE_BYTES
    assert asset['digest'] == 'sha256:' + ARCHIVE_SHA
    a.scratch.mkdir(parents=True)
    extracted = a.scratch / 'signed-artifact'
    extracted.mkdir()
    members = {}
    with zipfile.ZipFile(a.archive) as z:
        names = z.namelist()
        assert len(names) == len(set(names)) and set(names) == EXPECTED_NAMES
        for i in z.infolist():
            safe_name(i.filename)
            assert stat.S_IFMT(i.external_attr >> 16) in (0, stat.S_IFREG)
            assert not i.is_dir() and 0 < i.file_size < 128000000
            target = extracted / i.filename
            target.parent.mkdir(parents=True, exist_ok=True)
            with z.open(i) as source, target.open('xb') as dest:
                shutil.copyfileobj(source, dest, 1024 * 1024)
            assert target.stat().st_size == i.file_size
            members[i.filename] = record(target)
    folder = extracted / 'packages' / GAME
    receipt = load(folder / 'signing-receipt.json')
    unsigned = load(folder / 'build-receipt.json')
    observer_folder = extracted / 'observers' / GAME
    observer = load(observer_folder / 'observer-signing-receipt.json')
    assert receipt['sourceSha'] == SOURCE and str(receipt['runId']) == str(RUN)
    assert receipt['game'] == GAME and receipt['signatureVerified'] is True
    assert unsigned['sourceSha'] == SOURCE and str(unsigned['runId']) == str(RUN)
    assert unsigned['game'] == GAME and unsigned['unsigned'] is True and unsigned['committedInputsVerified'] is True
    assert receipt['unsignedSha256'] == unsigned['sha256']
    assert unsigned['contentSha256'] == receipt['contentSha256']
    inputs = receipt['sourceInputs']
    assert len(inputs) == 906
    assert unsigned['sourceInputsSha256'] == digest(json.dumps(inputs, sort_keys=True, separators=(',', ':')).encode())
    assert observer['sourceSha'] == SOURCE and str(observer['runId']) == str(RUN)
    assert observer['signed'] is True and observer['signatureVerified'] is True and observer['testArtifactOnly'] is True
    assert observer['modelWrites'] is False and observer['clockOverrides'] is False
    combined = dict(inputs)
    for name, value in observer['sourceFiles'].items():
        assert name not in combined or combined[name] == value
        combined[name] = value
    for name in combined:
        safe_name(name)
    tree = subprocess.check_output(['git', 'ls-tree', '-r', '-z', SOURCE, '--', *sorted(combined)], cwd=repo)
    entries = {}
    for row in tree.split(b'\0'):
        if row:
            meta, path = row.split(b'\t', 1)
            mode, kind, oid = meta.split()
            assert mode in (b'100644', b'100755') and kind == b'blob'
            entries[path.decode()] = oid.decode()
    assert set(entries) == set(combined)
    frozen = a.scratch / 'frozen-source'
    frozen.mkdir()
    queries = a.scratch / 'source-queries.txt'
    queries.write_text(''.join(SOURCE + ':' + n + '\n' for n in combined))
    with queries.open('rb') as stdin:
        process = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=repo, stdin=stdin, stdout=subprocess.PIPE)
        for name, want in combined.items():
            header = process.stdout.readline().split()
            assert len(header) == 3 and header[1] == b'blob' and header[0].decode() == entries[name]
            remaining = size = int(header[2])
            assert size == want['bytes']
            h = hashlib.sha256()
            target = frozen / name
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open('xb') as dest:
                while remaining:
                    data = process.stdout.read(min(1024 * 1024, remaining))
                    assert data
                    dest.write(data)
                    h.update(data)
                    remaining -= len(data)
            assert h.hexdigest() == want['sha256'], name
            assert process.stdout.read(1) == b'\n'
        assert process.stdout.read() == b'' and process.wait() == 0
    # Only the frozen data-composition helpers execute; no build/native game/install operation.
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location('backroad_frozen_android_build', frozen / 'joystick-games/tools/android-build.py')
    build = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build)
    assert build.sources(GAME) == inputs, 'Receipt inventory differs from the original source selector'
    assert build.observer_sources(GAME) == observer['sourceFiles']
    meta = build.metadata(GAME)
    assert meta['packageName'] == receipt['packageName'] and meta['version'] == receipt['versionName'] and meta['versionCode'] == receipt['versionCode']
    temp = a.scratch / 'payload-temporary'
    temp.mkdir()
    tempfile.tempdir = str(temp)
    expected = build.payload(GAME)
    expected_records = {n: {'bytes': len(b), 'sha256': digest(b)} for n, b in expected.items()}
    assert expected_records == receipt['assets']
    apk = folder / (GAME + '-' + receipt['versionName'] + '.apk')
    assert record(apk) == {'bytes': APK_BYTES, 'sha256': APK_SHA} == {k: receipt[k] for k in ('bytes', 'sha256')}
    assert (folder / 'SHA256SUMS.txt').read_text() == APK_SHA + '  ' + apk.name + '\n'
    assert 0 < APK_BYTES < build.limits(GAME)['maxApkBytes']
    with zipfile.ZipFile(apk) as z:
        names = z.namelist()
        assert len(names) == len(set(names))
        for name in names:
            safe_name(name.rstrip('/'))
        assets = {name[7:] for name in names if name.startswith('assets/') and not name.endswith('/')}
        assert assets == set(expected)
        content = {}
        for name in names:
            if not name.endswith('/'):
                data = z.read(name)  # Reads and validates every original ZIP entry, including META-INF.
                if name.startswith('assets/'):
                    assert data == expected[name[7:]], name
                if not name.startswith('META-INF/'):
                    content[name] = digest(data)
        assert content == receipt['contentSha256']
    del expected
    pin = (frozen / 'tools/puretv-release-certificate-v2.sha256').read_text().strip()
    env = {**os.environ, 'JAVA_HOME': str(a.jdk), 'PATH': str(a.jdk / 'bin') + os.pathsep + os.environ['PATH']}

    def native_identity(path, expected_identity, label):
        verify = subprocess.run([str(a.build_tools / 'apksigner'), 'verify', '--verbose', '--print-certs', str(path)], capture_output=True, text=True, env=env, timeout=120)
        (DOCS / (label + '-apksigner.txt')).write_text(verify.stdout + verify.stderr)
        assert verify.returncode == 0
        cert = re.search(r'Signer #1 certificate SHA-256 digest: (\S+)', verify.stdout)[1].lower()
        assert cert == pin == expected_identity['certificateSha256']
        badging = subprocess.check_output([str(a.build_tools / 'aapt'), 'dump', 'badging', str(path)], text=True, env=env, timeout=60)
        (DOCS / (label + '-badging.txt')).write_text(badging)
        identity = re.search(r"package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'", badging)
        assert identity and identity[1] == expected_identity['packageName'] and int(identity[2]) == expected_identity['versionCode'] and identity[3] == expected_identity['versionName']
        assert record(path) == {k: expected_identity[k] for k in ('bytes', 'sha256')}
        return {'packageName': identity[1], 'versionCode': int(identity[2]), 'versionName': identity[3], 'certificateSha256': cert, **record(path)}

    identity = native_identity(apk, receipt, 'game')
    assert observer['targetPackage'] == identity['packageName']
    assert Path(observer['apk']).name == observer['apk']
    observer_identity = native_identity(observer_folder / observer['apk'], observer['apkIdentity'], 'observer')
    originals = DOCS / 'original-receipts'
    originals.mkdir()
    for name in sorted(EXPECTED_NAMES):
        if not name.endswith('.apk'):
            target = originals / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(extracted / name, target)
            assert record(target) == members[name]
    report = {
        'status': 'passed', 'scope': 'Independent signed-artifact integrity, signature, identity and full frozen source/payload audit only; not game runtime acceptance or release publication',
        'verifiedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'sourceSha': SOURCE, 'originalRunId': RUN, 'originalRunAttempt': ATTEMPT,
        'originalRunConclusion': run['conclusion'],
        'originalRuntimeJobs': [{k: j[k] for k in ('id', 'name', 'status', 'conclusion')} for j in jobs['jobs'] if j['name'].startswith('runtime')],
        'originalArtifactId': ARTIFACT, 'draftTransferAssetId': ASSET, 'archive': record(a.archive), 'archiveEntries': members,
        'sourceInputsComparedToExactGitCommit': len(inputs), 'originalSelectorInventoryEqual': True,
        'observerSourceInputsComparedToExactGitCommit': len(observer['sourceFiles']), 'allSourceFilesCompared': len(combined),
        'allAssetCount': len(expected_records), 'allAssetsEqualExactFrozenPayloadAndReceipt': True,
        'allNonMetadataApkEntriesEqualReceipt': True, 'unsignedAndSignedContentReceiptsEqual': True,
        'game': identity, 'observer': observer_identity, 'maxApkBytes': build.limits(GAME)['maxApkBytes'],
        'exceedsRepositoryExportLimit100000000': APK_BYTES >= 100000000,
        'exceedsGitHub100MiB': APK_BYTES >= 100 * 1024 * 1024,
        'excessOverGitHub100MiBBytes': APK_BYTES - 100 * 1024 * 1024,
        'apkKeptInScratchOnly': True, 'scratchPath': str(a.scratch),
        'noBuildNoSignNoInstallNoGameExecution': True, 'noUploadOrPublication': True,
        'runtimeAcceptanceClaimed': False, 'physicalTvTested': False, 'physicalEsp32Tested': False,
        'script': record(Path(__file__)),
        'metadataRecords': {n: record(DOCS / n) for n in ('original-run-attempt.json', 'original-jobs.json', 'original-artifact-metadata.json', 'draft-asset-metadata.json')},
    }
    write(DOCS / 'result.json', report)
    print(json.dumps({k: report[k] for k in ('status', 'sourceSha', 'sourceInputsComparedToExactGitCommit', 'allAssetCount', 'game', 'originalRunConclusion', 'runtimeAcceptanceClaimed')}))


if __name__ == '__main__':
    main()
