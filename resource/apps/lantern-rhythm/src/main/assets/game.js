/* Lantern Rhythm: render public current cues and actual input, never private patterns. */
(function(root){
  'use strict';
  const C={sky:'#172d46',ink:'#102b42',cream:'#f0dfbb',mint:'#a8ded3',gold:'#edc88e',muted:'#8daebc',coral:'#efa18d'};
  const MARKERS={up:{x:480,y:108,dx:0,dy:-1,label:'N'},right:{x:688,y:263,dx:1,dy:0,label:'E'},down:{x:480,y:390,dx:0,dy:1,label:'S'},left:{x:272,y:263,dx:-1,dy:0,label:'W'}};
  function lighthouseArt(c,w,h,a){
    a.ellipse(c,128,207,77,12,a.radial(c,128,207,79,[[0,'#061c3580'],[1,'#061c3500']]));
    a.path(c,[[94,84],[162,84],[179,209],[77,209]],a.linear(c,78,0,180,0,[[0,'#f3e9cd'],[.28,'#d4ded2'],[.62,'#9bb5ba'],[1,'#527b92']]),'#d5e0d2',2);
    a.path(c,[[143,84],[162,84],[179,209],[152,209]],'#7798ac');
    c.strokeStyle='#7293a166';c.lineWidth=1.2;
    for(let y=95;y<205;y+=16){const left=94-(y-84)*17/125,right=162+(y-84)*17/125;c.beginPath();c.moveTo(left,y);c.lineTo(right,y);c.stroke();for(let x=left+12+(y%32?0:12);x<right-8;x+=25){c.beginPath();c.moveTo(x,y-14);c.lineTo(x,y);c.stroke();}}
    a.path(c,[[88,125],[168,125],[172,146],[84,146]],a.linear(c,83,0,173,0,[[0,'#668f9d'],[.5,'#3b647e'],[1,'#264e6a']]));
    a.path(c,[[117,208],[117,183],[122,177],[135,177],[141,183],[141,208]],'#21465f','#bac9bc',2);
    c.fillStyle='#8eaaa9';c.fillRect(120,184,3,21);a.ellipse(c,135,195,1.8,1.8,'#e0c28c');
    c.fillStyle='#315875';c.fillRect(122,99,13,18);c.fillStyle='#9ac8cd';c.fillRect(124,101,5,12);
    a.path(c,[[86,76],[170,76],[177,86],[79,86]],a.linear(c,0,73,0,89,[[0,'#e0d8b6'],[1,'#6e8b98']]),'#b8c8bf',2);
    a.path(c,[[97,39],[159,39],[159,76],[97,76]],a.linear(c,98,39,156,75,[[0,'#9fc5ca'],[.3,'#315f79'],[.7,'#173e5d'],[1,'#729ba7']]),'#d2d0b0',3);
    c.strokeStyle='#8ea8aa';c.lineWidth=3;[107,128,149].forEach(x=>{c.beginPath();c.moveTo(x,41);c.lineTo(x,73);c.stroke();});
    a.path(c,[[87,39],[128,10],[169,39]],a.linear(c,100,10,150,40,[[0,'#f0d4a6'],[.4,'#bca181'],[1,'#6b6a70']]),'#e4cfac',2);
    c.strokeStyle='#c9c5a8';c.lineWidth=2;c.beginPath();c.moveTo(128,2);c.lineTo(128,12);c.stroke();a.ellipse(c,128,3,3,3,'#edc88e');
    c.strokeStyle='#718e9c';c.lineWidth=2;c.beginPath();c.moveTo(77,73);c.lineTo(179,73);c.moveTo(78,79);c.lineTo(178,79);c.stroke();
    for(let x=80;x<179;x+=14){c.beginPath();c.moveTo(x,72);c.lineTo(x,83);c.stroke();}
  }
  function islandArt(c,w,h,a){
    a.ellipse(c,128,158,121,45,a.radial(c,128,158,125,[[0,'#09223b88'],[.8,'#0b294447'],[1,'#0b294400']]));
    a.path(c,[[17,108],[46,68],[101,49],[163,56],[218,84],[240,125],[213,167],[156,188],[78,178],[31,148]],a.linear(c,0,60,0,190,[[0,'#879c9d'],[.4,'#587487'],[1,'#293e60']]),'#4c798a',2);
    a.path(c,[[46,68],[101,49],[163,56],[193,90],[128,117],[63,103]],'#a9b8aa');
    a.path(c,[[63,103],[128,117],[109,176],[78,178],[31,148]],'#536b83');
    a.path(c,[[128,117],[193,90],[218,84],[240,125],[213,167],[156,188]],'#48677e');
    a.path(c,[[53,77],[104,60],[158,67],[192,92],[145,111],[90,105]],'#bdc7b1');
    a.path(c,[[46,130],[70,148],[65,170],[37,149]],'#7f929b');a.path(c,[[178,125],[218,119],[204,155],[169,164]],'#70889a');
    c.strokeStyle='#bce1d8aa';c.lineWidth=3;c.beginPath();c.ellipse(128,157,116,35,.06,.12,Math.PI*.94);c.stroke();
    c.strokeStyle='#d8e4d233';c.lineWidth=2;c.beginPath();c.ellipse(126,163,124,43,.04,.06,Math.PI*.95);c.stroke();
  }
  function cloudArt(c,w,h,a){
    [[54,70,48,21],[100,51,51,33],[151,61,65,28],[198,73,43,20]].forEach(p=>a.ellipse(c,p[0],p[1],p[2],p[3],a.radial(c,p[0],p[1],p[2],[[0,'#e9d7d344'],[.55,'#b7bdcf25'],[1,'#b7bdcf00']])));
  }
  function beamArt(c,w,h,a){
    a.path(c,[[0,43],[256,5],[256,91],[0,53]],a.linear(c,0,48,256,48,[[0,'#fff2c6a6'],[.4,'#ffe8b85e'],[1,'#ffe8b800']]));
    a.path(c,[[0,47],[256,28],[256,68],[0,49]],a.linear(c,0,48,256,48,[[0,'#ffffff88'],[1,'#ffffff00']]));
  }
  function beaconArt(c,w,h,a){
    a.ellipse(c,80,139,62,12,a.radial(c,80,139,65,[[0,'#071e3e99'],[1,'#071e3e00']]));
    a.path(c,[[29,111],[51,94],[110,94],[132,111],[120,140],[42,140]],a.linear(c,40,91,121,141,[[0,'#a5b9b5'],[.4,'#6e919c'],[1,'#345675']]),'#b5c7be',2);
    a.path(c,[[56,65],[104,65],[113,116],[48,116]],a.linear(c,50,0,111,0,[[0,'#dde0c5'],[.44,'#a6c0b6'],[1,'#537e92']]),'#b8c7b7',2);
    a.path(c,[[57,51],[103,51],[103,88],[57,88]],a.linear(c,57,51,103,87,[[0,'#a3c4c6'],[.3,'#214e6d'],[.8,'#153e5c'],[1,'#6c99a8']]),'#d4c9a6',3);
    c.strokeStyle='#8badae';c.lineWidth=3;c.beginPath();c.moveTo(69,53);c.lineTo(69,87);c.moveTo(91,53);c.lineTo(91,87);c.stroke();
    a.path(c,[[47,51],[80,27],[113,51]],a.linear(c,58,26,102,53,[[0,'#e8c89c'],[1,'#6d6c7a']]),'#e3ceac',2);
    c.fillStyle='#315a75';c.fillRect(68,98,24,13);c.fillStyle='#d7d0aa';c.fillRect(73,101,14,3);
    c.strokeStyle='#c8c9ac';c.lineWidth=2;c.beginPath();c.moveTo(80,20);c.lineTo(80,29);c.stroke();
  }
  function cliffArt(c,w,h,a){
    a.path(c,[[0,64],[49,37],[105,59],[151,22],[204,38],[260,17],[320,46],[320,224],[0,224]],a.linear(c,0,24,0,224,[[0,'#8b9e9b'],[.28,'#5a7484'],[1,'#233b58']]));
    a.path(c,[[0,64],[49,37],[105,59],[94,113],[38,142],[0,123]],'#7e9699');
    a.path(c,[[105,59],[151,22],[204,38],[217,105],[165,149],[94,113]],'#a0afa6');
    a.path(c,[[204,38],[260,17],[320,46],[320,116],[273,151],[217,105]],'#668590');
    a.path(c,[[38,142],[94,113],[165,149],[142,224],[45,224]],'#36536d');
    a.path(c,[[217,105],[273,151],[320,116],[320,224],[238,224]],'#31516a');
    c.strokeStyle='#bfd1c24d';c.lineWidth=2;c.beginPath();c.moveTo(0,89);c.lineTo(47,65);c.lineTo(100,78);c.moveTo(150,42);c.lineTo(195,53);c.stroke();
  }
  function dialArt(c,w,h,a){
    a.ellipse(c,96,96,88,88,a.linear(c,26,13,158,175,[[0,'#d5c7a7'],[.3,'#658494'],[.6,'#a0aaa8'],[1,'#304e6c']]));
    a.ellipse(c,96,96,80,80,'#183b53');a.ellipse(c,96,96,75,75,'#21445b');
    c.strokeStyle='#89acae';c.lineWidth=1.5;c.beginPath();c.arc(96,96,73,0,Math.PI*2);c.stroke();
    for(let i=0;i<48;i++){const angle=i*Math.PI/24,inner=i%4===0?61:67;c.strokeStyle=i%4===0?'#d6d2ac':'#658a99';c.lineWidth=i%4===0?2:1;c.beginPath();c.moveTo(96+Math.cos(angle)*inner,96+Math.sin(angle)*inner);c.lineTo(96+Math.cos(angle)*72,96+Math.sin(angle)*72);c.stroke();}
    a.ellipse(c,96,96,55,55,a.radial(c,96,96,58,[[0,'#345b6d'],[1,'#17394f']]));
  }
  const atlas={builtins:['glow','ring','shadow'],tiles:[
    {name:'lantern_tower',x:0,y:0,w:256,h:224,paint:lighthouseArt},
    {name:'lantern_island',x:256,y:0,w:256,h:224,paint:islandArt},
    {name:'lantern_cloud',x:512,y:0,w:256,h:128,paint:cloudArt},
    {name:'lantern_beam',x:512,y:128,w:256,h:96,paint:beamArt},
    {name:'lantern_beacon',x:768,y:0,w:160,h:160,paint:beaconArt},
    {name:'lantern_cliff',x:0,y:800,w:320,h:224,paint:cliffArt},
    {name:'lantern_dial',x:320,y:800,w:192,h:192,paint:dialArt}
  ]};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function center(r,text,x,y,size,color){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
  function arrow(r,x,y,d,size,color,width){
    const m=MARKERS[d];if(!m)return;const ux=m.dx,uy=m.dy,px=-uy,py=ux;
    r.line(x-ux*size*.5,y-uy*size*.5,x+ux*size*.5,y+uy*size*.5,width,color);
    r.line(x+ux*size*.5,y+uy*size*.5,x+px*size*.3,y+py*size*.3,width,color);
    r.line(x+ux*size*.5,y+uy*size*.5,x-px*size*.3,y-py*size*.3,width,color);
  }
  function scenery(r,s){
    const t=s.elapsed;
    r.sprite('glow',470,112,1050,560,0,'#b27e9d36');r.sprite('glow',540,385,1120,430,0,'#4eaeae39');
    r.rect(0,182,960,309,'#234b6580');r.line(0,182,960,182,1,'#a2bab14d');
    r.sprite('lantern_cloud',155+Math.sin(t*.035)*12,88,340,150,0,'#c5c4d2');r.sprite('lantern_cloud',795-Math.sin(t*.03)*14,115,360,130,0,'#bac2cb');
    for(let row=0;row<9;row++)for(let i=0;i<6;i++){
      const x=55+i*166+(row%2)*27+Math.sin(t*.35+row+i)*8,y=211+row*28+Math.sin(t*.6+i)*2;
      r.line(x,y,x+31+(i%3)*14,y,1.1,row<3?'#a0c2c026':'#8ed0c336');
    }
    r.sprite('lantern_island',480,319,235,147,0,'#d9e0c8');
    r.sprite('lantern_cliff',20,476,285,130,0,'#a7b1b9');r.sprite('lantern_cliff',929,475,295,137,0,'#a6afb7');
    r.sprite('lantern_tower',480,257,150,131.25,0,'#fff');
    // The tower's baked lamp at (128,58) maps exactly to this light origin.
    const origin={x:480,y:257+(58-112)*150/256},cue=s.mode==='listen'?s.visibleCue:null;
    if(cue&&cue.active&&MARKERS[cue.direction]){
      const target=MARKERS[cue.direction],dx=target.x-origin.x,dy=target.y-origin.y,len=Math.hypot(dx,dy);
      r.sprite('lantern_beam',(origin.x+target.x)/2,(origin.y+target.y)/2,len,Math.max(27,len*.28),Math.atan2(dy,dx),'#ffe9b5');
      r.sprite('glow',origin.x,origin.y,65,65,0,'#f2c980b8');r.circle(origin.x,origin.y,5,'#fff1c1');
    }
    s.beacons.forEach(b=>{
      r.sprite('lantern_island',b.x,b.y+14,90,48,0,'#b3c7bb');
      // The buoy window is the beacon coordinate; each is lit only by its model flag.
      const width=49,scale=width/160;
      r.sprite('lantern_beacon',b.x,b.y+(80-69)*scale,width,width,0,b.lit?'#f3e2b7':'#91acb9');
      if(b.lit){r.sprite('glow',b.x,b.y,54,54,0,'#f3ce89a6');r.circle(b.x,b.y,4.2,'#fff0bb');}
      center(r,String(b.id).padStart(2,'0'),b.x,b.y+19,10,b.lit?C.gold:'#8fa9b5');
    });
  }
  function directionMarkers(r,s){
    const cue=s.mode==='listen'?s.visibleCue:null;
    const input=s.mode==='respond'?(s.activeHold?s.activeHold.direction:s.playerDirection):null;
    const selected=cue?cue.direction:input;
    Object.keys(MARKERS).forEach(d=>{
      const m=MARKERS[d],current=d===selected,color=current?(cue?C.gold:C.mint):'#668b9e';
      r.sprite('lantern_dial',m.x,m.y,65,65,0,current?'#fff':'#92a7b6');
      arrow(r,m.x,m.y,d,current?30:25,color,current?4:2.5);
      center(r,m.label,m.x,m.y-46,12,current?C.cream:'#86a8b5');
      if(cue&&current){
        if(cue.kind==='short')r.circle(m.x,m.y+39,4,C.gold);else r.line(m.x-12,m.y+39,m.x+12,m.y+39,4,C.gold);
      }
    });
  }
  function beatClock(r,s){
    const ended=s.phase!=='playing';if(ended)return;
    let remaining=null;
    if((s.mode==='count-in'||s.mode==='respond')&&s.nextOnset!==null)remaining=s.nextOnset-s.elapsed;
    else if(s.mode==='listen'){
      if(s.elapsed<s.listenStartedAt)remaining=s.listenStartedAt-s.elapsed;
      else if(s.elapsed<s.listenEndsAt){const beat=Math.floor((s.elapsed-s.listenStartedAt)/s.beatPeriod);remaining=s.listenStartedAt+(beat+1)*s.beatPeriod-s.elapsed;}
    }
    if(remaining!==null){
      const progress=1-clamp(remaining/s.beatPeriod,0,1),size=102+progress*88;
      r.sprite('ring',480,266,size,size,0,s.mode==='listen'?'#ddc4a754':'#9fdfd573');
    }
  }
  function phaseCards(r,s){
    const ended=s.phase!=='playing',cue=s.mode==='listen'?s.visibleCue:null;
    const names={'listen':'LISTEN','count-in':'COUNT IN','respond':'YOUR TURN','feedback':'FEEDBACK'};
    r.rect(28,63,174,306,'#122c46c9');r.line(28,63,202,63,1,'#8c9baf');
    r.text('PHRASE '+(s.phraseIndex+1)+' / '+s.phraseCount,42,79,11,'#b1c7c5');
    r.text(s.phase==='won'?'ALL LIT':s.phase==='lost'?'SIGNAL ENDED':names[s.mode],42,107,20,ended?C.cream:s.mode==='listen'?C.gold:C.mint);
    r.text(s.phraseLength+' NOTES / PHRASE',42,141,10,'#a2bfc2');
    r.line(42,165,187,165,1,'#4d6d85');
    if(!ended&&s.mode==='listen'){
      r.text(cue?'CURRENT SIGNAL':'WATCH THE LAMP',42,181,10,'#c4d2c5');
      if(cue){r.text(cue.direction.toUpperCase(),42,205,17,C.cream);r.text(cue.kind==='short'?'SHORT  /  DOT':'LONG  /  DASH',42,235,13,C.gold);}
      else r.text('NO CUE IN THIS GAP',42,211,9,'#91afba');
    }else if(!ended&&(s.mode==='count-in'||s.mode==='respond')){
      const left=s.nextOnset===null?0:s.nextOnset-s.elapsed;
      r.text(s.requiresNeutral?'RELEASE A FIRST':'NEXT BEAT',42,181,10,s.requiresNeutral?C.coral:'#c4d2c5');
      r.text(s.requiresNeutral?'REARM':left>0?left.toFixed(1)+' s':s.activeHold?'HOLDING':'NOW',42,204,23,s.requiresNeutral?C.coral:C.mint);
      r.text('ACCEPTED '+s.answered+' / '+s.phraseLength,42,242,11,'#bfd3c7');
    }else{
      r.text(s.phase==='won'?'THREE BEACONS LIT':s.phase==='lost'?'ENTER TO RETRY':'WATCH THE RESULT',42,188,10,C.cream);
      r.text('MATCHED '+s.litCount+' / '+s.phraseCount,42,218,11,'#b9d4c9');
    }
    r.line(42,271,187,271,1,'#4d6d85');r.text(ended?'REPLAYS UNUSED':'B / PHRASE REPLAY',42,287,10,'#bfcbc7');
    r.text(String(s.replaysRemaining)+' LEFT',42,309,18,s.replaysRemaining?C.gold:'#8faab6');r.text(ended?'ENTER / NEW VOYAGE':'REPLAY DOES NOT PAUSE',42,343,8,'#8ba9b8');
    r.rect(758,63,174,306,'#122c46c9');r.line(758,63,932,63,1,'#8c9baf');r.text('DIRECTION + DURATION',772,79,10,'#b1c7c5');
    r.text('SHORT',772,108,12,C.gold);r.circle(901,115,4,C.gold);r.text(s.shortDuration.toFixed(2)+' s',772,132,20,C.cream);
    r.text('LONG',772,174,12,C.mint);r.line(889,181,913,181,4,C.mint);r.text(s.longDuration.toFixed(2)+' s',772,198,20,C.cream);
    r.line(772,234,918,234,1,'#4d6d85');r.text('INPUT DIRECTION',772,250,10,'#a8c1c2');
    const actual=s.activeHold?s.activeHold.direction:s.playerDirection;
    if(!ended&&s.mode==='respond'&&actual){arrow(r,846,295,actual,29,C.mint,4);r.text(actual.toUpperCase(),772,333,11,C.mint);}
    else{r.text(ended?'SESSION ENDED':s.requiresNeutral?'RELEASE A':'WAIT FOR YOUR TURN',772,291,10,'#94b2bd');}
  }
  function holdMeter(r,s){
    const x=271,y=503,w=418,max=Math.max(1,s.longMax+.1),held=s.activeHold?s.activeHold.duration:0;
    r.rect(247,487,466,43,'#102b43e8');r.text('A HOLD',258,491,9,'#b9ccca');r.text(held.toFixed(2)+'s',655,491,9,s.requiresNeutral?C.coral:C.cream);
    r.rect(x,y,w,11,'#0b2037');
    r.rect(x+s.shortMin/max*w,y,(s.shortMax-s.shortMin)/max*w,11,'#8f765b');
    r.rect(x+s.longMin/max*w,y,(s.longMax-s.longMin)/max*w,11,'#3b777c');
    if(s.activeHold){const p=x+clamp(held/max,0,1)*w;r.line(p,y-3,p,y+14,2.5,'#f4f0cd');r.circle(p,y-5,3.5,'#f4f0cd');}
    r.circle(x+(s.shortMin+s.shortMax)/2/max*w,y+19,2.5,C.gold);
    r.line(x+(s.longMin+s.longMax)/2/max*w-8,y+19,x+(s.longMin+s.longMax)/2/max*w+8,y+19,3,C.mint);
    r.text('SHORT',x+4,y+16,8,'#c5c4ad');r.text('LONG',x+w-30,y+16,8,'#aacdc4');
  }
  function status(r,s){
    r.text('LANTERN RHYTHM',28,16,15,'#eee0c1');r.text('COASTAL SIGNALS / '+String(s.level).padStart(2,'0'),713,21,10,'#a2bfc3');
    let text='WATCH / REMEMBER / REPEAT',color='#adbfbb';
    if(s.phase==='won'){text='ALL BEACONS LIT / ENTER TO SAIL AGAIN';color=C.gold;}
    else if(s.phase==='lost'){text=s.lostReason==='timeout'?'TIME LIMIT REACHED / ENTER TO RETRY':'MISTAKE LIMIT REACHED / ENTER TO RETRY';color=C.coral;}
    else if(s.requiresNeutral){text='RELEASE A TO REARM';color=C.coral;}
    else if(s.feedback&&s.elapsed<s.feedback.expiresAt){
      const map={accepted:'NOTE ACCEPTED','phrase-complete':'PHRASE MATCHED / BEACON LIT',mistake:'TRY THIS PHRASE AGAIN',replay:'REPLAYING THE CURRENT PHRASE',cancel:'NEW COUNT IN / NO NOTE AWARDED'};
      text=map[s.feedback.type]||text;color=s.feedback.type==='mistake'?C.coral:s.feedback.type==='accepted'||s.feedback.type==='phrase-complete'?C.mint:C.gold;
    }else if(s.mode==='count-in'){text='GET READY / CHOOSE A DIRECTION';color=C.mint;}
    else if(s.mode==='respond'){text='CHOOSE DIRECTION / HOLD A / RELEASE';color=C.mint;}
    r.rect(256,36,448,25,'#132e46d9');center(r,text,480,43,10,color);
  }
  root.GameDef={
    id:'lantern-rhythm',title:'灯塔节拍',tagline:'记住光的方向，让整片海岸回应你的节拍',seed:163,
    accent:'#ebcc97',background:C.sky,holdConfirmAsA:true,levelLabel:'航段',levelNames:['三拍','四拍','五拍'],atlas,
    description:'先看灯塔示范，记住方向和短长。轮到你时，按节拍选择方向并按住 A：短按约 0.3 秒，长按约 0.7 秒，再松开。每段全部正确才点亮信标。B 花一次机会重播整段；重播不暂停计时。',
    controls:{move:'摇杆 / 方向键：选择本拍朝向',a:'按住再松 · 空格 / 确认 / 右上半屏',b:'重播整段 · B / 右下半屏'},actionLabels:['按住 / 松开','重播本段'],
    tip:'方向在按下 A 时锁定。短按约 0.3 秒，长按约 0.7 秒。B 是有限重播，不是暂停。',
    winTitle:'整片海岸都收到了你的信号',loseTitle:'再听一次海上的节拍',
    result(s){
      if(s.phase==='won')return '已点亮全部 '+s.phraseCount+' 座信标，完成 '+s.correctNotes+' 拍，剩余 '+s.replaysRemaining+' 次重播机会。';
      if(s.lostReason==='timeout')return '90 秒已到，已点亮 '+s.litCount+' / '+s.phraseCount+' 座信标。重播仍会耗时；先记住方向与长短，再按节拍回应。';
      return '已用尽 '+s.maxMistakes+' 次容错，点亮 '+s.litCount+' / '+s.phraseCount+' 座信标。按拍选择方向，短按或长按后及时松开 A。';
    },
    hud(s){const names={'listen':'聆听示范','count-in':'节拍倒数','respond':'按拍回应','feedback':'片段反馈'};return[
      {label:'信标进度',value:s.litCount+' / '+s.phraseCount,tone:'good'},
      {label:'当前阶段',value:s.phase==='won'?'全部点亮':s.phase==='lost'?'任务结束':names[s.mode]},
      {label:'可重播',value:s.replaysRemaining+' 次',tone:s.replaysRemaining===0?'warn':''},
      {label:'容错余量',value:Math.max(0,s.maxMistakes-s.mistakes)+' 次',tone:s.maxMistakes-s.mistakes<2?'warn':''},
      {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
    ];},
    render(r,s){scenery(r,s);beatClock(r,s);directionMarkers(r,s);phaseCards(r,s);holdMeter(r,s);status(r,s);}
  };
})(window);
