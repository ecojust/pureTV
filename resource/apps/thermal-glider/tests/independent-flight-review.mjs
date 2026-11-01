// Independent energy ledger and swept-geometry boundary review. Synthetic
// physical fixtures are never browser/gameplay evidence. Fresh public-feedback
// flights are recorded separately below.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const modelUrl=new URL('../src/main/assets/game-model.js',import.meta.url),contractUrl=new URL('../docs/model-contract.md',import.meta.url);
const sha=b=>createHash('sha256').update(b).digest('hex'),modelHash=sha(await readFile(modelUrl)),contractHash=sha(await readFile(contractUrl));
const Model=createRequire(import.meta.url)(fileURLToPath(modelUrl)),clone=structuredClone,DT=1/60;
const checks=[],totals={energyTicks:0,thermalBoundaryCases:0,sweptMountainCases:0,landingPredicateCases:0,ordinaryPublicFeedbackWins:0};
const near=(a,b,epsilon=1e-7)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=epsilon,`${a} != ${b}`);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function test(name,fn){checks.push({name,passed:true,...fn()});}
function tick(s,input={}){Model.step(s,DT,{cancelEpoch:0,...input});}
function gravity(s){return s.physics.gravity;}
function mechanical(s){return .5*s.glider.airspeed**2+gravity(s)*s.glider.altitude;}
function energy(s){near(s.energy,mechanical(s));near(s.energy,s.initialEnergy+s.thermalEnergyAdded-s.energyDissipated);near(s.energyError,0);assert.ok(s.thermalEnergyAdded>=0&&s.energyDissipated>=0);totals.energyTicks++;}
function fixture(glider={}){
  const s=Model.create(203,0);
  Object.assign(s.glider,{x:0,z:0,altitude:100,airspeed:18,heading:0,bank:0,pitch:0,vx:0,vz:18,groundSpeed:18,verticalSpeed:0,stalled:false,stallTime:0,airbrake:false,flaps:false,thermalLift:0},glider);
  s.world={xMin:-5000,xMax:5000,zMin:-5000,zMax:5000,groundLevel:0};s.wind={x:0,z:0};s.thermals=[];s.mountains=[];s.rings=[];s.nextRing=s.checkpointsPassed=s.checkpointCount=0;
  s.runway={...s.runway,x:0,z:1000,heading:0,length:200,width:100};
  s.initialEnergy=s.energy=mechanical(s);s.thermalEnergyAdded=s.energyDissipated=s.energyError=0;
  return s;
}
function ring(id,z,extra={}){return{id,x:0,z,altitude:100,radius:20,heading:0,passed:false,...extra};}
function setRings(s,rings){s.rings=clone(rings);s.nextRing=s.checkpointsPassed=0;s.checkpointCount=rings.length;}
function cylinderFraction(a,b,m,radius){
  const x=a.x-m.x,z=a.z-m.z,dx=b.x-a.x,dz=b.z-a.z,R=m.radius+radius,A=dx*dx+dz*dz,B=2*(x*dx+z*dz),C=x*x+z*z-R*R;
  let lo=0,hi=1;
  if(A===0){if(C>0)return null;}
  else{let discriminant=B*B-4*A*C;if(discriminant<-1e-12*Math.max(1,B*B,Math.abs(4*A*C)))return null;const root=Math.sqrt(Math.max(0,discriminant));lo=Math.max(lo,(-B-root)/(2*A));hi=Math.min(hi,(-B+root)/(2*A));}
  const dh=b.altitude-a.altitude;
  if(dh===0){if(a.altitude>m.height)return null;}
  else if(dh<0)lo=Math.max(lo,(m.height-a.altitude)/dh);
  else hi=Math.min(hi,(m.height-a.altitude)/dh);
  return lo<=hi&&lo<=1&&hi>=0?Math.max(0,lo):null;
}
function partialEnergy(before,full,contact,fraction){
  for(const key of ['x','z','altitude'])near(contact.glider[key],before.glider[key]+(full.glider[key]-before.glider[key])*fraction);
  near(contact.glider.airspeed**2,before.glider.airspeed**2+(full.glider.airspeed**2-before.glider.airspeed**2)*fraction);
  for(const key of ['thermalEnergyAdded','energyDissipated'])near(contact[key],before[key]+(full[key]-before[key])*fraction);
  near(wrap(contact.glider.heading-before.glider.heading),wrap(full.glider.heading-before.glider.heading)*fraction);
  energy(contact);
}
test('pitch cycling, bank, brakes and mode toggles dissipate energy without thermal input',()=>{
  const s=fixture({altitude:4000});let previous=s.energy;
  for(let i=0;i<1800;i++){
    tick(s,{x:Math.sin(i/80)*.7,y:i%240<120?-.65:.65,a:i%150<15,b:i%60===0});
    assert.equal(s.phase,'playing');energy(s);assert.equal(s.thermalEnergyAdded,0);assert.ok(s.energy<=previous+1e-8);previous=s.energy;
  }
  return {activeTicks:1800,scope:'Explicit isolated high-altitude fixture; no authored-course or browser claim',finalEnergy:s.energy,energyDissipated:s.energyDissipated};
});
test('thermal input uses starting distance, vanishes at boundary and has no paused-entry award',()=>{
  const samples=[];
  for(const x of [0,9.9999,10,10.0001,-10]){
    const s=fixture({x});s.thermals=[{id:'boundary',x:0,z:0,radius:10,strength:3}];const expected=gravity(s)*Math.max(0,3*(1-x*x/100))*DT;
    const paused=clone(s);Model.step(s,0,{});for(const key of ['glider','tick','elapsed','energy','thermalEnergyAdded','energyDissipated'])assert.deepEqual(s[key],paused[key]);tick(s);near(s.thermalEnergyAdded,expected);energy(s);samples.push({x,thermalEnergyAdded:s.thermalEnergyAdded});totals.thermalBoundaryCases++;
  }
  const a=fixture(),b=fixture();a.wind={x:5,z:-7};tick(a);tick(b);near(a.glider.x-b.glider.x,5*DT);near(a.glider.z-b.glider.z,-7*DT);near(a.energy,b.energy);near(a.energyDissipated,b.energyDissipated);
  return {samples,windAdvectsWithoutEnergy:true,zeroDtNoFlightTimeOrEnergyChange:true};
});
test('real stall differs from normal sink and flaps trade low-speed lift for high-speed drag',()=>{
  const cases=[];
  for(const speed of [9.5,12,26]){
    const clean=fixture({airspeed:speed}),flaps=fixture({airspeed:speed});tick(clean);tick(flaps,{b:true});energy(clean);energy(flaps);near(clean.glider.airspeed,speed);near(flaps.glider.airspeed,speed);
    assert.equal(flaps.flapToggles,1);assert.equal(flaps.glider.flaps,true);
    if(speed===9.5){assert.equal(clean.glider.stalled,true);assert.equal(flaps.glider.stalled,false);assert.ok(flaps.glider.sinkRate<clean.glider.sinkRate);}
    if(speed===12)assert.ok(flaps.glider.sinkRate<clean.glider.sinkRate);
    if(speed===26)assert.ok(flaps.glider.sinkRate>clean.glider.sinkRate);
    cases.push({speed,cleanSink:clean.glider.sinkRate,flapSink:flaps.glider.sinkRate,cleanStalled:clean.glider.stalled,flapStalled:flaps.glider.stalled});
  }
  const ordinary=fixture();tick(ordinary);assert.ok(ordinary.glider.verticalSpeed<0);assert.equal(ordinary.glider.stalled,false);
  const held=fixture();for(let i=0;i<60;i++)tick(held,{b:true});assert.equal(held.flapToggles,1);tick(held);tick(held,{b:true});assert.equal(held.flapToggles,2);
  const cancelled=fixture();tick(cancelled,{b:true,bPressed:true,cancelled:true});tick(cancelled);assert.equal(cancelled.flapToggles,0);
  const brake=fixture();for(let i=0;i<60;i++)tick(brake,{a:true});near(brake.glider.airspeed,18-1.4,1e-6);assert.ok(brake.glider.altitude<100-1.4);energy(brake);
  return {cases,ordinarySinkIsNotStall:true,heldBrakeActive:true,heldBTogglesOnlyOnce:true,cancellationDoesNotQueueToggle:true};
});
test('forward swept ring events credit once in segment order and cannot be replayed backwards',()=>{
  const s=fixture();setRings(s,[ring('first',.1),ring('second',.2)]);tick(s);assert.equal(s.checkpointsPassed,2);assert.equal(s.nextRing,2);assert.ok(s.rings.every(r=>r.passed));assert.equal(s.score,600);
  s.glider.z=0;tick(s);assert.equal(s.checkpointsPassed,2);assert.equal(s.score,600);
  const reverse=fixture({z:.25,heading:Math.PI});setRings(reverse,[ring('first',.1)]);tick(reverse);assert.equal(reverse.checkpointsPassed,0);
  const outOfOrder=fixture();setRings(outOfOrder,[ring('required',.2),ring('later',.1)]);tick(outOfOrder);assert.equal(outOfOrder.checkpointsPassed,1);assert.equal(outOfOrder.rings[0].passed,true);assert.equal(outOfOrder.rings[1].passed,false);
  const offPlane=fixture({x:15});setRings(offPlane,[ring('small',.1,{radius:20})]);tick(offPlane);assert.equal(offPlane.checkpointsPassed,0);
  const ground=fixture({altitude:.005});const sink=.7,groundFraction=.005/(sink*DT),zAtGround=18*DT*groundFraction;
  setRings(ground,[ring('same-as-ground',zAtGround,{altitude:0})]);tick(ground);assert.equal(ground.phase,'lost');assert.equal(ground.checkpointsPassed,0);energy(ground);
  return {orderedCrossings:2,reverseRejected:true,outOfOrderNotRetroactivelyCredited:true,fullEnvelopeApertureRequired:true,contactAtSameFractionWinsTie:true,scope:'Explicit small-separation ring and ground-contact fixtures'};
});
test('swept mountain intersections include outside endpoints and descending through the top',()=>{
  const fixtures=[{x:15.999,z:-.26,airspeed:32,height:120},{x:15.999,z:-.26,airspeed:32,height:99.99},{x:16,z:-.26,airspeed:32,height:120}];
  const results=[];
  for(const f of fixtures){
    const before=fixture({x:f.x,z:f.z,airspeed:f.airspeed}),full=clone(before);tick(full);const mountain={id:'swept',x:0,z:0,radius:10,height:f.height};
    const fraction=cylinderFraction(before.glider,full.glider,mountain,before.glider.radius);assert.ok(fraction!==null&&fraction>=0&&fraction<=1);
    const s=clone(before);s.mountains=[mountain];tick(s);assert.equal(s.phase,'lost');assert.equal(s.collision.type,'mountain');near(s.collision.fraction,fraction,1e-6);partialEnergy(before,full,s,fraction);results.push({height:f.height,x:f.x,fraction});totals.sweptMountainCases++;
  }
  return {results,scope:'Exact quadratic horizontal interval intersected with a linear below-top interval; synthetic mountain fixtures'};
});
const landingFlags=['inside','allRings','airSpeedOk','groundSpeedOk','verticalSpeedOk','bankOk','pitchOk','headingOk','trackOk','notStalled'];
function landingFixture(){const s=fixture({altitude:.003,airspeed:11,flaps:true});s.runway={...s.runway,x:0,z:0,heading:0,length:200,width:100};return s;}
function fullUncontactedStep(before,input={}){
  // Altitude does not affect forces in this contract. A temporary +1000m
  // fixture isolates the unconstrained tick, then the same offset is removed.
  const s=clone(before),offset=1000;s.glider.altitude+=offset;s.initialEnergy+=gravity(s)*offset;s.energy+=gravity(s)*offset;
  tick(s,input);assert.equal(s.phase,'playing');s.glider.altitude-=offset;s.initialEnergy-=gravity(s)*offset;s.energy-=gravity(s)*offset;return s;
}
test('every landing predicate is required independently at actual swept ground contact',()=>{
  const cases=[
    ['inside',s=>{s.glider.x=s.runway.width/2-s.glider.radius+.001;}],
    ['allRings',s=>setRings(s,[ring('required',999)])],
    ['airSpeedOk',s=>{s.runway.minAirspeed=12;}],
    ['airSpeedOk',s=>{s.runway.maxAirspeed=10;}],
    ['groundSpeedOk',s=>{s.runway.maxGroundSpeed=10;}],
    ['verticalSpeedOk',s=>{s.runway.maxSinkSpeed=.5;}],
    ['verticalSpeedOk',s=>{s.glider.altitude=0;s.thermals=[{id:'level-ground',x:0,z:0,radius:20,strength:.58+.018*(11-14)**2}];}],
    ['verticalSpeedOk',s=>{s.glider.altitude=0;s.thermals=[{id:'rising-ground',x:0,z:0,radius:20,strength:1+.58+.018*(11-14)**2}];}],
    ['bankOk',s=>{s.glider.bank=.22;}],
    ['pitchOk',s=>{s.glider.pitch=-.07;}],
    ['headingOk',s=>{s.glider.heading=.25;s.wind.x=-s.glider.airspeed*Math.sin(.25);} ],
    ['trackOk',s=>{s.wind.x=3;}],
    ['notStalled',s=>{s.glider.airspeed=8;s.runway.minAirspeed=7;s.runway.maxSinkSpeed=20;}]
  ];
  const results=[];
  const good=landingFixture();tick(good);assert.equal(good.phase,'won');assert.equal(good.landingResult.accepted,true);assert.ok(landingFlags.every(k=>good.landingResult.flags[k]));energy(good);
  for(const [expected,modify] of cases){
    const s=landingFixture();modify(s);s.initialEnergy=s.energy=mechanical(s);tick(s);
    assert.equal(s.phase,'lost');assert.equal(s.collision.type,'ground');assert.equal(s.landingResult.accepted,false);
    const failed=landingFlags.filter(k=>!s.landingResult.flags[k]);assert.deepEqual(failed,[expected]);energy(s);results.push({failedPredicate:expected,reason:s.landingResult.flags.reason});totals.landingPredicateCases++;
  }
  return {results,acceptedControl:true,scope:'Synthetic near-ground fixtures, each with exactly one landing predicate false; no authored-flight claim'};
});
test('partial contact conserves both thermal and dissipative transfers and wraps heading correctly',()=>{
  const before=landingFixture();Object.assign(before.glider,{airspeed:14,pitch:-.1});before.thermals=[{id:'partial',x:0,z:0,radius:20,strength:.5}];before.initialEnergy=before.energy=mechanical(before);
  const full=fullUncontactedStep(before),s=clone(before);tick(s);assert.equal(s.collision.type,'ground');const f=before.glider.altitude/(before.glider.altitude-full.glider.altitude);
  assert.ok(f>0&&f<1);near(s.collision.fraction,f);assert.ok(s.thermalEnergyAdded>0&&s.energyDissipated>0);partialEnergy(before,full,s,f);
  const wrapped=landingFixture();Object.assign(wrapped.glider,{heading:Math.PI-.00001,bank:.1});wrapped.runway.heading=-Math.PI;
  const yawFull=fullUncontactedStep(wrapped),landed=clone(wrapped);tick(landed);assert.equal(landed.phase,'won');assert.ok(yawFull.glider.heading<0);assert.ok(landed.glider.heading<0);
  near(wrap(landed.glider.heading-wrapped.glider.heading),wrap(yawFull.glider.heading-wrapped.glider.heading)*landed.collision.fraction);
  near(landed.landingResult.flags.headingError,Math.abs(wrap(landed.glider.heading-landed.runway.heading)));
  near(landed.landingResult.flags.trackError,Math.abs(wrap(Math.atan2(landed.glider.vx,landed.glider.vz)-landed.runway.heading)));energy(landed);
  return {partialFraction:f,thermalEnergy:s.thermalEnergyAdded,dissipation:s.energyDissipated,wrappedContactHeading:landed.glider.heading,headingError:landed.landingResult.flags.headingError,trackError:landed.landingResult.flags.trackError};
});
test('full aircraft world envelope and equal-time terrain contacts take priority over landing',()=>{
  const boundary=fixture({x:13.999,heading:Math.PI/2});boundary.world.xMax=20;const f=(20-boundary.glider.radius-boundary.glider.x)/(18*DT);tick(boundary);assert.equal(boundary.phase,'lost');assert.equal(boundary.collision.type,'boundary');near(boundary.collision.fraction,f);near(boundary.glider.x,14);energy(boundary);
  const mountain=landingFixture();mountain.mountains=[{id:'ground-tie',x:0,z:0,radius:100,height:0}];tick(mountain);assert.equal(mountain.phase,'lost');assert.equal(mountain.collision.type,'mountain');assert.equal(mountain.landingResult,null);energy(mountain);
  const edge=landingFixture(),sink=.58+.018*(11-14)**2;edge.wind.x=1;edge.world.xMax=edge.glider.radius+edge.glider.altitude/sink;tick(edge);assert.equal(edge.phase,'lost');assert.equal(edge.collision.type,'boundary');assert.equal(edge.landingResult,null);energy(edge);
  return {worldBoundaryIncludesRadius:true,mountainWinsGroundTie:true,boundaryWinsGroundTie:true};
});
test('deadline precedes physics, terminal states freeze, and fresh rounds do not share state',()=>{
  const s=landingFixture();s.tick=5399;s.elapsed=5399/60;s.remaining=DT;const before=clone(s.glider),ledger=s.energy;tick(s,{b:true,a:true});assert.equal(s.phase,'lost');assert.equal(s.lostReason,'timeout');assert.deepEqual(s.glider,before);assert.equal(s.energy,ledger);assert.equal(s.flapToggles,0);
  const terminal=clone(s);for(let i=0;i<20;i++)tick(s,{x:1,y:1,a:true,b:true});assert.deepEqual(s,terminal);
  const old=Model.create(203,2),fresh=Model.create(203,2),baseline=clone(fresh);tick(old,{x:1,b:true});old.rings[0].passed=true;old.thermals[0].strength=999;old.wind.x=500;old.glider.altitude=-1;assert.deepEqual(fresh,baseline);assert.deepEqual(Model.create(203,2),baseline);
  return {timeoutBeforeLandingAndInput:true,terminalFrozen:true,freshRoundNoAliasing:true};
});
// This independently written controller only sees declared public geometry.
// It anticipates the analytic lift integral along its current straight-line aim
// and steers/uses brakes through ordinary analog inputs. It never imports the
// QA pilot or indexes a level-specific route or timed script.
function integratedLift(s,to,speed){const p=s.glider,dx=to.x-p.x,dz=to.z-p.z,L=Math.hypot(dx,dz);if(L<.001)return 0;const ux=dx/L,uz=dz/L;let sum=0;for(const t of s.thermals){const ox=p.x-t.x,oz=p.z-t.z,b=ox*ux+oz*uz,c=ox*ox+oz*oz-t.radius*t.radius,disc=b*b-c;if(disc<=0)continue;const a=Math.max(0,-b-Math.sqrt(disc)),z=Math.min(L,-b+Math.sqrt(disc));if(z<=a)continue;const integral=d=>d-(d*d*d/3+b*d*d+(ox*ox+oz*oz)*d)/(t.radius*t.radius);sum+=t.strength*(integral(z)-integral(a))/Math.max(speed,8);}return sum;}
function independentControls(s){const p=s.glider,f=s.physics,r=s.runway,landing=s.nextRing>=s.rings.length,nh={x:Math.sin(r.heading),z:Math.cos(r.heading)},along=(p.x-r.x)*nh.x+(p.z-r.z)*nh.z;
 let target=landing?{x:r.x-nh.x*r.length*.4,z:r.z-nh.z*r.length*.4,altitude:7}:s.rings[s.nextRing];
 let dx=target.x-p.x,dz=target.z-p.z,distance=Math.hypot(dx,dz),dir=Math.atan2(dx,dz);
 if(landing){const ahead=Math.max(35,Math.min(100,r.length/2-along));target={x:r.x+nh.x*(along+ahead),z:r.z+nh.z*(along+ahead),altitude:7};dx=target.x-p.x;dz=target.z-p.z;dir=Math.atan2(dx,dz);distance=Math.max(20,-r.length*.4-along);}
 const u={x:Math.sin(dir),z:Math.cos(dir)},perp=s.wind.x*u.z-s.wind.z*u.x,vh=Math.max(8,p.airspeed*Math.cos(p.pitch)),speedAlong=s.wind.x*u.x+s.wind.z*u.z+Math.sqrt(Math.max(1,vh*vh-perp*perp)),airx=speedAlong*u.x-s.wind.x,airz=speedAlong*u.z-s.wind.z,airheading=Math.atan2(airx,airz);
 const desiredBank=clamp(wrap(airheading-p.heading)*1.5-p.bank*.35,-f.maxBank,f.maxBank),x=clamp(desiredBank/f.maxBank,-1,1);
 const needFlaps=landing,flaps=needFlaps||p.flaps,cfg=f.configurations[flaps?'flaps':'clean'];
 const flare=landing&&p.altitude<8&&along>-r.length/2-20;
 const a=landing?p.airspeed>(flare?12.4:11.5):p.airspeed>20.5;
 const sink=cfg.minSink+cfg.polarCoefficient*(p.airspeed-cfg.bestSpeed)**2+(a?f.brakeSink:0)+f.bankSinkFactor*(1/Math.cos(p.bank)-1);
 const duration=distance/Math.max(landing?14:16,p.airspeed*.9);
 const forecast=landing?0:integratedLift(s,target,Math.max(13,p.airspeed));
 const required=(target.altitude-p.altitude-forecast)/Math.max(1,duration)+sink;
 let pitch=clamp(Math.asin(clamp(required/Math.max(p.airspeed,8),-.8,.8)),-f.maxPitch,f.maxPitch);
 if(flare)pitch=0;
 if(p.airspeed<(flaps?9.6:12.8))pitch=Math.min(pitch,-.06);
 return{x,y:clamp(-pitch/f.maxPitch,-1,1),a,b:needFlaps!==p.flaps};}

function deepFreeze(value){if(value&&typeof value==='object'){for(const v of Object.values(value))deepFreeze(v);Object.freeze(value);}return value;}
function observation(s){return deepFreeze(clone(Object.fromEntries(['glider','physics','runway','rings','nextRing','wind','thermals'].map(key=>[key,s[key]]))));}
test('three fresh authored courses complete with independent public-geometry feedback and real analog controls',()=>{
  const solutions=[];
  for(let difficulty=0;difficulty<3;difficulty++){
    const s=Model.create(203,difficulty);let input={},brakeTicks=0,maxEnergyError=0,minimumHeight=s.glider.altitude;const trace=[];
    for(let i=0;i<5401&&s.phase==='playing';i++){
      if(i%5===0){const view=observation(s),before=JSON.stringify(view);input=independentControls(view);assert.equal(JSON.stringify(view),before);assert.ok(Number.isFinite(input.x)&&Number.isFinite(input.y)&&Math.abs(input.x)<=1&&Math.abs(input.y)<=1);}
      if(input.a)brakeTicks++;tick(s,input);energy(s);maxEnergyError=Math.max(maxEnergyError,Math.abs(s.energyError));minimumHeight=Math.min(minimumHeight,s.glider.altitude);
      if(i%120===0)trace.push({tick:s.tick,checkpointsPassed:s.checkpointsPassed,x:s.glider.x,z:s.glider.z,altitude:s.glider.altitude,airspeed:s.glider.airspeed,flaps:s.glider.flaps});
    }
    assert.equal(s.phase,'won');assert.equal(s.checkpointsPassed,s.checkpointCount);assert.ok(s.rings.every(r=>r.passed));assert.equal(s.landingResult.accepted,true);assert.ok(landingFlags.every(k=>s.landingResult.flags[k]));assert.equal(s.collision.type,'ground');assert.ok(s.landingResult.verticalSpeed<0);assert.ok(s.elapsed>=30&&s.elapsed<90);assert.ok(s.thermalEnergyAdded>0&&s.energyDissipated>0&&brakeTicks>0&&s.flapToggles>0);assert.equal(s.score,s.checkpointsPassed*300+1000+Math.floor(s.remaining)*10);assert.ok(minimumHeight>=-1e-7);
    solutions.push({level:s.level,phase:s.phase,elapsed:s.elapsed,score:s.score,checkpointsPassed:s.checkpointsPassed,checkpointCount:s.checkpointCount,landingAccepted:true,landingResult:s.landingResult,thermalEnergyAdded:s.thermalEnergyAdded,energyDissipated:s.energyDissipated,maxEnergyError,brakeTicks,flapToggles:s.flapToggles,observationKeys:['glider','physics','runway','rings','nextRing','wind','thermals'],publicTraceSamples:trace.length,publicTraceSha256:sha(JSON.stringify(trace))});totals.ordinaryPublicFeedbackWins++;
  }
  return {solutions,scope:'Three untouched fresh production Model.create courses. Every observation is a deep-frozen clone of explicitly selected public fields, with no level number or private state. Only ordinary analog x/y, held A and edge B inputs advance the actual model. These are model flights, not browser footage.'};
});
assert.equal(sha(await readFile(modelUrl)),modelHash,'Model changed during independent review');assert.equal(sha(await readFile(contractUrl)),contractHash,'Contract changed during independent review');
const report={kind:'independent-energy-flight-review',passed:true,modelSha256:modelHash,contractSha256:contractHash,reviewScriptSha256:sha(await readFile(new URL(import.meta.url))),sourceUnchanged:true,checks,totals,
  methodology:'Independent mechanical-energy balance, exact quadratic swept-cylinder interval intersected with linear altitude, full landing-predicate counterexamples and shortest-angle contact checks. The separate feedback controller uses a closed-form thermal chord integral, public rings/wind/runway and ordinary analog controls; no production flight helper or QA pilot is imported.',
  scope:{syntheticBoundaryFixtures:true,ordinaryAuthoredModelFlights:3,normalGameplayVideoEvidence:false,browserExecuted:false,physicalTvTested:false,physicalPhoneTested:false},
  limitations:['The game specifies a deterministic point-mass model, not full CFD or a real aircraft training simulator.','Synthetic contacts and model flights do not prove actual browser/native timing or physical-device performance; those are separately verified.']};
const out=process.argv.indexOf('--out');if(out>=0){assert.ok(process.argv[out+1]);await writeFile(process.argv[out+1],JSON.stringify(report,null,2)+'\n');}console.log(JSON.stringify(report,null,2));
