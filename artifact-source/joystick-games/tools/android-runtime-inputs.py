#!/usr/bin/env python3
"""Reverify immutable signed artifacts for a separately frozen QA-only run."""
import argparse
import fnmatch
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from resource_catalog import apk_info

spec = importlib.util.spec_from_file_location('joystick_android_build', Path(__file__).with_name('android-build.py'))
build = importlib.util.module_from_spec(spec); spec.loader.exec_module(build)
GAMES = build.LEGACY_PACKAGES
PHONE = {'resource/game-kit/web/' + name for name in ('controller.html', 'controller.js', 'controller.css')}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def safe_name(name):
    assert isinstance(name, str) and name and not any(ord(c) < 32 for c in name)
    p = PurePosixPath(name)
    assert not p.is_absolute() and name == p.as_posix() and '..' not in p.parts and '.git' not in p.parts
    assert '\\' not in name
    return name


def record(path):
    assert path.is_file() and not path.is_symlink(), str(path)
    data = path.read_bytes()
    return {'bytes': len(data), 'sha256': sha(data)}


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def git(root, *args):
    return subprocess.check_output(['git', *args], cwd=root)


def frozen(root, commit, name):
    return git(root, 'show', commit + ':' + safe_name(name))


def tree(root, commit, *paths):
    return set(filter(None, git(root, 'ls-tree', '-r', '--name-only', commit, '--', *paths).decode().splitlines()))


def expected_inputs(root, commit, slug):
    game = 'joystick-games/' + slug + '/'
    exact = {'resource/game-kit/build.py', build.POLICY_PATH, 'tools/resource_catalog.py', 'tools/puretv-release-certificate-v2.sha256',
             '.github/workflows/joystick-games-android.yml', *PHONE,
             *[game + name for name in ('game.json', 'package.json', 'package-lock.json', 'build.mjs')]}
    required = tree(root, commit, 'resource/game-kit/android/src/main', game + 'src', game + 'dist', 'joystick-games/shared/web')
    required |= {n for n in tree(root, commit, 'joystick-games/tools') if fnmatch.fnmatch(n, 'joystick-games/tools/android-*.py')}
    required |= tree(root, commit, 'joystick-games/tools/fixtures/audio')
    required |= tree(root, commit, game + 'icon.xml')
    if slug not in GAMES:
        registry = build.registry_data(frozen(root, commit, build.REGISTRY))
        assert slug in build.registered_packages(root, registry), 'Game absent from frozen catalog registry'
        exact |= {build.REGISTRY, build.CATALOG_WORKFLOW, 'joystick-games/tools/qa-plan.py', *[game + name for name in ('qa-plan.json', 'NOTICE.md')]}
        licenses = tree(root, commit, game + 'LICENSE', game + 'LICENSE.txt')
        assert len(licenses) == 1, 'Missing or ambiguous frozen original license'
        exact |= licenses
        required |= tree(root, commit, game + 'upstream.json')
        required |= tree(root, commit, 'joystick-games/shared/crisp', 'joystick-games/shared/triptych')
    assert tree(root, commit, *sorted(exact)) == exact, 'Frozen source is missing mandatory build inputs'
    return required | exact


def production_path(name, slug):
    game = 'joystick-games/' + slug + '/'
    return (name in (build.REGISTRY, build.POLICY_PATH) or name.startswith(('joystick-games/shared/crisp/', 'joystick-games/shared/triptych/')) or
            name.startswith('resource/game-kit/android/src/main/') or name in PHONE or
            (name.startswith('joystick-games/shared/web/') and '.test.' not in name) or
            name.startswith(game + 'src/') or name.startswith(game + 'dist/') or
            name in {game + x for x in ('game.json', 'icon.xml', 'build.mjs', 'package.json', 'package-lock.json', 'upstream.json', 'NOTICE.md', 'LICENSE', 'LICENSE.txt')})


def verify_manifest(directory, manifest):
    expected = manifest['files']
    assert isinstance(expected, dict) and expected
    for name in expected:
        safe_name(name)
    actual = {}
    for path in directory.rglob('*'):
        name = path.relative_to(directory).as_posix()
        if '.git' in Path(name).parts:
            continue
        assert not path.is_symlink(), name
        if path.is_file() and name != 'export-manifest.json':
            actual[safe_name(name)] = record(path)
    assert actual == expected, 'Immutable export content/hash/size mismatch'
    return len(actual)


def verify_export_origin(directory, commit):
    assert git(directory, 'rev-parse', 'HEAD').decode().strip() == commit
    expected = frozen(directory, commit, 'export-manifest.json')
    assert (directory / 'export-manifest.json').read_bytes() == expected, 'Export manifest differs from immutable commit'
    return json.loads(expected)


def check_receipt_origin(receipt, artifact_source, artifact_run):
    assert receipt['sourceSha'] == artifact_source, 'Receipt source differs from artifact source'
    assert str(receipt['runId']) == artifact_run, 'Receipt build run differs from artifact run'
    assert receipt['signatureVerified'] is True


def check_production_bytes(path, artifact_bytes, qa_committed_bytes):
    assert path.is_file() and not path.is_symlink()
    assert path.read_bytes() == artifact_bytes == qa_committed_bytes, 'QA changed production input: ' + str(path)


def archive_content(apk):
    with zipfile.ZipFile(apk) as z:
        assert z.testzip() is None and len(z.namelist()) == len(set(z.namelist()))
        for name in z.namelist():
            safe_name(name.rstrip('/'))
        return {n: sha(z.read(n)) for n in z.namelist() if not n.endswith('/') and not n.startswith('META-INF/')}


def verify(args):
    for value in (args.artifact_source, args.export_commit):
        assert re.fullmatch('[a-f0-9]{40}', value)
    assert re.fullmatch('[1-9][0-9]*', args.artifact_run_id)
    qa = git(ROOT, 'rev-parse', 'HEAD').decode().strip()
    if not args.local_preflight:
        assert qa == os.environ['GITHUB_SHA'], 'QA checkout must match its actual workflow SHA'
    assert re.fullmatch('[a-f0-9]{40}', qa)
    assert not args.output.exists() and not args.output.resolve().is_relative_to(ROOT.resolve())
    manifest = verify_export_origin(args.artifact, args.export_commit)
    assert manifest['sourceSha'] == args.artifact_source and str(manifest['runId']) == args.artifact_run_id
    assert manifest['buildResult'] == 'success' and manifest['signResult'] == 'success'
    files_verified = verify_manifest(args.artifact, manifest)
    pin_name = 'tools/puretv-release-certificate-v2.sha256'
    pin = frozen(ROOT, args.artifact_source, pin_name).decode().strip()
    assert re.fullmatch('[a-f0-9]{64}', pin) and (ROOT / pin_name).read_text().strip() == pin
    sdk_name = 'puretv-joystick/joystick_sdk.py'
    sdk_bytes = frozen(ROOT, args.artifact_source, sdk_name)
    check_production_bytes(ROOT / sdk_name, sdk_bytes, frozen(ROOT, qa, sdk_name))
    args.output.mkdir(parents=True)
    frozen_files = {sdk_name: sdk_bytes}
    games = []
    selection = build.selected_games(getattr(args, 'games', None))
    artifact_packages = dict(GAMES)
    if any(slug not in GAMES for slug in selection):
        artifact_packages = build.registered_packages(ROOT, build.registry_data(frozen(ROOT, args.artifact_source, build.REGISTRY)))
    for slug in selection:
        assert slug in artifact_packages, 'Game absent from original artifact registry'
        package = artifact_packages[slug]
        folder = args.artifact / 'packages' / slug
        receipt = json.loads((folder / 'signing-receipt.json').read_text())
        check_receipt_origin(receipt, args.artifact_source, args.artifact_run_id)
        inputs = receipt['sourceInputs']
        assert set(inputs) == expected_inputs(ROOT, args.artifact_source, slug), 'Incomplete frozen source inventory'
        current_production = {n for n in expected_inputs(ROOT, qa, slug) if production_path(n, slug)}
        artifact_production = {n for n in inputs if production_path(n, slug)}
        assert current_production == artifact_production, 'QA checkout changed production file inventory'
        for name, expected in inputs.items():
            data = frozen(ROOT, args.artifact_source, name)
            assert expected == {'bytes': len(data), 'sha256': sha(data)}, 'Frozen build input differs: ' + name
            frozen_files[name] = data
            if name in artifact_production:
                check_production_bytes(ROOT / name, data, frozen(ROOT, qa, name))
        meta = json.loads(frozen_files['joystick-games/' + slug + '/game.json'])
        apk = folder / (slug + '-' + meta['version'] + '.apk')
        identity = apk_info(apk, args.build_tools)
        assert identity['packageName'] == package == meta['packageName']
        assert identity['versionCode'] == meta['versionCode'] and identity['versionName'] == meta['version']
        registered = None if slug in GAMES else build.registry_data(frozen(ROOT, args.artifact_source, build.REGISTRY))['games'][slug]
        budget = build.asset_policy.limits(meta, registered)
        assert identity['certificateSha256'] == pin and 0 < identity['bytes'] < budget['maxApkBytes']
        assert all(receipt[k] == v for k, v in identity.items())
        assert archive_content(apk) == receipt['contentSha256']
        prefix = 'joystick-games/' + slug + '/dist/'
        expected_assets = {name[len(prefix):]: value for name, value in frozen_files.items() if name.startswith(prefix)}
        assert all('/' not in name for name in expected_assets)
        expected_assets.update({Path(name).name: frozen_files[name] for name in PHONE})
        expected_assets['game-config.json'] = (json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
        expected_assets['assets-index.json'] = (json.dumps(sorted(expected_assets), separators=(',', ':')) + '\n').encode()
        with zipfile.ZipFile(apk) as z:
            actual_assets = {n[7:]: z.read(n) for n in z.namelist() if n.startswith('assets/')}
        assert actual_assets == expected_assets, 'Signed assets differ from artifact source'
        assert receipt['assets'] == {n: {'bytes': len(v), 'sha256': sha(v)} for n, v in actual_assets.items()}
        observer_dir = args.artifact / 'observers' / slug
        observer = json.loads((observer_dir / 'observer-signing-receipt.json').read_text())
        check_receipt_origin(observer, args.artifact_source, args.artifact_run_id)
        assert observer['modelWrites'] is False and observer['signed'] is True and observer['testArtifactOnly'] is True
        assert observer['targetPackage'] == package and Path(observer['apk']).name == observer['apk']
        observer_apk = observer_dir / observer['apk']
        observer_identity = apk_info(observer_apk, args.build_tools)
        assert observer_identity == observer['apkIdentity'] and observer_identity['certificateSha256'] == pin
        assert observer_identity['packageName'] == observer['observerPackage']
        required_observer = {'joystick-games/qa/android/build-observer.py', 'joystick-games/qa/android/src/com/ecojust/controllerqa/Observer.java', build.POLICY_PATH}
        if slug not in GAMES:
            required_observer |= {build.REGISTRY, 'joystick-games/tools/android-build.py'}
        assert set(observer['sourceFiles']) == required_observer
        for name, expected in observer['sourceFiles'].items():
            data = frozen(ROOT, args.artifact_source, name)
            assert expected == {'bytes': len(data), 'sha256': sha(data)}
            assert (ROOT / name).read_bytes() == data == frozen(ROOT, qa, name), 'Observer source changed'
            frozen_files[name] = data
        games.append({'game': slug, 'package': identity, 'observer': observer_identity,
                      'frozenSourceInputsVerified': len(inputs), 'currentProductionInputsUnchanged': len(artifact_production),
                      'assetsVerified': len(actual_assets), 'signingReceiptSha256': record(folder / 'signing-receipt.json')['sha256']})
    for name, data in frozen_files.items():
        dest = args.output / 'artifact-source' / name
        dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(data)
    for slug in selection:
        shutil.copytree(args.artifact / 'packages' / slug, args.output / 'packages' / slug)
        shutil.copytree(args.artifact / 'observers' / slug, args.output / 'observers' / slug)
    shutil.copyfile(args.artifact / 'export-manifest.json', args.output / 'original-export-manifest.json')
    result = {'status': 'passed', 'artifactSourceSha': args.artifact_source, 'artifactExportCommit': args.export_commit,
              'artifactRunId': args.artifact_run_id, 'qaSourceSha': None if args.local_preflight else qa,
              'qaRunId': None if args.local_preflight else os.environ['GITHUB_RUN_ID'],
              'workingTreeBaseSha': qa, 'localPreflightOnly': args.local_preflight,
              'originalRuntimeResult': manifest['runtimeResult'], 'originalExportFilesVerified': files_verified,
              'originalExportManifestSha256': record(args.artifact / 'export-manifest.json')['sha256'],
              'reusedSignedPackagesAndObservers': True, 'games': games,
              'physicalTvTested': False, 'physicalEsp32Tested': False}
    write(args.output / 'input-verification.json', result)
    print(json.dumps(result, indent=2))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--games', help='Comma-separated registered games; default CF/QQ')
    p.add_argument('--artifact-source', required=True)
    p.add_argument('--export-commit', required=True)
    p.add_argument('--artifact-run-id', required=True)
    p.add_argument('--artifact', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--build-tools', type=Path, required=True)
    p.add_argument('--local-preflight', action='store_true', help='Verify artifacts locally without pretending a GitHub run or frozen QA-source identity')
    verify(p.parse_args())


if __name__ == '__main__':
    main()
