#!/usr/bin/env node
// Independent public geometry/union-find search plus explicitly labelled rule fixtures.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const args={};for(let i=2;i<process.argv.length;i+=2){assert(['--app','--output','--geometry','--expected-model'].includes(process.argv[i])&&process.argv[i+1]);args[process.argv[i].slice(2)]=process.argv[i+1];}
const own=fileURLToPath(import.meta.url),app=path.resolve(args.app||path.join(path.dirname(own),'..'));
const output=path.resolve(args.output||path.join(app,'docs/independent-island-review.json'));
const geometryPath=path.resolve(args.geometry||path.join(path.dirname(own),'independent-island-geometry.mjs'));
const geometry=await import(pathToFileURL(geometryPath)),modelPath=path.join(app,'src/main/assets/game-model.js'),contractPath=path.join(app,'docs/model-contract.md');
const digest=b=>createHash('sha256').update(b).digest('hex'),clone=structuredClone;
async function hashes(){return{model:digest(await readFile(modelPath)),contract:digest(await readFile(contractPath)),review:digest(await readFile(own)),geometry:digest(await readFile(geometryPath))};}
const sourceHashes=await hashes();if(args['expected-model'])assert.equal(sourceHashes.model,args['expected-model']);
const Model=createRequire(import.meta.url)(modelPath),T=1/60,checks=[],puzzles=[],ordinaryWins=[],ordinaryLosses=[];
const D={N:{x:0,y:-1},E:{x:1,y:0},S:{x:0,y:1},W:{x:-1,y:0}};
let previewComparisons=0,navigationTransitions=0,bankSubsetCount=0;const previewReasons={};
const step=(s,i={},dt=T)=>Model.step(s,dt,i),tap=(s,k)=>{step(s,{[k]:true});step(s,{});};
const publicData=s=>({islands:s.islands.map(({id,gx,gy,color})=>({id,x:gx,y:gy,color})),pieces:s.pieces.map(({id,length,targetColor})=>({id,length,targetColor}))});

// Parent indices always merge toward the lowest index, independently deriving
// the canonical component names used by the public first-island-order ledger.
function network(data,bridges){
  const indices=new Map(data.islands.map((p,i)=>[p.id,i])),parent=data.islands.map((_,i)=>i),incident=data.islands.map(()=>[]);let cycles=0;
  function root(i){while(parent[i]!==i)i=parent[i];return i;}
  for(const b of bridges){const a=indices.get(b.sourceId),c=indices.get(b.targetId);assert(a!==undefined&&c!==undefined&&a!==c);const ra=root(a),rc=root(c);if(ra===rc)cycles++;else parent[Math.max(ra,rc)]=Math.min(ra,rc);incident[a].push(b.pieceId);incident[c].push(b.pieceId);}
  const roots=parent.map((_,i)=>root(i)),sizes=new Map();for(const r of roots)sizes.set(r,(sizes.get(r)||0)+1);
  return{count:sizes.size,largest:Math.max(...sizes.values()),cycles,components:roots.map(r=>data.islands[r].id),incident};
}
function verdict(data,bridges,pieceId,sourceId,targetId){
  const p=data.pieces.find(p=>p.id===pieceId),a=data.islands.find(i=>i.id===sourceId),b=data.islands.find(i=>i.id===targetId);assert(p&&a&&b);
  const local=geometry.validateBridgeGeometry({islands:data.islands,fromId:sourceId,toId:targetId,length:p.length,targetColor:p.targetColor});
  const mapping={'zero-length':'same-island','length-mismatch':'length','target-color':'color','through-island':'through-island'};
  let reason=local.reasons.length?mapping[local.reasons[0]]:null,blockingPieceId=null,blockingIslandId=reason==='through-island'?local.throughIslandIds[0]:null;
  if(!reason){const occupied=bridges.find(e=>(e.sourceId===sourceId&&e.targetId===targetId)||(e.sourceId===targetId&&e.targetId===sourceId));if(occupied){reason='occupied';blockingPieceId=occupied.pieceId;}}
  if(!reason){const crossing=bridges.find(e=>!geometry.segmentRelation(a,b,data.islands.find(i=>i.id===e.sourceId),data.islands.find(i=>i.id===e.targetId)).allowed);if(crossing){reason='intersection';blockingPieceId=crossing.pieceId;}}
  const components=reason?null:network(data,[...bridges,{pieceId,sourceId,targetId}]).count;
  return{pieceId,sourceId,targetId,length:p.length,targetColor:p.targetColor,distanceSquared:Number(local.actualLengthSquared),requiredSquared:Number(local.requiredLengthSquared),targetColorMatches:b.color===p.targetColor,valid:reason===null,reason,blockingPieceId,blockingIslandId,resultingComponentCount:components,
    wouldFinish:data.pieces.length-bridges.length===1,wouldConnectAll:components===1,wouldLoseDisconnected:reason===null&&data.pieces.length-bridges.length===1&&components!==1};
}
function edge(data,p,from,to){const piece=data.pieces.find(x=>x.id===p);return{id:'bridge-'+p,pieceId:p,sourceId:from,targetId:to,length:piece.length,targetColor:piece.targetColor};}

// Fixed physical-piece order exhaustive search: no MRV, production solver,
// provided reference solution, hidden fixture or difficulty-specific route.
function solve(data,{maxNodes=200000,maxMilliseconds=10000}={}){
  const started=performance.now(),domains=data.pieces.map(p=>data.islands.flatMap(a=>data.islands.filter(b=>verdict(data,[],p.id,a.id,b.id).valid).map(b=>edge(data,p.id,a.id,b.id))));
  let nodes=0,complete=0,connected=0,disconnected=0,win=null,loss=null;
  const before=JSON.stringify(data);
  function visit(i,bridges){assert(++nodes<=maxNodes,'Independent search node cap reached');if((nodes&63)===1)assert(performance.now()-started<maxMilliseconds,'Independent search time cap reached');
    if(i===data.pieces.length){complete++;const n=network(data,bridges);if(n.count===1){connected++;win??=clone(bridges);}else{disconnected++;loss??=clone(bridges);}return;}
    for(const b of domains[i])if(verdict(data,bridges,b.pieceId,b.sourceId,b.targetId).valid)visit(i+1,[...bridges,b]);
  }
  visit(0,[]);assert.equal(JSON.stringify(data),before);assert(win,'Public authored puzzle has no connected solution');
  return{complete:true,nodes,domains:domains.map((a,i)=>({pieceId:data.pieces[i].id,localPlacements:a.length})),configurations:complete,connectedConfigurations:connected,disconnectedConfigurations:disconnected,win,loss,limits:{maxNodes,maxMilliseconds},elapsedMilliseconds:performance.now()-started};
}

function next(nodes,id,direction){const from=nodes.find(p=>p.id===id),dir=D[direction];assert(from);const candidates=nodes.map((p,index)=>({p,index,dx:p.x-from.x,dy:p.y-from.y})).filter(p=>p.dx*dir.x+p.dy*dir.y>0);
  candidates.sort((a,b)=>(a.dx*a.dx+a.dy*a.dy)-(b.dx*b.dx+b.dy*b.dy)||Math.abs(a.dx*dir.y-a.dy*dir.x)-Math.abs(b.dx*dir.y-b.dy*dir.x)||a.index-b.index);
  return candidates[0]?.p.id??id;
}
function routeTo(nodes,from,to){const seen=new Set([from]),queue=[[from,[]]];for(const [id,keys] of queue){if(id===to)return keys;for(const d of Object.keys(D)){const n=next(nodes,id,d);if(!seen.has(n)){seen.add(n);queue.push([n,[...keys,d]]);}}}throw Error('Unreachable public focus '+from+' -> '+to);}
function navigate(s,id){const nodes=s.stage==='bank'?s.pieces.filter(p=>!p.placed).map(p=>({id:p.id,x:p.x,y:p.y})):s.islands.map(p=>({id:p.id,x:p.gx,y:p.gy}));
  const initial=s.stage==='bank'?s.selectedPieceId:s.selectedIslandId;
  for(const d of routeTo(nodes,initial,id)){const old=s.stage==='bank'?s.selectedPieceId:s.selectedIslandId,expected=next(nodes,old,d);step(s,D[d]);step(s,{});assert.equal(s.stage==='bank'?s.selectedPieceId:s.selectedIslandId,expected);navigationTransitions++;}
  assert.equal(s.stage==='bank'?s.selectedPieceId:s.selectedIslandId,id);
}
function selectPlacement(s,b){assert.equal(s.stage,'bank');navigate(s,b.pieceId);tap(s,'a');assert.equal(s.stage,'source');navigate(s,b.sourceId);tap(s,'a');assert.equal(s.stage,'target');navigate(s,b.targetId);}
function place(s,b){selectPlacement(s,b);assert.deepEqual(s.preview,verdict(publicData(s),s.bridges,b.pieceId,b.sourceId,b.targetId));assert(s.preview.valid);tap(s,'a');verify(s);}
function verify(s){
  const data=publicData(s),g=network(data,s.bridges),ids=s.bridges.map(b=>b.pieceId);assert.equal(new Set(ids).size,ids.length);
  assert.equal(s.placedCount,s.bridges.length);assert.equal(s.remainingPieces,s.pieces.length-s.placedCount);assert.equal(s.componentCount,g.count);assert.equal(s.connected,g.count===1);assert.equal(s.largestComponentSize,g.largest);
  assert.equal(s.totalPlacements,s.placedCount+s.undos);assert.equal(s.placementAttempts,s.totalPlacements+s.failedCommits);
  assert.deepEqual(s.availablePieceIds,s.pieces.filter(p=>!ids.includes(p.id)).map(p=>p.id));
  for(const p of s.pieces){assert.equal(p.placed,ids.includes(p.id));assert.equal(p.bridgeId,p.placed?'bridge-'+p.id:null);}
  for(const [i,p] of s.islands.entries()){assert.equal(p.componentId,g.components[i]);assert.deepEqual(p.incidentPieceIds,g.incident[i]);assert.equal(p.degree,g.incident[i].length);}
  for(const [i,b] of s.bridges.entries()){assert.deepEqual(b,edge(data,b.pieceId,b.sourceId,b.targetId));assert(verdict(data,s.bridges.slice(0,i),b.pieceId,b.sourceId,b.targetId).valid);}
  assert.equal(s.elapsed,s.tick/60);assert.equal(s.remaining,Math.max(0,90-s.elapsed));assert.equal(s.score,s.placedCount*100+(s.islands.length-g.count)*40+(s.phase==='won'?1000+Math.floor(s.remaining)*5:0));
  if(s.stage==='bank'){assert.equal(s.heldPieceId,null);assert.equal(s.sourceId,null);assert.equal(s.preview,null);assert.equal(s.cursor?.id??null,s.selectedPieceId);}
  else{assert.equal(s.heldPieceId,s.selectedPieceId);assert(s.availablePieceIds.includes(s.heldPieceId));assert.equal(s.cursor.id,s.selectedIslandId);if(s.stage==='source'){assert.equal(s.sourceId,null);assert.equal(s.preview,null);}else assert.deepEqual(s.preview,verdict(data,s.bridges,s.heldPieceId,s.sourceId,s.selectedIslandId));}
  if(s.phase==='won'){assert.equal(s.remainingPieces,0);assert.equal(g.count,1);assert.equal(s.lostReason,null);}
  if(s.phase==='lost'&&s.lostReason==='disconnected'){assert.equal(s.remainingPieces,0);assert(g.count>1&&g.cycles>0);}
}
async function check(name,scope,fn){const detail=await fn();checks.push({name,scope,passed:true,...(detail||{})});console.log(JSON.stringify({check:checks.length,name,passed:true}));}

await check('Determinant/rational geometry boundaries independent of model helpers','Synthetic integer geometry only',()=>geometry.runSyntheticFixtures());

await check('Public fixed-piece-order exhaustive search and undirected union-find','All locally legal complete assignments; no authored solution input',()=>{
  for(let d=0;d<3;d++){const s=Model.create(1,d),data=publicData(s);assert.equal(new Set(data.islands.map(p=>p.id)).size,data.islands.length);assert.equal(new Set(data.islands.map(p=>p.x+','+p.y)).size,data.islands.length);assert.equal(new Set(data.pieces.map(p=>p.id)).size,data.pieces.length);
    const solved=solve(data);assert(solved.connectedConfigurations>0);puzzles.push({level:d+1,...solved});
    assert(solved.win.some(b=>{const a=data.islands.find(i=>i.id===b.sourceId),c=data.islands.find(i=>i.id===b.targetId);return b.length===5&&[Math.abs(a.x-c.x),Math.abs(a.y-c.y)].sort().join(',')==='3,4';}),'Authored connected witness should exercise a3-4-5 edge');
  }
  assert(puzzles.some(p=>p.loss));return{puzzles:puzzles.map(({win,loss,...r})=>({...r,hasConnectedWitness:!!win,hasDisconnectedWitness:!!loss}))};
});

await check('All bank subsets and authored island focus graphs are reachable','Pure public navigation graph plus ordinary Model direction observations',()=>{
  for(let d=0;d<3;d++){
    const s=Model.create(1,d),cards=s.pieces.map(({id,x,y})=>({id,x,y}));
    for(let mask=1;mask<1<<cards.length;mask++){const nodes=cards.filter((_,i)=>mask>>i&1);bankSubsetCount++;for(const a of nodes)for(const b of nodes)routeTo(nodes,a.id,b.id);}
    const islands=s.islands.map(p=>({id:p.id,x:p.gx,y:p.gy}));for(const a of islands)for(const b of islands)routeTo(islands,a.id,b.id);
    for(const p of s.pieces)navigate(s,p.id);tap(s,'a');for(const island of s.islands)navigate(s,island.id);tap(s,'b');verify(s);
  }
  return{bankNonemptySubsets:bankSubsetCount,authoredIslandGraphs:3};
});

await check('Every public island pair preview matches the independent exact oracle','Explicit preview-only snapshots; no fabricated completion',()=>{
  for(let d=0;d<3;d++){
    const initial=Model.create(1,d),data=publicData(initial),prefixes=[[],...puzzles[d].win.slice(0,-1).map((_,i)=>puzzles[d].win.slice(0,i+1))];
    for(const bridges of prefixes)for(const p of data.pieces.filter(p=>!bridges.some(b=>b.pieceId===p.id)))for(const from of data.islands)for(const to of data.islands){
      const s=Model.create(1,d);s.bridges=clone(bridges);s.totalPlacements=bridges.length;s.placementAttempts=bridges.length;s.stage='target';s.heldPieceId=s.selectedPieceId=p.id;s.sourceId=from.id;s.selectedIslandId=to.id;step(s,{});
      assert.deepEqual(s.preview,verdict(data,bridges,p.id,from.id,to.id));previewComparisons++;const reason=s.preview.reason??'valid';previewReasons[reason]=(previewReasons[reason]||0)+1;
    }
  }
  return{comparisons:previewComparisons,reasonCounts:previewReasons,source:'Original states with explicit public preview selection/network fixtures; no A commit or terminal assertion in this group.'};
});

await check('Stage cancellations and exact duplicate-attribute instance undo preserve lifetime history','Ordinary A/B/directions, no state mutation',()=>{
  for(let d=0;d<3;d++){
    const s=Model.create(1,d),solution=puzzles[d].win;const duplicate=s.pieces.find(p=>s.pieces.some(q=>q.id!==p.id&&q.length===p.length&&q.targetColor===p.targetColor));assert(duplicate);
    navigate(s,duplicate.id);tap(s,'a');navigate(s,s.islands.at(-1).id);tap(s,'a');const source=s.sourceId;const before=clone(s.bridges);assert.equal(s.preview.reason,'same-island');tap(s,'a');assert.equal(s.failedCommits,1);tap(s,'b');assert.equal(s.stage,'source');assert.equal(s.selectedIslandId,source);tap(s,'b');assert.equal(s.selectedPieceId,duplicate.id);assert.equal(s.cancels,2);assert.deepEqual(s.bridges,before);assert.equal(s.placementAttempts,1);assert.equal(s.failedCommits,1);verify(s);
    const index=solution.findIndex(b=>b.pieceId===duplicate.id);for(const b of solution.slice(0,index+1))place(s,b);assert.equal(s.phase,'playing');
    const accepted=clone(s.lastPlacement),removed=clone(s.bridges.at(-1)),oldElapsed=s.elapsed,oldAttempts=s.placementAttempts,oldTotal=s.totalPlacements;tap(s,'b');
    assert.equal(s.selectedPieceId,removed.pieceId);assert.equal(s.pieces.find(p=>p.id===removed.pieceId).placed,false);assert.equal(s.undos,1);assert.equal(s.totalPlacements,oldTotal);assert.equal(s.placementAttempts,oldAttempts);assert.equal(s.failedCommits,1);assert(s.elapsed>oldElapsed);assert.deepEqual(s.lastPlacement,accepted);assert.deepEqual(Object.fromEntries(Object.entries(s.lastUndo).filter(([k])=>!['at','tick'].includes(k))),removed);verify(s);
    place(s,removed);assert.equal(s.totalPlacements,oldTotal+1);assert.equal(s.undos,1);verify(s);
  }
});

await check('Three ordinary independent connected completions and a genuine locally legal disconnected completion','Only public search witnesses and ordinary keys, no forced result or clock change',()=>{
  for(let d=0;d<3;d++){
    const s=Model.create(1,d);for(const b of puzzles[d].win)place(s,b);assert.equal(s.phase,'won');verify(s);
    ordinaryWins.push({level:s.level,phase:s.phase,componentCount:s.componentCount,placedCount:s.placedCount,remainingPieces:s.remainingPieces,failedCommits:s.failedCommits,totalPlacements:s.totalPlacements,elapsed:s.elapsed,score:s.score,placements:clone(s.bridges)});
    const frozen=JSON.stringify(s);step(s,{a:true,b:true,x:1,cancelEpoch:999},.25);assert.equal(JSON.stringify(s),frozen);
  }
  const d=puzzles.findIndex(p=>p.loss),s=Model.create(1,d);let finalPreview;
  for(const [i,b] of puzzles[d].loss.entries()){selectPlacement(s,b);assert(s.preview.valid);if(i===puzzles[d].loss.length-1){finalPreview=clone(s.preview);assert(s.preview.wouldLoseDisconnected);assert.equal(s.preview.wouldConnectAll,false);}tap(s,'a');verify(s);}
  assert.equal(s.phase,'lost');assert.equal(s.lostReason,'disconnected');assert.equal(s.failedCommits,0);const n=network(publicData(s),s.bridges);assert(n.cycles>0&&n.count>1);
  ordinaryLosses.push({level:s.level,phase:s.phase,reason:s.lostReason,componentCount:n.count,cycleEdges:n.cycles,placedCount:s.placedCount,remainingPieces:s.remainingPieces,failedCommits:s.failedCommits,elapsed:s.elapsed,score:s.score,finalPreview,placements:clone(s.bridges)});
  const frozen=JSON.stringify(s);step(s,{b:true},.25);assert.equal(JSON.stringify(s),frozen);
  return{wins:ordinaryWins,disconnected:ordinaryLosses};
});

await check('Three illegal commits charge once per press without consuming a piece','Ordinary repeated same-island target input and cancellation',()=>{
  const s=Model.create(1,0);tap(s,'a');tap(s,'a');assert.equal(s.preview.reason,'same-island');
  const before={bridges:clone(s.bridges),available:clone(s.availablePieceIds),stage:s.stage,held:s.heldPieceId,source:s.sourceId,target:s.selectedIslandId};
  step(s,{a:true},.25);for(let i=0;i<4;i++)step(s,{a:true},.25);assert.equal(s.failedCommits,1);assert.equal(s.placementAttempts,1);assert.equal(s.remainingPieces,s.pieces.length);assert.equal(s.stage,before.stage);assert.deepEqual(s.bridges,before.bridges);assert.deepEqual(s.availablePieceIds,before.available);
  step(s,{});tap(s,'b');tap(s,'b');assert.equal(s.failedCommits,1);tap(s,'a');tap(s,'a');tap(s,'a');assert.equal(s.failedCommits,2);tap(s,'a');assert.equal(s.phase,'lost');assert.equal(s.lostReason,'invalid');assert.equal(s.failedCommits,3);assert.equal(s.totalPlacements,0);verify(s);
});

await check('Queued edges, cancellation, per-tick B priority and deadline-first final commit','Explicit input and deadline fixtures, distinct from ordinary completions',()=>{
  const z=Model.create(1,0);step(z,{aPressed:true},0);assert.equal(z.stage,'bank');step(z,{});assert.equal(z.stage,'source');
  const c=Model.create(1,0);step(c,{aPressed:true},0);step(c,{cancelled:true,cancelEpoch:1},0);step(c,{});assert.equal(c.stage,'bank');
  tap(c,'a');tap(c,'a');const before={held:c.heldPieceId,source:c.sourceId,selected:c.selectedIslandId,stage:c.stage};step(c,{cancelEpoch:2,cancelled:true,a:true,b:true,x:1},.25);assert.deepEqual({held:c.heldPieceId,source:c.sourceId,selected:c.selectedIslandId,stage:c.stage},before);assert.equal(c.failedCommits,0);
  step(c,{a:true,b:true,x:1});assert.equal(c.stage,'target'); // Both remain held from cancellation; no synthetic new edges.
  step(c,{});step(c,{a:true,b:true,x:1});assert.equal(c.stage,'source');assert.equal(c.selectedIslandId,before.source);assert.equal(c.failedCommits,0);
  const a=Model.create(1,0),b=Model.create(1,0);tap(a,'a');tap(b,'a');step(a,{a:true,b:true,x:1},.25);for(let i=0;i<15;i++)step(b,{a:i===0,b:true,x:1});assert.equal(a.stage,b.stage);assert.equal(a.selectedPieceId,b.selectedPieceId);assert.equal(a.failedCommits,b.failedCommits);
  const deadline=Model.create(1,0);for(const p of puzzles[0].win.slice(0,-1))place(deadline,p);selectPlacement(deadline,puzzles[0].win.at(-1));assert(deadline.preview.valid&&deadline.preview.wouldConnectAll);const placements=deadline.totalPlacements;deadline.tick=5399;deadline.elapsed=5399/60;deadline.remaining=1/60;step(deadline,{a:true});assert.equal(deadline.phase,'lost');assert.equal(deadline.lostReason,'timeout');assert.equal(deadline.totalPlacements,placements);assert.equal(deadline.remainingPieces,1);
  const fresh=Model.create(1,0),again=Model.create(999,0);assert.deepEqual(publicData(fresh),publicData(again));assert.equal(fresh.totalPlacements,fresh.failedCommits);assert.equal(fresh.bridges.length,0);assert.equal(fresh.elapsed,0);
});

const sourceHashesAfter=await hashes();assert.deepEqual(sourceHashesAfter,sourceHashes);
const report={schema:1,kind:'independent-island-geometry-connectivity-review',passed:true,checks,checkCount:checks.length,sourceHashes,sourceHashesAfter,sourceUnchanged:true,
 totals:{abstractGeometryGroups:checks[0].checks.length,previewComparisons,previewReasons,navigationTransitions,bankSubsetCount,ordinaryConnectedWins:ordinaryWins.length,ordinaryDisconnectedLosses:ordinaryLosses.length},
 publicPuzzles:puzzles,ordinaryConnectedWins:ordinaryWins,ordinaryDisconnectedLosses:ordinaryLosses,
 scope:{pureIntegerGeometry:true,publicFactsOnlySearch:true,productionSolverImported:false,authoringSolutionsRead:false,fixtureChecksSeparateFromOrdinaryInputs:true,browserExecuted:false,normalGameplayVideoEvidence:false,physicalTvTested:false,physicalPhoneTested:false},
 limitations:['Synthetic previews and the deadline boundary mutate explicit original states; they are not gameplay captures.','Ordinary model sequences use real input fields at fixed60Hz but run without wall-clock delays; browser duration/performance comes from separate QA.','Complete configuration counts preserve distinct physical piece IDs and directed endpoints; they are not counts of visually distinct unlabeled networks.']};
await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length,totals:report.totals,output}));
