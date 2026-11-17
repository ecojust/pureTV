/* Original night-strait bridge. Read-only actual endpoint and graph-progress display; no contact simulation. */
function rbGradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);for(const [at,color]of stops)g.addColorStop(at,color);return g;}
function rbPath(c,points,fill,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function rbLine(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function rbEllipse(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
function rbSky(c,w,h){
  c.save();c.scale(w/640,h/256);c.fillStyle=rbGradient(c,0,0,0,256,[[0,'#101c35'],[.6,'#263d53'],[1,'#2b4a5a']]);c.fillRect(0,0,640,256);
  const haze=c.createRadialGradient(480,61,0,480,61,102);haze.addColorStop(0,'rgba(160,203,209,.12)');haze.addColorStop(1,'rgba(160,203,209,0)');c.fillStyle=haze;c.fillRect(360,0,260,180);
  for(const [x,y,r]of [[33,18,.8],[147,32,.7],[216,14,.8],[302,36,.6],[366,20,.7],[556,24,.9],[602,47,.6]])rbEllipse(c,x,y,r,r,'#8293ad');
  rbPath(c,[[0,156],[42,113],[76,126],[117,83],[164,120],[213,111],[260,158],[318,155],[345,181],[0,210]],'#27394c');
  rbPath(c,[[0,167],[42,113],[42,161],[76,126],[92,173],[117,83],[131,172],[164,120],[188,178],[0,214]],'#334b5c');
  rbPath(c,[[393,171],[439,134],[472,145],[515,94],[549,128],[578,119],[640,153],[640,220]],'#23394c');
  rbPath(c,[[439,134],[454,179],[472,145],[490,190],[515,94],[525,186],[549,128],[578,119],[598,185]],'#304958');
  c.fillStyle=rbGradient(c,0,185,0,256,[[0,'#355464'],[1,'#192e43']]);c.fillRect(0,185,640,71);rbLine(c,[[0,186],[640,186]],'#607786',.6);
  for(let i=0;i<34;i++){const x=(i*83+19)%640,y=192+(i*13)%63;rbLine(c,[[x,y],[x+12+(i%5)*8,y]],i%3?'rgba(132,170,180,.12)':'rgba(146,185,190,.22)',.6);}
  for(const [x,y,rx]of [[90,176,150],[310,188,190],[540,171,165]]){const fog=c.createRadialGradient(x,y,0,x,y,rx);fog.addColorStop(0,'rgba(137,160,175,.09)');fog.addColorStop(1,'rgba(137,160,175,0)');c.save();c.translate(0,y*.8);c.scale(1,.2);c.fillStyle=fog;c.fillRect(0,0,640,256);c.restore();}
  c.restore();
}
function rbPlate(c,w,h){
  c.save();c.scale(w/256,h/128);
  rbEllipse(c,128,112,113,9,'rgba(3,12,23,.25)');
  rbPath(c,[[0,24],[256,24],[246,80],[222,104],[34,104],[10,80]],rbGradient(c,0,24,0,108,[[0,'#798d9a'],[.35,'#3d5364'],[1,'#1b2c3e']]),'#0e2034',2);
  rbPath(c,[[0,24],[16,8],[240,8],[256,24]],rbGradient(c,0,8,0,24,[[0,'#c1ced0'],[1,'#7596a3']]));
  rbLine(c,[[0,24],[256,24]],'#d3e3df',3);rbLine(c,[[12,31],[244,31]],'#5b8691',2);
  c.fillStyle='#253c4f';c.fillRect(21,43,214,29);c.fillStyle='#557580';c.fillRect(25,44,206,3);
  for(let x=30;x<232;x+=22){rbLine(c,[[x,50],[x+12,50],[x+12,64],[x,64]],'#96acaf',1.3);rbLine(c,[[x+3,53],[x+9,53]],'#405e6b',2);}
  rbPath(c,[[35,79],[61,79],[83,99],[57,99]],'#56707e');rbPath(c,[[104,79],[128,99],[151,79]],'#617b87');rbPath(c,[[173,99],[195,79],[222,79],[199,99]],'#56707e');
  rbLine(c,[[38,80],[58,99],[198,99],[220,80]],'#8ca1a9',1.5);
  for(const x of [15,241])for(const y of [38,68]){rbEllipse(c,x,y,3.5,3.5,'#1b2e41');rbEllipse(c,x-.5,y-.7,2,2,'#9baeb4');}
  for(let x=31;x<240;x+=24){rbLine(c,[[x,11],[x-5,21]],'#536a78',1);rbLine(c,[[x+2,11],[x-3,21]],'#e1dfc9',.7);}
  c.restore();
}
function rbBank(c,w,h){
  c.save();c.scale(w/192,h/160);
  rbPath(c,[[0,24],[192,24],[176,63],[181,160],[0,160]],rbGradient(c,0,24,170,160,[[0,'#66717b'],[.5,'#394c61'],[1,'#172d43']]));
  rbPath(c,[[0,24],[16,6],[179,6],[192,24]],'#929fa4');rbLine(c,[[0,24],[192,24]],'#d3dbd3',2.4);
  rbPath(c,[[16,43],[64,34],[91,70],[62,95],[8,82]],'#4c6072');rbPath(c,[[99,43],[153,36],[177,69],[154,103],[104,91]],'#41596d');
  rbPath(c,[[5,94],[61,106],[87,151],[16,157]],'#2e465d');rbPath(c,[[77,103],[122,99],[159,137],[147,160],[89,160]],'#385268');
  rbLine(c,[[13,47],[60,41],[80,71]],'#72848c',1.5);rbLine(c,[[106,48],[148,44],[168,70]],'#6a808a',1);
  c.fillStyle='#6f817f';c.fillRect(6,19,180,4);c.fillStyle='#b2a17a';c.fillRect(7,10,178,3);
  for(let x=12;x<180;x+=24){c.fillStyle='#556b78';c.fillRect(x,10,3,12);}c.restore();
}
function rbRing(c,w,h){
  c.save();c.translate(w/2,h/2);const radius=Math.min(w,h)*.39;
  c.lineWidth=15;c.strokeStyle=rbGradient(c,-radius,-radius,radius,radius,[[0,'#d2ad7b'],[.3,'#7b6d60'],[.6,'#a08b70'],[1,'#3e4a55']]);c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();
  c.lineWidth=1;c.strokeStyle='#ead7ae';c.beginPath();c.arc(0,0,radius+6,0,Math.PI*2);c.stroke();c.strokeStyle='#203746';c.beginPath();c.arc(0,0,radius-6,0,Math.PI*2);c.stroke();
  for(let i=0;i<24;i++){const a=i*Math.PI/12,outer=radius+1,inner=radius-(i%6===0?9:4);rbLine(c,[[Math.cos(a)*inner,Math.sin(a)*inner],[Math.cos(a)*outer,Math.sin(a)*outer]],i%6===0?'#d8e1d5':'#c2b99a',i%6===0?2:1);}
  for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;rbEllipse(c,Math.cos(a)*radius,Math.sin(a)*radius,3,3,'#233a48');rbEllipse(c,Math.cos(a)*radius-.5,Math.sin(a)*radius-.5,1,1,'#dbceb1');}
  c.restore();
}
function rbPersonBody(c,w,h){
  c.save();c.scale(w/64,h/96);rbPath(c,[[17,44],[41,40],[52,56],[47,88],[17,88],[10,62]],rbGradient(c,14,43,45,89,[[0,'#e6d9b7'],[.55,'#b6a883'],[1,'#756f65']]),'#263344',1.5);
  rbPath(c,[[12,52],[4,55],[3,77],[12,82],[16,58]],'#758d96','#273b4d',1);rbPath(c,[[42,49],[56,60],[58,80],[50,82],[47,62]],'#a9a78d');
  rbEllipse(c,31,26,15,18,'#d1b79b');rbPath(c,[[16,24],[18,11],[29,6],[42,10],[47,23],[39,19],[24,20]],'#25354a');rbPath(c,[[16,24],[19,38],[23,42],[22,25]],'#a88f78');
  rbLine(c,[[37,27],[42,27]],'#4c4f55',2);rbLine(c,[[23,47],[28,68],[28,86]],'#f1e7cf',2);rbLine(c,[[40,47],[35,66],[35,86]],'#697d83',2);rbPath(c,[[25,66],[39,66],[41,80],[25,80]],'#637f87');
  rbLine(c,[[28,69],[36,69]],'#b9d0c7',1);c.restore();
}
function rbPanel(c,w,h){
  c.fillStyle=rbGradient(c,0,0,0,h,[[0,'#263e52'],[1,'#172c40']]);c.fillRect(0,0,w,h);rbLine(c,[[1,1],[w-1,1]],'#4c6574',1);
  for(const x of [6,w-6])for(const y of [6,h-6]){rbEllipse(c,x,y,1.7,1.7,'#536c78');rbLine(c,[[x-1,y],[x+1,y]],'#172d40',.7);}
}
const RB_ATLAS={builtins:[],tiles:[
  {name:'rb_sky',x:0,y:0,w:640,h:256,paint:rbSky},{name:'rb_ring',x:640,y:0,w:192,h:192,paint:rbRing},
  {name:'rb_person',x:832,y:0,w:64,h:96,paint:rbPersonBody},{name:'rb_plate',x:0,y:256,w:256,h:128,paint:rbPlate},
  {name:'rb_bank',x:256,y:256,w:192,h:160,paint:rbBank},{name:'rb_panel',x:448,y:256,w:256,h:128,paint:rbPanel},
  {name:'rb_back',x:0,y:800,w:512,h:128,paint(c,w,h){c.fillStyle=rbGradient(c,0,0,0,h,[[0,'#14283d'],[1,'#0e1c30']]);c.fillRect(0,0,w,h);}}
]};
const RB_LIGHT='#deeadf',RB_MUTED='#a1b9c1',RB_CYAN='#8ed8d5',RB_AMBER='#dfb97c',RB_RED='#f0a28b';
const RB_BASE_Y=228,RB_HEIGHT_SCALE=70,RB_PLATES=[{left:140,right:280},{left:320,right:460},{left:500,right:640}];
function rbHeightY(height){return RB_BASE_Y-height*RB_HEIGHT_SCALE;}
function rbPersonX(p,physics){
  const cross=physics.crossingTicks,walk=physics.plateWalkingTicks,parts=[[100,140,cross],[140,280,walk],[280,320,cross],[320,460,walk],[460,500,cross],[500,640,walk],[640,680,cross]];let remaining=p.movementTicks;
  for(const [from,to,duration]of parts){if(remaining<=duration)return from+(to-from)*remaining/duration;remaining-=duration;}return 680;
}
function rbScene(r,s){
  r.sprite('rb_sky',374,215,708,318,0,'#fff');r.line(38,RB_BASE_Y,710,RB_BASE_Y,1,'#4b6576');r.text('0m',25,RB_BASE_Y-16,13,RB_MUTED);
  r.sprite('rb_bank',61,RB_BASE_Y+118/2-24/160*118,78,118,0,'#fff');r.sprite('rb_bank',702,RB_BASE_Y+118/2-24/160*118,44,118,0,'#fff');
  // Top of each bank and bridge plate is the exact graph support height.
  r.line(22,RB_BASE_Y,100,RB_BASE_Y,3,'#d9ddd2');r.line(680,RB_BASE_Y,724,RB_BASE_Y,3,'#d9ddd2');
  s.boards.forEach((b,i)=>{const q=RB_PLATES[i],cx=(q.left+q.right)/2,selected=s.cursor===i;
    r.sprite('rb_ring',cx,248,146,146,0,selected?'#fff':'#b7c6cd');const angle=b.phaseRadians-Math.PI/2;
    r.circle(cx+Math.cos(angle)*57,248+Math.sin(angle)*57,4,selected?RB_CYAN:'#bcc4b2');
    r.text('P'+(i+1),cx-r.measureText('P'+(i+1),18)/2,62,18,selected?RB_CYAN:RB_LIGHT);
    const label='H '+(b.heightMetres>=0?'+':'')+b.heightMetres.toFixed(2)+'m';r.text(label,cx-r.measureText(label,14)/2,85,14,RB_MUTED);
    const y=rbHeightY(b.heightMetres);r.sprite('rb_plate',cx,y+70/2-24/128*70,140,70,0,selected?'#fff':'#c9d8dc');
    if(selected){r.line(q.left,y-2,q.right,y-2,2,RB_CYAN);r.line(q.left,y-5,q.left,y+5,2,RB_CYAN);r.line(q.right,y-5,q.right,y+5,2,RB_CYAN);}
  });
  const groups=[];
  for(const p of s.pedestrians){
    if(p.stage==='pending'||p.stage==='passed')continue;
    const x=rbPersonX(p,s.physics),y=rbHeightY(p.heightMetres),moving=p.stage==='walking'||p.stage==='crossing',stride=moving?Math.sin(p.movementTicks*Math.PI/12)*3:0;
    const tint=p.stage==='fallen'?RB_RED:p.id%2===0?'#b8dce0':'#fff';
    r.line(x-3,y-13,x-4+stride,y-2,3,'#a1aeb0');r.line(x+3,y-13,x+4-stride,y-2,3,'#6b8390');r.rect(x-7+stride,y-3,8,3,'#203449');r.rect(x+1-stride,y-3,8,3,'#203449');
    r.sprite('rb_person',x,y-27,20,30,0,tint);
    let group=groups.find(g=>Math.abs(g.x-x)<1&&Math.abs(g.y-y)<1);if(!group){group={x,y,ids:[],fallen:false};groups.push(group);}group.ids.push(p.id);group.fallen=group.fallen||p.stage==='fallen';
  }
  // Co-located people retain their actual positions; a joined identity label never implies collision.
  for(const group of groups){const text=group.ids.map(id=>'#'+id).join('/'),width=r.measureText(text,13)+8,x=Math.min(724-width,group.x+12),y=group.y-40;r.rect(x,y,width,18,'#162d42');r.text(text,x+4,y+2,13,group.fallen?RB_RED:RB_LIGHT);}
  const pending=s.pedestrians.filter(p=>p.stage==='pending').length,passed=s.passedCount;r.text('QUEUE '+pending,24,343,14,RB_MUTED);r.text('SAFE '+passed,646,343,14,RB_MUTED);
}
function rbContactCards(r,s){
  for(let i=0;i<4;i++){const x=24+i*176,y=365,g=s.lastInterval?s.lastInterval.contacts[i]:null;r.sprite('rb_panel',x+82,y+23,164,46,0,'#fff');
    r.text(g?'E'+(i+1)+' MAX '+g.maxGapMetres.toFixed(4)+'m':'E'+(i+1)+' NO INTERVAL',x+9,y+5,14,g?(g.safe?RB_CYAN:RB_AMBER):RB_MUTED);
    r.text(g?(g.safe?'SAFE':'UNSAFE')+' / '+(g.closing?'CLOSING':'OPENING'):'NOT CHECKED YET',x+9,y+26,13,RB_MUTED);
  }
}
function rbPeoplePanel(r,s){
  r.sprite('rb_panel',844,232,192,350,0,'#fff');r.text('PEOPLE '+s.passedCount+'/'+s.pedestrians.length,760,70,19,RB_LIGHT);
  r.text(s.dispatchAtTick===null?'QUEUE NOT RELEASED':s.phase==='won'?'ALL ARRIVED':s.phase==='lost'?'RUN ENDED':'QUEUE RELEASED',760,96,13,s.phase==='lost'?RB_RED:RB_MUTED);
  s.pedestrians.forEach((p,i)=>{const y=124+i*44,col=p.stage==='fallen'?RB_RED:p.stage==='passed'?RB_CYAN:RB_LIGHT;
    r.rect(758,y,172,39,'#1b3045');const title='#'+p.id+' '+({pending:'PENDING',waiting:'WAIT E'+(p.edgeIndex+1),crossing:'CROSS E'+(p.edgeIndex+1),walking:'WALK P'+p.node,passed:'ARRIVED',fallen:'FALL'}[p.stage]);r.text(title,765,y+3,15,col);
    let detail,ratio=0;if(p.stage==='waiting'){detail='CONTACT '+p.contactTicks+'/'+s.physics.contactQualificationTicks;ratio=p.contactTicks/s.physics.contactQualificationTicks;}
    else if(p.stage==='crossing'){detail='CROSS '+p.crossingAgeTicks+'/'+s.physics.crossingTicks;ratio=p.crossingAgeTicks/s.physics.crossingTicks;}
    else if(p.stage==='walking'){detail='WALK '+p.walkingAgeTicks+'/'+s.physics.plateWalkingTicks;ratio=p.walkingAgeTicks/s.physics.plateWalkingTicks;}
    else detail=p.stage==='pending'?'NOT ON THE BRIDGE':p.stage==='passed'?'SAFE BANK':'LAST SAFE POSITION';r.text(detail,765,y+21,13,RB_MUTED);r.rect(765,y+37,154*Math.min(1,ratio),2,col);
  });
  const maximum=Math.max(...s.boards.map(b=>b.amplitudeMetres)),limit=s.physics.maximumSafeAmplitudeMetres;r.text('MAX AMP '+maximum.toFixed(4)+'m',760,357,15,maximum>limit?RB_RED:RB_LIGHT);r.text('LIMIT '+limit.toFixed(2)+'m',760,381,14,RB_AMBER);
}
function rbControls(r,s){
  s.boards.forEach((b,i)=>{const x=20+i*242,y=420,selected=s.cursor===i,limit=s.physics.maximumSafeAmplitudeMetres;r.sprite('rb_panel',x+114,y+38,228,76,0,selected?'#fff':'#cedde3');if(selected)r.rect(x,y,228,3,RB_CYAN);
    r.text('P'+(i+1),x+12,y+8,18,selected?RB_CYAN:RB_LIGHT);r.text(s.physics.frequencyHertz[b.frequencyIndex].toFixed(2)+' Hz',x+60,y+9,18,RB_LIGHT);
    r.text('PH '+(b.phaseWrappedUnits/s.physics.phaseUnitsPerTurn*360).toFixed(1)+'deg',x+12,y+33,14,RB_MUTED);r.text('PULSE '+(b.trimTicksRemaining/s.physics.tickHz).toFixed(2)+'s',x+127,y+33,14,b.trimTicksRemaining?RB_CYAN:RB_MUTED);
    r.text('AMP '+b.amplitudeMetres.toFixed(4)+' / '+limit.toFixed(2)+'m',x+12,y+53,14,b.amplitudeMetres>limit?RB_RED:RB_AMBER);r.rect(x+12,y+72,204*Math.min(1,b.amplitudeMetres/limit),2,b.amplitudeMetres>limit?RB_RED:RB_AMBER);
  });
  const x=748,y=420;r.sprite('rb_panel',844,y+38,192,76,0,'#fff');if(s.cursor===3)r.rect(x,y,192,3,RB_CYAN);
  r.text('DISPATCH',760,y+10,18,s.cursor===3?RB_CYAN:RB_LIGHT);
  const text=s.phase!=='playing'?'RUN ENDED':s.dispatchAtTick!==null?'QUEUE RELEASED':s.cursor===3?'A: RELEASE QUEUE':'SELECT TO RELEASE';r.text(text,760,y+37,13,RB_MUTED);r.text('ONE QUEUE',760,y+56,13,RB_MUTED);
}
function rbHeaderFooter(r,s){
  r.rect(0,0,960,44,'#0f1f33');r.text('RESONANCE BRIDGE',22,12,22,RB_LIGHT);r.text(s.levelNameEn.toUpperCase(),327,17,13,RB_MUTED);r.text('PASSED '+s.passedCount+'/'+s.pedestrians.length,790,14,17,RB_CYAN);
  r.rect(0,500,960,40,'#102237');let title,detail='CONTACT CARDS = LAST FULL INTERVAL';
  if(s.phase==='won'){title='CROSSING COMPLETE';detail='ALL PEOPLE ARRIVED / FINAL BRIDGE STATE';}
  else if(s.phase==='lost'){title=s.lostReason==='unstable-amplitude'?'ENDED / AMPLITUDE LIMIT':s.lostReason==='pedestrian-fall'?'ENDED / UNSAFE CROSSING':'ENDED / TIME LIMIT';detail=s.lostReason==='pedestrian-fall'?'FALLEN PERSON REMAINS AT LAST SAFE POSITION':'FINAL BRIDGE STATE';}
  else title=s.inputState.quarantined?'RELEASE CONTROLS TO REARM':s.cursor===3?(s.dispatchAtTick===null?'A: RELEASE QUEUE':'QUEUE ALREADY RELEASED'):'A: FREQUENCY / B: PHASE PULSE';
  r.text(title,22,505,16,RB_LIGHT);r.text(detail,22,525,13,RB_MUTED);const clock=s.phase==='playing'?(s.deadlineTicksRemaining/60).toFixed(1)+'s LEFT':'FINISHED';r.text(clock,938-r.measureText(clock,15),508,15,RB_AMBER);
}
window.GameDef={id:'resonance-bridge',title:'共振浮桥',seed:731,accent:'#7cc8ce',background:'#102137',atlas:RB_ATLAS,holdConfirmAsA:false,
  description:'左右选择桥板或放行栏。A切换频率，B平滑调相；在放行栏按A启动队列。行人需持续接触且间隙正在收拢才跨板。持续共振会增大振幅。',
  controls:{move:'左右选择桥板 / 放行',a:'频率·放行 / 空格',b:'调相脉冲 / B'},actionLabels:['频率 / 放行','调相脉冲'],levelLabel:'桥段',levelNames:['晨雾渡口','错拍长廊','暮潮接力'],
  tip:'瞬间对齐不够，需积满接触时间。放行后仍可调节，但正在跨板的行人也会受影响。',winTitle:'全员平安过桥',loseTitle:'浮桥通行中断',
  result(s){if(s.phase==='won')return'所有行人已通过，桥板保持稳定。';if(s.lostReason==='unstable-amplitude')return'振幅超出安全上限。留意共振积累，及时调频。';if(s.lostReason==='pedestrian-fall')return'跨板期间间隙失去安全条件。调节时也要看正在过桥的人。';return'时间已到，仍有行人未通过。先调节桥板，再启动放行。';},
  hud(s){return[{label:'通行',value:s.passedCount+'/'+s.pedestrians.length,tone:''},{label:'阶段',value:s.phase!=='playing'?'已结束':s.stage==='tuning'?'调节待发':'队列通行',tone:''},{label:'最大振幅',value:Math.max(...s.boards.map(b=>b.amplitudeMetres)).toFixed(4)+' m',tone:s.boards.some(b=>b.amplitudeMetres>s.physics.maximumSafeAmplitudeMetres)?'warn':''},{label:'剩余',value:(s.deadlineTicksRemaining/60).toFixed(1)+' s',tone:''}];},
  render(r,s){r.sprite('rb_back',480,270,960,540,0,'#fff');rbScene(r,s);rbContactCards(r,s);rbPeoplePanel(r,s);rbControls(r,s);rbHeaderFooter(r,s);}
};
