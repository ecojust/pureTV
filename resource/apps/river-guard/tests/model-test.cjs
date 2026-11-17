'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x));
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){return M.step(s,dt,i);}
function fresh(level=0){const s=M.create(773,level);step(s);return s;}
function press(s,i){step(s);step(s,i);}
function select(s,p){for(let n=0;s.selected!==p;n++){assert.ok(n<5);press(s,{x:1});}}
function toggle(s,p){select(s,p);press(s,{a:true});}
function cross(s,cargo){assert.equal(s.cargo.length,0);cargo.forEach(p=>toggle(s,p));press(s,{b:true});}
// Found by an independent graph BFS before implementation; no routes are bundled in assets.
const routes=[[[1],[],[0],[1],[2],[],[1]],[[0],[],[1,2],[0],[0,3]],[[1,3],[],[0],[1],[2,4],[3],[1,3]]];
function safe(s){for(let bank=0;bank<2;bank++)if(bank!==s.farmer)for(const [a,b]of s.conflicts)assert.ok(!(s.sides[a]===bank&&s.sides[b]===bank));}
test('public API, three graph sizes, cargo capacity and isolated frozen configuration',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.layouts.map(l=>[l.items.length,l.capacity,l.crossingLimit]),[[3,1,12],[4,2,14],[5,2,18]]);
 const a=M.create(-1,-1),b=M.create(773,0);assert.equal(a.seed,773);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.sides[0]=1;a.conflicts[0][0]=2;a.items[0].name='CHANGED';assert.equal(b.sides[0],0);assert.equal(b.conflicts[0][0],0);assert.equal(b.items[0].name,'FOX');assert.equal(M.config.layouts[0].items[0].name,'FOX');assert.throws(()=>M.config.layouts[0].conflicts[0][0]=9,TypeError);assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('1','2').level,0);
});
test('all three unchanged positions win with ordinary input and exact cargo conservation',()=>{
 routes.forEach((route,level)=>{const s=fresh(level),n=s.items.length;route.forEach((cargo,index)=>{const from=s.farmer,before=s.sides.slice();cross(s,cargo);assert.equal(s.crossingsUsed,index+1);assert.equal(s.farmer,1-from);assert.deepEqual(s.lastCrossing.cargo,cargo);assert.equal(s.lastCrossing.unattended,from);assert.equal(s.cargo.length,0);assert.equal(s.sides.length,n);assert.ok(s.sides.every(v=>v===0||v===1));assert.equal(s.bankCounts[0]+s.bankCounts[1],n);
  for(let p=0;p<n;p++)assert.equal(s.sides[p],cargo.includes(p)?1-from:before[p]);safe(s);assert.equal(s.dangerPairs.length,0);
 });assert.equal(s.phase,'won');assert.equal(s.reason,'delivered');assert.equal(s.farmer,1);assert.equal(s.deliveredCount,n);assert.equal(s.score,100);assert.notEqual(s.terminalReceipt.sides,s.sides);assert.notEqual(s.terminalReceipt.lastCrossing.cargo,s.lastCrossing.cargo);
 const before=copy(s);step(s,{a:true,b:true,x:1,cancelEpoch:999});assert.deepEqual(s,before);});
});
test('loading/unloading is a plan only and capacity counts cargo apart from farmer',()=>{
 const s=fresh(1),sides=s.sides.slice();toggle(s,0);toggle(s,1);assert.deepEqual(s.cargo,[0,1]);assert.deepEqual(s.sides,sides);assert.equal(s.crossingsUsed,0);toggle(s,2);assert.equal(s.events[0].reason,'capacity');assert.deepEqual(s.cargo,[0,1]);assert.equal(s.phase,'playing');toggle(s,1);assert.deepEqual(s.cargo,[0]);toggle(s,3);assert.deepEqual(s.cargo,[0,3]);assert.equal(s.crossingsUsed,0);press(s,{b:true});assert.deepEqual(s.sides,[1,0,0,1]);assert.equal(s.farmer,1);assert.equal(s.phase,'playing');
});
test('items on opposite bank cannot be selected or moved',()=>{
 const s=fresh();cross(s,[1]);toggle(s,0);assert.equal(s.events[0].reason,'other-bank');assert.equal(s.cargo.length,0);assert.deepEqual(s.sides,[0,1,0]);assert.equal(s.crossingsUsed,1);toggle(s,1);assert.deepEqual(s.cargo,[1]);toggle(s,1);assert.deepEqual(s.cargo,[]);
});
test('empty return crosses legally and clears cargo even when carrying none',()=>{
 const s=fresh();cross(s,[1]);cross(s,[]);assert.equal(s.phase,'playing');assert.equal(s.farmer,0);assert.equal(s.crossingsUsed,2);assert.deepEqual(s.lastCrossing.cargo,[]);assert.deepEqual(s.sides,[0,1,0]);safe(s);
});
test('farmer presence permits a conflict pair on the supervised destination bank',()=>{
 const s=fresh();cross(s,[1]);cross(s,[]);cross(s,[0]);assert.equal(s.farmer,1);assert.deepEqual(s.sides,[1,1,0]);assert.equal(s.phase,'playing');assert.equal(s.dangerPairs.length,0);assert.ok(s.conflicts.some(([a,b])=>s.sides[a]===1&&s.sides[b]===1));safe(s);
});
test('departing without the required cargo causes a natural unattended-bank loss',()=>{
 const s=fresh();cross(s,[]);assert.equal(s.phase,'lost');assert.equal(s.reason,'danger');assert.deepEqual(s.dangerPairs,[[0,1],[1,2]]);assert.equal(s.farmer,1);assert.equal(s.crossingsUsed,1);assert.deepEqual(s.lastCrossing.unsafePairs,s.dangerPairs);assert.notEqual(s.lastCrossing.unsafePairs,s.dangerPairs);
 const t=fresh();cross(t,[0]);assert.equal(t.phase,'lost');assert.deepEqual(t.dangerPairs,[[1,2]]);assert.deepEqual(t.sides,[1,0,0]);assert.equal(t.cargo.length,0);
});
test('return departure also checks the far bank and cannot abandon a supervised pair',()=>{
 const s=fresh();cross(s,[1]);cross(s,[]);cross(s,[0]);cross(s,[]);assert.equal(s.phase,'lost');assert.equal(s.reason,'danger');assert.equal(s.lastCrossing.unattended,1);assert.deepEqual(s.dangerPairs,[[0,1]]);assert.equal(s.farmer,0);
});
test('all three normal levels can safely exhaust the exact even budget by empty travel',()=>{
 routes.forEach((route,level)=>{const s=fresh(level);cross(s,route[0]);while(s.phase==='playing')cross(s,[]);assert.equal(s.reason,'crossings');assert.equal(s.crossingsUsed,s.crossingLimit);assert.equal(s.crossingsUsed,[12,14,18][level]);assert.equal(s.dangerPairs.length,0);assert.equal(s.farmer,0);assert.ok(s.deliveredCount<s.items.length);safe(s);});
});
test('synthetic last-budget successful crossing wins; danger still precedes budget',()=>{
 // Normal budgets are even but final destination needs odd parity; only counters are synthetic here.
 const s=fresh();routes[0].slice(0,-1).forEach(c=>cross(s,c));s.crossingsUsed=s.crossingLimit-1;cross(s,routes[0].at(-1));assert.equal(s.crossingsUsed,12);assert.equal(s.phase,'won');assert.equal(s.reason,'delivered');
 const t=fresh();t.crossingsUsed=t.crossingLimit-1;cross(t,[]);assert.equal(t.crossingsUsed,12);assert.equal(t.reason,'danger');
});
test('all items without the farmer on the goal bank do not satisfy the win predicate',()=>{
 const s=fresh();s.sides=[1,1,1];s.farmer=1;s.crossingsUsed=7;cross(s,[]);assert.equal(s.phase,'lost');assert.equal(s.reason,'danger');assert.equal(s.farmer,0);assert.equal(s.deliveredCount,3);
});
test('roster navigation wraps, vertical wins diagonal ties, held keys do not repeat',()=>{
 const s=fresh();press(s,{x:-1});assert.equal(s.selected,2);press(s,{y:1});assert.equal(s.selected,0);press(s,{x:1,y:-1});assert.equal(s.selected,2);for(let k=0;k<8;k++)step(s,{x:1,y:-1});assert.equal(s.selected,2);press(s,{a:true});assert.deepEqual(s.cargo,[2]);for(let k=0;k<8;k++)step(s,{a:true});assert.deepEqual(s.cargo,[2]);assert.equal(s.crossingsUsed,0);
});
test('B over A over direction consumes simultaneous edges without deferred cargo changes',()=>{
 const s=fresh();toggle(s,1);select(s,0);step(s);step(s,{b:true,a:true,x:1});assert.equal(s.lastCommand,'b');assert.deepEqual(s.lastCrossing.cargo,[1]);assert.equal(s.selected,0);assert.equal(s.crossingsUsed,1);assert.equal(s.cargo.length,0);step(s,{a:true,x:1});assert.equal(s.cargo.length,0);assert.equal(s.selected,0);
 step(s);step(s,{a:true,x:1});assert.equal(s.events[0].reason,'other-bank');assert.equal(s.selected,0);assert.equal(s.crossingsUsed,1);
});
test('initial neutral, epoch changes and cancelled edges gate inputs while preserving cargo',()=>{
 const s=M.create(773,0);step(s,{b:true});assert.equal(s.crossingsUsed,0);step(s,{cancelEpoch:0});toggle(s,1);assert.deepEqual(s.cargo,[1]);step(s,{b:true,cancelEpoch:1});assert.equal(s.crossingsUsed,0);assert.equal(s.inputArmed,false);assert.deepEqual(s.cargo,[1]);step(s,{b:true,cancelEpoch:1});assert.equal(s.crossingsUsed,0);step(s,{cancelEpoch:1});step(s,{b:true,cancelEpoch:1});assert.equal(s.crossingsUsed,1);
 step(s,{b:true,cancelled:true});step(s,{b:true});assert.equal(s.crossingsUsed,1);step(s);step(s,{b:true});assert.equal(s.crossingsUsed,2);
});
test('invalid dt, pause and hostile descriptors cannot partially cross or load',()=>{
 const s=fresh(),before=copy(s);let reads=0;const i={};Object.defineProperty(i,'b',{get(){reads++;return true;}});for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,i);assert.deepEqual(s,before);assert.equal(reads,0);step(s,{paused:true,b:true},.25);assert.deepEqual(s,before);
 step(s,i);step(s,Object.create({b:true}));step(s,new Proxy({b:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));for(const v of [null,[],true,17,'b',{a:1,x:Infinity}])step(s,v);assert.equal(s.crossingsUsed,0);assert.equal(s.cargo.length,0);assert.equal(reads,0);step(s,{a:true});assert.deepEqual(s.cargo,[0]);
});
test('saturating diagnostics add no time deadline and failed terminal freezes',()=>{
 const s=fresh();s.elapsed=M.config.maxElapsed-.1;s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;toggle(s,0);toggle(s,1);step(s,{},.25);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
 const t=fresh();cross(t,[]);const before=copy(t);step(t,{a:true,b:true,x:1,cancelled:true});assert.deepEqual(t,before);
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,ordinaryWinningCrossings:[7,5,7],ordinaryBudgetLosses:[12,14,18],lastBudgetWin:'Explicit synthetic counter fixture because the requested even budgets cannot naturally end with farmer on the right bank.',physicalTvTested:false,physicalPhoneTested:false},null,2));
