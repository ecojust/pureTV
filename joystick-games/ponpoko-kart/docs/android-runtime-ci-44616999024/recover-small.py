from pathlib import Path,PurePosixPath
import json,subprocess,base64,hashlib,datetime
out=Path(__file__).resolve().parent; destination=out/'original-export'; destination.mkdir(exist_ok=True)
run=44616999024; source='dd43db138bd1880aef2b74f1f5d0adcfd40d5a31'
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
assert manifest['artifactSourceSha']=='8f283c73f52f857777306eafc88f710262367834' and str(manifest['artifactRunId'])=='44597115244'
assert manifest['artifactExportCommit']=='4249f5c0ec3053a1dec652a7880a040e1bb143f0' and manifest['games']==['ponpoko-kart']
prefix='evidence/joystick-android-runtime-ponpoko-kart/ponpoko-kart/'
wanted=[prefix.rstrip('/')+'-normal/report.json',prefix.rstrip('/')+'-occupied/report.json',prefix+'emulator-version.txt',prefix+'environment-diagnostics/report.json',prefix+'environment-diagnostics/samples.jsonl',prefix+'environment-diagnostics/crash-report.json',prefix+'environment-diagnostics/executed-android-environment-diagnostics.py',prefix+'executed-source.json',prefix+'verified-inputs/input-verification.json',prefix+'verified-inputs/package-file-references.json']
missing=[]
for name in wanted:
 if name in entries:fetch(name)
 else:missing.append(name)
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'runId':run,'attempt':1,'qaSourceSha':source,'exportCommit':commit,'selectedFiles':verified,'missingSelectedFiles':missing,'bytes':total,'fullExportDownloaded':False,'apkDownloaded':False}
save(out/'selected-blob-verification.json',(json.dumps(result,indent=2)+'\n').encode())
print(json.dumps({'exportCommit':commit,'selected':len(verified),'bytes':total,'missing':missing,'runtimeAccepted':manifest['runtimeAccepted']}))
