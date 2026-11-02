/* Greenhouse Dials: one shared climate, actual crop progress and delayed applied controls. */
(function(root){
'use strict';
function glassArt(c,w,h,a){
  c.fillStyle=a.linear(c,0,0,0,h,[[0,'#edf5e2'],[.55,'#d6e9df'],[1,'#a4c8b8']]);c.fillRect(0,0,w,h);
  a.path(c,[[0,66],[w*.5,2],[w,66],[w,h],[0,h]],a.linear(c,0,0,w,h,[[0,'#e4f2e991'],[.5,'#b8dbd45c'],[1,'#8cbdaf77']]),'#6c9a89',2);
  c.strokeStyle='#7bab9899';c.lineWidth=1.5;for(let i=1;i<8;i++){const x=w*i/8;c.beginPath();c.moveTo(x,66);c.lineTo(x,h);c.stroke();}
  c.strokeStyle='#f9f8e7';c.lineWidth=4;c.beginPath();c.moveTo(0,67);c.lineTo(w*.5,3);c.lineTo(w,67);c.moveTo(0,69);c.lineTo(w,69);c.moveTo(0,h-4);c.lineTo(w,h-4);c.stroke();
  for(let i=0;i<3;i++){const x=34+i*159;a.path(c,[[x,77],[x+34,77],[x+95,h-14],[x+71,h-14]],'#ffffff24');a.path(c,[[x+43,77],[x+52,77],[x+111,h-14],[x+104,h-14]],'#ffffff33');}
  c.fillStyle='#f4efda';c.fillRect(0,h-13,w,9);c.fillStyle='#95ae92';c.fillRect(0,h-4,w,4);
  c.strokeStyle='#c5d7c1';c.lineWidth=2;for(let i=1;i<8;i++){c.beginPath();c.moveTo(w*i/8,h-12);c.lineTo(w*i/8,h-4);c.stroke();}
}
function leaf(c,x,y,length,width,angle,colors,a,serrated=false){
  c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(0,0);
  if(serrated){c.bezierCurveTo(-width*.6,-length*.25,-width*.2,-length*.35,-width*.55,-length*.48);c.bezierCurveTo(-width*.18,-length*.63,-width*.38,-length*.75,0,-length);c.bezierCurveTo(width*.38,-length*.75,width*.18,-length*.63,width*.55,-length*.48);c.bezierCurveTo(width*.2,-length*.35,width*.6,-length*.25,0,0);}
  else{c.bezierCurveTo(-width,-length*.38,-width*.55,-length*.86,0,-length);c.bezierCurveTo(width*.65,-length*.8,width,-length*.3,0,0);}
  c.closePath();c.fillStyle=a.linear(c,-width,-length, width,0,[[0,colors[0]],[.5,colors[1]],[1,colors[2]]]);c.fill();c.strokeStyle=colors[0];c.lineWidth=.9;c.stroke();
  c.strokeStyle='#d6e6a576';c.lineWidth=1.3;c.beginPath();c.moveTo(0,-3);c.quadraticCurveTo(-2,-length*.55,0,-length+5);c.stroke();
  c.lineWidth=.6;for(let k=1;k<4;k++){const yy=-length*k/5;c.beginPath();c.moveTo(0,yy);c.lineTo(-width*.37,yy-length*.14);c.moveTo(0,yy);c.lineTo(width*.4,yy-length*.13);c.stroke();}c.restore();
}
function plantArt(kind,stage){return function(c,w,h,a){
  c.save();c.scale(w/192,h/192);const base=180,f=.53+stage*.235;
  c.translate(96,base);c.scale(f,f);c.translate(-96,-base);
  if(kind==='leaf'){
    const colors=['#badb83','#78ac62','#416e4c'];
    for(let i=0;i<9;i++){const t=(i-4)*.27;leaf(c,96+(i-4)*3,base-4,75+(i%3)*12,30,t,colors,a,true);}
    for(let i=0;i<5;i++)leaf(c,96+(i-2)*5,base-7,92-i*4,24,(i-2)*.24,['#d6e894','#8ebd69','#518050'],a,true);
    leaf(c,96,base-8,105,19,-.04,['#e0ed9e','#a7ce78','#618b56'],a,true);
  }else if(kind==='bean'){
    for(let j=0;j<3;j++){const x=65+j*31,top=32+(j%2)*12;c.strokeStyle='#698d4e';c.lineWidth=3.1;c.beginPath();c.moveTo(x,base);c.bezierCurveTo(x-13,125,x+9,73,x+2,top);c.stroke();
      for(let i=0;i<3;i++){const y=68+i*33;leaf(c,x,y,39+i*3,18,-.83,['#b8d78d','#7ba45e','#48744d'],a);leaf(c,x+1,y+9,44,20,.85,['#d2e39b','#84b369','#477c51'],a);}
      c.strokeStyle='#90b76e';c.lineWidth=1.4;c.beginPath();c.moveTo(x+2,top+9);c.bezierCurveTo(x+23,top-14,x+24,top+12,x+10,top+6);c.stroke();
    }
  }else{
    for(let j=0;j<5;j++){const x=53+j*21,top=40+(j%2)*19;c.strokeStyle='#738b59';c.lineWidth=2.4;c.beginPath();c.moveTo(96,base);c.quadraticCurveTo(x,138,x,top);c.stroke();
      for(let i=0;i<4;i++){const y=top+20+i*25;leaf(c,x,y,28,11,-.78,['#aecb9b','#70976b','#416a56'],a,true);leaf(c,x+1,y+7,31,12,.79,['#c3d7a8','#83a57b','#4c725d'],a,true);}
      leaf(c,x,top+9,24,10,.03,['#d4dfb5','#90ac80','#4e755e'],a,true);
    }
  }
  c.restore();
};}
function potArt(c,w,h,a){
  c.save();c.scale(w/128,h/128);a.ellipse(c,65,112,48,9,'#3857402b');
  a.path(c,[[14,36],[114,36],[101,111],[28,111]],a.linear(c,17,35,115,106,[[0,'#eac2a2'],[.4,'#cd9979'],[1,'#9d6d55']]),'#a47358',1.4);
  a.path(c,[[22,47],[39,47],[48,106],[32,106]],'#f4d7b24d');a.path(c,[[101,47],[112,42],[101,110],[93,109]],'#875d4d42');
  a.ellipse(c,64,38,54,20,'#efd1ac');a.ellipse(c,64,37,44,14,'#644d3d');a.ellipse(c,64,35,40,11,'#4f4835');
  for(let i=0;i<15;i++){const x=31+(i*19)%68,y=31+(i*13)%13;a.ellipse(c,x,y,1.1,.7,i%2?'#958263':'#2f3828');}
  c.strokeStyle='#f4dfc5';c.lineWidth=2;c.beginPath();c.ellipse(64,38,53,19,0,0,Math.PI);c.stroke();c.restore();
}
function tankArt(c,w,h,a){
  c.save();c.scale(w/128,h/224);a.ellipse(c,64,207,45,9,'#345e4e25');
  a.path(c,[[27,30],[94,30],[107,41],[107,194],[94,205],[27,205],[16,193],[16,42]],a.linear(c,17,30,104,205,[[0,'#e5ead5'],[.45,'#bacfbd'],[1,'#6a9482']]),'#6c9482',1.2);
  a.path(c,[[29,38],[94,38],[94,190],[29,190]],'#6b9f9980','#f4f4e0',2);
  c.fillStyle='#386b6b';c.fillRect(38,51,47,124);c.fillStyle='#cadcc5';c.fillRect(45,23,32,9);
  c.strokeStyle='#b8d4c98c';c.lineWidth=1;for(let i=0;i<6;i++){c.beginPath();c.moveTo(75,63+i*19);c.lineTo(83,63+i*19);c.stroke();}
  c.fillStyle='#f7f7e48c';c.fillRect(32,45,4,134);a.ellipse(c,101,175,8,8,'#628b78');a.ellipse(c,101,175,4,4,'#d7dec1');c.restore();
}
function fanArt(c,w,h,a){
  c.save();c.scale(w/128,h/128);a.ellipse(c,64,64,58,58,'#f1f3df');a.ellipse(c,64,64,50,50,'#a6c6b8');a.ellipse(c,64,64,44,44,'#7ca596');
  for(let i=0;i<4;i++){c.save();c.translate(64,64);c.rotate(i*Math.PI/2);a.path(c,[[0,0],[9,-13],[30,-35],[39,-23],[29,-7],[8,8]],a.linear(c,0,0,35,-36,[[0,'#a8c8ac'],[1,'#e9edce']]),'#789f8c',1);c.restore();}
  a.ellipse(c,64,64,11,11,'#e8ecd4');a.ellipse(c,64,64,4,4,'#6c9684');c.restore();
}
function dropArt(c,w,h,a){
  c.save();c.scale(w/64,h/96);c.beginPath();c.moveTo(32,5);c.bezierCurveTo(26,27,10,47,10,62);c.bezierCurveTo(10,92,54,92,54,62);c.bezierCurveTo(54,47,38,27,32,5);c.closePath();c.fillStyle=a.linear(c,12,8,51,85,[[0,'#d6eeed'],[.45,'#91c4c5'],[1,'#4b929b']]);c.fill();c.strokeStyle='#e1f1e8';c.lineWidth=2;c.stroke();c.beginPath();c.moveTo(23,47);c.quadraticCurveTo(15,67,24,72);c.strokeStyle='#ffffff96';c.lineWidth=4;c.stroke();c.restore();
}
const atlas={builtins:[],tiles:[
  {name:'greenhouse_glass',x:0,y:0,w:512,h:192,paint:glassArt},
  {name:'greenhouse_leaf_0',x:512,y:0,w:192,h:192,paint:plantArt('leaf',0)},
  {name:'greenhouse_leaf_1',x:704,y:0,w:192,h:192,paint:plantArt('leaf',1)},
  {name:'greenhouse_leaf_2',x:0,y:192,w:192,h:192,paint:plantArt('leaf',2)},
  {name:'greenhouse_bean_0',x:192,y:192,w:192,h:192,paint:plantArt('bean',0)},
  {name:'greenhouse_bean_1',x:384,y:192,w:192,h:192,paint:plantArt('bean',1)},
  {name:'greenhouse_bean_2',x:0,y:800,w:192,h:192,paint:plantArt('bean',2)},
  {name:'greenhouse_herb_0',x:192,y:800,w:192,h:192,paint:plantArt('herb',0)},
  {name:'greenhouse_herb_1',x:384,y:800,w:192,h:192,paint:plantArt('herb',1)},
  {name:'greenhouse_herb_2',x:576,y:800,w:192,h:192,paint:plantArt('herb',2)},
  {name:'greenhouse_pot',x:576,y:192,w:128,h:128,paint:potArt},
  {name:'greenhouse_tank',x:768,y:800,w:128,h:224,paint:tankArt},
  {name:'greenhouse_fan',x:896,y:0,w:128,h:128,paint:fanArt},
  {name:'greenhouse_drop',x:896,y:800,w:64,h:96,paint:dropArt}
]};

const INK='#254b40',PALE='#f3f3db',MUTED='#bccfbb',GOOD='#9ac77b',BAD='#edb59a',AMBER='#e4c180';
const DIM=[['temperature','T',60],['humidity','H',100],['soilMoisture','M',100]];
function num(n){return Number.isInteger(n)?String(n):n.toFixed(1);}
function below(n,limit){const v=num(n);return n<limit&&Number(v)>=limit?num(Math.floor(n*10)/10):v;}
function ratio(value,total){return Math.max(0,Math.min(1,value/total));}
function center(r,t,x,y,size,color){r.text(t,x-r.measureText(t,size)/2,y,size,color);}
function box(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function dial(s,id){return s.dials.find(d=>d.id===id);}
function greenhouse(r,s){
  const vent=dial(s,'vent').appliedLevel,shade=dial(s,'shade').appliedLevel,flow=s.lastInterval?s.lastInterval.actualDripLps:0;
  r.sprite('greenhouse_glass',540,211,784,208,0,'#fff');
  // Applied shade only; a queued request never darkens the glass early.
  if(shade>0){const width=310*shade/2;r.rect(382,123,width,45,'#7d98766b');for(let x=390;x<382+width;x+=18)r.line(x,124,x,167,1,'#d6dfc18c');}
  r.rect(189,132,92,49,'#86b3a57a');box(r,189,132,92,49,'#f3f1d8',3);
  r.rect(193,136,84,Math.max(4,41-vent*15),'#cce3d6');r.line(193,177-vent*15,277,177-vent*15,3,'#668f7c');
  r.sprite('greenhouse_fan',841,151,49,49,vent>0?s.elapsed*(.7+vent*.45):0,'#fff');
  r.line(133,204,133,119,5,'#8aa68d');r.line(133,119,800,119,5,'#8aa68d');
  for(const x of[280,536,792]){r.line(x,119,x,143,4,'#91a98d');r.circle(x,145,4,'#5c8e78');}
  s.crops.forEach((crop,i)=>{
    const x=280+i*256,progress=ratio(crop.growthTicks,crop.maturityTicks),damage=ratio(crop.damageTicks,crop.damageLimitTicks),stage=progress<.34?0:progress<.72?1:2;
    r.sprite('greenhouse_pot',x,274,119,86,0,'#fff');
    const sway=vent>0&&!crop.dead?Math.sin(s.elapsed*(1.25+vent*.18)+i)*.018:0,lean=crop.dead?.12:damage*.025;
    const tint=[1-.18*damage,1-.42*damage,1-.42*damage,1];
    r.sprite('greenhouse_'+crop.nameEn.toLowerCase()+'_'+stage,x,179,176,176,sway+lean,tint);
    // Sprinkling is actual delivered flow into the shared soil system, not independent per-pot meters.
    if(flow>0)for(let k=0;k<2;k++){const t=(s.elapsed*1.45+k*.5+i*.13)%1;r.sprite('greenhouse_drop',x+(k?8:-8),151+t*81,6,10,0,[1,1,1,.85]);}
  });
}
function water(r,s){
  const w=s.reservoir,flow=s.lastInterval?s.lastInterval.actualDripLps:0,fill=ratio(w.remainingLitres,w.initialLitres);
  r.rect(29,110,107,324,'#dbe6c9');r.text('WATER',44,120,17,INK);r.sprite('greenhouse_tank',82,239,102,179,0,'#fff');
  r.rect(61.2,289.3-fill*99.2,35.8,fill*99.2,'#83bec0');
  center(r,num(w.remainingLitres)+' L',82,333,21,INK);center(r,'OF '+num(w.initialLitres)+' L',82,360,13,INK);
  center(r,num(flow)+' L/s',82,384,17,INK);
  const stalled=s.dryStallTicks/60,limit=s.dryStallLimitTicks/60;
  center(r,'STALL '+below(stalled,limit)+'/'+num(limit),82,413,13,s.dryStallTicks>0?'#996448':INK);
}
function environment(r,s){
  const labels=[['TEMP',s.environment.temperature,'C'],['AIR',s.environment.humidity,'%'],['SOIL',s.environment.soilMoisture,'%']];
  labels.forEach((v,i)=>{const x=160+i*256;r.rect(x,58,240,43,'#e8efd8');r.text(v[0],x+10,72,13,INK);r.text(num(v[1])+' '+v[2],x+88,65,24,INK);});
}
function cropCards(r,s){
  s.crops.forEach((crop,i)=>{
    const x=160+i*256,y=310;r.rect(x,y,240,124,'#436d54');r.text(crop.id+' '+crop.nameEn,x+9,y+8,17,PALE);
    const status=crop.dead?'DEAD':crop.mature?'MATURE':crop.growing?'GROWING':crop.dangerous?'UNSAFE':'WAITING';r.text(status,x+230-r.measureText(status,13),y+11,13,crop.dead||crop.dangerous?BAD:crop.mature||crop.growing?GOOD:MUTED);
    const growPct=crop.mature?100:Math.floor(100*crop.growthTicks/crop.maturityTicks),dmg=crop.damageTicks/60,limit=crop.damageLimitTicks/60;
    r.text('GROW '+growPct+'%',x+9,y+33,16,PALE);r.rect(x+113,y+38,116,6,'#284b39');r.rect(x+113,y+38,116*ratio(crop.growthTicks,crop.maturityTicks),6,GOOD);
    r.text('DAMAGE '+below(dmg,limit)+'/'+num(limit)+' s',x+9,y+54,13,crop.damageTicks>0?BAD:MUTED);
    DIM.forEach(([key,label,max],j)=>{const yy=y+76+j*15,band=crop.comfort[key],ok=crop.comfortChecks[key],value=s.environment[key];
      r.text(label+' '+num(band[0])+'-'+num(band[1]),x+9,yy,13,ok?PALE:AMBER);
      r.rect(x+120,yy+5,108,5,'#284b39');r.rect(x+120+108*band[0]/max,yy+4,108*(band[1]-band[0])/max,7,'#8baa78');
      const px=x+120+108*value/max;r.line(px,yy+1,px,yy+12,2,ok?'#fbf5da':'#f0be8e');
    });
  });
}
function controls(r,s){
  s.dials.forEach((d,i)=>{
    const x=30+i*304,y=442;r.rect(x,y,294,61,'#d7dfc2');if(s.phase==='playing'&&s.selectedId===d.id)box(r,x,y,294,61,'#6f9472',2.3);
    r.text(d.nameEn,x+10,y+10,17,INK);r.text('ACT '+d.appliedLevel,x+110,y+11,16,INK);r.text('REQ '+d.requestedLevel,x+204,y+11,16,'#8f754c');
    const queue=s.pendingCommands.filter(c=>c.dialId===d.id),next=queue[0];
    let text;if(s.phase!=='playing')text='FINAL / QUEUED '+queue.length;else if(next){const delay=Math.max(0,Math.ceil((next.dueTick-s.tick)/6)/10);text='NEXT '+next.afterRequested+' IN '+num(delay)+'s'+(queue.length>1?' / +'+(queue.length-1):'');}else text='NO PENDING COMMAND';
    r.text(text,x+10,y+37,14,INK);
  });
}
function footer(r,s){
  r.rect(28,510,904,25,'#315840');let message;
  if(s.phase==='won')message='ALL THREE CROPS MATURE';else if(s.phase==='lost')message=s.lostReason==='crop'?'CROP DAMAGE LIMIT':s.lostReason==='water'?'EMPTY WATER / UNFINISHED CROPS STALLED':'GROWING TIME COMPLETE';
  else message='A RAISE / B LOWER / APPLIED SETTINGS DRIVE THE HOUSE';
  r.text(message,40,516,13,PALE);const progress='MATURE '+s.matureCount+'/'+s.crops.length;r.text(progress,918-r.measureText(progress,15),514,15,PALE);
}
function scene(r,s){
  r.rect(0,0,960,540,'#f1efd7');r.rect(0,0,960,49,'#355b48');r.text('GREENHOUSE DIALS',23,12,24,PALE);
  const top=s.phase==='won'?'CULTIVATION COMPLETE':s.phase==='lost'?'CULTIVATION ENDED':'ONE SHARED CLIMATE / '+String(s.level).padStart(2,'0');r.text(top,932-r.measureText(top,13),22,13,MUTED);
  environment(r,s);greenhouse(r,s);water(r,s);cropCards(r,s);controls(r,s);footer(r,s);
}
root.GameDef={
  id:'greenhouse-dials',title:'温室旋钮',tagline:'共享温湿水分，照顾三种生长节律',seed:443,accent:'#b6d29a',background:'#f1efd7',levelLabel:'苗圃',levelNames:['晨光','正午','傍晚'],atlas,
  description:'方向选旋钮，A 升档，B 降档。通风、遮阳和滴灌都会延迟生效，指令按队列执行。三株共用温湿度与土壤水分，适宜区各不相同；让它们成熟，并避免累计致命损伤。',
  controls:{move:'方向键 / 摇杆 · 选择',a:'升档 / 空格',b:'降档 / B'},actionLabels:['升档','降档'],tip:'看实际档位，不只看请求值。缺水后土壤余水仍可支持生长。',winTitle:'三株作物成熟',loseTitle:'培育未完成',
  result(s){if(s.phase==='won')return '三种作物全部成熟，温室培育完成。';if(s.lostReason==='crop')return '作物累计损伤达到上限。留意安全范围。';if(s.lostReason==='water')return '水已耗尽，未成熟作物连续三秒没有生长。';return '九十秒已到，仍有作物尚未成熟。';},
  hud(s){return[
    {label:'温度',value:num(s.environment.temperature)+' °C',tone:s.crops.some(c=>!c.comfortChecks.temperature)?'warn':''},
    {label:'空气湿度',value:num(s.environment.humidity)+'%',tone:s.crops.some(c=>!c.comfortChecks.humidity)?'warn':''},
    {label:'土壤水分',value:num(s.environment.soilMoisture)+'%',tone:s.crops.some(c=>!c.comfortChecks.soilMoisture)?'warn':''},
    {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
  ];},render(r,s){scene(r,s);}
};
})(window);
