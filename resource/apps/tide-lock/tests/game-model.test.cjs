'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const model = require('../src/main/assets/game-model.js');
const DT = 1 / 60, copy = state => structuredClone(state);
const directions = [{ x: 1 }, { y: 1 }, { x: -1 }, { y: -1 }];
function ticks(state, count, input = {}) { for (let i = 0; i < count; i += 1) model.step(state, DT, input); return state; }
function press(state, input) { model.step(state, 0.01, input); model.step(state, 0.01, {}); }
function route(state, target) {
  const queue = [{ state: copy(state), path: [] }], visited = new Set([state.selectedId]);
  for (let head = 0; head < queue.length; head += 1) {
    const item = queue[head]; if (item.state.selectedId === target) return item.path;
    for (const input of directions) {
      const next = copy(item.state); press(next, input);
      if (!visited.has(next.selectedId)) { visited.add(next.selectedId); queue.push({ state: next, path: [...item.path, input] }); }
    }
  }
  assert.fail('unreachable control ' + target);
}
function select(state, id) { for (const input of route(state, id)) press(state, input); }
function levels(state, h1, h2) {
  state.zones[1].volume = state.zones[1].area * h1; state.zones[2].volume = state.zones[2].area * h2;
  state.initialVolume = state.zones[1].volume + state.zones[2].volume;
  state.sourceVolume = state.sinkVolume = state.overflowVolume = 0;
  model.step(state, 0.001, {}); state._remainder = 0;
}
function accounted(state, tolerance = 1e-8) {
  assert.ok(Math.abs(state.totalVolume - state.initialVolume - state.sourceVolume + state.sinkVolume + state.overflowVolume) < tolerance,
    'finite water inventory equals initial inventory plus every external exchange');
}
function enterFirst(state = model.create()) {
  press(state, { a: true }); press(state, { b: true });
  for (let i = 0; i < 600 && state.boats[0].status === 'moving'; i += 1) ticks(state, 1);
  assert.equal(state.boats[0].zoneId, 'lock-1'); press(state, { a: true }); assert.equal(state.gates[0].open, false);
  return state;
}

test('browser and CommonJS APIs contain only create/step and three independent voyages', () => {
  const context = {}; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/main/assets/game-model.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(context.PureModel).sort(), ['TICK_HZ', 'create', 'step']);
  assert.deepEqual([0, 1, 2].map(level => model.create(1, level).target), [1, 2, 3]);
  assert.deepEqual([0, 1, 2].map(level => model.create(1, level).zones[3].level), [6, 6.5, 7]);
  assert.equal(context.PureModel.create().floorY, 460);
  const original = model.create(1, 2), edited = model.create(1, 2); edited.zones[1].volume = 0; edited.valves[0].open = true;
  assert.deepEqual(model.create(1, 2), original); assert.equal(model.create(1, -1).level, 1); assert.equal(model.create(1, 99).level, 3);
});

test('all seven controls are reachable, selection has a dead zone and delayed repeat', () => {
  for (let level = 0; level < 3; level += 1) {
    const state = model.create(1, level); press(state, { x: 0.3, y: 0.2 }); assert.equal(state.selectedId, 'gate-1');
    for (const from of state.controls) {
      select(state, from.id);
      for (const to of state.controls) assert.ok(Array.isArray(route(state, to.id)));
    }
  }
  const held = model.create(); model.step(held, 0.01, { x: 1 }); assert.equal(held.selectedId, 'gate-2');
  model.step(held, 0.2, { x: 1 }); model.step(held, 0.2, { x: 1 }); assert.equal(held.selectedId, 'gate-2');
  model.step(held, 0.02, { x: 1 }); assert.equal(held.selectedId, 'gate-3');
});

test('gate opening accepts the exact tolerance and rejects larger differences or open valves', () => {
  const allowed = model.create(); levels(allowed, 2.15, 4); model.step(allowed, 0.001, { aPressed: true }); assert.equal(allowed.gates[0].open, true);
  const denied = model.create(); levels(denied, 2.15001, 4); model.step(denied, 0.001, { aPressed: true });
  assert.equal(denied.gates[0].open, false); assert.equal(denied.events.at(-1).reason, 'water-difference');
  const flowing = model.create(); flowing.selectedId = 'fill-1'; model.step(flowing, 0.001, { aPressed: true });
  flowing.selectedId = 'gate-1'; model.step(flowing, 0.001, { aPressed: true }); assert.equal(flowing.gates[0].open, false); assert.equal(flowing.events.at(-1).reason, 'valve-open');
});

test('open gates block adjacent valves, crossing boats prevent closure, and arrival releases the lock', () => {
  const state = model.create(); press(state, { a: true }); select(state, 'fill-1'); press(state, { a: true }); assert.equal(state.valves[0].open, false);
  select(state, 'gate-1'); press(state, { b: true }); assert.equal(state.gates[0].locked, true);
  press(state, { a: true }); assert.equal(state.gates[0].open, true); assert.equal(state.gates[0].locked, true);
  select(state, 'drain-1'); press(state, { a: true }); assert.equal(state.valves[1].open, false);
  while (state.boats[0].status === 'moving') ticks(state, 1);
  assert.equal(state.gates[0].locked, false); select(state, 'gate-1'); press(state, { a: true }); assert.equal(state.gates[0].open, false);
});

test('A/B use held edges and explicit runtime pulses without losing quick re-presses', () => {
  const state = model.create(); model.step(state, 0.001, { a: true }); assert.equal(state.gates[0].open, true);
  ticks(state, 20, { a: true }); assert.equal(state.gates[0].open, true);
  model.step(state, 0.001, { a: true, aPressed: true }); assert.equal(state.gates[0].open, false);
  model.step(state, 0.001, { a: true, aPressed: true, bPressed: true }); assert.equal(state.gates[0].open, true); assert.equal(state.boats[0].status, 'moving', 'A occurs before B');
  ticks(state, 500, { b: true }); assert.equal(state.boats[0].zoneId, 'lock-1'); assert.equal(state.boats[0].status, 'waiting');
  const selectFirst = model.create(); model.step(selectFirst, 0.001, { y: -1, aPressed: true }); assert.equal(selectFirst.selectedId, 'fill-1'); assert.equal(selectFirst.valves[0].open, true);
});

test('sealed chambers preserve inventory exactly; closing valves freezes water despite rendering ticks', () => {
  const state = model.create(), original = state.zones.map(item => item.volume); ticks(state, 600);
  assert.deepEqual(state.zones.map(item => item.volume), original); assert.equal(state.sourceVolume, 0); assert.equal(state.sinkVolume, 0);
  select(state, 'fill-1'); press(state, { a: true }); ticks(state, 90); press(state, { a: true });
  const stopped = state.zones[1].volume, source = state.sourceVolume; ticks(state, 120);
  assert.equal(state.zones[1].volume, stopped); assert.equal(state.sourceVolume, source); accounted(state);
});

test('middle-gate exchange conserves volume and converges to the area-weighted level without overshoot', () => {
  const state = model.create(1, 2); levels(state, 2, 6); state.gates[1].open = true;
  const volume = state.totalVolume, target = volume / (state.zones[1].area + state.zones[2].area);
  let lastLow = 2, lastHigh = 6;
  for (let i = 0; i < 600; i += 1) {
    ticks(state, 1); const low = state.zones[1].level, high = state.zones[2].level;
    assert.ok(low >= lastLow - 1e-10 && high <= lastHigh + 1e-10 && low <= target + 1e-10 && high >= target - 1e-10);
    assert.ok(Math.abs(state.totalVolume - volume) < 1e-10); lastLow = low; lastHigh = high;
  }
  assert.ok(Math.abs(lastLow - target) < 1e-8); assert.equal(state.sourceVolume, 0); assert.equal(state.sinkVolume, 0);
});

test('simultaneous gate exchange uses old levels, respects network bounds and accounts for outer pools', () => {
  const state = model.create(); levels(state, 5.8, 2.2); state.gates.forEach(gate => { gate.open = true; });
  const old = state.zones.map(item => item.level), before = state.zones.map(item => item.volume);
  const q = [0, 1, 2].map(i => Math.max(-2.5, Math.min(2.5, (old[i] - old[i + 1]) * 4)) * DT);
  ticks(state, 1);
  assert.ok(Math.abs(state.zones[1].volume - (before[1] + q[0] - q[1])) < 1e-10);
  assert.ok(Math.abs(state.zones[2].volume - (before[2] + q[1] - q[2])) < 1e-10);
  for (let i = 0; i < 600; i += 1) { ticks(state, 1); assert.ok(state.zones.every(item => item.level >= 2 - 1e-10 && item.level <= 6 + 1e-10)); accounted(state); }
  assert.ok(state.sourceVolume > 0 && state.sinkVolume > 0);
});

test('simultaneous fill and drain retain independent source/sink ledgers and net inventory', () => {
  const state = model.create(), original = state.zones[1].volume;
  state.valves[0].open = true; state.valves[1].open = true;
  ticks(state, 120); assert.ok(Math.abs(state.sourceVolume - 1) < 1e-10); assert.ok(Math.abs(state.sinkVolume - 1) < 1e-10);
  assert.equal(state.zones[1].volume, original); assert.equal(state.valves[0].flow, 0.5); assert.equal(state.valves[1].flow, 0.5); accounted(state);
});

test('draining cannot remove negative inventory, and source-head fills cannot overshoot their reservoir', () => {
  const state = model.create(); levels(state, 0.0001, 4); state.valves[1].open = true;
  ticks(state, 1); assert.equal(state.zones[1].volume, 0); assert.ok(Math.abs(state.sinkVolume - 0.0001) < 1e-12);
  ticks(state, 30); assert.equal(state.zones[1].volume, 0); assert.equal(state.valves[1].flow, 0); accounted(state);
  const head = model.create(); head.zones[1].capacity = 12; levels(head, 9.999, 4); head.valves[0].open = true;
  ticks(head, 1); assert.equal(head.zones[1].level, 10); ticks(head, 20); assert.equal(head.zones[1].level, 10); assert.equal(head.valves[0].flow, 0); accounted(head);
});

test('ordinary unclosed fill valve reaches a real overflow failure and accounts for spilled water', () => {
  const state = model.create(); select(state, 'fill-2'); press(state, { a: true });
  while (state.phase === 'playing' && state.elapsed < 12) ticks(state, 1);
  assert.equal(state.lostReason, 'overflow'); assert.ok(state.elapsed > 8 && state.elapsed < 9);
  assert.equal(state.zones[2].level, 8); assert.ok(state.overflowVolume > 0); accounted(state);
});

test('closed gates and insufficient draft block B, while a valid crossing advances only one chamber', () => {
  const state = model.create(), x = state.boats[0].x; press(state, { b: true }); ticks(state, 120);
  assert.equal(state.boats[0].x, x); assert.equal(state.boats[0].zoneId, 'entry');
  const shallow = model.create(); shallow.zones[0].level = 0.5; levels(shallow, 0.5, 4);
  model.step(shallow, 0.001, { aPressed: true, bPressed: true }); assert.equal(shallow.gates[0].open, true); assert.equal(shallow.boats[0].status, 'waiting');
  const entered = enterFirst(); assert.equal(entered.boats[0].zoneId, 'lock-1'); assert.equal(entered.deliveries, 0); assert.equal(entered.boats[0].dry, true);
  const stopped = entered.boats[0].x; press(entered, { b: true }); ticks(entered, 60); assert.equal(entered.boats[0].x, stopped);
});

test('boat waterline follows finite water level and keel never penetrates the floor', () => {
  const state = enterFirst(); select(state, 'drain-1'); press(state, { a: true });
  let sawGrounded = false;
  while (state.phase === 'playing') {
    ticks(state, 1); const boat = state.boats[0];
    assert.ok(boat.y + boat.draft * state.levelScale <= state.floorY + 1e-8);
    if (!boat.grounded) assert.ok(Math.abs(boat.y - state.zones[1].waterY) < 1e-8);
    else { sawGrounded = true; assert.ok(Math.abs(boat.y + boat.draft * state.levelScale - state.floorY) < 1e-8); }
  }
  assert.equal(sawGrounded, true); assert.equal(state.lostReason, 'grounding'); assert.ok(Math.abs(state.boats[0].groundedTime - 3) < 1e-8);
});

test('grounding must be continuous; restoring buoyancy clears the grounding clock', () => {
  const state = enterFirst(); levels(state, 0.4, 4); ticks(state, 120); assert.equal(state.phase, 'playing'); assert.ok(state.boats[0].groundedTime > 1.9);
  state.selectedId = 'fill-1'; model.step(state, 0.001, { aPressed: true }); ticks(state, 24);
  assert.equal(state.boats[0].grounded, false); assert.equal(state.boats[0].groundedTime, 0); assert.equal(state.phase, 'playing');
});

test('final delivery counts only after the whole hull is beyond the final gate and exactly once', () => {
  const state = model.create(1, 1), boat = state.boats[0]; levels(state, 4, 6.5);
  boat.zoneId = 'lock-2'; state.selectedId = 'gate-3'; model.step(state, 0.001, { aPressed: true, bPressed: true });
  while (boat.x - boat.length / 2 <= state.gates[2].x) { ticks(state, 1); assert.equal(state.deliveries, 0); }
  while (boat.status === 'moving') ticks(state, 1);
  assert.equal(boat.status, 'exited'); assert.equal(state.deliveries, 1); assert.equal(boat.zoneId, 'exit'); assert.ok(boat.exitedAt > 0);
  ticks(state, 120); assert.equal(state.deliveries, 1);
});

test('activating the next queued boat preserves every water quantity, gate and valve state', () => {
  const state = model.create(1, 1), boat = state.boats[0]; levels(state, 3.7, 6.5);
  boat.zoneId = 'lock-2'; boat.status = 'moving'; boat.fromZoneId = 'lock-2'; boat.toZoneId = 'exit'; boat.gateId = 'gate-3'; boat.progress = 0.99999;
  state.gates[2].open = true;
  const volume = state.zones.map(item => item.volume), ledger = [state.sourceVolume, state.sinkVolume, state.overflowVolume]; ticks(state, 1);
  assert.equal(state.activeBoatId, 'boat-2'); assert.equal(state.boats[1].status, 'waiting');
  assert.deepEqual(state.zones.map(item => item.volume), volume); assert.deepEqual([state.sourceVolume, state.sinkVolume, state.overflowVolume], ledger);
  assert.equal(state.gates[2].open, true); assert.ok(state.valves.every(valve => !valve.open));
});

test('overflow precedes same-tick final arrival, while a safe arrival on the final tick wins', () => {
  function lastTick() {
    const state = model.create(), boat = state.boats[0]; levels(state, 4, 6);
    boat.zoneId = 'lock-2'; boat.status = 'moving'; boat.fromZoneId = 'lock-2'; boat.toZoneId = 'exit'; boat.gateId = 'gate-3'; boat.progress = 0.99999;
    state.gates[2].open = true; state.timeLimit = DT; state.remaining = DT; return state;
  }
  const safe = lastTick(); ticks(safe, 1); assert.equal(safe.phase, 'won'); assert.equal(safe.remaining, 0);
  const spill = lastTick(); spill.zones[1].volume = spill.zones[1].area * 8; spill.valves[0].open = true;
  ticks(spill, 1); assert.equal(spill.lostReason, 'overflow'); assert.equal(spill.deliveries, 0);
  const timeout = model.create(); timeout.timeLimit = DT * 3; ticks(timeout, 2); assert.equal(timeout.phase, 'playing'); ticks(timeout, 1); assert.equal(timeout.lostReason, 'timeout');
});

test('fixed rule ticks are independent of frame subdivision and invalid time cannot trigger inputs', () => {
  const slow = model.create(), fast = model.create(); slow.selectedId = fast.selectedId = 'fill-1';
  model.step(slow, 0.1, { aPressed: true }); model.step(fast, DT, { aPressed: true }); ticks(fast, 5);
  for (let i = 0; i < 20; i += 1) model.step(slow, 0.1, {}); ticks(fast, 120);
  assert.equal(slow.tick, fast.tick); assert.deepEqual(slow.zones, fast.zones); assert.equal(slow.sourceVolume, fast.sourceVolume);
  const before = copy(fast); for (const invalid of [0, -1, NaN, Infinity]) model.step(fast, invalid, { aPressed: true, bPressed: true }); assert.deepEqual(fast, before);
  const elapsed = fast.elapsed; model.step(fast, 100, {}); assert.ok(fast.elapsed - elapsed <= 0.2500001);
});

test('terminal states freeze completely, and retries restore water, locks, vessels, ledgers and edges', () => {
  const failed = model.create(); failed.timeLimit = DT; ticks(failed, 1); const frozen = copy(failed);
  ticks(failed, 100, { aPressed: true, bPressed: true, x: 1 }); assert.deepEqual(failed, frozen);
  for (let level = 0; level < 3; level += 1) {
    const original = model.create(61, level), changed = model.create(61, level);
    press(changed, { a: true }); press(changed, { b: true }); assert.equal(changed.gates[0].locked, true);
    const retry = model.create(61, level); assert.deepEqual(retry, original); assert.notEqual(retry.boats[0], original.boats[0]);
    model.step(retry, 0.001, { a: true }); assert.equal(retry.gates[0].open, true, 'new voyages cannot inherit held input');
  }
});

test('read-only normal-key operators finish all three voyages and leave a visible result screen', async () => {
  const pilot = await import(pathToFileURL(path.join(__dirname, 'automation.mjs')).href);
  for (const mode of ['qa', 'record']) for (let level = 0; level < 3; level += 1) {
    const state = model.create(61, level), before = { phase: 'playing', model: copy(state) }, trace = [];
    let held = new Set();
    for (let elapsed = 0; elapsed < 91 && state.phase === 'playing'; elapsed += 0.08) {
      const snapshot = { phase: state.phase, paused: false, level, model: copy(state) }, unchanged = copy(snapshot);
      const requested = pilot.keys(snapshot, { elapsed, mode }); assert.deepEqual(snapshot, unchanged, 'operator cannot write water levels or boat state');
      assert.ok(requested.every(key => ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Space', 'b'].includes(key)));
      const down = new Set(requested);
      model.step(state, 0.08, { x: Number(down.has('ArrowRight')) - Number(down.has('ArrowLeft')), y: Number(down.has('ArrowDown')) - Number(down.has('ArrowUp')),
        a: down.has('Space'), b: down.has('b'), aPressed: down.has('Space') && !held.has('Space'), bPressed: down.has('b') && !held.has('b') });
      held = down; trace.push({ state: { phase: state.phase, model: copy(state) } });
    }
    const after = { phase: state.phase, model: copy(state) }; pilot.assertProgress({ before, after, trace }, assert);
    pilot.assertRetry({ before: after, after: { phase: 'playing', model: model.create(61, level) } }, assert);
    assert.deepEqual(pilot.keys(after, { elapsed: 100, mode }), []);
    const terminal = copy(state); ticks(state, 30, { a: true, b: true }); assert.deepEqual(state, terminal);
    if (mode === 'record' && level === 0) assert.ok(state.elapsed < 45, 'a 45-second recording can include a full voyage and its settlement');
  }
  assert.equal(pilot.budgets.maxWebGLDrawCalls, 3);
});
