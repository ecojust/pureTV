/* Triangular Tessera: original enamel relief, committed physical sectors and public connectivity facts. */
(function(root){
'use strict';
const SQRT3=Math.sqrt(3),TC={x:112,y:112},TV=[{x:112,y:12},{x:112+50*SQRT3,y:162},{x:112-50*SQRT3,y:162}];
function polygon(c,points){c.beginPath();c.moveTo(points[0].x,points[0].y);points.slice(1).forEach(p=>c.lineTo(p.x,p.y));c.closePath();}
function trianglePoints(scale,dy=0){return TV.map(p=>({x:TC.x+(p.x-TC.x)*scale,y:TC.y+(p.y-TC.y)*scale+dy}));}
function tableArt(c,w,h,a){
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#f1f2ee'],[.5,'#dfe4e2'],[1,'#b7c5c8']]);c.fillRect(0,0,w,h);
 c.strokeStyle='#788f9612';c.lineWidth=.5;for(let i=0;i<70;i++){const x=(i*71)%w,y=(i*43)%h;c.beginPath();c.moveTo(x,y);c.lineTo(x+8,y+2);c.stroke();}
 c.fillStyle=a.radial(c,w*.27,h*.12,w*.8,[[0,'#ffffff46'],[1,'#6b8a9610']]);c.fillRect(0,0,w,h);
 c.strokeStyle='#ffffff68';c.lineWidth=1;for(let i=1;i<6;i++){c.beginPath();c.moveTo(w*i/6,0);c.lineTo(w*i/6,h);c.stroke();}
}
function bodyArt(c,w,h,a){
 c.save();c.scale(w/224,h/224);
 polygon(c,trianglePoints(1.025,3));c.fillStyle='#15262e35';c.fill();
 polygon(c,trianglePoints(1.005));c.fillStyle=a.linear(c,40,15,180,190,[[0,'#75858a'],[.48,'#34464f'],[1,'#182b35']]);c.fill();
 polygon(c,trianglePoints(.967));c.fillStyle=a.linear(c,20,25,170,180,[[0,'#e2e8e6'],[.4,'#a1afb2'],[1,'#6d7f85']]);c.fill();c.strokeStyle='#f4f4e8';c.lineWidth=1.1;c.stroke();
 polygon(c,trianglePoints(.923));c.fillStyle='#263b45';c.fill();c.strokeStyle='#26363e';c.lineWidth=1.1;c.stroke();c.restore();
}
function sectorArt(palette,pattern){return function(c,w,h,a){
 c.save();c.scale(w/224,h/224);const outside=trianglePoints(.905),points=[TC,outside[0],outside[1]];polygon(c,points);c.save();c.clip();
 c.fillStyle=a.linear(c,65,20,170,170,[[0,palette[0]],[.48,palette[1]],[1,palette[2]]]);c.fillRect(0,0,224,224);
 c.strokeStyle='#ffffff16';c.lineWidth=.65;for(let i=0;i<35;i++){const y=12+i*6;c.beginPath();c.moveTo(0,y);c.lineTo(224,y+16);c.stroke();}
 c.fillStyle=a.radial(c,127,52,100,[[0,'#ffffff45'],[.48,'#ffffff0a'],[1,'#10242b20']]);c.fillRect(0,0,224,224);
 c.strokeStyle='#ffffff28';c.lineWidth=1.1;
 for(let i=0;i<17;i++){const x=125+(i*19)%62,y=23+(i*31)%125;if(pattern==='dots'){c.beginPath();c.arc(x,y,1.8,0,Math.PI*2);c.stroke();}else if(pattern==='slashes'){c.beginPath();c.moveTo(x-3,y+3);c.lineTo(x+3,y-3);c.stroke();}else{c.beginPath();c.moveTo(x-3,y);c.lineTo(x+3,y);c.stroke();}}
 c.beginPath();c.moveTo(118,27);c.lineTo(128,37);c.lineTo(177,127);c.lineTo(170,120);c.closePath();c.fillStyle='#ffffff13';c.fill();c.restore();
 // A light enamel lip follows the real external edge; no fabricated inner gap.
 c.beginPath();c.moveTo(outside[0].x,outside[0].y);c.lineTo(outside[1].x,outside[1].y);c.strokeStyle='#ffffff92';c.lineWidth=1.4;c.stroke();
 c.restore();
};}
const atlas={builtins:[],tiles:[
 {name:'tessera_table',x:0,y:0,w:512,h:224,paint:tableArt},
 {name:'tessera_body',x:512,y:0,w:224,h:224,paint:bodyArt},
 {name:'tessera_R',x:0,y:224,w:224,h:224,paint:sectorArt(['#e7a69b','#cb665d','#9e454a'],'dots')},
 {name:'tessera_G',x:224,y:224,w:224,h:224,paint:sectorArt(['#a9cdb9','#5c9e87','#377564'],'slashes')},
 {name:'tessera_B',x:448,y:224,w:224,h:224,paint:sectorArt(['#a5bae0','#5e7eb6','#3c5184'],'bars')}
]};
const INK='#263f4b',PAPER='#f4f1e4',MUTED='#b8cbd0';
function centerText(r,text,x,y,size,color){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
function segment(r,a,b,width,color){r.line(a.x,a.y,b.x,b.y,width,color);}
function triangleOutline(r,c,vertices,scale,color,width){const p=vertices.map(v=>({x:c.x+(v.x-c.x)*scale,y:c.y+(v.y-c.y)*scale}));for(let i=0;i<3;i++)segment(r,p[i],p[(i+1)%3],width,color);}
function sectorCenter(c,vertices,index){const a=vertices[index],b=vertices[(index+1)%3];return{x:(c.x+a.x+b.x)/3,y:(c.y+a.y+b.y)/3};}
function triangleMaterial(r,c,vertices,glyphs){
 const radius=Math.hypot(vertices[0].x-c.x,vertices[0].y-c.y),size=224*radius/100,angle=Math.atan2(vertices[0].y-c.y,vertices[0].x-c.x)+Math.PI/2;
 r.sprite('tessera_body',c.x,c.y,size,size,angle,'#fff');
 for(let slot=0;slot<3;slot++)r.sprite('tessera_'+glyphs[slot],c.x,c.y,size,size,angle+slot*Math.PI*2/3,'#fff');
}
function mirrorAxis(r,axis){
 const v=axis.a,a=axis.b,dx=v.x-a.x,dy=v.y-a.y;
 for(let i=0;i<11;i++){const t=.1+i*.07,u=t+.035;r.line(a.x+dx*t,a.y+dy*t,a.x+dx*u,a.y+dy*u,1.4,'#f7f3df94');}
 r.circle(a.x,a.y,4.2,'#e8dcc1');r.circle(a.x,a.y,1.8,INK);
}
function color(s,id){const rgb=s.colors.find(c=>c.id===id).rgb;return'rgb('+rgb.join(',')+')';}
function checkMark(r,x,y,good){r.circle(x,y,8,'#172f39');if(good){r.line(x-4,y,x-1,y+3,2,'#cbe5c4');r.line(x-1,y+3,x+5,y-4,2,'#cbe5c4');}else{r.line(x-3,y-3,x+3,y+3,2,'#f0b1a0');r.line(x-3,y+3,x+3,y-3,2,'#f0b1a0');}}
function mosaic(r,s){
 r.circle(s.projection.x,s.projection.y,211,'#7f949b38');r.circle(s.projection.x,s.projection.y,201,'#c8d3d3a8');
 for(const tile of s.tiles)triangleMaterial(r,tile.center,tile.vertices,tile.slots.map(slot=>slot.colorId));
 const selected=s.tiles.find(t=>t.id===s.selectedId);
 if(s.phase==='playing'){triangleOutline(r,selected.center,selected.vertices,1.025,'#fff8d7',3.1);mirrorAxis(r,selected.mirrorAxis);}
 for(const edge of s.edges){if(!edge.shared)continue;const x=(edge.a.x+edge.b.x)/2,y=(edge.a.y+edge.b.y)/2,dx=edge.b.x-edge.a.x,dy=edge.b.y-edge.a.y,length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
  if(edge.matched){r.line(x-nx*8,y-ny*8,x+nx*8,y+ny*8,7,'#233c45');r.line(x-nx*8,y-ny*8,x+nx*8,y+ny*8,3.6,color(s,edge.colorIds[0]));r.circle(x,y,1.5,'#f7eee1');}
  else{r.circle(x,y,7.5,'#253d49');r.line(x-3,y-3,x+3,y+3,1.8,'#ffdfcf');r.line(x-3,y+3,x+3,y-3,1.8,'#ffdfcf');}
 }
 // Corner caps deliberately do not make color connections across a single vertex.
 for(const v of s.vertices){r.circle(v.x,v.y,4.3,'#233b46');r.circle(v.x,v.y,1.4,'#a4b8bd');}
 for(const tile of s.tiles){
  for(const slot of tile.slots){const p=slot.polygon.reduce((a,v)=>({x:a.x+v.x/3,y:a.y+v.y/3}),{x:0,y:0});r.rect(p.x-18,p.y-10,36,23,'#18344162');centerText(r,slot.colorId+slot.mark,p.x,p.y-9,19,PAPER);}
  r.circle(tile.x,tile.y,14.5,INK);centerText(r,tile.id,tile.x,tile.y-8,16,PAPER);
 }
 r.text('R / G / B = COLOUR',76,461,13,INK);r.text('1 / 2 / 3 = MOVING MARK',76,480,13,INK);
 r.line(365,470,384,470,3,'#5c9e87');r.circle(374.5,470,1.5,'#f7eee1');r.text('EDGE LINK',393,462,13,INK);
 r.circle(374.5,491,4.2,INK);r.text('CORNER: NO LINK',393,482,13,INK);
}
function ledger(r,s){
 r.rect(606,65,326,431,'#2b424eef');r.line(606,65,932,65,1.4,'#f8f6e7');r.text('COLOUR REGIONS',626,81,21,PAPER);r.text('CURRENT / TARGET',626,108,13,MUTED);
 const english={R:'RED',G:'GREEN',B:'BLUE'};
 s.colorRegions.forEach((row,i)=>{const y=145+i*59;r.rect(624,y-9,288,49,'#e2eee50a');r.circle(645,y+13,13,color(s,row.colorId));centerText(r,row.colorId,645,y+2,21,PAPER);r.text(english[row.colorId],668,y+5,15,PAPER);r.text(row.actual+' / '+row.target,780,y-1,27,PAPER);checkMark(r,896,y+13,row.matched);});
 r.line(626,316,912,316,1,'#9ab2bd55');r.text('MATCHED EDGES',626,332,14,MUTED);r.text(s.matchedEdgeCount+' / '+s.sharedEdgeCount,805,324,27,PAPER);checkMark(r,896,340,s.allEdgesMatched);
 const selected=s.tiles.find(t=>t.id===s.selectedId);r.line(626,364,912,364,1,'#9ab2bd55');
 if(s.phase==='playing'){
  r.text('SELECTED '+selected.id,626,381,18,PAPER);r.text('A ROTATE 120 CW',626,411,14,MUTED);r.text('B MIRROR / DOTTED AXIS',626,434,14,MUTED);
  r.text(s.movesRemaining===1?'LAST MOVE: BOTH TARGETS REQUIRED':'EACH A / B COSTS 1 MOVE',626,469,13,s.movesRemaining===1?'#f5c3b0':PAPER);
 }else{r.text(s.phase==='won'?'MOSAIC COMPLETE':'ROUND COMPLETE',626,389,20,PAPER);r.text('FINAL PHYSICAL MARKS',626,425,14,MUTED);r.text('EDGES + ALL THREE COLOURS',626,465,13,MUTED);}
}
function status(r,s){
 r.rect(28,508,904,27,INK);let text;
 if(s.phase==='won')text='SHARED EDGES + RGB REGIONS MATCH';
 else if(s.phase==='lost')text=s.lostReason==='moves'?'OPERATION LIMIT REACHED':'90 SECONDS COMPLETE';
 else if(s.lastOperation){const op=s.lastOperation;text='LAST '+(op.kind==='rotate'?'A ROTATE ':'B MIRROR ')+op.tileId+' / '+(op.colorChanged?'COST 1':'MARKS MOVED, COLOUR SAME / COST 1');}
 else text='SELECT A TILE / A ROTATE / B MIRROR';
 r.text(text,43,514,14,PAPER);const used='MOVES '+s.movesUsed+'/'+s.moveLimit;r.text(used,914-r.measureText(used,18),512,18,PAPER);
}
function scene(r,s){r.sprite('tessera_table',480,270,960,540,0,'#fff');r.rect(0,0,960,53,'#2b424e');r.text('TRIANGULAR TESSERA',25,15,24,PAPER);r.text('ENAMEL LAB / '+String(s.level).padStart(2,'0'),736,23,14,MUTED);mosaic(r,s);ledger(r,s);status(r,s);}
root.GameDef={
 id:'triangular-tessera',title:'三角拼域',tagline:'转动彩砖，让邻边与色域同时对位',seed:379,accent:'#87b4bd',background:'#d8e1df',levelLabel:'拼域',levelNames:['初拼','回纹','合域'],atlas,
 description:'方向选砖。A 顺时针旋转120度，B 沿虚线镜像；每次消耗1步，同色也不例外。让所有共享边同色，并对齐红绿蓝的色域数量。共享线段才相连，顶点相碰不连通。',
 controls:{move:'方向键 / 摇杆 · 选砖',a:'旋转 / 空格',b:'镜像 / B'},actionLabels:['旋转','镜像'],
 tip:'编号随扇区移动。同色变换也耗1步；顶点相碰不连通。',winTitle:'彩砖拼域完成',loseTitle:'拼域待重排',
 result(s){if(s.phase==='won')return '邻边同色，红绿蓝色域数全部对位。';if(s.lostReason==='timeout')return '90 秒已到。留意邻边与各色色域。';return '步数用尽。核对邻边与各色色域，再重排。';},
 hud(s){return[
  {label:'剩余操作',value:s.movesRemaining+' / '+s.moveLimit,tone:s.movesRemaining<=1&&s.phase!=='won'?'warn':''},
  {label:'邻边同色',value:s.matchedEdgeCount+' / '+s.sharedEdgeCount,tone:s.allEdgesMatched?'':'warn'},
  {label:s.phase==='won'?'拼域完成':s.phase==='lost'?'本轮结束':'色域对位',value:s.matchedRegionColorCount+' / 3',tone:s.allRegionsMatched?'':'warn'},
  {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
 ];},render(r,s){scene(r,s);}
};
})(window);
