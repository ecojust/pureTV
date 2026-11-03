'use strict';
// Independent public-state geometry and keyboard steering. No production imports.
function fold(x,low=8,high=712){const span=high-low,period=2*span,t=((x-low)%period+period)%period;return low+(t<=span?t:period-t);}
function landing(s){const b=s.ball,plane=s.paddle.y-b.radius;if(b.attached)return b.x;if(b.vy>0)return fold(b.x+b.vx*Math.max(0,(plane-b.y)/b.vy),b.radius,720-b.radius);
 let bounce=b.radius;const ys=[...new Set(s.bricks.filter(x=>x.hp>0).map(x=>x.y+x.h+b.radius))].sort((a,b)=>b-a);for(const y of ys){if(y>b.y)continue;const x=fold(b.x+b.vx*((y-b.y)/b.vy),b.radius,720-b.radius);if(s.bricks.some(r=>r.hp>0&&r.y+r.h+b.radius===y&&x>=r.x-b.radius&&x<=r.x+r.w+b.radius)){bounce=y;break;}}
 const up=(bounce-b.y)/b.vy,down=(plane-bounce)/(-b.vy);return fold(b.x+b.vx*(up+down),b.radius,720-b.radius);
}
function target(s){const alive=s.bricks.filter(b=>b.hp>0);if(!alive.length)return s.paddle.x;const predicted=landing(s),nearest=alive.filter(r=>r.y===Math.max(...alive.map(b=>b.y))).slice().sort((a,b)=>Math.abs(a.x+a.w/2-predicted)-Math.abs(b.x+b.w/2-predicted)||b.y-a.y||a.id-b.id)[0];
 if(s.ball.attached){const flight=(400-(nearest.y+nearest.h+s.ball.radius))/Math.sqrt(320*320-96*96);return Math.max(60,Math.min(660,nearest.x+nearest.w/2-96*flight));}
 const dx=nearest.x+nearest.w/2-predicted,dy=s.paddle.y-s.ball.radius-(nearest.y+nearest.h+s.ball.radius),vx=320*dx/Math.hypot(dx,dy),offset=Math.max(-35,Math.min(35,60*vx/(320*.85)));return Math.max(60,Math.min(660,predicted-offset));
}
function controller(){let lastElapsed=null,interval=.08;return s=>{if(lastElapsed!==null&&s.elapsed>lastElapsed)interval=Math.min(.18,Math.max(.05,.7*interval+.3*(s.elapsed-lastElapsed)));lastElapsed=s.elapsed;if(!s.inputArmed||s.cancelledLast)return{x:0,a:false};const to=target(s),delta=to-s.paddle.x,dead=Math.max(12,s.paddle.speed*interval*.5);if(s.ball.attached)return Math.abs(delta)>dead?{x:Math.sign(delta),a:false}:{x:0,a:!s.lastHeld.a};return{x:Math.abs(delta)>dead?Math.sign(delta):0,a:false};};}
module.exports={fold,landing,target,controller};
