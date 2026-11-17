// Static preparation only: root must fully read this file before first import.
// This module validates supplied public observations; it never runs a game.

export const CONTRACT_HASHES = Object.freeze({
  model: '94277da6221d82224d400b5e62eb3c997fa4c0948470ffe55f73145ccdf6aa28',
  interface: 'd2a166d459ccd9904c06ca1fb0e42ea8e8904bda37a59d9d64e60a6b1350e5a9'
});
const RULES = Object.freeze({pushAcceleration:2.4,baseFriction:0.12,clawFriction:4.8,
  safeClawSpeed:5,loadCoefficient:12,damageLimit:100,dockSpeed:0.3,dockDwell:0.6,stickThreshold:0.35});
const SCENARIOS = [
  {startX:10,bands:[[18,32],[45,61],[71,85]],centers:[53,25,78]},
  {startX:88,bands:[[13,27],[36,52],[65,80]],centers:[44,72,20]},
  {startX:12,bands:[[23,38],[58,74],[77,91]],centers:[66,30,82]}
];
const PROJECTION = ['time','x','v','damage','deliveries','dwell','score','phase','failure',
  'controlsReady','lastCancelEpoch','contact','message'];
const INPUT_KEYS = ['x','y','a','b','aPressed','bPressed','cancelEpoch','cancelled'];
const REQUIRED_STATE = ['id','version','seed','scenario','layout','rules',...PROJECTION,
  'lastInput','lastStep','nextSeq','events','deliveryReceipts','terminalReceipt'];
const END_NAMES = new Set(['band','zero','safe-speed','dock-speed','dock-edge','edge','damage','delivery','call-end']);
const DESCRIPTOR_KINDS = new Set(['missing','undefined','null','boolean','finite-number','nan',
  'positive-infinity','negative-infinity','string','array','object','bigint','symbol','function']);
const TOL = {x:1e-6,v:1e-6,damage:1e-5,time:1e-7,dwell:1e-7,default:1e-9};
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const finite = n => typeof n === 'number' && Number.isFinite(n);
const plain = o => o !== null && typeof o === 'object' && !Array.isArray(o);
const sign = Math.sign;
const clone = o => JSON.parse(JSON.stringify(o));
const fields = (o,keys) => Object.fromEntries(keys.map(k => [k,o[k]]));
const score = s => 100*s.deliveries + (s.phase === 'won' ? Math.floor(Math.max(0,100-s.damage)) : 0);
const rootSlack = t => 64*Number.EPSILON*Math.max(1,Math.abs(t));
// A numerical match is not proof that distinct physical equations share a root.
const sameRoot = (a,b) => Math.abs(a-b) <= Math.max(rootSlack(a),rootSlack(b));

class Check {
  constructor(kind) { this.kind=kind; this.path='$'; this.errors=[]; this.reviewRequired=[]; this.outcomes=[]; this.checks=0;
    this.stats={runs:0,calls:0,segments:0,events:0,noTimeCalls:0,terminalNoOps:0,samples:0,
      thrustSegments:0,coastSegments:0,clawOffFrostSegments:0,clawEngagedSegments:0,loadedSegments:0,eligibleSegments:0}; }
  ok(value,code,detail) { this.checks++; if (!value) this.errors.push({path:this.path,code,detail}); return !!value; }
  equal(a,b,code) { return this.ok(exact(a,b),code,{expected:b,actual:a}); }
  near(a,b,code,tolerance=TOL.default) {
    const round=8*Number.EPSILON*Math.max(Math.abs(a||0),Math.abs(b||0));
    return this.ok(finite(a)&&finite(b)&&Math.abs(a-b)<=Math.max(tolerance,round),code,{expected:b,actual:a,tolerance});
  }
  at(path,fn) { const previous=this.path; this.path=path; try { fn(); }
    catch(e) { this.ok(false,'malformed-observation',String(e.message||e)); } finally { this.path=previous; } }
  report() { return {schema:'frost-brake-independent-audit-v1',kind:this.kind,
    status:this.errors.length ? 'failed' : this.reviewRequired.length ? 'review-required' : 'passed',checks:this.checks,stats:this.stats,
    contractHashes:CONTRACT_HASHES,coverage:this.kind==='ordinary'
      ? 'Every supplied contiguous actual ordinary call and physical segment; no model replay.'
      : 'Actual sparse browser snapshots and preserved receipts only; no omitted-call reconstruction.',
    fullBrowserIntervalAudit:false,outcomes:this.outcomes,errors:this.errors,reviewRequired:this.reviewRequired}; }
}

function exact(a,b) {
  if (a === b) return true;
  if (Array.isArray(a)||Array.isArray(b)) return Array.isArray(a)&&Array.isArray(b)
    &&a.length===b.length&&a.every((v,i)=>exact(v,b[i]));
  if (!plain(a)||!plain(b)) return false;
  const ak=Object.keys(a).sort(), bk=Object.keys(b).sort();
  return ak.length===bk.length&&ak.every((k,i)=>k===bk[i]&&exact(a[k],b[k]));
}
function finiteJSON(c,value,path='state') {
  if (typeof value==='number') c.ok(Number.isFinite(value),'nonfinite-json',path);
  else if (Array.isArray(value)) value.forEach((v,i)=>finiteJSON(c,v,`${path}[${i}]`));
  else if (plain(value)) for (const [k,v] of Object.entries(value)) finiteJSON(c,v,`${path}.${k}`);
}
function layout(index) {
  const s=SCENARIOS[index];
  return {startX:s.startX,lane:[0,100],halfLength:1.2,frostBands:s.bands,
    docks:s.centers.map((center,i)=>({center,width:[12,9,6][i]}))};
}
function allowed(s,delivery=s.deliveries) {
  if (delivery>=3) return null;
  const d=s.layout.docks[delivery]; return [d.center-d.width/2+1.2,d.center+d.width/2-1.2];
}
function insideForward(value,velocity,acceleration,lo,hi) {
  if (value<lo||value>hi) return false;
  const direction=velocity!==0 ? sign(velocity) : sign(acceleration);
  return !(value===lo&&direction<0) && !(value===hi&&direction>0);
}
function bandAt(s,axis,claw) {
  const direction=s.v!==0 ? sign(s.v) : claw ? 0 : axis;
  return s.layout.frostBands.findIndex(([l,r])=>insideForward(s.x,direction,0,l,r));
}
function acceleration(v,axis,engaged) {
  const u=2.4*axis, friction=0.12+(engaged?4.8:0);
  return v===0 ? sign(u)*Math.max(Math.abs(u)-friction,0) : u-friction*sign(v);
}
function eligibleForward(s,a) {
  const bounds=allowed(s); return bounds!==null
    &&insideForward(s.x,s.v,a,...bounds)&&insideForward(s.v,a,0,-0.3,0.3);
}
function contact(s,axis,claw) {
  const band=bandAt(s,axis,claw),bounds=allowed(s);
  return {band,clawRequested:claw,clawEngaged:claw&&band>=0,
    eligible:bounds!==null&&s.x>=bounds[0]&&s.x<=bounds[1]&&Math.abs(s.v)<=0.3};
}
function publicState(c,s) {
  if (!c.ok(plain(s),'state-record',typeof s)) return false;
  for (const key of REQUIRED_STATE) c.ok(own(s,key),'missing-state-field',key);
  finiteJSON(c,s);
  for (const key of ['time','x','v','damage','dwell','score','nextSeq'])c.ok(finite(s[key]),'finite-state-number',key);
  c.ok(s.time>=0,'nonnegative-model-time',s.time);
  c.ok(Number.isInteger(s.nextSeq)&&s.nextSeq>=0,'nonnegative-sequence',s.nextSeq);
  c.ok(typeof s.controlsReady==='boolean','boolean-release-gate',s.controlsReady);
  c.ok(s.lastCancelEpoch===null||(Number.isSafeInteger(s.lastCancelEpoch)&&s.lastCancelEpoch>=0),'stored-epoch-domain',s.lastCancelEpoch);
  c.equal(s.id,'frost-brake','game-id'); c.equal(s.version,'0.1.0','game-version');
  c.ok(Number.isInteger(s.seed)&&s.seed>=0&&s.seed<=4294967295,'normalized-seed',s.seed);
  c.ok(Number.isInteger(s.scenario)&&s.scenario>=0&&s.scenario<3,'scenario',s.scenario);
  if (!SCENARIOS[s.scenario]) return false;
  c.equal(s.layout,layout(s.scenario),'public-layout'); c.equal(s.rules,RULES,'public-rules');
  c.ok(['playing','won','lost'].includes(s.phase),'phase',s.phase);
  c.ok(Number.isInteger(s.deliveries)&&s.deliveries>=0&&s.deliveries<=3,'delivery-range',s.deliveries);
  c.ok(s.damage>=0&&s.damage<=100,'damage-range',s.damage);
  c.ok(s.dwell>=0&&s.dwell<=0.6,'dwell-range',s.dwell);
  c.ok(s.x>=1.2-TOL.x&&s.x<=98.8+TOL.x,'finite-body-lane',s.x);
  c.equal(s.score,score(s),'score');
  c.ok(Array.isArray(s.deliveryReceipts)&&s.deliveryReceipts.length===s.deliveries,'delivery-bank-count',s.deliveries);
  c.equal(s.phase==='playing',s.terminalReceipt===null,'terminal-receipt-presence');
  c.equal(s.phase==='lost',s.failure!==null,'failure-presence');
  if (s.phase==='won') c.equal(s.deliveries,3,'win-deliveries');
  if (s.phase==='lost') c.ok(['edge','damage'].includes(s.failure),'failure-reason',s.failure);
  c.equal(s.contact,contact(s,s.lastInput?.effectiveAxis||0,s.lastInput?.effectiveClaw===true),'derived-contact');
  return true;
}
function initial(c,s,run) {
  if (!publicState(c,s)) return;
  c.equal(s.scenario,run.scenario,'run-scenario'); c.equal(s.seed,run.seed,'run-seed');
  c.equal(fields(s,['x','v','time','damage','dwell','deliveries','score','phase','failure']),
    {x:SCENARIOS[s.scenario].startX,v:0,time:0,damage:0,dwell:0,deliveries:0,score:0,phase:'playing',failure:null},'fresh-initial-physics');
  c.equal(fields(s,['controlsReady','lastCancelEpoch','lastInput','lastStep','nextSeq','events','deliveryReceipts','terminalReceipt']),
    {controlsReady:true,lastCancelEpoch:null,lastInput:null,lastStep:null,nextSeq:0,events:[],deliveryReceipts:[],terminalReceipt:null},'fresh-initial-bookkeeping');
}

function descriptor(value,present=true) {
  if (!present) return {kind:'missing',value:null};
  if (value===null) return {kind:'null',value:null};
  if (Array.isArray(value)) return {kind:'array',value:null};
  const type=typeof value;
  if (type==='number') return {kind:Number.isNaN(value)?'nan':value===Infinity?'positive-infinity':value===-Infinity?'negative-infinity':'finite-number',value:finite(value)?value:null};
  return {kind:type,value:['boolean','string'].includes(type)?value:null};
}
function encodedInput(c,encoded) {
  c.ok(plain(encoded)&&typeof encoded.kind==='string','input-encoding',encoded);
  const object=encoded.kind==='object',props=object&&plain(encoded.own)?encoded.own:{};
  const raw={};
  for (const k of INPUT_KEYS) raw[k]=own(props,k)?props[k]:{kind:'missing',value:null};
  for (const [key,d] of Object.entries(raw)) {
    c.ok(plain(d)&&DESCRIPTOR_KINDS.has(d.kind)&&own(d,'value'),'raw-descriptor',key);
    if (d.kind==='finite-number') c.ok(finite(d.value),'finite-descriptor',key);
    if (d.kind==='boolean') c.ok(typeof d.value==='boolean','boolean-descriptor',key);
    if (d.kind==='string') c.ok(typeof d.value==='string','string-descriptor',key);
    if (!['finite-number','boolean','string'].includes(d.kind)) c.equal(d.value,null,'nonvalue-descriptor');
  }
  return {kind:encoded.kind,raw};
}
function normalized(c,before,encoded) {
  const {kind,raw}=encodedInput(c,encoded), xValid=raw.x.kind==='finite-number';
  const x=xValid?Math.max(-1,Math.min(1,raw.x.value)):0;
  const rawAxis=Math.abs(x)<0.35?0:sign(x),requestedA=raw.a.kind==='boolean'&&raw.a.value===true;
  const cancelled=raw.cancelled.kind==='boolean'&&raw.cancelled.value===true;
  const ev=raw.cancelEpoch.value;
  const epoch=raw.cancelEpoch.kind==='finite-number'&&Number.isSafeInteger(ev)&&ev>=0?ev:null;
  const epochChanged=epoch!==null&&before.lastCancelEpoch!==null&&epoch!==before.lastCancelEpoch;
  let gateAfter=before.controlsReady,reason='ready',effectiveAxis=rawAxis,effectiveClaw=requestedA;
  if (cancelled||epochChanged) { gateAfter=false;reason='cancel'; }
  else if (!gateAfter) {
    const released=xValid&&Math.abs(raw.x.value)<0.35&&raw.a.kind==='boolean'&&raw.a.value===false;
    gateAfter=released;reason=released?'release':'blocked';
  }
  if (reason!=='ready') { effectiveAxis=0;effectiveClaw=false; }
  return {receipt:{rawInputKind:kind,raw,xValid,rawAxis,requestedA,effectiveAxis,effectiveClaw,
    cancelled,epoch,epochChanged,gateBefore:before.controlsReady,gateAfter,reason},
    storedEpoch:epoch===null?before.lastCancelEpoch:epoch};
}
function timePolicy(before,dt) {
  const value=dt.kind==='finite-number'?dt.value:null;
  let status;
  if (['nan','positive-infinity','negative-infinity'].includes(dt.kind)) status='nonfinite';
  else if (dt.kind!=='finite-number') status='nonnumeric';
  else if (value<=0) status='nonpositive';
  else if (!finite(before.time+value)||before.time+value<=before.time) status='nonrepresentable';
  else status='duration';
  return {requestedDt:value,dtKind:dt.kind,dtStatus:status,acceptedDt:status==='duration'?value:0};
}

// Roots are analytic checks of an observed constant-acceleration interval only.
// They are not used to run a model, select controls, or fill missing observations.
function roots(a,b,c) {
  if (a===0) return b===0?[]:[-c/b];
  const disc=b*b-4*a*c;
  if (disc<0) return [];
  if (disc===0) return [-b/(2*a)];
  const sq=Math.sqrt(disc), q=-0.5*(b+(b>=0?sq:-sq));
  return q===0?[-b/(2*a)]:[q/a,c/q];
}
function candidates(s,a,engaged,eligible,remaining) {
  const list=[];
  const add=(t,reason,extra={})=>{if(finite(t)&&t>0)list.push({t,reason,...extra});};
  const position=(value,reason,edge=false)=>{
    for(const t of roots(0.5*a,s.v,s.x-value)) {
      const velocity=s.v+a*t;
      const outward=value===1.2?velocity<0||(velocity===0&&a<0):velocity>0||(velocity===0&&a>0);
      if (!edge||outward) add(t,reason,{surface:value});
    }
  };
  for(const band of s.layout.frostBands) for(const edge of band) position(edge,'band');
  if(a!==0) for(const v of [0,-5,5,-0.3,0.3]) add((v-s.v)/a,v===0?'zero':Math.abs(v)===5?'safe-speed':'dock-speed',{surface:v});
  const bounds=allowed(s); if(bounds) bounds.forEach(x=>position(x,'dock-edge'));
  position(1.2,'edge',true);position(98.8,'edge',true);
  if((s.x===1.2&&(s.v<0||(s.v===0&&a<0)))||(s.x===98.8&&(s.v>0||(s.v===0&&a>0)))) list.push({t:0,reason:'edge',surface:s.x});
  if(engaged&&Math.abs(s.v)>5) {
    for(const t of roots(6*sign(s.v)*a,12*(Math.abs(s.v)-5),s.damage-100)) add(t,'damage');
  }
  if(eligible) add(0.6-s.dwell,'delivery');
  add(remaining,'call-end');
  return list;
}
function event(type,seq,index,offset,startTime,s,extra={}) {
  return {type,time:startTime+offset,offset,seq,index,x:s.x,v:s.v,damage:s.damage,...extra};
}
function compareEvent(c,actual,expected) {
  c.equal(Object.keys(actual).sort(),Object.keys(expected).sort(),'event-fields');
  for(const [key,value] of Object.entries(expected)) {
    if(['x','v','damage','time','offset'].includes(key)) c.near(actual[key],value,`event-${key}`,TOL[key]||TOL.time);
    else c.equal(actual[key],value,`event-${key}`);
  }
}
function eventsEqual(c,actual,expected) {
  if(!c.ok(Array.isArray(actual),'events-array',actual))return;
  c.equal(actual.length,expected.length,'event-count');
  expected.forEach((e,i)=>{if(actual[i])compareEvent(c,actual[i],e);});
}
function segment(c,seg,current,input,remaining,offset,startTime,seq,eventList) {
  c.stats.segments++;
  const h=seg.duration,axis=input.effectiveAxis,claw=input.effectiveClaw;
  c.ok(finite(h)&&h>=0,'segment-duration',h);
  const band=bandAt(current,axis,claw),engaged=claw&&band>=0;
  const a=acceleration(current.v,axis,engaged),eligible=eligibleForward(current,a);
  if(axis!==0)c.stats.thrustSegments++;
  if(axis===0&&!engaged&&current.v!==0)c.stats.coastSegments++;
  if(claw&&band<0)c.stats.clawOffFrostSegments++;
  if(engaged)c.stats.clawEngagedSegments++;
  if(engaged&&Math.abs(current.v)>5)c.stats.loadedSegments++;
  if(eligible)c.stats.eligibleSegments++;
  const start={...current,dwell:eligible?current.dwell:0};
  c.near(seg.x0,start.x,'segment-x0',TOL.x);c.near(seg.v0,start.v,'segment-v0',TOL.v);
  c.near(seg.damage0,start.damage,'segment-damage0',TOL.damage);c.near(seg.dwell0,start.dwell,'segment-dwell0',TOL.dwell);
  c.equal(seg.axis,axis,'segment-axis');c.equal(seg.clawRequested,claw,'segment-request');
  c.equal(seg.band,band,'segment-band');c.equal(seg.clawEngaged,engaged,'segment-engagement');
  c.equal(seg.eligible,eligible,'segment-open-eligibility');c.equal(seg.deliveries,start.deliveries,'segment-dock-index');
  c.near(seg.acceleration,a,'segment-additive-acceleration');
  const rootsHere=candidates(start,a,engaged,eligible,remaining);
  const earlier=rootsHere.filter(r=>r.t<h&&!sameRoot(r.t,h));
  c.ok(earlier.length===0,'skipped-earlier-event',earlier);
  const reached=rootsHere.filter(r=>sameRoot(r.t,h));
  c.ok(reached.length>0,'unexplained-segment-end',{duration:h});
  const reasons=[...new Set(reached.map(r=>r.reason))];
  if(reasons.length>1) {
    // Do not convert close roots into an exact tie. These observations need a
    // separate explicit analytical expectation before the whole audit can pass.
    c.reviewRequired.push({path:c.path,code:'exact-tie-identity-needs-analytical-evidence',
      duration:h,candidates:reached,detail:'Machine-scale coincidence alone does not establish mathematical-root identity.'});
  }
  c.ok(Array.isArray(seg.ends)&&seg.ends.every(r=>END_NAMES.has(r)),'segment-end-names',seg.ends);
  c.equal([...new Set(seg.ends)].sort(),reasons.sort(),'actual-reached-surfaces');
  c.equal(seg.ends.length,new Set(seg.ends).size,'duplicate-end-reason');
  if(h===0)c.ok(reasons.includes('edge')&&offset===0,'zero-segment-only-immediate-edge',reasons);
  c.ok(h<=remaining||sameRoot(h,remaining),'segment-within-call',{h,remaining});
  const expectedX=start.v===0&&a===0?start.x:start.x+start.v*h+0.5*a*h*h;
  const expectedV=start.v+a*h;
  let load=0;
  if(engaged&&Math.abs(start.v)>5) load=12*((Math.abs(start.v)-5)*h+0.5*sign(start.v)*a*h*h);
  c.ok(load>=-TOL.damage,'nonnegative-integrated-load',load);
  const expectedD=start.damage+load,expectedDwell=eligible?start.dwell+h:0;
  c.near(seg.x1,expectedX,'integrated-position',TOL.x);c.near(seg.v1,expectedV,'integrated-velocity',TOL.v);
  c.near(seg.damage1,expectedD,'integrated-load',TOL.damage);c.near(seg.dwell1,expectedDwell,'integrated-dwell',TOL.dwell);
  c.near(seg.t0,startTime+offset,'segment-rounded-t0',TOL.time);
  c.near(seg.t1,startTime+(offset+h),'segment-rounded-t1',TOL.time);
  // Validate individual actual roots before accepting a snap or outcome.
  for(const r of reached) {
    if(['band','dock-edge','edge'].includes(r.reason))c.near(seg.x1,r.surface,'reached-position-surface',1e-9);
    if(['zero','safe-speed','dock-speed'].includes(r.reason))c.near(seg.v1,r.surface,'reached-speed-surface',1e-9);
    if(r.reason==='damage')c.near(seg.damage1,100,'reached-damage-surface',1e-9);
    if(r.reason==='delivery')c.near(seg.dwell1,0.6,'reached-dwell-surface',1e-9);
  }
  const next={...start,x:seg.x1,v:seg.v1,damage:seg.damage1,dwell:seg.dwell1,time:startTime+(offset+h)};
  const causes=['edge','damage'].filter(r=>reasons.includes(r));
  if(causes.length) {
    next.phase='lost';next.failure=causes[0];next.score=score(next);
    eventList.push(event('lost',seq,eventList.length,offset+h,startTime,next,{deliveries:next.deliveries,score:next.score,failure:next.failure,causes}));
  } else if(reasons.includes('delivery')) {
    const dockIndex=next.deliveries,allowedCenter=allowed(next);
    next.deliveries++;next.dwell=0;
    eventList.push(event('delivery',seq,eventList.length,offset+h,startTime,next,{dockIndex,allowedCenter,speedLimit:0.3,dwell:0.6,deliveriesBefore:dockIndex,deliveriesAfter:next.deliveries}));
    if(next.deliveries===3) {
      next.phase='won';next.failure=null;next.score=score(next);
      eventList.push(event('won',seq,eventList.length,offset+h,startTime,next,{deliveries:3,score:next.score}));
    }
  }
  next.score=score(next);
  return next;
}

function auditCall(c,call,beforeExpected,index) {
  c.stats.calls++;c.equal(call.callIndex,index,'actual-call-index');
  c.ok(own(call,'input')&&own(call,'dt')&&own(call,'rawInput')&&own(call,'rawDt'),'ordinary-original-input-dt-preserved',call.callIndex);
  c.equal(call.error,null,'actual-call-returned-without-exception');
  c.equal(call.before,beforeExpected,'complete-before-chain');
  const before=call.before,after=call.after;
  if(!publicState(c,before)||!publicState(c,after))return after;
  c.equal(call.lastStep,after.lastStep,'detached-actual-lastStep');
  for(const k of ['id','version','seed','scenario','layout','rules'])c.equal(after[k],before[k],`immutable-${k}`);
  if(before.phase!=='playing') {
    c.stats.terminalNoOps++;c.equal(after,before,'terminal-complete-no-op');return after;
  }
  const input=normalized(c,before,call.input),receipt=input.receipt,policy=timePolicy(before,call.dt);
  c.ok(plain(call.dt)&&DESCRIPTOR_KINDS.has(call.dt.kind)&&own(call.dt,'value'),'dt-encoding',call.dt);
  if(call.dt.kind==='finite-number')c.ok(finite(call.dt.value),'finite-raw-dt',call.dt.value);
  if(own(call,'rawInput')) {
    const raw=call.rawInput,kind=raw===null?'null':Array.isArray(raw)?'array':typeof raw;
    c.equal(call.input.kind,kind,'actual-raw-container');
    for(const k of INPUT_KEYS)c.equal(receipt.raw[k],descriptor(raw?.[k],plain(raw)&&own(raw,k)),`actual-raw-${k}`);
  }
  if(own(call,'rawDt'))c.equal(call.dt,descriptor(call.rawDt),'actual-raw-dt');
  c.equal(after.lastInput,receipt,'input-normalization-gate');
  c.equal(after.controlsReady,receipt.gateAfter,'release-gate');c.equal(after.lastCancelEpoch,input.storedEpoch,'stored-epoch');
  const step=after.lastStep;
  c.equal(step.seq,before.nextSeq,'call-seq');c.equal(after.nextSeq,before.nextSeq+1,'next-seq');
  c.equal(step.input,receipt,'step-input-copy');c.equal(step.before,fields(before,PROJECTION),'actual-before-projection');
  c.equal(step.after,fields(after,PROJECTION),'actual-after-projection');c.near(step.startTime,before.time,'call-start-time',TOL.time);
  for(const k of Object.keys(policy))c.equal(step[k],policy[k],`duration-policy-${k}`);
  const eventList=[],currentInput={...receipt};let current={...before};let consumed=0;
  if(before.controlsReady!==receipt.gateAfter)eventList.push(event(receipt.gateAfter?'release':'cancel',step.seq,0,0,before.time,before,
    {gateBefore:before.controlsReady,gateAfter:receipt.gateAfter,epoch:input.storedEpoch}));
  c.ok(Array.isArray(step.segments),'segments-array',typeof step.segments);
  if(policy.acceptedDt===0) {
    c.stats.noTimeCalls++;c.equal(step.segments,[],'no-time-no-segments');
    c.equal(fields(after,['time','x','v','damage','deliveries','dwell','score','phase','failure']),
      fields(before,['time','x','v','damage','deliveries','dwell','score','phase','failure']),'no-time-physical-freeze');
  } else {
    c.ok(step.segments.length>0,'positive-call-has-actual-segments',policy.acceptedDt);
    step.segments.forEach((seg,i)=>{
      c.at(`${c.path}.segments[${i}]`,()=>{
        c.equal(current.phase,'playing','no-physical-time-after-terminal');
        current=segment(c,seg,current,currentInput,policy.acceptedDt-consumed,consumed,before.time,step.seq,eventList);
        consumed+=seg.duration;
      });
    });
  }
  c.near(step.consumedDt,consumed,'consumed-local-duration',TOL.time);
  c.near(step.unusedDt,policy.acceptedDt-consumed,'terminal-remainder',TOL.time);
  c.ok(step.unusedDt>=0,'nonnegative-remainder',step.unusedDt);
  if(current.phase==='playing')c.near(consumed,policy.acceptedDt,'nonterminal-consumes-entire-call',TOL.time);
  for(const k of ['x','v','damage','dwell'])c.near(after[k],current[k],`final-${k}`,TOL[k]);
  c.near(after.time,before.time+consumed,'final-rounded-time',TOL.time);
  for(const k of ['phase','failure','deliveries','score'])c.equal(after[k],current[k],`final-${k}`);
  eventsEqual(c,after.events,eventList);c.equal(step.events,after.events,'actual-event-copy');c.stats.events+=eventList.length;
  const deliveries=eventList.filter(e=>e.type==='delivery');
  eventsEqual(c,after.deliveryReceipts,[...before.deliveryReceipts,...deliveries]);
  const terminal=eventList.find(e=>e.type==='won'||e.type==='lost');
  if(terminal) {
    const expected={...terminal,phase:after.phase,acceptedDt:policy.acceptedDt,consumedDt:consumed,unusedDt:policy.acceptedDt-consumed};
    compareEvent(c,after.terminalReceipt,expected);
  } else c.equal(after.terminalReceipt,before.terminalReceipt,'terminal-bank-preserved');
  return after;
}

export function auditOrdinary(corpus) {
  const c=new Check('ordinary');
  if(!c.ok(!own(corpus,'pilotDiagnostics'),'public-projection-required','Provide the public-only artifact, never private diagnostics.'))return c.report();
  c.equal(corpus.schema,'frost-brake-public-corpus-v1','corpus-schema');c.equal(corpus.kind,'ordinary','corpus-kind');
  if(!c.ok(Array.isArray(corpus.runs)&&corpus.runs.length>0,'ordinary-runs',typeof corpus.runs))return c.report();
  corpus.runs.forEach((run,ri)=>c.at(`$.runs[${ri}]`,()=>{
    c.stats.runs++;initial(c,run.initialState,run);let previous=run.initialState;
    c.ok(Array.isArray(run.calls)&&run.calls.length>0,'actual-calls-present',run.id);
    run.calls.forEach((call,i)=>c.at(`$.runs[${ri}].calls[${i}]`,()=>{previous=auditCall(c,call,previous,i);}));
    c.equal(run.finalState,previous,'complete-final-state');
    c.ok(['won','lost'].includes(run.finalState.phase),'ordinary-round-reaches-terminal',run.finalState.phase);
    c.outcomes.push({id:run.id,scenario:run.scenario,phase:run.finalState.phase,failure:run.finalState.failure,
      deliveries:run.finalState.deliveries,damage:run.finalState.damage,time:run.finalState.time});
  }));
  return c.report();
}

function sparseReceipt(c,receipt,scenario,index) {
  c.equal(receipt.type,'delivery','permanent-delivery-type');c.equal(receipt.dockIndex,index,'permanent-dock-order');
  const s={layout:layout(scenario),deliveries:index};
  c.equal(receipt.allowedCenter,allowed(s),'permanent-allowed-center');
  c.equal(receipt.speedLimit,0.3,'permanent-speed-limit');c.equal(receipt.dwell,0.6,'permanent-dwell');
  c.equal(receipt.deliveriesBefore,index,'permanent-count-before');c.equal(receipt.deliveriesAfter,index+1,'permanent-count-after');
  c.ok(receipt.x>=receipt.allowedCenter[0]-1e-9&&receipt.x<=receipt.allowedCenter[1]+1e-9,'receipt-contained-at-recorded-event',receipt.x);
  c.ok(Math.abs(receipt.v)<=0.3+1e-9,'receipt-slow-at-recorded-event',receipt.v);
}
export function auditBrowserSparse(corpus) {
  const c=new Check('browser-sparse');
  if(!c.ok(!own(corpus,'pilotDiagnostics'),'public-projection-required','Provide the public-only artifact.'))return c.report();
  c.equal(corpus.schema,'frost-brake-browser-sparse-v1','browser-schema');c.equal(corpus.kind,'browser-sparse','browser-kind');
  if(!c.ok(Array.isArray(corpus.runs)&&corpus.runs.length>0,'browser-runs',typeof corpus.runs))return c.report();
  corpus.runs.forEach((run,ri)=>c.at(`$.runs[${ri}]`,()=>{
    c.stats.runs++;c.ok(['menu-start','retry'].includes(run.runBoundary?.kind),'explicit-real-run-boundary',run.runBoundary);
    c.ok(Array.isArray(run.samples)&&run.samples.length>0,'actual-samples-present',run.id);
    let previous=null,observedAt=-Infinity;
    run.samples.forEach((sample,i)=>c.at(`$.runs[${ri}].samples[${i}]`,()=>{
      c.stats.samples++;c.equal(sample.sampleIndex,i,'actual-sample-index');
      c.ok(finite(sample.observedAtMs)&&sample.observedAtMs>=observedAt,'observation-clock-order',sample.observedAtMs);observedAt=sample.observedAtMs;
      c.ok(plain(sample.snapshot),'actual-host-snapshot',sample.snapshot);
      const s=sample.snapshot.model;if(!publicState(c,s))return;
      c.equal(s.scenario,run.scenario,'browser-scenario');
      if(previous) {
        c.ok(s.nextSeq>=previous.nextSeq,'sparse-seq-monotone',s.nextSeq);
        c.ok(s.time>=previous.time,'sparse-time-monotone',s.time);
        c.ok(s.damage+TOL.damage>=previous.damage,'sparse-damage-never-heals',s.damage);
        c.equal(s.deliveryReceipts.slice(0,previous.deliveryReceipts.length),previous.deliveryReceipts,'permanent-receipt-prefix');
        if(previous.phase!=='playing')c.equal(s,previous,'sparse-terminal-snapshot-frozen');
      }
      s.deliveryReceipts.forEach((r,j)=>sparseReceipt(c,r,s.scenario,j));
      if(s.terminalReceipt) {
        c.equal(s.terminalReceipt.type,s.phase==='won'?'won':'lost','permanent-terminal-type');
        c.equal(s.terminalReceipt.phase,s.phase,'permanent-terminal-phase');
        c.near(s.terminalReceipt.x,s.x,'permanent-terminal-x',TOL.x);c.near(s.terminalReceipt.v,s.v,'permanent-terminal-v',TOL.v);
        c.near(s.terminalReceipt.damage,s.damage,'permanent-terminal-damage',TOL.damage);
      }
      previous=clone(s);
    }));
    if(previous)c.outcomes.push({id:run.id,scenario:run.scenario,lastObservedPhase:previous.phase,
      lastObservedDeliveries:previous.deliveries,sampleCount:run.samples.length});
  }));
  const report=c.report();
  report.coverage+=' Delivery dwell is receipt-reported; sparse images alone do not prove the intervening continuous dwell.';
  return report;
}
