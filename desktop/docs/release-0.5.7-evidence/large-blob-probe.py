#!/usr/bin/env python3
"""Verify the public immutable Gitee Git blob without retaining a second APK copy."""
import base64,datetime,hashlib,json,os,re,tempfile,time,urllib.error,urllib.request
from pathlib import Path
out=Path('/workspace/scratch/market-download-20261115');sha='46e903bdb7cfed81906e0f57265634487045884d';size=53570243
url='https://gitee.com/api/v5/repos/juzisang331/pure-tv-store/git/blobs/'+sha
maximum=((size+2)//3)*4+8192
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'url':url,'userAgent':'pureTV-Manager/0.5.6','expectedBytes':size,'expectedGitBlobSha':sha,'maximumJsonBytes':maximum,'temporaryStorage':'/dev/shm only; removed after verification','credentialsUsed':False}
path=None;start=time.monotonic()
try:
 try:r=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':report['userAgent'],'Accept-Encoding':'identity'}),timeout=30)
 except urllib.error.HTTPError as e:r=e
 with r:
  report['httpStatus']=r.status;report['headers']={k:v for k,v in r.headers.items() if k.lower() in ['content-type','content-length','content-encoding','x-ratelimit-limit','x-ratelimit-remaining','date','server']}
  prefix=r.read(4096)
  if r.status!=200:
   report['bodyPrefix']=prefix[:300].decode('utf-8','replace');raise RuntimeError('Blob endpoint did not return 200')
  if r.headers.get('Content-Length'):assert int(r.headers['Content-Length'])<=maximum
  text=prefix.decode('ascii')
  assert re.search(r'"sha"\s*:\s*"'+sha+'"',text)
  assert re.search(r'"size"\s*:\s*'+str(size)+r'\s*[,}]',text)
  match=re.search(r'"content"\s*:\s*"([A-Za-z0-9+/=]{24})',text);assert match
  assert base64.b64decode(match.group(1)).startswith(b'PK\x03\x04')
  report['prefixVerified']={'sha':True,'size':True,'base64StartsWithZipMagic':True}
  print(json.dumps({'status':'prefix_verified','httpStatus':200,'size':size,'gitBlobSha':sha},ensure_ascii=False),flush=True)
  with tempfile.NamedTemporaryFile(prefix='puretv-gitee-blob-',suffix='.json',dir='/dev/shm',delete=False) as f:
   path=Path(f.name);count=len(prefix);f.write(prefix)
   while chunk:=r.read(256*1024):
    count+=len(chunk);assert count<=maximum;assert time.monotonic()-start<15*60;f.write(chunk)
  report['jsonBytes']=count
 with path.open() as f:blob=json.load(f)
 assert blob['sha']==sha and blob['size']==size and blob['encoding']=='base64'
 assert len(blob['content'])==((size+2)//3)*4
 data=base64.b64decode(blob['content'],validate=True);assert len(data)==size
 git=hashlib.sha1(b'blob '+str(size).encode()+b'\0'+data).hexdigest();assert git==sha
 report.update({'status':'passed','encoding':blob['encoding'],'decodedBytes':len(data),'gitBlobSha':git,'sha256':hashlib.sha256(data).hexdigest(),'apkZipMagic':data[:4]==b'PK\x03\x04','completeBodyVerified':True})
except Exception as e:
 report['status']='failed';report['error']=type(e).__name__+': '+str(e)
finally:
 if path is not None:path.unlink(missing_ok=True)
 report['temporaryFileRemoved']=path is None or not path.exists();report['seconds']=round(time.monotonic()-start,3)
 (out/'large-blob-probe.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2),flush=True)
