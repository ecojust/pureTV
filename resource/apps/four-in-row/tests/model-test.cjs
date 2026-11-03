'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js'),prefixes=require('./initial-prefixes.json');
const checks=[],clone=v=>JSON.parse(JSON.stringify(v)),order=[3,2,4,1,5,0,6],directions=[[0,1],[1,0],[1,1],[1,-1]],windows=[];
for(let r=0;r<6;r++)for(let c=0;c<7;c++)for(const [dr,dc]of directions)if(r+3*dr<6&&c+3*dc>=0&&c+3*dc<7)windows.push([0,1,2,3].map(i=>[r+i*dr,c+i*dc]));
const has=(b,p)=>windows.some(w=>w.every(([r,c])=>b[r][c]===p));
const legal=b=>order.filter(c=>b[0][c]===0);
function drop(b,c,p){const out=clone(b);for(let r=5;r>=0;r--)if(out[r][c]===0){out[r][c]=p;return out;}return null;}
function value(b){let total=0;for(let r=0;r<6;r++)total+=b[r][3]===2?6:b[r][3]===1?-6:0;
 for(const w of windows){const own=w.filter(([r,c])=>b[r][c]===2).length,enemy=w.filter(([r,c])=>b[r][c]===1).length;
  if(!enemy)total+=[0,1,6,40,0][own];if(!own)total-=[0,1,7,45,0][enemy];}return total;}
function mini(b,p,d){if(has(b,2))return 1e6+d;if(has(b,1))return-1e6-d;const options=legal(b);if(!options.length)return 0;if(!d)return value(b);
 const values=options.map(c=>mini(drop(b,c,p),3-p,d-1));return p===2?Math.max(...values):Math.min(...values);}
const aiCache=new Map();
function ai(b){const key=b.flat().join('');if(aiCache.has(key))return aiCache.get(key);const options=legal(b);let chosen;
 for(const c of options)if(has(drop(b,c,2),2)){chosen=c;break;}
 if(chosen===undefined)for(const c of options)if(has(drop(b,c,1),1)){chosen=c;break;}
 if(chosen===undefined){let best=-Infinity;for(const c of options){const score=mini(drop(b,c,2),1,2);if(score>best){chosen=c;best=score;}}}
 aiCache.set(key,chosen);return chosen;
}
function search(board){const memo=new Map();function visit(b){const key=b.flat().join('');if(memo.has(key))return memo.get(key);let win=null,loss=null;
 for(const col of legal(b)){const p=drop(b,col,1);if(has(p,1)){if(!win||win.length>1)win=[col];continue;}if(!legal(p).length)continue;
  const next=drop(p,ai(p),2);if(has(next,2)){loss=loss||[col];continue;}if(!legal(next).length)continue;const result=visit(next);
  if(result.win&&(!win||result.win.length+1<win.length))win=[col,...result.win];if(result.loss&&!loss)loss=[col,...result.loss];}
 const result={win,loss};memo.set(key,result);return result;}return visit(board);}
function test(name,fn){fn();checks.push(name);}
function step(s,input={},dt=1/60){assert.equal(M.step(s,dt,input),s);return s;}
function fresh(level=0){const s=M.create(767,level);step(s);return s;}
function tap(s,key){step(s);return step(s,{a:key==='a',b:key==='b',x:key==='right'?1:key==='left'?-1:0,y:key==='up'?-1:key==='down'?1:0});}
function go(s,col){while(s.column<col)tap(s,'right');while(s.column>col)tap(s,'left');}
function play(s,col){go(s,col);tap(s,'a');}
function invariant(s){const initial=M.config.layouts[s.level].rows.join(''),ones=initial.split('1').length-1,twos=initial.split('2').length-1;
 assert.equal(s.board.flat().filter(v=>v===1).length,ones+s.playerDrops);assert.equal(s.board.flat().filter(v=>v===2).length,twos+s.aiDrops);
 for(let c=0;c<7;c++){let occupied=false;for(let r=0;r<6;r++){if(s.board[r][c])occupied=true;else assert.equal(occupied,false);}}
 assert.equal(s.turnReceipts.length,s.playerDrops);assert.ok(s.turnReceipts.length<=7);if(s.phase==='playing'){assert.equal(s.playerDrops,s.aiDrops);assert.equal(has(s.board,1),false);assert.equal(has(s.board,2),false);}
}
const routes=[];
test('authoredendgamesarelegalnonterminalprefixeswith10/12/14emptycellsandequalcounts',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.equal(windows.length,69);
 prefixes.forEach((fixture,level)=>{let board=Array.from({length:6},()=>Array(7).fill(0));
  fixture.legalPrefix.forEach((c,i)=>{assert.ok(legal(board).includes(c));board=drop(board,c,i%2?2:1);assert.equal(has(board,1),false);assert.equal(has(board,2),false);});
  assert.deepEqual(board,M.create(767,level).board);assert.equal(board.flat().filter(v=>v===0).length,[10,12,14][level]);invariant(fresh(level));});
 assert.deepEqual(M.config.ai.tieOrder,order);assert.equal(M.config.ai.depth,3);assert.throws(()=>M.config.layouts[0].rows.push('0000000'),TypeError);
 for(const seed of [undefined,null,-1,NaN,Infinity,4294967296,'1',.5])assert.equal(M.create(seed,0).seed,767);
 for(const level of [undefined,null,-1,NaN,Infinity,3,'1',.5])assert.equal(M.create(0,level).level,0);
 const a=M.create(0,0),b=M.create(0,0);a.board[0][0]=0;assert.equal(b.board[0][0],2);
});
test('independentpublicpolicysearchprovesallthreeordinarywinsrequire4/4/6playerdrops',()=>{
 for(let level=0;level<3;level++){const s=fresh(level),found=search(s.board);routes[level]=found;assert.ok(found.win&&found.loss);assert.equal(found.win.length,[4,4,6][level]);
  for(const col of found.win){const human=drop(s.board,col,1),expected=has(human,1)?null:ai(human);play(s,col);invariant(s);
   assert.equal(s.lastAI?s.lastAI.col:null,expected);}
  assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.lastAI,null);assert.equal(s.aiDrops,s.playerDrops-1);assert.ok(s.winningCells.length>=4);assert.equal(s.events[0].type,'win');
 }
});
test('allthreenaturallosingroutesgiveopponentwinsandterminalfreeze',()=>{
 for(let level=0;level<3;level++){const s=fresh(level);for(const col of routes[level].loss)play(s,col);
  assert.equal(s.phase,'lost');assert.equal(s.reason,'opponent');assert.equal(s.score,0);assert.equal(s.aiDrops,s.playerDrops);assert.ok(has(s.board,2));assert.ok(s.lastAI);invariant(s);
  const before=clone(s);let reads=0;const raw=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('unexpected');}});
  step(s,raw);step(s,{a:true,x:1});assert.equal(reads,0);assert.deepEqual(s,before);}
});
test('fullcolumnsandnavigationboundariesarefreeandnevertriggerAI',()=>{
 const s=fresh();assert.notEqual(s.board[0][0],0);go(s,0);const board=clone(s.board);tap(s,'a');
 assert.equal(s.events[0].reason,'full-column');assert.deepEqual(s.board,board);assert.equal(s.playerDrops,0);assert.equal(s.aiDrops,0);
 tap(s,'left');assert.equal(s.column,0);assert.equal(s.events[0].reason,'boundary');go(s,6);tap(s,'right');assert.equal(s.column,6);assert.deepEqual(s.board,board);
});
test('synthetichorizontalverticalandbothdiagonalplayerwinssettlebeforeanyAIresponse',()=>{
 const fixtures=[
  {col:3,ones:[[5,0],[5,1],[5,2]],twos:[],cells:[35,36,37,38]},
  {col:0,ones:[[5,0],[4,0],[3,0]],twos:[],cells:[14,21,28,35]},
  {col:0,ones:[[3,1],[4,2],[5,3]],twos:[[3,0],[4,0],[5,0],[4,1],[5,1],[5,2]],cells:[14,22,30,38]},
  {col:3,ones:[[3,2],[4,1],[5,0]],twos:[[3,3],[4,3],[5,3],[4,2],[5,2],[5,1]],cells:[17,23,29,35]}];
 for(const fixture of fixtures){const s=fresh();s.board=Array.from({length:6},()=>Array(7).fill(0));
  fixture.ones.forEach(([r,c])=>{s.board[r][c]=1;});fixture.twos.forEach(([r,c])=>{s.board[r][c]=2;});play(s,fixture.col);
  assert.equal(s.phase,'won');assert.equal(s.aiDrops,0);assert.equal(s.lastAI,null);assert.deepEqual(s.winningCells,fixture.cells);}
});
test('syntheticimmediateAIwinhaspriorityandimmediateplayerthreatisblocked',()=>{
 const winning=fresh();winning.board=Array.from({length:6},()=>Array(7).fill(0));winning.board[5]=[2,2,2,0,0,1,0];play(winning,6);
 assert.equal(winning.lastAI.col,3);assert.equal(winning.phase,'lost');assert.equal(winning.reason,'opponent');
 const blocking=fresh();blocking.board=Array.from({length:6},()=>Array(7).fill(0));blocking.board[5]=[1,1,1,0,0,0,0];play(blocking,6);
 assert.equal(blocking.lastAI.col,3);assert.equal(blocking.board[5][3],2);assert.equal(blocking.phase,'playing');
});
test('syntheticfullboarddrawisunsuccessfulanddoesnotclaimawinningline',()=>{
 const s=fresh();s.board=['1122112','2211221','1122112','2211221','1122112','2211221'].map(row=>Array.from(row,Number));
 assert.equal(has(s.board,1),false);assert.equal(has(s.board,2),false);s.board[0][0]=0;s.board[0][2]=0;
 play(s,0);assert.equal(s.phase,'lost');assert.equal(s.reason,'draw');assert.equal(s.score,0);assert.equal(s.board.flat().includes(0),false);
 assert.equal(s.lastPlayer.row,0);assert.equal(s.lastAI.col,2);assert.deepEqual(s.winningCells,[]);assert.equal(s.events[0].reason,'draw');
});
test('ordinarydropsusebottomemptycellandreceipts/countersmatchbothvisiblemoves',()=>{
 const s=fresh(),col=routes[0].win[0],before=clone(s.board),row=before.map(r=>r[col]).lastIndexOf(0);play(s,col);
 assert.deepEqual(s.lastPlayer,{row,col});assert.equal(s.board[row][col],1);assert.equal(s.board[s.lastAI.row][s.lastAI.col],2);
 assert.equal(s.playerDrops,1);assert.equal(s.aiDrops,1);assert.equal(s.turnReceipts[0].outcome,'playing');
 assert.notEqual(s.turnReceipts[0].player,s.lastPlayer);assert.notEqual(s.turnReceipts[0].ai,s.lastAI);invariant(s);
 const original=clone(s.board);s.turnReceipts[0].player.col=99;assert.deepEqual(s.board,original);
});
test('oneheldAisoneturnandunusedB/up/downdonotoverrideAorhorizontalnavigation',()=>{
 const s=fresh();go(s,routes[0].win[0]);step(s);step(s,{a:true,b:true,x:-1,y:1});assert.equal(s.playerDrops,1);const column=s.column;
 for(let i=0;i<20;i++)step(s,{a:true,b:true,x:-1,y:1});assert.equal(s.playerDrops,1);assert.equal(s.column,column);
 step(s);step(s,{x:-.5});assert.equal(s.column,column);step(s,{x:-.51,y:1});assert.equal(s.column,column-1);
 step(s,{x:1,y:-1});assert.equal(s.column,column);step(s);step(s,{b:true,y:-1});assert.equal(s.column,column);assert.equal(s.playerDrops,1);
});
test('initialneutralchangedepochandcancellationmustreleasebeforeplayerdrop',()=>{
 const s=M.create(767,0);step(s,{a:true});assert.equal(s.playerDrops,0);assert.equal(s.inputArmed,false);step(s);go(s,routes[0].win[0]);
 step(s,{cancelEpoch:1});step(s,{cancelEpoch:2});assert.equal(s.inputArmed,false);step(s,{a:true,cancelEpoch:2});assert.equal(s.playerDrops,0);
 step(s,{cancelEpoch:2});step(s,{a:true,cancelEpoch:2,cancelled:true});assert.equal(s.playerDrops,0);step(s,{cancelled:true});step(s,{a:true});assert.equal(s.playerDrops,0);
 step(s);step(s,{a:true});assert.equal(s.playerDrops,1);
});
test('invaliddtpausedgettersinheritanceandpartialdescriptorfailurecannotconsumeinputs',()=>{
 const s=fresh(),before=clone(s);let reads=0;const raw=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('no');}});
 for(const dt of [0,-1,.251,NaN,Infinity,'0.1',null,{},undefined])M.step(s,dt,raw);assert.equal(reads,0);assert.deepEqual(s,before);
 step(s,{paused:true,a:true,x:1});assert.deepEqual(s,before);let getters=0;const getter={};Object.defineProperty(getter,'a',{get(){getters++;return true;}});
 step(s,getter);step(s,Object.create({a:true,x:1}));assert.equal(getters,0);assert.equal(s.playerDrops,0);assert.equal(s.column,3);
 const partial=new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='cancelled')throw Error('no');return Object.getOwnPropertyDescriptor(t,k);}});step(s,partial);assert.equal(s.playerDrops,0);
});
test('terminalreceiptarraysaredetachedandsyntheticcountercapsremainfinite',()=>{
 const s=fresh();for(const col of routes[0].win)play(s,col);const actual=clone(s.board);s.terminalReceipt.board[0].fill(0);s.terminalReceipt.winningCells.length=0;
 assert.deepEqual(s.board,actual);assert.ok(s.winningCells.length>=4);
 const capped=fresh();capped.calls=M.config.maxCounter;capped.blockedActions=M.config.maxCounter;capped.elapsed=M.config.maxElapsed;go(capped,0);tap(capped,'a');
 assert.equal(capped.calls,M.config.maxCounter);assert.equal(capped.blockedActions,M.config.maxCounter);assert.equal(capped.elapsed,M.config.maxElapsed);assert.equal(capped.elapsedCapped,true);assert.equal(capped.phase,'playing');
});
console.log(JSON.stringify({passed:true,cases:checks.length,checks,physicalTvTested:false,physicalPhoneTested:false},null,2));
