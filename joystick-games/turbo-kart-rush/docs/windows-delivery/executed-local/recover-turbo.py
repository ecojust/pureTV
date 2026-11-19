from pathlib import Path
import base64,concurrent.futures,hashlib,json,os,subprocess
b=Path(__file__).resolve().parent;out=b/'original-turbo-export';out.mkdir(exist_ok=True);m=json.loads((b/'original-export-manifest.json').read_text());tree=json.loads((b/'original-export-tree.json').read_text());entries={e['path']:e for e in tree['tree'] if e['type']=='blob' and e['path'].startswith(('joystick-windows-evidence-turbo-kart-rush/','joystick-windows-packages-turbo-kart-rush/'))};records={};cache={}
def keep(n,data,method):
 e=entries[n];r={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()};assert r==m['files'][n] and len(data)==e['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==e['sha'];p=out/n;p.parent.mkdir(parents=True,exist_ok=True)
 if p.exists():assert p.read_bytes()==data
 elif e['sha'] in cache:os.link(cache[e['sha']],p)
 else:p.write_bytes(data);cache[e['sha']]=p
 records[n]=dict(r,gitBlobSha=e['sha'],method=method)
network=[]
for n,e in entries.items():
 p=b/'original-small-export'/n
 if p.exists():
  data=p.read_bytes();cache[e['sha']]=p;keep(n,data,'Reused already hash-verified immutable original bytes')
 elif '/executed-source/' in n:
  path=n.split('/executed-source/')[1];data=subprocess.check_output(['git','show',m['sourceCommit']+':'+path],cwd='/dev/shm/puretv-submit');keep(n,data,'Fixed Git source checked against original export Git blob and manifest')
 else:network.append(n)
def fetch(n):
 e=entries[n];v=json.loads(subprocess.check_output(['/usr/bin/gh','api','repos/ecojust/pureTV/git/blobs/'+e['sha']],timeout=90));assert v['encoding']=='base64';return n,base64.b64decode(v['content'])
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for n,data in pool.map(fetch,network):keep(n,data,'GET exact original immutable Git blob')
assert set(records)==set(entries);em=json.loads((out/'joystick-windows-evidence-turbo-kart-rush/evidence-manifest.json').read_text());prefix='joystick-windows-evidence-turbo-kart-rush/'
assert {n[len(prefix):] for n in records if n.startswith(prefix)}==set(em['files'])|{'evidence-manifest.json'}
for n,r in records.items():
 if n.startswith(prefix) and n!=prefix+'evidence-manifest.json':assert {k:r[k] for k in ['bytes','sha256']}==em['files'][n[len(prefix):]]
summary={'status':'passed','run':44621752383,'attempt':1,'source':m['sourceCommit'],'export':'f559a71e99ff27c8f262ed2a82a70674ee90f9dc','files':records,'filesVerified':len(records),'bytes':sum(r['bytes'] for r in records.values()),'originalEvidenceComplete':True};(b/'turbo-export-recovery.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps({k:v for k,v in summary.items() if k!='files'}))
