(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 60;
  var PHYSICS = { tickHz: 60, nominalCellVoltageV: 12, ambientC: 24,
    cellThermalCapacityJK: 8, cellConductanceWK: 0.3, cellMaximumTemperatureC: 52,
    loadThermalCapacityJK: 15, loadConductanceWK: 0.35, loadHeatFraction: 0.3,
    loadMaximumTemperatureC: 40.5, consecutivePowerFaultTicks: 75,
    powerCompareToleranceW: 1e-9, workCompletionToleranceJ: 1e-8, ledgerComparisonTolerance: 1e-8 };
  var LEVELS = [
    { name: '港口试供', nameEn: 'Port Trial', charge: [54, 56, 70, 73, 42, 46],
      slots: ['C1', 'C2', 'C5', 'C3', 'C4', 'C6'], topologies: ['series', 'parallel'],
      windows: [[0, 360], [1080, 1380], [2100, 2400]],
      stages: [[360, 1080, 'high', 'low'], [1380, 2100, 'low', 'high'], [2400, 3120, 'high', 'high']],
      requirements: { high: [32, 46, 360], low: [16, 21, 180] }, closeTick: 3120 },
    { name: '轮值负载', nameEn: 'Alternating Loads', charge: [62, 64, 78, 81, 48, 51],
      slots: ['C1', 'C2', 'C3', 'C5', 'C6', 'C4'], topologies: ['parallel', 'series'],
      windows: [[0, 360], [1200, 1500], [2340, 2640]],
      stages: [[360, 1200, 'low', 'high'], [1500, 2340, 'high', 'low'], [2640, 3480, 'high', 'high']],
      requirements: { high: [32, 46, 420], low: [16, 20, 210] }, closeTick: 3480 },
    { name: '夜间双机', nameEn: 'Night Double Duty', charge: [72, 74, 82, 85, 54, 58],
      slots: ['C1', 'C2', 'C5', 'C3', 'C4', 'C6'], topologies: ['parallel', 'parallel'],
      windows: [[0, 360], [1320, 1620], [2580, 2880]],
      stages: [[360, 1320, 'high', 'low'], [1620, 2580, 'low', 'high'], [2880, 3840, 'high', 'high']],
      requirements: { high: [38, 46, 500], low: [16, 20, 240] }, closeTick: 3840 }
  ];
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function positive(value) { return finite(value) && value > 0; }
  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
  function sum(rows, key) { return rows.reduce(function (total, row) { return total + row[key]; }, 0); }
  function invalid() { throw new RangeError('Invalid electrical circuit'); }

  function solveCircuit(options) {
    if (!options || typeof options !== 'object') invalid();
    var topology = options.topology, cells = options.cells, rl = options.loadResistanceOhm;
    if (!['series', 'parallel'].includes(topology) || !Array.isArray(cells) || cells.length > 2 || !positive(rl)) invalid();
    var ids = [];
    cells.forEach(function (cell) {
      if (!cell || typeof cell.id !== 'string' || !cell.id.length || ids.includes(cell.id)
          || !positive(cell.voltageV) || !positive(cell.resistanceOhm)) invalid();
      ids.push(cell.id);
    });
    if (topology === 'parallel' && cells.some(function (cell) { return cell.voltageV !== cells[0].voltageV; })) invalid();
    var out = { topology: topology, connected: cells.length > 0, cellIds: ids, loadResistanceOhm: rl,
      openCircuitVoltageV: 0, internalResistanceOhm: null, parallelConductanceS: null,
      currentA: 0, terminalVoltageV: 0, sourcePowerW: 0, loadPowerW: 0,
      internalHeatPowerW: 0, powerBalanceErrorW: 0, branches: [] };
    if (!cells.length) return out;
    var conductance = topology === 'parallel' ? cells.reduce(function (n, c) { return n + 1 / c.resistanceOhm; }, 0) : null;
    var resistance = topology === 'series' ? sum(cells, 'resistanceOhm') : 1 / conductance;
    var voltage = topology === 'series' ? sum(cells, 'voltageV') : cells[0].voltageV;
    var denominator = rl + resistance;
    if (!positive(denominator)) invalid();
    var current = voltage / denominator;
    out.openCircuitVoltageV = voltage; out.internalResistanceOhm = resistance; out.parallelConductanceS = conductance;
    out.currentA = current; out.terminalVoltageV = current * rl; out.loadPowerW = current * current * rl;
    out.branches = cells.map(function (cell) {
      var branchCurrent = topology === 'series' ? current : current * (1 / cell.resistanceOhm) / conductance;
      return { cellId: cell.id, voltageV: cell.voltageV, resistanceOhm: cell.resistanceOhm,
        currentA: branchCurrent, sourcePowerW: cell.voltageV * branchCurrent,
        heatPowerW: branchCurrent * branchCurrent * cell.resistanceOhm };
    });
    out.sourcePowerW = sum(out.branches, 'sourcePowerW'); out.internalHeatPowerW = sum(out.branches, 'heatPowerW');
    out.powerBalanceErrorW = out.sourcePowerW - out.loadPowerW - out.internalHeatPowerW;
    function check(value) {
      if (typeof value === 'number' && !finite(value)) invalid();
      if (value && typeof value === 'object') Object.keys(value).forEach(function (key) { check(value[key]); });
    }
    check(out); return out;
  }

  function request(level, stageIndex, row) {
    var stage = level.stages[stageIndex], name = stage[row + 2], rule = level.requirements[name];
    return { loadId: 'L' + (row + 1), stageIndex: stageIndex, requirementId: name,
      minimumPowerW: rule[0], maximumPowerW: rule[1], targetWorkJ: rule[2] };
  }
  function stageRecord(level, index, row) {
    var req = request(level, index, row);
    return { index: index, requirementId: req.requirementId, startTick: level.stages[index][0], endTick: level.stages[index][1],
      minimumPowerW: req.minimumPowerW, maximumPowerW: req.maximumPowerW, targetWorkJ: req.targetWorkJ,
      workJ: 0, deficitJ: req.targetWorkJ, deliveredEnergyJ: 0, overflowEnergyJ: 0, outOfBandEnergyJ: 0,
      goodIntervals: 0, badIntervals: 0, peakBadPowerTicks: 0, startedAtTick: null, completedAtTick: null, endedAtTick: null };
  }
  function schedule(level) {
    var rows = [];
    level.stages.forEach(function (stage, i) {
      rows.push({ index: i * 2, kind: 'window', windowIndex: i, stageIndex: null, startTick: level.windows[i][0],
        endTick: level.windows[i][1], inputWindowOpen: true, requirements: [] });
      rows.push({ index: i * 2 + 1, kind: 'supply', windowIndex: null, stageIndex: i, startTick: stage[0], endTick: stage[1],
        inputWindowOpen: false, requirements: [request(level, i, 0), request(level, i, 1)] });
    });
    return rows;
  }
  function segmentAt(s, tick, remaining) {
    var row = s.schedule.find(function (item) { return item.startTick <= tick && tick < item.endTick; });
    var result = row ? clone(row) : { index: s.schedule.length, kind: 'end', windowIndex: null, stageIndex: null,
      startTick: s.closeTick, endTick: s.closeTick, inputWindowOpen: false, requirements: [] };
    if (remaining) result.remainingTicks = Math.max(0, result.endTick - tick);
    return result;
  }
  function done(s, stage) { return Math.max(0, stage.targetWorkJ - stage.workJ) <= s.physics.workCompletionToleranceJ; }
  function configuration(s) { return { cursor: s.cursor, sourceSlot: s.sourceSlot, slots: s.slots.slice(), topologies: s.topologies.slice() }; }
  function emit(s, type, fields) {
    var event = Object.assign({ id: ++s.eventCount, type: type, fromTick: s.tick, tick: s.tick + 1 }, clone(fields || {}));
    s.events.push(event); s.lastEvent = clone(event);
  }
  function refresh(s) {
    s.elapsed = s.tick / 60; s.remaining = Math.max(0, (s.closeTick - s.tick) / 60);
    s.viewSegment = segmentAt(s, s.tick, true);
    var next = s.schedule[s.viewSegment.index + 1]; s.nextSegment = next ? clone(next) : null;
    s.controlsOpen = s.phase === 'playing' && s.viewSegment.kind === 'window';
    s.cells.forEach(function (cell) {
      cell.slot = s.slots.indexOf(cell.id); cell.loadId = cell.slot % 3 < 2 ? 'L' + (Math.floor(cell.slot / 3) + 1) : null;
      cell.heatBalanceErrorJ = s.physics.cellThermalCapacityJK * (cell.temperatureC - s.physics.ambientC) - cell.generatedHeatJ + cell.removedHeatJ;
    });
    s.loads.forEach(function (load) {
      load.stages.forEach(function (stage) { stage.deficitJ = Math.max(0, stage.targetWorkJ - stage.workJ); });
      load.workPartitionErrorJ = load.deliveredEnergyJ - load.creditedWorkJ - load.overflowEnergyJ - load.outOfBandEnergyJ;
      load.heatBalanceErrorJ = s.physics.loadThermalCapacityJK * (load.temperatureC - s.physics.ambientC) - load.generatedHeatJ + load.removedHeatJ;
    });
    var initial = sum(s.cells, 'initialChargeC'), consumed = sum(s.cells, 'consumedChargeC'), remaining = sum(s.cells, 'remainingChargeC');
    s.chargeLedger = { initialChargeC: initial, consumedChargeC: consumed, remainingChargeC: remaining, errorC: initial - consumed - remaining };
    var source = sum(s.cells, 'sourceEnergyJ'), delivered = sum(s.loads, 'deliveredEnergyJ'), internal = sum(s.cells, 'generatedHeatJ');
    s.electricalLedger = { sourceEnergyJ: source, deliveredEnergyJ: delivered, internalHeatJ: internal, errorJ: source - delivered - internal };
    s.score = s.phase === 'won' ? 1000 + 2 * Math.floor((s.closeTick - s.tick) / 60) + Math.floor(remaining) : 0;
  }
  function electricalEmpty() {
    return { fromTick: null, toTick: null, stageIndex: null, requested: false, connected: false, disconnectReason: 'not-started',
      powerInBand: null, circuit: null, currentA: 0, terminalVoltageV: 0, loadPowerW: 0, sourcePowerW: 0, internalHeatPowerW: 0 };
  }
  function create(seed, difficulty) {
    var levelIndex = finite(difficulty) ? clamp(Math.floor(difficulty), 0, 2) : 0, level = LEVELS[levelIndex];
    var s = { width: 960, height: 540, seed: finite(seed) ? Math.trunc(seed) >>> 0 : 528, difficulty: levelIndex,
      level: levelIndex + 1, levelName: level.name, levelNameEn: level.nameEn, tick: 0, elapsed: 0,
      closeTick: level.closeTick, remaining: level.closeTick / 60, phase: 'playing', score: 0, lostReason: null, failures: [],
      physics: clone(PHYSICS), schedule: schedule(level), viewSegment: null, controlsOpen: true, nextSegment: null,
      cursor: 0, sourceSlot: null, slots: level.slots.slice(), topologies: level.topologies.slice(), cells: [], loads: [],
      chargeLedger: {}, electricalLedger: {}, commandCount: 0, blockedCommands: 0, navigationCount: 0, swapCount: 0,
      topologyChangeCount: 0, markCount: 0, markCancelCount: 0, automaticMarkClearCount: 0,
      commandReceipts: [], blockedReceipts: [], navigationReceipts: [], automaticMarkClearReceipts: [],
      stageStartReceipts: [], workCompletionReceipts: [], stageEndReceipts: [], eventCount: 0, events: [], lastEvent: null,
      lastOperation: null, lastInput: null, lastInterval: null,
      inputState: { cancelEpoch: 0, quarantined: false, aArmed: true, bArmed: true, navigationArmed: true,
        navigationDirection: null, navigationHeldTicks: 0 }, message: '断电窗口内换电与改线；供电时观察功率、电量和温度。' };
    level.charge.forEach(function (charge, i) {
      s.cells.push({ id: 'C' + (i + 1), voltageV: 12, resistanceOhm: Math.floor(i / 2) + 1,
        initialChargeC: charge, consumedChargeC: 0, remainingChargeC: charge, temperatureC: 24,
        generatedHeatJ: 0, removedHeatJ: 0, sourceEnergyJ: 0, slot: 0, loadId: null,
        lastCurrentA: 0, lastSourcePowerW: 0, lastHeatPowerW: 0, heatBalanceErrorJ: 0 });
    });
    ['机械泵', '信标塔'].forEach(function (name, row) {
      s.loads.push({ id: 'L' + (row + 1), name: name, nameEn: row ? 'BEACON' : 'SERVICE PUMP', row: row,
        resistanceOhm: 6, slotIndices: [row * 3, row * 3 + 1], temperatureC: 24, generatedHeatJ: 0, removedHeatJ: 0,
        deliveredEnergyJ: 0, creditedWorkJ: 0, overflowEnergyJ: 0, outOfBandEnergyJ: 0, consecutiveBadPowerTicks: 0,
        stages: [stageRecord(level, 0, row), stageRecord(level, 1, row), stageRecord(level, 2, row)],
        lastElectrical: electricalEmpty(), workPartitionErrorJ: 0, heatBalanceErrorJ: 0 });
    });
    refresh(s); return s;
  }

  function autoClear(s, segment, reason, info) {
    if (s.sourceSlot === null) return;
    var before = configuration(s), source = s.sourceSlot; s.sourceSlot = null;
    var receipt = { id: ++s.automaticMarkClearCount, fromTick: s.tick, tick: s.tick + 1, segmentIndex: segment.index,
      reason: reason, sourceSlot: source, before: before, after: configuration(s) };
    s.automaticMarkClearReceipts.push(receipt); info.automaticClearReceiptIds.push(receipt.id);
    emit(s, 'mark-clear', { receiptId: receipt.id, reason: reason });
  }
  function command(s, segment, key, action, before, fields, info) {
    var receipt = Object.assign({ id: ++s.commandCount, fromTick: s.tick, tick: s.tick + 1, segmentIndex: segment.index,
      windowIndex: segment.windowIndex, action: action, inputKey: key, before: before, after: configuration(s) }, fields || {});
    s.commandReceipts.push(clone(receipt)); s.lastOperation = clone(receipt); info.commandReceiptIds.push(receipt.id);
    emit(s, 'command', { receiptId: receipt.id, action: action });
  }
  function blocked(s, segment, key, action, info) {
    var before = configuration(s), receipt = { id: ++s.blockedCommands, fromTick: s.tick, tick: s.tick + 1,
      segmentIndex: segment.index, action: action, inputKey: key, reason: 'outside-off-window', before: before, after: clone(before) };
    s.blockedReceipts.push(receipt); info.blockedReceiptIds.push(receipt.id);
    s.message = '供电中不能换电或改线，等待下个断电窗口。'; emit(s, 'blocked', { receiptId: receipt.id, action: action });
  }
  function direction(x, y) {
    if (Math.abs(x) <= 0.25 && Math.abs(y) <= 0.25) return null;
    return Math.abs(x) >= Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
  }
  function processInput(s, segment, raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var state = s.inputState, x = finite(raw.x) ? clamp(raw.x, -1, 1) : 0, y = finite(raw.y) ? clamp(raw.y, -1, 1) : 0;
    var epoch = Number.isSafeInteger(raw.cancelEpoch) && raw.cancelEpoch >= 0 ? raw.cancelEpoch : state.cancelEpoch;
    var a = !!(raw.a || raw.aPressed), b = !!(raw.b || raw.bPressed), dir = direction(x, y);
    var cancelled = !!raw.cancelled || epoch !== state.cancelEpoch;
    var info = { fromTick: s.tick, tick: s.tick + 1, segment: clone(segment),
      sampled: { x: x, y: y, a: !!raw.a, b: !!raw.b, aPressed: !!raw.aPressed, bPressed: !!raw.bPressed,
        aDown: a, bDown: b, cancelEpoch: epoch, cancelled: !!raw.cancelled },
      cancellation: cancelled, suppressed: false, quarantineCleared: false, freshA: false, freshB: false,
      commandReceiptIds: [], blockedReceiptIds: [], automaticClearReceiptIds: [], navigation: null };
    if (segment.kind === 'supply' && s.tick === segment.startTick) autoClear(s, segment, 'window-close', info);
    state.cancelEpoch = epoch;
    if (cancelled) {
      autoClear(s, segment, 'runtime-cancel', info); state.quarantined = true;
      state.aArmed = state.bArmed = state.navigationArmed = false; state.navigationDirection = null; state.navigationHeldTicks = 0;
      info.suppressed = true; s.lastInput = clone(info); return;
    }
    if (state.quarantined) {
      info.suppressed = true;
      if (!a && !b && dir === null) {
        state.quarantined = false; state.aArmed = state.bArmed = state.navigationArmed = true; info.quarantineCleared = true;
      }
      s.lastInput = clone(info); return;
    }
    var freshA = a && state.aArmed, freshB = b && state.bArmed;
    state.aArmed = !a; state.bArmed = !b; info.freshA = freshA; info.freshB = freshB;
    if (!dir) { state.navigationDirection = null; state.navigationHeldTicks = 0; }
    else if (dir !== state.navigationDirection) { state.navigationDirection = dir; state.navigationHeldTicks = 1; }
    else state.navigationHeldTicks++;
    var held = state.navigationHeldTicks, eligible = !!dir && (held === 1 || (held >= 21 && (held - 21) % 10 === 0));
    if (freshB) {
      var beforeB = configuration(s);
      if (s.sourceSlot !== null) {
        var source = s.sourceSlot; s.sourceSlot = null; s.markCancelCount++;
        command(s, segment, 'b', 'cancel-mark-b', beforeB, { fromSlot: source }, info); s.message = '已取消来源标记。';
      } else if (!segment.inputWindowOpen) blocked(s, segment, 'b', 'toggle-topology', info);
      else {
        var row = Math.floor(s.cursor / 3), previous = s.topologies[row]; s.topologies[row] = previous === 'series' ? 'parallel' : 'series';
        s.topologyChangeCount++; command(s, segment, 'b', 'toggle-topology', beforeB,
          { row: row, fromTopology: previous, toTopology: s.topologies[row] }, info); s.message = '已切换该行串并联。';
      }
    } else {
      if (eligible) {
        var prior = s.cursor, col = prior % 3, navRow = Math.floor(prior / 3);
        if (dir === 'left') col = Math.max(0, col - 1); else if (dir === 'right') col = Math.min(2, col + 1);
        else if (dir === 'up') navRow = Math.max(0, navRow - 1); else navRow = Math.min(1, navRow + 1);
        s.cursor = navRow * 3 + col;
        info.navigation = { direction: dir, heldTicks: held, mode: held === 1 ? 'initial' : 'repeat', beforeCursor: prior,
          afterCursor: s.cursor, moved: prior !== s.cursor, receiptId: null };
        if (prior !== s.cursor) {
          var nav = { id: ++s.navigationCount, fromTick: s.tick, tick: s.tick + 1, segmentIndex: segment.index,
            direction: dir, heldTicks: held, mode: info.navigation.mode, beforeCursor: prior, afterCursor: s.cursor };
          s.navigationReceipts.push(nav); info.navigation.receiptId = nav.id; emit(s, 'navigate', { receiptId: nav.id });
        }
      }
      if (freshA) {
        var beforeA = configuration(s), origin = s.sourceSlot;
        if (!segment.inputWindowOpen) blocked(s, segment, 'a', origin === null ? 'mark-source' : 'swap', info);
        else if (origin === null) {
          s.sourceSlot = s.cursor; s.markCount++;
          command(s, segment, 'a', 'mark-source', beforeA, { fromSlot: s.cursor, cellId: s.slots[s.cursor] }, info); s.message = '来源已标记，选择目的位置再按 A 交换。';
        } else if (origin === s.cursor) {
          s.sourceSlot = null; s.markCancelCount++; command(s, segment, 'a', 'cancel-mark-same-slot', beforeA, { fromSlot: origin }, info);
          s.message = '已取消来源标记。';
        } else {
          var pair = [s.slots[origin], s.slots[s.cursor]], target = s.cursor;
          s.slots[origin] = pair[1]; s.slots[target] = pair[0]; s.sourceSlot = null; s.swapCount++;
          command(s, segment, 'a', 'swap', beforeA, { fromSlot: origin, toSlot: target, cellIds: pair }, info); s.message = '电芯已交换，电量与温度保留。';
        }
      }
    }
    s.lastInput = clone(info);
  }

  function thermal(entity, power, capacity, conductance, ambient) {
    var before = entity.temperatureC, generated = power * DT, removed = conductance * (before - ambient) * DT;
    entity.generatedHeatJ += generated; entity.removedHeatJ += removed; entity.temperatureC = before + (generated - removed) / capacity;
    return { temperatureBeforeC: before, generatedHeatJ: generated, removedHeatJ: removed, temperatureAfterC: entity.temperatureC };
  }
  function startStage(s, segment) {
    if (segment.kind !== 'supply' || s.tick !== segment.startTick) return null;
    s.loads.forEach(function (load) {
      var stage = load.stages[segment.stageIndex];
      stage.workJ = stage.deliveredEnergyJ = stage.overflowEnergyJ = stage.outOfBandEnergyJ = 0;
      stage.goodIntervals = stage.badIntervals = stage.peakBadPowerTicks = 0; stage.deficitJ = stage.targetWorkJ;
      stage.completedAtTick = stage.endedAtTick = null; stage.startedAtTick = s.tick + 1; load.consecutiveBadPowerTicks = 0;
    });
    var receipt = { id: s.stageStartReceipts.length + 1, fromTick: s.tick, tick: s.tick + 1,
      stageIndex: segment.stageIndex, segmentIndex: segment.index, requirements: clone(segment.requirements) };
    s.stageStartReceipts.push(receipt); emit(s, 'stage-start', { receiptId: receipt.id, stageIndex: segment.stageIndex });
    s.message = '供电阶段开始，完成两台设备的工作量。'; return segment.stageIndex;
  }
  function step(s, dt, input) {
    if (s.phase === 'won' || s.phase === 'lost') return s;
    if (dt === 0) return s;
    if (!finite(dt) || Math.abs(dt - DT) > 1e-12) throw new RangeError('Battery Exchange requires one fixed 1/60-second step');
    var from = s.tick, to = from + 1, segment = segmentAt(s, from, true), p = s.physics;
    s.events = []; processInput(s, segment, input);
    var started = startStage(s, segment), preCharge = s.cells.filter(function (cell) { return cell.remainingChargeC <= 0; });
    var preValues = {}; preCharge.forEach(function (cell) { preValues[cell.id] = cell.remainingChargeC; });
    var interval = { fromTick: from, tick: to, seconds: DT, segment: clone(segment), configuration: configuration(s),
      preSupplyChargeFailureCellIds: preCharge.map(function (cell) { return cell.id; }), cells: [], loads: [], stageStarted: started,
      workCompletionReceiptIds: [], stageEndReceiptIds: [], failures: [], terminal: null };
    var branches = {}, newPowerFaults = [];
    s.loads.forEach(function (load) {
      var stage = segment.kind === 'supply' ? load.stages[segment.stageIndex] : null;
      var requested = !!stage && !done(s, stage), badBefore = load.consecutiveBadPowerTicks;
      if (!requested) load.consecutiveBadPowerTicks = 0;
      var reason = !stage ? 'off-window' : !requested ? 'stage-complete' : preCharge.length ? 'pre-supply-charge-failure' : null;
      var circuit = null;
      if (!reason) {
        circuit = solveCircuit({ topology: s.topologies[load.row], loadResistanceOhm: load.resistanceOhm,
          cells: load.slotIndices.map(function (slot) { return s.cells.find(function (cell) { return cell.id === s.slots[slot]; }); }) });
        circuit.branches.forEach(function (branch) { branches[branch.cellId] = branch; });
      }
      var connected = !!circuit && circuit.connected, power = connected ? circuit.loadPowerW : 0;
      var inBand = connected ? power >= stage.minimumPowerW - p.powerCompareToleranceW && power <= stage.maximumPowerW + p.powerCompareToleranceW : null;
      var delivered = power * DT, credited = 0, overflow = 0, outOfBand = 0, workBefore = stage ? stage.workJ : null, completed = false;
      if (connected) {
        if (inBand) {
          load.consecutiveBadPowerTicks = 0; stage.goodIntervals++;
          credited = Math.min(delivered, Math.max(0, stage.targetWorkJ - stage.workJ)); overflow = delivered - credited; stage.workJ += credited;
        } else {
          load.consecutiveBadPowerTicks++; stage.badIntervals++; outOfBand = delivered;
          if (load.consecutiveBadPowerTicks >= p.consecutivePowerFaultTicks) newPowerFaults.push(load.id);
        }
        stage.peakBadPowerTicks = Math.max(stage.peakBadPowerTicks, load.consecutiveBadPowerTicks);
        stage.deliveredEnergyJ += delivered; stage.overflowEnergyJ += overflow; stage.outOfBandEnergyJ += outOfBand;
        load.deliveredEnergyJ += delivered; load.creditedWorkJ += credited; load.overflowEnergyJ += overflow; load.outOfBandEnergyJ += outOfBand;
        stage.deficitJ = Math.max(0, stage.targetWorkJ - stage.workJ); completed = done(s, stage);
        if (completed) {
          stage.completedAtTick = to;
          var receipt = { id: s.workCompletionReceipts.length + 1, fromTick: from, tick: to, stageIndex: segment.stageIndex,
            loadId: load.id, targetWorkJ: stage.targetWorkJ, workBeforeJ: workBefore, deliveredEnergyJ: delivered,
            creditedWorkJ: credited, workAfterJ: stage.workJ, deficitJ: stage.deficitJ, overflowEnergyJ: overflow, disconnectFromTick: to };
          s.workCompletionReceipts.push(receipt); interval.workCompletionReceiptIds.push(receipt.id);
          emit(s, 'delivery', { receiptId: receipt.id, loadId: load.id, stageIndex: segment.stageIndex }); s.message = load.name + '本阶段任务完成，设备自动停机。';
        }
      }
      var heat = thermal(load, power * p.loadHeatFraction, p.loadThermalCapacityJK, p.loadConductanceWK, p.ambientC);
      load.lastElectrical = { fromTick: from, toTick: to, stageIndex: stage ? segment.stageIndex : null, requested: requested,
        connected: connected, disconnectReason: reason, powerInBand: inBand, circuit: circuit ? clone(circuit) : null,
        currentA: connected ? circuit.currentA : 0, terminalVoltageV: connected ? circuit.terminalVoltageV : 0,
        loadPowerW: power, sourcePowerW: connected ? circuit.sourcePowerW : 0, internalHeatPowerW: connected ? circuit.internalHeatPowerW : 0 };
      interval.loads.push(Object.assign({ loadId: load.id, stageIndex: stage ? segment.stageIndex : null, requested: requested,
        connected: connected, disconnectReason: reason, circuit: circuit ? clone(circuit) : null, powerInBand: inBand,
        workBeforeJ: workBefore, creditedWorkJ: credited, workAfterJ: stage ? stage.workJ : null, deliveredEnergyJ: delivered,
        overflowEnergyJ: overflow, outOfBandEnergyJ: outOfBand, badPowerTicksBefore: badBefore,
        badPowerTicksAfter: load.consecutiveBadPowerTicks, completedNow: completed }, heat));
    });
    s.cells.forEach(function (cell) {
      var branch = branches[cell.id], current = branch ? branch.currentA : 0, sourcePower = branch ? branch.sourcePowerW : 0, heatPower = branch ? branch.heatPowerW : 0;
      var chargeBefore = cell.remainingChargeC, used = current * DT, sourceJ = sourcePower * DT;
      cell.consumedChargeC += used; cell.remainingChargeC = cell.initialChargeC - cell.consumedChargeC; cell.sourceEnergyJ += sourceJ;
      cell.lastCurrentA = current; cell.lastSourcePowerW = sourcePower; cell.lastHeatPowerW = heatPower;
      var heat = thermal(cell, heatPower, p.cellThermalCapacityJK, p.cellConductanceWK, p.ambientC), slot = s.slots.indexOf(cell.id);
      interval.cells.push(Object.assign({ cellId: cell.id, slot: slot, loadId: slot % 3 < 2 ? 'L' + (Math.floor(slot / 3) + 1) : null,
        currentA: current, sourcePowerW: sourcePower, heatPowerW: heatPower, chargeBeforeC: chargeBefore, chargeUsedC: used,
        chargeAfterC: cell.remainingChargeC, sourceEnergyJ: sourceJ }, heat));
    });
    var failures = [];
    function fail(kind, id, actual, limit, unit, fields) {
      failures.push(Object.assign({ kind: kind, entityId: id, stageIndex: segment.stageIndex, fromTick: from,
        tick: to, actualValue: actual, limitValue: limit, unit: unit }, fields || {}));
    }
    s.cells.forEach(function (cell) {
      if (Object.prototype.hasOwnProperty.call(preValues, cell.id) || cell.remainingChargeC <= 0)
        fail('cell-charge', cell.id, Object.prototype.hasOwnProperty.call(preValues, cell.id) ? preValues[cell.id] : cell.remainingChargeC, 0, 'C',
          { boundary: Object.prototype.hasOwnProperty.call(preValues, cell.id) ? 'pre-supply' : 'interval-end' });
    });
    s.cells.forEach(function (cell) { if (cell.temperatureC >= p.cellMaximumTemperatureC) fail('cell-overheat', cell.id, cell.temperatureC, p.cellMaximumTemperatureC, 'degC'); });
    s.loads.forEach(function (load) { if (load.temperatureC >= p.loadMaximumTemperatureC) fail('load-overheat', load.id, load.temperatureC, p.loadMaximumTemperatureC, 'degC'); });
    s.loads.forEach(function (load) { if (newPowerFaults.includes(load.id)) fail('power-fault', load.id, load.consecutiveBadPowerTicks, p.consecutivePowerFaultTicks, 'ticks'); });
    if (segment.kind === 'supply' && to === segment.endTick) {
      var ended = { id: s.stageEndReceipts.length + 1, fromTick: from, tick: to, stageIndex: segment.stageIndex, loads: [] };
      s.loads.forEach(function (load) {
        var stage = load.stages[segment.stageIndex]; stage.endedAtTick = to; stage.deficitJ = Math.max(0, stage.targetWorkJ - stage.workJ);
        ended.loads.push({ loadId: load.id, targetWorkJ: stage.targetWorkJ, workJ: stage.workJ, deficitJ: stage.deficitJ, complete: done(s, stage) });
        if (!done(s, stage)) fail('stage-quota', load.id, stage.workJ, stage.targetWorkJ, 'J', { deficitJ: stage.deficitJ });
      });
      s.stageEndReceipts.push(ended); interval.stageEndReceiptIds.push(ended.id); emit(s, 'stage-end', { receiptId: ended.id, stageIndex: segment.stageIndex });
    }
    if (failures.length) {
      s.phase = 'lost'; s.lostReason = failures[0].kind; s.failures = clone(failures);
      s.message = ({ 'cell-charge': '电芯电量耗尽，供电失败。', 'cell-overheat': '电芯过热，供电失败。', 'load-overheat': '负载过热，供电失败。',
        'power-fault': '功率连续越界，设备保护停机。', 'stage-quota': '供电阶段结束，工作量未完成。' })[s.lostReason];
      interval.terminal = { phase: 'lost', reason: s.lostReason }; emit(s, 'loss', { reason: s.lostReason });
    } else if (segment.stageIndex === 2 && s.loads.every(function (load) { return done(s, load.stages[2]); })) {
      s.phase = 'won'; s.message = '三阶段供电全部完成，电量与温度保持安全。'; interval.terminal = { phase: 'won', reason: null }; emit(s, 'win');
    }
    interval.failures = clone(failures); s.tick = to; refresh(s); s.lastInterval = clone(interval); return s;
  }
  return Object.freeze({ create: create, step: step, solveCircuit: solveCircuit });
}));
