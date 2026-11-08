#!/usr/bin/env python3
"""Observe the 0.5.6 run, then archive fresh job logs only after completion."""
import datetime
import hashlib
import json
import re
import subprocess
import time
from pathlib import Path

OUT = Path(__file__).resolve().parent
REPO = 'ecojust/pureTV'
RUN = '42455034353'
SOURCE = 'a3b1ef17a08e574c5ad5e607f27dd5d1bc4d8166'
TAG = '6da7e0b94da0ebbb6bdb6f651dbcd8673a330016'
PLATFORMS = {'windows-x64', 'linux-x64', 'macos-x64', 'macos-arm64'}

def gh(*args):
    process = subprocess.run(['gh', *args], cwd='/workspace/pureTV', capture_output=True)
    if process.returncode:
        error = re.sub(r'https?://\S+', '[URL omitted]', process.stderr.decode(errors='replace'))
        raise RuntimeError(error[:1000])
    return process.stdout

while True:
    run = json.loads(gh('run', 'view', RUN, '--repo', REPO, '--json',
                       'databaseId,status,conclusion,headSha,headBranch,event,url,jobs,createdAt,updatedAt,startedAt,workflowName'))
    assert str(run['databaseId']) == RUN and run['headSha'] == SOURCE
    run['observedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (OUT / 'latest-status.json').write_text(json.dumps(run, ensure_ascii=False, indent=2) + '\n')
    with (OUT / 'status-history.jsonl').open('a') as history:
        history.write(json.dumps(run, ensure_ascii=False) + '\n')
    print(json.dumps({'observedAt':run['observedAt'], 'status':run['status'],
                     'conclusion':run['conclusion'], 'jobs':[
        {'name':job['name'], 'status':job['status'], 'conclusion':job['conclusion'],
         'active':[step['name'] for step in job['steps'] if step['status'] == 'in_progress']}
        for job in run['jobs']]}, ensure_ascii=False), flush=True)
    if run['status'] == 'completed':
        (OUT / 'run-final.json').write_text(json.dumps(run, ensure_ascii=False, indent=2) + '\n')
        break
    time.sleep(45)

metadata = json.loads(gh('api', f'repos/{REPO}/actions/runs/{RUN}'))
assert metadata['head_sha'] == SOURCE
(OUT / 'run-metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
tag = json.loads(gh('api', f'repos/{REPO}/git/tags/{TAG}'))
assert tag['sha'] == TAG and tag['object']['sha'] == SOURCE
assert tag['tag'] == 'desktop-v0.5.6'
(OUT / 'tag-metadata.json').write_text(json.dumps(tag, ensure_ascii=False, indent=2) + '\n')

log_index = {}
assert {job['name'] for job in run['jobs'] if job['name'] in PLATFORMS} == PLATFORMS
for job in run['jobs']:
    name = job['name']
    if name not in PLATFORMS:
        continue
    raw = gh('run', 'view', RUN, '--repo', REPO, '--job', str(job['databaseId']), '--log')
    assert raw, name
    (OUT / (name + '.log')).write_bytes(raw)
    log_index[name] = {'jobId':job['databaseId'], 'conclusion':job['conclusion'],
                       'logBytes':len(raw), 'logSha256':hashlib.sha256(raw).hexdigest()}
    print(json.dumps({'archived':name, **log_index[name]}), flush=True)
(OUT / 'raw-log-index.json').write_text(json.dumps(log_index, indent=2) + '\n')
(OUT / 'SHA256SUMS-full-logs.txt').write_text(''.join(
    item['logSha256'] + '  ' + name + '.log\n' for name, item in sorted(log_index.items())))
