import json,subprocess,base64,hashlib,concurrent.futures
from pathlib import Path
root=Path('/dev/shm/racing-review-rally/backroad-44599353036');commit='329bc5a59a2a35d7acb250318519fc6b64cd0878'
def api(path):return json.loads(subprocess.check_output(['gh','api','repos/ecojust/pureTV/'+path]))
tree=api('git/trees/'+commit+'?recursive=1');assert not tree['truncated'];(root/'export-tree.json').write_text(json.dumps(tree,indent=2)+'\n')
entries=[x for x in tree['tree'] if x['type']=='blob'];assert len(entries)<200
out=root/'original-export';out.mkdir(exist_ok=True)
def fetch(x):
    p=Path(x['path']);assert not p.is_absolute() and '..' not in p.parts and x['mode']=='100644'
    obj=api('git/blobs/'+x['sha']);assert obj['encoding']=='base64';b=base64.b64decode(obj['content'])
    assert len(b)==x['size'] and hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==x['sha']
    dest=out/p;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
    return x['path'],{'gitBlob':x['sha'],'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: rows=dict(pool.map(fetch,entries))
m=json.loads((out/'export-manifest.json').read_text());assert m['sourceRunId']==44599353036 and m['sourceCommit']=='d548bccbe816bd4c03620388556ceef507b67d30' and m['sourceRunAttempt']==1 and m['game']=='backroad-rally' and not m['gamesRerun']
for name,info in m['files'].items():assert {k:rows[name][k] for k in ['bytes','sha256']}==info
assert set(rows)==set(m['files'])|{'export-manifest.json'}
(root/'recovery-verification.json').write_text(json.dumps({'exportCommit':commit,'exportRunId':44605181709,'sourceRunId':44599353036,'sourceCommit':m['sourceCommit'],'fileCount':len(rows),'allGitBlobAndManifestChecksPassed':True,'files':rows},indent=2)+'\n')
print(json.dumps({'fileCount':len(rows),'bytes':sum(x['bytes'] for x in rows.values()),'checksPassed':True}))
