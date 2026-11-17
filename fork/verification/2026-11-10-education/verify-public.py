#!/usr/bin/env python3
"""Stream both archived APKs from a fixed public pureTV commit; keep no second copy."""
import argparse,concurrent.futures,datetime,hashlib,json,urllib.parse,urllib.request
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--commit',required=True);args=parser.parse_args()
assert len(args.commit)==40 and all(c in '0123456789abcdef' for c in args.commit)
root=Path(__file__).resolve().parents[3]
folders=['fork/education/ergeduoduo','fork/education/baby-fun-learning']
def verify(folder):
 manifest=json.loads((root/folder/'manifest.json').read_text());p=manifest['packages'][0]
 path=folder+'/'+p['file'];url='https://raw.githubusercontent.com/ecojust/pureTV/'+args.commit+'/'+urllib.parse.quote(path,safe='/')
 size=0;h=hashlib.sha256();g=hashlib.sha1(b'blob '+str(p['bytes']).encode()+b'\0')
 with urllib.request.urlopen(url,timeout=45) as response:
  assert response.status==200
  while chunk:=response.read(256*1024):
   size+=len(chunk);assert size<=p['bytes'];h.update(chunk);g.update(chunk)
 assert size==p['bytes'] and h.hexdigest()==p['sha256'] and g.hexdigest()==p['gitBlobSha']
 return {'path':path,'url':url,'bytes':size,'sha256':h.hexdigest(),'gitBlobSha':g.hexdigest(),'status':'verified'}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(verify,folders))
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceCommit':args.commit,'method':'Complete streamed HTTPS download from fixed GitHub commit; compare byte count, SHA256 and Git blob SHA1 to manifest','status':'passed','apkCount':len(results),'packages':results,'physicalTvTested':False}
Path(__file__).with_name('publication.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
