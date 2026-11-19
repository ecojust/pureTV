import base64,concurrent.futures,hashlib,json,subprocess
from pathlib import Path
b=Path(__file__).resolve().parent;t=json.loads((b/'original-export-tree.json').read_text());entries={x['path']:x for x in t['tree'] if x['type']=='blob'};m=json.loads((b/'original-export-manifest.json').read_text());assert m['sourceCommit']=='039d210cfa4cc65f59adf0859a777f3591853a70' and m['runId']==44621752383 and m['runAttempt']==1
out=b/'original-small-export';out.mkdir(exist_ok=True)
wanted=[n for n in entries if n.endswith(('report.json','evidence-manifest.json','state.json','runtime-bootstrap.log','runtime-normal.log','runtime-occupied.log','package-verification.json')) or n in ['retention-provenance/run.json','retention-provenance/jobs.json','retention-provenance/artifacts.json']]
records={}
def fetch(n):
 e=entries[n];assert e['size']<8_000_000 and e['mode']=='100644';v=json.loads(subprocess.check_output(['/usr/bin/gh','api','repos/ecojust/pureTV/git/blobs/'+e['sha']],timeout=90));data=base64.b64decode(v['content']);assert len(data)==e['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==e['sha'];record={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()};assert record==m['files'][n],n;p=out/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);return n,dict(record,gitBlobSha=e['sha'])
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for n,rec in pool.map(fetch,wanted):records[n]=rec;print(json.dumps({'recovered':n,'bytes':rec['bytes']}),flush=True)
for game in ['backroad-rally','ponpoko-kart','kart-royale','turbo-kart-rush']:
 prefix='joystick-windows-evidence-'+game+'/';em=json.loads((out/prefix/'evidence-manifest.json').read_text());assert em['sourceCommit']==m['sourceCommit'] and em['runId']=='44621752383' and em['runAttempt']=='1'
 for n,rec in records.items():
  if n.startswith(prefix) and not n.endswith('/evidence-manifest.json'):assert {k:rec[k] for k in ['bytes','sha256']}==em['files'][n[len(prefix):]],n
summary={'status':'passed','originalExport':'f559a71e99ff27c8f262ed2a82a70674ee90f9dc','source':m['sourceCommit'],'runId':44621752383,'attempt':1,'method':'Original immutable Git blob bytes checked against export and per-game evidence manifests; report bytes not rewritten','files':records,'fullExportRestored':False};(b/'original-small-export-verification.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps({'status':'passed','files':len(records)}))
