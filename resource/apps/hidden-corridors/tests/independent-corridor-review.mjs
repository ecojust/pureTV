#!/usr/bin/env node
// Targeted independent black-box rule checks; fixture states are labelled separately.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const args={};for(let i=2;i<process.argv.length;i+=2){assert(['--app','--output','--math','--expected-model'].includes(process.argv[i])&&process.argv[i+1]);args[process.argv[i].slice(2)]=process.argv[i+1];}
const own=fileURLToPath(import.meta.url),app=path.resolve(args.app||path.join(path.dirname(own),'..'));
const out=path.resolve(args.output||path.join(app,'docs','independent-corridor-review.json'));
const mathPath=path.resolve(args.math||path.join(path.dirname(own),'independent-corridor-math.mjs'));
const math=await import(pathToFileURL(mathPath));
const modelPath=path.join(app,'src/main/assets/game-model.js'),contractPath=path.join(app,'docs/model-contract.md');
const hash=b=>createHash('sha256').update(b).digest('hex'),clone=x=>JSON.parse(JSON.stringify(x));
const sourceHashes={model:hash(await readFile(modelPath)),contract:hash(await readFile(contractPath)),review:hash(await readFile(own)),mathematics:hash(await readFile(mathPath))};
if(args['expected-model'])assert.equal(sourceHashes.model,args['expected-model']);
const Model=createRequire(import.meta.url)(modelPath),T=1/60,checks=[],normalRounds=[],clueProofs=[],truthAudit=[];
const directions={N:{x:0,y:-1},E:{x:1,y:0},S:{x:0,y:1},W:{x:-1,y:0}};
const neighbors=id=>Array.from({length:16},(_,n)=>n).filter(n=>Math.abs(n%4-id%4)+Math.abs(Math.floor(n/4)-Math.floor(id/4))===1);
const step=(s,input={},dt=T)=>Model.step(s,dt,input);
const tap=(s,key)=>{step(s,{[key]:true});step(s,{});};
const move=(s,name)=>{step(s,directions[name]);step(s,{});};
function gotoProbe(s,id){assert.equal(s.mode,'probe');while(s.selectedId%4!==id%4)move(s,s.selectedId%4<id%4?'E':'W');while(Math.floor(s.selectedId/4)!==Math.floor(id/4))move(s,s.selectedId<id?'S':'N');assert.equal(s.selectedId,id);}
function along(s,route){assert.equal(s.mode,'route');assert.equal(s.selectedId,route[0]);for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i];assert(neighbors(a).includes(b));move(s,b===a+1?'E':b===a-1?'W':b>a?'S':'N');assert.equal(s.selectedId,b);}}
const known=s=>s.cells.map(c=>c.knowledge==='unknown'?null:c.knowledge==='open');
const clue=s=>({rowOpenCounts:s.rowOpenCounts.slice(),entry:s.entry.id,exit:s.exit.id,requiredDistance:s.requiredDistance,probeBudget:s.probeBudget});
const publicClue=s=>({rowOpenCounts:s.rowOpenCounts.slice(),entryId:s.entry.id,exitId:s.exit.id,requiredDistance:s.requiredDistance,probeBudget:s.probeBudget,known:known(s)});
const geometry=s=>({mode:s.mode,probeCursorId:s.probeCursorId,selectedId:s.selectedId,path:clone(s.path),visited:s.visited.slice(),cells:clone(s.cells),probeLog:clone(s.probeLog),probesUsed:s.probesUsed,totalWrong:s.totalWrong,exhaustedStrikes:s.exhaustedStrikes});
function verify(s){
  assert.equal(s.cells.length,16);assert.equal(s.probesUsed,s.probeLog.length);assert.equal(s.probesRemaining,s.probeBudget-s.probesUsed);
  assert.equal(s.revealedCount,2+s.probesUsed);assert.equal(s.cells.filter(c=>c.probed).length,s.probesUsed);
  assert.equal(s.pathEdges,s.path.length-1);assert.deepEqual(s.visited,Array.from({length:16},(_,i)=>s.path.some(p=>p.cellId===i)));
  assert.equal(s.atExit,s.path.at(-1).cellId===s.exit.id);assert.equal(s.lengthMatches,s.pathEdges===s.requiredDistance);
  assert.equal(s.elapsed,s.tick/60);assert.equal(s.remaining,Math.max(0,90-s.elapsed));
  const expected=s.probesUsed*40+Math.min(s.pathEdges,s.requiredDistance)*10+(s.phase==='won'?1000+s.probesRemaining*100+Math.floor(s.remaining)*5:0);assert.equal(s.score,expected);
  for(let i=0;i<16;i++){const c=s.cells[i];assert.equal(c.id,i);assert.deepEqual(Object.keys(c).sort(),['id','col','row','x','y','role','knowledge','probed'].sort());assert(['unknown','open','wall'].includes(c.knowledge));if(c.knowledge==='unknown')assert.equal(c.probed,false);}
  for(const e of s.probeLog){assert.equal(s.cells[e.cellId].knowledge,e.result);assert.equal(e.at,e.tick/60);}
}
async function check(name,scope,fn){const detail=await fn();checks.push({name,scope,passed:true,...(detail||{})});console.log(JSON.stringify({check:checks.length,name,passed:true}));}
function paths(entry,exit,length){const routes=[];function walk(route){const a=route.at(-1);if(a===exit){if(route.length-1===length)routes.push(route);return;}if(route.length-1>=length)return;for(const b of neighbors(a))if(!route.includes(b))walk([...route,b]);}walk([entry]);return routes;}
function fixtureRoute(s,ids){s.mode='route';s.path=ids.map(id=>({cellId:id,col:id%4,row:Math.floor(id/4),x:110+(id%4+.5)*84,y:106+(Math.floor(id/4)+.5)*84}));step(s,{});}
function drain(s){if(s.mode==='route'){while(s.path.length>1)tap(s,'b');tap(s,'b');}for(const c of s.cells)if(s.probesRemaining&&c.knowledge==='unknown'){gotoProbe(s,c.id);tap(s,'a');}assert.equal(s.probesRemaining,0);assert.equal(s.phase,'playing');}

// This test-only reconstruction is deliberately never an argument to the public
// solver below. Each hidden cell is obtained with a fresh ordinary one-probe run.
const reconstructed=[];
await check('Fresh ordinary single-cell probes reconstruct clues and fixed retry map','Black-box rule oracle, not a normal gameplay route',()=>{
  for(let d=0;d<3;d++){
    const reference=Model.create(17,d);let mask=0,retries=0;
    for(let id=0;id<16;id++){
      const observations=[];
      for(const seed of [17,983]){
        const s=Model.create(seed,d);gotoProbe(s,id);const before=known(s);tap(s,'a');verify(s);
        const endpoint=id===s.entry.id||id===s.exit.id;assert.equal(s.probesUsed,endpoint?0:1);assert.equal(s.probeAttempts,1);
        assert.equal(s.lastProbe.charged,!endpoint);assert.equal(s.lastProbe.reason,endpoint?'known':'revealed');
        assert.deepEqual(known(s).filter((_,i)=>i!==id),before.filter((_,i)=>i!==id));observations.push(s.cells[id].knowledge);retries++;
      }
      assert.equal(observations[0],observations[1]);if(observations[0]==='open')mask|=1<<id;
    }
    const rows=Array.from({length:4},(_,row)=>Array.from({length:4},(_,col)=>Boolean(mask&(1<<(row*4+col)))).filter(Boolean).length);
    assert.deepEqual(rows,reference.rowOpenCounts);const route=math.shortestPath(mask,reference.entry.id,reference.exit.id);assert(route);assert.equal(route.length-1,reference.requiredDistance);
    reconstructed.push(mask);truthAudit.push({level:d+1,freshRuns:retries,paidSingleCellRuns:28,freeEndpointRuns:4,observedMapSha256:hash(JSON.stringify(Array.from({length:16},(_,id)=>Boolean(mask&(1<<id))))),rowCountsVerified:true,shortestEdgeDistanceVerified:true,sameAcrossFreshSeeds:true});
  }
  return {levels:truthAudit};
});

await check('All public candidate worlds and exact minimax probe bounds','Independent full 16-bit enumeration and both-outcome certificates; no selected truth input',()=>{
  for(let d=0;d<3;d++){
    const s=Model.create(1,d),c=clue(s),e=math.enumerateCandidates(c);assert(e.candidates.length>=2);assert.equal(e.counts.allMasksVisited,65536);
    const initialPath=math.shortestPath(math.intersectionMask(e.candidates),c.entry,c.exit);assert(initialPath===null||initialPath.length-1!==c.requiredDistance);
    const proof=math.solveMinimax(c,e.candidates),verified=math.verifyCertificate({clue:c,candidateMasks:e.candidates,strategy:proof.strategy,lowerBoundCertificate:proof.lowerBoundCertificate});
    assert.equal(proof.status,'exact');assert.equal(verified.exactMinimum,proof.minimumDepth);assert(proof.minimumDepth<=s.probeBudget);assert.equal(verified.coveredWorlds,e.candidates.length);
    clueProofs.push({level:d+1,clues:c,candidateCount:e.candidates.length,candidateMasksSha256:hash(JSON.stringify(e.candidates)),initialCommonSafeRoute:false,minimumWorstCaseProbes:proof.minimumDepth,certificateVerification:verified,decisionStates:proof.stats.decisionStates});
  }
  assert(clueProofs.some(r=>r.clues.requiredDistance>Math.abs(r.clues.entry%4-r.clues.exit%4)+Math.abs(Math.floor(r.clues.entry/4)-Math.floor(r.clues.exit/4))));
  return {levels:clueProofs,selectedTruthUsed:false};
});

await check('Known/duplicate probes are free and quota exhaustion reveals nothing','Ordinary movement and A input',()=>{
  const s=Model.create(1,0);tap(s,'a');assert.equal(s.probesUsed,0);assert.equal(s.repeatedProbes,1);
  const id=s.cells.find(c=>c.knowledge==='unknown').id;gotoProbe(s,id);tap(s,'a');const actual=clone(s.probeLog);tap(s,'a');assert.deepEqual(s.probeLog,actual);assert.equal(s.probesUsed,1);
  drain(s);assert.equal(s.exhaustedStrikes,0);const unknown=s.cells.find(c=>c.knowledge==='unknown').id;gotoProbe(s,unknown);const k=known(s);tap(s,'a');assert.deepEqual(known(s),k);assert.equal(s.lastProbe.result,null);assert.equal(s.lastProbe.reason,'exhausted');assert.equal(s.lastProbe.charged,false);assert.equal(s.blockedProbes,1);
  const e=s.probeLog[0];gotoProbe(s,e.cellId);tap(s,'a');assert.equal(s.lastProbe.result,e.result);assert.equal(s.probesRemaining,0);assert.equal(s.phase,'playing');verify(s);
  const at=s.lastProbe.at,expires=s.lastProbe.expiresAt;assert.equal(expires,at+.6);for(let i=0;i<40;i++)step(s,{});assert.equal(s.lastProbe,null);assert.equal(s.probeLog.length,s.probeBudget);
});

await check('Route marking uses public knowledge, no hidden collision or wrapping','Ordinary route/probe/back input; black-box map only selects a targeted test route',()=>{
  const s=Model.create(1,0),mask=reconstructed[0];gotoProbe(s,10);tap(s,'b');assert.equal(s.selectedId,s.entry.id);
  const route=paths(s.entry.id,s.exit.id,s.requiredDistance).find(p=>p.some(id=>!(mask&(1<<id))));assert(route);
  let firstWall=-1;for(let i=1;i<route.length;i++){along(s,[route[i-1],route[i]]);if(!(mask&(1<<route[i]))){firstWall=route[i];break;}}
  assert(firstWall>=0);assert.equal(s.cells[firstWall].knowledge,'unknown');assert.equal(s.totalWrong,0);
  const pathBefore=clone(s.path),knowledgeBefore=known(s);tap(s,'a');assert.equal(s.lastSubmission.reason,'endpoint');assert.deepEqual(known(s),knowledgeBefore);
  const removed=s.path.at(-1).cellId;tap(s,'b');assert.equal(s.visited[removed],false);assert.equal(s.path.length,pathBefore.length-1);
  while(s.path.length>1)tap(s,'b');tap(s,'b');assert.equal(s.mode,'probe');assert.equal(s.selectedId,10);gotoProbe(s,firstWall);tap(s,'a');assert.equal(s.cells[firstWall].knowledge,'wall');
  tap(s,'b');const prefix=route.slice(0,route.indexOf(firstWall));along(s,prefix);const before=s.path.map(p=>p.cellId);const parent=prefix.at(-1);move(s,firstWall===parent+1?'E':firstWall===parent-1?'W':firstWall>parent?'S':'N');assert.deepEqual(s.path.map(p=>p.cellId),before);assert.equal(s.lastAction.reason,'known-wall');
  const e=Model.create(1,0);tap(e,'b');move(e,'W');assert.deepEqual(e.path.map(p=>p.cellId),[0]);move(e,'E');move(e,'W');assert.deepEqual(e.path.map(p=>p.cellId),[0,1]);assert.equal(e.lastAction.reason,'visited');
  const w=Model.create(1,0);gotoProbe(w,3);move(w,'E');assert.equal(w.selectedId,3);gotoProbe(w,12);move(w,'W');assert.equal(w.selectedId,12);verify(s);verify(e);verify(w);
});

await check('Public validation priority, generic unsafe verdict and actual wall authority','Ordinary unsafe route plus labelled invalid-shape/public-state adversarial fixtures',()=>{
  const initial=Model.create(1,0),mask=reconstructed[0],routes=paths(initial.entry.id,initial.exit.id,initial.requiredDistance),bad=routes.find(r=>r.some(id=>!(mask&(1<<id))));assert(bad);
  const s=Model.create(1,0);tap(s,'b');along(s,bad);assert.equal(s.phase,'playing');assert.equal(s.atExit,true);const before=known(s);tap(s,'a');assert.equal(s.lastSubmission.reason,'unsafe');assert.deepEqual(known(s),before);assert.equal(s.probesUsed,0);assert.equal(s.exhaustedStrikes,0);
  assert.deepEqual(Object.keys(s.lastSubmission).sort(),['id','accepted','reason','routeIds','pathEdges','requiredDistance','probesRemaining','chargedStrike','exhaustedStrikes','at'].sort());const receipt=clone(s.lastSubmission);tap(s,'b');assert.deepEqual(s.lastSubmission,receipt);
  const cases=[{ids:[0,1,0,4],reason:'shape'},{ids:[0,3,15],reason:'shape'},{ids:[0,1],reason:'endpoint'}];
  const long=paths(0,15,8).find(r=>r.some(id=>!(mask&(1<<id))));assert(long);cases.push({ids:long,reason:'length'});
  for(const fixture of cases){const f=Model.create(1,0);fixtureRoute(f,fixture.ids);tap(f,'a');assert.equal(f.lastSubmission.reason,fixture.reason);assert.equal(f.probesUsed,0);assert.equal(f.revealedCount,2);}
  const forged=Model.create(1,0);fixtureRoute(forged,bad);for(const c of forged.cells)c.knowledge='open';tap(forged,'a');assert.equal(forged.lastSubmission.reason,'unsafe');assert.equal(forged.phase,'playing');
  return {ordinaryUnsafeSubmission:true,shapeFixtureCases:3,longUnsafeRouteRejectedForPublicLengthFirst:true,forgedPublicKnowledgeDidNotOverridePrivateWalls:true};
});

await check('Only new post-exhaustion submissions charge strikes, exactly once per press','Ordinary A/B/probe input including held A and aggregated steps',()=>{
  const s=Model.create(1,0);tap(s,'b');for(let i=0;i<4;i++)tap(s,'a');assert.equal(s.totalWrong,4);assert.equal(s.exhaustedStrikes,0);
  drain(s);assert.equal(s.totalWrong,4);assert.equal(s.exhaustedStrikes,0);tap(s,'b');
  for(let i=0;i<3;i++){step(s,{a:true},.25);assert.equal(s.exhaustedStrikes,1);assert.equal(s.totalWrong,5);}step(s,{});tap(s,'a');assert.equal(s.exhaustedStrikes,2);assert.equal(s.phase,'playing');tap(s,'a');
  assert.equal(s.phase,'lost');assert.equal(s.lostReason,'strikes');assert.equal(s.exhaustedStrikes,3);assert.equal(s.totalWrong,7);assert.equal(s.submissions,7);verify(s);
});

await check('B arbitration, directional repeat and zero-step cancellation','Targeted input protocol fixtures; no browser gameplay claim',()=>{
  const s=Model.create(1,0);gotoProbe(s,1);step(s,{b:true,a:true,x:1});assert.equal(s.mode,'route');assert.equal(s.selectedId,s.entry.id);assert.equal(s.submissions,0);assert.equal(s.probesUsed,0);step(s,{});step(s,{});assert.equal(s.submissions,0);
  const a=Model.create(1,0),b=Model.create(1,0);step(a,{b:true,a:true,x:1},.25);for(let i=0;i<15;i++)step(b,{b:true,a:i===0,x:1});assert.deepEqual(geometry(a),geometry(b));assert.equal(a.submissions,0);
  const z=Model.create(1,0);gotoProbe(z,1);const before=clone(z);step(z,{aPressed:true},0);assert.equal(z.tick,before.tick);assert.equal(z.probesUsed,0);step(z,{});assert.equal(z.probesUsed,1);
  const c=Model.create(1,0);gotoProbe(c,1);step(c,{aPressed:true},0);const unchanged=geometry(c);step(c,{cancelled:true,cancelEpoch:1},0);step(c,{});assert.deepEqual(geometry(c),unchanged);assert.equal(c.probesUsed,0);
  const q=Model.create(1,0);gotoProbe(q,1);const beforeTick=q.tick;step(q,{a:true,cancelEpoch:3},0);step(q,{a:true,cancelEpoch:4},.25);assert.equal(q.probesUsed,0);assert.equal(q.tick,beforeTick+15);
  const held=Model.create(1,0);step(held,{x:1});assert.equal(held.selectedId,1);for(let i=0;i<19;i++)step(held,{x:1});assert.equal(held.selectedId,1);step(held,{x:1});assert.equal(held.selectedId,2);for(let i=0;i<9;i++)step(held,{x:1});assert.equal(held.selectedId,2);step(held,{x:1});assert.equal(held.selectedId,3);
  return {cancelledFramesStillConsumeActiveTime:true,pauseScope:'Shared runtime pause is outside this pure-model test.'};
});

await check('Only original create states have truth; state identity and terminal isolation','State identity boundary and terminal/timeout synthetic fixtures',async()=>{
  const s=Model.create(1,0);assert.deepEqual(Object.keys(Model).sort(),['create','step','TICK_HZ'].sort());assert.throws(()=>Model.step(clone(s),T,{}),/original create/);
  const other={module:{exports:{}},exports:{}};vm.runInNewContext(await readFile(modelPath,'utf8'),other);const foreign=other.module.exports.create(1,0);assert.throws(()=>Model.step(foreign,T,{}),/original create/);
  const pathsafe=math.shortestPath(reconstructed[0],s.entry.id,s.exit.id);fixtureRoute(s,pathsafe);s.tick=5399;s.elapsed=s.tick/60;s.remaining=90-s.elapsed;step(s,{a:true});assert.equal(s.phase,'lost');assert.equal(s.lostReason,'timeout');assert.equal(s.submissions,0);
  const terminal=JSON.stringify(s);step(s,{a:true,b:true,x:1,cancelEpoch:999},.25);assert.equal(JSON.stringify(s),terminal);
  const retry=Model.create(1,0);assert.equal(retry.phase,'playing');assert.equal(retry.probesUsed,0);assert.equal(retry.totalWrong,0);assert.equal(retry.probeLog.length,0);retry.cells[2].knowledge='open';assert.equal(Model.create(1,0).cells[2].knowledge,'unknown');
  return {clonesRejected:true,foreignModuleStatesRejected:true,timeoutBeforePotentialWinningSubmission:true};
});

await check('Three ordinary public-only probe/route/submission completions','Normal model input, independent public minimax; not browser or real hardware capture',()=>{
  for(let d=0;d<3;d++){
    const s=Model.create(1,d),initial=math.analyze(publicClue(s));let node=initial.policy,candidates=initial.candidates,observations=[];
    while(node.kind==='probe'){
      const id=node.cell;assert.equal(s.cells[id].knowledge,'unknown');const yes=candidates.filter(m=>m&(1<<id)),no=candidates.filter(m=>!(m&(1<<id)));assert(yes.length&&no.length);
      gotoProbe(s,id);tap(s,'a');const open=s.cells[id].knowledge==='open';assert.equal(s.probeLog.at(-1).cellId,id);observations.push({cellId:id,result:s.cells[id].knowledge,candidateCountBefore:candidates.length,candidateCountAfter:open?yes.length:no.length});candidates=open?yes:no;node=open?node.open:node.blocked;
    }
    assert.equal(node.kind,'safe-route');assert.equal(node.route.length,s.requiredDistance+1);assert(candidates.every(m=>node.route.every(id=>m&(1<<id))));assert(s.probesUsed<=s.probeBudget);
    const observedBefore=known(s);tap(s,'b');along(s,node.route);assert.equal(s.phase,'playing');assert.equal(s.atExit,true);const edges=s.pathEdges;move(s,'N');assert.equal(s.pathEdges,edges);tap(s,'a');assert.equal(s.phase,'won');assert.equal(s.lastSubmission.accepted,true);assert.deepEqual(known(s),observedBefore);verify(s);
    const frozen=JSON.stringify(s);step(s,{a:true,b:true,x:-1,cancelled:true},.25);assert.equal(JSON.stringify(s),frozen);
    normalRounds.push({level:s.level,phase:s.phase,probesUsed:s.probesUsed,probeBudget:s.probeBudget,remainingCandidateCount:candidates.length,pathEdges:s.pathEdges,requiredDistance:s.requiredDistance,routeIds:node.route,observations,elapsed:s.elapsed,score:s.score,submissions:s.submissions,totalWrong:s.totalWrong,unprobedCellsRemainUnknown:s.cells.filter(c=>c.knowledge==='unknown').length,safeForEveryRemainingCandidate:true,selectedTruthReadByPlanner:false});
  }
  return {rounds:normalRounds};
});

const after={model:hash(await readFile(modelPath)),contract:hash(await readFile(contractPath)),review:hash(await readFile(own)),mathematics:hash(await readFile(mathPath))};assert.deepEqual(after,sourceHashes);
const compactProofs=clueProofs.map(({certificateVerification,...p})=>({...p,certificateVerification:{...certificateVerification,worstBranch:undefined}}));
const report={schema:1,kind:'independent-hidden-corridor-rule-review',passed:true,checks,checkCount:checks.length,sourceHashes,sourceHashesAfter:after,sourceUnchanged:true,mathematics:compactProofs,truthAudit,ordinaryPublicOnlyRounds:normalRounds,
 scope:{modelRulesExecuted:true,publicWorldEnumeration:true,selectedTruthAccess:'Only a separate black-box audit through fresh ordinary single-cell probes; no WeakMap/source constant access by the script or normal planner.',privateModelReaderExported:false,fixtureChecksSeparateFromOrdinaryRounds:true,ordinaryRoundsUseOnlyPublicCluesAndObservedProbeResults:true,browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false},
 limitations:['Point-cell fixed-grid puzzle verification, not browser/controller/hardware validation.','Source-level model audit can see authored constants; the public-state secrecy boundary is specifically runtime snapshots.','The independent minimax strategy is a test oracle and is not the production observation pilot.']};
await mkdir(path.dirname(out),{recursive:true});await writeFile(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length,ordinaryRounds:normalRounds.length,output:out}));
