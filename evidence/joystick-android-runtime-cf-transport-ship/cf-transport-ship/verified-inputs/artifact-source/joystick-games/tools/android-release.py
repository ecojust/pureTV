#!/usr/bin/env python3
"""Verify and sign dedicated controller-game packages using the existing key."""
import argparse
import base64
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from resource_catalog import apk_info

spec = importlib.util.spec_from_file_location('joystick_android_build', Path(__file__).with_name('android-build.py'))
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


def source():
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    assert re.fullmatch('[a-f0-9]{40}', commit)
    assert commit == os.environ['GITHUB_SHA'], 'Signing checkout must match workflow commit'
    return commit


def pin():
    value = (ROOT / 'tools/puretv-release-certificate-v2.sha256').read_text().strip()
    assert re.fullmatch('[a-f0-9]{64}', value)
    return value


def content(apk):
    with zipfile.ZipFile(apk) as z:
        assert z.testzip() is None and len(z.namelist()) == len(set(z.namelist()))
        assert all(not n.startswith('/') and '..' not in Path(n).parts for n in z.namelist())
        return {n: build.sha(z.read(n)) for n in z.namelist() if not n.endswith('/') and not n.startswith('META-INF/')}


def identity(apk, tools, slug, signed):
    info = apk_info(apk, tools, allow_unsigned=not signed)
    meta = build.metadata(slug)
    assert info['packageName'] == meta['packageName'] and info['versionName'] == meta['version'] and info['versionCode'] == meta['versionCode']
    assert 0 < info['bytes'] < 10_000_000
    assert info['certificateSha256'] == (pin() if signed else None)
    return info


def check_payload(apk, slug):
    expected = build.payload(slug)
    with zipfile.ZipFile(apk) as archive:
        observed = {n[7:]: archive.read(n) for n in archive.namelist() if n.startswith('assets/')}
    assert observed == expected, 'APK payload does not match source: ' + slug
    return {name: {'bytes': len(value), 'sha256': build.sha(value)} for name, value in expected.items()}


def validate_unsigned(directory, slug, tools, commit):
    receipt = json.loads((directory / 'build-receipt.json').read_text())
    inputs = json.loads((directory / 'source-inputs.json').read_text())
    assert receipt['sourceSha'] == commit and receipt['runId'] == os.environ['GITHUB_RUN_ID']
    assert receipt['committedInputsVerified'] is True and receipt['unsigned'] is True and receipt['game'] == slug
    meta = build.metadata(slug)
    assert all(receipt[key] == meta[key] for key in ('packageName', 'version', 'versionCode'))
    assert receipt['minSdk'] == 26
    assert inputs == build.sources(slug)
    build.assert_committed(inputs, commit)
    assert receipt['sourceInputsSha256'] == build.sha(json.dumps(inputs, sort_keys=True, separators=(',', ':')).encode())
    apk = directory / 'unsigned.apk'
    info = identity(apk, tools, slug, False)
    assert info['sha256'] == receipt['sha256'] and info['bytes'] == receipt['bytes']
    assert content(apk) == receipt['contentSha256']
    assets = check_payload(apk, slug)
    assert assets == json.loads((directory / 'payload-sha256.json').read_text())
    return receipt, inputs, assets


def sign_file(apk, output, key, tools, scratch):
    aligned = scratch / (output.stem + '-aligned.apk')
    subprocess.run([str(tools / 'zipalign'), '-f', '4', str(apk), str(aligned)], check=True)
    subprocess.run([str(tools / 'apksigner'), 'sign', '--min-sdk-version', '26',
                    '--v1-signing-enabled', 'true', '--v2-signing-enabled', 'true',
                    '--v3-signing-enabled', 'true', '--v4-signing-enabled', 'false',
                    '--ks', str(key), '--ks-key-alias', 'puretv', '--ks-pass', 'env:PURETV_KEYSTORE_PASSWORD',
                    '--key-pass', 'env:PURETV_KEYSTORE_PASSWORD', '--out', str(output), str(aligned)], check=True)
    subprocess.run([str(tools / 'zipalign'), '-c', '4', str(output)], check=True)
    assert content(apk) == content(output), 'Signing altered package payload'


def sign_observer(directory, output, slug, key, tools, scratch, commit):
    receipt = json.loads((directory / 'observer-build.json').read_text())
    assert receipt['game'] == slug and receipt['targetPackage'] == build.PACKAGES[slug]
    assert receipt['signed'] is False and receipt['modelWrites'] is False
    assert Path(receipt['apk']).name == receipt['apk']
    unsigned = directory / receipt['apk']
    assert build.record(unsigned) == receipt['apkIdentity']
    build.assert_committed(receipt['sourceFiles'], commit)
    original = apk_info(unsigned, tools, allow_unsigned=True)
    assert original['certificateSha256'] is None and original['packageName'] == receipt['observerPackage']
    output.mkdir(parents=True)
    apk = output / ('observer-' + slug + '.apk')
    sign_file(unsigned, apk, key, tools, scratch)
    info = apk_info(apk, tools)
    assert info['certificateSha256'] == pin() and info['packageName'] == receipt['observerPackage']
    shutil.copyfile(directory / 'observer-build.json', output / 'observer-build.json')
    receipt.update(signed=True, sourceSha=commit, runId=os.environ['GITHUB_RUN_ID'], apk=apk.name,
                   apkIdentity=info, signatureVerified=True, testArtifactOnly=True)
    build.write(output / 'observer-signing-receipt.json', receipt)


def sign(args):
    commit = source()
    # Verify artifacts and frozen source before loading the signing secret.
    prepared = {slug: validate_unsigned(args.input / slug, slug, args.build_tools, commit) for slug in build.PACKAGES}
    assert not args.output.exists(), 'Use a new output directory'
    encoded = os.environ.get('PURETV_KEYSTORE_BASE64')
    assert encoded and os.environ.get('PURETV_KEYSTORE_PASSWORD'), 'Existing signing secrets required'
    with tempfile.TemporaryDirectory(prefix='joystick-sign-') as temp:
        scratch = Path(temp)
        key = scratch / 'release.jks'
        key.write_bytes(base64.b64decode(encoded, validate=True))
        key.chmod(0o600)
        cert = subprocess.check_output(['keytool', '-exportcert', '-alias', 'puretv', '-keystore', str(key), '-storepass:env', 'PURETV_KEYSTORE_PASSWORD'])
        assert hashlib.sha256(cert).hexdigest() == pin(), 'Signing certificate mismatch'
        for slug, (receipt, inputs, assets) in prepared.items():
            folder = args.output / 'packages' / slug
            folder.mkdir(parents=True)
            apk = folder / (slug + '-' + build.metadata(slug)['version'] + '.apk')
            sign_file(args.input / slug / 'unsigned.apk', apk, key, args.build_tools, scratch)
            info = identity(apk, args.build_tools, slug, True)
            assert check_payload(apk, slug) == assets
            info.update(game=slug, sourceSha=commit, runId=os.environ['GITHUB_RUN_ID'],
                        sourceInputs=inputs, assets=assets, contentSha256=content(apk),
                        unsignedSha256=receipt['sha256'], signatureVerified=True,
                        physicalTvTested=False, physicalEsp32Tested=False)
            build.write(folder / 'signing-receipt.json', info)
            shutil.copyfile(args.input / slug / 'build-receipt.json', folder / 'build-receipt.json')
            (folder / 'SHA256SUMS.txt').write_text(info['sha256'] + '  ' + apk.name + '\n')
            sign_observer(args.input / slug / 'observer', args.output / 'observers' / slug,
                          slug, key, args.build_tools, scratch, commit)
    print(json.dumps({'signedGames': len(prepared), 'certificateSha256': pin(), 'sourceSha': commit}))


def verify(args):
    commit = source()
    for slug in build.PACKAGES:
        folder = args.input / 'packages' / slug
        receipt = json.loads((folder / 'signing-receipt.json').read_text())
        assert receipt['sourceSha'] == commit and receipt['runId'] == os.environ['GITHUB_RUN_ID']
        apk = folder / (slug + '-' + build.metadata(slug)['version'] + '.apk')
        info = identity(apk, args.build_tools, slug, True)
        assert all(receipt[k] == v for k, v in info.items())
        assert receipt['assets'] == check_payload(apk, slug) and receipt['contentSha256'] == content(apk)
        assert receipt['sourceInputs'] == build.sources(slug)
        build.assert_committed(receipt['sourceInputs'], commit)
        observer_folder = args.input / 'observers' / slug
        observer = json.loads((observer_folder / 'observer-signing-receipt.json').read_text())
        assert observer['signed'] is True and observer['modelWrites'] is False and observer['testArtifactOnly'] is True
        assert observer['sourceSha'] == commit and observer['runId'] == os.environ['GITHUB_RUN_ID']
        assert observer['targetPackage'] == build.PACKAGES[slug]
        assert observer['apkIdentity'] == apk_info(observer_folder / observer['apk'], args.build_tools)
        assert observer['apkIdentity']['certificateSha256'] == pin()
        build.assert_committed(observer['sourceFiles'], commit)
    print(json.dumps({'verifiedGames': len(build.PACKAGES), 'sourceSha': commit}))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('command', choices=('sign', 'verify'))
    p.add_argument('--input', type=Path, required=True)
    p.add_argument('--output', type=Path)
    p.add_argument('--build-tools', type=Path, required=True)
    a = p.parse_args()
    if a.command == 'sign':
        assert a.output
    globals()[a.command](a)


if __name__ == '__main__':
    main()
