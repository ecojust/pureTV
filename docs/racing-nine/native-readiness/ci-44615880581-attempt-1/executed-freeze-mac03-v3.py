from pathlib import Path
import json,hashlib
root=Path('/dev/shm/puretv-submit');out=root/'docs/racing-nine/native-readiness/ci-44615880581-attempt-1'
def rec(p):
 d=p.read_bytes();return {'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest()}
for kind in ['arm','intel']:
 v=json.loads((out/f'readonly-{kind}-export-verification.json').read_text());assert v['sourceRunId']==44615880581 and v['sourceRunAttempt']==1 and v['sourceCommit']=='6c7cb4fdb99dce236b634c842326bae6aed5f232'
 assert len(v['files'])==v['fileCount']
 for name,r in v['files'].items():
  p=out/f'original-{kind}-export'/name;assert not p.is_symlink();d=p.read_bytes();assert rec(p)=={k:r[k] for k in ('bytes','sha256')};assert hashlib.sha1(b'blob '+str(len(d)).encode()+b'\0'+d).hexdigest()==r['gitBlobSha1']
for src,dest in [('summarize-arm.py','executed-arm-summary.py'),('summarize-intel-44608415225.py','executed-intel-summary.py'),('capture-readonly-partial.py','executed-full-arm-capture.py'),('capture-readonly-export.py','executed-intel-capture.py')]:
 p=out/dest;data=(Path('/dev/shm/racing-native-readiness')/src).read_bytes();assert not p.exists() or p.read_bytes()==data;p.write_bytes(data)
(out/'executed-freeze-mac03-v3.py').write_bytes(Path(__file__).read_bytes())
exclude={'monitor','original-package-transfer','native-checkpoint-inventory.json','arm-checkpoint-inventory.json','intel-checkpoint-inventory.json'};files={}
for p in sorted(out.rglob('*')):
 if not p.is_file() or any(part in exclude for part in p.relative_to(out).parts):continue
 assert not p.is_symlink();assert p.stat().st_size<10_000_000;assert p.suffix not in ['.zip','.dmg','.apk','.exe'];files[p.relative_to(root).as_posix()]=rec(p)
for game in ['turbo-kart-rush','kart-royale']:
 p=root/f'joystick-games/{game}/docs/macos-ci-44615880581-visual-review.json';j=json.loads(p.read_text());assert j['imagesInspected']==9 and len(j['observations'])==9;assert all(x['viewImageInspected'] for x in j['observations']);files[p.relative_to(root).as_posix()]=rec(p)
result={'status':'ready_for_root_checkpoint','sourceRunId':44615880581,'sourceRunAttempt':1,'sourceCommit':'6c7cb4fdb99dce236b634c842326bae6aed5f232','originalArmFiles':516,'originalIntelFiles':309,'armOriginalReports':{'reports':9,'allNineChecksPassedInEach':True,'screenshotsRehashed':54,'qaSourceHashesVerified':14},'visualReview':{'games':['turbo-kart-rush','kart-royale'],'originalImagesActuallyViewed':18,'turboMinimapOverlapRetainedAndDocumented':True},'intel':'Original native failures and frozen-source blocked classifiers preserved; no Intel gameplay or unique GPU failure cause asserted.','packageSourceAuditManifest':'package-source-audit-manifest.json','completeOriginalReportsAndFilesPreserved':True,'originalResultsUnchanged':True,'gamesRerun':False,'fileCount':len(files),'totalBytes':sum(v['bytes'] for v in files.values()),'excludedDirectories':['monitor','original-package-transfer (separately owned transfer checkpoint)'],'files':files};p=out/'native-checkpoint-inventory.json';assert not p.exists();p.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'manifest':p.relative_to(root).as_posix(),**rec(p),'files':len(files),'totalBytes':result['totalBytes']}))
