/* Brick Paddle: bounded substep circle contacts and public paddle steering. */
(function(root,factory){'use strict';const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.PureModel=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.keys(v).forEach(k=>freeze(v[k]));Object.freeze(v);}return v;}
const config=freeze({"defaultSeed":765,"fieldWidth":720,"fieldHeight":450,"paddleWidth":120,"paddleHeight":14,"paddleY":410,"paddleSpeed":480,"ballRadius":8,"ballSpeed":320,"launchVx":96,"minVerticalSpeed":80,"maxHorizontalRatio":0.85,"maxSubstep":0.004166666666666667,"epsilon":0.0001,"maxElapsed":86400,"maxCounter":2147483647,"initialLives":3,"layouts":[{"id":"glass-quay","name":"GLASS QUAY","nameZh":"玻璃码头","bricks":[{"id":0,"x":192.0,"y":60,"w":104,"h":28,"hp":1,"maxHp":1},{"id":1,"x":308.0,"y":60,"w":104,"h":28,"hp":1,"maxHp":1},{"id":2,"x":424.0,"y":60,"w":104,"h":28,"hp":1,"maxHp":1},{"id":3,"x":192.0,"y":108,"w":104,"h":28,"hp":1,"maxHp":1},{"id":4,"x":308.0,"y":108,"w":104,"h":28,"hp":1,"maxHp":1},{"id":5,"x":424.0,"y":108,"w":104,"h":28,"hp":1,"maxHp":1}]},{"id":"copper-arcade","name":"COPPER ARCADE","nameZh":"铜色拱廊","bricks":[{"id":0,"x":134.0,"y":60,"w":104,"h":28,"hp":1,"maxHp":1},{"id":1,"x":250.0,"y":60,"w":104,"h":28,"hp":2,"maxHp":2},{"id":2,"x":366.0,"y":60,"w":104,"h":28,"hp":1,"maxHp":1},{"id":3,"x":482.0,"y":60,"w":104,"h":28,"hp":1,"maxHp":1},{"id":4,"x":134.0,"y":108,"w":104,"h":28,"hp":1,"maxHp":1},{"id":5,"x":250.0,"y":108,"w":104,"h":28,"hp":1,"maxHp":1},{"id":6,"x":366.0,"y":108,"w":104,"h":28,"hp":2,"maxHp":2},{"id":7,"x":482.0,"y":108,"w":104,"h":28,"hp":1,"maxHp":1}]},{"id":"jade-workshop","name":"JADE WORKSHOP","nameZh":"翡翠工坊","bricks":[{"id":0,"x":76.0,"y":60,"w":104,"h":28,"hp":2,"maxHp":2},{"id":1,"x":192.0,"y":60,"w":104,"h":28,"hp":1,"maxHp":1},{"id":2,"x":308.0,"y":60,"w":104,"h":28,"hp":1,"maxHp":1},{"id":3,"x":424.0,"y":60,"w":104,"h":28,"hp":1,"maxHp":1},{"id":4,"x":540.0,"y":60,"w":104,"h":28,"hp":2,"maxHp":2},{"id":5,"x":76.0,"y":108,"w":104,"h":28,"hp":1,"maxHp":1},{"id":6,"x":192.0,"y":108,"w":104,"h":28,"hp":1,"maxHp":1},{"id":7,"x":308.0,"y":108,"w":104,"h":28,"hp":2,"maxHp":2},{"id":8,"x":424.0,"y":108,"w":104,"h":28,"hp":1,"maxHp":1},{"id":9,"x":540.0,"y":108,"w":104,"h":28,"hp":1,"maxHp":1}]}]}),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function count(s,key){s[key]=Math.min(config.maxCounter,s[key]+1);}
function event(s,type,fields){s.events.push(Object.assign({type,call:s.calls},fields));if(s.events.length>8)s.events.shift();}
function attach(s){s.ball.x=s.paddle.x;s.ball.y=s.paddle.y-s.ball.radius-2;s.ball.vx=s.ball.vy=0;s.ball.attached=true;}
function create(seed,level){
 seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;level=Number.isInteger(level)&&level>=0&&level<3?level:0;
 const s={schema:1,seed,level,phase:'playing',reason:'',score:0,paddle:{x:config.fieldWidth/2,y:config.paddleY,width:config.paddleWidth,height:config.paddleHeight,speed:config.paddleSpeed},ball:{x:config.fieldWidth/2,y:config.paddleY-config.ballRadius-2,vx:0,vy:0,radius:config.ballRadius,attached:true},bricks:copy(config.layouts[level].bricks),lives:config.initialLives,remaining:config.layouts[level].bricks.length,hits:0,launches:0,paddleHits:0,wallHits:0,misses:0,terminalReceipt:null,
 elapsed:0,elapsedCapped:false,calls:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},events:[],message:'左右持续移动弹板，A 发球；用不同触点调整反弹角度，清空全部砖块。'};return s;
}
function finish(s,won){s.phase=won?'won':'lost';s.reason=won?'':'lives';s.score=won?100:0;s.message=won?'全部砖块已击破，清砖完成。':'三次机会已经用完，重新发球再挑战。';event(s,won?'win':'collision',{reason:s.reason});s.terminalReceipt=copy({phase:s.phase,reason:s.reason,score:s.score,lives:s.lives,remaining:s.remaining,hits:s.hits,launches:s.launches,paddleHits:s.paddleHits,wallHits:s.wallHits,misses:s.misses,paddle:s.paddle,ball:s.ball,bricks:s.bricks});}
function normalize(ball){
 const length=Math.hypot(ball.vx,ball.vy);if(length===0){ball.vx=config.launchVx;ball.vy=-Math.sqrt(config.ballSpeed**2-ball.vx**2);return;}
 ball.vx*=config.ballSpeed/length;ball.vy*=config.ballSpeed/length;
 if(Math.abs(ball.vy)<config.minVerticalSpeed){ball.vy=(Math.sign(ball.vy)||-1)*config.minVerticalSpeed;ball.vx=(Math.sign(ball.vx)||1)*Math.sqrt(config.ballSpeed**2-ball.vy**2);}
}
function contact(ball,rect){
 const qx=clamp(ball.x,rect.x,rect.x+rect.w),qy=clamp(ball.y,rect.y,rect.y+rect.h),dx=ball.x-qx,dy=ball.y-qy,d2=dx*dx+dy*dy;
 if(d2>ball.radius*ball.radius)return null;
 if(d2>1e-12){const d=Math.sqrt(d2);return {nx:dx/d,ny:dy/d,penetration:ball.radius-d};}
 const faces=[{d:ball.x-rect.x,nx:-1,ny:0},{d:rect.x+rect.w-ball.x,nx:1,ny:0},{d:ball.y-rect.y,nx:0,ny:-1},{d:rect.y+rect.h-ball.y, nx:0,ny:1}];faces.sort((a,b)=>a.d-b.d);return {nx:faces[0].nx,ny:faces[0].ny,penetration:ball.radius+faces[0].d};
}
function advance(s,dt){
 const b=s.ball,p=s.paddle,r=b.radius;b.x+=b.vx*dt;b.y+=b.vy*dt;
 let wall=false;
 if(b.x<r){b.x=2*r-b.x;b.vx=Math.abs(b.vx);count(s,'wallHits');event(s,'wall',{side:'left'});wall=true;}
 if(b.x>config.fieldWidth-r){b.x=2*(config.fieldWidth-r)-b.x;b.vx=-Math.abs(b.vx);count(s,'wallHits');event(s,'wall',{side:'right'});wall=true;}
 if(b.y<r){b.y=2*r-b.y;b.vy=Math.abs(b.vy);count(s,'wallHits');event(s,'wall',{side:'top'});wall=true;}
 if(wall)normalize(b);
 const pc=b.vy>0?contact(b,{x:p.x-p.width/2,y:p.y,w:p.width,h:p.height}):null;
 if(pc&&pc.ny<-.01){const offset=clamp((b.x-p.x)/(p.width/2),-1,1);b.y=p.y-r-config.epsilon;b.vx=config.ballSpeed*config.maxHorizontalRatio*offset;b.vy=-Math.sqrt(config.ballSpeed**2-b.vx**2);count(s,'paddleHits');event(s,'paddle',{offset});}
 const impacts=[];
 for(const brick of s.bricks)if(brick.hp>0){const c=contact(b,brick);if(c&&b.vx*c.nx+b.vy*c.ny<-1e-8)impacts.push({brick,...c});}
 if(impacts.length){
  let nx=0,ny=0,penetration=0;
  for(const c of impacts){const weight=-(b.vx*c.nx+b.vy*c.ny);nx+=c.nx*weight;ny+=c.ny*weight;penetration=Math.max(penetration,c.penetration);c.brick.hp--;s.hits++;}
  const length=Math.hypot(nx,ny);if(length>1e-9){nx/=length;ny/=length;}else{nx=impacts[0].nx;ny=impacts[0].ny;}
  const dot=b.vx*nx+b.vy*ny;b.vx-=2*dot*nx;b.vy-=2*dot*ny;b.x+=nx*(penetration+config.epsilon);b.y+=ny*(penetration+config.epsilon);
  // Resolve any residual overlap after a simultaneous rounded-corner contact.
  for(let pass=0;pass<2;pass++)for(const c of impacts){const overlap=contact(b,c.brick);if(overlap&&overlap.penetration>0){b.x+=overlap.nx*(overlap.penetration+config.epsilon);b.y+=overlap.ny*(overlap.penetration+config.epsilon);}}
  normalize(b);s.remaining=s.bricks.filter(brick=>brick.hp>0).length;event(s,'brick',{ids:impacts.map(c=>c.brick.id),remaining:s.remaining});
  if(!s.remaining){finish(s,true);return;}
  s.message='已击中 '+impacts.length+' 块砖；还剩 '+s.remaining+' 块。';
 }
 if(b.y-r>config.fieldHeight){s.lives--;s.misses++;event(s,'life',{lives:s.lives});if(!s.lives){finish(s,false);return;}attach(s);s.message='漏接一次，剩余 '+s.lives+' 次机会；松开后重新按 A 发球。';}
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
 s.events=[];s.calls=Math.min(config.maxCounter,s.calls+1);const elapsed=s.elapsed+dt;s.elapsedCapped=s.elapsedCapped||elapsed>config.maxElapsed;s.elapsed=Math.min(config.maxElapsed,elapsed);
 if(i.cancelEpoch!==null)s.cancelEpoch=i.cancelEpoch;s.cancelledLast=i.cancelled;if(disarm)s.inputArmed=false;
 const control=!disarm&&!i.cancelled&&armed;
 if(control&&i.a&&!old.a&&s.ball.attached){s.ball.attached=false;s.ball.vx=config.launchVx;s.ball.vy=-Math.sqrt(config.ballSpeed**2-config.launchVx**2);count(s,'launches');event(s,'launch',{});s.message='球已发出；左右接球，用弹板边缘改变反弹方向。';}
 const n=Math.ceil(dt/config.maxSubstep),h=dt/n,x=control?i.x:0;
 for(let k=0;k<n&&s.phase==='playing';k++){s.paddle.x=clamp(s.paddle.x+x*s.paddle.speed*h,s.paddle.width/2,config.fieldWidth-s.paddle.width/2);if(s.ball.attached)attach(s);else advance(s,h);}
 if(!disarm&&!i.cancelled&&!i.a&&!i.b&&dir==='none')s.inputArmed=true;s.lastHeld={a:i.a,b:i.b,direction:dir};return s;
}
return Object.freeze({create,step,config});
});
