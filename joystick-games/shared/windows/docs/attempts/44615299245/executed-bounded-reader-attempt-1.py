import concurrent.futures,hashlib,json,pathlib,re,subprocess,urllib.request
ROOT=pathlib.Path('/dev/shm/puretv-submit');folder=ROOT/'joystick-games/shared/windows/docs/attempts/44615299245';source='6c7cb4fdb99dce236b634c842326bae6aed5f232'
def api(path,name):
 r=subprocess.run(['gh','api','repos/ecojust/pureTV/'+path],capture_output=True);assert r.returncode==0,r.stderr.decode(errors='replace');(folder/name).write_bytes(r.stdout);return json.loads(r.stdout)
ref=api('git/ref/heads/build-assets/joystick-catalog-windows-44615299245-attempt-1','original-export-ref.json');commit=ref['object']['sha'];tree=api('git/trees/'+commit+'?recursive=1','original-export-tree.json');assert not tree['truncated'];blobs={b['path']:b for b in tree['tree'] if b['type']=='blob'}
selected=[]
for name in blobs:
 if name=='export-manifest.json' or name.endswith(('/evidence-manifest.json','/build-manifest.json','/package-verification.json')) or re.fullmatch(r'joystick-windows-evidence-[a-z0-9-]+/(runtime-(?:normal|occupied)\.log|runtime-(?:normal|occupied|bootstrap)/report\.json)',name):selected.append(name)
out=folder/'original-bounded-export';out.mkdir(exist_ok=True)
def fetch(name):
 blob=blobs[name];assert blob['mode']=='100644' and blob['size']<5_000_000,name
 target=out/name
 if target.exists():data=target.read_bytes()
 else:
  with urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+commit+'/'+name,timeout=30) as response:data=response.read(5_000_001)
 assert len(data)==blob['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==blob['sha'],name
 target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);return name,{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlob':blob['sha']}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:files=dict(pool.map(fetch,selected))
manifest=json.loads((out/'export-manifest.json').read_text());assert manifest['sourceCommit']==source and manifest['runId']==44615299245 and manifest['runAttempt']==1
for name,h in files.items():
 if name!='export-manifest.json':assert {k:h[k] for k in ('bytes','sha256')}==manifest['files'][name]
summary={}
for game in manifest['requestedGames']:
 prefix='joystick-windows-evidence-'+game;receipt=json.loads((out/prefix/'evidence-manifest.json').read_text());assert receipt['sourceCommit']==source and receipt['runId']=='44615299245' and receipt['runAttempt']=='1'
 for name,h in files.items():
  if name.startswith(prefix+'/') and not name.endswith('evidence-manifest.json'):assert {k:h[k] for k in ('bytes','sha256')}==receipt['files'][name[len(prefix)+1:]]
 meta=json.loads((out/prefix/'build-manifest.json').read_text());assert meta['sourceCommit']==source and meta['game']==game
 summary[game]={}
 for mode in ['normal','occupied']:
  report=json.loads((out/prefix/('runtime-'+mode)/'report.json').read_text());assert report['game']==game and report['qaSourceCommit']==source and report['binarySha256']==meta['appFiles']['PureTVGame.exe']['sha256']
  failure=[t for t in report['tests'] if t['status']!='passed'];summary[game][mode]={'status':report['status'],'checksPassed':sum(t['status']=='passed' for t in report['tests']),'failure':[(t['name'],t.get('error','')[-1800:]) for t in failure],'errorTail':report.get('error','')[-1800:]}
result={'sourceRunId':44615299245,'sourceCommit':source,'immutableExportCommit':commit,'verifiedGames':manifest['verifiedGames'],'originalFilesVerified':len(files),'originalBytes':sum(v['bytes'] for v in files.values()),'allReportsBoundToOriginalBinaryAndSource':True,'files':files,'games':summary};(folder/'bounded-report-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='files'},indent=2))
