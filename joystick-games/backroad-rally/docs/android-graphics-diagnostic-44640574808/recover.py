from pathlib import Path,PurePosixPath
import subprocess,json,base64,hashlib,concurrent.futures,time
ROOT=Path(__file__).parent
REPO='repos/ecojust/pureTV';RUN=44640574808;SOURCE='6d91b690e4b21bb7af578b7eec4dbfe3eea4ccbd'
BRANCH='build-assets/backroad-graphics-diagnostic-44640574808-attempt-1'
def get(path):
 p=subprocess.run(['gh','api',path],capture_output=True,timeout=40)
 if p.returncode:raise RuntimeError('API request failed '+str(p.returncode)+' '+path)
 return json.loads(p.stdout)
def write(name,value):(ROOT/name).write_text(json.dumps(value,indent=2)+'\n')
def blob(entry):
 value=get(REPO+'/git/blobs/'+entry['sha']);assert value['sha']==entry['sha'] and value['size']==entry['size'] and value['encoding']=='base64'
 data=base64.b64decode(''.join(value['content'].splitlines()),validate=True)
 assert len(data)==entry['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==entry['sha']
 return data
ref=get(REPO+'/git/ref/heads/'+BRANCH);write('export-ref.json',ref);commit=ref['object']['sha'];assert ref['object']['type']=='commit'
meta=get(REPO+'/git/commits/'+commit);write('export-commit.json',meta);assert meta['sha']==commit
value=get(REPO+'/git/trees/'+meta['tree']['sha']+'?recursive=1');write('export-tree.json',value);assert value.get('truncated') is False
entries={e['path']:e for e in value['tree'] if e['type']=='blob'}
assert len(entries)<520 and sum(e['size'] for e in entries.values())<70*1024*1024
for name,e in entries.items():
 p=PurePosixPath(name);assert not p.is_absolute() and p.as_posix()==name and not set(p.parts)&{'..','.git'} and '\\' not in name and e['mode']=='100644' and e['size']<=16*1024*1024
manifest_data=blob(entries['export-manifest.json']);manifest=json.loads(manifest_data)
assert manifest['sourceSha']==SOURCE and manifest['runId']==RUN and manifest['runAttempt']==1 and manifest['formalAcceptance'] is False and manifest['visualAcceptance'] is False
assert manifest['originalTarget']['sourceSha']=='4b6cf0b8cba288eae66bcae2ef2784acc279a695' and manifest['originalTarget']['sha256']=='2cd35f145f5362264a720708325c22e283a3828d21899058f17422ba87103c08'
assert set(entries)==set(manifest['files'])|{'export-manifest.json'}
out=ROOT/'original-small-export';out.mkdir(exist_ok=False);(out/'export-manifest.json').write_bytes(manifest_data)
def fetch(item):
 name,entry=item;data=blob(entry);record={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()};assert record==manifest['files'][name]
 p=out/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
 return name,dict(record,gitBlobSha=entry['sha'])
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: verified=dict(pool.map(fetch,[(n,e) for n,e in entries.items() if n!='export-manifest.json']))
record={'sourceSha':SOURCE,'runId':RUN,'attempt':1,'exportCommit':commit,'branch':BRANCH,'manifestSha256':hashlib.sha256(manifest_data).hexdigest(),'verifiedFiles':verified,'files':len(verified),'bytes':sum(x['bytes'] for x in verified.values()),'formalAcceptance':False,'diagnosticStatus':manifest.get('diagnosticStatus'),'producerResults':manifest['producerResults'],'largeApkDownloaded':False}
write('original-small-export-verification.json',record)
print(json.dumps({k:record[k] for k in ['exportCommit','files','bytes','diagnosticStatus','producerResults','largeApkDownloaded']},indent=2))
