(function(root){
'use strict';
const C={bg:'#182c3a',ink:'#f0ead6',muted:'#a4bac2',mint:'#8ed3bd',gold:'#e1b575',bad:'#e59c88',dark:'#244c5e'},config=root.PureModel.config;
const atlas={builtins:[],tiles:[
 {name:'cityBlock',x:0,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,128,128,[[0,'#f3f3e4'],[1,'#cddbd3']]);c.fillRect(1,1,126,126);c.strokeStyle='#7d9e9e';c.lineWidth=2;c.strokeRect(2,2,124,124);c.strokeStyle='#9fb9ad55';c.lineWidth=1;for(let i=20;i<120;i+=20){c.beginPath();c.moveTo(i,6);c.lineTo(i,122);c.moveTo(6,i);c.lineTo(122,i);c.stroke();}}},
 {name:'tower',x:128,y:0,w:128,h:192,paint(c,w,h,art){
  art.ellipse(c,65,179,52,10,'#24495d44');
  art.path(c,[[18,24],[86,24],[86,173],[18,173]],art.linear(c,18,0,86,0,[[0,'#c0e7dc'],[.5,'#81c7c1'],[1,'#4b9eaa']]),'#2c697b',2);
  art.path(c,[[86,24],[110,11],[110,160],[86,173]],'#35677e','#244b65',2);
  art.path(c,[[18,24],[43,10],[110,11],[86,24]],'#f3f5d8','#527b85',2);
  c.strokeStyle='#e1f7e6';c.lineWidth=3;for(const x of [30,47,64]){c.beginPath();c.moveTo(x,37);c.lineTo(x,160);c.stroke();}
  c.strokeStyle='#9ed2ce';c.lineWidth=2;c.beginPath();c.moveTo(97,31);c.lineTo(97,152);c.stroke();
  c.fillStyle='#377b89';c.fillRect(47,148,17,25);c.fillStyle='#dfe9cd';c.fillRect(19,169,67,5);
 }}]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function clue(r,s,side,i,x,y){const v=s.clues[side][i],actual=s.visibility[side][i];if(!v){r.circle(x,y+12,2,'#68848c');return;}const color=actual===null?C.ink:actual===v?C.mint:C.bad;center(r,v,x,y,27,color);}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(24,20,912,44,'#294b5b');text(r,'SKYLINE NUMBERS',43,28,29,C.ink);text(r,config.layouts[s.level].name,587,30,25,C.mint);
 const left=110,top=112,side=360,cell=side/s.size;
 r.rect(left-6,top-6,side+12,side+12,'#657f85');
 for(let i=0;i<s.size;i++){const c=left+(i+.5)*cell,y=top+(i+.5)*cell-12;clue(r,s,'top',i,c,77);clue(r,s,'bottom',i,c,485);clue(r,s,'left',i,78,y);clue(r,s,'right',i,505,y);}
 s.board.forEach((v,i)=>{const x=left+(i%s.size)*cell,y=top+Math.floor(i/s.size)*cell;
  r.sprite('cityBlock',x+cell/2,y+cell/2,cell,cell,0,s.givens[i]?'#f3dbb8':s.conflicts[i]?'#f0c0b1':'#ffffff');
  if(v){const h=8+(v/s.size)*(cell*.67);r.sprite('tower',x+cell*.31,y+cell*.88-h/2,cell*.43,h,0,s.givens[i]?'#d5b780':'#ffffff');center(r,v,x+cell*.77,y+cell*.36,cell*.46,'#21465a');}
  else{r.rect(x+cell*.14,y+cell*.77,cell*.38,3,'#98b0ae');center(r,'-',x+cell*.77,y+cell*.36,cell*.46,'#88a1a1');}
  if(s.givens[i]){r.circle(x+cell-11,y+10,5,'#aa7d43');r.circle(x+cell-11,y+10,3,'#f3dbb8');r.rect(x+cell-17,y+10,12,8,'#aa7d43');}
  if(s.conflicts[i])outline(r,x+3,y+3,cell-6,cell-6,'#b96d5b',2);
  if(i===s.cursor)outline(r,x+1,y+1,cell-2,cell-2,C.gold,4);
 });
 text(r,s.size+' x '+s.size+' CITY',552,91,30,C.ink);text(r,'HEIGHTS 1 - '+s.size,552,132,25,C.muted);
 text(r,'FILLED '+s.filled+' / '+s.board.length,552,178,27,C.mint);
 text(r,'DUPLICATES '+s.conflicts.filter(Boolean).length,552,218,25,s.conflicts.some(Boolean)?C.bad:C.muted);
 r.rect(551,260,348,2,'#54737c');text(r,'CHECKS LEFT',552,280,24,C.muted);
 for(let i=0;i<3;i++){r.circle(579+i*59,332,19,i<s.attemptsLeft?C.gold:'#36515e');if(i<s.attemptsLeft)center(r,'B',579+i*59,319,25,C.bg);}
 text(r,(Math.floor(s.cursor/s.size)+1)+' ROW / '+(s.cursor%s.size+1)+' COL',552,373,25,C.ink);
 const fixed=!!s.givens[s.cursor];text(r,fixed?'FIXED TOWER':('A: '+s.board[s.cursor]+' > '+((s.board[s.cursor]+1)%(s.size+1))),552,412,25,fixed?C.gold:C.mint);
 r.rect(551,455,348,40,'#294b5b');center(r,'B CHECK / 3 ATTEMPTS',725,464,23,C.ink);
 text(r,'HEIGHT BLOCKS THE VIEW',552,513,21,C.muted);
}
root.GameDef={id:'skyline-numbers',title:'数塔天际',seed:config.defaultSeed,tagline:'从四边看城市，让每一栋都有位置',accent:C.gold,background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'城市',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['调整楼高','验收城市'],
 description:'每行每列使用一次 1 到 N 的楼高。边缘数字表示从该方向看见的楼数，高楼挡住后方矮楼。A 循环调整 0 到 N，0 是空格；B 验收，三次机会，全部满足才通过。',
 controls:{move:'方向键选择城市格子',a:'空格、Z、确认 / 手机右上：循环楼高',b:'X、B / 手机右下：消耗一次验收'},
 tip:'铜色底座带锁的是固定楼高。重复数字会标红；边缘圆点表示没有线索。完整行列的线索符合时变绿。填好后仍须 B 验收，错误或未填完都会扣一次机会。',
 winTitle:'天际线验收通过',loseTitle:'验收机会已用完',
 hud:s=>[{label:'已填格子',value:s.filled+' / '+s.board.length},{label:'重复格子',value:s.conflicts.filter(Boolean).length},{label:'验收机会',value:s.attemptsLeft},{label:'当前楼高',value:s.board[s.cursor]||'空'}],
 result:s=>'已验收 '+s.checks+' 次。'+(s.phase==='won'?'行列数字和四边视野均符合要求。':'请同时检查行列是否重复，以及从四边能看见几栋楼。'),render};
})(window);
