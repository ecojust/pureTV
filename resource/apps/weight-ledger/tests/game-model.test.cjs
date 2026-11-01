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
const directions = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]];
const tick = (s, input = {}) => Model.step(s, DT, input);
function ticks(s, count, input = {}) { for (let i = 0; i < count; i++) tick(s, input); return s; }
function pressA(s) { tick(s, { a: true }); tick(s); return s; }
function pressB(s) { tick(s, { b: true }); tick(s); return s; }
const getWeight = (s, id) => s.weights.find(w => w.id === id);
const getTray = (s, id) => s.trays.find(t => t.id === id);

// This helper plans only cursor movement from the public selection coordinates.
// It neither searches puzzle allocations nor reads an authored solution.
function focus(s, target) {
  const items = s.selectionItems;
  const queue = [[s.selectedId, []]], seen = new Set([s.selectedId]);
  let route;
  for (let i = 0; i < queue.length; i++) {
    const [id, path] = queue[i];
    if (id === target) { route = path; break; }
    const current = items.find(item => item.id === id);
    for (const [, dx, dy] of directions) {
      const candidates = items.map((item, order) => ({ item, order,
        forward: (item.x - current.x) * dx + (item.y - current.y) * dy,
        perpendicular: Math.abs((item.x - current.x) * dy - (item.y - current.y) * dx) }))
        .filter(c => c.forward > 0).sort((a, b) => (3 * a.perpendicular + a.forward) - (3 * b.perpendicular + b.forward) || a.order - b.order);
      if (!candidates.length || seen.has(candidates[0].item.id)) continue;
      seen.add(candidates[0].item.id); queue.push([candidates[0].item.id, [...path, { x: dx, y: dy }]]);
    }
  }
  assert.ok(route, `public cursor can reach ${target}`);
  for (const input of route) { tick(s, input); tick(s); }
  assert.equal(s.selectedId, target);
}
function relocate(s, id, destination) { focus(s, id); pressA(s); focus(s, destination); pressA(s); return s; }
function allocation(s) {
  return clone({ weights: s.weights, trays: s.trays, scales: s.scales, inventoryIds: s.inventoryIds,
    inventoryCount: s.inventoryCount, deployedCount: s.deployedCount, totalMass: s.totalMass,
    allDeployed: s.allDeployed, balancedCount: s.balancedCount, allBalanced: s.allBalanced,
    movesUsed: s.movesUsed, movesRemaining: s.movesRemaining, historyDepth: s.historyDepth, score: s.score });
}
function audit(s) {
  assert.deepEqual(s.weights.map(w => w.id).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6]);
  const ids = s.trays.flatMap(t => t.weightIds).sort((a, b) => a - b);
  assert.deepEqual(ids, [1, 2, 3, 4, 5, 6]); assert.equal(new Set(ids).size, 6);
  let total = 0;
  for (const tray of s.trays) {
    const actual = s.weights.filter(w => w.trayId === tray.id).sort((a, b) => a.id - b.id);
    assert.deepEqual(tray.weightIds, actual.map(w => w.id));
    assert.equal(tray.totalMass, actual.reduce((sum, w) => sum + w.mass, 0)); total += tray.totalMass;
    actual.forEach((w, k) => {
      assert.equal(w.slot, k); assert.equal(w.x, tray.x + (k % 3 - 1) * 54);
      assert.equal(w.y, tray.y + (Math.floor(k / 3) - .5) * 48 + 10);
      assert.ok(Number.isInteger(w.mass) && w.mass > 0);
    });
  }
  assert.equal(s.totalMass, total); assert.deepEqual(s.inventoryIds, getTray(s, 'bank').weightIds);
  assert.equal(s.deployedCount + s.inventoryCount, 6); assert.equal(s.allDeployed, s.inventoryCount === 0);
  for (const scale of s.scales) {
    const evaluate = side => side.constant + side.terms.reduce((sum, term) => sum + term.coefficient * getTray(s, term.trayId).totalMass, 0);
    assert.equal(scale.leftTotal, evaluate(scale.left)); assert.equal(scale.rightTotal, evaluate(scale.right));
    assert.equal(scale.delta, scale.leftTotal - scale.rightTotal); assert.equal(scale.balanced, scale.delta === 0);
    assert.ok(Number.isInteger(scale.leftTotal) && Number.isInteger(scale.rightTotal));
  }
  assert.equal(s.movesRemaining, s.moveBudget - s.movesUsed);
}
const side = (terms = [], constant = 0) => ({ terms: terms.map(([trayId, coefficient]) => ({ trayId, coefficient })), constant });
const scale = (id, left, right) => ({ id, label: id, left, right });

// Explicit public-state boundary fixtures. Pickup then B cancellation invokes
// normal derived-state refresh without a private refresh or outcome hook.
function fixture({ difficulty = 0, traysById = {}, placements = {}, masses = {}, scales, moveBudget = 20 } = {}) {
  const s = Model.create(5, difficulty);
  s.weights.forEach(w => { if (placements[w.id]) w.trayId = placements[w.id]; if (masses[w.id]) w.mass = masses[w.id]; });
  s.trays.forEach(t => Object.assign(t, traysById[t.id] || {}));
  if (scales) s.scales = clone(scales);
  s.moveBudget = moveBudget;
  pressA(s); pressB(s);
  return s;
}
function winningBoundary() {
  return fixture({ moveBudget: 1, placements: { 1: 'bank', 2: 'A', 3: 'A', 4: 'A', 5: 'A', 6: 'A' },
    scales: [scale('a', side([['A', 1]]), side([], 15)),
      scale('ab', side([['A', 1], ['B', 1]]), side([], 15)),
      scale('ac', side([['A', 1], ['C', 1]]), side([], 15))] });
}

test('UMD API and three authored boards expose independent six-weight integer puzzles with 3/4/5 budgets', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['TICK_HZ', 'create', 'step']); assert.equal(Model.TICK_HZ, 60);
  const sandbox = {}; vm.runInNewContext(fs.readFileSync(modelPath, 'utf8'), sandbox);
  assert.deepEqual(clone(sandbox.PureModel.create(2, 1)), Model.create(2, 1));
  for (let d = 0; d < 3; d++) {
    const s = Model.create(2, d);
    assert.equal(s.level, d + 1); assert.equal(s.moveBudget, [3, 4, 5][d]); assert.equal(s.mode, 'selecting');
    assert.equal(s.phase, 'playing'); assert.equal(s.timeLimit, 90); assert.equal(s.remaining, 90);
    assert.equal(s.movesUsed, 0); assert.equal(s.historyDepth, 0); assert.equal(s.heldWeightId, null);
    assert.deepEqual(s.trays.map(t => t.id), ['A', 'B', 'C', 'bank']);
    assert.ok(s.trays.every(t => t.capacity === 6 && t.width === 220 && t.height === 145));
    assert.equal(s.selectionItems.length, 6); assert.equal(s.scales.length, 3); audit(s);
  }
});

test('authored tray sums and scale deltas are exact integers, including the 2:1 lever coefficients', () => {
  const expected = [
    { masses: [2, 8, 4, 1], left: [10, 12, 6], right: [10, 12, 8], deltas: [0, 0, -2], score: 525 },
    { masses: [3, 3, 4, 6], left: [6, 7, 7], right: [6, 9, 12], deltas: [0, -2, -5], score: 300 },
    { masses: [3, 4, 1, 8], left: [10, 5, 8], right: [7, 17, 16], deltas: [3, -12, -8], score: 75 }
  ];
  expected.forEach((e, d) => {
    const s = Model.create(1, d); assert.deepEqual(s.trays.map(t => t.totalMass), e.masses);
    assert.deepEqual(s.scales.map(t => t.leftTotal), e.left); assert.deepEqual(s.scales.map(t => t.rightTotal), e.right);
    assert.deepEqual(s.scales.map(t => t.delta), e.deltas); assert.equal(s.score, e.score);
  });
  const s = fixture({ placements: { 1: 'A', 2: 'A', 3: 'A', 4: 'A', 5: 'A', 6: 'A' },
    scales: [scale('one-gram-off', side([['A', 2]]), side([], 29))] });
  assert.equal(s.scales[0].leftTotal, 30); assert.equal(s.scales[0].delta, 1); assert.equal(s.allBalanced, false);
  assert.equal(s.totalMass, 15, 'a 2:1 lever does not duplicate physical mass');
});

test('every distinct authored tray-pair relocation changes at least two actual scale deltas', () => {
  for (let d = 0; d < 3; d++) for (const from of ['A', 'B', 'C', 'bank']) for (const to of ['A', 'B', 'C', 'bank']) {
    if (from === to) continue;
    const s = fixture({ difficulty: d, placements: { 1: from } });
    const before = s.scales.map(t => t.delta); relocate(s, 1, to);
    const changed = s.scales.filter((t, i) => t.delta !== before[i]).map(t => t.id);
    assert.ok(changed.length >= 2, `level ${d + 1}: ${from} → ${to}`);
    assert.deepEqual(s.lastTransfer.changedScaleIds, changed); assert.equal(s.movesUsed, 1); audit(s);
  }
});

test('equal masses are separate physical IDs and a placement moves exactly the chosen instance once', () => {
  const s = Model.create(); const initial = clone(s.weights); assert.equal(getWeight(s, 2).mass, getWeight(s, 3).mass);
  relocate(s, 3, 'C');
  assert.equal(getWeight(s, 2).trayId, 'A'); assert.equal(getWeight(s, 3).trayId, 'C');
  for (const w of s.weights) { assert.equal(w.mass, initial.find(old => old.id === w.id).mass); if (w.id !== 3) assert.equal(w.trayId, initial.find(old => old.id === w.id).trayId); }
  assert.equal(s.movesUsed, 1); assert.equal(s.totalMoves, 1); assert.equal(s.historyDepth, 1);
  assert.equal(s.lastTransfer.weightId, 3); assert.equal(s.lastTransfer.fromTrayId, 'B'); assert.equal(s.lastTransfer.toTrayId, 'C'); audit(s);
});

test('balanced equations cannot win with any weight still in inventory', () => {
  const zeroScales = [1, 2, 3].map(i => scale(`zero-${i}`, side(), side()));
  const s = fixture({ placements: { 1: 'bank', 2: 'bank', 3: 'bank', 4: 'bank', 5: 'bank', 6: 'bank' }, scales: zeroScales });
  assert.equal(s.allBalanced, true); assert.equal(s.allDeployed, false); assert.equal(s.phase, 'playing');
  relocate(s, 1, 'A'); assert.equal(s.allBalanced, true); assert.equal(s.inventoryCount, 5); assert.equal(s.phase, 'playing');
  assert.equal(s.score, 625); audit(s);
});

test('pickup and B cancellation preserve actual weights, coordinates, inventory, totals, budget and history', () => {
  const s = Model.create(); const before = allocation(s); const picked = s.pickups, cancelled = s.cancels;
  pressA(s); assert.equal(s.heldWeightId, 1); assert.equal(s.mode, 'placing'); assert.equal(s.selectedTrayId, 'bank');
  assert.deepEqual(allocation(s), before); assert.equal(s.pickups, picked + 1); assert.equal(s.selectionItems.length, 4);
  focus(s, 'A'); assert.deepEqual(allocation(s), before); assert.equal(getWeight(s, 1).trayId, 'bank');
  pressB(s); assert.equal(s.heldWeightId, null); assert.equal(s.mode, 'selecting'); assert.equal(s.selectedTrayId, null);
  assert.deepEqual(allocation(s), before); assert.equal(s.cancels, cancelled + 1); assert.equal(s.selectedWeightId, 1); audit(s);
});

test('same-tray A returns a pickup freely and a held A never commits or picks repeatedly', () => {
  const s = Model.create(); const before = allocation(s);
  tick(s, { a: true }); ticks(s, 50, { a: true });
  assert.equal(s.pickups, 1); assert.equal(s.heldWeightId, 1); assert.equal(s.movesUsed, 0); assert.deepEqual(allocation(s), before);
  tick(s); tick(s, { a: true }); assert.equal(s.mode, 'selecting'); assert.equal(s.cancels, 1); assert.equal(s.lastAction.type, 'return');
  ticks(s, 50, { a: true }); assert.equal(s.pickups, 1); assert.equal(s.cancels, 1); assert.deepEqual(allocation(s), before);
});

test('a full public destination rejects freely and leaves the same pickup available for another destination', () => {
  const s = fixture({ traysById: { B: { capacity: 3 } } }); const before = allocation(s);
  pressA(s); focus(s, 'B'); tick(s, { a: true });
  assert.equal(s.invalidPlacements, 1); assert.equal(s.lastAction.reason, 'capacity'); assert.equal(s.heldWeightId, 1);
  assert.equal(s.mode, 'placing'); assert.equal(s.selectedTrayId, 'B'); assert.deepEqual(allocation(s), before);
  ticks(s, 30, { a: true }); assert.equal(s.invalidPlacements, 1); tick(s);
  focus(s, 'A'); pressA(s); assert.equal(s.movesUsed, 1); assert.equal(getWeight(s, 1).trayId, 'A'); assert.equal(s.heldWeightId, null); audit(s);
});

test('B while holding cancels only the preview and never also undoes an earlier commit', () => {
  const s = Model.create(); relocate(s, 1, 'A'); const committed = allocation(s);
  focus(s, 6); pressA(s); assert.equal(s.canUndo, false); const undos = s.undos;
  pressB(s); assert.deepEqual(allocation(s), committed); assert.equal(s.selectedWeightId, 6); assert.equal(s.undos, undos);
  assert.equal(s.historyDepth, 1); assert.equal(s.canUndo, true); assert.equal(s.lastAction.type, 'cancel');
  pressB(s); assert.equal(s.movesUsed, 0); assert.equal(s.historyDepth, 0); assert.equal(s.undos, undos + 1);
});

test('true undo restores all allocation geometry, budget and pre-commit selected ID without rolling back time or counters', () => {
  const s = fixture(); relocate(s, 1, 'A'); const beforeSecond = allocation(s); const firstHistory = clone(s._history[0]);
  focus(s, 3); pressA(s); focus(s, 'C'); pressA(s); assert.equal(s.movesUsed, 2);
  const snapshot = s._history.at(-1), activeWeights = s.weights;
  assert.notStrictEqual(snapshot.weights, activeWeights); assert.notStrictEqual(snapshot.weights[0], activeWeights[0]);
  assert.deepEqual(s._history[0], firstHistory, 'later movement cannot rewrite earlier history');
  focus(s, 6); const at = s.elapsed; const lifetime = [s.totalMoves, s.pickups, s.cancels, s.invalidPlacements];
  pressB(s); assert.deepEqual(allocation(s), beforeSecond); assert.equal(s.selectedWeightId, 3);
  assert.equal(s.heldWeightId, null); assert.equal(s.selectedTrayId, null); assert.equal(s.mode, 'selecting');
  assert.ok(s.elapsed > at); assert.deepEqual([s.totalMoves, s.pickups, s.cancels, s.invalidPlacements], lifetime);
  assert.equal(s.undos, 1); assert.notStrictEqual(s.weights, snapshot.weights); assert.notStrictEqual(s.weights[0], snapshot.weights[0]);
  assert.equal(s.lastTransfer.kind, 'undo'); assert.equal(s.lastTransfer.fromTrayId, 'C'); assert.equal(s.lastTransfer.toTrayId, 'B');
  audit(s);
});

test('empty-history B is free and held B cannot repeatedly cancel or undo', () => {
  const s = Model.create(); const before = allocation(s); tick(s, { b: true }); const action = clone(s.lastAction);
  assert.equal(s.lastAction.type, 'undo-blocked'); assert.equal(s.lastAction.reason, 'empty-history');
  ticks(s, 30, { b: true }); assert.deepEqual(s.lastAction, action); assert.deepEqual(allocation(s), before);
  assert.equal(s.undos, 0); assert.equal(s.cancels, 0); assert.equal(s.totalMoves, 0);
  tick(s); relocate(s, 1, 'A'); tick(s, { b: true }); assert.equal(s.undos, 1);
  ticks(s, 40, { b: true }); assert.equal(s.undos, 1); assert.equal(s.movesUsed, 0);
});

test('spatial selection minimizes weighted forward/perpendicular distance using current public geometry', () => {
  const s = Model.create(); assert.equal(s.selectedWeightId, 1);
  tick(s, { x: -1 }); assert.equal(s.selectedWeightId, 6, 'same-row C weight is west of bank');
  tick(s, { y: -1 }); assert.equal(s.selectedWeightId, 2, 'same-column A weight wins north');
  tick(s, { x: 1 }); assert.equal(s.selectedWeightId, 3, 'nearest aligned B weight wins east');
  tick(s); tick(s, { x: 1 }); assert.equal(s.selectedWeightId, 4);
  const weighted = fixture({ placements: { 1: 'A', 2: 'B', 3: 'C', 4: 'bank', 5: 'bank', 6: 'bank' },
    traysById: { B: { x: 260, y: 170 }, C: { x: 200, y: 151 } } });
  tick(weighted, { x: 1 }); assert.equal(weighted.selectedWeightId, 3, '40 forward + 3×19 perpendicular beats 100 aligned');
});

test('equal spatial costs break by numeric weight ID or the published tray order', () => {
  const weights = fixture({ placements: { 1: 'A', 2: 'B', 3: 'C', 4: 'bank', 5: 'bank', 6: 'bank' },
    traysById: { B: { x: 260, y: 170 }, C: { x: 200, y: 150 } } });
  assert.equal(getWeight(weights, 1).x, 106); tick(weights, { x: 1 });
  assert.equal(weights.selectedWeightId, 2, 'both candidate costs are 100; ID 2 wins over ID 3');
  const trays = fixture({ placements: { 1: 'bank' }, traysById: {
    A: { x: 100, y: 0 }, B: { x: 40, y: 20 }, C: { x: -100, y: 0 }, bank: { x: 0, y: 0 } } });
  pressA(trays); tick(trays, { x: 1 }); assert.equal(trays.selectedTrayId, 'A', 'A wins the 100-cost tie with B');
});

test('repacking sorts actual IDs into slots and subsequent navigation uses the new positions', () => {
  const s = fixture({ placements: { 1: 'A', 2: 'A', 3: 'A', 4: 'A', 5: 'A', 6: 'A' } });
  assert.equal(getWeight(s, 4).y, 204); relocate(s, 1, 'B');
  assert.deepEqual(getTray(s, 'A').weightIds, [2, 3, 4, 5, 6]); assert.equal(getWeight(s, 4).x, 214); assert.equal(getWeight(s, 4).y, 156);
  tick(s, { x: -1 }); assert.equal(s.selectedWeightId, 4, 'new nearest west weight is ID 4, not the old slot occupant');
  assert.equal(s.movesUsed, 1); assert.equal(s.totalMoves, 1); audit(s);
});

test('directional selection has immediate movement, a 20-tick first repeat and 10-tick later repeats', () => {
  const s = Model.create(); focus(s, 2); tick(s, { x: 1 }); assert.equal(s.selectedWeightId, 3);
  ticks(s, 19, { x: 1 }); assert.equal(s.selectedWeightId, 3);
  tick(s, { x: 1 }); assert.equal(s.selectedWeightId, 4);
  ticks(s, 9, { x: 1 }); assert.equal(s.selectedWeightId, 4);
  tick(s, { x: 1 }); assert.equal(s.selectedWeightId, 5);
  ticks(s, 10, { x: 1 }); assert.equal(s.selectedWeightId, 5); assert.equal(s.lastAction.type, 'select-blocked');
  assert.equal(s.movesUsed, 0); assert.equal(s.pickups, 0);
});

test('neutral and direction changes restart selection; deadzone and diagonal ties follow the declared axes', () => {
  const s = Model.create(); focus(s, 2); tick(s, { x: 1 }); tick(s); tick(s, { x: 1 }); assert.equal(s.selectedWeightId, 4);
  tick(s, { x: -1 }); assert.equal(s.selectedWeightId, 3); ticks(s, 19, { x: -1 }); assert.equal(s.selectedWeightId, 3);
  tick(s, { x: -1 }); assert.equal(s.selectedWeightId, 2);
  for (const [input, id] of [[{ x: -.5, y: -.5 }, 6], [{ x: -.4, y: -.5 }, 3], [{ x: -.249, y: .249 }, 1], [{ x: -.25 }, 6]]) {
    const current = Model.create(); tick(current, input); assert.equal(current.selectedWeightId, id);
  }
});

test('navigation precedes A pickup/placement, while B has priority and discards simultaneous A without navigating', () => {
  const s = Model.create(); tick(s, { x: -1, a: true });
  assert.equal(s.heldWeightId, 6); assert.equal(s.selectedTrayId, 'C'); assert.deepEqual(s.events.map(e => e.type), ['select', 'pick']);
  tick(s); tick(s, { y: -1, a: true });
  assert.equal(getWeight(s, 6).trayId, 'A'); assert.equal(s.movesUsed, 1); assert.deepEqual(s.events.map(e => e.type), ['select', 'place']);
  tick(s); pressA(s); const held = s.heldWeightId;
  tick(s, { b: true, a: true, x: 1 }); assert.equal(s.heldWeightId, null); assert.equal(s.selectedWeightId, held);
  assert.deepEqual(s.events.map(e => e.type), ['cancel']); assert.equal(s.movesUsed, 1); const pickups = s.pickups;
  tick(s, { b: true, a: true, x: 1 }); assert.equal(s.mode, 'selecting'); assert.equal(s.pickups, pickups);
  assert.equal(s.lastAction.type, 'select');
});

test('B priority applies per fixed tick, including a larger dt call with later held-direction navigation', () => {
  const combined = Model.create(), split = clone(combined);
  Model.step(combined, .25, { b: true, aPressed: true, x: 1 });
  tick(split, { b: true, aPressed: true, x: 1 }); ticks(split, 14, { b: true, x: 1 });
  assert.equal(combined.selectedWeightId, 4); assert.equal(combined.pickups, 0); assert.equal(combined.movesUsed, 0);
  assert.deepEqual(combined.events.map(e => e.type), ['undo-blocked', 'select']);
  const { events: ea, _accumulator: ra, ...a } = combined, { events: eb, _accumulator: rb, ...b } = split;
  assert.ok(Math.abs(ra - rb) < 1e-12); assert.deepEqual(a, b);
});

test('fractional and zero-dt edges cache exactly one action and discard A when a pending B takes priority', () => {
  const s = Model.create(); Model.step(s, DT / 2, { aPressed: true }); assert.equal(s.pickups, 0); assert.equal(s.tick, 0);
  Model.step(s, DT / 2, {}); assert.equal(s.pickups, 1); assert.equal(s.heldWeightId, 1);
  Model.step(s, 0, { aPressed: true }); Model.step(s, 0, { bPressed: true });
  assert.equal(s.heldWeightId, 1); assert.equal(s.movesUsed, 0); tick(s); assert.equal(s.heldWeightId, null); assert.equal(s.cancels, 1);
  tick(s); assert.equal(s.pickups, 1); assert.equal(s.movesUsed, 0); assert.equal(s.historyDepth, 0);
});

test('cancellation metadata clears input queues and repeat state but preserves a deliberate pickup and destination', () => {
  const initial = Model.create(); tick(initial, { cancelEpoch: 5, a: true }); assert.equal(initial.heldWeightId, 1);
  const s = Model.create(); tick(s, { cancelEpoch: 2 }); pressA(s); focus(s, 'A');
  const before = allocation(s), at = s.tick, counts = [s.pickups, s.cancels, s.undos];
  tick(s, { cancelEpoch: 3, a: true, b: true, x: 1 });
  ticks(s, 8, { cancelled: true, aPressed: true, bPressed: true, a: true, b: true, y: 1 });
  assert.deepEqual(allocation(s), before); assert.equal(s.heldWeightId, 1); assert.equal(s.selectedTrayId, 'A');
  assert.equal(s.tick, at + 9); assert.deepEqual([s.pickups, s.cancels, s.undos], counts);
  tick(s, { a: true, b: true }); assert.equal(s.heldWeightId, 1, 'continued held buttons are not fresh edges');
  tick(s); tick(s, { b: true }); assert.equal(s.heldWeightId, null); assert.equal(s.cancels, counts[1] + 1);
  const pending = Model.create(); Model.step(pending, DT / 2, { aPressed: true, bPressed: true });
  Model.step(pending, DT / 2, { cancelled: true }); tick(pending); assert.equal(pending.pickups, 0); assert.equal(pending.heldWeightId, null);
});

test('the last allowed committed move wins before exhausted-budget loss when every weight is deployed and balanced', () => {
  const s = winningBoundary(); assert.equal(s.movesRemaining, 1); assert.equal(s.allBalanced, false);
  relocate(s, 1, 'A'); assert.equal(s.phase, 'won'); assert.equal(s.movesUsed, 1); assert.equal(s.movesRemaining, 0);
  assert.equal(s.allDeployed, true); assert.equal(s.allBalanced, true); assert.equal(s.historyDepth, 1); assert.equal(s.canUndo, false);
  assert.equal(s.score, 600 + 150 + 1000 + Math.floor(s.remaining) * 5); audit(s);
});

test('a last unbalanced move or balanced move with inventory remaining loses immediately and cannot be undone', () => {
  const unbalanced = fixture({ moveBudget: 1 }); relocate(unbalanced, 1, 'A');
  assert.equal(unbalanced.phase, 'lost'); assert.equal(unbalanced.lostReason, 'moves'); assert.equal(unbalanced.allBalanced, false);
  const inventory = fixture({ moveBudget: 1, placements: { 1: 'bank', 2: 'bank', 3: 'bank', 4: 'bank', 5: 'bank', 6: 'bank' },
    scales: [1, 2, 3].map(i => scale(`empty-${i}`, side(), side())) });
  relocate(inventory, 1, 'A'); assert.equal(inventory.allBalanced, true); assert.equal(inventory.allDeployed, false);
  assert.equal(inventory.phase, 'lost'); assert.equal(inventory.lostReason, 'moves');
  for (const s of [unbalanced, inventory]) {
    assert.equal(s.movesRemaining, 0); assert.equal(s.canUndo, false); const frozen = clone(s); tick(s, { b: true }); assert.deepEqual(s, frozen);
  }
});

test('score recomputes from allocation, so pickup/cancel and undo/repeat cannot farm points', () => {
  const s = fixture(); const originalScore = s.score; const initialCounters = [s.pickups, s.cancels];
  for (let i = 0; i < 3; i++) {
    pressA(s); assert.equal(s.score, originalScore); pressB(s); assert.equal(s.score, originalScore);
    relocate(s, 1, 'A'); const placedScore = s.balancedCount * 200 + s.deployedCount * 25;
    assert.equal(s.score, placedScore); pressB(s); assert.equal(s.score, originalScore);
  }
  assert.equal(s.movesUsed, 0); assert.equal(s.totalMoves, 3); assert.equal(s.undos, 3);
  assert.equal(s.pickups, initialCounters[0] + 6); assert.equal(s.cancels, initialCounters[1] + 3);
});

test('deadline precedes a winning placement, an undo and directional selection on the expiry tick', () => {
  const place = winningBoundary(); pressA(place); focus(place, 'A');
  const undo = Model.create(); relocate(undo, 1, 'A');
  const select = Model.create();
  for (const [s, input] of [[place, { a: true }], [undo, { b: true }], [select, { x: 1 }]]) {
    const before = allocation(s), selected = s.selectedId, held = s.heldWeightId;
    const counters = [s.totalMoves, s.pickups, s.cancels, s.undos]; s.timeLimit = (s.tick + 1) / 60;
    tick(s, input); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'timeout'); assert.equal(s.remaining, 0);
    assert.deepEqual(allocation(s), before); assert.equal(s.selectedId, selected); assert.equal(s.heldWeightId, held);
    assert.deepEqual([s.totalMoves, s.pickups, s.cancels, s.undos], counters); assert.deepEqual(s.events.map(e => e.type), ['lost']);
  }
});

test('transfer feedback expires with active time, terminal states freeze it and retries are fully independent', () => {
  const active = Model.create(); relocate(active, 1, 'A'); assert.equal(active.lastTransfer.kind, 'place');
  assert.equal(active.lastTransfer.expiresAt, active.lastTransfer.at + .6); ticks(active, 40); assert.equal(active.lastTransfer, null);
  const won = winningBoundary(); relocate(won, 1, 'A'); const lost = fixture({ moveBudget: 1 }); relocate(lost, 1, 'A');
  for (const s of [won, lost]) {
    const frozen = clone(s);
    for (const dt of [0, DT, .25, 100, NaN]) Model.step(s, dt, { aPressed: true, bPressed: true, x: 1, cancelEpoch: 100 });
    assert.deepEqual(s, frozen);
  }
  const retry = Model.create(), original = Model.create(); assert.deepEqual(retry, original);
  for (const key of ['weights', 'trays', 'scales', 'selectionItems', 'inventoryIds', '_history']) assert.notStrictEqual(retry[key], active[key]);
  assert.notStrictEqual(retry.scales[0].left.terms, active.scales[0].left.terms);
  assert.equal(retry.pickups, 0); assert.equal(retry.totalMoves, 0); assert.equal(retry.lastTransfer, null);
});

test('JSON states continue identically, numeric inputs are bounded and finite resources respect board limits', () => {
  const s = fixture(); relocate(s, 1, 'A'); pressA(s); const restored = clone(s);
  focus(s, 'C'); focus(restored, 'C'); pressA(s); pressA(restored); assert.deepEqual(s, restored);
  pressB(s); pressB(restored); assert.deepEqual(s, restored); audit(s);
  const invalid = Model.create();
  for (const dt of [NaN, Infinity, -Infinity, -1, '1', undefined]) Model.step(invalid, dt, {});
  assert.equal(invalid.tick, 0); tick(invalid, { x: NaN, y: Infinity }); assert.equal(invalid.selectedWeightId, 1);
  const at = invalid.tick; Model.step(invalid, 100, {}); assert.equal(invalid.tick, at + 15);
  assert.equal(Model.create(NaN, NaN).seed, 1); assert.equal(Model.create(1, -9).level, 1);
  assert.equal(Model.create(1, 99).level, 3); assert.equal(Model.create(1, 1.9).level, 2);
  assert.ok(s.historyDepth <= s.moveBudget); assert.ok(s.events.length <= 32); assert.equal(s.weights.length, 6);
  function finiteTree(value) { if (typeof value === 'number') assert.ok(Number.isFinite(value)); else if (value && typeof value === 'object') Object.values(value).forEach(finiteTree); }
  finiteTree(s); finiteTree(invalid);
});

// Fresh authored rounds below use no state fixtures. The controller receives
// only public snapshots and sends ordinary keys at a defined runtime schedule:
// 60 Hz physics and observation every five ticks. Success is not guaranteed for
// arbitrary input timing or arbitrary player decisions.
function publicSnapshot(s) {
  return { phase: s.phase, paused: false,
    model: clone(Object.fromEntries(Object.entries(s).filter(([key]) => !key.startsWith('_')))) };
}
for (let difficulty = 0; difficulty < 3; difficulty++) {
  test(`authored ledger ${difficulty + 1}: public controller trial, actual undo and final exact integer win`, async () => {
    const automation = await import('./automation.mjs');
    const pilot = automation.createPilot(), s = Model.create(1, difficulty);
    const initial = publicSnapshot(s), trace = [];
    let held = [], previousA = false, previousB = false, trial = null, undone = null;
    for (let frame = 0; frame < 5400 && s.phase === 'playing'; frame++) {
      if (frame % 5 === 0) {
        const observation = publicSnapshot(s); trace.push({ state: observation });
        held = pilot(observation, { mode: 'record', elapsed: s.elapsed });
        assert.ok(Array.isArray(held));
        assert.ok(held.every(key => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'b'].includes(key)));
      }
      const x = Number(held.includes('ArrowRight')) - Number(held.includes('ArrowLeft'));
      const y = Number(held.includes('ArrowDown')) - Number(held.includes('ArrowUp'));
      const length = Math.max(1, Math.hypot(x, y)), a = held.includes('Space'), b = held.includes('b');
      Model.step(s, DT, { x: x / length, y: y / length, a, b,
        aPressed: a && !previousA, bPressed: b && !previousB, cancelEpoch: 0 });
      previousA = a; previousB = b;
      audit(s);
      if (!trial && s.events.some(event => event.type === 'place')) trial = publicSnapshot(s);
      if (s.events.some(event => event.type === 'undo')) undone = publicSnapshot(s);
    }
    const after = publicSnapshot(s); trace.push({ state: after });
    automation.assertProgress({ after, trace, initial }, assert);
    assert.ok(s.elapsed >= 30 && s.elapsed < 90); assert.equal(s.movesUsed, s.moveBudget);
    assert.equal(s.undos, 1); assert.equal(s.totalMoves, s.moveBudget + 1);
    assert.ok(trial); assert.equal(trial.model.totalMoves, 1); assert.equal(trial.model.movesUsed, 1);
    assert.equal(trial.model.phase, 'playing'); assert.ok(trial.model.lastTransfer.changedScaleIds.length >= 2);
    assert.ok(undone); assert.equal(undone.model.mode, 'selecting'); assert.equal(undone.model.heldWeightId, null);
    assert.equal(undone.model.movesUsed, 0); assert.equal(undone.model.movesRemaining, s.moveBudget);
    assert.equal(undone.model.historyDepth, 0); assert.equal(undone.model.totalMoves, 1); assert.equal(undone.model.undos, 1);
    for (const key of ['weights', 'trays', 'scales', 'inventoryIds', 'totalMass', 'score'])
      assert.deepEqual(undone.model[key], initial.model[key], `undo restores actual ${key}`);
    assert.ok(undone.model.elapsed > trial.model.elapsed, 'undo never refunds active time');
    const inspectingTrial = trace.filter(item => item.state.model.totalMoves === 1 && item.state.model.undos === 0);
    assert.ok(inspectingTrial.at(-1).state.model.elapsed - inspectingTrial[0].state.model.elapsed >= 4.2);
    automation.assertRetry({ after: publicSnapshot(Model.create(1, difficulty)), initial }, assert);
    const frozen = clone(s); Model.step(s, DT, { b: true, a: true }); assert.deepEqual(s, frozen);
  });

  test(`authored ledger ${difficulty + 1}: ordinary repeated relocation genuinely exhausts the budget`, async () => {
    const automation = await import('./automation.mjs');
    const s = Model.create(1, difficulty), original = publicSnapshot(s);
    const id = s.weights[0].id, activeTray = getWeight(s, id).trayId === 'bank' ? 'A' : getWeight(s, id).trayId;
    for (let move = 1; move <= s.moveBudget; move++) {
      assert.equal(s.phase, 'playing');
      const destination = getWeight(s, id).trayId === 'bank' ? activeTray : 'bank';
      // focus/pressA above use only public coordinates and ordinary step calls.
      relocate(s, id, destination);
      assert.equal(s.movesUsed, move); assert.equal(s.totalMoves, move); assert.equal(s.undos, 0);
      assert.ok(s.lastTransfer.changedScaleIds.length >= 2);
      for (const w of s.weights) if (w.id !== id)
        assert.equal(w.trayId, original.model.weights.find(old => old.id === w.id).trayId);
      automation.assertPublicAllocation(publicSnapshot(s).model, assert);
    }
    assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'moves'); assert.equal(s.movesRemaining, 0);
    assert.equal(s.allDeployed && s.allBalanced, false); assert.equal(s.canUndo, false);
    assert.equal(s.score, s.balancedCount * 200 + s.deployedCount * 25);
    const frozen = clone(s); pressB(s); assert.deepEqual(s, frozen, 'a terminal exhausted round cannot be undone');
    automation.assertRetry({ after: publicSnapshot(Model.create(1, difficulty)), initial: original }, assert);
  });
}
