/* Arrow Harvest: clay beds, fixed public arrows, actual seeds and atomic batch diagnostics. */
(function(root){
'use strict';
function paperArt(c,w,h,a){
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#f5ead0'],[.45,'#e7d4ad'],[1,'#c2b28e']]);c.fillRect(0,0,w,h);
 c.strokeStyle='#927f5e11';c.lineWidth=.65;for(let i=0;i<130;i++){const x=(i*71)%w,y=(i*43)%h;c.beginPath();c.moveTo(x,y);c.lineTo(x+5,y+1);c.stroke();}
 c.fillStyle=a.radial(c,w*.22,h*.08,w*.8,[[0,'#fffbe736'],[1,'#a49a7010']]);c.fillRect(0,0,w,h);
 c.strokeStyle='#fffae337';c.lineWidth=1;for(let i=0;i<8;i++){c.beginPath();c.moveTo(0,17+i*29);c.bezierCurveTo(w*.3,i*29,w*.68,31+i*29,w,16+i*29);c.stroke();}
}
function bedArt(kind){return function(c,w,h,a){
 c.save();c.scale(w/128,h/128);a.path(c,[[9,14],[116,13],[124,24],[121,120],[14,125],[3,114],[4,26]],'#4d463237');
 a.path(c,[[12,6],[114,8],[121,19],[119,108],[109,119],[12,117],[4,107],[6,20]],a.linear(c,5,6,115,119,[[0,'#e0b789'],[.4,'#a37a50'],[1,'#76573d']]),'#816441',1);
 a.path(c,[[12,6],[114,8],[106,18],[19,17],[16,99],[4,107],[6,20]],'#eacb9b');a.path(c,[[114,8],[121,19],[119,108],[109,119],[108,22]],'#87633f');
 c.fillStyle=kind==='source'?'#93a8a0':kind==='stop'?'#b6bb9a':kind==='forbidden'?'#867d68':'#bd9a6b';c.fillRect(17,18,91,87);
 c.save();c.beginPath();c.rect(17,18,91,87);c.clip();c.strokeStyle=kind==='forbidden'?'#645d4f':'#826d4b';c.lineWidth=3;
 for(let i=0;i<6;i++){const y=25+i*15;c.beginPath();c.moveTo(13,y);c.bezierCurveTo(42,y-3,78,y+4,114,y);c.stroke();c.beginPath();c.moveTo(14,y+3);c.lineTo(114,y+3);c.strokeStyle=kind==='forbidden'?'#a0987b':'#dec49a';c.lineWidth=1.3;c.stroke();c.strokeStyle=kind==='forbidden'?'#645d4f':'#826d4b';c.lineWidth=3;}
 if(kind==='forbidden')for(let i=0;i<7;i++){const x=22+(i*29)%76,y=26+(i*43)%66;a.path(c,[[x-7,y],[x-3,y-6],[x+7,y-4],[x+9,y+3],[x+2,y+7]],i%2?'#b1a990':'#686d5c','#d0c9ad',.7);}
 if(kind==='source'){c.fillStyle='#5d8180';c.fillRect(21,20,83,9);c.fillRect(21,94,83,8);for(const x of[26,99])for(const y of[24,98])a.ellipse(c,x,y,2.4,2.4,'#e4e4c9');}
 if(kind==='stop'){a.path(c,[[23,39],[100,39],[93,87],[31,87]],'#617d77','#d4dcc6',2);a.path(c,[[28,43],[95,43],[87,76],[36,76]],'#b4bba0');for(let i=0;i<5;i++){c.strokeStyle='#76876b';c.lineWidth=2;c.beginPath();c.moveTo(38+i*10,47);c.lineTo(41+i*9,72);c.stroke();}}
 c.restore();c.restore();
};}
function grainArt(c,w,h,a){
 c.save();c.scale(w/96,h/128);a.ellipse(c,49,100,24,8,'#3d49312b');
 c.beginPath();c.moveTo(49,9);c.bezierCurveTo(84,29,89,68,67,97);c.bezierCurveTo(57,109,39,111,25,97);c.bezierCurveTo(7,73,14,35,49,9);c.closePath();c.fillStyle=a.linear(c,19,14,76,105,[[0,'#fff2b9'],[.35,'#e9bd5d'],[1,'#a87b36']]);c.fill();c.strokeStyle='#fff0b2';c.lineWidth=3;c.stroke();
 c.beginPath();c.moveTo(50,17);c.bezierCurveTo(42,46,43,72,50,98);c.strokeStyle='#8e6c333f';c.lineWidth=3;c.stroke();c.beginPath();c.moveTo(33,34);c.quadraticCurveTo(21,57,27,76);c.strokeStyle='#fff7d6b0';c.lineWidth=5;c.lineCap='round';c.stroke();c.restore();
}
function sproutArt(c,w,h,a){
 c.save();c.scale(w/96,h/128);a.ellipse(c,48,111,29,6,'#3c56312b');c.strokeStyle='#547a37';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(48,110);c.quadraticCurveTo(43,71,51,21);c.stroke();
 a.path(c,[[46,84],[22,69],[12,39],[33,48],[47,69]],a.linear(c,15,35,49,85,[[0,'#b8cf75'],[1,'#4c8038']]),'#6b913f',1);
 a.path(c,[[50,65],[65,39],[86,24],[82,53],[59,78]],a.linear(c,49,24,85,79,[[0,'#9bc660'],[1,'#4c7a36']]),'#709447',1);
 c.strokeStyle='#d3dd8e';c.lineWidth=1.2;c.beginPath();c.moveTo(20,47);c.lineTo(43,75);c.moveTo(77,35);c.lineTo(54,69);c.stroke();c.restore();
}
function dialArt(c,w,h,a){c.save();c.scale(w/128,h/128);a.ellipse(c,64,69,55,51,'#463e3030');a.ellipse(c,64,62,54,54,a.linear(c,20,8,103,114,[[0,'#f6ddb0'],[.45,'#c8a56f'],[1,'#8b734a']]));a.ellipse(c,64,61,44,44,'#e8d2a1');c.strokeStyle='#9c8053';c.lineWidth=2;c.beginPath();c.arc(64,61,43,0,Math.PI*2);c.stroke();for(let i=0;i<8;i++){const t=i*Math.PI/4;c.strokeStyle='#f8e8bc';c.lineWidth=2;c.beginPath();c.moveTo(64+Math.cos(t)*47,61+Math.sin(t)*47);c.lineTo(64+Math.cos(t)*51,61+Math.sin(t)*51);c.stroke();}c.restore();}
const atlas={builtins:[],tiles:[
 {name:'harvest_paper',x:0,y:0,w:512,h:224,paint:paperArt},
 {name:'harvest_field',x:512,y:0,w:128,h:128,paint:bedArt('field')},
 {name:'harvest_source',x:640,y:0,w:128,h:128,paint:bedArt('source')},
 {name:'harvest_stop',x:768,y:0,w:128,h:128,paint:bedArt('stop')},
 {name:'harvest_forbidden',x:896,y:0,w:128,h:128,paint:bedArt('forbidden')},
 {name:'harvest_seed',x:0,y:224,w:96,h:128,paint:grainArt},
 {name:'harvest_sprout',x:96,y:224,w:96,h:128,paint:sproutArt},
 {name:'harvest_dial',x:192,y:224,w:128,h:128,paint:dialArt}
]};
const INK='#344348',PAPER='#f6ebce',MUTED='#d0d4bc',GOOD='#b4d385',BAD='#efad8e',DIR={N:{x:0,y:-1},E:{x:1,y:0},S:{x:0,y:1},W:{x:-1,y:0}},NAMES={N:'NORTH',E:'EAST',S:'SOUTH',W:'WEST'};
function center(r,text,x,y,size,color){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
function cell(s,id){return s.cells.find(c=>c.id===id);}
function seedAnchor(c){return{x:c.x+26,y:c.y-24};}
function box(r,x,y,w,h,color,line=1.5){r.line(x,y,x+w,y,line,color);r.line(x+w,y,x+w,y+h,line,color);r.line(x+w,y+h,x,y+h,line,color);r.line(x,y+h,x,y,line,color);}
function corners(r,c,color){const d=38,k=11;for(const x of[-1,1])for(const y of[-1,1]){r.line(c.x+x*d,c.y+y*d,c.x+x*(d-k),c.y+y*d,2.4,color);r.line(c.x+x*d,c.y+y*d,c.x+x*d,c.y+y*(d-k),2.4,color);}}
function arrow(r,x,y,d,color){const v=DIR[d],tx=x+v.x*14,ty=y+v.y*14;r.line(x-v.x*14,y-v.y*14,tx,ty,4.6,color);r.line(tx-v.x*10-v.y*8,ty-v.y*10+v.x*8,tx,ty,4.6,color);r.line(tx-v.x*10+v.y*8,ty-v.y*10-v.x*8,tx,ty,4.6,color);}
function lock(r,x,y){r.rect(x-5,y,10,8,'#eadcc0');r.line(x-3,y,x-3,y-5,1.8,'#eadcc0');r.line(x-3,y-5,x+3,y-5,1.8,'#eadcc0');r.line(x+3,y-5,x+3,y,1.8,'#eadcc0');r.circle(x,y+3,1.1,INK);}
function dash(r,a,b,color){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),parts=Math.max(1,Math.ceil(d/11));for(let i=0;i<parts;i++){const t=i/parts,u=Math.min(1,t+.55/parts);r.line(a.x+dx*t,a.y+dy*t,a.x+dx*u,a.y+dy*u,1.8,color);}}
function endPoint(s,intent){if(!intent.outside)return seedAnchor(cell(s,intent.toId));const g=s.grid,x=g.x+(intent.toCol+.5)*g.cellSize+26,y=g.y+(intent.toRow+.5)*g.cellSize-24;return{x:Math.max(g.x-18,Math.min(g.x+g.cols*g.cellSize+18,x)),y:Math.max(g.y-18,Math.min(g.y+g.rows*g.cellSize+18,y))};}
function waveMarks(r,s){
 const w=s.lastWave;if(!w)return;
 for(const intent of w.intents){const a=seedAnchor(cell(s,intent.fromId)),b=endPoint(s,intent);if(w.accepted){r.line(a.x,a.y,b.x,b.y,2,'#e5e7c7b0');r.circle(b.x,b.y,2.4,'#edf0c6');}else{dash(r,a,b,s.failure.seedIds.includes(intent.seedId)?'#efaf8a':'#ddd5bb');if(intent.outside){r.line(b.x-5,b.y-5,b.x+5,b.y+5,2.4,BAD);r.line(b.x-5,b.y+5,b.x+5,b.y-5,2.4,BAD);center(r,'OUT',b.x,b.y-20,13,INK);}}}
 if(!w.accepted)for(const id of s.failure.cellIds)corners(r,cell(s,id),'#f4a681');
 if(!w.accepted)for(const arrival of w.arrivals.filter(a=>a.count>1)){const c=cell(s,arrival.cellId);r.rect(c.x-27,c.y-12,54,25,'#793d32');center(r,String(arrival.count)+' TRY',c.x,c.y-9,16,'#fff0d6');}
}
function board(r,s){
 const g=s.grid;r.rect(g.x-9,g.y-9,g.cols*g.cellSize+18,g.rows*g.cellSize+18,'#7c704d');
 for(const c of s.cells){r.sprite('harvest_'+c.role,c.x,c.y,80,80,0,'#fff');if(c.arrow){if(c.editable)r.sprite('harvest_dial',c.x-1,c.y+1,48,48,0,'#fff');else{r.rect(c.x-22,c.y-20,42,42,'#506c68');box(r,c.x-22,c.y-20,42,42,'#b5c2a2',1);lock(r,c.x+24,c.y+10);}arrow(r,c.x-1,c.y+1,c.arrow,c.editable?'#4d513d':'#f7e5b9');}else if(c.role==='forbidden'){r.line(c.x-14,c.y-14,c.x+14,c.y+14,5,'#4f5146');r.line(c.x-14,c.y+14,c.x+14,c.y-14,5,'#4f5146');}}
 waveMarks(r,s);
 for(const c of s.cells){if(c.target){r.circle(c.x-26,c.y-25,10.5,c.coverageCount===1?'#638c42':'#e1cc9c');center(r,String(c.coverageCount),c.x-26,c.y-33,16,c.coverageCount===1?'#fff0d0':'#695f42');if(c.coverageCount===1)r.sprite('harvest_sprout',c.x-28,c.y+9,15,22,0,'#fff');}
  r.text(c.id,c.x-32,c.y+25,13,'#3e4938');const label=c.role==='source'?'IN':c.role==='stop'?'STOP':c.role==='forbidden'?'X':c.editable?'TURN':'LOCK';r.text(label,c.x+33-r.measureText(label,13),c.y+25,13,'#3e4938');
 }
 for(const seed of s.seeds){const c=cell(s,seed.cellId),p=seedAnchor(c),pulse=seed.status==='active'&&s.mode==='propagating'?s.waveProgress*1.5:0;r.circle(p.x,p.y,14+pulse,seed.status==='stopped'?'#7e9b50':seed.status==='waiting'?'#8e8061':'#517d82');r.sprite('harvest_seed',p.x,p.y,20,29,0,'#fff');center(r,seed.id,p.x,p.y-8,16,'#4e402a');}
 if(s.mode==='editing'&&s.phase==='playing')corners(r,cell(s,s.selectedId),'#fff6d2');
 if(s.phase==='lost'&&s.lostReason==='incomplete')for(const id of s.uncoveredTargetIds)corners(r,cell(s,id),'#e5c483');
 r.sprite('harvest_dial',116,477,24,24,0,'#fff');r.text('TURN',133,470,13,INK);r.rect(208,466,21,20,'#506c68');lock(r,218,473);r.text('FIXED',239,470,13,INK);r.circle(331,477,9,'#638c42');center(r,'1',331,470,13,PAPER);r.text('COVERED ONCE',346,470,13,INK);
}
const REASONS={forbidden:'FORBIDDEN / OUTSIDE',overlap:'REPEAT COVERAGE INTENT',incomplete:'TARGETS STILL MISSING',timeout:'90 SECONDS COMPLETE'};
function ledger(r,s){
 r.rect(500,73,432,422,'#465b4fee');r.line(500,73,932,73,1.3,'#f7e9bd');
 const title=s.phase==='won'?'HARVEST COMPLETE':s.phase==='lost'?'RUN STOPPED':s.mode==='editing'?'EDIT ARROWS':'SYNCHRONOUS RUN';r.text(title,522,88,23,PAPER);
 const selected=cell(s,s.selectedId);
 if(s.phase==='lost'){r.text(REASONS[s.lostReason],522,125,18,BAD);r.text(s.lastWave&&!s.lastWave.accepted?'NO ARRIVALS OR COVERAGE COMMITTED':s.lostReason==='incomplete'?'STOPPED SEEDS DO NOT FILL OTHER CELLS':'FINAL ACTUAL POSITIONS',522,154,13,MUTED);}
 else if(s.phase==='won'){r.text('EVERY TARGET EXACTLY ONCE',522,125,18,GOOD);r.text('ALL SEEDS IN STOP TRAYS',522,154,14,MUTED);}
 else if(s.mode==='editing'){r.text(selected.id+' / '+selected.role.toUpperCase()+(selected.arrow?' / '+NAMES[selected.arrow]:''),522,125,18,PAPER);r.text(selected.editable?'A TURN CLOCKWISE':selected.arrow?'FIXED ARROW / CANNOT TURN':'NO OUTGOING ARROW',522,153,14,MUTED);r.text('B SOW ALL SEEDS ONCE',522,176,14,PAPER);}
 else{r.text('BATCH '+(s.waveIndex+1)+' / NEXT TOGETHER',522,125,18,PAPER);r.text('ARROWS LOCKED',522,153,14,MUTED);r.rect(522,180,388,6,'#263d36');r.rect(522,180,388*s.waveProgress,6,'#c5d58f');}
 r.line(522,198,910,198,1,'#bbca9b66');r.text('COVERED',522,211,13,MUTED);r.text(s.coveredCount+' / '+s.targetCount,608,204,26,PAPER);r.text('STOPPED',734,211,13,MUTED);r.text(s.stoppedSeedCount+' / '+s.sourceCount,820,204,26,PAPER);
 r.text('ACTUAL SEED CELLS',522,246,14,MUTED);
 s.seeds.forEach((seed,i)=>{const y=277+i*37;r.circle(533,y+9,11,'#c5a65c');center(r,seed.id,533,y,15,'#35443b');r.text(seed.cellId,564,y-1,20,PAPER);r.text(seed.status==='waiting'?'WAITING':seed.status==='stopped'?'STOPPED':'ACTIVE',633,y+2,15,PAPER);r.text(seed.steps+' MOVES',810,y+3,13,MUTED);});
 r.line(522,393,910,393,1,'#bbca9b66');
 if(s.mode==='editing'){r.text('ALL WALKABLE CELLS ARE TARGETS',522,408,15,PAPER);r.text('SOURCE + STOP INCLUDED',522,434,14,MUTED);r.text('ROUND DIALS TURN / LOCKS STAY FIXED',522,467,13,MUTED);}
 else{r.text(s.lastWave?'LAST BATCH '+s.lastWave.id+' / '+(s.lastWave.accepted?'ACCEPTED':'REJECTED'):(s.phase==='playing'?'SOURCES COVERED / FIRST BATCH PENDING':'NO MOVEMENT BATCH COMMITTED'),522,408,15,PAPER);r.text(s.lastWave&&!s.lastWave.accepted?'DASHES: INTENTS, NOT ARRIVALS':'COVERAGE CHANGES ONLY ON COMMIT',522,434,14,MUTED);r.text('UNCOVERED TARGETS '+s.remainingTargetCount,522,467,14,s.remainingTargetCount?PAPER:GOOD);}
}
function status(r,s){
 r.rect(28,508,904,27,'#3e5147');let text;if(s.phase==='won')text='ALL TARGETS COVERED ONCE';else if(s.phase==='lost')text=s.lostReason==='forbidden'||s.lostReason==='overlap'?'BATCH REJECTED / SEEDS HELD AT ACTUAL CELLS':s.lostReason==='incomplete'?'ALL SEEDS STOPPED / TARGETS STILL MISSING':'ACTIVE TIME COMPLETE / NO EXTRA MOVE';else if(s.mode==='editing')text=cell(s,s.selectedId).editable?'A TURN SELECTED / B SOW ONCE':'SELECT AN EDITABLE ARROW / B SOW ONCE';else text='ARROWS LOCKED / NEXT BATCH TOGETHER';r.text(text,43,514,14,PAPER);const counter='WAVES '+s.acceptedWaves+'/'+s.waveIndex;r.text(counter,914-r.measureText(counter,17),512,17,PAPER);
}
function scene(r,s){r.sprite('harvest_paper',480,270,960,540,0,'#fff');r.rect(0,0,960,53,'#465b4f');r.text('ARROW HARVEST',25,15,25,PAPER);r.text('SEED TABLE / '+String(s.level).padStart(2,'0'),741,23,14,MUTED);board(r,s);ledger(r,s);status(r,s);}
root.GameDef={
 id:'arrow-harvest',title:'箭田收获',tagline:'安排田格箭头，让种子同步覆盖',seed:397,accent:'#b8c780',background:'#e2d1aa',levelLabel:'田地',levelNames:['环田','交口','三路'],atlas,
 description:'方向选格，A 转动可调箭头，B 播种。种子每半秒同步前进，播种后不能改箭头。所有非禁地格，包括起点和收仓格，都须覆盖一次；越界、进禁地或重复覆盖会失败。',
 controls:{move:'方向键 / 摇杆 · 选格',a:'转向 / 空格',b:'播种 / B'},actionLabels:['转向','播种'],tip:'锁标不可转。虚线是失败意图，种子仍在原格。',winTitle:'目标田块全覆盖',loseTitle:'播种未完成',
 result(s){if(s.phase==='won')return '所有目标恰好覆盖一次，种子全部归仓。';if(s.lostReason==='forbidden')return '本波拟越界或进入禁地，已整批拒绝。';if(s.lostReason==='overlap')return '本波拟重复覆盖目标格，已整批拒绝。';if(s.lostReason==='incomplete')return '种子已归仓，仍有目标未覆盖。';return '90 秒已到，田地布局可重新安排。';},
 hud(s){return[
  {label:'覆盖目标',value:s.coveredCount+' / '+s.targetCount,tone:s.allTargetsCovered?'':'warn'},
  {label:'种子归仓',value:s.stoppedSeedCount+' / '+s.sourceCount,tone:s.phase==='lost'?'warn':''},
  {label:'运行阶段',value:s.phase==='won'?'全部完成':s.phase==='lost'?'本轮结束':s.mode==='editing'?'编辑箭头':'同步传播',tone:s.phase==='lost'?'warn':''},
  {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
 ];},render(r,s){scene(r,s);}
};
})(window);
