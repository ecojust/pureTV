"""Synthetic documentation-tool tests; no real artifacts/READMEs are modified."""
import contextlib,hashlib,importlib.util,io,json,shutil,sys
from pathlib import Path
repo=Path('/dev/shm/puretv-controller-status')
spec=importlib.util.spec_from_file_location('update_readmes',repo/'tools/update-controller-status-readmes.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
out=Path('/dev/shm/controller-status-readme-draft-2');fixture=out/'synthetic-staging-fixture';fixture.mkdir()
rollout=m.read_json(repo/'docs/controller-client-status/rollout.json');tests=[]
def check(name,fn):fn();tests.append(name)
def writejson(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d))
def digest(b):return hashlib.sha256(b).hexdigest()
originals={}
for g in rollout['games']:
 app=fixture/'resource/apps'/g['id'];release=app/'docs/releases'/g['version'];release.mkdir(parents=True)
 for name in ['README.md','README.en.md']:
  real=repo/'resource/apps'/g['id']/name
  if real.exists():
   shutil.copyfile(real,app/name);originals[str(real.relative_to(repo))]=digest(real.read_bytes())
 apk=b'SYNTHETIC APK FIXTURE '+g['id'].encode();image=bytes.fromhex('89504e470d0a1a0a')+b'SYNTHETIC IMAGE';video=b'SYNTHETIC VIDEO'
 (app/g['apk']).write_bytes(apk);(release/'connected.png').write_bytes(image);(release/'controller-status.mp4').write_bytes(video)
 writejson(app/'resource.json',dict(version=g['version'],versionCode=g['versionCode'],apk=g['apk'],sha256=digest(apk)))
 verification=dict(status='passed',scope=m.SCOPE,game=g['id'],version=g['version'],apk={'sha256':digest(apk)},signatureVerified=True,sourceAssetsMatchApk=True,inPlaceUpgradeInstalled=True,controllerClientStatusAcceptancePassed=True,actualAndroidEmulator=True,fullGameplayAcceptancePerformedInThisUpdate=False,connectedCaptureSha256=digest(image),physicalTvTested=False,physicalPhoneTested=False,physicalEsp32Tested=False)
 writejson(release/'verification.json',verification);writejson(release/'controller-status.json',dict(file='controller-status.mp4',scope=m.SCOPE,sha256=digest(video),bytes=len(video),fullDecodeVerified=True,apkSha256=digest(apk)))
writejson(fixture/'docs/controller-client-status/rollout.json',rollout)
mac=fixture/'resource/apps/neon-rush/macos';mac.mkdir()
for ext in ['dmg','zip']:(mac/f"NeonRush-{rollout['macos']['version']}-macos-universal.{ext}").write_bytes(b'SYNTHETIC MAC FIXTURE')
m.ROOT=fixture
# A corrupted late-game recording must reject the entire update before any write.
last=rollout['games'][-1];broken=fixture/'resource/apps'/last['id']/'docs/releases'/last['version']/'controller-status.mp4';good=broken.read_bytes();broken.write_bytes(b'CORRUPTED')
sys.argv=['updater','--write']
try:m.main();raise AssertionError('corrupt recording accepted')
except ValueError as e:assert 'Recording mismatch' in str(e)
for name,expected in originals.items():assert digest((fixture/name).read_bytes())==expected
tests.append('late-artifact-hash-rejection-leaves-all-32-readmes-unchanged');broken.write_bytes(good)
log=io.StringIO()
with contextlib.redirect_stdout(log):m.main()
first={name:digest((fixture/name).read_bytes()) for name in originals}
with contextlib.redirect_stdout(log):m.main()
assert first=={name:digest((fixture/name).read_bytes()) for name in originals};tests.append('synthetic-staging-write-and-repeat-are-idempotent')
sys.argv=['updater','--check']
with contextlib.redirect_stdout(log):m.main()
tests.append('check-accepts-current-synthetic-readmes')
g=rollout['games'][0];p=fixture/'resource/apps'/g['id']/'README.md';s=p.read_text()
for name,damaged in [('old-primary-apk',s.replace(g['apk'],g['id']+'-'+g['previousVersion']+'.apk',1)),('missing-current-capture',s.replace('docs/releases/'+g['version']+'/connected.png','missing.png'))]:
 try:m.validate_readme(damaged,g,rollout);raise AssertionError('invalid README accepted')
 except ValueError:tests.append('reject-'+name)
for name,expected in originals.items():assert digest((repo/name).read_bytes())==expected
tests.append('real-repository-readmes-untouched')
(out/'synthetic-test.stdout.log').write_text(log.getvalue())
report={'scope':'Synthetic docs updater guard/idempotence tests, not APK/signature/native evidence','passed':True,'tests':tests,'realRepositoryReadmesWritten':False,'scriptSha256':digest((repo/'tools/update-controller-status-readmes.py').read_bytes())}
(out/'synthetic-tests.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
