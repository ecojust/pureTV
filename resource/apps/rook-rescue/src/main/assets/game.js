(function(root){
 'use strict';
 var C={bg:'#243445',ink:'#f1ebd8',muted:'#b8c8cb',gold:'#eac36c',teal:'#75d5c4',red:'#e99886',dark:'#263843'};
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 function chess(name,x,dark,rook){return{name:name,x:x,y:0,w:128,h:128,paint:function(c,w,h,art){
  art.ellipse(c,65,116,48,7,'#142b3855');var fill=art.linear(c,20,20,104,110,dark?[[0,'#526779'],[.45,'#273b4b'],[1,'#152638']]:[[0,'#fff8de'],[.5,'#e9dcb7'],[1,'#b7a47b']]),stroke=dark?'#c3d6db':'#745f3c';
  if(rook){art.path(c,[[24,15],[43,15],[43,33],[55,33],[55,15],[74,15],[74,33],[87,33],[87,15],[105,15],[105,49],[91,58],[94,101],[103,108],[103,117],[25,117],[25,108],[34,101],[38,58],[24,49]],fill,stroke,4);c.strokeStyle=stroke;c.lineWidth=3;c.beginPath();c.moveTo(37,55);c.lineTo(91,55);c.stroke();}
  else{round(c,56,8,16,36,3,fill,stroke,3);round(c,43,17,42,14,3,fill,stroke,3);art.path(c,[[29,46],[47,53],[64,41],[82,53],[100,46],[90,68],[91,101],[103,109],[103,117],[25,117],[25,109],[37,101],[38,68]],fill,stroke,4);c.strokeStyle=stroke;c.lineWidth=3;c.beginPath();c.moveTo(38,68);c.lineTo(90,68);c.stroke();}
  c.strokeStyle=dark?'#8196a6':'#fff9e6';c.lineWidth=3;c.beginPath();c.moveTo(44,76);c.lineTo(43,97);c.moveTo(31,111);c.lineTo(97,111);c.stroke();
 }};}
 var atlas={builtins:[],tiles:[{name:'chessStudy',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
  c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#465567'],[.55,'#263d50'],[1,'#1c2d40']]);c.fillRect(0,0,960,540);
  c.strokeStyle='#adc5cb12';c.lineWidth=1;for(var y=0;y<540;y+=18){c.beginPath();c.moveTo(0,y);c.lineTo(960,y);c.stroke();}
  round(c,20,12,920,43,8,'#172d3f','#8da5ac');round(c,57,69,489,417,13,art.linear(c,57,69,546,486,[[0,'#d9c89d'],[.4,'#b0996a'],[1,'#786545']]),'#e6d8ac',2);round(c,68,80,467,395,8,'#273c48','#f0dfaf',1.5);
  [[65,77],[538,77],[65,478],[538,478]].forEach(function(p){art.ellipse(c,p[0],p[1],3,3,'#ead9ae');c.strokeStyle='#706044';c.lineWidth=1;c.beginPath();c.moveTo(p[0]-1,p[1]-1);c.lineTo(p[0]+1,p[1]+1);c.stroke();});
  round(c,576,72,355,113,10,'#1c3345','#73939b',2);round(c,576,199,355,143,10,'#203a4b','#73939b',2);round(c,576,356,355,130,10,'#1c3345','#73939b',2);round(c,24,500,912,29,7,'#172c3e','#79949b');c.restore();
 }},chess('whiteKing',640,false,false),chess('whiteRook',768,false,true),chess('blackKing',896,true,false)]};
 var model=root.PureModel,config=model.config;
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
 function geometry(n){var gap=n===5?68:n===6?58:50;return{gap:gap,x:300-n*gap/2,y:290-n*gap/2};}
 function pos(p,n){return 'R'+(Math.floor(p/n)+1)+' C'+(p%n+1);}
 function piece(r,p,n,g,type){if(p===null)return;var x=g.x+(p%n+.5)*g.gap,y=g.y+(Math.floor(p/n)+.5)*g.gap,w=g.gap*.88;r.sprite(type,x,y,w,w,0,'#ffffff');center(r,type==='whiteRook'?'R':'K',x,y-g.gap*.08,24,type==='blackKing'?'#f3ebd4':'#273c48');}
 function render(r,s){
  var l=config.layouts[s.level],g=geometry(s.size),row=Math.floor(s.cursor/s.size),col=s.cursor%s.size,selected=s.selected==='K'?s.whiteKing:s.selected==='R'?s.whiteRook:null;
  r.sprite('chessStudy',480,270,960,540,0,'#ffffff');text(r,l.name,35,21,28,C.ink);text(r,'KING + ROOK STUDY',628,24,24,C.muted);
  for(var i=0;i<s.size;i++){center(r,i+1,g.x+(i+.5)*g.gap,82,24,col===i?C.gold:C.muted);center(r,i+1,93,g.y+(i+.5)*g.gap-12,24,row===i?C.gold:C.muted);}
  for(var p=0;p<s.size*s.size;p++){var x=g.x+(p%s.size)*g.gap,y=g.y+Math.floor(p/s.size)*g.gap;r.rect(x,y,g.gap,g.gap,(Math.floor(p/s.size)+p%s.size)%2?'#758c92':'#d5d6bf');r.rect(x,y,g.gap,1,'#3d535c55');r.rect(x,y,1,g.gap,'#3d535c55');}
  if(selected!==null){var sx=g.x+(selected%s.size)*g.gap,sy=g.y+Math.floor(selected/s.size)*g.gap;frame(r,sx+4,sy+4,g.gap-8,g.gap-8,'#173c44',4);frame(r,sx+5,sy+5,g.gap-10,g.gap-10,C.teal,2);}
  s.legalTargets.forEach(function(p){var x=g.x+(p%s.size+.5)*g.gap,y=g.y+(Math.floor(p/s.size)+.5)*g.gap;r.circle(x,y,7,'#21484e');r.circle(x,y,3.5,C.teal);});
  if(s.lastBlack){var bx=g.x+(s.blackKing%s.size)*g.gap,by=g.y+Math.floor(s.blackKing/s.size)*g.gap;frame(r,bx+3,by+3,g.gap-6,g.gap-6,'#573e3c',3.5);frame(r,bx+4,by+4,g.gap-8,g.gap-8,C.red,1.5);}
  piece(r,s.whiteKing,s.size,g,'whiteKing');piece(r,s.whiteRook,s.size,g,'whiteRook');piece(r,s.blackKing,s.size,g,'blackKing');
  var cx=g.x+col*g.gap,cy=g.y+row*g.gap;frame(r,cx+1,cy+1,g.gap-2,g.gap-2,'#263743',4.5);frame(r,cx+1,cy+1,g.gap-2,g.gap-2,C.gold,2.5);
  text(r,'WHITE MOVES',594,84,24,C.muted);text(r,s.whiteMoves+' / '+s.moveLimit,594,117,34,C.ink);text(r,'GOAL: CHECKMATE',594,157,24,C.gold);
  text(r,'SELECTED '+(s.selected||'NONE'),594,212,25,s.selected?C.teal:C.ink);text(r,'LEGAL TARGETS '+s.legalTargets.length,594,246,24,C.muted);text(r,'CURSOR '+pos(s.cursor,s.size),594,280,24,C.gold);text(r,'A SELECT / MOVE',594,313,24,C.ink);
  text(r,'BLACK KING',594,368,24,C.muted);text(r,s.blackInCheck?'IN CHECK':'NOT IN CHECK',594,400,25,s.blackInCheck?C.red:C.ink);text(r,'SAFE STEPS '+s.blackMobility,594,432,24,C.muted);text(r,s.lastBlack?'LAST '+pos(s.blackKing,s.size):'LAST --',594,461,24,s.lastBlack?C.red:C.muted);
  text(r,'ARROWS CURSOR',38,501,24,C.muted);text(r,'A SELECT / MOVE',322,501,24,C.gold);text(r,'B CANCEL',751,501,24,C.ink);
 }
 root.GameDef={id:'rook-rescue',title:'王车合围',seed:config.defaultSeed,accent:C.gold,background:C.bg,atlas:atlas,holdConfirmAsA:true,
  tagline:'白王护车，封住黑王退路',levelLabel:'残局',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['选子或走子','取消选子'],
  description:'你执白王 K 与白车 R。方向移动光标，A 先选白棋，再选落点；B 取消。黑王会自动应手。将军且黑王无合法走法即将死获胜；白车被吃、逼和或手数用尽失败。',
  controls:{move:'方向键移动棋盘光标',a:'空格、Z、确认 / 手机右上：选子或走子',b:'X / 手机右下：取消选子'},
  tip:'王走相邻一格，两王不能相邻；车走横竖直线，不能越子或吃王。青框是选子，青点是合法落点，珊瑚框是黑王末步。黑王优先安全吃车，其次保留最多走法、远离白王；按公开规则行动，并非完美棋力。',
  winTitle:'王车合围，将死成功',loseTitle:'围网未成，重新布局',
  hud:function(s){return[{label:'已用白方手数',value:s.whiteMoves+' / '+s.moveLimit},{label:'当前选子',value:s.selected==='K'?'白王 K':s.selected==='R'?'白车 R':'未选择'},{label:'黑王合法落点',value:s.blackMobility},{label:'黑王状态',value:s.blackInCheck?'被将军':'未被将军'}];},
  result:function(s){var why=s.phase==='won'?'黑王被将军且没有合法走法。':s.reason==='rook-captured'?'黑王合法吃掉白车。':s.reason==='stalemate'?'黑王不能移动，但未被将军：逼和。':'白方手数用尽，未能将死黑王。';return why+'白方走了 '+s.whiteMoves+' / '+s.moveLimit+' 手。';},render:render};
})(window);
