'use strict';

// Written from docs/public-design.md, model-contract.md and public-interface.md.
// Author did not read Model/pilot source and did not execute or import this file.
// Run only after root has fully read every executable involved.
// Fixtures use create/step exclusively: no returned-state mutation or injection.
// Short analytical probes reach local conditions; there is no full winning route,
// search, alternative physics engine, browser claim, or private pilot dependency.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const Model = require('../src/main/assets/game-model.js');

const P = 2.4, F = 0.12, C = 4.8, ACC = P - F, REV = P + F;
const BRAKE = F + C, DOCK_SPEED = 0.30, DWELL = 0.60;
const POS_TOL = 1e-6, VEL_TOL = 1e-6, LOAD_TOL = 1e-5, TIME_TOL = 1e-7;
const INPUT = Object.freeze({ x: 0, y: 0, a: false, b: false,
  aPressed: false, bPressed: false, cancelEpoch: 0, cancelled: false });
const layouts = [
  { startX: 10, frostBands: [[18, 32], [45, 61], [71, 85]], centers: [53, 25, 78] },
  { startX: 88, frostBands: [[13, 27], [36, 52], [65, 80]], centers: [44, 72, 20] },
  { startX: 12, frostBands: [[23, 38], [58, 74], [77, 91]], centers: [66, 30, 82] }
];
const rules = { pushAcceleration: P, baseFriction: F, clawFriction: C,
  safeClawSpeed: 5, loadCoefficient: 12, damageLimit: 100,
  dockSpeed: DOCK_SPEED, dockDwell: DWELL, stickThreshold: 0.35 };
const create = (scenario = 0) => Model.create(739, scenario);
const command = (overrides = {}) => ({ ...INPUT, ...overrides });
const step = (state, dt, overrides = {}) => Model.step(state, dt, command(overrides));
const clone = value => JSON.parse(JSON.stringify(value));
function near(actual, expected, tolerance = POS_TOL, label = 'value') {
  assert.ok(Number.isFinite(actual), `${label} must be finite: ${actual}`);
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${label}: actual ${actual}, expected ${expected}, tolerance ${tolerance}`);
}
function facts(s) {
  return { time: s.time, x: s.x, v: s.v, damage: s.damage,
    deliveries: s.deliveries, dwell: s.dwell, score: s.score,
    phase: s.phase, failure: s.failure };
}
function samePhysics(a, b) {
  for (const key of ['x', 'v']) near(a[key], b[key], 1e-6, key);
  near(a.damage, b.damage, LOAD_TOL, 'damage');
  for (const key of ['time', 'dwell']) near(a[key], b[key], TIME_TOL, key);
  for (const key of ['phase', 'failure', 'deliveries', 'score'])
    assert.equal(a[key], b[key], key);
}
function allNumbersFinite(value) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value));
  else if (value && typeof value === 'object')
    for (const child of Object.values(value)) allNumbersFinite(child);
}
function accelerateToSpeed(speed) {
  const s = create();
  step(s, speed / ACC, { x: 1 });
  near(s.x, 10 + speed * speed / (2 * ACC));
  near(s.v, speed, VEL_TOL);
  return s;
}
function accelerateToPosition(x) {
  const s = create();
  step(s, Math.sqrt(2 * (x - 10) / ACC), { x: 1 });
  near(s.x, x);
  return s;
}
// Two constant-force pieces, derived algebraically for a single local fixture.
// The helper is deliberately restricted to scenario 0 and is never exported.
function restAt(x) {
  const s = create(), direction = Math.sign(x - 10);
  const peak = Math.sqrt(2 * Math.abs(x - 10) / (1 / ACC + 1 / REV));
  step(s, peak / ACC, { x: direction });
  step(s, peak / REV, { x: -direction });
  near(s.x, x);
  near(s.v, 0, VEL_TOL);
  return s;
}
function partition(state, duration, input, schedule) {
  let elapsed = 0, index = 0;
  while (elapsed < duration && state.phase === 'playing') {
    const h = Math.min(schedule[index++ % schedule.length], duration - elapsed);
    assert.ok(h > 0);
    step(state, h, input);
    elapsed += h;
    assert.ok(index < 200000, 'partition runner must make progress');
  }
}
const schedules = [[1 / 30], [1 / 60], [1 / 144], [0.017, 0.041, 0.007, 0.035]];

test('three fresh scenarios publish the exact rules, geometry and independent state', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['create', 'step']);
  for (let i = 0; i < 3; i++) {
    const s = create(i), untouched = create(i), initial = clone(untouched);
    assert.equal(s.id, 'frost-brake');
    assert.equal(s.version, '0.1.0');
    assert.equal(s.scenario, i);
    assert.deepEqual(s.rules, rules);
    assert.deepEqual(s.layout, { startX: layouts[i].startX, lane: [0, 100],
      halfLength: 1.2, frostBands: layouts[i].frostBands,
      docks: layouts[i].centers.map((center, j) => ({ center, width: [12, 9, 6][j] })) });
    assert.deepEqual(facts(s), { time: 0, x: layouts[i].startX, v: 0,
      damage: 0, deliveries: 0, dwell: 0, score: 0, phase: 'playing', failure: null });
    assert.equal(s.controlsReady, true);
    assert.equal(s.lastCancelEpoch, null);
    assert.equal(s.lastInput, null);
    assert.equal(s.lastStep, null);
    assert.equal(s.terminalReceipt, null);
    assert.equal(s.nextSeq, 0);
    assert.deepEqual(s.events, []);
    assert.deepEqual(s.deliveryReceipts, []);
    assert.deepEqual(s.contact, { band: -1, clawRequested: false,
      clawEngaged: false, eligible: false });
    assert.equal('audit' in s, false);
    step(s, 0.1, { x: i === 1 ? -1 : 1 });
    assert.deepEqual(untouched, initial);
  }
});

test('seed and scenario normalization does not introduce random geometry', () => {
  for (const seed of [0, 739, 4294967295]) assert.equal(Model.create(seed, 1).seed, seed);
  for (const seed of [undefined, null, NaN, Infinity, -1, 0.5, 4294967296, '739'])
    assert.equal(Model.create(seed, 0).seed, 739);
  for (const level of [undefined, null, -1, 3, 1.5, NaN, '1'])
    assert.equal(Model.create(739, level).scenario, 0);
  assert.deepEqual(Model.create(0, 2).layout, Model.create(4294967295, 2).layout);
});

test('push uses the literal deadzone, clamps finite x, and ignores pressed edges', () => {
  for (const x of [0.35, 1, 9]) {
    const s = create();
    step(s, 1, { x, aPressed: true, bPressed: true, y: 1, b: true });
    near(s.x, 10 + ACC / 2);
    near(s.v, ACC, VEL_TOL);
    assert.equal(s.lastInput.effectiveAxis, 1);
  }
  for (const x of [-0.35, -1, -9]) {
    const s = create();
    step(s, 1, { x });
    near(s.x, 10 - ACC / 2);
    near(s.v, -ACC, VEL_TOL);
  }
  for (const x of [0, 0.349999, -0.349999, NaN, Infinity, '1']) {
    const s = create();
    step(s, 1, { x, aPressed: true });
    near(s.x, 10);
    near(s.v, 0, VEL_TOL);
  }
});

test('releasing push preserves inertia with only 0.12 passive drag', () => {
  const s = create();
  step(s, 1, { x: 1 });
  step(s, 1);
  near(s.v, ACC - F, VEL_TOL);
  near(s.x, 10 + ACC / 2 + ACC - F / 2);
  near(s.time, 2, TIME_TOL);
  assert.ok(s.v > 2);
});

test('required regression: A has no effect outside frost, including with push', () => {
  for (const axis of [-1, 0, 1]) {
    const plain = create(), claw = create();
    step(plain, 0.5, { x: 1 });
    step(claw, 0.5, { x: 1 });
    step(plain, 0.5, { x: axis, a: false });
    step(claw, 0.5, { x: axis, a: true });
    samePhysics(plain, claw);
    assert.equal(claw.contact.clawRequested, true);
    assert.equal(claw.contact.clawEngaged, false);
    assert.equal(claw.damage, 0);
  }
});

test('claw static friction holds against either push and release permits departure', () => {
  const s = accelerateToSpeed(8);
  step(s, 8 / BRAKE + 0.2, { a: true });
  const parked = s.x;
  for (const axis of [-1, 1]) {
    step(s, 0.5, { x: axis, a: true });
    near(s.x, parked);
    near(s.v, 0, VEL_TOL);
    assert.equal(s.contact.clawEngaged, true);
  }
  step(s, 0.2, { x: -1 });
  near(s.v, -ACC * 0.2, VEL_TOL);
  near(s.x, parked - ACC * 0.2 * 0.2 / 2);
});

test('opposite thrust splits velocity zero and accelerates in the new direction', () => {
  const s = create();
  step(s, 0.2, { x: 1 });
  const v0 = ACC * 0.2, x0 = 10 + ACC * 0.2 * 0.2 / 2;
  const zero = v0 / REV, remainder = 0.5 - zero;
  step(s, 0.5, { x: -1 });
  near(s.v, -ACC * remainder, VEL_TOL);
  near(s.x, x0 + v0 * v0 / (2 * REV) - ACC * remainder * remainder / 2);
  assert.ok(s.lastStep.segments.some(piece => piece.ends.includes('zero')));
});

test('frost entry splits passive drag from active braking at the actual crossing', () => {
  const s = accelerateToPosition(17), v0 = Math.sqrt(2 * ACC * 7);
  const entryV = Math.sqrt(v0 * v0 - 2 * F);
  const entryT = 2 / (v0 + entryV), brakingT = 0.5 - entryT;
  step(s, 0.5, { a: true });
  near(s.v, entryV - BRAKE * brakingT, VEL_TOL);
  near(s.x, 18 + entryV * brakingT - BRAKE * brakingT * brakingT / 2);
  near(s.damage, 12 * (entryV - 5) ** 2 / (2 * BRAKE), LOAD_TOL);
  assert.equal(s.lastStep.segments[0].clawEngaged, false);
  assert.ok(s.lastStep.segments.some(piece => piece.clawEngaged));
});

test('frost exit immediately removes the extra claw friction', () => {
  const s = accelerateToPosition(31), v0 = Math.sqrt(2 * ACC * 21);
  const exitV = Math.sqrt(v0 * v0 - 2 * BRAKE);
  const exitT = 2 / (v0 + exitV), coastT = 0.5 - exitT;
  step(s, 0.5, { a: true });
  near(s.v, exitV - F * coastT, VEL_TOL);
  near(s.x, 32 + exitV * coastT - F * coastT * coastT / 2);
  near(s.damage, 12 * ((v0 - 5) * exitT - BRAKE * exitT * exitT / 2), LOAD_TOL);
  assert.equal(s.contact.clawRequested, true);
  assert.equal(s.contact.clawEngaged, false);
});

test('one call can contain frost entry and exit without applying endpoint friction globally', () => {
  const s = accelerateToPosition(44.99), v0 = Math.sqrt(2 * ACC * 34.99);
  const entryV = Math.sqrt(v0 * v0 - 2 * F * 0.01);
  const entryT = 0.02 / (v0 + entryV);
  const exitV = Math.sqrt(entryV * entryV - 2 * BRAKE * 16);
  const bandT = 32 / (entryV + exitV), coastT = 3 - entryT - bandT;
  step(s, 3, { a: true });
  near(s.v, exitV - F * coastT, VEL_TOL);
  near(s.x, 61 + exitV * coastT - F * coastT * coastT / 2);
  near(s.damage, 12 * (entryV - 5) ** 2 / (2 * BRAKE), LOAD_TOL);
  assert.equal(s.phase, 'playing');
  assert.equal(s.deliveries, 0, 'a fast crossing of dock center cannot deliver');
  assert.equal(s.dwell, 0);
  assert.ok(s.lastStep.segments.filter(piece => piece.ends.includes('band')).length >= 2);
});

test('high-speed claw load is its exact integral, not a charge per press', () => {
  const s = accelerateToSpeed(8), x0 = 10 + 64 / (2 * ACC);
  step(s, 8 / BRAKE + 0.1, { a: true, aPressed: true });
  near(s.x, x0 + 64 / (2 * BRAKE));
  near(s.v, 0, VEL_TOL);
  near(s.damage, 12 * 9 / (2 * BRAKE), LOAD_TOL);
  const damage = s.damage;
  step(s, 1, { a: true, aPressed: true });
  near(s.damage, damage, LOAD_TOL);
});

test('speed 5 claw braking is damage-free and additive push changes stopping distance', () => {
  const safe = restAt(22);
  step(safe, 5 / ACC, { x: 1 });
  const safeStart = 22 + 25 / (2 * ACC);
  step(safe, 5 / BRAKE + 0.1, { a: true });
  near(safe.x, safeStart + 25 / (2 * BRAKE));
  near(safe.damage, 0, 1e-10);
  const fast = accelerateToSpeed(8), fastStart = fast.x;
  step(fast, 0.5, { x: 1, a: true });
  near(fast.v, 8 - (BRAKE - P) * 0.5, VEL_TOL);
  near(fast.x, fastStart + 8 * 0.5 - (BRAKE - P) * 0.5 ** 2 / 2);
});

test('separate claw episodes accumulate only their actual high-speed exposure', () => {
  const s = accelerateToSpeed(8);
  step(s, 0.2, { a: true });
  const firstDamage = 12 * (3 * 0.2 - BRAKE * 0.2 ** 2 / 2);
  near(s.damage, firstDamage, LOAD_TOL);
  step(s, 0.1);
  const secondSpeed = 8 - BRAKE * 0.2 - F * 0.1;
  near(s.damage, firstDamage, LOAD_TOL);
  step(s, secondSpeed / BRAKE + 0.1, { a: true });
  near(s.damage, firstDamage + 12 * (secondSpeed - 5) ** 2 / (2 * BRAKE), LOAD_TOL);
});

test('required regression: center inside a dock is insufficient when the body protrudes', () => {
  const outside = restAt(48.1);
  assert.ok(outside.x > 47 && outside.x < 59, 'center lies in the marked full dock');
  assert.ok(outside.x - 1.2 < 47, 'rear of sled is outside');
  step(outside, 1, { a: true });
  assert.equal(outside.deliveries, 0);
  assert.equal(outside.dwell, 0);
  const inside = restAt(48.21);
  step(inside, 0.7, { a: true });
  assert.equal(inside.deliveries, 1);
});

test('docking requires the entire uninterrupted 0.60 seconds at safe speed', () => {
  const s = restAt(53), initialDwell = DOCK_SPEED / REV;
  near(s.dwell, initialDwell, TIME_TOL);
  step(s, DWELL - initialDwell - 0.01, { a: true });
  assert.equal(s.deliveries, 0);
  near(s.dwell, 0.59, TIME_TOL);
  const start = s.time;
  step(s, 0.02, { a: true });
  assert.equal(s.deliveries, 1);
  assert.equal(s.score, 100);
  near(s.deliveryReceipts[0].time, start + 0.01, 1e-6);
  near(s.deliveryReceipts[0].dwell, DWELL, TIME_TOL);
  assert.deepEqual(s.deliveryReceipts[0].allowedCenter, [48.2, 57.8]);
  assert.equal(s.dwell, 0, 'next dock is far away');
});

test('an actually consumed excessive-speed interval resets prior docking dwell', () => {
  const s = restAt(53);
  step(s, 0.2, { a: true });
  step(s, 0.2, { x: 1 });
  assert.equal(s.deliveries, 0);
  assert.equal(s.dwell, 0);
  const speed = ACC * 0.2, toSafe = (speed - DOCK_SPEED) / BRAKE;
  step(s, 0.1, { a: true });
  near(s.dwell, 0.1 - toSafe, TIME_TOL);
  assert.equal(s.deliveries, 0);
});

test('call-end at the safe-speed boundary does not hypothetically reset dwell', () => {
  const s = restAt(53), toBoundary = DOCK_SPEED / ACC;
  step(s, toBoundary, { x: 1 });
  near(s.v, DOCK_SPEED, VEL_TOL);
  near(s.dwell, DOCK_SPEED / REV + toBoundary, TIME_TOL);
  const retained = s.dwell;
  step(s, 0, { x: 1 });
  near(s.dwell, retained, TIME_TOL);
  step(s, 0.1, { a: true });
  near(s.dwell, retained + 0.1, TIME_TOL);
});

test('distinct event roots 5e-11 seconds apart cannot grant missing dwell', () => {
  const gap = 5e-11, safeExit = DOCK_SPEED / ACC;
  for (const split of [false, true]) {
    const s = restAt(53);
    step(s, DWELL - DOCK_SPEED / REV - safeExit - gap, { a: true });
    if (split) {
      step(s, safeExit + gap / 2, { x: 1 });
      step(s, 0.001 - gap / 2, { x: 1 });
    } else step(s, safeExit + 0.001, { x: 1 });
    assert.equal(s.deliveries, 0, 'the actual ineligible interval precedes completion');
    assert.equal(s.dwell, 0);
  }
});

test('an exact dwell and closed speed-boundary tie credits the completed interval', () => {
  const s = restAt(53), safeExit = DOCK_SPEED / ACC;
  step(s, DWELL - DOCK_SPEED / REV - safeExit, { a: true });
  const start = s.time;
  step(s, safeExit + 0.05, { x: 1 });
  assert.equal(s.deliveries, 1);
  near(s.deliveryReceipts[0].time, start + safeExit, 1e-6);
  near(s.deliveryReceipts[0].v, DOCK_SPEED, VEL_TOL);
});

test('delivery preserves real velocity and consumes the remainder with the next dock active', () => {
  const s = restAt(53), accelerate = 0.2 / ACC;
  step(s, accelerate, { x: 1 });
  const x0 = 53 + ACC * accelerate * accelerate / 2;
  const deliveryAfter = DWELL - DOCK_SPEED / REV - accelerate;
  step(s, 1);
  assert.equal(s.deliveries, 1);
  assert.ok(s.deliveryReceipts[0].v > 0.1);
  near(s.deliveryReceipts[0].v, 0.2 - F * deliveryAfter, VEL_TOL);
  near(s.v, 0.2 - F, VEL_TOL);
  near(s.x, x0 + 0.2 - F / 2);
  near(s.lastStep.consumedDt, 1, TIME_TOL);
  assert.equal(s.lastStep.unusedDt, 0);
});

test('cancellation neutralizes controls while real unpaused coasting continues', () => {
  const s = accelerateToSpeed(8), x0 = s.x, time = s.time;
  step(s, 0.2, { x: 1, a: true, cancelEpoch: 1, cancelled: true });
  near(s.x, x0 + 8 * 0.2 - F * 0.2 ** 2 / 2);
  near(s.v, 8 - F * 0.2, VEL_TOL);
  near(s.time, time + 0.2, TIME_TOL);
  assert.equal(s.damage, 0);
  assert.equal(s.controlsReady, false);
  assert.equal(s.lastInput.effectiveAxis, 0);
  assert.equal(s.lastInput.effectiveClaw, false);
  assert.equal(s.contact.clawRequested, false);
  assert.equal(s.events.filter(event => event.type === 'cancel').length, 1);
});

test('only explicit finite raw neutral x and false A can reopen the release gate', () => {
  const s = create();
  step(s, 0, { cancelled: true });
  const malformed = [undefined, null, [], {}, { x: NaN, a: false },
    { x: Infinity, a: false }, { x: '0', a: false }, { x: 0 },
    { x: 0, a: null }, { x: 0, a: 0 }, { x: 0.35, a: false },
    Object.create({ x: 0, a: false })];
  for (const raw of malformed) {
    Model.step(s, 0, raw);
    assert.equal(s.controlsReady, false);
  }
  step(s, 0.1, { x: 1, a: true });
  near(s.x, 10);
  assert.equal(s.lastInput.reason, 'blocked');
  step(s, 0, { x: 0, a: false, y: 1, b: true, aPressed: true, bPressed: true });
  assert.equal(s.controlsReady, true);
  assert.equal(s.lastInput.reason, 'release');
  assert.equal(s.events[0].type, 'release');
  step(s, 0.1, { x: 1 });
  near(s.v, ACC * 0.1, VEL_TOL);
});

test('epoch baseline, epoch changes and synthetic neutral follow distinct semantics', () => {
  const s = create();
  step(s, 0.1, { x: 1, cancelEpoch: 7 });
  assert.equal(s.controlsReady, true);
  assert.equal(s.lastInput.epochChanged, false);
  near(s.v, ACC * 0.1, VEL_TOL);
  step(s, 0, { x: 0, a: false, cancelEpoch: 8 });
  assert.equal(s.controlsReady, false, 'new epoch wins over a same-sample release');
  step(s, 0, { x: 0, a: false, cancelEpoch: 8, cancelled: true });
  assert.equal(s.controlsReady, false, 'synthetic neutral cannot acknowledge release');
  assert.equal(s.events.length, 0, 'already-closed gate has no duplicate edge event');
  step(s, 0, { cancelEpoch: -1 });
  assert.equal(s.lastCancelEpoch, 8);
  assert.equal(s.lastInput.epoch, null);
  assert.equal(s.controlsReady, true, 'explicit raw neutral can release despite ignored epoch');
});

test('zero and invalid dt preserve physics but retain semantic observations', () => {
  const s = accelerateToSpeed(2), before = facts(s);
  const cases = [[0, 'nonpositive'], [-1, 'nonpositive'], [NaN, 'nonfinite'],
    [Infinity, 'nonfinite'], [undefined, 'nonnumeric'], [null, 'nonnumeric'],
    ['0.1', 'nonnumeric'], [true, 'nonnumeric']];
  for (const [dt, status] of cases) {
    const seq = s.nextSeq;
    Model.step(s, dt, command({ x: 1, a: true }));
    assert.deepEqual(facts(s), before);
    assert.equal(s.lastStep.dtStatus, status);
    assert.equal(s.lastStep.seq, seq);
    assert.equal(s.nextSeq, seq + 1);
    assert.equal(s.lastStep.acceptedDt, 0);
    assert.equal(s.lastStep.consumedDt, 0);
    assert.equal(s.lastStep.unusedDt, 0);
    assert.deepEqual(s.lastStep.segments, []);
    allNumbersFinite(s);
  }
});

test('raw input receipts preserve missing, malformed and nonfinite classifications', () => {
  const s = create();
  Model.step(s, NaN, { x: NaN, a: 'true', y: Infinity, b: false,
    aPressed: undefined, cancelEpoch: -1 });
  const raw = s.lastInput.raw;
  assert.deepEqual(raw.x, { kind: 'nan', value: null });
  assert.deepEqual(raw.a, { kind: 'string', value: 'true' });
  assert.deepEqual(raw.y, { kind: 'positive-infinity', value: null });
  assert.deepEqual(raw.b, { kind: 'boolean', value: false });
  assert.deepEqual(raw.aPressed, { kind: 'undefined', value: null });
  assert.deepEqual(raw.bPressed, { kind: 'missing', value: null });
  assert.equal(s.lastInput.xValid, false);
  assert.equal(s.lastInput.requestedA, false);
  assert.equal(s.lastStep.requestedDt, null);
  assert.equal(s.lastStep.dtKind, 'nan');
  allNumbersFinite(s);
});

test('unrepresentable requested endpoints are semantic no-time samples', () => {
  const huge = create();
  step(huge, Number.MAX_VALUE);
  assert.equal(huge.time, Number.MAX_VALUE);
  const before = facts(huge);
  step(huge, Number.MAX_VALUE, { x: 1 });
  assert.deepEqual(facts(huge), before);
  assert.equal(huge.lastStep.dtStatus, 'nonrepresentable');
  const small = create();
  step(small, 1);
  step(small, Number.MIN_VALUE, { x: 1 });
  assert.equal(small.lastStep.dtStatus, 'nonrepresentable');
  near(small.time, 1, TIME_TOL);
  allNumbersFinite(huge);
});

test('actual local durations survive rounded-equal absolute timestamps', () => {
  const s = create();
  step(s, 1e308);
  step(s, 1e292, { x: 1 });
  const edgeTime = Math.sqrt(2 * (98.8 - 10) / ACC);
  assert.equal(s.phase, 'lost');
  assert.equal(s.failure, 'edge');
  assert.equal(s.time, 1e308);
  near(s.lastStep.consumedDt, edgeTime, 1e-6);
  near(s.terminalReceipt.offset, edgeTime, 1e-6);
  assert.ok(s.lastStep.segments.some(piece => piece.duration > 0 && piece.t1 === piece.t0));
  near(s.lastStep.segments.reduce((sum, piece) => sum + piece.duration, 0), edgeTime, 1e-6);
  allNumbersFinite(s);
});

test('finite-body edge loss truncates the last call and preserves terminal velocity', () => {
  const s = create(), edgeTime = Math.sqrt(2 * (10 - 1.2) / ACC);
  step(s, 10, { x: -1 });
  assert.equal(s.phase, 'lost');
  assert.equal(s.failure, 'edge');
  near(s.x, 1.2);
  near(s.v, -ACC * edgeTime, VEL_TOL);
  near(s.time, edgeTime, TIME_TOL);
  near(s.lastStep.consumedDt, edgeTime, TIME_TOL);
  near(s.lastStep.unusedDt, 10 - edgeTime, TIME_TOL);
  assert.deepEqual(s.terminalReceipt.causes, ['edge']);
  const terminal = clone(s);
  for (const dt of [0, -1, 0.1, 100, NaN]) {
    Model.step(s, dt, command({ x: 1, a: true, cancelled: true, cancelEpoch: 99 }));
    assert.deepEqual(s, terminal);
  }
  assert.equal(create().phase, 'playing');
  assert.equal(create().lastStep, null);
});

test('an analytical edge stop is legal and outward departure loses at its first contact', () => {
  const s = restAt(1.2);
  assert.equal(s.phase, 'playing');
  step(s, 0, { x: -1 });
  assert.equal(s.phase, 'playing', 'no-time samples cannot trigger an outward-motion loss');
  const exactlyAtRestOnEdge = s.x === 1.2 && s.v === 0;
  step(s, 0.1, { x: -1 });
  assert.equal(s.phase, 'lost');
  assert.equal(s.failure, 'edge');
  // The algebraic fixture may finish a few ulps inside the edge. Such a real
  // positive gap must not be erased by the test or a production success margin.
  if (exactlyAtRestOnEdge) assert.equal(s.lastStep.consumedDt, 0);
  else assert.ok(s.lastStep.consumedDt >= 0 && s.lastStep.consumedDt < 1e-6);
  near(s.lastStep.unusedDt, 0.1, TIME_TOL);
  near(s.x, 1.2);
});

test('cargo exhaustion occurs at the first integrated load root before the band exit', () => {
  const s = accelerateToSpeed(16), x0 = 10 + 256 / (2 * ACC);
  const entryV = Math.sqrt(256 - 2 * F * (71 - x0));
  const entryT = 2 * (71 - x0) / (16 + entryV);
  const excess = entryV - 5;
  const loadT = (excess - Math.sqrt(excess * excess - 2 * BRAKE * 100 / 12)) / BRAKE;
  const expectedX = 71 + entryV * loadT - BRAKE * loadT * loadT / 2;
  assert.ok(expectedX < 85, 'analytical exhaustion is inside the final frost band');
  step(s, 5, { a: true });
  assert.equal(s.phase, 'lost');
  assert.equal(s.failure, 'damage');
  near(s.damage, 100, LOAD_TOL);
  near(s.x, expectedX);
  near(s.v, entryV - BRAKE * loadT, VEL_TOL);
  near(s.lastStep.consumedDt, entryT + loadT, 1e-6);
  near(s.lastStep.unusedDt, 5 - entryT - loadT, 1e-6);
  assert.deepEqual(s.terminalReceipt.causes, ['damage']);
});

test('positive dt is elapsed duration rather than one call being one tick', () => {
  const one = create(), sixty = create();
  step(one, 1, { x: 1 });
  partition(sixty, 1, { x: 1 }, [1 / 60]);
  samePhysics(one, sixty);
  near(one.x, 10 + ACC / 2);
  near(one.v, ACC, VEL_TOL);
});

test('required regression: stopping distance agrees at 30, 60, 144 and irregular dt', () => {
  for (const schedule of schedules) {
    const s = accelerateToSpeed(8), x0 = s.x;
    partition(s, 2, { a: true }, schedule);
    near(s.x - x0, 64 / (2 * BRAKE));
    near(s.v, 0, VEL_TOL);
    near(s.damage, 12 * 9 / (2 * BRAKE), LOAD_TOL);
  }
});

test('equal held-command timelines preserve reversal, load and final state across dt partitions', () => {
  const timeline = [[3.4, { x: 1 }], [2, { a: true }],
    [1.3, { x: -1 }], [0.8, { a: true }]];
  const reference = create();
  for (const [duration, input] of timeline) step(reference, duration, input);
  for (const schedule of schedules) {
    const s = create();
    for (const [duration, input] of timeline) partition(s, duration, input, schedule);
    samePhysics(s, reference);
  }
});

test('delivery and terminal event times also agree across dt partitions', () => {
  const deliveryReference = restAt(53), start = deliveryReference.time;
  step(deliveryReference, 1, { a: true });
  const lossTime = Math.sqrt(2 * (10 - 1.2) / ACC);
  for (const schedule of schedules) {
    const delivery = restAt(53);
    partition(delivery, 1, { a: true }, schedule);
    samePhysics(delivery, deliveryReference);
    near(delivery.deliveryReceipts[0].time, start + DWELL - DOCK_SPEED / REV, 1e-6);
    const loss = create();
    partition(loss, 10, { x: -1 }, schedule);
    assert.equal(loss.failure, 'edge');
    near(loss.terminalReceipt.time, lossTime, 1e-6);
  }
});

test('segment observations obey public exact formulas using local duration', () => {
  const s = accelerateToPosition(44.99);
  const before = clone(s);
  step(s, 3, { a: true });
  let elapsed = 0;
  for (const piece of s.lastStep.segments) {
    const h = piece.duration;
    assert.ok(h > 0);
    near(piece.x1, piece.x0 + piece.v0 * h + piece.acceleration * h * h / 2);
    near(piece.v1, piece.v0 + piece.acceleration * h, VEL_TOL);
    const midV = piece.v0 + piece.acceleration * h / 2;
    const midX = piece.x0 + piece.v0 * h / 2 + piece.acceleration * h * h / 8;
    const band = layouts[0].frostBands.findIndex(([lo, hi]) => midX > lo && midX < hi);
    assert.equal(piece.band, band);
    assert.equal(piece.clawEngaged, band >= 0);
    const expectedAcceleration = -Math.sign(midV) * (F + (band >= 0 ? C : 0));
    near(piece.acceleration, expectedAcceleration, 1e-10);
    const expectedLoad = band >= 0 && Math.abs(midV) > 5
      ? 12 * ((Math.abs(piece.v0) - 5) * h + Math.sign(midV) * piece.acceleration * h * h / 2) : 0;
    near(piece.damage1 - piece.damage0, expectedLoad, LOAD_TOL);
    elapsed += h;
  }
  near(elapsed, s.lastStep.consumedDt, TIME_TOL);
  for (const key of Object.keys(facts(before))) assert.equal(s.lastStep.before[key], before[key]);
  for (const key of Object.keys(facts(s))) assert.equal(s.lastStep.after[key], s[key]);
  assert.deepEqual(s.lastStep.input, s.lastInput);
  assert.deepEqual(s.lastStep.events, s.events);
});

test('committed latest-call and permanent delivery observations are not mutated later', () => {
  const s = restAt(53);
  step(s, 1, { a: true });
  const receipt = s.deliveryReceipts[0], receiptCopy = clone(receipt);
  const lastStep = s.lastStep, lastStepCopy = clone(lastStep), seq = s.nextSeq;
  step(s, 0.2, { x: -1 });
  assert.deepEqual(receipt, receiptCopy);
  assert.deepEqual(lastStep, lastStepCopy);
  assert.deepEqual(s.deliveryReceipts, [receiptCopy]);
  assert.equal(s.lastStep.seq, seq);
  assert.equal(s.nextSeq, seq + 1);
  assert.deepEqual(s.events, []);
  assert.equal(s.terminalReceipt, null);
  for (const [index, event] of lastStep.events.entries()) {
    assert.equal(event.seq, lastStep.seq);
    assert.equal(event.index, index);
    assert.ok(event.offset >= 0 && event.offset <= lastStep.consumedDt);
  }
});

// Fixed-geometry limitations are intentional, not missing fabricated fixtures:
// docks lie strictly inside the lane, and valid docking speed <=0.30 is below
// the >5 claw-load threshold. A reachable live delivery cannot coincide with
// a fresh edge/load failure under these layouts. No impossible tie is injected.
// All-three-dock wins, host pause/RAF behavior and actual phone controls belong
// to the separately recorded ordinary corpus/browser evidence, not this file.
