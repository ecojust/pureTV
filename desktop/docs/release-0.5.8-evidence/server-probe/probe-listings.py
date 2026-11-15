from html.parser import HTMLParser
from pathlib import Path
import concurrent.futures,datetime,json,urllib.request,urllib.parse,hashlib
out=Path(__file__).parent;base='https://apps.b14f.com/'
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag=='a':self.links.extend(v for k,v in attrs if k=='href')
def links(text):
 parser=Links();parser.feed(text);return [x for x in parser.links if x!='../']
paths=[]
for category in ['game','launcher','media']:
 for child in links(json.loads((out/(category+'.json')).read_text())['text']):
  if child.endswith('/') and '/' not in child[:-1]:paths.append(category+'/'+child)
assert len(paths)<=60
headers={'User-Agent':'pureTV-Manager/0.5.7','Accept-Encoding':'identity'}
def read(path):
 saved=out/(path.replace('/','_')+'.json')
 if saved.exists():r=json.loads(saved.read_text())
 else:
  with urllib.request.urlopen(urllib.request.Request(base+path,headers=headers),timeout=15) as resp:
   b=resp.read(1024*1024+1);assert len(b)<=1024*1024
   r={'path':path,'status':resp.status,'headers':dict(resp.headers.items()),'bytes':len(b),'text':b.decode()}
   saved.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
 items=links(r['text']);return {'path':path,'entries':items,'apkCount':len([x for x in items if x.lower().endswith('.apk')]),'nestedDirectories':[x for x in items if x.endswith('/')],'hasManifest':'manifest.json' in items,'hasLogo':'logo.svg' in items,'hasThumb':'thumb.png' in items}
results=list(concurrent.futures.ThreadPoolExecutor(max_workers=4).map(read,paths))
result={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'bounded public HTML directory reads, no APK download in listing scan','directories':results,'directoryCount':len(results),'apkCount':sum(x['apkCount'] for x in results),'categories':{c:{'directories':len([x for x in results if x['path'].startswith(c+'/')]),'apks':sum(x['apkCount'] for x in results if x['path'].startswith(c+'/'))} for c in ['game','launcher','media']},'allDirsOneLevel':all(not x['nestedDirectories'] for x in results)}
(out/'listings-summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False))
