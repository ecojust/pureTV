#!/usr/bin/env node
// Public rank oracle plus ordinary Model inputs. Explicit geometry/clock fixtures remain separately labelled.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const args={};for(let i=2;i<process.argv.length;i+=2){assert.ok(['--app','--output','--expected-model'].includes(process.argv[i])&&process.argv[i+1]);args[process.argv[i].slice(2)]=process.argv[i+1];}
const script=fileURLToPath(import.meta.url),mathPath=path.join(path.dirname(script),'independent-dunes-math.mjs');
const app=path.resolve(args.app||fileURLToPath(new URL('..',import.meta.url))),output=path.resolve(args.output||'/tmp/independent-dunes-review.json');
assert.match(args['expected-model']||'',/^[0-9a-f]{64}$/);const hash=b=>createHash('sha256').update(b).digest('hex'),clone=structuredClone;
const sourceFiles={'src/main/assets/game-model.js':path.join(app,'src/main/assets/game-model.js'),'docs/model-contract.md':path.join(app,'docs/model-contract.md'),'tests/independent-dunes-math.mjs':mathPath,'tests/independent-dunes-review.mjs':script};
async function hashes(){return Object.fromEntries(await Promise.all(Object.entries(sourceFiles).map(async([k,p])=>[k,hash(await readFile(p))])));}
const before=await hashes();assert.equal(before['src/main/assets/game-model.js'],args['expected-model']);
const report={kind:'independent-public-number-dunes-rule-review',passed:false,sourceHashes:before,checks:[],publicPuzzles:[],ordinaryWins:[],ordinaryConjunctCounterexamples:[],ordinaryBudgetLosses:[],
  scope:'Independent per-stone predecessor ranks, bounded breadth-first public search and ordinary directional/A/B Model inputs. Synthetic 4-cell geometry, duplicate-value and clock/input boundary cases are explicitly labelled. No QA planner, author route, browser, video or physical hardware is used.',
  qaPilotImported:false,authorRoutesRead:false,browserUsed:false,physicalTvTested:false,physicalPhoneTested:false};
let O,Model,observations=0,navigationInputs=0,geometryFixtures=0,focusPairs=0;const origins=new WeakMap();
function near(a,b,label){assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8,label);}
const pos=s=>s.cells.map(c=>c.stoneId),assignPosition=list=>{const p=Array(16).fill(null);for(const a of list){const i=Number(a.cellId.slice(1))-1;assert.ok(i>=0&&i<16&&p[i]===null);p[i]=a.stoneId;}return p;};
function recordOrigin(s){origins.set(s,{board:O.publicBoard(s),position:[...pos(s)]});return s;}
function receipt(s,board,r){
  assert.deepEqual(Object.keys(r).sort(),['id','actionId','lineId','direction','beforeAssignments','afterAssignments','moves','movedCount','at','tick'].sort());
  assert.ok(Number.isInteger(r.id)&&r.id>0&&r.id<=s.movesUsed&&Number.isInteger(r.tick)&&r.tick>0&&r.tick<=s.tick);near(r.at,r.tick/60,'Receipt timestamp');
  const p=assignPosition(r.beforeAssignments),next=O.compact(board,p,r.actionId);assert.ok(next.changed);
  for(const k of ['lineId','direction','afterAssignments','moves','movedCount'])assert.deepEqual(r[k],next[k]);assert.deepEqual(r.beforeAssignments,O.assignments(board,p));
}
function observe(s){
  observations++;const board=O.publicBoard(s),position=pos(s),facts=O.facts(board,position),g=O.geometry();
  assert.deepEqual(s.grid,{cols:4,rows:4,x:180,y:136,cellSize:72});assert.deepEqual(s.actions,g.actions);
  assert.deepEqual(s.focusItems,g.actions.map(a=>({id:a.id,kind:'compact',x:a.x,y:a.y})));assert.deepEqual(s.cursor,s.focusItems.find(x=>x.id===s.selectedId));
  for(let i=0;i<16;i++){const c=s.cells[i];for(const k of ['id','col','row','x','y'])assert.equal(c[k],g.cells[i][k]);assert.equal(c.targetHole,board.targets.includes(i));if(c.kind==='pillar')assert.equal(c.targetHole,false);}
  assert.deepEqual(s.lines,g.lines.map(({indices,...l})=>({...l,segments:O.segments(board,l.id)})));
  for(const [k,v]of Object.entries(facts))assert.deepEqual(s[k],v,k);
  const prediction=O.compact(board,position,s.selectedId),willWin=prediction.changed&&O.facts(board,prediction.position).goalReady;
  const {position:ignored,...predictionFields}=prediction;assert.deepEqual(s.preview,{...predictionFields,willWin,willExhaustMoves:prediction.changed&&s.movesUsed+1>=s.moveLimit&&!willWin});
  for(const k of ['movesUsed','moveLimit','movesRemaining','undos','compactionAttempts','noOpAttempts','historyDepth'])assert.ok(Number.isInteger(s[k])&&s[k]>=0,k);
  assert.equal(s.movesRemaining,Math.max(0,s.moveLimit-s.movesUsed));assert.equal(s.historyDepth,s.history.length);assert.equal(s.historyDepth,s.movesUsed-s.undos);assert.equal(s.compactionAttempts,s.movesUsed+s.noOpAttempts);
  assert.equal(s.timeLimit,90);near(s.elapsed,s.tick/60,'Model elapsed');near(s.remaining,Math.max(0,90-s.elapsed),'Remaining');
  assert.equal(s.score,facts.orderedPairs*25+facts.matchedHoleCount*20+(s.phase==='won'?1000+Math.floor(s.remaining)*5+s.movesRemaining*50:0));
  const origin=origins.get(s);assert.ok(origin,'Missing independent origin');let prior=origin.position,id=0;
  for(const r of s.history){receipt(s,board,r);assert.ok(r.id>id);id=r.id;assert.deepEqual(r.beforeAssignments,O.assignments(board,prior));prior=assignPosition(r.afterAssignments);}
  assert.deepEqual(position,prior,'Snapshot history must reconstruct exact current IDs');
  if(s.lastCompaction){receipt(s,board,s.lastCompaction);assert.equal(s.lastCompaction.id,s.movesUsed);}
  if(s.lastUndo){receipt(s,board,s.lastUndo.edit);near(s.lastUndo.at,s.lastUndo.tick/60,'Undo timestamp');assert.ok(s.lastUndo.tick>=s.lastUndo.edit.tick&&s.lastUndo.tick<=s.tick);}
  if(s.transition){assert.ok(['compact','undo'].includes(s.transition.kind));assert.equal(s.transition.duration,.24);assert.ok(s.phase==='playing');const r=s.transition.kind==='compact'?s.lastCompaction:s.lastUndo.edit;
    assert.equal(s.transition.actionId,r.actionId);assert.deepEqual(s.transition.moves,s.transition.kind==='compact'?r.moves:r.moves.map(m=>({stoneId:m.stoneId,fromCellId:m.toCellId,toCellId:m.fromCellId})));}
  if(s.phase==='won'){assert.ok(s.goalReady&&s.lostReason===null);assert.equal(s.transition,null);}
  else if(s.phase==='lost'){assert.ok(s.lostReason==='timeout'?s.remaining===0:s.lostReason==='moves'&&s.movesUsed>=s.moveLimit&&!s.goalReady);assert.equal(s.transition,null);}
  else assert.equal(s.phase,'playing');
  return facts;
}
function fresh(d=0){const s=recordOrigin(Model.create(23,d));observe(s);return s;}
function step(s,input={},dt=1/60){Model.step(s,dt,input);observe(s);return s;}
const inputs={N:{y:-1},E:{x:1},S:{y:1},W:{x:-1}};
function focus(s,to){for(const d of O.focusRoute(s.selectedId,to)){const expected=O.focusTarget(s.selectedId,d);step(s,inputs[d]);assert.equal(s.selectedId,expected);step(s);navigationInputs++;}assert.equal(s.selectedId,to);}
function press(s,key){step(s,{[key]:true});step(s);}
function execute(s,route){for(const action of route){assert.equal(s.phase,'playing');focus(s,action);assert.ok(s.preview.changed);press(s,'a');}return s;}
function frozenTerminal(s){const old=clone(s);for(const input of [{a:true,b:true,x:1},{cancelEpoch:432,cancelled:true},{}]){Model.step(s,.25,input);assert.deepEqual(s,old);}return true;}
function add(name,details={}){report.checks.push({name,passed:true,...details});}
function nonwinningWalk(board){
  let expanded=0;const dead=new Set();function visit(position,left,path){if(!left)return path;const key=position.join(',')+'@'+left;if(dead.has(key))return null;assert.ok(++expanded<=10000,'Ordinary failure-search cap');
    for(const a of O.geometry().actions){const n=O.compact(board,position,a.id);if(n.changed&&!O.facts(board,n.position).goalReady){const answer=visit(n.position,left-1,[...path,a.id]);if(answer)return answer;}}dead.add(key);return null;}
  const path=visit(board.initial,board.moveLimit,[]);assert.ok(path);return {path,expanded};
}
function fixturePosition(s,position,{pillars=null,values=null,targetHoles=null}={}){
  if(pillars)for(let i=0;i<16;i++)s.cells[i].kind=pillars.includes(i)?'pillar':'sand';
  for(let i=0;i<16;i++)s.cells[i].stoneId=position[i];if(values)s.stones=values.map((value,i)=>({id:'S'+(i+1),value,cellId:'C'+(position.indexOf('S'+(i+1))+1)}));
  const targets=targetHoles||position.flatMap((x,i)=>x===null&&s.cells[i].kind==='sand'?[i]:[]);for(let i=0;i<16;i++)s.cells[i].targetHole=targets.includes(i);
  Model.step(s,1/60,{});recordOrigin(s);observe(s);return s;
}
try{
  O=await import(pathToFileURL(mathPath).href);Model=createRequire(import.meta.url)(path.join(app,'src/main/assets/game-model.js'));assert.equal(Model.TICK_HZ,60);
  const puzzles=[];
  for(let d=0;d<3;d++){
    const s=fresh(d),board=O.publicBoard(s),proof=O.searchPublic(board);assert.ok(proof.complete);assert.equal(proof.solution.depth,4+d);assert.equal(board.moveLimit,6+d);assert.equal(board.ids.length,6+d);assert.equal(s.score,[155,210,170][d]);
    assert.ok(proof.orderedWrongHoles&&proof.holesWrongOrder);assert.ok(!proof.orderedWrongHoles.facts.goalReady&&!proof.holesWrongOrder.facts.goalReady);
    const trial=O.geometry().actions.map(a=>O.compact(board,board.initial,a.id)).find(x=>x.movedCount>=2&&!O.facts(board,x.position).goalReady);assert.ok(trial);
    puzzles.push({board,proof,trial});report.publicPuzzles.push({level:d+1,initialFacts:O.facts(board,board.initial),initialScore:s.score,moveLimit:board.moveLimit,shortestDepth:proof.solution.depth,
      search:{expanded:proof.expanded,visited:proof.visited,transitions:proof.transitions,maxVisited:proof.maxVisited,maxDepth:proof.maxDepth,stoppedBy:proof.stoppedBy},
      solution:proof.solution,orderedWrongHoles:proof.orderedWrongHoles,holesWrongOrder:proof.holesWrongOrder,trial:{actionId:trial.actionId,movedCount:trial.movedCount}});
  }
  add('bounded public rank-transition BFS proves each shortest solution and both independent goal-counterexample predicates',{boards:3,maxVisitedPerBoard:100000,shortestDepths:[4,5,6],noAuthorRouteOrQaPlanner:true});

  for(const actionId of ['R2W','R2E','C2N','C2S'])for(let pattern=0;pattern<81;pattern++){
    const g=O.geometry(),line=g.lines.find(l=>l.id===g.actions.find(a=>a.id===actionId).lineId),position=Array(16).fill(null),pillars=[],values=[1];position[15]='S1';let bits=pattern;
    for(const i of line.indices){const digit=bits%3;bits=Math.floor(bits/3);if(digit===1)pillars.push(i);if(digit===2){values.push(values.length+1);position[i]='S'+values.length;}}
    const s=fixturePosition(Model.create(23,0),position,{pillars,values});s.selectedId=actionId;Model.step(s,1/60,{});observe(s);const board=O.publicBoard(s),expected=O.compact(board,pos(s),actionId),original=clone(pos(s));
    assert.deepEqual(O.compact(board,expected.position,actionId).position,expected.position);assert.deepEqual(s.preview.afterAssignments,expected.afterAssignments);press(s,'a');assert.deepEqual(pos(s),expected.position);
    assert.equal(s.movesUsed,Number(expected.changed));assert.equal(s.noOpAttempts,Number(!expected.changed));assert.equal(s.historyDepth,Number(expected.changed));
    for(let i=0;i<16;i++)if(!line.indices.includes(i))assert.equal(pos(s)[i],original[i]);geometryFixtures++;
  }
  add('all 81 sand/hole/pillar line patterns in four directions agree with per-stone ranks and preserve IDs without wrapping',{explicitPublicGeometryFixtures:geometryFixtures,nonProductionLayouts:true,productionLineLength:4,noClaimOfTwoMovableSegmentsOnOneFourCellLine:true});

  let diameter=0;for(const from of O.geometry().actions)for(const to of O.geometry().actions){const s=fresh();focus(s,from.id);const p=O.focusRoute(from.id,to.id);diameter=Math.max(diameter,p.length);focus(s,to.id);assert.equal(s.movesUsed,0);assert.deepEqual(pos(s),puzzles[0].board.initial);focusPairs++;}
  assert.equal(focusPairs,256);assert.equal(diameter,6);add('all ordered physical action-focus pairs are reachable with correct geometry and no compaction',{pairs:focusPairs,diameter});

  for(let d=0;d<3;d++){
    const {board,proof,trial}=puzzles[d],s=fresh(d);focus(s,trial.actionId);press(s,'a');const originalReceipt=clone(s.lastCompaction),at=s.elapsed;
    assert.ok(s.lastCompaction.movedCount>=2);assert.notEqual(s.history[0],s.lastCompaction);assert.notEqual(s.history[0].moves,s.lastCompaction.moves);
    press(s,'a');assert.equal(s.movesUsed,1);assert.equal(s.noOpAttempts,1);assert.equal(s.historyDepth,1);
    focus(s,O.geometry().actions.find(a=>a.id!==trial.actionId).id);press(s,'b');assert.equal(s.selectedId,trial.actionId);assert.deepEqual(pos(s),board.initial);assert.equal(s.movesUsed,1);assert.equal(s.movesRemaining,board.moveLimit-1);assert.equal(s.historyDepth,0);assert.equal(s.undos,1);assert.ok(s.elapsed>at);assert.deepEqual(s.lastUndo.edit,originalReceipt);assert.deepEqual(s.lastCompaction,originalReceipt);
    assert.notEqual(s.lastUndo.edit,s.lastCompaction);execute(s,proof.solution.path);assert.equal(s.phase,'won');assert.equal(s.movesUsed,proof.solution.depth+1);assert.equal(s.movesRemaining,1);frozenTerminal(s);
    report.ordinaryWins.push({level:d+1,path:proof.solution.path,trialAction:trial.actionId,movesUsed:s.movesUsed,movesRemaining:s.movesRemaining,undos:s.undos,noOpAttempts:s.noOpAttempts,elapsed:s.elapsed,score:s.score,terminalFrozen:true});
  }
  add('ordinary multi-stone compaction, free no-op and exact B restoration retain charged moves before three public shortest-route wins',{normalWins:3,ordinaryModelInputOnly:true,notBrowserOrVideo:true});

  for(let d=0;d<3;d++)for(const type of ['orderedWrongHoles','holesWrongOrder']){
    const witness=puzzles[d].proof[type],s=execute(fresh(d),witness.path);assert.equal(s.phase,'playing');assert.equal(s.goalReady,false);assert.equal(s.strictlyIncreasing,type==='orderedWrongHoles');assert.equal(s.holesCorrect,type==='holesWrongOrder');
    report.ordinaryConjunctCounterexamples.push({level:d+1,type,path:witness.path,movesUsed:s.movesUsed,readValues:s.readValues,holeIds:s.holeIds,goalReady:s.goalReady});
  }
  add('ordinary reachable correctly ordered/wrong-hole and exact-hole/wrong-order layouts never win',{ordinaryCounterexamples:6});

  const boundary=fresh(),first=puzzles[0];for(let i=0;i<2;i++){focus(boundary,first.trial.actionId);press(boundary,'a');press(boundary,'b');}execute(boundary,first.proof.solution.path);assert.equal(boundary.phase,'won');assert.equal(boundary.movesUsed,boundary.moveLimit);assert.equal(boundary.movesRemaining,0);frozenTerminal(boundary);
  report.ordinaryLastMoveWin={level:1,movesUsed:boundary.movesUsed,undos:boundary.undos,elapsed:boundary.elapsed,score:boundary.score};
  for(let d=0;d<3;d++){const route=nonwinningWalk(puzzles[d].board),s=execute(fresh(d),route.path);assert.equal(s.phase,'lost');assert.equal(s.lostReason,'moves');assert.equal(s.movesUsed,s.moveLimit);assert.equal(s.movesRemaining,0);frozenTerminal(s);report.ordinaryBudgetLosses.push({level:d+1,path:route.path,searchExpanded:route.expanded,movesUsed:s.movesUsed,elapsed:s.elapsed,terminalFrozen:true});}
  add('a real final-budget success beats budget loss, while ordinary unsuccessful compactions exhaust each board and freeze',{ordinaryLastMoveWins:1,ordinaryBudgetLosses:3});

  const duplicate=fresh(),route=puzzles[0].proof.solution.path;execute(duplicate,route.slice(0,-1));duplicate.stones[1].value=duplicate.stones[0].value;Model.step(duplicate,1/60,{});observe(duplicate);execute(duplicate,route.slice(-1));
  assert.equal(duplicate.holesCorrect,true);assert.equal(duplicate.strictlyIncreasing,false);assert.equal(duplicate.phase,'playing');assert.equal(new Set(duplicate.readStoneIds).size,6);assert.equal(duplicate.readValues.filter(v=>v===1).length,2);
  const base={ids:['S1','S2'],values:[1,2],pillars:[],targets:Array.from({length:14},(_,i)=>i+2),moveLimit:6};const a=Array(16).fill(null),b=Array(16).fill(null);a[0]='S1';a[2]='S2';b[1]='S1';b[3]='S2';assert.notDeepEqual(a,b);assert.deepEqual(O.compact(base,a,'R1W').position,O.compact(base,b,'R1W').position);
  add('equal-valued distinct stones do not merge or satisfy strict order; compaction is demonstrably non-injective',{explicitDuplicateValueFixture:true,pureNonInjectivityFixture:true,noOrdinaryDuplicateBoardClaim:true});

  const atomic=fresh();focus(atomic,first.trial.actionId);const beforePos=pos(atomic),pred=clone(atomic.preview);step(atomic,{a:true});assert.deepEqual(pos(atomic),assignPosition(pred.afterAssignments));assert.ok(atomic.transition);const started=atomic.transition.startedAt;
  assert.ok(pred.movedCount>=2);step(atomic);step(atomic,{a:true});assert.equal(atomic.noOpAttempts,1);assert.equal(atomic.transition.startedAt,started);step(atomic,{},.25);assert.equal(atomic.transition,null);assert.ok(atomic.message.includes('未消耗步数'));press(atomic,'b');assert.deepEqual(pos(atomic),beforePos);assert.equal(atomic.transition.kind,'undo');step(atomic,{},.25);assert.equal(atomic.transition,null);
  add('multi-stone layouts commit atomically and transition expiry is not extended by a no-op',{transitionSeconds:.24,ordinaryInput:true});

  const pending=fresh();focus(pending,first.trial.actionId);const pp=clone(pos(pending));step(pending,{aPressed:true},0);assert.deepEqual(pos(pending),pp);assert.equal(pending.movesUsed,0);step(pending,{cancelEpoch:1,cancelled:true},1/120);step(pending,{cancelEpoch:1},1/120);assert.equal(pending.movesUsed,0);
  step(pending,{aPressed:true},0);step(pending,{},1/120);assert.equal(pending.movesUsed,0);step(pending,{},1/120);assert.equal(pending.movesUsed,1);const hist=clone(pending.history);step(pending,{a:true},.25);assert.equal(pending.movesUsed,1);assert.equal(pending.compactionAttempts,2);assert.equal(pending.noOpAttempts,1);assert.deepEqual(pending.history,hist);
  step(pending);const charged=pending.movesUsed;step(pending,{aPressed:true,bPressed:true},.25);assert.equal(pending.undos,1);assert.equal(pending.movesUsed,charged);assert.equal(pending.historyDepth,0);assert.deepEqual(pos(pending),pp);
  const cancelled=fresh();step(cancelled,{cancelEpoch:10});const focusBefore=cancelled.selectedId;step(cancelled,{cancelEpoch:11,aPressed:true,bPressed:true,x:1},.25);assert.equal(cancelled.movesUsed,0);assert.equal(cancelled.selectedId,focusBefore);assert.equal(cancelled.compactionAttempts,0);
  add('zero/subtick edges, cancellation, held A and coalesced B/A preserve action budget and discard canceled work',{syntheticInputTiming:true,noRuntimeDeviceClaim:true});

  const deadline=fresh();execute(deadline,first.proof.solution.path.slice(0,-1));focus(deadline,first.proof.solution.path.at(-1));assert.equal(deadline.preview.willWin,true);const layoutBefore=pos(deadline),used=deadline.movesUsed;
  deadline.tick=5399;deadline.elapsed=5399/60;deadline.remaining=1/60;step(deadline,{aPressed:true});assert.equal(deadline.phase,'lost');assert.equal(deadline.lostReason,'timeout');assert.equal(deadline.movesUsed,used);assert.deepEqual(pos(deadline),layoutBefore);frozenTerminal(deadline);
  const dt=fresh();for(const v of [NaN,Infinity,-1])step(dt,{},v);assert.equal(dt.tick,0);step(dt,{},100);assert.equal(dt.tick,15);
  const x=fresh(2),y=fresh(2);assert.deepEqual(x,y);assert.notEqual(x.cells,y.cells);assert.notEqual(x.stones,y.stones);assert.notEqual(x.history,y.history);x.cells[0].stoneId=null;assert.equal(y.cells[0].stoneId,'S1');
  add('deadline precedes a predicted winning move; time clamps and fresh fixed retries remain isolated',{clockOnlyFixtureTick:5399,terminalFreezeIncludesPrivateAndPublicFields:true});
  report.passed=true;
}catch(error){report.error={name:error.name,message:error.message,stack:error.stack};process.exitCode=1;}
finally{
  report.sourceHashesAfter=await hashes();report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(report.sourceHashesAfter);if(!report.sourceUnchanged){report.passed=false;report.error={message:'Source changed during review'};process.exitCode=1;}
  report.totals={checks:report.checks.length,observations,navigationInputs,orderedFocusPairs:focusPairs,explicitPublicGeometryFixtures:geometryFixtures,ordinaryWins:report.ordinaryWins.length,ordinaryGoalCounterexamples:report.ordinaryConjunctCounterexamples.length,ordinaryBudgetLosses:report.ordinaryBudgetLosses.length};
  report.limitations=['Small reviewed authored-board searches are not exhaustive over all 4x4 permutations.','324 ternary line cases are explicitly synthetic public geometry, not ordinary authored play.','Equal-value and final-clock fixtures are labelled; normal wins and failures use original boards and ordinary inputs.','Fast Model input sequences are not software-browser recordings or physical-device tests.'];
  await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,totals:report.totals,sourceUnchanged:report.sourceUnchanged,output,error:report.error?.message}));
}
