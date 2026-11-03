'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js'),{solve}=require('./constraint-solver.cjs');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x));
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){return M.step(s,dt,i);}
function fresh(level=0){const s=M.create(782,level);step(s);return s;}
function press(s,i){step(s);step(s,i);}
function neighbors(s,p){const out=[];for(const [dx,dy,key]of [[-1,0,'left'],[1,0,'right'],[0,-1,'up'],[0,1,'down']]){let x=p%s.width+dx,y=Math.floor(p/s.width)+dy;while(x>=0&&x<s.width&&y>=0&&y<s.height){const q=y*s.width+x;if(s.mask[y][x]==='.'){out.push([q,key]);break;}x+=dx;y+=dy;}}return out;}
function go(s,target){const q=[[s.cursor,[]]],seen=new Set([s.cursor]);let path=null;for(let head=0;head<q.length;head++){const[p,route]=q[head];if(p===target){path=route;break;}for(const[to,key]of neighbors(s,p))if(!seen.has(to)){seen.add(to);q.push([to,route.concat(key)]);}}assert.ok(path,'visible white-cell navigation must connect');for(const key of path)press(s,{x:key==='right'?1:key==='left'?-1:0,y:key==='down'?1:key==='up'?-1:0});assert.equal(s.cursor,target);}
function set(s,p,value){go(s,p);if(Object.hasOwn(s.givens,p)){assert.equal(s.cells[p],value);return;}for(let guard=0;s.cells[p]!==value;guard++){assert.ok(guard<10);press(s,{a:true});}}
function fill(s,values){for(const p of s.whiteCells)set(s,p,values[p]);}
const proofs=M.config.layouts.map(l=>solve(l,2));
test('all authored masks contain2..4-cell crossing runs and exactly one independently solved board',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);M.config.layouts.forEach((l,n)=>{assert.equal(proofs[n].solutions.length,1);assert.equal(l.width,n+4);assert.equal(l.height,n+4);const white=l.mask.join('').split('').flatMap((v,p)=>v==='.'?[p]:[]);assert.equal(white.length,[8,13,16][n]);
  for(const p of white){assert.equal(l.runs.filter(r=>r.cells.includes(p)&&r.direction==='across').length,1);assert.equal(l.runs.filter(r=>r.cells.includes(p)&&r.direction==='down').length,1);}
  for(const r of l.runs){assert.ok(r.cells.length>=2&&r.cells.length<=4);assert.equal(l.mask[Math.floor(r.clueCell/l.width)][r.clueCell%l.width],'#');assert.ok(r.cells.every(p=>white.includes(p)));}
 });assert.deepEqual(M.config.layouts.map(l=>Object.keys(l.givens).length),[0,1,1]);
});
test('config and live state are detached, with normalized identities and no answer board export',()=>{
 const a=M.create(-1,-1),b=M.create(782,0);assert.equal(a.seed,782);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.runs[0].cells[0]=99;a.cells[5]=8;assert.equal(b.runs[0].cells[0],5);assert.equal(b.cells[5],0);assert.throws(()=>M.config.layouts[0].runs[0].cells[0]=9,TypeError);assert.equal(M.create(4294967295,2).seed,4294967295);assert.equal(M.create('1','2').level,0);for(const l of M.config.layouts){assert.equal('solution'in l,false);assert.equal('answer'in l,false);}
});
test('all three unique boards win via ordinary cursor/A entry and explicit B submission only',()=>{
 proofs.forEach((p,level)=>{const s=fresh(level);fill(s,p.solutions[0]);assert.equal(s.phase,'playing');assert.equal(s.checks,0);assert.equal(s.mistakes,0);assert.equal(s.filledCount,s.whiteCells.length);assert.ok(s.runStatus.every(r=>r.matched));press(s,{b:true});assert.equal(s.phase,'won');assert.equal(s.reason,'solved');assert.equal(s.score,100);assert.equal(s.checks,1);assert.equal(s.lastCheck.valid,true);assert.notEqual(s.terminalReceipt.cells,s.cells);assert.notEqual(s.terminalReceipt.lastCheck,s.lastCheck);
  for(let i=0;i<s.cells.length;i++)if(s.mask[Math.floor(i/s.width)][i%s.width]==='#')assert.equal(s.cells[i],-1);const before=copy(s);step(s,{a:true,b:true,x:1,cancelEpoch:99});assert.deepEqual(s,before);
 });
});
test('duplicate digits in unrelated runs are legal and no global Latin-square uniqueness is imposed',()=>{
 const solution=proofs[1].solutions[0];assert.ok(new Set(Object.values(solution)).size<Object.keys(solution).length);const s=fresh(1);fill(s,solution);press(s,{b:true});assert.equal(s.phase,'won');
});
test('A cycles all1..9 then clears, with no mistake spent during editing',()=>{
 const s=fresh(),p=s.cursor;for(let value=1;value<=9;value++){press(s,{a:true});assert.equal(s.cells[p],value);assert.equal(s.mistakes,0);}press(s,{a:true});assert.equal(s.cells[p],0);assert.equal(s.edits,10);assert.equal(s.filledCount,0);assert.equal(s.checks,0);
});
test('public fixed digits can be focused but never altered',()=>{
 for(let level=1;level<3;level++){const s=fresh(level),p=Number(Object.keys(s.givens)[0]),value=s.givens[p];go(s,p);press(s,{a:true});assert.equal(s.events[0].reason,'fixed');assert.equal(s.cells[p],value);assert.equal(s.edits,0);assert.equal(s.mistakes,0);assert.equal(s.givensCount,1);}
});
test('navigation stays on white cells, skips blockers, and never wraps an edge',()=>{
 for(let level=0;level<3;level++){const s=fresh(level);for(const p of s.whiteCells){go(s,p);assert.ok(s.cells[s.cursor]>=0);}go(s,s.whiteCells[0]);const before=s.cursor;press(s,{y:-1});assert.equal(s.cursor,before);assert.equal(s.events[0].reason,'edge');}
 // Narrow navigation-only synthetic fixture demonstrates a skipped internal black cell.
 const s=fresh();s.cells[6]=-1;press(s,{x:1});assert.equal(s.cursor,7);press(s,{x:1});assert.equal(s.cursor,7);assert.equal(s.events[0].reason,'edge');
});
test('incomplete submissions are free, even if currently entered digits duplicate',()=>{
 const s=fresh();set(s,5,1);set(s,6,1);assert.equal(s.runStatus[0].duplicate,true);for(let k=0;k<4;k++)press(s,{b:true});assert.equal(s.events[0].reason,'incomplete');assert.equal(s.mistakes,0);assert.equal(s.checks,0);assert.equal(s.lastCheck,null);assert.equal(s.phase,'playing');
});
test('a duplicate run fails even when its sum matches the clue',()=>{
 const s=fresh(),values={...proofs[0].solutions[0],5:7,6:8,7:8};fill(s,values);assert.equal(s.runStatus[0].actualSum,23);assert.equal(s.runStatus[0].duplicate,true);press(s,{b:true});const error=s.lastCheck.errors.find(e=>e.run===0);assert.equal(error.actualSum,error.expectedSum);assert.equal(error.duplicate,true);assert.equal(s.mistakes,1);assert.equal(s.phase,'playing');
});
test('all-distinct wrong sums fail, and matching across runs cannot hide wrong down sums',()=>{
 const s=fresh(),values={...proofs[0].solutions[0],5:2};fill(s,values);press(s,{b:true});assert.ok(s.lastCheck.errors.length>0);assert.ok(s.lastCheck.errors.every(e=>!e.duplicate));assert.equal(s.mistakes,1);
 const t=fresh(),v={...proofs[0].solutions[0]},swap=v[5];v[5]=v[6];v[6]=swap;fill(t,v);assert.ok(t.runStatus.filter(r=>t.runs[r.id].direction==='across').every(r=>r.matched));press(t,{b:true});assert.ok(t.lastCheck.errors.every(e=>t.runs[e.run].direction==='down'));assert.equal(t.phase,'playing');
});
test('three complete wrong submissions naturally lose, one mistake per full check',()=>{
 const s=fresh(),wrong=Object.fromEntries(s.whiteCells.map(p=>[p,1]));fill(s,wrong);for(let n=1;n<=3;n++){press(s,{b:true});assert.equal(s.mistakes,n);assert.equal(s.checks,n);assert.ok(s.lastCheck.errors.length>1);}assert.equal(s.phase,'lost');assert.equal(s.reason,'mistakes');const before=copy(s);press(s,{a:true});assert.deepEqual(s,before);
});
test('after two errors normal edits clear stale highlights and third valid check wins',()=>{
 const s=fresh();fill(s,Object.fromEntries(s.whiteCells.map(p=>[p,1])));press(s,{b:true});press(s,{b:true});assert.equal(s.mistakes,2);const p=s.cursor;press(s,{a:true});assert.equal(s.lastCheck,null);assert.equal(s.mistakes,2);fill(s,proofs[0].solutions[0]);assert.equal(s.phase,'playing');press(s,{b:true});assert.equal(s.phase,'won');assert.equal(s.checks,3);assert.equal(s.mistakes,2);
});
test('B>A>direction priority consumes simultaneous edges and held A never repeats',()=>{
 const s=fresh(),p=s.cursor;step(s,{b:true,a:true,x:1});assert.equal(s.events[0].reason,'incomplete');assert.equal(s.cells[p],0);assert.equal(s.cursor,p);step(s,{a:true,x:1});assert.equal(s.cells[p],0);assert.equal(s.cursor,p);step(s);step(s,{a:true,x:1});assert.equal(s.cells[p],1);assert.equal(s.cursor,p);for(let k=0;k<8;k++)step(s,{a:true,x:1});assert.equal(s.cells[p],1);assert.equal(s.edits,1);
});
test('initial neutral and cancellation require release without changing entered numbers',()=>{
 const s=M.create(782,0);step(s,{a:true});assert.equal(s.edits,0);step(s,{cancelEpoch:0});step(s,{a:true});assert.equal(s.cells[s.cursor],1);step(s,{a:true,cancelEpoch:1});assert.equal(s.edits,1);assert.equal(s.inputArmed,false);step(s,{a:true,cancelEpoch:1});assert.equal(s.edits,1);step(s,{cancelEpoch:1});step(s,{a:true,cancelEpoch:1});assert.equal(s.cells[s.cursor],2);step(s,{b:true,cancelled:true});step(s,{b:true});assert.equal(s.checks,0);assert.equal(s.lastCommand,'none');step(s);step(s,{b:true});assert.equal(s.events[0].reason,'incomplete');
});
test('invalid dt, pause and hostile descriptors cannot edit or submit partially',()=>{
 const s=fresh(),before=copy(s);let reads=0;const i={};Object.defineProperty(i,'a',{get(){reads++;return true;}});for(const dt of [0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,i);assert.deepEqual(s,before);assert.equal(reads,0);step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);
 step(s,i);step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));for(const v of [null,[],true,17,'a',{a:1,x:Infinity}])step(s,v);assert.equal(s.edits,0);assert.equal(reads,0);step(s,{a:true});assert.equal(s.edits,1);
});
test('diagnostic saturation adds no gameplay deadline',()=>{
 const s=fresh();s.elapsed=M.config.maxElapsed-.1;s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;s.edits=M.config.maxCounter;press(s,{b:true});press(s,{a:true});step(s,{},.25);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);assert.equal(s.edits,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.phase,'playing');
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,uniqueSolutionCounts:proofs.map(p=>p.solutions.length),independentSearchNodes:proofs.map(p=>p.nodes),physicalTvTested:false,physicalPhoneTested:false},null,2));
