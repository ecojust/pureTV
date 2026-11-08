import concurrent.futures,datetime,hashlib,json,os,re,subprocess,time,urllib.parse,urllib.request,zipfile
from pathlib import Path
BASE=Path('/workspace/scratch/fork-tvapp-20261108')
AUDIT=BASE/'apk-audit'; APKS=BASE/'apks'
BUILD=Path('/workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0')
JDK=Path('/workspace/scratch/game-polish-toolchain/jdk-17.0.21+9')
inv=json.loads((BASE/'inventory/candidates-raw.json').read_text()); revision=inv['commit']
assert revision=='08ec332c0a25e9ae97fb73d3b3e40784dab65fc3'
env=dict(os.environ);env['JAVA_HOME']=str(JDK);env['PATH']=str(JDK/'bin')+os.pathsep+env.get('PATH','')
def run(tool,args,folder,name):
 command=[str(BUILD/tool),*args]
 result=subprocess.run(command,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=60)
 (folder/(name+'.stdout.txt')).write_bytes(result.stdout);(folder/(name+'.stderr.txt')).write_bytes(result.stderr)
 return {'command':command,'exitCode':result.returncode,'stdout':result.stdout.decode('utf-8','replace'),'stderr':result.stderr.decode('utf-8','replace')}
def inspect(item):
 sha=item['sha']; folder=AUDIT/sha; folder.mkdir(exist_ok=True);dest=APKS/(sha+'.apk')
 url=f'https://raw.githubusercontent.com/youhunwl/TVAPP/{revision}/'+urllib.parse.quote(item['path'],safe='/')
 attempts=[]
 for index in range(3):
  try:
   if dest.is_file(): data=dest.read_bytes()
   else:
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'pureTV-fork-resource-import'}),timeout=45) as response:
     assert response.status==200
     data=response.read(10_000_001)
   assert len(data)==item['size'] and 0<len(data)<10_000_000
   assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==sha
   if not dest.is_file():dest.write_bytes(data)
   attempts.append({'attempt':index+1,'status':'verified','bytes':len(data)})
   break
  except Exception as error:
   attempts.append({'attempt':index+1,'errorType':type(error).__name__})
   if index==2:raise
 else:raise RuntimeError('download verification did not succeed')
 record={'sourcePath':item['path'],'sourceUrl':url,'sourceCommit':revision,'blobSha1':sha,'apkPath':str(dest),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'downloadAttempts':attempts}
 badging=run('aapt',['dump','badging',str(dest)],folder,'badging')
 record['badgingExitCode']=badging['exitCode']
 txt=badging['stdout']; package=re.search(r"^package: (.+)$",txt,re.M)
 attrs=dict(re.findall(r"([\w-]+)='([^']*)'",package.group(1))) if package else {}
 record.update({'packageName':attrs.get('name'),'versionName':attrs.get('versionName'),'versionCode':attrs.get('versionCode'),'compileSdkVersion':attrs.get('compileSdkVersion')})
 labels=dict(re.findall(r"^application-label(?:-([^:]+))?:'([^']*)'$",txt,re.M))
 icons=dict(re.findall(r"^application-icon-([^:]+):'([^']*)'$",txt,re.M))
 record['labels']=labels; record['iconPathsByDensity']=icons
 for token,field in [('sdkVersion','minSdk'),('targetSdkVersion','targetSdk')]:
  match=re.search(r'^'+token+r":'([^']*)'",txt,re.M);record[field]=int(match.group(1)) if match and match.group(1).isdigit() else None
 record['launchableActivities']=re.findall(r"^launchable-activity: name='([^']*)'",txt,re.M)
 match=re.search(r"^native-code:(.*)$",txt,re.M);record['nativeAbis']=re.findall(r"'([^']*)'",match.group(1)) if match else []
 record['permissions']=re.findall(r"^uses-permission(?:-sdk-\d+)?: name='([^']*)'",txt,re.M)
 with zipfile.ZipFile(dest) as z:
  entries=z.infolist();record['zipEntries']=len(entries)
  assert any(i.filename=='AndroidManifest.xml' for i in entries)
  assert sum(i.file_size for i in entries)<500_000_000
  error=z.testzip();record['zipCrcVerified']=error is None;assert error is None
  extracted=[]
  paths=sorted(set(icons.values()))
  for path in paths:
   if not path.lower().endswith(('.png','.webp','.jpg','.jpeg')):continue
   info=z.getinfo(path)
   if info.file_size>2_000_000:continue
   image=z.read(path);name='icon-'+hashlib.sha256(path.encode()).hexdigest()[:10]+Path(path).suffix.lower()
   (folder/name).write_bytes(image)
   extracted.append({'apkResourcePath':path,'localFile':str(folder/name),'bytes':len(image),'sha256':hashlib.sha256(image).hexdigest()})
  record['extractedIcons']=extracted
 verification=run('apksigner',['verify','--verbose','--print-certs',str(dest)],folder,'signature')
 record['signatureVerified']=verification['exitCode']==0;record['signatureExitCode']=verification['exitCode']
 sigtext=verification['stdout']+'\n'+verification['stderr']
 record['signatureSchemes']={m.group(1):m.group(2)=='true' for m in re.finditer(r'Verified using (v\d(?:\.\d)?) scheme[^:]*: (true|false)',sigtext)}
 record['certificates']=[{'signer':int(m.group(1)),'sha256':m.group(2)} for m in re.finditer(r'Signer #(\d+) certificate SHA-256 digest: ([0-9a-f]+)',sigtext)]
 record['signerNames']=[m.group(2) for m in re.finditer(r'Signer #(\d+) certificate DN: (.+)',sigtext)]
 (folder/'record.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'file':item['path'],'package':record['packageName'],'version':record['versionName'],'bytes':record['bytes'],'signature':record['signatureVerified'],'icons':len(record['extractedIcons'])},ensure_ascii=False),flush=True)
 return record
records=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 futures={pool.submit(inspect,item):item for item in inv['candidates']}
 for future in concurrent.futures.as_completed(futures):
  records.append(future.result())
records.sort(key=lambda r:r['sourcePath'])
summary={'repository':'youhunwl/TVAPP','revision':revision,'inspectedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'maxBytesExclusive':10_000_000,'apkCount':len(records),'apkBytes':sum(r['bytes'] for r in records),'uniquePackages':len(set(r['packageName'] for r in records)),'signatureVerifiedCount':sum(r['signatureVerified'] for r in records),'physicalTvTested':False,'apkExecuted':False,'records':records}
(AUDIT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({key:val for key,val in summary.items() if key!='records'},ensure_ascii=False,indent=2),flush=True)
