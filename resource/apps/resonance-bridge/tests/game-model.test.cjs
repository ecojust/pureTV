'use strict';
// Short synthetic rule boundaries; these fixtures are not ordinary rounds or private solution witnesses.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60, copy = value => JSON.parse(JSON.stringify(value));
const tick = (s, input = {}) => Model.step(s, DT, input);
const many = (s, n, input = {}) => { for (let i = 0; i < n; i++) tick(s, input); };
const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const published = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/model-contract.md'), 'utf8')
  .split('## Public level data')[1].match(/```json\s*([\s\S]*?)\s*```/)[1]);

// Fixture plates always retain the declared integer phase/envelope and corresponding sine endpoint.
function board(s, index, phaseUnits, frequencyIndex = 0, resonanceUnits = 0) {
  const b = s.boards[index], wrapped = ((phaseUnits % 6000) + 6000) % 6000;
  Object.assign(b, { phaseUnits, phaseWrappedUnits: wrapped, phaseRadians: 2 * Math.PI * wrapped / 6000,
    frequencyIndex, basePhaseUnitsPerTick: [10, 15, 20][frequencyIndex], effectivePhaseUnitsPerTick: [10, 15, 20][frequencyIndex],
    resonanceUnits, amplitudeMetres: .8 + resonanceUnits / 3000, trimTicksRemaining: 0,
    activePulseId: null, activePulseStartedAtTick: null, completedPulseCount: 0 });
  b.heightMetres = b.amplitudeMetres * Math.sin(b.phaseRadians); return b;
}
function calm(phaseUnits = 0) { const s = Model.create(); s.boards.forEach((_, i) => board(s, i, phaseUnits)); return s; }
function scheduled(s, now = 1000, dispatched = 0) {
  s.tick = now; s.elapsed = now / 60; s.deadlineTicksRemaining = Math.max(0, 5400 - now);
  s.stage = 'crossing'; s.dispatchAtTick = dispatched; s.scheduledReleaseTicks = s.pedestrians.map(p => dispatched + 600 * (p.id - 1));
  s.pedestrians.forEach((p, i) => { p.scheduledReleaseTick = s.scheduledReleaseTicks[i];
    if (p.scheduledReleaseTick <= now) { p.stage = 'waiting'; p.edgeIndex = 0; p.releasedAtTick = p.scheduledReleaseTick; }
  }); return s;
}
function person(s, index, stage, node, age = 0, contact = 0) {
  const p = s.pedestrians[index], heights = [0, ...s.boards.map(b => b.heightMetres), 0];
  assert.ok(p.scheduledReleaseTick <= s.tick, 'Synthetic active person must have a released schedule');
  Object.assign(p, { stage, node, edgeIndex: ['waiting', 'crossing'].includes(stage) ? node : null,
    releasedAtTick: p.scheduledReleaseTick, passedAtTick: stage === 'passed' ? s.tick - 1 : null, fallenAtTick: null, failedEdgeIndex: null,
    contactTicks: stage === 'waiting' ? contact : 0, crossingAgeTicks: stage === 'crossing' ? age : 0,
    crossingStartedAtTick: stage === 'crossing' ? s.tick - age : null, walkingAgeTicks: stage === 'walking' ? age : 0,
    movementTicks: stage === 'passed' ? 456 : stage === 'walking' ? (node - 1) * 144 + 24 + age : node * 144 + (stage === 'crossing' ? age : 0),
    heightMetres: stage === 'crossing' ? heights[node] + (heights[node + 1] - heights[node]) * age / 24 : heights[node],
    crossingMaxGapMetres: stage === 'crossing' ? Math.abs(heights[node + 1] - heights[node]) : 0 });
  s.passedCount = s.pedestrians.filter(item => item.stage === 'passed').length;
  s.fallenCount = s.pedestrians.filter(item => item.stage === 'fallen').length;
  s.remainingCount = s.scenario.pedestrianCount - s.passedCount - s.fallenCount; return p;
}
function finalCrossing(now = 5399) {
  const s = scheduled(calm(), now, 0);
  s.pedestrians.forEach((_, i) => person(s, i, i === s.pedestrians.length - 1 ? 'crossing' : 'passed', i === s.pedestrians.length - 1 ? 3 : 4, 23));
  return s;
}

test('three initial scenarios expose all public constants, exact integer phases and independent pending people', () => {
  const physics = { ...published.simulation, axisThreshold: published.controls.axisThreshold,
    navigationFirstRepeatTick: published.controls.navigationFirstRepeatTick, navigationRepeatPeriodTicks: published.controls.navigationRepeatPeriodTicks };
  for (const level of published.levels) {
    const s = Model.create(731, level.difficulty); assert.deepEqual(s.scenario, level); assert.deepEqual(s.physics, physics);
    assert.equal(s.levelName, level.name); assert.equal(s.levelNameEn, level.nameEn); assert.equal(s.seed, 731);
    assert.equal(s.tick, 0); assert.equal(s.stage, 'tuning'); assert.equal(s.phase, 'playing'); assert.equal(s.dispatchAtTick, null);
    assert.deepEqual(s.scheduledReleaseTicks, []); assert.equal(s.remainingCount, level.pedestrianCount);
    s.boards.forEach((b, i) => { assert.equal(b.index, i); assert.equal(b.label, `桥板 ${i + 1}`); assert.equal(b.phaseUnits, level.initialPhaseUnits[i]);
      assert.equal(b.frequencyIndex, level.initialFrequencyIndices[i]); assert.equal(b.resonanceUnits, level.initialResonanceUnits[i]);
      assert.equal(b.basePhaseUnitsPerTick, [10, 15, 20][b.frequencyIndex]); assert.equal(b.effectivePhaseUnitsPerTick, b.basePhaseUnitsPerTick);
      near(b.amplitudeMetres, .8 + b.resonanceUnits / 3000); near(b.heightMetres, b.amplitudeMetres * Math.sin(2 * Math.PI * b.phaseUnits / 6000));
      assert.equal(b.trimTicksRemaining, 0); assert.equal(b.activePulseId, null); });
    assert.deepEqual(s.pedestrians.map(p => [p.id, p.stage, p.node, p.movementTicks, p.contactTicks, p.heightMetres]),
      Array.from({ length: level.pedestrianCount }, (_, i) => [i + 1, 'pending', 0, 0, 0, 0]));
    for (const p of s.pedestrians) for (const key of ['scheduledReleaseTick', 'releasedAtTick', 'passedAtTick', 'fallenAtTick', 'failedEdgeIndex', 'edgeIndex']) assert.equal(p[key], null);
  }
});
test('create supports the public positional and object forms while rejecting different seeds or noninteger difficulties', () => {
  assert.deepEqual(Model.create(), Model.create({ seed: 731, difficulty: 0 }));
  assert.deepEqual(Model.create(731, 2), Model.create({ seed: 731, difficulty: 2 }));
  for (const seed of [730, 0, null, NaN, Infinity, '731']) assert.throws(() => Model.create(seed, 0), RangeError);
  for (const difficulty of [-1, 3, .5, NaN, Infinity, null, '1']) assert.throws(() => Model.create(731, difficulty), RangeError);
});
test('scenario and physics are deeply frozen and all mutable state belongs to its own instance', () => {
  const a = Model.create(731, 2), b = Model.create(731, 2), before = copy(b);
  assert.ok(Object.isFrozen(a.physics) && Object.isFrozen(a.physics.frequencyPhaseUnitsPerTick));
  assert.ok(Object.isFrozen(a.scenario) && Object.isFrozen(a.scenario.initialPhaseUnits));
  assert.throws(() => { a.physics.frequencyPhaseUnitsPerTick[0] = 50; }, TypeError);
  a.boards[0].phaseUnits += 40; a.pedestrians[0].contactTicks = 4; a.inputState.quarantined = true;
  assert.deepEqual(b, before); assert.deepEqual(Model.create(731, 2), before); assert.notStrictEqual(a.scenario, b.scenario);
});
test('zero dt does not consume input and invalid active dt throws before any mutation', () => {
  const s = Model.create(), before = copy(s); assert.strictEqual(Model.step(s, 0, { a: true, cancelEpoch: 3 }), s); assert.deepEqual(s, before);
  for (const bad of [undefined, null, NaN, Infinity, -DT, DT / 2, '0.0166666667', DT + 2e-12]) {
    assert.throws(() => Model.step(s, bad, { b: true }), RangeError); assert.deepEqual(s, before);
  }
  Model.step(s, DT + 5e-13, {}); assert.equal(s.tick, 1); assert.equal(s.elapsed, DT); assert.equal(s.lastInterval.toTick, 1);
});
test('frequency cycling preserves command-instant physical position and a held button cannot repeat it', () => {
  const s = Model.create(); tick(s, { a: true }); const action = s.actionReceipts[0];
  assert.equal(action.kind, 'frequency'); assert.equal(action.before.frequencyIndex, 0); assert.equal(action.after.frequencyIndex, 1);
  for (const key of ['phaseUnits', 'resonanceUnits', 'amplitudeMetres', 'heightMetres']) assert.equal(action.after[key], action.before[key]);
  assert.equal(s.boards[0].phaseUnits, 15); assert.equal(s.boards[0].resonanceUnits, 1);
  tick(s, { a: true }); assert.equal(s.actionReceipts.length, 1); assert.equal(s.lastAction, null);
  tick(s); tick(s, { a: true }); tick(s); tick(s, { a: true });
  assert.deepEqual(s.actionReceipts.map(r => [r.before.frequencyIndex, r.after.frequencyIndex]), [[0, 1], [1, 2], [2, 0]]);
});
test('one phase pulse adds exactly 250 units over ten actual intervals and reports the next speed separately', () => {
  const s = calm(); tick(s, { b: true }); const action = s.actionReceipts[0];
  assert.equal(action.pulseStartedAtTick, 0); assert.equal(action.extraPhaseUnits, 250); assert.equal(action.after.trimTicksRemaining, 10);
  assert.equal(action.before.phaseUnits, action.after.phaseUnits); assert.equal(action.before.heightMetres, action.after.heightMetres);
  assert.equal(s.boards[0].phaseUnits, 35); assert.equal(s.boards[0].trimTicksRemaining, 9); assert.equal(s.phasePulseReceipts.length, 0);
  many(s, 8, { b: true }); assert.equal(s.boards[0].trimTicksRemaining, 1); assert.equal(s.phasePulseReceipts.length, 0);
  tick(s, { b: true }); assert.equal(s.boards[0].phaseUnits, 350); assert.equal(s.boards[0].effectivePhaseUnitsPerTick, 10);
  assert.equal(s.lastInterval.oscillators[0].effectivePhaseUnitsPerTick, 35); assert.equal(s.lastInterval.oscillators[0].pulseIncrementUnits, 25);
  assert.deepEqual(s.phasePulseReceipts[0], { id: 1, fromTick: 9, tick: 10, pulseId: 1, actionReceiptId: 1, boardIndex: 0,
    startedAtTick: 0, completedAtTick: 10, intervalCount: 10, extraPhaseUnits: 250 });
  assert.equal(s.boards[0].activePulseId, null); assert.equal(s.boards[0].activePulseStartedAtTick, null); assert.equal(s.boards[0].completedPulseCount, 1);
});
test('a fresh pulse on the old pulse final interval is rejected and does not extend or reuse its id', () => {
  const s = calm(); tick(s, { b: true }); many(s, 8); tick(s, { b: true });
  assert.equal(s.actionReceipts[1].reason, 'phase-pulse-active'); assert.equal(s.actionReceipts[1].pulseId, null);
  assert.deepEqual(s.actionReceipts[1].before, s.actionReceipts[1].after); assert.equal(s.phasePulseReceipts.length, 1); assert.equal(s.boards[0].trimTicksRemaining, 0);
  tick(s); tick(s, { b: true }); assert.equal(s.actionReceipts[2].pulseId, 2); assert.equal(s.actionReceipts[2].pulseStartedAtTick, 11);
});
test('resonance depends on actual effective speed so a pulse cools the resonant base frequency', () => {
  const s = calm(); board(s, 0, 0, 1, 120); tick(s, { b: true }); many(s, 9);
  assert.equal(s.boards[0].resonanceUnits, 100); assert.equal(s.boards[0].phaseUnits, 400);
  assert.equal(s.lastInterval.oscillators[0].effectivePhaseUnitsPerTick, 40); assert.equal(s.boards[0].effectivePhaseUnitsPerTick, 15);
  tick(s); assert.equal(s.boards[0].resonanceUnits, 101); assert.equal(s.boards[0].phaseUnits, 415);
  const low = calm(); board(low, 0, 0, 2, 1); tick(low); assert.equal(low.boards[0].resonanceUnits, 0);
});
test('resonance 1200 is safe while a real 1201 overshoot is retained and fails', () => {
  const s = calm(); board(s, 0, 0, 1, 1199); tick(s);
  assert.equal(s.boards[0].resonanceUnits, 1200); near(s.boards[0].amplitudeMetres, 1.2); assert.equal(s.phase, 'playing');
  tick(s); assert.equal(s.boards[0].resonanceUnits, 1201); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'unstable-amplitude');
  assert.equal(s.failures[0].boardIndex, 0); assert.equal(s.failures[0].resonanceUnits, 1201); assert.ok(s.boards[0].amplitudeMetres > 1.2);
});
test('full-interval contact uses both endpoint gaps and includes the mathematical 0.35 boundary without tolerance widening', () => {
  const safe = calm(1500); board(safe, 1, 1500, 0, 1050); tick(safe); const a = safe.lastInterval.contacts[1];
  near(a.gapFrom, .35, 1e-12); assert.ok(a.gapFrom <= .35); assert.equal(a.safe, true); assert.equal(a.closing, true);
  assert.equal(a.maxGapMetres, Math.max(Math.abs(a.gapFrom), Math.abs(a.gapTo)));
  const unsafe = calm(1500); board(unsafe, 1, 1500, 0, 1051); tick(unsafe); const b = unsafe.lastInterval.contacts[1];
  assert.ok(b.gapFrom > .35 && b.gapTo < .35); assert.equal(b.safe, false); assert.equal(b.closing, true);
  assert.equal(b.sourceNode, 1); assert.equal(b.destinationNode, 2);
});
test('24 closing safe intervals qualify crossing at their end but never count its first movement twice', () => {
  const s = calm(2700); s.cursor = 3; tick(s, { a: true }); many(s, 22);
  assert.equal(s.pedestrians[0].stage, 'waiting'); assert.equal(s.pedestrians[0].contactTicks, 23); assert.equal(s.pedestrians[0].movementTicks, 0);
  tick(s); const p = s.pedestrians[0], event = s.pedestrianEvents.find(e => e.kind === 'crossing-started');
  assert.equal(p.stage, 'crossing'); assert.equal(p.crossingAgeTicks, 0); assert.equal(p.movementTicks, 0); assert.equal(p.crossingStartedAtTick, 24);
  assert.equal(event.qualifiedContactTicks, 24); assert.equal(event.startedAtTick, 24); assert.equal(event.closing, true);
  tick(s); assert.equal(p.crossingAgeTicks, 1); assert.equal(p.movementTicks, 1);
});
test('an opening safe window caps contact at 24 while the person continues waiting', () => {
  const s = calm(); s.cursor = 3; tick(s, { a: true }); many(s, 24);
  assert.equal(s.pedestrians[0].stage, 'waiting'); assert.equal(s.pedestrians[0].contactTicks, 24);
  assert.equal(s.lastInterval.contacts[0].safe, true); assert.equal(s.lastInterval.contacts[0].closing, false);
  assert.equal(s.pedestrianEvents.filter(e => e.kind === 'crossing-started').length, 0); assert.equal(s.pedestrians[0].movementTicks, 0);
});
test('24 crossing and 120 walking intervals are separate and arrival earns no outgoing-edge contact', () => {
  const s = calm(2700); s.cursor = 3; tick(s, { a: true }); many(s, 23); many(s, 23);
  const p = s.pedestrians[0]; assert.equal(p.stage, 'crossing'); assert.equal(p.crossingAgeTicks, 23);
  tick(s); assert.equal(p.stage, 'walking'); assert.equal(p.node, 1); assert.equal(p.walkingAgeTicks, 0); assert.equal(p.movementTicks, 24); assert.equal(p.contactTicks, 0);
  many(s, 119); assert.equal(p.walkingAgeTicks, 119); assert.equal(p.stage, 'walking'); tick(s);
  assert.equal(p.stage, 'waiting'); assert.equal(p.edgeIndex, 1); assert.equal(p.contactTicks, 0); assert.equal(p.walkingAgeTicks, 0); assert.equal(p.movementTicks, 144);
  tick(s); assert.equal(p.contactTicks, 1); assert.equal(p.movementTicks, 144);
  assert.equal(s.pedestrianEvents.filter(e => e.kind === 'crossing-completed').length, 1);
  assert.equal(s.pedestrianEvents.filter(e => e.kind === 'walking-completed').length, 1);
});
test('contact belongs to each person and crossing-start height is its source node new endpoint', () => {
  const s = scheduled(calm(1000)); person(s, 0, 'waiting', 1, 0, 23); person(s, 1, 'waiting', 1, 0, 0);
  const oldHeight = s.boards[0].heightMetres; tick(s);
  assert.equal(s.pedestrians[0].stage, 'crossing'); assert.equal(s.pedestrians[0].crossingAgeTicks, 0);
  assert.equal(s.pedestrians[1].stage, 'waiting'); assert.equal(s.pedestrians[1].contactTicks, 1);
  assert.equal(s.pedestrians[0].heightMetres, s.boards[0].heightMetres); assert.notEqual(s.pedestrians[0].heightMetres, oldHeight);
});
test('unsafe crossing freezes the last safe height and progress while other people still advance', () => {
  const s = scheduled(calm(6420)); board(s, 0, 6420, 2); board(s, 1, 6420, 2);
  person(s, 0, 'crossing', 0, 23); person(s, 1, 'waiting', 1, 0, 5); const before = copy(s.pedestrians[0]); tick(s);
  const p = s.pedestrians[0], contact = s.lastInterval.contacts[0]; assert.ok(contact.gapFrom < .35 && contact.gapTo > .35);
  assert.equal(p.stage, 'fallen'); assert.equal(p.heightMetres, before.heightMetres); assert.equal(p.movementTicks, before.movementTicks);
  assert.equal(p.crossingAgeTicks, 0); assert.equal(p.crossingStartedAtTick, null); assert.equal(p.failedEdgeIndex, 0); assert.equal(p.edgeIndex, null);
  const fallen = s.pedestrianEvents.find(e => e.kind === 'fallen'); assert.equal(fallen.successfulCrossingIntervals, 23);
  assert.equal(fallen.heightMetres, before.heightMetres); assert.equal(fallen.intervalMaxGapMetres, contact.maxGapMetres);
  assert.equal(s.pedestrians[1].contactTicks, 6); assert.equal(s.lastInterval.pedestrians[1].after.contactTicks, 6);
  assert.equal(s.failures[0].eventId, fallen.id); assert.equal(s.lostReason, 'pedestrian-fall');
});
test('a safe crossing uses new endpoint heights and only its actual successful age for interpolation', () => {
  const s = scheduled(calm()); board(s, 0, 600); board(s, 1, 800); person(s, 0, 'crossing', 1, 5);
  const priorMax = s.pedestrians[0].crossingMaxGapMetres; tick(s); const p = s.pedestrians[0], contact = s.lastInterval.contacts[1];
  assert.equal(contact.safe, true); assert.equal(p.crossingAgeTicks, 6); assert.equal(p.movementTicks, 150);
  near(p.heightMetres, s.boards[0].heightMetres + (s.boards[1].heightMetres - s.boards[0].heightMetres) / 4);
  assert.equal(p.crossingMaxGapMetres, Math.max(priorMax, contact.maxGapMetres)); assert.equal(s.pedestrianEvents.length, 0);
});
test('dispatch releases the first person at fromTick and later people on their 600-tick scheduled beginnings', () => {
  const s = calm(); s.cursor = 3; tick(s, { a: true });
  assert.equal(s.dispatchAtTick, 0); assert.deepEqual(s.scheduledReleaseTicks, [0, 600, 1200]);
  assert.deepEqual(s.pedestrianEvents[0], { id: 1, fromTick: 0, tick: 1, kind: 'released', personId: 1, scheduledReleaseTick: 0, releasedAtTick: 0, node: 0 });
  assert.equal(s.pedestrians[0].contactTicks, 1); assert.equal(s.lastInterval.pedestrians[0].before.stage, 'waiting');
  assert.deepEqual(s.lastInterval.pedestrians[0].eventIds, [1]);
  // Boundary fixture: observe just before and at the second scheduled release; no intervening path is fabricated as evidence.
  s.tick = 599; s.elapsed = 599 / 60; s.deadlineTicksRemaining = 4801; s.boards.forEach((_, i) => board(s, i, 0));
  s.pedestrians[0].contactTicks = 0; tick(s); assert.equal(s.pedestrians[1].stage, 'pending');
  tick(s); assert.equal(s.pedestrians[1].releasedAtTick, 600); assert.equal(s.pedestrians[1].contactTicks, 1);
  const release = s.pedestrianEvents.find(e => e.personId === 2); assert.equal(release.fromTick, 600); assert.equal(release.tick, 601);
});
test('repeated gate dispatch and gate B reject without changing or cancelling the released queue', () => {
  const s = calm(); s.cursor = 3; tick(s, { a: true }); tick(s); const schedule = copy(s.scheduledReleaseTicks);
  tick(s, { a: true }); assert.equal(s.lastAction.reason, 'already-dispatched'); assert.deepEqual(s.lastAction.before, s.lastAction.after);
  tick(s); tick(s, { b: true }); assert.equal(s.lastAction.reason, 'no-oscillator'); assert.equal(s.lastAction.kind, 'phase');
  assert.equal(s.lastAction.boardIndex, null); assert.deepEqual(s.scheduledReleaseTicks, schedule); assert.equal(s.dispatchAtTick, 0); assert.equal(s.pedestrianEvents.length, 1);
});
test('an unsafe waiting interval resets only that person contact and never creates a fall before crossing', () => {
  const s = scheduled(calm(1500)); person(s, 0, 'waiting', 0, 0, 23); tick(s);
  assert.equal(s.lastInterval.contacts[0].safe, false); assert.equal(s.pedestrians[0].stage, 'waiting'); assert.equal(s.pedestrians[0].contactTicks, 0);
  assert.equal(s.pedestrians[0].movementTicks, 0); assert.deepEqual(s.failures, []); assert.equal(s.fallenCount, 0);
});
test('a final safe pass exactly at tick 5400 succeeds and emits only the actual passed event', () => {
  const s = finalCrossing(); tick(s); assert.equal(s.tick, 5400); assert.equal(s.phase, 'won'); assert.equal(s.score, 1300);
  assert.equal(s.passedCount, 3); assert.equal(s.remainingCount, 0); assert.equal(s.fallenCount, 0); assert.deepEqual(s.failures, []);
  assert.equal(s.lastInterval.deadlineReached, true); assert.deepEqual(s.pedestrianEvents.map(e => e.kind), ['passed']);
  const event = s.pedestrianEvents[0]; assert.equal(event.successfulCrossingIntervals, 24); assert.equal(event.movementTicks, 456); assert.equal(event.completedAtTick, 5400);
  assert.equal(s.pedestrians[2].movementTicks, 456); assert.equal(s.pedestrians[2].heightMetres, 0);
});
test('tick 5400 fails only when people remain and there is no mechanical failure', () => {
  const s = calm(); s.tick = 5399; s.elapsed = 5399 / 60; s.deadlineTicksRemaining = 1; tick(s);
  assert.equal(s.lostReason, 'deadline'); assert.deepEqual(s.failures, [{ kind: 'deadline', fromTick: 5399, tick: 5400, remainingCount: 3, deadlineTicks: 5400 }]);
  assert.equal(s.score, 0); assert.equal(s.stage, 'finished'); assert.equal(s.deadlineTicksRemaining, 0);
});
test('amplitude failure defeats a simultaneous last-person pass while preserving the natural pass', () => {
  const s = finalCrossing(); board(s, 0, 0, 1, 1200); tick(s);
  assert.equal(s.passedCount, 3); assert.equal(s.pedestrians[2].stage, 'passed'); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'unstable-amplitude');
  assert.equal(s.score, 0); assert.deepEqual(s.failures.map(f => f.kind), ['unstable-amplitude']); assert.equal(s.pedestrianEvents[0].kind, 'passed');
});
test('all simultaneous amplitude and fall facts retain stable priority and suppress an additional deadline fact', () => {
  const s = scheduled(calm(), 5399, 0); board(s, 0, 280, 1, 1200); board(s, 1, 280, 1, 1200); board(s, 2, 6420, 2);
  person(s, 0, 'crossing', 0, 23); person(s, 1, 'crossing', 3, 23); person(s, 2, 'walking', 2, 10); tick(s);
  assert.deepEqual(s.failures.map(f => [f.kind, f.boardIndex ?? null, f.personId ?? null]), [
    ['unstable-amplitude', 0, null], ['unstable-amplitude', 1, null], ['pedestrian-fall', null, 1], ['pedestrian-fall', null, 2] ]);
  assert.equal(s.lastInterval.deadlineReached, true); assert.equal(s.pedestrians[2].walkingAgeTicks, 11); assert.equal(s.pedestrians[2].movementTicks, 179);
  assert.equal(s.fallenCount, 2); assert.equal(s.remainingCount, 1); assert.equal(s.lostReason, 'unstable-amplitude');
});
test('cancellation isolates controls but an existing pulse and phase continue until genuine full neutral', () => {
  const s = calm(); tick(s, { b: true }); tick(s, { cancelled: true, b: true, x: 1 });
  assert.equal(s.boards[0].phaseUnits, 70); assert.equal(s.boards[0].trimTicksRemaining, 8); assert.equal(s.actionReceipts.length, 1);
  assert.equal(s.inputState.quarantined, true); assert.equal(s.lastInput.neutralAcknowledged, false); assert.equal(s.cursor, 0);
  tick(s, { y: .45 }); assert.equal(s.inputState.quarantined, true); tick(s, { cancelled: true }); assert.equal(s.lastInput.neutralAcknowledged, false);
  tick(s, { x: .449, y: -.449 }); assert.equal(s.inputState.quarantined, false); assert.equal(s.lastInput.neutralAcknowledged, true); assert.equal(s.actionReceipts.length, 1);
  many(s, 5); assert.equal(s.phasePulseReceipts.length, 1); assert.equal(s.boards[0].phaseUnits, 350);
});
test('finite cancellation epochs retain their exact values and explicit cancellation remains a separate flag', () => {
  const s = calm(); tick(s, { cancelEpoch: -.5, a: true });
  assert.equal(s.lastInput.epochChanged, true); assert.equal(s.lastInput.cancelled, false); assert.equal(s.inputState.cancelEpoch, -.5); assert.equal(s.actionReceipts.length, 0);
  tick(s); assert.equal(s.lastInput.neutralAcknowledged, true);
  for (const bad of [NaN, Infinity, '3']) { tick(s, { cancelEpoch: bad }); assert.equal(s.inputState.cancelEpoch, -.5); assert.equal(s.lastInput.epochChanged, false); }
  tick(s, { cancelEpoch: -.75 }); assert.equal(s.lastInput.epochChanged, true); assert.equal(s.inputState.cancelEpoch, -.75);
  tick(s, { cancelled: true }); assert.equal(s.lastInput.cancelled, true); assert.equal(s.lastInput.epochChanged, false); assert.equal(s.lastInput.neutralAcknowledged, false);
});
test('only literal button true creates a fresh action and held or pressed-alias inputs do not repeat', () => {
  const s = calm(); tick(s, { a: 1, b: 'yes', aPressed: true, bPressed: true, x: Infinity, y: NaN });
  assert.equal(s.actionReceipts.length, 0); assert.equal(s.lastInput.a, false); assert.equal(s.lastInput.b, false); assert.equal(s.lastInput.x, 0); assert.equal(s.lastInput.y, 0);
  tick(s, { a: true }); many(s, 2, { a: true }); assert.equal(s.actionReceipts.length, 1); assert.equal(s.lastInput.aFresh, false);
  tick(s); tick(s, { a: true }); assert.equal(s.actionReceipts.length, 2); assert.equal(s.boards[0].frequencyIndex, 2);
});
test('navigation uses inclusive horizontal thresholds, exact repeat ages and zero delta at a clamped boundary', () => {
  const s = calm(); tick(s, { y: 1 }); assert.equal(s.cursor, 0); assert.equal(s.inputState.navigationHeldTicks, 0);
  tick(s, { x: .45 }); assert.equal(s.cursor, 1); many(s, 22, { x: .45 }); assert.equal(s.cursor, 1);
  tick(s, { x: .45 }); assert.equal(s.cursor, 2); many(s, 12, { x: .45 }); assert.equal(s.cursor, 3);
  many(s, 12, { x: .45 }); assert.equal(s.cursor, 3); assert.equal(s.inputState.navigationHeldTicks, 48); assert.equal(s.lastInput.navigationApplied, 0);
  tick(s, { x: -.45 }); assert.equal(s.cursor, 2); assert.equal(s.lastInput.navigationHeldTicks, 1); assert.equal(s.lastInput.navigationApplied, -1);
});
test('navigation happens before prioritized B and simultaneous fresh A is consumed without a deferred frequency command', () => {
  const s = calm(); tick(s, { x: .45, a: true, b: true });
  assert.equal(s.cursor, 1); assert.equal(s.lastAction.boardIndex, 1); assert.equal(s.lastAction.kind, 'phase');
  assert.equal(s.lastInput.aFresh, true); assert.equal(s.lastInput.bFresh, true); assert.equal(s.lastInput.navigationApplied, 1);
  assert.equal(s.boards[1].frequencyIndex, 0); assert.equal(s.boards[1].trimTicksRemaining, 9);
  tick(s, { a: true }); assert.equal(s.actionReceipts.length, 1); tick(s); tick(s, { a: true });
  assert.equal(s.actionReceipts.length, 2); assert.equal(s.lastAction.kind, 'frequency'); assert.equal(s.boards[1].frequencyIndex, 1);
});
test('receipts are deeply immutable, interval endpoints are detached and lastAction is only current-interval activity', () => {
  const s = calm(); tick(s, { b: true }); const receipt = s.actionReceipts[0], saved = copy(receipt), interval = s.lastInterval, intervalSaved = copy(interval);
  assert.ok(Object.isFrozen(receipt) && Object.isFrozen(receipt.before) && Object.isFrozen(receipt.after)); assert.strictEqual(s.lastAction, receipt);
  assert.throws(() => { receipt.after.phaseUnits = 999; }, TypeError); tick(s);
  assert.equal(s.lastAction, null); assert.equal(s.lastInterval.actionReceiptId, null); assert.deepEqual(receipt, saved); assert.deepEqual(interval, intervalSaved);
  many(s, 8); assert.ok(Object.isFrozen(s.phasePulseReceipts[0])); assert.equal(s.phasePulseReceipts[0].extraPhaseUnits, 250);
  const p = calm(2700); p.cursor = 3; tick(p, { a: true }); const release = p.pedestrianEvents[0], old = copy(release); many(p, 23);
  assert.ok(Object.isFrozen(release)); assert.deepEqual(release, old); assert.notStrictEqual(p.lastInterval.pedestrians[0].after, p.pedestrians[0]);
});
test('zero-time pause and both terminal outcomes freeze all physical, input and receipt fields', () => {
  const active = calm(); tick(active, { b: true }); const paused = copy(active);
  Model.step(active, 0, { a: true, b: true, cancelled: true, cancelEpoch: 9 }); assert.deepEqual(active, paused);
  tick(active); assert.equal(active.boards[0].phaseUnits, paused.boards[0].phaseUnits + 35); assert.equal(active.tick, paused.tick + 1);
  const won = finalCrossing(); tick(won); const lost = calm(); board(lost, 0, 0, 1, 1200); tick(lost);
  for (const s of [won, lost]) { const before = copy(s); assert.strictEqual(Model.step(s, NaN, { a: true, b: true, cancelled: true }), s);
    Model.step(s, DT, { x: 1, cancelEpoch: 5 }); Model.step(s, 0, {}); assert.deepEqual(s, before); }
});
