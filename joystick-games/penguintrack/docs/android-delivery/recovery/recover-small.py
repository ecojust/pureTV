from pathlib import Path,PurePosixPath
import json,subprocess,base64,hashlib,datetime
out=Path(__file__).resolve().parent; destination=out/'original-export'; destination.mkdir(exist_ok=True)
run=44634808045; source='3cf2452db9853a3a189c47342a291f046e411b5a'
def api(endpoint):
 result=subprocess.run(['/usr/bin/gh','api','repos/ecojust/pureTV/'+endpoint],capture_output=True,timeout=60)
 if result.returncode:raise RuntimeError('Read-only API failed with exit '+str(result.returncode))
 return result.stdout,json.loads(result.stdout)
def save(path,raw):
 if path.exists():assert path.read_bytes()==raw,'Original evidence mismatch'
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
raw,ref=api('git/ref/heads/build-assets/joystick-catalog-android-runtime-'+str(run)+'-attempt-1');save(out/'export-ref.json',raw)
commit=ref['object']['sha'];assert ref['object']['type']=='commit'
raw,tree=api('git/trees/'+commit+'?recursive=1');assert not tree['truncated'];save(out/'original-tree.json',raw)
entries={row['path']:row for row in tree['tree'] if row['type']=='blob'};verified=[];total=0
manifest=None
def fetch(name):
 global total
 item=entries[name];assert item['mode']=='100644';assert 0<item['size']<8*1024*1024
 assert not PurePosixPath(name).is_absolute() and '..' not in PurePosixPath(name).parts
 _,value=api('git/blobs/'+item['sha']);assert value['encoding']=='base64';data=base64.b64decode(value['content'])
 assert len(data)==item['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==item['sha']
 digest=hashlib.sha256(data).hexdigest()
 if manifest is not None:assert manifest['files'][name]=={'bytes':len(data),'sha256':digest}
 total+=len(data);assert total<16*1024*1024
 save(destination/name,data);verified.append({'path':name,'bytes':len(data),'gitBlob':item['sha'],'sha256':digest})
 return data
manifest=json.loads(fetch('export-manifest.json'))
assert manifest['qaSourceSha']==source and str(manifest['qaRunId'])==str(run) and str(manifest['qaRunAttempt'])=='1'
assert manifest['artifactSourceSha']=='c5ad63e8c6a0ccfada5f763d1d26afa27f45002e' and str(manifest['artifactRunId'])=='44606071748'
assert manifest['artifactExportCommit']=='35fca55f5a05d38785fb531004eca9add6913f04' and manifest['games']==['penguintrack']
prefix='evidence/joystick-android-runtime-penguintrack/penguintrack/'
wanted=['runtime-verification.json','archive-verification.json',prefix.rstrip('/')+'-outcomes.json',prefix.rstrip('/')+'-normal/report.json',prefix.rstrip('/')+'-occupied/report.json',prefix+'emulator-version.txt',prefix+'executed-source.json',prefix+'qa-contracts.log',prefix+'artifact-contracts.log',prefix+'input-verification.log',prefix+'verified-inputs/input-verification.json',prefix+'verified-inputs/packages/penguintrack/signing-receipt.json',prefix+'verified-inputs/observers/penguintrack/observer-signing-receipt.json']
missing=[]
for name in wanted:
 if name in entries:fetch(name)
 else:missing.append(name)
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'runId':run,'attempt':1,'qaSourceSha':source,'exportCommit':commit,'selectedFiles':verified,'missingSelectedFiles':missing,'bytes':total,'fullExportDownloaded':False,'apkDownloaded':False}
save(out/'selected-blob-verification.json',(json.dumps(result,indent=2)+'\n').encode())
print(json.dumps({'exportCommit':commit,'selected':len(verified),'bytes':total,'missing':missing,'runtimeAccepted':manifest['runtimeAccepted']}))
