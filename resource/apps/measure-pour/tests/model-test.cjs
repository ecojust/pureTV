'use strict';
const assert=require('node:assert/strict');
const M=require('../src/main/assets/game-model.js');
const passed=[];
const clone=value=>JSON.parse(JSON.stringify(value));
function test(name,fn){fn();passed.push(name);}
function step(s,input={},dt=1/60){assert.equal(M.step(s,dt,input),s);return s;}
function fresh(level=0){const s=M.create(750,level);step(s);return s;}
function tap(s,key){step(s);return step(s,{a:key==='a',b:key==='b',x:key==='left'?-1:key==='right'?1:0,y:key==='up'?-1:key==='down'?1:0});}
function select(s,index){while(s.selected!==index&&s.phase==='playing')tap(s,'right');}
function pour(s,from,to){select(s,from);tap(s,'a');select(s,to);tap(s,'a');}
function invariant(s){
 const l=M.config.layouts[s.level];
 assert.equal(s.volumes.reduce((a,b)=>a+b,0),l.initial.reduce((a,b)=>a+b,0));
 s.volumes.forEach((v,i)=>assert.ok(Number.isInteger(v)&&v>=0&&v<=l.capacities[i]));
 assert.ok(s.poursUsed<=l.pourLimit);assert.equal(s.pourReceipts.length,s.poursUsed);
}
// Publicly computed test-only routes; no solver is packaged in game assets.
function search(layout){
 const queue=[{volumes:layout.initial.slice(),path:[]}],seen=new Set([layout.initial.join(',')]);
 for(let k=0;k<queue.length;k++){
  const current=queue[k];
  if(current.volumes.every((v,i)=>v===layout.target[i]))return current.path;
  for(let from=0;from<3;from++)for(let to=0;to<3;to++){
   if(from===to)continue;const amount=Math.min(current.volumes[from],layout.capacities[to]-current.volumes[to]);if(!amount)continue;
   const volumes=current.volumes.slice();volumes[from]-=amount;volumes[to]+=amount;const key=volumes.join(',');
   if(!seen.has(key)){seen.add(key);queue.push({volumes,path:current.path.concat([[from,to]])});}
  }
 }
 throw Error('Unsolvable public task');
}

test('three fixed public problems, immutable configuration and fresh state normalization',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);
 assert.deepEqual(M.config.layouts.map(l=>[l.capacities,l.initial,l.target,l.pourLimit]),[
  [[8,5,3],[8,0,0],[4,4,0],9],[[10,7,3],[10,0,0],[5,5,0],11],[[12,7,5],[12,0,0],[6,1,5],13]]);
 for(const seed of [undefined,null,-1,NaN,Infinity,4294967296,'750',1.2])assert.equal(M.create(seed,0).seed,750);
 for(const level of [undefined,null,-1,NaN,Infinity,3,'1',1.2])assert.equal(M.create(0,level).level,0);
 assert.equal(M.create(4294967295,2).seed,4294967295);
 const s=M.create(0,0),other=M.create(0,0);s.volumes[0]=0;s.capacities[0]=99;s.target[0]=99;
 assert.deepEqual(other.volumes,[8,0,0]);assert.deepEqual(other.capacities,[8,5,3]);assert.deepEqual(other.target,[4,4,0]);
 assert.equal(other.source,null);assert.equal(other.inputArmed,false);assert.equal(other.phase,'playing');
 assert.throws(()=>M.config.layouts[0].capacities.push(1),TypeError);
 assert.throws(()=>M.config.layouts[0].pourLimit=999,TypeError);
});

test('three ordinary complete games conserve water and judge all three targets',()=>{
 M.config.layouts.forEach((layout,level)=>{
  const path=search(layout);assert.equal(path.length,[7,9,11][level]);
  const s=fresh(level);
  for(const [from,to]of path){const before=s.volumes.slice();pour(s,from,to);invariant(s);
   const receipt=s.pourReceipts.at(-1);assert.equal(receipt.amount,Math.min(before[from],layout.capacities[to]-before[to]));
   assert.equal(s.source,null);assert.equal(s.selected,to);assert.deepEqual(receipt.after,s.volumes);
  }
  assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.reason,'');assert.deepEqual(s.volumes,layout.target);
  assert.equal(s.events[0].type,'win');assert.equal(s.terminalReceipt.cause,'success');
 });
});

test('all three last-allowance exact matches win before budget exhaustion',()=>{
 M.config.layouts.forEach((layout,level)=>{
  const s=fresh(level);pour(s,0,1);pour(s,1,0);assert.deepEqual(s.volumes,layout.initial);
  for(const [from,to]of search(layout))pour(s,from,to);
  assert.equal(s.poursUsed,layout.pourLimit);assert.equal(s.phase,'won');assert.equal(s.pourReceipts.at(-1).outcome,'won');invariant(s);
 });
});

test('ordinary unmatched last pour loses immediately and terminal calls never read input',()=>{
 const s=fresh();for(let n=0;n<9;n++)pour(s,n%2?1:0,n%2?0:1);
 assert.equal(s.poursUsed,9);assert.equal(s.phase,'lost');assert.equal(s.reason,'pours');assert.equal(s.score,0);
 assert.deepEqual(s.volumes,[3,5,0]);assert.equal(s.pourReceipts.at(-1).outcome,'lost');assert.equal(s.events[0].type,'collision');
 const before=clone(s);let reads=0;const bad=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('unexpected');}});
 step(s,bad,.1);step(s,bad,NaN);assert.equal(reads,0);assert.deepEqual(s,before);invariant(s);
});

test('empty sources, same jug, full destinations and empty cancel are all free',()=>{
 const s=fresh();tap(s,'b');assert.equal(s.events[0].reason,'no-source');
 select(s,2);tap(s,'a');assert.equal(s.events[0].reason,'empty-source');assert.equal(s.source,null);
 select(s,0);tap(s,'a');tap(s,'a');assert.equal(s.events[0].reason,'same-jug');assert.equal(s.source,0);assert.equal(s.poursUsed,0);
 select(s,1);tap(s,'a');assert.equal(s.poursUsed,1);assert.deepEqual(s.volumes,[3,5,0]);
 select(s,0);tap(s,'a');select(s,1);tap(s,'a');assert.equal(s.events[0].reason,'full-destination');assert.equal(s.source,0);
 assert.equal(s.poursUsed,1);assert.equal(s.blockedActions,4);assert.deepEqual(s.volumes,[3,5,0]);invariant(s);
});

test('cancel preserves water/current destination and permits a fresh source selection',()=>{
 const s=fresh();tap(s,'a');select(s,2);const before=s.volumes.slice();tap(s,'b');
 assert.equal(s.source,null);assert.equal(s.selected,2);assert.equal(s.events[0].type,'cancel');assert.equal(s.events[0].jug,0);
 assert.deepEqual(s.volumes,before);assert.equal(s.poursUsed,0);
 select(s,0);tap(s,'a');select(s,2);tap(s,'a');assert.deepEqual(s.volumes,[5,0,3]);assert.equal(s.poursUsed,1);
});

test('held edges do not repeat; navigation wraps, vertical ties ignored and simultaneous priority consumes edges',()=>{
 const s=fresh();tap(s,'left');assert.equal(s.selected,2);tap(s,'right');assert.equal(s.selected,0);
 step(s);step(s,{x:.5});assert.equal(s.selected,0);step(s,{x:.51});assert.equal(s.selected,1);
 for(let i=0;i<20;i++)step(s,{x:1});assert.equal(s.selected,1);step(s,{x:-1});assert.equal(s.selected,0);
 step(s,{x:1,y:1});assert.equal(s.selected,0);assert.equal(s.lastCommand,'down');
 step(s);step(s,{a:true,b:true,x:1});assert.equal(s.events[0].reason,'no-source');assert.equal(s.selected,0);assert.equal(s.source,null);
 step(s,{a:true,x:1});assert.equal(s.source,null);assert.equal(s.lastCommand,'none');
 step(s);step(s,{a:true,x:1});assert.equal(s.source,0);assert.equal(s.selected,0);
 const blocked=s.blockedActions;for(let i=0;i<20;i++)step(s,{a:true});assert.equal(s.blockedActions,blocked);assert.equal(s.poursUsed,0);
});

test('initial neutral and post-cancellation real release are required before commands',()=>{
 const s=M.create(0,0);step(s,{a:true});assert.equal(s.source,null);assert.equal(s.inputArmed,false);
 step(s);step(s,{a:true,cancelEpoch:1});assert.equal(s.source,0);
 step(s,{cancelEpoch:2});assert.equal(s.inputArmed,false);step(s,{b:true,cancelEpoch:2});assert.equal(s.source,0);
 step(s,{cancelEpoch:2});assert.equal(s.inputArmed,true);
 step(s,{b:true,cancelled:true,cancelEpoch:2});assert.equal(s.source,0);assert.equal(s.inputArmed,false);
 step(s,{cancelled:true});step(s,{b:true});assert.equal(s.source,0);
 step(s);step(s,{b:true});assert.equal(s.source,null);assert.equal(s.events[0].type,'cancel');
});

test('invalid dt/paused are exact no-ops, malformed input cannot invoke inherited getters or partial commands',()=>{
 const s=fresh();let reads=0;const before=clone(s);const bad=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('unexpected');}});
 for(const dt of [0,-1,.251,NaN,Infinity,'0.1',null,{},undefined])M.step(s,dt,bad);
 assert.equal(reads,0);assert.deepEqual(s,before);step(s,{paused:true,a:true,x:1});assert.deepEqual(s,before);
 let getters=0;const getter={};Object.defineProperty(getter,'a',{get(){getters++;return true;}});
 step(s,getter);step(s,Object.create({a:true,x:1}));assert.equal(getters,0);assert.equal(s.source,null);assert.equal(s.selected,0);
 for(const input of [null,[],17,true,'a',{a:1,b:'true',x:Infinity,y:NaN}])step(s,input);
 const partial=new Proxy({a:true},{getOwnPropertyDescriptor(target,key){if(key==='cancelled')throw Error('stop');return Object.getOwnPropertyDescriptor(target,key);}});
 step(s,partial);assert.equal(s.source,null);assert.equal(s.lastHeld.a,false);step(s,{a:true});assert.equal(s.source,0);
});

test('receipt snapshots and terminal snapshots are detached from live volume arrays',()=>{
 const s=fresh();for(const [from,to]of search(M.config.layouts[0]))pour(s,from,to);
 const final=s.volumes.slice(),first=s.pourReceipts[0];assert.deepEqual(first.before,[8,0,0]);assert.deepEqual(first.after,[3,5,0]);
 first.before[0]=99;first.after[0]=98;s.terminalReceipt.volumes[0]=97;assert.deepEqual(s.volumes,final);
 assert.deepEqual(s.pourReceipts[1].before,[3,5,0]);assert.deepEqual(s.pourReceipts.at(-1).after,final);
});

test('synthetic display tampering does not replace immutable rules; counters and elapsed remain finite',()=>{
 const s=fresh();s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;s.elapsed=M.config.maxElapsed;
 tap(s,'b');assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);
 // Synthetic boundary probe, never ordinary play: mutate display copies only.
 s.capacities[1]=99;s.target=[3,5,0];s.pourLimit=1;pour(s,0,1);
 assert.deepEqual(s.volumes,[3,5,0]);assert.equal(s.phase,'playing');assert.equal(s.poursUsed,1);
});
console.log(JSON.stringify({passed:true,cases:passed.length,checks:passed,physicalTvTested:false,physicalPhoneTested:false},null,2));
