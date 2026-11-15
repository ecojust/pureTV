import base64,datetime,hashlib,json,time,urllib.request,urllib.error,urllib.parse
from pathlib import Path
out=Path('/workspace/scratch/market-download-20261115');base='https://gitee.com/api/v5/repos/juzisang331/pure-tv-store';repo='https://gitee.com/juzisang331/pure-tv-store';ua='pureTV-Manager/0.5.6';events=[]
headers={'User-Agent':ua,'Accept-Encoding':'identity'}
def safe(u):
 p=urllib.parse.urlsplit(u);return urllib.parse.urlunsplit((p.scheme,p.netloc,p.path,'',''))
class Redirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,h,newurl):
  events.append({'redirectFrom':safe(req.full_url),'status':code,'redirectTo':safe(newurl)})
  return super().redirect_request(req,fp,code,msg,h,newurl)
opener=urllib.request.build_opener(Redirect)
def open_request(name,url):
 start=time.monotonic()
 try:r=opener.open(urllib.request.Request(url,headers=headers),timeout=15)
 except urllib.error.HTTPError as e:r=e
 info={'name':name,'url':url,'status':r.status,'finalUrl':safe(r.geturl()),'headers':{k:v for k,v in r.headers.items() if k.lower() in ['content-type','content-length','content-encoding','x-ratelimit-limit','x-ratelimit-remaining','retry-after','server','date','location']},'responseSeconds':round(time.monotonic()-start,3)}
 events.append(info);print(json.dumps(info,ensure_ascii=False),flush=True);return r,info
def get_json(name,url):
 r,info=open_request(name,url)
 with r:b=r.read(16*1024*1024+1)
 info['bytes']=len(b);info['bodySha256']=hashlib.sha256(b).hexdigest();assert len(b)<=16*1024*1024
 if info['status']!=200:info['bodyPrefix']=b[:300].decode('utf-8','replace');return None
 data=json.loads(b);(out/(name+'.json')).write_bytes(b);return data
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'userAgent':ua,'scope':'Public unauthenticated HTTP read-only probes from assistant environment, not installed manager or user network','events':events}
try:
 metadata=get_json('repository',base)
 if metadata is None:raise RuntimeError('Repository request failed')
 branch=get_json('branch',base+'/branches/'+urllib.parse.quote(metadata['default_branch'],safe=''))
 if branch is None:raise RuntimeError('Branch request failed')
 rev=branch['commit']['sha'];report['revision']=rev
 tree=get_json('tree',base+'/git/trees/'+rev+'?recursive=1')
 if tree is None:raise RuntimeError('Tree request failed')
 assert not tree.get('truncated',False)
 apks=sorted([e for e in tree['tree'] if e.get('type')=='blob' and e['path'].startswith(('apps/','launcher/')) and e['path'].lower().endswith('.apk')],key=lambda e:e.get('size',0))
 report['apkCount']=len(apks);assert apks
 item=apks[0];report['smallestApk']=item
 raw=repo+'/raw/'+rev+'/'+urllib.parse.quote(item['path'],safe='/')
 r,info=open_request('small-apk-raw',raw)
 with r:
  if r.status==200:
   h=hashlib.sha1(b'blob '+str(item['size']).encode()+b'\0');s=hashlib.sha256();count=0
   while b:=r.read(65536):
    count+=len(b);assert count<=item['size'];h.update(b);s.update(b)
   info.update({'bytesRead':count,'gitBlobSha':h.hexdigest(),'sha256':s.hexdigest(),'complete':True,'matchesTree':count==item['size'] and h.hexdigest()==item['sha']})
  else:info['bodyPrefix']=r.read(300).decode('utf-8','replace')
 if info['status']==403:
  blob=get_json('small-apk-blob',base+'/git/blobs/'+item['sha'])
  if blob is not None:
   decoded=base64.b64decode(blob['content']);git=hashlib.sha1(b'blob '+str(len(decoded)).encode()+b'\0'+decoded).hexdigest()
   report['smallBlobVerification']={'bytes':len(decoded),'gitBlobSha':git,'sha256':hashlib.sha256(decoded).hexdigest(),'matchesTree':len(decoded)==item['size'] and git==item['sha'],'blobShaMatches':blob['sha']==item['sha'],'encoding':blob.get('encoding')}
 large=[e for e in apks if e['size']>32*1024*1024];report['over32MiBCount']=len(large)
 if large:
  item=large[0];report['largeApkTreeMetadata']=item
  r,info=open_request('large-apk-raw-status-only',repo+'/raw/'+rev+'/'+urllib.parse.quote(item['path'],safe='/'))
  with r:
   if r.status!=200:info['bodyPrefix']=r.read(300).decode('utf-8','replace')
   else:info['bytesRead']=0;info['note']='Response closed without reading APK body'
 report['status']='finished'
except Exception as e:
 report['status']='error';report['error']=type(e).__name__+': '+str(e)
finally:
 (out/'live-probe.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='events'},ensure_ascii=False,indent=2),flush=True)
