import hashlib
import json
import shutil
import sys
from pathlib import Path

library, data = map(Path, sys.argv[1:])
index = json.loads((library / 'web/catalog.json').read_bytes())
cache = data / 'game-library'
cache.mkdir(parents=True)
shutil.copyfile(library / 'web/catalog.json', cache / 'catalog.json')
for game in index['games']:
    if game['id'] not in ('tetris', 'neon-rush'):
        continue
    files = [index['shared'], game['files']]
    revision = hashlib.sha256(json.dumps(files, separators=(',', ':')).encode()).hexdigest()
    root = cache / 'games' / game['id'] / revision
    for file in files[0] + files[1]:
        name = file['path']
        source = library / name
        assert source.stat().st_size == file['bytes']
        with source.open('rb') as stream:
            assert hashlib.file_digest(stream, 'sha256').hexdigest() == file['sha256']
        target = root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
