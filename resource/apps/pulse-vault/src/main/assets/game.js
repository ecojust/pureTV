/* Original ceramic/glass energy vault. Only public committed resource and receipt facts drive the picture. */
const PV_C={paper:'#f3ecdc',muted:'#beb4cf',ink:'#292037',plum:'#21162e',panel:'#382841',gold:'#efbd61',cyan:'#8edbcc',red:'#f0958b',line:'#756082'};
function pvGradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);for(const [p,color]of stops)g.addColorStop(p,color);return g;}
function pvPath(c,points,fill,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function pvStroke(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function pvEllipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
function pvScrew(c,x,y){pvEllipse(c,x,y,2.8,2.8,'#211d30');pvEllipse(c,x-.3,y-.5,2,2,'#dbcaae');pvStroke(c,[[x-1.4,y-.6],[x+1.2,y-.6]],'#7a6570',.8);}
function pvBackground(c,w,h){
  c.save();c.scale(w/512,h/384);c.fillStyle=pvGradient(c,0,0,512,384,[[0,'#35243d'],[.46,'#241a32'],[1,'#151826']]);c.fillRect(0,0,512,384);
  pvPath(c,[[0,310],[512,290],[512,384],[0,384]],pvGradient(c,0,290,0,384,[[0,'#473749'],[1,'#211f2e']]));
  for(let i=0;i<6;i++){const x=20+i*94;pvStroke(c,[[x,315],[x+29,384]],'#88718412',1);}pvStroke(c,[[0,310],[512,290]],'#aa8b931e',1);
  pvEllipse(c,151,283,107,14,'#0d101d55');c.restore();
}
function pvPanel(c,w,h){
  c.save();c.scale(w/256,h/256);pvPath(c,[[10,2],[246,2],[254,10],[254,246],[246,254],[10,254],[2,246],[2,10]],'#1b1528');
  pvPath(c,[[11,4],[245,4],[251,11],[251,245],[245,251],[11,251],[5,245],[5,11]],pvGradient(c,0,0,256,256,[[0,'#4c3954'],[.5,'#35283f'],[1,'#292438']]),'#8d728c',1);
  pvStroke(c,[[11,247],[8,243],[8,12],[13,8],[243,8]],'#b59c9b35',1);for(const x of [13,243])for(const y of [13,243])pvScrew(c,x,y);c.restore();
}
function pvVessel(c,w,h){
  c.save();c.scale(w/192,h/256);pvEllipse(c,96,239,82,12,'#0c122252');
  pvPath(c,[[33,231],[24,213],[27,44],[41,25],[151,25],[165,44],[168,213],[159,231]],pvGradient(c,20,20,170,230,[[0,'#fff5dd'],[.24,'#bcb2ba'],[.54,'#ece5d4'],[.8,'#8c829b'],[1,'#c9c0bf']]),'#544863',2);
  for(const x of [31,151]){c.fillStyle='#847a96';c.fillRect(x,60,10,141);for(let y=65;y<204;y+=13){c.fillStyle='#e8e1d3';c.fillRect(x-2,y,14,4);}}
  pvPath(c,[[43,35],[149,35],[153,40],[153,211],[146,220],[46,220],[39,211],[39,40]],'#32243e','#fff0d2',1.5);
  c.fillStyle=pvGradient(c,48,36,144,208,[[0,'#1d2238'],[.5,'#453654'],[1,'#171b2c']]);c.fillRect(48,36,96,172);
  pvStroke(c,[[46,39],[46,211],[143,211]],'#82748c',1);pvStroke(c,[[146,39],[146,207]],'#110f21',2);
  pvEllipse(c,96,26,55,16,'#544459');pvEllipse(c,96,23,55,15,pvGradient(c,44,10,148,35,[[0,'#fff7df'],[.4,'#dfd1bc'],[1,'#897b8d']]));
  pvEllipse(c,96,20,36,8,'#514256');pvEllipse(c,96,19,25,5,'#d3ab68');pvStroke(c,[[69,18],[120,18]],'#fff2bb',1);
  pvPath(c,[[36,220],[156,220],[163,237],[29,237]],pvGradient(c,28,220,160,237,[[0,'#eee3cd'],[.55,'#b7a5ad'],[1,'#6f607d']]),'#4d4059',1);
  for(const x of [47,145]){pvScrew(c,x,228);pvScrew(c,x,44);}c.restore();
}
function pvGlass(c,w,h){
  c.save();c.scale(w/128,h/192);c.fillStyle=pvGradient(c,0,0,128,0,[[0,'#d3adff22'],[.2,'#ded6ff08'],[.7,'#786da600'],[1,'#f4d9f226']]);c.fillRect(0,0,128,192);
  pvPath(c,[[8,0],[28,0],[18,192],[8,192]],'#f5e2ff20');pvPath(c,[[103,0],[111,0],[96,192],[91,192]],'#fff3e50f');pvStroke(c,[[3,2],[3,190]],'#e8c7ef60',1);pvStroke(c,[[124,2],[124,190]],'#e8c7ef35',1);c.restore();
}
function pvEnergy(c,w,h){
  c.save();c.scale(w/64,h/128);c.fillStyle=pvGradient(c,0,0,64,128,[[0,'#ffe9ad'],[.08,'#e6b15d'],[.48,'#af704b'],[1,'#8c4c45']]);c.fillRect(0,0,64,128);
  c.fillStyle='#ffe7aa50';c.fillRect(5,0,4,128);c.fillStyle='#e8b97033';c.fillRect(49,0,8,128);pvStroke(c,[[0,2],[64,2]],'#fff2cb',2);c.restore();
}
function pvThermometer(c,w,h){
  c.save();c.scale(w/96,h/256);pvPath(c,[[29,7],[67,7],[75,15],[75,215],[66,240],[30,240],[21,215],[21,15]],pvGradient(c,20,0,75,256,[[0,'#e8e1d3'],[.35,'#a89ba9'],[.7,'#dccdbc'],[1,'#75657d']]),'#33263f',2);
  c.fillStyle='#251f34';c.fillRect(35,24,26,173);pvEllipse(c,48,211,22,22,'#31283e');pvEllipse(c,48,211,15,15,'#70505f');pvStroke(c,[[29,22],[29,192]],'#fff0d54d',1);
  for(let i=0;i<=10;i++){const y=24+i*17.3;pvStroke(c,[[62,y],[i%5===0?72:68,y]],'#64536e',1);}pvScrew(c,48,12);c.restore();
}
function pvDoorPainter(open){return function(c,w,h){
  c.save();c.scale(w/112,h/160);pvPath(c,[[12,4],[100,4],[109,16],[109,146],[99,157],[13,157],[3,147],[3,15]],'#1b1728');
  pvPath(c,[[13,7],[98,7],[105,17],[105,144],[97,152],[15,152],[8,144],[8,18]],pvGradient(c,0,0,112,160,[[0,'#f1e8d5'],[.2,'#b9abb7'],[.6,'#e6d4c3'],[1,'#77667f']]),'#e8d7bf',1);
  c.fillStyle='#2c243b';c.fillRect(20,25,72,106);for(const y of [31,123]){c.fillStyle='#7e697f';c.fillRect(14,y,6,7);c.fillRect(92,y,6,7);}
  if(open){c.fillStyle=pvGradient(c,25,26,90,130,[[0,'#142a32'],[1,'#284b4b']]);c.fillRect(23,28,66,101);for(const x of [24,79]){c.fillStyle='#8ac9bd';c.fillRect(x,30,8,97);}pvStroke(c,[[41,78],[52,90],[73,61]],'#a9ead4',5);}
  else{pvPath(c,[[23,28],[89,28],[89,129],[23,129]],pvGradient(c,20,20,92,140,[[0,'#735871'],[.5,'#453749'],[1,'#6d4e61']]),'#221c30',1);pvStroke(c,[[56,29],[56,128]],'#bd9f97',2);pvEllipse(c,56,78,21,24,'#2b263d');c.strokeStyle='#cdbb9a';c.lineWidth=4;c.beginPath();c.arc(56,72,9,Math.PI,Math.PI*2);c.stroke();c.fillStyle='#cdbb9a';c.fillRect(43,72,26,19);pvEllipse(c,56,80,3,3,'#3b3043');}
  for(const x of [14,98])for(const y of [16,143])pvScrew(c,x,y);pvStroke(c,[[29,142],[83,142]],open?'#a1dec8':'#95747f',2);c.restore();
};}
const PV_ATLAS={builtins:[],tiles:[
  {name:'pv_background',x:0,y:0,w:512,h:384,paint:pvBackground},{name:'pv_vessel',x:512,y:0,w:192,h:256,paint:pvVessel},
  {name:'pv_thermometer',x:704,y:0,w:96,h:256,paint:pvThermometer},{name:'pv_door_closed',x:800,y:0,w:112,h:160,paint:pvDoorPainter(false)},
  {name:'pv_door_open',x:912,y:0,w:112,h:160,paint:pvDoorPainter(true)},{name:'pv_glass',x:512,y:256,w:128,h:192,paint:pvGlass},
  {name:'pv_panel',x:0,y:768,w:256,h:256,paint:pvPanel},{name:'pv_energy',x:768,y:768,w:64,h:128,paint:pvEnergy}
]};
function pvText(r,text,cx,y,size,color){r.text(text,cx-r.measureText(text,size)/2,y,size,color);}
function pvRight(r,text,right,y,size,color){r.text(text,right-r.measureText(text,size),y,size,color);}
function pvLast(list){return list.length?list[list.length-1]:null;}
function pvBox(r,x,y,w,h,color){r.line(x,y,x+w,y,2,color);r.line(x+w,y,x+w,y+h,2,color);r.line(x+w,y+h,x,y+h,2,color);r.line(x,y+h,x,y,2,color);}
function pvPanelView(r,x,y,w,h){r.sprite('pv_panel',x+w/2,y+h/2,w,h,0,'#fff');}
function pvStorage(r,s){
  pvPanelView(r,20,76,316,316);r.text('ENERGY / EU',36,88,15,PV_C.paper);pvRight(r,s.energyEU+' / '+s.capacityEU,318,84,26,PV_C.gold);
  r.sprite('pv_vessel',178,246,240,256,0,'#fff');const x=118,top=154,bottom=326,w=120,h=172,fill=h*s.energyEU/s.capacityEU;
  if(fill>0)r.sprite('pv_energy',x+w/2,bottom-fill/2,w,fill,0,'#fff');
  r.sprite('pv_glass',x+w/2,(top+bottom)/2,w,h,0,'#fff');
  for(let i=0;i<=6;i++){const y=bottom-h*i/6;r.line(x-7,y,x-1,y,1,'#cdb6c6');if(i%3===0)pvRight(r,String(s.capacityEU*i/6),x-12,y-6,13,PV_C.muted);}
  const ry=bottom-h*s.reserveEU/s.capacityEU;r.line(x,ry,x+w,ry,1,PV_C.cyan);r.line(x+w,ry,x+w+9,ry,2,PV_C.cyan);r.text(s.reserveEU+' R',x+w+13,ry-6,13,PV_C.cyan);
  const live=s.phase==='playing'&&s.charging&&!s.inputState.quarantined,receipt=pvLast(s.pulseReceipts),recent=receipt&&s.tick-receipt.endedTick<16&&s.phase==='playing';
  r.circle(178,137,5,live?PV_C.cyan:'#73617e');if(recent&&receipt.charging)pvBox(r,x-3,top-3,w+6,h+6,receipt.overflowLostEU?PV_C.red:PV_C.gold);
  r.rect(33,363,290,22,'#34263f');pvText(r,'KEEP '+s.reserveEU+' EU AT END',178,367,14,s.energyEU>=s.reserveEU?PV_C.cyan:PV_C.muted);
}
function pvHeat(r,s){
  pvPanelView(r,356,76,164,316);r.text('HEAT / HU',372,88,15,PV_C.paper);pvText(r,String(s.heatHU),438,110,28,s.heatHU>=s.heatLimitHU*.8?PV_C.red:PV_C.paper);
  r.sprite('pv_thermometer',400,226,63,146,0,'#fff');const top=166.7,bottom=265.3,h=bottom-top,fill=h*Math.min(s.heatHU/s.heatLimitHU,1);
  if(fill>0)r.rect(391.5,bottom-fill,17,fill,PV_C.red);r.circle(400,273,8,s.heatHU>0?'#c67d80':'#70505f');
  r.text(String(s.heatLimitHU),428,160,14,PV_C.red);r.text('0',428,258,14,PV_C.muted);r.text('LIMIT',455,162,12,PV_C.muted);
  const peak=s.terminal?s.terminal.peakHeatHU:s.lastStep?s.lastStep.peakHeatHU:s.heatHU;r.text((s.terminal?'END PEAK ':'STEP PEAK ')+peak,372,302,14,peak>=s.heatLimitHU?PV_C.red:PV_C.muted);
  r.line(371,327,505,327,1,PV_C.line);r.text('OVERFLOW '+s.energyLedger.overflowLostEU,372,340,13,PV_C.red);r.text('DOSE WASTE '+s.energyLedger.dischargeWasteEU,372,364,13,PV_C.gold);
}
function pvLocks(r,s){
  pvPanelView(r,540,76,400,222);r.text('SEQUENTIAL LOCKS',556,88,15,PV_C.paper);
  s.locks.forEach((lock,i)=>{const cx=590+i*99,open=lock.status==='open',current=i===s.currentLockIndex&&s.phase==='playing';
    pvText(r,'0'+(i+1),cx,112,14,current?PV_C.gold:PV_C.muted);r.sprite(open?'pv_door_open':'pv_door_closed',cx,188,72,104,0,'#fff');
    pvText(r,lock.thresholdEU+' EU',cx,245,19,open?PV_C.cyan:PV_C.paper);pvText(r,open?'OPEN':current?'CURRENT':'LOCKED',cx,274,12,open?PV_C.cyan:current?PV_C.gold:PV_C.muted);
    if(current)pvBox(r,cx-44,108,88,180,PV_C.gold);
  });
}
function pvDose(r,s){
  r.text('SELECT DOSE / B',546,308,14,PV_C.paper);const active=s.currentLockIndex<s.locks.length;
  pvRight(r,active?'GATE '+s.locks[s.currentLockIndex].thresholdEU+' EU':'ALL LOCKS OPEN',936,308,14,active?PV_C.muted:PV_C.cyan);
  s.doseOptionsEU.forEach((dose,i)=>{const x=546+i*79,selected=i===s.doseIndex;r.rect(x,332,73,42,selected?'#dcc2a0':'#44344e');if(selected)pvBox(r,x,332,73,42,PV_C.gold);pvText(r,String(dose),x+36.5,339,25,selected?PV_C.ink:PV_C.muted);});
  const text=s.phase==='won'?'LOCKS AND RESERVE COMPLETE':s.phase==='lost'?'DISCHARGE ENDED':!active?(s.energyEU>=s.reserveEU?'RESERVE READY':'WAITING FOR FINAL RESERVE'):s.energyEU<s.selectedDoseEU?'SELECTED DOSE EXCEEDS STOCK':s.selectedDoseEU<s.locks[s.currentLockIndex].thresholdEU?'LOW DOSE WILL BE WASTED':'B SPENDS '+s.selectedDoseEU+' EU ON CURRENT LOCK';
  r.text(text,546,382,13,s.phase==='lost'||(active&&(s.energyEU<s.selectedDoseEU||s.selectedDoseEU<s.locks[s.currentLockIndex].thresholdEU))?PV_C.red:PV_C.cyan);
}
const PV_PULSE_NAMES={missed:'MISSED',collected:'COLLECTED',overflow:'OVERFLOW'};
const PV_DISCHARGE_NAMES={no_current_lock:'NO CURRENT LOCK',insufficient_stock:'STOCK TOO LOW',below_threshold:'BELOW THRESHOLD',opened:'LOCK OPENED'};
function pvPulse(r,s){
  pvPanelView(r,20,410,920,62);const next=s.supply.nextPulse,hz=s.physics.ticksPerSecond,last=pvLast(s.pulseReceipts);
  r.text(next?'NEXT PULSE':'SUPPLY ENDED',36,422,14,PV_C.paper);if(next){r.text('+'+next.amountEU+' EU',170,419,22,PV_C.gold);r.text((next.ticksUntil/hz).toFixed(2)+' S',283,420,20,PV_C.paper);const width=184*(1-next.ticksUntil/s.scenario.periodTicks);r.rect(394,424,184,7,'#63516d');if(width>0)r.rect(394,424,width,7,PV_C.gold);}
  const state=s.phase!=='playing'?'TIMELINE FROZEN':s.inputState.quarantined?'RELEASE ALL CONTROLS':s.charging?'A HELD / RECEIVING':'HOLD A TO RECEIVE';r.text(state,36,448,13,s.charging&&s.phase==='playing'?PV_C.cyan:PV_C.muted);
  r.text('LEFT '+s.supply.remainingPulseCount,626,422,14,PV_C.paper);r.text('FUTURE '+s.supply.futureSupplyEU+' EU',626,448,13,PV_C.muted);
  r.text(last?'LAST #'+last.index:'NO PULSE YET',800,422,14,PV_C.paper);r.text(last?PV_PULSE_NAMES[last.result]+' '+last.amountEU:'',800,448,13,last?.result==='missed'||last?.overflowLostEU?PV_C.red:PV_C.cyan);
}
function pvHeaderFooter(r,s){
  r.rect(0,0,960,59,'#21182d');r.line(20,58,940,58,1,PV_C.line);r.text('PULSE VAULT',22,17,25,PV_C.paper);r.text('OPEN '+s.openedCount+'/'+s.locks.length,278,20,18,PV_C.cyan);
  r.text('MAX AVAILABLE '+s.supply.optimisticAvailableEU+' / NEED '+s.supply.requiredEU,438,22,14,s.supply.feasibleByEnergy?PV_C.muted:PV_C.red);pvRight(r,(Math.max(0,s.deadlineTick-s.tick)/s.physics.ticksPerSecond).toFixed(1)+' S',936,18,21,PV_C.paper);
  const d=pvLast(s.dischargeReceipts);r.text(d?'LAST B: '+PV_DISCHARGE_NAMES[d.result]:'B RELEASES ONE DOSE TO ONE LOCK',24,486,14,d&&d.result!=='opened'?PV_C.red:PV_C.paper);
  if(d){r.text('SPENT '+d.spentEU+' / USED '+d.usefulEU+' / WASTE '+d.wasteEU,434,486,13,PV_C.muted);pvRight(r,'AT '+(d.boundaryTick/s.physics.ticksPerSecond).toFixed(2)+' S',936,486,13,PV_C.muted);}
  r.rect(0,516,960,24,'#191826');let text;
  if(s.phase==='won')text='FOUR LOCKS OPEN / REQUIRED RESERVE RETAINED';else if(s.phase==='lost')text=s.lostReason==='overheat'?'OVERHEAT / END PEAK '+s.terminal.peakHeatHU+' HU, NOW '+s.heatHU+' HU':s.lostReason==='energy_exhausted'?'ENERGY EXHAUSTED / EVEN ALL FUTURE SUPPLY IS TOO LITTLE':'DEADLINE REACHED';
  else text=s.inputState.quarantined?'RELEASE A / B / DIRECTIONS TO RE-ARM':s.currentLockIndex===s.locks.length?'ALL LOCKS OPEN / KEEP COLLECTING THE REQUIRED RESERVE':'HOLD A: COLLECT / LEFT-RIGHT: DOSE / B: DISCHARGE';
  r.text(text,24,522,13,s.phase==='lost'?PV_C.red:PV_C.paper);
}
function pvInstallBlueprint(){
  if(typeof document==='undefined'||document.getElementById('pv-blueprint'))return;const copy=document.getElementById('dialog-copy');if(!copy)return;copy.closest('.dialog').classList.add('pv-dialog');
  const style=document.createElement('style');style.id='pv-blueprint-style';style.textContent='.pv-dialog{width:min(660px,96%);padding:14px 24px}.pv-dialog h2{font-size:28px;margin:6px 0}.pv-dialog #dialog-copy{margin:6px 0}.pv-dialog .difficulty{margin:8px 0}.pv-dialog .primary{margin-top:8px}.pv-dialog .fine{margin-top:8px}.pv-dialog #pv-blueprint{margin:7px 0;padding:7px 10px;border:1px solid #b697b64d;border-radius:10px;background:#5946612b;text-align:left}.pv-dialog #pv-blueprint[hidden]{display:none}.pv-dialog .pv-blueprint-locks{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-bottom:5px}.pv-dialog .pv-blueprint-lock{padding:3px 2px;text-align:center;background:#dcc4aa12;border-radius:6px}.pv-dialog .pv-blueprint-name{font-size:11px;line-height:1.3;margin-bottom:2px;color:#c8b7d2}.pv-dialog .pv-blueprint-threshold{font-size:17px;line-height:1.3;color:#f0d29c}.pv-dialog #pv-blueprint-pulses,.pv-dialog #pv-blueprint-limits,.pv-dialog #pv-blueprint-dose,.pv-dialog #pv-blueprint-rule{font-size:12px;line-height:1.45}.pv-dialog #pv-blueprint-rule{color:#a7ddce}@media(max-height:620px){.pv-dialog{padding:8px 18px}.pv-dialog .brand{font-size:10px}.pv-dialog h2{font-size:22px;line-height:1.1;margin:4px 0}.pv-dialog #dialog-copy{font-size:12px;line-height:1.4;margin:4px 0}.pv-dialog .difficulty{margin:5px 0}.pv-dialog .primary{padding:8px 16px;margin-top:5px}.pv-dialog .fine{font-size:10px;margin-top:5px}.pv-dialog #pv-blueprint{margin:5px 0;padding:4px 8px}.pv-dialog .pv-blueprint-locks{margin-bottom:3px}.pv-dialog .pv-blueprint-lock{padding:2px}.pv-dialog .pv-blueprint-threshold{font-size:15px}.pv-dialog #pv-blueprint-pulses,.pv-dialog #pv-blueprint-limits,.pv-dialog #pv-blueprint-dose,.pv-dialog #pv-blueprint-rule{font-size:11px;line-height:1.4}}';document.head.appendChild(style);
  const box=document.createElement('div');box.id='pv-blueprint';box.setAttribute('aria-label','本关完整能量与门锁蓝图');const row=document.createElement('div');row.className='pv-blueprint-locks';box.appendChild(row);for(const id of ['pulses','limits','dose','rule']){const e=document.createElement('div');e.id='pv-blueprint-'+id;box.appendChild(e);}copy.insertAdjacentElement('afterend',box);
}
function pvSyncBlueprint(s){
  pvInstallBlueprint();if(typeof document==='undefined')return;const box=document.getElementById('pv-blueprint');if(!box)return;box.hidden=s.phase!=='playing';if(box.dataset.scenarioId===s.scenarioId)return;box.dataset.scenarioId=s.scenarioId;const row=box.querySelector('.pv-blueprint-locks');row.replaceChildren();
  s.locks.forEach((lock,i)=>{const card=document.createElement('div');card.className='pv-blueprint-lock';card.dataset.lockId=lock.id;const label=document.createElement('div');label.className='pv-blueprint-name';label.textContent='锁 '+(i+1);const value=document.createElement('div');value.className='pv-blueprint-threshold';value.textContent=lock.thresholdEU+' EU';card.append(label,value);row.appendChild(card);});
  const sc=s.scenario;document.getElementById('pv-blueprint-pulses').textContent='脉冲 '+sc.pulsePatternEU.join(' / ')+' EU · 每'+sc.periodTicks/s.physics.ticksPerSecond+'秒 · 共'+sc.pulseCount+'次';
  document.getElementById('pv-blueprint-limits').textContent='容量 '+s.capacityEU+' EU · 终储备 '+s.reserveEU+' EU · 过热 '+s.heatLimitHU+' HU';document.getElementById('pv-blueprint-dose').textContent='放电档 '+s.doseOptionsEU.join(' / ')+' EU';document.getElementById('pv-blueprint-rule').textContent='按住A收能 · B向当前门释放 · 过量不穿透';
}
window.GameDef={id:'pulse-vault',title:'脉冲储库',subtitle:'PULSE VAULT',seed:735,holdConfirmAsA:true,atlas:PV_ATLAS,background:'#251b32',
  description:'按住A收取脉冲，左右选档，B向当前门放电。依次开四门并留下储备；留意热度与浪费。',controls:{move:'左右 / 摇杆 · 选档',a:'按住收能 / 确认·空格',b:'分档释放 / B'},actionLabels:['按住收能','释放能量'],levelLabel:'供能谱',levelNames:['均流试验','双峰接力','三拍深锁'],tagline:'逐门供能，留下最后的储备',tip:'低档全浪费，过量只开一门；容量有限，收能会升温。松开A会漏过脉冲。',winTitle:'储库契约完成',loseTitle:'储库运行结束',
  result(s){return s.phase==='won'?'四门已开，终储备达标。':s.lostReason==='overheat'?'热峰 '+s.terminal.peakHeatHU+' HU 触发过热。':s.lostReason==='energy_exhausted'?'剩余总能量不足。减少漏收与浪费。':'时间已到，门锁或储备尚未完成。';},
  hud(s){pvSyncBlueprint(s);return[{label:'当前储能',value:s.energyEU+' / '+s.capacityEU+' EU',tone:''},{label:'当前热度',value:s.heatHU+' / '+s.heatLimitHU+' HU',tone:s.heatHU>=s.heatLimitHU*.8?'warn':''},{label:'已开门锁',value:s.openedCount+'/'+s.locks.length,tone:s.phase==='won'?'good':''},{label:'终储备要求',value:s.reserveEU+' EU',tone:s.phase==='won'?'good':''}];},
  render(r,s){r.sprite('pv_background',480,270,960,540,0,'#fff');pvStorage(r,s);pvHeat(r,s);pvLocks(r,s);pvDose(r,s);pvPulse(r,s);pvHeaderFooter(r,s);}
};
