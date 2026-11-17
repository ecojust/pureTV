(function(root){
  'use strict';
  var config=root.PureModel.config,colors=['#ffffff','#f4ac94','#88cbd5','#c8b7ed','#f0cd83','#98cbb1'];
  function rounded(c,x,y,w,h,r,fill,stroke){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'towerlab',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#243e6b'],[.5,'#162c51'],[1,'#101e3a']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#6c8ab31b';c.lineWidth=1;
      for(var x=0;x<960;x+=32){c.beginPath();c.moveTo(x,0);c.lineTo(x,540);c.stroke();}for(var y=0;y<540;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(960,y);c.stroke();}
      rounded(c,22,19,916,54,12,'#112244','#496a98');rounded(c,26,93,908,60,11,'#101f3a99','#3e5f89');
      // Three sockets are connected by the visible transfer rail.
      c.strokeStyle='#85a8cf';c.lineWidth=3;c.beginPath();c.moveTo(183,185);c.lineTo(183,167);c.lineTo(777,167);c.lineTo(777,185);c.stroke();
      c.strokeStyle='#405f8b';c.lineWidth=1;c.beginPath();c.moveTo(183,172);c.lineTo(777,172);c.stroke();
      [183,480,777].forEach(function(cx){
        art.ellipse(c,cx,414,130,31,'#09162c');art.ellipse(c,cx,410,121,25,'#345482');art.ellipse(c,cx,410,112,19,'#1a3358');
        c.strokeStyle='#7593b855';c.lineWidth=1;c.beginPath();c.arc(cx,410,110,Math.PI,Math.PI*2);c.stroke();
        [cx-111,cx+111].forEach(function(bx){art.ellipse(c,bx,416,4,2,'#c5c9c3');});
      });
      rounded(c,26,481,908,39,9,'#10213d','#3e5f89');
      c.fillStyle='#f0ac92';c.fillRect(44,39,7,16);c.fillStyle='#96c8d2';c.fillRect(56,32,7,23);c.fillStyle='#cbbbec';c.fillRect(68,27,7,28);
      c.restore();
    }},
    {name:'steelpeg',x:640,y:0,w:100,h:240,paint:function(c,w,h,art){
      art.ellipse(c,50,225,26,11,'#2c4366');
      rounded(c,38,16,24,213,8,art.linear(c,38,0,62,0,[[0,'#425b7a'],[.35,'#d6e1e6'],[.65,'#92a9be'],[1,'#3a567a']]),'#263d5e');
      art.ellipse(c,50,18,12,7,'#e3e9e7');art.ellipse(c,50,18,7,3,'#899eb4');
      c.fillStyle='#edf4f066';c.fillRect(43,29,3,187);
    }},
    {name:'machinedring',x:0,y:800,w:240,h:112,paint:function(c,w,h,art){
      art.ellipse(c,120,89,115,17,'#08182d55');
      rounded(c,5,35,230,50,22,art.linear(c,0,35,0,85,[[0,'#eff5f2'],[.2,'#bdcccd'],[.55,'#a2b8bf'],[.7,'#dce5e0'],[1,'#708d9e']]),'#506a85');
      art.ellipse(c,120,37,115,25,art.linear(c,0,10,0,62,[[0,'#fcfff5'],[1,'#b2c5ca']]));
      c.strokeStyle='#f9ffed';c.lineWidth=2;c.beginPath();c.ellipse(120,37,106,20,0,0,Math.PI*2);c.stroke();
      art.ellipse(c,120,35,19,8,'#28415e');art.ellipse(c,120,34,13,4,'#8196ab');
      rounded(c,102,50,36,28,6,'#eef4e7','#6a8797');
    }}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||'#eef1e7');}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function render(r,s){
    var l=config.layouts[s.level],xs=[183,480,777];r.sprite('towerlab',480,270,960,540,0,'#ffffff');
    text(r,l.name,94,34,29,'#eef1e7');text(r,'MOVES '+s.movesUsed+' / '+s.moveLimit,612,35,27,'#f2cf8e');
    text(r,s.source===null?'A: MARK SOURCE':'A: TRANSFER TOP RING',46,110,27,s.source===null?'#b4d3eb':'#f6b9a3');
    text(r,'TARGET: PEG 3',660,112,25,'#a3ddc5');
    xs.forEach(function(x,p){r.sprite('steelpeg',x,291,76,242,0,'#ffffff');
      s.pegs[p].forEach(function(d,index){var y=393-index*35,width=80+d*28;
        r.sprite('machinedring',x,y,width,49,0,colors[d]);center(r,d,x,y-9,22,'#1b3652');
      });
      if(s.source===p){var topY=393-(s.pegs[p].length-1)*35,topDisk=s.pegs[p][s.pegs[p].length-1];
        frame(r,x-(80+topDisk*28)/2-6,topY-25,92+topDisk*28,48,'#f5ad94',3);
        center(r,'SOURCE',x,190,25,'#f5ad94');r.line(x,219,x,topY-31,2,'#f5ad94');
      }
      if(s.selected===p){frame(r,x-128,438,256,32,'#f2d590',3);r.circle(x,433,4,'#f2d590');}
      center(r,'PEG '+(p+1)+'   '+s.pegs[p].length+'/'+s.diskCount,x,442,24,p===s.target?'#a3ddc5':'#b8cde4');
      if(!s.pegs[p].length)center(r,'EMPTY',x,352,24,'#7699c0');
    });
    text(r,'< > SELECT',45,490,23,'#f2d590');text(r,'B CANCEL SOURCE',294,490,23,'#b8cde4');
    text(r,s.lastMove?'LAST: '+(s.lastMove.from+1)+' > '+(s.lastMove.to+1)+' / #'+s.lastMove.disk:'SMALL ON LARGE',659,491,21,'#b8cde4');
  }
  root.GameDef={id:'ring-towers',title:'环塔迁移',seed:config.defaultSeed,accent:'#efb49e',background:'#162c51',atlas,holdConfirmAsA:true,
    tagline:'小环在上，整塔远行',levelLabel:'环塔',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['选来源 / 搬环','取消来源'],
    description:'左右选柱，A 标记来源，再选择落点按 A 搬动顶环。大环不能压小环。把整座环塔迁到右侧第 3 柱。B 只取消来源，不能撤回已经完成的搬动。',
    controls:{move:'左右选择柱子',a:'空格、Z、确认 / 手机右上：来源或落环',b:'X、B / 手机右下：取消来源'},
    tip:'数字越大，环越宽。珊瑚框是来源顶环，金框是当前选择；标记来源不会拿走环。只有合法搬环扣次数，最后一次完成仍能获胜。长按不连动。',
    winTitle:'整塔迁移完成',loseTitle:'搬环次数已用尽',
    hud:function(s){return[{label:'目标柱',value:s.pegs[2].length+' / '+s.diskCount,tone:'good'},
      {label:'剩余搬动',value:s.moveLimit-s.movesUsed,tone:s.moveLimit-s.movesUsed<=3?'warn':''},
      {label:'当前选择',value:'第 '+(s.selected+1)+' 柱'},
      {label:'来源柱',value:s.source===null?'未选择':'第 '+(s.source+1)+' 柱'}];},
    result:function(s){return(s.phase==='won'?'所有环已按大小顺序抵达目标柱。':'环塔尚未全部抵达，请重新安排大小环的迁移顺序。')+'搬动 '+s.movesUsed+'/'+s.moveLimit+' 次，用时 '+s.elapsed.toFixed(1)+' 秒。';},render};
})(window);
