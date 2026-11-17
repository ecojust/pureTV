#!/usr/bin/env python3
"""Compose a dedicated game payload with the unmodified pureTV Android host."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
KIT = ROOT / 'resource/game-kit'
PACKAGES = {'cf-transport-ship': 'com.ecojust.joystickcf', 'qq-speed': 'com.ecojust.joystickqqspeed'}
PHONE = ('controller.html', 'controller.js', 'controller.css')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def record(path):
    assert path.is_file() and not path.is_symlink(), str(path)
    data = path.read_bytes()
    return {'bytes': len(data), 'sha256': sha(data)}


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def builder():
    spec = importlib.util.spec_from_file_location('original_game_kit_builder', KIT / 'build.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def metadata(slug):
    assert slug in PACKAGES, 'Unregistered joystick game'
    value = builder().metadata(ROOT / 'joystick-games' / slug)
    assert value['id'] == slug and value['packageName'] == PACKAGES[slug]
    return value


def sources(slug):
    metadata(slug)
    game = ROOT / 'joystick-games' / slug
    paths = [KIT / 'build.py', ROOT / 'tools/resource_catalog.py', ROOT / 'tools/puretv-release-certificate-v2.sha256',
             game / 'game.json', game / 'package.json', game / 'package-lock.json', game / 'build.mjs']
    paths += [KIT / 'web' / name for name in PHONE]
    for folder in [KIT / 'android/src/main', game / 'src', game / 'dist', ROOT / 'joystick-games/shared/web']:
        assert folder.is_dir() and not folder.is_symlink(), str(folder)
        for path in folder.rglob('*'):
            assert not path.is_symlink(), str(path)
            if path.is_file():
                paths.append(path)
    paths += list((ROOT / 'joystick-games/tools').glob('android-*.py'))
    workflow = ROOT / '.github/workflows/joystick-games-android.yml'
    if workflow.exists():
        paths.append(workflow)
    if (game / 'icon.xml').exists():
        paths.append(game / 'icon.xml')
    return {p.relative_to(ROOT).as_posix(): record(p) for p in sorted(set(paths))}


def assert_committed(inputs, commit):
    for name, expected in inputs.items():
        assert isinstance(name, str) and not Path(name).is_absolute() and '..' not in Path(name).parts
        assert '\\' not in name and '\x00' not in name, 'Invalid source input path'
        path = ROOT / name
        assert record(path) == expected, 'Source input changed: ' + name
        frozen = subprocess.check_output(['git', 'show', commit + ':' + name], cwd=ROOT)
        assert record(path) == {'bytes': len(frozen), 'sha256': sha(frozen)}, 'Input not frozen in source commit: ' + name


def prepare(slug, directory):
    """No existing native file is patched: only metadata and asset composition vary."""
    original = builder()
    game = ROOT / 'joystick-games' / slug
    meta = metadata(slug)
    kit = directory / 'kit'
    staged = directory / 'game'
    shutil.copytree(KIT / 'android/src/main', kit / 'android/src/main')
    (kit / 'web').mkdir()
    for name in PHONE:
        shutil.copyfile(KIT / 'web' / name, kit / 'web' / name)
    assets = staged / 'src/main/assets'
    assets.mkdir(parents=True)
    dist = original.checked_directory(game / 'dist', 'game distribution')
    for path in sorted(dist.iterdir()):
        assert path.is_file() and not path.is_symlink(), 'Distribution assets must be flat regular files'
        assert original.SAFE_ASSET.fullmatch(path.name) and path.suffix.lower() in original.ASSET_EXTENSIONS
        assert path.name not in PHONE and path.name not in ('game-config.json', 'assets-index.json')
        shutil.copyfile(path, assets / path.name)
    assert (assets / 'tv.html').is_file(), 'Build the committed Web game first'
    write(staged / 'game.json', meta)
    if (game / 'icon.xml').exists():
        shutil.copyfile(game / 'icon.xml', staged / 'icon.xml')
    original.KIT = kit
    return kit, staged, original.payload(staged)


def payload(slug):
    with tempfile.TemporaryDirectory(prefix='joystick-payload-') as temp:
        return prepare(slug, Path(temp))[2]


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--game', choices=PACKAGES, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--sdk', type=Path, required=True)
    p.add_argument('--jdk', type=Path, required=True)
    p.add_argument('--zxing', type=Path, required=True)
    p.add_argument('--cache', type=Path, required=True)
    p.add_argument('--require-committed', action='store_true')
    a = p.parse_args()
    out = a.output.absolute()
    assert not out.resolve().is_relative_to(ROOT.resolve()), 'Build output must be outside repository'
    assert not out.is_symlink() and not out.exists(), 'Use a new output directory'
    out.mkdir(parents=True)
    source_sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    inputs = sources(a.game)
    write(out / 'source-inputs.json', inputs)
    write(out / 'source-context.json', {'game': a.game, 'sourceSha': source_sha,
                                      'runId': os.environ.get('GITHUB_RUN_ID'), 'requireCommitted': a.require_committed})
    if a.require_committed:
        assert_committed(inputs, source_sha)
    with tempfile.TemporaryDirectory(prefix='compose-', dir=out) as temp:
        kit, staged, expected = prepare(a.game, Path(temp))
        write(out / 'payload-sha256.json', {n: {'bytes': len(v), 'sha256': sha(v)} for n, v in expected.items()})
        subprocess.run([sys.executable, str(KIT / 'build.py'), '--kit', str(kit), '--game', str(staged),
                        '--output', str(out / 'build'), '--cache', str(a.cache), '--sdk', str(a.sdk),
                        '--jdk', str(a.jdk), '--zxing', str(a.zxing)], check=True)
    apk = out / 'unsigned.apk'
    shutil.move(out / 'build/unsigned.apk', apk)
    receipt = json.loads((out / 'build/build-receipt.json').read_text())
    shutil.rmtree(out / 'build')
    with zipfile.ZipFile(apk) as archive:
        assert archive.testzip() is None
        actual = {n[7:]: archive.read(n) for n in archive.namelist() if n.startswith('assets/')}
        assert actual == expected, 'Packaged assets differ from composed source'
        content = {n: sha(archive.read(n)) for n in archive.namelist() if not n.endswith('/')}
    after = sources(a.game)
    if inputs != after:
        write(out / 'source-inputs.after.json', after)
        raise AssertionError('Inputs changed during build; both source snapshots are preserved')
    receipt.update(sourceSha=source_sha, runId=os.environ.get('GITHUB_RUN_ID'),
                   committedInputsVerified=a.require_committed, contentSha256=content,
                   sourceInputsSha256=sha((json.dumps(inputs, sort_keys=True, separators=(',', ':'))).encode()),
                   physicalTvTested=False, physicalEsp32Tested=False)
    write(out / 'build-receipt.json', receipt)
    print(json.dumps({'game': a.game, 'apk': str(apk), 'bytes': apk.stat().st_size, 'sha256': sha(apk.read_bytes()), 'unsigned': True}))


if __name__ == '__main__':
    main()
