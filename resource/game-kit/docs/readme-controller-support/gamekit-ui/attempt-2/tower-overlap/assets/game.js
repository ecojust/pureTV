(function(root){
 'use strict';
 var C={bg:'#142b39',ink:'#fff2d7',muted:'#a8c2cb',gold:'#ffc164',mint:'#90dfc5',red:'#ff927c'};
 var floorColors=['#b2cbd0','#72b7b9','#afc5db','#d4b890','#95aecb','#d6a895'];
 var atlas={builtins:[],tiles:[
  {name:'towerCity',x:0,y:0,w:640,h:384,paint:function(c,w,h,a){
   c.save();c.scale(w/960,h/540);
   c.fillStyle=a.linear(c,0,0,0,540,[[0,'#142e43'],[.48,'#3e5966'],[1,'#cc9270']]);c.fillRect(0,0,960,540);
   a.ellipse(c,697,168,67,67,'#f3c99529');a.ellipse(c,697,168,48,48,'#ffdaa13b');
   for(var layer=0;layer<3;layer++)for(var i=0;i<15;i++){
    var x=i*72-30+layer*19,y=356+(i*37+layer*41)%105;
    c.fillStyle=['#233f4f88','#243f4ed9','#172e3bf0'][layer];c.fillRect(x,y,52,540-y);
    if(layer===2){c.fillStyle='#efc98f55';for(var yy=y+13;yy<515;yy+=22)for(var xx=x+10;xx<x+43;xx+=16)c.fillRect(xx,yy,6,8);}
   }
   c.fillStyle='#102531eb';c.fillRect(0,0,154,540);c.fillRect(806,0,154,540);
   c.strokeStyle='#6d98a245';c.lineWidth=1;
   for(var y=92;y<480;y+=24){c.beginPath();c.moveTo(180,y);c.lineTo(780,y);c.stroke();}
   [174,786].forEach(function(x){c.strokeStyle='#d9bd8f66';c.lineWidth=3;c.beginPath();c.moveTo(x,62);c.lineTo(x,485);c.stroke();
    for(var yy=76;yy<470;yy+=36){c.strokeStyle='#d9bd8f44';c.lineWidth=1;c.beginPath();c.moveTo(x-8,yy);c.lineTo(x+8,yy+25);c.moveTo(x+8,yy);c.lineTo(x-8,yy+25);c.stroke();}});
   c.fillStyle='#0c202bd9';c.fillRect(160,478,640,13);c.fillStyle='#d8ac6f';c.fillRect(160,478,640,3);
   c.strokeStyle='#bca67d';c.lineWidth=4;c.beginPath();c.moveTo(174,64);c.lineTo(786,64);c.stroke();
   c.fillStyle='#132a36';c.fillRect(0,500,960,40);c.restore();
  }},
  {name:'stoneSlab',x:640,y:0,w:256,h:64,paint:function(c,w,h,a){
   a.path(c,[[3,18],[14,5],[242,5],[253,18]],a.linear(c,0,5,0,18,[[0,'#fff3d5'],[1,'#b7c8c2']]),'#3b6272',1.5);
   a.path(c,[[3,18],[253,18],[253,57],[3,57]],a.linear(c,0,18,0,57,[[0,'#d0e1db'],[.2,'#e6e9d9'],[.26,'#a2c0bb'],[1,'#678c94']]),'#345969',1.5);
   c.fillStyle='#ffffff77';c.fillRect(8,20,240,2);c.fillStyle='#355a6944';
   [40,84,128,172,216].forEach(function(x){c.fillRect(x,26,2,25);});
  }}
 ]};
 var model=root.PureModel,config=model.config;
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function floorY(s,index){return 466-index*Math.min(28,336/(s.goal+1));}
 function slab(r,x,width,y,color,angle){r.sprite('stoneSlab',180+x+width/2,y,width,Math.min(30,25),angle||0,color);}
 function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
 function rhythm(l,t){
  if(l.profile==='steady')return 1;if(l.profile==='pulse')return t<.8?1.2:.8;
  if(l.profile==='swell')return t<1.2?.7+.5*t:1.3-.5*(t-1.2);
  if(l.profile==='signal')return t<.35?0:1.2;
  if(l.profile==='gust')return t<.45?.55:t<.9?1.6:.9;return .55+.45*t;
 }
 function render(r,s){
  var l=config.layouts[s.level],top=s.floors[s.floors.length-1],targetY=floorY(s,s.floorsBuilt+1),moving=s.mode==='moving',overlap=0;
  r.sprite('towerCity',480,270,960,540,0,'#ffffff');
  center(r,'TOWER WORKS',480,13,22,C.gold);center(r,l.name,480,37,14,C.ink);
  text(r,'FLOOR',22,22,17,C.muted);text(r,String(s.floorsBuilt).padStart(2,'0'),20,51,56,C.ink);text(r,'/ '+s.goal,89,82,22,C.gold);
  // The full construction scale stays visible even on the 14-floor skyline.
  for(var i=0;i<=s.goal;i++){
   var y=floorY(s,i),built=i<=s.floorsBuilt;
   r.rect(104,y-6,30,2,built?C.gold:'#54717d');text(r,String(i).padStart(2,'0'),65,y-13,17,built?C.ink:'#76929e');
   if(i===s.floorsBuilt)r.rect(140,y-9,7,8,C.gold);
  }
  [top.x,top.x+top.width].forEach(function(edge){for(var y=112;y<targetY-15;y+=16)r.line(180+edge,y,180+edge,Math.min(y+7,targetY-15),1.2,'#d9f5d860');});
  s.floors.forEach(function(f){slab(r,f.x,f.width,floorY(s,f.index),floorColors[f.index%floorColors.length]);});
  if(s.slab){
   var active=s.slab,drop=s.mode==='dropping'?Math.min(1,s.dropElapsed/config.dropDuration):0;
   overlap=Math.max(0,Math.min(active.x+active.width,top.x+top.width)-Math.max(active.x,top.x));
   if(moving){frame(r,180+active.x,targetY-12,active.width,25,'#e5ddbd66',1);var ox=Math.max(active.x,top.x);if(overlap>0)r.rect(180+ox,targetY-16,overlap,3,overlap>=16?C.mint:C.red);}
   var yy=98+(targetY-98)*drop*drop,cx=180+active.x+active.width/2;
   if(moving){r.line(cx,66,cx,yy-15,2,'#ffdb8a');r.rect(cx-14,60,28,10,C.gold);}
   slab(r,active.x,active.width,yy,'#ffd49b');
   if(moving){var sign=active.direction;r.line(cx-sign*17,yy-25,cx+sign*17,yy-25,2,C.gold);r.line(cx+sign*17,yy-25,cx+sign*9,yy-30,2,C.gold);r.line(cx+sign*17,yy-25,cx+sign*9,yy-20,2,C.gold);}
  }
  if(s.phase==='lost'&&s.lastLanding&&s.lastLanding.width>0)slab(r,s.lastLanding.x,s.lastLanding.width,floorY(s,s.lastLanding.index),C.red);
  s.offcuts.forEach(function(c){var yy=floorY(s,s.lastLanding.index)+8+c.age*90+c.age*c.age*180;if(yy<484)slab(r,c.x+c.side*c.age*38,c.width,yy,'#c48774',c.side*(.12+c.age*.8));});
  text(r,'TOP WIDTH',822,24,16,C.muted);text(r,top.width.toFixed(0),822,53,40,top.width<40?C.gold:C.ink);
  r.rect(823,111,116,6,'#365463');r.rect(823,111,116*top.width/l.width,6,C.mint);
  text(r,'OVERLAP',822,146,16,C.muted);text(r,s.slab?overlap.toFixed(0):s.phase==='won'?'OK':'MISS',822,174,36,s.slab&&overlap<16?C.red:C.mint);
  text(r,'MIN 16',823,219,16,C.gold);
  text(r,'RHYTHM',822,264,16,C.muted);
  var chartX=822,chartY=295,chartW=117,chartH=58;
  r.rect(chartX,chartY,chartW,chartH,'#1f3d4c');
  for(var j=1;j<=36;j++){var t1=l.period*(j-1)/36,t2=l.period*j/36;
   r.line(chartX+(j-1)*chartW/36,chartY+chartH-rhythm(l,t1)/1.7*chartH,chartX+j*chartW/36,chartY+chartH-rhythm(l,Math.min(l.period-.00001,t2))/1.7*chartH,1.7,C.gold);}
  if(s.slab){var marker=chartX+s.slab.cycle/l.period*chartW;r.line(marker,chartY,marker,chartY+chartH,2,C.ink);}
  text(r,'SPEED',822,375,16,C.muted);text(r,s.slab?Math.abs(s.slab.velocity).toFixed(0):'0',822,402,32,C.ink);
  text(r,'A  DROP',822,460,19,C.gold);
  text(r,'SITE '+(s.level+1)+' / '+config.layouts.length,22,511,16,C.muted);
  center(r,moving?'ALIGN THE EDGES  /  PRESS A':s.mode==='dropping'?'POSITION LOCKED  /  LANDING':s.phase==='won'?'SKYLINE COMPLETE':'REBUILD YOUR TOWER',480,511,17,C.ink);
  text(r,'NO SNAP',824,511,16,C.gold);
 }
 root.GameDef={id:'tower-overlap',title:'叠塔工匠',seed:config.defaultSeed,accent:C.gold,background:C.bg,atlas:atlas,stylesheet:'game-theme.css',
  holdConfirmAsA:true,tagline:'六座工地 · 六种节律 · 向天际搭建',levelLabel:'工地',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['落下石板'],
  description:'看准石板与下层的重合，按 A 锁定并落下，只留下重合部分。六座工地从匀速入门到停走信号、三段阵风与十四层加速高塔；左侧看层数，右侧看节律与有效宽度。',
  controls:{move:'石板自动往返，看准重合',a:'空格 / 确认 / 手机右区：落下',b:'B 不使用；松开 A 再按'},
  tip:'按 A 锁定位置；只保留重合部分。宽度不足16失败，右侧曲线显示本关速度节律。',
  winTitle:'塔楼落成，叠塔成功',loseTitle:'台面失守，重新开工',
  hud:function(s){return[{label:'施工目标',value:s.floorsBuilt+' / '+s.goal+' 层',tone:'good'},
   {label:'剩余台面',value:s.floors[s.floors.length-1].width.toFixed(1),tone:s.floors[s.floors.length-1].width<40?'warn':''},
   {label:'当前阶段',value:s.mode==='moving'?'等待落板':s.mode==='dropping'?'位置锁定':'工程结算'},
   {label:'移动速度',value:s.slab?Math.abs(s.slab.velocity).toFixed(0):'0'}];},
  result:function(s){return(s.phase==='won'?'目标楼层全部完成。':s.reason==='miss'?'石板完全错开了下层。':'剩余重合宽度不足16单位。')+'完成 '+s.floorsBuilt+'/'+s.goal+' 层，最后台面宽 '+s.floors[s.floors.length-1].width.toFixed(1)+'，用时 '+s.elapsed.toFixed(1)+' 秒。';},render:render};
})(window);
