// Public-observation flight feedback. The controller never imports PureModel,
// reads private fields, writes a snapshot, or follows an authored route/timing.
export const budgets={maxWebGLDrawCalls:3};
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const angle=value=>Math.atan2(Math.sin(value),Math.cos(value));
const dot=(x,z,n)=>x*n.x+z*n.z;
const direction=heading=>({x:Math.sin(heading),z:Math.cos(heading)});

function thermalAt(model,x,z){let lift=0;for(const thermal of model.thermals){const distance2=(x-thermal.x)**2+(z-thermal.z)**2;if(distance2<thermal.radius**2)lift+=thermal.strength*(1-distance2/thermal.radius**2)}return lift}
function passiveSink(model,brake){const g=model.glider,p=model.physics,c=p.configurations[g.flaps?'flaps':'clean'];return c.minSink+c.polarCoefficient*(g.airspeed-c.bestSpeed)**2+p.bankSinkFactor*(1/Math.cos(g.bank)-1)+(brake?p.brakeSink:0)}
function airHeadingForTrack(model,track){const g=model.glider,n=direction(track),right={x:n.z,z:-n.x};const across=dot(model.wind.x,model.wind.z,right),horizontal=Math.max(1,g.airspeed*Math.cos(g.pitch));const correction=Math.asin(clamp(-across/horizontal,-.8,.8));return angle(track+correction)}
function validatePhysics(p){for(const key of['gravity','maxBank','maxPitch','bankTau','pitchTau','maxAirspeed','brakeDeceleration','brakeSink','bankSinkFactor'])if(!Number.isFinite(p[key])||p[key]<=0)throw new Error('Missing or invalid public flight parameter: '+key);for(const mode of['clean','flaps'])for(const key of['bestSpeed','minSink','polarCoefficient','stallSpeed'])if(!Number.isFinite(p.configurations?.[mode]?.[key])||p.configurations[mode][key]<=0)throw new Error('Missing public flight configuration: '+mode+'.'+key)}

// Choose ordinary directional keys from predicted short-term attitude response.
// Diagonal keys normalize exactly like runtime.js. Actual position/energy are
// never predicted forward or replaced; the next decision observes the model.
function attitudeKeys(g,p,wantedBank,wantedPitch,interval){
 let best=null;
 for(const x of[-1,0,1])for(const y of[-1,0,1]){
  const length=Math.max(1,Math.hypot(x,y)),nx=x/length,ny=y/length;
  const bank=g.bank+(nx*p.maxBank-g.bank)*(1-Math.exp(-interval/p.bankTau));
  const pitch=g.pitch+(-ny*p.maxPitch-g.pitch)*(1-Math.exp(-interval/p.pitchTau));
  const cost=((bank-wantedBank)/p.maxBank)**2+2*((pitch-wantedPitch)/p.maxPitch)**2;
  if(best===null||cost<best.cost)best={x,y,cost};
 }
 const keys=[];if(best.x)keys.push(best.x>0?'ArrowRight':'ArrowLeft');if(best.y)keys.push(best.y>0?'ArrowDown':'ArrowUp');return keys;
}

export function createPilot(){
 let lastElapsed=null,lastRing=null,lastMode=null,flapKeyDown=false,braking=false;
 const diagnostics=[];
 const note=(kind,data)=>{if(diagnostics.length<250)diagnostics.push({kind,...data})};
 function pilot(state){
  if(state.phase!=='playing'||state.paused)return[];
  const m=state.model,g=m.glider,p=m.physics;
  if(lastElapsed!==null&&m.elapsed<lastElapsed){lastElapsed=null;lastRing=null;lastMode=null;flapKeyDown=false;braking=false;diagnostics.length=0}
  if(lastElapsed===null)validatePhysics(p);
  const interval=clamp(lastElapsed===null?.1:m.elapsed-lastElapsed,.05,.25);lastElapsed=m.elapsed;
  const approach=m.nextRing>=m.rings.length,ring=approach?null:m.rings[m.nextRing];
  if(lastRing!==m.nextRing){note('observed-checkpoint-progress',{elapsed:m.elapsed,nextRing:m.nextRing,x:g.x,z:g.z,altitude:g.altitude,airspeed:g.airspeed});lastRing=m.nextRing}
  if(lastMode!==m.flightMode){note('observed-flight-mode',{elapsed:m.elapsed,mode:m.flightMode,thermalLift:g.thermalLift,airspeed:g.airspeed,altitude:g.altitude});lastMode=m.flightMode}

  let track,wantedVertical;
  if(ring){
   const dx=ring.x-g.x,dz=ring.z-g.z;
   const normal=direction(ring.heading),right={x:normal.z,z:-normal.x},toPlane=dot(dx,dz,normal),toward=dot(g.vx,g.vz,normal),across=dot(-dx,-dz,right);
   // Capture the public ring's approach line early, rather than chasing its
   // center until the plane and suddenly reversing toward the following ring.
   const lookahead=Math.max(55,g.groundSpeed*4);
   track=angle(ring.heading+Math.atan2(-across,lookahead));
   const time=clamp(toPlane/Math.max(5,toward),1.2,15);
   wantedVertical=clamp((ring.altitude-g.altitude)/time,-3,3);
   if(toPlane<-.5){throw new Error('Required public ring plane was passed without checkpoint credit; do not invent a successful crossing')}
  }else{
   const r=m.runway,n=direction(r.heading),right={x:n.z,z:-n.x};
   const along=dot(g.x-r.x,g.z-r.z,n),across=dot(g.x-r.x,g.z-r.z,right);
   const intercept=Math.max(70,g.groundSpeed*4);
   track=angle(r.heading+Math.atan2(-across,intercept));
   const touchdownAlong=r.length*.12,distance=Math.max(12,touchdownAlong-along),forward=Math.max(5,dot(g.vx,g.vz,n));
   wantedVertical=clamp(-g.altitude*forward/distance,-3,-.18);
   if(g.altitude<8)wantedVertical=Math.max(wantedVertical,-r.maxSinkSpeed*.68);
  }
  const desiredHeading=airHeadingForTrack(m,track),headingError=angle(desiredHeading-g.heading);
  let wantedBank=clamp(Math.atan(g.airspeed*.65*headingError/p.gravity),-p.maxBank*.88,p.maxBank*.88);
  if(approach&&g.altitude<8)wantedBank=clamp(wantedBank,-m.runway.maxBank*.8,m.runway.maxBank*.8);

  // Braking is an energy-management decision, never a scheduled display input.
  const landingSpeed=approach?(m.runway.minAirspeed+m.runway.maxAirspeed)/2:0;
  const speedTarget=approach?landingSpeed:clamp(23-8*Math.abs(headingError),18,23);
  if(g.airspeed>speedTarget+.45)braking=true;else if(g.airspeed<speedTarget-.45)braking=false;
  const brake=braking;
  const lift=thermalAt(m,g.x,g.z),sink=passiveSink(m,brake);
  let wantedPitch=clamp(Math.asin(clamp((wantedVertical+sink-lift)/Math.max(4,g.airspeed),-.8,.8)),-p.maxPitch*.84,p.maxPitch*.84);
  const config=p.configurations[g.flaps?'flaps':'clean'];
  const safeSpeed=config.stallSpeed*Math.sqrt(1/Math.cos(g.bank))+1.3;
  if(g.airspeed<safeSpeed)wantedPitch=Math.min(wantedPitch,-.035-(safeSpeed-g.airspeed)*.035);
  if(approach&&g.altitude<5)wantedPitch=clamp(wantedPitch,m.runway.minPitch+.012,m.runway.maxPitch-.012);
  const keys=attitudeKeys(g,p,wantedBank,wantedPitch,interval);
  if(brake)keys.push('Space');
  if(approach&&!g.flaps&&!flapKeyDown){keys.push('b');flapKeyDown=true}else if(flapKeyDown)flapKeyDown=false;
  return keys;
 }
 pilot.diagnostics=()=>structuredClone(diagnostics);return pilot;
}
const defaultPilot=createPilot();
export function keys(state,options){return defaultPilot(state,options)}
export function assertProgress({after,trace},assert){
 const m=after.model;assert.equal(after.phase,'won');assert.equal(m.phase,'won');assert.equal(m.checkpointsPassed,m.checkpointCount);assert.equal(m.nextRing,m.rings.length);assert.ok(m.rings.every(r=>r.passed));assert.ok(m.landingResult?.accepted);assert.equal(m.lostReason,'');assert.ok(m.elapsed>=30&&m.elapsed<90);assert.ok(m.thermalEnergyAdded>0);assert.ok(m.flapToggles>=1);assert.ok(trace.some(s=>s.state.model.glider.airbrake));assert.ok(trace.some(s=>s.state.model.glider.thermalLift>0));assert.equal(m.score,m.checkpointsPassed*300+1000+Math.floor(m.remaining)*10);
 const g=m.glider,r=m.runway,n=direction(r.heading),right={x:n.z,z:-n.x};
 for(const flag of['inside','allRings','airSpeedOk','groundSpeedOk','verticalSpeedOk','bankOk','pitchOk','headingOk','trackOk','notStalled','ready'])assert.equal(m.landingResult.flags[flag],true,flag);
 assert.ok(Math.abs(g.altitude)<1e-8);assert.ok(Math.abs(dot(g.x-r.x,g.z-r.z,n))<=r.length/2-g.radius+1e-8);assert.ok(Math.abs(dot(g.x-r.x,g.z-r.z,right))<=r.width/2-g.radius+1e-8);
 assert.ok(g.airspeed>=r.minAirspeed&&g.airspeed<=r.maxAirspeed);assert.ok(g.groundSpeed<=r.maxGroundSpeed);assert.ok(g.verticalSpeed<0&&g.verticalSpeed>=-r.maxSinkSpeed);assert.ok(Math.abs(g.bank)<=r.maxBank);assert.ok(g.pitch>=r.minPitch&&g.pitch<=r.maxPitch);assert.ok(Math.abs(angle(g.heading-r.heading))<=r.maxHeadingError);assert.ok(Math.abs(angle(Math.atan2(g.vx,g.vz)-r.heading))<=r.maxTrackError);assert.equal(g.stalled,false);
 for(const item of trace){const x=item.state.model;assert.ok(Math.abs(x.energy-(x.initialEnergy+x.thermalEnergyAdded-x.energyDissipated))<1e-6);assert.ok(Math.abs(x.energy-(.5*x.glider.airspeed**2+x.physics.gravity*x.glider.altitude))<1e-6);assert.ok(x.checkpointsPassed>=0&&x.checkpointsPassed<=x.checkpointCount);assert.ok(x.glider.airspeed>=0&&x.glider.airspeed<=x.physics.maxAirspeed+1e-8)}
}
export function assertRetry({after,initial},assert){
 const m=after.model,g=m.glider,origin=initial.model.glider;assert.equal(after.phase,'playing');assert.equal(m.phase,'playing');assert.equal(m.level,initial.model.level);assert.equal(m.nextRing,0);assert.equal(m.checkpointsPassed,0);assert.ok(m.rings.every(r=>!r.passed));assert.equal(m.flapToggles,0);assert.equal(g.flaps,false);assert.equal(g.airbrake,false);assert.equal(m.landingResult,null);assert.equal(m.collision,null);assert.equal(m.score,0);assert.equal(m.lostReason,'');assert.ok(m.elapsed<2);assert.ok(Math.abs(m.energy-(m.initialEnergy+m.thermalEnergyAdded-m.energyDissipated))<1e-6);assert.equal(m.initialEnergy,initial.model.initialEnergy);
 for(const key of['world','wind','thermals','mountains','rings','runway','physics'])assert.deepEqual(m[key],initial.model[key]);
 assert.equal(g.bank,origin.bank);assert.equal(g.pitch,origin.pitch);assert.equal(g.heading,origin.heading);assert.equal(g.airspeed,origin.airspeed);
 const dt=m.elapsed-initial.model.elapsed;assert.ok(Math.abs(g.x-origin.x-(g.airspeed*Math.sin(g.heading)+m.wind.x)*dt)<1e-6);assert.ok(Math.abs(g.z-origin.z-(g.airspeed*Math.cos(g.heading)+m.wind.z)*dt)<1e-6);assert.ok(Math.abs(g.altitude-(m.energy-.5*g.airspeed**2)/m.physics.gravity)<1e-6);
}
