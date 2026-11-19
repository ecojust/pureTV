#!/usr/bin/env python3
"""Restore an immutable original plan export with Git and manifest byte checks."""
import base64,hashlib,json,subprocess
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parent
RUN=44608432599;SHA='68d343d22c762c904eb83854d4ab9c4113a7c30f';SOURCE='ea7854ca06ed53967aed00fe160034185f2906b3'
def api(path):return json.loads(subprocess.check_output(['gh','api','repos/ecojust/pureTV/'+path],timeout=90))
run=api('actions/runs/'+str(RUN))
assert run['head_sha']==SHA and run['run_attempt']==1 and run['status']=='completed' and run['conclusion']=='success'
assert run['path']=='.github/workflows/joystick-catalog-macos-evidence.yml' and run['head_branch']=='build-source/macos-plan-evidence-v1'
branch=f'build-assets/joystick-catalog-macos-evidence-{RUN}-attempt-1';ref=api('git/ref/heads/'+branch);commit=ref['object']['sha'];tree=api('git/trees/'+commit+'?recursive=1')
assert ref['object']['type']=='commit' and not tree['truncated']
out=ROOT/'original-plan-export';assert not out.exists();out.mkdir();files={}
for item in tree['tree']:
 if item['type']=='tree':continue
 name=item['path'];relative=PurePosixPath(name)
 assert item['type']=='blob' and item['mode'] in ['100644','100755'] and name==relative.as_posix() and not relative.is_absolute() and '..' not in relative.parts
 blob=api('git/blobs/'+item['sha']);assert blob['encoding']=='base64';data=base64.b64decode(blob['content'])
 assert len(data)==blob['size']==item['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==blob['sha']==item['sha']
 target=out/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);files[name]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlob':item['sha']}
manifest=json.loads((out/'export-manifest.json').read_text())
assert manifest['sourceRunId']==44602407034 and manifest['sourceRunAttempt']==1 and manifest['sourceCommit']==SOURCE and manifest['kind']=='plan' and manifest['batch']=='racing-01'
assert manifest['exportRunId']==RUN and manifest['exporterSourceCommit']==SHA and manifest['gamesRerun'] is False
assert set(manifest['files'])==set(files)-{'export-manifest.json'}
for name,record in manifest['files'].items():assert record=={key:files[name][key] for key in ['bytes','sha256']}
assert {name for name in files if name.startswith('artifact/')}=={'artifact/plan.json','artifact/catalog-registry.json','artifact/executed-workflow.yml'}
record={'readOnly':True,'sourceRunId':44602407034,'sourceRunAttempt':1,'sourceCommit':SOURCE,'exportRunId':RUN,'exporterSourceCommit':SHA,'exportBranch':branch,'exportCommit':commit,'files':files,'allGitBlobAndManifestHashesVerified':True}
(ROOT/'plan-restoration.json').write_text(json.dumps(record,indent=2)+'\n');(ROOT/'plan-export-tree.json').write_text(json.dumps(tree,indent=2)+'\n');(ROOT/'plan-export-run.json').write_text(json.dumps(run,indent=2)+'\n')
print(json.dumps({'commit':commit,'files':len(files),'verified':True}))
