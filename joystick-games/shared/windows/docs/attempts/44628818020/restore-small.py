"""Read completed immutable original Windows export; no build, package GET or POST."""
from pathlib import Path
import concurrent.futures,hashlib,json,os,re,subprocess,urllib.request
BASE=Path(__file__).resolve().parent;RUN=44628818020;SOURCE='232d544079a472aa0ffb259c1bc73c692b94504d';GAMES=['ponpoko-kart','backroad-rally','kart-royale']
ENV={**os.environ,'TMPDIR':'/dev/shm/windows-host-tmp','XDG_CACHE_HOME':'/dev/shm/windows-host-tmp/gh-cli-cache'}
run=json.loads((BASE/'completed-run.json').read_text());assert run['id']==RUN and run['run_attempt']==1 and run['head_sha']==SOURCE and run['status']=='completed'
def api(path,name):
 target=BASE/name
 if not target.exists():
  r=subprocess.run(['gh','api','repos/ecojust/pureTV/'+path],env=ENV,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=40)
  if r.returncode:(BASE/(name+'.error')).write_bytes(r.stderr);raise RuntimeError('Original metadata GET failed: '+name)
  target.write_bytes(r.stdout)
 return json.loads(target.read_text())
ref=api(f'git/ref/heads/build-assets/joystick-catalog-windows-{RUN}-attempt-1','original-export-ref.json');commit=ref['object']['sha'];assert re.fullmatch('[a-f0-9]{40}',commit)
tree=api('git/trees/'+commit+'?recursive=1','original-export-tree.json');assert not tree['truncated'];blobs={b['path']:b for b in tree['tree'] if b['type']=='blob'}
out=BASE/'original-small-export';out.mkdir(exist_ok=True)
def fetch(name,expected=None):
 item=blobs[name];assert item['mode']=='100644' and 0<=item['size']<8_000_000
 path=out/name
 if path.exists():data=path.read_bytes()
 else:
  with urllib.request.urlopen('https://raw.githubusercontent.com/ecojust/pureTV/'+commit+'/'+name,timeout=40) as r:data=r.read(8_000_001)
 assert len(data)==item['size'] and hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==item['sha'],name
 record={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 if expected is not None:assert record==expected,name
 path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data);return record
files={'export-manifest.json':fetch('export-manifest.json')};manifest=json.loads((out/'export-manifest.json').read_text())
assert manifest['sourceCommit']==SOURCE and manifest['runId']==RUN and manifest['runAttempt']==1 and manifest['requestedGames']==GAMES
receipts={}
for game in GAMES:
 name='joystick-windows-evidence-'+game+'/evidence-manifest.json';files[name]=fetch(name,manifest['files'][name]);r=json.loads((out/name).read_text());assert r['game']==game and r['sourceCommit']==SOURCE and r['runId']==str(RUN) and r['runAttempt']=='1';receipts[game]=r
selected=[]
pattern=r'(?:build\.log|source-scope-error\.txt|build-manifest\.json|package-verification\.json|runtime-(?:bootstrap|normal|occupied)(?:\.log|/(?:report\.json|failure-observation\.json|native\.log|native-preferences-after-run\.json|diagnostics/(?:state\.json|startup-events\.jsonl))))'
for game in GAMES:
 prefix='joystick-windows-evidence-'+game+'/'
 for relative,item in receipts[game]['files'].items():
  if re.fullmatch(pattern,relative):
   name=prefix+relative;assert name in blobs and manifest['files'][name]==item;selected.append((name,item))
assert sum(blobs[name]['size'] for name,_ in selected)<64_000_000,'Small-report total exceeds bound'
def worker(pair):return pair[0],fetch(*pair)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:files.update(dict(pool.map(worker,selected)))
summary={}
for game in GAMES:
 prefix=out/('joystick-windows-evidence-'+game);meta_path=prefix/'build-manifest.json';meta=json.loads(meta_path.read_text()) if meta_path.exists() else None;summary[game]={}
 if meta:assert meta['game']==game and meta['sourceCommit']==SOURCE
 for mode in ('bootstrap','normal','occupied'):
  p=prefix/('runtime-'+mode)/'report.json'
  if not p.exists():summary[game][mode]={'status':'absent_from_original_export'};continue
  report=json.loads(p.read_text())
  if mode=='bootstrap':assert report['sourceCommit']==SOURCE
  else:assert report['game']==game and report['qaSourceCommit']==SOURCE
  if meta:assert report['binarySha256']==meta['appFiles']['PureTVGame.exe']['sha256']
  summary[game][mode]={'status':report['status'],'checksPassed':sum(t['status']=='passed' for t in report.get('tests',[])),'errorTail':report.get('error','')[-1500:]}
result={'status':'original_small_files_restored_and_git_manifest_verified','sourceRunId':RUN,'sourceCommit':SOURCE,'immutableExportCommit':commit,'verifiedGamesAsOriginallyReported':manifest['verifiedGames'],'originalFiles':len(files),'originalBytes':sum(v['bytes'] for v in files.values()),'files':files,'games':summary,'packagesDownloaded':False,'nativeRerun':False}
(BASE/'small-report-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='files'},indent=2))
