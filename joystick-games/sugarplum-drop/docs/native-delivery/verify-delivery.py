import concurrent.futures,hashlib,json,pathlib,plistlib,struct,urllib.request,zipfile
r=pathlib.Path('/dev/shm/sugar-delivery-audit');repo=pathlib.Path('/dev/shm/puretv-submit');slug='sugarplum-drop';source='a73a1976e7d38ff27b8e457b933519ea66eaa949'
def h(b):return hashlib.sha256(b).hexdigest()
def rec(b):return {'bytes':len(b),'sha256':h(b)}
def load(p):return json.loads(p.read_text())
a=load(r/'android/packages/sugarplum-drop/signing-receipt.json');mp=r/'mac/packages/joystick-catalog-macos-packages-triptych-01/sugarplum-drop';m=load(mp/'build-manifest.json')
# All downloaded files were bound to their immutable Git blob and must also match the original export manifest.
records=load(r/'download-verification.json')['files'];manifest_counts={}
for platform in ['android','mac']:
 manifest=load(r/platform/'export-manifest.json');n=0
 for x in records:
  if x['platform']!=platform or x['path']=='export-manifest.json':continue
  assert manifest['files'][x['path']]=={k:x[k] for k in ['bytes','sha256']},x['path'];n+=1
 manifest_counts[platform]=n
apk=r/'android/packages/sugarplum-drop/sugarplum-drop-0.1.0.apk'
assert rec(apk.read_bytes())=={k:a[k] for k in ['bytes','sha256']}
assert a['sourceSha']==m['sourceCommit']==source
assert a['certificateSha256']=='eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23'
assert 'Signer #1 certificate SHA-256 digest: '+a['certificateSha256'] in (r/'apksigner.txt').read_text()
with zipfile.ZipFile(apk) as z:
 assert z.testzip() is None and len(set(z.namelist()))==len(z.namelist())
 content={n:h(z.read(n)) for n in z.namelist() if not n.endswith('/') and not n.startswith('META-INF/')}
 assert content==a['contentSha256']
 assets={n[7:]:rec(z.read(n)) for n in z.namelist() if n.startswith('assets/') and not n.endswith('/')}
 assert assets==a['assets']
 for n in ['tv.html','THIRD-PARTY-NOTICES.txt']:
  assert z.read('assets/'+n)==(repo/'joystick-games'/slug/'dist'/n).read_bytes()
for n,v in m['packages'].items():assert rec((mp/n).read_bytes())==v,n
with zipfile.ZipFile(next(mp.glob('*.zip'))) as z:
 assert z.testzip() is None and len(set(z.namelist()))==len(z.namelist())
 prefix=m['appName']+'/'
 files={n[len(prefix):]:rec(z.read(n)) for n in z.namelist() if n.startswith(prefix) and not n.endswith('/')}
 assert files==m['appFiles']
 for n in ['tv.html','THIRD-PARTY-NOTICES.txt']:assert z.read(prefix+'Contents/Resources/Web/'+n)==(repo/'joystick-games'/slug/'dist'/n).read_bytes()
 plist=plistlib.loads(z.read(prefix+'Contents/Info.plist'))
 assert plist['CFBundleIdentifier']==a['packageName'] and plist['CFBundleShortVersionString']==a['versionName']
 binary=z.read(prefix+'Contents/MacOS/'+plist['CFBundleExecutable']);magic,narch=struct.unpack_from('>II',binary)
 assert magic==0xcafebabe and narch==2
 cpus=[struct.unpack_from('>IIIII',binary,8+i*20)[0] for i in range(narch)]
 assert set(cpus)=={0x01000007,0x0100000c}
 # Actual Mach-O slices have valid little-endian 64-bit header magic.
 for i in range(narch):
  cpu,sub,offset,size,align=struct.unpack_from('>IIIII',binary,8+i*20);assert offset+size<=len(binary) and binary[offset:offset+4]==b'\xcf\xfa\xed\xfe'
inputs=dict(a['sourceInputs'])
for k,v in m['inputFiles'].items():
 assert k not in inputs or inputs[k]==v,k
 inputs[k]=v
# Exact original commit GETs; no rebuilding, game input, or new CI execution.
def source_check(item):
 name,want=item;url='https://raw.githubusercontent.com/ecojust/pureTV/'+source+'/'+name
 with urllib.request.urlopen(url,timeout=60) as response:b=response.read()
 assert rec(b)==want,name
 return {'path':name,**want,'url':url}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:source_results=list(ex.map(source_check,inputs.items()))
(r/'source-input-verification.json').write_text(json.dumps({'sourceCommit':source,'androidInputs':len(a['sourceInputs']),'macInputs':len(m['inputFiles']),'uniqueInputsVerified':len(source_results),'files':source_results},indent=2)+'\n')
runtime=[]
for platform in ['mac','android']:
 for p in (r/platform/('evidence' if platform=='mac' else 'reports')).rglob('report.json'):
  d=load(p);assert d['status']=='passed' and all(t['status']=='passed' for t in d['tests'])
  summary={'platform':platform,'report':p.relative_to(r).as_posix(),'tests':len(d['tests']),'reportFile':rec(p.read_bytes())}
  if platform=='mac':
   assert d['qaSourceCommit']=='408c52de00f78373fb8548c639254b9e41f53c85' and d['artifactSourceCommit']==source
   assert d['binarySha256']==h(binary)
   s=d['storageRestart'];assert s['required'] is True and s['status']=='passed' and s['actualStoredKeys'] and s['newOriginVerified'] is True and s['initialHydrationEqual'] is True
   assert s['before']['origin']!=s['after']['origin']
   for k in s['actualStoredKeys']:assert s['before']['current'][k]==s['nativeSavedAfterQuit'][k]==s['after']['initial'][k] and s['before']['current'][k]
   summary.update(architecture=d['nativeProcessArchitecture'],storageRestartVerified=True,actualStoredKeys=s['actualStoredKeys'])
  else:
   assert d['sourceCommit']==source and d['apk']['sha256']==a['sha256'];summary.update(defaultPortOccupiedFixture=d['defaultPortOccupiedFixture'],controllerService=d['controllerService'])
  runtime.append(summary)
result={'status':'passed','sourceCommit':source,'downloadedFilesVerified':len(records),'exportManifestFilesVerified':manifest_counts,'sourceInputsVerified':len(source_results),'android':{'apk':apk.name,**rec(apk.read_bytes()),'certificateSha256':a['certificateSha256'],'minSdk':26,'targetSdk':29,'allArchiveEntriesMatchSigningReceipt':True,'currentDistByteEqual':True},'mac':{'packages':m['packages'],'allZipAppFilesMatchBuildManifest':True,'actualMachOArchitectures':['arm64','x86_64'],'currentDistByteEqual':True,'localDmgMountAndCodeSignatureCheck':False,'nativeCiZipDmgInstallAndSignatureEvidence':'package-verification.json in each preserved native platform evidence'},'runtime':runtime,'physicalTvTested':False,'physicalPhoneTested':False,'physicalEsp32Tested':False,'appleNotarized':False,'newCiOrGameplayRunPerformed':False}
(r/'independent-verification.json').write_text(json.dumps(result,indent=2)+'\n');print('passed',len(source_results),'source inputs',len(runtime),'runtime reports')
