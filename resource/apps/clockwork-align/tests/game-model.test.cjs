'use strict';
// Directed mechanism tests, not normal-play evidence or an authored solution route.
// No test in this file is a complete ordinary round. Boundary fixtures are labelled below.
const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60;
const clone = value => JSON.parse(JSON.stringify(value));
const advance = (s, input = {}) => Model.step(s, DT, input);
function ready(difficulty = 0) {
  const s = Model.create(732, difficulty);
  advance(s); // Actual neutral acknowledgement; initial quarantine is part of the API.
  return s;
}
const phases = s => s.gears.map(g => g.unwrappedUnits);
const engagement = s => s.trains.map(t => t.engaged);
const lastReceipt = s => s.actionReceipts.at(-1);

test('authored initial state exposes real gear topology, targets and frozen configuration', () => {
  for (let difficulty = 0; difficulty < 3; difficulty++) {
    const s = Model.create(732, difficulty);
    assert.equal(s.level, difficulty + 1);
    assert.equal(s.tick, 0); assert.equal(s.transactionCount, 0);
    assert.equal(s.phase, 'playing'); assert.equal(s.stage, 'tuning');
    assert.equal(s.terminal, null); assert.equal(s.lastInterval, null); assert.equal(s.lastTransaction, null);
    assert.equal(s.gears.length, [6, 9, 10][difficulty]);
    assert.equal(s.pointers.length, [4, 6, 6][difficulty]);
    assert.deepEqual(s.actionReceipts, []); assert.deepEqual(s.lastActionReceipts, []);
    assert.deepEqual(s.inputState, {cancelEpoch: 0, quarantined: true, aArmed: false, bArmed: false, direction: 0, repeatAgeTicks: 0});
    assert.ok(s.trains.every(t => t.engaged && t.clutchState === 'engaged'));
    assert.ok(phases(s).every(q => q === 0));
    assert.ok(Object.isFrozen(s.identity) && Object.isFrozen(s.scenario) && Object.isFrozen(s.physics));
    assert.ok(Object.isFrozen(s.scenario.trains) && Object.isFrozen(s.scenario.trains[0].gears));
    assert.deepEqual(s.pointers.map(p => p.gearId), s.scenario.trains.flatMap(t => t.gears.filter(g => 'targetUnits' in g).map(g => g.id)));
  }
});

test('create accepts only the documented run seed and difficulty types', () => {
  assert.equal(Model.create().seed, 732);
  for (const seed of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, null, '732'])
    assert.throws(() => Model.create(seed, 0), RangeError);
  for (const difficulty of [-1, 3, .5, NaN, null, '0'])
    assert.throws(() => Model.create(732, difficulty), RangeError);
  const a = Model.create(1, 2), b = Model.create(732, 2);
  assert.equal(a.seed, 1); assert.deepEqual(a.scenario, b.scenario);
});

test('every declared external mesh has opposite exact tooth-ratio speed and displacement', () => {
  for (let difficulty = 0; difficulty < 3; difficulty++) {
    const s = ready(difficulty); advance(s);
    assert.equal(s.motor.unwrappedUnits, 30 * s.tick);
    for (const train of s.scenario.trains) {
      const gears = train.meshChain.map(id => s.gears.find(g => g.id === id));
      assert.equal(gears[0].velocityUnitsPerTick, 30);
      for (let i = 1; i < gears.length; i++) {
        const a = gears[i - 1], b = gears[i];
        assert.equal(a.teeth * a.velocityUnitsPerTick + b.teeth * b.velocityUnitsPerTick, 0);
        assert.equal(a.teeth * a.unwrappedUnits + b.teeth * b.unwrappedUnits, 0);
        assert.ok(a.velocityUnitsPerTick * b.velocityUnitsPerTick < 0);
      }
    }
    assert.equal(s.lastInterval.transactionId, s.lastTransaction.id);
    assert.equal(s.lastInterval.intervalId, s.tick);
  }
});

test('braking and reengaging preserve command phases while only future motion changes', () => {
  const s = ready(), before = phases(s), selected = s.trains[0].id;
  advance(s, {a: true});
  let receipt = lastReceipt(s);
  assert.equal(receipt.accepted, true); assert.equal(receipt.chargedCost, 1);
  assert.deepEqual(receipt.gearsBefore.map(g => g.unwrappedUnits), receipt.gearsAfter.map(g => g.unwrappedUnits));
  s.gears.forEach((g, i) => assert.equal(g.unwrappedUnits, before[i] + (g.trainId === selected ? 0 : g.velocityUnitsPerTick)));
  assert.ok(s.gears.filter(g => g.trainId === selected).every(g => g.velocityUnitsPerTick === 0));
  advance(s); const braked = phases(s); advance(s, {aPressed: true}); receipt = lastReceipt(s);
  assert.deepEqual(receipt.gearsBefore.map(g => g.unwrappedUnits), receipt.gearsAfter.map(g => g.unwrappedUnits));
  assert.ok(s.trains[0].engaged);
  s.gears.forEach((g, i) => assert.equal(g.unwrappedUnits, braked[i] + g.velocityUnitsPerTick));
});

test('B brakes every engaged train atomically and a fresh all-braked B is a zero-cost receipt', () => {
  const s = ready(), before = phases(s), budget = s.budget.remaining;
  advance(s, {b: true});
  assert.deepEqual(phases(s), before); assert.ok(engagement(s).every(v => !v));
  assert.equal(lastReceipt(s).chargedCost, s.trains.length);
  assert.equal(s.budget.remaining, budget - s.trains.length);
  const count = s.actionReceipts.length; advance(s, {b: true});
  assert.equal(s.actionReceipts.length, count);
  advance(s); advance(s, {bPressed: true});
  assert.equal(lastReceipt(s).reason, 'already_braked'); assert.equal(lastReceipt(s).accepted, false);
  assert.equal(lastReceipt(s).chargedCost, 0); assert.equal(lastReceipt(s).requiredCost, 0);
});

test('simultaneous fresh A and B produce one conflict after navigation with no charge', () => {
  const s = ready(1), budget = clone(s.budget), gears = phases(s);
  advance(s, {x: 1, a: true, bPressed: true});
  assert.equal(s.cursor, 1); assert.equal(s.actionReceipts.length, 1);
  const r = lastReceipt(s);
  assert.equal(r.request, 'conflicting_buttons'); assert.equal(r.reason, 'conflicting_buttons');
  assert.equal(r.requiredCost, null); assert.equal(r.accepted, false); assert.deepEqual(r.requestedTrainIds, []);
  assert.deepEqual(s.budget, budget); assert.ok(engagement(s).every(Boolean));
  assert.deepEqual(r.gearsBefore, r.gearsAfter);
  s.gears.forEach((g, i) => assert.equal(g.unwrappedUnits, gears[i] + g.velocityUnitsPerTick));
});

test('literal button levels and pressed pulses share one armed edge until a neutral release', () => {
  const s = ready(); advance(s, {aPressed: true});
  advance(s, {aPressed: true}); advance(s, {a: true, aPressed: true});
  assert.equal(s.actionReceipts.length, 1);
  advance(s, {a: 'true', aPressed: 1}); // Non-literal booleans are neutral.
  advance(s, {aPressed: true});
  assert.equal(s.actionReceipts.length, 2); assert.equal(s.trains[0].engaged, true);
});

test('cancellation and changed epochs quarantine controls without freezing mechanical intervals', () => {
  const s = ready(), q = s.motor.unwrappedUnits;
  advance(s, {cancelled: true, aPressed: true, x: 1});
  assert.equal(s.motor.unwrappedUnits, q + 30); assert.equal(s.actionReceipts.length, 0);
  assert.equal(s.inputState.quarantined, true); assert.equal(s.cursor, 0);
  advance(s, {a: true}); advance(s, {x: .54, y: .55});
  assert.equal(s.inputState.quarantined, true); assert.equal(s.actionReceipts.length, 0);
  advance(s); assert.equal(s.inputState.quarantined, false); assert.equal(s.actionReceipts.length, 0);
  advance(s, {a: true}); assert.equal(s.actionReceipts.length, 1);
  advance(s, {cancelEpoch: 7}); assert.equal(s.inputState.quarantined, true);
  advance(s, {cancelEpoch: 7}); assert.equal(s.inputState.quarantined, false);
  advance(s, {cancelEpoch: NaN}); assert.equal(s.inputState.cancelEpoch, 7);
});

test('navigation wraps, repeats at 18 then every 9 intervals, and Y takes precedence', () => {
  const s = ready(1); advance(s, {x: 1}); assert.equal(s.cursor, 1);
  for (let i = 0; i < 17; i++) advance(s, {x: 1});
  assert.equal(s.cursor, 1); advance(s, {x: 1}); assert.equal(s.cursor, 2);
  for (let i = 0; i < 8; i++) advance(s, {x: 1});
  assert.equal(s.cursor, 2); advance(s, {x: 1}); assert.equal(s.cursor, 0);
  advance(s, {x: 1, y: -1}); assert.equal(s.cursor, 2);
  advance(s); advance(s, {x: .549, y: -.549}); assert.equal(s.cursor, 2);
  advance(s, {x: .55, aPressed: true});
  assert.equal(s.cursor, 0); assert.equal(lastReceipt(s).selectedTrainAfter, s.trains[0].id);
});

test('invalid dt cannot mutate state; zero dt is a complete no-op', () => {
  const s = ready(), before = clone(s), interval = s.lastInterval, input = s.lastInput;
  for (const dt of [-1, NaN, Infinity, .01, DT + 2e-12]) {
    assert.throws(() => Model.step(s, dt, {a: true})); assert.deepEqual(s, before);
  }
  Model.step(s, 0, {a: true, cancelled: true});
  assert.deepEqual(s, before); assert.strictEqual(s.lastInterval, interval); assert.strictEqual(s.lastInput, input);
  Model.step(s, DT + 1e-13, {}); assert.equal(s.tick, before.tick + 1);
});

test('published receipts and interval history are deeply frozen and never aliased to later state', () => {
  const s = ready(); advance(s, {a: true});
  const receipt = lastReceipt(s), interval = s.lastInterval, transaction = s.lastTransaction;
  const saved = clone({receipt, interval, transaction});
  assert.ok(Object.isFrozen(receipt) && Object.isFrozen(receipt.gearsBefore) && Object.isFrozen(receipt.gearsBefore[0]));
  assert.ok(Object.isFrozen(interval) && Object.isFrozen(interval.trains) && Object.isFrozen(transaction));
  assert.throws(() => { receipt.gearsBefore[0].unwrappedUnits = 999; }, TypeError);
  advance(s); advance(s, {a: true});
  assert.deepEqual({receipt, interval, transaction}, saved);
  assert.notStrictEqual(s.lastInterval, interval); assert.strictEqual(s.actionReceipts[0], receipt);
});

// SYNTHETIC BOUNDARY FIXTURES ONLY. These place public dynamic fields at selected
// rule boundaries; independent pointer phases need not form a reachable neutral
// mesh assembly. They are not a normal run, input route, solver or feasibility proof.
// Frozen scenario/physics/targets are untouched. Production step refreshes derived
// pointer phases and train velocities from these public gears/clutches before work.
function boundaryFixture({difficulty = 0, tick, hold = 0, remaining, engaged = []} = {}) {
  const s = ready(difficulty);
  s.tick = tick ?? s.appointment.windowStartTick; s.elapsed = s.tick / 60;
  s.transactionCount = 0; s.lastTransaction = null; s.lastInterval = null; s.lastInput = null;
  s.motor.unwrappedUnits = 30 * s.tick;
  for (const train of s.trains) {
    train.engaged = engaged.includes(train.id); train.clutchState = train.engaged ? 'engaged' : 'braked';
  }
  for (const gear of s.gears) {
    const pointer = s.pointers.find(p => p.gearId === gear.id);
    gear.unwrappedUnits = pointer ? pointer.targetUnits - pointer.mountOffsetUnits : 0;
  }
  if (remaining !== undefined) {
    s.budget.remaining = remaining; s.budget.spent = s.budget.initial - remaining;
  }
  Object.assign(s.alignment, {holdTicks: hold, holdStartTick: hold ? s.tick - hold : null,
    lastEligible: hold ? true : null, lastAllFullInterval: hold ? true : null, lastResetReason: null});
  return s;
}
function movePointer(s, index, error) {
  const p = s.pointers[index];
  s.gears.find(g => g.id === p.gearId).unwrappedUnits = p.targetUnits - p.mountOffsetUnits + error;
}
const holdFacts = s => Object.fromEntries(['holdTicks', 'holdStartTick', 'lastEligible', 'lastAllFullInterval', 'lastResetReason'].map(k => [k, s.alignment[k]]));

test('synthetic budget: unaffordable B changes no clutch or budget and still permits a cheaper A', () => {
  const s = boundaryFixture({remaining: 1, engaged: ['amber', 'cobalt']}), budget = clone(s.budget);
  advance(s, {b: true});
  const r = lastReceipt(s);
  assert.equal(r.reason, 'insufficient_budget'); assert.equal(r.requiredCost, 2); assert.equal(r.chargedCost, 0);
  assert.deepEqual(r.clutchesBefore, r.clutchesAfter); assert.deepEqual(r.gearsBefore, r.gearsAfter);
  assert.deepEqual(s.budget, budget); assert.equal(s.phase, 'playing'); assert.equal(s.lastTransaction.advanced, true);
  advance(s); advance(s, {a: true});
  assert.equal(lastReceipt(s).accepted, true); assert.equal(lastReceipt(s).chargedCost, 1);
  assert.equal(s.budget.remaining, 0); assert.equal(s.lostReason, 'budget_exhausted');
});

test('synthetic safe final adjustment allows zero-budget wait; rejected A and already-braked B do not end it', () => {
  const s = boundaryFixture({tick: 1919, remaining: 1, engaged: ['amber']});
  advance(s, {a: true});
  assert.equal(s.budget.remaining, 0); assert.equal(s.phase, 'playing'); assert.equal(s.terminal, null);
  assert.equal(s.tick, 1920); assert.equal(s.alignment.holdTicks, 0); assert.ok(engagement(s).every(v => !v));
  advance(s); assert.equal(s.alignment.holdTicks, 1);
  advance(s, {aPressed: true});
  assert.equal(lastReceipt(s).reason, 'insufficient_budget'); assert.equal(s.phase, 'playing');
  advance(s); advance(s, {bPressed: true});
  assert.equal(lastReceipt(s).reason, 'already_braked'); assert.equal(s.budget.remaining, 0);
  assert.equal(s.alignment.holdTicks, 4);
});

test('synthetic unsafe final adjustment loses at the same boundary without integrating or resetting prior hold', () => {
  const s = boundaryFixture({tick: 1924, remaining: 1, hold: 4}); advance(s);
  const tick = s.tick, transaction = s.transactionCount, before = phases(s), motor = s.motor.unwrappedUnits;
  const history = holdFacts(s), priorInterval = s.lastInterval;
  advance(s, {a: true}); // Reengaging while spending the last unit is unsafe, even if instant-aligned.
  assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'budget_exhausted');
  assert.equal(s.tick, tick); assert.equal(s.transactionCount, transaction + 1);
  assert.equal(s.lastInterval, null); assert.ok(priorInterval); assert.equal(s.motor.unwrappedUnits, motor);
  assert.deepEqual(phases(s), before); assert.deepEqual(holdFacts(s), history);
  assert.deepEqual(s.terminal, {reason: 'budget_exhausted', boundaryTick: tick, transactionId: transaction + 1});
  assert.deepEqual(s.lastTransaction, {id: transaction + 1, fromTick: tick, toTick: tick, advanced: false,
    actionReceiptIds: [lastReceipt(s).receiptId], intervalId: null, terminalAfter: s.terminal});
  assert.deepEqual(lastReceipt(s).holdBefore, lastReceipt(s).holdAfterCommand);
  assert.deepEqual(lastReceipt(s).terminalAfterCommand, s.terminal);
  const frozen = clone(s);
  Model.step(s, NaN, {get x() { throw new Error('terminal input must not be read'); }});
  assert.deepEqual(s, frozen); assert.equal(s.lastInterval, null);
});

test('synthetic appointment: pre-window alignment earns nothing and the first eligible full interval earns one', () => {
  const s = boundaryFixture({tick: 1919}); advance(s);
  assert.equal(s.alignment.allInstantAligned, true); assert.equal(s.alignment.holdTicks, 0);
  assert.equal(s.lastInterval.windowEligible, false); assert.equal(s.lastInterval.hold.resetReason, 'outside_window');
  assert.equal(s.appointment.phase, 'eligible'); // Current boundary and previous interval are distinct facts.
  advance(s);
  assert.equal(s.alignment.holdTicks, 1); assert.equal(s.alignment.holdStartTick, 1920);
  assert.equal(s.lastInterval.windowEligible, true); assert.equal(s.lastInterval.allPointersFullInterval, true);
});

test('synthetic separate pointer visits never accumulate global credit and a break resets an existing hold', () => {
  const s = boundaryFixture(); movePointer(s, 0, 361); advance(s);
  assert.equal(s.alignment.holdTicks, 0);
  movePointer(s, 0, 0); movePointer(s, 1, -361); advance(s);
  assert.equal(s.alignment.holdTicks, 0); assert.equal(s.alignment.holdStartTick, null);
  movePointer(s, 1, 0); advance(s); advance(s);
  assert.equal(s.alignment.holdTicks, 2);
  movePointer(s, 0, 361); advance(s);
  assert.equal(s.alignment.holdTicks, 0); assert.equal(s.alignment.holdStartTick, null);
  assert.equal(s.lastInterval.hold.resetReason, 'pointer_outside_band');
});

test('synthetic whole-interval gate rejects a pointer that only enters tolerance at the end', () => {
  const s = boundaryFixture({engaged: ['amber']});
  const index = s.pointers.findIndex(p => p.gearId === 'amber-tip'); movePointer(s, index, -370);
  advance(s); // Actual +15 step ends at -355; the start is still outside the inclusive band.
  const pointer = s.pointers[index], interval = s.lastInterval.pointerIntervals.find(p => p.gearId === pointer.gearId);
  assert.equal(pointer.signedErrorUnits, -355); assert.equal(pointer.instantAligned, true);
  assert.equal(interval.fullIntervalAligned, false); assert.equal(interval.containingBandIndex, null);
  assert.equal(s.alignment.holdTicks, 0);
});

test('synthetic closing boundary: complete hold wins before deadline and exposes a closed appointment', () => {
  const s = boundaryFixture({tick: 2279, hold: 119}); advance(s);
  assert.equal(s.phase, 'won'); assert.equal(s.tick, 2280); assert.equal(s.stage, 'finished');
  assert.equal(s.appointment.phase, 'closed'); assert.equal(s.alignment.holdTicks, 120);
  assert.equal(s.score, 1000 + 100 * s.budget.remaining);
  assert.deepEqual(s.terminal, {reason: 'global_hold_complete', boundaryTick: 2280, transactionId: 1});
  assert.deepEqual(s.lastInterval.terminalAfter, s.terminal);
  const frozen = clone(s), interval = s.lastInterval, transaction = s.lastTransaction;
  Model.step(s, -999, {a: true, b: true, x: 1});
  assert.deepEqual(s, frozen); assert.strictEqual(s.lastInterval, interval); assert.strictEqual(s.lastTransaction, transaction);
});

test('synthetic closing boundary without enough continuous hold loses deadline after exactly one interval', () => {
  const s = boundaryFixture({tick: 2279, hold: 118}); advance(s);
  assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'deadline'); assert.equal(s.alignment.holdTicks, 119);
  assert.equal(s.tick, 2280); assert.equal(s.lastTransaction.advanced, true); assert.equal(s.lastInterval.intervalId, 2280);
  assert.deepEqual(s.terminal, {reason: 'deadline', boundaryTick: 2280, transactionId: 1});
});

test('pure circular-band predicate accepts inclusive wraps and reversed paths but rejects a synthetic full turn', () => {
  const band = Model.intervalBand;
  assert.equal(band(-360, 360, 0, 360, 43200), 0);
  assert.equal(Object.is(band(0, 0, 0, 360, 43200), -0), false);
  assert.equal(band(42840, 43560, 0, 360, 43200), 1);
  assert.equal(band(43560, 42840, 0, 360, 43200), 1);
  assert.equal(band(42840, 43561, 0, 360, 43200), null);
  assert.equal(band(-43560, -42840, 0, 360, 43200), -1);
  assert.equal(band(0, 43200, 0, 360, 43200), null); // Predicate-only: unreachable in one authored interval.
  assert.equal(band(11940, 12660, 12300, 360, 43200), 0);
  // Root-reviewed safe-integer boundary: regrouping must not hide an intermediate rounding overflow.
  assert.equal(band(-9007199254740991, -9007199254740987, 2, 2, 9007199254740990), null);
});

test('pure circular-band predicate rejects invalid domains and unsafe intermediate arithmetic', () => {
  for (const args of [[0, Infinity, 0, 360, 43200], [0, .5, 0, 360, 43200], [0, 0, -1, 360, 43200],
    [0, 0, 43200, 360, 43200], [0, 0, 0, -1, 43200], [0, 0, 0, 21600, 43200], [0, 0, 0, 0, 0],
    [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0, 1, 43200]])
    assert.throws(() => Model.intervalBand(...args), RangeError);
});
