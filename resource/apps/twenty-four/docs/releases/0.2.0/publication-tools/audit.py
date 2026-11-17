#!/usr/bin/env python3
"""Read-only final publication gate. Does not publish/copy/modify repository files."""
import argparse, hashlib, json, pathlib, re, subprocess, zipfile
from win_audit import audit as audit_recorded_wins
p=argparse.ArgumentParser();p.add_argument('--game',required=True);p.add_argument('--repo',type=pathlib.Path,default=pathlib.Path('/workspace/pureTV'));p.add_argument('--root',type=pathlib.Path,default=pathlib.Path('/workspace/scratch/game-polish'));p.add_argument('--source-sha',default='40a9c83627463151ef4685a5286e20e9fadd145d');p.add_argument('--browser',type=pathlib.Path);p.add_argument('--shared',type=pathlib.Path);p.add_argument('--recording',type=pathlib.Path);p.add_argument('--artifacts',type=pathlib.Path,required=True);p.add_argument('--visual',type=pathlib.Path);p.add_argument('--output',type=pathlib.Path);a=p.parse_args()
assert re.fullmatch('[a-z]+(?:-[a-z]+)*',a.game)
def read(p):return json.loads(p.read_text())
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def require(x,message):
 if not x:raise ValueError(message)
def source_equal(report,assets,label):require(report.get('sourceAssetHashes',report.get('assets'))==assets,label+' asset hashes differ')
qa=a.root/'final-qa'/a.game;frozen=a.root/'frozen-01'/a.game;signed=a.root/'signed'/a.game
receipt=read(signed/'signing-receipt.json');fetch=read(signed/'fetch-verification.json');build=read(frozen/'build/build-receipt.json');assets=build['assets'];apk=signed/receipt['file']
require(receipt['sourceSha']==a.source_sha==fetch['sourceSha'],'Signing source mismatch')
require(receipt['version']=='0.2.0' and receipt['slug']==a.game,'Signing identity mismatch')
require(receipt['signatureVerified'] and fetch['signatureVerified'] and fetch['sourceIdentityVerified'],'Unsigned or unverified fetch')
require(receipt['sha256']==fetch['sha256']==digest(apk),'APK hash mismatch')
require(receipt['bytes']==apk.stat().st_size<10_000_000,'APK size mismatch')
require(receipt['assetsSha256']==assets and receipt['checkedAssets']==len(assets),'Signing assets mismatch')
require(receipt['certificateSha256']==(a.repo/'tools/puretv-release-certificate-v2.sha256').read_text().strip(),'Wrong certificate')
with zipfile.ZipFile(apk) as z:require({n[7:]:hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist() if n.startswith('assets/') and not n.endswith('/')}==assets,'Actual signed APK assets mismatch')
for name,value in assets.items():require(digest(frozen/'assets'/name)==value,'Frozen extracted asset changed: '+name)
for file in (a.repo/'resource/apps'/a.game/'src/main/assets').iterdir():
 if file.is_file():
  raw=subprocess.check_output(['git','show',a.source_sha+':resource/apps/'+a.game+'/src/main/assets/'+file.name],cwd=a.repo)
  require(hashlib.sha256(raw).hexdigest()==assets[file.name],'Git source asset mismatch: '+file.name)
browser=read(a.browser or qa/'browser-01/report.json');shared=read(a.shared or qa/'shared-01/report.json');recordpath=a.recording or qa/'recording-01/recording.json';record=read(recordpath);video=recordpath.parent/'gameplay.mp4'
for label,obj in [('browser',browser),('shared',shared),('recording',record)]:source_equal(obj,assets,label)
require(browser.get('passed') is True,'Browser report not passed');require(shared.get('sharedRegressionPassed') is True,'Shared QA not passed')
for label,obj in [('browser',browser),('shared',shared)]:
 tests=obj.get('tests',obj.get('checks'));require(tests and all(t.get('passed') is True for t in tests),label+' contains unpassed test')
require(record.get('kind')=='normal-runtime-browser-play','Unexpected recording mode');require(not record.get('errors') and not record.get('consoleErrors'),'Recording runtime errors')
require(record['videoSha256']==digest(video) and record['videoBytes']==video.stat().st_size<10_000_000,'Video hash/size mismatch')
win_audit=audit_recorded_wins(a.game,record);wins=win_audit['recordedWonLevelsZeroBased']
artifacts=read(a.artifacts);required=['apkSize','apkManifest','apkSignature','apkZipIntegrity','apkAssetsMatch','videoSize','videoFormat','videoFullDecode']
require(all(artifacts['checks'].get(k) is True for k in required),'Incomplete artifact checks');require(artifacts['apk']['sha256']==digest(apk) and artifacts['video']['sha256']==digest(video),'Artifact report belongs to other files')
visual=read(a.visual or qa/'root-visual-review.json');require(visual.get('accepted') is True and visual.get('sourceCommit')==a.source_sha,'Missing final visual acceptance')
require(len(visual['screenshots'])>=2,'Two final viewport screenshots required')
for screenshot in visual['screenshots']:require(digest(qa/screenshot['file'])==screenshot['sha256'],'Reviewed screenshot changed')
reviewed=visual['screenshots']+visual.get('encodedFrames',[])
require(visual.get('encodedFrames'),'No decoded video frame review')
for screenshot in visual['encodedFrames']:require(digest(qa/screenshot['file'])==screenshot['sha256'],'Reviewed video frame changed')
require(visual.get('cover') in [row['file'] for row in reviewed],'Cover is not a reviewed image')
result={'passed':True,'slug':a.game,'sourceSha':a.source_sha,'apkSha256':digest(apk),'videoSha256':digest(video),'recordedWonLevelsZeroBased':wins,'recordedGoalAudit':win_audit,'assetsChecked':len(assets),'physicalTvTested':False,'physicalPhoneTested':False,'note':'Read-only consistency audit; preserves raw QA report flags and does not replace model, game-specific or encoded-frame visual review.'}
raw=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
if a.output:
 require(not a.output.resolve().is_relative_to(a.repo.resolve()),'Audit output must stay outside repository');a.output.write_text(raw)
print(raw,end='')
