import concurrent.futures,hashlib,json,time,urllib.request
from pathlib import Path,PurePosixPath
OUT=Path('/dev/shm/puretv-submit/docs/racing-nine/native-readiness/ci-44593224015-attempt-1')
COMMIT='b2cfc46f1a40edca7e8cf687304b70f7dcfb2a5c'
tree=json.loads((OUT/'export-tree.json').read_bytes());assert not tree['truncated']
blobs={item['path']:item for item in tree['tree'] if item['type']=='blob'}
selected={name:item for name,item in blobs.items() if not name.endswith(('.zip','.dmg'))}
base=OUT/'original-export';base.mkdir(exist_ok=False)
def fetch(pair):
 name,item=pair;relative=PurePosixPath(name);assert not relative.is_absolute() and '..' not in relative.parts and item['mode']=='100644'
 error=None
 for attempt in range(3):
  try:
   with urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+COMMIT+'/'+name,timeout=45) as response:data=response.read()
   break
  except Exception as caught:
   error=caught
 else:raise error
 assert len(data)==item['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==item['sha'],name
 target=base/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 return name,{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlobSha1':item['sha']}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as workers:records=dict(workers.map(fetch,selected.items()))
manifest=json.loads((base/'export-manifest.json').read_bytes())
assert manifest['sourceCommit']=='33e8183835f5eaf6c7361eaa41ff34c1462dfdee' and manifest['runId']==44593224015 and manifest['runAttempt']==1
for name,record in records.items():
 if name!='export-manifest.json':assert {key:record[key] for key in ['bytes','sha256']}==manifest['files'][name],name
result={'sourceRunId':44593224015,'sourceAttempt':1,'sourceCommit':manifest['sourceCommit'],'exportCommit':COMMIT,'method':'Read-only immutable original export; Git blob and manifest bytes/SHA verification','gamesRerun':False,'packagesDownloaded':False,'files':records,'omittedPackageFiles':{name:item['size'] for name,item in blobs.items() if name not in selected},'fileCount':len(records),'totalBytes':sum(v['bytes'] for v in records.values())}
(OUT/'export-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({key:result[key] for key in ['exportCommit','fileCount','totalBytes']}))
