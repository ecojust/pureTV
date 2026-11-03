(function(root){
'use strict';
const C={bg:'#e5e8de',ink:'#203d42',muted:'#617674',paper:'#faf7e7',black:'#27484b',gold:'#ae813a',bad:'#a54d53',cursor:'#bd4a75'},tints=['#f2eed7','#dde9dc','#e7e0ef','#dce9ed','#f1e1d8','#e7e8ce'],config=root.PureModel.config;
const atlas={builtins:[],tiles:[
 {name:'islandStone',x:0,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,128,128,[[0,'#456365'],[1,'#213d42']]);c.fillRect(4,4,120,120);c.strokeStyle='#8aa19a';c.lineWidth=4;c.strokeRect(8,8,112,112);c.fillStyle='#ffffff12';c.fillRect(15,15,98,7);c.fillStyle='#00000020';c.fillRect(15,108,98,6);}},
 {name:'islandPaper',x:128,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,128,128,[[0,'#fffdf0'],[1,'#e6e6d5']]);c.fillRect(0,0,w,h);c.strokeStyle='#788c7d33';c.lineWidth=1;c.strokeRect(1,1,126,126);for(let y=17;y<128;y+=28){c.fillStyle='#bdc3ae28';c.fillRect(9,y,110,1);}}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function fit(r,t,x,y,width,size,color){text(r,t,x,y,Math.min(size,width/r.measureText(String(t),1)),color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function shape(r,type,x,y){const patterns={I:[[0,1],[1,1],[2,1],[3,1]],L:[[0,0],[0,1],[0,2],[1,2]],T:[[0,0],[1,0],[2,0],[1,1]],S:[[1,0],[2,0],[0,1],[1,1]]},u=10;for(const [a,b]of patterns[type])r.rect(x+a*u,y+b*u,u-1,u-1,C.black);}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(24,18,912,44,C.ink);text(r,'TETRO ISLANDS',42,26,28,'#fff7dc');fit(r,config.layouts[s.level].name,601,29,318,25,'#c9dfd6');
 const n=s.size,cell=n===5?70:n===6?60:52,left=70+(364-n*cell)/2,top=105+(364-n*cell)/2,point=c=>({x:left+(c%n+.5)*cell,y:top+(Math.floor(c/n)+.5)*cell});
 r.rect(left-6,top-6,n*cell+12,n*cell+12,C.ink);
 for(let x=0;x<n;x++)center(r,String.fromCharCode(65+x),left+(x+.5)*cell,76,22,C.muted);for(let y=0;y<n;y++)center(r,y+1,left-21,top+(y+.5)*cell-12,23,C.muted);
 const active=s.regions[s.cursor];
 for(let c=0;c<n*n;c++){
  const x=left+c%n*cell,y=top+Math.floor(c/n)*cell,p=point(c),id=s.regions[c],v=s.marks[c];
  r.sprite('islandPaper',p.x,p.y,cell,cell,0,tints[id]);if(id===active)outline(r,x+3,y+3,cell-6,cell-6,'#b9935155',1);
  if(v===1){r.sprite('islandStone',p.x,p.y,cell-10,cell-10,0,'#ffffff');center(r,'+',p.x+8,p.y-9,28,'#bdcfc4');}else if(v===2){r.circle(p.x+7,p.y+6,9,'#fdfbf0');r.circle(p.x+7,p.y+6,6,C.muted);r.circle(p.x+7,p.y+6,3,'#fdfbf0');}else center(r,'?',p.x+7,p.y-11,28,'#89988b');
  // Region number is repeated on every cell, never inferred from tint alone.
  text(r,id+1,x+7,y+4,20,v===1?'#fff3c8':C.ink);
 }
 // Draw region boundaries last so black diagrams cannot conceal partition edges.
 for(let c=0;c<n*n;c++){const x=left+c%n*cell,y=top+Math.floor(c/n)*cell,id=s.regions[c];if(c%n===0||s.regions[c-1]!==id)r.line(x,y,x,y+cell,3,C.ink);if(Math.floor(c/n)===0||s.regions[c-n]!==id)r.line(x,y,x+cell,y,3,C.ink);if(c%n===n-1)r.line(x+cell,y,x+cell,y+cell,3,C.ink);if(c+n>=n*n)r.line(x,y+cell,x+cell,y+cell,3,C.ink);}
 const cur=point(s.cursor);outline(r,cur.x-cell/2+1,cur.y-cell/2+1,cell-2,cell-2,C.cursor,4);fit(r,'+ BLACK   O WHITE   ? UNKNOWN',50,478,410,22,C.muted);
 r.rect(482,84,454,408,C.paper);text(r,'FOUR CELLS / REGION',502,98,25,C.muted);
 ['I','L','T','S'].forEach((t,i)=>{const x=510+i*106;center(r,t,x+20,134,25,C.ink);shape(r,t,x,168);});
 fit(r,'REGION '+(active+1)+' : '+s.regionCounts[active]+' / 4',502,207,414,28,s.regionCounts[active]>4?C.bad:C.ink);
 fit(r,'SHAPE '+(s.regionTypes[active]==='invalid'?'--':s.regionTypes[active])+'   UNKNOWN '+s.unknown,502,244,414,25,C.muted);fit(r,'CHECKS LEFT '+s.attemptsLeft+' / 3',502,281,414,25,C.ink);
 r.rect(502,317,414,2,'#bac6b2');const heading=s.lastCheck?(s.lastCheckCurrent?(s.lastCheck.charged?'LAST COMPLETE CHECK':'LAST FREE HINT'):'OLD CHECK / EDITED'):'B CHECK WHEN FILLED';fit(r,heading,502,332,414,22,C.muted);
 const labels=['4 EACH','SHAPE','JOINED','NO 2x2','UNLIKE','FULL'],keys=['regionExact','shapeValid','globalConnected','noSquares','differentTouching','complete'];
 labels.forEach((label,i)=>{const x=571+i%3*138,y=i<3?365:425;center(r,label,x,y,22,C.muted);const v=s.lastCheck?s.lastCheck[keys[i]]:null;center(r,v===null?'--':v?'OK':'FAIL',x,y+25,24,v===null?C.ink:v?'#39736d':C.bad);});
 fit(r,'A ? > BLACK > WHITE',30,508,450,24,C.ink);fit(r,'B CHECK / UNFILLED FREE',506,508,428,23,C.muted);
}
root.GameDef={id:'tetro-islands',title:'四格岛群',seed:config.defaultSeed,tagline:'每区四格，各有其形；黑格相连，接触异型',accent:'#b8c99b',background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'岛图',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['未知 / 黑 / 白','检查岛群'],
 description:'每个编号区域恰好涂四个黑格，组成 I、L、T、S 四连块之一，旋转和镜像同型。全部黑格须正交连通，不得形成 2×2 全黑。不同区域的黑块若正交接触，形状类型必须不同。',
 controls:{move:'方向键选择格子，右侧显示当前区域的黑格数和形状',a:'空格、Z、确认 / 手机右上：未知→黑→白→未知',b:'X、B / 手机右下：检查；有未知格免费，完整图扣一次'},
 tip:'粗线和重复编号表示区域，深色加号为黑格，空心圆为白格，问号仍待填写。L 与其镜像同型，S 与其镜像同型；O 方块禁止。黑格必须连成一体，白格不用连通。完整检查有三次机会。',
 winTitle:'四格成形，岛群相连',loseTitle:'完整检查机会已用完',
 hud:s=>[{label:'所选区域',value:(s.regions[s.cursor]+1)+' / '+s.regionCount},{label:'区内黑格',value:s.regionCounts[s.regions[s.cursor]]+' / 4'},{label:'未知格',value:s.unknown},{label:'检查机会',value:s.attemptsLeft+' / 3'}],
 result:s=>s.phase==='won'?'每区四格均为合法 I、L、T、S。所有黑格连通，没有 2×2 黑块，相接的区域形状不同。':'三次完整检查已用完。请核对区内四格形状、全部黑格的连通、2×2 方块和相接区域的类型。',render};
})(window);
