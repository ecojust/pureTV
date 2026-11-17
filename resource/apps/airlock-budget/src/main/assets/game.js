/* Airlock Budget: public chamber positions, actual oxygen transfers and one shared pump. */
(function(root){
'use strict';
function roomArt(c,w,h,a){
  c.save();c.scale(w/256,h/256);a.path(c,[[12,0],[244,0],[256,14],[256,256],[0,256],[0,14]],'#344754');
  c.fillStyle=a.linear(c,0,12,0,244,[[0,'#172d3d'],[.63,'#213a48'],[1,'#111f2c']]);c.fillRect(14,12,228,228);
  a.path(c,[[14,12],[35,28],[35,216],[14,240]],'#48606b');a.path(c,[[242,12],[221,28],[221,216],[242,240]],'#101f2b');
  a.path(c,[[14,240],[35,216],[221,216],[242,240]],a.linear(c,0,213,0,241,[[0,'#6f8387'],[1,'#243a49']]));
  c.strokeStyle='#78909955';c.lineWidth=1;for(let y=49;y<211;y+=39){c.beginPath();c.moveTo(37,y);c.lineTo(219,y);c.stroke();}
  for(let x=64;x<220;x+=48){c.strokeStyle='#b7c7c821';c.beginPath();c.moveTo(x,32);c.lineTo(x,210);c.stroke();}
  c.fillStyle='#b8c7c9';c.fillRect(13,11,229,7);c.fillRect(11,16,5,223);c.fillStyle='#5c7480';c.fillRect(242,15,4,225);c.fillRect(14,239,229,7);
  c.fillStyle='#d0e4df';c.fillRect(52,28,151,4);c.fillStyle='#a5ced423';c.fillRect(48,32,159,15);
  c.strokeStyle='#102632';c.lineWidth=2;for(let x=43;x<221;x+=17){c.beginPath();c.moveTo(x,220);c.lineTo(x-13,236);c.stroke();}
  for(const [x,y]of[[21,25],[235,25],[21,229],[235,229]]){a.ellipse(c,x,y,2.1,2.1,'#c2ccca');c.strokeStyle='#516574';c.beginPath();c.moveTo(x-1,y);c.lineTo(x+1,y);c.stroke();}
  c.restore();
}
function doorArt(c,w,h,a){
  c.save();c.scale(w/128,h/256);a.path(c,[[10,2],[118,2],[125,14],[125,244],[115,254],[13,254],[3,242],[3,15]],'#0c1d29');
  a.path(c,[[17,10],[111,10],[116,21],[116,235],[108,245],[20,245],[12,236],[12,21]],a.linear(c,10,0,118,0,[[0,'#667e89'],[.34,'#c6d4d2'],[.52,'#8ea3aa'],[1,'#435e6a']]),'#e1e9df',1);
  c.strokeStyle='#405865';c.lineWidth=2;for(let y=31;y<239;y+=29){c.beginPath();c.moveTo(19,y);c.lineTo(109,y);c.stroke();c.strokeStyle='#d2e0da6e';c.beginPath();c.moveTo(19,y+2);c.lineTo(109,y+2);c.stroke();c.strokeStyle='#405865';}
  a.path(c,[[39,74],[88,74],[92,125],[35,125]],'#1a3544','#6d8f98',3);a.path(c,[[44,80],[80,80],[61,119],[41,119]],'#6b9ba34c');
  c.fillStyle='#e3b46f';for(let x=20;x<105;x+=22){a.path(c,[[x,226],[x+11,226],[x+18,239],[x+7,239]],'#e3b46f');}
  c.fillStyle='#294450';c.fillRect(53,154,22,13);c.fillStyle='#dae3d7';c.fillRect(57,157,14,4);c.restore();
}
function crewArt(c,w,h,a){
  c.save();c.scale(w/128,h/192);a.ellipse(c,65,181,37,7,'#071b2466');
  a.path(c,[[38,103],[61,105],[59,174],[39,174]],a.linear(c,35,0,62,0,[[0,'#536c79'],[1,'#c6d8d4']]),'#233d4b',2);a.path(c,[[68,104],[91,103],[91,174],[70,174]],a.linear(c,66,0,96,0,[[0,'#b5cbc9'],[1,'#4b6775']]),'#233d4b',2);
  a.path(c,[[37,165],[61,165],[63,182],[29,182],[28,174]],'#263e4c');a.path(c,[[69,165],[91,165],[101,175],[99,182],[67,182]],'#263e4c');
  a.path(c,[[33,66],[48,59],[79,59],[95,68],[99,121],[29,121]],a.linear(c,24,60,100,120,[[0,'#879fa6'],[.5,'#e0e7da'],[1,'#6c8994']]),'#456171',2);
  a.path(c,[[30,71],[39,86],[30,136],[17,133],[20,93]],'#adbfbd','#385363',2);a.path(c,[[95,72],[107,94],[110,134],[96,137],[88,86]],'#92acb1','#385363',2);
  a.ellipse(c,22,137,8,9,'#3d5868');a.ellipse(c,103,139,8,9,'#3d5868');
  a.ellipse(c,64,43,31,36,a.linear(c,33,10,92,77,[[0,'#f0ebd7'],[.4,'#c7d5d0'],[1,'#6a8995']]));
  a.path(c,[[42,25],[86,25],[91,36],[88,57],[79,64],[48,64],[38,54],[37,36]],a.linear(c,40,24,90,65,[[0,'#7ea9b3'],[.45,'#244958'],[1,'#102c3d']]),'#a1babd',2);
  a.path(c,[[46,28],[63,28],[45,53],[41,47]],'#e4eddf70');c.fillStyle='#e2b677';c.fillRect(44,80,39,9);c.fillStyle='#355464';c.fillRect(44,93,39,16);c.fillStyle='#d0e1d7';c.fillRect(50,98,9,4);c.fillStyle='#729da7';c.fillRect(64,98,12,4);c.restore();
}
function pumpArt(c,w,h,a){
  c.save();c.scale(w/192,h/160);a.ellipse(c,97,142,79,11,'#061b284d');
  a.path(c,[[17,37],[139,37],[174,56],[174,126],[155,141],[17,141]],a.linear(c,0,36,162,134,[[0,'#a3b7b8'],[.5,'#688591'],[1,'#314d60']]),'#b8c9c5',2);
  a.path(c,[[139,38],[174,56],[174,126],[139,137]],'#35596a');c.fillStyle='#253e4d';c.fillRect(28,53,99,66);
  for(let x=34;x<124;x+=12){c.fillStyle='#819b9f';c.fillRect(x,59,4,54);c.fillStyle='#d7e2d8';c.fillRect(x,59,1,54);}
  a.ellipse(c,151,85,16,22,'#142e41');a.ellipse(c,151,85,9,13,'#83a5ac');a.ellipse(c,151,85,4,6,'#d5e4d6');
  a.path(c,[[36,35],[36,19],[72,19],[72,35]],'#4a6e7c','#b6ccc7',4);c.fillStyle='#d4ac6e';c.fillRect(30,123,89,8);c.restore();
}
function tankArt(c,w,h,a){
  c.save();c.scale(w/128,h/224);a.ellipse(c,64,205,43,10,'#061b2855');
  c.fillStyle='#4b7180';c.fillRect(54,6,20,15);c.fillStyle='#d0dcd2';c.fillRect(46,12,36,8);
  a.path(c,[[31,30],[47,21],[81,21],[98,31],[105,46],[105,183],[91,201],[37,201],[23,183],[23,46]],a.linear(c,23,0,105,0,[[0,'#5f7f8c'],[.25,'#becdc9'],[.5,'#dfe5d6'],[.75,'#9eb5b7'],[1,'#385e70']]),'#becfc8',2);
  c.fillStyle='#2c4a5c';c.fillRect(37,55,50,117);c.fillStyle='#102a3a';c.fillRect(43,61,38,105);c.fillStyle='#bfd5d0';c.fillRect(43,61,2,105);
  c.strokeStyle='#a8c4c380';c.lineWidth=1;for(let y=73;y<164;y+=17){c.beginPath();c.moveTo(70,y);c.lineTo(79,y);c.stroke();}
  c.fillStyle='#d1ac70';c.fillRect(31,39,67,8);c.fillRect(31,182,67,8);c.fillStyle='#36596b';c.fillRect(38,200,12,12);c.fillRect(79,200,12,12);c.restore();
}
function valveArt(c,w,h,a){
  c.save();c.scale(w/128,h/128);a.ellipse(c,64,68,51,51,'#071b2866');a.ellipse(c,64,61,47,47,'#d0a469');a.ellipse(c,64,61,35,35,'#243f50');
  c.strokeStyle='#d6b87d';c.lineWidth=8;for(let i=0;i<4;i++){const t=i*Math.PI/2;c.beginPath();c.moveTo(64,61);c.lineTo(64+41*Math.cos(t),61+41*Math.sin(t));c.stroke();}
  a.ellipse(c,64,61,13,13,'#8ca6a9');a.ellipse(c,64,61,6,6,'#d9e1d4');c.strokeStyle='#f0d5a1';c.lineWidth=2;c.beginPath();c.arc(64,61,43,3.4,5.6);c.stroke();c.restore();
}
const atlas={builtins:[],tiles:[
  {name:'airlock_room',x:0,y:0,w:256,h:256,paint:roomArt},
  {name:'airlock_door',x:256,y:0,w:128,h:256,paint:doorArt},
  {name:'airlock_crew',x:384,y:0,w:128,h:192,paint:crewArt},
  {name:'airlock_pump',x:512,y:0,w:192,h:160,paint:pumpArt},
  {name:'airlock_tank',x:0,y:256,w:128,h:192,paint:tankArt},
  {name:'airlock_valve',x:128,y:256,w:128,h:128,paint:valveArt}
]};
const PAPER='#e2e8da',MUTED='#9fb9bf',CYAN='#7fc9d2',AMBER='#e5b672',RED='#ed9a82',GREEN='#a6c8a5';
const STAGES={recover:'RECOVER',vent:'FAST VENT',load:'LOAD FROM B',fill:'FILL AIRLOCK',unload:'DELIVER TO C',isolate:'SEAL LEAK'};
function num(v,dp=1){return Number.isInteger(v)?String(v):v.toFixed(dp);}
function ratio(v,max){return Math.max(0,Math.min(1,v/max));}
function center(r,t,x,y,size,color){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function outline(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function path(r,points,color,width){for(let i=1;i<points.length;i++)r.line(...points[i-1],...points[i],width,color);}
function actualFlow(r,points,amount,s,color){
  path(r,points,'#35596a',4);if(!(amount>0))return;path(r,points,color,2);
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=lengths.reduce((a,b)=>a+b,0);
  for(let k=0;k<3;k++){let t=((s.elapsed*.25+k/3)%1)*total;for(let i=0;i<lengths.length;i++){if(t<=lengths[i]){const f=t/lengths[i];r.circle(points[i][0]+(points[i+1][0]-points[i][0])*f,points[i][1]+(points[i+1][1]-points[i][1])*f,2.5,PAPER);break;}t-=lengths[i];}}
}
function station(r,s){
  const a=s.chambers.A,f=s.lastInterval;
  for(const [id,name,x]of[['B','WAITING',132],['A','AIRLOCK',356],['C','SAFE',580]]){
    r.rect(x-100,64,200,49,'#284755');r.text(id+' / '+name,x-87,72,17,PAPER);r.text(num(s.chambers[id].pressure,2)+' atm',x-87,94,16,id==='B'?AMBER:CYAN);
    r.sprite('airlock_room',x,222,200,220,0,id==='B'?'#c1d1da':id==='C'?'#dce9d5':'#fff');
  }
  // Pressure is a public readout, not a separate oxygen-volume calculation.
  r.rect(274,143,164,7,'#102a3a');r.rect(274,143,164*ratio(a.pressure,1),7,CYAN);center(r,'AIR '+num(a.air)+' / '+num(a.capacity),356,157,13,MUTED);
  const task=s.task;
  center(r,task&&task.kind==='batch'?(s.phase!=='playing'?'FINAL / ':task.stopped?'STOPPED / ':'')+STAGES[task.phase]:'NO CREW TRANSFER',356,179,13,task&&task.stopped?AMBER:PAPER);
  if(task&&task.phase==='recover')center(r,'CAP WAIT '+num(task.capacityLimitedTicks/60)+'s TOTAL',356,198,13,task.capacityLimitedTicks>0?AMBER:MUTED);
  for(const [x,opened]of[[244,a.doorBOpen],[468,a.doorCOpen]]){
    r.rect(x-12,121,24,193,'#071e2a');r.line(x-13,121,x-13,312,3,'#9fb9be');r.line(x+13,121,x+13,312,3,'#577c8b');
    r.sprite('airlock_door',x,opened?136:216,37,opened?28:183,0,'#fff');r.circle(x,115,4,opened?GREEN:AMBER);center(r,opened?'OPEN':'SHUT',x,321,13,opened?GREEN:MUTED);
  }
  s.groups.forEach((g,i)=>{
    const x=g.location==='A'?356:(g.location==='B'?80:528)+i*52,mark=s.task&&s.task.groupId===g.id;
    if(mark)r.circle(x,286,25,'#e5b67222');
    for(let j=0;j<g.people;j++){const xx=x+(j-(g.people-1)/2)*16;r.sprite('airlock_crew',xx,266,39,65,0,g.evacuated?'#b8dbb8':'#fff');}
    center(r,g.id,x,303,13,g.evacuated?GREEN:mark?AMBER:PAPER);
  });
  // One pump route; positive completed-interval quantities alone activate the directional markers.
  const recovery=[[426,316],[426,337],[688,337],[688,256],[850,256],[850,230],[754,230]],fill=recovery.slice().reverse();
  actualFlow(r,f&&f.filled>0?fill:recovery,f?(f.filled>0?f.filled:f.recovered):0,s,CYAN);
  actualFlow(r,[[420,211],[444,211],[444,106],[453,106]],f?f.vented:0,s,AMBER);
  actualFlow(r,[[734,230],[702,230],[702,347],[56,347],[56,309]],f?f.leak:0,s,RED);
  r.sprite('airlock_valve',56,316,25,25,s.leak.isolated?Math.PI/4:0,s.leak.isolated?'#a8cfaf':'#fff');
  center(r,'B SERVICE LEAK',132,157,13,MUTED);center(r,s.leak.isolated?'SEALED':'NOT SEALED',132,176,14,s.leak.isolated?GREEN:RED);
}
function service(r,s){
  const t=s.tank,task=s.task,f=s.lastInterval;r.text('OXYGEN RESERVE',713,76,17,PAPER);
  r.sprite('airlock_tank',754,179,77,138,0,'#fff');const fill=ratio(t.oxygen,t.capacity);r.rect(741.4,212.3-fill*64.7,21.7,64.7*fill,'#7fc9d2');
  r.sprite('airlock_pump',853,183,112,94,0,'#fff');
  const running=s.phase==='playing'&&f&&!f.taskStopped&&(f.recovered>0||f.filled>0||f.taskPhase==='isolate');center(r,'SHARED PUMP',850,241,13,MUTED);r.circle(848,217,3,running?CYAN:task?AMBER:'#627e88');
  r.text(num(t.oxygen)+' / '+num(t.capacity),714,267,21,PAPER);r.text('FINAL MIN '+num(t.reserveFloor),714,294,14,t.oxygen<t.reserveFloor?AMBER:GREEN);
  const mode=s.phase==='won'?'MISSION COMPLETE':s.phase==='lost'?'MISSION ENDED':!task?'IDLE / '+s.modeSelection.toUpperCase():task.stopped?'STOPPED / '+STAGES[task.phase]:STAGES[task.phase]+(task.groupId?' / '+task.groupId:'');
  r.text(mode,714,316,14,task&&task.stopped?AMBER:PAPER);
  r.text(task?'RUN '+num(task.totalTicks/60)+'s / STAGE '+num(task.phaseTicks/60)+'s':'ONE TASK AT A TIME',714,340,13,MUTED);
  r.text('O2 LOSSES',714,367,13,MUTED);r.text('CREW '+num(s.ledger.breathing)+'  LEAK '+num(s.ledger.leak),714,386,13,PAPER);
  r.text('VENT '+num(s.ledger.vent)+'  REC '+num(s.ledger.recoveryLoss),714,405,13,PAPER);
  r.text('NET REC '+num(s.ledger.recoveredTransferred)+' / FILL '+num(s.ledger.filledTransferred),714,424,13,MUTED);
}
function personnel(r,s){
  s.groups.forEach((g,i)=>{
    const x=32+i*224,y=353;r.rect(x,y,200,91,'#284755');r.text(g.id+' '+g.nameEn,x+9,y+8,16,PAPER);
    const time=Math.max(0,(g.deadlineTick-s.tick)/60);r.text(g.evacuated?'SAFE / '+g.people+' PEOPLE':'IN '+g.location+' / '+g.people+' PEOPLE',x+9,y+32,14,g.evacuated?GREEN:PAPER);
    const countdown=g.evacuated?'ARRIVED '+num(g.arrivalTick/60)+'s':'LEFT '+num(time)+'s';r.text(countdown,x+9,y+52,16,g.evacuated?GREEN:time<10?RED:AMBER);
    r.text((g.evacuated?'O2 DONE':'NEED '+num(g.breathingRate,2)+'/s')+'  USED '+num(g.consumedOxygen),x+9,y+73,13,MUTED);
  });
}
function actionStrip(r,s){
  const ids=s.groups.map(g=>g.id).concat('leak');ids.forEach((id,i)=>{
    const x=32+i*225,y=455;r.rect(x,y,216,52,'#284553');if(s.phase==='playing'&&s.selectedId===id)outline(r,x,y,216,52,AMBER,2);
    const g=s.groups.find(g=>g.id===id),done=g?g.evacuated:s.leak.isolated;const title=g?g.id+' / '+g.nameEn:'ISOLATE SERVICE';r.text(title,x+9,y+8,15,done?GREEN:PAPER);
    const active=s.task&&(s.task.groupId===id||(id==='leak'&&s.task.kind==='isolate'));
    const status=done?'COMPLETE':s.phase!=='playing'?'NOT COMPLETED':active?(s.task.stopped?'EQUIPMENT STOPPED':STAGES[s.task.phase]):s.task?'WAIT FOR PUMP':id==='leak'?'PUMP SEAL':s.modeSelection==='recover'?'SLOW RECOVERY':'FAST VENT';
    r.text(status,x+9,y+31,13,active&&s.task.stopped?AMBER:MUTED);
  });
  let help;if(s.phase==='won')help='ALL CREW SAFE / LEAK SEALED / RESERVE MET';else if(s.phase==='lost')help={oxygen:'OXYGEN SUPPLY FAILED',deadline:'A GROUP MISSED ITS DEADLINE',reserve:'FINAL RESERVE BELOW MINIMUM',pressure:'UNSAFE DOOR / PRESSURE STATE',timeout:'WATCH TIME COMPLETE'}[s.lostReason]||'WATCH ENDED';
  else if(!s.task)help='A START / B RECOVER OR VENT';else help=s.task.stopped?'A RESUME / OXYGEN AND DEADLINES CONTINUE':'B STOP EQUIPMENT / OXYGEN AND DEADLINES CONTINUE';
  r.text(help,32,519,13,PAPER);const count='SAFE '+s.evacuatedCount+'/'+s.groups.length;r.text(count,932-r.measureText(count,16),516,16,GREEN);
}
root.GameDef={
  id:'airlock-budget',title:'气闸值守',tagline:'有限储氧，一台泵，三组待援人员',seed:467,accent:'#e6bb80',background:'#132c3b',levelLabel:'值守',levelNames:['抢修','医疗','满罐'],atlas,
  description:'方向选人员或漏点。空闲时 B 切换回收/快排，A 启动。运行时 B 停机，A 继续；耗氧、漏气和期限照常推进。救出三组、封堵漏点，并保住储氧底线。',
  controls:{move:'方向键 / 摇杆 · 选择',a:'启动·继续 / 空格',b:'模式·停机 / B'},actionLabels:['启动/继续','模式/停机'],tip:'慢回收省氧，快排赶时间。停机不停止耗氧和期限。',winTitle:'撤离任务完成',loseTitle:'值守未完成',
  result(s){if(s.phase==='won')return '全员安全，漏点已封，储氧达到底线。';return {oxygen:'供氧不足。减少等待和不可回收的排气。',deadline:'有人员错过期限。调整批次与回收方式。',reserve:'最终储氧不足。安排回收并及时封堵漏点。',pressure:'门或气压不安全，撤离中止。',timeout:'值守时间已到，撤离或封堵尚未完成。'}[s.lostReason]||'任务未完成。';},
  hud(s){return[{label:'罐内储氧',value:num(s.tank.oxygen),tone:s.tank.oxygen<s.tank.reserveFloor?'warn':''},{label:'安全批次',value:s.evacuatedCount+'/'+s.groups.length},{label:'漏点',value:s.leak.isolated?'已封堵':'未封堵',tone:s.leak.isolated?'':'warn'},{label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}];},
  render(r,s){r.rect(0,0,960,540,'#132c3b');r.rect(0,0,960,49,'#233e4b');r.text('AIRLOCK WATCH',25,12,24,PAPER);const title=s.phase==='won'?'RESCUE COMPLETE':s.phase==='lost'?'RESCUE ENDED':'B > A > C / ONE SHARED PUMP';r.text(title,932-r.measureText(title,13),23,13,MUTED);r.rect(700,64,232,380,'#203e4d');station(r,s);service(r,s);personnel(r,s);actionStrip(r,s);}
};
})(window);
