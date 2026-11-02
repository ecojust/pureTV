/* Assembly Kitchen: committed single-item locations and exact public temperatures. */
(function(root){
'use strict';
/* Assembly Kitchen: original one-time painters; no model or dynamic state. */
function kitchenRound(c,x,y,w,h,r,fill,stroke,width){
  c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width||1;c.stroke();}
}
function kitchenCook(c,w,h,a){
  c.save();c.scale(w/256,h/192);a.ellipse(c,127,171,109,15,'#405a5c30');
  a.path(c,[[16,122],[227,122],[245,140],[238,170],[22,170],[9,143]],a.linear(c,0,120,0,172,[[0,'#f0eee1'],[.24,'#a9b6b2'],[.8,'#718789'],[1,'#415d64']]),'#607878',1.5);
  a.path(c,[[16,122],[227,122],[245,140],[9,140]],a.linear(c,15,120,233,143,[[0,'#eef3e9'],[.6,'#b9c9c1'],[1,'#e1e8d8']]));
  a.ellipse(c,128,127,78,18,'#445e63');a.ellipse(c,128,126,67,13,'#8aaba4');a.ellipse(c,128,126,57,10,'#263f49');
  kitchenRound(c,51,150,86,8,3,'#d8ded0');for(let i=0;i<6;i++)kitchenRound(c,59+i*11,151,4,6,1,'#607c7b');a.ellipse(c,197,153,12,9,'#354f59');a.ellipse(c,195,151,8,6,'#ccdabf');c.fillStyle='#617d78';c.fillRect(194,146,2,7);
  kitchenRound(c,28,73,24,17,7,'#263f4a','#6f8e90',2);kitchenRound(c,204,73,24,17,7,'#263f4a','#6f8e90',2);
  a.path(c,[[48,65],[208,65],[203,116],[189,130],[67,130],[52,116]],a.linear(c,42,50,211,127,[[0,'#315564'],[.19,'#668a94'],[.42,'#416c7c'],[.76,'#244955'],[1,'#183947']]),'#233e48',2);
  a.path(c,[[59,75],[76,78],[77,117],[65,113]],'#9ab7ba51');a.path(c,[[183,77],[195,74],[192,113],[182,121]],'#172f3d60');
  a.ellipse(c,128,65,80,24,'#becfc7');a.ellipse(c,128,64,74,19,'#1a3742');a.ellipse(c,128,68,66,12,'#2c4e57');c.strokeStyle='#edf2df90';c.lineWidth=2;c.beginPath();c.ellipse(128,64,77,22,0,Math.PI,Math.PI*2);c.stroke();
  for(const x of[63,193])a.ellipse(c,x,80,3,3,'#d2d8c1');c.restore();
}
function kitchenCool(c,w,h,a){
  c.save();c.scale(w/256,h/192);a.ellipse(c,127,170,108,14,'#405a5c2e');
  kitchenRound(c,16,23,224,109,14,a.linear(c,0,23,0,133,[[0,'#d9e6d8'],[.35,'#a8c6bc'],[1,'#6c9f9b']]),'#6a9190',2);
  kitchenRound(c,27,35,202,81,8,'#bcd7c9','#e4eee0',2);for(let i=0;i<9;i++){c.strokeStyle=i%2?'#88b2a370':'#e9f4e870';c.lineWidth=2;c.beginPath();c.moveTo(40+i*20,43);c.lineTo(40+i*20,107);c.stroke();}
  a.ellipse(c,128,74,34,34,'#719c96');a.ellipse(c,128,74,28,28,'#416c70');a.ellipse(c,128,74,24,24,'#57858a');
  a.path(c,[[20,118],[236,118],[246,138],[235,169],[22,169],[10,139]],a.linear(c,0,116,0,172,[[0,'#eff0de'],[.35,'#d7decf'],[1,'#6d9391']]),'#789a94',1.5);
  a.path(c,[[24,119],[233,119],[240,139],[16,139]],'#cedcd2');for(let i=0;i<12;i++){c.strokeStyle='#6a9694';c.lineWidth=3;c.beginPath();c.moveTo(30+i*17,122);c.lineTo(25+i*17,138);c.stroke();}
  kitchenRound(c,28,151,181,6,2,'#94b2a7');a.ellipse(c,224,153,5,5,'#3b6b6d');c.restore();
}
function kitchenPack(c,w,h,a){
  c.save();c.scale(w/256,h/192);a.ellipse(c,127,172,110,14,'#405a5c2e');
  a.path(c,[[21,37],[40,30],[48,143],[27,151]],a.linear(c,19,0,48,0,[[0,'#8f9c96'],[.4,'#e2e6d4'],[1,'#8eaaa2']]));a.path(c,[[213,30],[234,37],[227,152],[208,143]],'#809c96');
  kitchenRound(c,19,20,216,31,9,a.linear(c,0,20,0,52,[[0,'#f5d3b1'],[.5,'#e3a582'],[1,'#bf8066']]),'#a77966',1.5);kitchenRound(c,65,30,124,11,4,'#f1d6b9');for(let i=0;i<6;i++)c.fillRect(72+i*19,33,10,3);
  a.path(c,[[49,64],[206,64],[199,86],[58,86]],a.linear(c,0,64,0,86,[[0,'#b9c7bc'],[1,'#5d7977']]),'#6d8983',1);for(let i=0;i<12;i++){c.fillStyle='#d6dec9';c.fillRect(62+i*11,69,5,7);}
  a.path(c,[[15,128],[235,128],[247,145],[237,172],[20,172],[8,145]],a.linear(c,0,130,0,173,[[0,'#e6e6d5'],[.5,'#aebdb1'],[1,'#657e7b']]),'#738b84',1.5);
  a.path(c,[[25,129],[225,129],[232,148],[19,148]],'#3d5d63');for(let i=0;i<11;i++){c.strokeStyle='#708b87';c.lineWidth=2;c.beginPath();c.moveTo(31+i*18,132);c.lineTo(27+i*18,146);c.stroke();}
  for(const x of[33,224]){a.ellipse(c,x,35,3,3,'#725e51');a.ellipse(c,x,157,4,4,'#dce1ce');}c.restore();
}
function kitchenTray(c,w,h,a){
  c.save();c.scale(w/192,h/96);a.ellipse(c,96,72,87,12,'#475f5c24');a.path(c,[[13,25],[178,25],[187,64],[173,79],[19,79],[5,64]],a.linear(c,0,21,0,80,[[0,'#fdf5df'],[.4,'#d9d7bd'],[1,'#899f94']]),'#9daa9c',1.5);a.path(c,[[22,30],[169,30],[177,61],[166,68],[27,68],[15,61]],'#efecda','#fff9e9',2);c.restore();
}
function kitchenBox(sealed){return function(c,w,h,a){
  c.save();c.scale(w/128,h/112);a.ellipse(c,65,94,54,10,'#4c5b4633');a.path(c,[[15,38],[66,27],[114,42],[107,84],[62,101],[21,82]],a.linear(c,14,30,115,99,[[0,'#edcb92'],[.46,'#d6ad72'],[1,'#a78153']]),'#a17a4b',1.5);
  a.path(c,[[15,38],[64,55],[62,101],[21,82]],'#e7c289');a.path(c,[[64,55],[114,42],[107,84],[62,101]],'#bd945d');
  if(sealed){a.path(c,[[15,38],[66,27],[114,42],[64,55]],a.linear(c,15,20,114,56,[[0,'#fff0ca'],[1,'#d2ad75']]),'#e7c994',1.5);a.path(c,[[47,31],[57,29],[105,45],[94,48]],'#f6e9cb');a.path(c,[[78,61],[100,55],[98,72],[77,79]],'#fff1d0');a.path(c,[[82,66],[87,69],[96,59],[99,62],[87,75],[80,69]],'#557f6a');}
  else{a.path(c,[[20,39],[66,31],[108,43],[64,53]],'#947549');a.path(c,[[15,38],[1,24],[49,12],[66,27]],'#f5d4a0','#c7a370',1);a.path(c,[[66,27],[85,12],[125,28],[114,42]],'#e6bf85','#b78c58',1);a.path(c,[[15,38],[64,55],[55,70],[5,51]],'#f7d9a6');a.path(c,[[64,55],[114,42],[126,56],[76,71]],'#dbb279');}
  c.restore();
};}
function kitchenFood(kind){return function(c,w,h,a){
  c.save();c.scale(w/96,h/96);a.ellipse(c,49,80,41,9,'#4b64523d');a.path(c,[[10,39],[86,39],[79,74],[65,82],[30,82],[17,73]],a.linear(c,0,37,0,82,[[0,'#fff9e4'],[.35,'#e7dfc3'],[1,'#a5b9a9']]),'#94a99c',1);a.ellipse(c,48,39,39,18,'#fff6dd');
  const colors={custard:['#f6df91','#d9ac58'],'tomato-soup':['#da7051','#a94d39'],compote:['#c98c73','#956055'],'pumpkin-soup':['#eda962','#c37843'],stew:['#bf9a69','#8e744e'],'bean-soup':['#b08b6b','#7e614d']}[kind];
  a.ellipse(c,48,40,34,13,a.radial(c,40,36,42,[[0,colors[0]],[1,colors[1]]]));
  if(kind==='custard'){a.ellipse(c,48,40,26,10,'#f5df96');for(const [x,y]of[[39,36],[52,40],[59,35]])a.path(c,[[x-4,y],[x+4,y-2],[x+5,y],[x-3,y+2]],'#5d8960');a.ellipse(c,34,40,6,2,'#fff0bb70');}
  else if(kind==='compote'){for(const [x,y,fill]of[[29,38,'#e4b178'],[48,44,'#d5a071'],[64,37,'#b36158'],[47,33,'#e8bf87']])a.path(c,[[x-6,y-3],[x+4,y-4],[x+7,y+2],[x,y+5],[x-6,y+2]],fill,'#825d4945',.7);}
  else if(kind==='stew'){for(let i=0;i<8;i++){const x=26+(i*19)%43,y=33+(i*7)%14;a.path(c,[[x-4,y-3],[x+4,y-3],[x+5,y+3],[x-3,y+4]],i%3===0?'#df945c':i%3===1?'#809864':'#e4c38c');}}
  else if(kind==='bean-soup'){for(let i=0;i<10;i++){const x=24+(i*17)%48,y=33+(i*5)%14;c.save();c.translate(x,y);c.rotate((i%3-1)*.4);a.ellipse(c,0,0,5,2.6,i%2?'#d4b28a':'#995f4d');c.restore();}}
  else{c.strokeStyle=kind==='tomato-soup'?'#e9b38a':'#ffe2a5';c.lineWidth=1.8;c.beginPath();c.ellipse(48,40,21,6,-.05,0,Math.PI*1.6);c.stroke();for(const [x,y]of[[40,34],[54,43],[58,35]])a.ellipse(c,x,y,4,1.5,'#67835c');}
  c.strokeStyle='#fff9e49c';c.lineWidth=2;c.beginPath();c.ellipse(48,38,36,15,0,Math.PI,Math.PI*1.87);c.stroke();c.restore();
};}
function kitchenFan(c,w,h,a){
  c.save();c.translate(w/2,h/2);c.scale(w/96,h/96);for(let i=0;i<3;i++){c.save();c.rotate(i*Math.PI*2/3);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-22,-8,-20,-34,-3,-34);c.bezierCurveTo(16,-34,20,-14,0,0);c.closePath();c.fillStyle=a.linear(c,-18,-32,7,0,[[0,'#d0e8d7'],[1,'#739f99']]);c.fill();c.restore();}a.ellipse(c,0,0,9,9,'#e4ecce');a.ellipse(c,-2,-2,4,4,'#fff9e3');c.restore();
}
function kitchenSteam(c,w,h,a){
  for(const [x,y,rx,ry]of[[.43,.79,.21,.16],[.57,.58,.25,.18],[.39,.37,.22,.19],[.52,.16,.28,.14]])a.ellipse(c,w*x,h*y,w*rx,h*ry,a.radial(c,w*x,h*y,Math.max(w*rx,h*ry),[[0,'#fff8e58c'],[.5,'#fff8e54d'],[1,'#fff8e500']]));
}
function kitchenWall(c,w,h,a){
  c.fillStyle='#e7ba9f';c.fillRect(0,0,w,h);for(let row=0;row<3;row++)for(let col=-1;col<4;col++){const x=col*64+(row%2?32:0),y=row*43;kitchenRound(c,x+2,y+2,60,39,3,a.linear(c,0,y,0,y+41,[[0,'#f2cbb0'],[1,'#dba68f']]),'#efd2b4',1);c.fillStyle='#f8dbc13b';c.fillRect(x+6,y+5,50,3);}
}
function kitchenTop(c,w,h,a){
  c.fillStyle=a.linear(c,0,0,w,h,[[0,'#e9e7d5'],[.4,'#faf1da'],[1,'#c2c8b8']]);c.fillRect(0,0,w,h);for(let i=0;i<11;i++){c.strokeStyle='#91a99a16';c.lineWidth=.8;c.beginPath();c.moveTo(0,9+i*10);c.lineTo(w,5+i*10);c.stroke();}
}
const kitchenAtlas={builtins:[],tiles:[
  {name:'kitchen_cook',x:0,y:0,w:256,h:192,paint:kitchenCook},
  {name:'kitchen_cool',x:256,y:0,w:256,h:192,paint:kitchenCool},
  {name:'kitchen_pack',x:512,y:0,w:256,h:192,paint:kitchenPack},
  {name:'kitchen_wall',x:768,y:0,w:192,h:128,paint:kitchenWall},
  {name:'kitchen_top',x:768,y:128,w:192,h:112,paint:kitchenTop},
  {name:'kitchen_tray',x:0,y:192,w:192,h:96,paint:kitchenTray},
  {name:'kitchen_box_open',x:192,y:192,w:128,h:112,paint:kitchenBox(false)},
  {name:'kitchen_box_closed',x:320,y:192,w:128,h:112,paint:kitchenBox(true)},
  {name:'kitchen_fan',x:448,y:192,w:96,h:96,paint:kitchenFan},
  {name:'kitchen_steam',x:544,y:192,w:96,h:128,paint:kitchenSteam},
  ...['custard','tomato-soup','compote','pumpkin-soup','stew','bean-soup'].map((kind,i)=>({name:'kitchen_food_'+kind,x:i*96,y:320,w:96,h:96,paint:kitchenFood(kind)}))
]};
const K_INK='#294950',K_MUTED='#698379',K_PAPER='#f6ead0',K_ACCENT='#e3a06d',K_GOOD='#568b72',K_WARN='#b45e4f';
const K_STATIONS=['cook','cool','pack'];
function kCenter(r,t,x,y,size,color){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function kOutline(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function kCheck(r,x,y,color){r.line(x-5,y,x-1,y+4,2.5,color);r.line(x-1,y+4,x+7,y-5,2.5,color);}
function kDegrees(s,q){return (q/s.physics.temperatureScale).toFixed(1);}
function kFood(r,o,x,y,w,h){r.sprite('kitchen_food_'+o.recipeId,x,y,w,h,0,'#fff');}
function kHeader(r,s){
  r.rect(0,0,960,69,K_INK);r.text('ASSEMBLY KITCHEN',26,16,21,K_PAPER);r.text('COOK / COOL / PACK',27,45,14,'#b9ccbc');
  r.text('DELIVERY ORDER',457,18,14,'#b9ccbc');r.text('NEXT '+(s.nextOrderId||'COMPLETE'),457,42,16,K_PAPER);
  s.deliveryOrder.forEach((id,i)=>{const o=s.orders.find(order=>order.id===id),x=625+i*101,done=o.phase==='delivered';r.rect(x,16,85,39,done?'#567f69':'#3b5a5f');if(id===s.nextOrderId)kOutline(r,x,16,85,39,K_ACCENT,2);r.text(id,x+12,25,21,K_PAPER);if(done)kCheck(r,x+64,35,K_PAPER);else r.text(String(i+1),x+63,29,13,'#b9ccbc');});
}
function kEquipment(r,s){
  for(let i=0;i<5;i++)r.sprite('kitchen_wall',96+i*192,191,192,244,0,'#fff');
  for(let i=0;i<5;i++)r.sprite('kitchen_top',96+i*192,310,192,57,0,'#fff');
  r.rect(0,343,960,7,'#64817c');r.line(0,345,960,345,2,'#eff1db');
  K_STATIONS.forEach((id,i)=>{
    const x=170+i*310,station=s.stations[id],task=station.task,o=task?s.orders.find(order=>order.id===task.orderId):null,selected=o&&o.id===s.selectedOrderId;
    r.rect(x-137,78,274,44,'#f8ecd9e8');if(selected)kOutline(r,x-137,78,274,44,K_ACCENT,2);
    r.text((i+1)+'  '+id.toUpperCase(),x-125,85,18,K_INK);
    const status=!task?'EMPTY':s.phase!=='playing'?'STOPPED':task.ready?'READY / OCCUPIED':'WORKING';
    r.text(status,x-125,106,13,task?.ready?K_GOOD:K_MUTED);
    if(o)r.text(o.id+' #'+o.attempt,x+54,88,17,K_INK);
    r.sprite('kitchen_'+id,x,220,256,192,0,'#fff');
    if(id==='cool'){
      const active=s.phase==='playing'&&!!task;r.sprite('kitchen_fan',x,198,46,46,active?s.elapsed*(s.fanMode==='fast'?5:1.8):0,'#fff');
      r.rect(x+74,155,43,28,'#e9eed8');kCenter(r,s.fanMode==='fast'?'FAST':'SLOW',x+95.5,162,13,K_INK);
    }
    if(o){
      if(id==='cook'){
        kFood(r,o,x,186,82,67);
        if(s.phase==='playing'&&o.phase==='cooking')r.sprite('kitchen_steam',x+Math.sin(s.elapsed*1.4)*3,163,67,78,0,'#fff');
      }else if(id==='cool')kFood(r,o,x,258,78,68);
      else{
        r.sprite('kitchen_box_'+(o.phase==='packed'?'closed':'open'),x,251,90,79,0,'#fff');
        if(o.phase==='packing')kFood(r,o,x,239,41,33);
      }
      r.rect(x-125,315,250,7,'#8fa69b');r.rect(x-125,315,250*Math.min(1,task.progressTicks/task.durationTicks),7,task.ready?K_GOOD:K_ACCENT);
      const remaining=Math.max(0,(task.durationTicks-task.progressTicks)/s.physics.tickHz);
      const hint=s.phase!=='playing'?'WORK FROZEN':task.ready?(id==='pack'?'A ON '+o.id+': DELIVER':'A ON '+o.id+': TAKE TO TRAY'):remaining.toFixed(1)+' s TO READY';
      kCenter(r,hint,x,326,13,K_INK);
    }else{kCenter(r,'FREE STATION',x,321,13,K_INK);}
  });
}
function kCards(r,s){
  s.orders.forEach((o,i)=>{
    const x=22+i*310,y=352,w=296,h=132,selected=o.id===s.selectedOrderId,done=o.phase==='delivered',inBand=o.temperatureQ>=o.deliveryMinQ&&o.temperatureQ<=o.deliveryMaxQ;
    r.rect(x+3,y+4,w,h,'#526f6c25');r.rect(x,y,w,h,selected?'#fff0d3':'#e9e5d0');kOutline(r,x,y,w,h,selected?K_ACCENT:'#a7b8a6',selected?3:1.1);
    r.rect(x+8,y+8,34,25,done?K_GOOD:K_INK);kCenter(r,o.id,x+25,y+12,17,K_PAPER);r.text(o.nameEn,x+49,y+10,14,K_INK);
    r.text(o.phase.toUpperCase()+' / '+o.location.toUpperCase(),x+11,y+39,14,K_INK);
    r.text(kDegrees(s,o.temperatureQ)+' C',x+11,y+60,24,done?K_GOOD:inBand?K_GOOD:K_INK);
    r.text('DELIVERY '+kDegrees(s,o.deliveryMinQ).replace('.0','')+'-'+kDegrees(s,o.deliveryMaxQ).replace('.0','')+' C',x+11,y+91,14,K_MUTED);
    const hold=done?'DELIVERED / TEMP RECORDED':o.cookedAtTick===null?'HOLD STARTS AFTER COOK':'HOLD '+Math.max(0,(o.holdTicks-o.holdingAgeTicks)/s.physics.tickHz).toFixed(1)+' s LEFT';
    r.text(hold,x+11,y+113,13,!done&&o.cookedAtTick!==null&&o.holdTicks-o.holdingAgeTicks<5*s.physics.tickHz?K_WARN:K_MUTED);
    r.sprite('kitchen_tray',x+239,y+83,90,45,0,'#fff');
    if(o.location==='tray')kFood(r,o,x+239,y+75,57,57);
    else if(done)kCheck(r,x+238,y+79,K_GOOD);
    else kCenter(r,'AT '+o.location.toUpperCase(),x+239,y+74,13,K_MUTED);
    kCenter(r,'TRY '+o.attempt,x+239,y+105,13,K_MUTED);
  });
}
function kAction(s,o){
  if(s.phase==='won')return 'SERVICE COMPLETE / ALL ORDERS DELIVERED';
  if(s.phase==='lost')return s.lostReason==='closing'?'CLOSED / UNFINISHED ORDERS':'SERVICE ENDED / DISCARD LIMIT';
  if(o.phase==='delivered')return o.id+' ALREADY DELIVERED / SELECT ANOTHER ORDER';
  if(['cooking','cooling','packing'].includes(o.phase))return o.id+' PROCESSING / WAIT UNTIL READY';
  if(o.location==='cook'||o.location==='cool')return o.id+'  A: TAKE TO OWN TRAY';
  if(o.phase==='packed')return o.id+'  A: DELIVER / CHECK ORDER AND TEMPERATURE';
  const next=o.phase==='raw'?'cook':o.phase==='cooked'?'cool':'pack';
  return o.id+'  A: '+(s.stations[next].task?next.toUpperCase()+' BUSY':'START '+next.toUpperCase());
}
function kFooter(r,s){
  const o=s.orders.find(order=>order.id===s.selectedOrderId);r.rect(0,495,960,45,K_INK);r.text(kAction(s,o),24,502,15,K_PAPER);
  const tail=s.phase==='playing'?'B: FAN '+s.fanMode.toUpperCase()+' / SWITCH':'FINAL FAN: '+s.fanMode.toUpperCase();r.text(tail,666,503,14,'#d0dcca');
  r.text(s.phase==='playing'?'READY MEANS COMPLETED, STILL OCCUPIED':'TEMPERATURES AND WORK ARE FROZEN',24,523,13,'#b9ccbc');
}
root.GameDef={
  id:'assembly-kitchen',title:'装配厨房',tagline:'接力三道工序，按序准温出餐',seed:527,accent:'#e4ae80',background:'#d7b79e',levelLabel:'餐期',levelNames:['午间','热餐','晚间'],atlas:kitchenAtlas,
  description:'左右选择订单，A 依次煮、取、冷却、取、装盒、交付，B 切换冷却快慢风。完成的餐点仍占工位并继续降温。按顶部顺序，在温区和保留时间内交付；两次报废结束。',
  controls:{move:'左右 / 摇杆 · 选订单',a:'处理 / 空格',b:'快风·慢风 / B'},actionLabels:['处理','风速'],tip:'煮、冷完成后取走，装盒后交付。保留计时不重置；交付核温区与顺序。',
  winTitle:'出餐完成',loseTitle:'厨房未完成',
  result(s){return s.phase==='won'?'全部订单已按顺序、温区交付。':s.lostReason==='closing'?'打烊时间已到。并行使用工位，及时取走餐点。':'报废达到上限。留意交付温区、顺序与保留时间。';},
  hud(s){return[{label:'已交付',value:s.deliveredCount+'/'+s.orders.length,tone:s.phase==='won'?'good':''},{label:'下一订单',value:s.nextOrderId||'全部完成',tone:''},{label:'报废 / 上限',value:s.strikes+' / '+s.strikeLimit,tone:s.strikes?'warn':''},{label:'打烊倒计时',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}];},
  render(r,s){kHeader(r,s);kEquipment(r,s);kCards(r,s);kFooter(r,s);}
};
})(typeof window!=='undefined'?window:globalThis);
