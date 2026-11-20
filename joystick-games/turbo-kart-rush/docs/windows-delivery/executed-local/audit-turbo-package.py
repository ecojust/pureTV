from pathlib import Path
from collections import defaultdict
import hashlib,importlib.util,json,struct,subprocess,zipfile
ROOT=Path('/dev/shm/puretv-submit');B=Path(__file__).resolve().parent;E=B/'original-turbo-export/joystick-windows-evidence-turbo-kart-rush';P=B/'original-turbo-export/joystick-windows-packages-turbo-kart-rush';SOURCE='039d210cfa4cc65f59adf0859a777f3591853a70';GAME='turbo-kart-rush'
def rec(data):return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def load(name,p):s=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
meta=json.loads((P/'build-manifest.json').read_text());assert (P/'build-manifest.json').read_bytes()==(E/'build-manifest.json').read_bytes();assert meta['sourceCommit']==SOURCE and meta['game']==GAME and meta['committedInputsVerified'] and meta['architecture']=='x86_64' and meta['authenticodeSigned'] is False
inventory={}
for row in subprocess.check_output(['git','ls-tree','-rz',SOURCE],cwd=ROOT).split(b'\0'):
 if row:
  h,n=row.split(b'\t');mode,kind,sha=h.decode().split();inventory[n.decode()]={'mode':mode,'kind':kind,'sha':sha}
p=B/'frozen-windows-inputs.py';p.write_bytes(subprocess.check_output(['git','show',SOURCE+':joystick-games/tools/windows-inputs.py'],cwd=ROOT));scope=load('original_turbo_source_scope',p)
assert scope.file_records(meta['inputScope'])==meta['inputFiles'];scope.verify_complete_git_selection(meta['inputScope'],inventory)
seen={}
for name,expected in meta['inputFiles'].items():
 entry=inventory[name];assert entry['kind']=='blob' and entry['mode'] in ('100644','100755');data=subprocess.check_output(['git','cat-file','blob',entry['sha']],cwd=ROOT);assert rec(data)==expected;assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==entry['sha'];seen[name]=data
reader=load('original_turbo_boundary_reader',B/'frozen-reader/joystick-games/tools/windows-reexport.py');zips=[]
for n,m in meta['packages'].items():assert rec((P/n).read_bytes())==m;assert m['bytes']<meta['packageByteLimit'];zips += [n] if n.endswith('.zip') else []
assert len(zips)==1;dest=B/'verified-turbo-portable';records=reader.safe_extract(P/zips[0],dest,max_total=16_000_000);prefix=next(iter(records)).split('/')[0]+'/';assert all(n.startswith(prefix) for n in records);actual={n[len(prefix):]:m for n,m in records.items()};assert actual==meta['appFiles'];payload=dest/prefix
binary=(payload/'PureTVGame.exe').read_bytes();offset=struct.unpack_from('<I',binary,60)[0];assert binary[:2]==b'MZ' and binary[offset:offset+4]==b'PE\0\0' and struct.unpack_from('<H',binary,offset+4)[0]==0x8664
current=[]
for p in (ROOT/'joystick-games'/GAME/'dist').rglob('*'):
 if p.is_file():n=p.relative_to(ROOT/'joystick-games'/GAME/'dist').as_posix();assert p.read_bytes()==(payload/'Web'/n).read_bytes();current.append(n)
installed=json.loads((E/'package-verification.json').read_text());assert installed['status']=='passed' and installed['sourceCommit']==SOURCE and installed['game']==GAME and installed['packages']==meta['packages'] and installed['binarySha256']==actual['PureTVGame.exe']['sha256']
for key in ['installedBytesMatchPortable','completeFileSetVerified','uninstallPreservesUnrelatedFiles','uninstallRemovesOnlyPackagedFiles','packageHashesVerified','zipCrcVerified','silentInstallerExecuted']:assert installed[key] is True
selection=json.loads((B/'success-only-selection.json').read_text());assert list(selection['selected'])==[GAME] and selection['selected'][GAME]['job']['conclusion']=='success'
plan=json.loads(seen['joystick-games/'+GAME+'/qa-plan.json'])
def path(obj,name):
 for p in name.split('.'):obj=obj[p]
 return obj

def matches(predicates,after,before):
 for p in predicates:
  a=path(after,p['path']);op=p['op']
  if op=='eq':assert a==p['value']
  elif op=='gt':assert a>p['value']
  elif op=='changed':assert a!=path(before,p['path'])
  else:raise AssertionError(op)

def wire_audit(rows):
 sent={};replies=defaultdict(list);identities=set()
 for r in rows:
  key=(r['connection'],r['message']['seq'])
  if r['direction']=='sdk-to-game':assert key not in sent;sent[key]=r;identities.add(r['message']['controller_id'])
  else:assert r['direction']=='game-to-sdk';replies[key].append(r)
 assert set(sent)==set(replies) and len(identities)==1
 for key,r in sent.items():assert len(replies[key])==1 and replies[key][0]['message']=={'type':'ack','seq':key[1]} and replies[key][0]['at']>=r['at']
 return {'acceptedMessages':len(sent),'uniqueExactAcks':len(replies),'controllerId':next(iter(identities)),'connections':sorted(set(k[0] for k in sent))}
reports=[]
for mode in ['normal','occupied']:
 rpath=E/('runtime-'+mode)/'report.json';r=json.loads(rpath.read_text());assert r['status']=='passed' and r['qaSourceCommit']==SOURCE and r['game']==GAME and r['binarySha256']==actual['PureTVGame.exe']['sha256'];assert len(r['tests'])==10 and all(t['status']=='passed' for t in r['tests']);assert r['qaPlan']==plan
 for n,h in r['sourceHashes'].items():assert hashlib.sha256(seen[n.replace('\\','/')]).hexdigest()==h
 steps=r['tests'][3]['details']['planSteps'];assert len(steps)==len(plan['steps'])==10
 for target,obs in zip(plan['steps'],steps):assert target['name']==obs['name'];matches(target['expect'],obs['after'],obs['before'])
 for shot in r['screenshots']:assert rec((E/('runtime-'+mode)/shot['path']).read_bytes())=={k:shot[k] for k in ['bytes','sha256']}
 storage=r['storageRestart'];assert storage['required'] is False and storage['status']=='not_exercised' and storage['nativeSavedAfterQuit']=={} and storage['actualStoredKeys']==[] and storage['initialHydrationEqual'] and storage['cleanBrowserCacheVerified'];assert r['nativeDisplay']['originalModeRestored']
 w=wire_audit(r['wire']);assert r['tests'][7]['details']=={'messages':w['acceptedMessages'],'matchingAcks':w['uniqueExactAcks']}
 bounded=r['boundedGameplayObservations'];assert len(bounded)==1;h=bounded[0];assert h['status']=='passed' and h['mode']=='held-until-expect' and h['timeoutSeconds']==60 and h['releasedFreshFrames']==2 and h['semanticHeldObserved'];assert h['firstMatchedAtSeconds']<=h['releasedAtSeconds']<60 and h['elapsedSeconds']<60
 first=h['firstMatchingHeldState'];before=h['before'];matches(h['originalExpect'],first,before);assert first['controller']['buttons']['UP'] and first['frames']>before['frames'] and first['controller']['pollCount']>before['controller']['pollCount'];assert h['inputConsumed']['controller']['buttons']['UP'];assert all(v is False for v in h['after']['controller']['buttons'].values());assert h['after']['frames']>first['frames'];assert h['sdkMessagesThroughRelease']==h['matchingAcksThroughRelease']
 msgs=[x for x in r['wire'] if x['direction']=='sdk-to-game' and x['message']['seq'] in (h['sdkDownSequence'],h['sdkReleaseSequence']) and x['connection']==h['wireConnection']];assert len(msgs)==2 and [(x['message']['key'],x['message']['action'],x['message']['pressed']) for x in msgs]==[('UP','down',True),('UP','tap',False)]
 hold={'beforeFrame':before['frames'],'firstMatchingHeldFrame':first['frames'],'afterReleasedFrame':h['after']['frames'],'beforeSpeed':before['gameplay']['speed'],'firstMatchingHeldSpeed':first['gameplay']['speed'],'beforeProgress':before['gameplay']['progress'],'firstMatchingHeldProgress':first['gameplay']['progress'],'wireHeldSeconds':h['wireHeldSeconds'],'releaseAfterFirstMatchSeconds':h['releasedAtSeconds']-h['firstMatchedAtSeconds'],'releasedFreshFrames':2,'timeoutSeconds':60,'acceptedWireMessagesThroughRelease':h['sdkMessagesThroughRelease']}
 reports.append({'mode':mode,'reportSha256':hashlib.sha256(rpath.read_bytes()).hexdigest(),'checks':10,'sourceHashesVerified':len(r['sourceHashes']),'originalPlanPredicatesRecomputed':10,'screenshotsVerified':len(r['screenshots']),'wire':w,'boundedOriginalAcceleration':hold,'storageRestartStatus':'not_exercised','realGameSaveRestorationVerified':False,'originalDisplayRestored':True})
result={'status':'passed','scope':'Original complete package/source/runtime evidence audit; no local game/installer execution or rebuild','sourceCommit':SOURCE,'sourceRunId':44621752383,'runAttempt':1,'immutableExportCommit':'f559a71e99ff27c8f262ed2a82a70674ee90f9dc','originalRunConclusion':'failure','selectedVerifyJobConclusion':'success','selectedVerifyJobId':135905037968,'exportJobConclusion':'success','sourceFilesVerified':len(meta['inputFiles']),'originalPortableAppFilesVerified':len(actual),'currentDistFilesUnchanged':len(current),'binarySha256':actual['PureTVGame.exe']['sha256'],'binaryPeMachine':'AMD64','packages':meta['packages'],'architecture':meta['architecture'],'minimumWindows':meta['minimumWindows'],'webView2Runtime':meta['webView2Runtime'],'requiredRenderer':'webgl2','authenticodeSigned':False,'nativeInstallationUninstallationVerifiedByOriginalRun':True,'physicalControllerTested':False,'fullGameCompletionTested':False,'realStorageRestartVerified':False,'storageStatus':'not_exercised','runtimeModes':reports,'visualReview':'pending_independent_actual_image_view','scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'packagesBuilt':False,'gameLaunchedDuringThisAudit':False}
(B/'turbo-independent-package-runtime-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':'passed','sourceInputs':len(seen),'appFiles':len(actual),'modes':reports}))
