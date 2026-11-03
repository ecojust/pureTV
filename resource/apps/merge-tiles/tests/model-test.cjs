'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x)),sum=a=>a.reduce((x,y)=>x+y,0);
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){return M.step(s,dt,i);}
function fresh(level=0){const s=M.create(766,level);step(s);return s;}
function tap(s,key){step(s);step(s,{a:key==='a',b:key==='b',x:key==='right'?1:key==='left'?-1:0,y:key==='down'?1:key==='up'?-1:0});}
// Public-rule routes found by a separate scratch beam search; never bundled in assets.
const routes=[['down','down','up','right','down','down','up','left','left','left','up','down','left','left'],
  ['left','up','up','down','right','up','right','down','up','left','left','right','up','down','left'],
  ['right','down','right','left','right','down','left','down','right','down','left','right','up','right','down','left']];
function beforeSpawn(s){const cells=s.cells.slice();if(s.lastSpawn)cells[s.lastSpawn.index]=0;return cells;}
test('authored starts require at least11valid moves by mass and config/state are isolated',()=>{
  assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.layouts.map(l=>[l.target,l.moveLimit]),[[32,30],[64,40],[128,55]]);
  const firstNine=Array.from({length:9},(_,i)=>M.config.spawnValues[i%8]);assert.equal(sum(firstNine),22);
  for(const l of M.config.layouts){assert.equal(sum(l.cells),l.target-24);assert.ok(sum(l.cells)+sum(firstNine)<l.target);}
  const a=M.create(-1,-1),b=M.create(766,0);assert.equal(a.seed,766);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.cells[0]=999;assert.equal(b.cells[0],2);
  assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('1','1').level,0);assert.throws(()=>M.config.layouts[0].cells[0]=999,TypeError);
});
test('all three ordinary public-rule routes win with exact spawn mass and valid powers of two',()=>{
  routes.forEach((route,level)=>{const s=fresh(level);for(const d of route){const total=sum(s.cells),serial=s.spawnIndex;tap(s,d);
    assert.ok(s.cells.every(v=>v===0||(v>0&&(v&(v-1))===0)));
    if(s.phase==='won'){assert.equal(sum(s.cells),total);assert.equal(s.lastSpawn,null);assert.equal(s.spawnIndex,serial);}
    else{assert.equal(s.spawnIndex,serial+1);assert.equal(s.lastSpawn.value,M.config.spawnValues[serial%8]);assert.equal(sum(s.cells),total+s.lastSpawn.value);}
  }assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.movesUsed,route.length);assert.ok(s.movesUsed>=11&&s.movesUsed<s.moveLimit);assert.ok(s.cells.some(v=>v>=s.target));
    assert.notEqual(s.terminalReceipt.cells,s.cells);const before=copy(s);step(s,{a:true,x:1});assert.deepEqual(s,before);});
});
test('synthetic directional merge order gives each original pair exactly one merge',()=>{
  for(const dir of ['left','right','up','down']){const s=fresh(2);s.cells=Array(16).fill(0);const ids=dir==='left'||dir==='right'?[0,1,2,3]:[0,4,8,12];ids.forEach(i=>s.cells[i]=2);
    tap(s,dir);const b=beforeSpawn(s),expected=dir==='left'?[4,4,0,0]:dir==='right'?[0,0,4,4]:dir==='up'?[4,4,0,0]:[0,0,4,4];assert.deepEqual(ids.map(i=>b[i]),expected);assert.equal(s.points,8);assert.equal(s.lastMerges.length,2);}
  const s=fresh(2);s.cells=[4,4,8,0,...Array(12).fill(0)];tap(s,'left');assert.deepEqual(beforeSpawn(s).slice(0,4),[8,8,0,0]);assert.equal(s.points,8);
  const t=fresh(2);t.cells=[2,2,4,4,...Array(12).fill(0)];tap(t,'right');assert.deepEqual(beforeSpawn(t).slice(0,4),[0,0,4,8]);assert.equal(t.points,12);
});
test('public spawn value and rank use post-slide empty cells exactly',()=>{
  const s=fresh();tap(s,'left');const pre=beforeSpawn(s),empty=pre.flatMap((v,i)=>v?[]:[i]);assert.equal(s.lastSpawn.index,empty[766%empty.length]);assert.equal(s.lastSpawn.value,2);assert.equal(s.spawnIndex,1);assert.equal(s.nextSpawnValue,2);
  assert.equal(s.cells[s.lastSpawn.index],s.lastSpawn.value);assert.equal(s.history[0].spawnIndex,0);assert.notEqual(s.history[0].cells,s.cells);
});
test('synthetic no-op neither spends nor spawns nor saves undo history',()=>{
  const s=fresh(2);s.cells=[2,4,8,16,...Array(12).fill(0)];const cells=s.cells.slice();tap(s,'left');assert.deepEqual(s.cells,cells);assert.equal(s.movesUsed,0);assert.equal(s.points,0);assert.equal(s.spawnIndex,0);assert.equal(s.history.length,0);assert.equal(s.events[0].reason,'no-change');
});
test('two undo tickets restore board, merge points and spawn cursor but never refund moves',()=>{
  const s=fresh(),initial=copy(s);tap(s,'a');assert.equal(s.events[0].reason,'no-history');assert.equal(s.undoTickets,2);
  tap(s,'left');const once=copy(s);tap(s,'a');assert.deepEqual(s.cells,initial.cells);assert.equal(s.points,0);assert.equal(s.spawnIndex,0);assert.equal(s.lastSpawn,null);assert.equal(s.movesUsed,1);assert.equal(s.undoTickets,1);
  tap(s,'left');assert.deepEqual(s.cells,once.cells);assert.deepEqual(s.lastSpawn,once.lastSpawn);assert.equal(s.movesUsed,2);tap(s,'a');assert.equal(s.undoTickets,0);assert.equal(s.movesUsed,2);
  tap(s,'left');const board=s.cells.slice();tap(s,'a');assert.equal(s.events[0].reason,'no-tickets');assert.deepEqual(s.cells,board);assert.equal(s.movesUsed,3);assert.equal(s.undos,2);
});
test('synthetic last-budget target merge wins before spawn and exhaustion',()=>{
  const s=fresh();s.cells=[16,16,...Array(14).fill(0)];s.movesUsed=29;tap(s,'left');assert.equal(s.phase,'won');assert.equal(s.movesUsed,30);assert.equal(s.spawnIndex,0);assert.equal(s.lastSpawn,null);assert.equal(sum(s.cells),32);assert.equal(s.points,32);assert.equal(s.cells[0],32);
});
test('synthetic final nonwinning valid move spawns then loses on budget',()=>{
  const s=fresh();s.movesUsed=29;tap(s,'left');assert.equal(s.phase,'lost');assert.equal(s.reason,'moves');assert.equal(s.movesUsed,30);assert.equal(s.spawnIndex,1);assert.equal(s.lastSpawn.value,2);const before=copy(s);tap(s,'a');assert.deepEqual(s,before);
});
test('synthetic changed board can spawn into true deadlock, taking precedence over budget',()=>{
  const s=fresh(2);s.cells=[2,4,8,16,4,8,16,32,8,16,32,64,4,8,16,0];s.movesUsed=54;tap(s,'right');
  assert.equal(s.phase,'lost');assert.equal(s.reason,'stuck');assert.equal(s.movesUsed,55);assert.deepEqual(s.lastSpawn,{index:12,value:2});assert.ok(s.cells.every(Boolean));
  for(let y=0;y<4;y++)for(let x=0;x<4;x++){const p=y*4+x;if(x<3)assert.notEqual(s.cells[p],s.cells[p+1]);if(y<3)assert.notEqual(s.cells[p],s.cells[p+4]);}
});
test('A priority and held directions never queue extra slides; B unused',()=>{
  const s=fresh();step(s,{a:true,x:-1});assert.equal(s.events[0].reason,'no-history');assert.equal(s.movesUsed,0);step(s,{x:-1});assert.equal(s.movesUsed,0);
  step(s);step(s,{x:-1});assert.equal(s.movesUsed,1);for(let i=0;i<20;i++)step(s,{x:-1});assert.equal(s.movesUsed,1);tap(s,'b');assert.equal(s.lastCommand,'none');assert.equal(s.movesUsed,1);
});
test('initial arming and cancellation require later neutral before sliding',()=>{
  const s=M.create(766,0);step(s,{x:-1});assert.equal(s.movesUsed,0);step(s,{cancelEpoch:0});step(s,{x:-1,cancelEpoch:1});assert.equal(s.movesUsed,0);assert.equal(s.inputArmed,false);
  step(s,{x:-1,cancelEpoch:1});assert.equal(s.movesUsed,0);step(s,{cancelEpoch:1});step(s,{x:-1,cancelEpoch:1});assert.equal(s.movesUsed,1);step(s,{a:true,cancelled:true});assert.equal(s.undos,0);step(s,{a:true});assert.equal(s.undos,0);step(s);step(s,{a:true});assert.equal(s.undos,1);
});
test('invalid dt, pause and malicious descriptors never mutate partially',()=>{
  const s=fresh(),before=copy(s);let reads=0;const input={};Object.defineProperty(input,'x',{get(){reads++;return -1;}});
  for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,input);assert.deepEqual(s,before);assert.equal(reads,0);step(s,{paused:true,x:-1},.25);assert.deepEqual(s,before);
  step(s,input);step(s,Object.create({x:-1}));step(s,new Proxy({x:-1},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));
  for(const v of [null,[],true,17,'left',{x:Infinity,a:1}])step(s,v);assert.equal(s.movesUsed,0);assert.equal(reads,0);step(s,{x:-1});assert.equal(s.movesUsed,1);
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,physicalTvTested:false,physicalPhoneTested:false},null,2));
