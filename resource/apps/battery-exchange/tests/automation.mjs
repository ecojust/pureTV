// Public hypotheses and observed input acknowledgements only; no Model or author-route access.
export const budgets = { maxWebGLDrawCalls: 1 };
const need = (ok, message) => { if (!ok) throw Error(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = value => structuredClone(value);
const close = (a, b, tolerance = 1e-8) => Math.abs(a - b) <= tolerance;
const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
function settings(value = {}) {
  const cfg = { maxCandidates: 100000, maxRouteNodes: 500000, maxMilliseconds: 1500, inputSpacingTicks: 16, observationSlackTicks: 11, maxPresses: 18, ...value };
  for (const [key, high] of Object.entries({ maxCandidates: 200000, maxRouteNodes: 2000000, maxMilliseconds: 3000, inputSpacingTicks: 60, observationSlackTicks: 60, maxPresses: 18 }))
    need(Number.isInteger(cfg[key]) && cfg[key] > 0 && cfg[key] <= high, 'Finite bounded planner option: ' + key);
  return cfg;
}
function shape(m) {
  need(m && m.cells?.length === 6 && m.loads?.length === 2 && m.slots?.length === 6, 'Six physical cells and two public loads required');
  need(new Set(m.slots).size === 6 && m.slots.every(id => m.cells.some(c => c.id === id)), 'Every physical ID must occur once');
  need(Number.isInteger(m.cursor) && m.cursor >= 0 && m.cursor < 6 && m.topologies.length === 2, 'Public grid configuration required');
}
export function predictFocus(cursor, key) {
  need(Number.isInteger(cursor) && cursor >= 0 && cursor < 6 && KEYS.includes(key), 'Public cardinal focus required');
  const row = Math.floor(cursor / 3), col = cursor % 3;
  return Math.max(0, Math.min(1, row + Number(key === 'ArrowDown') - Number(key === 'ArrowUp'))) * 3
    + Math.max(0, Math.min(2, col + Number(key === 'ArrowRight') - Number(key === 'ArrowLeft')));
}
function focusPath(from, to) {
  const keys = []; let cursor = from;
  while (cursor % 3 !== to % 3) { const key = cursor % 3 < to % 3 ? 'ArrowRight' : 'ArrowLeft'; keys.push(key); cursor = predictFocus(cursor, key); }
  if (Math.floor(cursor / 3) !== Math.floor(to / 3)) keys.push(cursor < to ? 'ArrowDown' : 'ArrowUp');
  return keys;
}
export function predictCircuit(cells, topology, loadResistanceOhm) {
  need(Array.isArray(cells) && cells.length <= 2 && ['series', 'parallel'].includes(topology), 'Bounded public circuit');
  need(Number.isFinite(loadResistanceOhm) && loadResistanceOhm > 0 && new Set(cells.map(c => c.id)).size === cells.length, 'Valid public circuit identities');
  for (const c of cells) need(typeof c.id === 'string' && c.id.length > 0 && Number.isFinite(c.voltageV) && c.voltageV > 0 && Number.isFinite(c.resistanceOhm) && c.resistanceOhm > 0, 'Positive finite public cell facts');
  if (!cells.length) return { loadPowerW: 0, currentA: 0, branches: [] };
  if (topology === 'parallel') need(cells.every(c => c.voltageV === cells[0].voltageV), 'Equal nominal voltage in parallel');
  const conductance = cells.reduce((n, c) => n + 1 / c.resistanceOhm, 0);
  const resistance = topology === 'series' ? cells.reduce((n, c) => n + c.resistanceOhm, 0) : 1 / conductance;
  const voltage = topology === 'series' ? cells.reduce((n, c) => n + c.voltageV, 0) : cells[0].voltageV;
  const currentA = voltage / (loadResistanceOhm + resistance);
  return { currentA, loadPowerW: currentA * currentA * loadResistanceOhm,
    branches: cells.map(c => { const current = topology === 'series' ? currentA : currentA / c.resistanceOhm / conductance;
      return { cellId: c.id, currentA: current, heatPowerW: current * current * c.resistanceOhm }; }) };
}
function thermal(temperature, heatPower, ticks, capacity, conductance, ambient, hz) {
  const decay = Math.pow(1 - conductance / (hz * capacity), ticks);
  return ambient + (temperature - ambient) * decay + heatPower / conductance * (1 - decay);
}
function firstAtLimit(temperature, heatPower, maxTicks, capacity, conductance, ambient, hz, limit) {
  if (thermal(temperature, heatPower, maxTicks, capacity, conductance, ambient, hz) < limit) return Infinity;
  let lo = 1, hi = maxTicks;
  while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (thermal(temperature, heatPower, mid, capacity, conductance, ambient, hz) >= limit) hi = mid; else lo = mid + 1; }
  return lo;
}
function hypothesis(m) { return { tick: m.tick, slots: [...m.slots], topologies: [...m.topologies], cursor: m.cursor,
  charge: m.cells.map(c => c.remainingChargeC), cellTemperature: m.cells.map(c => c.temperatureC), loadTemperature: m.loads.map(l => l.temperatureC) }; }
function rest(m, s, tick) {
  const p = m.physics, n = tick - s.tick; need(n >= 0, 'Forecast cannot go backwards');
  return { ...clone(s), tick, cellTemperature: s.cellTemperature.map(t => thermal(t, 0, n, p.cellThermalCapacityJK, p.cellConductanceWK, p.ambientC, p.tickHz)),
    loadTemperature: s.loadTemperature.map(t => thermal(t, 0, n, p.loadThermalCapacityJK, p.loadConductanceWK, p.ambientC, p.tickHz)) };
}
function supply(m, s, stageIndex) {
  const p = m.physics, requests = m.loads.map(l => l.stages[stageIndex]), start = requests[0].startTick, span = requests[0].endTick - start;
  s = rest(m, s, start); const currents = Array(6).fill(0), cellHeat = Array(6).fill(0), cellTicks = Array(6).fill(0), failures = [], rows = [];
  const add = (n, rank, kind, entityId) => { if (n >= 1 && n <= span) failures.push({ n, rank, kind, entityId }); };
  for (let row = 0; row < 2; row++) {
    const load = m.loads[row], request = requests[row], ids = load.slotIndices.map(slot => s.slots[slot]);
    const circuit = predictCircuit(ids.map(id => m.cells.find(c => c.id === id)), s.topologies[row], load.resistanceOhm);
    const good = circuit.loadPowerW >= request.minimumPowerW - p.powerCompareToleranceW && circuit.loadPowerW <= request.maximumPowerW + p.powerCompareToleranceW;
    const complete = good ? Math.max(1, Math.ceil((request.targetWorkJ - p.workCompletionToleranceJ) * p.tickHz / circuit.loadPowerW)) : Infinity;
    const on = Math.min(span, complete); rows.push({ row, circuit, good, complete, on });
    if (!good) add(p.consecutivePowerFaultTicks, 30 + row, 'power-fault', load.id);
    if (complete > span) add(span, 40 + row, 'stage-quota', load.id);
    add(firstAtLimit(s.loadTemperature[row], p.loadHeatFraction * circuit.loadPowerW, on, p.loadThermalCapacityJK, p.loadConductanceWK, p.ambientC, p.tickHz, p.loadMaximumTemperatureC), 20 + row, 'load-overheat', load.id);
    for (const branch of circuit.branches) {
      const i = m.cells.findIndex(c => c.id === branch.cellId), dq = branch.currentA / p.tickHz;
      currents[i] = branch.currentA; cellHeat[i] = branch.heatPowerW; cellTicks[i] = on;
      let empty = Math.max(1, Math.ceil(s.charge[i] / dq));
      while (s.charge[i] - empty * dq > 0) empty++;
      while (empty > 1 && s.charge[i] - (empty - 1) * dq <= 0) empty--;
      if (empty <= on) add(empty, i, 'cell-charge', branch.cellId);
      add(firstAtLimit(s.cellTemperature[i], branch.heatPowerW, on, p.cellThermalCapacityJK, p.cellConductanceWK, p.ambientC, p.tickHz, p.cellMaximumTemperatureC), 10 + i, 'cell-overheat', branch.cellId);
    }
  }
  failures.sort((a, b) => a.n - b.n || a.rank - b.rank);
  const last = stageIndex === m.loads[0].stages.length - 1;
  const n = Math.min(span, failures[0]?.n ?? Infinity, last ? Math.max(...rows.map(r => r.complete)) : Infinity);
  const fail = failures.find(f => f.n === n), end = clone(s); end.tick = start + n;
  end.charge = s.charge.map((q, i) => q - currents[i] * Math.min(n, cellTicks[i]) / p.tickHz);
  end.cellTemperature = s.cellTemperature.map((t, i) => { const active = Math.min(n, cellTicks[i]);
    return thermal(thermal(t, cellHeat[i], active, p.cellThermalCapacityJK, p.cellConductanceWK, p.ambientC, p.tickHz), 0, n - active, p.cellThermalCapacityJK, p.cellConductanceWK, p.ambientC, p.tickHz); });
  end.loadTemperature = s.loadTemperature.map((t, i) => { const active = Math.min(n, rows[i].on);
    return thermal(thermal(t, p.loadHeatFraction * rows[i].circuit.loadPowerW, active, p.loadThermalCapacityJK, p.loadConductanceWK, p.ambientC, p.tickHz), 0, n - active, p.loadThermalCapacityJK, p.loadConductanceWK, p.ambientC, p.tickHz); });
  const margin = Math.min(...end.charge.map((q, i) => q / m.cells[i].initialChargeC), ...end.cellTemperature.map(t => (p.cellMaximumTemperatureC - t) / 28), ...end.loadTemperature.map(t => (p.loadMaximumTemperatureC - t) / 16.5));
  return { state: end, phase: fail ? 'lost' : last ? 'won' : 'playing', reason: fail?.kind ?? null,
    failure: fail ?? null, stageIndex, margin, rows: rows.map(r => ({ loadId: m.loads[r.row].id, topology: s.topologies[r.row], powerW: r.circuit.loadPowerW, completionTicks: Number.isFinite(r.complete) ? r.complete : null })) };
}
function assignments(slots) {
  const map = new Map(), pairs = []; for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) pairs.push([a, b]);
  function keep(array, swaps) { const key = array.join('|'); let item = map.get(key); if (!item) { item = { slots: array, sequences: [] }; map.set(key, item); }
    if (!item.sequences.length || item.sequences[0].length >= swaps.length) { if (item.sequences[0]?.length > swaps.length) item.sequences = []; item.sequences.push(swaps); } }
  keep([...slots], []);
  for (const first of pairs) { const a = [...slots]; [a[first[0]], a[first[1]]] = [a[first[1]], a[first[0]]]; keep(a, [first]);
    for (const second of pairs) { const b = [...a]; [b[second[0]], b[second[1]]] = [b[second[1]], b[second[0]]]; keep(b, [first, second]); } }
  return [...map.values()];
}
function route(from, assignment, topologies, cfg, count) {
  const changes = [0, 1].filter(row => from.topologies[row] !== topologies[row]); let best = null;
  for (const sequence of assignment.sequences) {
    const memo = new Map();
    function visit(index, mask, cursor, keys) {
      count('route'); if (keys.length > cfg.maxPresses || (best && keys.length >= best.keys.length)) return;
      const memoKey = [index, mask, cursor].join(':'); if ((memo.get(memoKey) ?? Infinity) <= keys.length) return; memo.set(memoKey, keys.length);
      if (index === sequence.length && mask === (1 << changes.length) - 1) { best = { keys, cursor, swaps: sequence.length, topologyChanges: changes.length }; return; }
      if (index < sequence.length) for (const [a, b] of [sequence[index], [...sequence[index]].reverse()])
        visit(index + 1, mask, b, [...keys, ...focusPath(cursor, a), 'Space', ...focusPath(a, b), 'Space']);
      for (let bit = 0; bit < changes.length; bit++) if (!(mask & (1 << bit))) for (let col = 0; col < 3; col++) {
        const destination = changes[bit] * 3 + col; visit(index, mask | (1 << bit), destination, [...keys, ...focusPath(cursor, destination), 'b']);
      }
    }
    visit(0, 0, from.cursor, []);
  }
  return best;
}
export function planVisibleState(m, { policy = 'normal', ...plannerOptions } = {}) {
  shape(m); const cfg = settings(plannerOptions), began = performance.now();
  need(['normal', 'cell-charge', 'cell-overheat', 'power-fault'].includes(policy), 'Explicit public outcome policy required');
  need(m.phase === 'playing' && m.viewSegment.kind === 'window' && m.sourceSlot === null, 'Plan only from an unmarked actual off window');
  const stats = { candidates: 0, routeNodes: 0, searchNodes: 0 }, topologyPairs = [['series', 'series'], ['series', 'parallel'], ['parallel', 'series'], ['parallel', 'parallel']];
  function count(kind) { if (kind === 'route') need(++stats.routeNodes <= cfg.maxRouteNodes, 'Public route-node cap reached'); else need(++stats.candidates <= cfg.maxCandidates, 'Public candidate cap reached');
    if ((stats.routeNodes + stats.candidates) % 128 === 0) need(performance.now() - began <= cfg.maxMilliseconds, 'Public planner wall-time cap reached'); }
  function visit(s, stageIndex) {
    stats.searchNodes++; const window = m.schedule.find(row => row.kind === 'window' && row.windowIndex === stageIndex);
    need(window && s.tick < window.endTick, 'Actual input window must retain time'); const candidates = [];
    for (const assignment of assignments(s.slots)) for (const topologies of topologyPairs) {
      count('candidate'); const projected = supply(m, { ...s, slots: assignment.slots, topologies }, stageIndex);
      if (projected.phase === 'lost' && (policy === 'normal' || projected.reason !== policy)) continue;
      if (projected.phase === 'won' && policy !== 'normal') continue;
      const wanted = projected.reason === policy, score = wanted ? 1000 : policy === 'normal' ? projected.margin : -projected.margin;
      candidates.push({ assignment, topologies, projected, score });
    }
    candidates.sort((a, b) => b.score - a.score || a.assignment.sequences[0].length - b.assignment.sequences[0].length || a.assignment.slots.join('').localeCompare(b.assignment.slots.join('')));
    for (const candidate of candidates) {
      const controls = route(s, candidate.assignment, candidate.topologies, cfg, count); if (!controls) continue;
      const requiredTicks = controls.keys.length * cfg.inputSpacingTicks + cfg.observationSlackTicks;
      if (requiredTicks > window.endTick - s.tick) continue;
      const step = { windowIndex: stageIndex, expectedEntry: clone(s), slots: [...candidate.assignment.slots], topologies: [...candidate.topologies], ...controls,
        requiredTicks, supplyPrediction: candidate.projected, scope: 'Public constant-circuit/Euler hypothesis; actual receipts and safety outcome remain authoritative.' };
      if (candidate.projected.phase !== 'playing') return [step];
      const continuation = visit({ ...candidate.projected.state, cursor: controls.cursor }, stageIndex + 1);
      if (continuation) return [step, ...continuation];
    }
    return null;
  }
  const windows = visit(hypothesis(m), m.viewSegment.windowIndex);
  need(windows, 'No bounded public schedule found for ' + policy);
  return { policy, windows, ...stats, milliseconds: performance.now() - began, limits: cfg,
    scope: 'At most two swaps and two topology changes per window; bounded first-feasible search, not a completeness or worst-case dispatch guarantee. Closed-form floating estimates are checked against actual observations.' };
}
export function createPilot({ policy = 'normal', plannerOptions = {} } = {}) {
  settings(plannerOptions); let identity = null, lastTick = -1, plan = null, activeWindow = null, keys = [], keyIndex = 0, pending = null, releaseNext = false;
  let stats = { plans: [], issued: [], acknowledged: [], cacheChecks: [] };
  function reset(m) { identity = `${m.level}:${m.seed}`; lastTick = m.tick; plan = null; activeWindow = null; keys = []; keyIndex = 0; pending = null; releaseNext = false; stats = { plans: [], issued: [], acknowledged: [], cacheChecks: [] }; }
  function prepare(state, scope = 'actual-public-window') { const m = state.model; if (identity !== `${m.level}:${m.seed}` || m.tick < lastTick) reset(m);
    need(!pending && m.sourceSlot === null, 'Do not overwrite an unacknowledged input or marked source');
    plan = planVisibleState(m, { policy, ...plannerOptions }); stats.plans.push({ observedTick: m.tick, scope, ...clone(plan) }); return clone({ milliseconds: plan.milliseconds, candidates: plan.candidates, routeNodes: plan.routeNodes, scope }); }
  function pilot(state) {
    const m = state?.model; if (!m) return [];
    if (identity !== `${m.level}:${m.seed}` || m.tick < lastTick) reset(m); lastTick = m.tick;
    if (state.phase !== 'playing' || state.paused || m.phase !== 'playing') return [];
    if (releaseNext) { if (m.tick <= pending.tick) return [pending.key]; releaseNext = false; return []; }
    if (pending) {
      const p = pending; need(m.blockedCommands === p.blockedCommands, 'Actual intended window input was blocked'); let applied = false;
      if (KEYS.includes(p.key)) { applied = m.cursor === p.expectedCursor; if (m.cursor !== p.cursor) need(applied, 'Navigation must reach the exact public neighbour'); }
      else if (m.commandCount > p.commandCount) {
        const op = m.commandReceipts[p.commandCount]; need(m.commandCount === p.commandCount + 1 && op?.id === m.commandCount && op.tick > p.tick, 'One permanent actual command must acknowledge one issued edge');
        need(same(op.before, p.configuration) && same(op.after, p.expectedConfiguration), 'Input receipt must preserve exact cell IDs, mark and topology');
        need(op.action === p.action && op.inputKey.toLowerCase() === (p.key === 'Space' ? 'a' : 'b'), 'Actual receipt action must match the ordinary key');
        stats.acknowledged.push({ issuedTick: p.tick, observedTick: m.tick, receipt: clone(op) }); applied = true;
      }
      if (!applied) { need(m.tick - p.tick <= 90, 'Ordinary key was not acknowledged within 90 actual ticks'); return []; }
      if (KEYS.includes(p.key)) stats.acknowledged.push({ issuedTick: p.tick, observedTick: m.tick, cursor: m.cursor });
      pending = null; keyIndex++;
    }
    if (!m.controlsOpen) return [];
    const index = m.viewSegment.windowIndex;
    if (activeWindow !== index) {
      let step = plan?.windows.find(row => row.windowIndex === index), expected = step && rest(m, step.expectedEntry, m.tick);
      const match = expected && same(m.slots, expected.slots) && same(m.topologies, expected.topologies) && m.cursor === expected.cursor && m.sourceSlot === null
        && m.cells.every((c, i) => close(c.remainingChargeC, expected.charge[i], 1e-7) && close(c.temperatureC, expected.cellTemperature[i], 1e-7))
        && m.loads.every((l, i) => close(l.temperatureC, expected.loadTemperature[i], 1e-7));
      stats.cacheChecks.push({ observedTick: m.tick, windowIndex: index, matched: !!match });
      if (!match) { prepare(state); step = plan.windows[0]; }
      need(step.requiredTicks <= m.viewSegment.remainingTicks, 'Observed off window is too short for the planned ordinary keys');
      keys = [...step.keys]; keyIndex = 0; activeWindow = index;
    }
    if (keyIndex >= keys.length) { const step = plan.windows.find(row => row.windowIndex === index); need(same(m.slots, step.slots) && same(m.topologies, step.topologies) && m.sourceSlot === null, 'Completed actual configuration must match planned physical IDs'); return []; }
    const key = keys[keyIndex], configuration = { cursor: m.cursor, sourceSlot: m.sourceSlot, slots: [...m.slots], topologies: [...m.topologies] }, after = clone(configuration);
    let action = null;
    if (KEYS.includes(key)) after.cursor = predictFocus(m.cursor, key);
    else if (key === 'b') { need(m.sourceSlot === null, 'Topology key must not accidentally cancel a mark'); after.topologies[Math.floor(m.cursor / 3)] = m.topologies[Math.floor(m.cursor / 3)] === 'series' ? 'parallel' : 'series'; action = 'toggle-topology'; }
    else if (m.sourceSlot === null) { after.sourceSlot = m.cursor; action = 'mark-source'; }
    else { need(m.sourceSlot !== m.cursor, 'Planned swap requires two distinct slots'); [after.slots[m.sourceSlot], after.slots[m.cursor]] = [after.slots[m.cursor], after.slots[m.sourceSlot]]; after.sourceSlot = null; action = 'swap'; }
    pending = { key, tick: m.tick, cursor: m.cursor, expectedCursor: after.cursor, commandCount: m.commandCount, blockedCommands: m.blockedCommands, configuration, expectedConfiguration: after, action };
    releaseNext = true; stats.issued.push(clone(pending)); return [key];
  }
  pilot.prime = state => prepare(state, 'public-menu-or-pre-step-snapshot; no physical clock advanced');
  pilot.diagnostics = () => clone({ policy, ...stats }); return pilot;
}
const defaultPilot = createPilot();
export const keys = (state, context) => defaultPilot(state, context);
export const prime = state => defaultPilot.prime(state);
export function assertPublicBoard(m, assert) {
  shape(m); const p = m.physics, near = (a, b, text) => assert.ok(close(a, b), text ?? `${a} differs from ${b}`);
  assert.equal(m.elapsed, m.tick / p.tickHz); assert.equal(m.remaining, Math.max(0, (m.closeTick - m.tick) / p.tickHz));
  assert.equal(m.controlsOpen, m.phase === 'playing' && m.viewSegment.kind === 'window'); assert.equal(m.commandCount, m.commandReceipts.length);
  assert.equal(m.blockedCommands, m.blockedReceipts.length); assert.equal(m.navigationCount, m.navigationReceipts.length);
  assert.equal(m.swapCount, m.commandReceipts.filter(r => r.action === 'swap').length); assert.equal(m.topologyChangeCount, m.commandReceipts.filter(r => r.action === 'toggle-topology').length);
  for (const c of m.cells) { near(c.initialChargeC, c.consumedChargeC + c.remainingChargeC); assert.equal(c.slot, m.slots.indexOf(c.id));
    assert.equal(c.loadId, m.loads.find(l => l.slotIndices.includes(c.slot))?.id ?? null); near(p.cellThermalCapacityJK * (c.temperatureC - p.ambientC), c.generatedHeatJ - c.removedHeatJ); }
  for (const l of m.loads) { near(l.deliveredEnergyJ, l.creditedWorkJ + l.overflowEnergyJ + l.outOfBandEnergyJ); near(p.loadThermalCapacityJK * (l.temperatureC - p.ambientC), l.generatedHeatJ - l.removedHeatJ);
    for (const stage of l.stages) { near(stage.deficitJ, Math.max(0, stage.targetWorkJ - stage.workJ)); near(stage.deliveredEnergyJ, stage.workJ + stage.overflowEnergyJ + stage.outOfBandEnergyJ); } }
  near(m.chargeLedger.initialChargeC, m.cells.reduce((n, c) => n + c.initialChargeC, 0)); near(m.chargeLedger.remainingChargeC, m.cells.reduce((n, c) => n + c.remainingChargeC, 0)); near(m.chargeLedger.errorC, 0);
  near(m.cells.reduce((n, c) => n + c.sourceEnergyJ - c.generatedHeatJ, 0), m.loads.reduce((n, l) => n + l.deliveredEnergyJ, 0)); near(m.electricalLedger.errorJ, 0);
  assert.equal(m.score, m.phase === 'won' ? 1000 + 2 * Math.floor(m.remaining) + Math.floor(m.cells.reduce((n, c) => n + c.remainingChargeC, 0)) : 0);
  if (m.lastInterval) { assert.equal(m.lastInterval.tick, m.tick); assert.equal(m.lastInterval.fromTick, m.tick - 1); assert.equal(m.lastInterval.cells.length, 6); assert.equal(m.lastInterval.loads.length, 2); }
}
export function assertProgress({ after }, assert) {
  assertPublicBoard(after.model, assert); const m = after.model; assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won'); assert.deepEqual(m.failures, []);
  assert.equal(m.blockedCommands, 0); assert.ok(m.swapCount > 0 && m.topologyChangeCount > 0); assert.equal(m.workCompletionReceipts.length, 6);
  for (const load of m.loads) for (const stage of load.stages) assert.ok(stage.deficitJ <= m.physics.workCompletionToleranceJ);
}
export function assertRetry({ after, initial }, assert) {
  assertPublicBoard(after.model, assert); assert.equal(after.model.phase, 'playing'); assert.ok(after.model.tick >= 0 && after.model.tick < 120);
  for (const key of ['cells', 'slots', 'topologies', 'cursor', 'sourceSlot', 'commandCount', 'blockedCommands', 'swapCount', 'topologyChangeCount', 'commandReceipts', 'chargeLedger', 'electricalLedger']) assert.deepEqual(after.model[key], initial.model[key], 'Fresh retry restores ' + key);
  const physicalLoads = model => model.loads.map(({ lastElectrical, ...load }) => load);
  assert.deepEqual(physicalLoads(after.model), physicalLoads(initial.model), 'Fresh retry restores load resources; lastElectrical may truthfully describe a later idle-window tick');
}
