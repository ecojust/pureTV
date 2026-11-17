#!/usr/bin/env python3
"""Build the TV store's deterministic, verified public feed (no network access).

Refresh after publishing resource APKs:
  python3 tools/update-tv-store-catalog.py --build-tools /path/to/android-sdk/build-tools/34.0.0

The feed lists apps only; all repository resources, including launchers, are verified.
The bundled snapshot is deliberately separate from the live feed. Before freezing a
store APK, use --snapshot-revision <published 40-hex commit>. The initial source-only
bootstrap additionally requires --allow-unpublished-store.
Only resources whose metadata, APK and covers match that commit may enter its snapshot.
Future feed refreshes do not rewrite the frozen store APK's bundled snapshot.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from resource_catalog import child, verify_catalog

ROOT = Path(__file__).resolve().parents[1]
FEED = 'resource/tv-store-catalog.json'
SNAPSHOT = 'resource/apps/putrtv-store/src/main/assets/catalog-snapshot.json'
CATEGORIES = ('launcher', 'media', 'game', 'tools')
STORE_CATEGORIES = ('media', 'game', 'tools')
SVG_NS = 'http://www.w3.org/2000/svg'
SVG_TAGS = {'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'}
SVG_ATTRS = {'viewBox', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule', 'opacity', 'fill-opacity', 'stroke-opacity', 'transform', 'color'}
ET.register_namespace('', SVG_NS)


def safe_logo(text):
    """Normalize only nonvisual accessibility metadata; reject any active/external SVG."""
    if len(text.encode('utf-8')) > 8192 or re.search(r'<!DOCTYPE|<!ENTITY', text, re.I):
        raise ValueError('size or document declaration')
    document = ET.fromstring(text)
    def tag(element):
        name = element.tag
        if name.startswith('{'):
            namespace, name = name[1:].split('}', 1)
            if namespace != SVG_NS:
                raise ValueError('foreign SVG namespace')
        return name
    if tag(document) != 'svg':
        raise ValueError('not an SVG root')
    for element in list(document.iter()):
        name = tag(element)
        if name not in SVG_TAGS | {'title', 'desc'}:
            raise ValueError('unsupported SVG element: ' + name)
        if name in {'title', 'desc'} and len(element):
            raise ValueError('nested accessibility metadata')
        if name in SVG_TAGS and element.text and element.text.strip():
            raise ValueError('unsupported SVG text')
        if element.tail and element.tail.strip():
            raise ValueError('unsupported SVG trailing text')
        for key, value in list(element.attrib.items()):
            if key == 'role' or re.fullmatch(r'aria-[a-z][a-z0-9-]*', key):
                del element.attrib[key]
                continue
            if key not in SVG_ATTRS:
                raise ValueError('unsupported SVG attribute: ' + key)
            if re.search(r'url|javascript:|https?:|data:|@import|[<>]', value, re.I):
                raise ValueError('external SVG resource')
        for descendant in list(element):
            if tag(descendant) in {'title', 'desc'}:
                element.remove(descendant)
    normalized = ET.tostring(document, encoding='unicode', short_empty_elements=True)
    if len(normalized.encode('utf-8')) > 8192:
        raise ValueError('normalized SVG exceeds size limit')
    return normalized


def git_blob(path):
    digest = hashlib.sha1()
    digest.update(('blob ' + str(path.stat().st_size) + '\0').encode())
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(65536), b''):
            digest.update(chunk)
    return digest.hexdigest()


def min_sdk(apk, tools):
    badging = subprocess.check_output([str(tools / 'aapt'), 'dump', 'badging', str(apk)], text=True)
    match = re.search(r"^sdkVersion:'([0-9]+)'$", badging, re.M)
    assert match, f'No numeric minSdk in {apk}'
    value = int(match[1])
    assert 1 <= value <= 1000, f'Invalid minSdk in {apk}'
    return value


def encode(document):
    return (json.dumps(document, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def write_if_changed(path, data, check=False):
    if path.is_file() and path.read_bytes() == data:
        return False
    if check:
        raise AssertionError(f'Generated file is out of date: {path}')
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.tmp')
    try:
        temporary.write_bytes(data)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)
    return True


def generate(root, tools, allow_unpublished_store=False):
    resources = verify_catalog(root, tools, allow_unpublished_putrtv_store=allow_unpublished_store)
    order = json.loads((root / 'tools/resource-order.json').read_text())
    translations = json.loads((root / 'tools/resource-index.en.json').read_text())
    assert set(order) == set(CATEGORIES), 'Resource order must contain the four repository categories'
    indexed = {str(Path(info['path']).parent.relative_to('resource')): info for info in resources}
    ordered_ids = [key for group in CATEGORIES for key in order[group]]
    assert len(ordered_ids) == len(set(ordered_ids)), 'Duplicate resource creation-order entry'
    pending = {'apps/putrtv-store'} if allow_unpublished_store and 'apps/putrtv-store' not in indexed else set()
    assert set(ordered_ids) == set(indexed) | pending, 'Resource order does not match published APKs'
    entries, lint, packages = [], [], set()
    for category in CATEGORIES:
        for identity in reversed(order[category]):
            if identity in pending:
                continue
            assert re.fullmatch(r'(?:apps|launcher)/[a-z0-9][a-z0-9-]*', identity), 'Unsafe catalog identity'
            info = indexed[identity]
            assert (category == 'launcher') == (info['kind'] == 'launcher'), 'Mismatched launcher category'
            assert info['packageName'] not in packages, 'Duplicate package identity'
            packages.add(info['packageName'])
            directory = root / 'resource' / identity
            english = translations[identity]
            assert isinstance(english['name'], str) and english['name'].strip(), f'{identity}: missing English name'
            description = info.get('description', '')
            description_en = english.get('description', '')
            assert isinstance(description, str) and isinstance(description_en, str)
            logo = ''
            try:
                logo = safe_logo(child(directory, 'logo.svg').read_text(encoding='utf-8'))
            except (AssertionError, ValueError, ET.ParseError, UnicodeError) as error:
                lint.append({'id': identity, 'logoSvg': 'omitted', 'reason': str(error)})
            apk = root / info['path']
            cover = str(child(directory, info['cover']).relative_to(root)) if info.get('cover') else ''
            assert not cover or cover.endswith('.png'), f'{identity}: PNG cover required'
            entry = {
                'id': identity, 'name': info['name'], 'nameEn': english['name'],
                'description': description, 'descriptionEn': description_en,
                'category': category, 'packageName': info['packageName'], 'versionName': info['version'],
                'apkPath': info['path'], 'coverPath': cover, 'logoSvg': logo,
                'sha256': info['sha256'], 'certificateSha256': info['certificateSha256'],
                'gitBlobSha': git_blob(apk), 'versionCode': info['versionCode'], 'bytes': info['apkBytes'],
                'minSdk': min_sdk(apk, tools),
            }
            assert 0 < entry['versionCode'] <= 9223372036854775807
            # Keep launchers in every validation above, including creation order,
            # metadata and APK identity. Only the public store listing excludes them.
            if category in STORE_CATEGORIES:
                entries.append(entry)
    return {'schemaVersion': 1, 'entries': entries}, lint


def snapshot(root, catalog, revision):
    assert re.fullmatch(r'[a-f0-9]{40}', revision), 'Use a full immutable published Git commit for a snapshot'
    assert all(entry['category'] in STORE_CATEGORIES for entry in catalog['entries']), 'Store snapshot must contain apps only'
    actual = subprocess.check_output(['git', 'rev-parse', revision + '^{commit}'], cwd=root, text=True).strip()
    assert actual == revision, 'Snapshot ref must be the exact commit'
    # Embed only already published resources. Later snapshots can include the
    # previous store release, but never the APK currently being built.
    frozen = []
    for entry in catalog['entries']:
        directory = 'resource/' + entry['id']
        metadata_path = directory + '/resource.json'
        probe = subprocess.run(['git', 'cat-file', '-e', revision + ':' + metadata_path], cwd=root, stderr=subprocess.DEVNULL)
        if probe.returncode:
            assert entry['id'] == 'apps/putrtv-store', f'{entry["id"]}: not published at snapshot revision'
            continue
        previous = json.loads(subprocess.check_output(['git', 'show', revision + ':' + metadata_path], cwd=root))
        assert previous == json.loads((root / metadata_path).read_text()), f'{entry["id"]}: metadata changed since snapshot commit'
        for path in (entry['apkPath'], entry['coverPath']):
            if not path:
                continue
            expected = subprocess.check_output(['git', 'rev-parse', revision + ':' + path], cwd=root, text=True).strip()
            assert expected == git_blob(root / path), f'{path}: asset changed since snapshot commit'
        frozen.append(entry)
    timestamp = int(subprocess.check_output(['git', 'show', '-s', '--format=%ct', revision], cwd=root, text=True).strip()) * 1000
    return {'revision': revision, 'fetchedAt': timestamp, 'catalog': {'schemaVersion': 1, 'entries': frozen}}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--build-tools', type=Path, default=Path(os.environ.get('ANDROID_HOME', '/opt/android-sdk')) / 'build-tools/34.0.0')
    parser.add_argument('--allow-unpublished-store', action='store_true', help='Bootstrap only the exact source-only putrtv-store directory; never use for publication')
    parser.add_argument('--snapshot-revision', help='Also freeze a bundled snapshot at this exact published 40-hex commit')
    parser.add_argument('--check', action='store_true', help='Verify generated bytes without writing')
    args = parser.parse_args()
    catalog, lint = generate(ROOT, args.build_tools, args.allow_unpublished_store)
    changed = write_if_changed(ROOT / FEED, encode(catalog), args.check)
    if args.snapshot_revision:
        changed = write_if_changed(ROOT / SNAPSHOT, encode(snapshot(ROOT, catalog, args.snapshot_revision)), args.check) or changed
    report = {'entries': len(catalog['entries']), 'changed': changed, 'logoWarnings': lint}
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
