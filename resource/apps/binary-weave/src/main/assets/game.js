(function(root){
  'use strict';
  var config=root.PureModel.config,cream='#f4e6c9',ink='#303d40',gold='#ddbc79';
  function poly(c,p,fill,stroke){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  function weave(c,w,h,base,light){c.fillStyle=base;c.fillRect(0,0,w,h);c.strokeStyle=light;c.lineWidth=2;for(var k=-h;k<w;k+=11){c.beginPath();c.moveTo(k,0);c.lineTo(k+h,h);c.stroke();}c.strokeStyle='#121b211b';c.lineWidth=2;for(var y=5;y<h;y+=12){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'weaveloom',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);weave(c,960,540,'#293a40','#57676a24');c.fillStyle='#1b2c31';c.fillRect(17,15,924,64);c.strokeStyle='#b99d6b';c.lineWidth=2;c.strokeRect(22,20,914,54);
      c.fillStyle=art.linear(c,0,90,460,510,[[0,'#b99664'],[.5,'#e0c393'],[1,'#8e744e']]);c.fillRect(27,87,430,421);c.fillStyle='#6d7565';c.fillRect(37,96,410,407);
      c.strokeStyle='#ead9af';c.lineWidth=2;for(var x=34;x<453;x+=12){c.beginPath();c.moveTo(x,89);c.lineTo(x+6,94);c.moveTo(x,500);c.lineTo(x+6,506);c.stroke();}for(var y=102;y<498;y+=12){c.beginPath();c.moveTo(30,y);c.lineTo(35,y+6);c.moveTo(450,y);c.lineTo(455,y+6);c.stroke();}
      c.fillStyle='#ece1c8';c.fillRect(485,94,449,129);c.fillRect(485,238,449,266);c.strokeStyle='#b79e71';c.lineWidth=2;c.strokeRect(489,98,441,121);c.strokeRect(489,242,441,258);
      c.strokeStyle='#b59f7b88';c.lineWidth=1;c.beginPath();c.moveTo(506,365);c.lineTo(912,365);c.stroke();c.restore();
    }},
    {name:'weaveempty',x:640,y:0,w:96,h:96,paint:function(c){weave(c,96,96,'#e7e1d1','#fffdf04d');c.strokeStyle='#959e8e';c.lineWidth=2;c.strokeRect(1,1,94,94);}},
    {name:'weavezero',x:736,y:0,w:96,h:96,paint:function(c){weave(c,96,96,'#366a7b','#74a3aa30');c.strokeStyle='#c1d3bb';c.lineWidth=2;c.strokeRect(1,1,94,94);c.strokeStyle='#163e4c';c.lineWidth=2;c.strokeRect(4,4,88,88);}},
    {name:'weaveone',x:832,y:0,w:96,h:96,paint:function(c){weave(c,96,96,'#a15f42','#e4a46e3a');c.strokeStyle='#e2c39d';c.lineWidth=2;c.strokeRect(1,1,94,94);c.strokeStyle='#6f3b2e';c.lineWidth=2;c.strokeRect(4,4,88,88);}},
    {name:'weavelock',x:0,y:800,w:48,h:56,paint:function(c){c.strokeStyle='#fff';c.lineWidth=6;c.beginPath();c.moveTo(12,24);c.lineTo(12,16);c.bezierCurveTo(12,1,36,1,36,16);c.lineTo(36,24);c.stroke();c.fillStyle='#fff';c.fillRect(6,22,36,28);c.save();c.globalCompositeOperation='destination-out';c.beginPath();c.arc(24,33,4,0,Math.PI*2);c.fill();c.fillRect(22,33,4,8);c.restore();}},
    {name:'weavefocus',x:48,y:800,w:96,h:96,paint:function(c){c.strokeStyle='#fff';c.lineWidth=7;c.beginPath();c.moveTo(7,28);c.lineTo(7,7);c.lineTo(28,7);c.moveTo(68,7);c.lineTo(89,7);c.lineTo(89,28);c.moveTo(89,68);c.lineTo(89,89);c.lineTo(68,89);c.moveTo(28,89);c.lineTo(7,89);c.lineTo(7,68);c.stroke();}},
    {name:'weaveshuttle',x:144,y:800,w:128,h:64,paint:function(c,w,h,art){poly(c,[[3,32],[26,7],[102,7],[125,32],[102,57],[26,57]],'#d9b77b','#8d7248');poly(c,[[25,32],[39,18],[89,18],[103,32],[89,46],[39,46]],'#365d69');c.strokeStyle='#d7ded0';c.lineWidth=3;for(var x=43;x<90;x+=8){c.beginPath();c.moveTo(x,18);c.lineTo(x,46);c.stroke();}}}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function cell(r,value,x,y,u,fixed){r.sprite(value===-1?'weaveempty':value===0?'weavezero':'weaveone',x+u/2,y+u/2,u,u,0,'#ffffff');center(r,value===-1?'-':value,x+u/2,y+u*.24,u*.56,value===-1?'#9aa28f':'#fff4d8');if(fixed)r.sprite('weavelock',x+u-9,y+10,10,12,0,'#fff1cc');}
  function render(r,s){
    var l=config.layouts[s.level],u=392/s.width,ox=47,oy=103;r.sprite('weaveloom',480,270,960,540,0,'#ffffff');r.sprite('weaveshuttle',65,48,58,29,0,'#ffffff');text(r,l.name,111,38,28,cream);text(r,'BINARY WEAVE',728,41,23,'#d9c294');
    var errors=new Set(s.lastCheck?s.lastCheck.errors.flatMap(e=>e.cells):[]);
    for(var p=0;p<s.cells.length;p++){var x=ox+p%s.width*u,y=oy+Math.floor(p/s.width)*u;cell(r,s.cells[p],x,y,u,Object.prototype.hasOwnProperty.call(s.fixedValues,p));if(errors.has(p))frame(r,x+2,y+2,u-4,u-4,'#f1b2a0',2);}
    var x=ox+s.cursor%s.width*u,y=oy+Math.floor(s.cursor/s.width)*u;r.sprite('weavefocus',x+u/2,y+u/2,u,u,0,'#142b32');r.sprite('weavefocus',x+u/2,y+u/2,u-4,u-4,0,'#ffe0a1');
    text(r,'A :  -  >  0  >  1  >  -',509,110,26,ink);r.sprite('weavelock',518,163,15,18,0,'#577172');text(r,'GIVEN: LOCKED',540,151,22,'#4b666b');text(r,'B : CHECK WHEN FULL',509,188,24,'#90633e');
    text(r,'HALF 0 / HALF 1',509,253,25,ink);text(r,'NO 000 OR 111',509,292,25,ink);text(r,'ROWS DIFFER / COLS DIFFER',509,331,22,ink);
    var row=s.rowStatus[Math.floor(s.cursor/s.width)],col=s.columnStatus[s.cursor%s.width];
    text(r,'ROW '+(row.index+1)+'     0:'+row.zeros+'   1:'+row.ones,509,383,24,'#335c68');if(row.matched)text(r,'OK',868,385,20,'#667b46');
    text(r,'COL '+(col.index+1)+'      0:'+col.zeros+'   1:'+col.ones,509,424,24,'#335c68');if(col.matched)text(r,'OK',868,426,20,'#667b46');
    text(r,'EACH NEEDS '+s.width/2+' ZEROS / '+s.width/2+' ONES',509,470,18,'#657069');
    text(r,'LOCK = GIVEN / ARROWS DO NOT WRAP',36,518,17,'#c7d1bf');
    if(s.lastCheck&&s.lastCheck.errors.length){var e=s.lastCheck.errors[0],label=e.type==='row-balance'?'ROW '+(e.row+1)+': UNEQUAL 0 / 1':e.type==='column-balance'?'COL '+(e.column+1)+': UNEQUAL 0 / 1':e.type==='row-triple'?'ROW '+(e.row+1)+': THREE IN A LINE':e.type==='column-triple'?'COL '+(e.column+1)+': THREE IN A LINE':e.type==='duplicate-rows'?'ROWS '+(e.rows[0]+1)+' / '+(e.rows[1]+1)+': SAME PATTERN':e.type==='duplicate-columns'?'COLS '+(e.columns[0]+1)+' / '+(e.columns[1]+1)+': SAME PATTERN':'FIXED CLUE CHANGED';text(r,label,503,518,18,'#f2b49d');}
    else text(r,'EDIT FREE / 3 WRONG CHECKS END',503,518,18,'#c7d1bf');
  }
  root.GameDef={id:'binary-weave',title:'二元织格',seed:config.defaultSeed,accent:gold,background:'#2b4148',atlas,holdConfirmAsA:true,
    tagline:'零一均分，经纬不重',levelLabel:'织格',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['空格 / 0 / 1','检查织格'],
    description:'填入0和1：每行每列两种数字各占一半，不能连续三个相同；任意两行不能完全一样，任意两列也不能完全一样。带锁格是固定公开线索，空格用短横线表示。填满后按 B 检查。',
    controls:{move:'四向逐格移动；边缘不绕回',a:'空格、Z、确认 / 手机右上：空格→0→1→空格；锁定格不可改',b:'X、B / 手机右下：检查完整织格'},
    tip:'颜色辅助辨认，数字才是0/1。行和列分别去重，行可以与列相同；斜线不检查，三连不跨越棋盘边缘。填写与未填满检查免费；完整错误只记一次，三次结束。右侧显示光标所在行、列的当前数量。',
    winTitle:'经纬均衡，纹样各异',loseTitle:'完整检查错误已达三次',
    hud:function(s){return[{label:'已填格',value:s.filledCount+' / '+s.cells.length},{label:'可填写格',value:s.editableCount},{label:'错误检查',value:s.mistakes+' / 3',tone:s.mistakes>=2?'warn':''},{label:'光标行:列',value:(Math.floor(s.cursor/s.width)+1)+':'+(s.cursor%s.width+1)}];},
    result:function(s){return(s.phase==='won'?'每行列0/1均分、没有三连，同向行列互不重复。':'三次完整提交仍有数量、三连或重复错误。')+'完整检查 '+s.checks+' 次，错误 '+s.mistakes+' 次，修改 '+s.edits+' 次。';},render};
})(window);
