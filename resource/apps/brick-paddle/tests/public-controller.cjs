'use strict';
// Test-only feedback controller: public positions, velocities and remaining bricks.
// No production helper, saved route, model write or future-state evaluation.
function fold(x,low,high){const span=high-low,t=((x-low)%(2*span)+2*span)%(2*span);return low+(t<=span?t:2*span-t);}
function input(s,c,{deadband=16,maxOffset=35}={}){
 if(s.phase!=='playing'||!s.inputArmed||s.cancelledLast)return {};
 const b=s.ball,p=s.paddle,alive=s.bricks.filter(q=>q.hp>0);if(!alive.length)return {};
 let desired;
 if(b.attached){const target=alive.slice().sort((a,b)=>b.y-a.y||Math.abs(a.x+a.w/2-p.x)-Math.abs(b.x+b.w/2-p.x))[0];const time=(p.y-b.radius-(target.y+target.h+b.radius))/Math.sqrt(c.ballSpeed*c.ballSpeed-c.launchVx*c.launchVx);desired=target.x+target.w/2-c.launchVx*time;}
 else if(b.vy>0){const time=Math.max(0,(p.y-b.radius-b.y)/b.vy),landing=fold(b.x+b.vx*time,b.radius,c.fieldWidth-b.radius);
  const target=alive.slice().sort((a,b)=>b.y-a.y||Math.abs(a.x+a.w/2-landing)-Math.abs(b.x+b.w/2-landing))[0];const dx=target.x+target.w/2-landing,dy=p.y-b.radius-(target.y+target.h+b.radius),ratio=dx/Math.hypot(dx,dy);const offset=Math.max(-maxOffset,Math.min(maxOffset,p.width/2*ratio/c.maxHorizontalRatio));desired=landing-offset;
 }else desired=fold(b.x+b.vx*.55,b.radius,c.fieldWidth-b.radius);
 desired=Math.max(p.width/2,Math.min(c.fieldWidth-p.width/2,desired));const error=desired-p.x,x=Math.abs(error)>deadband?Math.sign(error):0;
 return {x,a:b.attached&&x===0&&!s.lastHeld.a};
}
module.exports={input,fold};
