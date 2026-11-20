#!/usr/bin/env python3
"""Compose a dedicated game payload with the unmodified pureTV Android host."""
import argparse
import hashlib
import importlib.util
import json
import os
import re
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
KIT = ROOT / 'resource/game-kit'
LEGACY_PACKAGES = {'cf-transport-ship': 'com.ecojust.joystickcf', 'qq-speed': 'com.ecojust.joystickqqspeed'}
REGISTRY = 'joystick-games/catalog-registry.json'
CATALOG_WORKFLOW = '.github/workflows/joystick-catalog-android.yml'
PHONE = ('controller.html', 'controller.js', 'controller.css')
POLICY_PATH = 'joystick-games/tools/asset-policy.py'
policy_spec = importlib.util.spec_from_file_location('joystick_asset_policy', Path(__file__).with_name('asset-policy.py'))
asset_policy = importlib.util.module_from_spec(policy_spec)
policy_spec.loader.exec_module(asset_policy)


def registry_data(raw):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            assert key not in result, 'Duplicate registry JSON key: ' + key
            result[key] = value
        return result
    return json.loads(raw, object_pairs_hook=unique)


def registered_packages(root=None, data=None):
    """Explicit allowlist only. Never discover publishable games by scanning directories."""
    root = root or ROOT
    packages = dict(LEGACY_PACKAGES)
    path = root / REGISTRY
    if data is None:
        if not path.exists():
            return packages
        assert path.is_file() and not path.is_symlink(), 'Registry must be a regular file'
        data = registry_data(path.read_text())
    assert isinstance(data, dict) and type(data.get('schemaVersion')) is int and data['schemaVersion'] == 1
    assert isinstance(data.get('games'), dict)
    seen = set()
    for slug, entry in data['games'].items():
        assert isinstance(entry, dict)
        assert isinstance(slug, str) and re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', slug), 'Invalid registered game slug'
        assert slug not in seen and slug not in LEGACY_PACKAGES, 'Duplicate or legacy registration'
        seen.add(slug)
        package = 'com.ecojust.joystick.' + slug.replace('-', '')
        assert package not in packages.values(), 'Registered package collision'
        assert entry.get('packageName') == package, 'Registry package does not match slug'
        packages[slug] = package
    batches = data.get('batches')
    assert isinstance(batches, dict) and batches, 'Explicit catalog batches required'
    for batch, games in batches.items():
        assert re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', batch)
        assert isinstance(games, list) and games and len(games) == len(set(games))
        assert all(game in seen for game in games), 'Batch includes unregistered game'
    return packages


def selected_games(value=None):
    packages = registered_packages()
    # Omitting a selector keeps the historical CF/QQ workflows unchanged.
    games = list(LEGACY_PACKAGES) if value is None else value.split(',')
    assert games and len(games) == len(set(games)), 'Select a nonempty unique game list'
    assert all(game in packages for game in games), 'Unregistered selected game'
    return games


PACKAGES = registered_packages()


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
    packages = registered_packages()
    assert slug in packages, 'Unregistered joystick game'
    value = builder().metadata(ROOT / 'joystick-games' / slug)
    assert value['id'] == slug and value['packageName'] == packages[slug]
    asset_policy.declaration(value, policy_registration(slug))
    return value


def policy_registration(slug):
    if slug in LEGACY_PACKAGES:
        return None
    return registry_data((ROOT / REGISTRY).read_text())['games'][slug]


def limits(slug):
    return asset_policy.limits(metadata(slug), policy_registration(slug))


def observer_sources(slug):
    names = {'joystick-games/qa/android/build-observer.py', 'joystick-games/qa/android/src/com/ecojust/controllerqa/Observer.java', POLICY_PATH}
    if slug not in LEGACY_PACKAGES:
        names |= {REGISTRY, 'joystick-games/tools/android-build.py'}
    return {name: record(ROOT / name) for name in sorted(names)}


def sources(slug):
    metadata(slug)
    game = ROOT / 'joystick-games' / slug
    paths = [KIT / 'build.py', ROOT / POLICY_PATH, ROOT / 'tools/resource_catalog.py', ROOT / 'tools/puretv-release-certificate-v2.sha256',
             game / 'game.json', game / 'package.json', game / 'package-lock.json', game / 'build.mjs']
    paths += [KIT / 'web' / name for name in PHONE]
    for folder in [KIT / 'android/src/main', game / 'src', game / 'dist', ROOT / 'joystick-games/shared/web']:
        assert folder.is_dir() and not folder.is_symlink(), str(folder)
        for path in folder.rglob('*'):
            assert not path.is_symlink(), str(path)
            if path.is_file():
                paths.append(path)
    paths += list((ROOT / 'joystick-games/tools').glob('android-*.py'))
    fixtures=ROOT/'joystick-games/tools/fixtures/audio'
    if fixtures.exists():
        for path in fixtures.rglob('*'):
            assert not path.is_symlink(),str(path)
            if path.is_file():paths.append(path)
    workflow = ROOT / '.github/workflows/joystick-games-android.yml'
    paths.append(workflow)  # Required even in CI sparse checkouts; never silently omit the workflow.
    if slug not in LEGACY_PACKAGES:
        paths += [ROOT / REGISTRY, ROOT / CATALOG_WORKFLOW, game / 'qa-plan.json', game / 'NOTICE.md', ROOT / 'joystick-games/tools/qa-plan.py']
        licenses = [game / name for name in ('LICENSE', 'LICENSE.txt') if (game / name).exists()]
        assert len(licenses) == 1, 'Catalog game must keep exactly one original LICENSE or LICENSE.txt'
        paths += licenses
        if (game / 'upstream.json').exists(): paths.append(game / 'upstream.json')
        # Shared imported source/templates are build inputs as well as generated game files.
        for folder in (ROOT / 'joystick-games/shared/crisp', ROOT / 'joystick-games/shared/triptych'):
            if folder.exists():
                assert folder.is_dir() and not folder.is_symlink()
                for path in folder.rglob('*'):
                    assert not path.is_symlink(), str(path)
                    assert not set(path.relative_to(folder).parts) & {'node_modules', '__pycache__', '.cache'}, 'Shared build tree contains cache/dependency outputs'
                    if path.is_file(): paths.append(path)
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
    policy = asset_policy.android_limits(meta, policy_registration(slug))
    extensions = original.ASSET_EXTENSIONS | set((policy or {}).get('extraExtensions', ()))
    kit = directory / 'kit'
    staged = directory / 'game'
    shutil.copytree(KIT / 'android/src/main', kit / 'android/src/main')
    (kit / 'web').mkdir()
    for name in PHONE:
        shutil.copyfile(KIT / 'web' / name, kit / 'web' / name)
    assets = staged / 'src/main/assets'
    assets.mkdir(parents=True)
    dist = original.checked_directory(game / 'dist', 'game distribution')
    for name, path in original.asset_tree(dist, extensions, bool(policy and policy['allowNestedAssets'])).items():
        assert name.casefold() not in PHONE and name.casefold() not in ('game-config.json', 'assets-index.json')
        target = assets / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)
    assert (assets / 'tv.html').is_file(), 'Build the committed Web game first'
    write(staged / 'game.json', meta)
    if (game / 'icon.xml').exists():
        shutil.copyfile(game / 'icon.xml', staged / 'icon.xml')
    original.KIT = kit
    return kit, staged, original.payload(staged, policy)


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
        # The original CLI has no budget override. Only this registered caller
        # passes the policy after validating matching game and registry fields.
        builder().main(['--kit', str(kit), '--game', str(staged),
                        '--output', str(out / 'build'), '--cache', str(a.cache), '--sdk', str(a.sdk),
                        '--jdk', str(a.jdk), '--zxing', str(a.zxing)],
                       limits=asset_policy.android_limits(metadata(a.game), policy_registration(a.game)))
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
