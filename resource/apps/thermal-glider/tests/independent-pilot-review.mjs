// Bounded synthetic public-observation review. No production model import,
// simulation, browser, authored route or normal-flight success is used here.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex'),app=new URL('..',import.meta.url);
const files=['tests/automation.mjs','src/main/assets/game-model.js','docs/model-contract.md'];
async function hashes(){return Object.fromEntries(await Promise.all(files.map(async file=>[file,hash(await readFile(new URL(file,app)))])));}
const sourceHashes=await hashes(),{createPilot}=await import(new URL('tests/automation.mjs',app));
let calls=0,privateReads=0,mutationAttempts=0;const checks=[],allKeys=[];
function freeze(v){if(v&&typeof v==='object'){for(const d of Object.values(Object.getOwnPropertyDescriptors(v)))if('value'in d)freeze(d.value);Object.freeze(v);}return v;}
function base(){return {phase:'playing',elapsed:0,flightMode:'glide',nextRing:0,
  glider:{x:0,z:0,altitude:50,airspeed:18,heading:0,bank:0,pitch:0,vx:0,vz:18,groundSpeed:18,verticalSpeed:-.7,flaps:false,thermalLift:0},
  physics:{gravity:9.81,maxBank:.55,maxPitch:.18,bankTau:.35,pitchTau:.28,maxAirspeed:32,brakeDeceleration:1.4,brakeSink:1.4,bankSinkFactor:.9,
    configurations:{clean:{bestSpeed:18,minSink:.7,polarCoefficient:.008,stallSpeed:10.5},flaps:{bestSpeed:14,minSink:.58,polarCoefficient:.018,stallSpeed:8.2}}},
  wind:{x:0,z:0},thermals:[{id:'public-thermal',x:0,z:50,radius:30,strength:3}],rings:[{id:'public-ring',x:20,z:100,altitude:60,radius:28,heading:0,passed:false}],
  runway:{x:0,z:250,heading:0,length:100,width:60,minAirspeed:8.7,maxAirspeed:13.5,maxGroundSpeed:14.5,maxSinkSpeed:1.8,maxBank:.18,minPitch:-.06,maxPitch:.12,maxHeadingError:.24,maxTrackError:.24}};}
function snapshot(model,{variant=0,guard=false,phase='playing',paused=false}={}){
  const m=structuredClone(model);
  for(const [node,names] of [[m,['_history','_route','_expected','_futureCheckpoint','_pendingB']],[m.glider,['_integratorRoute']],[m.physics,['_secretCoefficients']]])for(const name of names){
    if(guard)Object.defineProperty(node,name,{enumerable:true,get(){privateReads++;throw new Error('Private field read: '+name);}});
    else node[name]=variant?{unrelated:[99,42,'decoy']}:{route:['secret','different'],tick:99999};
  }
  freeze(m);const proxy=new Proxy(m,{get(t,k,r){if(guard&&typeof k==='string'&&k.startsWith('_')){privateReads++;throw new Error('Private field read: '+k);}return Reflect.get(t,k,r);},set(){mutationAttempts++;throw new Error('Observation mutation');},deleteProperty(){mutationAttempts++;throw new Error('Observation deletion');}});
  return Object.freeze({phase,paused,model:proxy});
}
function invoke(p,m,options){calls++;assert.ok(calls<=100,'Bounded observer review exceeded 100 calls');const keys=p(snapshot(m,options));assert.ok(Array.isArray(keys));assert.ok(keys.every(k=>['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','b'].includes(k)));assert.equal(new Set(keys).size,keys.length);allKeys.push(...keys);return keys;}
function test(name,fn){checks.push({name,passed:true,...fn()});}
test('identical public history yields identical keys with changed or unreadable private fields',()=>{
  const pa=createPilot(),pb=createPilot(),pg=createPilot(),steps=[];
  for(let i=0;i<12;i++){
    const m=base();m.elapsed=i/10;m.glider.x=i<5?i:0;m.glider.z=i<5?i*8:150;m.glider.altitude=i<5?50+i:15;
    if(i===3)m.glider.airspeed=m.glider.groundSpeed=26;
    if(i===4)m.glider.airspeed=m.glider.groundSpeed=15;
    if(i>=5){m.nextRing=1;m.rings[0].passed=true;m.flightMode='approach';}
    if(i>=7)m.glider.flaps=true;
    const options={paused:i===8,phase:i===9?'won':'playing'};
    if(i>=10){Object.assign(m,base());m.elapsed=(i-10)/10;}
    const before=JSON.stringify(m),a=invoke(pa,m,{...options,variant:0}),b=invoke(pb,m,{...options,variant:1}),guarded=invoke(pg,m,{...options,guard:true});
    assert.deepEqual(a,b);assert.deepEqual(a,guarded);assert.equal(JSON.stringify(m),before);steps.push({index:i,keys:a,paused:options.paused,phase:options.phase});
  }
  return {pairedPublicObservations:12,guardedObservationCalls:12,steps};
});
test('pilot factories keep flap and braking memory independent',()=>{
  const busy=createPilot(),fresh=createPilot(),reference=createPilot(),m=base();m.nextRing=1;m.elapsed=20;m.glider.airspeed=26;
  assert.ok(invoke(busy,m,{guard:true}).includes('b'));invoke(busy,{...m,elapsed:20.1},{guard:true});
  const view=base();assert.deepEqual(invoke(fresh,view,{guard:true}),invoke(reference,view,{guard:true}));return {separateFactories:true};
});
test('elapsed reset starts a fresh input history instead of retaining approach controls',()=>{
  const p=createPilot(),m=base();m.nextRing=1;m.elapsed=20;m.glider.airspeed=26;invoke(p,m,{guard:true});
  const reset=base();reset.glider.airspeed=23;assert.deepEqual(invoke(p,reset,{guard:true}),invoke(createPilot(),reset,{guard:true}));return {resetMatchesFreshFactory:true};
});
test('flap edge is released before another request and stops when deployment is observed',()=>{
  const p=createPilot(),m=base();m.nextRing=1;m.elapsed=20;assert.ok(invoke(p,m,{guard:true}).includes('b'));m.elapsed+=.1;assert.ok(!invoke(p,m,{guard:true}).includes('b'));m.elapsed+=.1;m.glider.flaps=true;assert.ok(!invoke(p,m,{guard:true}).includes('b'));return {ordinaryBThenRelease:true,observedDeploymentNoRetoggle:true};
});
test('paused and terminal observations emit no ordinary control keys',()=>{
  const p=createPilot(),m=base();assert.deepEqual(invoke(p,m,{guard:true,paused:true}),[]);assert.deepEqual(invoke(p,m,{guard:true,phase:'lost'}),[]);return {pausedNeutral:true,terminalNeutral:true};
});
test('invalid public physics fails explicitly rather than guessing a flight model',()=>{
  for(const invalid of [NaN,0]){const m=base();m.physics.gravity=invalid;assert.throws(()=>invoke(createPilot(),m,{guard:true}),/Missing or invalid public flight parameter/);}
  const m=base();m.physics.configurations.flaps.minSink=-1;assert.throws(()=>invoke(createPilot(),m,{guard:true}),/Missing public flight configuration/);return {invalidParameterCases:3};
});
test('an uncredited ring behind the plane is reported, never silently awarded or skipped',()=>{
  const m=base();m.glider.z=101;assert.throws(()=>invoke(createPilot(),m,{guard:true}),/passed without checkpoint credit/);return {missedVisiblePlaneThrows:true};
});
assert.equal(privateReads,0);assert.equal(mutationAttempts,0);assert.ok(allKeys.some(k=>k.startsWith('Arrow'))&&allKeys.includes('Space')&&allKeys.includes('b'));
const endHashes=await hashes();assert.deepEqual(endHashes,sourceHashes);
const report={kind:'independent-public-flight-pilot-review',passed:true,reviewScriptSha256:hash(await readFile(new URL(import.meta.url))),sourceHashes,endHashes,sourceUnchanged:true,checks,
  pilotCalls:calls,pairedObservations:12,privateReads,mutationAttempts,meaningfulDirectionalBrakeAndFlapDecisions:true,
  productionModelImported:false,productionModelStepCalled:false,browserExecuted:false,normalGameWinsClaimed:0,
  scope:'Small deep-frozen synthetic public-flight observations and explicit invalid-input fixtures; independent pilot factories are compared with different private decoys and throwing getters. No production state is simulated or changed and no normal-flight success is claimed.'};
const out=process.argv.indexOf('--out');if(out>=0){assert.ok(process.argv[out+1]);await writeFile(process.argv[out+1],JSON.stringify(report,null,2)+'\n');}console.log(JSON.stringify(report,null,2));
