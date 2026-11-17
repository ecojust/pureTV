#!/usr/bin/env python3
"""Read-only recorded-goal audit. Runtime menu selection is never a completed-level ID."""
import argparse, hashlib, json, pathlib
ONE_BASED={'glass-fold','prism-relay','tension-span','conveyor-window'}
ZERO_BASED={'packing-sculptor','tower-overlap','torch-bridge','twenty-four'}
def require(condition,message):
 if not condition: raise ValueError(message)
def actual_level(game,model):
 require(game in ONE_BASED|ZERO_BASED,'Unknown game schema: '+game)
 if game in ONE_BASED:
  level=model.get('difficulty');require(type(level) is int and model.get('level')==level+1,'difficulty / one-based model level disagree')
 else:level=model.get('level')
 require(type(level) is int and 0<=level<6,'Invalid model level')
 return level

def goal(game,m):
 level=actual_level(game,m);require(m.get('phase')=='won','Model has not won')
 receipt=m.get('terminalReceipt',{})
 if game=='glass-fold':
  require(m['targetMatched'] and m['outlineMatches'] and m['matchedCells']==len(m['target']['cells']) and m['lastReview']['matched'],'Unmatched stained-glass target')
  data={'targetMatched':True,'matchedCells':m['matchedCells'],'targetCells':len(m['target']['cells'])}
 elif game=='prism-relay':
  require(m['receivers'] and all(r['charge']>=m['chargeTicks'] and r['incident']==r['required'] for r in m['receivers']),'Receivers not fully charged with required colors')
  require(all(h['heat']<h['limit'] for h in m['hazards']),'Hazard overheated')
  data={'receiversCharged':len(m['receivers']),'requiredChargeTicks':m['chargeTicks']}
 elif game=='tension-span':
  car=m['car'];require(car['finished'] and not car['falling'] and car['x']>=car['finishX'] and not any(p['broken'] for p in m['panels']),'Truck has not cleared an intact bridge')
  require(m['spent']<=m['budget'],'Bridge exceeds material budget');data={'finished':True,'carX':car['x'],'finishX':car['finishX'],'spent':m['spent'],'budget':m['budget']}
 elif game=='conveyor-window':
  require(m['terminal']['reason']=='required_streak' and m['streak']>=m['requiredStreak'] and m['totalCorrect']>=m['streak'],'Consecutive assembly goal not achieved')
  data={'streak':m['streak'],'requiredStreak':m['requiredStreak'],'totalCorrect':m['totalCorrect'],'faults':m['faults']}
 elif game=='packing-sculptor':
  g=m['geometry'];require(all(g[k] is True for k in ['canShip','allPlaced','allInside','noOverlap','validPacking']),'Packing target not fulfilled')
  require(g['placedCount']==len(m['pieceIds']) and all(v==0 for v in m['inventory'].values()),'Not every piece is packed')
  require(len(g['extractions'])==len(m['container']['requirements']) and all(x['canExit'] for x in g['extractions']),'Required extraction path blocked')
  require(receipt.get('cause')=='success' and receipt.get('phase')=='won','Missing packing success receipt')
  data={'placedCount':g['placedCount'],'pieceCount':len(m['pieceIds']),'canShip':True,'extractionsCleared':len(g['extractions'])}
 elif game=='tower-overlap':
  require(m['goal']>0 and m['floorsBuilt']==m['goal'] and len(m['floors'])==m['goal']+1,'Tower goal not reached')
  require(m['lastLanding']['accepted'] and m['lastLanding']['cause']=='success' and all(f['width']>=16 for f in m['floors']),'Invalid final tower landing')
  require(receipt.get('cause')=='success' and receipt.get('level')==level,'Wrong tower receipt')
  data={'floorsBuilt':m['floorsBuilt'],'goal':m['goal'],'lastLandingWidth':m['lastLanding']['width']}
 elif game=='torch-bridge':
  require(m['positions'] and all(x==1 for x in m['positions']) and m['torch']==1 and m['spent']<=m['deadline'],'Travelers have not crossed within budget')
  require(sum(r['cost'] for r in m['receipts'])==m['spent'],'Crossing ledger does not match total time')
  require(receipt.get('cause')=='success' and receipt.get('level')==level,'Wrong crossing receipt')
  data={'peopleAcross':len(m['positions']),'spent':m['spent'],'deadline':m['deadline']}
 elif game=='twenty-four':
  require(len(m['terms'])==1,'More than one arithmetic result remains');term=m['terms'][0]
  require(m['target']==24 and term['mask']==m['fullMask']==15 and term['d']>0 and term['n']==24*term['d'],'Four-card exact twenty-four goal not achieved')
  require(receipt.get('cause')=='twenty-four' and receipt.get('level')==level,'Wrong arithmetic receipt')
  data={'numerator':term['n'],'denominator':term['d'],'sourceMask':term['mask']}
 return level,data

def audit(game,record):
 wins={};menu_mismatches=[]
 for sample in record['states']:
  state=sample['state'];model=state.get('model',{})
  if state.get('phase')!='won':continue
  level,data=goal(game,model)
  if state.get('level')!=level:menu_mismatches.append({'seconds':sample['seconds'],'selectedMenuLevel':state.get('level'),'completedModelLevel':level})
  wins.setdefault(level,{'seconds':sample['seconds'],'modelLevelZeroBased':level,'selectedMenuLevel':state.get('level'),'modelPhase':model['phase'],'goal':data})
 require(sorted(wins)==list(range(6)),'Recorded model wins missing: '+str(sorted(wins)))
 return {'passed':True,'game':game,'levelIdentity':'model.difficulty (model.level-1 cross-checked)' if game in ONE_BASED else 'model.level (zero-based)','recordedWonLevelsZeroBased':sorted(wins),'wins':wins,'menuSelectionMismatches':menu_mismatches,'note':'Selection changes on a won menu do not change the model that actually completed the goal.'}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--game',required=True);p.add_argument('--recording',required=True,type=pathlib.Path);p.add_argument('--output',type=pathlib.Path);a=p.parse_args()
 result=audit(a.game,json.loads(a.recording.read_text()));result['recordingSha256']=hashlib.sha256(a.recording.read_bytes()).hexdigest();raw=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
 if a.output:a.output.write_text(raw)
 print(raw,end='')
