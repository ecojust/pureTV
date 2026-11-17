'use strict';
const assert = require('node:assert/strict');
const M = require('../src/main/assets/game-model.js');
const checked = [];
function test(name, fn) { fn(); checked.push(name); }
const clone = x => JSON.parse(JSON.stringify(x));
const step = (s, input = {}, dt = 1/60) => M.step(s, dt, input);
function fresh(level = 0) { const s = M.create(748, level); step(s); return s; }
function tap(s, command) {
  step(s);
  const input = { a:command === 'a', b:command === 'b', x:command === 'right' ? 1 : command === 'left' ? -1 : 0,
    y:command === 'down' ? 1 : command === 'up' ? -1 : 0 };
  step(s,input); return s;
}
function select(s, position) { while (s.selected !== position) tap(s,'right'); }
function pickup(s, position) { select(s,position); tap(s,'a'); }
function store(s, position) { select(s,position); tap(s,'a'); }
function firstShift(extraCycles = 0) {
  const s = fresh();
  pickup(s,0); store(s,1);
  for (let i=0;i<extraCycles;i++) { pickup(s,1); store(s,1); }
  pickup(s,0); store(s,2); pickup(s,0); store(s,3);
  pickup(s,0); tap(s,'b'); pickup(s,1); tap(s,'b');
  pickup(s,0); tap(s,'b'); pickup(s,2); tap(s,'b');
  pickup(s,0); tap(s,'b'); pickup(s,3); tap(s,'b');
  return s;
}
function conservation(s) {
  const cargo = s.inbound.slice(s.inboundIndex).concat(...s.bays,s.held === null ? [] : [s.held],s.dispatchReceipts.map(r=>r.crate));
  assert.deepEqual(cargo.sort((a,b)=>a-b),s.inbound);
  assert.ok(s.bays.every(b=>b.length<=s.capacity));
}

test('fixed layouts, normalized identity, immutable public API and fresh independent state',()=>{
  assert.deepEqual(Object.keys(M).sort(),['config','create','step']);
  assert.deepEqual(M.config.layouts.map(l=>[l.inbound.length,l.capacity,l.moveLimit]),[[6,2,24],[7,3,28],[8,3,32]]);
  assert.deepEqual(M.config.layouts.map(l=>l.delivery),[[4,1,5,2,6,3],[5,2,7,1,4,6,3],[8,1,7,2,6,3,5,4]]);
  for (const seed of [undefined,null,-1,NaN,Infinity,4294967296,'1',1.5]) assert.equal(M.create(seed,0).seed,748);
  for (const level of [undefined,null,-1,NaN,Infinity,3,'1',1.5]) assert.equal(M.create(0,level).level,0);
  assert.equal(M.create(4294967295,2).seed,4294967295);
  const a = M.create(0,0), b = M.create(0,0);
  assert.equal(a.inputArmed,false); assert.equal(a.held,null); assert.equal(a.score,0);
  a.inbound[0]=99; a.bays[0].push(99); a.delivery[0]=99;
  assert.equal(b.inbound[0],1); assert.equal(b.bays[0].length,0); assert.equal(b.delivery[0],4);
  assert.throws(()=>M.config.layouts[0].delivery.push(99),TypeError);
  assert.throws(()=>M.config.layouts[0].capacity=99,TypeError);
});

test('ordinary LIFO, bay capacity and blocked actions preserve cargo and resources',()=>{
  const s=fresh(); tap(s,'b'); assert.equal(s.events[0].reason,'crane-empty'); assert.equal(s.movesUsed,0);
  pickup(s,1); assert.equal(s.events[0].reason,'bay-empty'); assert.equal(s.movesUsed,0);
  pickup(s,0); assert.equal(s.held,1); tap(s,'a'); assert.equal(s.events[0].reason,'crane-full'); assert.equal(s.movesUsed,1);
  store(s,1); pickup(s,0); store(s,1); assert.deepEqual(s.bays[0],[1,2]);
  pickup(s,0); store(s,1); assert.equal(s.events[0].reason,'bay-full'); assert.equal(s.held,3); assert.equal(s.movesUsed,5);
  store(s,2); pickup(s,1); assert.equal(s.held,2); assert.deepEqual(s.bays[0],[1]); conservation(s);
});

test('ordinary complete win and successful final dispatch at exactly the crane allowance',()=>{
  for (const cycles of [0,6]) {
    const s=firstShift(cycles);
    assert.equal(s.phase,'won'); assert.equal(s.score,100); assert.equal(s.reason,'');
    assert.equal(s.movesUsed,12+2*cycles); assert.equal(s.nextDelivery,6); assert.equal(s.held,null);
    assert.deepEqual(s.dispatchReceipts.map(r=>r.crate),[4,1,5,2,6,3]);
    assert.equal(s.events[0].type,'win'); assert.equal(s.terminalReceipt.cause,'success');
    assert.notEqual(s.terminalReceipt.bays,s.bays); assert.notEqual(s.terminalReceipt.bays[0],s.bays[0]); conservation(s);
    const before=clone(s); step(s,{a:true,b:true,x:1},0.25); assert.deepEqual(s,before);
    assert.notEqual(s.dispatchReceipts[0],s.dispatchReceipts[1]);
  }
});

test('ordinary move overrun applies cargo movement then freezes as loss',()=>{
  const s=fresh(); pickup(s,0); store(s,1);
  for(let i=0;i<11;i++) { pickup(s,1); store(s,1); }
  assert.equal(s.movesUsed,24); assert.equal(s.phase,'playing');
  tap(s,'b'); assert.equal(s.events[0].reason,'crane-empty'); assert.equal(s.phase,'playing');
  pickup(s,1); assert.equal(s.movesUsed,25); assert.equal(s.held,1); assert.equal(s.phase,'lost'); assert.equal(s.reason,'moves');
  assert.equal(s.score,0); assert.equal(s.terminalReceipt.movesUsed,25); conservation(s);
  const before=clone(s); tap(s,'b'); assert.deepEqual(s,before);
});

test('wrong-order cargo is retained; three ordinary attempts lose without dispatch or crane cost',()=>{
  const s=fresh(); pickup(s,0);
  for(let n=1;n<=3;n++) { tap(s,'b'); assert.equal(s.mistakes,n); assert.equal(s.held,1); assert.equal(s.nextDelivery,0); assert.equal(s.movesUsed,1); }
  assert.equal(s.phase,'lost'); assert.equal(s.reason,'mistakes'); assert.equal(s.events[0].type,'collision');
  assert.deepEqual(s.dispatchReceipts,[]); conservation(s);
});

test('selection wraps, vertical ties are ignored, axis threshold and held directions do not repeat',()=>{
  const s=fresh(); tap(s,'left'); assert.equal(s.selected,3); tap(s,'right'); assert.equal(s.selected,0);
  step(s); step(s,{x:0.5}); assert.equal(s.selected,0); step(s,{x:0.51}); assert.equal(s.selected,1);
  for(let i=0;i<20;i++) step(s,{x:1}); assert.equal(s.selected,1);
  step(s,{x:-1}); assert.equal(s.selected,0);
  step(s,{x:1,y:1}); assert.equal(s.lastCommand,'down'); assert.equal(s.selected,0);
  tap(s,'up'); assert.equal(s.selected,0); assert.equal(s.movesUsed,0);
});

test('B>A>direction priority consumes simultaneous suppressed edges and held A does not repeat',()=>{
  const s=fresh(); step(s,{b:true,a:true,x:1}); assert.equal(s.events[0].reason,'crane-empty');
  assert.equal(s.held,null); assert.equal(s.selected,0);
  step(s,{a:true,x:1}); assert.equal(s.lastCommand,'none'); assert.equal(s.held,null);
  step(s); step(s,{a:true,x:1}); assert.equal(s.held,1); assert.equal(s.selected,0); assert.equal(s.movesUsed,1);
  for(let i=0;i<20;i++) step(s,{a:true}); assert.equal(s.movesUsed,1); assert.equal(s.blockedActions,1);
  step(s); step(s,{a:true}); assert.equal(s.events[0].reason,'crane-full'); assert.equal(s.movesUsed,1);
});

test('initial release requirement, cancellation epochs and true release rearm',()=>{
  const s=M.create(0,0); step(s,{a:true}); assert.equal(s.held,null); assert.equal(s.inputArmed,false);
  step(s); step(s,{a:true,cancelEpoch:1}); assert.equal(s.held,1); assert.equal(s.inputArmed,true);
  step(s,{cancelEpoch:2}); assert.equal(s.inputArmed,false); assert.equal(s.lastCommand,'none');
  step(s,{b:true,cancelEpoch:2}); assert.equal(s.mistakes,0); assert.equal(s.inputArmed,false);
  step(s,{cancelEpoch:2}); assert.equal(s.inputArmed,true);
  step(s,{b:true,cancelEpoch:2,cancelled:true}); assert.equal(s.mistakes,0); assert.equal(s.inputArmed,false);
  step(s,{cancelEpoch:2,cancelled:true}); assert.equal(s.inputArmed,false);
  step(s,{b:true,cancelEpoch:2}); assert.equal(s.mistakes,0);
  step(s,{cancelEpoch:2}); step(s,{b:true,cancelEpoch:2}); assert.equal(s.mistakes,1);
});

test('invalid dt and paused calls are exact no-ops and never consume command edges',()=>{
  const s=fresh(); const original=clone(s); let reads=0;
  const input=new Proxy({a:true},{getOwnPropertyDescriptor(){reads++;throw Error('unexpected');}});
  for(const dt of [0,-1,0.251,NaN,Infinity,'0.1',null,{},undefined]) M.step(s,dt,input);
  assert.equal(reads,0); assert.deepEqual(s,original);
  step(s,{paused:true,a:true,x:1}); assert.deepEqual(s,original);
  step(s,{a:true}); assert.equal(s.held,1);
});

test('malformed inputs ignore getters/inheritance and descriptor failures discard all partial reads',()=>{
  const s=fresh(); let getters=0;
  const withGetter={}; Object.defineProperty(withGetter,'a',{get(){getters++;return true;}});
  step(s,withGetter); assert.equal(getters,0); assert.equal(s.held,null);
  step(s,Object.create({a:true,b:true,x:1})); assert.equal(s.held,null); assert.equal(s.selected,0);
  for(const input of [null,[],true,'a',17,undefined,{a:1,b:'true',x:Infinity,y:NaN}]) step(s,input);
  assert.equal(s.held,null); assert.equal(s.selected,0);
  const partial=new Proxy({a:true},{getOwnPropertyDescriptor(target,key){if(key==='cancelled')throw Error('stop');return Object.getOwnPropertyDescriptor(target,key);}});
  step(s,partial); assert.equal(s.held,null); assert.equal(s.lastHeld.a,false);
  step(s,{a:true}); assert.equal(s.held,1);
});

test('synthetic saturation and immutable judging boundaries are finite and detached',()=>{
  const s=fresh(); s.calls=M.config.maxCounter; s.elapsed=M.config.maxElapsed;
  step(s); assert.equal(s.calls,M.config.maxCounter); assert.equal(s.elapsed,M.config.maxElapsed); assert.equal(s.elapsedCapped,true);
  // Deliberately changed display copies are synthetic fixtures, never ordinary play.
  s.inbound[0]=99; s.delivery[0]=99; s.moveLimit=999; s.capacity=999;
  pickup(s,0); assert.equal(s.held,1); tap(s,'b'); assert.equal(s.mistakes,1); assert.equal(s.nextDelivery,0);
});

console.log(JSON.stringify({passed:true,cases:checked.length,checks:checked,physicalTvTested:false,physicalPhoneTested:false},null,2));
