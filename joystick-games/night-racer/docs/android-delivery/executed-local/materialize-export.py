import base64,concurrent.futures,hashlib,json,os,subprocess
from pathlib import Path
repo=Path('/dev/shm/puretv-submit');base=Path(__file__).resolve().parent;small=base/'original-small-c6328e03941bbc70a650f33dabcdbd7c555f15c0';out=repo/'joystick-games/night-racer/docs/android-delivery/original-export';assert not out.exists();out.mkdir(parents=True);tree=json.loads((small/'original-git-tree.json').read_text());entries={e['path']:e for e in tree['tree'] if e['type']=='blob'};manifest=json.loads((small/'export-manifest.json').read_text());assert manifest['qaRunId']=='44618869289' and manifest['runtimeAccepted'] is True
artifact_source='315f8889ea677ed6a9211bf7d66c8c78dff57f01';qa_source='f3e1e9f6634e35d1c9ae0cfbf1f8a51d42de7965';records={};cache={};network=[]
def verify(name,data,method):
 e=entries[name];record={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()};assert len(data)==e['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==e['sha'],name
 if name!='export-manifest.json':assert record==manifest['files'][name],name
 target=out/name;target.parent.mkdir(parents=True,exist_ok=True);assert not target.exists()
 if e['sha'] in cache:os.link(cache[e['sha']],target)
 else:target.write_bytes(data);cache[e['sha']]=target
 records[name]=dict(record,gitBlobSha=e['sha'],method=method)
for name,e in entries.items():
 assert e['mode'] in ['100644','100755'] and not name.startswith('/') and '..' not in Path(name).parts and e['size']<16_000_000
 if (small/name).is_file():verify(name,(small/name).read_bytes(),'Previously fetched exact Git blob');continue
 source=None;path=None
 for marker,sha in [('/artifact-source/',artifact_source),('/executed-source/',qa_source),('/source/',qa_source)]:
  if marker in name:source=sha;path=name.split(marker,1)[1];break
 if source:
  data=subprocess.check_output(['git','show',source+':'+path],cwd=repo);verify(name,data,'Local fixed Git bytes independently matched original export Git blob and manifest: '+source);continue
 network.append(name)
print(json.dumps({'verifiedLocalFiles':len(records),'remainingNetworkFiles':len(network),'remainingBytes':sum(entries[n]['size'] for n in network)}),flush=True)
def fetch(name):
 e=entries[name];raw=subprocess.check_output(['/usr/bin/gh','api','repos/ecojust/pureTV/git/blobs/'+e['sha']],timeout=90);value=json.loads(raw);assert value['encoding']=='base64';data=base64.b64decode(value['content']);assert len(data)==value['size'];return name,data
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for name,data in pool.map(fetch,network):verify(name,data,'GET exact immutable Git blob')
assert set(records)==set(entries);assert set(manifest['files'])==set(entries)-{'export-manifest.json'}
summary={'status':'passed','qaRun':44618869289,'qaAttempt':1,'qaSource':qa_source,'artifactSource':artifact_source,'immutableExport':'c6328e03941bbc70a650f33dabcdbd7c555f15c0','files':records,'verifiedFiles':len(records),'bytes':sum(x['bytes'] for x in records.values()),'runtimeAccepted':manifest['runtimeAccepted'],'sourceMaterialization':'Fixed local Git source bytes were checked against both export manifest SHA256/size and immutable export tree Git blob SHA1. Remaining files were fetched as original Git blobs. Identical immutable export files may share inode; no hard links to mutable production sources.'};(out.parent/'original-export-verification.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps({k:v for k,v in summary.items() if k!='files'}),flush=True)
