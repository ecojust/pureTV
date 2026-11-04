#!/usr/bin/env python3
"""Local Game Kit build/extract/request helpers. Never commits, pushes or dispatches."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import sys
import tarfile
import zipfile

GAMES = ('glass-fold', 'prism-relay', 'tension-span', 'conveyor-window',
         'packing-sculptor', 'tower-overlap', 'torch-bridge', 'twenty-four')
TOOLCHAIN = Path('/workspace/scratch/game-polish-toolchain')

def command(args, **kwargs):
    return subprocess.run([str(x) for x in args], check=True, **kwargs)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def extract(apk, target):
    target = target.resolve()
    if target.exists() and any(target.iterdir()):
        raise ValueError(f'Refusing to overwrite non-empty asset evidence: {target}')
    target.mkdir(parents=True, exist_ok=True)
    manifest = {}
    with zipfile.ZipFile(apk) as archive:
        assert archive.testzip() is None, 'Corrupt APK ZIP'
        assert len(archive.namelist()) == len(set(archive.namelist())), 'Duplicate ZIP entries'
        for name in archive.namelist():
            if not name.startswith('assets/') or name.endswith('/'):
                continue
            rel = Path(name.removeprefix('assets/'))
            assert not rel.is_absolute() and '..' not in rel.parts
            path = target / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            data = archive.read(name)
            path.write_bytes(data)
            manifest[rel.as_posix()] = digest(data)
    assert 'assets-index.json' in manifest and 'game-config.json' in manifest
    return manifest

def source_export(repo, sha, games, output):
    assert re.fullmatch(r'[a-f0-9]{40}', sha), 'Pass an exact 40-character source SHA'
    paths = ['resource/game-kit/android/src/main', 'resource/game-kit/web']
    for slug in games:
        base = f'resource/apps/{slug}'
        paths.extend([base + '/game.json', base + '/src/main/assets'])
        for optional in ('icon.xml', 'logo.svg'):
            if subprocess.run(['git', '-C', str(repo), 'cat-file', '-e', sha + ':' + base + '/' + optional],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
                paths.append(base + '/' + optional)
    data = subprocess.check_output(['git', '-C', str(repo), 'archive', sha, *paths])
    output.mkdir(parents=True, exist_ok=False)
    with tarfile.open(fileobj=io.BytesIO(data)) as archive:
        for member in archive:
            assert member.isfile() or member.isdir(), 'Frozen source must contain regular files only'
        archive.extractall(output, filter='data')
    return output

parser = argparse.ArgumentParser(description=__doc__)
sub = parser.add_subparsers(dest='action', required=True)
build = sub.add_parser('build', help='Build selected games and extract exact APK assets for QA')
build.add_argument('--repo', type=Path, default=Path('/workspace/pureTV'))
build.add_argument('--output', required=True, type=Path)
build.add_argument('--source-sha', help='Build an isolated export of exactly this commit; omit only for preflight')
build.add_argument('--game', action='append', dest='games', choices=GAMES)
req = sub.add_parser('requests', help='Prepare request files from exact-commit builds; no network mutations')
req.add_argument('--repo', type=Path, default=Path('/workspace/pureTV'))
req.add_argument('--build-root', required=True, type=Path)
req.add_argument('--source-sha', required=True)
req.add_argument('--output', required=True, type=Path)
ext = sub.add_parser('extract', help='Extract the exact complete asset set from a verified APK')
ext.add_argument('--apk', required=True, type=Path)
ext.add_argument('--output', required=True, type=Path)
args = parser.parse_args()

if args.action == 'extract':
    manifest = extract(args.apk, args.output)
    print(json.dumps({'apk': str(args.apk), 'assets': str(args.output), 'assetCount': len(manifest)}))
elif args.action == 'build':
    repo = args.repo.resolve()
    out = args.output.resolve()
    if out.exists() and any(out.iterdir()):
        raise ValueError('Use a fresh output root for each build/QA attempt')
    out.mkdir(parents=True, exist_ok=True)
    games = args.games or list(GAMES)
    source = source_export(repo, args.source_sha, games, out/'source') if args.source_sha else repo
    config = json.loads((TOOLCHAIN/'toolchain.json').read_text())
    summary = {'sourceSha': args.source_sha, 'sourceDirectory': str(source),
               'builderSha256': digest((repo/'resource/game-kit/build.py').read_bytes()),
               'toolchainReceipt': str(TOOLCHAIN/'toolchain.json'), 'games': []}
    for slug in games:
        game_out = out/slug
        game_out.mkdir()
        invocation = [sys.executable, repo/'resource/game-kit/build.py',
                      '--kit', source/'resource/game-kit', '--game', source/'resource/apps'/slug,
                      '--output', game_out/'build', '--sdk', config['sdk'], '--jdk', config['jdk'],
                      '--zxing', config['zxing'], '--cache', TOOLCHAIN/'dex-cache']
        with (game_out/'build.log').open('w') as log:
            command(invocation, stdout=log, stderr=subprocess.STDOUT)
        receipt = json.loads((game_out/'build/build-receipt.json').read_text())
        assets = extract(game_out/'build/unsigned.apk', game_out/'assets')
        assert assets == receipt['assets'], 'Extracted assets differ from build receipt'
        summary['games'].append({'slug': slug, 'version': receipt['version'], 'bytes': receipt['bytes'],
                                 'sha256': receipt['sha256'], 'assets': assets,
                                 'buildDirectory': str(game_out/'build')})
        (out/'batch-receipt.json').write_text(json.dumps(summary, indent=2)+'\n')
        print(json.dumps({key: summary['games'][-1][key] for key in ('slug', 'version', 'bytes', 'sha256')}), flush=True)
elif args.action == 'requests':
    summary = json.loads((args.build_root/'batch-receipt.json').read_text())
    assert re.fullmatch(r'[a-f0-9]{40}', args.source_sha)
    assert summary['sourceSha'] == args.source_sha, 'Requests require builds made from this exact frozen commit'
    for row in summary['games']:
        folder = Path(row['buildDirectory'])
        receipt = json.loads((folder/'build-receipt.json').read_text())
        assert receipt['sha256'] == row['sha256'] and receipt['assets'] == row['assets']
        assert digest((folder/'unsigned.apk').read_bytes()) == row['sha256']
        target = args.output/'requests'/row['slug']
        assert not target.exists(), f'Refusing to replace request: {target}'
        command([sys.executable, args.repo/'resource/game-kit/prepare-signing-request.py',
                 '--build', folder, '--source-sha', args.source_sha, '--output', args.output])
