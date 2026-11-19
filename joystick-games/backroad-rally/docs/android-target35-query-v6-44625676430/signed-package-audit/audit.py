#!/usr/bin/env python3
"""Read only original signed APK/source/payload. No build/sign/install/publication."""
import datetime,hashlib,importlib.util,json,os,re,stat,subprocess,sys,zipfile
from pathlib import Path,PurePosixPath
sys.dont_write_bytecode=True
ROOT=Path('/dev/shm/puretv-submit');DOC=Path(__file__).resolve().parent;PARENT=DOC.parent
SOURCE='4b6cf0b8cba288eae66bcae2ef2784acc279a695';GAME='backroad-rally';RUN=44625676430
PACKAGE=Path('/dev/shm/racing-review-driving/backroad-target35-v6-signed');WORK=Path('/dev/shm/racing-review-driving/backroad-target35-v6-package-audit');WORK.mkdir(exist_ok=False)
FROZEN=WORK/'frozen-source';FROZEN.mkdir();TOOLS=Path('/workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0');JDK=Path('/workspace/scratch/game-polish-toolchain/jdk-17.0.21+9')
def load(p):return json.loads(p.read_text())
def digest(b):return hashlib.sha256(b).hexdigest()
def record(p):
 with p.open('rb') as f:h=hashlib.file_digest(f,'sha256').hexdigest()
 return {'bytes':p.stat().st_size,'sha256':h}
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
def safe(n):
 p=PurePosixPath(n);assert n and n==p.as_posix() and not p.is_absolute() and '..' not in p.parts and '\\' not in n and not any(ord(c)<32 for c in n);return n
signed=load(PACKAGE/'packages'/GAME/'signing-receipt.json');unsigned=load(PACKAGE/'packages'/GAME/'build-receipt.json');observer=load(PACKAGE/'observers'/GAME/'observer-signing-receipt.json');observer_build=load(PACKAGE/'observers'/GAME/'observer-build.json')
for r in [signed,unsigned,observer]:assert r['sourceSha']==SOURCE and str(r['runId'])==str(RUN) and r['game']==GAME
assert signed['signatureVerified'] is True and unsigned['unsigned'] is True and unsigned['committedInputsVerified'] is True
assert signed['minSdk']==unsigned['minSdk']==26 and signed['targetSdk']==unsigned['targetSdk']==35
assert signed['unsignedSha256']==unsigned['sha256'] and signed['contentSha256']==unsigned['contentSha256']
assert observer['signed'] and observer['signatureVerified'] and observer['testArtifactOnly'] and not observer['modelWrites'] and not observer['clockOverrides']
inputs=signed['sourceInputs'];assert len(inputs)==914 and unsigned['sourceInputsSha256']==digest(json.dumps(inputs,sort_keys=True,separators=(',',':')).encode())
combined=dict(inputs)
for name,want in observer['sourceFiles'].items():assert name not in combined or combined[name]==want;combined[name]=want
alltree=subprocess.check_output(['git','ls-tree','-r','-z',SOURCE],cwd=ROOT);tree={}
for row in alltree.split(b'\0'):
 if row:
  meta,name=row.split(b'\t',1);mode,kind,oid=meta.split();tree[name.decode()]={'mode':mode.decode(),'kind':kind.decode(),'oid':oid.decode()}
# Derive the complete selection from the original Git tree, independently of receipt keys.
base='joystick-games/'+GAME+'/';exact={'resource/game-kit/build.py','joystick-games/tools/asset-policy.py','tools/resource_catalog.py','tools/puretv-release-certificate-v2.sha256',*{base+n for n in ['game.json','package.json','package-lock.json','build.mjs','qa-plan.json','NOTICE.md']},*{'resource/game-kit/web/'+n for n in ['controller.html','controller.js','controller.css']},'.github/workflows/joystick-games-android.yml','.github/workflows/joystick-catalog-android.yml','joystick-games/catalog-registry.json','joystick-games/tools/qa-plan.py'}
for n in ['LICENSE','LICENSE.txt','upstream.json','icon.xml']:
 if base+n in tree:exact.add(base+n)
assert sum(base+n in tree for n in ['LICENSE','LICENSE.txt'])==1
prefixes=['resource/game-kit/android/src/main/',base+'src/',base+'dist/','joystick-games/shared/web/','joystick-games/shared/crisp/','joystick-games/shared/triptych/','joystick-games/tools/fixtures/audio/']
selected={n for n in tree if n in exact or any(n.startswith(prefix) for prefix in prefixes) or (n.startswith('joystick-games/tools/android-') and n.endswith('.py') and '/' not in n[len('joystick-games/tools/'):])}
assert selected==set(inputs),{'missing':sorted(selected-set(inputs)),'extra':sorted(set(inputs)-selected)}
queries=WORK/'queries.txt';queries.write_text(''.join(SOURCE+':'+n+'\n' for n in combined));hardlinked=written=0
with queries.open('rb') as q:
 proc=subprocess.Popen(['git','cat-file','--batch'],cwd=ROOT,stdin=q,stdout=subprocess.PIPE)
 for name,want in combined.items():
  safe(name);entry=tree[name];assert entry['kind']=='blob' and entry['mode'] in ['100644','100755'];header=proc.stdout.readline().split();assert len(header)==3 and header[0].decode()==entry['oid'] and header[1]==b'blob';remaining=int(header[2]);assert remaining==want['bytes']
  dest=FROZEN/name;dest.parent.mkdir(parents=True,exist_ok=True);current=ROOT/name;reuse=current.is_file() and not current.is_symlink() and record(current)==want
  output=None if reuse else dest.open('xb');h=hashlib.sha256()
  while remaining:
   block=proc.stdout.read(min(1024*1024,remaining));assert block;h.update(block);remaining-=len(block)
   if output:output.write(block)
  if output:output.close();written+=1
  assert h.hexdigest()==want['sha256'] and proc.stdout.read(1)==b'\n',name
  if reuse:os.link(current,dest);hardlinked+=1
 assert proc.stdout.read()==b'' and proc.wait()==0
spec=importlib.util.spec_from_file_location('frozen_backroad_build',FROZEN/'joystick-games/tools/android-build.py');build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)
assert build.sources(GAME)==inputs and build.observer_sources(GAME)==observer['sourceFiles'];meta=build.metadata(GAME);assert meta['packageName']==signed['packageName'] and meta['version']==signed['versionName'] and meta['versionCode']==signed['versionCode'] and build.target_sdk(GAME)==35
# Recreate the original prepare() data layout with regular hardlinks to avoid
# duplicating 115MB; original asset_tree(), metadata(), policy and payload() run unchanged.
original=build.builder();policy=build.asset_policy.android_limits(meta,build.policy_registration(GAME));extensions=original.ASSET_EXTENSIONS|set((policy or {}).get('extraExtensions',[]));staged=WORK/'payload-game';assets=staged/'src/main/assets';assets.mkdir(parents=True);kit=WORK/'payload-kit';(kit/'web').mkdir(parents=True)
for name in build.PHONE:os.link(FROZEN/'resource/game-kit/web'/name,kit/'web'/name)
for name,path in original.asset_tree(FROZEN/base/'dist',extensions,bool(policy and policy['allowNestedAssets'])).items():
 assert name.casefold() not in build.PHONE and name.casefold() not in ['game-config.json','assets-index.json'];target=assets/name;target.parent.mkdir(parents=True,exist_ok=True);os.link(path,target)
build.write(staged/'game.json',meta);original.KIT=kit;expected=original.payload(staged,policy);expected_records={n:{'bytes':len(b),'sha256':digest(b)} for n,b in expected.items()};assert expected_records==signed['assets'] and len(expected)==338
apk=PACKAGE/'packages'/GAME/(GAME+'-'+signed['versionName']+'.apk');assert record(apk)=={k:signed[k] for k in ['bytes','sha256']}=={'bytes':105024551,'sha256':'2cd35f145f5362264a720708325c22e283a3828d21899058f17422ba87103c08'};assert (apk.parent/'SHA256SUMS.txt').read_text()==signed['sha256']+'  '+apk.name+'\n';assert apk.stat().st_size<build.limits(GAME)['maxApkBytes']
with zipfile.ZipFile(apk) as z:
 names=z.namelist();assert len(names)==len(set(names));assert {n[7:] for n in names if n.startswith('assets/') and not n.endswith('/')}==set(expected);content={};allentries={}
 for n in names:
  safe(n.rstrip('/'));i=z.getinfo(n);assert not stat.S_ISLNK(i.external_attr>>16)
  if n.endswith('/'):continue
  data=z.read(n);allentries[n]={'bytes':len(data),'sha256':digest(data)}
  if n.startswith('assets/'):assert data==expected[n[7:]],n
  if not n.startswith('META-INF/'):content[n]=digest(data)
 assert content==signed['contentSha256']
del expected
pin=(FROZEN/'tools/puretv-release-certificate-v2.sha256').read_text().strip();env={**os.environ,'JAVA_HOME':str(JDK),'PATH':str(JDK/'bin')+os.pathsep+os.environ['PATH'],'JAVA_TOOL_OPTIONS':'-Djava.io.tmpdir=/dev/shm/racing-review-driving/tmp'}
def verify(path,identity,label):
 r=subprocess.run([str(TOOLS/'apksigner'),'verify','--verbose','--print-certs',str(path)],capture_output=True,text=True,env=env,timeout=120);(DOC/(label+'-apksigner.txt')).write_text(r.stdout+r.stderr);assert r.returncode==0;cert=re.search(r'Signer #1 certificate SHA-256 digest: (\S+)',r.stdout)[1].lower();assert cert==pin==identity['certificateSha256'];badging=subprocess.check_output([str(TOOLS/'aapt'),'dump','badging',str(path)],text=True,env=env,timeout=60);(DOC/(label+'-badging.txt')).write_text(badging);m=re.search(r"package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'",badging);assert m and (m[1],int(m[2]),m[3])==(identity['packageName'],identity['versionCode'],identity['versionName']);assert record(path)=={k:identity[k] for k in ['bytes','sha256']};minimum=re.findall(r"^sdkVersion:'([0-9]+)'$",badging,re.M);target=re.findall(r"^targetSdkVersion:'([0-9]+)'$",badging,re.M);assert minimum==['26'] and target==['35'];return {'packageName':m[1],'versionCode':int(m[2]),'versionName':m[3],'certificateSha256':cert,'minSdk':26,'targetSdk':35,**record(path)}
identity=verify(apk,signed,'game');assert observer['targetPackage']==identity['packageName'];observer_identity=verify(PACKAGE/'observers'/GAME/observer['apk'],observer['apkIdentity'],'observer')
save(DOC/'apk-entry-hashes.json',allentries);save(DOC/'payload-verification.json',expected_records);save(DOC/'source-verification.json',{'originalSource':SOURCE,'selectorFileSetEqualOriginalCompleteGitTree':True,'originalSelectorMatchesReceipt':True,'gameSourceFiles':len(inputs),'observerSourceFiles':len(observer['sourceFiles']),'combinedSourceFiles':len(combined),'hardlinkedExactCurrentBytes':hardlinked,'materializedChangedSmallFrozenFiles':written,'records':combined})
result={'status':'passed','scope':'Original signed package integrity/source/assets/fixed-certificate audit only; no build/sign/install or runtime acceptance','sourceCommit':SOURCE,'sourceRun':RUN,'originalArtifact':14579726223,'transferredDraftAsset':769487716,'wrapper':load(PARENT/'signed-wrapper-download-attempt-2.json'),'game':identity,'observer':observer_identity,'completeSourceFiles':len(combined),'gameSourceInputs':len(inputs),'observerSourceInputs':len(observer['sourceFiles']),'assets':338,'allPayloadBytesMatchOriginalSource':True,'allNonMetaInfEntriesMatchSignedAndUnsignedReceipts':True,'originalSelectorInventoryMatchesWholeOriginalGitTree':True,'originalRuntimeStatus':'failure','gameRuntimeTestedByAudit':False,'physicalTvTested':False,'published':False,'apkExceedsGitHub100MiBBy':apk.stat().st_size-100*1024*1024,'scratchPackagePath':str(apk),'scratchAuditView':str(WORK),'script':record(Path(__file__)),'at':datetime.datetime.now(datetime.timezone.utc).isoformat()};save(DOC/'result.json',result);print(json.dumps({k:result[k] for k in ['status','game','observer','completeSourceFiles','assets','originalRuntimeStatus']}))
