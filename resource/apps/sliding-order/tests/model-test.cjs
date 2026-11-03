'use strict';
const assert=require('node:assert/strict'),m=require('../src/main/assets/game-model.js');
const paths=[['right','up','left','left','down','right','right','down'],['up','up','left','down','right','up','left','left','down','right','right','down'],['down','right','down','right','up','up','left','down','left','down','right','right','up','up','left','down','down','right']];
const input={left:{x:-1},right:{x:1},up:{y:-1},down:{y:1},a:{a:true}};
const tick=(s,i={})=>m.step(s,1/60,i),tap=(s,key)=>{tick(s,{});tick(s,input[key]||{});tick(s,{});};let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('three public starts are detached, unsolved and have even inversion parity',()=>{
 assert.deepEqual(Object.keys(m).sort(),['config','create','step']);assert.ok(Object.isFrozen(m.config.goal));
 m.config.layouts.forEach((l,k)=>{const a=m.create(754,k),b=m.create(754,k),tiles=a.board.filter(Boolean);let inv=0;for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)inv+=tiles[i]>tiles[j];assert.equal(inv%2,0);assert.notDeepEqual(a.board,m.config.goal);assert.equal(a.blank,a.board.indexOf(0));a.board[0]=99;assert.deepEqual(b.board,l.board);});
});
test('ordinary shortest paths win all three layouts with conserved tiles',()=>{paths.forEach((path,level)=>{const s=m.create(754,level);for(const dir of path){tap(s,dir);assert.deepEqual(s.board.slice().sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8]);assert.equal(s.blank,s.board.indexOf(0));}assert.equal(s.phase,'won');assert.equal(s.movesUsed,[8,12,18][level]);assert.equal(s.matched,8);assert.equal(s.score,100);});});
test('last allowed slide wins before budget exhaustion, using ordinary detours',()=>{
 for(let level=0;level<3;level++){const s=m.create(754,level),pair=level===0?['right','left']:level===1?['left','right']:['right','left'];for(let i=0;i<3;i++)for(const d of pair)tap(s,d);assert.deepEqual(s.board,m.config.layouts[level].board);for(const d of paths[level])tap(s,d);assert.equal(s.phase,'won');assert.equal(s.movesUsed,s.moveLimit);}
});
test('unsolved last slide loses and terminal cannot undo',()=>{const s=m.create();for(let n=0;n<14;n++)tap(s,n%2?'left':'right');assert.equal(s.phase,'lost');assert.equal(s.reason,'moves');assert.equal(s.movesUsed,14);const terminal=structuredClone(s);tap(s,'a');tick(s,{x:1});assert.deepEqual(s,terminal);});
test('undo restores board and blank without refund, branches retain actual history',()=>{
 const s=m.create(),start=s.board.slice();tap(s,'right');const first=s.board.slice();tap(s,'down');tap(s,'a');assert.deepEqual(s.board,first);assert.equal(s.movesUsed,2);assert.equal(s.undos,1);tap(s,'up');tap(s,'a');assert.deepEqual(s.board,first);assert.equal(s.movesUsed,3);tap(s,'a');assert.deepEqual(s.board,start);assert.equal(s.movesUsed,3);assert.equal(s.history.length,0);assert.equal(s.lastSlide,null);tap(s,'a');assert.equal(s.blockedActions,1);assert.equal(s.undos,3);
});
test('directions move the blank, blocked edges are free and B is unused',()=>{
 const s=m.create(754,2);tap(s,'up');tap(s,'left');assert.equal(s.movesUsed,0);assert.equal(s.blockedActions,2);tap(s,'right');assert.equal(s.blank,1);assert.equal(s.board[0],6);const before=s.board.slice();tick(s,{});tick(s,{b:true});assert.deepEqual(s.board,before);assert.equal(s.movesUsed,1);
});
test('held direction does not repeat; A takes priority over direction',()=>{
 const s=m.create();tick(s,{});tick(s,{x:1});for(let n=0;n<12;n++)tick(s,{x:1});assert.equal(s.movesUsed,1);tick(s,{});tick(s,{a:true,x:-1});assert.equal(s.movesUsed,1);assert.equal(s.undos,1);assert.deepEqual(s.board,m.config.layouts[0].board);for(let n=0;n<12;n++)tick(s,{a:true,x:-1});assert.equal(s.undos,1);
});
test('cancellation epoch and cancelled samples require release before new commands',()=>{
 const s=m.create();tick(s,{cancelEpoch:0});tick(s,{x:1,cancelEpoch:1});assert.equal(s.movesUsed,0);tick(s,{x:1,cancelEpoch:1});assert.equal(s.movesUsed,0);tick(s,{cancelEpoch:1});tick(s,{x:1,cancelEpoch:1});assert.equal(s.movesUsed,1);tick(s,{cancelled:true});tick(s,{a:true});assert.equal(s.undos,0);tick(s,{});tick(s,{a:true});assert.equal(s.undos,1);
});
test('invalid time and paused calls freeze; getters and inherited inputs ignored',()=>{
 const s=m.create(),before=structuredClone(s);for(const dt of [0,-1,.26,NaN,Infinity,'0.1']){m.step(s,dt,{x:1});assert.deepEqual(s,before);}tick(s,{paused:true,x:1});assert.deepEqual(s,before);let reads=0;tick(s,{get x(){reads++;return 1;}});assert.equal(reads,0);tick(s,Object.create({x:1}));assert.equal(s.movesUsed,0);tick(s,new Proxy({x:1},{getOwnPropertyDescriptor(){throw Error('synthetic');}}));assert.equal(s.movesUsed,0);
});
test('history and terminal receipt are detached and bounded; finite saturation',()=>{
 const s=m.create();tap(s,'right');const saved=s.history[0].board.slice();assert.deepEqual(s.history[0].board,saved);assert.notEqual(s.board,s.history[0].board);const won=m.create();for(const d of paths[0])tap(won,d);const before=structuredClone(won);tick(won,{a:true,x:1});assert.deepEqual(won,before);won.board[0]=99;assert.equal(won.terminalReceipt.board[0],1);assert.ok(won.history.length<=won.moveLimit);
 const c=m.create();c.elapsed=86400;c.calls=m.config.maxCounter;tick(c,{});assert.equal(c.elapsed,86400);assert.equal(c.calls,m.config.maxCounter);assert.equal(c.elapsedCapped,true);
});
console.log(JSON.stringify({passed:true,checks:passed,physicalDeviceTested:false}));
