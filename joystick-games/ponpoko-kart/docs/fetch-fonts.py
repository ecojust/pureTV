#!/usr/bin/env python3
"""Restore pinned font/license bytes from sources.json; never update the lock."""
from pathlib import Path
import hashlib
import json
import urllib.request

root = Path(__file__).resolve().parents[1] / 'src/fonts'
manifest = json.loads((root / 'sources.json').read_text())
for family in manifest['fonts']:
    for record in [*family['files'], family['license']]:
        data = urllib.request.urlopen(record['url'], timeout=60).read()
        assert hashlib.sha256(data).hexdigest() == record['sha256'], record['path']
        if 'bytes' in record:
            assert len(data) == record['bytes'], record['path']
        (root / record['path']).write_bytes(data)
        print(record['path'], len(data))
