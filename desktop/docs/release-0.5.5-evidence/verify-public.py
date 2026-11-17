import datetime,hashlib,json,subprocess,time,urllib.request,urllib.error
from pathlib import Path
root=Path('/workspace/pureTV');out=Path('/workspace/scratch/market-provider-20261108/release');version='0.5.5';tag='desktop-v'+version;run='42452344249';source='45df495dd5605fee3761654b1648793957c9f56b'
def api(path):return json.loads(subprocess.check_output(['gh','api','repos/ecojust/pureTV/'+path],text=True,cwd=root))
release=api('releases/tags/'+tag);latest=api('releases/latest')
assert not release['draft'] and not release['prerelease'] and latest['id']==release['id']
workflow=json.loads(subprocess.check_output(['gh','run','view',run,'--json','headSha,status,conclusion,jobs,url'],text=True,cwd=root))
assert workflow['headSha']==source and workflow['status']=='completed' and workflow['conclusion']=='success'
assert len(workflow['jobs'])==5 and all(x['conclusion']=='success' for x in workflow['jobs'])
expected={f'pureTV-Manager-{version}-{suffix}' for suffix in ['windows-x64-setup.exe','windows-x64-portable.exe','macos-arm64.dmg','macos-x64.dmg','linux-x64.deb']}
assets={x['name']:x for x in release['assets']};assert set(assets)==expected|{'SHA256SUMS.txt'}
notes=subprocess.check_output(['git','show',source+':desktop/docs/release-notes.md'],text=True,cwd=root);assert release['body'].strip()==notes.strip()
assert subprocess.check_output(['git','rev-parse',tag+'^{}'],text=True,cwd=root).strip()==source
old_tag=subprocess.check_output(['git','ls-remote','--tags','origin','refs/tags/desktop-v0.5.4'],text=True,cwd=root).split()[0];assert old_tag=='d6b3ea41382dab04a275b1f8dd72536f70acfc57'
records=[];manifest=None
for name in ['SHA256SUMS.txt']+sorted(expected):
 asset=assets[name];last_error=None
 for attempt in range(3):
  try:
   url=asset['browser_download_url']+('?verification='+str(time.time_ns()) if attempt else '')
   h=hashlib.sha256();size=0;small=[]
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'pureTV-release-verification'}),timeout=30) as response:
    assert response.status==200
    while True:
     chunk=response.read(1024*1024)
     if not chunk:break
     h.update(chunk);size+=len(chunk)
     if name=='SHA256SUMS.txt':small.append(chunk);assert size<65536
   digest=h.hexdigest();assert size==asset['size'] and asset['digest']=='sha256:'+digest
   if name=='SHA256SUMS.txt':
    manifest=b''.join(small).decode();entries={line.split('  ',1)[1]:line.split('  ',1)[0] for line in manifest.splitlines()};assert set(entries)==expected
    (out/'SHA256SUMS.txt').write_text(manifest)
   else:assert entries[name]==digest
   records.append({'name':name,'url':asset['browser_download_url'],'bytes':size,'sha256':digest,'releaseApiMatches':True,'sha256ManifestMatches':True if name!='SHA256SUMS.txt' else None})
   print(name+': '+str(size)+' bytes verified',flush=True);break
  except (urllib.error.URLError,TimeoutError) as error:last_error=type(error).__name__;print(name+': download retry ('+last_error+')',flush=True)
 else:raise RuntimeError('Download could not be verified: '+name+' ('+str(last_error)+')')
summary={'version':version,'tag':tag,'sourceCommit':source,'workflowId':int(run),'workflowUrl':workflow['url'],'status':'released','verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'preflight':json.loads((out/'preflight.json').read_text()),'publication':{'url':release['html_url'],'publishedAt':release['published_at'],'latest':True,'releaseBodyMatchesSource':True,'tagObject':subprocess.check_output(['git','rev-parse',tag],text=True,cwd=root).strip(),'prior054TagUnchanged':True},'downloadVerification':{'allSixAssetsDownloaded':True,'installerCount':5,'completeAssetSetVerified':True,'retainedLocally':'SHA256 manifest and evidence only; installers were streamed in full for verification','assets':records},'jobs':[{'name':j['name'],'conclusion':j['conclusion'],'url':j['url'],'startedAt':j['startedAt'],'completedAt':j['completedAt'],'steps':[{'name':s['name'],'conclusion':s['conclusion']} for s in j['steps']]} for j in workflow['jobs']],'physicalTvTested':False,'giteeUploadPerformed':False}
(out/'verified-release.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print('Public release and all assets verified.',flush=True)
