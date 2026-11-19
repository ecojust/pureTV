from pathlib import Path
import json,hashlib,zipfile,plistlib,struct
root=Path('/dev/shm/mac-adventure-recovery');exp=root/'export'; repo=Path('/dev/shm/puretv-submit')
def rec(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def record(p):return rec(p.read_bytes())
em=json.loads((exp/'export-manifest.json').read_text());summary={'exportCommit':'fe98224d07a3052324cc9503674cc5aafa0ac340','artifactSourceCommit':em['artifactSourceCommit'],'qaSourceCommit':em['qaSourceCommit'],'artifactRunId':em['artifactRunId'],'runtimeRunId':em['runId'],'exportManifestFilesVerified':0,'games':{},'limitations':['Local inspection is Linux archive/hash verification; DMG mount, codesign and native gameplay facts are authenticated existing macOS CI results.','No physical controller or television was tested.','Mac packages use ad-hoc signature and are not Apple-notarized.','Original gameplay routes do not establish full-game completion.']}
assert em['artifactSourceCommit']=='dfae2fb0979314424ef3e4f2c7cb7cfcac91885d';assert em['qaSourceCommit']=='8fbc37223ec016f0c1716b27a5babaf56f894123';assert em['installPackagesValidated'] is True
for n,w in em['files'].items():assert record(exp/n)==w,n
summary['exportManifestFilesVerified']=len(em['files'])
for game in ['glup','emberbrood']:
 p=exp/'packages/joystick-catalog-macos-packages-adventure-01'/game;m=json.loads((p/'build-manifest.json').read_text());assert m['sourceCommit']==em['artifactSourceCommit'];assert m['committedInputsVerified'];assert m['signature']=='ad-hoc';assert m['appleNotarized'] is False
 for n,w in m['packages'].items():assert record(p/n)==w
 z=p/next(n for n in m['packages'] if n.endswith('.zip'))
 with zipfile.ZipFile(z) as zz:
  assert zz.testzip() is None
  names=[n for n in zz.namelist() if not n.endswith('/') and not n.startswith('__MACOSX/')];prefix=m['appName']+'/'
  assert len(names)==len(set(names));assert all(n.startswith(prefix) for n in names)
  actual={n[len(prefix):]:rec(zz.read(n)) for n in names};assert actual==m['appFiles'],game
  plist=plistlib.loads(zz.read(prefix+'Contents/Info.plist'));assert plist['CFBundleIdentifier']==m['bundleIdentifier'];assert plist['CFBundleShortVersionString']==m['version'];assert plist['CFBundleVersion']==m['buildVersion']
  b=zz.read(prefix+'Contents/MacOS/'+plist['CFBundleExecutable']);magic,num=struct.unpack('>II',b[:8]);assert magic==0xcafebabe and num==2
  cpus=[struct.unpack('>IIIII',b[8+i*20:28+i*20])[0] for i in range(num)];assert set(cpus)=={0x01000007,0x0100000c}
  for name,value in m['webFiles'].items():
   assert rec(zz.read(prefix+'Contents/Resources/Web/'+name))==value
  assert m['webFiles']['tv.html']==record(repo/'joystick-games'/game/'dist/tv.html')
  assert m['webFiles']['THIRD-PARTY-NOTICES.txt']==record(repo/'joystick-games'/game/'dist/THIRD-PARTY-NOTICES.txt')
 reports=[]
 for f in sorted(exp.glob('evidence/*/'+game+'/*/report.json')):
  d=json.loads(f.read_text());assert d['status']=='passed';assert d['artifactSourceCommit']==em['artifactSourceCommit'];assert d['qaSourceCommit']==em['qaSourceCommit'];assert not d['observerErrors'];assert len(d['tests'])==9;assert all(t['status']=='passed' for t in d['tests'])
  s=d['storageRestart'];assert s['required'] and s['status']=='passed' and s['actualStoredKeys'] and s['newOriginVerified'] and s['initialHydrationEqual'];assert s['before']['origin']!=s['after']['origin'];assert s['nativeSavedAfterQuit']
  for shot in d['screenshots']:assert record(f.parent/shot['path'])=={k:v for k,v in shot.items() if k!='path'}
  for path,digest in d['sourceHashes'].items():
   match=exp/'provenance/executed-source'/path
   if match.exists():assert record(match)['sha256']==digest
  reports.append({'path':str(f.relative_to(exp)),**record(f),'status':d['status'],'processArchitecture':d['nativeProcessArchitecture'],'renderer':d['renderer'],'testsPassed':len(d['tests']),'storageRestart':{k:s[k] for k in ['status','required','actualStoredKeys','newOriginVerified','initialHydrationEqual']},'screenshotCount':len(d['screenshots']),'physicalEsp32Tested':d['physicalEsp32Tested'],'fullGameCompletionTested':d['fullGameCompletionTested']})
 assert len(reports)==4
 summary['games'][game]={'packages':m['packages'],'appFilesVerified':len(m['appFiles']),'zipCrcAndExactCompleteFileSetVerified':True,'fatMachOCpuTypes':cpus,'architectures':['arm64','x86_64'],'frozenWebBytesVerified':True,'minimumMacOS':m['minimumMacOS'],'reports':reports,'nativeChecksPassed':sum(x['testsPassed'] for x in reports),'storageRestoredInAllFourModes':True}
(root/'independent-verification.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps({g:{'checks':v['nativeChecksPassed'],'packages':v['packages']} for g,v in summary['games'].items()},indent=2))
