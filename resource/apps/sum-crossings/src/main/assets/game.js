(function(root){
  'use strict';
  var config=root.PureModel.config,gold='#e4c08a',ink='#ece6cf';
  function poly(c,p,fill,stroke){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'crossledger',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#334f49'],[1,'#23393d']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#c4a87522';c.lineWidth=1;for(var x=0;x<960;x+=23){c.beginPath();c.moveTo(x,0);c.lineTo(x+22,540);c.stroke();}
      poly(c,[[23,21],[937,21],[937,74],[23,74]],'#203b3c','#a99d7d');poly(c,[[44,95],[456,95],[471,113],[471,493],[44,493]],'#bba47b','#e7cf9f');
      poly(c,[[456,95],[456,113],[471,113]],'#6a7466');c.strokeStyle='#7f8262';c.strokeRect(56,107,389,382);
      poly(c,[[501,96],[931,96],[931,198],[501,198]],'#e6dbc1','#bbaf91');poly(c,[[501,215],[931,215],[931,492],[501,492]],'#203e3e','#8da38a');
      c.fillStyle='#d5bd8b';[59,450].forEach(function(x){[106,482].forEach(function(y){c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fill();});});c.restore();
    }},
    {name:'crosswhite',x:640,y:0,w:96,h:96,paint:function(c,w,h,art){c.fillStyle=art.linear(c,0,0,96,96,[[0,'#fffbee'],[1,'#e2dfcd']]);c.fillRect(0,0,96,96);c.strokeStyle='#b1b7a1';c.lineWidth=2;c.strokeRect(1,1,94,94);c.strokeStyle='#c6c4ab33';c.lineWidth=1;for(var y=16;y<96;y+=17){c.beginPath();c.moveTo(7,y);c.lineTo(89,y+1);c.stroke();}}},
    {name:'crossblack',x:736,y:0,w:96,h:96,paint:function(c,w,h,art){c.fillStyle=art.linear(c,0,0,96,96,[[0,'#365958'],[1,'#203d42']]);c.fillRect(0,0,96,96);c.strokeStyle='#91a68c';c.lineWidth=2;c.strokeRect(1,1,94,94);c.fillStyle='#c7c8a511';for(var k=0;k<24;k++)c.fillRect((k*19+7)%91,(k*31+9)%91,2,2);}}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function arrow(r,x,y,size,down,color){if(down){r.line(x,y-size*.45,x,y+size*.45,1.6,color);r.line(x-size*.3,y+size*.12,x,y+size*.45,1.6,color);r.line(x,y+size*.45,x+size*.3,y+size*.12,1.6,color);}else{r.line(x-size*.45,y,x+size*.45,y,1.6,color);r.line(x+size*.12,y-size*.3,x+size*.45,y,1.6,color);r.line(x+size*.45,y,x+size*.12,y+size*.3,1.6,color);}}
  function clue(r,x,y,u,across,down,ac,dc){r.sprite('crossblack',x+u/2,y+u/2,u,u,0,'#ffffff');if(across!==null||down!==null)r.line(x+3,y+3,x+u-3,y+u-3,1.7,'#b0bf9c');var font=Math.max(19,u*.27);
    if(across!==null){center(r,across,x+u*.70,y+u*.08,font,ac);arrow(r,x+u*.85,y+u*.43,u*.17,false,ac);}
    if(down!==null){center(r,down,x+u*.24,y+u*.53,font,dc);arrow(r,x+u*.22,y+u*.89,u*.17,true,dc);}}
  function render(r,s){
    var l=config.layouts[s.level],u=372/s.width,ox=62,oy=113;r.sprite('crossledger',480,270,960,540,0,'#ffffff');text(r,l.name,44,37,28,gold);text(r,'SUM CROSSINGS',695,40,24,'#c2d3b9');
    var current=s.runs.filter(run=>run.cells.includes(s.cursor)),active=new Set(current.flatMap(run=>run.cells)),errors=new Set(s.lastCheck?s.lastCheck.errors.map(e=>e.run):[]);
    for(var p=0;p<s.cells.length;p++){var x=ox+p%s.width*u,y=oy+Math.floor(p/s.width)*u;if(s.cells[p]<0){var a=s.runs.find(run=>run.clueCell===p&&run.direction==='across'),d=s.runs.find(run=>run.clueCell===p&&run.direction==='down');
        var color=function(run){return run&&errors.has(run.id)?'#f4b194':run&&s.runStatus[run.id].matched?'#b5d3a4':'#f0dfb6';};clue(r,x,y,u,a?a.sum:null,d?d.sum:null,color(a),color(d));
      }else{var fixed=Object.prototype.hasOwnProperty.call(s.givens,p);r.sprite('crosswhite',x+u/2,y+u/2,u,u,0,active.has(p)?'#e5f1de':'#ffffff');
        if(s.cells[p])center(r,s.cells[p],x+u/2,y+u*.27,u*.54,fixed?'#95673c':'#31544d');else r.circle(x+u/2,y+u*.53,1.5,'#a6b19a');
        if(fixed){r.rect(x+7,y+7,7,7,'#ae8753');r.rect(x+9,y+9,3,3,'#eee0b7');}
        if(s.cursor===p)frame(r,x+2,y+2,u-4,u-4,'#c39646',3);
      }}
    text(r,'FILLED',525,110,22,'#7f796c');text(r,s.filledCount+' / '+s.whiteCells.length,525,147,32,'#3d5b51');text(r,'ERRORS',754,110,22,'#7f796c');text(r,s.mistakes+' / 3',754,147,32,s.mistakes>=2?'#a45e43':'#3d5b51');
    text(r,'READ THE CLUE',524,232,24,gold);clue(r,528,272,83,12,8,'#f0dfb6','#f0dfb6');
    text(r,'12 > ROW SUM',638,281,25,ink);text(r,'8 v COLUMN SUM',638,322,24,ink);
    text(r,'1..9 / NO RUN REPEATS',524,380,23,'#c3d5b7');text(r,'A: 1..9 > CLEAR',524,421,23,gold);text(r,'B: CHECK FULL GRID',524,459,23,gold);
    text(r,'PIN = FIXED DIGIT',62,513,21,'#c5d4b9');text(r,'EDITING IS FREE / 3 WRONG CHECKS END',503,513,19,'#c5d4b9');
  }
  root.GameDef={id:'sum-crossings',title:'交叉数和',seed:config.defaultSeed,accent:gold,background:'#2a4c46',atlas,holdConfirmAsA:true,
    tagline:'同段不重，横纵同和',levelLabel:'数和棋盘',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['循环数字 / 清空','检查全盘'],
    description:'黑格右上数字与右箭头表示右方连续白格之和；左下数字与下箭头表示下方之和。每段填1至9且不重复。四向选白格，A 循环填数，全部填满后 B 检查。',
    controls:{move:'沿同一行/列选择下一白格，跳过黑格，不绕边',a:'空格、Z、确认 / 手机右上：空白→1至9→空白',b:'X、B / 手机右下：检查完整棋盘'},
    tip:'固定数字有小方钉，不能改。编辑不扣错误，未填满的检查也不扣；完整但错误的提交记一次，三次结束。不同数段可以出现相同数字，绿色线索只表示该段已满足公开规则。',
    winTitle:'横纵数和全部吻合',loseTitle:'完整检查错误已达三次',
    hud:function(s){return[{label:'已填白格',value:s.filledCount+' / '+s.whiteCells.length},{label:'错误检查',value:s.mistakes+' / 3',tone:s.mistakes>=2?'warn':''},
      {label:'当前位置',value:(Math.floor(s.cursor/s.width)+1)+'行 '+(s.cursor%s.width+1)+'列'},{label:'固定 / 可填',value:s.givensCount+' / '+s.editableCount}];},
    result:function(s){return(s.phase==='won'?'每个横纵数段均无重复且数和符合线索。':'三次完整提交仍有重复或错误数和。')+'完成检查 '+s.checks+' 次，错误 '+s.mistakes+' 次，修改 '+s.edits+' 次。';},render};
})(window);
