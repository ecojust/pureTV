import base64,hashlib,importlib.util,json,os,subprocess,zipfile,datetime,shutil
from pathlib import Path
ROOT=Path('/dev/shm/puretv-submit'); SCRATCH=Path(__file__).parent
OUT=ROOT/'joystick-games/kart-royale/docs/android-package-audit-44616011172';OUT.mkdir(exist_ok=False)
SOURCE='6c7cb4fdb99dce236b634c842326bae6aed5f232';EXPORT='5fe9ceda41c134619c613ac352ac8f22ed5d96bb';RUN=44616011172;SLUG='kart-royale'
BUILD_TOOLS=Path('/workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0')
def digest(data):return hashlib.sha256(data).hexdigest()
def api(path):
 raw=subprocess.run(['/usr/bin/gh','api','repos/ecojust/pureTV/'+path],capture_output=True,check=True,timeout=45).stdout
 return json.loads(raw)
tree=api('git/trees/'+EXPORT+'?recursive=1');assert not tree.get('truncated')
blobs={v['path']:v for v in tree['tree'] if v['type']=='blob'}
def fetch(name,binary=False):
 item=blobs[name];assert item['mode']=='100644' and item['size']<2_000_000
 value=api('git/blobs/'+item['sha']);assert value['encoding']=='base64'
 data=base64.b64decode(value['content']);assert len(data)==item['size']==value['size'];assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==item['sha']==value['sha']
 if name!='export-manifest.json':assert {'bytes':len(data),'sha256':digest(data)}==manifest['files'][name]
 p=(SCRATCH/'binary' if binary else OUT/'original-small-export')/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
 fetched.append({'path':name,'bytes':len(data),'sha256':digest(data),'gitBlobSha':item['sha'],'binaryRetainedOnlyInScratch':binary})
 return p
fetched=[];mp=fetch('export-manifest.json');manifest=json.loads(mp.read_text());assert manifest['sourceSha']==SOURCE and str(manifest['runId'])==str(RUN) and str(manifest['runAttempt'])=='1'
assert manifest['buildResult']==manifest['signResult']=='success' and manifest['runtimeResult']=='failure'
for name in manifest['files']:
 assert name in blobs and blobs[name]['mode']=='100644' and blobs[name]['size']==manifest['files'][name]['bytes']
smallnames=['packages/kart-royale/'+n for n in ['signing-receipt.json','build-receipt.json','SHA256SUMS.txt']]+['observers/kart-royale/'+n for n in ['observer-build.json','observer-signing-receipt.json']]
for name in smallnames:fetch(name)
archive=OUT/'original-small-export';receipt=json.loads((archive/'packages/kart-royale/signing-receipt.json').read_text());unsigned=json.loads((archive/'packages/kart-royale/build-receipt.json').read_text())
apk=fetch('packages/kart-royale/kart-royale-0.1.0.apk',True);observer_apk=fetch('observers/kart-royale/observer-kart-royale.apk',True)
spec=importlib.util.spec_from_file_location('fixed_audit_inputs',ROOT/'joystick-games/tools/android-runtime-inputs.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.check_receipt_origin(receipt,SOURCE,str(RUN));assert receipt['game']==SLUG
assert unsigned['sourceSha']==SOURCE and str(unsigned['runId'])==str(RUN) and unsigned['game']==SLUG and unsigned['unsigned'] is True and unsigned['committedInputsVerified'] is True
assert unsigned['sha256']==receipt['unsignedSha256'] and unsigned['contentSha256']==receipt['contentSha256']
inputs=receipt['sourceInputs'];assert set(inputs)==m.expected_inputs(ROOT,SOURCE,SLUG);assert unsigned['sourceInputsSha256']==digest(json.dumps(inputs,sort_keys=True,separators=(',',':')).encode())
frozen={};sourcechecks=[]
for name,expected in inputs.items():
 data=m.frozen(ROOT,SOURCE,name);assert {'bytes':len(data),'sha256':digest(data)}==expected
 exported='artifact-source/'+name;assert exported in blobs and manifest['files'][exported]==expected
 assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==blobs[exported]['sha']
 frozen[name]=data;sourcechecks.append({'path':name,**expected,'gitBlobSha':blobs[exported]['sha']})
meta=json.loads(frozen['joystick-games/kart-royale/game.json']);registry=m.build.registry_data(m.frozen(ROOT,SOURCE,m.build.REGISTRY))['games'][SLUG]
pin=m.frozen(ROOT,SOURCE,'tools/puretv-release-certificate-v2.sha256').decode().strip()
identity=m.apk_info(apk,BUILD_TOOLS);assert identity['certificateSha256']==pin and identity['packageName']==meta['packageName'] and identity['versionCode']==meta['versionCode'] and identity['versionName']==meta['version']
assert all(receipt[k]==v for k,v in identity.items());assert m.archive_content(apk)==receipt['contentSha256'];assert 0<identity['bytes']<m.build.asset_policy.limits(meta,registry)['maxApkBytes']
payload=m.frozen_payload(meta,registry,frozen,SLUG)
with zipfile.ZipFile(apk) as z:assets={n[7:]:z.read(n) for n in z.namelist() if n.startswith('assets/')}
assert assets==payload and receipt['assets']=={n:{'bytes':len(v),'sha256':digest(v)} for n,v in assets.items()}
assert (archive/'packages/kart-royale/SHA256SUMS.txt').read_text()==identity['sha256']+'  kart-royale-0.1.0.apk\n'
ob=json.loads((archive/'observers/kart-royale/observer-signing-receipt.json').read_text());obuild=json.loads((archive/'observers/kart-royale/observer-build.json').read_text());m.check_receipt_origin(ob,SOURCE,str(RUN))
assert ob['game']==SLUG and ob['targetPackage']==meta['packageName'] and ob['modelWrites'] is False and ob['clockOverrides'] is False and ob['signed'] is True and ob['testArtifactOnly'] is True
obidentity=m.apk_info(observer_apk,BUILD_TOOLS);assert obidentity==ob['apkIdentity'] and obidentity['certificateSha256']==pin and obuild['signed'] is False
for k in ['game','targetPackage','observerPackage','component','readonlyEndpoints','modelWrites','clockOverrides','sourceFiles','classFiles']:assert obuild[k]==ob[k]
for name,expected in ob['sourceFiles'].items():
 data=m.frozen(ROOT,SOURCE,name);assert {'bytes':len(data),'sha256':digest(data)}==expected
# API original job identity and completed build/sign success, no inference from whole-run status.
run=api(f'actions/runs/{RUN}/attempts/1');jobs=api(f'actions/runs/{RUN}/attempts/1/jobs?per_page=100')
assert run['id']==RUN and run['run_attempt']==1 and run['head_sha']==SOURCE and run['event']=='workflow_dispatch' and run['path']=='.github/workflows/joystick-catalog-android.yml'
assert run['status']=='completed' and run['conclusion']=='failure' and run['repository']['full_name']==run['head_repository']['full_name']=='ecojust/pureTV'
selected=[]
for name in ['build (kart-royale)','sign']:
 found=[j for j in jobs['jobs'] if j['name']==name];assert len(found)==1;j=found[0];assert j['status']=='completed' and j['conclusion']=='success' and j['head_sha']==SOURCE and j['run_id']==RUN and j['run_attempt']==1
 selected.append({k:j[k] for k in ['id','name','run_id','run_attempt','head_sha','status','conclusion']})
for name,cmd in [('actual-signature.txt',[str(BUILD_TOOLS/'apksigner'),'verify','--verbose','--print-certs',str(apk)]),('actual-badging.txt',[str(BUILD_TOOLS/'aapt'),'dump','badging',str(apk)])]:
 result=subprocess.run(cmd,capture_output=True,check=True);(OUT/name).write_bytes(result.stdout+result.stderr)
(OUT/'original-run-identity.json').write_text(json.dumps({k:run[k] for k in ['id','run_attempt','head_sha','head_branch','path','event','status','conclusion','html_url']},indent=2)+'\n')
(OUT/'original-build-sign-jobs.json').write_text(json.dumps(selected,indent=2)+'\n')
(OUT/'source-input-verification.json').write_text(json.dumps({'source':SOURCE,'files':sourcechecks},indent=2)+'\n')
(OUT/'retrieved-file-verification.json').write_text(json.dumps({'export':EXPORT,'files':fetched,'entireExportDownloaded':False,'allManifestEntriesInGitTreeWithSameSize':True},indent=2)+'\n')
executed={}
for name in ['joystick-games/tools/android-runtime-inputs.py','joystick-games/tools/android-build.py','joystick-games/tools/android-runtime-artifact.py','joystick-games/tools/artifact-draft-transfer.py','joystick-games/tools/asset-policy.py','tools/resource_catalog.py']:
 p=ROOT/name;target=OUT/'executed-tools'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(p.read_bytes());executed[name]=m.record(p)
result={'status':'passed-original-package-verification','originalRuntimePassed':False,'source':SOURCE,'run':RUN,'attempt':1,'exportCommit':EXPORT,'package':identity,'observer':obidentity,'frozenSourceInputsVerified':len(inputs),'assetsVerified':len(assets),'fullApkContentMatchesReceipt':True,'sourceGitBlobsMatchOriginalExport':True,'allExportFilesDownloaded':False,'gameOrObserverRebuilt':False,'gameLaunched':False,'physicalTvTested':False,'executedTools':executed,'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'limitations':['Original normal/occupied runtime failures remain unchanged; package verification is not gameplay acceptance.','Only selected original receipt/binary files were downloaded; other source inputs were read from the exact original local Git source and independently matched original export tree Git blob and manifest hashes.']}
(OUT/'report.json').write_text(json.dumps(result,indent=2)+'\n');shutil.copyfile(__file__,OUT/'executed-audit.py');print(json.dumps({k:result[k] for k in ['status','package','observer','frozenSourceInputsVerified','assetsVerified']},indent=2))
