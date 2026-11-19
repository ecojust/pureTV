from pathlib import Path
import json,hashlib,subprocess,zipfile
base=Path('joystick-games/dirt-crown/docs/android-runtime-44608423645');pkg=base/'original-package';exp=base/'original-export'
sig=json.loads((pkg/'signing-receipt.json').read_text());source='06f1ab2b77e45d5fabcbd7233f8d3e9279a9d5c7';qa='68d343d22c762c904eb83854d4ab9c4113a7c30f'
assert sig['sourceSha']==source and sig['runId']=='44600442272'
raw=(pkg/'dirt-crown-0.1.0.apk').read_bytes();assert len(raw)==sig['bytes'] and hashlib.sha256(raw).hexdigest()==sig['sha256']
sources=sig['sourceInputs'];assert sources==json.loads((pkg/'source-inputs.json').read_text())
for name,meta in sources.items():
 b=subprocess.check_output(['git','show',source+':'+name]);assert len(b)==meta['bytes'] and hashlib.sha256(b).hexdigest()==meta['sha256'],name
 copy=exp/'evidence/joystick-android-runtime-dirt-crown/dirt-crown/verified-inputs/artifact-source'/name;assert copy.read_bytes()==b,name
assets=json.loads((pkg/'payload-sha256.json').read_text());assert assets==sig['assets']
build=json.loads((pkg/'build-receipt.json').read_text());assert build['assets']=={n:r['sha256'] for n,r in assets.items()} and build['sourceSha']==source
with zipfile.ZipFile(pkg/'dirt-crown-0.1.0.apk') as z:
 actual={p[7:] for p in z.namelist() if p.startswith('assets/') and not p.endswith('/')};assert actual==set(assets)
 for name,meta in assets.items():
  b=z.read('assets/'+name);assert len(b)==meta['bytes'] and hashlib.sha256(b).hexdigest()==meta['sha256'],name
current_dist=[]
for p in Path('joystick-games/dirt-crown/dist').rglob('*'):
 if p.is_file():
  n=p.relative_to('joystick-games/dirt-crown/dist').as_posix();assert n in assets and hashlib.sha256(p.read_bytes()).hexdigest()==assets[n]['sha256'],n;current_dist.append(n)
runtime=[]
for mode in ['normal','occupied']:
 folder=exp/'evidence/joystick-android-runtime-dirt-crown'/('dirt-crown-'+mode);x=json.loads((folder/'report.json').read_text())
 assert x['status']=='passed' and x['sourceCommit']==qa and x['targetPackage']==sig['packageName'];assert all(t['status']=='passed' for t in x['tests'])
 assert x['apk']['sha256']==sig['sha256'] and x['apk']['bytes']==sig['bytes'];assert not x['modelWrites'] and not x['clockOverrides']
 for name,meta in x['sourceFiles'].items():
  b=subprocess.check_output(['git','show',qa+':'+name]);assert len(b)==meta['bytes'] and hashlib.sha256(b).hexdigest()==meta['sha256'],name
 for row in x['captures']+[x['video']]:
  p=folder/row['path'];assert p.stat().st_size==row['bytes'] and hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256']
 runtime.append({'mode':mode,'tests':len(x['tests']),'port':x['controllerService']['port'],'qaSourceFilesVerified':len(x['sourceFiles']),'capturesVerified':len(x['captures']),'videoVerified':True,'reportSha256':hashlib.sha256((folder/'report.json').read_bytes()).hexdigest(),'wire':next(t['details'] for t in x['tests'] if t['name'].startswith('every accepted SDK'))})
result={'status':'passed','artifactSourceSha':source,'qaSourceSha':qa,'signedApk':{k:sig[k] for k in ['packageName','versionCode','versionName','certificateSha256','bytes','sha256']},'minSdk':26,'sourceInputsComparedToFixedGit':len(sources),'sourceInputsComparedToOriginalRuntimeArchivedSources':len(sources),'exactApkAssetsVerified':len(assets),'currentGameDistAssetsUnchanged':len(current_dist),'runtimeModes':runtime,'physicalTvTested':False,'physicalEsp32Tested':False,'fullCareerCompleted':False,'reviewMethod':'Local exact-source, signed package payload and original runtime evidence cross-check; no new gameplay or package build'}
(base/'independent-package-runtime-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='runtimeModes'},indent=2))
