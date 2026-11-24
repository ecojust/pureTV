#!/usr/bin/env python3
"""Freeze the desktop client's APK marketplace for offline browsing on TV."""
import argparse
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from email.utils import format_datetime, parsedate_to_datetime
from hashlib import sha1
from html.parser import HTMLParser
from importlib import import_module
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import tempfile
import time
from urllib.parse import quote, unquote
from urllib.request import build_opener, HTTPRedirectHandler, Request
from xml.etree.ElementTree import ParseError

from resource_catalog import digest

safe_logo = import_module('update-tv-store-catalog').safe_logo

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / 'resource/apps/putrtv-store/src/main/assets/catalog-snapshot.json'
SOURCE = 'https://apps.b14f.com'
CATEGORIES = ('game', 'launcher', 'media')
MAX_APK = 512 * 1024 * 1024


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        return None


def request(path, method='GET', conditions=None):
    url = SOURCE + '/' + quote(path, safe='/')
    headers = {'Accept-Encoding': 'identity', **(conditions or {})}
    result = build_opener(NoRedirect()).open(Request(url, headers=headers, method=method), timeout=90)
    if result.status != 200 or result.headers.get('Content-Encoding', 'identity').lower() != 'identity':
        result.close()
        raise ValueError(f'Unexpected HTTP status or encoding for {path}')
    return result


def read_small(path, limit):
    with request(path) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError(f'Market file exceeds size limit: {path}')
    return data


class Directory(HTMLParser):
    def __init__(self):
        super().__init__()
        self.children = set()
        self.links = 0

    def handle_starttag(self, tag, attrs):
        if tag != 'a':
            return
        self.links += 1
        if self.links > 8192:
            raise ValueError('Marketplace directory has too many links')
        href = dict(attrs).get('href')
        if not href:
            return
        leaf = href.removesuffix('/')
        if not leaf or any(c in leaf for c in '/?#:\\') or re.search(r'%(?![0-9a-fA-F]{2})', leaf):
            return
        try:
            name = unquote(leaf, errors='strict')
        except UnicodeDecodeError:
            return
        if (not name.startswith('.') and '/' not in name and '\\' not in name and '\ufffd' not in name
                and not any(ord(c) < 32 or 127 <= ord(c) <= 159 for c in name)
                and len(name.encode()) <= 255):
            self.children.add((name, href.endswith('/')))


def discover():
    files = set()
    pending = list(CATEGORIES)
    with ThreadPoolExecutor(max_workers=6) as pool:
        while pending:
            children = []
            for folder, data in zip(pending, pool.map(lambda p: read_small(p + '/', 4 * 1024**2), pending)):
                html = data.decode('utf-8')
                if not all(s in html.lower() for s in ('<title>index of ', '<pre>', '</pre>')):
                    raise ValueError(f'Invalid marketplace directory: {folder}')
                page = Directory()
                page.feed(html)
                for name, is_dir in page.children:
                    path = folder + '/' + name
                    if is_dir and folder in CATEGORIES:
                        children.append(path)
                    elif not is_dir:
                        files.add(path)
            if len(files) > 8192 or len(children) > 256:
                raise ValueError('Marketplace directory traversal exceeds limits')
            pending = sorted(children)
    return files


def display(path):
    stem = PurePosixPath(path).name[:-4]
    match = re.fullmatch(r'(.+)-([0-9]{1,10}(?:\.[0-9]{1,10}){1,3})', stem)
    return match.groups() if match else (stem or PurePosixPath(path).name, '')


def selected(files):
    groups = defaultdict(list)
    for path in sorted(files):
        if path.lower().endswith('.apk'):
            name, version = display(path)
            group = (path.rpartition('/')[0], name)
            numbers = [int(n) for n in version.split('.')] if version else []
            extension = tuple(-ord(c) for c in path[-3:])
            key = (not bool(version), tuple(-n for n in (numbers + [0] * 4)[:4]), -len(numbers), extension, path)
            groups[group].append((key, path))
    return [p for group in sorted(groups) for _, p in sorted(groups[group])[:5]]


def validators(headers):
    size = int(headers.get('Content-Length', '0'))
    etag = headers.get('ETag', '')
    date = headers.get('Last-Modified', '')
    if not re.fullmatch(r'"[!#-~\x80-\xff]{0,510}"', etag):
        etag = ''
    if date:
        try:
            if format_datetime(parsedate_to_datetime(date), usegmt=True) != date:
                date = ''
        except (TypeError, ValueError, OverflowError):
            date = ''
    if not 0 < size <= MAX_APK or not (etag or date):
        raise ValueError('APK requires bounded Content-Length and a valid ETag or Last-Modified header')
    return size, etag, date


def optional_manifest(path):
    try:
        value = json.loads(read_small(path, 65536))
    except (OSError, ValueError):
        return {}
    return value if isinstance(value, dict) else {}


def optional_logo(path):
    try:
        return safe_logo(read_small(path, 8192).decode('utf-8'))
    except (OSError, ValueError, ParseError):
        return ''


def manifest_data(manifest, filename, size):
    provider = manifest.get('provider')
    provider = provider.strip() if isinstance(provider, str) else ''
    if len(provider.encode()) > 512 or not provider.isprintable():
        provider = ''
    expected = set()
    packages = manifest.get('packages')
    for package in packages if isinstance(packages, list) else []:
        if not isinstance(package, dict) or package.get('file') != filename:
            continue
        if 'bytes' in package and (type(package['bytes']) is not int or package['bytes'] != size):
            raise ValueError(f'Invalid published size: {filename}')
        value = package.get('sha256')
        if value is not None:
            if not isinstance(value, str) or not re.fullmatch('[a-fA-F0-9]{64}', value):
                raise ValueError(f'Invalid published checksum: {filename}')
            expected.add(value.lower())
    if len(expected) > 1:
        raise ValueError(f'Conflicting published checksums: {filename}')
    return provider, next(iter(expected), '')


def apk_identity(apk, tools):
    badging = subprocess.check_output([tools / 'aapt', 'dump', 'badging', apk], text=True)
    package = re.search(r"^package: name='([^']+)' versionCode='(-?\d+)' versionName='([^\n]*?)'(?= [A-Za-z][A-Za-z0-9]*='|[ \t]*$)", badging, re.M)
    sdk = re.search(r"^sdkVersion:'(\d+)'$", badging, re.M)
    if not package or not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+', package[1]):
        raise ValueError('Invalid Android package name')
    if not sdk or not 1 <= int(sdk[1]) <= 1000 or len(package[1]) > 255 or len(package[3].encode('utf-16-le')) > 510:
        raise ValueError('Invalid Android SDK or package version name')
    # aapt prints only the signed low 32 bits in badging. Android 9+ also
    # uses the manifest's versionCodeMajor for its installed long version code.
    manifest = subprocess.check_output([tools / 'aapt', 'dump', 'xmltree', apk, 'AndroidManifest.xml'], text=True)
    major = re.search(r'android:versionCodeMajor\([^)]*\)=\(type 0x1[01]\)(0x[0-9a-fA-F]+)', manifest)
    if 'android:versionCodeMajor(' in manifest and not major:
        raise ValueError('Invalid Android major version code')
    code = ((int(major[1], 16) if major else 0) << 32) | (int(package[2]) & 0xffffffff)
    if not 1 <= code <= 0x7fffffffffffffff:
        raise ValueError('Invalid Android version code')
    signing = subprocess.check_output([tools / 'apksigner', 'verify', '--print-certs', apk], text=True)
    signers = re.findall(r'^Signer #\d+ certificate SHA-256 digest: ([0-9a-fA-F]{64})$', signing, re.M)
    if len(signers) != 1:
        raise ValueError('APK must have exactly one verified current signer for TV installation')
    return {'packageName': package[1], 'apkVersionName': package[3], 'versionCode': code,
            'minSdk': int(sdk[1]), 'certificateSha256': signers[0].lower(), 'sha256': digest(apk)}


def verify_package(path, tools, files, manifests):
    folder, _, filename = path.rpartition('/')
    with request(path, 'HEAD') as head:
        size, etag, date = validators(head.headers)
    provider, checksum = manifest_data(manifests.get(folder, {}), filename, size)
    conditions = {'If-Match': etag} if etag else {'If-Unmodified-Since': date}
    with tempfile.TemporaryDirectory(prefix='tv-market-') as temp:
        apk = Path(temp) / 'package.apk'
        blob = sha1(f'blob {size}\0'.encode())
        with request(path, conditions=conditions) as response, apk.open('wb') as output:
            if validators(response.headers) != (size, etag, date):
                raise ValueError(f'Market file changed during freeze: {path}')
            count = 0
            while chunk := response.read(1024**2):
                count += len(chunk)
                if count > size:
                    raise ValueError(f'Unexpected APK size: {path}')
                blob.update(chunk)
                output.write(chunk)
        if count != size:
            raise ValueError(f'Incomplete APK transfer: {path}')
        try:
            identity = apk_identity(apk, tools)
        except (ValueError, subprocess.CalledProcessError) as error:
            raise ValueError(f'Invalid Android package {path}: {error}') from error
        if checksum and identity['sha256'] != checksum:
            raise ValueError(f'Marketplace checksum mismatch: {path}')
    cover = next((name for name in (path[:-4] + '.thumb.png', path + '.thumb.png', folder + '/thumb.png')
                  if name in files), '')
    name, version = display(path)
    return {'id': path, 'apkPath': path, 'name': name, 'versionName': version, 'category': path.split('/')[0],
            'coverPath': cover, 'provider': provider, 'etag': etag, 'lastModified': date, 'bytes': count,
            'gitBlobSha': blob.hexdigest(), **identity}, bool(checksum)


def freeze(tools, output):
    files = discover()
    paths = selected(files)
    if len(paths) > 1024:
        raise ValueError('Too many packages for the TV marketplace')
    with ThreadPoolExecutor(max_workers=4) as pool:
        manifest_paths = sorted({p.rpartition('/')[0] + '/manifest.json' for p in paths} & files)
        manifests = dict(zip((p.rpartition('/')[0] for p in manifest_paths), pool.map(optional_manifest, manifest_paths)))
        results = list(pool.map(lambda p: verify_package(p, tools, files, manifests), paths))
        entries = [e for e, _ in results]
        logo_paths = sorted({p.rpartition('/')[0] + '/logo.svg' for p in paths} & files)
        logos = dict(zip(logo_paths, pool.map(optional_logo, logo_paths)))
        for entry in entries:
            entry['logoSvg'] = logos.get(entry['apkPath'].rpartition('/')[0] + '/logo.svg', '')
        covers = {entry['coverPath'] for entry in entries if entry['coverPath']}
    if files != discover():
        raise ValueError('Marketplace listing changed during freeze')
    snapshot = {'source': SOURCE, 'fetchedAt': int(time.time() * 1000), 'catalog': {'schemaVersion': 3, 'entries': entries}}
    with tempfile.NamedTemporaryFile(dir=output.parent, delete=False, mode='w', encoding='utf-8') as temp:
        temporary = Path(temp.name)
        try:
            json.dump(snapshot, temp, ensure_ascii=False, indent=2)
            temp.write('\n')
            temp.close()
            temporary.chmod(0o644)
            os.replace(temporary, output)
        finally:
            temporary.unlink(missing_ok=True)
    print(json.dumps({'source': SOURCE, 'verifiedPackages': len(entries), 'marketplaceChecksums': sum(ok for _, ok in results),
                      'covers': len(covers), 'logos': sum(bool(v) for v in logos.values()), 'verifiedBytes': sum(e['bytes'] for e in entries),
                      'groups': len({(p.rpartition('/')[0], display(p)[0]) for p in paths})}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build-tools', required=True, type=Path)
    parser.add_argument('--output', default=SNAPSHOT, type=Path)
    args = parser.parse_args()
    freeze(args.build_tools.resolve(), args.output)
