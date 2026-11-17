'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x));
function test(name,fn){fn();groups.push(name);}
function step(s,input={},dt=1/60){return M.step(s,dt,input);}
function fresh(level=0){const s=M.create(768,level);step(s);return s;}
function press(s,input){step(s);step(s,input);}
function go(s,to){for(let guard=0;s.cursor!==to;guard++){assert.ok(guard<15,'cursor path must finish');const x=s.cursor%6,y=Math.floor(s.cursor/6),tx=to%6,ty=Math.floor(to/6);press(s,x!==tx?{x:x<tx?1:-1}:{y:y<ty?1:-1});}}
function a(s,to){if(to!==undefined)go(s,to);press(s,{a:true});}
function turn(s,path){a(s,path[0]);for(const p of path.slice(1))a(s,p);}
// Explicit synthetic boundary positions. Ordinary solvability tests below use unchanged create().
function fixture(pm=[],pk=[],em=[],ek=[]){const s=fresh();s.board.fill(0);pm.forEach(p=>s.board[p]=1);pk.forEach(p=>s.board[p]=2);em.forEach(p=>s.board[p]=-1);ek.forEach(p=>s.board[p]=-2);step(s);return s;}
// Independently searched public positions; these test-only routes never enter APK assets.
const wins=[[[30,25],[32,27],[25,18],[27,13],[13,3],[3,17]],
 [[25,20],[20,6],[32,25],[25,15],[15,1],[1,15]],
 [[34,29],[29,15,5],[20,6],[5,10],[6,1],[1,15,29]]];
test('public API, authored legal positions, identity and detached immutable configuration',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.equal(M.config.size,6);
 M.config.layouts.forEach((l,n)=>{assert.equal(l.board.filter(v=>v>0).length,n+3);assert.equal(l.board.filter(v=>v<0).length,n+3);l.board.forEach((v,p)=>{if(v)assert.equal((p%6+Math.floor(p/6))%2,1);});assert.ok(Object.isFrozen(l.board));});
 const a=M.create(-1,-1),b=M.create(768,0);assert.equal(a.seed,768);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.board[30]=0;assert.equal(b.board[30],1);
 assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('1','2').level,0);assert.throws(()=>M.config.layouts[0].board[30]=0,TypeError);
});
test('all three unchanged starting positions win through ordinary cursor and A inputs',()=>{
 wins.forEach((route,level)=>{const s=fresh(level);for(const path of route){turn(s,path);assert.equal(s.playerCaptures,level+3-s.aiPieces);assert.equal(s.aiCaptures,level+3-s.playerPieces);assert.equal(s.halfTurns,s.playerTurns+s.aiTurns);assert.ok(s.board.every(v=>[0,1,2,-1,-2].includes(v)));}
 assert.equal(s.phase,'won');assert.equal(s.reason,'opponent-empty');assert.equal(s.playerTurns,6);assert.equal(s.halfTurns,11);assert.equal(s.score,100);assert.equal(s.aiPieces,0);assert.ok(s.playerCaptures>0);assert.notEqual(s.terminalReceipt.board,s.board);assert.notEqual(s.terminalReceipt.lastPlayerTurn.path,s.lastPlayerTurn.path);
 const before=copy(s);step(s,{a:true,b:true,x:1,cancelEpoch:999});assert.deepEqual(s,before);});
});
test('global mandatory capture blocks another piece and ordinary destinations',()=>{
 const s=fixture([20,34],[],[13,5]);assert.deepEqual(s.forcedPieces,[20]);a(s,34);assert.equal(s.selected,null);assert.equal(s.events[0].reason,'capture-required');a(s,20);assert.deepEqual(s.legalDestinations,[6]);
 const b=s.board.slice();a(s,15);assert.deepEqual(s.board,b);assert.equal(s.events[0].reason,'illegal-destination');turn(s,[20,6]);assert.equal(s.playerCaptures,1);assert.equal(s.board[13],0);assert.deepEqual(s.lastPlayerTurn.path,[20,6]);
});
test('capture chains lock cancellation and source switching, then promote and finish',()=>{
 const s=fixture([29,30],[],[22,10,1]);a(s,29);press(s,{b:true});assert.equal(s.selected,null);a(s,29);a(s,15);assert.equal(s.chainActive,true);assert.equal(s.selected,15);assert.deepEqual(s.legalDestinations,[5]);assert.equal(s.halfTurns,0);
 const b=s.board.slice();press(s,{b:true});assert.equal(s.events[0].reason,'capture-chain');a(s,30);assert.equal(s.events[0].reason,'capture-chain');assert.deepEqual(s.board,b);assert.equal(s.selected,15);a(s,5);
 assert.equal(s.chainActive,false);assert.equal(s.selected,null);assert.equal(s.board[5],2);assert.equal(s.halfTurns,2);assert.deepEqual(s.lastPlayerTurn.path,[29,15,5]);assert.deepEqual(s.lastPlayerTurn.captured,[22,10]);assert.equal(s.lastPlayerTurn.promoted,true);
});
test('promotion ends the turn even when the new king could capture backward',()=>{
 const s=fixture([13,30],[],[8,10,1]);turn(s,[13,3]);assert.equal(s.board[3],2);assert.deepEqual(s.lastPlayerTurn.path,[13,3]);assert.deepEqual(s.lastPlayerTurn.captured,[8]);assert.equal(s.lastPlayerTurn.promoted,true);assert.equal(s.playerCaptures,1);assert.equal(s.aiTurns,1);assert.equal(s.chainActive,false);assert.equal(s.aiPieces,2);
});
test('kings move in both directions but never fly; men move forward only',()=>{
 const king=fixture([30],[15],[1]);a(king,15);assert.deepEqual(king.legalDestinations.slice().sort((a,b)=>a-b),[8,10,20,22]);const b=king.board.slice();a(king,29);assert.equal(king.events[0].reason,'illegal-destination');assert.deepEqual(king.board,b);a(king,20);assert.deepEqual(king.lastPlayerTurn.path,[15,20]);
 const man=fixture([15,30],[],[1]);a(man,15);assert.deepEqual(man.legalDestinations,[8,10]);a(man,20);assert.equal(man.events[0].reason,'illegal-destination');assert.equal(man.playerTurns,0);
});
test('ordinary moves, source switching and B cancellation leave the board intact until commit',()=>{
 const s=fresh(),before=s.board.slice();a(s,30);a(s,32);assert.equal(s.selected,32);assert.deepEqual(s.board,before);assert.equal(s.halfTurns,0);press(s,{b:true});assert.equal(s.selected,null);assert.deepEqual(s.board,before);
 turn(s,[30,25]);assert.deepEqual(s.lastPlayerTurn.path,[30,25]);assert.deepEqual(s.lastAiTurn.path,[1,6]);assert.equal(s.playerCaptures,0);assert.equal(s.aiCaptures,0);assert.equal(s.halfTurns,2);
});
test('a natural five-turn poor line loses by elimination without state edits',()=>{
 const s=fresh();for(const path of [[30,25],[32,27],[27,20],[34,20],[20,13]])turn(s,path);
 assert.equal(s.phase,'lost');assert.equal(s.reason,'player-empty');assert.equal(s.playerPieces,0);assert.equal(s.playerTurns,5);assert.equal(s.aiCaptures,3);const before=copy(s);press(s,{b:true});assert.deepEqual(s,before);
});
test('blocking all enemy moves wins while enemy pieces remain',()=>{
 const s=fixture([6,20,27],[],[29],[34]);turn(s,[6,1]);assert.equal(s.phase,'won');assert.equal(s.reason,'opponent-blocked');assert.equal(s.aiPieces,2);assert.equal(s.aiTurns,0);assert.equal(s.lastPlayerTurn.promoted,true);
});
test('enemy response can leave surviving player pieces with no legal move',()=>{
 const s=fixture([6,34],[1],[8,15,20,29]);turn(s,[34,27]);assert.equal(s.phase,'lost');assert.equal(s.reason,'player-blocked');assert.equal(s.playerPieces,2);assert.equal(s.aiCaptures,1);assert.deepEqual(s.lastAiTurn.path,[20,34]);assert.equal(s.lastAiTurn.promoted,true);
});
test('80-half-turn unresolved game loses, but final allowed elimination wins first',()=>{
 const s=fresh();s.halfTurns=78;s.playerTurns=39;s.aiTurns=39;turn(s,[30,25]);assert.equal(s.phase,'lost');assert.equal(s.reason,'turn-limit');assert.equal(s.halfTurns,80);assert.ok(s.aiPieces&&s.playerPieces);
 const t=fixture([13],[],[8]);t.halfTurns=79;turn(t,[13,3]);assert.equal(t.phase,'won');assert.equal(t.reason,'opponent-empty');assert.equal(t.halfTurns,80);assert.equal(t.aiTurns,0);
});
test('cursor clamps without wrapping and directions are edge-triggered with vertical tie priority',()=>{
 const s=fresh();go(s,0);press(s,{x:-1});assert.equal(s.cursor,0);assert.equal(s.events[0].reason,'edge');press(s,{y:-1});assert.equal(s.cursor,0);press(s,{x:1,y:1});assert.equal(s.cursor,6);for(let k=0;k<8;k++)step(s,{x:1,y:1});assert.equal(s.cursor,6);step(s,{x:1});assert.equal(s.cursor,7);
});
test('B then A then direction priority consumes simultaneous edges without deferred action',()=>{
 const s=fresh();a(s,30);step(s);step(s,{b:true,a:true,x:1});assert.equal(s.selected,null);assert.equal(s.cursor,30);assert.equal(s.lastCommand,'b');step(s,{a:true,x:1});assert.equal(s.selected,null);assert.equal(s.cursor,30);
 step(s);step(s,{a:true,x:1});assert.equal(s.selected,30);assert.equal(s.cursor,30);for(let k=0;k<8;k++)step(s,{a:true,x:1});assert.equal(s.blockedActions,0);assert.equal(s.halfTurns,0);
});
test('initial neutral, epochs and cancellation require release without breaking compulsory chains',()=>{
 const s=M.create(768,0);step(s,{a:true});assert.equal(s.selected,null);step(s,{cancelEpoch:0});step(s,{a:true,cancelEpoch:1});assert.equal(s.selected,null);assert.equal(s.inputArmed,false);step(s,{a:true,cancelEpoch:1});assert.equal(s.selected,null);step(s,{cancelEpoch:1});step(s,{a:true,cancelEpoch:1});assert.equal(s.selected,30);
 const t=fixture([29,30],[],[22,10,1]);turn(t,[29,15]);assert.equal(t.chainActive,true);step(t,{b:true,cancelled:true});assert.equal(t.inputArmed,false);assert.equal(t.chainActive,true);step(t,{b:true});assert.equal(t.lastCommand,'none');step(t);step(t,{b:true});assert.equal(t.events[0].reason,'capture-chain');assert.equal(t.selected,15);a(t,5);assert.equal(t.playerTurns,1);
});
test('invalid dt and pause are exact no-ops; accessors and descriptor failures cannot inject moves',()=>{
 const s=fresh(),before=copy(s);let reads=0;const input={};Object.defineProperty(input,'a',{get(){reads++;return true;}});
 for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,input);assert.deepEqual(s,before);assert.equal(reads,0);step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);
 step(s,input);step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));
 for(const value of [null,[],true,17,'a',{a:1,x:Infinity}])step(s,value);assert.equal(reads,0);assert.equal(s.selected,null);assert.equal(s.halfTurns,0);step(s,{a:true});assert.equal(s.selected,30);
});
test('elapsed and diagnostic counters saturate without adding a gameplay deadline',()=>{
 const s=fresh();s.elapsed=M.config.maxElapsed-.1;s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;step(s,{b:true},.25);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);assert.equal(s.phase,'playing');assert.equal(s.events.length,1);
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,ordinaryWinningHumanTurns:[6,6,6],physicalTvTested:false,physicalPhoneTested:false},null,2));
