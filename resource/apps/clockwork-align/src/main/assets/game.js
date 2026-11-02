/* Original enamel clockwork bench. Public angles only; no mechanical simulation or target-driven motion. */
function cwGradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);for(const [p,color]of stops)g.addColorStop(p,color);return g;}
function cwPath(c,points,fill,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function cwStroke(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
function cwDisc(c,x,y,r,fill,stroke,width=1){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function cwBench(c,w,h){
  c.save();c.scale(w/512,h/256);c.fillStyle=cwGradient(c,0,0,512,256,[[0,'#79523a'],[.45,'#4b3329'],[1,'#865c3d']]);c.fillRect(0,0,512,256);
  for(let i=0;i<42;i++){const y=3+i*6;c.strokeStyle=i%3?'#9f744b33':'#251c1733';c.lineWidth=1;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(150,y+4,370,y-3,512,y+2);c.stroke();}
  c.fillStyle='#2e332f';c.fillRect(7,7,498,242);c.fillStyle=cwGradient(c,12,12,480,245,[[0,'#f3efdf'],[.5,'#dedfce'],[1,'#cbd3c5']]);c.fillRect(11,11,490,234);
  cwStroke(c,[[12,244],[12,12],[500,12]],'#fff9e8',1);cwStroke(c,[[500,12],[500,244],[12,244]],'#919e8b',1.5);
  for(const x of [17,495])for(const y of [17,239]){cwDisc(c,x,y,2.8,'#a7a98e','#687865',.5);cwStroke(c,[[x-1.7,y],[x+1.7,y]],'#526554',.7);}
  for(let i=0;i<80;i++){const x=24+(i*71)%460,y=24+(i*43)%209;cwStroke(c,[[x,y],[x+3+(i%3)*3,y+.1]],'#faf8ef30',.6);}
  c.restore();
}
function cwGear(c,w,h,teeth){
  c.save();c.scale(w/160,h/160);c.translate(80,80);const pitch=68,add=1.65*68/(teeth*.9),ded=1.95*68/(teeth*.9),points=[];
  // Exactly `teeth` crests, with a crest at screen-up. Compatible addendum/dedendum use one common displayed module.
  for(let i=0;i<teeth;i++)for(const [f,r]of [[-.5,pitch-ded],[-.32,pitch-ded],[-.16,pitch+add],[.16,pitch+add],[.32,pitch-ded]]){const a=(i+f)/teeth*Math.PI*2;points.push([Math.sin(a)*r,-Math.cos(a)*r]);}
  cwPath(c,points,cwGradient(c,-70,-70,70,70,[[0,'#f5d396'],[.24,'#c1934d'],[.53,'#edd1a0'],[.77,'#a06d35'],[1,'#dfbb7d']]),'#705033',1.2);
  c.save();c.scale(.972,.972);cwPath(c,points,null,'#fff1c080',.8);c.restore();
  cwDisc(c,0,0,pitch-ded-3,cwGradient(c,-60,-60,60,65,[[0,'#eedbb4'],[.5,'#ba9157'],[1,'#806039']]),'#86623a',1);
  cwDisc(c,0,0,43,'#3e5360','#eed9a5',1.5);
  for(let i=0;i<6;i++){const a=i*Math.PI/3,ca=Math.cos(a),sa=Math.sin(a);c.save();c.rotate(a);cwPath(c,[[-7,-44],[7,-44],[11,-12],[-11,-12]],cwGradient(c,-7,-30,10,-10,[[0,'#f1d6a0'],[1,'#9c7542']]),'#dab982',.8);c.restore();cwDisc(c,ca*54,sa*54,1.6,'#fff0c9');}
  cwDisc(c,0,0,16,'#bca272','#6c573e',1.5);cwDisc(c,0,0,9,'#294a60','#e5cf9b',1);cwStroke(c,[[-5,0],[5,0]],'#8da7af',1.5);c.restore();
}
function cwDial(c,w,h){
  c.save();c.scale(w/160,h/160);cwDisc(c,80,80,75,'#aa9168','#6d5a40',1.4);cwDisc(c,80,80,70,cwGradient(c,20,20,145,140,[[0,'#fffdf0'],[.7,'#ece8d6'],[1,'#d7dccf']]),'#fffcdf',1.2);
  for(let i=0;i<60;i++){const a=i*Math.PI/30,r=i%5?65:59;cwStroke(c,[[80+Math.sin(a)*r,80-Math.cos(a)*r],[80+Math.sin(a)*68,80-Math.cos(a)*68]],i%5?'#a9afa0':'#455c5a',i%5?.7:1.6);}
  cwDisc(c,80,80,4,'#687d7b');c.restore();
}
function cwClutch(c,w,h){
  c.save();c.scale(w/64,h/96);cwPath(c,[[12,3],[43,3],[53,13],[53,83],[43,93],[12,93]],cwGradient(c,12,0,53,0,[[0,'#edf0e3'],[.22,'#c2ccbf'],[.53,'#6d8a89'],[.7,'#d3d8c5'],[1,'#4d6668']]),'#425b5c',1.4);
  for(let y=14;y<90;y+=13)cwStroke(c,[[16,y],[46,y]],'#73877c',1);cwStroke(c,[[18,7],[18,89]],'#ffffe0',1.4);c.restore();
}
function cwPanel(c,w,h){
  c.save();c.scale(w/240,h/160);c.fillStyle=cwGradient(c,0,0,240,160,[[0,'#fff9e8'],[1,'#dce2d5']]);c.fillRect(0,0,240,160);cwStroke(c,[[0,159],[0,0],[239,0]],'#fffdf0',2);cwStroke(c,[[239,0],[239,159],[0,159]],'#a2ad98',2);
  for(const x of [8,232])for(const y of [8,152]){cwDisc(c,x,y,2.2,'#c8b68a');cwStroke(c,[[x-1.3,y],[x+1.3,y]],'#73836e',.6);}c.restore();
}
const CW_ATLAS={builtins:[],tiles:[
  ...[24,30,36,48,60].map((teeth,i)=>({name:'cw_gear_'+teeth,x:i*160,y:0,w:160,h:160,paint:(c,w,h)=>cwGear(c,w,h,teeth)})),
  {name:'cw_dial',x:800,y:0,w:160,h:160,paint:cwDial},
  {name:'cw_clutch',x:0,y:176,w:64,h:96,paint:cwClutch},
  {name:'cw_panel',x:80,y:176,w:240,h:160,paint:cwPanel},
  {name:'cw_bench',x:0,y:768,w:512,h:256,paint:cwBench}
]};
const CW_INK='#263f43',CW_MUTED='#5c7067',CW_GOLD='#a57b26',CW_BLUE='#245674',CW_GOOD='#24725c',CW_RED='#a34230',CW_SCALE=.9;
function cwDegrees(s,units){return units/s.physics.angleUnitsPerDegree;}
function cwAngle(s,units){return units/s.physics.angleUnitsPerTurn*Math.PI*2;}
function cwFormat(value){return Number(value.toFixed(3)).toString();}
function cwCentered(r,text,cx,y,size,color){r.text(text,cx-r.measureText(text,size)/2,y,size,color);}
function cwRadial(r,x,y,a,r1,r2,width,color){r.line(x+Math.sin(a)*r1,y-Math.cos(a)*r1,x+Math.sin(a)*r2,y-Math.cos(a)*r2,width,color);}
function cwRows(s){return s.trains.map((train,i)=>{const gears=train.gearIds.map(id=>s.gears.find(g=>g.id===id));let x=210;const y=s.trains.length===2?170+i*212:128+i*146;return{train,index:i,y,gears:gears.map((gear,j)=>{if(j)x+=(gears[j-1].teeth+gear.teeth)*CW_SCALE;return{gear,x,y,radius:gear.teeth*CW_SCALE,label:String.fromCharCode(65+i)+j,pointer:s.pointers.find(p=>p.gearId===gear.id)||null};})};});}
function cwMechanism(r,s,row){
  const {train,index,y,gears}=row,selected=s.selectedTrainId===train.id,tone=train.engaged?CW_BLUE:CW_GOOD;
  r.rect(24,y-69,664,139,selected?'#f5f2df':'#e4e5d4');if(selected)r.rect(24,y-69,4,139,CW_GOLD);
  r.text('TRAIN '+String.fromCharCode(65+index),34,y-61,17,CW_INK);r.text(train.engaged?'ENGAGED':'BRAKED',34,y-37,14,tone);
  r.line(120,y,210,y,9,'#70867f');r.line(120,y-2,210,y-2,2,'#d9e0ca');
  r.sprite('cw_clutch',137,y,13,38,0,'#fff');r.sprite('cw_clutch',train.engaged?149:162,y,13,38,Math.PI,'#fff');
  if(!train.engaged){r.rect(172,y+15,14,5,CW_RED);r.rect(174,y-20,10,5,CW_RED);}
  r.text('CLUTCH',132,y+27,13,CW_MUTED);r.text(selected?'SELECTED':'',34,y+51,13,CW_GOLD);
  for(const v of gears){
    const {gear,x,radius,label,pointer}=v,size=radius*160/68,bodyAngle=cwAngle(s,gear.normalizedUnits+gear.toothArtworkOffsetUnits);
    r.circle(x,y+2,radius+2,'#65776333');r.sprite('cw_gear_'+gear.teeth,x,y,size,size,bodyAngle,'#fff');
    if(pointer){
      r.sprite('cw_dial',x,y,radius*1.48,radius*1.48,0,'#fff');const target=cwAngle(s,pointer.targetUnits),tol=cwAngle(s,pointer.toleranceUnits),a=cwAngle(s,pointer.normalizedUnits),bandRadius=radius*.76;
      for(let k=0;k<6;k++){const aa=target-tol+tol*2*k/6,ab=target-tol+tol*2*(k+1)/6;r.line(x+Math.sin(aa)*bandRadius,y-Math.cos(aa)*bandRadius,x+Math.sin(ab)*bandRadius,y-Math.cos(ab)*bandRadius,4,CW_GOLD);}
      cwRadial(r,x,y,target-tol,radius*.66,radius*.86,1,CW_GOLD);cwRadial(r,x,y,target+tol,radius*.66,radius*.86,1,CW_GOLD);
      cwRadial(r,x,y,a,-radius*.13,radius*.64,3.4,CW_BLUE);r.circle(x,y,3.5,'#c8b17b');r.circle(x,y,1.6,CW_INK);
    }
    cwCentered(r,label+' '+gear.teeth+'T',x,y-70,13,CW_INK);
    const speed=cwDegrees(s,gear.velocityUnitsPerTick*s.physics.ticksPerSecond),speedText=speed===0?'STOP':(speed>0?'CW':'CCW')+cwFormat(Math.abs(speed));cwCentered(r,speedText,x,y+62,13,speed===0?CW_GOOD:CW_MUTED);
  }
  const targets=gears.filter(v=>v.pointer);r.text('ACTUAL / TARGET deg',486,y-54,13,CW_MUTED);
  targets.forEach((v,i)=>{const p=v.pointer,yy=y-30+i*50;r.text(v.label+' '+cwFormat(cwDegrees(s,p.normalizedUnits))+' / '+cwFormat(cwDegrees(s,p.targetUnits)),486,yy,16,CW_INK);r.text(p.instantAligned?'IN BAND':'ERROR '+(p.signedErrorUnits>=0?'+':'')+cwFormat(cwDegrees(s,p.signedErrorUnits))+'deg',486,yy+22,13,p.instantAligned?CW_GOOD:CW_RED);});
}
function cwSummary(r,s){
  const x=704,w=236,hz=s.physics.ticksPerSecond,a=s.appointment,finished=s.phase!=='playing',matched=s.pointers.filter(p=>p.instantAligned).length;
  r.sprite('cw_panel',x+w/2,280,w,440,0,'#fff');r.text('MECHANICAL TIME',718,75,14,CW_MUTED);r.text((s.tick/hz).toFixed(1)+' s',718,96,28,CW_INK);
  r.text('APPOINTMENT',718,137,14,CW_MUTED);r.text(cwFormat(a.windowStartTick/hz)+' - '+cwFormat(a.windowEndTick/hz)+' s',718,159,22,CW_INK);
  const status=s.phase==='won'?'HOLD COMPLETE':s.phase==='lost'?'RUN ENDED':a.phase==='before'?'BEFORE WINDOW':a.phase==='eligible'?'WINDOW OPEN':'WINDOW CLOSED';r.text(status,718,190,15,s.phase==='lost'?CW_RED:a.phase==='eligible'||s.phase==='won'?CW_GOOD:CW_MUTED);
  r.line(718,219,926,219,1,'#adb79d');r.text('POINTERS IN BAND',718,233,14,CW_MUTED);r.text(matched+' / '+s.pointers.length,718,255,24,s.alignment.allInstantAligned?CW_GOOD:CW_INK);
  r.text('ONE CONTINUOUS HOLD',718,291,14,CW_MUTED);r.text((s.alignment.holdTicks/hz).toFixed(2)+' / '+cwFormat(a.holdRequiredTicks/hz)+' s',718,314,24,s.phase==='lost'?CW_RED:CW_GOOD);
  r.rect(718,349,208,9,'#c8d0ba');r.rect(718,349,208*Math.min(1,s.alignment.holdTicks/a.holdRequiredTicks),9,s.phase==='lost'?CW_RED:CW_GOOD);
  r.text(finished?'FINAL RECORDED HOLD':a.phase==='before'?'NOT COUNTED YET':s.alignment.lastAllFullInterval?'ALL POINTERS / FULL TICK':'NEEDS ALL / FULL TICK',718,368,13,CW_MUTED);
  r.line(718,395,926,395,1,'#adb79d');r.text('ADJUSTMENTS LEFT',718,410,14,CW_MUTED);r.text(String(s.budget.remaining),718,434,30,s.budget.remaining?CW_INK:CW_RED);r.text('USED '+s.budget.spent+' / '+s.budget.initial,783,443,16,CW_MUTED);
  r.text(s.phase==='won'?'ALL TARGETS HELD':s.phase==='lost'?(s.lostReason==='budget_exhausted'?'BUDGET EXHAUSTED':'APPOINTMENT MISSED'):'COST = CHANGED CLUTCHES',718,479,13,s.phase==='lost'?CW_RED:CW_MUTED);
}
function cwHeaderFooter(r,s){
  r.rect(0,0,960,47,'#334d4b');r.text('CLOCKWORK ALIGNMENT',22,13,22,'#fff3cd');r.text('0deg = UP / CW POSITIVE',362,18,13,'#c7d8ca');r.text('BLUE HAND / GOLD TARGET',704,18,13,'#eee1bd');
  r.rect(0,516,960,24,'#334d4b');let text;
  if(s.phase==='won')text='ALL POINTERS HELD TOGETHER';else if(s.phase==='lost')text=s.lostReason==='budget_exhausted'?'ENDED / ADJUSTMENT BUDGET':'ENDED / APPOINTMENT WINDOW';else text=s.inputState.quarantined?'RELEASE CONTROLS TO REARM':'A: TOGGLE SELECTED / B: BRAKE ALL';
  r.text(text,22,522,13,'#fff3cd');r.text('SPEED deg/s / T = TEETH',516,522,13,'#d5dfce');const tol=cwFormat(cwDegrees(s,s.pointers[0].toleranceUnits));r.text('TOL +/-'+tol+'deg',799,522,13,'#fff3cd');
}
let cwBlueprintNode=null,cwBlueprintKey='';
function cwInstallBlueprint(){
  if(typeof document==='undefined'||cwBlueprintNode)return;const copy=document.getElementById('dialog-copy');if(!copy)return;
  const dialog=copy.closest('.dialog');dialog.classList.add('cw-dialog');const style=document.createElement('style');style.id='cw-dialog-style';
  style.textContent=`.cw-dialog{width:min(600px,94%);padding:14px 18px}.cw-dialog #dialog-kicker{display:none}.cw-dialog h2{font-size:24px;line-height:1.15;margin:0 0 6px}.cw-dialog #dialog-copy{font-size:13px;line-height:1.4;margin:4px 0 7px}.cw-dialog #cw-blueprint{padding:6px 9px;border:1px solid #6c816e;border-radius:8px;background:#172c32;text-align:left}.cw-blueprint-row{display:grid;grid-template-columns:54% 46%;align-items:center;padding:5px 0;line-height:17px;font-size:13px}.cw-blueprint-row+.cw-blueprint-row{border-top:1px solid #3b5151}.cw-blueprint-chain{color:#f5dfac;white-space:nowrap}.cw-blueprint-targets{color:#e2efdf;white-space:nowrap}.cw-dialog #cw-blueprint-rule{color:#a9cfbd;font-size:12px;line-height:17px;margin:5px 0 0}.cw-dialog .difficulty{margin:7px 0 5px}.cw-dialog .difficulty button{padding:4px 9px}.cw-dialog .primary{margin-top:4px;padding:8px 12px;font-size:14px}.cw-dialog #dialog-help{line-height:1.3;margin:5px 0 0}.cw-dialog #cw-blueprint[hidden]{display:none}@media(max-height:620px){.cw-dialog{padding:8px 12px;width:min(600px,96%)}.cw-dialog h2{font-size:22px;margin-bottom:4px}.cw-dialog #dialog-copy{font-size:12px;line-height:1.25;margin:3px 0 5px}.cw-dialog #cw-blueprint{padding:4px 7px}.cw-blueprint-row{font-size:12px;line-height:14px;padding:4px 0}.cw-dialog #cw-blueprint-rule{font-size:12px;line-height:15px;margin-top:4px}.cw-dialog .difficulty{margin:4px 0}.cw-dialog .primary{padding:7px 12px}.cw-dialog #dialog-help{margin-top:4px;line-height:1.2}}`;
  document.head.append(style);cwBlueprintNode=document.createElement('div');cwBlueprintNode.id='cw-blueprint';cwBlueprintNode.setAttribute('aria-label','齿轮目标蓝图');copy.after(cwBlueprintNode);
}
function cwSyncBlueprint(s){
  cwInstallBlueprint();if(!cwBlueprintNode)return;const hide=s.phase!=='playing';if(cwBlueprintNode.hidden!==hide)cwBlueprintNode.hidden=hide;
  const key=JSON.stringify([s.scenarioId,s.gears.map(g=>[g.id,g.teeth,g.role]),s.pointers.map(p=>[p.gearId,p.targetUnits,p.toleranceUnits]),s.appointment.windowStartTick,s.appointment.windowEndTick,s.appointment.holdRequiredTicks]);if(key===cwBlueprintKey)return;cwBlueprintKey=key;
  const fragment=document.createDocumentFragment();for(const train of s.trains){const row=document.createElement('div');row.className='cw-blueprint-row';row.dataset.trainId=train.id;const chain=document.createElement('div');chain.className='cw-blueprint-chain';
    chain.textContent=train.name+' · '+train.gearIds.map(id=>{const g=s.gears.find(g=>g.id===id),p=s.pointers.find(p=>p.gearId===id);return g.teeth+(g.role==='driver'?'驱':p?'针':'惰');}).join(' ↔ ');
    const targets=document.createElement('div');targets.className='cw-blueprint-targets';targets.textContent='目标：'+train.gearIds.flatMap(id=>{const p=s.pointers.find(p=>p.gearId===id),g=s.gears.find(g=>g.id===id);return p?[g.teeth+'齿→'+cwFormat(cwDegrees(s,p.targetUnits))+'°']:[];}).join(' · ');row.append(chain,targets);fragment.append(row);}
  const rule=document.createElement('p');rule.id='cw-blueprint-rule';rule.textContent='容差 ±'+cwFormat(cwDegrees(s,s.pointers[0].toleranceUnits))+'° · 预约 '+cwFormat(s.appointment.windowStartTick/s.physics.ticksPerSecond)+'–'+cwFormat(s.appointment.windowEndTick/s.physics.ticksPerSecond)+' 秒 · 共同保持 '+cwFormat(s.appointment.holdRequiredTicks/s.physics.ticksPerSecond)+' 秒';fragment.append(rule);cwBlueprintNode.replaceChildren(fragment);cwBlueprintNode.dataset.scenarioId=s.scenarioId;
}
cwInstallBlueprint();
window.GameDef={id:'clockwork-align',title:'齿轮同刻',seed:732,accent:'#d5bd7d',background:'#e5e6d5',atlas:CW_ATLAS,holdConfirmAsA:false,
  description:'方向键选列，A切换离合，B全部制动。每改一个离合器消耗1次；指针须在预约窗内同时保持对准。最后一次调节仅允许全列制动且全部对准。',
  controls:{move:'方向键 / 摇杆 · 选齿轮列',a:'切换离合 / 空格',b:'全部制动 / B'},actionLabels:['切换离合','全部制动'],levelLabel:'机芯',levelNames:['双列合拍','三列会时','惰轮换向'],
  tagline:'同列同停，相位不重置',tip:'相邻轮反向，齿多转得慢。提前对准不计时；所有指针须在预约窗内共同保持。',winTitle:'同刻校准完成',loseTitle:'校准未完成',
  result(s){return s.phase==='won'?'全部指针已在预约窗内共同保持。':s.lostReason==='budget_exhausted'?'调节次数用尽，仍未全部制动并对准。':'预约窗已结束，连续共同保持未完成。';},
  hud(s){cwSyncBlueprint(s);return[{label:'调节余量',value:s.budget.remaining+'/'+s.budget.initial,tone:s.budget.remaining?'':'warn'},{label:'当前对准',value:s.pointers.filter(p=>p.instantAligned).length+'/'+s.pointers.length,tone:s.alignment.allInstantAligned?'good':''},{label:'共同保持',value:(s.alignment.holdTicks/s.physics.ticksPerSecond).toFixed(2)+' s',tone:s.phase==='won'?'good':''},{label:'当前时间',value:(s.tick/s.physics.ticksPerSecond).toFixed(1)+' s',tone:''}];},
  render(r,s){r.sprite('cw_bench',480,270,960,540,0,'#fff');const rows=cwRows(s);for(const row of rows)cwMechanism(r,s,row);r.line(120,rows[0].y,120,rows[rows.length-1].y,7,'#6a837d');r.line(118,rows[0].y,118,rows[rows.length-1].y,1.5,'#e3e4c7');for(const row of rows){r.circle(120,row.y,7,'#c3ad77');cwRadial(r,120,row.y,cwAngle(s,s.motor.normalizedUnits),0,5,2,CW_BLUE);}cwSummary(r,s);cwHeaderFooter(r,s);}
};
