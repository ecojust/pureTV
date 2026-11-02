// Synthetic rule-boundary fixtures only. No ordinary solution, pilot, browser or private design witness.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60;
const copy = value => JSON.parse(JSON.stringify(value));
const total = values => values.reduce((a, b) => a + b, 0);
const near = (actual, expected, epsilon = 1e-8) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
const tick = (state, input = {}) => Model.step(state, DT, input);
const many = (state, count, input = {}) => { for (let i = 0; i < count; i++) tick(state, input); };
const contract = fs.readFileSync(path.join(__dirname, '../docs/model-contract.md'), 'utf8');
const published = JSON.parse(contract.split('## Public level data')[1].match(/```json\s*([\s\S]*?)\s*```/)[1]);

// Small, explicitly synthetic geometries/windows isolate one boundary. They are never ordinary-play evidence.
function fixture() {
  const s = Model.create(729, 0); s.deadlineTick = 10000; s.remaining = 10000 / 60;
  for (const f of s.fields) { f.openTick = 0; f.closeTick = 10000; f.bloomPhase = 'open'; }
  return s;
}
function shortField(s, index, distance) { s.fields[index].x = s.hive.x + distance; s.fields[index].y = s.hive.y; }
function place(s, swarmIndex, fieldIndex) {
  const g = s.swarms[swarmIndex], f = s.fields[fieldIndex];
  Object.assign(g, { mode: 'field', x: f.x, y: f.y, assignment: f.id, fieldId: f.id, flight: null });
}
function credit(s, fieldIndex, first, second = 0) {
  const f = s.fields[fieldIndex]; f.contributions = [first, second]; f.workTicks = first + second;
  f.completed = f.workTicks === f.requiredWorkTicks; f.completedAtTick = f.completed ? 0 : null;
  s.swarms.forEach((g, i) => {
    g.contributions[fieldIndex] = f.contributions[i]; g.workTicks = total(g.contributions);
    if (g.awayTicks < g.workTicks) { const extra = g.workTicks - g.awayTicks; g.awayTicks += extra; g.recoveredTicks += extra; }
  });
}
function stamina(s, index, value) {
  const g = s.swarms[index]; g.staminaTicks = value; g.awayTicks = g.workTicks + 1800 - value; g.recoveredTicks = g.workTicks;
}
function synchronizeFixture(s) {
  s.elapsed = s.tick / 60; s.remaining = Math.max(0, (s.deadlineTick - s.tick) / 60);
  for (const f of s.fields) {
    f.unlocked = f.prerequisites.every(id => s.fields.find(item => item.id === id).completed);
    f.unlockedAtTick = f.unlocked ? 0 : null;
    f.bloomPhase = s.tick < f.openTick ? 'unopened' : s.tick < f.closeTick ? 'open' : 'closed';
  }
  const ids = mode => s.swarms.filter(g => g.mode === mode).map(g => g.id);
  const homeIds = ids('home'), flyingIds = ids('flying'), fieldIds = ids('field');
  const fieldWork = total(s.fields.map(f => f.workTicks)), swarmWork = total(s.swarms.map(g => g.workTicks));
  s.inventory = { swarmCount: 2, totalBees: 12, homeIds, flyingIds, fieldIds, idsExactlyOnce: true,
    counts: { home: homeIds.length, flying: flyingIds.length, field: fieldIds.length },
    bees: { home: homeIds.length * 6, flying: flyingIds.length * 6, field: fieldIds.length * 6 },
    totalCreditedWorkTicks: fieldWork, totalSwarmWorkTicks: swarmWork, errorWorkTicks: fieldWork - swarmWork };
  return s;
}
function completeAll(s) { s.fields.forEach((f, i) => credit(s, i, f.requiredWorkTicks)); synchronizeFixture(s); }

test('three initial boards exactly expose the published geometry, windows, dependencies and workforce', () => {
  for (const level of published.levels) {
    const s = Model.create(729, level.difficulty);
    assert.equal(s.level, level.difficulty + 1); assert.equal(s.levelName, level.name); assert.equal(s.levelNameEn, level.nameEn);
    assert.equal(s.deadlineTick, level.deadlineTick); assert.deepEqual(s.physics, published.physics); assert.deepEqual(s.hive, published.hive);
    assert.deepEqual(s.fields.map(f => Object.fromEntries(Object.keys(level.fields[0]).map(key => [key, f[key]]))), level.fields);
    assert.deepEqual(s.swarms.map(g => [g.id, g.beeCount, g.mode, g.staminaTicks]), [['B1', 6, 'home', 1800], ['B2', 6, 'home', 1800]]);
    assert.equal(s.inventory.totalBees, 12); assert.equal(s.inventory.errorWorkTicks, 0); assert.equal(s.tick, 0);
    assert.equal(s.fields.reduce((n, f) => n + f.workTicks, 0), 0); assert.equal(s.commandCount, 0); assert.equal(s.flightCount, 0);
    assert.deepEqual(s.fields.map(f => f.unlocked), level.fields.map(f => f.prerequisites.length === 0));
  }
  assert.equal(total(published.levels[2].fields.map(f => f.requiredWorkTicks)), 3960);
  assert.ok(3960 > published.physics.swarmCount * published.physics.staminaCapacityTicks);
});
test('create normalizes only finite numeric seeds and difficulty without changing tasks', () => {
  assert.equal(Model.create(-1.9, 1.99).seed, 4294967295); assert.equal(Model.create(2 ** 32 + 7.8, 9).seed, 7);
  assert.equal(Model.create(null, '2').seed, 729); assert.equal(Model.create(NaN, Infinity).difficulty, 0);
  assert.equal(Model.create(1, -2).difficulty, 0); assert.equal(Model.create(1, 9).difficulty, 2);
  assert.deepEqual(Model.create(1, 1).fields, Model.create(999, 1).fields);
});
test('instances and nested public constants do not alias one another', () => {
  const a = Model.create(1, 2), b = Model.create(1, 2), expected = copy(b);
  a.fields[2].prerequisites.push('invented'); a.fields[0].contributions[0] = 5;
  a.swarms[0].contributions[1] = 8; a.physics.tickHz = 1; a.hive.x = -50;
  assert.deepEqual(b, expected); assert.deepEqual(Model.create(1, 2), expected);
});
test('zero dt preserves every field and invalid active dt throws before mutation', () => {
  const s = Model.create(1, 0), before = copy(s);
  assert.strictEqual(Model.step(s, 0, { a: true, x: 1, cancelEpoch: 3 }), s); assert.deepEqual(s, before);
  for (const bad of [undefined, null, '0.0166666667', NaN, Infinity, -DT, DT / 2, DT + 2e-12]) {
    assert.throws(() => Model.step(s, bad, { a: true }), RangeError); assert.deepEqual(s, before);
  }
  Model.step(s, DT + 5e-13, {}); assert.equal(s.tick, 1); assert.equal(s.elapsed, DT); assert.equal(s.lastInterval.seconds, DT);
});
test('straight flight uses the actual origin, constant distance budget and exact final endpoint', () => {
  const s = Model.create(1, 0), f = s.fields[0], length = Math.hypot(f.x - 112, f.y - 270), duration = Math.ceil(length / 3);
  tick(s, { a: true }); const first = s.commandReceipts[0];
  assert.deepEqual(first.before, { mode: 'home', x: 112, y: 270, assignment: 'hive', fieldId: null, staminaTicks: 1800, flight: null });
  assert.equal(first.after.x, 112); assert.equal(first.after.y, 270); assert.equal(first.after.staminaTicks, 1800);
  near(s.swarms[0].x, 112 + (f.x - 112) * 3 / length); near(s.swarms[0].y, 270 + (f.y - 270) * 3 / length);
  many(s, duration - 2); assert.equal(s.swarms[0].mode, 'flying'); assert.equal(s.arrivalReceipts.length, 0);
  tick(s); assert.equal(s.swarms[0].mode, 'field'); assert.equal(s.swarms[0].x, f.x); assert.equal(s.swarms[0].y, f.y);
  assert.equal(s.arrivalReceipts[0].tick, duration); assert.equal(s.arrivalReceipts[0].flight.ageTicks, duration);
  near(s.swarms[0].cumulativeDistancePx, length); assert.equal(s.swarms[0].staminaTicks, 1800 - duration);
});
test('flight length snapping affects only the published tiny scheduling boundary, including zero length', () => {
  for (const [distance, expectedTicks] of [[6 + 0.5e-9, 2], [6 + 2e-9, 3], [0, 1]]) {
    const s = fixture(); shortField(s, 0, distance); tick(s, { a: true });
    assert.equal(s.commandReceipts[0].after.flight.durationTicks, expectedTicks);
    if (expectedTicks > 1) { assert.equal(s.swarms[0].mode, 'flying'); many(s, expectedTicks - 1); }
    assert.equal(s.swarms[0].mode, 'field'); assert.equal(s.swarms[0].x, s.fields[0].x); assert.equal(s.arrivalReceipts.length, 1);
    assert.equal(s.arrivalReceipts[0].tick, expectedTicks); assert.equal(s.fields[0].workTicks, 0);
    if (distance === 0) assert.deepEqual(s.arrivalReceipts[0].flight.nominalDirection, { x: 0, y: 0 });
  }
});
test('mid-flight retargeting starts at the current position without refund, duplicate group or extra energy charge', () => {
  const s = Model.create(1, 0); tick(s, { a: true }); tick(s);
  const before = copy(s.swarms[0]); tick(s, { x: 1, a: true });
  const r = s.commandReceipts[1]; assert.equal(r.action, 'retarget'); assert.equal(r.before.mode, 'flying');
  assert.deepEqual(r.after.flight.origin, { x: before.x, y: before.y }); assert.equal(r.after.staminaTicks, before.staminaTicks);
  assert.equal(r.after.x, before.x); assert.equal(r.after.y, before.y); assert.equal(s.swarms[0].staminaTicks, before.staminaTicks - 1);
  near(s.swarms[0].cumulativeDistancePx, before.cumulativeDistancePx + 3);
  assert.equal(s.arrivalReceipts.length, 0); assert.equal(s.commandCount, 2); assert.equal(s.flightCount, 2);
  assert.deepEqual(s.commandReceipts.map(row => row.flightId), [1, 2]); assert.equal(s.inventory.totalBees, 12);
});
test('same-destination A rejection preserves the current flight and its age', () => {
  const s = Model.create(1, 0); tick(s, { a: true }); tick(s); const old = copy(s.swarms[0].flight);
  tick(s, { a: true }); assert.equal(s.blockedReceipts[0].reason, 'same-destination');
  assert.deepEqual(s.blockedReceipts[0].before, s.blockedReceipts[0].after);
  assert.equal(s.swarms[0].flight.id, old.id); assert.equal(s.swarms[0].flight.ageTicks, old.ageTicks + 1);
  assert.equal(s.flightCount, 1); assert.equal(s.commandCount, 1); assert.equal(s.swarms[0].staminaTicks, 1797);
});
test('A rejection prioritizes completed fields then empty home stamina while home recovery still occurs', () => {
  const complete = fixture(); credit(complete, 0, complete.fields[0].requiredWorkTicks); stamina(complete, 0, 0); synchronizeFixture(complete);
  tick(complete, { a: true }); assert.equal(complete.blockedReceipts[0].reason, 'field-complete'); assert.equal(complete.swarms[0].staminaTicks, 6);
  const empty = fixture(); stamina(empty, 0, 0); synchronizeFixture(empty); tick(empty, { a: true });
  assert.equal(empty.blockedReceipts[0].reason, 'rest-required'); assert.equal(empty.swarms[0].mode, 'home');
  assert.equal(empty.flightCount, 0); assert.equal(empty.swarms[0].staminaTicks, 6);
});
test('B rejects already-home and already-returning without resetting a real return segment', () => {
  const home = Model.create(1, 0); tick(home, { b: true }); assert.equal(home.blockedReceipts[0].reason, 'already-home'); assert.equal(home.flightCount, 0);
  const s = fixture(); place(s, 0, 0); synchronizeFixture(s); tick(s, { b: true }); tick(s); const old = copy(s.swarms[0].flight);
  tick(s, { b: true }); assert.equal(s.blockedReceipts[0].reason, 'already-returning');
  assert.equal(s.swarms[0].flight.id, old.id); assert.equal(s.swarms[0].flight.ageTicks, old.ageTicks + 1); assert.equal(s.flightCount, 1);
});
test('an arrival interval cannot pollinate; actual field residence begins credit on the next interval', () => {
  const s = fixture(); shortField(s, 0, 3); tick(s, { a: true });
  assert.equal(s.swarms[0].mode, 'field'); assert.equal(s.lastInterval.groups[0].work.reason, 'flying'); assert.equal(s.fields[0].workTicks, 0);
  tick(s); assert.equal(s.fields[0].workTicks, 1); assert.equal(s.swarms[0].lastWorkTick, 2); assert.equal(s.swarms[0].workedLastInterval, true);
});
test('bloom work is half-open and the last valid interval may finish exactly at closing', () => {
  const s = fixture(); s.fields[0].openTick = 2; s.fields[0].closeTick = 4; s.fields[0].requiredWorkTicks = 2;
  place(s, 0, 0); synchronizeFixture(s); many(s, 2);
  assert.equal(s.fields[0].workTicks, 0); assert.equal(s.fields[0].bloomPhase, 'open'); assert.equal(s.lastInterval.groups[0].work.reason, 'unopened');
  tick(s); assert.equal(s.fields[0].workTicks, 1); tick(s);
  assert.equal(s.fields[0].completedAtTick, 4); assert.equal(s.fields[0].bloomPhase, 'closed'); assert.equal(s.phase, 'playing');
  const closed = fixture(); closed.tick = 4; closed.fields[0].closeTick = 4; place(closed, 0, 0); synchronizeFixture(closed); tick(closed);
  assert.equal(closed.fields[0].workTicks, 0); assert.equal(closed.lastInterval.groups[0].work.reason, 'closed'); assert.equal(closed.lostReason, 'missed-bloom');
});
test('arrival in the last bloom interval is too late and does not postpone the flower deadline', () => {
  const s = fixture(); shortField(s, 0, 3); s.fields[0].requiredWorkTicks = 1; s.fields[0].closeTick = 1;
  tick(s, { a: true }); assert.equal(s.swarms[0].mode, 'field'); assert.equal(s.fields[0].workTicks, 0);
  assert.equal(s.lostReason, 'missed-bloom'); assert.equal(s.failures[0].fieldId, 'F1'); assert.equal(s.failures[0].tick, 1);
});
test('a predecessor completed this interval unlocks a successor without retroactive work', () => {
  const s = fixture(); s.fields[0].requiredWorkTicks = 1; s.fields[2].requiredWorkTicks = 1;
  place(s, 0, 0); place(s, 1, 2); synchronizeFixture(s); tick(s);
  assert.equal(s.fields[0].completedAtTick, 1); assert.equal(s.fields[2].unlockedAtTick, 1); assert.equal(s.fields[2].workTicks, 0);
  assert.equal(s.lastInterval.groups[1].work.reason, 'locked'); assert.deepEqual(s.lastInterval.completedAtStart, []);
  tick(s); assert.equal(s.fields[2].completedAtTick, 2); assert.equal(s.swarms[1].lastWorkTick, 2);
  assert.deepEqual(s.unlockReceipts[0].prerequisites, [{ fieldId: 'F1', completedAtTick: 1 }]);
});
test('the last unit of shared demand belongs once to B1 and B2 receives no false work marker', () => {
  const s = fixture(); s.fields[0].requiredWorkTicks = 1; place(s, 0, 0); place(s, 1, 0); synchronizeFixture(s); tick(s);
  assert.deepEqual(s.fields[0].contributions, [1, 0]); assert.deepEqual(s.lastInterval.groups.map(g => g.work.credit), [1, 0]);
  assert.equal(s.lastInterval.groups[1].work.eligible, true); assert.equal(s.lastInterval.groups[1].work.reason, 'demand-filled');
  assert.equal(s.swarms[1].lastWorkTick, null); assert.equal(s.swarms[1].workedLastInterval, false);
  assert.equal(s.swarms[1].staminaTicks, 1799); assert.equal(s.inventory.totalCreditedWorkTicks, 1);
});
test('a two-group completion receipt keeps the field interval start rather than the intermediate contribution', () => {
  const s = fixture(); s.fields[0].requiredWorkTicks = 9; credit(s, 0, 4, 3);
  place(s, 0, 0); place(s, 1, 0); synchronizeFixture(s); tick(s);
  assert.deepEqual(s.lastInterval.groups.map(g => [g.work.fieldWorkBefore, g.work.fieldWorkAfter]), [[7, 8], [8, 9]]);
  const receipt = s.completionReceipts[0]; assert.equal(receipt.workBefore, 7); assert.equal(receipt.workAfter, 9); assert.deepEqual(receipt.contributions, [5, 4]);
});
test('returning home with exactly zero stamina is safe and recovery starts only next interval', () => {
  const s = fixture(); shortField(s, 0, 3); place(s, 0, 0); stamina(s, 0, 1); synchronizeFixture(s); tick(s, { b: true });
  assert.equal(s.swarms[0].mode, 'home'); assert.equal(s.swarms[0].staminaTicks, 0); assert.equal(s.phase, 'playing');
  assert.equal(s.lastInterval.groups[0].awayDebit, 1); assert.equal(s.lastInterval.groups[0].recoveryCredit, 0);
  assert.equal(s.arrivalReceipts[0].staminaTicks, 0); tick(s);
  assert.equal(s.swarms[0].staminaTicks, 6); assert.equal(s.lastInterval.groups[0].awayDebit, 0); assert.equal(s.lastInterval.groups[0].recoveryCredit, 6);
});
test('zero stamina on arrival at a flower is still exhaustion and earns no arrival-interval work', () => {
  const s = fixture(); shortField(s, 0, 3); stamina(s, 0, 1); synchronizeFixture(s); tick(s, { a: true });
  assert.equal(s.swarms[0].mode, 'field'); assert.equal(s.swarms[0].staminaTicks, 0); assert.equal(s.lostReason, 'exhausted');
  assert.equal(s.fields[0].workTicks, 0); assert.equal(s.swarms.length, 2); assert.equal(s.inventory.totalBees, 12);
});
test('home recovery clamps to capacity and emits a single actual rest-complete transition', () => {
  const s = fixture(); stamina(s, 0, 1797); synchronizeFixture(s); tick(s);
  assert.equal(s.swarms[0].staminaTicks, 1800); assert.equal(s.lastInterval.groups[0].recoveryCredit, 3);
  assert.equal(s.restCompleteReceipts.length, 1); assert.equal(s.restCompleteReceipts[0].beforeStamina, 1797);
  tick(s); assert.equal(s.restCompleteReceipts.length, 1); assert.equal(s.lastInterval.groups[0].recoveryCredit, 0);
});
test('exhaustion wins over last-unit completion while retaining the work that actually occurred', () => {
  const s = fixture(); s.fields[0].requiredWorkTicks = 1; place(s, 0, 0); stamina(s, 0, 1); synchronizeFixture(s); tick(s);
  assert.equal(s.fields[0].completed, true); assert.equal(s.fields[0].workTicks, 1); assert.equal(s.swarms[0].lastWorkTick, 1);
  assert.equal(s.lostReason, 'exhausted'); assert.equal(s.score, 0); assert.deepEqual(s.events.map(e => e.type), ['complete', 'unlock', 'loss']);
});
test('completed flowers require both actual hive arrivals, not merely a home assignment', () => {
  const s = fixture(); shortField(s, 0, 6); completeAll(s); place(s, 0, 0); stamina(s, 0, 7); synchronizeFixture(s);
  tick(s, { b: true }); assert.equal(s.swarms[0].assignment, 'hive'); assert.equal(s.swarms[0].mode, 'flying'); assert.equal(s.phase, 'playing');
  tick(s); assert.equal(s.swarms[0].mode, 'home'); assert.equal(s.swarms[0].staminaTicks, 5); assert.equal(s.phase, 'won');
  assert.equal(s.score, 1000 + 2 * Math.floor((10000 - 2) / 60));
});
test('the exact deadline defeats a simultaneous final home arrival', () => {
  const s = fixture(); shortField(s, 0, 3); completeAll(s); place(s, 0, 0); s.deadlineTick = 1; synchronizeFixture(s);
  tick(s, { b: true }); assert.equal(s.swarms[0].mode, 'home'); assert.equal(s.lostReason, 'deadline'); assert.equal(s.score, 0);
  assert.deepEqual(s.events.map(e => e.type), ['command', 'arrival', 'loss']);
});
test('simultaneous failure facts retain stable swarm, field and deadline precedence', () => {
  const s = fixture(); s.fields[0].closeTick = 1; s.fields[1].closeTick = 1; s.deadlineTick = 1;
  place(s, 0, 0); place(s, 1, 1); stamina(s, 0, 1); stamina(s, 1, 1); synchronizeFixture(s); tick(s);
  assert.deepEqual(s.failures.map(f => [f.kind, f.swarmId, f.fieldId]), [
    ['exhausted', 'B1', null], ['exhausted', 'B2', null], ['missed-bloom', null, 'F1'], ['missed-bloom', null, 'F2'], ['deadline', null, null] ]);
  assert.equal(s.lostReason, 'exhausted'); assert.equal(s.fields[0].workTicks, 1); assert.equal(s.fields[1].workTicks, 1);
});
test('held A produces one command and a real release permits a later retarget', () => {
  const s = Model.create(1, 0); many(s, 4, { a: true }); assert.equal(s.commandCount, 1); assert.equal(s.blockedCommands, 0);
  tick(s, { x: 1, a: true }); assert.equal(s.fieldCursor, 1); assert.equal(s.commandCount, 1);
  tick(s); tick(s, { a: true }); assert.equal(s.commandCount, 2); assert.equal(s.commandReceipts[1].destinationId, 'F2');
});
test('Pressed flags participate in the same fresh-edge latch as held buttons', () => {
  const s = Model.create(1, 0); tick(s, { aPressed: true }); tick(s, { aPressed: true, a: false });
  assert.equal(s.commandCount, 1); assert.equal(s.lastInput.freshA, false); tick(s, { aPressed: false });
  tick(s, { bPressed: true }); assert.equal(s.commandCount, 2); assert.equal(s.commandReceipts[1].action, 'recall');
});
test('cancellation preserves existing motion but requires both neutral axes and real button release', () => {
  const s = Model.create(1, 0); tick(s, { a: true }); const old = copy(s.swarms[0]);
  tick(s, { cancelled: true, a: true, x: 1 }); assert.equal(s.commandCount, 1); assert.equal(s.inputState.quarantined, true);
  assert.equal(s.swarms[0].flight.ageTicks, old.flight.ageTicks + 1); assert.equal(s.swarms[0].staminaTicks, old.staminaTicks - 1);
  tick(s, { x: 0, y: 1 }); assert.equal(s.inputState.quarantined, true);
  tick(s, { x: 0, y: 0, cancelled: true }); assert.equal(s.inputState.quarantined, true);
  tick(s, { x: .45, y: -.45 }); assert.equal(s.inputState.quarantined, false); assert.equal(s.lastInput.quarantineReleased, true); assert.equal(s.commandCount, 1);
  tick(s, { b: true }); assert.equal(s.commandCount, 2);
});
test('valid epoch changes in either direction cancel, while invalid epochs are ignored', () => {
  const s = Model.create(1, 0); tick(s, { cancelEpoch: 2, a: true }); assert.equal(s.commandCount, 0); assert.equal(s.lastInput.cancelled, true);
  tick(s, { cancelEpoch: 2 }); assert.equal(s.inputState.quarantined, false);
  for (const invalid of [-1, 1.5, NaN, Infinity, '5']) { tick(s, { cancelEpoch: invalid }); assert.equal(s.inputState.cancelEpoch, 2); assert.equal(s.lastInput.cancelled, false); }
  tick(s, { cancelEpoch: 1, b: true }); assert.equal(s.lastInput.cancelled, true); assert.equal(s.inputState.cancelEpoch, 1); assert.equal(s.blockedCommands, 0);
});
test('direction selection respects the threshold, finite normalization and horizontal ties', () => {
  const s = Model.create(1, 0); tick(s, { x: .45, y: -.45 }); assert.equal(s.navigationCount, 0);
  tick(s, { x: Infinity, y: NaN }); assert.equal(s.navigationCount, 0); assert.equal(s.lastInput.sample.x, 0);
  tick(s, { x: 2, y: 2 }); assert.equal(s.fieldCursor, 1); assert.equal(s.swarmCursor, 0); assert.equal(s.lastInput.sample.x, 1);
  tick(s, { x: .6, y: .9 }); assert.equal(s.swarmCursor, 1); assert.equal(s.fieldCursor, 1);
  tick(s, { x: 0, y: -1 }); assert.equal(s.swarmCursor, 0); assert.equal(s.lastInput.navigationAttempt.heldTicks, 1);
});
test('navigation repeats at held ages 1, 24 and 36 with clamped boundaries', () => {
  const s = Model.create(1, 0); tick(s, { x: 1 }); many(s, 22, { x: 1 }); assert.equal(s.fieldCursor, 1);
  tick(s, { x: 1 }); assert.equal(s.fieldCursor, 2); many(s, 12, { x: 1 }); assert.equal(s.fieldCursor, 3);
  many(s, 12, { x: 1 }); assert.equal(s.fieldCursor, 3); assert.equal(s.navigationCount, 3);
  assert.deepEqual(s.navigationReceipts.map(r => r.heldTicks), [1, 24, 36]);
  assert.equal(s.lastInput.navigationAttempt.beforeIndex, 3); assert.equal(s.lastInput.navigationAttempt.afterIndex, 3);
  tick(s); tick(s, { x: -1 }); assert.equal(s.fieldCursor, 2); assert.equal(s.navigationReceipts[3].heldTicks, 1);
});
test('fresh B consumes simultaneous A and navigation even when B is blocked', () => {
  const s = Model.create(1, 0); tick(s, { x: 1, a: true, b: true });
  assert.equal(s.blockedReceipts[0].reason, 'already-home'); assert.equal(s.fieldCursor, 0); assert.equal(s.commandCount, 0);
  assert.equal(s.lastInput.navigationSuppressed, true); assert.equal(s.inputState.navigationHeldTicks, 1);
  tick(s, { x: 1, a: true, b: true }); assert.equal(s.blockedCommands, 1); assert.equal(s.lastInput.freshA, false);
  tick(s, { x: 1, a: true, b: false }); assert.equal(s.commandCount, 0); assert.equal(s.fieldCursor, 0);
  tick(s); tick(s, { a: true }); assert.equal(s.commandCount, 1);
});
test('without fresh B, navigation happens before the same-sample A command', () => {
  const s = Model.create(1, 0); tick(s, { x: 1, a: true });
  assert.equal(s.fieldCursor, 1); assert.equal(s.commandReceipts[0].destinationId, 'F2');
  assert.deepEqual(s.events.map(e => e.type), ['navigate', 'command']);
  assert.equal(s.commandReceipts[0].eventSeq, 2); assert.equal(s.navigationReceipts[0].eventSeq, 1);
});
test('receipts, last input and interval boundaries are deep snapshots of their actual moment', () => {
  const s = Model.create(1, 0); tick(s, { a: true });
  const command = copy(s.commandReceipts[0]), oldInterval = s.lastInterval, intervalCopy = copy(oldInterval), oldInput = s.lastInput, inputCopy = copy(oldInput);
  many(s, 3); assert.deepEqual(s.commandReceipts[0], command); assert.deepEqual(oldInterval, intervalCopy); assert.deepEqual(oldInput, inputCopy);
  assert.notStrictEqual(s.lastOperation, s.commandReceipts[0]); assert.notStrictEqual(s.commandReceipts[0].after.flight, s.swarms[0].flight);
  assert.deepEqual(s.lastEvent, s.events.length ? s.events.at(-1) : { id: 1, type: 'command', fromTick: 0, tick: 1, commandId: 1 });
});
test('mixed flight and cooperative residence conserve twelve bees and both sides of the work ledger', () => {
  const s = fixture(); shortField(s, 0, 6); tick(s, { a: true }); tick(s, { y: 1 }); tick(s, { a: true });
  many(s, 4); assert.deepEqual(s.inventory.fieldIds, ['B1', 'B2']); assert.deepEqual(s.inventory.bees, { home: 0, flying: 0, field: 12 });
  assert.equal(s.fields[0].workTicks, total(s.swarms.map(g => g.workTicks))); assert.equal(s.inventory.errorWorkTicks, 0);
  s.swarms.forEach((g, i) => { assert.equal(g.workTicks, total(g.contributions)); assert.equal(g.contributions[0], s.fields[0].contributions[i]);
    assert.equal(g.staminaTicks, 1800 - g.awayTicks + g.recoveredTicks); });
});
test('terminal calls freeze all fields even with invalid dt or cancellation input', () => {
  const lost = fixture(); lost.fields[0].closeTick = 1; tick(lost);
  const won = fixture(); completeAll(won); tick(won);
  for (const s of [lost, won]) { const before = copy(s);
    assert.strictEqual(Model.step(s, NaN, { a: true, b: true, x: 1, cancelEpoch: 4 }), s);
    Model.step(s, 0, { cancelled: true }); Model.step(s, DT, { y: 1 }); assert.deepEqual(s, before);
  }
});
test('an already travelling group still arrives after another group completes its destination', () => {
  const s = fixture(); shortField(s, 0, 9); s.fields[0].requiredWorkTicks = 1; place(s, 1, 0); synchronizeFixture(s);
  tick(s, { a: true }); assert.equal(s.fields[0].completed, true); assert.equal(s.swarms[0].mode, 'flying');
  many(s, 2); assert.equal(s.swarms[0].mode, 'field'); assert.equal(s.swarms[0].assignment, 'F1'); assert.equal(s.arrivalReceipts.length, 1);
  tick(s); assert.equal(s.lastInterval.groups[0].work.reason, 'field-complete'); assert.equal(s.swarms[0].workTicks, 0);
  assert.equal(s.fields[0].workTicks, 1); assert.equal(s.commandCount, 1);
});
test('home reserve is an honest prediction and never auto-recalls or forgives actual exhaustion', () => {
  const s = fixture(); shortField(s, 0, 9); place(s, 0, 0); stamina(s, 0, 2); synchronizeFixture(s); tick(s);
  assert.equal(s.swarms[0].directHomeTicks, 3); assert.equal(s.swarms[0].homeReserveTicks, -2);
  assert.equal(s.swarms[0].mode, 'field'); assert.equal(s.phase, 'playing'); assert.equal(s.commandCount, 0);
  tick(s); assert.equal(s.lostReason, 'exhausted'); assert.equal(s.swarms[0].mode, 'field'); assert.equal(s.inventory.totalBees, 12);
});
