from pathlib import Path
import hashlib,json,subprocess,zipfile,plistlib,struct
ROOT=Path('/dev/shm/neon-macos-ci/43714427066')
OUT=ROOT/'export'
REPO=Path('/dev/shm/puretv-neon-macos')
SOURCE='13748656d0b4122cbf263eecb0aeae74af036422'
def sha(data):return hashlib.sha256(data).hexdigest()
def git(path):return subprocess.check_output(['git','show',SOURCE+':'+path],cwd=REPO)
manifest=json.loads((OUT/'export-manifest.json').read_text())
assert manifest['sourceCommit']==SOURCE and manifest['runId']==43714427066 and manifest['installPackagesValidated'] is True
assert manifest['buildResult']==manifest['verifyResult']=='success'
for name,item in manifest['files'].items():
 data=(OUT/name).read_bytes()
 assert len(data)==item['bytes'] and sha(data)==item['sha256'],name
build=json.loads((OUT/'packages/build-manifest.json').read_text())
assert (build['sourceCommit'],build['version'],build['buildVersion'])==(SOURCE,'0.1.2','2')
assert set(build['architectures'])=={'arm64','x86_64'}
for name,item in build['inputFiles'].items():
 data=git(name)
 assert len(data)==item['bytes'] and sha(data)==item['sha256'],name
for name,item in build['packages'].items():
 data=(OUT/'packages'/name).read_bytes()
 assert len(data)==item['bytes'] and sha(data)==item['sha256'],name
sums={name:hashcode for hashcode,name in [line.split('  ',1) for line in (OUT/'packages/SHA256SUMS.txt').read_text().splitlines()]}
assert set(sums)==set(build['packages'])
assert all(sums[name]==item['sha256'] for name,item in build['packages'].items())
with zipfile.ZipFile(OUT/'packages/NeonRush-0.1.2-macos-universal.zip') as archive:
 for name,item in build['appFiles'].items():
  data=archive.read('Neon Rush.app/'+name)
  assert len(data)==item['bytes'] and sha(data)==item['sha256'],name
 plist=plistlib.loads(archive.read('Neon Rush.app/Contents/Info.plist'))
 assert (plist['CFBundleShortVersionString'],plist['CFBundleVersion'])==('0.1.2','2')
 binary=archive.read('Neon Rush.app/Contents/MacOS/NeonRush')
 assert struct.unpack('>I',binary[:4])[0]==0xcafebabe
 cpu_types=[]
 for index in range(struct.unpack('>I',binary[4:8])[0]):
  cpu,sub,offset,size,align=struct.unpack('>IIIII',binary[8+20*index:28+20*index]);cpu_types.append(cpu)
 assert set(cpu_types)=={0x1000007,0x100000c}
reports={}
for platform,mode in [('macos-arm64','native-occupied-port'),('macos-arm64','native'),('macos-arm64','rosetta'),('macos-x64','native')]:
 report=json.loads((OUT/'evidence'/('neon-rush-macos-qa-'+platform)/mode/'report.json').read_text())
 assert report['status']=='passed' or (platform=='macos-x64' and report['status']=='limited_graphics' and report['webglAvailable'] is False)
 assert report['binarySha256']==sha(binary)
 assert all(t['status']=='passed' for t in report['tests'])
 stability=report['portStability']
 assert stability['cycles']==3 and stability['port']==report['initialControllerPort']
 assert all(stability[key] is True for key in ('sameConnection','samePort','backgroundInputSuppressed','foregroundHeldKeysQuarantined','freshPressWorks'))
 assert {row['port'] for row in stability['observations']}=={stability['port']}
 assert {row['session'] for row in stability['observations']}=={stability['session']}
 assert report['mdns']['txtVersion']=='1'
 sdk_path='puretv-joystick/joystick_sdk.py'
 assert report['sourceHashes'][sdk_path]==sha(git(sdk_path))
 if mode=='native-occupied-port':
  assert report['defaultPortOccupied'] is True and stability['port']!=63485
  assert report['defaultPortOccupation']['port']==63485
 if mode=='rosetta':assert report['nativeProcessArchitecture']=='x86_64'
 reports[platform+'/'+mode]={key:report.get(key) for key in ['status','architecture','nativeProcessArchitecture','initialControllerPort','defaultPortOccupied','webglAvailable','mdns','portStability','limitations']}
 reports[platform+'/'+mode]['tests']=[{'name':item['name'],'status':item['status'],'details':item.get('details')} for item in report['tests']]
 reports[platform+'/'+mode]['originalSdkSha256']=report['sourceHashes'][sdk_path]
summary={'sourceCommit':SOURCE,'runId':43714427066,'exportFilesVerified':len(manifest['files']),'inputFilesVerified':len(build['inputFiles']),'appFilesVerified':len(build['appFiles']),'version':'0.1.2','buildVersion':'2','binarySha256':sha(binary),'packages':build['packages'],'reports':reports}
(ROOT/'verified-export.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,ensure_ascii=False,indent=2))
