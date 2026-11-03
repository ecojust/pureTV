(function(root){
  'use strict';
  var config=root.PureModel.config,colors=['#ffffff','#a96c76','#b18e4d','#638c99','#7b79aa','#8f9870','#be8d55','#5e947c','#7979a2','#987b9d','#568e98'];
  function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  function poly(c,points){c.beginPath();c.moveTo(points[0][0],points[0][1]);for(var i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.closePath();c.fill();}
  function shape(c,id){c.fillStyle='#ffffff';c.strokeStyle='#ffffff';c.lineWidth=7;
    if(id===1){c.beginPath();c.arc(36,36,22,0,Math.PI*2);c.stroke();}
    else if(id===2)poly(c,[[36,10],[64,60],[8,60]]);
    else if(id===3)poly(c,[[36,5],[66,36],[36,67],[6,36]]);
    else if(id===4){var points=[];for(var k=0;k<10;k++){var a=-Math.PI/2+k*Math.PI/5,r=k%2?13:29;points.push([36+Math.cos(a)*r,36+Math.sin(a)*r]);}poly(c,points);}
    else if(id===5){for(var f=0;f<6;f++){var t=f*Math.PI/3;c.beginPath();c.ellipse(36+Math.cos(t)*15,36+Math.sin(t)*15,13,9,t,0,Math.PI*2);c.fill();}c.beginPath();c.arc(36,36,10,0,Math.PI*2);c.fill();}
    else if(id===6){c.beginPath();c.arc(36,36,15,0,Math.PI*2);c.fill();for(var ray=0;ray<8;ray++){var a2=ray*Math.PI/4;c.beginPath();c.moveTo(36+Math.cos(a2)*22,36+Math.sin(a2)*22);c.lineTo(36+Math.cos(a2)*30,36+Math.sin(a2)*30);c.stroke();}}
    else if(id===7){c.beginPath();c.moveTo(15,59);c.bezierCurveTo(9,21,36,11,61,12);c.bezierCurveTo(62,43,48,68,15,59);c.fill();c.save();c.globalCompositeOperation='destination-out';c.lineWidth=3;c.beginPath();c.moveTo(19,56);c.lineTo(51,22);c.stroke();c.restore();}
    else if(id===8){c.beginPath();c.arc(36,36,27,0,Math.PI*2);c.fill();c.save();c.globalCompositeOperation='destination-out';c.beginPath();c.arc(48,27,25,0,Math.PI*2);c.fill();c.restore();}
    else if(id===9){var hex=[];for(var h=0;h<6;h++)hex.push([36+29*Math.cos(h*Math.PI/3),36+29*Math.sin(h*Math.PI/3)]);poly(c,hex);}
    else poly(c,[[26,8],[46,8],[46,26],[64,26],[64,46],[46,46],[46,64],[26,64],[26,46],[8,46],[8,26],[26,26]]);
  }
  var tiles=[
    {name:'gallery',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#4a3e53'],[1,'#292b42']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#b29a8b1d';c.lineWidth=2;for(var x=0;x<960;x+=80){c.beginPath();c.moveTo(x,0);c.lineTo(x,540);c.stroke();}
      round(c,22,19,916,56,10,'#28253a','#a89377');round(c,30,93,571,397,12,'#211f3299','#796f75');
      round(c,625,97,298,91,9,'#eee4d3','#d3c1a1');round(c,625,207,298,100,9,'#332d43','#8a7c80');
      round(c,625,326,298,163,9,'#332d43','#8a7c80');
      // Gallery picture-light rail and brass fittings.
      c.fillStyle='#bda27a';c.fillRect(45,87,540,3);[68,310,552].forEach(function(lx){round(c,lx-19,82,38,9,4,'#d8c49c','#6d675b');});
      c.strokeStyle='#b69c7a';c.lineWidth=2;c.beginPath();c.moveTo(35,510);c.lineTo(925,510);c.stroke();
      c.restore();
    }},
    {name:'cardback',x:640,y:0,w:112,h:144,paint:function(c,w,h,art){
      round(c,3,5,106,136,9,art.linear(c,0,0,112,144,[[0,'#8f7588'],[1,'#51415e']]),'#c2ad9b');
      round(c,11,13,90,120,5,'#51445f','#c3aa83');
      c.strokeStyle='#ba9a9577';c.lineWidth=1;
      for(var y=25;y<125;y+=20)for(var x=21;x<100;x+=20){c.beginPath();c.moveTo(x,y-6);c.lineTo(x+6,y);c.lineTo(x,y+6);c.lineTo(x-6,y);c.closePath();c.stroke();}
      round(c,34,49,44,46,7,'#342f48','#d5bc8d');c.strokeStyle='#d5bc8d';c.lineWidth=3;c.beginPath();c.arc(56,72,13,0,Math.PI*2);c.stroke();
    }},
    {name:'cardface',x:752,y:0,w:112,h:144,paint:function(c,w,h,art){
      round(c,3,5,106,136,9,art.linear(c,0,0,112,144,[[0,'#fff9e9'],[1,'#d9d3be']]),'#cabd9f');
      round(c,11,13,90,120,5,'#f6f0df','#c3bda9');
      c.strokeStyle='#cec5b3';c.lineWidth=1;c.beginPath();c.moveTo(25,108);c.lineTo(87,108);c.stroke();
    }}
  ];
  for(var id=1;id<=10;id++)(function(symbol){tiles.push({name:'symbol'+symbol,x:((symbol-1)%5)*72,y:800+Math.floor((symbol-1)/5)*72,w:72,h:72,paint:function(c){shape(c,symbol);}});})(id);
  var atlas={builtins:[],tiles};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||'#f0e6d5');}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function render(r,s){
    var l=config.layouts[s.level],slotW=552/l.width,slotH=372/l.height,w=slotW-15,h=slotH-12,ox=39,oy=105;
    r.sprite('gallery',480,270,960,540,0,'#ffffff');text(r,l.name,45,36,29,'#f1e5d0');text(r,'MEMORY GALLERY',637,39,24,'#d4bc94');
    for(var i=0;i<s.visibleFaces.length;i++){
      var x=ox+(i%l.width)*slotW+slotW/2,y=oy+Math.floor(i/l.width)*slotH+slotH/2,face=s.visibleFaces[i];
      r.sprite(face===null?'cardback':'cardface',x,y,w,h,0,s.locked[i]?'#cee5ca':'#ffffff');
      if(face!==null){var icon=Math.min(w*.58,h*.46);r.sprite('symbol'+face,x,y-h*.1,icon,icon,0,colors[face]);center(r,face,x,y+h*.23,24,'#423c4b');}
      if(s.locked[i]){frame(r,x-w/2+4,y-h/2+6,w-8,h-12,'#92c8a9',2);r.circle(x+w/2-12,y-h/2+15,3,'#47755e');}
      if(s.first===i||s.second===i)frame(r,x-w/2+2,y-h/2+4,w-4,h-8,'#e2a58c',2);
      if(s.cursor===i)frame(r,x-w/2-1,y-h/2+1,w+2,h-2,'#f0d296',3);
    }
    text(r,'PAIRS FOUND',645,108,23,'#80796c');text(r,s.matchedPairs+' / '+s.pairCount,645,143,30,'#384e4c');
    text(r,'MISTAKES',645,220,23,'#c4b8b8');text(r,s.mistakes+' / '+s.mistakeLimit,645,256,30,s.mistakes>=s.mistakeLimit-1?'#efb28e':'#f0e6d5');
    var title=s.stage==='preview'?'LOOK & REMEMBER':s.stage==='compare'?'COMPARE TWO':'FIND A PAIR';
    text(r,title,643,343,23,'#edcf99');
    center(r,s.stage==='preview'?s.previewRemaining.toFixed(1)+' s':s.stage==='compare'?s.compareRemaining.toFixed(1)+' s':'A REVEAL',774,389,31,'#f0e6d5');
    text(r,s.stage==='preview'?'ALL FACES VISIBLE':s.stage==='compare'?'WAIT, THEN RELEASE':'SHAPE + NUMBER',645,443,21,'#c4b8b8');
    text(r,'ARROWS SELECT',45,516,19,'#ccbfb3');text(r,'MATCHES STAY VISIBLE',365,516,19,'#ccbfb3');text(r,'B UNUSED',800,516,19,'#ccbfb3');
  }
  root.GameDef={id:'memory-gallery',title:'记忆陈列',seed:config.defaultSeed,accent:'#dfbd91',background:'#352f47',atlas,holdConfirmAsA:true,
    tagline:'看一眼陈列，记住每一对',levelLabel:'展厅',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['翻开展品'],
    description:'先记住短暂预览中的展品位置，盖牌后用方向选卡、A 翻开。相同图形与编号会配成一对；错配展示一秒后盖回并计一次失误。全部配对即可完成。',
    controls:{move:'四向选择展品',a:'空格、Z、确认 / 手机右侧：翻牌',b:'B 无操作'},
    tip:'图形和编号一起帮助记忆。预览或比较期间不能翻牌，结束后松开再按。已配对展品保持正面，不能与同一张配对。暂停会冻结预览和比较。',
    winTitle:'展品成对，巡展完成',loseTitle:'错配次数已到上限',
    hud:function(s){return[{label:'已配对',value:s.matchedPairs+' / '+s.pairCount,tone:'good'},{label:'错配次数',value:s.mistakes+' / '+s.mistakeLimit,tone:s.mistakes>=s.mistakeLimit-1?'warn':''},
      {label:'当前阶段',value:s.stage==='preview'?'记忆预览':s.stage==='compare'?'错配比较':'选择展品'},{label:'已翻牌',value:s.flips+' 张'}];},
    result:function(s){return(s.phase==='won'?'全部展品已经成对陈列。':'错配额度已用完，可以重试并重新观察开场预览。')+'配对 '+s.matchedPairs+'/'+s.pairCount+'，错配 '+s.mistakes+'/'+s.mistakeLimit+'，用时 '+s.elapsed.toFixed(1)+' 秒。';},render};
})(window);
