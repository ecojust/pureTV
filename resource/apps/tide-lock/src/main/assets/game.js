/* Tide Lock: a waterline-accurate canal section and a private, once-baked art atlas. */
(function(root){
  'use strict';
  const WATER='#78dbe6',GOLD='#e7ca87';
  function boatArt(c,w,h,a){
    a.ellipse(c,128,148,106,10,a.radial(c,128,148,108,[[0,'rgba(0,0,0,.35)'],[1,'transparent']]));
    a.path(c,[[18,65],[238,65],[218,139],[56,139],[18,102]],a.linear(c,0,64,0,140,[[0,'#d3e9e7'],[.22,'#85b6c3'],[.49,'#3c788d'],[1,'#254e69']]),'#203f53',3);
    a.path(c,[[18,65],[34,54],[225,54],[238,65]],'#eaf3e6','#b5ced0',2);
    c.fillStyle='#edc877';c.fillRect(26,69,207,8);
    c.strokeStyle='#71afbd';c.lineWidth=2;c.beginPath();c.moveTo(47,109);c.lineTo(220,109);c.stroke();
    a.path(c,[[45,27],[97,27],[103,35],[103,58],[45,58]],a.linear(c,50,28,103,60,[[0,'#e9f4ed'],[.6,'#c1d8d3'],[1,'#91b4bd']]),'#36586b',2);
    a.path(c,[[40,27],[51,19],[96,19],[108,27]],'#e2eeeb','#f3f8ed',2);
    c.fillStyle='#21546b';c.fillRect(52,34,16,16);c.fillRect(75,34,20,16);
    c.fillStyle='#88dce6';c.fillRect(54,36,12,5);c.fillRect(77,36,16,5);
    c.fillStyle='#375466';c.fillRect(91,8,8,12);
    a.path(c,[[119,34],[165,34],[165,56],[119,56]],'#b8ccaa','#e5e7ba',2);
    a.path(c,[[119,34],[128,26],[172,26],[165,34]],'#d9dfb6');
    a.path(c,[[165,34],[172,26],[172,48],[165,56]],'#819c91');
    a.path(c,[[177,39],[211,39],[211,56],[177,56]],'#c3a480','#edd8ab',2);
    c.strokeStyle='#6e8e88';c.lineWidth=2;[128,140,152].forEach(x=>{c.beginPath();c.moveTo(x,37);c.lineTo(x,53);c.stroke();});
    c.strokeStyle='#e3f2e9';c.lineWidth=2;c.beginPath();c.moveTo(25,52);c.lineTo(25,39);c.moveTo(25,42);c.lineTo(42,42);c.moveTo(215,54);c.lineTo(215,40);c.lineTo(230,40);c.stroke();
    [48,98,189,218].forEach(x=>{a.ellipse(c,x,82,7,10,'#193e51');a.ellipse(c,x,81,3.2,5,'#739ca8');});
    c.fillStyle='#e5f2eb';c.font='bold 18px Arial';c.fillText('T',137,102);
  }
  function gateArt(c,w,h,a){
    a.path(c,[[30,12],[90,12],[98,20],[98,211],[30,211]],a.linear(c,27,10,100,10,[[0,'#dce8e5'],[.25,'#86a7af'],[.6,'#4b7282'],[1,'#254d63']]),'#203e54',3);
    a.path(c,[[38,23],[84,23],[84,202],[38,202]],'#395f73','#afc7c7',2);
    for(let y=39;y<200;y+=27){c.fillStyle='#82a6b1';c.fillRect(36,y,51,8);c.fillStyle='#c6d9d5';c.fillRect(36,y,51,2);}
    c.strokeStyle='#bbd0cc';c.lineWidth=4;c.beginPath();c.moveTo(42,28);c.lineTo(80,196);c.moveTo(80,28);c.lineTo(42,196);c.stroke();
    [29,193].forEach(y=>{a.ellipse(c,43,y,3,3,'#f1e4b8');a.ellipse(c,79,y,3,3,'#f1e4b8');});
    c.fillStyle='#e0bb74';c.fillRect(28,12,70,7);c.fillRect(28,205,70,7);
  }
  function valveArt(c,w,h,a){
    a.ellipse(c,66,79,50,31,a.radial(c,66,79,54,[[0,'rgba(0,0,0,.48)'],[1,'transparent']]));
    a.ellipse(c,64,66,46,46,a.linear(c,24,19,100,112,[[0,'#d4e7df'],[.25,'#789ba7'],[.7,'#2d596f'],[1,'#163b55']]));
    a.ellipse(c,64,63,36,36,'#234c62');
    c.strokeStyle=a.linear(c,25,25,101,104,[[0,'#f6d695'],[.55,'#c09257'],[1,'#795c3e']]);c.lineWidth=8;c.beginPath();c.arc(64,61,30,0,Math.PI*2);c.stroke();
    c.lineWidth=5;for(let i=0;i<6;i++){const t=i*Math.PI/3;c.beginPath();c.moveTo(64,61);c.lineTo(64+Math.cos(t)*29,61+Math.sin(t)*29);c.stroke();}
    a.ellipse(c,64,61,9,9,'#ddc896');a.ellipse(c,62,58,4,4,'#f6e6b8');
  }
  function waterArt(c,w,h,a){
    c.fillStyle=a.linear(c,0,0,0,h,[[0,'rgba(99,218,230,.76)'],[.24,'rgba(59,153,179,.66)'],[1,'rgba(24,75,111,.88)']]);c.fillRect(0,0,w,h);
    c.fillStyle='rgba(187,249,249,.24)';c.fillRect(0,0,w,4);
    for(let x=14;x<w;x+=39){a.path(c,[[x,3],[x+8,3],[x+29,h],[x+7,h]],'rgba(130,223,226,.045)');}
  }
  function centered(r,text,x,y,size,tint){r.text(text,x-r.measureText(text,size)/2,y,size,tint);}
  function selectFrame(r,x,y,t,w){
    const half=w||22,c='#e9edbc';r.sprite('glow',x,y,88,88,0,'#dce69825');
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{r.line(x+sx*half,y+sy*half,x+sx*(half-7),y+sy*half,2,c);r.line(x+sx*half,y+sy*half,x+sx*half,y+sy*(half-7),2,c);});
    r.circle(x+half+2,half<=24?y+half+2:y-half-2,2+Math.sin(t*3)*.3,c);
  }
  function structure(r,s){
    const left=s.zones[0].x1,right=s.zones[s.zones.length-1].x2;
    const bankTop=s.floorY-Math.max(...s.zones.map(zone=>zone.capacity))*s.levelScale;
    r.sprite('glow',477,252,1010,650,0,'#194450');
    r.rect(left-17,bankTop,right-left+34,s.floorY-bankTop+13,'#0d2637');
    r.rect(left-17,s.floorY,right-left+34,20,'#708d91');r.rect(left-17,s.floorY+7,right-left+34,13,'#405f6e');
    r.line(left-17,s.floorY,left-17+right-left+34,s.floorY,2,'#c2d4cd');
    [left-17,right+3].forEach(x=>{r.rect(x,bankTop,14,s.floorY-bankTop+20,'#88a3a5');r.rect(x+3,bankTop+6,5,s.floorY-bankTop+10,'#b0c2ba');});
    s.zones.forEach((zone,index)=>{
      const top=s.floorY-zone.capacity*s.levelScale;
      r.rect(zone.x1+2,top,zone.x2-zone.x1-4,s.floorY-top,'#173749');
      for(let y=top+21;y<s.floorY;y+=37)r.line(zone.x1+4,y,zone.x2-4,y,1,'#244353');
      const x=(zone.x1+zone.x2)/2;
      centered(r,index===0?'LOWER CANAL':index===s.zones.length-1?'UPPER CANAL':'CHAMBER '+index,x,55,9,index===0||index===s.zones.length-1?'#9ebdc7':'#dce9dc');
      centered(r,zone.level.toFixed(2)+' m',x,71,16,'#aee7e7');
      if(!zone.isReservoir){r.line(zone.x1+22,210,zone.x2-22,210,1,'#4b7881');}
    });
    for(let metres=0;metres<=8;metres++){
      const y=s.floorY-metres*s.levelScale;r.line(left-28,y,left-20,y,1,'#799fa9');r.text(String(metres),left-42,y-6,9,'#88aeb7');
    }
    r.text('m',left-44,118,10,'#88aeb7');
  }
  function water(r,s,t,front){
    s.zones.forEach(zone=>{
      const h=Math.max(0,s.floorY-zone.waterY),w=zone.x2-zone.x1-4;
      if(h>0){
        if(front)r.rect(zone.x1+2,zone.waterY,w,h,'#4abbd52b');
        else r.sprite('tide_water',(zone.x1+zone.x2)/2,zone.waterY+h/2,w,h,0,'#fff');
      }
      if(front){
        r.line(zone.x1+3,zone.waterY,zone.x2-3,zone.waterY,2,'#b0f1ef');
        for(let x=zone.x1+9;x<zone.x2-12;x+=27){const bob=Math.sin(t*1.5+x*.03)*.65;r.line(x,zone.waterY+bob+4,Math.min(x+12,zone.x2-4),zone.waterY+bob+4,1,'#a3e8ec6e');}
      }
    });
  }
  function plumbing(r,s,t){
    s.valves.forEach(valve=>{
      const zone=s.zones.find(z=>z.id===valve.zoneId),fill=valve.type==='fill',x=valve.x,y=valve.y;
      if(!zone)return;
      if(fill){
        r.line(x-55,y,x+34,y,10,'#1d3b4b');r.line(x-55,y-2,x+34,y-2,7,'#74949b');r.line(x+34,y-2,x+34,138,8,'#446b7c');r.line(x+33,y,x+33,138,2,'#a9c7c6');
        if(valve.open&&valve.flow!==0){
          r.line(x+34,140,x+34,Math.max(143,zone.waterY),4,'#77dce4a0');r.line(x+33,140,x+33,Math.max(143,zone.waterY),1,'#ccffffb0');
          for(let j=0;j<4;j++){const f=(t*.8+j*.25)%1;r.circle(x+34+Math.sin(j*3)*2,140+f*Math.max(0,zone.waterY-140),1.4,'#ddfffc');}
        }
      }else{
        r.line(x-42,y,x+40,y,12,'#183948');r.line(x-42,y-2,x+40,y-2,8,'#6f8e97');r.line(x+40,y,x+40,s.floorY+22,9,'#3c6576');
        if(valve.open&&valve.flow!==0){r.line(x-33,y-2,x+32,y-2,3,'#89e0e5');r.sprite('glow',x+40,s.floorY+18,24,14,0,'#71cfe56b');}
      }
    });
  }
  function boat(r,s,t){
    s.boats.forEach(b=>{
      if(b.status==='exited'||(b.status==='queued'&&b.id!==s.activeBoatId))return;
      // In this tile the hull spans x18..238; waterline y70, keel y139.
      // The model supplies the waterline, including its grounded-height constraint.
      const w=b.length*256/220,h=b.draft*s.levelScale*160/69;
      r.sprite('shadow',b.x,b.y+3,b.length*1.65,12,0,'#12293675');
      const unsafe=b.dry===false||b.groundedTime>0;
      r.sprite('tide_boat',b.x,b.y+(80-70)*h/160,w,h,0,unsafe?'#e5bc91':'#fff');
      const keel=b.y+b.draft*s.levelScale;
      if(b.id===s.activeBoatId){
        const closeGate=s.gates.find(g=>Math.abs(g.x-b.x)<80),side=closeGate&&closeGate.x>b.x?-1:1;
        const markerX=b.x+side*(b.length/2+8),label=b.draft.toFixed(2)+'m';
        r.line(markerX,b.y,markerX,keel,1,'#c1e7d680');
        r.line(markerX-3,keel,markerX+3,keel,1,'#c1e7d680');
        r.text(label,side>0?markerX+5:markerX-5-r.measureText(label,8),b.y+5,8,unsafe?'#efc28c':'#b4dfdd');
      }
    });
  }
  function controls(r,s,t){
    s.gates.forEach((gate,index)=>{
      const capacity=Math.max(...s.zones.filter(zone=>zone.id===gate.leftId||zone.id===gate.rightId).map(zone=>zone.capacity));
      const top=s.floorY-capacity*s.levelScale,bottom=s.floorY,h=bottom-top;
      r.rect(gate.x-7,top,14,h,'#254b5b');r.line(gate.x-7,top,gate.x-7,bottom,2,'#9eb7b5');r.line(gate.x+7,top,gate.x+7,bottom,2,'#6b919c');
      if(!gate.open)r.sprite('tide_gate',gate.x,top+h/2,38,h*224/200,0,'#fff');
      else {
        // A clear opening and a parked narrow leaf show the binary gate state.
        r.line(gate.x,top+12,gate.x,bottom-3,2,'#9dddb044');r.rect(gate.x+9,top+6,5,h-12,'#81a9ae');
        r.sprite('glow',gate.x,gate.y,50,100,0,'#85dca323');
      }
      r.rect(gate.x-26,gate.y-18,52,36,'#143a4a');r.line(gate.x-26,gate.y-18,gate.x+26,gate.y-18,1,'#91b7b7');
      centered(r,'G'+(index+1),gate.x,gate.y-13,10,'#cce7e2');centered(r,gate.locked?'LOCK':gate.open?'OPEN':'SHUT',gate.x,gate.y+2,8,gate.locked?GOLD:gate.open?'#b8e6b4':'#9dbdc6');
      if(gate.id===s.selectedId)selectFrame(r,gate.x,gate.y,t,29);
    });
    s.valves.forEach(valve=>{
      const fill=valve.type==='fill',on=valve.open;
      r.sprite('tide_valve',valve.x,valve.y,39,39,0,on?'#d7ead3':'#a2bec7');
      centered(r,(fill?'FILL':'DRAIN')+(on?' ON':' OFF'),valve.x,valve.y+24,10,on?'#d8e9af':'#85aab8');
      r.circle(valve.x+16,valve.y-15,3,on?'#c6ecb0':'#668491');
      if(valve.id===s.selectedId)selectFrame(r,valve.x,valve.y,t,fill?18:24);
    });
  }
  function selectedPanel(r,s){
    const selected=s.controls.find(item=>item.id===s.selectedId),gate=s.gates.find(item=>item.id===s.selectedId);
    r.rect(28,495,904,31,'#133442');r.line(28,495,932,495,1,'#527f88');r.text('SELECTED',40,505,8,'#88aeb7');
    let name='GATE',status='A  OPEN / CLOSE';
    if(selected){
      if(gate){name='GATE '+(s.gates.indexOf(gate)+1);status=gate.locked?'BOAT CROSSING - LOCKED':gate.open?'OPEN - B TO ADVANCE':'MATCH LEVELS BEFORE OPENING';}
      else{name=(selected.type==='fill'?'FILL ':'DRAIN ')+(s.zones.findIndex(z=>z.id===selected.zoneId));status=selected.open?'FLOWING - A TO CLOSE':'A TO OPEN VALVE';}
    }
    r.text(name,113,503,14,'#e2edcf');r.text(status,363,505,10,'#afd5d4');r.text('B  ADVANCE BOAT',775,505,10,'#d6dcb2');
  }
  root.GameDef={
    id:'tide-lock',title:'潮汐闸门',tagline:'让水位慢慢相遇，让船只平稳通行',seed:61,
    accent:'#9ddfdc',background:'#0c2535',levelLabel:'航次',levelNames:['初潮','连航','满载'],
    atlas:{builtins:['glow','shadow','ring'],tiles:[
      {name:'tide_boat',x:0,y:0,w:256,h:160,paint:boatArt},
      {name:'tide_gate',x:256,y:0,w:128,h:224,paint:gateArt},
      {name:'tide_valve',x:384,y:0,w:128,h:128,paint:valveArt},
      {name:'tide_water',x:512,y:0,w:256,h:224,paint:waterArt}
    ]},
    description:'方向键选择闸门或注水、排水阀，A 开关设备，B 让当前船驶向下一水域。先关闭闸门，用注水或排水调整闸室；两侧水位差不超过 0.15 米、相邻阀门关闭后才能开闸。船跨门时不可关闸，留足吃水深度，把全部船只送到上游。',
    controls:{move:'摇杆 / 方向键：选择闸门或水阀',a:'开关设备 · 空格 / 右上半屏',b:'船只前进 · B / 右下半屏'},
    actionLabels:['开关设备','船只前进'],
    tip:'先关闸，再调水位，关阀后才开闸。每个水域上方标出实际水位；船底细线显示吃水。下一艘船抵达前记得准备下游闸室。',
    winTitle:'船已过闸，潮水平稳',loseTitle:'这次水情需要再调整',
    result(s){return s.phase==='won'?'本航次 '+s.deliveries+' 艘船全部安全抵达，用时 '+s.elapsed.toFixed(1)+' 秒。用左右键选择其他航次，再按 Enter 开始。':(s.message||'调整阀门顺序后，再试一次。')+' 已通行 '+s.deliveries+' / '+s.target+' 艘船。';},
    hud(s){const b=s.boats.find(boat=>boat.id===s.activeBoatId),gate=s.gates.find(item=>item.id===s.selectedId),selected=s.controls.find(item=>item.id===s.selectedId);return[
      {label:'安全通行',value:s.deliveries+' / '+s.target,tone:'good'},
      {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''},
      {label:'选中设备',value:selected?(selected.name||selected.id):'—',tone:gate&&gate.locked?'warn':''},
      {label:'船舶吃水',value:b?b.draft.toFixed(2)+' m':'—',tone:b&&(b.dry===false||b.groundedTime>0)?'warn':''}
    ];},
    render(r,s,t){
      r.text('TIDE LOCK',28,16,18,'#e1efea');r.text('CANAL SECTION / VOYAGE '+String(s.level).padStart(2,'0'),29,39,9,'#8bb2bc');
      r.text('LOWER '+s.zones[0].level.toFixed(1)+'m  >  TWO CHAMBERS  >  UPPER '+s.zones[s.zones.length-1].level.toFixed(1)+'m',605,26,10,'#91bcc4');
      structure(r,s);plumbing(r,s,t);water(r,s,t,false);boat(r,s,t);water(r,s,t,true);controls(r,s,t);selectedPanel(r,s);
    }
  };
})(window);
