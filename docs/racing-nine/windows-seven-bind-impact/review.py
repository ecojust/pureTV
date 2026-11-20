import hashlib,json,os,subprocess
from pathlib import Path
ROOT=Path('/dev/shm/puretv-submit');OUT=Path(__file__).parent
ENV=dict(os.environ,GIT_NO_LAZY_FETCH='1')
FIX='772c99ae35583ad1594cd9fffcc6368aa4df7201'
GAMES=['ponpoko-kart','night-racer','last-track','penguintrack','dirt-crown','turbo-kart-rush','kart-rush']
HOST='joystick-games/shared/windows/Sources/main.cpp'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,env=ENV)
def sha(b):return hashlib.sha256(b).hexdigest()
def file(p):
 b=(ROOT/p).read_bytes();return {'path':p,'bytes':len(b),'sha256':sha(b)}
def canonical(v):return sha(json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode())
rows=[]
for slug in GAMES:
 base=f'joystick-games/{slug}';r=json.loads((ROOT/base/'windows-release.json').read_text());p=json.loads((ROOT/base/'packages.json').read_text());g=json.loads((ROOT/base/'game.json').read_text());a=json.loads((ROOT/base/'docs/windows-delivery/independent-verification.json').read_text())
 source=r['sourceCommit'];old=git('show',source+':'+HOST);oldtext=old.decode()
 assert 'error!=WSAEADDRINUSE&&!(error==WSAEACCES&&listening(63485))' in oldtext
 assert a['sourceCommit']==source and str(a['sourceRunId'])==str(r['buildRunId'])
 assert a['packages']==r['packages']
 assert p['windows']['packages']==r['packages'] and p['windows']['sourceCommit']==source and p['windows']['version']=='0.1.0'
 if slug=='ponpoko-kart':manifest='joystick-games/shared/windows/docs/attempts/44628818020/original-small-export/joystick-windows-evidence-ponpoko-kart/build-manifest.json'
 elif slug=='kart-rush':manifest='joystick-games/shared/windows/docs/attempts/44610944515/unique-original-files/joystick-windows-evidence-kart-rush/build-manifest.json'
 elif slug=='turbo-kart-rush':manifest=base+'/docs/windows-delivery/original-export/joystick-windows-evidence-turbo-kart-rush/build-manifest.json'
 else:manifest=base+'/docs/windows-delivery/original-evidence/build-manifest.json'
 m=json.loads((ROOT/manifest).read_text());assert m['sourceCommit']==source and m['packages']==r['packages']
 assert m['inputFiles'][HOST]=={'bytes':len(old),'sha256':sha(old)}
 binary=m['appFiles']['PureTVGame.exe'];assert binary['sha256']==a['binarySha256']
 trees={}
 for sub in ['src','dist']:
  oldtree=git('rev-parse',source+':'+base+'/'+sub).decode().strip();newtree=git('rev-parse',FIX+':'+base+'/'+sub).decode().strip();trees[sub]={'packageSource':oldtree,'fixSource':newtree,'same':oldtree==newtree}
 rows.append({'game':slug,'version':'0.1.0','sourceCommit':source,'runId':str(r['buildRunId']),'exportCommit':r['exportCommit'],'sharedHostSource':{'path':HOST,'bytes':len(old),'sha256':sha(old),'oldConditionalFallbackPresent':True},'sourceManifest':file(manifest),'originalBinary':binary,'packages':r['packages'],'originalDeliveryAudit':file(base+'/docs/windows-delivery/independent-verification.json'),'metadata':[file(base+'/'+f) for f in ['windows-release.json','packages.json','game.json']],'otherPlatformObjectsCanonicalSha256':{q:canonical(p[q]) for q in ['android','macos']},'gameVersion':g['version'],'gameVersionCode':g['versionCode'],'gameTrees':trees,'originalStorageRestartVerified':r.get('realStorageRestartVerified'),'hostCodeChangedBeyondOnePatchIfBuildingAllOfCurrentHead':git('diff','--numstat',source,FIX,'--','joystick-games/shared/windows/Sources/main.cpp','joystick-games/shared/windows/Web').decode().splitlines()})
new=git('show',FIX+':'+HOST);assert 'bindControllerPort' in new.decode()
paths=['joystick-games/tools/windows-build.py','joystick-games/tools/windows-inputs.py','joystick-games/tools/windows-packages.py','joystick-games/tools/windows-verify.py','joystick-games/tools/windows-export.py','joystick-games/tools/android-runtime-inputs.py','joystick-games/tools/macos-build.py','.github/workflows/joystick-catalog-windows.yml','joystick-games/shared/windows/Sources/ControllerBind.hpp',HOST]
result={'scope':'Read-only existing metadata, immutable source and retained manifests. No package read/download/build/test/dispatch. Limited to seven published games within nine racing games.','reviewHead':FIX,'currentSharedMainSha256':sha(new),'publishedGameCount':7,'allSevenCarryOldGate':True,'allSevenDistTreesUnchanged':all(x['gameTrees']['dist']['same'] for x in rows),'games':rows,'currentImplementationFiles':[file(p) for p in paths],'limitations':['Affected means the old host has the same conditional failure path; not proof all seven packages failed in users environments.','New Windows binder actual native CI and all seven replacement packages are not validated by this read-only audit.','Original package verification is reused from retained source/app manifests and delivery audits; original binary/package bytes are not reopened here.']}
(OUT/'review.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'games':len(rows),'manifestBindingsVerified':len(rows),'allDistTreesUnchanged':result['allSevenDistTreesUnchanged'],'reviewSha256':sha((OUT/'review.json').read_bytes())}))
