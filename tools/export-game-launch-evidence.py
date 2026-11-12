#!/usr/bin/env python3
"""Export one completed launch-probe run into a new isolated Git ref.

Downloaded files are treated only as data. No package is run, rebuilt, or signed.
The exporter only creates blobs, a root commit and a previously absent ref.
"""
import argparse
import base64
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
import zipfile

REPOSITORY = 'ecojust/pureTV'
WORKFLOW = '.github/workflows/game-apk-launch-probe.yml'
SOURCE_BRANCH = 'fix/neon-rush-launch'
ARTIFACT = 'game-apk-launch-api36-x86_64'
MAX_FILES = 512
MAX_FILE_BYTES = 32_000_000
MAX_EXPANDED_BYTES = 128_000_000
MAX_ARTIFACT_ZIP = 64_000_000
MAX_LOG_ZIP = 32_000_000


def require(value, message):
    if not value:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Api:
    def __init__(self, token):
        require(bool(token), 'GitHub token is required')
        self.token = token
        self.opener = urllib.request.build_opener(NoRedirect())

    def request(self, method, path, payload=None):
        return urllib.request.Request('https://api.github.com/repos/' + REPOSITORY + '/' + path,
            data=None if payload is None else json.dumps(payload).encode(), method=method,
            headers={'Authorization': 'Bearer ' + self.token, 'Accept': 'application/vnd.github+json',
                     'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json'})

    def __call__(self, method, path, payload=None, missing=False):
        require(method in ('GET', 'POST'), 'Existing refs must never be modified')
        try:
            with self.opener.open(self.request(method, path, payload), timeout=45) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if missing and error.code == 404:
                return None
            raise RuntimeError('GitHub API HTTP ' + str(error.code)) from None

    def logs(self, run_id):
        # The signed storage URL receives no GitHub Authorization header.
        try:
            with self.opener.open(self.request('GET', 'actions/runs/' + run_id + '/logs'), timeout=45) as response:
                data = response.read(MAX_LOG_ZIP + 1)
        except urllib.error.HTTPError as error:
            require(error.code in (301, 302, 303, 307, 308), 'Workflow logs endpoint HTTP ' + str(error.code))
            location = error.headers.get('Location', '')
            parsed = urllib.parse.urlsplit(location)
            hostname = parsed.hostname or ''
            require(parsed.scheme == 'https' and not parsed.username and not parsed.password and
                    (hostname.endswith('.blob.core.windows.net') or hostname.endswith('.actions.githubusercontent.com')
                     or hostname.endswith('.githubusercontent.com')), 'Unexpected logs storage URL')
            with self.opener.open(urllib.request.Request(location), timeout=90) as response:
                data = response.read(MAX_LOG_ZIP + 1)
        require(0 < len(data) <= MAX_LOG_ZIP, 'Workflow logs ZIP exceeds size limit')
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            infos = archive.infolist()
            require(len(infos) <= 4096 and sum(x.file_size for x in infos) <= MAX_EXPANDED_BYTES, 'Workflow logs expansion exceeds limits')
            for item in infos:
                p = PurePosixPath(item.filename)
                require(not p.is_absolute() and '..' not in p.parts and '\\' not in item.filename, 'Invalid workflow log ZIP path')
        return data


def validate_run(api, run_id):
    require(re.fullmatch(r'[1-9][0-9]{0,19}', run_id), 'Numeric evidence run ID required')
    run = api('GET', 'actions/runs/' + run_id)
    require(run.get('repository', {}).get('full_name') == REPOSITORY and
            run.get('head_repository', {}).get('full_name') == REPOSITORY, 'Evidence run must belong to this repository')
    require(run.get('path') == WORKFLOW and run.get('head_branch') == SOURCE_BRANCH and
            run.get('event') in ('push', 'workflow_dispatch'), 'Evidence run must use the launch workflow and source branch')
    require(run.get('status') == 'completed', 'Wait until the original evidence run is completed; do not rerun it')
    require(re.fullmatch(r'[a-f0-9]{40}', run.get('head_sha', '')), 'Missing exact source SHA')
    artifacts = api('GET', 'actions/runs/' + run_id + '/artifacts?per_page=100')
    require(artifacts.get('total_count', 0) <= 100, 'Too many run artifacts')
    matches = [item for item in artifacts.get('artifacts', []) if item.get('name') == ARTIFACT]
    require(len(matches) <= 1, 'Ambiguous evidence artifact')
    artifact = matches[0] if matches else None
    if artifact:
        require(type(artifact.get('id')) is int and artifact['id'] > 0, 'Invalid artifact ID')
        require(0 < artifact.get('size_in_bytes', 0) <= MAX_ARTIFACT_ZIP, 'Artifact ZIP size exceeds limit')
        binding = artifact.get('workflow_run', {})
        require(binding.get('id') == int(run_id) and binding.get('head_sha') == run['head_sha'], 'Artifact is not bound to the exact evidence run')
    return {'runId': run_id, 'workflow': WORKFLOW, 'sourceBranch': SOURCE_BRANCH,
            'sourceSha': run['head_sha'], 'conclusion': run.get('conclusion'), 'status': run['status'],
            'url': run.get('html_url'), 'artifact': None if artifact is None else
            {key: artifact.get(key) for key in ('id', 'name', 'size_in_bytes', 'expired', 'digest')}}


def zip_downloaded_artifact(folder):
    require(folder.is_dir() and not folder.is_symlink(), 'Artifact must be a regular directory')
    records, files, total = [], [], 0
    for file in sorted(folder.rglob('*')):
        require(not file.is_symlink(), 'Artifact symlinks are forbidden')
        if file.is_dir():
            continue
        require(file.is_file(), 'Artifact entries must be regular files')
        name = file.relative_to(folder).as_posix()
        require(re.fullmatch(r'[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*', name) and
                not any(p in ('.', '..') for p in PurePosixPath(name).parts), 'Unexpected artifact path')
        size = file.stat().st_size
        total += size
        require(size <= MAX_FILE_BYTES and total <= MAX_EXPANDED_BYTES and len(files) < MAX_FILES, 'Artifact files exceed limits')
        data = file.read_bytes()
        require(len(data) == size, 'Artifact file changed while reading')
        files.append((name, data))
        records.append({'path': name, 'bytes': len(data), 'sha256': sha(data)})
    require(files, 'Downloaded artifact is empty')
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for name, data in files:
            info = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, data)
    raw = output.getvalue()
    require(len(raw) <= MAX_ARTIFACT_ZIP, 'Repacked evidence ZIP exceeds limit')
    return raw, records


def create_branch(api, run_id, files):
    branch = 'build-assets/game-launch-evidence-' + run_id
    require(set(files).issubset({'probe-artifact.zip', 'workflow-logs.zip', 'export.json'}) and 'export.json' in files, 'Unexpected export file set')
    require(len(files) <= 3 and sum(len(data) for data in files.values()) <= 96_500_000, 'Export size limit exceeded')
    require(api('GET', 'git/ref/heads/' + branch, missing=True) is None, 'Evidence ref already exists; never update it')
    entries = []
    for name, raw in sorted(files.items()):
        blob = api('POST', 'git/blobs', {'content': base64.b64encode(raw).decode(), 'encoding': 'base64'})
        require(re.fullmatch(r'[a-f0-9]{40}', blob.get('sha', '')), 'Invalid blob response')
        entries.append({'path': name, 'mode': '100644', 'type': 'blob', 'sha': blob['sha']})
    tree = api('POST', 'git/trees', {'tree': entries})
    require(re.fullmatch(r'[a-f0-9]{40}', tree.get('sha', '')), 'Invalid tree response')
    commit = api('POST', 'git/commits', {'message': 'Export unchanged APK launch evidence from run ' + run_id, 'tree': tree['sha'], 'parents': []})
    require(re.fullmatch(r'[a-f0-9]{40}', commit.get('sha', '')), 'Invalid commit response')
    result = api('POST', 'git/refs', {'ref': 'refs/heads/' + branch, 'sha': commit['sha']})
    require(result.get('ref') == 'refs/heads/' + branch and result.get('object', {}).get('sha') == commit['sha'], 'Ref creation response mismatch')
    return {'branch': branch, 'commit': commit['sha'], 'files': {name: {'bytes': len(data), 'sha256': sha(data)} for name, data in files.items()}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--evidence-run-id', required=True)
    parser.add_argument('--artifact', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--prepare-only', action='store_true')
    args = parser.parse_args()
    require(os.environ.get('GITHUB_REPOSITORY') == REPOSITORY, 'Restricted to ecojust/pureTV')
    require(os.environ.get('GITHUB_REF') == 'refs/heads/' + SOURCE_BRANCH, 'Exporter must run on the diagnostic source branch')
    require(args.evidence_run_id != os.environ.get('GITHUB_RUN_ID'), 'Cannot export the currently running export job')
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=Path(__file__).resolve().parents[1], text=True).strip()
    require(head == os.environ.get('GITHUB_SHA'), 'Exporter must be the workflow checkout')
    api = Api(os.environ.get('GH_TOKEN'))
    run = validate_run(api, args.evidence_run_id)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output/'run-metadata.json').write_text(json.dumps(run, indent=2)+'\n')
    downloadable = run['artifact'] is not None and not run['artifact']['expired']
    if args.prepare_only:
        with Path(os.environ['GITHUB_OUTPUT']).open('a') as output:
            output.write('artifact_present='+str(downloadable).lower()+'\n')
            output.write('artifact_id='+(str(run['artifact']['id']) if downloadable else '')+'\n')
        print(json.dumps({'validatedRun': run['runId'], 'sourceSha': run['sourceSha'], 'artifactPresent': downloadable}))
        return
    report = {'schema': 1, 'evidenceRun': run, 'exportRunId': os.environ['GITHUB_RUN_ID'],
              'exporterSourceSha': head, 'artifactDownloadOutcome': os.environ.get('ARTIFACT_DOWNLOAD_OUTCOME', 'skipped'),
              'artifactContentsUnmodified': False, 'artifactContainerRepacked': False,
              'note': 'Only archive contents are copied; no downloaded code is executed. Missing artifacts/logs are recorded, not replaced with invented evidence.'}
    files = {}
    if downloadable and report['artifactDownloadOutcome'] == 'success':
        raw, records = zip_downloaded_artifact(args.artifact)
        files['probe-artifact.zip'] = raw
        report.update(artifactContentsUnmodified=True, artifactContainerRepacked=True, artifactFiles=records)
    else:
        report['artifactMissingReason'] = 'not-present-or-expired' if not downloadable else 'download-action-failed'
    try:
        files['workflow-logs.zip'] = api.logs(args.evidence_run_id)
        report['logsDownload'] = {'status': 'downloaded', 'originalArchiveBytesPreserved': True}
    except Exception as error:
        # Exception messages may include a signed storage URL. Do not print them.
        report['logsDownload'] = {'status': 'unavailable', 'errorType': type(error).__name__}
    report['files'] = {name: {'bytes': len(raw), 'sha256': sha(raw)} for name, raw in files.items()}
    raw_report = (json.dumps(report, ensure_ascii=False, indent=2)+'\n').encode()
    require(len(raw_report) <= 500_000, 'Export metadata exceeds limit')
    files['export.json'] = raw_report
    for name, raw in files.items():
        (args.output/name).write_bytes(raw)
    result = create_branch(api, args.evidence_run_id, files)
    print(json.dumps(result))
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with Path(os.environ['GITHUB_STEP_SUMMARY']).open('a') as summary:
            summary.write('### Existing run evidence export\n```json\n'+json.dumps(result, indent=2)+'\n```\n')


if __name__ == '__main__':
    main()
