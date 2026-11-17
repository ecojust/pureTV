/* Original miniature stone court. Public gate views and committed beat receipts are drawn without route prediction. */
const MG_C={ink:'#243f43',muted:'#607772',paper:'#edf3e5',teal:'#29796e',open:'#3b927d',copper:'#bb8657',blue:'#276cba',red:'#aa4941',line:'#a6b5a7',shut:'#8c5b4c'};
function mgGradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);for(const [p,color]of stops)g.addColorStop(p,color);return g;}
function mgPath(c,p,fill,stroke,width=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function mgStroke(c,p,color,width=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function mgEllipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
function mgRivet(c,x,y){mgEllipse(c,x,y,2.4,2.4,'#436f64');mgEllipse(c,x-.5,y-.5,1.7,1.7,'#e1c294');}
function mgBackground(c,w,h){
  c.save();c.scale(w/512,h/384);c.fillStyle=mgGradient(c,0,0,512,384,[[0,'#d3e1d7'],[.5,'#aebeb7'],[1,'#819f98']]);c.fillRect(0,0,512,384);
  mgPath(c,[[9,59],[350,59],[355,346],[4,346]],'#526f6938');mgPath(c,[[9,54],[349,54],[349,338],[9,338]],mgGradient(c,0,50,350,340,[[0,'#d3dcd1'],[.7,'#b1c3b7'],[1,'#90aba0']]),'#eff4e0',1);
  for(let i=0;i<7;i++){const x=30+i*49;mgStroke(c,[[x,63],[x+23,109],[x-8,210],[x+20,330]],'#678b7d12',1);}mgStroke(c,[[15,331],[342,331]],'#eaf1db66',1);c.restore();
}
function mgFloor(c,w,h){
  c.save();c.scale(w/96,h/96);mgPath(c,[[7,8],[89,8],[94,13],[94,89],[88,94],[8,94],[2,88],[2,14]],'#7b9a8b');
  mgPath(c,[[8,3],[88,3],[93,9],[93,85],[87,91],[9,91],[3,85],[3,10]],mgGradient(c,0,0,96,96,[[0,'#f3f0db'],[.5,'#d8dfcd'],[1,'#bfcdba']]),'#faf7e6',1);
  mgStroke(c,[[8,9],[86,9]],'#ffffffaa',1);mgStroke(c,[[8,86],[86,86]],'#99b2a1',1);mgStroke(c,[[23,8],[33,24],[30,41],[50,55]],'#a2b4a247',.8);mgStroke(c,[[73,21],[65,48],[73,67],[68,87]],'#b8c7b34d',.8);c.restore();
}
function mgWall(c,w,h){
  c.save();c.scale(w/96,h/96);mgPath(c,[[5,15],[91,15],[95,23],[95,91],[4,91],[1,24]],'#496f64');mgPath(c,[[8,4],[87,4],[93,12],[93,78],[86,87],[9,87],[3,79],[3,12]],mgGradient(c,0,0,96,96,[[0,'#8ba28b'],[.4,'#6b8976'],[1,'#3c6d60']]),'#a5b399',1);
  mgPath(c,[[16,14],[79,14],[84,20],[81,69],[72,78],[18,75],[12,65],[11,24]],'#4f7963');
  for(let i=0;i<7;i++){const x=23+(i*19)%54,y=24+(i*17)%43;mgEllipse(c,x,y,12,8,i%2?'#648f6c':'#769b70');mgStroke(c,[[x-5,y+2],[x+4,y-3]],'#a4b47b44',1);}mgStroke(c,[[10,82],[86,82]],'#bed0aa44',1);c.restore();
}
function mgGatePainter(open){return function(c,w,h){
  c.save();c.scale(w/96,h/96);mgEllipse(c,48,80,39,10,'#284b4833');mgPath(c,[[11,82],[11,29],[21,17],[75,17],[85,29],[85,82],[68,82],[68,33],[28,33],[28,82]],mgGradient(c,5,10,90,85,[[0,'#b1c7ad'],[.25,'#528d7c'],[.7,'#2b655d'],[1,'#80ac90']]),'#274f4c',1.5);
  mgPath(c,[[21,15],[75,15],[82,23],[14,23]],'#ddb788','#f4dcc0',1);mgStroke(c,[[17,33],[17,75]],'#b7d0af',2);mgStroke(c,[[78,33],[78,75]],'#a7c7a5',1.5);
  if(open){mgPath(c,[[29,37],[35,37],[35,74],[29,74]],'#bee0be');mgPath(c,[[61,37],[67,37],[67,74],[61,74]],'#bee0be');mgStroke(c,[[41,72],[48,65],[55,72]],'#5e9c8b',3);}
  else{mgPath(c,[[29,34],[67,34],[67,76],[29,76]],mgGradient(c,28,34,68,76,[[0,'#b58d63'],[.5,'#8b6451'],[1,'#6f554b']]),'#f0cd9b',1);for(const y of [42,52,62])mgStroke(c,[[31,y],[65,y]],'#c4a47a',2);mgPath(c,[[42,47],[54,47],[54,62],[42,62]],'#374f4b');mgRivet(c,48,54);}
  for(const x of [20,76])for(const y of [28,76])mgRivet(c,x,y);c.restore();
};}
function mgBall(c,w,h){
  c.save();c.scale(w/96,h/96);mgEllipse(c,49,77,32,10,'#204e504d');const g=c.createRadialGradient(33,26,3,48,43,34);for(const[p,color]of [[0,'#d1edee'],[.17,'#6bb3d3'],[.48,'#2b80bd'],[.78,'#285f9f'],[1,'#193c69']])g.addColorStop(p,color);mgEllipse(c,48,43,34,34,g);mgEllipse(c,36,28,13,7,'#e0f7efb0');mgStroke(c,[[28,62],[40,68],[55,68],[68,58]],'#5ca6c7',1.4);mgEllipse(c,35,24,5,3,'#fffef2');c.restore();
}
function mgMarkerPainter(collected){return function(c,w,h){
  c.save();c.scale(w/64,h/96);mgEllipse(c,32,79,23,9,'#4a70633b');mgPath(c,[[10,71],[32,64],[54,71],[54,81],[32,90],[10,81]],'#b4bda3','#edf0d8',1);
  if(!collected){mgPath(c,[[32,8],[49,28],[43,57],[32,69],[21,57],[15,28]],mgGradient(c,15,10,50,70,[[0,'#fae8ae'],[.4,'#d3ad5b'],[.8,'#b27f3f'],[1,'#ebcf88']]),'#795d3c',1.2);mgPath(c,[[32,15],[41,30],[32,56],[23,30]],'#fff1bb','#d3af66',1);}
  else{mgStroke(c,[[23,74],[30,80],[42,68]],'#397d6c',3);}c.restore();
};}
function mgExitPainter(open){return function(c,w,h){
  c.save();c.scale(w/96,h/96);mgPath(c,[[10,17],[85,17],[90,24],[90,80],[82,89],[13,89],[5,81],[5,25]],'#748f7d');mgPath(c,[[14,10],[80,10],[87,18],[87,74],[79,82],[17,82],[9,74],[9,20]],mgGradient(c,10,0,90,90,[[0,'#ebedda'],[1,'#b7cbb4']]),'#f5f2dc',1);
  mgPath(c,[[25,29],[58,29],[58,17],[77,47],[58,76],[58,63],[25,63]],open?'#438b77':'#879b87','#f0edcc',1.5);if(!open){mgPath(c,[[31,37],[51,37],[51,57],[31,57]],'#b18461');mgStroke(c,[[35,37],[35,30],[47,30],[47,37]],'#6b6c54',3);}c.restore();
};}
function mgTrap(c,w,h){
  c.save();c.scale(w/96,h/96);mgPath(c,[[13,10],[82,10],[89,17],[89,81],[82,88],[14,88],[7,81],[7,17]],'#9da78e','#dde2c7',1);mgPath(c,[[18,22],[76,22],[79,72],[19,76]],'#304f4d');for(const x of [25,44,63])mgPath(c,[[x-7,67],[x+2,32],[x+10,65]],mgGradient(c,x-7,30,x+10,67,[[0,'#e8a27c'],[.5,'#a95d4b'],[1,'#6c4c42']]),'#eac79c',1);mgStroke(c,[[14,14],[26,14],[33,20],[44,20],[51,14],[63,14],[70,20],[81,20]],'#a77350',3);c.restore();
}
function mgStart(c,w,h){c.save();c.scale(w/64,h/64);mgEllipse(c,32,32,24,24,'#76999530');c.beginPath();c.arc(32,32,21,0,Math.PI*2);c.strokeStyle='#6a9288';c.lineWidth=3;c.stroke();mgStroke(c,[[20,32],[44,32]],'#c4d9be',2);mgStroke(c,[[32,20],[32,44]],'#c4d9be',2);c.restore();}
function mgCard(c,w,h){c.save();c.scale(w/256,h/256);mgPath(c,[[7,3],[248,3],[253,10],[253,248],[247,254],[8,254],[2,247],[2,10]],'#50736a33');mgPath(c,[[8,1],[245,1],[250,8],[250,242],[244,249],[8,249],[3,242],[3,8]],mgGradient(c,0,0,256,256,[[0,'#f5f3df'],[1,'#d7e2cd']]),'#fbf9e7',1);mgStroke(c,[[10,10],[242,10]],'#aab5a0',1);mgStroke(c,[[10,240],[242,240]],'#9bb29e',1);c.restore();}
const MG_ATLAS={builtins:[],tiles:[
  {name:'mg_background',x:0,y:0,w:512,h:384,paint:mgBackground},{name:'mg_floor',x:512,y:0,w:96,h:96,paint:mgFloor},{name:'mg_wall',x:608,y:0,w:96,h:96,paint:mgWall},
  {name:'mg_gate_open',x:704,y:0,w:96,h:96,paint:mgGatePainter(true)},{name:'mg_gate_shut',x:800,y:0,w:96,h:96,paint:mgGatePainter(false)},{name:'mg_ball',x:896,y:0,w:96,h:96,paint:mgBall},
  {name:'mg_marker',x:512,y:96,w:64,h:96,paint:mgMarkerPainter(false)},{name:'mg_collected',x:576,y:96,w:64,h:96,paint:mgMarkerPainter(true)},
  {name:'mg_exit_locked',x:640,y:96,w:96,h:96,paint:mgExitPainter(false)},{name:'mg_exit_open',x:736,y:96,w:96,h:96,paint:mgExitPainter(true)},
  {name:'mg_trap',x:832,y:96,w:96,h:96,paint:mgTrap},{name:'mg_start',x:928,y:96,w:64,h:64,paint:mgStart},{name:'mg_card',x:0,y:768,w:256,h:256,paint:mgCard}
]};
function mgCenter(r,text,x,y,size,color){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
function mgRight(r,text,x,y,size,color){r.text(text,x-r.measureText(text,size),y,size,color);}
function mgBox(r,x,y,w,h,color,width=1){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function mgLast(list){return list.length?list[list.length-1]:null;}
function mgMapGeometry(s){const cell=Math.min(34,442/s.scenario.cols,374/s.scenario.rows);return{cell,x:335-s.scenario.cols*cell/2,y:98};}
function mgPoint(g,p){return{x:g.x+(p.x+.5)*g.cell,y:g.y+(p.y+.5)*g.cell};}
function mgArrow(r,kind,x,y,color){if(kind==='wait'){r.line(x-4,y-6,x-4,y+6,3,color);r.line(x+4,y-6,x+4,y+6,3,color);return;}const [dx,dy]=({up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]})[kind],px=-dy,py=dx;r.line(x-dx*7,y-dy*7,x+dx*7,y+dy*7,2,color);r.line(x+dx*7,y+dy*7,x+dx*2+px*4,y+dy*2+py*4,2,color);r.line(x+dx*7,y+dy*7,x+dx*2-px*4,y+dy*2-py*4,2,color);}
function mgGateBadge(s,gate){for(const [dx,dy]of [[0,-1],[0,1],[-1,0],[1,0]]){const x=gate.x+dx,y=gate.y+dy;if(s.scenario.grid[y]?.[x]==='#')return{x,y};}return{x:gate.x,y:gate.y};}
function mgMap(r,s){
  const g=mgMapGeometry(s),sc=s.scenario;r.rect(g.x-6,g.y-6,sc.cols*g.cell+12,sc.rows*g.cell+12,'#476c60');
  for(let y=0;y<sc.rows;y++)for(let x=0;x<sc.cols;x++){const p=mgPoint(g,{x,y});r.sprite(sc.grid[y][x]==='#'?'mg_wall':'mg_floor',p.x,p.y,g.cell,g.cell,0,'#fff');}
  const start=mgPoint(g,sc.start);r.sprite('mg_start',start.x,start.y,g.cell*.8,g.cell*.8,0,'#fff');const exit=mgPoint(g,sc.exit);r.sprite(s.exitUnlocked?'mg_exit_open':'mg_exit_locked',exit.x,exit.y,g.cell*.92,g.cell*.92,0,'#fff');
  for(const trap of sc.traps){const p=mgPoint(g,trap);r.sprite('mg_trap',p.x,p.y,g.cell*.94,g.cell*.94,0,'#fff');}
  for(const marker of sc.markers){const p=mgPoint(g,marker),collected=s.collectedMarkerIds.includes(marker.id);r.sprite(collected?'mg_collected':'mg_marker',p.x,p.y-2,g.cell*.58,g.cell*.9,0,'#fff');}
  sc.gates.forEach((gate,i)=>{const p=mgPoint(g,gate),state=s.gateStates[i];r.sprite(state.openNow?'mg_gate_open':'mg_gate_shut',p.x,p.y,g.cell,g.cell,0,'#fff');for(let j=0;j<gate.period;j++)r.circle(p.x+(j-(gate.period-1)/2)*5,p.y+12,1.5,MG_C.paper);});
  const last=mgLast(s.beatReceipts);if(last&&s.phase==='lost'&&(last.outcome==='closed_gate'||last.outcome==='trap')){const p=mgPoint(g,last.candidate);mgBox(r,p.x-g.cell/2+1,p.y-g.cell/2+1,g.cell-2,g.cell-2,MG_C.red,2);if(last.outcome==='closed_gate'){const from=mgPoint(g,last.from);for(let i=1;i<4;i++){const t=i/4;r.circle(from.x+(p.x-from.x)*t,from.y+(p.y-from.y)*t,1.5,MG_C.red);}}}
  const ball=mgPoint(g,s.player);if(s.phase==='lost')r.circle(ball.x,ball.y,13,'#ad5e4e44');r.sprite('mg_ball',ball.x,ball.y-1,g.cell*.78,g.cell*.78,0,'#fff');
  sc.gates.forEach(gate=>{const p=mgPoint(g,gate),label=mgPoint(g,mgGateBadge(s,gate));r.line(label.x,label.y,p.x,p.y,1,'#e5e7c975');r.rect(label.x-15,label.y-7,30,14,'#e5ebd7');mgCenter(r,gate.id.toUpperCase()+'/'+gate.period,label.x,label.y-5,11,MG_C.ink);});
  for(let x=0;x<sc.cols;x++)mgCenter(r,String(x),g.x+(x+.5)*g.cell,g.y-20,11,MG_C.ink);for(let y=0;y<sc.rows;y++)mgRight(r,String(y),g.x-11,g.y+(y+.5)*g.cell-5,11,MG_C.ink);
  r.text('MAP / NOW',26,90,12,MG_C.ink);r.text('BALL',28,126,12,MG_C.muted);r.text(s.player.x+','+s.player.y,28,146,18,MG_C.blue);
  r.sprite('mg_marker',57,214,22,34,0,'#fff');mgCenter(r,'MARK',57,239,11,MG_C.ink);r.sprite(s.exitUnlocked?'mg_exit_open':'mg_exit_locked',57,291,31,31,0,'#fff');mgCenter(r,'EXIT',57,315,11,MG_C.ink);r.sprite('mg_trap',57,364,30,30,0,'#fff');mgCenter(r,'TRAP',57,388,11,MG_C.red);
}
function mgGateSymbol(r,x,y,open){r.rect(x-7,y-7,14,14,open?'#74b49a':'#ba9479');mgBox(r,x-7,y-7,14,14,open?MG_C.teal:MG_C.shut,1);if(open){r.rect(x-3,y-4,6,10,MG_C.paper);}else r.line(x-5,y,x+5,y,3,'#654b43');}
const MG_OUTCOME={moved:'MOVED',blocked:'WALL / STAYED',waited:'WAITED',closed_gate:'CLOSED GATE / STAYED',trap:'ENTERED TRAP'};
function mgGateCard(r,s){
  r.sprite('mg_card',808,282,256,398,0,'#fff');r.text('GATES / GLOBAL BEAT',696,97,15,MG_C.ink);r.text('ID P:R',696,125,11,MG_C.muted);mgCenter(r,'NOW',759,125,11,MG_C.ink);mgCenter(r,'NEXT',798,125,11,MG_C.ink);mgCenter(r,'FORECAST',867,125,11,MG_C.muted);mgCenter(r,String(s.beatNo),759,142,11,MG_C.ink);
  const preview=s.gateStates[0]?.preview||[];for(let j=0;j<6;j++)mgCenter(r,preview[j]?String(preview[j].beatNo):'-',798+j*23,142,11,MG_C.muted);
  s.gateStates.forEach((gate,i)=>{const y=168+i*28;r.text(gate.id.toUpperCase()+' '+gate.period+':'+gate.openResidues.join(','),696,y-6,13,MG_C.ink);mgGateSymbol(r,759,y,gate.openNow);for(let j=0;j<6;j++){const p=gate.preview[j];if(p)mgGateSymbol(r,798+j*23,y,j===0?gate.openNext:p.open);else mgCenter(r,'-',798+j*23,y-6,12,MG_C.muted);}});
  r.line(695,382,922,382,1,MG_C.line);mgGateSymbol(r,704,398,true);r.text('OPEN',717,392,11,MG_C.ink);mgGateSymbol(r,779,398,false);r.text('SHUT',792,392,11,MG_C.ink);r.text('P:R = PERIOD:OPEN RESIDUE',696,414,11,MG_C.muted);
  const last=mgLast(s.beatReceipts);r.text(last?'LAST BEAT #'+last.beatNo:'NO BEAT EXECUTED',696,437,13,MG_C.ink);r.text(last?MG_OUTCOME[last.outcome]:'EMPTY QUEUE ALSO WAITS',696,456,12,last&&(last.outcome==='closed_gate'||last.outcome==='trap')?MG_C.red:MG_C.muted);
}
function mgQueue(r,s){
  r.rect(24,486,912,30,'#edf0dc');r.text('QUEUE '+s.queue.length+'/'+s.physics.queueCapacity,34,494,14,MG_C.ink);
  for(let i=0;i<s.physics.queueCapacity;i++){const x=161+i*126,command=s.queue[i];r.rect(x,489,120,24,command?(i===0?'#c6ddd0':'#dce5d2'):'#e6ead8');if(i===0)mgBox(r,x,489,120,24,MG_C.teal,1);r.text(String(i+1),x+5,495,11,MG_C.muted);if(command){mgArrow(r,command.kind,x+30,501,MG_C.ink);r.text(command.kind.toUpperCase(),x+48,495,12,MG_C.ink);}else mgCenter(r,'-',x+65,495,13,MG_C.muted);}
}
function mgHeaderFooter(r,s){
  r.rect(0,0,960,47,'#eaf0df');r.text('METRONOME GATES',24,14,23,MG_C.ink);r.text('BEAT '+s.beatNo+'/'+s.beatBudget,326,17,19,MG_C.ink);r.text('MARK '+s.collectedCount+'/'+s.markerCount,545,19,16,MG_C.teal);mgRight(r,'LEFT '+s.beatsRemaining+' BEATS',936,17,19,s.beatsRemaining<=6?MG_C.red:MG_C.ink);
  r.rect(24,53,912,25,'#f1f2df');const running=s.phase==='playing';r.text(running?'NEXT #'+(s.beatNo+1)+' IN '+(s.ticksUntilBeat/s.physics.ticksPerSecond).toFixed(2)+' S':'BEAT CLOCK STOPPED',36,59,14,MG_C.ink);r.rect(277,62,167,6,'#b5c8b4');if(s.beatPhaseTicks>0)r.rect(277,62,167*s.beatPhaseTicks/s.physics.ticksPerBeat,6,MG_C.teal);r.text(s.exitUnlocked?'EXIT UNLOCKED':'EXIT LOCKED',473,59,14,s.exitUnlocked?MG_C.teal:MG_C.muted);
  const q=mgLast(s.queueReceipts);let hint=s.phase==='won'?'ALL MARKERS / EXIT REACHED':s.phase==='lost'?({closed_gate:'CLOSED GATE / POSITION RETAINED',trap:'TRAP / RUN ENDED',beat_budget:'BEAT BUDGET EXHAUSTED'})[s.lostReason]:s.inputState.quarantined?'RELEASE INPUT / CLOCK RUNS':q?(q.result==='full'?'QUEUE FULL / INPUT REJECTED':q.result==='empty'?'QUEUE EMPTY / NOTHING UNDONE':q.result==='undone'?'LAST EDIT: TAIL REMOVED':'LAST EDIT: '+q.requestedKind.toUpperCase()+' QUEUED'):'DIRECTIONS QUEUE / A WAIT / B UNDO';mgRight(r,hint,924,60,11,s.phase==='lost'||s.inputState.quarantined?MG_C.red:MG_C.muted);
  r.rect(0,522,960,18,'#335751');r.text('ONE STEP PER BEAT / CENTER BEFORE EACH DIRECTION / A: WAIT / B: UNDO TAIL / QUEUE IS NOT A TRAVELLED PATH',24,526,11,MG_C.paper);
}
function mgInstallBlueprint(){
  if(typeof document==='undefined'||document.getElementById('mg-blueprint'))return;const copy=document.getElementById('dialog-copy');if(!copy)return;copy.closest('.dialog').classList.add('mg-dialog');const style=document.createElement('style');style.id='mg-blueprint-style';
  style.textContent='.mg-dialog{width:min(660px,96%);padding:12px 22px}.mg-dialog h2{font-size:27px;margin:5px 0}.mg-dialog #dialog-copy{margin:5px 0;line-height:1.45}.mg-dialog .difficulty{margin:6px 0}.mg-dialog .primary{margin-top:6px}.mg-dialog .fine{margin-top:6px}.mg-dialog #mg-blueprint{margin:6px 0;padding:6px 8px;border:1px solid #b7d6bd55;border-radius:9px;background:#ceddcc16;text-align:left}.mg-dialog #mg-blueprint[hidden]{display:none}.mg-dialog .mg-blueprint-body{display:grid;grid-template-columns:158px minmax(0,1fr);gap:9px;align-items:center}.mg-dialog .mg-blueprint-map{display:block;width:156px;height:132px}.mg-dialog .mg-blueprint-gates{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 8px}.mg-dialog .mg-blueprint-gate{font-size:11px;line-height:1.45;white-space:nowrap;color:#e6e8d0}.mg-dialog #mg-blueprint-facts,.mg-dialog #mg-blueprint-rule,.mg-dialog #mg-blueprint-danger,.mg-dialog #mg-blueprint-legend{font-size:11px;line-height:1.45}.mg-dialog #mg-blueprint-legend{margin-top:5px;color:#c4d9cc}.mg-dialog #mg-blueprint-facts{color:#b7e0cd;margin-bottom:3px}.mg-dialog #mg-blueprint-danger{color:#dfc6a8}@media(max-height:620px){.mg-dialog{padding:7px 16px}.mg-dialog .brand{font-size:10px}.mg-dialog h2{font-size:22px;line-height:1.1;margin:4px 0}.mg-dialog #dialog-copy{font-size:11px;line-height:1.4;margin:4px 0}.mg-dialog .difficulty{margin:4px 0}.mg-dialog .primary{padding:8px 16px;margin-top:4px}.mg-dialog .fine{font-size:10px;margin-top:4px}.mg-dialog #mg-blueprint{margin:4px 0;padding:4px 7px}.mg-dialog .mg-blueprint-body{grid-template-columns:119px minmax(0,1fr);gap:7px}.mg-dialog .mg-blueprint-map{width:117px;height:99px}.mg-dialog .mg-blueprint-gates{gap:3px 5px}.mg-dialog .mg-blueprint-gate{font-size:10px;line-height:1.4}.mg-dialog #mg-blueprint-facts,.mg-dialog #mg-blueprint-rule,.mg-dialog #mg-blueprint-danger,.mg-dialog #mg-blueprint-legend{font-size:10px;line-height:1.4}.mg-dialog #mg-blueprint-legend{margin-top:4px}}';document.head.appendChild(style);
  const box=document.createElement('div');box.id='mg-blueprint';box.setAttribute('aria-label','本关完整地图与闸门规则');const facts=document.createElement('div');facts.id='mg-blueprint-facts';box.appendChild(facts);const body=document.createElement('div');body.className='mg-blueprint-body';const map=document.createElementNS('http://www.w3.org/2000/svg','svg');map.classList.add('mg-blueprint-map');map.setAttribute('role','img');map.setAttribute('aria-label','公开地图，S为起点，E为出口，M为标记，X为陷阱，字母为门');body.appendChild(map);const notes=document.createElement('div'),gates=document.createElement('div');gates.className='mg-blueprint-gates';notes.appendChild(gates);const legend=document.createElement('div');legend.id='mg-blueprint-legend';legend.textContent='S起点 · E出口 · M标记 · X陷阱';notes.appendChild(legend);body.appendChild(notes);box.appendChild(body);for(const id of ['rule','danger']){const e=document.createElement('div');e.id='mg-blueprint-'+id;box.appendChild(e);}copy.insertAdjacentElement('afterend',box);
}
function mgSyncBlueprint(s){
  mgInstallBlueprint();if(typeof document==='undefined')return;const box=document.getElementById('mg-blueprint');if(!box)return;box.hidden=s.phase!=='playing';if(box.dataset.scenarioId===s.scenarioId)return;box.dataset.scenarioId=s.scenarioId;const map=box.querySelector('.mg-blueprint-map'),sc=s.scenario;map.replaceChildren();map.setAttribute('viewBox','0 0 '+sc.cols*10+' '+sc.rows*10);
  for(let y=0;y<sc.rows;y++)for(let x=0;x<sc.cols;x++){const cell=sc.grid[y][x],rect=document.createElementNS('http://www.w3.org/2000/svg','rect');rect.setAttribute('x',String(x*10));rect.setAttribute('y',String(y*10));rect.setAttribute('width','10');rect.setAttribute('height','10');rect.setAttribute('fill',cell==='#'?'#4e6b61':cell==='X'?'#9b5c4c':'#dee6d1');map.appendChild(rect);if(cell!=='.'&&cell!=='#'){const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',String(x*10+5));t.setAttribute('y',String(y*10+8));t.setAttribute('font-size','8');t.setAttribute('font-family','sans-serif');t.setAttribute('text-anchor','middle');t.setAttribute('fill',cell==='X'?'#fff0ce':'#214e51');t.textContent=cell.toUpperCase();map.appendChild(t);}}
  const gates=box.querySelector('.mg-blueprint-gates');gates.replaceChildren();sc.gates.forEach(gate=>{const e=document.createElement('div');e.className='mg-blueprint-gate';e.dataset.gateId=gate.id;e.textContent=gate.id.toUpperCase()+' · '+gate.period+'拍 · 余'+gate.openResidues.join('/')+'开';gates.appendChild(e);});
  document.getElementById('mg-blueprint-facts').textContent='标记'+s.markerCount+'枚 · 预算'+s.beatBudget+'拍 · 每拍'+s.physics.ticksPerBeat/s.physics.ticksPerSecond+'秒 · 队列'+s.physics.queueCapacity+'项';document.getElementById('mg-blueprint-rule').textContent='方向回中再拨 · A排等待 · B撤队尾 · 空队也耗拍';document.getElementById('mg-blueprint-danger').textContent='闭门入格或陷阱失败；站门不夹伤，收齐标记再进出口。';
}
window.GameDef={id:'metronome-gates',title:'节拍闸道',subtitle:'METRONOME GATES',seed:737,holdConfirmAsA:true,atlas:MG_ATLAS,background:'#b7ccc0',
  description:'方向先排队，球每拍一步。看下一拍闸门，收齐标记再进出口；A等待，B撤队尾。',controls:{move:'方向入队 · 回中再拨',a:'等待 A（上区）/ 空格',b:'撤尾 B（下区）'},actionLabels:['等待 A（上区）','撤尾 B（下区）'],levelLabel:'庭院',levelNames:['双桥庭院','三岔采样','交错闸室'],tagline:'门随同一拍号开闭，先排队再前进',tip:'空队也耗一拍。闭门只检查进入，站门可等待。取消操作不会暂停节拍，暂停请用 P / START。',winTitle:'闸道通行完成',loseTitle:'闸道行程结束',
  result(s){return s.phase==='won'?'收齐'+s.markerCount+'枚标记，已到出口。':s.lostReason==='closed_gate'?'目标门在执行拍关闭，球仍留在原格。':s.lostReason==='trap'?'球进入陷阱格，行程结束。':'节拍预算耗尽，目标尚未完成。';},
  hud(s){mgSyncBlueprint(s);return[{label:'已用 / 总拍数',value:s.beatNo+' / '+s.beatBudget,tone:s.beatsRemaining<=6?'warn':''},{label:'标记 / 总数',value:s.collectedCount+' / '+s.markerCount,tone:s.exitUnlocked?'good':''},{label:'待执行队列',value:s.queue.length+' / '+s.physics.queueCapacity,tone:''},{label:'下一拍',value:s.phase==='playing'?(s.ticksUntilBeat/s.physics.ticksPerSecond).toFixed(2)+' 秒':'已停止',tone:''}];},
  render(r,s){r.sprite('mg_background',480,270,960,540,0,'#fff');mgMap(r,s);mgGateCard(r,s);mgQueue(r,s);mgHeaderFooter(r,s);}
};
