/* Magnetic Warehouse: a complete visible board; all field paths come from model pulses. */
(function(root){
  'use strict';
  const C={navy:'#193847',panel:'#254a58',ink:'#183f51',cream:'#e9e9d0',pos:'#edb273',neg:'#86cfdb',good:'#a9d9ac',warn:'#ed9b7a'};
  function floorArt(c,w,h,a){
    c.fillStyle=a.linear(c,0,0,w,h,[[0,'#d8dfd2'],[.48,'#c4d2c8'],[1,'#a9c0ba']]);c.fillRect(0,0,w,h);
    c.strokeStyle='#8ca6a6';c.lineWidth=2;c.strokeRect(2,2,w-4,h-4);
    c.strokeStyle='#edf0d9';c.lineWidth=1.5;c.beginPath();c.moveTo(7,h-7);c.lineTo(7,7);c.lineTo(w-7,7);c.stroke();
    c.fillStyle='#77939430';c.fillRect(11,h-15,w-22,2);c.fillRect(w-15,12,2,h-25);
    [[12,12],[w-12,12],[12,h-12],[w-12,h-12]].forEach(p=>{a.ellipse(c,p[0],p[1],2.2,2.2,'#718d91');a.ellipse(c,p[0]-.5,p[1]-.5,.9,.9,'#e5e8ce');});
    c.strokeStyle='#a7bcb52b';c.lineWidth=1;for(let y=26;y<109;y+=18){c.beginPath();c.moveTo(23,y);c.lineTo(103,y);c.stroke();}
    c.fillStyle='#eef0d62b';c.fillRect(27,21,23,3);
  }
  function wallArt(c,w,h,a){
    c.fillStyle='#294b58';c.fillRect(0,0,w,h);
    a.path(c,[[5,9],[13,3],[w-13,3],[w-4,12],[w-4,h-12],[w-13,h-4],[13,h-4],[5,h-13]],a.linear(c,0,0,w,h,[[0,'#a2b5a7'],[.15,'#6d9292'],[.52,'#3b6572'],[1,'#244958']]),'#bed0b7',2);
    a.path(c,[[17,18],[w-17,18],[w-17,h-26],[17,h-26]],a.linear(c,0,18,0,h-26,[[0,'#61858b'],[.6,'#416774'],[1,'#335562']]),'#325563',3);
    c.fillStyle='#a6b9a6';c.fillRect(22,22,w-44,3);c.fillStyle='#15394c';c.fillRect(23,h-41,w-46,10);
    c.fillStyle='#76958e';for(let x=29;x<w-25;x+=13)c.fillRect(x,h-39,7,5);
    c.strokeStyle='#8aa49a';c.lineWidth=2;c.beginPath();c.moveTo(30,37);c.lineTo(46,37);c.lineTo(46,66);c.lineTo(96,66);c.stroke();
    [[13,13],[w-13,13],[13,h-13],[w-13,h-13]].forEach(p=>{a.ellipse(c,p[0],p[1],3,3,'#304f5b');a.ellipse(c,p[0]-.5,p[1]-.5,1.4,1.4,'#dce0bf');});
  }
  function crateArt(c,w,h,a){
    a.ellipse(c,97,159,74,17,a.radial(c,97,159,76,[[0,'#0b283b99'],[1,'#0b283b00']]));
    a.path(c,[[27,38],[38,25],[154,25],[166,38],[166,150],[154,165],[38,165],[27,150]],a.linear(c,25,27,165,169,[[0,'#f7efd2'],[.33,'#c8d3c5'],[.65,'#93afa9'],[1,'#617f87']]),'#315566',3);
    a.path(c,[[41,40],[151,40],[151,137],[41,137]],a.linear(c,36,35,145,144,[[0,'#e9ebd3'],[.5,'#c4d2bf'],[1,'#89aaa2']]),'#6c908f',3);
    c.fillStyle='#345967';c.fillRect(45,142,102,13);c.fillStyle='#78958f';c.fillRect(49,145,38,4);c.fillRect(106,145,36,4);
    c.strokeStyle='#eaf0d4';c.lineWidth=3;c.beginPath();c.moveTo(36,135);c.lineTo(36,35);c.lineTo(152,35);c.stroke();
    c.fillStyle='#5d7d81';c.fillRect(48,48,15,77);c.fillRect(130,48,15,77);c.fillStyle='#bed0ba';c.fillRect(52,51,4,70);c.fillRect(133,51,4,70);
    [[37,36],[156,36],[37,151],[156,151]].forEach(p=>{a.ellipse(c,p[0],p[1],4,4,'#476976');a.ellipse(c,p[0]-.7,p[1]-.7,2,2,'#e8e5c7');});
    c.strokeStyle='#edf1d655';c.lineWidth=1.5;c.beginPath();c.moveTo(74,45);c.lineTo(118,45);c.stroke();
  }
  function robotArt(c,w,h,a){
    a.ellipse(c,96,158,66,18,a.radial(c,96,158,69,[[0,'#0a293b9e'],[1,'#0a293b00']]));
    [[32,42],[131,42]].forEach(p=>{
      a.path(c,[[p[0],p[1]],[p[0]+29,p[1]],[p[0]+29,151],[p[0],151]],a.linear(c,p[0],40,p[0]+29,150,[[0,'#52717b'],[.5,'#203f51'],[1,'#112f42']]),'#879e98',3);
      for(let y=48;y<148;y+=13){c.fillStyle='#91a79c';c.fillRect(p[0]+4,y,21,3);}
    });
    a.path(c,[[62,49],[130,49],[141,65],[141,132],[126,148],[67,148],[52,132],[52,65]],a.linear(c,53,48,139,145,[[0,'#fbf0cc'],[.42,'#cbd8c7'],[1,'#6f999a']]),'#476b78',3);
    a.path(c,[[66,40],[66,21],[85,21],[85,51],[107,51],[107,21],[126,21],[126,40],[123,67],[69,67]],a.linear(c,65,20,125,68,[[0,'#bfd0bf'],[.45,'#526f7b'],[1,'#284e63']]),'#cbd8bf',2);
    c.fillStyle='#e6e3c1';c.fillRect(69,23,13,10);c.fillRect(110,23,13,10);
    a.ellipse(c,96,101,30,29,a.linear(c,74,76,118,124,[[0,'#36576b'],[.5,'#183e53'],[1,'#09293e']]));
    c.strokeStyle='#b8d4c3';c.lineWidth=2;c.beginPath();c.arc(96,101,25,Math.PI*.95,Math.PI*1.8);c.stroke();
    c.fillStyle='#355b69';c.fillRect(75,130,42,8);c.fillStyle='#e9daa6';c.fillRect(82,132,28,3);
    [[62,66],[130,66],[62,131],[130,131]].forEach(p=>a.ellipse(c,p[0],p[1],3,3,'#eee6c4'));
  }
  function scrapArt(c,w,h,a){
    c.fillStyle='#51717a';c.fillRect(0,0,w,h);
    a.path(c,[[7,7],[153,7],[153,153],[7,153]],a.linear(c,12,8,149,156,[[0,'#e1c685'],[1,'#b18e55']]),'#2a4d5f',3);
    c.save();c.beginPath();c.rect(9,9,142,142);c.clip();c.strokeStyle='#294b59';c.lineWidth=12;
    for(let x=-150;x<220;x+=28){c.beginPath();c.moveTo(x,0);c.lineTo(x+160,160);c.stroke();}c.restore();
    a.path(c,[[23,25],[137,25],[137,137],[23,137]],'#123347','#647f7d',4);
    a.path(c,[[28,31],[131,31],[131,129],[28,129]],a.linear(c,0,30,0,130,[[0,'#0b2436'],[1,'#345565']]));
    a.path(c,[[38,76],[60,44],[89,70],[80,111],[42,114]],'#607979','#91a59a',2);
    a.path(c,[[81,88],[116,50],[123,88],[107,119],[89,116]],'#8d9a85','#b1b69b',2);
    c.strokeStyle='#1f3e51';c.lineWidth=6;c.beginPath();c.moveTo(36,116);c.lineTo(120,43);c.stroke();
  }
  function gantryArt(c,w,h,a){
    c.fillStyle=a.linear(c,0,12,0,82,[[0,'#d9dfc7'],[.2,'#9fb4aa'],[.3,'#4e727b'],[1,'#294e63']]);c.fillRect(0,12,w,70);
    c.fillStyle='#e4e6c8';c.fillRect(0,12,w,5);c.fillStyle='#153b50';c.fillRect(0,33,w,34);
    c.strokeStyle='#8eaaa5';c.lineWidth=4;c.beginPath();for(let x=-18;x<w;x+=40){c.moveTo(x,64);c.lineTo(x+20,35);c.lineTo(x+40,64);}c.stroke();
    c.fillStyle='#93a99f';c.fillRect(0,70,w,4);
    for(let x=14;x<w;x+=44){a.ellipse(c,x,24,2.6,2.6,'#ece5bc');a.ellipse(c,x,76,2.6,2.6,'#c6d1b8');}
  }
  function dockArt(c,w,h,a){
    c.fillStyle='#3b626126';c.fillRect(9,9,174,174);
    c.strokeStyle='#6b8d8c';c.lineWidth=3;c.strokeRect(11,11,170,170);
    c.strokeStyle='#f3e6b5';c.lineWidth=8;c.beginPath();
    [[19,19,1,1],[173,19,-1,1],[19,173,1,-1],[173,173,-1,-1]].forEach(p=>{c.moveTo(p[0],p[1]+p[3]*35);c.lineTo(p[0],p[1]);c.lineTo(p[0]+p[2]*35,p[1]);});c.stroke();
    c.strokeStyle='#517d7b55';c.lineWidth=3;c.beginPath();c.arc(96,96,51,0,Math.PI*2);c.stroke();
    a.path(c,[[70,120],[96,74],[122,120]],null,'#5c858255',3);
  }
  const atlas={builtins:['glow','shadow','ring'],tiles:[
    {name:'mag_floor',x:0,y:0,w:128,h:128,paint:floorArt},
    {name:'mag_wall',x:128,y:0,w:128,h:128,paint:wallArt},
    {name:'mag_crate',x:256,y:0,w:192,h:192,paint:crateArt},
    {name:'mag_robot',x:448,y:0,w:192,h:192,paint:robotArt},
    {name:'mag_scrap',x:640,y:0,w:160,h:160,paint:scrapArt},
    {name:'mag_gantry',x:800,y:0,w:224,h:96,paint:gantryArt},
    {name:'mag_dock',x:0,y:800,w:192,h:192,paint:dockArt}
  ]};
  const poleColor=p=>p>0?C.pos:C.neg;
  const alpha=(color,a)=>color+Math.round(Math.max(0,Math.min(1,a))*255).toString(16).padStart(2,'0');
  function center(r,text,x,y,size,color){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
  function sign(r,x,y,p,size,color){r.line(x-size/2,y,x+size/2,y,1.8,color);if(p>0)r.line(x,y-size/2,x,y+size/2,1.8,color);}
  function point(s,col,row){return{x:s.grid.x+(col+.5)*s.grid.cellSize,y:s.grid.y+(row+.5)*s.grid.cellSize};}
  function arrow(r,a,b,color){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(!len)return;
    const ux=dx/len,uy=dy/len,x=a.x+dx*.6,y=a.y+dy*.6;
    r.line(a.x,a.y,b.x,b.y,1.4,color);r.line(x,y,x-ux*6-uy*4,y-uy*6+ux*4,1.7,color);r.line(x,y,x-ux*6+uy*4,y-uy*6-ux*4,1.7,color);
  }
  function structure(r,s){
    const g=s.grid,w=g.cols*g.cellSize,h=g.rows*g.cellSize;
    r.sprite('glow',480,230,1000,680,0,'#638f7f35');
    r.text('MAGNETIC WAREHOUSE',28,16,15,'#e7e8ca');r.text('SORTING FLOOR / '+String(s.level).padStart(2,'0'),722,21,10,'#a7bfb2');
    r.rect(g.x-10,g.y-10,w+20,h+20,'#102f42');r.rect(g.x-5,g.y-5,w+10,h+10,'#9aaea3');
    r.sprite('mag_gantry',480,51,w+12,26,0,'#fff');r.sprite('mag_gantry',480,480,w+12,18,0,'#92afa7');
    [g.x-10,g.x+w+10].forEach(x=>{r.rect(x-3,g.y-3,6,h+6,'#4d737d');r.line(x-3,g.y-3,x-3,g.y+h+3,1,'#a0b5a7');});
    s.cells.forEach(cell=>r.sprite(cell.type==='wall'?'mag_wall':cell.type==='scrap'?'mag_scrap':'mag_floor',cell.x,cell.y,g.cellSize,g.cellSize,0,'#fff'));
    s.docks.forEach(d=>{
      r.sprite('mag_dock',d.x,d.y,42,42,0,d.matched?'#b0e0a4':'#fff');
      center(r,String(d.id),d.x,d.y-7,17,'#416c72');
      if(d.matched){r.line(d.x-18,d.y+18,d.x+18,d.y+18,2.5,'#84bc78');}
    });
  }
  function field(r,s){
    const pulse=s.pulse;if(!pulse||s.elapsed>=pulse.expiresAt)return;
    const fade=(pulse.expiresAt-s.elapsed)/(pulse.expiresAt-pulse.createdAt),col=poleColor(pulse.polarity),origin=pulse.origin;
    // This small emission marker is not a range indicator. Targets are exclusively
    // the model's aligned, wall-visible pre-pulse crate positions.
    r.sprite('ring',origin.x,origin.y,35,35,0,alpha(col,fade));
    pulse.targets.forEach(target=>{
      const from=point(s,target.fromCol,target.fromRow),to=point(s,target.toCol,target.toRow);
      r.line(origin.x,origin.y,from.x,from.y,4,alpha(col,fade*.18));r.line(origin.x,origin.y,from.x,from.y,1.2,alpha(col,fade*.8));
      if(target.moved){arrow(r,from,to,alpha(target.mode==='repel'?'#b57535':'#216f87',fade));r.sprite('ring',from.x,from.y,24,24,0,alpha(col,fade*.5));}
    });
  }
  function pieces(r,s){
    s.crates.forEach(crate=>{
      r.sprite('mag_crate',crate.x,crate.y,40,40,0,crate.docked?'#d4ebc4':'#fff');
      const col=poleColor(crate.polarity);
      r.rect(crate.x-10,crate.y-13,20,3,col);r.rect(crate.x-16,crate.y-4,32,21,'#173e50');
      center(r,String(crate.id)+(crate.polarity>0?' +':' -'),crate.x,crate.y-3,18,'#fff1d1');
      const cell=s.cells[crate.row*s.grid.cols+crate.col];
      if(s.phase==='lost'&&s.lostReason==='scrap'&&cell.type==='scrap'){
        r.line(crate.x-12,crate.y-12,crate.x+12,crate.y+12,2.2,'#d75c42');r.line(crate.x+12,crate.y-12,crate.x-12,crate.y+12,2.2,'#d75c42');
      }
    });
    // Dock numbers stay above the crate's corner so a wrong numbered occupant
    // can never hide the target number. This label is UI, not occupied geometry.
    s.docks.forEach(d=>{
      const wrong=d.occupiedBy!==null&&!d.matched;
      r.rect(d.x-21,d.y-21,18,16,d.matched?'#3a735d':wrong?'#965e3e':'#355966');center(r,String(d.id),d.x-12,d.y-20,14,'#fff1cf');
    });
    const p=s.player,angle=Math.atan2(p.facingY,p.facingX)+Math.PI/2;
    r.sprite('ring',p.x,p.y,37,37,0,'#c6ddb9');r.sprite('mag_robot',p.x,p.y,38,38,angle,'#fff');
    r.circle(p.x,p.y,6.3,poleColor(p.polarity));sign(r,p.x,p.y,p.polarity,7,'#193c50');
    const pulse=s.pulse;
    if(pulse&&s.elapsed<pulse.expiresAt)pulse.targets.forEach(target=>{
      if(target.moved)return;const p=point(s,target.fromCol,target.fromRow);
      r.rect(p.x+11,p.y+11,8,8,'#965138');center(r,'X',p.x+15,p.y+11,8,'#ffdfa0');
    });
  }
  function panels(r,s){
    r.rect(27,72,145,395,'#244a58');r.line(27,72,172,72,1,'#779a93');r.text('CARGO MANIFEST',40,86,11,'#d4ddbe');
    s.crates.forEach((crate,i)=>{
      const y=118+i*67;r.rect(37,y,125,54,'#173b4d');r.text('BOX '+String(crate.id).padStart(2,'0'),47,y+9,12,'#e6e6c7');
      r.circle(144,y+15,8,poleColor(crate.polarity));sign(r,144,y+15,crate.polarity,8,'#173b4d');
      r.text('BAY '+String(crate.id).padStart(2,'0'),47,y+32,9,'#a6bfb2');r.text(crate.docked?'OK':'OPEN',123,y+32,9,crate.docked?C.good:'#d5c38b');
    });
    r.text('MATCH THE NUMBERS',39,424,9,'#c8d4b7');r.text('DOCKED IS NOT LOCKED',39,442,8,'#a6beb1');
    r.rect(788,72,145,395,'#244a58');r.line(788,72,933,72,1,'#779a93');center(r,'YOUR POLE',860,87,11,'#d4ddbe');
    r.circle(860,137,28,'#153b4c');r.circle(860,137,23,poleColor(s.player.polarity));sign(r,860,137,s.player.polarity,22,'#214552');
    center(r,s.player.polarity>0?'POSITIVE':'NEGATIVE',860,174,11,poleColor(s.player.polarity));
    r.line(803,201,917,201,1,'#587d7e');r.text('FIELD RULES',803,217,11,'#d4ddbe');
    r.text('+ +  REPEL',803,242,11,C.pos);r.text('+ -  ATTRACT',803,265,11,C.neg);
    r.text('ROW / COLUMN',803,294,10,'#c6d5bd');r.text('WALLS BLOCK',803,314,9,'#9eb9af');r.text('CRATES DO NOT',803,332,9,'#9eb9af');
    r.line(803,354,917,354,1,'#587d7e');
    const pulse=s.pulse,active=pulse&&s.elapsed<pulse.expiresAt;
    r.text(active?'LAST PULSE':'PULSES SENT',803,369,10,'#d5dabe');
    if(active){const moved=pulse.targets.filter(t=>t.moved).length;r.text(moved+' MOVED',803,392,12,moved?C.good:C.warn);r.text(pulse.targets.length?pulse.targets.length-moved+' BLOCKED':'NO ALIGNED CRATE',803,416,9,'#bcd0b8');}
    else{r.text(String(s.pulseCount).padStart(2,'0'),803,391,20,'#e4ddae');r.text(s.phase==='playing'?'A FLIP / B PULSE':'SESSION ENDED',803,425,9,'#bcd0b8');}
  }
  function footer(r,s){
    r.rect(194,495,572,31,'#234957');r.line(194,495,766,495,1,'#8ca699');
    const won=s.phase==='won',lost=s.phase==='lost';
    if(won||lost){
      const status=won?'WAREHOUSE SORTED':s.lostReason==='scrap'?'SCRAP CHUTE / CARGO LOST':s.lostReason==='actions'?'ACTION LIMIT REACHED':'TIME LIMIT REACHED';
      r.text(status,207,506,11,won?C.good:C.warn);r.text('ENTER / RETRY',635,506,10,'#e4dfba');
    }else{r.text('A / FLIP POLE',207,506,11,poleColor(s.player.polarity));r.text('B / FIELD PULSE',395,506,11,'#e7e5c6');r.text('ARROWS / MOVE',623,506,10,'#b9cdb8');}
  }
  root.GameDef={
    id:'magnetic-warehouse',title:'磁极仓库',tagline:'换一个磁极，让每份货物找到自己的位置',seed:137,
    accent:'#e7c18a',background:C.navy,levelLabel:'库区',levelNames:['双箱','三箱','四箱'],atlas,
    description:'方向键逐格移动，A 换磁极，B 发出脉冲。同极箱子远离、异极箱子靠近，每次一格；墙会挡住磁场。把箱子停进同号目标，避开废料槽。成功移动、换极和脉冲都消耗动作，请在 90 秒内完成。',
    controls:{move:'摇杆 / 方向键：逐格移动',a:'切换磁极 · 空格 / 右上半屏',b:'发出脉冲 · B / 右下半屏'},actionLabels:['切换磁极','发出脉冲'],
    tip:'同极斥，异极吸。箱子不挡磁场，墙会挡。按编号归位；已归位箱仍可被移动。',
    winTitle:'每一份货物都各归其位',loseTitle:'这批货物需要重新安排',
    result(s){
      if(s.phase==='won')return '已将 '+s.matched+' 个箱子送到同号目标，使用 '+s.actionsUsed+' / '+s.actionBudget+' 次动作。';
      if(s.lostReason==='scrap')return '箱子进入废料槽，货物已损坏。发出脉冲前，检查所有同行同列箱子的去向。';
      if(s.lostReason==='actions')return '动作额度已用尽。成功移动、换极和空脉冲都耗费动作；先对齐，再选极性。';
      return '90 秒已到，尚有箱子未归位。记住箱子编号与磁极，重新规划路线再试一次。';
    },
    hud(s){return[
      {label:'编号归位',value:s.matched+' / '+s.target,tone:'good'},
      {label:'当前磁极',value:s.player.polarity>0?'正极 +':'负极 −'},
      {label:'剩余动作',value:s.actionsRemaining+' / '+s.actionBudget,tone:s.actionsRemaining<15?'warn':''},
      {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
    ];},
    render(r,s){structure(r,s);field(r,s);pieces(r,s);panels(r,s);footer(r,s);}
  };
})(window);
