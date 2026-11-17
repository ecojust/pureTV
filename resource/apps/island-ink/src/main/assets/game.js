(function(root){
  'use strict';
  var config=root.PureModel.config,gold='#e9c68b',ink='#e7eee1';
  function poly(c,p,fill,stroke){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'inkchart',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#354d5b'],[1,'#163b4e']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#91b5b926';c.lineWidth=1;for(var y=12;y<540;y+=30){c.beginPath();c.moveTo(0,y);c.bezierCurveTo(260,y-16,610,y+18,960,y);c.stroke();}
      poly(c,[[23,20],[936,20],[936,74],[23,74]],'#1b3847','#91aba3');poly(c,[[37,97],[458,97],[458,494],[37,494]],'#d8c699','#f0ddb1');
      c.strokeStyle='#a59572';c.lineWidth=2;c.strokeRect(49,107,390,382);c.strokeStyle='#7b917f';c.lineWidth=1;
      for(var x=61;x<440;x+=31){c.beginPath();c.moveTo(x,98);c.lineTo(x,104);c.moveTo(x,488);c.lineTo(x,494);c.stroke();}
      poly(c,[[495,96],[931,96],[931,213],[495,213]],'#dfe2c8','#b2c0a4');poly(c,[[495,229],[931,229],[931,494],[495,494]],'#1d3d48','#8ea99d');c.restore();
    }},
    {name:'unknownink',x:640,y:0,w:96,h:96,paint:function(c,w,h,art){c.fillStyle=art.linear(c,0,0,96,96,[[0,'#e9e2cb'],[1,'#cbcbb6']]);c.fillRect(0,0,96,96);c.strokeStyle='#a6b0a0';c.lineWidth=2;c.strokeRect(1,1,94,94);c.fillStyle='#899b8a22';for(var y=14;y<96;y+=19)for(var x=14;x<96;x+=19)c.fillRect(x,y,2,2);}},
    {name:'seaink',x:736,y:0,w:96,h:96,paint:function(c,w,h,art){c.fillStyle=art.linear(c,0,0,96,96,[[0,'#386d88'],[1,'#244e69']]);c.fillRect(0,0,96,96);c.strokeStyle='#6896a2';c.lineWidth=1;c.strokeRect(.5,.5,95,95);c.strokeStyle='#a6d4d2aa';c.lineWidth=3;for(var y=27;y<90;y+=25){c.beginPath();c.moveTo(16,y);c.bezierCurveTo(28,y-10,36,y+10,48,y);c.bezierCurveTo(60,y-10,68,y+10,80,y);c.stroke();}}},
    {name:'landink',x:832,y:0,w:96,h:96,paint:function(c,w,h,art){c.fillStyle=art.linear(c,0,0,96,96,[[0,'#e5e8c6'],[1,'#c2ce9e']]);c.fillRect(0,0,96,96);c.strokeStyle='#90a783';c.lineWidth=2;c.strokeRect(1,1,94,94);c.strokeStyle='#7f9a6a22';c.lineWidth=1;for(var k=0;k<5;k++){c.beginPath();c.moveTo(11,16+k*17);c.quadraticCurveTo(48,22+k*17,85,13+k*17);c.stroke();}}},
    {name:'islandseed',x:0,y:800,w:80,h:80,paint:function(c,w,h,art){art.ellipse(c,40,42,36,35,'#788f7255');art.ellipse(c,40,38,34,33,'#fff2cf');c.strokeStyle='#647e66';c.lineWidth=3;c.beginPath();c.ellipse(40,38,30,29,0,0,Math.PI*2);c.stroke();}},
    {name:'islandleaf',x:80,y:800,w:64,h:64,paint:function(c){c.fillStyle='#fff';c.beginPath();c.moveTo(12,54);c.bezierCurveTo(9,20,28,8,53,10);c.bezierCurveTo(59,37,40,58,12,54);c.fill();c.save();c.globalCompositeOperation='destination-out';c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.moveTo(18,49);c.lineTo(46,18);c.stroke();c.restore();}}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function cell(r,value,x,y,u,clue){r.sprite(value===0?'unknownink':value===1?'seaink':'landink',x+u/2,y+u/2,u,u,0,'#ffffff');if(clue){r.sprite('islandseed',x+u/2,y+u/2,u*.70,u*.70,0,'#ffffff');center(r,clue,x+u/2,y+u*.284,u*.48,'#344e42');}else if(value===0)center(r,'?',x+u/2,y+u*.293,u*.46,'#7c8a76');else if(value===2)r.sprite('islandleaf',x+u/2,y+u/2,u*.38,u*.38,0,'#82996b');}
  function render(r,s){
    var l=config.layouts[s.level],u=372/s.width,ox=55,oy=113;r.sprite('inkchart',480,270,960,540,0,'#ffffff');text(r,l.name,44,37,28,gold);text(r,'ISLAND INK',772,40,24,'#bdd4cc');
    var errors=new Set(s.lastCheck?s.lastCheck.errors.flatMap(e=>e.cells):[]);
    for(var p=0;p<s.cells.length;p++){var x=ox+p%s.width*u,y=oy+Math.floor(p/s.width)*u,seed=s.seeds.find(q=>q.cell===p);cell(r,s.cells[p],x,y,u,seed?seed.size:null);
      if(errors.has(p))frame(r,x+2,y+2,u-4,u-4,'#d89273',2);if(s.cursor===p)frame(r,x+3,y+3,u-6,u-6,'#e8b45b',3);
    }
    text(r,'A INK CYCLE',516,108,23,'#546e66');var labels=['UNSET','SEA','ISLAND'];for(var k=0;k<3;k++){var cx=558+k*145;cell(r,k,cx-24,141,48,null);center(r,labels[k],cx,189,18,'#547367');}
    text(r,'CHECK WITH B',516,244,24,gold);text(r,'ONE NUMBER PER ISLAND',516,281,23,ink);text(r,'AREA = THAT NUMBER',516,315,23,ink);text(r,'SEA LINKS BY EDGES',516,350,23,ink);
    for(var y=0;y<2;y++)for(var x=0;x<2;x++)cell(r,1,522+x*35,397+y*35,35,null);r.line(518,471,596,393,4,'#dfa07d');text(r,'NO 2x2 SEA',622,416,27,gold);text(r,'DIAGONALS DO NOT LINK',622,453,18,'#b9cfc4');
    text(r,'A: UNSET > SEA > ISLAND',55,514,21,'#c3d3c4');text(r,'EDIT FREE / 3 WRONG CHECKS END',504,514,19,'#c3d3c4');
  }
  root.GameDef={id:'island-ink',title:'岛海墨图',seed:config.defaultSeed,accent:gold,background:'#2b5360',atlas,holdConfirmAsA:true,
    tagline:'一岛一数，一海相通',levelLabel:'墨图',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['未定 / 海 / 岛','检查全图'],
    description:'每块正交连通的岛必须恰含一个数字，面积等于该数字；不同数字岛不可正交相连。海水必须正交连成一片，且不能出现2×2全海。方向选格，A 循环标记，填满后 B 检查。',
    controls:{move:'四向逐格移动，不跨边绕回',a:'空格、Z、确认 / 手机右上：未定→海→岛→未定',b:'X、B / 手机右下：检查完整墨图'},
    tip:'问号是未定，波纹是海，叶纹是岛，数字格固定为岛且计入面积。斜角不算连通。编辑与未填满检查不扣次数；完整但错误的检查记一次，三次结束。',
    winTitle:'岛屿成形，海路相通',loseTitle:'完整检查错误已达三次',
    hud:function(s){return[{label:'已定格',value:s.filledCount+' / '+s.cells.length},{label:'岛格 / 目标',value:s.islandCellCount+' / '+s.targetIslandCells},
      {label:'错误检查',value:s.mistakes+' / 3',tone:s.mistakes>=2?'warn':''},{label:'数字岛',value:s.seeds.length}];},
    result:function(s){return(s.phase==='won'?'每岛数字与面积相符，海水连通且没有2×2全海。':'三次完整提交仍有岛屿或海水规则错误。')+'完整检查 '+s.checks+' 次，错误 '+s.mistakes+' 次，修改 '+s.edits+' 次。';},render};
})(window);
