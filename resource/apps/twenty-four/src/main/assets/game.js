(function(root){
  'use strict';
  var config=root.PureModel.config,cream='#f3dfb2',gold='#d8af63',ink='#3c3444';
  function poly(c,p,fill,stroke){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'equationdesk',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#4c3545'],[1,'#282d3c']]);c.fillRect(0,0,960,540);c.strokeStyle='#c4a27a18';c.lineWidth=1;for(var y=10;y<540;y+=19){c.beginPath();c.moveTo(0,y);c.bezierCurveTo(200,y-6,600,y+6,960,y);c.stroke();}
      c.fillStyle='#282a39';c.fillRect(25,18,911,59);c.strokeStyle='#b89360';c.lineWidth=2;c.strokeRect(28,21,905,53);c.fillStyle='#c39159';c.fillRect(26,18,7,59);
      poly(c,[[36,96],[603,96],[603,272],[36,272]],'#263641','#8b8b77');poly(c,[[36,282],[603,282],[603,508],[36,508]],'#312d3e','#a08b6d');
      poly(c,[[626,96],[932,96],[932,264],[626,264]],'#e0c391','#a98858');poly(c,[[626,282],[932,282],[932,508],[626,508]],'#ddcfb0','#a98858');
      c.strokeStyle='#af997555';c.lineWidth=1;for(var y=323;y<494;y+=42){c.beginPath();c.moveTo(645,y);c.lineTo(913,y);c.stroke();}
      for(var x of[44,595,634,924])for(var y of[104,256,290,500]){art.ellipse(c,x,y,3,3,'#c6a570');c.strokeStyle='#6d6658';c.lineWidth=1;c.beginPath();c.moveTo(x-2,y);c.lineTo(x+2,y);c.stroke();}c.restore();
    }},
    {name:'equationcard',x:640,y:0,w:128,h:192,paint:function(c,w,h,art){c.fillStyle='#14263066';c.fillRect(4,7,123,182);c.fillStyle=art.linear(c,0,3,0,186,[[0,'#f5e7ca'],[1,'#d8c7a3']]);c.fillRect(1,1,122,184);c.strokeStyle='#b3a17f';c.lineWidth=2;c.strokeRect(5,5,114,176);c.strokeStyle='#c5b08a88';c.lineWidth=1;c.beginPath();c.moveTo(12,44);c.lineTo(112,44);c.moveTo(12,151);c.lineTo(112,151);c.stroke();}},
    {name:'equationkey',x:768,y:0,w:128,h:80,paint:function(c,w,h,art){c.fillStyle='#171f2c88';c.fillRect(3,7,124,72);c.fillStyle=art.linear(c,0,2,0,71,[[0,'#e0ca9b'],[1,'#b29b70']]);c.fillRect(1,1,122,69);c.strokeStyle='#eedeb8';c.lineWidth=2;c.strokeRect(4,4,116,61);}},
    {name:'equationseal',x:896,y:0,w:128,h:128,paint:function(c,w,h,art){art.ellipse(c,64,65,59,59,'#ad865024');c.strokeStyle='#9c7746';c.lineWidth=2;c.beginPath();c.arc(64,64,54,0,Math.PI*2);c.arc(64,64,48,0,Math.PI*2);c.stroke();for(var k=0;k<16;k++){var a=k*Math.PI/8;c.beginPath();c.moveTo(64+Math.cos(a)*55,64+Math.sin(a)*55);c.lineTo(64+Math.cos(a)*59,64+Math.sin(a)*59);c.stroke();}}}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||cream);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function value(t){return t.d===1?String(t.n):t.n+'/'+t.d;}
  function sources(mask){return['A','B','C','D'].filter((_,i)=>mask&(1<<i)).join('');}
  function sized(r,t,w,start){var n=start;while(n>20&&r.measureText(String(t),n)>w)n--;return n;}
  function rational(r,t,x,y,w){if(t.d===1){var size=sized(r,t.n,w-18,45);center(r,t.n,x,y+50-size*.35,size,ink);}else{var size=Math.min(28,sized(r,t.n,w-18,28),sized(r,t.d,w-18,28)),bar=Math.max(r.measureText(String(t.n),size),r.measureText(String(t.d),size))+15;center(r,t.n,x,y+20,size,ink);r.rect(x-bar/2,y+51,bar,2,'#64546a');center(r,t.d,x,y+58,size,ink);}}
  function render(r,s){
    var l=config.layouts[s.level];r.sprite('equationdesk',480,270,960,540,0,'#ffffff');text(r,l.name,47,38,28,cream);text(r,'TWENTY FOUR',752,41,23,'#c9b795');
    var w=122,gap=12,total=s.terms.length*w+(s.terms.length-1)*gap,start=320-total/2;
    for(var i=0;i<s.terms.length;i++){var t=s.terms[i],x=start+i*(w+gap),y=116;r.sprite('equationcard',x+w/2,y+74,w,148,0,'#ffffff');var role=t.mask===s.firstMask?'L':t.mask===s.secondMask?'R':'';if(role)frame(r,x+3,y+3,w-10,140,role==='L'?'#3b7d80':'#b56556',3);if(s.stage!=='operator'&&s.stage!=='retry'&&s.cursor===i)frame(r,x-2,y-2,w+3,151,gold,3);text(r,sources(t.mask),x+12,y+10,16,'#76684f');if(role){r.rect(x+w-34,y+9,22,22,role==='L'?'#3b7d80':'#b56556');center(r,role,x+w-23,y+10,17,'#fff0c8');}rational(r,t,x+w/2,y+26,w);center(r,t.expr,x+w/2,y+122,16,'#6d5a61');}
    var heading=s.stage==='first'?'CHOOSE FIRST NUMBER':s.stage==='second'?'CHOOSE SECOND NUMBER':s.stage==='operator'?'CHOOSE OPERATION':'RESULT IS NOT 24';text(r,heading,54,293,23,gold);
    for(var k=0;k<6;k++){var x=54+(k%3)*176,y=341+Math.floor(k/3)*54;r.sprite('equationkey',x+80,y,163,42,0,s.stage==='operator'?'#ffffff':'#a4a3a0');if(s.stage==='operator'&&s.opIndex===k)frame(r,x-3,y-24,166,47,'#f2cf7d',3);center(r,config.operators[k].label,x+80,y-11,25,ink);}
    var left=s.terms.find(t=>t.mask===s.firstMask),right=s.terms.find(t=>t.mask===s.secondMask),selected=s.terms[s.cursor];text(r,left?'L: '+value(left)+(right?'     R: '+value(right):'     R: ?'):selected.expr+' = '+value(selected),54,433,22,'#d1cfb9');
    text(r,s.stage==='retry'?'A RESET / B UNDO WITH TICKET':'A CONFIRM / B CANCEL OR UNDO',54,473,22,cream);
    r.sprite('equationseal',779,178,122,122,0,'#ffffff');center(r,'TARGET',779,109,18,'#785e43');center(r,'24',779,146,63,'#4f3e4c');center(r,'EXACT / USE ALL FOUR',779,237,18,'#785e43');
    text(r,'ORIGINAL CARDS',646,297,21,'#6e5c4c');for(var k=0;k<4;k++)text(r,String.fromCharCode(65+k)+' = '+s.cards[k],653+(k%2)*143,337+Math.floor(k/2)*43,26,ink);
    text(r,'FAILED '+s.failures+' / 3',652,426,23,'#79554e');text(r,'UNDO '+s.undoTickets+' / 2',652,467,23,'#465a64');
    text(r,'L = FIRST / R = SECOND',39,525,17,'#c8c5af');text(r,'FRACTIONS ARE EXACT / NO CARD REUSE',498,525,17,'#c8c5af');
  }
  root.GameDef={id:'twenty-four',title:'四则二十四',seed:config.defaultSeed,accent:gold,background:'#3e3446',atlas,holdConfirmAsA:true,
    tagline:'四牌各一次，精确得二十四',levelLabel:'算题',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['选数 / 运算 / 重置','取消 / 撤销'],
    description:'四张原始牌各用一次，最终精确得到24。左右选数，A 先选L再选R，再从六种带方向的加减乘除中确认。分数按精确分子分母计算，重复数字也按A/B/C/D来源分别使用。',
    controls:{move:'左右循环选择数或运算；上下不使用',a:'空格、Z、确认 / 手机右上：选数、确认运算；失败结果页重置四牌',b:'X、B / 手机右下：先免费取消待定操作；否则用票撤销一步'},
    tip:'L为先选数，R为后选数，减除两个方向各有菜单。B撤销最多两次，且不退还合并步数或失败机会；重置也不补票。四牌用完但非24记一次失败，三次结束；除以0免费拒绝。式中A/B/C/D对应右侧原牌。',
    winTitle:'四牌合一，精确二十四',loseTitle:'三次完整结果均未达标',
    hud:function(s){return[{label:'当前尝试',value:s.currentAttempt+' / 3'},{label:'失败次数',value:s.failures+' / 3',tone:s.failures>=2?'warn':''},{label:'撤销票',value:s.undoTickets+' / 2'},{label:'已合并步数',value:s.mergesUsed}];},
    result:function(s){var t=s.terms[0];return(s.phase==='won'?'四张原牌来源完整，结果精确等于24。':'三次完整结果都未得到24。')+'最后算式 '+t.expr+' = '+value(t)+'；累计合并 '+s.mergesUsed+' 步，失败 '+s.failures+' 次，撤销 '+s.undoUsed+' 次。';},render};
})(window);
