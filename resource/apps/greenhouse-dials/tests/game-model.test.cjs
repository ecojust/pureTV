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
function ticks(s, count, input = {}) { for (let i = 0; i < count; i++) tick(s, input); return s; }
function near(actual, expected, message) { assert.ok(Math.abs(actual - expected) < 1e-9, `${message || ''}: ${actual} vs ${expected}`); }
function pulse(s, button) { tick(s, { [button]: true }); tick(s); }
function act(s, key) { tick(s, key); tick(s); }
const dial = (s, id) => s.dials.find(item => item.id === id);

// SYNTHETIC RULE FIXTURES ONLY. These explicitly mutate public state to isolate
// one tick or a boundary. They are not ordinary play, feasibility evidence,
// browser input demonstrations, or author solutions. Ordinary rounds live in
// the separately reviewed public-observation harness.
function still(environment = { temperature: 27, humidity: 60, soilMoisture: 50 }) {
  const s = Model.create(7, 0);
  s.environment = clone(environment);
  for (const key of Object.keys(s.physics)) s.physics[key] = 0;
  s.weatherPeriods.forEach(period => { period.heatInput = 0; });
  return s;
}
function atDeadline(s) { s.tick = 5399; s.elapsed = s.tick / 60; s.remaining = 90 - s.elapsed; return s; }
function lastGrowth(s) { s.crops.forEach(crop => { crop.growthTicks = crop.maturityTicks - 1; }); return s; }
function emptyWater(s) { s.reservoir.usedLitres = s.reservoir.initialLitres; s.reservoir.remainingLitres = 0; return s; }
function invariant(s) {
  near(s.reservoir.initialLitres, s.reservoir.remainingLitres + s.reservoir.usedLitres, 'water ledger');
  assert.equal(s.commandCount, s.appliedCommandCount + s.pendingCommands.length);
  assert.ok(s.pendingCommands.length <= s.delayTicks);
  assert.ok(s.dials.every(d => [0, 1, 2].includes(d.appliedLevel) && [0, 1, 2].includes(d.requestedLevel)));
  assert.equal(s.matureCount, s.crops.filter(crop => crop.mature).length);
  assert.deepEqual(s.deadCropIds, s.crops.filter(crop => crop.dead).map(crop => crop.id));
  assert.deepEqual(s.unfinishedCropIds, s.crops.filter(crop => !crop.mature).map(crop => crop.id));
  assert.ok(s.events.length <= 32);
}

test('UMD creates independent public three-crop levels with actual initial comfort and no invented growth', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['TICK_HZ', 'create', 'step']);
  assert.equal(Model.TICK_HZ, 60);
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(modelPath, 'utf8'), sandbox);
  assert.deepEqual(clone(sandbox.PureModel.create(7, 1)), Model.create(7, 1));
  const initial = [[30, 60, 48, 24], [31, 58, 44, 23], [29, 62, 52, 22]];
  const mature = [[1800, 2280, 2040], [1980, 2460, 2220], [2160, 2640, 2400]];
  const initialComfort = [[false, true, true], [false, true, false], [false, true, true]];
  for (let d = 0; d < 3; d++) {
    const s = Model.create(7, d);
    assert.equal(s.level, d + 1); assert.equal(s.delayTicks, 90 + d * 30);
    assert.deepEqual([...Object.values(s.environment), s.reservoir.remainingLitres], initial[d]);
    assert.deepEqual(s.crops.map(crop => crop.maturityTicks), mature[d]);
    assert.deepEqual(s.crops.map(crop => crop.inRange), initialComfort[d]);
    assert.ok(s.crops.every(crop => !crop.growing && !crop.dangerous && crop.growthTicks === 0 && crop.damageTicks === 0));
    assert.deepEqual(s.crops.map(crop => crop.damageLimitTicks), [480, 600, 540]);
    assert.equal(s.lastInterval, null); assert.equal(s.lastCommand, null); assert.equal(s.lastAppliedCommands, null);
    assert.equal(s.remaining, 90); assert.equal(s.score, 0); assert.equal(s.selectedId, 'vent');
    assert.deepEqual(s.currentWeather, s.weatherPeriods[0]); assert.notEqual(s.currentWeather, s.weatherPeriods[0]);
    invariant(s);
  }
  const changed = Model.create(7, 1), pristine = clone(changed);
  changed.physics.soilGain = 999; changed.crops[0].comfort.temperature[0] = 999;
  changed.weatherPeriods[0].heatInput = 999; changed.dials[0].requestedLevel = 2;
  assert.deepEqual(Model.create(7, 1), pristine);
  assert.equal(Model.create(NaN, Infinity).difficulty, 0); assert.equal(Model.create(0, 99).difficulty, 2);
});

test('selection follows dominant axes, closed edges and 20/10 tick repeat; B wins and navigation precedes A', () => {
  const s = Model.create();
  tick(s, { x: .249 }); assert.equal(s.selectedId, 'vent');
  tick(s, { x: 1, y: -1 }); assert.equal(s.selectedId, 'shade');
  ticks(s, 19, { x: 1, y: -1 }); assert.equal(s.selectedId, 'shade');
  tick(s, { x: 1, y: -1 }); assert.equal(s.selectedId, 'drip');
  ticks(s, 9, { x: 1, y: -1 }); assert.equal(s.events.length, 0);
  tick(s, { x: 1, y: -1 }); assert.equal(s.events[0].type, 'select-blocked');
  act(s, { x: .1, y: -2 }); assert.equal(s.selectedId, 'shade');
  act(s, { x: -1 }); assert.equal(s.selectedId, 'vent');
  act(s, { y: -1 }); assert.equal(s.selectedId, 'vent');
  tick(s, { x: 1, a: true });
  assert.equal(s.selectedId, 'shade'); assert.equal(dial(s, 'shade').requestedLevel, 1);
  tick(s);
  tick(s, { x: 1, a: true, b: true });
  assert.equal(s.selectedId, 'shade'); assert.equal(dial(s, 'shade').requestedLevel, 0);
  assert.equal(dial(s, 'drip').requestedLevel, 0);
  invariant(s);
  const release = Model.create();
  tick(release, { x: 1 }); assert.equal(release.selectedId, 'shade');
  tick(release, { b: true });
  tick(release, { x: 1 }); assert.equal(release.selectedId, 'drip');
});

test('fresh A/B changes only requested levels, blocked edges create no command and receipts are detached', () => {
  const s = Model.create();
  tick(s, { a: true });
  const first = clone(s.lastCommand), event = clone(s.events.find(item => item.type === 'command'));
  assert.equal(first.id, 1); assert.equal(first.issuedTick, 1); assert.equal(first.dueTick, 91);
  assert.equal(dial(s, 'vent').requestedLevel, 1); assert.equal(dial(s, 'vent').appliedLevel, 0);
  assert.notEqual(s.lastCommand, s.pendingCommands[0]); assert.notEqual(s.events[0].command, s.pendingCommands[0]);
  ticks(s, 8, { a: true }); assert.equal(s.commandCount, 1);
  tick(s, { a: true, aPressed: true }); assert.equal(s.commandCount, 2);
  tick(s, { a: true, aPressed: true }); assert.equal(s.blockedCommands, 1); assert.equal(s.commandCount, 2);
  tick(s); pulse(s, 'b'); pulse(s, 'b'); pulse(s, 'b');
  assert.equal(s.blockedCommands, 2); assert.equal(dial(s, 'vent').requestedLevel, 0);
  assert.equal(s.commandCount, 4); assert.deepEqual(s.pendingCommands.map(c => c.afterRequested), [1, 2, 1, 0]);
  assert.deepEqual(s.pendingCommands[0], first); assert.deepEqual(event.command, first);
  invariant(s);
});

test('every queued absolute command takes effect at its exact deadline and original dial, preserving FIFO reversals', () => {
  const s = Model.create();
  pulse(s, 'a'); pulse(s, 'a'); pulse(s, 'b');
  const commands = clone(s.pendingCommands);
  act(s, { x: 1 }); assert.equal(s.selectedId, 'shade');
  ticks(s, 90 - s.tick);
  assert.equal(s.appliedCommandCount, 0); assert.equal(dial(s, 'vent').appliedLevel, 0);
  tick(s);
  assert.equal(s.tick, 91); assert.equal(dial(s, 'vent').appliedLevel, 1);
  assert.equal(s.lastAppliedCommands[0].beforeApplied, 0); assert.equal(s.lastAppliedCommands[0].afterApplied, 1);
  assert.equal(s.lastAppliedCommands[0].appliedTick, commands[0].dueTick);
  const receipt = clone(s.lastAppliedCommands[0]);
  assert.notEqual(s.events.find(event => event.type === 'applied').command, s.lastAppliedCommands[0]);
  tick(s); assert.deepEqual(s.lastAppliedCommands, []);
  tick(s); assert.equal(dial(s, 'vent').appliedLevel, 2);
  ticks(s, 2); assert.equal(dial(s, 'vent').appliedLevel, 1);
  assert.equal(dial(s, 'shade').appliedLevel, 0); assert.equal(s.appliedCommandCount, 3);
  assert.deepEqual(receipt, { ...commands[0], beforeApplied: 0, afterApplied: 1, appliedTick: 91, at: 91 / 60 });
  invariant(s);
});

test('subtick edges coalesce, B consumes pending A, cancellation clears input but preserves deliberate actuator commands', () => {
  const s = Model.create();
  Model.step(s, 0, { a: true, cancelEpoch: 1 });
  Model.step(s, DT / 2, { aPressed: true, cancelEpoch: 1 });
  assert.equal(s.tick, 0); assert.equal(s.commandCount, 0);
  Model.step(s, DT / 2, { cancelEpoch: 1 });
  assert.equal(s.commandCount, 1);
  const queued = clone(s.pendingCommands);
  Model.step(s, 0, { aPressed: true });
  tick(s, { a: true, b: true, bPressed: true, x: 1, cancelEpoch: 2 });
  assert.equal(s.commandCount, 1); assert.equal(s.selectedId, 'vent'); assert.deepEqual(s.pendingCommands, queued);
  assert.equal(s.tick, 2); assert.ok(s.environment.temperature > 30);
  tick(s, { a: true, b: true, cancelled: true });
  tick(s); Model.step(s, 0, { aPressed: true }); tick(s, { bPressed: true, x: 1 });
  assert.equal(s.commandCount, 2); assert.equal(dial(s, 'vent').requestedLevel, 0); assert.equal(s.selectedId, 'vent');
  ticks(s, 91 - s.tick);
  assert.equal(dial(s, 'vent').appliedLevel, 1); assert.equal(s.appliedCommandCount, 1);
  invariant(s);
});

test('one interval uses newly applied levels and the same old climate for coupled heat, humidity and soil arithmetic', () => {
  const s = Model.create();
  // Synthetic applied-level fixture: this test isolates arithmetic, not control timing.
  s.dials.forEach((item, i) => { item.appliedLevel = [2, 1, 2][i]; item.requestedLevel = item.appliedLevel; });
  const before = clone(s.environment);
  tick(s);
  const used = 1 / 60, evaporation = .35 + .025 * (30 - 24) + .08 * 2 - .06;
  near(s.environment.temperature, 30 + (.9 * .7 - .35 * 2 - .08 * 6) / 60, 'temperature');
  near(s.environment.humidity, 60 + (.55 - .4 * 2 - .035 * 15) / 60 + .8 * used, 'humidity');
  near(s.environment.soilMoisture, 48 - evaporation / 60 + 2 * used, 'soil');
  near(s.lastInterval.evaporationPctPerSec, evaporation);
  near(s.lastInterval.actualDripLps, 1); assert.deepEqual(s.lastInterval.beforeEnvironment, before);
  assert.notEqual(s.lastInterval.afterEnvironment, s.environment);
  assert.deepEqual(s.lastInterval.appliedLevels, { vent: 2, shade: 1, drip: 2 });
  assert.equal(s.lastInterval.fromTick, 0); assert.equal(s.lastInterval.toTick, 1);
  invariant(s);
});

test('finite water is conserved through saturation and the partial final drop; empty applied drip adds no soil or humidity', () => {
  const s = Model.create();
  // Synthetic small reservoir and saturated soil intentionally force both boundaries.
  s.reservoir = { initialLitres: .025, remainingLitres: .025, usedLitres: 0 };
  s.environment.soilMoisture = 100;
  dial(s, 'drip').appliedLevel = 2; dial(s, 'drip').requestedLevel = 2;
  tick(s); assert.equal(s.environment.soilMoisture, 100); near(s.lastInterval.usedLitres, 1 / 60);
  tick(s); near(s.lastInterval.usedLitres, .025 - 1 / 60); near(s.lastInterval.actualDripLps, .5);
  assert.equal(s.reservoir.remainingLitres, 0); near(s.reservoir.usedLitres, .025);
  const off = clone(s); dial(off, 'drip').appliedLevel = 0;
  tick(s); tick(off);
  assert.deepEqual(s.environment, off.environment); assert.equal(s.lastInterval.actualDripLps, 0);
  assert.ok(s.environment.soilMoisture < 100); invariant(s);
});

test('every crop uses closed comfort bounds and all three dimensions; only actual in-range ticks grow', () => {
  const keys = ['temperature', 'humidity', 'soilMoisture'];
  for (let index = 0; index < 3; index++) {
    for (const key of keys) {
      for (const upper of [false, true]) {
        for (const outside of [false, true]) {
          const s = still(), crop = s.crops[index];
          for (const dimension of keys) s.environment[dimension] = (crop.comfort[dimension][0] + crop.comfort[dimension][1]) / 2;
          const boundary = crop.comfort[key][upper ? 1 : 0];
          s.environment[key] = boundary + (outside ? (upper ? 1 : -1) * 1e-6 : 0);
          tick(s);
          assert.equal(crop.comfortChecks[key], !outside);
          assert.equal(crop.inRange, !outside); assert.equal(crop.growing, !outside);
          assert.equal(crop.growthTicks, outside ? 0 : 1);
          assert.deepEqual(crop.failedComfortDimensions, outside ? [key] : []);
        }
      }
    }
  }
  const s = still({ temperature: 29, humidity: 60, soilMoisture: 50 }); tick(s);
  assert.deepEqual(s.crops.map(crop => crop.growthTicks), [0, 1, 1]);
  assert.deepEqual(s.lastInterval.growthCropIds, ['C2', 'C3']);
});

test('safe bounds are closed, multi-dimension danger adds one irreversible damage tick, and mature crops still suffer', () => {
  for (let index = 0; index < 3; index++) {
    for (const key of ['temperature', 'humidity', 'soilMoisture']) {
      for (const upper of [false, true]) {
        const s = still(), crop = s.crops[index];
        s.environment[key] = crop.safe[key][upper ? 1 : 0];
        tick(s); assert.equal(crop.damageTicks, 0);
        s.environment[key] += (upper ? 1 : -1) * 1e-6;
        tick(s); assert.equal(crop.damageTicks, 1); assert.deepEqual(crop.unsafeDimensions, [key]);
        s.environment = { temperature: 27, humidity: 60, soilMoisture: 50 };
        tick(s); assert.equal(crop.damageTicks, 1); assert.equal(crop.dangerous, false);
      }
    }
  }
  const s = still({ temperature: 38, humidity: 96, soilMoisture: 91 });
  s.crops[0].growthTicks = s.crops[0].maturityTicks;
  tick(s);
  assert.deepEqual(s.crops[0].unsafeDimensions, ['temperature', 'humidity', 'soilMoisture']);
  assert.equal(s.crops[0].damageTicks, 1); assert.equal(s.crops[0].growing, false);
  assert.equal(s.crops[0].growthTicks, s.crops[0].maturityTicks);
});

test('per-crop maturity caps and score cannot substitute for an unfinished crop; all crops are required', () => {
  const s = still({ temperature: 24, humidity: 60, soilMoisture: 50 });
  s.crops[0].growthTicks = s.crops[0].maturityTicks;
  s.crops[2].growthTicks = s.crops[2].maturityTicks;
  tick(s);
  assert.equal(s.phase, 'playing'); assert.equal(s.matureCount, 2); assert.equal(s.score, 400);
  assert.deepEqual(s.unfinishedCropIds, ['C2']);
  assert.ok(s.crops.every(crop => !crop.growing));
  s.environment.temperature = 27;
  s.crops[1].growthTicks = s.crops[1].maturityTicks - 1;
  tick(s);
  assert.equal(s.phase, 'won'); assert.equal(s.matureCount, 3); assert.equal(s.score, 1624);
  assert.deepEqual(s.lastInterval.growthCropIds, ['C2']); invariant(s);
});

test('exhaustion counts only unfinished crops without actual growth, resets on growth and allows residual-soil completion', () => {
  const growing = emptyWater(still()); growing.dryStallTicks = 179; tick(growing);
  assert.equal(growing.dryStallTicks, 0); assert.equal(growing.phase, 'playing');
  const stalled = emptyWater(still({ temperature: 24, humidity: 60, soilMoisture: 50 }));
  stalled.crops[0].growthTicks = stalled.crops[0].maturityTicks;
  stalled.crops[2].growthTicks = stalled.crops[2].maturityTicks;
  stalled.dryStallTicks = 179; tick(stalled);
  assert.equal(stalled.phase, 'lost'); assert.equal(stalled.lostReason, 'water');
  assert.equal(stalled.dryStallTicks, 180); assert.deepEqual(stalled.unfinishedCropIds, ['C2']);
  const completing = emptyWater(lastGrowth(still())); completing.dryStallTicks = 179; tick(completing);
  assert.equal(completing.phase, 'won'); assert.equal(completing.dryStallTicks, 0);
  const oneFinishes = emptyWater(still({ temperature: 24, humidity: 60, soilMoisture: 50 }));
  oneFinishes.crops[0].growthTicks = oneFinishes.crops[0].maturityTicks - 1;
  oneFinishes.crops[2].growthTicks = oneFinishes.crops[2].maturityTicks;
  tick(oneFinishes);
  assert.deepEqual(oneFinishes.lastInterval.growthCropIds, ['C1']);
  assert.deepEqual(oneFinishes.unfinishedCropIds, ['C2']); assert.equal(oneFinishes.dryStallTicks, 1);
});

test('completed-interval terminal priority is crop death, maturity, water, timeout; deadline weather uses old interval time', () => {
  // Artificially narrowed safe range makes lethal damage and the last growth
  // tick simultaneous, a boundary impossible in the authored nested bands.
  const lethal = lastGrowth(still());
  lethal.crops[0].safe.temperature = [12, 26];
  lethal.crops[0].damageTicks = lethal.crops[0].damageLimitTicks - 1;
  tick(lethal); assert.equal(lethal.matureCount, 3); assert.equal(lethal.phase, 'lost'); assert.equal(lethal.lostReason, 'crop');
  const finishAtDeadline = atDeadline(lastGrowth(still())); tick(finishAtDeadline);
  assert.equal(finishAtDeadline.tick, 5400); assert.equal(finishAtDeadline.phase, 'won');
  const timeout = atDeadline(still()); tick(timeout, { a: true });
  assert.equal(timeout.lostReason, 'timeout'); assert.equal(timeout.commandCount, 1);
  assert.equal(timeout.crops[0].growthTicks, 1); assert.equal(timeout.pendingCommands.length, 1);
  const waterFirst = atDeadline(emptyWater(still({ temperature: 20, humidity: 60, soilMoisture: 50 })));
  waterFirst.dryStallTicks = 179; tick(waterFirst); assert.equal(waterFirst.lostReason, 'water');
  for (const boundary of [18, 42]) {
    const weather = Model.create(); weather.tick = boundary * 60 - 1;
    weather.elapsed = weather.tick / 60; weather.remaining = 90 - weather.elapsed;
    tick(weather);
    assert.equal(weather.currentWeather.id, boundary === 18 ? 'dawn' : 'noon');
    near(weather.lastInterval.fromTime, boundary - DT);
    tick(weather); assert.equal(weather.currentWeather.id, boundary === 18 ? 'noon' : 'late');
  }
});

test('fixed steps agree across frame partitions, dt and axes stay bounded, and JSON copies continue identically', () => {
  const single = Model.create(), batched = Model.create();
  for (let block = 0; block < 20; block++) {
    const input = block === 0 ? { x: 1, a: true } : block === 2 ? { a: true } : {};
    ticks(single, 15, input); Model.step(batched, .25, input);
  }
  const normalized = value => { const result = clone(value); result.events = []; result._accumulator = 0; return result; };
  assert.deepEqual(normalized(batched), normalized(single)); invariant(single);
  const restored = clone(single); ticks(single, 30); ticks(restored, 30); assert.deepEqual(restored, single);
  const invalid = Model.create();
  for (const dt of [NaN, Infinity, -1, 0]) Model.step(invalid, dt, { x: NaN, y: Infinity });
  assert.equal(invalid.tick, 0); assert.equal(invalid.selectedId, 'vent');
  Model.step(invalid, 99, { x: Infinity, y: NaN }); assert.equal(invalid.tick, 15); assert.equal(invalid.selectedId, 'vent');
  tick(invalid, { x: 99, y: -99 }); assert.equal(invalid.selectedId, 'shade'); invariant(invalid);
});

test('terminal steps freeze every field and pending actuation; fresh retry restores independent initial state', () => {
  const won = lastGrowth(still()); tick(won);
  const lost = atDeadline(still()); tick(lost, { a: true });
  for (const s of [won, lost]) {
    const ended = clone(s);
    Model.step(s, .25, { x: 1, a: true, b: true, aPressed: true, bPressed: true, cancelled: true, cancelEpoch: 9 });
    assert.deepEqual(s, ended);
  }
  const retry = Model.create(7, 0), untouched = Model.create(7, 0);
  assert.deepEqual(retry, untouched); assert.equal(retry.commandCount, 0); assert.equal(retry.dryStallTicks, 0);
  assert.equal(retry.lastInterval, null); assert.equal(retry.lastAppliedCommands, null);
  pulse(retry, 'a'); assert.equal(untouched.commandCount, 0); assert.equal(untouched.pendingCommands.length, 0);
});
