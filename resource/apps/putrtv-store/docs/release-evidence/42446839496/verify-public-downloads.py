#!/usr/bin/env python3
"""Check public apps-only catalog and the signed store APK at the published commit."""
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
import argparse, hashlib, json, re, subprocess, time

parser = argparse.ArgumentParser()
parser.add_argument('--run', required=True)
args = parser.parse_args()
assert args.run.isdecimal()
root = Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip())
revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
assert re.fullmatch(r'[0-9a-f]{40}', revision)
base = 'https://raw.githubusercontent.com/ecojust/pureTV/' + revision + '/'

def fetch(path, expected_bytes, expected_hash):
    for attempt in range(3):
        try:
            request = Request(base + path, headers={'User-Agent': 'pureTV-publication-check', 'Accept-Encoding': 'identity'})
            with urlopen(request, timeout=30) as response:
                assert response.status == 200
                checksum = hashlib.sha256(); size = 0
                while True:
                    chunk = response.read(65536)
                    if not chunk:
                        break
                    size += len(chunk); assert size <= expected_bytes
                    checksum.update(chunk)
                assert size == expected_bytes and checksum.hexdigest() == expected_hash
                return {'path': path, 'httpStatus': 200, 'bytes': size, 'sha256': checksum.hexdigest(), 'verified': True}
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))

feed_path = 'resource/tv-store-catalog.json'
feed_data = (root / feed_path).read_bytes()
entries = json.loads(feed_data)['entries']
counts = Counter(entry['category'] for entry in entries)
assert counts == {'media': 5, 'game': 111, 'tools': 1}
assert all(entry['id'].startswith('apps/') for entry in entries)
catalog = fetch(feed_path, len(feed_data), hashlib.sha256(feed_data).hexdigest())
folder = 'resource/apps/putrtv-store'
metadata = json.loads((root / folder / 'resource.json').read_text())
assert metadata['version'] == '0.1.1' and metadata['versionCode'] == 2
entry = next(entry for entry in entries if entry['id'] == 'apps/putrtv-store')
assert entry['versionName'] == metadata['version'] and entry['versionCode'] == metadata['versionCode']
assert entry['sha256'] == metadata['sha256'] and entry['bytes'] == metadata['apkBytes']
apk = {**fetch(folder + '/' + metadata['apk'], metadata['apkBytes'], metadata['sha256']),
       'packageName': metadata['packageName'], 'version': metadata['version'], 'versionCode': metadata['versionCode']}
observed = json.loads(subprocess.check_output(['gh', 'api', 'repos/ecojust/pureTV/git/ref/heads/master'], cwd=root))['object']['sha']
assert observed == revision
report = {'publicationCommit': revision, 'observedMaster': observed, 'checkedAt': datetime.now(timezone.utc).isoformat(),
          'catalogEntries': len(entries), 'categoryCounts': counts, 'catalog': catalog, 'files': [apk], 'physicalTvTested': False}
target = root / folder / 'docs/release-evidence' / args.run / 'public-downloads.json'
target.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'publicationCommit': revision, 'catalogEntries': len(entries), 'apkDownloadsVerified': 1, 'bytesDownloaded': apk['bytes']}, indent=2))
