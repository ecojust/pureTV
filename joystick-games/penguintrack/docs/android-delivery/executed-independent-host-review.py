from pathlib import Path
import json,hashlib,re,collections,datetime
root=Path('/dev/shm/puretv-submit'); game=root/'joystick-games/penguintrack'; docs=game/'docs/android-delivery'
read=lambda p:json.loads(p.read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
f=read(docs/'freeze.json'); assert sha((docs/'freeze.json').read_bytes())=='7fc90e926f984eea6776d8f1b797f51cda75118e28ad17b5d503830cd078e7ea'
files={x['path']:x for x in f['files']}; checked=[]
def bind(p):
 data=p.read_bytes(); rel=p.relative_to(root).as_posix(); r=files[rel]; assert len(data)==r['bytes'] and sha(data)==r['sha256'];checked.append(r);return data
for name in ['README.md','packages.json','SHA256SUMS.txt','android-release.json']:bind(game/name)
for name in ['previous-README.md','previous-packages.json','previous-SHA256SUMS.txt','verification.json','delivery-validation.json','README.md','visual-review.json','video-review/verification.json']:bind(docs/name)
pkg=read(game/'packages.json'); old=read(docs/'previous-packages.json'); release=read(game/'android-release.json'); verify=read(docs/'verification.json')
assert {k:v for k,v in pkg.items() if k!='android'}=={k:v for k,v in old.items() if k!='android'}
assert all(release[k]==v for k,v in pkg['android'].items())
a=pkg['android'];assert a['storagePersistenceScenarioTested'] is False and a['savedPreferenceObserved'] is True
assert a['sourceCommit']==verify['packageSourceCommit'] and a['qaSourceCommit']==verify['qaSourceCommit'] and a['qaRunId']==verify['qaRunId']==44634808045 and a['qaRunAttempt']==verify['qaRunAttempt']==1
assert a['buildRunId']==verify['packageBuildRunId']==44606071748 and a['exportCommit']==verify['packageExportCommit'] and a['qaExportCommit']==verify['qaExportCommit']
assert all(a[k]==verify['package'][k] for k in ['bytes','sha256','packageName','versionName','versionCode','certificateSha256'])
assert (game/a['file']).is_file() and (game/a['file']).stat().st_size==a['bytes']==2342332
oldsum=(docs/'previous-SHA256SUMS.txt').read_text();newsum=(game/'SHA256SUMS.txt').read_text();assert newsum==oldsum+f"{a['sha256']}  {a['file']}\n"
oldreadme=(docs/'previous-README.md').read_text();newreadme=(game/'README.md').read_text();assert oldreadme.split('## Windows 下载',1)[1].split('macOS、Windows 安装包及各自验证范围见上方',1)[0]==newreadme.split('## Windows 下载',1)[1].split('Android、macOS、Windows 安装包及各自验证范围见上方',1)[0]
exportrecords={x['path']:x for x in verify['exportFiles']}
def bind_original(p):
 b=bind(p); rel=p.relative_to(docs/'original-export').as_posix();r=exportrecords[rel];assert r['bytes']==len(b) and r['sha256']==sha(b);assert r['gitBlob']==hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest();return json.loads(b)
mode_results=[]
for mode,count in [('normal',602),('occupied',598)]:
 base=docs/f'original-export/evidence/joystick-android-runtime-penguintrack/penguintrack-{mode}'
 r=bind_original(base/'report.json');plan=bind_original(base/'source/joystick-games/penguintrack/qa-plan.json'); wbytes=bind(base/'wire.jsonl');wr=exportrecords[(base/'wire.jsonl').relative_to(docs/'original-export').as_posix()];assert len(wbytes)==wr['bytes'] and sha(wbytes)==wr['sha256']
 assert r['status']=='passed' and r['sourceCommit']==a['qaSourceCommit'];assert len(r['tests'])==56 and all(t['status']=='passed' for t in r['tests']);assert r['apk']['bytes']==a['bytes'] and r['apk']['sha256']==a['sha256'];assert r['modelWrites'] is False and r['clockOverrides'] is False
 assert r['defaultPortOccupiedFixture']==(mode=='occupied');assert r['controllerService']['port']==(63485 if mode=='normal' else 41323)
 steps=plan['steps'];assert len(steps)==18; snapshots={s['label']:s['snapshot']['game'] for s in r['snapshots'] if s['label'].startswith(('before-plan-','after-plan-'))}
 def at(d,path):
  for part in path.split('.'): d=d[part]
  return d
 for i,s in enumerate(steps):
  t=r['tests'][i+3];assert t['name']=='actual SDK gameplay: '+s['name'] and t['details']['expect']==s['expect'];b=snapshots['before-plan-'+s['name']];end=snapshots['after-plan-'+s['name']]
  for pred in s['expect']:
   before=at(b,pred['path']);after=at(end,pred['path']);op=pred['op'];assert op in ('eq','gt','lt','changed')
   ok=(after!=before) if op=='changed' else (after==pred['value'] if op=='eq' else after>pred['value'] if op=='gt' else after<pred['value']);assert ok,(mode,s['name'],pred)
 lines=[json.loads(l) for l in wbytes.splitlines()];messages=[l for l in lines if l['direction']=='sdk-to-game'];replies=[l for l in lines if l['direction']=='game-to-sdk'];busy=[l for l in replies if l['message'].get('type')=='error'];assert len(busy)==1 and busy[0]['message']['message']=='controller_busy';rejected={l['connection'] for l in busy};accepted=[l for l in messages if l['connection'] not in rejected];ack=collections.Counter((l['connection'],l['message']['seq']) for l in replies if l['message']['type']=='ack');assert len(accepted)==len(ack)==count and len(messages)-len(accepted)==10
 assert len(set((l['connection'],l['message']['seq']) for l in accepted))==count and all(ack[(l['connection'],l['message']['seq'])]==1 for l in accepted)
 assert r['wire']['acceptedSdkMessages']==r['wire']['matchingAcks']==count and not r['wire']['errors'];assert not any('storageRestart' in k for k in r)
 tap=r['menuTapObservations'];assert len(tap)==1 and tap[0]['name']==steps[1]['name'] and tap[0]['stableFreshSamples']==2
 mode_results.append({'mode':mode,'originalStatus':r['status'],'checks':len(r['tests']),'originalPlanStepsIndependentlyRecomputed':len(steps),'acceptedSdkMessagesAndUniqueAcks':count,'busyRejectedMessages':10,'port':r['controllerService']['port'],'storageRestartExecuted':False,'originalReportSha256':sha((base/'report.json').read_bytes())})
links=[]
for path in [game/'README.md',docs/'README.md']:
 for value in re.findall(r'\[[^\]]*\]\(([^)]+)\)',path.read_text()):
  if value.startswith(('https:','http:','#')):continue
  target=(path.parent/value.split('#',1)[0]).resolve();assert target.exists(),target;links.append({'file':path.relative_to(root).as_posix(),'target':value})
review={'status':'passed-independent-delivery-metadata-review','reviewer':'racing_windows_host','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'freeze':{'path':(docs/'freeze.json').relative_to(root).as_posix(),'sha256':sha((docs/'freeze.json').read_bytes()),'files':f['fileCount']},'scope':'Read-only cross-check of delivery metadata, original reports/plan predicates and small wire evidence. No new native run, package-content audit, package rehash, image/video viewing, signing or publishing. Original full package and visual audits remain their authors results.','reviewedFiles':checked,'previousMacosAndWindowsObjectsUnchanged':True,'previousFourChecksumLinesUnchanged':True,'previousWindowsAndMacosReadmeSectionsUnchanged':True,'packageIdentityMatchesReleaseAndOriginalAuditSummary':True,'apkStatBytes':a['bytes'],'originalModes':mode_results,'localLinksVerified':links,'preservedLimitations':['Android API 26+, WebGL2; original emulator results only; no physical TV or ESP32 validation.','Natural preference save observed; no app-restart storage scenario executed or claimed, despite plan declaring storageRestartRequired.','Original Brake button partly overlaps speedometer, bottom control hints intersect touch controls.','1920x1080 original PNG with 960x540 CSS; no new 1280 CSS Android test.','Videos cover only first ~180 seconds; later busy/focus/disconnect/reconnect validated by original reports/PNGs, not those videos.','Original failure records retained; no full-career completion claim.'],'blockers':[]}
out=docs/'metadata-independent-host-review.json';assert not out.exists();out.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'sha256':sha(out.read_bytes()),'reviewedFiles':len(checked),'links':len(links),'modes':mode_results},ensure_ascii=False,indent=2))
