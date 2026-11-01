#!/usr/bin/env python3
"""Write local request files; the caller owns staging-branch commits and dispatch."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--build', required=True, type=Path)
parser.add_argument('--source-sha', required=True)
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args()
assert re.fullmatch(r'[a-f0-9]{40}', args.source_sha), 'Exact source SHA required'
receipt = json.loads((args.build / 'build-receipt.json').read_text())
slug = receipt['game']
assert re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', slug)
apk = args.build / 'unsigned.apk'
data = apk.read_bytes()
assert receipt['unsigned'] is True and 0 < len(data) < 10_000_000
assert len(data) == receipt['bytes'] and hashlib.sha256(data).hexdigest() == receipt['sha256'], 'Build receipt does not match APK'
folder = args.output / 'requests' / slug
folder.mkdir(parents=True, exist_ok=True)
shutil.copyfile(apk, folder / 'unsigned.apk')
request = {'schema': 1, 'slug': slug, 'sourceSha': args.source_sha,
           **{key: receipt[key] for key in ('packageName', 'version', 'versionCode')},
           'unsignedSha256': receipt['sha256'], 'unsignedBytes': receipt['bytes']}
(folder / 'request.json').write_text(json.dumps(request, indent=2) + '\n')
print(json.dumps({'requestDirectory': str(folder), 'unsignedBytes': len(data)}))
