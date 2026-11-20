import base64,hashlib,json,subprocess,sys
from pathlib import Path
base=Path(__file__).resolve().parent;commit=sys.argv[1];out=base/('original-small-'+commit);assert not out.exists();out.mkdir()
def api(path):return subprocess.check_output(['/usr/bin/gh','api','repos/ecojust/pureTV/'+path],timeout=45)
tree=json.loads(api('git/trees/'+commit+'?recursive=1'));assert not tree['truncated'];(out/'original-git-tree.json').write_text(json.dumps(tree,indent=2)+'\n');blobs={x['path']:x for x in tree['tree'] if x['type']=='blob'}
def fetch(name):
 entry=blobs[name];assert entry['mode'] in ['100644','100755'] and entry['size']<2_000_000
 raw=api('git/blobs/'+entry['sha']);r=json.loads(raw);assert r['encoding']=='base64';b=base64.b64decode(r['content']);assert len(b)==entry['size']==r['size'];assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==entry['sha'];dest=out/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b);return b
manifest=json.loads(fetch('export-manifest.json'));assert str(manifest['runId'])=='44613335670' and str(manifest['runAttempt'])=='1' and manifest['sourceSha']=='315f8889ea677ed6a9211bf7d66c8c78dff57f01'
selected=[name for name,e in blobs.items() if name.startswith('reports/') and e['size']<2_000_000 and (name.endswith('/report.json') or name.endswith('/zxing-download.json') or name.endswith('/zxing-download.log') or name.endswith('/environment-summary.json') or name.endswith('/emulator-diagnostics.json') or name.endswith('/logcat.txt'))]
verified={}
for name in selected:
 b=fetch(name);record={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()};assert record==manifest['files'][name];verified[name]=record
summary={'run':44613335670,'attempt':1,'source':manifest['sourceSha'],'exportCommit':commit,'selectedFiles':verified,'completeExportDownloaded':False,'apksDownloaded':False,'build':manifest['buildResult'],'sign':manifest['signResult'],'runtime':manifest['runtimeResult']};(out/'selected-file-verification.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary),flush=True)
