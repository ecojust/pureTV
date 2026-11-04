// Independent review only. Fixture state edits below are NEVER gameplay/video evidence.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const args=process.argv.slice(2),opts={};
for(let i=0;i<args.length;i+=2){assert.ok(['--model','--output','--expected-sha'].includes(args[i])&&args[i+1]);opts[args[i].slice(2)]=args[i+1];}
const here=path.dirname(fileURLToPath(import.meta.url));
const modelPath=path.resolve(opts.model||path.join(here,'../src/main/assets/game-model.js'));
const output=opts.output?path.resolve(opts.output):null;
assert.ok(!output||![modelPath,fileURLToPath(import.meta.url)].includes(output),'Report must not overwrite the model or review script');
const sha=data=>createHash('sha256').update(data).digest('hex'),sourceSha=sha(await readFile(modelPath));
if(opts['expected-sha'])assert.equal(sourceSha,opts['expected-sha'],'Refuse a different model source');
const require=createRequire(import.meta.url),M=require(modelPath),DT=1/120,SCALE=50,G=9.81;
assert.equal(M.TICK_HZ,120);
const report={schema:1,startedAt:new Date().toISOString(),source:{modelPath,modelSha256:sourceSha,reviewPath:fileURLToPath(import.meta.url),reviewSha256:sha(await readFile(fileURLToPath(import.meta.url)))},
 execution:{runtime:process.version,modelApi:['create','step'],sourceFilesModified:false,physicalTvTested:false,physicalPhoneTested:false,
  fixtureScope:'Isolated force, damping, failure and load boundary tests intentionally construct model states. They are not ordinary gameplay or capture evidence.',
  normalSequenceScope:'Separate sequences modify their live state only through create/step inputs; planning clones may explore selectable candidates. Model-time tests are not real-time video.'},
 assumptions:{pixelsPerMetre:50,tickHz:120,gravity:G,model:'Vertical small-deflection deck; fixed x, fixed ground anchors/bank end reactions, prescribed supported vehicle speed and equal two-wheel static loads. Projected supported wheelbase; departure freezes actual axle length and inherits measured pose velocities. No one-wheel pivot/contact solver or full vehicle/structural FEM.',
  conservedQuantity:'Internal panel forces sum to zero. Fixed supports, anchors, gravity, vehicle drive and damping are external constraints/work, so total closed-system energy conservation is not claimed. Unsupported flight preserves horizontal velocity and angular velocity; vertical position follows constant gravity.'},
 checks:[],normalSequences:[],failures:[]};
async function test(name,fn){const start=performance.now();try{const detail=await fn();report.checks.push({name,passed:true,elapsedMs:performance.now()-start,...detail});console.log('PASS '+name);}catch(error){report.checks.push({name,passed:false,error:error.stack});report.failures.push(name);throw error;}}
const close=(actual,expected,label,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${label}: ${actual} vs ${expected}`);
const clone=x=>structuredClone(x);
let rng=20261101;const random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
const keys={right:{x:1},left:{x:-1},down:{y:1},up:{y:-1}};
function tap(s,key){M.step(s,DT,typeof key==='string'?key==='a'?{a:true}:key==='b'?{b:true}:keys[key]:key);M.step(s,DT,{});}
function moveTo(s,id){
 if(s.selectedId===id)return;
 const queue=[{s:clone(s),route:[]}],seen=new Set([s.selectedId]);let solution;
 while(queue.length&&!solution){const item=queue.shift();for(const key of ['right','left','down','up']){const next=clone(item.s);tap(next,key);if(seen.has(next.selectedId))continue;const route=[...item.route,key];if(next.selectedId===id){solution=route;break;}seen.add(next.selectedId);queue.push({s:next,route});}}
 assert.ok(solution,'Candidate unreachable '+id);for(const key of solution)tap(s,key);assert.equal(s.selectedId,id);
}
function build(s,ids){for(const id of ids){moveTo(s,id);tap(s,'a');assert.equal(s.cables.find(c=>c.id===id).installed,true);}return s;}
const installed=s=>s.cables.filter(c=>c.installed).map(c=>c.id).sort();
function ordinaryRun(level,ids){const s=build(M.create(83,level),ids);const editSeconds=s.elapsed;tap(s,'b');let breaks=0;while(s.phase==='playing'&&s.mode==='testing'&&s.elapsed<89){M.step(s,DT,{});breaks+=s.events.filter(e=>e.type==='cable-break').length;}return{s,detail:{level:level+1,installed:ids,editingSeconds:editSeconds,elapsed:s.elapsed,phase:s.phase,mode:s.mode,carX:s.car.x,finishX:s.car.finishX,fallen:s.car.falling,brokenCount:s.brokenCount,breakEvents:breaks,spent:s.spent,budget:s.budget,stateWrites:false}};}

// Independent algebra uses only the public state schema; it does not call any
// private model helper and compares forces before its first integration update.
function reference(state){
 const nodes=Object.fromEntries(state.nodes.map(n=>[n.id,n])),anchors=Object.fromEntries(state.anchors.map(a=>[a.id,a]));
 const forces=Object.fromEntries(state.nodes.map(n=>[n.id,n.mass*G-12*n.vy])),loads=Object.fromEntries(state.nodes.map(n=>[n.id,0]));
 const tension={};let internalTotal=0;
 for(const panel of state.panels){if(panel.broken)continue;const a=nodes[panel.aId],b=nodes[panel.bId];const f=panel.stiffness*((b.y-a.y)/SCALE)+panel.damping*(b.vy-a.vy);forces[a.id]+=f;forces[b.id]-=f;internalTotal+=f-f;}
 for(const cable of state.cables){const n=nodes[cable.nodeId],a=anchors[cable.anchorId],dx=(n.x-a.x)/SCALE,dy=(n.y-a.y)/SCALE,L=Math.sqrt(dx*dx+dy*dy);let f=0;
  if(cable.installed&&!cable.broken&&L>cable.restLength){f=Math.max(0,cable.stiffness*(L-cable.restLength)+cable.damping*n.vy*dy/L);if(f>cable.maxTension)f=0;}
  tension[cable.id]=f;forces[n.id]-=L?f*dy/L:0;}
 const first=state.nodes[0],last=state.nodes.at(-1),hits=[];
 for(const wx of [state.car.x-state.car.wheelbase/2,state.car.x+state.car.wheelbase/2]){
  if(wx<first.x||wx>last.x){hits.push({bank:true});continue;}
  const p=state.panels.find(p=>!p.broken&&wx>=nodes[p.aId].x-1e-8&&wx<=nodes[p.bId].x+1e-8);
  if(!p){hits.push(null);continue;}
  const a=nodes[p.aId],b=nodes[p.bId];hits.push({a:a.id,b:b.id,u:Math.max(0,Math.min(1,(wx-a.x)/(b.x-a.x)))});
 }
 if(!state.car.falling&&hits.every(Boolean)){for(const h of hits){if(h.bank)continue;const w=state.car.mass*G/2;loads[h.a]+=w*(1-h.u);loads[h.b]+=w*h.u;}}
 for(const n of state.nodes)forces[n.id]+=loads[n.id];
 return{forces,loads,tension,hits,internalTotal};
}

try{
 await test('30000 independent randomized force/load/integration comparisons across all six layouts',()=>{
  let forceError=0,loadError=0,velocityError=0,positionError=0,tensionError=0,slack=0,taut=0,missingSupports=0;
  for(let i=0;i<30000;i++){
   const s=M.create(10,i%6);s.mode='testing';s.car.x=s.nodes[0].x-45+random()*(s.nodes.at(-1).x-s.nodes[0].x+90);s.car.mass=25+random()*175;
   for(const n of s.nodes){if(!n.fixed)n.y+=random()*45-10;n.vy=random()*.8-.4;}
   for(const p of s.panels)p.broken=random()<.15;
   for(const c of s.cables){c.installed=random()<.65;c.broken=random()<.08;c.maxTension=1e9;}
   const before=clone(s),expected=reference(before);M.step(s,DT,{});
   for(const n of s.nodes){const previous=before.nodes.find(x=>x.id===n.id);forceError=Math.max(forceError,Math.abs(n.force-expected.forces[n.id]));loadError=Math.max(loadError,Math.abs(n.load-expected.loads[n.id]));
    const vy=previous.fixed?0:previous.vy+expected.forces[n.id]/previous.mass*DT;
    const y=previous.fixed?previous.restY:previous.y+vy*SCALE*DT;
    velocityError=Math.max(velocityError,Math.abs(n.vy-vy));positionError=Math.max(positionError,Math.abs(n.y-y));}
   for(const c of s.cables){assert.ok(c.tension>=0);tensionError=Math.max(tensionError,Math.abs(c.tension-expected.tension[c.id]));if(c.tension===0)slack++;else taut++;}
   if(!expected.hits.every(Boolean)){missingSupports++;assert.equal(s.car.falling,true);assert.ok(s.nodes.every(n=>n.load===0));}
   close(s.nodes.reduce((sum,n)=>sum+n.load,0),Object.values(expected.loads).reduce((a,b)=>a+b,0),'wheel load sum');
  }
  for(const [name,error] of Object.entries({forceError,loadError,velocityError,positionError,tensionError}))assert.ok(error<1e-8,name+' '+error);
  assert.ok(slack>0&&taut>0&&missingSupports>0);return{cases:30000,seed:20261101,layouts:6,forceError,loadError,velocityError,positionError,tensionError,slackCableObservations:slack,tautCableObservations:taut,missingSupports};
 });
 await test('No implicit support: disconnected unloaded free nodes accelerate at g; broken panels transfer no force',()=>{
  const s=M.create(1,0);s.mode='testing';s.panels.forEach(p=>p.broken=true);s.car.falling=true;M.step(s,DT,{});
  for(const n of s.nodes.filter(n=>!n.fixed)){close(n.force,n.mass*G,'free node gravity');close(n.vy,G*DT,'m/s acceleration');close(n.y,n.restY+G*DT*DT*SCALE,'pixel integration');assert.equal(n.load,0);}
  const p=M.create(1,0);p.mode='testing';p.car.falling=true;p.nodes[2].y+=20;p.nodes[1].vy=.3;p.nodes[2].vy=-.2;
  const expected=reference(p);M.step(p,DT,{});for(const n of p.nodes)close(n.force,expected.forces[n.id],'internal panel pair');
  return{gravity:G,freeNodeCount:3,pixelsPerMetre:SCALE,internalPanelForceSum:expected.internalTotal};
 });
 await test('Wheel loads sum to actual mg; doubling vehicle mass doubles deck load and increases same-step deflection',()=>{
  const light=M.create(1,0);light.mode='testing';light.car.x=480;light.car.mass=90;
  const heavy=clone(light);heavy.car.mass=180;M.step(light,DT,{});M.step(heavy,DT,{});
  close(light.nodes.reduce((sum,n)=>sum+n.load,0),90*G,'light vehicle weight');close(heavy.nodes.reduce((sum,n)=>sum+n.load,0),180*G,'heavy vehicle weight');
  for(let i=0;i<5;i++){close(heavy.nodes[i].load,light.nodes[i].load*2,'doubled per-node load');if(light.nodes[i].load>0&&!light.nodes[i].fixed)assert.ok(heavy.nodes[i].y>light.nodes[i].y);}
  return{lightN:90*G,heavyN:180*G,lightLoads:light.nodes.map(n=>n.load),heavyLoads:heavy.nodes.map(n=>n.load)};
 });
 await test('Departure after ordinary supported motion preserves momentum, axle length and analytic free-flight trajectory',()=>{
  const s=build(M.create(83,0),['cable-1-1','cable-2-1','cable-2-2','cable-3-2']);tap(s,'b');
  let found=false;
  for(let i=0;i<3600&&s.mode==='testing';i++){M.step(s,DT,{});if(s.car.wheels.every(w=>String(w.panelId).startsWith('panel-'))&&Math.abs(s.car.angle)>.015&&Math.abs(s.car.vy)>.003&&Math.abs(s.car.angularVelocity)>.001){found=true;break;}}
  assert.ok(found,'Actual supported prefix must have a nonzero inclination, vertical speed and turn rate');
  const before=clone(s.car),length=Math.hypot(before.wheels[1].x-before.wheels[0].x,before.wheels[1].y-before.wheels[0].y);
  // Deliberately constructed rupture boundary, after the ordinary prefix.
  s.panels.forEach(p=>{p.broken=true;});
  for(let i=1;i<=12;i++){
   M.step(s,DT,{});const t=i*DT,c=s.car;assert.equal(c.falling,true);
   close(c.vx,before.vx,'horizontal momentum');close(c.angularVelocity,before.angularVelocity,'angular velocity without torque');
   close(c.vy,before.vy+G*t,'gravity velocity');close(c.x,before.x+before.vx*SCALE*t,'horizontal trajectory');
   close(c.y,before.y+(before.vy*t+.5*G*t*t)*SCALE,'vertical trajectory');close(c.angle,before.angle+before.angularVelocity*t,'angle');
   close(Math.hypot(c.wheels[1].x-c.wheels[0].x,c.wheels[1].y-c.wheels[0].y),length,'actual axle length');
  }
  return{fixtureOnlyAtRupture:true,ordinarySupportedPrefix:true,flightSeconds:12*DT,departure:{vx:before.vx,vy:before.vy,angularVelocity:before.angularVelocity,axleLength:length},analyticGravity:G};
 });
 await test('Slack and contracting cables never push; overload breaks once and contributes zero after removal',()=>{
  const s=M.create(1,0);s.mode='testing';s.car.falling=true;const c=s.cables[0];c.installed=true;c.restLength=c.length+2;c.maxTension=1e6;s.nodes[1].vy=2;M.step(s,DT,{});assert.equal(c.tension,0);assert.equal(c.broken,false);
  const contracting=M.create(1,0);contracting.mode='testing';contracting.car.falling=true;const cc=contracting.cables[0];cc.installed=true;cc.restLength=cc.length-.01;cc.maxTension=1e6;contracting.nodes[1].vy=-20;M.step(contracting,DT,{});assert.equal(cc.tension,0);assert.equal(cc.broken,false);
  const broken=M.create(1,0);broken.mode='testing';broken.car.falling=true;const bc=broken.cables[0];bc.installed=true;bc.restLength=bc.length/2;bc.maxTension=1;
  let events=0;M.step(broken,DT,{});events+=broken.events.filter(e=>e.type==='cable-break').length;assert.equal(bc.broken,true);assert.equal(bc.tension,0);const time=bc.brokenAt;
  bc.maxTension=1e9;for(let i=0;i<80;i++){M.step(broken,DT,{});events+=broken.events.filter(e=>e.type==='cable-break').length;assert.equal(bc.tension,0);}
  assert.equal(events,1);assert.equal(broken.brokenCount,1);assert.equal(bc.brokenAt,time);return{breakEvents:events,brokenCount:broken.brokenCount,recordedBreakTime:time};
 });
 await test('Geometry-priced integer material ledger resists add/remove, overspend and held input',()=>{
  const details=[];
  for(let level=0;level<6;level++){
   const s=M.create(1,level);for(const c of s.cables){const a=s.anchors.find(a=>a.id===c.anchorId),n=s.nodes.find(n=>n.id===c.nodeId);assert.equal(c.cost,Math.ceil(Math.hypot(n.x-a.x,n.restY-a.y)/SCALE*10));assert.ok(Number.isInteger(c.cost));}
   for(const c of s.cables){moveTo(s,c.id);const before=s.spent,had=c.installed,available=s.remainingBudget;tap(s,'a');if(!had&&c.cost>available){assert.equal(c.installed,false);assert.equal(s.spent,before);}else assert.equal(s.spent,before+(had?-c.cost:c.cost));assert.equal(s.remainingBudget,s.budget-s.spent);assert.ok(s.remainingBudget>=0);}
   for(const id of installed(s)){moveTo(s,id);tap(s,'a');}assert.equal(s.spent,0);assert.equal(s.remainingBudget,s.budget);
   for(let i=0;i<120;i++){moveTo(s,s.cables[i%6].id);tap(s,'a');tap(s,'a');assert.equal(s.spent,0);assert.equal(s.remainingBudget,s.budget);}
   moveTo(s,s.cables[0].id);M.step(s,DT,{a:true});const spent=s.spent;for(let i=0;i<30;i++)M.step(s,DT,{a:true});assert.equal(s.spent,spent);M.step(s,DT,{});tap(s,'a');assert.equal(s.spent,0);assert.equal(s.phase,'playing');
   details.push({level:level+1,budget:s.budget,costs:s.cables.map(c=>c.cost),roundTrips:120,elapsed:s.elapsed});
  }
  return{levels:details,unit:'one budget unit = one purchased decimetre, each cable rounded up once'};
 });
 await test('Ordinary empty/weak bridges genuinely fall; B restores exact editable design without clock/material reset',()=>{
  const details=[];
  for(const ids of [[],['cable-1-2']]){
   const result=ordinaryRun(0,ids),s=result.s;assert.equal(s.phase,'playing');assert.equal(s.mode,'test-failed');assert.equal(s.car.falling,true);assert.equal(s.lastFailure,'vehicle-fall');assert.ok(s.car.y>500);if(ids.length)assert.ok(s.brokenCount>0);
   const elapsed=s.elapsed,spent=s.spent;tap(s,'b');assert.equal(s.phase,'playing');assert.equal(s.mode,'editing');assert.ok(s.elapsed>elapsed);assert.equal(s.spent,spent);assert.deepEqual(installed(s),ids.slice().sort());assert.ok(s.nodes.every(n=>n.y===n.restY&&n.vy===0));assert.ok(s.panels.every(p=>!p.broken));assert.ok(s.cables.every(c=>!c.broken&&c.tension===0));assert.equal(s.brokenCount,0);assert.equal(s._blueprint,null);
   details.push({...result.detail,afterBMode:s.mode,elapsedAfterB:s.elapsed,spentAfterB:s.spent});
  }
  return{normalInputSequences:details};
 });
 await test('Repeated test/edit snapshots preserve installation and geometry; test A cannot modify design',()=>{
  const ids=['cable-1-1','cable-2-1','cable-2-2','cable-3-2'],s=build(M.create(6,0),ids),blueprint=JSON.stringify({nodes:s.nodes,panels:s.panels,cables:s.cables,car:s.car,spent:s.spent});
  for(let i=0;i<30;i++){const time=s.elapsed;M.step(s,DT,{b:true});assert.equal(s.mode,'testing');assert.deepEqual(s._blueprint.installed.slice().sort(),ids.slice().sort());for(let n=0;n<10;n++)M.step(s,DT,{b:true});assert.equal(s.mode,'testing');M.step(s,DT,{});const materials=installed(s);tap(s,'a');assert.deepEqual(installed(s),materials);tap(s,'b');assert.equal(s.mode,'editing');assert.ok(s.elapsed>time);assert.equal(JSON.stringify({nodes:s.nodes,panels:s.panels,cables:s.cables,car:s.car,spent:s.spent}),blueprint);}
  return{cycles:30,spent:s.spent,elapsed:s.elapsed,attempts:s.attempts};
 });
 await test('Twelve ordinary input designs cross: two distinct cable sets in each of the six layouts',()=>{
  for(let level=0;level<6;level++)for(const ids of [['cable-1-1','cable-2-1','cable-3-2'],['cable-1-1','cable-2-1','cable-2-2','cable-3-2']]){
   const {s,detail}=ordinaryRun(level,ids);assert.equal(s.phase,'won');assert.equal(s.car.falling,false);assert.equal(s.car.finished,true);assert.ok(s.car.x-s.car.wheelbase/2>s.nodes.at(-1).x);assert.ok(s.remainingBudget>=0);assert.ok(s.panels.every(p=>!p.broken));const frozen=clone(s);M.step(s,.25,{a:true,b:true,x:1});assert.deepEqual(s,frozen);report.normalSequences.push(detail);
  }
  return{normalWins:report.normalSequences.length,liveStateWrites:false,successIsNotSingleCombination:true};
 });
 await test('One ordinary session can fail, wait, restore, remove the wrong cable, rebuild and win',()=>{
  const first=ordinaryRun(0,['cable-1-2']),s=first.s;assert.equal(s.mode,'test-failed');const failedAt=s.elapsed;
  for(let i=0;i<312;i++)M.step(s,DT,{});assert.equal(s.mode,'test-failed');tap(s,'b');moveTo(s,'cable-1-2');tap(s,'a');assert.equal(s.spent,0);
  const good=['cable-1-1','cable-2-1','cable-2-2','cable-3-2'];build(s,good);tap(s,'b');
  while(s.phase==='playing'&&s.mode==='testing'&&s.elapsed<89)M.step(s,DT,{});
  assert.equal(s.phase,'won');assert.equal(s.attempts,2);assert.ok(s.elapsed>failedAt+2.6);assert.ok(s.nodes.every(n=>Number.isFinite(n.y)));assert.ok(s.panels.every(p=>!p.broken));
  return{firstFailureAt:failedAt,failureDisplayedModelSeconds:2.6,wonAt:s.elapsed,attempts:s.attempts,spent:s.spent,budget:s.budget,liveStateWrites:false};
 });
 await test('Constructed finish boundary rejects a broken rear panel even after all vehicle wheels reach the bank',()=>{
  const normal=ordinaryRun(0,['cable-1-1','cable-2-1','cable-2-2','cable-3-2']).s;
  assert.equal(normal.phase,'won');assert.ok(normal.car.wheels.every(w=>w.x>normal.nodes.at(-1).x&&w.contact));
  const good=clone(normal);good.phase='playing';good.mode='testing';good.car.finished=false;good.car.x=good.car.finishX-.01;good._remainder=0;
  const bad=clone(good);bad.panels[0].broken=true;
  M.step(good,DT,{});M.step(bad,DT,{});
  assert.equal(good.phase,'won');assert.equal(bad.phase,'playing');assert.equal(bad.mode,'test-failed');assert.equal(bad.lastFailure,'bridge-collapse');assert.equal(bad.car.finished,false);
  assert.ok(bad.car.x>=bad.car.finishX);assert.ok(bad.car.wheels.every(w=>w.x>bad.nodes.at(-1).x&&w.contact));
  return{fixtureOnly:true,goodPhase:good.phase,badPhase:bad.phase,badMode:bad.mode,badReason:bad.lastFailure,rearWheelBeyondBank:true};
 });
 await test('Fixed integration agrees at 120/60/30Hz; invalid time cannot edit and timeout freezes',()=>{
  const seed=build(M.create(3,0),['cable-1-1','cable-2-1','cable-2-2','cable-3-2']);tap(seed,'b');const states=[];
  for(const frequency of [120,60,30]){const s=clone(seed);for(let i=0;i<frequency*16;i++)M.step(s,1/frequency,{});states.push({nodes:s.nodes,panels:s.panels,cables:s.cables,car:s.car,tick:s.tick,elapsed:s.elapsed,remaining:s.remaining});}
  assert.deepEqual(states[0],states[1]);assert.deepEqual(states[0],states[2]);
  const invalid=M.create(1,0),before=clone(invalid);for(const dt of [0,-1,NaN,Infinity,'1']){M.step(invalid,dt,{aPressed:true,bPressed:true});assert.deepEqual(invalid,before);}
  const timeout=M.create(1,0);for(let i=0;i<360;i++)M.step(timeout,.25,{});assert.equal(timeout.phase,'lost');assert.equal(timeout.lostReason,'timeout');close(timeout.elapsed,90,'exact global timeout');const frozen=clone(timeout);M.step(timeout,.25,{b:true});assert.deepEqual(timeout,frozen);
  return{frequencies:[120,60,30],physicsSeconds:16,globalTimeout:90};
 });
 assert.equal(sha(await readFile(modelPath)),sourceSha,'Source changed during independent review; rerun with frozen SHA');
 report.passed=true;
}catch(error){report.passed=false;report.error=error.stack;process.exitCode=1;console.error(error.stack);}
finally{report.finishedAt=new Date().toISOString();if(output){await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');}console.log(JSON.stringify({passed:report.passed,modelSha256:sourceSha,checks:report.checks.length,failures:report.failures,output}));}
