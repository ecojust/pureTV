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
function focus(s, id) {
  const col = id % 4, row = Math.floor(id / 4);
  while (s.cursor.col !== col) { tick(s, { x: Math.sign(col - s.cursor.col) }); tick(s); }
  while (s.cursor.row !== row) { tick(s, { y: Math.sign(row - s.cursor.row) }); tick(s); }
  assert.equal(s.selectedId, id);
}
const allIds = Array.from({ length: 16 }, (_, i) => i);
const pattern = s => s.cells.map(c => c.open);
const counts = s => s.cells.map(c => c.directWaterCount);
function garden(s) {
  return clone({ cells: s.cells, targetPattern: s.targetPattern, markedIds: s.markedIds,
    selectedId: s.selectedId, cursor: s.cursor, nozzle: s.nozzle, previewIds: s.previewIds,
    waterUsed: s.waterUsed, waterRemaining: s.waterRemaining, nozzleSwitches: s.nozzleSwitches,
    totalAffectedToggles: s.totalAffectedToggles, score: s.score, matchedCells: s.matchedCells,
    satisfiedMarked: s.satisfiedMarked, goalMatched: s.goalMatched });
}
function audit(s) {
  assert.equal(s.cells.length, 16); assert.equal(counts(s).reduce((sum, count) => sum + count, 0), s.waterUsed);
  assert.equal(s.waterRemaining, s.waterBudget - s.waterUsed);
  for (const c of s.cells) {
    assert.ok(Number.isInteger(c.directWaterCount) && c.directWaterCount >= 0);
    assert.equal(c.directParity, c.directWaterCount % 2);
    assert.equal(c.conditionMet, !c.requiresEven || (c.open && c.directWaterCount % 2 === 0));
    assert.equal(c.matched, c.open === c.targetOpen);
  }
  assert.equal(s.matchedCells, s.cells.filter(c => c.matched).length);
  assert.equal(s.satisfiedMarked, s.cells.filter(c => c.requiresEven && c.conditionMet).length);
  assert.equal(s.patternMatched, s.matchedCells === 16);
  assert.equal(s.allMarkedSatisfied, s.satisfiedMarked === s.markedCount);
  assert.equal(s.goalMatched, s.patternMatched && s.allMarkedSatisfied);
  assert.deepEqual(s.targetPattern, s.cells.map(c => c.targetOpen));
  assert.deepEqual(s.markedIds, s.cells.filter(c => c.requiresEven).map(c => c.id));
  assert.deepEqual(s.previewIds, [...new Set(s.previewIds)].sort((a, b) => a - b));
  assert.ok(s.previewIds.every(id => id >= 0 && id < 16));
}

// Explicit public-state rule boundary fixtures, not authored puzzle solutions.
// Two real B edges refresh derived fields while returning to the cross nozzle.
function fixture({ open = [], target = allIds, marked = [], directCounts = {}, waterBudget = 30 } = {}) {
  const s = Model.create(41, 0);
  s.cells.forEach(c => {
    c.open = open.includes(c.id); c.targetOpen = target.includes(c.id);
    c.requiresEven = marked.includes(c.id); c.directWaterCount = directCounts[c.id] || 0;
  });
  s.waterUsed = counts(s).reduce((sum, count) => sum + count, 0); s.waterBudget = waterBudget;
  pressB(s); pressB(s); return s;
}
function winningBoundary(waterBudget = 1) {
  return fixture({ target: [1, 4, 5, 6, 9], marked: [1], waterBudget });
}

test('UMD API and authored 4×4 puzzles expose zero counts, full 6/8/10 water and compatible 4/6/8 marks', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['TICK_HZ', 'create', 'step']); assert.equal(Model.TICK_HZ, 60);
  const sandbox = {}; vm.runInNewContext(fs.readFileSync(modelPath, 'utf8'), sandbox);
  assert.deepEqual(clone(sandbox.PureModel.create(8, 1)), Model.create(8, 1));
  for (let d = 0; d < 3; d++) {
    const s = Model.create(8, d);
    assert.equal(s.level, d + 1); assert.equal(s.waterBudget, [6, 8, 10][d]); assert.equal(s.waterRemaining, s.waterBudget);
    assert.equal(s.markedCount, [4, 6, 8][d]); assert.ok(s.markedIds.every(id => s.cells[id].targetOpen));
    assert.equal(s.phase, 'playing'); assert.equal(s.goalMatched, false); assert.equal(s.selectedId, 5); assert.equal(s.nozzle, 'cross');
    assert.equal(s.timeLimit, 90); assert.equal(s.remaining, 90); assert.equal(s.waterUsed, 0); assert.equal(s.lastWater, null);
    for (const c of s.cells) {
      assert.equal(c.id, c.row * 4 + c.col); assert.equal(c.x, 304 + (c.col + .5) * 78); assert.equal(c.y, 100 + (c.row + .5) * 78);
      assert.equal(c.directWaterCount, 0);
    }
    audit(s);
  }
});

test('cross nozzle has exact clipped corner, edge and interior sets without row wrapping', () => {
  const cases = [[0, [0, 1, 4]], [3, [2, 3, 7]], [12, [8, 12, 13]], [15, [11, 14, 15]],
    [1, [0, 1, 2, 5]], [4, [0, 4, 5, 8]], [7, [3, 6, 7, 11]], [14, [10, 13, 14, 15]],
    [5, [1, 4, 5, 6, 9]], [10, [6, 9, 10, 11, 14]]];
  for (const [center, expected] of cases) {
    const s = fixture(); focus(s, center); assert.deepEqual(s.previewIds, expected);
    tick(s, { a: true }); assert.deepEqual(s.cells.filter(c => c.open).map(c => c.id), expected);
    assert.deepEqual(s.lastWater.affectedIds, expected); assert.equal(s.totalAffectedToggles, expected.length); audit(s);
  }
});

test('diagonal nozzle has exact clipped corners, edges and interiors, including only the selected center', () => {
  const cases = [[0, [0, 5]], [3, [3, 6]], [12, [9, 12]], [15, [10, 15]],
    [1, [1, 4, 6]], [4, [1, 4, 9]], [7, [2, 7, 10]], [14, [9, 11, 14]],
    [5, [0, 2, 5, 8, 10]], [10, [5, 7, 10, 13, 15]]];
  for (const [center, expected] of cases) {
    const s = fixture(); pressB(s); focus(s, center); assert.deepEqual(s.previewIds, expected);
    tick(s, { a: true }); assert.deepEqual(s.cells.filter(c => c.open).map(c => c.id), expected);
    assert.deepEqual(s.lastWater.affectedIds, expected); assert.equal(s.totalAffectedToggles, expected.length); audit(s);
  }
});

test('public duplicate or out-of-bounds offsets do not duplicate toggles and previews remain sorted unique sets', () => {
  const s = fixture(); focus(s, 0);
  // Boundary fixture deliberately duplicates valid offsets and adds clipped ones.
  s.nozzles[0].offsets.unshift({ dx: 1, dy: 0 }, { dx: 0, dy: 0 }, { dx: -99, dy: 0 }, { dx: 0, dy: 99 });
  pressB(s); pressB(s); assert.deepEqual(s.previewIds, [0, 1, 4]);
  tick(s, { a: true }); assert.deepEqual(s.cells.filter(c => c.open).map(c => c.id), [0, 1, 4]);
  assert.equal(s.totalAffectedToggles, 3); assert.equal(s.cells[0].directWaterCount, 1); assert.equal(s.lastWater.changes.length, 3); audit(s);
});

test('one A atomically flips the affected set, increments only its center and records actual before/after provenance', () => {
  const s = fixture({ open: [0, 1, 5, 15], marked: [1, 5] });
  const before = pattern(s), affected = [1, 4, 5, 6, 9]; tick(s, { a: true });
  s.cells.forEach((c, id) => {
    assert.equal(c.open, affected.includes(id) ? !before[id] : before[id]);
    assert.equal(c.directWaterCount, id === 5 ? 1 : 0);
  });
  assert.equal(s.waterUsed, 1); assert.equal(s.waterRemaining, 29); assert.equal(s.totalAffectedToggles, 5);
  assert.equal(s.lastWater.id, 1); assert.equal(s.lastWater.cellId, 5); assert.equal(s.lastWater.nozzle, 'cross');
  assert.equal(s.lastWater.directBefore, 0); assert.equal(s.lastWater.directAfter, 1);
  assert.deepEqual(s.lastWater.changes, affected.map(id => ({ cellId: id, beforeOpen: before[id], afterOpen: !before[id] })));
  assert.deepEqual(s.events.map(e => e.type), ['water']); audit(s);
});

test('indirect opening leaves direct parity unchanged, while an odd directly watered marked flower stays unsatisfied', () => {
  const s = fixture({ marked: [5] }); focus(s, 4); pressA(s);
  assert.equal(s.cells[5].open, true); assert.equal(s.cells[5].directWaterCount, 0); assert.equal(s.cells[5].conditionMet, true);
  focus(s, 5); pressA(s); assert.equal(s.cells[5].open, false); assert.equal(s.cells[5].directWaterCount, 1);
  focus(s, 6); pressA(s); assert.equal(s.cells[5].open, true); assert.equal(s.cells[5].directWaterCount, 1);
  assert.equal(s.cells[5].directParity, 1); assert.equal(s.cells[5].conditionMet, false); assert.equal(s.satisfiedMarked, 0);
  assert.equal(s.waterUsed, 3); assert.deepEqual(counts(s).filter(Boolean), [1, 1, 1]); audit(s);
});

test('marked satisfaction is the conjunction of open and even, including zero; unmarked cells ignore direct parity', () => {
  for (const [open, count, expected] of [[true, 0, true], [true, 2, true], [true, 1, false],
    [false, 0, false], [false, 2, false], [false, 1, false]]) {
    const s = fixture({ open: open ? [5] : [], marked: [5], directCounts: { 5: count } });
    assert.equal(s.cells[5].conditionMet, expected, `open=${open}, directCount=${count}`);
    assert.equal(s.cells[5].directParity, count % 2); assert.equal(s.satisfiedMarked, Number(expected)); audit(s);
  }
  for (const open of [false, true]) {
    const s = fixture({ open: open ? [5] : [], target: [5], directCounts: { 5: 3 } });
    assert.equal(s.cells[5].conditionMet, true); assert.equal(s.cells[5].matched, open);
    assert.equal(s.allMarkedSatisfied, true); assert.equal(s.patternMatched, open);
  }
});

test('two identical actions restore flower pattern and direct parity but add two exact counts and spend two drops', () => {
  for (const nozzle of ['cross', 'diagonal']) for (const center of [0, 5]) {
    const s = fixture({ open: [2, 6, 12], marked: [5], directCounts: { [center]: 4 } });
    focus(s, center); if (nozzle === 'diagonal') pressB(s);
    const before = pattern(s), parities = s.cells.map(c => c.directParity), water = s.waterUsed, remaining = s.waterRemaining;
    const size = s.previewIds.length; pressA(s); pressA(s);
    assert.deepEqual(pattern(s), before); assert.deepEqual(s.cells.map(c => c.directParity), parities);
    assert.equal(s.cells[center].directWaterCount, 6, 'exact count is not collapsed to a parity bit');
    assert.equal(s.waterUsed, water + 2); assert.equal(s.waterRemaining, remaining - 2);
    assert.equal(s.totalAffectedToggles, 2 * size); assert.equal(s.phase, 'playing'); audit(s);
  }
});

test('B changes the actual next neighborhood without changing flowers, counts, water or score', () => {
  const s = fixture({ open: [2, 4], marked: [5] }); const before = clone(s.cells), score = s.score, switches = s.nozzleSwitches;
  assert.deepEqual(s.previewIds, [1, 4, 5, 6, 9]); pressB(s);
  assert.equal(s.nozzle, 'diagonal'); assert.equal(s.nozzleSwitches, switches + 1); assert.deepEqual(s.previewIds, [0, 2, 5, 8, 10]);
  assert.deepEqual(s.cells, before); assert.equal(s.waterUsed, 0); assert.equal(s.waterRemaining, 30); assert.equal(s.score, score);
  tick(s, { a: true }); assert.deepEqual(s.lastWater.affectedIds, [0, 2, 5, 8, 10]); assert.equal(s.lastWater.nozzle, 'diagonal');
  assert.equal(s.cells[4].open, true, 'cross-only neighbor is unchanged by diagonal watering');
});

test('held A and B perform only one action each, while a released and newly pressed button works again', () => {
  const s = fixture(); tick(s, { a: true }); ticks(s, 50, { a: true }); assert.equal(s.waterUsed, 1);
  tick(s); tick(s, { a: true }); assert.equal(s.waterUsed, 2); tick(s);
  const switches = s.nozzleSwitches; tick(s, { b: true }); ticks(s, 50, { b: true });
  assert.equal(s.nozzleSwitches, switches + 1); assert.equal(s.nozzle, 'diagonal'); assert.equal(s.waterUsed, 2);
  tick(s); tick(s, { b: true }); assert.equal(s.nozzleSwitches, switches + 2); assert.equal(s.nozzle, 'cross');
});

test('a matching flower pattern with an odd marked center is not victory and exposes the independent failed condition', () => {
  const s = fixture({ target: [1, 4, 5, 6, 9], marked: [5] }); tick(s, { a: true });
  assert.equal(s.patternMatched, true); assert.equal(s.matchedCells, 16); assert.equal(s.cells[5].matched, true);
  assert.equal(s.cells[5].open, true); assert.equal(s.cells[5].directParity, 1); assert.equal(s.cells[5].conditionMet, false);
  assert.equal(s.allMarkedSatisfied, false); assert.equal(s.goalMatched, false); assert.equal(s.phase, 'playing');
  assert.equal(s.score, 320); assert.match(s.message, /花形已匹配/);
});

test('even but closed marked flowers fail, and satisfied marked flowers cannot compensate for a wrong pattern', () => {
  const closed = fixture({ marked: [5], directCounts: { 5: 2 } });
  assert.equal(closed.cells[5].directParity, 0); assert.equal(closed.cells[5].open, false);
  assert.equal(closed.cells[5].conditionMet, false); assert.equal(closed.goalMatched, false);
  const wrongPattern = fixture({ open: [5], marked: [5] });
  assert.equal(wrongPattern.allMarkedSatisfied, true); assert.equal(wrongPattern.patternMatched, false); assert.equal(wrongPattern.goalMatched, false);
  focus(wrongPattern, 15); tick(wrongPattern, { a: true });
  assert.equal(wrongPattern.allMarkedSatisfied, true); assert.equal(wrongPattern.patternMatched, false); assert.equal(wrongPattern.phase, 'playing');
});

test('the last drop can win before the empty-water check with an indirectly opened zero-even marked flower', () => {
  const s = winningBoundary(); tick(s, { a: true });
  assert.equal(s.waterUsed, 1); assert.equal(s.waterRemaining, 0); assert.equal(s.phase, 'won'); assert.equal(s.lostReason, null);
  assert.equal(s.goalMatched, true); assert.equal(s.cells[1].open, true); assert.equal(s.cells[1].directWaterCount, 0);
  assert.equal(s.cells[1].conditionMet, true); assert.equal(s.cells[5].directWaterCount, 1);
  assert.equal(s.score, 320 + 40 + 1000 + Math.floor(s.remaining) * 5);
  assert.deepEqual(s.events.map(e => e.type), ['water', 'won']); audit(s);
});

test('exhausting water with wrong pattern or odd marked parity immediately loses and cannot be refunded by B', () => {
  const patternWrong = fixture({ waterBudget: 2 }); pressA(patternWrong); pressA(patternWrong);
  assert.equal(patternWrong.waterRemaining, 0); assert.equal(patternWrong.patternMatched, false); assert.equal(patternWrong.phase, 'lost');
  const odd = fixture({ target: [1, 4, 5, 6, 9], marked: [5], waterBudget: 1 }); tick(odd, { a: true });
  assert.equal(odd.patternMatched, true); assert.equal(odd.allMarkedSatisfied, false); assert.equal(odd.phase, 'lost');
  for (const s of [patternWrong, odd]) {
    assert.equal(s.lostReason, 'water'); assert.equal(s.waterUsed, s.waterBudget);
    const frozen = clone(s); tick(s, { b: true, aPressed: true }); assert.deepEqual(s, frozen); audit(s);
  }
});

test('cursor navigation is immediate, first repeats after 20 ticks, then every 10, and clamps without wrapping', () => {
  const s = Model.create(); focus(s, 0); tick(s, { x: 1 }); assert.equal(s.selectedId, 1);
  ticks(s, 19, { x: 1 }); assert.equal(s.selectedId, 1); tick(s, { x: 1 }); assert.equal(s.selectedId, 2);
  ticks(s, 9, { x: 1 }); assert.equal(s.selectedId, 2); tick(s, { x: 1 }); assert.equal(s.selectedId, 3);
  ticks(s, 10, { x: 1 }); assert.equal(s.selectedId, 3); assert.equal(s.lastAction.type, 'select-blocked');
  tick(s, { y: -1 }); assert.equal(s.selectedId, 3); assert.equal(s.lastAction.type, 'select-blocked');
  assert.equal(s.waterUsed, 0); assert.equal(s.nozzleSwitches, 0);
});

test('neutral release and direction changes reset cursor delay, with dominant axes and horizontal diagonal ties', () => {
  const s = Model.create(); tick(s, { x: 1 }); tick(s); tick(s, { x: 1 }); assert.equal(s.selectedId, 7);
  tick(s, { x: -1 }); assert.equal(s.selectedId, 6); ticks(s, 19, { x: -1 }); assert.equal(s.selectedId, 6);
  tick(s, { x: -1 }); assert.equal(s.selectedId, 5); tick(s, { y: 1 }); assert.equal(s.selectedId, 9);
  for (const [input, selected] of [[{ x: .5, y: .5 }, 6], [{ x: -.5, y: -.5 }, 4],
    [{ x: .5, y: .6 }, 9], [{ x: .249, y: -.249 }, 5], [{ x: .25 }, 6]]) {
    const current = Model.create(); tick(current, input); assert.equal(current.selectedId, selected);
  }
});

test('navigation occurs before A so spray origin and direct count use the newly selected cell', () => {
  const s = fixture(); tick(s, { x: 1, a: true });
  assert.equal(s.selectedId, 6); assert.equal(s.lastWater.cellId, 6); assert.equal(s.cells[6].directWaterCount, 1);
  assert.equal(s.cells[5].directWaterCount, 0); assert.deepEqual(s.lastWater.affectedIds, [2, 5, 6, 7, 10]);
  assert.deepEqual(s.events.map(e => e.type), ['select', 'water']); audit(s);
});

test('B suppresses navigation and discards simultaneous A only on its fixed tick, without replaying the discarded edge', () => {
  const s = fixture(); const switches = s.nozzleSwitches;
  tick(s, { b: true, a: true, x: 1 }); assert.equal(s.nozzle, 'diagonal'); assert.equal(s.selectedId, 5); assert.equal(s.waterUsed, 0);
  assert.deepEqual(s.events.map(e => e.type), ['nozzle']);
  tick(s, { b: true, a: true, x: 1 }); assert.equal(s.selectedId, 6); assert.equal(s.waterUsed, 0); assert.equal(s.nozzleSwitches, switches + 1);
  tick(s); tick(s, { a: true }); assert.equal(s.lastWater.cellId, 6); assert.equal(s.lastWater.nozzle, 'diagonal'); assert.equal(s.waterUsed, 1);
});

test('aggregated dt obeys the same per-tick B priority and subsequent selection as individual fixed steps', () => {
  const combined = Model.create(), split = clone(combined);
  Model.step(combined, .25, { b: true, aPressed: true, x: 1 });
  tick(split, { b: true, aPressed: true, x: 1 }); ticks(split, 14, { b: true, x: 1 });
  assert.equal(combined.nozzle, 'diagonal'); assert.equal(combined.nozzleSwitches, 1); assert.equal(combined.selectedId, 6); assert.equal(combined.waterUsed, 0);
  assert.deepEqual(combined.events.map(e => e.type), ['nozzle', 'select']);
  const { events: ea, _accumulator: ra, ...a } = combined, { events: eb, _accumulator: rb, ...b } = split;
  assert.ok(Math.abs(ra - rb) < 1e-12); assert.deepEqual(a, b);
  const watering = fixture(); Model.step(watering, .25, { a: true, x: 1 });
  assert.equal(watering.waterUsed, 1); assert.equal(watering.lastWater.cellId, 6);
});

test('sub-tick and zero-dt edges cache exactly one action while zero-dt directional samples never move the cursor', () => {
  const s = fixture(); const at = s.tick; Model.step(s, DT / 2, { aPressed: true });
  assert.equal(s.tick, at); assert.equal(s.waterUsed, 0); Model.step(s, DT / 2, {}); assert.equal(s.waterUsed, 1);
  const switches = s.nozzleSwitches;
  Model.step(s, 0, { aPressed: true, x: 1 }); Model.step(s, 0, { bPressed: true });
  assert.equal(s.selectedId, 5); assert.equal(s.waterUsed, 1); assert.equal(s.nozzleSwitches, switches);
  tick(s); assert.equal(s.nozzleSwitches, switches + 1); assert.equal(s.waterUsed, 1); assert.equal(s.selectedId, 5);
  tick(s); assert.equal(s.waterUsed, 1, 'coalesced A cannot appear on a later tick');
});

test('cancellation samples clear button edges and repeats without altering garden, nozzle or cursor', () => {
  const initialized = fixture(); tick(initialized, { cancelEpoch: 7, a: true }); assert.equal(initialized.waterUsed, 1);
  const s = fixture(); tick(s, { cancelEpoch: 2 }); pressA(s); pressB(s); focus(s, 0);
  const before = garden(s), at = s.tick;
  tick(s, { cancelEpoch: 3, a: true, b: true, x: 1 });
  ticks(s, 8, { cancelled: true, a: true, b: true, aPressed: true, bPressed: true, y: 1 });
  assert.deepEqual(garden(s), before); assert.equal(s.tick, at + 9);
  tick(s, { a: true, b: true }); assert.deepEqual(garden(s), before, 'continued held buttons do not become fresh edges');
  tick(s); tick(s, { a: true }); assert.equal(s.waterUsed, before.waterUsed + 1); assert.equal(s.lastWater.nozzle, 'diagonal');
  const pending = fixture(); Model.step(pending, DT / 2, { aPressed: true, bPressed: true });
  const old = garden(pending); Model.step(pending, DT / 2, { cancelled: true }); tick(pending); assert.deepEqual(garden(pending), old);
  const repeating = Model.create(); tick(repeating, { x: 1 }); tick(repeating, { cancelled: true, x: 1 });
  assert.equal(repeating.selectedId, 6); tick(repeating, { x: 1 }); assert.equal(repeating.selectedId, 7);
});

test('lastWater retains its fixed origin, nozzle and actual changes after selection/nozzle changes or another spray', () => {
  const s = fixture(); tick(s, { a: true }); const firstReference = s.lastWater, first = clone(s.lastWater);
  tick(s, { x: 1 }); pressB(s);
  assert.equal(s.selectedId, 6); assert.equal(s.nozzle, 'diagonal'); assert.deepEqual(s.previewIds, [1, 3, 6, 9, 11]);
  assert.deepEqual(s.lastWater, first); assert.equal(s.lastWater.cellId, 5); assert.equal(s.lastWater.nozzle, 'cross');
  assert.notStrictEqual(s.lastWater.affectedIds, s.previewIds);
  tick(s, { a: true }); assert.equal(s.lastWater.id, 2); assert.equal(s.lastWater.cellId, 6); assert.equal(s.lastWater.nozzle, 'diagonal');
  assert.deepEqual(firstReference, first, 'later actions do not mutate the previous emission record');
  assert.ok(s.lastWater.changes.length <= 5); assert.equal(s.lastWater.expiresAt, s.lastWater.at + .6); audit(s);
});

test('spray feedback expires after .6 active seconds and events reset rather than accumulating a hidden spray history', () => {
  const s = fixture(); tick(s, { a: true }); const at = s.lastWater.at;
  assert.equal(s.events.length, 1); ticks(s, 35); assert.ok(s.lastWater); assert.equal(s.events.length, 0);
  tick(s); assert.equal(s.lastWater, null); assert.ok(s.elapsed >= at + .6);
  assert.equal(s.waterUsed, 1); assert.equal(s.totalAffectedToggles, 5); assert.equal(s.cells[5].directWaterCount, 1);
});

test('derived score cannot be farmed by restoring a pattern or switching nozzles, and spent water never returns', () => {
  const s = fixture({ marked: [5] }); const initialScore = s.score, initialPattern = pattern(s), water = s.waterRemaining;
  for (let pair = 0; pair < 3; pair++) {
    pressA(s); assert.equal(s.score, s.matchedCells * 20 + s.satisfiedMarked * 40);
    pressA(s); assert.deepEqual(pattern(s), initialPattern); assert.equal(s.score, initialScore);
    const used = s.waterUsed; pressB(s); pressB(s); assert.equal(s.waterUsed, used); assert.equal(s.score, initialScore);
  }
  assert.equal(s.waterUsed, 6); assert.equal(s.waterRemaining, water - 6); assert.equal(s.cells[5].directWaterCount, 6); audit(s);
});

test('deadline precedes a winning A, nozzle B and navigation on the expiry tick', () => {
  for (const input of [{ a: true }, { b: true }, { x: 1 }]) {
    const s = winningBoundary(); const before = garden(s); s.timeLimit = (s.tick + 1) / 60;
    tick(s, input); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'timeout'); assert.equal(s.remaining, 0);
    assert.deepEqual(garden(s), before); assert.equal(s.lastWater, null); assert.deepEqual(s.events.map(e => e.type), ['lost']);
  }
  const beforeDeadline = winningBoundary(); beforeDeadline.timeLimit = (beforeDeadline.tick + 2) / 60;
  tick(beforeDeadline, { a: true }); assert.equal(beforeDeadline.phase, 'won');
});

test('terminal calls freeze every field including highlights and events; fresh retries restore independent resources', () => {
  const won = winningBoundary(); tick(won, { a: true }); const lost = fixture({ waterBudget: 1 }); tick(lost, { a: true });
  for (const s of [won, lost]) {
    const frozen = clone(s);
    for (const dt of [0, DT, .25, 100, NaN]) Model.step(s, dt, { aPressed: true, bPressed: true, x: 1, cancelEpoch: 100 });
    assert.deepEqual(s, frozen); assert.ok(s.lastWater);
  }
  const active = Model.create(8, 2); pressA(active); pressB(active); focus(active, 15);
  const retry = Model.create(8, 2), untouched = Model.create(8, 2); assert.deepEqual(retry, untouched);
  for (const field of ['cells', 'targetPattern', 'markedIds', 'nozzles', 'previewIds']) assert.notStrictEqual(retry[field], active[field]);
  assert.notStrictEqual(retry.nozzles[0].offsets, active.nozzles[0].offsets); assert.notStrictEqual(retry.cells[0], active.cells[0]);
  assert.equal(retry.waterUsed, 0); assert.equal(retry.nozzleSwitches, 0); assert.equal(retry.selectedId, 5); assert.equal(retry.lastWater, null);
});

test('JSON continuations remain deterministic and numeric input, counters and transient resources are bounded', () => {
  const s = fixture(); pressA(s); pressB(s); tick(s, { x: 1 }); const restored = clone(s);
  ticks(s, 22, { x: 1 }); ticks(restored, 22, { x: 1 }); pressA(s); pressA(restored); assert.deepEqual(s, restored); audit(s);
  const invalid = Model.create();
  for (const dt of [NaN, Infinity, -Infinity, -1, '1', undefined]) Model.step(invalid, dt, {});
  assert.equal(invalid.tick, 0); tick(invalid, { x: NaN, y: Infinity }); assert.equal(invalid.selectedId, 5);
  tick(invalid, { x: 1e30 }); assert.equal(invalid.selectedId, 6);
  const at = invalid.tick; Model.step(invalid, 100, {}); assert.equal(invalid.tick, at + 15);
  assert.equal(Model.create(NaN, NaN).seed, 1); assert.equal(Model.create(1, -9).level, 1);
  assert.equal(Model.create(1, 99).level, 3); assert.equal(Model.create(1, 1.9).level, 2);
  assert.ok(s.events.length <= 32); assert.ok(s.lastWater.affectedIds.length <= 5); assert.ok(s.waterUsed <= s.waterBudget);
  assert.ok(counts(s).every(count => count <= s.waterUsed));
  function finiteTree(value) { if (typeof value === 'number') assert.ok(Number.isFinite(value)); else if (value && typeof value === 'object') Object.values(value).forEach(finiteTree); }
  finiteTree(s); finiteTree(invalid);
});

// Fresh authored gardens below receive only ordinary input. The pilot sees
// public snapshots with no private fields. The defined successful scenario is
// 60 Hz stepping with observations every five ticks, not a promise that every
// input cadence or arbitrary watering choice must succeed.
function publicSnapshot(s) {
  return { phase: s.phase, paused: false,
    model: clone(Object.fromEntries(Object.entries(s).filter(([key]) => !key.startsWith('_')))) };
}
for (let difficulty = 0; difficulty < 3; difficulty++) {
  test(`authored garden ${difficulty + 1}: two real identical sprays, public solution, both nozzles and final-drop win`, async () => {
    const automation = await import('./automation.mjs');
    const pilot = automation.createPilot(), s = Model.create(1, difficulty);
    const initial = publicSnapshot(s), trace = [], usedNozzles = new Set();
    let held = [], previousA = false, previousB = false, first = null, second = null;
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
      previousA = a; previousB = b; audit(s);
      for (const event of s.events) if (event.type === 'water') {
        usedNozzles.add(event.nozzle);
        if (event.id === 1) first = publicSnapshot(s);
        if (event.id === 2) second = publicSnapshot(s);
      }
    }
    const after = publicSnapshot(s); trace.push({ state: after });
    automation.assertProgress({ after, trace, initial }, assert);
    assert.ok(s.elapsed >= 30 && s.elapsed < 90); assert.equal(s.waterUsed, s.waterBudget);
    assert.equal(s.waterRemaining, 0, 'the actual last drop wins before exhausted-water loss');
    assert.deepEqual([...usedNozzles].sort(), ['cross', 'diagonal']); assert.ok(s.nozzleSwitches >= 1);
    assert.ok(first && second); assert.equal(first.model.phase, 'playing'); assert.equal(second.model.phase, 'playing');
    const id = first.model.lastWater.cellId;
    assert.equal(initial.model.cells[id].requiresEven, true);
    assert.equal(first.model.cells[id].directWaterCount, 1); assert.equal(first.model.cells[id].conditionMet, false);
    assert.equal(second.model.lastWater.cellId, id); assert.equal(second.model.lastWater.nozzle, first.model.lastWater.nozzle);
    assert.deepEqual(second.model.lastWater.affectedIds, first.model.lastWater.affectedIds);
    assert.equal(second.model.waterUsed, 2); assert.equal(second.model.waterRemaining, s.waterBudget - 2);
    assert.deepEqual(second.model.cells.map(c => c.open), initial.model.cells.map(c => c.open));
    assert.deepEqual(second.model.cells.map(c => c.directParity), initial.model.cells.map(c => c.directParity));
    for (const c of second.model.cells) assert.equal(c.directWaterCount, c.id === id ? 2 : 0);
    assert.equal(second.model.score, initial.model.score, 'restoring the pattern does not farm score or refund water');
    for (const count of [1, 2]) {
      const inspection = trace.filter(item => item.state.model.waterUsed === count);
      assert.ok(inspection.at(-1).state.model.elapsed - inspection[0].state.model.elapsed >= 4.2);
    }
    automation.assertRetry({ after: publicSnapshot(Model.create(1, difficulty)), initial }, assert);
    const frozen = clone(s); Model.step(s, DT, { a: true, b: true, x: 1 }); assert.deepEqual(s, frozen);
  });

  test(`authored garden ${difficulty + 1}: ordinary repeated same-center watering exhausts real water`, async () => {
    const automation = await import('./automation.mjs');
    const s = Model.create(1, difficulty), initial = publicSnapshot(s), selected = s.selectedId;
    const affectedIds = s.previewIds.slice(), startPattern = pattern(s);
    for (let drop = 1; drop <= s.waterBudget; drop++) {
      assert.equal(s.phase, 'playing'); pressA(s);
      assert.equal(s.waterUsed, drop); assert.equal(s.cells[selected].directWaterCount, drop);
      assert.equal(s.totalAffectedToggles, drop * affectedIds.length);
      for (const c of s.cells) {
        if (c.id !== selected) assert.equal(c.directWaterCount, 0);
        assert.equal(c.open, drop % 2 && affectedIds.includes(c.id) ? !startPattern[c.id] : startPattern[c.id]);
      }
      automation.assertPublicGarden(publicSnapshot(s).model, assert);
    }
    assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'water'); assert.equal(s.waterRemaining, 0);
    assert.equal(s.goalMatched, false); assert.deepEqual(pattern(s), startPattern);
    assert.equal(s.score, initial.model.score); assert.equal(s.nozzleSwitches, 0);
    const frozen = clone(s); pressB(s); pressA(s); assert.deepEqual(s, frozen);
    automation.assertRetry({ after: publicSnapshot(Model.create(1, difficulty)), initial }, assert);
  });
}
