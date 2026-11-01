// Public geometry, physical D3 permutations, bounded color CSP, ordinary keys.
// No production Model import, authored answer, hidden field, or live-state write.
export const budgets = { maxWebGLDrawCalls: 3 };
const DIRECTIONS = [
  { name: 'N', key: 'ArrowUp', dx: 0, dy: -1 },
  { name: 'E', key: 'ArrowRight', dx: 1, dy: 0 },
  { name: 'S', key: 'ArrowDown', dx: 0, dy: 1 },
  { name: 'W', key: 'ArrowLeft', dx: -1, dy: 0 },
];
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const transformed = (ids, kind) => kind === 'rotate' ? [ids[2], ids[0], ids[1]] : [ids[0], ids[2], ids[1]];
export const publicAssignments = m => m.tiles.map(t => ({ tileId: t.id, slotSectorIds: [...t.slotSectorIds] }));

function context(m) {
  if (m.tiles?.length !== 6 || m.vertices?.length !== 7 || m.sectors?.length !== 18 || m.colors?.length !== 3) throw Error('Expected six public triangles, seven vertices and eighteen physical sectors');
  const colors = m.colors.map(c => c.id), vertices = m.vertices.map(v => ({ id: v.id, u: v.u, v: v.v }));
  const sectors = m.sectors.map(s => ({ id: s.id, tileId: s.tileId, mark: s.mark, colorId: s.colorId }));
  const tiles = m.tiles.map(t => ({ id: t.id, vertexIds: [...t.vertexIds] }));
  const vi = new Map(vertices.map((v, i) => [v.id, i])), ti = new Map(tiles.map((t, i) => [t.id, i])), si = new Map(sectors.map((s, i) => [s.id, i]));
  if (new Set(colors).size !== 3 || vi.size !== 7 || ti.size !== 6 || si.size !== 18 || vertices.some(v => !Number.isSafeInteger(v.u) || !Number.isSafeInteger(v.v))) throw Error('Unique IDs and integer public vertices are required');
  if (new Set(vertices.map(v => `${v.u},${v.v}`)).size !== vertices.length) throw Error('Public geometric vertices must be distinct');
  for (const s of sectors) if (!ti.has(s.tileId) || !colors.includes(s.colorId) || ![1, 2, 3].includes(s.mark)) throw Error('Invalid physical sector ownership, mark or color');
  for (const t of tiles) {
    if (t.vertexIds.length !== 3 || new Set(t.vertexIds).size !== 3 || t.vertexIds.some(id => !vi.has(id))) throw Error('Invalid triangle vertices');
    const [a, b, c] = t.vertexIds.map(id => vertices[vi.get(id)]);
    if ((b.u - a.u) * (c.v - a.v) === (b.v - a.v) * (c.u - a.u)) throw Error('Degenerate public triangle');
    const owned = sectors.filter(s => s.tileId === t.id);
    if (owned.length !== 3 || new Set(owned.map(s => s.mark)).size !== 3) throw Error('Each tile must retain exactly three uniquely marked physical sectors');
  }
  const edges = [], byVertices = new Map();
  tiles.forEach((t, tileIndex) => t.vertexIds.forEach((a, slotIndex) => {
    const ids = [a, t.vertexIds[(slotIndex + 1) % 3]].sort((x, y) => vi.get(x) - vi.get(y)), key = ids.join('|');
    let edge = byVertices.get(key);
    if (!edge) { edge = { id: `E${edges.length + 1}`, vertexIds: ids, incidences: [] }; edges.push(edge); byVertices.set(key, edge); }
    edge.incidences.push({ tileId: t.id, tileIndex, slotIndex });
  }));
  if (edges.length !== 12 || edges.filter(e => e.incidences.length === 2).length !== 6 || edges.some(e => e.incidences.length > 2)) throw Error('Expected the approved six shared-edge fan geometry');
  const targets = Object.fromEntries(colors.map(id => [id, m.targetRegions[id]]));
  if (colors.some(id => !Number.isInteger(targets[id]) || targets[id] < 1 || targets[id] > 18)) throw Error('Finite positive exact region targets required');
  return { colors, vertices, sectors, tiles, edges, vi, ti, si, targets };
}

function positions(c, assignments) {
  if (!Array.isArray(assignments) || assignments.length !== c.tiles.length) throw Error('Every public tile needs one physical assignment');
  const byTile = new Map(assignments.map(a => [a.tileId, a.slotSectorIds]));
  if (byTile.size !== c.tiles.length) throw Error('Duplicate tile assignment');
  return c.tiles.map(t => {
    const ids = byTile.get(t.id);
    if (!Array.isArray(ids) || ids.length !== 3 || new Set(ids).size !== 3 || ids.some(id => !c.si.has(id) || c.sectors[c.si.get(id)].tileId !== t.id)) throw Error('Lost, duplicated or foreign physical sector');
    return [...ids];
  });
}

function evaluate(c, slots) {
  const parent = c.sectors.map((_, i) => i);
  const find = n => { while (parent[n] !== n) n = parent[n]; return n; };
  const join = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[b] = a; };
  const color = id => c.sectors[c.si.get(id)].colorId;
  // All three radial sector pairs share a segment, never just a point.
  for (const ids of slots) for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) if (color(ids[a]) === color(ids[b])) join(c.si.get(ids[a]), c.si.get(ids[b]));
  const edges = c.edges.map(e => {
    const ids = e.incidences.map(p => slots[p.tileIndex][p.slotIndex]), colorIds = ids.map(color), shared = ids.length === 2, matched = shared ? colorIds[0] === colorIds[1] : null;
    if (matched) join(c.si.get(ids[0]), c.si.get(ids[1]));
    return { id: e.id, vertexIds: [...e.vertexIds], incidences: e.incidences.map(({ tileId, slotIndex }) => ({ tileId, slotIndex })), shared, colorIds, matched };
  });
  const groups = new Map();
  c.sectors.forEach((s, i) => { const key = find(i); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(s.id); });
  const regions = [...groups.values()].map(ids => ({ id: `region-${ids[0]}`, colorId: color(ids[0]), sectorIds: ids, tileIds: c.tiles.filter(t => ids.some(id => c.sectors[c.si.get(id)].tileId === t.id)).map(t => t.id) }));
  regions.sort((a, b) => c.colors.indexOf(a.colorId) - c.colors.indexOf(b.colorId) || c.si.get(a.sectorIds[0]) - c.si.get(b.sectorIds[0]));
  const regionCounts = Object.fromEntries(c.colors.map(id => [id, regions.filter(r => r.colorId === id).length]));
  const colorRegions = c.colors.map(id => ({ colorId: id, actual: regionCounts[id], target: c.targets[id], matched: regionCounts[id] === c.targets[id] }));
  const matchingEdgeIds = edges.filter(e => e.shared && e.matched).map(e => e.id), conflictEdgeIds = edges.filter(e => e.shared && !e.matched).map(e => e.id);
  const matchedRegionColorCount = colorRegions.filter(r => r.matched).length, allEdgesMatched = conflictEdgeIds.length === 0, allRegionsMatched = matchedRegionColorCount === c.colors.length;
  return { assignments: c.tiles.map((t, i) => ({ tileId: t.id, slotSectorIds: [...slots[i]] })), edges, regions, regionCounts, colorRegions, sharedEdgeCount: matchingEdgeIds.length + conflictEdgeIds.length, matchedEdgeCount: matchingEdgeIds.length, matchingEdgeIds, conflictEdgeIds, matchedRegionColorCount, allEdgesMatched, allRegionsMatched, goalReady: allEdgesMatched && allRegionsMatched };
}

export function evaluateBoard(m, assignments = publicAssignments(m)) { const c = context(m); return evaluate(c, positions(c, assignments)); }
export function predictOperation(m, kind, tileId = m.selectedId) {
  if (!['rotate', 'mirror'].includes(kind)) throw Error('Expected rotate or mirror, never undo');
  const c = context(m), slots = positions(c, publicAssignments(m)), index = c.ti.get(tileId);
  if (index === undefined) throw Error('Unknown public tile');
  const beforeSectorIds = [...slots[index]], afterSectorIds = transformed(beforeSectorIds, kind), colors = ids => ids.map(id => c.sectors[c.si.get(id)].colorId);
  slots[index] = afterSectorIds;
  const result = evaluate(c, slots), beforeColors = colors(beforeSectorIds), afterColors = colors(afterSectorIds);
  return { kind, tileId, beforeSectorIds, afterSectorIds, beforeColors, afterColors, colorChanged: !equal(beforeColors, afterColors), cost: 1, matchedEdgeCount: result.matchedEdgeCount, regionCounts: result.regionCounts, allEdgesMatched: result.allEdgesMatched, allRegionsMatched: result.allRegionsMatched, willWin: result.goalReady, willExhaustMoves: m.movesUsed + 1 >= m.moveLimit && !result.goalReady };
}

function orientations(c, start) {
  const queue = [{ ids: [...start], word: [] }], seen = new Set([start.join('|')]);
  for (let i = 0; i < queue.length; i++) for (const kind of ['rotate', 'mirror']) {
    const ids = transformed(queue[i].ids, kind), key = ids.join('|');
    if (!seen.has(key)) { seen.add(key); queue.push({ ids, word: [...queue[i].word, kind] }); }
  }
  const byColors = new Map();
  for (const state of queue) { const colors = state.ids.map(id => c.sectors[c.si.get(id)].colorId), key = colors.join('|'); if (!byColors.has(key)) byColors.set(key, { ...state, colors, cost: state.word.length }); }
  // Goal depends on colors; each retained representative is a real cheapest
  // physical permutation reachable from this actual starting arrangement.
  return [...byColors.values()].sort((a, b) => a.cost - b.cost || a.ids.join('|').localeCompare(b.ids.join('|')));
}

export function planVisibleState(m, options = {}) {
  const goal = options.goal ?? 'goal', maxExpanded = options.maxExpanded ?? 100000, maxMilliseconds = options.maxMilliseconds ?? 2500, maxMoves = options.maxMoves ?? m.movesRemaining;
  if (!['goal', 'edges-only'].includes(goal) || !Number.isInteger(maxExpanded) || maxExpanded < 1 || maxExpanded > 1000000 || !Number.isFinite(maxMilliseconds) || maxMilliseconds <= 0 || !Number.isInteger(maxMoves) || maxMoves < 0 || maxMoves > 90) throw Error('Invalid explicit bounded public CSP parameters');
  const c = context(m), initial = positions(c, publicAssignments(m)), domains = initial.map(ids => orientations(c, ids)), shared = c.edges.filter(e => e.incidences.length === 2);
  const started = performance.now(), deadline = started + maxMilliseconds, assigned = Array(c.tiles.length).fill(null);
  let expanded = 0, completeAssignments = 0, limited = null, best = null;
  const withinTime = () => { if (performance.now() > deadline) { limited = 'time-cap'; return false; } return true; };
  function compatible(tileIndex, state) {
    for (const edge of shared) {
      const a = edge.incidences.find(p => p.tileIndex === tileIndex); if (!a) continue;
      const b = edge.incidences.find(p => p.tileIndex !== tileIndex);
      if (assigned[b.tileIndex] && state.colors[a.slotIndex] !== assigned[b.tileIndex].colors[b.slotIndex]) return false;
    }
    return true;
  }
  function visit(cost, depth) {
    if (limited || !withinTime()) return;
    if (expanded >= maxExpanded) { limited = 'node-cap'; return; }
    expanded++;
    if (cost > maxMoves || best && cost >= best.cost) return;
    if (depth === c.tiles.length) {
      completeAssignments++;
      const result = evaluate(c, assigned.map(a => a.ids));
      if (!(goal === 'goal' ? result.goalReady : result.allEdgesMatched && !result.allRegionsMatched)) return;
      const operations = assigned.flatMap((state, i) => state.word.map(kind => ({ tileId: c.tiles[i].id, kind })));
      if (goal !== 'goal' && operations.length >= m.movesRemaining) return;
      // A negative target must be reachable without accidentally winning first.
      const replay = initial.map(ids => [...ids]);
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i], index = c.ti.get(op.tileId); replay[index] = transformed(replay[index], op.kind);
        if (evaluate(c, replay).goalReady && (goal !== 'goal' || i !== operations.length - 1)) return;
      }
      best = { cost, operations, assignments: result.assignments, evaluation: result };
      return;
    }
    let chosen = -1, choices = null, lowerBound = cost;
    for (let i = 0; i < assigned.length; i++) if (!assigned[i]) {
      const available = domains[i].filter(state => compatible(i, state)); if (!available.length) return;
      lowerBound += available[0].cost;
      if (choices === null || available.length < choices.length) { chosen = i; choices = available; }
    }
    if (lowerBound > maxMoves || best && lowerBound >= best.cost) return;
    for (const state of choices) { if (!withinTime() || limited) return; assigned[chosen] = state; visit(cost + state.cost, depth + 1); assigned[chosen] = null; }
  }
  visit(0, 0);
  const stats = { expanded, completeAssignments, colorDomainSizes: domains.map(d => d.length), milliseconds: performance.now() - started };
  if (limited) return { found: false, reason: limited, ...stats };
  return best ? { found: true, goal, ...best, optimalWithinPublicBudget: goal === 'goal', negativeRouteScope: goal === 'edges-only' ? 'canonical shortest physical words in public tile order; intermediate wins excluded' : null, ...stats } : { found: false, reason: goal === 'goal' ? 'no-public-solution-within-budget' : 'no-canonical-edge-only-route-within-budget', ...stats };
}

function focusItems(m) {
  const items = m.focusItems.map(i => ({ id: i.id, kind: i.kind, x: i.x, y: i.y }));
  if (items.length !== 6 || new Set(items.map(i => i.id)).size !== 6 || items.some(i => i.kind !== 'tile' || !Number.isFinite(i.x) || !Number.isFinite(i.y) || !m.tiles.some(t => t.id === i.id))) throw Error('Invalid finite tile focus graph');
  return items;
}
function nextFocus(items, selectedId, direction) {
  const origin = items.find(i => i.id === selectedId); if (!origin) throw Error('Unknown selected public tile');
  const d2 = p => p.dx ** 2 + p.dy ** 2, perp = p => Math.abs(direction.dx ? p.dy : p.dx);
  const choices = items.map((item, index) => ({ item, index, dx: item.x - origin.x, dy: item.y - origin.y })).filter(p => p.dx * direction.dx + p.dy * direction.dy > 0);
  choices.sort((a, b) => d2(a) + 2 * perp(a) ** 2 - d2(b) - 2 * perp(b) ** 2 || d2(a) - d2(b) || perp(a) - perp(b) || a.index - b.index);
  return choices[0]?.item.id ?? selectedId;
}
export function predictFocus(m, direction) { const d = DIRECTIONS.find(d => d.name === direction); if (!d) throw Error('Unknown cardinal direction'); return nextFocus(focusItems(m), m.selectedId, d); }
export function focusPath(m, targetId) {
  const items = focusItems(m); if (!items.some(i => i.id === targetId)) throw Error('Unknown target tile focus');
  const queue = [{ id: m.selectedId, path: [] }], seen = new Set([m.selectedId]);
  for (let i = 0; i < queue.length; i++) { const current = queue[i]; if (current.id === targetId) return current.path; for (const d of DIRECTIONS) { const id = nextFocus(items, current.id, d); if (!seen.has(id)) { seen.add(id); queue.push({ id, path: [...current.path, d.name] }); } } }
  throw Error('Public tile focus graph is unreachable');
}

const LEDGER = ['movesUsed', 'movesRemaining', 'rotationCount', 'mirrorCount', 'historyDepth'];
export function createPilot() {
  let previousElapsed = null, stage = null, record = false, due = 0, pending = null, task = null, trial = null, neutralTick = -1;
  const diagnostics = [];
  const note = (type, data = {}) => { if (diagnostics.length < 500) diagnostics.push({ type, ...data }); };
  function reset() { stage = null; due = 0; pending = null; task = null; trial = null; neutralTick = -1; diagnostics.length = 0; }
  function issue(m, kind, keys, details = {}) {
    pending = { kind, releaseNext: true, issuedAt: m.elapsed, beforeSelected: m.selectedId, beforeAssignments: publicAssignments(m), ledger: Object.fromEntries(LEDGER.map(k => [k, m[k]])), ...details };
    note('ordinary-input', { elapsed: m.elapsed, kind, keys }); return keys;
  }
  function pilot(state, options = {}) {
    if (state.phase !== 'playing' || state.paused) return [];
    const m = state.model;
    if (previousElapsed !== null && m.elapsed < previousElapsed) reset(); previousElapsed = m.elapsed;
    if (stage === null) { record = options.mode === 'record'; stage = record && m.movesUsed === 0 ? 'trial' : 'solution'; due = m.elapsed + (record ? 2 : .2); note('observed-round', { elapsed: m.elapsed, level: m.level, stage }); }
    if (pending) {
      if (pending.releaseNext) { pending.releaseNext = false; neutralTick = m.tick; return []; }
      if (m.tick <= neutralTick) return [];
      let observed = false;
      if (pending.kind === 'navigate') {
        if (!equal(publicAssignments(m), pending.beforeAssignments) || LEDGER.some(k => m[k] !== pending.ledger[k])) throw Error('Navigation changed physical sectors or charged an operation');
        if (m.selectedId !== pending.beforeSelected) { observed = true; due = m.elapsed + (record ? .18 : .02); note('observed-focus', { elapsed: m.elapsed, selectedId: m.selectedId, expectedId: pending.expectedId }); }
      } else {
        if (m.movesUsed > pending.ledger.movesUsed + 1) throw Error('One ordinary key edge charged more than one transform');
        if (m.movesUsed === pending.ledger.movesUsed + 1) {
          const p = pending.predicted, expected = pending.beforeAssignments.map(a => a.tileId === p.tileId ? { tileId: a.tileId, slotSectorIds: p.afterSectorIds } : a), e = m.lastOperation;
          if (!equal(publicAssignments(m), expected) || m.selectedId !== p.tileId || m.movesRemaining !== pending.ledger.movesRemaining - 1 || m.historyDepth !== pending.ledger.historyDepth + 1 || m.rotationCount !== pending.ledger.rotationCount + Number(p.kind === 'rotate') || m.mirrorCount !== pending.ledger.mirrorCount + Number(p.kind === 'mirror')) throw Error('Actual transform disagrees with physical IDs, operation kind, focus or charged budget');
          if (!e || e.id !== m.movesUsed || !equal(e, m.history.at(-1)) || e.at < pending.issuedAt || e.at > m.elapsed || ['kind', 'tileId', 'beforeSectorIds', 'afterSectorIds', 'beforeColors', 'afterColors', 'colorChanged'].some(k => !equal(e[k], p[k]))) throw Error('Actual permanent transform receipt differs from public prediction');
          observed = true; task = null;
          note('observed-operation', { elapsed: m.elapsed, receipt: structuredClone(e), assignments: publicAssignments(m), movesUsed: m.movesUsed, movesRemaining: m.movesRemaining, matchedEdgeCount: m.matchedEdgeCount, regionCounts: m.regionCounts });
          if (stage === 'trial') { trial = { tileId: p.tileId, beforeAssignments: pending.beforeAssignments, originalMovesUsed: pending.ledger.movesUsed }; stage = 'restore'; due = m.elapsed + 4.2; }
          else if (stage === 'restore') {
            if (!equal(publicAssignments(m), trial.beforeAssignments) || m.movesUsed !== trial.originalMovesUsed + 2) throw Error('Two real mirrors must restore all physical sectors while permanently consuming two moves');
            stage = 'solution'; due = m.elapsed + 4.2; note('observed-double-mirror-restored', { elapsed: m.elapsed, movesUsed: m.movesUsed, movesRemaining: m.movesRemaining, assignments: publicAssignments(m) });
          } else due = m.elapsed + (record ? .7 : .05);
        } else if (!equal(publicAssignments(m), pending.beforeAssignments) || LEDGER.some(k => m[k] !== pending.ledger[k])) throw Error('Uncharged or unexpected physical transform observation');
      }
      if (observed) pending = null;
      else if (m.elapsed - pending.issuedAt > 1.5) { note('unobserved-input-retry', { elapsed: m.elapsed, kind: pending.kind }); pending = null; due = m.elapsed + .2; }
      else return [];
    }
    if (m.elapsed < due) return [];
    if (!task) {
      if (stage === 'restore') task = { tileId: trial.tileId, kind: 'mirror' };
      else {
        const plan = planVisibleState(m); note('public-CSP-search', { elapsed: m.elapsed, found: plan.found, cost: plan.cost, expanded: plan.expanded, milliseconds: plan.milliseconds });
        if (!plan.found || !plan.operations.length) throw Error('No nonempty public budget-valid color solution: ' + (plan.reason ?? 'already-ready'));
        if (stage === 'trial') {
          if (plan.cost + 2 > m.movesRemaining) throw Error('Real double-mirror inspection needs two extra charged operations');
          const candidate = m.tiles.map(t => predictOperation(m, 'mirror', t.id)).find(p => p.colorChanged && !p.willWin && !p.willExhaustMoves);
          if (!candidate) throw Error('No safe visibly different public mirror trial');
          task = { tileId: candidate.tileId, kind: 'mirror' };
        } else task = { ...plan.operations[0] };
      }
    }
    const path = focusPath(m, task.tileId);
    if (path.length) { const d = DIRECTIONS.find(d => d.name === path[0]); return issue(m, 'navigate', [d.key], { expectedId: predictFocus(m, d.name) }); }
    const predicted = predictOperation(m, task.kind, task.tileId);
    if (predicted.willExhaustMoves) throw Error('Observed public transform would exhaust the budget without winning');
    if (task.previewObservedAt === undefined) { task.previewObservedAt = m.elapsed; due = m.elapsed + (record ? 3.2 : .06); note('observed-preview', { elapsed: m.elapsed, ...predicted }); return []; }
    return issue(m, 'transform', [task.kind === 'rotate' ? 'Space' : 'b'], { predicted });
  }
  pilot.diagnostics = () => structuredClone(diagnostics); return pilot;
}
const defaultPilot = createPilot();
export function keys(state, options) { return defaultPilot(state, options); }

export function assertPublicBoard(m, assert) {
  const c = context(m), slots = positions(c, publicAssignments(m)), e = evaluate(c, slots);
  for (const key of ['regions', 'regionCounts', 'colorRegions', 'sharedEdgeCount', 'matchedEdgeCount', 'matchingEdgeIds', 'conflictEdgeIds', 'matchedRegionColorCount', 'allEdgesMatched', 'allRegionsMatched', 'goalReady']) assert.deepEqual(m[key], e[key]);
  assert.deepEqual(m.edges.map(({ id, vertexIds, incidences, shared, colorIds, matched }) => ({ id, vertexIds, incidences, shared, colorIds, matched })), e.edges);
  for (let i = 0; i < m.tiles.length; i++) {
    const t = m.tiles[i]; assert.deepEqual(t.slotColors, slots[i].map(id => c.sectors[c.si.get(id)].colorId));
    for (let j = 0; j < 3; j++) { const s = c.sectors[c.si.get(slots[i][j])], slot = t.slots[j]; assert.equal(slot.index, j); assert.equal(slot.sectorId, s.id); assert.equal(slot.mark, s.mark); assert.equal(slot.colorId, s.colorId); assert.equal(slot.regionId, e.regions.find(r => r.sectorIds.includes(s.id)).id); assert.equal(m.sectors[c.si.get(s.id)].slotIndex, j); }
  }
  assert.deepEqual(m.cursor, m.focusItems.find(i => i.id === m.selectedId));
  assert.deepEqual(m.previewRotate, predictOperation(m, 'rotate')); assert.deepEqual(m.previewMirror, predictOperation(m, 'mirror'));
  assert.equal(m.movesUsed, m.rotationCount + m.mirrorCount); assert.equal(m.movesRemaining, Math.max(0, m.moveLimit - m.movesUsed)); assert.equal(m.historyDepth, m.movesUsed); assert.equal(m.history.length, m.movesUsed);
  const reverse = slots.map(ids => [...ids]); let rotations = 0, mirrors = 0;
  for (let i = m.history.length - 1; i >= 0; i--) {
    const h = m.history[i], index = c.ti.get(h.tileId); assert.notEqual(index, undefined); assert.ok(['rotate', 'mirror'].includes(h.kind)); assert.equal(h.id, i + 1);
    assert.deepEqual(reverse[index], h.afterSectorIds); assert.deepEqual(transformed(h.beforeSectorIds, h.kind), h.afterSectorIds);
    const colors = ids => ids.map(id => c.sectors[c.si.get(id)].colorId); assert.deepEqual(h.beforeColors, colors(h.beforeSectorIds)); assert.deepEqual(h.afterColors, colors(h.afterSectorIds)); assert.equal(h.colorChanged, !equal(h.beforeColors, h.afterColors));
    assert.ok(h.at <= m.elapsed && Math.abs(h.at - h.tick / 60) < 1e-7); reverse[index] = [...h.beforeSectorIds]; rotations += Number(h.kind === 'rotate'); mirrors += Number(h.kind === 'mirror');
  }
  assert.equal(rotations, m.rotationCount); assert.equal(mirrors, m.mirrorCount); assert.deepEqual(m.lastOperation, m.history.at(-1) ?? null);
  assert.equal(m.score, m.matchedEdgeCount * 40 + m.matchedRegionColorCount * 100 + (m.phase === 'won' ? 1000 + Math.floor(m.remaining) * 5 + m.movesRemaining * 40 : 0));
  assert.ok(Math.abs(m.elapsed - m.tick / 60) < 1e-7); assert.ok(Math.abs(m.remaining - Math.max(0, m.timeLimit - m.elapsed)) < 1e-7);
  if (m.phase === 'won') { assert.equal(m.goalReady, true); assert.equal(m.lostReason, null); }
}
export function assertProgress({ before, after, trace }, assert) {
  assert.equal(after.phase, 'won', 'Ordinary rotation and reflection must satisfy the actual edge colors and exact region targets'); assertPublicBoard(after.model, assert);
  assert.ok(after.model.rotationCount > 0 && after.model.mirrorCount > 0); assert.ok(after.model.movesUsed > before.model.movesUsed);
  assert.deepEqual(after.model.sectors.map(({ id, tileId, mark, colorId }) => ({ id, tileId, mark, colorId })), before.model.sectors.map(({ id, tileId, mark, colorId }) => ({ id, tileId, mark, colorId })));
  assert.deepEqual(after.model.history.slice(0, before.model.movesUsed), before.model.history);
  const replay = publicAssignments(before.model);
  for (const operation of after.model.history.slice(before.model.movesUsed)) {
    const tile = replay.find(t => t.tileId === operation.tileId); assert.ok(tile);
    assert.deepEqual(operation.beforeSectorIds, tile.slotSectorIds, 'Every receipt must continue from the actual initial physical arrangement');
    tile.slotSectorIds = transformed(tile.slotSectorIds, operation.kind); assert.deepEqual(operation.afterSectorIds, tile.slotSectorIds);
  }
  assert.deepEqual(publicAssignments(after.model), replay);
  assert.ok(trace.some(s => s.state.model.movesUsed > before.model.movesUsed && !s.state.model.goalReady)); for (const sample of trace) assertPublicBoard(sample.state.model, assert);
}
export function assertRetry({ after, initial }, assert) {
  const m = after.model; assert.equal(after.phase, 'playing'); assertPublicBoard(m, assert);
  for (const k of ['movesUsed', 'rotationCount', 'mirrorCount', 'historyDepth']) assert.equal(m[k], 0);
  assert.equal(m.movesRemaining, m.moveLimit); assert.equal(m.selectedId, m.tiles[0].id); assert.equal(m.lastOperation, null);
  if (initial) { assert.deepEqual(publicAssignments(m), publicAssignments(initial.model)); assert.deepEqual(m.targetRegions, initial.model.targetRegions); assert.equal(m.moveLimit, initial.model.moveLimit); assert.deepEqual(m.sectors, initial.model.sectors); }
}
