import json,hashlib,urllib.request,pathlib,concurrent.futures
root=pathlib.Path('/dev/shm/mac-adventure-recovery')
tree=json.loads((root/'tree.json').read_text()); sha='fe98224d07a3052324cc9503674cc5aafa0ac340'
rows=[x for x in tree['tree'] if x['type']=='blob']
def fetch(x):
 p=root/'export'/x['path'];p.parent.mkdir(parents=True,exist_ok=True)
 data=urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+sha+'/'+x['path'], timeout=60).read()
 assert len(data)==x['size'],x['path']
 assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==x['sha'],x['path']
 p.write_bytes(data)
 return {'path':x['path'],'size':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlob':x['sha']}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex: results=list(ex.map(fetch,rows))
(root/'download-verification.json').write_text(json.dumps({'commit':sha,'files':results,'fileCount':len(results),'bytes':sum(x['size'] for x in results)},indent=2)+'\n')
print('downloaded',len(results),sum(x['size'] for x in results))
