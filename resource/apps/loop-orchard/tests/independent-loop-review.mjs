import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { evaluatePublicBoard, solvePublicBoard } from './independent-loop-board.mjs';

const argv = process.argv.slice(2), option = (name, fallback) => {
  const i = argv.indexOf(name); return i < 0 ? fallback : argv[i + 1];
};
const app = resolve(option('--app', fileURLToPath(new URL('..', import.meta.url))));
const output = option('--output'); assert.ok(output, 'Provide --output report.json');
const modelPath = resolve(app, 'src/main/assets/game-model.js');
const require = createRequire(import.meta.url), hash = b => createHash('sha256').update(b).digest('hex');
const files = { model: modelPath, contract: resolve(app, 'docs/model-contract.md'),
  review: fileURLToPath(import.meta.url), math: resolve(dirname(fileURLToPath(import.meta.url)), 'independent-loop-math.mjs'),
  boardOracle: resolve(dirname(fileURLToPath(import.meta.url)), 'independent-loop-board.mjs') };
const hashes = async () => Object.fromEntries(await Promise.all(Object.entries(files).map(async ([k,p]) => [k,hash(await readFile(p))])));
const startHashes = await hashes();
const expected = option('--expected-model'); if (expected) assert.equal(startHashes.model, expected);
const Model = require(modelPath); assert.equal(Model.TICK_HZ, 60);
const clone = x => JSON.parse(JSON.stringify(x));
const checks = [], puzzles = [], wins = [], doubleRejections = [], diagnostics = [];
const totals = { observations: 0, ordinaryWins: 0, topologyOnlyRejections: 0, orderedFocusPairs: 0, navigationInputs: 0 };
const directions = { E: {x:1,y:0}, S: {x:0,y:1}, W: {x:-1,y:0}, N: {x:0,y:-1} };
const assignment = s => s.edges.map(e => e.pipeId);

function audit(s) {
  const f = evaluatePublicBoard(s); totals.observations++;
  for (const row of f.vertices) for (const [k,v] of Object.entries(row)) assert.deepEqual(s.vertices.find(x=>x.id===row.id)[k],v,'vertex '+row.id+' '+k);
  for (const row of f.edges) for (const [k,v] of Object.entries(row)) assert.deepEqual(s.edges.find(x=>x.id===row.id)[k],v,'edge '+row.id+' '+k);
  for (const row of f.plots) for (const [k,v] of Object.entries(row)) assert.deepEqual(s.plots.find(x=>x.id===row.id)[k],v,'plot '+row.id+' '+k);
  assert.deepEqual(s.components,f.components);
  for (const [k,v] of Object.entries(f.summary)) if (!['reason','withinStock'].includes(k)) assert.deepEqual(s[k],v,'summary '+k);
  assert.equal(s.pipeStock,16); assert.equal(s.pipes.length,16);
  const ids=s.pipes.map(p=>p.id); assert.deepEqual(ids,Array.from({length:16},(_,i)=>'P'+(i+1)));
  const occupied=s.edges.filter(e=>e.selected); assert.equal(new Set(occupied.map(e=>e.pipeId)).size,occupied.length);
  assert.ok(occupied.every(e=>ids.includes(e.pipeId)));
  for(const p of s.pipes) assert.equal(p.edgeId,s.edges.find(e=>e.pipeId===p.id)?.id??null);
  assert.deepEqual(s.availablePipeIds,s.pipes.filter(p=>p.edgeId===null).map(p=>p.id));
  assert.equal(s.pipeCount+s.pipesRemaining,16); assert.equal(s.pipesRemaining,s.availablePipeIds.length);
  assert.equal(s.totalEdits,s.placements+s.removals); assert.equal(s.totalEdits,s.historyDepth+s.undos);
  assert.equal(s.historyDepth,s.history.length); assert.equal(s.editAttempts,s.totalEdits+s.blockedPlacements);
  assert.equal(s.submissions,s.mistakes+(s.phase==='won'?1:0)); assert.equal(s.maxMistakes,3);
  assert.equal(s.elapsed,s.tick/60); assert.equal(s.remaining,Math.max(0,90-s.elapsed));
  assert.equal(s.score,s.pipeCount*10+s.matchedClueCount*25+s.treesCovered*20+(s.phase==='won'?1000+Math.floor(s.remaining)*5:0));
  const replay=Array(24).fill(null);
  for (const h of s.history) {
    const i=s.edges.findIndex(e=>e.id===h.edgeId); assert.ok(i>=0);
    assert.equal(replay[i],h.beforePipeId); assert.equal(h.at,h.tick/60); assert.ok(h.tick<=s.tick);
    if(h.kind==='place') {
      assert.equal(h.beforePipeId,null); assert.equal(h.afterPipeId,ids.find(id=>!replay.includes(id)));
    } else { assert.equal(h.kind,'remove'); assert.ok(ids.includes(h.beforePipeId)); assert.equal(h.afterPipeId,null); }
    replay[i]=h.afterPipeId;
  }
  assert.deepEqual(replay,assignment(s));
  assert.deepEqual(s.cursor,s.focusItems.find(x=>x.id===s.selectedId));
  assert.equal(s.focusItems.length,25); assert.equal(s.focusItems.at(-1).id,'pump');
  if(s.lastSubmission) {
    const r=s.lastSubmission;assert.equal(r.id,s.submissions);assert.equal(r.at,r.tick/60);assert.ok(r.tick<=s.tick);
    assert.equal(r.pipeAssignments.length,r.selectedEdgeIds.length);
    assert.deepEqual(r.pipeAssignments.map(p=>p.edgeId),r.selectedEdgeIds);
    assert.equal(new Set(r.pipeAssignments.map(p=>p.pipeId)).size,r.pipeAssignments.length);
    const mask=r.selectedEdgeIds.reduce((m,id)=>m|(1<<s.edges.findIndex(e=>e.id===id)),0),old=evaluatePublicBoard(s,mask);
    assert.deepEqual(r.checks,old.summary.checks);assert.equal(r.componentCount,old.summary.componentCount);
    assert.equal(r.reason,old.summary.reason);assert.equal(r.accepted,r.reason==='accepted');
  }
  if(s.phase==='won') { assert.equal(s.goalReady,true);assert.equal(s.lastSubmission?.accepted,true); }
  assert.ok(s.events.length<=32);return f;
}
function tick(s,input={},dt=1/60){Model.step(s,dt,input);audit(s);return s;}
function press(s,key){tick(s,{[key]:true});if(s.phase==='playing')tick(s,{});}
function nextFocus(s,id,name) {
  const from=s.focusItems.find(x=>x.id===id),d=directions[name];
  const ranked=s.focusItems.map((item,index)=>{
    const dx=item.x-from.x,dy=item.y-from.y,forward=dx*d.x+dy*d.y,side=d.x?dy:dx,dist=dx*dx+dy*dy;
    return {id:item.id,forward,rank:[dist+2*side*side,dist,Math.abs(side),index]};
  }).filter(x=>x.forward>0).sort((a,b)=>{for(let i=0;i<4;i++){if(a.rank[i]!==b.rank[i])return a.rank[i]-b.rank[i];}return 0;});
  return ranked[0]?.id??id;
}
function pathTo(s,target) {
  const queue=[[s.selectedId,[]]],seen=new Set([s.selectedId]);
  for(let q=0;q<queue.length;q++){
    const [id,path]=queue[q];if(id===target)return path;
    for(const name of Object.keys(directions)) {const to=nextFocus(s,id,name);if(!seen.has(to)){seen.add(to);queue.push([to,[...path,name]]);}}
  }
  throw new Error('Unreachable public focus '+target);
}
function select(s,target) {
  for(const name of pathTo(s,target)) {
    const next=nextFocus(s,s.selectedId,name);tick(s,directions[name]);assert.equal(s.selectedId,next);tick(s,{});totals.navigationInputs++;
  }
  assert.equal(s.selectedId,target);
}
function toggle(s,edgeId){select(s,edgeId);press(s,'a');}
function fresh(level=0){const s=Model.create(71,level);audit(s);return s;}
function draw(s,mask){for(const e of s.edges)if(mask&(1<<s.edges.indexOf(e)))toggle(s,e.id);assert.equal(evaluatePublicBoard(s).selectedMask,mask);}
async function group(name,fn){const details=await fn();checks.push({name,passed:true,...details});}

await group('public-puzzles-complete-cycle-space-solutions-and-topology-only-counterexamples',()=>{
  for(let level=0;level<3;level++) {
    const s=fresh(level),proof=solvePublicBoard(s);
    assert.ok(proof.solutions.length>0);assert.ok(proof.topologyOnlyCounterexamples.length>0);
    assert.equal(s.plots.filter(p=>p.clue===null).length,1);
    assert.ok(proof.solutions.every(mask=>evaluatePublicBoard(s,mask).summary.goalReady));
    assert.ok(proof.topologyOnlyCounterexamples.every(mask=>{const f=evaluatePublicBoard(s,mask).summary;return f.degreeTwo&&!f.singleLoop&&f.allTreesCovered&&f.flowersAvoided&&f.allCluesMet&&f.withinStock;}));
    puzzles.push({level:level+1,...proof});
  }
  return {scope:'All 512 fixed-geometry cycle-space masks are filtered using only each actual public board; no reference edge list, production solver or QA planner.',counts:puzzles.map(p=>({level:p.level,solutions:p.solutions.length,topologyOnlyCounterexamples:p.topologyOnlyCounterexamples.length,candidateCounts:p.candidateCounts}))};
});
await group('public-focus-graph-and-ordinary-navigation-reach-every-pair',()=>{
  let diameter=0;
  for(const from of fresh().focusItems.map(x=>x.id)) {
    const s=fresh();select(s,from);
    for(const to of s.focusItems.map(x=>x.id)) {select(s,from);const path=pathTo(s,to);diameter=Math.max(diameter,path.length);select(s,to);totals.orderedFocusPairs++;}
  }
  assert.equal(totals.orderedFocusPairs,625);return {orderedPairs:625,maximumShortestDistance:diameter,scope:'Ordinary direction press/release inputs; no selectedId assignment.'};
});
await group('all-unit-edges-removal-and-undo-update-incidence-regions-and-same-pipe',()=>{
  for(const id of fresh().edges.map(e=>e.id)) {
    const s=fresh();toggle(s,id);const placed=clone(s.lastEdit),before=assignment(s);
    assert.equal(s.edges.find(e=>e.id===id).pipeId,'P1');toggle(s,id);
    assert.equal(s.pipeCount,0);assert.ok(s.vertices.every(v=>v.degree===0&&v.componentId===null&&v.incidentEdgeIds.length===0));
    const removal=clone(s.lastEdit);assert.equal(removal.beforePipeId,'P1');press(s,'b');
    assert.deepEqual(assignment(s),before);assert.deepEqual(s.lastUndo.edit,removal);assert.equal(s.selectedId,id);
    press(s,'b');assert.equal(s.pipeCount,0);assert.deepEqual(s.lastUndo.edit,placed);assert.equal(s.totalEdits,2);assert.equal(s.undos,2);
  }
  return {ordinaryEdgeCases:24,scope:'Each real edge is placed, removed and reversed twice; isolated vertices and shared plot counts independently recomputed.'};
});
await group('finite-stock-lowest-free-ID-and-blocked-attempts-do-not-enter-history',()=>{
  const s=fresh();for(let i=0;i<16;i++)toggle(s,s.edges[i].id);
  assert.equal(s.pipesRemaining,0);assert.deepEqual(s.edges.slice(0,16).map(e=>e.pipeId),s.pipes.map(p=>p.id));
  const before=assignment(s),history=clone(s.history);toggle(s,'E17');
  assert.deepEqual(assignment(s),before);assert.deepEqual(s.history,history);assert.equal(s.blockedPlacements,1);assert.equal(s.mistakes,0);
  toggle(s,'E5');assert.deepEqual(s.availablePipeIds,['P5']);toggle(s,'E17');assert.equal(s.edges[16].pipeId,'P5');
  press(s,'b');assert.deepEqual(s.availablePipeIds,['P5']);press(s,'b');assert.deepEqual(assignment(s),before);assert.equal(s.edges[4].pipeId,'P5');
  return {stock:16,blockedPlacements:s.blockedPlacements,returnedAndRestoredId:'P5',totalEdits:s.totalEdits,undos:s.undos};
});
await group('ordinary-public-single-loops-require-explicit-PUMP-and-allow-unused-stock',()=>{
  for(let level=0;level<3;level++) {
    const s=fresh(level),mask=puzzles[level].solutions[0];draw(s,mask);
    assert.equal(s.phase,'playing');assert.equal(s.goalReady,true);assert.equal(s.submissions,0);assert.ok(s.pipesRemaining>0);
    tick(s,{},.25);assert.equal(s.phase,'playing');select(s,'pump');const before=assignment(s);press(s,'a');
    assert.equal(s.phase,'won');assert.deepEqual(assignment(s),before);assert.equal(s.submissions,1);assert.equal(s.mistakes,0);
    wins.push({level:level+1,mask,pipeCount:s.pipeCount,pipesRemaining:s.pipesRemaining,elapsed:s.elapsed,score:s.score,selectedEdgeIds:s.lastSubmission.selectedEdgeIds});totals.ordinaryWins++;
    const frozen=JSON.stringify(s);Model.step(s,.25,{x:1,aPressed:true,bPressed:true});assert.equal(JSON.stringify(s),frozen);
  }
  return {rounds:wins,scope:'Fast ordinary model input only; these sub-minute simulation timings are not a video or browser play duration.'};
});
await group('ordinary-multiple-loops-pass-all-local-rules-but-reject-and-lose-after-three-edges',()=>{
  for(let level=0;level<3;level++) {
    const s=fresh(level),mask=puzzles[level].topologyOnlyCounterexamples[0];draw(s,mask);
    assert.equal(s.degreeTwo,true);assert.equal(s.componentCount,2);assert.equal(s.allTreesCovered,true);assert.equal(s.flowersAvoided,true);assert.equal(s.allCluesMet,true);
    const before=assignment(s);select(s,'pump');tick(s,{a:true});assert.equal(s.lastSubmission.reason,'multiple-loops');
    const receipt=clone(s.lastSubmission);tick(s,{a:true},.25);assert.equal(s.submissions,1);tick(s,{});
    press(s,'a');assert.equal(s.phase,'playing');press(s,'a');assert.equal(s.phase,'lost');assert.equal(s.lostReason,'mistakes');
    assert.equal(s.mistakes,3);assert.equal(s.submissions,3);assert.deepEqual(assignment(s),before);assert.equal(receipt.id,1);
    doubleRejections.push({level:level+1,mask,pipeCount:s.pipeCount,componentCount:s.componentCount,checks:s.checks,reason:s.lastSubmission.reason,elapsed:s.elapsed});totals.topologyOnlyRejections++;
    const frozen=JSON.stringify(s);Model.step(s,.25,{bPressed:true,aPressed:true});assert.equal(JSON.stringify(s),frozen);
  }
  return {rounds:doubleRejections,scope:'Every counterexample is independently found from public clues; all non-topology requirements are true, no geometry fixture is applied.'};
});
await group('numeric-zero-is-not-null-and-diagnostic-priority-is-real',()=>{
  const s=fresh(),goal=puzzles[0].solutions[0],p=s.plots.find(p=>p.clue===null),i=s.plots.indexOf(p),f=evaluatePublicBoard(s,goal);
  assert.equal(f.plots[i].matched,null);assert.equal(f.summary.clueCount,8);assert.equal(f.summary.matchedClueCount,8);
  const synthetic=clone(s);synthetic.plots[i].clue=0;const changed=evaluatePublicBoard(synthetic,goal);
  assert.equal(changed.summary.clueCount,9);assert.equal(changed.plots[i].matched,changed.plots[i].selectedCount===0);
  const patterns=[{name:'empty',mask:0},{name:'leak',mask:1},{name:'branch',mask:(1<<3)|(1<<4)|(1<<13)}];
  for(const pattern of patterns){const m=fresh();draw(m,pattern.mask);select(m,'pump');press(m,'a');assert.equal(m.lastSubmission.reason,pattern.name);diagnostics.push({kind:pattern.name,reason:m.lastSubmission.reason,checks:m.checks});}
  return {unhintedPlot:p.id,unhintedSelectedCount:f.plots[i].selectedCount,ordinaryDiagnostics:diagnostics,scope:'Only the null-to-zero comparison is a cloned-public-rule mathematical fixture; PUMP diagnostics use ordinary input.'};
});
await group('undo-preserves-error-receipts-time-and-lifetime-counters',()=>{
  const s=fresh();toggle(s,'E1');select(s,'pump');press(s,'a');assert.equal(s.mistakes,1);
  const receipt=clone(s.lastSubmission),edit=clone(s.lastEdit),time=s.elapsed;press(s,'b');
  assert.equal(s.pipeCount,0);assert.equal(s.mistakes,1);assert.equal(s.submissions,1);assert.deepEqual(s.lastSubmission,receipt);
  assert.deepEqual(s.lastUndo.edit,edit);assert.equal(s.totalEdits,1);assert.equal(s.placements,1);assert.equal(s.undos,1);assert.ok(s.elapsed>time);
  const counters=[s.totalEdits,s.undos,s.submissions,s.mistakes];press(s,'b');assert.deepEqual([s.totalEdits,s.undos,s.submissions,s.mistakes],counters);
  toggle(s,'E2');assert.deepEqual(s.lastSubmission,receipt);assert.deepEqual(s.lastUndo.edit,edit);
  return {receiptRemainsDetached:true,lifetimeCountersNotRefunded:true};
});
await group('subtick-cancellation-and-B-priority-do-not-create-extra-edits',()=>{
  const s=fresh();Model.step(s,0,{cancelEpoch:0});Model.step(s,0,{aPressed:true,cancelEpoch:0});assert.equal(s.totalEdits,0);
  tick(s,{},1/120);assert.equal(s.totalEdits,0);tick(s,{cancelEpoch:1},1/120);assert.equal(s.totalEdits,0);
  press(s,'a');assert.equal(s.totalEdits,1);const before=assignment(s),history=clone(s.history),selected=s.selectedId;
  tick(s,{cancelEpoch:2,aPressed:true,bPressed:true,x:1});assert.deepEqual(assignment(s),before);assert.deepEqual(s.history,history);assert.equal(s.selectedId,selected);
  tick(s,{aPressed:true,bPressed:true,x:1});assert.equal(s.pipeCount,0);assert.equal(s.totalEdits,1);assert.equal(s.undos,1);assert.equal(s.selectedId,'E1');
  return {scope:'Explicit protocol boundary inputs on original model states; no forced geometry or terminal state.'};
});
await group('deadline-precedes-winning-PUMP-and-retry-is-the-same-fixed-puzzle',()=>{
  const s=fresh();draw(s,puzzles[0].solutions[0]);select(s,'pump');const before=assignment(s);
  s.tick=5399;s.elapsed=5399/60;s.remaining=1/60;s._accumulator=0;
  tick(s,{aPressed:true});assert.equal(s.phase,'lost');assert.equal(s.lostReason,'timeout');assert.equal(s.submissions,0);assert.deepEqual(assignment(s),before);
  const frozen=JSON.stringify(s);Model.step(s,.25,{aPressed:true,bPressed:true,x:1});assert.equal(JSON.stringify(s),frozen);
  const a=fresh(),b=Model.create(999,0);
  assert.deepEqual(a.vertices,b.vertices);assert.deepEqual(a.edges,b.edges);assert.deepEqual(a.plots,b.plots);assert.deepEqual(a.pipes,b.pipes);assert.equal(b.totalEdits,0);
  return {scope:'Only this deadline case moves the existing model clock to tick5399; it is explicitly a rule boundary fixture, never ordinary gameplay or recording evidence.',terminalFrozen:true,sameLayoutRetry:true};
});

const sourceHashesAfter=await hashes();assert.deepEqual(sourceHashesAfter,startHashes);
const report={schema:1,kind:'independent-loop-cycle-space-review',passed:true,checkCount:checks.length,checks,sourceHashes:startHashes,sourceHashesAfter,sourceUnchanged:true,
  totals,publicPuzzles:puzzles,ordinaryWins:wins,ordinaryTopologyOnlyRejections:doubleRejections,
  scope:{publicFactsOnlySearch:true,productionSolverImported:false,qaSolverImported:false,authoringSolutionsRead:false,mathematicalFixturesSeparate:true,browserExecuted:false,normalGameplayVideoEvidence:false,physicalTvTested:false,physicalPhoneTested:false},
  limitations:['Cycle-space enumeration covers all even subgraphs; odd/open diagnostics are separate explicit ordinary-input cases.','Fast legal model inputs are not real-time browser or device evidence.','One clock boundary is an explicitly labelled fixture; every reported normal win and multiple-loop rejection uses only ordinary inputs.']};
await writeFile(output,JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify({passed:true,checks:checks.length,totals,sourceHashes:startHashes})+'\n');
