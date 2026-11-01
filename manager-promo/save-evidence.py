#!/usr/bin/env python3
"""Save explicitly approved public recording evidence to a new scratch branch.

Never writes master, the diagnostics branch, app profiles, logs, or credentials.
No force-push is supported. Authentication is passed through process environment,
not command arguments or logs. This is used only by the temporary recording job.
"""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
EVIDENCE = ROOT / 'manager-promo/evidence'
MAX_BYTES = 95_000_000
SEGMENT = r'(?:01-update-0419-to-050|02-forum-050)'
ALLOWED = [
    re.compile(r'[0-9]{3,}-[A-Za-z0-9.-]+\.png'),
    re.compile(r'[0-9]{3,}-[A-Za-z0-9.-]+-ocr\.json'),
    re.compile(r'(?:actions|result)\.json'),
    re.compile(r'window-(?:0\.4\.19|0\.5\.0)\.json'),
    re.compile(r'public-(?:repository|branch|tree|forum-list|forum-post-IKS14W|forum-replies-IKS14W)\.json'),
    re.compile(r'SHA256SUMS-(?:0\.4\.19|0\.5\.0)\.txt'),
    re.compile(r'display-configuration\.txt'),
    re.compile(r'video-probe-[0-9]+(?:-interrupted)?\.mov'),
    re.compile(r'video-probe-[0-9]+\.json'),
    re.compile(SEGMENT + r'\.mov'),
    re.compile(SEGMENT + r'-frames\.json'),
    re.compile(SEGMENT + r'-frames/[0-9]{5,}\.png'),
]


def git(*args, env=None, check=True):
    result = subprocess.run(['git', *args], cwd=ROOT, env=env,
                            text=True, capture_output=True)
    if check and result.returncode:
        # Git does not receive credential text in arguments. Do not echo the
        # environment, raw authentication configuration, or HTTP debug output.
        raise RuntimeError(f'Git {args[0]} failed with status {result.returncode}')
    return result


def main():
    run_id = os.environ['CAPTURE_SOURCE_RUN']
    attempt = os.environ['CAPTURE_SOURCE_ATTEMPT']
    source_sha = os.environ['CAPTURE_SOURCE_SHA']
    repository = os.environ['GITHUB_REPOSITORY']
    assert re.fullmatch(r'[0-9]+', run_id) and re.fullmatch(r'[1-9][0-9]*', attempt)
    assert re.fullmatch(r'[0-9a-f]{40}', source_sha)
    assert repository == 'ecojust/pureTV', 'This helper is scoped to this recording task'
    branch = f'recordings/manager-050-{run_id}-{attempt}'
    assert re.fullmatch(r'recordings/manager-050-[0-9]+-[1-9][0-9]*', branch)
    assert EVIDENCE.is_dir() and not EVIDENCE.is_symlink()
    git('diff', '--quiet')
    git('diff', '--cached', '--quiet')
    selected, rejected, manifest = [], [], []
    for path in sorted(EVIDENCE.rglob('*')):
        relative = path.relative_to(EVIDENCE).as_posix()
        if path.is_symlink():
            raise RuntimeError('Symlink in evidence directory is not permitted')
        if path.is_dir():
            continue
        if not path.is_file() or re.search(r'token|profile|session', relative, re.I) or not any(rule.fullmatch(relative) for rule in ALLOWED):
            rejected.append(relative)
            continue
        size = path.stat().st_size
        assert size < MAX_BYTES, f'Evidence file is not below 95 MB: {relative}'
        selected.append(path.relative_to(ROOT).as_posix())
        manifest.append({'file': relative, 'bytes': size,
                         'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    assert selected, 'No allowlisted recording evidence exists'
    provenance = EVIDENCE / 'capture-provenance.json'
    provenance.write_text(json.dumps({'sourceRun': run_id, 'sourceAttempt': attempt,
                                     'sourceCommit': source_sha, 'recordingBranch': branch,
                                     'files': manifest, 'omittedFileCount': len(rejected)},
                                    ensure_ascii=False, indent=2))
    selected.append(provenance.relative_to(ROOT).as_posix())
    # The explicit git path list is the allowlist. Unselected logs/profile files
    # remain ignored and cannot accidentally enter the commit.
    token = os.environ['GH_TOKEN']
    credential = base64.b64encode(('x-access-token:' + token).encode()).decode()
    git_env = {**os.environ, 'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_COUNT': '1',
               'GIT_CONFIG_KEY_0': 'http.https://github.com/.extraheader',
               'GIT_CONFIG_VALUE_0': 'AUTHORIZATION: basic ' + credential}
    for key in ('GIT_TRACE', 'GIT_TRACE_CURL', 'GIT_CURL_VERBOSE'):
        git_env.pop(key, None)
    remote = f'https://github.com/{repository}.git'
    existing = git('ls-remote', '--exit-code', '--heads', remote, branch, env=git_env, check=False)
    assert existing.returncode == 2, 'Recording branch already exists or remote check failed; refusing overwrite'
    git('switch', '--create', branch)
    git('add', '-f', '--', *selected)
    staged = set(git('diff', '--cached', '--name-only').stdout.splitlines())
    assert staged == set(selected), 'Unexpected staged paths; refusing evidence commit'
    git('-c', 'user.name=github-actions[bot]', '-c',
        'user.email=41898282+github-actions[bot]@users.noreply.github.com',
        'commit', '-m', f'Record native Manager promo evidence {run_id}/{attempt} [skip ci]')
    git('push', remote, 'HEAD:refs/heads/' + branch, env=git_env)
    print(json.dumps({'branch': branch, 'commit': git('rev-parse', 'HEAD').stdout.strip(),
                      'files': len(selected), 'bytes': sum(item['bytes'] for item in manifest),
                      'omittedFileCount': len(rejected)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
