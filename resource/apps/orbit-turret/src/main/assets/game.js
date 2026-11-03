(function(root){
 'use strict';var C={bg:'#171d36',ink:'#edf1df',muted:'#b0bfd4',gold:'#f1cb77',cyan:'#76e2dc',pink:'#eca9c5',red:'#f69b84'},OX=290,OY=277;
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 var atlas={builtins:[],tiles:[{name:'starStation',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
  c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#363252'],[.45,'#1d2b49'],[1,'#141e35']]);c.fillRect(0,0,960,540);
  for(var i=0;i<100;i++){var x=(i*137+17)%960,y=(i*83+31)%540;art.ellipse(c,x,y,i%11===0?1.7:.8,i%11===0?1.7:.8,i%3?'#c6d7e738':'#e3b3d84d');}
  art.ellipse(c,OX,OY,222,222,'#11243a90');c.strokeStyle='#86c7d35e';c.lineWidth=1.5;[75,132,188,220].forEach(function(r){c.beginPath();c.arc(OX,OY,r,0,Math.PI*2);c.stroke();});
  c.strokeStyle='#7c9ebd36';c.lineWidth=1;for(var a=0;a<Math.PI*2;a+=Math.PI/12){c.beginPath();c.moveTo(OX+Math.cos(a)*215,OY+Math.sin(a)*215);c.lineTo(OX+Math.cos(a)*220,OY+Math.sin(a)*220);c.stroke();}c.beginPath();c.moveTo(OX-215,OY);c.lineTo(OX+215,OY);c.moveTo(OX,OY-215);c.lineTo(OX,OY+215);c.stroke();
  round(c,20,12,920,42,8,'#111e34e8','#667f9e');round(c,572,72,361,127,10,'#182a43e8','#718ba9',2);round(c,572,213,361,129,10,'#182a43e8','#718ba9',2);round(c,572,356,361,132,10,'#182a43e8','#718ba9',2);round(c,24,504,912,27,7,'#111e34e8','#667f9e');c.restore();
 }},{name:'stationBase',x:640,y:0,w:128,h:128,paint:function(c,w,h,art){
  art.ellipse(c,64,64,51,51,'#102538');c.strokeStyle='#83b3c7';c.lineWidth=5;c.beginPath();c.arc(64,64,47,0,Math.PI*2);c.stroke();art.path(c,[[45,17],[83,17],[111,45],[111,83],[83,111],[45,111],[17,83],[17,45]],art.linear(c,20,20,105,110,[[0,'#7197ad'],[1,'#2b4962']]),'#bcdfde',4);art.ellipse(c,64,64,33,33,'#263b51');for(var a=0;a<Math.PI*2;a+=Math.PI/2)round(c,56+Math.cos(a)*38,56+Math.sin(a)*38,16,16,3,'#f0d18a','#394b5d',2);
 }},{name:'turretGun',x:768,y:0,w:128,h:128,paint:function(c,w,h,art){
  art.ellipse(c,64,68,36,31,'#0c1d2c80');round(c,65,49,50,30,5,'#dec78f','#203e56',4);round(c,97,45,18,38,4,'#83c1d2','#d8ece2',3);c.fillStyle='#223e54';c.fillRect(109,52,7,24);art.ellipse(c,62,64,32,32,art.linear(c,30,30,90,95,[[0,'#c3e2df'],[1,'#709fb7']]));c.strokeStyle='#e6f1df';c.lineWidth=4;c.beginPath();c.arc(62,64,31,0,Math.PI*2);c.stroke();art.ellipse(c,62,64,15,15,'#2d4e69');art.path(c,[[58,54],[73,64],[58,74]],'#e4ca8a');
 }},{name:'orbitalRock',x:896,y:0,w:128,h:128,paint:function(c,w,h,art){
  art.path(c,[[64,14],[94,28],[115,60],[102,94],[67,115],[32,102],[14,69],[27,32]],art.linear(c,20,20,110,110,[[0,'#f2dfcd'],[.5,'#c7a2b9'],[1,'#6a5f88']]),'#f7eee1',4);art.path(c,[[27,32],[57,46],[64,14],[69,66],[102,94],[61,86],[32,102],[45,68]],'#8e779b55');art.ellipse(c,78,45,12,9,'#685e8170');art.ellipse(c,45,79,9,8,'#685e8170');
 }}]};
 var model=root.PureModel,config=model.config;function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}function ring(r,x,y,radius,width,color){for(var i=0;i<48;i++){var a=i*Math.PI/24,b=(i+1)*Math.PI/24;r.line(x+Math.cos(a)*radius,y+Math.sin(a)*radius,x+Math.cos(b)*radius,y+Math.sin(b)*radius,width,color);}}
 function render(r,s){var l=config.layouts[s.level],wave=s.spawned?l.spawns[s.spawned-1].wave:1,next=s.spawned<l.goal?Math.max(0,l.spawns[s.spawned].at-s.time):null;
  r.sprite('starStation',480,270,960,540,0,'#ffffff');
  s.enemies.forEach(function(e){var color=e.spin===0?C.gold:C.pink;for(var i=6;i>0;i--){var age=Math.max(0,e.age-i*.07),prior=Math.max(0,e.age-(i-1)*.07),rr=206-e.speed*age,a=e.angle0+e.spin*age,rr2=206-e.speed*prior,a2=e.angle0+e.spin*prior;r.line(OX+Math.cos(a)*rr,OY+Math.sin(a)*rr,OX+Math.cos(a2)*rr2,OY+Math.sin(a2)*rr2,2,i>3?'#abb9d343':color);}
   r.sprite('orbitalRock',OX+e.x,OY+e.y,27,27,e.angle, e.r<94?'#ffb7a6':e.spin===0?'#fff0c0':'#e8c6f1');ring(r,OX+e.x,OY+e.y,11,1.3,e.r<94?C.red:color);if(e.r<94){var a=Math.atan2(e.y,e.x);r.line(OX+e.x+Math.cos(a)*16,OY+e.y+Math.sin(a)*16,OX+e.x+Math.cos(a)*23,OY+e.y+Math.sin(a)*23,3,C.red);}
  });
  s.bullets.forEach(function(b){r.line(OX+b.x-b.vx*.027,OY+b.y-b.vy*.027,OX+b.x,OY+b.y,3,'#e9d9a46b');r.circle(OX+b.x,OY+b.y,6,'#fff4c137');r.circle(OX+b.x,OY+b.y,4,C.gold);r.circle(OX+b.x,OY+b.y,1.5,'#ffffff');});
  if(s.shieldRemaining>0){r.circle(OX,OY,64,'#69dacf18');ring(r,OX,OY,64,3,C.cyan);ring(r,OX,OY,60,1,'#92ecec82');for(var i=0;i<6;i++){var a=i*Math.PI/3+s.time*.4;r.circle(OX+Math.cos(a)*64,OY+Math.sin(a)*64,3,C.ink);}}
  r.sprite('stationBase',OX,OY,64,64,0,'#ffffff');ring(r,OX,OY,24,1,s.health===1?C.red:C.cyan);r.sprite('turretGun',OX,OY,80,80,s.angle,'#ffffff');var ax=Math.cos(s.angle),ay=Math.sin(s.angle);r.line(OX+ax*42,OY+ay*42,OX+ax*52,OY+ay*52,2,C.gold);
  s.effects.forEach(function(e){var f=e.age/config.effectLifetime,color=e.cause==='shot'?C.gold:e.cause==='shield'?C.cyan:C.red;ring(r,OX+e.x,OY+e.y,9+f*22,Math.max(1,3-f*2),color);for(var i=0;i<4;i++){var a=i*Math.PI/2+f;r.line(OX+e.x+Math.cos(a)*(10+f*16),OY+e.y+Math.sin(a)*(10+f*16),OX+e.x+Math.cos(a)*(14+f*24),OY+e.y+Math.sin(a)*(14+f*24),2,color);}});
  r.rect(22,13,916,40,'#111e34');text(r,l.name,35,21,28,C.ink);text(r,'360 DEG DEFENSE',678,24,24,C.muted);r.rect(26,505,908,25,'#111e34');
  text(r,'BASE INTEGRITY',590,84,24,C.muted);for(var i=0;i<3;i++){r.rect(591+i*103,119,91,34,i<s.health?'#8ce0cf':'#30455a');frame(r,591+i*103,119,91,34,i<s.health?'#d8eee0':'#667b91',2);center(r,i+1,636+i*103,122,25,i<s.health?'#243e50':C.muted);}text(r,'WAVE '+wave+' / '+l.waves,590,167,25,C.ink);
  text(r,'RESOLVED '+s.resolved+' / '+s.goal,590,225,27,C.ink);text(r,'GUN '+s.shotKills+'   SHIELD '+s.shieldKills,590,265,24,C.gold);text(r,next===null?'ALL TARGETS IN':'NEXT IN '+next.toFixed(1)+'s',590,305,24,C.muted);
  text(r,'SHIELDS '+s.shieldCharges+' / 2',590,369,27,C.cyan);text(r,s.shieldRemaining>0?'ACTIVE '+s.shieldRemaining.toFixed(1)+'s':'B: 1.25s PULSE',590,408,24,s.shieldRemaining>0?C.cyan:C.muted);text(r,'BEARING '+Math.round(s.angle*180/Math.PI)%360,590,451,24,C.gold);
  text(r,'LEFT / RIGHT AIM',38,505,24,C.muted);text(r,'HOLD A FIRE',385,505,24,C.gold);text(r,'B SHIELD',757,505,24,C.cyan);
 }
 root.GameDef={id:'orbit-turret',title:'环轨炮台',seed:config.defaultSeed,accent:C.cyan,background:C.bg,atlas:atlas,holdConfirmAsA:true,
  tagline:'固定炮位，守住整片环轨',levelLabel:'警戒',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['按住射击','短时护盾'],
  description:'炮台固定在中央。左右持续转动，按住 A 连射，瞄准目标前方。B 开启 1.25 秒近身护盾，每局两次。拦下全部来袭目标即可过关；基地耐久只有三点。',
  controls:{move:'左右持续旋转；上下不使用',a:'按住空格、Z、确认 / 手机右上：射击',b:'X / 手机右下：开启一次短时护盾'},
  tip:'弹丸有飞行时间；粉色目标沿弧线靠近，金色目标直冲。护盾只挡触及青圈的目标，不能清空远处敌人。漏过一个扣一点耐久，第三次撞击失败，即使它是最后目标。暂停会停住整个战场。',
  winTitle:'环轨清空，基地守住',loseTitle:'基地失守，重新布防',
  hud:function(s){var l=config.layouts[s.level];return[{label:'基地耐久',value:s.health+' / 3'},{label:'已解决目标',value:s.resolved+' / '+s.goal},{label:'当前波次',value:(s.spawned?l.spawns[s.spawned-1].wave:1)+' / '+l.waves},{label:'剩余护盾',value:s.shieldCharges+' / 2'}];},
  result:function(s){return(s.phase==='won'?'全部目标已经解决。':'基地承受了第三次撞击。')+'枪击 '+s.shotKills+'，护盾拦截 '+s.shieldKills+'，漏防 '+s.impacts+'。';},render:render};
})(window);
