/* Echo Cartographer: only model-authorized cells and entities enter the scene. */
(function(root){
  'use strict';
  const C={ink:'#081820',sea:'#102731',memory:'#173039',line:'#31535b',mint:'#86e0ca',amber:'#ecca89',coral:'#ed9685'};
  function floorArt(c,w,h,a){
    c.fillStyle=a.linear(c,0,0,w,h,[[0,'#314f56'],[.48,'#243f48'],[1,'#19313b']]);c.fillRect(0,0,w,h);
    c.strokeStyle='#47636a';c.lineWidth=1.3;c.strokeRect(4,4,w-8,h-8);
    c.fillStyle='#172f39';c.fillRect(8,8,4,h-16);c.fillRect(8,h-12,w-16,4);
    c.strokeStyle='#78928c30';c.lineWidth=1;
    for(let y=20;y<h-12;y+=15){c.beginPath();c.moveTo(18,y);c.lineTo(w-16,y);c.stroke();}
    for(let x=24;x<w-12;x+=23){c.beginPath();c.moveTo(x,17);c.lineTo(x,h-17);c.stroke();}
    [[15,15],[w-15,15],[15,h-15],[w-15,h-15]].forEach(p=>{a.ellipse(c,p[0],p[1],2.1,2.1,'#82958a');a.ellipse(c,p[0]+.5,p[1]+.5,.8,.8,'#172e38');});
    c.fillStyle='#94b6a12b';c.fillRect(35,12,31,2);c.fillRect(w-14,37,2,22);
  }
  function wallArt(c,w,h,a){
    c.fillStyle='#081820';c.fillRect(0,0,w,h);
    a.path(c,[[6,12],[15,5],[w-13,5],[w-5,13],[w-5,h-13],[w-13,h-5],[15,h-5],[6,h-13]],a.linear(c,0,0,w,h,[[0,'#78958e'],[.4,'#496a6d'],[1,'#233d49']]),'#8da99b',1.5);
    a.path(c,[[17,19],[w-17,19],[w-17,h-22],[17,h-22]],a.linear(c,0,15,0,h-15,[[0,'#526f73'],[.5,'#3b5b64'],[1,'#28454f']]),'#203e48',3);
    c.fillStyle='#1e3a44';c.fillRect(23,h-35,w-46,9);c.fillStyle='#76918b';c.fillRect(24,24,w-48,3);
    c.fillStyle='#a8b9a14d';c.fillRect(21,31,2,h-70);
    for(let x=30;x<w-25;x+=13){c.fillStyle='#101f2a';c.fillRect(x,h-33,6,5);}
    c.strokeStyle='#6f8782';c.lineWidth=2;c.beginPath();c.moveTo(36,37);c.lineTo(36,62);c.lineTo(62,62);c.stroke();
    c.fillStyle='#b5b99a';c.fillRect(77,38,20,6);c.fillStyle='#2b4a54';c.fillRect(78,40,11,2);
    [[13,13],[w-13,13],[13,h-13],[w-13,h-13]].forEach(p=>{a.ellipse(c,p[0],p[1],3,3,'#253e48');a.ellipse(c,p[0]-.4,p[1]-.7,1.5,1.5,'#b2beaa');});
  }
  function droneArt(c,w,h,a){
    // Actual body is inscribed in radius 68 around (96,96); nose faces right.
    a.ellipse(c,96,96,68,54,a.linear(c,45,38,136,158,[[0,'#edf0d8'],[.38,'#ccd9c8'],[.72,'#8bacaa'],[1,'#365a6b']]));
    a.path(c,[[46,60],[63,44],[107,44],[118,55],[59,70]],'#d4dfc9','#809f9a',2);
    a.path(c,[[47,132],[63,147],[108,147],[119,135],[59,121]],'#5d838b','#9db5a9',2);
    a.ellipse(c,111,96,39,34,a.linear(c,87,66,135,125,[[0,'#416b76'],[.4,'#153b4c'],[1,'#072334']]));
    a.ellipse(c,121,90,18,22,a.radial(c,121,90,23,[[0,'#d4f6d9'],[.28,'#92dec7'],[.68,'#3d9da2'],[1,'#225672']],116,81));
    c.strokeStyle='#f6f4d5';c.lineWidth=2;c.beginPath();c.ellipse(94,94,61,47,0,Math.PI*1.02,Math.PI*1.83);c.stroke();
    c.fillStyle='#31535f';c.fillRect(36,79,21,34);c.fillStyle='#7e9c9b';c.fillRect(39,82,5,28);
    for(let y=83;y<112;y+=8){c.fillStyle='#153440';c.fillRect(47,y,9,3);}
    a.path(c,[[75,72],[85,68],[85,124],[75,120]],'#a49061');
    [[65,61],[64,130],[100,53],[101,139]].forEach(p=>a.ellipse(c,p[0],p[1],2.6,2.6,'#edf0d1'));
    a.ellipse(c,57,96,4.5,7,'#dcbd73');
  }
  function beaconArt(c,w,h,a){
    a.ellipse(c,64,68,40,39,a.linear(c,30,23,93,106,[[0,'#70887e'],[.4,'#294c58'],[1,'#102f40']]));
    a.ellipse(c,64,65,30,30,'#193b49');
    c.strokeStyle='#c7b884';c.lineWidth=3;c.beginPath();c.arc(64,65,35,-.8,4.6);c.stroke();
    a.path(c,[[64,17],[85,43],[77,87],[64,105],[51,87],[43,43]],a.linear(c,42,29,85,91,[[0,'#fff1b0'],[.35,'#dfbe77'],[.7,'#a88243'],[1,'#725a3b']]),'#e3d397',2);
    a.path(c,[[64,25],[77,44],[64,77],[51,44]],a.linear(c,51,27,74,78,[[0,'#fff6c1'],[.4,'#b7e8c8'],[1,'#4d998f']]),'#fff2b2',1.5);
    c.fillStyle='#315c62';c.fillRect(59,80,10,10);c.fillStyle='#eae1a3';c.fillRect(61,81,6,2);
    [[33,47],[92,46],[35,87],[94,86]].forEach(p=>a.ellipse(c,p[0],p[1],3,3,'#c8cb9c'));
  }
  function hazardArt(c,w,h,a){
    a.ellipse(c,80,80,58,58,a.linear(c,33,25,125,134,[[0,'#bcc1a6'],[.24,'#83918b'],[.56,'#4e6e78'],[1,'#1e4050']]));
    a.ellipse(c,80,80,45,45,'#173b4a');
    for(let i=0;i<5;i++){c.save();c.translate(80,80);c.rotate(i*Math.PI*2/5);a.path(c,[[9,-8],[40,-23],[47,-6],[25,8],[12,11]],a.linear(c,13,-25,39,11,[[0,'#e4ba8e'],[1,'#7d7766']]),'#b9bd9e',1);c.restore();}
    a.ellipse(c,80,80,20,20,a.radial(c,80,80,21,[[0,'#fee6bb'],[.4,'#f29c7e'],[1,'#943e39']],75,73));
    a.ellipse(c,80,80,8,8,'#552f35');a.ellipse(c,77,77,3,3,'#f8bfa0');
    c.strokeStyle='#dd987a';c.lineWidth=3;c.beginPath();c.arc(80,80,57,.3,1.1);c.stroke();c.beginPath();c.arc(80,80,57,3.4,4.2);c.stroke();
  }
  function dockArt(c,w,h,a){
    a.ellipse(c,80,80,66,66,'#163a46');a.ellipse(c,80,80,57,57,'#1f4d57');
    c.strokeStyle='#7ea89d';c.lineWidth=4;c.beginPath();c.arc(80,80,61,0,Math.PI*2);c.stroke();
    c.strokeStyle='#b3d8bc';c.lineWidth=6;for(let i=0;i<4;i++){c.beginPath();c.arc(80,80,53,i*Math.PI/2+.15,i*Math.PI/2+.75);c.stroke();}
    a.path(c,[[59,56],[101,56],[101,104],[59,104]],a.linear(c,57,51,99,106,[[0,'#8ba797'],[1,'#385d66']]),'#bdd5b9',2);
    a.path(c,[[67,93],[67,75],[80,63],[93,75],[93,93]],'#143c49','#b7d0aa',3);
    c.fillStyle='#86dbc1';c.fillRect(76,80,8,16);
  }
  const atlas={builtins:['glow','shadow','ring'],tiles:[
    {name:'echo_floor',x:0,y:0,w:128,h:128,paint:floorArt},
    {name:'echo_wall',x:128,y:0,w:128,h:128,paint:wallArt},
    {name:'echo_drone',x:256,y:0,w:192,h:192,paint:droneArt},
    {name:'echo_beacon',x:448,y:0,w:128,h:128,paint:beaconArt},
    {name:'echo_hazard',x:576,y:0,w:160,h:160,paint:hazardArt},
    {name:'echo_dock',x:736,y:0,w:160,h:160,paint:dockArt}
  ]};
  function center(r,text,x,y,size,color){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
  function memory(r,cell,size){
    const half=size/2,x=cell.x-half,y=cell.y-half;
    r.rect(x,y,size,size,C.ink);
    if(!cell.seen)return;
    if(cell.type==='wall'){
      r.rect(x+2,y+2,size-4,size-4,'#1b3239');r.line(x+4,y+4,x+size-4,y+4,1,'#385058');
      r.line(x+4,y+4,x+4,y+size-4,1,'#2c444d');
    }else{
      r.rect(x+1,y+1,size-2,size-2,'#122b34');
      r.line(x+5,y+size-5,x+size-5,y+size-5,.6,'#28424b');
    }
  }
  function terrain(r,s){
    const size=s.grid.cellSize;
    s.cells.forEach(cell=>{
      if(!cell.seen||!cell.visible){memory(r,cell,size);return;}
      // Every wall bevel and floor shadow is baked strictly inside this tile.
      r.sprite(cell.type==='wall'?'echo_wall':'echo_floor',cell.x,cell.y,size,size,0,'#fff');
    });
  }
  function echo(r,s){
    const size=s.grid.cellSize;
    s.waves.forEach(wave=>wave.frontier.forEach(id=>{
      const cell=s.cells[id];if(!cell||!cell.seen||!cell.visible)return;
      const pad=size*.14;
      r.sprite('glow',cell.x,cell.y,size*.92,size*.92,0,cell.type==='wall'?'#8bddbf74':'#8dddcd63');
      if(cell.type==='wall'){
        r.line(cell.x-size/2+pad,cell.y-size/2+pad,cell.x+size/2-pad,cell.y-size/2+pad,1.5,'#b7edce');
      }else{
        r.circle(cell.x,cell.y,1.4,'#c1f1d7');
        r.line(cell.x-6,cell.y,cell.x-3,cell.y,.8,'#6bbda9');r.line(cell.x+3,cell.y,cell.x+6,cell.y,.8,'#6bbda9');
      }
    }));
  }
  function items(r,s,t){
    s.beacons.forEach((b,i)=>{
      if(!b.visible&&!b.collected)return;
      if(b.collected){
        r.sprite('ring',b.x,b.y,24,24,0,'#4e8c83');center(r,'OK',b.x,b.y-3,7,'#8fc0a6');
      }else{
        r.sprite('glow',b.x,b.y,34,34,0,'#eecb8088');
        r.sprite('echo_beacon',b.x,b.y,31,31,0,'#fff');
        center(r,String(i+1).padStart(2,'0'),b.x,b.y+12,7,'#f1dfad');
      }
    });
    // Warning halos are decoration, so the terrain mask may clip them.
    s.hazards.forEach(h=>{if(h.visible&&h.alerted)r.sprite('ring',h.x,h.y,33,33,0,'#efaa8588');});
  }
  function hazards(r,s){
    s.hazards.forEach(h=>{
      if(!h.visible)return;
      // Include the baked outer stroke in the model's collision-radius envelope.
      const size=h.radius*160/59;
      r.sprite('echo_hazard',h.x,h.y,size,size,h.angle,'#fff');
      if(h.alerted)center(r,'!',h.x,h.y-5,12,'#ffedbc');
    });
  }
  function craftEffects(r,s){
    const p=s.player,size=p.radius*192/68;
    r.sprite('shadow',p.x,p.y+3,size*1.15,size*.65,0,'#000000a0');
    if(Math.hypot(p.vx,p.vy)>1){
      const wake=p.quiet?4:7;
      r.sprite('glow',p.x-Math.cos(p.angle)*wake,p.y-Math.sin(p.angle)*wake,17,17,0,p.quiet?'#7bb8b14d':'#b3e7cf85');
    }
    // A small locator, not a range circle: both light and sonar reach come from the model.
    r.line(p.x-3,p.y-16,p.x+3,p.y-16,1.2,p.quiet?'#a0c3bc':'#e9ebc9');
  }
  function craft(r,s){
    const p=s.player,size=p.radius*192/68;
    r.sprite('echo_drone',p.x,p.y,size,size,p.angle,p.invulnerable>0?'#f7c9b4':'#fff');
  }
  function frame(r,s){
    const g=s.grid,x=g.x,y=g.y,w=g.cols*g.cellSize,h=g.rows*g.cellSize;
    r.rect(x-5,y-5,w+10,h+10,'#2f5059');r.rect(x-3,y-3,w+6,h+6,'#0a1d27');
    r.text('ECHO CARTOGRAPHER',28,15,15,'#d0e6d5');r.text('SUBMERGED SURVEY / '+String(s.level).padStart(2,'0'),685,20,10,'#7ba5a5');
    for(let i=0;i<g.cols;i+=2)center(r,String(i+1).padStart(2,'0'),x+(i+.5)*g.cellSize,y-14,7,'#577d84');
    for(let i=0;i<g.rows;i+=2)r.text(String(i+1).padStart(2,'0'),x-22,y+(i+.5)*g.cellSize-4,8,'#577d84');
    r.line(31,71,31,465,1,'#254650');r.text('E',27,52,11,'#6d9998');
    for(let i=0;i<21;i++)r.line(31,81+i*18,31+(i%5===0?12:5),81+i*18,1,i%5===0?'#688f8c':'#355861');
    r.text('0',27,474,9,'#6d9998');
    r.line(898,73,898,465,1,'#254650');
    [C.mint,C.amber,C.coral].forEach((color,i)=>{r.circle(897,85+i*24,3.5,color);});
    r.text('N',893,50,11,'#6d9998');r.line(898,173,898,206,1.3,'#638e8c');r.line(898,173,894,181,1.3,'#638e8c');r.line(898,173,902,181,1.3,'#638e8c');
  }
  function readout(r,s){
    const collected=s.beacons.filter(b=>b.collected).length,ended=s.phase==='won'||s.phase==='lost';
    const cooldown=Math.max(0,s.cooldown);
    r.rect(100,501,760,26,'#142f39');r.line(100,501,860,501,1,'#466962');
    r.circle(113,514,3,ended?'#a9c3ac':s.player.quiet?'#b8cebd':C.mint);
    r.text(s.phase==='won'?'SURVEY COMPLETE':s.phase==='lost'?'SIGNAL LOST':s.player.quiet?'QUIET / B HELD':'CRUISE / B TO GO QUIET',124,509,10,'#c6dfca');
    r.text(ended?'ENTER / NEW SURVEY':s.battery<s.sonarCost?'SONAR / LOW POWER':cooldown>0?'SONAR  '+cooldown.toFixed(1)+'s':'A / EMIT SONAR',383,509,10,s.battery<s.sonarCost?C.coral:cooldown>0?'#98afa6':C.mint);
    const unlocked=s.entry.unlocked;
    r.text(ended?collected+' / '+s.beacons.length+' BEACONS':unlocked?'RETURN TO ENTRY':collected+' / '+s.beacons.length+' BEACONS / EXIT LOCKED',615,509,10,unlocked?C.amber:'#b3c6b7');
  }
  root.GameDef={
    id:'echo-cartographer',title:'回声探图',tagline:'让回声照亮前路，把未知带回地图',seed:113,
    accent:'#86e0ca',background:C.ink,levelLabel:'海图',levelNames:['回廊','双厅','折返'],atlas,
    description:'方向键驾驶，A 发射声呐沿通路探图。地形与信标留下暗色记忆，危险物仅在照明中可见。收齐信标后返入口；按住 B 慢速静行，降低移动噪声。电量持续消耗，扫描额外耗电；耗尽后应急灯仅维持片刻。',
    controls:{move:'摇杆 / 方向键：驾驶探测机',a:'发射声呐 · 空格 / 右上半屏',b:'按住静行 · B / 右下半屏'},
    actionLabels:['发射声呐','按住静行'],
    tip:'地图记忆保留，照明会消退。声呐耗电；收齐信标后返入口。按住 B 静行。',
    winTitle:'这片未知已有了坐标',loseTitle:'信号暂时中断',
    result(s){
      const found=s.beacons.filter(b=>b.collected).length;
      if(s.phase==='won')return '已带回全部 '+found+' 枚信标，完成海图测绘。';
      const progress='已取得 '+found+' / '+s.beacons.length+' 枚信标。';
      if(s.lostReason==='shield')return '护盾耗尽，探测机失去保护。'+progress+'遇追击先松开 B 拉开距离；接近危险前再按住 B 静行。';
      if(s.lostReason==='darkness')return '电池与应急照明均已耗尽。'+progress+'减少无效扫描，预留返航电量。';
      return progress+'重新出发，留意护盾与返航电量。';
    },
    hud(s){return[
      {label:'测绘信标',value:s.beacons.filter(b=>b.collected).length+' / '+s.beacons.length,tone:'good'},
      {label:'剩余电量',value:s.battery>0?Math.ceil(s.battery)+' / '+s.maxBattery:'应急 '+Math.max(0,Math.ceil(s.reserve))+' s',tone:s.battery<20?'warn':''},
      {label:'机体护盾',value:s.player.shield+' / '+s.player.maxShield,tone:s.player.shield<2?'warn':''},
      {label:'预计续航',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<20?'warn':''}
    ];},
    render(r,s,t){
      frame(r,s);terrain(r,s);echo(r,s);items(r,s,t);craftEffects(r,s);
      // Opaque unknown/memory cells also clip neighboring entity decoration. No hidden
      // terrain or hazard is ever submitted underneath this defensive second pass.
      s.cells.forEach(cell=>{if(!cell.visible)memory(r,cell,s.grid.cellSize);});
      // Entity visibility uses its actual point and LOS, independently of the cell
      // center. Draw only the authorized solid hazard here; never brighten its tile.
      hazards(r,s);
      s.beacons.forEach(b=>{if(b.visible)return;if(b.collected){r.sprite('ring',b.x,b.y,24,24,0,'#4e8c83');center(r,'OK',b.x,b.y-3,7,'#8fc0a6');}else if(b.seen){r.rect(b.x-3,b.y-3,6,6,'#887e57',Math.PI/4);}});
      // Entrance is the single always-known landmark explicitly supplied by the model.
      r.sprite('echo_dock',s.entry.x,s.entry.y,s.entry.radius*160/66,s.entry.radius*160/66,0,s.entry.unlocked?'#d7e7a8':'#82a99a');
      // Player position is always known, including the last seconds of reserve light.
      // Only the physical hull is above fog; its wake/shadow/locator were clipped above.
      craft(r,s);readout(r,s);
    }
  };
})(window);
