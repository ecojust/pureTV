'use strict';
// Rule-level evidence only. The authored action examples below are explicitly
// not the independent public-pilot full-round evidence appended by the parent.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=path.join(__dirname,'../src/main/assets/game-model.js'),Model=require(source),DT=1/60;
const clone=x=>JSON.parse(JSON.stringify(x));
const tick=(s,input={})=>Model.step(s,DT,input);
function ticks(s,n,input={}){for(let i=0;i<n;i++)tick(s,input);}
function tap(s,input){tick(s,input);tick(s);}
const DIRS=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
function nextFocus(items,id,d){const f=items.find(x=>x.id===id);return items.map((item,index)=>{const dx=item.x-f.x,dy=item.y-f.y,perp=Math.abs(d.x?dy:dx),distance=dx*dx+dy*dy;return{item,index,forward:dx*(d.x||0)+dy*(d.y||0),distance,perp,cost:distance+2*perp*perp};}).filter(x=>x.forward>0).sort((a,b)=>a.cost-b.cost||a.distance-b.distance||a.perp-b.perp||a.index-b.index)[0]?.item.id||id;}
function focus(s,id){const queue=[[s.selectedId,[]]],seen=new Set([s.selectedId]);let route;for(const [at,keys]of queue){if(at===id){route=keys;break;}for(const d of DIRS){const next=nextFocus(s.focusItems,at,d);if(!seen.has(next)){seen.add(next);queue.push([next,[...keys,d]]);}}}assert.ok(route,`public navigation reaches ${id}`);for(const d of route)tap(s,d);assert.equal(s.selectedId,id);}
function compact(s,id){focus(s,id);tap(s,{a:true});}
function play(s,ids){for(const id of ids){assert.equal(s.phase,'playing');compact(s,id);}}
function assignments(s){return s.cells.filter(c=>c.stoneId!==null).map(c=>({cellId:c.id,stoneId:c.stoneId}));}
function layout(s){return clone({cells:s.cells,stones:s.stones,pillarIds:s.pillarIds,targetHoleIds:s.targetHoleIds,holeIds:s.holeIds,readCellIds:s.readCellIds,readStoneIds:s.readStoneIds,readValues:s.readValues,orderedPairs:s.orderedPairs,strictlyIncreasing:s.strictlyIncreasing,matchedHoleCount:s.matchedHoleCount,holesCorrect:s.holesCorrect,goalReady:s.goalReady});}
// Independent geometric predictor derives segments from actual cell kind and
// col/row, without using Model.preview, Model.lines.segments or production code.
function predict(s,id){const action=s.actions.find(a=>a.id===id),axis=action.direction==='W'||action.direction==='E'?'row':'col';
 const index=Number(id.slice(1,-1))-1,line=s.cells.filter(c=>c[axis]===index).sort((a,b)=>axis==='row'?a.col-b.col:a.row-b.row),segments=[];let segment=[];
 for(const c of line){if(c.kind==='pillar'){if(segment.length)segments.push(segment);segment=[];}else segment.push(c);}if(segment.length)segments.push(segment);
 const byCell=new Map(s.cells.map(c=>[c.id,c.stoneId]));
 for(const cells of segments){const stones=cells.map(c=>c.stoneId).filter(id=>id!==null),empty=Array(cells.length-stones.length).fill(null),out=action.direction==='W'||action.direction==='N'?[...stones,...empty]:[...empty,...stones];cells.forEach((c,i)=>byCell.set(c.id,out[i]));}
 const after=s.cells.filter(c=>byCell.get(c.id)!==null).map(c=>({cellId:c.id,stoneId:byCell.get(c.id)}));
 const moves=s.stones.flatMap(stone=>{const to=after.find(a=>a.stoneId===stone.id).cellId;return to===stone.cellId?[]:[{stoneId:stone.id,fromCellId:stone.cellId,toCellId:to}];});
 return{action,segments:segments.map(a=>a.map(c=>c.id)),after,moves,changed:moves.length>0};
}
function audit(s){
 const occupied=assignments(s);assert.equal(occupied.length,s.stones.length);assert.equal(s.stoneCount,s.stones.length);assert.equal(new Set(occupied.map(a=>a.stoneId)).size,s.stoneCount);
 for(const stone of s.stones){assert.equal(s.cells.find(c=>c.id===stone.cellId)?.stoneId,stone.id);assert.equal(occupied.filter(a=>a.stoneId===stone.id).length,1);}
 for(const c of s.cells)if(c.kind==='pillar'){assert.equal(c.stoneId,null);assert.equal(c.targetHole,false);}
 assert.deepEqual(s.pillarIds,s.cells.filter(c=>c.kind==='pillar').map(c=>c.id));assert.deepEqual(s.holeIds,s.cells.filter(c=>c.kind==='sand'&&c.stoneId===null).map(c=>c.id));assert.deepEqual(s.targetHoleIds,s.cells.filter(c=>c.targetHole).map(c=>c.id));
 const read=s.snakeOrder.map(id=>s.cells.find(c=>c.id===id)).filter(c=>c.stoneId!==null),values=read.map(c=>s.stones.find(t=>t.id===c.stoneId).value);
 assert.deepEqual(s.readCellIds,read.map(c=>c.id));assert.deepEqual(s.readStoneIds,read.map(c=>c.stoneId));assert.deepEqual(s.readValues,values);
 const pairs=values.slice(1).reduce((n,v,i)=>n+Number(values[i]<v),0);assert.equal(s.orderedPairs,pairs);assert.equal(s.orderPairCount,s.stoneCount-1);assert.equal(s.strictlyIncreasing,pairs===s.orderPairCount);
 const matched=s.targetHoleIds.filter(id=>s.holeIds.includes(id)).length;assert.equal(s.matchedHoleCount,matched);assert.equal(s.holesCorrect,matched===s.targetHoleIds.length&&s.holeIds.length===s.targetHoleIds.length);assert.equal(s.goalReady,s.strictlyIncreasing&&s.holesCorrect);
 assert.equal(s.historyDepth,s.history.length);assert.equal(s.historyDepth,s.movesUsed-s.undos);assert.equal(s.compactionAttempts,s.movesUsed+s.noOpAttempts);assert.equal(s.movesRemaining,Math.max(0,s.moveLimit-s.movesUsed));
 assert.equal(s.score,s.orderedPairs*25+s.matchedHoleCount*20+(s.phase==='won'?1000+Math.floor(s.remaining)*5+s.movesRemaining*50:0));
 const p=predict(s,s.selectedId);assert.deepEqual(s.preview.afterAssignments,p.after);assert.deepEqual(s.preview.moves,p.moves);assert.equal(s.preview.changed,p.changed);assert.equal(s.preview.movedCount,p.moves.length);
}
// Author-derived rule witnesses. Production carries no corresponding route.
const WIN=[['R2E','C1S','C2S','C4S'],['R1E','C3S','R4W','C2N','R4W'],['R1E','R3E','C4N','R3W','R4E','C4N']];
const TRIAL=['R1W','R3W','R1W'];
const LOSS=[['R1W','R1E','R1W','R1E','R1W','R1E'],['R1E','R1W','R1E','R1W','R1E','R1W','R1E'],['R1W','R1E','R1W','R1E','R1W','R1E','R1W','R1E']];
const SORTED_WRONG_HOLES=[['C1S','C2S'],[],['R3W','C2S']];
const HOLES_WRONG_ORDER=[['C1S','C2S','C4S','R2E'],['R1E','R4W','C2N','C3S','R4W'],['R1E','R3W','C4N','R4E','C4N']];

test('UMD and all three public starting boards contain independent physical stones and derived nonzero scores',()=>{
 assert.deepEqual(Object.keys(Model).sort(),['TICK_HZ','create','step']);assert.equal(Model.TICK_HZ,60);const sandbox={};vm.runInNewContext(fs.readFileSync(source,'utf8'),sandbox);assert.deepEqual(clone(sandbox.PureModel.create(9,1)),Model.create(9,1));
 for(let d=0;d<3;d++){const s=Model.create(9,d);assert.equal(s.level,d+1);assert.equal(s.cells.length,16);assert.equal(s.actions.length,16);assert.equal(s.lines.length,8);assert.equal(s.stones.length,6+d);assert.equal(s.moveLimit,6+d);assert.equal(s.score,[155,210,170][d]);assert.equal(s.goalReady,false);assert.equal(s.movesUsed,0);assert.equal(s.historyDepth,0);assert.equal(s.selectedId,'R1W');audit(s);}
});

test('all row/column lines and arrows have exact geometry and pillar-separated ordered segment membership',()=>{
 for(let d=0;d<3;d++){const s=Model.create(1,d);s.cells.forEach((c,i)=>{assert.equal(c.id,'C'+(i+1));assert.equal(c.col,i%4);assert.equal(c.row,Math.floor(i/4));assert.equal(c.x,180+(i%4+.5)*72);assert.equal(c.y,136+(Math.floor(i/4)+.5)*72);});
  for(const line of s.lines){const cells=s.cells.filter(c=>c[line.axis==='row'?'row':'col']===line.index),expected=[];let segment=[];for(const c of cells){if(c.kind==='pillar'){if(segment.length)expected.push(segment);segment=[];}else segment.push(c.id);}if(segment.length)expected.push(segment);
   assert.deepEqual(line.cellIds,cells.map(c=>c.id));assert.deepEqual(line.segments,expected);assert.equal(new Set(line.segments.flat()).size,line.segments.flat().length);}
  s.actions.forEach((a,i)=>{const row=i<8,n=Math.floor((row?i:i-8)/2),second=i%2===1;assert.equal(a.id,(row?'R':'C')+(n+1)+(row?(second?'E':'W'):(second?'S':'N')));assert.equal(a.x,row?(second?508:140):180+(n+.5)*72);assert.equal(a.y,row?136+(n+.5)*72:(second?464:96));});
  assert.deepEqual(s.focusItems,s.actions.map(a=>({id:a.id,kind:'compact',x:a.x,y:a.y})));}
});

test('all 48 initial arrow actions agree with independent segment compaction, charge once and are idempotent',()=>{
 let changed=0,noops=0,multi=0;
 for(let d=0;d<3;d++)for(const action of Model.create(1,d).actions){const s=Model.create(1,d);focus(s,action.id);const before=assignments(s),expected=predict(s,action.id),pillars=clone(s.cells.filter(c=>c.kind==='pillar'));
  assert.deepEqual(s.preview.afterAssignments,expected.after);assert.deepEqual(s.preview.moves,expected.moves);assert.equal(s.movesUsed,0);assert.deepEqual(assignments(s),before);
  tap(s,{a:true});assert.deepEqual(assignments(s),expected.after);assert.deepEqual(s.cells.filter(c=>c.kind==='pillar'),pillars);assert.equal(s.movesUsed,Number(expected.changed));assert.equal(s.compactionAttempts,1);assert.equal(s.noOpAttempts,Number(!expected.changed));
  if(expected.changed){changed++;multi+=Number(expected.moves.length>1);assert.deepEqual(s.lastCompaction.beforeAssignments,before);assert.deepEqual(s.lastCompaction.afterAssignments,expected.after);assert.deepEqual(s.lastCompaction.moves,expected.moves);assert.equal(s.lastCompaction.id,1);assert.equal(s.lastCompaction.movedCount,expected.moves.length);}else{noops++;assert.equal(s.lastCompaction,null);}
  const stable=layout(s),depth=s.historyDepth;tap(s,{a:true});assert.deepEqual(layout(s),stable);assert.equal(s.historyDepth,depth);assert.equal(s.movesUsed,Number(expected.changed));assert.equal(s.compactionAttempts,2);assert.equal(s.noOpAttempts,Number(!expected.changed)+1);audit(s);
 }
 assert.ok(changed>0&&noops>0&&multi>0);
});

test('east and south preserve physical order rather than reversing, sorting or merging stones',()=>{
 const east=Model.create();compact(east,'R1E');assert.deepEqual(east.cells.slice(0,4).map(c=>c.stoneId),[null,null,'S1','S2']);
 const south=Model.create();play(south,['R2E','C1S','C2S']);const before=south.lines.find(l=>l.id==='column4').segments.map(seg=>seg.map(id=>south.cells.find(c=>c.id===id).stoneId).filter(Boolean));compact(south,'C4S');
 const after=south.lines.find(l=>l.id==='column4').segments.map(seg=>seg.map(id=>south.cells.find(c=>c.id===id).stoneId).filter(Boolean));assert.deepEqual(after,before);assert.ok(south.lastCompaction.movedCount>=2);assert.equal(south.stoneCount,6);audit(south);
});

test('same-value physical stones never merge and cannot win even when actual target holes match',()=>{
 for(let d=0;d<3;d++){const s=Model.create(1,d);s.stones[1].value=s.stones[0].value;play(s,WIN[d]);assert.equal(s.holesCorrect,true);assert.equal(s.strictlyIncreasing,false);assert.equal(s.goalReady,false);assert.equal(s.phase,'playing');assert.equal(s.stoneCount,6+d);assert.ok(s.readStoneIds.includes('S1')&&s.readStoneIds.includes('S2'));assert.equal(s.readValues.filter(v=>v===1).length,2);audit(s);}
});

test('ordinary authored states demonstrate strict order alone is insufficient and exact holes alone is insufficient',()=>{
 for(let d=0;d<3;d++){const ordered=Model.create(1,d);play(ordered,SORTED_WRONG_HOLES[d]);assert.equal(ordered.strictlyIncreasing,true);assert.equal(ordered.holesCorrect,false);assert.equal(ordered.goalReady,false);assert.equal(ordered.phase,'playing');
  const holes=Model.create(1,d);play(holes,HOLES_WRONG_ORDER[d]);assert.equal(holes.holesCorrect,true);assert.equal(holes.strictlyIncreasing,false);assert.equal(holes.goalReady,false);assert.equal(holes.phase,'playing');audit(ordered);audit(holes);}
});

test('ordinary authored shortest paths win all three boards with two charged moves remaining',()=>{
 for(let d=0;d<3;d++){const s=Model.create(1,d);play(s,WIN[d]);assert.equal(s.phase,'won');assert.equal(s.movesUsed,4+d);assert.equal(s.movesRemaining,2);assert.equal(s.goalReady,true);assert.equal(s.transition,null);assert.equal(s.lostReason,null);audit(s);}
});

test('two real multi-stone trials and undos do not refund moves, and the final permitted solution move still wins',()=>{
 for(let d=0;d<3;d++){const s=Model.create(1,d),initial=layout(s);for(let trial=1;trial<=2;trial++){compact(s,TRIAL[d]);assert.ok(s.lastCompaction.movedCount>=2);assert.equal(s.phase,'playing');tap(s,{b:true});assert.deepEqual(layout(s),initial);assert.equal(s.movesUsed,trial);assert.equal(s.undos,trial);assert.equal(s.historyDepth,0);assert.equal(s.movesRemaining,s.moveLimit-trial);}
  for(let i=0;i<WIN[d].length;i++){focus(s,WIN[d][i]);if(i===WIN[d].length-1){assert.equal(s.preview.willWin,true);assert.equal(s.preview.willExhaustMoves,false);}tap(s,{a:true});}assert.equal(s.phase,'won');assert.equal(s.movesUsed,s.moveLimit);assert.equal(s.movesRemaining,0);assert.equal(s.transition,null);assert.equal(s.lostReason,null);audit(s);}
});

test('ordinary successful compaction sequences really exhaust each board without a goal',()=>{
 for(let d=0;d<3;d++){const s=Model.create(1,d);for(let i=0;i<LOSS[d].length;i++){focus(s,LOSS[d][i]);if(i===LOSS[d].length-1){assert.equal(s.preview.willExhaustMoves,true);assert.equal(s.preview.willWin,false);}tap(s,{a:true});assert.equal(s.movesUsed,i+1);assert.equal(s.noOpAttempts,0);assert.equal(s.phase,i===LOSS[d].length-1?'lost':'playing');}assert.equal(s.lostReason,'moves');assert.equal(s.movesRemaining,0);assert.equal(s.goalReady,false);assert.equal(s.transition,null);audit(s);}
});

test('B restores the exact pre-compaction layout because opposite compaction is not an inverse',()=>{
 const s=Model.create(),initial=layout(s);compact(s,'R1W');const receipt=clone(s.lastCompaction),at=s.elapsed;assert.notDeepEqual(assignments(s),receipt.beforeAssignments);
 assert.notDeepEqual(predict(s,'R1E').after,receipt.beforeAssignments,'different preimage must not be approximated by an opposite-direction move');
 focus(s,'C4S');tap(s,{b:true});assert.deepEqual(layout(s),initial);assert.equal(s.selectedId,'R1W');assert.deepEqual(s.lastUndo.edit,receipt);assert.deepEqual(s.lastCompaction,receipt);assert.ok(s.elapsed>at);assert.equal(s.movesUsed,1);assert.equal(s.movesRemaining,5);assert.equal(s.undos,1);assert.equal(s.historyDepth,0);
 const counts=[s.movesUsed,s.undos,s.compactionAttempts,s.noOpAttempts];tap(s,{b:true});assert.deepEqual([s.movesUsed,s.undos,s.compactionAttempts,s.noOpAttempts],counts);audit(s);
});

test('nested histories, receipts and transitions are detached; undo then new compaction keeps increasing lifetime IDs',()=>{
 const s=Model.create();compact(s,'R1W');const old=clone(s.lastCompaction);assert.notStrictEqual(s.lastCompaction,s.history[0]);assert.notStrictEqual(s.lastCompaction.moves,s.history[0].moves);assert.notStrictEqual(s.lastCompaction.beforeAssignments,s.history[0].beforeAssignments);assert.notStrictEqual(s.transition.moves,s.lastCompaction.moves);assert.deepEqual(s.transition.moves,s.lastCompaction.moves);
 tap(s,{b:true});assert.deepEqual(s.lastUndo.edit,old);assert.notStrictEqual(s.lastUndo.edit,s.lastCompaction);assert.notStrictEqual(s.lastUndo.edit.moves,s.lastCompaction.moves);
 compact(s,'R1W');assert.equal(s.lastCompaction.id,2);assert.equal(s.history[0].id,2);assert.equal(s.movesUsed,2);assert.equal(s.undos,1);assert.equal(s.historyDepth,1);assert.deepEqual(s.lastUndo.edit,old);audit(s);
});

test('no-op A does not become history, so B still restores the most recent successful action',()=>{
 const s=Model.create(),initial=layout(s);compact(s,'R1W');const edit=clone(s.lastCompaction);tap(s,{a:true});assert.equal(s.noOpAttempts,1);assert.equal(s.historyDepth,1);assert.deepEqual(s.lastCompaction,edit);tap(s,{b:true});assert.deepEqual(layout(s),initial);assert.deepEqual(s.lastUndo.edit,edit);assert.equal(s.movesUsed,1);assert.equal(s.compactionAttempts,2);assert.equal(s.noOpAttempts,1);audit(s);
});

test('movement interpolation reflects committed changes, no-op does not extend it, and undo emits the actual reverse changes',()=>{
 const s=Model.create();tick(s,{a:true});assert.equal(s.transition.kind,'compact');assert.equal(s.transition.duration,.24);assert.deepEqual(s.transition.moves,s.lastCompaction.moves);const started=s.transition.startedAt,committed=assignments(s);tick(s);tap(s,{a:true});assert.equal(s.transition.startedAt,started);assert.deepEqual(assignments(s),committed);
 ticks(s,20);assert.equal(s.transition,null);const beforeUndo=assignments(s),edit=clone(s.lastCompaction);tap(s,{b:true});assert.equal(s.transition.kind,'undo');assert.equal(s.transition.actionId,edit.actionId);assert.deepEqual(assignments(s),edit.beforeAssignments);
 assert.deepEqual(s.transition.moves,edit.moves.map(m=>({stoneId:m.stoneId,fromCellId:m.toCellId,toCellId:m.fromCellId})));assert.notDeepEqual(assignments(s),beforeUndo);ticks(s,20);assert.equal(s.transition,null);
});

test('64 directional transitions from explicit focus fixtures match geometry, and the 16-focus navigation graph is strongly connected',()=>{
 // Each tested source focus is explicitly seeded; the separate graph traversal
 // proves reachability mathematically, not an ordinary-input visit to each start.
 const base=Model.create();for(const item of base.focusItems){const seen=new Set([item.id]),queue=[item.id];for(const id of queue)for(const d of DIRS){const n=nextFocus(base.focusItems,id,d);if(!seen.has(n)){seen.add(n);queue.push(n);}}assert.equal(seen.size,16);
  for(const d of DIRS){const s=Model.create();s.selectedId=item.id;tick(s);tick(s,d);assert.equal(s.selectedId,nextFocus(base.focusItems,item.id,d));assert.equal(s.movesUsed,0);assert.deepEqual(s.cursor,s.focusItems.find(f=>f.id===s.selectedId));}}
});

test('navigation repeats after 20 then 10 held ticks and resets on release or direction change',()=>{
 const s=Model.create(),d={x:1},first=nextFocus(s.focusItems,s.selectedId,d);tick(s,d);assert.equal(s.selectedId,first);ticks(s,19,d);assert.equal(s.selectedId,first);const second=nextFocus(s.focusItems,first,d);tick(s,d);assert.equal(s.selectedId,second);ticks(s,9,d);assert.equal(s.selectedId,second);tick(s,d);assert.equal(s.selectedId,nextFocus(s.focusItems,second,d));tick(s);const left=nextFocus(s.focusItems,s.selectedId,{x:-1});tick(s,{x:-1});assert.equal(s.selectedId,left);
 for(const [input,direction]of[[{x:.5,y:.5},{x:1}],[{x:.2,y:.4},{y:1}],[{x:.249,y:.249},null]]){const m=Model.create();tick(m,input);assert.equal(m.selectedId,direction?nextFocus(m.focusItems,'R1W',direction):'R1W');}
});

test('held A and B remain edge actions rather than repetitive attempts or undo',()=>{
 const s=Model.create();tick(s,{a:true});ticks(s,50,{a:true});assert.equal(s.compactionAttempts,1);assert.equal(s.movesUsed,1);tick(s);tick(s,{b:true});ticks(s,50,{b:true});assert.equal(s.undos,1);assert.equal(s.movesUsed,1);assert.equal(s.historyDepth,0);audit(s);
});

test('navigation runs before A; B suppresses coalesced A and direction only for its fixed tick',()=>{
 const s=Model.create(),target=nextFocus(s.focusItems,s.selectedId,{y:1});tick(s,{y:1,a:true});assert.equal(s.selectedId,target);assert.equal(s.compactionAttempts,1);
 const q=Model.create();compact(q,'R1W');const initial=Model.create();tick(q,{b:true,a:true,x:1});assert.equal(q.compactionAttempts,1);assert.equal(q.undos,1);assert.deepEqual(layout(q),layout(initial));const before=q.selectedId;tick(q,{b:true,a:true,x:1});assert.equal(q.selectedId,nextFocus(q.focusItems,before,{x:1}));assert.equal(q.compactionAttempts,1);
});

test('one coalesced A edge acts only once across many fixed ticks, and larger samples preserve B priority',()=>{
 const s=Model.create();Model.step(s,.25,{aPressed:true});assert.equal(s.compactionAttempts,1);assert.equal(s.movesUsed,1);
 const a=Model.create(),b=Model.create();tap(a,{a:true});tap(b,{a:true});Model.step(a,.25,{b:true,aPressed:true,x:1});tick(b,{b:true,aPressed:true,x:1});ticks(b,14,{b:true,x:1});
 const {events:ea,_accumulator:aa,...ra}=a,{events:eb,_accumulator:ab,...rb}=b;assert.deepEqual(ra,rb);assert.ok(Math.abs(aa-ab)<1e-12);assert.equal(a.compactionAttempts,1);assert.equal(a.undos,1);
});

test('zero/subtick pending edges act only at a tick; cancellation drops edges while preserving actual board and history',()=>{
 const s=Model.create();Model.step(s,0,{aPressed:true});assert.equal(s.movesUsed,0);Model.step(s,DT/2,{});assert.equal(s.movesUsed,0);Model.step(s,DT/2,{});assert.equal(s.movesUsed,1);
 const before=layout(s),history=clone(s.history),selected=s.selectedId;tick(s,{cancelEpoch:1});Model.step(s,DT/2,{aPressed:true,bPressed:true});Model.step(s,DT/2,{cancelEpoch:2,cancelled:true,x:1});ticks(s,5,{cancelled:true,a:true,b:true,aPressed:true,bPressed:true,x:1});assert.deepEqual(layout(s),before);assert.deepEqual(s.history,history);assert.equal(s.selectedId,selected);assert.equal(s.movesUsed,1);assert.equal(s.undos,0);
 tick(s,{a:true,b:true});assert.equal(s.compactionAttempts,1);tick(s);tap(s,{b:true});assert.equal(s.undos,1);assert.equal(s.movesUsed,1);audit(s);
});

test('last-tick timeout precedes a winning compaction, undo and navigation and clears transient presentation',()=>{
 const ready=Model.create();play(ready,WIN[0].slice(0,-1));focus(ready,WIN[0].at(-1));assert.equal(ready.preview.willWin,true);
 const undo=Model.create();compact(undo,'R1W');
 for(const [s,input]of[[ready,{a:true}],[undo,{b:true}],[Model.create(),{x:1}]]){
  // Labeled deadline fixture: only clock changes; ordinary input reaches real adjudication.
  s.tick=5399;s.elapsed=5399/60;s.remaining=1/60;const before=layout(s),selected=s.selectedId,moves=s.movesUsed,undos=s.undos;
  tick(s,input);assert.equal(s.phase,'lost');assert.equal(s.lostReason,'timeout');assert.equal(s.remaining,0);assert.deepEqual(layout(s),before);assert.equal(s.selectedId,selected);assert.equal(s.movesUsed,moves);assert.equal(s.undos,undos);assert.equal(s.transition,null);
 }
 const idle=Model.create();ticks(idle,5399);assert.equal(idle.phase,'playing');tick(idle);assert.equal(idle.phase,'lost');assert.equal(idle.tick,5400);assert.equal(idle.elapsed,90);assert.equal(idle.lostReason,'timeout');
});

test('complete terminal state freezes after ordinary victory or ordinary move-budget loss',()=>{
 const won=Model.create();play(won,WIN[0]);const lost=Model.create();play(lost,LOSS[0]);for(const s of[won,lost]){const before=clone(s);for(const dt of[0,DT,.25,100,NaN])Model.step(s,dt,{aPressed:true,bPressed:true,x:1,cancelEpoch:100,cancelled:true});assert.deepEqual(s,before);}
});

test('retry recreates identical public puzzles with independent nested arrays and serializable ongoing state',()=>{
 for(let d=0;d<3;d++){const s=Model.create(5,d),initial=clone(s);compact(s,TRIAL[d]);tap(s,{b:true});const retry=Model.create(5,d);assert.deepEqual(retry,initial);for(const k of['cells','stones','lines','actions','history'])assert.notStrictEqual(s[k],retry[k]);const continuation=clone(s);tick(s);tick(continuation);assert.deepEqual(s,continuation);}
});

test('score tracks the current arrangement and charged remaining budget rather than accumulating from undo/no-ops',()=>{
 const s=Model.create(),score=s.score;compact(s,'R1W');const changed=s.score;tap(s,{a:true});assert.equal(s.score,changed);tap(s,{b:true});assert.equal(s.score,score);assert.equal(s.movesUsed,1);assert.equal(s.movesRemaining,5);assert.equal(s.compactionAttempts,2);audit(s);
});

test('numeric inputs are sanitized and all counters, arrays and public preview values remain finite',()=>{
 const s=Model.create();for(const dt of[NaN,Infinity,-Infinity,-1,'1',undefined])Model.step(s,dt,{});assert.equal(s.tick,0);tick(s,{x:NaN,y:Infinity});assert.equal(s.selectedId,'R1W');const at=s.tick;Model.step(s,100,{});assert.equal(s.tick,at+15);
 assert.equal(Model.create(NaN,NaN).seed,1);assert.equal(Model.create(1,-2).level,1);assert.equal(Model.create(1,8).level,3);assert.equal(Model.create(1,1.9).level,2);
 function finite(v){if(typeof v==='number')assert.ok(Number.isFinite(v));else if(v&&typeof v==='object')Object.values(v).forEach(finite);}finite(s);assert.ok(s.events.length<=32);audit(s);
});

// Full rounds below use frozen public JSON observations, normal keyboard edges,
// and the separately implemented public predictor/planner. No WIN/TRIAL/LOSS
// rule witnesses, production-state references or private fields reach the pilot.
{
 const {pathToFileURL}=require('node:url');
 const ordinaryModule=import(pathToFileURL(path.join(__dirname,'automation.mjs')).href);
 function ordinarySnapshot(s){return{phase:s.phase,paused:false,model:JSON.parse(JSON.stringify(s,(key,value)=>key.startsWith('_')?undefined:value))};}
 function ordinaryFreeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(ordinaryFreeze);Object.freeze(value);}return value;}
 function ordinaryTap(s,input){Model.step(s,DT,input);Model.step(s,DT,{});}
 function ordinaryArrangement(m){return clone({cells:m.cells,stones:m.stones,lines:m.lines,pillarIds:m.pillarIds,targetHoleIds:m.targetHoleIds,holeIds:m.holeIds,
  readCellIds:m.readCellIds,readStoneIds:m.readStoneIds,readValues:m.readValues,orderedPairs:m.orderedPairs,strictlyIncreasing:m.strictlyIncreasing,
  matchedHoleCount:m.matchedHoleCount,holesCorrect:m.holesCorrect,goalReady:m.goalReady,score:m.score});}
 for(let difficulty=0;difficulty<3;difficulty++){
  test(`public-planned multi-stone trial, exact no-refund undo and ordinary victory on puzzle ${difficulty+1}`,async()=>{
   const automation=await ordinaryModule,pilot=automation.createPilot(),s=Model.create(41,difficulty);
   const initial=ordinarySnapshot(s),trace=[{elapsed:0,state:initial}];let keys=[],lastA=false,lastB=false;
   // Defined runtime scenario: 60 Hz fixed ticks and one observation per five
   // ticks. It does not guarantee wins for arbitrary plans or input timing.
   for(let frame=0;frame<5401&&s.phase==='playing';frame++){
    if(frame%5===0){const observed=ordinarySnapshot(s);trace.push({elapsed:s.elapsed,state:observed});keys=pilot(ordinaryFreeze(observed),{mode:'record',elapsed:s.elapsed});}
    const a=keys.includes('Space'),b=keys.includes('b');
    Model.step(s,DT,{x:Number(keys.includes('ArrowRight'))-Number(keys.includes('ArrowLeft')),
     y:Number(keys.includes('ArrowDown'))-Number(keys.includes('ArrowUp')),a,b,aPressed:a&&!lastA,bPressed:b&&!lastB,cancelEpoch:0});
    lastA=a;lastB=b;
   }
   const after=ordinarySnapshot(s);trace.push({elapsed:s.elapsed,state:after});
   automation.assertProgress({before:initial,after,trace},assert);
   assert.equal(s.phase,'won');assert.ok(s.elapsed>=30&&s.elapsed<90);assert.equal(s.undos,1);assert.equal(s.movesRemaining,1);
   assert.equal(s.movesUsed,s.moveLimit-1);assert.equal(s.historyDepth,s.movesUsed-1);assert.equal(s.compactionAttempts,s.movesUsed);assert.equal(s.noOpAttempts,0);
   assert.equal(s.strictlyIncreasing,true);assert.equal(s.holesCorrect,true);assert.equal(s.goalReady,true);assert.equal(s.transition,null);
   const trial=trace.find(t=>t.state.model.movesUsed===1&&t.state.model.undos===0)?.state.model;
   const restored=trace.find(t=>t.state.model.movesUsed===1&&t.state.model.undos===1)?.state.model;
   assert.ok(trial&&restored);assert.ok(trial.lastCompaction.movedCount>=2);
   assert.equal(new Set(trial.lastCompaction.moves.map(m=>m.stoneId)).size,trial.lastCompaction.movedCount);
   assert.ok(trial.lastCompaction.moves.every(m=>m.fromCellId!==m.toCellId));
   assert.notDeepEqual(ordinaryArrangement(trial),ordinaryArrangement(initial.model));
   assert.deepEqual(ordinaryArrangement(restored),ordinaryArrangement(initial.model),'B must restore exact stones, holes and snake reading');
   assert.deepEqual(restored.lastUndo.edit,trial.lastCompaction);assert.equal(restored.selectedId,trial.lastCompaction.actionId);
   assert.equal(restored.movesUsed,trial.movesUsed);assert.equal(restored.movesRemaining,trial.movesRemaining);assert.equal(restored.compactionAttempts,trial.compactionAttempts);
   assert.equal(restored.movesRemaining,restored.moveLimit-1);assert.equal(restored.historyDepth,0);assert.ok(restored.elapsed>trial.elapsed);
   const diagnostics=pilot.diagnostics(),undo=diagnostics.find(e=>e.type==='observed-undo');assert.ok(undo);
   assert.deepEqual(undo.assignments,automation.publicAssignments(initial.model));assert.equal(undo.movesUsed,1);assert.equal(undo.undos,1);
   assert.ok(diagnostics.some(e=>e.type==='planned-public-multi-stone-trial'));
   const frozen=clone(s);Model.step(s,.25,{a:true,b:true,x:1,cancelled:true});assert.deepEqual(s,frozen);
   automation.assertRetry({after:ordinarySnapshot(Model.create(41,difficulty)),initial},assert);
  });
  test(`publicly predicted successful moves genuinely exhaust the budget on puzzle ${difficulty+1}`,async()=>{
   const automation=await ordinaryModule,s=Model.create(41,difficulty),initial=ordinarySnapshot(s);
   const inputs={N:{y:-1},E:{x:1},S:{y:1},W:{x:-1}};
   // Select a changed, nonwinning public successor each time; no per-level
   // action route or fixture writes are used to manufacture the loss.
   for(let used=1;used<=s.moveLimit;used++){
    const observed=ordinaryFreeze(ordinarySnapshot(s).model);
    const chosen=observed.actions.map(a=>automation.predictCompaction(observed,a.id)).find(p=>p.changed&&!p.willWin);
    assert.ok(chosen,'A real changed nonwinning action remains available');
    assert.equal(chosen.willExhaustMoves,used===s.moveLimit);
    for(const dir of automation.focusPath(observed,chosen.actionId))ordinaryTap(s,inputs[dir]);
    assert.equal(s.selectedId,chosen.actionId);ordinaryTap(s,{a:true});
    assert.equal(s.movesUsed,used);assert.equal(s.movesRemaining,s.moveLimit-used);assert.equal(s.compactionAttempts,used);assert.equal(s.noOpAttempts,0);assert.equal(s.undos,0);
    const after=ordinarySnapshot(s).model;
    assert.deepEqual(automation.publicAssignments(after),chosen.afterAssignments);assert.deepEqual(s.lastCompaction.moves,chosen.moves);assert.equal(s.lastCompaction.id,used);
    assert.equal(s.phase,used===s.moveLimit?'lost':'playing');automation.assertPublicBoard(after,assert);
   }
   assert.equal(s.lostReason,'moves');assert.equal(s.goalReady,false);assert.equal(s.historyDepth,s.moveLimit);assert.equal(s.transition,null);
   assert.deepEqual(s.stones.map(p=>({id:p.id,value:p.value})),initial.model.stones.map(p=>({id:p.id,value:p.value})));
   const frozen=clone(s);Model.step(s,.25,{b:true});assert.deepEqual(s,frozen);
   automation.assertRetry({after:ordinarySnapshot(Model.create(41,difficulty)),initial},assert);
  });
 }
}
