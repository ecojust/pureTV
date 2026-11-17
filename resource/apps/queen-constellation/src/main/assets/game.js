(function(root){
 'use strict';
 var C={bg:'#101d32',ink:'#f2e9d3',muted:'#a9bbca',brass:'#e2b76e',mint:'#88ddd0',red:'#f19c96',dark:'#152b40'};
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 var atlas={builtins:[],tiles:[
  {name:'observatory',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
   c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#274155'],[.48,'#182c43'],[1,'#0d1c32']]);c.fillRect(0,0,960,540);
   // Deterministic, original star chart behind the brass game frame.
   for(var i=0;i<62;i++){var x=(i*137+29)%960,y=(i*83+71)%540;art.ellipse(c,x,y,i%7===0?1.6:.8,i%7===0?1.6:.8,'#d7d9bb42');}
   c.strokeStyle='#abb7ab13';c.lineWidth=1;
   [196,225,248].forEach(function(radius){c.beginPath();c.arc(324,280,radius,0,Math.PI*2);c.stroke();});
   for(var j=0;j<24;j++){var a=j*Math.PI/12;c.beginPath();c.moveTo(324+Math.cos(a)*240,280+Math.sin(a)*240);c.lineTo(324+Math.cos(a)*247,280+Math.sin(a)*247);c.stroke();}
   round(c,16,12,928,40,8,'#102239e8','#5d7b89');
   round(c,120,78,408,404,7,art.linear(c,0,78,0,482,[[0,'#d1ad70'],[.28,'#89724e'],[.5,'#d7b579'],[1,'#564c3e']]),'#dfc092',2);
   round(c,127,83,394,394,3,'#0d1b2e','#6b644f');
   round(c,640,72,296,408,13,art.linear(c,640,72,936,480,[[0,'#293f53'],[1,'#142c43']]),'#667e8b');
   round(c,656,88,264,114,8,'#10253c','#526d7d');
   round(c,656,214,264,91,8,'#10253c','#526d7d');
   round(c,656,317,264,146,8,'#10253c','#526d7d');
   round(c,24,492,912,36,8,'#0e233a','#5f7986');c.restore();
  }},
  {name:'queen',x:640,y:0,w:128,h:160,paint:function(c,w,h,art){
   art.ellipse(c,64,147,52,10,'#08152a66');
   var ivory=art.linear(c,14,0,111,0,[[0,'#92999f'],[.25,'#d8d8cb'],[.5,'#fff7dd'],[.75,'#d4d1bb'],[1,'#879598']]);
   art.path(c,[[26,39],[43,58],[64,24],[85,58],[102,39],[94,85],[34,85]],ivory,'#304959',2);
   [26,64,102].forEach(function(x,i){art.ellipse(c,x,i===1?22:35,9,9,'#efe8d0');art.ellipse(c,x-2,i===1?19:32,3,3,'#ffffff');});
   round(c,31,79,66,14,5,'#e8e3ca','#6a7b80',2);
   art.path(c,[[46,92],[82,92],[88,122],[101,130],[27,130],[40,122]],ivory,'#435a62',2);
   round(c,23,128,82,12,4,'#e8e3cc','#536a73',2);round(c,17,139,94,9,4,ivory,'#4c6370',2);
   c.strokeStyle='#ffffff77';c.lineWidth=2;c.beginPath();c.moveTo(51,96);c.lineTo(47,121);c.stroke();
   art.path(c,[[64,49],[70,62],[64,74],[58,62]],'#4b7c92','#d5eee5',1);
  }},
  {name:'lock',x:768,y:0,w:48,h:48,paint:function(c,w,h,art){
   c.strokeStyle='#fff2c1';c.lineWidth=5;c.beginPath();c.arc(24,19,10,Math.PI,0);c.lineTo(34,26);c.moveTo(14,19);c.lineTo(14,26);c.stroke();
   round(c,9,22,30,23,4,'#e6c384','#6e583b',2);art.ellipse(c,24,31,3,3,'#4b4a42');c.fillStyle='#4b4a42';c.fillRect(23,31,2,7);
  }},
  {name:'starSeal',x:832,y:0,w:128,h:128,paint:function(c,w,h,art){
   art.ellipse(c,64,65,58,58,'#ba9860');art.ellipse(c,64,63,53,53,'#e7c991');art.ellipse(c,64,63,47,47,'#203b55');
   art.path(c,[[64,20],[73,48],[103,63],[73,74],[64,105],[54,74],[24,63],[54,48]],'#e7d5a8','#aa986f',1);
   art.ellipse(c,64,63,9,9,'#5ca6ae');art.ellipse(c,62,60,3,3,'#d9f2e7');
  }}
 ]};
 var model=root.PureModel,config=model.config;
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
 function hatch(r,x,y,size){
  r.rect(x,y,size,size,'#6e66523d');
  for(var p=-size;p<size;p+=9){var x1=Math.max(0,p),y1=Math.max(0,-p),x2=Math.min(size,p+size),y2=Math.min(size,size-p);r.line(x+x1,y+y1,x+x2,y+y2,1.5,'#b8a27255');}
  r.line(x+size*.35,y+size*.35,x+size*.65,y+size*.65,2,C.brass);r.line(x+size*.65,y+size*.35,x+size*.35,y+size*.65,2,C.brass);
 }
 function render(r,s){
  var l=config.layouts[s.level],n=l.size,unit=384/n,left=132,top=88;
  function point(id){return{x:left+(id%n+.5)*unit,y:top+(Math.floor(id/n)+.5)*unit};}
  r.sprite('observatory',480,270,960,540,0,'#ffffff');
  text(r,l.name,30,18,28,C.ink);text(r,n+' x '+n+' STAR CHART',500,20,24,C.muted);
  for(var j=0;j<n;j++){center(r,j+1,left+(j+.5)*unit,58,24,C.brass);center(r,j+1,102,top+(j+.5)*unit-12,24,C.brass);}
  for(var id=0;id<n*n;id++){
   var x=left+id%n*unit,y=top+Math.floor(id/n)*unit;
   r.rect(x,y,unit,unit,((Math.floor(id/n)+id%n)%2)?'#294359':'#1a3149');frame(r,x,y,unit,unit,'#5e788038',1);
   if(l.blocked.indexOf(id)>=0)hatch(r,x+2,y+2,unit-4);
   if(l.fixed.indexOf(id)>=0)frame(r,x+3,y+3,unit-6,unit-6,C.brass,2);
  }
  s.conflicts.forEach(function(pair){var a=point(pair.a),b=point(pair.b);r.line(a.x,a.y,b.x,b.y,2,'#f0878799');});
  for(var cell=0;cell<s.queens.length;cell++)if(s.queens[cell]){
   var p=point(cell),fixed=l.fixed.indexOf(cell)>=0,conflicted=s.conflicts.some(function(pair){return pair.a===cell||pair.b===cell;});
   if(conflicted)frame(r,p.x-unit/2+5,p.y-unit/2+5,unit-10,unit-10,C.red,2);
   r.sprite('queen',p.x,p.y,unit*.73,unit*.87,0,fixed?'#efc790':'#ffffff');
   if(fixed)r.sprite('lock',p.x+unit*.29,p.y+unit*.28,unit*.24,unit*.24,0,'#ffffff');
  }
  var cursor=point(s.cursor),d=unit/2-1,len=unit*.23;
  [-1,1].forEach(function(sx){[-1,1].forEach(function(sy){r.line(cursor.x+sx*d,cursor.y+sy*d,cursor.x+sx*(d-len),cursor.y+sy*d,3,C.mint);r.line(cursor.x+sx*d,cursor.y+sy*d,cursor.x+sx*d,cursor.y+sy*(d-len),3,C.mint);});});
  r.sprite('starSeal',887,130,48,48,0,'#ffffff');text(r,'QUEENS '+s.queenCount+' / '+n,674,98,26,C.ink);
  text(r,'CHECKS '+s.checksRemaining+' / 3',674,132,24,s.checksRemaining===1?C.brass:C.muted);
  text(r,'CLASHES '+s.conflicts.length,674,166,24,s.conflicts.length?C.red:C.mint);
  text(r,s.canSubmit?'READY TO SUBMIT':'ARRANGE THE SKY',674,226,24,s.canSubmit?C.mint:C.ink);
  var cellKind=l.fixed.indexOf(s.cursor)>=0?'FIXED':l.blocked.indexOf(s.cursor)>=0?'BLOCKED':s.queens[s.cursor]?'QUEEN':'EMPTY';
  text(r,'R'+(Math.floor(s.cursor/n)+1)+' C'+(s.cursor%n+1)+'  '+cellKind,674,264,24,C.muted);
  r.sprite('queen',688,342,22,28,0,'#ffffff');text(r,'MOVABLE',716,329,24,C.ink);
  r.sprite('lock',688,374,22,22,0,'#ffffff');text(r,'FIXED',716,361,24,C.brass);
  hatch(r,677,395,22);text(r,'BLOCKED',716,393,24,C.brass);
  r.line(677,438,699,429,2,C.red);text(r,'ATTACK LINE',716,425,24,C.red);
  text(r,'ARROWS MOVE',38,497,24,C.mint);text(r,'A TOGGLE',304,497,24,C.ink);text(r,'B SUBMIT',530,497,24,C.ink);text(r,'LEFT '+s.checksRemaining,773,497,24,C.brass);
 }
 root.GameDef={id:'queen-constellation',title:'星盘皇后',seed:config.defaultSeed,accent:C.brass,background:C.bg,atlas:atlas,
  holdConfirmAsA:true,tagline:'同处星盘，互不攻击',levelLabel:'星域',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['放置 / 移除','提交星盘'],
  description:'在星盘放满指定数量的皇后，让任意两枚不在同一行、列或斜线。方向选格，A 放置或移除；带锁皇后固定，斜纹格禁放。冲突可以保留着调整。摆好后 B 提交，三次检查用尽仍未通过则失败。',
  controls:{move:'方向选择格子',a:'空格、Z、确认 / 手机右上：放置或移除',b:'X、B / 手机右下：提交检查'},
  tip:'皇后不能同行、同列或同斜线；红线标出冲突。带锁皇后不可移动，斜纹格不能放。放好后仍须 B 提交。放取不扣次数，第三次检查正确也能获胜。',
  winTitle:'皇后互不攻击，星盘完成',loseTitle:'三次检查已用尽',
  hud:function(s){var n=config.layouts[s.level].size;return[{label:'当前格子',value:(Math.floor(s.cursor/n)+1)+' 行 '+(s.cursor%n+1)+' 列'},
   {label:'皇后数量',value:s.queenCount+' / '+n},{label:'冲突对数',value:s.conflicts.length,tone:s.conflicts.length?'warn':'good'},
   {label:'剩余检查',value:s.checksRemaining,tone:s.checksRemaining===1?'warn':''}];},
  result:function(s){return(s.phase==='won'?'皇后数量正确，所有皇后互不攻击，固定位置和禁放格均符合要求。':'检查机会已用尽，请重新规划皇后位置。')+'皇后 '+s.queenCount+'/'+config.layouts[s.level].size+' 枚，冲突 '+s.conflicts.length+' 对，提交 '+s.submissions+' 次，用时 '+s.elapsed.toFixed(1)+' 秒。';},render:render};
})(window);
