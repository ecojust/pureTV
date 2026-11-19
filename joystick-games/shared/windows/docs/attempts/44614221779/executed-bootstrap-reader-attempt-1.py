import concurrent.futures,hashlib,json,pathlib,subprocess,urllib.request
ROOT=pathlib.Path('/dev/shm/puretv-submit');folder=ROOT/'joystick-games/shared/windows/docs/attempts/44614221779';commit='aa214ebdcc0832a789e140c6d247c271749d459f';source='b9ffc9e1e5e512927d78dd6adfb393bd0351f4b2';prefix='joystick-windows-evidence-sugarplum-drop/'
tree=json.loads((folder/'original-export-tree.json').read_text());blobs={x['path']:x for x in tree['tree'] if x['type']=='blob'}
names=['export-manifest.json',prefix+'evidence-manifest.json',prefix+'build-manifest.json',prefix+'package-verification.json'];names += [n for n in blobs if n.startswith(prefix+'runtime-bootstrap')]
sources=['.github/workflows/joystick-catalog-windows.yml','joystick-games/tools/windows-evidence.py','joystick-games/shared/windows/tests/navigation-storage.test.py','joystick-games/shared/windows/Sources/main.cpp','joystick-games/shared/windows/Sources/EntryURL.hpp','joystick-games/shared/windows/Web/bridge.js','joystick-games/shared/windows/Web/bootstrap.js','joystick-games/shared/windows/Web/diagnostics.js']
names += [prefix+'executed-source/'+n for n in sources]
out=folder/'original-bootstrap-export';out.mkdir(exist_ok=True)
def download(name):
 b=blobs[name];assert b['mode']=='100644' and b['size']<2_000_000
 with urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+commit+'/'+name,timeout=30) as r:data=r.read(2_000_001)
 assert len(data)==b['size'];assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==b['sha']
 p=out/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);return name,{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'gitBlob':b['sha']}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:files=dict(pool.map(download,names))
manifest=json.loads((out/'export-manifest.json').read_text());assert manifest['sourceCommit']==source and manifest['runId']==44614221779
for name,item in files.items():
 if name!='export-manifest.json':assert {k:item[k] for k in ('bytes','sha256')}==manifest['files'][name],name
receipt=json.loads((out/(prefix+'evidence-manifest.json')).read_text());assert receipt['sourceCommit']==source and receipt['jobStatusAtCollection']=='success'
for name in names:
 if name.startswith(prefix) and not name.endswith('evidence-manifest.json'):
  assert {k:files[name][k] for k in ('bytes','sha256')}==receipt['files'][name[len(prefix):]]
for name in sources:
 raw=(out/(prefix+'executed-source/'+name)).read_bytes();frozen=subprocess.check_output(['git','show',source+':'+name],cwd=ROOT);assert raw==frozen,name
report=json.loads((out/(prefix+'runtime-bootstrap/report.json')).read_text());meta=json.loads((out/(prefix+'build-manifest.json')).read_text());installed=json.loads((out/(prefix+'package-verification.json')).read_text())
assert report['status']=='passed' and report['sourceRun']=='44614221779' and report['sourceCommit']==source and report['normalQueryExit'] is True
assert report['binarySha256']==meta['appFiles']['PureTVGame.exe']['sha256']==installed['binarySha256']
for name,digest in report['inputs'].items():assert files[prefix+'executed-source/joystick-games/shared/windows/'+name]['sha256']==digest
observations=report['firstScriptObservations'];assert len(observations)==4 and [o['phase'] for o in observations]==[0,1,2,3]
expected=[{'save':'native initial','removed':'old','other':None},{'save':'chosen low 雪','removed':None,'other':None},{'save':None,'removed':None,'other':'query write'},{'save':'after clear','removed':None,'other':None}]
for i,o in enumerate(observations):
 assert o['firstScriptStorage']==expected[i]
 assert o['bridgeInitial']=={'fixture.'+k:v for k,v in expected[i].items()}
 assert type(o['epoch']) is int and o['epoch']>0 and (i==0 or o['epoch']>observations[i-1]['epoch'])
assert report['preferences']=={'fixture.save':'final query message'}
assert json.loads((out/(prefix+'runtime-bootstrap/native-preferences-after-run.json')).read_text())==report['preferences']
result={'status':'passed','scope':'Actual Windows production EXE/WebView2 isolated bootstrap fixture, original reports independently verified; not eight-game gameplay acceptance','sourceCommit':source,'sourceRunId':44614221779,'immutableExportCommit':commit,'originalFilesVerified':len(files),'originalBytes':sum(x['bytes'] for x in files.values()),'sourceFilesVerifiedAgainstFrozenGit':len(sources),'binarySha256':report['binarySha256'],'firstScriptEpochs':[o['epoch'] for o in observations],'nativeSeedBeforeFirstScript':True,'immediateSetRemoveThenReload':True,'queryNavigationAccepted':True,'clearThenNextQueryHydrated':True,'finalQueryMessagePersisted':True,'normalQueryExit':True,'files':files}
(folder/'bootstrap-independent-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='files'},indent=2))
