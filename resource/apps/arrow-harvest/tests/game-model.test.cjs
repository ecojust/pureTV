'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Model=require('../src/main/assets/game-model.js'),DT=1/60,clone=v=>JSON.parse(JSON.stringify(v));
const tick=(s,input={})=>Model.step(s,DT,input);
function tap(s,input){tick(s,input);tick(s);}
function wait(s,n){for(let i=0;i<n;i++)tick(s);}
function focus(s,id){const target=s.cells.find(c=>c.id===id);assert.ok(target);while(s.cursor.col!==target.col)tap(s,{x:Math.sign(target.col-s.cursor.col)});while(s.cursor.row!==target.row)tap(s,{y:Math.sign(target.row-s.cursor.row)});assert.equal(s.selectedId,id);}
function turns(s,id,n){focus(s,id);for(let i=0;i<n;i++)tap(s,{a:true});}
function launch(s){tick(s,{b:true});assert.equal(s.mode,'propagating');assert.equal(s.waveIndex,0);}
function firstWave(s){const target=s.waveIndex+1;for(let i=0;i<30&&s.phase==='playing'&&s.waveIndex<target;i++)tick(s);assert.equal(s.waveIndex,target);}
function committed(s){return clone({seeds:s.seeds.slice().sort((a,b)=>a.id.localeCompare(b.id)),coverageCounts:s.coverageCounts,cells:s.cells.map(c=>({id:c.id,coverageCount:c.coverageCount,covered:c.covered,seedIds:c.seedIds})),acceptedWaves:s.acceptedWaves,score:s.score});}
function publicSnapshot(s){return clone(Object.fromEntries(Object.entries(s).filter(([k])=>!k.startsWith('_'))));}
function evidence(name,value){if(process.env.ARROW_HARVEST_EVIDENCE_DIR){fs.mkdirSync(process.env.ARROW_HARVEST_EVIDENCE_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.ARROW_HARVEST_EVIDENCE_DIR,name),JSON.stringify(value,null,2)+'\n');}}
function audit(s){
 const ordered=s.seeds.slice().sort((a,b)=>s.sourceIds.indexOf(a.sourceId)-s.sourceIds.indexOf(b.sourceId));
 assert.deepEqual(s.coveredTargetIds,s.targetIds.filter(id=>s.coverageCounts[Number(id.slice(1))-1]===1));assert.deepEqual(s.uncoveredTargetIds,s.targetIds.filter(id=>!s.coveredTargetIds.includes(id)));
 assert.equal(s.coveredCount,s.coveredTargetIds.length);assert.equal(s.remainingTargetCount,s.uncoveredTargetIds.length);assert.equal(s.allTargetsCovered,s.remainingTargetCount===0);
 assert.equal(s.activeSeedCount,s.seeds.filter(p=>p.status==='active').length);assert.equal(s.stoppedSeedCount,s.seeds.filter(p=>p.status==='stopped').length);assert.equal(s.allSeedsStopped,s.stoppedSeedCount===s.sourceCount);assert.equal(s.goalReady,s.allSeedsStopped&&s.allTargetsCovered);
 assert.equal(s.coveredCount,s.launchCount?s.sourceCount+s.seeds.reduce((n,p)=>n+p.steps,0):0);
 for(let i=0;i<s.cells.length;i++){const c=s.cells[i];assert.ok(s.coverageCounts[i]===0||s.coverageCounts[i]===1);assert.equal(c.coverageCount,s.coverageCounts[i]);assert.equal(c.covered,c.coverageCount===1);assert.deepEqual(c.seedIds,ordered.filter(p=>p.cellId===c.id).map(p=>p.id));if(c.role==='forbidden')assert.equal(c.coverageCount,0);}
 assert.equal(s.score,s.coveredCount*40+(s.phase==='won'?1000+Math.floor(s.remaining)*5:0));assert.equal(s.elapsed,s.tick/60);assert.equal(s.remaining,Math.max(0,90-s.elapsed));assert.ok(s.waveIndex<=s.targetCount-s.sourceCount+1);if(s.failure)assert.deepEqual(s.failure.missingTargetIds,s.uncoveredTargetIds);
}
function frozen(s){const before=clone(s);for(const dt of[0,DT,.25,100,NaN])Model.step(s,dt,{aPressed:true,bPressed:true,x:1,cancelEpoch:99,cancelled:true});assert.deepEqual(s,before);}

test('public UMD boards have exclusive roles, exact target sets, unique waiting seeds and no hidden solution API',()=>{
 assert.deepEqual(Object.keys(Model).sort(),['TICK_HZ','create','step']);assert.equal(Model.TICK_HZ,60);const browser={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/main/assets/game-model.js'),'utf8'),browser);assert.deepEqual(clone(browser.PureModel.create(17,1)),Model.create(17,1));
 for(let d=0;d<3;d++){const s=Model.create(17,d);assert.equal(s.cells.length,16);assert.equal(s.targetCount,[12,14,14][d]);assert.equal(s.sourceCount,[2,2,3][d]);assert.equal(s.stopCount,s.sourceCount);assert.equal(s.editableCount,[5,6,7][d]);assert.equal(s.selectedId,s.editableIds[0]);assert.equal(s.score,0);assert.equal(s.phase,'playing');assert.equal(s.mode,'editing');assert.equal(s.runArrows,null);assert.equal(s.lastWave,null);assert.equal(s.launchCount,0);
  for(let i=0;i<16;i++){const c=s.cells[i];assert.equal(c.id,'C'+(i+1));assert.equal(c.row,Math.floor(i/4));assert.equal(c.col,i%4);assert.equal(c.x,104+(c.col+.5)*84);assert.equal(c.y,108+(c.row+.5)*84);assert.equal(c.target,c.role!=='forbidden');assert.equal(c.arrow,c.initialArrow);if(c.role==='stop'||c.role==='forbidden'){assert.equal(c.arrow,null);assert.equal(c.editable,false);}else assert.ok(['N','E','S','W'].includes(c.arrow));}
  assert.equal(new Set(s.seeds.map(p=>p.id)).size,s.sourceCount);assert.ok(s.seeds.every(p=>p.cellId===p.sourceId&&p.status==='waiting'&&p.steps===0&&p.stopId===null));audit(s);
 }
});

test('ordinary navigation reaches all sixteen cells; fixed/stop/forbidden A is free and four editable turns preserve the original arrow',()=>{
 const s=Model.create(),initial=s.cells.map(c=>c.arrow);for(const c of s.cells){focus(s,c.id);assert.equal(s.cursor.role,c.role);assert.equal(s.cursor.editable,c.editable);if(!c.editable){tick(s,{a:true});assert.equal(s.lastAction.type,'locked');tick(s);}}
 assert.equal(s.editCount,0);assert.deepEqual(s.cells.map(c=>c.arrow),initial);focus(s,'C1');for(let i=0;i<4;i++)tap(s,{a:true});assert.equal(s.editCount,4);assert.deepEqual(s.cells.map(c=>c.arrow),initial);assert.deepEqual(s.lastEdit,{id:4,cellId:'C1',before:'N',after:'E',at:s.lastEdit.tick/60,tick:s.lastEdit.tick});
 tick(s,{x:-1});assert.equal(s.selectedId,'C1');assert.equal(s.lastAction.type,'select-blocked');assert.equal(s.editCount,4);audit(s);
});

test('B owns its fixed tick; A follows navigation, held buttons do not repeat, and direction repeat has the stated initial delay',()=>{
 const b=Model.create();tick(b,{a:true,b:true,x:1});assert.equal(b.selectedId,'C1');assert.equal(b.editCount,0);assert.equal(b.launchCount,1);assert.equal(b.runArrows[0],'E');
 const a=Model.create();tick(a,{a:true,y:1});assert.equal(a.selectedId,'C5');assert.equal(a.lastEdit.cellId,'C5');assert.equal(a.lastEdit.after,'E');for(let i=0;i<40;i++)tick(a,{a:true});assert.equal(a.editCount,1);
 const nav=Model.create();tick(nav,{x:1});assert.equal(nav.selectedId,'C2');for(let i=0;i<19;i++)tick(nav,{x:1});assert.equal(nav.selectedId,'C2');tick(nav,{x:1});assert.equal(nav.selectedId,'C3');for(let i=0;i<9;i++)tick(nav,{x:1});assert.equal(nav.selectedId,'C3');tick(nav,{x:1});assert.equal(nav.selectedId,'C4');tick(nav,{y:1});assert.equal(nav.selectedId,'C8');assert.equal(nav.editCount,0);
});

test('zero/subtick edges wait for a fixed tick and cancelled samples discard pending actions without inventing a new held edge',()=>{
 const s=Model.create();Model.step(s,0,{aPressed:true});assert.equal(s.editCount,0);Model.step(s,DT/2,{});assert.equal(s.editCount,0);Model.step(s,DT/2,{});assert.equal(s.editCount,1);
 tick(s,{cancelEpoch:4});const before=s.cells.map(c=>c.arrow);Model.step(s,DT/2,{aPressed:true,bPressed:true});Model.step(s,DT/2,{cancelEpoch:5,cancelled:true,x:1});assert.equal(s.editCount,1);assert.equal(s.launchCount,0);assert.equal(s.selectedId,'C1');
 for(let i=0;i<3;i++)tick(s,{a:true,b:true,aPressed:true,bPressed:true,cancelled:true});tick(s,{a:true,b:true});assert.equal(s.launchCount,0);assert.deepEqual(s.cells.map(c=>c.arrow),before);tick(s);tick(s,{b:true});assert.equal(s.launchCount,1);assert.equal(s.editCount,1);
});

test('sowing covers sources once, freezes arrows, and thirty ticks separate actual committed seed positions',()=>{
 const s=Model.create();turns(s,'C1',1);const arrows=s.cells.map(c=>c.arrow),selected=s.selectedId;launch(s);const sourcePositions=committed(s),started=s.tick;assert.deepEqual(s.runArrows,arrows);assert.deepEqual(s.coveredTargetIds,s.sourceIds);assert.equal(s.score,80);assert.equal(s.nextWaveTick,started+30);assert.equal(s.waveProgress,0);
 const frozenArrows=s.runArrows;for(let i=0;i<29;i++)tick(s,{a:true,b:true,x:1,y:1,aPressed:true,bPressed:true});assert.equal(s.tick,started+29);assert.equal(s.waveIndex,0);assert.equal(s.waveProgress,29/30);assert.deepEqual(committed(s),sourcePositions);assert.equal(s.selectedId,selected);assert.equal(s.editCount,1);assert.equal(s.launchCount,1);assert.strictEqual(s.runArrows,frozenArrows);assert.deepEqual(s.cells.map(c=>c.arrow),arrows);
 tick(s,{a:true,b:true});assert.equal(s.waveIndex,1);assert.equal(s.acceptedWaves,1);assert.equal(s.lastWave.tick,started+30);assert.equal(s.waveProgress,0);assert.equal(s.coveredCount,4);assert.equal(s.seeds[1].status,'stopped');assert.equal(s.seeds[1].stopId,'C15');audit(s);
});

test('two simultaneous arrivals at a previously empty cell reject the entire batch without awarding coverage',()=>{
 const s=Model.create(1,1);launch(s);const before=committed(s);firstWave(s);assert.equal(s.lostReason,'overlap');assert.deepEqual(committed(s),before);assert.equal(s.waveIndex,1);assert.equal(s.acceptedWaves,0);assert.deepEqual(s.lastWave.arrivals,[{cellId:'C9',seedIds:['S1','S2'],count:2,previousCoverage:0}]);assert.deepEqual(s.lastWave.issues,{outsideSeedIds:[],forbiddenCellIds:[],revisitedCellIds:[],simultaneousCellIds:['C9']});assert.equal(s.lastWave.intents.length,2);assert.equal(s.lastWave.accepted,false);assert.deepEqual(s.lastWave.newlyCoveredIds,[]);assert.deepEqual(s.lastWave.stoppedSeedIds,[]);assert.deepEqual(s.failure.cellIds,['C9']);assert.deepEqual(s.failure.seedIds,['S1','S2']);audit(s);
});

test('old-source visits and swaps cannot partially commit another seed reaching a stop or an unvisited field',()=>{
 const s=Model.create(1,2),beforeSow=publicSnapshot(s);launch(s);const before=committed(s);firstWave(s);assert.equal(s.lostReason,'overlap');assert.deepEqual(committed(s),before);assert.deepEqual(s.lastWave.intents.map(i=>[i.seedId,i.fromId,i.toId]),[['S1','C1','C5'],['S2','C5','C6'],['S3','C11','C7']]);assert.deepEqual(s.lastWave.issues.revisitedCellIds,['C5']);assert.equal(s.stoppedSeedCount,0);assert.equal(s.cells[5].coverageCount,0);assert.equal(s.cells[6].coverageCount,0);audit(s);
 evidence('source-revisit-atomic.json',{scope:'Ordinary initial-board B followed by one synchronous batch; no state fixture or solution route',beforeSow,afterFailedWave:publicSnapshot(s)});
 const swap=Model.create(1,2);turns(swap,'C5',3);launch(swap);const old=committed(swap);firstWave(swap);assert.deepEqual(swap.lastWave.issues.revisitedCellIds,['C1','C5']);assert.deepEqual(swap.lastWave.issues.simultaneousCellIds,[]);assert.deepEqual(committed(swap),old);assert.equal(swap.lastWave.intents[2].toId,'C7');assert.equal(swap.cells[6].coverageCount,0);audit(swap);
});

test('forbidden has reason priority but the complete batch retains outside, revisit and otherwise-valid intentions',()=>{
 const s=Model.create(1,2);turns(s,'C1',1);turns(s,'C5',3);launch(s);const before=committed(s);firstWave(s);assert.equal(s.lostReason,'forbidden');assert.deepEqual(committed(s),before);assert.deepEqual(s.lastWave.issues,{outsideSeedIds:['S1'],forbiddenCellIds:[],revisitedCellIds:['C1'],simultaneousCellIds:[]});assert.equal(s.lastWave.intents.length,3);assert.equal(s.lastWave.intents[0].toId,null);assert.equal(s.lastWave.intents[0].toCol,-1);assert.equal(s.lastWave.intents[2].toId,'C7');assert.deepEqual(s.failure.cellIds,['C1']);assert.deepEqual(s.failure.seedIds,['S1','S2']);assert.equal(s.lastWave.arrivals.length,2);audit(s);
});

test('in-bounds forbidden cells and right-border exits never wrap or partially retire another seed',()=>{
 const forbidden=Model.create(1,1);turns(forbidden,'C5',3);launch(forbidden);const before=committed(forbidden);firstWave(forbidden);assert.equal(forbidden.lostReason,'forbidden');assert.deepEqual(forbidden.lastWave.issues.forbiddenCellIds,['C6']);assert.deepEqual(forbidden.lastWave.arrivals.map(a=>a.cellId),['C6','C9']);assert.deepEqual(committed(forbidden),before);audit(forbidden);
 const border=Model.create();turns(border,'C16',2);launch(border);const original=committed(border);firstWave(border);assert.equal(border.lostReason,'forbidden');assert.deepEqual(border.lastWave.issues.outsideSeedIds,['S2']);assert.deepEqual(border.lastWave.intents[1],{seedId:'S2',fromId:'C16',direction:'E',toId:null,toRow:3,toCol:4,outside:true});assert.deepEqual(committed(border),original);assert.equal(border.stoppedSeedCount,0);assert.equal(border.lastWave.intents[0].toId,'C2');audit(border);
});

test('stops absorb seeds permanently and a returning loop ends on its first revisited cell',()=>{
 const s=Model.create();turns(s,'C1',1);launch(s);firstWave(s);assert.equal(s.phase,'playing');assert.equal(s.acceptedWaves,1);assert.equal(s.stoppedSeedCount,1);assert.equal(s.coveredCount,4);assert.deepEqual(s.lastWave.newlyCoveredIds,['C5','C15']);assert.deepEqual(s.lastWave.stoppedSeedIds,['S2']);const before=committed(s);firstWave(s);
 assert.equal(s.phase,'lost');assert.equal(s.lostReason,'overlap');assert.equal(s.waveIndex,2);assert.equal(s.lastWave.intents.length,1);assert.equal(s.lastWave.intents[0].seedId,'S1');assert.equal(s.lastWave.intents[0].toId,'C1');assert.deepEqual(committed(s),before);assert.equal(s.seeds[1].stoppedAtWave,1);assert.equal(s.seeds[1].steps,1);audit(s);
});

test('all six explicit seed-array permutations produce identical accepted and rejected batch facts',()=>{
 // Only incidental array order is changed; geometry, arrows, coverage and IDs
 // remain the same. This is an order-invariance fixture, not gameplay evidence.
 const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 for(const valid of[false,true]){let expected;for(const order of orders){const s=Model.create(1,2);if(valid){turns(s,'C1',3);turns(s,'C5',1);turns(s,'C11',1);}s.seeds=order.map(i=>s.seeds[i]);launch(s);firstWave(s);const actual={committed:committed(s),wave:clone(s.lastWave),failure:clone(s.failure),phase:s.phase};if(!expected)expected=actual;else assert.deepEqual(actual,expected);assert.equal(s.acceptedWaves,valid?1:0);assert.equal(s.lastWave.intents.map(i=>i.seedId).join(','),'S1,S2,S3');audit(s);}}
});

test('all-retired incomplete is an accepted batch, distinct from a rejected movement batch',()=>{
 const s=Model.create();launch(s);firstWave(s);assert.equal(s.phase,'lost');assert.equal(s.lostReason,'incomplete');assert.equal(s.allSeedsStopped,true);assert.equal(s.allTargetsCovered,false);assert.equal(s.goalReady,false);assert.equal(s.acceptedWaves,1);assert.equal(s.lastWave.accepted,true);assert.equal(s.lastWave.failureReason,null);assert.deepEqual(s.lastWave.newlyCoveredIds,['C2','C15']);assert.deepEqual(s.lastWave.stoppedSeedIds,['S1','S2']);assert.equal(s.coveredCount,4);assert.equal(s.score,160);assert.deepEqual(s.failure.cellIds,[]);assert.deepEqual(s.failure.seedIds,[]);audit(s);
});

test('cancellation preserves the launched run and active clock; deadline precedes sowing and a due batch',()=>{
 const s=Model.create();turns(s,'C1',1);launch(s);const arrows=s.runArrows,positions=committed(s);tick(s,{cancelEpoch:1});for(let i=0;i<28;i++)tick(s,{cancelEpoch:2,cancelled:true,bPressed:true});assert.equal(s.waveProgress,29/30);assert.deepEqual(committed(s),positions);tick(s,{cancelled:true});assert.equal(s.acceptedWaves,1);assert.equal(s.waveIndex,1);assert.strictEqual(s.runArrows,arrows);assert.equal(s.launchCount,1);audit(s);
 // Explicit clock-only fixtures: no arrows, coverage, goal or seed positions
 // are injected. One case would launch; the other has an actual pending batch.
 for(const propagating of[false,true]){const atDeadline=Model.create();if(propagating)launch(atDeadline);const before=committed(atDeadline);atDeadline.tick=5399;atDeadline.elapsed=5399/60;atDeadline.remaining=1/60;if(propagating)atDeadline.nextWaveTick=5400;tick(atDeadline,{a:true,b:true});assert.equal(atDeadline.lostReason,'timeout');assert.equal(atDeadline.tick,5400);assert.equal(atDeadline.waveIndex,0);assert.equal(atDeadline.lastWave,null);assert.equal(atDeadline.launchCount,propagating?1:0);assert.deepEqual(committed(atDeadline),before);assert.equal(atDeadline.failure.waveIndex,null);audit(atDeadline);frozen(atDeadline);}
});

test('detached receipts, terminal freeze, fresh retries and JSON continuation preserve actual state and bounded finite inputs',()=>{
 const s=Model.create();turns(s,'C1',1);launch(s);firstWave(s);const wave=clone(s.lastWave),event=s.events.find(e=>e.type==='wave');assert.notStrictEqual(event.intents,s.lastWave.intents);assert.notStrictEqual(event.issues,s.lastWave.issues);assert.notStrictEqual(s.lastAction,s.lastWave);const checkpoint=clone(s);tick(s);tick(checkpoint);assert.deepEqual(s,checkpoint);assert.deepEqual(s.lastWave,wave);firstWave(s);assert.equal(s.phase,'lost');frozen(s);
 for(let d=0;d<3;d++){const original=Model.create(9,d),initial=clone(original);tap(original,{a:true});const retry=Model.create(9,d);assert.deepEqual(retry,initial);for(const k of['cells','seeds','coverageCounts','sourceIds','events'])assert.notStrictEqual(retry[k],original[k]);assert.ok(retry.seeds.every(p=>p.status==='waiting'));}
 const idle=Model.create(),cells=idle.cells,covered=idle.coveredTargetIds;wait(idle,60);assert.equal(idle.elapsed,1);assert.strictEqual(idle.cells,cells);assert.strictEqual(idle.coveredTargetIds,covered);assert.equal(idle.lastAction,null);for(const dt of[NaN,Infinity,-1])Model.step(idle,dt,{});assert.equal(idle.tick,60);Model.step(idle,100,{aPressed:true});assert.equal(idle.tick,75);assert.equal(idle.editCount,1);assert.ok(idle.events.length<=32);assert.equal(Model.create(NaN,99).level,3);
 function finite(v){if(typeof v==='number')assert.ok(Number.isFinite(v));else if(v&&typeof v==='object')Object.values(v).forEach(finite);}finite(idle);audit(idle);
});
