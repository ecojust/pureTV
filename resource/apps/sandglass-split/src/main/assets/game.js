/* Original glass dosing bench. All material positions and ownership are public committed facts. */
function sgGradient(c, x1, y1, x2, y2, stops) {
  const g=c.createLinearGradient(x1,y1,x2,y2);for(const [at,color] of stops)g.addColorStop(at,color);return g;
}
function sgPath(c,points,fill,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function sgEllipse(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
function sgScrew(c,x,y,r=3){sgEllipse(c,x,y+1,r+.6,r+.6,'#6b655e');sgEllipse(c,x,y,r,r,'#d3c8ab');c.strokeStyle='#736e67';c.lineWidth=.9;c.beginPath();c.moveTo(x-r*.55,y);c.lineTo(x+r*.55,y);c.stroke();}
function sgBench(c,w,h){
  c.save();c.scale(w/512,h/128);c.fillStyle=sgGradient(c,0,0,0,128,[[0,'#f1ede4'],[.62,'#dfd9ca'],[1,'#c9c7bc']]);c.fillRect(0,0,512,128);
  for(let i=0;i<130;i++){const x=(i*73+17)%512,y=(i*41+7)%128;sgEllipse(c,x,y,1.5+(i%4),.3,'rgba(97,110,112,.055)');}
  c.fillStyle='#faf7ed';c.fillRect(0,0,512,3);c.fillStyle='#b5b9ad';c.fillRect(0,120,512,2);c.restore();
}
function sgHopper(c,w,h){
  c.save();c.scale(w/512,h/80);sgPath(c,[[8,9],[504,9],[480,69],[32,69]],sgGradient(c,0,10,0,70,[[0,'rgba(238,249,243,.55)'],[.6,'rgba(150,183,184,.19)'],[1,'rgba(249,252,235,.75)']]),'#899d9d',2);
  c.fillStyle='#695b53';c.fillRect(4,7,504,7);c.fillStyle='#cbb28b';c.fillRect(4,7,504,3);c.fillStyle='#8b8a7c';c.fillRect(30,66,452,6);c.fillStyle='#e2e8d6';c.fillRect(30,66,452,2);
  sgPath(c,[[40,17],[121,17],[103,60],[28,60]],'rgba(255,255,247,.66)');sgPath(c,[[419,17],[478,17],[464,60],[401,60]],'rgba(255,255,247,.35)');
  for(const x of [22,490])sgScrew(c,x,10,3);c.restore();
}
function sgCup(c,w,h){
  c.save();c.scale(w/192,h/96);
  sgPath(c,[[22,9],[170,9],[159,82],[33,82]],sgGradient(c,0,0,192,0,[[0,'rgba(169,200,201,.5)'],[.2,'rgba(237,248,239,.05)'],[.8,'rgba(237,248,239,.06)'],[1,'rgba(162,190,192,.4)']]),'#8b9f9f',1.5);
  sgPath(c,[[27,17],[37,18],[45,72],[37,74]],'rgba(255,255,247,.88)');sgPath(c,[[156,17],[165,17],[157,73],[152,73]],'rgba(244,252,247,.5)');
  c.strokeStyle='#eef6ed';c.lineWidth=3;c.beginPath();c.moveTo(34,80);c.lineTo(158,80);c.stroke();
  c.strokeStyle='#617b7f';c.lineWidth=2;c.beginPath();c.moveTo(22,9);c.lineTo(170,9);c.stroke();c.strokeStyle='#fcfff8';c.lineWidth=1;c.beginPath();c.moveTo(22,11);c.lineTo(170,11);c.stroke();
  for(let i=0;i<4;i++){c.strokeStyle='rgba(79,105,108,.5)';c.lineWidth=1;c.beginPath();c.moveTo(37,29+i*12);c.lineTo(43+(i%2?0:4),29+i*12);c.stroke();}
  c.fillStyle='#697e81';c.fillRect(25,85,142,5);c.fillStyle='#f4f1df';c.fillRect(31,84,130,2);c.restore();
}
function sgSand(c,w,h){
  c.save();c.scale(w/192,h/96);sgPath(c,[[4,20],[40,13],[83,16],[118,9],[160,17],[188,14],[188,92],[4,92]],sgGradient(c,0,10,0,92,[[0,'#f3d49b'],[.35,'#ddb373'],[1,'#c79559']]));
  for(let i=0;i<180;i++){const x=7+(i*37)%177,y=24+(i*53)%63;sgEllipse(c,x,y,.7+(i%3)*.25,.7,i%3?'rgba(255,238,191,.42)':'rgba(128,86,43,.2)');}c.restore();
}
function sgGate(c,w,h){
  c.save();c.scale(w/192,h/40);sgPath(c,[[3,13],[184,10],[189,22],[8,27]],sgGradient(c,0,10,0,28,[[0,'#f8df9e'],[.3,'#d5b06d'],[.65,'#a77b44'],[1,'#f0d49b']]),'#7c644d',1.4);
  c.fillStyle='#f5e0b0';c.fillRect(13,13,164,2);c.fillStyle='#b98e56';c.fillRect(12,24,165,2);
  for(const x of [22,172])sgScrew(c,x,19,2.8);sgEllipse(c,96,20,12,12,'#666f70');sgEllipse(c,96,20,9,9,'#e1d3aa');sgEllipse(c,96,20,4,4,'#566d73');c.restore();
}
function sgNozzle(c,w,h){
  c.save();c.scale(w/64,h/80);c.fillStyle=sgGradient(c,9,0,55,0,[[0,'#8e9e9c'],[.3,'#e8eddf'],[.6,'#a3b6b1'],[1,'#667e80']]);c.fillRect(17,5,30,44);
  for(const y of [12,20,28]){c.fillStyle='#7a8e8e';c.fillRect(14,y,36,3);c.fillStyle='#e1e7d6';c.fillRect(14,y,36,1);}
  sgPath(c,[[15,39],[49,39],[40,64],[24,64]],'#b9c7ba','#688083',1.5);sgEllipse(c,32,64,8,3,'#435c63');sgEllipse(c,32,63,6,1.5,'#bba478');c.restore();
}
function sgValve(c,w,h){
  c.save();c.scale(w/96,h/96);sgEllipse(c,48,51,34,34,'rgba(63,68,73,.18)');sgEllipse(c,48,48,32,32,'#647f81');sgEllipse(c,48,48,26,26,'#d9c79c');sgEllipse(c,48,48,20,20,'#aa8354');
  for(let i=0;i<6;i++){const a=i*Math.PI/3;sgEllipse(c,48+26*Math.cos(a),48+26*Math.sin(a),3,3,'#eff2df');}
  c.fillStyle='#384f5b';c.fillRect(12,42,72,12);c.fillStyle='#e5c48a';c.fillRect(16,43,64,4);sgEllipse(c,48,48,8,8,'#ced3b9');sgScrew(c,48,48,4);c.restore();
}
function sgGrain(c,w,h){
  c.save();c.scale(w/32,h/48);sgPath(c,[[15,3],[25,14],[24,34],[17,44],[7,32],[6,14]],'#bd8c4c','#805f3f',1);sgPath(c,[[15,5],[21,14],[16,31],[9,18]],'#f9dda4');sgPath(c,[[17,31],[23,16],[23,33],[17,41]],'#d6a65f');c.restore();
}
const SG_ATLAS={builtins:[],tiles:[
  {name:'sg_hopper',x:0,y:0,w:512,h:80,paint:sgHopper},
  {name:'sg_cup',x:512,y:0,w:192,h:96,paint:sgCup},
  {name:'sg_sand',x:704,y:0,w:192,h:96,paint:sgSand},
  {name:'sg_gate',x:0,y:96,w:192,h:40,paint:sgGate},
  {name:'sg_nozzle',x:192,y:96,w:64,h:80,paint:sgNozzle},
  {name:'sg_valve',x:256,y:96,w:96,h:96,paint:sgValve},
  {name:'sg_grain',x:352,y:96,w:32,h:48,paint:sgGrain},
  {name:'sg_bench',x:0,y:800,w:512,h:128,paint:sgBench}
]};
const SG_INK='#4e4759',SG_MUTED='#6e7f83',SG_BRASS='#b2824d',SG_GOOD='#4c8275',SG_WARN='#ad6253';
function sgCenter(r,text,x,y,size,color=SG_INK){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
function sgPoint(s,xU,yU){return{x:xU/s.physics.unitsPerPixel,y:yU/s.physics.unitsPerPixel};}
function sgChannel(r,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
  r.line(a.x,a.y,b.x,b.y,13,'#c8d8d3');r.line(a.x,a.y,b.x,b.y,9,'#e9f0e4');
  r.line(a.x+nx*6,a.y+ny*6,b.x+nx*6,b.y+ny*6,1,'#90a6a5');r.line(a.x-nx*5,a.y-ny*5,b.x-nx*5,b.y-ny*5,1.5,'#fcfff4');
}
function sgBackground(r,s){
  r.rect(0,0,960,540,'#eae9dc');r.rect(12,43,936,471,'#e0e5dc');r.rect(20,43,920,326,'#eaf0e6');
  r.sprite('sg_bench',480,450,960,144,0,'#fff');
  for(const x of [223,737]){r.rect(x,76,5,337,'#bdc6bb');r.rect(x+1,76,1,335,'#f5f4e5');r.rect(x-9,401,24,5,'#a1b1a9');}
  r.line(220,76,742,76,3,'#a4b4ad');
  const factor=s.reservoirMassG/s.initialMassG;
  if(factor>0)r.sprite('sg_sand',480,59+(1-factor)*9,430,18*factor,0,'#fff');
  r.sprite('sg_hopper',480,58,512,38,0,'#fff');
  for(const p of s.sourcePositionsU){const pos=sgPoint(s,p.xU,p.yU);r.line(pos.x,73,pos.x,pos.y-7,12,'#aebeb5');r.line(pos.x-3,73,pos.x-3,pos.y-7,2,'#f1f3de');r.sprite('sg_nozzle',pos.x,pos.y-9.6,23,32,0,'#fff');}
  r.sprite('sg_valve',480,88,42,42,s.sourceOpen?Math.PI/2:0,'#fff');
  sgCenter(r,s.sourceOpen?'VALVE OPEN':'VALVE CLOSED',480,115,14,s.sourceOpen?SG_BRASS:SG_INK);
  for(const g of s.gates){const p=sgPoint(s,g.pivotXU,g.pivotYU),src=s.sourcePositionsU[g.sourceIndex];sgChannel(r,sgPoint(s,src.xU,src.yU),p);for(const id of [g.outerCupId,g.centerCupId]){const c=s.cups.find(c=>c.id===id);sgChannel(r,p,sgPoint(s,c.centerXU,c.planeYU));}}
}
function sgCups(r,s){
  for(const c of s.cups){
    const p=sgPoint(s,c.centerXU,c.planeYU),left=c.leftU/s.physics.unitsPerPixel,right=c.rightU/s.physics.unitsPerPixel;
    const fillHeight=32*c.massG/c.capacityG,color=c.withinTarget?SG_GOOD:SG_INK;
    r.rect(left-12,p.y+45,right-left+24,6,'#c7cebf');r.rect(left-7,p.y+47,right-left+14,2,'#a8b5ae');
    if(fillHeight>0)r.sprite('sg_sand',p.x,p.y+42-fillHeight/2,right-left-24,fillHeight,0,'#fff');
    r.sprite('sg_cup',p.x,p.y+24,(right-left)*192/148,60,0,'#fff');
    r.line(left,p.y,right,p.y,2,c.withinTarget?SG_GOOD:'#738c91');
    sgCenter(r,c.id.toUpperCase(),p.x,p.y+5,13,color);sgCenter(r,c.massG+' g',p.x,p.y+20,23,color);
    sgCenter(r,c.targetG+' +/- '+c.toleranceG+' g',p.x,p.y+51,14,SG_INK);
    if(c.withinTarget){r.line(right+9,p.y+19,right+14,p.y+24,2.5,SG_GOOD);r.line(right+14,p.y+24,right+23,p.y+12,2.5,SG_GOOD);}
  }
}
function sgGates(r,s){
  for(const g of s.gates){
    const p=sgPoint(s,g.pivotXU,g.pivotYU),selected=g.index===s.cursor,x=g.index===0?p.x-151:p.x+45,y=p.y-24;
    r.circle(p.x,p.y,12,'#bac8bd');r.circle(p.x,p.y,9,'#eff1de');
    const half=g.halfLengthU/s.physics.unitsPerPixel,dx=half*Math.cos(g.angleRad),dy=half*Math.sin(g.angleRad);r.line(p.x-dx,p.y-dy,p.x+dx,p.y+dy,5,'#8e734e');
    r.sprite('sg_gate',p.x,p.y,2*half,17,g.angleRad,'#fff');
    r.rect(x-2,y-2,110,54,selected?SG_BRASS:'#c4cfc2');r.rect(x,y,106,50,selected?'#fff1d1':'#eef1e4');
    r.text((g.index===0?'L':'R')+' GATE',x+9,y+6,13,SG_MUTED);r.text((g.mode==='center'?'CENTER':g.outerCupId.toUpperCase()),x+9,y+24,17,selected?SG_INK:SG_MUTED);
    if(selected){r.line(x+5,y+46,x+101,y+46,2,SG_BRASS);}
  }
}
function sgPackets(r,s){
  for(const packet of s.packets){const p=sgPoint(s,packet.xU,packet.yU);r.sprite('sg_grain',p.x,p.y,6.5,9,Math.atan2(packet.vyU,packet.vxU)-Math.PI/2,'#fff');}
}
function sgReadouts(r,s){
  r.rect(0,0,960,38,SG_INK);r.text('SANDGLASS SPLIT',22,10,21,'#f6efd7');r.text(s.levelNameEn.toUpperCase(),346,13,14,'#e5dbc1');
  const phase=s.phase==='won'?'BALANCED':s.phase==='lost'?'RUN ENDED':'IN PROGRESS';r.text(phase,788,13,14,'#f4d49a');
  r.rect(24,58,166,115,'#f5f0df');r.text('HOPPER',36,69,14,SG_MUTED);r.text(s.reservoirMassG+' g',36,89,27,SG_INK);
  r.text(s.reservoirMassG===0?'SUPPLY EMPTY':s.sourceOpen?'SOURCE OPEN':'SOURCE CLOSED',36,125,14,s.sourceOpen?SG_BRASS:SG_INK);r.text('EACH BUNDLE '+s.physics.massPerPacketG+' g',36,148,13,SG_MUTED);
  r.rect(770,58,166,115,'#f5f0df');r.text('IN FLIGHT',782,69,14,SG_MUTED);r.text(s.inventory.inFlightMassG+' g',782,89,27,SG_BRASS);
  r.text('IN CUPS '+s.inventory.cupMassG+' g',782,125,14,SG_INK);r.text('LOST '+s.spillMassG+' g',782,148,13,s.spillMassG?SG_WARN:SG_MUTED);
  r.rect(0,519,960,21,SG_INK);
  let line;
  if(s.phase==='won')line='EMPTY HOPPER / EMPTY CHANNELS / THREE WEIGHTS IN RANGE';
  else if(s.phase==='lost')line='STOPPED / '+s.lostReason.toUpperCase().replace(/-/g,' ');
  else line='A: '+(s.cursor===0?'LEFT':'RIGHT')+' GATE / B: '+(s.sourceOpen?'CLOSE':'OPEN')+' HOPPER';
  r.text(line,22,523,13,'#f7efd9');
  if(s.phase==='playing')r.text(s.sourceOpen?'ROUTE SET AT CONTACT':'RELEASED SAND KEEPS MOVING',686,523,13,'#eed6aa');
}
window.GameDef={id:'sandglass-split',title:'分流沙漏',seed:728,accent:'#bc8a52',background:'#eae9dc',atlas:SG_ATLAS,holdConfirmAsA:false,
  description:'左右选择挡片，A 切换外杯或中杯，B 开关料斗。关阀后，在途沙仍会落下。等料斗和导槽排空，让三个杯各自达到目标容差；溢出即失败。',
  controls:{move:'左右 / 摇杆 · 选挡片',a:'转挡片 / 空格',b:'开关料斗 / B'},actionLabels:['转挡片','开关料斗'],levelLabel:'刻度',levelNames:['双流','错拍','合流'],
  tip:'碰到挡片才定去向，离开后不再改道。关阀只停新沙；先看在途重量。',winTitle:'三杯恰到好处',loseTitle:'本次配沙结束',
  result(s){if(s.phase==='won')return'料斗与导槽已排空，三杯重量均在目标范围。';if(s.lostReason==='overflow')return'有沙溢出。杯已满时，在途沙不会自动停下。';if(s.lostReason==='deadline')return'时间已到。关阀能停供沙，不能暂停计时。';if(s.lostReason==='shortfall')return'有杯未达下限。先核对各杯目标与在途沙。';return'有沙未落入杯口，本次配沙结束。';},
  hud(s){return[{label:'夹阀',value:s.phase==='won'?'完成':s.phase==='lost'?'已结束':s.sourceOpen?'开启':'关闭',tone:''},{label:'料斗余量',value:s.reservoirMassG+' g',tone:''},{label:'在途重量',value:s.inventory.inFlightMassG+' g',tone:''},{label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<10?'warn':''}];},
  render(r,s){sgBackground(r,s);sgCups(r,s);sgGates(r,s);sgPackets(r,s);sgReadouts(r,s);}
};
