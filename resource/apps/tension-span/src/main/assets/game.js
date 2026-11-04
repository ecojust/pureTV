/* Tension Span: all contact points and cable endpoints come from the bridge model. */
(function(root){
  'use strict';
  function deckArt(c,w,h,a){
    c.fillStyle=a.linear(c,0,8,0,57,[[0,'#d6ddd0'],[.16,'#a7b5b0'],[.21,'#73878c'],[1,'#375764']]);c.fillRect(0,8,w,48);
    c.fillStyle='#e1e4d0';c.fillRect(0,8,w,4);c.fillStyle='#243f50';c.fillRect(0,23,w,25);
    c.strokeStyle='#a9bdba';c.lineWidth=3;c.beginPath();
    for(let x=-20;x<w;x+=46){c.moveTo(x,49);c.lineTo(x+23,25);c.lineTo(x+46,49);}c.stroke();
    c.fillStyle='#7d969c';c.fillRect(0,48,w,5);c.fillStyle='#d0d9c8';c.fillRect(0,18,w,3);
    for(let x=13;x<w;x+=46){a.ellipse(c,x,16,2.3,2.3,'#f4e5b3');a.ellipse(c,x,51,2.3,2.3,'#b5c8c5');}
  }
  function truckArt(c,w,h,a){
    a.path(c,[[24,55],[170,55],[170,29],[211,29],[229,49],[235,89],[224,94],[218,81],[204,76],[186,80],[181,96],[81,96],[76,81],[60,76],[45,81],[41,95],[24,95]],a.linear(c,0,29,0,98,[[0,'#f4db91'],[.48,'#e1b45e'],[1,'#9e783e']]),'#56626a',2);
    a.path(c,[[30,38],[164,38],[156,73],[41,73]],a.linear(c,20,35,20,77,[[0,'#e3cb86'],[.4,'#d1ae65'],[1,'#8f743f']]),'#eee1aa',2);
    a.path(c,[[35,38],[54,25],[76,29],[91,21],[119,29],[139,24],[158,38]],'#9aa9a8','#c3cdbe',2);
    a.path(c,[[52,36],[77,29],[95,35],[117,29],[139,37]],'#c0c8ba');
    c.strokeStyle='#8d814f';c.lineWidth=3;[52,78,104,130].forEach(x=>{c.beginPath();c.moveTo(x,44);c.lineTo(x+5,66);c.stroke();});
    a.path(c,[[178,36],[208,36],[222,52],[178,52]],a.linear(c,177,32,216,57,[[0,'#b9e5e5'],[.3,'#6bb0c3'],[1,'#28566d']]),'#e5e8c9',2);
    c.fillStyle='#365260';c.fillRect(178,57,23,22);c.fillStyle='#c7c9a8';c.fillRect(181,61,17,4);
    c.fillStyle='#f4dea0';c.fillRect(210,59,18,17);c.fillStyle='#405b63';c.fillRect(221,77,11,4);
    c.fillStyle='#fff4cb';c.fillRect(228,62,6,7);c.fillStyle='#d8c7a0';c.fillRect(19,85,14,5);c.fillRect(229,85,14,5);
    c.strokeStyle='#f7e6b4';c.lineWidth=2;c.beginPath();c.moveTo(172,29);c.lineTo(210,29);c.moveTo(26,78);c.lineTo(173,78);c.stroke();
    c.fillStyle='#5a604f';c.fillRect(94,80,51,9);c.fillStyle='#e0dfb5';c.font='bold 10px Arial';c.fillText('LOAD',104,88);
  }
  function wheelArt(c,w,h,a){
    a.ellipse(c,64,64,54,54,a.radial(c,64,64,54,[[0,'#344d59'],[.72,'#213947'],[1,'#112733']],51,44));
    c.strokeStyle='#526874';c.lineWidth=3;c.beginPath();c.arc(64,64,48,0,Math.PI*2);c.stroke();
    a.ellipse(c,64,64,34,34,a.linear(c,32,27,91,99,[[0,'#e0e9df'],[.4,'#8fa6aa'],[1,'#3d5b70']]));
    a.ellipse(c,64,64,20,20,'#334f64');
    for(let i=0;i<6;i++){const angle=i*Math.PI/3;a.ellipse(c,64+Math.cos(angle)*26,64+Math.sin(angle)*26,3.2,3.2,'#e5e5ce');}
    a.ellipse(c,64,64,10,10,'#c1cfc7');a.ellipse(c,61,61,4,4,'#eef4df');
  }
  function anchorArt(c,w,h,a){
    a.path(c,[[24,25],[99,25],[106,33],[106,106],[24,106]],a.linear(c,26,20,105,112,[[0,'#e3e6d6'],[.43,'#a8bcb8'],[1,'#537681']]),'#e0e4d0',2);
    a.path(c,[[34,35],[93,35],[93,95],[34,95]],'#536f7e','#b5c7bd',2);
    c.strokeStyle='#c7d0bb';c.lineWidth=6;c.beginPath();c.moveTo(40,40);c.lineTo(87,90);c.moveTo(87,40);c.lineTo(40,90);c.stroke();
    a.ellipse(c,64,64,18,18,'#d9d6aa');a.ellipse(c,64,64,10,10,'#33536a');a.ellipse(c,62,61,4,4,'#b2d4d7');
    [[31,32],[98,32],[31,99],[98,99]].forEach(p=>a.ellipse(c,p[0],p[1],3,3,'#f0ddb2'));
  }
  function rockArt(c,w,h,a){
    c.fillStyle=a.linear(c,0,0,w,h,[[0,'#7d9790'],[.25,'#5f7d7d'],[1,'#2d5266']]);c.fillRect(0,0,w,h);
    a.path(c,[[0,0],[83,0],[72,68],[118,120],[81,224],[0,224]],'#5b787a');
    a.path(c,[[83,0],[175,0],[142,75],[72,68]],'#92a99a');
    a.path(c,[[175,0],[256,0],[256,95],[205,126],[142,75]],'#658783');
    a.path(c,[[72,68],[142,75],[166,156],[118,120]],'#3f6572');
    a.path(c,[[166,156],[205,126],[256,155],[256,224],[139,224]],'#527582');
    c.strokeStyle='rgba(182,201,180,.26)';c.lineWidth=2;c.beginPath();c.moveTo(0,46);c.lineTo(72,68);c.lineTo(142,75);c.moveTo(0,149);c.lineTo(118,120);c.lineTo(166,156);c.lineTo(256,155);c.stroke();
  }
  const atlas={builtins:['glow','shadow','ring'],tiles:[
    {name:'bridge_deck',x:0,y:0,w:256,h:64,paint:deckArt},
    {name:'bridge_truck',x:0,y:96,w:256,h:128,paint:truckArt},
    {name:'bridge_wheel',x:256,y:0,w:128,h:128,paint:wheelArt},
    {name:'bridge_anchor',x:384,y:0,w:128,h:128,paint:anchorArt},
    {name:'bridge_rock',x:512,y:0,w:256,h:224,paint:rockArt}
  ]};
  function centerText(r,text,x,y,size,color){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
  function stressColor(cable){const ratio=cable.tension/cable.maxTension;return cable.broken?'#ef8b77':ratio>.88?'#f09476':ratio>.65?'#eacb83':'#98d9c0';}
  function dash(r,a,b,color,width){
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    for(let d=0;d<length;d+=15){const to=Math.min(d+7,length);r.line(a.x+dx*d/length,a.y+dy*d/length,a.x+dx*to/length,a.y+dy*to/length,width||1,color);}
  }
  function endpoints(s,cable){return[s.anchors.find(a=>a.id===cable.anchorId),s.nodes.find(n=>n.id===cable.nodeId)];}
  function landscape(r,s,t){
    const fixed=s.nodes.filter(n=>n.fixed).slice().sort((a,b)=>a.x-b.x),left=fixed[0],right=fixed[fixed.length-1];
    r.sprite('glow',500,210,1080,650,0,'#244a58');r.sprite('glow',470,420,940,330,0,'#2b6268');
    for(let y=96;y<440;y+=26)r.line(26,y,934,y,.5,'#31566355');
    for(let x=26;x<935;x+=26)r.line(x,90,x,440,.5,'#31566355');
    const measureY=380;r.line(left.x,measureY,right.x,measureY,1,'#89b7c0');[left.x,right.x].forEach(x=>r.line(x,measureY-7,x,measureY+7,1,'#89b7c0'));centerText(r,((right.x-left.x)/s.pixelScale).toFixed(1)+' m CLEAR SPAN',(left.x+right.x)/2,measureY+8,18,'#c4e0e8');
    r.rect(0,427,960,60,'#254e5c');r.rect(0,445,960,43,'#2e5b66');
    for(let i=0;i<21;i++){const x=(i*113+t*3)%980-20,y=438+(i*19)%39;r.line(x,y,x+26+(i%4)*11,y,1,i%2?'#56848455':'#7ba99a33');}
    r.sprite('bridge_rock',left.x/2,(left.y+488)/2,left.x,488-left.y,0,'#d0d9c4');
    r.sprite('bridge_rock',(right.x+960)/2,(right.y+488)/2,960-right.x,488-right.y,0,'#b7ccc7');
    r.rect(0,left.y,left.x,12,'#9baea5');r.line(0,left.y,left.x,left.y,2,'#d8dec8');
    r.rect(right.x,right.y,960-right.x,12,'#9baea5');r.line(right.x,right.y,960,right.y,2,'#d8dec8');
    for(let x=30;x<left.x-16;x+=33)r.rect(x,left.y+5,17,2,'#d9c58c');
    for(let x=right.x+17;x<950;x+=33)r.rect(x,right.y+5,17,2,'#d9c58c');
    r.text('START',34,left.y+26,18,'#e3edda');r.text('EXIT',882,right.y+26,18,'#e3edda');
    s.anchors.forEach((anchor,i)=>{
      const foot=s.nodes.filter(n=>n.fixed).reduce((near,node)=>Math.abs(node.x-anchor.x)<Math.abs(near.x-anchor.x)?node:near,fixed[0]);
      const baseY=foot.y+33,height=baseY-anchor.y;
      r.rect(anchor.x-22,baseY-4,44,15,'#456472');r.rect(anchor.x-19,baseY-8,38,12,'#b5c0af');
      r.rect(anchor.x-9,anchor.y,18,height,'#68868a');r.rect(anchor.x-8,anchor.y,5,height,'#b5c5bc');r.rect(anchor.x+5,anchor.y,4,height,'#385c6c');
      for(let y=anchor.y+28;y<baseY-4;y+=33)r.line(anchor.x-8,y,anchor.x+8,y,2,'#d0d6c0');
      r.rect(anchor.x-18,anchor.y-8,36,10,'#c0cbb8');r.sprite('bridge_anchor',anchor.x,anchor.y,31,31,0,'#fff');
      centerText(r,'T'+(i+1),anchor.x+(i?31:-31),anchor.y+11,18,'#c3ded8');
    });
  }
  function cables(r,s,t){
    // Unbuilt candidates are visual guides only; all endpoints use live model nodes.
    s.cables.filter(c=>!c.installed).forEach(c=>{
      const [a,b]=endpoints(s,c),selected=c.id===s.selectedId;
      dash(r,a,b,selected?'#e5e7b5':'#668f8c55',selected?1.8:.85);
    });
    s.cables.filter(c=>c.installed).forEach(c=>{
      const [a,b]=endpoints(s,c),color=stressColor(c),dx=b.x-a.x,dy=b.y-a.y;
      if(c.broken){
        r.line(a.x,a.y,a.x+dx*.40,a.y+dy*.40,2,color);r.line(b.x-dx*.18,b.y-dy*.18,b.x,b.y,2,color);
        r.sprite('glow',a.x+dx*.56,a.y+dy*.56,54,54,0,'#ef725344');
      }else{
        r.line(a.x+1,a.y+1,b.x+1,b.y+1,3.5,'#132f40');r.line(a.x,a.y,b.x,b.y,2.3,color);r.line(a.x-.4,a.y-.4,b.x-.4,b.y-.4,.6,'#dbe9d882');
      }
    });
    const selected=s.cables.find(c=>c.id===s.selectedId);
    if(selected){
      const [a,b]=endpoints(s,selected);
      [a,b].forEach(p=>{r.sprite('ring',p.x,p.y,23,23,0,'#e6eac0');});
      const x=(a.x+b.x)/2,y=(a.y+b.y)/2;
      r.circle(x,y,6,'#163c4a');r.circle(x,y,3.2+Math.sin(t*4)*.3,'#e6eac0');
    }
  }
  function panels(r,s){
    s.panels.forEach(panel=>{
      const a=s.nodes.find(n=>n.id===panel.aId),b=s.nodes.find(n=>n.id===panel.bId),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
      if(panel.broken){
        r.line(a.x,a.y,a.x+dx*.13,a.y+dy*.13,8,'#7b8f91');r.line(b.x-dx*.13,b.y-dy*.13,b.x,b.y,8,'#7b8f91');
        centerText(r,'GAP',(a.x+b.x)/2,(a.y+b.y)/2+17,18,'#ebaa8b');
      }else{
        // Texture row y8 is the top contact surface; the girder extends below it.
        const h=16,offset=(32-8)*h/64;
        r.sprite('bridge_deck',(a.x+b.x)/2-Math.sin(angle)*offset,(a.y+b.y)/2+Math.cos(angle)*offset,length,h,angle,'#fff');
        r.line(a.x,a.y,b.x,b.y,1.5,'#e2e4ce');
      }
    });
    s.nodes.forEach(node=>{r.circle(node.x,node.y+7,4,'#c1c6b0');r.circle(node.x,node.y+7,1.7,'#325364');});
  }
  function vehicle(r,s){
    const car=s.car;if(!car||!car.wheels||car.wheels.length<2)return;
    const wheels=car.wheels.slice().sort((a,b)=>a.x-b.x),rear=wheels[0],front=wheels[wheels.length-1];
    const angle=car.angle,scale=Math.hypot(front.x-rear.x,front.y-rear.y)/143;
    const mx=(rear.x+front.x)/2,my=(rear.y+front.y)/2;
    const ox=-3.5*scale,oy=-36*scale;
    r.sprite('shadow',mx,my+car.wheelRadius+7,Math.max(45,car.wheelbase*1.8),19,angle,'#0b223d85');
    r.sprite('bridge_truck',mx+Math.cos(angle)*ox-Math.sin(angle)*oy,my+Math.sin(angle)*ox+Math.cos(angle)*oy,256*scale,128*scale,angle,car.falling?'#e5bca0':'#fff');
    wheels.forEach(wheel=>{
      const size=car.wheelRadius*128/54;
      r.sprite('bridge_wheel',wheel.x,wheel.y,size,size,car.x/Math.max(1,car.wheelRadius),'#fff');
      if(wheel.contact)r.line(wheel.x-3,wheel.y+car.wheelRadius,wheel.x+3,wheel.y+car.wheelRadius,.8,'#c5d8bb');
    });
    centerText(r,Math.round(car.mass)+' kg',mx,my-car.wheelRadius-35,18,'#f8df9d');
  }
  function information(r,s){
    const selected=s.cables.find(c=>c.id===s.selectedId),won=s.phase==='won',lost=s.phase==='lost',ended=won||lost;
    const edit=!ended&&s.mode==='editing',failed=!ended&&s.mode==='test-failed';
    r.rect(28,55,904,30,'#173b48');r.line(28,55,932,55,1,'#527779');
    r.text(won?'PASSED / SAFE CROSSING':lost?'TIME LIMIT / SESSION ENDED':edit?'EDIT / ADD SUPPORT':failed?'FAILED / B TO REBUILD':'LOAD TEST / WATCH CABLES',40,62,18,failed||lost?'#f1ad8a':'#d7edda');
    r.text('LOW',651,64,16,'#98d9c0');r.line(690,73,710,73,3,'#98d9c0');r.text('HIGH',733,64,16,'#eacb83');r.line(782,73,802,73,3,'#eacb83');r.text('LIMIT',825,64,16,'#f09476');r.line(885,73,905,73,3,'#f09476');
    const deflection=Math.max(0,...s.nodes.map(n=>n.y-n.restY))/50;
    r.text('DEFLECTION  '+deflection.toFixed(2)+' m',32,446,18,'#c2dcd9');
    r.text('TESTS  '+s.attempts,811,446,18,'#c2dcd9');
    if(ended){
      r.rect(28,477,904,49,won?'#163f43':'#49383c');r.line(28,477,932,477,1,won?'#719b88':'#b47f69');
      r.text(won?'LOAD TEST PASSED':'TIME LIMIT REACHED',42,483,20,won?'#d5e7ba':'#efbc9b');
      r.text('ENTER RETRY / ARROWS SELECT',42,507,16,'#cddfd2');
      r.text('MATERIAL '+s.spent+'/'+s.budget,666,493,18,'#e4e6c6');
    }else if(failed){
      // Leave the lower gorge visible when the physical truck falls to y500.
      r.rect(281,94,398,54,'#49383ce8');r.line(281,94,679,94,1,'#b47f69');
      const reason=String(s.lastFailure||'');
      centerText(r,reason==='vehicle-fall'?'TRUCK FELL':reason==='bridge-slope'?'EXCESSIVE SLOPE':reason==='bridge-collapse'?'BRIDGE DAMAGED':'STRUCTURE FAILED',480,101,20,'#efbc9b');
      centerText(r,'B RETURN / REBUILD CABLES',480,127,16,'#efdbc3');
    }else if(selected){
      r.rect(28,477,904,49,'#143644');r.line(28,477,932,477,1,'#5e7f7b');
      const i=s.cables.indexOf(selected)+1,ratio=selected.maxTension>0?selected.tension/selected.maxTension:0;
      r.text('CABLE '+i+' / '+(selected.installed?'INSTALLED':'CANDIDATE'),42,483,20,'#e1e8c8');
      r.text('COST '+selected.cost+' PT / '+selected.restLength.toFixed(1)+' m',42,507,16,'#c0dbd6');
      r.text(edit?'A ADD / REMOVE':'TENSION '+Math.round(ratio*100)+'%',394,493,20,edit?'#d7e6cc':stressColor(selected));
      r.text(edit?'B TEST LOAD':'B RETURN',754,493,20,'#e5e7c6');
    }
  }
  root.GameDef={
    id:'tension-span',stylesheet:'game-theme.css',title:'拉索桥梁',tagline:'用有限的材料，托住真正驶过的重量',seed:79,
    accent:'#8bd2eb',background:'#142e3d',levelLabel:'桥段',levelNames:['峡谷初桥','重载高塔','偏塔货运','低塔检修','长跨快运','双岸高差'],atlas,
    description:'六座桥，六种跨度、塔高和载重。方向选索，A搭建，B试载；观察挠度与索力，失败后B返回改建。预算和90秒工期同时约束方案，车辆完全过岸才算成功。',
    controls:{move:'摇杆 / 方向键：选择候选拉索',a:'安装 / 拆除 · 空格 / 右上半屏',b:'试载 / 回编辑 · B / 右下半屏'},
    actionLabels:['安装 / 拆除','试载 / 回编辑'],
    tip:'虚线不承重。索线由青转红表示负荷增大。失败按 B 返工，时间不重置。',
    winTitle:'桥梁稳稳托住了这趟旅程',loseTitle:'这座桥还需要一点调整',
    result(s){return s.phase==='won'?'载重 '+Math.round(s.car.mass)+' 千克的车辆已安全通过，使用材料 '+s.spent+' / '+s.budget+' 点，完成 '+s.attempts+' 次试载。':'本局建造时间已结束。保留思路，重新选择支撑索再试一次。';},
    hud(s){const failed=s.mode==='test-failed',won=s.phase==='won',lost=s.phase==='lost';return[
      {label:'当前模式',value:won?'测试通过':lost?'时间耗尽':s.mode==='editing'?'编辑搭建':failed?'试载失败 · B 返回':'正在试载',tone:lost||(!won&&failed)?'warn':'good'},
      {label:'材料余量',value:s.remainingBudget+' / '+s.budget+' 点',tone:s.remainingBudget<15?'warn':''},
      {label:'试载重量',value:Math.round(s.car.mass)+' kg'},
      {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
    ];},
    render(r,s,t){
      r.text('TENSION SPAN',28,10,23,'#e2ebd8');r.text('ENGINEERING / SECTION '+String(s.level).padStart(2,'0'),29,35,16,'#c0d7d9');
      r.text('SPAN '+((s.nodes.at(-1).x-s.nodes[0].x)/s.pixelScale).toFixed(1)+'m / '+s.car.mass+'kg',650,23,18,'#cfe4ed');
      landscape(r,s,t);cables(r,s,t);panels(r,s);vehicle(r,s);information(r,s);
    }
  };
})(window);
