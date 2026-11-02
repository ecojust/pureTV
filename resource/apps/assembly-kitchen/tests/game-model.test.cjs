'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const modelPath = path.join(__dirname, '../src/main/assets/game-model.js');
const Model = require(modelPath);
const DT = 1 / 60, Q = 240, AMBIENT = 4800, STAGES = ['cook', 'cool', 'pack'];
const clone = value => JSON.parse(JSON.stringify(value));
const tick = (s, input = {}) => Model.step(s, DT, input);
const a = s => tick(s, { aPressed: true });
const b = s => tick(s, { bPressed: true });
const order = (s, id) => s.orders.find(o => o.id === id);
function ticks(s, count, input = {}) { for (let i = 0; i < count; i++) tick(s, input); return s; }
function audit(s) {
  assert.deepEqual(Object.keys(s.stations), STAGES);
  assert.equal(s.tick / 60, s.elapsed); assert.equal(s.remaining, Math.max(0, (s.closeTick - s.tick) / 60));
  assert.equal(s.commandCount, s.actionReceipts.length + s.fanChangeCount);
  assert.equal(s.strikes, s.disposalReceipts.length); assert.equal(s.discardedAttempts, s.strikes);
  assert.equal(s.taskCount, s.taskStartReceipts.length);
  assert.equal(s.deliveredCount, s.orders.filter(o => o.phase === 'delivered').length);
  assert.equal(s.deliveredCount, s.deliveryReceipts.filter(r => r.accepted).length);
  assert.equal(s.nextOrderId, s.deliveryOrder.find(id => order(s, id).phase !== 'delivered') || null);
  const occupied = [];
  for (const stage of STAGES) {
    const st = s.stations[stage], t = st.task, stats = s.taskStats[stage];
    assert.equal(st.id, stage);
    assert.equal(stats.started, stats.completed + stats.cancelled + Number(!!t && !t.ready));
    assert.equal(stats.completed, stats.collected + stats.discardedReady + Number(!!t && t.ready));
    assert.equal(stats.started, s.taskStartReceipts.filter(r => r.stage === stage).length);
    assert.equal(stats.completed, s.completionReceipts.filter(r => r.stage === stage).length);
    assert.equal(stats.collected, s.collectionReceipts.filter(r => r.stage === stage).length);
    if (!t) continue;
    const o = order(s, t.orderId); occupied.push(o.id);
    assert.equal(o.location, stage); assert.equal(o.taskId, t.id); assert.equal(o.attempt, t.attempt);
    assert.equal(t.stage, stage); assert.equal(t.durationTicks, stage === 'cook' ? o.cookTicks : stage === 'cool' ? 120 : o.packTicks);
    assert.ok(Number.isInteger(t.progressTicks) && t.progressTicks > 0 && t.progressTicks <= t.durationTicks);
    assert.equal(t.ready, t.progressTicks === t.durationTicks);
    assert.equal(t.completedAtTick, t.ready ? t.startedTick + t.durationTicks - 1 : null);
  }
  assert.equal(new Set(occupied).size, occupied.length);
  for (const o of s.orders) {
    assert.ok(Number.isInteger(o.temperatureQ) && o.temperatureQ >= AMBIENT);
    assert.equal(o.temperatureQ, AMBIENT + o.heatingAddedQ - o.coolingRemovedQ);
    assert.ok(Number.isInteger(o.heatingAddedQ) && o.heatingAddedQ >= 0);
    assert.ok(Number.isInteger(o.coolingRemovedQ) && o.coolingRemovedQ >= 0);
    if (o.phase === 'raw' || o.phase === 'cooking') {
      assert.equal(o.cookedAtTick, null); assert.equal(o.expiresAtTick, null); assert.equal(o.holdingAgeTicks, 0);
    } else {
      assert.equal(o.expiresAtTick, o.cookedAtTick + o.holdTicks);
      assert.equal(o.holdingAgeTicks, (o.phase === 'delivered' ? o.delivery.tick - 1 : s.tick) - o.cookedAtTick);
    }
    assert.equal(o.taskId === null, o.location === 'tray' || o.location === 'delivered');
  }
  const inv = s.inventory, ledger = s.thermalLedger;
  assert.equal(inv.initialAttempts, 3); assert.equal(inv.issuedAttempts, 3 + s.strikes);
  assert.equal(inv.issuedAttempts, s.orders.reduce((n, o) => n + o.attempt, 0));
  assert.equal(inv.issuedAttempts, inv.liveAttempts + inv.deliveredAttempts + inv.discardedAttempts);
  assert.equal(inv.error, 0); assert.equal(ledger.error, 0);
  assert.equal(ledger.issuedAmbientQ, inv.issuedAttempts * AMBIENT);
  assert.equal(ledger.recordedCurrentTemperatureQ, s.orders.reduce((n, o) => n + o.temperatureQ, 0));
  assert.equal(ledger.discardedTemperatureQ, s.disposalReceipts.reduce((n, r) => n + r.before.temperatureQ, 0));
  assert.equal(ledger.issuedAmbientQ + ledger.heatingAddedQ - ledger.coolingRemovedQ,
    ledger.discardedTemperatureQ + ledger.recordedCurrentTemperatureQ);
}

// Explicit synthetic public-state cuts isolate rule boundaries. They are not
// ordinary-play routes, authored feasibility witnesses, or evidence of a win.
// Only the currently occupied task (or a delivered pack task) has fixture history;
// the tests assert new transitions and conservation, not a reachable full prefix.
function cut({ at = 1800, difficulty = 0, items = [], fan = 'fast' } = {}) {
  const s = Model.create(51, difficulty); s.tick = at; s.elapsed = at / 60;
  s.remaining = (s.closeTick - at) / 60; s.fanMode = fan; s.fanRateQ = fan === 'fast' ? -12 : -2;
  for (const spec of items) {
    const o = order(s, spec.id), phase = spec.phase, stage = spec.location ||
      ({ cooking: 'cook', cooked: 'cook', cooling: 'cool', cooled: 'cool', packing: 'pack', packed: 'pack', delivered: 'delivered' })[phase];
    o.phase = phase; o.location = stage;
    const cooking = phase === 'cooking', age = spec.age === undefined ? 100 : spec.age;
    o.cookedAtTick = cooking ? null : at - age; o.holdingAgeTicks = cooking ? 0 : age;
    o.expiresAtTick = cooking ? null : o.cookedAtTick + o.holdTicks;
    const duration = stage === 'cook' ? o.cookTicks : stage === 'cool' ? 120 : o.packTicks;
    const ready = ['cooked', 'cooled', 'packed', 'delivered'].includes(phase);
    const progress = ready ? duration : spec.progress === undefined ? duration - 1 : spec.progress;
    o.heatingAddedQ = cooking ? progress * 20 : o.cookTicks * 20;
    o.temperatureQ = spec.temperatureQ === undefined ? AMBIENT + o.heatingAddedQ : spec.temperatureQ;
    o.coolingRemovedQ = AMBIENT + o.heatingAddedQ - o.temperatureQ;
    if (stage !== 'tray') {
      const taskStage = stage === 'delivered' ? 'pack' : stage, id = ++s.taskCount;
      const startedTick = at - progress + 1;
      const task = { id, stage: taskStage, orderId: o.id, attempt: 1, startedTick,
        durationTicks: duration, progressTicks: progress, completedAtTick: ready ? startedTick + duration - 1 : null, ready };
      s.taskStats[taskStage].started++;
      s.taskStartReceipts.push({ taskId: id, stage: taskStage, orderId: o.id, attempt: 1,
        tick: startedTick, at: startedTick / 60, durationTicks: duration, commandId: 0 });
      if (ready) {
        s.taskStats[taskStage].completed++;
        s.completionReceipts.push({ id: s.completionReceipts.length + 1, taskId: id, stage: taskStage, orderId: o.id,
          attempt: 1, tick: task.completedAtTick, at: task.completedAtTick / 60, startedTick,
          durationTicks: duration, temperatureQ: o.temperatureQ, holdingAgeTicks: o.holdingAgeTicks });
      }
      if (stage === 'delivered') {
        s.taskStats.pack.collected++;
        s.collectionReceipts.push({ id: s.collectionReceipts.length + 1, taskId: id, stage: 'pack', orderId: o.id,
          attempt: 1, tick: at, at: at / 60, commandId: 0, kind: 'deliver', temperatureQ: o.temperatureQ, holdingAgeTicks: age - 1 });
        o.holdingAgeTicks = age - 1;
        const receipt = { id: s.deliveryReceipts.length + 1, commandId: 0, taskId: id, orderId: o.id, attempt: 1,
          tick: at, at: at / 60, expectedOrderId: o.id, temperatureQ: o.temperatureQ, holdingAgeTicks: o.holdingAgeTicks,
          deliveryMinQ: o.deliveryMinQ, deliveryMaxQ: o.deliveryMaxQ, issues: { wrongOrder: false, wrongTemperature: false },
          accepted: true, disposalId: null, nextOrderIdAfter: null };
        s.deliveryReceipts.push(receipt); o.delivery = clone(receipt);
      } else {
        assert.equal(s.stations[stage].task, null, 'fixture must respect station capacity');
        s.stations[stage].task = task; o.taskId = id;
      }
    }
  }
  s.nextOrderId = s.deliveryOrder.find(id => order(s, id).phase !== 'delivered') || null;
  s.deliveredCount = s.orders.filter(o => o.phase === 'delivered').length;
  return s;
}

test('UMD API, authored levels, exact integer units and independent fresh state', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['TICK_HZ', 'create', 'step']); assert.equal(Model.TICK_HZ, 60);
  const sandbox = {}; vm.runInNewContext(fs.readFileSync(modelPath, 'utf8'), sandbox);
  assert.deepEqual(clone(sandbox.PureModel.create(8, 1)), Model.create(8, 1));
  const recipes = [
    [['custard', 10, 4, 64, 68, 20], ['tomato-soup', 10, 4, 52, 58, 24], ['compote', 10, 4, 40, 46, 26]],
    [['pumpkin-soup', 12, 5, 56, 62, 24], ['custard', 10, 4, 64, 68, 18], ['stew', 14, 5, 64, 70, 25]],
    [['stew', 14, 6, 58, 64, 25], ['bean-soup', 12, 5, 48, 54, 26], ['custard', 10, 4, 64, 68, 18]]
  ];
  for (let d = 0; d < 3; d++) {
    const s = Model.create(8, d); assert.equal(s.level, d + 1); assert.equal(s.closeTick, [4500, 4800, 5100][d]);
    assert.deepEqual(s.deliveryOrder, [['O1', 'O2', 'O3'], ['O2', 'O1', 'O3'], ['O3', 'O1', 'O2']][d]);
    assert.deepEqual(s.orders.map(o => [o.recipeId, o.cookTicks / 60, o.packTicks / 60, o.deliveryMinQ / Q,
      o.deliveryMaxQ / Q, o.holdTicks / 60]), recipes[d]);
    assert.equal(s.phase, 'playing'); assert.equal(s.selectedOrderId, 'O1'); assert.equal(s.fanMode, 'fast');
    assert.equal(s.strikeLimit, 2); assert.equal(s.lastInterval, null); assert.deepEqual(s.events, []);
    assert.deepEqual(s.physics, { tickHz: 60, temperatureScale: 240, ambientQ: 4800, cookRateQ: 20,
      passiveRateQ: -2, packRateQ: -1, fastCoolRateQ: -12, slowCoolRateQ: -2, minCoolTicks: 120 }); audit(s);
  }
  assert.equal(Model.create(NaN, Infinity).seed, 1); assert.equal(Model.create(-1.9, -3).seed, 4294967295);
  assert.equal(Model.create(0, 2.9).difficulty, 2); assert.equal(Model.create(0, 1.9).difficulty, 1);
  assert.equal(Model.create(0, 99).difficulty, 2); assert.equal(Model.create(0, NaN).difficulty, 0);
  const one = Model.create(5, 0), two = Model.create(5, 0); one.orders[0].temperatureQ = 9999; one.physics.cookRateQ = 9;
  one.deliveryOrder.reverse(); one.stations.cook.task = {}; assert.deepEqual(two, Model.create(5, 0));
});

test('accepted start records immediate post-input progress zero and actual interval progress one', () => {
  const s = Model.create(3, 0); assert.equal(a(s), s);
  const op = s.lastOperation, row = s.lastInterval.orders[0], task = s.stations.cook.task;
  assert.equal(op.action, 'start-cook'); assert.equal(op.before.order.phase, 'raw'); assert.equal(op.before.station.task, null);
  assert.equal(op.after.order.phase, 'cooking'); assert.equal(op.after.order.temperatureQ, AMBIENT);
  assert.equal(op.after.station.task.progressTicks, 0); assert.equal(task.progressTicks, 1);
  assert.equal(op.taskId, task.id); assert.equal(op.deliveryReceiptId, null); assert.equal(op.disposalId, null);
  assert.deepEqual(row.before, op.after.order); assert.equal(row.nominalDeltaQ, 20); assert.equal(row.actualDeltaQ, 20);
  assert.equal(row.afterWork.temperatureQ, 4820); assert.equal(s.orders[0].temperatureQ, 4820);
  assert.equal(s.lastInterval.work[0].increment, 1); assert.equal(s.lastInterval.inputCommandId, 1);
  assert.deepEqual(s.events.map(e => e.type), ['command']); audit(s);
});

test('ordinary six-A recipe preserves stage gates, final cooking heat, ready occupancy and delivery age', () => {
  const s = Model.create(4, 0); b(s); a(s); ticks(s, 599);
  const o = s.orders[0], cookedAt = s.tick;
  assert.equal(o.temperatureQ, 70 * Q); assert.equal(o.phase, 'cooked'); assert.equal(o.holdingAgeTicks, 0);
  assert.equal(s.stations.cook.task.ready, true); assert.equal(s.taskStats.cook.collected, 0);
  assert.equal(s.completionReceipts[0].tick, s.taskStartReceipts[0].tick + 600 - 1);
  assert.equal(s.lastInterval.orders[0].nominalDeltaQ, 20); assert.equal(s.lastInterval.orders[0].afterWork.holdingAgeTicks, 0);
  a(s); assert.equal(o.location, 'tray'); assert.equal(o.temperatureQ, 70 * Q - 2);
  a(s); ticks(s, 119); assert.equal(o.phase, 'cooled'); assert.equal(s.stations.cool.task.ready, true);
  a(s); a(s); ticks(s, 239); assert.equal(o.phase, 'packed'); assert.equal(s.stations.pack.task.ready, true);
  const temperature = o.temperatureQ, age = o.holdingAgeTicks;
  a(s); assert.equal(o.phase, 'delivered'); assert.equal(s.stations.pack.task, null);
  assert.equal(o.temperatureQ, temperature); assert.equal(o.holdingAgeTicks, age);
  assert.equal(o.holdingAgeTicks, s.tick - 1 - cookedAt); assert.equal(o.delivery.accepted, true);
  assert.deepEqual(s.actionReceipts.map(r => r.action), ['start-cook', 'collect-cook', 'start-cool', 'collect-cool', 'start-pack', 'deliver']);
  assert.deepEqual(s.events.map(e => e.type), ['command', 'collected', 'delivered']);
  assert.deepEqual(s.lastInterval.orders[0].before, s.lastInterval.orders[0].after);
  const frozen = clone(o); ticks(s, 12); assert.deepEqual(o, frozen); audit(s);
});

test('held A cannot repeat, unfinished and busy stations reject without strikes or accepted commands', () => {
  const s = Model.create(5, 0); tick(s, { a: true }); ticks(s, 3, { a: true });
  assert.equal(s.commandCount, 1); assert.equal(s.blockedCommands, 0);
  tick(s); tick(s, { a: true }); assert.equal(s.lastRejected.reason, 'not-ready'); assert.equal(s.commandCount, 1);
  tick(s); tick(s, { x: 1, a: true }); assert.equal(s.selectedOrderId, 'O2');
  assert.equal(s.lastRejected.reason, 'station-busy'); assert.equal(s.lastRejected.stationId, 'cook');
  assert.equal(s.strikes, 0); assert.equal(s.taskCount, 1); assert.equal(s.lastInterval.inputCommandId, null);
  assert.equal(s.lastInterval.blockedId, 2); assert.equal(s.orders[1].phase, 'raw'); audit(s);
  const ready = cut({ items: [{ id: 'O1', phase: 'cooked', age: 0 }] }); ready.selectedOrderId = 'O2';
  const oldTemperature = ready.orders[0].temperatureQ; a(ready);
  assert.equal(ready.lastRejected.reason, 'station-busy'); assert.equal(ready.stations.cook.task.ready, true);
  assert.equal(ready.orders[0].temperatureQ, oldTemperature - 2); assert.equal(ready.taskStats.cook.collected, 0); audit(ready);
});

test('all three occupied stations advance concurrently and simultaneous completion uses stable station order', () => {
  const s = cut({ items: [{ id: 'O1', phase: 'cooking' }, { id: 'O2', phase: 'cooling', temperatureQ: 60 * Q },
    { id: 'O3', phase: 'packing', temperatureQ: 44 * Q }] });
  tick(s); assert.deepEqual(s.lastInterval.work.map(w => [w.stationId, w.increment, w.completedNow]),
    [['cook', 1, true], ['cool', 1, true], ['pack', 1, true]]);
  assert.deepEqual(s.orders.map(o => o.phase), ['cooked', 'cooled', 'packed']);
  assert.deepEqual(s.lastInterval.orders.map(r => r.actualDeltaQ), [20, -12, -1]);
  assert.deepEqual(s.events.map(e => e.completion.stage), STAGES);
  assert.equal(s.orders[0].holdingAgeTicks, 0); assert.equal(s.orders[1].holdingAgeTicks, 101); audit(s);
  tick(s); assert.deepEqual(s.lastInterval.work.map(w => [w.increment, w.completedNow]), [[0, false], [0, false], [0, false]]);
  assert.deepEqual(s.lastInterval.orders.map(r => r.actualDeltaQ), [-2, -12, -1]);
  assert.equal(s.completionReceipts.length, 3); assert.deepEqual(s.events, []); audit(s);
});

test('cooling has a 120-tick minimum, B affects this interval, and ambient clamp records actual heat removed', () => {
  const s = cut({ items: [{ id: 'O1', phase: 'cooling', progress: 118, temperatureQ: AMBIENT + 3 }] });
  b(s); assert.equal(s.fanMode, 'slow'); assert.equal(s.orders[0].temperatureQ, AMBIENT + 1);
  assert.equal(s.orders[0].phase, 'cooling'); assert.equal(s.stations.cool.task.progressTicks, 119);
  a(s); assert.equal(s.lastRejected.reason, 'not-ready'); assert.equal(s.orders[0].phase, 'cooled');
  assert.equal(s.lastInterval.orders[0].nominalDeltaQ, -2); assert.equal(s.lastInterval.orders[0].actualDeltaQ, -1);
  assert.equal(s.stations.cool.task.ready, true); assert.equal(s.taskStats.cool.collected, 0);
  b(s); assert.equal(s.lastInterval.orders[0].nominalDeltaQ, -12); assert.equal(s.lastInterval.orders[0].actualDeltaQ, 0);
  const age = s.orders[0].holdingAgeTicks; a(s); assert.equal(s.orders[0].location, 'tray');
  assert.equal(s.orders[0].holdingAgeTicks, age + 1); assert.equal(s.stations.cool.task, null); audit(s);
});

test('collection changes cooling rate before work and packing accepts an already overcooled item', () => {
  const s = cut({ items: [{ id: 'O1', phase: 'cooled', temperatureQ: AMBIENT + 30 }] });
  a(s); assert.equal(s.lastOperation.after.order.temperatureQ, AMBIENT + 30);
  assert.equal(s.lastInterval.orders[0].nominalDeltaQ, -2); assert.equal(s.orders[0].temperatureQ, AMBIENT + 28);
  assert.equal(s.lastOperation.after.station.task, null); assert.deepEqual(s.events.map(e => e.type), ['command', 'collected']);
  a(s); assert.equal(s.lastOperation.action, 'start-pack'); assert.equal(s.orders[0].phase, 'packing');
  assert.equal(s.lastInterval.orders[0].nominalDeltaQ, -1); assert.equal(s.stations.pack.task.progressTicks, 1); audit(s);
});

test('delivery accepts both inclusive temperature endpoints using the pre-interval value', () => {
  for (const temperatureQ of [64 * Q, 68 * Q]) {
    const s = cut({ items: [{ id: 'O1', phase: 'packed', temperatureQ }] }); a(s);
    assert.equal(s.deliveryReceipts[0].accepted, true); assert.equal(s.orders[0].temperatureQ, temperatureQ);
    assert.equal(s.taskStats.pack.collected, 1); assert.equal(s.taskStats.pack.discardedReady, 0);
    assert.equal(s.lastInterval.orders[0].actualDeltaQ, 0); assert.equal(s.lastOperation.after.order.phase, 'delivered');
    assert.deepEqual(s.events.map(e => e.type), ['command', 'collected', 'delivered']);
    assert.equal(s.lastOperation.deliveryReceiptId, 1); assert.equal(s.lastOperation.disposalId, null); audit(s);
  }
});

test('wrong temperature, wrong order and both faults each produce one disposal with exact issue flags', () => {
  const cases = [['O1', 64 * Q - 1, false, true], ['O1', 68 * Q + 1, false, true],
    ['O2', 55 * Q, true, false], ['O2', 70 * Q, true, true]];
  for (const [id, temperatureQ, wrongOrder, wrongTemperature] of cases) {
    const s = cut({ items: [{ id, phase: 'packed', temperatureQ }] }); s.selectedOrderId = id; a(s);
    const r = s.deliveryReceipts[0], d = s.disposalReceipts[0], o = order(s, id);
    assert.equal(r.accepted, false); assert.deepEqual(r.issues, { wrongOrder, wrongTemperature });
    assert.equal(d.reason, wrongOrder ? 'wrong-order' : 'wrong-temperature'); assert.deepEqual(d.issues, r.issues);
    assert.equal(s.strikes, 1); assert.equal(s.commandCount, 1); assert.equal(s.phase, 'playing');
    assert.equal(d.boundary, 'input'); assert.equal(d.before.temperatureQ, temperatureQ); assert.equal(d.commandId, 1);
    assert.equal(d.cancelledTaskId, null); assert.equal(d.discardedReadyTaskId, 1); assert.equal(r.disposalId, d.id);
    assert.equal(s.taskStats.pack.collected, 0); assert.equal(s.taskStats.pack.discardedReady, 1);
    assert.equal(o.phase, 'raw'); assert.equal(o.attempt, 2); assert.equal(o.temperatureQ, AMBIENT); assert.equal(o.holdingAgeTicks, 0);
    assert.equal(s.lastOperation.attempt, 1); assert.equal(s.lastOperation.after.order.attempt, 2);
    assert.deepEqual(s.lastInterval.orders.find(row => row.orderId === id).before, d.after);
    assert.deepEqual(s.events.map(e => e.type), ['command', 'discarded']); assert.deepEqual(s.lastInterval.disposalReceiptIds, [1]); audit(s);
  }
});

test('failed later delivery keeps an earlier accepted dish and its frozen thermal counters', () => {
  const s = cut({ items: [{ id: 'O1', phase: 'delivered', temperatureQ: 66 * Q },
    { id: 'O2', phase: 'packed', temperatureQ: 60 * Q }] });
  s.selectedOrderId = 'O2'; const first = clone(s.orders[0]); a(s);
  assert.deepEqual(s.orders[0], first); assert.equal(s.nextOrderId, 'O2'); assert.equal(s.deliveredCount, 1);
  assert.equal(s.orders[1].attempt, 2); assert.equal(s.strikes, 1); assert.equal(s.deliveryReceipts.length, 2); audit(s);
});

test('expiry distinguishes unfinished cancellation, completed discard and unoccupied tray disposal', () => {
  const cases = [
    { phase: 'packing', location: 'pack', progress: 10, cancelled: 1, discarded: 0 },
    { phase: 'packed', location: 'pack', cancelled: 0, discarded: 1 },
    { phase: 'cooled', location: 'tray', cancelled: 0, discarded: 0 }
  ];
  for (const spec of cases) {
    const s = cut({ items: [{ id: 'O1', temperatureQ: 65 * Q, age: 1199, ...spec }] }); tick(s);
    const d = s.disposalReceipts[0]; assert.equal(d.reason, 'expired'); assert.deepEqual(d.issues, { expired: true });
    assert.equal(d.commandId, null); assert.equal(d.boundary, 'interval-end'); assert.equal(d.before.holdingAgeTicks, 1200);
    assert.equal(s.taskStats.pack.cancelled, spec.cancelled); assert.equal(s.taskStats.pack.discardedReady, spec.discarded);
    assert.equal(s.taskStats.pack.collected, 0); assert.equal(s.orders[0].attempt, 2); assert.equal(s.stations.pack.task, null);
    assert.equal(s.lastInterval.orders[0].afterWork.attempt, 1); assert.equal(s.lastInterval.orders[0].after.attempt, 2);
    assert.equal(s.lastInterval.inputCommandId, null); assert.equal(s.commandCount, 0); audit(s);
  }
});

test('completion followed by same-interval expiry counts completed and discardedReady, never cancelled', () => {
  const s = cut({ items: [{ id: 'O1', phase: 'packing', temperatureQ: 65 * Q, age: 1199 }] }); tick(s);
  assert.deepEqual(s.events.map(e => e.type), ['task-completed', 'discarded']);
  assert.equal(s.completionReceipts[0].temperatureQ, 65 * Q - 1);
  assert.equal(s.disposalReceipts[0].stationTask.ready, true); assert.equal(s.taskStats.pack.completed, 1);
  assert.equal(s.taskStats.pack.discardedReady, 1); assert.equal(s.taskStats.pack.cancelled, 0);
  assert.deepEqual(s.lastInterval.completionReceiptIds, [1]); assert.deepEqual(s.lastInterval.disposalReceiptIds, [1]); audit(s);
});

test('all simultaneous expiries are recorded before terminal choice even beyond the two-strike limit', () => {
  const s = cut({ at: 4499, items: [
    { id: 'O1', phase: 'cooked', location: 'tray', age: 1199 },
    { id: 'O2', phase: 'cooled', location: 'tray', temperatureQ: 55 * Q, age: 1439 },
    { id: 'O3', phase: 'packed', temperatureQ: 44 * Q, age: 1559 }
  ] }); tick(s);
  assert.equal(s.strikes, 3); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'mistakes');
  assert.deepEqual(s.disposalReceipts.map(r => r.orderId), ['O1', 'O2', 'O3']);
  assert.deepEqual(s.disposalReceipts.map(r => [r.strikesBefore, r.strikesAfter]), [[0, 1], [1, 2], [2, 3]]);
  assert.deepEqual(s.events.map(e => e.type), ['discarded', 'discarded', 'discarded', 'lost']);
  assert.deepEqual(s.orders.map(o => [o.phase, o.attempt]), [['raw', 2], ['raw', 2], ['raw', 2]]);
  assert.equal(s.lastInterval.terminalPhase, 'lost'); assert.equal(s.score, 0); audit(s);
});

test('delivery on the exact expiry tick wins its input race; waiting instead expires the same item', () => {
  const spec = { items: [{ id: 'O1', phase: 'packed', temperatureQ: 64 * Q, age: 1199 }] };
  const deliver = cut(spec), wait = cut(spec); a(deliver); tick(wait);
  assert.equal(deliver.orders[0].phase, 'delivered'); assert.equal(deliver.orders[0].holdingAgeTicks, 1199);
  assert.equal(deliver.orders[0].delivery.tick, deliver.orders[0].expiresAtTick); assert.equal(deliver.strikes, 0);
  assert.equal(wait.orders[0].phase, 'raw'); assert.equal(wait.disposalReceipts[0].before.holdingAgeTicks, 1200);
  assert.equal(wait.strikes, 1); audit(deliver); audit(wait);
});

test('last correct delivery on closing tick wins; incomplete service closes; wrong delivery still creates a strike', () => {
  const items = [{ id: 'O1', phase: 'delivered', temperatureQ: 66 * Q },
    { id: 'O2', phase: 'delivered', temperatureQ: 55 * Q }, { id: 'O3', phase: 'packed', temperatureQ: 44 * Q }];
  const win = cut({ at: 4499, items }); win.selectedOrderId = 'O3'; a(win);
  assert.equal(win.phase, 'won'); assert.equal(win.score, 1100); assert.equal(win.lostReason, null); assert.equal(win.failure, null);
  assert.equal(win.nextOrderId, null); assert.deepEqual(win.events.map(e => e.type), ['command', 'collected', 'delivered', 'won']); audit(win);
  const wait = cut({ at: 4499, items }); tick(wait); assert.equal(wait.phase, 'lost'); assert.equal(wait.lostReason, 'closing');
  assert.deepEqual(wait.failure.undeliveredOrderIds, ['O3']); assert.equal(wait.score, 0); audit(wait);
  const wrong = cut({ at: 4499, items: [{ id: 'O1', phase: 'packed', temperatureQ: 60 * Q }] }); a(wrong);
  assert.equal(wrong.strikes, 1); assert.equal(wrong.lostReason, 'closing');
  assert.deepEqual(wrong.events.map(e => e.type), ['command', 'discarded', 'lost']); audit(wrong);
});

test('terminal step freezes every public and internal field; fresh retry resets all receipt ledgers', () => {
  const lost = cut({ at: 4499 }); tick(lost);
  const won = cut({ at: 2000, items: [{ id: 'O1', phase: 'delivered', temperatureQ: 66 * Q },
    { id: 'O2', phase: 'delivered', temperatureQ: 55 * Q }, { id: 'O3', phase: 'packed', temperatureQ: 44 * Q }] });
  won.selectedOrderId = 'O3'; a(won);
  for (const s of [lost, won]) {
    const before = clone(s); Model.step(s, .25, { x: 1, a: true, b: true, aPressed: true, bPressed: true, cancelled: true, cancelEpoch: 9 });
    assert.deepEqual(s, before); Model.step(s, NaN, {}); assert.deepEqual(s, before);
  }
  const fresh = Model.create(51, 0); assert.equal(fresh.tick, 0); assert.equal(fresh.commandCount, 0);
  assert.equal(fresh.taskCount, 0); assert.equal(fresh.strikes, 0); assert.equal(fresh.lastEvent, null);
  for (const key of ['actionReceipts', 'taskStartReceipts', 'completionReceipts', 'collectionReceipts', 'deliveryReceipts', 'disposalReceipts']) assert.deepEqual(fresh[key], []);
  audit(fresh);
});

test('navigation deadzone is inclusive, y is ignored, repeat is 20 then 10 ticks, and selection precedes A', () => {
  const s = Model.create(7, 0);
  for (const x of [-.25, .25, NaN, Infinity]) tick(s, { x, y: 1 });
  assert.equal(s.selectedOrderId, 'O1'); assert.equal(s.eventCount, 0);
  tick(s, { x: .251, aPressed: true }); assert.equal(s.selectedOrderId, 'O2'); assert.equal(s.lastOperation.orderId, 'O2');
  assert.deepEqual(s.events.map(e => e.type), ['selection', 'command']);
  ticks(s, 19, { x: 1 }); assert.equal(s.selectedOrderId, 'O2'); tick(s, { x: 1 }); assert.equal(s.selectedOrderId, 'O3');
  const events = s.eventCount; ticks(s, 10, { x: 1 }); assert.equal(s.selectedOrderId, 'O3'); assert.equal(s.eventCount, events);
  tick(s, { x: -1 }); assert.equal(s.selectedOrderId, 'O2'); ticks(s, 19, { x: -1 });
  assert.equal(s.selectedOrderId, 'O2'); tick(s, { x: -1 }); assert.equal(s.selectedOrderId, 'O1'); audit(s);
});

test('global B works with empty cooler, consumes simultaneous A/navigation, and neutral B resets repeat', () => {
  const s = Model.create(9, 0); tick(s, { x: 1 }); assert.equal(s.selectedOrderId, 'O2');
  tick(s, { x: 0, aPressed: true, bPressed: true });
  assert.equal(s.fanMode, 'slow'); assert.equal(s.fanChangeCount, 1); assert.equal(s.actionReceipts.length, 0);
  tick(s, { x: 1 }); assert.equal(s.selectedOrderId, 'O3'); assert.equal(s.actionReceipts.length, 0);
  tick(s, { x: -1, aPressed: true, bPressed: true }); assert.equal(s.selectedOrderId, 'O3');
  assert.equal(s.fanMode, 'fast'); assert.equal(s.actionReceipts.length, 0);
  assert.equal(s.lastOperation.type, 'fan'); assert.equal(s.commandCount, 2); audit(s);
});

test('fractional action edges latch once, cancellation removes pending edges, and held buttons need release', () => {
  const s = Model.create(10, 0); Model.step(s, DT / 2, { a: true, cancelEpoch: 0 });
  assert.equal(s.tick, 0); assert.equal(s.commandCount, 0); Model.step(s, DT / 2, { a: true, cancelEpoch: 0 });
  assert.equal(s.commandCount, 1); ticks(s, 4, { a: true, cancelEpoch: 0 }); assert.equal(s.blockedCommands, 0);
  Model.step(s, 0, { b: true, cancelEpoch: 0 }); tick(s, { b: true, cancelled: true, cancelEpoch: 1 });
  assert.equal(s.fanChangeCount, 0); tick(s, { b: true, cancelEpoch: 1 }); assert.equal(s.fanChangeCount, 0);
  tick(s, { cancelEpoch: 1 }); tick(s, { b: true, cancelEpoch: 1 }); assert.equal(s.fanChangeCount, 1);
  Model.step(s, 0, { aPressed: true, cancelEpoch: 1 }); tick(s, { cancelEpoch: 2 });
  assert.equal(s.blockedCommands, 0); assert.equal(s.commandCount, 2); audit(s);
});

test('dt normalization is bounded and fixed-step partitioning is deterministic', () => {
  const bounded = Model.create(11, 0); Model.step(bounded, 100, { aPressed: true }); assert.equal(bounded.tick, 15);
  for (const dt of [NaN, Infinity, -1]) Model.step(bounded, dt, {}); assert.equal(bounded.tick, 15);
  assert.equal(bounded.orders[0].temperatureQ, AMBIENT + 300); audit(bounded);
  const whole = Model.create(12, 0), split = Model.create(12, 0);
  for (let i = 0; i < 100; i++) {
    const input = i === 0 ? { a: true } : {};
    tick(whole, input); Model.step(split, DT / 2, input); Model.step(split, DT / 2, input);
  }
  assert.deepEqual(split, whole); audit(whole);
});

test('receipts, immediate operation, event payloads and interval snapshots are detached', () => {
  const s = Model.create(13, 0); a(s);
  const operation = clone(s.lastOperation), receipt = clone(s.actionReceipts[0]), event = clone(s.events[0]), interval = clone(s.lastInterval);
  assert.notEqual(s.lastOperation, s.actionReceipts[0]); assert.notEqual(s.events[0].operation, s.lastOperation);
  assert.notEqual(s.lastEvent, s.events[0]); assert.notEqual(s.lastInterval.orders[0].before, s.lastOperation.after.order);
  ticks(s, 5); assert.deepEqual(s.lastOperation, operation); assert.deepEqual(s.actionReceipts[0], receipt);
  assert.deepEqual(event.operation, operation); assert.equal(interval.work[0].progressAfter, 1);
  s.lastOperation.after.order.temperatureQ = 1; assert.deepEqual(s.actionReceipts[0], receipt);
  const ready = cut({ items: [{ id: 'O1', phase: 'packed', temperatureQ: 66 * Q }] }); a(ready);
  assert.deepEqual(ready.orders[0].delivery, ready.deliveryReceipts[0]); assert.notEqual(ready.orders[0].delivery, ready.deliveryReceipts[0]);
  assert.notEqual(ready.events[2].delivery, ready.deliveryReceipts[0]);
  ready.events[2].delivery.temperatureQ = 0; assert.equal(ready.deliveryReceipts[0].temperatureQ, 66 * Q);
});

test('bounded deterministic ordinary inputs preserve stage, inventory and integer thermal accounting', () => {
  for (let difficulty = 0; difficulty < 3; difficulty++) {
    const s = Model.create(100 + difficulty, difficulty);
    for (let i = 0; i < 1800 && s.phase === 'playing'; i++) {
      const input = i % 47 === 0 ? { bPressed: true } : i % 19 === 0 ? { aPressed: true } :
        i % 137 === 0 ? { x: 1 } : i % 149 === 0 ? { x: -1 } : {};
      tick(s, input); audit(s);
      const interval = s.lastInterval;
      assert.equal(interval.toTick, interval.fromTick + 1);
      for (const row of interval.orders) {
        assert.equal(row.afterWork.temperatureQ - row.before.temperatureQ, row.actualDeltaQ);
        assert.deepEqual(row.after, Object.fromEntries(Object.keys(row.after).map(key => [key, order(s, row.orderId)[key]])));
      }
    }
  }
});
