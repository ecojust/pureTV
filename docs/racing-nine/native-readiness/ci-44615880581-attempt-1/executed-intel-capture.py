import argparse,concurrent.futures,hashlib,json,subprocess,urllib.request
from pathlib import Path,PurePosixPath
p=argparse.ArgumentParser();p.add_argument('--run',required=True,type=int);p.add_argument('--export-run',required=True,type=int);p.add_argument('--commit',required=True);p.add_argument('--kind',required=True);args=p.parse_args();out=Path('/dev/shm/puretv-submit/docs/racing-nine/native-readiness')/f'ci-{args.run}-attempt-1';identity=json.loads((out/'identity.json').read_text())
tree_bytes=subprocess.check_output(['gh','api',f'repos/ecojust/pureTV/git/trees/{args.commit}?recursive=1']);(out/f'readonly-{args.kind}-export-tree.json').write_bytes(tree_bytes);tree=json.loads(tree_bytes);assert not tree['truncated'];blobs={v['path']:v for v in tree['tree'] if v['type']=='blob'}
base=out/f'original-{args.kind}-export';base.mkdir(exist_ok=False)
def fetch(pair):
 name,item=pair;p=PurePosixPath(name);assert not p.is_absolute() and '..' not in p.parts and item['mode']=='100644'
 error=None
 for attempt in range(3):
  try:
   with urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+args.commit+'/'+name,timeout=45) as response:data=response.read()
   break
  except Exception as caught:error=caught
 else:raise error
 assert len(data)==item['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==item['sha'];target=base/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 return name,{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlobSha1':item['sha']}
priority=[n for n in blobs if n=='export-manifest.json' or n in ['artifact/batch-report.json','artifact/build-report.json'] or n.endswith('/report.json')];records=dict(fetch((name,blobs[name])) for name in priority)
for name in priority:
 r=json.loads((base/name).read_text())
 if name.endswith('/report.json'):
  error=r.get('error','');print(json.dumps({'path':name,'status':r.get('status'),'phase':r.get('failurePhase',r.get('phase')),'errorLastLine':error.strip().splitlines()[-1][:600] if error else None,'nativeArchitecture':r.get('nativeProcessArchitecture'),'renderingAvailable':r.get('renderingAvailable'),'tests':[(v.get('name'),v.get('status')) for v in r.get('tests',[])]},ensure_ascii=False),flush=True)
 elif name=='artifact/build-report.json':print(json.dumps({'build':r['status'],'sharedFailed':[v for v in r['shared'] if v['status']!='passed'],'games':[{'game':v['game'],'status':v['status'],'build':v.get('build'),'failedTests':[x for x in v['tests'] if x['status']=='failed']} for v in r['games']]},ensure_ascii=False),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:records.update(pool.map(fetch,[(n,v) for n,v in blobs.items() if n not in records]))
manifest=json.loads((base/'export-manifest.json').read_text());assert manifest['sourceRunId']==args.run and manifest['sourceRunAttempt']==1 and manifest['sourceCommit']==identity['sourceCommit'] and manifest['exportRunId']==args.export_run
for name,record in records.items():
 if name!='export-manifest.json':assert {key:record[key] for key in ['bytes','sha256']}==manifest['files'][name]
result={'sourceRunId':args.run,'sourceRunAttempt':1,'sourceCommit':manifest['sourceCommit'],'exportRunId':args.export_run,'exportCommit':args.commit,'files':records,'fileCount':len(records),'totalBytes':sum(v['bytes'] for v in records.values()),'gamesRerun':False};(out/f'readonly-{args.kind}-export-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'fileCount':result['fileCount'],'totalBytes':result['totalBytes']}))
