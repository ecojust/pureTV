/* Parity Garden: public blossom bits, direct-water parity and clipped spray preview. */
(function(root){
'use strict';
function glassArt(c,w,h,a){
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#b8d7c4'],[.43,'#83b5a4'],[1,'#427d77']]);c.fillRect(0,0,w,h);
 a.path(c,[[0,0],[w*.6,0],[w*.24,h],[0,h]],'#f6ecc826');a.path(c,[[w*.75,0],[w,0],[w*.64,h],[w*.42,h]],'#f7f5d522');
 c.strokeStyle='#244f4f38';c.lineWidth=5;for(let i=-1;i<6;i++){c.beginPath();c.moveTo(i*w/4,-5);c.lineTo((i-1)*w/4,h+5);c.stroke();}c.strokeStyle='#dcebd18c';c.lineWidth=1.4;for(let i=-1;i<6;i++){c.beginPath();c.moveTo(i*w/4-2,-5);c.lineTo((i-1)*w/4-2,h+5);c.stroke();}
 c.strokeStyle='#d8e8cb55';c.lineWidth=2;c.beginPath();c.moveTo(0,h*.35);c.lineTo(w,h*.35);c.moveTo(0,h*.76);c.lineTo(w,h*.76);c.stroke();
 [[22,198],[462,185],[491,38]].forEach(([x,y],j)=>{for(let k=0;k<8;k++){const xx=x+Math.sin(k*2+j)*35,yy=y+Math.cos(k*3)*20;c.save();c.translate(xx,yy);c.rotate(k*.7);a.ellipse(c,0,0,17,6,a.linear(c,-18,-5,18,5,[[0,'#335f51'],[.5,'#7eaa78'],[1,'#3a755d']]));c.strokeStyle='#c3d7994d';c.lineWidth=.6;c.beginPath();c.moveTo(-14,0);c.lineTo(14,0);c.stroke();c.restore();}});
}
function tileArt(c,w,h,a){
 c.fillStyle='#17484844';c.fillRect(8,10,w-12,h-12);c.fillStyle=a.linear(c,0,0,w,h,[[0,'#eff0d4'],[.5,'#b6d0b7'],[1,'#83aba0']]);c.fillRect(3,3,w-9,h-10);
 c.strokeStyle='#f8f3dc';c.lineWidth=2;c.strokeRect(5,5,w-13,h-14);
 c.fillStyle=a.linear(c,0,12,0,h-10,[[0,'#507d73'],[.45,'#658c79'],[1,'#7b9b7c']]);c.fillRect(12,12,w-27,h-28);
 c.strokeStyle='#315e5a';c.lineWidth=2;c.beginPath();c.moveTo(12,h-17);c.lineTo(12,12);c.lineTo(w-16,12);c.stroke();
 for(let i=0;i<22;i++){const x=17+(i*31)%(w-37),y=18+(i*47)%(h-39);a.ellipse(c,x,y,1.3,.8,i%3?'#d1d8a31c':'#204b411a')}
 c.strokeStyle='#edf0c8b0';c.lineWidth=2;c.beginPath();c.moveTo(8,h-10);c.lineTo(w-10,h-10);c.lineTo(w-10,9);c.stroke();
}
function bloomArt(c,w,h,a){
 c.save();c.scale(w/128,h/128);a.ellipse(c,64,103,43,11,a.radial(c,64,103,47,[[0,'#1a4c4566'],[1,'#1a4c4500']]));
 a.path(c,[[64,111],[48,105],[29,94],[37,84],[55,90],[65,105]],a.linear(c,30,85,66,111,[[0,'#b5d89d'],[1,'#387b63']]),'#d6e5b166',1);
 a.path(c,[[61,111],[79,104],[102,86],[89,79],[71,89]],a.linear(c,67,105,98,81,[[0,'#35785f'],[1,'#b6d9a2']]),'#d6e5b166',1);
 for(let i=0;i<8;i++){const angle=i*Math.PI/4;c.save();c.translate(64,59);c.rotate(angle);a.ellipse(c,1,27,15,23,'#6d567c30');a.ellipse(c,0,24,14,23,a.linear(c,-13,4,12,47,[[0,'#d898b0'],[.5,'#f2bec9'],[1,'#fff0db']]),'#fce8d2');c.strokeStyle='#fff7dd8c';c.lineWidth=1;c.beginPath();c.moveTo(-7,25);c.quadraticCurveTo(-8,36,0,43);c.stroke();c.restore();}
 a.ellipse(c,64,59,17,17,'#a7825480');a.ellipse(c,64,57,15,15,a.radial(c,61,53,18,[[0,'#fff4b3'],[.55,'#e8c878'],[1,'#b48e53']]));
 for(let i=0;i<9;i++){const a1=i*2.4;a.ellipse(c,64+Math.cos(a1)*(4+i*.7),57+Math.sin(a1)*(4+i*.7),1.1,1.1,i%2?'#fff5ba':'#a5854b')}c.restore();
}
function budArt(c,w,h,a){
 c.save();c.scale(w/128,h/128);a.ellipse(c,64,105,31,9,a.radial(c,64,105,36,[[0,'#204f4a55'],[1,'#204f4a00']]));
 // Hollow petal silhouette and compact folded bud distinguish state0 by shape.
 for(let i=0;i<6;i++){c.save();c.translate(64,61);c.rotate(i*Math.PI/3);c.strokeStyle='#c2dbd3b3';c.lineWidth=2;c.beginPath();c.ellipse(0,24,12,20,0,0,Math.PI*2);c.stroke();c.restore();}
 c.strokeStyle='#bdd7ad';c.lineWidth=4;c.beginPath();c.moveTo(64,79);c.lineTo(64,109);c.stroke();
 a.path(c,[[64,103],[40,96],[34,83],[50,83],[64,97]],'#669780','#c6dfb0',1);a.path(c,[[64,105],[87,94],[92,81],[76,85],[64,98]],'#55917c','#b9dab0',1);
 a.path(c,[[64,87],[49,72],[47,54],[55,37],[64,28],[72,37],[81,54],[78,72]],a.linear(c,47,35,81,83,[[0,'#eff0df'],[.3,'#b6c3da'],[.65,'#8c9fbd'],[1,'#536f90']]),'#e1e9e0',1.5);
 c.strokeStyle='#e3e9df';c.lineWidth=1.5;c.beginPath();c.moveTo(64,31);c.quadraticCurveTo(56,60,64,84);c.moveTo(72,39);c.quadraticCurveTo(73,61,66,82);c.stroke();c.restore();
}
const atlas={builtins:['shadow'],tiles:[
 {name:'parity_glass',x:0,y:0,w:512,h:224,paint:glassArt},
 {name:'parity_bloom',x:512,y:0,w:128,h:128,paint:bloomArt},
 {name:'parity_bud',x:640,y:0,w:128,h:128,paint:budArt},
 {name:'parity_tile',x:768,y:0,w:128,h:128,paint:tileArt}
]};
const C={ink:'#284f4c',paper:'#f4efcf',mint:'#b4dfd3',gold:'#f5d391',pink:'#efb3c2',muted:'#b9d4bf'};
function center(r,t,x,y,size,color){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function outline(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function panel(r,x,y,w,h){r.rect(x+3,y+5,w,h,'#16484244');r.rect(x,y,w,h,'#315f59e8');outline(r,x,y,w,h,'#c3dfc3a6');}
function flower(r,open,x,y,size){r.sprite(open?'parity_bloom':'parity_bud',x,y,size,size,0,'#fff');}
function parityPips(r,x,y,met,small=false){const rad=small?2.3:3.3,space=small?6.5:9;r.circle(x-space/2,y,rad,met?C.gold:'#305951');r.circle(x+space/2,y,rad,met?C.gold:'#305951');if(!met){outline(r,x-space/2-rad,y-rad,rad*2,rad*2,C.gold,.8);outline(r,x+space/2-rad,y-rad,rad*2,rad*2,C.gold,.8);}}
function target(r,s){
 const v=s.targetView,k=v.cellSize;panel(r,38,84,220,360);r.text('TARGET PATTERN',54,100,17,C.paper);r.text('SAME CELL POSITIONS',54,127,12,C.muted);
 r.rect(v.x-5,v.y-5,k*4+10,k*4+10,'#d8e5cd');
 s.cells.forEach(c=>{const x=v.x+c.col*k,y=v.y+c.row*k;r.rect(x+1,y+1,k-2,k-2,'#699b8c');flower(r,c.targetOpen,x+k/2,y+k/2+2,k*.85);if(c.requiresEven)parityPips(r,x+k/2,y+5,true,true);});
 flower(r,true,77,350,38);r.text('OPEN / 1',105,343,17,C.paper);flower(r,false,77,395,38);r.text('CLOSED / 0',105,388,17,C.paper);
 parityPips(r,66,430,true);r.text('MARKED: OPEN + EVEN',82,424,12,C.gold);
}
function mainGarden(r,s){
 const g=s.grid,k=g.cellSize,w=k*g.cols,h=k*g.rows,preview=new Set(s.phase==='playing'?s.previewIds:[]);
 r.sprite('shadow',g.x+w/2,g.y+h/2+12,w+54,h+57,0,'#1b4d4866');r.rect(g.x-8,g.y-8,w+16,h+18,'#c3d9bf');outline(r,g.x-8,g.y-8,w+16,h+18,'#f6f1d8',1.5);
 s.cells.forEach(c=>{const x=c.x-k/2,y=c.y-k/2;r.sprite('parity_tile',c.x,c.y,k-2,k-2,0,'#fff');flower(r,c.open,c.x,c.y,52);
  if(c.requiresEven){r.rect(x+6,y+5,42,17,'#31564ee8');r.text('EVEN',x+9,y+5,13,C.gold);parityPips(r,x+k-17,y+13,c.conditionMet);}
  r.rect(c.x-28,y+k-23,56,19,'#e4e9cce8');center(r,c.directWaterCount+' '+(c.directParity===0?'E':'O'),c.x,y+k-22,16,c.directParity===0?'#325e54':'#7c4d63');
  if(preview.has(c.id))outline(r,x+3,y+3,k-7,k-7,'#bcf2e2',2);
  if(s.lastWater&&s.elapsed<s.lastWater.expiresAt&&s.lastWater.affectedIds.includes(c.id))outline(r,x+7,y+7,k-15,k-15,'#deedf3a6',1.5);
 });
 if(s.phase==='playing'){const p=s.cursor;outline(r,p.x-k/2+1,p.y-k/2+1,k-3,k-3,C.gold,3);r.circle(p.x-k/2+5,p.y-k/2+5,4,C.gold);}
 center(r,'LIVE GARDEN',g.x+w/2,68,18,C.paper);center(r,'BOTTOM BADGE = DIRECT COUNT + E / O',g.x+w/2,427,12,C.paper);
}
function information(r,s){
 panel(r,650,84,280,360);r.text(s.nozzle==='cross'?'CROSS NOZZLE':'DIAGONAL NOZZLE',667,100,18,C.paper);
 const cursor=s.cells[s.selectedId],active=new Set(s.previewIds),size=27,cx=720,cy=174;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  const col=cursor.col+dx,row=cursor.row+dy;if(col<0||col>=s.grid.cols||row<0||row>=s.grid.rows)continue;
  const id=row*s.grid.cols+col,x=cx+dx*size,y=cy+dy*size;r.rect(x-11,y-11,22,22,active.has(id)?'#b2dfca':'#547d6d');if(id===s.selectedId)outline(r,x-11,y-11,22,22,C.gold,2);
 }
 r.text('HERE',790,143,13,C.muted);r.text(s.previewIds.length+' TILES',790,164,20,C.paper);r.text('NO WRAP',790,192,13,C.muted);
 r.line(667,222,912,222,1,'#adcfb5aa');
 r.text('SELECTED '+String.fromCharCode(65+cursor.col)+(cursor.row+1),667,236,15,C.muted);
 r.text('DIRECT '+cursor.directWaterCount,667,261,25,C.paper);r.text(cursor.directParity===0?'EVEN':'ODD',834,268,18,cursor.directParity===0?C.mint:C.pink);
 r.text(cursor.requiresEven?'NEEDS OPEN + EVEN':'NO PARITY REQUIREMENT',667,303,14,cursor.requiresEven?C.gold:C.muted);
 if(cursor.requiresEven)r.text(cursor.conditionMet?'CONDITION MET':'CONDITION NOT MET',667,326,14,cursor.conditionMet?C.mint:C.pink);
 r.text('0 COUNTS AS EVEN',667,361,15,C.paper);r.text('NEIGHBORS FLIP FLOWERS,',667,391,13,C.muted);r.text('NOT DIRECT COUNTS.',667,414,13,C.muted);
}
function status(r,s){
 r.rect(38,466,892,59,'#2a5552ed');r.line(38,466,930,466,1,'#bfd9c3');
 let head='A / WATER PREVIEWED CELLS',note='B / SWITCH NOZZLE - FREE, NO UNDO',tone=C.paper;
 if(s.phase==='won'){head='PATTERN + MARKED CONDITIONS MATCH';note='GARDEN COMPLETE';tone=C.mint;}
 else if(s.phase==='lost'){head=s.lostReason==='timeout'?'90 SECONDS COMPLETE':'WATER SUPPLY EXHAUSTED';note='ROUND COMPLETE / GARDEN PRESERVED';tone=C.pink;}
 r.text(head,54,476,17,tone);r.text(note,54,502,13,C.muted);
 const water='WATER '+s.waterRemaining+' / '+s.waterBudget;r.text(water,912-r.measureText(water,24),482,24,s.waterRemaining<=1?C.pink:C.paper);
}
function scene(r,s){
 r.sprite('parity_glass',480,270,960,540,0,'#fff');r.rect(0,0,960,53,'#28544fe8');r.line(0,53,960,53,1,'#cce1bb88');r.text('PARITY GARDEN',25,16,22,C.paper);r.text('GLASSHOUSE / '+String(s.level).padStart(2,'0'),736,23,13,C.muted);
 target(r,s);mainGarden(r,s);information(r,s);status(r,s);
}
root.GameDef={
 id:'parity-garden',title:'奇偶花圃',tagline:'切换花开花合，核对每一次直接浇水',seed:251,
 accent:'#b7d8bc',background:'#76a998',levelLabel:'花圃',levelNames:['初芽','斜雨','合景'],atlas,
 description:'方向选格，A 翻转当前喷头预览的花朵；只有选中格增加直浇次数。B 免费切换十字或斜角喷头，不撤销。花形须匹配左图，EVEN 标记格还须开放且直浇偶数次，0 也算偶数。水尽或 90 秒到结束。',
 controls:{move:'方向键 / 摇杆 · 选择花格',a:'浇水一次 · 空格 / 确认 / 右上半屏',b:'切换喷头 · B / 右下半屏'},actionLabels:['浇水','切喷头'],
 tip:'E 偶数、O 奇数，只数直接浇水。标记格须开放且为 E。同格同喷头浇两次可还原花形，但耗两滴水。',
 winTitle:'花圃成景',loseTitle:'花圃待再育',
 result(s){if(s.phase==='won')return '花形与奇偶均符合！用水 '+s.waterUsed+' 滴，余 '+Math.ceil(s.remaining)+' 秒。';if(s.lostReason==='timeout')return '90 秒已到。核对目标花形、EVEN 条件和喷头范围。';return '水滴已耗尽。邻格只翻花形，直浇才改变该格奇偶；重试时同时核对两项。';},
 hud(s){return[
  {label:'剩余水滴',value:s.waterRemaining+' / '+s.waterBudget,tone:s.waterRemaining<=1?'warn':''},
  {label:'花形 / 标记',value:s.matchedCells+'/16 · '+s.satisfiedMarked+'/'+s.markedCount},
  {label:'当前喷头',value:s.phase==='won'?'花圃成景':s.phase==='lost'?'本轮结束':s.nozzle==='cross'?'十字喷头':'斜角喷头'},
  {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
 ];},render(r,s){scene(r,s);}
};
})(window);
