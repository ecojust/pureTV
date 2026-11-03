'use strict';
const assert=require('node:assert/strict'),M=require('../src/main/assets/game-model.js'),{solve,aim,shoot}=require('./shot-search.cjs');
const groups=[],copy=x=>JSON.parse(JSON.stringify(x)),h=M.config.tick;
function test(name,fn){fn();groups.push(name);}
function step(s,i={},dt=1/60){M.step(s,dt,i);}
function fresh(level=0){const s=M.create(792,level);step(s);return s;}
function press(s,i){step(s);step(s,i);}
function near(a,b,tol=1e-8){assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);}
const proofs=[0,1,2].map(level=>solve(fresh(level)));
// Explicit synthetic isolated physical fixtures, never used for ordinary gameplay wins.
function physical(ball={},pins=[{x:40,y:40}]){const s=fresh();s.stage='rolling';s.shotsUsed=1;s.shotsRemaining=1;s.ball=Object.assign({id:0,x:160,y:385,vx:0,vy:-100,radius:12,mass:3,active:true},ball);s.pins=pins.map((p,i)=>Object.assign({id:i+1,vx:0,vy:0,radius:10,mass:1,fallen:false,active:true,fall:null,originX:p.x,originY:p.y},p));s.totalPins=pins.length;s.standingCount=pins.length;return s;}
test('public API/config are frozen, fresh states detached and layouts have6/8/10 physical pins',()=>{
 assert.deepEqual(Object.keys(M).sort(),['config','create','step']);assert.deepEqual(M.config.layouts.map(l=>l.pins.length),[6,8,10]);assert.deepEqual(M.config.layouts.map(l=>l.throws),[2,3,3]);const a=M.create(-1,-1),b=M.create(792,0);assert.equal(a.seed,792);assert.equal(a.level,0);assert.equal(a.inputArmed,false);a.pins[0].x=0;assert.equal(b.pins[0].x,160);assert.throws(()=>M.config.layouts[0].pins[0].x=9,TypeError);assert.equal(M.create(4294967295,2).seed,4294967295);for(const l of M.config.layouts)for(let i=0;i<l.pins.length;i++)for(let j=i+1;j<l.pins.length;j++)assert.ok(Math.hypot(l.pins[i].x-l.pins[j].x,l.pins[i].y-l.pins[j].y)>20);
});
test('ordinary aim/power search and real-dt replay win all three with physical fall receipts',()=>{
 assert.deepEqual(proofs.map(p=>p.route.length),[1,2,2]);proofs.forEach((p,level)=>{const s=fresh(level);for(const shot of p.route)shoot(s,shot.angle,shot.power);assert.equal(s.phase,'won');assert.equal(s.reason,'cleared');assert.equal(s.score,100);assert.equal(s.fallReceipts.length,s.totalPins);assert.ok(s.totalBallHits>0);assert.ok(s.totalPinHits>0);assert.ok(s.fallReceipts.some(f=>f.source==='pin'));for(const f of s.fallReceipts)assert.ok(f.source==='displacement'?f.displacement>=6.5:f.speed>=48);assert.ok(s.pins.every(p=>p.fallen&&!p.active&&p.vx===0&&p.vy===0));assert.equal(s.ball,null);assert.notEqual(s.terminalReceipt.pins,s.pins);assert.notEqual(s.lastShot,s.shotHistory.at(-1));const before=copy(s);step(s,{a:true,x:1,cancelEpoch:20});assert.deepEqual(s,before);});
});
test('all three levels naturally lose by spending every throw in an empty gutter',()=>{
 for(let level=0;level<3;level++){const s=fresh(level);while(s.phase==='playing')shoot(s,-24,3);assert.equal(s.phase,'lost');assert.equal(s.reason,'throws');assert.equal(s.fallenCount,0);assert.equal(s.shotsUsed,s.shotLimit);assert.equal(s.shotsRemaining,0);assert.equal(s.totalBallHits,0);assert.ok(s.shotHistory.every(r=>r.gutter&&r.exit==='gutter'));const before=copy(s);press(s,{a:true});assert.deepEqual(s,before);}
});
test('a natural gutter before each witness route yields ordinary wins on the last permitted throw',()=>{
 proofs.forEach((p,level)=>{const s=fresh(level);while(s.shotsRemaining>p.route.length)shoot(s,-24,3);for(const a of p.route)shoot(s,a.angle,a.power);assert.equal(s.phase,'won');assert.equal(s.shotsUsed,s.shotLimit);assert.equal(s.shotsRemaining,0);assert.equal(s.lastShot.cleared,true);});
});
test('one isolated ball-pin collision obeys mass-weighted impulse, momentum and restitution',()=>{
 const s=physical({x:160,y:200,vx:0,vy:-100},[{x:160,y:179}]);step(s,{},h);const v=100-38*h,p=s.pins[0];near(3*s.ball.vy+p.vy,-3*v);near(s.ball.vy-p.vy,.65*v);near(s.ball.vx,0);near(p.vx,0);assert.equal(s.totalBallHits,1);assert.equal(p.fall.source,'ball');assert.equal(p.fall.sourceId,0);assert.equal(p.fall.tick,1);assert.ok(Math.hypot(s.ball.x-p.x,s.ball.y-p.y)>=22-1e-8);
});
test('isolated pin-pin contact follows the same restitution law and can initiate a chain fall',()=>{
 const s=physical({active:false,vx:0,vy:0},[{x:160,y:200,vx:0,vy:-100},{x:160,y:181}]);step(s,{},h);const v=100-90*h;near(s.pins[0].vy+s.pins[1].vy,-v);near(s.pins[0].vy-s.pins[1].vy,.65*v);assert.equal(s.totalBallHits,0);assert.equal(s.totalPinHits,1);assert.equal(s.pins[1].fall.source,'pin');assert.equal(s.pins[1].fall.sourceId,1);
});
test('finite-speed fixed substeps catch a head-on pin at the maximum allowed velocity',()=>{
 const s=physical({x:160,y:260,vx:0,vy:-480},[{x:160,y:180}]);for(let k=0;k<30&&!s.pins[0].fallen;k++)step(s,{},h);assert.ok(s.totalBallHits>0);assert.equal(s.pins[0].fallen,true);assert.ok(s.pins[0].fall.speed>=48);assert.ok(Math.hypot(s.ball.vx,s.ball.vy)<=480);assert.ok(Math.hypot(s.pins[0].vx,s.pins[0].vy)<=480);
});
test('constant friction reduces speed with no awards; a stopped ball/pins need12 quiet ticks',()=>{
 const s=physical();for(let k=0;k<4;k++)step(s,{},.25);near(Math.hypot(s.ball.vx,s.ball.vy),62);assert.equal(s.fallenCount,0);assert.equal(s.totalBallHits,0);
 const t=physical({vx:0,vy:4});for(let k=0;k<11;k++)step(t,{},h);assert.equal(t.stage,'rolling');assert.equal(t.quietTicks,11);step(t,{},h);assert.equal(t.stage,'aiming');assert.equal(t.lastShot.end,'settled');assert.equal(t.lastShot.ticks,12);assert.equal(t.lastShot.newlyFallen.length,0);
});
test('subthreshold pin motion can fall from actual displacement while small motion remains standing',()=>{
 const s=physical({active:false,vx:0,vy:0},[{x:100,y:100,vx:40,vy:0}]);step(s,{},.25);assert.equal(s.pins[0].fallen,true);assert.equal(s.pins[0].fall.source,'displacement');assert.equal(s.pins[0].fall.sourceId,null);assert.ok(s.pins[0].fall.speed<48);assert.ok(s.pins[0].fall.displacement>=6.5);
 const t=physical({active:false,vx:0,vy:0},[{x:100,y:100,vx:10,vy:0}]);step(t,{},.25);assert.equal(t.pins[0].fallen,false);assert.equal(t.fallReceipts.length,0);
});
test('gutter/out deactivates only the ball and pin-wall reflection alone does not award a fall',()=>{
 const s=physical({x:18.1,y:300,vx:-100,vy:0},[{x:100,y:100,vx:0,vy:10}]);step(s,{},h);assert.equal(s.ball.active,false);assert.equal(s.shotGutter,true);assert.equal(s.shotExit,'gutter');assert.equal(s.stage,'rolling');assert.equal(s.pins[0].fallen,false);
 const t=physical({x:160,y:-11.9,vx:0,vy:-100});step(t,{},h);assert.equal(t.shotExit,'out');assert.equal(t.shotGutter,false);
 const u=physical({active:false,vx:0,vy:0},[{x:309.8,y:100,vx:100,vy:0}]);step(u,{},h);near(u.pins[0].x,310);near(u.pins[0].vx,-(100-90*h)*.2);assert.equal(u.pins[0].fallen,false);
});
test('the explicitly bounded six-second sweep stops bodies without awarding extra pins',()=>{
 const s=physical();s.shotTicks=719;step(s,{},h);assert.equal(s.stage,'aiming');assert.equal(s.lastShot.end,'sweep');assert.equal(s.lastShot.ticks,720);assert.equal(s.lastShot.elapsed,6);assert.equal(s.ball,null);assert.equal(s.fallenCount,0);assert.equal(s.pins[0].active,true);
});
test('different admitted dt partitions produce identical physical ticks/bodies and preserve remainder',()=>{
 const a=fresh(2);aim(a,-3,3);press(a,{a:true});const b=copy(a);for(let k=0;k<8;k++)step(a,{},.25);for(let k=0;k<240;k++)step(b,{},h);assert.equal(a.shotTicks,b.shotTicks);assert.deepEqual(a.pins,b.pins);assert.deepEqual(a.ball,b.ball);assert.deepEqual(a.fallReceipts,b.fallReceipts);near(a.physicsRemainder,b.physicsRemainder);const c=fresh();press(c,{a:true});const before=c.physicsTicks;step(c,{},h/2);assert.equal(c.physicsTicks,before);step(c,{},h/2);assert.equal(c.physicsTicks,before+1);
});
test('aim/power clamp, B is unused, A outranks direction and rolling commands cannot relaunch',()=>{
 const s=fresh(1);for(let k=0;k<12;k++)press(s,{x:-1});assert.equal(s.angle,-24);assert.equal(s.events[0].reason,'angle-limit');for(let k=0;k<6;k++)press(s,{y:1});assert.equal(s.power,0);assert.equal(s.events[0].reason,'power-limit');press(s,{b:true});assert.equal(s.shotsUsed,0);step(s);step(s,{a:true,x:1});assert.equal(s.angle,-24);assert.equal(s.shotsUsed,1);step(s,{a:true,x:1});assert.equal(s.angle,-24);for(let k=0;k<400;k++)step(s,{a:true});assert.equal(s.stage,'aiming');assert.equal(s.shotsUsed,1);step(s,{a:true});assert.equal(s.shotsUsed,1);step(s);step(s,{a:true});assert.equal(s.shotsUsed,2);
});
test('pause freezes physics, cancellation advances active motion but quarantines commands until release',()=>{
 const s=fresh(1);step(s,{cancelEpoch:0});press(s,{a:true});const before=copy(s);step(s,{paused:true,a:true},.25);assert.deepEqual(s,before);const y=s.ball.y;step(s,{a:true,x:1,cancelEpoch:1},.1);assert.ok(s.ball.y<y);assert.equal(s.angle,0);assert.equal(s.shotsUsed,1);assert.equal(s.inputArmed,false);step(s,{a:true,cancelled:true});step(s,{a:true});assert.equal(s.lastCommand,'none');step(s);assert.equal(s.inputArmed,true);
});
test('initial neutral, invalid dt and hostile descriptors protect against unintended throws',()=>{
 const s=M.create(792,0);step(s,{a:true});assert.equal(s.shotsUsed,0);step(s);const before=copy(s);let reads=0;const getter={};Object.defineProperty(getter,'a',{get(){reads++;return true;}});for(const dt of[0,-1,NaN,Infinity,.26,'0.1',null,undefined])M.step(s,dt,getter);assert.deepEqual(s,before);assert.equal(reads,0);step(s,getter);step(s,Object.create({a:true}));step(s,new Proxy({a:true},{getOwnPropertyDescriptor(t,k){if(k==='paused')throw Error('stop');return Object.getOwnPropertyDescriptor(t,k);}}));assert.equal(s.shotsUsed,0);assert.equal(reads,0);press(s,{a:true});assert.equal(s.shotsUsed,1);
});
test('diagnostics saturate and every per-call event/receipt collection remains bounded',()=>{
 const s=fresh();s.elapsed=M.config.maxElapsed-.1;s.calls=M.config.maxCounter;s.blockedActions=M.config.maxCounter;s.physicsTicks=M.config.maxCounter;for(let k=0;k<12;k++)press(s,{x:-1});press(s,{a:true});while(s.stage==='rolling'){step(s,{},.25);assert.ok(s.events.length<=32);}assert.equal(s.calls,M.config.maxCounter);assert.equal(s.blockedActions,M.config.maxCounter);assert.equal(s.physicsTicks,M.config.maxCounter);assert.equal(s.elapsed,M.config.maxElapsed);assert.equal(s.elapsedCapped,true);assert.ok(s.shotHistory.length<=3);assert.ok(s.fallReceipts.length<=10);
});
console.log(JSON.stringify({passed:true,cases:groups.length,checks:groups,witnesses:proofs.map(p=>p.route),searchSimulations:proofs.map(p=>p.simulations),syntheticPhysicsFixturesClearlyLabelled:true,physicalTvTested:false,physicalPhoneTested:false},null,2));
