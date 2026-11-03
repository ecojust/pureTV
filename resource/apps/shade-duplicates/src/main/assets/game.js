(function(root){
 'use strict';
 var C={bg:'#aec2c9',ink:'#233f50',paper:'#f1f0e4',muted:'#627b83',light:'#e3e9db',gold:'#b87932',mint:'#98d5bf',red:'#e8a294',duplicate:'#b25046',dark:'#273f50'};
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 var atlas={builtins:[],tiles:[
  {name:'proofDesk',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
   c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#cadae0'],[.4,'#aabdc9'],[1,'#7f9aa9']]);c.fillRect(0,0,960,540);
   c.strokeStyle='#f5f0d628';c.lineWidth=1;for(var i=-400;i<960;i+=38){c.beginPath();c.moveTo(i,0);c.lineTo(i+500,540);c.stroke();}
   round(c,20,13,920,41,8,'#e7e9dbdd','#8da2a7',2);
   round(c,58,74,486,418,9,'#31495833');round(c,50,66,486,418,9,'#e6e5d7','#6f8992',2);
   c.strokeStyle='#7f97a322';c.lineWidth=1;for(var x=64;x<524;x+=12){c.beginPath();c.moveTo(x,72);c.lineTo(x,478);c.stroke();}for(var y=76;y<480;y+=12){c.beginPath();c.moveTo(57,y);c.lineTo(529,y);c.stroke();}
   c.fillStyle='#d6c9a3';c.save();c.translate(122,69);c.rotate(-.05);c.fillRect(-34,-9,68,17);c.restore();c.save();c.translate(467,481);c.rotate(.05);c.fillRect(-34,-9,68,17);c.restore();
   round(c,579,72,352,148,10,'#2b4657','#74939b',2);round(c,579,235,352,129,10,'#2b4657','#74939b',2);round(c,579,379,352,107,10,'#243f50','#74939b',2);
   round(c,24,500,912,29,7,'#dce4d9','#6f8992');c.restore();
  }},
  {name:'whiteSquare',x:640,y:0,w:128,h:128,paint:function(c,w,h,art){
   round(c,4,7,120,117,5,'#253f4e25');round(c,4,3,120,117,5,art.linear(c,0,0,128,128,[[0,'#fffbee'],[1,'#e7eadb']]),'#9caaa4',2);c.strokeStyle='#ffffffbb';c.lineWidth=2;c.beginPath();c.moveTo(12,10);c.lineTo(116,10);c.stroke();c.strokeStyle='#afc0b71a';c.lineWidth=1;for(var y=20;y<113;y+=16){c.beginPath();c.moveTo(12,y);c.lineTo(116,y);c.stroke();}
  }},
  {name:'blackSquare',x:768,y:0,w:128,h:128,paint:function(c,w,h,art){
   round(c,4,7,120,117,5,'#20323b44');round(c,4,3,120,117,5,art.linear(c,0,0,128,128,[[0,'#3e5b68'],[1,'#203c4d']]),'#758e90',2);
   c.save();round(c,9,8,110,105,3);c.clip();c.strokeStyle='#a1c0ba24';c.lineWidth=2;for(var x=-110;x<128;x+=18){c.beginPath();c.moveTo(x,5);c.lineTo(x+115,120);c.stroke();}c.restore();
   c.strokeStyle='#d9e6d36b';c.lineWidth=2;c.beginPath();c.moveTo(15,15);c.lineTo(29,15);c.moveTo(99,108);c.lineTo(113,108);c.stroke();
  }},
  {name:'checkSeal',x:896,y:0,w:128,h:128,paint:function(c,w,h,art){art.ellipse(c,64,64,49,49,'#91bcb0');c.strokeStyle='#e5ead2';c.lineWidth=3;c.beginPath();c.arc(64,64,43,0,Math.PI*2);c.stroke();c.strokeStyle='#2c5d5b';c.lineWidth=10;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(38,65);c.lineTo(55,83);c.lineTo(91,44);c.stroke();}}
 ]};
 var model=root.PureModel,config=model.config;
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
 function geometry(n){var gap=n===4?86:n===5?72:60;return{gap:gap,x:295-n*gap/2,y:286-n*gap/2};}
 function render(r,s){
  var l=config.layouts[s.level],g=geometry(s.size),row=Math.floor(s.cursor/s.size),col=s.cursor%s.size,bad=new Set();s.violations.duplicates.forEach(function(d){d.cells.forEach(function(p){bad.add(p);});});
  var focusRegion=s.violations.regions.find(function(region){return region.indexOf(s.cursor)>=0;})||[];
  r.sprite('proofDesk',480,270,960,540,0,'#ffffff');text(r,l.name,36,21,28,C.ink);text(r,'HITORI  /  '+s.size+' x '+s.size,641,24,24,C.muted);
  for(var i=0;i<s.size;i++){center(r,i+1,g.x+(i+.5)*g.gap,80,24,col===i?C.gold:C.muted);center(r,i+1,g.x-22,g.y+(i+.5)*g.gap-12,24,row===i?C.gold:C.muted);}
  for(var p=0;p<s.black.length;p++){var x=g.x+(p%s.size+.5)*g.gap,y=g.y+(Math.floor(p/s.size)+.5)*g.gap,black=s.black[p],tileSize=g.gap-5,focusedComponent=s.violations.regions.length>1&&focusRegion.indexOf(p)>=0;
   r.sprite(black?'blackSquare':'whiteSquare',x,y,tileSize,tileSize,0,focusedComponent?'#d8f0df':'#ffffff');
   var size=s.size===4?40:s.size===5?36:34;center(r,l.numbers[p],x,y-size*.56,size,black?'#f8efdb':bad.has(p)?C.duplicate:C.ink);
   if(focusedComponent)frame(r,x-tileSize/2+3,y-tileSize/2+3,tileSize-6,tileSize-6,'#6eac96',1.5);
  }
  s.violations.adjacent.forEach(function(pair){var ax=g.x+(pair.a%s.size+.5)*g.gap,ay=g.y+(Math.floor(pair.a/s.size)+.5)*g.gap,bx=g.x+(pair.b%s.size+.5)*g.gap,by=g.y+(Math.floor(pair.b/s.size)+.5)*g.gap,mx=(ax+bx)/2,my=(ay+by)/2;if(ax===bx)r.rect(mx-13,my-3,26,6,'#d88c7f');else r.rect(mx-3,my-13,6,26,'#d88c7f');});
  var cx=g.x+(col+.5)*g.gap,cy=g.y+(row+.5)*g.gap;frame(r,cx-g.gap/2+1,cy-g.gap/2+1,g.gap-2,g.gap-2,'#b67a32',3);frame(r,cx-g.gap/2+4,cy-g.gap/2+4,g.gap-8,g.gap-8,'#f6d497',1);
  text(r,'THREE RULES',596,84,24,C.light);
  text(r,'DUP GROUPS   '+s.violations.duplicates.length,596,120,24,s.violations.duplicates.length?C.red:C.mint);
  text(r,'BLACK PAIRS  '+s.violations.adjacent.length,596,154,24,s.violations.adjacent.length?C.red:C.mint);
  text(r,'WHITE REGIONS '+s.violations.regions.length,596,188,24,s.violations.regions.length===1?C.mint:C.red);
  text(r,'CURSOR R'+(row+1)+' C'+(col+1),596,247,24,C.light);text(r,'NUMBER '+l.numbers[s.cursor]+' / '+(s.black[s.cursor]?'BLACK':'WHITE'),596,281,24,s.black[s.cursor]?C.mint:C.light);
  text(r,'NUMBER KEPT VISIBLE',596,324,24,'#b5c7c4');
  text(r,'CHECKS LEFT '+s.checks,596,390,28,'#f2cc88');text(r,'WHITE '+s.violations.whiteCount+' / '+s.black.length,596,427,24,C.light);
  text(r,s.valid?'READY: B CHECK':'A EDIT / B CHECK',596,459,24,s.valid?C.mint:'#b5c7c4');
  text(r,'ARROWS CELL',38,501,24,C.muted);text(r,'A BLACK / WHITE',329,501,24,C.gold);text(r,'B CHECK',740,501,24,C.ink);
 }
 root.GameDef={id:'shade-duplicates',title:'去重留白',seed:config.defaultSeed,accent:'#d2a267',background:C.bg,atlas:atlas,holdConfirmAsA:true,
  tagline:'隐去重复，留白相连',levelLabel:'数字盘',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['切换黑白','检查棋盘'],
  description:'涂黑一些格子，使剩余白格在每行、每列都没有重复数字。黑格不能上下左右相邻，所有白格必须横竖连成一片。方向选格，A 切换黑白，B 手动检查；允许三次失败检查。黑格仍显示原数字，可以随时恢复。',
  controls:{move:'方向键选择数字格',a:'空格、Z、确认 / 手机右上：切换黑白',b:'X / 手机右下：手动检查整盘'},
  tip:'白格红字表示行列重复，黑格斜纹保留原数字。黑格可斜向接触但不能共边；白格必须横竖连通。满足三条规则后仍需按 B 检查，第三次失败结束。',
  winTitle:'重复隐去，留白相连',loseTitle:'检查机会用尽，再次推理',
  hud:function(s){return[{label:'重复数字组',value:s.violations.duplicates.length},{label:'相邻黑格对',value:s.violations.adjacent.length},{label:'白格连通区',value:s.violations.regions.length},{label:'剩余试错',value:s.checks+' / 3'}];},
  result:function(s){return(s.phase==='won'?'白格行列无重复、黑格不相邻且白格连通，检查通过。':'三次检查均未通过，请重新调整黑白。')+'你涂黑 '+s.black.filter(Boolean).length+' 格，提交 '+s.submissions+' 次。';},render:render};
})(window);
