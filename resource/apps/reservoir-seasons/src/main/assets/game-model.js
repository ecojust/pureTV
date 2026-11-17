(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 60, CATEGORY_NAMES = ['居民', '农田', '生态河流'], SEASON_NAMES = ['春', '夏', '秋', '冬'];
  var PHYSICS = { tickHz: 60, stepSeconds: DT, dtTolerance: 1e-12, allocationQuantumUnits: 5, releaseDurationTicks: 480,
    unitCubicMetres: 10000, targetDenominator: 100, drySeasonFailureCount: 2, axisThreshold: .45,
    navigationFirstRepeatTick: 24, navigationRepeatPeriodTicks: 12 };
  var LEVELS = [
    { name: '春汛入库', nameEn: 'Spring Catchment', capacity: 100, initial: 60, targets: [90, 80, 75], seasons: [
      [55, 5, [20, 15, 10], 10], [45, 10, [20, 30, 15], 10], [40, 10, [20, 25, 15], 10], [35, 5, [20, 10, 10], 10] ] },
    { name: '旱季留水', nameEn: 'Dry Season Reserve', capacity: 90, initial: 55, targets: [90, 60, 60], seasons: [
      [50, 5, [20, 20, 10], 10], [15, 15, [25, 30, 10], 15], [65, 5, [20, 20, 20], 10], [15, 10, [20, 15, 10], 10] ] },
    { name: '洪峰与冬储', nameEn: 'Flood and Winter', capacity: 80, initial: 40, targets: [90, 55, 65], seasons: [
      [70, 5, [20, 15, 15], 10], [10, 15, [20, 25, 10], 10], [90, 5, [25, 15, 20], 15], [30, 15, [25, 25, 15], 15] ] }
  ];
  var clone = function (value) { return JSON.parse(JSON.stringify(value)); };
  var sum = function (values) { return values.reduce(function (a, b) { return a + b; }, 0); };
  var finite = function (value) { return typeof value === 'number' && Number.isFinite(value); };
  var clamp = function (n, lo, hi) { return Math.max(lo, Math.min(hi, n)); };
  function need(ok, message) { if (!ok) throw new Error(message); }
  function clearNavigation(s) { s.inputState.navigationDirection = 0; s.inputState.navigationHeldTicks = 0; }
  function quarantine(s) {
    s.inputState.quarantined = true; s.inputState.aArmed = false; s.inputState.bArmed = false; clearNavigation(s);
  }
  function refresh(s) {
    [s.storedUnits, s.totalInflowUnits, s.totalEvaporationUnits, s.totalOverflowUnits].concat(s.deliveredUnits, s.planUnits, s.currentDeliveredUnits)
      .forEach(function (v) { need(Number.isSafeInteger(v) && v >= 0, 'Water quantities must remain nonnegative integers'); });
    need(s.storedUnits <= s.capacityUnits && s.planUnits.length === 3 && s.deliveredUnits.length === 3, 'Invalid reservoir or category count');
    s.planTotalUnits = sum(s.planUnits);
    s.reservedUndeliveredUnits = s.stage === 'planning' ? s.planTotalUnits : s.stage === 'releasing' ? sum(s.committedUnits) - sum(s.currentDeliveredUnits) : 0;
    s.unallocatedStoredUnits = s.storedUnits - s.reservedUndeliveredUnits;
    need(s.reservedUndeliveredUnits >= 0 && s.unallocatedStoredUnits >= 0, 'Reserved water remains part of the real reservoir');
    s.releaseSecondsRemaining = s.stage === 'releasing' ? (480 - s.releaseAgeTicks) / 60 : 0;
    s.annualTargetsMet = s.deliveredUnits.map(function (v, i) { return v * 100 >= s.annualDemandUnits[i] * s.minimumFulfillmentPercent[i]; });
    var delivered = sum(s.deliveredUnits), accounted = s.storedUnits + s.totalEvaporationUnits + s.totalOverflowUnits + delivered;
    var error = s.initialStorageUnits + s.totalInflowUnits - accounted;
    need(error === 0, 'Actual seasonal water conservation failed');
    s.inventory = { initialStorageUnits: s.initialStorageUnits, totalInflowUnits: s.totalInflowUnits,
      totalEvaporationUnits: s.totalEvaporationUnits, totalOverflowUnits: s.totalOverflowUnits, storedUnits: s.storedUnits,
      deliveredUnits: s.deliveredUnits.slice(), totalDeliveredUnits: delivered, totalAccountedUnits: accounted, balanceErrorUnits: error };
  }
  function enterSeason(s, index, atTick, isolate) {
    var rules = s.seasons[index], carry = s.storedUnits, evaporation = Math.min(rules.evaporationUnits, carry);
    var filled = carry - evaporation + rules.inflowUnits, overflow = Math.max(0, filled - s.capacityUnits);
    s.storedUnits = filled - overflow; s.totalEvaporationUnits += evaporation; s.totalInflowUnits += rules.inflowUnits; s.totalOverflowUnits += overflow;
    s.seasonEntries.push({ id: s.seasonEntries.length + 1, seasonIndex: index, atTick: atTick, carryInUnits: carry,
      requestedEvaporationUnits: rules.evaporationUnits, actualEvaporationUnits: evaporation, inflowUnits: rules.inflowUnits,
      overflowUnits: overflow, preparedStorageUnits: s.storedUnits });
    s.seasonIndex = index; s.stage = 'planning'; s.cursor = 0; s.planUnits = [0, 0, 0]; s.undoStack = [];
    s.committedUnits = null; s.currentDeliveredUnits = [0, 0, 0]; s.releaseAgeTicks = 0;
    if (isolate) quarantine(s);
    s.message = SEASON_NAMES[index] + '季预报已入账，请安排三方用水';
  }
  function create(seed, difficulty) {
    seed = finite(seed) ? Math.trunc(seed) >>> 0 : 730;
    difficulty = finite(difficulty) ? clamp(Math.floor(difficulty), 0, 2) : 0;
    var level = LEVELS[difficulty], s = { width: 960, height: 540, seed: seed, difficulty: difficulty, level: difficulty + 1,
      levelName: level.name, levelNameEn: level.nameEn, physics: clone(PHYSICS), phase: 'playing', stage: 'planning', tick: 0, elapsed: 0,
      score: 0, lostReason: null, failures: [], capacityUnits: level.capacity, initialStorageUnits: level.initial,
      minimumFulfillmentPercent: level.targets.slice(), annualDemandUnits: [0, 0, 0], seasons: [],
      seasonIndex: 0, completedSeasons: 0, cursor: 0, releaseAgeTicks: 0, releaseSecondsRemaining: 0,
      planUnits: [0, 0, 0], undoStack: [], committedUnits: null, currentDeliveredUnits: [0, 0, 0],
      storedUnits: level.initial, totalInflowUnits: 0, totalEvaporationUnits: 0, totalOverflowUnits: 0, deliveredUnits: [0, 0, 0],
      annualTargetsMet: [false, false, false], riverDryStreak: 0, planTotalUnits: 0, reservedUndeliveredUnits: 0, unallocatedStoredUnits: level.initial,
      seasonEntries: [], seasonLedgers: [], actionReceipts: [], commits: [], lastAction: null, lastInput: null, lastInterval: null, inventory: null,
      inputState: { cancelEpoch: 0, quarantined: false, aArmed: true, bArmed: true, navigationDirection: 0, navigationHeldTicks: 0 }, message: '' };
    s.seasons = level.seasons.map(function (row) { return { inflowUnits: row[0], evaporationUnits: row[1], demandUnits: row[2].slice(), residentFloorUnits: row[3] }; });
    s.annualDemandUnits = [0, 1, 2].map(function (i) { return sum(s.seasons.map(function (season) { return season.demandUnits[i]; })); });
    enterSeason(s, 0, 0, false); refresh(s); return s;
  }
  function action(s, t, key) {
    var kind = key === 'b' ? 'undo' : s.cursor === 3 ? 'commit' : 'add', planBefore = s.planUnits.slice(), depthBefore = s.undoStack.length;
    var storedBefore = s.storedUnits, reason = null, category = null, commitId = null;
    if (s.stage !== 'planning') reason = 'release-locked';
    else if (kind === 'undo') {
      if (!s.undoStack.length) reason = 'nothing-to-undo';
      else { category = s.undoStack.pop(); s.planUnits[category] -= 5; s.message = '已撤销最近一笔' + CATEGORY_NAMES[category] + '配水'; }
    } else if (kind === 'add') {
      category = s.cursor;
      if (s.planUnits[category] + 5 > s.seasons[s.seasonIndex].demandUnits[category]) reason = 'demand-full';
      else if (sum(s.planUnits) + 5 > s.storedUnits) reason = 'budget-short';
      else { s.planUnits[category] += 5; s.undoStack.push(category); s.message = CATEGORY_NAMES[category] + '计划增加 5 单位，尚未取水'; }
    } else {
      s.committedUnits = s.planUnits.slice(); s.undoStack = []; s.stage = 'releasing'; s.releaseAgeTicks = 0; clearNavigation(s);
      commitId = s.commits.length + 1;
      s.commits.push({ id: commitId, seasonIndex: s.seasonIndex, fromTick: t, tick: t + 1, plannedUnits: s.committedUnits.slice(),
        preparedStorageUnits: s.storedUnits, unallocatedUnits: s.storedUnits - sum(s.committedUnits) });
      s.message = SEASON_NAMES[s.seasonIndex] + '季计划已锁定，正在计量放水';
    }
    var row = { id: s.actionReceipts.length + 1, fromTick: t, tick: t + 1, seasonIndex: s.seasonIndex, key: key, kind: kind,
      accepted: reason === null, reason: reason, categoryIndex: category, cursor: s.cursor, planBefore: planBefore, planAfter: s.planUnits.slice(),
      undoDepthBefore: depthBefore, undoDepthAfter: s.undoStack.length, storedBefore: storedBefore, storedAfter: s.storedUnits, commitId: commitId };
    s.actionReceipts.push(row); s.lastAction = clone(row); s.lastInput.actionIds.push(row.id);
  }
  function inputStep(s, t, input) {
    input = input && typeof input === 'object' ? input : {};
    var latch = s.inputState, x = finite(input.x) ? clamp(input.x, -1, 1) : 0, y = finite(input.y) ? clamp(input.y, -1, 1) : 0;
    var a = input.a === true, b = input.b === true;
    var epoch = Number.isSafeInteger(input.cancelEpoch) && input.cancelEpoch >= 0 ? input.cancelEpoch : latch.cancelEpoch;
    var cancelled = input.cancelled === true || epoch !== latch.cancelEpoch;
    var li = s.lastInput = { x: x, y: y, a: a, b: b, cancelEpoch: epoch, cancelled: input.cancelled === true,
      quarantinedBefore: latch.quarantined, quarantinedAfter: latch.quarantined, neutralAcknowledged: false,
      actionIds: [], navigationApplied: 0, cursorBefore: s.cursor, cursorAfter: s.cursor };
    latch.cancelEpoch = epoch;
    if (cancelled) quarantine(s);
    else if (latch.quarantined) {
      if (Math.abs(x) < .45 && Math.abs(y) < .45 && !a && !b) {
        latch.quarantined = false; latch.aArmed = true; latch.bArmed = true; clearNavigation(s); li.neutralAcknowledged = true;
      }
    } else {
      var freshA = a && latch.aArmed, freshB = b && latch.bArmed; latch.aArmed = !a; latch.bArmed = !b;
      if (freshB) { clearNavigation(s); action(s, t, 'b'); }
      else {
        if (s.stage === 'planning') {
          var direction = x >= .45 ? 1 : x <= -.45 ? -1 : 0;
          if (!direction) clearNavigation(s);
          else {
            latch.navigationHeldTicks = direction === latch.navigationDirection ? latch.navigationHeldTicks + 1 : 1; latch.navigationDirection = direction;
            var age = latch.navigationHeldTicks;
            if (age === 1 || (age >= 24 && age % 12 === 0)) { var before = s.cursor; s.cursor = clamp(s.cursor + direction, 0, 3); li.navigationApplied = s.cursor - before; }
          }
        } else clearNavigation(s);
        if (freshA) action(s, t, 'a');
      }
    }
    li.cursorAfter = s.cursor;
  }
  function finishSeason(s, t) {
    var index = s.seasonIndex, rules = s.seasons[index], entry = s.seasonEntries[s.seasonEntries.length - 1], commit = s.commits[s.commits.length - 1];
    need(s.currentDeliveredUnits.every(function (v, i) { return v === commit.plannedUnits[i]; }), 'Final metered delivery differs from the actual locked plan');
    var dryBefore = s.riverDryStreak, dryAfter = s.currentDeliveredUnits[2] === 0 ? dryBefore + 1 : 0;
    var floorMet = s.currentDeliveredUnits[0] >= rules.residentFloorUnits;
    var ledger = { id: s.seasonLedgers.length + 1, seasonIndex: index, entryId: entry.id, commitId: commit.id, commitFromTick: commit.fromTick,
      completedAtTick: t + 1, carryInUnits: entry.carryInUnits, inflowUnits: entry.inflowUnits,
      requestedEvaporationUnits: entry.requestedEvaporationUnits, actualEvaporationUnits: entry.actualEvaporationUnits,
      overflowUnits: entry.overflowUnits, preparedStorageUnits: entry.preparedStorageUnits, plannedUnits: commit.plannedUnits.slice(),
      deliveredUnits: s.currentDeliveredUnits.slice(), carryOutUnits: s.storedUnits, demandUnits: rules.demandUnits.slice(), residentFloorUnits: rules.residentFloorUnits,
      residentFloorMet: floorMet, riverDryStreakBefore: dryBefore, riverDryStreakAfter: dryAfter,
      balanceErrorUnits: entry.carryInUnits + entry.inflowUnits - entry.actualEvaporationUnits - entry.overflowUnits - sum(s.currentDeliveredUnits) - s.storedUnits };
    need(ledger.balanceErrorUnits === 0 && ledger.completedAtTick === commit.fromTick + 480, 'Season ledger must describe exactly 480 real release intervals');
    s.seasonLedgers.push(ledger); s.completedSeasons++; s.riverDryStreak = dryAfter;
    var failures = [];
    if (!floorMet) failures.push({ kind: 'resident-floor', seasonIndex: index, tick: t + 1, categoryIndex: 0,
      actualValue: s.currentDeliveredUnits[0], limitValue: rules.residentFloorUnits, unit: 'water-units' });
    if (dryAfter >= 2) failures.push({ kind: 'river-dry-streak', seasonIndex: index, tick: t + 1, categoryIndex: 2,
      actualValue: dryAfter, limitValue: 2, unit: 'seasons' });
    if (index === 3) s.deliveredUnits.forEach(function (value, category) {
      var actual = value * 100, target = s.annualDemandUnits[category] * s.minimumFulfillmentPercent[category];
      if (actual < target) failures.push({ kind: 'annual-target', seasonIndex: index, tick: t + 1, categoryIndex: category,
        actualValue: actual, limitValue: target, unit: 'water-percent-product' });
    });
    if (failures.length) {
      s.failures = failures; s.lostReason = failures[0].kind; s.phase = 'lost'; s.stage = 'finished'; s.score = 0;
      s.message = { 'resident-floor': '本季居民用水低于底线', 'river-dry-streak': '生态河流连续两季断流', 'annual-target': '有类别未达到自己的年度目标' }[s.lostReason];
      return { entered: null, terminal: s.lostReason };
    }
    if (index === 3) {
      s.phase = 'won'; s.stage = 'finished'; s.score = 1000 + sum(s.deliveredUnits); s.message = '四季水账结清，三方年度目标均已完成';
      return { entered: null, terminal: 'won' };
    }
    enterSeason(s, index + 1, t + 1, true); return { entered: index + 1, terminal: null };
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing') return s;
    if (dt === 0) return s;
    if (!finite(dt) || Math.abs(dt - DT) > 1e-12) throw new RangeError('step requires one fixed 1/60 second interval');
    var t = s.tick, beforeStage = s.stage, beforeSeason = s.seasonIndex, inventoryBefore = clone(s.inventory);
    inputStep(s, t, input);
    var release = null, completed = null, entered = null, terminal = null;
    if (s.stage === 'releasing') {
      var age = s.releaseAgeTicks, beforeDelivered = s.currentDeliveredUnits.slice(), storedBefore = s.storedUnits;
      need(age >= 0 && age < 480, 'Release age must be inside its one actual season');
      var afterDelivered = s.committedUnits.map(function (quantity) { return Math.floor(quantity * (age + 1) / 480); });
      var credits = afterDelivered.map(function (quantity, i) { return quantity - beforeDelivered[i]; });
      s.storedUnits -= sum(credits); s.deliveredUnits = s.deliveredUnits.map(function (quantity, i) { return quantity + credits[i]; });
      s.currentDeliveredUnits = afterDelivered; s.releaseAgeTicks = age + 1;
      release = { seasonIndex: s.seasonIndex, commitId: s.commits[s.commits.length - 1].id, fromAgeTicks: age, toAgeTicks: age + 1,
        committedUnits: s.committedUnits.slice(), deliveredBeforeUnits: beforeDelivered, creditedUnits: credits, deliveredAfterUnits: afterDelivered.slice(),
        storageBeforeUnits: storedBefore, storageAfterUnits: s.storedUnits };
      if (s.releaseAgeTicks === 480) { completed = s.seasonIndex; var result = finishSeason(s, t); entered = result.entered; terminal = result.terminal; }
    }
    s.tick = t + 1; s.elapsed = s.tick / 60; refresh(s); s.lastInput.quarantinedAfter = s.inputState.quarantined; s.lastInput.cursorAfter = s.cursor;
    s.lastInterval = { fromTick: t, tick: s.tick, stageBefore: beforeStage, stageAfter: s.stage, seasonIndexBefore: beforeSeason, seasonIndexAfter: s.seasonIndex,
      actionIds: s.lastInput.actionIds.slice(), release: release, completedSeasonIndex: completed, enteredSeasonIndex: entered, terminalReason: terminal,
      inventoryBefore: inventoryBefore, inventoryAfter: clone(s.inventory) };
    return s;
  }
  return { create: create, step: step };
}));
