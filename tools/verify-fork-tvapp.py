#!/usr/bin/env python3
"""Independently verify the immutable TVAPP import without installing or running APKs.

Checks every eligible upstream tree entry, byte identity, APK ZIP structure,
stored aapt/apksigner evidence, generated assets, checksums and local README
links. It never modifies the collection or invokes apksigner again.
"""
import argparse
import collections
import datetime
import hashlib
import json
import io
import re
import struct
import sys
import urllib.parse
import xml.etree.ElementTree as ET
import zipfile
import zlib
from pathlib import Path

from PIL import Image

REPOSITORY = 'https://github.com/youhunwl/TVAPP'
LIMIT = 10_000_000
CATEGORY_MAP = {'娱乐应用': 'media', '影视': 'media', '电视直播': 'media',
                '实用工具': 'tools', '运动健身': 'fitness', '教育学习': 'education'}
SVG_TAGS = {'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'}
SVG_ATTRS = {'viewBox', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy',
             'r', 'rx', 'ry', 'd', 'points', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
             'stroke-linejoin', 'fill-rule', 'clip-rule', 'opacity', 'fill-opacity',
             'stroke-opacity', 'transform', 'color'}


class Invalid(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise Invalid(message)


def read_json(path):
    require(path.is_file() and not path.is_symlink(), f'Missing regular JSON file: {path}')
    require(path.stat().st_size < 8 * 1024 * 1024, f'Unexpectedly large JSON: {path}')
    return json.loads(path.read_text(encoding='utf-8'))


def sha256(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def within(root, base, value, *, must_exist=True):
    require(isinstance(value, str) and value and '\\' not in value, f'Invalid relative path: {value!r}')
    relative = Path(value)
    require(not relative.is_absolute(), f'Absolute local path: {value}')
    path = base / relative
    require(path.resolve().is_relative_to(root.resolve()), f'Path escapes import: {value}')
    current = path
    while current != root and current.is_relative_to(root):
        require(not current.is_symlink(), f'Symlink in path: {value}')
        current = current.parent
    if must_exist:
        require(path.exists(), f'Local target does not exist: {value}')
    return path


def verify_png(path, expected=(960, 540)):
    data = path.read_bytes()
    require(data.startswith(b'\x89PNG\r\n\x1a\n'), f'Invalid PNG: {path}')
    offset, chunks, compressed, header = 8, [], bytearray(), None
    while offset < len(data):
        require(offset + 12 <= len(data), f'Truncated PNG chunk: {path}')
        length, kind = struct.unpack('>I4s', data[offset:offset + 8])
        require(offset + length + 12 <= len(data), f'Truncated PNG payload: {path}')
        payload = data[offset + 8:offset + 8 + length]
        crc = struct.unpack('>I', data[offset + 8 + length:offset + 12 + length])[0]
        require(zlib.crc32(kind + payload) & 0xffffffff == crc, f'PNG CRC mismatch: {path}')
        chunks.append(kind)
        if kind == b'IHDR':
            require(len(chunks) == 1 and length == 13, f'Invalid PNG IHDR: {path}')
            header = struct.unpack('>IIBBBBB', payload)
        elif kind == b'IDAT':
            compressed.extend(payload)
        offset += length + 12
        if kind == b'IEND':
            require(length == 0 and offset == len(data), f'Unexpected data after PNG IEND: {path}')
            break
    require(header and chunks[-1:] == [b'IEND'] and b'IDAT' in chunks, f'Incomplete PNG: {path}')
    width, height, depth, colour, compression, filtering, interlace = header
    require((width, height) == expected, f'PNG size {(width, height)} differs from {expected}: {path}')
    require(compression == filtering == interlace == 0, f'Unsupported generated PNG format: {path}')
    valid_depths = {0: {1, 2, 4, 8, 16}, 2: {8, 16}, 3: {1, 2, 4, 8}, 4: {8, 16}, 6: {8, 16}}
    require(colour in valid_depths and depth in valid_depths[colour], f'Invalid PNG colour format: {path}')
    require(colour != 3 or b'PLTE' in chunks, f'Indexed PNG missing palette: {path}')
    samples = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[colour]
    stride = (width * samples * depth + 7) // 8 + 1
    inflater = zlib.decompressobj()
    pixels = inflater.decompress(bytes(compressed), stride * height + 1)
    require(inflater.eof and not inflater.unused_data and not inflater.unconsumed_tail,
            f'Invalid or excessive PNG image stream: {path}')
    require(len(pixels) == stride * height, f'PNG scanline size mismatch: {path}')
    require(all(pixels[row * stride] <= 4 for row in range(height)), f'Invalid PNG scanline filter: {path}')
    return {'width': width, 'height': height, 'sha256': hashlib.sha256(data).hexdigest()}


def verify_svg(path, maximum_bytes=8192):
    data = path.read_bytes()
    require(0 < len(data) <= maximum_bytes, f'SVG exceeds {maximum_bytes} bytes: {path}')
    require(b'<!DOCTYPE' not in data.upper() and b'<!ENTITY' not in data.upper(), f'SVG entity/doctype forbidden: {path}')
    svg = ET.fromstring(data)
    require(svg.tag == '{http://www.w3.org/2000/svg}svg', f'Invalid SVG root/namespace: {path}')
    require(svg.get('width') in ('64', '64px') and svg.get('height') in ('64', '64px'), f'SVG dimensions must be 64: {path}')
    require([float(x) for x in re.split(r'[ ,]+', svg.get('viewBox', '').strip())] == [0, 0, 64, 64], f'SVG viewBox must be 0 0 64 64: {path}')
    for element in svg.iter():
        tag = element.tag.removeprefix('{http://www.w3.org/2000/svg}')
        require(tag in SVG_TAGS, f'Forbidden SVG tag {tag}: {path}')
        require(not (element.text or '').strip() and not (element.tail or '').strip(), f'SVG must not contain text: {path}')
        for attr, value in element.attrib.items():
            key = attr.lower()
            require(attr in SVG_ATTRS, f'Unsupported SVG attribute {attr}: {path}')
            require(not key.startswith('on') and 'href' not in key and 'font' not in key, f'Unsafe SVG attribute {attr}: {path}')
            require(not re.search(r'https?:|data:|javascript:|@import|font', value, re.I), f'External/font SVG value: {path}')
            if 'url(' in value.lower():
                require(re.fullmatch(r'url\(#[A-Za-z_][\w.-]*\)', value), f'External SVG URL: {path}')
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def checksum_entries(root, checksum):
    entries = {}
    for line in checksum.read_text(encoding='utf-8').splitlines():
        match = re.fullmatch(r'([0-9a-f]{64})  (.+)', line)
        require(match is not None, f'Invalid SHA256SUMS line in {checksum}: {line!r}')
        expected, name = match.groups()
        require(name not in entries, f'Duplicate checksum path: {name}')
        path = within(root, checksum.parent, name)
        require(path.is_file() and not path.is_symlink(), f'Checksum target is not a file: {name}')
        require(sha256(path) == expected, f'Checksum mismatch: {path}')
        entries[name] = expected
    require(entries, f'Empty checksum list: {checksum}')
    return entries


def verify_links(root, path):
    text = path.read_text(encoding='utf-8')
    links = [m.group(1) or m.group(2) for m in re.finditer(r'!?\[[^\n]*?\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"[^"\n]*")?\)', text)]
    links += re.findall(r'(?:href|src)=["\']([^"\']+)["\']', text)
    count = 0
    for link in links:
        split = urllib.parse.urlsplit(link)
        if split.scheme or split.netloc or not split.path:
            continue
        # Documentation may link to maintenance tools elsewhere in this repository.
        within(root.parent, path.parent, urllib.parse.unquote(split.path))
        count += 1
    return count


def verify_badging(root, folder, package):
    evidence = package.get('badging')
    require(isinstance(evidence, dict), 'Missing aapt badging evidence')
    stdout_path = within(root, folder, evidence.get('stdout'))
    stderr_path = within(root, folder, evidence.get('stderr'))
    expected = root / 'verification/apks' / package['gitBlobSha']
    require(stdout_path.resolve() == expected / 'badging.stdout.txt' and stderr_path.resolve() == expected / 'badging.stderr.txt', 'Badging evidence path must identify this exact Git blob')
    output = stdout_path.read_text(encoding='utf-8')
    match = re.search(r"^package: name='([^']+)' versionCode='([^']+)' versionName='([^']*)'", output, re.M)
    require(match is not None, 'Missing package identity in stored aapt output')
    for key, actual in zip(('packageName', 'versionCode', 'versionName'), match.groups()):
        require(str(package.get(key)) == actual, f'{key} differs from stored aapt output')
    for key, label in [('minSdk', 'sdkVersion'), ('targetSdk', 'targetSdkVersion')]:
        sdk = re.search(r'^' + label + r":'([^']+)'", output, re.M)
        if sdk:
            require(str(package.get(key)) == sdk.group(1), f'{key} differs from stored aapt output')
    native = re.search(r'^native-code:(.*)$', output, re.M)
    codes = re.findall(r"'([^']+)'", native.group(1)) if native else []
    require(package.get('nativeCode') == codes, 'nativeCode differs from stored aapt output')


def verify_signature(root, folder, package):
    signature = package.get('signature')
    require(isinstance(signature, dict) and signature.get('verified') is True, 'APK signature was not recorded as verified')
    stdout_path = within(root, folder, signature.get('stdout'))
    stderr_path = within(root, folder, signature.get('stderr'))
    expected = root / 'verification/apks' / package['gitBlobSha']
    require(stdout_path.resolve() == expected / 'signature.stdout.txt' and stderr_path.resolve() == expected / 'signature.stderr.txt', 'Signature evidence path must identify this exact Git blob')
    stdout = stdout_path.read_text(encoding='utf-8')
    stderr = stderr_path.read_text(encoding='utf-8')
    require(re.search(r'^Verifies\s*$', stdout, re.M), 'Stored apksigner output does not report Verifies')
    require('DOES NOT VERIFY' not in stdout + stderr, 'Stored signature verification failed')
    schemes = {name: value == 'true' for name, value in re.findall(r'^Verified using (v[0-9.]+) scheme.*: (true|false)\s*$', stdout, re.M)}
    require(schemes and isinstance(signature.get('schemes'), dict), 'Missing signature schemes')
    require(signature['schemes'] == schemes, 'Manifest signature schemes differ from apksigner evidence')
    certs = [{'signer': int(number), 'sha256': digest.lower()} for number, digest in re.findall(r'^Signer #(\d+) certificate SHA-256 digest: ([0-9a-fA-F]{64})\s*$', stdout, re.M)]
    require(certs and signature.get('certificates') == certs, 'Manifest certificates differ from apksigner evidence')
    return certs


def verify_package(root, folder, package, expected):
    source = package.get('sourcePath')
    require(source in expected, f'Unexpected APK source path: {source}')
    entry = expected[source]
    name = package.get('file')
    require(name == Path(source).name, 'Imported APK must retain its original filename')
    path = within(root, folder, name)
    require(path.is_file(), f'Missing APK: {name}')
    data = path.read_bytes()
    require(0 < len(data) < LIMIT and len(data) == package.get('bytes') == entry['size'], f'APK size mismatch: {name}')
    digest = hashlib.sha256(data).hexdigest()
    git_blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    require(digest == package.get('sha256'), f'APK SHA256 mismatch: {name}')
    require(git_blob == package.get('gitBlobSha') == entry['sha'], f'APK Git blob mismatch: {name}')
    with zipfile.ZipFile(path) as apk:
        require(apk.testzip() is None, f'APK ZIP CRC failure: {name}')
        require('AndroidManifest.xml' in apk.namelist(), f'APK missing AndroidManifest.xml: {name}')
    for key in ('packageName', 'versionName', 'versionCode', 'minSdk', 'targetSdk', 'nativeCode', 'signature'):
        require(key in package, f'Missing APK metadata {key}: {name}')
    require(isinstance(package['packageName'], str) and re.fullmatch(r'[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+', package['packageName']), f'Invalid package name: {name}')
    require(isinstance(package['nativeCode'], list), f'nativeCode must be a list: {name}')
    verify_badging(root, folder, package)
    certs = verify_signature(root, folder, package)
    return {'file': path.relative_to(root).as_posix(), 'sourcePath': source, 'bytes': len(data), 'sha256': digest,
            'gitBlobSha': git_blob, 'packageName': package['packageName'], 'certificates': certs}


def verify_assets(root, folder, manifest):
    assets = read_json(folder / 'assets.json')
    require(isinstance(assets, dict), 'assets.json must be an object')
    representative = assets.get('representativeApk')
    packages = [p for p in manifest['packages'] if p['file'] == representative]
    require(len(packages) == 1 and representative == manifest.get('representativeApk'), 'Artwork representative APK differs from manifest')
    package = packages[0]
    require(assets.get('representativeApkSha256') == package['sha256'], 'Artwork representative APK hash differs')
    apk_path = within(root, folder, representative)

    def asset_file(item, required_file=None):
        require(isinstance(item, dict), 'Missing artwork metadata')
        name = item.get('file')
        require(isinstance(name, str) and Path(name).name == name, 'Artwork must be in the application folder')
        require(required_file is None or name == required_file, 'Unexpected artwork filename')
        path = within(root, folder, name)
        data = path.read_bytes()
        require(len(data) == item.get('bytes') and hashlib.sha256(data).hexdigest() == item.get('sha256'), f'Artwork size/hash mismatch: {name}')
        return path, data

    def raster_identity(item, data):
        with Image.open(io.BytesIO(data)) as image:
            image.load()
            require(image.size == (item.get('width'), item.get('height')), 'Artwork dimensions differ from metadata')

    original = assets.get('originalLogo')
    rendered = assets.get('renderedLogo')
    with zipfile.ZipFile(apk_path) as apk:
        if original:
            original_path, data = asset_file(original)
            require(original.get('method') == 'exact-apk-zip-entry', 'Original artwork method must identify exact ZIP bytes')
            require(apk.read(original.get('apkResource')) == data, 'Original logo differs from APK resource bytes')
            raster_identity(original, data)
        if rendered:
            rendered_path, data = asset_file(rendered)
            require(rendered.get('method') == 'inkscape-render-of-android-vector' and rendered.get('originalZipBytes') is False, 'Rendered artwork must not claim original ZIP bytes')
            raster_identity(rendered, data)
            source_svg = within(root, folder, rendered.get('sourceSvg'))
            require(sha256(source_svg) == rendered.get('sourceSvgSha256'), 'Rendered artwork source SVG hash differs')
            verify_svg(source_svg, maximum_bytes=2 * 1024 * 1024)
            require(rendered.get('apkResource') in apk.namelist(), 'Rendered artwork APK resource does not exist')
        logo_path, _ = asset_file(assets.get('logo'), 'logo.svg')
        logo = assets['logo']
        require(logo.get('apkResource') in apk.namelist(), 'Logo APK resource does not exist')
        require(logo.get('method') in ('android-vector-conversion', 'palette-run-vectorization'), 'Unknown vector conversion method')
        require(logo.get('approximate') is (logo['method'] == 'palette-run-vectorization'), 'Logo approximation must be declared accurately')
        if logo['method'] == 'palette-run-vectorization':
            require(original or rendered, 'Palette vectorization must preserve its raster source')
            require(logo.get('apkResource') == (original or rendered).get('apkResource'), 'Palette vector source differs from preserved image')
    thumb_path, _ = asset_file(assets.get('thumb'), 'thumb.png')
    thumb = assets['thumb']
    require(thumb.get('width') == 960 and thumb.get('height') == 540, 'Cover metadata dimensions must be 960×540')
    require(thumb.get('method') == 'chromium-catalog-card', 'Unexpected cover generation method')
    require(thumb.get('screenshotOfApplication') is False and thumb.get('physicalTvCapture') is False, 'Generated cover must not claim an application or physical-TV screenshot')
    require(thumb.get('label') == '应用介绍封面 · 非运行截图' and thumb.get('textOverflow') is False, 'Generated cover must declare its label and layout result')
    svg = verify_svg(logo_path)
    png = verify_png(thumb_path)
    return {'logo': svg, 'thumb': png, 'originalIconBytesVerified': bool(original),
            'renderedIconProvenanceChecked': bool(rendered), 'representativeApk': representative}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path('fork'))
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    root = args.root.resolve()
    report = {'schemaVersion': 1, 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'root': str(root), 'status': 'failed', 'checks': [], 'packages': [], 'warnings': [],
              'apkExecutionPerformed': False, 'signatureVerificationRerun': False,
              'physicalTvTested': False, 'malwareScanPerformed': False}

    def check(name, callback):
        try:
            details = callback()
            report['checks'].append({'name': name, 'passed': True, 'details': details})
            return details
        except (Invalid, OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile, ET.ParseError, zlib.error, struct.error) as error:
            report['checks'].append({'name': name, 'passed': False, 'error': str(error)})
            return None

    def inventory_check():
        require(root.is_dir() and not root.is_symlink(), 'Import root must be a regular directory')
        for path in root.rglob('*'):
            require(not path.is_symlink(), f'Symlink in import: {path}')
        catalog = read_json(root / 'catalog.json')
        tree = read_json(root / 'upstream/tree.json')
        commit = read_json(root / 'upstream/commit.json')
        inventory = read_json(root / 'upstream/inventory.json')
        source = catalog.get('source', {})
        require(source.get('repository') == REPOSITORY, 'Unexpected source repository')
        require(re.fullmatch(r'[0-9a-f]{40}', source.get('commit', '')), 'Source commit must be immutable full SHA')
        require(source.get('thresholdExclusiveBytes') == LIMIT, 'Size threshold must be exclusive 10,000,000 bytes')
        require(inventory.get('commit') == source['commit'], 'Catalog/inventory source commits differ')
        require(commit.get('sha') == source['commit'], 'Archived commit differs from catalog source')
        require(tree.get('sha') in {source['commit'], commit.get('commit', {}).get('tree', {}).get('sha')}, 'Archived tree does not identify the pinned source commit/tree')
        require(inventory.get('thresholdExclusiveBytes') == LIMIT, 'Inventory threshold differs')
        require(isinstance(catalog.get('apps'), list), 'Catalog apps must be a list')
        require(tree.get('truncated') is False, 'Upstream tree must be complete and explicitly untruncated')
        expected = {row['path']: row for row in tree['tree'] if row['type'] == 'blob' and row['path'].lower().endswith('.apk') and row['size'] < LIMIT}
        require(expected, 'No eligible upstream APKs')
        require({x['upstreamPath'] for x in inventory['candidates']} == set(expected), 'Stored inventory does not match upstream eligible tree')
        for item in inventory['candidates']:
            row = expected[item['upstreamPath']]
            require(item['bytes'] == row['size'] and item['gitBlobSha'] == row['sha'], 'Inventory tree identity mismatch')
        return {'catalog': catalog, 'expected': expected, 'source': source}

    context = check('upstream-inventory', inventory_check)
    if context:
        # Keep report small; store provenance/counts instead of duplicate full source trees.
        report['checks'][-1]['details'] = {'source': context['source'], 'eligibleApks': len(context['expected'])}
        catalog, expected = context['catalog'], context['expected']
        recorded, local_apks, app_dirs, counts, app_counts = [], set(), [], collections.Counter(), collections.Counter()
        ids, app_package_names = [], []
        for app in catalog.get('apps', []):
            app_id = app.get('id')
            ids.append(app_id)

            def verify_app(app=app):
                folder = within(root, root, app['path'])
                require(folder.is_dir(), f'App path is not a directory: {app["path"]}')
                manifest_path = within(root, root, app['manifest'])
                require(manifest_path == folder / 'manifest.json', 'Catalog manifest path must be in its app folder')
                manifest = read_json(manifest_path)
                require(isinstance(manifest.get('schemaVersion'), int) and manifest['schemaVersion'] >= 1, 'Invalid manifest schemaVersion')
                require(manifest.get('name') == app['name'] and manifest.get('category') == app['category'], 'App name/category differ from manifest')
                require(manifest.get('id') == app['id'], 'App ID differs from manifest')
                require(manifest.get('source') == catalog['source'], 'Manifest source provenance differs from catalog')
                require('provider' in manifest and manifest['provider'] is None, 'Provider must remain null when original author is unknown')
                packages = manifest.get('packages')
                require(isinstance(packages, list) and packages and app['apkCount'] == len(packages), 'Invalid app package count')
                package_names = {package.get('packageName') for package in packages}
                require(len(package_names) == 1 and None not in package_names, 'An application folder must contain exactly one Android package name')
                app_package_names.extend(package_names)
                require(folder.relative_to(root).parts[0] == app['category'], 'Folder category differs from catalog')
                app_dirs.append(folder)
                app_counts[app['category']] += 1
                for package in packages:
                    source = package.get('sourcePath')
                    recorded.append(source)
                    require(CATEGORY_MAP.get((source or '').split('/')[0]) == app['category'], f'Unexpected category for {source}')
                    counts[app['category']] += 1
                    result = check(f'apk:{source}', lambda package=package: verify_package(root, folder, package, expected))
                    if result:
                        report['packages'].append(result)
                        local_apks.add(result['file'])
                assets = verify_assets(root, folder, manifest)
                checksum = checksum_entries(root, folder / 'SHA256SUMS.txt')
                actual_files = {p.relative_to(folder).as_posix() for p in folder.rglob('*') if p.is_file() and p.name != 'SHA256SUMS.txt'}
                require(set(checksum) == actual_files, 'App SHA256SUMS must cover every ordinary file except itself')
                links = verify_links(root, folder / 'README.md')
                return {'packages': len(packages), 'assets': assets, 'localReadmeLinks': links}

            check(f'app:{app_id}', verify_app)

        def complete_check():
            require(ids and len(ids) == len(set(ids)), 'Missing/duplicate app IDs')
            require(len(app_package_names) == len(ids) == len(set(app_package_names)), 'Each Android package name must belong to exactly one application folder')
            require(catalog.get('appCount') == len(ids), 'Catalog total appCount differs')
            require(catalog.get('apkCount') == len(recorded), 'Catalog total apkCount differs')
            require(catalog.get('apkBytes') == sum(x['size'] for x in expected.values()), 'Catalog total apkBytes differs')
            require(len(recorded) == len(set(recorded)), 'Upstream APK imported more than once')
            require(set(recorded) == set(expected), f'APK coverage mismatch: missing={sorted(set(expected)-set(recorded))}, extra={sorted(set(recorded)-set(expected))}')
            actual_apks = {p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file() and p.suffix.lower() == '.apk'}
            require(actual_apks == local_apks, 'Unlisted or failed APK found in import')
            categories = catalog.get('categories')
            require(isinstance(categories, list) and categories, 'Missing catalog categories')
            category_ids = [row['id'] for row in categories]
            require(len(category_ids) == len(set(category_ids)), 'Duplicate category IDs')
            require(set(counts) <= set(category_ids), 'Missing category summary')
            for row in categories:
                require(row['appCount'] == app_counts[row['id']] and row['apkCount'] == counts[row['id']], f'Category counts differ: {row["id"]}')
            checksums = checksum_entries(root, root / 'SHA256SUMS.txt')
            expected_sums = actual_apks | {(folder / 'SHA256SUMS.txt').relative_to(root).as_posix() for folder in app_dirs}
            require(set(checksums) == expected_sums, 'Root SHA256SUMS must cover all APKs and app checksum files')
            known_sums = {root / 'SHA256SUMS.txt'} | {folder / 'SHA256SUMS.txt' for folder in app_dirs}
            additional_sums = {}
            for checksum in sorted(root.rglob('SHA256SUMS.txt')):
                if checksum not in known_sums:
                    additional_sums[checksum.relative_to(root).as_posix()] = len(checksum_entries(root, checksum))
            readme_links = sum(verify_links(root, p) for p in root.rglob('README.md') if 'upstream' not in p.relative_to(root).parts)
            return {'appCount': len(ids), 'apkCount': len(recorded), 'apkBytes': sum(x['size'] for x in expected.values()),
                    'categoryApkCounts': dict(counts), 'readmeLocalLinks': readme_links,
                    'additionalChecksumLists': additional_sums}

        summary = check('complete-coverage-and-index', complete_check)
        if summary:
            report['summary'] = summary
        certificates = collections.defaultdict(set)
        for package in report['packages']:
            certificates[package['packageName']].add(tuple(x['sha256'] for x in package['certificates']))
        for name, values in certificates.items():
            if len(values) > 1:
                report['warnings'].append({'code': 'different-certificates', 'packageName': name,
                                           'message': 'Preserved upstream APKs have different certificates; Android may reject in-place upgrades.'})
    report['passedChecks'] = sum(item['passed'] for item in report['checks'])
    report['failedChecks'] = sum(not item['passed'] for item in report['checks'])
    report['status'] = 'passed' if report['checks'] and report['failedChecks'] == 0 else 'failed'
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': report['status'], 'passedChecks': report['passedChecks'], 'failedChecks': report['failedChecks'],
                      'summary': report.get('summary'), 'warnings': report['warnings'], 'report': str(args.report)}, ensure_ascii=False))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    sys.exit(main())
