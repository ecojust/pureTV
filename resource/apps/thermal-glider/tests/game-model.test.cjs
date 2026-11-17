'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const modelPath = path.join(__dirname, '../src/main/assets/game-model.js');
const Model = require(modelPath);
const DT = 1 / 60;
const clone = value => JSON.parse(JSON.stringify(value));
const tick = (s, input = {}) => Model.step(s, DT, input);
function ticks(s, n, input = {}) { for (let i = 0; i < n; i++) tick(s, typeof input === 'function' ? input(i) : input); return s; }
function near(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} should equal ${expected} within ${epsilon}`);
}
function wrap(angle) { return Math.atan2(Math.sin(angle), Math.cos(angle)); }
function rebaseline(s) {
  s.initialEnergy = s.energy = .5 * s.glider.airspeed ** 2 + s.physics.gravity * s.glider.altitude;
  s.thermalEnergyAdded = 0; s.energyDissipated = 0; s.energyError = 0;
  return s;
}
function energyBalances(s) {
  near(s.energy, .5 * s.glider.airspeed ** 2 + s.physics.gravity * s.glider.altitude, 1e-8);
  near(s.energy, s.initialEnergy + s.thermalEnergyAdded - s.energyDissipated, 2e-7);
  near(s.energyError, 0, 2e-7);
  assert.ok(s.energyDissipated >= 0 && s.thermalEnergyAdded >= 0);
}

// Explicit public-state physics boundary fixtures, not authored-course wins.
// Wide empty airspace isolates one physical law; edited energy is rebaselined.
function flight(options = {}) {
  const s = Model.create(77, 0);
  s.world = { xMin: -1e6, xMax: 1e6, zMin: -1e6, zMax: 1e6, groundLevel: 0 };
  s.wind = { x: 0, z: 0 }; s.thermals = []; s.mountains = [];
  s.rings = [{ id: 'distant', x: 0, z: 9e5, altitude: 1000, radius: 20, heading: 0, passed: false }];
  Object.assign(s.glider, { x: 0, z: 0, altitude: 1000, airspeed: 18, heading: 0, bank: 0, pitch: 0,
    vx: 0, vz: 18, groundSpeed: 18, verticalSpeed: 0, stalled: false, stallTime: 0,
    airbrake: false, flaps: false, thermalLift: 0, sinkRate: 0 });
  for (const key of ['wind', 'world', 'runway']) if (options[key]) Object.assign(s[key], options[key]);
  for (const key of ['thermals', 'mountains', 'rings']) if (options[key]) s[key] = clone(options[key]);
  if (options.glider) Object.assign(s.glider, options.glider);
  if (options.physics) Object.assign(s.physics, options.physics);
  return rebaseline(s);
}
function landing(options = {}) {
  return flight({ rings: [], glider: { altitude: .005, airspeed: 12, flaps: true, ...(options.glider || {}) },
    runway: { x: 0, z: 0, heading: 0, length: 100, width: 100, ...(options.runway || {}) },
    ...Object.fromEntries(Object.entries(options).filter(([key]) => !['glider', 'runway'].includes(key))) });
}
function sweep(options = {}) {
  // At neutral pitch the center traverses exactly 20 m per tick. Public wind
  // creates a long segment without injecting air-relative kinetic energy.
  return flight({ wind: { x: 0, z: 1182 }, glider: { radius: 1, ...(options.glider || {}) },
    ...Object.fromEntries(Object.entries(options).filter(([key]) => key !== 'glider')) });
}
const ring = (id, z, extra = {}) => ({ id, x: 0, z, altitude: 1000, radius: 3, heading: 0, passed: false, ...extra });
const mountain = (extra = {}) => ({ id: 'test-cylinder', x: 0, z: 10, radius: 2, height: 1100, ...extra });

test('UMD API, three authored course resources, coordinate conventions and initial energy are public', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['TICK_HZ', 'create', 'step']); assert.equal(Model.TICK_HZ, 60);
  const sandbox = {}; vm.runInNewContext(fs.readFileSync(modelPath, 'utf8'), sandbox);
  assert.deepEqual(clone(sandbox.PureModel.create(4, 1)), Model.create(4, 1));
  for (let d = 0; d < 3; d++) {
    const s = Model.create(4, d);
    assert.equal(s.level, d + 1); assert.equal(s.phase, 'playing'); assert.equal(s.timeLimit, 90);
    assert.equal(s.checkpointCount, [3, 3, 4][d]); assert.equal(s.nextRing, 0); assert.equal(s.checkpointsPassed, 0);
    assert.ok(s.rings.every(r => !r.passed)); assert.equal(s.glider.flaps, false); assert.equal(s.glider.airbrake, false);
    assert.equal(s.glider.radius, 6); assert.equal(s.glider.span, 12); assert.equal(s.glider.length, 6);
    near(s.glider.vx, s.wind.x); near(s.glider.vz, s.glider.airspeed + s.wind.z);
    assert.equal(s.collision, null); assert.equal(s.landingResult, null); assert.equal(s.score, 0);
    energyBalances(s);
  }
});

test('neutral flight keeps airspeed while the positive polar sink loses exactly gravitational energy', () => {
  const s = flight(); const old = clone(s.glider); tick(s);
  near(s.glider.airspeed, 18); near(s.glider.altitude, old.altitude - .7 * DT);
  near(s.glider.verticalSpeed, -.7); near(s.lastStep.normalSink, .7); near(s.lastStep.pitchHeightTransfer, 0);
  near(s.energyDissipated, 9.81 * .7 * DT); assert.equal(s.thermalEnergyAdded, 0);
  assert.equal(s.glider.stalled, false); assert.equal(s.flightMode, 'glide'); energyBalances(s);
});

test('pitch transfers kinetic and gravitational energy exactly and alternating controls cannot pump energy', () => {
  const s = flight(); const old = clone(s.glider); tick(s, { y: -1 });
  const pitch = .18 * (1 - Math.exp(-DT / .28));
  const rawSpeed = 18 - 9.81 * Math.sin(pitch) * DT;
  const transferredHeight = (18 ** 2 - rawSpeed ** 2) / (2 * 9.81);
  near(s.glider.pitch, pitch); near(s.glider.airspeed, rawSpeed);
  near(s.lastStep.pitchHeightTransfer, transferredHeight);
  near(s.glider.altitude - old.altitude, transferredHeight - s.lastStep.sinkRate * DT);
  let previous = s.energy;
  for (let i = 0; i < 1200; i++) {
    tick(s, { y: i % 2 ? -1 : 1, x: i % 120 < 60 ? .7 : -.7 });
    assert.ok(s.energy <= previous + 1e-8, 'control cycling is passive without thermals');
    previous = s.energy; energyBalances(s);
  }
  assert.equal(s.phase, 'playing'); assert.equal(s.thermalEnergyAdded, 0); assert.ok(s.energy < s.initialEnergy);
});

test('speed cap and airbrake dissipate removed kinetic energy without converting it to height', () => {
  const capped = flight({ glider: { airspeed: 40 } }); tick(capped);
  assert.equal(capped.glider.airspeed, 32); near(capped.lastStep.brakeAndCapLoss, (40 ** 2 - 32 ** 2) / 2);
  near(capped.lastStep.pitchHeightTransfer, 0); assert.ok(capped.glider.altitude < 1000); energyBalances(capped);
  const braking = flight(); tick(braking, { a: true });
  const speed = 18 - 1.4 * DT;
  near(braking.glider.airspeed, speed); near(braking.lastStep.brakeAndCapLoss, (18 ** 2 - speed ** 2) / 2);
  near(braking.lastStep.brakeSink, 1.4); near(braking.lastStep.pitchHeightTransfer, 0);
  assert.ok(braking.glider.altitude < 1000 - .7 * DT); energyBalances(braking);
  const stopped = flight({ glider: { airspeed: .001 } }); tick(stopped, { a: true });
  assert.equal(stopped.glider.airspeed, 0); assert.ok(stopped.lastStep.brakeAndCapLoss > 0); energyBalances(stopped);
  const diving = flight({ glider: { pitch: -.18 } }), freeDive = clone(diving);
  tick(diving, { y: 1, a: true }); tick(freeDive, { y: 1 });
  assert.ok(diving.glider.airspeed > 18, 'gravity can still cause net acceleration with the brake deployed');
  assert.ok(diving.glider.airspeed < freeDive.glider.airspeed, 'the brake still removes kinetic energy relative to the same dive');
  assert.equal(diving.flightMode, 'airbrake'); assert.match(diving.message, /增加阻力与下沉/);
  assert.doesNotMatch(diving.message, /空速降低/); energyBalances(diving); energyBalances(freeDive);
});

test('flaps are a passive polar change: no instantaneous boost, better low-speed sink, worse high-speed sink', () => {
  const s = flight(); const before = clone(s.glider), energy = s.energy;
  Model.step(s, DT / 2, { b: true }); assert.deepEqual(s.glider, before); assert.equal(s.energy, energy);
  Model.step(s, DT / 2, {}); assert.equal(s.glider.flaps, true); assert.equal(s.flapToggles, 1);
  assert.equal(s.glider.airspeed, 18); near(s.lastStep.normalSink, .58 + .018 * 4 ** 2);
  assert.equal(s.thermalEnergyAdded, 0); energyBalances(s);
  for (const speed of [12, 24]) {
    const clean = flight({ glider: { airspeed: speed } }), flaps = clone(clean);
    tick(clean); tick(flaps, { b: true });
    assert.equal(flaps.glider.airspeed, clean.glider.airspeed);
    if (speed === 12) assert.ok(flaps.lastStep.normalSink < clean.lastStep.normalSink);
    else assert.ok(flaps.lastStep.normalSink > clean.lastStep.normalSink);
    assert.ok(flaps.glider.stallSpeed < clean.glider.stallSpeed); energyBalances(clean); energyBalances(flaps);
  }
});

test('wind changes displacement and ground velocity but is not an airspeed or mechanical-energy source', () => {
  const calm = flight(), windy = flight({ wind: { x: 45, z: -23 } });
  ticks(calm, 600, { x: .2, y: -.1 }); ticks(windy, 600, { x: .2, y: -.1 });
  for (const key of ['altitude', 'airspeed', 'heading', 'bank', 'pitch']) near(windy.glider[key], calm.glider[key]);
  for (const key of ['energy', 'thermalEnergyAdded', 'energyDissipated', 'energyError']) near(windy[key], calm[key]);
  near(windy.glider.x - calm.glider.x, 450); near(windy.glider.z - calm.glider.z, -230);
  near(windy.glider.vx - calm.glider.vx, 45); near(windy.glider.vz - calm.glider.vz, -23);
});

test('thermal strength has the declared quadratic interior, zero boundary/exterior and additive overlap', () => {
  for (const [x, expected] of [[0, 4], [5, 3], [10, 0], [10.001, 0], [-10, 0]]) {
    const s = flight({ glider: { x }, thermals: [{ id: 'one', x: 0, z: 0, radius: 10, strength: 4 }] });
    tick(s); near(s.lastStep.thermalLift, expected); near(s.thermalEnergyAdded, 9.81 * expected * DT);
    near(s.glider.altitude, 1000 + (expected - .7) * DT); energyBalances(s);
  }
  const overlap = flight({ thermals: [{ id: 'a', x: 0, z: 0, radius: 10, strength: 4 }, { id: 'b', x: 0, z: 0, radius: 8, strength: 2 }] });
  tick(overlap); near(overlap.lastStep.thermalLift, 6); near(overlap.thermalEnergyAdded, 9.81 * 6 * DT);
});

test('thermal energy is sampled at tick start, not awarded for entering a field or retained after leaving it', () => {
  const s = flight({ glider: { z: -10.1 }, thermals: [{ id: 'field', x: 0, z: 0, radius: 10, strength: 4 }] });
  tick(s); assert.equal(s.lastStep.thermalLift, 0); assert.equal(s.thermalEnergyAdded, 0);
  assert.ok(s.glider.thermalLift > 0, 'current display can enter after the sampled starting position');
  tick(s); assert.ok(s.lastStep.thermalLift > 0); const gained = s.thermalEnergyAdded;
  // Boundary fixture relocates horizontally outside, preserving mechanical energy.
  s.glider.z = 11; tick(s); assert.equal(s.lastStep.thermalLift, 0); assert.equal(s.glider.thermalLift, 0);
  assert.equal(s.thermalEnergyAdded, gained); energyBalances(s);
});

test('bank and pitch approach bounded commands smoothly, with right/nose-up signs and no heading snaps', () => {
  const right = flight(), left = flight(), down = flight();
  tick(right, { x: 1, y: -1 }); tick(left, { x: -1, y: -1 }); tick(down, { y: 1 });
  assert.ok(right.glider.bank > 0 && right.glider.bank < .55); assert.ok(right.glider.pitch > 0 && right.glider.pitch < .18);
  assert.ok(right.glider.heading > 0 && right.glider.heading < .01); assert.ok(right.glider.x > 0);
  near(left.glider.bank, -right.glider.bank); near(left.glider.heading, -right.glider.heading); near(left.glider.x, -right.glider.x);
  assert.ok(right.glider.airspeed < 18); assert.ok(down.glider.pitch < 0); assert.ok(down.glider.airspeed > 18);
  assert.ok(down.lastStep.pitchHeightTransfer < 0);
  const oldBank = right.glider.bank, oldPitch = right.glider.pitch; tick(right);
  assert.ok(right.glider.bank > 0 && right.glider.bank < oldBank); assert.ok(right.glider.pitch > 0 && right.glider.pitch < oldPitch);
  ticks(right, 300, { x: 100, y: -100 });
  assert.ok(right.glider.bank <= .55 && right.glider.pitch <= .18); energyBalances(right);
});

test('a genuine low-speed stall adds sink and elapsed stall time but a normal descent is not a stall', () => {
  const normal = flight(); tick(normal); assert.ok(normal.glider.verticalSpeed < 0); assert.equal(normal.glider.stalled, false);
  assert.equal(normal.lastStep.stallSink, 0); assert.equal(normal.glider.stallTime, 0);
  const stalled = flight({ glider: { airspeed: 7 } }); tick(stalled);
  assert.equal(stalled.phase, 'playing'); assert.equal(stalled.glider.stalled, true); assert.equal(stalled.flightMode, 'stall');
  assert.ok(stalled.lastStep.stallSink > 3); near(stalled.glider.stallTime, DT); energyBalances(stalled);
  ticks(stalled, 240, { y: 1 }); assert.equal(stalled.phase, 'playing'); assert.equal(stalled.glider.stalled, false);
  assert.equal(stalled.glider.stallTime, 0); assert.equal(stalled.lastStep.stallSink, 0); assert.ok(stalled.glider.airspeed > 10.5);
  const zero = flight({ glider: { airspeed: 0 } }); ticks(zero, 60, { y: 1 });
  assert.ok(zero.glider.airspeed > 0); energyBalances(zero);
});

test('bank raises effective stall speed and stall reduces coordinated-turn authority without stopping motion', () => {
  const flat = flight({ glider: { airspeed: 11 } }), banked = flight({ glider: { airspeed: 11, bank: .55 } });
  tick(flat); tick(banked, { x: 1 }); assert.equal(flat.glider.stalled, false); assert.equal(banked.glider.stalled, true);
  near(banked.glider.stallSpeed, 10.5 * Math.sqrt(1 / Math.cos(.55)));
  const stalled = flight({ glider: { airspeed: 9, bank: .3 } });
  const lifting = flight({ glider: { airspeed: 9, bank: .3, flaps: true } });
  tick(stalled, { x: .3 / .55 }); tick(lifting, { x: .3 / .55 });
  assert.equal(stalled.glider.stalled, true); assert.equal(lifting.glider.stalled, false);
  near(stalled.lastStep.headingDelta, lifting.lastStep.headingDelta * .35);
  assert.ok(stalled.glider.z > 0); assert.ok(banked.lastStep.bankSink > 0);
});

test('A is held braking, B is an edge toggle, and sub-tick B pulses apply once on the next tick', () => {
  const s = flight(); ticks(s, 3, { a: true, b: true });
  assert.equal(s.flapToggles, 1); assert.equal(s.glider.flaps, true); assert.equal(s.glider.airbrake, true);
  near(s.glider.airspeed, 18 - 3 * 1.4 * DT); tick(s, { aPressed: true, b: true });
  assert.equal(s.glider.airbrake, false, 'aPressed without held A is not a brake'); assert.equal(s.lastStep.brakeSink, 0);
  tick(s); tick(s, { b: true }); assert.equal(s.flapToggles, 2); assert.equal(s.glider.flaps, false);
  const pulse = flight(); Model.step(pulse, DT / 2, { bPressed: true }); assert.equal(pulse.flapToggles, 0);
  Model.step(pulse, DT / 2, {}); assert.equal(pulse.flapToggles, 1); ticks(pulse, 10); assert.equal(pulse.flapToggles, 1);
});

test('cancellation clears queued B, neutralizes held controls and advances active physics without a queued replay', () => {
  const initial = flight(); tick(initial, { cancelEpoch: 8, b: true, a: true });
  assert.equal(initial.flapToggles, 1); assert.equal(initial.glider.airbrake, true, 'first epoch only establishes a baseline');
  const s = flight(); tick(s, { cancelEpoch: 2, x: 1, y: -1 }); const expected = clone(s);
  tick(expected); tick(s, { cancelEpoch: 3, x: 1, y: -1, a: true, b: true, bPressed: true });
  assert.deepEqual(s.glider, expected.glider); assert.equal(s.flapToggles, 0); assert.equal(s.tick, 2);
  ticks(s, 4, { cancelled: true, b: true, bPressed: true, a: true, x: 1 }); assert.equal(s.flapToggles, 0);
  tick(s, { b: true }); assert.equal(s.flapToggles, 0, 'continued B hold is not a new press');
  tick(s); tick(s, { b: true }); assert.equal(s.flapToggles, 1);
  const pending = flight(); Model.step(pending, DT / 2, { bPressed: true });
  Model.step(pending, DT / 2, { cancelled: true }); ticks(pending, 2); assert.equal(pending.flapToggles, 0);
});

test('fixed-step time partitioning agrees and numeric edge inputs keep the entire public state finite', () => {
  const a = flight(), b = flight();
  for (let i = 0; i < 20; i++) Model.step(a, .125, { x: .3, y: -.2, a: true });
  ticks(b, 150, { x: .3, y: -.2, a: true });
  const { _accumulator: ra, ...sa } = a, { _accumulator: rb, ...sb } = b;
  near(ra, rb, 1e-12); assert.deepEqual(sa, sb);
  const invalid = flight();
  for (const dt of [NaN, Infinity, -Infinity, -1, '1', undefined]) Model.step(invalid, dt, { x: NaN, y: Infinity });
  assert.equal(invalid.tick, 0); tick(invalid, { x: Infinity, y: NaN }); assert.equal(invalid.glider.bank, 0); assert.equal(invalid.glider.pitch, 0);
  Model.step(invalid, 100, {}); assert.equal(invalid.tick, 16, 'one oversized frame integrates at most .25 seconds');
  function finiteTree(value) { if (typeof value === 'number') assert.ok(Number.isFinite(value)); else if (value && typeof value === 'object') Object.values(value).forEach(finiteTree); }
  finiteTree(invalid); finiteTree(a);
  assert.equal(Model.create(NaN, Infinity).level, 1); assert.equal(Model.create(1, -10).level, 1); assert.equal(Model.create(1, 100).level, 3);
  assert.equal(Model.create(1, 1.9).level, 2);
});

test('swept cylinder catches an entire high-speed crossing whose endpoints both lie outside', () => {
  const s = sweep({ mountains: [mountain()] }); tick(s);
  assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'mountain'); assert.equal(s.collision.id, 'test-cylinder');
  near(s.collision.fraction, .35); near(s.glider.z, 7); near(s.collision.at, DT * .35);
  assert.equal(s.landingResult, null); energyBalances(s);
  const above = sweep({ glider: { altitude: 1200 }, mountains: [mountain()] }); tick(above);
  assert.equal(above.phase, 'playing'); assert.equal(above.collision, null); near(above.glider.z, 20);
});

test('cylinder overlap includes tangency but rejects a genuine near miss', () => {
  const tangent = sweep({ glider: { x: 3 }, mountains: [mountain()] }); tick(tangent);
  assert.equal(tangent.lostReason, 'mountain'); near(tangent.collision.fraction, .5); near(tangent.glider.x, 3);
  const miss = sweep({ glider: { x: 3.00001 }, mountains: [mountain()] }); tick(miss);
  assert.equal(miss.phase, 'playing'); assert.equal(miss.collision, null);
});

test('entering horizontally above a cylinder then descending through its top contacts inside the overlap interval', () => {
  const s = sweep({ glider: { altitude: 10.007 }, mountains: [mountain({ height: 10 })] }); tick(s);
  assert.equal(s.lostReason, 'mountain'); near(s.collision.fraction, .6, 1e-10); near(s.glider.altitude, 10);
  near(s.glider.z, 12, 1e-8); energyBalances(s);
  const tooLate = sweep({ glider: { altitude: 10.009 }, mountains: [mountain({ height: 10 })] }); tick(tooLate);
  assert.equal(tooLate.phase, 'playing', 'top descent after horizontal exit cannot collide');
  const stationary = flight({ wind: { z: -18 }, glider: { altitude: 10.005 }, mountains: [mountain({ z: 0, height: 10 })] });
  tick(stationary); assert.equal(stationary.lostReason, 'mountain'); near(stationary.glider.z, 0); near(stationary.glider.altitude, 10);
});

test('earliest contact includes the complete aircraft radius and ties prefer mountain, boundary, then ground', () => {
  const edge = sweep({ world: { zMax: 11 } }); tick(edge);
  assert.equal(edge.lostReason, 'boundary'); near(edge.collision.fraction, .5); near(edge.glider.z, 10);
  const all = sweep({ glider: { altitude: .7 * DT * .5 }, world: { zMax: 11 }, mountains: [mountain({ z: 13, height: 10 })] });
  tick(all); assert.equal(all.lostReason, 'mountain'); near(all.collision.fraction, .5);
  const boundaryGround = sweep({ glider: { altitude: .7 * DT * .5 }, world: { zMax: 11 } });
  tick(boundaryGround); assert.equal(boundaryGround.lostReason, 'boundary'); assert.equal(boundaryGround.landingResult, null);
  const earlier = sweep({ world: { zMax: 19 }, mountains: [mountain()] }); tick(earlier);
  assert.equal(earlier.lostReason, 'mountain'); near(earlier.collision.fraction, .35);
});

test('forward swept ring crossings count in geometric order, once each, with fractional event times', () => {
  const s = sweep({ rings: [ring('a', 5), ring('b', 10), ring('c', 15)] }); tick(s);
  assert.equal(s.checkpointsPassed, 3); assert.equal(s.nextRing, 3); assert.equal(s.score, 900);
  assert.ok(s.rings.every(r => r.passed)); assert.deepEqual(s.events.map(e => e.id), ['a', 'b', 'c']);
  s.events.forEach((e, i) => near(e.at, DT * (i + 1) / 4));
  s.glider.z = 0; tick(s); assert.equal(s.checkpointsPassed, 3); assert.equal(s.score, 900);
  assert.ok(!s.events.some(e => e.type === 'checkpoint'));
});

test('reverse, out-of-order and parallel-to-plane motion do not award ring progress', () => {
  const reversed = sweep({ glider: { z: 20, heading: Math.PI }, wind: { x: 0, z: -1182 }, rings: [ring('reverse', 10)] });
  tick(reversed); assert.equal(reversed.checkpointsPassed, 0);
  const ordered = sweep({ rings: [ring('first', 10), ring('second', 5)] }); tick(ordered);
  assert.equal(ordered.checkpointsPassed, 1); assert.equal(ordered.rings[0].passed, true); assert.equal(ordered.rings[1].passed, false);
  const parallel = flight({ glider: { x: -1, z: 10, radius: 1 }, wind: { x: 120, z: -18 }, rings: [ring('parallel', 10)] });
  tick(parallel); assert.equal(parallel.checkpointsPassed, 0);
});

test('ring aperture uses aircraft clearance in the vertical plane, with exact edge acceptance', () => {
  const crossingHeight = 1000 - .7 * DT * .5;
  for (const [x, radius, altitude, passed] of [[2, 3, crossingHeight, true], [2.00001, 3, crossingHeight, false],
    [0, .9, crossingHeight, false], [0, 3, crossingHeight - 2.00001, false]]) {
    const s = sweep({ glider: { x }, rings: [ring('aperture', 10, { radius, altitude })] }); tick(s);
    assert.equal(s.rings[0].passed, passed, `x=${x}, radius=${radius}, altitude=${altitude}`);
  }
  const sideFacing = flight({ wind: { x: 1200, z: -18 }, glider: { radius: 1 },
    rings: [ring('east-facing', 0, { x: 10, heading: Math.PI / 2, altitude: crossingHeight })] });
  tick(sideFacing); assert.equal(sideFacing.checkpointsPassed, 1);
});

test('rings before contact count, but equal-fraction and later crossings lose to physical contact', () => {
  const s = sweep({ rings: [ring('before', 6), ring('equal', 7), ring('after', 8)], mountains: [mountain()] });
  tick(s); assert.equal(s.checkpointsPassed, 1); assert.deepEqual(s.rings.map(r => r.passed), [true, false, false]);
  assert.equal(s.score, 300); assert.equal(s.lostReason, 'mountain');
  const ground = sweep({ glider: { altitude: .7 * DT * .5 }, rings: [ring('ground-tie', 10, { altitude: 0 })] });
  tick(ground); assert.equal(ground.checkpointsPassed, 0); assert.equal(ground.collision.type, 'ground');
});

test('landing readiness alone does not award a win; an actual safe downward contact does', () => {
  const airborne = landing({ glider: { altitude: 10 } }); tick(airborne);
  assert.equal(airborne.landingStatus.ready, true); assert.equal(airborne.phase, 'playing'); assert.equal(airborne.landingResult, null);
  const s = landing(); tick(s);
  assert.equal(s.phase, 'won'); assert.equal(s.flightMode, 'landed'); assert.equal(s.collision.type, 'ground');
  near(s.glider.altitude, 0); assert.equal(s.landingResult.accepted, true); assert.equal(s.landingResult.flags.ready, true);
  assert.equal(s.score, 1000 + Math.floor(s.remaining) * 10); energyBalances(s);
  const edge = landing({ glider: { x: 44 } }); tick(edge); assert.equal(edge.phase, 'won', 'full six-meter radius fits exactly at edge');
});

test('each landing safety conjunction is required and exposes its precise failed readiness flag', () => {
  const cases = [
    ['allRings', 'checkpoints', s => { s.rings = [ring('unpassed', 100)]; }],
    ['inside', 'outside-runway', s => { s.glider.x = 44.001; }],
    ['airSpeedOk', 'airspeed', s => { s.glider.airspeed = 14; }],
    ['airSpeedOk', 'airspeed', s => { s.glider.airspeed = 8.6; }],
    ['groundSpeedOk', 'ground-speed', s => { s.wind.z = 3; }],
    ['verticalSpeedOk', 'vertical-speed', s => { s.physics.configurations.flaps.minSink = 2; }],
    ['bankOk', 'bank', s => { s.glider.bank = .2; }, { x: .2 / .55 }],
    ['pitchOk', 'pitch', s => { s.glider.pitch = -.07; }, { y: .07 / .18 }],
    ['headingOk', 'heading', s => { s.glider.heading = .3; }],
    ['trackOk', 'track', s => { s.wind.x = 4; }],
    ['notStalled', 'stall', s => { s.glider.airspeed = 8; }]
  ];
  for (const [flag, reason, setup, input] of cases) {
    const s = landing(); setup(s); rebaseline(s); tick(s, input);
    assert.equal(s.phase, 'lost', flag); assert.equal(s.landingResult.accepted, false, flag);
    assert.equal(s.landingResult.flags[flag], false, flag); assert.equal(s.landingResult.flags.reason, reason, flag);
    energyBalances(s);
  }
  const rising = landing({ glider: { altitude: 0 }, thermals: [{ id: 'updraft', x: 0, z: 0, radius: 100, strength: 4 }] });
  tick(rising); assert.equal(rising.landingStatus.verticalSpeedOk, false); assert.equal(rising.phase, 'lost');
  const balanced = landing({ glider: { altitude: 0 },
    thermals: [{ id: 'balanced', x: 0, z: 0, radius: 100, strength: .58 + .018 * (12 - 14) ** 2 }] });
  tick(balanced); assert.equal(balanced.glider.verticalSpeed, 0); assert.equal(balanced.collision.fraction, 0);
  assert.equal(balanced.landingStatus.verticalSpeedOk, false); assert.equal(balanced.landingResult.accepted, false);
  assert.equal(balanced.phase, 'lost', 'resting at ground with zero descent is not an actual downward landing');
  const sinkBoundary = landing(); sinkBoundary.physics.configurations.flaps.minSink = 1.8 - .018 * (12 - 14) ** 2;
  tick(sinkBoundary); near(sinkBoundary.glider.verticalSpeed, -1.8); assert.equal(sinkBoundary.phase, 'won');
});

test('landing evaluates contact-fraction speed, attitude and current velocity rather than the full-tick endpoint', () => {
  const controls = { x: .1, y: .1 };
  const probe = landing({ glider: { altitude: 1000 } }); const old = clone(probe.glider); tick(probe, controls);
  const dh = probe.glider.altitude - 1000;
  const s = landing({ glider: { altitude: -dh / 2 } }); tick(s, controls);
  assert.equal(s.phase, 'won'); near(s.collision.fraction, .5, 1e-8);
  near(s.glider.bank, (old.bank + probe.glider.bank) / 2, 1e-10);
  near(s.glider.pitch, (old.pitch + probe.glider.pitch) / 2, 1e-10);
  near(s.glider.airspeed ** 2, (old.airspeed ** 2 + probe.glider.airspeed ** 2) / 2, 1e-8);
  near(s.glider.heading, probe.lastStep.headingDelta / 2, 1e-10);
  near(s.glider.vx, s.glider.airspeed * Math.cos(s.glider.pitch) * Math.sin(s.glider.heading));
  near(s.glider.vz, s.glider.airspeed * Math.cos(s.glider.pitch) * Math.cos(s.glider.heading));
  near(s.glider.groundSpeed, Math.hypot(s.glider.vx, s.glider.vz));
  near(s.landingResult.groundSpeed, s.glider.groundSpeed); near(s.landingResult.verticalSpeed, dh / DT, 1e-8);
  energyBalances(s);
});

test('contact heading interpolates an unwrapped turn across ±pi and runway/track errors use shortest angles', () => {
  const bank = .4, sink = .58 + .018 * (12 - 14) ** 2 + .9 * (1 / Math.cos(bank) - 1);
  const s = landing({ glider: { heading: Math.PI - .001, bank, altitude: sink * DT / 2 },
    runway: { heading: -Math.PI + .001, maxBank: .55 } });
  tick(s, { x: bank / .55 });
  const yaw = 9.81 * Math.tan(bank) / 12 * DT;
  assert.equal(s.phase, 'won'); near(s.collision.fraction, .5, 1e-10);
  near(s.glider.heading, wrap(Math.PI - .001 + yaw / 2)); assert.ok(s.glider.heading < -3);
  assert.ok(s.landingStatus.headingError < .01); assert.ok(s.landingStatus.trackError < .01);
  near(s.landingStatus.headingError, Math.abs(wrap(s.glider.heading - s.runway.heading)));
  near(s.glider.vx, 12 * Math.sin(s.glider.heading)); near(s.glider.vz, 12 * Math.cos(s.glider.heading)); energyBalances(s);
});

test('partial contact scales nonzero thermal, brake and sink transfers by the identical swept fraction', () => {
  const endSpeed = 18 - 1.4 * DT, averageSpeed = (18 + endSpeed) / 2;
  const s = sweep({ wind: { x: 0, z: 1200 - averageSpeed }, mountains: [mountain({ z: 8, height: 2000 })],
    thermals: [{ id: 'thermal', x: 0, z: 0, radius: 1e6, strength: 4 }] });
  tick(s, { a: true }); const f = .25;
  assert.equal(s.lostReason, 'mountain'); near(s.collision.fraction, f); near(s.lastStep.fraction, f);
  near(s.lastStep.thermalEnergy, 9.81 * 4 * DT * f);
  near(s.lastStep.brakeAndCapLoss, (18 ** 2 - endSpeed ** 2) / 2 * f);
  near(s.lastStep.dissipatedEnergy, ((18 ** 2 - endSpeed ** 2) / 2 + 9.81 * s.lastStep.sinkRate * DT) * f);
  near(s.glider.airspeed, Math.sqrt(18 ** 2 + (endSpeed ** 2 - 18 ** 2) * f));
  near(s.glider.altitude, 1000 + (4 - s.lastStep.sinkRate) * DT * f);
  assert.ok(s.thermalEnergyAdded > 0 && s.energyDissipated > 0); energyBalances(s);
});

test('the active deadline precedes final landing, ring credit, B toggle and physics on that tick', () => {
  const s = landing(); s.timeLimit = DT; const before = clone(s.glider);
  s.rings = [ring('would-cross', .05, { altitude: .003, radius: 20 })];
  tick(s, { b: true, a: true });
  assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'timeout'); assert.equal(s.remaining, 0);
  assert.deepEqual(s.glider, before); assert.equal(s.checkpointsPassed, 0); assert.equal(s.flapToggles, 0);
  assert.equal(s.landingResult, null); assert.equal(s.collision, null); assert.equal(s.lastStep, null);
  assert.equal(s.thermalEnergyAdded, 0); assert.equal(s.energyDissipated, 0);
  const justBefore = landing(); justBefore.timeLimit = 2 * DT; tick(justBefore); assert.equal(justBefore.phase, 'won');
});

test('flight status and message follow the current glide/thermal/brake/stall/approach condition', () => {
  const s = flight(); tick(s); assert.equal(s.flightMode, 'glide'); const glideMessage = s.message;
  s.thermals = [{ id: 'field', x: s.glider.x, z: s.glider.z, radius: 100, strength: 4 }];
  tick(s); assert.equal(s.flightMode, 'thermal'); assert.notEqual(s.message, glideMessage); const thermalMessage = s.message;
  tick(s, { a: true, b: true }); assert.equal(s.flightMode, 'airbrake'); assert.notEqual(s.message, thermalMessage);
  s.thermals = []; tick(s); assert.equal(s.flightMode, 'glide'); assert.equal(s.message, glideMessage);
  s.glider.airspeed = 7; rebaseline(s); tick(s); assert.equal(s.flightMode, 'stall'); assert.match(s.message, /失速/);
  s.glider.airspeed = 12; s.rings = []; rebaseline(s); tick(s); assert.equal(s.flightMode, 'approach'); assert.match(s.message, /观测完成/);
  assert.equal(s.glider.flaps, true); assert.match(s.message, /襟翼已展开/);
  tick(s, { b: true }); assert.equal(s.glider.flaps, false); assert.equal(s.flightMode, 'approach');
  assert.match(s.message, /展开襟翼/); assert.doesNotMatch(s.message, /襟翼已展开/);
  assert.equal(s.landingStatus.allRings, true); assert.equal(s.nextRing, 0); assert.equal(s.checkpointCount, 0);
});

test('terminal outcomes freeze every field, retry resources are independent, and JSON round trips continue identically', () => {
  for (const s of [landing(), sweep({ mountains: [mountain()] })]) {
    tick(s); assert.ok(['won', 'lost'].includes(s.phase)); const frozen = clone(s);
    for (const dt of [DT, .25, 100, NaN]) Model.step(s, dt, { a: true, bPressed: true, x: 1, y: -1, cancelEpoch: 100 });
    assert.deepEqual(s, frozen);
  }
  const flown = Model.create(3, 1), original = clone(flown); ticks(flown, 100, { x: .3, y: -.1, b: true });
  const fresh = Model.create(3, 1); assert.deepEqual(fresh, original);
  assert.notStrictEqual(fresh.glider, flown.glider); assert.notStrictEqual(fresh.rings[0], flown.rings[0]);
  assert.notStrictEqual(fresh.physics.configurations.flaps, flown.physics.configurations.flaps);
  assert.notStrictEqual(fresh.thermals[0], flown.thermals[0]); assert.notStrictEqual(fresh.mountains[0], flown.mountains[0]);
  const restored = clone(flown); ticks(flown, 60, { x: -.2 }); ticks(restored, 60, { x: -.2 }); assert.deepEqual(restored, flown);
  assert.ok(flown.events.length <= 32); assert.equal(fresh.flapToggles, 0); assert.equal(fresh.thermalEnergyAdded, 0);
});

// Ordinary-control demonstrations use one defined runtime schedule: 60 Hz
// physics, observation every five ticks, and normalized digital diagonals.
// The pilot receives only public snapshots. This proves playable courses, not
// guaranteed wins for every possible observation cadence or flight decision.
function publicSnapshot(s) {
  return { phase: s.phase, paused: false,
    model: clone(Object.fromEntries(Object.entries(s).filter(([key]) => !key.startsWith('_')))) };
}
for (let difficulty = 0; difficulty < 3; difficulty++) {
  test(`authored course ${difficulty + 1} completes through public feedback, ordinary controls and actual landing`, async () => {
    const automation = await import('./automation.mjs');
    const pilot = automation.createPilot(), s = Model.create(1, difficulty);
    const initial = publicSnapshot(s), trace = [];
    let held = [], previousA = false, previousB = false, previousPassed = 0;
    const checkpoints = [];
    for (let frame = 0; frame < 5400 && s.phase === 'playing'; frame++) {
      if (frame % 5 === 0) {
        const observation = publicSnapshot(s);
        trace.push({ state: observation });
        held = pilot(observation, { elapsed: s.elapsed, mode: 'qa' });
        assert.ok(Array.isArray(held));
        assert.ok(held.every(key => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'b'].includes(key)));
      }
      const x = Number(held.includes('ArrowRight')) - Number(held.includes('ArrowLeft'));
      const y = Number(held.includes('ArrowDown')) - Number(held.includes('ArrowUp'));
      const length = Math.max(1, Math.hypot(x, y));
      const a = held.includes('Space'), b = held.includes('b');
      Model.step(s, DT, { x: x / length, y: y / length, a, b,
        aPressed: a && !previousA, bPressed: b && !previousB, cancelEpoch: 0 });
      previousA = a; previousB = b;
      energyBalances(s);
      assert.ok(s.checkpointsPassed >= previousPassed);
      previousPassed = s.checkpointsPassed;
      for (const event of s.events) if (event.type === 'checkpoint') checkpoints.push(event.id);
      assert.ok(s.glider.altitude >= -1e-8);
      assert.ok(s.glider.airspeed >= 0 && s.glider.airspeed <= s.physics.maxAirspeed + 1e-8);
    }
    const after = publicSnapshot(s); trace.push({ state: after });
    automation.assertProgress({ after, trace, initial }, assert);
    assert.deepEqual(checkpoints, s.rings.map(r => r.id), 'every required ring crossed exactly once in order');
    assert.equal(s.collision.type, 'ground');
    assert.equal(s.landingResult.accepted, true);
    assert.ok(s.glider.verticalSpeed < 0, 'success is an actual descending touchdown');
    const terminal = clone(s); Model.step(s, DT, { x: 1, y: -1, a: true, b: true });
    assert.deepEqual(s, terminal);
  });
}
