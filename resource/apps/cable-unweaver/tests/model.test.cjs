'use strict';
// Formal contract checks only. Separate ordinary-run artifacts and the frozen
// independent checker are not generated, imported, or replaced by this file.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const modelPath = path.join(__dirname, '../src/main/assets/game-model.js');
const source = fs.readFileSync(modelPath, 'utf8');
const model = require(modelPath);
const clone = value => JSON.parse(JSON.stringify(value));
const dt = 0.125;

function command(state, input) {
  model.step(state, dt, {});
  const before = clone(state);
  assert.equal(model.step(state, dt, input), state);
  return { before, after: clone(state), input: { ...input } };
}

function assertReceipt(view) {
  const { before, after } = view;
  assert.equal(after.movesUsed, before.movesUsed + 1);
  assert.equal(after.moves.length, after.movesUsed);
  assert.deepEqual(after.moves.slice(0, -1), before.moves);
  const receipt = after.moves.at(-1);
  assert.deepEqual(receipt.fromPositions, before.positions);
  assert.deepEqual(receipt.toPositions, after.positions);
  assert.equal(receipt.index, before.moves.length);
  assert.equal(receipt.call, after.calls);
  assert.equal(receipt.elapsed, after.elapsed);
  assert.equal(receipt.conflictCount, after.geometry.conflictCount);
  assert.equal(receipt.nodeCollisionCount, after.geometry.coincidentNodes.length);
  assert.equal(receipt.zeroLengthCount, after.geometry.zeroLengthEdges.length);
  assert.equal(receipt.railsValid, after.geometry.railsValid);
  assert.equal(receipt.matched, after.geometry.matched);
  assert.equal(receipt.phase, after.phase);
  assert.equal(receipt.remaining, model.config.tasks[after.level].budget - after.movesUsed);
}

// Public, current-observation policy. It reads the visible anchor/center gap;
// it does not predict geometry, enumerate placements, or store target vectors.
function visibleGuideStep(state) {
  const group = state.geometry.groups.find(item => item.guideErrorNumerator !== 0);
  assert.ok(group, 'A fully guide-aligned but invalid public task must be reported as a failure');
  const terminal = model.config.tasks[state.level].terminals[state.selected];
  if (model.config.tasks[state.level].groups[terminal.group].id !== group.id) return command(state, { a: true });
  return command(state, { [group.axis]: group.guideErrorNumerator > 0 ? -1 : 1 });
}

function alignVisible(state, observe = () => {}) {
  for (let attempt = 0; attempt < 80 && state.phase === 'playing'; attempt += 1) {
    observe(visibleGuideStep(state));
  }
  return state;
}

function exhaustPublic(level) {
  const state = model.create(743, level), task = model.config.tasks[level];
  const axis = task.terminals[0].rail.axis;
  for (let move = 0; move < task.budget; move += 1) {
    assert.equal(state.phase, 'playing');
    assertReceipt(command(state, { [axis]: move % 2 === 0 ? 1 : -1 }));
  }
  return state;
}

// SYNTHETIC MATH ONLY: one exact in-memory injection exposes private pure
// geometry functions for unreachable mathematical cases. Production bytes and
// the production export object remain unchanged. This seam cannot drive a run.
let synthetic;
function syntheticMath() {
  if (synthetic) return synthetic;
  const needle = '  // SYNTHETIC_MATH_TEST_SEAM: production exports remain create/step/config.';
  assert.equal(source.split(needle).length - 1, 1, 'The declared seam must occur exactly once');
  const injection = '  globalThis.__syntheticCableMath = Object.freeze({ classifyPair, deriveGeometry });\n';
  const context = {};
  vm.createContext(context);
  vm.runInContext(source.replace(needle, injection + needle), context, { filename: 'synthetic-cable-math-only.js' });
  assert.deepEqual(Object.keys(context.PureModel).sort(), ['config', 'create', 'step']);
  assert.equal(fs.readFileSync(modelPath, 'utf8'), source, 'The seam must not modify production bytes');
  synthetic = {
    pair: (first, second) => clone(context.__syntheticCableMath.classifyPair(first, second)),
    geometry: (task, positions) => clone(context.__syntheticCableMath.deriveGeometry(task, positions))
  };
  return synthetic;
}

function segment(from, to, ax, ay, bx, by) {
  return { from, to, a: { x: ax, y: ay }, b: { x: bx, y: by } };
}

test('CommonJS and browser expose only create/step/config with deeply frozen public data', () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context, { filename: modelPath });
  assert.deepEqual(Object.keys(model).sort(), ['config', 'create', 'step']);
  assert.deepEqual(Object.keys(context.PureModel).sort(), ['config', 'create', 'step']);
  assert.deepEqual(clone(context.PureModel.create(743, 2)), model.create(743, 2));
  function frozen(value) {
    if (!value || typeof value !== 'object') return;
    assert.equal(Object.isFrozen(value), true);
    Object.values(value).forEach(frozen);
  }
  frozen(model.config);
  assert.throws(() => { model.config.tasks[0].groups[0].initial = 2; }, TypeError);
  assert.equal(JSON.stringify(model.config).includes('solution'), false);
});

test('creation normalizes seed/level without coercion and starts fresh/unarmed', () => {
  for (const invalid of [undefined, null, '1', 1.2, NaN, Infinity, -1, 4294967296]) {
    assert.equal(model.create(invalid, '2').seed, 743);
    assert.equal(model.create(invalid, '2').level, 0);
  }
  for (const seed of [0, 743, 4294967295]) assert.equal(model.create(seed, 2).seed, seed);
  for (const level of [-1, 3, 0.5, null, undefined, NaN]) assert.equal(model.create(2, level).level, 0);
  const state = model.create();
  assert.equal(state.schema, 1);
  assert.equal(state.inputArmed, false);
  assert.deepEqual(state.lastHeld, { a: false, b: false, direction: 'none' });
  assert.deepEqual([state.calls, state.movesUsed, state.selectionChanges, state.blockedMoves, state.elapsed], [0, 0, 0, 0, 0]);
  assert.deepEqual([state.phase, state.reason, state.score, state.cancelEpoch, state.cancelledLast], ['playing', '', 0, null, false]);
});

test('all three public starts have the exact pair counts, rational markers and rigid bounds', () => {
  const states = [0, 1, 2].map(level => model.create(743, level));
  assert.deepEqual(states.map(state => state.geometry.conflictCount), [3, 2, 3]);
  assert.deepEqual(states[0].geometry.conflicts.map(item => item.edges), [['e0', 'e1'], ['e0', 'e2'], ['e1', 'e2']]);
  for (const conflict of states[0].geometry.conflicts) assert.deepEqual(conflict.point, { xNum: 5, yNum: 5, den: 1 });
  assert.deepEqual(states[1].geometry.conflicts.map(item => item.point), [
    { xNum: 50, yNum: 42, den: 9 }, { xNum: 50, yNum: 58, den: 11 }
  ]);
  assert.deepEqual(states[2].geometry.conflicts[0], { edges: ['e0', 'e1'], kind: 'overlap', point: null,
    overlap: [{ x: 0, y: 0 }, { x: 3, y: 6 }] });
  for (const conflict of states[2].geometry.conflicts.slice(1)) assert.deepEqual(conflict.point, { xNum: 20, yNum: 40, den: 7 });
  assert.deepEqual(states.map(state => state.geometry.groups.map(group => [group.min, group.max])), [
    [[1, 9], [1, 9], [1, 9]], [[1, 7], [1, 9]], [[-2, 4], [-1, 9]]
  ]);
  for (const state of states) {
    assert.deepEqual(state.geometry.conflictEdgeIds, ['e0', 'e1', 'e2']);
    assert.deepEqual(state.geometry.coincidentNodes, []);
    assert.deepEqual(state.geometry.zeroLengthEdges, []);
    assert.equal(state.geometry.railsValid, true);
    assert.equal(state.geometry.matched, false);
  }
});

test('node/rail/segment/guide records expose actual world geometry in public order', () => {
  const geometry = model.create(743, 2).geometry;
  assert.deepEqual(geometry.nodes.map(node => node.id), ['H', 'K', 'a', 'b', 'c']);
  assert.deepEqual(geometry.nodes[2], { id: 'a', position: { x: 3, y: 6 }, terminalIndex: 0, groupIndex: 0 });
  assert.deepEqual(geometry.rails[1], { terminal: 'b', axis: 'x', start: { x: 0, y: 10 }, end: { x: 7, y: 10 }, min: 0, max: 7, fixed: 10 });
  assert.deepEqual(geometry.groups[0], { id: 'gAB', axis: 'x', members: ['a', 'b'], position: 3, min: -2, max: 4,
    guideNode: 'H', guideCurrentNumerator: 8, guideDenominator: 2, guideReference: 0, guideErrorNumerator: 8, guideAligned: false });
  assert.deepEqual(geometry.segments[1], { id: 'e1', from: 'H', to: 'b', a: { x: 0, y: 0 }, b: { x: 5, y: 10 } });
});

test('mutable round geometry and positions do not alias config, other rounds, or segment endpoints', () => {
  const first = model.create(743, 1), other = model.create(743, 1), saved = clone(other);
  assert.notEqual(first.geometry.nodes[0].position, first.geometry.segments[0].a);
  assert.notEqual(first.geometry.segments[0].a, first.geometry.segments[1].a);
  assert.notEqual(first.geometry.rails[0].start, first.geometry.rails[0].end);
  // Synthetic alias probe only; this deliberately corrupted round is never played.
  first.geometry.nodes[0].position.y = 99;
  first.geometry.groups[0].members.push('probe');
  first.positions[0] = 99;
  assert.deepEqual(other, saved);
  assert.equal(first.geometry.segments[0].a.y, 3);
  assert.equal(model.config.tasks[1].fixed[0].position.y, 3);
  assert.equal(model.config.tasks[1].groups[0].initial, 6);
});

test('synthetic math: proper crossings use reduced positive-denominator rational markers', () => {
  const math = syntheticMath(), first = segment('A', 'B', 0, 0, 6, 4), second = segment('C', 'D', 0, 3, 6, 0);
  const expected = { kind: 'cross', point: { xNum: 18, yNum: 12, den: 7 }, overlap: null };
  assert.deepEqual(math.pair(first, second), expected);
  assert.deepEqual(math.pair(second, first), expected);
  assert.deepEqual(math.pair(segment('B', 'A', 6, 4, 0, 0), second), expected);
  assert.deepEqual(math.pair(segment('A', 'B', -2, -2, 2, 2), segment('C', 'D', -2, 2, 2, -2)),
    { kind: 'cross', point: { xNum: 0, yNum: 0, den: 1 }, overlap: null });
});

test('synthetic math: a shared graph endpoint alone is legal for angled or collinear segments', () => {
  const math = syntheticMath(), first = segment('H', 'A', 0, 0, 4, 0);
  assert.equal(math.pair(first, segment('H', 'B', 0, 0, 0, 4)), null);
  assert.equal(math.pair(first, segment('H', 'B', 0, 0, -4, 0)), null);
});

test('synthetic math: distinct-ID endpoint contact and T contact are illegal touches', () => {
  const math = syntheticMath(), expected = { kind: 'touch', point: { xNum: 2, yNum: 0, den: 1 }, overlap: null };
  assert.deepEqual(math.pair(segment('A', 'B', 0, 0, 2, 0), segment('C', 'D', 2, 0, 2, 3)), expected);
  assert.deepEqual(math.pair(segment('A', 'B', 0, 0, 4, 0), segment('C', 'D', 2, 0, 2, 3)), expected);
});

test('synthetic math: collinear disjoint/single-point intervals and separated lines are distinguished', () => {
  const math = syntheticMath(), first = segment('A', 'B', 0, 0, 2, 0);
  assert.equal(math.pair(first, segment('C', 'D', 3, 0, 4, 0)), null);
  assert.equal(math.pair(first, segment('C', 'D', 3, -1, 3, 1)), null);
  assert.equal(math.pair(first, segment('C', 'D', 0, 1, 2, 1)), null);
  assert.deepEqual(math.pair(first, segment('C', 'D', 2, 0, 4, 0)),
    { kind: 'touch', point: { xNum: 2, yNum: 0, den: 1 }, overlap: null });
});

test('synthetic math: positive overlap defeats shared-ID exemption and sorts all endpoint orientations', () => {
  const math = syntheticMath();
  assert.deepEqual(math.pair(segment('H', 'A', 4, 4, 0, 0), segment('H', 'B', 4, 4, 2, 2)),
    { kind: 'overlap', point: null, overlap: [{ x: 2, y: 2 }, { x: 4, y: 4 }] });
  assert.deepEqual(math.pair(segment('A', 'B', 0, 5, 0, -1), segment('C', 'D', 0, 2, 0, 8)),
    { kind: 'overlap', point: null, overlap: [{ x: 0, y: 2 }, { x: 0, y: 5 }] });
  assert.deepEqual(math.pair(segment('A', 'B', 4, 0, 0, 4), segment('C', 'D', 1, 3, 3, 1)),
    { kind: 'overlap', point: null, overlap: [{ x: 1, y: 3 }, { x: 3, y: 1 }] });
});

test('synthetic math: all coincident pairs are ordered and zero-length omission cannot create a win', () => {
  const math = syntheticMath();
  const task = { fixed: ['A', 'B', 'C'].map(id => ({ id, position: { x: 0, y: 0 } })),
    terminals: [], groups: [], edges: [{ id: 'zero', from: 'A', to: 'B' }] };
  const geometry = math.geometry(task, []);
  assert.deepEqual(geometry.coincidentNodes, [['A', 'B'], ['A', 'C'], ['B', 'C']]);
  assert.deepEqual(geometry.zeroLengthEdges, ['zero']);
  assert.equal(geometry.conflictCount, 0);
  assert.equal(geometry.railsValid, true);
  assert.equal(geometry.matched, false);
  assert.equal(math.pair(segment('A', 'B', 1, 1, 1, 1), segment('C', 'D', 0, 0, 2, 2)), null);
});

test('synthetic math: derivation reports fractional/out-of-range rails without clamping', () => {
  const task = { fixed: [{ id: 'H', position: { x: 0, y: 0 } }],
    terminals: [{ id: 'a', group: 0, offset: 0, rail: { axis: 'x', fixed: 5, min: 0, max: 2 } }],
    groups: [{ id: 'ga', initial: 1, guideNode: 'H' }], edges: [] };
  for (const position of [1.5, 3]) {
    const geometry = syntheticMath().geometry(task, [position]);
    assert.deepEqual(geometry.nodes[1].position, { x: position, y: 5 });
    assert.deepEqual(geometry.railViolations, ['a']);
    assert.equal(geometry.railsValid, false);
    assert.equal(geometry.matched, false);
    assert.deepEqual(geometry.rails[0].end, { x: 2, y: 5 });
  }
});

test('parallel commands move one unit on both rail orientations; orthogonal commands are free', () => {
  for (const level of [0, 2]) {
    const state = model.create(743, level), initial = state.positions.slice(), geometry = state.geometry;
    const axis = model.config.tasks[level].terminals[0].rail.axis;
    command(state, { [axis === 'x' ? 'y' : 'x']: 1 });
    assert.deepEqual(state.positions, initial);
    assert.equal(state.geometry, geometry);
    assert.equal(state.movesUsed, 0);
    assert.equal(state.blockedMoves, 0);
    assert.deepEqual(state.events, []);
    assertReceipt(command(state, { [axis]: -1 }));
    assert.equal(state.positions[0], initial[0] - 1);
    assert.deepEqual(state.positions.slice(1), initial.slice(1));
  }
});

test('either selected rigid member translates the whole group and preserves the full relative vector', () => {
  for (const level of [1, 2]) {
    const state = model.create(743, level), axis = model.config.tasks[level].terminals[0].rail.axis;
    const vector = () => {
      const a = state.geometry.nodes.find(node => node.id === 'a').position;
      const b = state.geometry.nodes.find(node => node.id === 'b').position;
      return [b.x - a.x, b.y - a.y];
    };
    const originalVector = vector(), originalPositions = state.positions.slice();
    assertReceipt(command(state, { [axis]: -1 }));
    command(state, { a: true });
    assert.equal(state.selected, 1);
    assertReceipt(command(state, { [axis]: -1 }));
    assert.deepEqual(vector(), originalVector);
    assert.equal(state.positions[0], originalPositions[0] - 2);
    assert.equal(state.positions[1], originalPositions[1]);
    assert.equal(state.moves.at(-1).terminal, 'b');
    assert.equal(state.moves.at(-1).group, 'gAB');
  }
});

test('the shorter rail stops the entire rigid group without changing geometry or charging budget', () => {
  for (const [level, limiting] of [[1, ['b']], [2, ['a']]]) {
    const state = model.create(743, level), axis = model.config.tasks[level].terminals[0].rail.axis;
    command(state, { [axis]: 1 });
    const positions = state.positions, geometry = state.geometry, receipts = clone(state.moves);
    command(state, { [axis]: 1 });
    assert.equal(state.positions, positions);
    assert.equal(state.geometry, geometry);
    assert.equal(state.movesUsed, 1);
    assert.equal(state.blockedMoves, 1);
    assert.deepEqual(state.moves, receipts);
    assert.deepEqual(state.events, [{ type: 'blocked', terminal: 'a', group: 'gAB', requested: 1, limiting, call: state.calls }]);
  }
});

test('common negative group bound and simultaneous limiting members are respected', () => {
  const state = model.create(743, 1);
  for (let move = 0; move < 5; move += 1) command(state, { y: -1 });
  assert.equal(state.positions[0], 1);
  command(state, { y: -1 });
  assert.equal(state.movesUsed, 5);
  assert.equal(state.blockedMoves, 1);
  assert.deepEqual(state.events[0].limiting, ['a', 'b']);
  assert.equal(state.geometry.railsValid, true);
});

test('A/B cycle a,b,c freely, including two members of the same rigid group', () => {
  const state = model.create(743, 1), geometry = state.geometry, positions = state.positions;
  for (const expected of [1, 2, 0]) { command(state, { a: true }); assert.equal(state.selected, expected); }
  for (const expected of [2, 1, 0]) { command(state, { b: true }); assert.equal(state.selected, expected); }
  assert.equal(state.selectionChanges, 6);
  assert.equal(state.movesUsed, 0);
  assert.equal(state.geometry, geometry);
  assert.equal(state.positions, positions);
  assert.deepEqual(state.events, [{ type: 'select', terminal: 'a', group: 'gAB', call: state.calls }]);
});

test('B rise wins simultaneous A/B/direction and every suppressed edge is consumed', () => {
  const state = model.create();
  model.step(state, dt, {});
  model.step(state, dt, { a: true, b: true, y: -1 });
  assert.equal(state.selected, 2);
  assert.equal(state.lastCommand, 'b');
  model.step(state, dt, { a: true, y: -1 });
  model.step(state, dt, { y: -1 });
  assert.equal(state.selectionChanges, 1);
  assert.equal(state.movesUsed, 0);
  command(state, { y: -1 });
  assert.equal(state.positions[2], 1);
});

test('A plus a fresh direction selects only and releasing A cannot replay that direction', () => {
  const state = model.create();
  command(state, { a: true, y: 1 });
  assert.equal(state.selected, 1);
  assert.equal(state.movesUsed, 0);
  model.step(state, dt, { y: 1 });
  assert.equal(state.movesUsed, 0);
  assertReceipt(command(state, { y: 1 }));
  assert.equal(state.positions[1], 6);
});

test('holding A while changing direction may move without a new selection', () => {
  const state = model.create();
  command(state, { a: true });
  model.step(state, dt, { a: true, y: -1 });
  model.step(state, dt, { a: true, y: 1 });
  assert.equal(state.selected, 1);
  assert.equal(state.selectionChanges, 1);
  assert.equal(state.movesUsed, 2);
  assert.deepEqual(state.positions, [8, 5, 2]);
});

test('axis clamp, strict threshold, and vertical tie use normalized held tokens', () => {
  const state = model.create();
  command(state, { x: 0.5, y: -0.5 });
  assert.equal(state.lastHeld.direction, 'none');
  assert.equal(state.movesUsed, 0);
  model.step(state, dt, { x: 1, y: 1 });
  assert.equal(state.lastCommand, 'down');
  assert.equal(state.positions[0], 9);
  model.step(state, dt, { x: 0.9, y: 0.6 });
  assert.equal(state.lastCommand, 'right');
  assert.equal(state.movesUsed, 1);
  model.step(state, dt, { x: -10, y: -1 });
  assert.equal(state.lastCommand, 'up');
  assert.equal(state.positions[0], 8);
});

test('unchanged held directions never repeat; direct nonneutral changes do', () => {
  const state = model.create();
  command(state, { y: -1 });
  model.step(state, dt, { y: -0.7 });
  model.step(state, dt, { y: -1 });
  assert.equal(state.movesUsed, 1);
  model.step(state, dt, { y: 1 });
  assert.equal(state.movesUsed, 2);
  assert.deepEqual(state.positions, [8, 5, 2]);
  command(state, { y: 1 });
  assert.equal(state.movesUsed, 3);
});

test('new/retried state ignores held input until a genuine neutral, including bare undefined', () => {
  const state = model.create();
  model.step(state, dt, { a: true, y: -1 });
  model.step(state, dt, { a: true });
  assert.equal(state.selected, 0);
  assert.equal(state.movesUsed, 0);
  assert.equal(state.inputArmed, false);
  model.step(state, dt, undefined);
  assert.equal(state.inputArmed, true);
  model.step(state, dt, { a: true });
  assert.equal(state.selected, 1);
  assert.equal(model.create(state.seed, state.level).inputArmed, false);
});

test('first epoch establishes a baseline, later epoch quarantines held edges until neutral release', () => {
  const state = model.create();
  model.step(state, dt, {});
  model.step(state, dt, { cancelEpoch: 5, a: true });
  assert.equal(state.selected, 1);
  model.step(state, dt, { cancelEpoch: 6, a: true, y: -1 });
  assert.equal(state.inputArmed, false);
  model.step(state, dt, { cancelEpoch: 6, a: true });
  assert.equal(state.selected, 1);
  model.step(state, dt, { cancelEpoch: 6 });
  assert.equal(state.inputArmed, true);
  model.step(state, dt, { cancelEpoch: 6, a: true });
  assert.equal(state.selected, 2);
  assert.equal(state.movesUsed, 0);
  assert.equal(state.cancelEpoch, 6);
});

test('cancelled neutral never acknowledges release and cancelled calls still advance observations', () => {
  const state = model.create();
  model.step(state, dt, {});
  for (let repeat = 0; repeat < 3; repeat += 1) model.step(state, dt, { cancelled: true });
  assert.equal(state.inputArmed, false);
  assert.equal(state.calls, 4);
  assert.equal(state.elapsed, 0.5);
  model.step(state, dt, { a: true });
  assert.equal(state.selected, 0);
  model.step(state, dt, {});
  model.step(state, dt, { a: true });
  assert.equal(state.selected, 1);
  assert.equal(state.cancelledLast, false);
});

test('only nonnegative safe-integer epochs are stored, and neutral epoch changes arm future calls', () => {
  const state = model.create();
  model.step(state, dt, { cancelEpoch: 0 });
  for (const cancelEpoch of [-1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, '2', true]) {
    model.step(state, dt, { cancelEpoch });
    assert.equal(state.cancelEpoch, 0);
  }
  model.step(state, dt, { cancelEpoch: Number.MAX_SAFE_INTEGER });
  assert.equal(state.cancelEpoch, Number.MAX_SAFE_INTEGER);
  assert.equal(state.inputArmed, true);
  model.step(state, dt, { a: true });
  assert.equal(state.selected, 1);
});

test('invalid dt is an exact no-op before descriptor reads or coercion', () => {
  const state = model.create();
  command(state, { a: true });
  let reads = 0, coerced = 0;
  const input = new Proxy({}, { getOwnPropertyDescriptor() { reads += 1; throw Error('must not read'); } });
  const oddDuration = { valueOf() { coerced += 1; return 0.1; } };
  const before = clone(state), references = [state.geometry, state.events, state.lastHeld];
  for (const duration of [undefined, null, '0.1', 0, -1, 0.250001, Infinity, NaN, oddDuration]) {
    assert.equal(model.step(state, duration, input), state);
    assert.deepEqual(state, before);
  }
  assert.equal(reads, 0);
  assert.equal(coerced, 0);
  assert.deepEqual([state.geometry, state.events, state.lastHeld], references);
});

test('paused literal true is an exact no-op after complete descriptor normalization', () => {
  const state = model.create();
  command(state, { a: true });
  const before = clone(state), seen = [];
  const input = new Proxy({ paused: true, b: true, cancelled: true }, {
    getOwnPropertyDescriptor(target, key) { seen.push(key); return Reflect.getOwnPropertyDescriptor(target, key); }
  });
  model.step(state, 0.25, input);
  assert.deepEqual(state, before);
  assert.deepEqual(seen, ['a', 'b', 'cancelled', 'paused', 'x', 'y', 'cancelEpoch']);
});

test('normalization ignores inherited/getter/pulse values and accepts only literal typed own data', () => {
  const state = model.create();
  let getters = 0;
  const input = Object.create({ a: true, b: true, y: -1, cancelled: true });
  Object.defineProperty(input, 'a', { get() { getters += 1; throw Error('getter'); } });
  Object.assign(input, { b: 1, paused: 'true', cancelled: 1, x: '1', y: Infinity,
    cancelEpoch: '1', aPressed: true, bPressed: true, start: true, select: true, direction: 'down' });
  model.step(state, dt, input);
  assert.equal(getters, 0);
  assert.equal(state.inputArmed, true);
  assert.equal(state.selected, 0);
  assert.equal(state.movesUsed, 0);
  assert.equal(state.cancelEpoch, null);
  const frozen = Object.freeze({ a: true });
  model.step(state, dt, frozen);
  assert.equal(state.selected, 1);
  assert.deepEqual(frozen, { a: true });
  let inheritedReads = 0;
  const originals = ['a', 'y'].map(key => [key, Object.getOwnPropertyDescriptor(Object.prototype, key)]);
  const accessor = { configurable: true, get() { inheritedReads += 1; return true; } };
  for (const pollution of [
    { a: accessor, y: { configurable: true, writable: true, value: -1 } },
    { a: { configurable: true, writable: true, value: true }, y: accessor }
  ]) {
    const clean = model.create();
    model.step(clean, dt, {});
    try {
      Object.defineProperties(Object.prototype, pollution);
      model.step(clean, dt, Object.create(null));
    } finally {
      for (const [key, descriptor] of originals) {
        if (descriptor) Object.defineProperty(Object.prototype, key, descriptor);
        else delete Object.prototype[key];
      }
    }
    // Assertions run only after all global descriptors have been restored.
    assert.equal(inheritedReads, 0);
    assert.equal(clean.calls, 2);
    assert.equal(clean.selected, 0);
    assert.equal(clean.movesUsed, 0);
    assert.deepEqual(clean.lastHeld, { a: false, b: false, direction: 'none' });
  }
});

test('arrays/functions/primitives normalize wholly neutral and can arm without acting', () => {
  const callable = Object.assign(function () {}, { b: true, y: 1 });
  for (const input of [Object.assign([], { b: true, y: 1 }), callable, null, true, 1, 'a']) {
    const state = model.create();
    model.step(state, dt, input);
    assert.equal(state.inputArmed, true);
    assert.equal(state.calls, 1);
    assert.equal(state.selected, 0);
    assert.deepEqual(state.lastHeld, { a: false, b: false, direction: 'none' });
  }
});

test('throwing descriptors and revoked proxies atomically discard all partially read input', () => {
  const state = model.create(), seen = [];
  const input = new Proxy({ a: true, cancelled: true, paused: true, x: 1, cancelEpoch: 8 }, {
    getOwnPropertyDescriptor(target, key) {
      seen.push(key);
      if (key === 'y') throw Error('late descriptor failure');
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  model.step(state, dt, input);
  assert.deepEqual(seen, ['a', 'b', 'cancelled', 'paused', 'x', 'y']);
  assert.equal(state.calls, 1);
  assert.equal(state.inputArmed, true);
  assert.equal(state.cancelledLast, false);
  assert.equal(state.cancelEpoch, null);
  assert.deepEqual(state.lastHeld, { a: false, b: false, direction: 'none' });
  const revocable = Proxy.revocable({}, {});
  revocable.revoke();
  model.step(state, dt, revocable.proxy);
  assert.equal(state.calls, 2);
  assert.equal(state.movesUsed, 0);
  assert.equal(state.selected, 0);
});

test('admitted dt advances exactly once without accumulating physics or repeating a hold', () => {
  const state = model.create();
  model.step(state, 0.25, {});
  model.step(state, 0.25, { y: -1 });
  model.step(state, 0.125, { y: -1 });
  assert.equal(state.calls, 3);
  assert.equal(state.elapsed, 0.625);
  assert.equal(state.movesUsed, 1);
  assert.equal(state.moves[0].elapsed, 0.5);
  assert.deepEqual(state.events, []);
});

test('temporary ordinary terminal coincidence remains repairable and never blocks the rail move', () => {
  const state = model.create();
  for (let move = 0; move < 3; move += 1) assertReceipt(command(state, { y: -1 }));
  assert.deepEqual(state.geometry.coincidentNodes, [['a', 'b']]);
  assert.equal(state.positions[0], 5);
  assert.equal(state.phase, 'playing');
  assertReceipt(command(state, { y: -1 }));
  assert.deepEqual(state.geometry.coincidentNodes, []);
  assert.equal(state.positions[0], 4);
  assert.equal(state.phase, 'playing');
});

test('synthetic stale caches cannot settle a no-move call or replace fresh geometry after a move', () => {
  const state = model.create();
  const original = state.geometry;
  // Deliberate cache corruption only; canonical physical positions stay real.
  state.geometry.matched = true;
  state.geometry.conflictCount = 0;
  state.geometry.conflicts = [];
  state.geometry.railsValid = false;
  command(state, { x: 1 });
  assert.equal(state.phase, 'playing');
  assert.equal(state.geometry, original);
  assertReceipt(command(state, { y: -1 }));
  assert.notEqual(state.geometry, original);
  assert.equal(state.geometry.matched, false);
  assert.equal(state.geometry.conflictCount, 3);
  assert.equal(state.geometry.railsValid, true);
  assert.equal(state.geometry.groups[0].guideCurrentNumerator, 7);
});

test('actual move receipts and replaced geometry preserve detached same-view history', () => {
  const state = model.create();
  assertReceipt(command(state, { y: -1 }));
  const firstReceipt = state.moves[0], savedReceipt = clone(firstReceipt);
  const oldGeometry = state.geometry, savedGeometry = clone(oldGeometry);
  const oldPositions = state.positions, savedPositions = oldPositions.slice();
  assert.notEqual(firstReceipt.fromPositions, firstReceipt.toPositions);
  assert.notEqual(firstReceipt.toPositions, state.positions);
  assertReceipt(command(state, { y: 1 }));
  assert.equal(state.moves[0], firstReceipt);
  assert.deepEqual(firstReceipt, savedReceipt);
  assert.deepEqual(oldGeometry, savedGeometry);
  assert.deepEqual(oldPositions, savedPositions);
  assert.notEqual(state.moves[1].fromPositions, oldPositions);
  assert.equal(state.movesUsed, 2);
});

test('current visible-guide policy wins each public task within its hand-proved cost bound', () => {
  const bounds = [12, 10, 13];
  for (const level of [0, 1, 2]) {
    const state = model.create(743, level);
    alignVisible(state, view => { if (view.after.movesUsed > view.before.movesUsed) assertReceipt(view); });
    assert.equal(state.phase, 'won');
    assert.equal(state.reason, '');
    assert.equal(state.score, 100);
    assert.equal(state.geometry.matched, true);
    assert.ok(state.movesUsed <= bounds[level]);
    assert.ok(state.geometry.groups.some(group => !group.guideAligned), 'An earlier actual win must stop the policy');
    assert.equal(state.moves.filter(receipt => receipt.matched).length, 1);
    assert.deepEqual(state.events, [{ type: 'win', call: state.calls }]);
  }
});

test('public first-group alternating policy produces three natural legal budget losses', () => {
  for (const level of [0, 1, 2]) {
    const state = exhaustPublic(level), budget = model.config.tasks[level].budget;
    assert.equal(state.phase, 'lost');
    assert.equal(state.reason, 'budget');
    assert.equal(state.score, 0);
    assert.equal(state.movesUsed, budget);
    assert.equal(state.moves.length, budget);
    assert.equal(state.blockedMoves, 0);
    assert.equal(state.geometry.matched, false);
    assert.ok(state.geometry.conflictCount > 0);
    assert.equal(state.moves.at(-1).remaining, 0);
    assert.ok(state.moves.every(receipt => !receipt.matched));
    assert.deepEqual(state.events, [{ type: 'collision', reason: 'budget', call: state.calls }]);
  }
});

test('prearranged public-input priority check wins on the real final budget move', () => {
  // Root hand-verified: eight legal public loss-policy moves return task0 to
  // its start; current-guide observations then produce an earlier valid graph
  // in ten more moves. This is separate from the six ordinary corpus policies.
  const state = model.create(743, 0);
  for (let move = 0; move < 8; move += 1) assertReceipt(command(state, { y: move % 2 === 0 ? 1 : -1 }));
  assert.deepEqual(state.positions, model.config.tasks[0].groups.map(group => group.initial));
  let finalView;
  alignVisible(state, view => {
    if (view.after.movesUsed > view.before.movesUsed) assertReceipt(view);
    if (view.after.phase !== 'playing') finalView = view;
  });
  assert.equal(state.phase, 'won');
  assert.equal(state.movesUsed, 18);
  assert.equal(finalView.before.movesUsed, 17);
  assert.equal(finalView.before.geometry.matched, false);
  assert.equal(finalView.after.geometry.matched, true);
  assert.equal(state.moves.at(-1).remaining, 0);
  assert.equal(state.moves.at(-1).phase, 'won');
  assertReceipt(finalView);
});

test('won/lost states are exact no-ops before duration/input reads and preserve final events', () => {
  const won = alignVisible(model.create()), lost = exhaustPublic(1);
  let reads = 0;
  const input = new Proxy({}, { getOwnPropertyDescriptor() { reads += 1; throw Error('terminal read'); } });
  for (const state of [won, lost]) {
    const before = clone(state), geometry = state.geometry, events = state.events, positions = state.positions;
    model.step(state, { valueOf() { throw Error('terminal coercion'); } }, input);
    model.step(state, dt, input);
    assert.deepEqual(state, before);
    assert.equal(state.geometry, geometry);
    assert.equal(state.events, events);
    assert.equal(state.positions, positions);
  }
  assert.equal(reads, 0);
});

test('synthetic counter/clock boundaries saturate only on overflow and flags remain sticky', () => {
  const state = model.create();
  model.step(state, dt, {});
  // Synthetic observation boundaries, never ordinary run evidence.
  state.calls = model.config.maxCounter - 1;
  state.selectionChanges = model.config.maxCounter - 1;
  state.elapsed = model.config.maxElapsed - 0.25;
  model.step(state, 0.25, { a: true });
  assert.equal(state.calls, model.config.maxCounter);
  assert.equal(state.selectionChanges, model.config.maxCounter);
  assert.equal(state.elapsed, model.config.maxElapsed);
  assert.equal(state.counterSaturated, false);
  assert.equal(state.clockSaturated, false);
  model.step(state, dt, {});
  model.step(state, dt, { b: true });
  assert.equal(state.calls, model.config.maxCounter);
  assert.equal(state.selectionChanges, model.config.maxCounter);
  assert.equal(state.elapsed, model.config.maxElapsed);
  assert.equal(state.counterSaturated, true);
  assert.equal(state.clockSaturated, true);
  assert.equal(state.phase, 'playing');
  assert.equal(state.movesUsed, 0);
  const blocked = model.create();
  command(blocked, { y: 1 });
  blocked.blockedMoves = model.config.maxCounter - 1;
  command(blocked, { y: 1 });
  assert.equal(blocked.blockedMoves, model.config.maxCounter);
  assert.equal(blocked.counterSaturated, false);
  command(blocked, { y: 1 });
  assert.equal(blocked.blockedMoves, model.config.maxCounter);
  assert.equal(blocked.counterSaturated, true);
  assert.equal(blocked.movesUsed, 1);
});
