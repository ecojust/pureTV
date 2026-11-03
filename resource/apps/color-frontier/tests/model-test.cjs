'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');
const passed=[],copy=x=>JSON.parse(JSON.stringify(x));
function test(name,fn){fn();passed.push(name);}
function step(s,i={},dt=1/60){return M.step(s,dt,i);}
function fresh(level=0){const s=M.create(749,level);step(s);return s;}
function tap(s,key){step(s);step(s,key==='a'?{a:true}:key==='b'?{b:true}:key==='right'?{x:1}:{x:-1});}
function choose(s,c){while(s.selected!==c)tap(s,'right');}
function paint(s,c){choose(s,c);tap(s,'a');}
const routes=[[3,0,1,2],[1,2,1,0,2,3],[1,0,2,0,3,0,1]];
test('fixed maps and immutable detached configuration',()=>{
  assert.deepEqual(Object.keys(M).sort(),['config','create','step']);
  assert.deepEqual(M.config.layouts.map(l=>[l.width,l.height,l.moveLimit]),[[5,5,6],[6,6,8],[6,6,9]]);
  const a=M.create(-1,-1),b=M.create(749,0);assert.equal(a.seed,749);assert.equal(a.level,0);assert.equal(a.inputArmed,false);
  assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('1','1').level,0);
  a.cells[0]=3;a.owned[0]=false;assert.equal(b.cells[0],0);assert.equal(b.owned[0],true);
  assert.throws(()=>M.config.layouts[0].cells[0]=3,TypeError);assert.throws(()=>M.config.colors[0].name='X',TypeError);
});
test('all three ordinary routes win, and two no-refund undos permit exact last-charge wins',()=>{
  routes.forEach((route,level)=>{for(const pad of [false,true]){
    const s=fresh(level);if(pad){paint(s,1);tap(s,'b');paint(s,1);tap(s,'b');assert.equal(s.movesUsed,2);}
    for(const color of route)paint(s,color);
    assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.ownedCount,s.cells.length);assert.ok(s.owned.every(Boolean));
    assert.equal(s.movesUsed,route.length+(pad?2:0));if(pad)assert.equal(s.movesUsed,s.moveLimit);
    assert.equal(s.terminalReceipt.cause,'success');assert.notEqual(s.terminalReceipt.cells,s.cells);
    const before=copy(s);step(s,{b:true,x:1,a:true});assert.deepEqual(s,before);
  }});
});
test('same-color blocked free, absent color consumes dye even with no growth',()=>{
  const s=fresh(),count=s.ownedCount;paint(s,0);assert.equal(s.movesUsed,0);assert.equal(s.events[0].reason,'same-color');
  paint(s,2);assert.equal(s.movesUsed,1);assert.equal(s.lastGain,0);assert.equal(s.ownedCount,count);assert.equal(s.color,2);
});
test('undo restores exact board and area without refunding moves or selection',()=>{
  const s=fresh(),before=copy(s);paint(s,3);const stored=s.history[0];assert.notEqual(stored.cells,s.cells);assert.notEqual(stored.owned,s.owned);
  assert.ok(s.ownedCount>before.ownedCount);tap(s,'b');assert.deepEqual(s.cells,before.cells);assert.deepEqual(s.owned,before.owned);
  assert.equal(s.color,before.color);assert.equal(s.selected,3);assert.equal(s.movesUsed,1);assert.equal(s.undos,1);assert.equal(s.history.length,0);
  tap(s,'b');assert.equal(s.movesUsed,1);assert.equal(s.events[0].reason,'no-history');assert.equal(s.undos,1);
  paint(s,3);assert.equal(s.movesUsed,2);assert.equal(s.history.length,1);
});
test('ordinary nonexpanding recolors exhaust exactly at allowance; terminal undo is frozen',()=>{
  const s=fresh();for(let i=0;i<6;i++){paint(s,i%2?0:2);assert.equal(s.movesUsed,i+1);if(i<5)assert.equal(s.phase,'playing');}
  assert.equal(s.phase,'lost');assert.equal(s.reason,'moves');assert.equal(s.score,0);assert.equal(s.history.length,6);
  assert.equal(s.terminalReceipt.cause,'moves');const before=copy(s);tap(s,'b');assert.deepEqual(s,before);
});
test('synthetic orthogonal cascade connects full adjacent chain but never diagonal island',()=>{
  const s=fresh();s.cells=Array(25).fill(3);s.cells[0]=0;[1,5,6,12].forEach(n=>s.cells[n]=1);
  s.owned=Array(25).fill(false);s.owned[0]=true;s.ownedCount=1;s.color=0;s.selected=1;
  tap(s,'a');assert.equal(s.ownedCount,4);for(const n of [0,1,5,6])assert.equal(s.owned[n],true);assert.equal(s.owned[12],false);
  assert.equal(s.cells[12],1);assert.equal(s.lastGain,3);
});
test('B>A>direction consumes extra edges; held A and direction do not repeat',()=>{
  const s=fresh();step(s,{a:true,b:true,x:1});assert.equal(s.events[0].reason,'no-history');assert.equal(s.selected,1);assert.equal(s.movesUsed,0);
  step(s,{a:true,x:1});assert.equal(s.lastCommand,'none');assert.equal(s.movesUsed,0);
  step(s);step(s,{a:true,x:1});assert.equal(s.movesUsed,1);assert.equal(s.selected,1);
  for(let i=0;i<10;i++)step(s,{a:true,x:1});assert.equal(s.movesUsed,1);assert.equal(s.selected,1);
  step(s);step(s,{x:1});assert.equal(s.selected,2);for(let i=0;i<10;i++)step(s,{x:1});assert.equal(s.selected,2);
  step(s,{x:1,y:1});assert.equal(s.lastCommand,'down');assert.equal(s.selected,2);
});
test('neutral initial arming and cancellation require a later real release',()=>{
  const s=M.create(749,0);step(s,{a:true});assert.equal(s.movesUsed,0);step(s,{cancelEpoch:0});assert.equal(s.inputArmed,true);
  step(s,{a:true,cancelEpoch:1});assert.equal(s.movesUsed,0);assert.equal(s.inputArmed,false);
  step(s,{a:true,cancelEpoch:1});assert.equal(s.movesUsed,0);step(s,{cancelEpoch:1});step(s,{a:true,cancelEpoch:1});assert.equal(s.movesUsed,1);
  step(s,{b:true,cancelEpoch:1,cancelled:true});assert.equal(s.undos,0);assert.equal(s.inputArmed,false);
  step(s,{cancelled:true});assert.equal(s.inputArmed,false);step(s,{b:true});assert.equal(s.undos,0);
  step(s);step(s,{b:true});assert.equal(s.undos,1);
});
test('invalid dt, paused calls and terminal freeze never consume inputs; malformed descriptors remain neutral',()=>{
  const s=fresh(),before=copy(s);let invoked=0;const input={};Object.defineProperty(input,'a',{get(){invoked++;return true;}});
  for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,input);assert.deepEqual(s,before);assert.equal(invoked,0);
  step(s,{paused:true,a:true});assert.deepEqual(s,before);step(s,input);assert.equal(invoked,0);assert.equal(s.movesUsed,0);
  step(s,Object.create({a:true}));assert.equal(s.movesUsed,0);
  step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='cancelled')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));assert.equal(s.movesUsed,0);
  for(const value of [null,[],true,'a',15,{a:1,x:Infinity}])step(s,value);assert.equal(s.movesUsed,0);
  step(s,{a:true});assert.equal(s.movesUsed,1);
});
test('synthetic time/counter saturation remains finite and time does not end play',()=>{
  const s=fresh();s.calls=M.config.maxCounter;s.elapsed=M.config.maxElapsed;step(s);
  assert.equal(s.calls,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
});
console.log(JSON.stringify({passed:true,cases:passed.length,checks:passed,physicalTvTested:false,physicalPhoneTested:false},null,2));
