(function(root){
  'use strict';
  var config=root.PureModel.config,palette={2:'#d9c6a1',4:'#e4c381',8:'#a8c8a1',16:'#8fc8c8',32:'#91b4db',64:'#b4a3da',128:'#dca6b6'};
  function poly(c,p,fill,stroke){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'numberbench',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#293c51'],[1,'#122638']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#8b9aab14';c.lineWidth=1;for(var x=0;x<960;x+=24){c.beginPath();c.moveTo(x,0);c.lineTo(x,540);c.stroke();}
      poly(c,[[22,18],[938,18],[938,73],[22,73]],'#172c3d','#738998');
      poly(c,[[39,88],[470,88],[488,106],[488,514],[39,514]],'#0b1d2c','#7c8e92');
      poly(c,[[510,92],[919,92],[919,193],[510,193]],'#c9c3a8','#e0d5ac');
      poly(c,[[510,211],[919,211],[919,324],[510,324]],'#20384b','#6d8795');
      poly(c,[[510,342],[919,342],[919,434],[510,434]],'#20384b','#6d8795');
      c.strokeStyle='#c5a873';c.lineWidth=2;c.beginPath();c.moveTo(515,454);c.lineTo(914,454);c.stroke();
      [52,475].forEach(function(bx){[101,501].forEach(function(by){art.ellipse(c,bx,by,4,4,'#bba77e');c.strokeStyle='#52656c';c.lineWidth=1;c.beginPath();c.moveTo(bx-2,by+2);c.lineTo(bx+2,by-2);c.stroke();});});
      c.restore();
    }},
    {name:'numbertile',x:640,y:0,w:144,h:144,paint:function(c,w,h,art){
      poly(c,[[18,7],[126,7],[137,18],[137,126],[126,137],[18,137],[7,126],[7,18]],art.linear(c,0,0,144,144,[[0,'#ffffff'],[.45,'#e3ebe8'],[1,'#91a6b0']]),'#344e64');
      poly(c,[[18,7],[126,7],[116,20],[28,20],[20,28],[20,116],[7,126],[7,18]],'#f8fff0');
      poly(c,[[137,18],[137,126],[126,137],[18,137],[28,124],[116,124],[124,116],[124,28]],'#8198a6');
      poly(c,[[29,22],[115,22],[122,29],[122,115],[115,122],[29,122],[22,115],[22,29]],'#eaf0e5','#bacac8');
      c.strokeStyle='#ffffff99';c.lineWidth=1;c.beginPath();c.moveTo(30,32);c.lineTo(110,32);c.stroke();
    }},
    {name:'emptycell',x:784,y:0,w:128,h:128,paint:function(c,w,h){
      c.fillStyle='#1b3143';c.fillRect(3,3,122,122);c.strokeStyle='#39566b';c.lineWidth=2;c.strokeRect(4,4,120,120);
      c.strokeStyle='#5e7b8533';c.lineWidth=1;c.beginPath();c.moveTo(14,22);c.lineTo(14,14);c.lineTo(22,14);c.moveTo(106,114);c.lineTo(114,114);c.lineTo(114,106);c.stroke();
    }}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||'#e9e7d5');}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function render(r,s){
    var l=config.layouts[s.level],ox=52,oy=103,u=104;r.sprite('numberbench',480,270,960,540,0,'#ffffff');
    text(r,l.name,44,34,30,'#f0dfba');text(r,'MERGE TILES',698,39,25,'#b6cbda');
    for(var i=0;i<16;i++){var x=ox+(i%4)*u,y=oy+Math.floor(i/4)*u,value=s.cells[i];
      r.sprite(value?'numbertile':'emptycell',x+u/2,y+u/2,u-7,u-7,0,value?palette[value]||'#dca6b6':'#ffffff');
      if(value)center(r,value,x+u/2,y+u/2-(value>=100?22:25),value>=100?41:48,'#233c53');
      if(s.lastMerges.some(m=>m.index===i))frame(r,x+8,y+8,u-16,u-16,'#a3d6ba',2);
      if(s.lastSpawn&&s.lastSpawn.index===i){r.circle(x+u-18,y+18,5,'#f4d58a');frame(r,x+5,y+5,u-10,u-10,'#e8c27d',2);}
    }
    text(r,'TARGET',533,105,24,'#69756f');text(r,s.target,533,142,36,'#26485a');text(r,'NEXT TILE',740,105,24,'#69756f');text(r,s.nextSpawnValue,740,142,36,'#26485a');
    text(r,'VALID MOVES',533,225,24,'#aec1ca');text(r,s.movesUsed+' / '+s.moveLimit,533,261,33,s.moveLimit-s.movesUsed<=4?'#efc582':'#e9e7d5');
    text(r,'SCORE '+s.points,731,269,24,'#b8d5be');
    text(r,'UNDO TICKETS',533,354,24,'#aec1ca');text(r,s.undoTickets+' / 2',533,393,28,'#efc582');text(r,'A UNDO',748,393,25,'#e9e7d5');
    text(r,'ONCE PER SLIDE',530,467,24,'#efc582');
    text(r,s.lastSpawn?'NEW: ROW '+(Math.floor(s.lastSpawn.index/4)+1)+' / COL '+(s.lastSpawn.index%4+1):'NO NEW TILE ON A WIN',530,501,21,'#aec1ca');
  }
  root.GameDef={id:'merge-tiles',title:'数字汇聚',seed:config.defaultSeed,accent:'#dfbd7c',background:'#20384b',atlas,holdConfirmAsA:true,
    tagline:'相同相聚，数字倍增',levelLabel:'目标',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['撤回（不退步数）'],
    description:'四向滑动整盘数字，相同相邻块合并一次，新合成的块本步不会再合并。有效滑动后按公开规则加入2或4。达到目标获胜；A 用撤回券恢复棋盘，但不退步数。',
    controls:{move:'四向压实与合并',a:'空格、Z、确认 / 手机右侧：撤回',b:'B 无操作'},
    tip:'2 2 2 2 一步变成4 4，不会变8。无变化不扣步数。两张撤回券会恢复出块进度；最后一步形成目标仍能胜利。新块落点由滑动后的空位决定。',
    winTitle:'目标汇聚，数字成形',loseTitle:'本局汇聚结束',
    hud:function(s){return[{label:'目标数字',value:s.target},{label:'剩余有效步',value:s.moveLimit-s.movesUsed,tone:s.moveLimit-s.movesUsed<=4?'warn':''},
      {label:'合并得分',value:s.points,tone:'good'},{label:'下个新块',value:s.nextSpawnValue}];},
    result:function(s){return(s.phase==='won'?'已形成目标数字。':s.reason==='stuck'?'棋盘已无可改变的滑动。':'有效步数已经用完。')+'有效滑动 '+s.movesUsed+'/'+s.moveLimit+' 步，合并得分 '+s.points+'，撤回 '+s.undos+' 次。';},render};
})(window);
