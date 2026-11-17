'use strict';

// FORMAL RULE TESTS ONLY. Synthetic state fixtures below are not reachable-run,
// browser, duration, ordinary-play, capture, or private-route evidence.
// First execution requires root's complete source review of this file and model.
const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');
const { create, step, config } = Model;
const copy = value => JSON.parse(JSON.stringify(value));

function synthetic(patch = {}, level = 0) {
  return Object.assign(create(740, level), { inputArmed: true }, patch);
}

function assertNoop(state, dt, input) {
  const before = copy(state);
  const references = [state.events, state.seals, state.lastAction];
  assert.equal(step(state, dt, input), state);
  assert.deepEqual(state, before);
  assert.equal(state.events, references[0]);
  assert.equal(state.seals, references[1]);
  assert.equal(state.lastAction, references[2]);
}

function assertBounds(state) {
  function finite(value) {
    if (typeof value === 'number') assert.ok(Number.isFinite(value));
    else if (value && typeof value === 'object') Object.values(value).forEach(finite);
  }
  finite(state);
  assert.ok(state.pressure >= 0 && state.pressure <= 110);
  assert.ok(state.heat >= 0 && state.heat <= 100);
  assert.ok(state.remainder >= 0 && state.remainder < 0.05);
  assert.ok(state.totalHeatDose >= 0 && state.totalHeatDose <= 321.3);
  assert.ok(state.seals.length <= 3 && state.events.length <= 1);
  assert.ok(state.message.length <= 160);
  for (const key of ['tick', 'inBandTicks', 'materialInBandTicks', 'dwellResets']) {
    assert.ok(Number.isInteger(state[key]) && state[key] >= 0 && state[key] <= 2147483647);
  }
  assert.equal(state.materialIndex, state.seals.length);
  assert.equal(state.score, state.seals.length * 100);
  if (!state.counterSaturated) {
    const ledger = state.seals.reduce((sum, seal) => sum + seal.dose, 0) + state.dose;
    const tolerance = 64 * Number.EPSILON * (state.tick + 4) * Math.max(1, Math.abs(state.totalHeatDose), Math.abs(ledger));
    assert.ok(Math.abs(state.totalHeatDose - ledger) <= tolerance);
    assert.equal(state.inBandTicks, state.seals.reduce((sum, seal) => sum + seal.inBandTicks, 0) + state.materialInBandTicks);
  }
}

test('public API and all three immutable scenario tables match the accepted specification', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['config', 'create', 'step']);
  assert.equal(config.tickSeconds, 0.05);
  assert.equal(config.burstPressure, 110);
  assert.equal(config.maxCounter, 2147483647);
  assert.equal(config.defaultSeed, 740);
  assert.deepEqual(config.materials, {
    tin: { name: 'TIN', safeHeat: 68, doseBudget: 90 },
    fiber: { name: 'FIBER', safeHeat: 62, doseBudget: 105 },
    foil: { name: 'FOIL', safeHeat: 58, doseBudget: 120 }
  });
  assert.deepEqual(config.scenarios.map(s => [s.id, s.name, s.stages.map(t => [t.material, t.low, t.high, t.holdTicks])]), [
    ['starter', 'STARTER', [['tin', 22, 38, 120], ['fiber', 46, 62, 130], ['foil', 70, 86, 140]]],
    ['swap', 'SWAP', [['fiber', 42, 56, 130], ['tin', 20, 34, 130], ['foil', 58, 72, 140]]],
    ['heavy', 'HEAVY', [['foil', 66, 80, 140], ['tin', 36, 50, 140], ['fiber', 78, 92, 150]]]
  ]);
  function frozen(value) {
    assert.ok(Object.isFrozen(value));
    Object.values(value).forEach(child => { if (child && typeof child === 'object') frozen(child); });
  }
  frozen(config);
  assert.throws(() => { config.scenarios[0].stages[0].low = 0; }, TypeError);
});

test('complete initial state, normalization and fresh reference identities', () => {
  const initial = create(740, 0);
  assert.deepEqual(initial, {
    schema: 1, seed: 740, level: 0, phase: 'playing', reason: '', tick: 0, remainder: 0,
    counterSaturated: false, materialIndex: 0, pressure: 0, heat: 0, dose: 0, totalHeatDose: 0,
    holdTicks: 0, inBandTicks: 0, dwellResets: 0, materialInBandTicks: 0, materialPeakHeat: 0,
    inputArmed: false, cancelEpoch: null, cancelledLast: false, lastAction: { a: false, b: false },
    seals: [], score: 0, events: [], message: '按住 A 加热加压，提前松手；按住 B 泄压。'
  });
  for (const seed of [undefined, null, '740', NaN, Infinity, -1, 1.5, 4294967296]) assert.equal(create(seed, 0).seed, 740);
  for (const seed of [0, 740, 4294967295]) assert.equal(create(seed, 0).seed, seed);
  for (const level of [undefined, null, '1', NaN, Infinity, -1, 0.5, 3]) assert.equal(create(740, level).level, 0);
  for (const level of [0, 1, 2]) assert.equal(create(740, level).level, level);
  const other = create(740, 0);
  for (const key of ['seals', 'events', 'lastAction']) assert.notEqual(initial[key], other[key]);
  initial.events.push({ type: 'synthetic' });
  initial.lastAction.a = true;
  assert.deepEqual(other.events, []);
  assert.deepEqual(other.lastAction, { a: false, b: false });
  assertBounds(other);
});

test('fresh gate requires real neutral input; a short pulse cannot substitute for a held sample', () => {
  const state = create(740, 0);
  step(state, 0.05, { a: true });
  assert.equal(state.inputArmed, false);
  assert.equal(state.heat, 0);
  assert.deepEqual(state.lastAction, { a: false, b: false });
  step(state, 0.01, {});
  assert.equal(state.inputArmed, true);
  assert.equal(state.tick, 1);
  step(state, 0.04, { a: true });
  assert.equal(state.heat, 100 / 60);
  assert.equal(state.tick, 2);
  const pulse = synthetic();
  step(pulse, 0.01, { a: true, aPressed: true });
  step(pulse, 0.04, { b: true });
  assert.equal(pulse.heat, 0);
  assert.deepEqual(pulse.lastAction, { a: false, b: true });
});

test('finite legal heating followed by release retains heat and rising pressure; B then vents', () => {
  // Fixed short rule stimulus, not a search or a complete-round route.
  const state = create(740, 0);
  step(state, 0.05, {});
  for (let i = 0; i < 60; i += 1) step(state, 0.05, { a: true });
  assert.equal(state.phase, 'playing');
  const before = copy(state);
  assert.ok(before.heat > 40 && before.pressure > 0);
  step(state, 0.05, {});
  const releasedHeat = before.heat + (0 - before.heat) / 60;
  assert.equal(state.heat, releasedHeat);
  assert.equal(state.pressure, before.pressure + 0.05 * (0.15 * releasedHeat - 5));
  assert.ok(state.heat < before.heat && state.pressure > before.pressure);
  assert.deepEqual(state.lastAction, { a: false, b: false });
  const releasedPressure = state.pressure, releasedTemperature = state.heat;
  step(state, 0.05, { b: true });
  assert.ok(state.pressure < releasedPressure && state.heat > 0 && state.heat < releasedTemperature);
  assertBounds(state);
});

test('synthetic maximum heat shows independent A+B combination and the pressure floor', () => {
  const both = synthetic({ pressure: 50, heat: 100 });
  step(both, 0.05, { a: true, b: true });
  assert.equal(both.heat, 100);
  assert.equal(both.pressure, 50.05);
  assert.equal(both.dose, 1.6);
  assert.deepEqual(both.lastAction, { a: true, b: true });
  const vent = synthetic({ pressure: 50, heat: 100 });
  step(vent, 0.05, { b: true });
  assert.ok(vent.pressure < 50 && vent.heat > 0);
  const floor = synthetic({ pressure: 0.1 });
  step(floor, 0.05, { b: true });
  assert.equal(floor.pressure, 0);
  assertBounds(both);
  assertBounds(vent);
  assertBounds(floor);
});

test('synthetic exact inclusive endpoints qualify, but entry and departure ticks do not', () => {
  const cases = [
    { pressure: 22, heat: 60, action: {}, qualifies: true },
    { pressure: 38, heat: 0, action: {}, qualifies: true },
    { pressure: 22.25, heat: 0, action: {}, qualifies: true, result: 22 },
    { pressure: 38 - 0.05, heat: 100, action: { a: true, b: true }, qualifies: true, result: 38 },
    { pressure: 22 - 1e-10, heat: 60, action: {}, qualifies: false },
    { pressure: 38 + 1e-10, heat: 0, action: {}, qualifies: false },
    { pressure: 22.1, heat: 0, action: {}, qualifies: false },
    { pressure: 37.9, heat: 100, action: { a: true }, qualifies: false }
  ];
  for (const fixture of cases) {
    const state = synthetic({ pressure: fixture.pressure, heat: fixture.heat, holdTicks: 5, inBandTicks: 5, materialInBandTicks: 5 });
    step(state, 0.05, fixture.action);
    if (fixture.result !== undefined) assert.equal(state.pressure, fixture.result);
    assert.equal(state.holdTicks, fixture.qualifies ? 6 : 0);
    assert.equal(state.dwellResets, fixture.qualifies ? 0 : 1);
    assert.equal(state.inBandTicks, fixture.qualifies ? 6 : 5);
    assertBounds(state);
  }
});

test('synthetic interrupted near-complete dwell cannot carry into a new attempt', () => {
  const state = synthetic({ pressure: 22.1, holdTicks: 119, inBandTicks: 119, materialInBandTicks: 119 });
  step(state, 0.05, {});
  assert.equal(state.holdTicks, 0);
  assert.equal(state.dwellResets, 1);
  assert.equal(state.seals.length, 0);
  // A separate synthetic re-entry boundary; no claim about a route between fixtures.
  Object.assign(state, { pressure: 22 - 1e-10, heat: 60 });
  step(state, 0.05, {});
  assert.equal(state.holdTicks, 0);
  step(state, 0.05, {});
  assert.equal(state.holdTicks, 1);
  assert.equal(state.inBandTicks, 120);
  assert.equal(state.seals.length, 0);
  assertBounds(state);
});

test('synthetic dose equality loses before completion for every material; below equality can seal', () => {
  for (const level of [0, 1, 2]) {
    const stage = config.scenarios[level].stages[0], material = config.materials[stage.material];
    const addition = (100 - material.safeHeat) * 0.05;
    const dose = material.doseBudget - addition;
    const state = synthetic({ pressure: (stage.low + stage.high) / 2, heat: 100, dose, totalHeatDose: dose,
      holdTicks: stage.holdTicks - 1, inBandTicks: stage.holdTicks - 1, materialInBandTicks: stage.holdTicks - 1 }, level);
    step(state, 0.05, { a: true });
    assert.equal(state.dose, material.doseBudget);
    assert.equal(state.phase, 'lost');
    assert.equal(state.reason, 'overheat');
    assert.equal(state.holdTicks, stage.holdTicks - 1);
    assert.equal(state.seals.length, 0);
    assert.deepEqual(state.events, [{ type: 'collision', reason: 'overheat', materialIndex: 0, tick: 1 }]);
    assertBounds(state);
  }
  const below = synthetic({ pressure: 30, heat: 100, dose: 90 - 1.6 - 1e-10, totalHeatDose: 90 - 1.6 - 1e-10,
    holdTicks: 119, inBandTicks: 119, materialInBandTicks: 119 });
  step(below, 0.05, { a: true });
  assert.equal(below.phase, 'playing');
  assert.equal(below.seals.length, 1);
  assert.ok(below.seals[0].dose < 90);
  assertBounds(below);
});

test('synthetic burst equality beats simultaneous overheat, retains damage and freezes hold counters', () => {
  const state = synthetic({ pressure: 110 - 0.65, heat: 100, dose: 90 - 1.6, totalHeatDose: 90 - 1.6,
    holdTicks: 119, inBandTicks: 119, materialInBandTicks: 119, remainder: 0.01 });
  step(state, 0.25, { a: true });
  assert.equal(state.phase, 'lost');
  assert.equal(state.reason, 'burst');
  assert.equal(state.pressure, 110);
  assert.equal(state.dose, 90);
  assert.equal(state.totalHeatDose, 90);
  assert.equal(state.tick, 1);
  assert.equal(state.remainder, 0);
  assert.equal(state.holdTicks, 119);
  assert.equal(state.inBandTicks, 119);
  assert.equal(state.dwellResets, 0);
  assert.equal(state.seals.length, 0);
  assert.deepEqual(state.events, [{ type: 'collision', reason: 'burst', materialIndex: 0, tick: 1 }]);
  const overrun = synthetic({ pressure: 109.9, heat: 100 });
  step(overrun, 0.05, { a: true });
  assert.equal(overrun.pressure, 110);
  assert.equal(overrun.reason, 'burst');
  assertBounds(state);
  assertBounds(overrun);
});

test('synthetic seal attributes heat to old material, preserves plant, and starts next dose at zero', () => {
  const state = synthetic({ pressure: 30, heat: 70, dose: 12, totalHeatDose: 12,
    holdTicks: 119, inBandTicks: 125, materialInBandTicks: 125, materialPeakHeat: 70 });
  step(state, 0.05, {});
  const heat = 70 + (0 - 70) / 60;
  const sealedDose = 12 + Math.max(0, heat - 68) * 0.05;
  assert.equal(state.materialIndex, 1);
  assert.equal(state.heat, heat);
  assert.equal(state.pressure, 30 + 0.05 * (0.15 * heat - 5));
  assert.equal(state.seals[0].dose, sealedDose);
  assert.equal(state.seals[0].peakHeat, 70);
  assert.equal(state.seals[0].inBandTicks, 126);
  assert.equal(state.dose, 0);
  assert.equal(state.holdTicks, 0);
  assert.equal(state.materialInBandTicks, 0);
  assert.equal(state.materialPeakHeat, heat);
  assert.equal(state.totalHeatDose, sealedDose);
  assert.deepEqual(state.events, [{ type: 'delivery', materialIndex: 0, tick: 1 }]);
  const seal = copy(state.seals[0]);
  step(state, 0.05, {});
  const nextHeat = heat + (0 - heat) / 60;
  assert.equal(state.dose, Math.max(0, nextHeat - 62) * 0.05);
  assert.deepEqual(state.seals[0], seal);
  assert.deepEqual(state.events, []);
  assertBounds(state);
});

test('synthetic completing fixtures cover every stage in each scenario and exact win receipts', () => {
  for (const level of [0, 1, 2]) {
    const state = synthetic({}, level);
    for (const [index, stage] of config.scenarios[level].stages.entries()) {
      // Explicit per-stage synthetic boundary injection, never ordinary play evidence.
      Object.assign(state, { pressure: (stage.low + stage.high) / 2, heat: 0, dose: 0,
        holdTicks: stage.holdTicks - 1, materialInBandTicks: stage.holdTicks - 1, materialPeakHeat: 0 });
      state.tick += stage.holdTicks - 1;
      state.inBandTicks += stage.holdTicks - 1;
      const completingTick = state.tick + 1;
      step(state, 0.05, {});
      assert.deepEqual(state.seals[index], {
        index, material: stage.material, low: stage.low, high: stage.high,
        requiredTicks: stage.holdTicks, holdTicks: stage.holdTicks, completedTick: completingTick,
        pressure: (stage.low + stage.high) / 2 - 0.25, heat: 0, dose: 0, peakHeat: 0, inBandTicks: stage.holdTicks
      });
      assert.equal(state.materialIndex, index + 1);
      assert.equal(state.holdTicks, 0);
      assert.equal(state.materialInBandTicks, 0);
      assert.equal(state.score, 100 * (index + 1));
      assert.equal(state.phase, index === 2 ? 'won' : 'playing');
      assertBounds(state);
    }
    assert.deepEqual(state.events, [{ type: 'win', tick: state.tick }]);
    assert.equal(state.reason, '');
    assert.equal(state.seals.length, 3);
    assertNoop(state, 0.25, { a: true, cancelled: true, cancelEpoch: 999 });
  }
});

test('zero, invalid and paused durations are exact no-ops, including events and references', () => {
  const state = synthetic({ pressure: 30, heat: 60, holdTicks: 5, remainder: 0.02,
    events: [{ type: 'delivery', materialIndex: 0, tick: 0 }] });
  const hostile = Object.defineProperty({}, 'paused', { get() { throw Error('invalid duration must not read input'); } });
  for (const dt of [undefined, null, '0.05', NaN, Infinity, -Infinity, -1, 0, 0.250000001]) assertNoop(state, dt, hostile);
  assertNoop(state, 0.05, Object.freeze({ paused: true, a: true, cancelled: true, cancelEpoch: 9 }));
});

test('only literal own data properties act; inherited fields, getters, arrays and functions are ignored', () => {
  let getters = 0;
  const accessors = {};
  for (const key of ['a', 'b', 'paused', 'cancelled', 'cancelEpoch']) Object.defineProperty(accessors, key, { get() { getters += 1; return true; } });
  const inherited = Object.create({ a: true, b: true, paused: true, cancelled: true, cancelEpoch: 1 });
  const array = Object.assign([], { a: true, paused: true });
  const callable = Object.assign(function () {}, { a: true, paused: true });
  for (const input of [accessors, inherited, array, callable, null, undefined, true, 7, 'a', { a: 1, b: 'true' },
    { aPressed: true, bPressed: true, x: 1, y: -1, start: true, select: true, unknown: true }]) {
    const state = synthetic();
    step(state, 0.05, input);
    assert.equal(state.tick, 1);
    assert.equal(state.heat, 0);
    assert.deepEqual(state.lastAction, { a: false, b: false });
    assert.equal(state.cancelEpoch, null);
  }
  assert.equal(getters, 0);
  const input = Object.create(null);
  Object.defineProperty(input, 'a', { value: true, enumerable: false });
  Object.freeze(input);
  const own = synthetic();
  step(own, 0.05, input);
  assert.equal(own.heat, 100 / 60);
  assert.deepEqual(own.lastAction, { a: true, b: false });
});

test('cancellation on a no-tick call closes gate, preserves remainder and advances neutral physics', () => {
  const state = synthetic({ pressure: 30, heat: 60, holdTicks: 5, inBandTicks: 5, materialInBandTicks: 5,
    lastAction: { a: true, b: false } });
  step(state, 1 / 60, { a: true, cancelled: true, cancelEpoch: 4 });
  assert.equal(state.inputArmed, false);
  assert.equal(state.cancelEpoch, 4);
  assert.equal(state.tick, 0);
  assert.equal(state.heat, 60);
  assert.equal(state.holdTicks, 5);
  assert.equal(state.remainder, 1 / 60);
  step(state, 1 / 60, { cancelled: true, cancelEpoch: 4 });
  assert.equal(state.inputArmed, false);
  assert.equal(state.tick, 0);
  step(state, 1 / 60, { a: true, cancelled: true, cancelEpoch: 4 });
  assert.equal(state.heat, 59);
  assert.equal(state.pressure, 30 + 0.05 * (0.15 * 59 - 5));
  assert.equal(state.holdTicks, 6);
  assert.equal(state.inputArmed, false);
  assert.deepEqual(state.lastAction, { a: false, b: false });
  step(state, 1 / 60, { cancelEpoch: 4 });
  assert.equal(state.inputArmed, true);
  assert.equal(state.tick, 1);
  step(state, 1 / 60, { a: true, cancelEpoch: 4 });
  step(state, 1 / 60, { a: true, cancelEpoch: 4 });
  assert.equal(state.heat, 59 + (100 - 59) / 60);
  assert.deepEqual(state.lastAction, { a: true, b: false });
  assertBounds(state);
});

test('epoch changes suppress held input; baseline and malformed epochs do not invent cancellation', () => {
  const state = synthetic({ cancelEpoch: 4, heat: 60, pressure: 30 });
  step(state, 0.05, { a: true, cancelEpoch: 5 });
  assert.equal(state.inputArmed, false);
  assert.equal(state.heat, 59);
  step(state, 0.05, { a: true, cancelEpoch: 5 });
  assert.equal(state.inputArmed, false);
  assert.deepEqual(state.lastAction, { a: false, b: false });
  for (const epoch of [undefined, null, '1', -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    const armed = synthetic({ cancelEpoch: 4 });
    step(armed, 0.05, { a: true, cancelEpoch: epoch });
    assert.equal(armed.cancelEpoch, 4);
    assert.equal(armed.heat, 100 / 60);
    const unarmed = create(740, 0);
    step(unarmed, 0.05, { a: true, cancelEpoch: epoch });
    assert.equal(unarmed.inputArmed, false);
  }
  const baseline = synthetic();
  step(baseline, 0.05, { a: true, cancelEpoch: 0 });
  assert.equal(baseline.heat, 100 / 60);
  assert.equal(baseline.cancelEpoch, 0);
});

test('synthetic cancelled neutral tick may legitimately finish a dwell without resetting plant', () => {
  const state = synthetic({ pressure: 30, heat: 60, holdTicks: 119, inBandTicks: 119,
    materialInBandTicks: 119, remainder: 0.025 });
  step(state, 0.025, { a: true, cancelled: true, cancelEpoch: 1 });
  assert.equal(state.inputArmed, false);
  assert.equal(state.materialIndex, 1);
  assert.equal(state.seals.length, 1);
  assert.equal(state.seals[0].holdTicks, 120);
  assert.equal(state.heat, 59);
  assert.equal(state.pressure, 30 + 0.05 * (0.15 * 59 - 5));
  assert.equal(state.remainder, 0);
  assertBounds(state);
});

test('synthetic upper clock boundary gives five ticks with one subtraction; epsilon only repairs time', () => {
  const state = synthetic({ remainder: 0.05 - Number.EPSILON / 32 });
  step(state, 0.25, {});
  assert.equal(state.tick, 5);
  assert.equal(state.remainder, 0.04999999999999999);
  assertBounds(state);
  const nearTick = synthetic();
  step(nearTick, 0.05 - 5e-13, {});
  assert.equal(nearTick.tick, 1);
  assert.equal(nearTick.remainder, 0);
  const batch = synthetic(), separate = synthetic();
  step(batch, 0.25, { a: true });
  for (let i = 0; i < 5; i += 1) step(separate, 0.05, { a: true });
  assert.deepEqual(batch, separate);
});

test('synthetic counters saturate without freezing physics or growing state arrays', () => {
  const max = 2147483647;
  const state = synthetic({ tick: max, inBandTicks: max, materialInBandTicks: max,
    pressure: 30, holdTicks: 5 });
  step(state, 0.05, {});
  assert.equal(state.tick, max);
  assert.equal(state.inBandTicks, max);
  assert.equal(state.materialInBandTicks, max);
  assert.equal(state.counterSaturated, true);
  assert.equal(state.pressure, 29.75);
  assert.equal(state.holdTicks, 6);
  assertBounds(state);
  const reset = synthetic({ dwellResets: max, pressure: 22.1, holdTicks: 5 });
  step(reset, 0.05, {});
  assert.equal(reset.dwellResets, max);
  assert.equal(reset.counterSaturated, true);
  assert.equal(reset.holdTicks, 0);
  assertBounds(reset);
});

test('retry recreates every dirty field and references; lost states are exact terminal no-ops', () => {
  for (const level of [0, 1, 2]) {
    const dirty = synthetic({ pressure: 109.9, heat: 100, dose: 4, totalHeatDose: 4,
      holdTicks: 5, inBandTicks: 5, materialInBandTicks: 5, cancelEpoch: 7, remainder: 0.01 }, level);
    step(dirty, 0.05, { a: true, cancelEpoch: 7 });
    assert.equal(dirty.phase, 'lost');
    for (const dt of [0, -1, 0.05, 0.25, Infinity]) assertNoop(dirty, dt, { a: true, b: true, cancelled: true, cancelEpoch: 8 });
    const retry = create(dirty.seed, dirty.level), fresh = create(740, level);
    assert.deepEqual(retry, fresh);
    for (const key of ['seals', 'events', 'lastAction']) {
      assert.notEqual(retry[key], dirty[key]);
      assert.notEqual(retry[key], fresh[key]);
    }
    assertBounds(retry);
  }
});

test('identical accepted input sequences are deterministic and recorded seed adds no disturbance', () => {
  const first = create(740, 2), second = create(740, 2), otherSeed = create(0, 2);
  const sequence = [
    [1 / 60, {}], [1 / 60, { a: true }], [1 / 60, { a: true }],
    [0.05, { a: true, b: true }], [0.01, { cancelled: true, cancelEpoch: 1 }],
    [0.04, { a: true, cancelled: true, cancelEpoch: 1 }], [0.05, {}], [0.05, { b: true }]
  ];
  for (const [dt, input] of sequence) {
    step(first, dt, input); step(second, dt, input); step(otherSeed, dt, input);
    assert.deepEqual(first, second);
    assert.deepEqual({ ...otherSeed, seed: 740 }, first);
    assertBounds(first);
  }
});
