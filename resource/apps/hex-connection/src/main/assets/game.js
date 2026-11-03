(function(root){
'use strict';
const C={paper:'#ede8d9',ink:'#233646',muted:'#64717a',gold:'#bb8337',goldLight:'#f2d796',blue:'#38779d',blueLight:'#c6e0ed',cursor:'#a43f6c',line:'#b9bdb7'},config=root.PureModel.config;
function hex(c,x,y,rx,ry,fill,stroke,width){c.beginPath();for(let k=0;k<6;k++){const a=-Math.PI/2+k*Math.PI/3,px=x+Math.cos(a)*rx,py=y+Math.sin(a)*ry;k?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width||2;c.stroke();}}
function stone(c,w,h,art,actor){
 const colors=actor===1?['#fff1bd','#dfb86c','#a16a2d']:['#dcecf3','#76aecb','#275c80'];
 art.ellipse(c,65,76,47,43,'#23364633');
 c.beginPath();c.arc(64,61,47,0,Math.PI*2);c.fillStyle=art.radial(c,64,61,47,[[0,colors[0]],[.65,colors[1]],[1,colors[2]]],47,39);c.fill();
 c.strokeStyle=colors[0];c.lineWidth=2;c.stroke();c.beginPath();c.arc(64,61,36,0,Math.PI*2);c.strokeStyle=actor===1?'#ba8b43':'#5485a2';c.stroke();
 c.strokeStyle=actor===1?'#674a28':'#163e5b';c.lineWidth=9;c.lineCap='round';c.beginPath();if(actor===1){c.moveTo(40,61);c.lineTo(88,61);}else{c.moveTo(64,37);c.lineTo(64,85);}c.stroke();
}
const atlas={builtins:[],tiles:[
 {name:'hexIvory',x:0,y:0,w:128,h:148,paint(c,w,h,art){hex(c,64,77,69,72,'#b6b4a4');hex(c,64,72,68,70,art.linear(c,0,0,120,140,[[0,'#fffdf3'],[1,'#d9d5c4']]),'#c2c4b8',2);hex(c,64,72,61,63,'#f1eee2','#fff9e6',1);}},
 {name:'goldStone',x:128,y:0,w:128,h:128,paint(c,w,h,art){stone(c,w,h,art,1);}},
 {name:'blueStone',x:256,y:0,w:128,h:128,paint(c,w,h,art){stone(c,w,h,art,2);}},
 {name:'seal',x:384,y:0,w:192,h:192,paint(c,w,h,art){for(let k=0;k<6;k++){const a=k*Math.PI/3;hex(c,96+Math.cos(a)*53,96+Math.sin(a)*53,26,27,'#ffffff00','#71849130',2);}hex(c,96,96,26,27,'#ffffff00','#71849140',2);}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function coord(s,c){return String.fromCharCode(65+c%s.size)+(Math.floor(c/s.size)+1);}
function layout(s){const radius=s.size===6?40:45,h=Math.sqrt(3)*radius,total=h*(1.5*s.size-.5),firstX=25+(635-total)/2+h/2,firstY=s.size===6?132:145;return {radius,h,point:c=>({x:firstX+(c%s.size)*h+Math.floor(c/s.size)*h/2,y:firstY+Math.floor(c/s.size)*radius*1.5})};}
function vertices(p,radius){return Array.from({length:6},(_,k)=>{const a=-Math.PI/2+k*Math.PI/3;return {x:p.x+Math.cos(a)*radius,y:p.y+Math.sin(a)*radius};});}
function edge(r,v,a,b,color,width){r.line(v[a].x,v[a].y,v[b].x,v[b].y,width,color);}
function render(r,s){
 r.rect(0,0,960,540,C.paper);r.sprite('seal',842,452,170,170,.1,'#ffffff');
 r.rect(24,18,912,44,C.ink);text(r,'HEX CONNECTION',42,26,28,'#fff8df');text(r,config.layouts[s.level].name,572,28,25,'#cadbe3');
 const g=layout(s),n=s.size;
 // Goal faces mark every cell on its actual coordinate edge; glyphs also identify ownership.
 for(let cell=0;cell<s.board.length;cell++){
  const p=g.point(cell),v=vertices(p,g.radius+3),x=cell%n,y=Math.floor(cell/n);
  if(x===0)edge(r,v,4,5,C.gold,8);if(x===n-1)edge(r,v,1,2,C.gold,8);
  if(y===0)edge(r,v,5,0,C.blue,8);if(y===n-1)edge(r,v,2,3,C.blue,8);
 }
 for(let cell=0;cell<s.board.length;cell++){
  const p=g.point(cell);
  r.sprite('hexIvory',p.x,p.y+1,g.h*.95,g.radius*2*.95,0,'#ffffff');
  if(s.board[cell])r.sprite(s.board[cell]===1?'goldStone':'blueStone',p.x,p.y,59,59,0,'#ffffff');
  else center(r,cell+1,p.x,p.y-12,25,'#65737d');
  if(s.winningPath.includes(cell)){const v=vertices(p,g.radius-5);for(let k=0;k<6;k++)edge(r,v,k,(k+1)%6,s.winner===1?C.gold:C.blue,3);}
  if(s.lastAiMove===cell){r.circle(p.x+18,p.y+19,5,C.ink);r.circle(p.x+18,p.y+19,2,'#fffbee');}
  if(s.lastPlayerMove===cell){r.circle(p.x-18,p.y+19,4,C.gold);}
  if(s.cursor===cell){const v=vertices(p,g.radius-2);for(let k=0;k<6;k++)edge(r,v,k,(k+1)%6,C.cursor,4);}
 }
 // Read row and column labels along two sides of the slanted board.
 for(let x=0;x<n;x++){const p=g.point(x);center(r,String.fromCharCode(65+x),p.x+10,p.y-g.radius-26,22,C.muted);}
 for(let y=0;y<n;y++){const p=g.point(y*n);center(r,y+1,p.x-g.h/2-23,p.y-12,23,C.muted);}
 r.rect(676,82,260,395,'#f8f4e7');text(r,'EDGE GOALS',691,92,23,C.ink);
 r.rect(691,132,230,64,'#e9d6ac');r.sprite('goldStone',720,163,53,53,0,'#ffffff');text(r,'YOU / GOLD',753,141,22,'#674a28');text(r,'LEFT - RIGHT',753,169,22,'#735c37');
 r.rect(691,209,230,64,'#d3e3e9');r.sprite('blueStone',720,240,53,53,0,'#ffffff');text(r,'AI / BLUE',753,218,22,'#204b65');text(r,'TOP - BOTTOM',753,246,22,'#416879');
 const summary='EMPTY '+s.counts.empty+' / TURN '+(s.playerMoves+(s.phase==='playing'?1:0));
 text(r,summary,691,292,Math.min(23,230/r.measureText(summary,1)),C.ink);
 text(r,'CURSOR '+coord(s,s.cursor)+' / #'+(s.cursor+1),691,333,25,C.cursor);
 text(r,'LAST AI '+(s.lastAiMove===null?'--':coord(s,s.lastAiMove)),691,371,25,C.blue);
 r.rect(691,415,230,44,C.ink);center(r,s.phase==='playing'?'A PLACE STONE':s.phase==='won'?'LEFT / RIGHT LINKED':'TOP / BOTTOM LINKED',806,427,22,'#fff8df');
 text(r,'ARROWS: ROW / COLUMN',30,505,23,C.muted);text(r,'6 NEIGHBOURS / NO UNDO',464,505,23,C.ink);
}
root.GameDef={id:'hex-connection',title:'六角连线',seed:config.defaultSeed,tagline:'横线穿过六角格，接通左右两岸',accent:'#dcba73',background:C.paper,atlas,holdConfirmAsA:true,levelLabel:'残局',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['落子'],
 description:'三道公开六角棋残局。你执金色横线棋，连通左边与右边；蓝色竖线对手连通上边与下边。六角格有六个相邻方向，棋子落下后不能移动。对手每次自动应手，先连通的一方获胜。',
 controls:{move:'方向键按棋盘行列选择格子，每按一次移动一格',a:'空格、Z、确认 / 手机整个右侧：落子',b:'未使用'},
 tip:'横线棋连接左右，竖线棋连接上下；颜色之外也可用棋子刻线辨认。数字是空格编号，紫红边框是光标。A 落在空格；长按不连下，没有撤回。',
 winTitle:'左右两岸，连线成功',loseTitle:'蓝棋先连通上下',
 hud:s=>[{label:'目标',value:'横线连左右',tone:'good'},{label:'剩余空格',value:s.counts.empty},{label:'你已落子',value:s.playerMoves},{label:'对手已落子',value:s.aiMoves}],
 result:s=>s.phase==='won'?'金色横线棋完成左右连通，共落子 '+s.playerMoves+' 次。':'蓝色竖线棋先接通上下两岸。重试并观察对手的连通威胁。',render};
})(window);
