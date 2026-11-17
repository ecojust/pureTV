(function (root) {
  'use strict';
  var C={bg:'#13212e',ink:'#e9eff0',muted:'#a6b8c0',copper:'#efb58a',water:'#58b8d0',good:'#91d3b3',bad:'#ee927f'};
  function round(c,x,y,w,h,r,fill,stroke,weight){
    c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);
    c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);
    c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();
    if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}
  }
  var atlas={builtins:[],tiles:[
    {name:'laboratory',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);
      c.fillStyle=art.linear(c,0,0,960,540,[[0,'#243c4b'],[.5,'#182d3b'],[1,'#10202f']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#9fb6ba0c';c.lineWidth=1;
      for(var x=0;x<960;x+=48){c.beginPath();c.moveTo(x,0);c.lineTo(x,540);c.stroke();}
      for(var y=0;y<540;y+=48){c.beginPath();c.moveTo(0,y);c.lineTo(960,y);c.stroke();}
      round(c,16,12,928,40,8,'#101e2ad9','#5c737b');
      round(c,24,64,912,46,9,art.linear(c,0,64,0,110,[[0,'#3c5360'],[1,'#243e4b']]),'#6a8589');
      for(var i=0;i<3;i++){
        var xx=24+i*314;
        round(c,xx,122,284,360,12,art.linear(c,xx,122,xx+284,482,[[0,'#203746'],[1,'#132a39']]),'#5a737d');
        c.fillStyle='#89aab50b';c.fillRect(xx+12,158,260,272);
        c.strokeStyle='#93a9af13';c.lineWidth=1;
        for(var yy=205;yy<418;yy+=26){c.beginPath();c.moveTo(xx+18,yy);c.lineTo(xx+266,yy);c.stroke();}
        round(c,xx+30,424,224,12,3,art.linear(c,0,424,0,436,[[0,'#d9b293'],[.4,'#926e5c'],[1,'#503f3c']]),'#a28571');
        [xx+39,xx+245].forEach(function(bx){art.ellipse(c,bx,430,2.5,2.5,'#e6c8a5');});
      }
      round(c,24,492,912,36,8,'#112330','#516c77');
      c.restore();
    }},
    {name:'jugGlass',x:640,y:0,w:192,h:256,paint:function(c,w,h,art){
      c.save();c.scale(1,h/288);
      // Transparent straight-sided measuring jug with a separate copper handle.
      c.strokeStyle='#bc8b6c';c.lineWidth=9;c.beginPath();c.moveTo(160,62);c.lineTo(174,62);
      c.bezierCurveTo(185,62,186,80,184,92);c.lineTo(175,193);c.bezierCurveTo(173,205,168,211,160,211);c.stroke();
      c.strokeStyle='#e7c29e';c.lineWidth=2;c.beginPath();c.moveTo(164,63);c.lineTo(175,63);
      c.bezierCurveTo(182,64,181,83,180,91);c.lineTo(171,193);c.stroke();
      c.beginPath();c.moveTo(30,36);c.lineTo(30,244);c.bezierCurveTo(34,261,156,261,160,244);c.lineTo(160,36);
      c.fillStyle=art.linear(c,30,0,160,0,[[0,'#d4f4ff25'],[.15,'#d4f4ff05'],[.7,'#d4f4ff03'],[1,'#a2e1ef22']]);c.fill();
      c.strokeStyle='#b4d2dd';c.lineWidth=2;c.stroke();
      art.ellipse(c,95,36,65,10,'#d7e9e91a');
      c.strokeStyle='#c8dce2';c.lineWidth=2;c.beginPath();c.ellipse(95,36,65,10,0,0,Math.PI*2);c.stroke();
      c.strokeStyle='#e4f8fc7a';c.lineWidth=4;c.beginPath();c.moveTo(37,53);c.lineTo(37,230);c.stroke();
      c.strokeStyle='#97cadc4d';c.lineWidth=2;c.beginPath();c.moveTo(151,53);c.lineTo(151,230);c.stroke();
      c.strokeStyle='#e5f4ec8c';c.lineWidth=2;c.beginPath();c.ellipse(95,244,65,10,0,0,Math.PI);c.stroke();
      art.ellipse(c,95,270,75,8,'#050f1933');c.restore();
    }},
    {name:'liquid',x:832,y:0,w:128,h:224,paint:function(c,w,h,art){
      c.fillStyle=art.linear(c,0,0,0,h,[[0,'#8edee5'],[.13,'#63bacc'],[.6,'#318aa9'],[1,'#206583']]);c.fillRect(0,0,w,h);
      c.fillStyle='#dcffff26';c.fillRect(5,0,5,h);c.fillStyle='#083e6225';c.fillRect(w-8,0,8,h);
    }},
    {name:'surface',x:832,y:224,w:128,h:24,paint:function(c,w,h,art){
      art.ellipse(c,64,12,64,11,'#b2f0ec');art.ellipse(c,64,12,59,8,'#68c4d0');
      c.strokeStyle='#e0fff1bb';c.lineWidth=1.2;c.beginPath();c.ellipse(64,12,61,9,0,Math.PI,2*Math.PI);c.stroke();
    }}
  ]};
  var model=root.PureModel,config=model.config;
  function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
  function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
  function dashed(r,x1,x2,y,color){for(var x=x1;x<x2;x+=14)r.line(x,y,Math.min(x+8,x2),y,2,color);}
  function render(r,s){
    var layout=config.layouts[s.level],remaining=Math.max(0,s.pourLimit-s.poursUsed);
    r.sprite('laboratory',480,270,960,540,0,'#ffffff');
    text(r,layout.name,30,18,28,C.ink);text(r,'POURS '+s.poursUsed+'/'+s.pourLimit,624,20,24,remaining<=2?C.copper:C.ink);
    text(r,s.source===null?'CHOOSE A SOURCE':'SOURCE '+(s.source+1)+'  >  CHOOSE DEST',40,75,24,s.source===null?C.ink:C.copper);
    var last=s.pourReceipts.length?s.pourReceipts[s.pourReceipts.length-1]:null;
    text(r,last?'LAST '+(last.from+1)+' > '+(last.to+1)+' : '+last.amount:'TOTAL '+s.volumes.reduce(function(a,b){return a+b;},0)+' UNITS',650,75,24,C.muted);
    s.volumes.forEach(function(volume,i){
      var cx=166+i*314,cap=layout.capacities[i],target=layout.target[i],height=208*volume/cap,ty=408-208*target/cap;
      center(r,'JUG '+(i+1),cx,131,24,s.source===i?C.copper:C.muted);
      center(r,volume+' / '+cap,cx,161,32,C.ink);
      if(height>0){
        r.sprite('liquid',cx-1,408-height/2,128,height,0,'#ffffff');
        r.sprite('surface',cx-1,408-height,128,15,0,'#ffffff');
      }
      r.sprite('jugGlass',cx,308,192,288,0,'#ffffff');
      for(var unit=0;unit<=cap;unit++){
        var yy=408-unit/cap*208;
        r.line(cx-60,yy,cx-(unit%2?50:44),yy,unit%2?1:2,'#e5f4efb0');
      }
      dashed(r,cx-83,cx+81,ty,C.copper);
      r.circle(cx-85,ty,3,C.copper);r.circle(cx+83,ty,3,C.copper);
      center(r,'TARGET '+target,cx,448,24,volume===target?C.good:C.copper);
      if(s.source===i){r.rect(cx-91,126,182,3,C.copper);text(r,'S',cx-127,131,24,C.copper);}
      if(s.selected===i){frame(r,cx-140,123,280,358,C.copper,2);r.circle(cx,486,3,C.copper);}
      if(volume===target){text(r,'OK',cx+92,448,24,C.good);}
    });
    text(r,'< > SELECT',38,497,24,C.copper);
    text(r,s.source===null?'A SOURCE':'A POUR',282,497,24,C.ink);
    text(r,'B CANCEL',495,497,24,C.ink);
    text(r,'LEFT '+remaining,760,497,24,remaining<=2?C.copper:C.good);
  }
  root.GameDef={id:'measure-pour',title:'量杯转运',seed:config.defaultSeed,accent:C.copper,background:C.bg,atlas:atlas,
    holdConfirmAsA:true,tagline:'倒满或倒空，量出刚刚好',levelLabel:'配额',
    levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['选来源 / 倒入','取消来源'],
    description:'三只量杯共享有限水量。左右选杯，A 标记来源，再选接收杯按 A 倒入；每次必须倒到来源空或接收杯满。B 取消来源。三杯同时达到公开目标即获胜，倒水额度用尽仍不匹配则失败。没有加水或排水。',
    controls:{move:'左右选择量杯',a:'空格、Z、确认 / 手机右上：选来源或倒入',b:'X、B / 手机右下：取消来源'},
    tip:'虚线是目标水位；数字是当前量 / 容量。S 标记来源，亮框标记当前杯。每次倒满或倒空，不能中途停。空杯、满杯、同杯不扣次数；最后一次倒对也获胜。',
    winTitle:'三杯达标，分装完成',loseTitle:'倒水额度已用尽',
    hud:function(s){return[{label:'当前量杯',value:(s.selected+1)+' 号杯'},
      {label:'来源量杯',value:s.source===null?'未选择':(s.source+1)+' 号杯'},
      {label:'剩余倒水',value:Math.max(0,s.pourLimit-s.poursUsed),tone:s.pourLimit-s.poursUsed<=2?'warn':''},
      {label:'目标达成',value:s.volumes.filter(function(v,i){return v===s.target[i];}).length+' / 3',tone:'good'}];},
    result:function(s){return(s.phase==='won'?'三只量杯均达到指定水量，全部液体守恒。':'倒水次数已用尽；重新安排来源与接收杯。')+'当前水量 '+s.volumes.join(' / ')+'，目标 '+s.target.join(' / ')+'；倒水 '+s.poursUsed+'/'+s.pourLimit+' 次，用时 '+s.elapsed.toFixed(1)+' 秒。';},render:render};
})(window);
