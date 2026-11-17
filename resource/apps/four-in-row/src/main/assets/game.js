(function(root){
 'use strict';
 var C={bg:'#152c43',ink:'#f7ebd0',muted:'#aec4d0',gold:'#edc36f',mint:'#82d4ce',red:'#f2a699',dark:'#19394d'};
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 function token(name,x,player){return{name,x,y:0,w:128,h:128,paint:function(c,w,h,art){
  art.ellipse(c,64,106,51,13,'#071c3066');
  art.ellipse(c,64,62,52,52,art.radial(c,64,62,53,player?[[0,'#fff0b4'],[.5,'#e9c573'],[.82,'#bc8d42'],[1,'#755b39']]:[[0,'#d5f4e6'],[.5,'#79c7bf'],[.82,'#3c969c'],[1,'#26596e']],42,34));
  c.strokeStyle=player?'#fff6d6b0':'#e5ffff99';c.lineWidth=3;c.beginPath();c.arc(63,61,46,3.5,5.15);c.stroke();
  c.strokeStyle=player?'#6a582f':'#1d5566';c.lineWidth=8;c.lineCap='round';
  if(player){c.beginPath();c.arc(64,62,21,0,Math.PI*2);c.stroke();}
  else{c.beginPath();c.moveTo(49,47);c.lineTo(79,77);c.moveTo(79,47);c.lineTo(49,77);c.stroke();}
 }};}
 var atlas={builtins:[],tiles:[
  {name:'arenaBoard',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
   c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#375870'],[.45,'#22465f'],[1,'#142e47']]);c.fillRect(0,0,960,540);
   c.strokeStyle='#bfd7d512';c.lineWidth=1;
   for(var x=-200;x<960;x+=56){c.beginPath();c.moveTo(x,0);c.lineTo(x+200,540);c.stroke();}
   round(c,16,12,928,42,9,'#122e46dd','#7593a4');
   round(c,59,80,474,406,14,art.linear(c,59,80,533,486,[[0,'#849aa4'],[.22,'#496d84'],[.8,'#284f6f'],[1,'#183d5a']]),'#acc7ca',2);
   round(c,68,87,456,390,9,'#183b59','#7294a7',1.5);
   for(var row=0;row<6;row++)for(var col=0;col<7;col++){var xx=72+col*64,yy=90+row*64;c.strokeStyle='#87adb51c';c.lineWidth=1;c.strokeRect(xx,yy,64,64);}
   [[64,86],[528,86],[64,480],[528,480]].forEach(function(p){art.ellipse(c,p[0],p[1],3,3,'#d7d7b7');c.strokeStyle='#5f7578';c.lineWidth=1;c.beginPath();c.moveTo(p[0]-1,p[1]+1);c.lineTo(p[0]+1,p[1]-1);c.stroke();});
   round(c,582,72,354,414,13,art.linear(c,582,72,936,486,[[0,'#335972'],[1,'#193c57']]),'#82a6b1',2);
   round(c,598,88,322,94,9,'#173c55','#668e9f');
   round(c,598,195,322,111,9,'#173c55','#668e9f');
   round(c,598,319,322,151,9,'#173c55','#668e9f');
   round(c,24,498,912,30,8,'#11344c','#7599a5');c.restore();
  }},
  token('sunToken',640,true),token('waveToken',768,false),
  {name:'socket',x:896,y:0,w:128,h:128,paint:function(c,w,h,art){
   art.ellipse(c,64,65,51,51,'#608094');art.ellipse(c,64,63,48,48,art.radial(c,64,63,48,[[0,'#0e243e'],[.73,'#142e48'],[1,'#284b62']],61,79));
   c.strokeStyle='#8fb2bd66';c.lineWidth=3;c.beginPath();c.arc(64,65,50,.15,2.9);c.stroke();
  }}
 ]};
 var model=root.PureModel,config=model.config;
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
 function render(r,s){
  var l=config.layouts[s.level],full=s.board[0][s.column]!==0;
  r.sprite('arenaBoard',480,270,960,540,0,'#ffffff');
  text(r,l.name,30,19,28,C.ink);text(r,'YOU O  /  AI X',552,21,24,C.muted);
  for(var col=0;col<7;col++){center(r,col+1,104+col*64,59,24,col===s.column?(full?C.red:C.gold):C.muted);}
  r.rect(72+s.column*64,90,64,384,'#a9e2cb15');frame(r,72+s.column*64,89,64,386,full?'#d6958166':'#8adaca66',1.5);
  var tip=104+s.column*64;r.line(tip-7,83,tip,90,2,full?C.red:C.mint);r.line(tip,90,tip+7,83,2,full?C.red:C.mint);
  var landing=-1;for(var rr=5;rr>=0;rr--)if(s.board[rr][s.column]===0){landing=rr;break;}
  for(var row=0;row<6;row++)for(var column=0;column<7;column++){
   var x=104+column*64,y=122+row*64,value=s.board[row][column],winning=s.winningCells.indexOf(row*7+column)>=0;
   r.sprite('socket',x,y,72,72,0,'#ffffff');
   if(value)r.sprite(value===1?'sunToken':'waveToken',x,y,68,68,0,'#ffffff');
   if(landing===row&&column===s.column&&s.phase==='playing'){r.circle(x,y,18,'#6fb6ac55');r.line(x,y-9,x,y+9,2,C.mint);r.line(x-5,y+4,x,y+9,2,C.mint);r.line(x,y+9,x+5,y+4,2,C.mint);}
   if(s.lastAI&&s.lastAI.row===row&&s.lastAI.col===column)frame(r,x-28,y-28,56,56,C.red,2);
   if(winning)frame(r,x-30,y-30,60,60,C.gold,3);
  }
  r.sprite('sunToken',626,114,35,35,0,'#ffffff');text(r,'YOU  CIRCLE',658,102,24,C.gold);
  r.sprite('waveToken',626,151,35,35,0,'#ffffff');text(r,'AI   CROSS',658,139,24,C.mint);
  text(r,'COLUMN '+(s.column+1)+(full?'  FULL':''),614,207,26,full?C.red:C.ink);
  text(r,s.lastAI?'LAST AI R'+(s.lastAI.row+1)+' C'+(s.lastAI.col+1):'LAST AI  --',614,247,24,C.red);
  text(r,s.lastPlayer?'LAST YOU R'+(s.lastPlayer.row+1)+' C'+(s.lastPlayer.col+1):'LAST YOU --',614,279,24,C.gold);
  text(r,'RECENT TURNS',614,330,24,C.muted);
  if(!s.turnReceipts.length)text(r,'YOUR MOVE FIRST',614,381,24,C.ink);
  s.turnReceipts.slice(-3).forEach(function(turn,i){text(r,turn.turn+'  YOU '+(turn.player.col+1)+' / AI '+(turn.ai?turn.ai.col+1:'-'),614,366+i*31,24,C.ink);});
  text(r,'< > COLUMN',38,499,24,C.mint);text(r,'A DROP',326,499,24,C.gold);text(r,'CONNECT FOUR',543,499,24,C.ink);text(r,'COL '+(s.column+1),809,499,24,C.muted);
 }
 root.GameDef={id:'four-in-row',title:'四子列阵',seed:config.defaultSeed,accent:C.gold,background:C.bg,atlas:atlas,
  holdConfirmAsA:true,tagline:'重力落子，四子争先',levelLabel:'残局',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['落下一子'],
  description:'从公开残局开始，与你对面的叉形棋子交替落子。左右选列，A 把圆环棋子落到该列最低空位；横、竖或斜向连成四子即可获胜。对手会立即回应，红框标记它刚落的棋子。满列不消耗回合，和棋需重试。',
  controls:{move:'左右选择落子列',a:'空格、Z、确认 / 手机右侧整区：落子',b:'只需 A；落子后对手自动回应'},
  tip:'圆环是你，叉形是对手；红框标记对手刚落的棋子。每子落到本列最低空位。横、竖、斜向四子即获胜；满列不算落子，和棋需重试。',
  winTitle:'四子相连，残局破解',loseTitle:'残局未胜，重新布阵',
  hud:function(s){return[{label:'选择列',value:(s.column+1)+' / 7'},{label:'你的落子',value:s.playerDrops},
   {label:'对手落子',value:s.aiDrops},{label:'剩余空格',value:s.board.reduce(function(n,row){return n+row.filter(function(v){return v===0;}).length;},0)}];},
  result:function(s){return(s.phase==='won'?'你的圆环棋子连成了四子。':s.reason==='draw'?'棋盘已满，双方都未连成四子；和棋未完成胜利目标。':'对手的叉形棋子先连成了四子。')+'你落子 '+s.playerDrops+' 次，对手 '+s.aiDrops+' 次，用时 '+s.elapsed.toFixed(1)+' 秒。';},render:render};
})(window);
