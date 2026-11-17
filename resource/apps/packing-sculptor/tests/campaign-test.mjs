// All six tasks are played through the public step API. The pilot only reads
// the visible current packing; no winning placements are written into state.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {makePilot} from './automation.mjs';
const Model=createRequire(import.meta.url)('../src/main/assets/game-model.js');
const cfg=Model.config;
function drive(state,pilot,stop=()=>state.phase!=='playing'){
 for(let i=0;i<2000&&!stop();i++){const decision=pilot.next(structuredClone(state));assert.ok(decision);Model.step(state,1/60,decision.input);}
 assert.ok(stop(),'bounded normal-input play reaches expected state');
}
function independentlyClear(state){
 const t=state.container,parts=state.geometry.pieces,occupied=new Set();
 for(const p of parts){assert.ok(p.pose);for(const [x,y] of p.cells){assert.equal(t.rows[y]?.[x],'1');assert.ok(!occupied.has(`${x},${y}`));occupied.add(`${x},${y}`);}}
 for(const rule of t.requirements){
  const p=parts.find(p=>p.id===rule.pieceId),others=new Set(parts.filter(q=>q!==p).flatMap(q=>q.cells.map(String)));
  assert.ok(rule.doorIds.some(id=>{
   const d=t.doors.find(d=>d.id===id),horizontal=['left','right'].includes(d.direction),step=d.direction==='left'?[-1,0]:d.direction==='right'?[1,0]:d.direction==='up'?[0,-1]:[0,1];
   const cross=p.cells.map(c=>c[horizontal?1:0]);
   if(Math.min(...cross)<d.start||Math.max(...cross)+1>d.end)return false;
   // Integer cell polygons translated along an axis can only collide over a
   // crossed unit cell. Check each intermediate crossing, including the mouth.
   for(let n=1;n<=Math.max(t.width,t.height)+3;n++)for(const [x,y] of p.cells){
    const nx=x+step[0]*n,ny=y+step[1]*n;
    if(nx>=0&&ny>=0&&nx<t.width&&ny<t.height&&(t.rows[ny][nx]!=='1'||others.has(`${nx},${ny}`)))return false;
   }
   return true;
  }),`${rule.pieceId} has an independently clear full exit`);
 }
}
test('six distinct tasks introduce pillars, three simultaneous gates and alternate routes',()=>{
 assert.equal(cfg.tasks.length,6);
 assert.equal(new Set(cfg.tasks.map(t=>JSON.stringify([t.rows,t.doors,t.requirements]))).size,6);
 assert.equal(cfg.tasks[3].rows[2].slice(2,4),'00');
 assert.equal(cfg.tasks[4].requirements.length,3);
 assert.ok(cfg.tasks[5].requirements.some(r=>r.doorIds.length===2));
});
for(let level=0;level<cfg.tasks.length;level++)test(`campaign ${level+1}: all pieces and every required exit pass through normal controls`,()=>{
 for(const failures of [0,3]){
  const s=Model.create(746,level);
  if(failures)drive(s,makePilot('loss'),()=>s.failures===3);
  drive(s,makePilot());
  assert.equal(s.phase,'won');assert.equal(s.failures,failures);assert.equal(s.geometry.placedCount,s.pieceIds.length);independentlyClear(s);
  assert.equal(s.submissions.at(-1).matched,true);assert.equal(s.terminalReceipt.remaining,4-failures);
  const final=structuredClone(s);Model.step(s,.1,{a:true,b:true,x:1});assert.deepEqual(s,final);
 }
});
