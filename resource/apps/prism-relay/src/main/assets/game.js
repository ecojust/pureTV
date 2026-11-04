/* Original optical-bench art; drawing reads the deterministic model without changing it. */
(function (root) {
  'use strict';
  const COLORS = {1:'#ff6d82',2:'#70ecaf',3:'#ffe59a',4:'#7aaaff',5:'#dba0ff',6:'#8beaf3',7:'#e5f7ff'};
  const LABELS = {1:'R',2:'G',3:'R+G',4:'B',5:'R+B',6:'G+B',7:'RGB'};
  const DIRECTIONS = ['RIGHT','DOWN','LEFT','UP'];
  const color = mask => COLORS[mask] || '#748ca1';
  // A packaged RGB demultiplexer, not a refracting triangular glass prism.
  // Two dichroic mirrors separate the channels; four ordinary mirrors align
  // the output ports. Port chevrons denote optical isolation against return light.
  function routerArt(c,w,h,a) {
    a.ellipse(c,96,164,78,17,a.radial(c,96,164,80,[[0,'#0008'],[1,'#0000']]));
    a.path(c,[[26,23],[166,23],[173,30],[173,162],[166,169],[26,169],[19,162],[19,30]],a.linear(c,20,20,174,170,[[0,'#9fb9c7'],[.3,'#476575'],[1,'#203c50']]),'#bdd5df',2);
    c.fillStyle='#0a1e2c';c.fillRect(29,33,134,126);c.strokeStyle='#668d9c';c.lineWidth=2;c.strokeRect(29,33,134,126);
    function line(points,tint,width=4){c.strokeStyle=tint;c.lineWidth=width;c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
    line([[6,96],[70,96]],'#effaff');
    line([[70,96],[120,96]],'#8beaf3');line([[120,96],[186,96]],COLORS[2]);
    line([[70,96],[70,53],[96,53],[96,6]],COLORS[1]);
    line([[120,96],[120,139],[96,139],[96,186]],COLORS[4]);
    // / at the first splitter reflects R upward; \\ at the second reflects B down.
    line([[61,105],[79,87]],COLORS[1],6);line([[111,87],[129,105]],COLORS[4],6);
    [[70,53],[96,53],[120,139],[96,139]].forEach(([x,y])=>{line([[x-8,y+8],[x+8,y-8]],'#bed6df',5);line([[x-8,y+7],[x+7,y-8]],'#f2fbff',1.5);});
    function port(x,y,angle,tint){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle='#172d3e';c.strokeStyle='#abc6d1';c.lineWidth=1.5;c.fillRect(-13,-10,26,20);c.strokeRect(-13,-10,26,20);line([[-9,0],[9,0]],tint,3);line([[-3,-5],[3,0],[-3,5]],tint,2);c.restore();}
    port(15,96,0,'#effaff');port(96,15,-Math.PI/2,COLORS[1]);port(177,96,0,COLORS[2]);port(96,177,Math.PI/2,COLORS[4]);
    [[37,41],[155,41],[37,151],[155,151]].forEach(([x,y])=>{a.ellipse(c,x,y,3,3,'#b1c5c9');line([[x-2,y],[x+2,y]],'#304b5b',1);});
  }
  const atlas={builtins:['glow','shadow','ring','mirror'],tiles:[{name:'rgb_router',x:192,y:800,w:192,h:192,paint:routerArt}]};
  function centered(r, text, x, y, size, tint) { r.text(text,x-r.measureText(text,size)/2,y,size,tint); }
  function arrow(r,x1,y1,x2,y2,tint,width) {
    r.line(x1,y1,x2,y2,width||2,tint);
    const a=Math.atan2(y2-y1,x2-x1),h=6;
    r.line(x2,y2,x2-Math.cos(a-.55)*h,y2-Math.sin(a-.55)*h,width||2,tint);
    r.line(x2,y2,x2-Math.cos(a+.55)*h,y2-Math.sin(a+.55)*h,width||2,tint);
  }
  function selection(r,x,y,size,t) {
    const h=size/2,l=size*.22,c='#9ef8e9';
    r.sprite('glow',x,y,size*1.8,size*1.8,0,'#64e4d51d');
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{
      r.line(x+sx*h,y+sy*h,x+sx*(h-l),y+sy*h,2.5,c);
      r.line(x+sx*h,y+sy*h,x+sx*h,y+sy*(h-l),2.5,c);
    });
    r.circle(x+h+2,y-h-2,2.5+Math.sin(t*4)*.4,c);
  }
  function board(r,s,t) {
    const cell=Math.min(79,650/s.width,399/s.height);
    const bw=cell*s.width,bh=cell*s.height,gx=371-bw/2,gy=278-bh/2;
    const px=x=>gx+(x+.5)*cell,py=y=>gy+(y+.5)*cell;
    r.sprite('glow',368,268,810,640,0,'#133d4a');
    r.rect(24,57,696,445,'#030c15');
    r.rect(24,53,696,445,'#284052');
    r.rect(26,55,692,441,'#112538');
    r.rect(29,58,686,435,'#091a2a');
    r.line(30,59,714,59,1,'#4d6878');r.line(30,492,714,492,1,'#060e17');
    [[36,65],[708,65],[36,486],[708,486]].forEach(([x,y])=>{
      r.circle(x,y,3,'#546a78');r.line(x-1.5,y,x+1.5,y,1,'#142b3b');
    });
    for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
      r.rect(gx+x*cell+1,gy+y*cell+1,cell-2,cell-2,(x+y)%2?'#0d2233':'#102638');
      r.circle(px(x),py(y),.9,'#294154');
    }
    for(let x=0;x<=s.width;x++)r.line(gx+x*cell,gy,gx+x*cell,gy+bh,.7,'#2a4051');
    for(let y=0;y<=s.height;y++)r.line(gx,gy+y*cell,gx+bw,gy+y*cell,.7,'#2a4051');
    // Three widths form a soft beam inside the same ordinary quad batch.
    (s.beams||[]).forEach((beam,i)=>{
      const x1=px(beam.x1),y1=py(beam.y1),x2=px(beam.x2),y2=py(beam.y2),c=color(beam.colorBits);
      r.line(x1,y1,x2,y2,cell*.17,c+'13');r.line(x1,y1,x2,y2,cell*.095,c+'30');
      r.line(x1,y1,x2,y2,Math.max(2.1,cell*.042),c);r.line(x1,y1,x2,y2,.85,'#ffffffa0');
      const f=(t*.62+i*.27)%1;
      r.sprite('glow',x1+(x2-x1)*f,y1+(y2-y1)*f,11,11,0,c+'88');
    });
    s.cells.forEach(item=>{
      const x=px(item.x),y=py(item.y),z=cell;
      if(item.type==='source'){
        const c=color(item.color),a=(item.direction||0)*Math.PI/2;
        r.sprite('shadow',x,y+z*.27,z*.9,z*.6,0,'#ffffff');
        r.rect(x-z*.29,y-z*.25,z*.58,z*.50,'#29485b',a);
        r.rect(x-z*.23,y-z*.18,z*.46,z*.36,'#486778',a);
        r.rect(x-z*.20,y-z*.14,z*.31,z*.28,'#142d3f',a);
        for(let n=0;n<3;n++){
          const v=-z*.12+n*z*.1;
          r.line(x+Math.cos(a)*v-Math.sin(a)*z*.11,y+Math.sin(a)*v+Math.cos(a)*z*.11,x+Math.cos(a)*v+Math.sin(a)*z*.11,y+Math.sin(a)*v-Math.cos(a)*z*.11,2,'#7292a3');
        }
        const dx=Math.cos(a)*z*.27,dy=Math.sin(a)*z*.27;
        r.sprite('glow',x+dx,y+dy,z*.75,z*.75,0,c+'a0');r.circle(x+dx,y+dy,z*.095,c);
        centered(r,LABELS[item.color]||'IN',x,y+z*.32,Math.max(9,z*.13),'#b3d0df');
      } else if(item.type==='mirror'||item.type==='prism'){
        r.sprite(item.type==='prism'?'rgb_router':'mirror',x,y,z*.92,z*.92,item.orientation*Math.PI/2,'#fff');
        if(item.type==='prism'){
          // The small input arrow always points in the accepted travel direction.
          const a=item.orientation*Math.PI/2,ux=Math.cos(a),uy=Math.sin(a);
          arrow(r,x-ux*z*.43,y-uy*z*.43,x-ux*z*.26,y-uy*z*.26,'#f2fbff',1.5);
        }
        if(item.id===s.selectedId)selection(r,x,y,z*.88,t);
      } else if(item.type==='receiver'){
        const c=color(item.required),correct=item.incident===item.required,fraction=Math.min(1,(item.charge||0)/(item.maxCharge||20));
        r.sprite('shadow',x,y+z*.23,z*.8,z*.54,0,'#ffffff');
        r.circle(x,y,z*.31,'#314e62');r.circle(x,y,z*.27,'#0a1c2c');
        if(correct)r.sprite('glow',x,y,z*1.3,z*1.3,0,c+'80');
        r.sprite('ring',x,y,z*.70,z*.70,0,correct?c:c+'99');
        r.circle(x,y,z*.16,correct?c:c+'44');
        centered(r,LABELS[item.required]||'?',x,y-z*.065,Math.max(8,z*.16),correct?'#09202e':'#e5f4ff');
        r.rect(x-z*.28,y+z*.35,z*.56,3,'#33495a');
        if(fraction>0)r.rect(x-z*.28,y+z*.35,z*.56*fraction,3,c);
        if(item.incident&&!correct){r.line(x-z*.08,y-z*.08,x+z*.08,y+z*.08,1.5,'#ffbe9f');r.line(x-z*.08,y+z*.08,x+z*.08,y-z*.08,1.5,'#ffbe9f');}
      } else if(item.type==='hazard'){
        const heat=Math.min(1,(item.heat||0)/(item.limit||300)),hot=item.illuminated;
        r.rect(x-z*.26,y-z*.26,z*.52,z*.52,'#443334');r.rect(x-z*.21,y-z*.21,z*.42,z*.42,'#1c202b');
        r.line(x-z*.24,y-z*.24,x+z*.24,y-z*.24,2,'#d69c62');
        r.line(x-z*.24,y+z*.24,x+z*.24,y+z*.24,2,'#a06f48');
        for(let n=-1;n<=1;n++)r.line(x-z*.13,y+n*z*.09,x+z*.13,y+n*z*.09,2,hot?'#f39a69':'#6e5045');
        if(hot)r.sprite('glow',x,y,z,z,0,'#ff975a66');
        if(heat>0)r.rect(x-z*.26,y+z*.34,z*.52*heat,3,heat>.7?'#ff7266':'#f2b36c');
      } else if(item.type==='wall'){
        r.rect(x-z*.40,y-z*.40,z*.80,z*.80,'#3d5060');r.rect(x-z*.35,y-z*.35,z*.70,z*.70,'#243a4b');
      }
    });
  }
  function sidebar(r,s,t) {
    const x=746,w=190;
    r.rect(x,55,w,443,'#0b1c2c');r.line(x,55,x+w,55,1,'#315269');
    r.text('LIGHT ROUTING',x+16,72,13,'#d9effb');r.text('RGB MODULE / PORTS',x+16,94,9,'#8ba8bc');
    const cx=x+96,cy=188;
    r.sprite('glow',cx,cy,145,145,0,'#1c4052');
    arrow(r,x+10,cy,cx-54,cy,'#d9f2ff',2.5);r.text('IN',x+12,cy-18,10,'#d9f2ff');
    r.sprite('rgb_router',cx,cy,112,112,0,'#fff');
    arrow(r,cx,cy-49,cx,cy-61,COLORS[1],2);
    arrow(r,cx+49,cy,x+174,cy,COLORS[2],2.5);
    arrow(r,cx,cy+49,cx,cy+61,COLORS[4],2);
    centered(r,'R LEFT',cx,112,12,COLORS[1]);
    r.text('G',x+177,cy-6,11,COLORS[2]);
    centered(r,'B RIGHT',cx,257,12,COLORS[4]);
    r.line(x+16,282,x+w-16,282,1,'#284255');
    const selected=s.devices.find(d=>d.id===s.selectedId);
    r.text('SELECTED DEVICE',x+16,300,10,'#7c99b0');
    if(selected){
      const prism=selected.type==='prism';
      r.sprite(prism?'rgb_router':'mirror',x+40,345,48,48,selected.orientation*Math.PI/2,'#fff');
      r.text(prism?'RGB ROUTER':'MIRROR',x+72,327,prism?13:16,'#c4f6f0');
      r.text(prism?'IN: '+DIRECTIONS[selected.orientation]:(selected.orientation===0?'FACE: /':'FACE: \\'),x+72,350,10,'#8bb2c7');
      r.text('A  CLOCKWISE',x+17,380,11,'#b8d8e7');r.text('B  COUNTERCLOCKWISE',x+17,400,10,'#b8d8e7');
    }
    r.line(x+16,425,x+w-16,425,1,'#284255');
    if(s.level===3||s.level===4||s.level===6){r.text(s.level===3?'R + B = MAGENTA':s.level===4?'G + B = CYAN':'R + G + B = WHITE',x+16,442,11,COLORS[s.level===3?5:s.level===4?6:7]);r.text('CROSSING KEEPS CHANNELS',x+16,464,8.5,'#8ba8bc');}
    else {r.text('DICHROIC + MIRRORS',x+16,442,10,'#b3dfdf');r.text('PORTS: OPTICAL ISOLATORS',x+16,464,8.5,'#8ba8bc');}
  }
  root.GameDef={
    id:'prism-relay',stylesheet:'game-theme.css',title:'镜光接力',tagline:'让一束白光，抵达每一种色彩',seed:29,
    accent:'#8ce9dd',background:'#071522',levelLabel:'关卡',levelNames:['折转','分色','合光','双源','双路','回白'],atlas,
    description:'方向键选器件，A 顺转，B 逆转。分光模块用分色镜、转向镜和单向隔离端口，将入口中的 R/G/B 分别送往左/前/右。只跟踪 RGB 通道，不模拟完整光谱或光强。接收器连续收到目标通道 2 秒过关；相交光束仍沿原路传播。',
    controls:{move:'摇杆 / 方向键：选择器件',a:'顺时针旋转 · 空格 / 右上半屏',b:'逆时针旋转 · B / 右下半屏'},
    actionLabels:['顺时针转','逆时针转'],
    tip:'模块 R 左、G 直、B 右；回光被隔离吸收。接收器汇总通道，避开橙色吸收器。',
    winTitle:'每一束光，都已抵达',loseTitle:'再调整一次光路',
    result(s){return s.phase==='won'?'第 '+s.level+' 关「'+s.levelName+'」全部接收器充能完成，用时 '+s.elapsed.toFixed(1)+' 秒。用左右键选择其他关卡，再按 Enter 开始。':(s.message||'光源能量已耗尽。')+' 可以保留这次思路，重新调整镜片。';},
    hud(s){
      const done=s.receivers.filter(r=>r.charge>=r.maxCharge).length,selected=s.devices.find(d=>d.id===s.selectedId);
      const heat=s.hazards.reduce((m,h)=>Math.max(m,h.heat/h.limit),0);
      return[{label:'接收器充能',value:done+' / '+s.receivers.length,tone:'good'},
        {label:'光源剩余',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<12?'warn':''},
        {label:'选中器件',value:selected?(selected.type==='prism'?'分光模块':'镜片')+' '+(s.devices.indexOf(selected)+1):'—'},
        {label:s.hazards.length?'最高热量':'当前关卡',value:s.hazards.length?Math.ceil(heat*100)+'%':'折转',tone:heat>.65?'warn':''}];
    },
    render(r,s,t){
      r.text('LIGHT RELAY',27,19,17,'#d6f1fa');r.text('OPTICAL BENCH / 0'+s.level,27,40,9,'#66899f');
      r.text(['01 / REFLECTION','02 / RGB SEPARATION','03 / COMBINATION','04 / TWO SOURCES','05 / DUAL ROUTERS','06 / WHITE RETURN'][s.level-1],747,24,11,'#8fc9cf');
      board(r,s,t);sidebar(r,s,t);
      r.line(26,514,935,514,1,'#274151');r.text('SELECT  >  ROTATE  >  CONNECT',27,523,9,'#7093a8');
      r.text('R LEFT   /   G STRAIGHT   /   B RIGHT',663,523,9,'#6b94aa');
    }
  };
})(window);
