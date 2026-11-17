'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const model = require('../src/main/assets/game-model.js');
const DT = 1 / 60;
const copy = value => structuredClone(value);
const directions = [{ x: 1 }, { y: 1 }, { x: -1 }, { y: -1 }];
function ticks(state, count, input = {}) { for (let i = 0; i < count; i += 1) model.step(state, DT, input); return state; }
function press(state, input) { model.step(state, 0.01, input); model.step(state, 0.01, {}); }
function routeTo(state, selectedId) {
  const visited = new Set([state.selectedId]), queue = [{ state: copy(state), route: [] }];
  for (let head = 0; head < queue.length; head += 1) {
    const item = queue[head];
    if (item.state.selectedId === selectedId) return item.route;
    for (const input of directions) {
      const next = copy(item.state); press(next, input);
      if (!visited.has(next.selectedId)) { visited.add(next.selectedId); queue.push({ state: next, route: [...item.route, input] }); }
    }
  }
  assert.fail('Control cannot be reached with ordinary direction keys: ' + selectedId);
}
function select(state, selectedId) { for (const input of routeTo(state, selectedId)) press(state, input); }
function position(track, progress, reverse = false) {
  const points = reverse ? track.points.slice().reverse() : track.points;
  let remaining = progress;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= length || i === points.length - 1) {
      const u = Math.min(1, remaining / length);
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    remaining -= length;
  }
}
function place(state, trainId, edgeId, progress, reverse = false) {
  const train = state.trains.find(item => item.id === trainId), track = state.edges.find(item => item.id === edgeId);
  Object.assign(train, position(track, progress, reverse), { status: 'moving', edgeId, from: reverse ? track.to : track.from,
    to: reverse ? track.from : track.to, progress, routeChoices: {}, releasedAt: state.elapsed });
  state.gates.forEach(gate => { gate.queue = gate.queue.filter(id => id !== trainId); });
  return train;
}
function track(id, points, from = id + '-from', to = id + '-to') {
  return { id, from, to, points: points.map(([x, y]) => ({ x, y })), length: points.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - points[i][0], point[1] - points[i][1]), 0) };
}
function fixture(tracks, descriptions) {
  const state = model.create();
  state.gates = []; state.switches = []; state.edges = tracks; state.nodes = [];
  state.target = 99; state.delayLimit = 10000; state.timeLimit = 1000; state.remaining = 1000;
  tracks.forEach(edge => {
    state.nodes.push({ id: edge.from, type: 'platform', ...edge.points[0] }, { id: edge.to, type: 'platform', ...edge.points.at(-1) });
  });
  state.trains = descriptions.map((description, index) => {
    const edge = tracks.find(item => item.id === description.edgeId), reverse = !!description.reverse;
    const progress = description.progress || 0;
    return { id: 'test-' + index, name: 'test-' + index, color: 'red', colorBits: 1, status: 'moving',
      edgeId: edge.id, from: reverse ? edge.to : edge.from, to: reverse ? edge.from : edge.to, progress,
      ...position(edge, progress, reverse), destination: description.destination || (reverse ? edge.from : edge.to),
      speed: description.speed, length: 28, readyAt: 0, releasedAt: 0, arrivedAt: null, waitingTime: 0, routeChoices: {} };
  });
  return state;
}

test('UMD exports only the normal model API and all three schedules are independent', () => {
  const context = {}; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/main/assets/game-model.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(context.PureModel).sort(), ['TICK_HZ', 'create', 'step']);
  assert.deepEqual([0, 1, 2].map(level => model.create(1, level).target), [5, 7, 9]);
  assert.equal(context.PureModel.create(1, 2).levelName, '繁忙站场');
  const before = model.create(1, 2), played = model.create(1, 2);
  played.edges[0].points[0].x = -100; played.trains[0].speed = 999; played.gates[0].queue.shift();
  assert.deepEqual(model.create(1, 2), before);
  assert.equal(model.create().level, 1); assert.equal(model.create(1, 50).level, 3);
});

test('visible curved tracks have coherent lengths, endpoints and continuous train tangents', () => {
  const state = model.create();
  for (const edge of state.edges) {
    const from = state.nodes.find(node => node.id === edge.from), to = state.nodes.find(node => node.id === edge.to);
    assert.deepEqual(edge.points[0], { x: from.x, y: from.y });
    assert.deepEqual(edge.points.at(-1), { x: to.x, y: to.y });
    let length = 0;
    for (let i = 1; i < edge.points.length; i += 1) length += Math.hypot(edge.points[i].x - edge.points[i - 1].x, edge.points[i].y - edge.points[i - 1].y);
    assert.ok(Math.abs(edge.length - length) < 1e-8);
  }
  const train = place(state, 'train-1', 'main-color', 65); train.speed = 60;
  const angles = [];
  for (let i = 0; i < 100; i += 1) { const old = { x: train.x, y: train.y }; ticks(state, 1); assert.ok(Math.hypot(train.x - old.x, train.y - old.y) <= 1.000001); angles.push(train.angle); }
  for (let i = 1; i < angles.length; i += 1) assert.ok(Math.abs(angles[i] - angles[i - 1]) <= Math.PI / 18 + 1e-8, 'curve tangent changes by at most ten degrees');
});

test('all four controls are reachable and direction selection repeats only after a delay', () => {
  const state = model.create(); press(state, { x: 0.3, y: 0.2 }); assert.equal(state.selectedId, 'switch-main');
  for (const from of [...state.gates, ...state.switches]) {
    select(state, from.id);
    for (const to of [...state.gates, ...state.switches]) assert.ok(Array.isArray(routeTo(state, to.id)));
  }
  const held = model.create(); model.step(held, 0.01, { x: 1 }); assert.equal(held.selectedId, 'switch-color');
  model.step(held, 0.2, { x: 1 }); model.step(held, 0.2, { x: 1 }); assert.equal(held.selectedId, 'switch-color');
  model.step(held, 0.02, { x: 1 }); assert.equal(held.selectedId, 'gate-east');
});

test('A is edge-triggered, explicit fast pulses survive and selection happens before action', () => {
  const state = model.create(); model.step(state, 0.01, { a: true }); assert.equal(state.switches[0].route, 0);
  ticks(state, 20, { a: true }); assert.equal(state.switches[0].route, 0);
  model.step(state, 0.01, { a: true, aPressed: true }); assert.equal(state.switches[0].route, 1);
  model.step(state, 0.01, {}); model.step(state, 0.01, { y: -1, aPressed: true });
  assert.equal(state.selectedId, 'switch-color'); assert.equal(state.switches[1].route, 1); assert.equal(state.switches[0].route, 1);
});

test('a switch locks at the protection boundary, keeps its reserved route and unlocks after clearance', () => {
  const state = model.create(), junction = state.switches[0], train = place(state, 'train-1', 'west-main', 279);
  model.step(state, 0.001, { aPressed: true }); assert.equal(junction.route, 0, '51 pixels before the switch is outside the protection area');
  ticks(state, 1); assert.equal(junction.locked, true); assert.deepEqual(junction.lockedBy, [train.id]); assert.equal(train.routeChoices[junction.id], 0);
  model.step(state, 0.001, { aPressed: true }); assert.equal(junction.route, 0, 'occupied switch rejects a turn');
  for (let guard = 0; guard < 100 && (train.from !== junction.id || junction.locked); guard += 1) ticks(state, 1);
  assert.equal(train.edgeId, 'main-color'); assert.equal(junction.locked, false);
  model.step(state, 0.001, { aPressed: true }); assert.equal(junction.route, 1);
  assert.equal(train.routeChoices[junction.id], 0); assert.equal(train.edgeId, 'main-color', 'an already routed train never jumps to the new branch');
  const boundary = model.create(); place(boundary, 'train-1', 'west-main', 280);
  model.step(boundary, 0.001, { aPressed: true }); assert.equal(boundary.switches[0].route, 1, 'exactly fifty pixels is locked');
});

test('B blocks occupied exits, respects timetable and queue order, and requires a new press', () => {
  const state = model.create(); select(state, 'gate-west'); press(state, { b: true });
  assert.equal(state.trains[0].status, 'moving'); assert.equal(state.gates[0].blocked, true);
  press(state, { b: true }); assert.equal(state.trains[2].status, 'scheduled');
  ticks(state, 70, { b: true }); assert.equal(state.trains[2].status, 'waiting'); assert.equal(state.trains.filter(train => train.status === 'moving').length, 1);
  model.step(state, 0.001, { b: true, bPressed: true }); assert.equal(state.trains[2].status, 'moving');
  const early = model.create(); early.trains[0].readyAt = 3; early.trains[0].status = 'scheduled'; select(early, 'gate-west'); press(early, { b: true });
  assert.equal(early.trains[0].status, 'scheduled'); assert.equal(early.gates[0].queue[0], 'train-1');
  const boundary = model.create(); const leader = place(boundary, 'train-1', 'west-main', 89.99);
  boundary.trains[2].status = 'waiting'; boundary.trains[2].readyAt = 0; boundary.selectedId = 'gate-west';
  model.step(boundary, 0.001, { bPressed: true }); assert.equal(boundary.trains[2].status, 'waiting');
  leader.progress = 90; Object.assign(leader, position(boundary.edges[0], 90));
  model.step(boundary, 0.001, { bPressed: true }); assert.equal(boundary.trains[2].status, 'moving', 'ninety pixels clears the release gate');
});

test('normal input can create an actual opposing-entry collision at the junction', () => {
  const state = model.create(); press(state, { a: true }); select(state, 'gate-west'); press(state, { b: true });
  select(state, 'gate-east'); press(state, { b: true });
  ticks(state, 250);
  assert.equal(state.phase, 'lost'); assert.equal(state.lostReason, 'collision');
  assert.deepEqual(state.collision.trainIds, ['train-1', 'train-2']);
  assert.ok(state.collision.x > 390 && state.collision.x < 470); assert.equal(state.deliveries, 0);
});

test('releasing a faster queued train too soon creates a real same-route rear-end crash', () => {
  const state = model.create(); press(state, { a: true }); select(state, 'gate-west'); press(state, { b: true });
  while (state.elapsed < 1.05) ticks(state, 1);
  assert.equal(state.gates[0].blocked, false); press(state, { b: true }); ticks(state, 240);
  assert.equal(state.phase, 'lost'); assert.equal(state.lostReason, 'collision');
  assert.deepEqual(state.collision.trainIds, ['train-1', 'train-3']);
});

test('continuous collision catches high-speed rear-end and opposing trains whose endpoints do not overlap', () => {
  const line = track('line', [[0, 0], [1000, 0]]);
  const rear = fixture([line], [{ edgeId: 'line', progress: 120, speed: 6000 }, { edgeId: 'line', progress: 0, speed: 18000 }]);
  ticks(rear, 1); assert.equal(rear.lostReason, 'collision'); assert.ok(rear.collision.at > 0 && rear.collision.at < DT);
  assert.ok(Math.abs(Math.hypot(rear.trains[0].x - rear.trains[1].x, rear.trains[0].y - rear.trains[1].y) - 28) < 1e-6, 'positions stop at first body contact');
  const opposing = fixture([line], [{ edgeId: 'line', progress: 200, speed: 24000 }, { edgeId: 'line', progress: 200, speed: 24000, reverse: true }]);
  ticks(opposing, 1); assert.equal(opposing.lostReason, 'collision');
});

test('swept crossing collisions are detected before arrivals commit, including the last required train', () => {
  const state = fixture([track('east', [[0, 100], [200, 100]]), track('south', [[100, 0], [100, 200]])],
    [{ edgeId: 'east', speed: 12000 }, { edgeId: 'south', speed: 12000 }]);
  state.target = 1; ticks(state, 1);
  assert.equal(state.lostReason, 'collision'); assert.equal(state.deliveries, 0); assert.ok(state.trains.every(train => train.arrivedAt === null));
});

test('piecewise sweeps follow curves rather than shortcut chords or untimed intersections', () => {
  const curved = track('curve', [[0, 0], [100, 0], [100, 100]]), cross = track('cross', [[20, 80], [200, 80]]);
  const hit = fixture([curved, cross], [{ edgeId: 'curve', speed: 12000 }, { edgeId: 'cross', speed: 6000 }]);
  ticks(hit, 1); assert.equal(hit.lostReason, 'collision', 'a turn during the step still participates in collision detection');
  const parked = track('parked', [[50, 50], [200, 50]]);
  const clear = fixture([curved, parked], [{ edgeId: 'curve', speed: 12000 }, { edgeId: 'parked', speed: 0 }]);
  ticks(clear, 1); assert.equal(clear.phase, 'playing'); assert.equal(clear.deliveries, 1, 'the diagonal chord is not a track');
  const crossing = fixture([track('x', [[0, 100], [200, 100]]), track('y', [[100, 0], [100, 200]])],
    [{ edgeId: 'x', speed: 24000 }, { edgeId: 'y', speed: 6000 }]);
  ticks(crossing, 1); assert.equal(crossing.phase, 'playing', 'the same location reached at different times is safe');
});

test('one high-speed step can traverse several edges and every sampled curve segment without skipping a destination', () => {
  const state = model.create(); state.switches[0].route = 0; const train = place(state, 'train-1', 'west-main', 0); train.speed = 100000;
  ticks(state, 1); assert.equal(train.status, 'arrived'); assert.equal(train.to, 'platform-red'); assert.equal(train.x, 820); assert.equal(train.y, 80); assert.equal(state.deliveries, 1);
  ticks(state, 40); assert.equal(state.deliveries, 1, 'arrival is counted exactly once');
});

test('ordinary release with an incorrect switch route loses at the wrong colored platform', () => {
  const state = model.create(); select(state, 'gate-west'); press(state, { b: true });
  ticks(state, 500); assert.equal(state.phase, 'lost'); assert.equal(state.lostReason, 'wrong-platform');
  assert.equal(state.trains[0].to, 'platform-blue'); assert.equal(state.trains[0].destination, 'platform-red'); assert.equal(state.deliveries, 0);
});

test('waiting time integrates each ready train exactly, including a mid-tick timetable arrival', () => {
  const state = model.create(); state.trains.forEach(train => { train.status = 'scheduled'; train.readyAt = 100; });
  const first = state.trains[0]; first.readyAt = DT / 2;
  ticks(state, 1); assert.equal(first.status, 'waiting'); assert.ok(Math.abs(state.delay - DT / 2) < 1e-10);
  ticks(state, 1); assert.ok(Math.abs(state.delay - 1.5 * DT) < 1e-10); assert.equal(state.delay, first.waitingTime);
  state.selectedId = 'gate-west'; model.step(state, 0.001, { bPressed: true }); const delay = state.delay;
  ticks(state, 20); assert.equal(state.delay, delay, 'moving trains no longer accrue waiting delay');
});

test('cumulative delay and clock limits have deterministic boundaries', () => {
  const state = model.create(); state.trains.slice(1).forEach(train => { train.status = 'scheduled'; train.readyAt = 100; }); state.delayLimit = 0.1;
  ticks(state, 5); assert.equal(state.phase, 'playing'); ticks(state, 1); assert.equal(state.lostReason, 'delay');
  const clock = model.create(); clock.delayLimit = 10000; clock.timeLimit = DT * 3; clock.remaining = clock.timeLimit;
  ticks(clock, 2); assert.equal(clock.phase, 'playing'); ticks(clock, 1); assert.equal(clock.lostReason, 'timeout'); assert.equal(clock.remaining, 0);
  const final = fixture([track('last', [[0, 0], [100, 0]])], [{ edgeId: 'last', speed: 6000 }]);
  final.target = 1; final.timeLimit = DT; final.remaining = DT; ticks(final, 1); assert.equal(final.phase, 'won', 'a final arrival on the last usable tick counts');
});

test('fixed-step results do not depend on rendering frequency and invalid time does not process input', () => {
  const a = model.create(), b = model.create();
  press(a, { a: true }); press(b, { a: true }); select(a, 'gate-west'); select(b, 'gate-west'); press(a, { b: true }); press(b, { b: true });
  for (let i = 0; i < 30; i += 1) model.step(a, 0.1, {});
  ticks(b, 180);
  assert.equal(a.tick, b.tick); assert.equal(a.elapsed, b.elapsed); assert.ok(Math.abs(a.delay - b.delay) < 1e-8);
  assert.deepEqual(a.trains, b.trains); assert.deepEqual(a.switches, b.switches);
  const before = copy(a); for (const dt of [0, -1, NaN, Infinity]) model.step(a, dt, { aPressed: true, bPressed: true }); assert.deepEqual(a, before);
  const elapsed = a.elapsed; model.step(a, 10, {}); assert.ok(a.elapsed - elapsed <= 0.2500001, 'background wall time is not replayed');
});

test('all terminal outcomes freeze state, and retries clear locks, queues, reservations and held inputs', () => {
  const lost = model.create(); lost.delayLimit = 0.01; ticks(lost, 1); const stopped = copy(lost);
  ticks(lost, 100, { aPressed: true, bPressed: true, x: 1 }); assert.deepEqual(lost, stopped);
  const won = fixture([track('done', [[0, 0], [100, 0]])], [{ edgeId: 'done', speed: 6000 }]); won.target = 1; ticks(won, 1);
  const finished = copy(won); ticks(won, 50, { a: true, b: true, y: -1 }); assert.deepEqual(won, finished);
  for (let level = 0; level < 3; level += 1) {
    const original = model.create(17, level), played = model.create(17, level);
    place(played, 'train-1', 'west-main', 300); model.step(played, 0.01, { a: true, b: true });
    assert.equal(played.switches[0].locked, true);
    const retry = model.create(17, level); assert.deepEqual(retry, original); assert.notEqual(retry.trains[0], original.trains[0]);
    model.step(retry, 0.001, { a: true }); assert.equal(retry.switches[0].route, 0, 'the retry cannot inherit an old held edge');
  }
});

test('observational keyboard pilot wins all three levels and a full 45-second showcase without writes', async () => {
  const pilot = await import(pathToFileURL(path.join(__dirname, 'automation.mjs')).href);
  const outcomes = [];
  for (const mode of ['qa', 'record']) for (let level = 0; level < 3; level += 1) {
    const state = model.create(1, level), before = { phase: 'playing', model: copy(state) }, trace = [];
    let held = new Set();
    for (let elapsed = 0; elapsed < 90 && state.phase === 'playing'; elapsed += 0.08) {
      const snapshot = { phase: state.phase, paused: false, level, model: copy(state) }, original = copy(snapshot);
      const keys = pilot.keys(snapshot, { elapsed, mode }); assert.deepEqual(snapshot, original, 'automation cannot change a model snapshot');
      assert.ok(keys.every(key => ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Space', 'b'].includes(key)));
      const down = new Set(keys);
      model.step(state, 0.08, { x: Number(down.has('ArrowRight')) - Number(down.has('ArrowLeft')), y: Number(down.has('ArrowDown')) - Number(down.has('ArrowUp')),
        a: down.has('Space'), b: down.has('b'), aPressed: down.has('Space') && !held.has('Space'), bPressed: down.has('b') && !held.has('b') });
      held = down; trace.push({ state: { phase: state.phase, model: copy(state) } });
    }
    const after = { phase: state.phase, model: copy(state) };
    pilot.assertProgress({ before, after, trace }, assert);
    pilot.assertRetry({ before: after, after: { phase: 'playing', model: model.create(1, level) } }, assert);
    assert.deepEqual(pilot.keys(after, { elapsed: 90, mode }), [], 'the result screen remains visible');
    if (mode === 'record' && level === 0) assert.ok(state.elapsed < 45, 'a 55-second real recording has time for the complete round and settlement');
    outcomes.push({ mode, level: state.level, elapsed: state.elapsed, delay: state.delay });
  }
  assert.equal(outcomes.length, 6); assert.equal(pilot.budgets.maxWebGLDrawCalls, 3);
});
