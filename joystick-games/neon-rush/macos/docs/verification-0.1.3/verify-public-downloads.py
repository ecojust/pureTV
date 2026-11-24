#!/usr/bin/env python3
"""Compare complete public downloads with committed files; no credentials used."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--repo', type=Path, required=True)
parser.add_argument('--commit', required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
base = 'resource/apps/neon-rush/'
paths = [base + name for name in (
    'macos/NeonRush-0.1.3-macos-universal.dmg',
    'macos/NeonRush-0.1.3-macos-universal.zip',
    'macos/SHA256SUMS.txt', 'macos/README.md', 'README.md', 'README.en.md')]
expected = {path: subprocess.check_output(['git', 'show', args.commit + ':' + path], cwd=args.repo) for path in paths}

def check(pair):
    ref, path = pair
    url = 'https://raw.githubusercontent.com/ecojust/pureTV/' + ref + '/' + path
    with urllib.request.urlopen(urllib.request.Request(url, headers={'Cache-Control': 'no-cache'}), timeout=90) as response:
        status, data = response.status, response.read()
    return {'url': url, 'httpStatus': status, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'matchesCommittedFile': data == expected[path]}

with ThreadPoolExecutor(max_workers=6) as pool:
    files = list(pool.map(check, [(ref, path) for ref in (args.commit, 'master') for path in paths]))
passed = all(row['httpStatus'] == 200 and row['matchesCommittedFile'] for row in files)
report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'artifactCommit': args.commit, 'method': 'Complete unauthenticated HTTPS GET from immutable commit and master; exact byte comparison for both packages, checksum list and three download guides.', 'status': 'passed' if passed else 'failed', 'files': files}
args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': report['status'], 'downloads': len(files)}))
assert passed, 'Public download differs from the committed delivery'
