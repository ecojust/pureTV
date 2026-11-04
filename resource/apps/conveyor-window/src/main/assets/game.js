/* Original enamel assembly machine. Public positions/owners are authoritative; transfers have no flight animation. */
const CV_COLORS={ink:'#203745',muted:'#526976',paper:'#e9eee7',steel:'#718895',dark:'#263d4c',green:'#247f70',red:'#b84f38',gold:'#dca63d'};
// Frozen public profiles, baked once. The live type/orientation and all positions come from state.
const CV_SHAPES={elbow:[[-14,-14],[14,-14],[14,-4],[-4,-4],[-4,14],[-14,14]],arrow:[[-14,-6],[2,-6],[2,-14],[14,0],[2,14],[2,6],[-14,6]],fork:[[-14,-14],[14,-14],[14,-4],[0,-4],[0,4],[8,4],[8,14],[-14,14]],hook:[[-14,-14],[0,-14],[0,4],[6,4],[6,-4],[14,-4],[14,14],[-14,14]]};
const CV_TONES={elbow:['#f4c395','#b66c49','#76432e'],arrow:['#9edbd2','#3c9b91','#205d60'],fork:['#d3c3e8','#8b76ad','#59486d'],hook:['#f1dca0','#c3a04e','#806637']};
function cvGradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);for(const [p,color]of stops)g.addColorStop(p,color);return g;}
function cvPath(c,points,fill,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function cvStroke(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function cvDisc(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
function cvScrew(c,x,y,r=3){cvDisc(c,x,y+.7,r+.8,'#354c59');cvDisc(c,x,y,r,'#c5d3d5');cvStroke(c,[[x-r*.55,y],[x+r*.55,y]],'#607581',.9);}
function cvBackground(c,w,h){
  c.save();c.scale(w/512,h/160);c.fillStyle=cvGradient(c,0,0,512,160,[[0,'#f3f0df'],[.5,'#dbe7e3'],[1,'#b6c9ca']]);c.fillRect(0,0,512,160);
  for(let i=0;i<16;i++){const y=6+i*10;cvStroke(c,[[0,y],[512,y]],'#f7faf552',.5);}c.fillStyle='#6a83901c';c.fillRect(0,151,512,9);c.restore();
}
function cvHousing(c,w,h){
  c.save();c.scale(w/512,h/384);cvPath(c,[[13,1],[499,1],[511,13],[511,370],[499,383],[13,383],[1,370],[1,13]],'#567381');
  cvPath(c,[[15,4],[497,4],[507,14],[507,369],[497,377],[15,377],[5,369],[5,14]],cvGradient(c,0,0,512,384,[[0,'#f4f5e9'],[.15,'#dce7e2'],[.68,'#d0dcd8'],[1,'#a1b8ba']]),'#f8fbef',1);
  c.fillStyle='#c1d1d0';c.fillRect(15,36,482,299);cvStroke(c,[[15,334],[15,36],[497,36]],'#9aafb2',1.5);cvStroke(c,[[497,36],[497,334],[15,334]],'#f3f7ed',1);
  for(const x of [12,500])for(const y of [14,369])cvScrew(c,x,y,3.3);
  for(let x=28;x<485;x+=18){c.fillStyle='#8fa7ae';c.fillRect(x,350,10,3);c.fillStyle='#ecf2e8';c.fillRect(x,353,10,1);}
  cvPath(c,[[17,18],[74,18],[78,23],[74,28],[17,28]],'#486575');cvStroke(c,[[20,20],[68,20]],'#a5c2c9',1);c.restore();
}
function cvBelt(c,w,h){
  c.save();c.scale(w/384,h/80);c.fillStyle='#203644';c.fillRect(0,9,384,62);c.fillStyle=cvGradient(c,0,12,0,68,[[0,'#5a747f'],[.2,'#354e5b'],[.65,'#273f4d'],[1,'#48616d']]);c.fillRect(0,14,384,52);
  for(const y of [2,70]){c.fillStyle='#54717e';c.fillRect(0,y,384,8);c.fillStyle='#b8cdd0';c.fillRect(0,y,384,2);c.fillStyle='#263f4d';c.fillRect(0,y+7,384,1);}
  for(let x=12;x<384;x+=36)for(const y of [6,74])cvScrew(c,x,y,1.7);cvStroke(c,[[0,19],[384,19]],'#849ba450',1);c.restore();
}
function cvRoller(c,w,h){
  c.save();c.scale(w/96,h/96);cvDisc(c,48,50,45,'#2b4453');cvDisc(c,48,47,43,cvGradient(c,5,9,88,83,[[0,'#f0f4e9'],[.3,'#a4bbc1'],[.62,'#5a7887'],[1,'#b5c7c9']]));cvDisc(c,48,47,33,'#314e60');
  for(let i=0;i<12;i++){const a=i*Math.PI/6;cvStroke(c,[[48+Math.cos(a)*17,47+Math.sin(a)*17],[48+Math.cos(a)*30,47+Math.sin(a)*30]],'#92aeb6',3);}
  cvDisc(c,48,47,14,'#bbcdce');cvScrew(c,48,47,8);c.restore();
}
function cvCarrier(c,w,h){
  c.save();c.scale(w/96,h/96);cvPath(c,[[12,8],[84,8],[92,16],[92,82],[84,90],[12,90],[4,82],[4,16]],'#203846');
  cvPath(c,[[14,8],[82,8],[90,16],[90,76],[82,84],[14,84],[6,76],[6,16]],cvGradient(c,0,0,96,96,[[0,'#dce8df'],[.2,'#a8bfc4'],[1,'#587b8c']]),'#d7e6e2',1);
  c.fillStyle='#314e5c';c.fillRect(17,20,62,52);cvStroke(c,[[19,23],[77,23]],'#668a99',2);for(const x of [11,85])for(const y of [16,77])cvScrew(c,x,y,2.5);c.restore();
}
function cvGripper(c,w,h){
  c.save();c.scale(w/128,h/128);cvPath(c,[[11,29],[28,15],[100,15],[117,29],[117,48],[96,48],[96,39],[32,39],[32,48],[11,48]],cvGradient(c,0,10,128,59,[[0,'#e7eee7'],[.35,'#8cabb5'],[.65,'#d8e3dc'],[1,'#486c80']]),'#28495c',2);
  for(const x of [16,96]){cvPath(c,[[x,44],[x+16,44],[x+16,88],[x+7,103],[x,95]],'#c4d5d5','#3f6072',2);c.fillStyle='#314e61';c.fillRect(x+3,51,6,37);}
  cvPath(c,[[17,94],[31,88],[43,94],[43,105],[26,113],[17,107]],'#f0d382','#8a773f',1);cvPath(c,[[111,94],[97,88],[85,94],[85,105],[102,113],[111,107]],'#f0d382','#8a773f',1);
  c.fillStyle='#284b60';c.fillRect(43,18,42,19);for(const x of [49,58,67,76]){c.fillStyle='#9ebfca';c.fillRect(x,22,3,11);}cvScrew(c,24,33,5);cvScrew(c,104,33,5);c.restore();
}
function cvShutter(c,w,h){
  c.save();c.scale(w/192,h/80);c.fillStyle='#284657';c.fillRect(0,0,192,80);c.fillStyle=cvGradient(c,0,0,0,80,[[0,'#cbdbd9'],[.16,'#8ca6b0'],[.55,'#6f8f9e'],[1,'#b7cbc9']]);c.fillRect(4,4,184,72);
  for(let y=14;y<76;y+=12){cvStroke(c,[[6,y],[186,y]],'#3a5b6b',2);cvStroke(c,[[6,y+2],[186,y+2]],'#d7e3dc',1);}
  for(const x of [12,180])for(const y of [10,70])cvScrew(c,x,y,2.2);c.restore();
}
function cvPartPainter(type,socket){return function(c,w,h){
  c.save();c.scale(w/96,h/96);const tone=CV_TONES[type],p=CV_SHAPES[type].map(([x,y])=>[48+x*96/36,48+y*96/36]);
  if(socket){cvPath(c,[[7,2],[89,2],[94,7],[94,89],[89,94],[7,94],[2,89],[2,7]],'#cbdad5','#4e7385',2);cvPath(c,p,'#263f4c','#eaf3df',2);cvStroke(c,p.slice(0,2),'#97b2b9',1);}
  else{cvPath(c,p.map(([x,y])=>[x+1,y+3]),'#1b303a70');cvPath(c,p,cvGradient(c,9,6,76,88,[[0,tone[0]],[.4,tone[1]],[1,tone[2]]]),tone[2],2);cvStroke(c,p.slice(0,3),'#fff6d2b0',1.6);}
  const ky=type==='arrow'?0:-10;cvDisc(c,48-10*96/36,48+ky*96/36,4,socket?'#e6be62':'#fff1b4');cvDisc(c,48-10*96/36,48+ky*96/36,1.7,'#5c543b');c.restore();
};}
function cvConsole(c,w,h){
  c.save();c.scale(w/256,h/256);cvPath(c,[[10,1],[246,1],[255,10],[255,246],[246,255],[10,255],[1,246],[1,10]],'#506e7c');c.fillStyle=cvGradient(c,0,0,256,256,[[0,'#f3f3e7'],[.7,'#d3e0db'],[1,'#afc5c5']]);c.fillRect(5,5,246,246);
  cvStroke(c,[[7,247],[7,7],[249,7]],'#fffbee',1);for(const x of [12,244])for(const y of [12,244])cvScrew(c,x,y,3);c.restore();
}
const CV_ATLAS={builtins:[],tiles:[
  {name:'cv_housing',x:0,y:0,w:512,h:384,paint:cvHousing},{name:'cv_belt',x:512,y:0,w:384,h:80,paint:cvBelt},
  {name:'cv_gripper',x:512,y:80,w:128,h:128,paint:cvGripper},{name:'cv_roller',x:640,y:80,w:96,h:96,paint:cvRoller},{name:'cv_carrier',x:736,y:80,w:96,h:96,paint:cvCarrier},
  {name:'cv_shutter',x:512,y:208,w:192,h:80,paint:cvShutter},
  ...Object.keys(CV_SHAPES).map((type,i)=>({name:'cv_part_'+type,x:i*96,y:768,w:96,h:96,paint:cvPartPainter(type,false)})),
  ...Object.keys(CV_SHAPES).map((type,i)=>({name:'cv_slot_'+type,x:384+i*96,y:768,w:96,h:96,paint:cvPartPainter(type,true)})),
  {name:'cv_console',x:768,y:768,w:256,h:256,paint:cvConsole},{name:'cv_background',x:0,y:864,w:512,h:160,paint:cvBackground}
]};
const CV_MAP={x:48,y:117,scale:.86};
function cvX(x){return CV_MAP.x+x*CV_MAP.scale;}function cvY(y){return CV_MAP.y+y*CV_MAP.scale;}
function cvCenter(r,text,cx,y,size,color){r.text(text,cx-r.measureText(text,size)/2,y,size,color);}
function cvSafeLabel(r,text,cx,y,size,color,min=24,max=690){const width=r.measureText(text,size);r.text(text,Math.max(min,Math.min(max-width,cx-width/2)),y,size,color);}
function cvPart(r,type,q,x,y,size,socket=false){r.sprite((socket?'cv_slot_':'cv_part_')+type,x,y,size,size,q*Math.PI/2,'#fff');}
function cvOutline(r,x,y,w,h,color,width=2){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function cvArrow(r,x,y,direction,color){r.line(x-direction*10,y,x+direction*10,y,2,color);r.line(x+direction*10,y,x+direction*4,y-5,2,color);r.line(x+direction*10,y,x+direction*4,y+5,2,color);}
function cvPartById(s,id){return id===null?null:s.parts.find(p=>p.id===id);}
function cvLastAction(s){return s.actionReceipts.length?s.actionReceipts[s.actionReceipts.length-1]:null;}
function cvBeltView(r,s,belt,y){
  const source=belt==='source',items=source?s.sourceCarriers:s.targetSlots,velocity=source?s.scenario.sourceVelocity:s.scenario.targetVelocity,g=s.physics.geometry;
  const left=cvX(0),right=cvX(g.trackLengthUnits),width=right-left,phase=items[0].x%40;
  r.sprite('cv_belt',(left+right)/2,y,width,62,0,'#fff');
  for(let x=phase;x<g.trackLengthUnits;x+=40){const px=cvX(x);r.line(px,y-19,px,y+19,1,'#8ca5ad42');}
  const travel=items[0].x+Math.sign(velocity)*items[0].generation*g.trackLengthUnits;for(const x of [left-19,right+19])r.sprite('cv_roller',x,y,41,41,travel*CV_MAP.scale/20.5,'#fff');
  const labelY=source?82:398;r.text(source?'SOURCE BELT':'SOCKET BELT',36,labelY,14,CV_COLORS.ink);cvArrow(r,217,labelY+8,Math.sign(velocity),CV_COLORS.ink);
  r.text(Math.abs(velocity*g.ticksPerSecond)+' U/S',239,labelY,14,CV_COLORS.ink);
  for(const item of items){const x=cvX(item.x),chosen=source?s.preview.nearestSource?.id===item.id:s.preview.nearestSlot?.id===item.id;
    if(source)r.sprite('cv_carrier',x,y,46,43,0,'#fff');else cvPart(r,item.requiredType,item.requiredQuarterTurns,x,y,g.partSizeUnits*CV_MAP.scale+8,true);
    if(chosen)cvOutline(r,x-26,y-25,52,50,CV_COLORS.gold,2);
    const label=source?item.partId||item.id+' EMPTY':item.id+':'+item.generation;
    cvSafeLabel(r,label,x,source?154:312,13,CV_COLORS.ink);
    if(!source)cvSafeLabel(r,item.occupantPartId||'EMPTY',x,379,13,item.occupantPartId?CV_COLORS.green:CV_COLORS.muted);
    if(!source&&item.occupantPartId){r.circle(x+22,y-22,4,CV_COLORS.green);}
  }
}
function cvMachine(r,s){
  const g=s.physics.geometry,partSize=g.partSizeUnits*CV_MAP.scale,gx=cvX(s.gripper.x),gy=cvY(s.gripper.y),a=cvX(s.gate.windowXRange[0]),b=cvX(s.gate.windowXRange[1]),top=cvY(g.barrierYRange[0]),bottom=cvY(g.barrierYRange[1]);
  r.sprite('cv_housing',358,274,688,420,0,'#fff');cvBeltView(r,s,'source',cvY(g.sourceY));cvBeltView(r,s,'target',cvY(g.targetY));
  r.line(cvX(g.gripperXRange[0]),gy-22,cvX(g.gripperXRange[1]),gy-22,7,'#63818d');r.line(cvX(g.gripperXRange[0]),gy-25,cvX(g.gripperXRange[1]),gy-25,2,'#e4ece1');
  r.rect(cvX(0),top,a-cvX(0),bottom-top,'#6f8996');r.rect(b,top,cvX(g.trackLengthUnits)-b,bottom-top,'#6f8996');r.line(cvX(0),top,cvX(g.trackLengthUnits),top,2,'#b7cbcc');
  r.rect(a,top,b-a,bottom-top,s.gate.open?'#315a63':'#314955');
  if(!s.gate.open)r.sprite('cv_shutter',(a+b)/2,(top+bottom)/2,b-a,bottom-top,0,'#fff');
  for(const x of [a,b]){r.rect(x-3,top-4,6,bottom-top+8,'#304d5e');r.rect(x-2,top-3,2,bottom-top+6,'#e3cd79');}
  r.text(s.gate.open?'GATE OPEN':'GATE CLOSED',420,82,14,s.gate.open?CV_COLORS.green:CV_COLORS.red);r.text('WINDOW X '+s.gate.windowXRange.join('-'),420,103,13,CV_COLORS.muted);r.circle(a-11,top+10,4,s.gate.open?CV_COLORS.green:CV_COLORS.red);
  r.sprite('cv_gripper',gx,gy,59,59,0,'#fff');
  for(const p of s.parts){if(p.owner==='source'||p.owner==='slot'||p.owner==='held')cvPart(r,p.type,p.quarterTurns,cvX(p.x),cvY(p.y),partSize);}
  const held=!!s.gripper.heldPartId,reach=held?g.placementRadiusUnits:g.pickupRadiusUnits,rx1=cvX(Math.max(0,s.gripper.x-reach)),rx2=cvX(Math.min(g.trackLengthUnits,s.gripper.x+reach));
  const by=held?419:136;r.line(rx1,by,rx2,by,2,CV_COLORS.green);for(const x of [rx1,rx2])r.line(x,by-4,x,by+4,2,CV_COLORS.green);r.line(gx,by-3,gx,by+3,2,CV_COLORS.green);
  cvSafeLabel(r,(held?'SEAT':'PICKUP')+' +/-'+reach+' U',gx,held?427:116,13,CV_COLORS.green);
  const completed=s.parts.filter(p=>p.owner==='completed');r.text('OUTPUT HISTORY',34,451,13,CV_COLORS.muted);r.text(String(completed.length),180,450,16,CV_COLORS.ink);
  completed.slice(-3).forEach((p,i)=>{const x=239+i*144;r.rect(x-16,450,140,25,'#e4ebe2');cvPart(r,p.type,p.quarterTurns,x,462,20);r.text(p.id,x+17,456,12,CV_COLORS.ink);});
}
function cvDetailCard(r,s,{y,title,part,slot}){
  const x=724;r.rect(x,y,208,137,'#f2f3e8');r.line(x,y+137,x+208,y+137,1,'#a6bcbd');r.text(title,x+9,y+8,14,CV_COLORS.muted);
  const present=slot||part;if(!present){r.text('EMPTY',x+80,y+56,20,CV_COLORS.muted);return;}
  const type=slot?slot.requiredType:part.type,q=slot?slot.requiredQuarterTurns:part.quarterTurns;
  cvPart(r,type,q,x+45,y+72,73,!!slot);r.text(slot?slot.id+':'+slot.generation:part.id,x+88,y+39,13,CV_COLORS.ink);r.text(type.toUpperCase(),x+88,y+62,15,CV_COLORS.ink);r.text(q*90+' DEG',x+88,y+83,18,CV_COLORS.ink);
  if(slot){r.text(slot.occupantPartId?'IN: '+slot.occupantPartId:'EMPTY SOCKET',x+9,y+116,13,slot.occupantPartId?CV_COLORS.muted:CV_COLORS.green);}
  else r.text('HELD AT GRIPPER',x+9,y+116,13,CV_COLORS.green);
}
function cvInspection(r,s){
  const held=cvPartById(s,s.gripper.heldPartId),nearest=s.preview.nearestSlot,slot=nearest?s.targetSlots.find(x=>x.id===nearest.id):null;
  r.sprite('cv_console',828,274,228,420,0,'#fff');r.text('ORIENTATION DETAILS',725,81,15,CV_COLORS.ink);
  cvDetailCard(r,s,{y:104,title:'HELD PART',part:held});cvDetailCard(r,s,{y:249,title:'NEAREST SOCKET',slot});
  if(held&&slot){r.text(held.type===slot.requiredType?'TYPE MATCH':'TYPE DIFFERS',726,394,13,held.type===slot.requiredType?CV_COLORS.green:CV_COLORS.red);r.text(held.quarterTurns===slot.requiredQuarterTurns?'TURN MATCH':'TURN DIFFERS',830,394,13,held.quarterTurns===slot.requiredQuarterTurns?CV_COLORS.green:CV_COLORS.red);}
  else r.text('DETAIL VIEWS / NOT EXTRA PARTS',726,394,12,CV_COLORS.muted);
  r.text(s.gate.open?'WINDOW OPEN':'WINDOW CLOSED',726,416,16,s.gate.open?CV_COLORS.green:CV_COLORS.red);r.text(s.preview.windowFits?'FOOTPRINT FITS':'OUTSIDE OPENING',726,438,14,s.preview.windowFits?CV_COLORS.green:CV_COLORS.red);
  const n=held?s.preview.nearestSlot:s.preview.nearestSource,limit=held?s.physics.geometry.placementRadiusUnits:s.physics.geometry.pickupRadiusUnits;r.text(n?'DIST '+n.distance+' / LIMIT '+limit:'NO SOURCE PART',726,461,13,n&&n.inReach?CV_COLORS.green:CV_COLORS.muted);
}
const CV_RESULTS={rotated:'ROTATED 90 DEG',empty_rotate:'EMPTY GRIPPER',grabbed:'PART PICKED UP',empty_grab:'NO PART IN REACH',shutter_closed:'DAMAGED: SHUTTER CLOSED',outside_window:'DAMAGED: OUTSIDE WINDOW',no_slot_in_reach:'DAMAGED: NO SOCKET IN REACH',occupied_slot:'DAMAGED: SOCKET OCCUPIED',wrong_type:'DAMAGED: WRONG TYPE',wrong_orientation:'DAMAGED: WRONG TURN',seated:'PART SEATED'};
function cvHeaderFooter(r,s){
  r.rect(0,0,960,56,'#edf1e7');r.line(18,55,942,55,1,'#9fb5b9');r.text('CONVEYOR WINDOW',22,17,24,CV_COLORS.ink);
  r.text('STREAK '+s.streak+'/'+s.requiredStreak,342,19,19,CV_COLORS.ink);r.text('TOTAL '+s.totalCorrect,524,21,16,CV_COLORS.muted);r.text('FAULTS '+s.faults+'/'+s.faultLimit,664,20,17,s.faults?CV_COLORS.red:CV_COLORS.ink);
  r.text((Math.max(0,s.deadlineTick-s.tick)/s.physics.geometry.ticksPerSecond).toFixed(1)+' S',843,19,19,CV_COLORS.ink);
  const action=cvLastAction(s);r.text(action?'LAST: '+(CV_RESULTS[action.result]||action.result.toUpperCase()):'MATCH THE SHAPE AND KEYED CORNER',24,496,14,action&&action.partAfter?.owner==='damaged'?CV_COLORS.red:CV_COLORS.ink);
  if(action)r.text('AT '+(action.boundaryTick/s.physics.geometry.ticksPerSecond).toFixed(2)+' S',758,496,14,CV_COLORS.muted);
  r.rect(0,520,960,20,'#294957');const text=s.phase==='won'?'REQUIRED STREAK COMPLETE':s.phase==='lost'?(s.lostReason==='fault_limit'?'RUN ENDED / FAULT LIMIT':'RUN ENDED / TIME LIMIT'):s.inputState.quarantined?'RELEASE CONTROLS':s.gripper.heldPartId?'A: DISPATCH / B: ROTATE 90':'A: PICK UP / LEFT-RIGHT: MOVE';r.text(text,22,523,13,'#f0f1dc');r.text('ONE PART / ONE OWNER',717,523,13,'#d5e4df');
}
let cvBlueprintScenario=null;
function cvInstallBlueprint(){
  if(typeof document==='undefined'||document.getElementById('cv-blueprint'))return;const copy=document.getElementById('dialog-copy');if(!copy)return;copy.closest('.dialog').classList.add('cv-dialog');
  const style=document.createElement('style');style.id='cv-blueprint-style';style.textContent='.cv-dialog{width:min(640px,96%);padding:12px 24px}.cv-dialog #dialog-copy{margin-bottom:9px}.cv-dialog #cv-blueprint{margin:8px 0 12px;padding:8px 10px;border:1px solid #91aaa85c;border-radius:10px;background:#dceae414;text-align:left}.cv-dialog #cv-blueprint[hidden]{display:none}.cv-dialog .cv-blueprint-parts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:7px 0}.cv-dialog .cv-blueprint-card{text-align:center;min-width:0;padding:4px 2px;border-radius:7px;background:#dfe8de17}.cv-dialog .cv-blueprint-title,.cv-dialog .cv-blueprint-angles{font-size:12px;line-height:1.45}.cv-dialog .cv-blueprint-image{display:block;width:100%;height:48px}.cv-dialog #cv-blueprint-motion,.cv-dialog #cv-blueprint-gate,.cv-dialog #cv-blueprint-goal{font-size:12px;line-height:1.5}.cv-dialog #cv-blueprint-goal{color:#ead39a}@media(max-height:620px){.cv-dialog{padding:8px 18px}.cv-dialog h2{font-size:23px;margin:6px 0}.cv-dialog #dialog-copy{font-size:12px;line-height:1.45;margin:6px 0}.cv-dialog .difficulty{margin:6px 0}.cv-dialog .primary{margin-top:6px;padding:9px 16px}.cv-dialog .fine{margin-top:6px}.cv-dialog #cv-blueprint{margin:6px 0 8px;padding:5px 8px}.cv-dialog .cv-blueprint-image{height:36px}.cv-dialog .cv-blueprint-parts{margin:4px 0}.cv-dialog .cv-blueprint-card{padding:2px}.cv-dialog .cv-blueprint-title,.cv-dialog .cv-blueprint-angles,.cv-dialog #cv-blueprint-motion,.cv-dialog #cv-blueprint-gate,.cv-dialog #cv-blueprint-goal{font-size:11px}}';document.head.appendChild(style);
  const box=document.createElement('section');box.id='cv-blueprint';box.setAttribute('aria-label','关卡装配蓝图');box.innerHTML='<div id="cv-blueprint-motion"></div><div class="cv-blueprint-parts"></div><div id="cv-blueprint-gate"></div><div id="cv-blueprint-goal"></div>';copy.insertAdjacentElement('afterend',box);
}
function cvSyncBlueprint(s){
  cvInstallBlueprint();if(typeof document==='undefined')return;const box=document.getElementById('cv-blueprint');if(!box)return;box.hidden=s.phase!=='playing';if(cvBlueprintScenario===s.scenarioId)return;cvBlueprintScenario=s.scenarioId;box.dataset.scenarioId=s.scenarioId;
  const hz=s.physics.geometry.ticksPerSecond,sc=s.scenario;document.getElementById('cv-blueprint-motion').textContent='上带 '+(sc.sourceVelocity>0?'→':'←')+' '+Math.abs(sc.sourceVelocity*hz)+' u/s · 下带 '+(sc.targetVelocity>0?'→':'←')+' '+Math.abs(sc.targetVelocity*hz)+' u/s';
  const row=box.querySelector('.cv-blueprint-parts');row.replaceChildren();for(const source of sc.sourceCarriers){const type=s.partTypes.find(t=>t.id===source.type),slot=sc.targetSlots.find(t=>t.requiredType===source.type),card=document.createElement('div');card.className='cv-blueprint-card';card.dataset.type=type.id;
    const label=document.createElement('div');label.className='cv-blueprint-title';label.textContent=type.name;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('cv-blueprint-image');svg.setAttribute('viewBox','0 0 96 44');svg.setAttribute('aria-label',type.name+' 来源与槽位朝向');
    for(const [cx,q,isSlot]of [[22,source.initialQuarterTurns,false],[74,slot.requiredQuarterTurns,true]]){const group=document.createElementNS(svg.namespaceURI,'g');group.setAttribute('transform',`translate(${cx} 22) rotate(${q*90})`);group.dataset.role=isSlot?'slot':'source';const shape=document.createElementNS(svg.namespaceURI,'polygon');shape.setAttribute('points',type.profile.map(p=>p.join(',')).join(' '));shape.setAttribute('fill',isSlot?'#314e5b':CV_TONES[type.id][0]);shape.setAttribute('stroke',isSlot?'#d6dfc9':CV_TONES[type.id][1]);shape.setAttribute('stroke-width','1.5');group.appendChild(shape);const key=document.createElementNS(svg.namespaceURI,'circle');key.setAttribute('cx','-10');key.setAttribute('cy',type.id==='arrow'?'0':'-10');key.setAttribute('r','1.8');key.setAttribute('fill','#ffe2a0');group.appendChild(key);svg.appendChild(group);}
    const arrow=document.createElementNS(svg.namespaceURI,'path');arrow.setAttribute('d','M42 22H54M50 18L54 22L50 26');arrow.setAttribute('fill','none');arrow.setAttribute('stroke','#a7bebf');arrow.setAttribute('stroke-width','1.5');svg.appendChild(arrow);const angles=document.createElement('div');angles.className='cv-blueprint-angles';angles.textContent=source.initialQuarterTurns*90+'° → '+slot.requiredQuarterTurns*90+'°';card.append(label,svg,angles);row.appendChild(card);
  }
  document.getElementById('cv-blueprint-gate').textContent='窗口 x'+sc.windowXRange.join('–')+' · 每'+sc.gate.periodTicks/hz+'秒开'+(sc.gate.openUntilPhaseTick-sc.gate.openFromPhaseTick)/hz+'秒';document.getElementById('cv-blueprint-goal').textContent='连续装配 '+s.requiredStreak+' 件 · 损坏 '+s.faultLimit+' 次结束 · B 旋转90°';
}
window.GameDef={id:'conveyor-window',stylesheet:'game-theme.css',accent:'#f2b35c',title:'窗口装配',subtitle:'CONVEYOR WINDOW',seed:734,holdConfirmAsA:false,atlas:CV_ATLAS,background:'#d9e4de',
  description:'两带速度不同。A抓取零件，B旋转90°；闸窗打开时，再按A投进形状与朝向匹配的空槽。',controls:{move:'左右 / 摇杆 · 移夹具',a:'抓取·投送 / 空格',b:'旋转90° / B'},actionLabels:['抓取 / 投送','旋转90°'],levelLabel:'工序',levelNames:['铜件初装','逆送三件','对流精装','双向换线','窄窗快装','夜班协同'],tagline:'六张工单 · 双带分流 · 精确装配',tip:'抓起后B旋转，开窗再A投送。最近槽即使已占用也会被选中；失误清零连装。',winTitle:'连续装配完成',loseTitle:'装配未完成',
  result(s){return s.phase==='won'?'连续装配目标已完成。':s.lostReason==='fault_limit'?'损坏次数已达上限。先核对形状与朝向。':'时间已到，连续装配尚未达标。';},
  hud(s){cvSyncBlueprint(s);return[{label:'连续正确',value:s.streak+'/'+s.requiredStreak,tone:s.phase==='won'?'good':''},{label:'累计正确',value:s.totalCorrect,tone:''},{label:'损坏次数',value:s.faults+'/'+s.faultLimit,tone:s.faults?'warn':''},{label:'剩余时间',value:(Math.max(0,s.deadlineTick-s.tick)/s.physics.geometry.ticksPerSecond).toFixed(1)+' s',tone:''}];},
  render(r,s){r.sprite('cv_background',480,270,960,540,0,'#fff');cvMachine(r,s);cvInspection(r,s);cvHeaderFooter(r,s);}
};
