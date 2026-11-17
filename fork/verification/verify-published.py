import concurrent.futures,datetime,hashlib,json,subprocess,sys,urllib.parse,urllib.request
from pathlib import Path
root=Path('/workspace/pureTV');commit=sys.argv[1]
def api(path):return json.loads(subprocess.check_output(['gh','api','repos/ecojust/pureTV/'+path],cwd=root))
assert len(commit)==40
head=api('git/commits/'+commit);tree=api('git/trees/'+head['tree']['sha']);folder=next(e for e in tree['tree'] if e['path']=='fork' and e['type']=='tree');remote=api('git/trees/'+folder['sha']+'?recursive=1');assert not remote.get('truncated',False)
expected={}
for row in subprocess.check_output(['git','ls-tree','-r','-z',commit,'fork'],cwd=root).split(b'\0'):
 if row:
  info,path=row.split(b'\t',1);mode,kind,sha=info.decode().split();expected[path.decode()[5:]]=sha
actual={e['path']:e['sha'] for e in remote['tree'] if e['type']=='blob'}
assert actual==expected
catalog=json.loads((root/'fork/catalog.json').read_text());downloads=[]
for app in catalog['apps']:
 manifest=json.loads((root/'fork'/app['manifest']).read_text())
 for p in manifest['packages']:downloads.append({'path':'fork/'+app['path']+'/'+p['file'],'bytes':p['bytes'],'sha256':p['sha256'],'gitBlobSha':p['gitBlobSha']})
def verify(p):
 url='https://raw.githubusercontent.com/ecojust/pureTV/'+commit+'/'+urllib.parse.quote(p['path'],safe='/');digest=hashlib.sha256();size=0
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'pureTV-public-fork-verification'}),timeout=45) as response:
  assert response.status==200
  while True:
   chunk=response.read(1024*1024)
   if not chunk:break
   size+=len(chunk);digest.update(chunk)
 assert size==p['bytes'] and digest.hexdigest()==p['sha256']
 print('Verified '+p['path'],flush=True)
 return {**p,'publicUrl':url,'fullDownloadVerified':True}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:results=list(executor.map(verify,downloads))
report={'status':'passed','sourceCommit':commit,'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'repository':'ecojust/pureTV','publishedTreeMatchesLocal':True,'publishedFileCount':len(expected),'apkCount':len(results),'apkBytes':sum(p['bytes'] for p in results),'allApksDownloadedInFull':True,'apkExecuted':False,'physicalTvTested':False,'packages':results}
(root/'fork/verification/publication.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('All published files and '+str(len(results))+' public APKs verified.',flush=True)
