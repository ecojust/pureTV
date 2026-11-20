from pathlib import Path,PurePosixPath
import argparse,json,subprocess,hashlib,urllib.request,concurrent.futures
p=argparse.ArgumentParser();p.add_argument('--run',type=int,required=True);p.add_argument('--reader',type=int,required=True);p.add_argument('--commit',required=True);p.add_argument('--kind',required=True);p.add_argument('--complete',action='store_true');a=p.parse_args();r=Path('/dev/shm/puretv-submit');out=r/f'docs/racing-nine/native-readiness/ci-{a.run}-attempt-1';ident=json.loads((out/'identity.json').read_text());dest=out/f'original-{a.kind}-export';dest.mkdir(exist_ok=True)
raw=subprocess.check_output(['gh','api',f'repos/ecojust/pureTV/git/trees/{a.commit}?recursive=1'],cwd=r);(out/f'readonly-{a.kind}-export-tree.json').write_bytes(raw);tree=json.loads(raw);assert not tree['truncated'];blobs={x['path']:x for x in tree['tree'] if x['type']=='blob'}
def fetch(item):
 name,obj=item;p=PurePosixPath(name);assert not p.is_absolute() and '..' not in p.parts and obj['mode']=='100644';target=dest/name
 if target.exists():assert target.is_file() and not target.is_symlink();data=target.read_bytes()
 else:
  for attempt in range(3):
   try:
    with urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+a.commit+'/'+name,timeout=45) as f:data=f.read()
    break
   except Exception:
    if attempt==2:raise
  target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 assert len(data)==obj['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==obj['sha'];return name,{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlobSha1':obj['sha']}
records=dict([fetch(('export-manifest.json',blobs['export-manifest.json']))]);manifest=json.loads((dest/'export-manifest.json').read_text());assert manifest['sourceRunId']==a.run and manifest['sourceRunAttempt']==1 and manifest['exportRunId']==a.reader and manifest['sourceCommit']==ident['sourceCommit'] and manifest['workflowSourceCommit']==ident['workflowSourceCommit'];assert set(manifest['files'])==set(blobs)-{'export-manifest.json'}
selected=list(blobs) if a.complete else [n for n in blobs if n.endswith('/report.json') or n in ['artifact/batch-report.json'] or n.endswith('/package-verification.json')]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:records.update(pool.map(fetch,[(n,blobs[n]) for n in selected if n not in records]))
for name,rec in records.items():
 if name!='export-manifest.json':assert {k:rec[k] for k in ['bytes','sha256']}==manifest['files'][name]
for name in records:
 if any('/'+mode+'/report.json' in name for mode in ['native','occupied-port','rosetta']):
  j=json.loads((dest/name).read_text());print(json.dumps({'path':name,'status':j['status'],'tests':[(x['name'],x['status']) for x in j['tests']],'errorLastLine':j.get('error','').strip().splitlines()[-1][:500] if j.get('error') else None}),flush=True)
result={'sourceRunId':a.run,'sourceRunAttempt':1,'sourceCommit':manifest['sourceCommit'],'workflowSourceCommit':manifest['workflowSourceCommit'],'exportRunId':a.reader,'exportCommit':a.commit,'files':records,'fileCount':len(records),'totalBytes':sum(x['bytes'] for x in records.values()),'partial':not a.complete,'expectedFileCount':len(blobs),'expectedTotalBytes':sum(x['size'] for x in blobs.values()),'gamesRerun':False}
if a.complete:assert set(records)==set(blobs)
(out/f'readonly-{a.kind}-export-'+('verification.json' if a.complete else 'partial-verification.json')).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='files'}))
