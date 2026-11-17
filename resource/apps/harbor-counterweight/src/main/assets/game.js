/* Original native baked harbor artwork; rendering reads only public committed state. */
function harborLinear(c, x1, y1, x2, y2, stops) {
  const g = c.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}
function harborPath(c, points, fill, stroke, width = 1) {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function harborEllipse(c, x, y, rx, ry, fill) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
}
function harborRivet(c, x, y, radius = 2) {
  harborEllipse(c, x, y + 1, radius + .6, radius + .6, '#263e48');
  harborEllipse(c, x, y, radius, radius, '#a9bcc0');
  harborEllipse(c, x - .5, y - .5, radius * .38, radius * .38, '#e2e8d8');
}
function harborHull(c, w, h) {
  c.save(); c.scale(w / 512, h / 216);
  harborPath(c, [[18, 34], [494, 34], [458, 185], [438, 200], [74, 200], [54, 185]], harborLinear(c, 0, 34, 0, 200, [[0, '#547b88'], [.35, '#244b60'], [1, '#122d43']]), '#102b3c', 4);
  harborPath(c, [[24, 42], [488, 42], [477, 75], [35, 75]], '#bdd0cc');
  harborPath(c, [[35, 75], [477, 75], [468, 97], [44, 97]], '#d6a660');
  harborPath(c, [[45, 101], [467, 101], [448, 176], [432, 188], [80, 188], [64, 176]], harborLinear(c, 0, 100, 0, 188, [[0, '#2a5263'], [1, '#173446']]));
  for (let x = 88; x <= 432; x += 43) {
    c.fillStyle = 'rgba(204,225,223,.12)'; c.fillRect(x, 105, 2, 72);
    harborRivet(c, x + 8, 111, 2); harborRivet(c, x + 8, 176, 2);
  }
  c.fillStyle = '#132c3d'; c.fillRect(62, 16, 388, 39);
  c.fillStyle = '#708e91'; c.fillRect(62, 16, 388, 7);
  c.fillStyle = '#d5dfcf'; c.fillRect(26, 29, 460, 8);
  c.fillStyle = '#79969b'; c.fillRect(27, 37, 458, 5);
  for (const x of [32, 480]) {
    c.fillStyle = '#152c3a'; c.fillRect(x - 5, 9, 10, 25);
    harborEllipse(c, x, 10, 8, 3, '#d3d9c6');
  }
  for (const x of [75, 437]) {
    harborEllipse(c, x, 139, 18, 22, '#0e2533');
    harborEllipse(c, x, 136, 12, 16, '#173344');
    c.strokeStyle = '#6d8890'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, 137, 15, 19, 0, 0, Math.PI * 2); c.stroke();
  }
  c.strokeStyle = 'rgba(221,235,220,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(76, 193); c.lineTo(436, 193); c.stroke();
  c.restore();
}
function harborContainer(c, w, h) {
  c.save(); c.scale(w / 128, h / 128);
  harborPath(c, [[13, 30], [105, 30], [115, 111], [19, 111]], '#173e53');
  harborPath(c, [[13, 30], [29, 16], [113, 16], [105, 30]], '#bed1cf');
  harborPath(c, [[105, 30], [113, 16], [121, 97], [115, 111]], '#2a5767');
  c.fillStyle = harborLinear(c, 0, 33, 0, 108, [[0, '#77a6ad'], [.45, '#5a8c9a'], [1, '#315c72']]); c.fillRect(19, 33, 89, 73);
  for (let x = 25; x < 105; x += 12) { c.fillStyle = '#294e62'; c.fillRect(x, 36, 2, 67); c.fillStyle = '#89b0b4'; c.fillRect(x + 2, 36, 2, 67); }
  c.fillStyle = '#f0e5c6'; c.fillRect(33, 48, 60, 43);
  c.fillStyle = '#d0c7ae'; c.fillRect(33, 88, 60, 3);
  for (const x of [18, 104]) for (const y of [32, 104]) harborRivet(c, x, y, 2.4);
  c.restore();
}
function harborCrate(c, w, h) {
  c.save(); c.scale(w / 128, h / 128);
  harborPath(c, [[14, 29], [28, 15], [111, 15], [103, 29]], '#e3bf83');
  harborPath(c, [[103, 29], [111, 15], [121, 100], [111, 112]], '#8d6748');
  c.fillStyle = harborLinear(c, 0, 28, 0, 112, [[0, '#d5a461'], [1, '#a16e43']]); c.fillRect(15, 29, 96, 83);
  for (let y = 38; y < 108; y += 13) { c.fillStyle = '#a2794e'; c.fillRect(20, y, 84, 1); c.fillStyle = 'rgba(249,220,166,.4)'; c.fillRect(20, y + 2, 84, 1); }
  for (const x of [20, 97]) { c.fillStyle = '#3c5255'; c.fillRect(x, 27, 8, 88); c.fillStyle = '#b1b5a2'; c.fillRect(x + 1, 27, 2, 88); }
  for (const x of [24, 101]) for (const y of [35, 105]) harborRivet(c, x, y, 2.1);
  c.fillStyle = '#f1e8d3'; c.fillRect(34, 48, 58, 43);
  c.fillStyle = '#cfb993'; c.fillRect(34, 89, 58, 2);
  c.restore();
}
function harborDrums(c, w, h) {
  c.save(); c.scale(w / 128, h / 128);
  c.fillStyle = '#4e5446'; c.fillRect(11, 109, 108, 7); c.fillStyle = '#b5a67b'; c.fillRect(14, 106, 102, 5);
  for (const x of [35, 89]) {
    c.fillStyle = harborLinear(c, x - 23, 0, x + 23, 0, [[0, '#325d56'], [.3, '#96b39a'], [.56, '#6b9382'], [1, '#284d4e']]); c.fillRect(x - 23, 29, 46, 76);
    harborEllipse(c, x, 104, 23, 6, '#315954'); harborEllipse(c, x, 28, 23, 7, '#c1c9ac'); harborEllipse(c, x, 28, 18, 4, '#91a691');
    for (const y of [42, 91]) { c.fillStyle = '#2a504e'; c.fillRect(x - 24, y, 48, 4); c.fillStyle = '#c2ceb1'; c.fillRect(x - 23, y, 46, 1); }
  }
  c.fillStyle = '#e5dfc6'; c.fillRect(29, 49, 70, 37); c.fillStyle = '#a8af96'; c.fillRect(29, 84, 70, 2);
  c.restore();
}
function harborBallast(c, w, h) {
  c.save(); c.scale(w / 160, h / 104);
  harborPath(c, [[12, 27], [29, 13], [146, 13], [133, 27]], '#c6d0c9');
  harborPath(c, [[133, 27], [146, 13], [151, 77], [138, 92]], '#40545d');
  c.fillStyle = harborLinear(c, 0, 27, 0, 91, [[0, '#8b9d9f'], [1, '#4d6874']]); c.fillRect(12, 27, 126, 65);
  c.fillStyle = '#d9bd77'; c.fillRect(16, 75, 118, 10);
  c.save(); c.beginPath(); c.rect(16, 75, 118, 10); c.clip(); for (let x = 5; x < 140; x += 16) harborPath(c, [[x, 75], [x + 8, 75], [x + 18, 85], [x + 10, 85]], '#40535a'); c.restore();
  c.fillStyle = '#e2e6d8'; c.fillRect(38, 36, 77, 29);
  for (const x of [23, 127]) harborRivet(c, x, 37, 3);
  for (const x of [30, 119]) { harborEllipse(c, x, 93, 10, 7, '#152e3b'); harborEllipse(c, x, 92, 5, 4, '#a0b1ad'); }
  c.restore();
}
function harborTrolley(c, w, h) {
  c.save(); c.scale(w / 112, h / 88);
  for (const x of [23, 88]) { harborEllipse(c, x, 19, 13, 13, '#233e4e'); harborEllipse(c, x, 18, 8, 8, '#c5d0c9'); harborRivet(c, x, 18, 3); }
  c.fillStyle = harborLinear(c, 0, 28, 0, 69, [[0, '#e5b875'], [1, '#a65e37']]); c.fillRect(10, 28, 92, 41);
  c.fillStyle = '#edce91'; c.fillRect(10, 28, 92, 6);
  for (let x = 20; x < 49; x += 6) { c.fillStyle = '#6a4b3e'; c.fillRect(x, 42, 3, 17); }
  harborEllipse(c, 78, 51, 16, 16, '#314954'); harborEllipse(c, 78, 51, 10, 10, '#8a9d9b'); harborRivet(c, 78, 51, 4);
  c.fillStyle = '#273e4c'; c.fillRect(49, 67, 14, 14); harborEllipse(c, 56, 80, 10, 5, '#9baea9');
  c.restore();
}
function harborHook(c, w, h) {
  c.save(); c.scale(w / 64, h / 96);
  c.fillStyle = '#334e5a'; c.fillRect(24, 2, 16, 23);
  harborPath(c, [[14, 25], [50, 25], [45, 54], [19, 54]], harborLinear(c, 14, 0, 50, 0, [[0, '#c9d4c8'], [.5, '#718b91'], [1, '#344e59']]), '#2e4754', 2);
  c.strokeStyle = '#263d4a'; c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); c.moveTo(32, 54); c.lineTo(32, 65); c.bezierCurveTo(12, 66, 14, 89, 33, 89); c.bezierCurveTo(47, 89, 52, 76, 43, 70); c.stroke();
  c.strokeStyle = '#b8c7bf'; c.lineWidth = 4; c.beginPath(); c.moveTo(30, 56); c.lineTo(30, 65); c.bezierCurveTo(15, 70, 20, 86, 33, 86); c.stroke();
  c.restore();
}
function harborQuay(c, w, h) {
  c.save(); c.scale(w / 256, h / 192);
  c.fillStyle = harborLinear(c, 0, 0, 0, 192, [[0, '#d4c8a5'], [.4, '#a89b7e'], [1, '#6c7b73']]); c.fillRect(0, 20, 256, 172);
  harborPath(c, [[0, 20], [23, 0], [256, 0], [256, 20]], '#ecdfb7');
  c.fillStyle = '#344c55'; c.fillRect(0, 20, 256, 13);
  for (let x = 0; x < 256; x += 40) { c.fillStyle = '#e4bd6d'; c.fillRect(x + 5, 23, 18, 7); }
  for (let row = 0; row < 4; row++) for (let x = row % 2 ? -32 : 0; x < 256; x += 64) {
    c.strokeStyle = 'rgba(58,77,70,.35)'; c.lineWidth = 2; c.strokeRect(x + 2, 39 + row * 39, 60, 35);
    c.fillStyle = 'rgba(243,230,190,.18)'; c.fillRect(x + 5, 42 + row * 39, 54, 2);
  }
  c.restore();
}
function harborWater(c, w, h) {
  c.fillStyle = harborLinear(c, 0, 0, 0, h, [[0, '#92c8c5'], [.6, '#5ea6ae'], [1, '#397f95']]); c.fillRect(0, 0, w, h);
  c.lineCap = 'round'; c.lineWidth = 2;
  for (let i = 0; i < 12; i++) { const x = (i * 47) % w, y = 8 + (i * 29) % (h - 12); c.strokeStyle = i % 3 ? 'rgba(231,242,211,.26)' : 'rgba(38,97,113,.18)'; c.beginPath(); c.moveTo(x, y); c.lineTo(Math.min(w, x + 18 + i % 4 * 6), y); c.stroke(); }
}
function harborShadow(c, w, h) {
  c.save(); c.translate(w / 2, h / 2); c.scale(w / 2, h / 2);
  const g = c.createRadialGradient(0, 0, .1, 0, 0, 1); g.addColorStop(0, 'rgba(15,49,63,.35)'); g.addColorStop(1, 'rgba(15,49,63,0)');
  c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
}
const HARBOR_STATIC_ATLAS_DRAFT = { builtins: [], tiles: [
  { name: 'harbor_hull', x: 0, y: 0, w: 512, h: 216, paint: harborHull },
  { name: 'harbor_container', x: 512, y: 0, w: 128, h: 128, paint: harborContainer },
  { name: 'harbor_crate', x: 640, y: 0, w: 128, h: 128, paint: harborCrate },
  { name: 'harbor_drums', x: 768, y: 0, w: 128, h: 128, paint: harborDrums },
  { name: 'harbor_quay', x: 0, y: 216, w: 256, h: 192, paint: harborQuay },
  { name: 'harbor_ballast', x: 256, y: 216, w: 160, h: 104, paint: harborBallast },
  { name: 'harbor_trolley', x: 416, y: 216, w: 112, h: 88, paint: harborTrolley },
  { name: 'harbor_hook', x: 528, y: 216, w: 64, h: 96, paint: harborHook },
  { name: 'harbor_water', x: 0, y: 800, w: 256, h: 128, paint: harborWater },
  { name: 'harbor_shadow', x: 256, y: 800, w: 256, h: 128, paint: harborShadow }
] };

const H_INK='#193d50',H_MUTED='#577784',H_PAPER='#edf0dc',H_GOLD='#dcac61',H_RED='#b85c48',H_GOOD='#397e75';
const H_VIEW={x:430,y:300,scale:54,deck:-18,clearanceY:174,shoreCargoY:326};
function hCenter(r,text,x,y,size,color=H_INK){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
function hPoint(s,x,y){const a=s.ship.rollRad,c=Math.cos(a),n=Math.sin(a);return{x:H_VIEW.x+x*c-y*n,y:H_VIEW.y+x*n+y*c};}
function hShipLine(r,s,x1,y1,x2,y2,width,color){const a=hPoint(s,x1,y1),b=hPoint(s,x2,y2);r.line(a.x,a.y,b.x,b.y,width,color);}
function hOutline(r,s,x,y,w,h,color,width=2){hShipLine(r,s,x,y,x+w,y,width,color);hShipLine(r,s,x+w,y,x+w,y+h,width,color);hShipLine(r,s,x+w,y+h,x,y+h,width,color);hShipLine(r,s,x,y+h,x,y,width,color);}
function hSlot(s,column,tier){return hPoint(s,s.columnXM[column]*H_VIEW.scale,-44-tier*58);}
function hWorldX(m){return H_VIEW.x+m*H_VIEW.scale;}
function hSigned(v,n=1){return(v>0?'+':'')+v.toFixed(n);}
function hCargoArt(id){return['harbor_container','harbor_crate','harbor_drums'][(Number(id.slice(1))-1)%3];}
function hCargo(r,c,x,y,size=64,angle=0,labels=true){
  r.sprite(hCargoArt(c.id),x,y,size,size,angle,'#fff');
  if(labels){const font=size>=60?16:13;r.rect(x-size*.29,y-8,size*.58,31,'#f1e8d3');hCenter(r,c.id,x,y-8,font,H_INK);hCenter(r,c.massT+' t',x,y+8,font,H_INK);}
}
function hStage(s){if(s.crane.idle)return'CRANE IDLE';return{'lift-shore':'ATTACH AT SHORE','carry-to-ship':'CARRY TO SHIP','lower-ship':'LOWER TO DECK','return-shore':'EMPTY RETURN','approach-ship':'EMPTY APPROACH','lift-ship':'ATTACH ON DECK','carry-to-shore':'CARRY TO SHORE','lower-shore':'LOWER TO QUAY'}[s.crane.stage];}
function hHeader(r,s){
  r.rect(0,0,960,65,H_INK);r.text('HARBOR COUNTERWEIGHT',22,12,22,H_PAPER);r.text(s.levelNameEn.toUpperCase(),22,40,14,'#b7cfcd');
  const status=s.phase==='won'?'EXPORT READY':s.phase==='lost'?'OPERATIONS ENDED':s.operationPhase==='departure'?'STABILIZE FOR DEPARTURE':s.operationPhase.toUpperCase();
  r.text(status,407,14,18,H_PAPER);r.text('LOAD '+s.loadJobsCompleted+'/'+s.loadOrder.length+'  UNLOAD '+s.unloadJobsCompleted+'/'+s.unloadOrder.length,407,41,14,'#c0d3c9');
  r.text('SHIP '+s.ship.massT.toFixed(0)+' t',744,14,21,H_GOLD);r.text('CARGO ABOARD '+s.ship.aboardCargoMassT+' t',744,42,13,H_PAPER);
}
function hBackdrop(r,s){
  r.rect(0,65,704,405,'#d8e4db');r.rect(0,260,704,210,'#95c5c2');r.sprite('harbor_water',352,365,704,210,0,'#fff');
  for(let i=0;i<8;i++){const x=188+i*61;r.rect(x,241-(i%3)*9,50,30+(i%3)*9,'#91b0ac');r.rect(x+4,238-(i%3)*9,42,4,'#b0c3b6');}
  r.line(176,274,696,274,2,'#c4d9c9');r.line(170,336,696,336,2,'#d2e5d3');
  r.sprite('harbor_shadow',H_VIEW.x,435,540,58,0,'#fff');
  r.sprite('harbor_quay',85,400,170,140,0,'#fff');r.rect(10,352,148,5,'#efe0b5');
  r.rect(25,89,13,264,'#af713f');r.rect(28,89,3,264,'#e8bd79');r.rect(16,348,35,11,'#294653');
  r.line(35,113,140,89,9,'#bb7f46');r.line(34,190,137,96,5,'#d6a567');
  r.rect(17,86,666,18,'#cc9353');r.rect(17,86,666,4,'#f1ce8b');r.rect(17,104,666,6,'#526b70');
  for(let x=48;x<665;x+=41){r.line(x,91,x+24,99,2,'#9b643b');r.circle(x,94,1.5,'#e9cb99');}
  r.text('SHORE QUEUE',18,123,13,H_INK);r.text('DELIVERED',16,390,13,H_PAPER);
}
function hShip(r,s){
  const hull=hPoint(s,0,32);r.sprite('harbor_hull',hull.x,hull.y,520,140,s.ship.rollRad,'#fff');
  for(let i=0;i<s.columnXM.length;i++){
    const x=s.columnXM[i]*H_VIEW.scale;
    if(i===s.cursor&&s.phase==='playing')hOutline(r,s,x-42,-139,84,127,H_GOLD,2.5);
    hShipLine(r,s,x-39,H_VIEW.deck,x+39,H_VIEW.deck,4,'#d8ddc5');
    const label=hPoint(s,x,8);hCenter(r,String(i+1),label.x,label.y,16,H_PAPER);
  }
  hShipLine(r,s,-183,56,183,56,8,'#102f42');hShipLine(r,s,-183,53,183,53,2,'#c0d1c7');hShipLine(r,s,-183,70,183,70,2,'#708e93');
  for(const xm of s.columnXM)hShipLine(r,s,xm*H_VIEW.scale,51,xm*H_VIEW.scale,73,2,'#587780');
  const tx=s.ballastTargetXM*H_VIEW.scale;
  hOutline(r,s,tx-29,35,58,41,'#e8c883',2);
  const b=hPoint(s,s.ballastXM*H_VIEW.scale,56);r.sprite('harbor_ballast',b.x,b.y,65,42,s.ship.rollRad,'#fff');hCenter(r,s.physics.ballastMassT+' t',b.x,b.y-5,13,H_INK);
  for(const c of s.cargo)if(c.location==='ship'){const p=hSlot(s,c.column,c.tier);hCargo(r,c,p.x,p.y,64,s.ship.rollRad);}
  const cm=hPoint(s,s.ship.centerOfMassXM*H_VIEW.scale,91);r.circle(cm.x,cm.y,4,H_GOLD);
}
function hHoistView(s){
  const c=s.crane,p=c.stageProgress,railX=hWorldX(c.railXM),slot=c.column===null?null:hSlot(s,c.column,c.tier);
  let x=railX,y=204,cargoY=H_VIEW.clearanceY;
  if(c.stage==='lift-shore')y=204+(H_VIEW.shoreCargoY-32-204)*p;
  else if(c.stage==='carry-to-ship'){cargoY=H_VIEW.shoreCargoY+(H_VIEW.clearanceY-H_VIEW.shoreCargoY)*Math.min(1,p*4);y=cargoY-34;}
  else if(c.stage==='lower-ship'){x=railX+(slot.x-railX)*p;cargoY=H_VIEW.clearanceY+(slot.y-H_VIEW.clearanceY)*p;y=cargoY-34;}
  else if(c.stage==='return-shore'){y=slot.y-34+(H_VIEW.clearanceY-34-(slot.y-34))*Math.min(1,p*4);}
  else if(c.stage==='approach-ship'){x=railX+(slot.x-railX)*p; y=204+(slot.y-34-204)*p;}
  else if(c.stage==='lift-ship'){x=slot.x;y=slot.y-34;}
  else if(c.stage==='carry-to-shore'){const rise=Math.min(1,p*4);x=railX+(slot.x-hWorldX(s.columnXM[c.column]))*(1-rise);cargoY=slot.y+(H_VIEW.clearanceY-slot.y)*rise;y=cargoY-34;}
  else if(c.stage==='lower-shore'){cargoY=H_VIEW.clearanceY+(H_VIEW.shoreCargoY-H_VIEW.clearanceY)*p;y=cargoY-34;}
  return{x,y,cargoY,railX};
}
function hShoreCargo(r,s){
  for(const c of s.cargo){
    if(c.location==='shore'){
      const i=s.shoreIds.indexOf(c.id);if(i===0)hCargo(r,c,hWorldX(s.shoreXM),H_VIEW.shoreCargoY,64);
      else hCargo(r,c,44+((i-1)%2)*65,176+Math.floor((i-1)/2)*54,53);
    }else if(c.location==='delivered'){
      const i=s.deliveredIds.indexOf(c.id);hCargo(r,c,30+i*39,431,37,0,false);hCenter(r,c.id,30+i*39,446,13,H_PAPER);
    }
  }
}
function hCrane(r,s){
  const v=hHoistView(s);r.sprite('harbor_trolley',v.railX,108,62,49,0,'#fff');
  r.line(v.railX-3,126,v.x-3,v.y-18,2,'#2c4a56');r.line(v.railX+3,126,v.x+3,v.y-18,2,'#778d8c');
  r.sprite('harbor_hook',v.x,v.y,25,37,0,'#fff');
  if(s.hookId!==null){const c=s.cargo.find(x=>x.id===s.hookId);hCargo(r,c,v.x,v.cargoY,64);r.line(v.x-15,v.cargoY-24,v.x,v.y+13,1.5,'#6b7770');r.line(v.x+15,v.cargoY-24,v.x,v.y+13,1.5,'#6b7770');}
}
function hInstrument(r,s){
  r.rect(704,75,240,385,'#e8e7d3');r.rect(712,83,224,133,'#234859');
  const angle=s.ship.rollRad*180/Math.PI,omega=s.ship.angularVelocityRadS*180/Math.PI,bad=Math.abs(s.ship.rollRad)>s.limits.unsafeRollRad;
  r.text('ACTUAL HEEL',724,93,14,'#bed4cd');r.text('FALL '+s.limits.overboardRollDegrees+'deg',852,94,13,'#efbb92');r.text(hSigned(angle)+' deg',724,114,27,bad?'#f1ad85':H_PAPER);
  r.text('ROLL RATE '+hSigned(omega)+' deg/s',724,148,13,'#d6e0ca');
  const cx=834,cy=177,half=32;r.line(cx-half,cy,cx+half,cy,1,'#8faaa9');
  r.line(cx-half*Math.cos(s.ship.rollRad),cy-half*Math.sin(s.ship.rollRad),cx+half*Math.cos(s.ship.rollRad),cy+half*Math.sin(s.ship.rollRad),4,bad?'#efaa7d':'#d9bc78');r.circle(cx,cy,5,H_PAPER);
  r.text('UNSAFE >'+s.limits.unsafeRollDegrees+'deg '+s.unsafeTicks+'/'+s.limits.unsafeConsecutiveTicks,724,195,13,bad?'#f1ad85':'#c3d9cf');
  r.text('ID    MASS    LOCATION',720,226,14,H_MUTED);
  s.cargo.forEach((c,i)=>{const y=248+i*25;r.rect(716,y-2,216,23,i%2?'#d5ded1':'#f0eddb');r.text(c.id,724,y,16,H_INK);r.text(c.massT+' t',777,y,16,H_INK);const loc=c.location==='ship'?'COL '+(c.column+1)+' / '+(c.tier+1):c.location==='delivered'?'QUAY':c.location==='overboard'?'LOST':c.location.toUpperCase();r.text(loc,830,y+1,14,c.location==='overboard'?H_RED:H_INK);if(c.location==='overboard')hCargo(r,c,906,y+9,24,0,false);});
  r.text('LOAD '+s.loadOrder.join(' '),720,403,13,H_MUTED);r.text('OUT  '+s.unloadOrder.join(' '),720,422,13,H_MUTED);r.text('EXPORT '+s.exportIds.join(' '),720,441,14,H_GOOD);
}
function hFooter(r,s){
  r.rect(0,470,960,70,H_INK);let action;
  if(s.phase==='won')action='DEPARTURE STABLE / EXPORT CARGO SECURED';
  else if(s.phase==='lost')action='STOPPED / '+s.lostReason.toUpperCase().replace(/-/g,' ');
  else if(!s.crane.idle)action=s.crane.cargoId+' / '+hStage(s)+'  '+Math.round(s.crane.stageProgress*100)+'%';
  else if(s.operationPhase==='departure')action='STABLE '+(s.stableTicks/s.physics.tickHz).toFixed(1)+' / '+(s.limits.departureStableTicks/s.physics.tickHz).toFixed(1)+' s';
  else action='COL '+(s.cursor+1)+'  A: '+(s.currentTask.type==='load'?'LOAD ':'UNLOAD ')+s.currentTask.cargoId+' / '+s.currentTask.massT+' t';
  r.text(action,22,481,17,H_PAPER);
  const target=hSigned(s.ballastTargetXM,0),actual=hSigned(s.ballastXM,2);r.text('BALLAST '+actual+'m > '+target+'m',665,482,14,H_GOLD);
  let advice=s.phase!=='playing'?'FINAL CARGO AND ROLL STATE':s.operationPhase==='departure'?'DEPART <='+s.limits.departureMaximumRollDegrees+'deg / RATE <='+s.limits.departureMaximumAngularVelocityDegreesS+'deg/s / BALLAST STILL':s.hookId?'HOOK CARGO IS OFF THE SHIP':'ONLY THE TOP CARGO CAN BE UNLOADED';
  r.text(advice,22,511,13,'#bcd1c8');
  if(s.phase==='playing')r.text(s.ballastTargetXM===s.columnXM[s.cursor]?'B: TARGET CENTER':'B: TARGET COL '+(s.cursor+1),665,510,15,H_PAPER);
  else r.text('NO ACTIVE CONTROLS',665,511,13,'#bcd1c8');
}
window.GameDef={id:'harbor-counterweight',title:'港口配重',seed:729,accent:'#c89450',background:'#c9ded8',atlas:HARBOR_STATIC_ATLAS_DRAFT,
  description:'左右选舱列，A 按队列装卸；只可卸最上层指定货物。B 移动船底配重，在同一目标列再按可归中。吊机与配重同时运行，别让船持续倾斜。留下出口货并稳船离港。',
  controls:{move:'左右 / 摇杆 · 选舱列',a:'吊机搬运 / 空格',b:'配重到此·归中 / B'},actionLabels:['吊机搬运','移动配重'],
  levelLabel:'班次',levelNames:['日班','转运','夜航'],tip:'卸货只取顶层。B 改目标，配重慢慢移动；悬吊货不计船重。',winTitle:'稳船离港',loseTitle:'本班作业结束',
  result(s){if(s.phase==='won')return'四件货已送回岸上，出口货稳定留船。';if(s.lostReason==='overboard')return'倾斜过大，货物落海。提前移动配重并分散重货。';if(s.lostReason==='sustained-heel')return'船体持续倾斜。搬货前就开始调整配重。';return'班次时间已到。按卸货顺序安排顶层货物。';},
  hud(s){return[{label:'作业阶段',value:s.phase==='won'?'稳定离港':s.phase==='lost'?'已结束':({loading:'装船',unloading:'卸货',departure:'稳船'})[s.operationPhase],tone:''},{label:'吊机任务',value:s.jobsCompleted+' / '+s.tasks.length,tone:''},{label:'船体倾角',value:(s.ship.rollRad*180/Math.PI).toFixed(1)+'°',tone:Math.abs(s.ship.rollRad)>s.limits.unsafeRollRad?'warn':''},{label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<10?'warn':''}];},
  render(r,s){hBackdrop(r,s);hShip(r,s);hShoreCargo(r,s);hCrane(r,s);hInstrument(r,s);hHeader(r,s);hFooter(r,s);}
};
