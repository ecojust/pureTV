#!/usr/bin/env python3
"""Read one original signed Actions artifact. Never build, sign or publish."""
import argparse
import datetime as dt
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import zipfile

SPEC = importlib.util.spec_from_file_location('artifact_origin', Path(__file__).with_name('artifact-draft-transfer.py'))
origin = importlib.util.module_from_spec(SPEC); SPEC.loader.exec_module(origin)
WORKFLOW = '.github/workflows/joystick-catalog-android.yml'
NAME = 'joystick-android-signed'
MAX_UNPACKED = 1_000_000_000


def record(path):
    assert path.is_file() and not path.is_symlink(), str(path)
    digest = hashlib.sha256()
    with path.open('rb') as source:
        while block := source.read(1024 * 1024): digest.update(block)
    return {'bytes': path.stat().st_size, 'sha256': digest.hexdigest()}


def safe_name(name):
    assert isinstance(name, str) and name and not any(ord(c) < 32 for c in name)
    p = PurePosixPath(name)
    assert not p.is_absolute() and name == p.as_posix() and not set(p.parts) & {'..', '.git'} and '\\' not in name
    return name


def validate_origin(value, games, now=None):
    assert value['schemaVersion'] == 1 and value['kind'] == 'github-actions-signed-artifact'
    request = value['request']
    assert set(request) == {'run', 'attempt', 'source', 'artifact'}
    for key in ('run', 'attempt', 'artifact'): origin.positive(request[key])
    assert re.fullmatch('[a-f0-9]{40}', request['source'])
    run, artifact, jobs = value['run'], value['artifact'], value['jobs']
    assert run['path'] == WORKFLOW and artifact['name'] == NAME
    identity = origin.source_identity(run, artifact, jobs, request, now=now)
    assert identity['jobConclusion'] == 'success', 'Original signing job failed'
    listed = value['runArtifacts']
    matches = [a for a in listed if a['name'] == NAME]
    assert len(matches) == 1 and matches[0] == artifact, 'Original signed artifact must be unique and match direct metadata'
    assert games and len(games) == len(set(games))
    builds = []
    for game in games:
        assert re.fullmatch('[a-z][a-z0-9]*(?:-[a-z0-9]+)*', game)
        found = [j for j in jobs if j['name'] == 'build (' + game + ')']
        assert len(found) == 1
        job = found[0]
        assert (job['run_id'], job['run_attempt'], job['head_sha']) == (request['run'], request['attempt'], request['source'])
        assert job['status'] == 'completed' and job['conclusion'] == 'success'
        uploads = [s for s in job['steps'] if s['name'] == 'Run actions/upload-artifact@v4']
        assert len(uploads) == 2 and uploads[0]['number'] < uploads[1]['number']
        assert uploads[0]['status'] == 'completed' and uploads[0]['conclusion'] == 'success'
        builds.append({'game': game, 'jobId': origin.positive(job['id']), 'uploadStep': uploads[0]['number']})
    return {**identity, 'buildJobs': builds}


def archive_inventory(archive, games):
    """No traversal, symlinks, directories, duplicate/case aliases or extra files."""
    with zipfile.ZipFile(archive) as zipped:
        members = zipped.infolist()
        assert 0 < len(members) <= 700
        names = [safe_name(i.filename) for i in members]
        assert len(names) == len(set(n.casefold() for n in names))
        assert sum(i.file_size for i in members) <= MAX_UNPACKED
        grouped = {}
        for info in members:
            assert not info.is_dir() and stat.S_IFMT(info.external_attr >> 16) in (0, stat.S_IFREG)
            assert 0 < info.file_size < 128_000_000 and not info.flag_bits & 1
            parts = info.filename.split('/')
            assert len(parts) == 3 and parts[0] in ('packages', 'observers')
            game = parts[1]; assert re.fullmatch('[a-z][a-z0-9]*(?:-[a-z0-9]+)*', game)
            grouped.setdefault(game, set()).add(info.filename)
        assert set(games) <= set(grouped)
        for game, actual in grouped.items():
            required = {f'packages/{game}/{n}' for n in ('build-receipt.json', 'signing-receipt.json', 'SHA256SUMS.txt')}
            required |= {f'observers/{game}/{n}' for n in ('observer-build.json', 'observer-signing-receipt.json', 'observer-' + game + '.apk')}
            apk = [n for n in actual if re.fullmatch(r'packages/' + re.escape(game) + '/' + re.escape(game) + r'-[0-9]+(?:\.[0-9]+)*(?:[-+][A-Za-z0-9.-]+)?\.apk', n)]
            assert len(apk) == 1 and actual == required | set(apk), 'Unexpected signed artifact layout'
        assert zipped.testzip() is None
        return names


def extract_archive(archive, directory, games):
    names = archive_inventory(archive, games)
    directory.mkdir(parents=True, exist_ok=False)
    files = {}
    with zipfile.ZipFile(archive) as zipped:
        for name in names:
            target = directory / name; target.parent.mkdir(parents=True, exist_ok=True)
            with zipped.open(name) as source, target.open('xb') as dest: shutil.copyfileobj(source, dest, 1024 * 1024)
            files[name] = record(target)
    return files


def verify_local(directory, request, games, now=None):
    value = json.loads((directory / 'actions-artifact-origin.json').read_text())
    assert value['request'] == request
    identity = validate_origin(value, games, now=now)
    archive = directory.parent / 'artifact.zip'
    assert record(archive) == {'bytes': identity['artifactBytes'], 'sha256': identity['artifactSha256']}
    names = archive_inventory(archive, games)
    actual = {}
    for path in directory.rglob('*'):
        assert not path.is_symlink()
        if path.is_file() and path.name != 'actions-artifact-origin.json': actual[safe_name(path.relative_to(directory).as_posix())] = record(path)
    assert set(actual) == set(names) and actual == value['files']
    # Bind every extracted byte to the verified original ZIP, not a mutable hash list.
    with zipfile.ZipFile(archive) as zipped:
        for name, entry in actual.items():
            data = zipped.read(name)
            assert entry == {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    return value


def inspect(client, request, games):
    base = '/repos/' + origin.REPO
    run = client.get(f"{base}/actions/runs/{request['run']}/attempts/{request['attempt']}")
    value = {'schemaVersion': 1, 'kind': 'github-actions-signed-artifact', 'request': request,
             'run': run, 'artifact': client.get(f"{base}/actions/artifacts/{request['artifact']}"),
             'jobs': client.pages(f"{base}/actions/runs/{request['run']}/attempts/{request['attempt']}/jobs", 'jobs'),
             'runArtifacts': client.pages(f"{base}/actions/runs/{request['run']}/artifacts", 'artifacts')}
    identity = validate_origin(value, games)
    return value, identity


def fetch(client, request, games, output):
    assert not output.exists()
    output.mkdir(parents=True)
    value, identity = inspect(client, request, games)
    archive = output / 'artifact.zip'
    size, digest = client.download(request['artifact'], archive, identity['artifactBytes'])
    assert size == identity['artifactBytes'] and digest == identity['artifactSha256'], 'Original artifact ZIP digest mismatch'
    value['files'] = extract_archive(archive, output / 'artifact', games)
    assert client.get(f"/repos/{origin.REPO}/actions/artifacts/{request['artifact']}") == value['artifact'], 'Artifact metadata changed during download'
    value['verifiedAt'] = dt.datetime.now(dt.timezone.utc).isoformat()
    value['producerVerification'] = identity
    (output / 'artifact/actions-artifact-origin.json').write_text(json.dumps(value, indent=2) + '\n')
    verify_local(output / 'artifact', request, games)
    return identity


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', required=True, type=int); parser.add_argument('--attempt', required=True, type=int)
    parser.add_argument('--source', required=True); parser.add_argument('--artifact', required=True, type=int)
    parser.add_argument('--games', required=True); parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--metadata-only', action='store_true')
    args = parser.parse_args()
    assert os.environ['GITHUB_REPOSITORY'] == origin.REPO
    client = origin.GitHub(os.environ['GH_TOKEN'])
    request = {k: getattr(args, k) for k in ('run', 'attempt', 'source', 'artifact')}
    games = args.games.split(',')
    if args.metadata_only:
        value, result = inspect(client, request, games)
        args.output.mkdir(parents=True, exist_ok=False)
        (args.output / 'actions-artifact-origin.json').write_text(json.dumps(value, indent=2) + '\n')
    else:
        result = fetch(client, request, games, args.output)
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    try: main()
    except Exception as error:
        # urllib errors may contain temporary signed blob URLs; never log them.
        code = str(error) if isinstance(error, origin.Rejected) and re.fullmatch('[a-z_]+', str(error)) else type(error).__name__
        print('Original signed artifact verification failed: ' + code)
        raise SystemExit(1)
