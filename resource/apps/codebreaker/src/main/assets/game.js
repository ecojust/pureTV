(function(root){
 'use strict';
 var C={bg:'#203735',ink:'#f6e9cc',paper:'#e4d9bd',dark:'#384940',muted:'#a8c5b9',copper:'#efbd80',teal:'#75cfbd',red:'#e9957e'};
 var colors=['#337ca1','#b76b43','#54856e','#965f8f','#8c8139','#a94e56'];
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 function glyphTile(index){return{name:'glyph'+index,x:640+(index%3)*64,y:Math.floor(index/3)*64,w:64,h:64,paint:function(c,w,h,art){
  var points=[];
  if(index===0){art.ellipse(c,32,32,25,25,'#ffffff');}
  else if(index===1)art.path(c,[[32,5],[60,57],[4,57]],'#ffffff');
  else if(index===2)round(c,8,8,48,48,4,'#ffffff');
  else if(index===3)art.path(c,[[32,3],[61,32],[32,61],[3,32]],'#ffffff');
  else if(index===4){for(var i=0;i<5;i++){var a=-Math.PI/2+i*Math.PI*2/5;points.push([32+Math.cos(a)*29,32+Math.sin(a)*29]);}art.path(c,points,'#ffffff');}
  else{for(var j=0;j<10;j++){var b=-Math.PI/2+j*Math.PI/5,r=j%2?13:29;points.push([32+Math.cos(b)*r,32+Math.sin(b)*r]);}art.path(c,points,'#ffffff');}
 }};}
 var atlas={builtins:[],tiles:[
  {name:'cipherDesk',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
   c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#496258'],[.5,'#2a4942'],[1,'#19332f']]);c.fillRect(0,0,960,540);
   c.strokeStyle='#cad3b712';c.lineWidth=1;
   for(var y=0;y<540;y+=30){c.beginPath();c.moveTo(0,y);c.bezierCurveTo(200,y-5,640,y+7,960,y-3);c.stroke();}
   round(c,16,12,928,41,9,'#1a3835e8','#8c9c7b');
   round(c,24,72,512,410,10,art.linear(c,24,72,536,482,[[0,'#f8efcf'],[.6,'#e6dab7'],[1,'#d3c5a1']]),'#b9a575',2);
   c.fillStyle='#8f92793b';c.fillRect(35,108,490,2);
   for(var i=0;i<9;i++){var yy=111+i*36;round(c,36,yy,488,33,3,i%2?'#b6b59618':'#fff8da36');}
   c.fillStyle='#b1a987';c.fillRect(36,436,488,1);
   round(c,560,72,376,410,14,art.linear(c,560,72,936,482,[[0,'#315c54'],[.5,'#214a44'],[1,'#173b37']]),'#92b49b',2);
   round(c,574,269,348,148,9,'#e6ddc0','#8f9e83',1.5);
   round(c,574,428,348,42,7,'#153a35','#65927c');
   round(c,24,492,912,36,8,'#15352f','#8c9c7b');
   [[568,82],[928,82],[568,472],[928,472]].forEach(function(p){art.ellipse(c,p[0],p[1],3,3,'#d1b980');c.strokeStyle='#6a6953';c.lineWidth=1;c.beginPath();c.moveTo(p[0]-1,p[1]+1);c.lineTo(p[0]+1,p[1]-1);c.stroke();});
   c.restore();
  }},
  glyphTile(0),glyphTile(1),glyphTile(2),glyphTile(3),glyphTile(4),glyphTile(5),
  {name:'guessKey',x:832,y:0,w:192,h:192,paint:function(c,w,h,art){
   art.ellipse(c,96,103,83,83,'#0a26234d');round(c,8,8,176,176,18,art.linear(c,0,8,0,184,[[0,'#f8efd5'],[.55,'#ded6b9'],[1,'#9caa8e']]),'#6d927d',3);
   round(c,16,16,160,160,12,'#f0e6c9','#fff6df',2);c.fillStyle='#fff9e838';c.fillRect(25,25,142,44);
  }}
 ]};
 var model=root.PureModel,config=model.config;
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
 function smallSymbol(r,value,x,y){
  if(value===null){center(r,'-',x,y-12,24,'#8d927b');return;}
  r.sprite('glyph'+value,x-11,y,24,24,0,colors[value]);text(r,value+1,x+7,y-12,24,C.dark);
 }
 function render(r,s){
  var l=config.layouts[s.level],terminal=s.phase!=='playing',current=terminal?s.reveal:s.guess;
  r.sprite('cipherDesk',480,270,960,540,0,'#ffffff');
  text(r,l.name,30,18,28,C.ink);text(r,'4 SLOTS / REPEATS OK',524,20,24,C.muted);
  text(r,'TRY',40,81,24,C.dark);text(r,'GUESS',167,81,24,C.dark);center(r,'E',420,81,24,C.dark);center(r,'M',478,81,24,C.dark);
  for(var row=0;row<9;row++){
   var cy=127+row*36,entry=s.history[row],enabled=row<l.attemptLimit;
   if(entry&&row===s.history.length-1)frame(r,36,cy-16,488,33,'#9c794b',1.5);
   text(r,row+1,44,cy-12,24,enabled?C.dark:'#b7af94');
   for(var col=0;col<4;col++)smallSymbol(r,entry?entry.guess[col]:null,114+col*68,cy);
   center(r,entry?entry.exact:enabled?'-':'/',420,cy-12,24,entry&&entry.exact===4?'#2a8065':C.dark);
   center(r,entry?entry.misplaced:enabled?'-':'/',478,cy-12,24,C.dark);
  }
  text(r,'E = EXACT POSITION',40,439,24,C.dark);text(r,'M = SYMBOL ELSEWHERE',40,463,24,C.dark);
  text(r,terminal?'REVEALED CODE':'CURRENT GUESS',578,85,26,C.ink);
  current.forEach(function(value,i){
   var cx=610+i*86;
   r.sprite('guessKey',cx,170,76,94,0,'#ffffff');
   if(value===null)center(r,'?',cx,151,34,'#6e8b76');
   else{r.sprite('glyph'+value,cx,153,34,34,0,colors[value]);center(r,value+1,cx,181,28,C.dark);}
   if(!terminal&&s.cursor===i)frame(r,cx-40,120,80,100,C.copper,3);
  });
  text(r,'LEFT '+s.attemptsRemaining,578,234,24,s.attemptsRemaining<=2?C.copper:C.teal);
  text(r,terminal?'ROUND OVER':s.guess.every(function(v){return v!==null;})?'A SUBMIT':'FILL 4 SLOTS',730,234,24,C.ink);
  center(r,'AVAILABLE SYMBOLS',748,279,24,C.dark);
  for(var symbol=0;symbol<l.symbols;symbol++){
   var xx=620+(symbol%3)*122,yy=333+Math.floor(symbol/3)*58;
   r.sprite('glyph'+symbol,xx-13,yy,30,30,0,colors[symbol]);text(r,symbol+1,xx+12,yy-12,26,C.dark);
  }
  center(r,'UP / DOWN CHANGE',748,438,24,C.muted);
  text(r,'< > SLOT',38,497,24,C.teal);text(r,'A SUBMIT',285,497,24,C.ink);text(r,'B CLEAR',513,497,24,C.ink);text(r,'LEFT '+s.attemptsRemaining,773,497,24,C.copper);
 }
 root.GameDef={id:'codebreaker',title:'纹码破译',seed:config.defaultSeed,accent:C.copper,background:C.bg,atlas:atlas,
  holdConfirmAsA:true,tagline:'四格密纹，从反馈中推理',levelLabel:'符号集',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['提交猜测','清空当前格'],
  description:'猜出四格密纹，符号允许重复。左右选格，上下换符号，填满后 A 提交；B 清空当前格。E 是符号与位置全对的数量，M 是符号正确但位置不同的数量，反馈不对应具体格。次数用尽前猜对全部四格即获胜。',
  controls:{move:'左右选格；上下循环符号',a:'空格、Z、确认 / 手机右上：提交四格猜测',b:'X、B / 手机右下：清空当前格'},
  tip:'E 全对，M 错位；每个符号只计一次，重复要按数量算。反馈不标出具体哪格正确。填满才消耗一次猜测，最后一次猜对也获胜。记录不会因修改而清空。',
  winTitle:'四格全对，密纹破解',loseTitle:'猜测用尽，密纹揭示',
  hud:function(s){var last=s.history.length?s.history[s.history.length-1]:null;return[{label:'当前格',value:(s.cursor+1)+' / 4'},
   {label:'已用猜测',value:s.attemptsUsed+' / '+config.layouts[s.level].attemptLimit},
   {label:'最近反馈',value:last?'E '+last.exact+' · M '+last.misplaced:'尚未提交'},
   {label:'剩余次数',value:s.attemptsRemaining,tone:s.attemptsRemaining<=2?'warn':''}];},
  result:function(s){return(s.phase==='won'?'四个位置全部匹配，成功破译。':'猜测次数已用尽。')+'密纹为 '+s.reveal.map(function(v){return v+1;}).join(' · ')+'；用了 '+s.attemptsUsed+' 次猜测，用时 '+s.elapsed.toFixed(1)+' 秒。';},render:render};
})(window);
