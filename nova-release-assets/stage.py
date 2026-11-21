"""Upload the six agreed files to one existing draft without replacing release assets."""
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
import hashlib
import json
import os
import re
import subprocess

REPO = 'ecojust/pureTV'
TAG = 'joystick-nova-lancer-v0.1.0'
SOURCE = 'fe2b6428f0ecfed33d6d1c903a6c7d4d50914aba'
RELEASE = f'repos/{REPO}/releases/453447634'
PACKAGES = {
    'nova-lancer-0.1.0.apk',
    'NovaLancer-0.1.0-macos-universal.dmg',
    'NovaLancer-0.1.0-macos-universal.zip',
    'NovaLancer-0.1.0-windows-x64-setup.exe',
    'NovaLancer-0.1.0-windows-x64.zip',
}
SUMS = 'SHA256SUMS.txt'


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def validate_inputs(directory, expected_manifest):
    assert set(p.name for p in directory.iterdir()) == PACKAGES | {SUMS}
    assert re.fullmatch(r'[0-9a-f]{64}', expected_manifest)
    assert all(p.is_file() and not p.is_symlink() for p in directory.iterdir())
    assert digest(directory / SUMS) == expected_manifest
    values = {}
    for line in (directory / SUMS).read_text(encoding='ascii').splitlines():
        row = re.fullmatch(r'([a-f0-9]{64}) [ *](\S+)', line)
        assert row, f'Unexpected checksum record: {line}'
        checksum, name = row.groups()
        assert name in PACKAGES and name not in values, name
        path = directory / name
        assert path.stat().st_size and digest(path) == checksum, name
        values[name] = checksum
    assert set(values) == PACKAGES
    values[SUMS] = expected_manifest
    return values


def api(*args):
    return json.loads(subprocess.check_output(['gh', 'api', *args]))


def assets():
    data = api(RELEASE)
    assert (data['id'], data['draft'], data['tag_name'], data['target_commitish']) == (453447634, True, TAG, SOURCE)
    assert data['url'] == 'https://api.github.com/' + RELEASE
    files = {a['name']: a for a in data['assets']}
    assert len(files) == len(data['assets']) and set(files) <= PACKAGES | {SUMS}
    return files


def verify(asset, path, checksum):
    assert asset['state'] == 'uploaded' and asset['name'] == path.name
    assert asset['size'] == path.stat().st_size and asset['digest'] == 'sha256:' + checksum


def main():
    directory = Path(__file__).resolve().with_name('files')
    values = validate_inputs(directory, os.environ['EXPECTED_MANIFEST_SHA256'])
    existing = assets()
    for name, asset in existing.items():
        verify(asset, directory / name, values[name])
    for name in [*sorted(PACKAGES), SUMS]:
        existing = assets()
        path = directory / name
        if name in existing:
            verify(existing[name], path, values[name])
            continue
        endpoint = 'https://uploads.github.com/' + RELEASE + '/assets?name=' + quote(name, safe='')
        request = Request(endpoint, data=path.read_bytes(), method='POST', headers={
            'Authorization': 'Bearer ' + os.environ['GH_TOKEN'],
            'Content-Type': 'application/octet-stream',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        })
        with urlopen(request, timeout=90) as response:
            created = json.load(response)
        verify(created, path, values[name])
    completed = assets()
    assert set(completed) == set(values)
    for name, checksum in values.items():
        verify(completed[name], directory / name, checksum)
        print(name, checksum)


if __name__ == '__main__':
    main()
