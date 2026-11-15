import concurrent.futures,datetime,hashlib,json,time,urllib.request,urllib.error
from pathlib import Path
out=Path(__file__).parent
base='https://apps.b14f.com/'
common={'User-Agent':'pureTV-Manager/0.5.7','Accept-Encoding':'identity'}
files=[('game/jewel/jewel-0.5.2.apk',83318,'b8ee65e5b14b05f18e580e66f1d4a85681c1a7cb2e08fc9aa945ec3e2987672f'),('media/maidongktv/Maidong-KTV-2.1.10.apk',53570243,'0b34c7020234c076cfe6e301a6c91ad0ed3602260ad955530bd68f8b7702dc1c'),('client/pureTV-Manager-0.5.6-windows-x64-setup.exe',2273072,'f18a09dbb0e6ea72b1cb871ec9f59a025c80eb9635cecb8bc138b661eed8ca3d')]
def download(item):
 path,size,known_sha=item
 metadata=json.loads((out/(path.replace('/','_')+'-HEAD.json')).read_text());etag=metadata['headers']['etag'];started=time.monotonic()
 with urllib.request.urlopen(urllib.request.Request(base+path,headers={**common,'If-Match':etag}),timeout=30) as response:
  assert response.status==200;headers=dict(response.headers.items());assert headers['etag']==etag and int(headers['content-length'])==size
  h=hashlib.sha256();git=hashlib.sha1(b'blob '+str(size).encode()+b'\0');actual=0;first=None
  while b:=response.read(1024*1024):
   if first is None:first=b[:4].hex()
   actual+=len(b);assert actual<=size;h.update(b);git.update(b)
  assert actual==size and h.hexdigest()==known_sha
 return {'path':path,'status':response.status,'headers':headers,'ifMatch':etag,'bytes':actual,'sha256':h.hexdigest(),'matchesPreviouslyVerifiedArtifact':True,'referenceSource':'Prior public Gitee Git blob and GitHub release downloads, not digest metadata from the new server','gitBlobSha':git.hexdigest(),'firstFourBytes':first,'completeBodyVerified':True,'seconds':round(time.monotonic()-started,3),'apkStoredOnDisk':False}
def request_headers(extra):
 try:
  with urllib.request.urlopen(urllib.request.Request(base+files[0][0],headers={**common,**extra}),timeout=15) as response:
   body=response.read(65536)
   return {'requestHeaders':extra,'status':response.status,'headers':dict(response.headers.items()),'bodyBytesRead':len(body)}
 except urllib.error.HTTPError as error:
  return {'requestHeaders':extra,'status':error.code,'headers':dict(error.headers.items())}
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'credentialsUsed':False,'scope':'Read-only public HTTP verification from assistant environment; not installed manager, not user network','downloads':[],'conditionals':[]}
for r in concurrent.futures.ThreadPoolExecutor(max_workers=3).map(download,files):report['downloads'].append(r);print(json.dumps(r),flush=True)
etag=report['downloads'][0]['ifMatch']
for extra in [{'If-Match':'"non-matching-probe"','Range':'bytes=0-15'},{'If-Match':etag,'Range':'bytes=0-15'},{'If-Unmodified-Since':'Thu, 01 Jan 1970 00:00:00 GMT','Range':'bytes=0-15'}]:
 r=request_headers(extra);report['conditionals'].append(r);print(json.dumps(r),flush=True)
(out/'verified-downloads.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
