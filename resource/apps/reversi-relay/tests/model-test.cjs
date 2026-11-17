'use strict';
const assert=require('node:assert/strict'),model=require('../src/main/assets/game-model.js');
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
function tick(s,i={}){return model.step(s,1/60,i);}
function tap(s,i){tick(s,{});tick(s,i);tick(s,{});}
function aim(s,cell){while(s.cursor%6<cell%6)tap(s,{x:1});while(s.cursor%6>cell%6)tap(s,{x:-1});while(Math.floor(s.cursor/6)<Math.floor(cell/6))tap(s,{y:1});while(Math.floor(s.cursor/6)>Math.floor(cell/6))tap(s,{y:-1});}
function play(s,path){for(const cell of path){if(cell===null)tap(s,{b:true});else{aim(s,cell);tap(s,{a:true});}}}
function synthetic(board,cursor=0){const s=model.create();s.board=board.slice();s.cursor=cursor;return s;}
test('public API, fixed boards, deep frozen config and independent creates',()=>{
 assert.deepEqual(Object.keys(model).sort(),['config','create','step']);assert.equal(model.config.size,6);assert.ok(Object.isFrozen(model.config.layouts[0].board));
 for(let level=0;level<3;level++){const a=model.create(751,level),b=model.create(751,level);assert.equal(a.counts.empty,8+level);a.board[0]=0;assert.notDeepEqual(a.board,b.board);assert.deepEqual(b.board,model.config.layouts[level].board);}
 assert.equal(model.create(NaN,-1).level,0);assert.equal(model.create(NaN).seed,751);
});
test('all three authored positions win through ordinary create/step controls',()=>{
 const routes=[[35,34,11,33,31],[17,35,32,34,4,3],[11,17,35,24,30,25,6]];
 routes.forEach((route,level)=>{const s=model.create(751,level);play(s,route);assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.counts.player-s.counts.opponent,[6,4,26][level]);assert.ok(s.aiPasses>0);assert.ok(s.receipts.length<=20);assert.ok(s.counts.player>s.counts.opponent);assert.equal(s.legalMoves.length,0);});
});
test('eight ray brackets flip simultaneously; synthetic geometry fixture',()=>{
 const board=Array(36).fill(0),rays=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]],expected=[];
 for(const[dx,dy]of rays){const n=(2+dy)*6+2+dx;board[n]=2;expected.push(n);board[(2+2*dy)*6+2+2*dx]=1;}
 const s=synthetic(board,14);tap(s,{a:true});assert.deepEqual(s.receipts[0].flipped.sort((a,b)=>a-b),expected.sort((a,b)=>a-b));assert.equal(s.counts.opponent,0);assert.equal(s.phase,'won');assert.equal(s.counts.empty,19);
});
test('board edge and empty gaps cannot bracket; synthetic geometry fixtures',()=>{
 for(const board of [Object.assign(Array(36).fill(0),{6:2,7:1}),Object.assign(Array(36).fill(0),{1:2,3:1})]){
  const s=synthetic(board,board[6]===2?5:0),before=s.board.slice();tap(s,{a:true});assert.deepEqual(s.board,before);assert.equal(s.playerMoves,0);assert.equal(s.aiMoves,0);assert.equal(s.blockedActions,1);
 }
});
test('occupied placement and premature pass are free blocked actions',()=>{const s=model.create();tap(s,{a:true});tap(s,{b:true});assert.equal(s.blockedActions,2);assert.equal(s.movesPlayed,0);assert.deepEqual(s.board,model.config.layouts[0].board);});
test('manual player pass continues a naturally reached legal position',()=>{
 const s=model.create(751,1);play(s,[3,11,35]);assert.equal(s.phase,'playing');assert.deepEqual(s.legalMoves,[]);const n=s.aiMoves;tap(s,{b:true});assert.equal(s.playerPasses,1);assert.equal(s.aiMoves,n+1);assert.equal(s.receipts.filter(r=>r.actor==='player'&&r.cell===null).length,1);
});
test('deterministic greedy AI replies identically to the same public board',()=>{
 const a=model.create(),b=model.create(99,0);play(a,[35]);play(b,[35]);assert.deepEqual(a.board,b.board);assert.deepEqual(a.lastAiMove,b.lastAiMove);assert.ok(a.aiMoves>0);
});
test('full board loss and draw use actual counts; synthetic end fixtures',()=>{
 const losing=Array(36).fill(2);losing[0]=0;losing[2]=1;const a=synthetic(losing);tap(a,{a:true});assert.equal(a.phase,'lost');assert.equal(a.reason,'opponent');assert.equal(a.counts.empty,0);assert.equal(a.counts.player,3);
 const draw=Array(36).fill(2);draw[0]=0;for(const c of [2,6,7,...Array.from({length:13},(_,i)=>i+8)])draw[c]=1;const b=synthetic(draw);tap(b,{a:true});assert.equal(b.reason,'draw');assert.deepEqual(b.counts,{player:18,opponent:18,empty:0});assert.equal(b.score,0);
});
test('input edges, B priority, held suppression and clamped cursor',()=>{
 const s=model.create();tick(s,{});tick(s,{x:1});for(let n=0;n<10;n++)tick(s,{x:1});assert.equal(s.cursor,1);tap(s,{x:-1});tap(s,{x:-1});assert.equal(s.cursor,0);
 aim(s,35);const moves=s.movesPlayed;tap(s,{a:true,b:true,x:-1});assert.equal(s.movesPlayed,moves);assert.equal(s.cursor,35);assert.equal(s.blockedActions,2);
 tick(s,{a:true});const n=s.movesPlayed;for(let k=0;k<10;k++)tick(s,{a:true});assert.equal(s.movesPlayed,n);
});
test('cancel epochs require a subsequent neutral sample and true new edge',()=>{
 const s=model.create();tick(s,{cancelEpoch:0});tick(s,{x:1,cancelEpoch:1});assert.equal(s.cursor,0);assert.equal(s.inputArmed,false);tick(s,{x:1,cancelEpoch:1});assert.equal(s.cursor,0);tick(s,{cancelEpoch:1});tick(s,{x:1,cancelEpoch:1});assert.equal(s.cursor,1);
 tick(s,{cancelled:true});tick(s,{x:1});assert.equal(s.cursor,1);tick(s,{});tick(s,{x:1});assert.equal(s.cursor,2);
});
test('invalid dt and paused inputs preserve exact state; own-data only normalization',()=>{
 const s=model.create(),before=structuredClone(s);for(const dt of [0,-1,NaN,Infinity,.26,'0.1']){model.step(s,dt,{a:true});assert.deepEqual(s,before);}tick(s,{paused:true,a:true});assert.deepEqual(s,before);
 let read=0;tick(s,{get a(){read++;return true;}});assert.equal(read,0);tick(s,Object.create({x:1}));assert.equal(s.cursor,0);tick(s,new Proxy({x:1},{getOwnPropertyDescriptor(){throw Error('synthetic');}}));assert.equal(s.cursor,0);
});
test('terminal freeze, bounded state and detached receipts',()=>{
 const s=model.create();play(s,[35,34,11,33,31]);const before=structuredClone(s);for(let i=0;i<30;i++)tick(s,{a:true,b:true,x:1});assert.deepEqual(s,before);
 s.board[0]=0;assert.notEqual(s.terminalReceipt.board[0],0);s.terminalReceipt.counts.player=-1;assert.ok(s.counts.player>0);s.receipts[0].flipped.push(99);assert.ok(!s.lastPlayerMove.flipped.includes(99));
 const c=model.create();c.calls=model.config.maxCounter;c.elapsed=model.config.maxElapsed;tick(c,{});assert.equal(c.calls,model.config.maxCounter);assert.equal(c.elapsed,86400);assert.equal(c.elapsedCapped,true);
});
console.log(JSON.stringify({passed:true,checks,physicalDeviceTested:false,syntheticFixturesLabelled:true}));
