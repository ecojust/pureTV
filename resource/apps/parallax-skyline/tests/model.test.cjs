'use strict';

// Formal rules only. Direct state patches are explicitly synthetic boundary
// fixtures, never ordinary-run, browser, timing, screenshot or video evidence.
// Model and this entire file require root review before the first import/run.
const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');
const {create, step, config} = Model;
const copy = value => JSON.parse(JSON.stringify(value));
const dt = 1 / 60;
const input = {left:{x:-1},right:{x:1},up:{y:-1},down:{y:1},a:{a:true},b:{b:true}};
function press(state, command) { step(state, dt, {}); return step(state, dt, input[command]); }
function fixture(patch = {}, level = 0) { return Object.assign(create(741, level), {inputArmed:true}, patch); }
function noOp(state, duration, sample) {
  const before = copy(state), refs = [state.positions,state.views,state.undoStack,state.submissions,state.lastHeld,state.events];
  assert.equal(step(state, duration, sample), state); assert.deepEqual(state, before);
  [state.positions,state.views,state.undoStack,state.submissions,state.lastHeld,state.events].forEach((v,i) => assert.equal(v,refs[i]));
}
function invariant(state) {
  assert.ok(state.positions[0] >= 2 && state.positions[0] <= 5);
  assert.ok(state.positions[1] >= 4 && state.positions[1] <= 14);
  assert.ok(state.undoStack.length <= 32 && state.submissions.length <= 4 && state.events.length <= 1);
  assert.ok(state.message.length <= 160);
  assert.equal(state.failures, state.submissions.filter(r => !r.matched).length);
  assert.equal(state.score, state.phase === 'won' ? 100 : 0);
  assert.equal(state.phase === 'lost', state.failures === 4);
  assert.equal(state.phase === 'won', state.submissions.some(r => r.matched));
  if (!state.counterSaturated) assert.ok(state.undoStack.length <= state.moves - state.undos);
  for (const view of state.views) {
    assert.equal(view.heights.length, 20); assert.equal(view.owners.length, 20);
    view.heights.forEach((h,i) => {
      assert.ok(Number.isInteger(h) && h >= 0 && h <= 6);
      assert.ok([-1,0,1].includes(view.owners[i])); assert.equal(view.owners[i] === -1, h === 0);
    });
  }
  for (const key of ['calls','moves','undos','viewChanges','focusChanges'])
    assert.ok(Number.isInteger(state[key]) && state[key] >= 0 && state[key] <= 2147483647);
  assert.ok(Number.isFinite(state.elapsed) && state.elapsed >= 0 && state.elapsed <= 3600);
}
// An algebraic fixture derived from the two published landmark equations,
// not a solver, discovered route or privileged model API.
function publicAnchorFixture(level) {
  const marks = config.tasks[level].landmarks;
  return fixture({positions:[marks[0].column / 2 - marks[0].localColumn,
    marks[1].column + 1 - marks[1].localColumn]}, level);
}

test('public API and exact immutable configuration match the accepted three-task tables', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['config','create','step']);
  assert.deepEqual({...config,tasks:undefined}, {defaultSeed:741,columns:20,maxHeight:6,scales:[2,1],offsets:[[0,0],[-4,-1]],
    bounds:[[2,5],[4,14]],focusNames:['NEAR','FAR','VIEW'],attemptLimit:4,historyLimit:32,maxCounter:2147483647,maxElapsed:3600,tasks:undefined});
  assert.deepEqual(config.tasks.map(t => [t.id,t.name,t.nameZh,t.initialPositions,t.profiles]), [
    ['courtyard','COURTYARD','庭院遮挡',[5,4],[[2,4,5,4,2],[1,3,2,3,1]]],
    ['riverfront','RIVERFRONT','河岸交错',[2,13],[[3,5,3,6,2],[2,4,5,2,4]]],
    ['twin-spires','TWIN SPIRES','双塔视差',[5,4],[[2,6,3,5,4],[4,2,6,3,2]]]
  ]);
  assert.deepEqual(config.tasks.map(t => t.targets), [
    [[0,0,0,0,0,0,2,2,4,4,5,5,4,4,2,2,0,0,0,0],[0,0,2,2,4,4,5,5,4,4,2,3,1,0,0,0,0,0,0,0]],
    [[0,0,0,0,0,0,2,4,5,3,5,5,3,3,6,6,2,2,0,0],[0,0,0,0,3,3,5,5,3,4,6,6,2,2,0,0,0,0,0,0]],
    [[0,0,0,0,2,2,6,6,3,3,5,5,4,4,6,3,2,0,0,0],[2,2,6,6,3,3,5,5,4,4,0,4,2,6,3,2,0,0,0,0]]
  ]);
  assert.deepEqual(config.tasks.map(t => t.landmarks.map(a => [a.layer,a.localColumn,a.column,a.height])),
    [[[0,2,10,5],[1,3,11,3]],[[0,3,14,6],[1,4,9,4]],[[0,1,6,6],[1,2,13,6]]]);
  function deepFrozen(value) {
    if (value && typeof value === 'object') { assert.ok(Object.isFrozen(value)); Object.values(value).forEach(deepFrozen); }
  }
  deepFrozen(config); assert.ok(Object.isFrozen(Model));
  assert.throws(() => { config.tasks[0].targets[0][0] = 99; }, TypeError);
  assert.throws(() => { config.tasks[0].landmarks[0].column = 99; }, TypeError);
});

test('creation normalizes identity and allocates detached round data without consuming seed randomness', () => {
  for (const bad of [undefined,null,NaN,Infinity,-1,4294967296,1.1,'741',true]) assert.equal(create(bad,0).seed,741);
  for (const seed of [0,741,4294967295]) assert.equal(create(seed,0).seed,seed);
  for (const bad of [undefined,null,NaN,-1,3,0.1,'1',true]) assert.equal(create(741,bad).level,0);
  for (let level=0; level<3; level++) {
    const a=create(741,level), b=create(741,level); assert.deepEqual(a,b);
    for (const key of ['positions','views','undoStack','submissions','lastHeld','events']) assert.notEqual(a[key],b[key]);
    assert.notEqual(a.positions,config.tasks[level].initialPositions);
    assert.notEqual(a.views[0].heights,a.views[1].heights); assert.notEqual(a.views[0].anchor,b.views[0].anchor);
    assert.equal(a.inputArmed,false); assert.equal(a.cancelEpoch,null); invariant(a);
  }
});

test('synthetic public-anchor fixtures freshly project and pass all four checks for every task', () => {
  for (let level=0; level<3; level++) {
    const state=publicAnchorFixture(level); step(state,dt,{a:true});
    assert.equal(state.phase,'won'); assert.equal(state.score,100); assert.equal(state.failures,0);
    state.views.forEach((v,i) => {
      assert.deepEqual(v.heights,config.tasks[level].targets[i]); assert.equal(v.silhouetteMatched,true);
      assert.equal(v.anchor.column,config.tasks[level].landmarks[i].column);
      assert.equal(v.anchor.visible,true); assert.equal(v.anchor.matched,true);
    });
    assert.deepEqual(state.events,[{type:'win',call:1}]); invariant(state);
  }
});

test('synthetic legal extrema remain in twenty cells with negative camera offsets and correct width', () => {
  for (let level=0; level<3; level++) for (const near of [2,5]) for (const far of [4,14]) {
    const state=fixture({positions:[near,far]},level); step(state,dt,{a:true}); invariant(state);
    const firstNear=2*near-4, lastNear=2*(near+4)-4+1;
    assert.ok(firstNear>=0 && lastNear<20);
    assert.ok(state.views[1].heights[firstNear] >= config.tasks[level].profiles[0][0]);
    assert.ok(state.views[1].heights[lastNear] >= config.tasks[level].profiles[0][4]);
    assert.deepEqual(Object.keys(state.views[0].heights),Array.from({length:20},(_,i)=>String(i)));
  }
});

test('near and far ordinary moves have distinct two-cell and one-cell projection displacement', () => {
  const state=create(741,0); step(state,dt,{});
  const near=state.views[0].anchor.column, far=state.views[1].anchor.column;
  press(state,'left'); assert.equal(state.views[0].anchor.column,near-2); assert.equal(state.views[1].anchor.column,far);
  press(state,'down'); press(state,'right');
  assert.equal(state.views[0].anchor.column,near-2); assert.equal(state.views[1].anchor.column,far+1);
  assert.deepEqual(state.positions,[4,5]); assert.equal(state.moves,2); invariant(state);
});

test('synthetic equal-height far roof loses ownership and its designated anchor is hidden', () => {
  const state=fixture({positions:[3,4]},2); step(state,dt,{a:true});
  assert.equal(state.views[1].heights[5],6); assert.equal(state.views[1].owners[5],0);
  assert.equal(state.views[1].anchor.column,5); assert.equal(state.views[1].anchor.height,6);
  assert.equal(state.views[1].anchor.visible,false); assert.equal(state.views[1].anchor.matched,false);
  const covered=fixture({positions:[3,6]},1); step(covered,dt,{a:true});
  assert.equal(covered.views[1].anchor.column,9); assert.equal(covered.views[1].anchor.height,4);
  assert.equal(covered.views[1].heights[9],6); assert.equal(covered.views[1].anchor.visible,false);
});

test('the published main-view false placement is rejected by a fresh two-view submission', () => {
  const state=fixture({positions:[3,8]}); step(state,dt,{a:true});
  assert.equal(state.views[0].silhouetteMatched,true); assert.equal(state.views[0].anchor.matched,true);
  assert.equal(state.views[1].silhouetteMatched,false); assert.equal(state.views[1].anchor.matched,false);
  assert.equal(state.phase,'playing'); assert.equal(state.failures,1); assert.equal(state.submissions[0].matched,false);
  assert.deepEqual(state.submissions[0].checks,[{silhouette:true,anchor:true},{silhouette:false,anchor:false}]);
  assert.match(state.message,/观察点 1.*轮廓/); invariant(state);
});

test('submission ignores forged cached match flags and recomputes actual geometry', () => {
  const wrong=fixture(); wrong.views.forEach(v => { v.silhouetteMatched=true; v.anchor.matched=true; });
  step(wrong,dt,{a:true}); assert.equal(wrong.phase,'playing'); assert.equal(wrong.failures,1);
  const correct=publicAnchorFixture(1); correct.views.forEach(v => { v.silhouetteMatched=false; v.anchor.matched=false; });
  step(correct,dt,{a:true}); assert.equal(correct.phase,'won');
});

test('view emphasis and focus selection preserve both projections, placements and undo history', () => {
  const state=create(741,0); press(state,'left');
  const positions=copy(state.positions), views=copy(state.views), history=copy(state.undoStack);
  press(state,'up'); assert.equal(state.focus,2);
  press(state,'right'); assert.equal(state.view,1); assert.equal(state.viewChanges,1);
  press(state,'right'); assert.equal(state.viewChanges,1); assert.deepEqual(state.events,[]);
  press(state,'left'); assert.equal(state.view,0); assert.equal(state.viewChanges,2);
  assert.deepEqual(state.positions,positions); assert.deepEqual(state.views,views); assert.deepEqual(state.undoStack,history);
  press(state,'down'); assert.equal(state.focus,0); press(state,'up'); assert.equal(state.focus,2);
  assert.equal(state.failures,0); invariant(state);
});

test('whole-pair undo restores edits across both layers without refunding rejection or view/focus', () => {
  const state=create(741,0); press(state,'left'); press(state,'down'); press(state,'right');
  assert.deepEqual(state.positions,[4,5]); assert.deepEqual(state.undoStack,[[5,4],[4,4]]);
  press(state,'a'); const receipt=copy(state.submissions[0]), time=state.elapsed;
  press(state,'down'); press(state,'right'); assert.equal(state.focus,2); assert.equal(state.view,1);
  press(state,'b'); assert.deepEqual(state.positions,[4,4]); assert.equal(state.focus,2); assert.equal(state.view,1);
  assert.equal(state.failures,1); assert.deepEqual(state.submissions,[receipt]); assert.ok(state.elapsed>time);
  press(state,'b'); assert.deepEqual(state.positions,[5,4]); assert.equal(state.undos,2);
  press(state,'b'); assert.equal(state.undos,2); assert.deepEqual(state.events,[]); assert.equal(state.moves,2); invariant(state);
});

test('history discards only the oldest full pair at the thirty-two entry cap', () => {
  const state=create(741,0); step(state,dt,{}); const prior=[];
  for (let i=0;i<80;i++) { prior.push(copy(state.positions)); step(state,dt,i%2?{x:1}:{x:-1}); invariant(state); }
  assert.equal(state.moves,80); assert.deepEqual(state.undoStack,prior.slice(-32));
  for (let i=0;i<32;i++) { press(state,'b'); assert.deepEqual(state.positions,prior[79-i]); invariant(state); }
  assert.equal(state.undos,32); assert.equal(state.undoStack.length,0);
  const position=copy(state.positions); press(state,'b'); assert.deepEqual(state.positions,position); assert.equal(state.undos,32);
});

test('history, caches, receipts and fresh positions do not alias each other', () => {
  const state=create(741,0); press(state,'left'); press(state,'down'); press(state,'right'); press(state,'a');
  assert.notEqual(state.undoStack[0],state.undoStack[1]); assert.notEqual(state.undoStack[1],state.positions);
  assert.notEqual(state.submissions[0].positions,state.positions);
  const receipt=copy(state.submissions[0]), oldPair=state.undoStack[1];
  press(state,'b'); assert.notEqual(state.positions,oldPair); press(state,'left');
  assert.deepEqual(state.submissions[0],receipt); assert.notEqual(state.views[0].heights,state.views[1].heights);
  assert.notEqual(state.submissions[0].checks[0],state.submissions[0].checks[1]); invariant(state);
});

test('movement bounds consume the edge without history, move count or repeated hold effects', () => {
  const state=create(741,0); press(state,'right'); assert.equal(state.positions[0],5);
  assert.equal(state.moves,0); assert.deepEqual(state.events,[]); assert.equal(state.lastCommand,'right');
  for (let i=0;i<5;i++) step(state,0.25,{x:1}); assert.equal(state.moves,0); assert.equal(state.lastCommand,'none');
  step(state,dt,{x:-1}); assert.equal(state.positions[0],4); assert.equal(state.moves,1);
  for (let i=0;i<5;i++) step(state,0.25,{x:-1}); assert.equal(state.positions[0],4);
  step(state,dt,{x:1}); assert.equal(state.positions[0],5); assert.equal(state.moves,2); invariant(state);
});

test('direction threshold, clamping and vertical diagonal ties use one deterministic edge', () => {
  const state=fixture({positions:[4,8]});
  step(state,dt,{x:0.5,y:-0.5}); assert.equal(state.lastHeld.direction,'none'); assert.deepEqual(state.positions,[4,8]);
  step(state,dt,{x:0.500001}); assert.equal(state.positions[0],5);
  step(state,dt,{x:-2,y:2}); assert.equal(state.focus,1); assert.equal(state.lastCommand,'down');
  step(state,dt,{x:-0.9,y:-0.8}); assert.equal(state.positions[1],7); assert.equal(state.lastCommand,'left');
  step(state,dt,{x:0.7,y:-0.7}); assert.equal(state.focus,0); assert.equal(state.lastCommand,'up');
  invariant(state);
});

test('simultaneous B A and direction consume all edges with B then A priority', () => {
  const state=create(741,0); press(state,'left'); step(state,dt,{});
  step(state,dt,{a:true,b:true,x:1}); assert.equal(state.lastCommand,'b'); assert.deepEqual(state.positions,[5,4]);
  assert.equal(state.failures,0); assert.equal(state.undos,1);
  step(state,dt,{a:true,x:1}); assert.equal(state.lastCommand,'none'); assert.equal(state.failures,0);
  step(state,dt,{}); step(state,dt,{a:true,x:-1}); assert.equal(state.lastCommand,'a'); assert.equal(state.failures,1);
  assert.deepEqual(state.positions,[5,4]);
  step(state,dt,{a:true,x:1}); assert.equal(state.lastCommand,'right'); assert.equal(state.failures,1);
  step(state,dt,{a:true,x:-1}); assert.equal(state.positions[0],4); assert.equal(state.failures,1); invariant(state);
});

test('four distinct incorrect submission edges lose once and held A never repeats', () => {
  const state=create(741,0); press(state,'a');
  for (let i=0;i<30;i++) step(state,0.25,{a:true}); assert.equal(state.failures,1); assert.equal(state.submissions.length,1);
  for (let i=1;i<4;i++) { press(state,'a'); assert.equal(state.failures,i+1); }
  assert.equal(state.phase,'lost'); assert.equal(state.reason,'attempts'); assert.equal(state.score,0);
  assert.deepEqual(state.events,[{type:'collision',reason:'attempts',call:state.calls}]);
  state.submissions.forEach((r,i) => { assert.equal(r.index,i); assert.equal(r.failuresAfter,i+1); assert.equal(r.attemptsLeft,3-i); });
  invariant(state); noOp(state,dt,{a:true,b:true,cancelled:true,cancelEpoch:99});
});

test('a correct last-chance synthetic placement wins after three actual rejected submissions', () => {
  const state=create(741,1); for (let i=0;i<3;i++) press(state,'a');
  const before=copy(state.submissions); state.positions=publicAnchorFixture(1).positions.slice();
  press(state,'a'); assert.equal(state.phase,'won'); assert.equal(state.failures,3); assert.equal(state.submissions.length,4);
  assert.equal(state.submissions[3].attemptsLeft,1); assert.equal(state.submissions[3].matched,true);
  assert.deepEqual(state.submissions.slice(0,3),before); invariant(state);
});

test('a correct arrangement stays active until A and receipts preserve exact updated call and clock', () => {
  const state=publicAnchorFixture(0); step(state,0.125,{});
  assert.equal(state.phase,'playing'); assert.equal(state.score,0);
  step(state,0.25,{a:true}); assert.equal(state.phase,'won');
  const receipt=state.submissions[0]; assert.equal(receipt.call,2); assert.equal(receipt.elapsed,0.375);
  assert.equal(receipt.failuresAfter,0); assert.equal(receipt.attemptsLeft,4);
  assert.deepEqual(receipt.positions,state.positions); assert.equal(state.lastCommand,'a'); invariant(state);
});

test('start and retry quarantine held controls until a genuinely neutral admitted sample', () => {
  const state=create(741,0);
  step(state,dt,{a:true,x:-1}); assert.equal(state.inputArmed,false); assert.equal(state.failures,0); assert.equal(state.moves,0);
  step(state,dt,{a:true}); assert.equal(state.inputArmed,false);
  step(state,dt,{}); assert.equal(state.inputArmed,true); assert.equal(state.lastCommand,'none');
  step(state,dt,{a:true}); assert.equal(state.failures,1);
  const retry=create(state.seed,state.level); assert.deepEqual(retry,create(741,0));
  step(retry,dt,{a:true}); assert.equal(retry.failures,0); assert.equal(retry.inputArmed,false);
});

test('epoch changes and persistent cancellation suppress stale input and cannot synthesize a release', () => {
  const state=create(741,0); step(state,dt,{cancelEpoch:4}); assert.equal(state.inputArmed,true);
  step(state,dt,{a:true,cancelEpoch:5}); assert.equal(state.failures,0); assert.equal(state.inputArmed,false);
  step(state,dt,{a:true,cancelEpoch:5}); assert.equal(state.failures,0);
  step(state,dt,{cancelled:true,cancelEpoch:5}); assert.equal(state.inputArmed,false);
  step(state,dt,{cancelled:true,cancelEpoch:5}); assert.equal(state.inputArmed,false);
  step(state,dt,{a:true,cancelEpoch:5}); assert.equal(state.inputArmed,false);
  step(state,dt,{cancelEpoch:5}); assert.equal(state.inputArmed,true);
  step(state,dt,{a:true,cancelEpoch:5}); assert.equal(state.failures,1);
  const before=state.elapsed; step(state,0.25,{cancelled:true,cancelEpoch:6});
  assert.equal(state.elapsed,before+0.25); assert.equal(state.failures,1); assert.equal(state.inputArmed,false);
  step(state,dt,{cancelEpoch:7}); assert.equal(state.inputArmed,true); assert.equal(state.lastCommand,'none');
  assert.equal(state.cancelEpoch,7); invariant(state);
});

test('first epoch is a baseline, invalid epochs are ignored, and cancellation rises disarm', () => {
  const state=create(741,0); step(state,dt,{}); step(state,dt,{x:-1,cancelEpoch:10});
  assert.equal(state.moves,1); assert.equal(state.cancelEpoch,10);
  for (const bad of [NaN,-1,Infinity,1.5,'11',9007199254740992]) {
    step(state,dt,{cancelEpoch:bad}); assert.equal(state.cancelEpoch,10); assert.equal(state.inputArmed,true);
  }
  step(state,dt,{x:1,cancelled:true}); assert.equal(state.positions[0],4); assert.equal(state.inputArmed,false);
  step(state,dt,{cancelled:false}); assert.equal(state.inputArmed,true);
});

test('only own literal data values are accepted and ordinary accessors never run', () => {
  let getters=0; const sample=Object.create({a:true,b:true,x:-1,paused:true,cancelEpoch:999});
  for (const key of ['a','b','x','y','paused','cancelled','cancelEpoch'])
    Object.defineProperty(sample,key,{get(){ getters++; throw Error('getter executed'); }});
  const state=fixture(); step(state,dt,sample); assert.equal(getters,0); assert.equal(state.calls,1);
  assert.equal(state.failures,0); assert.equal(state.moves,0); assert.equal(state.cancelEpoch,null);
  step(state,dt,{a:1,b:'true',paused:'true',cancelled:1,x:'-1',y:NaN,aPressed:true,bPressed:true});
  assert.equal(state.failures,0); assert.equal(state.moves,0); assert.equal(state.calls,2);
  const owned=Object.freeze({a:true,b:false,x:0,paused:false}); step(state,dt,owned); assert.equal(state.failures,1);
  assert.deepEqual(owned,{a:true,b:false,x:0,paused:false});
});

test('malformed containers and nonnumeric axes become empty or neutral without coercion', () => {
  const state=fixture(); const array=[]; array.a=true; const fn=()=>{}; fn.a=true;
  for (const sample of [null,undefined,0,'a',true,array,fn]) step(state,dt,sample);
  let coerced=0; step(state,dt,{x:{valueOf(){coerced++;return -1;}},y:Infinity,a:new Boolean(true)});
  assert.equal(coerced,0); assert.equal(state.moves,0); assert.equal(state.failures,0); assert.equal(state.calls,8);
});

test('throwing or revoked proxy normalization discards all partial fields before paused handling', () => {
  const seen=[]; const proxy=new Proxy({a:true,paused:true,cancelled:true}, {
    getOwnPropertyDescriptor(target,key) { seen.push(key); if(key==='cancelEpoch') throw Error('descriptor failure'); return Reflect.getOwnPropertyDescriptor(target,key); }
  });
  const state=create(741,0); step(state,dt,proxy);
  assert.deepEqual(seen,['x','y','a','b','cancelled','paused','cancelEpoch']);
  assert.equal(state.calls,1); assert.equal(state.failures,0); assert.equal(state.cancelledLast,false); assert.equal(state.inputArmed,true);
  const revoked=Proxy.revocable({},{}); revoked.revoke(); step(state,dt,revoked.proxy);
  assert.equal(state.calls,2); assert.equal(state.failures,0); assert.equal(state.lastCommand,'none');
  let reads=0; const valid=new Proxy({a:true},{getOwnPropertyDescriptor(t,k){reads++;return Reflect.getOwnPropertyDescriptor(t,k);}});
  step(state,dt,valid); assert.equal(reads,7); assert.equal(state.failures,1);
});

test('invalid durations, literal paused calls and terminal calls are exact no-ops', () => {
  const state=create(741,0); press(state,'left'); let traps=0;
  const proxy=new Proxy({},{getOwnPropertyDescriptor(){traps++;throw Error('must not read');}});
  for (const duration of [undefined,null,0,-1,0.250001,NaN,Infinity,'0.1',{},true]) noOp(state,duration,proxy);
  assert.equal(traps,0); noOp(state,0.25,{paused:true,a:true,cancelled:true,cancelEpoch:99});
  const won=publicAnchorFixture(0); step(won,dt,{a:true}); noOp(won,dt,proxy); assert.equal(traps,0);
  const lost=create(741,0); for(let i=0;i<4;i++) press(lost,'a'); noOp(lost,dt,proxy); assert.equal(traps,0);
});

test('one admitted large call means one edge and exact bounded active-clock addition', () => {
  const state=fixture({positions:[4,8]}); step(state,0.25,{x:-1});
  assert.equal(state.calls,1); assert.equal(state.moves,1); assert.equal(state.elapsed,0.25); assert.equal(state.positions[0],3);
  step(state,0.125,{x:-1}); assert.equal(state.moves,1); assert.equal(state.elapsed,0.375);
  step(state,0.125,{cancelled:true}); assert.equal(state.elapsed,0.5); assert.equal(state.calls,3);
  const split=fixture({positions:[4,8]}); for(let i=0;i<15;i++) step(split,1/60,{x:-1});
  assert.equal(split.moves,1); assert.deepEqual(split.positions,state.positions); assert.equal(split.calls,15);
});

test('synthetic counter and clock caps signal only overflow and never settle play', () => {
  const max=2147483647, state=fixture({calls:max-1,elapsed:3599.75}); step(state,0.25,{});
  assert.equal(state.calls,max); assert.equal(state.elapsed,3600); assert.equal(state.counterSaturated,false); assert.equal(state.clockSaturated,false);
  step(state,0.25,{}); assert.equal(state.calls,max); assert.equal(state.elapsed,3600);
  assert.equal(state.counterSaturated,true); assert.equal(state.clockSaturated,true); assert.equal(state.phase,'playing');
  for (const [field,patch,sample] of [
    ['moves',{positions:[4,8]},{x:-1}], ['undos',{positions:[4,8],undoStack:[[3,8]]},{b:true}],
    ['focusChanges',{}, {y:1}], ['viewChanges',{focus:2},{x:1}]
  ]) {
    const s=fixture({...patch,[field]:max}); step(s,dt,sample);
    assert.equal(s[field],max); assert.equal(s.counterSaturated,true); assert.equal(s.phase,'playing'); invariant(s);
  }
});

test('fresh retry restores all dirty fields and identical sequences remain deterministic', () => {
  const a=create(741,2), b=create(741,2), otherSeed=create(0,2);
  const sequence=[{}, {x:-1},{x:-1},{y:1},{x:1},{a:true},{},{b:true},{cancelled:true,cancelEpoch:1},{a:true},{},{y:-1},{x:-1}];
  for(const sample of sequence) {
    step(a,dt,sample); step(b,dt,sample); step(otherSeed,dt,sample);
    assert.deepEqual(a,b); assert.deepEqual({...otherSeed,seed:741},a); invariant(a);
  }
  const retry=create(a.seed,a.level), fresh=create(741,2); assert.deepEqual(retry,fresh);
  for(const key of ['positions','views','undoStack','submissions','lastHeld','events']) {
    assert.notEqual(retry[key],a[key]); assert.notEqual(retry[key],fresh[key]);
  }
});
