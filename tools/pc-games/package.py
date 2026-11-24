"""Create the portable desktop player ZIP and checksum from the release checkout."""
import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path
from urllib.parse import urlsplit


REPOSITORY_RAW = 'https://github.com/ecojust/pureTV/raw/refs/heads/master/'


def build(output, root=Path(__file__).resolve().parents[2]):
    src = root / 'tools' / 'pc-games'
    games = json.loads((src / 'catalog.json').read_text(encoding='utf-8'))
    genres = json.loads((root / 'tools' / 'readme-app-games.json').read_text(encoding='utf-8'))
    entries = [entry for genre in genres for entry in genre['games']]
    featured = [entry.get('page', entry.get('resource')).strip('/').rsplit('/', 1)[-1] for entry in entries]
    games_by_id = {game['id']: game for game in games}
    if len(games_by_id) != len(games):
        raise ValueError('Duplicate desktop game ID')
    for game in games:
        if not re.fullmatch(r'[0-9a-f]{64}', game['sha256']) or game['bytes'] <= 0:
            raise ValueError(f'Incomplete download identity for {game["id"]}')
    if list(games_by_id) != featured:
        raise ValueError('Desktop release and featured catalog differ')
    for slug, entry in zip(featured, entries):
        if 'page' in entry and REPOSITORY_RAW + urlsplit(entry['apk']).path != games_by_id[slug]['url']:
            raise ValueError(f'Desktop and TV download URLs differ for {slug}')
    output.mkdir(parents=True, exist_ok=True)
    archive = output / 'pureTV-Games-portable.zip'
    files = [src / name for name in ('catalog.json', 'launcher.py', 'host.py', 'pc-bridge.js', 'requirements.txt')]
    files.append(root / 'LICENSE')
    with zipfile.ZipFile(archive, 'w') as package:
        for path in files:
            entry = zipfile.ZipInfo(path.name)
            # These six small UTF-8 files produce the same ZIP on Windows, Mac and Linux.
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            package.writestr(entry, path.read_text(encoding='utf-8').encode('utf-8'))
    print(archive.name, hashlib.sha256(archive.read_bytes()).hexdigest())
    return archive


if __name__ == '__main__':
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('--output', required=True, type=Path)
    build(args.parse_args().output)
