'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const model = require('../src/main/assets/game-model.js');
const DT = 1 / 120;
const clone = value => structuredClone(value);
const directions = [{ x: 1 }, { y: 1 }, { x: -1 }, { y: -1 }];
const strong = ['cable-1-1', 'cable-2-1', 'cable-2-2', 'cable-3-2'];
const economical = ['cable-1-1', 'cable-2-1', 'cable-3-2'];
function near(actual, expected, tolerance = 1e-8, message = '') { assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} != ${expected}`); }
function ticks(state, count, input = {}) { for (let i = 0; i < count; i += 1) model.step(state, DT, input); return state; }
function press(state, input) { model.step(state, 0.01, input); model.step(state, 0.01, {}); }
function selectedRoute(state, id) {
  const queue = [{ state: clone(state), route: [] }], seen = new Set([state.selectedId]);
  for (let head = 0; head < queue.length; head += 1) {
    const item = queue[head];
    if (item.state.selectedId === id) return item.route;
    for (const input of directions) {
      const next = clone(item.state); press(next, input);
      if (!seen.has(next.selectedId)) { seen.add(next.selectedId); queue.push({ state: next, route: [...item.route, input] }); }
    }
  }
  assert.fail('candidate cable cannot be selected through direction input: ' + id);
}
function select(state, id) { for (const input of selectedRoute(state, id)) press(state, input); }
function build(state, ids) { for (const id of ids) { select(state, id); press(state, { a: true }); } return state; }
function installed(state) { return state.cables.filter(cable => cable.installed).map(cable => cable.id); }
function runTest(state) {
  press(state, { b: true });
  for (let i = 0; i < 6000 && state.phase === 'playing' && state.mode === 'testing'; i += 1) ticks(state, 1);
  return state;
}
function isolatedCableFixture() {
  // White-box force fixture: no bridge panels, the vehicle remains on the bank.
  const state = model.create(); state.mode = 'testing'; state.panels = [];
  state.cables[0].installed = true;
  return state;
}
function movingSupportedCar() {
  const state=build(model.create(1,0),strong);press(state,{b:true});
  for(let i=0;i<3600&&state.mode==='testing';i++){
    ticks(state,1);
    if(state.car.wheels.every(w=>String(w.panelId).startsWith('panel-'))&&Math.abs(state.car.angle)>.015&&Math.abs(state.car.vy)>.003&&Math.abs(state.car.angularVelocity)>.001)return state;
  }
  assert.fail('Ordinary supported crossing must provide an inclined, moving departure pose');
}

test('supported vehicle velocities come from actual translating and turning poses',()=>{
  const state=movingSupportedCar();let movingVertically=false,turning=false;
  for(let i=0;i<120;i++){
    const before=clone(state.car);ticks(state,1);const car=state.car;
    assert.equal(car.falling,false);assert.equal(state.mode,'testing');
    near(car.vx,(car.x-before.x)/(state.pixelScale*DT));
    near(car.vy,(car.y-before.y)/(state.pixelScale*DT));
    near(car.angularVelocity,(car.angle-before.angle)/DT);
    movingVertically ||= Math.abs(car.vy)>.003;turning ||= Math.abs(car.angularVelocity)>.001;
  }
  assert.ok(movingVertically&&turning);
});

test('rupture after ordinary supported travel preserves departure momentum and wheel/body geometry',()=>{
  const state=movingSupportedCar(),before=clone(state.car),length=Math.hypot(before.wheels[1].x-before.wheels[0].x,before.wheels[1].y-before.wheels[0].y);
  // Explicit failure-boundary fixture: rupture all panels after a genuine
  // supported input sequence. This is not an ordinary gameplay/video result.
  state.panels.forEach(panel=>{panel.broken=true;});
  for(let i=1;i<=12;i++){
    ticks(state,1);const car=state.car,t=i*DT;
    assert.equal(car.falling,true);near(car.vx,before.vx);near(car.angularVelocity,before.angularVelocity);
    near(car.vy,before.vy+state.gravity*t);near(car.x,before.x+before.vx*state.pixelScale*t);
    near(car.y,before.y+(before.vy*t+.5*state.gravity*t*t)*state.pixelScale);
    near(car.angle,before.angle+before.angularVelocity*t);near(car.axleLength,length);
    near(Math.hypot(car.wheels[1].x-car.wheels[0].x,car.wheels[1].y-car.wheels[0].y)/143,length/143,1e-8,'rendered body scale cannot shrink on departure');
    car.wheels.forEach((wheel,index)=>{const sign=index?1:-1;near(wheel.x,car.x+Math.cos(car.angle)*sign*length/2);near(wheel.y,car.y+18+Math.sin(car.angle)*sign*length/2);assert.equal(wheel.contact,false);});
  }
});

test('free-flight gravity preserves zero or negative spin and horizontal momentum',()=>{
  for(const omega of [0,-.5]){
    // Synthetic airborne initial conditions isolate Newtonian free flight.
    const state=model.create(1,0);state.mode='testing';Object.assign(state.car,{falling:true,vx:-.3,vy:-1,angularVelocity:omega,angle:.2,axleLength:60});
    const before=clone(state.car);ticks(state,60);const car=state.car,t=60*DT;
    near(car.vx,-.3);near(car.angularVelocity,omega);near(car.vy,-1+state.gravity*t);
    near(car.x,before.x-.3*state.pixelScale*t);near(car.y,before.y+(-t+.5*state.gravity*t*t)*state.pixelScale);
    near(car.angle,before.angle+omega*t);near(car.axleLength,60);assert.equal(state.mode,'testing');
  }
});

test('UMD exposes the normal API and creates independent geometry for six distinct load cases', () => {
  const context = {}; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/main/assets/game-model.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(context.PureModel).sort(), ['TICK_HZ', 'create', 'step']);
  assert.deepEqual(Object.keys(model).sort(), ['TICK_HZ', 'create', 'step']);
  assert.equal(model.TICK_HZ, 120);
  const first = model.create(7, 2), edited = model.create(7, 2);
  edited.nodes[1].y += 90; edited.cables[0].installed = true; edited.anchors[0].x = -1;
  assert.deepEqual(model.create(7, 2), first);
  const cases = [0, 1, 2, 3, 4, 5].map(level => model.create(1, level));
  assert.equal(new Set(cases.map(state => state.car.mass)).size, 6);
  assert.equal(new Set(cases.map(state => state.budget)).size, 6);
  assert.equal(new Set(cases.map(state => JSON.stringify(state.anchors))).size, 6);
  assert.equal(model.create().level, 1); assert.equal(model.create(1, -4).level, 1); assert.equal(model.create(1, 100).level, 6);
});

test('reference cable lengths and integer costs derive from geometry, not from installed answers', () => {
  for (let level = 0; level < 6; level += 1) {
    const state = model.create(1, level);
    for (const cable of state.cables) {
      const anchor = state.anchors.find(item => item.id === cable.anchorId), node = state.nodes.find(item => item.id === cable.nodeId);
      const length = Math.hypot(anchor.x - node.x, anchor.y - node.y) / state.pixelScale;
      near(cable.restLength, length); assert.equal(cable.cost, Math.ceil(length * 10));
      assert.equal(cable.installed, false); assert.equal(cable.broken, false);
    }
    assert.ok(state.cables.reduce((sum, cable) => sum + cable.cost, 0) > state.budget, 'installing every cable is not affordable');
  }
});

test('all cable candidates are reachable and direction selection has a dead zone and delayed repeat', () => {
  for (let level = 0; level < 6; level += 1) {
    const state = model.create(1, level);
    for (const from of state.cables) { select(state, from.id); for (const to of state.cables) assert.ok(Array.isArray(selectedRoute(state, to.id))); }
  }
  const state = model.create(); press(state, { x: 0.3, y: 0.1 }); assert.equal(state.selectedId, 'cable-1-1');
  model.step(state, 0.01, { x: 1 }); const once = state.selectedId;
  model.step(state, 0.2, { x: 1 }); model.step(state, 0.2, { x: 1 }); assert.equal(state.selectedId, once);
  model.step(state, 0.02, { x: 1 }); assert.notEqual(state.selectedId, once);
});

test('material accounting supports add/remove, rejects unaffordable cables and never refunds deformation', () => {
  const state = model.create(); build(state, ['cable-1-1', 'cable-1-2', 'cable-2-1']);
  const paid = state.spent; assert.equal(paid, 199); assert.equal(state.remainingBudget, state.budget - paid);
  select(state, 'cable-2-2'); press(state, { a: true });
  assert.equal(state.cables.find(cable => cable.id === 'cable-2-2').installed, false); assert.equal(state.spent, paid);
  select(state, 'cable-1-2'); press(state, { a: true }); assert.equal(state.spent, paid - 87);
  press(state, { a: true }); assert.equal(state.spent, paid);
  const costs = state.cables.map(cable => cable.cost); press(state, { b: true }); ticks(state, 120);
  assert.deepEqual(state.cables.map(cable => cable.cost), costs); assert.equal(state.spent, paid); assert.ok(state.remainingBudget >= 0);
});

test('held A/B trigger once, explicit pulses preserve quick re-presses, and selection precedes build', () => {
  const state = model.create(); model.step(state, 0.001, { x: 1, aPressed: true });
  assert.equal(state.selectedId, 'cable-2-1'); assert.deepEqual(installed(state), ['cable-2-1']);
  model.step(state, 0.001, { a: true }); assert.deepEqual(installed(state), []);
  ticks(state, 30, { a: true }); assert.deepEqual(installed(state), []);
  model.step(state, 0.001, { a: true, aPressed: true }); assert.deepEqual(installed(state), ['cable-2-1']);
  model.step(state, 0.001, { b: true }); assert.equal(state.mode, 'testing'); ticks(state, 30, { b: true }); assert.equal(state.mode, 'testing');
  model.step(state, 0.001, { b: true, bPressed: true }); assert.equal(state.mode, 'editing');
  const simultaneous = model.create(); model.step(simultaneous, 0.001, { aPressed: true, bPressed: true });
  assert.deepEqual(simultaneous._blueprint.installed, ['cable-1-1'], 'a build is applied before B snapshots the test design');
});

test('a stretched cable applies its tensile vertical component with consistent metre/newton units', () => {
  const state = isolatedCableFixture(), cable = state.cables[0], node = state.nodes[1], anchor = state.anchors[0];
  node.y += 5; node.vy = 0.2;
  const oldY = node.y, oldVy = node.vy, dx = (node.x - anchor.x) / state.pixelScale, dy = (node.y - anchor.y) / state.pixelScale;
  const length = Math.hypot(dx, dy), tension = cable.stiffness * (length - cable.restLength) + cable.damping * oldVy * dy / length;
  assert.ok(tension > 0 && tension < cable.maxTension);
  const expectedForce = node.mass * state.gravity - oldVy * 12 - tension * dy / length;
  ticks(state, 1);
  near(cable.tension, tension); near(node.force, expectedForce); near(node.vy, oldVy + expectedForce / node.mass * DT);
  near(node.y, oldY + node.vy * state.pixelScale * DT);
  near(cable.length, Math.hypot(node.x - anchor.x, node.y - anchor.y) / state.pixelScale, 1e-8, 'rendered cable length uses the integrated endpoints');
});

test('slack/compressed cables do not push, and inward velocity cannot produce negative tension', () => {
  const compressed = isolatedCableFixture(); compressed.nodes[1].y -= 4; compressed.nodes[1].vy = 2; ticks(compressed, 1);
  assert.equal(compressed.cables[0].tension, 0); assert.equal(compressed.cables[0].broken, false);
  const inward = isolatedCableFixture(); inward.nodes[1].y += 1; inward.nodes[1].vy = -100; ticks(inward, 1);
  assert.equal(inward.cables[0].tension, 0); assert.equal(inward.cables[0].broken, false);
  const uninstalled = isolatedCableFixture(); uninstalled.cables[0].installed = false; uninstalled.nodes[1].y += 50; ticks(uninstalled, 1);
  assert.equal(uninstalled.cables[0].tension, 0); assert.equal(uninstalled.brokenCount, 0);
});

test('overload breaks a cable once and removes all subsequent cable force without refunding materials', () => {
  const state = isolatedCableFixture(), cable = state.cables[0], node = state.nodes[1];
  state.spent = cable.cost; state.remainingBudget = state.budget - state.spent; cable.maxTension = 1; node.y += 5;
  ticks(state, 1); assert.equal(cable.broken, true); assert.equal(state.brokenCount, 1); assert.equal(cable.tension, 0);
  assert.equal(state.events.filter(event => event.type === 'cable-break').length, 1);
  const brokeAt = cable.brokenAt, y = node.y, vy = node.vy;
  ticks(state, 1); near(node.force, node.mass * state.gravity - vy * 12);
  near(node.y, y + node.vy * state.pixelScale * DT); assert.equal(state.events.filter(event => event.type === 'cable-break').length, 0);
  ticks(state, 60); assert.equal(state.brokenCount, 1); assert.equal(cable.brokenAt, brokeAt); assert.equal(cable.tension, 0);
  assert.equal(state.spent, cable.cost); assert.equal(cable.installed, true);
});

test('panel shear/damping forces are equal and opposite and broken panels transmit no force', () => {
  function fixture(broken) {
    const state = model.create(); state.mode = 'testing'; state.panels = [state.panels[1]]; state.panels[0].broken = broken;
    state.nodes[1].y += 3; state.nodes[2].y += 12; state.nodes[1].vy = 0.1; state.nodes[2].vy = -0.2;
    return state;
  }
  const state = fixture(false), a = state.nodes[1], b = state.nodes[2], p = state.panels[0];
  const expected = p.stiffness * (b.y - a.y) / state.pixelScale + p.damping * (b.vy - a.vy);
  const baseA = a.mass * state.gravity - a.vy * 12, baseB = b.mass * state.gravity - b.vy * 12;
  ticks(state, 1); near(a.force - baseA, expected); near(b.force - baseB, -expected); near(a.force + b.force - baseA - baseB, 0);
  const broken = fixture(true), oldA = broken.nodes[1].vy, oldB = broken.nodes[2].vy; ticks(broken, 1);
  near(broken.nodes[1].force, broken.nodes[1].mass * broken.gravity - oldA * 12);
  near(broken.nodes[2].force, broken.nodes[2].mass * broken.gravity - oldB * 12);
});

test('an isolated displaced node has no hidden spring to its reference height', () => {
  const state = model.create(); state.mode = 'testing'; state.panels = []; const node = state.nodes[2]; node.y += 50; node.vy = 0;
  ticks(state, 1); near(node.force, node.mass * state.gravity); near(node.vy, state.gravity * DT);
  assert.ok(node.y > node.restY + 50);
  assert.ok(state.nodes.filter(item => item.fixed).every(item => item.y === item.restY && item.vy === 0), 'bank endpoints remain external fixed supports');
});

test('wheel loads sum to the actual vehicle weight and interpolate at physical contact positions', () => {
  const state = model.create(); state.mode = 'testing'; state.car.speed = 0;
  const a = state.nodes[1], b = state.nodes[2]; state.car.x = (a.x + b.x) / 2;
  const axleX = [state.car.x - state.car.wheelbase / 2, state.car.x + state.car.wheelbase / 2];
  const expectedA = axleX.reduce((sum, x) => sum + state.car.mass * state.gravity / 2 * (1 - (x - a.x) / (b.x - a.x)), 0);
  ticks(state, 1); near(a.load, expectedA); near(b.load, state.car.mass * state.gravity - expectedA);
  near(state.nodes.reduce((sum, node) => sum + node.load, 0), state.car.mass * state.gravity);
  assert.ok(state.car.wheels.every(wheel => wheel.contact && wheel.panelId === 'panel-1'));
  for (const wheel of state.car.wheels) {
    const u = (wheel.x - a.x) / (b.x - a.x); near(wheel.y + state.car.wheelRadius, a.y + (b.y - a.y) * u);
  }
  near(state.car.angle, Math.atan2(state.car.wheels[1].y - state.car.wheels[0].y, state.car.wheelbase));
  const bank = model.create(); bank.mode = 'testing'; ticks(bank, 1); assert.equal(bank.nodes.reduce((sum, node) => sum + node.load, 0), 0);
  const straddling = model.create(); straddling.mode = 'testing'; straddling.car.x = straddling.nodes[0].x + 10; ticks(straddling, 1);
  near(straddling.nodes.reduce((sum, node) => sum + node.load, 0), straddling.car.mass * straddling.gravity / 2, 1e-8, 'a wheel on the bank does not load the bridge');
});

test('a broken supporting panel removes wheel contact and the vehicle falls under gravity', () => {
  const state = model.create(); state.mode = 'testing'; state.car.x = (state.nodes[1].x + state.nodes[2].x) / 2;
  state.panels[1].broken = true; const originalY = state.car.y; ticks(state, 1);
  assert.equal(state.car.falling, true); assert.ok(state.car.vy > 0 && state.car.y > originalY);
  assert.ok(state.car.wheels.every(wheel => !wheel.contact && wheel.panelId === null));
  assert.equal(state.nodes.reduce((sum, node) => sum + node.load, 0), 0);
  for (let i = 0; i < 300 && state.mode === 'testing'; i += 1) ticks(state, 1);
  assert.equal(state.mode, 'test-failed'); assert.equal(state.lastFailure, 'vehicle-fall'); assert.equal(state.phase, 'playing'); assert.ok(state.car.y > 500);
});

test('normal empty-bridge and wrong-cable attempts visibly fail through the actual physics', () => {
  const empty = runTest(model.create()); assert.equal(empty.mode, 'test-failed'); assert.equal(empty.lastFailure, 'vehicle-fall');
  assert.ok(empty.panels.some(panel => panel.broken)); assert.ok(empty.car.falling); assert.equal(empty.phase, 'playing');
  const wrong = runTest(build(model.create(), ['cable-1-2']));
  assert.equal(wrong.mode, 'test-failed'); assert.equal(wrong.cables.find(cable => cable.id === 'cable-1-2').broken, true);
  assert.equal(wrong.brokenCount, 1); assert.equal(wrong.spent, 87); assert.ok(wrong.car.falling);
});

test('testing disables edits; B restores the design snapshot, clean geometry and exact budget while time continues', () => {
  const state = build(model.create(), strong), originalDesign = installed(state), paid = state.spent, selected = state.selectedId;
  press(state, { b: true }); const snapshot = clone(state._blueprint); ticks(state, 120);
  assert.ok(state.nodes.some(node => !node.fixed && node.y !== node.restY));
  press(state, { a: true }); assert.deepEqual(installed(state), originalDesign); assert.equal(state.spent, paid);
  assert.deepEqual(state._blueprint, snapshot);
  const elapsed = state.elapsed; press(state, { b: true });
  assert.equal(state.mode, 'editing'); assert.equal(state.selectedId, selected); assert.deepEqual(installed(state), originalDesign);
  assert.equal(state.spent, paid); assert.equal(state.remainingBudget, state.budget - paid); assert.ok(state.elapsed > elapsed);
  assert.ok(state.nodes.every(node => node.y === node.restY && node.vy === 0 && node.load === 0));
  assert.ok(state.panels.every(panel => !panel.broken)); assert.ok(state.cables.every(cable => !cable.broken && cable.tension === 0));
  assert.equal(state.car.x, state.nodes[0].x - 80); assert.equal(state.car.falling, false); assert.equal(state.attempts, 1);
  press(state, { b: true }); ticks(state, 30); press(state, { b: true });
  assert.equal(state.attempts, 2); assert.equal(state.spent, paid); assert.equal(state.remainingBudget, state.budget - paid);
});

test('B after a failed test restores unbroken installed cables rather than the damaged trial state', () => {
  const state = runTest(build(model.create(), ['cable-1-2'])), paid = state.spent, before = state.elapsed;
  const failedGeometry = clone({ nodes: state.nodes, cables: state.cables, panels: state.panels, car: state.car });
  ticks(state, 20); assert.deepEqual({ nodes: state.nodes, cables: state.cables, panels: state.panels, car: state.car }, failedGeometry);
  assert.ok(state.elapsed > before, 'failed trial time continues toward the overall deadline');
  press(state, { b: true }); assert.equal(state.mode, 'editing'); assert.equal(state.phase, 'playing');
  assert.deepEqual(installed(state), ['cable-1-2']); assert.equal(state.spent, paid);
  assert.ok(state.cables.every(cable => !cable.broken && cable.brokenAt === null)); assert.equal(state.brokenCount, 0);
  assert.ok(state.nodes.every(node => node.y === node.restY && node.vy === 0)); assert.ok(state.panels.every(panel => !panel.broken));
});

test('fixed-step integration is frame-rate independent and invalid time cannot process input', () => {
  const slow = build(model.create(), strong), fast = build(model.create(), strong); press(slow, { b: true }); press(fast, { b: true });
  for (let i = 0; i < 30; i += 1) model.step(slow, 0.1, {}); ticks(fast, 360);
  assert.equal(slow.tick, fast.tick); assert.equal(slow.elapsed, fast.elapsed);
  assert.deepEqual(slow.nodes, fast.nodes); assert.deepEqual(slow.cables, fast.cables); assert.deepEqual(slow.car, fast.car);
  const frozen = clone(fast); for (const invalid of [0, -1, NaN, Infinity]) model.step(fast, invalid, { aPressed: true, bPressed: true }); assert.deepEqual(fast, frozen);
  const elapsed = fast.elapsed; model.step(fast, 100, {}); assert.ok(fast.elapsed - elapsed <= 0.2500001, 'background wall time is capped');
});

test('the overall deadline includes editing and failed trials, and true terminal states freeze every field', () => {
  const state = model.create(); state.timeLimit = 3 * DT; state.remaining = state.timeLimit;
  ticks(state, 2); assert.equal(state.phase, 'playing'); ticks(state, 1); assert.equal(state.phase, 'lost'); assert.equal(state.lostReason, 'timeout');
  const terminal = clone(state); ticks(state, 50, { aPressed: true, bPressed: true, x: 1 }); assert.deepEqual(state, terminal);
  const failed = runTest(model.create()); failed.timeLimit = failed.elapsed + DT; ticks(failed, 1);
  assert.equal(failed.phase, 'lost'); assert.equal(failed.lostReason, 'timeout');
});

test('crossing the far bank is insufficient when a bridge panel has already collapsed', () => {
  function atFinish(broken) {
    // Explicit terminal-boundary fixture: the entire car is already on the bank.
    const state = model.create(); state.mode = 'testing';
    state.car.x = state.car.finishX - state.car.speed * DT / 2;
    state.panels[0].broken = broken;
    return state;
  }
  const damaged = atFinish(true); ticks(damaged, 1);
  assert.ok(damaged.car.x >= damaged.car.finishX); assert.equal(damaged.car.falling, false);
  assert.equal(damaged.phase, 'playing'); assert.equal(damaged.mode, 'test-failed');
  assert.equal(damaged.lastFailure, 'bridge-collapse'); assert.equal(damaged.car.finished, false); assert.equal(damaged.score, 0);
  const intact = atFinish(false); ticks(intact, 1); assert.equal(intact.phase, 'won'); assert.equal(intact.car.finished, true);
});

test('retry recreates independent undeformed geometry, empty budget and cleared button/snapshot state', () => {
  for (let level = 0; level < 6; level += 1) {
    const initial = model.create(7, level), changed = build(model.create(7, level), ['cable-1-2']); runTest(changed);
    const retry = model.create(7, level); assert.deepEqual(retry, initial); assert.notEqual(retry.nodes[1], initial.nodes[1]);
    assert.equal(retry._blueprint, null); assert.equal(retry.attempts, 0); assert.equal(retry.spent, 0); assert.equal(retry.remainingBudget, retry.budget);
    model.step(retry, 0.001, { a: true }); assert.equal(retry.cables[0].installed, true);
    assert.deepEqual(model.create(7, level), initial, 'failed trials cannot contaminate shared layout templates');
  }
});

test('all six bridges support actual normal-key constructions, including two different safe material plans', () => {
  for (let level = 0; level < 6; level += 1) for (const plan of [strong, economical]) {
    const state = build(model.create(1, level), plan); assert.deepEqual(installed(state), plan); assert.ok(state.spent <= state.budget);
    const started = state.elapsed; runTest(state);
    assert.equal(state.phase, 'won'); assert.equal(state.car.finished, true); assert.equal(state.car.falling, false);
    assert.ok(state.car.x >= state.car.finishX); assert.ok(state.car.wheels.every(wheel => wheel.contact && wheel.panelId === 'bank-right'));
    assert.ok(state.elapsed - started >= 30 && state.elapsed <= 90, 'the real vehicle must traverse the full bridge during a normal-length round');
    assert.equal(state.brokenCount, 0); assert.ok(state.peakTensionRatio > 0.1 && state.peakTensionRatio < 1);
    assert.ok(state.score > 1000); const won = clone(state); ticks(state, 50, { aPressed: true, bPressed: true, y: -1 }); assert.deepEqual(state, won);
  }
});

test('observational keyboard pilots win every level; recording restores a real failed trial using B', async () => {
  const pilot = await import(pathToFileURL(path.join(__dirname, 'automation.mjs')).href);
  for (const mode of ['qa', 'record']) for (let level = 0; level < 6; level += 1) {
    const state = model.create(1, level), before = { phase: 'playing', model: clone(state) }, trace = [];
    let held = new Set(), sawFailure = false, sawRestore = false;
    for (let elapsed = 0; elapsed < 90 && state.phase === 'playing'; elapsed += 0.08) {
      const snapshot = { phase: state.phase, paused: false, level, model: clone(state) }, unchanged = clone(snapshot);
      const requested = pilot.keys(snapshot, { elapsed, mode }); assert.deepEqual(snapshot, unchanged, 'the pilot may not alter the observed model');
      assert.ok(requested.every(key => ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Space', 'b'].includes(key)));
      const oldMode = state.mode, oldSpent = state.spent, oldInstalled = installed(state), down = new Set(requested);
      if (oldMode === 'test-failed') sawFailure = true;
      model.step(state, 0.08, { x: Number(down.has('ArrowRight')) - Number(down.has('ArrowLeft')), y: Number(down.has('ArrowDown')) - Number(down.has('ArrowUp')),
        a: down.has('Space'), b: down.has('b'), aPressed: down.has('Space') && !held.has('Space'), bPressed: down.has('b') && !held.has('b') });
      if (oldMode === 'test-failed' && state.mode === 'editing') {
        sawRestore = true; assert.equal(down.has('b'), true, 'only an ordinary B press restores the design');
        assert.equal(state.spent, oldSpent); assert.deepEqual(installed(state), oldInstalled);
        assert.ok(state.nodes.every(node => node.y === node.restY)); assert.ok(state.cables.every(cable => !cable.broken));
      }
      held = down; trace.push({ state: { phase: state.phase, model: clone(state) } });
    }
    const after = { phase: state.phase, model: clone(state) };
    pilot.assertProgress({ before, after, trace }, assert);
    pilot.assertRetry({ before: after, after: { phase: 'playing', model: model.create(1, level) } }, assert);
    assert.equal(state.attempts, mode === 'record' ? 2 : 1);
    assert.equal(sawFailure, mode === 'record'); assert.equal(sawRestore, mode === 'record');
    if (mode === 'record') assert.ok(state.elapsed < 60, 'a one-minute recording includes the failed experiment and complete successful crossing');
    assert.deepEqual(pilot.keys(after, { elapsed: 100, mode }), [], 'the completed result stays visible');
  }
  assert.equal(pilot.budgets.maxWebGLDrawCalls, 3);
});
