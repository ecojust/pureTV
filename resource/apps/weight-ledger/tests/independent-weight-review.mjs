// Independent public allocation search and integer-load oracle. Constructed
// capacity/deadline/bank states are fixtures, not ordinary gameplay evidence.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const modelUrl=new URL('../src/main/assets/game-model.js',import.meta.url),contractUrl=new URL('../docs/model-contract.md',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex'),modelSha256=hash(await readFile(modelUrl)),contractSha256=hash(await readFile(contractUrl));
const Model=createRequire(import.meta.url)(fileURLToPath(modelUrl)),clone=structuredClone,DT=1/60,TRAYS=['A','B','C','bank'];
const DIRS={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]},checks=[],totals={allocationChecks:0,coefficientPairs:0,focusDomains:0,focusPairs:0,searchExpanded:0,ordinaryAuthoredWins:0,ordinaryRelocations:0};
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,`${a} != ${b}`);
function test(name,fn){checks.push({name,passed:true,...fn()});}
function tick(s,input={}){Model.step(s,DT,{cancelEpoch:0,...input});}
function press(s,key){const d=DIRS[key];tick(s,d?{x:d[0],y:d[1]}:{[key]:true});tick(s);}
function facts(s){return{weights:s.weights.map(({id,mass})=>({id,mass})).sort((a,b)=>a.id-b.id),trays:s.trays.map(({id,capacity})=>({id,capacity})),scales:s.scales.map(({id,left,right})=>({id,left:clone(left),right:clone(right)}))};}
function allocation(s){return s.weights.slice().sort((a,b)=>a.id-b.id).map(w=>w.trayId);}
function calculate(publicFacts,places){
  const mass=Object.fromEntries(TRAYS.map(t=>[t,0])),ids=Object.fromEntries(TRAYS.map(t=>[t,[]]));
  publicFacts.weights.forEach((w,i)=>{assert.ok(TRAYS.includes(places[i]));mass[places[i]]+=w.mass;ids[places[i]].push(w.id);});
  const side=x=>x.constant+x.terms.reduce((n,t)=>n+t.coefficient*mass[t.trayId],0);
  const scales=publicFacts.scales.map(s=>{const leftTotal=side(s.left),rightTotal=side(s.right);return{id:s.id,leftTotal,rightTotal,delta:leftTotal-rightTotal,balanced:leftTotal===rightTotal};});
  return{mass,ids,scales,allDeployed:ids.bank.length===0,allBalanced:scales.every(x=>x.balanced)};
}
function verify(s){
  const f=facts(s),a=allocation(s),c=calculate(f,a);assert.deepEqual(f.weights.map(w=>w.id),[1,2,3,4,5,6]);assert.ok(f.weights.every(w=>Number.isSafeInteger(w.mass)&&w.mass>0));
  assert.equal(s.totalMass,f.weights.reduce((n,w)=>n+w.mass,0));assert.equal(s.totalMass,Object.values(c.mass).reduce((n,v)=>n+v,0));
  for(const t of s.trays){assert.deepEqual(t.weightIds,c.ids[t.id]);assert.equal(t.totalMass,c.mass[t.id]);assert.ok(t.weightIds.length<=t.capacity);
    t.weightIds.forEach((id,k)=>{const w=s.weights.find(w=>w.id===id);assert.equal(w.slot,k);assert.equal(w.x,t.x+(k%3-1)*54);assert.equal(w.y,t.y+(Math.floor(k/3)-.5)*48+10);});}
  assert.deepEqual(s.inventoryIds,c.ids.bank);assert.equal(s.inventoryCount,c.ids.bank.length);assert.equal(s.deployedCount,6-c.ids.bank.length);assert.equal(s.allDeployed,c.allDeployed);
  for(let i=0;i<s.scales.length;i++)for(const k of ['leftTotal','rightTotal','delta','balanced'])assert.equal(s.scales[i][k],c.scales[i][k]);
  assert.equal(s.balancedCount,c.scales.filter(x=>x.balanced).length);assert.equal(s.allBalanced,c.allBalanced);assert.equal(s.movesRemaining,s.moveBudget-s.movesUsed);
  assert.equal(s.historyDepth,s.movesUsed);assert.equal(s.totalMoves,s.movesUsed+s.undos);
  assert.equal(s.mode,s.heldWeightId===null?'selecting':'placing');assert.equal(s.canUndo,s.phase==='playing'&&s.heldWeightId===null&&s.historyDepth>0);
  assert.equal(s.selectedId,s.mode==='selecting'?s.selectedWeightId:s.selectedTrayId);
  assert.equal(s.score,s.balancedCount*200+s.deployedCount*25+(s.phase==='won'?1000+s.movesRemaining*50+Math.floor(s.remaining)*5:0));
  near(s.elapsed,s.tick/60);near(s.remaining,Math.max(0,90-s.elapsed));totals.allocationChecks++;return c;
}
function nextFocus(items,current,key){
  const a=items.find(x=>x.id===current),[dx,dy]=DIRS[key];let best=null,cost=Infinity;
  // Contract ordering defines ties: numeric ID for weights, published tray order.
  const ordered=[...items].sort((a,b)=>typeof a.id==='number'?a.id-b.id:TRAYS.indexOf(a.id)-TRAYS.indexOf(b.id));
  for(const b of ordered){const x=b.x-a.x,y=b.y-a.y,forward=x*dx+y*dy;if(forward<=0)continue;const n=Math.abs(x*dy-y*dx)*3+forward;if(n<cost){cost=n;best=b.id;}}
  return best===null?current:best;
}
function focusRoute(items,start,goal){
  const q=[{id:start,keys:[]}],seen=new Set([start]);for(let h=0;h<q.length;h++){const n=q[h];if(n.id===goal)return n.keys;for(const key of Object.keys(DIRS)){const id=nextFocus(items,n.id,key);if(!seen.has(id)){seen.add(id);q.push({id,keys:[...n.keys,key]});}}}assert.fail('Public spatial focus graph is disconnected');
}
function checkFocus(s){for(const a of s.selectionItems)for(const b of s.selectionItems){focusRoute(s.selectionItems,a.id,b.id);totals.focusPairs++;}totals.focusDomains++;}
function select(s,id){
  for(let guard=0;s.selectedId!==id;guard++){assert.ok(guard<20);const route=focusRoute(s.selectionItems,s.selectedId,id),expected=nextFocus(s.selectionItems,s.selectedId,route[0]);press(s,route[0]);assert.equal(s.selectedId,expected);}assert.equal(s.selectedId,id);
}
function relocate(s,id,to){
  verify(s);select(s,id);const before=clone(s),f=facts(s),old=allocation(s),index=f.weights.findIndex(w=>w.id===id),from=old[index];assert.notEqual(from,to);
  press(s,'a');assert.equal(s.heldWeightId,id);assert.equal(s.selectedTrayId,from);assert.deepEqual(allocation(s),old);assert.deepEqual(s.scales,before.scales);assert.equal(s.score,before.score);assert.equal(s.movesUsed,before.movesUsed);
  checkFocus(s);select(s,to);press(s,'a');const expected=[...old];expected[index]=to;assert.deepEqual(allocation(s),expected);assert.equal(s.movesUsed,before.movesUsed+1);assert.equal(s.totalMoves,before.totalMoves+1);
  const actual=verify(s),prior=calculate(f,old);const changed=actual.scales.filter((x,i)=>x.delta!==prior.scales[i].delta).map(x=>x.id);
  assert.deepEqual(s.lastTransfer.changedScaleIds,changed);assert.equal(s.lastTransfer.weightId,id);assert.equal(s.lastTransfer.kind,'place');assert.equal(s.lastTransfer.fromTrayId,from);assert.equal(s.lastTransfer.toTrayId,to);assert.ok(changed.length>=2);
  checkFocus(s);return before;
}
function solve(s){
  const f=facts(s),start=allocation(s),q=[{places:start,moves:[]}],seen=new Set([start.join(',')]);let maxQueue=1;
  for(let head=0;head<q.length;head++){
    assert.ok(q.length<=4096,'Six unique IDs with four locations must have at most4096 allocations');const n=q[head],c=calculate(f,n.places);
    if(c.allDeployed&&c.allBalanced){totals.searchExpanded+=head+1;return{...n,expanded:head+1,maxQueue};}
    if(n.moves.length>=s.moveBudget)continue;
    for(let i=0;i<f.weights.length;i++)for(const to of TRAYS){if(n.places[i]===to||c.ids[to].length>=f.trays.find(t=>t.id===to).capacity)continue;const places=[...n.places];places[i]=to;const key=places.join(',');if(seen.has(key))continue;seen.add(key);q.push({places,moves:[...n.moves,{id:f.weights[i].id,to}]});}
    maxQueue=Math.max(maxQueue,q.length-head-1);
  }assert.fail('No public integer allocation is solvable within the authored move budget');
}
function sameAllocation(a,b){for(const key of ['weights','trays','scales','inventoryIds','inventoryCount','deployedCount','totalMass','allDeployed','balancedCount','allBalanced','movesUsed','movesRemaining','score'])assert.deepEqual(a[key],b[key],key);}

test('unique repeated-mass instances, shared integer totals and coefficient2 conserve physical mass',()=>{
  let weightedRatioSeen=false;
  for(let d=0;d<3;d++){
    const s=Model.create(42,d);verify(s);assert.ok(new Set(s.weights.map(w=>w.mass)).size<s.weights.length);assert.equal(s.movesUsed,0);assert.equal(s.historyDepth,0);checkFocus(s);
    for(const scale of s.scales)for(const side of [scale.left,scale.right])for(const term of side.terms){assert.ok([1,2].includes(term.coefficient));assert.notEqual(term.trayId,'bank');weightedRatioSeen ||=term.coefficient===2;}
    const f=facts(s);for(const from of TRAYS)for(const to of TRAYS)if(from!==to){const columns=f.scales.map(scale=>{const coefficient=(side,id)=>side.terms.filter(t=>t.trayId===id).reduce((n,t)=>n+t.coefficient,0);return(coefficient(scale.left,to)-coefficient(scale.right,to))-(coefficient(scale.left,from)-coefficient(scale.right,from));});assert.ok(columns.filter(n=>n!==0).length>=2);totals.coefficientPairs++;}
  }assert.ok(weightedRatioSeen);return{allLayoutsHaveDistinctRepeatedMassIds:true,ratio2IsLoadNotPhysicalMass:true,directedTrayPairCases:36};
});
test('pickup, same-tray return and explicit cancellation do not alter inventory or spend a move',()=>{
  const s=Model.create(42,0),before=clone(s);press(s,'a');sameAllocation(s,before);assert.equal(s.pickups,1);assert.equal(s.heldWeightId,before.selectedWeightId);press(s,'a');sameAllocation(s,before);assert.equal(s.cancels,1);assert.equal(s.historyDepth,0);
  press(s,'a');press(s,'b');sameAllocation(s,before);assert.equal(s.cancels,2);assert.equal(s.heldWeightId,null);const cancels=s.cancels;press(s,'b');assert.equal(s.cancels,cancels);assert.equal(s.undos,0);return{pickupPreviewOnly:true,noOpReturnFree:true,emptyUndoFree:true};
});
test('one relocation changes all affected equations simultaneously and moves one repeated-mass ID',()=>{
  const s=Model.create(42,0),pair=s.weights.filter(w=>w.mass===2);assert.equal(pair.length,2);const first=pair[0],other=clone(pair[1]);relocate(s,first.id,'C');assert.equal(s.weights.find(w=>w.id===other.id).trayId,other.trayId);assert.equal(s.weights.filter(w=>w.id===first.id).length,1);assert.equal(s.weights.length,6);return{movedId:first.id,unchangedEqualMassId:other.id,changedScaleIds:s.lastTransfer.changedScaleIds};
});
test('B while carrying cancels only; subsequent B restores the previous full allocation and move count',()=>{
  const s=Model.create(42,0);select(s,2);const before=clone(s);relocate(s,2,'C');const placed=clone(s);select(s,3);press(s,'a');press(s,'b');assert.deepEqual(allocation(s),allocation(placed));assert.equal(s.movesUsed,1);assert.equal(s.historyDepth,1);assert.equal(s.undos,0);
  const total=s.totalMoves,elapsed=s.elapsed;press(s,'b');sameAllocation(s,before);assert.equal(s.totalMoves,total);assert.equal(s.undos,1);assert.ok(s.elapsed>elapsed);assert.equal(s.selectedWeightId,2);assert.equal(s.selectedTrayId,null);assert.equal(s.heldWeightId,null);assert.equal(s.historyDepth,0);assert.equal(s.canUndo,false);verify(s);
  return{cancelDoesNotAlsoUndo:true,selectionAndAllocationRestored:true,lifetimeMovesNotRefunded:true,clockNotRefunded:true};
});
test('two committed snapshots undo in reverse order without aliasing or accumulated score',()=>{
  const s=Model.create(42,2),initial=clone(s);relocate(s,2,'A');const afterFirst=clone(s);relocate(s,3,'B');assert.equal(s.historyDepth,2);press(s,'b');sameAllocation(s,afterFirst);assert.equal(s.selectedWeightId,3);press(s,'b');sameAllocation(s,initial);assert.equal(s.totalMoves,2);assert.equal(s.undos,2);assert.equal(s.historyDepth,0);verify(s);return{stackDepth:2,allAssignmentsRestored:true,recomputedScore: s.score};
});
test('capacity rejection leaves a carried weight and the actual allocation unchanged',()=>{
  const s=Model.create(42,0),target=s.trays.find(t=>t.id==='A');target.capacity=target.weightIds.length;select(s,1);press(s,'a');select(s,'A');const before=clone(s);press(s,'a');sameAllocation(s,before);assert.equal(s.invalidPlacements,1);assert.equal(s.heldWeightId,1);assert.equal(s.historyDepth,0);assert.equal(s.phase,'playing');return{scope:'Synthetic lowered destination capacity, ordinary pickup and placement keys',invalidPlacements:s.invalidPlacements};
});
test('balanced empty scales cannot win while every physical weight remains in storage',()=>{
  const s=Model.create(42,0);s.weights.forEach(w=>w.trayId=w.id===1?'A':'bank');s.scales.forEach(scale=>{scale.left.constant=0;scale.right.constant=0;});
  // Cancel a pickup preview through normal input so the model recomputes the
  // public fixture's real memberships/slots before the actual relocation.
  press(s,'a');press(s,'b');verify(s);relocate(s,1,'bank');assert.equal(s.allBalanced,true);assert.equal(s.allDeployed,false);assert.equal(s.inventoryCount,6);assert.equal(s.phase,'playing');
  return{scope:'Synthetic zero fixed loads and mostly stored starting allocation, followed by a real relocation',allBalanced:true,allDeployed:false};
});
test('held buttons, atomic priority, zero-time edges and cancellation preserve deliberate preview',()=>{
  const s=Model.create(42,0);for(let i=0;i<30;i++)tick(s,{a:true});assert.equal(s.pickups,1);assert.equal(s.cancels,0);const held=s.heldWeightId;
  tick(s,{b:true,bPressed:true,a:true,aPressed:true,cancelEpoch:1});assert.equal(s.heldWeightId,held);assert.equal(s.cancels,0);tick(s,{cancelEpoch:1});assert.equal(s.heldWeightId,held);
  tick(s,{b:true,bPressed:true,a:true,aPressed:true,cancelEpoch:1});assert.equal(s.heldWeightId,null);assert.equal(s.cancels,1);tick(s,{cancelEpoch:1});assert.equal(s.pickups,1);
  const pending=Model.create(42,0);Model.step(pending,0,{a:true,aPressed:true,cancelEpoch:0});assert.equal(pending.pickups,0);tick(pending);assert.equal(pending.pickups,1);const id=pending.heldWeightId;
  Model.step(pending,0,{b:true,bPressed:true,cancelEpoch:0});Model.step(pending,0,{cancelled:true,cancelEpoch:1});tick(pending,{cancelEpoch:1});assert.equal(pending.heldWeightId,id);assert.equal(pending.cancels,0);
  const simultaneous=Model.create(42,0),goal=nextFocus(simultaneous.selectionItems,simultaneous.selectedId,'N');tick(simultaneous,{y:-1,a:true,aPressed:true});assert.equal(simultaneous.heldWeightId,goal);
  return{heldAOnlyOnePick:true,bDiscardsCoalescedA:true,zeroDtDoesNotAct:true,cancelDiscardsPendingButKeepsPreview:true,directionPrecedesA:true};
});
test('ordinary budget exhaustion and expiry are terminal and cannot be undone',()=>{
  const s=Model.create(42,0);for(let i=0;i<s.moveBudget;i++){relocate(s,1,i%2?'bank':'A');if(i<s.moveBudget-1)assert.equal(s.phase,'playing');}assert.equal(s.phase,'lost');assert.equal(s.lostReason,'moves');const terminal=clone(s);for(let i=0;i<30;i++)tick(s,{b:true,bPressed:true,a:true,x:1});assert.deepEqual(s,terminal);
  const expired=Model.create(42,0);press(expired,'a');select(expired,'A');expired.tick=5399;expired.elapsed=5399/60;expired.remaining=1/60;const placements=allocation(expired);tick(expired,{a:true,aPressed:true});assert.equal(expired.phase,'lost');assert.equal(expired.lostReason,'timeout');assert.deepEqual(allocation(expired),placements);assert.equal(expired.movesUsed,0);const frozen=clone(expired);tick(expired,{b:true});assert.deepEqual(expired,frozen);
  return{ordinarySingleWeightShuttleConsumesBudget:true,deadlineBeforePlacement:true,terminalFramesFrozen:30,deadlineFixture:true};
});
test('independent unique-ID BFS finds shortest public solutions and ordinary inputs win all three',()=>{
  const solutions=[];
  for(let d=0;d<3;d++){
    const s=Model.create(77,d),initial=clone(s),solution=solve(s);assert.deepEqual(s,initial);assert.equal(solution.moves.length,s.moveBudget);checkFocus(s);
    for(const move of solution.moves){relocate(s,move.id,move.to);totals.ordinaryRelocations++;for(let i=0;i<60&&s.phase==='playing';i++)tick(s);}
    assert.equal(s.phase,'won');assert.ok(s.allDeployed&&s.allBalanced);assert.equal(s.movesUsed,s.moveBudget);assert.equal(s.movesRemaining,0);assert.deepEqual(allocation(s),solution.places);verify(s);
    const frozen=clone(s);tick(s,{b:true,a:true});assert.deepEqual(s,frozen);const fresh=Model.create(77,d);assert.deepEqual(fresh,initial);assert.notStrictEqual(fresh.weights[0],s.weights[0]);
    solutions.push({level:s.level,phase:s.phase,elapsed:s.elapsed,score:s.score,movesUsed:s.movesUsed,moveBudget:s.moveBudget,totalMoves:s.totalMoves,allDeployed:s.allDeployed,allBalanced:s.allBalanced,totalMass:s.totalMass,allocation:s.weights.map(({id,mass,trayId})=>({id,mass,trayId})),scales:s.scales.map(({id,leftTotal,rightTotal,delta})=>({id,leftTotal,rightTotal,delta})),publicMoves:solution.moves,searchExpanded:solution.expanded,maxQueue:solution.maxQueue});totals.ordinaryAuthoredWins++;
  }
  return{scope:'Fresh authored models, independently searched public allocations and spatial focus graphs, ordinary direction/A inputs; no production solver, pilot, route or state write',solutions};
});
assert.equal(hash(await readFile(modelUrl)),modelSha256);assert.equal(hash(await readFile(contractUrl)),contractSha256);
const report={kind:'independent-shared-integer-weight-review',passed:true,modelSha256,contractSha256,reviewScriptSha256:hash(await readFile(fileURLToPath(import.meta.url))),sourceUnchanged:true,checks,totals,
  methodology:'A separate integer side-sum oracle and bounded breadth-first search over six unique IDs and four locations; no production solving helpers or QA pilot imported. Navigation is reconstructed from current public spatial items after every relocation.',
  scope:{syntheticBoundaryFixtures:true,ordinaryAuthoredModelWins:3,browserExecuted:false,normalGameplayVideoEvidence:false,physicalTvTested:false,physicalPhoneTested:false}};
const out=process.argv.indexOf('--output');if(out!==-1){assert.ok(process.argv[out+1]);await writeFile(process.argv[out+1],JSON.stringify(report,null,2)+'\n');}console.log(JSON.stringify(report,null,2));
