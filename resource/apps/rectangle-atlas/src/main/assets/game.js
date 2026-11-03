(function(root){
  'use strict';
  var config=root.PureModel.config,ink='#233d52',paper='#f5eddb',gold='#c48b36';
  var fills=['#d7e4e1','#e5d8c6','#d7deeb','#eee1b9','#ddd9e5','#d8e5c8'];
  function poly(c,p,fill,stroke){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'atlasdesk',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#23445c'],[1,'#102e42']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#87a7b524';c.lineWidth=1;for(var x=0;x<960;x+=24){c.beginPath();c.moveTo(x,0);c.lineTo(x,540);c.stroke();}for(var y=0;y<540;y+=24){c.beginPath();c.moveTo(0,y);c.lineTo(960,y);c.stroke();}
      poly(c,[[24,18],[934,18],[934,78],[24,78]],'#e8dfc9','#bdab88');c.fillStyle='#c38b3a';c.fillRect(24,18,8,60);
      poly(c,[[27,94],[449,94],[449,498],[27,498]],'#142b3a');poly(c,[[34,91],[458,91],[458,495],[34,495]],'#eee5ce','#b8a27b');
      c.fillStyle='#bd9b62';c.fillRect(34,91,11,404);c.strokeStyle='#a1977d';c.lineWidth=1;
      for(var x=55;x<428;x+=12){c.beginPath();c.moveTo(x,99);c.lineTo(x,105+(x%24===7?0:3));c.stroke();}
      for(var y=114;y<487;y+=12){c.beginPath();c.moveTo(438,y);c.lineTo(445,y);c.stroke();}
      poly(c,[[484,94],[932,94],[932,275],[484,275]],'#f0e8d5','#c6b792');poly(c,[[484,291],[932,291],[932,495],[484,495]],'#e8e1cb','#c6b792');
      c.strokeStyle='#ad9d7e55';c.lineWidth=1;for(var y=335;y<488;y+=33){c.beginPath();c.moveTo(501,y);c.lineTo(917,y);c.stroke();}
      c.fillStyle='#bc9560';for(var y=112;y<488;y+=62){c.fillRect(38,y,3,14);}c.restore();
    }},
    {name:'atlasblank',x:640,y:0,w:96,h:96,paint:function(c,w,h,art){c.fillStyle=art.linear(c,0,0,96,96,[[0,'#f8f0df'],[1,'#e7ddc6']]);c.fillRect(0,0,96,96);c.strokeStyle='#a6afa6';c.lineWidth=1;c.strokeRect(.5,.5,95,95);c.fillStyle='#c4b99e';for(var y=16;y<96;y+=24)for(var x=16;x<96;x+=24)c.fillRect(x,y,1,1);}},
    {name:'atlasnumber',x:736,y:0,w:96,h:96,paint:function(c,w,h,art){art.ellipse(c,48,49,42,41,'#35556822');art.ellipse(c,48,46,39,38,'#fff8e9');c.strokeStyle='#77877c';c.lineWidth=2;c.beginPath();c.ellipse(48,46,35,34,0,0,Math.PI*2);c.stroke();}},
    {name:'atlascorner',x:832,y:0,w:96,h:96,paint:function(c){c.strokeStyle='#fff';c.lineWidth=10;c.beginPath();c.moveTo(12,36);c.lineTo(12,12);c.lineTo(36,12);c.moveTo(60,12);c.lineTo(84,12);c.lineTo(84,36);c.moveTo(84,60);c.lineTo(84,84);c.lineTo(60,84);c.moveTo(36,84);c.lineTo(12,84);c.lineTo(12,60);c.stroke();}},
    {name:'atlascompass',x:0,y:800,w:96,h:96,paint:function(c,w,h,art){c.strokeStyle='#d9c49b';c.lineWidth=3;c.beginPath();c.arc(48,48,35,0,Math.PI*2);c.stroke();poly(c,[[48,7],[58,38],[89,48],[58,58],[48,89],[38,58],[7,48],[38,38]],'#d9c49b');poly(c,[[48,18],[48,48],[78,48],[54,54]],'#355369');}}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function render(r,s){
    var l=config.layouts[s.level],u=372/s.width,ox=55,oy=113;r.sprite('atlasdesk',480,270,960,540,0,'#ffffff');text(r,l.name,47,38,28,ink);text(r,'RECTANGLE ATLAS',674,42,23,'#566f78');
    for(var p=0;p<s.owners.length;p++){var x=ox+p%s.width*u,y=oy+Math.floor(p/s.width)*u;r.sprite('atlasblank',x+u/2,y+u/2,u,u,0,'#ffffff');}
    for(var rect of s.rectangles){var x=ox+rect.left*u,y=oy+rect.top*u,w=(rect.right-rect.left+1)*u,h=(rect.bottom-rect.top+1)*u;r.rect(x+1,y+1,w-2,h-2,fills[(rect.id-1)%fills.length]);}
    for(var row=1;row<s.height;row++)r.line(ox,oy+row*u,ox+372,oy+row*u,1,'#81968b55');for(var col=1;col<s.width;col++)r.line(ox+col*u,oy,ox+col*u,oy+372,1,'#81968b55');
    if(s.candidate){var c=s.candidate;r.rect(ox+c.left*u+2,oy+c.top*u+2,(c.right-c.left+1)*u-4,(c.bottom-c.top+1)*u-4,c.overlap?'#ba6a4944':'#d2a24b44');}
    var bad=new Set(s.lastCheck?s.lastCheck.errors.filter(e=>e.rect!==undefined).map(e=>e.rect):[]);
    for(var rect of s.rectangles){var x=ox+rect.left*u,y=oy+rect.top*u,w=(rect.right-rect.left+1)*u,h=(rect.bottom-rect.top+1)*u;frame(r,x+1,y+1,w-2,h-2,bad.has(rect.id)?'#b65f40':'#365265',3);r.rect(x+5,y+5,31,17,bad.has(rect.id)?'#a95c40':'#365265');text(r,'R'+rect.id,x+8,y+5,12,'#fff6e3');}
    for(var seed of s.seeds){var x=ox+seed.cell%s.width*u,y=oy+Math.floor(seed.cell/s.width)*u;r.sprite('atlasnumber',x+u/2,y+u*.64,u*.56,u*.56,0,'#ffffff');center(r,seed.area,x+u/2,y+u*.445,u*.39,ink);}
    frame(r,ox-1,oy-1,374,374,'#233d52',2);
    if(s.candidate){var c=s.candidate;frame(r,ox+c.left*u+3,oy+c.top*u+3,(c.right-c.left+1)*u-6,(c.bottom-c.top+1)*u-6,c.overlap?'#b45131':'#a87520',3);}
    if(s.anchor!==null){var x=ox+s.anchor%s.width*u,y=oy+Math.floor(s.anchor/s.width)*u;r.rect(x+u-17,y+6,11,13,'#a87520');text(r,'1',x+u-14,y+6,10,'#fff6e3');}
    var cx=ox+s.cursor%s.width*u,cy=oy+Math.floor(s.cursor/s.width)*u;r.sprite('atlascorner',cx+u/2,cy+u/2,u-3,u-3,0,'#ce9235');
    text(r,s.anchor===null?'A: FIRST CORNER':'A: SECOND CORNER',505,111,25,ink);text(r,s.anchor===null?'OR REMOVE A DRAWN REGION':'B CANCELS THIS CORNER',505,147,18,'#58717a');
    var c=s.candidate,at=s.owners[s.cursor],active=at?s.rectangles.find(q=>q.id===at):null;
    text(r,'AREA',510,192,17,'#64756e');text(r,'NUMBERS',663,192,17,'#64756e');text(r,'CURSOR',813,192,17,'#64756e');
    center(r,c?c.area:active?active.area:'-',544,220,31,ink);center(r,c?c.seedCount:active?s.seeds.filter(q=>active.cells.includes(q.cell)).length:'-',710,220,31,ink);center(r,(Math.floor(s.cursor/s.width)+1)+':'+(s.cursor%s.width+1),853,223,26,ink);
    text(r,'ONE NUMBER PER RECTANGLE',505,305,23,ink);text(r,'AREA = PRINTED NUMBER',505,343,24,ink);
    text(r,'FILL EVERY SQUARE',505,382,24,ink);text(r,'THEN B TO CHECK',505,418,24,'#91651f');
    var errors=s.lastCheck?s.lastCheck.errors:[],labels={'missing-number':'NO NUMBER','multiple-numbers':'MULTIPLE NUMBERS','wrong-area':'AREA MISMATCH',overlap:'OVERLAP'};
    if(errors.length){var e=errors[0];text(r,'CHECK: '+errors.length+' REGION ERROR'+(errors.length===1?'':'S'),505,458,18,'#a95435');text(r,(e.rect?'R'+e.rect+' / ':'')+labels[e.type],505,480,14,'#a95435');}
    else text(r,c&&c.overlap?'OVERLAP: ADJUST OR CANCEL':'EDITS FREE / 3 WRONG CHECKS END',505,460,18,c&&c.overlap?'#a95435':'#5f7778');
    text(r,'R# = REGION ID   CIRCLED # = AREA',51,515,17,'#d1dace');text(r,'A DRAW / REMOVE     B CANCEL / CHECK',503,515,18,'#d1dace');
  }
  root.GameDef={id:'rectangle-atlas',title:'矩形图册',seed:config.defaultSeed,accent:'#d7ae64',background:'#244457',atlas,holdConfirmAsA:true,
    tagline:'两角成矩，一数一区',levelLabel:'图册',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['选两角 / 移除','取消 / 检查'],
    description:'用互不重叠的矩形铺满所有格子。每块矩形恰含一个圆圈数字，面积必须等于该数字。方向移动光标，A 选第一角，再移动并按 A 选第二角；完整铺满后 B 检查。',
    controls:{move:'四向逐格移动，不跨边绕回；光标显示行:列',a:'空格、Z、确认 / 手机右上：选两角绘制；无选角时点已画区移除',b:'X、B / 手机右下：先取消未完成选角；无选角时检查'},
    tip:'R编号只是你画的区域标签，圆圈数字才是面积线索。数字不变。重叠会免费拒绝；无数字、多数字、面积错误可先画入，满铺检查时反馈。可随时整区移除重画；未铺满检查免费，三次完整错误结束。',
    winTitle:'矩形铺满，数字全合',loseTitle:'完整检查错误已达三次',
    hud:function(s){return[{label:'覆盖格',value:s.coveredCount+' / '+s.owners.length},{label:'已画区域',value:s.rectangleCount},{label:'错误检查',value:s.mistakes+' / 3',tone:s.mistakes>=2?'warn':''},{label:'选角',value:s.anchor===null?'未开始':'待第二角'}];},
    result:function(s){return(s.phase==='won'?'所有矩形互不重叠，每区恰有一个数字且面积正确。':'三次完整提交仍存在数字或面积错误。')+'完整检查 '+s.checks+' 次，错误 '+s.mistakes+' 次，绘制 '+s.placements+' 次，移除 '+s.removals+' 次。';},render};
})(window);
