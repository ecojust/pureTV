#!/usr/bin/env python3
"""Check archived source copies, including hidden workflow directories."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path, PurePosixPath

GAMES = ('cf-transport-ship', 'qq-speed')


def package_references(inputs, verification):
    """Absent APKs require explicit receipt hashes bound to the exact old artifact."""
    path = inputs / 'package-file-references.json'
    if not path.exists(): return None
    assert path.is_file() and not path.is_symlink()
    refs = json.loads(path.read_text())
    assert refs['schemaVersion'] == 1 and refs['status'] == 'verified-original-reference'
    origin = verification['artifactOrigin']
    assert refs['artifactOrigin'] == origin and verification['status'] == 'passed'
    assert origin['artifactSourceSha'] == verification['artifactSourceSha'] and origin['artifactRunId'] == verification['artifactRunId']
    if origin['kind'] == 'github-actions-signed-artifact':
        spec = importlib.util.spec_from_file_location('runtime_artifact_reference', Path(__file__).with_name('android-runtime-artifact.py'))
        artifact = importlib.util.module_from_spec(spec); spec.loader.exec_module(artifact)
        original = inputs / 'original-actions-artifact-origin.json'
        assert original.is_file() and file_record(original)['sha256'] == origin['originManifestSha256']
        value = json.loads(original.read_text())
        identity = artifact.validate_origin(value, [g['game'] for g in verification['games']], now=artifact.origin.stamp(value['verifiedAt']))
        assert origin['repository'] == artifact.origin.REPO
        assert value['request'] == {'run': int(origin['artifactRunId']), 'attempt': origin['artifactRunAttempt'], 'source': origin['artifactSourceSha'], 'artifact': origin['artifactId']}
        assert origin['zip'] == {'bytes': identity['artifactBytes'], 'sha256': identity['artifactSha256']}
        original_files = value['files']
    else:
        assert origin['kind'] == 'immutable-git-export' and origin['exportCommit'] == verification['artifactExportCommit']
        original = inputs / 'original-export-manifest.json'
        assert file_record(original)['sha256'] == origin['originManifestSha256'] == verification['originalExportManifestSha256']
        value = json.loads(original.read_text())
        assert value['sourceSha'] == origin['artifactSourceSha'] and str(value['runId']) == origin['artifactRunId']
        original_files = value['files']
    expected = {}
    for item in verification['games']:
        game = item['game']
        receipt = json.loads((inputs / 'packages' / game / 'signing-receipt.json').read_text())
        observer = json.loads((inputs / 'observers' / game / 'observer-signing-receipt.json').read_text())
        for name, identity, binding in [
            ('packages/' + game + '/' + game + '-' + receipt['versionName'] + '.apk', receipt, item['package']),
            ('observers/' + game + '/' + observer['apk'], observer['apkIdentity'], item['observer'])]:
            expected[name] = {k: identity[k] for k in ('bytes', 'sha256')}
            assert expected[name] == {k: binding[k] for k in ('bytes', 'sha256')} == original_files[name]
            assert not (inputs / name).exists(), 'Reference-only evidence must not contain duplicate APK bytes'
    assert refs['files'] == expected and expected, 'Missing, changed or unexpected omitted APK reference'
    return expected


def file_record(path):
    data = path.read_bytes()
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def check_inventory(root, expected, errors, label):
    verified = 0
    for name, value in expected.items():
        relative = PurePosixPath(name)
        if relative.is_absolute() or '..' in relative.parts or '.git' in relative.parts or '\\' in name:
            errors.append(label + ': unsafe path ' + name); continue
        path = root / name
        if not path.is_file() or path.is_symlink():
            errors.append(label + ': missing regular file ' + name); continue
        if file_record(path) != value:
            errors.append(label + ': bytes or SHA256 differ ' + name); continue
        verified += 1
    return verified


def audit(evidence, games=GAMES):
    errors = []; jobs = []
    for slug in games:
        folder = evidence / ('joystick-android-runtime-' + slug) / slug
        source = folder / 'executed-source.json'
        if not source.is_file():
            errors.append(slug + ': missing executed-source.json'); continue
        report = json.loads(source.read_text())
        count = check_inventory(folder / 'executed-source', report['files'], errors, slug + ' executed source')
        inputs = folder / 'verified-inputs'
        verification_file = inputs / 'input-verification.json'
        artifact_count = 0
        if verification_file.is_file():
            verification = json.loads(verification_file.read_text())
            try:
                references = package_references(inputs, verification)
            except Exception as error:
                references = None; errors.append(slug + ': invalid original package references: ' + type(error).__name__)
            verified_games = [item['game'] for item in verification.get('games', [])]
            if not verified_games or len(set(verified_games)) != len(verified_games) or slug not in verified_games or not set(verified_games) <= set(games):
                errors.append(slug + ': invalid verified game selection'); verified_games = []
            expected = {}
            for game in verified_games:
                receipt_path = inputs / 'packages' / game / 'signing-receipt.json'
                if not receipt_path.is_file():
                    errors.append(slug + ': missing signing receipt for ' + game); continue
                receipt = json.loads(receipt_path.read_text())
                package_path = receipt_path.parent / (game + '-' + receipt['versionName'] + '.apk')
                referenced = references is not None and references.get(package_path.relative_to(inputs).as_posix()) == {'bytes': receipt['bytes'], 'sha256': receipt['sha256']}
                if not referenced and (not package_path.is_file() or file_record(package_path) != {'bytes': receipt['bytes'], 'sha256': receipt['sha256']}):
                    errors.append(slug + ': missing or changed APK for ' + game)
                for name, value in receipt['sourceInputs'].items():
                    if name in expected and expected[name] != value:
                        errors.append(slug + ': conflicting artifact source hash ' + name)
                    expected[name] = value
            for game in verified_games:
                receipt_path = inputs / 'observers' / game / 'observer-signing-receipt.json'
                if not receipt_path.is_file():
                    errors.append(slug + ': missing Observer receipt for ' + game); continue
                receipt = json.loads(receipt_path.read_text()); expected.update(receipt['sourceFiles'])
                observer_path = receipt_path.parent / receipt['apk']
                identity = receipt['apkIdentity']
                referenced = references is not None and references.get(observer_path.relative_to(inputs).as_posix()) == {'bytes': identity['bytes'], 'sha256': identity['sha256']}
                if not referenced and (not observer_path.is_file() or file_record(observer_path) != {'bytes': identity['bytes'], 'sha256': identity['sha256']}):
                    errors.append(slug + ': missing or changed Observer for ' + game)
            sdk = 'puretv-joystick/joystick_sdk.py'
            if sdk in report['files']:
                expected[sdk] = report['files'][sdk]
            artifact_count = check_inventory(inputs / 'artifact-source', expected, errors, slug + ' artifact source')
            if verification.get('artifactOrigin', {}).get('kind') == 'github-actions-signed-artifact':
                if references is None: errors.append(slug + ': Actions package origin references required')
            else:
                original = inputs / 'original-export-manifest.json'
                if not original.is_file() or file_record(original)['sha256'] != verification['originalExportManifestSha256']:
                    errors.append(slug + ': missing or changed original export manifest')
        else:
            errors.append(slug + ': missing mandatory input-verification.json')
        jobs.append({'game': slug, 'executedSourceCopiesVerified': count,
                     'artifactSourceCopiesVerified': artifact_count, 'verifiedInputsPresent': verification_file.is_file()})
    return {'status': 'failed' if errors else 'passed', 'scope': 'archived source-copy integrity only',
            'jobs': jobs, 'errors': errors, 'runtimeAcceptanceImplied': False}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--games', help='Comma-separated exact games in the evidence export; default CF/QQ')
    p.add_argument('--evidence', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--record-only', action='store_true', help='Preserve failed archives first; workflow must check this result after publishing evidence')
    args = p.parse_args()
    try:
        games = args.games.split(',') if args.games else GAMES
        import re
        assert games and len(games) == len(set(games)) and all(re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', game) for game in games)
        result = audit(args.evidence, games)
    except Exception as error:
        result = {'status': 'failed', 'scope': 'archived source-copy integrity only',
                  'errors': [type(error).__name__ + ': ' + str(error)], 'runtimeAcceptanceImplied': False}
    assert not args.output.exists()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))
    if not args.record_only:
        assert result['status'] == 'passed'


if __name__ == '__main__':
    main()
