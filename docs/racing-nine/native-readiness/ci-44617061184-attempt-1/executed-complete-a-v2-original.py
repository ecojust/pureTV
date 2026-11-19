from pathlib import Path,PurePosixPath
import json,hashlib,urllib.request,concurrent.futures
root=Path('/dev/shm/puretv-submit');out=root/'docs/racing-nine/native-readiness/ci-44617061184-attempt-1';dest=out/'original-preserved-runtime';commit='6ef42c7a623fa87b93f2e5491e6c75634e695ada';tree=json.loads((out/'preserved-runtime-tree.json').read_text());assert not tree['truncated'];blobs={x['path']:x for x in tree['tree'] if x['type']=='blob'};hardlinked=[]
reusable={}
for vpath in [root/'docs/racing-nine/native-readiness/ci-44615672670-attempt-1'/f'readonly-{kind}-export-verification.json' for kind in ['arm','intel']]:
 v=json.loads(vpath.read_text());base=vpath.parent/('original-arm-export' if '-arm-' in vpath.name else 'original-intel-export')
 for name,rec in v['files'].items():reusable.setdefault(rec['gitBlobSha1'],base/name)
def gitsha(data):return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
def fetch(item):
 n,obj=item;p=PurePosixPath(n);assert not p.is_absolute() and '..' not in p.parts and obj['mode']=='100644';target=dest/n;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists():data=target.read_bytes()
 elif obj['sha'] in reusable:
  old=reusable[obj['sha']];data=old.read_bytes();assert gitsha(data)==obj['sha'];target.hardlink_to(old);hardlinked.append(n)
 else:
  for i in range(3):
   try:
    with urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+commit+'/'+n,timeout=45) as resp:data=resp.read()
    break
   except Exception:
    if i==2:raise
  target.write_bytes(data)
 assert len(data)==obj['size'] and gitsha(data)==obj['sha'];return n,{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlobSha1':obj['sha']}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:records=dict(pool.map(fetch,blobs.items()))
m=json.loads((dest/'export-manifest.json').read_text());assert m['runId']==44617061184 and m['runAttempt']==1 and m['qaSourceCommit']=='e7ba7d87faee02316200b3dc5dd36ab04cee493b' and m['sourceCommit']=='68d343d22c762c904eb83854d4ab9c4113a7c30f';assert set(m['files'])==set(records)-{'export-manifest.json'}
for n,r in m['files'].items():assert r=={k:records[n][k] for k in ['bytes','sha256']}
result={'originalRun':44617061184,'immutableExportCommit':commit,'partial':False,'fileCount':len(records),'totalBytes':sum(r['bytes'] for r in records.values()),'sourceCommit':m['sourceCommit'],'qaSourceCommit':m['qaSourceCommit'],'files':records,'hardlinksReused':sorted(hardlinked),'originalReportsModified':False,'nativeRerun':False};(out/'preserved-runtime-verification.json').write_text(json.dumps(result,indent=2)+'\n');(out/'executed-complete-a-v2-original.py').write_bytes(Path(__file__).read_bytes());print(json.dumps({'files':len(records),'bytes':result['totalBytes'],'hardlinks':len(hardlinked)}),flush=True)
