/* Weight Ledger: shared physical trays and exact public integer lever loads. */
(function(root){
'use strict';
/* Original one-time atlas paintings for the brass integer weighing workshop. */
function deskArt(c,w,h,a){
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#705641'],[.48,'#4e4237'],[1,'#302e29']]);c.fillRect(0,0,w,h);
 for(let plank=0;plank<4;plank++){
  const y=plank*h/4;c.fillStyle=plank%2?'#dcb07c09':'#211b190c';c.fillRect(0,y,w,h/4);
  c.strokeStyle='#1f221f91';c.lineWidth=2;c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();c.strokeStyle='#c19b702a';c.lineWidth=1;c.beginPath();c.moveTo(0,y+2);c.lineTo(w,y+2);c.stroke();
  for(let j=0;j<9;j++){const yy=y+5+j*5.6;c.strokeStyle=j%2?'#e0bb8214':'#241f1c22';c.lineWidth=.7;c.beginPath();c.moveTo(0,yy);c.bezierCurveTo(w*.25,yy+Math.sin(j)*5,w*.75,yy-6,w,yy+2);c.stroke();}
 }
 c.fillStyle=a.radial(c,w*.25,h*.15,w*.8,[[0,'#f2d29b20'],[1,'#1d251f18']]);c.fillRect(0,0,w,h);
}
function paperArt(c,w,h,a){
 c.fillStyle='#201f1d77';c.fillRect(6,7,w-8,h-9);
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#fff0ca'],[.55,'#eee1b8'],[1,'#d8cc9f']]);c.fillRect(2,2,w-8,h-8);
 c.strokeStyle='#faf3d8';c.lineWidth=1;c.strokeRect(4,4,w-12,h-12);
 c.strokeStyle='#8e9a7d20';c.lineWidth=.7;for(let y=19;y<h-13;y+=20){c.beginPath();c.moveTo(13,y);c.lineTo(w-14,y);c.stroke();}
 c.strokeStyle='#ae706a38';c.lineWidth=1;c.beginPath();c.moveTo(29,11);c.lineTo(29,h-13);c.stroke();
 for(let i=0;i<40;i++){const x=12+(i*73)%(w-30),y=10+(i*37)%(h-24);c.fillStyle=i%3?'#9b825f0a':'#fff8d725';c.fillRect(x,y,2,1)}
 c.strokeStyle='#c8b38266';c.lineWidth=1;c.beginPath();c.moveTo(w-25,h-10);c.quadraticCurveTo(w-13,h-25,w-10,h-31);c.stroke();
}
function trayArt(c,w,h,a){
 c.save();c.scale(w/256,h/160);
 a.ellipse(c,129,125,119,24,a.radial(c,129,125,123,[[0,'#121c1899'],[1,'#121c1800']]));
 a.path(c,[[13,22],[240,22],[251,35],[245,137],[230,149],[23,149],[7,134],[4,37]],a.linear(c,3,20,248,145,[[0,'#efd094'],[.2,'#b58b4a'],[.55,'#e0b66c'],[.75,'#82613a'],[1,'#b68e51']]),'#f1d494',1.5);
 a.path(c,[[21,29],[234,29],[242,39],[236,129],[225,137],[28,137],[17,127],[13,40]],a.linear(c,15,32,232,132,[[0,'#544f3d'],[.15,'#9a8555'],[.6,'#b09b62'],[1,'#665b40']]),'#614d2f',1.5);
 a.path(c,[[25,35],[230,35],[236,42],[230,120],[222,127],[31,127],[23,120],[19,43]],a.linear(c,0,30,0,130,[[0,'#878566'],[.48,'#9c9b77'],[1,'#6a7157']]));
 c.strokeStyle='#ead0969c';c.lineWidth=2;c.beginPath();c.moveTo(14,127);c.lineTo(9,38);c.lineTo(19,25);c.lineTo(235,25);c.stroke();
 c.strokeStyle='#e0c18a65';c.lineWidth=.7;for(let i=0;i<15;i++){const x=25+i*14;c.beginPath();c.moveTo(x,40);c.lineTo(x+4,119);c.stroke();}
 a.path(c,[[18,132],[237,132],[230,144],[25,144]],a.linear(c,0,132,0,145,[[0,'#e4c081'],[.3,'#c3a364'],[1,'#806338']]));
 [[20,26],[238,27],[21,137],[233,137]].forEach(([x,y])=>{a.ellipse(c,x,y,2.5,2.5,'#685033');a.ellipse(c,x-.4,y-.5,1.8,1.8,'#f4d594');c.strokeStyle='#816239';c.lineWidth=.8;c.beginPath();c.moveTo(x-1,y+1);c.lineTo(x+1,y-1);c.stroke()});c.restore();
}
function weightArt(c,w,h,a){
 c.save();c.scale(w/128,h/144);
 a.ellipse(c,65,127,55,11,a.radial(c,65,127,57,[[0,'#16221e91'],[1,'#16221e00']]));
 a.path(c,[[31,45],[96,45],[110,115],[107,126],[22,126],[18,116]],a.linear(c,20,0,110,0,[[0,'#263f3c'],[.2,'#708e7f'],[.39,'#c4cbb0'],[.53,'#879e8b'],[.85,'#36554e'],[1,'#203e38']]),'#a7b7a0',1.5);
 a.ellipse(c,64,46,33,9,a.linear(c,0,35,0,55,[[0,'#d0d2b5'],[.5,'#7f9984'],[1,'#48685a']]));
 a.path(c,[[47,27],[81,27],[84,46],[44,46]],a.linear(c,43,0,85,0,[[0,'#426758'],[.35,'#c9ceb0'],[.7,'#8fa58c'],[1,'#345746']]));
 a.ellipse(c,64,27,17,5,'#b6c6a2');a.ellipse(c,64,27,10,2.8,'#587b61');
 c.strokeStyle='#e3e4bf70';c.lineWidth=1.3;c.beginPath();c.moveTo(32,54);c.lineTo(25,115);c.moveTo(97,53);c.lineTo(107,113);c.stroke();
 a.ellipse(c,64,116,44,7,'#28483a63');c.fillStyle='#d4c995';c.fillRect(23,37,82,101);c.strokeStyle='#766f45';c.lineWidth=1;c.strokeRect(24,38,80,99);
 c.strokeStyle='#f7e6b499';c.lineWidth=1;c.beginPath();c.moveTo(25,121);c.lineTo(102,121);c.stroke();c.restore();
}
const C={ink:'#3f493a',paper:'#f2e3b8',muted:'#bdb995',gold:'#f2cb80',jade:'#abd3b4',red:'#edac90'};
const trayColors={A:'#a2c8b4',B:'#dfb780',C:'#a9bdce',bank:'#d0c9ad'};
const trayInks={A:'#305e4c',B:'#805b2f',C:'#405d79',bank:'#5c604b'};
const atlas={builtins:['shadow'],tiles:[
 {name:'ledger_desk',x:0,y:0,w:512,h:224,paint:deskArt},
 {name:'ledger_weight',x:512,y:0,w:128,h:192,paint:weightArt},
 {name:'ledger_tray',x:640,y:0,w:256,h:160,paint:trayArt},
 {name:'ledger_paper',x:0,y:800,w:384,h:224,paint:paperArt}
]};
function center(r,t,x,y,size,color){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function outline(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function signed(n){return n>0?'+'+n:String(n);}
function trayName(id){return id==='bank'?'BANK':id;}
function allocation(r,s){
 s.trays.forEach(t=>{
  const x=t.x-t.width/2,y=t.y-t.height/2,selected=s.phase==='playing'&&s.mode==='placing'&&s.selectedTrayId===t.id;
  r.sprite('ledger_tray',t.x,t.y,t.width,t.height,0,'#fff');
  r.rect(x+8,y-18,t.width-16,33,'#2d3c32');r.rect(x+9,y-17,t.id==='bank'?76:43,31,trayColors[t.id]);
  r.text(trayName(t.id),x+17,y-11,t.id==='bank'?18:23,trayInks[t.id]);
  r.text(t.totalMass+' g',x+(t.id==='bank'?96:67),y-11,23,C.paper);
  if(selected){outline(r,x-4,y-23,t.width+8,t.height+28,C.gold,3);r.rect(x+52,y+t.height-13,t.width-104,19,C.gold);center(r,'DESTINATION',t.x,y+t.height-11,13,'#4b482d');}
  if(!t.weightIds.length){center(r,t.isBank?'STORAGE EMPTY':'EMPTY PAN',t.x,t.y+4,15,'#e0d3a680');}
  const caption=t.isBank?'NOT IN EQUATIONS':'SHARED PAN '+t.id;
  center(r,caption,t.x,y+t.height+12,13,t.isBank?C.muted:trayColors[t.id]);
 });
 s.weights.forEach(w=>{
  const selected=s.phase==='playing'&&s.mode==='selecting'&&w.id===s.selectedWeightId,held=s.phase==='playing'&&w.id===s.heldWeightId;
  r.sprite('ledger_weight',w.x,w.y-3,50,50,0,'#fff');
  center(r,'#'+w.id,w.x,w.y-13,16,'#3d4c37');center(r,w.mass+'g',w.x,w.y+4,17,'#344832');
  if(selected||held){outline(r,w.x-26,w.y-23,52,47,held?C.gold:'#e2f1c8',2);r.circle(w.x-24,w.y-20,4,held?C.gold:'#e2f1c8');}
 });
}
function equationTokens(side){
 const tokens=[];side.terms.forEach(term=>{if(tokens.length)tokens.push({text:' + ',color:C.ink});if(term.coefficient!==1)tokens.push({text:term.coefficient+'*',color:C.ink});tokens.push({text:term.trayId,color:trayInks[term.trayId]});});
 if(side.constant||!tokens.length){if(tokens.length)tokens.push({text:side.constant<0?' - ':' + ',color:C.ink});tokens.push({text:String(tokens.length?Math.abs(side.constant):side.constant),color:C.ink});}
 return tokens;
}
function equations(r,s){
 s.scales.forEach((scale,index)=>{
  const x=560,y=80+index*126,w=378,h=117,flash=s.lastTransfer&&s.elapsed<s.lastTransfer.expiresAt&&s.lastTransfer.changedScaleIds.includes(scale.id);
  r.sprite('ledger_paper',x+w/2,y+h/2,w,h,0,'#fff');
  r.text('SCALE '+(index+1),x+17,y+10,14,C.ink);r.text(scale.balanced?'BALANCED':'UNBALANCED',x+222,y+10,14,scale.balanced?'#326848':'#8b5438');
  if(flash)outline(r,x+2,y+2,w-9,h-7,C.gold,2.5);
  const tokens=[...equationTokens(scale.left),{text:' = ',color:C.ink},...equationTokens(scale.right)];let tx=x+17;
  tokens.forEach(token=>{r.text(token.text,tx,y+35,20,token.color);tx+=r.measureText(token.text,20)});
  r.text('L '+scale.leftTotal,x+17,y+66,23,C.ink);r.text('R '+scale.rightTotal,x+125,y+66,23,C.ink);
  r.text('D '+signed(scale.delta),x+233,y+66,23,scale.balanced?'#326848':'#8b5438');
  r.text('WEIGHTED LOAD',x+17,y+95,12,'#737854');r.text('D = L - R',x+233,y+95,12,'#737854');
 });
}
function status(r,s){
 const selected=s.weights.find(w=>w.id===s.selectedWeightId),held=s.weights.find(w=>w.id===s.heldWeightId),active=s.phase==='playing';
 r.rect(24,476,912,49,'#25382fea');r.line(24,476,936,476,1,'#bdad7080');
 let first='SELECT #'+selected.id+' / '+selected.mass+'g / '+trayName(selected.trayId),second='A / PICK   B / '+(s.canUndo?'UNDO LAST MOVE':'NO MOVE TO UNDO'),tone=C.paper;
 if(s.phase==='won'){first='ALL SIX DEPLOYED / ALL THREE BALANCED';second='LEDGER COMPLETE';tone=C.jade;}
 else if(s.phase==='lost'){first=s.lostReason==='timeout'?'90 SECONDS COMPLETE':'MOVE BUDGET EXHAUSTED';second='ROUND COMPLETE / ALLOCATION PRESERVED';tone=C.red;}
 else if(held){first='PENDING #'+held.id+' / '+held.mass+'g / '+trayName(held.trayId)+' TO '+trayName(s.selectedTrayId);second='A / '+(held.trayId===s.selectedTrayId?'RETURN FREE':'COMMIT ONE MOVE')+'   B / CANCEL PICKUP';tone=C.gold;}
 r.text(first,39,484,16,tone);r.text(second,39,507,13,C.muted);
 if(active){const budget='MOVES '+s.movesRemaining+' / '+s.moveBudget;r.text(budget,936-r.measureText(budget,22)-18,490,22,s.movesRemaining<=1?C.red:C.paper);}
}
function scene(r,s){
 r.sprite('ledger_desk',480,270,960,540,0,'#fff');
 r.rect(0,0,960,53,'#26372fe8');r.line(0,53,960,53,1,'#c4a15c77');r.text('WEIGHT LEDGER',25,16,22,C.paper);r.text('INTEGER BRASSWORK / '+String(s.level).padStart(2,'0'),642,23,13,C.muted);
 allocation(r,s);equations(r,s);
 r.text('PAN = ACTUAL GRAMS',50,55,13,C.muted);r.text('2* = 2:1 LEVER RATIO',560,55,13,C.muted);
 status(r,s);
}
root.GameDef={
 id:'weight-ledger',title:'砝码账本',tagline:'共享托盘，联动多条平衡方程',seed:239,
 accent:'#d5ba7d',background:'#514638',levelLabel:'账页',levelNames:['初衡','配重','杠杆'],atlas,
 description:'方向选砝码，A 预选后用方向选目标盘，再按 A 搬运。共享盘会同时影响多条方程；2× 是杠杆系数。六个砝码全部出库且三秤平衡即完成。B 取消预选或撤销上一搬，时间不退。预算用尽仍未完成或 90 秒到即结束。',
 controls:{move:'方向键 / 摇杆 · 选砝码或目标盘',a:'预选 / 搬运 · 空格 / 确认 / 右上半屏',b:'取消预选 / 撤销 · B / 右下半屏'},actionLabels:['预选 / 搬运','取消 / 撤销'],
 tip:'同重砝码也有独立编号。预选不改盘重；B 取消或撤销，撤销退搬动数但不退时间。最后一搬会立即结算。',
 winTitle:'三秤合账',loseTitle:'账本待重算',
 result(s){if(s.phase==='won')return '六个砝码全部出库，三条方程同时平衡！使用 '+s.movesUsed+' 搬，撤销 '+s.undos+' 次，剩余 '+Math.ceil(s.remaining)+' 秒。';if(s.lostReason==='timeout')return '90 秒已到。核对共享盘和杠杆系数，再安排搬运。';return '预算已用尽。重试时可在耗尽前按 B 撤销。';},
 hud(s){return[
  {label:'搬动余量',value:s.movesRemaining+' / '+s.moveBudget,tone:s.movesRemaining<=1?'warn':''},
  {label:'平衡 / 出库',value:s.balancedCount+'/3 · '+s.deployedCount+'/6'},
  {label:'当前阶段',value:s.phase==='won'?'三秤合账':s.phase==='lost'?'本轮结束':s.mode==='placing'?'预选目标盘':'选择砝码'},
  {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
 ];},
 render(r,s){scene(r,s);}
};
})(window);
