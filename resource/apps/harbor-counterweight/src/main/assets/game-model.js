(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 60, DEG = Math.PI / 180, X = [-3, -1, 1, 3];
  var PHYSICS = { baseMassT: 24, ballastMassT: 8, gravityMS2: 9.81, rollRadiusM: 3,
    metacentricHeightM: 2, dampingRatio: 0.68, tickHz: 60, craneSpeedMS: 3,
    liftTicks: 24, lowerTicks: 24, ballastSpeedMS: 1, ballastUnitsPerM: 60 };
  var LIMITS = { unsafeRollDegrees: 12, unsafeRollRad: 12 * DEG, unsafeConsecutiveTicks: 90,
    overboardRollDegrees: 24, overboardRollRad: 24 * DEG,
    departureMaximumRollDegrees: 3, departureMaximumRollRad: 3 * DEG,
    departureMaximumAngularVelocityDegreesS: 1, departureMaximumAngularVelocityRadS: DEG, departureStableTicks: 240 };
  var LEVELS = [
    { name: '日班靠港', nameEn: 'Day Shift', masses: [6, 3, 5, 4, 2, 6],
      load: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'], unload: ['C2', 'C5', 'C1', 'C4'], exports: ['C3', 'C6'], deadline: 4500 },
    { name: '交错转运', nameEn: 'Cross Transfer', masses: [5, 7, 4, 3, 6, 5],
      load: ['C3', 'C1', 'C5', 'C2', 'C6', 'C4'], unload: ['C1', 'C6', 'C3', 'C2'], exports: ['C4', 'C5'], deadline: 4800 },
    { name: '夜航重载', nameEn: 'Heavy Night Sailing', masses: [7, 4, 6, 5, 3, 7],
      load: ['C4', 'C1', 'C6', 'C2', 'C5', 'C3'], unload: ['C1', 'C5', 'C4', 'C2'], exports: ['C3', 'C6'], deadline: 5100 }
  ];
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function finite(v) { return typeof v === 'number' && Number.isFinite(v); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function requireFact(ok, message) { if (!ok) throw new Error(message); }
  function invalid() { throw new RangeError('Invalid ship mass configuration'); }
  function dense(array) {
    if (!Array.isArray(array)) return false;
    for (var n = 0; n < array.length; n++) if (!Object.prototype.hasOwnProperty.call(array, n)) return false;
    return true;
  }
  function measureShip(options) {
    if (!options || typeof options !== 'object') invalid();
    var cargo = options.cargo, stacks = options.stacks, units = options.ballastPositionUnits;
    if (!dense(cargo) || cargo.length > 6 || !dense(stacks) || stacks.length !== 4
        || !Number.isSafeInteger(units) || units < -180 || units > 180) invalid();
    var masses = new Map(), aboard = [], cargoMass = 0, cargoMoment = 0;
    cargo.forEach(function (c) {
      if (!c || typeof c.id !== 'string' || !c.id.length || masses.has(c.id) || !finite(c.massT) || c.massT <= 0) invalid();
      masses.set(c.id, c.massT);
    });
    stacks.forEach(function (stack, col) {
      if (!dense(stack) || stack.length > 2) invalid();
      stack.forEach(function (id) {
        if (!masses.has(id) || aboard.includes(id)) invalid();
        aboard.push(id); cargoMass += masses.get(id); cargoMoment += masses.get(id) * X[col];
        if (!finite(cargoMass) || !finite(cargoMoment)) invalid();
      });
    });
    var ballastXM = units / 60, ballastMoment = 8 * ballastXM;
    var m = 24 + 8 + cargoMass, j = ballastMoment + cargoMoment, i = m * 3 * 3, k = m * 9.81 * 2;
    var ik = i * k, c = (2 * 0.68) * Math.sqrt(ik), g = 9.81 * j;
    if (![m, j, i, k, ik, c, g, j / m].every(finite)) invalid();
    return { aboardIds: aboard, aboardCargoMassT: cargoMass, massT: m, firstMomentTM: j,
      centerOfMassXM: j / m, inertiaTM2: i, restoringKNmPerRad: k, dampingKNmSPerRad: c, gravityTorqueKNm: g };
  }
  function endpoint(location, column, tier) { return { location: location, column: location === 'ship' ? column : null, tier: location === 'ship' ? tier : null }; }
  function idleCrane() {
    return { idle: true, jobId: null, taskId: null, type: null, cargoId: null, column: null, tier: null,
      source: null, destination: null, startedFromTick: null, startedAtTick: null, stage: null, stageIndex: null,
      stageFromTick: null, stageElapsedTicks: 0, stageDurationTicks: 0, stageProgress: 0,
      jobElapsedTicks: 0, jobTotalTicks: 0, travelTicks: 0, carriedId: null, railXM: -6 };
  }
  function ownership(s) { return clone({ shoreIds: s.shoreIds, stacks: s.stacks, hookId: s.hookId, deliveredIds: s.deliveredIds, overboardIds: s.overboardIds }); }
  function config(s) { return clone({ cursor: s.cursor, ballastPositionUnits: s.ballastPositionUnits, ballastTargetUnits: s.ballastTargetUnits, crane: s.crane }); }
  function massOf(s, id) { var row = s.cargo.find(function (c) { return c.id === id; }); requireFact(!!row, 'Unknown cargo'); return row.massT; }
  function refresh(s) {
    var locations = new Map(), counts = { shore: 0, ship: 0, hook: 0, delivered: 0, overboard: 0 };
    var totals = { shore: 0, ship: 0, hook: 0, delivered: 0, overboard: 0 };
    function add(id, location, col, tier) {
      requireFact(!locations.has(id), 'Cargo duplicated across locations');
      locations.set(id, endpoint(location, col, tier)); counts[location]++; totals[location] += massOf(s, id);
    }
    s.shoreIds.forEach(function (id) { add(id, 'shore'); });
    s.stacks.forEach(function (stack, col) { stack.forEach(function (id, tier) { add(id, 'ship', col, tier); }); });
    if (s.hookId !== null) add(s.hookId, 'hook');
    s.deliveredIds.forEach(function (id) { add(id, 'delivered'); }); s.overboardIds.forEach(function (id) { add(id, 'overboard'); });
    requireFact(locations.size === s.cargo.length, 'Cargo missing from inventory');
    s.cargo.forEach(function (row) { var loc = locations.get(row.id); requireFact(!!loc, 'Missing authored cargo'); Object.assign(row, loc); });
    var initial = s.cargo.reduce(function (n, row) { return n + row.massT; }, 0);
    var total = totals.shore + totals.ship + totals.hook + totals.delivered + totals.overboard;
    s.inventory = { initialCargoMassT: initial, shoreMassT: totals.shore, shipCargoMassT: totals.ship,
      hookMassT: totals.hook, deliveredMassT: totals.delivered, overboardMassT: totals.overboard,
      totalLocationMassT: total, errorT: total - initial, counts: counts, allIdsExactlyOnce: true };
    var old = s.ship || { rollRad: 0, angularVelocityRadS: 0 };
    s.ship = Object.assign(measureShip(s), { rollRad: old.rollRad, angularVelocityRadS: old.angularVelocityRadS });
    s.ballastXM = s.ballastPositionUnits / 60; s.ballastTargetXM = s.ballastTargetUnits / 60;
    s.loadQueueIndex = s.loadOrder.length - s.shoreIds.length;
    var index = s.tasks.findIndex(function (task) { return task.status !== 'completed'; });
    s.currentTask = index < 0 ? null : clone(s.tasks[index]); s.nextTask = index < 0 || index + 1 === s.tasks.length ? null : clone(s.tasks[index + 1]);
    s.crane.carriedId = s.hookId;
  }
  function create(seed, difficulty) {
    difficulty = finite(difficulty) ? clamp(Math.floor(difficulty), 0, 2) : 0;
    seed = finite(seed) ? Math.trunc(seed) >>> 0 : 729;
    var level = LEVELS[difficulty];
    var s = { width: 960, height: 540, seed: seed, difficulty: difficulty, level: difficulty + 1,
      levelName: level.name, levelNameEn: level.nameEn, phase: 'playing', operationPhase: 'loading',
      tick: 0, elapsed: 0, deadlineTick: level.deadline, remaining: level.deadline / 60, score: 0, lostReason: null, failures: [],
      physics: clone(PHYSICS), limits: clone(LIMITS), columnXM: X.slice(), maximumStackHeight: 2, shoreXM: -6, cursor: 0,
      loadOrder: level.load.slice(), unloadOrder: level.unload.slice(), exportIds: level.exports.slice(),
      cargo: level.masses.map(function (mass, n) { return { id: 'C' + (n + 1), massT: mass, location: 'shore', column: null, tier: null }; }),
      shoreIds: level.load.slice(), stacks: [[], [], [], []], hookId: null, deliveredIds: [], overboardIds: [],
      loadQueueIndex: 0, loadJobsCompleted: 0, unloadJobsCompleted: 0, tasks: [], currentTask: null, nextTask: null,
      ballastPositionUnits: 0, ballastTargetUnits: 0, ballastXM: 0, ballastTargetXM: 0,
      ship: null, inventory: null, crane: idleCrane(), unsafeTicks: 0, maxUnsafeTicks: 0, peakAbsRollRad: 0, stableTicks: 0,
      commandCount: 0, blockedCommands: 0, navigationCount: 0, ballastTargetChangeCount: 0, jobsStarted: 0, jobsCompleted: 0,
      commandReceipts: [], blockedReceipts: [], navigationReceipts: [], targetChangeReceipts: [], jobStartReceipts: [],
      jobCompletionReceipts: [], craneStageReceipts: [], transferReceipts: [], eventCount: 0, events: [], lastEvent: null,
      lastOperation: null, lastInput: null, lastInterval: null,
      inputState: { cancelEpoch: 0, quarantined: false, aArmed: true, bArmed: true, navigationDirection: null, navigationHeldTicks: 0 },
      message: '选择货位，按 A 启动吊机；按 B 移动配重' };
    ['load', 'unload'].forEach(function (type) {
      (type === 'load' ? s.loadOrder : s.unloadOrder).forEach(function (id, n) {
        s.tasks.push({ id: type + '-' + (n + 1), index: s.tasks.length, type: type, orderIndex: n, cargoId: id,
          massT: massOf(s, id), status: 'pending', jobId: null, column: null, startedAtTick: null, completedAtTick: null });
      });
    });
    refresh(s); return s;
  }
  function event(s, fromTick, type, refs) {
    var row = Object.assign({ id: ++s.eventCount, type: type, fromTick: fromTick, tick: fromTick + 1 }, refs);
    s.events.push(row); s.lastEvent = clone(row); return row.id;
  }
  function receipt(s, fromTick, array, type, refKey, body, extraRefs) {
    var id = s[array].length + 1, refs = {}; refs[refKey] = id; Object.assign(refs, extraRefs || {});
    var row = Object.assign({ id: id, eventSeq: event(s, fromTick, type, refs), fromTick: fromTick, tick: fromTick + 1 }, clone(body));
    s[array].push(row); return row;
  }
  function stagePlan(type, d) {
    return (type === 'load' ? [['lift-shore', 24], ['carry-to-ship', d], ['lower-ship', 24], ['return-shore', d]]
      : [['approach-ship', d], ['lift-ship', 24], ['carry-to-shore', d], ['lower-shore', 24]])
      .map(function (row, n) { return { stage: row[0], index: n, durationTicks: row[1] }; });
  }
  function requestJob(s, t) {
    var before = config(s), task = s.tasks.find(function (row) { return row.status !== 'completed'; });
    var stack = s.stacks[s.cursor], top = stack.length ? stack[stack.length - 1] : null, reason = null;
    if (!s.crane.idle) reason = 'crane-busy';
    else if (!task) reason = 'task-complete';
    else if (task.type === 'load' && stack.length >= 2) reason = 'load-full';
    else if (task.type === 'unload') {
      if (!stack.length) reason = 'empty-column';
      else if (top !== task.cargoId) reason = stack.includes(task.cargoId) ? 'required-covered' : 'wrong-column';
    }
    if (reason) {
      var blocked = receipt(s, t, 'blockedReceipts', 'blocked', 'blockedId', { inputKey: 'a', reason: reason,
        expectedCargoId: task ? task.cargoId : null, actualTopId: top, column: s.cursor, before: before, after: config(s) });
      s.blockedCommands++; s.lastInput.blockedIds.push(blocked.id);
      s.message = { 'crane-busy': '吊机正在作业，请稍候', 'task-complete': '装卸已完成，请保持船体稳定',
        'load-full': '这个货位已经装满', 'empty-column': '这个货位没有货物', 'required-covered': '所需货物被上层货物压住', 'wrong-column': '请选择当前所需货物所在的货位' }[reason];
      return;
    }
    var col = s.cursor, d = Math.abs(X[col] + 6) * 60 / 3, plan = stagePlan(task.type, d), jobId = s.jobsStarted + 1;
    var tier = task.type === 'load' ? stack.length : stack.length - 1;
    var job = { jobId: jobId, taskId: task.id, type: task.type, cargoId: task.cargoId, column: col, tier: tier,
      source: endpoint(task.type === 'load' ? 'shore' : 'ship', col, tier), destination: endpoint(task.type === 'load' ? 'ship' : 'shore', col, tier),
      startedFromTick: t, startedAtTick: t + 1, travelTicks: d, jobTotalTicks: 2 * d + 48, stages: plan };
    s.crane = Object.assign(idleCrane(), clone(job), { idle: false, stage: plan[0].stage, stageIndex: 0,
      stageFromTick: t, stageDurationTicks: plan[0].durationTicks });
    delete s.crane.stages;
    task.status = 'active'; task.jobId = jobId; task.column = col; task.startedAtTick = t + 1;
    var command = receipt(s, t, 'commandReceipts', 'command', 'commandId', { inputKey: 'a', action: 'request-' + task.type,
      before: before, after: config(s), jobId: jobId, targetChangeId: null });
    s.commandCount++; s.jobsStarted++; s.lastOperation = clone(command); s.lastInput.commandIds.push(command.id);
    receipt(s, t, 'jobStartReceipts', 'job-start', 'jobId', { commandId: command.id, job: job });
    s.message = task.type === 'load' ? '吊机开始装船' : '吊机开始卸货';
  }
  function retarget(s, t) {
    var before = config(s), oldTarget = s.ballastTargetUnits, selected = X[s.cursor] * 60;
    s.ballastTargetUnits = selected === oldTarget ? 0 : selected;
    var targetId = s.targetChangeReceipts.length + 1;
    var command = receipt(s, t, 'commandReceipts', 'command', 'commandId', { inputKey: 'b', action: 'retarget-ballast', before: before,
      after: config(s), jobId: null, targetChangeId: targetId });
    receipt(s, t, 'targetChangeReceipts', 'target-change', 'targetChangeId', { commandId: command.id, column: s.cursor,
      beforeTargetUnits: oldTarget, afterTargetUnits: s.ballastTargetUnits, actualPositionUnits: s.ballastPositionUnits });
    s.commandCount++; s.ballastTargetChangeCount++; s.lastOperation = clone(command); s.lastInput.commandIds.push(command.id);
    s.message = s.ballastTargetUnits === 0 ? '配重正在归中' : '配重正在移向所选货位';
  }
  function inputStep(s, t, input) {
    input = input && typeof input === 'object' ? input : {};
    var latch = s.inputState, x = finite(input.x) ? clamp(input.x, -1, 1) : 0;
    var a = !!(input.a || input.aPressed), b = !!(input.b || input.bPressed);
    var epoch = Number.isSafeInteger(input.cancelEpoch) && input.cancelEpoch >= 0 ? input.cancelEpoch : latch.cancelEpoch;
    var cancelled = !!input.cancelled || epoch !== latch.cancelEpoch;
    var li = s.lastInput = { fromTick: t, tick: t + 1, sample: { x: x, aDown: a, bDown: b, cancelled: !!input.cancelled, cancelEpoch: epoch },
      cancelled: cancelled, quarantinedBefore: latch.quarantined, quarantinedAfter: latch.quarantined, quarantineReleased: false,
      freshA: false, freshB: false, navigationEligible: false, navigationSuppressed: false, navigationAttempt: null,
      commandIds: [], blockedIds: [], navigationIds: [], before: config(s), after: null };
    latch.cancelEpoch = epoch;
    if (cancelled) { latch.quarantined = true; latch.aArmed = false; latch.bArmed = false; latch.navigationDirection = null; latch.navigationHeldTicks = 0; }
    else if (latch.quarantined) {
      if (Math.abs(x) <= 0.25 && !a && !b) {
        latch.quarantined = false; latch.aArmed = true; latch.bArmed = true; li.quarantineReleased = true;
      }
    } else {
      li.freshA = a && latch.aArmed; li.freshB = b && latch.bArmed;
      latch.aArmed = !a; latch.bArmed = !b;
      var direction = Math.abs(x) <= 0.25 ? null : x < 0 ? 'left' : 'right';
      if (direction === null) { latch.navigationDirection = null; latch.navigationHeldTicks = 0; }
      else { latch.navigationHeldTicks = direction === latch.navigationDirection ? latch.navigationHeldTicks + 1 : 1; latch.navigationDirection = direction; }
      var age = latch.navigationHeldTicks;
      li.navigationEligible = direction !== null && (age === 1 || (age >= 20 && age % 10 === 0));
      li.navigationSuppressed = li.freshB && li.navigationEligible;
      if (li.freshB) retarget(s, t);
      else {
        if (li.navigationEligible) {
          var prior = s.cursor; s.cursor = clamp(prior + (direction === 'left' ? -1 : 1), 0, 3);
          li.navigationAttempt = { direction: direction, heldTicks: age, mode: age === 1 ? 'initial' : 'repeat', beforeCursor: prior, afterCursor: s.cursor };
          if (prior !== s.cursor) {
            var nav = receipt(s, t, 'navigationReceipts', 'navigate', 'navigationId', li.navigationAttempt);
            s.navigationCount++; li.navigationIds.push(nav.id);
          }
        }
        if (li.freshA) requestJob(s, t);
      }
    }
    li.quarantinedAfter = latch.quarantined; li.after = config(s);
  }
  function transfer(s, t, boundary, id, from, to, jobId) {
    var before = ownership(s), mass = massOf(s, id);
    if (from.location === 'shore') { requireFact(s.shoreIds[0] === id, 'Shore queue head changed'); s.shoreIds.shift(); }
    else if (from.location === 'ship') { requireFact(s.stacks[from.column][from.tier] === id && s.stacks[from.column].length === from.tier + 1, 'Crane source must remain top'); s.stacks[from.column].pop(); }
    else { requireFact(from.location === 'hook' && s.hookId === id, 'Hook ownership mismatch'); s.hookId = null; }
    if (to.location === 'hook') { requireFact(s.hookId === null, 'Hook already occupied'); s.hookId = id; }
    else if (to.location === 'ship') { requireFact(s.stacks[to.column].length === to.tier && to.tier < 2, 'Destination tier changed'); s.stacks[to.column].push(id); }
    else if (to.location === 'delivered') s.deliveredIds.push(id);
    else { requireFact(to.location === 'overboard', 'Invalid transfer destination'); s.overboardIds.push(id); }
    var body = { jobId: jobId, boundary: boundary, cargoId: id, massT: mass, from: from, to: to, before: before, after: ownership(s) };
    if (boundary === 'overboard') body.activeJobId = s.crane.jobId;
    return receipt(s, t, 'transferReceipts', 'cargo-transfer', 'transferReceiptId', body);
  }
  function rail(crane) {
    var p = crane.stageElapsedTicks / crane.stageDurationTicks, x = X[crane.column];
    if (crane.stage === 'lift-shore' || crane.stage === 'lower-shore') return -6;
    if (crane.stage === 'lift-ship' || crane.stage === 'lower-ship') return x;
    return crane.stage === 'carry-to-ship' || crane.stage === 'approach-ship' ? -6 + (x + 6) * p : x + (-6 - x) * p;
  }
  function advanceCrane(s, t) {
    var c = s.crane, out = { beforeAdvance: clone(c), advancedStage: null, afterAdvance: null, stageReceiptIds: [], transferReceiptIds: [], jobCompletionReceiptIds: [] };
    if (!c.idle) {
      var oldElapsed = c.stageElapsedTicks; c.stageElapsedTicks++; c.jobElapsedTicks++;
      c.stageProgress = c.stageElapsedTicks / c.stageDurationTicks; c.railXM = rail(c);
      var done = c.stageElapsedTicks === c.stageDurationTicks, allDone = done && c.stageIndex === 3;
      out.advancedStage = { jobId: c.jobId, stage: c.stage, stageIndex: c.stageIndex, stageFromTick: c.stageFromTick,
        elapsedBefore: oldElapsed, elapsedAfter: c.stageElapsedTicks, durationTicks: c.stageDurationTicks, completed: done };
      if (done) {
        var plan = stagePlan(c.type, c.travelTicks), next = allDone ? null : plan[c.stageIndex + 1];
        out.stageReceiptIds.push(receipt(s, t, 'craneStageReceipts', 'crane-stage-complete', 'stageReceiptId', {
          jobId: c.jobId, type: c.type, cargoId: c.cargoId, stage: c.stage, stageIndex: c.stageIndex, stageFromTick: c.stageFromTick,
          durationTicks: c.stageDurationTicks, completedElapsedTicks: c.stageElapsedTicks, nextStage: next ? next.stage : null, jobComplete: allDone }).id);
        var tr = null;
        if (c.stage === 'lift-shore') tr = transfer(s, t, 'shore-pickup', c.cargoId, endpoint('shore'), endpoint('hook'), c.jobId);
        if (c.stage === 'lower-ship') tr = transfer(s, t, 'ship-deposit', c.cargoId, endpoint('hook'), endpoint('ship', c.column, c.tier), c.jobId);
        if (c.stage === 'lift-ship') tr = transfer(s, t, 'ship-pickup', c.cargoId, endpoint('ship', c.column, c.tier), endpoint('hook'), c.jobId);
        if (c.stage === 'lower-shore') tr = transfer(s, t, 'shore-delivery', c.cargoId, endpoint('hook'), endpoint('delivered'), c.jobId);
        if (tr) out.transferReceiptIds.push(tr.id);
        if (allDone) {
          var phaseBefore = s.operationPhase, task = s.tasks.find(function (row) { return row.id === c.taskId; });
          requireFact(!!task && task.status === 'active', 'Completing inactive task'); task.status = 'completed'; task.completedAtTick = t + 1;
          if (c.type === 'load') s.loadJobsCompleted++; else s.unloadJobsCompleted++;
          s.jobsCompleted++;
          if (s.loadJobsCompleted === 6) s.operationPhase = s.unloadJobsCompleted === 4 ? 'departure' : 'unloading';
          out.jobCompletionReceiptIds.push(receipt(s, t, 'jobCompletionReceipts', 'job-complete', 'jobCompletionId', {
            jobId: c.jobId, taskId: c.taskId, type: c.type, cargoId: c.cargoId, column: c.column, tier: c.tier,
            jobElapsedTicks: c.jobElapsedTicks, jobTotalTicks: c.jobTotalTicks, loadJobsCompleted: s.loadJobsCompleted,
            unloadJobsCompleted: s.unloadJobsCompleted, operationPhaseBefore: phaseBefore, operationPhaseAfter: s.operationPhase, ownership: ownership(s)
          }, { jobId: c.jobId }).id);
          s.crane = idleCrane(); s.message = s.operationPhase === 'departure' ? '装卸完成，请保持稳定准备离港' : '本次搬运完成，可以继续下一项';
        } else {
          c.stage = next.stage; c.stageIndex = next.index; c.stageFromTick = t + 1; c.stageElapsedTicks = 0;
          c.stageDurationTicks = next.durationTicks; c.stageProgress = 0; c.railXM = rail(c);
        }
      }
    }
    s.crane.carriedId = s.hookId; out.afterAdvance = clone(s.crane); return out;
  }
  function departureInventory(s) {
    return s.loadJobsCompleted === 6 && s.unloadJobsCompleted === 4 && s.shoreIds.length === 0 && s.hookId === null
      && s.crane.idle && s.crane.railXM === -6 && !s.overboardIds.length && s.ship.aboardIds.length === s.exportIds.length
      && s.exportIds.every(function (id) { return s.ship.aboardIds.includes(id); })
      && JSON.stringify(s.deliveredIds) === JSON.stringify(s.unloadOrder);
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing') return s;
    if (dt === 0) return s;
    if (!finite(dt) || Math.abs(dt - DT) > 1e-12) throw new RangeError('step requires one fixed 1/60 second interval');
    var t = s.tick, operationBefore = s.operationPhase, ballastBefore = s.ballastPositionUnits;
    var unsafeBefore = s.unsafeTicks, maxUnsafeBefore = s.maxUnsafeTicks, peakBefore = s.peakAbsRollRad, stableBefore = s.stableTicks;
    var transferCountBefore = s.transferReceipts.length;
    s.events = []; inputStep(s, t, input);
    s.ballastPositionUnits += Math.sign(s.ballastTargetUnits - s.ballastPositionUnits);
    var crane = advanceCrane(s, t); refresh(s);
    var m = s.ship, theta = m.rollRad, omega = m.angularVelocityRadS;
    var alpha = (m.gravityTorqueKNm - m.restoringKNmPerRad * theta - m.dampingKNmSPerRad * omega) / m.inertiaTM2;
    var omegaNext = omega + alpha / 60, thetaNext = theta + omegaNext / 60;
    var roll = { aboardIds: m.aboardIds.slice(), aboard: [], ballastXM: s.ballastXM, massT: m.massT,
      firstMomentTM: m.firstMomentTM, centerOfMassXM: m.centerOfMassXM, inertiaTM2: m.inertiaTM2,
      restoringKNmPerRad: m.restoringKNmPerRad, dampingKNmSPerRad: m.dampingKNmSPerRad, gravityTorqueKNm: m.gravityTorqueKNm,
      thetaBeforeRad: theta, omegaBeforeRadS: omega, alphaRadS2: alpha, omegaAfterRadS: omegaNext, thetaAfterRad: thetaNext };
    s.stacks.forEach(function (stack, col) { stack.forEach(function (id, tier) { roll.aboard.push({ id: id, massT: massOf(s, id), column: col, tier: tier, columnXM: X[col] }); }); });
    m.rollRad = thetaNext; m.angularVelocityRadS = omegaNext; s.tick = t + 1; s.elapsed = s.tick / 60; s.remaining = (s.deadlineTick - s.tick) / 60;
    var abs = Math.abs(thetaNext), unsafe = abs > LIMITS.unsafeRollRad;
    s.unsafeTicks = unsafe ? unsafeBefore + 1 : 0; s.maxUnsafeTicks = Math.max(maxUnsafeBefore, s.unsafeTicks); s.peakAbsRollRad = Math.max(peakBefore, abs);
    var spillEligible = abs >= LIMITS.overboardRollRad && m.aboardIds.length > 0, spill = null, failures = [];
    if (spillEligible) {
      var columns = thetaNext > 0 ? [3, 2, 1, 0] : [0, 1, 2, 3];
      var col = columns.find(function (n) { return s.stacks[n].length > 0; }), tier = s.stacks[col].length - 1, id = s.stacks[col][tier];
      spill = transfer(s, t, 'overboard', id, endpoint('ship', col, tier), endpoint('overboard'), null);
      failures.push({ kind: 'overboard', fromTick: t, tick: s.tick, actualValue: abs, limitValue: LIMITS.overboardRollRad, unit: 'rad',
        signedRollRad: thetaNext, cargoId: id, column: col, tier: tier, massT: spill.massT, transferReceiptId: spill.id });
      refresh(s);
    }
    if (s.unsafeTicks >= LIMITS.unsafeConsecutiveTicks) failures.push({ kind: 'sustained-heel', fromTick: t, tick: s.tick,
      actualValue: s.unsafeTicks, limitValue: LIMITS.unsafeConsecutiveTicks, unit: 'ticks', signedRollRad: thetaNext, unsafeThresholdRad: LIMITS.unsafeRollRad });
    if (s.tick >= s.deadlineTick) failures.push({ kind: 'deadline', fromTick: t, tick: s.tick, actualValue: s.tick, limitValue: s.deadlineTick, unit: 'ticks' });
    var inventoryValid = departureInventory(s), angleOK = abs <= LIMITS.departureMaximumRollRad;
    var velocityOK = Math.abs(omegaNext) <= LIMITS.departureMaximumAngularVelocityRadS, ballastOK = s.ballastPositionUnits === s.ballastTargetUnits;
    var eligible = s.operationPhase === 'departure' && inventoryValid && angleOK && velocityOK && ballastOK;
    var terminal = null;
    if (failures.length) {
      s.phase = 'lost'; s.lostReason = failures[0].kind; s.failures = clone(failures); terminal = { phase: 'lost', reason: s.lostReason };
      s.message = { overboard: '货物落水，本次离港失败', 'sustained-heel': '船体持续倾斜，本次离港失败', deadline: '港口作业超时' }[s.lostReason];
      event(s, t, 'loss', { reason: s.lostReason });
    } else {
      if (s.operationPhase === 'departure') requireFact(inventoryValid, 'Departure cargo invariant violated');
      s.stableTicks = eligible ? stableBefore + 1 : 0;
      if (s.stableTicks >= LIMITS.departureStableTicks) {
        s.phase = 'won'; s.score = 1000 + 2 * Math.floor((s.deadlineTick - s.tick) / 60) + 100 - Math.min(100, s.blockedCommands);
        s.message = '货物安全交接，船舶稳定离港'; terminal = { phase: 'won', reason: null }; event(s, t, 'win', { score: s.score });
      }
    }
    s.lastInterval = { fromTick: t, tick: s.tick, seconds: DT, operationPhaseBefore: operationBefore, operationPhaseAfterCrane: s.operationPhase,
      inputCommandIds: s.lastInput.commandIds.slice(), blockedInputIds: s.lastInput.blockedIds.slice(),
      ballast: { beforeUnits: ballastBefore, targetUnits: s.ballastTargetUnits, afterUnits: s.ballastPositionUnits,
        deltaUnits: s.ballastPositionUnits - ballastBefore, beforeXM: ballastBefore / 60, targetXM: s.ballastTargetUnits / 60, afterXM: s.ballastPositionUnits / 60 },
      crane: crane, roll: roll, safety: { absoluteRollRad: abs, unsafe: unsafe, unsafeTicksBefore: unsafeBefore, unsafeTicksAfter: s.unsafeTicks,
        maxUnsafeTicksBefore: maxUnsafeBefore, maxUnsafeTicksAfter: s.maxUnsafeTicks, peakAbsRollRadBefore: peakBefore, peakAbsRollRadAfter: s.peakAbsRollRad,
        overboardEligible: spillEligible, overboardTransferId: spill ? spill.id : null },
      departure: { eligible: eligible, inventoryValid: inventoryValid, angleWithinLimit: angleOK, velocityWithinLimit: velocityOK, ballastAtTarget: ballastOK,
        stableTicksBefore: stableBefore, stableTicksAfter: s.stableTicks, blockedByFailure: failures.length > 0 },
      transferReceiptIds: s.transferReceipts.slice(transferCountBefore).map(function (row) { return row.id; }), failures: clone(failures), terminal: terminal };
    return s;
  }
  return { create: create, step: step, measureShip: measureShip };
}));
