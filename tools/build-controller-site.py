#!/usr/bin/env python3
"""Build only the versioned, public Used Car Racing phone controller for Pages.

Run after checking out the intended source and fetching release tags. Historic
controllers come from their release commits, never from the current checkout.
No APK, private configuration, or other repository directory is copied.
"""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urlsplit


REPOSITORY = 'https://github.com/ecojust/pureTV'
APP = 'resource/apps/used-car-racing'
ASSETS = APP + '/src/main/assets/'
FILES = ('controller.html', 'controller.css', 'controller.js', 'steering.js', 'secure-controller.js')
SCRIPTS = ('secure-controller.js', 'steering.js', 'controller.js')
VERSION = re.compile(r'(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)')
TAG = re.compile(r'android-used-car-v(' + VERSION.pattern + r')')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def git(root, *arguments):
    return subprocess.check_output(['git', *arguments], cwd=root, stderr=subprocess.PIPE)


def version_from(data):
    matches = re.findall(r'^\s*versionName\s+[\'"]([^\'"\r\n]+)[\'"]\s*$', data.decode('utf-8'), re.M)
    require(len(matches) == 1 and VERSION.fullmatch(matches[0]), 'One stable semantic versionName is required')
    return matches[0]


def working_file(root, name):
    path = root / name
    relative = Path(name)
    for part in (relative, *relative.parents):
        require(not (root / part).is_symlink(), 'Controller source cannot contain symlinks: ' + name)
    require(path.is_file(), 'Missing controller source: ' + name)
    return path.read_bytes()


def tagged_file(root, commit, name, optional=False):
    entry = git(root, 'ls-tree', '-z', commit, '--', name)
    if not entry and optional:
        return None
    require(bool(entry), 'Release is missing controller source: ' + name)
    meta, path = entry.rstrip(b'\0').split(b'\t', 1)
    mode, kind, _ = meta.split(b' ')
    require(mode in (b'100644', b'100755') and kind == b'blob' and path.decode() == name,
            'Release controller source must be a regular file: ' + name)
    return git(root, 'show', commit + ':' + name)


class ControllerHTML(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.scripts = []
        self.styles = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        require(tag not in ('base', 'iframe', 'object', 'embed'), 'Controller HTML must remain self-contained')
        for key in ('src', 'href', 'action', 'poster'):
            if key not in attrs:
                continue
            value = attrs[key] or ''
            if tag == 'link' and attrs.get('rel') == 'icon' and value == 'data:,':
                continue
            parsed = urlsplit(value)
            require(not parsed.scheme and not parsed.netloc and not parsed.query and not parsed.fragment
                    and value in FILES and value != 'controller.html',
                    'Controller HTML asset URLs must be allowlisted relative filenames: ' + value)
        if tag == 'script':
            require(attrs.get('src') in SCRIPTS, 'Inline or unexpected controller script')
            self.scripts.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            self.styles.append(attrs.get('href'))

    handle_startendtag = handle_starttag


def validate_bridge_version(data, version):
    """The exported directory and both ends of the popup must use one version.

    The bridge's small constants block is a deliberate build contract. It is
    inspected without executing JavaScript from either the checkout or a tag.
    """
    source = data.decode('utf-8')
    declared = re.findall(r'\bvar\s+VERSION\s*=\s*[\'"]([^\'"\r\n]+)[\'"]\s*[,;]', source)
    require(declared == [version], 'Secure controller version must match its application/tag version: ' + version)
    require(re.search(r'(?:\bvar\s+|,\s*)PATH\s*=\s*[\'"]/pureTV/controller/used-car/[\'"]\s*\+\s*VERSION\s*\+\s*[\'"]/[\'"]\s*;', source)
            and re.search(r'\bvar\s+PAGE\s*=\s*ORIGIN\s*\+\s*PATH\s*;', source)
            and re.search(r'\blocation\.pathname\s*===\s*PATH\b', source),
            'Secure controller target and child detection must share the versioned PATH')


def validate_assets(files, version):
    require(set(files) == set(FILES), 'Incomplete controller asset set')
    parser = ControllerHTML()
    parser.feed(files['controller.html'].decode('utf-8'))
    parser.close()
    require(tuple(parser.scripts) == SCRIPTS, 'Controller script loading order must be secure bridge, steering, controller')
    require(parser.styles == ['controller.css'], 'Controller must use its local stylesheet')
    # This stylesheet needs no secondary assets. Keep future additions explicit.
    css = files['controller.css'].decode('utf-8')
    require(not re.search(r'@import\b|url\s*\(', css, re.I), 'Controller stylesheet has an undeclared asset dependency')
    require(all(files[name] for name in FILES), 'Controller assets cannot be empty')
    validate_bridge_version(files['secure-controller.js'], version)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def page(title, message):
    return ('<!doctype html><html lang="zh-CN"><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<meta name="color-scheme" content="dark">'
            '<title>' + title + '</title><style>body{max-width:44rem;margin:12vh auto;padding:24px;'
            'background:#101414;color:#e7eee8;font:18px/1.65 system-ui,sans-serif}'
            'h1{color:#d4f25a}a{color:#d4f25a}</style><h1>' + title + '</h1><p>' + message + '</p>'
            '<p>请先扫描电视里的房间二维码，在手机上选择「陀螺仪」。<br>'
            'Scan the TV room QR code, then choose Gyroscope on your phone.</p>'
            '<p><a href="' + REPOSITORY + '">pureTV · 桔子桑 / Source</a></p></html>\n').encode('utf-8')


def build_site(root, output):
    root = Path(root).resolve()
    output = Path(output)
    require(not output.is_symlink(), 'Output cannot be a symlink')
    require(not output.exists() or output.is_dir() and not any(output.iterdir()),
            'Output must be a new or empty directory; old files are not copied into the site')
    head = git(root, 'rev-parse', '--verify', 'HEAD^{commit}').decode().strip()
    require(re.fullmatch(r'[0-9a-f]{40}', head), 'An exact Git commit is required')
    current_version = version_from(working_file(root, APP + '/build.gradle'))
    current = {name: working_file(root, ASSETS + name) for name in FILES}
    validate_assets(current, current_version)
    releases = {}
    for tag in git(root, 'tag', '--list', 'android-used-car-v*').decode().splitlines():
        match = TAG.fullmatch(tag)
        if not match:
            continue
        version = match[1]
        commit = git(root, 'rev-parse', '--verify', 'refs/tags/' + tag + '^{commit}').decode().strip()
        if tagged_file(root, commit, ASSETS + 'secure-controller.js', optional=True) is None:
            # Versions before the HTTPS companion have nothing to preserve here.
            require(version != current_version,
                    'Published controller version collision: increment versionName before adding a companion')
            continue
        require(version_from(tagged_file(root, commit, APP + '/build.gradle')) == version,
                'Release tag and application version differ: ' + tag)
        files = {name: tagged_file(root, commit, ASSETS + name) for name in FILES}
        validate_assets(files, version)
        releases[version] = {'sourceCommit': commit, 'sourceTag': tag, 'workingTreeModified': False, 'files': files}
    if current_version in releases:
        require(current == releases[current_version]['files'],
                'Published controller version collision: increment versionName before changing its assets')
    else:
        changed = bool(git(root, 'status', '--porcelain', '--untracked-files=all', '--',
                           APP + '/build.gradle', *[ASSETS + name for name in FILES]))
        releases[current_version] = {'sourceCommit': head, 'sourceTag': None, 'workingTreeModified': changed, 'files': current}
    manifest = {'schemaVersion': 1, 'repository': REPOSITORY, 'currentVersion': current_version,
                'buildCommit': head, 'versions': []}
    writes = {}
    for version in sorted(releases, key=lambda value: tuple(map(int, value.split('.')))):
        release = releases[version]
        prefix = 'controller/used-car/' + version + '/'
        entry = {key: value for key, value in release.items() if key != 'files'}
        entry.update({'version': version, 'path': prefix, 'assets': []})
        for name in FILES:
            destination = 'index.html' if name == 'controller.html' else name
            data = release['files'][name]
            writes[prefix + destination] = data
            entry['assets'].append({'source': ASSETS + name, 'path': prefix + destination,
                                    'bytes': len(data), 'sha256': sha256(data)})
        manifest['versions'].append(entry)
    writes['index.html'] = page('极品二手车 · Used Car Racing', '手机驾驶控制器 / Phone driving controller')
    writes['404.html'] = page('控制器地址无效 / Controller not found', '请返回电视上的房间二维码重新连接。')
    writes['.nojekyll'] = b''
    writes['manifest.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    # Validate every release before writing anything, including an existing empty target.
    output.mkdir(parents=True, exist_ok=True)
    for name, data in writes.items():
        destination = output / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    manifest = build_site(args.root, args.output)
    print(json.dumps({'output': str(args.output), 'versions': [entry['version'] for entry in manifest['versions']],
                      'buildCommit': manifest['buildCommit']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
