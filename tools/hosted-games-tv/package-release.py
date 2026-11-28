#!/usr/bin/env python3
"""Verify or sign one frozen batch of single-title hosted games."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from resource_catalog import HOSTED_GAME_PACKAGES, apk_info, expected_release_certificate


def verify_package(apk, game, tools, signed):
    slug = game['id']
    info = apk_info(apk, tools, allow_unsigned=not signed)
    xml = ET.parse(ROOT / 'resource/apps/hosted-games/src/main/AndroidManifest.xml').getroot()
    ns = '{http://schemas.android.com/apk/res/android}'
    if (info['packageName'], info['versionName'], info['versionCode']) != (
            HOSTED_GAME_PACKAGES[slug], xml.get(ns + 'versionName'), int(xml.get(ns + 'versionCode'))):
        raise ValueError(f'Unexpected APK identity for {slug}')
    pin = expected_release_certificate(ROOT, info) if signed else None
    if info['certificateSha256'] != pin or not 0 < info['bytes'] < 10_000_000:
        raise ValueError(f'Invalid signer or size for {slug}')
    badging = subprocess.check_output([tools / 'aapt', 'dump', 'badging', apk], text=True)
    if (f"application-label:'{game['zh']}'" not in badging.splitlines()
            or not re.search(r"^leanback-launchable-activity: name='com.ecojust.hostedgames.MainActivity'", badging, re.M)):
        raise ValueError(f'Incorrect Chinese title or TV launcher for {slug}')
    subprocess.run([tools / 'zipalign', '-c', '4', apk], check=True)
    with zipfile.ZipFile(apk) as archive:
        if archive.testzip() or len(archive.namelist()) != len(set(archive.namelist())):
            raise ValueError(f'Invalid archive for {slug}')
        catalog = json.loads(archive.read('assets/hosted-games.json'))
        config = json.loads(archive.read('assets/game-config.json'))
        if catalog != [game] or config['name'] != game['zh'] or config['nameEn'] != game['en']:
            raise ValueError(f'Incorrect embedded game for {slug}')
        contents = {n: hashlib.sha256(archive.read(n)).hexdigest() for n in archive.namelist()
                    if not n.startswith('META-INF/')}
    return {**info, 'id': slug, 'title': game['zh'], 'file': apk.name, 'contents': contents}


def sign_all(source, release, tools, games):
    env = os.environ
    if (env.get('GITHUB_REPOSITORY'), env.get('GITHUB_REF'), env.get('GITHUB_EVENT_NAME')) != (
            'ecojust/pureTV', 'refs/heads/master', 'workflow_dispatch'):
        raise RuntimeError('Signing requires a manual run on ecojust/pureTV master')
    pin = (ROOT / 'tools/puretv-release-certificate-v2.sha256').read_text().strip()
    with tempfile.TemporaryDirectory() as temp:
        key = Path(temp) / 'puretv.jks'
        key.write_bytes(base64.b64decode(env['PURETV_KEYSTORE_BASE64'].strip(), validate=True))
        key.chmod(0o600)
        cert = subprocess.check_output(['keytool', '-exportcert', '-alias', 'puretv', '-keystore',
                                        key, '-storepass:env', 'PURETV_KEYSTORE_PASSWORD'])
        if hashlib.sha256(cert).hexdigest() != pin:
            raise ValueError('Unexpected pureTV release key')
        records = []
        for game in games:
            slug = game['id']
            unsigned = source / (slug + '.apk')
            original = verify_package(unsigned, game, tools, signed=False)
            apk = release / (slug + '-' + original['versionName'] + '.apk')
            subprocess.run([tools / 'apksigner', 'sign', '--ks', key, '--ks-key-alias', 'puretv',
                            '--ks-pass', 'env:PURETV_KEYSTORE_PASSWORD', '--key-pass', 'env:PURETV_KEYSTORE_PASSWORD',
                            '--v4-signing-enabled', 'false', '--out', apk, unsigned], check=True)
            record = verify_package(apk, game, tools, signed=True)
            if original['contents'] != record['contents']:
                raise ValueError(f'Signed package content differs for {slug}')
            records.append(record)
        return records


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--signed', required=True, type=Path)
    parser.add_argument('--tools', required=True, type=Path)
    parser.add_argument('--sign-from', type=Path, help='Directory with the six unsigned APKs (CI only)')
    args = parser.parse_args()
    catalog = json.loads((ROOT / 'tools/pc-games/hosted-games.json').read_text())
    if set(HOSTED_GAME_PACKAGES) != {g['id'] for g in catalog} or len(catalog) != len(HOSTED_GAME_PACKAGES):
        raise ValueError('Hosted game catalog differs from the package allowlist')
    if args.sign_from:
        if set(p.name for p in args.sign_from.iterdir()) != {g['id'] + '.apk' for g in catalog}:
            raise ValueError('Incomplete batch of unsigned APKs')
        args.signed.mkdir(parents=True, exist_ok=False)
        records = sign_all(args.sign_from, args.signed, args.tools, catalog)
        receipt = {'sourceSha': os.environ['GITHUB_SHA'], 'runId': os.environ['GITHUB_RUN_ID'],
                   'attempt': os.environ['GITHUB_RUN_ATTEMPT'], 'packages': records}
        (args.signed / 'packages.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
        (args.signed / 'SHA256SUMS.txt').write_text(''.join(f"{r['sha256']}  {r['file']}\n" for r in records))
    else:
        receipt = json.loads((args.signed / 'packages.json').read_text())
        if len(receipt['packages']) != len(catalog):
            raise ValueError('Incomplete release receipt')
        for record, game in zip(receipt['packages'], catalog):
            expected_name = f"{game['id']}-{record['versionName']}.apk"
            if not re.fullmatch(r'\d+\.\d+\.\d+', record['versionName']) or record['file'] != expected_name:
                raise ValueError('Unexpected release filename')
            actual = verify_package(args.signed / expected_name, game, args.tools, signed=True)
            if actual != record:
                raise ValueError(f'Release receipt mismatch for {game["id"]}')
    print(f'Verified {len(catalog)} individual signed TV packages')


if __name__ == '__main__':
    main()
