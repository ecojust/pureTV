(function(root){
'use strict';
const C={bg:'#e6e5d5',ink:'#263e4a',muted:'#657b80',gold:'#d7a641',beam:'#e1b847',blue:'#397a92',bad:'#af4e4d',cursor:'#a43c75'},config=root.PureModel.config;
const atlas={builtins:[],tiles:[
 {name:'floor',x:0,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,128,128,[[0,'#fffdf0'],[1,'#d5dcd1']]);c.fillRect(0,0,w,h);c.strokeStyle='#a5b7ad';c.lineWidth=3;c.strokeRect(2,2,124,124);c.strokeStyle='#fff8e4';c.lineWidth=2;c.strokeRect(6,6,116,116);}},
 {name:'wall',x:128,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,128,128,[[0,'#3d5962'],[1,'#1e3541']]);c.fillRect(0,0,w,h);c.strokeStyle='#627c7e';c.lineWidth=3;c.strokeRect(3,3,122,122);c.strokeStyle='#93aa9c16';c.lineWidth=2;for(let y=14;y<126;y+=22){c.beginPath();c.moveTo(8,y);c.lineTo(120,y);c.stroke();}}},
 {name:'bulb',x:256,y:0,w:128,h:160,paint(c,w,h,art){art.ellipse(c,64,63,47,50,'#d4a33822');art.ellipse(c,64,59,36,38,art.radial(c,64,59,38,[[0,'#fffde9'],[.7,'#ffe291'],[1,'#d1a344']],51,43));c.fillStyle='#e9c77f';c.fillRect(43,84,42,26);c.strokeStyle='#997a43';c.lineWidth=4;c.beginPath();c.moveTo(51,99);c.lineTo(48,64);c.lineTo(64,75);c.lineTo(80,64);c.lineTo(77,99);c.stroke();c.fillStyle='#456575';c.fillRect(43,109,42,24);c.strokeStyle='#a0bcc1';c.lineWidth=3;for(let y=113;y<133;y+=7){c.beginPath();c.moveTo(45,y);c.lineTo(83,y);c.stroke();}art.ellipse(c,64,137,13,5,'#294654');}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function fitted(r,t,x,y,width,size,color){text(r,t,x,y,Math.min(size,width/r.measureText(String(t),1)),color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(24,18,912,44,C.ink);text(r,'LIGHT CHAMBERS',42,26,28,'#fff9dc');text(r,config.layouts[s.level].name,608,29,25,'#c3dde0');
 const n=s.size,cell=n===5?72:n===6?62:54,left=74+(392-n*cell)/2,top=96+(392-n*cell)/2,point=c=>({x:left+(c%n+.5)*cell,y:top+(Math.floor(c/n)+.5)*cell});
 r.rect(left-7,top-7,n*cell+14,n*cell+14,'#839992');
 for(let x=0;x<n;x++)center(r,String.fromCharCode(65+x),left+(x+.5)*cell,top-31,23,C.muted);for(let y=0;y<n;y++)center(r,y+1,left-22,top+(y+.5)*cell-12,23,C.muted);
 for(let c=0;c<n*n;c++){const p=point(c);r.sprite(s.walls[c]===null?'floor':'wall',p.x,p.y,cell,cell,0,'#ffffff');if(s.walls[c]===null&&s.lit[c])r.rect(p.x-cell/2+3,p.y-cell/2+3,cell-6,cell-6,'#ffe39366');}
 // Beams follow actual wall-bounded rays and are painted underneath lamp/exclusion symbols.
 for(let c=0;c<n*n;c++)if(s.walls[c]===null&&s.marks[c]===1){const p=point(c);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){let x=c%n+dx,y=Math.floor(c/n)+dy,last=c;while(x>=0&&x<n&&y>=0&&y<n&&s.walls[y*n+x]===null){last=y*n+x;x+=dx;y+=dy;}const end=point(last);r.line(p.x,p.y,end.x,end.y,4,'#d6ac4288');}}
 for(let c=0;c<n*n;c++){
  const p=point(c),wall=s.walls[c];
  if(wall!==null){if(wall>=0){center(r,wall,p.x,p.y-16,32,'#f4ead1');const count=s.wallCounts[c],x=p.x+cell/2-13,y=p.y+cell/2-13;if(count===wall){r.line(x-5,y,x-1,y+4,2,'#c4dfb6');r.line(x-1,y+4,x+6,y-5,2,'#c4dfb6');}else if(count>wall)center(r,'!',x,y-10,21,'#ffc194');else r.line(x-4,y,x+4,y,2,'#9eb5b3');}continue;}
  if(s.marks[c]===1){r.sprite('bulb',p.x,p.y-1,cell*.64,cell*.8,0,'#ffffff');if(s.conflicts.includes(c)){outline(r,p.x-cell/2+5,p.y-cell/2+5,cell-10,cell-10,C.bad,2);center(r,'!',p.x+cell/2-13,p.y-cell/2+7,23,C.bad);}}
  else if(s.marks[c]===2){r.line(p.x-10,p.y-10,p.x+10,p.y+10,3,'#426476');r.line(p.x+10,p.y-10,p.x-10,p.y+10,3,'#426476');}
  if(s.cursor===c)outline(r,p.x-cell/2+1,p.y-cell/2+1,cell-2,cell-2,C.cursor,3);
 }
 r.rect(540,84,396,398,'#f7f2df');text(r,'LIGHT COVERAGE',560,99,25,C.muted);text(r,s.counts.litWhite+' / '+s.counts.totalWhite,560,136,45,C.ink);
 fitted(r,'CLASHING LAMPS '+s.counts.conflictingBulbs,560,200,356,25,s.counts.conflictingBulbs?C.bad:C.blue);
 fitted(r,'NUMBERED WALLS '+s.counts.matchedWalls+'/'+s.counts.numberedWalls,560,242,356,25,C.ink);
 fitted(r,'CHECKS LEFT '+s.attemptsLeft+' / 3',560,282,356,25,C.ink);
 r.rect(560,323,356,2,'#bcc9b9');const name=['EMPTY','LAMP','EXCLUDE'][s.marks[s.cursor]];
 fitted(r,'CELL '+String.fromCharCode(65+s.cursor%n)+(Math.floor(s.cursor/n)+1)+' / '+name,560,339,356,24,C.cursor);
 fitted(r,s.lastCheck?(s.lastCheckCurrent?'LAST CHECK':'OLD CHECK / EDITED'):'NOT CHECKED YET',560,380,356,23,C.muted);
 const labels=['LIGHT','SIGHT','WALL'],values=s.lastCheck?[s.lastCheck.allLit,s.lastCheck.noConflicts,s.lastCheck.wallsExact]:null;
 labels.forEach((label,i)=>{center(r,label,614+i*119,417,22,C.muted);center(r,values?(values[i]?'OK':'FAIL'):'--',614+i*119,448,25,values?(values[i]?C.blue:C.bad):C.ink);});
 fitted(r,'A EMPTY > LAMP > X',30,505,451,24,C.ink);fitted(r,'B CHECK / 3 ATTEMPTS',535,505,397,23,C.muted);
}
root.GameDef={id:'light-chambers',title:'光室布灯',seed:config.defaultSeed,tagline:'照亮每一格，让灯光与数字相合',accent:'#d9b056',background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'光室',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['空 / 灯 / 排除','检查布灯'],
 description:'在白格放灯，沿上下左右直线照亮直到黑墙。全部白格都须受照，两盏灯不能在无遮挡的同一直线上互见，编号墙上下左右紧邻的灯数须恰好等于数字。排除符号只作笔记，不挡光。B 手动检查，每局三次机会。',
 controls:{move:'方向键移动到同一方向最近白格，自动跳过墙格',a:'空格、Z、确认 / 手机右上：空格→灯→排除→空格',b:'X、B / 手机右下：消耗一次机会检查，空图也计一次'},
 tip:'灯泡图形是灯，X是排除，紫框是光标。细光束在墙前停止；互见灯有感叹号。编号墙角的勾表示数量已匹配，感叹号表示过多。填完不会自动结束，请按B检查。',
 winTitle:'光室通明，约束齐备',loseTitle:'检查机会已用完',
 hud:s=>[{label:'受照白格',value:s.counts.litWhite+' / '+s.counts.totalWhite},{label:'灯数',value:s.counts.bulbs},{label:'互见灯',value:s.counts.conflictingBulbs,tone:s.conflicts.length?'warn':'good'},{label:'检查机会',value:s.attemptsLeft+' / 3'}],
 result:s=>s.phase==='won'?'全部 '+s.counts.totalWhite+' 格已受照，'+s.counts.bulbs+' 盏灯互不照见，编号墙全部匹配。':'三次检查已用完。检查未受照格、互见灯和编号墙邻灯数后重试。',render};
})(window);
