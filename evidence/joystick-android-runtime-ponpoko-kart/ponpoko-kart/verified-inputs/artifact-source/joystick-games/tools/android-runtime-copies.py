#!/usr/bin/env python3
"""Check archived source copies, including hidden workflow directories."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath

GAMES = ('cf-transport-ship', 'qq-speed')


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
                if not package_path.is_file() or file_record(package_path) != {'bytes': receipt['bytes'], 'sha256': receipt['sha256']}:
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
                if not observer_path.is_file() or file_record(observer_path) != {'bytes': identity['bytes'], 'sha256': identity['sha256']}:
                    errors.append(slug + ': missing or changed Observer for ' + game)
            sdk = 'puretv-joystick/joystick_sdk.py'
            if sdk in report['files']:
                expected[sdk] = report['files'][sdk]
            artifact_count = check_inventory(inputs / 'artifact-source', expected, errors, slug + ' artifact source')
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
