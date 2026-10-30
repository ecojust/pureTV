/* Used Car Racing TV: deterministic SI-unit vehicle dynamics and race rules.
 * An approachable simulation, not a certified real-vehicle engineering model.
 * XZ ground plane, +Z forward at yaw 0, positive yaw/lateral velocity turns right.
 * Brake pedal force is simulated from button hold; a phone does not measure Newtons. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./tracks.js'));else root.UsedCarModel=factory(root.UsedCarTracks);})(typeof window!=='undefined'?window:this,function(Tracks){
  'use strict';
  var STEP=1/120,G=9.81,TAU=Math.PI*2;
  var VEHICLES=[
    {id:'pocket98',modelId:'compact',name:['口袋火箭 98','POCKET 98'],year:1998,mass:970,wheelbase:2.42,length:3.7,width:1.65,height:1.48,cgHeight:.47,powerKw:82,peakTorque:146,redline:6800,drive:'FWD',dragArea:.63,mu:1.02,maxSteer:.57,color:0x24ceb0,gears:[3.42,1.98,1.36,1.03,.82],finalDrive:4.12,wheelRadius:.29,abs:true},
    {id:'executive04',modelId:'sedan',name:['行政快线 04','EXECUTIVE 04'],year:2004,mass:1460,wheelbase:2.78,length:4.65,width:1.82,height:1.43,cgHeight:.51,powerKw:141,peakTorque:255,redline:6500,drive:'RWD',dragArea:.65,mu:1.02,maxSteer:.52,color:0x6276e9,gears:[3.76,2.21,1.52,1.16,.87,.69],finalDrive:3.62,wheelRadius:.325,abs:true},
    {id:'comet96',modelId:'coupe',name:['彗星双门 96','COMET 96'],year:1996,mass:1210,wheelbase:2.54,length:4.3,width:1.78,height:1.27,cgHeight:.42,powerKw:161,peakTorque:262,redline:7300,drive:'RWD',dragArea:.56,mu:1.12,maxSteer:.53,color:0xf2b644,gears:[3.4,2.1,1.48,1.13,.89],finalDrive:3.92,wheelRadius:.31,abs:false},
    {id:'nomad07',modelId:'wagon',name:['远行旅行家 07','NOMAD 07'],year:2007,mass:1630,wheelbase:2.74,length:4.72,width:1.83,height:1.54,cgHeight:.55,powerKw:148,peakTorque:315,redline:6100,drive:'AWD',dragArea:.76,mu:1.0,maxSteer:.51,color:0x98b6ba,gears:[3.64,2.18,1.5,1.12,.85,.68],finalDrive:3.9,wheelRadius:.33,abs:true},
    {id:'iron88',modelId:'muscle',name:['铁锈猛兽 88','IRON 88'],year:1988,mass:1570,wheelbase:2.83,length:4.92,width:1.91,height:1.34,cgHeight:.53,powerKw:205,peakTorque:425,redline:5700,drive:'RWD',dragArea:.88,mu:.98,maxSteer:.49,color:0xce6145,gears:[2.92,1.93,1.33,1.0,.77],finalDrive:3.55,wheelRadius:.34,abs:false},
    {id:'strider02',modelId:'rally',name:['山猫四驱 02','STRIDER 02'],year:2002,mass:1320,wheelbase:2.52,length:4.25,width:1.8,height:1.41,cgHeight:.49,powerKw:173,peakTorque:305,redline:7100,drive:'AWD',dragArea:.73,mu:1.10,maxSteer:.55,color:0xe6e8d8,gears:[3.45,2.12,1.55,1.17,.89],finalDrive:4.15,wheelRadius:.315,abs:true}
  ];
  var FAULTS=[
    {id:'weak-pedal',name:['锈蚀刹车踏板','CORRODED BRAKE PEDAL'],description:['按住刹车积累模拟踏板力；达到 1600 N 立即断裂，本场无法再次制动。','Holding brake builds simulated pedal force. At 1600 N the pedal snaps and braking is lost for this race.']},
    {id:'worn-tires',name:['老化硬胎','AGED HARD TIRES'],description:['轮胎抓地力降低，制动距离更长，急转更容易推头或甩尾。','Reduced tire grip increases stopping distance and makes abrupt cornering less forgiving.']},
    {id:'brake-fade',name:['旧刹车油与薄刹车片','TIRED BRAKE FLUID / PADS'],description:['连续重刹会升温并明显衰减；留出冷却时间，提前减速。','Repeated heavy braking causes heat fade. Brake earlier and allow the brakes to cool.']},
    {id:'loose-rack',name:['转向机有旷量','LOOSE STEERING RACK'],description:['方向盘中央有空行程，转向响应较慢，需要更平顺地修正。','Center steering has free play and slower response. Use smooth, deliberate corrections.']},
    {id:'misfire',name:['高负荷偶发缺缸','INTERMITTENT MISFIRE'],description:['高负荷时发动机周期性缺缸，输出会短暂下降。','At high load the engine occasionally misfires, briefly reducing torque.']},
    {id:'no-abs',name:['ABS 故障灯常亮','ABS WARNING LAMP'],description:['ABS 已失效，过度制动会锁胎并损失转向抓地力。','ABS is unavailable. Excessive brake pressure locks tires and reduces steering grip.']}
  ];
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function finite(v,otherwise){return typeof v==='number'&&isFinite(v)?v:otherwise;}
  function sign(v){return v<0?-1:v>0?1:0;}
  function approach(v,target,rate,dt){var delta=target-v;return v+clamp(delta,-rate*dt,rate*dt);}
  function angle(v){return Math.atan2(Math.sin(v),Math.cos(v));}
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function seedNumber(seed){if(typeof seed==='number')return (seed>>>0)||0x137ace;var text=String(seed===undefined?'used-car-racing':seed),h=2166136261;for(var i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0)||0x137ace;}
  function random(state){var x=state.randomState;x^=x<<13;x^=x>>>17;x^=x<<5;state.randomState=x>>>0;return (x>>>0)/4294967296;}
  function event(state,kind,car,zh,en){state.events.push({id:++state.eventSerial,kind:kind,type:kind,racerId:car?car.id:null,playerIndex:car?car.playerIndex:null,text:[zh,en],time:state.time});if(state.events.length>24)state.events.shift();}
  function deal(state){
    var template=VEHICLES[Math.floor(random(state)*VEHICLES.length)],spec=copy(template),fault=copy(FAULTS[Math.floor(random(state)*FAULTS.length)]),wear=.80+random(state)*.17;
    if(!spec.abs&&fault.id==='no-abs')fault=copy(FAULTS[1]);
    spec.frontAxle=spec.wheelbase*(spec.drive==='FWD'?.42:.49);spec.rearAxle=spec.wheelbase-spec.frontAxle;spec.inertia=spec.mass*spec.wheelbase*spec.wheelbase*.245;spec.brakeGain=9.8;
    var condition={fault:fault,faults:[fault],weakPedal:fault.id==='weak-pedal',brakeBroken:false,pedalLimitN:fault.id==='weak-pedal'?1600:null,tireGrip:fault.id==='worn-tires'?.64+random(state)*.10:wear,brakeEfficiency:.82+random(state)*.16,absAvailable:spec.abs&&fault.id!=='no-abs',steeringPlay:fault.id==='loose-rack'?.10:0,steeringResponse:fault.id==='loose-rack'?1.25:2.75,powerFactor:fault.id==='misfire'?.92:.86+random(state)*.13,fadeProne:fault.id==='brake-fade',misfire:fault.id==='misfire',rust:.15+random(state)*.65,bodyDamage:0,mileage:Math.round((85000+random(state)*220000)/1000)*1000,health:Math.round(wear*100)};
    return {spec:spec,condition:condition};
  }
  function neutral(){return {steer:0,throttle:0,brake:0,handbrake:false,reverse:false};}
  function normalize(input){input=input||{};return {steer:clamp(finite(input.steer,0),-1,1),throttle:clamp(finite(input.throttle,0),0,1),brake:clamp(finite(input.brake,0),0,1),handbrake:!!input.handbrake,reverse:!!input.reverse,cancelSeq:finite(input.cancelSeq,0)};}
  function place(state,car,index){
    var grid=9+Math.floor(index/2)*7,p=Tracks.sample(state.track,-grid),side=index%2===0?-2.15:2.15;
    car.x=p.x+p.nx*side;car.z=p.z+p.nz*side;car.y=p.y;car.yaw=p.heading;car.vx=0;car.vz=0;car.u=0;car.v=0;car.speed=0;car.yawRate=0;car.roll=0;car.pitch=0;car.steerAngle=0;car.wheelSpin=0;car.s=p.s;car.lateral=side;car.lap=1;car.rank=index+1;car.progress=-grid;car.nextCheckpoint=state.track.length/4;car.checkpoints=0;car.finished=false;car.finishTime=null;car.rpm=850;car.gear=1;car.shiftCooldown=0;car.brakeTemp=28;car.engineTemp=74;car.pedalForceN=0;car.throttle=0;car.ax=0;car.ay=0;car.inputs=neutral();car._lastCancelSeq=0;car._trackPoint=p;car._lastS=p.s;car._sampleTimer=0;car._impactCooldown=0;car._stuckTime=0;car._aiReverse=0;car._slowTime=0;car._advanceMarker=-grid;car._noAdvanceTime=0;car._rescueGrace=0;car._wrongWayTime=0;car.condition.brakeBroken=false;car.condition.bodyDamage=0;car.telemetry={speedKmh:0,rpm:850,gear:1,pedalForceN:0,brakeForce:0,brake:0,throttle:0,absActive:false,brakeTemp:28,grip:car.spec.mu*car.condition.tireGrip,slipAngle:0,engineTemp:74,damage:0,offRoad:false,locked:false,steerAngle:0,brakeBroken:false,lap:1,rank:car.rank};
  }
  function fillCars(state,redeal){
    var old=state.racers||[];state.racers=[];
    for(var i=0;i<state.totalCars;i++){var d=!redeal&&old[i]?{spec:old[i].spec,condition:old[i].condition}:deal(state);var car={id:i+1,playerIndex:i<state.playerCount?i:null,human:i<state.playerCount,spec:d.spec,condition:d.condition};place(state,car,i);state.racers.push(car);}
    state.players=state.racers.filter(function(c){return c.human;});
  }
  function create(options){
    options=options||{};var players=clamp(Math.floor(finite(options.playerCount,finite(options.players,1))),1,2),track=Tracks.get(options.trackId||options.track||'harbor');
    var state={seed:options.seed===undefined?1:options.seed,randomState:seedNumber(options.seed===undefined?1:options.seed),track:track,trackId:track.id,playerCount:players,totalCars:clamp(players+Math.floor(finite(options.aiCount,6-players)),players,8),laps:clamp(Math.floor(finite(options.laps,3)),1,9),phase:'garage',previousPhase:null,time:0,raceTime:0,countdown:3,accumulator:0,tick:0,events:[],eventSerial:0,racers:[],players:[],finishOrder:[],bestLap:null};
    fillCars(state,true);return state;
  }
  function releaseControls(state){state.racers.forEach(function(c){c.inputs=neutral();c.pedalForceN=0;c.throttle=0;c.steerAngle=0;c.telemetry.pedalForceN=0;c.telemetry.brake=0;c.telemetry.brakeForce=0;c.telemetry.throttle=0;});state.accumulator=0;}
  function start(state){if(state.phase!=='garage')return false;fillCars(state,false);state.phase='countdown';state.previousPhase=null;state.countdown=3;state.time=0;state.raceTime=0;state.tick=0;state.accumulator=0;state.events=[];state.finishOrder=[];event(state,'countdown',null,'准备起步','READY TO RACE');return true;}
  function pause(state){if(state.phase!=='race'&&state.phase!=='countdown')return false;state.previousPhase=state.phase;state.phase='paused';releaseControls(state);return true;}
  function resume(state){if(state.phase!=='paused')return false;state.phase=state.previousPhase||'race';state.previousPhase=null;releaseControls(state);return true;}
  function reset(state){state.phase='garage';state.previousPhase=null;state.time=0;state.raceTime=0;state.countdown=3;state.tick=0;state.accumulator=0;state.events=[];state.finishOrder=[];fillCars(state,true);return state;}
  function reroll(state){if(state.phase!=='garage')return false;fillCars(state,true);state.events=[];return true;}
  function setTrack(state,id){if(state.phase!=='garage')return false;state.track=Tracks.get(id);state.trackId=state.track.id;fillCars(state,false);return true;}
  function setPlayers(state,count){if(state.phase!=='garage')return false;state.playerCount=clamp(Math.floor(finite(count,1)),1,2);state.totalCars=6;fillCars(state,false);return true;}
  function tireForce(slip,load,mu){var b=8.5,c=1.35,e=.20,t=b*slip;return mu*load*Math.sin(c*Math.atan(t-e*(t-Math.atan(t))));}
  function gripCircle(fx,fy,max){var mag=Math.sqrt(fx*fx+fy*fy);if(mag>max&&mag>0){var scale=max/mag;return {x:fx*scale,y:fy*scale};}return {x:fx,y:fy};}
  function aiInput(state,car,dt){
    var near=car._trackPoint||Tracks.nearest(state.track,car.x,car.z),speed=Math.abs(car.u),look=12+speed*.9,p=Tracks.sample(state.track,car.s+look),lane=((car.id%3)-1)*1.25;
    if(!car.human&&!car.finished){if(car.progress>car._advanceMarker+3){car._advanceMarker=car.progress;car._noAdvanceTime=0;}else car._noAdvanceTime+=dt;car._slowTime=speed<1.4&&state.raceTime>7?car._slowTime+dt:0;if(car._slowTime>6||car._noAdvanceTime>10){var recovery=Tracks.sample(state.track,car.s-7);car.x=recovery.x;car.z=recovery.z;car.y=recovery.y;car.yaw=recovery.heading;car.u=0;car.v=0;car.vx=0;car.vz=0;car.yawRate=0;car.steerAngle=0;car.s=recovery.s;car._lastS=recovery.s;car._trackPoint=recovery;car.progress-=7;car._advanceMarker=car.progress;car._noAdvanceTime=0;car._slowTime=0;car._stuckTime=0;car._aiReverse=0;car.pedalForceN=0;car._rescueGrace=1.5;return neutral();}}
    var dx=p.x+p.nx*lane-car.x,dz=p.z+p.nz*lane-car.z,targetAngle=Math.atan2(dx,dz),error=angle(targetAngle-car.yaw),delta=Math.atan2(2*car.spec.wheelbase*Math.sin(error),Math.max(5,Math.sqrt(dx*dx+dz*dz)));
    var curvature=Math.abs(near.curvature);
    for(var i=1;i<=5;i++)curvature=Math.max(curvature,Math.abs(Tracks.sample(state.track,car.s+speed*.5+i*10).curvature));
    var mu=car.spec.mu*car.condition.tireGrip*near.grip,target=Math.min(43+car.id*.7,Math.sqrt(Math.max(.2,mu)*G*.48/Math.max(.001,curvature)));
    if(Math.abs(error)>.5)target=Math.min(target,14);if(Math.abs(error)>1.0)target=Math.min(target,6);
    if(Math.abs(near.lateral)>near.width*.48)target=Math.min(target,10);
    for(i=0;i<state.racers.length;i++){var other=state.racers[i];if(other===car||other.finished)continue;var ahead=(other.x-car.x)*Math.sin(car.yaw)+(other.z-car.z)*Math.cos(car.yaw),side=(other.x-car.x)*Math.cos(car.yaw)-(other.z-car.z)*Math.sin(car.yaw);if(ahead>0&&ahead<9+speed*.35&&Math.abs(side)<2.1)target=Math.min(target,Math.max(3,other.speed-2));}
    if(speed<1.3&&state.raceTime>5)car._stuckTime+=dt;else car._stuckTime=0;
    if(car._stuckTime>2.2&&car._aiReverse<=0){car._aiReverse=2.4;car._stuckTime=0;}
    if(car._aiReverse>0){car._aiReverse-=dt;return {steer:clamp(-delta/(car.spec.maxSteer/(1+speed*.028)),-.28,.28),throttle:.9,brake:0,reverse:true,handbrake:false};}
    var brake=speed>target+1?clamp((speed-target)/9,.16,car.condition.weakPedal?.76:1):0;
    var steer=clamp((delta-car.yawRate*.035)/(car.spec.maxSteer/(1+speed*.028)),-1,1);if(steer!==0)steer=sign(steer)*(Math.abs(steer)*(1-car.condition.steeringPlay)+car.condition.steeringPlay);var throttle=brake>0?0:clamp((target-speed)/6,.08,1);if(Math.abs(car.v)>2||Math.abs(near.lateral)>near.width*.35)throttle=Math.min(throttle,.32);return {steer:steer,throttle:throttle,brake:brake,reverse:false,handbrake:false};
  }
  function shift(car,dt){
    car.shiftCooldown=Math.max(0,car.shiftCooldown-dt);var spec=car.spec,ratio=spec.gears[Math.max(0,car.gear-1)]*spec.finalDrive,wheelRpm=Math.abs(car.u)/spec.wheelRadius*60/TAU;
    var expected=wheelRpm*ratio;
    if(car.gear>0&&car.shiftCooldown<=0){if(expected>spec.redline*.91&&car.gear<spec.gears.length){car.gear++;car.shiftCooldown=.22;}else if(expected<spec.redline*.34&&car.gear>1){car.gear--;car.shiftCooldown=.17;}}
    ratio=(car.gear<0?3.15:spec.gears[car.gear-1])*spec.finalDrive;
    var target=Math.max(850,wheelRpm*ratio);if(Math.abs(car.u)<3)target=Math.max(target,850+car.throttle*1900);
    car.rpm=approach(car.rpm,clamp(target,750,spec.redline+300),15000,dt);return ratio;
  }
  function stepCar(state,car,input,dt){
    if(car.finished){input={steer:0,throttle:0,brake:car.condition.brakeBroken?0:.65,handbrake:false,reverse:false};}
    var spec=car.spec,condition=car.condition;
    if(car.human&&finite(input.cancelSeq,0)!==car._lastCancelSeq){car._lastCancelSeq=finite(input.cancelSeq,0);car.pedalForceN=0;car.throttle=0;car.steerAngle=0;input=neutral();}
    car.inputs=input;car._rescueGrace=Math.max(0,car._rescueGrace-dt);car._impactCooldown=Math.max(0,car._impactCooldown-dt);car._sampleTimer-=dt;
    if(car._sampleTimer<=0){car._trackPoint=Tracks.nearest(state.track,car.x,car.z,car._trackPoint.index);car._sampleTimer=1/60;}
    var p=car._trackPoint,speed=Math.abs(car.u),offRoad=Math.abs(p.lateral)>p.width*.5;
    var targetSteer=input.steer;if(Math.abs(targetSteer)<condition.steeringPlay)targetSteer=0;else targetSteer=sign(targetSteer)*(Math.abs(targetSteer)-condition.steeringPlay)/(1-condition.steeringPlay);
    // Mechanical steering rate is finite; high-speed inputs receive a road-car rack limit.
    var rackLimit=spec.maxSteer/(1+speed*.028);car.steerAngle=approach(car.steerAngle,targetSteer*rackLimit,condition.steeringResponse,dt);
    car.throttle=approach(car.throttle,input.throttle,input.throttle>car.throttle?2.4:5.5,dt);
    var requestedForce=input.brake*1800;
    car.pedalForceN=approach(car.pedalForceN,requestedForce,requestedForce>car.pedalForceN?600:12000,dt);
    if(condition.weakPedal&&!condition.brakeBroken&&car.pedalForceN>=1600-1e-7){condition.brakeBroken=true;event(state,'pedal-break',car,'刹车踏板断裂！本场制动失效','BRAKE PEDAL SNAPPED — BRAKES LOST');}
    if(input.reverse&&speed<1.2)car.gear=-1;else if(!input.reverse&&car.gear<0&&speed<1.2)car.gear=1;
    var ratio=shift(car,dt),rpmFraction=car.rpm/spec.redline,torqueCurve=clamp(.60+.42*Math.sin(clamp(rpmFraction,0,1)*Math.PI)-Math.max(0,rpmFraction-.87)*1.35,.3,1.0);
    var misfire=condition.misfire&&car.throttle>.55&&Math.sin(state.raceTime*2.1+car.id)>.88;
    var torque=spec.peakTorque*torqueCurve*condition.powerFactor*(misfire?.48:1)*(1-condition.bodyDamage*.36);
    var engineForce=torque*ratio*.86/spec.wheelRadius*car.throttle*(car.gear<0?-1:1);
    if(car.rpm>spec.redline||car.shiftCooldown>0)engineForce*=.18;
    // A finite power envelope prevents constant first-gear force at high road speeds.
    engineForce=clamp(engineForce,-spec.powerKw*1000*condition.powerFactor/Math.max(5,speed),spec.powerKw*1000*condition.powerFactor/Math.max(5,speed));
    if(car.gear<0&&car.u<-10)engineForce=0;
    var fadeStart=condition.fadeProne?145:360,fade=clamp(1-Math.max(0,car.brakeTemp-fadeStart)/(condition.fadeProne?230:650),.23,1);
    var serviceBrake=condition.brakeBroken?0:car.pedalForceN*spec.brakeGain*condition.brakeEfficiency*fade;
    // This game deliberately has no independent emergency brake bypass after pedal failure.
    if(input.handbrake&&!condition.brakeBroken)serviceBrake=Math.max(serviceBrake,2200);
    var transfer=clamp(spec.mass*car.ax*spec.cgHeight/spec.wheelbase,-spec.mass*G*.22,spec.mass*G*.22);
    var downforce=.5*1.225*.08*speed*speed,totalWeight=spec.mass*G+downforce,frontLoad=clamp(totalWeight*spec.rearAxle/spec.wheelbase-transfer,totalWeight*.2,totalWeight*.8),rearLoad=totalWeight-frontLoad;
    var mu=spec.mu*condition.tireGrip*p.grip*(offRoad?.46:1)*(1-condition.bodyDamage*.10)*(1-.08*Math.min(1.5,Math.abs(car.ay)/G));
    var frontDrive=spec.drive==='FWD'?1:spec.drive==='AWD'?.45:0,rearDrive=1-frontDrive;
    var direction=speed>.08?sign(car.u):sign(engineForce),frontBrake=serviceBrake*.64,rearBrake=serviceBrake*.36;
    var lockedFront=frontBrake>mu*frontLoad*1.03&&speed>2,lockedRear=rearBrake>mu*rearLoad*1.03&&speed>2;
    var absActive=condition.absAvailable&&(lockedFront||lockedRear);
    if(condition.absAvailable){frontBrake=Math.min(frontBrake,mu*frontLoad*.92);rearBrake=Math.min(rearBrake,mu*rearLoad*.92);}
    var frontMu=mu*(lockedFront&&!condition.absAvailable?.66:1),rearMu=mu*(lockedRear&&!condition.absAvailable?.66:1);
    var slipDenom=Math.max(3,speed),frontSlip=car.steerAngle*sign(car.u||1)-Math.atan2(car.v+spec.frontAxle*car.yawRate,slipDenom),rearSlip=-Math.atan2(car.v-spec.rearAxle*car.yawRate,slipDenom);
    var frontLateral=tireForce(frontSlip,frontLoad,frontMu),rearLateral=tireForce(rearSlip,rearLoad,rearMu);
    var front=gripCircle(engineForce*frontDrive-frontBrake*direction,frontLateral,frontMu*frontLoad),rear=gripCircle(engineForce*rearDrive-rearBrake*direction,rearLateral,rearMu*rearLoad);
    var steeringCos=Math.cos(car.steerAngle),steeringSin=Math.sin(car.steerAngle),frontX=front.x*steeringCos-front.y*steeringSin,frontY=front.y*steeringCos+front.x*steeringSin;
    var drag=.5*1.225*spec.dragArea*car.u*Math.abs(car.u),rolling=(.013+(offRoad?.055:0))*spec.mass*G*sign(car.u),engineBraking=car.throttle<.05?Math.min(900,speed*38)*sign(car.u):0;
    var relativeYaw=angle(car.yaw-p.heading);
    var ax=(frontX+rear.x-drag-rolling-engineBraking)/spec.mass-G*p.grade*Math.cos(relativeYaw)+car.v*car.yawRate;
    var ay=(frontY+rear.y)/spec.mass-car.u*car.yawRate;
    // Slight axle load sensitivity and banking are represented without claiming full suspension FEM.
    ax+=Math.sin(p.bank)*G*Math.sin(relativeYaw);
    ay+=Math.sin(p.bank)*G*Math.cos(relativeYaw)+G*p.grade*Math.sin(relativeYaw);
    if(speed<.12&&serviceBrake>Math.abs(engineForce-spec.mass*G*p.grade*Math.cos(relativeYaw))+50)ax=-car.u/dt;
    var yawAcceleration=(spec.frontAxle*frontY-spec.rearAxle*rear.y)/spec.inertia;
    var oldU=car.u;car.u+=ax*dt;car.u=clamp(car.u,-12,100);
    if(direction&&car.u*direction<0&&Math.abs(engineForce)<serviceBrake+Math.abs(rolling)+Math.abs(engineBraking))car.u=0;
    if(Math.abs(car.u)<.035&&car.throttle<.03&&Math.abs(p.grade)<.02)car.u=0;
    var dynamicBlend=clamp((speed-2.5)/4.5,0,1),kinematicYaw=car.u/spec.wheelbase*Math.tan(car.steerAngle),kinematicV=kinematicYaw*spec.rearAxle;
    car.v+=ay*dt;car.yawRate+=yawAcceleration*dt;
    car.yawRate=car.yawRate*dynamicBlend+kinematicYaw*(1-dynamicBlend);
    car.v=car.v*dynamicBlend+kinematicV*(1-dynamicBlend);
    car.yawRate=clamp(car.yawRate,-2.8,2.8);car.v=clamp(car.v,-32,32);
    if(speed<.08&&car.throttle<.02){car.yawRate=0;car.v=0;}
    car.yaw=angle(car.yaw+car.yawRate*dt);
    var sin=Math.sin(car.yaw),cos=Math.cos(car.yaw);car.vx=sin*car.u+cos*car.v;car.vz=cos*car.u-sin*car.v;
    car.x+=car.vx*dt;car.z+=car.vz*dt;car.speed=Math.sqrt(car.u*car.u+car.v*car.v);car.ax=clamp((car.u-oldU)/dt,-18,16);car.ay=clamp((frontY+rear.y)/spec.mass,-18,18);
    car.roll=approach(car.roll,-car.ay/G*.075,1.2,dt);car.pitch=approach(car.pitch,-car.ax/G*.065,1.0,dt);car.wheelSpin+=(car.u/spec.wheelRadius)*dt;
    car.brakeTemp+=((frontBrake+rearBrake)*speed/19000-(car.brakeTemp-25)*(.018+speed*.0018))*dt;car.brakeTemp=clamp(car.brakeTemp,25,950);
    car.engineTemp+=((car.throttle*24+Math.max(0,car.rpm/spec.redline-.65)*15)-(car.engineTemp-66)*(.3+speed*.006))*dt;
    // Guardrails are physical: resolve the outward normal velocity, keep tangential motion.
    var post=Tracks.nearest(state.track,car.x,car.z,p.index),limit=post.width*.5+1.1;
    if(Math.abs(post.lateral)>limit){
      var wallSide=sign(post.lateral),normalSpeed=(car.vx*post.nx+car.vz*post.nz)*wallSide;
      car.x=post.x+post.nx*limit*wallSide;car.z=post.z+post.nz*limit*wallSide;
      if(normalSpeed>0){car.vx-=post.nx*wallSide*normalSpeed*1.18;car.vz-=post.nz*wallSide*normalSpeed*1.18;car.vx*=.96;car.vz*=.96;car.u=car.vx*sin+car.vz*cos;car.v=car.vx*cos-car.vz*sin;car.speed=Math.sqrt(car.u*car.u+car.v*car.v);car.yawRate*=.67;condition.bodyDamage=clamp(condition.bodyDamage+normalSpeed*.0035,0,.85);if(normalSpeed>3&&car._impactCooldown<=0){event(state,'collision',car,'擦撞护栏','GUARDRAIL IMPACT');car._impactCooldown=.7;}}
    }
    car._trackPoint=post;car._sampleTimer=1/60;car.y=post.y;car.lateral=post.lateral;car.s=post.s;
    var delta=car.s-car._lastS;if(delta>state.track.length*.5)delta-=state.track.length;if(delta<-state.track.length*.5)delta+=state.track.length;
    if(Math.abs(delta)<(speed+Math.abs(car.v)+8)*dt*2+2)car.progress+=delta;
    car._lastS=car.s;
    if(Math.abs(post.lateral)<post.width*.5+1.0){while(car.progress>=car.nextCheckpoint){car.checkpoints++;car.nextCheckpoint+=state.track.length/4;}}
    car.lap=clamp(Math.floor(Math.max(0,car.progress)/state.track.length)+1,1,state.laps);
    if(!car.finished&&car.progress>=state.track.length*state.laps&&car.checkpoints>=state.laps*4){car.finished=true;car.finishTime=state.raceTime;state.finishOrder.push(car.id);event(state,'finish',car,'冲过终点','FINISH LINE');}
    var t=car.telemetry;t.speedKmh=car.speed*3.6;t.rpm=car.rpm;t.gear=car.gear;t.pedalForceN=car.pedalForceN;t.brakeForce=condition.brakeBroken?0:frontBrake+rearBrake;t.brake=condition.brakeBroken?0:car.pedalForceN/1800;t.throttle=car.throttle;t.absActive=absActive;t.brakeTemp=car.brakeTemp;t.grip=mu;t.slipAngle=Math.atan2(car.v,Math.max(.2,Math.abs(car.u)));t.engineTemp=car.engineTemp;t.damage=condition.bodyDamage;t.offRoad=offRoad;t.locked=(lockedFront||lockedRear)&&!condition.absAvailable;t.steerAngle=car.steerAngle;t.brakeBroken=condition.brakeBroken;t.misfire=misfire;t.lap=car.lap;
  }
  function bodyContact(a,b){
    var af={x:Math.sin(a.yaw),z:Math.cos(a.yaw)},ar={x:af.z,z:-af.x},bf={x:Math.sin(b.yaw),z:Math.cos(b.yaw)},br={x:bf.z,z:-bf.x},axes=[af,ar,bf,br],dx=b.x-a.x,dz=b.z-a.z,best=Infinity,normal=null;
    for(var i=0;i<axes.length;i++){var n=axes[i],pa=Math.abs(n.x*af.x+n.z*af.z)*a.spec.length*.47+Math.abs(n.x*ar.x+n.z*ar.z)*a.spec.width*.47,pb=Math.abs(n.x*bf.x+n.z*bf.z)*b.spec.length*.47+Math.abs(n.x*br.x+n.z*br.z)*b.spec.width*.47,dot=dx*n.x+dz*n.z,overlap=pa+pb-Math.abs(dot);if(overlap<=0)return null;if(overlap<best){best=overlap;normal={x:n.x*(dot<0?-1:1),z:n.z*(dot<0?-1:1)};}}
    return {nx:normal.x,nz:normal.z,penetration:best};
  }
  function collisions(state){
    for(var i=0;i<state.racers.length;i++)for(var j=i+1;j<state.racers.length;j++){
      var a=state.racers[i],b=state.racers[j];if(a.finished||b.finished||a._rescueGrace>0||b._rescueGrace>0||Math.abs(a.y-b.y)>3)continue;
      var hit=bodyContact(a,b);if(!hit)continue;var nx=hit.nx,nz=hit.nz,invA=1/a.spec.mass,invB=1/b.spec.mass,contactX=(a.x+b.x)*.5,contactZ=(a.z+b.z)*.5;
      a.x-=nx*hit.penetration*invA/(invA+invB);a.z-=nz*hit.penetration*invA/(invA+invB);b.x+=nx*hit.penetration*invB/(invA+invB);b.z+=nz*hit.penetration*invB/(invA+invB);
      var closing=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;
      if(closing>0){var impulse=closing*1.10/(invA+invB);a.vx-=impulse*invA*nx;a.vz-=impulse*invA*nz;b.vx+=impulse*invB*nx;b.vz+=impulse*invB*nz;
        a.yawRate=clamp(a.yawRate+impulse*((contactX-a.x)*nz-(contactZ-a.z)*nx)/a.spec.inertia*.25,-2.8,2.8);b.yawRate=clamp(b.yawRate+impulse*((contactZ-b.z)*nx-(contactX-b.x)*nz)/b.spec.inertia*.25,-2.8,2.8);
        [a,b].forEach(function(c){c.u=c.vx*Math.sin(c.yaw)+c.vz*Math.cos(c.yaw);c.v=c.vx*Math.cos(c.yaw)-c.vz*Math.sin(c.yaw);c.speed=Math.sqrt(c.u*c.u+c.v*c.v);c.condition.bodyDamage=clamp(c.condition.bodyDamage+closing*.002,0,.85);c.telemetry.speedKmh=c.speed*3.6;c.telemetry.damage=c.condition.bodyDamage;});
        if(closing>3&&a._impactCooldown<=0){event(state,'collision',a,'车辆碰撞','CAR CONTACT');a._impactCooldown=.7;b._impactCooldown=.7;}
      }
    }
  }
  function ranking(state){var sorted=state.racers.slice().sort(function(a,b){if(a.finished&&b.finished)return a.finishTime-b.finishTime;if(a.finished)return -1;if(b.finished)return 1;return b.progress-a.progress;});sorted.forEach(function(c,i){c.rank=i+1;c.telemetry.rank=c.rank;});}
  function update(state,dt,inputs){
    if(state.phase!=='race'&&state.phase!=='countdown')return state;
    dt=clamp(finite(dt,0),0,.25);state.accumulator+=dt;var controls=(inputs||[]).map(normalize);
    while(state.accumulator+1e-10>=STEP){state.accumulator-=STEP;if(state.accumulator<0)state.accumulator=0;state.tick++;state.time+=STEP;
      if(state.phase==='countdown'){state.countdown=Math.max(0,state.countdown-STEP);if(state.countdown<1e-7){state.countdown=0;state.phase='race';event(state,'go',null,'绿灯！','GREEN LIGHT!');}continue;}
      state.raceTime+=STEP;
      for(var i=0;i<state.racers.length;i++){var car=state.racers[i],input=car.human?(controls[car.playerIndex]||neutral()):aiInput(state,car,STEP);stepCar(state,car,input,STEP);}
      collisions(state);ranking(state);
      if(state.players.every(function(c){return c.finished;})){state.phase='results';releaseControls(state);event(state,'results',null,'比赛结束','RACE COMPLETE');break;}
    }
    return state;
  }
  function rescue(state,playerIndex){
    if(state.phase!=='race')return false;var car=state.players[playerIndex||0];if(!car||car.finished)return false;
    var p=Tracks.sample(state.track,car.s);car.x=p.x;car.y=p.y;car.z=p.z;car.yaw=p.heading;car.u=0;car.v=0;car.vx=0;car.vz=0;car.yawRate=0;car.speed=0;car.pedalForceN=0;car.throttle=0;car.steerAngle=0;car._lastS=p.s;p.lateral=0;p.distance=0;car._trackPoint=p;car.lateral=0;car.telemetry.speedKmh=0;car.telemetry.pedalForceN=0;car.telemetry.brakeForce=0;car.telemetry.brake=0;car.telemetry.throttle=0;car.telemetry.offRoad=false;car.progress-=12;event(state,'rescue',car,'拖车复位 · 12 米罚退','RECOVERY — 12 M PENALTY');return true;
  }
  return {STEP:STEP,VEHICLES:VEHICLES,CARS:VEHICLES,FAULTS:FAULTS,TRACKS:Tracks.all,tracks:Tracks.all,create:create,update:update,start:start,pause:pause,resume:resume,reset:reset,newRace:reset,reroll:reroll,setTrack:setTrack,setPlayers:setPlayers,releaseControls:releaseControls,rescue:rescue,normalizeInput:normalize,sampleTrack:Tracks.sample,tireForce:tireForce,aiInput:aiInput,bodyContact:bodyContact};
});
