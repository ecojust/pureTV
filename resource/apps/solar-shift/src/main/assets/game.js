/* Solar Shift: baked rooftop instruments driven only by public completed-interval telemetry. */
(function(root){
'use strict';
function roof(c,w,h,a){
  c.fillStyle=a.linear(c,0,0,w,h,[[0,'#dfe9ec'],[.55,'#c5d4da'],[1,'#a3b8c2']]);c.fillRect(0,0,w,h);
  c.strokeStyle='#718c991a';c.lineWidth=.6;
  for(let i=0;i<160;i++){const x=(i*67)%w,y=(i*47)%h;c.beginPath();c.moveTo(x,y);c.lineTo(x+2.4,y+.8);c.stroke();}
  c.fillStyle='#eaf1f4';c.fillRect(0,0,w,10);c.fillStyle='#7e98a5';c.fillRect(0,h-8,w,8);
  c.strokeStyle='#8aa1ac';c.lineWidth=1.2;
  for(let i=1;i<4;i++){c.beginPath();c.moveTo(w*i/4,11);c.lineTo(w*i/4,h-9);c.stroke();}
  c.strokeStyle='#e9f2f4b0';c.beginPath();c.moveTo(0,h/2);c.lineTo(w,h/2);c.stroke();
  for(const x of[14,w-14])for(const y of[18,h-19]){a.ellipse(c,x,y,4,4,'#718c98');a.ellipse(c,x-1,y-1,2.6,2.6,'#d6e5ea');}
  // Static ambient relief only; no time-of-day or physical shadow calculation.
  c.fillStyle=a.radial(c,w*.48,h*.4,w*.75,[[0,'#ffffff24'],[1,'#304d6010']]);c.fillRect(0,0,w,h);
}
function panel(c,w,h,a){
  c.save();c.scale(w/256,h/192);
  a.ellipse(c,130,165,110,15,'#23415330');
  a.path(c,[[28,119],[42,119],[56,166],[45,171]],'#6c8796','#b5cbd5',1.5);
  a.path(c,[[202,114],[215,114],[225,160],[213,166]],'#6c8796','#b5cbd5',1.5);
  a.path(c,[[17,25],[225,25],[241,40],[241,143],[225,156],[17,156],[8,144],[8,40]],a.linear(c,12,21,235,155,[[0,'#f5f9fa'],[.30,'#c9d9e1'],[.65,'#a1b9c8'],[1,'#5f7f93']]),'#668497',1.2);
  a.path(c,[[17,25],[225,25],[233,33],[24,33],[17,148],[8,144],[8,40]],'#e8f3f7');
  a.path(c,[[225,25],[241,40],[241,143],[225,156],[231,141],[232,40]],'#7898ad');
  c.fillStyle='#163d62';c.fillRect(24,39,201,102);
  for(let row=0;row<3;row++)for(let col=0;col<6;col++){
    const x=27+col*33,y=42+row*32;
    a.path(c,[[x+3,y],[x+26,y],[x+29,y+3],[x+29,y+25],[x+26,y+28],[x+3,y+28],[x,y+25],[x,y+3]],a.linear(c,x,y,x+26,y+28,[[0,'#376b9a'],[.5,'#24527e'],[1,'#163d65']]),'#749bb650',.8);
    c.strokeStyle='#a7c8da60';c.lineWidth=.6;
    for(const q of[7,14,21]){c.beginPath();c.moveTo(x+2,y+q);c.lineTo(x+27,y+q);c.stroke();}
    c.strokeStyle='#b4d1de8c';c.lineWidth=.7;c.beginPath();c.moveTo(x+9,y+1);c.lineTo(x+9,y+27);c.moveTo(x+20,y+1);c.lineTo(x+20,y+27);c.stroke();
  }
  c.save();c.beginPath();c.rect(24,39,201,102);c.clip();
  a.path(c,[[24,39],[94,39],[166,141],[119,141]],'#e8f6ff12');
  a.path(c,[[180,39],[196,39],[225,79],[225,101]],'#e8f6ff16');c.restore();
  for(const x of[17,232])for(const y of[35,145]){a.ellipse(c,x,y,2.8,2.8,'#eaf1f4');c.strokeStyle='#74909d';c.lineWidth=.8;c.beginPath();c.moveTo(x-1.5,y);c.lineTo(x+1.5,y);c.stroke();}
  c.fillStyle='#28475c';c.fillRect(103,150,41,8);c.fillStyle='#afc3ce';c.fillRect(108,151,30,2);
  c.restore();
}
function battery(c,w,h,a){
  c.save();c.scale(w/192,h/224);a.ellipse(c,98,204,75,12,'#2441512b');
  a.path(c,[[36,29],[139,29],[165,47],[165,191],[139,208],[36,208],[22,194],[22,45]],'#718f9f','#506e80',1.2);
  a.path(c,[[36,29],[139,29],[155,43],[38,43],[22,45]],'#e6f1f4');
  a.path(c,[[139,29],[165,47],[165,191],[139,208]],a.linear(c,139,30,167,198,[[0,'#96b1be'],[1,'#4d7287']]));
  a.path(c,[[36,43],[139,43],[139,195],[36,195]],a.linear(c,37,43,139,195,[[0,'#f3f7f7'],[.55,'#d4e2e8'],[1,'#aec5d0']]),'#f7fbfb',1.4);
  // Empty neutral gauge window; stored energy is drawn later from public energyJ/capacityJ.
  c.fillStyle='#55798b';c.fillRect(48,61,51,99);c.fillStyle='#163d4f';c.fillRect(52,65,43,91);
  c.fillStyle='#c2d4dc';c.fillRect(112,62,12,48);c.fillStyle='#5f8194';c.fillRect(115,65,6,42);
  for(let i=0;i<5;i++){c.strokeStyle='#385f7370';c.lineWidth=1;c.beginPath();c.moveTo(57,73+i*16);c.lineTo(90,73+i*16);c.stroke();}
  for(let i=0;i<5;i++){c.fillStyle='#7795a5';c.fillRect(48,174+i*3,76,1);}
  c.fillStyle='#dbe7eb';c.fillRect(50,19,23,11);c.fillRect(109,19,22,11);
  c.fillStyle='#607c8c';c.fillRect(54,20,15,3);c.fillRect(113,20,14,3);
  for(const x of[42,133])for(const y of[50,189])a.ellipse(c,x,y,2,2,'#7795a3');
  c.restore();
}
function bus(c,w,h,a){
  c.save();c.scale(w/192,h/160);a.ellipse(c,98,142,78,10,'#23415420');
  a.path(c,[[23,30],[153,30],[170,46],[170,123],[153,137],[23,137],[14,124],[14,44]],'#7294a5');
  a.path(c,[[23,30],[153,30],[162,40],[26,40],[14,44]],'#d6e7ef');
  a.path(c,[[26,40],[153,40],[153,125],[26,125]],a.linear(c,26,40,153,125,[[0,'#eaf3f5'],[1,'#b0c8d5']]),'#eaf4f7',1.5);
  c.fillStyle='#20455b';c.fillRect(40,57,98,33);c.fillStyle='#315c74';c.fillRect(44,61,90,25);
  // Nonluminous vents and sockets. Runtime indicators must use actual flow fields.
  for(let i=0;i<7;i++){c.fillStyle='#7597a9';c.fillRect(41+i*13,104,7,9);}
  for(const y of[61,91]){a.ellipse(c,19,y,8,7,'#42677b');a.ellipse(c,164,y,8,7,'#42677b');}
  for(const x of[32,147])for(const y of[46,119])a.ellipse(c,x,y,1.8,1.8,'#7c9aaa');c.restore();
}
function device(c,w,h,a){
  c.save();c.scale(w/160,h/160);a.ellipse(c,82,138,65,10,'#23415425');
  a.path(c,[[32,28],[115,28],[139,44],[139,121],[117,137],[32,137],[21,124],[21,42]],'#7597a8');
  a.path(c,[[32,28],[115,28],[128,39],[34,39],[21,42]],'#edf5f7');
  a.path(c,[[34,39],[117,39],[117,124],[34,124]],a.linear(c,34,39,117,124,[[0,'#f5f8f8'],[1,'#b7ced9']]),'#eef7f9',1.2);
  a.path(c,[[117,39],[139,44],[139,121],[117,137]],'#6d90a3');
  c.fillStyle='#244c63';c.fillRect(47,55,57,31);c.fillStyle='#4b7188';c.fillRect(51,59,49,23);
  for(let i=0;i<5;i++){c.fillStyle='#7797a8';c.fillRect(47,99+i*4,57,1.5);}
  a.ellipse(c,128,68,5,5,'#8ba7b5');a.ellipse(c,128,68,2.7,2.7,'#456a80');
  for(const x of[39,111])for(const y of[46,118])a.ellipse(c,x,y,1.7,1.7,'#7c9aaa');c.restore();
}
function dial(c,w,h,a){
  c.save();c.scale(w/160,h/160);a.ellipse(c,80,85,70,66,'#203e5420');
  a.ellipse(c,80,78,68,68,a.linear(c,25,12,136,144,[[0,'#f7fbfc'],[.4,'#c6dce6'],[1,'#6f96ae']]));
  a.ellipse(c,80,78,59,59,'#edf4f5');a.ellipse(c,80,78,53,53,'#c2d8e2');
  c.lineCap='round';for(let i=0;i<24;i++){const t=i*Math.PI/12;c.strokeStyle=i%2?'#87a5b5':'#456b82';c.lineWidth=i%2?1:2;c.beginPath();c.moveTo(80+Math.cos(t)*46,78+Math.sin(t)*46);c.lineTo(80+Math.cos(t)*(i%2?49:52),78+Math.sin(t)*(i%2?49:52));c.stroke();}
  a.ellipse(c,80,78,38,38,'#e8f0f2');c.restore();
}
function sun(c,w,h,a){
  c.save();c.scale(w/128,h/128);a.ellipse(c,64,64,56,56,a.radial(c,64,64,56,[[0,'#f5cb6f35'],[.7,'#f5cb6f14'],[1,'#f5cb6f00']]));
  c.lineCap='round';c.strokeStyle='#dfae56';c.lineWidth=4;
  for(let i=0;i<8;i++){const t=i*Math.PI/4;c.beginPath();c.moveTo(64+Math.cos(t)*36,64+Math.sin(t)*36);c.lineTo(64+Math.cos(t)*46,64+Math.sin(t)*46);c.stroke();}
  a.ellipse(c,64,64,28,28,a.linear(c,43,37,83,91,[[0,'#fff1c4'],[.45,'#f2cc78'],[1,'#cc9648']]));a.ellipse(c,57,56,14,12,'#fff6d544');c.restore();
}
const atlas={builtins:[],tiles:[
  {name:'solar_roof',x:0,y:0,w:512,h:224,paint:roof},
  {name:'solar_panel',x:512,y:0,w:256,h:192,paint:panel},
  {name:'solar_battery',x:768,y:0,w:192,h:224,paint:battery},
  {name:'solar_bus',x:0,y:224,w:192,h:160,paint:bus},
  {name:'solar_device',x:192,y:224,w:160,h:160,paint:device},
  {name:'solar_dial',x:352,y:224,w:160,h:160,paint:dial},
  {name:'solar_sun',x:512,y:224,w:128,h:128,paint:sun}
]};

const INK='#193e56',PALE='#eef5f5',MUTED='#a9c4d2',BLUE='#72bddc',GOLD='#edc77e',GOOD='#a9d7ac',BAD='#efb29d';
function number(n,dp=1){return Number.isInteger(n)?String(n):n.toFixed(dp);}
function thresholdNumber(n,limit){const label=number(n);return n<limit&&Number(label)>=limit?number(Math.floor(n*10)/10):label;}
function center(r,text,x,y,size,color){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
function outline(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function fraction(value,total){return Math.max(0,Math.min(1,value/total));}
function wire(r,points,watts,s,color){
  for(let i=1;i<points.length;i++)r.line(points[i-1][0],points[i-1][1],points[i][0],points[i][1],4.5,'#4a73834d');
  if(!(watts>0))return;
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=lengths.reduce((a,b)=>a+b,0);
  for(let i=1;i<points.length;i++)r.line(points[i-1][0],points[i-1][1],points[i][0],points[i][1],2,color);
  // Dots indicate an actual positive flow, not a second power simulation or a predicted arrival.
  for(let j=0;j<2;j++){let distance=((s.elapsed*.38+j*.5)%1)*total;
    for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const t=distance/lengths[i];r.circle(points[i][0]+(points[i+1][0]-points[i][0])*t,points[i][1]+(points[i+1][1]-points[i][1])*t,2.7,color);break;}distance-=lengths[i];}
  }
}
function sunlight(r,s){
  const solar=s.solar,flow=s.lastFlow,x=52,y=120,w=496;
  r.rect(30,73,540,78,'#254c60');
  const label=!flow?'READY / NO FLOW SAMPLE':solar.shadowed?'SHADE / '+solar.periodId.toUpperCase():solar.periodId.toUpperCase();
  r.text(label,46,83,18,PALE);r.text(flow?'SAMPLE '+flow.fromTime.toFixed(2)+' s':'FIRST INTERVAL PENDING',335,87,13,MUTED);
  for(const period of s.sunPeriods){const left=x+period.start/s.timeLimit*w,right=x+period.end/s.timeLimit*w;
    r.rect(left,y,right-left,8,period.id==='night'?'#112f43':period.id==='noon'?'#e4bc72':'#a2bdc7');
    center(r,period.id.toUpperCase(),(left+right)/2,133,13,PALE);
  }
  for(const shade of s.shadowWindows){const left=x+shade.start/s.timeLimit*w,right=x+shade.end/s.timeLimit*w;r.rect(left,y,right-left,8,'#4d6172');for(let px=left+2;px<right;px+=5)r.line(px,y,Math.min(px+3,right),y+8,1,'#acbcc5');}
  if(flow){const px=x+flow.fromTime/s.timeLimit*w;r.line(px,y-4,px,y+12,2.2,'#fff8e4');r.circle(px,y-4,3,'#fff8e4');}
}
function plant(r,s){
  const solar=s.solar,b=s.battery,f=s.lastFlow;
  r.sprite('solar_roof',300,323,540,330,0,'#fff');
  r.text('SOLAR '+number(solar.generationW)+' W',47,158,22,INK);r.text('PANEL '+solar.orientation,337,160,19,INK);
  r.text('RATED '+number(solar.ratedW)+' W',47,185,13,INK);
  r.sprite('solar_panel',184,307,188,141,solar.panelAngleDeg*Math.PI/180,'#fff');
  r.sprite('solar_bus',350,313,67,56,0,'#fff');r.sprite('solar_battery',451,284,144,168,0,'#fff');
  // The cabinet's empty baked gauge has a fixed local window; only this overlay represents stored energy.
  const fill=fraction(b.energyJ,b.capacityJ);r.rect(418.5,317-fill*68.25,30.5,fill*68.25,'#77b7c6');
  r.text('STORED ENERGY',369,375,13,INK);r.text(number(b.energyJ)+' / '+number(b.capacityJ)+' J',369,395,21,INK);
  r.text('TEMPERATURE',369,427,13,INK);r.text(thresholdNumber(b.temperatureC,b.thermalLimitC)+' / '+number(b.thermalLimitC)+' C',369,447,20,INK);
  r.text('CHG '+number(b.chargeW)+' / '+number(b.maxChargeW)+' W',47,432,15,INK);
  r.text('DIS '+number(b.dischargeW)+' / '+number(b.maxDischargeW)+' W',47,454,15,INK);
  r.text('SPILL '+number(f?f.spillW:0)+' W',47,476,15,INK);
  wire(r,[[286,313],[317,313]],f?f.solarW:0,s,GOLD);
  if(b.dischargeW>0)wire(r,[[410,313],[385,313]],b.dischargeW,s,BLUE);else wire(r,[[385,313],[410,313]],b.chargeW,s,GOOD);
  // Three visible branches correspond to actual device deliveredW, not enabled/requested power.
  s.devices.forEach((d,i)=>{const y=132+i*138,x=576+i*6;wire(r,[[350,342],[350,493-i*4],[x,493-i*4],[x,y],[600,y]],d.deliveredW,s,[GOLD,BLUE,GOOD][i]);});
}
function deviceCards(r,s){
  s.devices.forEach((d,i)=>{
    const x=600,y=80+i*138,selected=s.phase==='playing'&&d.id===s.selectedId;
    r.rect(x,y,332,132,'#203f54');r.rect(x,y,5,132,[GOLD,BLUE,GOOD][i]);
    if(selected)outline(r,x,y,332,132,'#eff8f6',2.2);
    r.text(d.id,x+15,y+12,20,PALE);r.text(d.nameEn,x+53,y+15,15,PALE);
    r.text('P'+d.priority,x+235,y+17,13,MUTED);r.text(d.enabled?'ON':'OFF',x+275,y+12,19,d.enabled?GOOD:BAD);
    const supplied=d.deliveredW+1e-8>=d.demandW;
    const status=!s.lastFlow?'NO SAMPLE':!d.enabled?'OFF':supplied?'FULL':d.deliveredW>0?'PARTIAL':'NO POWER';
    r.text(number(d.deliveredW)+' / '+number(d.demandW)+' W',x+15,y+42,21,PALE);r.text(status,x+229,y+47,13,!s.lastFlow?MUTED:supplied?GOOD:BAD);
    const received=d.quotaMet?number(d.deliveredJ):number(Math.floor(d.deliveredJ*10)/10);
    r.text('QUOTA '+received+' / '+number(d.quotaJ)+' J',x+15,y+74,16,PALE);if(d.quotaMet)r.text('MET',x+280,y+74,16,GOOD);
    r.rect(x+15,y+98,302,6,'#102b3e');r.rect(x+15,y+98,302*fraction(d.deliveredJ,d.quotaJ),6,d.quotaMet?GOOD:BLUE);
    if(d.critical){const limit=d.maxBrownoutTicks/60;r.text('GAP '+thresholdNumber(d.brownoutSeconds,limit)+' / '+number(limit)+' s',x+15,y+112,14,d.brownoutTicks>0?BAD:MUTED);r.text('CRITICAL',x+237,y+112,13,BAD);}
    else r.text('FLEXIBLE LOAD',x+15,y+112,14,MUTED);
  });
}
function footer(r,s){
  r.rect(28,508,904,27,'#1b3c51');const selected=s.devices.find(d=>d.id===s.selectedId);
  const main=s.phase==='won'?'DAY COMPLETE / EVERY QUOTA MET':s.phase==='lost'?s.lostReason==='heat'?'BATTERY TEMPERATURE LIMIT':s.lostReason==='brownout'?'CRITICAL SUPPLY GAP LIMIT':'DAY COMPLETE / QUOTA MISSING':'A: PANEL E > S > W / B: '+selected.id+' SWITCH';
  r.text(main,43,514,14,PALE);const quota='QUOTAS '+s.quotaMetCount+'/'+s.deviceCount;r.text(quota,915-r.measureText(quota,17),512,17,PALE);
}
function scene(r,s){
  r.rect(0,0,960,540,'#dce8ee');r.rect(0,0,960,54,'#173a53');r.text('SOLAR SHIFT',25,15,25,PALE);
  const right=s.phase==='won'?'DAY COMPLETE':s.phase==='lost'?'STATION STOPPED':'ROOFTOP CONTROL / '+String(s.level).padStart(2,'0');r.text(right,932-r.measureText(right,14),23,14,MUTED);
  plant(r,s);sunlight(r,s);deviceCards(r,s);footer(r,s);
}
root.GameDef={
  id:'solar-shift',title:'逐日供电',tagline:'独立配额，共用余电，守过一昼夜',seed:421,accent:'#9bc8db',background:'#dce8ee',levelLabel:'站点',levelNames:['信标','泵站','诊所'],atlas,
  description:'方向选设备。A 让全局面板按东、南、西转向，B 开关选中设备。撑过昼夜并分别完成三台配额；高优先级先取电。关键设备关着也累计连续欠供，电池过热会失败。',
  controls:{move:'方向键 / 摇杆 · 选择',a:'面板转向 / 空格',b:'设备开关 / B'},actionLabels:['转向','开关'],tip:'设备达标后不会自动关闭。关键设备关着也算欠供。',winTitle:'昼夜供电完成',loseTitle:'供电任务中断',
  result(s){if(s.phase==='won')return '三台设备各自达标，并已守过夜间。';if(s.lostReason==='heat')return '电池达到温度上限。留意实际充放电功率。';if(s.lostReason==='brownout')return '关键设备连续欠供过久，关闭也计入缺电。';return '昼夜已结束，仍有设备未完成独立配额。';},
  hud(s){const d=s.devices.find(d=>d.id===s.selectedId);return[
    {label:'选中设备',value:d.id+' '+d.name,tone:d.critical&&d.brownoutTicks>0?'warn':''},
    {label:'电池余量',value:number(s.battery.energyJ)+' J',tone:s.battery.energyJ===0?'warn':''},
    {label:'电池温度',value:thresholdNumber(s.battery.temperatureC,s.battery.thermalLimitC)+' °C',tone:s.phase==='lost'&&s.lostReason==='heat'?'warn':''},
    {label:'昼夜剩余',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<10?'warn':''}
  ];},render(r,s){scene(r,s);}
};
})(window);
