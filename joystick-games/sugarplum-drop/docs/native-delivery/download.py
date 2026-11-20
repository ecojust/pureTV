import concurrent.futures,hashlib,json,pathlib,urllib.request,time
root=pathlib.Path('/dev/shm/sugar-delivery-audit')
refs={'android':'1e2ebdd67c80d39bdf187c6981957f4389853935','mac':'dfa8f10d25d3ce02bd8c2a08eefe80a9efb2eaca'}
records=[]
for platform,sha in refs.items():
 tree=json.load(open('/dev/shm/sugar-'+platform+'-tree.json'))
 assert not tree.get('truncated')
 selected=[x for x in tree['tree'] if x['type']=='blob' and ('sugarplum-drop' in x['path'] or x['path'] in ('export-manifest.json','runtime-verification.json') or (platform=='mac' and x['path'].startswith('provenance/') and '/executed-source/' not in x['path']))]
 def get(e):
  path=e['path'];out=root/platform/path;out.parent.mkdir(parents=True,exist_ok=True)
  url=f'https://raw.githubusercontent.com/ecojust/pureTV/{sha}/{path}'
  for attempt in range(3):
   try:
    with urllib.request.urlopen(url,timeout=60) as r:b=r.read()
    assert len(b)==e['size'],path
    git=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest();assert git==e['sha'],path
    out.write_bytes(b)
    return {'platform':platform,'path':path,'url':url,'bytes':len(b),'gitBlob':git,'sha256':hashlib.sha256(b).hexdigest()}
   except Exception:
    if attempt==2:raise
    time.sleep(1)
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex: records.extend(ex.map(get,selected))
 print(platform,len(selected),flush=True)
(root/'download-verification.json').write_text(json.dumps({'sourceCommits':refs,'files':records},indent=2)+'\n')
print('verified',len(records),sum(x['bytes'] for x in records))
