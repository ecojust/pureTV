#!/usr/bin/env python3
"""Fetch immutable APKs below 10 MB and save reproducible static inspection evidence.

The inventory is an explicit fixed-commit selection, not a source of download URLs.
The original APK bytes and signing certificates remain unchanged. A successful
signature/CRC check establishes file integrity, not runtime safety or TV support.
No APK code is executed. Each record preserves the actual aapt/apksigner results.
"""
import argparse,concurrent.futures,datetime,hashlib,json,os,re,subprocess,time,urllib.parse,urllib.request,zipfile
from pathlib import Path,PurePosixPath
parser=argparse.ArgumentParser(description="Download fixed-commit TVAPP APK candidates and inspect their original metadata/signatures without executing or resigning them.")
parser.add_argument('--inventory',type=Path,required=True,help='JSON with repository, commit and candidates (path/sha/size)')
parser.add_argument('--output',type=Path,required=True,help='Destination containing apks/ and apk-audit/')
parser.add_argument('--build-tools',type=Path,required=True,help='Android SDK build-tools directory with aapt and apksigner')
parser.add_argument('--java-home',type=Path,required=True,help='JDK directory used by apksigner')
parser.add_argument('--apk-cache',type=Path,help='Optional shared directory of <GitBlobSHA>.apk files; avoids duplicate download storage')
parser.add_argument('--jobs',type=int,default=3,choices=[1,2,3],help='Maximum concurrent downloads/checks (default: 3)')
args=parser.parse_args()
BASE=args.output.resolve(); AUDIT=BASE/'apk-audit'; APKS=args.apk_cache.resolve() if args.apk_cache else BASE/'apks'
AUDIT.mkdir(parents=True,exist_ok=True); APKS.mkdir(parents=True,exist_ok=True)
BUILD=args.build_tools.resolve(); JDK=args.java_home.resolve()
for executable in [BUILD/'aapt',BUILD/'apksigner',JDK/'bin/java']:
 if not executable.is_file():parser.error(f'Missing executable: {executable}')
inv=json.loads(args.inventory.read_text()); revision=inv['commit']; repository=inv.get('repository','youhunwl/TVAPP')
if repository!='youhunwl/TVAPP':parser.error('This importer only reads the youhunwl/TVAPP repository')
if not re.fullmatch('[0-9a-f]{40}',revision):parser.error('commit must be a full lowercase Git SHA')
for candidate in inv['candidates']:
 if not re.fullmatch('[0-9a-f]{40}',candidate['sha']):parser.error('Each candidate needs a full Git blob SHA')
 if not isinstance(candidate['size'],int) or not 0<candidate['size']<10_000_000:parser.error('Each APK must be strictly below 10,000,000 bytes')
 path=PurePosixPath(candidate['path'])
 if path.is_absolute() or '..' in path.parts or path.suffix.lower()!='.apk':parser.error('Invalid APK source path')
if len({candidate['sha'] for candidate in inv['candidates']})!=len(inv['candidates']):
 parser.error('Candidate Git blobs must be unique; record duplicate source paths separately')
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
   if not dest.is_file():
    partial=dest.with_suffix('.apk.part');partial.write_bytes(data);partial.replace(dest)
   attempts.append({'attempt':index+1,'status':'verified','bytes':len(data)})
   break
  except Exception as error:
   attempts.append({'attempt':index+1,'errorType':type(error).__name__})
   if index==2:raise
   time.sleep(index+1)
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
   info=z.getinfo(path)
   if info.file_size>2_000_000:continue
   image=z.read(path)
   extension='.png' if image.startswith(b'\x89PNG\r\n\x1a\n') else '.jpg' if image.startswith(b'\xff\xd8\xff') else '.webp' if image.startswith(b'RIFF') and image[8:12]==b'WEBP' else None
   if not extension:continue
   name='icon-'+hashlib.sha256(path.encode()).hexdigest()[:10]+extension
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
with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
 futures={pool.submit(inspect,item):item for item in inv['candidates']}
 for future in concurrent.futures.as_completed(futures):
  records.append(future.result())
records.sort(key=lambda r:r['sourcePath'])
summary={'repository':repository,'revision':revision,'inspectedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'maxBytesExclusive':10_000_000,'apkCount':len(records),'apkBytes':sum(r['bytes'] for r in records),'uniquePackages':len(set(r['packageName'] for r in records)),'signatureVerifiedCount':sum(r['signatureVerified'] for r in records),'physicalTvTested':False,'apkExecuted':False,'records':records}
(AUDIT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({key:val for key,val in summary.items() if key!='records'},ensure_ascii=False,indent=2),flush=True)
