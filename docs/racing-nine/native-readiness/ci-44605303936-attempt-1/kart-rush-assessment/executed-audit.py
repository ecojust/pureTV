import hashlib,importlib.util,json,plistlib,stat,struct,subprocess,zipfile
from pathlib import Path
root=Path('/dev/shm/puretv-submit');out=root/'docs/racing-nine/native-readiness/ci-44605303936-attempt-1';results=out/'kart-rush-assessment';results.mkdir(exist_ok=False);source='b7b7af12f1eb61f777d89edad7368a69a14bb9e3';assessor='f30cc70cf2ed99949908bc3797f0b7b66274ee4d';packages=Path('/dev/shm/root-mac03-original-packages/kart-rush');game='kart-rush'
def rec(data):return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def fingerprints():return {str(p.relative_to(out)):rec(p.read_bytes()) for d in ('original-arm-export','original-intel-export','original-build-export','original-plan-export') for p in (out/d).rglob('*') if p.is_file()}
before=fingerprints();views=Path('/dev/shm/racing-native-readiness/kart-rush-original-evidence-view');views.mkdir(exist_ok=False);paths={};mapping={}
for kind,runner in [('arm','macos-latest'),('intel','macos-15-intel')]:
 original=out/f'original-{kind}-export/artifact';view=views/('joystick-catalog-macos-qa-racing-03-'+runner);view.mkdir();paths[kind]=view
 for p in original.rglob('*'):
  target=view/p.relative_to(original)
  if p.is_dir():target.mkdir(exist_ok=True)
  else:
   assert p.is_file() and not p.is_symlink();target.parent.mkdir(parents=True,exist_ok=True);target.hardlink_to(p);assert target.stat().st_ino==p.stat().st_ino
 mapping[view.name]=str(original.relative_to(root))
script=subprocess.check_output(['git','show',assessor+':joystick-games/tools/macos-coverage.py'],cwd=root);(results/'executed-macos-coverage.py').write_bytes(script);spec=importlib.util.spec_from_file_location('frozen_assessor',results/'executed-macos-coverage.py');coverage=importlib.util.module_from_spec(spec);spec.loader.exec_module(coverage)
meta=json.loads((packages/'build-manifest.json').read_text());assert meta['sourceCommit']==source and meta['game']==game;(results/'original-build-manifest.json').hardlink_to(packages/'build-manifest.json')
planpath=out/'original-plan-export/artifact/plan.json';plan=json.loads(planpath.read_text());registry=json.loads((out/'original-plan-export/artifact/catalog-registry.json').read_text());inputs=dict(meta['inputFiles'])
for name,record in plan['inputFiles'].items():
 if name in inputs:assert inputs[name]==record
 inputs[name]=record
proc=subprocess.Popen(['git','cat-file','--batch'],cwd=root,stdin=subprocess.PIPE,stdout=subprocess.PIPE)
try:
 for name,expected in inputs.items():
  proc.stdin.write((source+':'+name+'\n').encode());proc.stdin.flush();head=proc.stdout.readline().decode().split();assert len(head)==3 and head[1]=='blob';data=proc.stdout.read(int(head[2]));assert proc.stdout.read(1)==b'\n';assert rec(data)==expected,name
finally:proc.stdin.close();proc.wait()
for filename,expected in meta['packages'].items():assert rec((packages/filename).read_bytes())==expected
appfiles={};prefix=meta['appName']+'/'
with zipfile.ZipFile(next(packages.glob('*.zip'))) as z:
 seen=set()
 for item in z.infolist():
  assert item.filename.startswith(prefix) and item.filename not in seen and '..' not in Path(item.filename).parts and not stat.S_ISLNK(item.external_attr>>16);seen.add(item.filename)
  if not item.is_dir():appfiles[item.filename[len(prefix):]]=rec(z.read(item))
 assert appfiles==meta['appFiles'];web={n.removeprefix('Contents/Resources/Web/'):v for n,v in appfiles.items() if n.startswith('Contents/Resources/Web/')};assert web==meta['webFiles']
 info=plistlib.loads(z.read(prefix+'Contents/Info.plist'));assert info['CFBundleIdentifier']==meta['bundleIdentifier'];binary=z.read(prefix+'Contents/MacOS/'+info['CFBundleExecutable']);magic,count=struct.unpack('>II',binary[:8]);assert magic==0xcafebabe;archs=[]
 for index in range(count):
  cpu,subtype,offset,size,alignment=struct.unpack('>IIIII',binary[8+20*index:28+20*index]);assert offset+size<=len(binary);archs.append({0x1000007:'x86_64',0x100000c:'arm64'}[cpu])
 assert set(archs)=={'arm64','x86_64'}
try:coverage.assess_game(game,meta,plan,registry['games'][game],paths['arm'],paths['intel']);strict='unexpectedly_accepted'
except AssertionError:strict='blocked_as_expected_original_batch_failed'
assert strict=='blocked_as_expected_original_batch_failed'
result=coverage.assess_game(game,meta,plan,registry['games'][game],paths['arm'],paths['intel'],per_game=True);assert result['deliveryEligibility']=='eligible_with_intel_unverified';(results/'per-game-coverage.json').write_text(json.dumps(result,indent=2)+'\n');assert before==fingerprints()
for reference,expected in result['evidenceFiles'].items():
 name,relative=reference.split('/',1);assert rec((root/mapping[name]/relative).read_bytes())==expected
r={'sourceCommit':source,'originalRunId':44605303936,'originalRunAttempt':1,'assessmentSourceCommit':assessor,'assessmentScript':rec(script),'originalPlan':{'path':str(planpath.relative_to(root)),**rec(planpath.read_bytes())},'originalBuildManifest':rec((packages/'build-manifest.json').read_bytes()),'packages':{name:{'path':str(packages/name),**value} for name,value in meta['packages'].items()},'uniqueFrozenSourceInputsVerified':len(inputs),'actualZipAppFilesVerified':len(appfiles),'actualZipWebFilesVerified':len(web),'actualMachOArchitectures':archs,'defaultStrictBatchAssessment':strict,'perGameDeliveryEligibility':result['deliveryEligibility'],'originalBatchFailedPreserved':True,'allOriginalFilesBeforeAfterUnchanged':len(before),'evidenceRootMappings':mapping,'hardlinkViewsAvoidPackageOrEvidenceDuplication':True,'allCoverageReferencesVerifiedAgainstOriginalPaths':len(result['evidenceFiles']),'physicalControllerTested':False,'appleNotarized':False,'limits':['Linux verification does not rerun Apple codesign or mount DMG; original macOS package-verification reports remain required and were checked by assessor.','Original ARM native, occupied-port and Rosetta gameplay all passed; native Intel gameplay is unverified and original failure remains.','Independent Intel WebGL2 context-loss observations do not prove game failure cause; original WebGL1 fallback remains unobserved.','No game or original QA report rerun/changed; successful target does not change failed siblings or batch.']};(results/'audit.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({k:r[k] for k in ('uniqueFrozenSourceInputsVerified','actualZipAppFilesVerified','actualZipWebFilesVerified','defaultStrictBatchAssessment','perGameDeliveryEligibility','allOriginalFilesBeforeAfterUnchanged','allCoverageReferencesVerifiedAgainstOriginalPaths')}))
