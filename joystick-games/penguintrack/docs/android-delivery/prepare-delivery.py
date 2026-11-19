from pathlib import Path
import json,hashlib,os,shutil,subprocess,collections,struct,zipfile,datetime
ROOT=Path('/dev/shm/puretv-submit'); S=Path(__file__).parent; G=ROOT/'joystick-games/penguintrack'; D=G/'docs/android-delivery'; D.mkdir(exist_ok=True)
QA='3cf2452db9853a3a189c47342a291f046e411b5a'; SRC='c5ad63e8c6a0ccfada5f763d1d26afa27f45002e'; EXP='111c827624d21b4149079a4d9b453d29d7d4a7b6'; OLD='35fca55f5a05d38785fb531004eca9add6913f04'
def sha(b):return hashlib.sha256(b).hexdigest()
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def read(p):return json.loads(p.read_text())
def save(p,j):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
def link(a,b):
 b.parent.mkdir(parents=True,exist_ok=True)
 if b.exists():assert a.read_bytes()==b.read_bytes()
 else:os.link(a,b)
oldmeta=read(G/'packages.json');save(D/'previous-packages.json',oldmeta)
for name in ['README.md','SHA256SUMS.txt']:link(G/name,D/('previous-'+name))
# Archive only recovered original objects; all are verified against the immutable tree and manifest.
tree=read(S/'original-tree.json');assert tree['sha']==EXP and not tree['truncated']; entries={x['path']:x for x in tree['tree']}
manifest=read(S/'original-export/export-manifest.json');assert manifest['qaSourceSha']==QA and manifest['qaRunId']=='44634808045' and manifest['qaRunAttempt']=='1'
assert manifest['artifactSourceSha']==SRC and manifest['artifactExportCommit']==OLD and manifest['artifactRunId']=='44606071748'
verified=[]
for p in sorted((S/'original-export').rglob('*')):
 if not p.is_file():continue
 rel=p.relative_to(S/'original-export').as_posix();data=p.read_bytes();e=entries[rel]
 assert e['type']=='blob' and e['mode'] in ('100644','100755') and e['size']==len(data) and e['sha']==blob(data)
 if rel!='export-manifest.json':assert manifest['files'][rel]=={'bytes':len(data),'sha256':sha(data)}
 link(p,D/'original-export'/rel);verified.append({'path':rel,'bytes':len(data),'sha256':sha(data),'gitBlob':blob(data)})
for name in ['original-tree.json','selected-blob-verification.json','media-source-recovery-attempt-2.json','media-source-recovery.json','recover-media.log','recover-media-attempt-2.py','recover-media.py','recover-small.py','initial-report-findings.json','original-runtime-job-log-retrieval.json','original-runtime-job-completed-attempt-2.log','original-runtime-job-completed-attempt-2.json','video-probe-normal.json','video-probe-occupied.json','verify-videos.py']:
 if (S/name).exists():link(S/name,D/'recovery'/name)
for p in (S/'video-review').iterdir():
 if p.is_file():link(p,D/'video-review'/p.name)
base=D/'original-export/evidence/joystick-android-runtime-penguintrack'
inp=read(base/'penguintrack/verified-inputs/input-verification.json');assert inp['status']=='passed' and inp['artifactSourceSha']==SRC and inp['qaSourceSha']==QA
ig=inp['games'][0];assert (ig['frozenSourceInputsVerified'],ig['currentProductionInputsUnchanged'],ig['assetsVerified'])==(442,422,156)
old=G/'docs/android-original-packages-44606071748-44606074787';audit=read(old/'report.json');ag=audit['games'][0];assert ag['game']=='penguintrack' and ag['package']==ig['package'] and ag['status']=='passed-original-package-verification'
receipt=read(old/'penguintrack/packages/signing-receipt.json');assert sha((old/'penguintrack/packages/signing-receipt.json').read_bytes())==ig['signingReceiptSha256']
oldapk=Path('/dev/shm/racing-review-arcade/android-v3-monitor/production-44606071748-'+OLD+'/packages/penguintrack/penguintrack-0.1.0.apk');data=oldapk.read_bytes()
assert len(data)==2342332 and sha(data)==ig['package']['sha256']=='e1f9aa255413819bda917543c2d2258dd685a8eff61f982f26a98dfcfc827827'
otree=read(old/'penguintrack/git-tree.json');oe=next(x for x in otree['tree'] if x['path']=='packages/penguintrack/penguintrack-0.1.0.apk');assert oe['sha']==blob(data) and oe['size']==len(data)
om=read(old/'penguintrack/export-manifest.json');assert om['files']['packages/penguintrack/penguintrack-0.1.0.apk']=={'bytes':len(data),'sha256':sha(data)}
with zipfile.ZipFile(oldapk) as z:
 assert z.testzip() is None
 actual={x.filename:sha(z.read(x)) for x in z.infolist() if not x.is_dir() and not x.filename.startswith('META-INF/')}
 assert actual==receipt['contentSha256']
 payload_count=sum(x.startswith('assets/') for x in actual);assert payload_count==156
 # All direct dist assets remain byte-identical; host-generated controller and index assets are covered by the receipt.
 direct=[]
 for p in sorted((G/'dist').rglob('*')):
  if p.is_file():
   name='assets/'+p.relative_to(G/'dist').as_posix();assert actual[name]==sha(p.read_bytes());direct.append(name)
link(oldapk,G/'penguintrack-0.1.0.apk')
source_checks=[];modes=[]
def get(obj,path):
 for key in path.split('.'):obj=obj[key]
 return obj
for mode in ['normal','occupied']:
 b=base/('penguintrack-'+mode);r=read(b/'report.json');assert r['status']=='passed' and len(r['tests'])==56 and all(t['status']=='passed' for t in r['tests'])
 assert r['sourceCommit']==QA and r['apk']['sha256']==sha(data) and r['apk']['bytes']==len(data)
 assert r['modelWrites'] is False and r['clockOverrides'] is False and r['physicalTvTested'] is False
 assert 'storageRestart' not in r
 for name,meta in r['sourceFiles'].items():
  original=(b/'source'/name).read_bytes();fixed=subprocess.check_output(['git','show',QA+':'+name],cwd=ROOT,env={**os.environ,'GIT_NO_LAZY_FETCH':'1'})
  assert original==fixed and meta=={'bytes':len(original),'sha256':sha(original)};source_checks.append({'mode':mode,'path':name,**meta})
 plan=read(b/'source/joystick-games/penguintrack/qa-plan.json');assert len(plan['steps'])==18
 snapshots={x['label']:x for x in r['snapshots']};observed=[]
 for step in plan['steps']:
  before=snapshots['before-plan-'+step['name']]['snapshot']['game'];after=snapshots['after-plan-'+step['name']]['snapshot']['game'];checks=[]
  for pred in step['expect']:
   v=get(after,pred['path']);op=pred['op'];want=pred.get('value');prev=get(before,pred['path'])
   passed={'eq':lambda:v==want,'gt':lambda:v>want,'lt':lambda:v<want,'changed':lambda:v!=prev}[op]();assert passed,(mode,step['name'],pred)
   checks.append({'predicate':pred,'before':prev,'after':v})
  observed.append({'step':step['name'],'checks':checks})
 assert [x['name'] for x in r['tests'] if x['name'].startswith('actual SDK gameplay: ')]==['actual SDK gameplay: '+x['name'] for x in plan['steps']]
 wire=[json.loads(x) for x in (b/'wire.jsonl').read_text().splitlines()];busy=[x for x in wire if x['direction']=='game-to-sdk' and x['message'].get('type')=='error'];assert len(busy)==1 and busy[0]['message']['message']=='controller_busy';busyconn=busy[0]['connection']
 sent=[x for x in wire if x['direction']=='sdk-to-game' and x['connection']!=busyconn];acks=[x for x in wire if x['direction']=='game-to-sdk' and x['message'].get('type')=='ack'];sk=collections.Counter((x['connection'],x['message']['seq']) for x in sent);ak=collections.Counter((x['connection'],x['message']['seq']) for x in acks);assert sk==ak and all(x==1 for x in sk.values());assert len(sent)==(602 if mode=='normal' else 598)
 tap=r['menuTapObservations'];assert len(tap)==1;tap=tap[0];assert tap['key']=='DOWN' and tap['status']=='passed' and tap['stableFreshSamples']==2 and tap['wire']['matchingAcks']==2 and tap['reloadBasis'] is None
 pair=[x for x in sent if x['message']['seq'] in (tap['downSequence'],tap['releaseSequence']) and x['connection']==tap['wire']['connection']];assert len(pair)==2;down,up=pair;assert down['message']['pressed'] is True and up['message']['pressed'] is False and down['message']['key']==up['message']['key']=='DOWN';ms=(up['monotonic']-down['monotonic'])*1000;assert abs(ms-tap['wire']['observedWireHeldMs'])<0.000001 and 0<ms<100
 captures=[]
 for c in r['captures']:
  raw=(b/c['path']).read_bytes();assert len(raw)==c['bytes'] and sha(raw)==c['sha256'];assert raw[:8]==b'\x89PNG\r\n\x1a\n';w,h=struct.unpack('>II',raw[16:24]);assert (w,h)==(1920,1080)
  captures.append({k:c[k] for k in ['path','bytes','sha256']});captures[-1].update(width=w,height=h)
 assert len(captures)==7
 video=(b/r['video']['path']).read_bytes();assert len(video)==r['video']['bytes'] and sha(video)==r['video']['sha256']
 modes.append({'mode':mode,'tests':56,'allPassed':True,'testsInOriginalOrder':[x['name'] for x in r['tests']],'originalPlanPredicatesRechecked':observed,'controllerId':tap['wire']['controllerId'],'defaultPortOccupied':r['defaultPortOccupiedFixture'],'sdkMessages':len(sent),'uniqueAcks':len(acks),'busyRejectedMessages':sum(x['direction']=='sdk-to-game' and x['connection']==busyconn for x in wire),'downWireHeldMs':ms,'menuTap':tap,'captures':captures,'video':r['video'],'firstObservedWallTime':r['snapshots'][0]['wallTime'],'lastObservedWallTime':r['snapshots'][-1]['wallTime'],'finishedAt':r['finishedAt'],'storageRestartExecuted':False})
result={'status':'passed-delivery-evidence-audit','scope':'Recheck immutable exported bytes, actual original ordered reports/predicates and wire, reused signed APK identity/payload, and existing package certificate/source audit; no new native execution or rebuild.','qaRunId':44634808045,'qaSourceCommit':QA,'qaRunAttempt':1,'qaExportCommit':EXP,'packageSourceCommit':SRC,'packageBuildRunId':44606071748,'packageBuildAttempt':1,'packageExportCommit':OLD,'package':ig['package'],'apkGitBlob':blob(data),'originalPackageAudit':str((old/'report.json').relative_to(G)),'originalPackageAuditSha256':sha((old/'report.json').read_bytes()),'originalCertificateAuditReused':True,'newCertificateToolInvocation':False,'signedContentEntriesRechecked':len(actual),'assetsRechecked':payload_count,'currentDirectDistAssetsRechecked':len(direct),'sourceInputsOriginalAudit':442,'unchangedProductionInputsRuntimePreflight':422,'exportFiles':verified,'runtimeSourceChecks':source_checks,'modes':modes,'storagePersistenceScenarioTested':False,'fullCareerCompleted':False,'physicalTvTested':False,'physicalEsp32Tested':False,'oldFailuresPreserved':True}
save(D/'verification.json',result)
print(json.dumps({'files':len(verified),'bytes':sum(x['bytes'] for x in verified),'sourceChecks':len(source_checks),'signedContent':len(actual),'directDist':len(direct),'modes':[(x['mode'],x['tests'],x['uniqueAcks']) for x in modes]}))
