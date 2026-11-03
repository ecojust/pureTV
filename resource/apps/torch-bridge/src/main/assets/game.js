(function(root){
 'use strict';
 var C={bg:'#182239',ink:'#f4e7cb',muted:'#a8c1c6',gold:'#f0b962',cyan:'#8bd8cf',red:'#ee9d8d',dark:'#223e51'};
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 var atlas={builtins:[],tiles:[
  {name:'nightSpan',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
   c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#18243e'],[.5,'#2e4860'],[1,'#172d43']]);c.fillRect(0,0,960,540);
   [[64,63],[188,68],[284,57],[382,75],[537,62],[565,41],[906,56]].forEach(function(p){art.ellipse(c,p[0],p[1],1.4,1.4,'#f2dcac99');});
   round(c,22,12,916,41,8,'#12283eaa','#6a8296');round(c,34,72,560,261,12,'#223f56','#688b95',2);
   c.save();round(c,35,73,558,259,11);c.clip();c.fillStyle=art.linear(c,0,74,0,332,[[0,'#253d5b'],[1,'#315769']]);c.fillRect(35,73,558,259);
   art.ellipse(c,354,111,25,25,'#eed6a880');art.ellipse(c,363,104,24,24,'#2a4660');
   art.path(c,[[35,171],[96,104],[161,169],[219,132],[284,210],[350,160],[414,112],[482,185],[540,120],[594,167],[594,333],[35,333]],'#253e50');
   c.fillStyle=art.linear(c,225,170,420,335,[[0,'#3d7180'],[1,'#284b66']]);c.fillRect(215,176,213,158);
   c.strokeStyle='#82bfc031';c.lineWidth=2;for(var n=0;n<8;n++){c.beginPath();c.moveTo(242+(n%3)*9,264+n*8);c.bezierCurveTo(278,257+n*8,350,277+n*8,402-(n%2)*12,269+n*8);c.stroke();}
   art.path(c,[[35,135],[83,128],[133,143],[181,136],[220,164],[219,322],[35,333]],art.linear(c,35,130,220,330,[[0,'#668279'],[.5,'#4d675f'],[1,'#2d4c4d']]),'#7d9b86',2);
   art.path(c,[[422,164],[461,136],[512,143],[559,129],[594,135],[594,333],[423,322]],art.linear(c,422,130,594,330,[[0,'#5e7f78'],[1,'#2d4c4d']]),'#7d9b86',2);
   for(var i=0;i<5;i++){c.strokeStyle='#a3ad8c27';c.beginPath();c.moveTo(45+i*32,301);c.lineTo(55+i*30,285);c.stroke();c.beginPath();c.moveTo(440+i*31,307);c.lineTo(448+i*29,293);c.stroke();}
   c.strokeStyle='#132e3a66';c.lineWidth=9;c.beginPath();c.moveTo(210,250);c.quadraticCurveTo(320,269,430,250);c.stroke();
   for(var i=0;i<17;i++){var xx=212+i*12.5,yy=222+Math.sin(i/16*Math.PI)*8;round(c,xx,yy,11,24,2,art.linear(c,xx,yy,xx,yy+24,[[0,'#bead80'],[1,'#887958']]),'#d3c59955',1);}
   c.strokeStyle='#b7b28f';c.lineWidth=3;for(var yy of [192,215]){c.beginPath();c.moveTo(211,yy);c.quadraticCurveTo(321,yy+19,432,yy);c.stroke();}
   for(var i=0;i<9;i++){var xx=211+i*27.6;c.strokeStyle='#a4a58a';c.lineWidth=1.5;c.beginPath();c.moveTo(xx,193+Math.sin(i/8*Math.PI)*9);c.lineTo(xx,234+Math.sin(i/8*Math.PI)*7);c.stroke();}
   [[211,185],[432,185]].forEach(function(p){round(c,p[0]-4,p[1],8,66,2,'#aaa17c','#d6c392');});c.restore();
   round(c,616,72,310,118,10,'#172f45','#688b95',2);round(c,616,203,310,130,10,'#172f45','#688b95',2);
   round(c,34,367,892,130,10,'#132e42','#688b95',2);c.strokeStyle='#9ab5b131';c.beginPath();c.moveTo(35,504);c.lineTo(925,504);c.stroke();c.restore();
  }},
  {name:'traveler',x:640,y:0,w:128,h:128,paint:function(c,w,h,art){
   art.ellipse(c,65,112,31,7,'#071b3055');c.strokeStyle='#253f54';c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(54,88);c.lineTo(48,109);c.moveTo(74,88);c.lineTo(81,109);c.stroke();
   round(c,35,47,18,37,5,'#a0885f','#d3bf87',2);art.path(c,[[48,46],[79,46],[91,93],[39,93]],art.linear(c,39,46,90,94,[[0,'#e8dbc0'],[1,'#a7c3b7']]),'#244c5a',3);
   c.strokeStyle='#476a74';c.lineWidth=5;c.beginPath();c.moveTo(63,51);c.lineTo(63,87);c.stroke();art.ellipse(c,64,30,17,19,'#e8bd92');
   art.path(c,[[44,28],[50,11],[77,11],[86,29]],'#385b68','#92aea5',2);round(c,43,27,43,6,2,'#547b80');c.strokeStyle='#d7b36f';c.lineWidth=6;c.beginPath();c.moveTo(79,53);c.lineTo(91,74);c.stroke();
  }},
  {name:'torchLamp',x:768,y:0,w:128,h:128,paint:function(c,w,h,art){
   art.ellipse(c,64,38,48,38,art.radial(c,64,38,48,[[0,'#ffdf8a70'],[.45,'#ffb95720'],[1,'#ffb95700']]));
   art.path(c,[[58,58],[70,58],[74,118],[59,118]],'#8f6645','#c69c65',3);
   art.path(c,[[46,65],[43,40],[58,16],[63,36],[78,6],[86,43],[78,65]],art.linear(c,0,6,0,65,[[0,'#ffe5a0'],[.6,'#f9bd64'],[1,'#d77941']]),'#ffe4a0',2);
   art.path(c,[[56,60],[58,43],[67,31],[72,49],[70,63]],'#fff1c0');round(c,47,65,32,8,2,'#d4b16b','#614d42',2);
  }},
  {name:'rosterCard',x:896,y:0,w:128,h:128,paint:function(c,w,h,art){round(c,3,3,122,122,9,art.linear(c,0,0,0,128,[[0,'#38586c'],[1,'#233f54']]),'#648897',2);c.strokeStyle='#b4c8b51c';c.beginPath();c.moveTo(9,17);c.lineTo(119,17);c.stroke();}}
 ]};
 var model=root.PureModel,config=model.config,colors=['#fff4db','#badde4','#efc5ab','#cae2b5','#d3c6e9','#f2d59c'];
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
 function traveler(r,id,x,y,selected){if(selected)r.circle(x,y+16,23,'#ffc36933');r.sprite('traveler',x,y,43,54,0,colors[id]);r.circle(x+17,y+20,13,'#183749');center(r,id+1,x+17,y+9,24,selected?C.gold:C.ink);}
 function render(r,s){
  var l=config.layouts[s.level],moving=s.mode==='crossing',party=moving?s.crossing.travelers:s.selected,cost=party.length?Math.max.apply(null,party.map(function(id){return l.times[id];})):0;
  r.sprite('nightSpan',480,270,960,540,0,'#ffffff');text(r,l.name,36,21,28,C.ink);text(r,'BRIDGE CAPACITY 2',634,24,24,C.muted);
  text(r,'LEFT BANK',55,82,24,C.muted);text(r,'RIGHT BANK',434,82,24,C.cyan);
  for(var id=0;id<s.positions.length;id++)if(!moving||party.indexOf(id)<0){var bank=s.positions[id],xx=(bank?469:96)+(id%2)*57,yy=145+Math.floor(id/2)*60;traveler(r,id,xx,yy,s.selected.indexOf(id)>=0);}
  if(moving){var t=s.crossing.elapsed/s.crossing.duration,progress=t*t*(3-2*t),xx=s.crossing.from===0?213+218*progress:431-218*progress;
   party.forEach(function(id,i){traveler(r,id,xx+(i-(party.length-1)/2)*34,198-3*Math.sin(t*Math.PI*4),true);});r.sprite('torchLamp',xx,150,31,51,0,'#ffffff');
  }else r.sprite('torchLamp',s.torch?437:210,143,31,51,0,'#ffffff');
  text(r,'LOGICAL MINUTES',633,84,24,C.muted);text(r,'USED '+s.spent+' / '+s.deadline,633,118,31,s.spent>s.deadline?C.red:C.ink);
  text(r,'LEFT '+Math.max(0,s.deadline-s.spent)+' MIN',633,157,24,C.gold);
  text(r,'PARTY '+(party.length?party.map(function(i){return i+1;}).join(' + '):'--'),633,216,24,C.ink);
  text(r,'COST '+(party.length?cost:'--')+' MIN',633,248,28,C.gold);
  text(r,moving?'CROSSING 0.4S':'PLANNING FREE',633,290,24,moving?C.cyan:C.muted);
  text(r,'ROSTER: ID / MIN / BANK',45,339,24,C.muted);text(r,'SELECTED '+party.length+' / 2',647,339,24,C.gold);
  for(var id=0;id<l.times.length;id++){var xx=46+(id%3)*294,yy=379+Math.floor(id/3)*59,sel=s.selected.indexOf(id)>=0,focused=s.cursor===id,inFlight=moving&&party.indexOf(id)>=0;
   r.sprite('rosterCard',xx+137,yy+23,274,46,0,sel?'#ffe4b2':'#ffffff');if(focused)frame(r,xx-2,yy-2,278,50,C.gold,2);if(sel)r.rect(xx+4,yy+4,5,38,C.gold);
   text(r,'#'+(id+1),xx+17,yy+10,26,colors[id]);text(r,l.times[id]+' MIN',xx+77,yy+10,26,sel?C.gold:C.ink);
   text(r,inFlight?(s.crossing.to?'->R':'->L'):(s.positions[id]?'R':'L'),xx+209,yy+10,26,inFlight?C.gold:s.positions[id]?C.cyan:C.muted);
  }
  text(r,'ARROWS CHOOSE',38,509,24,C.muted);text(r,'A SELECT',362,509,24,C.gold);text(r,'B CROSS',596,509,24,C.cyan);text(r,'NO TIMER',790,509,24,C.muted);
 }
 root.GameDef={id:'torch-bridge',title:'夜桥接力',seed:config.defaultSeed,accent:C.gold,background:C.bg,atlas:atlas,holdConfirmAsA:true,
  tagline:'同灯过桥，巧排往返',levelLabel:'夜桥',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['选择旅人','携灯过桥'],
  description:'旅人必须携带火把过桥，每次一或两人，往返均按较慢者的分钟数计费。方向选择旅人，A 选择火把同岸的人，B 出发。全员到右岸且逻辑耗时不超预算即获胜；思考不限时，过桥动画不计入分钟预算。',
  controls:{move:'方向键选择上一位 / 下一位旅人',a:'空格、Z、确认 / 手机右上：选择或取消',b:'X / 手机右下：所选队伍携灯过桥'},
  tip:'火把必须随一或两人往返。每次按较慢者计分钟，思考不扣预算；0.4 秒只是动画。名单的 L/R 是所在岸，金框是当前旅人。落岸后松开按键再行动。',
  winTitle:'灯火相接，全员到岸',loseTitle:'预算已尽，重新排程',
  hud:function(s){return[{label:'逻辑用时',value:s.spent+' 分'},{label:'计划预算',value:s.deadline+' 分'},{label:'到达右岸',value:s.positions.filter(function(v){return v===1;}).length+' / '+s.positions.length},{label:'火把位置',value:s.mode==='crossing'?'过桥中':s.torch?'右岸':'左岸'}];},
  result:function(s){return(s.phase==='won'?'全员在预算内抵达右岸。':'未能在逻辑预算内完成全员过桥。')+'实际排程 '+s.spent+' / '+s.deadline+' 分钟，共 '+s.trips+' 次过桥。思考与动画时间不计入该预算。';},render:render};
})(window);
