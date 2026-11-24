#!/usr/bin/env python3
"""Check published game APK references and their exact bytes in the source tree."""

from functools import cache
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
from zipfile import ZipFile, BadZipFile


ROOT = Path(__file__).resolve().parents[2]
GAMES = ROOT / 'joystick-games'
RAW = 'https://github.com/ecojust/pureTV/raw/refs/heads/master/'
RAW_CONTENT = 'https://raw.githubusercontent.com/ecojust/pureTV/master/'


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


@cache
def apk_identity(path):
    if not path.is_file() or path.resolve() != path:
        raise ValueError(f'Missing regular APK: {path}')
    try:
        with ZipFile(path) as apk:
            apk.getinfo('AndroidManifest.xml')
    except (BadZipFile, KeyError) as error:
        raise ValueError(f'{path}: expected an APK with AndroidManifest.xml; check Git LFS checkout') from error
    with path.open('rb') as stream:
        return path.stat().st_size, hashlib.file_digest(stream, 'sha256').hexdigest()


def check(slug, filename, reference=None, *, version=None, size=None, sha256=None):
    if not re.fullmatch(r'[a-z0-9-]+', slug) or not re.fullmatch(re.escape(slug) + r'-[0-9][\w.-]*\.apk', filename):
        raise ValueError(f'{slug}: invalid APK filename {filename}')
    if version and filename != f'{slug}-{version}.apk':
        raise ValueError(f'{filename}: expected version {version}')
    path = GAMES / slug / filename
    relative = path.relative_to(ROOT).as_posix()
    if reference is not None and reference not in (relative, relative + '?raw=1', RAW + relative, RAW_CONTENT + relative):
        raise ValueError(f'{slug}: expected a repository APK link to {relative}, got {reference}')
    actual_size, actual_hash = apk_identity(path)
    if size is not None and actual_size != size:
        raise ValueError(f'{relative}: expected {size} bytes, found {actual_size}')
    if sha256 is not None and actual_hash != sha256:
        raise ValueError(f'{relative}: expected SHA-256 {sha256}, found {actual_hash}')
    return relative


def check_android(slug, data):
    filename = data.get('file') or Path(urlsplit(data['url']).path).name
    check(slug, filename, data.get('url'), version=data.get('versionName', data.get('version')),
          size=data['bytes'], sha256=data['sha256'])


def main():
    resources = {}
    for resource in read_json('tools/resource-order.json')['game']:
        info = read_json(Path('resource') / resource / 'resource.json')
        resources[resource] = check(Path(resource).name, info['apk'], info['downloadUrl'],
                                    version=info['version'], size=info['apkBytes'], sha256=info['sha256'])

    readme = (GAMES / 'README.md').read_text(encoding='utf-8')
    manifest, = set(re.findall(r'\(\.\./(docs/releases/[\w.-]+/clients\.json)\)', readme))
    for game in read_json(manifest)['games']:
        if game.get('android'):
            check_android(game['id'], game['android'])
    for game in read_json('tools/pc-games/catalog.json'):
        check_android(game['id'], game)

    for path in GAMES.glob('*/packages.json'):
        android = read_json(path).get('android')
        if android and ('file' in android or 'url' in android):
            check_android(path.parent.name, android)
    for path in GAMES.glob('*/android-release.json'):
        release = read_json(path)
        package = {**release, **release.get('package', {}), **release.get('apk', {})}
        check_android(path.parent.name, package)

    expected = {}
    for genre in read_json('tools/readme-app-games.json'):
        for game in genre['games']:
            if 'resource' in game:
                page = f"resource/{game['resource']}/"
                expected[page] = resources[game['resource']]
            else:
                reference = game['apk']
                filename = Path(urlsplit(reference).path).name
                relative = check(Path(game['page']).name, filename, reference)
                expected[game['page']] = relative
    for name in ('README.md', 'README.en.md'):
        readme = (ROOT / name).read_text(encoding='utf-8')
        gallery = readme.split('<!-- game-index:start -->')[1].split('<!-- game-index:end -->')[0]
        actual = {}
        for card in re.findall(r'<td\b[^>]*>(.*?)</td>', gallery, re.S):
            links = re.findall(r'href="([^"]+)"', card)
            if not links:
                continue
            page = links[0]
            if page in actual:
                raise ValueError(f'{name}: duplicate game card for {page}')
            downloads = [url for url in links if urlsplit(url).path.endswith('.apk')]
            if len(downloads) != 1:
                raise ValueError(f'{name}: expected one APK in the game card for {page}')
            actual[page] = downloads[0].removesuffix('?raw=1')
        if actual != expected:
            raise ValueError(f'{name}: game gallery APK links differ from the local game catalog')
    print(f'Verified {apk_identity.cache_info().currsize} distinct repository APKs and both game galleries.')


if __name__ == '__main__':
    main()
