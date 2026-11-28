"""Regenerate the static, integrity-checked catalog from the published game files."""
import argparse
import hashlib
import json
from pathlib import Path


TOOLS = Path(__file__).resolve().parent
LIBRARY = TOOLS.parents[1] / 'game-library'


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def receipt(root, path):
    with path.open('rb') as stream:
        if stream.readline(80).startswith(b'version https://git-lfs.github.com/spec/'):
            raise ValueError(f'Fetch the game payload with git lfs pull: {path}')
        stream.seek(0)
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    return {'path': path.relative_to(root).as_posix(), 'bytes': path.stat().st_size, 'sha256': digest}


def build(root):
    catalog = {game['id']: game for game in read_json(TOOLS / 'catalog.json')}
    online = set(read_json(TOOLS / 'online-only.json'))
    hosted = read_json(TOOLS / 'hosted-games.json')
    shared = [receipt(root, path) for path in sorted((root / 'web').iterdir()) if path.is_file()]
    groups = []
    games = []
    for section in read_json(TOOLS.parent / 'readme-app-games.json'):
        category = section['id']
        groups.append({key: section[key] for key in ('id', 'zh', 'en')})
        entries = []
        for ref in section['games']:
            path = ref.get('resource') or ref.get('page')
            if path:
                game = catalog.get(Path(path).name)
                if game:
                    entries.append(game)
        entries.extend(game for game in hosted if game['category'] == category)
        for game in entries:
            ident = game['id']
            entry = {key: game[key] for key in ('id', 'zh', 'en')}
            entry['category'] = category
            files = list((root / 'web' / ident).rglob('*'))
            if ident in catalog:
                entry['kind'] = 'online' if ident in online else 'project'
                entry['apk'] = {'fileName': game['url'].rsplit('/', 1)[1],
                                'bytes': game['bytes'], 'sha256': game['sha256']}
                if entry['kind'] == 'project':
                    project = root / 'projects' / ident
                    for name in ('project.zip', 'signing.bin'):
                        path = project / name
                        if not path.is_file():
                            raise ValueError(f'Missing project resource: {path}')
                        files.append(path)
            else:
                entry['kind'] = 'hosted'
                entry['controls'] = game['controls']
            cover = 'thumb.webp' if entry['kind'] == 'hosted' else 'thumb.png'
            if not (root / 'web' / ident / cover).is_file():
                raise ValueError(f'Missing cover: {ident}')
            entry['files'] = [receipt(root, path) for path in sorted(files) if path.is_file()]
            games.append(entry)
    if sorted(game['id'] for game in games) != sorted([*catalog, *(game['id'] for game in hosted)]):
        raise ValueError('Every game must appear in exactly one category')
    expected = {path.relative_to(root).as_posix() for dirname in ('projects', 'web')
                for path in (root / dirname).rglob('*') if path.is_file()}
    indexed = {item['path'] for item in shared}
    indexed.update(item['path'] for game in games for item in game['files'])
    if indexed != expected:
        raise ValueError(f'Unindexed game resources: {sorted(expected - indexed)}')
    return {'version': 1, 'groups': groups, 'shared': shared, 'games': games}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--library', type=Path, default=LIBRARY)
    parser.add_argument('--check', action='store_true', help='Verify the existing catalog without writing it')
    args = parser.parse_args()
    catalog_path = args.library / 'catalog.json'
    data = (json.dumps(build(args.library), indent=2, ensure_ascii=False) + '\n').encode('utf-8')
    if args.check:
        if catalog_path.read_bytes() != data:
            parser.exit(1, 'Catalog differs from game files and metadata\n')
    else:
        catalog_path.write_bytes(data)
