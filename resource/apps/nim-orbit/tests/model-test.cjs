'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x)),sum=a=>a.reduce((x,y)=>x+y,0);
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){return M.step(s,dt,i);}
function fresh(level=0){const s=M.create(776,level);step(s);return s;}
function press(s,i){step(s);step(s,i);}
function select(s,p){for(let n=0;s.selected!==p;n++){assert.ok(n<4);press(s,{x:1});}}
function move(s,p,n){select(s,p);for(let guard=0;s.amount!==n;guard++){assert.ok(guard<8);press(s,{y:s.amount<n?-1:1});}press(s,{a:true});}
function fixture(piles,misere=false){const s=fresh(misere?2:0);s.piles=piles.slice();s.misere=misere;s.lastStoneRule=misere?'loses':'wins';s.initialTotal=sum(piles);s.selected=0;s.amount=piles[0]?1:0;step(s);return s;}
// Pre-implementation independent scratch BFS routes, never shipped in assets.
const wins=[[[2,3],[2,1],[1,1],[1,1]],[[3,2],[0,3],[2,1],[2,1],[2,1],[2,1],[2,1]],[[1,3],[0,1],[3,1],[3,1],[3,2]]];
const losses=[[[0,2],[1,3]],[[0,2],[0,1],[1,5]],[[0,1],[2,4],[1,1]]];
test('public API, authored starts, normal/misere labels and immutable isolated config',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.layouts.map(l=>l.piles),[[2,3,4],[3,5,6,2],[1,3,4,5]]);assert.deepEqual(M.config.layouts.map(l=>l.misere),[false,false,true]);
 const a=M.create(-1,-1),b=M.create(776,0);assert.equal(a.seed,776);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.piles[0]=99;assert.equal(b.piles[0],2);assert.throws(()=>M.config.layouts[0].piles[0]=9,TypeError);assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('1','2').level,0);assert.equal(M.create(776,2).lastStoneRule,'loses');
});
test('three unchanged starts win by ordinary inputs with strictly decreasing conserved stones',()=>{
 wins.forEach((route,level)=>{const s=fresh(level);for(const [p,n]of route){const total=s.remaining;move(s,p,n);assert.ok(s.remaining<total);assert.equal(s.initialTotal,s.remaining+s.playerRemoved+s.aiRemoved);assert.equal(s.remaining,sum(s.piles));assert.ok(s.piles.every(v=>Number.isInteger(v)&&v>=0));assert.equal(s.totalMoves,s.playerMoves+s.aiMoves);assert.equal(s.lastPlayerMove.removed,n);assert.equal(s.lastPlayerMove.before-s.lastPlayerMove.after,n);if(s.lastAiMove)assert.equal(s.lastAiMove.before-s.lastAiMove.after,s.lastAiMove.removed);}
 assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.remaining,0);assert.equal(s.playerMoves,route.length);assert.ok(s.playerMoves>=3);assert.equal(s.reason,level===2?'opponent-last':'player-last');assert.notEqual(s.terminalReceipt.piles,s.piles);assert.notEqual(s.terminalReceipt.lastRound,s.lastRound);assert.notEqual(s.lastRound.player,s.lastPlayerMove);
 const before=copy(s);step(s,{a:true,x:1,cancelEpoch:999});assert.deepEqual(s,before);});
});
test('all three normal positions have natural losing routes with correct last-player attribution',()=>{
 losses.forEach((route,level)=>{const s=fresh(level);route.forEach(([p,n])=>move(s,p,n));assert.equal(s.phase,'lost');assert.equal(s.reason,level===2?'player-last':'opponent-last');assert.equal(s.remaining,0);assert.equal(s.playerMoves,route.length);assert.equal(s.initialTotal,s.playerRemoved+s.aiRemoved);});
});
test('a final human move wins normal but loses misere and never triggers an extra AI move',()=>{
 for(const misere of [false,true]){const s=fixture([0,0,3],misere);move(s,2,3);assert.equal(s.reason,'player-last');assert.equal(s.phase,misere?'lost':'won');assert.equal(s.aiMoves,0);assert.equal(s.lastAiMove,null);assert.equal(s.lastRound.opponent,null);assert.equal(s.playerRemoved,3);assert.equal(s.remaining,0);}
});
test('a final opponent move loses normal but wins misere',()=>{
 for(const misere of [false,true]){const s=fixture([1,1,0],misere);move(s,0,1);assert.equal(s.reason,'opponent-last');assert.equal(s.phase,misere?'won':'lost');assert.equal(s.aiMoves,1);assert.equal(s.lastAiMove.pile,1);assert.equal(s.lastAiMove.removed,1);assert.equal(s.remaining,0);}
});
test('all-ones parity and one larger pile obey the misere boundary',()=>{
 const a=fixture([1,1,1],true);move(a,0,1);assert.equal(a.phase,'playing');assert.deepEqual(a.piles,[0,0,1]);assert.equal(a.lastAiMove.pile,1);move(a,2,1);assert.equal(a.phase,'lost');
 const b=fixture([1,1,1,1],true);move(b,0,1);assert.deepEqual(b.piles,[0,0,1,1]);assert.equal(b.lastAiMove.pile,1);move(b,2,1);assert.equal(b.phase,'won');
 const c=fixture([1,3,0],true);move(c,0,1);assert.deepEqual(c.piles,[0,1,0]);assert.equal(c.lastAiMove.removed,2);assert.equal(c.phase,'playing');
});
test('pile changes preserve/clamp amount, empty piles use0, and returning restores1',()=>{
 const s=fresh();select(s,2);press(s,{y:-1});press(s,{y:-1});press(s,{y:-1});assert.equal(s.amount,4);press(s,{y:-1});assert.equal(s.events[0].reason,'max-amount');select(s,0);assert.equal(s.amount,2);press(s,{y:1});assert.equal(s.amount,1);press(s,{y:1});assert.equal(s.events[0].reason,'min-amount');assert.equal(s.totalMoves,0);
 const t=fixture([0,3,1]);assert.equal(t.amount,0);press(t,{y:-1});assert.equal(t.events[0].reason,'empty-pile');select(t,1);assert.equal(t.amount,1);press(t,{y:-1});assert.equal(t.amount,2);select(t,0);assert.equal(t.amount,0);select(t,1);assert.equal(t.amount,1);
});
test('empty confirmation is free and preserves complete prior move receipts',()=>{
 const s=fresh();move(s,2,3);move(s,2,1);assert.equal(s.phase,'playing');const empty=s.piles.findIndex(v=>v===0);assert.ok(empty>=0);select(s,empty);const before={piles:s.piles.slice(),round:copy(s.lastRound),moves:s.totalMoves};press(s,{a:true});assert.equal(s.events[0].reason,'empty-pile');assert.deepEqual(s.piles,before.piles);assert.deepEqual(s.lastRound,before.round);assert.equal(s.totalMoves,before.moves);
});
// Independent retrograde game outcomes; deliberately no XOR formula.
const memo=new Map();
function winning(p,misere){const key=Number(misere)+':'+p.join(',');if(memo.has(key))return memo.get(key);if(sum(p)===0)return misere;
 for(let i=0;i<p.length;i++)for(let take=1;take<=p[i];take++){const q=p.slice();q[i]-=take;if(!winning(q,misere)){memo.set(key,true);return true;}}memo.set(key,false);return false;
}
function expectedAi(p,misere){for(let i=0;i<p.length;i++)for(let take=1;take<=p[i];take++){const q=p.slice();q[i]-=take;if(!winning(q,misere))return {pile:i,removed:take};}
 const biggest=Math.max(...p);return {pile:p.indexOf(biggest),removed:1};}
let exhaustivePositions=0;
test('optimal AI equals independent exhaustive outcomes and complete stable policy on758 small positions',()=>{
 for(const misere of [false,true])for(const [length,max]of [[3,4],[4,3]]){const base=max+1,count=base**length;for(let serial=1;serial<count;serial++){let value=serial;const p=[];for(let i=0;i<length;i++){p.push(value%base);value=Math.floor(value/base);}const expected=expectedAi(p,misere),start=p.slice();start[0]++;
  const s=fixture(start,misere);move(s,0,1);assert.deepEqual({pile:s.lastAiMove.pile,removed:s.lastAiMove.removed},expected);assert.equal(s.lastAiMove.remaining,sum(p)-expected.removed);const q=p.slice();q[expected.pile]-=expected.removed;assert.deepEqual(s.piles,q);if(winning(p,misere))assert.equal(winning(q,misere),false);exhaustivePositions++;
 }}assert.equal(exhaustivePositions,758);
});
test('no-winning-move fallback removes one from largest pile with first-index tie',()=>{
 const s=fixture([4,3,0]);move(s,0,1);assert.deepEqual(s.lastAiMove,{side:'opponent',pile:0,removed:1,before:3,after:2,remaining:5,moveNumber:2});
 const t=fixture([1,2,2]);move(t,0,1);assert.equal(t.lastAiMove.pile,1);assert.equal(t.lastAiMove.removed,1);
});
test('A priority, vertical tie priority, B unused and held input never repeats',()=>{
 const s=fresh();press(s,{x:1,y:-1});assert.equal(s.selected,0);assert.equal(s.amount,2);for(let k=0;k<8;k++)step(s,{x:1,y:-1});assert.equal(s.amount,2);press(s,{b:true});assert.equal(s.totalMoves,0);
 step(s);step(s,{a:true,x:1});assert.equal(s.playerMoves,1);assert.equal(s.selected,0);const moves=s.totalMoves;for(let k=0;k<8;k++)step(s,{a:true,x:1});assert.equal(s.totalMoves,moves);step(s,{x:1});assert.equal(s.selected,0);step(s);step(s,{x:1});assert.equal(s.selected,1);
});
test('initial neutral and cancellation require release while preserving planned amount',()=>{
 const s=M.create(776,0);step(s,{a:true});assert.equal(s.playerMoves,0);step(s,{cancelEpoch:0});press(s,{y:-1});assert.equal(s.amount,2);step(s,{a:true,cancelEpoch:1});assert.equal(s.playerMoves,0);assert.equal(s.inputArmed,false);assert.equal(s.amount,2);step(s,{a:true,cancelEpoch:1});assert.equal(s.playerMoves,0);step(s,{cancelEpoch:1});step(s,{a:true,cancelEpoch:1});assert.equal(s.playerMoves,1);
 const t=fresh();step(t,{a:true,cancelled:true});step(t,{a:true});assert.equal(t.playerMoves,0);step(t);step(t,{a:true});assert.equal(t.playerMoves,1);
});
test('invalid dt, pause and hostile descriptors cannot partially remove stones',()=>{
 const s=fresh(),before=copy(s);let reads=0;const i={};Object.defineProperty(i,'a',{get(){reads++;return true;}});for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,i);assert.deepEqual(s,before);assert.equal(reads,0);step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);
 step(s,i);step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));for(const v of [null,[],true,17,'a',{a:1,x:Infinity}])step(s,v);assert.equal(s.totalMoves,0);assert.equal(reads,0);step(s,{a:true});assert.equal(s.playerMoves,1);
});
test('diagnostics saturate without time limit, and failed state freezes exactly',()=>{
 const s=fresh();s.elapsed=M.config.maxElapsed-.1;s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;press(s,{y:1});step(s,{},.25);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
 const t=fixture([1,0,0],true);move(t,0,1);const before=copy(t);step(t,{a:true,x:1,cancelled:true});assert.deepEqual(t,before);
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,ordinaryWinningPlayerMoves:[4,7,5],ordinaryLosingPlayerMoves:[2,3,3],exhaustivePositions,physicalTvTested:false,physicalPhoneTested:false},null,2));
