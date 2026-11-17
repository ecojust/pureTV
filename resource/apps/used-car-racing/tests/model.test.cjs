'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Model=require('../src/main/assets/game-model.js');
const Tracks=require('../src/main/assets/tracks.js');
function run(state,seconds,input={}){for(let i=0;i<Math.round(seconds*120);i++)Model.update(state,1/120,[input]);return state;}
function race(options={}){const state=Model.create({...options,aiCount:options.aiCount??0});Model.start(state);run(state,3);assert.equal(state.phase,'race');return state;}
function straight(){
  // Huge-radius closed road: isolates the car from track bends and guardrails.
  const radius=100000,length=2*Math.PI*radius,points=[];
  for(let i=0;i<640;i++){const a=i/640*Math.PI*2;points.push({x:radius*(1-Math.cos(a)),z:radius*Math.sin(a),y:0,s:i/640*length,index:i,tx:Math.sin(a),tz:Math.cos(a),nx:Math.cos(a),nz:-Math.sin(a),heading:a,curvature:1/radius,grade:0,bank:0,width:2000,grip:1});}
  return {id:'test-straight',name:'Test',length,width:2000,points};
}
function clean(state){const car=state.players[0];Object.assign(car.condition,{weakPedal:false,brakeBroken:false,tireGrip:1,brakeEfficiency:1,powerFactor:1,absAvailable:true,steeringPlay:0,steeringResponse:2.75,fadeProne:false,misfire:false,bodyDamage:0});return car;}
function moving(speed=25){const state=race({seed:33,track:straight()});const c=clean(state);c.u=speed;c.speed=speed;c.vx=Math.sin(c.yaw)*speed;c.vz=Math.cos(c.yaw)*speed;return state;}

test('six distinct real-unit drivetrain templates and a bilingual random condition card',()=>{
  assert.equal(Model.VEHICLES.length,6);assert.deepEqual(new Set(Model.VEHICLES.map(c=>c.drive)),new Set(['FWD','RWD','AWD']));
  const ids=new Set(),faults=new Set();for(let seed=1;seed<90;seed++){const s=Model.create({seed:seed*13817});ids.add(s.players[0].spec.id);faults.add(s.players[0].condition.fault.id);assert.equal(s.racers.length,6);assert.equal(s.players[0].spec.name.length,2);assert.equal(s.players[0].condition.fault.description.length,2);assert.ok(s.players[0].spec.mass>900&&s.players[0].spec.wheelbase>2);}
  assert.equal(ids.size,6);assert.equal(faults.size,6);
});
test('seeded draws are deterministic and second-player joining preserves the first car',()=>{
  const a=Model.create({seed:65431}),b=Model.create({seed:65431});assert.deepEqual(a.racers.map(c=>[c.spec,c.condition]),b.racers.map(c=>[c.spec,c.condition]));const before=JSON.stringify([a.players[0].spec,a.players[0].condition]);Model.setPlayers(a,2);assert.equal(a.playerCount,2);assert.equal(JSON.stringify([a.players[0].spec,a.players[0].condition]),before);assert.equal(a.players[1].playerIndex,1);assert.equal(a.racers.filter(c=>!c.human).length,4);
});
test('all three track centerlines are closed, finite and match the road query used by physics',()=>{
  assert.equal(Tracks.all.length,3);for(const t of Tracks.all){const p=Tracks.sample(t,0),end=Tracks.sample(t,t.length);assert.deepEqual(p,end);assert.ok(t.length>1500);for(let s=0;s<t.length;s+=91){const q=Tracks.sample(t,s),n=Tracks.nearest(t,q.x+q.nx*2,q.z+q.nz*2);assert.ok(Math.abs(n.lateral-2)<.04);assert.ok(Number.isFinite(q.grade)&&Number.isFinite(q.curvature));}}
});
test('car requires throttle, accelerates through gears and produces SI telemetry',()=>{
  const s=race({seed:33,track:straight()}),c=clean(s);run(s,1);assert.ok(c.speed<.1);run(s,12,{throttle:1});assert.ok(c.speed>20&&c.speed<70,`speed ${c.speed}`);assert.ok(c.gear>1);assert.ok(c.rpm>=750&&c.rpm<c.spec.redline+400);assert.ok(Math.abs(c.telemetry.speedKmh-c.speed*3.6)<1e-8);
});
test('fixed-step simulation is independent of 60Hz or 120Hz presentation frames',()=>{
  const a=race({seed:441,track:straight()}),b=race({seed:441,track:straight()});clean(a);clean(b);for(let i=0;i<600;i++)Model.update(a,1/60,[{throttle:.8,steer:.12}]);for(let i=0;i<1200;i++)Model.update(b,1/120,[{throttle:.8,steer:.12}]);for(const key of ['x','z','yaw','u','v','rpm','pedalForceN'])assert.ok(Math.abs(a.players[0][key]-b.players[0][key])<1e-7,key);
});
test('weak brake pedal snaps exactly when simulated force reaches 1600 N',()=>{
  const s=moving(),c=s.players[0];c.condition.weakPedal=true;run(s,319/120,{brake:1});assert.equal(c.pedalForceN,1595);assert.equal(c.condition.brakeBroken,false);assert.ok(c.telemetry.brakeForce>0);Model.update(s,1/120,[{brake:1}]);assert.equal(c.pedalForceN,1600);assert.equal(c.condition.brakeBroken,true);assert.equal(c.telemetry.brakeForce,0);assert.equal(s.events.filter(e=>e.kind==='pedal-break').length,1);run(s,2,{brake:1});assert.equal(s.events.filter(e=>e.kind==='pedal-break').length,1);assert.equal(c.telemetry.brakeForce,0);
});
test('partial braking stays below the weak-pedal threshold and releases force quickly',()=>{
  const s=moving(),c=s.players[0];c.condition.weakPedal=true;run(s,8,{brake:.75});assert.equal(c.pedalForceN,1350);assert.equal(c.condition.brakeBroken,false);run(s,.2);assert.equal(c.pedalForceN,0);
});
test('broken brakes stay broken across release, pause, resume and recovery until a new race',()=>{
  const s=moving(),c=s.players[0];c.condition.weakPedal=true;run(s,3,{brake:1});Model.releaseControls(s);assert.equal(c.pedalForceN,0);assert.equal(c.condition.brakeBroken,true);Model.pause(s);const location=[c.x,c.z];run(s,4,{brake:1});assert.deepEqual([c.x,c.z],location);Model.resume(s);Model.rescue(s,0);run(s,.5,{brake:1,handbrake:true});assert.equal(c.telemetry.brakeForce,0);assert.equal(c.condition.brakeBroken,true);Model.reset(s);assert.equal(s.phase,'garage');assert.ok(s.racers.every(r=>!r.condition.brakeBroken));
});
test('cancel sequence invalidates an old brake hold without repairing a broken pedal',()=>{
  const s=moving(),c=s.players[0];c.condition.weakPedal=true;run(s,2,{brake:1,cancelSeq:0});assert.equal(c.pedalForceN,1200);Model.update(s,1/60,[{brake:1,cancelSeq:1}]);assert.ok(c.pedalForceN<=5);assert.equal(c.condition.brakeBroken,false);run(s,2.9,{brake:1,cancelSeq:1});assert.equal(c.condition.brakeBroken,true);Model.update(s,1/60,[{brake:1,cancelSeq:2}]);assert.equal(c.condition.brakeBroken,true);assert.equal(c.telemetry.brakeForce,0);
});
test('ABS limits wheel locking, while damaged ABS permits a lock state',()=>{
  const a=moving(34),b=moving(34);a.players[0].pedalForceN=1800;b.players[0].pedalForceN=1800;b.players[0].condition.absAvailable=false;Model.update(a,1/120,[{brake:1}]);Model.update(b,1/120,[{brake:1}]);assert.equal(a.players[0].telemetry.absActive,true);assert.equal(a.players[0].telemetry.locked,false);assert.equal(b.players[0].telemetry.absActive,false);assert.equal(b.players[0].telemetry.locked,true);
});
test('worn tires increase a straight-line stopping distance under ABS',()=>{
  const a=moving(30),b=moving(30);b.players[0].condition.tireGrip=.55;let distanceA=0,distanceB=0;for(let i=0;i<1800;i++){Model.update(a,1/120,[{brake:1}]);Model.update(b,1/120,[{brake:1}]);distanceA+=a.players[0].speed/120;distanceB+=b.players[0].speed/120;}assert.ok(a.players[0].speed<.2&&b.players[0].speed<.2);assert.ok(distanceB>distanceA*1.1,`${distanceA} vs ${distanceB}`);
});
test('heat fade reduces effective braking force for bad pads at the same pedal force',()=>{
  const a=moving(20),b=moving(20);for(const s of [a,b]){s.players[0].condition.fadeProne=true;s.players[0].pedalForceN=700;}b.players[0].brakeTemp=400;Model.update(a,1/120,[{brake:700/1800}]);Model.update(b,1/120,[{brake:700/1800}]);assert.ok(b.players[0].telemetry.brakeForce<a.players[0].telemetry.brakeForce*.5);
});
test('reverse is low-speed selected and cannot instantly invert high-speed driving',()=>{
  const s=race({seed:33,track:straight()}),c=clean(s);run(s,3,{throttle:1,reverse:true});assert.equal(c.gear,-1);assert.ok(c.u<-2&&c.u>=-12);const forward=moving(25);run(forward,.2,{reverse:true,throttle:1});assert.ok(forward.players[0].gear>0&&forward.players[0].u>0);
});
test('signed physical steering turns toward positive world yaw without an instantaneous rack jump',()=>{
  const s=moving(14),c=s.players[0],oldYaw=c.yaw;Model.update(s,1/120,[{steer:1}]);assert.ok(c.steerAngle>0&&c.steerAngle<.1);run(s,1,{steer:.2,throttle:.2});assert.ok(Math.atan2(Math.sin(c.yaw-oldYaw),Math.cos(c.yaw-oldYaw))>0);assert.ok(c.roll<0);
});
test('high-speed steering builds gradually while low-speed parking lock remains available',()=>{
  const fast=moving(25),slow=moving(3),a=fast.players[0],b=slow.players[0];
  run(fast,.1,{steer:1,throttle:.2});assert.ok(a.steerAngle>0&&a.steerAngle<.065,'90 km/h input must not snap to full steering lock');
  run(fast,.4,{steer:1,throttle:.2});run(slow,1,{steer:1});
  assert.ok(a.steerAngle<.15,'High-speed full input stays below a sharp parking angle');
  assert.ok(b.steerAngle>.38,'Low-speed maneuvers retain useful wheel lock');
  assert.ok(a.steerAngle<b.steerAngle*.4);
});
test('release and countersteering are progressive and reverse retains the same physical wheel direction',()=>{
  const s=moving(25),car=s.players[0];run(s,.5,{steer:1});const before=car.steerAngle;
  Model.update(s,Model.STEP,[{steer:-1}]);assert.ok(car.steerAngle>0,'Countersteering cannot jump through center in one frame');assert.ok(before-car.steerAngle<.006);
  run(s,.5,{steer:-1});assert.ok(car.steerAngle<-.07);run(s,.5);assert.ok(Math.abs(car.steerAngle)<.02,'Letting go returns toward center');
  const forward=moving(3),reverse=moving(-3);reverse.players[0].gear=-1;
  const initial=forward.players[0].yaw;run(forward,.5,{steer:.5});run(reverse,.5,{steer:.5,reverse:true});
  assert.ok(forward.players[0].steerAngle>0&&reverse.players[0].steerAngle>0);
  const turn=car=>Math.atan2(Math.sin(car.yaw-initial),Math.cos(car.yaw-initial));
  assert.ok(turn(forward.players[0])>0&&turn(reverse.players[0])<0,'Reversing changes yaw through vehicle motion, not an input flip');
});
test('AI facing backward uses its existing recovery without resetting a human driver',()=>{
  const s=race({seed:4,trackId:'solar',aiCount:1}),human=s.players[0],ai=s.racers[1];
  for(const car of [human,ai])car.yaw=car._trackPoint.heading+Math.PI;
  const humanYaw=human.yaw;for(let i=0;i<190;i++){Model.aiInput(s,ai,1/60);Model.aiInput(s,human,1/60);}
  assert.ok(Math.cos(ai.yaw-ai._trackPoint.heading)>.99);assert.ok(ai._rescueGrace>0);assert.equal(human.yaw,humanYaw);
});
test('AI opponents use the same physical cars and progress around every circuit',()=>{
  for(const trackId of ['harbor','ridge','solar']){const s=race({seed:4,trackId,aiCount:5,laps:1});run(s,70);const ai=s.racers.filter(c=>!c.human);assert.ok(ai.filter(c=>c.progress>500).length>=3,trackId);assert.ok(ai.every(c=>Number.isFinite(c.x)&&Number.isFinite(c.yaw)&&c.condition.bodyDamage<=.85));}
});
test('two-player braking failures are independent and long frame gaps are bounded',()=>{
  const s=race({seed:101,playerCount:2,aiCount:4});s.players[0].condition.weakPedal=true;s.players[1].condition.weakPedal=false;for(let i=0;i<360;i++)Model.update(s,1/120,[{brake:1},{brake:1}]);assert.equal(s.players[0].condition.brakeBroken,true);assert.equal(s.players[1].condition.brakeBroken,false);const elapsed=s.raceTime;Model.update(s,20,[{throttle:1},{throttle:1}]);assert.ok(s.raceTime-elapsed<=.251);assert.ok(s.racers.every(c=>Number.isFinite(c.x)&&Number.isFinite(c.z)));
});
test('a finish requires completed checkpoints, and the player result is stable while paused',()=>{
  const s=race({seed:1,laps:1}),c=s.players[0];c.progress=s.track.length+1;c.checkpoints=0;c.nextCheckpoint=s.track.length*2;Model.update(s,1/120,[]);assert.equal(c.finished,false);c.checkpoints=4;Model.update(s,1/120,[]);assert.equal(c.finished,true);assert.equal(s.phase,'results');const result=JSON.stringify(s.finishOrder);Model.update(s,1,[]);assert.equal(JSON.stringify(s.finishOrder),result);
});
test('full car bodies collide at bumpers and separate when their oriented footprints do not overlap',()=>{
  const a={x:0,z:0,yaw:0,spec:{length:4.8,width:1.8}},b={x:0,z:4.0,yaw:0,spec:{length:4.8,width:1.8}};
  const hit=Model.bodyContact(a,b);assert.ok(hit&&hit.penetration>0);assert.ok(hit.nz>.99);b.z=5;assert.equal(Model.bodyContact(a,b),null);b.x=3;b.z=0;b.yaw=Math.PI/2;assert.ok(Model.bodyContact(a,b));b.x=4;assert.equal(Model.bodyContact(a,b),null);
});
test('service brakes hold a stopped vehicle on an incline, and a broken pedal cannot',()=>{
  const road=straight();for(const p of road.points)p.grade=.12;
  const a=race({seed:33,track:road}),b=race({seed:33,track:road});clean(a);clean(b);a.players[0].pedalForceN=1000;b.players[0].pedalForceN=1000;b.players[0].condition.brakeBroken=true;
  run(a,.2,{brake:1000/1800});run(b,.2,{brake:1000/1800});assert.ok(Math.abs(a.players[0].u)<.01);assert.ok(b.players[0].u<-.1);
});
test('AI complete all three laps and twelve checkpoints on every circuit',()=>{
  for(const trackId of ['harbor','ridge','solar']){const s=race({seed:4,trackId,aiCount:5,laps:3});for(let i=0;i<720*60;i++){Model.update(s,1/60,[]);if(s.racers.filter(c=>!c.human).every(c=>c.finished))break;}assert.ok(s.racers.filter(c=>!c.human).every(c=>c.finished&&c.lap===3&&c.checkpoints===12),trackId);assert.equal(s.phase,'race','AI finish must not finish an unfinished human race');}
});

test('a full two-player three-lap race waits for both players and a new race resets all results',()=>{
  const s=race({seed:74191,trackId:'ridge',playerCount:2,aiCount:4,laps:3});let waitingObserved=false;
  for(let i=0;i<600*60&&s.phase!=='results';i++){
    Model.update(s,1/60,s.players.map(c=>c.finished?{}:Model.aiInput(s,c,1/60)));
    if(s.players.some(c=>c.finished)&&!s.players.every(c=>c.finished)){waitingObserved=true;assert.equal(s.phase,'race');}
  }
  assert.ok(waitingObserved);assert.equal(s.phase,'results');assert.ok(s.players.every(c=>c.finished&&c.checkpoints===12&&c.lap===3&&c.finishTime>0));assert.equal(new Set(s.finishOrder).size,s.finishOrder.length);
  const frozen=JSON.stringify([s.time,s.raceTime,s.finishOrder,s.players.map(c=>[c.rank,c.finishTime,c.progress])]);Model.update(s,.25,[{throttle:1},{brake:1}]);assert.equal(JSON.stringify([s.time,s.raceTime,s.finishOrder,s.players.map(c=>[c.rank,c.finishTime,c.progress])]),frozen);
  const priorDeal=JSON.stringify(s.players.map(c=>[c.spec,c.condition]));Model.reset(s);assert.equal(s.phase,'garage');assert.equal(s.previousPhase,null);assert.equal(s.raceTime,0);assert.deepEqual(s.finishOrder,[]);assert.deepEqual(s.events,[]);assert.notEqual(JSON.stringify(s.players.map(c=>[c.spec,c.condition])),priorDeal);assert.ok(s.racers.every(c=>!c.finished&&c.finishTime===null&&c.checkpoints===0&&c.progress<0&&c.condition.bodyDamage===0&&!c.condition.brakeBroken&&c.pedalForceN===0));
  assert.equal(Model.start(s),true);run(s,3);assert.equal(s.phase,'race');assert.equal(s.raceTime,0);assert.ok(s.players.every(c=>!c.finished&&c.lap===1));
});
test('garage-only APIs cannot repair a snapped pedal or change the active race',()=>{
  const s=moving(),c=s.players[0];c.condition.weakPedal=true;run(s,3,{brake:1});const track=s.track,draw=s.randomState,playerCount=s.playerCount;
  assert.equal(Model.reroll(s),false);assert.equal(Model.setTrack(s,'ridge'),false);assert.equal(Model.setPlayers(s,2),false);assert.equal(Model.start(s),false);assert.equal(s.track,track);assert.equal(s.randomState,draw);assert.equal(s.playerCount,playerCount);assert.equal(c.condition.brakeBroken,true);
  Model.pause(s);assert.equal(Model.reroll(s),false);assert.equal(Model.setTrack(s,'solar'),false);assert.equal(Model.setPlayers(s,2),false);Model.resume(s);Model.rescue(s,0);assert.equal(c.condition.brakeBroken,true);assert.equal(c.telemetry.brakeForce,0);assert.equal(c.telemetry.pedalForceN,0);assert.equal(c.telemetry.speedKmh,0);
});
