#!/usr/bin/env python3
"""Recheck all original evidence bytes against immutable export trees."""
import hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent;BASE=ROOT/'docs/racing-nine/native-readiness/ci-44602407034-attempt-1'
def api(path):return json.loads(subprocess.check_output(['gh','api','repos/ecojust/pureTV/'+path],timeout=60))
records={}
for kind in ['arm','intel']:
 original=json.loads((BASE/f'readonly-{kind}-export-verification.json').read_text());folder=BASE/f'original-{kind}-export';manifest=json.loads((folder/'export-manifest.json').read_text());tree=api('git/trees/'+original['exportCommit']+'?recursive=1')
 assert not tree['truncated'];rows={item['path']:item for item in tree['tree'] if item['type']=='blob'}
 assert set(rows)=={p.relative_to(folder).as_posix() for p in folder.rglob('*') if p.is_file()}
 assert set(manifest['files'])==set(rows)-{'export-manifest.json'}
 for name,item in rows.items():
  p=folder/name;assert p.is_file() and not p.is_symlink();data=p.read_bytes()
  assert item['mode'] in ['100644','100755'] and len(data)==item['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==item['sha']
  if name!='export-manifest.json':assert {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}==manifest['files'][name]
 assert manifest['sourceRunId']==44602407034 and manifest['sourceRunAttempt']==1 and manifest['sourceCommit']=='ea7854ca06ed53967aed00fe160034185f2906b3'
 job=json.loads((folder/'original-job.json').read_text());assert job['run_id']==44602407034 and job['run_attempt']==1 and job['head_sha']==manifest['sourceCommit']
 records[kind]={'exportCommit':original['exportCommit'],'files':len(rows),'allGitBlobAndManifestHashesVerified':True,'originalJobId':job['id'],'originalJobName':job['name'],'originalJobConclusion':job['conclusion'],'batchOriginalStatus':json.loads((folder/'artifact/batch-report.json').read_text())['status']}
(ROOT/'joystick-games/ponpoko-kart/docs/macos-ci-44602407034/original-evidence-recheck.json').write_text(json.dumps(records,indent=2)+'\n');print(json.dumps(records))
