(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var HZ = 60, DT = 1 / HZ, AMBIENT = 4800, STAGES = ['cook', 'cool', 'pack'];
  var PHYSICS = { tickHz: HZ, temperatureScale: 240, ambientQ: AMBIENT, cookRateQ: 20,
    passiveRateQ: -2, packRateQ: -1, fastCoolRateQ: -12, slowCoolRateQ: -2, minCoolTicks: 120 };
  var RECIPES = {
    custard: ['蒸蛋', 'STEAMED EGG'], 'tomato-soup': ['番茄汤', 'TOMATO SOUP'],
    compote: ['温果羹', 'FRUIT COMPOTE'], 'pumpkin-soup': ['南瓜汤', 'PUMPKIN SOUP'],
    stew: ['炖菜', 'VEGETABLE STEW'], 'bean-soup': ['豆汤', 'BEAN SOUP']
  };
  var LEVELS = [
    { name: '午间三味', nameEn: 'Lunch Trio', close: 75, sequence: ['O1', 'O2', 'O3'],
      orders: [['custard', 10, 4, 64, 68, 20], ['tomato-soup', 10, 4, 52, 58, 24], ['compote', 10, 4, 40, 46, 26]] },
    { name: '热餐先行', nameEn: 'Hot Plate First', close: 80, sequence: ['O2', 'O1', 'O3'],
      orders: [['pumpkin-soup', 12, 5, 56, 62, 24], ['custard', 10, 4, 64, 68, 18], ['stew', 14, 5, 64, 70, 25]] },
    { name: '晚间流水', nameEn: 'Evening Service', close: 85, sequence: ['O3', 'O1', 'O2'],
      orders: [['stew', 14, 6, 58, 64, 25], ['bean-soup', 12, 5, 48, 54, 26], ['custard', 10, 4, 64, 68, 18]] }
  ];
  var SNAPSHOT_KEYS = ['id', 'attempt', 'phase', 'location', 'temperatureQ', 'heatingAddedQ', 'coolingRemovedQ',
    'cookedAtTick', 'holdingAgeTicks', 'expiresAtTick', 'taskId'];
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function orderById(s, id) { return s.orders.find(function (o) { return o.id === id; }); }
  function stationById(s, id) { return s.stations[id]; }
  function snapshot(o) {
    var out = {}; SNAPSHOT_KEYS.forEach(function (key) { out[key] = o[key]; }); return out;
  }
  function raw(o) {
    o.phase = 'raw'; o.location = 'tray'; o.temperatureQ = AMBIENT; o.heatingAddedQ = o.coolingRemovedQ = 0;
    o.cookedAtTick = null; o.holdingAgeTicks = 0; o.expiresAtTick = null; o.taskId = null; o.delivery = null;
  }
  function nextOrder(s) {
    return s.deliveryOrder.find(function (id) { return orderById(s, id).phase !== 'delivered'; }) || null;
  }
  function emit(s, type, facts) {
    var event = Object.assign({}, clone(facts || {}), { id: ++s.eventCount, type: type, tick: s.tick, at: s.elapsed });
    s.events.push(event); s.lastEvent = clone(event);
  }
  function totals(s) {
    s.nextOrderId = nextOrder(s); s.deliveredCount = s.orders.filter(function (o) { return o.phase === 'delivered'; }).length;
    s.discardedAttempts = s.disposalReceipts.length;
    var rows = s.orders.map(function (o) { var delivered = Number(o.phase === 'delivered');
      return { orderId: o.id, issued: o.attempt, live: 1 - delivered, delivered: delivered, discarded: o.attempt - 1 }; });
    var issued = rows.reduce(function (n, o) { return n + o.issued; }, 0), live = 3 - s.deliveredCount;
    s.inventory = { initialAttempts: 3, issuedAttempts: issued, liveAttempts: live, deliveredAttempts: s.deliveredCount,
      discardedAttempts: s.discardedAttempts, byOrder: rows, error: issued - live - s.deliveredCount - s.discardedAttempts };
    var heating = 0, cooling = 0, current = 0, discarded = 0;
    s.orders.forEach(function (o) { heating += o.heatingAddedQ; cooling += o.coolingRemovedQ; current += o.temperatureQ; });
    s.disposalReceipts.forEach(function (d) { heating += d.before.heatingAddedQ; cooling += d.before.coolingRemovedQ; discarded += d.before.temperatureQ; });
    s.thermalLedger = { issuedAmbientQ: issued * AMBIENT, heatingAddedQ: heating, coolingRemovedQ: cooling,
      discardedTemperatureQ: discarded, recordedCurrentTemperatureQ: current,
      error: issued * AMBIENT + heating - cooling - discarded - current };
    s.remaining = Math.max(0, (s.closeTick - s.tick) / HZ);
    s.score = s.phase === 'won' ? 1000 + 2 * Math.floor((s.closeTick - s.tick) / HZ) + 50 * (2 - s.strikes) : 0;
  }
  function boundary(s, o, station) { return { order: snapshot(o), station: clone(station), strikes: s.strikes, nextOrderId: nextOrder(s) }; }
  function startTask(s, o, st, commandId) {
    var duration = st.id === 'cook' ? o.cookTicks : st.id === 'cool' ? s.physics.minCoolTicks : o.packTicks;
    var task = { id: ++s.taskCount, stage: st.id, orderId: o.id, attempt: o.attempt, startedTick: s.tick,
      durationTicks: duration, progressTicks: 0, completedAtTick: null, ready: false };
    st.task = task; o.taskId = task.id; o.location = st.id;
    o.phase = st.id === 'cook' ? 'cooking' : st.id === 'cool' ? 'cooling' : 'packing';
    s.taskStats[st.id].started++;
    s.taskStartReceipts.push({ taskId: task.id, stage: st.id, orderId: o.id, attempt: o.attempt,
      tick: s.tick, at: s.elapsed, durationTicks: duration, commandId: commandId });
    return task.id;
  }
  function collect(s, o, st, commandId, kind) {
    var taskId = st.task.id;
    var receipt = { id: s.collectionReceipts.length + 1, taskId: taskId, stage: st.id, orderId: o.id, attempt: o.attempt,
      tick: s.tick, at: s.elapsed, commandId: commandId, kind: kind, temperatureQ: o.temperatureQ, holdingAgeTicks: o.holdingAgeTicks };
    s.collectionReceipts.push(receipt); s.taskStats[st.id].collected++;
    st.task = null; o.taskId = null; o.location = kind === 'deliver' ? 'delivered' : 'tray'; return receipt;
  }
  function dispose(s, o, reason, issues, commandId, when) {
    var before = snapshot(o), st = stationById(s, o.location), task = st && st.task ? clone(st.task) : null;
    var cancelled = null, discardedReady = null, strikesBefore = s.strikes;
    if (task) {
      if (task.ready) { s.taskStats[st.id].discardedReady++; discardedReady = task.id; }
      else { s.taskStats[st.id].cancelled++; cancelled = task.id; }
      st.task = null;
    }
    s.strikes++; o.attempt++; raw(o);
    var receipt = { id: s.disposalReceipts.length + 1, orderId: o.id, attempt: before.attempt, replacementAttempt: o.attempt,
      tick: s.tick, at: s.elapsed, boundary: when, reason: reason, issues: clone(issues), commandId: commandId,
      before: before, stationTask: task, cancelledTaskId: cancelled, discardedReadyTaskId: discardedReady,
      strikesBefore: strikesBefore, strikesAfter: s.strikes, after: snapshot(o) };
    s.disposalReceipts.push(receipt); s.discardedAttempts = s.disposalReceipts.length; return receipt;
  }
  function reject(s, o, stationId, reason) {
    s.lastRejected = { id: ++s.blockedCommands, tick: s.tick, at: s.elapsed, orderId: o.id, attempt: o.attempt,
      phase: o.phase, location: o.location, stationId: stationId, reason: reason };
    s.message = reason === 'station-busy' ? '工位仍被占用：完成后也要先取走' : reason === 'already-delivered' ? '这份订单已正确交付' : '工序尚未完成，不能跳过前置步骤';
    emit(s, 'blocked', { rejection: s.lastRejected });
  }
  function action(s) {
    var o = orderById(s, s.selectedOrderId), stage, kind;
    if (o.phase === 'delivered') { reject(s, o, null, 'already-delivered'); return; }
    if (o.phase === 'cooking' || o.phase === 'cooling' || o.phase === 'packing') { reject(s, o, o.location, 'not-ready'); return; }
    if (o.phase === 'raw') { stage = 'cook'; kind = 'start-cook'; }
    else if (o.phase === 'cooked') { stage = o.location === 'cook' ? 'cook' : 'cool'; kind = o.location === 'cook' ? 'collect-cook' : 'start-cool'; }
    else if (o.phase === 'cooled') { stage = o.location === 'cool' ? 'cool' : 'pack'; kind = o.location === 'cool' ? 'collect-cool' : 'start-pack'; }
    else { stage = 'pack'; kind = 'deliver'; }
    var st = stationById(s, stage), starting = kind.indexOf('start-') === 0;
    if (starting && st.task) { reject(s, o, stage, 'station-busy'); return; }
    var before = boundary(s, o, st), attempt = o.attempt, commandId = s.commandCount + 1, taskId = starting ? null : st.task.id;
    var deliveryId = null, disposalId = null, facts = [];
    if (starting) { taskId = startTask(s, o, st, commandId); s.message = o.name + '开始' + (stage === 'cook' ? '煮制' : stage === 'cool' ? '冷却' : '装盒'); }
    else if (kind !== 'deliver') {
      var collection = collect(s, o, st, commandId, 'collect'); facts.push(['collected', { collection: collection }]);
      s.message = o.name + '已取回托盘；再次按 A 开始下一工序';
    } else {
      var expected = nextOrder(s), issues = { wrongOrder: o.id !== expected,
        wrongTemperature: o.temperatureQ < o.deliveryMinQ || o.temperatureQ > o.deliveryMaxQ };
      var accepted = !issues.wrongOrder && !issues.wrongTemperature;
      var delivery = { id: s.deliveryReceipts.length + 1, commandId: commandId, taskId: taskId, orderId: o.id, attempt: attempt,
        tick: s.tick, at: s.elapsed, expectedOrderId: expected, temperatureQ: o.temperatureQ, holdingAgeTicks: o.holdingAgeTicks,
        deliveryMinQ: o.deliveryMinQ, deliveryMaxQ: o.deliveryMaxQ, issues: issues, accepted: accepted, disposalId: null, nextOrderIdAfter: null };
      deliveryId = delivery.id;
      if (accepted) {
        var served = collect(s, o, st, commandId, 'deliver'); o.phase = 'delivered';
        delivery.nextOrderIdAfter = nextOrder(s); o.delivery = clone(delivery);
        facts.push(['collected', { collection: served }], ['delivered', { delivery: delivery }]);
        s.message = o.name + '温度与顺序正确，已交付';
      } else {
        var disposal = dispose(s, o, issues.wrongOrder ? 'wrong-order' : 'wrong-temperature', issues, commandId, 'input');
        disposalId = disposal.id; delivery.disposalId = disposalId; delivery.nextOrderIdAfter = nextOrder(s);
        facts.push(['discarded', { disposal: disposal }]); s.message = '交付' + (issues.wrongOrder ? '顺序' : '温度') + '错误：已记失误，该单回到原料';
      }
      s.deliveryReceipts.push(clone(delivery));
    }
    s.commandCount = commandId;
    s.lastOperation = { id: commandId, type: 'action', action: kind, orderId: o.id, attempt: attempt, taskId: taskId,
      tick: s.tick, at: s.elapsed, before: before, after: boundary(s, o, st), deliveryReceiptId: deliveryId, disposalId: disposalId };
    s.actionReceipts.push(clone(s.lastOperation)); emit(s, 'command', { commandId: commandId, operation: s.lastOperation });
    facts.forEach(function (fact) { emit(s, fact[0], fact[1]); });
  }
  function fan(s) {
    var before = { fanMode: s.fanMode, fanRateQ: s.fanRateQ };
    s.fanMode = s.fanMode === 'fast' ? 'slow' : 'fast'; s.fanRateQ = s.fanMode === 'fast' ? -12 : -2; s.fanChangeCount++;
    s.lastOperation = { id: ++s.commandCount, type: 'fan', tick: s.tick, at: s.elapsed, before: before,
      after: { fanMode: s.fanMode, fanRateQ: s.fanRateQ } };
    emit(s, 'command', { commandId: s.commandCount, operation: s.lastOperation });
    s.message = s.fanMode === 'fast' ? '冷却台切换快风：每秒降温 3°C' : '冷却台切换慢风：每秒降温 0.5°C';
  }
  function move(s, dir) {
    if (!dir) { s._heldDirection = 0; s._nextMoveTick = 0; return; }
    var fresh = s._heldDirection !== dir; if (!fresh && s.tick < s._nextMoveTick) return;
    var previous = s.selectedOrderId, index = s.orders.findIndex(function (o) { return o.id === previous; });
    s.selectedOrderId = s.orders[clamp(index + dir, 0, 2)].id;
    s._heldDirection = dir; s._nextMoveTick = s.tick + (fresh ? 20 : 10);
    if (previous !== s.selectedOrderId) emit(s, 'selection', { fromOrderId: previous, toOrderId: s.selectedOrderId });
  }
  function rate(s, o) {
    if (o.phase === 'raw' || o.phase === 'delivered') return 0;
    if (o.phase === 'cooking') return s.physics.cookRateQ;
    if (o.location === 'cool') return s.fanRateQ;
    if (o.location === 'pack') return s.physics.packRateQ;
    return s.physics.passiveRateQ;
  }
  function complete(s, st) {
    var t = st.task, o = orderById(s, t.orderId); t.ready = true; t.completedAtTick = s.tick;
    o.phase = st.id === 'cook' ? 'cooked' : st.id === 'cool' ? 'cooled' : 'packed';
    if (st.id === 'cook') { o.cookedAtTick = s.tick; o.holdingAgeTicks = 0; o.expiresAtTick = s.tick + o.holdTicks; }
    s.taskStats[st.id].completed++;
    var receipt = { id: s.completionReceipts.length + 1, taskId: t.id, stage: st.id, orderId: o.id, attempt: o.attempt,
      tick: s.tick, at: s.elapsed, startedTick: t.startedTick, durationTicks: t.durationTicks,
      temperatureQ: o.temperatureQ, holdingAgeTicks: o.holdingAgeTicks };
    s.completionReceipts.push(receipt); s.message = o.name + '工序完成，仍占工位；按 A 取走或交付'; return receipt;
  }
  function finish(s, reason) {
    s.phase = reason ? 'lost' : 'won'; s.lostReason = reason || null;
    var undelivered = s.orders.filter(function (o) { return o.phase !== 'delivered'; }).map(function (o) { return o.id; });
    s.failure = reason ? { reason: reason, tick: s.tick, strikes: s.strikes, undeliveredOrderIds: undelivered } : null;
    s.message = reason === 'mistakes' ? '错误或过期已达上限，厨房停单' : reason === 'closing' ? '打烊时间已到，仍有订单未交付' : '全部订单按顺序、在合格温度下交付';
    totals(s);
    if (reason) emit(s, 'lost', { reason: reason, strikes: s.strikes, undeliveredOrderIds: undelivered });
    else emit(s, 'won', { score: s.score, deliveredOrderIds: s.deliveryOrder.slice() });
  }
  function tick(s, dir) {
    var previous = s.tick, commandsBefore = s.commandCount, blockedBefore = s.blockedCommands;
    var completionBefore = s.completionReceipts.length, disposalBefore = s.disposalReceipts.length;
    s.tick++; s.elapsed = s.tick / HZ;
    var a = s._pendingA, b = s._pendingB; s._pendingA = s._pendingB = false;
    if (b) { if (!dir) { s._heldDirection = 0; s._nextMoveTick = 0; } fan(s); }
    else { move(s, dir); if (a) action(s); }
    var rows = s.orders.map(function (o) { return { orderId: o.id, before: snapshot(o), nominalDeltaQ: rate(s, o), actualDeltaQ: 0, afterWork: null, after: null }; });
    rows.forEach(function (row, i) {
      var o = s.orders[i], before = o.temperatureQ;
      o.temperatureQ = Math.max(AMBIENT, before + row.nominalDeltaQ); row.actualDeltaQ = o.temperatureQ - before;
      if (row.actualDeltaQ > 0) o.heatingAddedQ += row.actualDeltaQ; else o.coolingRemovedQ -= row.actualDeltaQ;
      if (o.phase !== 'delivered' && o.cookedAtTick !== null) o.holdingAgeTicks++;
    });
    var work = [], completing = [];
    STAGES.forEach(function (stage) {
      var st = s.stations[stage];
      var t = st.task; if (!t) return;
      var before = t.progressTicks, increment = t.ready ? 0 : 1; t.progressTicks += increment;
      var done = !t.ready && t.progressTicks === t.durationTicks;
      work.push({ stationId: st.id, taskId: t.id, orderId: t.orderId, attempt: t.attempt, progressBefore: before,
        increment: increment, progressAfter: t.progressTicks, durationTicks: t.durationTicks, completedNow: done });
      if (done) completing.push(st);
    });
    var completed = completing.map(function (st) { return complete(s, st); });
    completed.forEach(function (receipt) { emit(s, 'task-completed', { completion: receipt }); });
    rows.forEach(function (row, i) { row.afterWork = snapshot(s.orders[i]); });
    s.orders.forEach(function (o) {
      if (o.phase !== 'delivered' && o.cookedAtTick !== null && s.tick >= o.expiresAtTick) {
        var receipt = dispose(s, o, 'expired', { expired: true }, null, 'interval-end');
        s.message = o.name + '保温时限已到：已记失误并重新备料'; emit(s, 'discarded', { disposal: receipt });
      }
    });
    totals(s);
    if (s.strikes >= s.strikeLimit) finish(s, 'mistakes');
    else if (s.deliveredCount === 3) finish(s, null);
    else if (s.tick >= s.closeTick) finish(s, 'closing');
    rows.forEach(function (row, i) { row.after = snapshot(s.orders[i]); });
    s.lastInterval = { fromTick: previous, toTick: s.tick, inputCommandId: s.commandCount > commandsBefore ? s.commandCount : null,
      blockedId: s.blockedCommands > blockedBefore ? s.blockedCommands : null, fanMode: s.fanMode, orders: rows, work: work,
      completionReceiptIds: s.completionReceipts.slice(completionBefore).map(function (r) { return r.id; }),
      disposalReceiptIds: s.disposalReceipts.slice(disposalBefore).map(function (r) { return r.id; }), terminalPhase: s.phase };
  }
  function create(seed, difficulty) {
    var index = Number.isFinite(difficulty) ? clamp(Math.trunc(difficulty), 0, 2) : 0, level = LEVELS[index];
    var orders = level.orders.map(function (r, i) {
      var o = { id: 'O' + (i + 1), recipeId: r[0], name: RECIPES[r[0]][0], nameEn: RECIPES[r[0]][1],
        cookTicks: r[1] * HZ, packTicks: r[2] * HZ, deliveryMinQ: r[3] * 240, deliveryMaxQ: r[4] * 240,
        holdTicks: r[5] * HZ, attempt: 1 }; raw(o); return o;
    });
    var stats = {}, stations = {}; STAGES.forEach(function (stage) {
      stats[stage] = { started: 0, completed: 0, collected: 0, cancelled: 0, discardedReady: 0 };
      stations[stage] = { id: stage, task: null };
    });
    var s = { width: 960, height: 540, seed: (Number.isFinite(seed) ? Math.trunc(seed) : 1) >>> 0, difficulty: index, level: index + 1,
      levelName: level.name, levelNameEn: level.nameEn, tick: 0, elapsed: 0, timeLimit: level.close, closeTick: level.close * HZ,
      remaining: level.close, phase: 'playing', score: 0, lostReason: null, failure: null,
      selectedOrderId: 'O1', fanMode: 'fast', fanRateQ: -12, physics: clone(PHYSICS), strikeLimit: 2,
      deliveryOrder: level.sequence.slice(), nextOrderId: level.sequence[0], deliveredCount: 0, strikes: 0, discardedAttempts: 0, fanChangeCount: 0,
      orders: orders, stations: stations, taskCount: 0, taskStats: stats,
      taskStartReceipts: [], completionReceipts: [], collectionReceipts: [], disposalReceipts: [], deliveryReceipts: [], inventory: null, thermalLedger: null,
      commandCount: 0, lastOperation: null, actionReceipts: [], blockedCommands: 0, lastRejected: null,
      eventCount: 0, events: [], lastEvent: null, lastInterval: null,
      message: '左右选订单，A 按工序操作；B 切换冷却风速。按交付顺序与温度范围出餐',
      _accumulator: 0, _lastA: false, _lastB: false, _pendingA: false, _pendingB: false,
      _heldDirection: 0, _nextMoveTick: 0, _cancelEpoch: null };
    totals(s); return s;
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing') return s;
    input = input || {}; dt = Number.isFinite(dt) ? clamp(dt, 0, .25) : 0;
    var cancelled = !!input.cancelled;
    if (Number.isFinite(input.cancelEpoch)) {
      if (s._cancelEpoch !== null && s._cancelEpoch !== input.cancelEpoch) cancelled = true;
      s._cancelEpoch = input.cancelEpoch;
    }
    var a = !!input.a, b = !!input.b;
    if (cancelled) { s._pendingA = s._pendingB = false; s._heldDirection = 0; s._nextMoveTick = 0; }
    else {
      if ((a && !s._lastA) || input.aPressed) s._pendingA = true;
      if ((b && !s._lastB) || input.bPressed) s._pendingB = true;
    }
    s._lastA = a; s._lastB = b; s.events = []; s._accumulator += dt;
    var x = Number.isFinite(input.x) ? input.x : 0, dir = cancelled || Math.abs(x) <= .25 ? 0 : Math.sign(x);
    while (s._accumulator + 1e-10 >= DT && s.phase === 'playing') {
      s._accumulator = Math.max(0, s._accumulator - DT); tick(s, dir);
    }
    if (s.events.length > 256) s.events = s.events.slice(-256);
    return s;
  }
  return { create: create, step: step, TICK_HZ: HZ };
}));
