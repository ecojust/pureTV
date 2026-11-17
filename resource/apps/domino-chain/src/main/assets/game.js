(function(root){
 'use strict';
 var C={bg:'#3b303a',ink:'#f4e5c8',muted:'#cfbba8',gold:'#efc57b',mint:'#a3d1be',red:'#edaa96',dark:'#3e3737',pip:'#4d493d'};
 function round(c,x,y,w,h,r,fill,stroke,weight){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=weight||1;c.stroke();}}
 var atlas={builtins:[],tiles:[
  {name:'dominoTable',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
   c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#785945'],[.4,'#5b4840'],[1,'#382f34']]);c.fillRect(0,0,960,540);
   for(var y=0;y<540;y+=8){c.strokeStyle=y%16?'#f0b98408':'#1c1d240a';c.lineWidth=2;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(250,y-8,600,y+11,960,y+1);c.stroke();}
   round(c,12,8,936,524,15,'#77634b','#bca280',2);round(c,23,17,914,506,10,art.linear(c,23,17,937,523,[[0,'#62484c'],[.5,'#46343d'],[1,'#4b3c41']]),'#281f2a',2);
   c.strokeStyle='#f1d8ac0a';c.lineWidth=1;for(var x=29;x<935;x+=7){c.beginPath();c.moveTo(x,18);c.lineTo(x,522);c.stroke();}for(var y=20;y<522;y+=7){c.beginPath();c.moveTo(24,y);c.lineTo(936,y);c.stroke();}
   round(c,31,19,898,35,7,'#302c33aa','#9f8670');
   round(c,31,66,898,95,8,'#293d3baa','#8ea99a',1.5);round(c,31,170,898,70,8,'#312e33aa','#9f8670');
   round(c,31,251,898,103,8,'#3c3038aa','#bd9870',1.5);round(c,31,366,898,98,8,'#5d4540aa','#bea17c',1.5);
   c.strokeStyle='#bda17c88';c.lineWidth=1;c.beginPath();c.moveTo(40,500);c.lineTo(921,500);c.stroke();
   [[21,17],[939,17],[21,523],[939,523]].forEach(function(p){art.ellipse(c,p[0],p[1],3,3,'#d5bd8a');});c.restore();
  }},
  {name:'ivoryTile',x:640,y:0,w:128,h:128,paint:function(c,w,h,art){
   round(c,4,8,120,117,12,'#181b2533');round(c,4,3,120,117,12,art.linear(c,0,3,128,120,[[0,'#fff4d9'],[.6,'#e8dbb8'],[1,'#b7a88a']]),'#8e7c61',2);
   round(c,10,8,108,103,8,'#f9edcd','#fff9e477',2);c.strokeStyle='#b2a68a';c.lineWidth=2;c.beginPath();c.moveTo(64,12);c.lineTo(64,106);c.stroke();
   art.ellipse(c,64,59,3.5,3.5,'#716957');art.ellipse(c,64,58,1.7,1.7,'#c2b496');
   c.strokeStyle='#ffffff77';c.lineWidth=2;c.beginPath();c.moveTo(18,12);c.lineTo(51,12);c.moveTo(76,12);c.lineTo(109,12);c.stroke();
  }},
  {name:'endBadge',x:768,y:0,w:128,h:128,paint:function(c,w,h,art){
   art.path(c,[[17,8],[111,8],[123,22],[123,106],[110,120],[18,120],[5,106],[5,22]],art.linear(c,0,0,128,128,[[0,'#d6b578'],[1,'#a17a4e']]),'#efd7a0',3);
   round(c,15,18,98,92,8,'#4f3d37','#765b43',2);for(var x of [12,116])for(var y of [17,111])art.ellipse(c,x,y,2,2,'#e5ce99');
  }},
  {name:'tableMark',x:896,y:0,w:128,h:128,paint:function(c,w,h,art){art.ellipse(c,64,64,46,46,'#b39c6a25');c.strokeStyle='#d9bd8799';c.lineWidth=3;c.beginPath();c.arc(64,64,46,0,Math.PI*2);c.stroke();art.path(c,[[64,27],[93,64],[64,101],[35,64]],null,'#d9bd8777',3);}}
 ]};
 var model=root.PureModel,config=model.config,patterns=[[],[[0,0]],[[-1,-1],[1,1]],[[-1,-1],[0,0],[1,1]],[[-1,-1],[1,-1],[-1,1],[1,1]],[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]];
 function text(r,v,x,y,size,color){r.text(String(v),x,y,size,color);}
 function center(r,v,x,y,size,color){text(r,v,x-r.measureText(String(v),size)/2,y,size,color);}
 function frame(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
 function tile(r,a,b,x,y,w,h,tint){r.sprite('ivoryTile',x,y,w,h,0,tint||'#ffffff');[a,b].forEach(function(n,i){var xx=x+(i?1:-1)*w/4;center(r,n,xx,y-22,24,C.pip);patterns[n].forEach(function(p){r.circle(xx+p[0]*6,y+11+p[1]*5,1.9,C.pip);});if(n===0)r.line(xx-4,y+11,xx+4,y+11,1.4,'#8e8671');});}
 function render(r,s){
  var l=config.layouts[s.level],left=s.chain[0].left,right=s.chain[s.chain.length-1].right,selected=config.tiles[s.playerHand[s.cursor]],target=s.end==='left'?left:right,match=selected&&(selected.a===target||selected.b===target);
  r.sprite('dominoTable',480,270,960,540,0,'#ffffff');text(r,l.name,45,23,27,C.ink);text(r,'ALL HANDS ARE OPEN',633,25,24,C.muted);
  text(r,'AI HAND '+s.aiHand.length,45,72,24,C.mint);text(r,'PIP SUM '+s.aiPips,737,72,24,C.mint);
  var ag=Math.min(96,864/Math.max(1,s.aiHand.length)),aw=Math.min(88,ag-6),astart=480-(s.aiHand.length-1)*ag/2;
  if(!s.aiHand.length)center(r,'EMPTY',480,112,26,C.mint);
  s.aiHand.forEach(function(id,i){var t=config.tiles[id],x=astart+i*ag;tile(r,t.a,t.b,x,128,aw,54,'#edf5df');if(s.lastAI&&s.lastAI.type==='draw'&&s.lastAI.tile===id)frame(r,x-aw/2-1,100,aw+2,55,C.mint,1.5);});
  text(r,'DRAW ORDER',45,180,24,C.muted);text(r,'NEXT >',45,208,24,C.gold);
  if(!s.drawPile.length)text(r,'EMPTY - B PASSES IF BLOCKED',273,194,24,C.muted);
  s.drawPile.forEach(function(id,i){var t=config.tiles[id],x=295+i*113;tile(r,t.a,t.b,x,206,92,54,'#ffffff');if(i===0)frame(r,x-48,177,96,58,C.gold,1.5);});
  text(r,s.drawPile.length+' LEFT',806,194,24,C.muted);
  text(r,'CHAIN '+s.chain.length+' TILES',45,257,24,C.muted);text(r,'SELECT '+s.end.toUpperCase(),712,257,24,C.gold);
  r.sprite('endBadge',78,317,79,60,0,'#ffffff');r.sprite('endBadge',882,317,79,60,0,'#ffffff');center(r,'L:'+left,78,300,30,s.end==='left'?C.gold:C.muted);center(r,'R:'+right,882,300,30,s.end==='right'?C.gold:C.muted);
  frame(r,s.end==='left'?37:841,285,82,63,C.gold,2);
  var parts=s.chain.length<=7?s.chain:s.chain.slice(0,3).concat([null],s.chain.slice(-3)),start=480-(parts.length-1)*96/2;
  parts.forEach(function(t,i){var x=start+i*96;if(t){tile(r,t.left,t.right,x,320,88,54,t.owner===2?'#edf5df':t.owner===1?'#fff0d3':'#ffffff');if(s.lastAI&&s.lastAI.type==='play'&&s.lastAI.tile===t.id)frame(r,x-45,291,90,56,C.mint,1.5);}else{center(r,'+'+(s.chain.length-6),x,294,26,C.muted);center(r,'MIDDLE',x,321,24,C.muted);}});
  text(r,'YOU '+s.playerHand.length+' TILES',45,371,24,C.gold);text(r,'PIP SUM '+s.playerPips,737,371,24,C.gold);
  var pg=Math.min(96,864/Math.max(1,s.playerHand.length)),pw=Math.min(88,pg-6),pstart=480-(s.playerHand.length-1)*pg/2;
  if(!s.playerHand.length)center(r,'EMPTY',480,411,26,C.gold);
  s.playerHand.forEach(function(id,i){var t=config.tiles[id],x=pstart+i*pg;tile(r,t.a,t.b,x,429,pw,54,'#ffffff');if(i===s.cursor)frame(r,x-pw/2-2,399,pw+4,58,match?C.gold:C.red,2.5);});
  text(r,selected?'PICK '+selected.a+'|'+selected.b:'NO TILES',44,471,24,C.ink);text(r,'END '+s.end.toUpperCase()+' = '+target,310,471,24,C.gold);
  text(r,selected?(match?'MATCH':'NO MATCH'):'HAND EMPTY',650,471,24,match?C.mint:C.red);
  text(r,'< > TILE',43,508,24,C.muted);text(r,'UP L / DOWN R',252,508,24,C.muted);text(r,'A PLAY',567,508,24,C.gold);text(r,'B DRAW/PASS',744,508,24,C.mint);
 }
 root.GameDef={id:'domino-chain',title:'骨牌接龙',seed:config.defaultSeed,accent:C.gold,background:C.bg,atlas:atlas,holdConfirmAsA:true,
  tagline:'明牌双端，算尽余点',levelLabel:'牌局',levelNames:config.layouts.map(function(l){return l.nameZh;}),actionLabels:['接出骨牌','摸牌或跳过'],
  description:'双方手牌与摸牌顺序全部公开。左右选牌，上选牌链左端、下选右端，A 接上相同点数并自动转向。手中没有任何牌能接两端时，B 摸一张并继续行动；牌堆空则跳过。先出完获胜；双方连续跳过时，剩余点数少者胜。',
  controls:{move:'左右选牌；上选左端，下选右端',a:'空格、Z、确认 / 手机右上：接牌',b:'X / 手机右下：无牌可接时摸牌或跳过'},
  tip:'数字与圆点表示牌面。对手和摸牌顺序全部可见；有任一合法接法就不能摸牌。摸牌后仍是你的回合。堵局比手牌点数，平分需重试；长链中段仅合并显示张数。',
  winTitle:'牌路畅通，接龙获胜',loseTitle:'此局未胜，重新接龙',
  hud:function(s){return[{label:'我的手牌',value:s.playerHand.length+' 张'},{label:'对手手牌',value:s.aiHand.length+' 张'},{label:'剩余摸牌',value:s.drawPile.length+' 张'},{label:'连续跳过',value:s.passStreak+' / 2'}];},
  result:function(s){var cause=s.terminalReceipt?s.terminalReceipt.cause:'';return(cause==='player-empty'?'你先出完了手牌。':cause==='ai-empty'?'对手先出完了手牌。':cause==='blocked-win'?'双方无牌可接，你的余点更少。':cause==='blocked-tie'?'双方余点相同；和局未完成胜利目标。':'双方无牌可接，对手的余点更少。')+'剩余点数：你 '+s.playerPips+'，对手 '+s.aiPips+'。你接出 '+s.playerPlays+' 张牌。';},render:render};
})(window);
