#!/usr/bin/env python3
"""Stage signed bundles with exact Android or explicitly scoped Used browser evidence."""
import argparse,copy,hashlib,json,re,shutil,subprocess,zipfile
from pathlib import Path

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text())
def write(p,value):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def android_environment(case_dir):
 properties=read(case_dir.parent/'report.json')['androidProperties']
 values=dict(re.findall(r'^\[([^\]]+)\]: \[([^\]]*)\]$',properties,re.MULTILINE))
 return {'apiLevel':int(values['ro.build.version.sdk']),'androidRelease':values['ro.build.version.release'],'supportedAbis':values['ro.product.cpu.abilist'],'physicalDevice':False}
def preserve(src,dst):
 dst.parent.mkdir(parents=True,exist_ok=True)
 if dst.exists():assert dst.read_bytes()==src.read_bytes(),str(dst)
 else:shutil.copy2(src,dst)
USED_MODE='browser_verified_android_environment_blocked'
ANDROID_MODE='complete_android_acceptance'
def repo_path(root,name):
 assert isinstance(name,str) and name and not Path(name).is_absolute() and '..' not in Path(name).parts
 path=root/name;assert path.resolve().is_relative_to(root.resolve());return path
def verify_sources(root,driver,qa_sha,evidence=None):
 assert re.fullmatch('[a-f0-9]{40}',qa_sha)
 assert driver['modelWrites'] is False and driver['clockOverrides'] is False
 for name,expected in driver['sourceHashes'].items():
  data=subprocess.check_output(['git','show',qa_sha+':'+name],cwd=root)
  assert hashlib.sha256(data).hexdigest()==expected,name
  if evidence:assert digest(evidence/('executed-'+Path(name).name))==expected,name
def browser_evidence(root,chosen):
 info=chosen['browserEvidence'];directory=repo_path(root,info['directory'])
 assert info['qaSourceSha']=='3b6d2ad6b3628e1c0aa3eb78d9d0dae4138adcbe'
 driver=read(directory/'report.json')
 assert driver['slug']=='used-car-racing' and driver['status']=='passed' and driver['mode']=='browser'
 assert driver['scope']=='complete controller acceptance' and driver['androidAppTested'] is False and driver['syntheticNativeBridge'] is True
 assert driver['browserVideoRequested'] is True and len(driver['tests'])==9 and all(t['status']=='passed' for t in driver['tests'])
 assert not driver['transportErrors'] and not driver['pageErrors']
 verify_sources(root,driver,info['qaSourceSha'],directory)
 inputs=read(repo_path(root,info['inputs']));receipt_path=repo_path(root,info['signingReceipt']);receipt=read(receipt_path)
 assert digest(receipt_path)==inputs['signingReceiptSha256'] and receipt['sourceSha']==inputs['artifactSourceSha']=='ed925cc1839da4629991ecf46fc2f625821322ce'
 apk=root/'resource/apps/used-car-racing/used-car-racing-0.1.4.apk'
 assert digest(apk)==inputs['apkSha256']==receipt['sha256']=='7c7340342928905e6b8d8e0fe443376955b43d24437825536c249f54d18a2756'
 rows={r['file']:r for r in inputs['assets']};assert len(rows)==len(inputs['assets'])==39
 assert set(rows)==set(driver['assetHashes'])
 with zipfile.ZipFile(apk) as archive:
  names={n.removeprefix('assets/') for n in archive.namelist() if n.startswith('assets/') and not n.endswith('/')}
  assert names==set(rows)
  for name,row in rows.items():
   data=archive.read('assets/'+name)
   assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256']==driver['assetHashes'][name]
 video=repo_path(root,info['video']);video_verification=read(repo_path(root,info['videoVerification']))
 assert video.parent==directory and video.name==video_verification['file']=='gameplay.mp4'
 assert digest(video)==video_verification['sha256'] and video.stat().st_size==video_verification['bytes']
 assert video_verification['reportSha256']==digest(directory/'report.json')
 assert video_verification['sourceApkSha256']==inputs['apkSha256'] and video_verification['artifactSourceSha']==inputs['artifactSourceSha']
 assert video_verification['normalInputsOnly'] is True and video_verification['modelWrites'] is False and video_verification['clockOverrides'] is False
 assert video_verification['syntheticNativeBridge'] is True and video_verification['androidAppTested'] is False and video_verification['fullDecodeVerified'] is True
 raw=video_verification['originalWebm'];webm=repo_path(directory,raw['file'])
 assert digest(webm)==raw['sha256'] and webm.stat().st_size==raw['bytes'] and raw['fullDecodeVerified'] is True
 return {'directory':directory,'driver':driver,'inputs':inputs,'receipt':receipt,'video':video,'videoVerification':video_verification,'selection':info}
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--runtime',type=Path,action='append',required=True);p.add_argument('--selection',type=Path,required=True);p.add_argument('--legacy',type=Path,required=True);a=p.parse_args();root=a.root
rollout=read(root/'docs/readme-controller-support/rollout.json');selection=read(a.selection)
assert len(rollout['games'])==len({g['id'] for g in rollout['games']})==20
assert set(selection['games'])=={g['id'] for g in rollout['games']}
exports={};runtime_roots={}
for source in a.runtime:
 export=read(source/'export-manifest.json');run_id=str(export['runId']);assert run_id not in exports
 assert export['runtimeResult'] in ('success','failure')
 for name,record in export['files'].items():
  assert not Path(name).is_absolute() and '..' not in Path(name).parts
  f=source/name;assert f.stat().st_size==record['bytes'] and digest(f)==record['sha256']
 dest=root/'resource/game-kit/docs/readme-controller-support/android'/run_id
 if not dest.exists():shutil.copytree(source,dest)
 else:
  assert (dest/'export-manifest.json').read_bytes()==(source/'export-manifest.json').read_bytes()
  for name,record in export['files'].items():assert digest(dest/name)==record['sha256']
 exports[run_id]=export;runtime_roots[run_id]=dest
results={};acceptance=[];browser_results={};media={}
for slug,chosen in selection['games'].items():
 mode=chosen.get('acceptanceMode',ANDROID_MODE)
 assert mode in [ANDROID_MODE,USED_MODE]
 assert (mode==USED_MODE)==(slug=='used-car-racing'), 'Only Used may have the explicit browser/environment-blocked acceptance mode'
 run_id=str(chosen['runId']);export=exports[run_id]
 assert chosen['group'].startswith('controller-runtime-') and '/' not in chosen['group'] and '..' not in chosen['group']
 group=runtime_roots[run_id]/'evidence'/chosen['group']
 report=read(group/'report.json');assert report['actualAndroidEmulator']
 source_manifest=read(group/'executed-source-manifest.json');assert source_manifest['qaSourceSha']==export['qaSourceSha']
 inputs=read(group/'input-verification.json');assert inputs['status']=='passed'
 identities={r['slug']:r for r in inputs['packages']}
 cases=[c for c in report['cases'] if c['slug']==slug];assert len(cases)==1;case=cases[0]
 assert case['inPlaceUpgradeInstalled']
 driver=read(group/slug/'gameplay/report.json');assert driver['mode']=='android' and driver['androidAppTested'] is True and driver['syntheticNativeBridge'] is False
 verify_sources(root,driver,export['qaSourceSha'])
 if mode==USED_MODE:
  assert run_id=='43740983538' and chosen['group']=='controller-runtime-retry-used-car' and export['qaSourceSha']=='3b6d2ad6b3628e1c0aa3eb78d9d0dae4138adcbe'
  assert export['runtimeResult']=='failure' and report['status']==case['status']==driver['status']=='failed'
  assert len(driver['tests'])==4 and [t['status'] for t in driver['tests']]==['passed','passed','passed','failed']
  assert [t['name'] for t in driver['tests'][:3]]==['menu layout and service address','official hello and nine sync messages leave menu unchanged','START begins actual game']
  assert driver['tests'][3]['name']=='direction and game-specific action affect actual model' and 'fetch failed' in driver['tests'][3]['error']
  assert 'RenderThread' in (group/'host-diagnostics/kernel-after.txt').read_text() and 'segfault' in (group/'host-diagnostics/kernel-after.txt').read_text()
  browser=browser_evidence(root,chosen);assert browser['driver']['sourceHashes']==driver['sourceHashes'];browser_results[slug]=browser
  media[slug]={'menu':group/slug/'gameplay/menu-android.png','gameplay':browser['directory']/'gameplay.png','video':browser['video'],'environment':'Desktop Chromium browser','syntheticNativeBridge':True,'originalRecording':browser['videoVerification']}
 else:
  assert case['status']==driver['status']=='passed' and driver['scope']=='complete controller acceptance'
  media[slug]={'menu':group/slug/'gameplay/menu-android.png','gameplay':group/slug/'gameplay/gameplay.png','video':group/slug/'gameplay.mp4','environment':'Android TV emulator','syntheticNativeBridge':False,'originalRecording':case['recording']}
 results[slug]=(group/slug,case,driver,identities[slug])
 row={'game':slug,'acceptanceMode':mode,'status':USED_MODE if mode==USED_MODE else 'passed','runtimeRunId':run_id,'qaSourceSha':export['qaSourceSha'],'sourceWorkflowResult':export['runtimeResult'],'sourceGroupResult':report['status'],'caseStatus':case['status'],'androidControllerAcceptancePassed':mode==ANDROID_MODE,'androidControllerAcceptanceComplete':mode==ANDROID_MODE,'officialSdkAndroidTestsPassed':sum(t['status']=='passed' for t in driver['tests']),'completeControllerTests':len(driver['tests']) if mode==ANDROID_MODE else None,'originalCase':(group/slug/'case.json').relative_to(root).as_posix(),'caseSha256':digest(group/slug/'case.json'),'originalDriverReport':(group/slug/'gameplay/report.json').relative_to(root).as_posix(),'driverReportSha256':digest(group/slug/'gameplay/report.json'),'selectionReason':chosen['reason']}
 if mode==USED_MODE:row.update(officialSdkBrowserTestsPassed=9,browserControllerAcceptanceComplete=True,originalBrowserReport=(browser['directory']/'report.json').relative_to(root).as_posix(),browserReportSha256=digest(browser['directory']/'report.json'),browserQaSourceSha=browser['selection']['qaSourceSha'])
 acceptance.append(row)
assert set(results)=={g['id'] for g in rollout['games']}
# Validate every deliverable before changing any current application metadata.
video_probes={}
for g in rollout['games']:
 app=root/'resource/apps'/g['id'];old=read(app/'resource.json')
 assert old['version']==g['previousVersion']
 receipt=read((a.legacy/'packages'/g['id'] if g['host']=='legacy' else app/'docs/releases'/g['version'])/'signing-receipt.json')
 case_dir,case,driver,binding=results[g['id']];identity=binding['package']
 assert receipt['sourceSha']==binding['artifactSourceSha']==case['artifactSourceSha']
 assert case['observerSourceSha']==binding['observerSourceSha'] and case['observerSha256']==binding['observerSha256']
 baseline=app/'docs/controller-update-baseline'/g['previousVersion']
 assert (baseline/'resource.json').read_bytes()==(app/'resource.json').read_bytes()
 assert (baseline/'thumb.png').read_bytes()==(app/'thumb.png').read_bytes()
 assert digest(app/old['apk'])==old['sha256']
 assert identity['versionName']==g['version'] and identity['versionCode']==g['versionCode'] and identity['packageName']==g['packageName']
 assert digest(app/g['apk'])==receipt['sha256']==identity['sha256']==case['packageSha256']
 assert identity['certificateSha256']==old['certificateSha256']
 if g['id'] in browser_results:
  browser=browser_results[g['id']]
  assert browser['inputs']['artifactSourceSha']==receipt['sourceSha'] and browser['inputs']['apkSha256']==identity['sha256']
  assert browser['receipt']['certificateSha256']==identity['certificateSha256']
 else:
  assert len(driver['tests'])==(8 if g['host']=='game-kit' or g['id']=='alien-shooter' else 9)
  assert all(t['status']=='passed' for t in driver['tests'])
 captures=media[g['id']]
 for capture in ('menu','gameplay'):
  assert captures[capture].read_bytes().startswith(bytes.fromhex('89504e470d0a1a0a'))
 video=captures['video'];assert digest(video)==captures['originalRecording']['sha256']
 assert 0<video.stat().st_size<10_000_000, 'Stage an oversized video separately before updating any metadata: '+str(video)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)],text=True))
 stream=next(x for x in probe['streams'] if x['codec_type']=='video')
 assert stream['codec_name']=='h264' and stream['pix_fmt']=='yuv420p' and float(probe['format']['duration'])>0
 subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(video),'-f','null','-'],check=True)
 video_probes[g['id']]=probe
progress=read(root/'resource/game-kit/progress.json');progress_by_id={g['id']:g for g in progress['games']}
for g in rollout['games']:
 slug=g['id'];export=exports[str(selection['games'][slug]['runId'])];app=root/'resource/apps'/slug;old=read(app/'resource.json');assert old['version']==g['previousVersion']
 dest=app/'docs/releases'/g['version'];dest.mkdir(parents=True,exist_ok=True)
 if g['host']=='legacy':
  package=a.legacy/'packages'/slug
  if (dest/'signing-receipt.json').exists() and (dest/'signing-receipt.json').read_bytes()!=(package/'signing-receipt.json').read_bytes():
   earlier=read(dest/'signing-receipt.json');archive=app/'docs/controller-update-attempts'/earlier['sourceSha']
   preserve(dest/'signing-receipt.json',archive/'signing-receipt.json')
   assert digest(app/g['apk'])==earlier['sha256']
   if (app/g['apk']).read_bytes()!=(package/g['apk']).read_bytes():preserve(app/g['apk'],archive/g['apk'])
   write(archive/'status.json',{'published':False,'sourceSha':earlier['sourceSha'],'signedCandidate':True,'actualGameplayTested':False,'supersededBySource':read(package/'signing-receipt.json')['sourceSha'],'reason':'Test observer manifest and disposable emulator installation configuration changed; game production files unchanged.'})
  shutil.copy2(package/g['apk'],app/g['apk']);shutil.copy2(package/'signing-receipt.json',dest/'signing-receipt.json')
 receipt=read(dest/'signing-receipt.json');identity=results[slug][3]['package'];case_dir,case,driver,binding=results[slug]
 apk=app/g['apk'];assert digest(apk)==case['packageSha256']==receipt['sha256']==identity['sha256']
 assert identity['versionName']==g['version'] and identity['versionCode']==g['versionCode'] and identity['packageName']==g['packageName']
 assert identity['certificateSha256']==old['certificateSha256']
 chosen_media=media[slug];is_browser=slug in browser_results
 video=chosen_media['video'];assert digest(video)==chosen_media['originalRecording']['sha256']
 published_video=dest/'gameplay.mp4'
 probe=video_probes[slug]
 preserve(video,published_video);command=chosen_media['originalRecording'].get('transcodeCommand') if is_browser else None
 published_recording={'file':'gameplay.mp4','bytes':published_video.stat().st_size,'sha256':digest(published_video),'fullDecodeVerified':True,'originalRepositoryPath':video.relative_to(root).as_posix(),'originalBytes':video.stat().st_size,'originalSha256':digest(video),'transcodeCommand':command,'durationSeconds':float(probe['format']['duration']),'codec':'h264','pixelFormat':'yuv420p','normalInputsOnly':True,'captureEnvironment':chosen_media['environment'],'syntheticNativeBridge':is_browser,'androidAppTested':not is_browser}
 if is_browser:published_recording.update(originalWebm=chosen_media['originalRecording']['originalWebm'],browserVideoVerification=selection['games'][slug]['browserEvidence']['videoVerification'])
 write(dest/'video-verification.json',published_recording)
 preserve(chosen_media['menu'],dest/'menu.png');preserve(chosen_media['gameplay'],dest/'gameplay.png')
 # New screenshot comes from the actual signed APK. The baseline thumbnail is archived separately.
 shutil.copy2(dest/'menu.png',app/'thumb.png')
 relative=case_dir.relative_to(root).as_posix()
 acceptance_driver=browser_results[slug]['driver'] if is_browser else driver
 verification={'status':USED_MODE if is_browser else 'passed','acceptanceMode':USED_MODE if is_browser else ANDROID_MODE,'game':slug,'version':g['version'],'artifactSourceSha':receipt['sourceSha'],'qaSourceSha':export['qaSourceSha'],'runtimeRun':'https://github.com/ecojust/pureTV/actions/runs/'+str(export['runId']),'apk':identity,'sourceAssetsMatchApk':True,'checkedSourceAssetFiles':binding['committedAssetFilesChecked'],'nativeSourceReceiptMatchesCommit':binding['nativeSourceReceiptMatchesCommit'],'signatureVerified':True,'inPlaceUpgradeInstalled':True,'previousRelease':{k:old[k] for k in ['version','versionCode','apk','sha256','certificateSha256']},'actualAndroidEmulator':True,'androidEnvironment':android_environment(case_dir),'androidControllerAcceptancePassed':not is_browser,'androidControllerAcceptanceComplete':not is_browser,'officialSdkAndroidTestsPassed':sum(t['status']=='passed' for t in driver['tests']),'officialSdkAndroidTests':[{'name':t['name'],'status':t['status']} for t in driver['tests']],'sourceWorkflowResult':export['runtimeResult'],'sourceGroupResult':read(case_dir.parent/'report.json')['status'],'officialSdkTestsPassed':len(acceptance_driver['tests']),'officialSdkTestEnvironment':chosen_media['environment'],'officialSdkTests':[{'name':t['name'],'status':t['status']} for t in acceptance_driver['tests']],'modelWrites':False,'clockOverrides':False,'originalEvidence':relative,'recording':published_recording,'originalRecording':chosen_media['originalRecording'],'captures':{n:{'file':n+'.png','sha256':digest(dest/(n+'.png')),'originalRepositoryPath':chosen_media[n].relative_to(root).as_posix(),'captureEnvironment':'Android TV emulator' if n=='menu' else chosen_media['environment'],'actualAndroidEmulator':n=='menu' or not is_browser,'syntheticNativeBridge':n=='gameplay' and is_browser} for n in ['menu','gameplay']},'physicalTvTested':False,'physicalPhoneTested':False,'physicalEsp32Tested':False}
 if is_browser:
  browser=browser_results[slug]
  verification.update(officialSdkBrowserTestsPassed=9,browserControllerAcceptanceComplete=True,browserQaSourceSha=browser['selection']['qaSourceSha'],browserEvidence=browser['selection'],browserReportSha256=digest(browser['directory']/'report.json'),browserAssetsMatchSignedApk=True,browserAssetFilesChecked=39,androidEnvironmentBlocker={'originalStatus':'failed','passedChecks':3,'failedCheck':driver['tests'][3]['name'],'error':driver['tests'][3]['error'],'hostEvidence':(case_dir.parent/'host-diagnostics/kernel-after.txt').relative_to(root).as_posix(),'reason':'Host RenderThread segmentation fault coincided with emulator loss while awaiting normal acceleration; no complete Android controller acceptance is claimed.'})
 write(dest/'verification.json',verification)
 write(dest/'gameplay.json',{'file':'gameplay.mp4','version':g['version'],'apkSha256':identity['sha256'],'sourceCommit':receipt['sourceSha'],'qaSourceSha':browser_results[slug]['selection']['qaSourceSha'] if is_browser else export['qaSourceSha'],'capture':'Desktop Chromium browser recording of APK-identical web assets using the production Java TCP receiver and original pureTV SDK; synthetic native bridge, not Android gameplay.' if is_browser else 'Android TV emulator screenrecord during original pureTV SDK and virtual-page inputs','androidEnvironment':None if is_browser else android_environment(case_dir),'androidAppTested':not is_browser,'syntheticNativeBridge':is_browser,'androidControllerAcceptancePassed':not is_browser,'normalInputsOnly':True,'modelWrites':False,'clockOverrides':False,'allLevelsCompletedInThisRecording':False,'recording':published_recording,'originalRecording':chosen_media['originalRecording'],'physicalTvTested':False,'physicalPhoneTested':False,'physicalEsp32Tested':False})
 previous=copy.deepcopy(old);previous.pop('previousReleases',None);previous['cover']='docs/controller-update-baseline/'+old['version']+'/thumb.png';previous['metadata']='docs/controller-update-baseline/'+old['version']+'/resource.json'
 new=copy.deepcopy(old)
 new.update(version=g['version'],versionCode=g['versionCode'],apk=g['apk'],apkBytes=identity['bytes'],sha256=identity['sha256'],sourceCommit=receipt['sourceSha'],buildRun='https://github.com/ecojust/pureTV/actions/runs/'+str(receipt.get('workflowRun',receipt.get('runId'))),cover='thumb.png',coverSource='Unmodified menu screenshot of this exact signed APK running in an Android TV emulator; not a physical TV capture.',gameplayVideo='docs/releases/'+g['version']+'/gameplay.mp4',gameplayMetadata='docs/releases/'+g['version']+'/gameplay.json',minSdk=26)
 new['wifiController']={'protocol':'puretv-tcp-jsonl-v1','defaultPort':63485,'discovery':'_puretv._tcp','maxPlayers':1 if g['host']=='game-kit' or slug=='alien-shooter' else 2,'buttonMapping':'A/X primary, B/Y secondary' if g['host']=='game-kit' else 'A/X primary, B secondary, Y SELECT','guide':'../../../docs/readme-controller-support/README.md'}
 new['verification']={k:verification[k] for k in ['status','acceptanceMode','sourceAssetsMatchApk','checkedSourceAssetFiles','signatureVerified','inPlaceUpgradeInstalled','actualAndroidEmulator','androidControllerAcceptancePassed','androidControllerAcceptanceComplete','officialSdkAndroidTestsPassed','officialSdkTestsPassed','officialSdkTestEnvironment','physicalTvTested','physicalPhoneTested','physicalEsp32Tested']}
 if is_browser:new['verification'].update(officialSdkBrowserTestsPassed=9,browserControllerAcceptanceComplete=True)
 new['verification']['verificationReport']='docs/releases/'+g['version']+'/verification.json';new['previousReleases']=old.get('previousReleases',[])+[previous];write(app/'resource.json',new)
 sums=app/'SHA256SUMS.txt';text=sums.read_text();line=identity['sha256']+'  '+g['apk']+'\n'
 if g['apk'] not in text:sums.write_text(text+('' if text.endswith('\n') else '\n')+line)
 if slug in progress_by_id:
  entry=progress_by_id[slug];older=copy.deepcopy(entry);older.pop('previousReleases',None)
  entry.update(version=g['version'],apk=g['apk'],apkBytes=identity['bytes'],apkSha256=identity['sha256'],video=new['gameplayVideo'],videoBytes=published_video.stat().st_size,videoSha256=digest(published_video),sourceCommit=receipt['sourceSha'],signingRun=int(receipt.get('workflowRun',receipt.get('runId'))),checks=new['verification']['verificationReport'],status='verified')
  entry['previousReleases']=entry.get('previousReleases',[])+[older]
 g.update(status='signed_apk_verified',sourceCommit=receipt['sourceSha'],sha256=identity['sha256'],apkBytes=identity['bytes'],verification='../../resource/apps/'+slug+'/'+new['verification']['verificationReport'],acceptanceMode=verification['acceptanceMode'],androidControllerAcceptancePassed=not is_browser,androidAcceptanceStatus='environment_blocked_browser_verified' if is_browser else 'passed')
progress['hardwareTesting']='No physical TV, phone or ESP32 testing is claimed. The eight README-featured games in this controller update also have signed-APK Android TV emulator reports; see docs/readme-controller-support/README.md. Other entries retain their original validation scope.'
write(root/'resource/game-kit/progress.json',progress)
latest=list(exports.values())[-1]
assert len(browser_results)==1 and set(browser_results)=={'used-car-racing'}
android_summary={'passed':19,'environmentBlocked':1,'environmentBlockedGames':['used-car-racing'],'completeCatalogAndroidAcceptancePassed':False,'browserVerifiedBlockedGames':['used-car-racing']}
write(root/'docs/readme-controller-support/acceptance-set.json',{'status':'verified_with_documented_android_environment_blocker','scope':'Nineteen games passed complete signed-APK Android controller acceptance. Only Used Car Racing passed complete official-SDK browser acceptance of APK-identical assets; its signed APK upgraded successfully and passed three Android checks before a host emulator crash blocked further Android acceptance. All original failures remain unchanged.','androidAcceptanceSummary':android_summary,'games':acceptance,'physicalTvTested':False,'physicalPhoneTested':False,'physicalEsp32Tested':False})
rollout.update(status='signed_apks_verified_pending_publication',androidAcceptanceSummary=android_summary,runtimeRun=latest['runId'],runtimeRuns=list(exports),qaSourceCommit=latest['qaSourceSha'],qaSourceCommits=sorted({v['qaSourceSha'] for v in exports.values()}),acceptanceSet='acceptance-set.json',legacySourceCommit=read(a.legacy/'export-manifest.json')['sourceSha'])
write(root/'docs/readme-controller-support/rollout.json',rollout)
print(json.dumps({'games':len(results),'resourceMetadataUpdated':True,'published':False}))
