(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var HZ = 60, DT = 1 / HZ, EPS = 1e-10, PI2 = Math.PI * 2;
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function finite(v, fallback) { return Number.isFinite(v) ? v : fallback; }
  function wrap(a) { return ((a + Math.PI) % PI2 + PI2) % PI2 - Math.PI; }
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  var PHYSICS = {
    gravity: 9.81, maxBank: .55, maxPitch: .18, bankTau: .35, pitchTau: .28,
    maxAirspeed: 32, brakeDeceleration: 1.4, brakeSink: 1.4, bankSinkFactor: .9,
    stallSinkBase: 3, stallSinkFactor: 2, stallTurnFactor: .35, minTurnSpeed: 8,
    configurations: {
      clean: { bestSpeed: 18, minSink: .70, polarCoefficient: .008, stallSpeed: 10.5 },
      flaps: { bestSpeed: 14, minSink: .58, polarCoefficient: .018, stallSpeed: 8.2 }
    }
  };
  var COURSES = [
    { name: '初升谷地', start: [0, 0, 62, 18], wind: [.35, .10],
      rings: [[-35,170,55,28],[25,390,84,24],[-20,610,60,28]],
      thermals: [[-3,285,95,4.8]], runway: [0,920,0,220,110],
      mountains: [[-145,240,55,120],[155,390,60,150],[-150,650,65,110],[155,840,55,130]] },
    { name: '侧风长谷', start: [0, 0, 64, 18.5], wind: [-.65, .15],
      rings: [[40,180,57,28],[-45,430,88,25],[25,680,60,28]],
      thermals: [[-10,310,100,5]], runway: [20,1020,.04,240,120],
      mountains: [[-155,280,60,135],[145,510,52,120],[-155,750,58,140],[160,950,55,120]] },
    { name: '双热流航线', start: [-15, 0, 66, 19], wind: [.7, -.3],
      rings: [[-40,160,58,28],[40,390,90,26],[-30,590,76,28],[20,760,46,28]],
      thermals: [[0,280,95,5],[-10,510,70,1.8]], runway: [-10,1020,-.035,240,120],
      mountains: [[-160,230,60,145],[155,430,55,140],[-160,650,60,150],[165,870,55,135]] }
  ];
  function thermalAt(s, x, z) {
    var lift = 0;
    for (var i = 0; i < s.thermals.length; i++) {
      var t = s.thermals[i], q = ((x-t.x)*(x-t.x)+(z-t.z)*(z-t.z))/(t.radius*t.radius);
      if (q < 1) lift += t.strength * (1-q);
    }
    return lift;
  }
  function progress(s) {
    s.checkpointCount = s.rings.length;
    s.checkpointsPassed = s.rings.filter(function (r) { return r.passed; }).length;
    s.nextRing = s.rings.findIndex(function (r) { return !r.passed; });
    if (s.nextRing < 0) s.nextRing = s.rings.length;
  }
  function velocity(s) {
    var p = s.glider, f = s.physics;
    var horizontal = p.airspeed * Math.cos(p.pitch);
    p.vx = horizontal*Math.sin(p.heading)+s.wind.x;
    p.vz = horizontal*Math.cos(p.heading)+s.wind.z;
    p.groundSpeed = Math.hypot(p.vx, p.vz);
    var cfg = f.configurations[p.flaps ? 'flaps' : 'clean'];
    p.stallSpeed = cfg.stallSpeed*Math.sqrt(1/Math.cos(p.bank));
    p.stalled = p.airspeed < p.stallSpeed;
    p.thermalLift = thermalAt(s,p.x,p.z);
  }
  function readiness(s) {
    var p=s.glider, r=s.runway, dx=p.x-r.x, dz=p.z-r.z;
    var along=dx*Math.sin(r.heading)+dz*Math.cos(r.heading);
    var across=dx*Math.cos(r.heading)-dz*Math.sin(r.heading);
    var headingError=Math.abs(wrap(p.heading-r.heading));
    var trackError=Math.abs(wrap(Math.atan2(p.vx,p.vz)-r.heading));
    var result={
      inside: Math.abs(along)<=r.length/2-p.radius+EPS && Math.abs(across)<=r.width/2-p.radius+EPS,
      allRings: s.checkpointsPassed===s.checkpointCount,
      airSpeedOk: p.airspeed>=r.minAirspeed-EPS && p.airspeed<=r.maxAirspeed+EPS,
      groundSpeedOk: p.groundSpeed<=r.maxGroundSpeed+EPS,
      verticalSpeedOk: p.verticalSpeed<0 && p.verticalSpeed>=-r.maxSinkSpeed-EPS,
      bankOk: Math.abs(p.bank)<=r.maxBank+EPS,
      pitchOk: p.pitch>=r.minPitch-EPS && p.pitch<=r.maxPitch+EPS,
      headingOk: headingError<=r.maxHeadingError+EPS,
      trackOk: trackError<=r.maxTrackError+EPS,
      notStalled: !p.stalled, headingError: headingError, trackError: trackError,
      along: along, across: across, ready: true, reason: 'ready'
    };
    var tests=[['allRings','checkpoints'],['inside','outside-runway'],['notStalled','stall'],
      ['airSpeedOk','airspeed'],['groundSpeedOk','ground-speed'],['verticalSpeedOk','vertical-speed'],
      ['bankOk','bank'],['pitchOk','pitch'],['headingOk','heading'],['trackOk','track']];
    for(var i=0;i<tests.length;i++) if(!result[tests[i][0]]) { result.ready=false; result.reason=tests[i][1]; break; }
    return result;
  }
  function status(s) {
    var p=s.glider;
    if(s.phase==='won') { s.flightMode='landed'; s.message='安全着陆，观测航线完成'; }
    else if(s.phase==='lost') {
      s.flightMode='crashed';
      var reasons={timeout:'航行时间已用尽',mountain:'撞上山体，提前留出绕行高度与距离',boundary:'飞出安全谷地',
        stall:'失速触地：低空速时降低机头，提前展开襟翼',ground:'未在完成观测后进入跑道着陆',
        'hard-landing':'着陆条件不足：检查速度、下降率与机身方向'};
      s.message=reasons[s.lostReason]||'本次航行结束';
    } else if(p.stalled) { s.flightMode='stall'; s.message='失速：降低机头恢复空速，留意地形高度'; }
    else if(p.airbrake) { s.flightMode='airbrake'; s.message='减速板展开：增加阻力与下沉，留意实际空速'; }
    else if(p.thermalLift>.05) { s.flightMode='thermal'; s.message='处于热流：查看实际升降率，合理保留空速'; }
    else if(s.checkpointsPassed===s.checkpointCount) {
      s.flightMode='approach';
      s.message=p.flaps?'观测完成，襟翼已展开：保持低速对齐跑道，平稳接地':'观测完成：展开襟翼，低速对齐跑道，平稳接地';
    }
    else { s.flightMode='glide'; s.message='无动力滑翔：穿过下一观测环，保留高度与空速'; }
  }
  function create(seed, difficulty) {
    var d=clamp(Math.floor(finite(difficulty,0)),0,2), c=COURSES[d], r=c.runway;
    var s={width:960,height:540,seed:finite(seed,1),difficulty:d,level:d+1,levelName:c.name,
      phase:'playing',tick:0,elapsed:0,timeLimit:90,remaining:90,score:0,lostReason:'',
      world:{xMin:-280,xMax:280,zMin:-100,zMax:1300,groundLevel:0},wind:{x:c.wind[0],z:c.wind[1]},
      physics:copy(PHYSICS),
      glider:{x:c.start[0],z:c.start[1],altitude:c.start[2],airspeed:c.start[3],heading:0,bank:0,pitch:0,
        vx:0,vz:0,groundSpeed:0,verticalSpeed:0,stalled:false,stallSpeed:10.5,stallTime:0,
        airbrake:false,flaps:false,thermalLift:0,sinkRate:0,radius:6,span:12,length:6},
      rings:c.rings.map(function(v,i){return{id:'ring-'+(i+1),x:v[0],z:v[1],altitude:v[2],radius:v[3],heading:0,passed:false};}),
      thermals:c.thermals.map(function(v,i){return{id:'thermal-'+(i+1),x:v[0],z:v[1],radius:v[2],strength:v[3]};}),
      mountains:c.mountains.map(function(v,i){return{id:'mountain-'+(i+1),x:v[0],z:v[1],radius:v[2],height:v[3]};}),
      runway:{x:r[0],z:r[1],heading:r[2],length:r[3],width:r[4],minAirspeed:8.7,maxAirspeed:13.5,
        maxGroundSpeed:14.5,maxSinkSpeed:1.8,maxBank:.18,minPitch:-.06,maxPitch:.12,maxHeadingError:.24,maxTrackError:.24},
      nextRing:0,checkpointsPassed:0,checkpointCount:c.rings.length,landingStatus:null,landingResult:null,collision:null,
      flightMode:'glide',message:'',flapToggles:0,events:[],initialEnergy:0,energy:0,thermalEnergyAdded:0,
      energyDissipated:0,energyError:0,lastStep:null,
      _accumulator:0,_lastB:false,_pendingB:false,_cancelEpoch:null};
    s.initialEnergy=s.energy=.5*s.glider.airspeed*s.glider.airspeed+s.physics.gravity*s.glider.altitude;
    velocity(s); s.landingStatus=readiness(s); status(s); return s;
  }
  // Intersect the complete swept horizontal disk interval with the height half-space.
  function cylinderFraction(a,b,m,radius) {
    var dx=b.x-a.x,dz=b.z-a.z, ox=a.x-m.x,oz=a.z-m.z, R=m.radius+radius;
    var A=dx*dx+dz*dz,B=2*(ox*dx+oz*dz),C=ox*ox+oz*oz-R*R,lo=0,hi=1;
    if(A<EPS) { if(C>EPS) return null; }
    else {
      var disc=B*B-4*A*C;
      if(disc < -EPS) return null;
      var q=Math.sqrt(Math.max(0,disc));
      lo=Math.max(lo,(-B-q)/(2*A)); hi=Math.min(hi,(-B+q)/(2*A));
    }
    var dh=b.altitude-a.altitude;
    if(Math.abs(dh)<EPS) { if(a.altitude>m.height+EPS) return null; }
    else if(dh>0) hi=Math.min(hi,(m.height-a.altitude)/dh);
    else lo=Math.max(lo,(m.height-a.altitude)/dh);
    if(lo>hi+EPS || hi<0 || lo>1) return null;
    return clamp(lo,0,1);
  }
  function firstContact(s,a,b) {
    var hit=null;
    function offer(t,type,id,priority) {
      if(t===null || t<0 || t>1) return;
      if(!hit || t<hit.fraction-EPS || (Math.abs(t-hit.fraction)<=EPS && priority<hit.priority))
        hit={type:type,id:id,fraction:t,priority:priority};
    }
    s.mountains.forEach(function(m){offer(cylinderFraction(a,b,m,s.glider.radius),'mountain',m.id,0);});
    var w=s.world;
    [['x',w.xMin,w.xMax],['z',w.zMin,w.zMax]].forEach(function(v){
      var axis=v[0],lo=v[1]+s.glider.radius,hi=v[2]-s.glider.radius;
      if(a[axis]<lo || a[axis]>hi) offer(0,'boundary',axis,1);
      else if(b[axis]<lo) offer((lo-a[axis])/(b[axis]-a[axis]),'boundary',axis+'-min',1);
      else if(b[axis]>hi) offer((hi-a[axis])/(b[axis]-a[axis]),'boundary',axis+'-max',1);
    });
    var ground=s.world.groundLevel;
    if(a.altitude<=ground) offer(0,'ground','ground',2);
    else if(b.altitude<=ground) offer((a.altitude-ground)/(a.altitude-b.altitude),'ground','ground',2);
    return hit;
  }
  function crossRings(s,a,b,contact) {
    var crossings=[];
    s.rings.forEach(function(r,i){
      if(r.passed) return;
      var nx=Math.sin(r.heading),nz=Math.cos(r.heading);
      var d0=(a.x-r.x)*nx+(a.z-r.z)*nz,d1=(b.x-r.x)*nx+(b.z-r.z)*nz;
      if(d1-d0<=EPS || d0>EPS || d1< -EPS) return;
      var t=clamp(-d0/(d1-d0),0,1);
      if(contact && t>=contact.fraction-EPS) return;
      var x=mix(a.x,b.x,t),z=mix(a.z,b.z,t),h=mix(a.altitude,b.altitude,t);
      var across=(x-r.x)*nz-(z-r.z)*nx,clearance=r.radius-s.glider.radius;
      if(clearance>=0 && across*across+(h-r.altitude)*(h-r.altitude)<=clearance*clearance+EPS)
        crossings.push({index:i,fraction:t});
    });
    crossings.sort(function(a,b){return a.fraction-b.fraction || a.index-b.index;});
    crossings.forEach(function(c){
      if(c.index!==s.nextRing) return;
      var r=s.rings[c.index]; r.passed=true;
      s.events.push({type:'checkpoint',id:r.id,index:c.index,at:s.elapsed-DT+DT*c.fraction});
      progress(s);
    });
  }
  function finish(s,phase,reason) {
    s.phase=phase; s.lostReason=reason||'';
    s.score=s.checkpointsPassed*300+(phase==='won'?1000+Math.floor(s.remaining)*10:0);
    status(s);
  }
  function tick(s,input) {
    s.tick++; s.elapsed=s.tick/HZ; s.remaining=Math.max(0,s.timeLimit-s.elapsed);
    if(s.elapsed>=s.timeLimit-EPS) { finish(s,'lost','timeout'); return; }
    if(s._pendingB) {
      s.glider.flaps=!s.glider.flaps; s.flapToggles++;
      s.events.push({type:'flaps',deployed:s.glider.flaps,at:s.elapsed});
      s._pendingB=false;
    }
    var p=s.glider,f=s.physics,g=f.gravity,old=copy(p);
    p.airbrake=!!input.a;
    var bank=old.bank+(input.x*f.maxBank-old.bank)*(1-Math.exp(-DT/f.bankTau));
    var pitch=old.pitch+(-input.y*f.maxPitch-old.pitch)*(1-Math.exp(-DT/f.pitchTau));
    var vRaw=Math.max(0,old.airspeed-g*Math.sin(pitch)*DT);
    var dhPitch=(old.airspeed*old.airspeed-vRaw*vRaw)/(2*g);
    var speed=Math.max(0,Math.min(vRaw,f.maxAirspeed)-(p.airbrake?f.brakeDeceleration*DT:0));
    var dragLoss=.5*(vRaw*vRaw-speed*speed),vAvg=(old.airspeed+speed)/2;
    var cfg=f.configurations[p.flaps?'flaps':'clean'],load=1/Math.cos(bank);
    var stallSpeed=cfg.stallSpeed*Math.sqrt(load),stalled=speed<stallSpeed;
    var normalSink=cfg.minSink+cfg.polarCoefficient*(vAvg-cfg.bestSpeed)*(vAvg-cfg.bestSpeed);
    var bankSink=f.bankSinkFactor*(load-1),brakeSink=p.airbrake?f.brakeSink:0;
    var stallSink=stalled?f.stallSinkBase+f.stallSinkFactor*(1-speed/stallSpeed):0;
    var sink=normalSink+bankSink+brakeSink+stallSink,thermal=thermalAt(s,old.x,old.z);
    var dh=dhPitch+(thermal-sink)*DT;
    var yaw=g*Math.tan(bank)/Math.max(vAvg,f.minTurnSpeed)*(stalled?f.stallTurnFactor:1)*DT;
    var horizontal=vAvg*Math.cos(pitch),mid=old.heading+yaw/2;
    var candidate={x:old.x+(horizontal*Math.sin(mid)+s.wind.x)*DT,
      z:old.z+(horizontal*Math.cos(mid)+s.wind.z)*DT,altitude:old.altitude+dh};
    progress(s);
    var contact=firstContact(s,old,candidate),fraction=contact?contact.fraction:1;
    crossRings(s,old,candidate,contact);
    p.x=mix(old.x,candidate.x,fraction); p.z=mix(old.z,candidate.z,fraction);
    p.altitude=mix(old.altitude,candidate.altitude,fraction);
    p.airspeed=Math.sqrt(Math.max(0,mix(old.airspeed*old.airspeed,speed*speed,fraction)));
    p.bank=mix(old.bank,bank,fraction); p.pitch=mix(old.pitch,pitch,fraction);
    p.heading=wrap(old.heading+yaw*fraction);
    p.verticalSpeed=dh/DT; p.sinkRate=sink;
    velocity(s); p.stallTime=p.stalled?old.stallTime+DT*fraction:0;
    var thermalEnergy=g*thermal*DT*fraction,dissipated=(dragLoss+g*sink*DT)*fraction;
    s.thermalEnergyAdded+=thermalEnergy; s.energyDissipated+=dissipated;
    s.energy=.5*p.airspeed*p.airspeed+g*p.altitude;
    s.energyError=s.energy-(s.initialEnergy+s.thermalEnergyAdded-s.energyDissipated);
    s.lastStep={dt:DT,fraction:fraction,thermalLift:thermal,sinkRate:sink,normalSink:normalSink,
      bankSink:bankSink,brakeSink:brakeSink,stallSink:stallSink,pitchHeightTransfer:dhPitch*fraction,
      thermalEnergy:thermalEnergy,dissipatedEnergy:dissipated,brakeAndCapLoss:dragLoss*fraction,headingDelta:yaw*fraction};
    s.landingStatus=readiness(s); s.score=s.checkpointsPassed*300;
    if(contact) {
      s.collision={type:contact.type,id:contact.id,fraction:fraction,at:s.elapsed-DT+DT*fraction,x:p.x,z:p.z,altitude:p.altitude};
      s.events.push({type:'contact',kind:contact.type,at:s.collision.at});
      if(contact.type==='ground') {
        s.landingResult={x:p.x,z:p.z,altitude:p.altitude,airspeed:p.airspeed,groundSpeed:p.groundSpeed,
          verticalSpeed:p.verticalSpeed,heading:p.heading,bank:p.bank,pitch:p.pitch,flaps:p.flaps,
          at:s.collision.at,flags:copy(s.landingStatus),accepted:s.landingStatus.ready};
        if(s.landingStatus.ready) finish(s,'won');
        else finish(s,'lost',p.stalled?'stall':(!s.landingStatus.inside||!s.landingStatus.allRings?'ground':'hard-landing'));
      } else finish(s,'lost',contact.type);
    } else status(s);
  }
  function step(s,dt,input) {
    if(!s || s.phase!=='playing') return s;
    input=input||{}; dt=clamp(finite(dt,0),0,.25);
    var cancelled=!!input.cancelled;
    if(Number.isFinite(input.cancelEpoch)) {
      if(s._cancelEpoch!==null && s._cancelEpoch!==input.cancelEpoch) cancelled=true;
      s._cancelEpoch=input.cancelEpoch;
    }
    var b=!!input.b;
    if(cancelled) s._pendingB=false;
    else if((b&&!s._lastB)||input.bPressed) s._pendingB=true;
    s._lastB=b;
    var controls={x:cancelled?0:clamp(finite(input.x,0),-1,1),
      y:cancelled?0:clamp(finite(input.y,0),-1,1),a:!cancelled&&!!input.a};
    s.events=[]; s._accumulator+=dt;
    while(s._accumulator+EPS>=DT && s.phase==='playing') {
      s._accumulator=Math.max(0,s._accumulator-DT); tick(s,controls);
    }
    if(s.events.length>32) s.events=s.events.slice(-32);
    return s;
  }
  return {create:create,step:step,TICK_HZ:HZ};
}));
