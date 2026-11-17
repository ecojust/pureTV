// Short public-rule boundaries. Synthetic season-end fixtures are not ordinary gameplay evidence.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60, sum = values => values.reduce((a, b) => a + b, 0), copy = value => JSON.parse(JSON.stringify(value));
const tick = (s, input = {}) => Model.step(s, DT, input);
const many = (s, count, input = {}) => { for (let i = 0; i < count; i++) tick(s, input); };
const published = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/model-contract.md'), 'utf8')
  .split('## Public level data')[1].match(/```json\s*([\s\S]*?)\s*```/)[1]);
function accounting(s) {
  s.elapsed = s.tick / 60; s.planTotalUnits = sum(s.planUnits);
  s.reservedUndeliveredUnits = s.stage === 'planning' ? s.planTotalUnits : s.stage === 'releasing' ? sum(s.committedUnits) - sum(s.currentDeliveredUnits) : 0;
  s.unallocatedStoredUnits = s.storedUnits - s.reservedUndeliveredUnits;
  s.releaseSecondsRemaining = s.stage === 'releasing' ? (480 - s.releaseAgeTicks) / 60 : 0;
  s.annualTargetsMet = s.deliveredUnits.map((n, i) => n * 100 >= s.annualDemandUnits[i] * s.minimumFulfillmentPercent[i]);
  const totalDeliveredUnits = sum(s.deliveredUnits), totalAccountedUnits = s.storedUnits + s.totalEvaporationUnits + s.totalOverflowUnits + totalDeliveredUnits;
  s.inventory = { initialStorageUnits: s.initialStorageUnits, totalInflowUnits: s.totalInflowUnits,
    totalEvaporationUnits: s.totalEvaporationUnits, totalOverflowUnits: s.totalOverflowUnits, storedUnits: s.storedUnits,
    deliveredUnits: copy(s.deliveredUnits), totalDeliveredUnits, totalAccountedUnits,
    balanceErrorUnits: s.initialStorageUnits + s.totalInflowUnits - totalAccountedUnits };
  assert.equal(s.inventory.balanceErrorUnits, 0, 'Synthetic fixture must conserve actual water');
  return s;
}
function planningFixture(storage = 25, demand = [20, 15, 10]) {
  const s = Model.create(730, 0); s.capacityUnits = 100; s.initialStorageUnits = storage; s.storedUnits = storage;
  s.totalInflowUnits = 0; s.totalEvaporationUnits = 0; s.totalOverflowUnits = 0;
  s.seasons[0] = { inflowUnits: 0, evaporationUnits: 0, demandUnits: copy(demand), residentFloorUnits: 0 };
  s.annualDemandUnits = [0, 1, 2].map(i => sum(s.seasons.map(season => season.demandUnits[i])));
  s.seasonEntries = [{ id: 1, seasonIndex: 0, atTick: 0, carryInUnits: storage, requestedEvaporationUnits: 0,
    actualEvaporationUnits: 0, inflowUnits: 0, overflowUnits: 0, preparedStorageUnits: storage }];
  return accounting(s);
}
function choose(s, cursor) {
  while (s.cursor !== cursor) { tick(s, { x: cursor > s.cursor ? 1 : -1 }); tick(s); }
}
function add(s, category, units) { choose(s, category); for (let n = 0; n < units; n += 5) { tick(s, { a: true }); tick(s); } }
function commit(s) { choose(s, 3); tick(s, { a: true }); }

// Build an explicit, self-consistent boundary at release age 479 (or another requested age).
// Prior actions/commits/ledgers below are synthetic history, never claimed as observed play.
function releaseFixture({ plan = [10, 0, 5], prior = [], age = 479, initial = 400, capacity = 1000,
  seasons = null, targets = [0, 0, 0], quarantined = false } = {}) {
  const s = Model.create(730, 0), rules = seasons || Array.from({ length: 4 }, () => ({ inflowUnits: 0, evaporationUnits: 0, demandUnits: [100, 100, 100], residentFloorUnits: 0 }));
  s.capacityUnits = capacity; s.initialStorageUnits = initial; s.seasons = copy(rules); s.minimumFulfillmentPercent = copy(targets);
  s.annualDemandUnits = [0, 1, 2].map(i => sum(rules.map(season => season.demandUnits[i])));
  s.seasonEntries = []; s.seasonLedgers = []; s.actionReceipts = []; s.commits = [];
  let carry = initial, clock = 0, delivered = [0, 0, 0], dry = 0, inflow = 0, evaporation = 0, overflow = 0;
  const plans = [...prior.map(copy), copy(plan)];
  for (let seasonIndex = 0; seasonIndex < plans.length; seasonIndex++) {
    const rule = rules[seasonIndex], q = plans[seasonIndex], lost = Math.min(rule.evaporationUnits, carry);
    const spilled = Math.max(0, carry - lost + rule.inflowUnits - capacity), prepared = carry - lost + rule.inflowUnits - spilled;
    inflow += rule.inflowUnits; evaporation += lost; overflow += spilled;
    const entry = { id: seasonIndex + 1, seasonIndex, atTick: clock, carryInUnits: carry,
      requestedEvaporationUnits: rule.evaporationUnits, actualEvaporationUnits: lost, inflowUnits: rule.inflowUnits,
      overflowUnits: spilled, preparedStorageUnits: prepared };
    s.seasonEntries.push(entry); const draft = [0, 0, 0]; let depth = 0, cursor = 0;
    if (seasonIndex > 0) clock++; // A real neutral interval can release the new-season quarantine.
    q.forEach((amount, categoryIndex) => {
      assert.ok(Number.isInteger(amount) && amount >= 0 && amount % 5 === 0 && amount <= rule.demandUnits[categoryIndex]);
      if (amount > 0) { clock += 2 * (categoryIndex - cursor); cursor = categoryIndex; } // Ordinary right/neutral pairs.
      for (let n = 0; n < amount; n += 5) {
        const before = copy(draft); draft[categoryIndex] += 5;
        s.actionReceipts.push({ id: s.actionReceipts.length + 1, fromTick: clock, tick: clock + 1, seasonIndex, key: 'a', kind: 'add',
          accepted: true, reason: null, categoryIndex, cursor: categoryIndex, planBefore: before, planAfter: copy(draft),
          undoDepthBefore: depth, undoDepthAfter: ++depth, storedBefore: prepared, storedAfter: prepared, commitId: null }); clock += 2;
      }
    });
    assert.ok(sum(q) <= prepared); clock += 2 * (3 - cursor); const from = clock, id = seasonIndex + 1;
    s.commits.push({ id, seasonIndex, fromTick: from, tick: from + 1, plannedUnits: copy(q), preparedStorageUnits: prepared, unallocatedUnits: prepared - sum(q) });
    s.actionReceipts.push({ id: s.actionReceipts.length + 1, fromTick: from, tick: from + 1, seasonIndex, key: 'a', kind: 'commit',
      accepted: true, reason: null, categoryIndex: null, cursor: 3, planBefore: copy(q), planAfter: copy(q), undoDepthBefore: depth, undoDepthAfter: 0,
      storedBefore: prepared, storedAfter: prepared, commitId: id });
    if (seasonIndex < prior.length) {
      const afterDry = q[2] === 0 ? dry + 1 : 0; assert.ok(q[0] >= rule.residentFloorUnits && afterDry < 2);
      carry = prepared - sum(q); clock = from + 480;
      s.seasonLedgers.push({ id, seasonIndex, entryId: entry.id, commitId: id, commitFromTick: from, completedAtTick: clock,
        carryInUnits: entry.carryInUnits, inflowUnits: rule.inflowUnits, requestedEvaporationUnits: rule.evaporationUnits,
        actualEvaporationUnits: lost, overflowUnits: spilled, preparedStorageUnits: prepared, plannedUnits: copy(q), deliveredUnits: copy(q), carryOutUnits: carry,
        demandUnits: copy(rule.demandUnits), residentFloorUnits: rule.residentFloorUnits, residentFloorMet: true,
        riverDryStreakBefore: dry, riverDryStreakAfter: afterDry, balanceErrorUnits: 0 });
      dry = afterDry; delivered = delivered.map((n, i) => n + q[i]);
    } else {
      s.seasonIndex = seasonIndex; s.completedSeasons = seasonIndex; s.tick = from + age; s.releaseAgeTicks = age;
      s.planUnits = copy(q); s.undoStack = []; s.committedUnits = copy(q); s.currentDeliveredUnits = q.map(n => Math.floor(n * age / 480));
      s.deliveredUnits = delivered.map((n, i) => n + s.currentDeliveredUnits[i]); s.storedUnits = prepared - sum(s.currentDeliveredUnits);
    }
  }
  s.phase = 'playing'; s.stage = 'releasing'; s.cursor = 3; s.score = 0; s.lostReason = null; s.failures = [];
  s.totalInflowUnits = inflow; s.totalEvaporationUnits = evaporation; s.totalOverflowUnits = overflow; s.riverDryStreak = dry;
  s.lastAction = copy(s.actionReceipts.at(-1)); s.lastInput = null; s.lastInterval = null;
  s.inputState = { cancelEpoch: 0, quarantined, aArmed: !quarantined, bArmed: !quarantined, navigationDirection: 0, navigationHeldTicks: 0 };
  return accounting(s);
}

test('all three initial boards expose exact public forecasts and one evaporation-inflow-overflow spring entry', () => {
  published.levels.forEach((level, difficulty) => {
    const s = Model.create(730, difficulty), season = level.seasons[0], actualEvaporation = Math.min(level.initialStorageUnits, season.evaporationUnits);
    const beforeCap = level.initialStorageUnits - actualEvaporation + season.inflowUnits;
    assert.equal(s.level, difficulty + 1); assert.equal(s.levelName, level.name); assert.equal(s.levelNameEn, level.nameEn);
    assert.deepEqual(s.physics, published.physics); assert.deepEqual(s.seasons, level.seasons);
    assert.equal(s.capacityUnits, level.capacityUnits); assert.equal(s.initialStorageUnits, level.initialStorageUnits);
    assert.deepEqual(s.minimumFulfillmentPercent, level.minimumFulfillmentPercent);
    assert.deepEqual(s.annualDemandUnits, [0, 1, 2].map(i => sum(level.seasons.map(row => row.demandUnits[i]))));
    assert.deepEqual(s.seasonEntries, [{ id: 1, seasonIndex: 0, atTick: 0, carryInUnits: level.initialStorageUnits,
      requestedEvaporationUnits: season.evaporationUnits, actualEvaporationUnits: actualEvaporation, inflowUnits: season.inflowUnits,
      overflowUnits: Math.max(0, beforeCap - level.capacityUnits), preparedStorageUnits: Math.min(level.capacityUnits, beforeCap) }]);
    assert.equal(s.storedUnits, Math.min(level.capacityUnits, beforeCap)); assert.equal(s.inventory.balanceErrorUnits, 0);
    assert.equal(s.tick, 0); assert.equal(s.stage, 'planning'); assert.deepEqual(s.planUnits, [0, 0, 0]); assert.deepEqual(s.deliveredUnits, [0, 0, 0]);
  });
});
test('create normalizes finite numeric identity and keeps nested forecasts and arrays independent', () => {
  assert.equal(Model.create(-1.9, 1.99).seed, 4294967295); assert.equal(Model.create(2 ** 32 + 7.8, 8).seed, 7);
  assert.equal(Model.create(null, '2').seed, 730); assert.equal(Model.create(NaN, Infinity).difficulty, 0); assert.equal(Model.create(1, -2).difficulty, 0);
  const a = Model.create(1, 2), b = Model.create(999, 2), expected = copy(b);
  assert.deepEqual(a.seasons, b.seasons); a.seasons[0].demandUnits[1] = 999; a.physics.tickHz = 1; a.planUnits[0] = 8; a.seasonEntries[0].inflowUnits = 0;
  assert.deepEqual(b, expected); assert.deepEqual(Model.create(999, 2), expected);
});
test('zero dt is a complete no-op and invalid active dt fails before any state or input mutation', () => {
  const s = Model.create(1, 0), before = copy(s); assert.strictEqual(Model.step(s, 0, { a: true, cancelEpoch: 4 }), s); assert.deepEqual(s, before);
  for (const dt of [undefined, null, NaN, Infinity, '0.0166666667', -DT, DT / 2, DT + 2e-12]) {
    assert.throws(() => Model.step(s, dt, { a: true }), RangeError); assert.deepEqual(s, before);
  }
  Model.step(s, DT + 5e-13, {}); assert.equal(s.tick, 1); assert.equal(s.elapsed, DT); assert.equal(s.stage, 'planning');
});
test('next-season preparation clips evaporation before adding inflow and records overflow only once', () => {
  const rules = Array.from({ length: 4 }, () => ({ inflowUnits: 0, evaporationUnits: 0, demandUnits: [100, 100, 100], residentFloorUnits: 0 }));
  rules[1].inflowUnits = 200; rules[1].evaporationUnits = 10;
  const s = releaseFixture({ plan: [10, 0, 0], initial: 13, capacity: 100, seasons: rules }); tick(s);
  assert.equal(s.lastInterval.release.storageAfterUnits, 3); assert.equal(s.seasonLedgers[0].carryOutUnits, 3);
  assert.deepEqual(s.seasonEntries[1], { id: 2, seasonIndex: 1, atTick: s.tick, carryInUnits: 3, requestedEvaporationUnits: 10,
    actualEvaporationUnits: 3, inflowUnits: 200, overflowUnits: 100, preparedStorageUnits: 100 });
  assert.equal(s.storedUnits, 100); assert.equal(s.totalEvaporationUnits, 3); assert.equal(s.totalOverflowUnits, 100);
  tick(s); assert.equal(s.seasonEntries.length, 2); assert.equal(s.totalInflowUnits, 200); assert.equal(s.inventory.balanceErrorUnits, 0);
});
test('five-unit plans only reserve water and demand-full outranks budget-short', () => {
  const s = planningFixture(5, [5, 15, 10]); tick(s, { a: true });
  assert.deepEqual(s.planUnits, [5, 0, 0]); assert.equal(s.storedUnits, 5); assert.deepEqual(s.deliveredUnits, [0, 0, 0]);
  assert.equal(s.reservedUndeliveredUnits, 5); assert.equal(s.unallocatedStoredUnits, 0); assert.equal(s.inventory.totalAccountedUnits, 5);
  tick(s); tick(s, { a: true }); assert.equal(s.lastAction.reason, 'demand-full'); assert.deepEqual(s.undoStack, [0]);
  assert.equal(s.lastAction.storedBefore, s.lastAction.storedAfter); assert.equal(s.lastAction.accepted, false);
});
test('an affordable first add followed by a budget-short rejection never consumes extra storage or undo depth', () => {
  const s = planningFixture(5); add(s, 0, 5); tick(s, { a: true });
  assert.equal(s.lastAction.reason, 'budget-short'); assert.deepEqual(s.planUnits, [5, 0, 0]); assert.deepEqual(s.undoStack, [0]);
  assert.equal(s.storedUnits, 5); assert.equal(s.deliveredUnits[0], 0); assert.equal(s.lastAction.undoDepthBefore, s.lastAction.undoDepthAfter);
});
test('undo is LIFO over successful adds, preserves cursor, and an empty stack identifies no category', () => {
  const s = planningFixture(25, [5, 5, 10]); add(s, 0, 5); add(s, 1, 5); tick(s, { a: true });
  assert.equal(s.lastAction.reason, 'demand-full'); tick(s); choose(s, 2); tick(s, { b: true });
  assert.equal(s.cursor, 2); assert.equal(s.lastAction.categoryIndex, 1); assert.deepEqual(s.planUnits, [5, 0, 0]);
  tick(s); tick(s, { b: true }); assert.equal(s.lastAction.categoryIndex, 0); assert.deepEqual(s.planUnits, [0, 0, 0]);
  tick(s); tick(s, { b: true }); assert.equal(s.lastAction.reason, 'nothing-to-undo'); assert.equal(s.lastAction.categoryIndex, null); assert.equal(s.cursor, 2);
});
test('a zero plan commits legally and immediately performs release age one without prechecking failure', () => {
  const s = Model.create(1, 0); choose(s, 2); const from = s.tick; tick(s, { x: .45, a: true });
  assert.equal(s.phase, 'playing'); assert.equal(s.stage, 'releasing'); assert.equal(s.releaseAgeTicks, 1); assert.equal(s.commits[0].fromTick, from);
  assert.equal(s.commits[0].tick, from + 1); assert.deepEqual(s.committedUnits, [0, 0, 0]); assert.deepEqual(s.undoStack, []);
  assert.equal(s.lastInterval.release.fromAgeTicks, 0); assert.equal(s.lastInterval.release.toAgeTicks, 1);
  assert.equal(s.seasonLedgers.length, 0); assert.equal(s.lastAction.accepted, true); assert.equal(s.lastAction.storedBefore, s.lastAction.storedAfter);
  assert.equal(s.lastInput.navigationApplied, 1); assert.equal(s.inputState.navigationDirection, 0); assert.equal(s.inputState.navigationHeldTicks, 0);
});
test('release fresh attempts are locked with null categories and do not navigate or recommit', () => {
  const s = releaseFixture({ age: 10 }); const plan = copy(s.planUnits), depth = s.actionReceipts.length;
  tick(s, { x: -1, a: true, b: true }); assert.equal(s.cursor, 3); assert.equal(s.actionReceipts.length, depth + 1);
  assert.equal(s.lastAction.key, 'b'); assert.equal(s.lastAction.kind, 'undo'); assert.equal(s.lastAction.reason, 'release-locked'); assert.equal(s.lastAction.categoryIndex, null);
  tick(s, { a: true }); assert.equal(s.actionReceipts.length, depth + 1); tick(s); tick(s, { a: true });
  assert.equal(s.lastAction.kind, 'commit'); assert.equal(s.lastAction.reason, 'release-locked'); assert.equal(s.lastAction.categoryIndex, null);
  assert.deepEqual(s.planUnits, plan); assert.equal(s.commits.length, 1); assert.equal(s.inputState.navigationHeldTicks, 0);
});
test('all 480 real release intervals independently meter each category and finish exact immutable seasonal accounts', () => {
  const s = planningFixture(60); add(s, 0, 10); add(s, 1, 15); add(s, 2, 5); const stock = s.storedUnits; commit(s);
  const commitRecord = copy(s.commits[0]);
  for (let age = 1; age <= 480; age++) {
    if (age > 1) tick(s); const r = s.lastInterval.release;
    assert.equal(r.fromAgeTicks, age - 1); assert.equal(r.toAgeTicks, age);
    const before = [10, 15, 5].map(q => Math.floor(q * (age - 1) / 480)), after = [10, 15, 5].map(q => Math.floor(q * age / 480));
    assert.deepEqual(r.deliveredBeforeUnits, before); assert.deepEqual(r.deliveredAfterUnits, after);
    assert.deepEqual(r.creditedUnits, after.map((n, i) => n - before[i])); assert.equal(r.storageAfterUnits, stock - sum(after));
    assert.equal(s.inventory.balanceErrorUnits, 0);
  }
  const ledger = s.seasonLedgers[0]; assert.deepEqual(ledger.deliveredUnits, [10, 15, 5]); assert.equal(ledger.carryOutUnits, 30);
  assert.equal(ledger.completedAtTick, commitRecord.fromTick + 480); assert.equal(ledger.commitId, commitRecord.id); assert.equal(ledger.balanceErrorUnits, 0);
  assert.deepEqual(s.commits[0], commitRecord); assert.equal(s.completedSeasons, 1); assert.equal(s.seasonEntries.length, 2);
  assert.equal(s.releaseAgeTicks, 0); assert.equal(s.lastInterval.enteredSeasonIndex, 1); assert.equal(s.lastInterval.release.seasonIndex, 0);
});
test('zero-credit intervals never pool category remainders into early water delivery', () => {
  const s = releaseFixture({ plan: [5, 5, 5], age: 31 }); const stock = s.storedUnits; tick(s);
  assert.deepEqual(s.lastInterval.release.creditedUnits, [0, 0, 0]); assert.equal(s.storedUnits, stock);
  many(s, 63); assert.equal(s.releaseAgeTicks, 95); assert.deepEqual(s.currentDeliveredUnits, [0, 0, 0]);
  tick(s); assert.deepEqual(s.currentDeliveredUnits, [1, 1, 1]); assert.equal(s.storedUnits, stock - 3);
});
test('resident equality is safe while below-floor failure retains the finished ledger without a new entry', () => {
  const rules = Array.from({ length: 4 }, () => ({ inflowUnits: 0, evaporationUnits: 0, demandUnits: [100, 100, 100], residentFloorUnits: 10 }));
  const safe = releaseFixture({ plan: [10, 0, 5], seasons: rules }); tick(safe); assert.equal(safe.phase, 'playing'); assert.equal(safe.seasonLedgers[0].residentFloorMet, true);
  const low = releaseFixture({ plan: [5, 0, 5], seasons: rules }); tick(low); assert.equal(low.lostReason, 'resident-floor'); assert.equal(low.stage, 'finished');
  assert.equal(low.seasonEntries.length, 1); assert.equal(low.seasonLedgers.length, 1); assert.equal(low.seasonLedgers[0].residentFloorMet, false);
  assert.deepEqual(low.seasonLedgers[0].deliveredUnits, [5, 0, 5]); assert.equal(low.failures[0].actualValue, 5); assert.equal(low.failures[0].limitValue, 10);
});
test('two exact zero-river seasons fail but any positive delivery resets the streak', () => {
  const dry = releaseFixture({ prior: [[10, 0, 0]], plan: [10, 0, 0] }); tick(dry);
  assert.equal(dry.lostReason, 'river-dry-streak'); assert.equal(dry.riverDryStreak, 2); assert.equal(dry.seasonLedgers[1].riverDryStreakBefore, 1);
  const wet = releaseFixture({ prior: [[10, 0, 0]], plan: [10, 0, 5] }); tick(wet);
  assert.equal(wet.phase, 'playing'); assert.equal(wet.riverDryStreak, 0); assert.equal(wet.seasonLedgers[1].riverDryStreakAfter, 0);
});
test('winter uses independent integer cross-products and cannot offset a failed category with another surplus', () => {
  const rules = Array.from({ length: 4 }, () => ({ inflowUnits: 0, evaporationUnits: 0, demandUnits: [25, 25, 25], residentFloorUnits: 0 }));
  const s = releaseFixture({ seasons: rules, targets: [90, 80, 75], prior: [[25, 20, 20], [20, 20, 20], [20, 20, 20]], plan: [25, 15, 20] }); tick(s);
  assert.deepEqual(s.deliveredUnits, [90, 75, 80]); assert.deepEqual(s.annualTargetsMet, [true, false, true]); assert.equal(s.lostReason, 'annual-target');
  assert.deepEqual(s.failures, [{ kind: 'annual-target', seasonIndex: 3, tick: s.tick, categoryIndex: 1,
    actualValue: 7500, limitValue: 8000, unit: 'water-percent-product' }]);
});
test('annual classification never rounds a nearly satisfied percentage into a pass', () => {
  const rules = Array.from({ length: 4 }, (_, i) => ({ inflowUnits: 0, evaporationUnits: 0, demandUnits: [25, 25, i === 3 ? 25 : 20], residentFloorUnits: 0 }));
  const s = releaseFixture({ seasons: rules, targets: [0, 0, 65], prior: [[10, 0, 15], [10, 0, 15], [10, 0, 15]], plan: [10, 0, 10] }); tick(s);
  assert.equal(s.annualDemandUnits[2], 85); assert.equal(s.deliveredUnits[2], 55); assert.equal(s.annualTargetsMet[2], false);
  assert.equal(s.failures[0].kind, 'annual-target'); assert.equal(s.failures[0].categoryIndex, 2);
  assert.equal(s.failures[0].actualValue, 5500); assert.equal(s.failures[0].limitValue, 5525);
});
test('winter failure priority preserves resident, river and every deficient annual category fact', () => {
  const rules = Array.from({ length: 4 }, () => ({ inflowUnits: 0, evaporationUnits: 0, demandUnits: [25, 25, 25], residentFloorUnits: 0 })); rules[3].residentFloorUnits = 5;
  const s = releaseFixture({ seasons: rules, targets: [90, 80, 75], prior: [[5, 0, 5], [5, 0, 5], [5, 0, 0]], plan: [0, 0, 0] }); tick(s);
  assert.deepEqual(s.failures.map(f => [f.kind, f.categoryIndex]), [['resident-floor', 0], ['river-dry-streak', 2], ['annual-target', 0], ['annual-target', 1], ['annual-target', 2]]);
  assert.equal(s.lostReason, 'resident-floor'); assert.equal(s.score, 0); assert.equal(s.seasonEntries.length, 4); assert.equal(s.seasonLedgers.length, 4);
});
test('successful winter accepts exact target equality, scores actual deliveries and retains its final plan', () => {
  const rules = Array.from({ length: 4 }, () => ({ inflowUnits: 0, evaporationUnits: 0, demandUnits: [25, 25, 25], residentFloorUnits: 0 }));
  const s = releaseFixture({ seasons: rules, targets: [90, 80, 75], prior: [[25, 20, 20], [20, 20, 20], [20, 20, 15]], plan: [25, 20, 20] }); tick(s);
  assert.equal(s.phase, 'won'); assert.equal(s.stage, 'finished'); assert.deepEqual(s.deliveredUnits, [90, 80, 75]); assert.equal(s.score, 1245);
  assert.deepEqual(s.failures, []); assert.equal(s.lostReason, null); assert.equal(s.completedSeasons, 4); assert.equal(s.seasonIndex, 3);
  assert.deepEqual(s.committedUnits, [25, 20, 20]); assert.deepEqual(s.currentDeliveredUnits, [25, 20, 20]); assert.equal(s.seasonEntries.length, 4);
});
test('season transition creates one zero plan and requires a strictly complete neutral before fresh input', () => {
  const s = releaseFixture(); tick(s, { a: true }); assert.equal(s.stage, 'planning'); assert.equal(s.inputState.quarantined, true);
  assert.equal(s.lastInput.cursorBefore, 3); assert.equal(s.lastInput.cursorAfter, 0); assert.equal(s.lastInput.navigationApplied, 0);
  assert.equal(s.cursor, 0); assert.deepEqual(s.planUnits, [0, 0, 0]); assert.equal(s.committedUnits, null); assert.deepEqual(s.undoStack, []);
  tick(s, { a: true }); tick(s, { x: .45 }); tick(s, { y: -.45 }); assert.equal(s.inputState.quarantined, true); assert.deepEqual(s.planUnits, [0, 0, 0]);
  tick(s, { x: .449, y: -.449 }); assert.equal(s.lastInput.neutralAcknowledged, true); assert.equal(s.inputState.quarantined, false);
  assert.deepEqual(s.planUnits, [0, 0, 0]); tick(s, { a: true }); assert.deepEqual(s.planUnits, [5, 0, 0]);
});
test('neutral acknowledgement only records actual prior-isolation release, not ordinary release or new cancellation', () => {
  const s = Model.create(1, 0); tick(s); assert.equal(s.lastInput.neutralAcknowledged, false);
  tick(s, { cancelled: true }); assert.equal(s.lastInput.neutralAcknowledged, false); assert.equal(s.inputState.quarantined, true);
  tick(s, { cancelled: true }); assert.equal(s.lastInput.neutralAcknowledged, false);
  tick(s); assert.equal(s.lastInput.neutralAcknowledged, true); assert.equal(s.lastInput.quarantinedBefore, true);
  tick(s); assert.equal(s.lastInput.neutralAcknowledged, false);
});
test('an acknowledged neutral can coincide with season-end quarantine being established again', () => {
  const s = releaseFixture({ quarantined: true }); tick(s);
  assert.equal(s.lastInput.neutralAcknowledged, true); assert.equal(s.lastInput.quarantinedAfter, true);
  assert.equal(s.inputState.quarantined, true); assert.equal(s.lastInterval.completedSeasonIndex, 0); assert.equal(s.lastInterval.enteredSeasonIndex, 1);
});
test('buttons require literal true, Pressed aliases are ignored and invalid axes normalize to zero', () => {
  const s = Model.create(1, 0); tick(s, { a: 1, b: 'yes', aPressed: true, bPressed: true, x: Infinity, y: NaN });
  assert.equal(s.actionReceipts.length, 0); assert.equal(s.lastInput.a, false); assert.equal(s.lastInput.b, false); assert.equal(s.lastInput.x, 0); assert.equal(s.lastInput.y, 0);
  tick(s, { a: true }); assert.deepEqual(s.planUnits, [5, 0, 0]); tick(s, { a: true }); assert.equal(s.actionReceipts.length, 1);
  tick(s); tick(s, { a: true }); assert.deepEqual(s.planUnits, [10, 0, 0]);
});
test('fresh B resets navigation age and consumes simultaneous A even when the action is only an undo', () => {
  const s = planningFixture(); add(s, 0, 5); tick(s, { x: 1 }); many(s, 3, { x: 1 }); const cursor = s.cursor;
  tick(s, { x: 1, a: true, b: true }); assert.equal(s.lastAction.kind, 'undo'); assert.equal(s.cursor, cursor);
  assert.equal(s.inputState.navigationHeldTicks, 0); assert.equal(s.inputState.navigationDirection, 0); assert.deepEqual(s.planUnits, [0, 0, 0]);
  const count = s.actionReceipts.length; tick(s, { a: true }); assert.equal(s.actionReceipts.length, count);
  tick(s); tick(s, { a: true }); assert.equal(s.actionReceipts.length, count + 1); assert.equal(s.planUnits[cursor], 5);
});
test('horizontal thresholds are inclusive and repeat ages 1, 24, 36 keep counting at a clamped edge', () => {
  const s = Model.create(1, 0); tick(s, { x: .45 }); assert.equal(s.cursor, 1); many(s, 22, { x: .45 }); assert.equal(s.cursor, 1);
  tick(s, { x: .45 }); assert.equal(s.cursor, 2); many(s, 12, { x: .45 }); assert.equal(s.cursor, 3);
  many(s, 12, { x: .45 }); assert.equal(s.cursor, 3); assert.equal(s.inputState.navigationHeldTicks, 48); assert.equal(s.lastInput.navigationApplied, 0);
  tick(s, { x: -.45 }); assert.equal(s.cursor, 2); assert.equal(s.inputState.navigationHeldTicks, 1);
});
test('navigation precedes fresh A so an inclusive right edge adds to the newly selected category', () => {
  const s = Model.create(1, 0); tick(s, { x: .45, a: true }); assert.equal(s.cursor, 1); assert.deepEqual(s.planUnits, [0, 5, 0]);
  assert.equal(s.lastAction.categoryIndex, 1); assert.equal(s.lastInput.navigationApplied, 1); assert.equal(s.lastInput.cursorBefore, 0); assert.equal(s.lastInput.cursorAfter, 1);
});
test('vertical input never navigates but prevents isolation release until it is strictly neutral', () => {
  const s = Model.create(1, 0); tick(s, { y: 1 }); assert.equal(s.cursor, 0); assert.equal(s.inputState.navigationHeldTicks, 0);
  tick(s, { cancelEpoch: 1 }); tick(s, { y: -.45 }); assert.equal(s.inputState.quarantined, true);
  tick(s, { y: -.44 }); assert.equal(s.inputState.quarantined, false); assert.equal(s.lastInput.neutralAcknowledged, true); assert.equal(s.cursor, 0);
});
test('valid epoch changes in either direction cancel input while invalid values preserve the old epoch', () => {
  const s = releaseFixture({ age: 95, plan: [5, 5, 5] }); tick(s, { cancelEpoch: 2, a: true });
  assert.equal(s.releaseAgeTicks, 96); assert.deepEqual(s.currentDeliveredUnits, [1, 1, 1]); assert.equal(s.lastInput.cancelled, false);
  assert.equal(s.inputState.quarantined, true); assert.equal(s.lastInput.actionIds.length, 0);
  tick(s, { cancelEpoch: 2 }); assert.equal(s.inputState.quarantined, false);
  for (const invalid of [-1, .5, '4', NaN, Infinity]) { tick(s, { cancelEpoch: invalid }); assert.equal(s.inputState.cancelEpoch, 2); assert.equal(s.lastInput.cancelled, false); }
  tick(s, { cancelEpoch: 1 }); assert.equal(s.inputState.cancelEpoch, 1); assert.equal(s.lastInput.cancelled, false); assert.equal(s.inputState.quarantined, true);
});
test('paused zero-time calls freeze release, accounts, input and season timing without catch-up', () => {
  const s = releaseFixture({ age: 95, plan: [5, 5, 5] }), before = copy(s);
  for (let n = 0; n < 3; n++) Model.step(s, 0, { a: true, b: true, cancelled: true, cancelEpoch: n });
  assert.deepEqual(s, before); tick(s); assert.equal(s.tick, before.tick + 1); assert.equal(s.releaseAgeTicks, 96); assert.deepEqual(s.currentDeliveredUnits, [1, 1, 1]);
});
test('compact evidence and inventory arrays remain deep snapshots through later real changes', () => {
  const s = planningFixture(50); add(s, 0, 10); const oldAction = s.actionReceipts[0], frozenAction = copy(oldAction), entry = copy(s.seasonEntries[0]);
  assert.notStrictEqual(oldAction.planAfter, s.planUnits); assert.notStrictEqual(s.lastAction, s.actionReceipts.at(-1));
  commit(s); const record = s.commits[0], frozenCommit = copy(record), interval = s.lastInterval, frozenInterval = copy(interval);
  assert.notStrictEqual(record.plannedUnits, s.committedUnits); assert.notStrictEqual(s.inventory.deliveredUnits, s.deliveredUnits);
  many(s, 50); assert.deepEqual(oldAction, frozenAction); assert.deepEqual(record, frozenCommit); assert.deepEqual(interval, frozenInterval); assert.deepEqual(s.seasonEntries[0], entry);
});
test('reservation displays count already stored water once and final-season carry remains physically conserved', () => {
  const s = releaseFixture({ plan: [10, 5, 5], age: 239 }); tick(s);
  assert.deepEqual(s.currentDeliveredUnits, [5, 2, 2]); assert.equal(s.planTotalUnits, 20); assert.equal(s.reservedUndeliveredUnits, 11);
  assert.equal(s.unallocatedStoredUnits, s.storedUnits - 11); assert.equal(s.inventory.totalAccountedUnits, s.initialStorageUnits + s.totalInflowUnits);
  const end = releaseFixture({ plan: [10, 5, 5] }); tick(end); const ledger = end.seasonLedgers[0];
  assert.equal(ledger.carryInUnits + ledger.inflowUnits, ledger.actualEvaporationUnits + ledger.overflowUnits + sum(ledger.deliveredUnits) + ledger.carryOutUnits);
  assert.equal(end.seasonEntries[1].carryInUnits, ledger.carryOutUnits); assert.equal(end.inventory.balanceErrorUnits, 0);
});
test('both terminal outcomes freeze all fields before dt validation and retry creates a clean original board', () => {
  const lost = releaseFixture(); lost.seasons[0].residentFloorUnits = 20; tick(lost);
  const won = releaseFixture({ prior: [[10, 0, 5], [10, 0, 5], [10, 0, 5]] }); tick(won);
  assert.equal(lost.phase, 'lost'); assert.equal(won.phase, 'won');
  for (const s of [lost, won]) { const before = copy(s); assert.strictEqual(Model.step(s, NaN, { a: true, b: true, cancelEpoch: 9 }), s);
    Model.step(s, DT, { x: 1 }); Model.step(s, 0, { cancelled: true }); assert.deepEqual(s, before); }
  const fresh = Model.create(730, 0); assert.equal(fresh.stage, 'planning'); assert.equal(fresh.tick, 0); assert.equal(fresh.commits.length, 0);
  assert.deepEqual(fresh.seasons, published.levels[0].seasons); assert.deepEqual(fresh.planUnits, [0, 0, 0]); assert.equal(fresh.seasonEntries.length, 1);
});
