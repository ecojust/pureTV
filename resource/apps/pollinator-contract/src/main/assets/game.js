/* Original botanical journal. Positions, activity, flowering and fatigue are committed public state. */
function pcGradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);for(const [t,v]of stops)g.addColorStop(t,v);return g;}
function pcEllipse(c,x,y,rx,ry,color,angle=0){c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fillStyle=color;c.fill();}
function pcPath(c,points,fill,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function pcStem(c,points,width=2){c.strokeStyle='#598578';c.lineWidth=width;c.lineCap='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function pcLeaf(c,x,y,a,size=1){
  c.save();c.translate(x,y);c.rotate(a);c.scale(size,size);pcPath(c,[[0,0],[5,-12],[20,-15],[17,-4],[7,3]],pcGradient(c,0,-15,0,3,[[0,'#a2b5a0'],[1,'#4c8270']]),'#5c8978',.6);
  c.strokeStyle='#cfdbc2';c.lineWidth=.7;c.beginPath();c.moveTo(1,-1);c.lineTo(16,-11);c.moveTo(8,-6);c.lineTo(10,-12);c.moveTo(8,-6);c.lineTo(15,-6);c.stroke();c.restore();
}
function pcBloom(c,x,y,petals,radius,colors,angle=0){
  for(let i=0;i<petals;i++){const a=angle+i*Math.PI*2/petals;pcEllipse(c,x+Math.cos(a)*radius*.63,y+Math.sin(a)*radius*.63,radius*.56,radius*.24,colors[i%colors.length],a);}
  pcEllipse(c,x,y,radius*.25,radius*.25,'#b68a56');pcEllipse(c,x-.8,y-1,radius*.15,radius*.14,'#f4d89b');
}
function pcFlower(kind){return function(c,w,h){
  c.save();c.scale(w/128,h/128);pcEllipse(c,64,105,36,9,'rgba(66,104,86,.11)');
  if(kind==='clover'){
    for(const [x,y,a]of [[42,39,-.2],[76,30,.3],[88,62,.4]]){pcStem(c,[[60,106],[x+5,75],[x,y+5]]);for(let i=0;i<15;i++){const t=i*2.399,r=3+Math.sqrt(i)*2.4;pcEllipse(c,x+Math.cos(t)*r,y+Math.sin(t)*r,4,5,['#e5b8ce','#d49fb9','#f3d6df'][i%3],t);}}
    for(const [x,y]of [[44,88],[74,91]])for(let i=0;i<3;i++)pcLeaf(c,x,y,i*2.1,.7);
  }else if(kind==='calendula'){
    pcStem(c,[[60,106],[64,65],[63,39]],3);pcStem(c,[[61,91],[91,65]],2);pcLeaf(c,59,82,2.9,1.2);pcLeaf(c,65,96,-.2,1.2);pcLeaf(c,76,77,-.7,.8);
    pcBloom(c,63,38,16,23,['#e9bc75','#e6a96d','#f5d394']);pcBloom(c,91,65,12,12,['#e7ae74','#f4cd91']);
  }else if(kind==='bluestar'){
    pcStem(c,[[65,106],[65,67],[48,41]],2.4);pcStem(c,[[65,81],[91,44]],2);pcStem(c,[[65,67],[71,27]],2);
    for(const [x,y,r]of [[48,41,19],[91,44,15],[71,27,13]])pcBloom(c,x,y,5,r,['#a9c3d9','#8caccb','#bdd3e2'],.3);
    pcLeaf(c,63,97,2.9,1.1);pcLeaf(c,66,85,-.3,1.2);pcLeaf(c,58,66,3.1,.8);
  }else if(kind==='salvia'){
    for(const [x,y]of [[43,37],[66,21],[88,44]]){pcStem(c,[[63,107],[x,y]],2.4);for(let i=0;i<6;i++){const yy=y+i*6,xx=x+(63-x)*i*.035;pcEllipse(c,xx-4,yy,6,3.5,i%2?'#c0a8d4':'#997fb5',-.4);pcEllipse(c,xx+4,yy+2,6,3.5,'#bba1ce',.4);}}
    pcLeaf(c,60,94,3.1,1.4);pcLeaf(c,64,101,-.2,1.4);pcLeaf(c,54,79,3.5,1);
  }else if(kind==='aster'){
    pcStem(c,[[64,106],[55,36]],3);pcStem(c,[[64,92],[89,58]],2);pcLeaf(c,61,83,3.1,1.1);pcLeaf(c,63,99,-.2,1.3);
    pcBloom(c,55,37,20,23,['#b89fc9','#d3bbdc','#b999c9'],.1);pcBloom(c,55,37,13,15,['#ddc8e3','#b5a0ca']);pcBloom(c,89,58,16,14,['#c1a5d2','#dec9e1']);
  }else{
    pcStem(c,[[61,107],[62,43]],3);pcStem(c,[[63,93],[91,63]],2);pcLeaf(c,60,84,3.1,1.3);pcLeaf(c,62,98,0,1.2);
    pcBloom(c,62,41,14,24,['#f3eee4','#fff9ed','#dce3d7']);pcBloom(c,91,63,11,13,['#eeeadd','#fff6e8']);pcEllipse(c,62,41,8,7,'#d4ac5e');pcEllipse(c,60,39,4,3,'#f4d78e');
  }
  c.restore();
};}
function pcBud(c,w,h){
  c.save();c.scale(w/128,h/128);pcEllipse(c,64,105,32,8,'rgba(62,102,82,.1)');
  for(const [x,y]of [[46,45],[74,35],[91,61]]){pcStem(c,[[64,106],[x,y]],2);pcEllipse(c,x,y,7,12,'#8ba58a',.1);pcEllipse(c,x-2,y-2,3,8,'#b4c8aa',.1);pcLeaf(c,x,y+12,3.1,.65);}
  pcLeaf(c,61,91,3,1.2);pcLeaf(c,66,99,-.1,1.3);c.restore();
}
function pcSpent(c,w,h){
  c.save();c.scale(w/128,h/128);pcEllipse(c,64,105,32,8,'rgba(62,82,70,.08)');
  for(const [x,y]of [[44,47],[73,35],[89,67]]){pcStem(c,[[62,105],[x,y]],1.8);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;pcEllipse(c,x+Math.cos(a)*6,y+Math.sin(a)*5,4,2,'#c2b4ad',a);}pcEllipse(c,x,y,4,4,'#9b9385');}
  pcLeaf(c,60,90,3.2,1);pcLeaf(c,65,98,.2,1.2);c.restore();
}
function pcHive(c,w,h){
  c.save();c.scale(w/192,h/224);pcEllipse(c,96,200,70,12,'rgba(59,85,73,.18)');
  pcPath(c,[[35,86],[96,41],[157,86],[153,188],[39,188]],pcGradient(c,0,80,0,190,[[0,'#d9c694'],[1,'#b6a16e']]),'#8d8469',2);
  for(let y=104;y<183;y+=17){c.fillStyle='#b3a477';c.fillRect(43,y,106,2);c.fillStyle='#eadcc0';c.fillRect(43,y+2,106,1);}
  pcPath(c,[[25,90],[96,32],[167,90],[157,99],[96,51],[35,99]],'#66877c','#486d65',2);pcPath(c,[[96,32],[167,90],[157,95],[96,45]],'#9caf99');
  pcPath(c,[[74,151],[79,139],[113,139],[118,151],[118,185],[74,185]],'#53675d');pcEllipse(c,96,149,17,8,'#344d46');c.fillStyle='#344d46';c.fillRect(79,148,34,35);
  c.fillStyle='#e7d9b5';c.fillRect(67,184,58,6);c.fillStyle='#9d9578';c.fillRect(38,190,116,8);
  for(const x of [47,145])for(const y of [105,178]){pcEllipse(c,x,y,2,2,'#7e806c');pcEllipse(c,x-.5,y-.7,.6,.6,'#f0e4bf');}c.restore();
}
function pcBee(c,w,h){
  c.save();c.scale(w/128,h/96);pcEllipse(c,59,56,37,19,'rgba(55,76,66,.12)');
  pcEllipse(c,55,48,34,18,pcGradient(c,0,30,0,66,[[0,'#f1d28b'],[.5,'#ddbb6f'],[1,'#b99b59']]));
  for(const x of [38,54,70]){c.save();c.beginPath();c.ellipse(55,48,34,18,0,0,Math.PI*2);c.clip();c.fillStyle='#53605a';c.fillRect(x,30,7,36);c.restore();}
  pcEllipse(c,90,47,16,15,'#52665d');pcEllipse(c,96,42,3,3,'#263f39');pcEllipse(c,97,41,1,1,'#eff4dc');
  pcStem(c,[[98,36],[108,27],[115,27]],1.6);pcStem(c,[[95,35],[103,23],[108,21]],1.5);
  for(const x of [44,60,76])pcStem(c,[[x,61],[x-4,70],[x+3,73]],1.4);
  pcPath(c,[[21,43],[13,48],[22,52]],'#627365');c.restore();
}
function pcWing(c,w,h){
  c.save();c.scale(w/96,h/96);pcPath(c,[[47,79],[21,50],[13,25],[24,13],[45,22],[58,49],[61,76]],'rgba(239,248,238,.87)','#9db8b0',1.2);
  pcPath(c,[[48,79],[60,40],[77,21],[89,29],[85,49],[65,76]],'rgba(225,239,230,.8)','#a0b9b2',1);
  c.strokeStyle='#c0d2c7';c.lineWidth=.8;c.beginPath();c.moveTo(49,74);c.lineTo(26,25);c.moveTo(49,74);c.lineTo(77,33);c.moveTo(38,53);c.lineTo(23,45);c.stroke();c.restore();
}
function pcPaper(c,w,h){
  c.fillStyle=pcGradient(c,0,0,w,h,[[0,'#e7eee3'],[.55,'#dce7dd'],[1,'#d0dfd4']]);c.fillRect(0,0,w,h);
  for(let i=0;i<220;i++){const x=(i*67+11)%w,y=(i*43+13)%h;pcEllipse(c,x,y,.8+(i%4)*.5,.25,'rgba(82,108,95,.065)');}
}
function pcPatch(c,w,h){
  const g=c.createRadialGradient(w/2,h/2,5,w/2,h/2,w*.48);g.addColorStop(0,'rgba(174,196,163,.42)');g.addColorStop(.7,'rgba(178,198,170,.16)');g.addColorStop(1,'rgba(178,198,170,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
}
const PC_ATLAS={builtins:[],tiles:[
  {name:'pc_clover',x:0,y:0,w:128,h:128,paint:pcFlower('clover')},{name:'pc_calendula',x:128,y:0,w:128,h:128,paint:pcFlower('calendula')},
  {name:'pc_bluestar',x:256,y:0,w:128,h:128,paint:pcFlower('bluestar')},{name:'pc_salvia',x:384,y:0,w:128,h:128,paint:pcFlower('salvia')},
  {name:'pc_aster',x:512,y:0,w:128,h:128,paint:pcFlower('aster')},{name:'pc_daisy',x:640,y:0,w:128,h:128,paint:pcFlower('daisy')},
  {name:'pc_hive',x:0,y:128,w:192,h:224,paint:pcHive},{name:'pc_bee',x:192,y:128,w:128,h:96,paint:pcBee},{name:'pc_wing',x:320,y:128,w:96,h:96,paint:pcWing},
  {name:'pc_bud',x:416,y:128,w:128,h:128,paint:pcBud},{name:'pc_spent',x:544,y:128,w:128,h:128,paint:pcSpent},
  {name:'pc_patch',x:0,y:800,w:256,h:128,paint:pcPatch},{name:'pc_paper',x:256,y:800,w:256,h:128,paint:pcPaper}
]};
const PC_INK='#355b51',PC_MUTED='#6b8174',PC_PURPLE='#8e739c',PC_WARN='#b5745b',PC_PAPER='#f4f2e5';
function pcCenter(r,t,x,y,size,color=PC_INK){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function pcSigned(n){return(n>0?'+':'')+n.toFixed(1);}
function pcDash(r,a,b,color,width=1){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(!len)return;for(let d=0;d<len;d+=13){const end=Math.min(len,d+6);r.line(a.x+dx*d/len,a.y+dy*d/len,a.x+dx*end/len,a.y+dy*end/len,width,color);}}
function pcBackdrop(r,s){
  r.sprite('pc_paper',480,270,960,540,0,'#fff');r.rect(14,52,708,430,'#e6ede0');r.line(28,57,28,478,1,'#c7d6c8');r.line(715,57,715,478,1,'#c7d6c8');
  for(const f of s.fields)r.sprite('pc_patch',f.x,f.y,154,138,0,'#fff');
  for(const group of s.swarms)if(group.flight){pcDash(r,group.flight.origin,{x:group.x,y:group.y},'#9eafa0',1.4);pcDash(r,{x:group.x,y:group.y},group.flight.destination,group.index===s.swarmCursor?'#859c8d':'#bac8ba',1);}
  r.sprite('pc_hive',s.hive.x,s.hive.y,94,118,0,'#fff');pcCenter(r,'HIVE',s.hive.x,s.hive.y-68,16);pcCenter(r,'HOME '+s.inventory.bees.home+' BEES',s.hive.x,s.hive.y+64,13,PC_MUTED);
}
function pcFieldIllustrations(r,s){
  for(const f of s.fields){const kind=f.bloomPhase==='open'?'pc_'+f.species:f.bloomPhase==='unopened'?'pc_bud':'pc_spent';r.sprite(kind,f.x,f.y-2,96,82,0,'#fff');}
}
function pcFieldLabel(r,t,x,y,size,color){const w=r.measureText(t,size);r.rect(x-w/2-2,y-1,w+4,size+2,'#e6ede0');r.text(t,x-w/2,y,size,color);}
function pcFields(r,s){
  for(const f of s.fields){
    const selected=f.index===s.fieldCursor,ratio=f.workTicks/f.requiredWorkTicks,pct=Math.floor(ratio*100);
    r.rect(f.x-70,f.y-67,140,20,selected?'#faf0d5':'#edf0e3');r.text(f.id+' '+f.species.toUpperCase(),f.x-65,f.y-64,14,PC_INK);
    if(selected){r.line(f.x-70,f.y-46,f.x+70,f.y-46,2,PC_PURPLE);}
    pcFieldLabel(r,(f.openTick/s.physics.tickHz).toFixed(0)+'-'+(f.closeTick/s.physics.tickHz).toFixed(0)+' s',f.x,f.y-43,13,PC_MUTED);
    r.rect(f.x-64,f.y+26,88,7,'#c6d5c4');r.rect(f.x-64,f.y+26,88*ratio,7,f.completed?'#5b9380':'#9e86ad');r.rect(f.x+29,f.y+21,r.measureText(pct+'%',13)+4,15,'#e6ede0');r.text(pct+'%',f.x+31,f.y+22,13,PC_INK);
    const bloom=f.bloomPhase==='unopened'?'SOON':f.bloomPhase.toUpperCase();pcFieldLabel(r,bloom+' / '+(f.unlocked?'UNLOCK':'LOCK'),f.x,f.y+39,13,f.bloomPhase==='closed'&&!f.completed?PC_WARN:PC_MUTED);
    pcFieldLabel(r,f.prerequisites.length?'NEED '+f.prerequisites.join('+'):'NO PREREQ',f.x,f.y+56,13,PC_MUTED);
    if(f.completed){r.line(f.x+52,f.y-37,f.x+57,f.y-32,2.5,'#4d8b74');r.line(f.x+57,f.y-32,f.x+66,f.y-43,2.5,'#4d8b74');}
  }
}
function pcGroupCallout(s,g){
  let x=g.x+(g.index===0?-45:20);const y=g.y-9;
  for(let pass=0;pass<s.fields.length;pass++){
    const f=s.fields.find(f=>x<f.x+72&&x+26>f.x-72&&[[-67,-47],[-44,-29],[21,36],[38,53],[55,70]].some(([a,b])=>y<f.y+b&&y+18>f.y+a));
    if(!f)break;x=g.index===0?f.x-102:f.x+76;
  }
  return{x,y};
}
function pcSwarms(r,s){
  for(const g of s.swarms){
    const angle=g.flight?Math.atan2(g.flight.nominalDirection.y,g.flight.nominalDirection.x):0,selected=g.index===s.swarmCursor;
    if(selected){r.circle(g.x,g.y,15,'#d8c6a5');r.circle(g.x,g.y,12,'#f4edce');}
    const wingScale=g.mode==='flying'?.8+.13*Math.sin(s.elapsed*22+g.index):.83;
    r.sprite('pc_wing',g.x,g.y-4,29,29*wingScale,angle,'#fff');r.sprite('pc_bee',g.x,g.y,34,26,angle,'#fff');
    const tag=pcGroupCallout(s,g);r.line(g.x+(g.index===0?-12:12),g.y,tag.x+(g.index===0?26:0),g.y,1,PC_MUTED);r.rect(tag.x,tag.y,26,18,selected?'#f8edcd':'#e9eee2');r.text(g.id,tag.x+3,tag.y+3,13,PC_INK);
    if(s.phase==='playing'&&g.workedLastInterval){r.circle(g.x-15,g.y-13,2,'#c9a77a');r.circle(g.x+15,g.y+11,2,'#d7c18a');}
  }
}
function pcActivity(s,g){
  if(g.mode==='flying')return'TO '+g.assignment.toUpperCase();
  if(g.mode==='home'){const row=s.lastInterval&&s.lastInterval.groups.find(x=>x.swarmId===g.id);return s.phase==='playing'&&row&&row.recoveryCredit>0?'RECOVERING':'AT HOME';}
  return(s.phase==='playing'&&g.workedLastInterval?'WORKING ':'AT ')+g.fieldId;
}
function pcNotebook(r,s){
  r.rect(734,56,210,426,'#d1d9c9');r.rect(738,56,206,423,PC_PAPER);r.line(748,61,748,474,1,'#d9c9bc');r.text('BEE GROUPS',760,68,15,PC_INK);
  for(const g of s.swarms){
    const y=94+g.index*111,selected=g.index===s.swarmCursor,warn=g.homeReserveTicks<0;
    r.rect(754,y,181,103,selected?'#e2e8d5':'#eceee0');if(selected)r.rect(754,y,3,103,PC_PURPLE);
    r.text(g.id,764,y+7,20,PC_INK);r.text(g.beeCount+' BEES',849,y+10,14,PC_MUTED);r.text(pcActivity(s,g),764,y+32,14,PC_MUTED);
    r.text('STAMINA '+g.remainingAwaySeconds.toFixed(1)+'s',764,y+53,17,warn?PC_WARN:PC_INK);r.rect(764,y+77,159,6,'#c5d1c1');r.rect(764,y+77,159*g.staminaTicks/g.staminaCapacityTicks,6,warn?'#b67a62':'#73a28a');
    r.text('HOME EST '+(g.directHomeTicks/s.physics.tickHz).toFixed(1)+'s',764,y+88,13,PC_MUTED);
  }
  const f=s.fields[s.fieldCursor],y=329;r.text(f.id+' / FIELD NOTES',760,y,15,PC_INK);
  r.text('BLOOM '+(f.openTick/s.physics.tickHz).toFixed(0)+'-'+(f.closeTick/s.physics.tickHz).toFixed(0)+'s',760,y+25,14,PC_MUTED);
  r.text('WORK '+f.workTicks+' / '+f.requiredWorkTicks,760,y+48,15,PC_INK);
  r.text(f.completed?'COMPLETED':'NOT COMPLETE',760,y+73,14,f.completed?'#4d8b74':PC_MUTED);
  r.text(f.unlocked?'UNLOCKED':'LOCKED',760,y+96,14,f.unlocked?PC_INK:PC_WARN);
  r.text(f.prerequisites.length?'NEEDS '+f.prerequisites.join(' + '):'NO PREREQUISITES',760,y+120,13,PC_MUTED);
}
function pcHeaderFooter(r,s){
  const done=s.fields.filter(f=>f.completed).length,g=s.swarms[s.swarmCursor],f=s.fields[s.fieldCursor];r.rect(0,0,960,45,PC_INK);r.text('POLLINATOR CONTRACT',22,13,21,'#f3f0db');r.text(s.levelNameEn.toUpperCase(),354,17,13,'#d8e4d4');r.text('FIELDS '+done+'/'+s.fields.length,790,16,15,'#eee0b7');
  r.rect(0,490,960,50,PC_INK);let action=s.phase==='won'?'ALL FIELDS COMPLETE / BOTH GROUPS HOME':s.phase==='lost'?'ENDED / '+s.lostReason.toUpperCase().replace(/-/g,' '):g.id+' TO '+f.id+' / A: DISPATCH / B: HOME';r.text(action,22,500,16,'#f4efd8');
  if(s.phase==='playing')r.text('EST HOME MARGIN '+pcSigned(g.homeReserveTicks/s.physics.tickHz)+'s',689,501,13,g.homeReserveTicks<0?'#efbb99':'#d8e4d4');
  r.text(s.phase==='playing'?'OPEN BLOOM + UNLOCKED TO WORK / BOTH GROUPS MUST RETURN':'FINAL FLOWER AND GROUP STATE',22,523,13,'#d1dfce');
}
window.GameDef={id:'pollinator-contract',title:'传粉契约',seed:729,accent:'#8f799e',background:'#dfe8dd',atlas:PC_ATLAS,holdConfirmAsA:false,
  description:'左右选花田，上下选蜂群。A 派遣或途中改航，B 召回。花期内且前置完成才能授粉；飞行和等待都耗耐力，到巢才恢复。全部花田完成后，两群都要回巢。',
  controls:{move:'左右选田 · 上下选群',a:'派遣改航 / 空格',b:'召回蜂巢 / B'},actionLabels:['派遣改航','召回蜂巢'],levelLabel:'花期',levelNames:['初夏双约','交错花期','暮园续契'],
  tip:'飞行与等待也耗耐力。回巢途中不算休息；完成全部花田后，记得召回两群。',winTitle:'花园契约完成',loseTitle:'本次花约结束',
  result(s){if(s.phase==='won')return'全部花田已完成，两群蜜蜂均已回巢。';if(s.lostReason==='exhausted')return'蜂群耐力耗尽。提前召回，到巢后才会恢复。';if(s.lostReason==='missed-bloom')return'有花田错过花期。先完成前置，再安排授粉。';return'天色已晚。完成花田后，还需让两群回巢。';},
  hud(s){const g=s.swarms[s.swarmCursor];return[{label:'已完成',value:s.fields.filter(f=>f.completed).length+' / '+s.fields.length,tone:''},{label:'所选蜂群',value:g.id,tone:''},{label:'耐力',value:g.remainingAwaySeconds.toFixed(1)+' s',tone:g.homeReserveTicks<0?'warn':''},{label:'剩余时间',value:Math.ceil(s.remaining)+' s',tone:s.remaining<10?'warn':''}];},
  render(r,s){pcBackdrop(r,s);pcFieldIllustrations(r,s);pcSwarms(r,s);pcFields(r,s);pcNotebook(r,s);pcHeaderFooter(r,s);}
};
