#!/usr/bin/env python3
"""Build only the two authorized 0.2.1 games after an explicit exact source SHA."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

BASE = Path('/workspace/scratch/physics-021')
REPO = Path('/workspace/pureTV')
EXPECTED = {'tension-span': ('0.2.1', 3), 'prism-relay': ('0.2.1', 4)}
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-sha', required=True)
args = parser.parse_args()
sha = args.source_sha
assert re.fullmatch(r'[0-9a-f]{40}', sha), 'Exact source commit required'
for slug, expected in EXPECTED.items():
    content = subprocess.check_output(['git', '-C', str(REPO), 'show', f'{sha}:resource/apps/{slug}/game.json'])
    metadata = json.loads(content)
    assert (metadata['version'], metadata['versionCode']) == expected, (slug, metadata)
frozen = BASE / 'frozen'
requests = BASE / 'signing-requests-01'
assert not frozen.exists() and not requests.exists(), 'Preserve prior attempts; select fresh output paths'
command = [sys.executable, str(BASE/'tools/batch.py'), 'build', '--repo', str(REPO), '--source-sha', sha, '--output', str(frozen)]
for slug in EXPECTED:
    command += ['--game', slug]
subprocess.run(command, check=True)
files = []
for path in sorted((frozen/'source').rglob('*')):
    if path.is_file():
        relative = path.relative_to(frozen/'source').as_posix()
        actual = path.read_bytes()
        original = subprocess.check_output(['git', '-C', str(REPO), 'show', f'{sha}:{relative}'])
        assert actual == original, relative
        files.append({'path': relative, 'sha256': hashlib.sha256(actual).hexdigest(), 'bytes': len(actual)})
batch = json.loads((frozen/'batch-receipt.json').read_text())
assert batch['sourceSha'] == sha and {g['slug'] for g in batch['games']} == set(EXPECTED)
verification = {'sourceSha': sha, 'frozenSourceFilesMatchedGit': len(files), 'gameCount': len(EXPECTED), 'checks': files, 'unsigned': True, 'games': batch['games']}
(frozen/'frozen-verification.json').write_text(json.dumps(verification, indent=2)+'\n')
subprocess.run([sys.executable, str(BASE/'tools/batch.py'), 'requests', '--repo', str(REPO), '--build-root', str(frozen), '--source-sha', sha, '--output', str(requests)], check=True)
print(json.dumps({'sourceSha': sha, 'frozen': str(frozen), 'requests': str(requests), 'sourceFileCount': len(files)}), flush=True)
