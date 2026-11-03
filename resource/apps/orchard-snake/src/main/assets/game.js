(function(root){
  'use strict';
  var config=root.PureModel.config,ink='#edf0d6',green='#91c78b',gold='#e5c372';
  function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'orchard',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#355a4c'],[.5,'#294b43'],[1,'#153830']]);c.fillRect(0,0,960,540);
      for(var k=0;k<35;k++){var x=(k*127)%960,y=(k*71)%540;art.ellipse(c,x,y,27,9,'#7c9b6b14');}
      round(c,22,20,916,56,11,'#213f36','#789273');round(c,36,129,504,344,8,'#122f28','#c3b67b');
      round(c,571,97,351,91,9,'#e1d4ab','#f0e4bd');round(c,571,205,351,114,9,'#1e3d34','#769273');
      round(c,571,336,351,138,9,'#1e3d34','#769273');round(c,36,488,886,32,8,'#203c31','#688666');
      // Orchard sign and timber pegs are baked once; terrain stays live.
      c.strokeStyle='#bfa978';c.lineWidth=3;c.beginPath();c.moveTo(45,124);c.lineTo(532,124);c.stroke();
      [49,528].forEach(function(px){c.fillStyle='#876c45';c.fillRect(px-3,119,6,361);c.fillStyle='#dbc58d';c.fillRect(px-1,120,2,358);});
      c.restore();
    }},
    {name:'grass',x:640,y:0,w:96,h:96,paint:function(c,w,h){
      c.fillStyle='#66855b';c.fillRect(0,0,w,h);c.strokeStyle='#4b704d';c.lineWidth=1;c.strokeRect(0,0,w,h);
      c.strokeStyle='#8da37155';c.lineWidth=2;for(var k=0;k<5;k++){var x=10+k*17,y=12+(k*29)%70;c.beginPath();c.moveTo(x,y+5);c.lineTo(x-2,y);c.moveTo(x,y+5);c.lineTo(x+3,y-2);c.stroke();}
    }},
    {name:'rock',x:736,y:0,w:112,h:112,paint:function(c,w,h,art){
      art.ellipse(c,56,94,45,10,'#142e2944');
      art.path(c,[[11,37],[31,13],[74,11],[101,39],[94,87],[71,99],[25,91],[8,66]],art.linear(c,20,20,90,100,[[0,'#bec1a6'],[1,'#6d8678']]),'#3b5a4d',3);
      art.path(c,[[31,13],[47,48],[11,37]],'#d1cfb0');art.path(c,[[47,48],[74,11],[101,39],[73,62]],'#a9b29a');
      c.strokeStyle='#6c8678';c.lineWidth=3;c.beginPath();c.moveTo(47,48);c.lineTo(41,78);c.lineTo(25,91);c.moveTo(47,48);c.lineTo(73,62);c.lineTo(94,87);c.stroke();
      art.ellipse(c,76,88,16,6,'#739265');
    }},
    {name:'snakebody',x:0,y:800,w:96,h:96,paint:function(c,w,h,art){
      art.ellipse(c,48,53,41,38,'#224e38');art.ellipse(c,48,46,37,35,art.linear(c,0,10,0,82,[[0,'#b3d68d'],[.6,'#82b975'],[1,'#5e925e']]));
      c.strokeStyle='#daebb088';c.lineWidth=2;c.beginPath();c.arc(48,46,27,Math.PI*1.1,Math.PI*1.8);c.stroke();
      art.ellipse(c,37,36,5,4,'#75a468');art.ellipse(c,59,48,5,4,'#75a468');art.ellipse(c,42,61,4,3,'#75a468');
    }},
    {name:'snakehead',x:96,y:800,w:112,h:96,paint:function(c,w,h,art){
      art.ellipse(c,53,51,48,38,'#234b36');art.ellipse(c,55,46,47,34,art.linear(c,0,0,100,90,[[0,'#c8df95'],[1,'#7eae65']]));
      [24,68].forEach(function(y){art.ellipse(c,75,y,13,12,'#eef2ce');art.ellipse(c,80,y,6,7,'#233b30');art.ellipse(c,82,y-2,2,2,'#ffffff');});
      c.strokeStyle='#375d40';c.lineWidth=3;c.beginPath();c.moveTo(96,44);c.lineTo(104,46);c.lineTo(96,49);c.stroke();
      art.ellipse(c,36,43,6,4,'#7ba65d');
    }},
    {name:'apple',x:208,y:800,w:96,h:112,paint:function(c,w,h,art){
      art.ellipse(c,49,100,33,7,'#17382a44');
      c.strokeStyle='#6b4d2d';c.lineWidth=6;c.beginPath();c.moveTo(48,33);c.bezierCurveTo(43,21,50,13,55,9);c.stroke();
      art.path(c,[[50,24],[66,10],[83,12],[68,27]],'#b4cc70','#567c43',2);
      art.ellipse(c,34,64,28,34,art.linear(c,0,25,0,105,[[0,'#f0a478'],[.5,'#dc7155'],[1,'#a3483e']]));
      art.ellipse(c,61,64,28,34,art.linear(c,0,25,0,105,[[0,'#ef9d70'],[.5,'#d96b50'],[1,'#a3483e']]));
      art.ellipse(c,26,49,7,12,'#ffdbac88');
    }}
  ]};
  var angles={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2},zh={up:'上',down:'下',left:'左',right:'右'};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function render(r,s){
    var l=config.layouts[s.level],ox=48,oy=141,u=40;
    r.sprite('orchard',480,270,960,540,0,'#ffffff');text(r,l.name,44,36,29,ink);text(r,'ORCHARD SNAKE',660,39,25,gold);
    text(r,'12 x 8  /  '+l.interval.toFixed(2)+' s PER STEP',50,101,23,'#bfcea8');
    for(var p=0;p<96;p++){var x=ox+p%12*u,y=oy+Math.floor(p/12)*u;r.sprite('grass',x+u/2,y+u/2,u,u,0,((p%12+Math.floor(p/12))%2)?'#eef3dc':'#ffffff');if(l.walls[p])r.sprite('rock',x+u/2,y+u/2,u-2,u-2,0,'#ffffff');}
    if(s.food!==null){var fx=ox+s.food%12*u+u/2,fy=oy+Math.floor(s.food/12)*u+u/2;r.sprite('apple',fx,fy,30,35,0,'#ffffff');}
    for(var b=s.body.length-1;b>0;b--){var p0=s.body[b],p1=s.body[b-1];r.line(ox+p0%12*u+u/2,oy+Math.floor(p0/12)*u+u/2,ox+p1%12*u+u/2,oy+Math.floor(p1/12)*u+u/2,24,'#82b975');}
    for(var i=s.body.length-1;i>=0;i--){var pos=s.body[i],sx=ox+pos%12*u+u/2,sy=oy+Math.floor(pos/12)*u+u/2;
      r.sprite(i===0?'snakehead':'snakebody',sx,sy,i===0?38:33,i===0?33:33,i===0?angles[s.direction]:0,'#ffffff');}
    if(s.brakeRemaining>0){var head=s.body[0];frame(r,ox+head%12*u+2,oy+Math.floor(head/12)*u+2,u-4,u-4,'#f5d992',2);}
    text(r,'FRUIT COLLECTED',591,109,23,'#777858');text(r,s.eaten+' / '+s.goalFruit,591,143,31,'#2e5442');
    text(r,'BRAKE TOKENS',591,219,23,'#b4c5aa');for(var t=0;t<3;t++){r.circle(607+t*43,274,14,t<s.brakes?gold:'#48664b');r.rect(601+t*43,268,4,12,'#35533a');r.rect(609+t*43,268,4,12,'#35533a');}
    text(r,s.brakeRemaining>0?s.brakeRemaining.toFixed(1)+' s':'A BRAKE',756,260,25,s.brakeRemaining>0?gold:ink);
    text(r,'NOW: '+s.direction.toUpperCase(),591,349,24,ink);text(r,'NEXT: '+(s.queuedDirection||'STRAIGHT').toUpperCase(),591,385,24,s.queuedDirection?gold:'#b4c5aa');
    text(r,'MOVE PROGRESS',591,427,19,'#b4c5aa');r.rect(591,455,310,5,'#45654b');r.rect(591,455,310*s.moveClock/l.interval,5,s.brakeRemaining>0?gold:green);
    text(r,'NO REVERSE',50,495,21,gold);text(r,'ONE TURN PER STEP',293,495,21,ink);text(r,'LENGTH '+s.body.length,717,495,21,ink);
  }
  root.GameDef={id:'orchard-snake',title:'果园游蛇',seed:config.defaultSeed,accent:gold,background:'#294b43',atlas,holdConfirmAsA:true,
    tagline:'绕过石墙，吃果长行',levelLabel:'果园',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['短刹车（共三次）'],
    description:'游蛇会自动前进。方向排入下一拍转弯，不能掉头，每拍只接受一个转弯。吃果会长一节，达到目标获胜。A 消耗一次0.6秒短刹车，每局三次；撞墙或身体失败。',
    controls:{move:'四向预排下一拍转弯',a:'空格、Z、确认 / 手机右侧：短刹车',b:'B 无操作'},
    tip:'看清 NEXT 再转弯，已排方向不能提前覆盖。刹车保留移动进度，不补令牌。普通移动可进入同时离开的尾格；吃果时尾巴不离开。长按不重复排方向。',
    winTitle:'果实收齐，安全归园',loseTitle:'游蛇碰撞，游园结束',
    hud:function(s){return[{label:'已收果实',value:s.eaten+' / '+s.goalFruit,tone:'good'},{label:'身体长度',value:s.body.length+' 格'},
      {label:'剩余刹车',value:s.brakes+' 次',tone:s.brakes===0?'warn':''},{label:'下一拍',value:s.queuedDirection?zh[s.queuedDirection]+'转':'直行'}];},
    result:function(s){return(s.phase==='won'?'目标果实已全部收齐。':s.reason==='wall'?'游蛇撞到了石墙或边界。':'游蛇撞到了没有离开的身体。')+'收果 '+s.eaten+'/'+s.goalFruit+'，长度 '+s.body.length+' 格，用时 '+s.elapsed.toFixed(1)+' 秒。';},render};
})(window);
