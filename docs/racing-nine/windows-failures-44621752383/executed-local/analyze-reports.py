import hashlib,json,subprocess
from pathlib import Path
b=Path(__file__).resolve().parent;e=b/'original-small-export';result={'source':'039d210cfa4cc65f59adf0859a777f3591853a70','run':44621752383,'attempt':1,'export':'f559a71e99ff27c8f262ed2a82a70674ee90f9dc','reports':[],'noProductionChangeOrRerun':True}
for game in ['ponpoko-kart','backroad-rally','kart-royale','turbo-kart-rush']:
 for mode in ['bootstrap','normal','occupied']:
  p=e/('joystick-windows-evidence-'+game)/('runtime-'+mode)/'report.json'
  if not p.exists():continue
  r=json.loads(p.read_text());row={'game':game,'mode':mode,'path':str(p.relative_to(b)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'status':r['status'],'error':r.get('error'),'tests':[{'name':t['name'],'status':t['status']} for t in r.get('tests',[])]}
  if mode!='bootstrap':
   assert r['qaSourceCommit']==result['source']
   for name,h in r['sourceHashes'].items():
    name=name.replace('\\','/');blob=subprocess.check_output(['git','show',result['source']+':'+name],cwd='/dev/shm/puretv-submit');assert hashlib.sha256(blob).hexdigest()==h
   row['qaSourceHashesVerified']=len(r['sourceHashes'])
   sp=p.parent/'diagnostics/state.json';state=json.loads(sp.read_text());g=state.get('game') or {};row['finalState']={'timestamp':state.get('timestamp'),'documentEpoch':state.get('documentEpoch'),'ready':state.get('ready'),'active':state.get('active'),'lastJavaScriptError':state.get('lastJavaScriptError'),'frames':g.get('frames'),'stage':g.get('stage'),'paused':g.get('paused'),'renderer':g.get('renderer'),'pollCount':g.get('controller',{}).get('pollCount'),'gameplay':{k:v for k,v in (g.get('gameplay') or {}).items() if k not in ['selectedCar']}}
   taps=r.get('menuTapObservations',[])
   if taps:
    t=taps[-1];samples=t.get('samples',[]);row['lastMenuTap']={k:v for k,v in t.items() if k not in ['before','after','samples','wire']};row['lastMenuTap']['beforeFrame']=t.get('before',{}).get('frames');row['lastMenuTap']['beforeGameplay']=t.get('before',{}).get('gameplay');row['lastMenuTap']['distinctRetainedQualifiedPolls']=sorted(set(s['pollCount'] for s in samples if s['qualified']));row['lastMenuTap']['firstRetainedSample']=samples[0] if samples else None;row['lastMenuTap']['lastRetainedSample']=samples[-1] if samples else None
   if game=='kart-royale':
    row['navigationSnapshots']=[]
    for snap in r['snapshots']:
     if any(n in snap['label'] for n in ['Focus controls option Left','Save original left','Close Controls']):
      g=snap['state']['game'];row['navigationSnapshots'].append({'label':snap['label'],'at':snap['at'],'frames':g['frames'],'pollCount':g['controller']['pollCount'],'focus':g['gameplay']['focus'],'controlHand':g['gameplay']['controlHand'],'semanticButtons':g['controller']['buttons']})
   if 'storageRestart' in r:row['storageRestart']={k:r['storageRestart'].get(k) for k in ['required','status','actualStoredKeys','nativeSavedAfterQuit','cleanBrowserCacheVerified','initialHydrationEqual']}
  result['reports'].append(row)
result['findings']=[
 'Only Turbo originally passed both native modes. Its save-restart requirement is false and storageRestart.status is not_exercised with no actual saved keys, so the generic ten green checks do not establish a real game-save lifecycle.',
 'Ponpoko never reached the SDK scenarios: document-start fixture produced no observed state before its timeout. Current report alone does not establish a renderer, process-exit or storage-injection root cause.',
 'Backroad both modes reached the final original Start step, but the last state is paused while phase=intro, ready=true and menuFocus=resume. No retained sample satisfies the final race predicate during 240 seconds. This is separate from installation/bootstrap/SDK handshake, which passed; the pause trigger is not yet established.',
 'Royale normal never reached the new 600-second race-start step. Its prior roster-open menuTap reached the correct select menu and Start race focus at final poll63, but the retained qualifying polls are 62 and 63 (baseline plus only one subsequent poll), so the required two subsequent fresh polls did not occur within 60 seconds.',
 'Royale occupied failed before closing Controls: six Y navigation steps only assert that the controls menu remains open, not their named focused option. The final Focus controls option Left observation/release is still on Steer buttons; the subsequent A ends on Right and saves right. These old predicates can accept before navigation has been consumed. No evidence that its 600-second countdown or game physics were exercised.',
 'Potential narrow follow-up for review: make the six original Y menu actions require their actual distinct focus targets and use existing short menuTap; retain the present budgets and original gameplay predicates and do not alter clocks or physics. This is a proposal only, not applied.'
]
(b/'original-report-findings.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'reports':len(result['reports']),'qaHashesPerRuntime':[(r['game'],r['mode'],r.get('qaSourceHashesVerified')) for r in result['reports'] if r['mode']!='bootstrap']}))
