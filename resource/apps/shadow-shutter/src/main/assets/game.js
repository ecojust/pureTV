/* Original paper-shadow darkroom. Draw current public geometry; saved photographs use immutable receipts. */
function ssGradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);for(const [p,color]of stops)g.addColorStop(p,color);return g;}
function ssPath(c,points,fill,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function ssStroke(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function ssDisc(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
function ssScrew(c,x,y,r=3){ssDisc(c,x,y+.7,r+.5,'#211c23');ssDisc(c,x,y,r,'#c4bca9');ssStroke(c,[[x-r*.6,y],[x+r*.6,y]],'#68636a',.8);}
function ssBench(c,w,h){
  c.save();c.scale(w/512,h/256);c.fillStyle=ssGradient(c,0,0,512,256,[[0,'#47323d'],[.45,'#2b2832'],[1,'#5c3540']]);c.fillRect(0,0,512,256);
  for(let i=0;i<48;i++){const y=4+i*5.3;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(123,y-2,352,y+3,512,y);c.strokeStyle=i%4?'#9a66731a':'#17182040';c.lineWidth=.7;c.stroke();}
  c.fillStyle='#171d26';c.fillRect(5,5,502,246);c.fillStyle=ssGradient(c,0,0,512,256,[[0,'#4e3d49'],[1,'#352b35']]);c.fillRect(8,8,496,240);
  ssStroke(c,[[8,247],[8,8],[503,8]],'#a07572',1);ssStroke(c,[[503,8],[503,247],[8,247]],'#191d27',1.5);
  for(const x of [13,499])for(const y of [13,243])ssScrew(c,x,y,2.2);c.restore();
}
function ssScoutFrame(c,w,h){
  c.save();c.scale(w/512,h/320);ssPath(c,[[7,3],[505,3],[511,10],[511,312],[504,319],[7,319],[1,312],[1,10]],'#171f28');
  c.fillStyle=ssGradient(c,0,0,512,320,[[0,'#b8b4a5'],[.3,'#696c72'],[.68,'#a29a89'],[1,'#454851']]);c.fillRect(5,6,502,308);
  c.fillStyle='#382d35';c.fillRect(11,11,490,298);c.fillStyle=ssGradient(c,0,17,0,302,[[0,'#efe0bc'],[.5,'#e9d8b5'],[1,'#d0bd99']]);c.fillRect(17,17,478,286);
  for(let i=0;i<75;i++){const x=19+(i*67)%473,y=20+(i*43)%278;ssStroke(c,[[x,y],[x+2,y+.2]],'#ad957c22',.6);}
  for(const x of [9,503])for(const y of [15,305])ssScrew(c,x,y,2.8);
  for(const y of [37,284]){c.fillStyle='#252b33';c.fillRect(2,y,508,6);c.fillStyle='#ad9e85';c.fillRect(6,y,500,2);}
  for(const x of [8,504]){c.fillStyle='#d4c7a7';c.fillRect(x-2,45,4,231);c.fillStyle='#3c414b';c.fillRect(x+1,45,1,231);}
  ssStroke(c,[[19,18],[493,18]],'#fff7de',1);c.restore();
}
function ssHolder(c,w,h){
  c.save();c.scale(w/192,h/224);ssPath(c,[[6,1],[186,1],[191,6],[191,217],[184,223],[7,223],[1,217],[1,6]],'#141923');
  c.fillStyle=ssGradient(c,0,0,192,224,[[0,'#6d5a59'],[.22,'#32323c'],[.8,'#242b35'],[1,'#6f5150']]);c.fillRect(5,5,182,214);
  c.fillStyle='#141c25';c.fillRect(13,15,166,194);ssStroke(c,[[13,208],[13,15],[179,15]],'#9b8f7d',1);ssStroke(c,[[179,15],[179,208],[13,208]],'#080d16',1.5);
  for(let y=25;y<210;y+=24)for(const x of [6,181]){c.fillStyle='#0e141e';c.fillRect(x,y,5,10);c.fillStyle='#8d8170';c.fillRect(x,y,5,1);}
  for(const x of [8,184])for(const y of [8,216])ssScrew(c,x,y,2);c.restore();
}
function ssContact(c,w,h){
  c.save();c.scale(w/184,h/128);ssPath(c,[[3,1],[181,1],[184,125],[1,127]],'#141b24');
  c.fillStyle=ssGradient(c,0,0,184,128,[[0,'#f4ead4'],[1,'#d2bfa5']]);c.fillRect(4,3,176,120);
  c.fillStyle='#3b3440';c.fillRect(9,21,166,97);ssStroke(c,[[9,118],[9,21],[175,21]],'#9d8b77',1);
  for(let i=0;i<8;i++){const x=14+i*21;c.fillStyle='#b49e82';c.fillRect(x,121,11,1);}c.restore();
}
function ssLens(c,w,h){
  c.save();c.scale(w/96,h/96);ssDisc(c,48,50,44,'#101722');ssDisc(c,48,47,43,'#8d8d8b');ssDisc(c,48,47,38,'#282e38');
  for(let i=0;i<40;i++){const a=i*Math.PI/20;ssStroke(c,[[48+Math.sin(a)*39,47-Math.cos(a)*39],[48+Math.sin(a)*42,47-Math.cos(a)*42]],'#c3bcaa',.9);}
  ssDisc(c,48,47,31,'#b6a187');ssDisc(c,48,47,28,'#141e2b');
  for(let i=0;i<6;i++){c.save();c.translate(48,47);c.rotate(i*Math.PI/3);ssPath(c,[[0,-25],[21,-12],[12,9],[3,5]],ssGradient(c,0,-25,18,9,[[0,'#4f6977'],[1,'#26313f']]),'#79868b',.6);c.restore();}
  ssDisc(c,48,47,9,'#131a26');ssDisc(c,37,33,4,'#bfc8c3');ssDisc(c,60,57,2,'#b78e71');c.restore();
}
function ssClamp(c,w,h){
  c.save();c.scale(w/64,h/64);ssPath(c,[[8,8],[56,8],[60,17],[53,54],[12,54],[4,17]],ssGradient(c,0,0,64,64,[[0,'#e7e1cc'],[.3,'#8f9696'],[.55,'#c0bba7'],[1,'#626c73']]),'#303d49',1);
  c.fillStyle='#2b3541';c.fillRect(13,42,38,9);ssStroke(c,[[14,12],[50,12]],'#ffffdf',2);ssScrew(c,32,25,7);c.restore();
}
const SS_ATLAS={builtins:[],tiles:[
  {name:'ss_scout',x:0,y:0,w:512,h:320,paint:ssScoutFrame},
  {name:'ss_holder',x:512,y:0,w:192,h:224,paint:ssHolder},
  {name:'ss_lens',x:704,y:0,w:96,h:96,paint:ssLens},
  {name:'ss_clamp',x:800,y:0,w:64,h:64,paint:ssClamp},
  {name:'ss_contact',x:0,y:320,w:184,h:128,paint:ssContact},
  {name:'ss_bench',x:0,y:768,w:512,h:256,paint:ssBench}
]};
const SS_PAPER='#f3e5c7',SS_LIGHT='#f4e7ce',SS_MUTED='#c1b1a2',SS_GOLD='#e1ba77',SS_GOOD='#9cd1b4',SS_WARN='#f0a391';
const SS_TONES=['#303950','#5b4c40','#74465e'],SS_SCOUT_TONES=['#66677b','#827363','#a2778e'];
function ssCenter(r,text,x,y,size,color=SS_LIGHT){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
function ssMode(mode){return mode==='landscape'?'WIDE':'TALL';}
function ssTone(s,id,scout=false){const i=s.physics.geometry.requiredActors.indexOf(id);return(scout?SS_SCOUT_TONES:SS_TONES)[i];}
function ssClip(a,b){const q={x0:Math.max(a.x0,b.x0),y0:Math.max(a.y0,b.y0),x1:Math.min(a.x1,b.x1),y1:Math.min(a.y1,b.y1)};return q.x1>q.x0&&q.y1>q.y0?q:null;}
function ssRegion(r,rects,x,y,scale,color,clip,originX=0,originY=0){
  // Only display clipping and projection; no registration, visibility or match decisions are recomputed here.
  if(!clip)return;for(const rect of rects){const q=ssClip(rect,clip);if(q)r.rect(x+(q.x0-originX)*scale,y+(q.y0-originY)*scale,(q.x1-q.x0)*scale,(q.y1-q.y0)*scale,color);}
}
function ssWorld(s){const u=s.physics.geometry.unitsPerCell,[w,h]=s.physics.geometry.worldSizeCells;return{x0:0,y0:0,x1:w*u,y1:h*u};}
function ssScene(r,s,scene,aperture,x,y,cellPx,scout=false){
  const scale=cellPx/s.physics.geometry.unitsPerCell,clip=scout?ssWorld(s):ssClip(ssWorld(s),aperture.rect),ox=scout?0:aperture.rect.x0,oy=scout?0:aperture.rect.y0;
  for(const id of s.physics.geometry.depthOrder){
    const actor=scene.actors.find(a=>a.id===id);if(actor)ssRegion(r,actor.worldRects,x,y,scale,ssTone(s,id,scout),clip,ox,oy);
    else if(scene.strip.id===id)ssRegion(r,[scene.strip.worldRect],x,y,scale,SS_PAPER,clip,ox,oy);
  }
}
function ssPaper(r,cx,cy,widthCells,heightCells,cellPx){const w=widthCells*cellPx,h=heightCells*cellPx,x=cx-w/2,y=cy-h/2;r.rect(x,y,w,h,SS_PAPER);return{x,y,w,h};}
function ssTarget(r,s,target,cx,cy,cellPx){
  const p=ssPaper(r,cx,cy,target.widthCells,target.heightCells,cellPx),u=s.physics.geometry.unitsPerCell,clip={x0:0,y0:0,x1:target.widthCells*u,y1:target.heightCells*u};
  for(const id of s.physics.geometry.requiredActors){const actor=target.actors.find(a=>a.id===id);ssRegion(r,actor.localRects,p.x,p.y,cellPx/u,ssTone(s,id),clip);}return p;
}
function ssPhoto(r,s,photo,cx,cy,cellPx){
  const p=ssPaper(r,cx,cy,photo.aperture.widthCells,photo.aperture.heightCells,cellPx),u=s.physics.geometry.unitsPerCell,clip={x0:0,y0:0,x1:photo.aperture.widthCells*u,y1:photo.aperture.heightCells*u};
  for(const id of s.physics.geometry.requiredActors){const actor=photo.actorChecks.find(a=>a.id===id);ssRegion(r,actor.visibleLocalRects,p.x,p.y,cellPx/u,ssTone(s,id),clip);}return p;
}
function ssCorners(r,p,color){const d=6,g=3;for(const [x,y,sx,sy]of[[p.x-g,p.y-g,1,1],[p.x+p.w+g,p.y-g,-1,1],[p.x-g,p.y+p.h+g,1,-1],[p.x+p.w+g,p.y+p.h+g,-1,-1]]){r.line(x,y,x+sx*d,y,1.5,color);r.line(x,y,x,y+sy*d,1.5,color);}}
function ssScout(r,s){
  r.sprite('ss_scout',290,218,540,338,0,'#fff');r.rect(36,86,504,288,'#d9c7ab');ssScene(r,s,s.scene,s.aperture,36,86,18,true);
  const a=s.aperture.rect,k=18/s.physics.geometry.unitsPerCell,p={x:36+a.x0*k,y:86+a.y0*k,w:(a.x1-a.x0)*k,h:(a.y1-a.y0)*k};
  r.line(p.x,p.y,p.x+p.w,p.y,2,SS_GOLD);r.line(p.x,p.y+p.h,p.x+p.w,p.y+p.h,2,SS_GOLD);r.line(p.x,p.y,p.x,p.y+p.h,2,SS_GOLD);r.line(p.x+p.w,p.y,p.x+p.w,p.y+p.h,2,SS_GOLD);ssCorners(r,p,'#fff6dc');
  r.sprite('ss_clamp',548,98,17,19,0,'#fff');r.sprite('ss_clamp',548,362,17,19,Math.PI,'#fff');
  r.rect(30,57,518,23,'#322c38');r.text('SCOUT MAP / NOT A PHOTO',36,62,16,SS_LIGHT);
  for(let i=0;i<3;i++){r.rect(433+i*36,63,10,13,SS_TONES[i]);r.text(String.fromCharCode(65+i),446+i*36,62,13,SS_LIGHT);}
}
const SS_REASONS={wrong_frame_mode:'FRAME MODE DIFFERS',required_piece_clipped:'PART CLIPPED',required_piece_occluded:'PART COVERED',component_registration_mismatch:'PARTS MISALIGNED',exposure_mismatch:'EXPOSURE DIFFERS',matched:'MATCHED'};
function ssLiveAndTarget(r,s){
  const target=s.targets[s.activeTargetIndex],a=s.aperture;
  r.sprite('ss_holder',669,171,170,170,0,'#fff');r.sprite('ss_holder',855,171,170,170,0,'#fff');
  r.text(s.phase==='playing'?'LIVE EXPOSURE':'FINAL VIEW',584,64,16,SS_LIGHT);r.text(target?'TARGET '+String(s.activeTargetIndex+1).padStart(2,'0'):'ALL CAPTURED',770,64,16,SS_LIGHT);
  const paper=ssPaper(r,669,171,a.widthCells,a.heightCells,15);ssScene(r,s,s.scene,a,paper.x,paper.y,15);ssCorners(r,paper,SS_GOLD);
  if(target){const p=ssTarget(r,s,target,855,171,15);ssCorners(r,p,SS_GOLD);}else{ssCenter(r,s.targetCredits.length+' / '+s.targets.length,855,150,28,SS_GOOD);ssCenter(r,'COMPLETE',855,189,15,SS_GOOD);}
  r.text(ssMode(a.mode),589,242,13,SS_MUTED);if(target)r.text(ssMode(target.mode),775,242,13,SS_MUTED);
  if(s.phase==='playing'&&s.preview){for(let i=0;i<s.preview.actors.length;i++){const actor=s.preview.actors[i],status=!actor.fullVisible?'PARTIAL':!actor.registered?'OFFSET':'READY';r.text(String.fromCharCode(65+i)+' '+status,584+i*118,263,13,status==='READY'?SS_GOOD:SS_MUTED);}}
  else r.text(s.phase==='won'?'THREE PHOTOS CREDITED':'ENDED / VIEW FROZEN',584,263,14,s.phase==='won'?SS_GOOD:SS_WARN);
}
function ssLastPhoto(r,s){
  const photo=s.photoReceipts[s.photoReceipts.length-1];
  r.sprite('ss_holder',669,389,170,170,0,'#fff');r.sprite('ss_holder',855,389,170,170,0,'#fff');
  r.text(photo?'LAST SHOT '+String(photo.receiptId).padStart(2,'0'):'LAST SHOT',584,284,16,SS_LIGHT);
  r.text(photo?'SHOT TARGET '+String(photo.targetIndexBefore+1).padStart(2,'0'):'SHOT TARGET',770,284,15,SS_MUTED);
  if(photo){ssPhoto(r,s,photo,669,389,15);ssTarget(r,s,photo.expected,855,389,15);const seconds=photo.boundaryTick/s.physics.geometry.ticksPerSecond;
    r.text(ssMode(photo.expected.mode),775,459,13,SS_MUTED);r.text('AT '+seconds.toFixed(2)+' s / '+ssMode(photo.aperture.mode),584,482,14,SS_MUTED);r.text(SS_REASONS[photo.reason],584,502,14,photo.matched?SS_GOOD:SS_WARN);
  }else{ssCenter(r,'NO PHOTO',669,382,15,SS_MUTED);ssCenter(r,'NO RECORD',855,382,15,SS_MUTED);r.text('FILM HAS NOT BEEN EXPOSED',584,484,14,SS_MUTED);}
}
function ssContacts(r,s){
  for(let i=0;i<s.targets.length;i++){const target=s.targets[i],x=20+i*184,credit=s.targetCredits.find(c=>c.targetIndex===i),active=s.activeTargetIndex===i&&s.phase==='playing';
    r.sprite('ss_contact',x+88,455,176,120,0,'#fff');r.text(String(i+1).padStart(2,'0')+' '+ssMode(target.mode),x+12,398,14,'#483744');
    r.text(credit?'SHOT '+credit.photoReceiptId:active?'NEXT':'TARGET',x+107,398,13,credit?'#245e48':'#6c4950');
    if(credit)ssPhoto(r,s,s.photoReceipts.find(p=>p.receiptId===credit.photoReceiptId),x+88,460,10);else ssTarget(r,s,target,x+88,460,10);if(active)r.line(x+5,513,x+171,513,2,SS_GOLD);
  }
}
function ssHeaderFooter(r,s){
  const hz=s.physics.geometry.ticksPerSecond,remaining=Math.max(0,s.deadlineTick-s.tick)/hz;
  r.rect(0,0,960,44,'#231f2b');r.sprite('ss_lens',30,22,33,33,0,'#fff');r.text('SHADOW SHUTTER',56,12,22,SS_LIGHT);
  r.text('FILM '+s.film.remaining+'/'+s.film.initial,352,14,18,SS_GOLD);r.text('CAPTURED '+s.targetCredits.length+'/'+s.targets.length,522,14,18,SS_LIGHT);r.text(remaining.toFixed(1)+' s',831,12,22,SS_LIGHT);
  r.rect(0,520,960,20,'#231f2b');const status=s.phase==='won'?'ALL TARGETS CAPTURED':s.phase==='lost'?(s.lostReason==='film_exhausted'?'ENDED / FILM EMPTY':'ENDED / DEADLINE'):s.preview.matched?'NOW: ALL PARTS MATCH':SS_REASONS[s.preview.reason];
  r.text(status,22,523,13,s.phase==='won'||(s.phase==='playing'&&s.preview.matched)?SS_GOOD:SS_LIGHT);
  const action=s.phase!=='playing'?'PHOTOS KEEP THEIR CAPTURE TIME':s.inputState.quarantined?'RELEASE CONTROLS TO REARM':'A: PHOTO / B: WIDE-TALL / ARROWS: MOVE';r.text(action,525,523,13,SS_MUTED);
}
let ssBlueprintNode=null,ssBlueprintKey='';
function ssInstallBlueprint(){
  if(typeof document==='undefined'||ssBlueprintNode)return;const copy=document.getElementById('dialog-copy');if(!copy)return;copy.closest('.dialog').classList.add('ss-dialog');
  const style=document.createElement('style');style.id='ss-dialog-style';style.textContent=`.ss-dialog{width:min(620px,96%);padding:13px 16px}.ss-dialog #dialog-kicker{display:none}.ss-dialog h2{font-size:24px;line-height:1.15;margin:0 0 5px}.ss-dialog #dialog-copy{font-size:13px;line-height:1.35;margin:4px 0 7px}.ss-dialog #ss-blueprint{padding:6px 8px;border:1px solid #9c817b;border-radius:8px;background:#2e2837;text-align:left}.ss-blueprint-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.ss-blueprint-card{text-align:center;min-width:0}.ss-blueprint-label{color:#f4e6cd;font-size:13px;line-height:17px;white-space:nowrap}.ss-blueprint-image{display:block;width:96px;height:96px;margin:4px auto;background:#211d2b}.ss-blueprint-mode{font-size:12px;line-height:16px;color:#d4b892}.ss-dialog #ss-blueprint-parts,.ss-dialog #ss-blueprint-rule{font-size:12px;line-height:16px;margin:4px 0 0;text-align:center;color:#e4d4c4}.ss-dialog .difficulty{margin:6px 0 4px}.ss-dialog .difficulty button{padding:4px 9px}.ss-dialog .primary{margin-top:4px;padding:7px 12px;font-size:14px}.ss-dialog #dialog-help{margin:4px 0 0;line-height:1.25}.ss-dialog #ss-blueprint[hidden]{display:none}@media(max-height:620px){.ss-dialog{padding:8px 12px}.ss-dialog h2{font-size:22px;margin-bottom:3px}.ss-dialog #dialog-copy{font-size:12px;line-height:1.25;margin:3px 0 5px}.ss-dialog #ss-blueprint{padding:4px 6px}.ss-blueprint-image{width:76px;height:76px;margin:2px auto}.ss-blueprint-label{font-size:12px;line-height:16px}.ss-dialog #ss-blueprint-parts,.ss-dialog #ss-blueprint-rule{margin-top:2px;line-height:15px}.ss-dialog .difficulty{margin:4px 0}.ss-dialog #dialog-help{font-size:12px}}`;
  document.head.append(style);ssBlueprintNode=document.createElement('div');ssBlueprintNode.id='ss-blueprint';ssBlueprintNode.setAttribute('aria-label','三张固定朝向目标底片');copy.after(ssBlueprintNode);
}
function ssSvgElement(name,attrs){const e=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [key,value]of Object.entries(attrs))e.setAttribute(key,String(value));return e;}
function ssBlueprintImage(s,target){
  const u=s.physics.geometry.unitsPerCell,w=target.widthCells*u,h=target.heightCells*u,side=Math.max(...s.physics.aperture.modes.flatMap(m=>m.sizeCells))*u,ox=(side-w)/2,oy=(side-h)/2,svg=ssSvgElement('svg',{viewBox:'0 0 '+side+' '+side,role:'img','aria-label':target.name+'，'+(target.mode==='landscape'?'横幅':'竖幅')+'，固定朝向','data-mode':target.mode});svg.classList.add('ss-blueprint-image');
  svg.append(ssSvgElement('rect',{x:ox,y:oy,width:w,height:h,fill:SS_PAPER,'data-role':'paper'}));
  for(const id of s.physics.geometry.requiredActors){const actor=target.actors.find(a=>a.id===id),group=ssSvgElement('g',{'data-actor-id':id,fill:ssTone(s,id)});for(const q of actor.localRects)group.append(ssSvgElement('rect',{x:ox+q.x0,y:oy+q.y0,width:q.x1-q.x0,height:q.y1-q.y0}));svg.append(group);}return svg;
}
function ssSyncBlueprint(s){
  ssInstallBlueprint();if(!ssBlueprintNode)return;const hidden=s.phase!=='playing';if(ssBlueprintNode.hidden!==hidden)ssBlueprintNode.hidden=hidden;
  if(ssBlueprintKey===s.scenarioId)return;ssBlueprintKey=s.scenarioId;const fragment=document.createDocumentFragment(),cards=document.createElement('div');cards.className='ss-blueprint-cards';
  for(const target of s.targets){const card=document.createElement('div');card.className='ss-blueprint-card';card.dataset.targetIndex=target.targetIndex;card.dataset.targetId=target.targetId;
    const label=document.createElement('div');label.className='ss-blueprint-label';label.textContent=String(target.targetIndex+1).padStart(2,'0')+' '+target.name;
    const mode=document.createElement('div');mode.className='ss-blueprint-mode';mode.textContent=(target.mode==='landscape'?'横幅':'竖幅')+' '+target.widthCells+'×'+target.heightCells;card.append(label,ssBlueprintImage(s,target),mode);cards.append(card);
  }
  const parts=document.createElement('p');parts.id='ss-blueprint-parts';parts.textContent=s.physics.geometry.requiredActors.map((id,i)=>String.fromCharCode(65+i)+' '+s.scenario.actors.find(a=>a.id===id).name).join(' · ');
  const rule=document.createElement('p');rule.id='ss-blueprint-rule';rule.textContent='三片完整入窗 · 不可遮挡 · 朝向固定 · 依序拍摄';fragment.append(cards,parts,rule);ssBlueprintNode.replaceChildren(fragment);ssBlueprintNode.dataset.scenarioId=s.scenarioId;
}
ssInstallBlueprint();
window.GameDef={id:'shadow-shutter',title:'影窗快门',seed:733,holdConfirmAsA:false,accent:'#e1ba77',background:'#302935',atlas:SS_ATLAS,
  description:'移动取景窗，把三块纸影完整拼成目标。A拍摄，B切换横竖画幅；无遮挡、朝向相同才可依序计入。',
  controls:{move:'方向键 / 摇杆 · 移窗',a:'拍摄 / 空格',b:'切换画幅 / B'},actionLabels:['拍摄','切换画幅'],levelLabel:'纸景',levelNames:['纸鸟回眸','纸帆远航','壶影茶灯'],
  tagline:'把当刻光影留在底片上',tip:'导航图不是照片。纸片须完整无遮挡；换目标不重置运动。每拍一张消耗一格胶片。',winTitle:'三张影像已完成',loseTitle:'拍摄未完成',
  result(s){return s.phase==='won'?'三张目标底片已依序完成。':s.lostReason==='film_exhausted'?'胶片已用尽，目标尚未拍齐。':'时间已到，目标尚未拍齐。';},
  hud(s){ssSyncBlueprint(s);return[{label:'剩余胶片',value:s.film.remaining+'/'+s.film.initial,tone:s.film.remaining<2?'warn':''},{label:'已拍齐',value:s.targetCredits.length+'/'+s.targets.length,tone:s.phase==='won'?'good':''},{label:'当前画幅',value:s.aperture.mode==='landscape'?'横幅':'竖幅',tone:''},{label:'剩余时间',value:(Math.max(0,s.deadlineTick-s.tick)/s.physics.geometry.ticksPerSecond).toFixed(1)+' s',tone:''}];},
  render(r,s){r.sprite('ss_bench',480,270,960,540,0,'#fff');ssScout(r,s);ssLiveAndTarget(r,s);ssLastPhoto(r,s);ssContacts(r,s);ssHeaderFooter(r,s);}
};
