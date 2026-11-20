#!/usr/bin/env python3
"""Stage/sign fixed-commit legacy game APKs without editing published resources."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import zipfile
from resource_catalog import apk_info, digest, expected_release_certificate

ROOT = Path(__file__).resolve().parents[1]
GROUPS = {
    'arcade': ['tank', 'jackal', 'jewel', 'tetris', 'bomb-jack', 'adventure-island', 'super-mario'],
    'worlds': ['coast-kart', 'cozy-island', 'used-car-racing', 'alien-shooter'],
}
SLUGS = sum(GROUPS.values(), [])
KIT_SLUGS = ['neon-rush', 'twenty-four', 'torch-bridge', 'tower-overlap', 'packing-sculptor', 'conveyor-window', 'glass-fold', 'tension-span', 'prism-relay']
ALL_SLUGS = SLUGS + KIT_SLUGS
HOME_GAMES = {
    'neon-rush', 'tower-overlap', 'coast-kart', 'used-car-racing', 'alien-shooter',
    'tank', 'jackal', 'jewel', 'tetris', 'bomb-jack', 'adventure-island', 'super-mario',
}
RELEASE_SCOPES = ('all', 'home-12')


def scoped_games(slugs, scope):
    assert scope in RELEASE_SCOPES, 'Unknown controller release scope'
    return [slug for slug in slugs if scope == 'all' or slug in HOME_GAMES]


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def source():
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    assert re.fullmatch(r'[a-f0-9]{40}', commit)
    assert commit == os.environ['GITHUB_SHA'], 'Checkout must match workflow source'
    return commit


def info(path, build_tools, unsigned=False):
    value = apk_info(path, build_tools, allow_unsigned=unsigned)
    # These legacy games retain their pre-existing size limits.
    limits = {'com.ecojust.jackaltv': 16 * 1024 * 1024, 'com.ecojust.alienshootertv': 12 * 1024 * 1024}
    assert 0 < value['bytes'] <= limits.get(value['packageName'], 5 * 1024 * 1024), 'APK exceeds its existing game limit'
    return value


def identity(slug):
    gradle = (ROOT/'resource/apps'/slug/'build.gradle').read_text()
    def match(pattern):
        result = re.search(pattern, gradle)
        assert result, (slug, pattern)
        return result[1]
    return {'packageName': match(r"applicationId\s+'([^']+)'"),
            'versionName': match(r"versionName\s+'([^']+)'"),
            'versionCode': int(match(r'versionCode\s+(\d+)'))}


def upgrade(slug, candidate, build_tools):
    directory = ROOT/'resource/apps'/slug
    resource = json.loads((directory/'resource.json').read_text())
    assert '/' not in resource['apk'] and '\\' not in resource['apk']
    old = info(directory/resource['apk'], build_tools)
    resource_keys={'packageName':'packageName','versionName':'version','versionCode':'versionCode','sha256':'sha256','bytes':'apkBytes','certificateSha256':'certificateSha256'}
    assert all(old[k]==resource[v] for k,v in resource_keys.items()), 'Previous release metadata differs from APK'
    for key, expected in identity(slug).items():
        assert candidate[key] == expected, (slug, key)
    assert candidate['packageName'] == old['packageName']
    assert candidate['versionCode'] > old['versionCode'], 'Version code must permit an in-place upgrade'
    assert candidate['versionName'] != old['versionName']
    pin = expected_release_certificate(ROOT, candidate)
    assert pin == old['certificateSha256'] == resource['certificateSha256'], 'Existing certificate must be preserved'
    return old


def assets(apk, slug):
    with zipfile.ZipFile(apk) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names)), 'Duplicate ZIP entry'
        assert all(not n.startswith('/') and '..' not in Path(n).parts for n in names)
        actual = {n[7:]: archive.read(n) for n in names if n.startswith('assets/') and not n.endswith('/')}
    folder = ROOT/'resource/apps'/slug/'src/main/assets'
    expected = {p.relative_to(folder).as_posix(): p.read_bytes() for p in folder.rglob('*') if p.is_file()}
    assert expected and all(actual.get(n) == data for n, data in expected.items()), 'APK assets differ from source'
    extra = set(actual) - set(expected)
    assert not extra or (slug == 'jackal' and all(n.startswith('art/') for n in extra)), 'Unexpected APK asset'
    if slug == 'jackal':
        assert 'art/preview-asset-provenance.json' in actual, 'Jackal artwork staging receipt missing'
    return {n: {'bytes': len(data), 'sha256': sha(data)} for n, data in sorted(actual.items())}


def source_inputs(slug, commit):
    prefixes = ('resource/apps/'+slug+'/src/', 'resource/apps/'+slug+'/tools/',
                'resource/game-kit/android/src/main/', 'resource/game-kit/legacy-controller-native/', 'resource/game-kit/legacy-controller-web/',
                'resource/launcher/puretv/gradle/')
    exact = {'resource/apps/'+slug+'/build.gradle', 'resource/apps/'+slug+'/proguard-rules.pro',
             'resource/launcher/puretv/build.gradle', 'resource/launcher/puretv/settings.gradle',
             'resource/launcher/puretv/gradle.properties', 'resource/launcher/puretv/gradlew',
             'tools/controller-release.py', '.github/workflows/controller-games.yml'}
    paths = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    result = {}
    for name in paths:
        if name in exact or name.startswith(prefixes):
            path = ROOT/name
            assert path.is_file() and not path.is_symlink(), name
            data = path.read_bytes()
            frozen = subprocess.check_output(['git', 'show', commit+':'+name], cwd=ROOT)
            assert data == frozen, 'Build input changed after checkout: '+name
            result[name] = {'bytes': len(data), 'sha256': sha(data)}
    return result


def stage(args):
    commit = source()
    for slug in scoped_games(GROUPS[args.group], args.scope):
        found = list((ROOT/'resource/apps'/slug/'build/outputs/apk/release').glob('*.apk'))
        assert len(found) == 1, slug
        value = info(found[0], args.build_tools, True)
        assert value['certificateSha256'] is None, 'Build job must not sign'
        old = upgrade(slug, value, args.build_tools)
        value.update(slug=slug, sourceSha=commit, runId=os.environ['GITHUB_RUN_ID'],
                     assets=assets(found[0], slug), inputFiles=source_inputs(slug, commit),
                     previousRelease=old, physicalTvTested=False)
        output = args.output/slug
        output.mkdir(parents=True, exist_ok=False)
        shutil.copy2(found[0], output/'unsigned.apk')
        write(output/'build-metadata.json', value)


def observer_contract(manifest, badging, target):
    targets = re.findall(r'android:targetPackage[^\n]*?="([^"]+)"', manifest)
    assert targets == [target], 'Observer must target the exact game package'
    assert '="com.ecojust.controllerqa.Observer"' in manifest
    assert re.search(r"^targetSdkVersion:'35'$", badging, re.MULTILINE), 'Observer must target the current Android SDK'
    assert re.search(r'android:testOnly[^\n]*\(type 0x12\)0xffffffff', manifest), 'Observer APK must be declared testOnly'
    return {'targetSdkVersion':35,'testOnly':True}


def sign_observers(args, commit, key, temporary, pin):
    assert args.observers and args.observer_output
    assert {p.name for p in args.observers.iterdir()} == set(scoped_games(ALL_SLUGS, args.scope))
    for slug in scoped_games(ALL_SLUGS, args.scope):
        folder = args.observers/slug
        receipt = json.loads((folder/'observer-build.json').read_text())
        observer = folder/('observer-'+slug+'-unsigned.apk')
        assert receipt['game'] == slug and receipt['signed'] is False and receipt['modelWrites'] is False
        assert receipt['packageName'] == 'com.ecojust.controllerqa.'+slug.replace('-', '')
        game = ROOT/'resource/apps'/slug
        target = json.loads((game/'game.json').read_text())['packageName'] if slug in KIT_SLUGS else identity(slug)['packageName']
        assert receipt['targetPackage'] == target
        assert receipt['instrumentationRunner'] == 'com.ecojust.controllerqa.Observer'
        assert receipt['apkIdentity'] == {'bytes': observer.stat().st_size, 'sha256': digest(observer)}
        observed = info(observer, args.build_tools, True)
        assert observed['packageName'] == receipt['packageName'] and observed['certificateSha256'] is None
        manifest = subprocess.check_output([str(args.build_tools/'aapt'), 'dump', 'xmltree', str(observer), 'AndroidManifest.xml'], text=True)
        badging = subprocess.check_output([str(args.build_tools/'aapt'), 'dump', 'badging', str(observer)], text=True)
        contract = observer_contract(manifest, badging, target)
        for name, value in receipt['sourceFiles'].items():
            assert not Path(name).is_absolute() and '..' not in Path(name).parts
            data = subprocess.check_output(['git', 'show', commit+':'+name], cwd=ROOT)
            assert value == {'bytes': len(data), 'sha256': sha(data)}
        output = args.observer_output/slug; output.mkdir(parents=True, exist_ok=False)
        apk = output/('observer-'+slug+'.apk'); aligned = temporary/('observer-'+slug+'.apk')
        subprocess.run([str(args.build_tools/'zipalign'), '-f', '4', str(observer), str(aligned)], check=True)
        subprocess.run([str(args.build_tools/'apksigner'), 'sign', '--min-sdk-version', '26', '--v1-signing-enabled', 'true', '--v2-signing-enabled', 'true', '--v3-signing-enabled', 'true', '--v4-signing-enabled', 'false', '--ks', str(key), '--ks-key-alias', 'puretv', '--ks-pass', 'env:PURETV_KEYSTORE_PASSWORD', '--key-pass', 'env:PURETV_KEYSTORE_PASSWORD', '--out', str(apk), str(aligned)], check=True)
        signed = info(apk, args.build_tools)
        assert signed['certificateSha256'] == pin and signed['packageName'] == receipt['packageName']
        with zipfile.ZipFile(observer) as unsigned_zip, zipfile.ZipFile(apk) as signed_zip:
            for name in unsigned_zip.namelist():
                assert signed_zip.read(name) == unsigned_zip.read(name)
        receipt.update(contract)
        receipt.update(signed=True, signatureVerified=True, sourceSha=commit, runId=os.environ['GITHUB_RUN_ID'],
                       apk=apk.name, apkIdentity=signed, testArtifactOnly=True)
        write(output/'observer-signing-receipt.json', receipt)


def sign(args):
    commit = source()
    pin = (ROOT/'tools/puretv-release-certificate-v2.sha256').read_text().strip()
    assert re.fullmatch(r'[a-f0-9]{64}', pin)
    encoded = os.environ.get('PURETV_KEYSTORE_BASE64')
    assert encoded and os.environ.get('PURETV_KEYSTORE_PASSWORD'), 'Existing release signing secrets required'
    assert {p.name for p in args.input.iterdir()} == set(scoped_games(SLUGS, args.scope))
    with tempfile.TemporaryDirectory(prefix='controller-sign-', dir=os.environ['RUNNER_TEMP']) as temp:
        temp = Path(temp)
        key = temp/'release.jks'
        key.write_bytes(base64.b64decode(''.join(encoded.split()), validate=True)); key.chmod(0o600)
        cert = subprocess.check_output(['keytool', '-exportcert', '-alias', 'puretv', '-keystore', str(key), '-storepass:env', 'PURETV_KEYSTORE_PASSWORD'])
        assert sha(cert) == pin, 'Configured certificate does not match existing releases'
        for slug in scoped_games(SLUGS, args.scope):
            src = args.input/slug
            metadata = json.loads((src/'build-metadata.json').read_text())
            unsigned = src/'unsigned.apk'
            assert metadata['sourceSha'] == commit and str(metadata['runId']) == os.environ['GITHUB_RUN_ID']
            assert metadata['slug'] == slug and metadata['certificateSha256'] is None
            observed = info(unsigned, args.build_tools, True)
            assert all(observed[k] == metadata[k] for k in observed), slug
            assert assets(unsigned, slug) == metadata['assets']
            assert source_inputs(slug, commit) == metadata['inputFiles']
            assert upgrade(slug, metadata, args.build_tools) == metadata['previousRelease']
            output = args.output/slug; output.mkdir(parents=True, exist_ok=False)
            apk = output/(slug+'-'+metadata['versionName']+'.apk')
            aligned = temp/(slug+'.apk')
            subprocess.run([str(args.build_tools/'zipalign'), '-f', '4', str(unsigned), str(aligned)], check=True)
            subprocess.run([str(args.build_tools/'apksigner'), 'sign', '--min-sdk-version', '26', '--v1-signing-enabled', 'true', '--v2-signing-enabled', 'true', '--v3-signing-enabled', 'true', '--v4-signing-enabled', 'false', '--ks', str(key), '--ks-key-alias', 'puretv', '--ks-pass', 'env:PURETV_KEYSTORE_PASSWORD', '--key-pass', 'env:PURETV_KEYSTORE_PASSWORD', '--out', str(apk), str(aligned)], check=True)
            signed = info(apk, args.build_tools)
            assert signed['certificateSha256'] == pin
            assert all(signed[k] == metadata[k] for k in ('packageName', 'versionCode', 'versionName'))
            assert assets(apk, slug) == metadata['assets']
            subprocess.run([str(args.build_tools/'zipalign'), '-c', '4', str(apk)], check=True)
            signed.update(slug=slug, sourceSha=commit, runId=os.environ['GITHUB_RUN_ID'],
                          assets=metadata['assets'], inputFiles=metadata['inputFiles'],
                          previousRelease=metadata['previousRelease'], signatureVerified=True,
                          physicalTvTested=False, physicalEsp32Tested=False)
            write(output/'signing-receipt.json', signed)
            (output/'SHA256SUMS.txt').write_text(signed['sha256']+'  '+apk.name+'\n')
        sign_observers(args, commit, key, temp, pin)


def export(args):
    commit = source()
    args.output.mkdir(parents=True, exist_ok=False)
    release = args.input/'release'
    if args.sign_result == 'success':
        assert {p.name for p in release.iterdir()} == set(scoped_games(SLUGS, args.scope))
        for slug in scoped_games(SLUGS, args.scope):
            receipt = json.loads((release/slug/'signing-receipt.json').read_text())
            assert receipt['sourceSha'] == commit and str(receipt['runId']) == os.environ['GITHUB_RUN_ID']
            apk = release/slug/(slug+'-'+receipt['versionName']+'.apk')
            observed = info(apk, args.build_tools)
            assert all(observed[k] == receipt[k] for k in observed)
            assert observed['certificateSha256'] == expected_release_certificate(ROOT, observed)
            assert assets(apk, slug) == receipt['assets']
            assert source_inputs(slug, commit) == receipt['inputFiles']
        shutil.copytree(release, args.output/'packages')
        observers=args.input/'observers'
        assert {p.name for p in observers.iterdir()}==set(scoped_games(ALL_SLUGS, args.scope))
        for slug in scoped_games(ALL_SLUGS, args.scope):
            receipt=json.loads((observers/slug/'observer-signing-receipt.json').read_text())
            assert receipt['signed'] is True and receipt['modelWrites'] is False and receipt['testArtifactOnly'] is True
            assert receipt['sourceSha']==commit and str(receipt['runId'])==os.environ['GITHUB_RUN_ID']
            assert info(observers/slug/receipt['apk'],args.build_tools)==receipt['apkIdentity']
            assert receipt['apkIdentity']['certificateSha256']==(ROOT/'tools/puretv-release-certificate-v2.sha256').read_text().strip()
        shutil.copytree(observers,args.output/'observers')
    reports = args.input/'reports'
    if reports.exists():
        shutil.copytree(reports, args.output/'reports')
    records = {}
    for path in sorted(args.output.rglob('*')):
        assert not path.is_symlink()
        if path.is_file():
            assert path.stat().st_size < 100_000_000
            records[path.relative_to(args.output).as_posix()] = {'bytes': path.stat().st_size, 'sha256': digest(path)}
    write(args.output/'export-manifest.json', {'sourceSha': commit, 'runId': os.environ['GITHUB_RUN_ID'],
        'buildResult': args.build_result, 'signResult': args.sign_result,
        'runtimeResult': args.runtime_result, 'scope': args.scope, 'files': records,
        'physicalTvTested': False, 'physicalEsp32Tested': False})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['list', 'stage', 'sign', 'export'])
    parser.add_argument('--group', choices=GROUPS)
    parser.add_argument('--input', type=Path)
    parser.add_argument('--observers', type=Path)
    parser.add_argument('--observer-output', type=Path)
    parser.add_argument('--all', action='store_true')
    parser.add_argument('--scope', choices=RELEASE_SCOPES, default=os.environ.get('CONTROLLER_RELEASE_SCOPE', 'all'))
    parser.add_argument('--output', type=Path)
    parser.add_argument('--build-tools', type=Path)
    parser.add_argument('--build-result', default='unknown')
    parser.add_argument('--sign-result', default='unknown')
    parser.add_argument('--runtime-result', default='not_run')
    args = parser.parse_args()
    if args.command == 'list':
        games = ALL_SLUGS if args.all else GROUPS[args.group] if args.group else SLUGS
        print(' '.join(scoped_games(games, args.scope))); return
    assert args.output and args.build_tools
    if args.command == 'stage': assert args.group
    else: assert args.input
    globals()[args.command](args)

if __name__ == '__main__':
    main()
