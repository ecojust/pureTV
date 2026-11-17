#!/usr/bin/env python3
"""Verify complete ZIP/DMG contents and install exactly the verified Mac app."""
import argparse
import hashlib
import importlib.util
import json
import os
import plistlib
import re
import subprocess
from pathlib import Path, PurePosixPath


def file_record(path):
    assert path.is_file() and not any(p.is_symlink() for p in [path, *path.parents]), 'Symlinked package content: ' + str(path)
    return {'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def exact_files(app, expected):
    assert app.is_dir() and not app.is_symlink()
    actual = {}
    for path in sorted(app.rglob('*')):
        assert not path.is_symlink(), 'Symlinked package content: ' + str(path)
        if path.is_file():
            actual[path.relative_to(app).as_posix()] = file_record(path)
    assert actual == expected, 'Installed application file set or content differs from build manifest'


def check(app, meta):
    exact_files(app, meta['appFiles'])
    info = plistlib.loads((app / 'Contents/Info.plist').read_bytes())
    assert info['CFBundleShortVersionString'] == meta['version']
    assert info['CFBundleVersion'] == meta['buildVersion']
    assert info['CFBundleIdentifier'] == meta['bundleIdentifier']
    assert info['CFBundleName'] + '.app' == meta['appName']
    assert re.fullmatch(r'[A-Za-z][A-Za-z0-9]{0,63}', info['CFBundleExecutable'])
    binary = app / 'Contents/MacOS' / info['CFBundleExecutable']
    archs = subprocess.check_output(['lipo', '-archs', str(binary)], text=True).split()
    assert set(archs) == {'arm64', 'x86_64'}
    subprocess.run(['codesign', '--verify', '--deep', '--strict', str(app)], check=True)
    signature = subprocess.check_output(['codesign', '--display', '--verbose=4', str(app)], stderr=subprocess.STDOUT, text=True)
    assert 'Signature=adhoc' in signature, 'Expected individual ad-hoc application signature'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--artifact-source-checkout', type=Path)
    args = parser.parse_args()
    root = args.directory.resolve()
    meta = json.loads((root / 'build-manifest.json').read_text())
    assert re.fullmatch('[a-f0-9]{40}', meta['sourceCommit'])
    assert meta['committedInputsVerified'] is True
    assert meta['signature'] == 'ad-hoc' and meta['appleNotarized'] is False
    assert set(meta['architectures']) == {'arm64', 'x86_64'}
    assert '/' not in meta['appName'] and meta['appName'].endswith('.app')
    for name in meta['appFiles']:
        path = PurePosixPath(name)
        assert name == path.as_posix() and not path.is_absolute() and '..' not in path.parts
    provenance = {'artifactSourceCommit': meta['sourceCommit'], 'qaSourceCommit': os.environ['GITHUB_SHA']}
    if args.artifact_source_checkout:
        reuse_tool = 'macos-reuse.py' if meta['game'] in {'cf-transport-ship', 'qq-speed'} else 'macos-catalog-reuse.py'
        spec = importlib.util.spec_from_file_location('reuse', Path(__file__).with_name(reuse_tool))
        reuse = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(reuse)
        provenance = reuse.verify_source(meta, args.artifact_source_checkout.resolve(), Path(__file__).resolve().parents[2])
    else:
        assert meta['sourceCommit'] == os.environ['GITHUB_SHA']
        spec = importlib.util.spec_from_file_location('builder', Path(__file__).with_name('macos-build.py'))
        builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        game = builder.ROOT / 'joystick-games' / meta['game']
        assert meta['inputFiles'] == builder.inputs(game), 'Current frozen input set differs from package source'
        builder.verify_committed(builder.ROOT, meta['inputFiles'], meta['sourceCommit'])
    assert len(meta['packages']) == 2
    for name, value in meta['packages'].items():
        assert name == Path(name).name and re.fullmatch(r'[A-Za-z0-9_.-]+\.(zip|dmg)', name)
        assert file_record(root / name) == value, 'Package hash mismatch: ' + name
    zipfile = next(root / n for n in meta['packages'] if n.endswith('.zip'))
    dmg = next(root / n for n in meta['packages'] if n.endswith('.dmg'))
    for name in ['zip-copy', 'installed', 'mount']:
        assert not (root / name).exists(), 'Retain prior package verification; use a fresh copy'
    subprocess.run(['ditto', '-x', '-k', str(zipfile), str(root / 'zip-copy')], check=True)
    check(root / 'zip-copy' / meta['appName'], meta)
    mount = root / 'mount'
    mount.mkdir()
    subprocess.run(['hdiutil', 'attach', '-readonly', '-nobrowse', '-mountpoint', str(mount), str(dmg)], check=True)
    try:
        check(mount / meta['appName'], meta)
        assert (mount / 'Applications').is_symlink() and os.readlink(mount / 'Applications') == '/Applications'
        subprocess.run(['ditto', str(mount / meta['appName']), str(root / 'installed' / meta['appName'])], check=True)
    finally:
        subprocess.run(['hdiutil', 'detach', str(mount)], check=True)
    check(root / 'installed' / meta['appName'], meta)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({'status': 'passed', **provenance, 'sourceCommit': meta['sourceCommit'], 'game': meta['game'], 'version': meta['version'], 'buildVersion': meta['buildVersion'], 'zipDmgAndInstalledCopyVerified': True, 'completeFileSetVerified': True, 'architectures': ['arm64', 'x86_64'], 'signature': 'ad-hoc', 'appleNotarized': False}, indent=2) + '\n')


if __name__ == '__main__':
    main()
