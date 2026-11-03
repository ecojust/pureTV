(function(root){
'use strict';
const C={bg:'#e8e5d4',ink:'#264550',muted:'#657e85',blue:'#4587a0',gold:'#b68a38',bad:'#a45253',cursor:'#a03f76'},config=root.PureModel.config;
const atlas={builtins:[],tiles:[
 {name:'seaPaper',x:0,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,128,128,[[0,'#f8f8e9'],[1,'#d8e6df']]);c.fillRect(0,0,w,h);c.strokeStyle='#8daeb0';c.lineWidth=2;c.strokeRect(1,1,126,126);c.strokeStyle='#ffffff55';c.strokeRect(5,5,118,118);}},
 {name:'shipMark',x:128,y:0,w:128,h:128,paint(c,w,h,art){art.path(c,[[25,17],[103,17],[112,104],[16,104]],'#2c4c5b','#8cabb3',4);c.fillStyle='#426979';c.fillRect(32,25,64,71);c.strokeStyle='#c7dcdd';c.lineWidth=3;c.strokeRect(47,39,34,38);art.ellipse(c,64,58,8,8,'#dae6da');c.strokeStyle='#183e4f';c.lineWidth=3;c.beginPath();c.moveTo(29,94);c.lineTo(99,94);c.stroke();}},
 {name:'seaMark',x:256,y:0,w:128,h:128,paint(c){c.strokeStyle='#427c94';c.lineWidth=9;c.lineCap='round';for(const y of [43,78]){c.beginPath();c.moveTo(19,y);c.bezierCurveTo(30,y-13,38,y-13,49,y);c.bezierCurveTo(60,y+13,68,y+13,79,y);c.bezierCurveTo(90,y-13,98,y-13,109,y);c.stroke();}}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function fit(r,t,x,y,width,size,color){text(r,t,x,y,Math.min(size,width/r.measureText(String(t),1)),color);}
function fitCenter(r,t,x,y,width,size,color){center(r,t,x,y,Math.min(size,width/r.measureText(String(t),1)),color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function lock(r,x,y){r.rect(x-4,y,8,7,C.gold);r.line(x-3,y,x-3,y-4,2,C.gold);r.line(x-3,y-4,x+3,y-4,2,C.gold);r.line(x+3,y-4,x+3,y,2,C.gold);r.circle(x,y+3,1.1,'#f9f2d6');}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(24,18,912,44,C.ink);text(r,'FLEET LEDGER',42,26,28,'#fff7dc');fit(r,config.layouts[s.level].name,601,29,318,25,'#c2dce0');
 const n=s.size,cell=n===5?64:n===6?55:48,left=92+(336-n*cell)/2,top=128+(336-n*cell)/2,point=c=>({x:left+(c%n+.5)*cell,y:top+(Math.floor(c/n)+.5)*cell});
 r.rect(left-7,top-7,n*cell+14,n*cell+14,'#849f9f');
 for(let x=0;x<n;x++){const cx=left+(x+.5)*cell;center(r,String.fromCharCode(65+x),cx,70,22,C.muted);fitCenter(r,s.colCounts[x]+'/'+s.cols[x],cx,99,cell-4,23,s.colCounts[x]>s.cols[x]?C.bad:s.colCounts[x]===s.cols[x]?C.blue:C.ink);}
 for(let y=0;y<n;y++){const cy=top+(y+.5)*cell;center(r,y+1,left-22,cy-12,23,C.muted);fitCenter(r,s.rowCounts[y]+'/'+s.rows[y],left+n*cell+42,cy-12,70,25,s.rowCounts[y]>s.rows[y]?C.bad:s.rowCounts[y]===s.rows[y]?C.blue:C.ink);}
 for(let c=0;c<n*n;c++){const p=point(c);r.sprite('seaPaper',p.x,p.y,cell,cell,0,'#ffffff');}
 // Adjacent ship squares form a single visible component, exactly as in validation.
 for(let c=0;c<n*n;c++)if(s.marks[c]===1){const p=point(c);if(c%n<n-1&&s.marks[c+1]===1){const q=point(c+1);r.line(p.x,p.y,q.x,q.y,cell*.42,'#345769');}if(c+n<n*n&&s.marks[c+n]===1){const q=point(c+n);r.line(p.x,p.y,q.x,q.y,cell*.42,'#345769');}}
 for(let c=0;c<n*n;c++){
  const p=point(c),value=s.marks[c];if(value===1)r.sprite('shipMark',p.x,p.y,cell*.8,cell*.8,0,'#ffffff');else if(value===2)r.sprite('seaMark',p.x,p.y,cell*.7,cell*.7,0,'#ffffff');else center(r,'?',p.x,p.y-14,28,'#8ba3a1');
  if(s.givens[c]){lock(r,p.x+cell/2-10,p.y-cell/2+9);outline(r,p.x-cell/2+3,p.y-cell/2+3,cell-6,cell-6,'#b9944855',1);}
  if(s.cursor===c)outline(r,p.x-cell/2+1,p.y-cell/2+1,cell-2,cell-2,C.cursor,3);
 }
 fitCenter(r,'ROW / COL: CURRENT / TARGET',289,477,470,21,C.muted);
 r.rect(540,84,396,401,'#f7f2df');text(r,'FLEET LENGTHS',560,99,25,C.muted);fit(r,s.fleet.join('  /  '),560,136,356,31,C.ink);lock(r,568,181);text(r,'LOCK = FIXED CLUE',588,171,23,C.gold);
 fit(r,'UNKNOWN '+s.unknown,560,207,356,27,C.ink);fit(r,'SHIP CELLS '+s.shipCells+' / '+s.fleet.reduce((a,b)=>a+b,0),560,244,356,25,C.blue);fit(r,'CHECKS LEFT '+s.attemptsLeft+' / 3',560,280,356,25,C.ink);
 r.rect(560,318,356,2,'#bdc9b8');const heading=s.lastCheck?(s.lastCheckCurrent?(s.lastCheck.charged?'LAST COMPLETE CHECK':'LAST FREE HINT'):'OLD CHECK / EDITED'):'B CHECK WHEN FILLED';fit(r,heading,560,334,356,22,C.muted);
 const labels=['ROWS','COLS','LINE','GAP','FLEET','FULL'],keys=['rowsExact','colsExact','straight','noTouch','fleetExact','complete'];
 labels.forEach((label,i)=>{const x=614+i%3*119,y=i<3?370:426;center(r,label,x,y,21,C.muted);const v=s.lastCheck?s.lastCheck[keys[i]]:null;center(r,v===null?'--':v?'OK':'FAIL',x,y+22,24,v===null?C.ink:v?C.blue:C.bad);});
 fit(r,'A ? > SHIP > SEA',30,505,450,24,C.ink);fit(r,'B CHECK / UNFILLED FREE',535,505,399,23,C.muted);
}
root.GameDef={id:'fleet-ledger',title:'舰队账册',seed:config.defaultSeed,tagline:'核对行列数字，找出相互隔开的舰队',accent:'#c6a35c',background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'海图',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['未知 / 船 / 海','检查海图'],
 description:'根据每行每列的船格总数、舰长清单和少量固定船海格填完海图。每艘船须为正交连续的直线；不同船不能左右上下或斜角相邻。问号格都要标成船或海，完整图才消耗一次检查机会。',
 controls:{move:'方向键选择格子；固定线索可查看但不能修改',a:'空格、Z、确认 / 手机右上：未知→船→海→未知',b:'X、B / 手机右下：检查；有未知格免费提示，完整图扣一次'},
 tip:'方形船标与波浪海标区分状态，锁形角标表示固定线索。外侧数字是当前船格数/目标数，0也有效。相邻船格会并成一艘；船长清单必须逐艘完全吻合。完整检查有三次机会。',
 winTitle:'账目吻合，舰队归档',loseTitle:'完整检查机会已用完',
 hud:s=>[{label:'未知格',value:s.unknown},{label:'船格',value:s.shipCells},{label:'检查机会',value:s.attemptsLeft+' / 3'},{label:'固定线索',value:s.givens.filter(Boolean).length}],
 result:s=>s.phase==='won'?'全部行列总数正确，舰队长度 '+s.fleet.join('、')+' 完整匹配且船间隔离。':'三次完整检查已用完。重新核对行列总数、直线船形、斜角接触和舰长清单。',render};
})(window);
