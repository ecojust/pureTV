#!/usr/bin/env python3
"""Copy verified Android captures and refresh the twenty app checksum manifests."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import struct
import subprocess

p = argparse.ArgumentParser()
p.add_argument('--root', type=Path, required=True)
p.add_argument('--phase', choices=['previews', 'checksums'], required=True)
a = p.parse_args()
root = a.root.resolve()
rollout = json.loads((root/'docs/readme-controller-support/rollout.json').read_text())
assert rollout['status'] == 'signed_apks_verified_pending_publication'
assert len(rollout['games']) == len({g['id'] for g in rollout['games']}) == 20

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

if a.phase == 'previews':
    folder = root/'resource/game-kit/docs/readme-controller-support'
    manifest = folder/'english-preview-manifest.json'
    archive = folder/'english-preview-preflight-manifest.json'
    assert not archive.exists()
    shutil.copy2(manifest, archive)
    preflight = {g['game']: g for g in json.loads(archive.read_text())['games']}
    assert set(preflight) == {g['id'] for g in rollout['games']}
    rows = []
    for game in rollout['games']:
        app = root/'resource/apps'/game['id']
        release = app/'docs/releases'/game['version']
        verification = json.loads((release/'verification.json').read_text())
        expected = 'browser_verified_android_environment_blocked' if game['id'] == 'used-car-racing' else 'passed'
        assert verification['status'] == expected and verification['actualAndroidEmulator']
        assert verification['signatureVerified'] and verification['inPlaceUpgradeInstalled']
        if game['id'] == 'used-car-racing':
            assert verification['androidControllerAcceptancePassed'] is False
        assert verification['apk']['sha256'] == sha(app/game['apk'])
        source = release/'menu.png'
        target = root/'docs/previews/en'/('app-'+game['id']+'.png')
        prior = sha(target)
        assert prior == preflight[game['id']]['targetSha256']
        assert sha(source) == verification['captures']['menu']['sha256']
        assert source.read_bytes() == (root/verification['originalEvidence']/'gameplay/menu-android.png').read_bytes()
        shutil.copy2(source, target)
        dimensions = struct.unpack('>II', source.read_bytes()[16:24])
        rows.append({'game': game['id'], 'version': game['version'],
                     'source': source.relative_to(root).as_posix(),
                     'target': target.relative_to(root).as_posix(),
                     'sha256': sha(target), 'width': dimensions[0], 'height': dimensions[1],
                     'previousPreflightPreviewSha256': prior,
                     'apkSha256': verification['apk']['sha256'],
                     'qaSourceSha': verification['qaSourceSha'],
                     'runtimeRun': verification['runtimeRun']})
    result = {'status': 'completed', 'scope': 'The twenty games in root README',
              'method': 'Unmodified menu captures of the exact signed APKs running in Android TV emulators with the default English system locale; Chinese-only game content remains Chinese.',
              'preflightManifest': archive.relative_to(root).as_posix(),
              'physicalTvTested': False, 'physicalEsp32Tested': False,
              'acceptanceScope': 'Nineteen games passed complete Android controller acceptance. Used Car Racing has a real Android menu capture and successful upgrade installation, but later Android gameplay was blocked by a host emulator crash; its complete controller acceptance is browser-only.',
              'games': rows}
    manifest.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'previewsUpdated': len(rows)}))
else:
    records = []
    for game in rollout['games']:
        app = root/'resource/apps'/game['id']
        relative = app.relative_to(root).as_posix()
        files = subprocess.check_output(['git', 'ls-files', '-z', '--cached', '--others',
                                         '--exclude-standard', '--', relative], cwd=root)
        names = sorted(set(x.decode() for x in files.split(b'\0') if x))
        checksums = app/'SHA256SUMS.txt'
        rows = []
        for name in names:
            path = root/name
            if path == checksums:
                continue
            assert path.is_file() and not path.is_symlink(), name
            rows.append(sha(path)+'  '+path.relative_to(app).as_posix())
        checksums.write_text('\n'.join(rows)+'\n')
        subprocess.run(['sha256sum', '--check', '--quiet', 'SHA256SUMS.txt'], cwd=app, check=True)
        records.append({'game': game['id'], 'filesVerified': len(rows), 'manifestSha256': sha(checksums)})
    result = {'status': 'passed', 'games': records, 'originalManifestsPreserved': 'Each app docs/controller-update-baseline/<previousVersion>/SHA256SUMS.txt'}
    (root/'docs/readme-controller-support/checksum-verification.json').write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps({'appsVerified': len(records), 'filesVerified': sum(r['filesVerified'] for r in records)}))
