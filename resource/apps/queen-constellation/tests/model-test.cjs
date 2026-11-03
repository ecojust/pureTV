'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');const checks=[];
const clone=v=>JSON.parse(JSON.stringify(v));
function test(name,fn){fn();checks.push(name);}
function step(s,input={},dt=1/60){assert.equal(M.step(s,dt,input),s);return s;}
function fresh(level=0){const s=M.create(757,level);step(s);return s;}
function tap(s,key){step(s);return step(s,{a:key==='a',b:key==='b',x:key==='right'?1:key==='left'?-1:0,y:key==='down'?1:key==='up'?-1:0});}
function go(s,id){const n=M.config.layouts[s.level].size,row=Math.floor(id/n),col=id%n;
 while(Math.floor(s.cursor/n)<row)tap(s,'down');while(Math.floor(s.cursor/n)>row)tap(s,'up');
 while(s.cursor%n<col)tap(s,'right');while(s.cursor%n>col)tap(s,'left');assert.equal(s.cursor,id);}
function put(s,id){go(s,id);tap(s,'a');}
function solve(l){const answers=[];function search(row,columns){
 if(row===l.size){answers.push(columns.map((col,r)=>r*l.size+col));return;}
 const fixed=l.fixed.filter(id=>Math.floor(id/l.size)===row).map(id=>id%l.size);
 for(const col of fixed.length?fixed:Array.from({length:l.size},(_,i)=>i)){
  if(l.blocked.includes(row*l.size+col)||columns.includes(col)||columns.some((c,r)=>Math.abs(col-c)===row-r))continue;
  search(row+1,columns.concat(col));
 }
}search(0,[]);return answers;}
function fill(s,ids){const l=M.config.layouts[s.level];for(const id of ids)if(!l.fixed.includes(id))put(s,id);}
function invariant(s){const l=M.config.layouts[s.level];
 assert.equal(s.queens.length,l.size*l.size);assert.ok(s.queens.every(v=>typeof v==='boolean'));assert.equal(s.queenCount,s.queens.filter(Boolean).length);
 assert.ok(s.queenCount<=l.size);assert.equal(s.movableCount,s.queenCount-l.fixed.length);assert.ok(l.fixed.every(i=>s.queens[i]));assert.ok(l.blocked.every(i=>!s.queens[i]));
 assert.equal(s.submissions,3-s.checksRemaining);assert.equal(s.checkReceipts.length,s.submissions);assert.ok(s.checkReceipts.length<=3);
}

test('fixedvisibleclues/identitiesandfreshstatearedetachedandconfigurationdeeplyfrozen',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);
 assert.deepEqual(M.config.layouts.map(l=>[l.size,l.blocked,l.fixed]),[[6,[0,5,14],[]],[7,[0,6,42,48,24],[22]],[8,[0,7,56,63,27],[20,40]]]);
 for(const seed of [undefined,null,-1,NaN,Infinity,4294967296,'1',.5])assert.equal(M.create(seed,0).seed,757);
 for(const level of [undefined,null,-1,NaN,Infinity,3,'1',.5])assert.equal(M.create(0,level).level,0);
 assert.equal(M.create(4294967295,2).seed,4294967295);
 const a=M.create(0,2),b=M.create(0,2);a.queens.fill(false);assert.equal(b.queenCount,2);assert.ok(b.queens[20]);assert.ok(b.queens[40]);assert.equal(b.inputArmed,false);
 assert.throws(()=>M.config.layouts[2].fixed.push(0),TypeError);assert.throws(()=>M.config.layouts[0].size=99,TypeError);
});

test('allpublicsolutions(4/2/1)winonlyafteractualBsubmission',()=>{
 M.config.layouts.forEach((l,level)=>{const solutions=solve(l);assert.equal(solutions.length,[4,2,1][level]);
  for(const ids of solutions){const s=fresh(level);fill(s,ids);invariant(s);assert.equal(s.canSubmit,true);assert.equal(s.phase,'playing');assert.equal(s.score,0);
   for(let i=0;i<90;i++)step(s);assert.equal(s.phase,'playing');assert.equal(s.submissions,0);
   tap(s,'b');assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.reason,'');assert.equal(s.checksRemaining,2);assert.equal(s.events[0].type,'win');assert.equal(s.terminalReceipt.cause,'success');invariant(s);}
 });
});

test('allthreeboardsacceptacorrectlastcheckbeforebudgetexhaustion',()=>{
 M.config.layouts.forEach((l,level)=>{const s=fresh(level);tap(s,'b');tap(s,'b');assert.equal(s.phase,'playing');assert.equal(s.checksRemaining,1);
  fill(s,solve(l)[0]);tap(s,'b');assert.equal(s.phase,'won');assert.equal(s.checksRemaining,0);assert.equal(s.submissions,3);assert.deepEqual(s.checkReceipts.map(r=>r.outcome),['playing','playing','won']);invariant(s);});
});

test('threeordinaryfailedcheckslosewhilepreservingplacementsandterminalcallsneverreadinput',()=>{
 const s=fresh();put(s,1);put(s,2);const placed=s.queens.slice();for(let i=1;i<=3;i++){tap(s,'b');assert.equal(s.submissions,i);assert.deepEqual(s.queens,placed);}
 assert.equal(s.phase,'lost');assert.equal(s.reason,'checks');assert.equal(s.score,0);assert.equal(s.checksRemaining,0);assert.equal(s.events[0].type,'collision');
 const before=clone(s);let reads=0;const raw=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('unexpected');}});
 step(s,raw);step(s,{a:true,b:true,y:1});assert.equal(reads,0);assert.deepEqual(s,before);invariant(s);
});

test('rowscolumnsandbothdiagonalsarevisibleconflictswhilelegalnonattackingpairisclear',()=>{
 for(const [a,b,kind]of [[1,2,'row'],[1,7,'column'],[1,8,'diagonal'],[2,7,'diagonal']]){
  const s=fresh();put(s,a);put(s,b);assert.deepEqual(s.conflicts,[{a,b,kind}]);assert.equal(s.canSubmit,false);assert.equal(s.checksRemaining,3);assert.equal(s.phase,'playing');
 }
 const s=fresh();put(s,1);put(s,9);assert.deepEqual(s.conflicts,[]);assert.equal(s.canSubmit,false);assert.equal(s.queenCount,2);
});

test('fixedforbiddenandqueenlimitblocksarefree;atcapremovalstillworks',()=>{
 const s=fresh(2),l=M.config.layouts[2];put(s,l.fixed[0]);assert.equal(s.events[0].reason,'fixed');assert.ok(s.queens[l.fixed[0]]);
 put(s,l.blocked[0]);assert.equal(s.events[0].reason,'forbidden');assert.equal(s.queens[l.blocked[0]],false);
 const free=Array.from({length:l.size*l.size},(_,i)=>i).filter(i=>!l.fixed.includes(i)&&!l.blocked.includes(i));
 for(const id of free.slice(0,6))put(s,id);assert.equal(s.queenCount,8);assert.equal(s.movableCount,6);
 put(s,free[6]);assert.equal(s.events[0].reason,'queen-limit');assert.equal(s.queens[free[6]],false);assert.equal(s.checksRemaining,3);
 put(s,free[0]);assert.equal(s.events[0].type,'remove');assert.equal(s.queenCount,7);put(s,free[6]);assert.equal(s.queenCount,8);invariant(s);
});

test('failedsubmissioncanberepairedandvalidarrangementcanbechangedbeforemanualchecking',()=>{
 const s=fresh(),l=M.config.layouts[0],solution=solve(l)[0];put(s,1);put(s,2);tap(s,'b');assert.equal(s.checksRemaining,2);
 put(s,2);for(const id of solution)if(!s.queens[id])put(s,id);assert.equal(s.canSubmit,true);assert.equal(s.phase,'playing');
 put(s,solution[0]);assert.equal(s.canSubmit,false);assert.equal(s.phase,'playing');assert.equal(s.checksRemaining,2);
 put(s,solution[0]);tap(s,'b');assert.equal(s.phase,'won');assert.equal(s.checksRemaining,1);invariant(s);
});

test('navigationboundedheldedgessuppressedandB>A>directionconsumedonce',()=>{
 const s=fresh();tap(s,'left');tap(s,'up');assert.equal(s.cursor,0);assert.equal(s.events[0].reason,'boundary');
 go(s,35);tap(s,'right');tap(s,'down');assert.equal(s.cursor,35);go(s,1);
 step(s);step(s,{a:true,b:true,x:1});assert.equal(s.submissions,1);assert.equal(s.queens[1],false);assert.equal(s.cursor,1);
 step(s,{a:true,x:1});assert.equal(s.queens[1],false);assert.equal(s.lastCommand,'none');
 step(s);step(s,{a:true,x:1});assert.equal(s.queens[1],true);assert.equal(s.cursor,1);for(let i=0;i<20;i++)step(s,{a:true});assert.equal(s.queens[1],true);
 step(s);step(s,{x:.5});assert.equal(s.cursor,1);step(s,{x:.51});assert.equal(s.cursor,2);for(let i=0;i<10;i++)step(s,{x:1});assert.equal(s.cursor,2);
 step(s,{x:-1});assert.equal(s.cursor,1);step(s,{x:1,y:1});assert.equal(s.cursor,7);assert.equal(s.lastCommand,'down');
});

test('initialneutralandpostcancellationreleasegatebothplacementandsubmission',()=>{
 const s=M.create(0,0);step(s,{b:true});assert.equal(s.submissions,0);assert.equal(s.inputArmed,false);
 step(s);step(s,{x:1,cancelEpoch:1});assert.equal(s.cursor,1);step(s);step(s,{a:true,cancelEpoch:1});assert.equal(s.queens[1],true);
 step(s,{cancelEpoch:2});assert.equal(s.inputArmed,false);step(s,{b:true,cancelEpoch:2});assert.equal(s.submissions,0);
 step(s,{cancelEpoch:2});step(s,{b:true,cancelEpoch:2,cancelled:true});assert.equal(s.submissions,0);assert.equal(s.inputArmed,false);
 step(s,{cancelled:true});step(s,{b:true});assert.equal(s.submissions,0);step(s);step(s,{b:true});assert.equal(s.submissions,1);
});

test('invaliddtandpausedexactnoops;malformedinputdoesnotinvokegettersorinheritance',()=>{
 const s=fresh();let reads=0;const before=clone(s),bad=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('unexpected');}});
 for(const dt of [0,-1,.251,NaN,Infinity,'0.1',null,{},undefined])M.step(s,dt,bad);assert.equal(reads,0);assert.deepEqual(s,before);
 step(s,{paused:true,b:true,x:1});assert.deepEqual(s,before);let getters=0;const raw={};Object.defineProperty(raw,'b',{get(){getters++;return true;}});
 step(s,raw);step(s,Object.create({b:true,x:1}));assert.equal(getters,0);assert.equal(s.submissions,0);assert.equal(s.cursor,0);
 for(const value of [null,[],true,1,'b',{b:1,x:Infinity,y:NaN}])step(s,value);
 const partial=new Proxy({b:true},{getOwnPropertyDescriptor(t,k){if(k==='cancelled')throw Error('no');return Object.getOwnPropertyDescriptor(t,k);}});
 step(s,partial);assert.equal(s.submissions,0);step(s,{b:true});assert.equal(s.submissions,1);
});

test('syntheticstalederivedflagscannotwin;checkandterminalreceiptsaredetachedandcountersbounded',()=>{
 const s=fresh();s.canSubmit=true;s.queenCount=6;s.conflicts=[];tap(s,'b');assert.equal(s.phase,'playing');assert.equal(s.queenCount,0);assert.equal(s.canSubmit,false);
 // Above is a deliberately corrupted derived-cache probe, not ordinary play.
 const win=fresh();tap(win,'b');fill(win,solve(M.config.layouts[0])[0]);tap(win,'b');const actual=win.queens.slice();
 win.checkReceipts[0].queens[0]=true;win.terminalReceipt.queens.fill(false);assert.deepEqual(win.queens,actual);assert.deepEqual(win.checkReceipts[1].queens,actual);
 const capped=fresh();capped.calls=M.config.maxCounter;capped.blockedActions=M.config.maxCounter;capped.elapsed=M.config.maxElapsed;capped.placements=M.config.maxCounter;capped.removals=M.config.maxCounter;
 tap(capped,'a');assert.equal(capped.blockedActions,M.config.maxCounter);put(capped,1);put(capped,1);
 assert.equal(capped.calls,M.config.maxCounter);assert.equal(capped.placements,M.config.maxCounter);assert.equal(capped.removals,M.config.maxCounter);assert.equal(capped.elapsed,M.config.maxElapsed);assert.equal(capped.elapsedCapped,true);
});
console.log(JSON.stringify({passed:true,cases:checks.length,checks,physicalTvTested:false,physicalPhoneTested:false},null,2));
