'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const modelPath = path.join(__dirname, '../src/main/assets/game-model.js');
const Model = require(modelPath);
const DT = 1 / 60;
const clone = value => JSON.parse(JSON.stringify(value));
const tick = (s, input = {}) => Model.step(s, DT, input);
function ticks(s, count, input = {}) { for (let i = 0; i < count; i++) tick(s, input); return s; }
function pressA(s) { tick(s, { a: true }); tick(s); return s; }
function pressB(s) { tick(s, { b: true }); tick(s); return s; }
const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const cell = (s, id) => s.cells.find(c => c.id === id);
const ids = s => s.cells.map(c => c.tileId);
function focus(s, target) {
  const items = s.focusItems, queue = [[s.selectedId, []]], seen = new Set([s.selectedId]); let route;
  for (const [id, prefix] of queue) {
    if (id === target) { route = prefix; break; }
    const current = items.find(i => i.id === id);
    for (const [dx, dy] of dirs) {
      const next = items.map((item, index) => {
        const x = item.x - current.x, y = item.y - current.y, distance = x * x + y * y, perpendicular = Math.abs(x * dy - y * dx);
        return { item, index, forward: x * dx + y * dy, cost: distance + 2 * perpendicular * perpendicular, distance, perpendicular };
      }).filter(c => c.forward > 0).sort((a, b) => a.cost - b.cost || a.distance - b.distance || a.perpendicular - b.perpendicular || a.index - b.index)[0];
      if (!next || seen.has(next.item.id)) continue;
      seen.add(next.item.id); queue.push([next.item.id, [...prefix, { x: dx, y: dy }]]);
    }
  }
  assert.ok(route, `public focus graph reaches ${target}`);
  for (const input of route) { tick(s, input); tick(s); } assert.equal(s.selectedId, target);
}
function exchange(s, a, b) { focus(s, a); pressA(s); focus(s, b); pressA(s); return s; }
function submit(s) { focus(s, 'forge'); pressA(s); return s; }
function arrangement(s) {
  return clone({ cells: s.cells, tiles: s.tiles, materialCounts: s.materialCounts, heat: s.heat,
    matchedCells: s.matchedCells, allRecipesMet: s.allRecipesMet, goalReady: s.goalReady, score: s.score });
}
function rules(s) {
  return clone({ cells: s.cells.map(({ tileId, ...c }) => c), materialCounts: s.materialCounts,
    heat: s.heat, matchedCells: s.matchedCells, allRecipesMet: s.allRecipesMet, goalReady: s.goalReady, score: s.score });
}
function audit(s) {
  assert.equal(s.cells.length, 7); assert.equal(s.tiles.length, 7);
  assert.deepEqual(ids(s).slice().sort(), s.tiles.map(t => t.id).sort()); assert.equal(new Set(ids(s)).size, 7);
  const count = { copper: 0, iron: 0, silver: 0 };
  for (const t of s.tiles) { assert.equal(cell(s, t.cellId).tileId, t.id); count[t.material]++; }
  assert.deepEqual(s.materialCounts, count);
  for (const c of s.cells) {
    assert.equal(s.tiles.find(t => t.id === c.tileId).material, c.material);
    assert.equal(new Set(c.neighborIds).size, c.neighborIds.length);
    assert.deepEqual(c.neighborIds, c.neighborByDirection.filter(Boolean));
    assert.equal(Object.values(c.neighborCounts).reduce((a, b) => a + b, 0), c.neighborIds.length);
    const material = s.materials.find(m => m.id === c.material);
    assert.equal(c.actualCount, c.neighborCounts[material.neighborMaterial]); assert.equal(c.requiredCount, material.requiredCount);
    assert.equal(c.recipeMet, c.actualCount === c.requiredCount);
    if (c.id === s.moldCellId) { assert.equal(c.role, 'mold'); assert.equal(c.outletCellId, null); assert.equal(c.outletDirection, null); }
  }
  assert.equal(s.historyDepth, s.history.length); assert.equal(s.totalSwaps, s.historyDepth + s.undos);
  assert.equal(s.matchedCells, s.cells.filter(c => c.recipeMet).length);
  assert.equal(s.allRecipesMet, s.matchedCells === 7); assert.equal(s.goalReady, s.allRecipesMet && s.heat.delivered);
  assert.equal(s.heat.hops, s.heat.edges.length); assert.equal(new Set(s.heat.pathCellIds).size, s.heat.pathCellIds.length);
  assert.ok(s.heat.pathCellIds.length <= 7 && s.heat.edges.length <= 7);
}

// Explicit synthetic local-adjacency/heat boundary fixtures. Every fixture has
// seven unique occupied cells and physical IDs; disconnected geometry is used
// only to isolate a local trace rule, never described as ordinary authored play.
function fixture({ coords, materials, required = { copper: 1, iron: 1, silver: 1 }, source = 'C1', mold = 'C7' } = {}) {
  const s = Model.create();
  if (coords) s.cells.forEach((c, i) => {
    [c.q, c.r] = coords[i]; c.x = Math.round(320 + Math.sqrt(3) * 48 * (c.q + c.r / 2)); c.y = 250 + 72 * c.r;
  });
  if (materials) s.tiles.forEach((t, i) => { t.material = materials[i]; });
  s.materials.forEach(m => { m.requiredCount = required[m.id]; }); s.sourceCellId = source; s.moldCellId = mold; tick(s); return s;
}
const C = 'copper', I = 'iron', S = 'silver';
// Authoring rule examples are embedded, not read from scratch or used as a
// production/public-pilot oracle. All transformations below use normal keys.
const LOOP_EXAMPLES = [[C, S, I, S, I, S, I], [I, C, S, S, C, I, C], [C, I, I, S, C, S, I]];
const GOAL_ONE = [C, I, S, I, S, I, S];
function arrangeMaterials(s, target) {
  for (let i = 0; i < 7; i++) {
    if (s.cells[i].material === target[i]) continue;
    const j = s.cells.findIndex((c, index) => index > i && c.material === target[i]); assert.ok(j > i);
    exchange(s, s.cells[i].id, s.cells[j].id);
  }
  assert.deepEqual(s.cells.map(c => c.material), target); audit(s);
}

test('UMD exposes public seven-instance puzzles with compatible material rules, coordinates and fixed source/mold roles', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['TICK_HZ', 'create', 'step']); assert.equal(Model.TICK_HZ, 60);
  const sandbox = {}; vm.runInNewContext(fs.readFileSync(modelPath, 'utf8'), sandbox);
  assert.deepEqual(clone(sandbox.PureModel.create(2, 1)), Model.create(2, 1));
  const degrees = [];
  for (let d = 0; d < 3; d++) {
    const s = Model.create(2, d); assert.equal(s.level, d + 1); assert.equal(s.phase, 'playing'); assert.equal(s.stage, 'select');
    assert.equal(s.timeLimit, 90); assert.equal(s.remaining, 90); assert.equal(s.goalReady, false); assert.equal(s.historyDepth, 0);
    assert.equal(s.cells.filter(c => c.role === 'source').length, 1); assert.equal(s.cells.filter(c => c.role === 'mold').length, 1);
    assert.notEqual(s.sourceCellId, s.moldCellId); assert.deepEqual(s.forge, { id: 'forge', kind: 'submit', x: 790, y: 414 });
    assert.deepEqual(s.materials.map(m => m.heatTarget), [I, S, C]); assert.ok(s.materials.every(m => m.neighborMaterial === m.heatTarget));
    for (const c of s.cells) { assert.equal(c.x, Math.round(Math.sqrt(3) * 48 * (c.q + c.r / 2) + s.board.originX)); assert.equal(c.y, Math.round(72 * c.r + s.board.originY)); }
    degrees.push(s.cells.map(c => c.neighborIds.length).sort().join(',')); audit(s);
  }
  assert.equal(new Set(degrees).size, 3, 'the three footprints differ structurally');
});

test('axial neighbors have exact six-direction order, clipped missing positions and no duplicate or wrapped cells', () => {
  const wheel = Model.create(); assert.deepEqual(wheel.directions.map(d => [d.label, d.dq, d.dr]),
    [['E', 1, 0], ['SE', 0, 1], ['SW', -1, 1], ['W', -1, 0], ['NW', 0, -1], ['NE', 1, -1]]);
  assert.deepEqual(cell(wheel, 'C1').neighborByDirection, ['C2', 'C3', 'C4', 'C5', 'C6', 'C7']);
  assert.deepEqual(cell(wheel, 'C2').neighborByDirection, [null, null, 'C3', 'C1', 'C7', null]);
  const compact = Model.create(1, 1), strip = Model.create(1, 2);
  assert.deepEqual(cell(compact, 'C1').neighborByDirection, ['C2', 'C4', null, null, null, null]);
  assert.deepEqual(cell(strip, 'C1').neighborByDirection, ['C2', 'C3', null, null, null, null]);
  for (const s of [compact, strip]) assert.deepEqual(cell(s, 'C7').neighborByDirection, [null, null, null, null, 'C5', 'C6']);
  for (const s of [wheel, compact, strip]) audit(s);
});

test('recipes count only actual neighbors, require equality and do not use the unchanged global material totals', () => {
  const s = fixture({ coords: [[0, 0], [1, 0], [-1, 1], [4, 0], [4, 1], [5, 0], [5, 1]],
    materials: [C, I, S, I, I, S, C] });
  assert.deepEqual(cell(s, 'C1').neighborIds, ['C2', 'C3']); assert.equal(s.materialCounts.iron, 3);
  assert.deepEqual(cell(s, 'C1').neighborCounts, { copper: 0, iron: 1, silver: 1 }); assert.equal(cell(s, 'C1').recipeMet, true);
  const totals = clone(s.materialCounts); exchange(s, 'C2', 'C6'); assert.deepEqual(s.materialCounts, totals);
  assert.equal(cell(s, 'C1').actualCount, 0); assert.equal(cell(s, 'C1').recipeMet, false);
  const tooMany = fixture({ materials: [C, I, I, S, S, S, S] });
  assert.equal(cell(tooMany, 'C1').actualCount, 2); assert.equal(cell(tooMany, 'C1').requiredCount, 1); assert.equal(cell(tooMany, 'C1').recipeMet, false);
});

test('the actual outlet chooses the first matching E/SE/SW/W/NW/NE neighbor even when its recipe is wrong', () => {
  for (let first = 0; first < 6; first++) {
    const s = fixture({ materials: [C, ...Array.from({ length: 6 }, (_, i) => i >= first ? I : S)] });
    const center = cell(s, 'C1'); assert.equal(center.outletCellId, 'C' + (first + 2)); assert.equal(center.outletDirection, first);
    assert.equal(center.actualCount, 6 - first); assert.equal(center.recipeMet, first === 5);
    const before = clone(s.heat); s.cells.reverse(); tick(s);
    assert.equal(cell(s, 'C1').outletDirection, first); assert.deepEqual(s.heat, before, 'world priority is independent of cells-array iteration');
  }
});

test('a missing target neighbor blocks at that cell without synthesizing an outlet or a heat edge', () => {
  const s = fixture({ materials: [C, S, S, S, S, S, S] });
  assert.equal(cell(s, 'C1').outletCellId, null); assert.equal(cell(s, 'C1').outletDirection, null);
  assert.deepEqual(s.heat, { status: 'blocked', delivered: false, pathCellIds: ['C1'], edges: [], stopCellId: 'C1', hops: 0 });
  assert.equal(s.goalReady, false);
});

test('a loop entered away from the source reports the repeated non-source cell and its actual closing edge', () => {
  const s = fixture({ coords: [[-1, 0], [0, 0], [1, 0], [0, 1], [3, 0], [3, 1], [4, 0]],
    materials: [C, I, S, C, I, S, C] });
  assert.equal(s.heat.status, 'loop'); assert.equal(s.heat.delivered, false); assert.equal(s.heat.stopCellId, 'C2');
  assert.deepEqual(s.heat.pathCellIds, ['C1', 'C2', 'C3', 'C4']);
  assert.deepEqual(s.heat.edges, [{ fromId: 'C1', toId: 'C2', direction: 0 }, { fromId: 'C2', toId: 'C3', direction: 0 },
    { fromId: 'C3', toId: 'C4', direction: 2 }, { fromId: 'C4', toId: 'C2', direction: 4 }]);
  assert.equal(s.heat.hops, 4); audit(s);
});

test('mold absorbs before any outlet, but its local recipe is still required for an accepted submission', () => {
  const s = fixture({ coords: [[0, 0], [1, 0], [2, 0], [4, 0], [4, 1], [5, 0], [5, 1]],
    materials: [C, I, S, C, I, S, C], mold: 'C2', required: { copper: 1, iron: 2, silver: 1 } });
  assert.equal(cell(s, 'C2').neighborCounts.silver, 1); assert.equal(cell(s, 'C2').recipeMet, false);
  assert.equal(cell(s, 'C2').outletCellId, null); assert.equal(cell(s, 'C2').outletDirection, null);
  assert.equal(s.heat.status, 'delivered'); assert.deepEqual(s.heat.pathCellIds, ['C1', 'C2']); assert.equal(s.heat.hops, 1);
  submit(s); assert.equal(s.lastSubmission.reason, 'recipes'); assert.equal(s.lastSubmission.heatDelivered, true);
  assert.equal(s.phase, 'playing'); assert.equal(s.mistakes, 1); audit(s);
});

test('each authored puzzle has an ordinary-key recipe-perfect loop arrangement that FORGE truly rejects', () => {
  for (let d = 0; d < 3; d++) {
    const s = Model.create(1, d); arrangeMaterials(s, LOOP_EXAMPLES[d]);
    assert.equal(s.allRecipesMet, true); assert.equal(s.matchedCells, 7); assert.equal(s.heat.status, 'loop'); assert.equal(s.goalReady, false);
    assert.equal(s.phase, 'playing'); const before = arrangement(s); submit(s);
    assert.equal(s.lastSubmission.reason, 'heat'); assert.equal(s.lastSubmission.accepted, false); assert.equal(s.lastSubmission.allRecipesMet, true);
    assert.equal(s.lastSubmission.heatDelivered, false); assert.equal(s.mistakes, 1); assert.equal(s.submissions, 1);
    assert.deepEqual(arrangement(s), before); assert.equal(s.score, 280); audit(s);
  }
});

test('a complete goal remains inspectable and does not win until an empty-handed explicit FORGE submission', () => {
  const s = Model.create(); arrangeMaterials(s, GOAL_ONE);
  assert.equal(s.goalReady, true); assert.equal(s.phase, 'playing'); assert.equal(s.score, 400); ticks(s, 60); assert.equal(s.phase, 'playing');
  pressA(s); assert.equal(s.stage, 'holding'); assert.equal(s.phase, 'playing'); pressB(s); submit(s);
  assert.equal(s.phase, 'won'); assert.equal(s.lastSubmission.reason, 'accepted'); assert.equal(s.submissions, 1); assert.equal(s.mistakes, 0);
  assert.equal(s.score, 400 + 1000 + Math.floor(s.remaining) * 5); assert.deepEqual(s.events.map(e => e.type), ['submit', 'won']); audit(s);
});

test('picking and holding retain the exact occupied inventory and all current rule/heat values', () => {
  const s = Model.create(); const before = arrangement(s); pressA(s);
  assert.equal(s.stage, 'holding'); assert.equal(s.heldTileId, 'T1'); assert.equal(s.heldCellId, 'C1'); assert.deepEqual(arrangement(s), before);
  focus(s, 'C3'); assert.deepEqual(arrangement(s), before); assert.equal(s.historyDepth, 0); assert.equal(s.totalSwaps, 0);
  assert.equal(cell(s, 'C1').tileId, 'T1'); assert.equal(s.tiles.find(t => t.id === 'T1').cellId, 'C1'); audit(s);
});

test('different-material swaps atomically move two exact IDs and recompute local counts and heat without changing totals', () => {
  const s = Model.create(); const oldIds = ids(s), oldCounts = clone(s.materialCounts), oldHeat = clone(s.heat);
  const oldNeighbors = clone(s.cells.map(c => c.neighborCounts)); exchange(s, 'C1', 'C2');
  assert.equal(cell(s, 'C1').tileId, oldIds[1]); assert.equal(cell(s, 'C2').tileId, oldIds[0]); assert.deepEqual(ids(s).slice(2), oldIds.slice(2));
  assert.deepEqual(s.materialCounts, oldCounts); assert.notDeepEqual(s.cells.map(c => c.neighborCounts), oldNeighbors); assert.notDeepEqual(s.heat, oldHeat);
  assert.equal(s.heat.delivered, true); assert.equal(s.stage, 'select'); assert.equal(s.selectedId, 'C2'); assert.equal(s.heldTileId, null);
  assert.equal(s.totalSwaps, 1); assert.equal(s.historyDepth, 1); assert.deepEqual(s.history[0].beforeTileIds, oldIds); audit(s);
});

test('equal-material IDs really exchange and create undo history while all material-derived rules stay unchanged', () => {
  const s = Model.create(); assert.equal(cell(s, 'C1').material, cell(s, 'C3').material);
  const before = rules(s), oldIds = ids(s); exchange(s, 'C1', 'C3');
  assert.equal(cell(s, 'C1').tileId, oldIds[2]); assert.equal(cell(s, 'C3').tileId, oldIds[0]);
  assert.deepEqual(rules(s), before); assert.equal(s.totalSwaps, 1); assert.equal(s.historyDepth, 1);
  pressB(s); assert.deepEqual(ids(s), oldIds); assert.equal(s.undos, 1); audit(s);
});

test('same-cell A cancellation and holding B return focus to origin without undoing a prior committed swap', () => {
  const s = Model.create(); exchange(s, 'C1', 'C2'); const before = arrangement(s);
  focus(s, 'C4'); pressA(s); pressA(s); assert.equal(s.cancels, 1); assert.equal(s.stage, 'select'); assert.equal(s.selectedId, 'C4');
  assert.deepEqual(arrangement(s), before); assert.equal(s.historyDepth, 1);
  pressA(s); focus(s, 'C6'); pressB(s); assert.equal(s.cancels, 2); assert.equal(s.selectedId, 'C4'); assert.equal(s.heldCellId, null);
  assert.equal(s.undos, 0); assert.equal(s.historyDepth, 1); assert.deepEqual(arrangement(s), before);
});

test('FORGE while holding is explanatory only: no submission, mistake, assignment change or automatic cancel', () => {
  const s = Model.create(); pressA(s); focus(s, 'forge'); const before = arrangement(s);
  tick(s, { a: true }); assert.equal(s.lastAction.type, 'forge-blocked'); assert.equal(s.lastAction.reason, 'holding');
  assert.equal(s.submissions, 0); assert.equal(s.mistakes, 0); assert.equal(s.stage, 'holding'); assert.equal(s.heldTileId, 'T1');
  assert.equal(s.selectedId, 'forge'); assert.deepEqual(arrangement(s), before); tick(s); pressB(s); assert.equal(s.selectedId, 'C1');
});

test('undo restores exact IDs and every derived field from detached full snapshots and preserves earlier records', () => {
  const s = Model.create(); exchange(s, 'C1', 'C2'); const afterFirst = arrangement(s), firstRecord = clone(s.history[0]);
  exchange(s, 'C3', 'C5'); const record = s.history[1], lastSwap = s.lastSwap, lastCopy = clone(lastSwap);
  assert.notStrictEqual(lastSwap, record); assert.notStrictEqual(lastSwap.beforeTileIds, record.beforeTileIds);
  assert.deepEqual(s.history[0], firstRecord); const at = s.elapsed; pressB(s);
  assert.deepEqual(arrangement(s), afterFirst); assert.equal(s.selectedId, 'C3'); assert.equal(s.historyDepth, 1);
  assert.equal(s.totalSwaps, 2); assert.equal(s.undos, 1); assert.ok(s.elapsed > at);
  assert.deepEqual(s.lastSwap, lastCopy); assert.notStrictEqual(s.lastUndo.swap, record); assert.notStrictEqual(s.lastUndo.swap.beforeTileIds, record.beforeTileIds);
  assert.notStrictEqual(s.lastUndo.swap.beforeTileIds, s.history[0].beforeTileIds); assert.deepEqual(s.history[0], firstRecord); audit(s);
});

test('undo never refunds submissions, mistakes, cancels or time and submitted assignment snapshots stay fixed', () => {
  const s = Model.create(); const initial = arrangement(s); exchange(s, 'C1', 'C2');
  submit(s); assert.equal(s.lastSubmission.reason, 'recipes'); const submitted = clone(s.lastSubmission); const at = s.elapsed;
  focus(s, 'C4'); pressA(s); pressB(s); pressB(s);
  assert.deepEqual(arrangement(s), initial); assert.equal(s.submissions, 1); assert.equal(s.mistakes, 1); assert.equal(s.cancels, 1);
  assert.equal(s.totalSwaps, 1); assert.equal(s.undos, 1); assert.ok(s.elapsed > at); assert.deepEqual(s.lastSubmission, submitted);
  assert.notDeepEqual(s.lastSubmission.assignment.map(a => a.tileId), ids(s));
});

test('held A/B never repeat, empty undo is free, and three fresh incorrect FORGE presses lose', () => {
  const held = Model.create(); tick(held, { a: true }); ticks(held, 40, { a: true });
  assert.equal(held.stage, 'holding'); assert.equal(held.totalSwaps, 0); assert.equal(held.cancels, 0);
  tick(held); tick(held, { a: true }); ticks(held, 40, { a: true }); assert.equal(held.stage, 'select'); assert.equal(held.cancels, 1);
  tick(held); tick(held, { b: true }); ticks(held, 40, { b: true }); assert.equal(held.undos, 0); assert.equal(held.lastAction.type, 'undo-empty');
  const s = Model.create(); focus(s, 'forge'); tick(s, { a: true });
  assert.equal(s.lastSubmission.reason, 'recipes-and-heat'); ticks(s, 50, { a: true }); assert.equal(s.submissions, 1); assert.equal(s.mistakes, 1);
  tick(s); pressA(s); assert.equal(s.phase, 'playing'); assert.equal(s.mistakes, 2);
  pressA(s); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'mistakes'); assert.equal(s.submissions, 3); assert.equal(s.mistakes, 3);
});

test('derived score cannot be farmed by undo/re-swap or equal-material swaps', () => {
  const s = Model.create(); const initial = s.score;
  for (let i = 0; i < 3; i++) {
    exchange(s, 'C1', 'C2'); assert.equal(s.score, s.matchedCells * 40 + (s.heat.delivered ? 120 : 0));
    pressB(s); assert.equal(s.score, initial);
  }
  exchange(s, 'C1', 'C3'); assert.equal(s.score, initial); pressB(s); assert.equal(s.score, initial);
  assert.equal(s.totalSwaps, 4); assert.equal(s.undos, 4); assert.equal(s.historyDepth, 0); audit(s);
});

test('axis-biased navigation fixes rounded wheel C2 west→C1 and honors distance/index ties without wrapping', () => {
  const s = Model.create(); focus(s, 'C2');
  const east = cell(s, 'C2'), center = cell(s, 'C1'), diagonal = cell(s, 'C3');
  assert.ok((east.x - diagonal.x) ** 2 + (east.y - diagonal.y) ** 2 < (east.x - center.x) ** 2);
  tick(s, { x: -1 }); assert.equal(s.selectedId, 'C1', 'perpendicular penalty beats misleading rounded Euclidean proximity');
  // Synthetic displayed-coordinate ties isolate the declared tie breakers.
  for (const [positions, expected] of [[[[0, 0], [1, 1], [2, 0]], 'C2'], [[[0, 0], [2, 1], [2, -1]], 'C2']]) {
    const current = Model.create(); current.cells.forEach((c, i) => { c.x = i < 3 ? positions[i][0] : -100 - i; c.y = i < 3 ? positions[i][1] : 100 + i; });
    tick(current); tick(current, { x: 1 }); assert.equal(current.selectedId, expected);
  }
  focus(s, 'forge'); tick(s, { x: 1 }); assert.equal(s.selectedId, 'forge'); assert.equal(s.lastAction.type, 'select-blocked');
});

test('all eight authored focus items are reachable from every item through actual model selection inputs', () => {
  for (let d = 0; d < 3; d++) {
    const base = Model.create(1, d), graph = {};
    for (const item of base.focusItems) graph[item.id] = dirs.map(([x, y]) => {
      const s = clone(base); s.selectedId = item.id; tick(s); tick(s, { x, y }); return s.selectedId;
    });
    for (const start of Object.keys(graph)) {
      const seen = new Set([start]), queue = [start];
      for (const id of queue) for (const next of graph[id]) if (!seen.has(next)) { seen.add(next); queue.push(next); }
      assert.equal(seen.size, 8);
    }
  }
});

test('focus cadence is immediate then 20/10 ticks, with release/change reset and dominant-axis deadzone rules', () => {
  const s = Model.create(); s.cells.forEach((c, i) => { c.x = i * 100; c.y = 0; }); tick(s);
  tick(s, { x: 1 }); assert.equal(s.selectedId, 'C2'); ticks(s, 19, { x: 1 }); assert.equal(s.selectedId, 'C2');
  tick(s, { x: 1 }); assert.equal(s.selectedId, 'C3'); ticks(s, 9, { x: 1 }); assert.equal(s.selectedId, 'C3');
  tick(s, { x: 1 }); assert.equal(s.selectedId, 'C4'); tick(s); tick(s, { x: 1 }); assert.equal(s.selectedId, 'C5');
  tick(s, { x: -1 }); assert.equal(s.selectedId, 'C4');
  for (const [input, id] of [[{ x: .5, y: .5 }, 'C2'], [{ x: -.5, y: -.5 }, 'C5'], [{ x: .4, y: .5 }, 'C3'], [{ x: .249, y: -.249 }, 'C1'], [{ x: .25 }, 'C2']]) {
    const current = Model.create(); tick(current, input); assert.equal(current.selectedId, id);
  }
});

test('navigation precedes A pickup/swap, while B cancels and discards simultaneous A and navigation for its tick', () => {
  const s = Model.create(); tick(s, { x: 1, a: true }); assert.equal(s.heldCellId, 'C2'); assert.equal(s.heldTileId, 'T2');
  assert.deepEqual(s.events.map(e => e.type), ['select', 'pick']); tick(s); tick(s, { y: 1, a: true });
  assert.equal(s.selectedId, 'C3'); assert.equal(s.lastSwap.aCellId, 'C2'); assert.equal(s.lastSwap.bCellId, 'C3');
  assert.deepEqual(s.events.map(e => e.type), ['select', 'swap']);
  const cancel = Model.create(); pressA(cancel); tick(cancel, { b: true, a: true, x: 1 });
  assert.equal(cancel.stage, 'select'); assert.equal(cancel.selectedId, 'C1'); assert.equal(cancel.cancels, 1);
  assert.deepEqual(cancel.events.map(e => e.type), ['cancel']); tick(cancel, { b: true, a: true, x: 1 });
  assert.equal(cancel.selectedId, 'C2'); assert.equal(cancel.stage, 'select'); assert.equal(cancel.totalSwaps, 0);
});

test('larger dt follows the same per-tick B priority and later held-direction movement as separate ticks', () => {
  const combined = Model.create(), split = Model.create();
  Model.step(combined, .25, { b: true, aPressed: true, x: 1 });
  tick(split, { b: true, aPressed: true, x: 1 }); ticks(split, 14, { b: true, x: 1 });
  assert.equal(combined.selectedId, 'C2'); assert.equal(combined.stage, 'select'); assert.equal(combined.totalSwaps, 0);
  assert.deepEqual(combined.events.map(e => e.type), ['undo-empty', 'select']);
  const { events: ea, _accumulator: ra, ...a } = combined, { events: eb, _accumulator: rb, ...b } = split;
  assert.ok(Math.abs(ra - rb) < 1e-12); assert.deepEqual(a, b);
});

test('zero/subtick button edges wait for a full tick, coalesce once and discard pending A when B wins', () => {
  const s = Model.create(); Model.step(s, DT / 2, { aPressed: true }); assert.equal(s.tick, 0); assert.equal(s.stage, 'select');
  Model.step(s, DT / 2, {}); assert.equal(s.stage, 'holding');
  Model.step(s, 0, { aPressed: true, x: 1 }); Model.step(s, 0, { bPressed: true }); assert.equal(s.stage, 'holding'); assert.equal(s.selectedId, 'C1');
  tick(s); assert.equal(s.stage, 'select'); assert.equal(s.cancels, 1); tick(s); assert.equal(s.stage, 'select'); assert.equal(s.totalSwaps, 0);
});

test('cancellation clears queued input but preserves held preview, focus, assignment, history and actual heat', () => {
  const first = Model.create(); tick(first, { cancelEpoch: 7, a: true }); assert.equal(first.stage, 'holding');
  const s = Model.create(); tick(s, { cancelEpoch: 2 }); exchange(s, 'C1', 'C2'); focus(s, 'C4'); pressA(s); focus(s, 'forge');
  const before = arrangement(s), history = clone(s.history), at = s.tick;
  tick(s, { cancelEpoch: 3, a: true, b: true, x: -1 }); ticks(s, 8, { cancelled: true, a: true, b: true, aPressed: true, bPressed: true, y: 1 });
  assert.deepEqual(arrangement(s), before); assert.deepEqual(s.history, history); assert.equal(s.stage, 'holding');
  assert.equal(s.heldCellId, 'C4'); assert.equal(s.selectedId, 'forge'); assert.equal(s.cancels, 0); assert.equal(s.tick, at + 9);
  tick(s, { a: true, b: true }); assert.equal(s.stage, 'holding'); tick(s); tick(s, { b: true });
  assert.equal(s.selectedId, 'C4'); assert.equal(s.stage, 'select'); assert.equal(s.historyDepth, 1);
  const pending = Model.create(); Model.step(pending, DT / 2, { aPressed: true, bPressed: true }); Model.step(pending, DT / 2, { cancelled: true });
  tick(pending); assert.equal(pending.stage, 'select'); assert.equal(pending.cancels, 0);
});

test('deadline precedes a valid FORGE submission, undo and navigation', () => {
  const ready = Model.create(); arrangeMaterials(ready, GOAL_ONE); focus(ready, 'forge');
  const undo = Model.create(); exchange(undo, 'C1', 'C2'); const nav = Model.create();
  for (const [s, input] of [[ready, { a: true }], [undo, { b: true }], [nav, { x: 1 }]]) {
    const before = arrangement(s), history = clone(s.history), selection = s.selectedId;
    const counters = [s.submissions, s.mistakes, s.totalSwaps, s.undos, s.cancels]; s.timeLimit = (s.tick + 1) / 60;
    tick(s, input); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'timeout'); assert.equal(s.remaining, 0);
    assert.deepEqual(arrangement(s), before); assert.deepEqual(s.history, history); assert.equal(s.selectedId, selection);
    assert.deepEqual([s.submissions, s.mistakes, s.totalSwaps, s.undos, s.cancels], counters); assert.deepEqual(s.events.map(e => e.type), ['lost']);
  }
});

// Clock-stress boundary at one explicit button edge per fixed tick; this is
// resource-bound verification, not evidence of ordinary human play duration.
test('clock-stress boundary: 90 active seconds bounds history at 2699 swaps without an artificial cap', () => {
  const s = Model.create();
  for (let i = 0; i < 2699; i++) {
    tick(s, { aPressed: true }); tick(s, { x: i % 2 ? -1 : 1, aPressed: true });
  }
  assert.equal(s.tick, 5398); assert.equal(s.phase, 'playing'); assert.equal(s.totalSwaps, 2699); assert.equal(s.historyDepth, 2699);
  tick(s, { aPressed: true }); assert.equal(s.stage, 'holding'); tick(s, { x: -1, aPressed: true });
  assert.equal(s.tick, 5400); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'timeout');
  assert.equal(s.totalSwaps, 2699); assert.equal(s.historyDepth, 2699); assert.equal(s.history[0].beforeTileIds.length, 7); audit(s);
});

test('terminal outcomes freeze every field, fresh retries restore independent state and JSON copies continue identically', () => {
  const won = Model.create(); arrangeMaterials(won, GOAL_ONE); submit(won);
  const lost = Model.create(); lost.timeLimit = DT; tick(lost);
  for (const s of [won, lost]) {
    const frozen = clone(s); for (const dt of [0, DT, .25, 100, NaN]) Model.step(s, dt, { aPressed: true, bPressed: true, x: 1, cancelEpoch: 99 });
    assert.deepEqual(s, frozen);
  }
  const active = Model.create(3, 1); exchange(active, 'C1', 'C2'); pressA(active); const restored = clone(active);
  focus(active, 'C3'); focus(restored, 'C3'); pressA(active); pressA(restored); pressB(active); pressB(restored); assert.deepEqual(active, restored);
  const retry = Model.create(3, 1), original = Model.create(3, 1); assert.deepEqual(retry, original);
  for (const key of ['cells', 'tiles', 'materials', 'history', 'focusItems']) assert.notStrictEqual(retry[key], active[key]);
  assert.notStrictEqual(retry.cells[0].neighborIds, active.cells[0].neighborIds); assert.notStrictEqual(retry.materials[0].rgb, active.materials[0].rgb);
});

test('numeric inputs are bounded and all public resource counters remain finite', () => {
  const s = Model.create(); for (const dt of [NaN, Infinity, -Infinity, -1, '1', undefined]) Model.step(s, dt, {});
  assert.equal(s.tick, 0); tick(s, { x: NaN, y: Infinity }); assert.equal(s.selectedId, 'C1'); tick(s, { x: 1e30 }); assert.equal(s.selectedId, 'C2');
  const at = s.tick; Model.step(s, 100, {}); assert.equal(s.tick, at + 15);
  assert.equal(Model.create(NaN, NaN).seed, 1); assert.equal(Model.create(1, -9).level, 1);
  assert.equal(Model.create(1, 99).level, 3); assert.equal(Model.create(1, 1.9).level, 2);
  assert.ok(s.events.length <= 32); assert.ok(s.historyDepth <= 2699); audit(s);
  function finiteTree(value) { if (typeof value === 'number') assert.ok(Number.isFinite(value)); else if (value && typeof value === 'object') Object.values(value).forEach(finiteTree); }
  finiteTree(s);
});

// Runtime-style ordinary input scenarios; independent planning receives public
// JSON observations only, with no production solver or simulation-state writes.
{
 const ordinaryTest=require('node:test'),ordinaryAssert=require('node:assert/strict');
 const OrdinaryModel=require('../src/main/assets/game-model.js');
 const {pathToFileURL:ordinaryURL}=require('node:url'),ordinaryPath=require('node:path');
 const ordinaryModule=import(ordinaryURL(ordinaryPath.join(__dirname,'automation.mjs')).href);
 function ordinarySnapshot(s){return{phase:s.phase,paused:false,model:JSON.parse(JSON.stringify(s,(key,value)=>key.startsWith('_')?undefined:value))};}
 function ordinaryFreeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(ordinaryFreeze);Object.freeze(v);}return v;}
 function ordinaryTap(s,input){OrdinaryModel.step(s,1/60,input);OrdinaryModel.step(s,1/60,{});}
 function ordinaryRuleView(m){return{cells:m.cells.map(c=>({id:c.id,neighborCounts:c.neighborCounts,requiredCount:c.requiredCount,actualCount:c.actualCount,recipeMet:c.recipeMet,outletCellId:c.outletCellId,outletDirection:c.outletDirection})),heat:m.heat};}
 for(let difficulty=0;difficulty<3;difficulty++){
  ordinaryTest(`public-planned different-material trial, exact undo/repair and explicit FORGE win on puzzle ${difficulty+1}`,async()=>{
   const automation=await ordinaryModule,pilot=automation.createPilot(),s=OrdinaryModel.create(41,difficulty);
   const initial=ordinarySnapshot(s),trace=[{elapsed:0,state:initial}];let keys=[],lastA=false,lastB=false;
   // An explicitly defined 60 Hz scenario with observation every five ticks;
   // this does not claim that arbitrary user plans or timings must succeed.
   for(let frame=0;frame<5401&&s.phase==='playing';frame++){
    if(frame%5===0){const observed=ordinarySnapshot(s);trace.push({elapsed:s.elapsed,state:observed});keys=pilot(ordinaryFreeze(observed),{mode:'record',elapsed:s.elapsed});}
    const a=keys.includes('Space'),b=keys.includes('b');
    OrdinaryModel.step(s,1/60,{x:Number(keys.includes('ArrowRight'))-Number(keys.includes('ArrowLeft')),
     y:Number(keys.includes('ArrowDown'))-Number(keys.includes('ArrowUp')),a,b,aPressed:a&&!lastA,bPressed:b&&!lastB,cancelEpoch:0});
    lastA=a;lastB=b;
   }
   const after=ordinarySnapshot(s);trace.push({elapsed:s.elapsed,state:after});
   automation.assertProgress({before:initial,after,trace},ordinaryAssert);
   ordinaryAssert.equal(s.phase,'won');ordinaryAssert.ok(s.elapsed>=30&&s.elapsed<90);
   ordinaryAssert.equal(s.undos,1);ordinaryAssert.equal(s.mistakes,0);ordinaryAssert.equal(s.submissions,1);
   ordinaryAssert.equal(s.matchedCells,7);ordinaryAssert.equal(s.heat.delivered,true);ordinaryAssert.equal(s.heat.stopCellId,s.moldCellId);
   const diagnostics=pilot.diagnostics(),undo=diagnostics.find(e=>e.type==='observed-undo');ordinaryAssert.ok(undo);
   const swaps=diagnostics.filter(e=>e.type==='observed-swap'),first=swaps.find(e=>e.elapsed<undo.elapsed),repaired=swaps.find(e=>e.elapsed>undo.elapsed);
   ordinaryAssert.ok(first&&repaired);
   for(const key of ['aCellId','bCellId','aTileId','bTileId'])ordinaryAssert.equal(repaired[key],first[key]);
   const materials=new Map(initial.model.tiles.map(t=>[t.id,t.material]));
   ordinaryAssert.notEqual(materials.get(first.aTileId),materials.get(first.bTileId),'trial must exchange different materials');
   const trial=trace.find(t=>t.state.model.totalSwaps===1&&t.state.model.undos===0)?.state.model;
   const restored=trace.find(t=>t.state.model.totalSwaps===1&&t.state.model.undos===1)?.state.model;
   ordinaryAssert.ok(trial&&restored);
   ordinaryAssert.notDeepEqual(ordinaryRuleView(trial),ordinaryRuleView(initial.model),'real trial must alter local/thermal rule state');
   ordinaryAssert.deepEqual(automation.publicAssignment(restored),automation.publicAssignment(initial.model));
   ordinaryAssert.deepEqual(ordinaryRuleView(restored),ordinaryRuleView(initial.model));
   ordinaryAssert.equal(restored.score,initial.model.score);ordinaryAssert.ok(restored.elapsed>trial.elapsed);
   ordinaryAssert.ok(diagnostics.some(e=>e.type==='observed-ready-before-explicit-submit'));
   const frozen=JSON.stringify(s);OrdinaryModel.step(s,.25,{b:true,a:true,x:1,cancelled:true});ordinaryAssert.equal(JSON.stringify(s),frozen);
   automation.assertRetry({after:ordinarySnapshot(OrdinaryModel.create(41,difficulty)),initial},ordinaryAssert);
  });
  ordinaryTest(`ordinary initial-board FORGE submissions lose puzzle ${difficulty+1} at three errors without changing inventory`,async()=>{
   const automation=await ordinaryModule,s=OrdinaryModel.create(41,difficulty),before=ordinarySnapshot(s).model;
   ordinaryAssert.equal(s.goalReady,false);
   const inputs={N:{y:-1},E:{x:1},S:{y:1},W:{x:-1}};
   for(const dir of automation.focusPath(ordinarySnapshot(s).model,s.forge.id))ordinaryTap(s,inputs[dir]);
   ordinaryAssert.equal(s.selectedId,s.forge.id);ordinaryAssert.equal(s.stage,'select');
   for(let count=1;count<=3;count++){
    ordinaryTap(s,{a:true});ordinaryAssert.equal(s.submissions,count);ordinaryAssert.equal(s.mistakes,count);
    ordinaryAssert.equal(s.lastSubmission.id,count);ordinaryAssert.equal(s.lastSubmission.accepted,false);
    ordinaryAssert.equal(s.phase,count===3?'lost':'playing');
    ordinaryAssert.deepEqual(automation.publicAssignment(s),automation.publicAssignment(before));
    ordinaryAssert.equal(s.totalSwaps,0);ordinaryAssert.equal(s.historyDepth,0);ordinaryAssert.equal(s.undos,0);
   }
   ordinaryAssert.equal(s.lostReason,'mistakes');ordinaryAssert.equal(s.score,before.score);
   ordinaryAssert.deepEqual(ordinaryRuleView(s),ordinaryRuleView(before));automation.assertPublicBoard(s,ordinaryAssert);
   const frozen=JSON.stringify(s);OrdinaryModel.step(s,.25,{b:true});ordinaryAssert.equal(JSON.stringify(s),frozen);
  });
 }
}
