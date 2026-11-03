'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js'),{solve,apply}=require('./expression-search.cjs');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x)),proofs=M.config.layouts.map(l=>solve(l.cards)),integerProof=solve(M.config.layouts[2].cards,true);
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){M.step(s,dt,i);}
function fresh(level=0){const s=M.create(799,level);step(s);return s;}
function press(s,i){step(s);step(s,i);}
function choose(s,mask){for(let guard=0;s.terms[s.cursor].mask!==mask;guard++){assert.ok(guard<5);press(s,{x:1});}press(s,{a:true});}
function merge(s,first,second,op){assert.equal(s.stage,'first');choose(s,first);choose(s,second);for(let guard=0;s.opIndex!==op;guard++){assert.ok(guard<6);press(s,{x:1});}press(s,{a:true});}
function conserve(s){let union=0;for(const t of s.terms){assert.equal(t.id,t.mask);assert.equal(t.mask&union,0);union|=t.mask;assert.ok(Number.isSafeInteger(t.n)&&Number.isSafeInteger(t.d)&&t.d>0);const letters=t.expr.match(/[ABCD]/g)||[];assert.equal(new Set(letters).size,letters.length);let exprMask=0;for(const l of letters)exprMask|=1<<(l.charCodeAt(0)-65);assert.equal(exprMask,t.mask);}assert.equal(union,15);assert.ok(s.history.length<=3);assert.ok(s.attemptHistory.length<=3);}
function run(s,proof){for(const p of proof.route){merge(s,p.first,p.second,p.op);conserve(s);const t=s.lastOperation.result;assert.equal(t.n,p.result.n);assert.equal(t.d,p.result.d);}}
function sumWrong(s){while(s.terms.length>1)merge(s,s.terms[0].mask,s.terms[1].mask,0);assert.notEqual(s.terms[0].n,24*s.terms[0].d);}
test('three public card sets solve via exact BigInt search and the final one requires fractional intermediates',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.ok(proofs.every(p=>p.route&&p.route.length===3));assert.equal(integerProof.route,null);assert.ok(proofs[2].route.some(p=>p.result.d!==1));assert.ok(integerProof.visited>100);assert.ok(BigInt(integerProof.maxAbsNumerator)<BigInt(Number.MAX_SAFE_INTEGER));assert.ok(M.config.layouts.every(l=>!('route'in l)&&!('solution'in l)));
});
test('deep frozen configuration, normalized identities and distinct sources for equal-valued original cards',()=>{
 const a=M.create(-1,-1),b=M.create(799,0);assert.equal(a.seed,799);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.cards[0]=99;a.terms[0].n=99;assert.equal(b.cards[0],1);assert.equal(b.terms[0].n,1);assert.throws(()=>M.config.layouts[0].cards[0]=99,TypeError);const c=fresh(2);assert.equal(c.terms[0].n,c.terms[1].n);assert.notEqual(c.terms[0].mask,c.terms[1].mask);assert.equal(M.create(4294967295,2).seed,4294967295);conserve(c);
});
test('all three fresh games win by ordinary selection/operator inputs, conserving every source bit',()=>{
 proofs.forEach((proof,level)=>{const s=fresh(level);run(s,proof);assert.equal(s.phase,'won');assert.equal(s.reason,'twenty-four');assert.equal(s.score,100);assert.equal(s.terms.length,1);assert.equal(s.terms[0].mask,15);assert.equal(s.terms[0].n,24);assert.equal(s.terms[0].d,1);assert.equal(s.mergesUsed,3);assert.equal(s.lastAttempt.correct,true);assert.notEqual(s.terminalReceipt.terms,s.terms);assert.notEqual(s.lastAttempt,s.attemptHistory[0]);const before=copy(s);step(s,{a:true,b:true,x:1,cancelEpoch:9});assert.deepEqual(s,before);});
});
test('all six visible operators implement exact L/R direction and stable surviving term order',()=>{
 for(let op=0;op<6;op++){const s=fresh(2),expected=apply({n:3n,d:1n},{n:8n,d:1n},op);merge(s,1,4,op);const t=s.terms.at(-1);assert.equal(t.n,Number(expected.n));assert.equal(t.d,Number(expected.d));assert.deepEqual(s.terms.map(t=>t.mask),[2,8,5]);assert.equal(s.lastOperation.first.mask,1);assert.equal(s.lastOperation.second.mask,4);assert.equal(s.lastOperation.left.mask,op===2||op===5?4:1);assert.equal(s.lastOperation.right.mask,op===2||op===5?1:4);assert.equal(s.cursor,2);conserve(s);}
});
test('negative rational numerators, positive denominators and exact reduction survive successive ordinary merges',()=>{
 const s=fresh(2);merge(s,1,4,4);assert.deepEqual([s.terms.at(-1).n,s.terms.at(-1).d],[3,8]);merge(s,5,2,1);assert.deepEqual([s.terms.at(-1).n,s.terms.at(-1).d],[-21,8]);assert.equal(s.terms.at(-1).expr,'((A/C)-B)');merge(s,7,8,3);assert.deepEqual([s.terms[0].n,s.terms[0].d],[-21,1]);assert.equal(s.stage,'retry');conserve(s);
 const t=fresh(2);merge(t,1,2,1);assert.deepEqual([t.terms.at(-1).n,t.terms.at(-1).d],[0,1]);
});
test('both division directions reject actual zero divisors freely while zero numerators remain legal',()=>{
 for(const reversed of[false,true]){const s=fresh(2);merge(s,1,2,1);choose(s,reversed?3:4);choose(s,reversed?4:3);for(let k=0;k<(reversed?5:4);k++)press(s,{x:1});const before={terms:copy(s.terms),history:copy(s.history),merges:s.mergesUsed,tickets:s.undoTickets};press(s,{a:true});assert.equal(s.events[0].reason,'zero-divisor');assert.equal(s.stage,'operator');assert.deepEqual(s.terms,before.terms);assert.deepEqual(s.history,before.history);assert.equal(s.mergesUsed,before.merges);assert.equal(s.undoTickets,before.tickets);assert.equal(s.failures,0);press(s,{b:true});merge(s,3,4,4);assert.deepEqual([s.terms.at(-1).n,s.terms.at(-1).d],[0,1]);}
});
test('B cancels the whole pending pair free before it can undo an earlier merge',()=>{
 const s=fresh();merge(s,1,2,0);const terms=copy(s.terms);choose(s,3);press(s,{b:true});assert.equal(s.stage,'first');assert.deepEqual(s.terms,terms);assert.equal(s.undoTickets,2);assert.equal(s.terms[s.cursor].mask,3);choose(s,3);choose(s,4);press(s,{b:true});assert.equal(s.stage,'first');assert.equal(s.firstMask,null);assert.equal(s.secondMask,null);assert.equal(s.opIndex,0);assert.equal(s.undoTickets,2);press(s,{b:true});assert.equal(s.undoTickets,1);assert.equal(s.terms.length,4);assert.equal(s.mergesUsed,1);conserve(s);
});
test('two global undo tickets restore numbers/history but never refund successful merge counts',()=>{
 const s=fresh();press(s,{b:true});assert.equal(s.events[0].reason,'no-history');for(let k=0;k<2;k++){merge(s,1,2,0);press(s,{b:true});assert.equal(s.terms.length,4);assert.equal(s.mergesUsed,k+1);assert.equal(s.undoTickets,1-k);}merge(s,1,2,0);const before=copy(s.terms);press(s,{b:true});assert.equal(s.events[0].reason,'no-tickets');assert.deepEqual(s.terms,before);assert.equal(s.mergesUsed,3);choose(s,3);press(s,{b:true});assert.equal(s.stage,'first');assert.equal(s.undoUsed,2);
});
test('undo of a failed complete result keeps its failed chance spent and a corrected operation can win',()=>{
 const s=fresh();merge(s,1,2,3);merge(s,4,8,3);merge(s,3,12,0);assert.equal(s.terms[0].n,14);assert.equal(s.failures,1);assert.equal(s.stage,'retry');assert.equal(s.currentAttempt,1);press(s,{b:true});assert.equal(s.failures,1);assert.equal(s.attemptsRemaining,2);assert.equal(s.currentAttempt,2);assert.equal(s.undoTickets,1);assert.equal(s.mergesUsed,3);assert.equal(s.attemptHistory.length,1);merge(s,3,12,3);assert.equal(s.phase,'won');assert.equal(s.currentAttempt,2);assert.equal(s.mergesUsed,4);assert.equal(s.failures,1);assert.equal(s.attemptHistory.length,2);
});
test('fresh retry clears old undo history without replenishing tickets or refunding attempts/merges',()=>{
 const s=fresh();merge(s,1,2,0);press(s,{b:true});sumWrong(s);const merges=s.mergesUsed;assert.equal(s.failures,1);press(s,{a:true});assert.equal(s.stage,'first');assert.equal(s.terms.length,4);assert.equal(s.currentAttempt,2);assert.equal(s.history.length,0);assert.equal(s.undoTickets,1);assert.equal(s.mergesUsed,merges);assert.equal(s.failures,1);press(s,{b:true});assert.equal(s.events[0].reason,'no-history');assert.equal(s.undoTickets,1);
});
test('a partial24 cannot win until the unused original card is also consumed',()=>{
 const s=fresh();merge(s,2,4,3);merge(s,6,8,3);assert.equal(s.terms.at(-1).n,24);assert.equal(s.terms.at(-1).mask,14);assert.equal(s.terms.length,2);assert.equal(s.phase,'playing');assert.equal(s.attemptHistory.length,0);merge(s,14,1,3);assert.equal(s.phase,'won');assert.equal(s.terms[0].mask,15);
});
test('all three levels naturally lose after three complete wrong additions and freeze retry/undo',()=>{
 for(let level=0;level<3;level++){const s=fresh(level);for(let n=1;n<=3;n++){sumWrong(s);assert.equal(s.failures,n);assert.equal(s.attemptsRemaining,3-n);if(n<3){assert.equal(s.stage,'retry');press(s,{a:true});}}assert.equal(s.phase,'lost');assert.equal(s.reason,'attempts');assert.equal(s.mergesUsed,9);assert.equal(s.attemptHistory.length,3);const before=copy(s);press(s,{b:true});assert.deepEqual(s,before);}
});
test('a correct third fresh attempt wins on every puzzle with two prior failures retained',()=>{
 proofs.forEach((proof,level)=>{const s=fresh(level);for(let n=0;n<2;n++){sumWrong(s);press(s,{a:true});}run(s,proof);assert.equal(s.phase,'won');assert.equal(s.currentAttempt,3);assert.equal(s.failures,2);assert.equal(s.attemptsRemaining,1);assert.equal(s.mergesUsed,9);assert.equal(s.attemptHistory.length,3);});
});
test('left/right wrap, second-choice exclusion, ignored vertical inputs and B>A priority consume edges',()=>{
 const s=fresh();press(s,{x:-1});assert.equal(s.cursor,3);press(s,{y:-1});assert.equal(s.cursor,3);choose(s,8);for(let k=0;k<7;k++){press(s,{x:1});assert.notEqual(s.terms[s.cursor].mask,8);}step(s);step(s,{a:true,b:true,x:1});assert.equal(s.stage,'first');assert.equal(s.firstMask,null);const cursor=s.cursor;step(s,{a:true,x:1});assert.equal(s.stage,'first');assert.equal(s.cursor,cursor);step(s);step(s,{a:true,x:1});assert.equal(s.stage,'second');for(let k=0;k<5;k++)step(s,{a:true,x:1});assert.equal(s.stage,'second');assert.equal(s.mergesUsed,0);
});
test('initial neutral, pause and cancellation release-gating preserve current selected operands',()=>{
 const s=M.create(799,0);step(s,{a:true});assert.equal(s.stage,'first');step(s,{cancelEpoch:0});step(s,{a:true});assert.equal(s.stage,'second');const before=copy(s);step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);step(s,{a:true,cancelEpoch:1});assert.equal(s.stage,'second');assert.equal(s.inputArmed,false);step(s,{a:true,cancelEpoch:1});assert.equal(s.stage,'second');step(s,{cancelEpoch:1});step(s,{a:true,cancelEpoch:1});assert.equal(s.stage,'operator');step(s,{b:true,cancelled:true});step(s,{b:true});assert.equal(s.stage,'operator');step(s);step(s,{b:true});assert.equal(s.stage,'first');
});
test('invalid dt/hostile descriptors, labelled arithmetic precision boundary and diagnostic saturation are safe',()=>{
 const s=fresh(),before=copy(s);let reads=0;const getter={};Object.defineProperty(getter,'a',{get(){reads++;return true;}});for(const dt of[0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,getter);assert.deepEqual(s,before);assert.equal(reads,0);step(s,getter);step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));assert.equal(s.stage,'first');assert.equal(reads,0);
 s.terms[0].n=Number.MAX_SAFE_INTEGER;merge(s,1,2,3);assert.equal(s.events[0].reason,'arithmetic-limit');assert.equal(s.mergesUsed,0);assert.equal(s.history.length,0);assert.equal(s.failures,0);s.elapsed=M.config.maxElapsed-.01;s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;press(s,{a:true});assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,normalSearchStates:proofs.map(p=>p.visited),fractionRequired:{cards:[3,3,8,8],integerOnlySolutions:0,exhaustedStates:integerProof.visited,witnessUsesFraction:proofs[2].route.some(p=>p.result.d!==1)},physicalTvTested:false,physicalPhoneTested:false},null,2));
