/* Switchyard Minute: a small model railway, drawn from the simulation's actual track points. */
(function(root){
  'use strict';
  const COLORS={red:'#f2a292',green:'#9dd4b3',blue:'#95bce9'};
  const NAMES={red:'RED',green:'GREEN',blue:'BLUE'};
  const color=c=>COLORS[c]||'#c7dedc';
  const waitingAt=(s,gate)=>gate.queue.map(id=>s.trains.find(train=>train.id===id)).filter(train=>train&&train.status==='waiting');
  function centered(r,text,x,y,size,tint){r.text(text,x-r.measureText(text,size)/2,y,size,tint);}
  function railPoints(edge){return edge.points||[{x:edge.x1,y:edge.y1},{x:edge.x2,y:edge.y2}];}
  function segments(edge,draw){const points=railPoints(edge);for(let i=1;i<points.length;i++)draw(points[i-1],points[i]);}
  function atDistance(edge,distance){
    const points=railPoints(edge);
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
      if(distance<=len||i===points.length-1){const f=Math.min(1,distance/Math.max(.001,len));return{x:a.x+dx*f,y:a.y+dy*f,angle:Math.atan2(dy,dx)};}
      distance-=len;
    }
    return{x:points[0].x,y:points[0].y,angle:0};
  }
  function selectedMarker(r,x,y,t){
    const size=27,reach=9,c='#e5efaa';
    r.sprite('glow',x,y,88,88,0,'#c5ed7840');
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{
      r.line(x+sx*size,y+sy*size,x+sx*(size-reach),y+sy*size,2,c);
      r.line(x+sx*size,y+sy*size,x+sx*size,y+sy*(size-reach),2,c);
    });
    r.circle(x+29,y-29,2.2+Math.sin(t*4)*.3,c);
  }
  function bench(r){
    r.rect(20,53,920,427,'#0d2027');r.rect(20,49,920,427,'#405554');r.rect(22,51,916,422,'#1e3639');
    r.rect(26,55,908,414,'#233b3e');r.line(26,55,934,55,1,'#6c8277');
    r.sprite('glow',300,260,800,510,0,'#24474c');r.sprite('glow',800,230,600,430,0,'#38483e');
    // Sparse grass and survey marks provide scale without covering the railway.
    for(let i=0;i<64;i++){
      const x=42+(i*137)%876,y=69+(i*83)%383;
      r.circle(x,y,i%4===0?1.5:.8,i%3===0?'#44605b':'#314e4c');
    }
    for(let x=42;x<926;x+=24){r.line(x,61,x+9,61,1,'#50665f');r.line(x,462,x+9,462,1,'#50665f');}
    [[33,62],[927,62],[33,462],[927,462]].forEach(([x,y])=>{r.circle(x,y,3,'#657a70');r.line(x-1.6,y,x+1.6,y,1,'#1a3035');});
    r.text('CONTROLLED RAILWAY / KEEP JUNCTION CLEAR',45,77,9,'#73938a');
  }
  function tracks(r,s){
    s.edges.forEach(edge=>segments(edge,(a,b)=>{
      r.line(a.x,a.y+3,b.x,b.y+3,34,'#172b30');r.line(a.x,a.y,b.x,b.y,28,'#46534f');r.line(a.x,a.y,b.x,b.y,23,'#55605a');
    }));
    s.edges.forEach(edge=>{
      for(let d=7;d<edge.length;d+=13){
        const p=atDistance(edge,d),nx=-Math.sin(p.angle)*15,ny=Math.cos(p.angle)*15;
        r.line(p.x-nx,p.y-ny,p.x+nx,p.y+ny,5,'#263c3c');r.line(p.x-nx,p.y-ny-1,p.x+nx,p.y+ny-1,2,'#778075');
      }
    });
    s.edges.forEach(edge=>segments(edge,(a,b)=>{
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=-dy/len*7,ny=dx/len*7;
      [-1,1].forEach(side=>{
        r.line(a.x+nx*side,a.y+ny*side,b.x+nx*side,b.y+ny*side,3.2,'#1d3339');
        r.line(a.x+nx*side,a.y+ny*side-1,b.x+nx*side,b.y+ny*side-1,1.5,'#bfcbc4');
      });
    }));
    s.switches.forEach(sw=>{
      const to=sw.outputs[sw.route],edge=s.edges.find(e=>e.from===sw.id&&e.to===to);
      if(edge){const first=atDistance(edge,Math.min(47,edge.length));r.line(sw.x,sw.y,first.x,first.y,3,'#e2dca2');}
    });
  }
  function platform(r,node,s){
    const c=color(node.color),x=node.x,y=node.y,houseY=y+(node.color==='red'?20:0);
    r.rect(x-18,y-22,112,49,'#142d34');r.rect(x-18,y-26,112,47,'#61716c');r.rect(x-16,y-24,108,42,'#a4afa0');
    r.rect(x-13,y+12,102,4,c);r.line(x+4,y-14,x+4,y+10,4,'#263f45');
    r.line(x-3,y-12,x+11,y-12,4,'#d1d3ba');r.line(x-3,y+9,x+11,y+9,4,'#d1d3ba');
    r.rect(x+21,houseY-39,63,31,'#3c5860');r.rect(x+24,houseY-36,57,26,'#a3c3c1');
    r.rect(x+17,houseY-44,71,9,'#315058');r.line(x+17,houseY-44,x+88,houseY-44,2,'#a2bdba');
    r.rect(x+30,houseY-30,13,16,'#30576a');r.rect(x+50,houseY-30,24,12,'#34566a');r.rect(x+52,houseY-28,20,3,'#8bced5');
    centered(r,NAMES[node.color]||'DEPOT',x+(node.color==='blue'?16:56),node.color==='red'?y+32:y-61,11,c);
    const arrived=s.trains.filter(t=>t.destination===node.id&&t.status==='arrived').length;
    centered(r,String(arrived),x-8,y-17,9,'#304b50');
  }
  function signal(r,x,y,green){
    r.line(x,y+12,x,y-14,3,'#9bb4ad');r.rect(x-6,y-29,12,23,'#112b35');r.rect(x-4,y-27,8,19,'#2c454b');
    r.circle(x,y-21,2.5,green?'#405851':'#e59078');r.circle(x,y-13,2.5,green?'#b5e7af':'#405851');
    if(green)r.sprite('glow',x,y-13,21,21,0,'#bbf7a375');
  }
  function equipment(r,s,t){
    s.switches.forEach((sw,i)=>{
      r.circle(sw.x,sw.y,19,'#19333b');r.circle(sw.x,sw.y,16,'#6b7b72');r.circle(sw.x,sw.y,13,'#334d50');
      const edge=s.edges.find(e=>e.from===sw.id&&e.to===sw.outputs[sw.route]);
      if(edge){const p=atDistance(edge,17);r.line(sw.x,sw.y,p.x,p.y,4,'#eee2aa');}
      r.circle(sw.x,sw.y,4,'#c9d7c6');
      signal(r,sw.x-28,sw.y-4,!sw.locked);
      r.text('S'+(i+1),sw.x+21,sw.y-24,11,'#c8dacb');
      if(sw.locked){r.text('LOCK',sw.x+21,sw.y-9,8,'#ebbe91');r.sprite('ring',sw.x,sw.y,46,46,0,'#e5b476');}
      if(sw.id===s.selectedId)selectedMarker(r,sw.x,sw.y,t);
    });
    s.gates.forEach((gate,index)=>{
      const west=gate.x<480,left=west?43:765,queue=waitingAt(s,gate);
      signal(r,gate.x+(west?-30:30),gate.y-8,!gate.blocked&&!queue.length);
      centered(r,west?'WEST GATE':'EAST GATE',gate.x,gate.y+32,12,'#d4dfce');
      r.rect(left,gate.y+58,150,66,'#163139');r.line(left,gate.y+58,left+150,gate.y+58,1,'#5f7c73');
      r.text('WAITING  '+queue.length,left+10,gate.y+68,10,queue.length?'#e7d39b':'#8bada4');
      if(queue.length){
        queue.slice(0,4).forEach((train,j)=>{r.sprite('freight',left+27+j*32,gate.y+100,37,25,0,color(train.color));centered(r,(j+1).toString(),left+27+j*32,gate.y+112,8,'#c4d8c9');});
      } else r.text('CLEAR TO RECEIVE',left+10,gate.y+99,9,'#6d958d');
      if(gate.id===s.selectedId)selectedMarker(r,gate.x,gate.y,t);
    });
  }
  function trains(r,s,t){
    s.trains.forEach(train=>{
      if(train.status!=='moving'&&train.status!=='waiting')return;
      const gate=s.gates.find(g=>g.id===train.gateId);
      if(train.status==='waiting'&&gate&&gate.queue[0]!==train.id)return;
      const x=train.x,y=train.y,a=train.angle||0,c=color(train.color),moving=train.status==='moving';
      if(moving)r.sprite('glow',x+Math.cos(a)*25,y+Math.sin(a)*25,35,24,a,'#fff0ae28');
      // Atlas body vertices fit a radius of 101px; keep the body inside the collision circle.
      const spriteWidth=(train.length||s.trainLength||28)*224/202;
      r.sprite('locomotive',x,y,spriteWidth,spriteWidth*128/224,a,c);
      r.circle(x-Math.cos(a)*7,y-Math.sin(a)*7-3,2,c);
      centered(r,NAMES[train.color]||'FREIGHT',x,y-27,8.5,c);
      if(!moving){r.text('B',x+22,y-16,10,'#e8e6b0');}
    });
  }
  function controlStrip(r,s){
    const selected=s.switches.concat(s.gates).find(item=>item.id===s.selectedId),isSwitch=selected&&s.switches.some(sw=>sw.id===selected.id);
    r.rect(26,487,908,39,'#142d36');r.line(26,487,934,487,1,'#57766d');
    r.text('SELECTED',39,497,8,'#8caaa1');
    let name='WEST GATE',status='B  RELEASE FIRST TRAIN';
    if(selected){
      if(isSwitch){name='SWITCH '+(s.switches.indexOf(selected)+1);const target=selected.outputs[selected.route];status=selected.locked?'OCCUPIED - ROUTE LOCKED':'A  SWITCH ROUTE';r.text('TO '+(target.indexOf('blue')>=0?'BLUE':target.indexOf('red')>=0?'RED':target.indexOf('green')>=0?'GREEN':'COLOUR FORK'),352,501,11,'#c3d6bf');}
      else{name=selected.x<480?'WEST GATE':'EAST GATE';status=selected.blocked?'WAIT FOR EXIT CLEAR':'B  RELEASE FIRST TRAIN';r.text('WAITING  '+waitingAt(s,selected).length,352,501,11,'#c3d6bf');}
    }
    r.text(name,106,498,15,'#edf1cb');r.text(status,588,501,11,selected&&selected.locked?'#ecc39a':'#aed3bc');
  }
  root.GameDef={
    id:'switchyard-minute',title:'分岔调度',tagline:'一次正确的分岔，让每一班货车准点抵达',seed:43,
    accent:'#d2e4a2',background:'#14282f',levelLabel:'班次',levelNames:['晨班','交会','高峰'],
    description:'方向键选择道岔或等待区。先用 A 切换道岔，再选择入口按 B 放行队首列车，把红、绿、蓝货车送到同色站台。列车占用道岔时不能改道，两侧来车要错开放行。全部班次安全到站即可完成；误站、碰撞或累计延误过多都会失败。',
    controls:{move:'摇杆 / 方向键：选择道岔或等待区',a:'切换道岔 · 空格 / 右上半屏',b:'放行队首 · B / 右下半屏'},
    actionLabels:['切换道岔','放行列车'],
    tip:'先设路线再放行：主道岔上行前往红绿分岔，下行直达蓝站。A 只切换未占用道岔；B 放行选中等待区的第一辆车。留意累计延误。',
    winTitle:'全班列车，平安抵达',loseTitle:'这次调度还差一点',
    result(s){return s.phase==='won'?'本班 '+s.deliveries+' 趟列车全部正确到站，用时 '+s.elapsed.toFixed(1)+' 秒，累计延误 '+Math.ceil(s.delay)+' 秒。用左右键选择下一班次。':(s.message||'调整进站次序，再尝试一次。')+' 已安全到站 '+s.deliveries+' / '+s.target+' 趟。';},
    hud(s){const selected=s.switches.concat(s.gates).find(x=>x.id===s.selectedId);return[
      {label:'安全到站',value:s.deliveries+' / '+s.target,tone:'good'},
      {label:'班次剩余',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''},
      {label:'累计延误',value:Math.ceil(s.delay)+' / '+s.delayLimit+' s',tone:s.delay>s.delayLimit*.65?'warn':''},
      {label:'选中控制',value:selected?(selected.name||selected.id):'—',tone:selected&&selected.locked?'warn':''}
    ];},
    render(r,s,t){
      r.text('SWITCHYARD MINUTE',27,16,17,'#e2ebd6');r.text('MODEL RAILWAY / DISPATCH '+String(s.level).padStart(2,'0'),28,37,9,'#8daca2');
      const next=s.trains.filter(tr=>tr.status==='scheduled').sort((a,b)=>a.readyAt-b.readyAt)[0];
      r.text(next?'NEXT  '+(NAMES[next.color]||'TRAIN')+'  IN '+Math.max(0,Math.ceil(next.readyAt-s.elapsed))+'s':'ALL TRAINS IN SERVICE',702,23,11,next?color(next.color):'#9ebba7');
      bench(r);tracks(r,s);s.nodes.filter(n=>n.type==='platform').forEach(n=>platform(r,n,s));equipment(r,s,t);trains(r,s,t);controlStrip(r,s);
    }
  };
})(window);
