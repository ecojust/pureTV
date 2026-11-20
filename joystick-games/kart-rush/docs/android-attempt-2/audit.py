import base64,hashlib,importlib.util,json,re,shutil,subprocess,sys,tempfile,zipfile
from pathlib import Path
SOURCE='06f1ab2b77e45d5fabcbd7233f8d3e9279a9d5c7';EXPORT='e01ab3ba25008cbbcbfa718321afa49fe6eb2331';RUN=44600152694;GAME='kart-rush'
repo=Path('/dev/shm/puretv-submit');scratch=Path(__file__).parent
origin=Path('/dev/shm/racing-review-karts/turbo-android-44600152694/pureTV-'+EXPORT)
def sha(b):return hashlib.sha256(b).hexdigest()
def record(p):b=p.read_bytes();return {'bytes':len(b),'sha256':sha(b)}
def load(p):return json.loads(p.read_text())
def write(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,indent=2)+'\n')
def git(*args):return subprocess.check_output(['git',*args],cwd=repo)
m=load(origin/'export-manifest.json');assert m['sourceSha']==SOURCE and str(m['runId'])==str(RUN) and str(m['runAttempt'])=='1'
assert m['buildResult']==m['signResult']=='success' and m['installPackagesValidated'] is False
prefixes=['packages/kart-rush/','observers/kart-rush/','reports/joystick-android-report-runtime-kart-rush/','reports/joystick-android-report-build-kart-rush/']
selected={k:v for k,v in m['files'].items() if k.startswith(tuple(prefixes))}
for name,want in selected.items():assert record(origin/name)==want,name
receipt=load(origin/'packages/kart-rush/signing-receipt.json');unsigned=load(origin/'packages/kart-rush/build-receipt.json');observer=load(origin/'observers/kart-rush/observer-signing-receipt.json')
assert receipt['sourceSha']==observer['sourceSha']==SOURCE and str(receipt['runId'])==str(observer['runId'])==str(RUN)
assert receipt['signatureVerified'] and observer['signatureVerified'] and observer['modelWrites'] is False and observer['clockOverrides'] is False
assert unsigned['contentSha256']==receipt['contentSha256'] and unsigned['sha256']==receipt['unsignedSha256']
inputs=receipt['sourceInputs'];combined=dict(inputs)
for n,v in observer['sourceFiles'].items():assert n not in combined or combined[n]==v;combined[n]=v
assert unsigned['sourceInputsSha256']==sha(json.dumps(inputs,sort_keys=True,separators=(',',':')).encode())
entries={}
for row in git('ls-tree','-r','-z',SOURCE,'--',*sorted(combined)).split(b'\0'):
 if row:
  meta,n=row.split(b'\t',1);mode,kind,oid=meta.split();assert mode in [b'100644',b'100755'] and kind==b'blob';entries[n.decode()]=oid.decode()
assert set(entries)==set(combined)
frozen=scratch/'frozen-source';assert not frozen.exists();frozen.mkdir()
q=scratch/'queries.txt';q.write_text(''.join(SOURCE+':'+n+'\n' for n in combined))
with q.open('rb') as stream:
 process=subprocess.Popen(['git','cat-file','--batch'],cwd=repo,stdin=stream,stdout=subprocess.PIPE)
 for n,want in combined.items():
  header=process.stdout.readline().split();assert len(header)==3 and header[1]==b'blob' and header[0].decode()==entries[n]
  data=process.stdout.read(int(header[2]));assert {'bytes':len(data),'sha256':sha(data)}==want,n;assert process.stdout.read(1)==b'\n'
  target=frozen/n;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 assert process.stdout.read()==b'' and process.wait()==0
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('original_kart_build',frozen/'joystick-games/tools/android-build.py');build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)
assert build.sources(GAME)==inputs and build.observer_sources(GAME)==observer['sourceFiles']
spec=importlib.util.spec_from_file_location('original_runtime_inputs',frozen/'joystick-games/tools/android-runtime-inputs.py');runtime=importlib.util.module_from_spec(spec);spec.loader.exec_module(runtime)
assert runtime.expected_inputs(repo,SOURCE,GAME)==set(inputs),'Incomplete receipt input inventory'
tmp=scratch/'tmp';tmp.mkdir();tempfile.tempdir=str(tmp)
expected=build.payload(GAME);actual={}
apk=origin/'packages/kart-rush/kart-rush-0.1.0.apk'
assert record(apk)=={k:receipt[k] for k in ['bytes','sha256']}
assert 0<receipt['bytes']<build.limits(GAME)['maxApkBytes']
with zipfile.ZipFile(apk) as z:
 assert len(z.namelist())==len(set(z.namelist())) and z.testzip() is None
 for n in z.namelist():
  assert not n.startswith('/') and '..' not in Path(n).parts
  if not n.endswith('/') and not n.startswith('META-INF/'):actual[n]=sha(z.read(n))
 assert actual==receipt['contentSha256']
 assert {n[7:]:z.read(n) for n in z.namelist() if n.startswith('assets/') and not n.endswith('/')}==expected
assert receipt['assets']=={n:{'bytes':len(v),'sha256':sha(v)} for n,v in expected.items()}
tools=Path('/workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0');pin=(frozen/'tools/puretv-release-certificate-v2.sha256').read_text().strip()
identities={}
for label,path,want in [('game',apk,receipt),('observer',origin/'observers/kart-rush'/observer['apk'],observer['apkIdentity'])]:
 v=subprocess.run([str(tools/'apksigner'),'verify','--verbose','--print-certs',str(path)],capture_output=True,text=True,timeout=120);(scratch/(label+'-apksigner.txt')).write_text(v.stdout+v.stderr);assert v.returncode==0
 cert=re.search(r'Signer #1 certificate SHA-256 digest: (\S+)',v.stdout)[1].lower();assert cert==pin==want['certificateSha256']
 b=subprocess.check_output([str(tools/'aapt'),'dump','badging',str(path)],text=True,timeout=60);(scratch/(label+'-badging.txt')).write_text(b)
 identity=re.search(r"package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'",b)
 assert identity and identity[1]==want['packageName'] and int(identity[2])==want['versionCode'] and identity[3]==want['versionName']
 assert record(path)=={k:want[k] for k in ['bytes','sha256']}
 identities[label]={k:want[k] for k in ['bytes','sha256','certificateSha256','packageName','versionCode','versionName']}
results=[]
for mode in ['normal','occupied']:
 directory=origin/'reports/joystick-android-report-runtime-kart-rush'/('kart-rush-'+mode);r=load(directory/'report.json')
 assert r['status']=='passed' and r['sourceCommit']==SOURCE and all(t['status']=='passed' for t in r['tests'])
 assert {k:r['apk'][k] for k in ['bytes','sha256']}==record(apk)
 for c in r['captures']:assert {k:c[k] for k in ['bytes','sha256']}==record(directory/c['path'])
 video=directory/r['video']['path'];assert {k:r['video'][k] for k in ['bytes','sha256']}==record(video)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]));write(scratch/(mode+'-ffprobe.json'),probe)
 wire=next(t['details'] for t in r['tests'] if t['name'].startswith('every accepted SDK message'))
 port=next(t['details'] for t in r['tests'] if t['name'].startswith('same native process'))
 results.append({'mode':mode,'originalStatus':r['status'],'tests':len(r['tests']),'captures':len(r['captures']),'port':port,'wire':wire,'video':r['video'],'videoDurationSeconds':float(probe['format']['duration'])})
write(scratch/'audit-result.json',{'status':'passed','sourceSha':SOURCE,'runId':RUN,'runAttempt':1,'exportCommit':EXPORT,'scope':'Independent frozen inputs, signature/payload/report/video integrity; no game rerun','sourceInputsVerified':len(inputs),'allSourceFilesVerified':len(combined),'originalSelectorAndGitInventoryEqual':True,'assetsVerified':len(expected),'selectedExportFilesVerified':len(selected),'selectedExportFiles':selected,'identities':identities,'modes':results,'physicalTvTested':False,'physicalPhoneTested':False,'physicalEsp32Tested':False,'signedApkKeptInScratch':True,'batchValidatedFlagRemainsFalse':True,'script':record(Path(__file__))})
print(json.dumps({'status':'passed','sourceInputs':len(inputs),'assets':len(expected),'exportFiles':len(selected),'modes':[{'mode':x['mode'],'tests':x['tests'],'acks':x['wire']['matchingAcks'],'videoDurationSeconds':x['videoDurationSeconds']} for x in results]}))
