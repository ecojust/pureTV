'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60;
const near = (actual, expected, note = '') => assert.ok(Math.abs(actual - expected) < 1e-8, `${note}: ${actual} != ${expected}`);
const tick = (s, input = {}) => Model.step(s, DT, input);
const advance = (s, count, input = {}) => { for (let i = 0; i < count; i++) tick(s, input); return s; };
function tap(s, input) { tick(s); tick(s, input); tick(s); }
function select(s, target) {
  const ids = ['G1', 'G2', 'G3', 'leak'];
  while (s.selectedId !== target) tap(s, { x: Math.sign(ids.indexOf(target) - ids.indexOf(s.selectedId)) });
}
function ledger(s) {
  const l = s.ledger;
  near(l.initialTotal, s.tank.oxygen + s.chambers.A.air + l.breathing + l.leak + l.vent + l.recoveryLoss, 'total oxygen');
  near(l.breathing, s.groups.reduce((sum, g) => sum + g.consumedOxygen, 0), 'group consumption');
  assert.ok(s.tank.oxygen >= 0 && s.tank.oxygen <= s.tank.capacity);
  assert.ok(s.chambers.A.air >= 0 && s.chambers.A.air <= s.chambers.A.capacity);
}
function oneBatch(mode) {
  // Ordinary input on level 3: one batch, not a complete winning game.
  const s = Model.create(1, 2), events = [];
  if (mode === 'vent') tap(s, { b: true });
  tick(s, { a: true }); events.push(...s.events);
  for (let n = 0; s.task && s.phase === 'playing' && n < 2400; n++) {
    tick(s); events.push(...s.events); ledger(s);
  }
  assert.equal(s.phase, 'playing'); assert.equal(s.completedTasks.length, 1);
  return { s, events, task: s.completedTasks[0] };
}

test('three levels expose independent inventory, deadlines and group identities', () => {
  const all = [0, 1, 2].map(d => Model.create(7, d));
  assert.deepEqual(all.map(s => [s.tank.oxygen, s.tank.capacity, s.tank.reserveFloor]), [[48, 58, 20], [54, 64, 20], [48, 48, 24]]);
  assert.deepEqual(all.map(s => s.groups.map(g => g.deadlineTick / 60)), [[18, 42, 68], [42, 68, 12], [40, 66, 89]]);
  for (const s of all) {
    assert.deepEqual(s.groups.map(g => [g.id, g.location, g.breathingRate]), [['G1', 'B', .14], ['G2', 'B', .10], ['G3', 'B', .08]]);
    assert.equal(s.chambers.A.air, 12); assert.equal(s.chambers.B.pressure, 0); assert.equal(s.chambers.C.pressure, 1);
    assert.equal(s.task, null); assert.deepEqual(s.completedTasks, []); ledger(s);
  }
  all[0].groups[0].location = 'A'; assert.equal(all[1].groups[0].location, 'B');
});

test('one idle interval uses separately calculated leak and each whole-group breath', () => {
  const s = Model.create(1, 0); tick(s);
  near(s.tank.oxygen, 48 - .82 / 60); near(s.ledger.leak, .5 / 60); near(s.ledger.breathing, .32 / 60);
  s.groups.forEach(g => near(g.consumedOxygen, g.breathingRate / 60));
  assert.equal(s.lastInterval.fromTick, 0); assert.equal(s.lastInterval.toTick, 1); ledger(s);
});

test('one recovery interval separates gross removal, net return and efficiency loss', () => {
  const s = Model.create(1, 0); tick(s, { a: true });
  near(s.chambers.A.air, 12 - .75 / 60);
  near(s.tank.oxygen, 48 + .675 / 60 - .82 / 60);
  near(s.lastInterval.airRemoved, .75 / 60); near(s.lastInterval.recovered, .675 / 60);
  near(s.lastInterval.recoveryLoss, .075 / 60); near(s.ledger.recoveredTransferred, .675 / 60);
  assert.equal(s.task.phase, 'recover'); assert.equal(s.chambers.A.doorBOpen, false); ledger(s);
});

test('recovery and vent really differ in time and loss while legal doors transfer one group once', () => {
  const recovery = oneBatch('recover'), vent = oneBatch('vent');
  // The initially full tank blocks the very first recovery interval. Breathing
  // and leakage create room only afterward, so this ordinary level-3 batch
  // needs one extra tick; venting is unaffected by the tank capacity.
  assert.equal(recovery.task.totalTicks, 24 * 60 + 1); assert.equal(vent.task.totalTicks, 10 * 60);
  near(recovery.task.recovered, 10.8); near(recovery.task.recoveryLoss, 1.2); near(recovery.task.vented, 0);
  near(vent.task.vented, 12); near(vent.task.recovered, 0);
  for (const round of [recovery, vent]) {
    assert.deepEqual(round.events.filter(e => e.type === 'migration').map(e => [e.groupId, e.from, e.to]), [['G1', 'B', 'A'], ['G1', 'A', 'C']]);
    assert.equal(new Set(round.events.map(e => e.id)).size, round.events.length);
    const doors = round.events.filter(e => e.type === 'door' && e.open);
    assert.deepEqual(doors.map(e => e.door), ['B', 'C']);
    near(doors[0].pressure, 0); near(doors[1].pressure, 1); assert.ok(doors.every(e => !e.otherOpen));
    const consumed = round.s.groups[0].consumedOxygen; advance(round.s, 60);
    near(round.s.groups[0].consumedOxygen, consumed); assert.equal(round.s.evacuatedCount, 1);
    tap(round.s, { a: true }); assert.equal(round.s.taskCount, 1); assert.equal(round.s.task, null);
    assert.ok(round.s.blockedCommands > 0); ledger(round.s);
  }
});

test('synthetic full-tank fixture preserves the pump-before-breath capacity offset', () => {
  const s = Model.create(1, 2); s.leak.isolated = true;
  tick(s, { a: true });
  near(s.lastInterval.recovered, 0); near(s.chambers.A.air, 12); near(s.tank.oxygen, 48 - .32 / 60);
  tick(s);
  near(s.lastInterval.recovered, .32 / 60); near(s.lastInterval.airRemoved, (.32 / 60) / .9);
  near(s.tank.oxygen, 48 - .32 / 60); assert.equal(s.capacityLimitedTicks, 2); ledger(s);
});

test('stopping retains task and air; breathing and leak continue; resuming does not refund', () => {
  const s = Model.create(1, 0); tap(s, { a: true }); advance(s, 30); tap(s, { b: true });
  const saved = structuredClone(s.task), air = s.chambers.A.air, oxygen = s.tank.oxygen;
  advance(s, 60);
  assert.deepEqual(s.task, saved); near(s.chambers.A.air, air); near(s.tank.oxygen, oxygen - .82);
  tap(s, { b: true }); assert.deepEqual(s.task, saved); // Stopped B cannot turn into an idle mode switch.
  tap(s, { a: true }); assert.equal(s.task.id, saved.id); assert.equal(s.task.mode, saved.mode);
  assert.ok(s.task.totalTicks > saved.totalTicks); assert.ok(s.chambers.A.air < air); ledger(s);
});

test('only one task may own the pump and held A cannot create duplicate jobs', () => {
  const s = Model.create(1, 0); advance(s, 60, { a: true });
  assert.equal(s.taskCount, 1); assert.equal(s.commandCount, 1);
  select(s, 'G2'); tap(s, { a: true });
  assert.equal(s.task.groupId, 'G1'); assert.equal(s.taskCount, 1); assert.ok(s.blockedCommands > 0);
  assert.equal(s.modeSelection, 'recover'); ledger(s);
});

test('normal isolation stops actual leak only after all service intervals', () => {
  const s = Model.create(1, 0); select(s, 'leak'); tick(s, { a: true });
  const start = s.tick;
  advance(s, 178); assert.equal(s.leak.isolated, false); assert.equal(s.task.phaseTicks, 179);
  tick(s); assert.equal(s.leak.isolated, true); assert.equal(s.leak.isolatedTick, start + 179);
  near(s.lastInterval.leak, .5 / 60); const lost = s.ledger.leak;
  tick(s); near(s.lastInterval.leak, 0); near(s.ledger.leak, lost); ledger(s);
});

test('synthetic final-unload fixture accepts arrival exactly on deadline, rejects one tick later', () => {
  function fixture(phaseTicks) {
    const s = Model.create(1, 0); s.groups[0].deadlineTick = 1; s.groups[0].location = 'A';
    s.chambers.A.groupId = 'G1'; s.chambers.A.doorCOpen = true;
    s.task = { id: 1, kind: 'batch', groupId: 'G1', mode: 'vent', phase: 'unload', stopped: false,
      startedTick: 0, phaseTicks, totalTicks: phaseTicks, recovered: 0, vented: 0, filled: 0, recoveryLoss: 0, capacityLimitedTicks: 0 };
    return s;
  }
  const onTime = fixture(119); tick(onTime); assert.equal(onTime.groups[0].arrivalTick, 1); assert.equal(onTime.phase, 'playing');
  near(onTime.groups[0].consumedOxygen, .14 / 60);
  const late = fixture(118); tick(late); assert.equal(late.phase, 'lost'); assert.equal(late.lostReason, 'deadline');
  assert.deepEqual(late.failure.groupIds, ['G1']); assert.equal(late.groups[0].arrivalTick, null);
});

test('synthetic partial-supply fixture divides the remaining oxygen proportionally without negatives', () => {
  const s = Model.create(1, 0); s.tank.oxygen = .003; s.leak.isolated = true; s.ledger.initialTotal = 12.003;
  tick(s); assert.equal(s.lostReason, 'oxygen'); assert.equal(s.tank.oxygen, 0);
  s.groups.forEach(g => near(g.consumedOxygen, .003 * g.breathingRate / .32));
  assert.deepEqual(s.failure.groupIds, ['G1', 'G2', 'G3']); ledger(s);
});

test('synthetic completed-rescue fixtures require the tank reserve, not air left in the lock', () => {
  for (const delta of [0, -.01]) {
    const s = Model.create(1, 0); s.groups.forEach(g => { g.location = 'C'; g.evacuated = true; g.arrivalTick = 0; });
    s.leak.isolated = true; s.tank.oxygen = s.tank.reserveFloor + delta; s.ledger.initialTotal = s.tank.oxygen + 12;
    tick(s); assert.equal(s.phase, delta === 0 ? 'won' : 'lost');
    assert.equal(s.lostReason, delta === 0 ? null : 'reserve'); ledger(s);
  }
});

test('synthetic illegal door state is not accepted as ordinary safe exposure', () => {
  const s = Model.create(1, 0); s.chambers.A.doorBOpen = true;
  tick(s); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'pressure');
  assert.equal(s.groups[0].location, 'B'); assert.equal(s.completedTasks.length, 0);
});

test('direction deadzone, dominant axis, clamp and deliberate held repeat are deterministic', () => {
  const s = Model.create(1, 0); tick(s, { x: .24, y: .24 }); assert.equal(s.selectedId, 'G1');
  tick(s, { x: .5, y: -.5 }); assert.equal(s.selectedId, 'G2'); // Horizontal tie wins.
  advance(s, 19, { x: .5 }); assert.equal(s.selectedId, 'G2');
  tick(s, { x: .5 }); assert.equal(s.selectedId, 'G3');
  advance(s, 10, { x: .5 }); assert.equal(s.selectedId, 'leak');
  advance(s, 20, { x: .5 }); assert.equal(s.selectedId, 'leak');
  tick(s); tick(s, { y: -.9 }); assert.equal(s.selectedId, 'G3');
});

test('B wins simultaneous controls and cancellation discards unconsumed edges without stopping an existing task', () => {
  const s = Model.create(1, 0); tick(s, { x: 1, a: true, b: true });
  assert.equal(s.selectedId, 'G1'); assert.equal(s.modeSelection, 'vent'); assert.equal(s.task, null);
  Model.step(s, 0, {}); Model.step(s, 0, { a: true }); Model.step(s, 0, { cancelled: true, cancelEpoch: 1 }); tick(s);
  assert.equal(s.task, null);
  tap(s, { a: true }); const before = s.chambers.A.air;
  tick(s, { cancelled: true, cancelEpoch: 2 }); assert.ok(s.chambers.A.air < before); assert.equal(s.task.stopped, false);
});

test('fixed-step accumulation is bounded and nonfinite elapsed input does not advance time', () => {
  const s = Model.create(1, 0); Model.step(s, NaN, {}); assert.equal(s.tick, 0);
  Model.step(s, .01, {}); assert.equal(s.tick, 0); Model.step(s, DT - .01, {}); assert.equal(s.tick, 1);
  Model.step(s, 100, {}); assert.equal(s.tick, 16); ledger(s);
});

test('terminal state is immutable and retry construction clears resources, task history and controls', () => {
  // Synthetic one-tick deadline fixture, not a naturally completed loss round.
  const s = Model.create(1, 0); s.groups[0].deadlineTick = 1; tick(s); assert.equal(s.lostReason, 'deadline');
  const before = structuredClone(s); Model.step(s, .25, { a: true, b: true, x: 1 }); assert.deepEqual(s, before);
  const fresh = Model.create(1, 0); assert.deepEqual(fresh, Model.create(1, 0));
  assert.equal(fresh.taskCount, 0); assert.equal(fresh.ledger.breathing, 0); assert.equal(fresh.leak.isolated, false);
  assert.equal(fresh.chambers.A.doorBOpen, false); assert.equal(fresh.chambers.A.doorCOpen, false);
  assert.ok(fresh.groups.every(g => g.location === 'B' && !g.evacuated && g.consumedOxygen === 0));
});
