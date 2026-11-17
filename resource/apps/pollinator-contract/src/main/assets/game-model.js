(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 60;
  var PHYSICS = { tickHz: 60, speedPixelsPerTick: 3, beesPerSwarm: 6, swarmCount: 2, initialTotalBees: 12,
    staminaCapacityTicks: 1800, awayCostPerTick: 1, homeRecoveryPerTick: 6, workPerEligibleSwarmTick: 1,
    coordinateAuditAbsoluteTolerance: 1e-8, flightLengthSnapTolerancePixels: 1e-9 };
  var LEVELS = [
    { name: '初夏双约', nameEn: 'First Blossoms', deadline: 3960, fields: [
      ['F1', '苜蓿', 'clover', 280, 150, 0, 1200, 420, []],
      ['F2', '金盏', 'calendula', 290, 390, 180, 1440, 480, []],
      ['F3', '蓝星', 'bluestar', 490, 150, 720, 2220, 540, ['F1']],
      ['F4', '鼠尾', 'salvia', 590, 330, 1680, 3480, 600, ['F2', 'F3']] ] },
    { name: '交错花期', nameEn: 'Crossing Seasons', deadline: 4560, fields: [
      ['F1', '苜蓿', 'clover', 260, 130, 0, 1380, 480, []],
      ['F2', '金盏', 'calendula', 250, 410, 0, 1500, 480, []],
      ['F3', '蓝星', 'bluestar', 440, 130, 840, 2580, 660, ['F1']],
      ['F4', '鼠尾', 'salvia', 460, 400, 960, 2820, 600, ['F2']],
      ['F5', '紫苑', 'aster', 630, 260, 2100, 3900, 720, ['F3', 'F4']] ] },
    { name: '暮园续契', nameEn: 'Late Garden Pact', deadline: 5160, fields: [
      ['F1', '苜蓿', 'clover', 245, 120, 0, 1500, 600, []],
      ['F2', '金盏', 'calendula', 250, 410, 120, 1620, 600, []],
      ['F3', '蓝星', 'bluestar', 415, 120, 1080, 2760, 660, ['F1']],
      ['F4', '鼠尾', 'salvia', 430, 410, 1140, 2880, 660, ['F2']],
      ['F5', '紫苑', 'aster', 590, 160, 2520, 4200, 720, ['F3', 'F4']],
      ['F6', '晚菊', 'daisy', 620, 360, 3000, 4800, 720, ['F5']] ] }
  ];
  var clone = function (value) { return JSON.parse(JSON.stringify(value)); };
  var finite = function (value) { return typeof value === 'number' && Number.isFinite(value); };
  var integer = Number.isSafeInteger;
  var clamp = function (n, lo, hi) { return Math.max(lo, Math.min(hi, n)); };
  var sum = function (rows) { return rows.reduce(function (a, b) { return a + b; }, 0); };
  function need(ok, message) { if (!ok) throw new Error(message); }
  function lengthInfo(x, y, destination) {
    var dx = destination.x - x, dy = destination.y - y, raw = Math.hypot(dx, dy), nearest = Math.round(raw / 3) * 3;
    var scheduled = Math.abs(raw - nearest) <= 1e-9 ? nearest : raw;
    return { dx: dx, dy: dy, rawLengthPx: raw, scheduleLengthPx: scheduled, durationTicks: Math.max(1, Math.ceil(scheduled / 3)) };
  }
  function groupView(g) {
    return clone({ mode: g.mode, x: g.x, y: g.y, assignment: g.assignment, fieldId: g.fieldId, staminaTicks: g.staminaTicks, flight: g.flight });
  }
  function refresh(s) {
    var groups = { home: [], flying: [], field: [] }, bees = { home: 0, flying: 0, field: 0 };
    s.swarms.forEach(function (g, i) {
      need(g.id === 'B' + (i + 1) && g.index === i && g.beeCount === 6 && groups[g.mode], 'Invalid swarm identity or mode');
      need(finite(g.x) && finite(g.y) && integer(g.staminaTicks) && g.staminaTicks >= 0 && g.staminaTicks <= 1800
        && g.staminaTicks === 1800 - g.awayTicks + g.recoveredTicks, 'Invalid actual stamina account');
      need(g.contributions.length === s.fields.length && g.contributions.every(function (v) { return integer(v) && v >= 0; })
        && sum(g.contributions) === g.workTicks, 'Invalid swarm work account');
      if (g.mode === 'home') need(g.x === s.hive.x && g.y === s.hive.y && g.assignment === 'hive' && g.fieldId === null && g.flight === null, 'Home requires an actual hive arrival');
      else if (g.mode === 'field') {
        var field = s.fields.find(function (f) { return f.id === g.fieldId; });
        need(field && g.assignment === field.id && g.x === field.x && g.y === field.y && g.flight === null, 'Field mode requires actual arrival');
      } else need(g.fieldId === null && g.flight && g.assignment === g.flight.destination.id, 'Flying swarm has one actual segment');
      g.remainingAwaySeconds = g.staminaTicks / 60;
      g.directHomeTicks = g.mode === 'home' ? 0 : lengthInfo(g.x, g.y, s.hive).durationTicks;
      g.homeReserveTicks = g.staminaTicks - g.directHomeTicks;
      groups[g.mode].push(g.id); bees[g.mode] += g.beeCount;
    });
    s.fields.forEach(function (f, index) {
      need(f.contributions.length === 2 && f.contributions.every(function (v, i) { return integer(v) && v >= 0 && v === s.swarms[i].contributions[index]; })
        && f.workTicks === sum(f.contributions) && f.workTicks <= f.requiredWorkTicks, 'Invalid field work account');
      f.bloomPhase = s.tick < f.openTick ? 'unopened' : s.tick < f.closeTick ? 'open' : 'closed';
    });
    var fieldWork = sum(s.fields.map(function (f) { return f.workTicks; })), groupWork = sum(s.swarms.map(function (g) { return g.workTicks; }));
    need(s.swarms.length === 2 && bees.home + bees.flying + bees.field === 12 && fieldWork === groupWork, 'Swarm or work conservation failed');
    s.inventory = { swarmCount: 2, totalBees: 12, homeIds: groups.home, flyingIds: groups.flying, fieldIds: groups.field, idsExactlyOnce: true,
      counts: { home: groups.home.length, flying: groups.flying.length, field: groups.field.length }, bees: bees,
      totalCreditedWorkTicks: fieldWork, totalSwarmWorkTicks: groupWork, errorWorkTicks: fieldWork - groupWork };
  }
  function create(seed, difficulty) {
    seed = finite(seed) ? Math.trunc(seed) >>> 0 : 729;
    difficulty = finite(difficulty) ? clamp(Math.floor(difficulty), 0, 2) : 0;
    var level = LEVELS[difficulty], s = { width: 960, height: 540, seed: seed, difficulty: difficulty, level: difficulty + 1,
      levelName: level.name, levelNameEn: level.nameEn, phase: 'playing', tick: 0, elapsed: 0, deadlineTick: level.deadline,
      remaining: level.deadline / 60, score: 0, lostReason: null, failures: [], physics: clone(PHYSICS), hive: { id: 'hive', x: 112, y: 270 },
      swarmCursor: 0, fieldCursor: 0, swarms: [], fields: [], inventory: null,
      commandCount: 0, flightCount: 0, blockedCommands: 0, navigationCount: 0, eventCount: 0,
      commandReceipts: [], blockedReceipts: [], navigationReceipts: [], arrivalReceipts: [], completionReceipts: [], unlockReceipts: [], restCompleteReceipts: [],
      events: [], lastEvent: null, lastInput: null, lastInterval: null, lastOperation: null,
      inputState: { cancelEpoch: 0, quarantined: false, aArmed: true, bArmed: true, navigationDirection: null, navigationHeldTicks: 0 },
      message: '左右选花田，上下选蜂群；A 派遣，B 回巢' };
    s.fields = level.fields.map(function (f, i) { return { id: f[0], index: i, name: f[1], species: f[2], x: f[3], y: f[4],
      openTick: f[5], closeTick: f[6], requiredWorkTicks: f[7], prerequisites: f[8].slice(), workTicks: 0, contributions: [0, 0],
      completed: false, completedAtTick: null, unlocked: f[8].length === 0, unlockedAtTick: f[8].length ? null : 0, bloomPhase: 'unopened' }; });
    s.swarms = [0, 1].map(function (i) { return { id: 'B' + (i + 1), index: i, beeCount: 6, mode: 'home', x: s.hive.x, y: s.hive.y,
      assignment: 'hive', fieldId: null, staminaTicks: 1800, staminaCapacityTicks: 1800, remainingAwaySeconds: 30, flight: null,
      cumulativeDistancePx: 0, awayTicks: 0, recoveredTicks: 0, workTicks: 0, contributions: s.fields.map(function () { return 0; }),
      lastArrivalTick: null, lastWorkTick: null, directHomeTicks: 0, homeReserveTicks: 1800, workedLastInterval: false }; });
    refresh(s); return s;
  }
  function event(s, t, type, link) {
    var row = Object.assign({ id: ++s.eventCount, type: type, fromTick: t, tick: t + 1 }, link);
    s.events.push(row); s.lastEvent = clone(row); return row.id;
  }
  function receipt(s, t, array, type, linkKey, body) {
    var id = s[array].length + 1, link = {}; link[linkKey] = id;
    var row = Object.assign({ id: id, eventSeq: event(s, t, type, link), fromTick: t, tick: t + 1 }, clone(body));
    s[array].push(row); return row;
  }
  function command(s, t, key) {
    var g = s.swarms[s.swarmCursor], f = s.fields[s.fieldCursor], before = groupView(g), reason = null;
    if (key === 'a') {
      if (f.completed) reason = 'field-complete';
      else if (g.mode === 'home' && g.staminaTicks === 0) reason = 'rest-required';
      else if (g.assignment === f.id) reason = 'same-destination';
    } else if (g.mode === 'home') reason = 'already-home';
    else if (g.assignment === 'hive') reason = 'already-returning';
    if (reason) {
      var blocked = receipt(s, t, 'blockedReceipts', 'blocked', 'blockedId', { key: key, swarmId: g.id, fieldId: key === 'a' ? f.id : null,
        reason: reason, before: before, after: groupView(g) });
      s.blockedCommands++; s.lastInput.blockedIds.push(blocked.id); return;
    }
    var destination = key === 'a' ? { id: f.id, x: f.x, y: f.y } : clone(s.hive), geometry = lengthInfo(g.x, g.y, destination);
    var flight = Object.assign({ id: ++s.flightCount, fromTick: t, startedAtTick: t + 1, origin: { x: g.x, y: g.y }, destination: destination }, geometry,
      { ageTicks: 0, nominalDirection: geometry.rawLengthPx === 0 ? { x: 0, y: 0 } : { x: geometry.dx / geometry.rawLengthPx, y: geometry.dy / geometry.rawLengthPx } });
    g.flight = flight; g.assignment = destination.id; g.fieldId = null; g.mode = 'flying';
    var row = receipt(s, t, 'commandReceipts', 'command', 'commandId', { key: key, action: key === 'b' ? 'recall' : before.mode === 'flying' ? 'retarget' : 'dispatch',
      swarmId: g.id, destinationId: destination.id, before: before, after: groupView(g), flightId: flight.id });
    s.commandCount++; s.lastOperation = clone(row); s.lastInput.commandIds.push(row.id);
    s.message = g.id + (key === 'b' ? ' 已回航，抵巢后恢复耐力' : ' 正飞向' + f.name + '花田');
  }
  function inputStep(s, t, input) {
    input = input && typeof input === 'object' ? input : {};
    var latch = s.inputState, x = finite(input.x) ? clamp(input.x, -1, 1) : 0, y = finite(input.y) ? clamp(input.y, -1, 1) : 0;
    var a = !!(input.a || input.aPressed), b = !!(input.b || input.bPressed);
    var epoch = integer(input.cancelEpoch) && input.cancelEpoch >= 0 ? input.cancelEpoch : latch.cancelEpoch;
    var cancelled = input.cancelled === true || epoch !== latch.cancelEpoch;
    var li = s.lastInput = { fromTick: t, tick: t + 1, sample: { x: x, y: y, aDown: a, bDown: b, cancelEpoch: epoch, cancelled: input.cancelled === true },
      cancelled: cancelled, quarantinedBefore: latch.quarantined, quarantinedAfter: latch.quarantined, quarantineReleased: false,
      freshA: false, freshB: false, navigationEligible: false, navigationSuppressed: false, navigationAttempt: null,
      commandIds: [], blockedIds: [], navigationIds: [], before: clone(latch), after: null };
    latch.cancelEpoch = epoch;
    if (cancelled) {
      latch.quarantined = true; latch.aArmed = false; latch.bArmed = false; latch.navigationDirection = null; latch.navigationHeldTicks = 0;
    } else if (latch.quarantined) {
      if (Math.abs(x) <= .45 && Math.abs(y) <= .45 && !a && !b) {
        latch.quarantined = false; latch.aArmed = true; latch.bArmed = true; li.quarantineReleased = true;
      }
    } else {
      li.freshA = a && latch.aArmed; li.freshB = b && latch.bArmed; latch.aArmed = !a; latch.bArmed = !b;
      var direction = null;
      if (Math.max(Math.abs(x), Math.abs(y)) > .45) direction = Math.abs(x) >= Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'up' : 'down');
      if (direction === null) { latch.navigationDirection = null; latch.navigationHeldTicks = 0; }
      else { latch.navigationHeldTicks = direction === latch.navigationDirection ? latch.navigationHeldTicks + 1 : 1; latch.navigationDirection = direction; }
      var age = latch.navigationHeldTicks;
      li.navigationEligible = direction !== null && (age === 1 || (age >= 24 && age % 12 === 0));
      li.navigationSuppressed = li.freshB && li.navigationEligible;
      if (li.freshB) command(s, t, 'b');
      else {
        if (li.navigationEligible) {
          var axis = direction === 'left' || direction === 'right' ? 'field' : 'swarm', property = axis + 'Cursor', before = s[property];
          s[property] = clamp(before + (direction === 'left' || direction === 'up' ? -1 : 1), 0, axis === 'field' ? s.fields.length - 1 : 1);
          li.navigationAttempt = { direction: direction, heldTicks: age, mode: age === 1 ? 'initial' : 'repeat', axis: axis, beforeIndex: before, afterIndex: s[property] };
          if (before !== s[property]) { var nav = receipt(s, t, 'navigationReceipts', 'navigate', 'navigationId', li.navigationAttempt); s.navigationCount++; li.navigationIds.push(nav.id); }
        }
        if (li.freshA) command(s, t, 'a');
      }
    }
    li.quarantinedAfter = latch.quarantined; li.after = clone(latch);
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing') return s;
    if (dt === 0) return s;
    if (!finite(dt) || Math.abs(dt - DT) > 1e-12) throw new RangeError('step requires one fixed 1/60 second interval');
    var t = s.tick, inventoryBefore = clone(s.inventory), workAtStart = s.fields.map(function (f) { return f.workTicks; });
    s.events = []; inputStep(s, t, input);
    var completedAtStart = s.fields.filter(function (f) { return f.completed; }).map(function (f) { return f.id; });
    var groups = [], arrivals = [], completions = [], unlocks = [], rests = [], restPending = [];
    s.swarms.forEach(function (g) {
      g.workedLastInterval = false;
      var f = g.mode === 'field' ? s.fields.find(function (item) { return item.id === g.fieldId; }) : null;
      var reason = g.mode === 'home' ? 'home' : g.mode === 'flying' ? 'flying' : completedAtStart.includes(f.id) ? 'field-complete'
        : !f.prerequisites.every(function (id) { return completedAtStart.includes(id); }) ? 'locked'
        : t < f.openTick ? 'unopened' : t >= f.closeTick ? 'closed' : 'credited';
      var row = { swarmId: g.id, modeAfterInput: g.mode, assignmentAfterInput: g.assignment, positionBefore: { x: g.x, y: g.y }, positionAfter: null,
        flightBefore: clone(g.flight), flightAfter: null, staminaBefore: g.staminaTicks, staminaAfter: null, awayDebit: 0, recoveryCredit: 0,
        movedDistancePx: 0, arrivalId: null, work: { fieldId: f ? f.id : null, eligible: reason === 'credited', reason: reason, fieldWorkBefore: null, fieldWorkAfter: null, credit: 0 } };
      if (g.mode === 'home') { row.recoveryCredit = Math.min(6, 1800 - g.staminaTicks); g.staminaTicks += row.recoveryCredit; g.recoveredTicks += row.recoveryCredit;
        if (row.recoveryCredit > 0 && g.staminaTicks === 1800) restPending.push({ swarmId: g.id, beforeStamina: row.staminaBefore, afterStamina: 1800 });
      } else { row.awayDebit = 1; g.staminaTicks = Math.max(0, g.staminaTicks - 1); g.awayTicks++; }
      if (g.mode === 'flying') {
        var flight = g.flight; flight.ageTicks++;
        if (flight.ageTicks >= flight.durationTicks) {
          g.x = flight.destination.x; g.y = flight.destination.y; g.mode = flight.destination.id === 'hive' ? 'home' : 'field';
          g.fieldId = g.mode === 'field' ? flight.destination.id : null; g.lastArrivalTick = t + 1;
          var arrival = receipt(s, t, 'arrivalReceipts', 'arrival', 'arrivalId', { swarmId: g.id, flight: flight, position: { x: g.x, y: g.y },
            destinationId: flight.destination.id, modeAfter: g.mode, staminaTicks: g.staminaTicks });
          row.arrivalId = arrival.id; arrivals.push(arrival.id); g.flight = null;
        } else {
          var fraction = Math.min(3 * flight.ageTicks / flight.rawLengthPx, 1);
          g.x = flight.origin.x + flight.dx * fraction; g.y = flight.origin.y + flight.dy * fraction;
        }
      }
      row.movedDistancePx = Math.hypot(g.x - row.positionBefore.x, g.y - row.positionBefore.y); g.cumulativeDistancePx += row.movedDistancePx;
      row.positionAfter = { x: g.x, y: g.y }; row.flightAfter = clone(g.flight); row.staminaAfter = g.staminaTicks; groups.push(row);
    });
    groups.forEach(function (row, i) {
      var g = s.swarms[i], f = row.work.fieldId === null ? null : s.fields.find(function (item) { return item.id === row.work.fieldId; });
      if (f) row.work.fieldWorkBefore = f.workTicks;
      if (row.work.eligible) {
        if (f.workTicks < f.requiredWorkTicks) {
          row.work.credit = 1; f.workTicks++; f.contributions[i]++; g.workTicks++; g.contributions[f.index]++;
          g.lastWorkTick = t + 1; g.workedLastInterval = true;
        } else row.work.reason = 'demand-filled';
      }
      if (f) row.work.fieldWorkAfter = f.workTicks;
    });
    s.fields.forEach(function (f, i) {
      if (!f.completed && f.workTicks === f.requiredWorkTicks) {
        f.completed = true; f.completedAtTick = t + 1;
        completions.push(receipt(s, t, 'completionReceipts', 'complete', 'completionId', { fieldId: f.id, workBefore: workAtStart[i],
          workAfter: f.workTicks, requiredWorkTicks: f.requiredWorkTicks, contributions: f.contributions }).id);
      }
    });
    s.fields.forEach(function (f) {
      if (!f.unlocked && f.prerequisites.every(function (id) { return s.fields.find(function (item) { return item.id === id; }).completed; })) {
        f.unlocked = true; f.unlockedAtTick = t + 1;
        unlocks.push(receipt(s, t, 'unlockReceipts', 'unlock', 'unlockId', { fieldId: f.id,
          prerequisites: f.prerequisites.map(function (id) { var source = s.fields.find(function (item) { return item.id === id; }); return { fieldId: id, completedAtTick: source.completedAtTick }; }) }).id);
      }
    });
    restPending.forEach(function (row) { rests.push(receipt(s, t, 'restCompleteReceipts', 'rest-complete', 'restCompleteId', row).id); });
    s.tick = t + 1; s.elapsed = s.tick / 60; s.remaining = Math.max(0, (s.deadlineTick - s.tick) / 60); refresh(s);
    var failures = [], terminal = null;
    s.swarms.forEach(function (g) { if (g.staminaTicks === 0 && g.mode !== 'home') failures.push({ kind: 'exhausted', fromTick: t, tick: s.tick,
      swarmId: g.id, fieldId: null, actualValue: 0, limitValue: 0, unit: 'stamina-ticks' }); });
    s.fields.forEach(function (f) { if (!f.completed && s.tick >= f.closeTick) failures.push({ kind: 'missed-bloom', fromTick: t, tick: s.tick,
      swarmId: null, fieldId: f.id, actualValue: f.workTicks, limitValue: f.requiredWorkTicks, unit: 'work-ticks' }); });
    if (s.tick >= s.deadlineTick) failures.push({ kind: 'deadline', fromTick: t, tick: s.tick, swarmId: null, fieldId: null,
      actualValue: s.tick, limitValue: s.deadlineTick, unit: 'ticks' });
    if (failures.length) {
      s.phase = 'lost'; s.failures = clone(failures); s.lostReason = failures[0].kind; terminal = { phase: 'lost', reason: s.lostReason };
      s.message = { exhausted: '蜂群耐力耗尽，请给回巢留足时间', 'missed-bloom': '有花田错过花期', deadline: '本次传粉契约已到期' }[s.lostReason];
      event(s, t, 'loss', { reason: s.lostReason });
    } else if (s.fields.every(function (f) { return f.completed; }) && s.swarms.every(function (g) { return g.mode === 'home'; })) {
      s.phase = 'won'; s.score = 1000 + 2 * Math.floor((s.deadlineTick - s.tick) / 60); s.message = '全部花田授粉完成，两群安全回巢';
      terminal = { phase: 'won', reason: null }; event(s, t, 'win', { score: s.score });
    }
    s.lastInterval = { fromTick: t, tick: s.tick, seconds: DT, completedAtStart: completedAtStart,
      commandIds: s.lastInput.commandIds.slice(), blockedIds: s.lastInput.blockedIds.slice(), navigationIds: s.lastInput.navigationIds.slice(),
      arrivalIds: arrivals, completionIds: completions, unlockIds: unlocks, restCompleteIds: rests, groups: groups,
      inventoryBefore: inventoryBefore, inventoryAfter: clone(s.inventory), failures: clone(failures), terminal: terminal };
    return s;
  }
  return { create: create, step: step };
}));
