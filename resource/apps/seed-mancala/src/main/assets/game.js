(function(root){
  'use strict';
  var config=root.PureModel.config,cream='#f4e0b4',green='#acc9a4';
  function ellipse(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  function round(c,x,y,w,h,r){c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
  var atlas={builtins:[],tiles:[
    {name:'sowingboard',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#284a42'],[1,'#182e2b']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#9db89114';c.lineWidth=1;for(var x=12;x<960;x+=28){c.beginPath();c.moveTo(x,0);c.lineTo(x+160,540);c.stroke();}
      c.fillStyle='#112e2866';c.fillRect(23,21,914,54);c.strokeStyle='#8ca78c';c.strokeRect(23,21,914,54);
      ellipse(c,480,298,454,154,'#11221c88');
      c.beginPath();round(c,30,137,900,302,70);c.fillStyle='#6a3e22';c.fill();
      c.beginPath();round(c,30,124,900,302,70);c.fillStyle=art.linear(c,30,124,930,426,[[0,'#cb9f61'],[.45,'#edcd8d'],[1,'#ad773f']]);c.fill();c.strokeStyle='#f3d99c';c.lineWidth=3;c.stroke();
      c.save();c.clip();c.strokeStyle='#85572e33';c.lineWidth=2;for(var y=132;y<430;y+=17){c.beginPath();c.moveTo(40,y);c.bezierCurveTo(280,y-15,630,y+16,922,y-2);c.stroke();}c.restore();
      c.strokeStyle='#a7794933';c.lineWidth=2;c.beginPath();c.moveTo(180,280);c.lineTo(780,280);c.stroke();
      c.restore();
    }},
    {name:'seedpit',x:640,y:0,w:112,h:112,paint:function(c,w,h,art){
      ellipse(c,56,60,53,49,'#69452c');ellipse(c,56,54,53,49,art.linear(c,0,0,0,112,[[0,'#f6d99c'],[1,'#a06d3b']]),'#9b6435');
      ellipse(c,56,53,43,39,art.linear(c,0,18,0,98,[[0,'#3b3429'],[.35,'#59472e'],[1,'#9a7440']]),'#d1aa69');
      c.strokeStyle='#d3aa6333';c.lineWidth=2;c.beginPath();c.ellipse(56,54,33,29,0,.1,2.8);c.stroke();
    }},
    {name:'seedstore',x:768,y:0,w:112,h:240,paint:function(c,w,h,art){
      c.beginPath();round(c,6,8,100,224,49);c.fillStyle='#8c5d34';c.fill();c.strokeStyle='#f6d99c';c.lineWidth=3;c.stroke();
      c.beginPath();round(c,14,16,84,207,40);c.fillStyle=art.linear(c,0,16,0,223,[[0,'#383728'],[.5,'#605032'],[1,'#947748']]);c.fill();c.strokeStyle='#bd934f';c.lineWidth=2;c.stroke();
      c.strokeStyle='#d5b56a44';c.beginPath();c.ellipse(56,188,28,20,0,0,Math.PI);c.stroke();
    }},
    {name:'seed',x:888,y:0,w:48,h:64,paint:function(c,w,h,art){
      ellipse(c,26,37,15,22,'#1b231b55');ellipse(c,23,29,15,22,art.linear(c,9,7,36,52,[[0,'#ffedb4'],[.45,'#d5ab53'],[1,'#a97637']]),'#8e6028');c.strokeStyle='#fff0bc99';c.lineWidth=2;c.beginPath();c.moveTo(19,13);c.quadraticCurveTo(13,28,21,42);c.stroke();
    }}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||cream);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function label(p){return p===6?'PS':p===13?'ES':p<6?'P'+(p+1):'E'+(p-6);}
  function render(r,s){
    var layout=config.layouts[s.level],last=s.lastSow;r.sprite('sowingboard',480,270,960,540,0,'#ffffff');
    text(r,layout.name,45,37,27,cream);text(r,'SEED MANCALA',680,39,24,green);
    text(r,'E  OPPONENT  < < <',174,93,22,'#d2c1a5');text(r,'24 SEEDS / 13+ TO WIN',592,93,22,green);
    for(var col=0;col<6;col++){var cx=225+102*col;
      for(var row=0;row<2;row++){var cy=row?354:211,p=row?col:12-col,selected=row&&s.selected===p,visited=last&&last.path.includes(p),landing=last&&last.last===p;
        if(selected)r.circle(cx,cy,47,'#f8edbc');else if(landing)r.circle(cx,cy,45,'#eab95d');else if(visited)r.circle(cx,cy,44,'#93bc99');
        r.sprite('seedpit',cx,cy,87,91,0,'#ffffff');
        var n=Math.min(s.pits[p],8);for(var k=0;k<n;k++){var angle=(k*2.4)-1.6;r.sprite('seed',cx+Math.cos(angle)*27,cy+Math.sin(angle)*25,8,11,angle,'#ffffff');}
        center(r,s.pits[p],cx,cy-16,32,s.pits[p]?'#fff1cc':'#b39c6c');center(r,label(p),cx,row?407:147,19,row?'#3b5138':'#624b39');
        if(selected){r.rect(cx-23,399,46,3,'#2f5a40');}
      }
    }
    r.sprite('seedstore',100,277,110,255,0,'#ffffff');r.sprite('seedstore',860,277,110,255,0,'#ffffff');
    center(r,'E STORE',100,178,19,'#e2c1a5');center(r,'P STORE',860,178,19,'#d1e1af');
    center(r,s.aiStore,100,246,42,'#f2d4b8');center(r,s.playerStore,860,246,42,'#e9efbd');
    center(r,'THEIRS',100,341,18,'#cbb395');center(r,'YOURS',860,341,18,'#c3d19d');
    center(r,'PLAYER  > > >',480,432,21,green);
    if(last){var top='LAST '+(last.side==='player'?'P':'E')+' : '+label(last.from)+' / '+last.seeds+' SEEDS / CAPTURE '+last.captured+' / AI SOWS '+s.aiBurstCount;
      text(r,top,44,463,21,cream);var path=last.path.map(label);for(var line=0;line<Math.ceil(path.length/12);line++)text(r,(line?'> ':'PATH ')+path.slice(line*12,line*12+12).join(' > '),44,490+line*23,20,last.extraTurn?'#efd097':'#acc4aa');
    }else{text(r,'LEFT / RIGHT SELECT   A SOW   B UNUSED',44,464,23,cream);text(r,'LAST SEED IN YOUR STORE = ANOTHER SOW',44,497,21,green);}
  }
  root.GameDef={id:'seed-mancala',title:'播子棋盘',seed:config.defaultSeed,accent:'#d8c286',background:'#253f35',atlas,holdConfirmAsA:true,
    tagline:'逐颗播种，收籽过半',levelLabel:'残局',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['播种'],
    description:'你控制下排 P 种穴和右侧种仓。左右选穴，A 取出全部籽逐颗环播，跳过对方种仓。末籽入己仓再走；末籽落空己穴且对穴非空时，吃掉两穴籽。',
    controls:{move:'左右循环选择下排种穴；上下无操作',a:'空格、Z、确认 / 手机右侧：播种',b:'本游戏不使用 B'},
    tip:'一侧种穴全空即收盘，余籽归各自种仓；24 籽中取得 13 籽或更多获胜。对手优先再走、吃籽、入仓，再按穴号决定。平局或 160 次播种未决按失败处理。',
    winTitle:'丰收在手',loseTitle:'本局播种结束',
    hud:function(s){return[{label:'己仓 / 对仓',value:s.playerStore+' / '+s.aiStore},{label:'所选种穴',value:'P'+(s.selected+1)+' · '+s.pits[s.selected]},
      {label:'玩家已播',value:s.playerSows},{label:'总播种',value:s.sowCount+' / 160'}];},
    result:function(s){return(s.reason==='sow-limit'?'达到播种上限，未决平局按失败处理。':s.reason==='tie'?'双方同籽，平局按失败处理。':'收盘完成。')+'己仓 '+s.playerStore+' 籽，对仓 '+s.aiStore+' 籽；你播种 '+s.playerSows+' 次。';},render};
})(window);
