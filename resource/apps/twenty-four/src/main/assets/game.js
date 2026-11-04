(function(root){
  'use strict';
  var config=root.PureModel.config,cream='#f3dfb2',gold='#d8af63',ink='#3c3444';
  function poly(c,p,fill,stroke){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'equationdesk',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,0,540,[[0,'#48352a'],[1,'#241f20']]);c.fillRect(0,0,960,540);
      for(var y=5;y<540;y+=18){c.strokeStyle='#c39a6520';c.lineWidth=2;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(300,y-5,620,y+5,960,y);c.stroke();}
      c.beginPath();c.ellipse(480,251,465,234,0,0,Math.PI*2);c.fillStyle='#aa8956';c.fill();c.beginPath();c.ellipse(480,249,454,222,0,0,Math.PI*2);c.fillStyle='#123e3d';c.fill();c.strokeStyle='#c9b47b88';c.lineWidth=1;c.stroke();
      c.beginPath();c.ellipse(480,249,442,212,0,0,Math.PI*2);c.strokeStyle='#75978155';c.lineWidth=2;c.stroke();
      c.fillStyle='#092e3080';c.fillRect(166,103,628,228);c.strokeStyle='#9cae8b55';c.strokeRect(166,103,628,228);
      for(var i=0;i<48;i++){var x=178+(i*113)%604,y=115+(i*47)%200;c.fillStyle='#e8ddbd05';c.fillRect(x,y,2,2);}
      c.fillStyle=art.linear(c,0,410,0,514,[[0,'#8d6b43'],[1,'#4b392b']]);c.fillRect(135,411,690,106);c.strokeStyle='#c1a574';c.lineWidth=2;c.strokeRect(138,414,684,99);
      for(var x of [146,814])for(var y of [422,505]){art.ellipse(c,x,y,3,3,'#ddc593');}
      c.restore();
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
    var l=config.layouts[s.level];r.sprite('equationdesk',480,270,960,540,0,'#ffffff');
    center(r,l.name,480,23,25,'#f3e4bc');
    var stage=s.stage==='first'?0:s.stage==='second'?1:2;
    ['1  PICK L','2  PICK R','3  OPERATE'].forEach(function(label,i){var x=263+i*151;r.rect(x,65,132,28,i===stage?'#d8b978':'#234d48');center(r,label,x+66,71,16,i===stage?ink:'#abc3ae');});
    var w=s.terms.length===1?222:132,gap=16,total=s.terms.length*w+(s.terms.length-1)*gap,start=480-total/2;
    for(var i=0;i<s.terms.length;i++){var t=s.terms[i],x=start+i*(w+gap),y=122;r.sprite('equationcard',x+w/2,y+93,w,186,0,'#ffffff');var role=t.mask===s.firstMask?'L':t.mask===s.secondMask?'R':'';if(role)frame(r,x+3,y+3,w-10,178,role==='L'?'#3b7d80':'#b56556',3);if(s.stage!=='operator'&&s.stage!=='retry'&&s.cursor===i)frame(r,x-3,y-3,w+5,190,gold,3);text(r,sources(t.mask),x+13,y+13,18,'#76684f');if(role){r.rect(x+w-36,y+10,24,24,role==='L'?'#3b7d80':'#b56556');center(r,role,x+w-24,y+12,18,'#fff0c8');}rational(r,t,x+w/2,y+48,w);center(r,t.expr,x+w/2,y+157,sized(r,t.expr,w-16,17),'#6d5a61');}
    text(r,'DEALT',40,110,20,'#dbc792');
    for(var k=0;k<4;k++){var x=34,y=145+k*54;r.rect(x,y,102,46,'#f4e6c8');text(r,String.fromCharCode(65+k),x+9,y+14,18,'#887356');center(r,s.cards[k],x+66,y+9,28,ink);}
    r.sprite('equationseal',872,147,115,115,0,'#ffffff');center(r,'TARGET',872,105,17,'#dfcc9d');center(r,'24',872,136,51,'#f5e9c4');
    text(r,'ATTEMPT',832,236,17,'#bbc7ab');center(r,s.currentAttempt+' / 3',876,263,25,'#f2ddad');text(r,'UNDO',846,310,17,'#bbc7ab');center(r,s.undoTickets+' / 2',876,338,25,'#f2ddad');
    var left=s.terms.find(t=>t.mask===s.firstMask),right=s.terms.find(t=>t.mask===s.secondMask),selected=s.terms[s.cursor];
    var formula=left?'L = '+value(left)+(right?'    R = '+value(right):'    R = ?'):selected.expr+' = '+value(selected);
    center(r,formula,480,347,sized(r,formula,610,27),'#f2e6be');
    center(r,s.stage==='retry'?'RESULT IS NOT 24  /  A RETRY  /  B UNDO':'EXACT FRACTIONS  /  USE EACH CARD ONCE',480,385,17,s.stage==='retry'?'#f5b098':'#a9c0af');
    for(var k=0;k<6;k++){var x=150+k*112;r.sprite('equationkey',x+49,459,100,52,0,s.stage==='operator'?'#ffffff':'#a4a3a0');if(s.stage==='operator'&&s.opIndex===k)frame(r,x-3,430,105,57,'#ffe4a0',3);center(r,config.operators[k].label,x+49,446,21,ink);}
    center(r,'A CONFIRM     B CANCEL / UNDO',480,493,15,'#f5e2ba');
    text(r,'SOURCE LETTERS STAY WITH EVERY RESULT',180,526,14,'#c5bfa2');
  }
  root.GameDef={id:'twenty-four',stylesheet:'game-theme.css',title:'四则二十四',seed:config.defaultSeed,accent:gold,background:'#3e3446',atlas,holdConfirmAsA:true,
    tagline:'四牌各一次，精确得二十四',levelLabel:'算题',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['选数 / 运算 / 重置','取消 / 撤销'],
    description:'四张原始牌各用一次，最终精确得到24。左右选数，A 先选L再选R，再从六种带方向的加减乘除中确认。分数按精确分子分母计算，重复数字也按A/B/C/D来源分别使用。',
    controls:{move:'左右：选择数字或运算',a:'A / 确认：选数或确认运算',b:'B / X：取消；无待选时撤销'},
    tip:'L先选、R后选；减除可换方向。四牌各用一次精确得24。撤销不退失败，三错结束；分数精确，除零免费拒绝。',
    winTitle:'四牌合一，精确二十四',loseTitle:'三次完整结果均未达标',
    hud:function(s){return[{label:'当前尝试',value:s.currentAttempt+' / 3'},{label:'失败次数',value:s.failures+' / 3',tone:s.failures>=2?'warn':''},{label:'撤销票',value:s.undoTickets+' / 2'},{label:'已合并步数',value:s.mergesUsed}];},
    result:function(s){var t=s.terms[0];return(s.phase==='won'?'四张原牌来源完整，结果精确等于24。':'三次完整结果都未得到24。')+'最后算式 '+t.expr+' = '+value(t)+'；累计合并 '+s.mergesUsed+' 步，失败 '+s.failures+' 次，撤销 '+s.undoUsed+' 次。';},render};
})(window);
