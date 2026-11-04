#!/usr/bin/env python3
"""Dispatch these two reviewed requests only; refuse duplicate session dispatch."""
import argparse
import datetime
import json
from pathlib import Path
import re
import subprocess
import time

BASE = Path('/workspace/scratch/physics-021')
REPO = Path('/workspace/pureTV')
SLUGS = ['tension-span', 'prism-relay']
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-sha', required=True)
parser.add_argument('--request-branch', required=True)
args = parser.parse_args()
assert re.fullmatch(r'[0-9a-f]{40}', args.source_sha)
assert args.request_branch.startswith('build-assets/game-kit-requests-')
frozen = json.loads((BASE/'frozen/frozen-verification.json').read_text())
assert frozen['sourceSha'] == args.source_sha and frozen['gameCount'] == 2
destination = BASE/'signing-runs.json'
assert not destination.exists(), 'Existing session: do not redispatch'

def rows():
    return json.loads(subprocess.check_output(['gh', 'run', 'list', '--workflow', 'sign-game-kit.yml', '--event', 'workflow_dispatch', '--branch', 'master', '--limit', '40', '--json', 'databaseId,headSha,createdAt,status,conclusion,url'], cwd=REPO, text=True))

def save():
    destination.write_text(json.dumps(record, indent=2)+'\n')

record = {'schema': 1, 'sourceSha': args.source_sha, 'requestBranch': args.request_branch, 'runs': {}}
for slug in SLUGS:
    before = {r['databaseId'] for r in rows()}
    record['pending'] = {'slug': slug, 'beforeRunIds': sorted(before), 'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}
    save()
    subprocess.run(['gh', 'workflow', 'run', 'sign-game-kit.yml', '--ref', 'master', '-f', 'source_sha='+args.source_sha, '-f', 'slug='+slug, '-f', 'request_branch='+args.request_branch], cwd=REPO, check=True)
    matches = []
    for attempt in range(45):
        matches = [r for r in rows() if r['databaseId'] not in before]
        if matches:
            break
        time.sleep(1)
    assert len(matches) == 1, ('Cannot identify unique dispatched run; do not redispatch', slug, matches)
    row = matches[0]
    record['runs'][slug] = {'runId': row['databaseId'], 'url': row['url'], 'workflowSha': row['headSha'], 'createdAt': row['createdAt'], 'status': row['status'], 'conclusion': row['conclusion'], 'dispatchOwner': 'build_setup'}
    del record['pending']
    save()
    print(json.dumps({'slug': slug, **record['runs'][slug]}), flush=True)
