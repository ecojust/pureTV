import collections,hashlib,json,pathlib
OUT=pathlib.Path(__file__).resolve().parent;EXPORT=OUT/'original-export';BASE=EXPORT/'evidence/joystick-android-runtime-backroad-rally';modes=[]
for mode in ['normal','occupied']:
 folder=BASE/('backroad-rally-'+mode);r=json.loads((folder/'report.json').read_text());wire=[json.loads(x) for x in (folder/'wire.jsonl').read_text().splitlines()];sent=collections.Counter();acks=collections.Counter();errors=[];rejected=set()
 for x in wire:
  msg=x.get('message');assert not x.get('line') or json.loads(x['line'])==msg
  if x['direction']=='game-to-sdk' and msg and msg.get('type')=='error':errors.append(x);rejected.add(x['connection'])
 assert len(errors)==1 and errors[0]['message']['message']=='controller_busy'
 for x in wire:
  msg=x.get('message') or {};key=(x['connection'],msg.get('seq'))
  if x['direction']=='sdk-to-game' and x['connection'] not in rejected:sent[key]+=1
  if x['direction']=='game-to-sdk' and msg.get('type')=='ack':acks[key]+=1
 assert sent==acks and set(sent.values())=={1};assert len(sent)==r['wire']['matchingAcks']==r['wire']['acceptedSdkMessages']
 plan=json.loads((folder/'source/joystick-games/backroad-rally/qa-plan.json').read_text());tests=[x for x in r['tests'] if x['name'].startswith('actual SDK gameplay: ')];assert len(tests)==len(plan['steps'])==39
 for step,test in zip(plan['steps'],tests):assert test['name']=='actual SDK gameplay: '+step['name'] and test['status']=='passed' and test['details']['expect']==step['expect'] and test['details']['holdMs']==step['holdMs']
 for cap in r['captures']:
  b=(folder/cap['path']).read_bytes();assert len(b)==cap['bytes'] and hashlib.sha256(b).hexdigest()==cap['sha256']
 v=(folder/r['video']['path']).read_bytes();assert len(v)==r['video']['bytes'] and hashlib.sha256(v).hexdigest()==r['video']['sha256']
 selected={}
 for label in ['initial-menu','before-plan-Accelerate original Rapier car','after-plan-Accelerate original Rapier car','after-plan-Steer right with original handbrake','after-plan-Cycle original chase camera']:
  snap=next(x['snapshot'] for x in r['snapshots'] if x['label']==label);g=snap['game'];selected[label]={'game':{k:v for k,v in g.items() if k!='controller'},'page':{k:snap['page'][k] for k in ['url','width','height','canvases','hidden','focused']},'pollCount':g['controller']['pollCount']}
 modes.append({'mode':mode,'automatedStatus':r['status'],'checksPassed':len(r['tests']),'originalOrderedPlanSteps':len(tests),'independentRawWireUniqueAcks':len(acks),'busyRejectionCount':len(errors),'snapshots':selected,'video':{**r['video'],'duration':json.loads((OUT/'video-review'/(mode+'-probe.json')).read_text())['format']['duration']},'scope':'Video covers roughly first 180 seconds of menu flow, not the later complete driving/SDK sequence.'})
viewed=['original-export/evidence/joystick-android-runtime-backroad-rally/backroad-rally-normal/playing.png','original-export/evidence/joystick-android-runtime-backroad-rally/backroad-rally-occupied/playing.png','original-export/evidence/joystick-android-runtime-backroad-rally/backroad-rally-normal/connected.png','original-export/evidence/joystick-android-runtime-backroad-rally/backroad-rally-normal/paused.png']+['video-review/'+mode+'-'+str(second)+'s.png' for mode in ['normal','occupied'] for second in [30,170]]
images=[]
for name in viewed:
 b=(OUT/name).read_bytes();images.append({'path':name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'actuallyViewed':True,'finding':'Game DOM/menu/HUD and controller identity are visible, but no 3D car/track is visible behind them. Both playing screenshots have near-uniform dark backgrounds.'})
result={'status':'visual_delivery_blocked','qaRunId':44630023214,'qaSourceCommit':'382de3792628050773abec8821920348503f72ce','originalExportCommit':'1c0e351dae33304090294b042627192bb8c06622','originalPackageSource':'4b6cf0b8cba288eae66bcae2ef2784acc279a695','originalArtifactId':14579726223,'originalReportStatusUnchanged':True,'modes':modes,'visualReview':images,'graphicsObservations':['Actual query navigation, model movement, original Low menu selection and controller protocol work in both modes.','WebGL2 backend flag, positive frames/polls and visible canvas bounds do not prove drawn car/track pixels.','Normal and occupied logcat contain startup tile-memory-limit warnings; these do not establish the rendering cause.','Production MainActivity has no WebChromeClient console capture; missing Three/WebGL console errors in this evidence is not proof of no shader/resource errors.'],'limitations':['No physical television/ESP32 tested.','No restart persistence scenario or full stage/career completion verified.','No release upload or new package build occurred in this review.','Original automatic success remains intact; manual delivery decision is blocked pending rendering diagnosis.']}
(OUT/'runtime-review.json').write_text(json.dumps(result,indent=2)+'\n');print('verified raw ACKs and ordered plan; delivery blocked',[(x['mode'],x['checksPassed'],x['independentRawWireUniqueAcks']) for x in modes])
