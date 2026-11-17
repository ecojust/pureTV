'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x)),sum=a=>a.reduce((x,y)=>x+y,0);
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){return M.step(s,dt,i);}
function fresh(level=0){const s=M.create(770,level);step(s);return s;}
function press(s,i){step(s);step(s,i);}
function select(s,p){for(let n=0;s.selected!==p;n++){assert.ok(n<6);press(s,{x:1});}}
function sow(s,p){select(s,p);press(s,{a:true});}
// Explicit synthetic positions target narrow rule boundaries; ordinary routes use unchanged create().
function fixture(entries){const s=fresh();s.pits.fill(0);for(const [p,n]of Object.entries(entries))s.pits[p]=n;assert.equal(sum(s.pits),24);step(s);return s;}
// Found by independent scratch search before implementation; never shipped in APK assets.
const winning=[[0,0,1,3,4],[1,1,3,0,1],[1,3,4,2,0,3]],losing=[[2,3,4,5],[1,3,4,5],[3,4,5]];
test('public interface,24-seed authored starts and isolated immutable config',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);M.config.layouts.forEach(l=>{assert.equal(l.pits.length,14);assert.equal(sum(l.pits),24);assert.ok(l.pits[6]>0&&l.pits[13]>0);assert.ok(Object.isFrozen(l.pits));});
 const a=M.create(-1,-1),b=M.create(770,0);assert.equal(a.seed,770);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.pits[0]=99;assert.equal(b.pits[0],2);assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('770','2').level,0);assert.throws(()=>M.config.layouts[0].pits[0]=2,TypeError);
});
test('all three normal positions win through ordinary inputs with seed conservation each round',()=>{
 winning.forEach((route,level)=>{const s=fresh(level);for(const p of route){const before=s.sowCount,ps=s.playerStore,es=s.aiStore;sow(s,p);assert.equal(sum(s.pits),24);assert.ok(s.pits.every(n=>Number.isInteger(n)&&n>=0));assert.ok(s.playerStore>=ps&&s.aiStore>=es);assert.equal(s.sowCount,before+1+s.aiBurstCount);assert.equal(s.sowCount,s.playerSows+s.aiSows);
  for(const r of [s.lastPlayerSow,...s.lastAiSows]){assert.equal(r.path.length,r.seeds);assert.ok(!r.path.includes(r.side==='player'?13:6));assert.equal(r.storesAfter.length,2);}if(s.lastPlayerSow.extraTurn&&s.phase==='playing')assert.equal(s.aiBurstCount,0);
 }assert.equal(s.phase,'won');assert.equal(s.reason,'majority');assert.equal(s.playerSows,route.length);assert.ok(s.playerSows>=4);assert.equal(sum(s.pits.slice(0,6)),0);assert.equal(sum(s.pits.slice(7,13)),0);assert.equal(s.playerStore+s.aiStore,24);assert.equal(s.score,100);assert.notEqual(s.lastSow,s.lastPlayerSow);assert.notEqual(s.terminalReceipt.pits,s.pits);assert.notEqual(s.terminalReceipt.lastPlayerSow.path,s.lastPlayerSow.path);
 const before=copy(s);step(s,{a:true,x:1,cancelEpoch:999});assert.deepEqual(s,before);});
});
test('all three natural poor lines lose to the opponent majority without state injection',()=>{
 losing.forEach((route,level)=>{const s=fresh(level);route.forEach(p=>sow(s,p));assert.equal(s.phase,'lost');assert.equal(s.reason,'minority');assert.ok(s.aiStore>s.playerStore);assert.equal(s.playerStore+s.aiStore,24);assert.equal(s.playerSows,route.length);});
});
test('wrapped sow skips rival store, revisits the source and can enter own store twice',()=>{
 const s=fixture({0:1,5:14,6:4,7:1,13:4});sow(s,5);assert.equal(s.phase,'playing');assert.deepEqual(s.lastPlayerSow.path,[6,7,8,9,10,11,12,0,1,2,3,4,5,6]);assert.equal(s.lastPlayerSow.storeGain,2);assert.equal(s.lastPlayerSow.extraTurn,true);assert.equal(s.aiSows,0);assert.equal(s.aiStore,4);assert.equal(s.pits[5],1);assert.equal(sum(s.pits),24);
});
test('last seed in own store grants human extra turn and entirely suppresses AI',()=>{
 const s=fresh(),opponent=s.pits.slice(7);sow(s,5);assert.equal(s.lastPlayerSow.extraTurn,true);assert.equal(s.playerExtraTurns,1);assert.equal(s.playerSows,1);assert.equal(s.aiSows,0);assert.equal(s.lastAiSows.length,0);assert.deepEqual(s.pits.slice(7),opponent);assert.equal(s.lastPlayerSow.last,6);
});
test('empty own landing captures itself and the nonempty opposite',()=>{
 const s=fixture({0:1,1:1,6:8,7:1,10:4,13:9});sow(s,1);assert.equal(s.lastPlayerSow.last,2);assert.equal(s.lastPlayerSow.opposite,10);assert.equal(s.lastPlayerSow.captured,5);assert.equal(s.lastPlayerSow.storeGain,5);assert.equal(s.playerCaptured,5);assert.equal(s.pits[2],0);assert.equal(s.pits[10],0);assert.equal(sum(s.pits),24);
});
test('empty opposite never captures the final seed by itself',()=>{
 const s=fixture({0:1,1:1,6:8,7:5,13:9});sow(s,1);assert.equal(s.lastPlayerSow.last,2);assert.equal(s.lastPlayerSow.captured,0);assert.equal(s.lastPlayerSow.opposite,null);assert.equal(s.lastPlayerSow.storeGain,0);assert.equal(s.pits[2],1);assert.equal(sum(s.pits),24);
});
test('side exhaustion sweeps both owners and terminal ties do not grant another turn',()=>{
 for(const [ps,es,reason]of [[12,10,'majority'],[11,11,'tie'],[10,12,'minority']]){const s=fixture({5:1,6:ps,7:1,13:es});sow(s,5);assert.equal(s.reason,reason);assert.equal(s.phase,reason==='majority'?'won':'lost');assert.equal(s.playerStore,ps+1);assert.equal(s.aiStore,es+1);assert.deepEqual(s.lastPlayerSow.swept,{player:0,opponent:1});assert.equal(s.lastPlayerSow.extraTurn,false);assert.equal(s.aiSows,0);assert.equal(s.playerStore+s.aiStore,24);}
});
test('AI prefers extra turn over immediate capture, then completes its whole burst',()=>{
 const s=fixture({0:1,4:4,6:8,7:1,12:1,13:9});sow(s,0);assert.equal(s.lastAiSows[0].from,12);assert.equal(s.lastAiSows[0].extraTurn,true);assert.equal(s.lastAiSows[0].captured,0);assert.equal(s.lastAiSows[1].from,7);assert.equal(s.lastAiSows[1].captured,5);assert.equal(s.lastAiSows[1].opposite,4);assert.equal(s.aiBurstCount,2);assert.equal(s.aiExtraTurns,1);assert.equal(s.aiCaptured,5);assert.equal(s.phase,'lost');assert.equal(sum(s.pits),24);
});
test('AI capture count, store gain and pit index resolve the remaining comparator keys',()=>{
 const capture=fixture({0:1,2:2,4:4,6:7,7:1,9:1,13:8});sow(capture,0);assert.equal(capture.lastAiSows[0].from,7);assert.equal(capture.lastAiSows[0].captured,5);
 const gain=fixture({1:1,3:1,6:8,7:1,11:3,13:10});sow(gain,1);assert.equal(gain.lastAiSows[0].from,11);assert.equal(gain.lastAiSows[0].captured,0);assert.equal(gain.lastAiSows[0].storeGain,1);
 const tie=fixture({0:1,5:1,6:10,7:1,9:1,13:10});sow(tie,0);assert.equal(tie.lastAiSows[0].from,7);assert.equal(tie.lastAiSows[0].captured,0);assert.equal(tie.lastAiSows[0].storeGain,0);
});
test('empty pit does not sow, spend or erase the last public trace',()=>{
 const s=fresh();sow(s,5);const before={pits:s.pits.slice(),count:s.sowCount,trace:copy(s.lastSow),human:copy(s.lastPlayerSow)};sow(s,5);assert.equal(s.events[0].reason,'empty-pit');assert.deepEqual(s.pits,before.pits);assert.equal(s.sowCount,before.count);assert.deepEqual(s.lastSow,before.trace);assert.deepEqual(s.lastPlayerSow,before.human);
});
test('global sow cap stops human extras and AI bursts but natural finishing result wins first',()=>{
 const s=fresh();s.sowCount=159;sow(s,5);assert.equal(s.sowCount,160);assert.equal(s.phase,'lost');assert.equal(s.reason,'sow-limit');assert.equal(s.aiSows,0);assert.equal(s.lastPlayerSow.extraTurn,true);assert.ok(sum(s.pits.slice(0,6))>0);
 const t=fixture({0:1,4:4,6:8,7:1,12:1,13:9});t.sowCount=158;sow(t,0);assert.equal(t.sowCount,160);assert.equal(t.reason,'sow-limit');assert.equal(t.aiBurstCount,1);assert.equal(t.pits[7],1);assert.equal(t.lastAiSows[0].extraTurn,true);
 const u=fixture({5:1,6:12,7:1,13:10});u.sowCount=159;sow(u,5);assert.equal(u.phase,'won');assert.equal(u.reason,'majority');assert.equal(u.sowCount,160);
});
test('selection wraps, vertical/B inputs do nothing, held navigation and A never repeat',()=>{
 const s=fresh();press(s,{x:-1});assert.equal(s.selected,5);press(s,{x:1});assert.equal(s.selected,0);for(let k=0;k<8;k++)step(s,{x:1});assert.equal(s.selected,0);press(s,{y:1});press(s,{b:true});assert.equal(s.selected,0);assert.equal(s.sowCount,0);
 step(s);step(s,{a:true,x:1});assert.equal(s.selected,0);assert.equal(s.playerSows,1);const count=s.sowCount;for(let k=0;k<8;k++)step(s,{a:true,x:1});assert.equal(s.sowCount,count);step(s,{x:1});assert.equal(s.selected,0);
});
test('initial release and cancellation quarantine require neutral before another sow',()=>{
 const s=M.create(770,0);step(s,{a:true});assert.equal(s.sowCount,0);step(s,{cancelEpoch:0});step(s,{a:true,cancelEpoch:1});assert.equal(s.sowCount,0);assert.equal(s.inputArmed,false);step(s,{a:true,cancelEpoch:1});assert.equal(s.sowCount,0);step(s,{cancelEpoch:1});step(s,{a:true,cancelEpoch:1});assert.equal(s.playerSows,1);
 const count=s.sowCount;step(s,{a:true,cancelled:true});step(s,{a:true});assert.equal(s.sowCount,count);step(s);step(s,{a:true});assert.equal(s.playerSows,2);
});
test('invalid dt/pause are exact no-ops and hostile descriptors cannot inject sowing',()=>{
 const s=fresh(),before=copy(s);let reads=0;const i={};Object.defineProperty(i,'a',{get(){reads++;return true;}});for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,i);assert.deepEqual(s,before);assert.equal(reads,0);step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);
 step(s,i);step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('no partial action');return Object.getOwnPropertyDescriptor(t,k);}}));for(const v of [null,[],true,17,'a',{a:1,x:Infinity}])step(s,v);assert.equal(s.sowCount,0);assert.equal(reads,0);step(s,{a:true});assert.equal(s.playerSows,1);
});
test('diagnostics saturate without a time deadline, and lost terminal state freezes',()=>{
 const s=fresh();s.elapsed=M.config.maxElapsed-.1;s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;select(s,1);press(s,{a:true});assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);step(s,{},.25);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
 const t=fresh();t.sowCount=159;sow(t,5);const before=copy(t);step(t,{a:true,x:-1,cancelled:true});assert.deepEqual(t,before);
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,ordinaryWinningHumanSows:[5,5,6],ordinaryLosingHumanSows:[4,4,3],physicalTvTested:false,physicalPhoneTested:false},null,2));
