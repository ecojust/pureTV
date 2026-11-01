/* Path Glyphs: public stone inscriptions, actual occupied route and emitted sequence. */
(function(root){
'use strict';
function gardenArt(c,w,h,a){
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#68786d'],[.48,'#4a6059'],[1,'#263e3c']]);c.fillRect(0,0,w,h);
 for(let row=0;row<9;row++){
  const y=row*29-12;c.strokeStyle='#b4bba047';c.lineWidth=1;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(w*.25,y+15,w*.7,y-9,w,y+6);c.stroke();
  c.strokeStyle='#172f2d40';c.beginPath();c.moveTo(0,y+3);c.bezierCurveTo(w*.25,y+18,w*.7,y-6,w,y+9);c.stroke();
 }
 let seed=319;for(let i=0;i<120;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%w;seed=(seed*1664525+1013904223)>>>0;const y=seed%h;a.ellipse(c,x,y,1.5+(i%4),.6+(i%3)*.3,i%3?'#c5c8aa20':'#112d2b30');}
 [[21,183],[452,21],[493,201]].forEach(([x,y],j)=>{
  for(let k=0;k<9;k++){const xx=x+Math.sin(k*2+j)*26,yy=y+Math.cos(k*3)*14;a.ellipse(c,xx+2,yy+3,12,5,'#15312f55');a.ellipse(c,xx,yy,11,5,a.linear(c,xx-8,yy-5,xx+8,yy+5,[[0,'#a6b19a'],[.6,'#6c8174'],[1,'#3c5650']]))}
 });
}
function slabArt(c,w,h,a){
 c.fillStyle='#142e2d90';c.fillRect(7,10,w-12,h-12);
 a.path(c,[[6,5],[w-10,5],[w-4,11],[w-4,h-8],[w-11,h-3],[6,h-3],[2,h-9],[2,11]],'#52695f');
 a.path(c,[[7,4],[w-11,4],[w-5,10],[w-5,h-13],[w-11,h-7],[7,h-7],[3,h-13],[3,10]],a.linear(c,0,0,w,h,[[0,'#e6e1c9'],[.45,'#c8cfb9'],[1,'#9eafa0']]),'#dce2cb',1.5);
 c.strokeStyle='#f7efd5a8';c.lineWidth=2;c.beginPath();c.moveTo(9,h-17);c.lineTo(9,10);c.lineTo(w-17,10);c.stroke();
 c.strokeStyle='#708f8277';c.lineWidth=2;c.beginPath();c.moveTo(w-10,15);c.lineTo(w-10,h-14);c.lineTo(15,h-14);c.stroke();
 for(let i=0;i<24;i++){const x=14+(i*37)%(w-28),y=16+(i*53)%(h-34);c.fillStyle=i%3?'#536e5f13':'#fff8dc25';c.fillRect(x,y,1+i%3,.7);}
 c.strokeStyle='#738c7b30';c.lineWidth=.8;c.beginPath();c.moveTo(17,h*.34);c.lineTo(33,h*.28);c.lineTo(40,h*.3);c.moveTo(w-19,h*.7);c.lineTo(w-32,h*.76);c.stroke();
}
function wallArt(c,w,h,a){
 c.fillStyle='#142f2caa';c.fillRect(6,10,w-10,h-12);
 a.path(c,[[7,12],[w-9,12],[w-3,22],[w-3,h-8],[7,h-3],[2,h-13],[2,23]],'#344c46');
 a.path(c,[[10,5],[w-14,5],[w-5,14],[w-9,h-16],[12,h-16],[4,h-23],[4,15]],a.linear(c,0,0,w,h,[[0,'#8b9b86'],[.45,'#667c6a'],[1,'#435c50']]),'#a9b39a',1.8);
 a.path(c,[[14,15],[w-21,15],[w-14,23],[w-16,h-28],[18,h-28],[12,h-33]],'#536c5c','#7e927a',2);
 c.strokeStyle='#263f35';c.lineWidth=3;c.beginPath();c.moveTo(22,24);c.lineTo(w-24,h-35);c.moveTo(w-24,24);c.lineTo(22,h-35);c.stroke();
 for(let i=0;i<8;i++)a.ellipse(c,12+i*11,h-19+(i%2)*3,8,3,i%2?'#a3ae744c':'#485e35aa');
}
function foliageArt(c,w,h,a){
 c.save();c.translate(w*.5,h*.8);
 for(let branch=0;branch<5;branch++){
  const angle=-1.2+branch*.52;c.save();c.rotate(angle);c.strokeStyle='#153c35';c.lineWidth=4;c.beginPath();c.moveTo(0,8);c.quadraticCurveTo(-10,-40,0,-110);c.stroke();
  for(let i=0;i<5;i++){const y=-17-i*17,side=i%2?1:-1;a.path(c,[[0,y],[side*31,y-21],[side*43,y-20],[side*36,y-6],[0,y+3]],a.linear(c,0,y-15,side*38,y,[[0,'#426e52'],[.55,'#86a66b'],[1,'#385d47']]),'#8eac7022',1);}
  c.restore();
 }c.restore();
}
const atlas={builtins:['ring','shadow'],tiles:[
 {name:'glyph_garden',x:0,y:0,w:512,h:224,paint:gardenArt},
 {name:'glyph_slab',x:512,y:0,w:128,h:128,paint:slabArt},
 {name:'glyph_wall',x:640,y:0,w:128,h:128,paint:wallArt},
 {name:'glyph_foliage',x:0,y:800,w:224,h:224,paint:foliageArt}
]};
const C={ink:'#254b47',dark:'#183b38',light:'#eee8cd',muted:'#a9c0ad',jade:'#8ed7c5',gold:'#f0c67f',red:'#efa58d'};
const vectors={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]};
function center(r,t,x,y,n,c){r.text(t,x-r.measureText(t,n)/2,y,n,c);}
function outline(r,x,y,w,h,color,width=1){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function glyph(r,symbol,cx,cy,size,color,width=3){
 const d=vectors[symbol];if(!d)return;const dx=d[0],dy=d[1],half=size*.5,head=size*.34;
 r.line(cx-dx*half,cy-dy*half,cx+dx*half,cy+dy*half,width,color);
 r.line(cx+dx*half,cy+dy*half,cx+dx*(half-head)-dy*head*.75,cy+dy*(half-head)+dx*head*.75,width,color);
 r.line(cx+dx*half,cy+dy*half,cx+dx*(half-head)+dy*head*.75,cy+dy*(half-head)-dx*head*.75,width,color);
}
function panel(r,x,y,w,h){r.rect(x+3,y+5,w,h,'#112e2c55');r.rect(x,y,w,h,'#1d3f3ce8');outline(r,x,y,w,h,'#819d8580');r.line(x+1,y+1,x+w-1,y+1,1,'#c7ceaa88');}
function entryMarker(r,side,x,y,size){
 if(!side)return;const d=vectors[side],at=size*.43,dx=d[0],dy=d[1];
 r.rect(x+dx*at-(dx?2.5:12),y+dy*at-(dy?2.5:12),dx?5:24,dy?5:24,'#5a5237');
 r.rect(x+dx*(at-1)-(dx?1.3:10),y+dy*(at-1)-(dy?1.3:10),dx?2.6:20,dy?2.6:20,C.gold);
 const tx=x+dx*(at-11),ty=y+dy*(at-11)-7;center(r,side,tx,ty,13,'#544b31');
}
function sequence(r,s){
 panel(r,24,82,250,390);r.text('TARGET',39,97,17,C.light);r.text(String(s.target.length)+' RUNES',160,100,13,C.muted);
 function tokens(list,top,actual){
  list.forEach((symbol,i)=>{const x=39+(i%4)*56,y=top+Math.floor(i/4)*36,extra=actual&&i>=s.target.length,matched=actual&&i<s.prefixLength;
   r.rect(x,y,50,31,actual?(matched?'#8cb8a8':'#c4c9b0'):'#e5ddbd');
   outline(r,x,y,50,31,extra?C.red:matched?'#ccf3d9':'#9fae90',extra?2.5:1);
   r.text(String(i+1).padStart(2,'0'),x+4,y+8,12,extra?'#793f31':'#456054');glyph(r,symbol,x+35,y+15,18,extra?'#793f31':C.ink,2.5);
  });
 }
 tokens(s.target,127,false);r.line(39,207,257,207,1,'#8ca08788');
 r.text('ACTUAL',39,219,17,C.light);r.text(s.symbols.length+' / '+s.target.length,180,222,14,s.symbols.length>s.target.length?C.red:C.jade);
 if(s.symbols.length)tokens(s.symbols,248,true);else{r.text('NO IMPRINTS YET',39,257,13,C.muted);r.text('ENTER A RUNE TO BEGIN',39,280,12,C.muted);}
}
function board(r,s){
 const g=s.grid,k=g.cellSize,w=k*g.cols,h=k*g.rows;
 r.sprite('shadow',g.x+w/2,g.y+h/2+14,w+56,h+66,0,'#14352d88');
 r.rect(g.x-12,g.y-12,w+24,h+28,'#243f39');outline(r,g.x-12,g.y-12,w+24,h+28,'#b4b99a',2);
 r.rect(g.x-4,g.y-4,w+8,h+10,'#162f2d');
 s.cells.forEach(c=>{r.sprite(c.type==='wall'?'glyph_wall':'glyph_slab',c.x,c.y,k-2,k-2,0,c.visited?'#b9d5c7':'#fff');});
 // The route contains only accepted visits; no suggested or interpolated cells.
 for(let i=1;i<s.path.length;i++){const a=s.path[i-1],b=s.path[i];r.line(a.x,a.y,b.x,b.y,13,'#e3e6c3aa');r.line(a.x,a.y,b.x,b.y,7,'#2a695e');r.line(a.x-1,a.y-1,b.x-1,b.y-1,1.5,'#80b6a0');}
 const emitted=new Set(s.emissions.map(e=>e.cellId));
 s.cells.forEach(c=>{
  if(c.type==='wall')return;
  if(c.rune){
   r.circle(c.x,c.y,18,c.visited?'#a4c2ac':'#ced4b9');
   glyph(r,c.rune.symbol,c.x+1,c.y+1,26,'#f4ecd2',4);glyph(r,c.rune.symbol,c.x,c.y,26,emitted.has(c.id)?'#146d5d':C.ink,3.2);
   entryMarker(r,c.rune.enterFrom,c.x,c.y,k);
   if(emitted.has(c.id)){r.circle(c.x+22,c.y+21,5,'#e6f2c6');r.line(c.x+19,c.y+21,c.x+21,c.y+23,1.6,'#216253');r.line(c.x+21,c.y+23,c.x+25,c.y+18,1.6,'#216253');}
   else if(c.visited&&c.rune.enterFrom){r.circle(c.x+22,c.y+21,5,'#f0d0a7');r.line(c.x+19,c.y+21,c.x+25,c.y+21,1.6,'#865a3f');}
  }
  if(c.role){const color=c.role==='start'?'#347b6b':'#8a6640';r.rect(c.x-27,c.y+13,54,17,color);center(r,c.role==='start'?'START':'EXIT',c.x,c.y+14,13,'#fff0ce');if(!c.rune){r.sprite('ring',c.x,c.y-7,24,24,0,c.role==='start'?'#5c9181':'#bd9360');}}
 });
 const p=s.player,tone=s.phase==='won'?C.jade:s.phase==='lost'||s.routeStatus==='rejected'?C.red:C.gold;
 const pulse=s.phase==='playing'?Math.sin(s.elapsed*4)*.8:0;
 outline(r,p.x-k*.43-pulse,p.y-k*.43-pulse,k*.86+pulse*2,k*.86+pulse*2,tone,2.8);
 r.circle(p.x-23,p.y-23,6,C.dark);r.circle(p.x-23,p.y-23,3.5,tone);
 center(r,'OCCUPIED '+s.path.length+' / '+s.cells.filter(c=>c.type==='floor').length,g.x+w/2,465,13,C.light);
}
function information(r,s){
 panel(r,686,82,250,390);
 let heading='DRAW A ROUTE',l1='D-PAD / NEW STONE',l2='A / SUBMIT AT EXIT',tone=C.light;
 if(s.phase==='won'){heading='INSCRIPTION MATCHED';l1='ALL RUNES IN ORDER';l2='ROUTE COMPLETE';tone=C.jade;}
 else if(s.phase==='lost'){heading=s.lostReason==='timeout'?'TIME HAS RUN OUT':'THREE ROUTES REJECTED';l1='ROUND COMPLETE';l2='REVIEW THE ENTRY EDGES';tone=C.red;}
 else if(s.routeStatus==='rejected'){heading='ROUTE REJECTED';l1=s.rejection&&s.rejection.reason==='dead-end'?'NO UNUSED WAY FORWARD':'SEQUENCE DOES NOT MATCH';l2='B / CLEAR AND REDRAW';tone=C.red;}
 else if(s.routeStatus==='at-exit'){heading='AT THE EXIT';l1='A / CHECK EXACT SEQUENCE';l2='B / CLEAR AND REDRAW';tone=C.gold;}
 r.text(heading,701,98,15,tone);r.text(l1,701,126,12,C.light);r.text(l2,701,147,12,C.muted);
 r.line(701,174,921,174,1,'#8ca08788');
 const current=s.path[s.path.length-1];r.text('LAST ENTRY',701,189,13,C.muted);
 const entry=current.enteredFrom?'FROM '+current.enteredFrom:'AT START';r.text(entry,701,211,19,C.light);
 r.text(current.emitted?'IMPRINT: '+current.emitted:'IMPRINT: NONE',701,242,16,current.emitted?C.jade:C.gold);
 const cell=s.cells.find(c=>c.id===s.player.cellId),skipped=cell&&cell.rune&&cell.rune.enterFrom&&current.enteredFrom&&current.emitted===null;
 r.text(skipped?'WRONG EDGE / STILL USED':current.emitted?'ADDED TO ACTUAL SEQUENCE':'NO RUNE ADDED',701,270,12,skipped?C.gold:C.muted);
 r.line(701,300,921,300,1,'#8ca08788');r.text('READ THE STONE',701,315,13,C.light);
 glyph(r,'E',714,353,23,C.light,2.7);r.text('CENTER = OUTPUT',738,345,13,C.light);
 r.rect(704,373,5,24,C.gold);r.text('W',715,378,13,C.gold);r.text('EDGE = ENTER FROM',738,378,12,C.light);
 r.text('N UP   E RIGHT',701,418,13,C.muted);r.text('S DOWN W LEFT',701,439,13,C.muted);
}
function scene(r,s){
 r.sprite('glyph_garden',480,270,960,540,0,'#fff');r.sprite('glyph_foliage',30,470,183,183,-.4,'#fff');r.sprite('glyph_foliage',947,33,169,169,2.6,'#fff');
 r.rect(0,0,960,53,'#183936e8');r.line(0,53,960,53,1,'#aab19077');r.text('PATH GLYPHS',25,16,22,C.light);r.text('STONE GARDEN / '+String(s.level).padStart(2,'0'),676,23,13,C.muted);
 sequence(r,s);board(r,s);information(r,s);
 r.rect(24,488,912,34,'#183936ed');
 let note='B CLEARS THE WHOLE ROUTE / TIME + MISTAKES STAY USED';
 if(s.phase==='won')note='EXACT ORDER + EXACT LENGTH / THE INSCRIPTION IS COMPLETE';
 else if(s.phase==='lost')note=s.lostReason==='timeout'?'90 SECONDS COMPLETE / THE ROUTE IS PRESERVED':'THIRD REJECTION / THE ROUTE IS PRESERVED';
 const extra=Math.max(0,s.symbols.length-s.target.length);
 if(s.phase==='playing'&&extra)note='EXTRA RUNES: '+extra+' / RED OUTLINES MARK EVERY EXTRA IMPRINT';
 center(r,note,480,498,13,s.phase==='lost'||extra?C.red:C.light);
}
root.GameDef={
 id:'path-glyphs',title:'路径刻印',tagline:'踏过石板，让刻印连成正确的方向串',seed:223,
 accent:'#a6cbb3',background:'#34534a',levelLabel:'石庭',levelNames:['初刻','石阶','回纹'],atlas,
 description:'从起点走到出口，每格只能经过一次。中央箭头是刻印；有金色入边的石板，须从那一侧进入才刻印。按目标顺序收集，到出口按 A 提交。B 清空重画，不退时间或错误；三次错误或 90 秒结束。',
 controls:{move:'方向键 / 摇杆 · 走向相邻未走石板',a:'出口提交 · 空格 / 确认 / 右上半屏',b:'清空整条路线 · B / 右下半屏'},actionLabels:['提交','清空'],
 tip:'中央箭头是刻印，金色边是入口。错侧不刻印但仍占格。B 清空整条路线，时间和错误不退回。',
 winTitle:'刻印相合',loseTitle:'石庭待重绘',
 result(s){if(s.phase==='won')return '顺序与长度全部吻合！走过 '+s.moves+' 格，刻印 '+s.symbols.length+' 个，剩余 '+Math.ceil(s.remaining)+' 秒。';if(s.lostReason==='timeout')return '90 秒已到。核对符文与入边，到出口按 A 提交。';return '已用尽三次错误机会。死路和错误提交都会计错；重试时可提前按 B 清空整条路线。';},
 hud(s){return[
  {label:'当前阶段',value:s.phase==='won'?'刻印相合':s.phase==='lost'?'本轮结束':{drawing:'延伸路线','at-exit':'出口待提交',rejected:'需清空重画'}[s.routeStatus]},
  {label:'实际刻印',value:s.symbols.length+' / '+s.target.length,tone:s.symbols.length>s.target.length?'warn':''},
  {label:'容错剩余',value:Math.max(0,s.maxMistakes-s.mistakes)+' 次',tone:s.maxMistakes-s.mistakes<2?'warn':''},
  {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
 ];},
 render(r,s){scene(r,s);}
};
})(window);
