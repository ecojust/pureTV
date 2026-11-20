from pathlib import Path
import json,os,hashlib,datetime
root=Path('/dev/shm/puretv-submit');s=Path('/dev/shm/racing-review-arcade/night-44618869289');b=root/'joystick-games/night-racer/docs/android-delivery';ev=b/'original-export/evidence/joystick-android-runtime-night-racer'
def link(a,p):
 p.parent.mkdir(parents=True,exist_ok=True)
 if p.exists():assert p.read_bytes()==a.read_bytes()
 else:os.link(a,p)
for n in ['audit-delivery.py','fetch-original-package.py','materialize-export.py','recover-small-evidence.py','finalize-audit-docs.py']:link(s/n,b/'executed-local'/n)
for n in ['completed.json','export-ref.json','run-20261119T215615Z.json','jobs-20261119T215615Z.json','original-runtime-job.log']:link(s/n,b/'recovery'/n)
link(s/'original-small-c6328e03941bbc70a650f33dabcdbd7c555f15c0/original-git-tree.json',b/'recovery/original-git-tree.json')
for n in ['signing-receipt.json','build-receipt.json','observer-signing-receipt.json','observer-build.json','original-package-recovery.json','actual-tool-invocations.json','apksigner.txt','aapt-badging.txt','package-preverification.json']:link(s/'original-package'/n,b/'original-package-proof'/n)
for p in (s/'video-samples').iterdir():link(p,b/'video-samples'/p.name)
notes={
 'connected.png':'Original menu and all main controls visible. Left card shows gamepad icon, 1P and complete virtual controller ID wrapping onto two lines; normal TCP63485 / occupied TCP32849 shown.',
 'playing.png':'Race world, player car, lap/time/rank, minimap, nitro and speed HUD all visible. Compact left controller ID card does not obscure HUD. This capture is after release/reset and shows 0 km/h; acceleration is proved separately by original snapshots/wire, not by this still.',
 'paused.png':'Pause overlay visible; Resume, Restart, Camera, Settings and Main menu all unobstructed to the right of controller card. Bottom nine-key hint visible.',
 'second-rejected.png':'Exactly one active controller card remains, original ID retained, pause menu readable. Second controller rejection is a wire/report conclusion, not visible as a second on-screen player.',
 'focus-restored-paused.png':'Pause overlay and original controller ID retained on focus restoration. Frozen speed HUD reads 18 km/h normal / 23 km/h occupied. Resume remains unobstructed.',
 'disconnected.png':'Controller ID/connected row removed and connection instructions displayed. Pause overlay remains visible; frozen speed 18 km/h normal / 34 km/h occupied.',
 'reconnected.png':'Original controller ID returns, pause overlay and unchanged race HUD remain. Reconnection has not automatically resumed the game.'}
review=[]
for mode in ['normal','occupied']:
 r=json.loads((ev/('night-racer-'+mode)/'report.json').read_text())
 for c in r['captures']:review.append({'mode':mode,'path':f'original-export/evidence/joystick-android-runtime-night-racer/night-racer-{mode}/'+c['path'],'sha256':c['sha256'],'bytes':c['bytes'],'viewImageActuallyInspected':True,'pixels':[1920,1080],'logicalViewport':[960,540],'finding':notes[c['path']]})
visual={'status':'passed_with_explicit_scope','reviewer':'racing_review_arcade','reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Individually opened all 14 immutable PNGs with view_image; no rerendering or image edits. Also opened four directly extracted original-video frames.','images':review,'videoSamples':[{'path':'video-samples/'+p['path'].split('/')[-1],'sha256':p['sha256'],'bytes':p['bytes'],'viewImageActuallyInspected':True} for p in json.loads((s/'video-samples/invocations.json').read_text())],'videoScope':{'normalDurationSeconds':179.391156,'occupiedDurationSeconds':180.257756,'sample5Seconds':'Both original high-quality setup menus with complete controller IDs.','sample170Seconds':'Normal is original countdown 2 with stationary car; occupied is early race at 0 km/h with green lights.','limitation':'Only first approximately three minutes were recorded. These samples are not evidence of full driving/connection acceptance; no claim to have watched every video frame. Later acceleration/action/disconnect results are supported by original full snapshots, wire and separately captured PNGs.'},'limitations':['Tested Android emulator native APK logical viewport960x540 / physical capture1920x1080, not a physical TV or ESP32.','20/21 FPS visible in CI stills describes this software-rendered environment, not TV performance.','Gameplay acceptance selected existing Low preset through normal original menu; original APK default remains High.','No RSSI/signal-strength value is shown or invented.','All 14 captures passed readability review; original menu keyboard hints near bottom are partly covered by fixed controller mapping strip, while active nine-key instructions and actionable controls remain readable.','No complete career or dedicated persistent-save lifecycle was exercised by this Android scenario.']}
(b/'visual-review.json').write_text(json.dumps(visual,ensure_ascii=False,indent=2)+'\n')
# Exact inventory binds all immutable restored/derived evidence without duplicating large originals.
files={}
for p in sorted(b.rglob('*')):
 if p.is_file() and p.name!='delivery-audit-manifest.json':data=p.read_bytes();files[p.relative_to(b).as_posix()]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
summary={'status':'ready_for_root_package_materialization','qaRunId':44618869289,'qaSource':'f3e1e9f6634e35d1c9ae0cfbf1f8a51d42de7965','runtimeExport':'c6328e03941bbc70a650f33dabcdbd7c555f15c0','productionRunId':44613335670,'productionSource':'315f8889ea677ed6a9211bf7d66c8c78dff57f01','originalArtifactId':14571679832,'originalApk':{'scratchPath':str(s/'original-package/night-racer-0.1.0.apk'),'bytes':22465268,'sha256':'66e2589ece8a13bc03d9796259b2662aef34c56c166265db0a63d3baa2b72c91','gitBlobSha':'339d6f59b79f6069b1268396c4c865ebabd485e9'},'all14OriginalImagesActuallyViewed':True,'independentWireAckCounts':{'normal':644,'occupied':641},'originalRuntimeChecks':{'normal':58,'occupied':58},'originalFailedReportsPreserved':True,'rootDeliveryMetadataModified':False,'files':files}
(b/'delivery-audit-manifest.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'files':len(files),'logicalBytes':sum(v['bytes'] for v in files.values()),'manifestSha256':hashlib.sha256((b/'delivery-audit-manifest.json').read_bytes()).hexdigest()}))
