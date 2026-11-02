/* Firebreak Planner: public terrain, residual heat and completed simultaneous waves. */
(function(root){
'use strict';
function groundArt(c,w,h,a){
  c.fillStyle=a.linear(c,0,0,w,h,[[0,'#b4bb8e'],[.5,'#a4ae7c'],[1,'#8e9a69']]);c.fillRect(0,0,w,h);
  for(let i=0;i<37;i++){const x=(i*37+7)%w,y=(i*53+11)%h;a.ellipse(c,x,y,1+(i%3),.7,i%2?'#c7c59b55':'#637d5650');}
  c.strokeStyle='#d6d0a436';c.lineWidth=1;for(let i=0;i<5;i++){const x=13+i*24,y=24+(i*31)%80;c.beginPath();c.moveTo(x-4,y+4);c.lineTo(x,y-4);c.lineTo(x+3,y+2);c.stroke();}
  a.ellipse(c,w*.72,h*.73,10,5,'#697c5b40');a.path(c,[[w*.65,h*.69],[w*.72,h*.65],[w*.79,h*.69],[w*.77,h*.73],[w*.68,h*.73]],'#c0bc93');
}
function forestFloor(c,w,h,a){
  c.fillStyle=a.linear(c,0,0,w,h,[[0,'#8d9f6f'],[1,'#6d8656']]);c.fillRect(0,0,w,h);
  for(let i=0;i<36;i++){const x=(i*43+9)%w,y=(i*29+17)%h;a.ellipse(c,x,y,1.5,.8,i%2?'#b2ba7c55':'#3e65484f');}
}
function wetArt(c,w,h,a){
  c.fillStyle='#7d9a78';c.fillRect(0,0,w,h);a.path(c,[[0,13],[25,5],[55,13],[85,3],[w,15],[w,h-7],[98,h-2],[64,h-12],[29,h],[0,h-9]],a.linear(c,0,0,w,h,[[0,'#91b8a4'],[.4,'#6b9c94'],[1,'#547f85']]));
  c.strokeStyle='#c3d8bc70';c.lineWidth=2;for(let i=0;i<5;i++){const x=14+(i*23)%83,y=19+i*21;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+9,y+3,x+21,y);c.stroke();}
  for(let i=0;i<8;i++){const x=5+(i*29)%116,y=28+(i*41)%90;c.strokeStyle='#406c59';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-4,y-12,x-3,y-25);c.moveTo(x,y);c.quadraticCurveTo(x+6,y-8,x+8,y-21);c.stroke();}
}
function pineArt(c,w,h,a){
  c.save();c.scale(w/160,h/192);a.ellipse(c,81,171,52,14,'#254b3a45');a.path(c,[[72,103],[87,103],[91,174],[71,174]],a.linear(c,70,0,92,0,[[0,'#6c6246'],[.5,'#b0a078'],[1,'#5c5841']]));
  for(let i=3;i>=0;i--){const y=27+i*27,spread=23+i*11;a.path(c,[[79,y-21],[81-spread*.45,y+9],[81-spread,y+35],[77,y+29],[84+spread,y+35],[87+spread*.4,y+7]],a.linear(c,45,y-20,118,y+32,[[0,'#94ad72'],[.35,'#59805e'],[1,'#315d53']]),'#385f4d',1);a.path(c,[[79,y-18],[74,y+22],[47-i*6,y+30]],'#b1bc7e32');}
  c.restore();
}
function broadArt(c,w,h,a){
  c.save();c.scale(w/160,h/192);a.ellipse(c,81,172,53,14,'#254b3a45');a.path(c,[[74,92],[88,92],[87,174],[72,174]],'#7e7150');a.path(c,[[79,140],[48,104],[54,96],[83,124],[104,94],[113,101],[87,142]],'#887853');
  const blobs=[[45,101,31,32],[106,102,35,33],[78,65,38,40],[42,70,28,30],[112,69,27,29],[77,105,42,34]];
  for(let i=0;i<blobs.length;i++){const [x,y,rx,ry]=blobs[i];a.ellipse(c,x+2,y+4,rx,ry,'#456a43');a.ellipse(c,x,y,rx-2,ry-3,a.radial(c,x-9,y-12,rx+ry*.5,[[0,'#c2c778'],[.45,'#91aa61'],[1,'#587f4c']]));}
  for(let i=0;i<23;i++){const x=35+(i*29)%92,y=39+(i*37)%85;a.ellipse(c,x,y,3,1.5,'#d4d18d36');}c.restore();
}
function villageArt(ruin){return function(c,w,h,a){
  c.save();c.scale(w/160,h/160);a.ellipse(c,82,133,63,17,'#334e3a40');
  for(const [x,y,scale]of[[18,49,1],[83,70,.8]]){c.save();c.translate(x,y);c.scale(scale,scale);
    a.path(c,[[5,30],[51,30],[62,42],[62,91],[5,91]],ruin?'#77715d':a.linear(c,0,30,62,85,[[0,'#f0dfae'],[1,'#b0aa81']]),'#7a7f61',1);
    a.path(c,[[51,30],[62,42],[62,91],[51,85]],ruin?'#484f48':'#9b9f7b');
    a.path(c,ruin?[[0,32],[16,8],[29,16],[38,6],[62,31],[34,38]]:[[0,32],[28,4],[66,32],[36,44]],ruin?'#3d4843':a.linear(c,0,4,50,42,[[0,'#8aa2a0'],[1,'#435f6a']]),'#3e5b5c',2);
    if(!ruin){c.fillStyle='#dad1a4';c.fillRect(45,7,8,17);c.fillStyle='#344e4e';c.fillRect(16,62,14,29);c.fillStyle='#728a82';c.fillRect(39,53,10,14);c.strokeStyle='#e2d7aa';c.lineWidth=2;c.strokeRect(39,53,10,14);}
    else{a.path(c,[[17,49],[34,55],[28,90],[14,90]],'#2f403c');c.strokeStyle='#333e36';c.lineWidth=3;c.beginPath();c.moveTo(47,48);c.lineTo(39,61);c.lineTo(48,73);c.lineTo(42,88);c.stroke();}c.restore();
  }c.restore();
};}
function clearingArt(c,w,h,a){
  c.fillStyle=a.linear(c,0,0,w,h,[[0,'#c5b183'],[1,'#a28f65']]);c.fillRect(0,0,w,h);
  for(let i=0;i<7;i++){c.strokeStyle='#e1c89b4b';c.lineWidth=2;c.beginPath();c.moveTo(0,11+i*18);c.lineTo(w,4+i*18);c.stroke();}
  a.ellipse(c,65,91,35,9,'#796d4c46');a.path(c,[[44,61],[84,61],[89,91],[40,91]],'#806d48');a.ellipse(c,64,61,21,10,'#e3c691');
  c.strokeStyle='#a88b58';c.lineWidth=1.4;for(const k of [6,12,18]){c.beginPath();c.ellipse(64,61,k,k*.43,0,0,Math.PI*2);c.stroke();}c.fillStyle='#6b7556';c.fillRect(93,82,13,4);
}
function charredArt(c,w,h,a){
  c.fillStyle=a.linear(c,0,0,w,h,[[0,'#777c60'],[1,'#4d5c4a']]);c.fillRect(0,0,w,h);
  for(let i=0;i<29;i++)a.ellipse(c,(i*41+9)%w,(i*31+7)%h,2+i%3,1,i%2?'#253f334c':'#9c9d7b42');
  a.path(c,[[52,95],[54,39],[62,29],[67,45],[75,41],[78,96]],'#2e4035');a.path(c,[[58,66],[36,50],[39,43],[64,54],[88,28],[92,36],[70,69]],'#35483b');
  c.strokeStyle='#8c8c6c';c.lineWidth=2;c.beginPath();c.moveTo(57,42);c.lineTo(57,88);c.stroke();
}
function logsArt(c,w,h,a){
  c.save();c.scale(w/128,h/128);a.ellipse(c,65,103,51,13,'#293e315c');
  for(const [x,y,ang]of[[17,71,-.17],[27,43,.18],[43,78,.1]]){c.save();c.translate(x,y);c.rotate(ang);a.path(c,[[0,0],[69,0],[74,26],[2,28]],a.linear(c,0,0,0,28,[[0,'#9b8760'],[.5,'#5e5941'],[1,'#3a4635']]),'#344331',1);a.ellipse(c,5,13,10,14,'#b8a171');a.ellipse(c,5,13,6,9,'#8b7953');c.strokeStyle='#b6a073';c.lineWidth=1;c.beginPath();c.moveTo(18,5);c.lineTo(65,5);c.moveTo(18,14);c.lineTo(66,16);c.stroke();c.restore();}c.restore();
}
function flameArt(c,w,h,a){
  c.save();c.scale(w/96,h/160);a.path(c,[[49,4],[58,43],[78,25],[73,72],[89,91],[82,134],[63,153],[27,150],[8,119],[14,84],[30,61],[28,103],[42,81]],a.linear(c,0,0,0,158,[[0,'#f5d486'],[.4,'#f3a555'],[1,'#cf623e']]));
  a.path(c,[[47,55],[57,93],[69,81],[66,120],[55,144],[32,140],[23,121],[30,102],[38,118]],a.linear(c,0,65,0,145,[[0,'#f9e8b7'],[1,'#f8c56e']]));c.restore();
}
function smokeArt(c,w,h,a){
  for(const [x,y,rx,ry]of[[.48,.7,.28,.24],[.34,.45,.26,.25],[.59,.25,.31,.24]])a.ellipse(c,w*x,h*y,w*rx,h*ry,a.radial(c,w*x,h*y,Math.max(w*rx,h*ry),[[0,'#d0c6a45c'],[.7,'#9b9c8350'],[1,'#9b9c8300']]));
}
const atlas={builtins:[],tiles:[
  {name:'firebreak_ground',x:0,y:0,w:128,h:128,paint:groundArt},{name:'firebreak_wetland',x:128,y:0,w:128,h:128,paint:wetArt},
  {name:'firebreak_pine',x:256,y:0,w:160,h:192,paint:pineArt},{name:'firebreak_broad',x:416,y:0,w:160,h:192,paint:broadArt},
  {name:'firebreak_village',x:576,y:0,w:160,h:160,paint:villageArt(false)},
  {name:'firebreak_cleared',x:0,y:128,w:128,h:128,paint:clearingArt},{name:'firebreak_burnt',x:128,y:128,w:128,h:128,paint:charredArt},
  {name:'firebreak_logs',x:0,y:256,w:128,h:128,paint:logsArt},{name:'firebreak_flame',x:256,y:192,w:96,h:160,paint:flameArt},
  {name:'firebreak_smoke',x:352,y:192,w:96,h:128,paint:smokeArt},{name:'firebreak_forest',x:448,y:192,w:128,h:128,paint:forestFloor},
  {name:'firebreak_ruin',x:0,y:800,w:160,h:160,paint:villageArt(true)}
]};
const INK='#294735',PAPER='#ece7c8',MUTED='#b9c39d',ORANGE='#f1b473',RED='#ed9370';
const WIND={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]};
function center(r,t,x,y,size,color){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function outline(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function arrow(r,dir,x,y,length,color,width=3){if(!dir)return;const [dx,dy]=WIND[dir],x1=x-dx*length*.5,y1=y-dy*length*.5,x2=x+dx*length*.5,y2=y+dy*length*.5;r.line(x1,y1,x2,y2,width,color);r.line(x2,y2,x2-dx*length*.3-dy*length*.22,y2-dy*length*.3+dx*length*.22,width,color);r.line(x2,y2,x2-dx*length*.3+dy*length*.22,y2-dy*length*.3-dx*length*.22,width,color);}
function board(r,s){
  const size=48,gx=52,gy=288-s.rows*size/2;r.rect(gx-7,gy-7,s.columns*size+14,s.rows*size+14,'#6f7958');
  for(let col=0;col<s.columns;col++)center(r,String(col+1),gx+(col+.5)*size,gy-19,13,INK);
  for(let row=0;row<s.rows;row++)center(r,String(row+1),31,gy+(row+.5)*size-7,13,INK);
  for(const c of s.cells){const x=gx+(c.column+.5)*size,y=gy+(c.row+.5)*size;
    const tile=c.terrain==='wetland'?'wetland':c.status==='cleared'?'cleared':c.status==='burnt'?'burnt':c.terrain==='forest'?'forest':'ground';r.sprite('firebreak_'+tile,x,y,size,size,0,'#fff');
    outline(r,x-size/2,y-size/2,size,size,'#677c5666',.7);
    if(c.terrain==='forest'&&(c.status==='standing'||c.status==='burning')){
      if(c.initialFuel>s.physics.ordinaryFuel)r.sprite('firebreak_logs',x,y+4,44,40,0,'#fff');
      else r.sprite('firebreak_'+((c.row+c.column)%2?'pine':'broad'),x,y-1,43,47,0,c.status==='burning'?'#a99463':'#fff');
    }
    if(c.terrain==='village')r.sprite('firebreak_'+(c.status==='destroyed'?'ruin':'village'),x,y-1,43,43,0,'#fff');
    if(c.status==='burning'){
      r.sprite('firebreak_flame',x+Math.sin(s.elapsed*2+c.row)*2,y-4,22,36,Math.sin(s.elapsed*2.4+c.column)*.06,'#fff');
      r.sprite('firebreak_smoke',x+Math.sin(s.elapsed*.7+c.row)*3,y-12,18,20,0,'#fff');
      if(!s.viewHeat){r.rect(x+1,y+3,22,18,'#304332db');center(r,String(c.fuelRemaining),x+12,y+4,16,PAPER);}
    }else if(c.heat>0&&!s.viewHeat)outline(r,x-20,y-20,40,40,ORANGE,1.5);
    if(s.viewHeat){r.rect(x-23,y-23,46,46,c.heat>0?'#714b2b53':'#203d353a');r.circle(x,y,13,'#203d35d9');center(r,String(c.heat),x,y-10,20,c.heat>=s.physics.ignitionHeat?RED:c.heat>0?ORANGE:PAPER);}
  }
  const selected=s.cells[s.cursor.row*s.columns+s.cursor.column],x=gx+selected.column*size,y=gy+selected.row*size;outline(r,x+1,y+1,size-2,size-2,'#fff0bd',2.6);
}
function weather(r,s){
  r.rect(520,64,412,111,'#3a5840');const playing=s.phase==='playing',dir=playing?s.nextWind:s.lastWind;
  r.text(playing?'NEXT FIRE STEP':'FINAL FIRE STATE',535,76,15,PAPER);arrow(r,dir,575,122,38,ORANGE,4);r.text(dir||'NONE',614,107,26,PAPER);
  r.text(playing?'IN '+Math.max(0,s.secondsToFireStep).toFixed(1)+' s':'WAVES '+s.fireStep,711,110,21,PAPER);
  r.text('LAST WAVE '+s.fireStep+' / '+(s.lastWind||'NONE'),535,151,14,MUTED);
  r.rect(520,185,412,65,'#d4d4ac');const next=s.phase==='playing'?s.fireStep+1:s.fireStep;
  s.weather.forEach((w,i)=>{const x=520+i*103,end=s.weather[i+1]?.from,active=next>=w.from&&(!end||next<end);if(active)r.rect(x+3,188,97,59,'#b0bf8b');center(r,String(w.from)+(end?'-'+(end-1):'+'),x+51.5,197,15,INK);arrow(r,w.direction,x+28,230,19,INK,2.5);r.text(w.direction,x+49,221,17,INK);});
}
function ledger(r,s){
  r.rect(520,262,260,80,'#3a5840');r.text('STANDING / MINIMUM',535,273,15,MUTED);r.text(s.forest.standing+' / '+s.forest.minimum,535,296,25,s.forest.standing<s.forest.minimum?RED:PAPER);
  r.text('INITIAL '+s.forest.initial+' / CUT '+s.forest.cleared,535,326,13,MUTED);
  r.rect(792,262,140,80,'#3a5840');center(r,'VILLAGES',862,273,14,MUTED);center(r,s.villages.intact+' / '+s.villages.initial,862,300,25,s.villages.destroyed?RED:PAPER);
}
function selection(r,s){
  const c=s.cells[s.cursor.row*s.columns+s.cursor.column],coarse=c.terrain==='forest'&&c.initialFuel>s.physics.ordinaryFuel;
  r.rect(520,354,412,150,'#e0ddbb');r.text(c.id+' / ROW '+(c.row+1)+' COL '+(c.column+1),535,367,16,INK);
  const label=c.terrain==='forest'?(c.status==='standing'?'STANDING FOREST':c.status==='burning'?(coarse?'BURNING COARSE TIMBER':'BURNING FOREST'):c.status==='cleared'?'CLEARED / FOREST LOST':'BURNT / FOREST LOST'):c.terrain==='village'?(c.status==='destroyed'?'VILLAGE DESTROYED':'INTACT VILLAGE'):c.terrain==='wetland'?'WETLAND / BLOCKS FIRE':'NATURAL GROUND / BLOCKS FIRE';
  r.text(label,535,393,17,INK);r.text('HEAT '+c.heat+' / '+s.physics.ignitionHeat,535,421,19,INK);
  r.text(c.terrain==='forest'?'FUEL '+c.fuelRemaining+' / '+c.initialFuel:'FUEL 0',739,421,18,INK);
  let action;if(s.phase!=='playing')action=s.phase==='won'?'FIRE OUT / PROTECTION MET':'ROUND ENDED';else if(c.terrain!=='forest'||c.status!=='standing')action='A: ONLY STANDING FOREST CAN BE CLEARED';else if(!s.ap.remaining)action='A: NO ACTION POINTS';else action='A: CLEAR / 1 AP / 1 FOREST LOST';
  r.text(action,535,454,13,INK);const view=s.phase!=='playing'?(s.viewHeat?'VIEW: CURRENT HEAT':'VIEW: TERRAIN / FIRE NUMBERS = FUEL'):s.viewHeat?'B: SHOW TERRAIN / NUMBERS = HEAT':'B: SHOW HEAT / FIRE NUMBERS = FUEL';r.text(view,535,480,13,INK);
}
root.GameDef={
  id:'firebreak-planner',title:'防火带',tagline:'看风清林，守住村落与森林底线',seed:491,accent:'#b8cb91',background:'#c5c6a3',levelLabel:'林区',levelNames:['山口','双村','湿地'],atlas,
  description:'方向选格，A 花1点清理未燃林木，B 切换当前热量显示。火按固定风向同时传播，空地和湿地阻火。守住所有村落与存活森林底线；清理的树也算损失。',
  controls:{move:'方向键 / 摇杆 · 选格',a:'清理 / 空格',b:'地形·热量 / B'},actionLabels:['清理','地形/热量'],tip:'清理也扣存活林木。热量不会冷却；B 只切显示，不停火。',winTitle:'防火任务完成',loseTitle:'防线未守住',
  result(s){if(s.phase==='won')return '火已熄灭，村落与森林保留达标。';return {village:'火烧入村落。提前清理传播通路。',forest:'存活森林低于底线，清理也会计入损失。',timeout:'时间已到，火势仍未熄灭。'}[s.lostReason]||'防火任务未完成。';},
  hud(s){return[{label:'村落',value:s.villages.intact+'/'+s.villages.initial,tone:s.villages.destroyed?'warn':''},{label:'森林 / 底线',value:s.forest.standing+' / '+s.forest.minimum,tone:s.forest.standing<=s.forest.minimum?'warn':''},{label:'行动点',value:s.ap.remaining+'/'+s.ap.initial,tone:!s.ap.remaining?'warn':''},{label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}];},
  render(r,s){r.rect(0,0,960,540,'#c5c6a3');r.rect(0,0,960,49,'#314c38');r.text('FIREBREAK PLANNER',25,12,24,PAPER);const top=s.phase==='won'?'FOREST PROTECTED':s.phase==='lost'?'PROTECTION FAILED':s.viewHeat?'CURRENT HEAT MAP':'TERRAIN / ACTIVE FIRE';r.text(top,932-r.measureText(top,13),23,13,MUTED);board(r,s);weather(r,s);ledger(r,s);selection(r,s);r.rect(28,514,904,23,'#314c38');const footer=s.phase==='won'?'FIRE EXTINGUISHED / ALL VILLAGES SAFE':s.phase==='lost'?(s.lostReason==='village'?'VILLAGE DESTROYED':s.lostReason==='forest'?'STANDING FOREST BELOW MINIMUM':'TIME LIMIT REACHED'):'A CLEAR / B VIEW / CLEARED TREES ALSO COUNT AS LOSS';r.text(footer,39,520,13,PAPER);const ap='AP '+s.ap.remaining+'/'+s.ap.initial;r.text(ap,918-r.measureText(ap,17),517,17,PAPER);}
};
})(window);
