(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PureModel=api;}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var HZ=60,DT=1/HZ,EPS=1e-8,TICK_EPS=1e-10,ORIENTATIONS=['E','S','W'],ANGLES=[-60,0,60];
  var PERIODS=[{id:'dawn',name:'晨光',start:0,end:14,angleDeg:-60,irradiance:.8},{id:'noon',name:'正午',start:14,end:28,angleDeg:0,irradiance:1},{id:'dusk',name:'夕照',start:28,end:42,angleDeg:60,irradiance:.8},{id:'night',name:'夜间',start:42,end:60,angleDeg:null,irradiance:0}];
  // Public equipment specifications only; no policy, switch schedule or answer.
  var LEVELS=[
    {name:'海边信标',rated:15,shadows:[[10,13],[25,28]],capacity:90,energy:36,charge:5,ambient:24,temperature:26,limit:58,cooling:.08,devices:[['信标',4,224,150,'BEACON'],['水泵',3,72,null,'PUMP'],['工坊',5,60,null,'WORKSHOP']]},
    {name:'山谷泵站',rated:17.5,shadows:[[5,11],[30,33]],capacity:105,energy:55,charge:4.5,ambient:26,temperature:32,limit:54,cooling:.10,devices:[['监测站',4,224,150,'MONITOR'],['水泵',4,76,null,'PUMP'],['通信站',5,70,null,'RADIO']]},
    {name:'夜间诊所',rated:20,shadows:[[8,12],[24,28]],capacity:120,energy:65,charge:6,ambient:25,temperature:29,limit:62,cooling:.10,devices:[['诊疗灯',3,170,120,'CLINIC'],['冷藏箱',2,110,90,'FRIDGE'],['净水泵',5,100,null,'PURIFIER']]}
  ];
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function finite(v,fallback){return Number.isFinite(v)?v:fallback;}
  function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
  function action(s,type,details){s.lastAction=Object.assign({type:type,at:s.elapsed,tick:s.tick},details||{});s.events.push(copy(s.lastAction));}
  function direction(input){var x=clamp(finite(input.x,0),-1,1),y=clamp(finite(input.y,0),-1,1);if(Math.max(Math.abs(x),Math.abs(y))<.25)return null;return Math.abs(x)>=Math.abs(y)?(x>0?'E':'W'):(y>0?'S':'N');}
  function weather(s,fromTime,integrated){
    var solar=s.solar,period=s.sunPeriods.find(function(p){return fromTime>=p.start&&fromTime<p.end;})||s.sunPeriods[s.sunPeriods.length-1];
    solar.orientation=ORIENTATIONS[solar.orientationIndex];solar.panelAngleDeg=ANGLES[solar.orientationIndex];solar.periodId=period.id;solar.sunAngleDeg=period.angleDeg;solar.irradiance=period.irradiance;
    solar.shadowed=s.shadowWindows.some(function(w){return fromTime>=w.start&&fromTime<w.end;});
    var delta=period.angleDeg===null?180:Math.abs(solar.panelAngleDeg-period.angleDeg);solar.alignment=delta===0?1:delta===60?.5:0;
    solar.generationW=integrated&&!solar.shadowed?solar.ratedW*solar.irradiance*solar.alignment:0;
  }
  function score(s){s.score=s.devices.reduce(function(sum,d){return sum+(d.quotaMet?200:Math.floor(200*Math.min(1,d.deliveredJ/d.quotaJ)));},0)+(s.phase==='won'?1000+2*Math.floor(s.battery.energyJ+EPS):0);}
  function finish(s,reason){
    s.phase=reason?'lost':'won';s.lostReason=reason||null;
    if(reason){var missing=s.devices.filter(function(d){return!d.quotaMet;}).map(function(d){return d.id;});
      s.failure={reason:reason,deviceIds:reason==='brownout'?s.devices.filter(function(d){return d.critical&&d.brownoutTicks>=d.maxBrownoutTicks;}).map(function(d){return d.id;}):reason==='quota'?missing.slice():[],missingQuotaDeviceIds:missing,temperatureC:s.battery.temperatureC};}
    s.message=!reason?'昼夜完成，每台设备的独立供电配额均已达成':reason==='heat'?'电池过热：实际充放电功率使温度达到上限':reason==='brownout'?'关键设备连续欠供超时：关闭开关也会计入欠供':'昼夜结束：仍有设备未完成自己的供电配额';score(s);action(s,s.phase,{reason:s.lostReason});
  }
  function navigate(s,name){
    var current=s.devices.findIndex(function(d){return d.id===s.selectedId;}),next=clamp(current+(name==='E'||name==='S'?1:-1),0,s.devices.length-1),id=s.devices[next].id;
    action(s,id===s.selectedId?'select-blocked':'select',{direction:name,id:id});s.selectedId=id;
  }
  function operate(s,kind){
    var before,after,deviceId=null;
    if(kind==='rotate'){before=ORIENTATIONS[s.solar.orientationIndex];s.solar.orientationIndex=(s.solar.orientationIndex+1)%3;after=ORIENTATIONS[s.solar.orientationIndex];s.panelTurns++;}
    else{var d=s.devices.find(function(device){return device.id===s.selectedId;});before=d.enabled;d.enabled=!d.enabled;after=d.enabled;deviceId=d.id;s.toggleCount++;}
    s.lastOperation={id:s.tick,kind:kind,at:s.elapsed,tick:s.tick,before:before,after:after,deviceId:deviceId};action(s,kind,copy(s.lastOperation));
  }
  function flowMessage(s){
    if(s.devices.some(function(d){return d.critical&&d.deliveredW<d.demandW-EPS;}))return'关键设备未获足额供电：检查开关并削减非关键负载';
    if(s.allQuotasMet)return'所有配额已达成：继续维持关键设备供电至昼夜结束';
    if(s.solar.periodId==='night')return'夜间太阳板不发电：留意电池余量与各设备独立配额';
    if(s.solar.shadowed)return'阴影使发电为零：留意电池余量和关键设备供电';
    if(s.battery.dischargeW>EPS)return'负载正在使用电池补电：检查面板朝向与设备需求';
    if(s.battery.chargeW>EPS)return'剩余发电正在充电：为阴影和夜间保留电量';
    if(s.lastFlow.spillW>EPS)return'当前有未储存的余电：各设备配额仍需分别完成';
    return'当前发电供应负载：A 调整面板，B 切换所选设备';
  }
  function integrate(s,fromTime){
    weather(s,fromTime,true);var b=s.battery,oldE=b.energyJ,oldT=b.temperatureC,G=s.solar.generationW*DT;
    var ordered=s.devices.slice().sort(function(a,b){return a.priority-b.priority;}),R=ordered.reduce(function(sum,d){return sum+(d.enabled?d.demandW*DT:0);},0);
    // One shared battery allowance for the complete interval, not per device.
    var D=Math.min(Math.max(0,R-G),oldE,b.maxDischargeW*DT),C=Math.min(Math.max(0,G-R),b.capacityJ-oldE,b.maxChargeW*DT),available=G+D,delivered=0;
    var deviceFlows=ordered.map(function(d){var request=d.enabled?d.demandW*DT:0,X=Math.min(request,Math.max(0,available));available=Math.max(0,available-X);delivered+=X;
      d.requestedW=request/DT;d.deliveredW=X/DT;d.deliveredJ+=X;d.quotaMet=d.deliveredJ>=d.quotaJ-EPS;
      d.brownoutTicks=d.critical&&d.deliveredW<d.demandW-EPS?d.brownoutTicks+1:0;d.brownoutSeconds=d.brownoutTicks/HZ;
      return{deviceId:d.id,requestedW:d.requestedW,deliveredW:d.deliveredW,deliveredJ:X};
    });
    b.energyJ=clamp(oldE-D+C,0,b.capacityJ);b.chargeW=C/DT;b.dischargeW=D/DT;
    b.thermalRateCPerSecond=b.heatChargeCoefficient*b.chargeW*b.chargeW+b.heatDischargeCoefficient*b.dischargeW*b.dischargeW-b.coolingPerSecond*(oldT-b.ambientC);
    b.temperatureC=Math.max(b.ambientC,oldT+b.thermalRateCPerSecond*DT);var spill=Math.max(0,G+D-delivered-C);
    var ledger=s.ledger;ledger.solarJ+=G;ledger.deliveredJ=s.devices.reduce(function(sum,d){return sum+d.deliveredJ;},0);ledger.spilledJ+=spill;ledger.chargedJ+=C;ledger.dischargedJ+=D;
    ledger.energyErrorJ=ledger.initialBatteryJ+ledger.solarJ-b.energyJ-ledger.deliveredJ-ledger.spilledJ;
    s.quotaMetCount=s.devices.filter(function(d){return d.quotaMet;}).length;s.allQuotasMet=s.quotaMetCount===s.deviceCount;
    s.lastFlow={id:s.tick,fromTime:fromTime,toTime:s.elapsed,solarW:s.solar.generationW,requestedW:R/DT,deliveredW:delivered/DT,unservedW:Math.max(0,R-delivered)/DT,chargeW:b.chargeW,dischargeW:b.dischargeW,spillW:spill/DT,
      solarJ:G,deliveredJ:delivered,chargeJ:C,dischargeJ:D,spillJ:spill,batteryBeforeJ:oldE,batteryAfterJ:b.energyJ,temperatureBeforeC:oldT,temperatureAfterC:b.temperatureC,deviceFlows:deviceFlows};
    if(b.temperatureC>=b.thermalLimitC){finish(s,'heat');return;}
    if(s.devices.some(function(d){return d.critical&&d.brownoutTicks>=d.maxBrownoutTicks;})){finish(s,'brownout');return;}
    if(s.tick>=s.timeLimit*HZ){finish(s,s.allQuotasMet?null:'quota');return;}
    score(s);s.message=flowMessage(s);
  }
  function tick(s,dir){
    var fromTime=s.tick/HZ;s.tick++;s.elapsed=s.tick/HZ;s.remaining=Math.max(0,s.timeLimit-s.elapsed);
    if(!dir){s._heldDirection=null;s._nextMoveTick=0;}
    if(s._pendingB){s._pendingB=false;s._pendingA=false;operate(s,'toggle');}
    else{
      if(dir){if(dir!==s._heldDirection){s._heldDirection=dir;s._nextMoveTick=s.tick+20;navigate(s,dir);}else if(s.tick>=s._nextMoveTick){s._nextMoveTick=s.tick+10;navigate(s,dir);}}
      if(s._pendingA){s._pendingA=false;operate(s,'rotate');}
    }
    integrate(s,fromTime);
  }
  function create(seed,difficulty){
    var d=clamp(Math.floor(finite(difficulty,0)),0,2),p=LEVELS[d];
    var devices=p.devices.map(function(v,i){return{id:'D'+(i+1),name:v[0],nameEn:v[4],priority:i+1,demandW:v[1],quotaJ:v[2],critical:v[3]!==null,maxBrownoutTicks:v[3],enabled:true,requestedW:0,deliveredW:0,deliveredJ:0,quotaMet:false,brownoutTicks:0,brownoutSeconds:0};});
    var s={width:960,height:540,seed:finite(seed,1),level:d+1,difficulty:d,levelName:p.name,phase:'playing',tick:0,elapsed:0,timeLimit:60,remaining:60,score:0,message:'A 调整太阳板朝向；方向选择设备，B 切换其电源',lostReason:null,
      selectedId:'D1',deviceCount:3,devices:devices,sunPeriods:copy(PERIODS),shadowWindows:p.shadows.map(function(w){return{start:w[0],end:w[1]};}),
      solar:{ratedW:p.rated,orientationIndex:0,orientation:'E',panelAngleDeg:-60,periodId:null,sunAngleDeg:null,irradiance:0,shadowed:false,alignment:0,generationW:0},
      battery:{capacityJ:p.capacity,initialEnergyJ:p.energy,energyJ:p.energy,maxChargeW:p.charge,maxDischargeW:8,chargeW:0,dischargeW:0,ambientC:p.ambient,initialTemperatureC:p.temperature,temperatureC:p.temperature,thermalLimitC:p.limit,heatChargeCoefficient:.05,heatDischargeCoefficient:.10,coolingPerSecond:p.cooling,thermalRateCPerSecond:0},
      ledger:{initialBatteryJ:p.energy,solarJ:0,deliveredJ:0,spilledJ:0,chargedJ:0,dischargedJ:0,energyErrorJ:0},lastFlow:null,panelTurns:0,toggleCount:0,lastOperation:null,quotaMetCount:0,allQuotasMet:false,failure:null,lastAction:null,events:[],
      _accumulator:0,_lastA:false,_lastB:false,_pendingA:false,_pendingB:false,_heldDirection:null,_nextMoveTick:0,_cancelEpoch:null};
    weather(s,0,false);return s;
  }
  function step(s,dt,input){
    if(!s||s.phase!=='playing')return s;input=input||{};dt=clamp(finite(dt,0),0,.25);var cancelled=!!input.cancelled;
    if(Number.isFinite(input.cancelEpoch)){if(s._cancelEpoch!==null&&s._cancelEpoch!==input.cancelEpoch)cancelled=true;s._cancelEpoch=input.cancelEpoch;}
    var a=!!input.a,b=!!input.b;if(cancelled){s._pendingA=false;s._pendingB=false;s._heldDirection=null;s._nextMoveTick=0;}
    else{if((a&&!s._lastA)||input.aPressed)s._pendingA=true;if((b&&!s._lastB)||input.bPressed)s._pendingB=true;}
    s._lastA=a;s._lastB=b;s.events=[];s._accumulator+=dt;var dir=cancelled?null:direction(input);
    while(s._accumulator+TICK_EPS>=DT&&s.phase==='playing'){s._accumulator=Math.max(0,s._accumulator-DT);tick(s,dir);}if(s.events.length>32)s.events=s.events.slice(-32);return s;
  }
  return{create:create,step:step,TICK_HZ:HZ};
}));
