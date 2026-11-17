(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 60, IDS = ['left', 'center', 'right'];
  var PHYSICS = { tickHz: 60, unitsPerPixel: 10, massPerPacketG: 1, downwardUnitsPerTick: 20, gateHalfLengthUnits: 420 };
  var LEVELS = [
    { name: '双流初衡', nameEn: 'Twin Streams', deadline: 3600, mass: 360, targets: [100, 140, 120], tolerance: 4,
      centers: [180, 480, 780], plane: 420, periods: [12, 12], sources: [[300, 100], [660, 100]],
      gates: [[300, 220], [660, 220]], vx: [{ outer: -12, center: 18 }, { outer: 12, center: -18 }], fall: [60, 60], guided: [100, 100] },
    { name: '错拍刻度', nameEn: 'Offset Measures', deadline: 4080, mass: 378, targets: [110, 173, 95], tolerance: 5,
      centers: [160, 480, 800], plane: 430, periods: [12, 15], sources: [[280, 80], [680, 120]],
      gates: [[280, 230], [680, 230]], vx: [{ outer: -12, center: 20 }, { outer: 12, center: -20 }], fall: [75, 55], guided: [100, 100] },
    { name: '斜庭合流', nameEn: 'Converging Glass', deadline: 4680, mass: 480, targets: [166, 213, 101], tolerance: 6,
      centers: [165, 510, 800], plane: 450, periods: [10, 15], sources: [[280, 90], [700, 90]],
      gates: [[280, 220], [700, 250]], vx: [{ outer: -10, center: 20 }, { outer: 10, center: -19 }], fall: [65, 80], guided: [115, 100] }
  ];
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function finite(v) { return typeof v === 'number' && Number.isFinite(v); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function need(ok, message) { if (!ok) throw new Error(message); }
  function integer(v) { return Number.isSafeInteger(v); }
  function locateCup(difficulty, xU) {
    if (!integer(difficulty) || difficulty < 0 || difficulty > 2 || !integer(xU)) throw new RangeError('Invalid cup geometry query');
    var centers = LEVELS[difficulty].centers;
    for (var n = 0; n < 3; n++) if (xU >= (centers[n] - 70) * 10 && xU < (centers[n] + 70) * 10) return IDS[n];
    return null;
  }
  function configuration(s) { return { cursor: s.cursor, sourceOpen: s.sourceOpen, gateModes: s.gates.map(function (g) { return g.mode; }) }; }
  function refresh(s) {
    var ids = new Set(), bySource = [0, 1].map(function (source) {
      return { emittedG: s.emittedBySource[source], inFlightG: 0, capturedG: 0, spilledG: 0 };
    });
    s.packets.forEach(function (p) {
      need(integer(p.id) && p.id > 0 && !ids.has(p.id) && (p.sourceIndex === 0 || p.sourceIndex === 1) && p.massG === 1, 'Invalid or duplicate packet identity');
      ids.add(p.id); bySource[p.sourceIndex].inFlightG++;
    });
    s.cups.forEach(function (c) {
      need(integer(c.massG) && c.massG >= 0 && c.massG <= c.capacityG && c.contributionsG.every(function (n) { return integer(n) && n >= 0; })
        && c.contributionsG.length === 2 && c.contributionsG[0] + c.contributionsG[1] === c.massG, 'Invalid actual cup mass');
      c.withinTarget = c.massG >= c.minimumG && c.massG <= c.capacityG; c.full = c.massG === c.capacityG;
      bySource[0].capturedG += c.contributionsG[0]; bySource[1].capturedG += c.contributionsG[1];
    });
    s.flowReceipts.forEach(function (r) { if (r.kind === 'spill') bySource[r.sourceIndex].spilledG++; });
    var cupMass = s.cups.reduce(function (n, c) { return n + c.massG; }, 0), emitted = s.emittedBySource[0] + s.emittedBySource[1];
    var total = s.reservoirMassG + s.packets.length + cupMass + s.spillMassG;
    need(integer(s.reservoirMassG) && s.reservoirMassG >= 0 && integer(s.spillMassG) && s.spillMassG >= 0 && total === s.initialMassG, 'Integer sand mass conservation failed');
    bySource.forEach(function (row) { need(row.emittedG === row.inFlightG + row.capturedG + row.spilledG, 'Source mass conservation failed'); });
    need(bySource[0].spilledG + bySource[1].spilledG === s.spillMassG && emitted === s.initialMassG - s.reservoirMassG, 'Emitted/spilled mass mismatch');
    s.inventory = { initialMassG: s.initialMassG, reservoirMassG: s.reservoirMassG, inFlightMassG: s.packets.length,
      cupMassG: cupMass, spillMassG: s.spillMassG, totalMassG: total, errorG: total - s.initialMassG,
      emittedMassG: emitted, capturedMassG: cupMass, packetsExactlyOnce: true, packetCount: s.packets.length, bySource: bySource };
  }
  function create(seed, difficulty) {
    seed = finite(seed) ? Math.trunc(seed) >>> 0 : 728;
    difficulty = finite(difficulty) ? clamp(Math.floor(difficulty), 0, 2) : 0;
    var level = LEVELS[difficulty], s = { width: 960, height: 540, seed: seed, difficulty: difficulty, level: difficulty + 1,
      levelName: level.name, levelNameEn: level.nameEn, phase: 'playing', tick: 0, elapsed: 0, deadlineTick: level.deadline, remaining: level.deadline / 60,
      score: 0, lostReason: null, failures: [], physics: clone(PHYSICS), cursor: 0, sourceOpen: false, sourceAgeTicks: 0,
      initialMassG: level.mass, reservoirMassG: level.mass, spillMassG: 0, emitPeriodsTicks: level.periods.slice(),
      sourcePositionsU: level.sources.map(function (p) { return { xU: p[0] * 10, yU: p[1] * 10 }; }), emittedBySource: [0, 0], nextPacketId: 1,
      gates: [], cups: [], packets: [], inventory: null,
      commandCount: 0, navigationCount: 0, deflectionCount: 0, capturedCount: 0, spilledCount: 0,
      commandReceipts: [], navigationReceipts: [], flowReceipts: [], eventCount: 0, events: [], lastEvent: null, lastOperation: null,
      lastInput: null, lastInterval: null,
      inputState: { cancelEpoch: 0, quarantined: false, aArmed: true, bArmed: true, navigationDirection: 0, navigationHeldTicks: 0 },
      message: '按 B 打开料斗，左右选择挡片，按 A 改向' };
    s.gates = level.gates.map(function (p, n) { return { id: n === 0 ? 'left' : 'right', index: n, sourceIndex: n,
      pivotXU: p[0] * 10, pivotYU: p[1] * 10, halfLengthU: 420, mode: 'outer', angleRad: Math.atan2(20, level.vx[n].outer),
      outgoingVxUnits: clone(level.vx[n]), outgoingVyU: 20, outerCupId: n === 0 ? 'left' : 'right', centerCupId: 'center',
      fallTicks: level.fall[n], guidedTicks: level.guided[n] }; });
    s.cups = level.centers.map(function (x, n) { return { id: IDS[n], index: n, centerXU: x * 10, planeYU: level.plane * 10,
      leftU: (x - 70) * 10, rightU: (x + 70) * 10, targetG: level.targets[n], toleranceG: level.tolerance,
      minimumG: level.targets[n] - level.tolerance, capacityG: level.targets[n] + level.tolerance, massG: 0,
      contributionsG: [0, 0], withinTarget: false, full: false }; });
    refresh(s); return s;
  }
  function event(s, t, type, link) {
    var row = Object.assign({ id: ++s.eventCount, type: type, fromTick: t, tick: t + 1 }, link);
    s.events.push(row); s.lastEvent = clone(row); return row.id;
  }
  function receipt(s, t, array, type, linkKey, body, extra) {
    var id = s[array].length + 1, link = {}; link[linkKey] = id; Object.assign(link, extra || {});
    var row = Object.assign({ id: id, eventSeq: event(s, t, type, link), fromTick: t, tick: t + 1 }, clone(body));
    s[array].push(row); return row;
  }
  function command(s, t, key) {
    var before = configuration(s), gateId = null, action;
    if (key === 'b') { s.sourceOpen = !s.sourceOpen; action = 'toggle-source'; s.message = s.sourceOpen ? '料斗已打开' : '料斗已关闭，在途沙束继续下落'; }
    else {
      var gate = s.gates[s.cursor]; gate.mode = gate.mode === 'outer' ? 'center' : 'outer';
      gate.angleRad = Math.atan2(20, gate.outgoingVxUnits[gate.mode]); gateId = gate.id; action = 'rotate-gate';
      s.message = (s.cursor === 0 ? '左挡片' : '右挡片') + (gate.mode === 'center' ? '已指向中央杯' : '已指向外侧杯');
    }
    var row = receipt(s, t, 'commandReceipts', 'command', 'commandId', { inputKey: key, action: action, gateId: gateId,
      before: before, after: configuration(s) });
    s.commandCount++; s.lastOperation = clone(row); s.lastInput.commandIds.push(row.id);
  }
  function inputStep(s, t, input) {
    input = input && typeof input === 'object' ? input : {};
    var latch = s.inputState, x = finite(input.x) ? clamp(input.x, -1, 1) : 0;
    var a = !!(input.a || input.aPressed), b = !!(input.b || input.bPressed);
    var epoch = integer(input.cancelEpoch) && input.cancelEpoch >= 0 ? input.cancelEpoch : latch.cancelEpoch;
    var cancelled = input.cancelled === true || epoch !== latch.cancelEpoch;
    var li = s.lastInput = { fromTick: t, tick: t + 1, sample: { x: x, aDown: a, bDown: b, cancelled: input.cancelled === true, cancelEpoch: epoch },
      cancelled: cancelled, quarantinedBefore: latch.quarantined, quarantinedAfter: latch.quarantined, quarantineReleased: false,
      freshA: false, freshB: false, navigationEligible: false, navigationSuppressed: false, navigationAttempt: null,
      commandIds: [], navigationIds: [], before: clone(latch), after: null };
    latch.cancelEpoch = epoch;
    if (cancelled) { latch.quarantined = true; latch.aArmed = false; latch.bArmed = false; latch.navigationDirection = 0; latch.navigationHeldTicks = 0; }
    else if (latch.quarantined) {
      if (Math.abs(x) <= .45 && !a && !b) { latch.quarantined = false; latch.aArmed = true; latch.bArmed = true; li.quarantineReleased = true; }
    } else {
      li.freshA = a && latch.aArmed; li.freshB = b && latch.bArmed; latch.aArmed = !a; latch.bArmed = !b;
      var direction = x < -.45 ? -1 : x > .45 ? 1 : 0;
      if (!direction) { latch.navigationDirection = 0; latch.navigationHeldTicks = 0; }
      else { latch.navigationHeldTicks = direction === latch.navigationDirection ? latch.navigationHeldTicks + 1 : 1; latch.navigationDirection = direction; }
      var age = latch.navigationHeldTicks;
      li.navigationEligible = direction !== 0 && (age === 1 || (age >= 24 && age % 12 === 0));
      li.navigationSuppressed = li.freshB && li.navigationEligible;
      if (li.freshB) command(s, t, 'b');
      else {
        if (li.navigationEligible) {
          var before = s.cursor; s.cursor = clamp(s.cursor + direction, 0, 1);
          li.navigationAttempt = { direction: direction, heldTicks: age, mode: age === 1 ? 'initial' : 'repeat', beforeCursor: before, afterCursor: s.cursor };
          if (before !== s.cursor) { var nav = receipt(s, t, 'navigationReceipts', 'navigate', 'navigationId', li.navigationAttempt); s.navigationCount++; li.navigationIds.push(nav.id); }
        }
        if (li.freshA) command(s, t, 'a');
      }
    }
    li.quarantinedAfter = latch.quarantined; li.after = clone(latch);
  }
  function flow(s, t, kind, p, facts) {
    return receipt(s, t, 'flowReceipts', 'flow', 'flowId', Object.assign({ kind: kind, packetId: p.id, massG: 1, sourceIndex: p.sourceIndex }, facts), { kind: kind });
  }
  function emit(s, t, source) {
    var position = s.sourcePositionsU[source], before = s.reservoirMassG;
    var p = { id: s.nextPacketId++, massG: 1, sourceIndex: source, bornFromTick: t, bornAtTick: t + 1,
      stage: 'fall', xU: position.xU, yU: position.yU, vxU: 0, vyU: 20, route: null, contactTick: null, contactGateId: null };
    s.packets.push(p); s.reservoirMassG--; s.emittedBySource[source]++;
    flow(s, t, 'emit', p, { position: clone(position), reservoirBeforeG: before, reservoirAfterG: s.reservoirMassG, sourceAgeTicks: s.sourceAgeTicks });
    return p.id;
  }
  function advancePacket(s, t, p) {
    need(integer(p.xU) && integer(p.yU) && integer(p.vxU) && p.vyU === 20 && p.massG === 1 && (p.sourceIndex === 0 || p.sourceIndex === 1), 'Invalid packet geometry');
    var gate = s.gates[p.sourceIndex], plane = s.cups[0].planeYU;
    if (p.stage === 'fall') {
      need(p.xU === gate.pivotXU && p.vxU === 0 && p.route === null && p.contactTick === null && p.contactGateId === null
        && p.yU < gate.pivotYU, 'Invalid uncontacted fall trajectory');
      p.yU += 20; need(p.yU <= gate.pivotYU, 'Packet skipped its own gate contact');
      if (p.yU === gate.pivotYU) {
        p.stage = 'guided'; p.route = gate.mode; p.vxU = gate.outgoingVxUnits[gate.mode]; p.contactTick = t + 1; p.contactGateId = gate.id;
        flow(s, t, 'contact', p, { gateId: gate.id, mode: gate.mode, position: { xU: p.xU, yU: p.yU },
          beforeVelocity: { vxU: 0, vyU: 20 }, afterVelocity: { vxU: p.vxU, vyU: 20 }, routeBefore: null, routeAfter: p.route });
        s.deflectionCount++;
      }
      return true;
    }
    need(p.stage === 'guided' && (p.route === 'outer' || p.route === 'center') && p.vxU === gate.outgoingVxUnits[p.route]
      && integer(p.contactTick) && p.contactGateId === gate.id && p.yU >= gate.pivotYU && p.yU < plane, 'Invalid guided trajectory');
    p.xU += p.vxU; p.yU += 20;
    need(integer(p.xU) && integer(p.yU) && p.yU <= plane, 'Packet skipped its cup plane');
    if (p.yU < plane) return true;
    var cupId = locateCup(s.difficulty, p.xU), cup = cupId === null ? null : s.cups.find(function (c) { return c.id === cupId; });
    if (cup && cup.massG < cup.capacityG) {
      var before = cup.massG; cup.massG++; cup.contributionsG[p.sourceIndex]++; s.capturedCount++;
      flow(s, t, 'capture', p, { position: { xU: p.xU, yU: p.yU }, cupId: cup.id, cupBeforeG: before, cupAfterG: cup.massG,
        massToCupG: 1, massToSpillG: 0, route: p.route, contactTick: p.contactTick });
    } else {
      var spillBefore = s.spillMassG; s.spillMassG++; s.spilledCount++;
      flow(s, t, 'spill', p, { position: { xU: p.xU, yU: p.yU }, reason: cup ? 'overflow' : 'missed-cup', cupId: cupId,
        cupBeforeG: cup ? cup.massG : null, cupAfterG: cup ? cup.massG : null, massToCupG: 0, massToSpillG: 1,
        spillBeforeG: spillBefore, spillAfterG: s.spillMassG, route: p.route, contactTick: p.contactTick });
    }
    return false;
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing') return s;
    if (dt === 0) return s;
    if (!finite(dt) || Math.abs(dt - DT) > 1e-12) throw new RangeError('step requires one fixed 1/60 second interval');
    var t = s.tick, inventoryBefore = clone(s.inventory), openBefore = s.sourceOpen, ageBefore = s.sourceAgeTicks;
    var reservoirBefore = s.reservoirMassG, gatesBefore = s.gates.map(function (g) { return g.mode; }), flowBefore = s.flowReceipts.length;
    s.events = []; inputStep(s, t, input);
    var emitted = [], gatesAfter = s.gates.map(function (g) { return g.mode; });
    if (s.sourceOpen && s.reservoirMassG > 0) {
      s.sourceAgeTicks++;
      for (var source = 0; source < 2; source++) if ((s.sourceAgeTicks - 1) % s.emitPeriodsTicks[source] === 0 && s.reservoirMassG > 0) emitted.push(emit(s, t, source));
    }
    var reservoirAfterEmission = s.reservoirMassG;
    var advancing = s.packets.slice().sort(function (a, b) { return a.id - b.id; }), advancedIds = advancing.map(function (p) { return p.id; });
    s.packets = advancing.filter(function (p) { return advancePacket(s, t, p); });
    refresh(s); s.tick = t + 1; s.elapsed = s.tick / 60; s.remaining = Math.max(0, (s.deadlineTick - s.tick) / 60);
    var flows = s.flowReceipts.slice(flowBefore), failures = [];
    ['overflow', 'missed-cup'].forEach(function (kind) {
      flows.filter(function (r) { return r.kind === 'spill' && r.reason === kind; }).forEach(function (r) {
        failures.push({ kind: kind, fromTick: t, tick: s.tick, packetIds: [r.packetId], cupIds: r.cupId === null ? [] : [r.cupId], actualValue: 1, limitValue: 0, unit: 'g-spilled' });
      });
    });
    if (s.tick >= s.deadlineTick) failures.push({ kind: 'deadline', fromTick: t, tick: s.tick, packetIds: [], cupIds: [], actualValue: s.tick, limitValue: s.deadlineTick, unit: 'ticks' });
    var emptied = s.reservoirMassG === 0 && s.packets.length === 0;
    if (emptied) s.cups.forEach(function (c) { if (c.massG < c.minimumG) failures.push({ kind: 'shortfall', fromTick: t, tick: s.tick,
      packetIds: [], cupIds: [c.id], actualValue: c.massG, limitValue: c.minimumG, unit: 'g' }); });
    var terminal = null;
    if (failures.length) {
      s.phase = 'lost'; s.failures = clone(failures); s.lostReason = failures[0].kind; terminal = { phase: 'lost', reason: s.lostReason };
      s.message = { overflow: '量杯溢出了，下次请提前调整挡片', 'missed-cup': '沙束落在了量杯外', deadline: '分流计时结束', shortfall: '沙已排空，杯中重量尚未达标' }[s.lostReason];
      event(s, t, 'loss', { reason: s.lostReason });
    } else if (emptied && s.spillMassG === 0 && s.cups.every(function (c) { return c.withinTarget; })) {
      s.phase = 'won'; var error = s.cups.reduce(function (n, c) { return n + Math.abs(c.massG - c.targetG); }, 0);
      s.score = 1000 + 2 * Math.floor((s.deadlineTick - s.tick) / 60) + Math.max(0, 100 - 5 * error);
      s.message = '三杯分量均已达标'; terminal = { phase: 'won', reason: null }; event(s, t, 'win', { score: s.score });
    }
    function flowIds(kind) { return flows.filter(function (r) { return r.kind === kind; }).map(function (r) { return r.id; }); }
    s.lastInterval = { fromTick: t, tick: s.tick, seconds: DT, inventoryBefore: inventoryBefore, inventoryAfter: clone(s.inventory),
      source: { openBefore: openBefore, openAfterInput: s.sourceOpen, ageBefore: ageBefore, ageAfter: s.sourceAgeTicks,
        reservoirBeforeG: reservoirBefore, reservoirAfterEmissionG: reservoirAfterEmission, emittedPacketIds: emitted },
      gatesBefore: gatesBefore, gatesAfterInput: gatesAfter, commandIds: s.lastInput.commandIds.slice(), navigationIds: s.lastInput.navigationIds.slice(),
      flowIds: flows.map(function (r) { return r.id; }), emitFlowIds: flowIds('emit'), contactFlowIds: flowIds('contact'), captureFlowIds: flowIds('capture'),
      spillFlowIds: flowIds('spill'), advancedPacketIds: advancedIds, failures: clone(failures), terminal: terminal };
    return s;
  }
  return { create: create, step: step, locateCup: locateCup };
}));
