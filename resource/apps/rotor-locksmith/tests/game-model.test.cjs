'use strict';

// Static-authored contract tests. This file has not been executed while authored.
// Every fixture below is a FORMAL SYNTHETIC STATE, never a normal-play win.
// Only public create/step/snapshot and public state participate in these tests.
const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');

const DT = 1 / 60;
const COMPARISON_TOLERANCE = 1e-8;
const EXPECTED_SCENARIOS = [
  ['brass-triad', 36, [[180, 38, 90, 1], [126, 36, 210, -1], [72, 34, 300, 2]]],
  ['countergear-room', 42, [[184, 34, 225, 1], [128, 32, 60, 2], [68, 30, 150, -2]]],
  ['triple-core', 48, [[188, 30, 315, 1], [124, 28, 180, -2], [60, 26, 45, 3]]]
];

function close(actual, expected, label = 'number') {
  assert.equal(typeof actual, 'number', label);
  assert.ok(Number.isFinite(actual), `${label} must be finite`);
  assert.ok(Math.abs(actual - expected) <= COMPARISON_TOLERANCE,
    `${label}: ${actual} != ${expected}`);
}

function deeplyFrozen(value) {
  if (!value || typeof value !== 'object') return;
  assert.ok(Object.isFrozen(value));
  for (const child of Object.values(value)) deeplyFrozen(child);
}

function deeplySeparated(left, right) {
  if (!left || typeof left !== 'object') return;
  assert.notStrictEqual(left, right);
  for (const key of Object.keys(left)) deeplySeparated(left[key], right[key]);
}

function tick(state, input = {}, dt = DT) {
  assert.strictEqual(Model.step(state, dt, input), state);
  return state;
}

function ready(difficulty = 0) {
  const state = Model.create(738, difficulty);
  tick(state);
  assert.equal(state.lastInput.mode, 'neutral_ack');
  return state;
}

// Clone public create output, then set only the documented formal fixture fields.
// Derived rings and probeEnvelope intentionally remain stale until step refreshes
// them; a model must not depend on a hidden cache or a private fixture hook.
function fixture(difficulty, overrides = {}) {
  const original = Model.create(738, difficulty);
  const state = JSON.parse(JSON.stringify(original));
  for (const key of ['identity', 'physics', 'scenario']) state[key] = original[key];
  Object.assign(state, overrides);
  state.inputState = { cancelEpoch: 0, quarantined: false, impactLocked: false };
  state.elapsed = state.tick / 60;
  state.remainingTicks = 5400 - state.tick;
  state.remainingSeconds = state.remainingTicks / 60;
  state.resistance = 4 - state.durability;
  state.radialSpeed = 7.5 - 0.5 * state.resistance;
  state.mission = state.hasKey ? 'return' : 'approach';
  state.score = state.hasKey ? 100 : 0;
  return state;
}

function checkFor(state, id) {
  return state.lastStep.ringChecks.find((check) => check.id === id);
}

function noHit(state) {
  assert.equal(state.lastStep.hasCollision, false);
  assert.equal(state.lastStep.primaryRingId, null);
  assert.deepEqual(state.lastStep.tiedRingIds, []);
  assert.equal(state.lastContact, null);
  assert.ok(state.events.every((event) => event.type !== 'hit'));
}

function nextUp(value) {
  assert.ok(Number.isFinite(value) && value > 0);
  const bytes = new ArrayBuffer(8);
  const view = new DataView(bytes);
  view.setFloat64(0, value, false);
  view.setBigUint64(0, view.getBigUint64(0, false) + 1n, false);
  return view.getFloat64(0, false);
}

// An independent endpoint predicate, using the contract's strict inequalities.
// COMPARISON_TOLERANCE is deliberately absent: it is not a gameplay margin.
function safeEndpoint(state, q, radius, hasKey) {
  const p = hasKey ? 4 : 2;
  const a = hasKey ? 5 : 2;
  return state.scenario.rings.every((ring) => {
    const lower = ring.radius - 5 - p + 1e-9;
    const upper = ring.radius + 5 + p - 1e-9;
    if (!(lower < radius && radius < upper)) return true;
    const width = ring.gapHalfWidthDegrees - a + 1e-9;
    const angle = ring.initialAngleDegrees + ring.gearRatio * q;
    const component = Math.round(angle / 360);
    return 360 * component - width <= angle && angle <= 360 * component + width;
  });
}

function assertNearestSafeCommit(state) {
  const last = state.lastStep;
  const roots = last.ringChecks.map((check) => check.firstUnsafeFraction)
    .filter((fraction) => fraction !== null);
  const candidate = roots.length ? Math.min(...roots) : 1;
  const actual = last.motionFraction;
  assert.ok(actual >= 0 && actual <= candidate);
  assert.ok(candidate - actual <= 1e-8);
  assert.ok(safeEndpoint(state, state.driveAngleDegrees, state.probeRadius, last.hasKeyBefore));
  if (actual < candidate) {
    assert.ok(actual > 0, 'these numerical fixtures have a positive safe fraction');
    const successor = nextUp(actual);
    assert.ok(successor <= candidate);
    const q = last.driveAngleBefore + last.plannedOuterDeltaDegrees * successor;
    const dr = last.effective.radial * last.radialSpeedBefore / 60;
    const radius = Math.max(18, Math.min(210, last.probeRadiusBefore + dr * successor));
    assert.equal(safeEndpoint(state, q, radius, last.hasKeyBefore), false,
      'the next representable fraction must already be unsafe');
  }
}

test('create exposes the three fixed scenarios and deeply separate immutable parameters', () => {
  for (let difficulty = 0; difficulty < 3; difficulty += 1) {
    const state = Model.create(738, difficulty);
    const other = Model.create(739, difficulty);
    const [id, rate, rings] = EXPECTED_SCENARIOS[difficulty];
    assert.equal(state.scenarioId, id);
    assert.equal(state.scenario.outerRateDegreesPerSecond, rate);
    assert.equal(state.level, difficulty + 1);
    assert.equal(state.width, 960);
    assert.equal(state.height, 540);
    assert.equal(state.schemaVersion, 1);
    assert.equal(state.identity.gameId, 38);
    assert.equal(state.identity.slug, 'rotor-locksmith');
    assert.equal(state.identity.seed, 738);
    assert.equal(state.identity.actionCount, 2);
    assert.deepEqual(state.scenario, other.scenario);
    assert.deepEqual(state.scenario.rings.map((ring) => [ring.radius,
      ring.gapHalfWidthDegrees, ring.initialAngleDegrees, ring.gearRatio]), rings);
    assert.deepEqual(state.scenario.rings.map((ring) => ring.id), ['outer', 'middle', 'inner']);
    for (const field of ['identity', 'physics', 'scenario']) {
      deeplyFrozen(state[field]);
      deeplySeparated(state[field], other[field]);
    }
    assert.equal(state.physics.radialBoundaryMargin, 1e-9);
    assert.equal(state.physics.angularBoundaryMarginDegrees, 1e-9);
    assert.equal(state.physics.independentNumericComparisonTolerance, 1e-8);
    assert.equal(state.phase, 'playing');
    assert.equal(state.mission, 'approach');
    assert.equal(state.tick, 0);
    assert.equal(state.probeRadius, 210);
    assert.equal(state.driveAngleDegrees, 0);
    assert.equal(state.hasKey, false);
    assert.equal(state.durability, 4);
    assert.equal(state.resistance, 0);
    assert.equal(state.radialSpeed, 7.5);
    assert.equal(state.score, 0);
    assert.equal(state.remainingTicks, 5400);
    assert.equal(state.remainingSeconds, 90);
    assert.deepEqual(state.inputState, { cancelEpoch: null, quarantined: true, impactLocked: false });
    for (const field of ['events', 'contactReceipts', 'travelReceipts', 'lastTravelReceipts']) {
      assert.deepEqual(state[field], []);
    }
    for (const field of ['lastInput', 'lastStep', 'lastContact', 'terminal', 'lostReason']) {
      assert.equal(state[field], null);
    }
  }
  assert.equal(Model.create(-738.9, 1.9).seed, -738);
  assert.equal(Model.create(-738.9, 1.9).difficulty, 1);
  assert.equal(Model.create('738', Infinity).seed, 738);
  assert.equal(Model.create(NaN, Infinity).difficulty, 0);
  assert.equal(Model.create(738, -8).difficulty, 0);
  assert.equal(Model.create(738, 99).difficulty, 2);
});

test('one positive finite dt means one 60 Hz tick; invalid dt is a complete no-op', () => {
  const state = ready();
  for (const dt of [1e-12, 0.5, 1000]) {
    const beforeTick = state.tick;
    tick(state, { a: true }, dt);
    assert.equal(state.tick, beforeTick + 1);
    close(state.elapsed, state.tick / 60);
    close(state.remainingSeconds, (5400 - state.tick) / 60);
    assert.equal(state.remainingTicks, 5400 - state.tick);
  }
  assert.equal(state.probeRadius, 210 - 3 * 0.125);
  const snapshot = Model.snapshot(state);
  for (const dt of [0, -1, NaN, Infinity, -Infinity, '1', null, undefined]) {
    assert.strictEqual(Model.step(state, dt, { cancelled: true, cancelEpoch: 9, a: true }), state);
    assert.deepEqual(Model.snapshot(state), snapshot);
  }
});

test('initial quarantine requires valid full neutral and consumes its own tick', () => {
  const state = Model.create(738, 2);
  tick(state, { a: true, x: 1 });
  assert.equal(state.lastInput.mode, 'quarantine');
  assert.equal(state.lastInput.epochChanged, true);
  assert.deepEqual(state.lastInput.requested, { drive: 1, radial: -1, a: true, b: false });
  assert.deepEqual(state.lastInput.effective, { drive: 0, radial: 0, a: false, b: false });
  assert.equal(state.probeRadius, 210);
  assert.equal(state.driveAngleDegrees, 0);
  tick(state, { x: NaN });
  assert.equal(state.lastInput.axesValid, false);
  assert.equal(state.lastInput.fullNeutral, false);
  tick(state, { x: 0.35, y: -0.35 });
  assert.equal(state.lastInput.mode, 'neutral_ack');
  assert.equal(state.lastInput.neutralAcknowledged, true);
  assert.equal(state.inputState.quarantined, false);
  assert.equal(state.tick, 3);
  tick(state, { x: 0.55, a: true });
  assert.equal(state.lastInput.mode, 'active');
  close(state.driveAngleDegrees, 0.8);
  close(state.probeRadius, 209.875);
});

test('held and pressed A/B are continuous facts; both buttons brake only radius', () => {
  const state = fixture(2, { probeRadius: 100 });
  tick(state, { a: true });
  tick(state, { a: true });
  assert.equal(state.probeRadius, 99.75);
  tick(state);
  assert.equal(state.probeRadius, 99.75);
  tick(state, { aPressed: true });
  assert.equal(state.probeRadius, 99.625);
  tick(state);
  assert.equal(state.probeRadius, 99.625);
  tick(state, { bPressed: true });
  assert.equal(state.probeRadius, 99.75);
  tick(state, { b: true });
  assert.equal(state.probeRadius, 99.875);
  tick(state, { a: true, bPressed: true, x: 1 });
  assert.equal(state.probeRadius, 99.875);
  assert.deepEqual(state.lastInput.effective, { drive: 1, radial: 0, a: true, b: true });
  close(state.driveAngleDegrees, 0.8);
  tick(state, { a: 1, b: 'true', aPressed: {}, bPressed: [] });
  assert.equal(state.probeRadius, 99.875);
  assert.equal(state.lastInput.requested.a, false);
  assert.equal(state.lastInput.requested.b, false);
});

test('axes normalize independently of held radial controls; host buttons are not A aliases', () => {
  const state = fixture(2, { probeRadius: 100 });
  tick(state, { x: 2, y: -7, menuDelta: 8 });
  assert.equal(state.lastInput.x, 1);
  assert.equal(state.lastInput.y, -1);
  assert.equal(state.lastInput.menuDelta, 8);
  assert.equal(state.lastInput.raw.x, 2);
  assert.equal(state.lastInput.raw.y, -7);
  close(state.driveAngleDegrees, 0.8);
  for (const input of [{ x: '1', a: true }, { x: 1, y: Infinity, aPressed: true }]) {
    tick(state, input);
    assert.equal(state.lastInput.axesValid, false);
    assert.equal(state.lastInput.effective.drive, 0);
    assert.equal(state.lastInput.effective.radial, -1);
  }
  assert.equal(state.probeRadius, 99.75);
  close(state.driveAngleDegrees, 0.8);
  tick(state, { x: 0.54, y: 1, confirm: true, retry: true, start: true,
    select: true, startPressed: true, selectPressed: true, menuDelta: 1 });
  assert.deepEqual(state.lastInput.effective, { drive: 0, radial: 0, a: false, b: false });
  assert.equal(state.probeRadius, 99.75);
  tick(state, { x: -0.55 });
  close(state.driveAngleDegrees, 0);
  tick(state, { x: 0.55 });
  close(state.driveAngleDegrees, 0.8);
  tick(state, { x: -1 });
  close(state.driveAngleDegrees, 0);
});

test('cancel and epoch preserve mechanics; invalid or partial neutral cannot unlock', () => {
  const state = fixture(2, { probeRadius: 100, durability: 3, hasKey: true });
  tick(state, { x: 1, b: true, cancelEpoch: 7.9 });
  assert.equal(state.lastInput.cancelEpoch, 7);
  assert.equal(state.lastInput.mode, 'quarantine');
  assert.equal(state.probeRadius, 100);
  assert.equal(state.driveAngleDegrees, 0);
  for (const input of [{ cancelled: true }, { y: 1 }, { menuDelta: 1 },
    { x: '0' }, { menuDelta: NaN }, { retry: true }, { confirm: true }, { bPressed: true }]) {
    tick(state, { ...input, cancelEpoch: 7 });
    assert.equal(state.lastInput.fullNeutral, false);
    assert.equal(state.inputState.quarantined, true);
    assert.equal(state.probeRadius, 100);
    assert.equal(state.durability, 3);
    assert.equal(state.resistance, 1);
    assert.equal(state.hasKey, true);
  }
  tick(state, { cancelEpoch: 7 });
  assert.equal(state.lastInput.mode, 'neutral_ack');
  tick(state, { cancelEpoch: 7, b: true });
  close(state.probeRadius, 100 + 7 / 60);
  tick(state, { cancelEpoch: -4, a: true });
  assert.equal(state.lastInput.cancelEpoch, 0);
  assert.equal(state.lastInput.mode, 'quarantine');
  tick(state, { cancelEpoch: Infinity });
  assert.equal(state.lastInput.cancelEpoch, 0);
  assert.equal(state.lastInput.raw.cancelEpoch, null);
  assert.equal(state.lastInput.mode, 'neutral_ack');
});

test('endpoint docking is piecewise clamping while angle continues for the full tick', () => {
  const inward = fixture(2, { probeRadius: 18.03125 });
  tick(inward, { a: true, x: 1 });
  noHit(inward);
  assert.equal(inward.lastStep.rawTargetRadius, 17.90625);
  assert.equal(inward.lastStep.candidateRadius, 18);
  assert.equal(inward.probeRadius, 18);
  assert.equal(inward.lastStep.motionFraction, 1);
  close(inward.driveAngleDegrees, 0.8);
  const key = inward.lastTravelReceipts.find((receipt) => receipt.kind === 'key-acquired');
  assert.equal(key.fraction, 1);
  assert.equal(key.endpointReachedFraction, 0.25);
  close(key.driveAngleDegrees, 0.8);
  assert.equal(inward.phase, 'playing');
  assert.equal(inward.mission, 'return');
  assert.equal(inward.lastStep.envelopeBefore.radialHalfLength, 2);
  assert.equal(inward.lastStep.envelopeAfter.radialHalfLength, 4);
  assert.equal(inward.lastStep.envelopeAfter.angularHalfWidthDegrees, 5);
  assert.equal(inward.lastStep.envelopeAfter.innerRadius, 14);
  tick(inward, { a: true, x: 1 });
  assert.equal(inward.probeRadius, 18);
  close(inward.driveAngleDegrees, 1.6);
  assert.equal(inward.travelReceipts.filter((receipt) => receipt.kind === 'key-acquired').length, 1);
  assert.ok(inward.events.every((event) => event.type !== 'key' && event.type !== 'win'));

  const outward = fixture(2, { probeRadius: 209.96875, hasKey: true });
  tick(outward, { b: true, x: -1 });
  assert.equal(outward.phase, 'won');
  assert.equal(outward.probeRadius, 210);
  close(outward.driveAngleDegrees, -0.8);
  const exit = outward.lastTravelReceipts.find((receipt) => receipt.kind === 'key-extracted');
  assert.equal(exit.endpointReachedFraction, 0.25);
  assert.equal(exit.fraction, 1);
  assert.equal(outward.terminal.fraction, 1);
});

test('already docked endpoints have finite fraction zero; empty extraction never wins', () => {
  const core = fixture(1, { probeRadius: 18 });
  tick(core);
  assert.equal(core.hasKey, true);
  assert.equal(core.lastTravelReceipts[0].endpointReachedFraction, 0);
  assert.equal(core.lastTravelReceipts[0].fraction, 1);
  const empty = fixture(1, { probeRadius: 210 });
  tick(empty, { b: true });
  assert.equal(empty.phase, 'playing');
  assert.equal(empty.hasKey, false);
  assert.deepEqual(empty.lastTravelReceipts, []);
  const loaded = fixture(1, { probeRadius: 210, hasKey: true });
  tick(loaded);
  assert.equal(loaded.phase, 'won');
  assert.equal(loaded.lastTravelReceipts[0].endpointReachedFraction, 0);
});

test('periodic safe components and unsafe complements use unwrapped angles', () => {
  const samples = [
    [-720, true, -2], [-388, true, -1], [-360, true, -1], [-332, true, -1],
    [-180, false, null], [-29, false, null], [-28, true, 0], [0, true, 0],
    [28, true, 0], [29, false, null], [180, false, null], [331, false, null],
    [332, true, 1], [360, true, 1], [388, true, 1], [389, false, null],
    [720, true, 2]
  ];
  for (const [angle, safe, component] of samples) {
    // Unsafe rows explicitly start overlapped: these are not reachable play states.
    const state = fixture(2, { probeRadius: 188, driveAngleDegrees: angle - 315 });
    tick(state);
    const check = checkFor(state, 'outer');
    assert.deepEqual(check.radialInterval, { start: 0, end: 1, startIncluded: true, endIncluded: true });
    assert.equal(check.angleAtIntervalStart, angle);
    assert.equal(check.angleAtIntervalEnd, angle);
    assert.equal(check.safeComponentIndex, component);
    assert.equal(check.firstUnsafeFraction, safe ? null : 0);
    assert.equal(state.lastStep.hasCollision, !safe);
    if (safe) assert.equal(check.unsafeComponent, null);
    else {
      assert.deepEqual(check.unsafeComponent, { start: 0, end: 1, startIncluded: true, endIncluded: true });
      assert.equal(state.lastStep.motionFraction, 0);
      assert.equal(state.probeRadius, 188);
      assert.equal(state.driveAngleDegrees, angle - 315);
    }
  }
});

test('both drive directions can cross wrap without inventing a signed 360 degree jump', () => {
  for (const direction of [-1, 1]) {
    const state = fixture(0, { probeRadius: 180, driveAngleDegrees: 270 - direction * 0.2 });
    tick(state, { x: direction });
    noHit(state);
    close(state.lastStep.actualOuterDeltaDegrees, direction * 0.6);
    assert.equal(checkFor(state, 'outer').safeComponentIndex, 1);
    for (const motion of state.lastStep.ringMotion) {
      const ring = state.scenario.rings.find((item) => item.id === motion.id);
      close(motion.actualDeltaDegrees, ring.gearRatio * direction * 0.6);
      assert.ok(motion.angleAfter >= 0 && motion.angleAfter < 360);
      assert.equal(Object.is(motion.angleAfter, -0), false);
    }
  }
  const exact = fixture(0, { probeRadius: 210, driveAngleDegrees: -90 });
  tick(exact);
  assert.equal(exact.rings[0].angleDegrees, 0);
  assert.equal(Object.is(exact.rings[0].angleDegrees, -0), false);
});

test('radial first contact works from either side and preserves open band endpoints', () => {
  const lower = 188 - 7 + 1e-9;
  const upper = 188 + 7 - 1e-9;
  for (const [direction, edge, start] of [[-1, upper, upper + 0.0625], [1, lower, lower - 0.0625]]) {
    const state = fixture(2, { probeRadius: start });
    tick(state, direction < 0 ? { a: true } : { b: true });
    const check = checkFor(state, 'outer');
    close(check.radialInterval.start, 0.5);
    assert.equal(check.radialInterval.startIncluded, false);
    assert.equal(check.radialInterval.end, 1);
    assert.equal(check.radialInterval.endIncluded, true);
    close(check.firstUnsafeFraction, 0.5);
    assert.equal(check.unsafeComponent.startIncluded, false);
    close(state.probeRadius, edge);
    assert.equal(state.lastStep.primaryRingId, 'outer');
    assert.deepEqual(state.lastStep.tiedRingIds, ['outer']);
    assert.equal(state.durability, 3);
    assert.equal(state.resistance, 1);
    assert.equal(state.lastContact.radialDirection, direction);
    const boundary = state.lastTravelReceipts.find((receipt) => receipt.kind === 'boundary');
    assert.ok(boundary);
    assert.equal(boundary.direction, direction);
    assert.equal(boundary.boundary, direction < 0 ? 'outer' : 'inner');
    close(boundary.fraction, state.lastStep.motionFraction);
  }
});

test('touching only at f=1 is harmless; the following inward attempt has infimum zero', () => {
  const upper = 195 - 1e-9;
  const state = fixture(2, { probeRadius: upper + 0.125 });
  tick(state, { a: true });
  noHit(state);
  assert.equal(checkFor(state, 'outer').radialInterval, null);
  assert.equal(checkFor(state, 'outer').firstUnsafeFraction, null);
  assert.equal(state.probeRadius, upper);
  assert.equal(state.lastTravelReceipts.length, 1);
  assert.equal(state.lastTravelReceipts[0].kind, 'boundary');
  assert.equal(state.lastTravelReceipts[0].fraction, 1);
  tick(state, { a: true });
  assert.equal(state.lastStep.hasCollision, true);
  assert.equal(state.lastStep.motionFraction, 0);
  assert.equal(checkFor(state, 'outer').firstUnsafeFraction, 0);
  assert.equal(checkFor(state, 'outer').unsafeComponent.startIncluded, false);
  assert.equal(state.contactReceipts.length, 1);
  assert.deepEqual(state.lastTravelReceipts, []);
  tick(state, { a: true });
  noHit(state);
  assert.equal(state.lastInput.mode, 'impact_lock');
  assert.equal(state.contactReceipts.length, 1);
  tick(state);
  tick(state, { b: true });
  noHit(state);
  assert.equal(state.probeRadius, upper + 7 / 60);
  assert.deepEqual(state.lastTravelReceipts, []);
});

test('contact scales the entire geared group by the same actual fraction', () => {
  const state = fixture(2, { probeRadius: 195 - 1e-9 + 0.0625 });
  tick(state, { a: true, x: 1 });
  assert.equal(state.lastStep.hasCollision, true);
  close(state.lastStep.motionFraction, 0.5);
  close(state.lastStep.actualOuterDeltaDegrees, 0.8 * state.lastStep.motionFraction);
  for (const motion of state.lastStep.ringMotion) {
    const ring = state.scenario.rings.find((item) => item.id === motion.id);
    close(motion.plannedDeltaDegrees, ring.gearRatio * 0.8);
    close(motion.actualDeltaDegrees, ring.gearRatio * 0.8 * state.lastStep.motionFraction);
    close(motion.unwrappedAngleAfter, ring.initialAngleDegrees + ring.gearRatio * state.driveAngleDegrees);
  }
  assert.equal(state.lastStep.ringChecks.length, 3);
  assert.equal(state.lastContact.fraction, state.lastStep.motionFraction);
  assert.equal(state.lastContact.envelope.innerRadius, state.probeRadius - 2);
  assert.equal(state.lastContact.envelope.outerRadius, state.probeRadius + 2);
});

test('both angular directions stop at the first unsafe interval, including A+B braking', () => {
  for (const [direction, q] of [[1, -7.1], [-1, -22.9]]) {
    const state = fixture(2, { probeRadius: 60, driveAngleDegrees: q });
    const initial = 45 + 3 * q;
    const planned = 3 * (direction * 48 / 60);
    const width = 24 + 1e-9;
    const expected = (direction * width - initial) / planned;
    tick(state, { x: direction, a: true, b: true });
    assert.equal(state.lastStep.hasCollision, true);
    assert.equal(state.lastStep.primaryRingId, 'inner');
    assert.equal(state.probeRadius, 60);
    close(checkFor(state, 'inner').firstUnsafeFraction, expected);
    assert.equal(checkFor(state, 'inner').unsafeComponent.startIncluded, false);
    assertNearestSafeCommit(state);
  }
});

test('gear-three contact, held input, neutral release and safe reversal form one unedited chain', () => {
  const state = fixture(2, { probeRadius: 60, driveAngleDegrees: -7.1 });
  tick(state, { x: 1 });
  assert.equal(state.lastStep.hasCollision, true);
  assert.equal(state.lastStep.primaryRingId, 'inner');
  assertNearestSafeCommit(state);
  const contactQ = state.driveAngleDegrees;
  const receipt = state.contactReceipts[0];
  const receiptText = JSON.stringify(receipt);
  deeplyFrozen(receipt);
  tick(state, { x: 1 });
  noHit(state);
  assert.equal(state.lastInput.mode, 'impact_lock');
  assert.equal(state.driveAngleDegrees, contactQ);
  assert.equal(state.durability, 3);
  tick(state);
  noHit(state);
  assert.equal(state.lastInput.mode, 'neutral_ack');
  assert.equal(state.driveAngleDegrees, contactQ);
  tick(state, { x: -1 });
  noHit(state);
  close(state.driveAngleDegrees, contactQ - 0.8);
  tick(state, { b: true });
  noHit(state);
  close(state.probeRadius, 60 + 7 / 60);
  assert.equal(state.contactReceipts.length, 1);
  assert.strictEqual(state.contactReceipts[0], receipt);
  assert.equal(JSON.stringify(receipt), receiptText);
  assert.equal(state.durability, 3);
  assert.equal(state.resistance, 1);
});

test('cancel preserves the impact brake and neutral acknowledges both locks without repairing damage', () => {
  const state = fixture(2, { probeRadius: 60, driveAngleDegrees: -7.1 });
  tick(state, { x: 1 });
  const q = state.driveAngleDegrees;
  tick(state, { x: 1, cancelled: true, cancelEpoch: 4 });
  assert.equal(state.lastInput.mode, 'quarantine');
  assert.equal(state.inputState.impactLocked, true);
  tick(state, { cancelEpoch: 4, y: NaN });
  assert.equal(state.inputState.quarantined, true);
  assert.equal(state.inputState.impactLocked, true);
  tick(state, { cancelEpoch: 4 });
  noHit(state);
  assert.equal(state.lastInput.mode, 'neutral_ack');
  assert.deepEqual(state.inputState, { cancelEpoch: 4, quarantined: false, impactLocked: false });
  assert.equal(state.driveAngleDegrees, q);
  assert.equal(state.durability, 3);
  assert.equal(state.resistance, 1);
  assert.equal(state.contactReceipts.length, 1);
  tick(state, { cancelEpoch: 4, x: 1 });
  assert.equal(state.lastStep.hasCollision, true);
  assert.equal(state.durability, 2);
  assert.equal(state.resistance, 2);
  assert.equal(state.contactReceipts.length, 2);
});

test('a safe candidate at fraction one may require numeric retreat without inventing contact', () => {
  // Pure static binary64 derivation, not a searched fixture:
  // v=2^-48, W=24+281475v, qB=-23-93825v.
  // q0=qB+0.8 rounds to qB+225179981368525v.
  // theta0+3*(-0.8) rounds to -W+v (safe), whereas committing q0-0.8
  // gives qB and 45+3*qB rounds to -W-v (unsafe). The model must retreat.
  const q0 = (-23 - 93825 * 2 ** -48) + 0.8;
  const state = fixture(2, { probeRadius: 60, driveAngleDegrees: q0 });
  const theta0 = 45 + 3 * q0;
  const planned = 3 * (-48 / 60);
  const width = 24 + 1e-9;
  assert.ok(theta0 + planned >= -width);
  assert.equal(safeEndpoint(state, q0, 60, false), true);
  assert.equal(safeEndpoint(state, q0 - 0.8, 60, false), false);
  tick(state, { x: -1 });
  noHit(state);
  assert.ok(state.lastStep.ringChecks.every((check) => check.firstUnsafeFraction === null));
  assert.ok(state.lastStep.motionFraction < 1);
  assertNearestSafeCommit(state);
  assert.equal(state.durability, 4);
  assert.equal(state.resistance, 0);
  assert.deepEqual(state.contactReceipts, []);
  assert.deepEqual(state.travelReceipts, []);
  tick(state);
  noHit(state);
  assert.equal(state.durability, 4);
});

test('explicitly overlapping synthetic input keeps fraction zero and is never silently safe-ized', () => {
  const state = fixture(2, { probeRadius: 60, driveAngleDegrees: 0 });
  tick(state, { x: -1, b: true });
  assert.equal(state.lastStep.hasCollision, true);
  assert.equal(checkFor(state, 'inner').firstUnsafeFraction, 0);
  assert.equal(checkFor(state, 'inner').unsafeComponent.startIncluded, true);
  assert.equal(state.lastStep.motionFraction, 0);
  assert.equal(state.probeRadius, 60);
  assert.equal(state.driveAngleDegrees, 0);
  assert.equal(safeEndpoint(state, state.driveAngleDegrees, state.probeRadius, false), false);
  assert.equal(state.durability, 3);
});

test('a candidate reaching a radial edge cannot issue a receipt if actual contact stops earlier', () => {
  const edge = 67 - 1e-9;
  const state = fixture(2, { probeRadius: edge - 0.1, driveAngleDegrees: -7.1 });
  tick(state, { b: true, x: 1 });
  assert.ok(state.lastStep.candidateRadius > edge);
  assert.ok(state.probeRadius < edge);
  assert.equal(state.lastStep.hasCollision, true);
  assert.equal(state.lastStep.primaryRingId, 'inner');
  assert.deepEqual(state.lastTravelReceipts, []);
  assert.deepEqual(state.travelReceipts, []);
});

test('real key pickup enlarges the envelope and a continuous return hits its wider angular gate', () => {
  // Synthetic start is in the clear core, with inner angle 22.5 degrees:
  // empty half-width allowance is 24 degrees; carrying the key allows 21.
  const state = fixture(2, { probeRadius: 18.0625, driveAngleDegrees: -7.5 });
  tick(state, { a: true });
  assert.equal(state.hasKey, true);
  assert.equal(state.probeRadius, 18);
  assert.equal(state.score, 100);
  assert.equal(state.lastStep.envelopeBefore.radialHalfLength, 2);
  assert.equal(state.lastStep.envelopeAfter.radialHalfLength, 4);
  assert.equal(state.lastStep.envelopeAfter.angularHalfWidthDegrees, 5);
  assert.equal(state.lastTravelReceipts[0].endpointReachedFraction, 0.5);
  // 264 ordinary outward ticks reach 51; the effective key edge is 51+1e-9.
  // Fixed arithmetic count, no route search, coordinate injection, or pilot.
  for (let count = 0; count < 264; count += 1) {
    tick(state, { b: true });
    noHit(state);
  }
  assert.equal(state.probeRadius, 51);
  tick(state, { b: true });
  assert.equal(state.lastStep.hasCollision, true);
  assert.equal(state.lastStep.primaryRingId, 'inner');
  close(state.probeRadius, 51 + 1e-9);
  assert.equal(state.lastContact.hasKey, true);
  assert.equal(state.lastContact.envelope.radialHalfLength, 4);
  assert.equal(state.lastContact.envelope.angularHalfWidthDegrees, 5);
  assert.equal(state.hasKey, true);
  assert.equal(state.mission, 'return');
  assert.equal(state.score, 100);
  assert.equal(state.durability, 3);
  assert.equal(state.travelReceipts.filter((receipt) => receipt.kind === 'key-acquired').length, 1);
  assert.ok(state.travelReceipts.every((receipt) => receipt.kind !== 'key-extracted'));
});

test('last budget tick permits complete extraction ahead of timeout', () => {
  const state = fixture(2, { tick: 5399, probeRadius: 209.9375, hasKey: true });
  tick(state, { b: true });
  assert.equal(state.tick, 5400);
  assert.equal(state.phase, 'won');
  assert.equal(state.mission, 'complete');
  assert.equal(state.score, 1100);
  assert.equal(state.lostReason, null);
  assert.equal(state.terminal.reason, 'key-extracted');
  assert.equal(state.terminal.fraction, 1);
  assert.deepEqual(state.events.map((event) => event.type), ['win']);
  assert.deepEqual(state.lastTravelReceipts.map((receipt) => receipt.kind), ['key-extracted']);
  assert.equal(state.lastTravelReceipts[0].endpointReachedFraction, 0.5);
});

test('last tick lethal contact precedes timeout and preserves terminal resistance four speed', () => {
  const state = fixture(2, { tick: 5399, probeRadius: 195 - 1e-9 + 0.05, durability: 1 });
  tick(state, { a: true });
  assert.equal(state.tick, 5400);
  assert.equal(state.phase, 'lost');
  assert.equal(state.lostReason, 'durability');
  assert.equal(state.terminal.reason, 'durability');
  assert.equal(state.durability, 0);
  assert.equal(state.resistance, 4);
  assert.equal(state.radialSpeed, 5.5);
  assert.equal(state.lastContact.terminalReason, 'durability');
  assert.equal(state.terminal.fraction, state.lastStep.motionFraction);
  assert.deepEqual(state.events.map((event) => event.type), ['boundary', 'hit', 'lose']);
  const lost = state.lastTravelReceipts.filter((receipt) => receipt.kind === 'lost');
  assert.equal(lost.length, 1);
  assert.equal(lost[0].reason, 'durability');
  assert.equal(lost[0].fraction, state.lastContact.fraction);
  assert.equal(state.hasKey, false);
  assert.equal(state.score, 0);
});

test('last tick nonlethal contact is followed by a single timeout loss', () => {
  const state = fixture(2, { tick: 5399, probeRadius: 195 - 1e-9 + 0.0625 });
  tick(state, { a: true });
  assert.equal(state.phase, 'lost');
  assert.equal(state.lostReason, 'timeout');
  assert.equal(state.lastContact.terminalReason, null);
  assert.equal(state.durability, 3);
  assert.equal(state.terminal.fraction, 1);
  assert.deepEqual(state.events.map((event) => event.type), ['boundary', 'hit', 'lose']);
  const lost = state.lastTravelReceipts.filter((receipt) => receipt.kind === 'lost');
  assert.equal(lost.length, 1);
  assert.equal(lost[0].reason, 'timeout');
  assert.equal(lost[0].fraction, 1);
});

test('last tick key acquisition precedes timeout while preserving key, mission and score', () => {
  const state = fixture(2, { tick: 5399, probeRadius: 18.0625 });
  tick(state, { a: true });
  assert.equal(state.phase, 'lost');
  assert.equal(state.lostReason, 'timeout');
  assert.equal(state.hasKey, true);
  assert.equal(state.mission, 'return');
  assert.equal(state.score, 100);
  assert.deepEqual(state.events.map((event) => event.type), ['key', 'lose']);
  assert.deepEqual(state.lastTravelReceipts.map((receipt) => receipt.kind), ['key-acquired', 'lost']);
  assert.equal(state.lastTravelReceipts[0].endpointReachedFraction, 0.5);
  assert.equal(state.lastTravelReceipts[0].fraction, 1);
  assert.equal(state.lastTravelReceipts[1].hasKeyBefore, true);
  assert.equal(state.lastTravelReceipts[1].hasKeyAfter, true);
  assert.equal(state.lastTravelReceipts[1].scoreBefore, 100);
  assert.equal(state.lastTravelReceipts[1].scoreAfter, 100);
  assert.equal(state.terminal.hasKey, true);
});

test('receipt banks and snapshots preserve nested history, and terminal calls are complete no-ops', () => {
  const state = fixture(2, { tick: 5399, probeRadius: 195 - 1e-9 + 0.0625 });
  tick(state, { a: true });
  const beforeRead = JSON.stringify(state);
  const snapshot = Model.snapshot(state);
  assert.equal(JSON.stringify(state), beforeRead);
  assert.deepEqual(snapshot, state);
  deeplyFrozen(snapshot);
  deeplySeparated(snapshot, state);
  deeplyFrozen(state.lastStep);
  for (const receipt of state.contactReceipts) deeplyFrozen(receipt);
  for (const receipt of state.travelReceipts) deeplyFrozen(receipt);
  assert.throws(() => { snapshot.contactReceipts[0].ringMotion[0].actualDeltaDegrees = 99; }, TypeError);
  assert.throws(() => { state.contactReceipts[0].ringChecks[0].radialInterval.start = 99; }, TypeError);
  const lastStep = state.lastStep;
  const lastInput = state.lastInput;
  const contacts = state.contactReceipts;
  const travels = state.travelReceipts;
  for (const input of [{ a: true, x: 1 }, { retry: true }, { cancelled: true, cancelEpoch: 99 }, {}]) {
    tick(state, input);
    assert.deepEqual(Model.snapshot(state), snapshot);
    assert.strictEqual(state.lastStep, lastStep);
    assert.strictEqual(state.lastInput, lastInput);
    assert.strictEqual(state.contactReceipts, contacts);
    assert.strictEqual(state.travelReceipts, travels);
  }
  const retried = Model.create(state.seed, state.difficulty);
  assert.equal(retried.probeRadius, 210);
  assert.equal(retried.driveAngleDegrees, 0);
  assert.equal(retried.tick, 0);
  assert.equal(retried.durability, 4);
  assert.equal(retried.resistance, 0);
  assert.equal(retried.hasKey, false);
  assert.equal(retried.score, 0);
  assert.deepEqual(retried.contactReceipts, []);
  assert.deepEqual(retried.travelReceipts, []);
  assert.equal(retried.inputState.quarantined, true);
  tick(retried, { a: true });
  assert.equal(retried.probeRadius, 210);
  assert.equal(retried.lastInput.mode, 'quarantine');
});
