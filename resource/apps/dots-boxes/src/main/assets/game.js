(function(root){
 'use strict';
 var C={bg:'#f0e6d1',ink:'#314b51',muted:'#6d7c79',paper:'#faf2de',player:'#bd6856',ai:'#357c7b',gold:'#ba7b25',red:'#ae514b'};
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 function stamp(name,x,player){return{name:x===640?'circleStamp':'crossStamp',x:x,y:0,w:128,h:128,paint:function(c,w,h,art){
  var color=player?C.player:C.ai;c.save();c.translate(64,64);c.rotate(player?-.07:.06);
  round(c,-45,-44,90,88,12,player?'#eac6ac':'#b9d1c2',color,3);round(c,-39,-38,78,76,8,null,player?'#bd685655':'#357c7b55',2);
  c.strokeStyle=color;c.lineWidth=9;c.lineCap='round';c.beginPath();if(player)c.arc(0,0,23,0,Math.PI*2);else{c.moveTo(-17,-17);c.lineTo(17,17);c.moveTo(17,-17);c.lineTo(-17,17);}c.stroke();
  for(var i=0;i<8;i++){c.fillStyle=player?'#faf2de77':'#faf2de55';c.fillRect(-35+i*10,-34+(i%3)*7,3,2);}c.restore();
 }};}
 var atlas={builtins:[],tiles:[
  {name:'graphBook',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
   c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#d9c6a5'],[.5,'#eee1c2'],[1,'#b9c0ac']]);c.fillRect(0,0,960,540);
   c.fillStyle='#344f4630';c.fillRect(34,21,897,506);round(c,25,12,906,510,12,'#f5ead2','#927f62',2);
   round(c,45,61,535,424,6,'#f9f1dc','#bfb298');
   c.strokeStyle='#9aaea51f';c.lineWidth=1;for(var x=50;x<580;x+=20){c.beginPath();c.moveTo(x,62);c.lineTo(x,483);c.stroke();}for(var y=63;y<485;y+=20){c.beginPath();c.moveTo(46,y);c.lineTo(578,y);c.stroke();}
   c.strokeStyle='#be77665e';c.beginPath();c.moveTo(74,63);c.lineTo(74,483);c.stroke();
   c.fillStyle='#6a7c7333';c.fillRect(592,27,1,456);c.fillStyle='#fff7e4aa';c.fillRect(594,27,1,456);
   round(c,610,73,300,130,8,'#e9ddbf','#b1a488');round(c,620,84,133,107,5,'#f7e8cc','#cfab87');round(c,766,84,133,107,5,'#e1e6d1','#92aaa0');
   round(c,610,216,300,110,8,'#fbf0d7','#b1a488');round(c,610,341,300,137,8,'#e8e3cc','#a5b09e');
   for(var n=0;n<5;n++){art.ellipse(c,34,85+n*86,4,7,'#716c5a');art.ellipse(c,34,82+n*86,2,3,'#b1a488');}
   c.strokeStyle='#a99d84';c.lineWidth=1;c.beginPath();c.moveTo(45,493);c.lineTo(908,493);c.stroke();c.restore();
  }},stamp('circleStamp',640,true),stamp('crossStamp',768,false),
  {name:'graphDot',x:896,y:0,w:128,h:128,paint:function(c,w,h,art){art.ellipse(c,65,72,35,30,'#40504b33');art.ellipse(c,64,63,33,33,art.radial(c,64,63,33,[[0,'#6e857c'],[.65,'#48685f'],[1,'#2b4a46']],53,49));art.ellipse(c,55,53,7,5,'#f9f2d288');}}
 ]};
 var model=root.PureModel,config=model.config;
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function dashed(r,x1,y1,x2,y2,width,color){var steps=6;for(var i=0;i<steps;i++){var a=(i+.12)/steps,b=(i+.78)/steps;r.line(x1+(x2-x1)*a,y1+(y2-y1)*a,x1+(x2-x1)*b,y1+(y2-y1)*b,width,color);}}
 function geometry(s){var gap=s.rows===3?100:84;return{gap:gap,x:306-s.cols*gap/2,y:270-s.rows*gap/2};}
 function points(s,e,g){var h=(s.rows+1)*s.cols,row,col;if(e<h){row=Math.floor(e/s.cols);col=e%s.cols;return[g.x+col*g.gap,g.y+row*g.gap,g.x+(col+1)*g.gap,g.y+row*g.gap];}e-=h;row=Math.floor(e/(s.cols+1));col=e%(s.cols+1);return[g.x+col*g.gap,g.y+row*g.gap,g.x+col*g.gap,g.y+(row+1)*g.gap];}
 function render(r,s){
  var l=config.layouts[s.level],g=geometry(s),h=(s.rows+1)*s.cols,outside=s.orientation==='h'?s.cursor.col===s.cols:s.cursor.row===s.rows;
  var selected=outside?-1:s.orientation==='h'?s.cursor.row*s.cols+s.cursor.col:h+s.cursor.row*(s.cols+1)+s.cursor.col,claimed=!outside&&s.edges[selected]!==0;
  var color=outside||claimed?C.red:C.gold;
  r.sprite('graphBook',480,270,960,540,0,'#ffffff');text(r,l.name,52,23,28,C.ink);text(r,s.cols+' x '+s.rows+' BOXES',658,26,24,C.muted);
  for(var row=0;row<s.rows;row++)for(var col=0;col<s.cols;col++){var owner=s.owners[row*s.cols+col],xx=g.x+col*g.gap,yy=g.y+row*g.gap;if(owner){r.rect(xx+8,yy+8,g.gap-16,g.gap-16,owner===1?'#db957733':'#5d9c8e2b');r.sprite(owner===1?'circleStamp':'crossStamp',xx+g.gap/2,yy+g.gap/2,55,55,0,'#ffffff');}}
  for(var e=0;e<s.edges.length;e++){var p=points(s,e,g),owner=s.edges[e];if(owner){r.line(p[0],p[1]+2,p[2],p[3]+2,7,'#5b655420');r.line(p[0],p[1],p[2],p[3],6,owner===1?C.player:C.ai);}else dashed(r,p[0],p[1],p[2],p[3],2,'#83998c77');}
  if(s.lastAI){var p=points(s,s.lastAI.edge,g);r.line(p[0],p[1],p[2],p[3],10,'#254e4844');r.line(p[0],p[1],p[2],p[3],3,'#f9efc6');}
  var x=g.x+s.cursor.col*g.gap,y=g.y+s.cursor.row*g.gap,x2=x+(s.orientation==='h'?(outside?32:g.gap):0),y2=y+(s.orientation==='v'?(outside?32:g.gap):0);
  r.line(x,y,x2,y2,14,outside||claimed?'#c76b5640':'#e2a23855');dashed(r,x,y,x2,y2,4,color);
  if(s.orientation==='h'){r.line(x2-15,y2-6,x2-7,y2,2,color);r.line(x2-7,y2,x2-15,y2+6,2,color);}else{r.line(x2-6,y2-15,x2,y2-7,2,color);r.line(x2,y2-7,x2+6,y2-15,2,color);}
  for(var rr=0;rr<=s.rows;rr++)for(var cc=0;cc<=s.cols;cc++)r.sprite('graphDot',g.x+cc*g.gap,g.y+rr*g.gap,25,25,0,'#ffffff');
  r.circle(x,y,15,C.gold);r.circle(x,y,10,C.paper);r.circle(x,y,5,C.ink);
  for(var cc=0;cc<=s.cols;cc++)center(r,cc+1,g.x+cc*g.gap,g.y-39,24,s.cursor.col===cc?C.gold:C.muted);
  for(var rr=0;rr<=s.rows;rr++)center(r,rr+1,g.x-32,g.y+rr*g.gap-12,24,s.cursor.row===rr?C.gold:C.muted);
  text(r,'YOU  O',635,97,24,C.player);center(r,s.playerBoxes,686,130,42,C.player);
  text(r,'AI   X',779,97,24,C.ai);center(r,s.aiBoxes,831,130,42,C.ai);
  text(r,'DOT R'+(s.cursor.row+1)+' C'+(s.cursor.col+1),625,227,24,C.ink);
  text(r,s.orientation==='h'?'H  TO THE RIGHT':'V  DOWNWARD',625,258,24,C.ink);
  text(r,outside?'OUTSIDE':claimed?'ALREADY DRAWN':'FREE EDGE',625,290,24,color);
  text(r,'UNDRAWN  '+s.remaining,625,352,26,C.ink);
  var yours=s.lastPlayer?s.lastPlayer.boxes.length:0,aiBoxes=s.aiTrail.reduce(function(n,m){return n+m.boxes.length;},0);
  text(r,'YOUR LAST  +'+yours,625,389,24,C.player);text(r,'AI '+s.aiTrail.length+' EDGES / +'+aiBoxes,625,423,24,C.ai);
  text(r,'A TURN',53,499,24,C.gold);text(r,'B DRAW',254,499,24,C.player);text(r,'CAPTURE = GO AGAIN',467,499,24,C.ink);
 }
 root.GameDef={id:'dots-boxes',title:'点线围格',seed:config.defaultSeed,accent:C.player,background:C.bg,atlas:atlas,holdConfirmAsA:true,
  tagline:'一笔围格，连手争先',levelLabel:'残局',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['切换方向','画线'],
  description:'从公开残局开始，与对手轮流画线。方向移动圆点，A 切换向右横线或向下竖线，B 画出预览边。围成方格便归你所有，并可继续画线；没有围格则由对手行动。全部边画完后，你的方格更多才算胜利。',
  controls:{move:'方向键移动圆点',a:'空格、Z、确认 / 手机右上：横竖切换',b:'X / 手机右下：画出预览边'},
  tip:'圆环方格归你，叉形归对手。围格后继续行动，对手也一样。虚线尚未画，金色预览是当前边；红色表示已画或越界。全部画完后，方格多者胜。',
  winTitle:'围格占先，胜局落定',loseTitle:'方格未占先，重新落笔',
  hud:function(s){return[{label:'你的方格',value:s.playerBoxes},{label:'对手方格',value:s.aiBoxes},{label:'剩余边线',value:s.remaining},{label:'预览方向',value:s.orientation==='h'?'横向右':'竖向下'}];},
  result:function(s){return(s.phase==='won'?'你的方格更多，取得胜利。':s.reason==='draw'?'双方方格相同；和局未完成胜利目标。':'对手的方格更多，请再挑战。')+'最终 '+s.playerBoxes+' 比 '+s.aiBoxes+'，你画了 '+s.playerMoves+' 条边，用时 '+s.elapsed.toFixed(1)+' 秒。';},render:render};
})(window);
