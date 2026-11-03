'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js'),{route}=require('./route-search.cjs');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x));
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=.0001){return M.step(s,dt,i);}
function fresh(level=0){const s=M.create(763,level);step(s);return s;}
function input(dir){return {x:dir==='right'?1:dir==='left'?-1:0,y:dir==='down'?1:dir==='up'?-1:0};}
function command(s,dir){step(s);step(s,input(dir));}
function tick(s){const before=s.moves;while(s.moves===before&&s.phase==='playing')step(s,{},Math.min(.25,Math.max(.000001,s.interval-s.moveClock+s.brakeRemaining)));}
function integrity(s){assert.equal(s.body.length,3+s.eaten);assert.equal(new Set(s.body).size,s.body.length);assert.ok(s.body.every(p=>p>=0&&p<96&&!s.walls[p]));
  for(let i=1;i<s.body.length;i++){const a=s.body[i-1],b=s.body[i];assert.equal(Math.abs(a%12-b%12)+Math.abs(Math.floor(a/12)-Math.floor(b/12)),1);}
  if(s.food!==null){assert.equal(s.body.includes(s.food),false);assert.equal(s.walls[s.food],false);}}
test('authored maps, finite normalized state and independent immutable configuration',()=>{
  assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.layouts.map(l=>[l.goalFruit,l.interval,l.walls.filter(Boolean).length]),[[5,.35,4],[7,.30,8],[9,.26,10]]);
  const a=M.create(-1,-1),b=M.create(763,0);assert.equal(a.seed,763);assert.equal(a.level,0);assert.deepEqual(a.body,[38,37,36]);assert.equal(a.inputArmed,false);assert.equal(a.brakes,3);integrity(a);
  a.body[0]=99;a.walls[0]=true;assert.equal(b.body[0],38);assert.equal(b.walls[0],false);assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('1','1').level,0);
  assert.throws(()=>M.config.initialBody.push(1),TypeError);assert.throws(()=>M.config.layouts[0].walls[0]=true,TypeError);
});
test('ordinary public-body route search wins all three orchards with valid growth and free fruit',()=>{
  for(let level=0;level<3;level++){const s=fresh(level);while(s.phase==='playing'){integrity(s);const plan=route(s),eaten=s.eaten;
    for(const dir of plan.directions){command(s,dir);tick(s);integrity(s);if(s.phase!=='playing')break;}assert.equal(s.eaten,eaten+1);}
    assert.equal(s.phase,'won');assert.equal(s.eaten,s.goalFruit);assert.equal(s.score,100);assert.equal(s.food,null);assert.equal(s.brakes,3);assert.equal(s.terminalReceipt.cause,'success');assert.notEqual(s.terminalReceipt.body,s.body);
    const before=copy(s);step(s,{a:true,x:-1},.25);assert.deepEqual(s,before);
  }
});
test('same seed and input route reproduce food placements deterministically',()=>{
  const a=fresh(1),b=fresh(1);assert.equal(a.food,b.food);for(const dir of route(a).directions){command(a,dir);tick(a);command(b,dir);tick(b);assert.equal(a.food,b.food);assert.deepEqual(a.body,b.body);}
  assert.equal(a.eaten,1);assert.equal(a.foodSerial,2);
});
test('reverse forbidden; exactly one perpendicular turn can queue until movement applies it',()=>{
  const s=fresh();command(s,'right');assert.equal(s.events[0].reason,'same-direction');assert.equal(s.queuedDirection,null);
  command(s,'left');assert.equal(s.events[0].reason,'reverse');assert.equal(s.queuedDirection,null);command(s,'up');assert.equal(s.queuedDirection,'up');
  command(s,'left');assert.equal(s.events[0].reason,'turn-queued');assert.equal(s.queuedDirection,'up');tick(s);assert.equal(s.direction,'up');assert.equal(s.body[0],26);assert.equal(s.queuedDirection,null);
  command(s,'left');tick(s);assert.equal(s.direction,'left');assert.equal(s.body[0],25);integrity(s);
});
test('synthetic vacating tail entry is legal when not growing, growth into tail is collision',()=>{
  for(const grows of [false,true]){const s=fresh();s.body=[39,51,50,38];s.eaten=1;s.direction='up';s.food=grows?38:0;
    command(s,'left');tick(s);if(grows){assert.equal(s.phase,'lost');assert.equal(s.reason,'body');assert.deepEqual(s.body,[39,51,50,38]);}
    else{assert.equal(s.phase,'playing');assert.deepEqual(s.body,[38,39,51,50]);integrity(s);}}
});
test('synthetic non-tail body collision preserves body and counts no safe move',()=>{
  const s=fresh();s.body=[39,51,50,38,26];s.eaten=2;s.direction='up';s.food=0;command(s,'left');const before=s.body.slice();tick(s);
  assert.equal(s.phase,'lost');assert.equal(s.reason,'body');assert.deepEqual(s.body,before);assert.equal(s.moves,0);assert.equal(s.terminalReceipt.cause,'body');
});
test('ordinary unsteered play hits boundary and terminal input cannot rescue it',()=>{
  const s=fresh();while(s.phase==='playing')step(s,{},.25);assert.equal(s.phase,'lost');assert.equal(s.reason,'wall');assert.equal(s.body[0]%12,11);assert.equal(s.score,0);
  const before=copy(s);step(s,{a:true,y:-1},.25);assert.deepEqual(s,before);
});
test('neutral dt partition preserves movement, body, food and partial interval',()=>{
  const a=M.create(763,0),b=M.create(763,0);for(let i=0;i<10;i++)step(a,{},.2);for(let i=0;i<20;i++)step(b,{},.1);
  for(const key of ['body','direction','queuedDirection','food','foodSerial','eaten','moves','phase'])assert.deepEqual(a[key],b[key]);assert.ok(Math.abs(a.moveClock-b.moveClock)<1e-9);assert.ok(Math.abs(a.elapsed-b.elapsed)<1e-9);
});
test('brake preserves partial movement progress, consumes active time, and cannot refill or retrigger',()=>{
  const s=M.create(763,0);step(s,{},.1);step(s,{a:true},.1);assert.equal(s.brakes,2);assert.ok(Math.abs(s.moveClock-.1)<1e-10);assert.ok(Math.abs(s.brakeRemaining-.5)<1e-10);
  step(s,{a:true},.2);step(s,{},.1);step(s,{a:true},.1);assert.equal(s.events[0].reason,'braking');assert.equal(s.brakes,2);assert.equal(s.moves,0);step(s,{},.1);assert.equal(s.brakeRemaining,0);
  assert.ok(Math.abs(s.moveClock-.1)<1e-9);step(s,{},.25);assert.equal(s.moves,1);assert.ok(s.elapsed>.9);
  for(let token=0;token<2;token++){step(s);step(s,{a:true});while(s.brakeRemaining>0)step(s,{},Math.min(.25,s.brakeRemaining));}
  assert.equal(s.brakes,0);assert.equal(s.brakesUsed,3);step(s);step(s,{a:true});assert.equal(s.events[0].reason,'no-brakes');assert.equal(s.brakes,0);
});
test('brake integration is partition-invariant across its end boundary',()=>{
  const a=M.create(763,0),b=M.create(763,0);step(a,{},.1);step(b,{},.1);step(a,{a:true},.2);step(b,{a:true},.1);step(b,{a:true},.1);
  for(let i=0;i<4;i++)step(a,{},.2);for(let i=0;i<8;i++)step(b,{},.1);assert.deepEqual(a.body,b.body);assert.equal(a.moves,b.moves);assert.equal(a.brakes,b.brakes);assert.equal(a.brakeRemaining,b.brakeRemaining);assert.ok(Math.abs(a.moveClock-b.moveClock)<1e-9);
});
test('pause freezes all clocks; cancellation clears pending turn while movement and brake continue',()=>{
  const s=fresh();step(s,{cancelEpoch:0});command(s,'up');assert.equal(s.queuedDirection,'up');const before=copy(s);step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);
  step(s,{cancelEpoch:1},.1);assert.equal(s.queuedDirection,null);assert.equal(s.inputArmed,false);tick(s);assert.equal(s.direction,'right');assert.equal(s.body[0],39);
  step(s);step(s,{a:true});const remaining=s.brakeRemaining;step(s,{cancelled:true},.1);assert.ok(s.brakeRemaining<remaining);assert.equal(s.inputArmed,false);
});
test('initial neutral arming, A priority, held inputs and malformed dt prevent ghost commands',()=>{
  const s=M.create(763,0);step(s,{a:true});assert.equal(s.brakes,3);step(s);step(s,{a:true,y:-1});assert.equal(s.brakes,2);assert.equal(s.queuedDirection,null);
  step(s,{y:-1});assert.equal(s.queuedDirection,null);step(s);step(s,{y:-1});assert.equal(s.queuedDirection,'up');const queued=s.turnsQueued;for(let i=0;i<10;i++)step(s,{y:-1});assert.equal(s.turnsQueued,queued);
  const before=copy(s);let reads=0;const bad={};Object.defineProperty(bad,'a',{get(){reads++;return true;}});for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,bad);assert.deepEqual(s,before);assert.equal(reads,0);
  step(s,bad);assert.equal(reads,0);step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));assert.equal(s.brakes,2);
});
test('synthetic informational saturation stays finite without affecting game quota',()=>{
  const s=fresh();s.calls=M.config.maxCounter;s.elapsed=M.config.maxElapsed;step(s);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,physicalTvTested:false,physicalPhoneTested:false},null,2));
