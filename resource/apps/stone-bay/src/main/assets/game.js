(function(root){
  'use strict';
  var config=root.PureModel.config, C={ink:'#e8e6ce',muted:'#b5c4b7',gold:'#e8c67d',green:'#8ed2b0',dark:'#18333b'};
  function polygon(c,points,fill,stroke){c.beginPath();c.moveTo(points[0][0],points[0][1]);for(var i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'courtyard',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);
      c.fillStyle=art.linear(c,0,0,960,540,[[0,'#25464e'],[.6,'#173940'],[1,'#0d2b35']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#789d8b1b';c.lineWidth=2;
      for(var y=0;y<540;y+=38){c.beginPath();c.moveTo(0,y);c.lineTo(960,y);c.stroke();for(var x=(y/38%2)*48;x<960;x+=96){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+38);c.stroke();}}
      polygon(c,[[21,17],[940,17],[940,521],[21,521]],'#132e36cc','#4d6c68');
      c.fillStyle='#829580';c.fillRect(33,26,892,3);c.fillStyle='#071f28';c.fillRect(33,508,892,3);
      // Moss and small ivy leaves soften the carved stone margin.
      for(var k=0;k<18;k++){var yy=58+k*24;art.ellipse(c,28+(k%2)*5,yy,7,3,'#71966a');}
      c.fillStyle='#d6c691';c.fillRect(551,86,2,399);
      polygon(c,[[577,89],[912,89],[912,188],[577,188]],'#28494d','#78928a');
      polygon(c,[[577,207],[912,207],[912,328],[577,328]],'#1e3f45','#68877c');
      polygon(c,[[577,347],[912,347],[912,434],[577,434]],'#1c3b43','#68877c');
      c.restore();
    }},
    {name:'floorstone',x:640,y:0,w:112,h:112,paint:function(c,w,h,art){
      polygon(c,[[3,3],[107,3],[109,107],[3,109]],art.linear(c,0,0,112,112,[[0,'#697b75'],[1,'#455e5e']]),'#243f46');
      c.strokeStyle='#a4b5a130';c.lineWidth=2;c.beginPath();c.moveTo(9,10);c.lineTo(99,10);c.moveTo(10,10);c.lineTo(10,95);c.stroke();
      c.strokeStyle='#233f4633';c.lineWidth=1;c.beginPath();c.moveTo(88,23);c.lineTo(78,39);c.lineTo(83,48);c.moveTo(20,77);c.lineTo(37,83);c.lineTo(43,99);c.stroke();
    }},
    {name:'wallstone',x:752,y:0,w:128,h:128,paint:function(c,w,h,art){
      polygon(c,[[3,16],[112,16],[125,29],[125,120],[15,120],[3,107]],'#263f48','#112d39');
      polygon(c,[[3,16],[112,16],[112,107],[3,107]],art.linear(c,0,0,110,110,[[0,'#9baba0'],[1,'#657e78']]),'#40595e');
      polygon(c,[[112,16],[125,29],[125,120],[112,107]],'#3b5860');
      polygon(c,[[3,107],[112,107],[125,120],[15,120]],'#223e49');
      c.strokeStyle='#425f6033';c.lineWidth=3;c.beginPath();c.moveTo(5,61);c.lineTo(111,61);c.moveTo(57,16);c.lineTo(57,61);c.moveTo(30,61);c.lineTo(30,107);c.stroke();
      c.strokeStyle='#d1d7bd66';c.lineWidth=2;c.beginPath();c.moveTo(10,23);c.lineTo(105,23);c.moveTo(10,23);c.lineTo(10,54);c.stroke();
      art.ellipse(c,22,93,12,4,'#7c987466');
    }},
    {name:'stonecrate',x:0,y:800,w:144,h:144,paint:function(c,w,h,art){
      art.ellipse(c,74,127,62,12,'#071e2755');
      polygon(c,[[12,27],[115,27],[132,42],[132,126],[29,126],[12,109]],'#816c4c','#223842');
      polygon(c,[[12,27],[115,27],[115,109],[12,109]],art.linear(c,0,27,115,109,[[0,'#ded1a5'],[1,'#a99a74']]),'#4d5c51');
      polygon(c,[[115,27],[132,42],[132,126],[115,109]],'#817b61');
      polygon(c,[[12,109],[115,109],[132,126],[29,126]],'#5c6558');
      c.strokeStyle='#faf2cb';c.lineWidth=3;c.beginPath();c.moveTo(19,36);c.lineTo(107,36);c.moveTo(21,36);c.lineTo(21,102);c.stroke();
      c.strokeStyle='#867e5d';c.lineWidth=4;c.strokeRect(34,45,59,48);
      c.strokeStyle='#c6b78d';c.lineWidth=2;c.strokeRect(39,50,49,38);
    }},
    {name:'worker',x:144,y:800,w:128,h:160,paint:function(c,w,h,art){
      art.ellipse(c,65,145,37,10,'#061d2866');
      polygon(c,[[39,114],[59,114],[57,147],[35,147]],'#1b3443','#0a2533');
      polygon(c,[[68,114],[88,114],[94,147],[72,147]],'#1b3443','#0a2533');
      art.ellipse(c,65,91,40,37,art.linear(c,0,64,0,125,[[0,'#e6ad70'],[1,'#ad6e44']]));
      c.fillStyle='#524a3a';c.fillRect(32,106,64,10);
      art.ellipse(c,29,91,12,22,'#bd824f');art.ellipse(c,99,91,12,22,'#bd824f');
      art.ellipse(c,65,49,33,34,'#253e47');art.ellipse(c,65,54,24,25,'#e4bc8c');
      art.ellipse(c,65,28,35,18,'#dca45c');c.fillStyle='#f1cc7c';c.fillRect(30,28,70,12);
      art.ellipse(c,65,37,42,8,'#e8b970');
      c.fillStyle='#203a43';c.fillRect(54,52,4,5);c.fillRect(73,52,4,5);
      c.strokeStyle='#ad7e56';c.lineWidth=2;c.beginPath();c.moveTo(59,67);c.lineTo(70,67);c.stroke();
    }}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function render(r,s){
    var l=config.layouts[s.level],unit=Math.min(61,390/l.height),ox=48+(488-unit*l.width)/2,oy=83+(400-unit*l.height)/2;
    r.sprite('courtyard',480,270,960,540,0,'#ffffff');text(r,l.name,49,40,30,C.ink);text(r,'STONE BAY',714,44,25,C.gold);
    for(var n=0;n<l.walls.length;n++){
      var x=ox+(n%l.width)*unit,y=oy+Math.floor(n/l.width)*unit;
      r.sprite('floorstone',x+unit/2,y+unit/2,unit,unit,0,'#ffffff');
      if(l.targets.indexOf(n)>=0){r.circle(x+unit/2,y+unit/2,unit*.31,'#cbb374');r.circle(x+unit/2,y+unit/2,unit*.25,'#334f55');r.circle(x+unit/2,y+unit/2,unit*.11,'#dac384');
        r.line(x+unit*.5,y+unit*.13,x+unit*.5,y+unit*.87,1,'#eedda077');r.line(x+unit*.13,y+unit*.5,x+unit*.87,y+unit*.5,1,'#eedda077');}
      if(l.walls[n])r.sprite('wallstone',x+unit/2,y+unit/2,unit,unit,0,'#ffffff');
    }
    s.crates.forEach(function(p,i){var x=ox+(p%l.width)*unit,y=oy+Math.floor(p/l.width)*unit,on=l.targets.indexOf(p)>=0;
      r.sprite('stonecrate',x+unit/2,y+unit/2,unit*.94,unit*.94,0,on?'#b7e3b1':'#ffffff');
      center(r,i+1,x+unit*.46,y+unit*.35,23,'#334a44');if(on)frame(r,x+3,y+5,unit-6,unit-8,C.green,2);
    });
    var px=ox+(s.player%l.width)*unit+unit/2,py=oy+Math.floor(s.player/l.width)*unit+unit/2;
    r.sprite('worker',px,py-3,unit*.68,unit*.91,0,'#ffffff');
    var dx=s.facing==='right'?1:s.facing==='left'?-1:0,dy=s.facing==='down'?1:s.facing==='up'?-1:0;
    r.circle(px+dx*unit*.4,py+dy*unit*.4,3,C.gold);
    text(r,'STONES SEATED',596,101,24,C.muted);text(r,s.matched+' / '+s.crates.length,596,136,34,C.green);
    text(r,'PUSHES',596,218,24,C.muted);text(r,s.pushCount+' / '+s.pushLimit,596,252,34,s.pushLimit-s.pushCount<=2?C.gold:C.ink);
    text(r,'WALKING IS FREE',596,298,20,C.muted);
    text(r,'A UNDO  '+s.history.length,596,360,24,C.ink);text(r,'NO PUSH REFUND',596,398,22,C.gold);
    text(r,'PUSH ONLY / NO PULL',587,454,23,C.ink);
    text(r,s.historyDropped?'OLD STEPS DROPPED: '+s.historyDropped:'ANY STONE / ANY SOCKET',587,484,19,C.muted);
    text(r,'STEP '+s.steps,49,490,20,C.muted);
  }
  root.GameDef={id:'stone-bay',title:'石箱归位',seed:config.defaultSeed,accent:C.gold,background:'#173940',atlas,holdConfirmAsA:true,
    tagline:'绕过石墙，推箱落座',levelLabel:'庭院',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['撤回一步'],
    description:'四向行走，站在石箱后方把它推向圆形石座。只能推，不能拉或连推。步行免费，每次推箱消耗一次推力。A 撤回一步，但不退推力。全部落座即胜利。',
    controls:{move:'四向移动 / 推动前方石箱',a:'空格、Z、确认 / 手机右侧：撤回一步',b:'B 无操作'},
    tip:'箱子编号仅作辨认，任何箱都能落在任何石座。最后一次落座仍算胜利，否则推力耗尽立即结束。A 保留最近128步撤回，已用推力不退。长按不连走。',
    winTitle:'石箱落座，庭院归整',loseTitle:'推力额度已耗尽',
    hud:function(s){return[{label:'已落座',value:s.matched+' / '+s.crates.length,tone:'good'},{label:'剩余推力',value:s.pushLimit-s.pushCount,tone:s.pushLimit-s.pushCount<=2?'warn':''},
      {label:'步行与推箱',value:s.steps+' 步'},{label:'可撤回',value:s.history.length+' 步'}];},
    result:function(s){return(s.phase==='won'?'所有石箱都已安放在石座上。':'仍有石箱未落座，请重新安排绕行和推箱次序。')+'推箱 '+s.pushCount+'/'+s.pushLimit+' 次，撤回 '+s.undos+' 步，用时 '+s.elapsed.toFixed(1)+' 秒。';},render};
})(window);
