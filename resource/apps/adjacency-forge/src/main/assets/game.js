/* Adjacency Forge: exact public hex recipes and discrete directed heat routes. */
(function(root){
'use strict';
/* Original fixed forge materials. State, recipes and heat topology never enter atlas painters. */
function workshopArt(c,w,h,a){
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#45515b'],[.4,'#313e49'],[1,'#202d38']]);c.fillRect(0,0,w,h);
 for(let y=9;y<h;y+=6){c.strokeStyle=y%3?'#c4d0c20b':'#17212f22';c.lineWidth=.6;c.beginPath();c.moveTo(0,y);c.lineTo(w,y-1);c.stroke()}
 c.strokeStyle='#101c286b';c.lineWidth=2;for(const x of[w*.22,w*.76]){c.beginPath();c.moveTo(x,0);c.lineTo(x-18,h);c.stroke();c.strokeStyle='#a0b7b327';c.lineWidth=1;c.beginPath();c.moveTo(x+2,0);c.lineTo(x-16,h);c.stroke()}
 for(const x of[12,w-13])for(const y of[13,h-14]){a.ellipse(c,x+1,y+1,3.6,3.6,'#111e2b');a.ellipse(c,x,y,3,3,'#72858b');c.strokeStyle='#d1d6bf';c.lineWidth=.7;c.beginPath();c.moveTo(x-1.5,y-1);c.lineTo(x+1.5,y+1);c.stroke()}
 c.fillStyle=a.radial(c,w*.3,h*.25,w*.6,[[0,'#f1b77510'],[1,'#08131b0d']]);c.fillRect(0,0,w,h);
}
function forgeHex(c,w,h,a,palette){
 c.save();c.scale(w/128,h/128);const rim=[[64,7],[112,35],[112,89],[64,117],[16,89],[16,35]],face=[[64,15],[105,39],[105,84],[64,108],[23,84],[23,39]];
 a.path(c,rim.map(([x,y])=>[x+1,y+6]),'#0e1d29a6');a.path(c,rim,a.linear(c,18,16,108,116,[[0,palette.light],[.4,palette.main],[1,palette.dark]]),'#111e2a',1.2);
 a.path(c,[[16,35],[64,7],[64,15],[23,39],[23,84],[16,89]],palette.light);a.path(c,[[112,35],[112,89],[64,117],[64,108],[105,84],[105,39]],palette.dark);
 a.path(c,face,a.linear(c,24,18,102,108,[[0,palette.light],[.26,palette.main],[.5,palette.light],[.64,palette.main],[1,palette.dark]]),palette.edge,1);
 a.path(c,[[64,22],[98,42],[98,81],[64,101],[30,81],[30,42]],palette.face,palette.edge,.8);
 c.strokeStyle=palette.sheen;c.lineWidth=.7;for(let i=0;i<11;i++){const y=39+i*4.5;c.beginPath();c.moveTo(37,y);c.lineTo(89,y-3);c.stroke();}
 a.path(c,[[31,43],[64,24],[82,35],[45,57]],palette.reflection);
 [[26,40],[102,40],[64,108]].forEach(([x,y])=>{a.ellipse(c,x,y,2,2,'#12253677');a.ellipse(c,x-.5,y-.5,1.1,1.1,palette.edge)});
 c.restore();
}
function copperArt(c,w,h,a){forgeHex(c,w,h,a,{light:'#f0c498',main:'#bf835b',dark:'#764a35',edge:'#f4d2a4',face:'#b37855',sheen:'#f3ca8e38',reflection:'#ffe0aa1f'});}
function ironArt(c,w,h,a){forgeHex(c,w,h,a,{light:'#a4bac0',main:'#647f90',dark:'#324c60',edge:'#c2d0c9',face:'#536f82',sheen:'#dce9d328',reflection:'#d8eee420'});}
function silverArt(c,w,h,a){forgeHex(c,w,h,a,{light:'#fff3cf',main:'#bdcbc8',dark:'#718a95',edge:'#fff9df',face:'#bbc9c7',sheen:'#ffffff38',reflection:'#fffbe437'});}
function socketArt(c,w,h,a){
 c.save();c.scale(w/128,h/128);const outer=[[64,7],[112,35],[112,89],[64,117],[16,89],[16,35]],inner=[[64,19],[102,41],[102,82],[64,105],[26,82],[26,41]];
 a.path(c,outer,'#1c2c38','#899b9b',1.5);a.path(c,inner,a.linear(c,0,15,0,111,[[0,'#152332'],[1,'#3c535d']]),'#0c1c2a',2);
 c.strokeStyle='#718d9144';c.lineWidth=1;[[64,29,64,38],[36,46,44,50],[36,77,44,73],[64,95,64,86],[92,77,84,73],[92,46,84,50]].forEach(([x,y,xx,yy])=>{c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke()});
 a.ellipse(c,64,62,13,13,'#10243277');a.ellipse(c,64,62,4,4,'#7e999157');c.restore();
}

const atlas={builtins:[],tiles:[
 {name:'forge_workshop',x:0,y:0,w:512,h:224,paint:workshopArt},
 {name:'forge_copper',x:512,y:0,w:128,h:128,paint:copperArt},
 {name:'forge_iron',x:640,y:0,w:128,h:128,paint:ironArt},
 {name:'forge_silver',x:768,y:0,w:128,h:128,paint:silverArt},
 {name:'forge_socket',x:896,y:0,w:128,h:128,paint:socketArt}
]};
const C={paper:'#efe7cc',muted:'#b6c7c4',ink:'#162a38',warm:'#ffcc8c',heat:'#ffb36e',cool:'#9eb6ba',ok:'#bee1c5',warn:'#efb19d'};
function center(r,t,x,y,size,color){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function outline(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function hex(r,x,y,radius,color,width=1.5){for(let k=0;k<6;k++){const a=-Math.PI/2+k*Math.PI/3,b=a+Math.PI/3;r.line(x+Math.cos(a)*radius,y+Math.sin(a)*radius,x+Math.cos(b)*radius,y+Math.sin(b)*radius,width,color);}}
function material(s,id){return s.materials.find(m=>m.id===id);}
function cell(s,id){return s.cells.find(c=>c.id===id);}
function rgb(m){return '#'+m.rgb.map(v=>v.toString(16).padStart(2,'0')).join('');}
function directionVector(d){const x=Math.sqrt(3)*(d.dq+d.dr/2),y=1.5*d.dr,len=Math.hypot(x,y);return{x:x/len,y:y/len};}
function arrow(r,a,b,color,width){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(!len)return;const ux=dx/len,uy=dy/len,start=28,end=len-28;r.line(a.x+ux*start,a.y+uy*start,a.x+ux*end,a.y+uy*end,width,color);const q=Math.min(end,start+19),x=a.x+ux*q,y=a.y+uy*q;r.line(x-ux*6-uy*3.7,y-uy*6+ux*3.7,x,y,width,color);r.line(x-ux*6+uy*3.7,y-uy*6-ux*3.7,x,y,width,color);}
function workshop(r,s){
 r.text('HEX WORKSHOP',35,68,18,C.paper);r.text('C = CELL / T = TILE',365,72,13,C.muted);
 const hotCells=new Set(s.heat.pathCellIds);
 s.cells.forEach(c=>{r.sprite('forge_socket',c.x,c.y+1.7,112,112,0,'#fff');r.sprite('forge_'+c.material,c.x,c.y+1.5,95,95,0,'#fff');if(hotCells.has(c.id))hex(r,c.x,c.y,s.board.hexRadius-1,'#f4ba817d',1.7);});
 // Every arrow follows an actual public outlet. Only the actual traced edges are hot.
 s.cells.forEach(c=>{if(c.outletCellId)arrow(r,c,cell(s,c.outletCellId),C.cool,1.3);});
 s.heat.edges.forEach(e=>arrow(r,cell(s,e.fromId),cell(s,e.toId),C.heat,2.6));
 s.cells.forEach(c=>{const m=material(s,c.material);r.rect(c.x-29,c.y-29,58,19,'#172a38e8');center(r,c.id+' '+c.tileId,c.x,c.y-29,16,C.paper);center(r,m.glyph,c.x,c.y-5,24,c.material==='silver'?C.ink:C.paper);
  const role=c.role==='source'?'FIRE':c.role==='mold'?'MOLD':c.recipeMet?'OK':'CHECK';center(r,role,c.x,c.y+24,13,c.role?C.paper:c.recipeMet?C.ok:C.warn);
  const px=c.x+27,py=c.y+18;r.circle(px,py,6.5,C.ink);if(c.recipeMet){r.line(px-3,py,px-.5,py+2.8,1.8,C.ok);r.line(px-.5,py+2.8,px+3.5,py-3.2,1.8,C.ok);}else{r.line(px-3,py-3,px+3,py+3,1.8,C.warn);r.line(px-3,py+3,px+3,py-3,1.8,C.warn);}
  if(s.phase==='playing'&&c.id===s.heldCellId)hex(r,c.x,c.y,s.board.hexRadius-3,C.warm,2.5);
  if(s.phase==='playing'&&c.id===s.selectedId)hex(r,c.x,c.y,s.board.hexRadius+1,C.paper,2.8);
 });
 r.line(39,443,64,443,2.6,C.heat);r.text('ACTUAL HEAT TRACE',73,435,14,C.paper);r.line(297,443,322,443,1.3,C.cool);r.text('OTHER OUTLETS',331,435,14,C.muted);
}
function compass(r,s,c){
 center(r,'OUTLET PRIORITY 1 > 6',790,255,14,C.paper);const x=790,y=322;
 s.directions.forEach(d=>{const v=directionVector(d),active=c&&c.outletDirection===d.index,col=active?C.heat:C.cool;r.line(x+v.x*18,y+v.y*18,x+v.x*33,y+v.y*33,active?2.3:1,col);center(r,(d.index+1)+' '+d.label,x+v.x*52,y+v.y*48-8,16,col);});
 hex(r,x,y,18,'#8caaa8',1);center(r,c?material(s,c.material).glyph:'HEAT',x,y-8,c?17:13,C.paper);
}
function inspection(r,s){
 r.rect(640,66,290,393,'#192d3bec');outline(r,640,66,290,393,'#8fa5a5',1.2);
 const c=cell(s,s.selectedId)||(s.heldCellId?cell(s,s.heldCellId):null);
 if(c){const m=material(s,c.material),wanted=material(s,m.neighborMaterial);r.text(m.glyph+' / '+c.tileId,660,82,25,C.paper);r.text((s.selectedId==='forge'?'HELD AT ':'CELL ')+c.id+' / LOCAL RECIPE',660,116,14,C.muted);
  r.text('NEED '+wanted.glyph,660,143,19,rgb(wanted));r.text(c.actualCount+' / '+c.requiredCount,825,141,25,c.recipeMet?C.ok:C.warn);
  r.text(c.recipeMet?'EXACT COUNT MET':'EXACT COUNT NOT MET',660,179,15,c.recipeMet?C.ok:C.warn);
  s.materials.forEach((mat,j)=>r.text(mat.glyph+' '+c.neighborCounts[mat.id],660+j*87,205,16,rgb(mat)));
  r.text(c.role==='mold'?'MOLD / ABSORBS HEAT':c.outletCellId?'HEAT > '+material(s,m.heatTarget).glyph+' / EXIT '+(c.outletDirection+1)+' > '+c.outletCellId:'HEAT > '+material(s,m.heatTarget).glyph+' / BLOCKED',660,231,14,c.role==='mold'?C.ok:c.outletCellId?C.heat:C.warn);
 }else{
  r.text('FORGE CHECK',660,82,25,C.paper);r.text('RECIPES '+s.matchedCells+' / '+s.cells.length,660,122,20,s.allRecipesMet?C.ok:C.warn);r.text('HEAT '+s.heat.status.toUpperCase(),660,153,19,s.heat.delivered?C.ok:C.warn);
  s.materials.forEach((m,j)=>r.text(m.glyph+' : '+m.requiredCount+' '+material(s,m.neighborMaterial).glyph+' / HEAT > '+material(s,m.heatTarget).glyph,660,190+j*20,14,C.muted));
 }
 compass(r,s,c);
 const f=s.forge,x=f.x-125,y=f.y-28,selected=s.phase==='playing'&&s.selectedId===f.id;
 r.rect(x,y,250,56,s.goalReady?'#547368':'#3d4f58');outline(r,x,y,250,56,selected?C.paper:C.muted,selected?2.5:1);
 let title='FORGE / A SUBMIT';if(s.phase!=='playing')title=s.phase==='won'?'FORGE COMPLETE':'ROUND COMPLETE';else if(s.stage==='holding')title='FORGE / PLACE TILE FIRST';
 center(r,title,f.x,y+8,16,s.stage==='holding'&&s.phase==='playing'?C.warm:C.paper);center(r,'RECIPES '+s.matchedCells+'/'+s.cells.length+' + HEAT '+s.heat.status.toUpperCase(),f.x,y+33,13,C.paper);
}
function status(r,s){
 r.rect(28,477,902,53,'#192d3bf2');r.line(28,477,930,477,1,'#9cafab');let title,help;
 if(s.phase==='won'){title='RECIPES + HEAT ROUTE ACCEPTED';help='ALL CONDITIONS MET / ROUND COMPLETE';}
 else if(s.phase==='lost'){title=s.lostReason==='timeout'?'90 SECONDS COMPLETE':'THIRD REJECTED SUBMISSION';help='ROUND COMPLETE / ARRANGEMENT PRESERVED';}
 else if(s.stage==='holding'){title='HOLDING '+s.heldTileId+' AT '+s.heldCellId;help=s.selectedId==='forge'?'PLACE OR CANCEL BEFORE SUBMIT':s.selectedId===s.heldCellId?'A CANCEL PICK / B CANCEL':'A SWAP / B CANCEL - TILES STAY UNTIL COMMIT';}
 else if(s.selectedId==='forge'){title=s.goalReady?'READY FOR EXPLICIT CHECK':'REVIEW RECIPES AND HEAT';help=s.historyDepth?'A SUBMIT / B UNDO LAST SWAP':'A SUBMIT / NO SWAP TO UNDO';}
 else{title='SELECT '+s.selectedId;help=s.historyDepth?'A PICK TILE / B UNDO LAST SWAP':'A PICK TILE / NO SWAP TO UNDO';}
 r.text(title,45,486,18,s.phase==='lost'?C.warn:C.paper);r.text(help,45,512,13,C.muted);
 const ledger='ERRORS '+s.mistakes+' / '+s.maxMistakes;r.text(ledger,912-r.measureText(ledger,20),486,20,s.mistakes?C.warn:C.paper);
}
function scene(r,s){
 r.sprite('forge_workshop',480,270,960,540,0,'#fff');r.rect(0,0,960,53,'#172a38');r.text('ADJACENCY FORGE',25,15,24,C.paper);r.text('HEX ARRAY / '+String(s.level).padStart(2,'0'),729,23,14,C.muted);
 workshop(r,s);inspection(r,s);status(r,s);
}
root.GameDef={
 id:'adjacency-forge',title:'邻接铸造',tagline:'局部配方与导热方向，必须同时成立',seed:331,accent:'#d9bc90',background:'#2e414d',levelLabel:'工坊',levelNames:['环芯','斜岸','折列'],atlas,
 description:'方向选格，A 拿起后选另一格交换，B 取消或撤销。每块只核对指定邻材数量；按导热目标和 1–6 顺序检查炉源到铸模的热路。空手选 FORGE 按 A 提交，错三次或 90 秒到结束。',
 controls:{move:'方向键 / 摇杆 · 移动焦点',a:'拿起·交换·提交 / 空格',b:'取消 / 撤销 · B / 右下半屏'},actionLabels:['拿起 / 交换','取消 / 撤销'],
 tip:'拿起不移块。配方正确仍要检查热路；撤销不退用时和错误次数。',
 winTitle:'铸造条件齐备',loseTitle:'工坊待重排',
 result(s){if(s.phase==='won')return '局部配方全部符合，热流已抵达铸模。';if(s.lostReason==='timeout')return '90 秒已到。先核对邻材数量，再检查实际热路。';if(s.lastSubmission&&s.lastSubmission.reason==='heat')return '三次提交失败。配方已对，请检查热路出口。';if(s.lastSubmission&&s.lastSubmission.reason==='recipes')return '三次提交失败。热路已通，请核对邻材数量。';return '三次提交失败。邻材配方与热路都要符合。';},
 hud(s){return[
  {label:'配方满足',value:s.matchedCells+' / '+s.cells.length,tone:s.allRecipesMet?'':'warn'},
  {label:'实际热路',value:s.heat.status==='delivered'?'抵达铸模':s.heat.status==='loop'?'循环未达':'堵塞未达',tone:s.heat.delivered?'':'warn'},
  {label:'当前阶段',value:s.phase==='won'?'铸造通过':s.phase==='lost'?'本轮结束':s.stage==='holding'?'持块待交换':s.selectedId==='forge'?'准备提交':'选择金属块'},
  {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
 ];},render(r,s){scene(r,s);}
};
})(window);
