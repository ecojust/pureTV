import argparse,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('game',choices=['glass-fold','prism-relay']);p.add_argument('recording');p.add_argument('--output',required=True);args=p.parse_args()
folder=Path(args.recording);manifest=json.loads((folder/'recording.json').read_text());validation=json.loads((folder/'video-validation.json').read_text())
frozen=json.loads(Path('/workspace/scratch/game-polish/frozen-01/frozen-verification.json').read_text());assetHashes=next(g['assetHashes'] for g in frozen['games'] if g['slug']==args.game)
assert manifest['sourceAssetHashes']==assetHashes
video=folder/'gameplay.mp4';assert video.stat().st_size<10_000_000
assert manifest['videoBytes']==video.stat().st_size
assert manifest['videoSha256']==hashlib.sha256(video.read_bytes()).hexdigest()
assert not manifest['errors'] and not manifest['consoleErrors'] and not manifest['network']
assert manifest['physicalTvTested'] is False and manifest['physicalPhoneTested'] is False
wins={}
for entry in manifest['states']:
 s=entry['state'];m=s['model']
 assert s['phase']!='lost',str(entry)
 if s['phase']!='won':continue
 assert m['phase']=='won' and m['lostReason'] is None
 if args.game=='glass-fold':
  assert m['targetMatched'] and m['outlineMatches'] and m['foldsUsed']==m['foldLimit'] and m['foldsRemaining']==0
  assert m['matchedCells']==m['target']['occupiedCount'] and m['materialArea']==len(m['pieces']) and m['undoCount']==1
 else:
  assert all(r['incident']==r['required'] and r['charge']==20 for r in m['receivers'])
  assert all(h['heat']<h['limit'] for h in m['hazards'])
 wins.setdefault(m['level'],{'level':m['level'],'name':m['levelName'],'observedAtSeconds':entry['seconds'],'elapsed':m['elapsed'],'score':m['score']})
assert sorted(wins)==[1,2,3,4,5,6],list(wins)
assert manifest['states'][-1]['state']['phase']=='won' and manifest['states'][-1]['state']['model']['level']==6
result={'passed':True,'kind':'six-ordinary-optics-level-recording-review','sourceSha':frozen['sourceSha'],'game':args.game,'sourceAssetHashes':assetHashes,'videoSha256':manifest['videoSha256'],'videoBytes':manifest['videoBytes'],'capturedSeconds':manifest['capturedSeconds'],'ordinaryWins':list(wins.values()),'videoValidation':validation,'recordingManifest':str(folder/'recording.json'),'physicalTvTested':False,'physicalPhoneTested':False,'checks':{'allSixLevelsObservedWon':True,'lastLevelWon':True,'noLossObserved':True,'sourceAssetsMatchFreeze':True,'normalGoalConditionsVerified':True,'underTenMillionBytes':True,'videoHashMatchesManifest':True,'noBrowserErrors':True}}
Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({key:result[key] for key in ['passed','game','videoBytes','capturedSeconds','ordinaryWins']},ensure_ascii=False,indent=2))
