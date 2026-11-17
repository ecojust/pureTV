#!/usr/bin/env python3
"""Read public immutable files in full and compare them with the delivered tree."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import re
import time
from urllib.parse import quote
from urllib.request import Request, urlopen

p = argparse.ArgumentParser()
p.add_argument('--root', type=Path, required=True)
p.add_argument('--ref', required=True)
p.add_argument('--output', type=Path, required=True)
a = p.parse_args()
assert re.fullmatch('[0-9a-f]{40}', a.ref)
assert not a.output.exists()
rollout = json.loads((a.root/'docs/readme-controller-support/rollout.json').read_text())
paths = {'README.md', 'README.en.md', 'resource/README.md', 'resource/tv-store-catalog.json',
         'docs/readme-controller-support/README.md', 'docs/readme-controller-support/rollout.json'}
for game in rollout['games']:
    base = 'resource/apps/'+game['id']+'/'
    paths.update(base+name for name in [game['apk'], 'resource.json', 'thumb.png', 'SHA256SUMS.txt', 'README.md'])
    release = base+'docs/releases/'+game['version']+'/'
    paths.update(release+name for name in ['verification.json', 'gameplay.mp4', 'gameplay.json'])
    paths.add('docs/previews/en/app-'+game['id']+'.png')

def verify(name):
    local = a.root/name
    expected = hashlib.sha256(local.read_bytes()).hexdigest()
    url = 'https://raw.githubusercontent.com/ecojust/pureTV/'+a.ref+'/'+quote(name)
    attempts = []
    for attempt in range(1, 4):
        try:
            sha = hashlib.sha256(); size = 0
            with urlopen(Request(url, headers={'User-Agent':'pureTV-public-file-verification'}), timeout=60) as stream:
                status = stream.status
                while True:
                    chunk = stream.read(1024*1024)
                    if not chunk:
                        break
                    size += len(chunk); sha.update(chunk)
            assert status == 200 and size == local.stat().st_size and sha.hexdigest() == expected
            attempts.append({'attempt': attempt, 'status': 'passed', 'httpStatus': status, 'bytes': size, 'sha256': sha.hexdigest()})
            return {'path': name, 'url': url, 'status': 'passed', 'attempts': attempts}
        except Exception as error:
            attempts.append({'attempt': attempt, 'status': 'failed', 'error': repr(error)})
            if attempt < 3:
                time.sleep(attempt)
    return {'path': name, 'url': url, 'status': 'failed', 'expectedBytes': local.stat().st_size, 'expectedSha256': expected, 'attempts': attempts}

results = []
with ThreadPoolExecutor(max_workers=4) as pool:
    futures = {pool.submit(verify, name): name for name in sorted(paths)}
    for future in as_completed(futures):
        results.append(future.result())
        if len(results) % 20 == 0:
            print(json.dumps({'checked': len(results), 'total': len(paths)}), flush=True)
result = {'publicationCommit': a.ref, 'method': 'Complete unauthenticated HTTPS downloads, comparing byte counts and SHA256 with the delivered local tree.',
          'status': 'passed' if all(r['status']=='passed' for r in results) else 'failed',
          'files': sorted(results, key=lambda r:r['path']), 'marketServerUploaded': False,
          'physicalTvTested': False, 'physicalEsp32Tested': False}
a.output.parent.mkdir(parents=True, exist_ok=True)
a.output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'status': result['status'], 'filesChecked': len(results)}))
assert result['status'] == 'passed'
