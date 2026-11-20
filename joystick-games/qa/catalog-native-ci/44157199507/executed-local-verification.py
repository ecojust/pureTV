from pathlib import Path
import sys,json,hashlib,subprocess,importlib.util
repo=Path('/dev/shm/puretv-joystick-games');base=Path('/dev/shm/joystick-android-ci-followup/adventure01-original-export');source='dfae2fb0979314424ef3e4f2c7cb7cfcac91885d';commit='d3d9238e2028e750dfbfa55bcb32685a0cb243c6';tools=Path('/workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0');sys.path.insert(0,str(repo/'tools'));from resource_catalog import apk_info
m=json.loads((base/'export-manifest.json').read_text());assert len(m['files'])==383 and m['sourceSha']==source and m['runId']=='44157199507';sha=lambda b:hashlib.sha256(b).hexdigest();count=0
for rel,value in m['files'].items():
 data=(base/rel).read_bytes();assert value=={'bytes':len(data),'sha256':sha(data)}
 frozen=None
 if rel.startswith('artifact-source/'):frozen=rel[len('artifact-source/'):]
 elif '/executed-source/' in rel:frozen=rel.split('/executed-source/',1)[1]
 elif '/source/' in rel and rel.startswith('reports/joystick-android-report-runtime-'):frozen=rel.split('/source/',1)[1]
 if frozen:assert data==subprocess.check_output(['git','show',source+':'+frozen],cwd=repo),rel;count+=1
results=[]
for slug in ['glup','emberbrood']:
 apk=base/'packages'/slug/(slug+'-0.1.0.apk');receipt=json.loads((apk.parent/'signing-receipt.json').read_text());identity=apk_info(apk,tools);assert all(receipt[k]==v for k,v in identity.items());assert identity['certificateSha256']=='eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23';observer=base/'observers'/slug/('observer-'+slug+'.apk');obs=apk_info(observer,tools);assert obs==json.loads((observer.parent/'observer-signing-receipt.json').read_text())['apkIdentity']
 reports=[]
 for mode in ['normal','occupied']:
  p=base/'reports'/('joystick-android-report-runtime-'+slug)/(slug+'-'+mode)/'report.json';r=json.loads(p.read_text());assert r['sourceCommit']==source;assert r['apk']['sha256']==identity['sha256'];reports.append({'mode':mode,'status':r['status'],'tests':len(r['tests']),'reportPath':str(p.relative_to(base)),'sha256':sha(p.read_bytes()),'errorLastLine':r.get('error','').strip().splitlines()[-1] if r.get('error') else None})
 results.append({'game':slug,'package':identity,'observer':obs,'sourceInputs':len(receipt['sourceInputs']),'assetsVerified':len(receipt['assets']),'reports':reports})
record={'status':'passed','scope':'Local independent package/archive/source verification, not a new CI or runtime pass. Frozen android-release.py verify additionally passed fixed signature, identity, full ZIP content, all assets and complete source inventory for both packages and Observers.','sourceSha':source,'runId':'44157199507','exportCommit':commit,'exportFilesVerified':383,'sourceCopiesVerifiedAgainstFrozenGit':count,'manifestSha256':sha((base/'export-manifest.json').read_bytes()),'games':results,'physicalTvTested':False,'physicalEsp32Tested':False};(base.parent/'adventure01-independent-verification.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({'status':record['status'],'exportFilesVerified':383,'sourceCopies':count,'games':[{'game':r['game'],'package':r['package'],'runtime':[x['status'] for x in r['reports']]} for r in results]}))
