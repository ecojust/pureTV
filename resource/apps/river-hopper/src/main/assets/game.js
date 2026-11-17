(function(root){
  'use strict';
  var config=root.PureModel.config,cream='#f2e5bb',gold='#dcc880',ink='#d3e4cc';
  function poly(c,p,fill,stroke){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'hopperboard',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#254b4b'],[1,'#16373d']]);c.fillRect(0,0,960,540);c.strokeStyle='#73a08e22';c.lineWidth=1;for(var x=0;x<960;x+=22){c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x-9,190,x+10,350,x,540);c.stroke();}
      c.fillStyle='#183b41';c.fillRect(24,17,912,59);c.strokeStyle='#9dae82';c.lineWidth=2;c.strokeRect(26,19,908,55);c.fillStyle='#acc179';c.fillRect(25,18,7,57);
      c.fillStyle='#aaa478';c.fillRect(25,82,440,437);c.fillStyle='#23536b';c.fillRect(35,90,420,180);c.strokeStyle='#72abac66';c.lineWidth=2;for(var y=98;y<270;y+=16)for(var x=42;x<452;x+=55){c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+10,y-5,x+20,y+5,x+31,y);c.stroke();}
      c.fillStyle='#617d4b';c.fillRect(35,270,420,60);c.fillRect(35,450,420,60);c.strokeStyle='#a5b57f55';c.lineWidth=2;for(var y=279;y<510;y+=13)if(y<330||y>450)for(var x=41;x<450;x+=19){c.beginPath();c.moveTo(x,y+4);c.lineTo(x+3,y-2);c.lineTo(x+6,y+4);c.stroke();}
      c.fillStyle='#3e4b50';c.fillRect(35,330,420,120);c.strokeStyle='#d3cf9e';c.lineWidth=3;for(var x=43;x<450;x+=38){c.beginPath();c.moveTo(x,390);c.lineTo(x+20,390);c.stroke();}c.fillStyle='#b9b799';c.fillRect(35,327,420,4);c.fillRect(35,449,420,4);
      c.strokeStyle='#d1dfad55';c.lineWidth=1;for(var x=95;x<455;x+=60){c.beginPath();c.moveTo(x,272);c.lineTo(x,327);c.moveTo(x,453);c.lineTo(x,508);c.stroke();}
      c.fillStyle='#183d43';c.fillRect(485,94,449,128);c.fillRect(485,238,449,277);c.strokeStyle='#87a58a';c.lineWidth=2;c.strokeRect(487,96,445,124);c.strokeRect(487,240,445,273);c.restore();
    }},
    {name:'hopperlog',x:640,y:0,w:160,h:64,paint:function(c,w,h,art){c.fillStyle='#14393b55';c.fillRect(2,15,156,46);c.fillStyle=art.linear(c,0,8,0,56,[[0,'#bd9960'],[.5,'#987344'],[1,'#6e5336']]);c.fillRect(0,8,160,48);c.strokeStyle='#d5b982';c.lineWidth=2;for(var y=18;y<52;y+=11){c.beginPath();c.moveTo(7,y);c.bezierCurveTo(45,y-6,82,y+6,153,y);c.stroke();}art.ellipse(c,8,32,7,21,'#d1ad72');art.ellipse(c,8,32,3,14,'#99713f');art.ellipse(c,152,32,7,21,'#bf9b60');c.strokeStyle='#705131';c.lineWidth=2;c.beginPath();c.ellipse(102,32,12,6,0,0,Math.PI*2);c.stroke();}},
    {name:'hoppercar',x:800,y:0,w:144,h:80,paint:function(c,w,h,art){c.fillStyle='#122c3755';c.fillRect(5,12,135,64);c.fillStyle='#24323b';c.fillRect(24,3,23,74);c.fillRect(96,3,23,74);poly(c,[[8,17],[119,17],[139,25],[139,55],[119,63],[8,63]],'#f3ce8c','#a56c42');poly(c,[[36,22],[89,22],[103,29],[103,51],[89,58],[36,58]],'#47717a','#d9e3b5');c.fillStyle='#b5d1ca';c.fillRect(89,28,10,24);c.fillStyle='#fdedb3';c.fillRect(133,22,5,10);c.fillRect(133,48,5,10);c.fillStyle='#ce7457';c.fillRect(7,23,5,10);c.fillRect(7,47,5,10);}},
    {name:'hopperfrog',x:640,y:96,w:96,h:96,paint:function(c,w,h,art){art.ellipse(c,48,56,36,30,'#173d3e55');poly(c,[[29,35],[10,25],[8,40],[25,52],[10,72],[20,82],[39,65],[57,65],[76,82],[88,72],[71,52],[88,40],[86,25],[67,35]],'#7da45c','#244d42');art.ellipse(c,48,50,27,30,'#b2cf75');art.ellipse(c,48,57,16,19,'#d6e59b');art.ellipse(c,29,28,13,13,'#b2cf75');art.ellipse(c,67,28,13,13,'#b2cf75');art.ellipse(c,29,25,7,7,'#f0efcd');art.ellipse(c,67,25,7,7,'#f0efcd');art.ellipse(c,29,23,3,4,'#203d3e');art.ellipse(c,67,23,3,4,'#203d3e');}},
    {name:'hopperhome',x:736,y:96,w:96,h:96,paint:function(c,w,h,art){poly(c,[[48,6],[88,29],[85,80],[11,80],[8,29]],'#698c5a','#cfda9f');poly(c,[[48,17],[78,34],[75,70],[21,70],[18,34]],'#d8d8a5');c.strokeStyle='#829963';c.lineWidth=2;c.beginPath();c.moveTo(23,77);c.lineTo(73,77);c.stroke();}},
    {name:'hopperheart',x:832,y:96,w:64,h:64,paint:function(c){c.fillStyle='#fff';c.beginPath();c.moveTo(32,57);c.bezierCurveTo(4,39,1,19,12,10);c.bezierCurveTo(23,2,31,11,32,15);c.bezierCurveTo(35,9,44,3,53,11);c.bezierCurveTo(64,21,59,39,32,57);c.fill();}},
    {name:'hopperclock',x:896,y:96,w:64,h:64,paint:function(c,w,h,art){art.ellipse(c,32,34,26,26,'#d7dfb6');c.strokeStyle='#385e5c';c.lineWidth=4;c.beginPath();c.arc(32,34,22,0,Math.PI*2);c.moveTo(32,18);c.lineTo(32,34);c.lineTo(43,40);c.stroke();c.fillStyle='#d7dfb6';c.fillRect(24,2,16,6);}},
    {name:'hoppercheck',x:832,y:176,w:64,h:64,paint:function(c){c.strokeStyle='#fff';c.lineWidth=9;c.lineJoin='round';c.lineCap='round';c.beginPath();c.moveTo(9,34);c.lineTo(24,49);c.lineTo(55,13);c.stroke();}}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function segments(x,width){var left=x-width/2,right=x+width/2,out=[];for(var shift of[-420,0,420]){var a=Math.max(0,left+shift),b=Math.min(420,right+shift);if(b>a)out.push([a,b]);}return out;}
  function dock(r,x,y,id,visited,w){r.sprite('hopperhome',x,y,w,w,0,visited?'#c3e0a5':'#ffffff');center(r,id,x,y-w*.15,w*.33,'#2e544d');if(visited)r.sprite('hoppercheck',x+w*.28,y+w*.26,w*.34,w*.34,0,'#edf1be');}
  function render(r,s){
    var ox=35,oy=90,l=config.layouts[s.level];r.sprite('hopperboard',480,270,960,540,0,'#ffffff');text(r,l.name,46,38,28,cream);text(r,'RIVER HOPPER',740,41,23,'#b7cfaa');
    for(var home of s.homes)dock(r,ox+home.x,oy+30,home.id,s.visited.includes(home.id),48);
    for(var lane of s.lanes)for(var object of lane.objects)for(var span of segments(object.x,lane.width)){var x=ox+(span[0]+span[1])/2,y=oy+30+lane.row*60;r.sprite(lane.type==='river'?'hopperlog':'hoppercar',x,y,span[1]-span[0],lane.type==='river'?44:38,lane.speed<0&&lane.type==='road'?Math.PI:0,lane.type==='road'&&lane.row===5?'#dfa994':'#ffffff');}
    var p=s.player,angle=p.facing==='right'?Math.PI/2:p.facing==='down'?Math.PI:p.facing==='left'?-Math.PI/2:0;r.sprite('hopperfrog',ox+p.x,oy+30+p.row*60,29,29,angle,s.respawnTicks>0?'#d6ddb7':'#ffffff');
    r.sprite('hopperclock',523,131,37,37,0,'#ffffff');text(r,Math.ceil(s.timeLeft)+' s',551,110,36,s.timeLeft<10?'#efab88':cream);text(r,'ACTIVE TIME',509,179,18,'#a9c2a5');
    for(var i=0;i<3;i++)r.sprite('hopperheart',765+i*56,133,32,32,0,i<s.lives?'#dc9b79':'#526b61');text(r,'LIVES '+s.lives+' / 3',752,178,20,ink);
    text(r,'HOME DOCKS',506,251,24,gold);for(var i=0;i<4;i++)dock(r,549+i*96,310,i+1,s.visited.includes(i+1),50);
    text(r,'REACH '+s.target+' DIFFERENT HOMES',506,350,23,cream);text(r,'HOP: ONE CELL',506,392,24,ink);text(r,'LOGS CARRY YOU',506,429,24,ink);text(r,'NO REPEAT DOCKS',506,466,24,gold);
    text(r,s.respawnTicks>0?'RESET / RELEASE ARROWS':'WATER / CARS / EDGE = 1 LIFE',506,497,16,s.respawnTicks>0?'#efb993':'#a9c2a5');
    text(r,'ARROWS HOP / BUTTONS UNUSED',35,525,17,'#bfceaa');text(r,'GRASS BANKS ARE SAFE TO WAIT',503,525,17,'#bfceaa');
  }
  root.GameDef={id:'river-hopper',title:'渡河跃步',seed:config.defaultSeed,accent:gold,background:'#244a4d',atlas,holdConfirmAsA:true,
    tagline:'过车流，乘木漂，寻新家',levelLabel:'河岸',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['不使用'],
    description:'方向键逐格跳跃。避开车道车辆，河道上必须让整个脚步落在原木内；原木会真实带你漂移，漂出边界失去生命。抵达顶端不同家位后回起点，在时间内完成目标数量。',
    controls:{move:'四向跳一步；左右按当前横坐标加减一格，上下保留横坐标',a:'A 不使用；所有移动均用方向键或手机左摇杆',b:'B 不使用'},
    tip:'三条生命。车撞、落水、随木漂出边界、重复家位或落在家位之间都扣一命；手动越界跳跃免费拒绝。原木绕边时角色不瞬移。绿色河岸可等待；回起点短暂停步期间车、木与时钟仍继续，松开方向再跳。',
    winTitle:'不同家位全部抵达',loseTitle:'这次渡河未完成',
    hud:function(s){return[{label:'家位',value:s.goalCount+' / '+s.target},{label:'生命',value:s.lives+' / 3',tone:s.lives<=1?'warn':''},{label:'活动时间',value:Math.ceil(s.timeLeft)+' s',tone:s.timeLeft<10?'warn':''},{label:'所处行',value:s.player.row===6?'起点':s.player.row===3?'河岸':s.player.row<=2?'河道':'车道'}];},
    result:function(s){return(s.phase==='won'?'已抵达 '+s.goalCount+' 个不同家位。':s.reason==='timeout'?'活动时间用完。':'三条生命已经耗尽。')+'完成 '+s.goalCount+' / '+s.target+' 家位，跳跃 '+s.jumps+' 次，失误 '+s.deaths+' 次。';},render};
})(window);
