import concurrent.futures,hashlib,json,urllib.parse,urllib.request
from pathlib import Path
root=Path('/workspace/pureTV');out=Path('/workspace/scratch/fork-children-20261110');cache=out/'apks';cache.mkdir(exist_ok=True)
revision='08ec332c0a25e9ae97fb73d3b3e40784dab65fc3'
names={'教育学习/儿歌多多TV_1.3.1.0无限制版.apk','教育学习/宝宝趣学_v3.0.1.apk'}
entries=[e for e in json.loads((root/'fork/upstream/tree.json').read_text())['tree'] if e['path'] in names]
assert len(entries)==2

def fetch(e):
 target=cache/(e['sha']+'.apk');temp=target.with_suffix('.part')
 url='https://raw.githubusercontent.com/youhunwl/TVAPP/'+revision+'/'+urllib.parse.quote(e['path'],safe='/')
 h=hashlib.sha256();g=hashlib.sha1(b'blob '+str(e['size']).encode()+b'\0');size=0
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'pureTV-fork-resource-import'}),timeout=45) as response,temp.open('wb') as f:
  assert response.status==200
  while chunk:=response.read(256*1024):
   size+=len(chunk);assert size<=e['size'];h.update(chunk);g.update(chunk);f.write(chunk)
 assert size==e['size'] and g.hexdigest()==e['sha']
 temp.rename(target)
 r={'path':e['path'],'url':url,'commit':revision,'bytes':size,'gitBlobSha':g.hexdigest(),'sha256':h.hexdigest()}
 print(json.dumps(r,ensure_ascii=False),flush=True);return r
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: records=list(pool.map(fetch,entries))
(out/'download.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
