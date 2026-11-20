from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request,urlopen
from urllib.parse import urlsplit,unquote
import json,subprocess,hashlib,re,unicodedata,sys
CACHE=Path('/dev/shm/claude-game-research/expansion-audit'); CACHE.mkdir(exist_ok=True)
rows=[]
for name in sys.argv[1:]:
 data=json.loads(Path(name).read_text()); rows.extend(data.get('games',data.get('candidates',data.get('entries',[]))) if isinstance(data,dict) else data)
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFC',s)).strip()
def fetch(url,api=False):
 key=hashlib.sha256(url.encode()).hexdigest();p=CACHE/(key+('.json' if api else '.txt'))
 if p.exists(): return p.read_bytes()
 if api:b=subprocess.check_output(['gh','api',url],stderr=subprocess.PIPE)
 else:
  with urlopen(Request(url,headers={'User-Agent':'pureTV-source-citation-audit'}),timeout=35) as response:
   assert response.status==200;b=response.read(6_000_000)
 p.write_bytes(b);return b
def affected(ev):
 value=ev.get('sourcePathAffected')
 if value is None:return []
 if isinstance(value,str):return [value]
 assert isinstance(value,list) and all(isinstance(x,str) and x for x in value)
 return value
byurl={}
for row in rows:byurl.setdefault(row['claudeEvidence']['url'].split('#')[0],[]).append(row)
def check_evidence(pair):
 url,games=pair
 try:
  parts=unquote(urlsplit(url).path).strip('/').split('/');repo='/'.join(parts[:2]);sha=parts[3];kind=parts[2]
  if kind=='commit':
   data=json.loads(fetch(f'repos/{repo}/commits/{sha}?per_page=100',True));value=data['commit']['message'];files=[x['filename'] for x in data.get('files',[])]
   wanted={p for g in games for p in affected(g['claudeEvidence'])}
   page=2
   while wanted-set(files) and len(data.get('files',[]))==100 and page<31:
    data=json.loads(fetch(f'repos/{repo}/commits/{sha}?per_page=100&page={page}',True));files.extend(x['filename'] for x in data.get('files',[]));page+=1
  elif kind=='blob':
   value=fetch('https://raw.githubusercontent.com/'+repo+'/'+sha+'/'+'/'.join(parts[4:])).decode('utf-8');files=None
  else:raise ValueError('unsupported citation URL')
  checks=[]
  for g in games:
   ev=g['claudeEvidence'];quotes=[ev['quote']]+([ev['additionalQuote']] if ev.get('additionalQuote') else [])
   matched=all(norm(q) in norm(value) for q in quotes)
   touched=all(p in files for p in affected(ev)) if files is not None and affected(ev) else None
   checks.append({'title':g['title'],'quoteMatched':matched,'citedGameSourceAffected':touched,'sourcePathAffected':ev.get('sourcePathAffected')})
  return {'url':url,'status':'passed' if all(x['quoteMatched'] and x['citedGameSourceAffected'] is not False for x in checks) else 'mismatch','games':checks,'changedFiles':files,'fetchedTextSha256':hashlib.sha256(value.encode()).hexdigest()}
 except Exception as e:return {'url':url,'status':'failed','error':str(e),'games':[g['title'] for g in games]}
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(check_evidence,byurl.items()))
report={'checkedAt':'2026-11-17','entries':len(rows),'uniqueEvidenceURLs':len(results),'method':'Fresh independent original README/commit retrieval; literal quote comparison after Unicode/whitespace normalization. For records naming an affected game file, compare full paginated commit file lists. No game execution.','results':results}
path=CACHE/('report-'+str(len(rows))+'.json')
attempt=1
while path.exists():
 attempt+=1;path=CACHE/('report-'+str(len(rows))+'-attempt-'+str(attempt)+'.json')
path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'report':str(path),'entries':len(rows),'nonpassing':[r for r in results if r['status']!='passed']},ensure_ascii=False))
