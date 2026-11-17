// Public-rule algebra only. No production Model, pilot, route search or generated gameplay.
const copy = value => structuredClone(value);
const samePoint = (a, b) => a.x === b.x && a.y === b.y;
export const VECTORS = {up: {x: 0, y: -1}, right: {x: 1, y: 0}, down: {x: 0, y: 1}, left: {x: -1, y: 0}, wait: {x: 0, y: 0}};

export function parseRules(design, contract, api) {
  const literal = api.match(/`physics=\{([^}]+)\}`/)?.[1];
  if (!literal) throw new Error('Missing public physics');
  const physics = Object.fromEntries(literal.split(',').map(item => { const [key, value] = item.split(':'); return [key.trim(), Number(value)]; }));
  if (Object.keys(physics).length !== 7 || Object.values(physics).some(value => !Number.isFinite(value)) || physics.ticksPerSecond !== 60 || physics.ticksPerBeat !== 72) throw new Error('Unexpected clock/physics schema');
  if (!contract.includes('B 撤尾 → 方向入队') && !design.includes('B 撤尾 → 方向入队')) throw new Error('Missing public queue priority');
  const scenarios = [...design.matchAll(/## 场景 (\d)：([^\n]+)\n([\s\S]*?)(?=\n## 场景|\n## 画面|$)/g)].map(match => {
    const [, ordinal, name, body] = match, id = body.match(/scenarioId=([^`]+)`/)?.[1], beatBudget = Number(body.match(/预算 (\d+) 拍/)?.[1]);
    const grid = body.match(/```text\n([\s\S]*?)\n```/)?.[1].split('\n');
    if (!grid || grid.length !== 11 || grid.some(row => row.length !== 13 || !/^[#.SEMXa-h]+$/.test(row))) throw new Error('Invalid public grid');
    const positions = char => grid.flatMap((row, y) => [...row].flatMap((cell, x) => cell === char ? [{x, y}] : []));
    const start = positions('S'), exit = positions('E');
    const markerText = body.match(/标记\s*([^；]+)；/)?.[1], trapText = body.match(/陷阱\s*([^。\n]+)/)?.[1];
    const markers = [...(markerText || '').matchAll(/(m\d+)=\((\d+),(\d+)\)/g)].map(([, markerId, x, y]) => ({id: markerId, x: Number(x), y: Number(y)}));
    const traps = [...(trapText || '').matchAll(/\((\d+),(\d+)\)/g)].map(([, x, y]) => ({x: Number(x), y: Number(y)}));
    const gates = [...body.matchAll(/^\| ([a-h]) \| \((\d+),(\d+)\) \| ([23]) \| (\[[0-9, ]+\]) \|$/gm)].map(([, gateId, x, y, period, residues]) => ({id: gateId, x: Number(x), y: Number(y), period: Number(period), openResidues: JSON.parse(residues)}));
    if (start.length !== 1 || exit.length !== 1 || !Number.isSafeInteger(beatBudget) || beatBudget <= 0 || id !== `metronome-gates-${ordinal}`) throw new Error('Invalid public scenario identity');
    if (markers.length !== positions('M').length || traps.length !== positions('X').length || markers.some((m, i) => m.id !== `m${i + 1}` || grid[m.y]?.[m.x] !== 'M') || traps.some(t => grid[t.y]?.[t.x] !== 'X')) throw new Error('Marker/trap table disagrees with grid');
    const gateCells = grid.join('').match(/[a-h]/g) || [];
    if (gates.length !== gateCells.length || new Set(gates.map(g => g.id)).size !== gates.length || gates.some(g => grid[g.y]?.[g.x] !== g.id || g.openResidues.some(r => !Number.isSafeInteger(r) || r < 0 || r >= g.period))) throw new Error('Gate table disagrees with grid');
    return {id, name, cols: 13, rows: 11, grid, start: start[0], exit: exit[0], markers, traps, gates, beatBudget};
  });
  if (scenarios.length !== 3) throw new Error('Expected exactly three public scenarios');
  return {physics, scenarios};
}

export function clockAt(tick, scenario, physics) {
  const beatNo = Math.floor(tick / physics.ticksPerBeat), beatPhaseTicks = tick % physics.ticksPerBeat;
  return {tick, elapsed: tick / physics.ticksPerSecond, beatNo, beatPhaseTicks, ticksUntilBeat: physics.ticksPerBeat - beatPhaseTicks,
    beatBudget: scenario.beatBudget, beatsRemaining: scenario.beatBudget - beatNo};
}

export function gateView(beatNo, scenario, physics) {
  return scenario.gates.map(gate => ({id: gate.id, period: gate.period, openResidues: [...gate.openResidues], currentBeatNo: beatNo,
    openNow: gate.openResidues.includes(beatNo % gate.period), nextBeatNo: beatNo + 1, openNext: gate.openResidues.includes((beatNo + 1) % gate.period),
    preview: Array.from({length: Math.min(physics.queueCapacity, scenario.beatBudget - beatNo)}, (_, i) => ({beatNo: beatNo + i + 1, open: gate.openResidues.includes((beatNo + i + 1) % gate.period)}))}));
}

// Merge only original fresh-input times and absolute beat boundaries. No empty-tick game loop.
export function queueCalendar(inputRows, physics) {
  const horizon = inputRows.length, byTick = new Map(inputRows.map(row => [row.tick, row]));
  if (inputRows.some((row, i) => row.tick !== i + 1)) throw new Error('Expected consecutive actual valid-call inputs');
  const times = new Set(inputRows.filter(row => Object.values(row.lastInput.fresh).some(Boolean)).map(row => row.tick));
  for (let beat = 1; beat * physics.ticksPerBeat <= horizon; beat++) times.add(beat * physics.ticksPerBeat);
  const queue = [], queueReceipts = [], consumptions = [], boundaries = [{tick: 0, queue: [], nextCommandId: 1}]; let nextCommandId = 1;
  for (const tick of [...times].sort((a, b) => a - b)) {
    const input = byTick.get(tick).lastInput, beatBefore = Math.floor((tick - 1) / physics.ticksPerBeat);
    for (const source of ['b', 'direction', 'a']) {
      if (!input.fresh[source]) continue;
      const queueBeforeIds = queue.map(command => command.id), operation = source === 'b' ? 'undo' : 'enqueue';
      const requestedKind = source === 'b' ? null : source === 'a' ? 'wait' : input.direction;
      let command = null, result;
      if (source === 'b') { command = queue.pop() ?? null; result = command ? 'undone' : 'empty'; }
      else if (queue.length === physics.queueCapacity) result = 'full';
      else {
        if (!Object.hasOwn(VECTORS, requestedKind)) throw new Error('Fresh direction has no public vector');
        command = {id: nextCommandId++, kind: requestedKind, queuedTick: tick, source, edgeOrdinal: input.edgeOrdinals[source]};
        queue.push(command); result = 'enqueued';
      }
      queueReceipts.push({id: queueReceipts.length + 1, tick, beatNo: beatBefore, source, edgeOrdinal: input.edgeOrdinals[source], operation, requestedKind,
        result, command: copy(command), queueBeforeIds, queueAfterIds: queue.map(item => item.id)});
    }
    if (tick % physics.ticksPerBeat === 0) {
      const queueBeforeIds = queue.map(command => command.id), command = queue.shift() ?? null;
      consumptions.push({tick, beatNo: tick / physics.ticksPerBeat, command: copy(command), queueBeforeIds, queueAfterIds: queue.map(item => item.id)});
    }
    boundaries.push({tick, queue: copy(queue), nextCommandId});
  }
  const at = tick => copy(boundaries.findLast(boundary => boundary.tick <= tick));
  return {queueReceipts, consumptions, boundaries, at};
}

// One public-grid classification per actual scheduled beat. Geometry never reads observed verdict flags.
export function beatCalendar(scenario, physics, consumptions) {
  const beatReceipts = [], states = [{tick: 0, player: copy(scenario.start), collectedMarkerIds: [], collectedCount: 0, exitUnlocked: false, score: 0, phase: 'playing', lostReason: null, terminal: null}];
  for (const consumption of consumptions) {
    const before = states.at(-1), {tick, beatNo, command, queueBeforeIds, queueAfterIds} = consumption;
    if (before.terminal) break;
    if (beatNo !== beatReceipts.length + 1 || beatNo > scenario.beatBudget) throw new Error('Nonconsecutive/out-of-budget beat');
    const action = command?.kind ?? 'wait', vector = VECTORS[action], from = copy(before.player), candidate = {x: from.x + vector.x, y: from.y + vector.y};
    const targetCell = scenario.grid[candidate.y]?.[candidate.x] ?? null, targetGate = scenario.gates.find(gate => samePoint(gate, candidate));
    let outcome = action === 'wait' ? 'waited' : 'moved', to = copy(candidate), gateCheck = null, terminalReason = null, collectedMarkerId = null;
    if (action !== 'wait' && (targetCell === null || targetCell === '#')) { outcome = 'blocked'; to = copy(from); }
    else if (action !== 'wait' && targetGate) {
      const residue = beatNo % targetGate.period, open = targetGate.openResidues.includes(residue);
      gateCheck = {id: targetGate.id, period: targetGate.period, residue, open};
      if (!open) { outcome = 'closed_gate'; to = copy(from); terminalReason = 'closed_gate'; }
    }
    if (action !== 'wait' && !terminalReason && targetCell === 'X') { outcome = 'trap'; terminalReason = 'trap'; }
    const markersBeforeIds = [...before.collectedMarkerIds], markersAfterIds = [...markersBeforeIds];
    if (!terminalReason) {
      const marker = scenario.markers.find(item => samePoint(item, to) && !markersAfterIds.includes(item.id));
      if (marker) { collectedMarkerId = marker.id; markersAfterIds.push(marker.id); }
      if (markersAfterIds.length === scenario.markers.length && samePoint(to, scenario.exit)) terminalReason = 'all_markers_exit';
      else if (beatNo === scenario.beatBudget) terminalReason = 'beat_budget';
    }
    const phase = terminalReason === 'all_markers_exit' ? 'won' : terminalReason ? 'lost' : 'playing';
    const scoreAfter = markersAfterIds.length * physics.markerScore + (phase === 'won' ? physics.winScore : 0);
    const terminal = terminalReason ? {reason: terminalReason, tick, beatNo, position: copy(to), markerIds: [...markersAfterIds], beatsRemaining: scenario.beatBudget - beatNo, commandId: command?.id ?? null} : null;
    beatReceipts.push({id: beatNo, tick, beatNo, remainingBefore: scenario.beatBudget - beatNo + 1, remainingAfter: scenario.beatBudget - beatNo,
      queueBeforeIds: [...queueBeforeIds], queueAfterIds: [...queueAfterIds], command: copy(command), action, waitSource: action === 'wait' ? command ? 'explicit' : 'empty' : null,
      from, candidate, to: copy(to), targetCell, outcome, gateCheck, collectedMarkerId, markersBeforeIds, markersAfterIds, scoreBefore: before.score, scoreAfter, terminalReason});
    states.push({tick, player: copy(to), collectedMarkerIds: [...markersAfterIds], collectedCount: markersAfterIds.length, exitUnlocked: markersAfterIds.length === scenario.markers.length,
      score: scoreAfter, phase, lostReason: phase === 'lost' ? terminalReason : null, terminal});
  }
  const at = tick => copy(states.findLast(state => state.tick <= tick));
  return {beatReceipts, states, at, firstTerminal: states.find(state => state.terminal)?.terminal ?? null};
}
