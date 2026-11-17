'use strict';
const assert=require('node:assert/strict');const M=require('../src/main/assets/game-model.js');const checks=[];
const clone=x=>JSON.parse(JSON.stringify(x));const positions=[];for(let r=0;r<5;r++)for(let c=0;c<=r;c++)positions.push([r,c]);
function at(r,c){return positions.findIndex(p=>p[0]===r&&p[1]===c);}
const triples=[];for(let from=0;from<15;from++)for(const [dr,dc]of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1]]){
 const [r,c]=positions[from],over=at(r+dr,c+dc),to=at(r+dr*2,c+dc*2);if(over>=0&&to>=0)triples.push({from,over,to});
}
const count=mask=>mask.toString(2).replace(/0/g,'').length;
function moves(mask){return triples.filter(j=>(mask&(1<<j.from))&&(mask&(1<<j.over))&&!(mask&(1<<j.to)));}
function after(mask,j){return mask^((1<<j.from)|(1<<j.over)|(1<<j.to));}
function route(blank,win=true){const memo=new Set();function dfs(mask){
 const next=moves(mask);if(win&&count(mask)===1)return[];if(!win&&!next.length&&count(mask)>1)return[];if(memo.has(mask))return null;
 memo.add(mask);for(const j of next){const out=dfs(after(mask,j));if(out!==null)return[j,...out];}return null;
}const result=dfs(32767^(1<<blank));assert.ok(result);assert.ok(memo.size<=32768);return result;}
function test(name,fn){fn();checks.push(name);}
function step(s,input={},dt=1/60){assert.equal(M.step(s,dt,input),s);return s;}
function fresh(level=0){const s=M.create(753,level);step(s);return s;}
function tap(s,key){step(s);return step(s,{a:key==='a',b:key==='b',x:key==='right'?1:key==='left'?-1:0,y:key==='down'?1:key==='up'?-1:0});}
function go(s,to){const [row,col]=positions[to];while(positions[s.cursor][0]<row)tap(s,'down');while(positions[s.cursor][0]>row)tap(s,'up');while(positions[s.cursor][1]<col)tap(s,'right');while(positions[s.cursor][1]>col)tap(s,'left');assert.equal(s.cursor,to);}
function jump(s,j){go(s,j.from);tap(s,'a');go(s,j.to);tap(s,'a');}
function invariant(s){assert.equal(s.occupied.length,15);assert.ok(s.occupied.every(v=>typeof v==='boolean'));assert.equal(s.occupied.filter(Boolean).length,s.pegsRemaining);
 assert.equal(s.pegsRemaining,14-s.jumpsMade+s.undosUsed);assert.equal(s.history.length,14-s.pegsRemaining);assert.ok(s.history.length<=13);assert.equal(s.undoRemaining,3-s.undosUsed);
 assert.ok(s.jumpsMade<=16);const mask=s.occupied.reduce((n,v,i)=>n|(v?1<<i:0),0);assert.deepEqual(s.legalJumps,moves(mask));}

test('fixed lattice, all36publicjumptriples, openings, identity normalization and independent immutable data',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.equal(M.config.positions.length,15);assert.equal(triples.length,36);assert.deepEqual(M.config.jumps,triples);
 assert.deepEqual(M.config.layouts.map(l=>l.blank),[0,4,7]);assert.deepEqual(M.config.positions.map(p=>[p.row,p.col]),positions);
 for(const seed of [undefined,null,-1,NaN,Infinity,4294967296,'1',.5])assert.equal(M.create(seed,0).seed,753);
 for(const level of [undefined,null,-1,NaN,Infinity,3,'1',.5])assert.equal(M.create(0,level).level,0);
 assert.equal(M.create(4294967295,2).seed,4294967295);const a=M.create(0,0),b=M.create(0,0);a.occupied[0]=true;a.legalJumps[0].to=99;
 assert.equal(b.occupied[0],false);assert.notEqual(b.legalJumps[0].to,99);assert.equal(b.inputArmed,false);
 assert.throws(()=>M.config.jumps[0].to=99,TypeError);assert.throws(()=>M.config.layouts.push({}),TypeError);
});

test('threeordinary13jumpwins cover allsixlatticedirections and preservepeg/historyinvariants',()=>{
 const directions=new Set();M.config.layouts.forEach((layout,level)=>{
  const s=fresh(level),path=route(layout.blank);assert.equal(path.length,13);
  for(const j of path){const before=s.occupied.slice();jump(s,j);invariant(s);assert.equal(s.source,null);assert.equal(s.cursor,j.to);
   assert.equal(before[j.from],true);assert.equal(before[j.over],true);assert.equal(before[j.to],false);assert.equal(s.occupied[j.from],false);assert.equal(s.occupied[j.over],false);assert.equal(s.occupied[j.to],true);
   directions.add((positions[j.to][0]-positions[j.from][0])+','+(positions[j.to][1]-positions[j.from][1]));}
  assert.equal(s.phase,'won');assert.equal(s.reason,'');assert.equal(s.score,100);assert.equal(s.pegsRemaining,1);assert.equal(s.undoRemaining,3);assert.equal(s.events[0].type,'win');assert.equal(s.terminalReceipt.cause,'success');
 });assert.equal(directions.size,6);
});

test('emptyselectionandinvalidadjacent/same/occupiedlandings arefree andretain source',()=>{
 const s=fresh();tap(s,'a');assert.equal(s.events[0].reason,'empty-source');assert.equal(s.source,null);
 go(s,3);tap(s,'a');assert.equal(s.source,3);const before=s.occupied.slice();
 for(const to of [3,1,4,5]){go(s,to);tap(s,'a');assert.equal(s.events[0].reason,'invalid-jump');assert.equal(s.source,3);assert.deepEqual(s.occupied,before);assert.equal(s.jumpsMade,0);assert.equal(s.undoRemaining,3);}
 go(s,0);tap(s,'a');assert.equal(s.jumpsMade,1);assert.equal(s.source,null);invariant(s);
});

test('Bfirstcancelsselectionfree thenundo restoresbothpegsand spends exactlyonecredit',()=>{
 const s=fresh();tap(s,'b');assert.equal(s.events[0].reason,'no-history');assert.equal(s.undoRemaining,3);
 const first=route(0)[0];jump(s,first);const played=s.occupied.slice();go(s,first.to);tap(s,'a');tap(s,'b');
 assert.equal(s.events[0].type,'cancel');assert.equal(s.source,null);assert.deepEqual(s.occupied,played);assert.equal(s.undoRemaining,3);assert.equal(s.jumpsMade,1);
 tap(s,'b');assert.equal(s.events[0].type,'undo');assert.equal(s.undoRemaining,2);assert.equal(s.undosUsed,1);assert.equal(s.jumpsMade,1);assert.equal(s.cursor,first.from);assert.equal(s.source,null);
 assert.deepEqual(s.occupied,M.create(753,0).occupied);assert.equal(s.history.length,0);invariant(s);
 tap(s,'b');assert.equal(s.events[0].reason,'no-history');assert.equal(s.undoRemaining,2);
});

test('naturaldeadendsstayrecoverableuntilallthreeundosspent thenloseandrejectfurtherinput',()=>{
 M.config.layouts.forEach((layout,level)=>{
  const path=route(layout.blank,false),s=fresh(level);for(const j of path)jump(s,j);
  assert.ok(s.pegsRemaining>1);assert.equal(s.legalJumps.length,0);assert.equal(s.phase,'playing');assert.match(s.message,/B/);
  for(let n=1;n<=3;n++){tap(s,'b');assert.equal(s.undoRemaining,3-n);assert.ok(s.legalJumps.length>0);assert.equal(s.phase,'playing');jump(s,path.at(-1));invariant(s);assert.equal(s.phase,n===3?'lost':'playing');}
  assert.equal(s.score,0);assert.equal(s.reason,'dead-end');assert.equal(s.terminalReceipt.cause,'dead-end');const before=clone(s);
  let reads=0;const raw=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('unexpected');}});step(s,raw);step(s,{a:true,b:true,x:1});assert.equal(reads,0);assert.deepEqual(s,before);
 });
});

test('ordinarylastcreditwin and zero-creditfreeblockedundo whilemovesstillavailable',()=>{
 const s=fresh(),path=route(0);for(let i=0;i<3;i++){jump(s,path[0]);tap(s,'b');}
 assert.equal(s.undoRemaining,0);assert.equal(s.phase,'playing');jump(s,path[0]);tap(s,'b');assert.equal(s.events[0].reason,'no-undo');assert.equal(s.phase,'playing');
 for(const j of path.slice(1))jump(s,j);assert.equal(s.phase,'won');assert.equal(s.jumpsMade,16);assert.equal(s.undosUsed,3);assert.equal(s.score,100);invariant(s);
});

test('cursornavigation reachesallholes and clampsdeterministicallywithoutjumping',()=>{
 const s=fresh();for(let i=0;i<15;i++)go(s,i);go(s,0);tap(s,'up');assert.equal(s.events[0].reason,'boundary');assert.equal(s.cursor,0);
 tap(s,'left');assert.equal(s.cursor,0);go(s,14);tap(s,'down');tap(s,'right');assert.equal(s.cursor,14);
 tap(s,'up');assert.equal(s.cursor,9);tap(s,'up');assert.equal(s.cursor,5);tap(s,'down');assert.equal(s.cursor,8);assert.equal(s.jumpsMade,0);
});

test('heldinputsandthresholdsneverrepeat; B>A>directionconsumessuppressededges',()=>{
 const s=fresh();step(s,{x:.5});assert.equal(s.lastCommand,'none');step(s,{y:.51});assert.equal(s.cursor,1);
 for(let i=0;i<15;i++)step(s,{y:1});assert.equal(s.cursor,1);step(s,{y:-1});assert.equal(s.cursor,0);
 step(s);step(s,{x:1,y:1});assert.equal(s.cursor,1);assert.equal(s.lastCommand,'down');
 step(s);step(s,{b:true,a:true,x:1});assert.equal(s.events[0].reason,'no-history');assert.equal(s.source,null);assert.equal(s.cursor,1);
 step(s,{a:true,x:1});assert.equal(s.source,null);assert.equal(s.lastCommand,'none');
 step(s);step(s,{a:true,x:1});assert.equal(s.source,1);assert.equal(s.cursor,1);const blocked=s.blockedActions;
 for(let i=0;i<15;i++)step(s,{a:true});assert.equal(s.blockedActions,blocked);assert.equal(s.jumpsMade,0);
});

test('initialneutralandchangedepoch/cancelledsamplesrequireasubsequentrelease',()=>{
 const s=M.create(753,1);step(s,{y:1,a:true});assert.equal(s.source,null);assert.equal(s.cursor,4);assert.equal(s.inputArmed,false);
 step(s);step(s,{x:-1,cancelEpoch:1});assert.equal(s.cursor,3);step(s);step(s,{a:true,cancelEpoch:1});assert.equal(s.source,3);
 step(s,{cancelEpoch:2});assert.equal(s.inputArmed,false);step(s,{b:true,cancelEpoch:2});assert.equal(s.source,3);
 step(s,{cancelEpoch:2});step(s,{b:true,cancelEpoch:2,cancelled:true});assert.equal(s.source,3);assert.equal(s.inputArmed,false);
 step(s,{cancelled:true});step(s,{b:true});assert.equal(s.source,3);step(s);step(s,{b:true});assert.equal(s.source,null);
});

test('invaliddt/pausedexactnoops and descriptorbasednormalization ignoresgettersinheritanceandpartialreads',()=>{
 const s=fresh();const original=clone(s);let reads=0;const bad=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('no');}});
 for(const dt of [0,-1,.251,NaN,Infinity,'0.1',null,{},undefined])M.step(s,dt,bad);assert.equal(reads,0);assert.deepEqual(s,original);
 step(s,{paused:true,a:true,y:1});assert.deepEqual(s,original);let getters=0;const raw={};Object.defineProperty(raw,'y',{get(){getters++;return 1;}});step(s,raw);
 step(s,Object.create({y:1,a:true}));assert.equal(getters,0);assert.equal(s.cursor,0);
 for(const value of [null,[],true,1,'x',{x:NaN,y:Infinity,a:1}])step(s,value);assert.equal(s.cursor,0);
 const partial=new Proxy({y:1},{getOwnPropertyDescriptor(t,k){if(k==='cancelled')throw Error('no');return Object.getOwnPropertyDescriptor(t,k);}});step(s,partial);assert.equal(s.cursor,0);
 step(s,{y:1});assert.equal(s.cursor,1);
});

test('syntheticstalelegalcachecannotauthorizebadjumps; history/terminalarraysdetachedandcountercapsfinite',()=>{
 const s=fresh();go(s,3);tap(s,'a');go(s,1);s.legalJumps=[{from:3,over:4,to:1}];tap(s,'a');assert.equal(s.jumpsMade,0);assert.equal(s.events[0].reason,'invalid-jump');
 // Deliberately corrupted cache above is a synthetic probe, not an ordinary game.
 const win=fresh();for(const j of route(0))jump(win,j);assert.notEqual(win.history[0],M.config.jumps.find(j=>j.from===win.history[0].from&&j.to===win.history[0].to));
 const actual=win.occupied.slice();win.terminalReceipt.occupied.fill(false);assert.deepEqual(win.occupied,actual);
 const capped=fresh();capped.calls=M.config.maxCounter;capped.blockedActions=M.config.maxCounter;capped.elapsed=M.config.maxElapsed;tap(capped,'b');
 assert.equal(capped.calls,M.config.maxCounter);assert.equal(capped.blockedActions,M.config.maxCounter);assert.equal(capped.elapsed,M.config.maxElapsed);assert.equal(capped.elapsedCapped,true);
});
console.log(JSON.stringify({passed:true,cases:checks.length,checks,physicalTvTested:false,physicalPhoneTested:false},null,2));
