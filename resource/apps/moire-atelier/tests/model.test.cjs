'use strict';
// Formal contract checks. Synthetic boundary fixtures below are not ordinary
// play evidence; this file does not create or replace the independent corpus.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const modelPath = path.join(__dirname, '../src/main/assets/game-model.js');
const source = fs.readFileSync(modelPath, 'utf8');
const model = require(modelPath);
const clone = value => structuredClone(value);
const dt = 0.125;
const close = (actual, expected, tolerance = 1e-12) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
};

function command(state, input) {
  model.step(state, dt, {});
  const before = clone(state);
  assert.equal(model.step(state, dt, input), state);
  return { before, after: clone(state) };
}

// This policy reads only actual visible feedback, never proposed controls,
// a target placement, model helpers, a search, or a recorded action route.
function guidePose(state) {
  for (let actions = 0; actions < 80 && state.phase === 'playing' && !state.optics.matched; actions += 1) {
    let layer = state.optics.layers.find(item => !item.guide.turnAligned);
    const turning = !!layer;
    if (!layer) layer = state.optics.layers.find(item => !item.guide.phaseAligned);
    assert.ok(layer, 'All visible guides align but actual probes do not; preserve this failure');
    if (state.selected !== layer.index) command(state, { b: true });
    else if (turning) command(state, { y: layer.guide.turnErrorDegrees > 0 ? -1 : 1 });
    else command(state, { x: layer.guide.phaseError > 0 ? 1 : -1 });
  }
  assert.equal(state.phase, 'playing');
  assert.equal(state.optics.matched, true);
  return state;
}

function win(level = 0) {
  const state = guidePose(model.create(744, level));
  command(state, { a: true });
  return state;
}

function rejectionLoss(level = 0) {
  const state = model.create(744, level);
  for (let attempt = 0; attempt < 4; attempt += 1) command(state, { a: true });
  return state;
}

function verifyOptics(state) {
  for (const probe of state.optics.probes) {
    const actual = model.sampleAt(state, probe.position.x, probe.position.y);
    assert.deepEqual(probe.sample, actual);
    assert.equal(probe.error, actual.brightness - probe.targetBrightness);
    assert.equal(probe.matched, Math.abs(probe.error) <= probe.tolerance);
  }
  assert.equal(state.optics.matched, state.optics.probes.every(probe => probe.matched));
}

function verifySubmission(view) {
  const { before, after } = view, receipt = after.submissions.at(-1);
  assert.equal(after.submissions.length, before.submissions.length + 1);
  assert.deepEqual(after.submissions.slice(0, -1), before.submissions);
  assert.equal(receipt.index, before.submissions.length);
  assert.equal(receipt.call, after.calls);
  assert.equal(receipt.elapsed, after.elapsed);
  assert.equal(receipt.selected, after.selected);
  assert.deepEqual(receipt.layers, after.layers);
  assert.deepEqual(receipt.probes, after.optics.probes);
  assert.equal(receipt.matched, after.optics.matched);
  assert.equal(receipt.failuresBefore, before.failures);
  assert.equal(receipt.failuresAfter, after.failures);
  assert.equal(receipt.remaining, 4 - after.failures);
  assert.equal(receipt.phase, after.phase);
  assert.equal(receipt.reason, after.reason);
  assert.equal(after.failures, after.submissions.filter(item => !item.matched).length);
  assert.equal(after.score, after.phase === 'won' ? 100 : 0);
}

// SYNTHETIC MATH ONLY. An in-memory seam checks unreachable exact tolerance
// boundaries. Production source/exports stay unchanged; no run uses this seam.
let synthetic;
function syntheticMath() {
  if (synthetic) return synthetic;
  const needle = '  // SYNTHETIC_MATH_TEST_SEAM: production exports only the five documented API members.';
  assert.equal(source.split(needle).length - 1, 1);
  const context = {};
  vm.createContext(context);
  vm.runInContext(source.replace(needle,
    '  globalThis.__syntheticMoireMath = Object.freeze({ probeReading, centerWrap });\n' + needle),
  context, { filename: 'synthetic-moire-math-only.js' });
  assert.deepEqual(Object.keys(context.PureModel).sort(), ['config', 'create', 'sampleAt', 'step', 'transmission']);
  assert.equal(fs.readFileSync(modelPath, 'utf8'), source);
  synthetic = context.__syntheticMoireMath;
  return synthetic;
}

test('CommonJS/browser expose exactly the documented API and deeply frozen public configuration', () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context, { filename: modelPath });
  const keys = ['config', 'create', 'sampleAt', 'step', 'transmission'];
  assert.deepEqual(Object.keys(model).sort(), keys);
  assert.deepEqual(Object.keys(context.PureModel).sort(), keys);
  assert.deepEqual(clone(context.PureModel.create(744, 2)), model.create(744, 2));
  assert.equal(Object.isFrozen(model), true);
  function frozen(value) {
    if (!value || typeof value !== 'object') return;
    assert.equal(Object.isFrozen(value), true);
    Object.values(value).forEach(frozen);
  }
  frozen(model.config);
  assert.throws(() => { model.config.tasks[0].initialLayers[0].phaseTick = 0; }, TypeError);
  assert.deepEqual(Object.keys(model.config).sort(), ['angleBounds', 'angleStepDegrees', 'attemptLimit', 'board',
    'defaultSeed', 'frequencies', 'guideTolerance', 'maxCounter', 'phaseSteps', 'probeTolerance', 'sampleBounds',
    'tasks', 'timeLimit']);
  assert.equal(JSON.stringify(model.config).includes('solution'), false);
});

test('creation normalizes without coercion and initializes the full fresh release-gated round', () => {
  for (const invalid of [undefined, null, '1', true, 0.5, NaN, Infinity, -1, 4294967296]) {
    assert.equal(model.create(invalid, '2').seed, 744);
    assert.equal(model.create(invalid, '2').level, 0);
  }
  for (const seed of [0, 744, 4294967295]) assert.equal(model.create(seed, 2).seed, seed);
  for (const level of [-1, 3, 0.5, null, undefined, NaN]) assert.equal(model.create(1, level).level, 0);
  const state = model.create();
  assert.deepEqual([state.schema, state.phase, state.reason, state.score, state.selected], [1, 'playing', '', 0, 0]);
  assert.deepEqual([state.elapsed, state.failures, state.calls, state.adjustments, state.switches, state.blockedTurns],
    [0, 0, 0, 0, 0, 0]);
  assert.deepEqual([state.inputArmed, state.cancelEpoch, state.cancelledLast, state.counterSaturated],
    [false, null, false, false]);
  assert.deepEqual(state.lastHeld, { a: false, b: false, direction: 'none' });
  assert.equal(state.terminalReceipt, null);
  assert.deepEqual(state.submissions, []);
  assert.deepEqual(state.events, []);
  assert.equal(state.lastCommand, 'none');
  assert.equal(state.message, '左右滑纹，上下旋转；B 切换膜，A 同时验收五个测点。');
});

test('three authored tables and their central analytic measurements make all starts invalid', () => {
  assert.deepEqual(model.config.frequencies, [24, 25]);
  assert.deepEqual(model.config.tasks.map(task => [task.id, task.name, task.nameZh]), [
    ['parallel-light', 'PARALLEL LIGHT', '平行光纹'], ['crossed-silk', 'CROSSED SILK', '交织细幕'],
    ['oblique-study', 'OBLIQUE STUDY', '斜光习作']
  ]);
  assert.deepEqual(model.config.tasks.map(task => task.initialLayers.map(layer => [layer.phaseTick, layer.angleTick])),
    [[[6, -2], [18, 2]], [[2, -1], [22, 1]], [[12, -2], [10, 2]]]);
  const expectedStart = [0.25, ((1 + Math.cos(Math.PI / 6)) / 2) ** 2, 0];
  const expectedTarget = [1, ((1 + Math.cos(Math.PI / 4)) / 2) * 0.75, 0.125];
  for (let level = 0; level < 3; level += 1) {
    const state = model.create(744, level), center = state.optics.probes[0];
    assert.deepEqual(state.optics.probes.map(probe => probe.id), ['C', '1', '2', '3', '4']);
    close(center.sample.brightness, expectedStart[level]);
    close(center.targetBrightness, expectedTarget[level]);
    assert.equal(center.matched, false);
    assert.equal(state.optics.matched, false);
    verifyOptics(state);
  }
  const targets = model.config.tasks[0].probes.slice(1).map(probe => probe.targetBrightness);
  const analytic = [(1 - Math.SQRT1_2) / 2, (1 + Math.cos(25 * Math.PI / 48)) / 4,
    0, (1 + Math.cos(5 * Math.PI / 12)) / 2];
  targets.forEach((value, index) => close(value, analytic[index]));
  assert.equal(new Set(model.config.tasks[0].probes.map(probe => probe.targetBrightness)).size, 5);
});

test('immutable targets are local measurements from public pin/tangent geometry', () => {
  for (const task of model.config.tasks) {
    assert.deepEqual(Object.keys(task).sort(), ['guides', 'id', 'initialLayers', 'name', 'nameZh', 'probes']);
    for (const probe of task.probes) {
      const phases = task.guides.map((guide, index) => {
        const tangentAngle = Math.atan2(guide.end.y - guide.pin.y, guide.end.x - guide.pin.x);
        const normal = [Math.sin(tangentAngle), -Math.cos(tangentAngle)];
        const cycles = model.config.frequencies[index] * (normal[0] * (probe.position.x - guide.pin.x)
          + normal[1] * (probe.position.y - guide.pin.y));
        return cycles - Math.floor(cycles);
      });
      phases.forEach((phase, index) => {
        // Equivalent zero and one phases may differ across a floating seam.
        close(Math.cos(2 * Math.PI * phase), Math.cos(2 * Math.PI * probe.targetPhases[index]));
      });
      close(probe.targetBrightness, phases.reduce((product, phase) => product * (1 + Math.cos(2 * Math.PI * phase)) / 2, 1));
      assert.equal(probe.tolerance, 0.035);
    }
  }
});

test('transmission has exact crests/troughs, negative periodicity and whole-cycle continuity', () => {
  for (const cycle of [-2, -1, 0, 1, 2]) assert.equal(model.transmission(cycle), 1);
  for (const cycle of [-1.5, -0.5, 0.5, 1.5]) assert.equal(model.transmission(cycle), 0);
  close(model.transmission(-0.25), 0.5);
  for (const value of [-0.83, -0.125, 0.14, 0.625]) {
    for (const offset of [-24, -1, 0, 1, 24]) close(model.transmission(value + offset), model.transmission(value), 2e-14);
  }
  const epsilon = 1e-7;
  close(model.transmission(-epsilon), model.transmission(epsilon));
  close(model.transmission(1 - epsilon), model.transmission(1 + epsilon));
  assert.ok(model.transmission(-epsilon) > 0.999999999);
  assert.equal(model.transmission(Number.MAX_VALUE), 1);
  assert.equal(model.transmission(-Number.MAX_VALUE), 1);
});

test('public optical helpers reject invalid coordinates/cycles without coercion or state reads', () => {
  let coerced = 0;
  const object = { valueOf() { coerced += 1; return 0; } };
  for (const value of [undefined, null, true, '0', NaN, Infinity, -Infinity, object]) {
    assert.equal(model.transmission(value), null);
    assert.equal(model.sampleAt(null, value, 0), null);
    assert.equal(model.sampleAt(null, 0, value), null);
  }
  assert.equal(model.sampleAt(null, 1.000001, 0), null);
  assert.equal(model.sampleAt(null, 0, -1.000001), null);
  const state = model.create(), before = clone(state);
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) {
    const sample = model.sampleAt(state, x, y);
    assert.equal(sample.x, x); assert.equal(sample.y, y);
    assert.ok(sample.brightness >= 0 && sample.brightness <= 1);
  }
  assert.deepEqual(state, before);
  assert.equal(coerced, 0);
});

test('sampling multiplies two independent sinusoidal factors at the same rotated world point', () => {
  const state = model.create(744, 1), x = -0.217, y = 0.193;
  function check() {
    const sample = model.sampleAt(state, x, y);
    state.layers.forEach((layer, index) => {
      const angle = layer.angleTick * Math.PI / 60;
      const expectedCycle = [24, 25][index] * (x * Math.cos(angle) + y * Math.sin(angle)) + layer.phaseTick / 24;
      close(sample.cycles[index], expectedCycle);
      close(sample.transmissions[index], (1 + Math.cos(2 * Math.PI * (expectedCycle - Math.floor(expectedCycle)))) / 2);
    });
    assert.equal(sample.brightness, sample.transmissions[0] * sample.transmissions[1]);
    verifyOptics(state);
    return sample;
  }
  const first = check();
  command(state, { x: -1 });
  const second = check();
  assert.notEqual(second.transmissions[0], first.transmissions[0]);
  assert.equal(second.transmissions[1], first.transmissions[1]);
  command(state, { b: true });
  command(state, { y: 1 });
  const third = check();
  assert.equal(third.transmissions[0], second.transmissions[0]);
  assert.notEqual(third.transmissions[1], second.transmissions[1]);
  assert.notEqual(third.brightness, second.brightness);
});

test('left/right translate stripe crests physically left/right along their world normal', () => {
  const state = model.create(), x = 0.13, y = -0.21;
  const normal = state.optics.layers[0].normal, pitchStep = 1 / (24 * 24);
  const first = model.sampleAt(state, x, y);
  command(state, { x: -1 });
  assert.equal(state.layers[0].phaseTick, 7);
  close(model.sampleAt(state, x - normal.x * pitchStep, y - normal.y * pitchStep).transmissions[0],
    first.transmissions[0]);
  command(state, { x: 1 });
  assert.equal(state.layers[0].phaseTick, 6);
  assert.deepEqual(model.sampleAt(state, x, y), first);
  assert.deepEqual(state.events, [{ type: 'adjust', layer: 0, axis: 'phase', from: 7, to: 6, call: state.calls }]);
});

test('24 physical phase steps return exactly to the same samples across 23/0', () => {
  const state = model.create(), initial = clone(state.layers);
  const initialSample = model.sampleAt(state, -0.31, 0.24);
  let sawWrap = false;
  for (let count = 0; count < 24; count += 1) {
    const previous = state.layers[0].phaseTick;
    command(state, { x: -1 });
    if (previous === 23) { assert.equal(state.layers[0].phaseTick, 0); sawWrap = true; }
    verifyOptics(state);
  }
  assert.equal(sawWrap, true);
  assert.deepEqual(state.layers, initial);
  assert.deepEqual(model.sampleAt(state, -0.31, 0.24), initialSample);
  assert.equal(state.adjustments, 24);
  assert.equal(state.phase, 'playing');
});

test('rotation uses a common origin/sign, tangent, and free bounded stops on both sides', () => {
  const state = model.create();
  command(state, { y: -1 });
  command(state, { y: -1 });
  assert.equal(state.layers[0].angleTick, -4);
  const layers = state.layers, optics = state.optics;
  command(state, { y: -1 });
  assert.equal(state.layers, layers); assert.equal(state.optics, optics);
  assert.equal(state.blockedTurns, 1); assert.equal(state.adjustments, 2);
  assert.deepEqual(state.events, [{ type: 'blocked', layer: 0, axis: 'angle', requested: -1, call: state.calls }]);
  for (let count = 0; count < 8; count += 1) command(state, { y: 1 });
  assert.equal(state.layers[0].angleTick, 4);
  const optical = state.optics.layers[0];
  close(optical.angleRadians, Math.PI / 15);
  assert.equal(optical.angleDegrees, 12);
  close(optical.normal.x, Math.cos(Math.PI / 15));
  close(optical.normal.y, Math.sin(Math.PI / 15));
  assert.deepEqual(optical.tangent, { x: -optical.normal.y, y: optical.normal.x });
  command(state, { y: 1 });
  assert.equal(state.blockedTurns, 2); assert.equal(state.adjustments, 10);
  assert.equal(state.failures, 0);
});

test('public signed guides use reference geometry and the half-cycle tie chooses physical Left', () => {
  const state = model.create(744, 2), guide = state.optics.layers[0].guide;
  close(guide.turnErrorDegrees, -12);
  const task = model.config.tasks[2];
  assert.deepEqual(guide.pin, task.guides[0].pin);
  assert.deepEqual(guide.end, task.guides[0].end);
  assert.notEqual(guide.pin, task.guides[0].pin);
  assert.equal(guide.phaseErrorTicks, 24 * guide.phaseError);
  assert.equal(guide.turnAligned, false);
  const math = syntheticMath();
  assert.equal(math.centerWrap(0.5), -0.5);
  assert.equal(math.centerWrap(-0.5), -0.5);
  assert.equal(math.centerWrap(1), 0);
  const plain = model.create();
  for (let count = 0; count < 6; count += 1) command(plain, { x: -1 });
  assert.equal(plain.optics.layers[0].guide.phaseError, -0.5);
  command(plain, { x: -1 });
  assert.ok(plain.optics.layers[0].guide.phaseError > -0.5);
});

test('synthetic optical boundary: inclusive tolerance, either error sign, and no added epsilon', () => {
  const read = syntheticMath().probeReading;
  const probe = { id: 'synthetic', position: { x: 0, y: 0 }, targetPhases: [0, 0], targetBrightness: 0, tolerance: 0.035 };
  const sample = brightness => ({ x: 0, y: 0, cycles: [0, 0], phases: [0, 0], transmissions: [brightness, 1], brightness });
  assert.equal(read(probe, sample(0.035)).matched, true);
  assert.equal(read({ ...probe, targetBrightness: 0.035 }, sample(0)).matched, true);
  assert.equal(read(probe, sample(0.035 + Number.EPSILON)).matched, false);
  assert.equal(read({ ...probe, targetBrightness: 0.035 + Number.EPSILON }, sample(0)).matched, false);
});

test('optical caches, public samples, canonical controls, config and separate rounds are detached', () => {
  const state = model.create(744, 1), other = model.create(744, 1), saved = clone(other);
  assert.notEqual(state.layers, model.config.tasks[1].initialLayers);
  assert.notEqual(state.layers[0], model.config.tasks[1].initialLayers[0]);
  assert.notEqual(state.optics.layers[0].normal, state.optics.layers[0].guide.referenceNormal);
  assert.notEqual(state.optics.probes[0].position, model.config.tasks[1].probes[0].position);
  assert.notEqual(state.optics.probes[0].targetPhases, model.config.tasks[1].probes[0].targetPhases);
  const first = model.sampleAt(state, 0, 0), second = model.sampleAt(state, 0, 0);
  assert.notEqual(first, second); assert.notEqual(first.cycles, second.cycles);
  first.transmissions[0] = 999;
  assert.deepEqual(model.sampleAt(state, 0, 0), second);
  const oldLayers = state.layers, oldOptics = state.optics;
  const savedLayers = clone(oldLayers), savedOptics = clone(oldOptics);
  command(state, { x: -1 });
  assert.deepEqual(oldLayers, savedLayers); assert.deepEqual(oldOptics, savedOptics);
  assert.deepEqual(other, saved);
});

test('sampler and actual submission ignore deliberately corrupted synthetic optical caches', () => {
  const state = model.create(), expected = model.sampleAt(state, 0, 0);
  // Synthetic cache corruption; canonical controls remain at their actual start.
  state.optics.matched = true;
  state.optics.layers[0].normal = { x: 0, y: 1 };
  state.optics.probes.forEach(probe => { probe.matched = true; probe.sample.brightness = 1; });
  assert.deepEqual(model.sampleAt(state, 0, 0), expected);
  const stale = state.optics;
  command(state, { b: true });
  assert.equal(state.optics, stale);
  assert.equal(state.phase, 'playing');
  verifySubmission(command(state, { a: true }));
  assert.notEqual(state.optics, stale);
  assert.equal(state.failures, 1);
  assert.equal(state.phase, 'playing');
  verifyOptics(state);
});

test('actual visible-guide policy reaches a simultaneous match on all three public tasks', () => {
  for (let level = 0; level < 3; level += 1) {
    const state = guidePose(model.create(744, level));
    assert.ok(state.adjustments <= 20);
    assert.equal(state.submissions.length, 0);
    assert.equal(state.phase, 'playing');
    assert.equal(state.score, 0);
    verifyOptics(state);
    verifySubmission(command(state, { a: true }));
    assert.equal(state.phase, 'won');
    assert.equal(state.score, 100);
    assert.equal(state.failures, 0);
    assert.equal(state.terminalReceipt.cause, 'success');
    assert.deepEqual(state.events, [{ type: 'win', call: state.calls }]);
  }
});

test('previous passing probes are not banked when a later arrangement fails simultaneous submission', () => {
  const state = guidePose(model.create());
  assert.ok(state.optics.probes.every(probe => probe.matched));
  const acceptedLooking = clone(state.optics.probes);
  for (let count = 0; count < 6; count += 1) command(state, { x: -1 });
  assert.equal(state.optics.matched, false);
  assert.ok(state.optics.probes.some((probe, index) => acceptedLooking[index].matched && !probe.matched));
  verifySubmission(command(state, { a: true }));
  assert.equal(state.phase, 'playing');
  assert.equal(state.failures, 1);
  assert.equal(state.submissions[0].matched, false);
  assert.equal(state.events[0].matchedCount, state.optics.probes.filter(probe => probe.matched).length);
});

test('four actual rejected submissions at each untouched public start cause an exact bounded loss', () => {
  for (let level = 0; level < 3; level += 1) {
    const state = model.create(744, level), initial = clone(state.layers);
    for (let count = 0; count < 4; count += 1) {
      verifySubmission(command(state, { a: true }));
      assert.equal(state.failures, count + 1);
      assert.equal(state.phase, count === 3 ? 'lost' : 'playing');
    }
    assert.deepEqual(state.layers, initial);
    assert.equal(state.reason, 'attempts'); assert.equal(state.score, 0);
    assert.equal(state.submissions.length, 4);
    assert.equal(state.terminalReceipt.cause, 'attempts');
    assert.equal(state.terminalReceipt.remaining, 0);
    assert.deepEqual(state.events, [{ type: 'collision', reason: 'attempts', call: state.calls }]);
  }
});

test('correct fourth submission wins with three preserved failures and one remaining error allowance', () => {
  const state = model.create(744, 1);
  for (let count = 0; count < 3; count += 1) verifySubmission(command(state, { a: true }));
  guidePose(state);
  verifySubmission(command(state, { a: true }));
  assert.equal(state.phase, 'won'); assert.equal(state.failures, 3);
  assert.equal(state.submissions.length, 4);
  assert.equal(state.submissions.at(-1).remaining, 1);
  assert.equal(state.submissions.filter(receipt => receipt.matched).length, 1);
});

test('submission and terminal snapshots are independent and later operations preserve earlier receipts', () => {
  const state = model.create();
  command(state, { a: true });
  const receipt = state.submissions[0], saved = clone(receipt);
  assert.notEqual(receipt.layers, state.layers);
  assert.notEqual(receipt.layers[0], state.layers[0]);
  assert.notEqual(receipt.probes, state.optics.probes);
  assert.notEqual(receipt.probes[0].sample.cycles, state.optics.probes[0].sample.cycles);
  guidePose(state);
  command(state, { a: true });
  assert.equal(state.submissions[0], receipt);
  assert.deepEqual(receipt, saved);
  const final = state.submissions.at(-1), terminal = state.terminalReceipt;
  assert.notEqual(terminal.layers, final.layers);
  assert.notEqual(terminal.probes, final.probes);
  assert.notEqual(terminal.probes[0].position, final.probes[0].position);
  assert.notEqual(terminal.probes[0].sample.transmissions, final.probes[0].sample.transmissions);
  assert.deepEqual(terminal.layers, final.layers);
  assert.deepEqual(terminal.probes, final.probes);
  const before = clone(state);
  model.sampleAt(state, 0.3, -0.2);
  model.transmission(-0.1);
  assert.deepEqual(state, before);
});

test('B switches without optical/budget changes and consumes simultaneous A/direction edges', () => {
  const state = model.create(), layers = state.layers, optics = state.optics;
  command(state, { a: true, b: true, x: -1 });
  assert.equal(state.selected, 1); assert.equal(state.lastCommand, 'b');
  assert.equal(state.switches, 1); assert.equal(state.adjustments, 0); assert.equal(state.failures, 0);
  assert.equal(state.layers, layers); assert.equal(state.optics, optics);
  assert.deepEqual(state.events, [{ type: 'switch', selected: 1, call: state.calls }]);
  model.step(state, dt, { a: true, x: -1 });
  model.step(state, dt, { x: -1 });
  assert.equal(state.adjustments, 0); assert.equal(state.submissions.length, 0);
  command(state, { x: -1 });
  assert.equal(state.layers[1].phaseTick, 19);
  command(state, { b: true });
  assert.equal(state.selected, 0);
});

test('A consumes a simultaneous direction, holding A permits fresh directions but never resubmits', () => {
  const state = model.create();
  command(state, { a: true, y: -1 });
  assert.equal(state.failures, 1); assert.equal(state.adjustments, 0);
  model.step(state, dt, { a: true, y: -1 });
  model.step(state, dt, { y: -1 });
  assert.equal(state.adjustments, 0); assert.equal(state.failures, 1);
  command(state, { a: true });
  model.step(state, dt, { a: true, y: 1 });
  model.step(state, dt, { a: true, x: 1 });
  assert.equal(state.failures, 2); assert.equal(state.adjustments, 2);
  assert.equal(state.submissions.length, 2);
});

test('strict threshold, clamp, vertical tie, held tokens and direct nonneutral changes are deterministic', () => {
  const state = model.create();
  command(state, { x: 0.5, y: -0.5 });
  assert.equal(state.lastHeld.direction, 'none'); assert.equal(state.adjustments, 0);
  model.step(state, dt, { x: 1, y: 1 });
  assert.equal(state.lastCommand, 'down'); assert.equal(state.layers[0].angleTick, -1);
  model.step(state, dt, { x: 0.6, y: 0.9 });
  assert.equal(state.adjustments, 1);
  model.step(state, dt, { x: 0.9, y: 0.6 });
  assert.equal(state.lastCommand, 'right'); assert.equal(state.layers[0].phaseTick, 5);
  model.step(state, dt, { x: -10, y: -1 });
  assert.equal(state.lastCommand, 'up'); assert.equal(state.layers[0].angleTick, -2);
  model.step(state, dt, { x: 0, y: -0.7 });
  assert.equal(state.adjustments, 3);
  command(state, { y: -1 });
  assert.equal(state.adjustments, 4);
});

test('fresh/retried held inputs remain inert until a later genuine neutral sample', () => {
  const state = model.create();
  model.step(state, dt, { a: true, b: true, x: -1 });
  model.step(state, dt, { a: true });
  assert.equal(state.inputArmed, false); assert.equal(state.switches, 0); assert.equal(state.failures, 0);
  model.step(state, dt, undefined);
  assert.equal(state.inputArmed, true);
  model.step(state, dt, { b: true });
  assert.equal(state.selected, 1);
  assert.equal(model.create(state.seed, state.level).inputArmed, false);
});

test('epoch baseline/change and cancelled neutral enforce quarantine without stopping active time', () => {
  const state = model.create();
  model.step(state, dt, {});
  model.step(state, dt, { cancelEpoch: 5, b: true });
  assert.equal(state.selected, 1);
  model.step(state, dt, { cancelEpoch: 6, b: true, x: -1 });
  assert.equal(state.inputArmed, false);
  model.step(state, dt, { cancelEpoch: 6, b: true });
  assert.equal(state.switches, 1);
  model.step(state, dt, { cancelEpoch: 6 });
  assert.equal(state.inputArmed, true);
  model.step(state, dt, { cancelEpoch: 6, b: true });
  assert.equal(state.selected, 0);
  for (let repeat = 0; repeat < 3; repeat += 1) model.step(state, dt, { cancelled: true });
  assert.equal(state.inputArmed, false);
  assert.equal(state.elapsed, state.calls * dt);
  model.step(state, dt, { a: true });
  assert.equal(state.failures, 0);
  model.step(state, dt, {});
  model.step(state, dt, { a: true });
  assert.equal(state.failures, 1);
});

test('only nonnegative safe epochs are stored and a changed neutral epoch arms the following edge', () => {
  const state = model.create();
  model.step(state, dt, { cancelEpoch: 0 });
  for (const cancelEpoch of [-1, 0.5, Infinity, NaN, '2', true, Number.MAX_SAFE_INTEGER + 1]) {
    model.step(state, dt, { cancelEpoch });
    assert.equal(state.cancelEpoch, 0);
  }
  model.step(state, dt, { cancelEpoch: Number.MAX_SAFE_INTEGER });
  assert.equal(state.inputArmed, true);
  assert.equal(state.cancelEpoch, Number.MAX_SAFE_INTEGER);
  model.step(state, dt, { b: true });
  assert.equal(state.selected, 1);
});

test('invalid duration is an exact no-op before descriptors or coercion', () => {
  const state = model.create();
  command(state, { x: -1 });
  let reads = 0, coerced = 0;
  const input = new Proxy({}, { getOwnPropertyDescriptor() { reads += 1; throw Error('must not read'); } });
  const odd = { valueOf() { coerced += 1; return 0.1; } };
  const before = clone(state), references = [state.layers, state.optics, state.events, state.lastHeld];
  for (const duration of [undefined, null, true, '0.1', 0, -1, 0.250001, Infinity, NaN, odd]) {
    assert.equal(model.step(state, duration, input), state);
    assert.deepEqual(state, before);
  }
  assert.equal(reads, 0); assert.equal(coerced, 0);
  [state.layers, state.optics, state.events, state.lastHeld].forEach((value, index) => assert.equal(value, references[index]));
});

test('paused literal true normalizes every descriptor then preserves the entire round including deadline', () => {
  const state = model.create();
  command(state, { b: true });
  // Synthetic clock boundary to distinguish pause from deadline admission.
  state.elapsed = 89.875;
  const before = clone(state), seen = [], held = state.lastHeld, events = state.events;
  const input = new Proxy({ paused: true, cancelled: true, a: true, cancelEpoch: 99 }, {
    getOwnPropertyDescriptor(target, key) { seen.push(key); return Reflect.getOwnPropertyDescriptor(target, key); }
  });
  model.step(state, 0.25, input);
  assert.deepEqual(state, before); assert.equal(state.lastHeld, held); assert.equal(state.events, events);
  assert.deepEqual(seen, ['x', 'y', 'a', 'b', 'cancelEpoch', 'cancelled', 'paused']);
});

test('normalization ignores accessors/inherited/pulse values and accepts only literal typed own data', () => {
  const state = model.create();
  let getters = 0;
  const input = Object.create({ a: true, b: true, x: -1, cancelled: true });
  Object.defineProperty(input, 'a', { get() { getters += 1; throw Error('getter'); } });
  Object.assign(input, { b: 1, x: '-1', y: Infinity, cancelEpoch: '1', cancelled: 1, paused: 'true',
    aPressed: true, bPressed: true, start: true, select: true, direction: 'left' });
  model.step(state, dt, input);
  assert.equal(getters, 0); assert.equal(state.inputArmed, true);
  assert.equal(state.adjustments, 0); assert.equal(state.failures, 0); assert.equal(state.switches, 0);
  assert.equal(state.cancelEpoch, null);
  const frozen = Object.freeze({ b: true });
  model.step(state, dt, frozen);
  assert.equal(state.selected, 1);
  assert.deepEqual(frozen, { b: true });
});

test('prototype data/accessor pollution cannot enter temporary normalization storage', () => {
  let inheritedReads = 0;
  const originals = ['a', 'x'].map(key => [key, Object.getOwnPropertyDescriptor(Object.prototype, key)]);
  const accessor = { configurable: true, get() { inheritedReads += 1; return true; } };
  for (const pollution of [
    { a: accessor, x: { configurable: true, writable: true, value: -1 } },
    { a: { configurable: true, writable: true, value: true }, x: accessor }
  ]) {
    const state = model.create();
    model.step(state, dt, {});
    try {
      Object.defineProperties(Object.prototype, pollution);
      model.step(state, dt, Object.create(null));
    } finally {
      for (const [key, descriptor] of originals) {
        if (descriptor) Object.defineProperty(Object.prototype, key, descriptor);
        else delete Object.prototype[key];
      }
    }
    // Assertions run after restoring the global prototype completely.
    assert.equal(inheritedReads, 0);
    assert.equal(state.calls, 2); assert.equal(state.adjustments, 0); assert.equal(state.failures, 0);
    assert.deepEqual(state.lastHeld, { a: false, b: false, direction: 'none' });
  }
});

test('inherited coordinate accessors cannot intercept detached rejection or timeout receipt copying', () => {
  const original = Object.getOwnPropertyDescriptor(Object.prototype, 'x');
  let reads = 0;
  for (const timeout of [false, true]) {
    const state = model.create();
    model.step(state, dt, {});
    if (timeout) state.elapsed = 89.875; // Synthetic timer boundary only.
    try {
      Object.defineProperty(Object.prototype, 'x', { configurable: true, get() { reads += 1; return 999; } });
      model.step(state, dt, { a: true });
    } finally {
      if (original) Object.defineProperty(Object.prototype, 'x', original);
      else delete Object.prototype.x;
    }
    assert.equal(reads, 0);
    assert.equal(state.phase, timeout ? 'lost' : 'playing');
    assert.equal(state.submissions.length, timeout ? 0 : 1);
    const probes = timeout ? state.terminalReceipt.probes : state.submissions[0].probes;
    assert.deepEqual(probes, state.optics.probes);
    assert.equal(Object.prototype.hasOwnProperty.call(probes[0].sample, 'x'), true);
    assert.notEqual(probes[0].sample, state.optics.probes[0].sample);
  }
});

test('arrays/functions/primitives become neutral and throwing descriptors discard all partial values atomically', () => {
  const callable = Object.assign(function () {}, { a: true, x: -1 });
  for (const input of [Object.assign([], { a: true, x: -1 }), callable, null, true, 1, 'left']) {
    const state = model.create();
    model.step(state, dt, input);
    assert.equal(state.inputArmed, true); assert.equal(state.calls, 1);
    assert.equal(state.adjustments, 0); assert.equal(state.failures, 0);
  }
  const state = model.create(), seen = [];
  const proxy = new Proxy({ x: -1, a: true, b: true, cancelEpoch: 8, cancelled: true, paused: true }, {
    getOwnPropertyDescriptor(target, key) {
      seen.push(key);
      if (key === 'paused') throw Error('last descriptor');
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  model.step(state, dt, proxy);
  assert.deepEqual(seen, ['x', 'y', 'a', 'b', 'cancelEpoch', 'cancelled', 'paused']);
  assert.equal(state.calls, 1); assert.equal(state.inputArmed, true);
  assert.equal(state.cancelEpoch, null); assert.equal(state.cancelledLast, false);
  assert.deepEqual(state.lastHeld, { a: false, b: false, direction: 'none' });
  const revoked = Proxy.revocable({}, {}); revoked.revoke();
  model.step(state, dt, revoked.proxy);
  assert.equal(state.calls, 2); assert.equal(state.adjustments, 0); assert.equal(state.failures, 0);
});

test('accepted durations add once without accumulation/repeat, including tiny rounded additions', () => {
  const state = model.create();
  model.step(state, 0.25, {});
  model.step(state, 0.25, { x: -1 });
  model.step(state, 0.125, { x: -1 });
  assert.equal(state.elapsed, 0.625); assert.equal(state.calls, 3); assert.equal(state.adjustments, 1);
  model.step(state, Number.MIN_VALUE, {});
  model.step(state, Number.MIN_VALUE, { x: -1 });
  assert.equal(state.elapsed, 0.625); assert.equal(state.calls, 5); assert.equal(state.adjustments, 2);
});

test('an actual untouched round times out after 360 admitted quarter-second calls', () => {
  const state = model.create(744, 2), initial = clone(state.layers);
  for (let count = 0; count < 360; count += 1) model.step(state, 0.25, {});
  assert.equal(state.phase, 'lost'); assert.equal(state.reason, 'time'); assert.equal(state.elapsed, 90);
  assert.equal(state.calls, 360); assert.equal(state.failures, 0); assert.equal(state.submissions.length, 0);
  assert.deepEqual(state.layers, initial); assert.equal(state.terminalReceipt.cause, 'time');
  assert.equal(state.terminalReceipt.elapsed, 90); assert.equal(state.terminalReceipt.remaining, 4);
  verifyOptics(state);
});

test('synthetic deadline ties/overshoots precede A/B/direction and preserve every gate field', () => {
  for (const input of [{ a: true }, { b: true }, { x: -1 },
    { a: true, b: true, x: -1, cancelled: true, cancelEpoch: 99 }]) {
    for (const duration of [0.125, 0.25]) {
      const state = guidePose(model.create());
      model.step(state, dt, { cancelEpoch: 5 });
      state.elapsed = 89.875; // Synthetic only; ordinary timeout is tested separately.
      const before = clone(state), layers = state.layers, held = state.lastHeld, receipts = state.submissions;
      const optics = state.optics;
      model.step(state, duration, input);
      assert.equal(state.phase, 'lost'); assert.equal(state.reason, 'time'); assert.equal(state.elapsed, 90);
      assert.equal(state.calls, before.calls + 1); assert.equal(state.lastCommand, 'none');
      assert.equal(state.layers, layers); assert.equal(state.lastHeld, held); assert.equal(state.submissions, receipts);
      assert.equal(state.selected, before.selected); assert.equal(state.failures, before.failures);
      for (const key of ['inputArmed', 'cancelEpoch', 'cancelledLast', 'adjustments', 'switches', 'blockedTurns']) {
        assert.equal(state[key], before[key]);
      }
      assert.notEqual(state.optics, optics); assert.equal(state.optics.matched, true);
      assert.deepEqual(state.events, [{ type: 'collision', reason: 'time', call: state.calls }]);
      assert.equal(state.terminalReceipt.matched, true);
      assert.equal(state.submissions.length, 0);
    }
  }
});

test('synthetic accepted submission just before deadline wins while cancellation can still time out', () => {
  const state = guidePose(model.create());
  model.step(state, dt, {});
  state.elapsed = 89.75;
  model.step(state, 0.125, { a: true });
  assert.equal(state.phase, 'won'); assert.equal(state.elapsed, 89.875);
  assert.equal(state.terminalReceipt.cause, 'success');
  const cancelled = model.create();
  cancelled.elapsed = 89.875;
  model.step(cancelled, 0.25, { cancelled: true });
  assert.equal(cancelled.phase, 'lost'); assert.equal(cancelled.reason, 'time');
  assert.equal(cancelled.elapsed, 90); assert.equal(cancelled.cancelledLast, false);
});

test('terminal won/attempts/time states are exact no-ops before duration/input reads', () => {
  const timeout = model.create();
  for (let call = 0; call < 360; call += 1) model.step(timeout, 0.25, {});
  let reads = 0;
  const input = new Proxy({}, { getOwnPropertyDescriptor() { reads += 1; throw Error('terminal read'); } });
  for (const state of [win(), rejectionLoss(), timeout]) {
    const before = clone(state), refs = [state.layers, state.optics, state.events, state.lastHeld, state.terminalReceipt];
    model.step(state, { valueOf() { throw Error('terminal coercion'); } }, input);
    model.step(state, dt, input);
    assert.deepEqual(state, before);
    [state.layers, state.optics, state.events, state.lastHeld, state.terminalReceipt]
      .forEach((value, index) => assert.equal(value, refs[index]));
  }
  assert.equal(reads, 0);
});

test('synthetic saturating counters flag only attempted overflow and retain sticky status', () => {
  for (const [key, input] of [['calls', {}], ['adjustments', { x: -1 }], ['switches', { b: true }],
    ['blockedTurns', { y: -1 }]]) {
    const state = model.create();
    if (key === 'blockedTurns') { command(state, { y: -1 }); command(state, { y: -1 }); }
    model.step(state, dt, {});
    state[key] = model.config.maxCounter - 1; // Synthetic counters, not an ordinary run.
    model.step(state, dt, input);
    assert.equal(state[key], model.config.maxCounter); assert.equal(state.counterSaturated, false);
    model.step(state, dt, {});
    model.step(state, dt, input);
    assert.equal(state[key], model.config.maxCounter); assert.equal(state.counterSaturated, true);
    model.step(state, dt, {});
    assert.equal(state.counterSaturated, true);
    assert.equal(state.phase, 'playing');
  }
});

test('retry recreates every original field after both success and failure', () => {
  for (let level = 0; level < 3; level += 1) {
    const initial = model.create(744, level);
    for (const ended of [win(level), rejectionLoss(level)]) {
      const retry = model.create(ended.seed, ended.level);
      assert.deepEqual(retry, initial);
      assert.notEqual(retry.layers, initial.layers); assert.notEqual(retry.optics, initial.optics);
      assert.equal(retry.inputArmed, false); assert.equal(retry.elapsed, 0);
      assert.equal(retry.failures, 0); assert.equal(retry.submissions.length, 0);
    }
  }
});
