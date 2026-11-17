'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=path.join(__dirname,'../src/main/assets/game-model.js'),Model=require(source),DT=1/60;
const clone=x=>JSON.parse(JSON.stringify(x));
const tick=(s,input={})=>Model.step(s,DT,input);
function ticks(s,n,input={}){for(let i=0;i<n;i++)tick(s,input);}
function tap(s,input){tick(s,input);tick(s);}
const DIRECTIONS=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
function next(items,id,d){const from=items.find(i=>i.id===id);return items.map((item,index)=>{
 const dx=item.x-from.x,dy=item.y-from.y,p=Math.abs(d.x?dy:dx),distance=dx*dx+dy*dy;
 return{item,index,forward:dx*(d.x||0)+dy*(d.y||0),cost:distance+2*p*p,distance,p};
}).filter(i=>i.forward>0).sort((a,b)=>a.cost-b.cost||a.distance-b.distance||a.p-b.p||a.index-b.index)[0]?.item.id||id;}
function focus(s,target){
 const q=[[s.selectedId,[]]],seen=new Set([s.selectedId]);let keys;
 for(const [id,prefix]of q){if(id===target){keys=prefix;break;}for(const d of DIRECTIONS){const n=next(s.focusItems,id,d);if(!seen.has(n)){seen.add(n);q.push([n,[...prefix,d]]);}}}
 assert.ok(keys,`public focus reaches ${target}`);for(const d of keys)tap(s,d);assert.equal(s.selectedId,target);
}
function toggle(s,id){focus(s,id);tap(s,{a:true});}
function draw(s,ids){for(const id of ids)toggle(s,id);}
function pump(s){focus(s,'pump');tap(s,{a:true});}
function current(s){return clone({vertices:s.vertices,edges:s.edges,plots:s.plots,pipes:s.pipes,components:s.components,
 availablePipeIds:s.availablePipeIds,pipeCount:s.pipeCount,pipesRemaining:s.pipesRemaining,checks:s.checks,score:s.score});}
function audit(s){
 const used=s.edges.filter(e=>e.selected);assert.equal(s.pipeCount,used.length);assert.equal(s.pipeStock,s.pipes.length);
 assert.equal(s.pipesRemaining+s.pipeCount,s.pipeStock);assert.equal(new Set(used.map(e=>e.pipeId)).size,used.length);
 assert.deepEqual(s.availablePipeIds,s.pipes.filter(p=>p.edgeId===null).map(p=>p.id));
 for(const p of s.pipes)assert.equal(p.edgeId,used.find(e=>e.pipeId===p.id)?.id??null);
 for(const v of s.vertices){const ids=used.filter(e=>e.aId===v.id||e.bId===v.id).map(e=>e.id);assert.deepEqual(v.incidentEdgeIds,ids);assert.equal(v.degree,ids.length);assert.equal(v.onPipe,ids.length>0);if(!ids.length)assert.equal(v.componentId,null);}
 for(const p of s.plots){const count=new Set(p.boundaryEdgeIds.filter(id=>used.some(e=>e.id===id))).size;assert.equal(p.selectedCount,count);assert.equal(p.matched,p.clue===null?null:count===p.clue);}
 assert.equal(s.totalEdits,s.placements+s.removals);assert.equal(s.totalEdits,s.historyDepth+s.undos);assert.equal(s.historyDepth,s.history.length);assert.equal(s.editAttempts,s.totalEdits+s.blockedPlacements);
 assert.equal(s.score,s.pipeCount*10+s.matchedClueCount*25+s.treesCovered*20+(s.phase==='won'?1000+Math.floor(s.remaining)*5:0));
}
// Self-contained authoring rule examples, not the public-only pilot evidence
// appended below. All examples are constructed through ordinary A/direction input.
const SOLUTIONS=[[2,6,8,9,14,15,18,20],[1,2,4,6,8,9,13,15,18,20],[4,5,7,9,11,12,17,19,22,24]].map(a=>a.map(n=>'E'+n));
const DOUBLES=[[2,3,5,7,9,10,14,16,19,20,21,22],[1,2,3,4,5,7,9,10,13,16,19,20,21,22],[3,4,6,8,9,10,11,12,15,16,17,18,21,24]].map(a=>a.map(n=>'E'+n));

test('UMD exposes fixed public geometry, 16 independent pipe instances and empty active graphs',()=>{
 assert.deepEqual(Object.keys(Model).sort(),['TICK_HZ','create','step']);assert.equal(Model.TICK_HZ,60);
 const sandbox={};vm.runInNewContext(fs.readFileSync(source,'utf8'),sandbox);assert.deepEqual(clone(sandbox.PureModel.create(5,1)),Model.create(5,1));
 for(let d=0;d<3;d++){const s=Model.create(5,d);assert.equal(s.level,d+1);assert.equal(s.vertices.length,16);assert.equal(s.edges.length,24);assert.equal(s.plots.length,9);assert.equal(s.focusItems.length,25);
  assert.equal(s.pipeStock,16);assert.equal(s.pipeCount,0);assert.equal(s.componentCount,0);assert.equal(s.activeVertexCount,0);assert.equal(s.degreeTwo,false);assert.equal(s.singleLoop,false);assert.equal(s.goalReady,false);
  assert.equal(s.clueCount,8);assert.equal(s.plots.filter(p=>p.clue===null).length,1);assert.equal(s.requiredTreeIds.length,2+d);assert.equal(s.forbiddenFlowerIds.length,1);assert.equal(s.score,0);
  s.vertices.forEach((v,i)=>{assert.equal(v.id,'V'+(i+1));assert.equal(v.x,156+i%4*108);assert.equal(v.y,102+Math.floor(i/4)*108);});audit(s);
 }
});

test('every plot has four distinct actual boundaries and reverse incidence follows public plot order',()=>{
 const s=Model.create();assert.deepEqual(s.plots[0].boundaryEdgeIds,['E1','E14','E4','E13']);
 for(const p of s.plots){const expected=s.edges.filter(e=>{const a=s.vertices.find(v=>v.id===e.aId),b=s.vertices.find(v=>v.id===e.bId);return a.row===b.row?
  a.col===p.col&&b.col===p.col+1&&(a.row===p.row||a.row===p.row+1):a.row===p.row&&b.row===p.row+1&&(a.col===p.col||a.col===p.col+1);}).map(e=>e.id);
  assert.equal(new Set(p.boundaryEdgeIds).size,4);assert.deepEqual([...p.boundaryEdgeIds].sort(),expected.sort());}
 for(const e of s.edges){assert.deepEqual(e.plotIds,s.plots.filter(p=>p.boundaryEdgeIds.includes(e.id)).map(p=>p.id));assert.ok(e.plotIds.length===1||e.plotIds.length===2);}
});

test('corner turns count two segments, shared edges count once in each plot, and removals clear each count',()=>{
 const s=Model.create();draw(s,['E1','E13']);assert.equal(s.plots[0].selectedCount,2);assert.equal(s.vertices[0].degree,2);
 toggle(s,'E4');assert.equal(s.plots[0].selectedCount,3);assert.equal(s.plots[3].selectedCount,1);assert.equal(s.pipeCount,3);
 toggle(s,'E4');assert.equal(s.plots[0].selectedCount,2);assert.equal(s.plots[3].selectedCount,0);audit(s);
});

test('unhinted null is not numeric zero and never contributes a matched-clue point',()=>{
 const s=Model.create(),p=s.plots.find(p=>p.clue===null);assert.equal(p.selectedCount,0);assert.equal(p.matched,null);assert.equal(s.matchedClueCount,0);
 // Public clue fixture exercises a supported zero value absent from these authored boards.
 p.clue=0;tick(s);assert.equal(p.matched,true);assert.equal(s.clueCount,9);assert.equal(s.score,25);
 toggle(s,p.boundaryEdgeIds[0]);assert.equal(p.selectedCount,1);assert.equal(p.matched,false);
 p.clue=null;tick(s);assert.equal(p.matched,null);assert.equal(s.clueCount,8);audit(s);
});

test('all three ordinary double-loop examples pass every local rule yet PUMP rejects topology alone',()=>{
 for(let d=0;d<3;d++){const s=Model.create(1,d);draw(s,DOUBLES[d]);
  assert.equal(s.degreeTwo,true);assert.equal(s.componentCount,2);assert.equal(s.allTreesCovered,true);assert.equal(s.flowersAvoided,true);assert.equal(s.allCluesMet,true);assert.equal(s.matchedClueCount,8);assert.ok(s.pipesRemaining>=0);assert.equal(s.goalReady,false);
  pump(s);assert.equal(s.phase,'playing');assert.equal(s.mistakes,1);assert.equal(s.lastSubmission.reason,'multiple-loops');assert.equal(s.lastSubmission.componentCount,2);
  assert.deepEqual(s.lastSubmission.checks,{hasPipes:true,degreeTwo:true,singleLoop:false,trees:true,flowers:true,clues:true});audit(s);
 }
});

test('ordinary single-loop examples retain spare stock, remain playing when ready and require explicit PUMP',()=>{
 for(let d=0;d<3;d++){const s=Model.create(1,d);draw(s,SOLUTIONS[d]);assert.equal(s.pipeCount,[8,10,10][d]);assert.equal(s.pipesRemaining,[8,6,6][d]);assert.equal(s.goalReady,true);assert.equal(s.phase,'playing');assert.equal(s.submissions,0);
  const pipes=clone(s.pipes);pump(s);assert.equal(s.phase,'won');assert.equal(s.lastSubmission.reason,'accepted');assert.deepEqual(s.pipes,pipes);assert.equal(s.mistakes,0);audit(s);}
});

test('removing a connecting segment immediately clears isolated occupancy and active components',()=>{
 const s=Model.create();draw(s,['E1','E2']);assert.equal(s.activeVertexCount,3);assert.equal(s.componentCount,1);assert.equal(s.vertices[1].degree,2);
 toggle(s,'E2');assert.equal(s.vertices[2].degree,0);assert.deepEqual(s.vertices[2].incidentEdgeIds,[]);assert.equal(s.vertices[2].componentId,null);assert.equal(s.activeVertexCount,2);
 toggle(s,'E1');assert.deepEqual(s.components,[]);assert.equal(s.componentCount,0);assert.equal(s.degreeTwo,false);assert.equal(s.singleLoop,false);assert.ok(s.vertices.every(v=>v.componentId===null));audit(s);
});

test('component representatives and every component/receipt list use public array order',()=>{
 const s=Model.create();draw(s,['E24','E13','E12','E1']);assert.deepEqual(s.components.map(c=>c.id),['V1','V12']);
 for(const c of s.components){assert.deepEqual(c.vertexIds,s.vertices.filter(v=>v.componentId===c.id).map(v=>v.id));assert.deepEqual(c.edgeIds,s.edges.filter(e=>e.selected&&c.vertexIds.includes(e.aId)).map(e=>e.id));}
 pump(s);assert.deepEqual(s.lastSubmission.selectedEdgeIds,['E1','E12','E13','E24']);assert.deepEqual(s.lastSubmission.pipeAssignments,s.edges.filter(e=>e.selected).map(e=>({edgeId:e.id,pipeId:e.pipeId})));assert.ok(s.lastSubmission.pipeAssignments.every(p=>p.pipeId!==null));
 assert.deepEqual(s.leakIds,s.vertices.filter(v=>v.degree===1).map(v=>v.id));assert.deepEqual(s.branchIds,s.vertices.filter(v=>v.degree>=3).map(v=>v.id));
});

test('diagnostic order separates empty, branch, leak, missing trees, flower contact and wrong clues',()=>{
 const empty=Model.create();pump(empty);assert.equal(empty.lastSubmission.reason,'empty');
 const branch=Model.create();draw(branch,['E4','E5','E14']);pump(branch);assert.equal(branch.lastSubmission.reason,'branch');assert.ok(branch.leakIds.length>0);
 const leak=Model.create();toggle(leak,'E1');pump(leak);assert.equal(leak.lastSubmission.reason,'leak');assert.equal(leak.flowersAvoided,false);
 const square=['E1','E4','E13','E14'],trees=Model.create();draw(trees,square);pump(trees);assert.equal(trees.lastSubmission.reason,'trees');assert.equal(trees.flowersAvoided,false);
 // Role fixtures isolate diagnostics without replacing the actual graph.
 const flower=Model.create();flower.vertices.forEach(v=>{if(v.role==='tree')v.role='junction';});draw(flower,square);pump(flower);assert.equal(flower.lastSubmission.reason,'flower');
 const clues=Model.create();clues.vertices.forEach(v=>v.role='junction');draw(clues,square);pump(clues);assert.equal(clues.lastSubmission.reason,'clues');assert.equal(clues.singleLoop,true);
});

test('a flower enclosed without vertex contact is avoided, and tree coverage means participation not water flow',()=>{
 const s=Model.create();s.vertices.forEach(v=>v.role='junction');s.vertices[5].role='flower';s.vertices[0].role='tree';
 draw(s,['E1','E2','E15','E19','E8','E7','E17','E13']);assert.equal(s.vertices[5].degree,0);assert.equal(s.flowersAvoided,true);assert.equal(s.treesCovered,1);assert.equal(s.singleLoop,true);assert.equal(s.phase,'playing');assert.equal(s.submissions,0);
});

test('lowest free physical IDs are allocated and LIFO undo of removal restores its exact nonlowest ID',()=>{
 const s=Model.create();draw(s,['E1','E2','E3']);assert.deepEqual(s.edges.slice(0,3).map(e=>e.pipeId),['P1','P2','P3']);
 toggle(s,'E1');toggle(s,'E3');assert.equal(s.availablePipeIds[0],'P1');const removed=clone(s.lastEdit);assert.equal(removed.beforePipeId,'P3');
 tap(s,{b:true});assert.equal(s.edges[2].pipeId,'P3');assert.equal(s.pipes[0].edgeId,null);assert.equal(s.selectedId,'E3');assert.deepEqual(s.lastUndo.edit,removed);assert.notStrictEqual(s.lastUndo.edit,s.lastEdit);
 tap(s,{b:true});assert.equal(s.edges[0].pipeId,'P1');tap(s,{b:true});assert.equal(s.edges[2].pipeId,null);assert.equal(s.pipes[2].edgeId,null);
 toggle(s,'E4');assert.equal(s.edges[3].pipeId,'P3');audit(s);
});

test('full stock blocks only new placement, while removal and exact undo remain usable without mistakes',()=>{
 const s=Model.create();draw(s,s.edges.slice(0,16).map(e=>e.id));assert.equal(s.pipesRemaining,0);const before=current(s),depth=s.historyDepth;
 toggle(s,'E17');assert.deepEqual(current(s),before);assert.equal(s.blockedPlacements,1);assert.equal(s.editAttempts,17);assert.equal(s.totalEdits,16);assert.equal(s.historyDepth,depth);assert.equal(s.mistakes,0);
 toggle(s,'E5');assert.equal(s.pipesRemaining,1);assert.equal(s.pipes[4].edgeId,null);toggle(s,'E17');assert.equal(s.edges[16].pipeId,'P5');
 tap(s,{b:true});assert.equal(s.pipes[4].edgeId,null);tap(s,{b:true});assert.equal(s.edges[4].pipeId,'P5');assert.deepEqual(current(s),before);audit(s);
});

test('undo preserves clock/errors/lifetime edits and submission snapshots are detached from later changes',()=>{
 const s=Model.create();toggle(s,'E1');pump(s);const receipt=clone(s.lastSubmission),at=s.elapsed;assert.equal(s.mistakes,1);
 tap(s,{b:true});assert.ok(s.elapsed>at);assert.equal(s.submissions,1);assert.equal(s.mistakes,1);assert.equal(s.totalEdits,1);assert.equal(s.placements,1);assert.equal(s.undos,1);assert.equal(s.historyDepth,0);assert.equal(s.selectedId,'E1');
 assert.deepEqual(s.lastSubmission,receipt);assert.equal(s.pipeCount,0);assert.equal(s.lastSubmission.pipeAssignments[0].pipeId,'P1');
 toggle(s,'E2');assert.deepEqual(s.lastSubmission,receipt);assert.equal(s.totalEdits,2);audit(s);
});

test('held A/B do not repeat edits or undo, and three fresh PUMP errors lose without editing',()=>{
 const s=Model.create();tick(s,{a:true});ticks(s,50,{a:true});assert.equal(s.totalEdits,1);tick(s);tap(s,{a:true});assert.equal(s.removals,1);
 tick(s,{b:true});ticks(s,40,{b:true});assert.equal(s.undos,1);assert.equal(s.pipeCount,1);tick(s);
 const loss=Model.create();focus(loss,'pump');tick(loss,{a:true});ticks(loss,40,{a:true});assert.equal(loss.submissions,1);tick(loss);tap(loss,{a:true});assert.equal(loss.phase,'playing');tap(loss,{a:true});assert.equal(loss.phase,'lost');assert.equal(loss.lostReason,'mistakes');assert.equal(loss.submissions,3);assert.equal(loss.editAttempts,0);
});

test('score derives from current drawing, so remove/rebuild and undo cannot accumulate edit points',()=>{
 const s=Model.create();tap(s,{b:true});assert.equal(s.undos,0);toggle(s,'E2');const placed=current(s),score=s.score;
 toggle(s,'E2');assert.equal(s.score,0);tap(s,{b:true});assert.equal(s.score,score);assert.deepEqual(current(s),placed);tap(s,{b:true});assert.equal(s.score,0);audit(s);
});

test('all 100 actual directional transitions match weighted focus geometry and all 25 foci are mutually reachable',()=>{
 const base=Model.create();
 for(const item of base.focusItems){const seen=new Set([item.id]),queue=[item.id];for(const id of queue)for(const d of DIRECTIONS){const n=next(base.focusItems,id,d);if(!seen.has(n)){seen.add(n);queue.push(n);}}assert.equal(seen.size,25);
  for(const d of DIRECTIONS){const s=Model.create();s.selectedId=item.id;tick(s);tick(s,d);assert.equal(s.selectedId,next(base.focusItems,item.id,d));assert.equal(s.totalEdits,0);}}
});

test('direction holds repeat after 20 then 10 ticks, resetting on release/change and respecting dominant-axis ties',()=>{
 const s=Model.create(),d={x:1},first=next(s.focusItems,s.selectedId,d);tick(s,d);assert.equal(s.selectedId,first);ticks(s,19,d);assert.equal(s.selectedId,first);
 const second=next(s.focusItems,first,d);tick(s,d);assert.equal(s.selectedId,second);ticks(s,9,d);assert.equal(s.selectedId,second);tick(s,d);assert.equal(s.selectedId,next(s.focusItems,second,d));
 tick(s);const released=next(s.focusItems,s.selectedId,{x:-1});tick(s,{x:-1});assert.equal(s.selectedId,released);
 for(const [input,direction]of [[{x:.5,y:.5},{x:1,y:0}],[{x:.2,y:.4},{x:0,y:1}],[{x:.249,y:.249},null]]){const sample=Model.create(),expected=direction?next(sample.focusItems,'E1',direction):'E1';tick(sample,input);assert.equal(sample.selectedId,expected);}
});

test('navigation precedes A, while B discards coalesced A/navigation for one fixed tick only',()=>{
 const s=Model.create(),id=next(s.focusItems,'E1',{x:1,y:0});tick(s,{x:1,a:true});assert.equal(s.lastEdit.edgeId,id);tick(s);
 tick(s,{b:true,a:true,x:1});assert.equal(s.pipeCount,0);assert.equal(s.selectedId,id);assert.equal(s.editAttempts,1);
 tick(s,{b:true,a:true,x:1});assert.equal(s.selectedId,next(s.focusItems,id,{x:1,y:0}));assert.equal(s.editAttempts,1);
});

test('larger dt honors per-tick B priority and matches split original-state ticks',()=>{
 const a=Model.create(),b=Model.create();tap(a,{a:true});tap(b,{a:true});
 Model.step(a,.25,{b:true,aPressed:true,x:1});tick(b,{b:true,aPressed:true,x:1});ticks(b,14,{b:true,x:1});
 assert.equal(a.pipeCount,0);assert.equal(a.editAttempts,1);const{events:ea,_accumulator:aa,...ra}=a,{events:eb,_accumulator:ab,...rb}=b;assert.deepEqual(ra,rb);assert.ok(Math.abs(aa-ab)<1e-12);
});

test('zero/subtick edges cache one action, cancellation discards pending work and preserves all actual inventory/history',()=>{
 const s=Model.create();Model.step(s,0,{aPressed:true,x:1});assert.equal(s.totalEdits,0);Model.step(s,DT/2,{});assert.equal(s.totalEdits,0);Model.step(s,DT/2,{});assert.equal(s.totalEdits,1);assert.equal(s.selectedId,'E1');
 const before=current(s),history=clone(s.history),id=s.selectedId;tick(s,{cancelEpoch:2});Model.step(s,DT/2,{aPressed:true,bPressed:true});Model.step(s,DT/2,{cancelEpoch:3,cancelled:true,x:1});
 ticks(s,5,{cancelled:true,a:true,b:true,aPressed:true,bPressed:true,x:1});assert.deepEqual(current(s),before);assert.deepEqual(s.history,history);assert.equal(s.selectedId,id);assert.equal(s.totalEdits,1);
 tick(s,{a:true,b:true});assert.equal(s.totalEdits,1);tick(s);tap(s,{b:true});assert.equal(s.pipeCount,0);
});

test('deadline wins priority over a ready PUMP, undo and navigation, with complete terminal freeze',()=>{
 const ready=Model.create();draw(ready,SOLUTIONS[0]);focus(ready,'pump');const undo=Model.create();toggle(undo,'E1');
 for(const[s,input]of[[ready,{a:true}],[undo,{b:true}],[Model.create(),{x:1}]]){
  // Exact-last-tick fixture: production still executes ordinary input and terminal priority.
  s.tick=5399;s.elapsed=5399/60;s.remaining=1/60;const before=current(s),id=s.selectedId,edits=s.totalEdits;
  tick(s,input);assert.equal(s.phase,'lost');assert.equal(s.lostReason,'timeout');assert.equal(s.remaining,0);assert.deepEqual(current(s),before);assert.equal(s.selectedId,id);assert.equal(s.totalEdits,edits);assert.equal(s.submissions,0);
  const frozen=clone(s);for(const dt of[0,DT,.25,100,NaN])Model.step(s,dt,{aPressed:true,bPressed:true,x:1,cancelEpoch:100});assert.deepEqual(s,frozen);
 }
 const won=Model.create();draw(won,SOLUTIONS[0]);pump(won);const frozen=clone(won);Model.step(won,.25,{b:true,cancelled:true});assert.deepEqual(won,frozen);
 const idle=Model.create();ticks(idle,5399);assert.equal(idle.phase,'playing');assert.ok(idle.remaining>0);tick(idle);assert.equal(idle.phase,'lost');assert.equal(idle.lostReason,'timeout');assert.equal(idle.tick,5400);assert.equal(idle.elapsed,90);assert.equal(idle.totalEdits,0);
});

test('retry is deterministic with independent stock/history and public JSON copies continue identically',()=>{
 for(let d=0;d<3;d++){const a=Model.create(5,d),initial=clone(a);draw(a,['E1','E2']);const retry=Model.create(5,d);assert.deepEqual(retry,initial);
  for(const key of['pipes','edges','vertices','plots','history'])assert.notStrictEqual(a[key],retry[key]);const continuation=clone(a);tick(a);tick(continuation);assert.deepEqual(a,continuation);}
});

test('numeric inputs are sanitized and all public counters/arrays remain finite and bounded',()=>{
 const s=Model.create();for(const dt of[NaN,Infinity,-Infinity,-1,'1',undefined])Model.step(s,dt,{});assert.equal(s.tick,0);tick(s,{x:NaN,y:Infinity});assert.equal(s.selectedId,'E1');const at=s.tick;Model.step(s,100,{});assert.equal(s.tick,at+15);
 assert.equal(Model.create(NaN,NaN).seed,1);assert.equal(Model.create(1,-2).level,1);assert.equal(Model.create(1,8).level,3);assert.equal(Model.create(1,1.9).level,2);
 function check(value){if(typeof value==='number')assert.ok(Number.isFinite(value));else if(value&&typeof value==='object')Object.values(value).forEach(check);}check(s);assert.ok(s.events.length<=32);assert.ok(s.pipeCount<=16);audit(s);
});

// The following full rounds consume only frozen public JSON observations.
// The pilot has its own graph/search implementation and receives no SOLUTIONS,
// DOUBLES, production-state reference, private input fields or authored routes.
const {pathToFileURL}=require('node:url');
const automationModule=import(pathToFileURL(path.join(__dirname,'automation.mjs')).href);
function snapshot(s){return{phase:s.phase,paused:false,model:JSON.parse(JSON.stringify(s,(key,value)=>key.startsWith('_')?undefined:value))};}
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
for(let difficulty=0;difficulty<3;difficulty++){
 test(`public-planned place/remove/exact-undo round explicitly starts the valid loop on puzzle ${difficulty+1}`,async()=>{
  const automation=await automationModule,pilot=automation.createPilot(),s=Model.create(41,difficulty);
  const initial=snapshot(s),trace=[{elapsed:0,state:initial}];let keys=[],lastA=false,lastB=false;
  // Defined ordinary-input scenario: runtime 60 Hz, observed once per five
  // ticks. This is not a guarantee for arbitrary plans or polling timings.
  for(let frame=0;frame<5401&&s.phase==='playing';frame++){
   if(frame%5===0){const observed=snapshot(s);trace.push({elapsed:s.elapsed,state:observed});keys=pilot(freeze(observed),{mode:'record',elapsed:s.elapsed});}
   const a=keys.includes('Space'),b=keys.includes('b');
   Model.step(s,DT,{x:Number(keys.includes('ArrowRight'))-Number(keys.includes('ArrowLeft')),
    y:Number(keys.includes('ArrowDown'))-Number(keys.includes('ArrowUp')),a,b,aPressed:a&&!lastA,bPressed:b&&!lastB,cancelEpoch:0});
   lastA=a;lastB=b;
  }
  const after=snapshot(s);trace.push({elapsed:s.elapsed,state:after});
  automation.assertProgress({before:initial,after,trace},assert);
  assert.equal(s.phase,'won');assert.ok(s.elapsed>=30&&s.elapsed<90);assert.equal(s.undos,1);assert.equal(s.submissions,1);assert.equal(s.mistakes,0);
  assert.equal(s.singleLoop,true);assert.equal(s.componentCount,1);assert.equal(s.allCluesMet,true);assert.equal(s.allTreesCovered,true);assert.equal(s.flowersAvoided,true);assert.ok(s.pipesRemaining>0);
  assert.equal(s.totalEdits,s.pipeCount+1);assert.equal(s.placements,s.pipeCount);assert.equal(s.removals,1);assert.equal(s.historyDepth,s.pipeCount);
  const placed=trace.find(t=>t.state.model.totalEdits===1&&t.state.model.undos===0)?.state.model;
  const removed=trace.find(t=>t.state.model.totalEdits===2&&t.state.model.undos===0)?.state.model;
  const restored=trace.find(t=>t.state.model.totalEdits===2&&t.state.model.undos===1)?.state.model;
  assert.ok(placed&&removed&&restored);
  assert.equal(placed.pipeCount,1);assert.equal(removed.pipeCount,0);assert.equal(restored.pipeCount,1);
  assert.notDeepEqual(current(placed),current(initial.model),'placing changes real graph, plot counts and stock');
  assert.deepEqual(current(removed),current(initial.model),'A removal restores all actual empty-board facts');
  assert.deepEqual(current(restored),current(placed),'B restores the same physical pipe and full graph/clue state');
  assert.equal(removed.lastEdit.beforePipeId,placed.lastEdit.afterPipeId);assert.equal(removed.lastEdit.edgeId,placed.lastEdit.edgeId);
  assert.equal(restored.edges.find(e=>e.id===placed.lastEdit.edgeId).pipeId,placed.lastEdit.afterPipeId);
  assert.deepEqual(restored.lastUndo.edit,removed.lastEdit);assert.equal(restored.totalEdits,removed.totalEdits);assert.equal(restored.editAttempts,removed.editAttempts);
  assert.equal(restored.placements,1);assert.equal(restored.removals,1);assert.equal(restored.historyDepth,1);assert.ok(restored.elapsed>removed.elapsed&&removed.elapsed>placed.elapsed);
  const diagnostics=pilot.diagnostics(),undo=diagnostics.find(e=>e.type==='observed-undo-removal');assert.ok(undo);
  assert.equal(undo.edgeId,placed.lastEdit.edgeId);assert.equal(undo.pipeId,placed.lastEdit.afterPipeId);
  assert.ok(diagnostics.some(e=>e.type==='observed-ready-before-PUMP'&&e.submissions===0));
  const frozen=clone(s);Model.step(s,.25,{a:true,b:true,x:1,cancelled:true});assert.deepEqual(s,frozen);
  automation.assertRetry({after:snapshot(Model.create(41,difficulty)),initial},assert);
 });
 test(`three ordinary empty-board PUMP attempts lose puzzle ${difficulty+1} without changing physical inventory`,async()=>{
  const automation=await automationModule,s=Model.create(41,difficulty),initial=snapshot(s),before=current(s);
  const inputs={N:{y:-1},E:{x:1},S:{y:1},W:{x:-1}};
  for(const dir of automation.focusPath(freeze(snapshot(s).model),'pump'))tap(s,inputs[dir]);
  assert.equal(s.selectedId,'pump');assert.equal(s.goalReady,false);
  for(let count=1;count<=3;count++){
   tap(s,{a:true});assert.equal(s.submissions,count);assert.equal(s.mistakes,count);assert.equal(s.lastSubmission.id,count);
   assert.equal(s.lastSubmission.reason,'empty');assert.equal(s.lastSubmission.accepted,false);assert.equal(s.phase,count===3?'lost':'playing');
   assert.deepEqual(s.lastSubmission.pipeAssignments,[]);assert.deepEqual(current(s),before);assert.equal(s.totalEdits,0);assert.equal(s.editAttempts,0);assert.equal(s.historyDepth,0);assert.equal(s.undos,0);
  }
  assert.equal(s.lostReason,'mistakes');automation.assertPublicNetwork(s,assert);
  const frozen=clone(s);Model.step(s,.25,{b:true});assert.deepEqual(s,frozen);
  automation.assertRetry({after:snapshot(Model.create(41,difficulty)),initial},assert);
 });
}
