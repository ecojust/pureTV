(function(root){
'use strict';
const C={bg:'#e7e4d4',ink:'#263d4e',muted:'#617987',gold:'#c99439',blue:'#377899',white:'#fff9e2',cursor:'#a23f72'},config=root.PureModel.config;
function rounded(c,x,y,w,h,r,fill,stroke,width){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width||2;c.stroke();}}
function disc(c,art,actor){art.ellipse(c,65,75,49,45,'#11283955');const light=actor===1?'#fffdf0':'#b5e1e6',middle=actor===1?'#e8dfbd':'#5c9cbb',dark=actor===1?'#b3b39c':'#235773';art.ellipse(c,64,62,47,47,art.radial(c,64,62,47,[[0,light],[.67,middle],[1,dark]],45,38));c.strokeStyle=actor===1?'#a69d77':'#163f5c';c.lineWidth=3;if(actor===1){c.beginPath();c.arc(64,61,15,0,Math.PI*2);c.stroke();}else{art.path(c,[[64,40],[84,61],[64,82],[44,61]],'#275f7c','#c0e0e5',2);}}
function rotation(c,dir){const cx=64,cy=64,rad=39,start=dir===1?-2.6:-.54,end=dir===1?2.6:-5.74;c.strokeStyle='#d8ab55';c.lineWidth=10;c.lineCap='round';c.beginPath();c.arc(cx,cy,rad,start,end,dir!==1);c.stroke();const x=cx+Math.cos(end)*rad,y=cy+Math.sin(end)*rad,dx=-Math.sin(end)*dir,dy=Math.cos(end)*dir;c.fillStyle='#d8ab55';c.beginPath();c.moveTo(x+dx*12,y+dy*12);c.lineTo(x-dx*10-dy*12,y-dy*10+dx*12);c.lineTo(x-dx*10+dy*12,y-dy*10-dx*12);c.closePath();c.fill();}
const atlas={builtins:[],tiles:[
 {name:'turntable',x:0,y:0,w:256,h:256,paint(c,w,h,art){rounded(c,3,8,250,246,22,'#82908c');rounded(c,3,3,250,246,22,art.linear(c,0,0,256,256,[[0,'#f5efd6'],[1,'#bfc8b6']]),'#647e7c',3);for(let y=0;y<3;y++)for(let x=0;x<3;x++){const cx=44+x*84,cy=42+y*84;art.ellipse(c,cx,cy,31,31,'#879d9733');c.strokeStyle='#f9f2d9';c.lineWidth=2;c.beginPath();c.arc(cx,cy,29,0,Math.PI*2);c.stroke();}}},
 {name:'whiteStone',x:256,y:0,w:128,h:128,paint(c,w,h,art){disc(c,art,1);}},
 {name:'blueStone',x:384,y:0,w:128,h:128,paint(c,w,h,art){disc(c,art,2);}},
 {name:'cwArrow',x:512,y:0,w:128,h:128,paint(c){rotation(c,1);}},
 {name:'ccwArrow',x:640,y:0,w:128,h:128,paint(c){rotation(c,-1);}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function fitted(r,t,x,y,width,size,color){text(r,t,x,y,Math.min(size,width/r.measureText(String(t),1)),color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function point(cell){const x=cell%6,y=Math.floor(cell/6);return {x:70+x*60+Math.floor(x/3)*18+30,y:100+y*60+Math.floor(y/3)*18+30};}
function coord(cell){return String.fromCharCode(65+cell%6)+(Math.floor(cell/6)+1);}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(24,18,912,44,C.ink);text(r,'QUADRANT FIVE',42,26,28,C.white);text(r,config.layouts[s.level].name,601,29,25,'#c2dce0');
 for(let q=0;q<4;q++){const x=70+q%2*198,y=100+Math.floor(q/2)*198;r.sprite('turntable',x+90,y+90,180,180,0,'#ffffff');if(s.turnPhase==='rotate'&&s.quadrantCursor===q)outline(r,x-5,y-5,190,190,C.gold,5);center(r,q+1,x-10,y-20,22,C.muted);}
 for(let x=0;x<6;x++)center(r,String.fromCharCode(65+x),point(x).x,68,23,C.muted);
 for(let y=0;y<6;y++)center(r,y+1,43,point(y*6).y-12,23,C.muted);
 for(let cell=0;cell<36;cell++){
  const p=point(cell),actor=s.board[cell];if(actor)r.sprite(actor===1?'whiteStone':'blueStone',p.x,p.y,58,58,0,'#ffffff');else center(r,cell+1,p.x,p.y-12,23,'#6b8187');
  if(s.lastAiCell===cell){r.circle(p.x+16,p.y-17,5,'#193747');r.circle(p.x+16,p.y-17,2,C.white);}
  if(s.lastPlayerCell===cell)r.circle(p.x-16,p.y+16,4,C.gold);
  if(s.turnPhase==='place'&&s.cursor===cell)outline(r,p.x-27,p.y-27,54,54,C.cursor,3);
 }
 for(const line of s.winningLines){const a=point(line.cells[0]),b=point(line.cells[line.cells.length-1]);r.line(a.x,a.y,b.x,b.y,3,line.actor===1?'#bf8732':'#205370');}
 r.rect(548,84,388,395,'#f7f1df');const rotate=s.turnPhase==='rotate';
 fitted(r,s.phase==='playing'?(rotate?'2 / ROTATE A QUADRANT':'1 / PLACE WHITE'):(s.phase==='won'?'WHITE CONNECTS FIVE':'ROUND COMPLETE'),568,98,348,29,C.ink);
 fitted(r,rotate?'ARROWS SELECT QUADRANT':'ARROWS SELECT EMPTY CELL',568,143,348,23,C.muted);
 fitted(r,rotate?'B FLIP DIRECTION / A CONFIRM':'A PLACE, THEN ROTATE',568,178,348,23,rotate?C.gold:C.blue);
 for(let q=0;q<4;q++){const x=574+q%2*76,y=230+Math.floor(q/2)*66,selected=rotate&&s.quadrantCursor===q;r.rect(x,y,64,54,selected?'#dfb76a':'#d5dfd4');outline(r,x,y,64,54,selected?C.gold:'#a3b9b2',2);center(r,'Q'+(q+1),x+32,y+13,27,C.ink);}
 r.sprite(s.rotationDirection===1?'cwArrow':'ccwArrow',823,270,86,86,0,'#ffffff');center(r,s.rotationDirection===1?'CW':'CCW',823,320,27,C.gold);
 r.rect(568,365,348,2,'#bdc9b8');fitted(r,'LAST AI '+(s.lastAiTurn?'Q'+(s.lastAiTurn.quadrant+1)+' '+(s.lastAiTurn.direction===1?'CW':'CCW'):'--'),568,383,348,25,C.blue);
 fitted(r,'AI STONE '+(s.lastAiCell===null?'--':coord(s.lastAiCell)),568,426,348,25,C.muted);
 text(r,'FIVE AFTER ROTATION',29,505,24,C.ink);fitted(r,'BOTH FIVE = TIE / RETRY',544,505,389,23,C.muted);
}
root.GameDef={id:'quadrant-five',title:'旋盘五子',seed:config.defaultSeed,tagline:'先落子，再旋盘；五子连线才定局',accent:'#d9b063',background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'残局',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['落子 / 确认旋转','切换旋转方向'],
 description:'6×6棋盘由四个3×3棋区组成。你执白棋：先在空格落子，再强制旋转任意棋区90度，之后才检查横、竖或斜线的五枚连续同色棋。蓝棋自动完成同样的完整回合。双方同时连五或满盘无人连五为和棋，需要重试。',
 controls:{move:'落子阶段选棋格；旋转阶段选择2×2分布的棋区',a:'空格、Z、确认 / 手机右上：落子，或确认当前棋区旋转',b:'X、B / 手机右下：旋转阶段切换顺时针CW / 逆时针CCW'},
 tip:'紫框选落点，金框选旋转棋区。A落子后必须松开再确认旋转，不能跳过。白棋刻圆环，蓝棋刻菱形；黑白小点标记蓝棋最新棋子。暂停或输入取消会保留未完成的旋转阶段。',
 winTitle:'旋盘之后，白棋连五',loseTitle:'本局尚未通过',
 hud:s=>[{label:'当前阶段',value:s.turnPhase==='place'?'1 落子':'2 旋转',tone:'good'},{label:'你的完整回合',value:s.playerTurns},{label:'对手完整回合',value:s.aiTurns},{label:'剩余空格',value:s.counts.empty}],
 result:s=>s.phase==='won'?'白棋在第 '+s.playerTurns+' 个完整回合后形成连五。':s.reason==='simultaneous'?'双方同时连五，和棋不算通过。试试不同的落点或转向。':s.reason==='draw'?'棋盘已满，双方均未连五。调整旋转顺序后重试。':'蓝棋先形成连五；同时考虑落子和棋区旋转的影响。',render};
})(window);
