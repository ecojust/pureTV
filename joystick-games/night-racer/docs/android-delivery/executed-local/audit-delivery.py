from pathlib import Path
from collections import Counter,defaultdict
import hashlib,json,subprocess,zipfile,struct,datetime,os
ROOT=Path('/dev/shm/puretv-submit'); BASE=ROOT/'joystick-games/night-racer/docs/android-delivery'; EXP=BASE/'original-export'
SCR=Path('/dev/shm/racing-review-arcade/night-44618869289'); PKG=SCR/'original-package'; EV=EXP/'evidence/joystick-android-runtime-night-racer'; INPUT=EV/'night-racer/verified-inputs'
SRC='315f8889ea677ed6a9211bf7d66c8c78dff57f01'; QA='f3e1e9f6634e35d1c9ae0cfbf1f8a51d42de7965'; APK='66e2589ece8a13bc03d9796259b2662aef34c56c166265db0a63d3baa2b72c91'
def read(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def record(p):
 b=p.read_bytes();return {'bytes':len(b),'sha256':sha(b)}
def checked(p,m):
 a=record(p);assert all(a[k]==m[k] for k in ['bytes','sha256']),(str(p),a,m);return a
sig=read(PKG/'signing-receipt.json'); build=read(PKG/'build-receipt.json');rec=read(PKG/'original-package-recovery.json')
assert sig['sourceSha']==SRC and sig['runId']=='44613335670' and sig['sha256']==APK and sig['bytes']==22465268
apk=PKG/'night-racer-0.1.0.apk';checked(apk,sig);raw=apk.read_bytes();assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()=='339d6f59b79f6069b1268396c4c865ebabd485e9'
assert rec['immutableExport']=='8a27f4906bd9e3c29c91500ffd593d36a1889bd1'
origin=read(INPUT/'original-actions-artifact-origin.json'); refs=read(INPUT/'package-file-references.json');iv=read(INPUT/'input-verification.json')
assert origin['request']=={'run':44613335670,'attempt':1,'source':SRC,'artifact':14571679832}
assert origin['run']['id']==44613335670 and origin['run']['run_attempt']==1 and origin['run']['head_sha']==SRC
art=origin['artifact'];assert art['id']==14571679832 and art['name']=='joystick-android-signed' and art['workflow_run']['head_sha']==SRC
assert art['digest']=='sha256:6280d5423f06c5533d5578656fd34daef6a71687940495dd48e6e10f612187b6' and art['size_in_bytes']==21294870
assert iv['status']=='passed' and iv['qaSourceSha']==QA and iv['qaRunId']=='44618869289' and iv['artifactSourceSha']==SRC
assert refs['artifactOrigin']==iv['artifactOrigin'];assert refs['artifactOrigin']['originManifestSha256']==sha((INPUT/'original-actions-artifact-origin.json').read_bytes())
for name,meta in rec['files'].items():
 checked(PKG/Path(name).name,meta);assert origin['files'][name]=={k:meta[k] for k in ['bytes','sha256']}
for name,meta in refs['files'].items():checked(PKG/Path(name).name,meta);assert origin['files'][name]==meta
sources=sig['sourceInputs']
for n,m in sources.items():
 b=subprocess.check_output(['git','show',SRC+':'+n],cwd=ROOT);assert len(b)==m['bytes'] and sha(b)==m['sha256'],n
 assert (INPUT/'artifact-source'/n).read_bytes()==b,n
with zipfile.ZipFile(apk) as z:
 assert z.testzip() is None
 assets={n[7:] for n in z.namelist() if n.startswith('assets/') and not n.endswith('/')};assert assets==set(sig['assets'])
 assert build['assets']=={n:m['sha256'] for n,m in sig['assets'].items()}
 for n,m in sig['assets'].items():b=z.read('assets/'+n);assert len(b)==m['bytes'] and sha(b)==m['sha256'],n
 for n,h in sig['contentSha256'].items():assert sha(z.read(n))==h,n
current=[]
for p in (ROOT/'joystick-games/night-racer/dist').rglob('*'):
 if p.is_file():n=p.relative_to(ROOT/'joystick-games/night-racer/dist').as_posix();checked(p,sig['assets'][n]);current.append(n)
tools=read(PKG/'actual-tool-invocations.json');assert tools['exitCodes']==[0,0]
for n,m in tools['logs'].items():checked(PKG/n,m)
assert 'eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23' in (PKG/'apksigner.txt').read_text()
aapt=(PKG/'aapt-badging.txt').read_text();assert "sdkVersion:'26'" in aapt and "name='com.ecojust.joystick.nightracer'" in aapt
executed=read(EV/'night-racer/executed-source.json');assert executed['qaSourceSha']==QA and executed['qaRunId']=='44618869289'
for n,m in executed['files'].items():
 b=subprocess.check_output(['git','show',QA+':'+n],cwd=ROOT);assert len(b)==m['bytes'] and sha(b)==m['sha256'],n;assert (EV/'night-racer/executed-source'/n).read_bytes()==b,n
plan=read(EV/'night-racer/executed-source/joystick-games/night-racer/qa-plan.json')

def at(d,path):
 for k in path.split('.'):d=d[k]
 return d

def audit_wire(p,report):
 rows=[json.loads(s) for s in p.read_text().splitlines()];out={};replies=defaultdict(list);hellos={};busy={};keys=set()
 for i,r in enumerate(rows):
  m=r['message'];pair=(r['connection'],m['seq'])
  if r['direction']=='sdk-to-game':
   assert pair not in out;out[pair]=r
   if m['type']=='hello':hellos[r['connection']]=m['controller_id']
   if m['type']=='button':keys.add(m['key'])
  else:
   assert r['direction']=='game-to-sdk';replies[pair].append(r)
   if m['type']=='error':assert m['message']=='controller_busy';busy[r['connection']]=r
 primary=hellos[min(hellos)];assert len(busy)==1 and all(hellos[c]!=primary for c in busy)
 accepted=0;rejected=0
 for (conn,seq),r in out.items():
  rs=replies.get((conn,seq),[])
  if conn in busy:
   rejected+=1
   if r['message']['type']=='hello':assert len(rs)==1 and rs[0]['message']['type']=='error'
   else:assert not rs
  else:
   accepted+=1;assert hellos[conn]==primary;assert len(rs)==1 and rs[0]['message']=={'type':'ack','seq':seq};assert rs[0]['wallTime']>=r['wallTime']
 assert set(replies)<=set(out)
 assert keys==set(['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'])
 result={'sdkMessages':len(out),'acceptedSdkMessages':accepted,'rejectedSdkMessages':rejected,'hostReplies':sum(len(v) for v in replies.values()),'matchingAcks':accepted,'missingAcks':0,'duplicateAcks':0,'unexpectedReplies':0,'primaryControllerId':primary,'rejectedControllerIds':[hellos[c] for c in busy],'connections':hellos,'keysSent':sorted(keys),'originalWire':record(p)}
 for k in ['sdkMessages','acceptedSdkMessages','rejectedSdkMessages','hostReplies','matchingAcks','keysSent']:assert result[k]==report[k]
 return result
modes=[]
for mode in ['normal','occupied']:
 folder=EV/('night-racer-'+mode);r=read(folder/'report.json');assert r['status']=='passed' and len(r['tests'])==58 and all(t['status']=='passed' for t in r['tests'])
 assert r['sourceCommit']==QA and r['targetPackage']==sig['packageName'] and r['apk']['sha256']==APK and r['apk']['bytes']==sig['bytes']
 assert not r['modelWrites'] and not r['clockOverrides'];assert not r['physicalTvTested'] and not r['physicalEsp32Tested']
 for n,m in r['sourceFiles'].items():checked(EV/'night-racer/executed-source'/n,m)
 snaps={x['label']:x for x in r['snapshots']};observations=[]
 for step in plan['steps']:
  before=snaps['before-plan-'+step['name']]['snapshot']['game'];after=snaps['after-plan-'+step['name']]['snapshot']['game']
  for pred in step['expect']:
   a=at(after,pred['path']);op=pred['op']
   if op=='eq':assert a==pred['value'],step['name']
   elif op=='gt':assert a>pred['value'],step['name']
   elif op=='lt':assert a<pred['value'],step['name']
   elif op=='changed':assert a!=at(before,pred['path']),step['name']
   else:raise AssertionError(op)
  observations.append({'name':step['name'],'keys':step['keys'],'beforeFrame':before['frames'],'afterFrame':after['frames'],'beforeStage':before['stage'],'afterStage':after['stage'],'predicates':[{'path':p['path'],'before':at(before,p['path']),'after':at(after,p['path'])} for p in step['expect']]})
 assert len(r['menuTapObservations'])==11
 for tap in r['menuTapObservations']:assert tap['status']=='passed' and tap['stableFreshSamples']==2
 captures=[]
 for c in r['captures']:
  checked(folder/c['path'],c);data=(folder/c['path']).read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n';w,h=struct.unpack('>II',data[16:24]);assert (w,h)==(1920,1080)
  for s in [c['before'],c['after']]:assert s['page']['width']==960 and s['page']['height']==540
  captures.append({'path':c['path'],'bytes':c['bytes'],'sha256':c['sha256'],'pixelSize':[w,h],'logicalViewport':[960,540]})
 checked(folder/r['video']['path'],r['video']);probe_cmd=['ffprobe','-v','error','-show_entries','format=duration,size:stream=width,height,codec_name','-of','json',str(folder/r['video']['path'])];probe=json.loads(subprocess.check_output(probe_cmd,text=True));assert int(probe['format']['size'])==r['video']['bytes']
 modes.append({'mode':mode,'status':'passed','report':record(folder/'report.json'),'checks':58,'port':r['controllerService']['port'],'planExpectationsIndependentlyRecomputed':observations,'menuTapObservations':11,'wireIndependentlyRecomputed':audit_wire(folder/'wire.jsonl',r['wire']),'captures':captures,'video':dict(r['video'],probe=probe,probeCommand=probe_cmd),'qaSourceFilesVerified':len(r['sourceFiles'])})
result={'status':'passed','verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Read-only full original APK, immutable Git source and original runtime export cross-check; no rebuild or native rerun','artifactSourceSha':SRC,'artifactRunId':44613335670,'artifactRunAttempt':1,'artifactId':14571679832,'artifactOriginZip':{'bytes':art['size_in_bytes'],'sha256':art['digest'][7:],'downloadedAgainLocally':False,'note':'Original CI input verifier checked full signed Actions ZIP. This local audit independently retrieved complete APK/receipts through immutable Git export and matched same ZIP file references.'},'originalApkGitExport':'8a27f4906bd9e3c29c91500ffd593d36a1889bd1','qaSourceSha':QA,'qaRunId':44618869289,'qaRunAttempt':1,'runtimeExportCommit':'c6328e03941bbc70a650f33dabcdbd7c555f15c0','signedApk':{k:sig[k] for k in ['packageName','versionCode','versionName','bytes','sha256','certificateSha256']},'actualMinSdk':26,'sourceInputsComparedToFixedGitAndOriginalArchive':len(sources),'actualApkAssetsVerified':len(sig['assets']),'actualApkContentEntriesVerified':len(sig['contentSha256']),'currentDistFilesUnchanged':len(current),'executedQaSourcesComparedToFixedGitAndOriginalArchive':len(executed['files']),'actualSignerAndAaptLogHashesRechecked':tools['logs'],'runtimeModes':modes,'oldProductionRuntimeFailurePreserved':True,'physicalTvTested':False,'physicalEsp32Tested':False,'fullCareerCompleted':False,'storagePersistenceScenarioTested':False,'visualReview':'visual-review.json'}
(BASE/'independent-package-runtime-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':result['status'],'sourceInputs':len(sources),'qaCopies':len(executed['files']),'modes':[{'mode':m['mode'],'checks':m['checks'],'wireAccepted':m['wireIndependentlyRecomputed']['acceptedSdkMessages']} for m in modes]}))
