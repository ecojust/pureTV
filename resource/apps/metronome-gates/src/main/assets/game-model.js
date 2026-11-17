(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PureModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const BUTTONS = ['a', 'b', 'aPressed', 'bPressed', 'start', 'select', 'startPressed', 'selectPressed', 'confirm', 'retry'];
  const DELTAS = { up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 } };
  const LEVELS = [
    { name: '双桥庭院', beatBudget: 48, start: { x: 1, y: 1 }, exit: { x: 3, y: 1 },
      grid: ['#############', '#S.E..a....M#', '#.#X#######.#', '#.#########.#', '#.#########.#',
        '#d#########b#', '#.#########.#', '#.#########.#', '#.#######X#.#', '#M....c....M#', '#############'],
      markers: [{ id: 'm1', x: 11, y: 1 }, { id: 'm2', x: 11, y: 9 }, { id: 'm3', x: 1, y: 9 }],
      traps: [{ x: 3, y: 2 }, { x: 9, y: 8 }],
      gates: [{ id: 'a', x: 6, y: 1, period: 2, openResidues: [0] }, { id: 'b', x: 11, y: 5, period: 3, openResidues: [1] },
        { id: 'c', x: 6, y: 9, period: 2, openResidues: [1] }, { id: 'd', x: 1, y: 5, period: 3, openResidues: [0] }] },
    { name: '三岔采样', beatBudget: 64, start: { x: 6, y: 1 }, exit: { x: 6, y: 9 },
      grid: ['#############', '#M.a..S....X#', '######.######', '######c######', '######.######',
        '#M.......b.M#', '######.######', '######e######', '######.######', '#M.d..E....X#', '#############'],
      markers: [{ id: 'm1', x: 1, y: 1 }, { id: 'm2', x: 1, y: 5 }, { id: 'm3', x: 11, y: 5 }, { id: 'm4', x: 1, y: 9 }],
      traps: [{ x: 11, y: 1 }, { x: 11, y: 9 }],
      gates: [{ id: 'a', x: 3, y: 1, period: 2, openResidues: [1] }, { id: 'b', x: 9, y: 5, period: 3, openResidues: [2] },
        { id: 'c', x: 6, y: 3, period: 3, openResidues: [0] }, { id: 'd', x: 3, y: 9, period: 2, openResidues: [0] },
        { id: 'e', x: 6, y: 7, period: 2, openResidues: [0] }] },
    { name: '交错闸室', beatBudget: 62, start: { x: 6, y: 5 }, exit: { x: 6, y: 1 },
      grid: ['#############', '#M.a..E..b.M#', '#.####.####.#', '#h####.####c#', '#.#X##.####.#',
        '#.....S.....#', '#.####.##X#.#', '#g####.####d#', '#.####.####.#', '#M.f.....e.M#', '#############'],
      markers: [{ id: 'm1', x: 1, y: 1 }, { id: 'm2', x: 11, y: 1 }, { id: 'm3', x: 11, y: 9 }, { id: 'm4', x: 1, y: 9 }],
      traps: [{ x: 3, y: 4 }, { x: 9, y: 6 }],
      gates: [{ id: 'a', x: 3, y: 1, period: 2, openResidues: [0] }, { id: 'b', x: 9, y: 1, period: 3, openResidues: [1] },
        { id: 'c', x: 11, y: 3, period: 2, openResidues: [1] }, { id: 'd', x: 11, y: 7, period: 3, openResidues: [2] },
        { id: 'e', x: 9, y: 9, period: 2, openResidues: [0] }, { id: 'f', x: 3, y: 9, period: 3, openResidues: [0] },
        { id: 'g', x: 1, y: 7, period: 2, openResidues: [1] }, { id: 'h', x: 1, y: 3, period: 3, openResidues: [1] }] }
  ];
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const samePosition = (a, b) => a.x === b.x && a.y === b.y;
  const queueIds = s => s.queue.map(command => command.id);
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  }
  const immutable = value => freeze(JSON.parse(JSON.stringify(value)));
  function refresh(s) {
    s.elapsed = s.tick / s.physics.ticksPerSecond;
    s.beatPhaseTicks = s.tick % s.physics.ticksPerBeat;
    s.ticksUntilBeat = s.physics.ticksPerBeat - s.beatPhaseTicks;
    s.beatsRemaining = s.beatBudget - s.beatNo;
    s.collectedCount = s.collectedMarkerIds.length; s.exitUnlocked = s.collectedCount === s.markerCount;
    s.gateStates = immutable(s.scenario.gates.map(gate => ({ id: gate.id, period: gate.period,
      openResidues: gate.openResidues, currentBeatNo: s.beatNo, openNow: gate.openResidues.includes(s.beatNo % gate.period),
      nextBeatNo: s.beatNo + 1, openNext: gate.openResidues.includes((s.beatNo + 1) % gate.period),
      preview: Array.from({ length: Math.min(6, s.beatsRemaining) }, (_, index) => ({ beatNo: s.beatNo + index + 1,
        open: gate.openResidues.includes((s.beatNo + index + 1) % gate.period) })) })));
    if (s.phase === 'won') s.message = '标记已集齐 · 成功抵达出口';
    else if (s.phase === 'lost') s.message = { closed_gate: '目标闸门在这一拍关闭了', trap: '小球进入陷阱', beat_budget: '拍数用尽，请重新规划队列' }[s.lostReason];
    else if (s.inputState.quarantined) s.message = '请松开按键和摇杆 · 已排队命令仍随拍执行';
    else s.message = '队列 ' + s.queue.length + '/' + s.physics.queueCapacity + ' · 下一拍 ' + (s.beatNo + 1) + ' · A 等待，B 撤尾';
  }
  function create(seed = 737, difficulty = 0) {
    seed = finite(seed) ? Math.trunc(seed) : 737;
    difficulty = finite(difficulty) ? Math.max(0, Math.min(2, Math.trunc(difficulty))) : 0;
    const sc = immutable({ id: 'metronome-gates-' + (difficulty + 1), cols: 13, rows: 11, ...LEVELS[difficulty] });
    const p = freeze({ ticksPerSecond: 60, ticksPerBeat: 72, queueCapacity: 6, neutralAxisThreshold: 0.35,
      directionAxisThreshold: 0.55, markerScore: 100, winScore: 1000 });
    const s = { width: 960, height: 540, schemaVersion: 1,
      identity: freeze({ gameId: 37, name: '节拍闸道', englishName: 'Metronome Gates', slug: 'metronome-gates',
        packageId: 'com.ecojust.metronomegatestv', versionName: '0.1.0', versionCode: 1, seed, actionCount: 2 }),
      seed, difficulty, level: difficulty + 1, levelName: sc.name, scenarioId: sc.id, physics: p, scenario: sc,
      phase: 'playing', tick: 0, elapsed: 0, beatNo: 0, beatPhaseTicks: 0, ticksUntilBeat: 72,
      beatBudget: sc.beatBudget, beatsRemaining: sc.beatBudget, score: 0, lostReason: null, message: '', terminal: null, events: [],
      player: { ...sc.start }, collectedMarkerIds: [], markerCount: sc.markers.length, collectedCount: 0, exitUnlocked: false,
      queue: [], nextCommandId: 1, gateStates: [],
      inputState: { cancelEpoch: null, quarantined: true, directionArmed: false, aArmed: false, bArmed: false,
        edgeOrdinals: { direction: 0, a: 0, b: 0 } },
      queueReceipts: [], beatReceipts: [], lastInput: null, lastStep: null, lastQueueReceipts: [], lastBeat: null };
    refresh(s); return s;
  }
  function normalize(input, threshold) {
    const source = input && typeof input === 'object' ? input : {}, raw = {};
    for (const key of ['x', 'y', 'menuDelta', 'cancelEpoch']) raw[key] = finite(source[key]) ? source[key] : null;
    for (const key of [...BUTTONS, 'cancelled']) raw[key] = source[key] === true;
    const valid = key => !Object.prototype.hasOwnProperty.call(source, key) || finite(source[key]);
    const axis = key => finite(source[key]) ? Math.max(-1, Math.min(1, source[key])) : 0;
    const x = axis('x'), y = axis('y'), menuDelta = finite(source.menuDelta) ? source.menuDelta : 0;
    const axesValid = valid('x') && valid('y'), menuDeltaValid = valid('menuDelta');
    const cancelEpoch = finite(source.cancelEpoch) ? Math.floor(Math.max(0, source.cancelEpoch)) : 0;
    const fullNeutral = axesValid && menuDeltaValid && Math.abs(x) <= threshold && Math.abs(y) <= threshold &&
      menuDelta === 0 && !raw.cancelled && BUTTONS.every(key => !raw[key]);
    return { raw, x, y, menuDelta, axesValid, menuDeltaValid, cancelEpoch, fullNeutral };
  }
  function handleInput(s, input, tick) {
    const n = normalize(input, s.physics.neutralAxisThreshold), i = s.inputState;
    const armedBefore = { direction: i.directionArmed, a: i.aArmed, b: i.bArmed }, quarantinedBefore = i.quarantined;
    const epochChanged = i.cancelEpoch !== n.cancelEpoch;
    if (epochChanged || n.raw.cancelled) { i.quarantined = true; i.directionArmed = i.aArmed = i.bArmed = false; }
    i.cancelEpoch = n.cancelEpoch;
    const fresh = { direction: false, a: false, b: false };
    let mode, direction = null, neutralAcknowledged = false;
    if (i.quarantined && n.fullNeutral) {
      i.quarantined = false; i.directionArmed = i.aArmed = i.bArmed = true;
      mode = 'neutral_ack'; neutralAcknowledged = true;
    } else if (i.quarantined) mode = 'quarantine';
    else {
      mode = 'active';
      if (n.axesValid) {
        if (Math.abs(n.x) <= s.physics.neutralAxisThreshold && Math.abs(n.y) <= s.physics.neutralAxisThreshold) i.directionArmed = true;
        if (Math.max(Math.abs(n.x), Math.abs(n.y)) >= s.physics.directionAxisThreshold) {
          direction = Math.abs(n.x) > Math.abs(n.y) ? (n.x > 0 ? 'right' : 'left') : (n.y > 0 ? 'down' : 'up');
          if (i.directionArmed) { fresh.direction = true; i.directionArmed = false; i.edgeOrdinals.direction++; }
        }
      }
      for (const key of ['a', 'b']) {
        const armed = key + 'Armed';
        if (!n.raw[key] && !n.raw[key + 'Pressed']) i[armed] = true;
        else if (i[armed]) { fresh[key] = true; i[armed] = false; i.edgeOrdinals[key]++; }
      }
    }
    s.lastInput = immutable({ tick, ...n, epochChanged, mode, quarantinedBefore, quarantinedAfter: i.quarantined,
      neutralAcknowledged, armedBefore, armedAfter: { direction: i.directionArmed, a: i.aArmed, b: i.bArmed },
      direction, fresh, edgeOrdinals: i.edgeOrdinals });
    return { fresh, direction };
  }
  function event(s, type, tick = s.tick) { s.events.push(freeze({ type, tick, beatNo: s.beatNo })); }
  function editQueue(s, source, requestedKind, tick) {
    const queueBeforeIds = queueIds(s), edgeOrdinal = s.inputState.edgeOrdinals[source];
    let command = null, result;
    if (source === 'b') {
      if (s.queue.length) { command = s.queue.pop(); result = 'undone'; }
      else result = 'empty';
    } else if (s.queue.length < s.physics.queueCapacity) {
      command = freeze({ id: s.nextCommandId++, kind: requestedKind, queuedTick: tick, source, edgeOrdinal });
      s.queue.push(command); result = 'enqueued';
    } else result = 'full';
    const receipt = immutable({ id: s.queueReceipts.length + 1, tick, beatNo: s.beatNo, source, edgeOrdinal,
      operation: source === 'b' ? 'undo' : 'enqueue', requestedKind, result, command,
      queueBeforeIds, queueAfterIds: queueIds(s) });
    s.queueReceipts.push(receipt); s.lastQueueReceipts.push(receipt);
    event(s, result === 'enqueued' ? 'enqueue' : result === 'undone' ? 'undo' : 'reject', tick);
  }
  function cellAt(s, point) {
    return point.x < 0 || point.y < 0 || point.x >= s.scenario.cols || point.y >= s.scenario.rows ? null : s.scenario.grid[point.y][point.x];
  }
  function consumeBeat(s) {
    const remainingBefore = s.beatBudget - s.beatNo, queueBeforeIds = queueIds(s);
    const markersBeforeIds = s.collectedMarkerIds.slice(), scoreBefore = s.score, from = { ...s.player };
    s.beatNo++; event(s, 'beat');
    const remainingAfter = s.beatBudget - s.beatNo, command = s.queue.length ? s.queue.shift() : null;
    const action = command ? command.kind : 'wait', waitSource = action === 'wait' ? (command ? 'explicit' : 'empty') : null;
    const candidate = action === 'wait' ? { ...from } : { x: from.x + DELTAS[action].x, y: from.y + DELTAS[action].y };
    const targetCell = cellAt(s, candidate);
    let outcome = 'waited', gateCheck = null, terminalReason = null, collectedMarkerId = null;
    if (action !== 'wait') {
      if (targetCell === null || targetCell === '#') outcome = 'blocked';
      else {
        const gate = s.scenario.gates.find(row => samePosition(row, candidate));
        if (gate) gateCheck = { id: gate.id, period: gate.period, residue: s.beatNo % gate.period, open: gate.openResidues.includes(s.beatNo % gate.period) };
        if (gateCheck && !gateCheck.open) { outcome = 'closed_gate'; terminalReason = 'closed_gate'; }
        else {
          s.player = { ...candidate };
          if (targetCell === 'X') { outcome = 'trap'; terminalReason = 'trap'; }
          else outcome = 'moved';
        }
      }
    }
    if (terminalReason === null) {
      const marker = s.scenario.markers.find(row => samePosition(row, s.player) && !s.collectedMarkerIds.includes(row.id));
      if (marker) { collectedMarkerId = marker.id; s.collectedMarkerIds.push(marker.id); event(s, 'marker'); }
      if (s.collectedMarkerIds.length === s.markerCount && samePosition(s.player, s.scenario.exit)) terminalReason = 'all_markers_exit';
      else if (remainingAfter === 0) terminalReason = 'beat_budget';
    }
    if (terminalReason !== null) {
      s.phase = terminalReason === 'all_markers_exit' ? 'won' : 'lost'; s.lostReason = s.phase === 'lost' ? terminalReason : null;
      s.terminal = immutable({ reason: terminalReason, tick: s.tick, beatNo: s.beatNo, position: s.player,
        markerIds: s.collectedMarkerIds, beatsRemaining: remainingAfter, commandId: command ? command.id : null });
      event(s, s.phase === 'won' ? 'win' : 'lose');
    }
    s.score = s.collectedMarkerIds.length * s.physics.markerScore + (s.phase === 'won' ? s.physics.winScore : 0);
    const receipt = immutable({ id: s.beatNo, tick: s.tick, beatNo: s.beatNo, remainingBefore, remainingAfter,
      queueBeforeIds, queueAfterIds: queueIds(s), command, action, waitSource, from, candidate, to: s.player,
      targetCell, outcome, gateCheck, collectedMarkerId, markersBeforeIds, markersAfterIds: s.collectedMarkerIds,
      scoreBefore, scoreAfter: s.score, terminalReason });
    s.beatReceipts.push(receipt); s.lastBeat = receipt;
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing' || !finite(dt) || dt <= 0) return s;
    const before = { tick: s.tick, beatNo: s.beatNo, phaseTicks: s.beatPhaseTicks, queueIds: queueIds(s),
      position: { ...s.player }, markerIds: s.collectedMarkerIds.slice(), score: s.score };
    const nextTick = s.tick + 1;
    s.events = []; s.lastQueueReceipts = []; s.lastBeat = null;
    const control = handleInput(s, input, nextTick);
    if (control.fresh.b) editQueue(s, 'b', null, nextTick);
    if (control.fresh.direction) editQueue(s, 'direction', control.direction, nextTick);
    if (control.fresh.a) editQueue(s, 'a', 'wait', nextTick);
    s.tick = nextTick;
    if (s.tick % s.physics.ticksPerBeat === 0) consumeBeat(s);
    refresh(s);
    s.lastStep = immutable({ fromTick: before.tick, toTick: s.tick, fromBeatNo: before.beatNo, toBeatNo: s.beatNo,
      phaseTicksBefore: before.phaseTicks, phaseTicksAfter: s.beatPhaseTicks, inputMode: s.lastInput.mode,
      queueBeforeIds: before.queueIds, queueAfterIds: queueIds(s), queueReceiptIds: s.lastQueueReceipts.map(receipt => receipt.id),
      beatReceiptId: s.lastBeat ? s.lastBeat.id : null, consumedCommandId: s.lastBeat && s.lastBeat.command ? s.lastBeat.command.id : null,
      positionBefore: before.position, positionAfter: s.player, markersBeforeIds: before.markerIds, markersAfterIds: s.collectedMarkerIds,
      scoreBefore: before.score, scoreAfter: s.score, terminalAfter: s.terminal ? s.terminal.reason : null });
    return s;
  }
  function snapshot(s) { return immutable(s); }
  return Object.freeze({ create, step, snapshot });
});
