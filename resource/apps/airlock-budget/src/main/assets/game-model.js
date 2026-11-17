(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var HZ = 60, DT = 1 / HZ, EPS = 1e-9;
  // Public equipment and deadlines. No control schedule or private design witness.
  var LEVELS = [
    { name: '抢修撤离', nameEn: 'REPAIR WATCH', oxygen: 48, capacity: 58, floor: 20, deadlines: [18, 42, 68] },
    { name: '医疗优先', nameEn: 'MEDICAL FIRST', oxygen: 54, capacity: 64, floor: 20, deadlines: [42, 68, 12] },
    { name: '满罐困局', nameEn: 'FULL RESERVOIR', oxygen: 48, capacity: 48, floor: 24, deadlines: [40, 66, 89] }
  ];
  var GROUPS = [
    { id: 'G1', name: '工程队', nameEn: 'ENGINEERS', people: 2, breathingRate: .14 },
    { id: 'G2', name: '勘测队', nameEn: 'SURVEYORS', people: 2, breathingRate: .10 },
    { id: 'G3', name: '医疗组', nameEn: 'MEDIC', people: 1, breathingRate: .08 }
  ];
  var SELECTIONS = ['G1', 'G2', 'G3', 'leak'];
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function finite(value, fallback) { return Number.isFinite(value) ? value : fallback; }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function emit(s, type, details) {
    var event = Object.assign({}, details || {}, { id: ++s.eventCount, type: type, tick: s.tick, at: s.elapsed });
    s.events.push(event); s.lastEvent = copy(event); return event;
  }
  function score(s) {
    s.evacuatedCount = s.groups.filter(function (g) { return g.evacuated; }).length;
    s.score = 300 * s.evacuatedCount + (s.phase === 'won' ? 1000 + 10 * Math.floor(s.tank.oxygen + EPS) : 0);
  }
  function finish(s, reason, ids) {
    s.phase = reason ? 'lost' : 'won'; s.lostReason = reason || null;
    s.failure = reason ? { reason: reason, groupIds: ids || [], tick: s.tick, tankOxygen: s.tank.oxygen } : null;
    s.message = !reason ? '全员抵达安全舱，漏点封堵完成，储氧达到任务底线'
      : reason === 'oxygen' ? '供氧不足，仍有人员未能抵达安全舱'
      : reason === 'deadline' ? '撤离超时：有人员错过自己的安全期限'
      : reason === 'reserve' ? '全员已撤离，但最终罐内储氧低于任务底线'
      : reason === 'pressure' ? '气闸压力或门互锁不安全'
      : '值守时间结束，撤离或封堵尚未完成';
    score(s); emit(s, s.phase, { reason: s.lostReason, groupIds: ids || [] });
  }
  function updatePressure(s) { s.chambers.A.pressure = s.chambers.A.air / s.chambers.A.capacity; }
  function door(s, name, open) {
    var a = s.chambers.A, other = name === 'B' ? a.doorCOpen : a.doorBOpen;
    var legal = !open || (!other && (name === 'B' ? a.air <= EPS : a.capacity - a.air <= EPS));
    if (!legal) { emit(s, 'interlock-rejected', { door: name, pressure: a.pressure }); finish(s, 'pressure'); return false; }
    var field = name === 'B' ? 'doorBOpen' : 'doorCOpen';
    if (a[field] !== open) {
      emit(s, 'door', { door: name, open: open, pressure: a.pressure, otherOpen: other, air: a.air }); a[field] = open;
    }
    return true;
  }
  function changeStage(s, phase) {
    var t = s.task, previous = t.phase; t.phase = phase; t.phaseTicks = 0;
    emit(s, 'stage', { taskId: t.id, from: previous, to: phase });
  }
  function completeTask(s) {
    var t = s.task;
    t.completedTick = s.tick; s.completedTasks.push(copy(t));
    emit(s, 'task-complete', { taskId: t.id, kind: t.kind, groupId: t.groupId }); s.task = null;
  }
  function acknowledge(s, type, fields) {
    s.commandCount++;
    s.lastOperation = Object.assign({ id: s.commandCount, type: type, tick: s.tick, at: s.elapsed }, fields || {});
    emit(s, 'command', Object.assign({}, fields || {}, { commandId: s.commandCount, operation: type }));
  }
  function blocked(s, reason) { s.blockedCommands++; emit(s, 'blocked', { reason: reason }); }
  function operate(s, button) {
    if (s.task) {
      if (button === 'b' && !s.task.stopped) {
        s.task.stopped = true; acknowledge(s, 'stop', { taskId: s.task.id });
      } else if (button === 'a' && s.task.stopped) {
        s.task.stopped = false; acknowledge(s, 'resume', { taskId: s.task.id });
      } else blocked(s, 'task-busy');
      return;
    }
    if (button === 'b') {
      s.modeSelection = s.modeSelection === 'recover' ? 'vent' : 'recover';
      acknowledge(s, 'mode', { mode: s.modeSelection }); return;
    }
    if (s.selectedId === 'leak' && s.leak.isolated) { blocked(s, 'already-isolated'); return; }
    var group = s.groups.find(function (g) { return g.id === s.selectedId; });
    if (group && (group.location !== 'B' || group.evacuated)) { blocked(s, 'group-unavailable'); return; }
    var kind = s.selectedId === 'leak' ? 'isolate' : 'batch';
    s.task = { id: ++s.taskCount, kind: kind, groupId: group ? group.id : null,
      mode: kind === 'batch' ? s.modeSelection : null, phase: kind === 'batch' ? s.modeSelection : 'isolate',
      stopped: false, startedTick: s.tick, phaseTicks: 0, totalTicks: 0,
      recovered: 0, vented: 0, filled: 0, recoveryLoss: 0, capacityLimitedTicks: 0 };
    acknowledge(s, 'start', { taskId: s.task.id, kind: kind, groupId: s.task.groupId, mode: s.task.mode });
    emit(s, 'task-start', { taskId: s.task.id, kind: kind, groupId: s.task.groupId, mode: s.task.mode, phase: s.task.phase });
  }
  function direction(input) {
    var x = clamp(finite(input.x, 0), -1, 1), y = clamp(finite(input.y, 0), -1, 1);
    if (Math.max(Math.abs(x), Math.abs(y)) < .25) return null;
    return Math.abs(x) >= Math.abs(y) ? (x > 0 ? 1 : -1) : (y > 0 ? 1 : -1);
  }
  function navigate(s, delta) {
    var before = s.selectedId, index = clamp(SELECTIONS.indexOf(before) + delta, 0, SELECTIONS.length - 1);
    s.selectedId = SELECTIONS[index]; emit(s, 'select', { before: before, after: s.selectedId });
  }
  function transferTask(s, flow) {
    var t = s.task, a = s.chambers.A, tank = s.tank, p = s.physics;
    if (!t || t.stopped) return;
    t.phaseTicks++; t.totalTicks++;
    if (t.phase === 'recover') {
      var requested = Math.min(a.air, p.recoveryRate * DT);
      var room = Math.max(0, tank.capacity - tank.oxygen) / p.recoveryEfficiency;
      var removed = Math.min(requested, room), returned = removed * p.recoveryEfficiency;
      if (removed < requested - EPS) { t.capacityLimitedTicks++; s.capacityLimitedTicks++; }
      a.air = Math.max(0, a.air - removed); tank.oxygen = Math.min(tank.capacity, tank.oxygen + returned);
      t.recovered += returned; t.recoveryLoss += removed - returned;
      s.ledger.recoveredTransferred += returned; s.ledger.recoveryLoss += removed - returned;
      flow.recovered = returned; flow.recoveryLoss = removed - returned; flow.airRemoved = removed;
    } else if (t.phase === 'vent') {
      var vented = Math.min(a.air, p.ventRate * DT);
      a.air = Math.max(0, a.air - vented); t.vented += vented; s.ledger.vent += vented; flow.vented = vented;
    } else if (t.phase === 'fill') {
      var filled = Math.min(Math.max(0, a.capacity - a.air), tank.oxygen, p.fillRate * DT);
      tank.oxygen = Math.max(0, tank.oxygen - filled); a.air = Math.min(a.capacity, a.air + filled);
      t.filled += filled; s.ledger.filledTransferred += filled; flow.filled = filled;
    }
    updatePressure(s);
  }
  function advanceTask(s) {
    var t = s.task, a = s.chambers.A, p = s.physics;
    if (!t || t.stopped) return;
    if ((t.phase === 'recover' || t.phase === 'vent') && a.air <= EPS) {
      if (door(s, 'B', true)) changeStage(s, 'load');
    } else if (t.phase === 'load' && t.phaseTicks >= p.loadTicks) {
      var entering = s.groups.find(function (g) { return g.id === t.groupId; });
      if (!a.doorBOpen || a.doorCOpen || a.air > EPS || entering.location !== 'B') { finish(s, 'pressure'); return; }
      entering.location = 'A'; a.groupId = entering.id;
      emit(s, 'migration', { groupId: entering.id, from: 'B', to: 'A' });
      door(s, 'B', false); changeStage(s, 'fill');
    } else if (t.phase === 'fill' && a.capacity - a.air <= EPS) {
      if (door(s, 'C', true)) changeStage(s, 'unload');
    } else if (t.phase === 'unload' && t.phaseTicks >= p.unloadTicks) {
      var leaving = s.groups.find(function (g) { return g.id === t.groupId; });
      if (!a.doorCOpen || a.doorBOpen || a.capacity - a.air > EPS || leaving.location !== 'A' || leaving.evacuated) { finish(s, 'pressure'); return; }
      leaving.location = 'C'; leaving.evacuated = true; leaving.arrivalTick = s.tick; a.groupId = null;
      emit(s, 'migration', { groupId: leaving.id, from: 'A', to: 'C' }); door(s, 'C', false); completeTask(s);
    } else if (t.phase === 'isolate' && t.phaseTicks >= s.leak.serviceTicks) {
      s.leak.isolated = true; s.leak.isolatedTick = s.tick;
      emit(s, 'isolation-complete', { taskId: t.id }); completeTask(s);
    }
  }
  function integrate(s) {
    var tank = s.tank, flow = { fromTick: s.tick - 1, toTick: s.tick, tankBefore: tank.oxygen,
      airBefore: s.chambers.A.air, breathing: 0, leak: 0, recovered: 0, recoveryLoss: 0,
      airRemoved: 0, vented: 0, filled: 0, groupBreathing: [], taskId: s.task ? s.task.id : null,
      taskPhase: s.task ? s.task.phase : null, taskStopped: s.task ? s.task.stopped : false };
    var shortage = [];
    var a = s.chambers.A;
    if ((a.doorBOpen && (a.doorCOpen || a.air > EPS)) || (a.doorCOpen && a.capacity - a.air > EPS)) {
      finish(s, 'pressure'); return;
    }
    // Device transfers, then leak, then shared proportional breathing. Migration
    // follows these fluxes so arrivals consume oxygen for their final interval.
    transferTask(s, flow);
    flow.leak = s.leak.isolated ? 0 : Math.min(tank.oxygen, s.leak.rate * DT);
    tank.oxygen = Math.max(0, tank.oxygen - flow.leak);
    var demand = s.groups.reduce(function (sum, g) { return sum + (g.evacuated ? 0 : g.breathingRate * DT); }, 0);
    flow.breathingDemand = demand; flow.breathing = Math.min(tank.oxygen, demand);
    var fraction = demand > 0 ? flow.breathing / demand : 1;
    s.groups.forEach(function (g) {
      var requested = g.evacuated ? 0 : g.breathingRate * DT, actual = requested * fraction;
      g.consumedOxygen += actual;
      flow.groupBreathing.push({ groupId: g.id, requested: requested, actual: actual, location: g.location });
      if (actual < requested - EPS) shortage.push(g.id);
    });
    tank.oxygen = Math.max(0, tank.oxygen - flow.breathing);
    s.ledger.breathing += flow.breathing; s.ledger.leak += flow.leak;
    advanceTask(s);
    flow.tankAfter = tank.oxygen; flow.airAfter = s.chambers.A.air;
    s.ledger.error = s.ledger.initialTotal - tank.oxygen - s.chambers.A.air
      - s.ledger.breathing - s.ledger.leak - s.ledger.vent - s.ledger.recoveryLoss;
    s.lastInterval = flow;
    if (s.phase !== 'playing') return;
    if (shortage.length) { finish(s, 'oxygen', shortage); return; }
    var late = s.groups.filter(function (g) { return !g.evacuated && s.tick >= g.deadlineTick; });
    if (late.length) { finish(s, 'deadline', late.map(function (g) { return g.id; })); return; }
    score(s);
    if (s.evacuatedCount === s.groups.length && s.leak.isolated) {
      finish(s, tank.oxygen + EPS < tank.reserveFloor ? 'reserve' : null); return;
    }
    if (s.tick >= s.timeLimit * HZ) { finish(s, 'timeout'); return; }
    s.message = !s.task ? '选择人员或漏点；B 切换回收 / 快排，A 执行'
      : s.task.stopped ? '设备已停止：耗氧、漏气与期限仍继续；A 继续原任务'
      : s.task.kind === 'isolate' ? '泵正驱动封堵阀：完成后才会停止漏气'
      : s.task.phase === 'recover' ? '正在回收气闸空气：储罐装满会限制回收速度'
      : s.task.phase === 'vent' ? '正在快速排气：排出的氧气无法回收'
      : s.task.phase === 'load' ? 'B 侧门开启：选定人员正在进入气闸'
      : s.task.phase === 'fill' ? 'B 侧门已关闭：共享泵正在给气闸充气'
      : 'C 侧门开启：人员抵达后才计为安全撤离';
  }
  function tick(s, dir) {
    s.tick++; s.elapsed = s.tick / HZ; s.remaining = Math.max(0, s.timeLimit - s.elapsed);
    if (dir === null) { s._heldDirection = null; s._nextMoveTick = 0; }
    if (s._pendingB) { s._pendingB = false; s._pendingA = false; operate(s, 'b'); }
    else {
      if (dir !== null) {
        if (dir !== s._heldDirection) { s._heldDirection = dir; s._nextMoveTick = s.tick + 20; navigate(s, dir); }
        else if (s.tick >= s._nextMoveTick) { s._nextMoveTick = s.tick + 10; navigate(s, dir); }
      }
      if (s._pendingA) { s._pendingA = false; operate(s, 'a'); }
    }
    integrate(s);
  }
  function create(seed, difficulty) {
    var d = clamp(Math.floor(finite(difficulty, 0)), 0, 2), level = LEVELS[d];
    return { width: 960, height: 540, seed: finite(seed, 1), difficulty: d, level: d + 1,
      levelName: level.name, levelNameEn: level.nameEn, phase: 'playing', tick: 0, elapsed: 0,
      timeLimit: 90, remaining: 90, score: 0, message: '方向选择批次或漏点；A 执行，B 回收 / 快排',
      lostReason: null, failure: null, selectedId: 'G1', modeSelection: 'recover',
      chambers: { B: { pressure: 0 }, A: { capacity: 12, air: 12, pressure: 1, doorBOpen: false, doorCOpen: false, groupId: null }, C: { pressure: 1 } },
      tank: { oxygen: level.oxygen, initialOxygen: level.oxygen, capacity: level.capacity, reserveFloor: level.floor },
      groups: GROUPS.map(function (g, i) { return Object.assign({}, g, { deadlineTick: level.deadlines[i] * HZ,
        location: 'B', evacuated: false, consumedOxygen: 0, arrivalTick: null }); }),
      physics: { recoveryRate: .75, recoveryEfficiency: .9, ventRate: 6, fillRate: 3, loadTicks: 120, unloadTicks: 120 },
      leak: { rate: .5, isolated: false, isolatedTick: null, serviceTicks: 180 },
      task: null, taskCount: 0, completedTasks: [], commandCount: 0, blockedCommands: 0,
      evacuatedCount: 0, capacityLimitedTicks: 0, eventCount: 0, events: [], lastEvent: null, lastOperation: null, lastInterval: null,
      ledger: { initialTotal: level.oxygen + 12, breathing: 0, leak: 0, vent: 0, recoveryLoss: 0, recoveredTransferred: 0, filledTransferred: 0, error: 0 },
      _accumulator: 0, _lastA: false, _lastB: false, _pendingA: false, _pendingB: false,
      _heldDirection: null, _nextMoveTick: 0, _cancelEpoch: null };
  }
  function step(s, dt, input) {
    if (!s || s.phase !== 'playing') return s;
    input = input || {}; dt = clamp(finite(dt, 0), 0, .25);
    var cancelled = !!input.cancelled;
    if (Number.isFinite(input.cancelEpoch)) {
      if (s._cancelEpoch !== null && s._cancelEpoch !== input.cancelEpoch) cancelled = true;
      s._cancelEpoch = input.cancelEpoch;
    }
    var a = !!input.a, b = !!input.b;
    if (cancelled) { s._pendingA = false; s._pendingB = false; s._heldDirection = null; s._nextMoveTick = 0; }
    else {
      if ((a && !s._lastA) || input.aPressed) s._pendingA = true;
      if ((b && !s._lastB) || input.bPressed) s._pendingB = true;
    }
    s._lastA = a; s._lastB = b; s.events = []; s._accumulator += dt;
    var dir = cancelled ? null : direction(input);
    while (s._accumulator + 1e-10 >= DT && s.phase === 'playing') {
      s._accumulator = Math.max(0, s._accumulator - DT); tick(s, dir);
    }
    if (s.events.length > 32) s.events = s.events.slice(-32);
    return s;
  }
  return { create: create, step: step, TICK_HZ: HZ };
}));
