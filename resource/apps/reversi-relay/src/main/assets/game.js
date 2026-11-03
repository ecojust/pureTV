(function(root){
'use strict';
const C={paper:'#e9e5cc',ink:'#173d32',muted:'#4d6e59',green:'#23705a',gold:'#d6a451',line:'#a6b396',ivory:'#fff6d8'};
const config=root.PureModel.config;
function circle(c,x,y,r,fill,stroke){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
const atlas={builtins:[],tiles:[
 {name:'gardenCell',x:0,y:0,w:128,h:128,paint(c,w,h,art){
  c.fillStyle=art.linear(c,0,0,128,128,[[0,'#3b7860'],[1,'#24533f']]);c.fillRect(0,0,128,128);
  c.fillStyle='#e1f0b91c';c.fillRect(3,3,122,2);c.fillRect(3,3,2,122);c.fillStyle='#102e2a55';c.fillRect(3,123,122,2);c.fillRect(123,3,2,122);
  for(let i=8;i<124;i+=12){c.strokeStyle='#d6dfa50b';c.beginPath();c.moveTo(6,i);c.lineTo(122,i+4);c.stroke();}
 }},
 {name:'ivoryDisc',x:128,y:0,w:128,h:128,paint(c,w,h,art){
  art.ellipse(c,65,75,51,46,'#102d2855');circle(c,64,63,49,art.radial(c,64,63,50,[[0,'#fffbea'],[.7,'#f0e6c4'],[1,'#b7ad86']],45,40),'#fdf5d4');
  circle(c,64,61,38,'#fbf5df','#d7caa5');c.strokeStyle='#d1c19a';c.lineWidth=2;c.beginPath();c.moveTo(48,76);c.quadraticCurveTo(74,56,76,41);c.quadraticCurveTo(44,43,48,76);c.stroke();c.beginPath();c.moveTo(48,76);c.lineTo(70,49);c.stroke();
 }},
 {name:'jadeDisc',x:256,y:0,w:128,h:128,paint(c,w,h,art){
  art.ellipse(c,65,75,51,46,'#102d2866');circle(c,64,63,49,art.radial(c,64,63,50,[[0,'#5fa982'],[.65,'#267454'],[1,'#123c31']],44,35),'#aad3a2');
  circle(c,64,61,38,'#246c51','#6bab7f');c.strokeStyle='#aad29e';c.lineWidth=3;c.beginPath();c.moveTo(64,83);c.lineTo(64,40);c.moveTo(64,58);c.lineTo(49,46);c.moveTo(64,67);c.lineTo(78,54);c.stroke();
 }},
 {name:'fern',x:384,y:0,w:128,h:192,paint(c,w,h,art){
  c.strokeStyle='#638b6755';c.lineWidth=4;c.beginPath();c.moveTo(65,190);c.bezierCurveTo(39,136,51,70,77,8);c.stroke();
  for(let i=0;i<8;i++){let y=35+i*18,x=70-i*2;art.path(c,[[x,y],[x-35-i,y-19],[x-32-i,y+4]],'#5f8c6266');art.path(c,[[x,y+6],[x+36-i,y-6],[x+23,y+15]],'#44745455');}
 }}]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function coord(c){return String.fromCharCode(65+c%6)+(Math.floor(c/6)+1);}
function render(r,s){
 r.rect(0,0,960,540,C.paper);r.sprite('fern',912,422,110,165,0,'#ffffff');r.sprite('fern',43,113,76,114,.5,'#ffffff');
 r.rect(24,18,912,44,C.ink);text(r,'REVERSI / '+config.layouts[s.level].name,42,26,27,C.ivory);text(r,'6 x 6 ENDGAME',705,29,23,'#b8cda8');
 const left=105,top=92,size=64;
 r.rect(left-12,top-12,408,408,'#a69766');r.rect(left-7,top-7,398,398,'#d4c99a');
 for(let n=0;n<6;n++){center(r,String.fromCharCode(65+n),left+n*size+32,68,22,C.muted);center(r,n+1,82,top+n*size+21,22,C.muted);}
 for(let cell=0;cell<36;cell++){
  const x=left+(cell%6)*size,y=top+Math.floor(cell/6)*size;
  r.sprite('gardenCell',x+32,y+32,size,size,0,'#ffffff');
  if(s.board[cell])r.sprite(s.board[cell]===1?'ivoryDisc':'jadeDisc',x+32,y+32,61,61,0,'#ffffff');
  else if(s.legalMoves.includes(cell)){r.circle(x+32,y+32,17,'#d7e8a625');center(r,cell+1,x+32,y+21,22,'#eaf0c8');}
  if(s.lastAiMove&&s.lastAiMove.cell===cell)outline(r,x+9,y+9,46,46,'#92dbe3',2);
  if(s.lastPlayerMove&&s.lastPlayerMove.cell===cell){r.circle(x+48,y+14,4,'#9b782d');}
  if(s.cursor===cell)outline(r,x+1,y+1,62,62,'#ffdd81',4);
 }
 text(r,'YOU / IVORY',550,86,25,C.ink);text(r,'AI / JADE',749,86,25,C.green);
 r.sprite('ivoryDisc',583,158,75,75,0,'#ffffff');r.sprite('jadeDisc',781,158,75,75,0,'#ffffff');
 text(r,s.counts.player,631,132,44,C.ink);text(r,s.counts.opponent,831,132,44,C.green);
 r.rect(542,211,356,2,'#a9b897');
 text(r,s.phase==='playing'?(s.legalMoves.length?'YOUR TURN':'PASS REQUIRED'):(s.phase==='won'?'IVORY WINS':s.reason==='draw'?'DRAW':'JADE WINS'),550,228,29,C.ink);
 text(r,'CURSOR '+coord(s.cursor)+' / #'+(s.cursor+1),550,270,25,C.muted);
 text(r,'LEGAL '+s.legalMoves.length+'    EMPTY '+s.counts.empty,550,306,25,C.muted);
 const last=s.lastAiMove;
 text(r,'LAST AI '+(last?coord(last.cell)+'  +'+last.flipped.length:'--'),550,346,25,C.green);
 text(r,'PASSES YOU '+s.playerPasses+' / AI '+s.aiPasses,550,382,23,C.muted);
 r.rect(542,428,356,48,'#d7dcc0');
 center(r,s.legalMoves.length?'A PLACE   B NO PASS':'B PASS TO JADE',720,441,24,C.ink);
 text(r,'NUMBERS = LEGAL CELLS',105,500,23,C.muted);text(r,'BRACKET TO FLIP / MOST DISCS WINS',474,500,23,C.ink);
}
root.GameDef={id:'reversi-relay',title:'翻面棋局',seed:config.defaultSeed,tagline:'夹击翻面，争取最后一片绿荫',accent:'#9bd2a3',background:C.paper,atlas,holdConfirmAsA:true,levelLabel:'残局',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['落子','无棋可下时让行'],
 description:'三道 6×6 翻面棋残局。你执白棋，在空格落子，从八个方向夹住连续绿棋即可翻面。绿棋随后自动选择翻子最多的位置。终局白棋更多才获胜；和棋需重试。',
 controls:{move:'方向键选择棋格，每按一次移一格',a:'空格、Z、确认 / 手机右上：落子',b:'X、B / 手机右下：无棋可下时让行'},
 tip:'白棋是你，绿棋是对手。数字表示合法空格，黄框是光标。浅蓝框标记绿棋上一手。B 只在白棋无合法落点时有效；长按不连动。',
 winTitle:'白棋领先，残局完成',loseTitle:'本局尚未通过',
 hud:s=>[{label:'你的白棋',value:s.counts.player,tone:'good'},{label:'对手绿棋',value:s.counts.opponent},{label:'可落位置',value:s.legalMoves.length},{label:'剩余空格',value:s.counts.empty}],
 result:s=>'白棋 '+s.counts.player+' 枚，绿棋 '+s.counts.opponent+' 枚。'+(s.phase==='won'?'成功完成残局。':s.reason==='draw'?'本局和棋，白棋领先才算通过。':'尝试守住角落和边线，再挑战一次。'),render};
})(window);
