from pathlib import Path
import collections,hashlib,json,os,struct,subprocess
ROOT=Path(__file__).parent
REPO=Path('/dev/shm/puretv-submit')
OUT=REPO/'joystick-games/backroad-rally/docs/android-graphics-diagnostic-44642922231'
ORIG=OUT/'original-small-export'
DIAG=ORIG/'evidence/backroad-original-apk-graphics-diagnostic/graphics-diagnostic'
SOURCE='0415846f3b3e3fc11f79e08d25050affdf750435'
GAME='4b6cf0b8cba288eae66bcae2ef2784acc279a695'
def read(p):return json.loads(p.read_bytes())
def digest(data):return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def record(p):return digest(p.read_bytes())
def lines(p):return [json.loads(s) for s in p.read_text().splitlines()]
def write(name,value):(OUT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
r=read(DIAG/'report.json');f=read(DIAG/'final-graphics.json');c=read(DIAG/'final-console.json')
verification=read(OUT/'original-small-export-verification.json')
assert r['sourceCommit']==SOURCE and r['status']=='failed' and r['formalAcceptance'] is False
assert r['originalTarget']['sourceSha']==GAME and r['originalTarget']['sha256']=='2cd35f145f5362264a720708325c22e283a3828d21899058f17422ba87103c08'
assert r['originalObserver']['verified'] and not r['originalObserver']['installed'] and not r['originalObserver']['started']
source_matches={}
for path,expected in r['sourceFiles'].items():
 data=(DIAG/'executed-source'/path).read_bytes()
 assert digest(data)==expected
 original=subprocess.run(['git','show',SOURCE+':'+path],cwd=REPO,capture_output=True,check=True).stdout
 assert original==data
 source_matches['runtime/'+path]=expected
for p in sorted((ORIG/'export-source').rglob('*')):
 if not p.is_file():continue
 path=p.relative_to(ORIG/'export-source').as_posix();data=p.read_bytes()
 original=subprocess.run(['git','show',SOURCE+':'+path],cwd=REPO,capture_output=True,check=True).stdout
 assert original==data
 source_matches['export/'+path]=digest(data)
assert len(r['sourceFiles'])==22 and len(source_matches)==26
plan_data=(DIAG/'original-qa-plan.json').read_bytes();plan=json.loads(plan_data)
assert hashlib.sha256(plan_data).hexdigest()==r['planSubset']['originalPlanSha256']
assert subprocess.run(['git','show',GAME+':joystick-games/backroad-rally/qa-plan.json'],cwd=REPO,capture_output=True,check=True).stdout==plan_data
steps=r['steps'];assert len(steps)==30 and [s['originalIndex'] for s in steps]==list(range(1,21))+list(range(24,34))
assert [s['status'] for s in steps]==['observed']*29+['failed']
def value_at(obj,path):
 for part in path.split('.'):obj=obj[part]
 return obj
for s in steps:
 assert s['step']==plan['steps'][s['originalIndex']-1]
 if s['status']!='observed':continue
 assert s['subsequentFreshPolls']>=2
 after=s['after']['cachedGame'];before=s['before']['cachedGame']
 assert after['pollCount']>before['pollCount']
 assert all(e['op']=='eq' and value_at(after,e['path'])==e['value'] for e in s['step']['expect'])
 assert not any(after['controller']['buttons'].values())
 owner=next(x for x in after['controller']['players'] if x['controllerId']==r['sdkIdentity']['controllerId'])
 assert owner['session']==r['sdkIdentity']['session'] and not any(owner['buttons'].values())
wire=lines(DIAG/'wire.jsonl');sent=[x for x in wire if x['direction']=='sdk-to-game'];replies=[x for x in wire if x['direction']=='game-to-sdk']
counts=collections.Counter((x['connection'],x['message'].get('seq')) for x in replies if x['message'].get('type')=='ack')
assert len(sent)==len(replies)==133 and len(counts)==133 and all(v==1 for v in counts.values())
assert all(counts[(x['connection'],x['message']['seq'])]==1 for x in sent)
for s in steps:
 w=s['wire']
 for seq in [w['downSequence'],w['releaseSequence']]:assert counts[(w['connection'],seq)]==1
 assert w['controllerId']==r['sdkIdentity']['controllerId'] and w['matchingAcks']==2
http=lines(DIAG/'observer-http.jsonl');failed=[x for x in http if x['status']=='failed']
assert len(failed)==38 and all(x['errorType']=='RemoteDisconnected' for x in failed)
assert c['consoleAttachedBeforeLoad'] is True and c['events'][0]['kind']=='console-attached'
adb=lines(DIAG/'adb-commands.jsonl');installs=[x for x in adb if x['command'][0]=='install'];hashes=[x for x in adb if x['command'][:2]==['shell','sha256sum']]
assert len(installs)==len(hashes)==2 and all(x['exitCode']==0 and 'Success' in x['stdout'] for x in installs)
assert hashes[0]['stdout'].split()[0]==r['originalTarget']['sha256']
assert hashes[1]['stdout'].split()[0]==r['graphicsObserver']['apkIdentity']['sha256']
comments={
'initial-menu.png':'Actually viewed: title menu with career focused, disconnected pureTV card and background loading text; no driving.',
'original-low-settings.png':'Actually viewed: original graphics quality Low selected; connected ID virtual-1cd1835535c3 wraps across two lines but remains readable; original settings are visible.',
'final-system-screen.png':'Actually viewed: harjunkulma/Finland stage introduction with loading text and connected controller card; no visible car/road and no racing HUD. This is an intro/loading screen, not the earlier v7 playing black-frame reproduction.'}
visual=[]
for name,comment in comments.items():
 p=DIAG/name;data=p.read_bytes();assert data.startswith(b'\x89PNG\r\n\x1a\n')
 width,height=struct.unpack('>II',data[16:24]);assert (width,height)==(1920,1080)
 if name=='final-system-screen.png':assert record(p)==r['finalSystemScreenshot']['output']
 else:assert record(p)==next(x['screenshot'] for x in r['captures'] if x['name']+'.png'==name)
 visual.append({'path':p.relative_to(OUT).as_posix(),**record(p),'width':width,'height':height,'actuallyViewed':True,'observation':comment})
write('findings.json',{
'schemaVersion':1,'sourceSha':SOURCE,'runId':44642922231,'attempt':1,'workflow':'.github/workflows/joystick-backroad-graphics-diagnostic.yml','exportCommit':verification['exportCommit'],'status':'failed-original-diagnostic-preserved',
'originalEvidence':{'files':verification['files'],'bytes':verification['bytes'],'manifestSha256':verification['manifestSha256'],'fullJobLog':record(OUT/'original-diagnostic-job.log')},
'jobs':{'observer':{'id':135978258550,'conclusion':'success'},'diagnostic':{'id':135979441262,'conclusion':'failure'},'export':{'id':135982645872,'conclusion':'success'}},
'originalGameUnchanged':{'identity':r['originalTarget'],'inputVerification':r['originalInputVerification'],'installedBaseHashVerifiedFromOriginalAdbLog':True,'installDurationSeconds':installs[0]['endedAt']-installs[0]['startedAt'],'noTargetRebuildOrResign':True},
'separateObserver':{'identity':r['graphicsObserver']['apkIdentity'],'unsignedIdentity':r['graphicsObserver']['unsignedApkIdentity'],'installedBaseHashVerifiedFromOriginalAdbLog':True,'installDurationSeconds':installs[1]['endedAt']-installs[1]['startedAt'],'originalObserver':r['originalObserver']},
'lifecycleResult':{'attachedBeforeLoad':True,'events':c['events'],'firstEventDescription':'New console hook attached after target Activity.onCreate returned and before target started/resumed; original v1 no-WebView failure is not repeated.','doesNotEstablishGraphicsRootCause':True},
'reached':{'selectedOriginalSteps':30,'observedSteps':29,'failedStepOriginalIndex':33,'failedStepName':steps[-1]['step']['name'],'originalStepTimeoutSeconds':240,'failureType':r['errorType'],'failure':r['error'],'failedStepWire':steps[-1]['wire'],'samples':steps[-1]['samples'],'finalUrl':f['url'],'finalCachedGame':f['cachedGame'],'racingPhaseReached':False,'threeOriginalImagesActuallyViewed':True},
'originalPredicatesRecomputed':{'observedStepExactOriginalPlan':29,'all30StepDeclarationsMatchOriginalPlan':True,'afterStateEqPredicates':True,'twoSubsequentFreshPolls':True,'sameControllerSessionAndAllButtonsReleased':True},
'wireIndependentRecalculation':{'sdkMessages':len(sent),'hostReplies':len(replies),'uniqueExactConnectionSeqAcks':len(counts),'everySdkMessageExactlyOneAck':True,'observedMenuSteps':29,'failedNavigationPulseAcked':True,'reportedSummary':r['finalWireSummary']},
'observationTransport':{'totalRequests':len(http),'failedGraphicsRequests':len(failed),'errorTypes':{'RemoteDisconnected':38},'finalFailedRequest':failed[-1],'finalFailedRequestDurationSeconds':failed[-1]['endedAt']-failed[-1]['startedAt'],'subsequentFreshFinalGraphicsSucceeded':True,'finalGraphicsHttp':next(x for x in http if x.get('savedAs')=='final-graphics.json'),'originalFailurePreserved':True,'no240SecondDeadlineExhaustionClaim':True},
'domAndResourceObservation':{'canvasCount':f['canvasCount'],'canvases':f['canvases'],'resourceCount':f['resourceCount'],'responseStatuses':dict(collections.Counter(str(x.get('responseStatus')) for x in f['resourceTail'])),'gameErrors':f['cachedGame']['errors'],'contextCallsMade':False,'conclusion':'Final center stack contains original intro/loading overlay; game is intro/ready=false, not running. No shader/context-loss console event was recorded. This does not establish or exclude the earlier playing-frame cause.'},
'executedSourceMatchesFrozenCommit':{'runtimeDeclared':22,'runtimeRecovered':22,'exportCopies':4,'all26CopiesMatch0415846f':True,'hiddenRuntimeWorkflowNowPresent':True,'files':source_matches},
'visualReview':visual,'formalAcceptance':False,'visualAcceptance':False,'visualDeliveryBlockRemains':True,'physicalTvTested':False,'physicalPhoneTested':False,'largeApkDownloadedLocally':False,'newDispatchPerformed':False,'originalArtifactsOrReportsModified':False
})
files={p.relative_to(OUT).as_posix():record(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name!='inventory.json'}
write('inventory.json',{'schemaVersion':1,'scope':'Read-only Backroad graphics diagnostic v2 originals, immutable blob verification, original dispatch markers and independent actual-image review; no game/QA mutation or new dispatch.','files':files})
print(json.dumps({'archive':str(OUT),'filesIncludingInventory':len(files)+1,'bytesIncludingInventory':sum(x['bytes'] for x in files.values())+(OUT/'inventory.json').stat().st_size,'findings':record(OUT/'findings.json'),'inventory':record(OUT/'inventory.json'),'sourceCopies':len(source_matches),'ackPairs':len(counts)},indent=2))
