/* Loop Orchard: public graph, finite physical pipes, and explicit irrigation check. */
(function(root){
'use strict';
// Original fixed artwork; no puzzle state, clues, or accepted loop enter these painters.
function groundArt(c,w,h,a){
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#9fab77'],[.38,'#718963'],[1,'#526d56']]);c.fillRect(0,0,w,h);
 for(let i=0;i<85;i++){const x=(i*73+19)%w,y=(i*41+7)%h,rx=9+(i%7)*3;a.ellipse(c,x,y,rx,rx*.45,i%3?'#c8ce8e12':'#294e4020');}
 a.path(c,[[0,h*.84],[w*.3,h*.62],[w*.8,h*.73],[w,h*.59],[w,h],[0,h]],'#d7bd8b22');
 c.strokeStyle='#d6ddac1c';c.lineWidth=.6;for(let i=0;i<130;i++){const x=(i*47+13)%w,y=(i*29+3)%h;c.beginPath();c.moveTo(x,y);c.lineTo(x-1.2,y-3.5);c.lineTo(x+2,y-1.2);c.stroke();}
 c.fillStyle=a.radial(c,w*.25,h*.17,w*.7,[[0,'#fff6b823'],[1,'#143d3310']]);c.fillRect(0,0,w,h);
}
function treeArt(c,w,h,a){
 c.save();c.scale(w/128,h/128);a.ellipse(c,65,110,37,10,'#28433559');
 a.path(c,[[56,74],[70,74],[73,110],[63,118],[55,110]],a.linear(c,55,75,73,113,[[0,'#b58b51'],[1,'#6a5035']]),'#5a5139',1);
 a.path(c,[[62,94],[44,74],[48,70],[66,85],[81,69],[85,73],[68,97]],'#986f45');
 const tufts=[[41,50,29,27],[75,37,29,28],[92,64,27,26],[57,78,34,28],[37,71,24,23],[67,55,37,32]];
 tufts.forEach(([x,y,rx,ry],i)=>a.ellipse(c,x,y,rx,ry,a.radial(c,x-9,y-12,rx*1.6,[[0,i%2?'#c1cd75':'#b7cb76'],[.42,i%2?'#729b60':'#83a85e'],[1,'#386851']])));
 [[34,48],[57,35],[80,62],[48,75],[82,36],[99,65]].forEach(([x,y],i)=>{a.ellipse(c,x+1,y+2,6.3,6.5,'#56763b');a.ellipse(c,x,y,6.2,6.2,i%2?'#e5ae5d':'#e9c475');a.ellipse(c,x-1.7,y-2,2.4,2,'#fff0b6');});
 a.path(c,[[40,50],[45,43],[50,47],[45,52]],'#e1dfa464');c.restore();
}
function flowerArt(c,w,h,a){
 c.save();c.scale(w/128,h/128);a.ellipse(c,65,105,41,13,'#304e3652');
 a.path(c,[[20,86],[36,64],[54,73],[63,54],[79,70],[107,64],[99,104],[67,118],[29,108]],'#4f7957','#91a16e',2);
 [[43,59,17],[79,44,19],[87,87,17],[43,91,15]].forEach(([x,y,r],i)=>{for(let k=0;k<5;k++){const angle=k*Math.PI*.4-Math.PI/2;a.ellipse(c,x+Math.cos(angle)*r*.65,y+Math.sin(angle)*r*.65,r*.57,r*.57,a.radial(c,x-3,y-4,r*1.5,[[0,'#f7cfb7'],[.6,i%2?'#d38a85':'#e3a5a1'],[1,'#a75e6c']]))}a.ellipse(c,x,y,r*.29,r*.29,'#f3d28d');a.ellipse(c,x-1.5,y-2,r*.11,r*.11,'#fff3c4')});c.restore();
}
function junctionArt(c,w,h,a){
 c.save();c.scale(w/128,h/128);a.ellipse(c,65,76,47,39,'#2f49365e');
 a.ellipse(c,64,61,47,43,a.linear(c,25,22,95,106,[[0,'#e4d4b1'],[.48,'#bca988'],[1,'#81785d']]),'#756b51');
 a.ellipse(c,64,59,35,32,'#8a8467');a.ellipse(c,64,57,30,27,'#c3b496');
 a.ellipse(c,64,58,14,13,a.radial(c,60,52,25,[[0,'#839282'],[1,'#435f53']]))
 c.strokeStyle='#e7d9b7';c.lineWidth=2;c.beginPath();c.arc(64,57,35,-Math.PI*.9,-Math.PI*.15);c.stroke();c.restore();
}
function plotArt(c,w,h,a){
 c.save();c.scale(w/128,h/128);a.path(c,[[12,12],[115,10],[120,113],[13,118],[7,65]],'#314f3f32');
 a.path(c,[[11,7],[117,9],[114,112],[10,114]],a.linear(c,0,0,128,128,[[0,'#f3e5bd'],[.55,'#e9d9b4'],[1,'#d8c7a4']]),'#f9edcd',1.5);
 c.strokeStyle='#86775412';c.lineWidth=.7;for(let v=14;v<114;v+=4){c.beginPath();c.moveTo(11,v);c.lineTo(115,v-1);c.stroke();c.beginPath();c.moveTo(v,10);c.lineTo(v+1,113);c.stroke();}
 c.setLineDash([3,4]);c.strokeStyle='#a2936b73';c.lineWidth=1;c.strokeRect(17,16,94,91);c.restore();
}
function pipeArt(c,w,h,a){
 c.save();c.scale(w/224,h/64);c.fillStyle='#2a443d4a';c.fillRect(0,24,224,24);
 c.fillStyle=a.linear(c,0,13,0,47,[[0,'#ebbf90'],[.18,'#d6a079'],[.46,'#a96948'],[.78,'#85543c'],[1,'#583c2f']]);c.fillRect(0,13,224,32);
 c.fillStyle='#efc897';c.fillRect(0,15,224,3);c.fillStyle='#644538';c.fillRect(0,29,224,7);
 for(const x of[13,210]){c.fillStyle='#d6a47e';c.fillRect(x-4,11,8,36);c.fillStyle='#ffe0ab8c';c.fillRect(x-3,12,2,31);c.fillStyle='#70452f';c.fillRect(x+3,14,2,31);}
 c.strokeStyle='#f5c79a24';c.lineWidth=.5;for(let x=22;x<204;x+=13){c.beginPath();c.moveTo(x,19);c.lineTo(x+4,24);c.stroke();}c.restore();
}
const atlas={builtins:[],tiles:[
 {name:'orchard_ground',x:0,y:0,w:512,h:224,paint:groundArt},
 {name:'orchard_tree',x:512,y:0,w:128,h:128,paint:treeArt},
 {name:'orchard_flower',x:640,y:0,w:128,h:128,paint:flowerArt},
 {name:'orchard_junction',x:768,y:0,w:128,h:128,paint:junctionArt},
 {name:'orchard_plot',x:896,y:0,w:128,h:128,paint:plotArt},
 {name:'orchard_pipe',x:0,y:224,w:224,h:64,paint:pipeArt}
]};
const C={ink:'#29483f',paper:'#f5e9c9',muted:'#bfcbb1',dry:'#b97d54',ok:'#80d2b8',warn:'#f1b098',water:'#8ee5df',dark:'#28483de8'};
function center(r,t,x,y,size,color){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function outline(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function vertex(s,id){return s.vertices.find(v=>v.id===id);}
function edge(s,id){return s.edges.find(e=>e.id===id);}
function dash(r,a,b,color,width=1.5){const dx=b.x-a.x,dy=b.y-a.y;for(let j=0;j<8;j++){const lo=(j+.18)/8,hi=(j+.58)/8;r.line(a.x+dx*lo,a.y+dy*lo,a.x+dx*hi,a.y+dy*hi,width,color);}}
function tick(r,x,y,good,color){r.circle(x,y,6.5,'#172f29');if(good){r.line(x-3,y,x-.5,y+2.6,1.8,color);r.line(x-.5,y+2.6,x+3.6,y-3,1.8,color);}else{r.line(x-2.7,y-2.7,x+2.7,y+2.7,1.6,color);r.line(x-2.7,y+2.7,x+2.7,y-2.7,1.6,color);}}
function plots(r,s){
 const focused=edge(s,s.selectedId);
 s.plots.forEach(p=>{
  r.sprite('orchard_plot',p.x,p.y+3,79,65,0,'#fff');
  if(s.phase==='playing'&&focused&&focused.plotIds.includes(p.id))outline(r,p.x-37,p.y-25,74,57,'#ffe7a6',1.5);
  if(p.clue===null){center(r,p.id+' / NO CLUE',p.x,p.y-20,13,'#65705b');r.line(p.x-9,p.y+3,p.x+9,p.y+3,2.6,'#6b745f');center(r,'COUNT '+p.selectedCount,p.x,p.y+15,13,'#65705b');}
  else{center(r,p.id+' / PIPES',p.x,p.y-20,13,'#68705a');center(r,p.selectedCount+' / '+p.clue,p.x,p.y-2,28,p.matched?'#277560':C.ink);if(p.matched)r.line(p.x-23,p.y+30,p.x+23,p.y+30,2,'#38846a');}
 });
}
function garden(r,s){
 s.edges.forEach(e=>{const a=vertex(s,e.aId),b=vertex(s,e.bId);if(!e.selected)dash(r,a,b,'#e1d4a54a',1.3);});
 plots(r,s);
 s.edges.forEach(e=>{if(!e.selected)return;const a=vertex(s,e.aId),b=vertex(s,e.bId),angle=Math.atan2(b.y-a.y,b.x-a.x);r.sprite('orchard_pipe',e.x,e.y,Math.hypot(b.x-a.x,b.y-a.y),24,angle,'#fff');if(s.phase==='won')r.line(a.x,a.y,b.x,b.y,3.2,C.water);});
 s.vertices.forEach(v=>{
  const goodDegree=v.degree===0||v.degree===2;
  r.circle(v.x,v.y,12,goodDegree?'#d8c5a1':'#d78a70');r.circle(v.x,v.y,8,'#536b54');
  if(v.role==='tree')r.sprite('orchard_tree',v.x,v.y-10,45,48,0,'#fff');
  else if(v.role==='flower'){r.sprite('orchard_flower',v.x,v.y-7,43,43,0,'#fff');r.circle(v.x+14,v.y-15,6.5,'#f4dec0');r.line(v.x+10,v.y-19,v.x+18,v.y-11,2.1,'#994e57');}
  else r.sprite('orchard_junction',v.x,v.y,22,22,0,'#fff');
  if(s.phase==='won'&&v.onPipe)r.circle(v.x,v.y+5,3.2,C.water);
  const label=v.id+':'+v.degree;r.rect(v.x-27,v.y+13,54,18,'#315646eb');center(r,label,v.x,v.y+14,16,goodDegree?C.paper:C.warn);
 });
 s.edges.forEach(e=>{if(e.selected){const label=e.pipeId,w=r.measureText(label,16)+8;r.rect(e.x-w/2,e.y-8,w,18,'#825438');center(r,label,e.x,e.y-7,16,C.paper);}});
 const selected=edge(s,s.selectedId);
 if(selected&&s.phase==='playing'){const a=vertex(s,selected.aId),b=vertex(s,selected.bId);r.circle(selected.x,selected.y,18,'#ffe6a126');outline(r,selected.x-18,selected.y-14,36,28,'#ffefbd',2.2);for(const v of[a,b])r.line(v.x-18,v.y+34,v.x+18,v.y+34,2.1,'#ffe6a1');}
 r.sprite('orchard_tree',92,468,18,18,0,'#fff');r.text('REQUIRED TREE',110,463,13,C.paper);
 r.sprite('orchard_flower',263,468,18,18,0,'#fff');r.text('AVOID FLOWER',280,463,13,C.paper);
 r.sprite('orchard_junction',429,468,16,16,0,'#fff');r.text('OPTIONAL',443,463,13,C.paper);
}
function checks(r,s){
 const rows=[['DRAWN',s.checks.hasPipes],['DEGREE 2',s.checks.degreeTwo],['ONE LOOP',s.checks.singleLoop],['TREES '+s.treesCovered+'/'+s.requiredTreeIds.length,s.checks.trees],['FLOWERS',s.checks.flowers],['CLUES '+s.matchedClueCount+'/'+s.clueCount,s.checks.clues]];
 rows.forEach(([label,good],i)=>{const x=629+(i%2)*145,y=225+Math.floor(i/2)*25;tick(r,x,y+8,good,good?C.ok:C.warn);r.text(label,x+14,y,15,good?C.paper:C.warn);});
}
function inventory(r,s){
 r.text('FREE PIPES '+s.pipesRemaining+' / '+s.pipeStock,620,305,17,C.paper);
 const selected=edge(s,s.selectedId);
 s.pipes.forEach((p,i)=>{const x=621+(i%8)*35,y=332+Math.floor(i/8)*24;const free=p.edgeId===null;r.rect(x,y,31,20,free?'#d9c7a3':'#946546');center(r,p.id,x+15.5,y+3,13,free?C.ink:C.paper);if(selected&&selected.pipeId===p.id)outline(r,x-1,y-1,33,22,'#fff0b5',1.7);});
}
function panel(r,s){
 r.rect(602,65,330,393,C.dark);outline(r,602,65,330,393,'#acbf9e',1);
 const selected=edge(s,s.selectedId);
 if(selected){const a=vertex(s,selected.aId),b=vertex(s,selected.bId);r.text('EDGE '+selected.id,620,79,25,C.paper);r.text(selected.selected?'PIPE '+selected.pipeId+' / PLACED':s.pipesRemaining?'EMPTY / NEXT '+s.availablePipeIds[0]:'EMPTY / STOCK USED',620,112,17,selected.selected?C.paper:s.pipesRemaining?C.muted:C.warn);
  r.text(a.id+'('+a.degree+') - '+b.id+'('+b.degree+')',620,139,17,C.paper);
  selected.plotIds.forEach((id,i)=>{const p=s.plots.find(p=>p.id===id);r.text(id+': '+p.selectedCount+(p.clue===null?' / NO CLUE':' / '+p.clue),620+i*150,170,15,p.clue===null?C.muted:p.matched?C.ok:C.paper);});
 }else{r.text('PUMP CHECK',620,79,25,C.paper);r.text(s.phase==='won'?'ALL CHECKS ACCEPTED':s.phase==='lost'?'ROUND COMPLETE':s.goalReady?'READY / A TO START':'REVIEW EVERY CHECK',620,114,17,s.goalReady?C.ok:C.paper);r.text(s.phase==='won'?'IRRIGATION ACCEPTED':'NO WATER BEFORE ACCEPTANCE',620,143,14,s.phase==='won'?C.water:C.muted);r.text('UNUSED STOCK IS ALLOWED',620,170,14,C.muted);}
 r.text('GROUPS '+s.componentCount+' / LEAKS '+s.leakIds.length+' / BRANCHES '+s.branchIds.length,620,199,13,C.muted);
 checks(r,s);inventory(r,s);
 const p=s.pump,x=p.x-124,y=p.y-28,focused=s.phase==='playing'&&s.selectedId===p.id;r.rect(x,y,248,55,s.goalReady?'#4f8068':'#68775a');outline(r,x,y,248,55,focused?'#fff0b4':'#b6c49b',focused?2.5:1);
 center(r,s.phase==='won'?'PUMP / IRRIGATION ACCEPTED':s.phase==='lost'?'PUMP / ROUND COMPLETE':s.selectedId===p.id?'PUMP / A START':'PUMP / SELECT TO CHECK',p.x,y+8,16,C.paper);
 center(r,s.phase==='won'?'ONE LOOP / ALL CHECKS MET':'ALL CHECKS REQUIRED',p.x,y+32,13,C.paper);
}
function status(r,s){
 r.rect(28,479,904,51,'#2c4e40ec');r.line(28,479,932,479,1.2,'#b7c49e');let title,help;
 if(s.phase==='won'){title='ONE LOOP / IRRIGATION ACCEPTED';help='ALL CHECKS MET / UNUSED PIPES ALLOWED';}
 else if(s.phase==='lost'){title=s.lostReason==='timeout'?'90 SECONDS COMPLETE':'THIRD REJECTED PUMP START';help='ROUND COMPLETE / PIPE DRAWING PRESERVED';}
 else if(s.selectedId==='pump'){title=s.goalReady?'READY FOR EXPLICIT PUMP START':'REVIEW THE LOOP AND PLOT CLUES';help=s.historyDepth?'A START PUMP / B UNDO LAST EDIT':'A START PUMP / NO EDIT TO UNDO';}
 else{const e=edge(s,s.selectedId);title=e.selected?'SELECT '+e.id+' / PIPE '+e.pipeId:'SELECT '+e.id+' / EMPTY EDGE';help=(e.selected?'A REMOVE PIPE':s.pipesRemaining?'A PLACE PIPE':'STOCK EMPTY / SELECT A PIPE TO REMOVE')+(s.historyDepth?' / B UNDO':' / NO UNDO');}
 r.text(title,43,486,18,s.phase==='lost'?C.warn:C.paper);r.text(help,43,512,13,C.muted);const errors='ERRORS '+s.mistakes+'/'+s.maxMistakes;r.text(errors,914-r.measureText(errors,19),486,19,s.mistakes?C.warn:C.paper);
}
function scene(r,s){r.sprite('orchard_ground',480,270,960,540,0,'#fff');r.rect(0,0,960,52,'#2c4b3e');r.text('LOOP ORCHARD',25,14,25,C.paper);r.text('COUNT / CLUE',359,23,14,C.muted);r.text('V#: DEGREE',529,23,14,C.muted);r.text('GARDEN / '+String(s.level).padStart(2,'0'),769,22,14,C.muted);garden(r,s);panel(r,s);status(r,s);}
root.GameDef={
 id:'loop-orchard',title:'环线果园',tagline:'绕成一个环，再启动灌溉',seed:347,accent:'#b9cfa3',background:'#6e895e',levelLabel:'果园',levelNames:['初枝','绕花','四树'],atlas,
 description:'方向选边，A 铺管或拆管，B 撤销。管线须形成一个闭环，接入所有果树，避开花圃，并满足数字区域的边界管数。横杠表示无提示。选 PUMP 按 A 启泵，三错或 90 秒结束。',
 controls:{move:'方向键 / 摇杆 · 选边',a:'铺管·拆管·启泵 / 空格',b:'撤销 / B'},actionLabels:['铺管 / 拆管','撤销'],
 tip:'横杠无目标，余管可保留。撤销不退时间或错次。',
 winTitle:'环线灌溉完成',loseTitle:'果园待修整',
 result(s){if(s.phase==='won')return '单一闭环通过检查，果树灌溉完成。';if(s.lostReason==='timeout')return '90 秒已到。先核对数字，再检查闭环。';const reason=s.lastSubmission&&s.lastSubmission.reason;return ({empty:'三次启泵失败。先铺设管线再启动水泵。',branch:'三次启泵失败。管线不能出现分叉。',leak:'三次启泵失败。接入节点都需连接两段管。','multiple-loops':'三次启泵失败。管线必须连成同一个环。',trees:'三次启泵失败。仍有果树未接入管线。',flower:'三次启泵失败。请避开禁水花圃。',clues:'三次启泵失败。请核对区域边界管数。'})[reason]||'本轮结束。重新检查管线与区域提示。';},
 hud(s){return[
  {label:'剩余管段',value:s.pipesRemaining+' / '+s.pipeStock},
  {label:'果树接入',value:s.treesCovered+' / '+s.requiredTreeIds.length,tone:s.allTreesCovered?'':'warn'},
  {label:s.phase==='won'?'灌溉完成':s.phase==='lost'?'本轮结束':'数字区域',value:s.matchedClueCount+' / '+s.clueCount,tone:s.allCluesMet?'':'warn'},
  {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
 ];},render(r,s){scene(r,s);}
};
})(window);
