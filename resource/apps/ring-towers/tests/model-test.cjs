'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x));
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){return M.step(s,dt,i);}
function fresh(level=0){const s=M.create(755,level);step(s);return s;}
function tap(s,key){step(s);step(s,{a:key==='a',b:key==='b',x:key==='right'?1:key==='left'?-1:0});}
function select(s,peg){while(s.selected!==peg)tap(s,'right');}
function transfer(s,from,to){select(s,from);tap(s,'a');select(s,to);tap(s,'a');}
function route(n,from=0,to=2,aux=1,result=[]){if(n){route(n-1,from,aux,to,result);result.push([from,to]);route(n-1,aux,to,from,result);}return result;}
function integrity(s){assert.deepEqual(s.pegs.flat().sort((a,b)=>a-b),Array.from({length:s.diskCount},(_,i)=>i+1));
  for(const peg of s.pegs)for(let i=1;i<peg.length;i++)assert.ok(peg[i-1]>peg[i]);if(s.source!==null)assert.ok(s.pegs[s.source].length);}
test('fixed layouts, normalized identity and immutable detached config/state',()=>{
  assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.layouts.map(l=>[l.diskCount,l.moveLimit]),[[3,11],[4,21],[5,39]]);
  const a=M.create(-1,-1),b=M.create(755,0);assert.equal(a.seed,755);assert.equal(a.level,0);assert.equal(a.inputArmed,false);assert.deepEqual(a.pegs,[[3,2,1],[],[]]);
  a.pegs[0].pop();assert.equal(b.pegs[0].length,3);assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('1','1').level,0);
  assert.throws(()=>M.config.layouts[0].moveLimit=999,TypeError);
});
test('ordinary recursive routes and padded exact-budget routes win all three levels',()=>{
  for(let level=0;level<3;level++)for(const padded of [false,true]){
    const s=fresh(level);if(padded)for(let n=0;n<level+2;n++){transfer(s,0,1);transfer(s,1,0);integrity(s);}
    for(const [from,to]of route(s.diskCount)){transfer(s,from,to);integrity(s);}
    assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.source,null);assert.deepEqual(s.pegs,[[],[],Array.from({length:s.diskCount},(_,i)=>s.diskCount-i)]);
    assert.equal(s.movesUsed,2**s.diskCount-1+(padded?2*(level+2):0));if(padded)assert.equal(s.movesUsed,s.moveLimit);
    assert.equal(s.transfers.length,s.movesUsed);assert.notEqual(s.lastMove,s.transfers.at(-1));assert.equal(s.terminalReceipt.cause,'success');assert.notEqual(s.terminalReceipt.pegs,s.pegs);
    const before=copy(s);step(s,{a:true,b:true,x:1});assert.deepEqual(s,before);
  }
});
test('source marking and cancellation keep every ring visibly on its peg and cost no transfer',()=>{
  const s=fresh(),pegs=copy(s.pegs);tap(s,'a');assert.equal(s.source,0);assert.deepEqual(s.pegs,pegs);assert.equal(s.movesUsed,0);
  select(s,2);tap(s,'b');assert.equal(s.source,null);assert.deepEqual(s.pegs,pegs);assert.equal(s.movesUsed,0);
  tap(s,'b');assert.equal(s.events[0].reason,'no-source');tap(s,'a');assert.equal(s.events[0].reason,'empty-source');assert.equal(s.source,null);integrity(s);
});
test('same-peg and large-on-small rejection are free and keep marked source',()=>{
  const s=fresh();tap(s,'a');tap(s,'a');assert.equal(s.events[0].reason,'same-peg');assert.equal(s.source,0);assert.equal(s.movesUsed,0);
  select(s,1);tap(s,'a');assert.equal(s.movesUsed,1);assert.deepEqual(s.pegs,[[3,2],[1],[]]);
  select(s,0);tap(s,'a');select(s,1);const before=copy(s.pegs);tap(s,'a');assert.equal(s.events[0].reason,'larger-on-smaller');
  assert.equal(s.source,0);assert.equal(s.movesUsed,1);assert.deepEqual(s.pegs,before);
  select(s,2);tap(s,'a');assert.equal(s.movesUsed,2);assert.deepEqual(s.pegs,[[3],[1],[2]]);integrity(s);
});
test('ordinary reversible transfers exhaust the final unsolved allowance and freeze',()=>{
  const s=fresh();for(let i=0;i<5;i++){transfer(s,0,1);transfer(s,1,0);assert.equal(s.phase,'playing');}
  transfer(s,0,1);assert.equal(s.phase,'lost');assert.equal(s.reason,'moves');assert.equal(s.movesUsed,11);assert.equal(s.source,null);assert.equal(s.score,0);
  assert.deepEqual(s.pegs,[[3,2],[1],[]]);assert.equal(s.transfers.length,11);assert.equal(s.terminalReceipt.cause,'moves');integrity(s);
  const before=copy(s);tap(s,'b');assert.deepEqual(s,before);
});
test('selection wraps; vertical direction ignored; B>A>direction consumes extra edges',()=>{
  const s=fresh();tap(s,'left');assert.equal(s.selected,2);tap(s,'right');assert.equal(s.selected,0);
  step(s);step(s,{a:true,b:true,x:1});assert.equal(s.events[0].reason,'no-source');assert.equal(s.source,null);assert.equal(s.selected,0);
  step(s,{a:true,x:1});assert.equal(s.lastCommand,'none');assert.equal(s.source,null);
  step(s);step(s,{a:true,x:1});assert.equal(s.source,0);assert.equal(s.selected,0);
  step(s);step(s,{x:1,y:1});assert.equal(s.lastCommand,'down');assert.equal(s.selected,0);assert.equal(s.movesUsed,0);
});
test('held A and direction do not repeat or prematurely remove the source ring',()=>{
  const s=fresh();step(s,{a:true});assert.equal(s.source,0);for(let n=0;n<15;n++)step(s,{a:true});assert.equal(s.movesUsed,0);assert.equal(s.blockedActions,0);assert.equal(s.pegs[0].length,3);
  step(s);step(s,{x:1});for(let n=0;n<15;n++)step(s,{x:1});assert.equal(s.selected,1);
  step(s);step(s,{a:true});assert.equal(s.movesUsed,1);for(let n=0;n<15;n++)step(s,{a:true});assert.equal(s.movesUsed,1);assert.equal(s.source,null);
});
test('fresh neutral, epoch changes and cancelled presses require later release',()=>{
  const s=M.create(755,0);step(s,{a:true});assert.equal(s.source,null);step(s,{cancelEpoch:0});assert.equal(s.inputArmed,true);
  step(s,{a:true,cancelEpoch:1});assert.equal(s.source,null);assert.equal(s.inputArmed,false);step(s,{a:true,cancelEpoch:1});assert.equal(s.source,null);
  step(s,{cancelEpoch:1});step(s,{a:true,cancelEpoch:1});assert.equal(s.source,0);
  step(s,{b:true,cancelled:true});assert.equal(s.source,0);step(s,{b:true});assert.equal(s.source,0);step(s);step(s,{b:true});assert.equal(s.source,null);
});
test('invalid clocks, pause and malformed descriptors never apply partial commands',()=>{
  const s=fresh(),before=copy(s);let reads=0;const input={};Object.defineProperty(input,'a',{get(){reads++;return true;}});
  for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,input);assert.deepEqual(s,before);assert.equal(reads,0);
  step(s,{paused:true,a:true});assert.deepEqual(s,before);step(s,input);assert.equal(reads,0);assert.equal(s.source,null);
  step(s,Object.create({a:true}));assert.equal(s.source,null);step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));assert.equal(s.source,null);
  for(const v of [null,[],true,17,'a',{a:1,x:Infinity}])step(s,v);assert.equal(s.source,null);step(s,{a:true});assert.equal(s.source,0);
});
test('synthetic counter and elapsed saturation leave a playable finite state',()=>{
  const s=fresh();s.calls=M.config.maxCounter;s.elapsed=M.config.maxElapsed;step(s);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,physicalTvTested:false,physicalPhoneTested:false},null,2));
