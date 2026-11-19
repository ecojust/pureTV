#!/usr/bin/env python3
"""Copy one immutable Actions ZIP to an existing draft. Never creates/publishes releases."""
import argparse
import base64
import datetime as dt
import hashlib
import http.client
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

REPO = 'ecojust/pureTV'
API = 'https://api.github.com'
MAX_BYTES = 1_000_000_000
MAX_JSON = 2_000_000
MACOS_WORKFLOW = '.github/workflows/joystick-catalog-macos.yml'
REGISTRY_PATH = 'joystick-games/catalog-registry.json'
UPLOAD_END_TOLERANCE_SECONDS = 2
WORKFLOWS = {
    '.github/workflows/joystick-catalog-android.yml': [
        (r'joystick-android-signed', lambda m: ('sign', 0)),
        (r'joystick-android-unsigned-([a-z0-9]+(?:-[a-z0-9]+)*)', lambda m: (f'build ({m[1]})', 0))],
    MACOS_WORKFLOW: [
        (r'joystick-catalog-macos-packages-([a-z0-9]+(?:-[a-z0-9]+)*)', lambda m: (m[1], 1))],
    '.github/workflows/joystick-catalog-windows.yml': [
        (r'joystick-windows-packages-([a-z0-9]+(?:-[a-z0-9]+)*)', lambda m: (f'verify ({m[1]})', 1))],
}

class Rejected(Exception):
    pass

def require(ok, code):
    if not ok:
        raise Rejected(code)

def positive(value):
    require(type(value) is int and 0 < value < 2**63, 'invalid_positive_id')
    return value

def stamp(value):
    try:
        parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
        require(parsed.tzinfo is not None, 'timestamp_timezone_missing')
        return parsed
    except (TypeError, ValueError, AttributeError):
        raise Rejected('invalid_timestamp') from None

def sha(value):
    require(isinstance(value, str) and re.fullmatch(r'sha256:[0-9a-f]{64}', value), 'missing_or_invalid_digest')
    return value[7:]

def source_registry(client, source):
    """Read data from the original immutable commit, never the exporter checkout."""
    require(isinstance(source, str) and re.fullmatch('[a-f0-9]{40}', source), 'invalid_source_sha')
    endpoint = f'/repos/{REPO}/contents/{REGISTRY_PATH}?ref={source}'
    item = client.get(endpoint)
    require(item.get('type') == 'file' and item.get('path') == REGISTRY_PATH and item.get('name') == 'catalog-registry.json', 'invalid_registry_file')
    require(item.get('url') == API + endpoint, 'registry_source_url_mismatch')
    blob = item.get('sha')
    require(isinstance(blob, str) and re.fullmatch('[a-f0-9]{40}', blob), 'invalid_registry_blob_sha')
    require(item.get('git_url') == f'{API}/repos/{REPO}/git/blobs/{blob}', 'registry_blob_url_mismatch')
    size = item.get('size')
    require(type(size) is int and 0 < size <= MAX_JSON, 'registry_size_out_of_bounds')
    require(item.get('encoding') == 'base64' and isinstance(item.get('content'), str), 'invalid_registry_encoding')
    raw = base64.b64decode(item['content'].replace('\n', ''), validate=True)
    require(len(raw) == size, 'registry_size_mismatch')
    require(hashlib.sha1(b'blob ' + str(size).encode('ascii') + b'\0' + raw).hexdigest() == blob, 'registry_blob_mismatch')
    def unique_object(pairs):
        obj = {}
        for key, value in pairs:
            require(key not in obj, 'registry_duplicate_json_key')
            obj[key] = value
        return obj
    registry = json.loads(raw.decode('utf-8'), object_pairs_hook=unique_object)
    require(isinstance(registry, dict) and type(registry.get('schemaVersion')) is int and registry['schemaVersion'] == 1 and isinstance(registry.get('games'), dict) and isinstance(registry.get('batches'), dict), 'invalid_registry_schema')
    evidence = {'sourceCommit': source, 'path': REGISTRY_PATH, 'bytes': size, 'sha256': hashlib.sha256(raw).hexdigest(), 'gitBlobSha': blob, 'apiPath': endpoint}
    return registry, evidence

def source_identity(run, artifact, jobs, request, now=None, registry_source=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    for number in (run['id'], run['run_attempt'], run['repository']['id'], run['head_repository']['id'], artifact['id']):
        positive(number)
    require(run['id'] == request['run'] and run['run_attempt'] == request['attempt'] and run['head_sha'] == request['source'], 'wrong_run_source_attempt')
    require(run['repository']['full_name'] == REPO and run['head_repository']['full_name'] == REPO, 'wrong_repository')
    require(run['repository']['id'] == run['head_repository']['id'], 'fork_repository')
    require(run['path'] in WORKFLOWS and run['event'] == 'workflow_dispatch', 'workflow_not_allowed')
    # The run may still be testing. Only the producing job/upload must be complete.
    require(run['status'] in ('in_progress', 'completed'), 'run_not_started')
    require(artifact['id'] == request['artifact'] and artifact['expired'] is False, 'wrong_or_expired_artifact')
    require(stamp(artifact['expires_at']) > now, 'artifact_expired')
    size = artifact['size_in_bytes']
    require(type(size) is int and 0 < size <= MAX_BYTES, 'artifact_size_out_of_bounds')
    digest = sha(artifact.get('digest'))
    link = artifact['workflow_run']
    for number in (link['id'], link['repository_id'], link['head_repository_id']):
        positive(number)
    require(link['id'] == request['run'] and link['head_sha'] == request['source'] and link['head_branch'] == run['head_branch'], 'artifact_run_mismatch')
    require(link['repository_id'] == link['head_repository_id'] == run['repository']['id'], 'artifact_repository_mismatch')
    names = [make(m) for pattern, make in WORKFLOWS[run['path']] if (m := re.fullmatch(pattern, artifact['name']))]
    require(len(names) == 1, 'artifact_name_not_allowed')
    producer_name, upload_index = names[0]
    matrix = None
    if run['path'] == MACOS_WORKFLOW:
        require(registry_source is not None, 'frozen_registry_required')
        registry, registry_evidence = registry_source
        require(registry_evidence['sourceCommit'] == request['source'], 'registry_source_mismatch')
        batch = producer_name
        games = registry['batches'].get(batch)
        require(isinstance(games, list) and bool(games), 'unknown_or_empty_registry_batch')
        require(all(isinstance(game, str) and re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', game) and isinstance(registry['games'].get(game), dict) for game in games), 'invalid_registry_batch_game')
        require(len(games) == len(set(games)), 'duplicate_registry_batch_game')
        # The frozen plan's include row is {'batch': batch, 'games': games}.
        # GitHub includes every ordered value in the automatic matrix job name.
        producer_name = 'build (' + ', '.join([batch, *games]) + ')'
        matrix = {'batch': batch, 'games': list(games), 'registry': registry_evidence}
    matches = [j for j in jobs if j['name'] == producer_name]
    require(len(matches) == 1, 'producer_job_not_unique')
    job = matches[0]
    for number in (job['id'], job['run_id'], job['run_attempt']):
        positive(number)
    require(job['run_id'] == request['run'] and job['run_attempt'] == request['attempt'] and job['head_sha'] == request['source'], 'producer_identity_mismatch')
    require(job['status'] == 'completed', 'producer_not_completed')
    created = stamp(artifact['created_at'])
    require(stamp(job['started_at']) <= created <= stamp(job['completed_at']), 'artifact_outside_attempt_job')
    # Exact whitelisted workflow layout: Android package then report; Mac/Windows report then package.
    all_uploads = [s for s in job['steps'] if s['name'] == 'Run actions/upload-artifact@v4']
    require(len(all_uploads) == 2 and all_uploads[0]['number'] < all_uploads[1]['number'], 'producer_upload_layout_changed')
    selected = all_uploads[upload_index]
    upload_start = stamp(selected['started_at'])
    upload_end = stamp(selected['completed_at'])
    offset = (created - upload_end).total_seconds()
    # GitHub records artifact registration and step timestamps separately.
    # Run 44602407034/artifact 14568572279 records creation one second after the
    # successful upload step. Keep the start and containing job bounds exact.
    require(selected['status'] == 'completed' and selected['conclusion'] == 'success' and upload_start <= upload_end and upload_start <= created <= upload_end + dt.timedelta(seconds=UPLOAD_END_TOLERANCE_SECONDS), 'artifact_outside_successful_upload')
    uploads = [selected]
    identity = {'workflow': run['path'], 'runStatus': run['status'], 'runConclusion': run.get('conclusion'), 'jobId': positive(job['id']), 'jobName': job['name'], 'jobConclusion': job.get('conclusion'), 'uploadStepNumbers': [s['number'] for s in uploads], 'artifactName': artifact['name'], 'artifactBytes': size, 'artifactSha256': digest}
    identity['uploadTimestampBinding'] = {'artifactCreatedAt': artifact['created_at'], 'stepStartedAt': selected['started_at'], 'stepCompletedAt': selected['completed_at'], 'offsetSeconds': offset, 'maxEndOffsetSeconds': UPLOAD_END_TOLERANCE_SECONDS, 'startToleranceSeconds': 0, 'jobBoundsStrict': True, 'toleranceApplied': offset > 0, 'toleranceBasis': 'Independent GitHub artifact registration and step timestamps; a one-second offset was observed in original run 44602407034 / artifact 14568572279.'}
    if matrix is not None:
        identity['producerMatrix'] = matrix
    return identity

def draft_identity(release, request):
    positive(release['id'])
    tag = f"racing-package-staging-{request['run']}-attempt-{request['attempt']}"
    require(release['id'] == request['release'] and release['draft'] is True, 'release_not_matching_draft')
    require(release['tag_name'] == tag and release['target_commitish'] == request['source'], 'release_tag_or_source_mismatch')
    require(release['url'] == f"{API}/repos/{REPO}/releases/{request['release']}", 'release_repository_mismatch')
    require(release['upload_url'] == f"https://uploads.github.com/repos/{REPO}/releases/{request['release']}/assets{{?name,label}}", 'release_upload_origin_mismatch')
    return {'id': release['id'], 'tag': tag, 'targetCommitish': request['source'], 'draft': True}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

class GitHub:
    def __init__(self, token):
        require(bool(token), 'missing_token')
        self.token = token
        self.opener = urllib.request.build_opener(NoRedirect())

    def headers(self):
        return {'Authorization': 'Bearer ' + self.token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'pureTV-artifact-draft-transfer'}

    def get(self, path):
        require(path.startswith(f'/repos/{REPO}/') and not any(c in path for c in ('\n', '\r', '#')), 'invalid_api_path')
        with self.opener.open(urllib.request.Request(API + path, headers=self.headers()), timeout=30) as response:
            data = response.read(MAX_JSON + 1)
            require(len(data) <= MAX_JSON, 'api_response_too_large')
            return json.loads(data)

    def pages(self, path, field=None):
        result = []
        for page in range(1, 6):
            payload = self.get(path + ('&' if '?' in path else '?') + f'per_page=100&page={page}')
            items = payload[field] if field else payload
            require(isinstance(items, list), 'invalid_api_list')
            result.extend(items)
            if len(items) < 100:
                if field:
                    require(payload['total_count'] == len(result), 'incomplete_api_list')
                return result
        raise Rejected('api_pagination_limit')

    def download(self, artifact_id, destination, expected_size):
        url = f'{API}/repos/{REPO}/actions/artifacts/{artifact_id}/zip'
        auth = True
        deadline = time.monotonic() + 900
        for _ in range(4):
            try:
                response = self.opener.open(urllib.request.Request(url, headers=self.headers() if auth else {'User-Agent': 'pureTV-artifact-draft-transfer'}), timeout=30)
            except urllib.error.HTTPError as error:
                if error.code not in (301, 302, 303, 307, 308):
                    raise
                target = urllib.parse.urlsplit(error.headers.get('Location', ''))
                require(target.scheme == 'https' and not target.username and not target.password and target.port in (None, 443) and not target.fragment, 'unsafe_download_redirect')
                require(bool(target.hostname) and (target.hostname.endswith('.blob.core.windows.net') or target.hostname.endswith('.actions.githubusercontent.com')), 'download_redirect_host_not_allowed')
                url = urllib.parse.urlunsplit(target)
                auth = False  # Never forward the GitHub token to signed blob storage.
                continue
            with response, destination.open('xb') as output:
                size = 0
                digest = hashlib.sha256()
                while block := response.read(1024 * 1024):
                    require(time.monotonic() <= deadline, 'download_deadline')
                    size += len(block)
                    require(size <= expected_size <= MAX_BYTES, 'download_exceeds_bound')
                    digest.update(block)
                    output.write(block)
                require(size == expected_size, 'download_size_mismatch')
                return size, digest.hexdigest()
        raise Rejected('download_redirect_limit')

    def upload(self, release_id, name, path, size):
        # The only HTTP mutation in this tool: one asset upload, never retried.
        connection = http.client.HTTPSConnection('uploads.github.com', timeout=30)
        endpoint = f'/repos/{REPO}/releases/{release_id}/assets?name=' + urllib.parse.quote(name, safe='')
        deadline = time.monotonic() + 900
        try:
            connection.putrequest('POST', endpoint)
            for key, value in {**self.headers(), 'Content-Type': 'application/zip', 'Content-Length': str(size)}.items():
                connection.putheader(key, value)
            connection.endheaders()
            with path.open('rb') as source:
                sent = 0
                while block := source.read(1024 * 1024):
                    require(time.monotonic() <= deadline, 'upload_deadline')
                    sent += len(block)
                    require(sent <= size, 'upload_file_changed')
                    connection.send(block)
            require(sent == size, 'upload_file_changed')
            response = connection.getresponse()
            require(response.status == 201, 'asset_upload_rejected')
            data = response.read(MAX_JSON + 1)
            require(len(data) <= MAX_JSON, 'upload_response_too_large')
            return json.loads(data)
        finally:
            connection.close()

def execute(client, request, output):
    receipts = output / 'receipts'
    receipts.mkdir(parents=True, exist_ok=False)
    downloads = output / 'download'
    downloads.mkdir()
    report = {'executedScriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'schemaVersion': 1, 'repository': REPO, 'status': 'running', 'phase': 'validate-inputs', 'packageSignatureOrGameplayVerified': False, 'releaseCreatedOrPublished': False}
    def save():
        (receipts / 'transfer.json').write_text(json.dumps(report, indent=2) + '\n')
    save()
    try:
        require(set(request) == {'run', 'attempt', 'source', 'artifact', 'release'}, 'invalid_input_fields')
        for key in ('run', 'attempt', 'artifact', 'release'):
            positive(request[key])
        require(isinstance(request['source'], str) and re.fullmatch('[a-f0-9]{40}', request['source']), 'invalid_source_sha')
        report['request'] = request.copy()
        base = f'/repos/{REPO}'
        run = client.get(f"{base}/actions/runs/{request['run']}/attempts/{request['attempt']}")
        artifact = client.get(f"{base}/actions/artifacts/{request['artifact']}")
        jobs = client.pages(f"{base}/actions/runs/{request['run']}/attempts/{request['attempt']}/jobs", 'jobs')
        registry_source = source_registry(client, request['source']) if run.get('path') == MACOS_WORKFLOW else None
        info = source_identity(run, artifact, jobs, request, registry_source=registry_source)
        # Direct artifact metadata plus membership in the exact original run.
        listed = client.pages(f"{base}/actions/runs/{request['run']}/artifacts", 'artifacts')
        matches = [a for a in listed if a['id'] == request['artifact']]
        require(len(matches) == 1 and all(matches[0].get(k) == artifact.get(k) for k in ('name', 'digest', 'size_in_bytes', 'created_at', 'workflow_run', 'expired')), 'artifact_run_list_mismatch')
        release_path = f"{base}/releases/{request['release']}"
        report['source'] = info
        report['release'] = draft_identity(client.get(release_path), request)
        name = f"artifact-{request['artifact']}.zip"
        require(not any(a['name'] == name for a in client.pages(release_path + '/assets')), 'asset_name_already_exists')
        report['phase'] = 'download-original-zip'
        save()
        archive = downloads / name
        size, digest = client.download(request['artifact'], archive, info['artifactBytes'])
        require(size == info['artifactBytes'] and digest == info['artifactSha256'], 'original_zip_digest_mismatch')
        report['zip'] = {'name': name, 'bytes': size, 'sha256': digest, 'repacked': False}
        # Recheck immutable source and draft state immediately before the single upload.
        fresh = client.get(f"{base}/actions/artifacts/{request['artifact']}")
        require(fresh == artifact, 'artifact_metadata_changed')
        draft_identity(client.get(release_path), request)
        require(not any(a['name'] == name for a in client.pages(release_path + '/assets')), 'asset_name_already_exists')
        report['phase'] = 'upload-original-zip'
        report['uploadAttempted'] = True
        save()
        uploaded = client.upload(request['release'], name, archive, size)
        asset_id = positive(uploaded['id'])
        report['assetId'] = asset_id
        save()
        asset = client.get(f'{base}/releases/assets/{asset_id}')
        require(asset['id'] == asset_id and asset['name'] == name and asset['state'] == 'uploaded' and asset['size'] == size and sha(asset.get('digest')) == digest, 'uploaded_asset_identity_mismatch')
        require(any(a['id'] == asset_id and a['name'] == name for a in client.pages(release_path + '/assets')), 'uploaded_asset_not_in_release')
        draft_identity(client.get(release_path), request)
        report.update(status='passed', phase='verified-byte-transfer', asset={'id': asset_id, 'name': name, 'bytes': size, 'sha256': digest})
        save()
        return True
    except Exception as error:
        # Never serialize exception text: it can contain a signed URL or token.
        report.update(status='failed', failureCode=str(error) if isinstance(error, Rejected) else type(error).__name__)
        save()
        return False

def export_receipt(directory):
    require(os.environ.get('GITHUB_REPOSITORY') == REPO, 'wrong_executor_repository')
    run, attempt = os.environ.get('GITHUB_RUN_ID', ''), os.environ.get('GITHUB_RUN_ATTEMPT', '')
    require(re.fullmatch('[1-9][0-9]*', run or '') and re.fullmatch('[1-9][0-9]*', attempt or ''), 'invalid_executor_identity')
    require(sorted(p.name for p in directory.iterdir()) == ['transfer.json'], 'receipt_directory_not_isolated')
    source = directory / 'transfer.json'
    require(source.is_file() and not source.is_symlink() and source.stat().st_size < 128_000, 'invalid_receipt_file')
    record = json.loads(source.read_text())
    require(record['repository'] == REPO and record['status'] in ('passed', 'failed', 'running'), 'invalid_receipt')
    branch = f'build-assets/artifact-draft-transfer-{run}-attempt-{attempt}'
    remote = 'https://github.com/' + REPO + '.git'
    def cmd(args, **kwargs):
        return subprocess.run(args, check=True, timeout=120, capture_output=True, **kwargs)
    cmd(['gh', 'auth', 'setup-git'])
    require(not cmd(['git', 'ls-remote', '--heads', remote, 'refs/heads/' + branch]).stdout.strip(), 'receipt_branch_already_exists')
    prefix = ['git', '-C', str(directory)]
    for args in [['init', '--initial-branch', branch], ['config', 'user.name', 'github-actions[bot]'], ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], ['add', '--', 'transfer.json'], ['commit', '-m', 'Preserve original artifact draft-transfer receipt [skip ci]'], ['remote', 'add', 'origin', remote], ['push', '--force-with-lease=refs/heads/' + branch + ':', 'origin', 'HEAD:refs/heads/' + branch]]:
        cmd(prefix + args)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    transfer = commands.add_parser('transfer')
    for name in ('run', 'attempt', 'artifact', 'release'):
        transfer.add_argument('--' + name, type=int, required=True)
    transfer.add_argument('--source', required=True)
    transfer.add_argument('--output', type=Path, required=True)
    export = commands.add_parser('export-receipt')
    export.add_argument('--directory', type=Path, required=True)
    args = parser.parse_args()
    try:
        require(os.environ.get('GITHUB_REPOSITORY') == REPO, 'wrong_executor_repository')
        if args.command == 'export-receipt':
            export_receipt(args.directory)
            return 0
        request = {k: getattr(args, k) for k in ('run', 'attempt', 'source', 'artifact', 'release')}
        passed = execute(GitHub(os.environ.get('GH_TOKEN')), request, args.output)
        print('Byte transfer passed; package verification is separate.' if passed else 'Byte transfer failed; preserved receipt contains the phase and safe failure code.')
        return 0 if passed else 1
    except Exception as error:
        print('Transfer command failed: ' + (str(error) if isinstance(error, Rejected) else type(error).__name__), file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())
