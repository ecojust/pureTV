'use strict';

// Formal rule checks, not ordinary-run or browser evidence. Direct state patches
// below are explicitly synthetic fixtures. The external math-only clipping check
// does not exercise a reachable game pose or any private Model geometry function.
// Root must review this complete file before its first import or execution.
const test=require('node:test');
const assert=require('node:assert/strict');
const Model=require('../src/main/assets/game-model.js');
const {create,step,config}=Model;
const dt=1/60, copy=value=>JSON.parse(JSON.stringify(value));
const inputs={up:{y:-1},down:{y:1},left:{x:-1},right:{x:1},a:{a:true},b:{b:true}};
function press(state,command) { step(state,dt,{}); return step(state,dt,inputs[command]); }
function fixture(patch={},level=0) { return Object.assign(create(742,level),{inputArmed:true},patch); }
function atPose(level,yaw,lamp) {
  // Synthetic post-rotation geometric fixture; never a claimed ordinary origin.
  const state=fixture({yaw:(yaw+3)%4,lamp},level);
  step(state,dt,{a:true}); return state;
}
const rowOrder=(a,b)=>a[1]-b[1] || a[0]-b[0];
function analyticSamples(prism,source) {
  // Independent published unit-prism sample formula, not a convex-hull clone.
  const [x,y]=prism.center, sx=-source[0], sy=-source[1], points=[];
  for(let k=0;k<=prism.height;k++) points.push([x+k*sx,y+k*sy]);
  if(sx!==0 && sy!==0) for(let k=1;k<=prism.height;k++) {
    points.push([x+k*sx,y+(k-1)*sy],[x+(k-1)*sx,y+k*sy]);
  }
  return points.sort(rowOrder);
}
function noOp(state,duration,sample) {
  const before=copy(state), refs=[state.geometry,state.adjustments,state.lastHeld,state.events];
  assert.equal(step(state,duration,sample),state); assert.deepEqual(state,before);
  [state.geometry,state.adjustments,state.lastHeld,state.events].forEach((value,i)=>assert.equal(value,refs[i]));
}
function invariant(state) {
  const g=state.geometry, task=config.tasks[state.level];
  assert.ok(Number.isInteger(state.yaw)&&state.yaw>=0&&state.yaw<4);
  assert.ok(Number.isInteger(state.lamp)&&state.lamp>=0&&state.lamp<8);
  assert.ok(state.focus===0||state.focus===1);
  assert.equal(state.adjustmentsUsed,state.adjustments.length);
  assert.equal(state.adjustmentsUsed,state.workRotations+state.lightRotations);
  assert.ok(state.adjustmentsUsed<=12&&state.events.length<=1&&state.message.length<=160);
  assert.equal(state.score,state.phase==='won'?100:0);
  assert.equal(g.shadowMask.length,169); assert.equal(g.shadowCells,g.coveredCells.length);
  assert.equal(g.shadowCells,g.shadowMask.filter(Boolean).length);
  assert.equal(g.targetHits,g.targetHitCells.length); assert.equal(g.forbiddenHits,g.forbiddenHitCells.length);
  assert.equal(g.targetPassed,g.targetHits>=task.requiredTargetHits);
  assert.equal(g.forbiddenPassed,g.forbiddenHits<=task.maxForbiddenHits);
  assert.equal(g.matched,g.targetPassed&&g.forbiddenPassed);
  assert.deepEqual(g.coveredCells.slice().sort(rowOrder),g.coveredCells);
  assert.equal(new Set(g.coveredCells.map(p=>p.join(','))).size,g.shadowCells);
  for(const p of g.coveredCells) {
    assert.ok(p.every(v=>Number.isInteger(v)&&v>=-6&&v<=6));
    assert.equal(g.shadowMask[(p[1]+6)*13+p[0]+6],true);
  }
  for(const key of ['calls','focusChanges']) assert.ok(Number.isInteger(state[key])&&state[key]>=0&&state[key]<=config.maxCounter);
  assert.ok(Number.isFinite(state.elapsed)&&state.elapsed>=0&&state.elapsed<=3600);
  if(state.phase==='playing') { assert.equal(g.matched,false); assert.ok(state.adjustmentsUsed<12); }
  if(state.phase==='won') { assert.equal(g.matched,true); assert.equal(state.adjustments.at(-1).matched,true); }
  if(state.phase==='lost') { assert.equal(state.adjustmentsUsed,12); assert.equal(g.matched,false); assert.equal(state.reason,'budget'); }
  state.adjustments.forEach((r,i)=>{
    assert.equal(r.index,i); assert.equal(r.remaining,11-i);
    if(i<state.adjustments.length-1) assert.equal(r.matched,false);
  });
}

test('only the accepted API and deeply frozen exact public task data are exported',()=>{
  assert.deepEqual(Object.keys(Model).sort(),['config','create','step']);
  assert.deepEqual({...config,tasks:undefined},{defaultSeed:742,boardMin:-6,boardMax:6,focusNames:['WORK','LIGHT'],
    lampNames:['E','SE','S','SW','W','NW','N','NE'],lampVectors:[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]],
    maxCounter:2147483647,maxElapsed:3600,tasks:undefined});
  assert.deepEqual(config.tasks.map(t=>[t.id,t.name,t.nameZh,t.pivot,t.prisms.map(p=>[...p.center,p.height]),
    t.initialYaw,t.initialLamp,t.footPrism,t.lightPrism,t.guideFoot,t.guideTip,t.requiredTargetHits,t.maxForbiddenHits,t.budget]),[
    ['west-cast','WEST CAST','西光落影',[0,0],[[0,0,3],[1,0,1],[1,1,2]],2,0,2,0,[1,1],[3,0],7,0,12],
    ['north-cast','NORTH CAST','北光长脊',[-1,0],[[0,0,2],[1,0,3],[0,1,1]],3,2,2,1,[-2,0],[-1,4],7,0,12],
    ['diagonal-pour','DIAGONAL POUR','斜光交叠',[0,1],[[0,0,3],[1,0,1],[1,1,2]],1,7,2,0,[1,0],[3,-2],11,0,12]
  ]);
  assert.deepEqual(config.tasks.map(t=>t.targetCells),[
    [[0,0],[1,0],[2,0],[3,0],[1,1],[2,1],[3,1]],
    [[-2,0],[-1,0],[-2,1],[-1,1],[-1,2],[-1,3],[-1,4]],
    [[2,-2],[3,-2],[0,-1],[1,-1],[2,-1],[3,-1],[0,0],[1,0],[2,0],[0,1],[1,1]]
  ]);
  assert.deepEqual(config.tasks.map(t=>t.forbiddenCells),[
    [[0,-1],[1,-1],[2,-1],[3,-1],[-3,0],[-2,0],[-1,0]],
    [[-3,-1],[-2,-1],[-1,-1],[0,0],[0,1],[0,2]],
    [[-2,1],[-1,1],[-2,2],[-1,2],[0,2],[1,2]]
  ]);
  function frozen(value) { if(value&&typeof value==='object') { assert.ok(Object.isFrozen(value)); Object.values(value).forEach(frozen); } }
  frozen(config); assert.ok(Object.isFrozen(Model));
  assert.throws(()=>{config.tasks[0].prisms[0].height=99;},TypeError);
  assert.throws(()=>{config.lampVectors[0][0]=0;},TypeError);
});

test('creation normalizes seeds and levels and detaches every round from configuration',()=>{
  for(const value of [undefined,null,NaN,Infinity,-1,4294967296,0.5,'742',true,{},1n]) assert.equal(create(value,0).seed,742);
  for(const seed of [0,742,4294967295]) assert.equal(create(seed,0).seed,seed);
  for(const value of [undefined,null,NaN,Infinity,-1,3,0.5,'1',true,1n]) assert.equal(create(742,value).level,0);
  for(let level=0;level<3;level++) {
    const a=create(742,level),b=create(742,level); assert.deepEqual(a,b);
    const seen=new Set();
    function collect(value) { if(value&&typeof value==='object') { seen.add(value); Object.values(value).forEach(collect); } }
    function disjoint(value) { if(value&&typeof value==='object') { assert.equal(seen.has(value),false); Object.values(value).forEach(disjoint); } }
    collect(config); collect(a); disjoint(b);
    assert.equal(a.inputArmed,false); assert.equal(a.cancelEpoch,null); invariant(a);
  }
});

test('all three initial masks and separate hit counts equal the public hand calculations',()=>{
  const expected=[
    [[-3,-1],[-2,-1],[-1,-1],[-3,0],[-2,0],[-1,0],[0,0]],
    [[-1,-4],[-1,-3],[-1,-2],[-1,-1],[0,-1],[-1,0],[0,0]],
    [[-1,1],[0,1],[-2,2],[-1,2],[0,2],[-3,3],[-2,3],[-1,3],[0,3],[-3,4],[-2,4]]
  ];
  for(let level=0;level<3;level++) {
    const state=create(742,level),g=state.geometry;
    assert.deepEqual(g.coveredCells,expected[level]);
    assert.deepEqual([g.shadowCells,g.targetHits,g.forbiddenHits],[[7,1,3],[7,1,2],[11,1,4]][level]);
    assert.equal(g.matched,false); invariant(state);
  }
});

test('synthetic public-guide geometries cover exactly the authored targets and avoid forbidden cells',()=>{
  // Bearings are the hand calculations printed in public-design.md, not a route.
  for(const [level,yaw,lamp] of [[0,0,4],[1,1,6],[2,3,3]]) {
    const state=atPose(level,yaw,lamp),g=state.geometry,task=config.tasks[level];
    assert.deepEqual(g.coveredCells,task.targetCells); assert.deepEqual(g.targetHitCells,task.targetCells);
    assert.deepEqual(g.forbiddenHitCells,[]); assert.deepEqual(g.footPoint,task.guideFoot); assert.deepEqual(g.tipPoint,task.guideTip);
    assert.equal(state.phase,'won'); assert.equal(state.adjustmentsUsed,1); invariant(state);
  }
});

test('rigid quarter yaw rotates all centers about the translated pivot',()=>{
  const expected=[[[0,1],[1,1],[1,2]],[[0,1],[0,2],[-1,2]],[[0,1],[-1,1],[-1,0]],[[0,1],[0,0],[1,0]]];
  for(let yaw=0;yaw<4;yaw++) {
    const state=atPose(2,yaw,7);
    assert.deepEqual(state.geometry.prisms.map(p=>p.center),expected[yaw]);
    assert.deepEqual(state.geometry.prisms.map(p=>p.height),[3,1,2]);
  }
  assert.deepEqual(atPose(1,1,2).geometry.prisms.map(p=>p.center),[[-1,0],[-1,1],[-2,0]]);
});

test('all eight source sectors cast in the opposite direction with the specified diagonal slope',()=>{
  const rays=[[-1,0,-1],[-1,-1,-1],[0,-1,-1],[1,-1,-1],[1,0,-1],[1,1,-1],[0,1,-1],[-1,1,-1]];
  const tips=[[-3,0],[-3,-3],[0,-3],[3,-3],[3,0],[3,3],[0,3],[-3,3]];
  for(let lamp=0;lamp<8;lamp++) {
    const g=atPose(0,2,lamp).geometry;
    assert.deepEqual(g.lightVector,config.lampVectors[lamp]); assert.deepEqual(g.lightRay,rays[lamp]); assert.deepEqual(g.tipPoint,tips[lamp]);
    const xs=g.shadowHulls2[0].map(p=>p[0]),ys=g.shadowHulls2[0].map(p=>p[1]);
    assert.deepEqual([Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)],
      [Math.min(-1,2*tips[lamp][0]-1),Math.max(1,2*tips[lamp][0]+1),Math.min(-1,2*tips[lamp][1]-1),Math.max(1,2*tips[lamp][1]+1)]);
  }
});

test('closed diagonal hull edges include the extra boundary samples and exclude exterior neighbors',()=>{
  const g=atPose(0,0,3).geometry;
  assert.deepEqual(g.shadowHulls2[0],[[-1,-1],[5,-7],[7,-7],[7,-5],[1,1],[-1,1]]);
  for(const p of [[2,-3],[3,-2],[0,-1]]) assert.equal(g.shadowMask[(p[1]+6)*13+p[0]+6],true);
  for(const p of [[3,-4],[4,-3],[-1,-1]]) assert.equal(g.shadowMask[(p[1]+6)*13+p[0]+6],false);
});

test('footprints and doubled vertices represent grounded boxes with real height scaling',()=>{
  const g=atPose(1,1,6).geometry;
  for(const p of g.prisms) {
    const [x,y]=p.center;
    assert.deepEqual(p.footprint2,[[2*x-1,2*y-1],[2*x+1,2*y-1],[2*x+1,2*y+1],[2*x-1,2*y+1]]);
    assert.deepEqual(p.vertices2.slice(0,4),p.footprint2.map(v=>[...v,0]));
    assert.deepEqual(p.vertices2.slice(4),p.footprint2.map(v=>[...v,2*p.height]));
    assert.equal(g.shadowMask[(y+6)*13+x+6],true);
  }
  assert.deepEqual(g.shadowHulls2.map(h=>Math.max(...h.map(p=>p[1]))-Math.min(...h.map(p=>p[1]))),[6,8,4]);
});

test('overlapping prism shadows form one union rather than summed per-prism counts',()=>{
  for(const [level,yaw,lamp,counts,total] of [[0,0,4,[4,2,3],7],[1,1,6,[3,4,2],7],[2,3,3,[10,4,7],11]]) {
    const g=atPose(level,yaw,lamp).geometry,parts=g.prisms.map(p=>analyticSamples(p,g.lightVector));
    assert.deepEqual(parts.map(p=>p.length),counts);
    const unique=Array.from(new Set(parts.flat().map(p=>p.join(','))),key=>key.split(',').map(Number)).sort(rowOrder);
    assert.deepEqual(g.coveredCells,unique); assert.equal(g.shadowCells,total); assert.ok(counts.reduce((a,b)=>a+b)>total);
  }
});

test('equal total coverage cannot replace independent target and forbidden checks',()=>{
  const initial=create(742,0).geometry,valid=atPose(0,0,4).geometry,wrong=atPose(0,1,4).geometry;
  assert.equal(initial.shadowCells,valid.shadowCells); assert.equal(initial.matched,false); assert.equal(valid.matched,true);
  assert.equal(initial.targetPassed,false); assert.equal(initial.forbiddenPassed,false);
  assert.equal(wrong.targetPassed,false); assert.equal(wrong.forbiddenPassed,true); assert.equal(wrong.matched,false);
});

test('every rotation replaces forged caches and judges fresh geometry from physical indices',()=>{
  const wrong=fixture(); wrong.geometry.matched=true; wrong.geometry.targetHits=7; wrong.geometry.forbiddenHits=0;
  wrong.geometry.shadowMask.fill(true); step(wrong,dt,{a:true});
  assert.equal(wrong.phase,'playing'); assert.equal(wrong.geometry.matched,false); assert.ok(wrong.geometry.shadowCells<169);
  const correct=fixture({yaw:3,lamp:4}); correct.geometry.matched=false; correct.geometry.targetHits=0;
  step(correct,dt,{a:true}); assert.equal(correct.phase,'won'); assert.equal(correct.geometry.targetHits,7);
});

test('absolute focus selections are free and do not rebuild or mutate the geometry',()=>{
  const state=create(742,0),geometry=state.geometry;
  for(const [key,focus,changes] of [['left',0,0],['up',0,0],['right',1,1],['down',1,1],['up',0,2]]) {
    press(state,key); assert.equal(state.focus,focus); assert.equal(state.focusChanges,changes);
    assert.equal(state.geometry,geometry); assert.equal(state.adjustmentsUsed,0); assert.equal(state.lastCommand,key);
  }
  assert.deepEqual(state.events,[{type:'focus',focus:0,call:state.calls}]);
  press(state,'up'); assert.deepEqual(state.events,[]); invariant(state);
});

test('clockwise and counterclockwise steps wrap each selected ring without changing the other',()=>{
  for(const [focus,yaw,lamp,key,expected] of [[0,3,0,'a',[0,0]],[0,0,0,'b',[3,0]],[1,2,7,'a',[2,0]],[1,2,0,'b',[2,7]]]) {
    const state=fixture({focus,yaw,lamp}); step(state,dt,inputs[key]);
    assert.deepEqual([state.yaw,state.lamp],expected); assert.equal(state.adjustmentsUsed,1);
    assert.deepEqual([state.workRotations,state.lightRotations],focus===0?[1,0]:[0,1]);
  }
});

test('rotation receipts keep exact advanced time, before/after indices and previous immutable facts',()=>{
  const state=fixture(); step(state,0.125,{a:true});
  assert.deepEqual(state.adjustments[0],{index:0,call:1,elapsed:0.125,focus:0,turn:1,from:{yaw:2,lamp:0},to:{yaw:3,lamp:0},
    targetHits:state.geometry.targetHits,forbiddenHits:state.geometry.forbiddenHits,shadowCells:state.geometry.shadowCells,
    matched:false,remaining:11,phase:'playing'});
  const receipt=copy(state.adjustments[0]),ref=state.adjustments[0];
  step(state,0.125,{}); step(state,0.25,{b:true});
  assert.equal(state.adjustments[0],ref); assert.deepEqual(ref,receipt);
  assert.equal(state.adjustments[1].elapsed,0.5); assert.equal(state.adjustments[1].call,3);
  assert.notEqual(state.adjustments[0].to,state.adjustments[1].from); invariant(state);
});

test('geometry arrays and guides are detached from each other, config and prior snapshots',()=>{
  const state=create(742,0),g=state.geometry,task=config.tasks[0];
  assert.notEqual(g.lightVector,config.lampVectors[0]); assert.notEqual(g.footPoint,g.prisms[2].center);
  assert.notEqual(g.lightCenter,g.prisms[0].center); assert.notEqual(g.targetHitCells[0],task.targetCells[0]);
  const covered=g.coveredCells.find(p=>p[0]===0&&p[1]===0); assert.notEqual(g.targetHitCells[0],covered);
  assert.notEqual(g.prisms[0].vertices2[0],g.prisms[0].footprint2[0]);
  const old=copy(g); press(state,'a'); assert.notEqual(state.geometry,g); assert.deepEqual(g,old);
});

test('held A or B never repeats but a released renewed press rotates again',()=>{
  for(const key of ['a','b']) {
    const state=create(742,0); press(state,key);
    for(let i=0;i<40;i++) step(state,0.25,inputs[key]);
    assert.equal(state.adjustmentsUsed,1); assert.equal(state.lastCommand,'none');
    press(state,key); assert.equal(state.adjustmentsUsed,2); invariant(state);
  }
});

test('B then A priority consumes all simultaneous edges and rotates the old focus',()=>{
  const state=fixture(); step(state,dt,{a:true,b:true,x:1});
  assert.equal(state.lastCommand,'b'); assert.equal(state.focus,0); assert.equal(state.yaw,1); assert.equal(state.adjustmentsUsed,1);
  step(state,dt,{a:true,x:1}); assert.equal(state.lastCommand,'none'); assert.equal(state.focus,0);
  step(state,dt,{}); step(state,dt,{a:true,y:1});
  assert.equal(state.lastCommand,'a'); assert.equal(state.focus,0); assert.equal(state.yaw,2);
  step(state,dt,{a:true,x:1}); assert.equal(state.lastCommand,'right'); assert.equal(state.focus,1);
  assert.equal(state.adjustmentsUsed,2); assert.equal(state.lamp,0); invariant(state);
});

test('threshold, clamping, vertical ties and changed direction tokens select one focus edge',()=>{
  const state=fixture(); step(state,dt,{x:0.5,y:-0.5}); assert.equal(state.lastHeld.direction,'none');
  step(state,dt,{x:0.500001}); assert.equal(state.focus,1); assert.equal(state.lastCommand,'right');
  step(state,dt,{x:-2,y:2}); assert.equal(state.lastCommand,'down'); assert.equal(state.focusChanges,1);
  step(state,dt,{x:-0.9,y:-0.8}); assert.equal(state.lastCommand,'left'); assert.equal(state.focus,0);
  step(state,dt,{x:0.7,y:-0.7}); assert.equal(state.lastCommand,'up'); assert.equal(state.focusChanges,2);
  step(state,dt,{x:0.8,y:-0.8}); assert.equal(state.lastCommand,'none'); invariant(state);
});

test('start and retry quarantine held controls until a noncancelled neutral sample',()=>{
  const state=create(742,0); step(state,dt,{a:true,x:1}); step(state,dt,{a:true});
  assert.equal(state.inputArmed,false); assert.equal(state.adjustmentsUsed,0); assert.equal(state.focus,0);
  step(state,dt,{}); assert.equal(state.inputArmed,true); assert.equal(state.lastCommand,'none');
  step(state,dt,{a:true}); assert.equal(state.adjustmentsUsed,1);
  const retry=create(state.seed,state.level); step(retry,dt,{a:true});
  assert.equal(retry.inputArmed,false); assert.equal(retry.adjustmentsUsed,0);
});

test('epoch changes and persistent cancellation suppress stale holds without synthetic release',()=>{
  const state=create(742,0); step(state,dt,{cancelEpoch:4});
  step(state,dt,{a:true,cancelEpoch:5}); step(state,dt,{a:true,cancelEpoch:5});
  assert.equal(state.inputArmed,false); assert.equal(state.adjustmentsUsed,0);
  step(state,dt,{cancelled:true,cancelEpoch:5}); step(state,dt,{cancelled:true,cancelEpoch:5});
  assert.equal(state.inputArmed,false); step(state,dt,{a:true,cancelEpoch:5}); assert.equal(state.inputArmed,false);
  step(state,dt,{cancelEpoch:5}); assert.equal(state.inputArmed,true);
  step(state,dt,{a:true,cancelEpoch:5}); assert.equal(state.adjustmentsUsed,1);
  const time=state.elapsed; step(state,0.25,{cancelled:true,cancelEpoch:6});
  assert.equal(state.elapsed,time+0.25); assert.equal(state.inputArmed,false);
  step(state,dt,{cancelEpoch:7}); assert.equal(state.inputArmed,true); assert.equal(state.lastCommand,'none');
});

test('first epoch establishes a baseline, invalid epochs are inert and cancellation rising disarms',()=>{
  const state=fixture(); step(state,dt,{a:true,cancelEpoch:10}); assert.equal(state.adjustmentsUsed,1); assert.equal(state.cancelEpoch,10);
  for(const value of [NaN,-1,Infinity,0.5,'11',9007199254740992,true]) {
    step(state,dt,{cancelEpoch:value}); assert.equal(state.cancelEpoch,10); assert.equal(state.inputArmed,true);
  }
  step(state,dt,{a:true,cancelled:true}); assert.equal(state.adjustmentsUsed,1); assert.equal(state.inputArmed,false);
  step(state,dt,{cancelled:false}); assert.equal(state.inputArmed,true);
});

test('only own literal data fields are admitted while getters and inherited controls remain inert',()=>{
  let getters=0; const sample=Object.create({a:true,b:true,x:1,paused:true,cancelEpoch:999});
  for(const key of ['x','y','a','b','paused','cancelled','cancelEpoch']) Object.defineProperty(sample,key,{get(){getters++;throw Error('getter');}});
  const state=fixture(); step(state,dt,sample);
  assert.equal(getters,0); assert.equal(state.calls,1); assert.equal(state.adjustmentsUsed,0); assert.equal(state.cancelEpoch,null);
  step(state,dt,{a:1,b:'true',paused:'true',cancelled:1,x:'1',y:NaN,aPressed:true,bPressed:true});
  assert.equal(state.adjustmentsUsed,0); assert.equal(state.focus,0);
  const owned=Object.freeze({a:true,b:false,x:0,paused:false}); step(state,dt,owned);
  assert.equal(state.adjustmentsUsed,1); assert.deepEqual(owned,{a:true,b:false,x:0,paused:false});
});

test('malformed containers normalize to armable neutral without value coercion or source inference',()=>{
  const array=[]; array.a=true; const fn=()=>{}; fn.a=true;
  for(const sample of [null,undefined,0,'a',true,array,fn]) {
    const state=create(742,0); step(state,dt,sample);
    assert.equal(state.inputArmed,true); assert.equal(state.adjustmentsUsed,0);
  }
  let coercions=0; const state=fixture();
  step(state,dt,{x:{valueOf(){coercions++;return 1;}},y:Infinity,a:new Boolean(true)});
  assert.equal(coercions,0); assert.equal(state.focus,0); assert.equal(state.adjustmentsUsed,0);
  const absent=create(742,0); step(absent,dt,{cancelled:true}); assert.equal(absent.inputArmed,false);
});

test('throwing descriptor and revoked proxies discard every partial field before paused handling',()=>{
  const seen=[],proxy=new Proxy({a:true,paused:true,cancelled:true},{getOwnPropertyDescriptor(t,k){
    seen.push(k); if(k==='cancelEpoch') throw Error('descriptor'); return Reflect.getOwnPropertyDescriptor(t,k);
  }});
  const state=create(742,0); step(state,dt,proxy);
  assert.deepEqual(seen,['x','y','a','b','cancelled','paused','cancelEpoch']);
  assert.equal(state.calls,1); assert.equal(state.cancelledLast,false); assert.equal(state.inputArmed,true); assert.equal(state.adjustmentsUsed,0);
  const revoked=Proxy.revocable({},{}); revoked.revoke(); step(state,dt,revoked.proxy);
  assert.equal(state.calls,2); assert.equal(state.lastCommand,'none');
  let reads=0; const valid=new Proxy({a:true},{getOwnPropertyDescriptor(t,k){reads++;return Reflect.getOwnPropertyDescriptor(t,k);}});
  step(state,dt,valid); assert.equal(reads,7); assert.equal(state.adjustmentsUsed,1);
});

test('invalid dt and own literal paused calls preserve every value and reference without reading invalid input',()=>{
  const state=create(742,0); press(state,'a'); let traps=0;
  const proxy=new Proxy({},{getOwnPropertyDescriptor(){traps++;throw Error('must not read');}});
  for(const duration of [undefined,null,0,-1,0.250001,NaN,Infinity,'0.1',{},true,1n]) noOp(state,duration,proxy);
  assert.equal(traps,0); noOp(state,0.25,{paused:true,a:true,cancelled:true,cancelEpoch:99});
});

test('admitted time advances once per call without held repeats or hidden physics ticks',()=>{
  const state=fixture(); step(state,0.25,{a:true}); step(state,0.125,{a:true}); step(state,0.125,{cancelled:true});
  assert.equal(state.calls,3); assert.equal(state.elapsed,0.5); assert.equal(state.adjustmentsUsed,1);
  const split=fixture(); for(let i=0;i<15;i++) step(split,dt,{a:true});
  assert.equal(split.adjustmentsUsed,1); assert.equal(split.yaw,state.yaw); assert.equal(split.calls,15);
  const tiny=fixture(); step(tiny,Number.MIN_VALUE,{a:true}); assert.equal(tiny.adjustmentsUsed,1); assert.equal(tiny.elapsed,Number.MIN_VALUE);
});

test('synthetic counter and clock caps signal overflow only and do not settle a round',()=>{
  const state=fixture({calls:2147483646,elapsed:3599.75}); step(state,0.25,{});
  assert.equal(state.calls,2147483647); assert.equal(state.elapsed,3600); assert.equal(state.counterSaturated,false); assert.equal(state.clockSaturated,false);
  step(state,0.25,{}); assert.equal(state.calls,2147483647); assert.equal(state.elapsed,3600);
  assert.equal(state.counterSaturated,true); assert.equal(state.clockSaturated,true); assert.equal(state.phase,'playing');
  const focus=fixture({focusChanges:2147483647}); step(focus,dt,{x:1});
  assert.equal(focus.focusChanges,2147483647); assert.equal(focus.counterSaturated,true); invariant(focus);
});

test('twelve ordinary WORK presses with each original lamp produce genuine budget exhaustion',()=>{
  for(let level=0;level<3;level++) {
    const state=create(742,level);
    for(let i=0;i<12;i++) { press(state,'a'); assert.equal(state.adjustmentsUsed,i+1); invariant(state); }
    assert.equal(state.phase,'lost'); assert.equal(state.lamp,config.tasks[level].initialLamp);
    assert.equal(state.yaw,config.tasks[level].initialYaw); assert.equal(state.adjustments.at(-1).remaining,0);
    assert.deepEqual(state.events,[{type:'collision',reason:'budget',call:state.calls}]);
  }
});

test('a labeled synthetic twelfth-adjustment success wins before budget exhaustion',()=>{
  const state=create(742,0); for(let i=0;i<11;i++) press(state,'a');
  const previous=copy(state.adjustments);
  // Synthetic physical placement for terminal priority only; not an ordinary run.
  state.yaw=3; state.lamp=4; press(state,'a');
  assert.equal(state.phase,'won'); assert.equal(state.reason,''); assert.equal(state.score,100);
  assert.equal(state.adjustmentsUsed,12); assert.equal(state.adjustments.at(-1).remaining,0);
  assert.deepEqual(state.adjustments.slice(0,11),previous); assert.deepEqual(state.events,[{type:'win',call:state.calls}]); invariant(state);
});

test('neutral and focus calls never adjudicate a synthetic matching pose or cached matched flag',()=>{
  const state=fixture({yaw:0,lamp:4}); state.geometry.matched=true;
  const geometry=state.geometry; step(state,dt,{}); step(state,dt,{x:1});
  assert.equal(state.phase,'playing'); assert.equal(state.adjustmentsUsed,0); assert.equal(state.geometry,geometry);
  assert.equal(state.focus,1); assert.equal(state.adjustments.length,0);
});

test('both terminal outcomes freeze geometry receipts gates events and clocks before input access',()=>{
  const won=atPose(0,0,4),lost=create(742,0); for(let i=0;i<12;i++) press(lost,'a');
  let reads=0; const proxy=new Proxy({},{getOwnPropertyDescriptor(){reads++;throw Error('terminal read');}});
  for(const state of [won,lost]) { noOp(state,dt,proxy); noOp(state,0.25,{a:true,b:true,cancelled:true,cancelEpoch:99}); }
  assert.equal(reads,0);
});

test('public integer hulls are canonical, bounded, nondegenerate and use the finite 169-cell board',()=>{
  for(const [level,yaw,lamp] of [[0,2,0],[0,0,3],[1,2,0],[1,1,6],[2,1,7],[2,3,3]]) {
    const state=atPose(level,yaw,lamp); invariant(state);
    for(const polygon of state.geometry.shadowHulls2) {
      assert.ok(polygon.length>=4&&polygon.length<=6);
      const sorted=polygon.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]); assert.deepEqual(polygon[0],sorted[0]);
      assert.equal(new Set(polygon.map(p=>p.join(','))).size,polygon.length);
      polygon.forEach((a,i)=>{
        const b=polygon[(i+1)%polygon.length],c=polygon[(i+2)%polygon.length];
        assert.ok((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>0);
        assert.ok(a.every(v=>Number.isInteger(v)&&Math.abs(v)<=11));
      });
    }
  }
});

test('synthetic mathematical exterior clipping example is separate from reachable Model poses',()=>{
  // Hypothetical height-three prism at (6,0), light from west. Its center
  // samples are x=6..9. This tests the public domain convention only; no Model
  // fixture export, unreachable pose execution or production coverage claim.
  const hypothetical=analyticSamples({center:[6,0],height:3},[-1,0]);
  assert.deepEqual(hypothetical,[[6,0],[7,0],[8,0],[9,0]]);
  assert.deepEqual(hypothetical.filter(([x,y])=>x>=-6&&x<=6&&y>=-6&&y<=6),[[6,0]]);
});

test('identical held sequences are deterministic across seeds and retry restores fresh round state',()=>{
  const a=create(742,2),b=create(742,2),other=create(0,2);
  const sequence=[{}, {a:true},{a:true},{x:1},{b:true},{},{a:true},{cancelled:true,cancelEpoch:1},{a:true},{},{y:-1},{b:true}];
  for(const sample of sequence) {
    step(a,dt,sample); step(b,dt,sample); step(other,dt,sample);
    assert.deepEqual(a,b); assert.deepEqual({...other,seed:742},a); invariant(a);
  }
  const retry=create(a.seed,a.level),fresh=create(742,2); assert.deepEqual(retry,fresh);
  for(const key of ['geometry','adjustments','lastHeld','events']) { assert.notEqual(retry[key],a[key]); assert.notEqual(retry[key],fresh[key]); }
});
