'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js'),{command,findHome,win}=require('./crossing-search.cjs'),h=M.config.tick;
const groups=[],copy=x=>JSON.parse(JSON.stringify(x));
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=.08){M.step(s,dt,i);}
function fresh(level=0){const s=M.create(796,level);step(s);return s;}
function press(s,i,dt=h){step(s,{},dt);step(s,i,dt);}
function near(a,b,tol=1e-8){assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);}
function route(s,actions){for(const action of actions)command(s,action);}
function logStart(){const s=fresh();route(s,['up','up','up','left','up']);assert.equal(s.player.row,2);assert.equal(s.lives,3);return s;}
test('public immutable layouts and fresh states expose only lane geometry and distinct home targets',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.layouts.map(l=>l.target),[2,3,4]);assert.deepEqual(M.config.layouts.map(l=>l.timeLimit),[45,60,80]);const a=M.create(-1,-1),b=M.create(796,0);assert.equal(a.seed,796);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.lanes[0].objects[0].x=0;a.homes[0].x=90;assert.equal(b.lanes[0].objects[0].x,80);assert.equal(b.homes[0].x,30);assert.throws(()=>M.config.layouts[0].lanes[0].speed=0,TypeError);assert.equal(M.create(4294967295,2).seed,4294967295);
});
const normal=[];
test('public-state search with ordinary80ms inputs completes2/3/4 distinct homes and freezes terminal',()=>{
 for(let level=0;level<3;level++){const r=win(level),s=r.s;normal.push({level,seconds:s.activeTicks*h,jumps:s.jumps,visited:s.visited});assert.equal(r.failed,false);assert.equal(s.phase,'won');assert.equal(s.reason,'homes');assert.equal(s.goalCount,s.target);assert.equal(new Set(s.visited).size,s.target);assert.equal(s.lives,3);assert.equal(s.score,100);assert.ok(s.rideTicks>0);assert.ok(s.carriedDistance>0);assert.notEqual(s.terminalReceipt.lanes,s.lanes);assert.notEqual(s.terminalReceipt.visited,s.visited);const before=copy(s);step(s,{x:1,a:true,cancelEpoch:9});assert.deepEqual(s,before);}
});
test('feedback planning tolerates70/80/90ms active sampling jitter with all lives on every level',()=>{
 for(let level=0;level<3;level++){const s=fresh(level);for(let k=0;s.phase==='playing'&&k<150;k++){const p=findHome(s);assert.ok(p.route);command(s,p.route[0],[.07,.08,.09,.08][k%4]);}assert.equal(s.phase,'won');assert.equal(s.lives,3);}
});
test('ordinary waiting on a road causes car collisions and three such crossings naturally exhaust lives',()=>{
 for(let level=0;level<3;level++){const s=fresh(level);while(s.phase==='playing'){while(s.respawnTicks>0)step(s);command(s,'up');const before=s.deaths;while(s.phase==='playing'&&s.player.row===5&&s.deaths===before)step(s,{},.25);assert.equal(s.lastDeath.cause,'car');}assert.equal(s.reason,'lives');assert.equal(s.lives,0);assert.equal(s.deaths,3);assert.equal(s.deathHistory.length,3);assert.equal(s.goalCount,0);}
});
test('ordinary unsupported jump loses a life to water, and riding without leaving naturally drifts out',()=>{
 const s=fresh();route(s,['up','up','up','right','up']);assert.equal(s.lastDeath.cause,'water');assert.equal(s.lives,2);assert.equal(s.player.row,6);
 const t=logStart();while(t.lives===3)step(t,{},.25);assert.equal(t.lastDeath.cause,'drift');assert.ok(t.lastDeath.x<10);assert.equal(t.lives,2);assert.ok(t.carriedDistance>100);
});
test('ordinary missed dock and repeated occupied dock each lose a life without false goal credit',()=>{
 const s=fresh();route(s,['up','up','up','left','up','up']);assert.equal(s.player.row,1);step(s,{},.25);step(s,{},.25);command(s,'up');assert.equal(s.lastDeath.cause,'home-miss');assert.equal(s.goalCount,0);
 const t=fresh(),first=findHome(t);route(t,first.route);assert.equal(t.goalCount,1);const id=t.visited[0],again=findHome(t,id,true);assert.ok(again.route);route(t,again.route);assert.equal(t.lastDeath.cause,'repeat-home');assert.equal(t.lastDeath.objectId,id);assert.equal(t.lives,2);assert.equal(t.goalCount,1);assert.deepEqual(t.visited,[id]);
});
test('neutral real-dt waiting at safe start naturally times out all levels without spending lives',()=>{
 for(let level=0;level<3;level++){const s=fresh(level);while(s.phase==='playing')step(s,{},.25);assert.equal(s.reason,'timeout');assert.equal(s.lives,3);assert.equal(s.goalCount,0);assert.equal(s.timeLeft,0);assert.equal(s.activeTicks,s.timeLimit*120);const before=copy(s);step(s,{y:-1});assert.deepEqual(s,before);}
});
test('riding is continuous and horizontal/vertical hops retain fractional x instead of snapping',()=>{
 const s=logStart();const start=s.player.x;step(s,{},.1);near(s.player.x,start-3);assert.equal(s.supportLane,'river-low');const prior=s.player.x;step(s,{y:1},h);near(s.player.x,prior);assert.equal(s.player.row,3);assert.ok(Math.abs(s.player.x/60-.5-Math.round(s.player.x/60-.5))>.01);step(s,{},h);const x=s.player.x;step(s,{x:1},h);near(s.player.x,x+60);
});
test('labelled geometric fixture: a wrapped log carries the rider by velocity only, then real drift kills',()=>{
 const s=fresh(),l=s.lanes.find(l=>l.row===1);l.objects=[{id:1,x:419.9}];s.player={x:390,row:1,facing:'up'};step(s,{},h);near(l.objects[0].x,.2);near(s.player.x,390.3);assert.equal(s.supportId,1);assert.equal(s.lives,3);while(s.lives===3)step(s,{},h);assert.equal(s.lastDeath.cause,'drift');assert.ok(s.lastDeath.x>410);assert.ok(s.lastDeath.x<411);
});
test('labelled geometric fixtures enforce inclusive whole-foot log/home edges and car contact',()=>{
 const s=fresh(),l=s.lanes.find(l=>l.row===2);l.objects=[{id:1,x:200}];s.player={x:255,row:2,facing:'up'};step(s,{},h);assert.equal(s.lives,3);const t=fresh(),tl=t.lanes.find(l=>l.row===2);tl.objects=[{id:1,x:200}];t.player={x:255.00001,row:2,facing:'up'};step(t,{},h);assert.equal(t.lastDeath.cause,'water');
 for(const [x,hit]of [[61,true],[60.99999,false]]){const r=fresh(),road=r.lanes.find(l=>l.row===5);road.objects=[{id:1,x:100}];r.player={x,row:6,facing:'up'};step(r,{y:-1},h);assert.equal(r.lives,hit?2:3);}
 for(const [x,valid]of [[164,true],[164.00001,false]]){const r=fresh();r.player={x,row:1,facing:'up'};step(r,{y:-1},h);assert.equal(r.goalCount,valid?1:0);if(!valid)assert.equal(r.lastDeath.cause,'home-miss');}
});
test('respawn locks jumps but preserves lane phase and clock; held blocked direction needs release',()=>{
 const s=fresh();route(s,['up','up','up','right','up']);assert.ok(s.respawnTicks>0);const laneX=s.lanes[0].objects[0].x,ticks=s.activeTicks,jumps=s.jumps;step(s,{x:1},h);assert.equal(s.events[0].reason,'respawn');assert.equal(s.jumps,jumps);assert.ok(s.lanes[0].objects[0].x>laneX);assert.ok(s.activeTicks>ticks);while(s.respawnTicks>0)step(s,{x:1},h);step(s,{x:1},h);assert.equal(s.player.x,210);step(s,{},h);step(s,{x:1},h);assert.equal(s.player.x,270);
});
test('labelled deadline fixtures prioritize final home over timeout and third-life impact before timeout',()=>{
 const s=fresh();s.goalCount=s.target-1;s.visited=[1];s.player={x:150,row:1,facing:'up'};s.activeTicks=s.timeLimit*120-1;s.timeLeft=h;step(s,{y:-1},h);assert.equal(s.phase,'won');assert.equal(s.reason,'homes');
 const t=fresh();t.lives=1;t.player={x:210,row:5,facing:'up'};const l=t.lanes.find(l=>l.row===5);l.objects=[{id:1,x:210}];t.activeTicks=t.timeLimit*120-1;t.timeLeft=h;step(t,{},h);assert.equal(t.reason,'lives');assert.equal(t.timeLeft,0);assert.equal(t.terminalReceipt.activeTicks,t.activeTicks);
});
test('fixed-tick lane motion and carrying are identical under different admitted dt partitions',()=>{
 const a=logStart(),b=copy(a);for(let k=0;k<8;k++)step(a,{},.25);for(let k=0;k<240;k++)step(b,{},h);assert.equal(a.activeTicks,b.activeTicks);assert.deepEqual(a.player,b.player);assert.deepEqual(a.lanes,b.lanes);assert.equal(a.rideTicks,b.rideTicks);near(a.carriedDistance,b.carriedDistance);near(a.physicsRemainder,b.physicsRemainder);assert.equal(a.lives,3);
});
test('edge hops are free, held input does not repeat, A/B unused and vertical wins diagonal ties',()=>{
 const s=fresh();press(s,{y:1});assert.equal(s.events[0].reason,'edge');assert.equal(s.lives,3);press(s,{a:true,b:true});assert.equal(s.jumps,0);press(s,{x:-1});assert.equal(s.player.x,150);for(let k=0;k<5;k++)step(s,{x:-1});assert.equal(s.player.x,150);step(s);step(s,{x:-1,y:1,a:true,b:true});assert.equal(s.events[0].reason,'edge');assert.equal(s.player.x,150);assert.equal(s.player.row,6);
});
test('pause freezes lanes/rider/clock; cancellation keeps motion but quarantines jumps until release',()=>{
 const s=logStart();step(s,{cancelEpoch:0},h);const before=copy(s);step(s,{paused:true,y:-1},.25);assert.deepEqual(s,before);const x=s.player.x,jumps=s.jumps;step(s,{y:-1,cancelEpoch:1},.1);assert.ok(s.player.x<x);assert.equal(s.jumps,jumps);assert.equal(s.inputArmed,false);step(s,{y:-1,cancelled:true},h);step(s,{y:-1},h);assert.equal(s.jumps,jumps);step(s,{},h);step(s,{y:1},h);assert.equal(s.player.row,3);
});
test('initial neutral, invalid dt, hostile descriptors and diagnostic saturation remain bounded',()=>{
 const s=M.create(796,0);step(s,{x:1});assert.equal(s.player.x,210);step(s);const before=copy(s);let reads=0;const getter={};Object.defineProperty(getter,'x',{get(){reads++;return 1;}});for(const dt of[0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,getter);assert.deepEqual(s,before);assert.equal(reads,0);step(s,getter);step(s,Object.create({x:1}));step(s,new Proxy({x:1},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));assert.equal(s.jumps,0);assert.equal(reads,0);s.elapsed=M.config.maxElapsed-.01;s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;s.physicsTicks=M.config.maxCounter;press(s,{y:1});assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);assert.equal(s.physicsTicks,M.config.maxCounter);assert.ok(s.events.length<=16);
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,normal80msWins:normal,jitterSeconds:[.07,.08,.09,.08],syntheticGeometryFixturesClearlyLabelled:true,physicalTvTested:false,physicalPhoneTested:false},null,2));
