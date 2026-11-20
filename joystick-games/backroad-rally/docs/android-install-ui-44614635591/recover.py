#!/usr/bin/env python3
"""Read-only, exact Git export subset; never downloads duplicate signed packages."""
import concurrent.futures,hashlib,json,pathlib,shutil,subprocess,time,urllib.request
OUT=pathlib.Path(__file__).resolve().parent
SCRATCH=pathlib.Path('/dev/shm/racing-review-driving')
SHA='2e0db026e138bbc8b3c5fbbb4f06ef9d109449f0'
tree_path=SCRATCH/'backroad-install-ui-44614635591-export-tree.json'
tree=json.loads(tree_path.read_text());assert tree['sha']==SHA and tree['truncated'] is False
items=[x for x in tree['tree'] if x['type']=='blob' and '/verified-inputs/' not in x['path'] and '/artifact-source/' not in x['path'] and not x['path'].endswith('.apk')]
assert len(items)==92 and sum(x['size'] for x in items)==9545825
for x in items:assert x['mode']=='100644' and not pathlib.PurePosixPath(x['path']).is_absolute() and '..' not in pathlib.PurePosixPath(x['path']).parts
errors=[]
def get(x):
 path=OUT/'original-export'/x['path'];path.parent.mkdir(parents=True,exist_ok=True)
 url='https://raw.githubusercontent.com/ecojust/pureTV/'+SHA+'/'+x['path']
 for attempt in range(3):
  try:
   data=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'pureTV-readonly-evidence'}),timeout=45).read(x['size']+1)
   assert len(data)==x['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==x['sha']
   path.write_bytes(data);return {'path':x['path'],'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlob':x['sha']}
  except Exception as e:
   errors.append({'path':x['path'],'attempt':attempt+1,'errorType':type(e).__name__})
   if attempt==2:raise
   time.sleep(attempt+1)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:records=list(pool.map(get,items))
manifest=json.loads((OUT/'original-export/export-manifest.json').read_text());assert manifest['qaRunId']=='44614635591' and manifest['qaRunAttempt']=='1' and manifest['qaSourceSha']=='cf26e19bf57524a9c4ce53ea77bd30824cbcd54d'
for r in records:
 if r['path']!='export-manifest.json':assert {k:r[k] for k in ['bytes','sha256']}==manifest['files'][r['path']]
shutil.copyfile(tree_path,OUT/'original-git-tree.json')
(OUT/'recovery-validation.json').write_text(json.dumps({'exportCommit':SHA,'sourceRun':44614635591,'sourceAttempt':1,'sourceCommit':manifest['qaSourceSha'],'subset':True,'excluded':'verified-inputs/artifact-source and APK binary duplicates; actual runtime/installation/environment evidence, exact executed sources and provenance retained','records':records,'errors':errors,'bytes':sum(x['bytes'] for x in records)},indent=2)+'\n')
print(json.dumps({'exportCommit':SHA,'files':len(records),'bytes':sum(x['bytes'] for x in records),'verified':True}))
