(function(root){
 'use strict';
 var C={bg:'#171c37',ink:'#f3ede4',muted:'#b3b5cd',gold:'#efbe78',mint:'#8adbcf',dark:'#242743',ivory:'#e8dcc4',red:'#eea090'};
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 var atlas={builtins:[],tiles:[
  {name:'marbleBoard',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
   c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#343953'],[.45,'#252c49'],[1,'#151d36']]);c.fillRect(0,0,960,540);
   c.strokeStyle='#d8d7f10b';c.lineWidth=1;
   for(var d=-540;d<960;d+=48){c.beginPath();c.moveTo(d,0);c.lineTo(d+540,540);c.stroke();}
   round(c,16,12,928,42,9,'#151d34d9','#5c6385');
   // Ivory inlay on a thick indigo triangular solitaire board.
   art.path(c,[[328,71],[613,480],[600,488],[57,488],[43,480]],'#0e1429aa');
   art.path(c,[[328,66],[612,475],[596,485],[61,485],[44,475]],art.linear(c,0,60,0,480,[[0,'#9396b1'],[.55,'#59617f'],[1,'#333c5b']]),'#0f1931',3);
   art.path(c,[[328,71],[599,470],[57,470]],art.linear(c,60,90,599,455,[[0,'#fff6e2'],[.42,'#ece1c9'],[1,'#c7bba4']]),'#8c8c90',2);
   art.path(c,[[328,88],[578,459],[78,459]],null,'#aa9f8d',1.5);
   c.save();c.beginPath();c.moveTo(328,88);c.lineTo(578,459);c.lineTo(78,459);c.closePath();c.clip();
   c.strokeStyle='#918d7c16';c.lineWidth=1;
   for(var y=100;y<450;y+=24){c.beginPath();c.moveTo(65,y);c.bezierCurveTo(180,y-10,380,y+12,600,y-5);c.stroke();}
   c.restore();
   round(c,644,72,292,406,13,art.linear(c,644,72,936,478,[[0,'#303b58'],[1,'#192743']]),'#6d7896');
   round(c,661,88,258,85,9,'#18233d','#596781');
   round(c,661,185,258,108,9,'#202d49','#596781');
   round(c,661,305,258,155,9,'#18253f','#596781');
   round(c,24,492,912,36,8,'#141f37','#65718b');c.restore();
  }},
  {name:'pearl',x:640,y:0,w:128,h:128,paint:function(c,w,h,art){
   art.ellipse(c,64,104,48,14,'#10142855');
   art.ellipse(c,64,62,49,49,art.radial(c,64,62,50,[[0,'#fffbed'],[.5,'#ded6d0'],[.78,'#9698b2'],[1,'#545c86']],44,39));
   art.path(c,[[29,48],[45,24],[75,19],[98,45],[94,77],[73,101],[42,89]],'#faf4ee14');
   c.strokeStyle='#fffaf3aa';c.lineWidth=3;c.beginPath();c.arc(63,61,44,3.55,5.12);c.stroke();
   art.ellipse(c,45,36,16,7,'#ffffff88');
   c.strokeStyle='#797fa447';c.lineWidth=2;c.beginPath();c.arc(65,63,38,.35,1.57);c.stroke();
  }},
  {name:'socket',x:768,y:0,w:128,h:128,paint:function(c,w,h,art){
   art.ellipse(c,64,66,48,48,'#a29a88');
   art.ellipse(c,64,64,44,44,art.linear(c,0,20,0,108,[[0,'#323851'],[.5,'#171d36'],[1,'#48516e']]));
   c.strokeStyle='#ebdfc4';c.lineWidth=3;c.beginPath();c.arc(64,65,46,.15,2.9);c.stroke();
   c.strokeStyle='#2b2c43';c.lineWidth=3;c.beginPath();c.arc(64,63,45,3.2,6.08);c.stroke();
   art.ellipse(c,64,66,30,30,'#18213a');
  }},
  {name:'medallion',x:896,y:0,w:128,h:128,paint:function(c,w,h,art){
   art.ellipse(c,64,65,58,58,'#a38f75');art.ellipse(c,64,63,53,53,'#e4cc9b');art.ellipse(c,64,63,47,47,'#293351');
   art.path(c,[[64,25],[97,84],[31,84]],null,'#ddcaa2',3);
   [[64,45],[53,65],[75,65]].forEach(function(p){art.ellipse(c,p[0],p[1],6,6,'#ece2cc');});
  }}
 ]};
 var model=root.PureModel,config=model.config;
 function pos(index){var p=config.positions[index];return{x:328+(p.col-p.row/2)*116,y:123+p.row*78};}
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function brackets(r,x,y,color){var d=36,l=14;[-1,1].forEach(function(sx){[-1,1].forEach(function(sy){r.line(x+sx*d,y+sy*d,x+sx*(d-l),y+sy*d,3,color);r.line(x+sx*d,y+sy*d,x+sx*d,y+sy*(d-l),3,color);});});}
 function ring(r,x,y,radius,color){r.circle(x,y,radius,color);r.circle(x,y,radius-3,C.dark);}
 function render(r,s){
  var layout=config.layouts[s.level],landing=s.source===null?[]:s.legalJumps.filter(function(j){return j.from===s.source;});
  r.sprite('marbleBoard',480,270,960,540,0,'#ffffff');
  text(r,layout.name,30,19,28,C.ink);text(r,'PEGS '+s.pegsRemaining,486,21,24,C.ink);text(r,'UNDO '+s.undoRemaining+'/3',732,21,24,s.undoRemaining?C.gold:C.muted);
  landing.forEach(function(j){var a=pos(j.from),b=pos(j.to);r.line(a.x,a.y,b.x,b.y,4,'#347e783e');});
  config.positions.forEach(function(p){
   var point=pos(p.index),isLanding=landing.some(function(j){return j.to===p.index;});
   if(s.source===p.index){r.circle(point.x,point.y,33,C.gold);r.circle(point.x,point.y,30,'#746344');}
   if(isLanding){r.circle(point.x,point.y,33,C.mint);r.circle(point.x,point.y,29,'#2c6766');}
   r.sprite('socket',point.x,point.y,76,76,0,'#ffffff');
   if(s.occupied[p.index])r.sprite('pearl',point.x,point.y-1,75,75,0,'#ffffff');
   center(r,p.label,point.x,point.y-12,24,s.occupied[p.index]?'#2c3451':isLanding?C.mint:'#bdc8d8');
   if(s.cursor===p.index)brackets(r,point.x,point.y,C.mint);
  });
  r.sprite('medallion',888,129,49,49,0,'#ffffff');
  text(r,'GOAL',678,98,24,C.muted);text(r,'ONE PEG',678,131,28,C.ink);
  text(r,'CURSOR  #'+(s.cursor+1),678,196,24,C.mint);
  text(r,s.source===null?'SOURCE  --':'SOURCE  #'+(s.source+1),678,226,24,C.gold);
  var ids=landing.map(function(j){return j.to+1;});
  text(r,ids.length?'LAND '+ids.join(', '):s.source===null?'SELECT A PEG':'NO LANDING',678,257,24,ids.length?C.mint:C.muted);
  text(r,'LEGAL JUMPS '+s.legalJumps.length,678,316,24,s.legalJumps.length?C.ink:C.red);
  r.circle(691,368,12,C.gold);r.circle(691,368,8,C.dark);text(r,'SOURCE',719,355,24,C.gold);
  r.line(680,395,680,382,2,C.mint);r.line(680,382,691,382,2,C.mint);r.line(702,395,702,408,2,C.mint);r.line(702,408,691,408,2,C.mint);
  text(r,'CURSOR',719,383,24,C.mint);
  r.circle(691,429,12,C.mint);r.circle(691,429,8,C.dark);text(r,'LANDING',719,416,24,C.mint);
  text(r,'ARROWS MOVE',38,497,24,C.mint);text(r,s.source===null?'A SELECT':'A JUMP',300,497,24,C.ink);
  text(r,s.source===null?'B UNDO':'B CANCEL',514,497,24,C.ink);text(r,'LEFT '+s.undoRemaining,769,497,24,C.gold);
 }
 root.GameDef={id:'triangle-pegs',title:'三角跳珠',seed:config.defaultSeed,accent:C.gold,background:C.bg,atlas:atlas,
  holdConfirmAsA:true,tagline:'十五个孔，只留一珠',levelLabel:'开局',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['选珠 / 跳跃','取消 / 撤回'],
  description:'方向选孔，A 选中棋珠，再选两格外的空孔按 A，跨过并移除中间棋珠。六个直线方向都能跳，只剩一珠即获胜。B 先取消选珠；未选珠时 B 撤回一步，每局三次。无路可跳且不能撤回时失败。',
  controls:{move:'方向选择孔位；上下沿斜边换行',a:'空格、Z、确认 / 手机右上：选珠或跳跃',b:'X、B / 手机右下：取消选珠；未选时撤回'},
  tip:'方角是光标，金环是来源，青环是合法落点。只能跨一颗邻珠落到空孔，相邻移动无效。B 取消不扣次数；撤回会恢复两珠并消耗一次机会。没有倒计时。',
  winTitle:'只留一珠，棋盘解开',loseTitle:'无路可跳，撤回已用尽',
  hud:function(s){return[{label:'当前孔位',value:(s.cursor+1)+' 号'},
   {label:'来源棋珠',value:s.source===null?'未选择':(s.source+1)+' 号'},
   {label:'剩余棋珠',value:s.pegsRemaining,tone:s.pegsRemaining<=3?'good':''},
   {label:'剩余撤回',value:s.undoRemaining,tone:s.undoRemaining?'':'warn'}];},
  result:function(s){return(s.phase==='won'?'只剩一颗棋珠，完成三角跳珠。':'还有 '+s.pegsRemaining+' 颗棋珠，但没有合法跳跃或可用撤回。')+'跳跃 '+s.jumpsMade+' 次、撤回 '+s.undosUsed+' 次，用时 '+s.elapsed.toFixed(1)+' 秒。';},render:render};
})(window);
