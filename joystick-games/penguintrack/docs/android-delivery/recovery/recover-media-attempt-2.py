from pathlib import Path
from urllib.request import urlopen,Request
from urllib.parse import quote
import json,hashlib,time
S=Path(__file__).parent;D=S/'original-export';T=json.loads((S/'original-tree.json').read_text());entries={x['path']:x for x in T['tree'] if x['type']=='blob'};M=json.loads((D/'export-manifest.json').read_text());C=json.loads((S/'selected-blob-verification.json').read_text())['exportCommit'];assert C=='111c827624d21b4149079a4d9b453d29d7d4a7b6'
names=[]
for p in sorted(D.rglob('report.json')):
 d=json.loads(p.read_text());parent=p.parent.relative_to(D).as_posix()
 for row in d['captures']+[d['video']]:
  name=parent+'/'+row['path'];assert M['files'][name]=={k:row[k] for k in ['bytes','sha256']};names.append(name)
 names.extend(parent+'/'+n for n in ['wire.jsonl','instrumentation.log','screenrecord.log'] if parent+'/'+n in entries)
 names.extend(n for n in entries if n.startswith(parent+'/source/'))
result={'run':44634808045,'qaSource':'3cf2452db9853a3a189c47342a291f046e411b5a','exportCommit':C,'files':[],'apkDownloaded':False,'errors':[]};total=0
for name in names:
 item=entries[name];expected=M['files'][name];assert item['mode'] in ['100644','100755'] and 0<=item['size']<=16*1024*1024;total+=item['size'];assert total<50*1024*1024
 dest=D/name;dest.parent.mkdir(parents=True,exist_ok=True)
 if not dest.exists():
  for attempt in range(3):
   try:
    with urlopen(Request('https://raw.githubusercontent.com/ecojust/pureTV/'+C+'/'+quote(name),headers={'User-Agent':'pureTV-exact-evidence-review'}),timeout=40) as response:
     data=response.read(item['size']+1)
    assert len(data)==item['size'];break
   except Exception as e:
    result['errors'].append({'path':name,'attempt':attempt+1,'errorType':type(e).__name__})
    if attempt==2:raise
    time.sleep(2)
  assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==item['sha']
  assert {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}==expected;dest.write_bytes(data)
 data=dest.read_bytes();assert {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}==expected
 result['files'].append({'path':name,'gitBlob':item['sha'],**expected})
 (S/'media-source-recovery-attempt-2.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'files':len(result['files']),'bytes':total,'errors':len(result['errors'])}))
