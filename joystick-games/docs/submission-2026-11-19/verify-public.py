#!/usr/bin/env python3
"""Verify the complete public bytes of every file in a submitted change."""
import argparse
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--commit', required=True)
parser.add_argument('--base', required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
root = Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip())
paths = subprocess.check_output(['git', 'diff', '--name-only', '--diff-filter=ACMRT', '-z', args.base, args.commit], cwd=root).decode().split('\0')
paths = [p for p in paths if p]

def verify(path):
    expected = subprocess.check_output(['git', 'show', f'{args.commit}:{path}'], cwd=root)
    digest = hashlib.sha256(expected).hexdigest()
    url = 'https://raw.githubusercontent.com/ecojust/pureTV/' + args.commit + '/' + urllib.parse.quote(path, safe='/')
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'pureTV-publication-check', 'Cache-Control': 'no-cache'}), timeout=45) as response:
                actual = response.read()
                result = {'path': path, 'url': url, 'httpStatus': response.status, 'bytes': len(actual), 'sha256': hashlib.sha256(actual).hexdigest()}
            if actual != expected:
                raise ValueError(f'Public bytes differ: {path}')
            assert result['sha256'] == digest
            return result
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(2)

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(verify, paths))
report = {'schemaVersion': 1, 'checkedAtUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'repository': 'ecojust/pureTV', 'commit': args.commit, 'baseCommit': args.base, 'method': 'Unauthenticated full HTTP GET; compare complete bytes, size and SHA256 with committed Git blobs', 'status': 'passed', 'filesVerified': len(results), 'totalBytes': sum(x['bytes'] for x in results), 'files': results}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': report['status'], 'files': len(results), 'bytes': report['totalBytes']}))
