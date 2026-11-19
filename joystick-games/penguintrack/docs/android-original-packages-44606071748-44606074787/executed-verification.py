import hashlib,importlib.util,json,shutil,sys,zipfile
from pathlib import Path
root=Path('/dev/shm/puretv-submit');base=Path('/dev/shm/racing-review-arcade/android-v3-monitor');out=base/'original-package-verification';out.mkdir(exist_ok=True)
spec=importlib.util.spec_from_file_location('inputs',root/'joystick-games/tools/android-runtime-inputs.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
source='c5ad63e8c6a0ccfada5f763d1d26afa27f45002e';buildtools=Path('/workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0');sha=m.sha
pin=m.frozen(root,source,'tools/puretv-release-certificate-v2.sha256').decode().strip();assert (root/'tools/puretv-release-certificate-v2.sha256').read_text().strip()==pin
result={'scope':'Independent original signed APK, Observer, frozen source inventory and full asset verification. No new build or native execution; runtime failures remain failures.','source':source,'attempt':1,'physicalTvTested':False,'games':[]}
for slug,run,commit in [('penguintrack','44606071748','35fca55f5a05d38785fb531004eca9add6913f04'),('kart-royale','44606074787','1c6617375300e9989d9f3ddcc59b6c802dbb8403')]:
 archive=base/('production-'+run+'-'+commit);manifest=json.loads((archive/'export-manifest.json').read_text());assert manifest['sourceSha']==source and str(manifest['runId'])==run and manifest['buildResult']=='success' and manifest['signResult']=='success'
 tree=json.loads((base/('production-'+run+'-git-tree.json')).read_text());assert not tree['truncated'];blobs={x['path']:x for x in tree['tree'] if x['type']=='blob'}
 allfiles={p.relative_to(archive).as_posix():p for p in archive.rglob('*') if p.is_file()};assert set(allfiles)==set(blobs)
 for name,p in allfiles.items():
  assert not p.is_symlink();b=p.read_bytes();assert len(b)==blobs[name]['size'];assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==blobs[name]['sha']
 count=m.verify_manifest(archive,manifest);receipt=json.loads((archive/'packages'/slug/'signing-receipt.json').read_text());m.check_receipt_origin(receipt,source,run);assert receipt['game']==slug
 unsigned=json.loads((archive/'packages'/slug/'build-receipt.json').read_text());assert unsigned['sourceSha']==source and str(unsigned['runId'])==run and unsigned['game']==slug and unsigned['unsigned'] and unsigned['committedInputsVerified'];assert unsigned['sha256']==receipt['unsignedSha256'] and unsigned['contentSha256']==receipt['contentSha256']
 inputs=receipt['sourceInputs'];assert set(inputs)==m.expected_inputs(root,source,slug);assert unsigned['sourceInputsSha256']==sha(json.dumps(inputs,sort_keys=True,separators=(',',':')).encode())
 frozen={}
 for name,expected in inputs.items():
  b=m.frozen(root,source,name);assert expected=={'bytes':len(b),'sha256':sha(b)};assert (archive/'artifact-source'/name).read_bytes()==b;frozen[name]=b
 meta=json.loads(frozen['joystick-games/'+slug+'/game.json']);registered=m.build.registry_data(m.frozen(root,source,m.build.REGISTRY))['games'][slug];apk=archive/'packages'/slug/(slug+'-'+meta['version']+'.apk');identity=m.apk_info(apk,buildtools)
 assert identity['certificateSha256']==pin and identity['packageName']==meta['packageName'] and identity['versionCode']==meta['versionCode'] and identity['versionName']==meta['version'];assert all(receipt[k]==v for k,v in identity.items());assert m.archive_content(apk)==receipt['contentSha256'];assert 0<identity['bytes']<m.build.asset_policy.limits(meta,registered)['maxApkBytes']
 payload=m.frozen_payload(meta,registered,frozen,slug)
 with zipfile.ZipFile(apk) as z: assets={n[7:]:z.read(n) for n in z.namelist() if n.startswith('assets/')}
 assert assets==payload;assert receipt['assets']=={n:{'bytes':len(b),'sha256':sha(b)} for n,b in assets.items()}
 obsdir=archive/'observers'/slug;observer=json.loads((obsdir/'observer-signing-receipt.json').read_text());m.check_receipt_origin(observer,source,run);assert observer['game']==slug and observer['targetPackage']==meta['packageName'] and observer['modelWrites'] is False and observer['clockOverrides'] is False and observer['testArtifactOnly'] is True
 obs=m.apk_info(obsdir/observer['apk'],buildtools);assert obs==observer['apkIdentity'] and obs['certificateSha256']==pin
 obsbuild=json.loads((obsdir/'observer-build.json').read_text());assert obsbuild['signed'] is False
 for key in ['game','targetPackage','observerPackage','component','readonlyEndpoints','modelWrites','clockOverrides','sourceFiles','classFiles']: assert obsbuild[key]==observer[key]
 for name,expected in observer['sourceFiles'].items():
  b=m.frozen(root,source,name);assert expected=={'bytes':len(b),'sha256':sha(b)}
 result['games'].append({'game':slug,'run':run,'exportCommit':commit,'gitBlobsVerified':len(blobs),'manifestFilesVerified':count,'frozenSourceInputsVerified':len(inputs),'assetsVerified':len(assets),'package':identity,'observer':obs,'originalRuntimeResult':manifest['runtimeResult'],'status':'passed-original-package-verification','runtimePassed':False})
 print(slug+' original package/source/assets/observer passed',flush=True)
result['executedSources']={}
for name in ['joystick-games/tools/android-runtime-inputs.py','joystick-games/tools/android-build.py','joystick-games/tools/android-runtime-artifact.py','tools/resource_catalog.py']:
 p=root/name;dest=out/'executed-tools'/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest);result['executedSources'][name]=m.record(p)
shutil.copyfile(__file__,out/'executed-verification.py');result['status']='passed';(out/'report.json').write_text(json.dumps(result,indent=2)+'\n');print('all passed',flush=True)
