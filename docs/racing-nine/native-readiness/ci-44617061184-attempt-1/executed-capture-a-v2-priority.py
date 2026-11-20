from pathlib import Path,PurePosixPath
import json,hashlib,subprocess,urllib.request,concurrent.futures
root=Path('/dev/shm/puretv-submit');run=44617061184;commit='6ef42c7a623fa87b93f2e5491e6c75634e695ada';out=root/f'docs/racing-nine/native-readiness/ci-{run}-attempt-1';dest=out/'original-preserved-runtime';dest.mkdir(exist_ok=True)
raw=subprocess.check_output(['gh','api',f'repos/ecojust/pureTV/git/trees/{commit}?recursive=1'],cwd=root);(out/'preserved-runtime-tree.json').write_bytes(raw);tree=json.loads(raw);assert not tree['truncated'];blobs={x['path']:x for x in tree['tree'] if x['type']=='blob'}
chosen={n:x for n,x in blobs.items() if n=='export-manifest.json' or n.endswith('/report.json') or n.endswith('/batch-report.json') or n=='provenance/plan.json'}
def fetch(item):
 n,obj=item;p=PurePosixPath(n);assert not p.is_absolute() and '..' not in p.parts and obj['mode']=='100644';target=dest/n;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists():data=target.read_bytes()
 else:
  for i in range(3):
   try:
    with urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+commit+'/'+n,timeout=45) as resp:data=resp.read()
    break
   except Exception:
    if i==2:raise
  target.write_bytes(data)
 assert len(data)==obj['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==obj['sha'];r={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlobSha1':obj['sha']}
 if any(n.endswith('/'+mode+'/report.json') for mode in ['native','occupied-port','rosetta']):
  j=json.loads(data);print(json.dumps({'path':n,'status':j['status'],'phase':j.get('failurePhase'), 'tests':[(x['name'],x['status'])for x in j['tests']],'error':j.get('error','')[-1800:]},ensure_ascii=False),flush=True)
 return n,r
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:records=dict(pool.map(fetch,chosen.items()))
m=json.loads((dest/'export-manifest.json').read_text());assert m['runId']==run and m['runAttempt']==1 and m['sourceCommit']=='68d343d22c762c904eb83854d4ab9c4113a7c30f' and m['qaSourceCommit']=='e7ba7d87faee02316200b3dc5dd36ab04cee493b'
for n,r in records.items():
 if n=='export-manifest.json':continue
 assert m['files'][n]=={k:r[k]for k in ['bytes','sha256']}
v={'originalRun':run,'immutableExportCommit':commit,'partial':True,'fileCount':len(records),'totalBytes':sum(v['bytes'] for v in records.values()),'expectedFileCount':len(blobs),'files':records,'sourceCommit':m['sourceCommit'],'qaSourceCommit':m['qaSourceCommit'],'originalReportsModified':False,'nativeRerun':False};(out/'preserved-runtime-priority-verification.json').write_text(json.dumps(v,indent=2)+'\n');(out/'executed-capture-a-v2-priority.py').write_bytes(Path(__file__).read_bytes());print(json.dumps({'files':len(records),'bytes':v['totalBytes'],'partial':True}),flush=True)
