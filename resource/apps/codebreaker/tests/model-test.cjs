'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js');
const clone=v=>JSON.parse(JSON.stringify(v)),checks=[];
function test(name,fn){fn();checks.push(name);}
function step(s,input={},dt=1/60){assert.equal(M.step(s,dt,input),s);return s;}
function fresh(level=0,seed=761){const s=M.create(seed,level);step(s);return s;}
function tap(s,key){step(s);return step(s,{a:key==='a',b:key==='b',x:key==='right'?1:key==='left'?-1:0,y:key==='down'?1:key==='up'?-1:0});}
function go(s,cursor){while(s.cursor<cursor)tap(s,'right');while(s.cursor>cursor)tap(s,'left');}
function setGuess(s,guess){for(let i=0;i<4;i++){go(s,i);let steps=0;while(s.guess[i]!==guess[i]){tap(s,'up');assert.ok(++steps<=6);}}}
function submit(s,guess){setGuess(s,guess);tap(s,'a');}
function invariant(s){const l=M.config.layouts[s.level];assert.equal(s.guess.length,4);assert.ok(s.guess.every(v=>v===null||(Number.isInteger(v)&&v>=0&&v<l.symbols)));
 assert.equal(s.history.length,s.attemptsUsed);assert.equal(s.attemptsRemaining,l.attemptLimit-s.attemptsUsed);assert.ok(s.history.length<=l.attemptLimit);
 for(const row of s.history){assert.equal(row.guess.length,4);assert.ok(Number.isInteger(row.exact)&&Number.isInteger(row.misplaced)&&row.exact>=0&&row.misplaced>=0&&row.exact+row.misplaced<=4);}
 if(s.phase==='playing'){assert.equal(s.reveal,null);assert.ok(s.attemptsRemaining>0);assert.equal(s.score,0);}
}
(async()=>{
 const tools=await import('./puzzle-tools.mjs'),known=[];
 function solve(level,seed=761){const s=fresh(level,seed);while(s.phase==='playing'){const next=tools.planFromPublic(clone(s));submit(s,next.guess);invariant(s);}assert.equal(s.phase,'won');return s;}

 test('publicAPIandconfigexposenosecretorfeedbackoracle;identitynormalizationandinitialstatearefixed',()=>{
  assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.equal(M.config.slots,4);assert.equal(M.config.defaultSeed,761);
  assert.deepEqual(M.config.layouts.map(l=>[l.symbols,l.attemptLimit]),[[4,7],[5,8],[6,9]]);
  for(const seed of [undefined,null,-1,NaN,Infinity,4294967296,'1',.5])assert.equal(M.create(seed,0).seed,761);
  for(const level of [undefined,null,-1,NaN,Infinity,3,'1',.5])assert.equal(M.create(0,level).level,0);
  assert.equal(M.create(4294967295,2).seed,4294967295);
  const s=M.create(761,0);assert.deepEqual(s.guess,[null,null,null,null]);assert.deepEqual(s.history,[]);assert.equal(s.reveal,null);assert.equal(s.inputArmed,false);
  assert.deepEqual(Object.getOwnPropertySymbols(s),[]);assert.equal(Object.hasOwn(s,'secret'),false);assert.equal(Object.hasOwn(M.config,'secret'),false);
  assert.throws(()=>M.config.layouts[0].symbols=99,TypeError);
 });

 test('threeordinarywinsuseonlypublicfeedbackandretaincompleteboundedguesshistory',()=>{
  for(let level=0;level<3;level++){const s=solve(level);known[level]=s.guess.slice();assert.equal(s.score,100);assert.equal(s.reason,'');
   assert.deepEqual(s.reveal,s.guess);assert.equal(s.history.at(-1).exact,4);assert.equal(s.history.at(-1).misplaced,0);assert.equal(s.events[0].type,'win');
   assert.ok(s.history.slice(0,-1).every(row=>row.exact<4));assert.equal(s.terminalReceipt.cause,'success');}
 });

 test('duplicatemultisetfeedbackmatchesindependentarithmeticusingonlypreviouslyearnedanswers',()=>{
  let duplicateCases=0;
  for(let level=0;level<3;level++){const l=M.config.layouts[level],code=known[level];
   const guesses=Array.from({length:l.symbols},(_,symbol)=>Array(4).fill(symbol)).concat([code.slice().reverse(),[code[0],code[0],code[1],code[1]]]);
   for(const guess of guesses){const s=fresh(level);submit(s,guess);const expected=tools.feedback(code,guess),record=s.history[0];
    assert.equal(record.exact,expected.exact);assert.equal(record.misplaced,expected.misplaced);assert.ok(record.exact+record.misplaced<=4);
    assert.deepEqual(Object.keys(record).sort(),['attempt','exact','guess','misplaced']);if(new Set(guess).size<4)duplicateCases++;invariant(s);}
  }assert.ok(duplicateCases>=15);
 });

 test('allthreecorrectfinalattemptswinevenwhenattemptsremainingreacheszero',()=>{
  for(let level=0;level<3;level++){const s=fresh(level),bad=known[level].slice();bad[0]=(bad[0]+1)%M.config.layouts[level].symbols;
   while(s.attemptsRemaining>1){submit(s,bad);assert.equal(s.phase,'playing');assert.equal(s.reveal,null);}
   submit(s,known[level]);assert.equal(s.phase,'won');assert.equal(s.attemptsRemaining,0);assert.equal(s.score,100);assert.equal(s.history.at(-1).exact,4);invariant(s);}
 });

 test('naturalrepeatguesslossrevealsonlyatsettlementandterminalcallsneverreadinputs',()=>{
  for(let level=0;level<3;level++){const s=fresh(level),bad=known[level].slice();bad[0]=(bad[0]+1)%M.config.layouts[level].symbols;
   while(s.phase==='playing'){submit(s,bad);if(s.phase==='playing')assert.equal(s.reveal,null);}
   assert.equal(s.phase,'lost');assert.equal(s.reason,'attempts');assert.equal(s.score,0);assert.deepEqual(s.reveal,known[level]);assert.equal(s.attemptsRemaining,0);
   assert.equal(s.events[0].type,'collision');assert.equal(s.terminalReceipt.cause,'attempts');const before=clone(s);let reads=0;
   const raw=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('unexpected');}});step(s,raw);step(s,{a:true,b:true,y:1});assert.equal(reads,0);assert.deepEqual(s,before);invariant(s);}
 });

 test('incompleteandemptycleararefree;symbolwrapallowsduplicatesandclearingpreserveshistory',()=>{
  const s=fresh();tap(s,'a');assert.equal(s.events[0].reason,'incomplete');assert.equal(s.attemptsUsed,0);assert.equal(s.reveal,null);
  tap(s,'b');assert.equal(s.events[0].reason,'empty-slot');tap(s,'down');assert.equal(s.guess[0],3);tap(s,'up');assert.equal(s.guess[0],0);
  tap(s,'down');assert.equal(s.guess[0],3);tap(s,'b');assert.equal(s.guess[0],null);tap(s,'up');assert.equal(s.guess[0],0);
  submit(s,[0,0,1,1]);assert.equal(s.phase,'playing');const history=clone(s.history);tap(s,'b');assert.equal(s.guess[3],null);
  assert.deepEqual(s.history,history);assert.equal(s.attemptsUsed,1);tap(s,'a');assert.equal(s.attemptsUsed,1);assert.equal(s.events[0].reason,'incomplete');invariant(s);
 });

 test('snapshotclonesandforeignobjectsareobservationonlywithnohiddenoracleorstepaccess',()=>{
  const original=fresh(2),snapshot=clone(original),before=clone(snapshot);
  let reads=0;const raw=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('unexpected');}});
  assert.equal(M.step(snapshot,.1,raw),snapshot);assert.deepEqual(snapshot,before);assert.equal(reads,0);
  const foreign={phase:'playing',guess:known[2].slice(),level:2};const copy=clone(foreign);assert.equal(M.step(foreign,.1,{a:true}),foreign);assert.deepEqual(foreign,copy);
  const proxy=new Proxy(original,{});assert.equal(M.step(proxy,.1,{a:true}),proxy);assert.deepEqual(original,before);
  assert.equal(M.step(null,.1,{a:true}),null);assert.equal(M.step(7,.1,{a:true}),7);
 });

 test('freshsameseedroundsremainindependentandpublicreceiptarraysdonotalterprivatecodes',()=>{
  const solved=solve(0),answer=known[0].slice();assert.notEqual(solved.reveal,solved.guess);assert.notEqual(solved.history.at(-1).guess,solved.guess);
  solved.reveal[0]=(solved.reveal[0]+1)%4;solved.terminalReceipt.reveal[1]=99;solved.history[0].guess[0]=99;
  const next=fresh();submit(next,answer);assert.equal(next.phase,'won');assert.deepEqual(next.reveal,answer);
  next.terminalReceipt.guess.fill(99);assert.deepEqual(next.guess,answer);assert.deepEqual(next.history.at(-1).guess,answer);
 });

 test('boundedcursorheldbuttonsandB>A>directionpriorityconsumeonlyonenewedge',()=>{
  const s=fresh();tap(s,'left');assert.equal(s.cursor,0);assert.equal(s.events[0].reason,'boundary');go(s,3);tap(s,'right');assert.equal(s.cursor,3);
  setGuess(s,[0,0,1,1]);step(s);step(s,{a:true,b:true,y:-1});assert.equal(s.guess[3],null);assert.equal(s.attemptsUsed,0);
  step(s,{a:true,y:-1});assert.equal(s.guess[3],null);assert.equal(s.lastCommand,'none');
  step(s);step(s,{y:-1});assert.equal(s.guess[3],0);for(let i=0;i<20;i++)step(s,{y:-1});assert.equal(s.guess[3],0);
  step(s,{y:1});assert.equal(s.guess[3],3);step(s);step(s,{x:.5});assert.equal(s.lastCommand,'none');step(s,{x:-.51});assert.equal(s.cursor,2);
  step(s);step(s,{x:1,y:-1});assert.equal(s.cursor,2);assert.equal(s.lastCommand,'up');
 });

 test('initialneutralandpostepochreleasegateeditsclearsandsubmissions',()=>{
  const s=M.create(761,0);step(s,{y:-1});assert.deepEqual(s.guess,[null,null,null,null]);assert.equal(s.inputArmed,false);
  step(s);setGuess(s,[0,0,1,1]);step(s,{cancelEpoch:1});step(s,{cancelEpoch:2});assert.equal(s.inputArmed,false);
  step(s,{a:true,cancelEpoch:2});assert.equal(s.attemptsUsed,0);step(s,{cancelEpoch:2});step(s,{a:true,cancelled:true,cancelEpoch:2});
  assert.equal(s.attemptsUsed,0);step(s,{cancelled:true});step(s,{a:true});assert.equal(s.attemptsUsed,0);
  step(s);step(s,{a:true});assert.equal(s.attemptsUsed,1);
 });

 test('invaliddtandpausedareexactnoops;gettersinheritanceandpartialdescriptorsdonotcommand',()=>{
  const s=fresh(),before=clone(s);let reads=0;const bad=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('no');}});
  for(const dt of [0,-1,.251,NaN,Infinity,'0.1',null,{},undefined])M.step(s,dt,bad);assert.equal(reads,0);assert.deepEqual(s,before);
  step(s,{paused:true,y:-1,a:true});assert.deepEqual(s,before);let getters=0;const raw={};Object.defineProperty(raw,'y',{get(){getters++;return -1;}});
  step(s,raw);step(s,Object.create({y:-1,a:true}));assert.equal(getters,0);assert.deepEqual(s.guess,[null,null,null,null]);
  for(const input of [null,[],true,'a',1,{y:Infinity,a:1}])step(s,input);
  const partial=new Proxy({y:-1},{getOwnPropertyDescriptor(t,k){if(k==='cancelled')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}});
  step(s,partial);assert.deepEqual(s.guess,[null,null,null,null]);step(s,{y:-1});assert.equal(s.guess[0],0);
 });

 test('syntheticcounterandelapsedcapsremainfinitewithouthistorygrowthorsecretfeedback',()=>{
  const s=fresh();s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;s.edits=M.config.maxCounter;s.clears=M.config.maxCounter;s.elapsed=M.config.maxElapsed;
  tap(s,'a');tap(s,'up');tap(s,'b');assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);
  assert.equal(s.edits,M.config.maxCounter);assert.equal(s.clears,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);
  assert.deepEqual(s.history,[]);assert.equal(s.attemptsUsed,0);assert.equal(s.reveal,null);
 });
 console.log(JSON.stringify({passed:true,cases:checks.length,checks,physicalTvTested:false,physicalPhoneTested:false},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
