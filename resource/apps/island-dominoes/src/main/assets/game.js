/* Island Dominoes: public straight-edge bridge planning on a sunlit chart. */
(function(root){
'use strict';
/* Original sunlit chart-table materials; atlas generation is independent of game state. */
function deskArt(c,w,h,a){
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#e4d7ac'],[.5,'#c9b58b'],[1,'#a58b68']]);c.fillRect(0,0,w,h);
 for(let y=9;y<h;y+=13){c.strokeStyle=y%2?'#73543d15':'#fff0c329';c.lineWidth=1;c.beginPath();c.moveTo(0,y);for(let x=0;x<=w;x+=24)c.lineTo(x,y+Math.sin(x*.025+y)*2);c.stroke()}
 c.fillStyle=a.radial(c,w*.3,h*.2,w*.8,[[0,'#fff2c12e'],[1,'#624d2412']]);c.fillRect(0,0,w,h);
}
function seaArt(c,w,h,a){
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#8ac5bb'],[.35,'#61aaa8'],[.7,'#3c919b'],[1,'#2f7f8c']]);c.fillRect(0,0,w,h);
 for(let i=0;i<55;i++){const x=13+(i*83)%(w-26),y=8+(i*47)%(h-16);c.strokeStyle=i%3?'#d8ecd321':'#e9f3d42e';c.lineWidth=i%3?.7:1.1;c.beginPath();c.moveTo(x-5,y);c.quadraticCurveTo(x,y+2,x+7,y-1);c.stroke()}
 a.path(c,[[0,0],[w*.57,0],[w*.22,h],[0,h]],'#ddf2d315');c.fillStyle=a.radial(c,w*.17,h*.1,w*.7,[[0,'#e9f0be22'],[1,'#77c8c600']]);c.fillRect(0,0,w,h);
}
function islandArt(c,w,h,a){
 c.save();c.scale(w/128,h/128);a.ellipse(c,64,71,57,43,'#c0dfc24a');a.ellipse(c,65,73,50,38,'#e1e7bf5c');
 const points=[[18,45],[31,22],[61,15],[85,25],[105,42],[112,69],[98,94],[74,109],[47,104],[23,86],[14,65]];
 a.path(c,points.map(([x,y])=>[x+3,y+5]),'#236c7180');a.path(c,points,a.linear(c,15,20,112,107,[[0,'#fff1bd'],[.48,'#e5cd94'],[1,'#b69966']]),'#f6e9b9',1.5);
 a.path(c,[[29,46],[39,31],[62,25],[84,35],[98,53],[95,76],[78,93],[51,91],[33,77],[24,61]],a.linear(c,30,29,91,89,[[0,'#a9bd73'],[.5,'#7c9e65'],[1,'#597e62']]),'#c3ce8d',1);
 a.path(c,[[30,45],[54,32],[77,35],[64,54],[37,64]],'#bdd08b4d');a.path(c,[[66,53],[84,37],[96,57],[83,79]],'#4d786744');
 [[26,74,8,5],[91,84,10,6],[77,101,7,3]].forEach(([x,y,rx,ry])=>{a.ellipse(c,x+1,y+2,rx,ry,'#9b956c');a.ellipse(c,x,y,rx,ry,'#d6d3a3')});
 c.strokeStyle='#fff6ccac';c.lineWidth=1.3;c.beginPath();c.moveTo(20,45);c.lineTo(33,25);c.lineTo(56,19);c.stroke();c.restore();
}
function dominoArt(c,w,h,a){
 c.fillStyle='#604c3d44';c.fillRect(7,9,w-11,h-12);c.fillStyle=a.linear(c,0,0,w,h,[[0,'#fff1cb'],[.5,'#dfc999'],[1,'#b99b70']]);c.fillRect(3,3,w-9,h-10);
 c.strokeStyle='#fff5d4';c.lineWidth=1.5;c.strokeRect(5,5,w-13,h-14);c.fillStyle='#f0dfb5';c.fillRect(11,11,w-25,h-25);
 c.strokeStyle='#9f835b55';c.lineWidth=.7;for(let y=19;y<h-16;y+=11){c.beginPath();c.moveTo(14,y);c.quadraticCurveTo(w*.5,y+2,w-17,y);c.stroke()}
 c.strokeStyle='#c1ab7a';c.lineWidth=1.2;c.beginPath();c.moveTo(w*.5,15);c.lineTo(w*.5,h-18);c.stroke();
}
function spanArt(c,w,h,a){
 c.fillStyle='#294f4e55';c.fillRect(1,h*.28,w-2,h*.54);c.fillStyle=a.linear(c,0,h*.15,0,h*.8,[[0,'#f7dfaa'],[.4,'#d8b27b'],[1,'#a4794d']]);c.fillRect(0,h*.17,w,h*.58);
 c.strokeStyle='#fce7b9';c.lineWidth=2;c.beginPath();c.moveTo(0,h*.2);c.lineTo(w,h*.2);c.stroke();c.strokeStyle='#87623f';c.lineWidth=1.5;c.beginPath();c.moveTo(0,h*.72);c.lineTo(w,h*.72);c.stroke();
 for(let x=12;x<w;x+=17){c.strokeStyle='#8b684a88';c.lineWidth=1;c.beginPath();c.moveTo(x,h*.22);c.lineTo(x,h*.69);c.stroke();}for(const x of[5,w-6])for(const y of[h*.31,h*.61])a.ellipse(c,x,y,1.7,1.7,'#866b4c');
}

const atlas={builtins:[],tiles:[
 {name:'island_desk',x:0,y:0,w:512,h:224,paint:deskArt},
 {name:'island_land',x:512,y:0,w:128,h:128,paint:islandArt},
 {name:'island_card',x:640,y:0,w:128,h:128,paint:dominoArt},
 {name:'island_span',x:768,y:0,w:128,h:64,paint:spanArt},
 {name:'island_sea',x:0,y:800,w:512,h:224,paint:seaArt}
]};
const C={ink:'#244c55',dark:'#173e48',paper:'#fff0c9',muted:'#d8d6b7',gold:'#ffe1a2',mint:'#b6ebd5',red:'#ffc1a6'};
function center(r,t,x,y,size,color){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function outline(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function ink(s,id){const c=s.colors.find(c=>c.id===id);return '#'+c.rgb.map(v=>v.toString(16).padStart(2,'0')).join('');}
function glyph(s,id){return s.colors.find(c=>c.id===id).glyph;}
function mark(r,s,id,x,y,size){const g=glyph(s,id),fill=ink(s,id);if(g==='C'){r.circle(x,y,size*.56,C.paper);r.circle(x,y,size*.48,fill);}else{const angle=g==='G'?Math.PI/4:0,dim=g==='G'?size*.76:size;r.rect(x-dim/2-1,y-dim/2-1,dim+2,dim+2,C.paper,angle);r.rect(x-dim/2,y-dim/2,dim,dim,fill,angle);}center(r,g,x,y-size*.37,Math.max(14,size*.7),C.dark);}
function island(s,id){return s.islands.find(i=>i.id===id);}
function arrow(r,a,b,at,size,color){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(!len)return;const ux=dx/len,uy=dy/len,x=a.x+dx*at,y=a.y+dy*at;r.line(x-ux*size-uy*size*.55,y-uy*size+ux*size*.55,x,y,2.5,color);r.line(x-ux*size+uy*size*.55,y-uy*size-ux*size*.55,x,y,2.5,color);}
function dash(r,a,b,color){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(!len)return;for(let q=0;q<len;q+=15){const end=Math.min(q+8,len);r.line(a.x+dx*q/len,a.y+dy*q/len,a.x+dx*end/len,a.y+dy*end/len,3,color);}}
function bridges(r,s){
 s.bridges.forEach(b=>{const a=island(s,b.sourceId),z=island(s,b.targetId),dx=z.x-a.x,dy=z.y-a.y,len=Math.hypot(dx,dy);r.sprite('island_span',(a.x+z.x)/2,(a.y+z.y)/2,len,18,Math.atan2(dy,dx),'#fff');arrow(r,a,z,Math.max(.5,1-23/len),8,ink(s,b.targetColor));r.circle(a.x+dx*18/len,a.y+dy*18/len,3.5,C.paper);});
 if(s.phase==='playing'&&s.stage==='target'&&s.preview){const p=s.preview,a=island(s,p.sourceId),b=island(s,p.targetId),color=p.valid&&!p.wouldLoseDisconnected?C.mint:C.red;dash(r,a,b,color);arrow(r,a,b,.65,10,color);}
}
function map(r,s){
 r.rect(49,63,580,394,'#78684c');r.rect(51,65,576,390,C.paper);r.sprite('island_sea',339,260,572,386,0,'#fff');outline(r,54,68,570,384,'#d2e3bd',1.3);
 const b=s.board;for(let gy=0;gy<=5;gy++)for(let gx=0;gx<=8;gx++)r.circle(b.x+gx*b.unit,b.y+gy*b.unit,1.2,'#d9edcc66');
 for(let gx=0;gx<=8;gx++)center(r,String(gx),b.x+gx*b.unit,435,13,'#e7efd3');for(let gy=0;gy<=5;gy++)r.text(String(gy),61,b.y+gy*b.unit-7,13,'#e7efd3');r.text('GRID u',574,435,13,C.paper);
 bridges(r,s);
 s.islands.forEach(i=>{r.sprite('island_land',i.x,i.y,44,44,0,'#fff');mark(r,s,i.color,i.x,i.y,23);r.rect(i.x-16,i.y-35,32,21,'#244c55eb');center(r,i.id,i.x,i.y-34,17,C.paper);
  if(s.phase==='playing'&&s.stage!=='bank'&&i.id===s.selectedIslandId){r.circle(i.x,i.y,s.islandRadius+6,'#fff2bf35');outline(r,i.x-23,i.y-23,46,46,C.gold,2.5);}
  if(s.sourceId===i.id&&s.stage==='target'){r.circle(i.x,i.y+28,3,C.paper);center(r,'FROM',i.x,i.y+31,13,C.paper);}
 });
 // Bridge IDs refer back to unique physical pieces in the bank. Endpoints remain exact.
 s.bridges.forEach(b=>{const a=island(s,b.sourceId),z=island(s,b.targetId),x=(a.x+z.x)/2,y=(a.y+z.y)/2;r.rect(x-15,y-10,30,19,'#fff0c9ed');center(r,b.pieceId,x,y-9,14,C.ink);});
}
function bank(r,s){
 r.rect(680,66,250,391,'#244c55ef');outline(r,680,66,250,391,'#ede0b8',1.2);r.text('BRIDGE BANK',697,76,19,C.paper);
 s.pieces.forEach(p=>{const selected=s.phase==='playing'&&s.stage==='bank'&&p.id===s.selectedPieceId,held=p.id===s.heldPieceId,w=100,h=88,x=p.x-w/2,y=p.y-h/2;
  r.sprite('island_card',p.x,p.y,w,h,0,p.placed?'#b5c7bb':'#fff');r.text(p.id,x+9,y+7,17,C.ink);r.text(p.placed?'USED':held?'HELD':'READY',x+43,y+10,13,C.ink);
  center(r,String(p.length),p.x-25,p.y-11,27,C.ink);r.text('>',p.x-4,p.y-6,17,C.ink);mark(r,s,p.targetColor,p.x+25,p.y+1,24);
  const b=s.bridges.find(b=>b.pieceId===p.id);center(r,b?b.sourceId+'>'+b.targetId:'STRAIGHT '+p.length+'u',p.x,y+h-23,13,C.ink);
  if(selected||held)outline(r,x-2,y-2,w+4,h+4,held?C.mint:C.gold,2.5);
 });
 s.colors.forEach((c,j)=>{mark(r,s,c.id,714+j*78,437,17);r.text({C:'CORAL',T:'TEAL',G:'GOLD'}[c.glyph],726+j*78,430,13,C.paper);});
}
const reasons={'same-island':'CHOOSE A DIFFERENT ISLAND',length:'STRAIGHT LENGTH MISMATCH',color:'TARGET COLOR MISMATCH','through-island':'PASSES THROUGH AN ISLAND',occupied:'ISLAND PAIR ALREADY USED',intersection:'CROSSING / TOUCH / OVERLAP'};
function status(r,s){
 r.rect(28,470,902,60,'#244c55f2');r.line(28,470,930,470,1.3,'#f1dfac');
 let head=s.stage==='bank'?'1 / PICK A BRIDGE':s.stage==='source'?'2 / CHOOSE SOURCE':'3 / CHOOSE TARGET',action=s.stage==='bank'?(s.bridges.length?'A PICK / B UNDO LAST BRIDGE':'A PICK / B HAS NO BRIDGE'):s.stage==='source'?'A SET SOURCE / B TO BANK':'A BUILD / B CHANGE SOURCE',detail='NUMBER END: ANY SOURCE COLOR',note='COLOR END: MATCH THE TARGET';
 const p=s.preview,held=s.pieces.find(p=>p.id===s.heldPieceId);
 if(s.phase==='won'){head='ALL ISLANDS CONNECTED';action='ALL BRIDGE PIECES USED';detail='ONE COMPLETE NETWORK';note='ROUND COMPLETE';}
 else if(s.phase==='lost'){head=s.lostReason==='timeout'?'90 SECONDS COMPLETE':s.lostReason==='invalid'?'THIRD INVALID ATTEMPT':'ISLANDS STILL DISCONNECTED';action='ROUND COMPLETE / NETWORK PRESERVED';detail=s.componentCount+' SEPARATE GROUPS';note='RETRY STARTS A FRESH NETWORK';}
 else if(p){detail='D2 '+p.distanceSquared+' / NEED '+p.requiredSquared;if(!p.valid)note=reasons[p.reason];else if(p.wouldLoseDisconnected)note='FINAL: '+p.resultingComponentCount+' GROUPS / NOT CONNECTED';else if(p.wouldFinish)note='FINAL: ALL ISLANDS WILL CONNECT';else note='LOCAL OK / '+p.resultingComponentCount+' GROUPS AFTER';}
 else if(held){detail=held.id+' / LENGTH '+held.length+'u > '+glyph(s,held.targetColor);note='SELECT THE NUMBER-END ISLAND';}
 r.text(head,45,479,18,s.phase==='lost'?C.red:C.paper);r.text(action,45,506,13,C.muted);
 const tone=s.phase==='lost'||p&&(!p.valid||p.wouldLoseDisconnected)?C.red:C.mint;
 r.text(detail,470,478,18,tone);r.text(note,470,505,13,C.paper);
}
function scene(r,s){
 r.sprite('island_desk',480,270,960,540,0,'#fff');r.rect(0,0,960,53,'#244c55');r.text('ISLAND DOMINOES',25,15,24,C.paper);r.text('MISSES '+s.failedCommits+' / '+s.maxFailedCommits,730,20,16,s.failedCommits?C.red:C.paper);
 map(r,s);bank(r,s);status(r,s);
}
root.GameDef={
 id:'island-dominoes',title:'双岛联结',tagline:'数字端定桥长，颜色端接目标岛',seed:307,accent:'#e5c691',background:'#6bb0ac',levelLabel:'海湾',levelNames:['浅湾','双湾','长链'],atlas,
 description:'方向选桥牌或岛屿，A 依次选牌、起点、终点并架桥。数字规定直线长度，色端须接同色岛；桥不能穿岛、交叉或重叠。B 返回选择，在牌库撤销上一桥。用完桥片且全岛连通才胜，错三次或 90 秒到结束。',
 controls:{move:'方向键 / 摇杆 · 选择桥牌或岛',a:'选择 / 架桥 · 空格 / 确认 / 右上半屏',b:'返回 / 撤销 · B / 右下半屏'},actionLabels:['选择 / 架桥','返回 / 撤销'],
 tip:'虚线只是预览。长度按直线网格单位算，D2 是距离平方；撤销不退用时或错次。',
 winTitle:'群岛已连通',loseTitle:'航路待重联',
 result(s){if(s.phase==='won')return '桥片已用完，所有岛屿接入同一网络。';if(s.lostReason==='timeout')return '90 秒已到。先规划桥牌与目标岛，再逐座连接。';if(s.lostReason==='disconnected')return '桥片已用完，但群岛仍分组。重试时先连接孤岛。';return '三次架桥不合法。先核对长度、色端和相交提示。';},
 hud(s){return[
  {label:'已架 / 全部桥片',value:s.placedCount+' / '+s.pieces.length},
  {label:'网络分组',value:s.componentCount+' 组',tone:s.connected?'':'warn'},
  {label:'当前阶段',value:s.phase==='won'?'群岛连通':s.phase==='lost'?'本轮结束':s.stage==='bank'?'选择桥牌':s.stage==='source'?'选择起点':'选择终点'},
  {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
 ];},render(r,s){scene(r,s);}
};
})(window);
