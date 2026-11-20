from pathlib import Path
import json,hashlib,zipfile,subprocess
R=Path('/dev/shm/puretv-controller-games');O=Path('/dev/shm/gamekit-english-preview-final');source='a657ce24fc4c0c5adb07a671adabb3ce604f68f8';sha=lambda b:hashlib.sha256(b).hexdigest();rows=[]
for g in json.loads((R/'docs/readme-controller-support/rollout.json').read_text())['games']:
 if g['host']!='game-kit':continue
 game=R/'resource/apps'/g['id'];apk=game/g['apk'];fetch=game/'docs/releases'/g['version']/'fetch-verification.json';v=json.loads(fetch.read_text());assert v['sourceSha']==source and v['signatureVerified'] and v['sourceIdentityVerified'] and sha(apk.read_bytes())==v['sha256']
 assets=R/'resource/game-kit/docs/readme-controller-support/gamekit-ui/final-payload'/g['id'];hashes={}
 with zipfile.ZipFile(apk) as z:
  actual={p for p in z.namelist() if p.startswith('assets/') and not p.endswith('/')}
  expected={'assets/'+p.name for p in assets.iterdir() if p.is_file()}
  assert actual==expected,(g['id'],actual^expected)
  for p in sorted(assets.iterdir()):
   assert z.read('assets/'+p.name)==p.read_bytes(),(g['id'],p.name)
   hashes[p.name]=sha(p.read_bytes())
 rows.append({'id':g['id'],'apk':str(apk.relative_to(R)),'apkSha256':v['sha256'],'version':g['version'],'sourceSha':source,'signingVerification':str(fetch.relative_to(R)),'signingVerificationSha256':sha(fetch.read_bytes()),'assets':str(assets.relative_to(R)),'allAssetsEqualApk':True,'assetSha256':hashes})
(O/'apk-asset-binding.json').write_text(json.dumps({'passed':True,'scope':'Byte identity of browser-served payload and exact release-signed APK assets; no Android execution claim','sourceSha':source,'games':rows},indent=2)+'\n');print('Matched all assets of 9 release-signed APKs')
