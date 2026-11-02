/* Battery Exchange: public committed inventory, real wiring and last-interval readings. */
(function(root){
'use strict';
/* Original static component painters only. No state schema, Model access or execution. */
function batteryRound(c,x,y,w,h,r,fill,stroke,width){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width||1;c.stroke();}}
function batteryCellArt(c,w,h,a){
  c.save();c.scale(w/128,h/176);a.ellipse(c,67,158,42,11,'#29495831');
  a.path(c,[[29,39],[99,39],[99,145],[92,155],[35,155],[29,145]],a.linear(c,28,0,100,0,[[0,'#75949f'],[.12,'#bdd0d2'],[.27,'#f1f3e7'],[.52,'#d2dfdc'],[.79,'#95afb6'],[1,'#456a7b']]),'#638793',1.2);
  a.ellipse(c,64,145,35,11,'#426b7d');a.path(c,[[29,122],[99,122],[99,144],[91,151],[37,151],[29,143]],a.linear(c,29,0,99,0,[[0,'#2f546e'],[.35,'#65889a'],[1,'#274b64']]));
  a.ellipse(c,64,39,35,12,'#9db7bc');a.ellipse(c,64,36,35,12,a.linear(c,29,27,99,45,[[0,'#eef4e5'],[.5,'#bdcfcf'],[1,'#7a9ba7']]),'#6c929c',1);
  a.path(c,[[51,20],[77,20],[77,35],[72,39],[55,39],[51,35]],a.linear(c,50,0,78,0,[[0,'#b97844'],[.35,'#f4c889'],[1,'#9b5b38']]),'#986442',1);a.ellipse(c,64,20,13,5,'#efc798');
  c.fillStyle='#f5ede0';c.fillRect(38,57,48,41);c.strokeStyle='#b5c5bc';c.lineWidth=1;c.strokeRect(38,57,48,41);
  for(let i=0;i<7;i++){c.strokeStyle=i%2?'#eef4e637':'#5c829325';c.lineWidth=.7;c.beginPath();c.moveTo(33+i*9,45);c.lineTo(33+i*9,119);c.stroke();}
  c.strokeStyle='#a2c0c5';c.lineWidth=1.3;for(const x of[38,90]){c.beginPath();c.moveTo(x,127);c.lineTo(x,140);c.stroke();}
  c.fillStyle='#4f7484';c.fillRect(55,105,18,2);c.fillStyle='#6e8b96';c.fillRect(48,111,32,1);c.restore();
}
function batteryDockArt(c,w,h,a){
  c.save();c.scale(w/144,h/192);a.ellipse(c,74,175,63,11,'#2949582b');
  batteryRound(c,7,15,130,163,13,a.linear(c,0,15,0,179,[[0,'#e7e9db'],[.2,'#bdcfcd'],[1,'#748f9a']]),'#688894',1.8);batteryRound(c,17,25,110,140,9,'#375a6a','#9ab4b8',1.5);
  batteryRound(c,31,36,82,116,8,'#243d50','#6e8a95',1.2);c.fillStyle='#1b3448';c.fillRect(42,46,60,94);
  for(const [x,y]of[[17,24],[127,24],[17,168],[127,168]]){a.ellipse(c,x,y,3.5,3.5,'#516f7c');c.strokeStyle='#b2c7c8';c.lineWidth=1;c.beginPath();c.moveTo(x-2,y);c.lineTo(x+2,y);c.stroke();}
  for(const y of[26,158]){batteryRound(c,57,y-6,30,12,3,a.linear(c,57,y-6,87,y+6,[[0,'#f5d39c'],[.5,'#b87743'],[1,'#e6b273']]),'#8d6945',1);c.strokeStyle='#ffe1ae';c.lineWidth=1;c.beginPath();c.moveTo(61,y-3);c.lineTo(83,y-3);c.stroke();}
  c.fillStyle='#d9b070';for(let i=0;i<3;i++)a.path(c,[[19+i*7,148],[23+i*7,148],[26+i*7,156],[22+i*7,156]],'#d9b070');c.restore();
}
function batteryBeaconArt(c,w,h,a){
  c.save();c.scale(w/192,h/192);a.ellipse(c,98,172,72,13,'#2a4c5d2c');
  a.path(c,[[40,145],[147,145],[165,159],[155,178],[36,178],[27,159]],a.linear(c,0,143,0,179,[[0,'#cbd9d3'],[.45,'#91a9af'],[1,'#456f82']]),'#57798b',1.5);a.ellipse(c,96,150,50,13,'#456c7a');
  a.path(c,[[72,111],[119,111],[124,147],[109,156],[81,156],[67,147]],a.linear(c,68,0,124,0,[[0,'#54798c'],[.3,'#b0c8cc'],[1,'#345c73']]),'#42697d',1);
  a.path(c,[[53,40],[137,40],[130,111],[115,122],[77,122],[61,111]],a.linear(c,53,0,137,0,[[0,'#8baeb9'],[.25,'#dcece3'],[.5,'#bdd6d6'],[1,'#648b9f']]),'#7196a6',1.3);
  for(let i=0;i<6;i++){a.path(c,[[59+i*12,43],[64+i*12,43],[63+i*11.5,108],[59+i*11.5,112]],i%2?'#edf5dd4f':'#4c7d9733');}
  a.ellipse(c,95,40,42,12,'#6d93a4');a.path(c,[[51,35],[70,17],[119,17],[140,35],[135,44],[56,44]],a.linear(c,50,17,138,45,[[0,'#b2c9d0'],[.5,'#7396a8'],[1,'#365e78']]),'#547d90',1.3);a.ellipse(c,95,17,25,7,'#d6e3dd');
  for(const x of[48,144])a.ellipse(c,x,161,4,3,'#e4e8d6');c.restore();
}
function batteryPumpArt(c,w,h,a){
  c.save();c.scale(w/240,h/176);a.ellipse(c,126,151,101,13,'#2a4c5d2c');
  a.path(c,[[19,126],[212,126],[231,143],[222,160],[23,160],[10,143]],a.linear(c,0,126,0,161,[[0,'#cfdacf'],[.45,'#97b0b0'],[1,'#577e8b']]),'#537986',1.5);
  batteryRound(c,23,62,105,72,11,a.linear(c,20,60,110,130,[[0,'#6c9caf'],[.45,'#355f79'],[1,'#23445f']]),'#365d71',1.5);for(let i=0;i<8;i++){c.strokeStyle='#8db1ba';c.lineWidth=2;c.beginPath();c.moveTo(37+i*10,73);c.lineTo(37+i*10,119);c.stroke();}
  a.ellipse(c,135,99,46,45,a.linear(c,94,60,173,141,[[0,'#8bb3ba'],[.4,'#527d8d'],[1,'#294c67']]),'#466f82',2);a.ellipse(c,135,99,31,31,'#26475d');a.ellipse(c,135,99,25,25,'#416e80');
  a.path(c,[[152,60],[152,27],[180,27],[180,74],[166,83]],a.linear(c,152,0,180,0,[[0,'#90b6bd'],[.35,'#c7d9d0'],[1,'#537c91']]),'#64899b',1.2);a.ellipse(c,166,27,14,6,'#294e62');a.ellipse(c,166,26,18,6,'#acc8cb');a.ellipse(c,166,26,10,3,'#2c5267');
  a.path(c,[[171,87],[210,87],[210,113],[172,113]],a.linear(c,0,86,0,115,[[0,'#c5d8d2'],[.45,'#81a6b0'],[1,'#416981']]),'#557b90',1.5);a.ellipse(c,210,100,7,16,'#d4e1d7');a.ellipse(c,210,100,4,11,'#3b6279');
  for(const [x,y]of[[106,70],[162,70],[106,128],[162,128]]){a.ellipse(c,x,y,3,3,'#dbe7da');a.ellipse(c,x,y,1,1,'#587e8d');}c.restore();
}
function batteryRotorArt(c,w,h,a){
  c.save();c.translate(w/2,h/2);c.scale(w/64,h/64);for(let i=0;i<5;i++){c.save();c.rotate(i*Math.PI*2/5);a.path(c,[[0,0],[-5,-24],[3,-28],[10,-20],[6,-5]],a.linear(c,0,-28,0,0,[[0,'#c1ded6'],[1,'#729ca9']]));c.restore();}a.ellipse(c,0,0,7,7,'#d3e5d8');a.ellipse(c,0,0,3,3,'#6a94a3');c.restore();
}
function batteryBenchArt(c,w,h,a){c.fillStyle=a.linear(c,0,0,w,h,[[0,'#e4e9dd'],[.45,'#cedbd5'],[1,'#b6ccca']]);c.fillRect(0,0,w,h);for(let i=0;i<21;i++){const x=(i*47+9)%w,y=(i*29+6)%h;a.ellipse(c,x,y,1.2,.6,'#5c849516');}c.strokeStyle='#faf6e529';c.lineWidth=1;for(let i=0;i<7;i++){c.beginPath();c.moveTo(0,12+i*18);c.lineTo(w,12+i*18);c.stroke();}}
function batteryLightArt(c,w,h,a){a.ellipse(c,w*.5,h*.5,w*.48,h*.48,a.radial(c,w*.5,h*.5,w*.5,[[0,'#fff2bcce'],[.35,'#ffe5a377'],[1,'#ffe5a300']]));}
const batteryAtlas={builtins:[],tiles:[
  {name:'battery_cell',x:0,y:0,w:128,h:176,paint:batteryCellArt},{name:'battery_dock',x:128,y:0,w:144,h:192,paint:batteryDockArt},
  {name:'battery_beacon',x:272,y:0,w:192,h:192,paint:batteryBeaconArt},{name:'battery_pump',x:464,y:0,w:240,h:176,paint:batteryPumpArt},
  {name:'battery_rotor',x:704,y:0,w:64,h:64,paint:batteryRotorArt},{name:'battery_bench',x:0,y:192,w:256,h:128,paint:batteryBenchArt},
  {name:'battery_light',x:272,y:192,w:128,h:128,paint:batteryLightArt}
]};
const B_INK='#24485d',B_PAPER='#edf0de',B_MUTED='#678694',B_COPPER='#d69558',B_BLUE='#668faf',B_GOOD='#518e7d',B_WARN='#b96950';
const B_CELL_X=[110,260,850],B_ROW_Y=[165,370];
function bCenter(r,t,x,y,size,color){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function bOutline(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function bCheck(r,x,y,color){r.line(x-4,y,x,y+4,2.3,color);r.line(x,y+4,x+7,y-5,2.3,color);}
function bPath(r,points,color,live,elapsed){for(let i=1;i<points.length;i++){const [x1,y1]=points[i-1],[x2,y2]=points[i];r.line(x1,y1+1.8,x2,y2+1.8,5,'#28495e31');r.line(x1,y1,x2,y2,3,color);if(live&&Math.hypot(x2-x1,y2-y1)>45)r.circle((x1+x2)/2,(y1+y2)/2,2.3+Math.sin(elapsed*3+i)*.4,'#fff3bc');}}
function bHeader(r,s){
  r.rect(0,0,960,72,B_INK);r.text('BATTERY EXCHANGE',24,16,21,B_PAPER);r.text(s.physics.nominalCellVoltageV+' V CELLS / C = CHARGE',25,47,13,'#b9d1d0');
  const v=s.viewSegment,label=s.phase==='won'?'SERVICE COMPLETE':s.phase==='lost'?'ROUND ENDED':s.controlsOpen?'OFF WINDOW / SWAP':'SUPPLY '+(v.stageIndex+1)+' / LOCKED';
  r.text(label,300,17,19,s.controlsOpen?'#b8dcc8':B_PAPER);
  const clock=s.phase==='playing'?Math.max(0,v.remainingTicks/s.physics.tickHz).toFixed(2)+' s LEFT':'FINAL READOUT';r.text(clock,300,44,16,'#b9d1d0');
  const n=s.nextSegment;
  if(s.phase==='playing'&&n&&n.kind!=='end'){
    r.text('NEXT '+(n.kind==='window'?'OFF WINDOW':'SUPPLY '+(n.stageIndex+1))+' IN '+Math.max(0,(n.startTick-s.tick)/s.physics.tickHz).toFixed(1)+' s',626,17,16,B_PAPER);
    if(n.kind==='supply'){const bands=s.loads.map(l=>{const q=l.stages[n.stageIndex];return l.id+' '+q.minimumPowerW+'-'+q.maximumPowerW+' W';});r.text(bands.join(' / '),626,45,14,'#b9d1d0');}
    else r.text('EXCHANGE AND WIRING ALLOWED',626,45,13,'#b9d1d0');
  }else{r.text(s.phase==='playing'?'FINAL SUPPLY STAGE':'SIX CELLS / TWO LOADS',626,19,17,B_PAPER);r.text(s.phase==='playing'?'WATCH CHARGE AND HEAT':'FINAL CHARGE AND HEAT',626,46,13,'#b9d1d0');}
}
function bWiring(r,s,load,y){
  const p1=[110,y-41],m1=[110,y+36],p2=[260,y-41],m2=[260,y+36],plus=[396,y-15],minus=[396,y+15],active=s.phase==='playing'&&load.lastElectrical.connected&&load.lastElectrical.currentA>0;
  const pos=B_COPPER,neg=B_BLUE,join='#bc985f';
  if(s.topologies[load.row]==='series'){
    bPath(r,[p1,[110,y-55],[362,y-55],[362,y-15],plus],pos,active,s.elapsed);
    bPath(r,[m1,[110,y+43],[190,y+43],[190,y-41],p2],join,active,s.elapsed);
  }else{
    bPath(r,[p1,p2,[362,y-41],[362,y-15],plus],pos,active,s.elapsed);
    bPath(r,[m1,m2],neg,active,s.elapsed);
  }
  bPath(r,[m2,[330,y+36],[330,y+15],minus],neg,active,s.elapsed);
  r.rect(387,y-26,20,52,'#3d657a');r.circle(396,y-15,4,'#edc38a');r.circle(396,y+15,4,'#9cc5d2');
  for(const x of[110,260]){r.line(x,y-41,x,y-36,2,'#bf8d59');r.text('+',x-20,y-49,13,B_INK);r.text('-',x-20,y+30,13,B_INK);}
}
function bCells(r,s,row,y){
  for(let col=0;col<3;col++){
    const slot=row*3+col,x=B_CELL_X[col],c=s.cells.find(cell=>cell.id===s.slots[slot]),selected=s.cursor===slot,marked=s.sourceSlot===slot;
    if(col===2){r.rect(x-71,y-59,142,174,'#e7ece0');bOutline(r,x-71,y-59,142,174,'#a2b9bd',1);}
    if(selected||marked)bOutline(r,x-65,y-61,130,176,marked?B_COPPER:'#f9f0c5',marked?3:2.5);
    r.sprite('battery_dock',x,y-1,84,112,0,col===2?'#d9e1d7':'#fff');r.sprite('battery_cell',x,y,78,96,0,'#fff');
    bCenter(r,c.id,x,y-14,19,B_INK);
    const ratio=Math.max(0,Math.min(1,c.remainingChargeC/c.initialChargeC));r.rect(x-45,y+47,90,4,'#9fb7b8');r.rect(x-45,y+47,90*ratio,4,c.remainingChargeC<=0?B_WARN:B_GOOD);
    bCenter(r,'Q '+c.remainingChargeC.toFixed(1)+' C',x,y+55,17,c.remainingChargeC<=0?B_WARN:B_INK);
    bCenter(r,'R '+c.resistanceOhm+' Ohm',x,y+76,16,B_INK);
    bCenter(r,'T '+c.temperatureC.toFixed(1)+' C',x,y+97,17,c.temperatureC>=s.physics.cellMaximumTemperatureC?B_WARN:B_INK);
  }
}
function bLoad(r,s,load,y){
  const e=load.lastElectrical,live=s.phase==='playing'&&e.connected&&e.loadPowerW>0;
  r.text(load.id+' '+load.nameEn,391,y-80,17,B_INK);
  if(load.id==='L1'){
    r.sprite('battery_pump',480,y+6,190,139,0,'#fff');r.sprite('battery_rotor',492,y+15,39,39,live?s.elapsed*3.5:0,'#fff');
  }else{
    bPath(r,[[396,y-15],[417,y-15],[417,y+45],[447,y+45]],B_COPPER,live,s.elapsed);bPath(r,[[396,y+15],[410,y+15],[410,y+54],[447,y+54]],B_BLUE,live,s.elapsed);
    r.sprite('battery_beacon',480,y+1,142,142,0,'#fff');r.circle(447,y+45,2.8,'#edc38a');r.circle(447,y+54,2.8,'#9cc5d2');if(live)r.sprite('battery_light',479,y-11,62,65,0,e.powerInBand?'#fff':'#f2b37c');
  }
  r.text('LAST INTERVAL POWER',587,y-69,13,B_MUTED);r.text(e.loadPowerW.toFixed(1)+' W',587,y-48,25,e.powerInBand===false?B_WARN:B_INK);
  r.text(e.terminalVoltageV.toFixed(1)+' V / '+e.currentA.toFixed(2)+' A',587,y-17,14,B_INK);
  r.text('HEAT '+load.temperatureC.toFixed(1)+' / '+s.physics.loadMaximumTemperatureC+' C',587,y+4,13,load.temperatureC>=s.physics.loadMaximumTemperatureC?B_WARN:B_MUTED);
  const status=!s.lastInterval?'NO ELECTRICAL SAMPLE':e.connected?(e.powerInBand?'IN BAND / CREDITING':'OUT OF BAND / NO CREDIT'):e.disconnectReason==='stage-complete'?'STAGE COMPLETE / OFF':e.disconnectReason==='off-window'?'POWER OFF / COOLING':'NO SUPPLY';
  r.text(status,587,y+24,13,e.powerInBand===false?B_WARN:B_GOOD);r.text('STAGE / BAND / SERVICE J',587,y+44,13,B_MUTED);
  load.stages.forEach((stage,i)=>{
    const sy=y+62+i*20,current=s.viewSegment.kind==='supply'&&s.viewSegment.stageIndex===i,upcoming=s.viewSegment.kind==='window'&&s.nextSegment?.stageIndex===i;
    if(current)r.rect(583,sy-2,187,18,'#bdd3ca');else if(upcoming)bOutline(r,583,sy-2,187,18,'#b9cbbd',1);
    r.text(String(i+1),589,sy,13,B_INK);r.text(stage.minimumPowerW+'-'+stage.maximumPowerW+'W',611,sy,13,B_INK);r.text(stage.workJ.toFixed(0)+'/'+stage.targetWorkJ+'J',684,sy,13,B_INK);
    if(stage.completedAtTick!==null)bCheck(r,760,sy+6,B_GOOD);
  });
}
function bBoard(r,s){
  for(let row=0;row<2;row++){
    const y=B_ROW_Y[row],load=s.loads.find(l=>l.row===row);for(let i=0;i<4;i++)r.sprite('battery_bench',128+i*256,y+21,256,202,0,'#fff');
    r.rect(20,y-88,918,23,'#afc5c8');r.text(load.id+' DOCK / '+s.topologies[row].toUpperCase(),31,y-84,16,B_INK);r.text('SPARE / DISCONNECTED',781,y-83,13,B_INK);
    bWiring(r,s,load,y);bCells(r,s,row,y);bLoad(r,s,load,y);
    r.line(20,y+124,938,y+124,2,'#7e9fac');
  }
}
function bFooter(r,s){
  const cell=s.cells.find(c=>c.id===s.slots[s.cursor]);let action;
  if(s.phase==='won')action='ALL STAGES COMPLETE / FINAL READOUT';
  else if(s.phase==='lost')action='ROUND ENDED / '+s.lostReason.toUpperCase().replace(/-/g,' ');
  else if(!s.controlsOpen)action='SUPPLY LOCKED / NO CELL EXCHANGE';
  else if(s.sourceSlot===null)action='SLOT '+(s.cursor+1)+' / '+cell.id+'  A: MARK SOURCE';
  else if(s.sourceSlot===s.cursor)action=cell.id+' MARKED IN PLACE / A: CANCEL';
  else action=s.slots[s.sourceSlot]+' MARKED / A: SWAP WITH '+cell.id;
  r.rect(0,496,960,44,B_INK);r.text(action,24,502,15,B_PAPER);
  const other=s.phase!=='playing'?'NO EDITING':s.sourceSlot!==null?'B: CANCEL MARK':s.controlsOpen?'B: CHANGE ROW WIRING':'B: WIRING LOCKED';r.text(other,690,502,14,'#b9d1d0');
  r.text(s.phase==='playing'?'MARKING KEEPS THE CELL IN ITS SLOT / CHARGE IS NOT REFILLED':'ACTUAL CHARGE, TEMPERATURES AND WORK ARE FROZEN',24,523,13,'#b9d1d0');
}
root.GameDef={
  id:'battery-exchange',title:'电芯交换',tagline:'断电换芯，串并调供',seed:528,accent:'#aacdcc',background:'#c4d7d5',levelLabel:'值守',levelNames:['港口','轮值','夜间'],atlas:batteryAtlas,
  description:'方向选槽。断电窗口内，A 标记电芯，再选目标按 A 交换；B 取消标记或切换该行串并联。两负载按阶段独立完成任务，超出功率范围不计进度。留意余量和温度；右列是备用槽。',
  controls:{move:'方向 / 摇杆 · 选槽',a:'标记·交换 / 空格',b:'接线·取消 / B'},actionLabels:['换电','接线'],tip:'只在断电窗口换芯接线。标记不搬走电芯；任务满额后自动停机。',winTitle:'值守完成',loseTitle:'供电中断',
  result(s){if(s.phase==='won')return '两台负载的全部阶段任务已完成。';return {'cell-charge':'电芯已耗尽。断电窗口重配电芯，保留余量。','cell-overheat':'电芯过热。调整串并接线与电芯组合。','load-overheat':'负载过热。合理分配功率，利用断电冷却。','power-fault':'供电连续偏离要求。提前核对下一阶段功率。','stage-quota':'阶段服务量不足。按要求及时供电。'}[s.lostReason]||'值守未完成。';},
  hud(s){return[{label:'当前阶段',value:s.phase!=='playing'?(s.phase==='won'?'全部完成':'已结束'):s.controlsOpen?'断电窗口':'供电 '+(s.viewSegment.stageIndex+1),tone:s.controlsOpen?'':'warn'},{label:'完成任务',value:s.loads.reduce((n,l)=>n+l.stages.filter(x=>x.completedAtTick!==null).length,0)+' / '+s.loads.reduce((n,l)=>n+l.stages.length,0),tone:''},{label:'总余量',value:s.chargeLedger.remainingChargeC.toFixed(1)+' C',tone:s.chargeLedger.remainingChargeC<=0?'warn':''},{label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<10?'warn':''}];},
  render(r,s){bHeader(r,s);bBoard(r,s);bFooter(r,s);}
};
})(typeof window!=='undefined'?window:globalThis);
