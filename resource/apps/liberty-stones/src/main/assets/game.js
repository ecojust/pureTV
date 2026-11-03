(function(root){
 'use strict';
 var C={bg:'#1c3436',ink:'#f1e5c8',muted:'#b3c4b6',gold:'#efc675',mint:'#72cfbd',red:'#f0a58e',wood:'#d9c191',line:'#58674d'};
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 function stone(name,x,black){return{name:name,x:x,y:0,w:128,h:128,paint:function(c,w,h,art){
  art.ellipse(c,65,75,52,46,'#162b3544');art.ellipse(c,64,60,51,49,art.radial(c,64,60,52,black?[[0,'#536469'],[.48,'#263a3f'],[.85,'#10262d'],[1,'#071a24']]:[[0,'#fff8dc'],[.55,'#e7e5cd'],[.9,'#b8c5b3'],[1,'#6d9186']],45,36));
  c.strokeStyle=black?'#c8dfdb55':'#ffffffbb';c.lineWidth=3;c.beginPath();c.arc(64,60,44,3.5,5.1);c.stroke();art.ellipse(c,46,38,12,6,black?'#c5e1de24':'#ffffff77');
 }};}
 var atlas={builtins:[],tiles:[
  {name:'gardenBoard',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
   c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#365956'],[.5,'#213d3e'],[1,'#172f35']]);c.fillRect(0,0,960,540);
   c.strokeStyle='#9cb99412';c.lineWidth=2;for(var k=0;k<8;k++){c.beginPath();c.moveTo(3+k*14,535);c.bezierCurveTo(-35,340,110+k*40,220,47+k*5,0);c.stroke();}
   [[39,51],[896,509],[900,37],[541,503]].forEach(function(p){for(var k=0;k<3;k++){c.save();c.translate(p[0],p[1]);c.rotate(k*.8);art.ellipse(c,0,-11,3,11,'#adc89b19');c.restore();}});
   round(c,18,12,924,42,9,'#142e34dd','#72928a');round(c,45,71,510,418,13,'#122d334d');
   round(c,37,65,510,418,13,art.linear(c,37,65,547,483,[[0,'#e8d5a4'],[.45,'#c6b783'],[1,'#a08c5f']]),'#eadcaa',2);
   round(c,49,77,486,394,8,art.linear(c,49,77,535,471,[[0,'#e2cfa0'],[.6,'#d3c194'],[1,'#c6b284']]),'#8c8b61',2);
   c.save();round(c,50,78,484,392,7);c.clip();for(var y=87;y<471;y+=8){c.strokeStyle=y%16?'#f8e6bb25':'#8b866017';c.lineWidth=1;c.beginPath();c.moveTo(50,y);c.bezierCurveTo(210,y+8,387,y-6,534,y+2);c.stroke();}c.restore();
   round(c,579,72,351,132,10,'#17363a','#73968a',2);round(c,579,218,351,149,10,'#234346','#73968a',2);round(c,579,381,351,102,10,'#17363a','#73968a',2);
   round(c,24,499,912,30,8,'#142f35','#72928a');c.restore();
  }},stone('blackStone',640,true),stone('whiteStone',768,false),
  {name:'captureStar',x:896,y:0,w:128,h:128,paint:function(c,w,h,art){var p=[];for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,rr=i%2?24:50;p.push([64+Math.cos(a)*rr,64+Math.sin(a)*rr]);}art.path(c,p,art.linear(c,0,14,0,114,[[0,'#ffe7ac'],[.45,'#e5bd70'],[1,'#a77942']]),'#f9dca0',3);art.path(c,[[64,14],[64,63],[16,48],[49,57]],'#fff0bd44');}}
 ]};
 var model=root.PureModel,config=model.config;
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
 function geometry(n){var gap=n===5?68:n===6?58:50;return{gap:gap,x:292-(n-1)*gap/2,y:286-(n-1)*gap/2};}
 function render(r,s){
  var l=config.layouts[s.level],g=geometry(s.size),row=Math.floor(s.cursor/s.size),col=s.cursor%s.size,focus=s.groups.find(function(group){return group.stones.indexOf(s.cursor)>=0;});
  r.sprite('gardenBoard',480,270,960,540,0,'#ffffff');text(r,l.name,34,21,28,C.ink);text(r,'CAPTURE RACE  '+s.target,591,24,24,C.muted);
  for(var i=0;i<s.size;i++){var x=g.x+i*g.gap,y=g.y+i*g.gap;r.line(g.x,y,g.x+(s.size-1)*g.gap,y,1.5,C.line);r.line(x,g.y,x,g.y+(s.size-1)*g.gap,1.5,C.line);center(r,i+1,x,80,24,col===i?'#805b2a':'#68704f');center(r,i+1,84,y-12,24,row===i?'#805b2a':'#68704f');}
  for(var i=0;i<s.board.length;i++){var x=g.x+(i%s.size)*g.gap,y=g.y+Math.floor(i/s.size)*g.gap;if(focus&&focus.liberties.indexOf(i)>=0){r.circle(x,y,7,C.mint);r.circle(x,y,3.2,'#d6c28f');}if(focus&&focus.stones.indexOf(i)>=0)r.circle(x,y,g.gap*.45,'#65bda17c');
   if(s.board[i])r.sprite(s.board[i]===1?'blackStone':'whiteStone',x,y,g.gap*.91,g.gap*.91,0,'#ffffff');
   if(s.lastAI&&s.lastAI.type==='place'&&s.lastAI.point===i){r.circle(x,y,4,C.red);r.circle(x,y,1.7,'#734d43');}
  }
  var cx=g.x+col*g.gap,cy=g.y+row*g.gap;frame(r,cx-g.gap*.47,cy-g.gap*.47,g.gap*.94,g.gap*.94,'#9c6d2f',3);frame(r,cx-g.gap*.47+3,cy-g.gap*.47+3,g.gap*.94-6,g.gap*.94-6,'#f9df98',1);
  r.sprite('blackStone',610,107,36,36,0,'#ffffff');text(r,'YOU '+s.captures.player+' / '+s.target,644,89,28,C.ink);
  r.sprite('whiteStone',610,165,36,36,0,'#ffffff');text(r,'AI  '+s.captures.ai+' / '+s.target,644,147,28,C.ink);
  for(var k=0;k<s.target;k++){r.sprite('captureStar',827+k*25,105,23,23,0,k<s.captures.player?'#ffffff':'#4a6962');r.sprite('captureStar',827+k*25,163,23,23,0,k<s.captures.ai?'#ffffff':'#4a6962');}
  text(r,'CURSOR R'+(row+1)+' C'+(col+1),595,229,24,C.muted);
  text(r,focus?'GROUP '+(focus.color===1?'BLACK':'WHITE'):'EMPTY POINT',595,265,26,C.ink);
  text(r,focus?'STONES '+focus.stones.length+' / LIBS '+focus.liberties.length:'A PLACE BLACK',595,300,24,focus&&focus.liberties.length===1?C.red:C.mint);
  text(r,'MINT RINGS = LIBS',595,337,24,C.muted);
  text(r,'TURNS '+s.playerTurns+' / '+s.turnLimit,595,392,26,C.ink);
  text(r,s.lastAI?(s.lastAI.type==='pass'?'LAST AI PASS':'LAST AI R'+(Math.floor(s.lastAI.point/s.size)+1)+' C'+(s.lastAI.point%s.size+1)):'LAST AI --',595,426,24,C.red);
  text(r,'KO: SIMPLE',595,458,24,C.muted);
  text(r,'ARROWS CURSOR',38,500,24,C.muted);text(r,'A BLACK STONE',349,500,24,C.gold);text(r,'B PASS',686,500,24,C.mint);
 }
 root.GameDef={id:'liberty-stones',title:'围子夺星',seed:config.defaultSeed,accent:C.gold,background:C.bg,atlas:atlas,holdConfirmAsA:true,
  tagline:'寻气围子，四子夺星',levelLabel:'棋盘',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['落下一子','停一手'],
  description:'你执黑，与公开规则的白方展开提子竞赛。横竖相连的同色棋子组成棋块，相邻空点是气；围住对方全部气便提走整块。方向移动，A 落子，B 停一手。先提满四子获胜；手数用尽或双方连续停手仍未达标则失败。',
  controls:{move:'方向键移动交点',a:'空格、Z、确认 / 手机右上：落黑子',b:'X / 手机右下：停一手'},
  tip:'先提子，再判断自杀；禁止立即回劫。金框是光标，青圈显示所指棋块的气。黑白双方先提满四子者胜；连续两次停手或手数用尽未达标，需重试。',
  winTitle:'四子归星，围局得胜',loseTitle:'夺星未成，重新寻气',
  hud:function(s){return[{label:'黑方提子',value:s.captures.player+' / '+s.target},{label:'白方提子',value:s.captures.ai+' / '+s.target},{label:'已用手数',value:s.playerTurns+' / '+s.turnLimit},{label:'连续停手',value:s.passStreak+' / 2'}];},
  result:function(s){return(s.phase==='won'?'黑方先提满目标，夺星成功。':s.reason==='opponent'?'白方先提满目标。':s.reason==='passes'?'双方连续停手，未完成提子目标。':'手数用尽，未完成提子目标。')+'黑方提 '+s.captures.player+' 子，白方提 '+s.captures.ai+' 子，共走 '+s.playerTurns+' 手。';},render:render};
})(window);
