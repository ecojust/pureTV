"""Read only exact immutable original text evidence, never APK/assets/video copies."""
from pathlib import Path,PurePosixPath
import argparse,concurrent.futures,hashlib,json,subprocess,urllib.request
parser=argparse.ArgumentParser();parser.add_argument('--commit',required=True);args=parser.parse_args();root=Path('/dev/shm/puretv-submit');out=root/'joystick-games/ponpoko-kart/docs/emulator-stack-v9-44639605971';dest=out/'original-export';dest.mkdir(exist_ok=True)
raw=subprocess.check_output(['gh','api',f'repos/ecojust/pureTV/git/trees/{args.commit}?recursive=1'],cwd=root);tree=json.loads(raw);assert tree['sha']==args.commit and tree['truncated'] is False;(out/'original-git-tree.json').write_bytes(raw);blobs={x['path']:x for x in tree['tree'] if x['type']=='blob'}
selected={};excluded={}
for name,item in blobs.items():
 p=PurePosixPath(name);assert not p.is_absolute() and '..' not in p.parts and item['mode']=='100644'
 reason=None
 if '/artifact-source/' in name or '/verified-inputs/' in name:reason='duplicate frozen asset/source/package closure; existing manifest preserves original references'
 if p.suffix.lower() in ['.apk','.zip','.dmg','.mp4','.png','.jpg','.webm']:reason='binary package/media not needed for initial diagnostic observation'
 if item['size']>16_000_000:reason='initial small-evidence per-file budget'
 if reason:excluded[name]={'bytes':item['size'],'gitBlobSha1':item['sha'],'reason':reason}
 else:selected[name]=item
assert sum(x['size'] for x in selected.values())<=32_000_000
records={}
def fetch(item):
 name,obj=item;target=dest/name;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists():assert not target.is_symlink();data=target.read_bytes()
 else:
  for attempt in range(3):
   try:
    with urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+args.commit+'/'+name,timeout=35) as resp:data=resp.read(obj['size']+1)
    break
   except Exception:
    if attempt==2:raise
  target.write_bytes(data)
 assert len(data)==obj['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==obj['sha'];return name,{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlobSha1':obj['sha']}
for name in ['export-manifest.json','runtime-verification.json']:
 if name in selected:
  n,v=fetch((name,selected[name]));records[n]=v
manifest=json.loads((dest/'export-manifest.json').read_text());assert manifest['qaRunId']=='44639605971' and manifest['qaRunAttempt']=='1' and manifest['qaSourceSha']=='c22b297146547e5503f8dc9b0bfa9163518f6673';assert manifest['artifactSourceSha']=='8f283c73f52f857777306eafc88f710262367834' and manifest['artifactExportCommit']=='4249f5c0ec3053a1dec652a7880a040e1bb143f0' and manifest['artifactRunId']=='44597115244'
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:records.update(pool.map(fetch,[(n,x)for n,x in selected.items() if n not in records]))
for name,rec in records.items():
 if name!='export-manifest.json':assert manifest['files'][name]=={k:rec[k]for k in ['bytes','sha256']}
result={'originalRun':44639605971,'runAttempt':1,'qaSource':manifest['qaSourceSha'],'artifactSource':manifest['artifactSourceSha'],'immutableExport':args.commit,'subset':True,'records':records,'excluded':excluded,'files':len(records),'bytes':sum(x['bytes']for x in records.values()),'originalReportsModified':False,'newWorkflowPost':False};(out/'recovery-validation.json').write_text(json.dumps(result,indent=2)+'\n');(out/'executed-recover.py').write_bytes(Path(__file__).read_bytes());print(json.dumps({k:v for k,v in result.items() if k not in ['records','excluded']}))
