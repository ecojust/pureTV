#!/usr/bin/env python3
"""Verify a prepared nine-game publication and export its changed resource files."""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import zipfile
from pathlib import Path

from resource_catalog import digest, verify_catalog

GAMES = ('tank', 'jackal', 'jewel', 'tetris', 'bomb-jack', 'adventure-island', 'super-mario', 'coast-kart', 'cozy-island')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-sha', required=True)
    parser.add_argument('--build-tools', type=Path, required=True)
    args = parser.parse_args()
    assert re.fullmatch(r'[a-f0-9]{40}', args.source_sha), 'Exact source SHA required'
    root = Path(__file__).resolve().parents[1]
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
    assert head == args.source_sha, 'Checkout must match the verified source build'
    verify_catalog(root, args.build_tools)
    packages = []
    for game in GAMES:
        folder = root / 'resource/apps' / game
        metadata_file = folder / 'resource.json'
        metadata = json.loads(metadata_file.read_text())
        assert metadata['sourceCommit'] == args.source_sha, f'{game}: incorrect build provenance'
        old = json.loads(subprocess.check_output(['git', 'show', f'{args.source_sha}:resource/apps/{game}/resource.json'], cwd=root))
        assert metadata['versionCode'] > old['versionCode'], f'{game}: versionCode must increase for an update'
        count = 0
        with zipfile.ZipFile(folder / metadata['apk']) as archive:
            assert len(archive.namelist()) == len(set(archive.namelist())), f'{game}: duplicate APK entries'
            for asset in sorted((folder / 'src/main/assets').rglob('*')):
                assert not asset.is_symlink(), f'{game}: source assets must be regular files'
                if not asset.is_file():
                    continue
                name = 'assets/' + asset.relative_to(folder / 'src/main/assets').as_posix()
                assert archive.read(name) == asset.read_bytes(), f'{game}: packaged asset differs from source: {name}'
                count += 1
        assert count, f'{game}: no packaged source assets checked'
        for line in (folder / 'SHA256SUMS.txt').read_text().splitlines():
            expected, name = line.split('  ', 1)
            path = (folder / name).resolve()
            assert path.is_relative_to(folder.resolve()) and path.is_file(), f'{game}: invalid checksum path'
            assert digest(path) == expected, f'{game}: checksum mismatch for {name}'
        metadata['verification'] = {'sourceAssetsMatchApk': True, 'checkedSourceAssetFiles': count, 'signatureVerified': True, 'physicalTvTested': False}
        metadata_file.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
        packages.append({'game': game, 'apk': str((folder / metadata['apk']).relative_to(root)), 'version': metadata['version'], 'sha256': metadata['sha256'], 'checkedSourceAssetFiles': count})
    # Export precisely the changed resource files; deleted old APKs are recorded
    # separately so consumers do not mistake this for a complete repository tree.
    changed = subprocess.check_output(['git', 'diff', '--name-only', '-z', 'HEAD'], cwd=root).decode().split('\0')
    untracked = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard', '-z'], cwd=root).decode().split('\0')
    paths = sorted(set(filter(None, changed + untracked)))
    allowed_files = {'README.md', 'README.en.md', 'resource/README.md', 'docs/previews/en/native-captures.json'}
    for game in GAMES:
        allowed_files.add(f'docs/previews/en/app-{game}.png')
    def allowed(path):
        return path in allowed_files or any(path.startswith(f'resource/apps/{game}/') and not path.startswith(f'resource/apps/{game}/src/') for game in GAMES)
    assert paths and all(allowed(path) for path in paths), 'Publication changed files outside the game resource scope'
    output = Path(os.environ['RUNNER_TEMP']) / 'published-game-resources'
    output.mkdir(exist_ok=False)
    files, deleted = [], []
    for name in paths:
        source = root / name
        if not source.exists():
            deleted.append(name)
            continue
        assert source.is_file() and not source.is_symlink(), f'Invalid publication file: {name}'
        destination = output / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
        files.append({'path': name, 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest()})
    manifest = {'sourceCommit': args.source_sha, 'publicationRun': os.environ.get('GITHUB_RUN_ID'), 'games': packages, 'files': files, 'deleted': deleted}
    (output / 'publication-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'verifiedGames': len(packages), 'exportedFiles': len(files), 'deletedFiles': len(deleted)}))


if __name__ == '__main__':
    main()
