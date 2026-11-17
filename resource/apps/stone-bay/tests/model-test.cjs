'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x));
function test(name,fn){fn();groups.push(name);}
function step(s,input={},dt=1/60){return M.step(s,dt,input);}
function fresh(level=0){const s=M.create(752,level);step(s);return s;}
function tap(s,key){step(s);step(s,{a:key==='a',b:key==='b',x:key==='right'?1:key==='left'?-1:0,y:key==='down'?1:key==='up'?-1:0});}
const routes=[['up','up','down','down','right','right','up','up','left','left','down','left','up'],
  ['left','left','up','up','up','left','up','right','down','down','down','down','right','right','up','up','left','right','down','down','left','left','up','left','up','up','right','down','right','right','down','right','up','right','up','left'],
  ['up','right','up','up','down','down','left','left','up','right','down','right','up','left','left','up','up','right','right','left','left','down','down','right','right','right','left','left','left','up','up','right','right','right','down','down','left','up','right','right','down']];
function integrity(s){assert.equal(new Set(s.crates).size,s.crates.length);assert.equal(s.crates.includes(s.player),false);assert.equal(s.walls[s.player],false);assert.ok(s.crates.every(p=>!s.walls[p]));assert.equal(s.matched,s.targets.filter(p=>s.crates.includes(p)).length);}
function firstPushAndUndo(s){const before=s.pushCount;for(const d of routes[s.level]){tap(s,d);if(s.pushCount>before)break;}if(s.phase==='playing')while(s.history.length)tap(s,'a');}
test('fixed authored boards and normalized immutable independent state',()=>{
  assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.layouts.map(l=>[l.width,l.height,l.crates.length,l.pushLimit]),[[7,6,2,8],[8,7,3,11],[8,7,3,13]]);
  for(const l of M.config.layouts){assert.equal(l.targets.length,l.crates.length);assert.ok(l.rows.every(r=>r.length===l.width));assert.ok(l.crates.every(p=>!l.targets.includes(p)));}
  const a=M.create(-1,-1),b=M.create(752,0);assert.equal(a.seed,752);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.crates[0]=0;a.walls[0]=false;
  assert.notEqual(b.crates[0],0);assert.equal(b.walls[0],true);assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('2','2').level,0);
  assert.throws(()=>M.config.layouts[0].crates[0]=0,TypeError);assert.throws(()=>M.config.layouts[0].pushLimit=99,TypeError);
});
test('ordinary complete wins with conservation and exact final-charge wins on every board',()=>{
  for(let level=0;level<3;level++)for(const padded of [false,true]){
    const s=fresh(level);if(padded)for(let k=0;k<4;k++)firstPushAndUndo(s);
    for(const d of routes[level]){tap(s,d);integrity(s);}
    assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.matched,s.crates.length);assert.equal(s.pushCount,[4,7,9][level]+(padded?4:0));
    if(padded)assert.equal(s.pushCount,s.pushLimit);assert.equal(s.terminalReceipt.cause,'success');assert.notEqual(s.terminalReceipt.crates,s.crates);
    const saved=copy(s);step(s,{a:true,x:1,y:1});assert.deepEqual(s,saved);
  }
});
test('wall, chain and wall-behind-crate blocking are free; stepping away cannot pull',()=>{
  const s=fresh();tap(s,'down');assert.equal(s.events[0].reason,'wall');assert.equal(s.steps,0);assert.equal(s.pushCount,0);
  tap(s,'up');const boxes=s.crates.slice();tap(s,'down');assert.deepEqual(s.crates,boxes);assert.equal(s.pushCount,0);
  for(const d of ['right','right','up','up','left'])tap(s,d);assert.equal(s.events[0].reason,'crate-chain');assert.equal(s.pushCount,0);
  const t=fresh();tap(t,'up');tap(t,'up');assert.equal(t.pushCount,1);const pos=t.player;tap(t,'up');assert.equal(t.events[0].reason,'crate-wall');assert.equal(t.pushCount,1);assert.equal(t.player,pos);
});
test('undo restores walks and pushes with stable crate identity but never refunds spent effort',()=>{
  const s=fresh(),initial=copy(s);tap(s,'up');const middle=copy(s);tap(s,'up');assert.equal(s.pushCount,1);assert.notDeepEqual(s.crates,initial.crates);
  assert.notEqual(s.history[0].crates,s.history[1].crates);tap(s,'a');assert.equal(s.player,middle.player);assert.deepEqual(s.crates,middle.crates);assert.equal(s.pushCount,1);assert.equal(s.steps,2);
  tap(s,'a');assert.equal(s.player,initial.player);assert.deepEqual(s.crates,initial.crates);assert.equal(s.facing,'down');assert.equal(s.pushCount,1);assert.equal(s.undos,2);
  tap(s,'a');assert.equal(s.events[0].reason,'no-history');assert.equal(s.undos,2);integrity(s);
});
test('ordinary exhausted push is applied then loses; terminal undo cannot recover',()=>{
  const s=fresh();for(let k=0;k<7;k++){firstPushAndUndo(s);assert.equal(s.phase,'playing');}assert.equal(s.pushCount,7);
  tap(s,'up');tap(s,'up');assert.equal(s.phase,'lost');assert.equal(s.reason,'pushes');assert.equal(s.pushCount,8);assert.equal(s.matched,1);assert.equal(s.score,0);integrity(s);
  const before=copy(s);tap(s,'a');assert.deepEqual(s,before);
});
test('ordinary free-walk loops bound history at128; oldest entries drop and undo retains counters',()=>{
  const s=fresh();for(let k=0;k<65;k++){tap(s,'left');tap(s,'right');}
  assert.equal(s.history.length,128);assert.equal(s.historyDropped,2);assert.equal(s.steps,130);assert.equal(s.pushCount,0);
  for(let k=0;k<128;k++)tap(s,'a');assert.equal(s.history.length,0);assert.equal(s.undos,128);assert.equal(s.steps,130);assert.equal(s.pushCount,0);
  tap(s,'a');assert.equal(s.events[0].reason,'no-history');integrity(s);
});
test('A priority consumes simultaneous direction; held axes and A never repeat; B has no action',()=>{
  const s=fresh(),p=s.player;step(s,{a:true,y:-1});assert.equal(s.events[0].reason,'no-history');assert.equal(s.player,p);
  step(s,{y:-1});assert.equal(s.lastCommand,'none');assert.equal(s.player,p);step(s);step(s,{y:-1});assert.equal(s.steps,1);
  for(let k=0;k<20;k++)step(s,{y:-1});assert.equal(s.steps,1);step(s);step(s,{a:true});assert.equal(s.undos,1);
  for(let k=0;k<20;k++)step(s,{a:true});assert.equal(s.undos,1);tap(s,'b');assert.equal(s.lastCommand,'none');assert.equal(s.player,p);
  step(s);step(s,{x:1,y:-1});assert.equal(s.lastCommand,'up');assert.equal(s.player,p-s.width);
});
test('initial release and cancellation epochs suppress movement until later neutral',()=>{
  const s=M.create(752,0),p=s.player;step(s,{y:-1});assert.equal(s.player,p);step(s,{cancelEpoch:0});assert.equal(s.inputArmed,true);
  step(s,{y:-1,cancelEpoch:1});assert.equal(s.player,p);assert.equal(s.inputArmed,false);step(s,{y:-1,cancelEpoch:1});assert.equal(s.player,p);
  step(s,{cancelEpoch:1});step(s,{y:-1,cancelEpoch:1});assert.equal(s.steps,1);
  step(s,{a:true,cancelled:true});assert.equal(s.undos,0);step(s,{a:true});assert.equal(s.undos,0);step(s);step(s,{a:true});assert.equal(s.undos,1);
});
test('invalid clocks, paused and malformed inputs are safe and do not steal edges',()=>{
  const s=fresh(),before=copy(s);let reads=0;const input={};Object.defineProperty(input,'y',{get(){reads++;return -1;}});
  for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,input);assert.deepEqual(s,before);assert.equal(reads,0);
  step(s,{paused:true,y:-1});assert.deepEqual(s,before);step(s,input);assert.equal(reads,0);assert.equal(s.steps,0);
  step(s,Object.create({y:-1}));assert.equal(s.steps,0);step(s,new Proxy({y:-1},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));assert.equal(s.steps,0);
  for(const v of [null,[],true,17,'up',{y:Infinity,a:1}])step(s,v);assert.equal(s.steps,0);step(s,{y:-1});assert.equal(s.steps,1);
});
test('synthetic informational counter saturation cannot end the game',()=>{
  const s=fresh();s.calls=M.config.maxCounter;s.steps=M.config.maxCounter;s.elapsed=M.config.maxElapsed;tap(s,'left');
  assert.equal(s.calls,M.config.maxCounter);assert.equal(s.steps,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,physicalTvTested:false,physicalPhoneTested:false},null,2));
