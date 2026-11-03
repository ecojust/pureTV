'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x));
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){return M.step(s,dt,i);}
function tap(s,key){step(s);step(s,{a:key==='a',b:key==='b',x:key==='right'?1:key==='left'?-1:0,y:key==='down'?1:key==='up'?-1:0});}
function cursor(s,p){while(Math.floor(s.cursor/s.width)<Math.floor(p/s.width))tap(s,'down');while(Math.floor(s.cursor/s.width)>Math.floor(p/s.width))tap(s,'up');while(s.cursor%s.width<p%s.width)tap(s,'right');while(s.cursor%s.width>p%s.width)tap(s,'left');}
function ready(level=0){const s=M.create(760,level),memory=s.visibleFaces.slice();while(s.stage==='preview')step(s,{},.25);return {s,memory};}
function reveal(s,p){cursor(s,p);tap(s,'a');}
function pairs(memory){return [...new Set(memory)].map(v=>memory.flatMap((f,i)=>f===v?[i]:[]));}
function badPair(memory){return [0,memory.findIndex(f=>f!==memory[0])];}
function waitCompare(s){while(s.stage==='compare')step(s,{},.25);}
test('three layouts, exactly two of each preview symbol, deterministic seeds and independent state',()=>{
  assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.layouts.map(l=>[l.width,l.height,l.pairCount,l.previewSeconds,l.mistakeLimit]),[[4,3,6,2.5,4],[4,4,8,2,5],[5,4,10,1.5,6]]);
  for(let level=0;level<3;level++){const a=M.create(760,level),b=M.create(760,level);assert.deepEqual(a.visibleFaces,b.visibleFaces);
    for(let face=1;face<=a.pairCount;face++)assert.equal(a.visibleFaces.filter(v=>v===face).length,2);
    a.visibleFaces[0]=null;assert.notEqual(b.visibleFaces[0],null);assert.notEqual(a.locked,b.locked);}
  assert.notDeepEqual(M.create(760,0).visibleFaces,M.create(761,0).visibleFaces);assert.equal(M.create(-1,-1).seed,760);assert.equal(M.create('1','1').level,0);assert.equal(M.create(4294967295,2).seed,4294967295);
  assert.throws(()=>M.config.layouts[0].previewSeconds=99,TypeError);
});
test('ordinary full wins on every gallery using only memorized visible opening previews',()=>{
  for(let level=0;level<3;level++){const {s,memory}=ready(level);assert.ok(s.visibleFaces.every(v=>v===null));
    for(const [a,b]of pairs(memory)){reveal(s,a);assert.equal(s.visibleFaces[a],memory[a]);reveal(s,b);assert.equal(s.locked[a],true);assert.equal(s.locked[b],true);}
    assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.matchedPairs,s.pairCount);assert.equal(s.mistakes,0);assert.equal(s.flips,s.pairCount*2);assert.deepEqual(s.visibleFaces,memory);
    assert.notEqual(s.terminalReceipt.visibleFaces,s.visibleFaces);const before=copy(s);step(s,{a:true,y:1},.25);assert.deepEqual(s,before);}
});
test('public concealed snapshots contain no hidden deck; copied snapshots cannot resume gameplay',()=>{
  const {s}=ready();assert.ok(s.visibleFaces.every(v=>v===null));assert.equal(Object.getOwnPropertySymbols(s).length,0);
  for(const key of Object.keys(s))assert.ok(!/deck|solution|hidden/i.test(key));for(const l of M.config.layouts)assert.deepEqual(Object.keys(l).sort(),['height','id','mistakeLimit','name','nameZh','pairCount','previewSeconds','width']);
  const snapshot=copy(s),before=copy(snapshot);M.step(snapshot,.25,{a:true});assert.deepEqual(snapshot,before);assert.equal(s.flips,0);
});
test('first card cannot pair with itself and locked cards cannot reveal again',()=>{
  const {s,memory}=ready(),[a,b]=pairs(memory)[0];reveal(s,a);const flips=s.flips;tap(s,'a');assert.equal(s.events[0].reason,'same-card');assert.equal(s.flips,flips);assert.equal(s.first,a);
  reveal(s,b);assert.equal(s.matchedPairs,1);assert.equal(s.first,null);assert.equal(s.second,null);tap(s,'a');assert.equal(s.events[0].reason,'locked');assert.equal(s.flips,2);assert.equal(s.mistakes,0);
});
test('mismatch remains visible for a full later active second, then hides and costs one mistake',()=>{
  const {s,memory}=ready(),[a,b]=badPair(memory);reveal(s,a);reveal(s,b);assert.equal(s.stage,'compare');assert.equal(s.compareRemaining,1);assert.equal(s.mistakes,0);
  for(let i=0;i<3;i++){step(s,{},.25);assert.equal(s.stage,'compare');assert.equal(s.visibleFaces[a],memory[a]);assert.equal(s.visibleFaces[b],memory[b]);assert.equal(s.mistakes,0);}
  step(s,{},.25);assert.equal(s.stage,'choosing');assert.equal(s.visibleFaces[a],null);assert.equal(s.visibleFaces[b],null);assert.equal(s.first,null);assert.equal(s.second,null);assert.equal(s.mistakes,1);
});
test('last permitted mismatch completes visible delay before a natural terminal loss',()=>{
  const {s,memory}=ready(),[a,b]=badPair(memory);
  for(let k=0;k<s.mistakeLimit;k++){reveal(s,a);reveal(s,b);assert.equal(s.phase,'playing');assert.equal(s.mistakes,k);assert.notEqual(s.visibleFaces[a],null);waitCompare(s);}
  assert.equal(s.phase,'lost');assert.equal(s.reason,'mistakes');assert.equal(s.mistakes,s.mistakeLimit);assert.equal(s.score,0);assert.ok(s.visibleFaces.every(v=>v===null));
  const before=copy(s);tap(s,'a');assert.deepEqual(s,before);assert.ok(s.terminalReceipt.visibleFaces.every(v=>v===null));
});
test('preview A is blocked through expiration and a held press requires release',()=>{
  const s=M.create(760,0);step(s,{},.25);step(s,{a:true},.25);assert.equal(s.events[0].reason,'preview');assert.equal(s.flips,0);
  while(s.stage==='preview')step(s,{a:true},.25);assert.ok(s.visibleFaces.every(v=>v===null));step(s,{a:true},.25);assert.equal(s.flips,0);
  step(s);step(s,{a:true});assert.equal(s.flips,1);
});
test('comparison A cannot reveal a third card or retrigger after the hide boundary',()=>{
  const {s,memory}=ready(),[a,b]=badPair(memory);reveal(s,a);reveal(s,b);const flips=s.flips;
  while(s.stage==='compare')step(s,{a:true},.25);step(s,{a:true},.25);assert.equal(s.flips,flips);assert.ok(s.visibleFaces.every(v=>v===null));
  step(s);step(s,{a:true});assert.equal(s.flips,flips+1);assert.equal(s.first,b);
});
test('pause freezes preview and comparison exactly; neutral and cancelled calls advance them',()=>{
  const s=M.create(760,0),before=copy(s);step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);
  step(s,{cancelled:true},.25);assert.equal(s.previewRemaining,2.25);assert.equal(s.elapsed,.25);
  const {s:t,memory}=ready(),[a,b]=badPair(memory);reveal(t,a);reveal(t,b);const comparison=copy(t);step(t,{paused:true},.25);assert.deepEqual(t,comparison);
  step(t,{cancelled:true},.25);assert.equal(t.compareRemaining,.75);assert.equal(t.flips,2);assert.equal(t.inputArmed,false);
});
test('cursor clamps edges, A outranks direction, and held arrows do not repeat',()=>{
  const {s}=ready();tap(s,'left');tap(s,'up');assert.equal(s.cursor,0);assert.equal(s.blockedActions,2);
  step(s);step(s,{a:true,x:1});assert.equal(s.first,0);assert.equal(s.cursor,0);step(s,{x:1});assert.equal(s.cursor,0);
  step(s);step(s,{x:1});for(let k=0;k<20;k++)step(s,{x:1});assert.equal(s.cursor,1);
  cursor(s,s.visibleFaces.length-1);tap(s,'right');tap(s,'down');assert.equal(s.cursor,s.visibleFaces.length-1);tap(s,'b');assert.equal(s.lastCommand,'none');
});
test('epoch cancellation needs later neutral release before revealing',()=>{
  const {s}=ready();step(s,{cancelEpoch:0});step(s,{a:true,cancelEpoch:1});assert.equal(s.inputArmed,false);assert.equal(s.flips,0);
  step(s,{a:true,cancelEpoch:1});assert.equal(s.flips,0);step(s,{cancelEpoch:1});step(s,{a:true,cancelEpoch:1});assert.equal(s.flips,1);
});
test('invalid dt and malformed descriptors cannot leak or reveal hidden cards',()=>{
  const {s}=ready(),before=copy(s);let reads=0;const input={};Object.defineProperty(input,'a',{get(){reads++;return true;}});
  for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,input);assert.deepEqual(s,before);assert.equal(reads,0);
  step(s,input);assert.equal(reads,0);step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));
  for(const v of [null,[],true,17,'a',{a:1,x:Infinity}])step(s,v);assert.equal(s.flips,0);assert.ok(s.visibleFaces.every(v=>v===null));step(s,{a:true});assert.equal(s.flips,1);
});
test('synthetic informational saturation is bounded without revealing or ending play',()=>{
  const {s}=ready();s.calls=M.config.maxCounter;s.elapsed=M.config.maxElapsed;step(s,{},.25);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');assert.ok(s.visibleFaces.every(v=>v===null));
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,physicalTvTested:false,physicalPhoneTested:false},null,2));
