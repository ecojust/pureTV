import base64,hashlib,json,subprocess,sys
from pathlib import Path
base=Path(__file__).resolve().parent;commit=sys.argv[1];out=base/('original-small-'+commit);assert not out.exists();out.mkdir()
def api(path):return subprocess.check_output(['/usr/bin/gh','api','repos/ecojust/pureTV/'+path],timeout=45)
raw=api('git/trees/'+commit+'?recursive=1');tree=json.loads(raw);assert not tree['truncated'];(out/'original-git-tree.json').write_bytes(raw);blobs={x['path']:x for x in tree['tree'] if x['type']=='blob'}
def fetch(name):
 entry=blobs[name];assert entry['mode'] in ['100644','100755'] and entry['size']<12_000_000
 raw=api('git/blobs/'+entry['sha']);r=json.loads(raw);assert r['encoding']=='base64';b=base64.b64decode(r['content']);assert len(b)==entry['size']==r['size'];assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==entry['sha'];dest=out/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b);return b
m=json.loads(fetch('export-manifest.json'));assert str(m['qaRunId'])=='44618869289' and str(m['qaRunAttempt'])=='1' and m['qaSourceSha']=='f3e1e9f6634e35d1c9ae0cfbf1f8a51d42de7965';assert m['artifactSourceSha']=='315f8889ea677ed6a9211bf7d66c8c78dff57f01' and str(m['artifactRunId'])=='44613335670' and str(m['artifactId'])=='14571679832' and str(m['artifactRunAttempt'])=='1';assert m['games']==['night-racer']
selected=[n for n,e in blobs.items() if n.startswith('evidence/') and e['size']<12_000_000 and (n.endswith('/report.json') or n.endswith('/night-racer-outcomes.json') or n.endswith('/input-verification.json') or n.endswith('/original-actions-artifact-origin.json') or n.endswith('/package-file-references.json') or n.endswith('/environment-summary.json'))]
verified={}
for n in selected:
 b=fetch(n);record={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()};assert record==m['files'][n];verified[n]=record
summary={'qaRun':44618869289,'qaAttempt':1,'qaSource':m['qaSourceSha'],'exportCommit':commit,'artifactRun':44613335670,'artifactAttempt':1,'artifactSource':m['artifactSourceSha'],'artifactId':14571679832,'selectedFiles':verified,'completeExportDownloaded':False,'apksDownloaded':False,'runtime':m['runtimeResult'],'runtimeAccepted':m['runtimeAccepted']};(out/'selected-file-verification.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary),flush=True)
