from pathlib import Path,PurePosixPath
import json,subprocess,urllib.request,tarfile,io,hashlib,datetime,sys
REPO=Path('/dev/shm/puretv-submit');DOC=REPO/'docs/racing-nine/windows-failures-44606210717';game=sys.argv[1];request=json.loads((DOC/'requests'/(game+'-dispatch.json')).read_text());reader=request['readerRunId'];source=request['sourceSha']
base=DOC/game;assert not (base/'restoration.json').exists(),'Already restored; inspect existing evidence'
def api(path):return json.loads(subprocess.check_output(['gh','api','repos/ecojust/pureTV/'+path],timeout=40))
def save(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,indent=2)+'\n')
run=api('actions/runs/'+str(reader));assert run['head_sha']==source and run['head_branch']==request['readerRef']
if run['status']!='completed':print(json.dumps({'game':game,'reader':reader,'status':run['status']}));raise SystemExit(3)
assert run['conclusion']=='success',run['conclusion']
ref=api('git/ref/heads/build-assets/joystick-catalog-windows-evidence-'+str(reader)+'-attempt-1');commit=ref['object']['sha'];assert ref['object']['type']=='commit'
tree=api('git/trees/'+commit+'?recursive=1');assert tree.get('truncated') is False
blobs={x['path']:x for x in tree['tree'] if x['type']=='blob'};assert len(blobs)<=1500 and sum(x['size'] for x in blobs.values())<100_000_000
assert all(x['mode']=='100644' or x['mode']=='100755' for x in blobs.values())
for name in blobs:
 p=PurePosixPath(name);assert name==p.as_posix() and not p.is_absolute() and '..' not in p.parts and '\\' not in name and '.git' not in p.parts;assert p.suffix.lower() not in {'.apk','.exe','.dll','.dmg','.zip'}
url='https://codeload.github.com/ecojust/pureTV/tar.gz/'+commit
with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'pureTV-original-evidence-audit'}),timeout=45) as response:data=response.read(50_000_001)
assert len(data)<=50_000_000
out=base/'original-export';out.mkdir(parents=True,exist_ok=False);actual={}
with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as archive:
 for member in archive:
  p=PurePosixPath(member.name);assert not p.is_absolute() and '..' not in p.parts and '\\' not in member.name
  assert p.parts[0]=='pureTV-'+commit and (member.isdir() or member.isfile())
  if member.isdir():continue
  name=PurePosixPath(*p.parts[1:]).as_posix();assert name in blobs and name not in actual and member.size==blobs[name]['size']
  raw=archive.extractfile(member).read();assert len(raw)==member.size
  blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest();assert blob==blobs[name]['sha'],name
  dest=out/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw)
  actual[name]={'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'gitBlobSha':blob}
assert set(actual)==set(blobs)
manifest=json.loads((out/'export-manifest.json').read_text());assert manifest['sourceCommit']==source and manifest['readerSourceCommit']==source and manifest['artifactRunId']==44606210717 and manifest['artifactRunAttempt']==1 and manifest['readerRunId']==reader and manifest['game']==game
assert manifest['gamesLaunched'] is False and manifest['installationPackagesIncluded'] is False
assert set(actual)==set(manifest['files'])|{'export-manifest.json'}
for name,expected in manifest['files'].items():assert expected=={k:actual[name][k] for k in ['bytes','sha256']}
original=json.loads((out/'evidence/evidence-manifest.json').read_text());assert original['sourceCommit']==source and original['game']==game and str(original['runId'])=='44606210717' and str(original['runAttempt'])=='1'
missing={x['path'] for x in manifest['missingOriginalFiles']};verified=0
for name,expected in original['files'].items():
 if name in missing:assert 'evidence/'+name not in actual;continue
 assert {k:actual['evidence/'+name][k] for k in ['bytes','sha256']}==expected,name;verified+=1
assert verified==manifest['verifiedOriginalFiles']
save(base/'reader-run.json',run);save(base/'export-ref.json',ref);save(base/'export-git-tree.json',tree)
r={'game':game,'restoredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'originalSourceSha':source,'originalRunId':44606210717,'originalAttempt':1,'readerRunId':reader,'exportCommit':commit,'archive':{'url':url,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()},'gitBlobsVerified':len(actual),'originalFilesVerified':verified,'missingOriginalFiles':manifest['missingOriginalFiles'],'files':actual,'productionOrRuntimeRerun':False}
save(base/'restoration.json',r);print(json.dumps({k:r[k] for k in ['game','readerRunId','exportCommit','gitBlobsVerified','originalFilesVerified','missingOriginalFiles']}))
