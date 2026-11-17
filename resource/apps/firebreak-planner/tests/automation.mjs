// Public rules only. This offline controller never imports the production Model or author plans.
export const budgets = { maxWebGLDrawCalls: 1 };
const DIRS = [{ key: 'ArrowUp', dr: -1, dc: 0, name: 'N' }, { key: 'ArrowRight', dr: 0, dc: 1, name: 'E' }, { key: 'ArrowDown', dr: 1, dc: 0, name: 'S' }, { key: 'ArrowLeft', dr: 0, dc: -1, name: 'W' }];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const need = (ok, message) => { if (!ok) throw Error(message); };
const distance = (a, b) => Math.abs(a.row - b.row) + Math.abs(a.column - b.column);
const physical = c => ({ status: c.status, heat: c.heat, fuelRemaining: c.fuelRemaining });
function structure(m) {
  need(Number.isInteger(m.rows) && Number.isInteger(m.columns) && m.rows > 0 && m.columns > 0 && m.rows * m.columns <= 100, 'Bounded public rectangular board required');
  need(m.cells.length === m.rows * m.columns && new Set(m.cells.map(c => c.id)).size === m.cells.length, 'Unique public cells required');
  const byId = new Map(), adjacent = m.cells.map(() => []);
  m.cells.forEach((c, i) => { need(c.row === Math.floor(i / m.columns) && c.column === i % m.columns, 'Public cells must be row-major'); byId.set(c.id, i); });
  m.cells.forEach((c, i) => DIRS.forEach(d => { const row = c.row + d.dr, column = c.column + d.dc; if (row >= 0 && row < m.rows && column >= 0 && column < m.columns) adjacent[i].push({ index: row * m.columns + column, direction: d.name }); }));
  need(m.physics.tickHz === 60 && m.physics.fireStepTicks === 120 && m.physics.ignitionHeat === 5, 'Unsupported public timing or ignition contract');
  need(Number.isInteger(m.ap.remaining) && m.ap.remaining >= 0 && m.ap.remaining <= 3, 'Bounded remaining AP required');
  return { byId, adjacent, physics: { ...m.physics }, weather: m.weather.map(w => ({ ...w })), minimum: m.forest.minimum, initialForest: m.forest.initial, timeTicks: Math.round(m.timeLimit * m.physics.tickHz) };
}
function windAt(g, step) { let wind = null; for (const w of g.weather) if (w.from <= step) wind = w.direction; need(DIRS.some(d => d.name === wind), 'Missing public wind'); return wind; }
function copyState(s) { return { ...s, cells: s.cells.map(c => ({ ...c })), cursor: { ...s.cursor } }; }
function fromPublic(m) { return { tick: m.tick, fireStep: m.fireStep, cells: m.cells.map(c => ({ ...c })), cursor: { ...m.cursor }, ap: m.ap.remaining, phase: m.phase, reason: m.lostReason, burned: m.fuel.burned, clearedFuel: m.fuel.cleared }; }
function totals(s) { return { standing: s.cells.filter(c => c.terrain === 'forest' && c.status === 'standing').length, burning: s.cells.filter(c => c.status === 'burning').length, destroyed: s.cells.filter(c => c.terrain === 'village' && c.status === 'destroyed').length }; }
function settle(g, s) {
  const n = totals(s);
  s.reason = n.destroyed ? 'village' : n.standing < g.minimum ? 'forest' : n.burning === 0 ? null : s.tick >= g.timeTicks ? 'timeout' : null;
  s.phase = s.reason ? 'lost' : n.burning === 0 ? 'won' : 'playing';
}
function wave(g, s) {
  const old = s.cells.map((c, i) => c.status === 'burning' ? i : -1).filter(i => i >= 0), sums = new Array(s.cells.length).fill(0);
  const wind = windAt(g, s.fireStep + 1), opposite = DIRS[(DIRS.findIndex(d => d.name === wind) + 2) % 4].name;
  for (const i of old) for (const edge of g.adjacent[i]) {
    const c = s.cells[edge.index];
    if (c.terrain === 'forest' && c.status === 'standing' || c.terrain === 'village' && c.status === 'intact')
      sums[edge.index] += edge.direction === wind ? g.physics.downwindHeat : edge.direction === opposite ? g.physics.upwindHeat : g.physics.crosswindHeat;
  }
  s.cells.forEach((c, i) => { if (sums[i]) { c.heat = Math.min(g.physics.ignitionHeat, c.heat + sums[i]); if (c.heat === g.physics.ignitionHeat) { c.status = c.terrain === 'village' ? 'destroyed' : 'burning'; if (c.terrain === 'forest') c.fuelRemaining = c.initialFuel; } } });
  for (const i of old) { const c = s.cells[i]; c.fuelRemaining--; s.burned++; if (c.fuelRemaining === 0) { c.status = 'burnt'; c.heat = 0; } }
  s.fireStep++;
}
function advance(g, s, targetTick) {
  while (s.phase === 'playing' && (s.fireStep + 1) * g.physics.fireStepTicks <= targetTick) { s.tick = (s.fireStep + 1) * g.physics.fireStepTicks; wave(g, s); settle(g, s); }
  if (s.phase === 'playing') { s.tick = Math.min(targetTick, g.timeTicks); settle(g, s); }
  return s;
}
function clearAt(g, s, cellId, tick) {
  need(Number.isInteger(tick) && tick > s.tick, 'Hypothetical clear must be in a future tick');
  advance(g, s, tick - 1); if (s.phase !== 'playing') return false;
  const i = g.byId.get(cellId), c = s.cells[i];
  if (!c || c.terrain !== 'forest' || c.status !== 'standing' || s.ap <= 0) return false;
  s.tick = tick; s.cursor = { row: c.row, column: c.column }; s.ap--; s.clearedFuel += c.fuelRemaining;
  c.status = 'cleared'; c.heat = 0; c.fuelRemaining = 0;
  if (tick === (s.fireStep + 1) * g.physics.fireStepTicks) wave(g, s);
  settle(g, s); return true;
}
function output(g, s) { return { phase: s.phase, reason: s.reason, tick: s.tick, elapsed: s.tick / g.physics.tickHz, fireStep: s.fireStep, apRemaining: s.ap, ...totals(s), cells: s.cells.map(c => ({ id: c.id, ...physical(c) })), fuelBurned: s.burned, fuelCleared: s.clearedFuel }; }
export function predictRun(m, edits = []) {
  const g = structure(m), s = fromPublic(m);
  for (const edit of edits) if (!clearAt(g, s, edit.cellId, edit.tick)) return { ...output(g, s), valid: false, invalidCellId: edit.cellId };
  advance(g, s, g.timeTicks); return { ...output(g, s), valid: true };
}
function limits(options) {
  const value = { keyIntervalTicks: 20, settleTicks: 48, maxNodes: 20000, maxMilliseconds: 2000, ...options };
  for (const k of ['keyIntervalTicks', 'settleTicks', 'maxNodes', 'maxMilliseconds']) need(Number.isFinite(value[k]) && value[k] > 0 && Number.isInteger(value[k]), 'Finite positive integer planner limit required: ' + k);
  need(value.maxNodes <= 100000 && value.maxMilliseconds <= 3000, 'Planner cap exceeds public offline bounds'); return value;
}
function schedule(g, start, ids, l) {
  const s = copyState(start), edits = [];
  for (const cellId of ids) { const c = s.cells[g.byId.get(cellId)]; if (!c) return null; const tick = s.tick + 1 + distance(s.cursor, c) * l.keyIntervalTicks; edits.push({ cellId, tick }); if (!clearAt(g, s, cellId, tick)) return null; if (s.phase !== 'playing') break; advance(g, s, s.tick + l.settleTicks); if (s.phase !== 'playing') break; }
  advance(g, s, g.timeTicks); return { edits, prediction: output(g, s) };
}
// A graph ordering heuristic only: rank cuts by forest/villages disconnected from visible fires.
// The actual acceptance condition always comes from the public simultaneous-heat forecast above.
function threatened(g, s, removed = -1) {
  const seen = new Set(), queue = [];
  s.cells.forEach((c, i) => { if (i !== removed && c.status === 'burning') { seen.add(i); queue.push(i); } });
  const villages = new Set();
  for (let head = 0; head < queue.length; head++) for (const e of g.adjacent[queue[head]]) {
    if (e.index === removed) continue; const c = s.cells[e.index];
    if (c.terrain === 'village' && c.status === 'intact') villages.add(e.index);
    if (c.terrain === 'forest' && ['standing', 'burning'].includes(c.status) && !seen.has(e.index)) { seen.add(e.index); queue.push(e.index); }
  }
  return { forest: seen.size, villages: villages.size };
}
export function planVisibleState(m, options = {}) {
  const g = structure(m), l = limits(options), started = performance.now(), initial = fromPublic(m); let nodes = 0, evaluatedLeaves = 0;
  function search(s, path) {
    nodes++; need(nodes <= l.maxNodes, 'Public search node cap reached'); need(performance.now() - started <= l.maxMilliseconds, 'Public search wall-time cap reached');
    const idle = advance(g, copyState(s), g.timeTicks); evaluatedLeaves++;
    if (idle.phase === 'won') return { cellIds: path, prediction: output(g, idle) };
    if (s.phase !== 'playing' || s.ap === 0) return null;
    const baseline = threatened(g, s);
    const candidates = s.cells.map((c, index) => ({ c, index })).filter(({ c }) => c.terrain === 'forest' && c.status === 'standing').map(({ c, index }) => {
      const after = threatened(g, s, index); return { c, index, rank: (baseline.villages - after.villages) * 100 + (baseline.forest - after.forest - 1) * 4 - distance(s.cursor, c) };
    }).sort((a, b) => b.rank - a.rank || b.c.heat - a.c.heat || a.index - b.index);
    for (const { c } of candidates) {
      const next = copyState(s), tick = next.tick + 1 + distance(next.cursor, c) * l.keyIntervalTicks;
      if (!clearAt(g, next, c.id, tick)) continue;
      if (next.phase === 'playing') advance(g, next, next.tick + l.settleTicks);
      const found = search(next, [...path, c.id]); if (found) return found;
    }
    return null;
  }
  const found = search(initial, []);
  return { found: !!found, ...(found ?? { cellIds: [], prediction: null }), nodes, evaluatedLeaves, wallMilliseconds: performance.now() - started, limits: l,
    scope: 'Bounded public event search; first feasible ordered clear plan under disclosed input-delay assumptions, not an optimality or arbitrary browser-latency guarantee.' };
}
function navigation(cursor, target) { return target.column > cursor.column ? 'ArrowRight' : target.column < cursor.column ? 'ArrowLeft' : target.row > cursor.row ? 'ArrowDown' : target.row < cursor.row ? 'ArrowUp' : null; }
export function createPilot({ policy = 'contain', plannerOptions = {} } = {}) {
  need(['contain', 'waste-ap'].includes(policy), 'Unknown public policy'); const l = limits(plannerOptions);
  let identity = null, lastTick = -1, releaseNext = false, pending = null, plan = null, targetId = null, settleUntil = 0, viewAttempted = false;
  let stats = { plans: [], acknowledged: [], issued: [], observedClears: 0 };
  function reset(m) { identity = `${m.level}:${m.seed}`; lastTick = m.tick; releaseNext = false; pending = null; plan = null; targetId = null; settleUntil = 0; viewAttempted = false; stats = { plans: [], acknowledged: [], issued: [], observedClears: 0 }; }
  function issue(key, kind, m, extra = {}) { pending = { kind, key, tick: m.tick, commandCount: m.commandCount, clearCount: m.clearCount, ap: m.ap.remaining, cursor: { ...m.cursor }, ...extra }; stats.issued.push({ tick: m.tick, key, kind, cellId: extra.cellId ?? null }); releaseNext = true; return [key]; }
  function pilot(state, { mode = 'qa' } = {}) {
    const m = state?.model; if (!m) return [];
    if (identity !== `${m.level}:${m.seed}` || m.tick < lastTick) reset(m); lastTick = m.tick;
    if (state.phase !== 'playing' || state.paused || m.phase !== 'playing') return [];
    if (releaseNext) { releaseNext = false; return []; }
    if (pending) {
      const p = pending; let applied = false;
      if (p.kind === 'navigate') applied = !same(m.cursor, p.cursor);
      else if (m.commandCount > p.commandCount) {
        const op = m.lastOperation; need(m.commandCount === p.commandCount + 1 && op.id === m.commandCount && op.tick > p.tick && op.at === op.tick / 60, 'Actual operation receipt must follow the issued key');
        if (p.kind === 'view') need(op.type === 'view' && m.viewHeat === p.expectedView && m.ap.remaining === p.ap && m.clearCount === p.clearCount, 'B must only toggle the public view');
        else {
          need(op.type === 'clear' && op.cellId === p.cellId && op.before.status === 'standing' && op.before.fuelRemaining === p.initialFuel && same(physical(op.after), { status: 'cleared', heat: 0, fuelRemaining: 0 }), 'Actual clear must preserve its selected physical cell and discard its standing fuel');
          need(op.apBefore === p.ap && op.apAfter === p.ap - 1 && m.ap.remaining === p.ap - 1 && m.clearCount === p.clearCount + 1, 'Every actual clear spends exactly one AP');
          need(m.cells.find(c => c.id === p.cellId)?.status === 'cleared', 'A clear cannot silently re-ignite');
          need(same(m.clearReceipts.at(-1), op), 'The permanent cut receipt must be the actual accepted operation');
          stats.observedClears++; settleUntil = op.tick + (mode === 'record' ? 36 : 12); targetId = null; plan = null;
        }
        applied = true;
      }
      if (!applied) { need(m.tick - p.tick <= 90, 'An issued ordinary input was not observed'); return []; }
      stats.acknowledged.push({ kind: p.kind, issuedTick: p.tick, observedTick: m.tick, cursor: { ...m.cursor }, operation: p.kind === 'navigate' ? null : structuredClone(m.lastOperation) }); pending = null;
    }
    if (!viewAttempted) { viewAttempted = true; if (!m.viewHeat) return issue('b', 'view', m, { expectedView: true }); }
    if (m.tick < settleUntil) return [];
    if (policy === 'waste-ap') {
      if (m.ap.remaining === 0) return [];
      if (!targetId || m.cells.find(c => c.id === targetId)?.status !== 'standing') {
        const fire = m.cells.filter(c => c.status === 'burning');
        const candidates = m.cells.filter(c => c.terrain === 'forest' && c.status === 'standing').map((c, i) => ({ c, i, nearest: Math.min(...fire.map(f => distance(c, f))) })).sort((a, b) => b.nearest - a.nearest || a.i - b.i);
        targetId = candidates[0]?.c.id ?? null; if (!targetId) return [];
      }
    } else {
      if (!plan) { plan = planVisibleState(m, l); stats.plans.push({ observedTick: m.tick, ...structuredClone(plan) }); need(plan.found, 'No public feasible firebreak plan within the disclosed finite search'); targetId = plan.cellIds[0] ?? null; return []; }
      if (!targetId) return [];
      const check = schedule(structure(m), fromPublic(m), plan.cellIds, l);
      // After a possibly costly plan, the next real observation validates its actions again.
      if (!check || check.prediction.phase !== 'won') { plan = null; targetId = null; return []; }
    }
    const target = m.cells.find(c => c.id === targetId); need(target?.status === 'standing', 'The actual target must still be standing');
    const key = navigation(m.cursor, target); if (key) return issue(key, 'navigate', m);
    return issue('Space', 'clear', m, { cellId: target.id, initialFuel: target.initialFuel });
  }
  pilot.diagnostics = () => structuredClone({ policy, ...stats }); return pilot;
}
const sharedPilot = createPilot();
export const keys = (state, context) => sharedPilot(state, context);
export function assertPublicBoard(m, assert) {
  const g = structure(m), eq = (actual, expected, message) => assert.deepEqual(actual, expected, message);
  const counts = Object.fromEntries(['standing', 'burning', 'burnt', 'cleared'].map(status => [status, m.cells.filter(c => c.terrain === 'forest' && c.status === status).length]));
  const initial = m.cells.filter(c => c.terrain === 'forest').length;
  eq(m.forest, { initial, minimum: Math.floor((7 * initial + 9) / 10), numerator: 7, denominator: 10, ...counts }, 'Forest loss uses the fixed initial denominator');
  const villages = m.cells.filter(c => c.terrain === 'village'); eq(m.villages, { initial: villages.length, intact: villages.filter(c => c.status === 'intact').length, destroyed: villages.filter(c => c.status === 'destroyed').length });
  eq(m.ap.initial, m.ap.remaining + m.ap.spent); eq(m.ap.spent, m.clearCount); eq(m.clearReceipts.length, m.clearCount); eq(counts.cleared, m.clearCount);
  eq(m.fuel.initial, m.cells.reduce((n, c) => n + c.initialFuel, 0)); eq(m.fuel.remaining, m.cells.reduce((n, c) => n + c.fuelRemaining, 0));
  eq(m.fuel.cleared, m.cells.filter(c => c.status === 'cleared').reduce((n, c) => n + c.initialFuel, 0)); eq(m.fuel.error, 0); eq(m.fuel.initial, m.fuel.remaining + m.fuel.burned + m.fuel.cleared);
  for (const c of m.cells) { assert.ok(Number.isInteger(c.heat) && c.heat >= 0 && c.heat <= g.physics.ignitionHeat); assert.ok(Number.isInteger(c.fuelRemaining) && c.fuelRemaining >= 0 && c.fuelRemaining <= c.initialFuel); if (c.status === 'standing') eq(c.fuelRemaining, c.initialFuel); if (c.status === 'burnt' || c.status === 'cleared') eq(physical(c), { status: c.status, heat: 0, fuelRemaining: 0 }); }
  eq(m.elapsed, m.tick / 60); eq(m.remaining, Math.max(0, m.timeLimit - m.elapsed)); eq(m.nextFireTick, (m.fireStep + 1) * 120); eq(m.secondsToFireStep, (m.nextFireTick - m.tick) / 60); eq(m.nextWind, windAt(g, m.fireStep + 1)); eq(m.lastWind, m.fireStep ? windAt(g, m.fireStep) : null);
  eq(m.score, m.phase === 'won' ? 1000 + 10 * counts.standing + 25 * m.ap.remaining : 0);
  if (m.lastWave) { eq(m.lastWave.step, m.fireStep); eq(m.lastWave.toTick, m.fireStep * 120); eq(m.lastWave.fromTick, m.lastWave.toTick - 1); eq(m.lastWave.previousWaveTick, m.lastWave.toTick - 120); eq(m.lastWave.wind, m.lastWind); eq(m.lastWave.fuelConsumed, m.lastWave.oldBurningIds.length); }
  if (m.commandCount) { eq(m.lastOperation.id, m.commandCount); eq(m.lastOperation.at, m.lastOperation.tick / 60); }
}
export function assertProgress({ before, after }, assert) {
  assertPublicBoard(after.model, assert); const m = after.model;
  assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won'); assert.equal(m.lostReason, null); assert.equal(m.forest.burning, 0); assert.equal(m.villages.destroyed, 0);
  assert.ok(m.forest.standing >= m.forest.minimum && m.clearCount > 0 && m.fireStep > 0 && m.fuel.burned > 0);
  assert.equal(m.blockedCommands, 0); assert.equal(m.forest.initial, before.model.forest.initial); assert.equal(m.fuel.initial, before.model.fuel.initial);
}
export function assertRetry({ after, initial }, assert) {
  assertPublicBoard(after.model, assert);
  assert.equal(after.model.phase, 'playing'); assert.ok(after.model.tick >= 0 && after.model.tick < after.model.physics.fireStepTicks, 'Retry observed before its first fire step');
  const fields = ['phase', 'score', 'cells', 'cursor', 'viewHeat', 'ap', 'clearCount', 'clearReceipts', 'forest', 'villages', 'fuel', 'weather', 'fireStep', 'lastWind', 'nextWind', 'lastWave', 'commandCount', 'blockedCommands'];
  for (const key of fields) assert.deepEqual(after.model[key], initial.model[key], 'Retry restores ' + key);
}
