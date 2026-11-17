from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit,unquote
import json,subprocess,hashlib,sys
CACHE=Path('/dev/shm/claude-game-research/expansion-audit/trees');CACHE.mkdir(exist_ok=True)
rows=[]
for file in sys.argv[1:]:
 d=json.loads(Path(file).read_text());rows.extend(d.get('games',d.get('candidates',[])))
def get(pair):
 repo,sha=pair;file=CACHE/(repo.replace('/','__')+'-'+sha+'.json')
 if not file.exists():
  b=subprocess.check_output(['gh','api',f'repos/{repo}/git/trees/{sha}?recursive=1'],stderr=subprocess.PIPE);file.write_bytes(b)
 d=json.loads(file.read_text());assert not d.get('truncated'),repo
 return pair,{x['path']:x for x in d['tree']}
with ThreadPoolExecutor(max_workers=4) as pool:trees=dict(pool.map(get,{(g['repository'].lower(),g['commit']) for g in rows}))
def parts(url):return unquote(urlsplit(url).path).strip('/').split('/')
results=[]
for g in rows:
 p=parts(g['sourceUrl']);repo='/'.join(p[:2]).lower();sha=p[3];tree=trees[(g['repository'].lower(),g['commit'])];path='/'.join(p[4:]);assert repo==g['repository'].lower() and sha==g['commit'];assert not path or path in tree,(g['title'],path)
 licensepath=None
 if g['license'].get('url'):
  lp=parts(g['license']['url']);licensepath='/'.join(lp[4:]);assert '/'.join(lp[:2]).lower()==repo and lp[3]==sha and licensepath in tree,(g['title'],'license',licensepath)
 paths=[]
 if isinstance(g.get('sourceReview'),list):
  for x in g['sourceReview']:
   sp=x.get('path')
   if not sp and x.get('url'):sp='/'.join(parts(x['url'])[4:])
   if sp:
    assert sp in tree and tree[sp]['type']=='blob',(g['title'],sp)
    if x.get('bytes'):assert tree[sp]['size']==x['bytes'],(g['title'],sp,'size',tree[sp]['size'],x['bytes'])
    paths.append(sp)
 if g.get('sourcePath'):
  sp=g['sourcePath'];assert sp in tree and tree[sp]['type']=='blob'
  if g.get('sourceBytes'):assert tree[sp]['size']==g['sourceBytes'],g['title']
  paths.append(sp)
 results.append({'title':g['title'],'repository':repo,'commit':sha,'entryPath':path,'licensePath':licensepath,'coreSourcePathsAndSizesChecked':paths,'status':'passed'})
report={'entries':len(rows),'trees':len(trees),'method':'Independent fixed Git tree lookup; source, cited license and reviewed source paths must exist; reported source byte lengths must match original Git blob lengths. This checks paths and sizes, not runtime quality.','results':results}
p=CACHE.parent/('paths-'+str(len(rows))+'.json');n=1
while p.exists():n+=1;p=CACHE.parent/('paths-'+str(len(rows))+'-attempt-'+str(n)+'.json')
p.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'entries':len(rows),'trees':len(trees),'report':str(p),'status':'passed'}))
