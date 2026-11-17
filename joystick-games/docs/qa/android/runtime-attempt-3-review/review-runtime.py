#!/usr/bin/env python3
"""Independent read-only verifier for archived Android runtime artifacts.
Never executes game code or changes production state. Pixel review is separate.
"""
import argparse,collections,hashlib,json,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--directory',type=Path,required=True);p.add_argument('--repo',type=Path,required=True);p.add_argument('--source',required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
assert not a.output.exists()
def info(p):return {'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
def pairs(s):
 return sorted((r['playerId'],r['controllerId']) for c in s['page']['controllerClients']['containers'] if c['visible'] for r in c['rows'] if r['visible'] and r['iconVisible'] and r['idText'] in (r['controllerId'], 'ID: '+r['controllerId']))
rows=[]
for path in sorted(a.directory.rglob('report.json')):
 try:report=json.loads(path.read_text())
 except (ValueError,UnicodeError):continue
 if 'apk' not in report or 'freshnessChecks' not in report:continue
 base=path.parent
 for kind,filename in [('apk',report['game']+'-0.1.0.apk'),('observer','observer-'+report['game']+'.apk')]:
  matching=[p for p in a.directory.rglob(filename) if info(p)['sha256']==report[kind]['sha256'] and info(p)['bytes']==report[kind]['bytes']]
  assert matching, 'Actual installed '+kind+' hash absent from archived verified bundle'
 assert report['sourceCommit']==a.source
 assert report['status']=='passed',str(path)+':'+report.get('error','')
 assert all(x['status']=='passed' for x in report['tests'])
 sources=[]
 for relative,meta in report['sourceFiles'].items():
  actual=base/'source'/relative
  assert info(actual)==meta, str(actual)
  committed=subprocess.check_output(['git','show',a.source+':'+relative],cwd=a.repo)
  assert hashlib.sha256(committed).hexdigest()==meta['sha256'],relative
  sources.append(relative)
 wire=[json.loads(x) for x in (base/'wire.jsonl').read_text().splitlines()]
 sent=[r for r in wire if r['direction']=='sdk-to-game'];replies=[r for r in wire if r['direction']=='game-to-sdk']
 rejected=report['wire']['rejectedConnections'];assert len(rejected)==1
 rejected_id=rejected[0]['controllerId'];rejected_conn=rejected[0]['connection']
 rejected_sent=[r for r in sent if r['connection']==rejected_conn]
 rejected_replies=[r for r in replies if r['connection']==rejected_conn]
 assert rejected_sent[0]['message']=={'type':'hello','controller_id':rejected_id,'seq':1}
 assert [r['message'] for r in rejected_replies]==[{'type':'error','message':'controller_busy','seq':1}]
 assert all(r['message']['controller_id']==rejected_id for r in rejected_sent)
 accepted=[r for r in sent if r['connection']!=rejected_conn];acks=[r for r in replies if r['connection']!=rejected_conn]
 assert all(r['message'].get('type')=='ack' and type(r['message'].get('seq')) is int for r in acks)
 assert len(rejected_sent)==report['wire']['rejectedSdkMessages']
 assert len(accepted)==report['wire']['acceptedSdkMessages']
 assert not report['wire']['missingAcks'] and not report['wire']['unexpectedReplies'] and not report['wire']['duplicateAcks']
 assert all(json.loads(r['line'])==r['message'] for r in wire)
 sk=collections.Counter((r['connection'],r['message']['seq']) for r in accepted)
 ak=collections.Counter((r['connection'],r['message']['seq']) for r in acks if r['message'].get('type')=='ack')
 assert sk==ak and all(count==1 for count in sk.values())
 assert len(acks)==len(accepted)==report['wire']['matchingAcks']
 assert len(sent)==report['wire']['sdkMessages']
 assert len(replies)==report['wire']['hostReplies']
 keys=sorted({r['message']['key'] for r in accepted if r['message'].get('type')=='button'})
 assert keys==['A','B','DOWN','LEFT','RIGHT','START','UP','X','Y']
 identities=sorted({r['message']['controller_id'] for r in sent})
 assert len(identities)==2
 primary_id=accepted[0]['message']['controller_id']
 assert all(r['message']['controller_id']==primary_id for r in accepted) and primary_id!=rejected_id
 assert len({r['connection'] for r in accepted})==2, 'Expected initial and same-ID reconnect sessions'
 service=report['controllerService'];port=service['port']
 assert (port!=63485) if report['defaultPortOccupiedFixture'] else (port==63485)
 assert service['serviceType']=='_puretv._tcp' and service['version']=='1'
 snapshots={x['label']:x['snapshot'] for x in report['snapshots']}
 assert 'WebGL 2.0' in snapshots['initial-menu']['game']['webglVersion']
 assert all(s['info']['wifiController']['port']==port for s in snapshots.values())
 for key in keys:
  down=snapshots['key-down-'+key];up=snapshots['key-up-'+key]
  players=down['game']['controller']['players']
  buttons=next(p['buttons'] for p in players if p['controllerId']==primary_id and p['connected'])
  assert [k for k in keys if buttons.get(k)]==[key]
  released=next(p['buttons'] for p in up['game']['controller']['players'] if p['controllerId']==primary_id and p['connected'])
  assert not any(released.values()) and up['game']['controller']['pollCount']>down['game']['controller']['pollCount']
 held=[snapshots[k] for k in ['before-held-sync','held-sync-acked','held-start-sync']]
 assert len({s['game']['stage'] for s in held})==1
 assert held[2]['game']['controller']['pollCount']>=held[1]['game']['controller']['pollCount']+3
 sessions=[]
 for label in ['before-second-controller','second-controller-rejected','primary-controls-after-rejection']:
  s=snapshots[label];assert pairs(s)==[(1,primary_id)]
  players=[p for p in s['game']['controller']['players'] if p['connected']]
  assert len(players)==1 and players[0]['id']==1 and players[0]['controllerId']==primary_id
  sessions.append(players[0]['session'])
 assert len(set(sessions))==1
 freshness=report['freshnessChecks']
 assert all(x['afterPollCount']>=x['beforePollCount']+x['minimumFrames'] and x['endedAt']>=x['startedAt'] for x in freshness)
 assert {x['path'] for x in report['captures']}=={n+'.png' for n in ['connected','playing','paused','second-rejected','disconnected','reconnected']}
 images=[]
 for capture in report['captures']:
  im=base/capture['path'];actual=info(im)
  assert all(actual[k]==capture[k] for k in actual),str(im)
  assert pairs(capture['before'])==pairs(capture['after'])
  assert capture['manualPixelReviewRequired'] is True
  if im.stem=='disconnected':assert not pairs(capture['before'])
  else:assert len(pairs(capture['before']))==1
  assert all(identity==primary_id for _,identity in pairs(capture['before']))
  images.append({'path':str(im.relative_to(a.directory)),**actual,'visibleIdentities':pairs(capture['before']),'manualPixelReviewRequired':True})
 video=base/report['video']['path'];assert all(info(video)[k]==report['video'][k] for k in info(video))
 probe=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',str(video)],capture_output=True,text=True);assert probe.returncode==0,probe.stderr
 pdata=json.loads(probe.stdout);assert float(pdata['format']['duration'])>1
 decode=subprocess.run(['ffmpeg','-v','error','-i',str(video),'-vsync','0','-enc_time_base','-1','-f','null','-'],capture_output=True,text=True);assert decode.returncode==0 and not decode.stderr,decode.stderr
 rows.append({'runtime':str(base.relative_to(a.directory)),'status':'passed','game':report['game'],'testsPassed':len(report['tests']),'messagesAndAcks':len(accepted),'rejectedSdkMessages':len(rejected_sent),'busyResponses':1,'identities':identities,'sourceFilesVerified':sources,'freshnessChecks':len(freshness),'apk':report['apk'],'observer':report['observer'],'service':report['controllerService'],'targetPid':report['targetPid'],'occupied':report['defaultPortOccupiedFixture'],'images':images,'video':{'path':str(video.relative_to(a.directory)),**info(video),'probe':pdata,'fullDecodePassed':True},'physicalTvTested':False,'physicalEsp32Tested':False})
assert len(rows)==4 and {(r['game'],r['occupied']) for r in rows}=={(g,m) for g in ['cf-transport-ship','qq-speed'] for m in [False,True]}, 'Expected both games in normal and occupied modes'
a.output.parent.mkdir(parents=True,exist_ok=True)
a.output.write_text(json.dumps({'status':'passed','sourceCommit':a.source,'method':'Independent archive/source/hash/actual wire ACK/state-contract review. Does not replace pixel inspection.','runtimeReports':rows,'allImagesManuallyReviewed':False,'executedVerifier':info(Path(__file__))},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'reports':len(rows),'testsPassed':sum(r['testsPassed'] for r in rows),'sdkMessagesAndAcks':sum(r['messagesAndAcks'] for r in rows),'pngHashesVerified':sum(len(r['images']) for r in rows)}))
