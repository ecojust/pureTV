(function(root){
  'use strict';
  var config=root.PureModel.config,cream='#f8e4b7',gold='#e1b664',ink='#e3e9d7';
  function poly(c,p,fill,stroke){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'bowlinghall',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#1c414c'],[1,'#102833']]);c.fillRect(0,0,960,540);c.strokeStyle='#6e8c8020';c.lineWidth=1;for(var k=-540;k<960;k+=28){c.beginPath();c.moveTo(k,0);c.lineTo(k+540,540);c.stroke();}
      poly(c,[[25,17],[936,17],[936,75],[25,75]],'#133440','#b5b684');c.fillStyle='#c26e4f';c.fillRect(25,17,9,58);
      c.fillStyle='#20312e';c.fillRect(67,84,378,435);c.fillStyle='#c4a16c';c.fillRect(76,86,360,429);c.fillStyle='#273c3e';c.fillRect(95,90,320,420);
      for(var x=113;x<397;x+=20){c.fillStyle=art.linear(c,x,90,x+20,90,[[0,'#d7b778'],[.5,'#e7cc90'],[1,'#c9a96c']]);c.fillRect(x,90,Math.min(20,397-x),420);c.strokeStyle='#92714133';c.lineWidth=1;for(var y=101;y<505;y+=19){c.beginPath();c.moveTo(x+4,y);c.bezierCurveTo(x+8,y+3,x+10,y-2,x+16,y+1);c.stroke();}}
      c.strokeStyle='#6c7d7055';c.lineWidth=2;for(var x=101;x<414;x+=302){c.beginPath();c.moveTo(x,95);c.lineTo(x,506);c.stroke();}
      c.fillStyle='#a56344';c.fillRect(113,458,284,4);c.fillStyle='#a78954';for(var x=155;x<=355;x+=50){poly(c,[[x,340],[x-4,349],[x+4,349]],'#a68c56');}
      c.fillStyle='#15343e';c.fillRect(484,94,450,170);c.fillRect(484,280,450,235);c.strokeStyle='#7e9f95';c.lineWidth=2;c.strokeRect(486,96,446,166);c.strokeRect(486,282,446,231);c.restore();
    }},
    {name:'bowlingpin',x:640,y:0,w:96,h:96,paint:function(c,w,h,art){art.ellipse(c,48,52,42,39,'#172a3b66');art.ellipse(c,48,45,35,35,'#faf0d4');c.strokeStyle='#a8b5a6';c.lineWidth=3;c.beginPath();c.arc(48,45,31,0,Math.PI*2);c.stroke();c.strokeStyle='#b85f4a';c.lineWidth=7;c.beginPath();c.arc(48,45,25,Math.PI*1.04,Math.PI*1.96);c.stroke();art.ellipse(c,34,31,7,4,'#ffffff');}},
    {name:'bowlingdown',x:736,y:0,w:96,h:96,paint:function(c,w,h,art){art.ellipse(c,48,52,42,34,'#23363a55');art.ellipse(c,48,48,36,32,'#c98763');c.strokeStyle='#f6dab0';c.lineWidth=9;c.beginPath();c.moveTo(27,28);c.lineTo(69,68);c.moveTo(69,28);c.lineTo(27,68);c.stroke();}},
    {name:'bowlingball',x:832,y:0,w:96,h:96,paint:function(c,w,h,art){art.ellipse(c,49,52,44,42,'#172a3755');art.ellipse(c,46,45,39,39,art.radial(c,36,28,54,[[0,'#738ba1'],[.5,'#344e6d'],[1,'#172d49']]));art.ellipse(c,32,26,9,5,'#a4b4b970');art.ellipse(c,47,35,6,7,'#122337');art.ellipse(c,63,43,6,7,'#122337');art.ellipse(c,48,56,7,8,'#122337');}},
    {name:'bowlingmark',x:0,y:800,w:96,h:96,paint:function(c){c.strokeStyle='#fff';c.lineWidth=6;c.beginPath();c.moveTo(9,29);c.lineTo(9,9);c.lineTo(29,9);c.moveTo(67,9);c.lineTo(87,9);c.lineTo(87,29);c.moveTo(87,67);c.lineTo(87,87);c.lineTo(67,87);c.moveTo(29,87);c.lineTo(9,87);c.lineTo(9,67);c.stroke();}}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function render(r,s){
    var ox=95,oy=90,l=config.layouts[s.level];r.sprite('bowlinghall',480,270,960,540,0,'#ffffff');text(r,l.name,46,37,28,cream);text(r,'LANE BOWLING',733,40,23,'#b6d0c2');
    if(s.stage==='aiming'&&s.phase==='playing'){var a=s.angle*Math.PI/180,dx=Math.sin(a),dy=-Math.cos(a),bx=ox+config.launchX,by=oy+config.launchY;for(var k=0;k<5;k++){var t=19+k*14;r.line(bx+dx*t,by+dy*t,bx+dx*(t+8),by+dy*(t+8),3,'#254b5f');}var tx=bx+dx*90,ty=by+dy*90;r.line(tx,ty,tx-dx*8+dy*5,ty-dy*8-dx*5,3,'#254b5f');r.line(tx,ty,tx-dx*8-dy*5,ty-dy*8+dx*5,3,'#254b5f');r.sprite('bowlingball',bx,by,26,26,0,'#ffffff');}
    for(var pin of s.pins)if(pin.active){r.sprite(pin.fallen?'bowlingdown':'bowlingpin',ox+pin.x,oy+pin.y,24,24,0,'#ffffff');if(!pin.fallen)center(r,pin.id,ox+pin.x,oy+pin.y-6,11,'#2d4754');}
    if(s.ball&&s.ball.active)r.sprite('bowlingball',ox+s.ball.x,oy+s.ball.y,28,28,Math.atan2(s.ball.vy,s.ball.vx)+Math.PI/2,'#ffffff');
    text(r,s.stage==='rolling'?'BALL IN MOTION':'AIM YOUR NEXT BALL',505,108,25,gold);text(r,'ANGLE',507,151,17,'#a3c1b3');text(r,'POWER',699,151,17,'#a3c1b3');center(r,(s.angle>0?'+':'')+s.angle,554,181,38,cream);text(r,'DEG',603,199,17,'#a3c1b3');
    for(var k=0;k<4;k++)r.rect(700+k*49,187,38,34,k<=s.power?'#e1b664':'#38565c');for(var k=0;k<4;k++)center(r,k+1,719+k*49,194,18,k<=s.power?'#29434a':'#8ca79f');
    text(r,'LEFT / RIGHT',507,236,17,'#bfd0bf');text(r,'UP / DOWN',701,236,17,'#bfd0bf');
    text(r,'PIN RACK',506,296,24,gold);text(r,'STANDING '+s.standingCount+' / '+s.totalPins,696,300,19,ink);
    for(var i=0;i<s.totalPins;i++){var x=536+(i%5)*80,y=352+Math.floor(i/5)*54,p=s.pins[i];r.sprite(p.fallen?'bowlingdown':'bowlingpin',x,y,39,39,0,'#ffffff');if(!p.fallen)center(r,p.id,x,y-9,17,'#2d4754');}
    if(s.stage==='rolling'){text(r,'ROLL '+s.shotElapsed.toFixed(1)+' / 6.0 s',507,452,21,ink);r.rect(507,486,407,7,'#385b60');r.rect(507,486,407*Math.min(1,s.shotElapsed/6),7,gold);}else{var last=s.lastShot;text(r,last?'LAST BALL: '+last.newlyFallen.length+' DOWN':'A TO RELEASE',507,449,24,ink);text(r,last?(last.gutter?'GUTTER / BALL USED':'PINS SWEPT / AIM AGAIN'):'CLEAR EVERY PIN TO WIN',507,483,17,'#adc5b8');}
    text(r,'DASH = INITIAL DIRECTION',75,524,17,'#b5c8b4');text(r,'X = DOWN / FALLEN PINS ARE SWEPT',503,524,17,'#b5c8b4');
  }
  root.GameDef={id:'lane-bowling',title:'球道击柱',seed:config.defaultSeed,accent:gold,background:'#183b47',atlas,holdConfirmAsA:true,
    tagline:'调角蓄力，碰撞连倒',levelLabel:'球道',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['投球'],
    description:'左右调发球角度，上下调四档力度，A 投球。球和瓶按圆形碰撞、冲量与摩擦运动，瓶能互相撞倒。用有限球数清空全部瓶；掉沟也消耗一球。虚线只表示初始方向。',
    controls:{move:'左右调角度，每次3°；上下调力度1–4档',a:'空格、Z、确认 / 手机右侧：投球；滚动中等待',b:'B 不使用；无需其他动作键'},
    tip:'白瓶站立，带X的橙瓶已倒；右侧瓶架记录所有瓶。倒瓶在本球内仍会碰撞，停稳后扫去，站立瓶保留实际位置。每球最多滚动6秒后扫瓶；简化物理不采用专业保龄计分。开始或恢复后先松开输入。',
    winTitle:'全柱击倒，球道清空',loseTitle:'球已用完，仍有立柱',
    hud:function(s){return[{label:'已倒瓶',value:s.fallenCount+' / '+s.totalPins},{label:'剩余球',value:s.shotsRemaining+' / '+s.shotLimit,tone:s.shotsRemaining===0?'warn':''},{label:'角度 / 力度',value:s.angle+'° / '+(s.power+1)},{label:'状态',value:s.stage==='rolling'?'滚动中':'可瞄准'}];},
    result:function(s){return(s.phase==='won'?'全部瓶由实际碰撞或位移推倒。':'已耗尽投球次数，仍有 '+s.standingCount+' 瓶站立。')+'使用 '+s.shotsUsed+' 球，击倒 '+s.fallenCount+' / '+s.totalPins+' 瓶；球瓶碰撞 '+s.totalBallHits+' 次，瓶间碰撞 '+s.totalPinHits+' 次。';},render};
})(window);
