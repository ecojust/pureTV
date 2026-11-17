/* Number Dunes: actual physical stones, public snake reading and exact target gaps. */
(function(root){
'use strict';
// Fixed original relief paintings. No puzzle state or target arrangement is baked here.
function sandArt(c,w,h,a){
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#dec7a0'],[.48,'#c6a680'],[1,'#a87e5c']]);c.fillRect(0,0,w,h);
 for(let j=0;j<6;j++){const y=h*(.15+j*.17);c.beginPath();c.moveTo(0,y);c.bezierCurveTo(w*.3,y-36,w*.58,y+39,w,y-12);c.lineTo(w,h);c.lineTo(0,h);c.closePath();c.fillStyle=j%2?'#f4ddb22a':'#996c4c13';c.fill();c.strokeStyle='#fff0d022';c.lineWidth=.8;c.stroke();}
 c.strokeStyle='#7f624520';c.lineWidth=.5;for(let i=0;i<150;i++){const x=(i*67+11)%w,y=(i*43+13)%h;c.beginPath();c.moveTo(x,y);c.lineTo(x+3+(i%5),y-.5);c.stroke();}
 c.fillStyle=a.radial(c,w*.22,h*.15,w*.7,[[0,'#fff2ca24'],[1,'#603e3512']]);c.fillRect(0,0,w,h);
}
function stoneArt(c,w,h,a){
 c.save();c.scale(w/128,h/128);a.path(c,[[20,17],[108,16],[117,30],[114,108],[99,119],[17,115],[10,103],[11,29]],'#543e3447');
 a.path(c,[[19,9],[106,11],[116,25],[112,104],[99,114],[18,109],[9,95],[11,25]],a.linear(c,10,8,112,114,[[0,'#fff0cf'],[.48,'#cfaf84'],[1,'#93694b']]),'#9c7854',1);
 a.path(c,[[20,9],[106,11],[99,21],[25,20],[19,91],[9,95],[11,25]],'#f9e2b7');a.path(c,[[116,25],[112,104],[99,114],[99,99],[104,29]],'#9b7754');
 a.path(c,[[25,20],[99,21],[104,29],[99,99],[24,97],[19,91]],a.linear(c,20,15,100,100,[[0,'#ead3aa'],[.4,'#dfc096'],[1,'#c9a87f']]),'#f6e2bc',1.2);
 c.strokeStyle='#8f72531c';c.lineWidth=.7;for(let i=0;i<15;i++){const y=29+i*4.5;c.beginPath();c.moveTo(23,y);c.lineTo(100,y-1.8);c.stroke();}
 a.path(c,[[29,23],[60,23],[24,58],[22,49]],'#fff3d328');a.path(c,[[90,96],[100,86],[99,99],[85,100]],'#8b684a4d');c.restore();
}
function pillarArt(c,w,h,a){
 c.save();c.scale(w/128,h/128);a.path(c,[[28,17],[93,13],[117,40],[112,107],[83,122],[17,113],[8,91],[10,42]],'#493f3a54');
 a.path(c,[[28,8],[91,10],[111,32],[107,94],[82,112],[20,103],[11,85],[14,34]],'#716c5b','#514f45',1.2);
 a.path(c,[[28,8],[91,10],[111,32],[91,43],[28,39],[14,34]],a.linear(c,20,5,96,44,[[0,'#b6ac8b'],[1,'#96947b']]),'#d0c19b',1);
 a.path(c,[[28,39],[91,43],[82,112],[20,103],[11,85],[14,34]],a.linear(c,17,33,89,108,[[0,'#9e9679'],[1,'#625f52']]),'#4d5147',1);
 a.path(c,[[91,43],[111,32],[107,94],[82,112]],'#565b50');a.path(c,[[49,41],[54,64],[44,78],[53,98]],null,'#444e4388',2);
 c.strokeStyle='#dfd2af35';c.lineWidth=1;for(let i=0;i<5;i++){c.beginPath();c.moveTo(23,50+i*10);c.lineTo(82,53+i*10);c.stroke();}c.restore();
}
function slotArt(c,w,h,a){
 c.save();c.scale(w/128,h/128);c.fillStyle=a.linear(c,0,0,128,128,[[0,'#987552'],[.15,'#b59168'],[1,'#d3b38b']]);c.fillRect(0,0,128,128);
 c.strokeStyle='#f4d9ac94';c.lineWidth=2;c.beginPath();c.moveTo(1,127);c.lineTo(127,127);c.lineTo(127,1);c.stroke();c.strokeStyle='#71543e88';c.beginPath();c.moveTo(1,126);c.lineTo(1,1);c.lineTo(126,1);c.stroke();
 for(let i=0;i<17;i++){const x=10+(i*37)%108,y=9+(i*23)%110;a.ellipse(c,x,y,.6+(i%2)*.4,.45,'#6b4e3b32');}
 c.strokeStyle='#f4d4a339';c.lineWidth=.7;for(let i=0;i<4;i++){const y=22+i*24;c.beginPath();c.moveTo(12,y);c.quadraticCurveTo(68,y-8,115,y+2);c.stroke();}c.restore();
}
function controlArt(c,w,h,a){
 c.save();c.scale(w/128,h/128);a.path(c,[[24,8],[105,9],[115,23],[111,114],[21,118],[11,104],[12,23]],'#59463754');
 a.path(c,[[22,6],[103,7],[113,21],[108,105],[22,109],[11,96],[13,22]],a.linear(c,10,7,113,110,[[0,'#f2dcb4'],[.25,'#cba97c'],[1,'#8b684b']]),'#775d46',1.4);
 a.path(c,[[24,16],[99,17],[103,27],[99,95],[24,97],[20,89]],'#b99a71','#e4c79b',1);c.restore();
}
const atlas={builtins:[],tiles:[
 {name:'dune_sand',x:0,y:0,w:512,h:224,paint:sandArt},
 {name:'dune_stone',x:512,y:0,w:128,h:128,paint:stoneArt},
 {name:'dune_pillar',x:640,y:0,w:128,h:128,paint:pillarArt},
 {name:'dune_slot',x:768,y:0,w:128,h:128,paint:slotArt},
 {name:'dune_control',x:896,y:0,w:128,h:128,paint:controlArt}
]};
const C={ink:'#523e30',paper:'#fff0cf',muted:'#dfcaaa',guide:'#557c80',ok:'#acd5b9',warn:'#f5b4a1',line:'#f7e3ab'};
const vectors={W:{x:-1,y:0},E:{x:1,y:0},N:{x:0,y:-1},S:{x:0,y:1}},names={W:'WEST',E:'EAST',N:'NORTH',S:'SOUTH'};
function center(r,t,x,y,size,color){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function outline(r,x,y,w,h,color,width=1.4){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function cell(s,id){return s.cells.find(c=>c.id===id);}
function arrow(r,x,y,d,color,width=2.4,length=12){const v=vectors[d],tip={x:x+v.x*length*.5,y:y+v.y*length*.5};r.line(x-v.x*length*.5,y-v.y*length*.5,tip.x,tip.y,width,color);r.line(tip.x-v.x*5-v.y*4,tip.y-v.y*5+v.x*4,tip.x,tip.y,width,color);r.line(tip.x-v.x*5+v.y*4,tip.y-v.y*5-v.x*4,tip.x,tip.y,width,color);}
function corners(r,x,y,size,color){const d=size*.5,k=10;for(const sx of[-1,1])for(const sy of[-1,1]){r.line(x+sx*d,y+sy*d,x+sx*(d-k),y+sy*d,1.8,color);r.line(x+sx*d,y+sy*d,x+sx*d,y+sy*(d-k),1.8,color);}}
function readGuide(r,s){
 const off=s.grid.cellSize*.5-4;
 for(let i=0;i<s.snakeOrder.length-1;i++){const a=cell(s,s.snakeOrder[i]),b=cell(s,s.snakeOrder[i+1]),y=a.y+off,yy=b.y+off;if(a.row===b.row){r.line(a.x,y,b.x,yy,1.1,C.guide);arrow(r,(a.x+b.x)*.5,y,a.x<b.x?'E':'W',C.guide,1.4,8);}else{const outside=a.col===0?s.grid.x-8:s.grid.x+s.grid.cols*s.grid.cellSize+8;r.line(a.x,y,outside,y,1.1,C.guide);r.line(outside,y,outside,yy,1.1,C.guide);r.line(outside,yy,b.x,yy,1.1,C.guide);arrow(r,outside,(y+yy)*.5,'S',C.guide,1.4,8);}}
}
function stonePosition(s,stone){
 const at=cell(s,stone.cellId),tr=s.phase==='playing'?s.transition:null,m=tr&&tr.moves.find(v=>v.stoneId===stone.id);if(!m)return{x:at.x,y:at.y};
 const a=cell(s,m.fromCellId),b=cell(s,m.toCellId),p=Math.max(0,Math.min(1,(s.elapsed-tr.startedAt)/tr.duration)),t=p*p*(3-2*p);
 return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}
function board(r,s){
 const g=s.grid;r.rect(g.x-9,g.y-9,g.cols*g.cellSize+18,g.rows*g.cellSize+18,'#71523db8');
 s.cells.forEach(c=>r.sprite('dune_slot',c.x,c.y,g.cellSize,g.cellSize,0,'#fff'));
 const selected=s.actions.find(a=>a.id===s.selectedId),line=s.lines.find(l=>l.id===selected.lineId);
 if(s.phase==='playing')line.segments.forEach(ids=>{const a=cell(s,ids[0]),b=cell(s,ids.at(-1)),x=Math.min(a.x,b.x)-34,y=Math.min(a.y,b.y)-34;outline(r,x,y,Math.abs(a.x-b.x)+68,Math.abs(a.y-b.y)+68,'#ffedbb',1.7);});
 readGuide(r,s);
 s.cells.forEach(c=>{if(c.kind==='pillar'){r.sprite('dune_pillar',c.x,c.y,66,66,0,'#fff');for(let i=0;i<3;i++)r.line(c.x-11+i*7,c.y-8,c.x-16+i*7,c.y+3,2,'#d6c9a4');center(r,'ROCK',c.x,c.y+14,13,'#edddbc');}else if(!c.stoneId){r.circle(c.x,c.y,2,'#e9cca083');r.circle(c.x+7,c.y+3,1.2,'#7054425e');}});
 s.stones.forEach(stone=>{const p=stonePosition(s,stone);r.sprite('dune_stone',p.x,p.y,66,66,0,'#fff');center(r,String(stone.value),p.x+.7,p.y-21.3,34,'#f9e7c5');center(r,String(stone.value),p.x,p.y-22,34,C.ink);r.rect(p.x-20,p.y+13,40,17,'#e1c59e');center(r,stone.id,p.x,p.y+13,16,'#70523c');});
 s.cells.forEach(c=>{if(c.targetHole)corners(r,c.x,c.y,64,c.stoneId?'#824c39':'#edf0c7');});
 s.actions.forEach(a=>{const selected=s.phase==='playing'&&a.id===s.selectedId;r.sprite('dune_control',a.x,a.y,40,46,0,'#fff');if(selected)outline(r,a.x-18,a.y-21,36,42,C.paper,2.4);arrow(r,a.x,a.y-5,a.direction,selected?'#fff0c5':C.ink,2.5,15);center(r,a.id.slice(0,2),a.x,a.y+7,13,selected?C.paper:C.ink);});
 r.line(95,495,117,495,1.4,C.guide);arrow(r,106,495,'E',C.guide,1.4,9);r.text('SNAKE / SKIP GAPS + ROCK',125,489,13,C.ink);
}
function check(r,x,y,good){r.circle(x,y,6.5,'#392e26');if(good){r.line(x-3,y,x-.5,y+2.5,1.8,C.ok);r.line(x-.5,y+2.5,x+3.5,y-3,1.8,C.ok);}else{r.line(x-3,y-3,x+3,y+3,1.7,C.warn);r.line(x-3,y+3,x+3,y-3,1.7,C.warn);}}
function reading(r,s){
 r.text('SNAKE READING',607,79,20,C.paper);
 s.readValues.forEach((value,i)=>{const x=608+i*39;r.rect(x,112,31,55,'#dcc59d');center(r,String(value),x+15.5,115,26,C.ink);center(r,s.readStoneIds[i],x+15.5,146,13,'#73553e');if(i<s.readValues.length-1)center(r,value<s.readValues[i+1]?'<':'!',x+35,119,15,value<s.readValues[i+1]?C.ok:C.warn);});
 r.text('ORDER',608,184,14,C.muted);r.text('TARGET GAPS',775,184,14,C.muted);check(r,738,192,s.strictlyIncreasing);check(r,909,192,s.holesCorrect);
 r.text(s.orderedPairs+' / '+s.orderPairCount,608,207,26,s.strictlyIncreasing?C.ok:C.paper);r.text(s.matchedHoleCount+' / '+s.targetHoleCount,775,207,26,s.holesCorrect?C.ok:C.paper);
 r.text('BOTH CHECKS REQUIRED',607,244,14,C.muted);
}
function inspection(r,s){
 r.rect(587,65,345,431,'#655343ed');outline(r,587,65,345,431,'#e7cfa6',1.2);reading(r,s);
 const a=s.actions.find(v=>v.id===s.selectedId),line=s.lines.find(l=>l.id===a.lineId);
 r.line(607,272,912,272,1,'#c9af875c');r.text((line.axis==='row'?'ROW ':'COLUMN ')+(line.index+1)+' / '+names[a.direction],607,287,22,C.paper);
 if(s.phase==='playing'){
  r.text(s.preview.changed?'NEXT: MOVES '+s.preview.movedCount+' STONES':'NEXT: NO CHANGE / FREE',607,324,18,s.preview.changed?C.paper:C.ok);
  r.text(s.preview.moves.length?s.preview.moves.map(m=>m.stoneId).join('  '):'NO STONE MOVES',607,351,16,C.muted);
  const p=s.preview;let hint='A COMPACT / KEEP SEGMENT ORDER';if(p.willExhaustMoves)hint='LAST MOVE / GOAL WOULD NOT MATCH';else if(p.willWin)hint='ORDER + GAPS WOULD MATCH';else if(!p.changed)hint='NO MOVE OR HISTORY CHARGE';
  r.text(hint,607,381,13,p.willExhaustMoves?C.warn:p.willWin?C.ok:C.muted);
 }else{r.text(s.phase==='won'?'ORDER + GAPS ACCEPTED':'ROUND COMPLETE',607,324,18,s.phase==='won'?C.ok:C.paper);r.text('FINAL STONE POSITIONS',607,354,15,C.muted);}
 r.text('UNDO '+s.undos+' / HISTORY '+s.historyDepth,607,416,16,C.muted);
 corners(r,620,464,19,'#e9e6be');r.text('MARKED GAP / EXACT TARGET',641,456,14,C.paper);
}
function status(r,s){
 r.rect(28,506,904,29,'#6d5140ee');let text;
 if(s.phase==='won')text='SNAKE ORDER + TARGET GAPS COMPLETE';
 else if(s.phase==='lost')text=s.lostReason==='moves'?'COMPACTION LIMIT REACHED':'90 SECONDS COMPLETE';
 else if(s.transition)text=(s.transition.kind==='undo'?'RESTORED ':'MOVED ')+s.transition.moves.map(m=>m.stoneId).join(' ');
 else text=s.historyDepth?'A COMPACT / B UNDO - MOVES STAY SPENT':'A COMPACT / NO EDIT TO UNDO';
 r.text(text,43,512,16,s.phase==='lost'?C.warn:C.paper);const used='MOVES '+s.movesUsed+'/'+s.moveLimit;r.text(used,914-r.measureText(used,18),511,18,C.paper);
}
function scene(r,s){r.sprite('dune_sand',480,270,960,540,0,'#fff');r.rect(0,0,960,53,'#72523e');r.text('NUMBER DUNES',25,15,25,C.paper);r.text('WIND TABLE / '+String(s.level).padStart(2,'0'),733,23,14,C.muted);board(r,s);inspection(r,s);status(r,s);}
root.GameDef={
 id:'number-dunes',title:'沙丘数列',tagline:'顺着风纹读数，留出指定空洞',seed:359,accent:'#d9bd94',background:'#c5a17b',levelLabel:'沙盘',levelNames:['初序','岩隙','双向'],atlas,
 description:'方向选择行列箭头，A 压实，B 撤销。岩柱分隔的每段各自压紧，石块不合并。跳过空位与岩柱，按蛇形读序严格递增，并留出全部标记空洞。无效压实免费，撤销不退步数。',
 controls:{move:'方向键 / 摇杆 · 选箭头',a:'压实行列 / 空格',b:'撤销 / B · 不退步数'},actionLabels:['压实','撤销'],
 tip:'按蛇形递增，空洞须对位。撤销不退步数。',winTitle:'沙丘数列排妥',loseTitle:'沙盘待重排',
 result(s){if(s.phase==='won')return '数列严格递增，标记空洞全部对位。';if(s.lostReason==='timeout')return '90 秒已到。先看读序，再安排空洞。';return '步数用尽。核对读序与空洞，再重新安排。';},
 hud(s){return[
  {label:'剩余压实',value:s.movesRemaining+' / '+s.moveLimit,tone:s.movesRemaining<=1&&s.phase!=='won'?'warn':''},
  {label:'递增比较',value:s.orderedPairs+' / '+s.orderPairCount,tone:s.strictlyIncreasing?'':'warn'},
  {label:s.phase==='won'?'排列完成':s.phase==='lost'?'本轮结束':'空洞对位',value:s.matchedHoleCount+' / '+s.targetHoleCount,tone:s.holesCorrect?'':'warn'},
  {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
 ];},render(r,s){scene(r,s);}
};
})(window);
