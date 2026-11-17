(function(root){
'use strict';
const C={bg:'#e9e7d6',ink:'#254b40',muted:'#637c6c',green:'#497d61',free:'#3d966c',gold:'#c39332',cursor:'#a34478',blue:'#447c9c'},config=root.PureModel.config;
function rounded(c,x,y,w,h,r,fill,stroke,width){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width||2;c.stroke();}}
function family(c,n,art){
 const colors=['#497e63','#3e6e8a','#9a6251','#776093','#3f7f7c','#8a713e','#627a48'];c.fillStyle=colors[n-1];c.strokeStyle=colors[n-1];c.lineWidth=8;
 if(n===1){c.beginPath();c.arc(48,48,25,0,Math.PI*2);c.stroke();art.ellipse(c,48,48,7,7,colors[0]);}
 else if(n===2){c.strokeRect(25,25,46,46);c.fillRect(40,40,16,16);}
 else if(n===3){art.path(c,[[48,18],[78,72],[18,72]],colors[2]);art.path(c,[[48,36],[60,59],[36,59]],'#fff8df');}
 else if(n===4){art.path(c,[[48,12],[80,48],[48,84],[16,48]],colors[3]);art.path(c,[[48,34],[61,48],[48,62],[35,48]],'#fff8df');}
 else if(n===5){c.fillRect(37,16,22,64);c.fillRect(16,37,64,22);}
 else if(n===6){art.path(c,[[30,17],[66,17],[84,48],[66,79],[30,79],[12,48]],colors[5]);art.ellipse(c,48,48,13,13,'#fff8df');}
 else{c.beginPath();c.moveTo(25,76);c.bezierCurveTo(13,39,35,16,76,20);c.bezierCurveTo(84,62,64,80,25,76);c.fill();c.strokeStyle='#fff8df';c.lineWidth=5;c.beginPath();c.moveTo(30,70);c.lineTo(65,30);c.stroke();}
}
const atlas={builtins:[],tiles:[
 {name:'gardenTile',x:0,y:0,w:128,h:144,paint(c,w,h,art){rounded(c,6,10,116,130,14,'#9da88d');rounded(c,6,4,116,126,14,art.linear(c,0,0,0,132,[[0,'#fffceb'],[1,'#dedcc1']]),'#718c73',3);rounded(c,13,11,102,110,10,'#f8f2da','#e3d8b2',2);}},
 ...Array.from({length:7},(_,i)=>({name:'family'+(i+1),x:128+i*96,y:0,w:96,h:96,paint(c,w,h,art){family(c,i+1,art);}})),
 {name:'gardenLeaf',x:0,y:160,w:128,h:192,paint(c,w,h,art){c.strokeStyle='#6d90682d';c.lineWidth=5;c.beginPath();c.moveTo(63,185);c.bezierCurveTo(41,122,55,70,78,10);c.stroke();for(let i=0;i<7;i++){const x=73-i*2,y=32+i*22;art.path(c,[[x,y],[x-37,y-14],[x-29,y+9]],'#6d90682b');art.path(c,[[x,y+7],[x+35,y-8],[x+23,y+18]],'#4a7e5c29');}}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function fitCenter(r,t,x,y,width,size,color){center(r,t,x,y,Math.min(size,width/r.measureText(String(t),1)),color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function geometry(s,layer){const single=s.layerCount===1,panelX=single?30:layer?510:30,panelW=single?520:420,cell=single?78:s.width===6?58:64;return {panelX,panelW,cell,left:panelX+(panelW-s.width*cell)/2,top:157};}
function roof(r,x,y){r.line(x-6,y+2,x,y-3,2,C.blue);r.line(x,y-3,x+6,y+2,2,C.blue);r.line(x-7,y+5,x+7,y+5,2,C.blue);}
function drawTile(r,t,cx,cy,size,free,covered){
 r.sprite('gardenTile',cx,cy,size-4,size-2,0,'#ffffff');
 r.sprite('family'+t.family,cx-12,cy-1,size*.45,size*.45,0,'#ffffff');center(r,t.family,cx+13,cy-13,26,C.ink);
 if(free)r.circle(cx-size/2+11,cy+size/2-11,3,C.free);
 else if(covered)roof(r,cx,cy-size/2+9);
 else{r.rect(cx-size/2+6,cy-8,2,16,'#a69778');r.rect(cx+size/2-8,cy-8,2,16,'#a69778');}
}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.sprite('gardenLeaf',925,465,110,165,0,'#ffffff');r.rect(24,18,912,44,C.ink);text(r,'TILE GARDEN',42,26,28,'#fff9dc');text(r,config.layouts[s.level].name,605,29,25,'#c9ddbb');
 for(let layer=0;layer<s.layerCount;layer++){
  const g=geometry(s,layer),active=s.layerCursor===layer;
  r.rect(g.panelX,83,g.panelW,321,'#f5f2df');r.rect(g.panelX,83,g.panelW,35,active?C.green:'#a8b6a0');
  center(r,(layer===0?'LOWER / L1':'UPPER / L2')+(active?'  < ACTIVE':''),g.panelX+g.panelW/2,90,24,active?'#fff9dc':C.ink);
  for(let x=0;x<s.width;x++)center(r,String.fromCharCode(65+x),g.left+x*g.cell+g.cell/2,126,22,C.muted);
  for(let y=0;y<s.height;y++)center(r,y+1,g.left-18,g.top+y*g.cell+g.cell/2-12,23,C.muted);
  for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
   const cx=g.left+(x+.5)*g.cell,cy=g.top+(y+.5)*g.cell,t=s.tiles.find(t=>!t.removed&&t.layer===layer&&t.x===x&&t.y===y);
   outline(r,cx-g.cell/2+3,cy-g.cell/2+3,g.cell-6,g.cell-6,'#d9decb',1);r.circle(cx,cy,2,'#9aad9644');
   if(t){const covered=s.tiles.some(u=>!u.removed&&u.layer>layer&&u.x===x&&u.y===y);drawTile(r,t,cx,cy,g.cell,s.freeTiles.includes(t.id),covered);if(s.selected===t.id)outline(r,cx-g.cell/2+2,cy-g.cell/2+2,g.cell-4,g.cell-4,C.gold,4);}
   if(active&&s.cursor===y*s.width+x)outline(r,cx-g.cell/2,cy-g.cell/2,g.cell,g.cell,C.cursor,3);
  }
 }
 if(s.layerCount===1){
  r.rect(578,83,358,321,'#f5f2df');center(r,'FREE TILE RULES',757,102,27,C.ink);r.sprite('gardenLeaf',875,303,110,165,0,'#ffffff');
  text(r,'NO TILE ABOVE',601,157,26,C.green);text(r,'ONE SIDE OPEN',601,201,26,C.green);text(r,'MATCH FAMILY DIGITS',601,258,24,C.ink);text(r,'ORDER MATTERS',601,301,25,C.gold);text(r,'A PAIR / SAME A CANCEL',601,352,21,C.muted);
 }
 r.rect(24,417,912,72,C.ink);
 const counters=['TILES '+s.remaining,'PAIRS '+s.pairsRemoved+'/'+(s.tiles.length/2),'MISSES '+s.mistakes+'/3','LAYER '+(s.layerCursor+1)+'/'+s.layerCount];
 counters.forEach((t,i)=>fitCenter(r,t,138+i*228,428,210,25,'#fff9dc'));
 const selected=s.selected===null?null:s.tiles[s.selected],label=selected?'PICKED F'+selected.family+' / L'+(selected.layer+1)+' / '+String.fromCharCode(65+selected.x)+(selected.y+1):'PICKED --';
 text(r,label,43,461,23,selected?'#f3d481':'#c9ddbb');fitCenter(r,'B SWITCH LAYER / A PAIR',733,461,380,23,'#c9ddbb');
 fitCenter(r,'DOT = FREE / ROOF = COVERED',255,505,440,22,C.muted);fitCenter(r,'OPEN SIDE + NO TOP TILE',725,505,425,22,C.ink);
}
root.GameDef={id:'tile-garden',title:'叠牌花园',seed:config.defaultSeed,tagline:'看清上下层，成对收齐花牌',accent:'#cba85a',background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'花园',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['选择 / 配对','切换层'],
 description:'所有花牌都公开显示，上下层分面板按同一坐标对齐。一张牌仅在上方同坐标没有牌、且本层左右至少一侧没有紧邻牌时可用。A 选两张同族牌移除；相同数字和图形代表同族。错误配对三次或剩牌无可用同族对时结束。',
 controls:{move:'方向键移动当前层格子光标',a:'空格、Z、确认 / 手机右上：选牌或配对，再选同牌取消',b:'X、B / 手机右下：切换层，保留坐标和第一张选择'},
 tip:'紫框是光标，金框是第一张选择。小绿点表示可用，屋顶记号表示同坐标上层覆盖。两侧都贴牌也不能选。牌面全部可见；同族有四张，配对顺序会影响能否清空。没有撤回。',
 winTitle:'花牌收齐，庭园清朗',loseTitle:'花园尚未清空',
 hud:s=>[{label:'剩余花牌',value:s.remaining},{label:'已配对',value:s.pairsRemoved},{label:'错配',value:s.mistakes+' / 3',tone:s.mistakes<2?'good':'warn'},{label:'当前层',value:(s.layerCursor+1)+' / '+s.layerCount}],
 result:s=>s.phase==='won'?'已移除全部 '+s.tiles.length+' 张花牌，共配成 '+s.pairsRemoved+' 对。':s.reason==='deadlock'?'剩余 '+s.remaining+' 张牌，但没有可用的同族配对。尝试不同顺序。':'已经错配三次；比较数字和图形，再挑战一次。',render};
})(window);
