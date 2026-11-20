#!/usr/bin/env python3
"""Prepare small same-run graphics evidence for an immutable Git branch; never export APKs."""
import argparse
import datetime as dt
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec); spec.loader.exec_module(value)
    return value
origin = module('graphics_export_origin', Path(__file__).with_name('artifact-draft-transfer.py'))
signer = module('graphics_export_signer', Path(__file__).with_name('backroad-graphics-observer-sign.py'))
REPO = 'ecojust/pureTV'
WORKFLOW = '.github/workflows/joystick-backroad-graphics-diagnostic.yml'
ARTIFACTS = {
    'backroad-graphics-test-observer-build-evidence': ('observer', 'Preserve test Observer build evidence'),
    'backroad-original-apk-graphics-diagnostic': ('diagnostic', 'Preserve one diagnostic attempt evidence')}
MAX_FILE = 16 * 1024 * 1024
MAX_TOTAL = 64 * 1024 * 1024
MAX_ZIP = 32 * 1024 * 1024
MAX_FILES = 256
BUILD_FILES = {'original-producer/actions-artifact-origin.json', 'sign-boundaries.log', 'export-boundaries.log', 'graphics-boundaries.log',
               'observer-build.log', 'observer-sign.log', 'java-events.log', 'java-headers.log', 'driver-boundaries.log',
               'observer-unsigned/observer-build.json'}
RUNTIME_FILES = {'original-input-verification.log', 'original-input/input-verification.json',
                 'original-signed/artifact/actions-artifact-origin.json', 'observer-verification.log',
                 *{'observer-signed/' + n for n in (signer.BUILD, signer.RECEIPT, signer.ORIGIN)},
                 *{'original-public-receipts/' + n for n in ('target-signing.json', 'target-build.json', 'old-observer-signing.json', 'old-observer-build.json')}}
DIAGNOSTIC_FILES = {'report.json', 'adb-commands.jsonl', 'observer-http.jsonl', 'instrumentation.log', 'wire.jsonl',
                    'original-qa-plan.json', 'final-status.json', 'final-console.json', 'final-graphics.json', 'final-capabilities.json',
                    'final-system-screen.png', 'final-logcat.txt', 'final-window.txt', 'final-gfxinfo.txt'}
DIAGNOSTIC_FILES |= {label + suffix for label in ('initial-menu', 'original-low-settings', 'original-stage-running')
                    for suffix in ('.png', '-graphics-before.json', '-graphics-after.json', '-console.json', '-status.json', '-capabilities.json')}
DIAGNOSTIC_FILES |= {'install-failure/' + n for n in ('foreground.txt', 'windows.txt', 'installer-sessions.txt',
                    'screen.png', 'ui-dump-command.txt', 'ui.xml', 'executed-install_failure.py', 'report.json')}
SOURCE_FILES = {
    'puretv-joystick/joystick_sdk.py', 'joystick-games/qa/android/run.py',
    'joystick-games/qa/android/install_failure.py', 'joystick-games/qa/android/install_confirmation.py',
    'joystick-games/tools/android-build.py', 'joystick-games/tools/asset-policy.py',
    'joystick-games/catalog-registry.json', 'joystick-games/tools/qa-plan.py',
    'joystick-games/tools/android-runtime-inputs.py', 'joystick-games/tools/android-runtime-artifact.py',
    'joystick-games/tools/artifact-draft-transfer.py', 'joystick-games/tools/backroad-graphics-observer-sign.py',
    'tools/resource_catalog.py', 'tools/puretv-release-certificate-v2.sha256', WORKFLOW,
    *signer.SOURCE_NAMES, signer.HERE + 'run.py', signer.HERE + 'tests/test_driver.py',
    signer.HERE + 'tests/BoundedEventsTest.java', signer.HERE + 'tests/HeaderBudgetTest.java',
    signer.HERE + 'tests/graphics.test.cjs'}
RUNTIME_FILES |= {'graphics-diagnostic/' + name for name in DIAGNOSTIC_FILES}
RUNTIME_FILES |= {'graphics-diagnostic/executed-source/' + name for name in SOURCE_FILES}


def require(value, code):
    origin.require(value, code)


def sha(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def safe_name(name):
    path = PurePosixPath(name)
    require(isinstance(name, str) and name and name.isascii() and
            not any(ord(c) < 32 for c in name) and '\\' not in name and
            not path.is_absolute() and path.as_posix() == name and not set(path.parts) & {'.', '..', '.git'}, 'unsafe_path')
    return name


def validate_run(run, request):
    require(run['id'] == request['run'] and run['run_attempt'] == request['attempt'] and
            run['head_sha'] == request['source'] and run['path'] == WORKFLOW and
            run['event'] == 'workflow_dispatch' and run['status'] in ('in_progress', 'completed'), 'run_identity')
    require(run['repository']['full_name'] == run['head_repository']['full_name'] == REPO and
            run['repository']['id'] == run['head_repository']['id'], 'run_repository')
    origin.positive(run['repository']['id'])


def producer_job(jobs, name, request):
    found = [job for job in jobs if job['name'] == name]
    require(len(found) == 1, 'unique_producer')
    job = found[0]
    require(job['run_id'] == request['run'] and job['run_attempt'] == request['attempt'] and
            job['head_sha'] == request['source'] and job['status'] == 'completed' and
            job['conclusion'] in ('success', 'failure', 'cancelled', 'skipped', 'timed_out'), 'producer_identity')
    origin.positive(job['id'])
    return job


def validate_artifact(artifact, job, upload_name, run, request):
    origin.positive(artifact['id'])
    require(artifact['name'] in ARTIFACTS and artifact['expired'] is False and
            origin.stamp(artifact['expires_at']) > dt.datetime.now(dt.timezone.utc), 'artifact_identity')
    require(type(artifact['size_in_bytes']) is int and 0 < artifact['size_in_bytes'] <= MAX_ZIP, 'artifact_size')
    origin.sha(artifact['digest'])
    link = artifact['workflow_run']
    require(link['id'] == request['run'] and link['head_sha'] == request['source'] and
            link['head_branch'] == run['head_branch'] and
            link['repository_id'] == link['head_repository_id'] == run['repository']['id'], 'artifact_run')
    found = [s for s in job['steps'] if s['name'] == upload_name]
    require(len(found) == 1 and found[0]['status'] == 'completed' and found[0]['conclusion'] == 'success', 'upload_failed')
    step = found[0]; created = origin.stamp(artifact['created_at'])
    require(origin.stamp(job['started_at']) <= created <= origin.stamp(job['completed_at']), 'artifact_attempt_window')
    require(origin.stamp(step['started_at']) <= created <= origin.stamp(step['completed_at']) +
            dt.timedelta(seconds=origin.UPLOAD_END_TOLERANCE_SECONDS), 'artifact_upload_window')


def unpack(archive, artifact_name, destination, total_before=0):
    require(artifact_name in ARTIFACTS, 'artifact_name')
    allowed = BUILD_FILES if artifact_name == next(iter(ARTIFACTS)) else RUNTIME_FILES
    records = {}; total = total_before
    with zipfile.ZipFile(archive) as z:
        entries = z.infolist(); names = [e.filename for e in entries]
        require(len(entries) <= MAX_FILES and len(names) == len(set(names)), 'zip_file_count_or_duplicate')
        for entry in entries:
            name = safe_name(entry.filename.rstrip('/') if entry.is_dir() else entry.filename)
            require(stat.S_IFMT(entry.external_attr >> 16) != stat.S_IFLNK, 'zip_symlink')
            if entry.is_dir():
                require(any(p.startswith(name + '/') for p in allowed), 'unapproved_directory')
                continue
            require(name in allowed and 0 <= entry.file_size <= MAX_FILE, 'unapproved_file_or_size')
            total += entry.file_size; require(total <= MAX_TOTAL, 'total_budget')
            data = z.read(entry); require(len(data) == entry.file_size, 'zip_entry_size')
            target = destination / name
            require(not target.exists(), 'no_overwrite')
            target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
            records[name] = sha(data)
    return records, total


def execute(client, request, output, scratch):
    for key in ('run', 'attempt'): origin.positive(request[key])
    require(re.fullmatch('[a-f0-9]{40}', request['source']), 'source_sha')
    require(not output.exists() and not output.is_symlink(), 'new_output')
    base = '/repos/' + REPO
    run = client.get(f"{base}/actions/runs/{request['run']}"); validate_run(run, request)
    jobs = client.pages(f"{base}/actions/runs/{request['run']}/attempts/{request['attempt']}/jobs", 'jobs')
    artifacts = client.pages(f"{base}/actions/runs/{request['run']}/artifacts", 'artifacts')
    selected = []; missing = []; producer_results = {}
    for name, (job_name, upload_name) in ARTIFACTS.items():
        job = producer_job(jobs, job_name, request); producer_results[job_name] = job['conclusion']
        matches = [a for a in artifacts if a['name'] == name]
        if not matches:
            require(job['conclusion'] != 'success', 'successful_job_missing_evidence')
            missing.append({'artifactName': name, 'jobConclusion': job['conclusion']}); continue
        require(len(matches) == 1, 'unique_artifact')
        artifact = client.get(f"{base}/actions/artifacts/{matches[0]['id']}")
        require(artifact == matches[0], 'artifact_index_mismatch')
        validate_artifact(artifact, job, upload_name, run, request)
        selected.append((artifact, job))
    output.mkdir(parents=True); scratch.mkdir(parents=True, exist_ok=True)
    files = {}; archived = []; total = 0
    for artifact, job in selected:
        archive = scratch / (str(artifact['id']) + '.zip')
        size, digest = client.download(artifact['id'], archive, artifact['size_in_bytes'])
        require(size == artifact['size_in_bytes'] and digest == artifact['digest'][7:], 'zip_digest')
        require(client.get(f"{base}/actions/artifacts/{artifact['id']}") == artifact, 'artifact_changed')
        rows, total = unpack(archive, artifact['name'], output / 'evidence' / artifact['name'], total)
        files.update({'evidence/' + artifact['name'] + '/' + name: value for name, value in rows.items()})
        archived.append({'artifact': artifact, 'producerJob': job, 'files': rows})
    report = output / 'evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic/report.json'
    diagnostic_status = None
    if report.exists():
        value = json.loads(report.read_text(), object_pairs_hook=signer.unique)
        require(value.get('formalAcceptance') is False and value.get('game') == 'backroad-rally' and
                value.get('mode') == 'normal' and value.get('originalTarget') == signer.ORIGINAL, 'diagnostic_report_scope')
        # Early provenance failures may have no sourceCommit; preserve them as failures only.
        require(value.get('sourceCommit') == request['source'] or
                (value.get('status') == 'failed' and 'sourceCommit' not in value), 'diagnostic_report_source')
        diagnostic_status = value.get('status')
    sources = {WORKFLOW, 'joystick-games/tools/backroad-graphics-diagnostic-export.py',
               'joystick-games/tools/artifact-draft-transfer.py', signer.SELF}
    for name in sources:
        data = (ROOT / name).read_bytes()
        require(subprocess.check_output(['git', '-C', str(ROOT), 'show', request['source'] + ':' + name]) == data, 'export_source_uncommitted')
        path = output / 'export-source' / name; path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(data)
        files['export-source/' + name] = sha(data)
    manifest = {'schemaVersion': 1, 'scope': 'Original small graphics diagnostic evidence only',
                'repository': REPO, 'sourceSha': request['source'], 'runId': request['run'], 'runAttempt': request['attempt'],
                'workflow': WORKFLOW, 'runAtExport': run, 'producerResults': producer_results,
                'diagnosticStatus': diagnostic_status, 'formalAcceptance': False, 'visualAcceptance': False,
                'originalTarget': signer.ORIGINAL, 'artifacts': archived, 'missingArtifacts': missing,
                'files': dict(sorted(files.items())), 'originalPayloadBytes': total,
                'apkFilesExported': False, 'keysOrCredentialsExported': False}
    (output / 'export-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    try:
        require(os.environ.get('GITHUB_REPOSITORY') == REPO, 'repository')
        source = os.environ['GITHUB_SHA']
        require(subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], text=True).strip() == source, 'checkout_source')
        request = {'run': int(os.environ['GITHUB_RUN_ID']), 'attempt': int(os.environ['GITHUB_RUN_ATTEMPT']), 'source': source}
        require(not args.output.resolve().is_relative_to(ROOT.resolve()), 'external_output')
        with tempfile.TemporaryDirectory(prefix='backroad-graphics-evidence-') as scratch:
            manifest = execute(origin.GitHub(os.environ['GH_TOKEN']), request, args.output, Path(scratch))
        print(json.dumps({'files': len(manifest['files']), 'diagnosticStatus': manifest['diagnosticStatus'], 'formalAcceptance': False}))
    except Exception as error:
        code = str(error) if isinstance(error, origin.Rejected) and re.fullmatch('[a-z_]+', str(error)) else type(error).__name__
        print(json.dumps({'status': 'failed', 'error': code, 'formalAcceptance': False}))
        raise SystemExit(1)


if __name__ == '__main__': main()
