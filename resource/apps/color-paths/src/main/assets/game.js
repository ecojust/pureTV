(function(root){
 'use strict';
 var C={bg:'#20283f',ink:'#ecebd9',muted:'#abc0c4',gold:'#edca74',red:'#ef9c90',panel:'#213f4c'},colors=['#617785','#75d4c2','#f0a78b','#edca74','#b6a6e8','#8abfee'];
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 function shape(name,x,y,kind){return{name:name,x:x,y:y,w:128,h:128,paint:function(c,w,h,art){
  var fill='#213747',stroke='#f0f3e2';if(kind===0){art.ellipse(c,64,64,46,46,fill);c.strokeStyle=stroke;c.lineWidth=8;c.beginPath();c.arc(64,64,46,0,Math.PI*2);c.stroke();}
  else if(kind===1)round(c,20,20,88,88,8,fill,stroke,8);
  else if(kind===2)art.path(c,[[64,11],[117,110],[11,110]],fill,stroke,8);
  else if(kind===3)art.path(c,[[64,10],[118,64],[64,118],[10,64]],fill,stroke,8);
  else art.path(c,[[45,13],[83,13],[83,45],[115,45],[115,83],[83,83],[83,115],[45,115],[45,83],[13,83],[13,45],[45,45]],fill,stroke,8);
 }};}
 var atlas={builtins:[],tiles:[
  {name:'routeConsole',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
   c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#3b3d5b'],[.45,'#253c4d'],[1,'#1d2e43']]);c.fillRect(0,0,960,540);
   c.strokeStyle='#aac9c312';c.lineWidth=1;for(var x=-300;x<1000;x+=34){c.beginPath();c.moveTo(x,0);c.lineTo(x+330,540);c.stroke();}
   round(c,19,12,922,42,8,'#172c3fdd','#718c98');round(c,48,68,492,420,14,art.linear(c,48,68,540,488,[[0,'#74878c'],[.5,'#3f5b69'],[1,'#273f53']]),'#adc3bc',2);round(c,60,80,468,396,8,'#1c3949','#8da7a7',1.5);
   [[55,75],[533,75],[55,481],[533,481]].forEach(function(p){art.ellipse(c,p[0],p[1],3,3,'#d4ceaa');c.strokeStyle='#5a7180';c.lineWidth=1;c.beginPath();c.moveTo(p[0]-1,p[1]-1);c.lineTo(p[0]+1,p[1]+1);c.stroke();});
   round(c,579,72,352,227,10,'#1b3348','#6d9199',2);round(c,579,313,352,80,10,'#243e53','#6d9199',2);round(c,579,407,352,81,10,'#1b3348','#6d9199',2);
   round(c,24,500,912,29,7,'#162e41','#71929a');c.restore();
  }},shape('circlePath',640,0,0),shape('squarePath',768,0,1),shape('trianglePath',896,0,2),shape('diamondPath',0,800,3),shape('plusPath',128,800,4),
  {name:'routeCell',x:256,y:800,w:128,h:128,paint:function(c,w,h,art){round(c,3,3,122,122,7,art.linear(c,0,0,128,128,[[0,'#345060'],[1,'#243f51']]),'#7e9ca648',2);c.strokeStyle='#a1bfb327';c.lineWidth=1;c.beginPath();c.moveTo(14,14);c.lineTo(30,14);c.moveTo(14,14);c.lineTo(14,30);c.moveTo(114,98);c.lineTo(114,114);c.lineTo(98,114);c.stroke();}}
 ]};
 var model=root.PureModel,config=model.config,shapes=['circlePath','squarePath','trianglePath','diamondPath','plusPath'];
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
 function geometry(n){var gap=n===4?80:n===5?68:58;return{gap:gap,x:295-n*gap/2,y:292-n*gap/2};}
 function marker(r,color,x,y,n,fixed){var w=n===4?58:n===5?50:45,h=n===4?40:n===5?36:32,icon=n===4?26:n===5?23:21,num=n===4?28:n===5?26:24;r.rect(x-w/2,y-h/2,w,h,'#163246');frame(r,x-w/2,y-h/2,w,h,colors[color],fixed?2.5:1);
  if(fixed)frame(r,x-w/2-3,y-h/2-3,w+6,h+6,'#e6eddd',1.5);r.sprite(shapes[color-1],x-w*.23,y,icon,icon,0,colors[color]);center(r,color,x+w*.23,y-num*.55,num,C.ink);
 }
 function render(r,s){
  var l=config.layouts[s.level],g=geometry(s.size),row=Math.floor(s.cursor/s.size),col=s.cursor%s.size,bad=new Set(s.validation.degreeErrors.map(function(e){return e.point;}));
  r.sprite('routeConsole',480,270,960,540,0,'#ffffff');text(r,l.name,35,21,28,C.ink);text(r,'NUMBER + SHAPE',644,24,24,C.muted);
  for(var i=0;i<s.size;i++){center(r,i+1,g.x+(i+.5)*g.gap,82,24,col===i?C.gold:C.muted);center(r,i+1,86,g.y+(i+.5)*g.gap-12,24,row===i?C.gold:C.muted);}
  for(var p=0;p<s.colors.length;p++){var x=g.x+(p%s.size+.5)*g.gap,y=g.y+(Math.floor(p/s.size)+.5)*g.gap;r.sprite('routeCell',x,y,g.gap-2,g.gap-2,0,'#ffffff');}
  for(var p=0;p<s.colors.length;p++)if(s.colors[p]){var x=g.x+(p%s.size+.5)*g.gap,y=g.y+(Math.floor(p/s.size)+.5)*g.gap;if(p%s.size<s.size-1&&s.colors[p+1]===s.colors[p])r.line(x,y,x+g.gap,y,9,colors[s.colors[p]]);if(p+s.size<s.colors.length&&s.colors[p+s.size]===s.colors[p])r.line(x,y,x,y+g.gap,9,colors[s.colors[p]]);}
  for(var p=0;p<s.colors.length;p++)if(s.colors[p]){var x=g.x+(p%s.size+.5)*g.gap,y=g.y+(Math.floor(p/s.size)+.5)*g.gap;marker(r,s.colors[p],x,y,s.size,!!s.endpointMap[p]);if(bad.has(p)){r.circle(x+g.gap*.34,y-g.gap*.32,4.5,C.red);r.circle(x+g.gap*.34,y-g.gap*.32,1.5,'#5e3f40');}}
  var cx=g.x+(col+.5)*g.gap,cy=g.y+(row+.5)*g.gap;frame(r,cx-g.gap/2+1,cy-g.gap/2+1,g.gap-2,g.gap-2,C.gold,2.5);
  text(r,'PATH / SHAPE',596,84,24,C.muted);
  l.endpoints.forEach(function(e,i){var y=125+i*37;r.sprite(shapes[i],612,y,28,28,0,colors[e.color]);text(r,e.color+' '+config.shapes[i],640,y-13,24,colors[e.color]);text(r,s.paths[i].complete?'OK':'OPEN',848,y-13,24,s.paths[i].complete?colors[e.color]:C.muted);});
  var current=s.colors[s.cursor],degree=0;if(current){var candidates=[s.cursor-s.size,s.cursor+s.size];if(col)candidates.push(s.cursor-1);if(col<s.size-1)candidates.push(s.cursor+1);degree=candidates.filter(function(p){return p>=0&&p<s.colors.length&&s.colors[p]===current;}).length;}
  text(r,'CURSOR R'+(row+1)+' C'+(col+1),596,324,24,C.muted);text(r,current?(s.endpointMap[s.cursor]?'FIXED ':'PATH ')+current+' / DEG '+degree:'EMPTY / A CYCLE',596,358,24,current?colors[current]:C.ink);
  text(r,'COVERED '+s.covered+' / '+s.colors.length,596,418,27,C.ink);text(r,s.valid?'READY: B CHECK':'ENDS 1 / MIDDLE 2',596,454,24,s.valid?colors[1]:C.muted);
  text(r,'ARROWS CELL',38,501,24,C.muted);text(r,'A CYCLE COLOR',324,501,24,C.gold);text(r,'B CHECK',743,501,24,C.ink);
 }
 root.GameDef={id:'color-paths',title:'彩径连点',seed:config.defaultSeed,accent:C.gold,background:C.bg,atlas:atlas,holdConfirmAsA:true,
  tagline:'同号相连，彩径满盘',levelLabel:'连径',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['循环改色','检查路径'],
  description:'为每格选择路径号码，连接同号同形的两个固定端点。相邻同号格自动连线：端点恰接一条，途中格恰接两条，每号只有一条连通路径，并覆盖全盘。方向选格，A 循环空白与号码，B 手动检查；允许三次失败。',
  controls:{move:'方向键选择格子',a:'空格、Z、确认 / 手机右上：循环改色',b:'X / 手机右下：手动检查路径'},
  tip:'数字与形状共同区分路径，双框是不可修改的端点。A 可反复改色，循环到空白即可清除。同号贴边会自动连线，不能分叉或成独立环；连完仍须 B 检查。',
  winTitle:'彩径贯通，满盘相连',loseTitle:'检查机会用尽，重连彩径',
  hud:function(s){return[{label:'已覆盖格子',value:s.covered+' / '+s.colors.length},{label:'完整路径',value:s.paths.filter(function(p){return p.complete;}).length+' / '+s.paths.length},{label:'度数错误格',value:s.validation.degreeErrors.length},{label:'剩余试错',value:s.checks+' / 3'}];},
  result:function(s){return(s.phase==='won'?'所有号码都以简单路径连接两端，且全盘已覆盖。':'三次检查均未通过，请调整路径与覆盖。')+'完成 '+s.paths.filter(function(p){return p.complete;}).length+' / '+s.paths.length+' 条路径，提交 '+s.submissions+' 次。';},render:render};
})(window);
