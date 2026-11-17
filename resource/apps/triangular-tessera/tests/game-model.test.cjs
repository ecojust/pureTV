'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const Model=require('../src/main/assets/game-model.js'),DT=1/60,clone=x=>JSON.parse(JSON.stringify(x));
const tick=(s,input={})=>Model.step(s,DT,input);
function tap(s,input){tick(s,input);tick(s);}
const DIRS=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
function next(items,id,d){const from=items.find(f=>f.id===id);return items.map((f,i)=>{const x=f.x-from.x,y=f.y-from.y,p=Math.abs(d.x?y:x),distance=x*x+y*y;return{f,i,forward:x*d.x+y*d.y,cost:distance+2*p*p,distance,p};}).filter(a=>a.forward>0).sort((a,b)=>a.cost-b.cost||a.distance-b.distance||a.p-b.p||a.i-b.i)[0]?.f.id||id;}
function focus(s,id){const queue=[[s.selectedId,[]]],seen=new Set([s.selectedId]);let keys;for(const [at,prefix]of queue){if(at===id){keys=prefix;break;}for(const d of DIRS){const n=next(s.focusItems,at,d);if(!seen.has(n)){seen.add(n);queue.push([n,[...prefix,d]]);}}}assert.ok(keys);for(const d of keys)tap(s,d);assert.equal(s.selectedId,id);}
function op(s,id,kind){assert.equal(s.phase,'playing');focus(s,id);tap(s,kind==='A'?{a:true}:{b:true});}
function positions(s){return s.tiles.map(t=>({id:t.id,slotSectorIds:t.slotSectorIds.slice()}));}
function colorState(s){return clone({slots:s.tiles.map(t=>t.slotColors),edges:s.edges.map(e=>({id:e.id,colorIds:e.colorIds,matched:e.matched})),regions:s.regions,counts:s.regionCounts,score:s.score});}
function audit(s){
 const bySector=new Map(s.sectors.map(p=>[p.id,p])),all=s.tiles.flatMap(t=>t.slotSectorIds);assert.equal(all.length,18);assert.equal(new Set(all).size,18);
 for(const t of s.tiles){assert.equal(t.slotSectorIds.length,3);for(let i=0;i<3;i++){const id=t.slotSectorIds[i],p=bySector.get(id),slot=t.slots[i];assert.equal(p.tileId,t.id);assert.equal(p.slotIndex,i);assert.equal(slot.sectorId,id);assert.equal(slot.mark,p.mark);assert.equal(slot.colorId,p.colorId);assert.equal(t.slotColors[i],p.colorId);assert.ok(s.regions.find(r=>r.id===slot.regionId).sectorIds.includes(id));}}
 assert.deepEqual(s.matchingEdgeIds,s.edges.filter(e=>e.shared&&e.matched).map(e=>e.id));assert.deepEqual(s.conflictEdgeIds,s.edges.filter(e=>e.shared&&!e.matched).map(e=>e.id));
 for(const e of s.edges){const colors=e.incidences.map(i=>s.tiles.find(t=>t.id===i.tileId).slotColors[i.slotIndex]);assert.deepEqual(e.colorIds,colors);assert.equal(e.matched,e.shared?colors[0]===colors[1]:null);}
 assert.equal(s.regions.flatMap(r=>r.sectorIds).length,18);assert.equal(new Set(s.regions.flatMap(r=>r.sectorIds)).size,18);
 for(const r of s.regions){assert.equal(r.id,'region-'+r.sectorIds[0]);assert.deepEqual(r.sectorIds,s.sectors.filter(p=>r.sectorIds.includes(p.id)).map(p=>p.id));assert.ok(r.sectorIds.every(id=>bySector.get(id).colorId===r.colorId));assert.deepEqual(r.tileIds,s.tiles.filter(t=>r.sectorIds.some(id=>bySector.get(id).tileId===t.id)).map(t=>t.id));}
 for(const c of s.colors)assert.equal(s.regionCounts[c.id],s.regions.filter(r=>r.colorId===c.id).length);
 assert.equal(s.movesUsed,s.rotationCount+s.mirrorCount);assert.equal(s.historyDepth,s.history.length);assert.equal(s.historyDepth,s.movesUsed);assert.equal(s.movesRemaining,Math.max(0,s.moveLimit-s.movesUsed));
 assert.equal(s.goalReady,s.allEdgesMatched&&s.allRegionsMatched);assert.equal(s.score,s.matchedEdgeCount*40+s.matchedRegionColorCount*100+(s.phase==='won'?1000+Math.floor(s.remaining)*5+s.movesRemaining*40:0));
}
function assertFrozen(s){const before=clone(s);for(const dt of[0,DT,.25,100,NaN])Model.step(s,dt,{aPressed:true,bPressed:true,x:1,cancelled:true,cancelEpoch:100});assert.deepEqual(s,before);}
// Author-derived, explicitly rule-level negative witnesses. These are not
// supplied to the independent public planner or used as its normal-play proof.
const WRONG_REGIONS=[
 [['T1','A'],['T1','A'],['T2','B'],['T4','B']],
 [['T1','B'],['T2','A'],['T2','B'],['T5','A']],
 [['T1','A'],['T1','B'],['T4','B'],['T5','A'],['T5','A']]
];
function nearFirstGoal(){const s=Model.create();op(s,'T1','B');op(s,'T1','A');op(s,'T2','A');focus(s,'T4');return s;}

test('public UMD geometry has exactly six shared full edges, nine corner-only tile pairs and eighteen physical sectors',()=>{
 assert.deepEqual(Object.keys(Model).sort(),['TICK_HZ','create','step']);const sandbox={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/main/assets/game-model.js'),'utf8'),sandbox);assert.deepEqual(clone(sandbox.PureModel.create(7,1)),Model.create(7,1));
 for(let d=0;d<3;d++){const s=Model.create(7,d);assert.equal(s.vertices.length,7);assert.equal(s.tiles.length,6);assert.equal(s.sectors.length,18);assert.equal(s.edges.length,12);assert.equal(s.sharedEdgeCount,6);assert.equal(s.score,[80,220,220][d]);assert.equal(s.goalReady,false);let corners=0;
  for(const t of s.tiles){const [a,b,c]=t.vertices;assert.ok((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0);for(let i=0;i<3;i++){const v=t.vertices[i],w=t.vertices[(i+1)%3];assert.ok(Math.abs((v.x-w.x)**2+(v.y-w.y)**2-190**2)<1e-7);assert.deepEqual(t.slots[i].polygon,[{x:t.x,y:t.y},{x:v.x,y:v.y},{x:w.x,y:w.y}]);}assert.deepEqual(t.mirrorAxis.a,{x:c.x,y:c.y});assert.deepEqual(t.mirrorAxis.b,{x:(a.x+b.x)/2,y:(a.y+b.y)/2});}
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const common=s.tiles[i].vertexIds.filter(id=>s.tiles[j].vertexIds.includes(id));const shared=s.edges.filter(e=>e.incidences.some(p=>p.tileId===s.tiles[i].id)&&e.incidences.some(p=>p.tileId===s.tiles[j].id));assert.equal(shared.length,common.length===2?1:0);corners+=Number(common.length===1);}assert.equal(corners,9);audit(s);
 }
});

test('real A/B inputs implement D3 on stable physical IDs with no refunds or hidden color changes',()=>{
 const a=Model.create(),initial=positions(a),identity=clone(a.sectors.map(({id,tileId,mark,colorId})=>({id,tileId,mark,colorId})));
 tap(a,{a:true});assert.deepEqual(a.tiles[0].slotSectorIds,['T1S3','T1S1','T1S2']);tap(a,{a:true});tap(a,{a:true});assert.deepEqual(positions(a),initial);assert.equal(a.movesUsed,3);assert.equal(a.rotationCount,3);
 const b=Model.create();tap(b,{b:true});assert.deepEqual(b.tiles[0].slotSectorIds,['T1S1','T1S3','T1S2']);tap(b,{b:true});assert.deepEqual(positions(b),initial);assert.equal(b.movesUsed,2);assert.equal(b.movesRemaining,4);assert.equal(b.mirrorCount,2);
 const ab=Model.create(),ba=Model.create();tap(ab,{a:true});tap(ab,{b:true});tap(ba,{b:true});tap(ba,{a:true});assert.notDeepEqual(positions(ab),positions(ba));
 for(const s of[a,b,ab,ba]){assert.deepEqual(s.sectors.map(({id,tileId,mark,colorId})=>({id,tileId,mark,colorId})),identity);audit(s);}
});

test('equal-colored sectors still visibly exchange physical marks and consume one operation',()=>{
 const s=Model.create(),t=s.tiles.find(t=>t.slotColors[1]===t.slotColors[2]);focus(s,t.id);const before=colorState(s),ids=t.slotSectorIds.slice();assert.equal(s.previewMirror.colorChanged,false);assert.equal(s.previewMirror.cost,1);
 tap(s,{b:true});assert.deepEqual(t.slotSectorIds,[ids[0],ids[2],ids[1]]);assert.notDeepEqual(t.slotSectorIds,ids);assert.deepEqual(colorState(s),before);assert.equal(s.movesUsed,1);assert.equal(s.lastOperation.colorChanged,false);assert.match(s.message,/消耗/);assert.equal(t.slots[1].mark,3);assert.equal(t.slots[2].mark,2);audit(s);
});

test('labeled color fixtures distinguish radial/full-edge connections from vertex contact and retain actual cycles',()=>{
 function fixture(redIds){const s=Model.create();s.sectors.forEach(p=>p.colorId=redIds===null?'R':redIds.includes(p.id)?'R':'G');focus(s,'T4');tap(s,{b:true});return s;}
 // These synthetic pigment fixtures are not authored-gameplay demonstrations.
 // A real mirror refreshes the fixture; idle ticks never recompute forced edits.
 const corner=fixture(['T1S3','T3S1']);assert.equal(corner.regionCounts.R,2);assert.ok(corner.regions.filter(r=>r.colorId==='R').every(r=>r.sectorIds.length===1));
 const fullEdge=fixture(['T1S1','T6S3']);assert.equal(fullEdge.regionCounts.R,1);assert.deepEqual(fullEdge.regions.find(r=>r.colorId==='R').tileIds,['T1','T6']);
 const radial=fixture(['T1S1','T1S3']);assert.equal(radial.regionCounts.R,1);assert.equal(radial.regions.find(r=>r.colorId==='R').sectorIds.length,2);
 const cycle=fixture(null);assert.deepEqual(cycle.regionCounts,{R:1,G:0,B:0});assert.equal(cycle.regions[0].sectorIds.length,18);assert.equal(cycle.regions[0].tileIds.length,6);assert.equal(cycle.matchedEdgeCount,6);assert.notEqual(cycle.regions.length,14-cycle.matchedEdgeCount,'general graph evaluation must not fake the authored forest identity');
 for(const s of[corner,fullEdge,radial,cycle])audit(s);
});

test('each authored all-edge-matched counterexample stays playable but fails exact per-color region targets',()=>{
 for(let d=0;d<3;d++){const s=Model.create(1,d);for(const[id,kind]of WRONG_REGIONS[d]){op(s,id,kind);assert.equal(s.phase,'playing');}
  assert.equal(s.allEdgesMatched,true);assert.equal(s.matchedEdgeCount,6);assert.equal(s.allRegionsMatched,false);assert.equal(s.goalReady,false);assert.ok(s.movesUsed<s.moveLimit);assert.equal(s.movesUsed,[4,4,5][d]);
  assert.equal(Object.values(s.regionCounts).reduce((a,b)=>a+b,0),8);assert.notDeepEqual(s.regionCounts,s.targetRegions);audit(s);
 }
});

test('a targeted final-budget operation wins and a resulting real color component spans at least three tiles',()=>{
 // One author-derived positive boundary trace; the separate public planner
 // owns the three full ordinary win/loss integrations and is not imported here.
 const s=Model.create();tap(s,{b:true});tap(s,{b:true});op(s,'T1','B');op(s,'T1','A');op(s,'T2','A');focus(s,'T4');
 assert.equal(s.movesRemaining,1);assert.equal(s.previewMirror.willWin,true);assert.equal(s.previewMirror.willExhaustMoves,false);tap(s,{b:true});
 assert.equal(s.phase,'won');assert.equal(s.movesUsed,s.moveLimit);assert.equal(s.movesRemaining,0);assert.equal(s.allEdgesMatched,true);assert.equal(s.allRegionsMatched,true);assert.ok(s.regions.some(r=>r.tileIds.length>=3));audit(s);assertFrozen(s);
});

test('selection recomputes previews without editing the board and permanent receipts preserve physical before/after IDs',()=>{
 const s=Model.create(),before=positions(s),regions=clone(s.regionCounts);focus(s,'T2');focus(s,'T1');assert.deepEqual(positions(s),before);assert.deepEqual(s.regionCounts,regions);assert.equal(s.movesUsed,0);assert.equal(s.historyDepth,0);const p=clone(s.previewMirror);tap(s,{b:true});
 assert.deepEqual(s.tiles[0].slotSectorIds,p.afterSectorIds);assert.deepEqual(s.regionCounts,p.regionCounts);assert.equal(s.matchedEdgeCount,p.matchedEdgeCount);assert.equal(s.movesUsed,1);
 const receipt=clone(s.lastOperation);assert.deepEqual(receipt.beforeSectorIds,p.beforeSectorIds);assert.deepEqual(receipt.afterSectorIds,p.afterSectorIds);assert.equal(receipt.id,1);assert.notStrictEqual(s.lastOperation,s.history[0]);assert.notStrictEqual(s.lastOperation.afterSectorIds,s.history[0].afterSectorIds);
 tap(s,{b:true});assert.deepEqual(s.history[0],receipt);assert.equal(s.historyDepth,2);assert.equal(s.lastOperation.id,2);assert.equal(s.movesRemaining,4);audit(s);
});

test('six physical tile centers are reachable by ordinary navigation without charging or changing sectors',()=>{
 const s=Model.create(),before=positions(s);for(const tile of s.tiles){focus(s,tile.id);assert.deepEqual(s.cursor,s.focusItems.find(f=>f.id===tile.id));}focus(s,'T1');assert.deepEqual(positions(s),before);assert.equal(s.movesUsed,0);
 for(const start of s.focusItems){const seen=new Set([start.id]),q=[start.id];for(const id of q)for(const d of DIRS){const n=next(s.focusItems,id,d);if(!seen.has(n)){seen.add(n);q.push(n);}}assert.equal(seen.size,6);}
});

test('B owns its fixed tick before A/navigation while later held direction ticks and A navigation remain normal',()=>{
 const s=Model.create();tick(s,{a:true,b:true,x:0,y:-1});assert.equal(s.selectedId,'T1');assert.equal(s.movesUsed,1);assert.equal(s.mirrorCount,1);assert.equal(s.rotationCount,0);
 tick(s,{a:true,b:true,x:0,y:-1});assert.equal(s.selectedId,next(s.focusItems,'T1',{x:0,y:-1}));assert.equal(s.movesUsed,1);for(let i=0;i<40;i++)tick(s,{a:true,b:true});assert.equal(s.movesUsed,1);
 const a=Model.create(),target=next(a.focusItems,'T1',{x:0,y:-1});tick(a,{a:true,x:0,y:-1});assert.equal(a.lastOperation.tileId,target);assert.equal(a.rotationCount,1);audit(s);audit(a);
});

test('cancellation drops coalesced A/B edges and zero/subtick samples never spend an operation early',()=>{
 const s=Model.create();Model.step(s,0,{aPressed:true});assert.equal(s.movesUsed,0);Model.step(s,DT/2,{});assert.equal(s.movesUsed,0);Model.step(s,DT/2,{});assert.equal(s.movesUsed,1);
 tick(s,{cancelEpoch:1});const before=positions(s),history=clone(s.history);Model.step(s,DT/2,{aPressed:true,bPressed:true});Model.step(s,DT/2,{cancelEpoch:2,cancelled:true,x:1});
 for(let i=0;i<4;i++)tick(s,{cancelled:true,a:true,b:true,aPressed:true,bPressed:true});assert.deepEqual(positions(s),before);assert.deepEqual(s.history,history);assert.equal(s.movesUsed,1);tick(s,{a:true,b:true});assert.equal(s.movesUsed,1);tick(s);tap(s,{b:true});assert.equal(s.movesUsed,2);audit(s);
});

test('deadline precedes a previewed win, idle geometry is cached, and terminal loss freezes every field',()=>{
 const s=nearFirstGoal();assert.equal(s.previewMirror.willWin,true);const before=positions(s),moves=s.movesUsed;
 // Explicit last-tick clock fixture; no placement or outcome is forced.
 s.tick=5399;s.elapsed=5399/60;s.remaining=1/60;tick(s,{b:true});assert.equal(s.phase,'lost');assert.equal(s.lostReason,'timeout');assert.equal(s.movesUsed,moves);assert.deepEqual(positions(s),before);assertFrozen(s);
 const idle=Model.create(),regions=idle.regions,preview=idle.previewRotate;for(let i=0;i<120;i++)tick(idle);assert.strictEqual(idle.regions,regions);assert.strictEqual(idle.previewRotate,preview);assert.equal(idle.elapsed,2);assert.equal(idle.movesUsed,0);
});

test('retry restores independent fixed boards and JSON continuation plus bounded finite input remain valid',()=>{
 for(let d=0;d<3;d++){const s=Model.create(8,d),initial=clone(s);tap(s,{b:true});const retry=Model.create(8,d);assert.deepEqual(retry,initial);for(const k of['tiles','sectors','edges','regions','history'])assert.notStrictEqual(s[k],retry[k]);const copied=clone(s);tick(s);tick(copied);assert.deepEqual(s,copied);audit(s);}
 const s=Model.create();for(const dt of[NaN,Infinity,-1])Model.step(s,dt,{});assert.equal(s.tick,0);Model.step(s,100,{aPressed:true});assert.equal(s.tick,15);assert.equal(s.movesUsed,1);assert.ok(s.events.length<=32);assert.equal(Model.create(NaN,99).level,3);
 function finite(v){if(typeof v==='number')assert.ok(Number.isFinite(v));else if(v&&typeof v==='object')Object.values(v).forEach(finite);}finite(s);audit(s);
});
