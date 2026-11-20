import functools,hashlib,http.server,json,os,plistlib,shutil,subprocess,sys,tempfile,threading
from pathlib import Path
from zipfile import ZipFile
src=Path(__file__).resolve().parent;out=Path('observations').resolve();out.mkdir(exist_ok=True);site=Path(os.environ['RUNNER_TEMP'])/'offline-site';site.mkdir()
for f in ('watch.js','raw.js','WebProbe.swift','run.py'):shutil.copyfile(src/f,out/f)
(site/'raw.html').write_text('<!doctype html><title>Independent default WK renderer probe</title><body></body>')
def capture(name,cmd):
 p=subprocess.run(cmd,capture_output=True,text=True);(out/name).write_text(p.stdout+p.stderr);return p.returncode
capture('display.json',['system_profiler','SPDisplaysDataType','-json'])
capture('metal.txt',['system_profiler','SPHardwareDataType','SPDisplaysDataType'])
capture('sw-vers.txt',['sw_vers'])
capture('arch.txt',['uname','-m'])
assert subprocess.check_output(['uname','-m'],text=True).strip()=='x86_64'
swift=out/'wkprobe'
subprocess.run(['swiftc','-O','-framework','AppKit','-framework','WebKit',src/'WebProbe.swift','-o',swift],check=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=site));threading.Thread(target=server.serve_forever,daemon=True).start()
def observe(game,target,script):
 url='http://127.0.0.1:'+str(server.server_port)+'/'+target;dest=out/(game+'.json')
 with (out/(game+'.log')).open('wb') as log:
  try:subprocess.run([swift,url,dest,src/script,'raw' if script=='raw.js' else 'game'],stdout=log,stderr=subprocess.STDOUT,timeout=110)
  except subprocess.TimeoutExpired:pass
 if not dest.exists():dest.write_text(json.dumps({'status':'process timeout or exited without observation'}))
 return json.loads(dest.read_text())
raw=observe('raw','raw.html','raw.js');print('RAW',json.dumps(raw),flush=True)
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
games=['alchemists-lattice','bumble-basket','neon-arcana','oathstones','solder-and-rain','starsling','story-thief'];packages={}
for game in games:
 files=[p for p in Path('packages').rglob('*.zip') if p.parent.name==game and '._' not in p.name]
 assert len(files)==1,(game,files)
 archive=files[0];meta=json.loads((archive.parent/'build-manifest.json').read_text())
 assert sha(archive)==meta['packages'][archive.name]['sha256'],(game,meta.keys())
 with tempfile.TemporaryDirectory() as tmp:
  subprocess.run(['ditto','-x','-k',archive,tmp],check=True)
  app,=Path(tmp).glob('*.app');subprocess.run(['codesign','--verify','--deep','--strict',app],check=True)
  content=app/'Contents'; plist=plistlib.loads((content/'Info.plist').read_bytes());root=content/'Resources/Web';shutil.copytree(root,site/game)
  proof=dict(package=archive.name,archiveSHA256=sha(archive),htmlSHA256=sha(root/'tv.html'),binarySHA256=sha(content/'MacOS'/plist['CFBundleExecutable']),version=plist['CFBundleShortVersionString'],sourceBatch=archive.parents[1].name)
  packages[game]=proof
 result=observe(game,game+'/tv.html','watch.js');print(game,json.dumps(result)[:2000],flush=True)
 for e in result.get('errors',[]):
  if e.get('line') and e.get('column'):
   lines=(site/game/'tv.html').read_text().splitlines();line=e['line']-1;col=e['column']-1
   if 0<=line<len(lines):e['sourceAtError']=lines[line][max(0,col-110):col+130]
 (out/(game+'.json')).write_text(json.dumps(result,indent=2))
 (out/'packages.json').write_text(json.dumps(packages,indent=2))
server.shutdown()
swift.unlink()
