'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const model = require('../src/main/assets/game-model.js');
const vectors = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const inputs = [{ x: 1 }, { y: 1 }, { x: -1 }, { y: -1 }];
const answers = [[0], [0, 1, 1], [0, 0, 1, 1, 0, 0]];
const clone = value => structuredClone(value);
function ticks(state, n) { for (let i = 0; i < n; i += 1) model.step(state, 0.1, {}); return state; }
function press(state, input) { model.step(state, 0.01, input); model.step(state, 0.01, {}); }
function nextRoute(state, id) {
  const queue = [{ state: clone(state), route: [] }], visited = new Set([state.selectedId]);
  for (let head = 0; head < queue.length; head += 1) {
    const item = queue[head];
    if (item.state.selectedId === id) return item.route;
    for (const input of inputs) {
      const next = clone(item.state); press(next, input);
      if (!visited.has(next.selectedId)) {
        visited.add(next.selectedId); queue.push({ state: next, route: [...item.route, input] });
      }
    }
  }
  assert.fail('A device cannot be reached through ordinary directional input');
}
function solveByInput(level) {
  const state = model.create(1, level);
  state.devices.forEach((device, index) => {
    for (const input of nextRoute(state, device.id)) press(state, input);
    while (device.orientation !== answers[level][index]) press(state, { a: true });
  });
  return state;
}
function radial(type, orientation, incoming, color = 7) {
  const [dx, dy] = vectors[incoming];
  const cells = [{ type: 'source', x: 3 - dx * 2, y: 3 - dy * 2, direction: incoming, color },
    { type, x: 3, y: 3, orientation }];
  vectors.forEach(([vx, vy], direction) => {
    if (direction !== (incoming + 2) % 4) cells.push({ type: 'receiver', id: 'r' + direction, x: 3 + vx * 2, y: 3 + vy * 2, required: 7 });
  });
  return { width: 7, height: 7, cells };
}

test('CommonJS and browser UMD expose the same small, answer-free API', () => {
  const context = {}; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/main/assets/game-model.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(context.PureModel).sort(), Object.keys(model).sort());
  assert.equal(context.PureModel.create(1, 2).level, 3);
  assert.deepEqual(Object.keys(model).sort(), ['CHARGE_TICKS', 'TICK_HZ', 'create', 'step', 'traceBeams'].sort());
  assert.equal(JSON.stringify(model.create()).includes('solution'), false);
});

test('mirrors reflect all four incoming directions in both orientations', () => {
  const expected = [[3, 2, 1, 0], [1, 0, 3, 2]];
  for (let orientation = 0; orientation < 2; orientation += 1) {
    for (let incoming = 0; incoming < 4; incoming += 1) {
      const result = model.traceBeams(radial('mirror', orientation, incoming, 5));
      for (const [id, mask] of Object.entries(result.receiverIncident)) assert.equal(mask, id === 'r' + expected[orientation][incoming] ? 5 : 0);
    }
  }
});

test('prisms accept one entry direction and separate every RGB subset in all orientations', () => {
  for (let orientation = 0; orientation < 4; orientation += 1) {
    for (let incoming = 0; incoming < 4; incoming += 1) {
      for (let mask = 1; mask < 8; mask += 1) {
        const result = model.traceBeams(radial('prism', orientation, incoming, mask));
        const expected = {};
        if (incoming === orientation) [1, 2, 4].forEach((bit, index) => { if (mask & bit) expected['r' + (incoming + index + 3) % 4] = bit; });
        for (const [id, incident] of Object.entries(result.receiverIncident)) assert.equal(incident, expected[id] || 0, `orientation=${orientation}, incoming=${incoming}, color=${mask}, ${id}`);
      }
    }
  }
  assert.deepEqual(model.traceBeams(radial('prism', -1, 3)).receiverIncident, model.traceBeams(radial('prism', 3, 3)).receiverIncident);
});

test('crossing rays stay separate, while receivers combine rays from different sides', () => {
  const cross = { width: 5, height: 5, cells: [
    { type: 'source', x: 0, y: 2, direction: 0, color: 1 }, { type: 'source', x: 2, y: 0, direction: 1, color: 2 },
    { type: 'receiver', id: 'red', x: 4, y: 2 }, { type: 'receiver', id: 'green', x: 2, y: 4 }
  ] };
  const crossed = model.traceBeams(cross);
  assert.equal(crossed.receiverIncident.red, 1); assert.equal(crossed.receiverIncident.green, 2);
  assert.deepEqual(crossed.beams.map(beam => beam.colorBits).sort(), [1, 2]);
  const combined = model.traceBeams({ width: 5, height: 5, cells: [
    { type: 'source', x: 0, y: 2, direction: 0, color: 1 }, { type: 'source', x: 2, y: 4, direction: 3, color: 4 },
    { type: 'receiver', id: 'purple', x: 2, y: 2 }
  ] });
  assert.equal(combined.receiverIncident.purple, 5);
});

test('walls, receivers, hazards and returning beams at a source absorb light', () => {
  for (const type of ['wall', 'receiver', 'hazard', 'source']) {
    const board = { width: 6, height: 3, cells: [
      { type: 'source', x: 0, y: 1, direction: 0, color: 1 },
      { type, id: 'stop', x: 2, y: 1, direction: 3, color: 0 }, { type: 'receiver', id: 'behind', x: 5, y: 1 }
    ] };
    assert.equal(model.traceBeams(board).receiverIncident.behind, 0, type);
  }
  const board = { width: 6, height: 6, cells: [
    { type: 'source', x: 2, y: 2, direction: 0, color: 1 }, { type: 'mirror', x: 4, y: 2, orientation: 1 },
    { type: 'mirror', x: 4, y: 4, orientation: 0 }, { type: 'mirror', x: 2, y: 4, orientation: 1 }
  ] };
  const result = model.traceBeams(board);
  assert.equal(result.beams.length, 4);
  assert.deepEqual(result.beams.at(-1), { x1: 2, y1: 4, x2: 2, y2: 2, colorBits: 1 });
});

test('the visited ray-state bound terminates a closed optical cycle', () => {
  // The fixture injects a ray at a mirror; ordinary level sources cannot do this.
  const board = { width: 5, height: 5, cells: [
    { type: 'source', x: 1, y: 1, direction: 0, color: 7 },
    { type: 'mirror', x: 3, y: 1, orientation: 1 }, { type: 'mirror', x: 3, y: 3, orientation: 0 },
    { type: 'mirror', x: 1, y: 3, orientation: 1 }
  ], devices: [{ type: 'mirror', x: 1, y: 1, orientation: 0 }] };
  const original = clone(board), result = model.traceBeams(board);
  assert.equal(result.visitedStates, 8);
  assert.ok(result.beams.length <= 5);
  assert.ok(result.visitedStates <= board.width * board.height * 4 * 7);
  assert.deepEqual(board, original, 'tracing is pure');
});

test('outgoing beams end at the boundary, and cached paths survive selection and time', () => {
  const state = model.create(1, 1), beams = state.beams, revision = state.traceVersion;
  press(state, { x: 1 }); ticks(state, 3);
  assert.equal(state.beams, beams); assert.equal(state.traceVersion, revision);
  press(state, { a: true }); assert.notEqual(state.beams, beams); assert.equal(state.traceVersion, revision + 1);
  const next = state.beams;
  press(state, { a: true, b: true }); assert.equal(state.beams, next, 'opposite simultaneous turns leave the cached light path intact');
  for (let level = 0; level < 3; level += 1) {
    const board = solveByInput(level);
    for (const beam of board.beams) for (const [key, limit] of [['x1', board.width], ['x2', board.width], ['y1', board.height], ['y2', board.height]]) {
      assert.ok(Number.isFinite(beam[key]) && beam[key] >= -0.5 && beam[key] <= limit - 0.5);
    }
  }
});

test('nineteen correct ticks are insufficient; the twentieth wins and freezes every field', () => {
  const state = model.create(); model.step(state, 0.1, { aPressed: true }); ticks(state, 18);
  assert.equal(state.tick, 19); assert.equal(state.receivers[0].charge, 19); assert.equal(state.phase, 'playing');
  ticks(state, 1); assert.equal(state.tick, 20); assert.equal(state.phase, 'won'); assert.equal(state.elapsed, 2);
  const terminal = clone(state); model.step(state, 0.25, { aPressed: true, bPressed: true, x: 1 });
  assert.deepEqual(state, terminal);
});

test('an interrupted or wrong-colored receiver loses all charge at the next rule tick', () => {
  const state = model.create(); model.step(state, 0.1, { aPressed: true }); ticks(state, 4);
  model.step(state, 0.01, { bPressed: true });
  assert.equal(state.receivers[0].incident, 0); assert.equal(state.receivers[0].charge, 5, 'rotation does not run a rule tick');
  model.step(state, 0.09, {}); assert.equal(state.receivers[0].charge, 0);
  const receiver = state.receivers[0]; receiver.required = 5;
  for (const wrong of [0, 1, 4, 7]) { receiver.incident = wrong; receiver.charge = 19; ticks(state, 1); assert.equal(receiver.charge, 0); }
  receiver.incident = 5; ticks(state, 19); assert.equal(state.phase, 'playing'); ticks(state, 1); assert.equal(state.phase, 'won');
});

test('fractional time accumulates at 10 Hz regardless of rendering frequency', () => {
  const slow = model.create(), fast = model.create();
  for (let i = 0; i < 13; i += 1) model.step(slow, 0.1, {});
  for (let i = 0; i < 78; i += 1) model.step(fast, 1 / 60, {});
  assert.equal(fast.tick, 13); assert.equal(fast.tick, slow.tick); assert.equal(fast.remainingTicks, slow.remainingTicks);
  assert.ok(Math.abs(fast.elapsed - slow.elapsed) < 1e-9);
  const frozen = clone(fast); for (const bad of [0, -1, NaN, Infinity]) model.step(fast, bad, { aPressed: true }); assert.deepEqual(fast, frozen);
  // Pausing is owned by the runtime: no call means neither optics nor time changes.
  assert.deepEqual(fast, frozen);
  model.step(fast, 10, {}); assert.ok(fast.elapsed - frozen.elapsed <= 0.2500001, 'background time is not caught up');
});

test('heat increases once per illuminated tick and cools twice as fast without going negative', () => {
  const state = model.create(1, 1), hazard = state.hazards[0];
  hazard.illuminated = true; ticks(state, 4); assert.equal(hazard.heat, 4);
  hazard.illuminated = false; ticks(state, 1); assert.equal(hazard.heat, 2);
  ticks(state, 2); assert.equal(hazard.heat, 0);
  hazard.illuminated = true; hazard.heat = hazard.limit - 1; ticks(state, 1);
  assert.equal(state.phase, 'lost'); assert.equal(state.lostReason, 'overheat'); assert.equal(hazard.heat, hazard.limit);
  const terminal = clone(state); ticks(state, 10); assert.deepEqual(state, terminal);
});

test('terminal precedence is overheating, then success, then exhausted energy', () => {
  function boundary() {
    const state = model.create(1, 1);
    state.tick = state.timeLimitTicks - 1; state.elapsed = state.tick / 10; state.remainingTicks = 1; state.remaining = 0.1;
    state.receivers.forEach(receiver => { receiver.incident = receiver.required; receiver.charge = 19; });
    return state;
  }
  const finalWin = boundary(); ticks(finalWin, 1);
  assert.equal(finalWin.phase, 'won'); assert.equal(finalWin.remainingTicks, 0); assert.equal(finalWin.elapsed, finalWin.timeLimit);
  const tooHot = boundary(); tooHot.hazards[0].heat = tooHot.hazards[0].limit - 1; tooHot.hazards[0].illuminated = true;
  ticks(tooHot, 1); assert.equal(tooHot.phase, 'lost'); assert.equal(tooHot.lostReason, 'overheat');
  assert.ok(tooHot.receivers.every(receiver => receiver.charge === 20));
  const timeout = boundary(); timeout.receivers[0].incident = 0; ticks(timeout, 1);
  assert.equal(timeout.phase, 'lost'); assert.equal(timeout.lostReason, 'timeout');
});

test('untouched levels expire at exactly their designed 45/60/75 second limits', () => {
  [450, 600, 750].forEach((limit, level) => {
    const state = model.create(1, level); ticks(state, limit - 1);
    assert.equal(state.phase, 'playing'); assert.equal(state.remainingTicks, 1); ticks(state, 1);
    assert.equal(state.phase, 'lost'); assert.equal(state.lostReason, 'timeout'); assert.equal(state.elapsed, limit / 10);
  });
});

test('A/B rotate once per held edge, while explicit runtime pulses preserve fast re-presses', () => {
  const state = model.create(1, 1);
  model.step(state, 0.01, { a: true }); assert.equal(state.devices[0].orientation, 3);
  for (let i = 0; i < 10; i += 1) model.step(state, 0.01, { a: true });
  assert.equal(state.devices[0].orientation, 3);
  model.step(state, 0.01, { a: true, aPressed: true }); assert.equal(state.devices[0].orientation, 0);
  model.step(state, 0.01, { b: true }); assert.equal(state.devices[0].orientation, 3, 'negative turns use positive modular arithmetic');
  for (let i = 0; i < 5; i += 1) model.step(state, 0.01, { b: true }); assert.equal(state.devices[0].orientation, 3);
  model.step(state, 0.01, {}); model.step(state, 0.01, { b: true }); assert.equal(state.devices[0].orientation, 2);
  const before = state.devices[0].orientation; model.step(state, 0.01, {}); press(state, { a: true, b: true });
  assert.equal(state.devices[0].orientation, before);
});

test('selection precedes rotation, has a dead zone and delayed repeat, and reaches every device', () => {
  const state = model.create(1, 2); press(state, { x: 0.3, y: 0.2 }); assert.equal(state.selectedId, 'device-1');
  model.step(state, 0.01, { x: 1, aPressed: true }); assert.equal(state.selectedId, 'device-6');
  assert.equal(state.devices[5].orientation, 0); assert.equal(state.devices[0].orientation, 3);
  model.step(state, 0.2, { x: 1 }); model.step(state, 0.2, { x: 1 }); assert.equal(state.selectedId, 'device-6');
  model.step(state, 0.02, { x: 1 }); assert.equal(state.selectedId, 'device-3');
  for (let level = 0; level < 3; level += 1) {
    const board = model.create(1, level);
    for (const from of board.devices) {
      for (const input of nextRoute(board, from.id)) press(board, input);
      for (const to of board.devices) assert.ok(Array.isArray(nextRoute(board, to.id)));
    }
  }
});

test('create/retry are independent, restore layouts and cannot inherit held actions', () => {
  for (let level = 0; level < 3; level += 1) {
    const initial = model.create(41, level), played = model.create(41, level);
    press(played, { a: true }); ticks(played, 30); played.hazards.forEach(hazard => { hazard.heat = 20; });
    const retry = model.create(41, level); assert.deepEqual(retry, initial);
    assert.notEqual(retry.devices[0], initial.devices[0]); assert.notEqual(retry.cells, initial.cells);
    const orientation = retry.devices[0].orientation; model.step(retry, 0.01, { a: true }); assert.notEqual(retry.devices[0].orientation, orientation);
    assert.deepEqual(model.create(41, level), initial, 'play cannot pollute the internal level templates');
  }
  assert.equal(model.create().level, 1); assert.equal(model.create(1, -3).level, 1); assert.equal(model.create(1, 99).level, 3);
});

test('all 146 orientation combinations have exactly one safe solution per level', () => {
  let combinations = 0;
  for (let level = 0; level < 3; level += 1) {
    const board = model.create(1, level), correct = [];
    assert.ok(board.receivers.some(receiver => receiver.incident !== receiver.required), 'the initial state is not solved');
    function enumerate(index) {
      if (index < board.devices.length) {
        const device = board.devices[index], count = device.type === 'mirror' ? 2 : 4;
        for (let orientation = 0; orientation < count; orientation += 1) { device.orientation = orientation; enumerate(index + 1); }
        return;
      }
      combinations += 1; const optics = model.traceBeams(board);
      if (board.receivers.every(receiver => optics.receiverIncident[receiver.id] === receiver.required) && !Object.values(optics.illuminatedHazards).some(Boolean)) correct.push(board.devices.map(device => device.orientation));
    }
    enumerate(0); assert.deepEqual(correct, [answers[level]]);
  }
  assert.equal(combinations, 146);
});

test('level three needs both red and blue at purple; crossing green stays independent', () => {
  const board = solveByInput(2);
  assert.equal(board.receivers[0].incident, 5); assert.equal(board.receivers[1].incident, 2);
  for (const input of nextRoute(board, 'device-2')) press(board, input);
  press(board, { b: true }); ticks(board, 1);
  assert.equal(board.receivers[0].incident, 4); assert.equal(board.receivers[0].charge, 0);
  assert.equal(board.receivers[1].incident, 2); assert.notEqual(board.phase, 'won');
});

test('all three levels are won through actual direction and rotation input', () => {
  for (let level = 0; level < 3; level += 1) {
    const state = solveByInput(level); ticks(state, 20);
    assert.equal(state.phase, 'won'); assert.ok(state.receivers.every(receiver => receiver.charge === 20));
    assert.ok(state.hazards.every(hazard => hazard.heat < hazard.limit));
  }
});

test('read-only automation solves each QA level and records three ordinary menu transitions', async () => {
  const pilot = await import(pathToFileURL(path.join(__dirname, 'automation.mjs')).href);
  function run(startLevel, mode) {
    let state = model.create(1, startLevel), menuLevel = startLevel, held = new Set(), wins = new Set();
    const before = { phase: 'playing', level: menuLevel, model: clone(state) }, trace = [];
    for (let elapsed = 0; elapsed < 80; elapsed += 0.08) {
      const snapshot = { phase: state.phase, paused: false, level: menuLevel, model: clone(state) }, unchanged = clone(snapshot);
      const keys = pilot.keys(snapshot, { elapsed, mode }); assert.deepEqual(snapshot, unchanged, 'pilot must never write a snapshot');
      assert.ok(keys.every(key => ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Space', 'b', 'Enter'].includes(key)));
      const down = new Set(keys);
      if (state.phase === 'playing') {
        model.step(state, 0.08, { x: Number(down.has('ArrowRight')) - Number(down.has('ArrowLeft')), y: Number(down.has('ArrowDown')) - Number(down.has('ArrowUp')),
          a: down.has('Space'), b: down.has('b'), aPressed: down.has('Space') && !held.has('Space'), bPressed: down.has('b') && !held.has('b') });
      } else {
        wins.add(state.level);
        if (down.has('ArrowRight') && !held.has('ArrowRight')) menuLevel = (menuLevel + 1) % 3;
        if (down.has('Enter') && !held.has('Enter')) state = model.create(1, menuLevel);
      }
      held = down;
      trace.push({ state: { phase: state.phase, model: clone(state) } });
      if (state.phase === 'won' && (mode === 'qa' || state.level === 3)) {
        wins.add(state.level);
        const after = { phase: state.phase, model: clone(state) };
        if (mode === 'qa') pilot.assertProgress({ before, after, trace }, assert);
        else assert.deepEqual([...wins], [1, 2, 3]);
        const retry = { phase: 'playing', model: model.create(1, state.level - 1) };
        pilot.assertRetry({ before: after, after: retry }, assert);
        return;
      }
    }
    assert.fail(`pilot did not complete ${mode} level ${startLevel + 1}`);
  }
  for (let level = 0; level < 3; level += 1) run(level, 'qa');
  run(0, 'record');
  assert.equal(pilot.budgets.maxWebGLDrawCalls, 3);
});
