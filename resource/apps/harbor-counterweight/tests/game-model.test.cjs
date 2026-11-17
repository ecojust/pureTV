'use strict';
// Synthetic boundary fixtures only. These are not ordinary solutions or browser evidence.
const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60;
const copy = x => structuredClone(x);
const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} vs ${expected}`);
const step = (s, input = {}) => Model.step(s, DT, input);
function ticks(s, count, input = {}) { for (let n = 0; n < count; n++) step(s, input); return s; }
function locations(s, stacks, delivered = [], hook = null, overboard = []) {
  s.stacks = copy(stacks); s.deliveredIds = delivered.slice(); s.hookId = hook; s.overboardIds = overboard.slice();
  const held = new Set([...stacks.flat(), ...delivered, ...overboard, ...(hook ? [hook] : [])]);
  s.shoreIds = s.loadOrder.filter(id => !held.has(id));
  const old = s.ship;
  s.ship = { ...Model.measureShip(s), rollRad: old.rollRad, angularVelocityRadS: old.angularVelocityRadS };
  return s;
}
function unloading(stacks, completed = 0) {
  const s = Model.create(1, 0); s.operationPhase = 'unloading'; s.loadJobsCompleted = 6; s.unloadJobsCompleted = completed;
  for (let n = 0; n < 6 + completed; n++) s.tasks[n].status = 'completed';
  locations(s, stacks, s.unloadOrder.slice(0, completed)); return s;
}
function departure() {
  const s = Model.create(1, 0); s.operationPhase = 'departure'; s.loadJobsCompleted = 6; s.unloadJobsCompleted = 4;
  s.tasks.forEach(t => { t.status = 'completed'; });
  locations(s, [[], ['C3'], ['C6'], []], s.unloadOrder);
  s.ballastPositionUnits = 0; s.ballastTargetUnits = 0;
  return s;
}
function atLoadStage(index, column = 1) {
  const s = Model.create(1, 0); s.cursor = column; step(s, { a: true });
  const c = s.crane, plan = s.jobStartReceipts[0].job.stages;
  c.stageIndex = index; c.stage = plan[index].stage; c.stageDurationTicks = plan[index].durationTicks;
  c.stageElapsedTicks = c.stageDurationTicks - 1; c.stageFromTick = 1;
  c.jobElapsedTicks = plan.slice(0, index).reduce((n, row) => n + row.durationTicks, 0) + c.stageElapsedTicks;
  if (index === 1 || index === 2) locations(s, [[], [], [], []], [], c.cargoId);
  if (index === 3) { const stacks = [[], [], [], []]; stacks[column] = [c.cargoId]; locations(s, stacks); }
  c.carriedId = s.hookId; return s;
}
function stationaryAt(s, theta) {
  const p = Model.measureShip(s);
  s.ship.rollRad = theta;
  s.ship.angularVelocityRadS = (p.restoringKNmPerRad * theta - p.gravityTorqueKNm) / (60 * p.inertiaTM2 - p.dampingKNmSPerRad);
}

test('create normalizes without coercion and exposes all frozen level facts', () => {
  assert.equal(Model.create('12', '2').seed, 729); assert.equal(Model.create(null, true).difficulty, 0);
  assert.equal(Model.create(-1.9, 7).seed, 4294967295); assert.equal(Model.create(5, -2).difficulty, 0);
  const expected = [[6, 3, 5, 4, 2, 6], [5, 7, 4, 3, 6, 5], [7, 4, 6, 5, 3, 7]];
  for (let d = 0; d < 3; d++) {
    const s = Model.create(Infinity, d); assert.equal(s.seed, 729); assert.equal(s.deadlineTick, 4500 + d * 300);
    assert.deepEqual(s.cargo.map(c => c.massT), expected[d]); assert.equal(s.tasks.length, 10);
    assert.equal(s.currentTask.id, 'load-1'); assert.equal(s.nextTask.id, 'load-2');
    assert.equal(s.ship.massT, 32); assert.equal(s.inventory.errorT, 0); assert.equal(s.crane.railXM, -6);
  }
});
test('creates, current task copies and caller snapshots are detached', () => {
  const a = Model.create(), b = Model.create(), untouched = copy(b);
  a.loadOrder.reverse(); a.currentTask.cargoId = 'changed'; a.physics.baseMassT = 0;
  assert.deepEqual(b, untouched); assert.equal(a.tasks[0].cargoId, 'C1');
  const snapshot = copy(b); snapshot.stacks[0].push('C1'); assert.deepEqual(b.stacks, [[], [], [], []]);
});
test('active dt zero and invalid dt leave every field and input latch untouched', () => {
  const s = Model.create(), before = copy(s);
  assert.equal(Model.step(s, 0, { a: true, cancelEpoch: 9 }), s); assert.deepEqual(s, before);
  for (const dt of [NaN, Infinity, -DT, DT * 2, '0.016666666666666666', null, DT + 2e-12]) {
    assert.throws(() => Model.step(s, dt, { b: true }), RangeError); assert.deepEqual(s, before);
  }
  Model.step(s, DT + 5e-13, {}); assert.equal(s.tick, 1); assert.equal(s.elapsed, DT);
});
test('pure mass helper covers empty, one and several cargo with correct tonne units', () => {
  const empty = Model.measureShip({ cargo: [], stacks: [[], [], [], []], ballastPositionUnits: 60 });
  assert.equal(empty.massT, 32); assert.equal(empty.firstMomentTM, 8); assert.equal(empty.inertiaTM2, 288);
  assert.equal(empty.centerOfMassXM, .25); assert.equal(empty.restoringKNmPerRad, 32 * 9.81 * 2);
  const input = { cargo: [{ id: 'heavy', massT: 7 }, { id: 'light', massT: 2 }], stacks: [[], ['heavy'], [], ['light']], ballastPositionUnits: 90 };
  const before = copy(input), p = Model.measureShip(input);
  assert.equal(p.massT, 41); assert.equal(p.firstMomentTM, 11); assert.deepEqual(input, before);
  assert.deepEqual(p.aboardIds, ['heavy', 'light']); assert.equal(p.gravityTorqueKNm, 9.81 * 11);
});
test('mirror configurations preserve inertia and negate moment and center', () => {
  const cargo = [{ id: 'A', massT: 6 }, { id: 'B', massT: 3 }, { id: 'C', massT: 4 }];
  const left = Model.measureShip({ cargo, stacks: [['A'], ['B', 'C'], [], []], ballastPositionUnits: 75 });
  const right = Model.measureShip({ cargo, stacks: [[], [], ['B', 'C'], ['A']], ballastPositionUnits: -75 });
  assert.equal(left.massT, right.massT); assert.equal(left.firstMomentTM, -right.firstMomentTM);
  assert.equal(left.centerOfMassXM, -right.centerOfMassXM); assert.equal(left.dampingKNmSPerRad, right.dampingKNmSPerRad);
});
test('pure helper rejects bad dimensions, identities, masses, units and overflow without mutation', () => {
  const valid = { cargo: [{ id: 'A', massT: 2 }], stacks: [['A'], [], [], []], ballastPositionUnits: 0 };
  const variants = [null, { ...valid, cargo: Array(7).fill({ id: 'A', massT: 1 }) }, { ...valid, cargo: [{ id: '', massT: 1 }] },
    { ...valid, cargo: [{ id: 'A', massT: 1 }, { id: 'A', massT: 2 }] }, { ...valid, cargo: [{ id: 'A', massT: 0 }] },
    { ...valid, cargo: [{ id: 'A', massT: NaN }] }, { ...valid, cargo: [{ id: 'A', massT: 1e200 }] },
    { ...valid, stacks: [['A'], ['A'], [], []] }, { ...valid, stacks: [['Z'], [], [], []] },
    { ...valid, stacks: [[], [], []] }, { ...valid, stacks: [['A', 'A', 'A'], [], [], []] },
    { ...valid, cargo: Array(1) }, { ...valid, stacks: Array(4) }, { ...valid, stacks: [Array(1), [], [], []] },
    ...[.5, 181, -181, '60', Infinity].map(ballastPositionUnits => ({ ...valid, ballastPositionUnits }))];
  for (const v of variants) { const before = copy(v); assert.throws(() => Model.measureShip(v), RangeError); assert.deepEqual(v, before); }
});
test('ballast B target changes before one-unit physical travel and toggles back to center', () => {
  const s = Model.create(); s.cursor = 2; step(s, { b: true });
  assert.equal(s.ballastTargetUnits, 60); assert.equal(s.ballastPositionUnits, 1);
  const r = s.commandReceipts[0]; assert.equal(r.before.ballastPositionUnits, 0); assert.equal(r.after.ballastPositionUnits, 0);
  assert.equal(s.lastInterval.ballast.deltaUnits, 1); ticks(s, 59);
  assert.equal(s.ballastPositionUnits, 60); step(s); assert.equal(s.ballastPositionUnits, 60);
  step(s, { b: true }); assert.equal(s.ballastTargetUnits, 0); assert.equal(s.ballastPositionUnits, 59);
  assert.equal(s.commandCount, 2); assert.equal(s.ballastTargetChangeCount, 2);
});
test('fresh direction moves at held ages 1,20,30 and sign changes restart immediately', () => {
  const s = Model.create(); step(s, { x: 1 }); assert.equal(s.cursor, 1);
  ticks(s, 18, { x: 1 }); assert.equal(s.cursor, 1); step(s, { x: 1 }); assert.equal(s.cursor, 2);
  ticks(s, 9, { x: 1 }); assert.equal(s.cursor, 2); step(s, { x: 1 }); assert.equal(s.cursor, 3);
  assert.deepEqual(s.navigationReceipts.map(r => r.heldTicks), [1, 20, 30]);
  step(s, { x: -1 }); assert.equal(s.cursor, 2); assert.equal(s.inputState.navigationHeldTicks, 1);
  step(s, { x: .25 }); assert.equal(s.inputState.navigationHeldTicks, 0);
});
test('B consumes both fresh actions and suppresses only this navigation opportunity', () => {
  const s = Model.create(); step(s, { x: 1, aPressed: true, bPressed: true });
  assert.equal(s.cursor, 0); assert.equal(s.commandCount, 1); assert.equal(s.commandReceipts[0].inputKey, 'b');
  assert.equal(s.lastInput.navigationSuppressed, true); assert.equal(s.jobsStarted, 0);
  ticks(s, 18, { x: 1, aPressed: true, bPressed: true }); assert.equal(s.cursor, 0); assert.equal(s.jobsStarted, 0);
  step(s, { x: 1, a: true, b: true }); assert.equal(s.cursor, 1); assert.equal(s.commandCount, 1);
});
test('action pulses require a real neutral sample; navigation precedes A', () => {
  const s = Model.create(); step(s, { x: 1, aPressed: true });
  assert.equal(s.crane.column, 1); assert.equal(s.lastOperation.after.crane.stageElapsedTicks, 0);
  ticks(s, 3, { aPressed: true }); assert.equal(s.blockedCommands, 0);
  step(s); step(s, { aPressed: true }); assert.equal(s.blockedCommands, 1); assert.equal(s.blockedReceipts[0].reason, 'crane-busy');
  assert.equal(s.commandCount, 1);
});
test('cancel quarantine blocks both navigation and actions without cancelling accepted crane work', () => {
  const s = Model.create(); step(s, { a: true }); const job = s.crane.jobId;
  step(s, { x: 1, a: true, b: true, cancelEpoch: 2 });
  assert.equal(s.crane.jobId, job); assert.equal(s.crane.jobElapsedTicks, 2); assert.equal(s.cursor, 0);
  assert.equal(s.inputState.quarantined, true); assert.equal(s.inputState.navigationHeldTicks, 0);
  step(s, { cancelled: true, cancelEpoch: 2 }); assert.equal(s.inputState.quarantined, true);
  step(s, { x: 1, cancelEpoch: 2 }); assert.equal(s.cursor, 0);
  step(s, { y: 1, cancelEpoch: 2 }); assert.equal(s.lastInput.quarantineReleased, true); assert.equal(s.commandCount, 1);
  step(s, { x: 1, bPressed: true, cancelEpoch: 2 }); assert.equal(s.commandCount, 2); assert.equal(s.cursor, 0);
});
test('nonfinite axis is neutral and epoch changes use nonnegative safe integers', () => {
  const s = Model.create();
  for (const x of [NaN, Infinity, '1', true]) { step(s, { x, cancelEpoch: -1 }); assert.equal(s.cursor, 0); assert.equal(s.lastInput.sample.x, 0); }
  step(s, { x: 100, cancelEpoch: 0 }); assert.equal(s.cursor, 1); assert.equal(s.lastInput.sample.x, 1);
  step(s, { cancelEpoch: 5 }); step(s, { cancelEpoch: 5 }); assert.equal(s.inputState.quarantined, false);
  step(s, { cancelEpoch: 4, a: true }); assert.equal(s.inputState.quarantined, true); assert.equal(s.jobsStarted, 0);
  step(s, { cancelEpoch: 4.1 }); assert.equal(s.inputState.cancelEpoch, 4);
});
test('all column job travel metadata is exact and accepted endpoints remain fixed', () => {
  for (let col = 0; col < 4; col++) {
    const s = Model.create(); s.cursor = col; step(s, { a: true });
    const job = s.jobStartReceipts[0].job;
    assert.equal(job.travelTicks, [60, 100, 140, 180][col]); assert.equal(job.jobTotalTicks, [168, 248, 328, 408][col]);
    assert.equal(job.startedFromTick, 0); assert.equal(job.startedAtTick, 1); assert.equal(job.destination.column, col);
    assert.equal(s.crane.railXM, -6); s.cursor = 3 - col; step(s);
    assert.equal(s.crane.column, col); assert.deepEqual(s.jobStartReceipts[0].job, job);
  }
});
test('shore pickup commits only at lift boundary and hook excludes cargo from ship mass', () => {
  const s = Model.create(); step(s, { a: true }); ticks(s, 22);
  assert.equal(s.tick, 23); assert.equal(s.hookId, null); assert.equal(s.shoreIds[0], 'C1');
  step(s); assert.equal(s.hookId, 'C1'); assert.equal(s.loadQueueIndex, 1); assert.equal(s.ship.massT, 32);
  assert.equal(s.crane.stage, 'carry-to-ship'); assert.equal(s.crane.stageElapsedTicks, 0);
  assert.equal(s.lastInterval.crane.advancedStage.elapsedAfter, 24); assert.equal(s.inventory.hookMassT, 6);
  assert.equal(s.transferReceipts[0].boundary, 'shore-pickup'); assert.equal(s.transferReceipts[0].tick, 24);
});
test('carry boundary changes stage without duplicate transfer or advancing next stage', () => {
  const s = atLoadStage(1); step(s);
  assert.equal(s.crane.stage, 'lower-ship'); assert.equal(s.crane.stageElapsedTicks, 0); assert.equal(s.crane.railXM, -1);
  assert.equal(s.hookId, 'C1'); assert.equal(s.lastInterval.crane.transferReceiptIds.length, 0);
  assert.equal(s.lastInterval.crane.advancedStage.durationTicks, 100); assert.equal(s.lastInterval.roll.massT, 32);
});
test('deposit adds actual ship mass in the same roll interval but does not complete full job', () => {
  const s = atLoadStage(2); s.ship.rollRad = .02; s.ship.angularVelocityRadS = -.01; step(s);
  assert.deepEqual(s.stacks[1], ['C1']); assert.equal(s.hookId, null); assert.equal(s.ship.massT, 38);
  assert.equal(s.loadJobsCompleted, 0); assert.equal(s.jobsCompleted, 0); assert.equal(s.crane.stage, 'return-shore');
  const r = s.lastInterval.roll; assert.equal(r.thetaBeforeRad, .02); assert.equal(r.omegaBeforeRadS, -.01);
  assert.equal(r.massT, 38); assert.equal(r.firstMomentTM, -6);
  near(r.alphaRadS2, (9.81 * -6 - 38 * 9.81 * 2 * .02 - (2 * .68) * Math.sqrt((38 * 9) * (38 * 9.81 * 2)) * -.01) / (38 * 9));
  assert.equal(r.thetaAfterRad, .02 + r.omegaAfterRadS / 60);
});
test('full load completes after all real empty-return ticks, with permanent boundary records', () => {
  const s = Model.create(); s.cursor = 1; step(s, { a: true }); ticks(s, 246);
  assert.equal(s.phase, 'playing'); assert.equal(s.crane.jobElapsedTicks, 247); assert.equal(s.loadJobsCompleted, 0);
  step(s); assert.equal(s.tick, 248); assert.equal(s.loadJobsCompleted, 1); assert.equal(s.crane.idle, true);
  assert.equal(s.crane.railXM, -6); assert.equal(s.jobCompletionReceipts[0].jobElapsedTicks, 248);
  assert.deepEqual(s.craneStageReceipts.map(r => r.tick), [24, 124, 148, 248]);
  assert.equal(s.transferReceipts.length, 2); assert.equal(s.currentTask.id, 'load-2'); assert.equal(s.tasks[0].completedAtTick, 248);
});
test('unload approach keeps ship ownership then lift boundary excludes cargo without impulse', () => {
  const s = unloading([[], ['C2'], [], []]); s.cursor = 1; step(s, { a: true }); ticks(s, 99);
  assert.equal(s.crane.stage, 'lift-ship'); assert.equal(s.crane.stageElapsedTicks, 0); assert.equal(s.ship.massT, 35);
  ticks(s, 23); assert.equal(s.hookId, null); const prior = copy(s.ship); step(s);
  assert.equal(s.hookId, 'C2'); assert.equal(s.ship.massT, 32); assert.equal(s.unloadJobsCompleted, 0);
  assert.equal(s.lastInterval.roll.thetaBeforeRad, prior.rollRad); assert.equal(s.lastInterval.roll.omegaBeforeRadS, prior.angularVelocityRadS);
  assert.equal(s.transferReceipts[0].boundary, 'ship-pickup'); assert.equal(s.transferReceipts[0].from.tier, 0);
});
test('unload finishes only after carry and shore lowering with exact mass conservation', () => {
  const s = unloading([[], ['C2'], [], []]); s.cursor = 1; step(s, { a: true }); ticks(s, 246);
  assert.equal(s.hookId, 'C2'); assert.equal(s.deliveredIds.length, 0); step(s);
  assert.equal(s.crane.idle, true); assert.deepEqual(s.deliveredIds, ['C2']); assert.equal(s.unloadJobsCompleted, 1);
  assert.deepEqual(s.transferReceipts.map(r => r.boundary), ['ship-pickup', 'shore-delivery']);
  assert.equal(s.inventory.errorT, 0); assert.equal(s.inventory.totalLocationMassT, 26); assert.equal(s.currentTask.id, 'unload-2');
});
test('A rejection priority distinguishes full, empty, covered, wrong column and busy without queueing', () => {
  const cases = [
    [locations(Model.create(), [['C2', 'C3'], [], [], []]), 'load-full'],
    [unloading([[], ['C2'], [], []]), 'empty-column'],
    [unloading([['C2', 'C3'], [], [], []]), 'required-covered'],
    [unloading([['C3'], ['C2'], [], []]), 'wrong-column'],
    [departure(), 'task-complete']
  ];
  for (const [s, reason] of cases) {
    const own = { stacks: copy(s.stacks), hookId: s.hookId, shoreIds: s.shoreIds.slice() }; step(s, { a: true });
    assert.equal(s.blockedReceipts[0].reason, reason); assert.equal(s.commandCount, 0); assert.equal(s.jobsStarted, 0);
    assert.deepEqual(s.blockedReceipts[0].before, s.blockedReceipts[0].after); assert.deepEqual(s.stacks, own.stacks);
    assert.equal(s.hookId, own.hookId); assert.deepEqual(s.shoreIds, own.shoreIds);
  }
  const s = atLoadStage(0); step(s); step(s, { a: true }); assert.equal(s.blockedReceipts[0].reason, 'crane-busy');
});
test('lastInterval describes actual semi-implicit dynamics with signed mirror evolution', () => {
  const a = Model.create(), b = Model.create(); locations(a, [[], ['C1'], [], []]); locations(b, [[], [], ['C1'], []]);
  a.ballastPositionUnits = 40; a.ballastTargetUnits = 60; b.ballastPositionUnits = -40; b.ballastTargetUnits = -60;
  a.ship.rollRad = .04; a.ship.angularVelocityRadS = -.03; b.ship.rollRad = -.04; b.ship.angularVelocityRadS = .03;
  step(a); step(b); const r = a.lastInterval.roll;
  assert.equal(a.ballastPositionUnits, 41); assert.equal(r.ballastXM, 41 / 60); assert.equal(r.firstMomentTM, 8 * (41 / 60) - 6);
  assert.equal(r.omegaAfterRadS, r.omegaBeforeRadS + r.alphaRadS2 / 60); assert.equal(r.thetaAfterRad, r.thetaBeforeRad + r.omegaAfterRadS / 60);
  near(a.ship.rollRad, -b.ship.rollRad); near(a.ship.angularVelocityRadS, -b.ship.angularVelocityRadS);
  assert.deepEqual(r.aboard, [{ id: 'C1', massT: 6, column: 1, tier: 0, columnXM: -1 }]);
});
test('unsafe threshold is strict, resets consecutive count, and sustained failure occurs at 90', () => {
  const at = Model.create(); at.unsafeTicks = 88; at.maxUnsafeTicks = 88; stationaryAt(at, at.limits.unsafeRollRad); step(at);
  assert.equal(at.ship.rollRad, at.limits.unsafeRollRad); assert.equal(at.unsafeTicks, 0); assert.equal(at.maxUnsafeTicks, 88);
  const over = Model.create(); over.unsafeTicks = 88; over.maxUnsafeTicks = 88; stationaryAt(over, .25); step(over);
  assert.equal(over.unsafeTicks, 89); assert.equal(over.phase, 'playing'); step(over);
  assert.equal(over.unsafeTicks, 90); assert.equal(over.lostReason, 'sustained-heel'); assert.equal(over.lastInterval.failures[0].unit, 'ticks');
});
test('overboard threshold is inclusive, spills one downhill-most top cargo and retains pre-spill dynamics', () => {
  for (const sign of [-1, 1]) {
    const s = Model.create(); locations(s, [['C1', 'C2'], [], [], ['C3', 'C4']]);
    stationaryAt(s, sign * s.limits.overboardRollRad); step(s);
    assert.equal(Math.abs(s.ship.rollRad), s.limits.overboardRollRad); assert.equal(s.lostReason, 'overboard');
    const id = sign > 0 ? 'C4' : 'C2', col = sign > 0 ? 3 : 0;
    assert.deepEqual(s.overboardIds, [id]); assert.equal(s.lastInterval.roll.aboardIds.length, 4); assert.equal(s.ship.aboardIds.length, 3);
    assert.equal(s.transferReceipts[0].from.column, col); assert.equal(s.transferReceipts[0].from.tier, 1);
    assert.equal(s.transferReceipts[0].jobId, null); assert.equal(s.inventory.errorT, 0);
    assert.equal(s.lastInterval.roll.massT - s.ship.massT, s.transferReceipts[0].massT);
  }
});
test('large roll with no aboard cargo creates no invented spill', () => {
  const s = Model.create(); stationaryAt(s, .5); step(s);
  assert.equal(s.phase, 'playing'); assert.deepEqual(s.overboardIds, []); assert.equal(s.lastInterval.safety.overboardEligible, false);
  assert.equal(s.unsafeTicks, 1); assert.equal(s.transferReceipts.length, 0);
});
test('same-tick deposit and spill retain separate transfers and failure priority over heel and deadline', () => {
  const s = atLoadStage(2, 3); s.ship.rollRad = .6; s.ship.angularVelocityRadS = 0;
  s.unsafeTicks = 89; s.maxUnsafeTicks = 89; s.deadlineTick = s.tick + 1; step(s);
  assert.deepEqual(s.lastInterval.failures.map(f => f.kind), ['overboard', 'sustained-heel', 'deadline']);
  assert.equal(s.lostReason, 'overboard'); assert.deepEqual(s.transferReceipts.map(r => r.boundary), ['ship-deposit', 'overboard']);
  assert.equal(s.lastInterval.roll.massT, 38); assert.equal(s.ship.massT, 32); assert.equal(s.hookId, null);
  assert.deepEqual(s.lastInterval.crane.transferReceiptIds, [1]); assert.deepEqual(s.lastInterval.transferReceiptIds, [1, 2]);
  assert.equal(s.transferReceipts[1].activeJobId, s.crane.jobId); assert.equal(s.events.at(-1).type, 'loss');
});
test('departure requires 240 actual stable intervals and at-target ballast', () => {
  const s = departure(); ticks(s, 239); assert.equal(s.phase, 'playing'); assert.equal(s.stableTicks, 239);
  step(s); assert.equal(s.phase, 'won'); assert.equal(s.stableTicks, 240);
  assert.equal(s.score, 1000 + 2 * Math.floor((4500 - 240) / 60) + 100);
  const moving = departure(); moving.stableTicks = 12; moving.ballastTargetUnits = 60; step(moving);
  assert.equal(moving.stableTicks, 0); assert.equal(moving.lastInterval.departure.ballastAtTarget, false);
});
test('final actual shore delivery can be the first departure stable sample', () => {
  const s = unloading([[], ['C3'], ['C6'], ['C4']], 3); s.cursor = 3; step(s, { a: true });
  const c = s.crane; locations(s, [[], ['C3'], ['C6'], []], s.unloadOrder.slice(0, 3), 'C4');
  c.stage = 'lower-shore'; c.stageIndex = 3; c.stageDurationTicks = 24; c.stageElapsedTicks = 23;
  c.jobElapsedTicks = c.jobTotalTicks - 1; c.carriedId = 'C4'; s.ship.rollRad = 0; s.ship.angularVelocityRadS = 0;
  step(s); assert.equal(s.operationPhase, 'departure'); assert.equal(s.stableTicks, 1); assert.equal(s.currentTask, null);
  assert.equal(s.lastInterval.operationPhaseBefore, 'unloading'); assert.equal(s.lastInterval.operationPhaseAfterCrane, 'departure');
  assert.equal(s.jobCompletionReceipts.at(-1).operationPhaseAfter, 'departure'); assert.equal(s.inventory.errorT, 0);
});
test('deadline beats the last stable sample, preserves prior stable count and freezes every field', () => {
  const s = departure(); s.stableTicks = 239; s.deadlineTick = 1; step(s, { a: true });
  assert.equal(s.lostReason, 'deadline'); assert.equal(s.stableTicks, 239); assert.equal(s.score, 0);
  assert.equal(s.lastInterval.departure.blockedByFailure, true); assert.equal(s.blockedCommands, 1);
  const before = copy(s); for (const dt of [0, DT, NaN, Infinity]) { assert.equal(Model.step(s, dt, { x: 1, b: true, cancelEpoch: 8 }), s); assert.deepEqual(s, before); }
  const won = departure(); won.stableTicks = 239; step(won); const saved = copy(won); Model.step(won, NaN, { a: true }); assert.deepEqual(won, saved);
});
test('invalid failure-free departure inventory is an error, but real final spill stays a loss', () => {
  const wrong = departure(); wrong.exportIds = ['C1', 'C2']; assert.throws(() => step(wrong), /Departure cargo invariant/);
  const spill = departure(); spill.ship.rollRad = .6; step(spill); assert.equal(spill.lostReason, 'overboard');
  assert.equal(spill.lastInterval.departure.inventoryValid, false);
});
test('permanent receipts are detached with unique event references and retry fully resets the world', () => {
  const s = Model.create(52, 1); step(s, { x: 1, a: true }); const cmd = copy(s.commandReceipts[0]);
  ticks(s, 24); assert.deepEqual(s.commandReceipts[0], cmd); assert.equal(cmd.after.crane.stageElapsedTicks, 0);
  assert.equal(s.commandCount, 1); assert.equal(s.navigationCount, 1); assert.equal(s.transferReceipts.length, 1);
  const all = ['commandReceipts', 'blockedReceipts', 'navigationReceipts', 'targetChangeReceipts', 'jobStartReceipts', 'jobCompletionReceipts', 'craneStageReceipts', 'transferReceipts'].flatMap(key => s[key]);
  assert.equal(new Set(all.map(r => r.eventSeq)).size, all.length);
  for (const r of all) assert.equal(r.tick, r.fromTick + 1);
  const fresh = Model.create(52, 1); assert.equal(fresh.tick, 0); assert.equal(fresh.eventCount, 0); assert.equal(fresh.ship.rollRad, 0);
  assert.deepEqual(fresh.stacks, [[], [], [], []]); assert.equal(fresh.ballastPositionUnits, 0); assert.equal(fresh.crane.idle, true);
});
