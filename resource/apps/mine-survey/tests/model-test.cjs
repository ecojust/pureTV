'use strict';
const assert=require('node:assert/strict'),m=require('../src/main/assets/game-model.js'),{adjacent,deduce}=require('./visible-logic.cjs');
const tick=(s,i={})=>m.step(s,1/60,i),tap=(s,i)=>{tick(s,{});tick(s,i);tick(s,{});};
function aim(s,c){while(s.cursor%6<c%6)tap(s,{x:1});while(s.cursor%6>c%6)tap(s,{x:-1});while(Math.floor(s.cursor/6)<Math.floor(c/6))tap(s,{y:1});while(Math.floor(s.cursor/6)>Math.floor(c/6))tap(s,{y:-1});}
function reveal(s,c){aim(s,c);tap(s,{a:true});}
function solve(s,{useFlags=false,stopAtMine=false}={}){const known=new Set();let rounds=0;while(s.phase==='playing'){const d=deduce(s.cells,known,s.mineCount);assert.ok(d.safe.length||d.mines.length,'No guessing: a visible deduction is required');if(stopAtMine&&d.mines.length)return d.mines[0];for(const c of d.mines){known.add(c);if(useFlags&&!s.flags[c]){aim(s,c);tap(s,{b:true});}}for(const c of d.safe)if(s.cells[c]===null)reveal(s,c);assert.ok(++rounds<=50);}return {known,rounds};}
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name);}
test('public config and state expose only visible information',()=>{
 assert.deepEqual(Object.keys(m).sort(),['config','create','step']);for(const l of m.config.layouts){assert.deepEqual(Object.keys(l).sort(),['height','id','initialOpen','mineCount','name','nameZh','width']);assert.ok(Object.isFrozen(l.initialOpen));}
 for(let i=0;i<3;i++){const s=m.create(759,i);assert.equal(s.revealedSafe,[17,9,8][i]);assert.ok(s.safeTotal-s.revealedSafe>=12);assert.ok(s.cells.every(v=>v===null||(Number.isInteger(v)&&v>=0&&v<=8)));assert.deepEqual(Object.keys(s).filter(k=>/mine|secret|hidden/i.test(k)),['mineCount']);assert.deepEqual(Object.getOwnPropertySymbols(s),[]);const clone=structuredClone(s),before=structuredClone(clone);m.step(clone,1/60,{a:true});assert.deepEqual(clone,before,'Foreign copied state cannot obtain private information');}
});
test('all three boards win through visible-only deduction without any flags',()=>{
 for(let i=0;i<3;i++){const s=m.create(759,i),r=solve(s);assert.equal(s.phase,'won');assert.equal(s.flagsUsed,0);assert.equal(s.revealedSafe,s.safeTotal);assert.equal(s.score,100);assert.equal(s.cells.filter(v=>v===null).length,s.mineCount);for(let c=0;c<36;c++)if(s.cells[c]!==null)assert.equal(s.cells[c],adjacent(c).filter(n=>s.cells[n]===null).length,'Every final safe clue counts all eight neighbors');assert.ok(r.rounds>=5);}
});
test('zero expansion opens eight-neighbor component and numbered boundary',()=>{
 for(let i=0;i<3;i++){const s=m.create(759,i);for(let c=0;c<36;c++)if(s.cells[c]===0)assert.ok(adjacent(c).every(n=>s.cells[n]!==null),'Initial zero flood has no unvisited adjacent safe cell');}
 const s=m.create(759,1),known=new Set();let expanded=false;while(s.phase==='playing'&&!expanded){const d=deduce(s.cells,known,s.mineCount);d.mines.forEach(c=>known.add(c));assert.ok(d.safe.length||d.mines.length);for(const c of d.safe)if(s.cells[c]===null){const before=s.revealedSafe;reveal(s,c);if(s.revealedSafe-before>1){expanded=true;assert.ok(s.lastOpened.length>1);for(const j of s.lastOpened)if(s.cells[j]===0)assert.ok(adjacent(j).every(n=>s.cells[n]!==null));break;}}}assert.ok(expanded,'Later normal play exercises flood expansion');
});
test('flags protect cells, cap at mine total and never disclose correctness',()=>{
 const s=m.create(),hidden=s.cells.flatMap((v,i)=>v===null?[i]:[]),visible=structuredClone(s.cells);for(const c of hidden.slice(0,s.mineCount)){aim(s,c);tap(s,{b:true});assert.deepEqual(s.cells,visible);}assert.equal(s.flagsUsed,s.mineCount);aim(s,hidden[s.mineCount]);tap(s,{b:true});assert.equal(s.flagsUsed,s.mineCount);assert.equal(s.flags[hidden[s.mineCount]],false);
 aim(s,hidden[0]);tap(s,{a:true});assert.equal(s.reveals,0);tap(s,{b:true});assert.equal(s.flagsUsed,s.mineCount-1);aim(s,m.config.layouts[0].initialOpen[0]);tap(s,{b:true});tap(s,{a:true});assert.equal(s.reveals,0);
});
test('zero flood respects a safe flag until it is removed; prior visible-win observation fixture',()=>{
 // Establish actual safe clues via a complete visible-only win first, not private mine data.
 const solved=m.create(759,1);solve(solved);const s=m.create(759,1);
 const zero=s.cells.findIndex((v,i)=>v===null&&solved.cells[i]===0&&adjacent(i).some(n=>s.cells[n]===null&&solved.cells[n]>=0));
 assert.ok(zero>=0);const safe=adjacent(zero).find(n=>s.cells[n]===null&&solved.cells[n]!==null&&solved.cells[n]>=0);
 aim(s,safe);tap(s,{b:true});reveal(s,zero);assert.equal(s.cells[safe],null);assert.equal(s.flags[safe],true);assert.equal(s.phase,'playing');assert.ok(s.revealedSafe<s.safeTotal);
 aim(s,safe);tap(s,{b:true});reveal(s,safe);solve(s);assert.equal(s.phase,'won');
});
test('all boards allow ordinary mine loss from a certified visible deduction',()=>{
 for(let i=0;i<3;i++){const s=m.create(759,i),mine=solve(s,{stopAtMine:true});assert.equal(s.cells[mine],null);reveal(s,mine);assert.equal(s.phase,'lost');assert.equal(s.reason,'mine');assert.equal(s.exploded,mine);assert.equal(s.cells.filter(v=>v===-1).length,s.mineCount);assert.equal(s.score,0);}
});
test('normal visible deduction with flags wins and bound data remains finite',()=>{const s=m.create(759,2);solve(s,{useFlags:true});assert.equal(s.phase,'won');assert.ok(s.flagsUsed<=s.mineCount);assert.ok(s.lastOpened.length<=36);assert.ok(s.reveals<=s.safeTotal);});
test('held keys do not repeat and B priority protects the A edge',()=>{
 const s=m.create(),c=s.cells.findIndex(v=>v===null);aim(s,c);tick(s,{});tick(s,{a:true,b:true});assert.equal(s.flags[c],true);assert.equal(s.reveals,0);const changes=s.flagChanges;for(let n=0;n<20;n++)tick(s,{a:true,b:true});assert.equal(s.flagChanges,changes);tick(s,{});tick(s,{b:true});assert.equal(s.flags[c],false);
});
test('cancel epochs require subsequent neutral input before controls resume',()=>{const s=m.create(),start=s.cursor;tick(s,{cancelEpoch:0});tick(s,{x:1,cancelEpoch:1});assert.equal(s.cursor,start);tick(s,{x:1,cancelEpoch:1});assert.equal(s.cursor,start);tick(s,{cancelEpoch:1});tick(s,{x:1,cancelEpoch:1});assert.equal(s.cursor,start+1);tick(s,{cancelled:true});tick(s,{x:-1});assert.equal(s.cursor,start+1);tick(s,{});tick(s,{x:-1});assert.equal(s.cursor,start);});
test('invalid dt/paused inputs exact no-op; getters and inherited controls ignored',()=>{const s=m.create(),before=structuredClone(s);for(const dt of [0,-1,.26,NaN,Infinity,'1']){m.step(s,dt,{a:true});assert.deepEqual(s,before);}tick(s,{paused:true});assert.deepEqual(s,before);let reads=0;tick(s,{get a(){reads++;return true;}});assert.equal(reads,0);tick(s,Object.create({b:true}));assert.equal(s.flagChanges,0);tick(s,new Proxy({a:true},{getOwnPropertyDescriptor(){throw Error('synthetic');}}));assert.equal(s.reveals,0);});
test('terminal freeze and detached visible receipt, fresh-state isolation',()=>{
 const s=m.create();solve(s);const before=structuredClone(s);tap(s,{a:true,b:true,x:1});assert.deepEqual(s,before);const old=s.terminalReceipt.cells[0];s.cells[0]=99;assert.equal(s.terminalReceipt.cells[0],old);const a=m.create(),b=m.create();a.flags[0]=true;assert.equal(b.flags[0],false);a.cells[0]=99;assert.notEqual(b.cells[0],99);
 const c=m.create();c.elapsed=86400;c.calls=m.config.maxCounter;tick(c,{});assert.equal(c.elapsed,86400);assert.equal(c.calls,m.config.maxCounter);assert.equal(c.elapsedCapped,true);
});
console.log(JSON.stringify({passed:true,checks,solverInputs:'Public cells and mineCount only; no private mine data',physicalDeviceTested:false}));
