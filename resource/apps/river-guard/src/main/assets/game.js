(function(root){
  'use strict';
  var config=root.PureModel.config,ink='#e5e8c5',gold='#edc989';
  function poly(c,points,fill,stroke){c.beginPath();c.moveTo(points[0][0],points[0][1]);for(var k=1;k<points.length;k++)c.lineTo(points[k][0],points[k][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'riverbanks',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#213e47'],[1,'#172f3d']]);c.fillRect(0,0,960,540);
      c.fillStyle='#112b33';c.fillRect(24,22,912,53);c.strokeStyle='#8bada2';c.lineWidth=1;c.strokeRect(24,22,912,53);
      poly(c,[[32,102],[268,102],[278,178],[265,252],[279,345],[266,487],[32,487]],'#52745d','#98aa7a');
      poly(c,[[417,102],[625,102],[625,487],[411,487],[404,414],[417,325],[403,236],[416,166]],'#71855f','#b8b98a');
      c.fillStyle=art.linear(c,280,102,404,487,[[0,'#517d8c'],[.5,'#3f647a'],[1,'#2c4d66']]);c.fillRect(282,103,118,384);
      c.strokeStyle='#a3c4c366';c.lineWidth=2;for(var y=122;y<483;y+=27){c.beginPath();c.moveTo(282,y);c.bezierCurveTo(312,y-10,356,y+12,400,y);c.stroke();}
      c.strokeStyle='#d9d09b33';c.lineWidth=2;for(var j=0;j<16;j++){var x=j%2?47:590,yy=122+j*21;c.beginPath();c.moveTo(x,yy+9);c.lineTo(x+3,yy);c.lineTo(x+6,yy+9);c.stroke();}
      c.fillStyle='#223e3a';c.fillRect(646,100,288,389);c.strokeStyle='#859f86';c.strokeRect(646,100,288,389);
      c.strokeStyle='#b5ba8066';c.beginPath();c.moveTo(661,330);c.lineTo(920,330);c.stroke();c.restore();
    }},
    {name:'ferryboat',x:640,y:0,w:256,h:128,paint:function(c,w,h,art){
      art.ellipse(c,128,112,116,12,'#18374477');poly(c,[[13,43],[238,43],[213,94],[53,105]],art.linear(c,0,43,0,104,[[0,'#dc9f58'],[1,'#95603d']]),'#ecc58a');
      poly(c,[[22,43],[66,24],[203,24],[237,43]],'#f2d3a0','#986c47');poly(c,[[41,41],[72,32],[197,32],[217,41]],'#5b4a37');
      c.strokeStyle='#ffd59966';c.lineWidth=3;c.beginPath();c.moveTo(58,72);c.lineTo(218,65);c.moveTo(65,88);c.lineTo(210,79);c.stroke();
      c.fillStyle='#c18d56';c.fillRect(94,33,12,65);c.fillRect(163,33,12,58);
    }},
    {name:'cargocard',x:640,y:136,w:256,h:96,paint:function(c,w,h,art){
      poly(c,[[4,10],[247,3],[252,83],[9,91]],'#173d3555');poly(c,[[3,3],[248,3],[248,83],[3,83]],art.linear(c,0,0,0,92,[[0,'#ecdfb6'],[1,'#bbbd8e']]),'#f5e7bb');
      c.fillStyle='#769783';c.fillRect(10,11,56,62);c.strokeStyle='#547866';c.strokeRect(14,15,48,54);c.strokeStyle='#738b6e66';c.beginPath();c.moveTo(77,67);c.lineTo(234,67);c.stroke();
    }},
    {name:'farmer',x:904,y:0,w:80,h:128,paint:function(c,w,h,art){
      poly(c,[[18,125],[21,77],[38,62],[58,77],[64,125]],'#e1be79','#96744f');art.ellipse(c,40,49,18,23,'#e4ba8b');
      poly(c,[[13,37],[24,13],[55,13],[67,37]],'#d5aa55','#ae8044');art.ellipse(c,40,37,36,8,'#e9c979','#b18a4b');
      c.fillStyle='#3d6660';c.fillRect(28,80,24,37);c.fillStyle='#233a39';c.fillRect(32,51,3,3);c.fillRect(47,51,3,3);
    }}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function render(r,s){
    var l=config.layouts[s.level];r.sprite('riverbanks',480,270,960,540,0,'#ffffff');text(r,l.name,44,38,27,gold);text(r,'RIVER GUARD',724,40,24,'#bed5bc');
    center(r,'LEFT / START',150,111,21,'#e6e2b0');center(r,'RIGHT / GOAL',517,111,21,'#f1eac5');
    for(var p=0;p<s.items.length;p++){var cx=s.sides[p]?516:151,cy=159+p*51,loaded=s.cargo.includes(p),danger=s.dangerPairs.some(pair=>pair.includes(p));
      if(s.selected===p)frame(r,cx-95,cy-25,190,49,'#f7e7ac',3);else if(danger)frame(r,cx-93,cy-24,186,48,'#ed9c75',3);
      r.sprite('cargocard',cx,cy,181,45,0,'#ffffff');center(r,p+1,cx-64,cy-13,25,'#f2edce');text(r,s.items[p].name,cx-33,cy-11,22,'#355747');
      if(loaded){r.rect(cx+74,cy-22,16,42,'#e8ba6f');center(r,'+',cx+82,cy-10,20,'#415b46');}
    }
    var bx=s.farmer?398:284;r.sprite('farmer',bx,414,38,61,0,'#ffffff');r.sprite('ferryboat',bx,448,132,66,0,'#ffffff');center(r,'FARMER',bx,472,18,gold);
    text(r,'CONFLICT PAIRS',664,113,23,gold);text(r,'UNSAFE WITHOUT FARMER',664,144,18,'#b6cab4');
    for(var k=0;k<s.conflicts.length;k++){var pair=s.conflicts[k],danger=s.dangerPairs.some(q=>q[0]===pair[0]&&q[1]===pair[1]),t=(pair[0]+1)+' '+s.items[pair[0]].name+' - '+(pair[1]+1)+' '+s.items[pair[1]].name;text(r,t,665,178+k*35,20,danger?'#ffb795':'#d4ddbd');}
    text(r,'LOAD '+s.cargo.length+' / '+s.capacity,665,348,26,gold);text(r,s.cargo.length?'ITEM '+s.cargo.map(p=>p+1).join(' + '):'EMPTY BOAT IS ALLOWED',665,386,s.cargo.length?24:18,'#bed4ba');
    text(r,'A TOGGLE CARGO',665,432,21,ink);text(r,'B CROSS RIVER',665,461,21,ink);
    text(r,'CROSSINGS '+s.crossingsUsed+' / '+s.crossingLimit,44,511,22,'#c3d8bd');text(r,'KEEP EVERY UNATTENDED BANK SAFE',405,511,21,'#bacab4');
  }
  root.GameDef={id:'river-guard',title:'渡河守则',seed:config.defaultSeed,accent:gold,background:'#24483d',atlas,holdConfirmAsA:true,
    tagline:'先看留岸，再开小船',levelLabel:'渡口',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['勾选 / 取消货物','开船'],
    description:'船工驾驶小船。方向键按物品编号切换，A 勾选同岸货物，B 开船，可空船返回。任何无人看管的岸上都不能同时出现图中冲突对；有船工在场则安全。',
    controls:{move:'四向循环选择物品；左/上前一件，右/下后一件',a:'空格、Z、确认 / 手机右上：勾选或取消货物',b:'X、B / 手机右下：开船，可空船'},
    tip:'物品编号对应右栏全部冲突对，规则以明示连对为准。货物只在开船时换岸；船工不占货位。把全部物品和船工送到右岸，且不超出次数，即可获胜。',
    winTitle:'两岸平安，运送完成',loseTitle:'本次渡河未完成',
    hud:function(s){return[{label:'右岸物品',value:s.deliveredCount+' / '+s.items.length},{label:'船工所在',value:s.farmer?'右岸':'左岸'},
      {label:'当前物品',value:(s.selected+1)+' '+s.items[s.selected].nameZh},{label:'载货 / 容量',value:s.cargo.length+' / '+s.capacity}];},
    result:function(s){return(s.reason==='delivered'?'全部物品和船工安全到达右岸。':s.reason==='danger'?'无人看管的岸上留下冲突对：'+s.dangerPairs.map(p=>(p[0]+1)+'与'+(p[1]+1)).join('、')+'。':'渡河次数已用完。')+'本次共渡河 '+s.crossingsUsed+' / '+s.crossingLimit+' 次。';},render};
})(window);
