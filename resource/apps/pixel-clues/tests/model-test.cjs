'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x));
// Expected pictures are test fixtures only; none is included in game assets.
const pictures=[['00100','01110','11111','00100','00100'],['110011','110011','111111','011110','001100','001100'],['0011100','0111110','1100011','1111111','1101011','1101011','1111111']];
function test(name,fn){fn();groups.push(name);}
function step(s,input={},dt=1/60){return M.step(s,dt,input);}
function fresh(level=0){const s=M.create(758,level);step(s);return s;}
function tap(s,key){step(s);step(s,{a:key==='a',b:key==='b',x:key==='right'?1:key==='left'?-1:0,y:key==='down'?1:key==='up'?-1:0});}
function cursor(s,p){while(Math.floor(s.cursor/s.size)<Math.floor(p/s.size))tap(s,'down');while(Math.floor(s.cursor/s.size)>Math.floor(p/s.size))tap(s,'up');while(s.cursor%s.size<p%s.size)tap(s,'right');while(s.cursor%s.size>p%s.size)tap(s,'left');}
function cells(level){return pictures[level].join('').split('').flatMap((v,i)=>v==='1'?[i]:[]);}
function paint(s,positions){for(const p of positions){cursor(s,p);tap(s,'a');}}
function prepareLast(level=0){const s=fresh(level),positions=cells(level),last=positions.pop();paint(s,positions);cursor(s,last);step(s);return s;}
test('public clues only, normalized identity and detached immutable configuration',()=>{
  assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.layouts.map(l=>[l.size,l.timeLimit]),[[5,60],[6,90],[7,120]]);
  assert.ok(M.config.layouts.every(l=>!Object.hasOwn(l,'cells')&&!Object.hasOwn(l,'solution')));
  const a=M.create(-1,-1),b=M.create(758,0);assert.equal(a.seed,758);assert.equal(a.level,0);assert.equal(a.inputArmed,false);assert.ok(a.cells.every(v=>v===0));
  a.cells[0]=1;a.rowClues[0][0]=99;assert.equal(b.cells[0],0);assert.equal(b.rowClues[0][0],1);assert.equal(M.create(4294967295,2).seed,4294967295);
  assert.throws(()=>M.config.layouts[0].rowClues[0][0]=99,TypeError);
});
test('ordinary complete wins on all three sheets with white cells optionally crossed',()=>{
  for(let level=0;level<3;level++){const s=fresh(level);tap(s,'b');assert.equal(s.cells[0],2);
    if(cells(level).includes(0))tap(s,'b');paint(s,cells(level));assert.equal(s.phase,'won');assert.equal(s.score,100);assert.ok(s.rowMatched.every(Boolean)&&s.colMatched.every(Boolean));
    assert.equal(s.filledCount,cells(level).length);assert.equal(s.terminalReceipt.cause,'success');assert.notEqual(s.terminalReceipt.cells,s.cells);
    const before=copy(s);step(s,{a:true,b:true,x:1},.25);assert.deepEqual(s,before);}
});
test('marks implement blank/fill/cross conversion exactly without a hidden white-cell requirement',()=>{
  const s=fresh();tap(s,'a');assert.equal(s.cells[0],1);tap(s,'a');assert.equal(s.cells[0],0);tap(s,'b');assert.equal(s.cells[0],2);
  tap(s,'a');assert.equal(s.cells[0],1);tap(s,'b');assert.equal(s.cells[0],2);tap(s,'b');assert.equal(s.cells[0],0);assert.equal(s.marks,6);assert.equal(s.filledCount,0);
});
test('exact contiguous run grouping distinguishes split rows and wrong pictures with equal fill count',()=>{
  const s=fresh();paint(s,[0,1,3]);assert.deepEqual(s.rowRuns[0],[2,1]);assert.deepEqual(s.colRuns[0],[1]);assert.deepEqual(s.colRuns[2],[]);assert.equal(s.rowMatched[0],false);
  const t=fresh(),wanted=cells(0);paint(t,[0,...wanted.filter(p=>p!==2)]);assert.equal(t.filledCount,wanted.length);assert.equal(t.phase,'playing');
  assert.ok(t.rowMatched.every(Boolean));assert.ok(t.colMatched.some(x=>!x));
});
test('cursor clamps all edges without row wrapping or diagonal movement',()=>{
  const s=fresh();tap(s,'left');tap(s,'up');assert.equal(s.cursor,0);assert.equal(s.blockedActions,2);assert.equal(s.cursorMoves,0);
  cursor(s,4);tap(s,'right');assert.equal(s.cursor,4);cursor(s,24);tap(s,'right');tap(s,'down');assert.equal(s.cursor,24);
  step(s);step(s,{x:-1,y:-1});assert.equal(s.cursor,19);assert.equal(s.lastCommand,'up');
});
test('ordinary neutral time reaches a natural timeout and terminal marks are frozen',()=>{
  const s=M.create(758,0);for(let i=0;i<239;i++){step(s,{},.25);assert.equal(s.phase,'playing');}step(s,{},.25);
  assert.equal(s.phase,'lost');assert.equal(s.reason,'timeout');assert.equal(s.elapsed,60);assert.equal(s.remaining,0);assert.equal(s.marks,0);
  const before=copy(s);tap(s,'a');assert.deepEqual(s,before);
});
test('ordinary final valid mark exactly at deadline wins before timeout on all levels',()=>{
  for(let level=0;level<3;level++){const s=prepareLast(level);while(s.remaining>.25)step(s,{},.25);
    const finalDt=s.remaining;assert.ok(finalDt>0&&finalDt<=.25);step(s,{a:true},finalDt);
    assert.equal(s.phase,'won');assert.equal(s.remaining,0);assert.equal(s.elapsed,s.timeLimit);assert.equal(s.events[0].type,'win');}
});
test('late endpoint refuses an otherwise winning mark instead of accepting past deadline',()=>{
  const s=prepareLast();while(s.remaining>.125)step(s,{},Math.min(.25,s.remaining-.125));
  const old=s.cells[s.cursor],marks=s.marks;step(s,{a:true},s.remaining+.01);assert.equal(s.phase,'lost');assert.equal(s.cells[s.cursor],old);assert.equal(s.marks,marks);assert.equal(s.lastCommand,'none');
});
test('B>A>direction and held suppression never queue extra marks',()=>{
  const s=fresh();step(s,{a:true,b:true,x:1});assert.equal(s.cells[0],2);assert.equal(s.cursor,0);assert.equal(s.marks,1);
  step(s,{a:true,x:1});assert.equal(s.lastCommand,'none');assert.equal(s.marks,1);step(s);step(s,{a:true,x:1});assert.equal(s.cells[0],1);assert.equal(s.cursor,0);
  for(let i=0;i<20;i++)step(s,{a:true,x:1});assert.equal(s.marks,2);step(s);step(s,{x:1});for(let i=0;i<20;i++)step(s,{x:1});assert.equal(s.cursor,1);
});
test('initial release and cancellation block actions while admitted neutral/cancelled samples consume time',()=>{
  const s=M.create(758,0);step(s,{a:true},.25);assert.equal(s.marks,0);assert.equal(s.elapsed,.25);step(s,{cancelEpoch:0},.25);
  step(s,{a:true,cancelEpoch:1},.25);assert.equal(s.inputArmed,false);assert.equal(s.marks,0);assert.equal(s.elapsed,.75);
  step(s,{cancelEpoch:1},.25);step(s,{a:true,cancelEpoch:1},.25);assert.equal(s.marks,1);
  step(s,{b:true,cancelled:true},.25);assert.equal(s.marks,1);assert.equal(s.elapsed,1.5);step(s,{b:true},.25);assert.equal(s.marks,1);step(s);step(s,{b:true});assert.equal(s.marks,2);
});
test('paused and invalid dt are exact time no-ops; malformed inputs cannot create marks',()=>{
  const s=fresh(),before=copy(s);let reads=0;const input={};Object.defineProperty(input,'a',{get(){reads++;return true;}});
  for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,input);assert.deepEqual(s,before);assert.equal(reads,0);
  step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);step(s,input);assert.equal(reads,0);assert.equal(s.marks,0);
  step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));
  for(const v of [null,[],true,17,'a',{a:1,x:Infinity}])step(s,v);assert.equal(s.marks,0);step(s,{a:true});assert.equal(s.marks,1);
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,physicalTvTested:false,physicalPhoneTested:false},null,2));
