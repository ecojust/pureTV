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
import tempfile
import types
import zipfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from resource_catalog import apk_info

spec = importlib.util.spec_from_file_location('joystick_android_build', Path(__file__).with_name('android-build.py'))
build = importlib.util.module_from_spec(spec); spec.loader.exec_module(build)
GAMES = build.LEGACY_PACKAGES
PHONE = {'resource/game-kit/web/' + name for name in ('controller.html', 'controller.js', 'controller.css')}
artifact_spec = importlib.util.spec_from_file_location('runtime_actions_artifact', Path(__file__).with_name('android-runtime-artifact.py'))
actions_artifact = importlib.util.module_from_spec(artifact_spec); artifact_spec.loader.exec_module(actions_artifact)


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


OBSERVER_SOURCE = 'joystick-games/qa/android/src/com/ecojust/controllerqa/Observer.java'
# The only difference between these signed-observer sources is the optional read-only
# backroadGhostLabels array. The current screenshot check accepts its original absent form.
OBSERVER_WITHOUT_GHOST_BOUNDS = 'c3c3389d80a713c86c294453fdf70ab65042fda1fe65b5fd44f68218a0492305'
OBSERVER_WITH_GHOST_BOUNDS = '9c10a920e18a094c2650ab86924192cc9745daf8b0a792a732639295fa52ff0e'


def compatible_observer_input(name, original_sha, qa_sha):
    return original_sha == qa_sha or (name == OBSERVER_SOURCE and original_sha == OBSERVER_WITHOUT_GHOST_BOUNDS
                                      and qa_sha == OBSERVER_WITH_GHOST_BOUNDS)


def check_production_bytes(path, artifact_bytes, qa_committed_bytes):
    assert path.is_file() and not path.is_symlink()
    assert path.read_bytes() == artifact_bytes == qa_committed_bytes, 'QA changed production input: ' + str(path)


def archive_content(apk):
    with zipfile.ZipFile(apk) as z:
        assert z.testzip() is None and len(z.namelist()) == len(set(z.namelist()))
        for name in z.namelist():
            safe_name(name.rstrip('/'))
        return {n: sha(z.read(n)) for n in z.namelist() if not n.endswith('/') and not n.startswith('META-INF/')}


def frozen_payload(meta, registered, files, slug):
    """Use the exact original GameKit payload rules and explicit bounded policy."""
    policy = build.asset_policy.android_limits(meta, registered)
    with tempfile.TemporaryDirectory(prefix='frozen-android-assets-') as tmp:
        stage = Path(tmp); game = stage / 'game'; kit = stage / 'kit'
        original = types.ModuleType('original_frozen_gamekit')
        original.__file__ = str(stage / 'resource/game-kit/build.py')
        exec(compile(files['resource/game-kit/build.py'], original.__file__, 'exec'), original.__dict__)
        original.KIT = kit
        prefix = 'joystick-games/' + slug + '/dist/'
        for name, data in files.items():
            if name.startswith(prefix):
                target = game / 'src/main/assets' / safe_name(name[len(prefix):])
            elif name in PHONE:
                target = kit / 'web' / Path(name).name
            else:
                continue
            target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
        (game / 'game.json').write_text(json.dumps(meta, ensure_ascii=False))
        return original.payload(game, policy)


def preserve_evidence(inputs, output):
    """Keep full sources/receipts; explicitly reference original APK bytes outside Git."""
    assert not output.exists()
    output.mkdir(parents=True)
    omitted = {}
    for path in inputs.rglob('*'):
        assert not path.is_symlink()
        if not path.is_file(): continue
        name = safe_name(path.relative_to(inputs).as_posix())
        if path.suffix.lower() == '.apk':
            omitted[name] = record(path)
        else:
            target = output / name; target.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(path, target)
    binding_file = inputs / 'input-verification.json'
    binding = json.loads(binding_file.read_text()) if binding_file.is_file() else {}
    expected = {}
    for item in binding.get('games', []):
        slug = item['game']
        expected['packages/' + slug + '/' + slug + '-' + item['package']['versionName'] + '.apk'] = {k: item['package'][k] for k in ('bytes', 'sha256')}
        observer = json.loads((inputs / 'observers' / slug / 'observer-signing-receipt.json').read_text())
        expected['observers/' + slug + '/' + observer['apk']] = {k: item['observer'][k] for k in ('bytes', 'sha256')}
    if binding.get('status') == 'passed': assert expected == omitted and binding.get('artifactOrigin')
    write(output / 'package-file-references.json', {'schemaVersion': 1,
          'status': 'verified-original-reference' if binding.get('status') == 'passed' else 'unverified-partial-input',
          'artifactOrigin': binding.get('artifactOrigin'), 'files': omitted,
          'reason': 'Original signed game and Observer remain in the fixed original artifact; no APK binary is copied into this Git evidence export.'})


def verify(args):
    assert re.fullmatch('[a-f0-9]{40}', args.artifact_source)
    export_commit = getattr(args, 'export_commit', None)
    artifact_id = getattr(args, 'actions_artifact_id', None)
    assert bool(export_commit) != bool(artifact_id), 'Choose exactly one immutable Git export or original Actions artifact'
    if export_commit: assert re.fullmatch('[a-f0-9]{40}', export_commit)
    assert re.fullmatch('[1-9][0-9]*', args.artifact_run_id)
    qa = git(ROOT, 'rev-parse', 'HEAD').decode().strip()
    if not args.local_preflight:
        assert qa == os.environ['GITHUB_SHA'], 'QA checkout must match its actual workflow SHA'
    assert re.fullmatch('[a-f0-9]{40}', qa)
    assert not args.output.exists() and not args.output.resolve().is_relative_to(ROOT.resolve())
    selection = build.selected_games(getattr(args, 'games', None))
    if artifact_id:
        assert re.fullmatch('[1-9][0-9]*', artifact_id) and re.fullmatch('[1-9][0-9]*', args.artifact_attempt)
        request = {'run': int(args.artifact_run_id), 'attempt': int(args.artifact_attempt), 'source': args.artifact_source, 'artifact': int(artifact_id)}
        manifest = actions_artifact.verify_local(args.artifact, request, selection)
        files_verified = len(manifest['files'])
        origin_file = 'actions-artifact-origin.json'
        artifact_origin = {'kind': manifest['kind'], 'repository': actions_artifact.origin.REPO,
                           'artifactId': int(artifact_id), 'artifactRunId': args.artifact_run_id,
                           'artifactRunAttempt': int(args.artifact_attempt), 'artifactSourceSha': args.artifact_source,
                           'zip': {'bytes': manifest['artifact']['size_in_bytes'], 'sha256': manifest['artifact']['digest'][7:]},
                           'originManifestSha256': record(args.artifact / origin_file)['sha256']}
    else:
        manifest = verify_export_origin(args.artifact, export_commit)
        assert manifest['sourceSha'] == args.artifact_source and str(manifest['runId']) == args.artifact_run_id
        assert manifest['buildResult'] == 'success' and manifest['signResult'] == 'success'
        files_verified = verify_manifest(args.artifact, manifest)
        origin_file = 'export-manifest.json'
        artifact_origin = {'kind': 'immutable-git-export', 'artifactSourceSha': args.artifact_source,
                           'artifactRunId': args.artifact_run_id, 'exportCommit': export_commit,
                           'originManifestSha256': record(args.artifact / origin_file)['sha256']}
    pin_name = 'tools/puretv-release-certificate-v2.sha256'
    pin = frozen(ROOT, args.artifact_source, pin_name).decode().strip()
    assert re.fullmatch('[a-f0-9]{64}', pin) and (ROOT / pin_name).read_text().strip() == pin
    sdk_name = 'puretv-joystick/joystick_sdk.py'
    sdk_bytes = frozen(ROOT, args.artifact_source, sdk_name)
    check_production_bytes(ROOT / sdk_name, sdk_bytes, frozen(ROOT, qa, sdk_name))
    args.output.mkdir(parents=True)
    frozen_files = {sdk_name: sdk_bytes}
    games = []
    artifact_packages = dict(GAMES)
    if any(slug not in GAMES for slug in selection):
        artifact_packages = build.registered_packages(ROOT, build.registry_data(frozen(ROOT, args.artifact_source, build.REGISTRY)))
    for slug in selection:
        assert slug in artifact_packages, 'Game absent from original artifact registry'
        package = artifact_packages[slug]
        folder = args.artifact / 'packages' / slug
        receipt = json.loads((folder / 'signing-receipt.json').read_text())
        check_receipt_origin(receipt, args.artifact_source, args.artifact_run_id)
        assert receipt['game'] == slug
        inputs = receipt['sourceInputs']
        unsigned = json.loads((folder / 'build-receipt.json').read_text())
        assert unsigned['sourceSha'] == args.artifact_source and str(unsigned['runId']) == args.artifact_run_id
        assert unsigned['game'] == slug and unsigned['unsigned'] is True and unsigned['committedInputsVerified'] is True
        assert unsigned['sha256'] == receipt['unsignedSha256'] and unsigned['contentSha256'] == receipt['contentSha256']
        assert unsigned['sourceInputsSha256'] == sha(json.dumps(inputs, sort_keys=True, separators=(',', ':')).encode())
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
        expected_assets = frozen_payload(meta, registered, frozen_files, slug)
        with zipfile.ZipFile(apk) as z:
            actual_assets = {n[7:]: z.read(n) for n in z.namelist() if n.startswith('assets/')}
        assert actual_assets == expected_assets, 'Signed assets differ from artifact source'
        assert receipt['assets'] == {n: {'bytes': len(v), 'sha256': sha(v)} for n, v in actual_assets.items()}
        observer_dir = args.artifact / 'observers' / slug
        observer = json.loads((observer_dir / 'observer-signing-receipt.json').read_text())
        check_receipt_origin(observer, args.artifact_source, args.artifact_run_id)
        assert observer['game'] == slug and observer['clockOverrides'] is False
        assert observer['modelWrites'] is False and observer['signed'] is True and observer['testArtifactOnly'] is True
        assert observer['targetPackage'] == package and Path(observer['apk']).name == observer['apk']
        observer_apk = observer_dir / observer['apk']
        observer_identity = apk_info(observer_apk, args.build_tools)
        assert observer_identity == observer['apkIdentity'] and observer_identity['certificateSha256'] == pin
        assert observer_identity['packageName'] == observer['observerPackage']
        observer_build = json.loads((observer_dir / 'observer-build.json').read_text())
        assert observer_build['signed'] is False
        for key in ('game', 'targetPackage', 'observerPackage', 'component', 'readonlyEndpoints', 'modelWrites', 'clockOverrides', 'sourceFiles', 'classFiles'):
            assert observer_build[key] == observer[key], 'Observer build/sign receipt mismatch: ' + key
        required_observer = {'joystick-games/qa/android/build-observer.py', 'joystick-games/qa/android/src/com/ecojust/controllerqa/Observer.java', build.POLICY_PATH}
        if slug not in GAMES:
            required_observer |= {build.REGISTRY, 'joystick-games/tools/android-build.py'}
        assert set(observer['sourceFiles']) == required_observer
        for name, expected in observer['sourceFiles'].items():
            data = frozen(ROOT, args.artifact_source, name)
            assert expected == {'bytes': len(data), 'sha256': sha(data)}
            qa_bytes = frozen(ROOT, qa, name)
            assert (ROOT / name).read_bytes() == qa_bytes, 'Uncommitted QA Observer input'
            assert compatible_observer_input(name, expected['sha256'], sha(qa_bytes)), 'Observer source changed'
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
    shutil.copyfile(args.artifact / origin_file, args.output / ('original-' + origin_file))
    result = {'status': 'passed', 'artifactSourceSha': args.artifact_source, 'artifactExportCommit': export_commit,
              'artifactRunId': args.artifact_run_id, 'qaSourceSha': None if args.local_preflight else qa,
              'qaRunId': None if args.local_preflight else os.environ['GITHUB_RUN_ID'],
              'workingTreeBaseSha': qa, 'localPreflightOnly': args.local_preflight,
              'originalRuntimeResult': {slug: next((j.get('conclusion') for j in manifest['jobs'] if j['name'] == 'runtime (' + slug + ')'), None) for slug in selection} if artifact_id else manifest['runtimeResult'],
              'originalWorkflowConclusion': manifest['run'].get('conclusion') if artifact_id else None,
              'originalExportFilesVerified': files_verified, 'artifactOrigin': artifact_origin,
              'originalExportManifestSha256': None if artifact_id else record(args.artifact / origin_file)['sha256'],
              'reusedSignedPackagesAndObservers': True, 'games': games,
              'physicalTvTested': False, 'physicalEsp32Tested': False}
    write(args.output / 'input-verification.json', result)
    print(json.dumps(result, indent=2))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--games', help='Comma-separated registered games; default CF/QQ')
    p.add_argument('--artifact-source', required=True)
    p.add_argument('--export-commit')
    p.add_argument('--actions-artifact-id')
    p.add_argument('--artifact-attempt')
    p.add_argument('--artifact-run-id', required=True)
    p.add_argument('--artifact', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--build-tools', type=Path, required=True)
    p.add_argument('--local-preflight', action='store_true', help='Verify artifacts locally without pretending a GitHub run or frozen QA-source identity')
    verify(p.parse_args())


if __name__ == '__main__':
    main()
