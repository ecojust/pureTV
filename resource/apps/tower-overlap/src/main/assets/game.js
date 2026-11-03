(function(root){
 'use strict';
 var C={bg:'#263d46',ink:'#f8eedb',muted:'#b1c3bd',gold:'#f2c184',mint:'#8bd5be',red:'#f09f89',dark:'#243f43'};
 var floorColors=['#acbab0','#8bc9bd','#a7c0d1','#c4b99e','#acb9d2','#d2b4a4'];
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 var atlas={builtins:[],tiles:[
  {name:'construction',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
   c.save();c.scale(w/960,h/540);
   c.fillStyle=art.linear(c,0,0,960,540,[[0,'#49636c'],[.52,'#2c4b55'],[1,'#1c3744']]);c.fillRect(0,0,960,540);
   round(c,16,12,928,42,9,'#1b3543e8','#8b9f9a');
   round(c,16,72,624,415,13,art.linear(c,0,72,0,487,[[0,'#d8d9c3'],[.47,'#bdc7b3'],[1,'#9cb5a6']]),'#839b91',2);
   c.save();round(c,18,74,620,411,11,null);c.clip();
   // Quiet city silhouettes and scaffold braces provide a stable scale behind the tower.
   c.fillStyle='#6c8c8c25';
   [[25,344,57,144],[86,315,51,173],[149,368,67,120],[453,346,48,142],[512,303,55,185],[576,359,60,129]].forEach(function(b){c.fillRect(b[0],b[1],b[2],b[3]);});
   c.strokeStyle='#577f7c2a';c.lineWidth=2;
   [42,614].forEach(function(x){c.beginPath();c.moveTo(x,146);c.lineTo(x,479);c.stroke();});
   for(var yy=174;yy<478;yy+=52){c.beginPath();c.moveTo(38,yy);c.lineTo(46,yy);c.moveTo(610,yy);c.lineTo(618,yy);c.stroke();}
   c.strokeStyle='#eaf1dc66';c.lineWidth=1;
   for(var gx=74;gx<614;gx+=52){c.beginPath();c.moveTo(gx,150);c.lineTo(gx,480);c.stroke();}
   c.fillStyle='#2f5d5b';c.fillRect(24,78,608,7);c.fillStyle='#d2b77e';c.fillRect(24,85,608,3);
   c.strokeStyle='#4f77715e';c.lineWidth=1;c.setLineDash([7,8]);c.beginPath();c.moveTo(24,138);c.lineTo(632,138);c.stroke();c.setLineDash([]);
   c.fillStyle='#5d7463';c.fillRect(32,480,592,7);
   c.restore();
   round(c,654,72,282,415,13,art.linear(c,654,72,936,487,[[0,'#34555b'],[1,'#193c47']]),'#8aac9f',2);
   round(c,669,88,252,96,9,'#163846','#688e86');
   round(c,669,197,252,103,9,'#183b47','#688e86');
   round(c,669,313,252,157,9,'#244854','#688e86');
   round(c,24,498,912,30,8,'#183843','#789b8c');c.restore();
  }},
  {name:'stoneSlab',x:640,y:0,w:256,h:64,paint:function(c,w,h,art){
   art.ellipse(c,128,59,122,4,'#132d3233');
   art.path(c,[[3,20],[15,7],[243,7],[253,20]],art.linear(c,0,7,0,20,[[0,'#ffffe9'],[1,'#c0d2c5']]),'#4a6d69',1.5);
   round(c,3,20,250,38,3,art.linear(c,0,20,0,58,[[0,'#c4dad0'],[.2,'#e4e9d5'],[.26,'#9bb9ad'],[1,'#6e9388']]),'#3a6664',1.5);
   c.fillStyle='#faffee88';c.fillRect(8,21,240,2);
   c.strokeStyle='#38696235';c.lineWidth=1;
   [39,83,127,171,215].forEach(function(x){c.beginPath();c.moveTo(x,25);c.lineTo(x+2,53);c.stroke();});
   c.fillStyle='#e6f5df44';c.fillRect(10,49,236,2);
  }},
  {name:'plumb',x:896,y:0,w:128,h:128,paint:function(c,w,h,art){
   c.strokeStyle='#e3c38c';c.lineWidth=3;c.beginPath();c.moveTo(64,8);c.lineTo(64,57);c.stroke();
   art.path(c,[[45,55],[83,55],[90,75],[64,118],[38,75]],art.linear(c,38,55,90,114,[[0,'#f5dc9d'],[.45,'#c1a16a'],[1,'#806a50']]),'#545b49',2);
   art.path(c,[[64,58],[64,111],[42,75]],'#fff0b24d');c.strokeStyle='#f5e3b8';c.lineWidth=2;c.beginPath();c.moveTo(48,60);c.lineTo(80,60);c.stroke();
  }}
 ]};
 var model=root.PureModel,config=model.config;
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function floorY(index){return 466-index*26;}
 function slab(r,x,width,y,color,angle){r.sprite('stoneSlab',24+x+width/2,y,width,32,angle||0,color);}
 function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
 function render(r,s){
  var l=config.layouts[s.level],top=s.floors[s.floors.length-1],targetY=floorY(s.floorsBuilt+1),moving=s.mode==='moving',overlap=0;
  r.sprite('construction',480,270,960,540,0,'#ffffff');
  text(r,l.name,30,19,28,C.ink);text(r,'FLOORS '+s.floorsBuilt+'/'+s.goal,516,21,24,C.ink);text(r,'MIN WIDTH 16',741,21,24,C.gold);
  // Public top edges provide alignment marks; they do not move or snap the slab.
  [top.x,top.x+top.width].forEach(function(edge){for(var y=143;y<targetY-15;y+=16)r.line(24+edge,y,24+edge,Math.min(y+7,targetY-15),1.5,'#366c6770');});
  s.floors.forEach(function(f){slab(r,f.x,f.width,floorY(f.index),floorColors[f.index%floorColors.length]);});
  if(s.slab){
   var active=s.slab,drop=s.mode==='dropping'?Math.min(1,s.dropElapsed/config.dropDuration):0;
   overlap=Math.max(0,Math.min(active.x+active.width,top.x+top.width)-Math.max(active.x,top.x));
   if(moving){frame(r,24+active.x,targetY-11,active.width,23,'#386d6866',1);var ox=Math.max(active.x,top.x);if(overlap>0)r.rect(24+ox,targetY-15,overlap,3,overlap>=16?'#397f6b':C.red);}
   var yy=112+(targetY-112)*drop*drop;slab(r,active.x,active.width,yy,'#f2d29f');
   if(moving){var tip=24+active.x+active.width/2,sign=active.direction;r.line(tip-sign*17,yy-24,tip+sign*17,yy-24,2,C.dark);
    r.line(tip+sign*17,yy-24,tip+sign*9,yy-29,2,C.dark);r.line(tip+sign*17,yy-24,tip+sign*9,yy-19,2,C.dark);}
  }
  if(s.phase==='lost'&&s.lastLanding&&s.lastLanding.width>0)slab(r,s.lastLanding.x,s.lastLanding.width,floorY(s.lastLanding.index),C.red);
  s.offcuts.forEach(function(c){
   var yy=floorY(s.lastLanding.index)+8+c.age*90+c.age*c.age*180;
   if(yy<484)slab(r,c.x+c.side*c.age*38,c.width,yy,'#c4937d',c.side*(.12+c.age*.8));
  });
  text(r,'TARGET FLOORS',684,99,24,C.muted);text(r,s.floorsBuilt+' / '+s.goal,684,132,34,C.ink);r.sprite('plumb',882,134,42,42,0,'#ffffff');
  text(r,'TOP WIDTH '+top.width.toFixed(1),684,209,24,top.width<40?C.gold:C.ink);
  text(r,s.slab?'OVERLAP '+overlap.toFixed(1):s.phase==='won'?'TOWER COMPLETE':'LANDING FAILED',684,243,24,s.slab&&overlap<16?C.red:C.mint);
  text(r,'SPEED '+(s.slab?Math.abs(s.slab.velocity).toFixed(0):'0'),684,275,24,C.muted);
  center(r,'A  DROP',795,325,36,C.gold);
  center(r,moving?'TIME THE OVERLAP':s.mode==='dropping'?'POSITION LOCKED':s.phase==='won'?'WELL STACKED':'TRY AGAIN',795,370,24,C.ink);
  center(r,'ONLY OVERLAP STAYS',795,402,24,C.muted);
  var profile=l.profile==='steady'?'STEADY':l.profile==='pulse'?'FAST / SLOW':'RISE / FALL';
  center(r,profile,795,438,24,C.mint);
  text(r,'A / SPACE DROP',38,499,24,C.gold);text(r,s.mode==='dropping'?'DROPPING':moving?'MOVING':'SETTLED',408,499,24,C.ink);
  text(r,'GOAL '+s.goal+' FLOORS',714,499,24,C.mint);
 }
 root.GameDef={id:'tower-overlap',title:'叠塔工匠',seed:config.defaultSeed,accent:C.gold,background:C.bg,atlas:atlas,
  holdConfirmAsA:true,tagline:'看准重合，一层层向上',levelLabel:'工地',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['落下石板'],
  description:'石板会自动水平往返，看准与下层重合时按 A。落地只保留重合部分，多余边缘切落；完全错开或台面宽度不足16就失败。三处工地分别要求叠6、8、10层，移动节律各不相同。',
  controls:{move:'石板自动往返；观察与下层的重合',a:'空格、Z、确认 / 手机右侧整区：落下',b:'只需 A；每次落下后松开再按'},
  tip:'按 A 后水平位置锁定，0.3秒后落地。多余部分切落，只留重合宽度；完全错开或少于16单位失败。石板轮流从左右驶入，松开后才能再次落下。',
  winTitle:'塔楼落成，叠塔成功',loseTitle:'台面失守，重新开工',
  hud:function(s){return[{label:'已建楼层',value:s.floorsBuilt+' / '+s.goal,tone:'good'},
   {label:'台面宽度',value:s.floors[s.floors.length-1].width.toFixed(1),tone:s.floors[s.floors.length-1].width<40?'warn':''},
   {label:'当前阶段',value:s.mode==='moving'?'横向移动':s.mode==='dropping'?'落下中':'已结算'},
   {label:'石板速度',value:s.slab?Math.abs(s.slab.velocity).toFixed(0):'0'}];},
  result:function(s){return(s.phase==='won'?'目标楼层全部完成。':s.reason==='miss'?'石板完全错开了下层。':'剩余重合宽度不足16单位。')+'完成 '+s.floorsBuilt+'/'+s.goal+' 层，最后台面宽 '+s.floors[s.floors.length-1].width.toFixed(1)+'，用时 '+s.elapsed.toFixed(1)+' 秒。';},render:render};
})(window);
