(function(root){
 'use strict';
 var C={bg:'#182239',ink:'#f4e7cb',muted:'#a8c1c6',gold:'#f0b962',cyan:'#8bd8cf',red:'#ee9d8d',dark:'#223e51'};
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 var atlas={builtins:[],tiles:[
  {name:'nightSpan',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
   c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,0,540,[[0,'#101c30'],[.5,'#284454'],[1,'#102f3c']]);c.fillRect(0,0,960,540);
   for(var i=0;i<34;i++){var x=(i*139+83)%960,y=18+(i*37)%155;art.ellipse(c,x,y,1+(i%2)*.5,1+(i%2)*.5,'#f7e3b080');}
   art.ellipse(c,490,95,47,47,art.radial(c,490,95,47,[[0,'#ffe4accc'],[.65,'#e8d6a944'],[1,'#e8d6a900']]));art.ellipse(c,499,86,23,25,'#243d4e');
   art.path(c,[[0,173],[93,97],[190,161],[278,112],[360,189],[461,140],[570,179],[676,110],[783,161],[897,102],[960,166],[960,540],[0,540]],'#203d4b');
   art.path(c,[[324,177],[414,210],[491,188],[622,174],[585,270],[636,346],[577,425],[350,425],[382,350],[327,277]],art.linear(c,350,180,580,430,[[0,'#71919a'],[.4,'#3a6c7d'],[1,'#213d54']]));
   for(var i=0;i<12;i++){c.strokeStyle='#bad9cc27';c.lineWidth=2;c.beginPath();c.moveTo(370+(i%3)*19,290+i*10);c.quadraticCurveTo(470,278+i*10,572-(i%2)*16,293+i*10);c.stroke();}
   art.path(c,[[0,182],[145,167],[264,181],[329,213],[314,340],[344,421],[0,421]],art.linear(c,0,180,340,420,[[0,'#536e62'],[1,'#16383a']]),'#8eac8e',2);
   art.path(c,[[631,215],[696,180],[829,168],[960,185],[960,421],[616,421],[645,338]],art.linear(c,630,180,960,420,[[0,'#4b726a'],[1,'#16383a']]),'#8eac8e',2);
   for(var bank=0;bank<2;bank++)for(var j=0;j<5;j++){var x=bank?690+j*52:22+j*53;art.path(c,[[x,152],[x+14,109-j%2*13],[x+28,152]],'#183c3e');art.path(c,[[x-5,174],[x+14,131],[x+33,174]],'#183c3e');}
   c.strokeStyle='#102a35';c.lineWidth=14;c.beginPath();c.moveTo(303,272);c.quadraticCurveTo(480,303,657,272);c.stroke();
   for(var j=0;j<24;j++){var x=306+j*14.6,y=249+Math.sin(j/23*Math.PI)*18;round(c,x,y,13,32,2,art.linear(c,x,y,x,y+32,[[0,'#cdbd8b'],[1,'#8e7650']]),'#ead3a044');}
   c.strokeStyle='#c4bb91';c.lineWidth=3;for(var y of [208,239]){c.beginPath();c.moveTo(307,y);c.quadraticCurveTo(480,y+34,653,y);c.stroke();}
   for(var j=0;j<13;j++){var x=307+j*28.8;c.lineWidth=1.5;c.beginPath();c.moveTo(x,210+Math.sin(j/12*Math.PI)*17);c.lineTo(x,278+Math.sin(j/12*Math.PI)*15);c.stroke();}
   for(var x of [303,653])round(c,x-5,199,10,104,3,'#958364','#d4c399',2);
   round(c,20,422,920,100,10,'#0e2335ee','#657c83',1.5);c.restore();
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
  r.sprite('nightSpan',480,270,960,540,0,'#ffffff');center(r,l.name,480,16,26,C.ink);
  text(r,'DEPARTURE CAMP',30,63,22,C.gold);text(r,'SAFE CAMP',700,63,22,C.cyan);
  for(var bank=0;bank<2;bank++){
   var x=bank?690:26;
   for(var id=0;id<l.times.length;id++){
    var y=104+id*48,present=s.positions[id]===bank&&(!moving||party.indexOf(id)<0),selected=s.selected.indexOf(id)>=0,focused=s.cursor===id&&s.positions[id]===bank;
    r.rect(x,y,244,43,present?'#183548ed':'#16344366');if(focused)frame(r,x-2,y-2,248,47,C.gold,2);
    if(present){r.sprite('traveler',x+23,y+22,31,39,0,colors[id]);text(r,'0'+(id+1),x+47,y+11,20,C.ink);text(r,l.times[id]+' MIN',x+107,y+9,24,selected?C.gold:C.ink);if(selected)r.circle(x+224,y+21,6,C.gold);}
    else{r.line(x+49,y+21,x+192,y+21,1,'#66858b55');text(r,'0'+(id+1),x+10,y+11,17,'#78949577');}
   }
  }
  if(moving){var t=s.crossing.elapsed/s.crossing.duration,progress=t*t*(3-2*t),xx=s.crossing.from===0?307+346*progress:653-346*progress;
   party.forEach(function(id,i){traveler(r,id,xx+(i-(party.length-1)/2)*34,239+Math.sin(progress*Math.PI)*17,true);});r.sprite('torchLamp',xx,192+Math.sin(progress*Math.PI)*17,31,51,0,'#ffffff');
  }else r.sprite('torchLamp',s.torch?651:309,175,40,66,0,'#ffffff');
  center(r,moving?'CROSSING':s.torch?'TORCH AT RIGHT':'TORCH AT LEFT',480,330,21,C.gold);
  center(r,'PARTY '+party.length+' / 2',480,364,22,C.ink);center(r,party.length?'NEXT COST '+cost+' MIN':'SELECT YOUR TRAVELERS',480,394,17,C.muted);
  text(r,'TIME LEDGER',37,434,18,C.muted);text(r,s.spent+' / '+s.deadline+' MIN',37,464,29,s.spent>s.deadline?C.red:C.gold);
  r.rect(280,439,368,10,'#35505b');r.rect(280,439,Math.min(368,s.spent/s.deadline*368),10,s.spent>s.deadline?C.red:C.gold);
  text(r,'REMAINING '+Math.max(0,s.deadline-s.spent)+' MIN',280,464,22,C.ink);
  var receipts=s.receipts.slice(-4);text(r,'RECENT CROSSINGS',695,434,18,C.muted);text(r,receipts.length?receipts.map(function(v){return(v.to?'R':'L')+':'+v.cost;}).join('  '):'NO TRIPS YET',695,464,20,C.cyan);
  text(r,'THINK WITHOUT A TIMER',38,503,14,C.muted);text(r,'A SELECT  /  B CROSS  /  RELEASE AFTER LANDING',370,503,14,C.muted);
 }
 root.GameDef={id:'torch-bridge',stylesheet:'game-theme.css',title:'夜桥接力',seed:config.defaultSeed,accent:C.gold,background:C.bg,atlas:atlas,holdConfirmAsA:true,
  tagline:'同灯过桥，巧排往返',levelLabel:'夜桥',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['选择旅人','携灯过桥'],
  description:'旅人必须携带火把过桥，每次一或两人，往返均按较慢者的分钟数计费。方向选择旅人，A 选择火把同岸的人，B 出发。全员到右岸且逻辑耗时不超预算即获胜；思考不限时，过桥动画不计入分钟预算。',
  controls:{move:'方向键 / 摇杆：选择旅人',a:'A / 确认：选中或取消',b:'B / X：所选队伍携灯过桥'},
  tip:'两岸名单展示位置，金框为焦点、金点为已选。携灯最多两人，每次扣较慢者分钟；思考不限时。落岸后松键再行动。',
  winTitle:'灯火相接，全员到岸',loseTitle:'预算已尽，重新排程',
  hud:function(s){return[{label:'逻辑用时',value:s.spent+' 分'},{label:'计划预算',value:s.deadline+' 分'},{label:'到达右岸',value:s.positions.filter(function(v){return v===1;}).length+' / '+s.positions.length},{label:'火把位置',value:s.mode==='crossing'?'过桥中':s.torch?'右岸':'左岸'}];},
  result:function(s){return(s.phase==='won'?'全员在预算内抵达右岸。':'未能在逻辑预算内完成全员过桥。')+'实际排程 '+s.spent+' / '+s.deadline+' 分钟，共 '+s.trips+' 次过桥。思考与动画时间不计入该预算。';},render:render};
})(window);
