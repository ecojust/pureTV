'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Model=require('../src/main/assets/game-model.js'),DT=1/60,EPS=1e-8,clone=v=>JSON.parse(JSON.stringify(v));
const tick=(s,input={})=>Model.step(s,DT,input);
function tap(s,input){tick(s,input);tick(s);}
function close(a,b,tolerance=EPS){assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b} within ${tolerance}`);}
function clock(s,n){s.tick=n;s.elapsed=n/60;s.remaining=60-s.elapsed;}
// Explicit arithmetic/last-interval fixtures, never claimed as ordinary games.
// A synthetic prior-energy ledger funds any injected historical quota totals;
// no model hook, automatic controller or author control witness is imported.
function fixture({level=0,at=0,energy,temperature,enabled,delivered}={}){
 const s=Model.create(1,level);clock(s,at);if(energy!==undefined)s.battery.energyJ=energy;if(temperature!==undefined)s.battery.temperatureC=temperature;
 if(enabled)s.devices.forEach((d,i)=>d.enabled=enabled[i]);if(delivered)s.devices.forEach((d,i)=>d.deliveredJ=delivered[i]);
 const prior=s.devices.reduce((n,d)=>n+d.deliveredJ,0);s.battery.initialEnergyJ=s.battery.energyJ;s.ledger.initialBatteryJ=s.battery.energyJ;s.ledger.solarJ=prior;s.ledger.deliveredJ=prior;return s;
}
function audit(s){
 const b=s.battery,l=s.ledger,f=s.lastFlow;assert.ok(b.energyJ>=0&&b.energyJ<=b.capacityJ);assert.ok(b.temperatureC>=b.ambientC);assert.ok(b.chargeW>=0&&b.chargeW<=b.maxChargeW+EPS);assert.ok(b.dischargeW>=0&&b.dischargeW<=b.maxDischargeW+EPS);assert.equal(b.chargeW*b.dischargeW,0);
 close(l.initialBatteryJ+l.solarJ,b.energyJ+l.deliveredJ+l.spilledJ);close(l.energyErrorJ,0);close(l.deliveredJ,s.devices.reduce((n,d)=>n+d.deliveredJ,0));assert.ok(l.spilledJ>=0);
 for(const d of s.devices){assert.ok(d.deliveredW>=0&&d.deliveredW<=d.requestedW+EPS);assert.equal(d.quotaMet,d.deliveredJ>=d.quotaJ-EPS);assert.equal(d.brownoutSeconds,d.brownoutTicks/60);if(!d.critical)assert.equal(d.brownoutTicks,0);}
 assert.equal(s.quotaMetCount,s.devices.filter(d=>d.quotaMet).length);assert.equal(s.allQuotasMet,s.quotaMetCount===3);assert.equal(s.elapsed,s.tick/60);assert.equal(s.remaining,Math.max(0,60-s.elapsed));
 const points=s.devices.reduce((n,d)=>n+(d.quotaMet?200:Math.floor(200*Math.min(1,d.deliveredJ/d.quotaJ))),0);assert.equal(s.score,points+(s.phase==='won'?1000+2*Math.floor(b.energyJ+EPS):0));
 if(f){assert.equal(f.id,s.tick);close(f.toTime-f.fromTime,DT);assert.equal(f.toTime,s.elapsed);close(f.batteryAfterJ-f.batteryBeforeJ,f.chargeJ-f.dischargeJ);close(f.solarJ+f.dischargeJ,f.deliveredJ+f.chargeJ+f.spillJ);close(f.deliveredJ,f.deviceFlows.reduce((n,d)=>n+d.deliveredJ,0));close(f.requestedW-f.deliveredW,f.unservedW);for(const key of['solar','delivered','charge','discharge','spill'])close(f[key+'W']*DT,f[key+'J']);}
 if(s.failure)assert.deepEqual(s.failure.missingQuotaDeviceIds,s.devices.filter(d=>!d.quotaMet).map(d=>d.id));
}
function frozen(s){const before=clone(s);for(const dt of[0,DT,.25,100,NaN])Model.step(s,dt,{aPressed:true,bPressed:true,x:1,cancelEpoch:100,cancelled:true});assert.deepEqual(s,before);}

test('public UMD specifications start with real zero-flow telemetry and independent fixed equipment',()=>{
 assert.deepEqual(Object.keys(Model).sort(),['TICK_HZ','create','step']);assert.equal(Model.TICK_HZ,60);const browser={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/main/assets/game-model.js'),'utf8'),browser);assert.deepEqual(clone(browser.PureModel.create(8,1)),Model.create(8,1));
 for(let level=0;level<3;level++){const s=Model.create(8,level);assert.equal(s.deviceCount,3);assert.deepEqual(s.devices.map(d=>d.id),['D1','D2','D3']);assert.deepEqual(s.devices.map(d=>d.priority),[1,2,3]);assert.equal(s.devices.filter(d=>d.critical).length,level===2?2:1);assert.ok(s.devices.every(d=>d.enabled&&/^[A-Z]+$/.test(d.nameEn)));assert.ok(s.devices.every(d=>d.requestedW===0&&d.deliveredW===0&&d.deliveredJ===0));
  assert.equal(s.solar.periodId,'dawn');assert.equal(s.solar.orientation,'E');assert.equal(s.solar.alignment,1);assert.equal(s.solar.generationW,0);assert.equal(s.lastFlow,null);assert.equal(s.lastOperation,null);assert.equal(s.score,0);assert.equal(s.timeLimit,60);assert.equal(s.battery.energyJ,[36,55,65][level]);assert.equal(s.battery.capacityJ,[90,105,120][level]);assert.deepEqual(s.sunPeriods.map(p=>p.name),['晨光','正午','夕照','夜间']);audit(s);
 }
});

test('A rotates the global panel immediately for the committed interval and operation IDs are sparse actual ticks',()=>{
 const s=Model.create();tick(s,{a:true});assert.equal(s.solar.orientation,'S');assert.equal(s.solar.panelAngleDeg,0);close(s.solar.generationW,6);assert.equal(s.lastOperation.id,1);assert.equal(s.lastOperation.at,DT);assert.equal(s.lastFlow.fromTime,0);assert.equal(s.lastFlow.toTime,DT);
 for(let i=0;i<6;i++)tick(s);tick(s,{x:1,a:true});assert.equal(s.selectedId,'D2');assert.equal(s.solar.orientation,'W');assert.equal(s.solar.generationW,0);assert.equal(s.lastOperation.deviceId,null);assert.equal(s.lastOperation.id,8);assert.equal(s.panelTurns,2);tick(s);tap(s,{a:true});assert.equal(s.solar.orientation,'E');close(s.solar.generationW,12);assert.equal(s.panelTurns,3);audit(s);
});

test('weather uses half-open interval start times, with shadow generation zero and no fictitious night alignment',()=>{
 const s=fixture({at:599});tick(s);assert.equal(s.lastFlow.fromTime,599/60);assert.equal(s.solar.shadowed,false);close(s.solar.generationW,12);tick(s);assert.equal(s.lastFlow.fromTime,10);assert.equal(s.solar.shadowed,true);assert.equal(s.solar.generationW,0);assert.equal(s.solar.irradiance,.8);assert.equal(s.solar.alignment,1);
 const clear=fixture({at:780});tick(clear);assert.equal(clear.solar.shadowed,false);close(clear.solar.generationW,12);
 const noon=fixture({at:839});tick(noon);assert.equal(noon.solar.periodId,'dawn');tick(noon,{a:true});assert.equal(noon.solar.periodId,'noon');assert.equal(noon.lastFlow.fromTime,14);close(noon.solar.generationW,15);
 for(let orientation=0;orientation<3;orientation++){const night=fixture({at:2520});night.solar.orientationIndex=orientation;tick(night);assert.equal(night.solar.periodId,'night');assert.equal(night.solar.sunAngleDeg,null);assert.equal(night.solar.alignment,0);assert.equal(night.solar.generationW,0);audit(night);}
});

test('all devices share one discharge allowance; fixed priority and finite remaining joules determine partial service',()=>{
 const s=fixture({at:2520,energy:20});tick(s);assert.deepEqual(s.devices.map(d=>d.deliveredW).map(v=>Math.round(v*1e8)/1e8),[4,3,1]);close(s.lastFlow.requestedW,12);close(s.lastFlow.deliveredW,8);close(s.lastFlow.unservedW,4);close(s.battery.dischargeW,8);close(s.battery.energyJ,20-8*DT);assert.equal(s.battery.chargeW,0);audit(s);
 const low=fixture({at:2520,energy:3*DT});tick(low);close(low.devices[0].deliveredW,3);assert.equal(low.devices[0].brownoutTicks,1);assert.equal(low.devices[1].deliveredW,0);assert.equal(low.devices[2].deliveredW,0);close(low.battery.dischargeW,3);assert.equal(low.battery.energyJ,0);audit(low);tick(low);assert.equal(low.battery.dischargeW,0);assert.equal(low.devices[0].brownoutTicks,2);assert.equal(low.battery.energyJ,0);audit(low);
});

test('charge rate and capacity room both limit storage; surplus is explicit spill without simultaneous discharge',()=>{
 const rate=fixture({energy:40,enabled:[true,false,false]});tick(rate);close(rate.battery.chargeW,5);close(rate.battery.energyJ,40+5*DT);close(rate.lastFlow.spillW,3);assert.equal(rate.battery.dischargeW,0);audit(rate);
 const full=fixture({energy:90-.02,enabled:[true,false,false]});tick(full);close(full.lastFlow.chargeJ,.02);close(full.battery.chargeW,1.2);assert.equal(full.battery.energyJ,90);close(full.lastFlow.spillW,6.8);audit(full);tick(full);assert.equal(full.battery.chargeW,0);assert.equal(full.battery.dischargeW,0);close(full.lastFlow.spillW,8);assert.equal(full.battery.energyJ,90);audit(full);
});

test('a short ordinary-input flow exercise conserves joules through charge, discharge and spill without a full-game controller',()=>{
 const s=Model.create(1,1);for(let i=0;i<120;i++){const phase=i%30,input=phase===0?{a:true}:phase===2?{y:1}:phase===4?{b:true}:{};tick(s,input);assert.equal(s.phase,'playing');audit(s);}assert.equal(s.elapsed,2);assert.ok(s.ledger.chargedJ>0);assert.ok(s.ledger.dischargedJ>0);assert.ok(s.ledger.spilledJ>0);assert.ok(s.ledger.solarJ>0);assert.ok(s.devices.every(d=>d.deliveredJ>=0));
});

test('critical OFF and partial power accumulate continuous brownout; full service alone resets it',()=>{
 const s=Model.create();tick(s,{b:true});assert.equal(s.devices[0].enabled,false);assert.equal(s.devices[0].requestedW,0);assert.equal(s.devices[0].deliveredW,0);assert.equal(s.devices[0].brownoutTicks,1);for(let i=0;i<8;i++)tick(s);assert.equal(s.devices[0].brownoutTicks,9);tick(s,{b:true});assert.equal(s.devices[0].enabled,true);close(s.devices[0].deliveredW,4);assert.equal(s.devices[0].brownoutTicks,0);audit(s);
 for(const difference of[EPS/2,2*EPS]){const edge=fixture({at:2520,energy:(4-difference)*DT});tick(edge);assert.equal(edge.devices[0].brownoutTicks,difference<EPS?0:1);assert.ok(edge.devices[0].deliveredJ>0);audit(edge);}
 const both=fixture({level:2,enabled:[false,false,true]});both.devices[0].brownoutTicks=119;both.devices[1].brownoutTicks=89;tick(both);assert.equal(both.lostReason,'brownout');assert.deepEqual(both.failure.deviceIds,['D1','D2']);assert.equal(both.devices[2].brownoutTicks,0);audit(both);
});

test('device quotas use actual delivered energy, oversupply cannot substitute, and tolerance scores complete devices as 200',()=>{
 const s=fixture({enabled:[true,false,false],delivered:[300,72-EPS/2,0]});tick(s);assert.equal(s.devices[0].quotaMet,true);assert.equal(s.devices[1].quotaMet,true);assert.equal(s.devices[2].quotaMet,false);assert.equal(s.devices[1].deliveredJ,72-EPS/2);assert.equal(s.quotaMetCount,2);assert.equal(s.allQuotasMet,false);assert.equal(s.score,400);assert.equal(s.phase,'playing');assert.ok(s.devices[0].deliveredJ>300);audit(s);
 const early=fixture({delivered:[224,72,60]});tick(early);assert.equal(early.allQuotasMet,true);assert.equal(early.phase,'playing');assert.equal(early.score,600);assert.equal(early.devices[0].enabled,true);assert.ok(early.devices[0].deliveredJ>224);audit(early);
});

test('thermal dynamics use actual battery power squared, not requested power, and retain passive cooling',()=>{
 for(const enabled of[[true,true,true],[true,false,false]]){const s=fixture({at:2520,energy:3*DT,temperature:26,enabled});tick(s);close(s.battery.dischargeW,3);close(s.battery.thermalRateCPerSecond,.1*9-.08*2);close(s.battery.temperatureC,26+(.9-.16)*DT);audit(s);}
 const charge=fixture({energy:90-.02,temperature:26,enabled:[true,false,false]});tick(charge);close(charge.battery.thermalRateCPerSecond,.05*1.2**2-.08*2);close(charge.battery.temperatureC,26+(.05*1.2**2-.08*2)*DT);audit(charge);
 const cooling=fixture({at:2520,temperature:34,enabled:[false,false,false]});tick(cooling);assert.equal(cooling.battery.chargeW,0);assert.equal(cooling.battery.dischargeW,0);close(cooling.battery.thermalRateCPerSecond,-.8);close(cooling.battery.temperatureC,34-.8*DT);audit(cooling);
});

test('the final interval supplies actual energy before quota settlement and scoring epsilon does not alter stored joules',()=>{
 // Explicit last-interval quota/energy fixture, not an ordinary 60-second win.
 const final=fixture({at:3599,energy:18+8*DT-3e-9,temperature:24,delivered:[224-4*DT,72-3*DT,60-DT]});tick(final);assert.equal(final.tick,3600);assert.equal(final.phase,'won');assert.equal(final.lastFlow.fromTime,3599/60);assert.equal(final.lastFlow.toTime,60);assert.ok(final.battery.energyJ<18);close(final.battery.energyJ,18-3e-9);assert.equal(final.score,1636);assert.equal(final.allQuotasMet,true);audit(final);frozen(final);
 const missing=fixture({at:3599,energy:10,temperature:24,delivered:[224-4*DT,72-3*DT,60-DT-.01]});tick(missing);assert.equal(missing.lostReason,'quota');assert.deepEqual(missing.failure.deviceIds,['D3']);assert.ok(missing.devices[2].deliveredJ>60-DT-.01);close(missing.battery.energyJ,10-8*DT);audit(missing);
});

test('same-interval heat has priority over brownout, and brownout over complete end-of-day quotas',()=>{
 for(const overheat of[true,false]){const s=fixture({at:3599,energy:20,temperature:overheat?58-.001:24,enabled:[false,true,true],delivered:[224,72,60]});s.devices[0].brownoutTicks=149;tick(s);assert.equal(s.tick,3600);assert.equal(s.allQuotasMet,true);assert.equal(s.devices[0].brownoutTicks,150);assert.equal(s.lostReason,overheat?'heat':'brownout');assert.deepEqual(s.failure.deviceIds,overheat?[]:['D1']);assert.deepEqual(s.failure.missingQuotaDeviceIds,[]);assert.ok(s.lastFlow.dischargeJ>0);close(s.battery.energyJ,20-8*DT);audit(s);frozen(s);}
});

test('B suppresses coalesced A/navigation for one tick, with real held edges, clamped card selection and the shared repeat delay',()=>{
 const s=Model.create();tick(s,{a:true,b:true,y:1});assert.equal(s.selectedId,'D1');assert.equal(s.toggleCount,1);assert.equal(s.panelTurns,0);assert.equal(s.devices[0].enabled,false);tick(s,{a:true,b:true,y:1});assert.equal(s.selectedId,'D2');for(let i=0;i<19;i++)tick(s,{a:true,b:true,y:1});assert.equal(s.selectedId,'D2');tick(s,{a:true,b:true,y:1});assert.equal(s.selectedId,'D3');assert.equal(s.toggleCount,1);assert.equal(s.panelTurns,0);
 tick(s,{x:-.24});assert.equal(s.selectedId,'D3');tick(s,{x:-.25,y:.25});assert.equal(s.selectedId,'D2');tick(s,{x:Infinity,y:-1});assert.equal(s.selectedId,'D1');tick(s);tick(s,{x:-1});assert.equal(s.lastAction.type,'select-blocked');assert.equal(s.selectedId,'D1');audit(s);
});

test('subtick A/B waits for integration; cancelled controls never stop weather, thermal or service clocks',()=>{
 const s=Model.create();Model.step(s,0,{aPressed:true});assert.equal(s.panelTurns,0);assert.equal(s.tick,0);Model.step(s,DT/2,{});assert.equal(s.panelTurns,0);Model.step(s,DT/2,{});assert.equal(s.panelTurns,1);assert.equal(s.tick,1);close(s.solar.generationW,6);
 tick(s,{cancelEpoch:1});Model.step(s,DT/2,{aPressed:true,bPressed:true});const oldTick=s.tick,oldEnergy=s.battery.energyJ;Model.step(s,DT/2,{cancelEpoch:2,cancelled:true,y:1});assert.equal(s.tick,oldTick+1);assert.equal(s.panelTurns,1);assert.equal(s.toggleCount,0);assert.equal(s.selectedId,'D1');assert.ok(s.battery.energyJ<oldEnergy);
 for(let i=0;i<3;i++)tick(s,{a:true,b:true,aPressed:true,bPressed:true,cancelled:true});tick(s,{a:true,b:true});assert.equal(s.panelTurns,1);assert.equal(s.toggleCount,0);tick(s);tick(s,{b:true});assert.equal(s.toggleCount,1);assert.equal(s.devices[0].brownoutTicks,1);audit(s);
});

test('receipts are detached, retry is fresh and deterministic, JSON continuation and bounded finite input remain valid',()=>{
 const s=Model.create();tick(s,{a:true});assert.notStrictEqual(s.lastAction,s.lastOperation);assert.notStrictEqual(s.events[0],s.lastAction);const operation=clone(s.lastOperation),flow=s.lastFlow,priorFlow=clone(flow);tick(s);assert.notStrictEqual(s.lastFlow,flow);assert.deepEqual(flow,priorFlow);assert.deepEqual(s.lastOperation,operation);const copied=clone(s);tick(s);tick(copied);assert.deepEqual(s,copied);audit(s);
 for(let level=0;level<3;level++){const original=Model.create(8,level),initial=clone(original);tap(original,{b:true});const retry=Model.create(8,level);assert.deepEqual(retry,initial);for(const key of['devices','solar','battery','ledger','sunPeriods','shadowWindows','events'])assert.notStrictEqual(original[key],retry[key]);}
 const bounded=Model.create();for(const dt of[NaN,Infinity,-1])Model.step(bounded,dt,{});assert.equal(bounded.tick,0);Model.step(bounded,100,{aPressed:true});assert.equal(bounded.tick,15);assert.equal(bounded.panelTurns,1);assert.ok(bounded.events.length<=32);assert.equal(Model.create(NaN,99).level,3);function finite(v){if(typeof v==='number')assert.ok(Number.isFinite(v));else if(v&&typeof v==='object')Object.values(v).forEach(finite);}finite(bounded);audit(bounded);
});
