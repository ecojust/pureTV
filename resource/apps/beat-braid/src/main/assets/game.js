/* Original satin-ribbon loom. Public active time positions the pattern; only receipts weave the finished braid. */
const BB_C={ink:'#293f43',muted:'#647671',paper:'#fff9e8',linen:'#eae0c8',teal:'#237e89',tealLight:'#b8e0db',coral:'#bb5849',coralLight:'#f1c4ae',gold:'#ac844a',line:'#b6b6a1',red:'#a23f3f'};
function bbGradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);for(const [p,color]of stops)g.addColorStop(p,color);return g;}
function bbPath(c,points,fill,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function bbStroke(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function bbEllipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
function bbScrew(c,x,y){bbEllipse(c,x,y,3,3,'#8b8066');bbEllipse(c,x-.4,y-.5,2.3,2.3,'#ead8ad');bbStroke(c,[[x-1.4,y-.8],[x+1.2,y+.5]],'#7a755f',.9);}
function bbBackground(c,w,h){
  c.save();c.scale(w/512,h/384);c.fillStyle=bbGradient(c,0,0,512,384,[[0,'#f3eedb'],[.55,'#e5dec8'],[1,'#c6cbb9']]);c.fillRect(0,0,512,384);
  for(let y=4;y<384;y+=6)bbStroke(c,[[0,y],[512,y+2]],'#ffffff20',.6);for(let x=3;x<512;x+=7)bbStroke(c,[[x,0],[x+1,384]],'#8179660b',.7);
  bbPath(c,[[4,62],[351,58],[355,310],[7,315]],'#b5b3a328');bbPath(c,[[9,59],[349,55],[352,306],[11,311]],bbGradient(c,0,60,350,300,[[0,'#ead8b2'],[.5,'#dbc7a1'],[1,'#c4b58e']]),'#f7ebcf',1);
  for(let i=0;i<13;i++){const y=68+i*18;bbStroke(c,[[17,y],[105,y-2],[238,y+1],[343,y-1]],'#92795319',.8);}bbStroke(c,[[15,306],[345,301]],'#96805d55',1);c.restore();
}
function bbRail(c,w,h){
  c.save();c.scale(w/192,h/256);bbPath(c,[[26,8],[166,8],[180,22],[180,238],[168,249],[24,249],[12,238],[12,22]],'#706d5b30');
  bbPath(c,[[26,3],[166,3],[176,16],[176,232],[165,243],[27,243],[16,232],[16,16]],bbGradient(c,16,0,176,240,[[0,'#fffdf0'],[.4,'#ece8d5'],[1,'#bec5b5']]),'#fff8e4',1.5);
  c.fillStyle=bbGradient(c,42,0,150,0,[[0,'#bac8bb'],[.2,'#dae1ce'],[.5,'#e9ebd8'],[.8,'#d0dac9'],[1,'#a7b8aa']]);c.fillRect(42,18,108,203);
  for(const x of [33,155]){c.fillStyle='#a29473';c.fillRect(x,20,4,198);bbStroke(c,[[x+1,20],[x+1,217]],'#f4e4b8',1);for(let y=27;y<218;y+=12)bbStroke(c,[[x-4,y],[x+6,y]],'#8a8b7755',.6);}
  for(const x of [26,166])for(const y of [14,232])bbScrew(c,x,y);bbPath(c,[[37,224],[155,224],[162,235],[30,235]],'#d6c19a','#a79165',1);bbStroke(c,[[44,228],[148,228]],'#fff0ca',1);c.restore();
}
function bbRibbonPainter(left){return function(c,w,h){
  c.save();c.scale(w/64,h/192);const dark=left?'#1f6673':'#9d493f',mid=left?'#499eaa':'#d78368',light=left?'#c0e5de':'#ffd0ad';c.fillStyle=bbGradient(c,0,0,64,0,[[0,dark],[.16,mid],[.38,light],[.52,mid],[.8,dark],[1,mid]]);c.fillRect(0,0,64,192);
  for(let y=2;y<192;y+=4)bbStroke(c,[[3,y],[61,y+.6]],'#fff8e31c',.8);for(const x of [6,58])for(let y=3;y<192;y+=10)bbStroke(c,[[x,y],[x,y+4]],'#fff8e78f',1);
  if(!left)for(let y=10;y<192;y+=24)bbStroke(c,[[17,y],[22,y+5],[17,y+10]],'#ffe4b455',1);c.restore();
};}
function bbNeedle(c,w,h){
  c.save();c.scale(w/128,h/128);bbEllipse(c,65,107,49,9,'#344e4930');bbPath(c,[[20,27],[108,27],[117,39],[111,107],[17,107],[11,39]],bbGradient(c,0,25,128,108,[[0,'#d4c29c'],[.3,'#fff7dd'],[.7,'#c8c8b5'],[1,'#8a9a8c']]),'#8d927c',1.3);
  bbPath(c,[[32,35],[96,35],[102,42],[96,90],[32,90],[26,42]],'#607c78','#fff4d8',1);bbPath(c,[[42,42],[86,42],[90,47],[84,79],[44,79],[38,47]],bbGradient(c,38,40,90,80,[[0,'#2b4b52'],[1,'#819e91']]));
  bbPath(c,[[60,8],[68,8],[72,49],[64,66],[56,49]],bbGradient(c,55,0,72,0,[[0,'#4d6670'],[.5,'#fffdf0'],[1,'#8a9e9d']]),'#647d80',1);bbEllipse(c,64,27,2,9,'#536c6e');for(const x of [23,105])bbScrew(c,x,98);c.restore();
}
function bbSpool(c,w,h){
  c.save();c.scale(w/128,h/128);bbEllipse(c,65,108,43,10,'#58625222');bbPath(c,[[30,29],[98,29],[98,95],[30,95]],bbGradient(c,20,0,108,0,[[0,'#8d7650'],[.25,'#dfc995'],[.55,'#f6e3ac'],[1,'#a18757']]));
  for(let y=32;y<95;y+=3)bbStroke(c,[[31,y],[97,y]],'#8d764435',1);bbEllipse(c,64,30,44,15,'#ab9266');bbEllipse(c,64,26,44,14,bbGradient(c,20,12,110,40,[[0,'#fff0c4'],[1,'#b99f6a']]));bbEllipse(c,64,26,10,5,'#736953');bbEllipse(c,64,95,45,13,'#ad956c');bbStroke(c,[[27,99],[101,99]],'#e8d3a0',1);c.restore();
}
function bbTapPainter(result){return function(c,w,h){
  c.save();c.scale(w/64,h/64);bbPath(c,[[32,3],[60,31],[32,61],[4,31]],'#273f4825');bbPath(c,[[32,1],[59,28],[32,56],[5,28]],result==='hit'?'#2d8588':result==='missed'?'#a4594b':'#fff8df','#74867b',1);
  bbPath(c,[[32,7],[51,28],[32,49],[13,28]],null,result==='pending'?'#bd9060':'#efd9b4',1);if(result==='hit'){bbStroke(c,[[20,29],[29,37],[44,20]],'#fff6dc',4);}
  else if(result==='missed'){bbStroke(c,[[22,18],[30,27],[25,34]],'#ffe5d2',3);bbStroke(c,[[42,38],[34,31],[39,24]],'#ffe5d2',3);}else{bbEllipse(c,32,28,6,8,'#647970');bbEllipse(c,32,27,3,5,'#d1d3b6');}c.restore();
};}
function bbBraidPainter(over){return function(c,w,h){
  c.save();c.scale(w/128,h/128);bbEllipse(c,64,108,54,8,'#53625422');const left=[[13,15],[36,9],[115,99],[92,117]],right=[[92,9],[115,15],[36,117],[13,99]];
  const paint=(p,teal)=>{bbPath(c,p,bbGradient(c,12,10,115,115,teal?[[0,'#7bbfb9'],[.5,'#267f8a'],[.7,'#a0d4ca'],[1,'#326f78']]:[[0,'#efb58e'],[.5,'#c06c54'],[.7,'#f5c39b'],[1,'#a94c43']]),'#fff3d8',1);};
  if(over==='left'){paint(right,false);paint(left,true);}else{paint(left,true);paint(right,false);}bbStroke(c,over==='left'?[[25,16],[104,104]]:[[104,16],[25,104]],'#f9eed380',1.5);c.restore();
};}
function bbFrayed(c,w,h){
  c.save();c.scale(w/128,h/128);bbPath(c,[[13,10],[39,10],[54,49],[44,55],[30,44]],'#438e94');bbPath(c,[[89,10],[115,10],[98,46],[85,57],[74,48]],'#cb8064');bbPath(c,[[30,84],[46,74],[55,80],[39,118],[13,118]],'#6da9a4');bbPath(c,[[73,83],[83,73],[98,83],[115,118],[89,118]],'#b96b59');
  for(let i=0;i<4;i++){bbStroke(c,[[39+i*4,49],[35+i*6,64]],'#296875',1.2);bbStroke(c,[[77+i*5,49],[75+i*4,65]],'#9e4f43',1.2);}bbStroke(c,[[20,68],[108,68]],'#a44f4670',1);c.restore();
}
function bbCard(c,w,h){
  c.save();c.scale(w/256,h/256);bbPath(c,[[10,5],[246,5],[251,10],[251,246],[246,251],[10,251],[5,246],[5,10]],'#737b6420');bbPath(c,[[8,2],[244,2],[248,6],[248,243],[244,248],[8,248],[3,243],[3,6]],bbGradient(c,0,0,256,256,[[0,'#fff9e8'],[1,'#ebe7d3']]),'#fffef2',1);
  for(let y=11;y<244;y+=7)bbStroke(c,[[10,y],[241,y]],'#aa9d7a0d',.6);bbStroke(c,[[10,11],[241,11]],'#c1ad80',1);bbStroke(c,[[10,239],[241,239]],'#b5b79d',1);c.restore();
}
const BB_ATLAS={builtins:[],tiles:[
  {name:'bb_background',x:0,y:0,w:512,h:384,paint:bbBackground},{name:'bb_rail',x:512,y:0,w:192,h:256,paint:bbRail},
  {name:'bb_needle',x:704,y:0,w:128,h:128,paint:bbNeedle},{name:'bb_spool',x:832,y:0,w:128,h:128,paint:bbSpool},
  {name:'bb_tap_pending',x:960,y:0,w:64,h:64,paint:bbTapPainter('pending')},{name:'bb_tap_hit',x:960,y:64,w:64,h:64,paint:bbTapPainter('hit')},{name:'bb_tap_missed',x:960,y:128,w:64,h:64,paint:bbTapPainter('missed')},
  {name:'bb_ribbon_left',x:512,y:256,w:64,h:192,paint:bbRibbonPainter(true)},{name:'bb_ribbon_right',x:576,y:256,w:64,h:192,paint:bbRibbonPainter(false)},
  {name:'bb_braid_left',x:0,y:768,w:128,h:128,paint:bbBraidPainter('left')},{name:'bb_braid_right',x:128,y:768,w:128,h:128,paint:bbBraidPainter('right')},{name:'bb_frayed',x:256,y:768,w:128,h:128,paint:bbFrayed},{name:'bb_card',x:384,y:768,w:256,h:256,paint:bbCard}
]};
function bbCenter(r,text,x,y,size,color){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
function bbRight(r,text,x,y,size,color){r.text(text,x-r.measureText(text,size),y,size,color);}
function bbBox(r,x,y,w,h,color,width=1){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function bbLaneColor(lane){return lane==='left'?BB_C.teal:BB_C.coral;}
function bbLaneKey(lane){return lane==='left'?'A':'B';}
function bbDisplaySegment(s){if(s.phase!=='playing'&&s.segmentReceipts.length){const last=s.segmentReceipts[s.segmentReceipts.length-1];return{config:s.scenario.segments[last.index],state:s.segmentStates[last.index]};}return s.currentSegment;}
function bbTimelineY(s,activeTick){return 314-(activeTick-s.activeTick)*.68;}
function bbLoom(r,s,current){
  const top=142,bottom=345;for(const [lane,x]of [['left',210],['right',470]]){
    const color=bbLaneColor(lane),hold=current&&current.config.holdLane===lane,held=s.effectiveHeld[lane];r.sprite('bb_rail',x,267,220,282,0,'#fff');
    bbCenter(r,bbLaneKey(lane)+' / '+lane.toUpperCase(),x,94,21,color);bbCenter(r,hold?'HOLD THREAD':'TAP THREAD',x,119,15,BB_C.ink);
    for(let y=top+3;y<bottom;y+=15)r.line(x,y,x,y+5,1,'#7b8e7c45');
    if(current&&hold){const a=Math.max(top,bbTimelineY(s,current.config.holdEndActiveTick)),b=Math.min(bottom,bbTimelineY(s,current.config.holdStartActiveTick));if(b>a){r.sprite('bb_ribbon_'+lane,x,(a+b)/2,49,b-a,0,held?'#fff':'#ffffffa6');r.line(x-29,a,x+29,a,2,color);r.line(x-29,b,x+29,b,2,color);}}
    if(current&&!hold)current.config.pulses.forEach((pulse,i)=>{const state=current.state.taps[i],a=Math.max(top,bbTimelineY(s,pulse.closeActiveTick)),b=Math.min(bottom,bbTimelineY(s,pulse.openActiveTick)),y=bbTimelineY(s,pulse.dueActiveTick);if(b>a){r.rect(x-47,a,94,b-a,lane==='left'?'#317d8a18':'#b85b4b18');r.line(x-47,a,x-47,b,2,color);r.line(x+47,a,x+47,b,2,color);}if(y>=top+20&&y<=bottom-20){r.sprite('bb_tap_'+state.status,x,y,44,44,0,'#fff');r.text(String(i+1),x+32,y-7,14,color);}});
    r.sprite('bb_needle',x,377+(held?3:0),96,66,0,'#fff');r.circle(x-66,380,6,held?color:'#b1b9a5');bbCenter(r,held?'HELD':'RELEASED',x,405,12,held?color:BB_C.muted);
  }
  r.line(117,314,303,314,2,BB_C.gold);r.line(377,314,563,314,2,BB_C.gold);bbCenter(r,'NOW',340,307,13,BB_C.ink);
  r.sprite('bb_spool',72,157,64,64,0,'#fff');r.sprite('bb_spool',608,157,64,64,0,'#fff');r.line(73,189,73,337,2,'#af9165');r.line(607,189,607,337,2,'#af9165');
  bbCenter(r,'PUBLIC PATTERN',340,168,12,BB_C.muted);bbCenter(r,'WINDOW',340,269,11,BB_C.muted);bbCenter(r,'NOT YET WOVEN',340,187,11,BB_C.muted);
}
function bbSegmentCard(r,s,current){
  r.sprite('bb_card',808,248,256,338,0,'#fff');r.text('SEGMENT '+(current?current.config.index+1:s.segmentCount)+' / '+s.segmentCount,696,92,17,BB_C.ink);
  const st=current?.state,word=!st?'COMPLETE':st.status==='woven'?'WOVEN':st.status==='frayed'?'BROKEN SEGMENT':st.faulted?'SEGMENT DAMAGED':st.status==='pending'?'PENDING SEGMENT':'NO DAMAGE YET';r.text(word,696,120,18,st?.faulted?BB_C.red:BB_C.teal);
  for(let i=0;i<3;i++){const x=724+i*83,status=st?st.taps[i].status:'pending';bbCenter(r,'TAP '+(i+1),x,151,12,BB_C.muted);r.sprite('bb_tap_'+status,x,184,35,35,0,'#fff');bbCenter(r,status.toUpperCase(),x,209,12,status==='hit'?BB_C.teal:status==='missed'?BB_C.red:BB_C.muted);}
  r.line(695,233,920,233,1,BB_C.line);r.text('CHECKED '+(st?st.holdCheckedTicks:0)+' / '+(s.physics.holdEndLocalTick-s.physics.holdStartLocalTick+1),696,246,15,BB_C.ink);r.text('MISSING '+(st?st.holdMissingTicks:0)+' HOLD TICKS',696,270,14,st?.holdMissingTicks?BB_C.red:BB_C.muted);
  r.text('CURRENT RUN',696,306,12,BB_C.muted);r.text('BEST / NEED',815,306,12,BB_C.muted);r.text(String(s.currentStreak),696,324,25,BB_C.ink);r.text(s.longestStreak+' / '+s.requiredStreak,815,324,25,s.longestStreak>=s.requiredStreak?BB_C.teal:BB_C.ink);
  r.line(695,359,920,359,1,BB_C.line);r.text('BREAKS',696,375,16,BB_C.ink);bbRight(r,s.breaks+' / '+s.maxBreaks,920,370,25,s.breaks>0?BB_C.red:BB_C.ink);
}
function bbFinishedBraid(r,s){
  r.rect(23,431,914,76,'#f5efddbe');r.text('COMMITTED BRAID',34,435,12,BB_C.muted);bbRight(r,'WOVEN '+s.wovenSegments+' / DONE '+s.completedSegments,925,435,12,BB_C.ink);
  const width=880/s.segmentCount;s.scenario.segments.forEach((config,i)=>{const x=40+(i+.5)*width,receipt=s.segmentReceipts[i];if(receipt){r.sprite(receipt.result==='woven'?(receipt.actualCrossing==='left-over-right'?'bb_braid_left':'bb_braid_right'):'bb_frayed',x,474,Math.min(62,width-12),38,0,'#fff');}else{r.line(x-21,473,x+21,473,1,'#b9bba6');r.circle(x,473,2,'#b9bba6');}bbCenter(r,String(i+1),x,493,11,receipt?.result==='frayed'?BB_C.red:BB_C.muted);});
}
function bbStatus(r,s,current){
  r.rect(0,0,960,47,'#f8f3e3');r.text('BEAT BRAID',24,13,25,BB_C.ink);r.text('WOVEN '+s.wovenSegments+'/'+s.segmentCount,266,18,17,BB_C.teal);bbRight(r,'ACTIVE '+s.activeElapsed.toFixed(2)+' / '+(s.deadlineActiveTick/s.physics.ticksPerSecond)+' S',936,17,18,BB_C.ink);
  let status,tone=BB_C.teal;if(s.phase==='won')status='BRAID COMPLETE / CONTINUITY MET';else if(s.phase==='lost'){status=s.lostReason==='broken_threads'?'BROKEN THREADS / BREAK LIMIT EXCEEDED':'SONG COMPLETE / CONTINUITY NOT MET';tone=BB_C.red;}
  else if(s.clockMode==='quarantine'){status='RELEASE BOTH / RHYTHM FROZEN';tone=BB_C.red;}else if(s.clockMode==='preparing'){status='READY '+(s.inputState.recoveryRemainingTicks/s.physics.ticksPerSecond).toFixed(2)+' S / RE-HOLD '+bbLaneKey(current.config.holdLane)+' / RHYTHM FROZEN';tone=BB_C.gold;}
  else{const local=s.localTick;status=local<s.physics.holdStartLocalTick?'PREPARE / HOLD '+bbLaneKey(current.config.holdLane)+' NEXT':local>s.physics.holdEndLocalTick?'REST / WAIT FOR SEGMENT END':'HOLD '+bbLaneKey(current.config.holdLane)+' + TAP '+bbLaneKey(current.config.tapLane);}
  r.rect(24,53,912,26,'#fff9e6');r.rect(24,53,4,26,tone);r.text(status,36,59,15,tone);
  r.rect(0,516,960,24,'#304c50');const footer=s.phase==='playing'?'A = LEFT / B = RIGHT  |  PHONE: A TOP / B BOTTOM  |  RELEASE BEFORE EACH TAP':s.phase==='won'?'ALL SEGMENTS FINISHED / LONGEST RUN '+s.longestStreak+' / REQUIRED '+s.requiredStreak:'FINAL INPUT AND BRAID STATE RETAINED / RETRY FROM THE MENU';r.text(footer,24,522,12,BB_C.paper);
}
function bbInstallBlueprint(){
  if(typeof document==='undefined'||document.getElementById('bb-blueprint'))return;const copy=document.getElementById('dialog-copy');if(!copy)return;copy.closest('.dialog').classList.add('bb-dialog');
  const style=document.createElement('style');style.id='bb-blueprint-style';style.textContent='.bb-dialog{width:min(660px,96%);padding:12px 24px}.bb-dialog h2{font-size:27px;margin:6px 0}.bb-dialog #dialog-copy{margin:6px 0;line-height:1.5}.bb-dialog .difficulty{margin:7px 0}.bb-dialog .primary{margin-top:7px}.bb-dialog .fine{margin-top:7px}.bb-dialog #bb-blueprint{margin:6px 0;padding:7px 9px;border:1px solid #c5cfaf55;border-radius:9px;background:#d4dbc91c;text-align:left}.bb-dialog #bb-blueprint[hidden]{display:none}.bb-dialog .bb-blueprint-segments{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:3px;margin-bottom:6px}.bb-dialog .bb-blueprint-segment{background:#dce9cd13;border-radius:4px;padding:3px 1px;text-align:center}.bb-dialog .bb-blueprint-number{font-size:10px;line-height:1.4;color:#ced9cc;margin-bottom:2px}.bb-dialog .bb-blueprint-role{font-size:10px;line-height:1.5;white-space:nowrap;color:#eae9cc}.bb-dialog #bb-blueprint-timing,.bb-dialog #bb-blueprint-rule,.bb-dialog #bb-blueprint-controls,.bb-dialog #bb-blueprint-recovery{font-size:11px;line-height:1.5}.bb-dialog #bb-blueprint-recovery{color:#a9dcd6}@media(max-height:620px){.bb-dialog{padding:8px 16px}.bb-dialog .brand{font-size:10px}.bb-dialog h2{font-size:22px;line-height:1.1;margin:4px 0}.bb-dialog #dialog-copy{font-size:11px;line-height:1.4;margin:4px 0}.bb-dialog .difficulty{margin:5px 0}.bb-dialog .primary{padding:8px 16px;margin-top:5px}.bb-dialog .fine{font-size:10px;margin-top:5px}.bb-dialog #bb-blueprint{margin:5px 0;padding:5px 7px}.bb-dialog .bb-blueprint-segments{margin-bottom:4px;gap:2px}.bb-dialog .bb-blueprint-segment{padding:2px 0}.bb-dialog .bb-blueprint-number{font-size:9px}.bb-dialog .bb-blueprint-role{font-size:9px}.bb-dialog #bb-blueprint-timing,.bb-dialog #bb-blueprint-rule,.bb-dialog #bb-blueprint-controls,.bb-dialog #bb-blueprint-recovery{font-size:10px;line-height:1.45}}';document.head.appendChild(style);
  const box=document.createElement('div');box.id='bb-blueprint';box.setAttribute('aria-label','本关完整双轨编带谱');const row=document.createElement('div');row.className='bb-blueprint-segments';box.appendChild(row);for(const id of ['timing','rule','controls','recovery']){const e=document.createElement('div');e.id='bb-blueprint-'+id;box.appendChild(e);}copy.insertAdjacentElement('afterend',box);
}
function bbSyncBlueprint(s){
  bbInstallBlueprint();if(typeof document==='undefined')return;const box=document.getElementById('bb-blueprint');if(!box)return;box.hidden=s.phase!=='playing';if(box.dataset.scenarioId===s.scenarioId)return;box.dataset.scenarioId=s.scenarioId;const row=box.querySelector('.bb-blueprint-segments');row.replaceChildren();
  s.scenario.segments.forEach((seg,i)=>{const e=document.createElement('div');e.className='bb-blueprint-segment';e.dataset.segmentIndex=String(i);e.dataset.holdLane=seg.holdLane;const n=document.createElement('div');n.className='bb-blueprint-number';n.textContent=String(i+1);const role=document.createElement('div');role.className='bb-blueprint-role';role.textContent='按'+bbLaneKey(seg.holdLane)+'·拍'+bbLaneKey(seg.tapLane);e.append(n,role);row.appendChild(e);});
  const p=s.physics,hz=p.ticksPerSecond;document.getElementById('bb-blueprint-timing').textContent='每段'+p.segmentTicks/hz+'秒 · 保持'+(p.holdStartLocalTick/hz).toFixed(2)+'–'+(p.holdEndLocalTick/hz).toFixed(2)+'秒 · 点拍'+p.tapCentersLocalTick.map(t=>t/hz).join(' / ')+'秒 ±'+p.tapHalfWindowTicks/hz+'秒';
  document.getElementById('bb-blueprint-rule').textContent='最长连续≥'+s.requiredStreak+'段 · 断段≤'+s.maxBreaks+' · 完整织完'+s.segmentCount+'段';document.getElementById('bb-blueprint-controls').textContent='手机上A=左线、下B=右线；点拍先松开，再按下。';document.getElementById('bb-blueprint-recovery').textContent='恢复：松开两侧 → '+p.recoveryTicks/hz+'秒准备 → 续原拍点';
}
window.GameDef={id:'beat-braid',title:'双线节律',subtitle:'BEAT BRAID',seed:736,holdConfirmAsA:true,atlas:BB_ATLAS,background:'#e6dfca',
  description:'按住指定经线，另一侧逐次点拍。按谱换边，织完整曲并达到最长连续段要求。',controls:{move:'两键独立 · 无方向操作',a:'左线 A · 手机上区 / 空格',b:'右线 B · 手机下区'},actionLabels:['左线 A（上区）','右线 B（下区）'],levelLabel:'编带谱',levelNames:['双线入门','双结回环','交错长辫'],tagline:'一侧保持，一侧点拍，两线交织',tip:'点拍须先松再按；保持断过不能补回。恢复时松开两侧，准备倒数内重新按住经线。',winTitle:'双线编带完成',loseTitle:'编带停止',
  result(s){return s.phase==='won'?'完整织完'+s.segmentCount+'段，最长连续'+s.longestStreak+'段。':s.lostReason==='broken_threads'?'已断'+s.breaks+'段，超过上限'+s.maxBreaks+'段。':'整曲结束，最长连续'+s.longestStreak+'段，要求'+s.requiredStreak+'段。';},
  hud(s){bbSyncBlueprint(s);return[{label:'已织 / 已结算',value:s.wovenSegments+' / '+s.completedSegments,tone:''},{label:'最长连续 / 要求',value:s.longestStreak+' / '+s.requiredStreak,tone:s.longestStreak>=s.requiredStreak?'good':''},{label:'断段 / 上限',value:s.breaks+' / '+s.maxBreaks,tone:s.breaks?'warn':''},{label:'节奏进度',value:s.activeElapsed.toFixed(1)+' / '+s.deadlineActiveTick/s.physics.ticksPerSecond+' 秒',tone:''}];},
  render(r,s){const current=bbDisplaySegment(s);r.sprite('bb_background',480,270,960,540,0,'#fff');bbLoom(r,s,current);bbSegmentCard(r,s,current);bbFinishedBraid(r,s);bbStatus(r,s,current);}
};
