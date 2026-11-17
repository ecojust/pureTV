(function(root){
  'use strict';
  var config=root.PureModel.config,ink='#234e70',grey='#8e9b9d',blue='#245c86',paper='#f8f3df';
  function rounded(c,x,y,w,h,r,fill,stroke){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'graphbinder',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle='#173b56';c.fillRect(0,0,960,540);
      rounded(c,15,11,930,518,14,art.linear(c,0,0,950,540,[[0,'#355c74'],[1,'#102e47']]),'#688b9a');
      rounded(c,42,18,889,502,7,art.linear(c,0,0,0,540,[[0,'#fbf7e7'],[1,'#e4e5d8']]),'#aab9b4');
      c.strokeStyle='#8db2c525';c.lineWidth=1;for(var x=55;x<925;x+=16){c.beginPath();c.moveTo(x,19);c.lineTo(x,519);c.stroke();}for(var y=26;y<520;y+=16){c.beginPath();c.moveTo(43,y);c.lineTo(930,y);c.stroke();}
      c.strokeStyle='#d4867c88';c.lineWidth=2;c.beginPath();c.moveTo(78,19);c.lineTo(78,519);c.stroke();
      for(var b=0;b<5;b++){var by=82+b*90;art.ellipse(c,48,by,8,9,'#1b3b51');c.strokeStyle='#a5bbc3';c.lineWidth=5;c.beginPath();c.ellipse(36,by,17,8,0,0,Math.PI*2);c.stroke();c.strokeStyle='#e2eaed';c.lineWidth=2;c.beginPath();c.ellipse(35,by-1,17,7,0,Math.PI,Math.PI*2);c.stroke();}
      rounded(c,555,94,350,76,7,'#e1e7de','#9fb5b7');
      rounded(c,555,190,350,132,7,'#f9f5e4cc','#9fb5b7');
      rounded(c,555,342,350,141,7,'#f9f5e4cc','#9fb5b7');
      c.strokeStyle='#3f738866';c.lineWidth=2;c.beginPath();c.moveTo(94,502);c.lineTo(905,502);c.stroke();
      c.restore();
    }},
    {name:'paperCell',x:640,y:0,w:112,h:112,paint:function(c,w,h){
      c.fillStyle='#fcfbf1';c.fillRect(0,0,w,h);c.strokeStyle='#a8bbc1';c.lineWidth=2;c.strokeRect(1,1,w-2,h-2);
      c.fillStyle='#dee6de55';for(var k=0;k<9;k++)c.fillRect(8+(k*13)%95,9+(k*29)%90,2,1);
    }},
    {name:'inkSquare',x:0,y:800,w:128,h:128,paint:function(c,w,h){
      c.fillStyle='#245c86';c.beginPath();c.moveTo(8,8);c.lineTo(120,6);c.lineTo(122,119);c.lineTo(7,121);c.closePath();c.fill();
      c.strokeStyle='#5484a644';c.lineWidth=2;for(var k=0;k<8;k++){c.beginPath();c.moveTo(15,17+k*12);c.lineTo(115,14+k*12);c.stroke();}
      c.fillStyle='#1b4c7377';c.fillRect(9,111,111,8);
    }}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function right(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size),y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function render(r,s){
    var l=config.layouts[s.level],n=l.size,unit=336/n,ox=176,oy=166,row=Math.floor(s.cursor/n),col=s.cursor%n,matched=s.rowMatched.filter(Boolean).length+s.colMatched.filter(Boolean).length;
    r.sprite('graphbinder',480,270,960,540,0,'#ffffff');text(r,l.name,96,31,31,ink);text(r,'TIME '+s.remaining.toFixed(1),674,33,28,s.remaining<15?'#b75b4f':ink);
    r.rect(97,73,806,6,'#bfcfcd');r.rect(97,73,806*s.remaining/s.timeLimit,6,s.remaining<15?'#bd6d58':'#4b8292');
    text(r,'RUNS',99,137,21,grey);
    for(var c=0;c<n;c++){var clues=l.colClues[c];clues.forEach(function(v,k){center(r,v,ox+c*unit+unit/2,140-(clues.length-1-k)*25,24,s.colMatched[c]?grey:ink);});}
    for(var rr=0;rr<n;rr++)right(r,l.rowClues[rr].join(' '),162,oy+rr*unit+unit/2-12,24,s.rowMatched[rr]?grey:ink);
    for(var i=0;i<s.cells.length;i++){var x=ox+(i%n)*unit,y=oy+Math.floor(i/n)*unit;
      r.sprite('paperCell',x+unit/2,y+unit/2,unit,unit,0,'#ffffff');
      if(s.cells[i]===1)r.sprite('inkSquare',x+unit/2,y+unit/2,unit-5,unit-5,0,'#ffffff');
      else if(s.cells[i]===2){r.line(x+unit*.29,y+unit*.29,x+unit*.71,y+unit*.71,2.5,'#b47869');r.line(x+unit*.71,y+unit*.29,x+unit*.29,y+unit*.71,2.5,'#b47869');}
    }
    frame(r,ox,oy,336,336,'#527f91',2);
    frame(r,ox+col*unit+2,oy+row*unit+2,unit-4,unit-4,'#db9a3b',4);
    frame(r,ox+col*unit+6,oy+row*unit+6,unit-12,unit-12,'#fff0be',1);
    text(r,'MATCHED LINES',574,104,23,grey);text(r,matched+' / '+(2*n),574,135,29,ink);
    text(r,'ROW '+(row+1),574,201,23,grey);text(r,l.rowClues[row].join('  '),731,200,26,s.rowMatched[row]?grey:ink);
    text(r,'COLUMN '+(col+1),574,240,23,grey);text(r,l.colClues[col].join('  '),731,239,26,s.colMatched[col]?grey:ink);
    text(r,'FILLED '+s.filledCount,574,285,22,ink);
    text(r,'A  FILL / ERASE',574,355,24,ink);text(r,'B  CROSS / CLEAR',574,393,24,ink);
    text(r,'CROSSES ARE NOTES',574,437,20,grey);text(r,'ONLY RUNS COUNT',574,463,20,grey);
  }
  root.GameDef={id:'pixel-clues',title:'像素线索',seed:config.defaultSeed,accent:'#e2b46d',background:'#173b56',atlas,holdConfirmAsA:true,
    tagline:'从数字里，读出像素图',levelLabel:'图纸',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['涂格 / 擦除','标叉 / 清空'],
    description:'每个数字是一段连续涂色格的长度，多段之间至少留一格。方向移动光标，A 涂格或擦除，B 标叉或清空。全部行列线索吻合即胜利；叉号只是留白笔记。',
    controls:{move:'四向移动光标',a:'空格、Z、确认 / 手机右上：涂格或擦除',b:'X、B / 手机右下：标叉或清空'},
    tip:'例如 2 1 表示连续两格、至少一格留白、再一格。灰色线索已经匹配。叉号不算涂色；不必标满白格。暂停冻结时间，长按不连续操作。',
    winTitle:'行列吻合，像素成图',loseTitle:'作画时间已结束',
    hud:function(s){return[{label:'剩余时间',value:s.remaining.toFixed(1)+' 秒',tone:s.remaining<15?'warn':''},
      {label:'已匹配线索',value:(s.rowMatched.filter(Boolean).length+s.colMatched.filter(Boolean).length)+' / '+(s.size*2),tone:'good'},
      {label:'当前格',value:(Math.floor(s.cursor/s.size)+1)+' 行 '+(s.cursor%s.size+1)+' 列'},{label:'已涂格',value:s.filledCount}];},
    result:function(s){return(s.phase==='won'?'所有行与列的连续段均与公开线索一致。':'尚有线索未匹配，请重新审视连续段与留白。')+'已涂 '+s.filledCount+' 格，用时 '+s.elapsed.toFixed(1)+' 秒。';},render};
})(window);
