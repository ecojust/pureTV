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
const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const tick = (s, input = {}) => Model.step(s, DT, input);
function ticks(s, n, input = {}) { for (let i = 0; i < n; i++) tick(s, input); return s; }
function pressA(s) { tick(s, { a: true }); tick(s); return s; }
function pressB(s) { tick(s, { b: true }); tick(s); return s; }
const island = (s, id) => s.islands.find(i => i.id === id);
const piece = (s, id) => s.pieces.find(p => p.id === id);
const selected = s => s.stage === 'bank' ? s.selectedPieceId : s.selectedIslandId;
function focus(s, target) {
  const items = s.stage === 'bank' ? s.pieces.filter(p => !p.placed).map(p => ({ id: p.id, x: p.x, y: p.y }))
    : s.islands.map(i => ({ id: i.id, x: i.gx, y: i.gy }));
  const queue = [[selected(s), []]], seen = new Set([selected(s)]); let route;
  for (const [id, prefix] of queue) {
    if (id === target) { route = prefix; break; }
    const current = items.find(i => i.id === id);
    for (const [dx, dy] of dirs) {
      const candidates = items.map((item, index) => ({ item, index,
        forward: (item.x - current.x) * dx + (item.y - current.y) * dy,
        distance: (item.x - current.x) ** 2 + (item.y - current.y) ** 2,
        perpendicular: Math.abs((item.x - current.x) * dy - (item.y - current.y) * dx) }))
        .filter(c => c.forward > 0).sort((a, b) => a.distance - b.distance || a.perpendicular - b.perpendicular || a.index - b.index);
      if (!candidates.length || seen.has(candidates[0].item.id)) continue;
      seen.add(candidates[0].item.id); queue.push([candidates[0].item.id, [...prefix, { x: dx, y: dy }]]);
    }
  }
  assert.ok(route, `public spatial navigation reaches ${target}`);
  for (const input of route) { tick(s, input); tick(s); }
  assert.equal(selected(s), target);
}
function aim(s, pieceId, sourceId, targetId) {
  assert.equal(s.stage, 'bank'); focus(s, pieceId); pressA(s); focus(s, sourceId); pressA(s); focus(s, targetId);
  assert.equal(s.stage, 'target'); return s.preview;
}
function place(s, pieceId, sourceId, targetId) {
  const preview = aim(s, pieceId, sourceId, targetId); assert.equal(preview.valid, true, JSON.stringify(preview)); pressA(s); return s;
}
function network(s) {
  return clone({ islands: s.islands, pieces: s.pieces, bridges: s.bridges, availablePieceIds: s.availablePieceIds,
    placedCount: s.placedCount, remainingPieces: s.remainingPieces, componentCount: s.componentCount,
    connected: s.connected, largestComponentSize: s.largestComponentSize, score: s.score });
}
function audit(s) {
  assert.equal(s.placedCount, s.bridges.length); assert.equal(s.totalPlacements, s.placedCount + s.undos);
  assert.equal(s.remainingPieces + s.placedCount, s.pieces.length);
  assert.equal(new Set(s.bridges.map(b => b.pieceId)).size, s.bridges.length);
  assert.deepEqual(s.availablePieceIds, s.pieces.filter(p => !p.placed).map(p => p.id));
  for (const p of s.pieces) {
    const b = s.bridges.find(b => b.pieceId === p.id); assert.equal(p.placed, !!b); assert.equal(p.bridgeId, b ? 'bridge-' + p.id : null);
  }
  const adjacency = new Map(s.islands.map(i => [i.id, []]));
  for (const b of s.bridges) { adjacency.get(b.sourceId).push(b.targetId); adjacency.get(b.targetId).push(b.sourceId); }
  const seen = new Set(); let components = 0, largest = 0;
  for (const i of s.islands) {
    const incident = s.bridges.filter(b => b.sourceId === i.id || b.targetId === i.id).map(b => b.pieceId);
    assert.deepEqual(i.incidentPieceIds, incident); assert.equal(i.degree, incident.length);
    if (seen.has(i.id)) continue;
    components++; const queue = [i.id]; seen.add(i.id);
    for (const id of queue) for (const next of adjacency.get(id)) if (!seen.has(next)) { seen.add(next); queue.push(next); }
    largest = Math.max(largest, queue.length); assert.ok(queue.every(id => island(s, id).componentId === i.componentId));
  }
  assert.equal(s.componentCount, components); assert.equal(s.connected, components === 1); assert.equal(s.largestComponentSize, largest);
}

// Synthetic geometry/occupancy fixtures exercise individual public boundaries.
// Injected existing segments may themselves cross a third island, solely to
// reach the defensive overlap/touch test after candidate-local validation.
function fixture(points, attributes = [[5, 'teal'], [1, 'gold']], existing = []) {
  const s = Model.create();
  s.islands = points.map(([gx, gy, color], index) => ({ id: 'I' + (index + 1), gx, gy, color,
    x: s.board.x + gx * s.board.unit, y: s.board.y + gy * s.board.unit,
    degree: 0, incidentPieceIds: [], componentId: null }));
  s.pieces = attributes.map(([length, targetColor], index) => ({ id: 'P' + (index + 1), length, targetColor,
    x: 748 + index % 2 * 112, y: 150 + Math.floor(index / 2) * 108, placed: false, bridgeId: null }));
  s.bridges = existing.map(([pieceId, sourceId, targetId]) => ({ id: 'bridge-' + pieceId, pieceId, sourceId, targetId,
    length: piece(s, pieceId).length, targetColor: piece(s, pieceId).targetColor }));
  s.totalPlacements = s.bridges.length; s.selectedPieceId = s.pieces.find(p => !s.bridges.some(b => b.pieceId === p.id))?.id || null;
  s.selectedIslandId = 'I1'; tick(s); return s;
}
function fixturePreview(s, pieceId, sourceId, targetId) {
  s.stage = 'target'; s.heldPieceId = pieceId; s.selectedPieceId = pieceId;
  s.sourceId = sourceId; s.selectedIslandId = targetId; tick(s); return s.preview;
}
// Self-contained authoring examples for rule evidence. These are ordinary key
// paths, not the separate public-inference pilot integrations supplied by QA.
const TREE = [['P1', 'I1', 'I2'], ['P2', 'I1', 'I4'], ['P3', 'I3', 'I1'], ['P4', 'I3', 'I5'], ['P5', 'I6', 'I5']];
const DISCONNECTED = [['P1', 'I1', 'I2'], ['P2', 'I2', 'I3'], ['P3', 'I3', 'I1'], ['P4', 'I3', 'I5'], ['P5', 'I6', 'I5']];

test('UMD exposes three public 6/6/7-island puzzles with stable piece IDs, exact coordinates and empty components', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['TICK_HZ', 'create', 'step']); assert.equal(Model.TICK_HZ, 60);
  const sandbox = {}; vm.runInNewContext(fs.readFileSync(modelPath, 'utf8'), sandbox);
  assert.deepEqual(clone(sandbox.PureModel.create(2, 1)), Model.create(2, 1));
  for (let d = 0; d < 3; d++) {
    const s = Model.create(2, d); assert.equal(s.islands.length, [6, 6, 7][d]); assert.equal(s.pieces.length, s.islands.length - 1);
    assert.equal(s.level, d + 1); assert.equal(s.phase, 'playing'); assert.equal(s.stage, 'bank'); assert.equal(s.timeLimit, 90);
    assert.equal(s.componentCount, s.islands.length); assert.equal(s.largestComponentSize, 1); assert.equal(s.selectedPieceId, 'P1');
    assert.equal(s.heldPieceId, null); assert.equal(s.sourceId, null); assert.equal(s.preview, null);
    for (const i of s.islands) { assert.equal(i.x, 90 + i.gx * 58); assert.equal(i.y, 110 + i.gy * 58); }
    s.pieces.forEach((p, index) => { assert.equal(p.id, 'P' + (index + 1)); assert.equal(p.x, 748 + index % 2 * 112); assert.equal(p.y, 150 + Math.floor(index / 2) * 108); });
    assert.deepEqual(s.colors.map(c => c.id), ['coral', 'teal', 'gold']); assert.ok(s.colors.every(c => c.rgb.length === 3)); audit(s);
  }
});

test('3-4-5 geometry uses exact squared Euclidean length, rejecting Manhattan 7 and integer near misses', () => {
  for (const [dx, dy, length, valid] of [[4, 3, 5, true], [4, 3, 7, false], [5, 1, 5, false], [4, 4, 5, false]]) {
    const s = fixture([[0, 0, 'coral'], [dx, dy, 'teal'], [8, 5, 'gold']], [[length, 'teal'], [1, 'gold']]);
    const p = fixturePreview(s, 'P1', 'I1', 'I2'); assert.equal(p.distanceSquared, dx * dx + dy * dy);
    assert.equal(p.requiredSquared, length * length); assert.equal(p.valid, valid); assert.equal(p.reason, valid ? null : 'length');
  }
});

test('numeric source color is unrestricted but the colored target is directional', () => {
  for (const color of ['coral', 'teal', 'gold']) {
    const s = fixture([[0, 0, color], [4, 3, 'teal'], [8, 5, 'gold']]);
    assert.equal(fixturePreview(s, 'P1', 'I1', 'I2').valid, true);
    const reversed = fixturePreview(s, 'P1', 'I2', 'I1'); assert.equal(reversed.valid, color === 'teal');
    assert.equal(reversed.reason, color === 'teal' ? null : 'color');
  }
});

test('invalid preview precedence is same-island, exact length, color, then third-island obstruction', () => {
  const s = fixture([[0, 0, 'coral'], [4, 0, 'gold'], [2, 0, 'teal']], [[4, 'gold'], [4, 'gold']], [['P1', 'I1', 'I2']]);
  assert.equal(fixturePreview(s, 'P2', 'I1', 'I1').reason, 'same-island');
  assert.equal(fixturePreview(s, 'P2', 'I1', 'I3').reason, 'length');
  assert.equal(fixturePreview(s, 'P2', 'I2', 'I1').reason, 'color');
  const through = fixturePreview(s, 'P2', 'I1', 'I2');
  assert.equal(through.reason, 'through-island', 'through-island precedes occupied/intersection');
  assert.equal(through.blockingIslandId, 'I3'); assert.equal(through.blockingPieceId, null); assert.equal(through.resultingComponentCount, null);
});

test('an existing unordered pair is occupied even if source and target are reversed', () => {
  const s = fixture([[0, 0, 'coral'], [4, 0, 'teal'], [0, 3, 'gold']], [[4, 'teal'], [4, 'coral']], [['P1', 'I1', 'I2']]);
  const p = fixturePreview(s, 'P2', 'I2', 'I1'); assert.equal(p.reason, 'occupied'); assert.equal(p.blockingPieceId, 'P1');
  const before = network(s); tick(s, { a: true }); assert.deepEqual(network(s), before); assert.equal(s.failedCommits, 1);
});

test('a proper crossing between two exact length-5 diagonals is forbidden without a shared island', () => {
  const s = fixture([[0, 0, 'coral'], [4, 3, 'teal'], [0, 3, 'coral'], [4, 0, 'gold']],
    [[5, 'teal'], [5, 'gold']], [['P1', 'I1', 'I2']]);
  const p = fixturePreview(s, 'P2', 'I3', 'I4'); assert.equal(p.reason, 'intersection'); assert.equal(p.blockingPieceId, 'P1');
  assert.equal(p.blockingIslandId, null); assert.equal(p.valid, false);
});

test('exactly one shared endpoint is allowed for bent and opposite-ray collinear bridges', () => {
  const bent = fixture([[0, 0, 'coral'], [4, 0, 'teal'], [4, 3, 'gold']],
    [[4, 'teal'], [3, 'gold']], [['P1', 'I1', 'I2']]);
  assert.equal(fixturePreview(bent, 'P2', 'I2', 'I3').valid, true);
  const straight = fixture([[0, 0, 'coral'], [2, 0, 'teal'], [4, 0, 'gold']],
    [[2, 'teal'], [2, 'gold']], [['P1', 'I1', 'I2']]);
  assert.equal(fixturePreview(straight, 'P2', 'I2', 'I3').valid, true);
  const separated = fixture([[0, 0, 'coral'], [2, 0, 'teal'], [4, 0, 'coral'], [6, 0, 'gold']],
    [[2, 'teal'], [2, 'gold']], [['P1', 'I1', 'I2']]);
  assert.equal(fixturePreview(separated, 'P2', 'I3', 'I4').valid, true, 'disjoint collinear segments do not intersect');
});

test('synthetic preexisting geometry cannot permit same-ray overlap, contained overlap or endpoint/interior touching', () => {
  const shared = fixture([[0, 0, 'coral'], [4, 0, 'gold'], [2, 0, 'teal']],
    [[4, 'gold'], [2, 'teal']], [['P1', 'I1', 'I2']]);
  assert.equal(fixturePreview(shared, 'P2', 'I1', 'I3').reason, 'intersection');
  const contained = fixture([[0, 0, 'coral'], [4, 0, 'gold'], [1, 0, 'coral'], [3, 0, 'teal']],
    [[4, 'gold'], [2, 'teal']], [['P1', 'I1', 'I2']]);
  assert.equal(fixturePreview(contained, 'P2', 'I3', 'I4').reason, 'intersection');
  const touch = fixture([[0, 0, 'coral'], [4, 0, 'teal'], [2, 2, 'coral'], [2, 0, 'gold']],
    [[4, 'teal'], [2, 'gold']], [['P1', 'I1', 'I2']]);
  assert.equal(fixturePreview(touch, 'P2', 'I3', 'I4').reason, 'intersection');
});

test('pickup, source selection and legal preview change no inventory, network, degree or placement counters', () => {
  const s = Model.create(); const before = network(s); pressA(s);
  assert.equal(s.stage, 'source'); assert.equal(s.heldPieceId, 'P1'); assert.deepEqual(network(s), before);
  pressA(s); assert.equal(s.stage, 'target'); assert.equal(s.preview.reason, 'same-island'); assert.deepEqual(network(s), before);
  focus(s, 'I2'); assert.equal(s.preview.valid, true); assert.equal(s.preview.resultingComponentCount, 5);
  assert.equal(s.preview.wouldFinish, false); assert.deepEqual(network(s), before); assert.equal(s.placementAttempts, 0);
  const preview = clone(s.preview); tick(s, { a: true });
  assert.equal(s.lastPlacement.accepted, preview.valid); assert.equal(s.lastPlacement.reason, preview.reason);
  assert.equal(s.componentCount, preview.resultingComponentCount); assert.equal(s.placedCount, 1); assert.equal(s.selectedPieceId, 'P2');
  assert.equal(s.totalPlacements, 1); assert.equal(s.placementAttempts, 1); assert.equal(s.failedCommits, 0); audit(s);
});

test('target/source B cancellation restores the former source then held bank card without removing placed bridges', () => {
  const s = Model.create(); place(s, 'P4', 'I3', 'I5'); const before = network(s);
  aim(s, 'P3', 'I3', 'I1'); pressB(s);
  assert.equal(s.stage, 'source'); assert.equal(s.selectedIslandId, 'I3'); assert.equal(s.sourceId, null); assert.equal(s.heldPieceId, 'P3');
  assert.equal(s.cancels, 1); assert.deepEqual(network(s), before);
  pressB(s); assert.equal(s.stage, 'bank'); assert.equal(s.selectedPieceId, 'P3'); assert.equal(s.heldPieceId, null);
  assert.equal(s.cancels, 2); assert.equal(s.undos, 0); assert.deepEqual(network(s), before);
});

test('equal printed pieces stay distinct and LIFO undo restores exactly the removed instance and detached feedback', () => {
  const s = Model.create(); assert.equal(piece(s, 'P4').length, piece(s, 'P5').length);
  assert.equal(piece(s, 'P4').targetColor, piece(s, 'P5').targetColor);
  place(s, 'P4', 'I3', 'I5'); assert.equal(s.selectedPieceId, 'P5'); place(s, 'P5', 'I6', 'I5');
  assert.equal(s.selectedPieceId, 'P1', 'after the final card, select first remaining card');
  assert.deepEqual(s.bridges.map(b => b.pieceId), ['P4', 'P5']); const removed = s.bridges[1], placement = clone(s.lastPlacement);
  pressB(s); assert.equal(piece(s, 'P4').placed, true); assert.equal(piece(s, 'P5').placed, false); assert.equal(s.selectedPieceId, 'P5');
  assert.deepEqual(s.availablePieceIds, ['P1', 'P2', 'P3', 'P5']); assert.notStrictEqual(s.lastUndo, removed);
  assert.equal(s.lastUndo.pieceId, 'P5'); assert.equal(removed.at, undefined); assert.deepEqual(s.lastPlacement, placement);
  const undoCopy = clone(s.lastUndo); pressB(s); assert.equal(s.lastUndo.pieceId, 'P4'); assert.equal(s.placedCount, 0);
  assert.equal(undoCopy.pieceId, 'P5'); assert.equal(s.totalPlacements, 2); assert.equal(s.undos, 2); audit(s);
});

test('illegal commits retain inventory, occupancy and selections, count once per edge and lose on the third', () => {
  const s = Model.create(); pressA(s); pressA(s); const before = network(s);
  tick(s, { a: true }); assert.equal(s.failedCommits, 1); assert.equal(s.placementAttempts, 1);
  assert.equal(s.lastPlacement.reason, 'same-island'); assert.equal(s.stage, 'target'); assert.equal(s.sourceId, 'I1'); assert.equal(s.selectedIslandId, 'I1');
  assert.deepEqual(network(s), before); ticks(s, 50, { a: true }); assert.equal(s.failedCommits, 1);
  tick(s); pressA(s); assert.equal(s.failedCommits, 2); assert.equal(s.phase, 'playing'); assert.deepEqual(network(s), before);
  pressA(s); assert.equal(s.failedCommits, 3); assert.equal(s.placementAttempts, 3); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'invalid');
  assert.deepEqual(network(s), before); assert.equal(s.totalPlacements, 0);
});

test('undo restores current progress but never refunds clock, errors, attempts or lifetime placements', () => {
  const s = Model.create(); const initial = network(s); place(s, 'P1', 'I1', 'I2');
  pressA(s); pressA(s); pressA(s); assert.equal(s.failedCommits, 1); assert.equal(s.placementAttempts, 2);
  pressB(s); pressB(s); const at = s.elapsed, rejected = clone(s.lastPlacement); pressB(s);
  assert.deepEqual(network(s), initial); assert.ok(s.elapsed > at); assert.equal(s.failedCommits, 1); assert.equal(s.placementAttempts, 2);
  assert.equal(s.totalPlacements, 1); assert.equal(s.undos, 1); assert.equal(s.cancels, 2); assert.deepEqual(s.lastPlacement, rejected);
  assert.equal(s.lastUndo.pieceId, 'P1'); assert.equal(s.selectedPieceId, 'P1'); audit(s);
});

test('ordinary authoring example uses every piece legally yet loses because a cycle leaves I4 isolated', () => {
  const s = Model.create();
  for (const placement of DISCONNECTED.slice(0, -1)) place(s, ...placement);
  const last = aim(s, ...DISCONNECTED.at(-1));
  assert.equal(last.valid, true); assert.equal(last.wouldFinish, true); assert.equal(last.resultingComponentCount, 2);
  assert.equal(last.wouldConnectAll, false); assert.equal(last.wouldLoseDisconnected, true); assert.match(s.message, /断连/);
  pressA(s); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'disconnected'); assert.equal(s.lastPlacement.accepted, true);
  assert.equal(s.bridges.length, s.islands.length - 1); assert.equal(s.componentCount, 2); assert.equal(island(s, 'I4').degree, 0);
  assert.equal(s.largestComponentSize, 5); assert.equal(s.failedCommits, 0); assert.equal(s.remainingPieces, 0);
  assert.equal(s.selectedPieceId, null); assert.equal(s.cursor, null); assert.equal(s.score, 660); audit(s);
});

test('ordinary tree example wins only after the final legal piece really connects every island', () => {
  const s = Model.create(); for (const placement of TREE.slice(0, -1)) place(s, ...placement);
  assert.equal(s.phase, 'playing'); const last = aim(s, ...TREE.at(-1));
  assert.equal(last.wouldFinish, true); assert.equal(last.wouldConnectAll, true); assert.equal(last.wouldLoseDisconnected, false);
  assert.equal(last.resultingComponentCount, 1); pressA(s);
  assert.equal(s.phase, 'won'); assert.equal(s.connected, true); assert.equal(s.componentCount, 1); assert.equal(s.largestComponentSize, 6);
  assert.equal(s.remainingPieces, 0); assert.equal(s.failedCommits, 0); assert.equal(s.score, 700 + 1000 + Math.floor(s.remaining) * 5); audit(s);
  const incomplete = fixture([[0, 0, 'coral'], [2, 0, 'teal']], [[2, 'teal'], [2, 'coral']]);
  fixturePreview(incomplete, 'P1', 'I1', 'I2'); tick(incomplete, { a: true });
  assert.equal(incomplete.connected, true); assert.equal(incomplete.remainingPieces, 1); assert.equal(incomplete.phase, 'playing');
});

test('bank navigation uses displayed spatial cards rather than linear order and excludes placed pieces', () => {
  const s = Model.create(); tick(s, { y: 1 }); assert.equal(s.selectedPieceId, 'P3');
  tick(s); tick(s, { y: 1 }); assert.equal(s.selectedPieceId, 'P5');
  tick(s, { x: 1 }); assert.equal(s.selectedPieceId, 'P4'); tick(s); tick(s, { x: 1 });
  assert.equal(s.selectedPieceId, 'P4'); assert.equal(s.lastAction.type, 'select-blocked');
  place(s, 'P3', 'I3', 'I1'); focus(s, 'P1'); tick(s, { y: 1 });
  assert.equal(s.selectedPieceId, 'P4', 'missing card directly below makes the closer diagonal card eligible');
});

test('island navigation minimizes squared distance, then perpendicular distance, then array index without legal-edge filtering', () => {
  const near = fixture([[0, 0, 'coral'], [2, 2, 'teal'], [3, 0, 'gold']]); pressA(near); tick(near, { x: 1 });
  assert.equal(near.selectedIslandId, 'I2', 'distance 8 wins over aligned distance 9');
  const perpendicular = fixture([[0, 0, 'coral'], [3, 4, 'teal'], [5, 0, 'gold']]); pressA(perpendicular); tick(perpendicular, { x: 1 });
  assert.equal(perpendicular.selectedIslandId, 'I3', 'both distances 25, less perpendicular displacement wins');
  const ordered = fixture([[4, 2, 'coral'], [3, 0, 'teal'], [5, 0, 'gold']]); pressA(ordered); tick(ordered, { y: -1 });
  assert.equal(ordered.selectedIslandId, 'I2', 'equal distance and perpendicular displacement uses array order');
});

test('all authored island graphs and every nonempty available bank subset remain reachable through actual selection inputs', () => {
  function reachable(graph) {
    for (const start of Object.keys(graph)) {
      const seen = new Set([start]), queue = [start];
      for (const id of queue) for (const next of graph[id]) if (!seen.has(next)) { seen.add(next); queue.push(next); }
      assert.equal(seen.size, Object.keys(graph).length);
    }
  }
  for (let d = 0; d < 3; d++) {
    const base = Model.create(1, d); pressA(base); const islands = {};
    for (const i of base.islands) {
      islands[i.id] = dirs.map(([x, y]) => { const s = clone(base); s.selectedIslandId = i.id; tick(s); tick(s, { x, y }); return s.selectedIslandId; });
    }
    reachable(islands);
    for (let mask = 1; mask < 1 << base.pieces.length; mask++) {
      // Synthetic occupancy only tests card selection; repeated injected island
      // pairs are intentionally not asserted to be a legal played network.
      const bank = Model.create(1, d);
      bank.bridges = bank.pieces.filter((p, i) => !(mask & 1 << i)).map(p => ({ id: 'bridge-' + p.id, pieceId: p.id,
        sourceId: 'I1', targetId: 'I2', length: p.length, targetColor: p.targetColor }));
      bank.totalPlacements = bank.bridges.length; tick(bank); const graph = {};
      for (const id of bank.availablePieceIds) graph[id] = dirs.map(([x, y]) => {
        const s = clone(bank); s.selectedPieceId = id; tick(s); tick(s, { x, y }); assert.ok(s.availablePieceIds.includes(s.selectedPieceId)); return s.selectedPieceId;
      });
      reachable(graph);
    }
  }
});

test('selection has 20/10 held repeats, neutral/change reset, dominant axis, horizontal ties and no wrap', () => {
  const s = fixture([[0, 0, 'coral'], [1, 0, 'teal'], [2, 0, 'gold'], [3, 0, 'coral'], [4, 0, 'teal']]); pressA(s);
  tick(s, { x: 1 }); assert.equal(s.selectedIslandId, 'I2'); ticks(s, 19, { x: 1 }); assert.equal(s.selectedIslandId, 'I2');
  tick(s, { x: 1 }); assert.equal(s.selectedIslandId, 'I3'); ticks(s, 9, { x: 1 }); assert.equal(s.selectedIslandId, 'I3');
  tick(s, { x: 1 }); assert.equal(s.selectedIslandId, 'I4'); tick(s); tick(s, { x: 1 }); assert.equal(s.selectedIslandId, 'I5');
  tick(s, { x: -1 }); assert.equal(s.selectedIslandId, 'I4'); tick(s, { y: -1 }); assert.equal(s.selectedIslandId, 'I4'); assert.equal(s.lastAction.type, 'select-blocked');
  for (const [input, id] of [[{ x: .5, y: .5 }, 'P2'], [{ x: .4, y: .5 }, 'P3'], [{ x: .249, y: -.249 }, 'P1'], [{ x: .25 }, 'P2']]) {
    const current = Model.create(); tick(current, input); assert.equal(current.selectedPieceId, id);
  }
});

test('navigation precedes A in bank and source, while B discards coalesced A and navigation for its tick', () => {
  const s = Model.create(); tick(s, { y: 1, a: true }); assert.equal(s.heldPieceId, 'P3'); assert.equal(s.stage, 'source');
  assert.deepEqual(s.events.map(e => e.type), ['select', 'pick']); tick(s); tick(s, { x: 1, a: true });
  assert.equal(s.sourceId, 'I2'); assert.equal(s.selectedIslandId, 'I2'); assert.equal(s.stage, 'target');
  assert.deepEqual(s.events.map(e => e.type), ['select', 'source']); tick(s);
  tick(s, { b: true, a: true, x: 1 }); assert.equal(s.stage, 'source'); assert.equal(s.selectedIslandId, 'I2'); assert.equal(s.placementAttempts, 0);
  assert.deepEqual(s.events.map(e => e.type), ['cancel']);
  tick(s, { b: true, a: true, x: 1 }); assert.equal(s.selectedIslandId, 'I5'); assert.equal(s.stage, 'source'); assert.equal(s.cancels, 1);
});

test('larger dt preserves per-tick B priority and later held-direction movement without replaying discarded A', () => {
  const combined = Model.create(), split = Model.create();
  Model.step(combined, .25, { b: true, aPressed: true, x: 1 });
  tick(split, { b: true, aPressed: true, x: 1 }); ticks(split, 14, { b: true, x: 1 });
  assert.equal(combined.stage, 'bank'); assert.equal(combined.selectedPieceId, 'P2'); assert.equal(combined.placementAttempts, 0);
  assert.deepEqual(combined.events.map(e => e.type), ['undo-empty', 'select']);
  const { events: ea, _accumulator: ra, ...a } = combined, { events: eb, _accumulator: rb, ...b } = split;
  assert.ok(Math.abs(ra - rb) < 1e-12); assert.deepEqual(a, b);
});

test('zero/subtick edges execute only after a fixed tick and held A/B cannot repeat stage transitions or undo', () => {
  const s = Model.create(); Model.step(s, DT / 2, { aPressed: true }); assert.equal(s.stage, 'bank'); assert.equal(s.tick, 0);
  Model.step(s, DT / 2, {}); assert.equal(s.stage, 'source');
  Model.step(s, 0, { aPressed: true }); Model.step(s, 0, { bPressed: true, x: 1 }); assert.equal(s.stage, 'source');
  tick(s); assert.equal(s.stage, 'bank'); assert.equal(s.selectedPieceId, 'P1'); tick(s); assert.equal(s.stage, 'bank');
  tick(s, { a: true }); ticks(s, 50, { a: true }); assert.equal(s.stage, 'source'); assert.equal(s.placementAttempts, 0);
  tick(s); tick(s, { b: true }); ticks(s, 50, { b: true }); assert.equal(s.cancels, 2); assert.equal(s.undos, 0);
});

test('cancellation clears pending actions and repeats but preserves held preview, selection and actual network', () => {
  const first = Model.create(); tick(first, { cancelEpoch: 7, a: true }); assert.equal(first.stage, 'source');
  const s = Model.create(); tick(s, { cancelEpoch: 2 }); place(s, 'P4', 'I3', 'I5'); aim(s, 'P1', 'I1', 'I2');
  const before = clone({ network: network(s), stage: s.stage, selectedPieceId: s.selectedPieceId, selectedIslandId: s.selectedIslandId,
    heldPieceId: s.heldPieceId, sourceId: s.sourceId, preview: s.preview }); const at = s.tick;
  tick(s, { cancelEpoch: 3, a: true, b: true, y: 1 }); ticks(s, 8, { cancelled: true, a: true, b: true, aPressed: true, bPressed: true, x: 1 });
  assert.deepEqual({ network: network(s), stage: s.stage, selectedPieceId: s.selectedPieceId, selectedIslandId: s.selectedIslandId,
    heldPieceId: s.heldPieceId, sourceId: s.sourceId, preview: s.preview }, before); assert.equal(s.tick, at + 9);
  tick(s, { a: true, b: true }); assert.equal(s.stage, 'target'); tick(s); tick(s, { b: true }); assert.equal(s.stage, 'source');
  const pending = Model.create(); Model.step(pending, DT / 2, { aPressed: true, bPressed: true }); Model.step(pending, DT / 2, { cancelled: true });
  tick(pending); assert.equal(pending.stage, 'bank'); assert.equal(pending.cancels, 0); assert.equal(pending.heldPieceId, null);
});

test('undo/re-place cannot farm score and empty undo is free', () => {
  const s = Model.create(); pressB(s); assert.equal(s.lastAction.type, 'undo-empty'); assert.equal(s.undos, 0); assert.equal(s.score, 0);
  for (let i = 0; i < 3; i++) {
    place(s, 'P1', 'I1', 'I2'); assert.equal(s.score, 140); pressB(s); assert.equal(s.score, 0);
  }
  assert.equal(s.totalPlacements, 3); assert.equal(s.undos, 3); assert.equal(s.placedCount, 0); assert.equal(s.placementAttempts, 3); audit(s);
});

test('deadline precedes a would-be winning last commit, undo and navigation', () => {
  const final = Model.create(); for (const placement of TREE.slice(0, -1)) place(final, ...placement); aim(final, ...TREE.at(-1));
  const undo = Model.create(); place(undo, ...TREE[0]); const navigation = Model.create();
  for (const [s, input] of [[final, { a: true }], [undo, { b: true }], [navigation, { x: 1 }]]) {
    const before = network(s), selection = [s.stage, s.selectedPieceId, s.selectedIslandId, s.heldPieceId, s.sourceId];
    const counters = [s.totalPlacements, s.undos, s.cancels, s.placementAttempts, s.failedCommits]; s.timeLimit = (s.tick + 1) / 60;
    tick(s, input); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'timeout'); assert.equal(s.remaining, 0);
    assert.deepEqual(network(s), before); assert.deepEqual([s.stage, s.selectedPieceId, s.selectedIslandId, s.heldPieceId, s.sourceId], selection);
    assert.deepEqual([s.totalPlacements, s.undos, s.cancels, s.placementAttempts, s.failedCommits], counters); assert.deepEqual(s.events.map(e => e.type), ['lost']);
  }
});

test('terminal calls freeze all fields while retry arrays and JSON continuations remain independent', () => {
  const won = Model.create(); for (const placement of TREE) place(won, ...placement);
  const lost = Model.create(); lost.timeLimit = DT; tick(lost);
  for (const s of [won, lost]) {
    const frozen = clone(s); for (const dt of [0, DT, .25, 100, NaN]) Model.step(s, dt, { aPressed: true, bPressed: true, x: 1, cancelEpoch: 99 });
    assert.deepEqual(s, frozen);
  }
  const active = Model.create(3, 1); pressA(active); tick(active, { y: 1 }); const restored = clone(active);
  tick(active); tick(restored); pressA(active); pressA(restored); assert.deepEqual(active, restored);
  const retry = Model.create(3, 1), original = Model.create(3, 1); assert.deepEqual(retry, original);
  for (const key of ['islands', 'pieces', 'bridges', 'availablePieceIds', 'colors']) assert.notStrictEqual(retry[key], active[key]);
  assert.notStrictEqual(retry.islands[0].incidentPieceIds, active.islands[0].incidentPieceIds); assert.notStrictEqual(retry.colors[0].rgb, active.colors[0].rgb);
});

test('numeric inputs are bounded and ordinary resource counts remain finite and consistent', () => {
  const s = Model.create(); for (const dt of [NaN, Infinity, -Infinity, -1, '1', undefined]) Model.step(s, dt, {});
  assert.equal(s.tick, 0); tick(s, { x: NaN, y: Infinity }); assert.equal(s.selectedPieceId, 'P1');
  tick(s, { x: 1e30 }); assert.equal(s.selectedPieceId, 'P2'); const at = s.tick; Model.step(s, 100, {}); assert.equal(s.tick, at + 15);
  assert.equal(Model.create(NaN, NaN).seed, 1); assert.equal(Model.create(1, -9).level, 1);
  assert.equal(Model.create(1, 99).level, 3); assert.equal(Model.create(1, 1.9).level, 2);
  assert.ok(s.events.length <= 32); assert.ok(s.bridges.length <= s.pieces.length); audit(s);
  function finiteTree(value) { if (typeof value === 'number') assert.ok(Number.isFinite(value)); else if (value && typeof value === 'object') Object.values(value).forEach(finiteTree); }
  finiteTree(s);
});

// Ordinary integration scenarios: only public JSON observations enter the
// independent planner; all simulation changes come from genuine input ticks.
{
 const ordinaryTest=require('node:test'),ordinaryAssert=require('node:assert/strict');
 const OrdinaryModel=require('../src/main/assets/game-model.js');
 const {pathToFileURL:ordinaryURL}=require('node:url'),ordinaryPath=require('node:path');
 const ordinaryModule=import(ordinaryURL(ordinaryPath.join(__dirname,'automation.mjs')).href);
 function ordinarySnapshot(s){return{phase:s.phase,paused:false,model:JSON.parse(JSON.stringify(s,(key,value)=>key.startsWith('_')?undefined:value))};}
 function ordinaryFreeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(ordinaryFreeze);Object.freeze(v);}return v;}
 function ordinaryTap(s,input){OrdinaryModel.step(s,1/60,input);OrdinaryModel.step(s,1/60,{});}
 for(let difficulty=0;difficulty<3;difficulty++){
  ordinaryTest(`public-planned ordinary trial, exact-instance undo/repair and full win on island puzzle ${difficulty+1}`,async()=>{
   const automation=await ordinaryModule,pilot=automation.createPilot(),s=OrdinaryModel.create(31,difficulty);
   const initial=ordinarySnapshot(s),trace=[{elapsed:0,state:initial}];let keys=[],lastA=false,lastB=false;
   // A defined runtime-style 60 Hz scenario, observed every five ticks; it does
   // not promise that any arbitrary input cadence or user plan must succeed.
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
   ordinaryAssert.equal(s.undos,1);ordinaryAssert.equal(s.totalPlacements,s.pieces.length+1);
   ordinaryAssert.equal(s.failedCommits,0);ordinaryAssert.equal(s.remainingPieces,0);ordinaryAssert.equal(s.componentCount,1);
   const diagnostics=pilot.diagnostics(),undo=diagnostics.find(e=>e.type==='observed-undo');
   ordinaryAssert.ok(undo,'B must undo a real committed bridge');
   const placements=diagnostics.filter(e=>e.type==='observed-placement');
   const first=placements.find(e=>e.pieceId===undo.pieceId&&e.elapsed<undo.elapsed);
   const repaired=placements.find(e=>e.pieceId===undo.pieceId&&e.elapsed>undo.elapsed);
   ordinaryAssert.ok(first&&repaired);ordinaryAssert.equal(repaired.sourceId,first.sourceId);ordinaryAssert.equal(repaired.targetId,first.targetId);
   const a=s.islands.find(i=>i.id===first.sourceId),b=s.islands.find(i=>i.id===first.targetId);
   ordinaryAssert.ok(a.gx!==b.gx&&a.gy!==b.gy,'the visible trial demonstrates a real diagonal bridge');
   ordinaryAssert.equal((a.gx-b.gx)**2+(a.gy-b.gy)**2,25);
   const frozen=JSON.stringify(s);OrdinaryModel.step(s,.25,{b:true,a:true,x:1,cancelled:true});ordinaryAssert.equal(JSON.stringify(s),frozen);
   automation.assertRetry({after:ordinarySnapshot(OrdinaryModel.create(31,difficulty)),initial},ordinaryAssert);
  });
  ordinaryTest(`ordinary three visible illegal target commits lose island puzzle ${difficulty+1} without consuming pieces`,()=>{
   const s=OrdinaryModel.create(31,difficulty),inventory=s.availablePieceIds.slice();
   ordinaryTap(s,{a:true});ordinaryAssert.equal(s.stage,'source');
   ordinaryTap(s,{a:true});ordinaryAssert.equal(s.stage,'target');
   ordinaryAssert.equal(s.preview.reason,'same-island');ordinaryAssert.equal(s.preview.valid,false);
   for(let strike=1;strike<=3;strike++){
    ordinaryTap(s,{a:true});ordinaryAssert.equal(s.failedCommits,strike);ordinaryAssert.equal(s.placementAttempts,strike);
    ordinaryAssert.equal(s.lastPlacement.accepted,false);ordinaryAssert.equal(s.lastPlacement.reason,'same-island');
    ordinaryAssert.equal(s.phase,strike===3?'lost':'playing');ordinaryAssert.deepEqual(s.availablePieceIds,inventory);
    ordinaryAssert.equal(s.bridges.length,0);ordinaryAssert.equal(s.totalPlacements,0);
   }
   ordinaryAssert.equal(s.lostReason,'invalid');ordinaryAssert.equal(s.score,0);ordinaryAssert.equal(s.componentCount,s.islands.length);
   ordinaryAssert.ok(s.islands.every(i=>i.degree===0&&i.incidentPieceIds.length===0));
   const frozen=JSON.stringify(s);OrdinaryModel.step(s,.25,{b:true});ordinaryAssert.equal(JSON.stringify(s),frozen);
  });
 }
}
