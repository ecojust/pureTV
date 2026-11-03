/* Pocket Golf: public geometry, fixed-step friction and low-speed segment capture. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":793,"fieldWidth":720,"fieldHeight":450,"ballRadius":8,"cupRadius":18,"captureRadius":12,"captureSpeed":65,"friction":95,"stopSpeed":8,"restitution":0.9,"angleStep":5,"angleSteps":72,"powerSpeeds":[80,155,230,305,380],"maxSubstep":0.004166666666666667,"epsilon":0.0001,"maxElapsed":86400,"maxCounter":2147483647,"layouts":[{"id":"opening-green","name":"OPENING GREEN","nameZh":"初见果岭","start":{"x":100,"y":225},"cup":{"x":580,"y":225},"strokeLimit":4,"obstacles":[]},{"id":"banking-cove","name":"BANKING COVE","nameZh":"回弹湾角","start":{"x":110,"y":330},"cup":{"x":610,"y":330},"strokeLimit":6,"obstacles":[{"id":0,"x":280,"y":180,"w":160,"h":240}]},{"id":"dogleg-garden","name":"DOGLEG GARDEN","nameZh":"曲径花园","start":{"x":120,"y":370},"cup":{"x":635,"y":120},"strokeLimit":6,"obstacles":[{"id":0,"x":280,"y":95,"w":140,"h":260},{"id":1,"x":480,"y":190,"w":110,"h":80}]}]});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function count(s,key){s[key]=Math.min(config.maxCounter,s[key]+1);}
function event(s,type,fields){s.events.push(Object.assign({type,call:s.calls},fields));if(s.events.length>8)s.events.shift();}
function create(seed,level){seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;const l=config.layouts[level];return{schema:1,seed,level,phase:'playing',reason:'',score:0,ball:{x:l.start.x,y:l.start.y,vx:0,vy:0,radius:config.ballRadius,moving:false},cup:{x:l.cup.x,y:l.cup.y,radius:config.cupRadius,captureRadius:config.captureRadius,maxSpeed:config.captureSpeed},obstacles:copy(l.obstacles),angleIndex:0,power:3,strokeLimit:l.strokeLimit,strokes:0,wallHits:0,obstacleHits:0,blockedActions:0,capture:null,physicsAccumulator:0,physicsTicks:0,shotTicks:0,shotTime:0,currentShot:null,lastShot:null,shotReceipts:[],trail:[],terminalReceipt:null,
 elapsed:0,elapsedCapped:false,calls:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:'静止时左右调角、上下调力度，A 击球；低速进入球杯才算进洞。'};}
function endShot(s,result){if(!s.currentShot)return;const receipt=copy(Object.assign({},s.currentShot,{end:{x:s.ball.x,y:s.ball.y},duration:s.shotTime,result,capture:s.capture}));s.shotReceipts.push(receipt);s.lastShot=copy(receipt);s.currentShot=null;}
function finish(s,won){s.phase=won?'won':'lost';s.reason=won?'':'strokes';s.score=won?100:0;s.ball.moving=false;s.ball.vx=s.ball.vy=0;s.physicsAccumulator=0;s.message=won?'球已低速入杯，完成这一洞。':'杆数用完且球已停稳，未能入杯。';event(s,won?'win':'collision',{reason:s.reason});s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,ball:s.ball,strokes:s.strokes,strokeLimit:s.strokeLimit,wallHits:s.wallHits,obstacleHits:s.obstacleHits,capture:s.capture,shotReceipts:s.shotReceipts});}
function blocked(s,reason,message){count(s,'blockedActions');event(s,'blocked',{reason});s.message=message;}
function command(s,key){if(key==='none'||key==='b')return;if(s.ball.moving)return blocked(s,'moving','球还在运动，停稳后再调角或击球。');
 if(key==='a'){const theta=s.angleIndex*config.angleStep*Math.PI/180,speed=config.powerSpeeds[s.power-1];s.ball.vx=Math.cos(theta)*speed;s.ball.vy=Math.sin(theta)*speed;s.ball.moving=true;s.strokes++;s.physicsAccumulator=0;s.shotTicks=0;s.shotTime=0;s.currentShot={stroke:s.strokes,from:{x:s.ball.x,y:s.ball.y},angleIndex:s.angleIndex,angle:s.angleIndex*config.angleStep,power:s.power,speed,wallHits:0,obstacleHits:0};s.trail=[{x:s.ball.x,y:s.ball.y}];event(s,'shot',copy(s.currentShot));s.message='第 '+s.strokes+' 杆：等待球停稳，低速进入杯口才有效。';return;}
 if(key==='left'||key==='right'){s.angleIndex=(s.angleIndex+(key==='right'?1:config.angleSteps-1))%config.angleSteps;event(s,'aim',{angleIndex:s.angleIndex});}else{const next=clamp(s.power+(key==='up'?1:-1),1,config.powerSpeeds.length);if(next===s.power)return blocked(s,'power','力度已到上下限。');s.power=next;event(s,'power',{power:s.power});}s.message='角度 '+s.angleIndex*config.angleStep+'°，力度 '+s.power+' / '+config.powerSpeeds.length+'；A 击球。';
}
function contact(b,o){const qx=clamp(b.x,o.x,o.x+o.w),qy=clamp(b.y,o.y,o.y+o.h),dx=b.x-qx,dy=b.y-qy,d2=dx*dx+dy*dy;if(d2>b.radius*b.radius)return null;if(d2>1e-12){const d=Math.sqrt(d2);return{nx:dx/d,ny:dy/d,depth:b.radius-d};}const sides=[{d:b.x-o.x,nx:-1,ny:0},{d:o.x+o.w-b.x,nx:1,ny:0},{d:b.y-o.y,nx:0,ny:-1},{d:o.y+o.h-b.y,nx:0,ny:1}];sides.sort((a,b)=>a.d-b.d);return{nx:sides[0].nx,ny:sides[0].ny,depth:b.radius+sides[0].d};}
function captureOnSegment(s,x,y,nx,ny,startSpeed,endSpeed,dt){
 const dx=nx-x,dy=ny-y,d2=dx*dx+dy*dy,ox=x-s.cup.x,oy=y-s.cup.y,r=s.cup.captureRadius;let enter=0,exit=1;
 if(d2<1e-18){if(ox*ox+oy*oy>r*r||startSpeed>s.cup.maxSpeed)return false;}else{const b=2*(ox*dx+oy*dy),c=ox*ox+oy*oy-r*r,disc=b*b-4*d2*c;if(disc<0)return false;const root=Math.sqrt(Math.max(0,disc));enter=Math.max(0,(-b-root)/(2*d2));exit=Math.min(1,(-b+root)/(2*d2));if(enter>exit)return false;}
 const distance=Math.sqrt(d2),slowDistance=startSpeed>s.cup.maxSpeed?(startSpeed*startSpeed-s.cup.maxSpeed*s.cup.maxSpeed)/(2*config.friction):0,slow=distance?slowDistance/distance:0,t=Math.max(enter,slow);if(t>exit+1e-10||t>1+1e-10)return false;
 const at=clamp(t,0,1),speed=Math.sqrt(Math.max(0,startSpeed*startSpeed-2*config.friction*distance*at));s.capture={x:x+dx*at,y:y+dy*at,speed:Math.min(speed,s.cup.maxSpeed),stroke:s.strokes};s.shotTime+=startSpeed>speed?(startSpeed-speed)/config.friction:0;s.ball.x=s.cup.x;s.ball.y=s.cup.y;s.ball.vx=s.ball.vy=0;s.ball.moving=false;endShot(s,'cup');finish(s,true);return true;
}
function wall(s,side){count(s,'wallHits');if(s.currentShot)s.currentShot.wallHits++;event(s,'wall',{side});}
function advance(s,h){
 const b=s.ball,speed=Math.hypot(b.vx,b.vy),duration=Math.min(h,speed/config.friction),nextSpeed=Math.max(0,speed-config.friction*duration),distance=(speed+nextSpeed)*duration/2,dx=speed?b.vx/speed:0,dy=speed?b.vy/speed:0,nx=b.x+dx*distance,ny=b.y+dy*distance;
 count(s,'physicsTicks');s.shotTicks++;if(captureOnSegment(s,b.x,b.y,nx,ny,speed,nextSpeed,h))return;b.x=nx;b.y=ny;b.vx=dx*nextSpeed;b.vy=dy*nextSpeed;s.shotTime+=h;
 const r=b.radius;
 if(b.x<r){b.x=2*r-b.x;b.vx=Math.abs(b.vx)*config.restitution;b.vy*=config.restitution;wall(s,'left');}
 if(b.x>config.fieldWidth-r){b.x=2*(config.fieldWidth-r)-b.x;b.vx=-Math.abs(b.vx)*config.restitution;b.vy*=config.restitution;wall(s,'right');}
 if(b.y<r){b.y=2*r-b.y;b.vy=Math.abs(b.vy)*config.restitution;b.vx*=config.restitution;wall(s,'top');}
 if(b.y>config.fieldHeight-r){b.y=2*(config.fieldHeight-r)-b.y;b.vy=-Math.abs(b.vy)*config.restitution;b.vx*=config.restitution;wall(s,'bottom');}
 // Stable descriptor order; three passes separate simultaneous rounded corners.
 for(let pass=0;pass<3;pass++)for(const o of s.obstacles){const c=contact(b,o);if(!c)continue;b.x+=c.nx*(c.depth+config.epsilon);b.y+=c.ny*(c.depth+config.epsilon);const dot=b.vx*c.nx+b.vy*c.ny;if(dot< -1e-9){b.vx=(b.vx-2*dot*c.nx)*config.restitution;b.vy=(b.vy-2*dot*c.ny)*config.restitution;count(s,'obstacleHits');if(s.currentShot)s.currentShot.obstacleHits++;event(s,'obstacle',{id:o.id});}}
 b.x=clamp(b.x,r,config.fieldWidth-r);b.y=clamp(b.y,r,config.fieldHeight-r);
 if(s.shotTicks%12===0){s.trail.push({x:b.x,y:b.y});if(s.trail.length>80)s.trail.shift();}
 if(Math.hypot(b.vx,b.vy)<=config.stopSpeed){b.vx=b.vy=0;b.moving=false;s.physicsAccumulator=0;endShot(s,'rest');event(s,'rest',{x:b.x,y:b.y,strokes:s.strokes});if(s.strokes>=s.strokeLimit)finish(s,false);else s.message='球已停稳，剩余 '+(s.strokeLimit-s.strokes)+' 杆；重新调角和力度。';}
}
function normalized(input){const neutral=()=>({x:0,y:0,a:false,b:false,cancelled:false,cancelEpoch:null,paused:false});
 try{if(!input||typeof input!=='object'||Array.isArray(input))return neutral();const v=Object.create(null);
  for(const k of ['x','y','a','b','cancelled','cancelEpoch','paused']){const d=Object.getOwnPropertyDescriptor(input,k);if(d&&Object.prototype.hasOwnProperty.call(d,'value'))v[k]=d.value;}
  const axis=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
  return {x:axis(v.x),y:axis(v.y),a:v.a===true,b:v.b===true,cancelled:v.cancelled===true,paused:v.paused===true,cancelEpoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null};
 }catch(_){return neutral();}
}
function direction(i){const x=Math.abs(i.x),y=Math.abs(i.y);return x<=.5&&y<=.5?'none':y>=x?(i.y>0?'down':'up'):(i.x>0?'right':'left');}
function step(s,dt,raw){
 if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
 const i=normalized(raw);if(i.paused)return s;const dir=direction(i),old=s.lastHeld,armed=s.inputArmed;
 const disarm=(i.cancelEpoch!==null&&s.cancelEpoch!==null&&i.cancelEpoch!==s.cancelEpoch)||(i.cancelled&&!s.cancelledLast);
 s.events=[];s.lastCommand='none';count(s,'calls');const elapsed=s.elapsed+dt;s.elapsedCapped=s.elapsedCapped||elapsed>config.maxElapsed;s.elapsed=Math.min(config.maxElapsed,elapsed);
 if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
 if(!disarm&&!i.cancelled&&armed){s.lastCommand=i.b&&!old.b?'b':i.a&&!old.a?'a':dir!=='none'&&dir!==old.direction?dir:'none';command(s,s.lastCommand);}
 if(s.ball.moving){s.physicsAccumulator+=dt;while(s.physicsAccumulator+1e-10>=config.maxSubstep&&s.phase==='playing'&&s.ball.moving){s.physicsAccumulator=Math.max(0,s.physicsAccumulator-config.maxSubstep);advance(s,config.maxSubstep);}}
 if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
}
return Object.freeze({create,step,config});
});
