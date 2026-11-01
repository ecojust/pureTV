/* Hidden Corridors: a public survey chart, never the hidden wall map. */
(function(root){
'use strict';
/* Original fixed survey materials. No painter receives model state or wall data. */
function blueprintArt(c,w,h,a){
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#21445b'],[.45,'#183b50'],[1,'#102c40']]);c.fillRect(0,0,w,h);
 for(let x=0;x<=w;x+=16){c.strokeStyle=x%64?'#8bbcc313':'#9bced028';c.lineWidth=x%64?.55:1;c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke()}
 for(let y=0;y<=h;y+=16){c.strokeStyle=y%64?'#8bbcc313':'#9bced028';c.lineWidth=y%64?.55:1;c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}
 c.strokeStyle='#a0c4bd21';c.lineWidth=.8;for(let i=0;i<5;i++){c.beginPath();c.ellipse(w-27,h-12,26+i*17,13+i*8,-.6,0,Math.PI*2);c.stroke();}
 [[18,25],[w-20,19],[22,h-22]].forEach(([x,y])=>{c.strokeStyle='#c7dbcc5c';c.lineWidth=.8;c.beginPath();c.moveTo(x-6,y);c.lineTo(x+6,y);c.moveTo(x,y-6);c.lineTo(x,y+6);c.stroke();c.beginPath();c.arc(x,y,9,0,Math.PI*2);c.stroke()});
 c.fillStyle=a.radial(c,w*.3,h*.2,w*.7,[[0,'#7cbebc15'],[1,'#0b24381c']]);c.fillRect(0,0,w,h);
}
function unknownArt(c,w,h,a){
 c.fillStyle='#0b223580';c.fillRect(6,8,w-9,h-9);c.fillStyle=a.linear(c,0,0,w,h,[[0,'#456878'],[.4,'#2d5268'],[1,'#1d3f56']]);c.fillRect(3,3,w-8,h-9);
 c.strokeStyle='#a2c3c680';c.lineWidth=1.4;c.strokeRect(5,5,w-12,h-13);
 c.fillStyle='#1b4058';c.fillRect(13,13,w-28,h-29);c.strokeStyle='#729da95c';c.lineWidth=1;c.setLineDash([4,4]);c.strokeRect(14,14,w-30,h-31);c.setLineDash([]);
 c.strokeStyle='#aacdca16';c.lineWidth=.8;for(let y=25;y<h-20;y+=8){c.beginPath();c.moveTo(21,y);c.lineTo(w-24,y-3);c.stroke()}
 [[10,10],[w-14,10],[10,h-15],[w-14,h-15]].forEach(([x,y])=>{a.ellipse(c,x+1,y+1,2,2,'#102e3b');a.ellipse(c,x,y,1.3,1.3,'#bbd1c5')});
}
function openArt(c,w,h,a){
 c.fillStyle='#0b243d70';c.fillRect(6,8,w-9,h-9);c.fillStyle=a.linear(c,0,0,w,h,[[0,'#d7e9d6'],[.45,'#a9cfc5'],[1,'#73abae']]);c.fillRect(3,3,w-8,h-9);
 c.strokeStyle='#f1efda';c.lineWidth=1.5;c.strokeRect(5,5,w-12,h-13);c.fillStyle='#6ba0a5';c.fillRect(13,13,w-28,h-29);
 c.strokeStyle='#cfe9d26b';c.lineWidth=.7;for(let i=0;i<4;i++){let x=24+i*24;c.beginPath();c.moveTo(x,18);c.lineTo(x,h-22);c.stroke();let y=24+i*24;c.beginPath();c.moveTo(18,y);c.lineTo(w-23,y);c.stroke()}
 c.strokeStyle='#e9efd5';c.lineWidth=1.3;[[18,18,1,1],[w-24,18,-1,1],[18,h-24,1,-1],[w-24,h-24,-1,-1]].forEach(([x,y,dx,dy])=>{c.beginPath();c.moveTo(x+dx*10,y);c.lineTo(x,y);c.lineTo(x,y+dy*10);c.stroke()});
}
function wallArt(c,w,h,a){
 c.fillStyle='#0d263c8c';c.fillRect(6,8,w-9,h-9);c.fillStyle=a.linear(c,0,0,w,h,[[0,'#e3be8d'],[.4,'#b88a62'],[1,'#765643']]);c.fillRect(3,3,w-8,h-9);
 c.strokeStyle='#f6d6a2';c.lineWidth=1.3;c.strokeRect(5,5,w-12,h-13);c.fillStyle='#4e4d49';c.fillRect(13,13,w-28,h-29);
 c.save();c.beginPath();c.rect(15,15,w-32,h-33);c.clip();for(let x=-h;x<w;x+=16){a.path(c,[[x,0],[x+7,0],[x+h+7,h],[x+h,h]],'#ceaa7999')};c.restore();
 c.fillStyle='#293f48';c.fillRect(28,40,w-58,46);c.strokeStyle='#d2bc8b';c.lineWidth=1;c.strokeRect(28,40,w-58,46);
}
function compassArt(c,w,h,a){
 const x=w/2,y=h/2,r=Math.min(w,h)*.43;a.ellipse(c,x+2,y+3,r,r,'#0d233c77');a.ellipse(c,x,y,r,r,a.linear(c,0,0,w,h,[[0,'#e2bd88'],[.4,'#a97e54'],[.7,'#caa275'],[1,'#715840']]));a.ellipse(c,x,y,r-4,r-4,'#23465b');
 for(let i=0;i<16;i++){const an=i*Math.PI/8;c.strokeStyle=i%4?'#84b0b166':'#e8d6ad';c.lineWidth=i%4?.7:1.3;c.beginPath();c.moveTo(x+Math.sin(an)*(r-7),y-Math.cos(an)*(r-7));c.lineTo(x+Math.sin(an)*(r-(i%4?10:14)),y-Math.cos(an)*(r-(i%4?10:14)));c.stroke()}
 a.path(c,[[x,y-r+15],[x+7,y],[x,y+5],[x-7,y]],'#e8c08a','#fff0c4',.7);a.path(c,[[x,y+r-15],[x+7,y],[x,y-5],[x-7,y]],'#81b7b6','#b9d8c6',.7);a.ellipse(c,x,y,3.5,3.5,'#eee1b9');
}

const atlas={builtins:[],tiles:[
 {name:'survey_paper',x:0,y:0,w:512,h:224,paint:blueprintArt},
 {name:'survey_unknown',x:512,y:0,w:128,h:128,paint:unknownArt},
 {name:'survey_open',x:640,y:0,w:128,h:128,paint:openArt},
 {name:'survey_wall',x:768,y:0,w:128,h:128,paint:wallArt},
 {name:'survey_compass',x:896,y:0,w:128,h:128,paint:compassArt}
]};
const C={paper:'#ecedcf',muted:'#a9c9c6',cyan:'#b7e5d8',amber:'#f2c68a',navy:'#173e53',red:'#edafa0'};
function center(r,t,x,y,size,color){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function outline(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function label(c){return String.fromCharCode(65+c.col)+(c.row+1);}
function panel(r,x,y,w,h){r.rect(x+3,y+5,w,h,'#091d2a70');r.rect(x,y,w,h,'#14364bf2');outline(r,x,y,w,h,'#92b8b3a6');}
function chart(r,s){
 const g=s.grid,k=g.cellSize,w=g.cols*k,h=g.rows*k;
 r.rect(g.x-8,g.y-8,w+16,h+16,'#b6c9b1');outline(r,g.x-9,g.y-9,w+18,h+18,'#e8e8cb',1);
 for(let col=0;col<g.cols;col++)center(r,String.fromCharCode(65+col),g.x+(col+.5)*k,77,16,C.paper);
 for(let row=0;row<g.rows;row++){center(r,String(row+1),85,g.y+(row+.5)*k-8,17,C.paper);const y=g.y+row*k;panel(r,s.rowClueX-25,y+12,50,59);center(r,String(s.rowOpenCounts[row]),s.rowClueX,y+15,29,C.cyan);center(r,'OPEN',s.rowClueX,y+48,13,C.muted);}
 center(r,'ROW',s.rowClueX,77,14,C.muted);
 // The material choice depends exclusively on the public observation.
 s.cells.forEach(c=>r.sprite('survey_'+c.knowledge,c.x,c.y,k-2,k-2,0,'#fff'));
 const routeColor=s.phase==='won'?C.cyan:C.amber;
 for(let i=1;i<s.path.length;i++){const a=s.path[i-1],b=s.path[i];r.line(a.x,a.y,b.x,b.y,9,'#143a4de0');r.line(a.x,a.y,b.x,b.y,4,routeColor);}
 s.cells.forEach(c=>{
  if(c.knowledge==='unknown'){
   // A drawn hypothesis is not a probe: even a winning route retains question marks.
   r.circle(c.x,c.y,18,'#1b4058');center(r,'?',c.x,c.y-17,31,C.paper);
  }else if(c.knowledge==='wall'){center(r,'WALL',c.x,c.y-9,16,C.amber);}
  else{center(r,'OPEN',c.x,c.y-29,13,'#234f59');if(s.visited[c.id])r.circle(c.x,c.y,6,routeColor);else{r.circle(c.x,c.y,7,'#b6dacc');r.circle(c.x,c.y,4,'#72a7a9');}}
  if(c.role){r.rect(c.x-22,c.y+17,44,20,'#204a58');center(r,c.role==='entry'?'IN':'OUT',c.x,c.y+18,16,C.paper);}
  if(c.probed){r.circle(c.x+k/2-13,c.y+k/2-13,3,C.cyan);}
 });
 if(s.lastProbe&&s.elapsed<s.lastProbe.expiresAt&&s.lastProbe.result){const c=s.cells[s.lastProbe.cellId];outline(r,c.x-k/2+8,c.y-k/2+8,k-17,k-17,'#e8edcc',1.5);}
 if(s.phase==='playing'){const c=s.cursor;outline(r,c.x-k/2+1,c.y-k/2+1,k-3,k-3,C.amber,3);r.rect(c.x-k/2+2,c.y-k/2+2,10,5,C.amber);}
}
function ledger(r,s){
 panel(r,550,76,380,378);const x=570,playing=s.phase==='playing';
 let title=s.mode==='probe'?'PROBE MODE':'ROUTE MODE';if(s.phase==='won')title='ROUTE CERTIFIED';else if(s.phase==='lost')title='SURVEY COMPLETE';
 r.text(title,x,91,23,s.phase==='won'?C.cyan:C.paper);
 r.text('CURSOR '+label(s.cursor),x,125,16,C.amber);
 if(playing){r.text(s.mode==='probe'?(s.cells[s.selectedId].knowledge!=='unknown'?'A / CHECK KNOWN CELL':s.probesRemaining?'A / REVEAL ONE CELL':'A / NO PROBES LEFT'):'A / SUBMIT THIS ROUTE',x,153,16,C.paper);r.text(s.mode==='probe'?'B / DRAW FROM ENTRY':s.pathEdges>0?'B / REMOVE LAST EDGE':'B / RETURN TO PROBES',x,179,15,C.muted);}
 else{r.text(s.phase==='won'?'SAFE / EXACT EDGE COUNT':s.lostReason==='timeout'?'90 SECONDS COMPLETE':'THIRD EXHAUSTED STRIKE',x,153,16,s.phase==='won'?C.cyan:C.red);r.text('UNPROBED CELLS STAY UNKNOWN',x,179,14,C.muted);}
 r.line(x,208,910,208,1,'#7ba5ac8c');
 r.text('REQUIRED',x,222,14,C.muted);r.text('DRAWN',752,222,14,C.muted);
 r.text(String(s.requiredDistance),x,244,34,C.paper);r.text('EDGES',x+56,260,15,C.muted);
 r.text(String(s.pathEdges),752,244,34,s.lengthMatches?C.cyan:C.amber);r.text('EDGES',808,260,15,C.muted);
 r.text(s.atExit?'AT EXIT':'NOT AT EXIT',x,292,14,s.atExit?C.cyan:C.muted);r.text(s.lengthMatches?'LENGTH MATCH':'LENGTH DIFFERS',752,292,14,s.lengthMatches?C.cyan:C.muted);
 r.line(x,321,910,321,1,'#7ba5ac8c');
 r.text('WRONG TOTAL',x,335,13,C.muted);r.text('STRIKES AT ZERO',752,335,13,C.muted);
 r.text(String(s.totalWrong),x,358,27,C.paper);r.text(s.exhaustedStrikes+' / '+s.maxExhaustedStrikes,752,358,27,s.exhaustedStrikes?C.red:C.paper);
 let note='STRIKES COUNT ONLY WITH 0 PROBES';
 if(s.lastSubmission&&!s.lastSubmission.accepted&&s.phase==='playing'){
  const v=s.lastSubmission;note=v.reason==='unsafe'?'LAST SUBMIT: ROUTE NOT SAFE':v.reason==='length'?'LAST SUBMIT: WRONG EDGE COUNT':v.reason==='endpoint'?'LAST SUBMIT: EXIT NOT REACHED':'LAST SUBMIT: INVALID SHAPE';
 }
 r.text(note,x,405,13,C.muted);r.text(s.mode==='route'?'LINE = YOUR MARKED ROUTE':'ROW COUNTS INCLUDE ALL OPEN CELLS',x,429,13,C.muted);
}
function legend(r,s){
 const y=464;r.text('?',112,y-5,22,C.paper);r.text('UNKNOWN',132,y,13,C.muted);r.rect(230,y+2,9,9,C.cyan);r.text('OPEN',247,y,13,C.muted);r.rect(302,y+2,9,9,C.amber);r.text('WALL',319,y,13,C.muted);r.line(380,y+7,398,y+7,3,s.phase==='won'?C.cyan:C.amber);r.text('ROUTE',407,y,13,C.muted);
}
function status(r,s){
 r.rect(28,496,902,33,'#102b40ed');r.line(28,496,930,496,1,'#89b2b5');
 const text=s.phase==='won'?'VERIFIED ROUTE / UNPROBED CELLS STILL UNKNOWN':s.phase==='lost'?'ROUND COMPLETE / OBSERVATIONS PRESERVED':s.mode==='probe'?'DIRECTIONS / SELECT A CELL':s.atExit?'AT EXIT / A SUBMIT, B BACKTRACK':'DIRECTIONS / EXTEND ONE EDGE';
 r.text(text,42,505,14,s.phase==='won'?C.cyan:C.paper);
 const p='PROBES '+s.probesRemaining+' / '+s.probeBudget;r.text(p,914-r.measureText(p,20),501,20,s.probesRemaining===0?C.amber:C.paper);
}
function scene(r,s){
 r.sprite('survey_paper',480,270,960,540,0,'#fff');r.rect(0,0,960,54,'#122e42e8');r.line(0,54,960,54,1,'#91b7b18c');r.text('HIDDEN CORRIDORS',25,15,23,C.paper);r.text('FIELD SHEET / '+String(s.level).padStart(2,'0'),706,22,14,C.muted);
 r.sprite('survey_compass',42,111,57,57,0,'#fff');r.text('N',36,71,13,C.amber);chart(r,s);ledger(r,s);legend(r,s);status(r,s);
}
root.GameDef={
 id:'hidden-corridors',title:'隐墙测绘',tagline:'依据行提示与探测，画出恰好步数的通路',seed:281,
 accent:'#a9d1cd',background:'#16374c',levelLabel:'测区',levelNames:['初测','绕行','合勘'],atlas,
 description:'每行数字是可通行格数，步数按连线边数计算。探测模式方向选格，A 揭示一格，B 从入口连线。连线时 A 提交，B 退一步，退到入口再按 B 返回探测。探测用尽后，错误提交三次失败；限时 90 秒。',
 controls:{move:'方向键 / 摇杆 · 选格 / 连线',a:'探测 / 提交 · 空格 / 确认 / 右上半屏',b:'连线 / 退一步 · B / 右下半屏'},actionLabels:['探测 / 提交','连线 / 退一步'],
 tip:'画线不揭墙，重复探测免费；回退保留探针消耗、用时和错误次数。',
 winTitle:'路线已核准',loseTitle:'测绘待重试',
 result(s){if(s.phase==='won')return '通路安全，步数符合提示。未探测格仍保持未知。';if(s.lostReason==='timeout')return '90 秒已到。先核对行提示，再规划探测与路线。';return '探测用尽后已错三次。重试时核对行提示和步数。';},
 hud(s){return[
  {label:'剩余探测',value:s.probesRemaining+' / '+s.probeBudget,tone:s.probesRemaining===0?'warn':''},
  {label:'已画 / 所需步数',value:s.pathEdges+' / '+s.requiredDistance},
  {label:'当前模式',value:s.phase==='won'?'路线核准':s.phase==='lost'?'本轮结束':s.mode==='probe'?'探测选格':'路线连线'},
  {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
 ];},render(r,s){scene(r,s);}
};
})(window);
