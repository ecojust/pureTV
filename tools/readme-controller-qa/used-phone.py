import hashlib,json,os,re,subprocess,sys,time,urllib.request
from pathlib import Path
folder,out=map(Path,sys.argv[1:3]);os.makedirs(out,exist_ok=True)
slug='used-car-racing';src=os.environ['ARTIFACT_SOURCE'];adb=[os.environ['ANDROID_HOME']+'/platform-tools/adb','-s','emulator-5554']
def run(*a,timeout=45):return subprocess.check_output(adb+list(a),text=True,timeout=timeout).strip()
def file_sha(f):return hashlib.file_digest(f.open('rb'),'sha256').hexdigest()
def report(name,v):(out/name).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def read(url):return json.load(urllib.request.urlopen(url,timeout=12))
a=folder/'packages'/slug;o=folder/'observers'/slug
pkg=json.loads((a/'signing-receipt.json').read_bytes());observer=json.loads((o/'observer-signing-receipt.json').read_bytes())
target=pkg["packageName"]
assert pkg['sourceSha']==observer['sourceSha']==src and not observer['modelWrites'] and pkg['versionName']=='0.1.7'
assert (target==observer['targetPackage'] and target=='com.ecojust.usedcartv')
game=next(a.glob('*.apk'));obs=o/observer['apk'];assert file_sha(game)==pkg['sha256'] and file_sha(obs)==observer['apkIdentity']['sha256']
report('identity.json',dict(source=src,apk=pkg['sha256'],observer=observer['apkIdentity']['sha256'],version=pkg['versionName'],package=target,gameBytes=game.stat().st_size,observerBytes=obs.stat().st_size,gameplaySourceModified=False,modelWrites=False,phoneRoomIsOriginalJava=True))
assert run('shell','getprop','ro.kernel.qemu')=='1' and run('shell','getprop','ro.build.version.sdk')=='36'
assert 'Success' in run('install','-r',str(game),timeout=90)
assert 'Success' in run('install','-r','-t',str(obs),timeout=90)
assert run('shell','pm','clear',target)=='Success'
apkpath=run('shell','pm','path',target).splitlines()[0].removeprefix('package:');assert run('shell','sha256sum',apkpath).split()[0]==pkg['sha256']
p=None;ports=[]
try:
 with (out/'instrumentation.log').open('w') as log:
  p=subprocess.Popen(adb+['shell','am','instrument','-w','-e','diagnosticPort','63486',observer['component']],stdout=log,stderr=subprocess.STDOUT)
  diag=int(run('forward','tcp:0','tcp:63486'));ports.append(diag);endpoint=f'http://127.0.0.1:{diag}/snapshot';wall=time.monotonic()+150;sample=None
  while time.monotonic()<wall:
   try:
    s=read(endpoint)
    if s.get('targetPackage')==target and (s.get('game') or {}).get('phase')=='garage' and (s.get('info') or {}).get('url'):sample=s;break
   except (ValueError,OSError):pass
   time.sleep(.4)
  assert sample,'Original game garage/room never initialized'
  from urllib.parse import urlsplit
  native=sample['info']['url'];u=urlsplit(native);assert u.scheme=='http' and u.port and re.fullmatch('room=[A-Za-z0-9_-]{12,}',u.query)
  run('forward','--no-rebind','tcp:'+str(u.port),'tcp:'+str(u.port));ports.append(u.port)
  loop='http://127.0.0.1:'+str(u.port)+u.path+'?'+u.query
  report('transport.json',{'nativeRoom':native,'actualAndroidRoomPort':u.port,'mobileForwardUrl':loop,'observer':'original signed read-only APK','forwardedPortEqualsRoomPort':True,'browser':'Chromium touch mobile, same original Java web server and WebSocket origin','wifiSdkConnected':False})
  subprocess.run(['node',str(Path(__file__).with_name('used-phone.mjs')),str(out),endpoint,loop,adb[0],adb[2]],timeout=360,check=True)
finally:
 for port in ports:subprocess.run(adb+['forward','--remove','tcp:'+str(port)],capture_output=True,timeout=12)
 for name in [target,observer['packageName']]:subprocess.run(adb+['shell','am','force-stop',name],capture_output=True,timeout=15)
 if p and p.poll() is None:p.terminate()
