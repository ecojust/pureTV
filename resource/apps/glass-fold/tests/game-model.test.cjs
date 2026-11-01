'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const modelPath = path.join(__dirname, '../src/main/assets/game-model.js');
const Model = require(modelPath);
const DT = 1 / 60;
const clone = value => JSON.parse(JSON.stringify(value));
const tick = (s, input = {}) => Model.step(s, DT, input);
function ticks(s, count, input = {}) { for (let i = 0; i < count; i++) tick(s, input); return s; }
const cell = (s, col, row) => s.cells.find(c => c.col === col && c.row === row);
const crease = (s, id) => s.candidates.find(c => c.id === id);
function choose(s, id) {
  const target = crease(s, id);
  assert.ok(target, id);
  while (s.selectedIndex !== s.candidates.indexOf(target)) {
    const current = s.candidates[s.selectedIndex];
    const input = current.selectorCol !== target.selectorCol
      ? { x: Math.sign(target.selectorCol - current.selectorCol) }
      : { y: Math.sign(target.selectorRow - current.selectorRow) };
    tick(s, input); tick(s);
  }
}
function beginFold(s, id) { choose(s, id); tick(s, { a: true, aPressed: true }); return s; }
function settle(s, input = {}) {
  let count = 0;
  while (s.phase === 'playing' && s.mode === 'folding' && count++ < 40) tick(s, input);
  assert.ok(count <= 37, 'a fold settles after 36 additional active ticks');
  return s;
}
function doFold(s, id) { beginFold(s, id); return settle(s); }
const geometry = s => clone({ pieces: s.pieces, cells: s.cells, foldsUsed: s.foldsUsed, selectedIndex: s.selectedIndex });
function signedTwiceArea(vertices) {
  return vertices.reduce((sum, p, i) => { const q = vertices[(i + 1) % vertices.length]; return sum + p.x * q.y - q.x * p.y; }, 0);
}
function auditMaterial(s, expectedIds) {
  const layered = s.cells.flatMap(c => c.layers).sort((a, b) => a - b);
  assert.deepEqual(layered, expectedIds, 'every material piece occurs in exactly one stack');
  assert.equal(new Set(layered).size, expectedIds.length);
  assert.equal(s.materialArea, expectedIds.length);
  assert.equal(s.cells.reduce((sum, c) => sum + c.depth, 0), expectedIds.length);
  for (const p of s.pieces) {
    assert.equal(signedTwiceArea(p.vertices), 2 * p.face, 'reflection reverses winding, never material area');
    assert.equal(p.face, p.movedFolds % 2 ? -1 : 1);
    for (const v of p.vertices) {
      assert.ok(Number.isInteger(v.x) && Number.isInteger(v.y));
      assert.ok(v.x >= 0 && v.x <= 4 && v.y >= 0 && v.y <= 4);
    }
    const c = s.cells.find(c => c.layers.includes(p.id));
    assert.deepEqual([...new Set(p.vertices.map(v => v.x))].sort((a, b) => a - b), [c.col, c.col + 1]);
    assert.deepEqual([...new Set(p.vertices.map(v => v.y))].sort((a, b) => a - b), [c.row, c.row + 1]);
  }
}

// Explicit public-board boundary fixtures. These are not authored level solutions:
// each listed pigment becomes a real square with an ID and actual corner vertices.
function boardFixture(stacks, options = {}) {
  const s = Model.create(91, 0);
  s.pieces = [];
  s.cells.forEach(c => { c.layers = []; });
  let id = options.firstId || 101;
  for (const spec of stacks) {
    for (const pigment of spec.pigments) {
      s.pieces.push({ id, pigment, face: 1, movedFolds: 0, vertices: [
        { x: spec.col, y: spec.row }, { x: spec.col + 1, y: spec.row },
        { x: spec.col + 1, y: spec.row + 1 }, { x: spec.col, y: spec.row + 1 }
      ] });
      cell(s, spec.col, spec.row).layers.push(id++);
    }
  }
  s.foldLimit = options.foldLimit === undefined ? 8 : options.foldLimit;
  s.target = { cells: options.target || [{ col: 0, row: 0, color: [0, 0, 0] }], occupiedCount: (options.target || [0]).length };
  tick(s);
  return s;
}
function twoRedFixture(options = {}) {
  return boardFixture([{ col: 1, row: 0, pigments: ['R'] }, { col: 2, row: 0, pigments: ['R'] }], {
    foldLimit: 1, target: [{ col: 2, row: 0, color: [231, 120, 130] }], ...options
  });
}
function wrongReviewFixture() { return twoRedFixture({ target: [{ col: 2, row: 0, color: [231, 120, 131] }] }); }

test('UMD exposes only create/step/tick rate and starts three independent bounded work frames', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['TICK_HZ', 'create', 'step']);
  assert.equal(Model.TICK_HZ, 60);
  const sandbox = {}; vm.runInNewContext(fs.readFileSync(modelPath, 'utf8'), sandbox);
  assert.equal(typeof sandbox.PureModel.create, 'function');
  assert.deepEqual(clone(sandbox.PureModel.create(7, 1)), Model.create(7, 1));
  for (let d = 0; d < 3; d++) {
    const s = Model.create(7, d);
    assert.equal(s.level, d + 1); assert.equal(s.phase, 'playing'); assert.equal(s.mode, 'editing');
    assert.equal(s.timeLimit, 90); assert.equal(s.remaining, 90); assert.equal(s.tick, 0);
    assert.deepEqual(s.grid, { cols: 4, rows: 4 }); assert.equal(s.cells.length, 16);
    assert.equal(s.pieces.length, 16); assert.equal(s.candidates.length, 12);
    assert.equal(s.selectedId, 'x-2-low'); assert.equal(s.layerAlpha, 0.5);
    auditMaterial(s, Array.from({ length: 16 }, (_, i) => i + 1));
  }
});

test('initial candidate validity distinguishes in-frame folds from reflected out-of-frame folds', () => {
  const s = Model.create();
  const valid = ['x-1-low', 'x-2-low', 'x-2-high', 'x-3-high', 'y-1-low', 'y-2-low', 'y-2-high', 'y-3-high'];
  assert.deepEqual(s.candidates.filter(c => c.valid).map(c => c.id).sort(), valid.sort());
  for (const c of s.candidates.filter(c => !c.valid)) assert.equal(c.reason, 'out-of-bounds');
  choose(s, 'x-1-high'); const before = geometry(s);
  tick(s, { a: true });
  assert.deepEqual(geometry(s), before); assert.equal(s.foldsUsed, 0);
  assert.equal(s.foldCount, 0); assert.equal(s.invalidFolds, 1); assert.equal(s.mismatches, 0);
  assert.equal(s.lastAction.reason, 'out-of-bounds'); assert.equal(s.historyDepth, 0);
});

test('both sides must contain actual material: empty moving and empty stationary folds are free', () => {
  for (const [col, reason] of [[3, 'empty-moving'], [0, 'empty-stationary']]) {
    const s = boardFixture([{ col, row: 1, pigments: ['B', 'Y'] }]);
    assert.equal(crease(s, 'x-2-low').reason, reason);
    const before = geometry(s); tick(s, { a: true, aPressed: true });
    assert.deepEqual(geometry(s), before); assert.equal(s.lastAction.reason, reason);
    assert.equal(s.foldCount, 0); assert.equal(s.historyDepth, 0); assert.equal(s.mismatches, 0);
  }
});

test('bounds check only occupied moving cells and candidate validity refreshes after each fold', () => {
  const s = boardFixture([{ col: 0, row: 0, pigments: ['R'] }, { col: 3, row: 0, pigments: ['B'] }]);
  assert.equal(crease(s, 'x-1-low').valid, true);
  assert.equal(crease(s, 'x-1-high').reason, 'out-of-bounds');
  doFold(s, 'x-1-low');
  assert.deepEqual(s.cells.filter(c => c.depth).map(c => c.col), [1, 3]);
  assert.equal(crease(s, 'x-1-low').reason, 'empty-moving');
  assert.equal(crease(s, 'x-2-high').valid, true);
  doFold(s, 'x-2-high');
  assert.deepEqual(s.cells.filter(c => c.depth).map(c => c.col), [0, 1]);
  assert.equal(crease(s, 'x-2-low').reason, 'empty-stationary');
});

test('vertical low/high folds reflect real vertices, reverse faces, and preserve the other coordinate', () => {
  for (const side of ['low', 'high']) {
    const s = Model.create(); const old = clone(s.pieces);
    beginFold(s, `x-2-${side}`);
    for (const p of s.pieces) {
      const before = old.find(q => q.id === p.id); const col = (p.id - 1) % 4;
      const moved = side === 'low' ? col < 2 : col >= 2;
      assert.deepEqual(p.vertices, before.vertices.map(v => ({ x: moved ? 4 - v.x : v.x, y: v.y })));
      assert.equal(p.face, moved ? -1 : 1); assert.equal(p.movedFolds, moved ? 1 : 0);
      const destination = moved ? 3 - col : col;
      assert.ok(cell(s, destination, Math.floor((p.id - 1) / 4)).layers.includes(p.id));
    }
    assert.equal(s.occupiedArea, 8); auditMaterial(s, old.map(p => p.id));
  }
});

test('horizontal low/high folds use the same exact reflection for cell rows and all four corners', () => {
  for (const side of ['low', 'high']) {
    const s = Model.create(); const old = clone(s.pieces);
    beginFold(s, `y-2-${side}`);
    for (const p of s.pieces) {
      const before = old.find(q => q.id === p.id); const row = Math.floor((p.id - 1) / 4);
      const moved = side === 'low' ? row < 2 : row >= 2;
      assert.deepEqual(p.vertices, before.vertices.map(v => ({ x: v.x, y: moved ? 4 - v.y : v.y })));
      assert.equal(p.face, moved ? -1 : 1); assert.equal(p.movedFolds, moved ? 1 : 0);
      assert.ok(cell(s, (p.id - 1) % 4, moved ? 3 - row : row).layers.includes(p.id));
    }
    auditMaterial(s, old.map(p => p.id));
  }
});

test('a moving multilayer stack reverses as one object above the unmodified stationary stack', () => {
  for (const [id, a, b] of [
    ['x-2-low', [1, 0], [2, 0]], ['x-2-high', [2, 0], [1, 0]],
    ['y-2-low', [0, 1], [0, 2]], ['y-2-high', [0, 2], [0, 1]]
  ]) {
    const s = boardFixture([{ col: a[0], row: a[1], pigments: ['R', 'Y', 'B'] }, { col: b[0], row: b[1], pigments: ['G', 'R'] }]);
    const moving = cell(s, ...a).layers.slice(), stationary = cell(s, ...b).layers.slice();
    beginFold(s, id);
    assert.deepEqual(cell(s, ...b).layers, [...stationary, moving[2], moving[1], moving[0]]);
    assert.deepEqual(cell(s, ...a).layers, []); assert.equal(cell(s, ...b).depth, 5);
    for (const p of s.pieces) assert.equal(p.movedFolds, moving.includes(p.id) ? 1 : 0);
  }
});

test('three pigments composite in order with one final rounding, not rounded intermediate layers', () => {
  const s = boardFixture([{ col: 0, row: 0, pigments: ['R', 'Y', 'B'] }]);
  // R,Y,B over [246,244,234]: [1150,1314,1299]/8 = [143.75,164.25,162.375].
  assert.deepEqual(cell(s, 0, 0).color, [144, 164, 162]);
  // B,Y,R: [1681,1077,936]/8. The substrate contributes once, not per sheet.
  assert.deepEqual(cell(s, 0, 0).reverseColor, [210, 135, 117]);
  assert.notDeepEqual(cell(s, 0, 0).color, [144, 165, 163], 'per-layer rounding is observably wrong');
  assert.equal(cell(s, 1, 0).color, null); assert.equal(cell(s, 1, 0).reverseColor, null);
  assert.deepEqual(s.substrateColor, [246, 244, 234]);
});

test('material IDs, pigment, total layers, area and winding survive multiple folds and undo', () => {
  const s = Model.create(); const ids = s.pieces.map(p => p.id); const pigments = s.pieces.map(p => p.pigment);
  for (const id of ['x-2-low', 'y-2-low', 'x-3-low']) {
    doFold(s, id); auditMaterial(s, ids); assert.deepEqual(s.pieces.map(p => p.pigment), pigments);
  }
  assert.equal(s.occupiedArea, 2); assert.equal(s.mode, 'review');
  tick(s, { b: true }); auditMaterial(s, ids); assert.equal(s.occupiedArea, 4);
  assert.deepEqual(s.pieces.map(p => p.pigment), pigments);
});

test('piece/palette iteration order does not change geometry, layers, colors, metrics or candidates', () => {
  const a = Model.create(123, 2), b = clone(a);
  b.pieces.reverse(); b.palette.reverse();
  for (const id of ['x-2-high', 'y-2-low', 'x-1-high']) { doFold(a, id); doFold(b, id); }
  assert.deepEqual(b.cells, a.cells); assert.deepEqual(b.candidates, a.candidates);
  assert.deepEqual(b.pieces.slice().sort((p, q) => p.id - q.id), a.pieces);
  for (const key of ['materialArea', 'occupiedArea', 'matchedCells', 'outlineMatches', 'targetMatched', 'score', 'foldsUsed']) assert.equal(b[key], a[key]);
});

test('exact visible RGB and footprint accept different material IDs without hidden layer requirements', () => {
  for (const firstId of [101, 9001]) {
    const s = twoRedFixture({ firstId });
    assert.deepEqual(s.target.cells, [{ col: 2, row: 0, color: [231, 120, 130] }]);
    doFold(s, 'x-2-low');
    assert.equal(s.phase, 'won'); assert.equal(s.targetMatched, true); assert.equal(s.matchedCells, 1);
    assert.deepEqual(cell(s, 2, 0).layers, [firstId + 1, firstId]); assert.equal(s.reviewCount, 1);
  }
  // Same visible RGB can arise from a different hidden layer count: white glass
  // over a white substrate stays white at both two and four layers.
  for (const count of [1, 2]) {
    const s = boardFixture([{ col: 1, row: 0, pigments: Array(count).fill('R') }, { col: 2, row: 0, pigments: Array(count).fill('R') }],
      { foldLimit: 1, target: [{ col: 2, row: 0, color: [255, 255, 255] }] });
    s.substrateColor = [255, 255, 255]; s.palette.find(p => p.id === 'R').rgb = [255, 255, 255];
    doFold(s, 'x-2-low'); assert.equal(s.phase, 'won'); assert.equal(cell(s, 2, 0).depth, count * 2);
  }
});

test('matching outline with wrong visible color and matching colors with wrong footprint both fail review', () => {
  const wrongColor = wrongReviewFixture(); doFold(wrongColor, 'x-2-low');
  assert.equal(wrongColor.outlineMatches, true); assert.equal(wrongColor.matchedCells, 0);
  assert.equal(wrongColor.mode, 'review'); assert.equal(wrongColor.mismatches, 1);
  const extra = boardFixture([{ col: 1, row: 0, pigments: ['R'] }, { col: 2, row: 0, pigments: ['R'] }, { col: 3, row: 3, pigments: ['G'] }],
    { foldLimit: 1, target: [{ col: 2, row: 0, color: [231, 120, 130] }] });
  doFold(extra, 'x-2-low'); assert.equal(extra.matchedCells, 1); assert.equal(extra.outlineMatches, false);
  assert.equal(extra.targetMatched, false); assert.equal(extra.mode, 'review');
  const wrongPlace = twoRedFixture({ target: [{ col: 3, row: 0, color: [231, 120, 130] }] });
  doFold(wrongPlace, 'x-2-low'); assert.equal(wrongPlace.outlineMatches, false); assert.equal(wrongPlace.phase, 'playing');
});

test('native fold budgets are 3/3/4 and review runs only after the last permitted animation', () => {
  const sequence = ['x-2-low', 'y-2-low', 'x-3-low', 'y-3-low'];
  for (let d = 0; d < 3; d++) {
    const s = Model.create(1, d); const limit = [3, 3, 4][d]; assert.equal(s.foldLimit, limit);
    for (let i = 0; i < limit; i++) {
      beginFold(s, sequence[i]);
      assert.equal(s.foldsUsed, i + 1); assert.equal(s.foldsRemaining, limit - i - 1);
      assert.equal(s.reviewPending, i + 1 === limit); assert.equal(s.reviewCount, 0);
      settle(s);
      assert.equal(s.reviewCount, i + 1 === limit ? 1 : 0);
    }
    assert.equal(s.mode, 'review'); assert.equal(s.foldCount, limit);
  }
});

test('fold geometry updates atomically and .6 second animation has independent snapshots and bounded progress', () => {
  const s = Model.create(); const before = geometry(s);
  beginFold(s, 'x-2-low'); const end = geometry(s); const animation = s.foldAnimation;
  assert.equal(s.mode, 'folding'); assert.equal(animation.duration, 0.6); assert.equal(animation.progress, 0);
  assert.deepEqual(animation.beforePieces, before.pieces); assert.deepEqual(animation.beforeCells, before.cells);
  assert.notStrictEqual(animation.beforePieces, s.pieces); assert.notStrictEqual(animation.beforePieces[0].vertices, s.pieces[0].vertices);
  assert.notStrictEqual(animation.beforeCells[0].layers, s.cells[0].layers);
  assert.notStrictEqual(animation.beforePieces, s._history[0].pieces);
  ticks(s, 18); assert.equal(s.mode, 'folding'); assert.ok(Math.abs(s.foldAnimation.progress - 0.5) < 1e-12);
  assert.deepEqual(geometry(s), end, 'logical vertices never become compressed intermediate drawing coordinates');
  ticks(s, 17); assert.equal(s.mode, 'folding'); assert.ok(s.foldAnimation.progress < 1);
  tick(s); assert.equal(s.mode, 'editing'); assert.equal(s.foldAnimation, null);
  assert.deepEqual(geometry(s), end); assert.deepEqual(animation.beforePieces, before.pieces);
  assert.equal(s.elapsed - animation.startedAt, 0.6);
});

test('held A through animation completion and new selections cannot auto-fold; a real new edge can', () => {
  const s = Model.create(); beginFold(s, 'x-2-low'); settle(s, { a: true });
  ticks(s, 40, { a: true }); assert.equal(s.foldCount, 1); assert.equal(s.invalidFolds, 0);
  tick(s, { y: 1, a: true }); tick(s, { a: true }); tick(s, { y: 1, a: true });
  assert.equal(s.selectedId, 'y-2-low'); assert.equal(s.foldCount, 1);
  tick(s); tick(s, { a: true }); assert.equal(s.foldCount, 2); assert.equal(s.mode, 'folding');
});

test('A, B and navigation inside animation are ignored, including its final settling tick, without queuing', () => {
  const s = Model.create(); beginFold(s, 'x-2-low');
  ticks(s, 35, { x: 1, aPressed: true, bPressed: true });
  assert.equal(s.mode, 'folding'); assert.equal(s.selectedId, 'x-2-low');
  tick(s, { y: 1, aPressed: true, bPressed: true }); assert.equal(s.mode, 'editing');
  ticks(s, 4); assert.equal(s.foldCount, 1); assert.equal(s.undoCount, 0); assert.equal(s.invalidFolds, 0);
  assert.equal(s.selectedId, 'x-2-low'); assert.equal(s.historyDepth, 1);
});

test('B restores all geometry, stack order, per-piece state, fold budget and pre-fold selection', () => {
  const s = Model.create(); doFold(s, 'x-2-low'); choose(s, 'y-2-low');
  const before = geometry(s); const elapsed = s.elapsed;
  tick(s, { a: true }); settle(s); choose(s, 'y-3-high');
  tick(s, { b: true });
  assert.deepEqual(geometry(s), before); assert.equal(s.selectedId, 'y-2-low');
  assert.equal(s.foldsRemaining, 2); assert.equal(s.foldCount, 2); assert.equal(s.undoCount, 1);
  assert.equal(s.historyDepth, 1); assert.equal(s.canUndo, true); assert.equal(s.foldAnimation, null);
  assert.ok(s.elapsed > elapsed); assert.equal(s.mode, 'editing');
  ticks(s, 50, { b: true }); assert.equal(s.undoCount, 1, 'held B cannot repeatedly undo');
  tick(s); tick(s, { b: true }); assert.equal(s.historyDepth, 0); assert.equal(s.foldsUsed, 0);
});

test('undo clears review lock but never refunds elapsed time, mismatch/review ledger or lifetime folds', () => {
  const s = wrongReviewFixture(); const original = geometry(s);
  doFold(s, 'x-2-low'); const review = clone(s.lastReview); const elapsed = s.elapsed;
  tick(s, { b: true });
  assert.deepEqual(geometry(s), original); assert.equal(s.mode, 'editing'); assert.equal(s.mismatches, 1);
  assert.equal(s.reviewCount, 1); assert.deepEqual(s.lastReview, review); assert.equal(s.foldCount, 1);
  assert.equal(s.undoCount, 1); assert.ok(s.elapsed > elapsed); assert.equal(s.score, s.matchedCells * 100);
});

test('wrong review happens once, locked A cannot resubmit, and passive time never charges extra failures', () => {
  const s = wrongReviewFixture(); doFold(s, 'x-2-low'); const review = clone(s.lastReview);
  for (let i = 0; i < 4; i++) { tick(s, { a: true, aPressed: true }); tick(s); }
  ticks(s, 90);
  assert.equal(s.phase, 'playing'); assert.equal(s.mode, 'review'); assert.equal(s.mismatches, 1);
  assert.equal(s.reviewCount, 1); assert.equal(s.foldCount, 1); assert.equal(s.invalidFolds, 4);
  assert.equal(s.lastAction.reason, 'review-locked'); assert.deepEqual(s.lastReview, review);
});

test('undo and redo cause another genuine review; the third mismatch loses and freezes every field', () => {
  const s = wrongReviewFixture();
  for (let n = 1; n <= 3; n++) {
    doFold(s, 'x-2-low'); assert.equal(s.mismatches, n); assert.equal(s.reviewCount, n);
    if (n < 3) { tick(s, { b: true }); tick(s); assert.equal(s.mode, 'editing'); }
  }
  assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'mismatches'); assert.equal(s.canUndo, false);
  assert.equal(s.foldCount, 3); assert.equal(s.undoCount, 2);
  const frozen = clone(s); Model.step(s, 100, { aPressed: true, bPressed: true, x: 1, cancelEpoch: 100 });
  assert.deepEqual(s, frozen); assert.equal(s.score, s.matchedCells * 100);
});

test('B has priority over A, and navigation happens before the chosen action', () => {
  const empty = Model.create(); tick(empty, { x: 1, a: true, b: true });
  assert.equal(empty.selectedId, 'x-3-low'); assert.equal(empty.lastAction.type, 'empty-undo');
  assert.equal(empty.foldCount, 0); assert.equal(empty.invalidFolds, 0);
  const a = Model.create(); tick(a, { x: -1, a: true });
  assert.equal(a.lastAction.candidateId, 'x-1-low'); assert.equal(a.foldCount, 1);
  assert.deepEqual(a.events.map(e => e.type), ['select', 'fold']);
  settle(a); tick(a, { y: 1, a: true, b: true });
  assert.deepEqual(a.events.map(e => e.type), ['select', 'undo']);
  assert.equal(a.selectedId, 'x-1-low'); assert.equal(a.foldCount, 1); assert.equal(a.undoCount, 1);
  assert.equal(a.foldsUsed, 0);
});

test('selection deadzone, diagonal tie, 20/10 held repeat, clamp and direction release are deterministic', () => {
  const s = Model.create(); tick(s, { x: 0.249, y: -0.249 }); assert.equal(s.selectedIndex, 1);
  tick(s, { x: -0.5, y: 0.5 }); assert.equal(s.selectedIndex, 0, 'horizontal wins exact magnitude tie');
  tick(s); tick(s, { y: 0.25 }); assert.equal(s.selectedIndex, 3);
  ticks(s, 19, { y: 1 }); assert.equal(s.selectedIndex, 3);
  tick(s, { y: 1 }); assert.equal(s.selectedIndex, 6);
  ticks(s, 9, { y: 1 }); assert.equal(s.selectedIndex, 6);
  tick(s, { y: 1 }); assert.equal(s.selectedIndex, 9);
  ticks(s, 30, { y: 1 }); assert.equal(s.selectedIndex, 9, 'selector clamps without wrapping');
  tick(s, { y: -1 }); assert.equal(s.selectedIndex, 6, 'new direction moves immediately');
  tick(s); tick(s, { y: -1 }); assert.equal(s.selectedIndex, 3, 'release restarts immediate selection');
  ticks(s, 19, { y: -1 }); assert.equal(s.selectedIndex, 3);
  tick(s, { y: -1 }); assert.equal(s.selectedIndex, 0);
  assert.equal(s.foldsUsed, 0);
});

test('sub-tick A/B edges survive until a fixed tick exactly once, including a complete short tap', () => {
  const s = Model.create();
  Model.step(s, DT / 2, { aPressed: true }); assert.equal(s.tick, 0); assert.equal(s.foldCount, 0);
  Model.step(s, DT / 2, {}); assert.equal(s.tick, 1); assert.equal(s.foldCount, 1);
  settle(s); Model.step(s, DT / 2, { b: true }); assert.equal(s.undoCount, 0);
  Model.step(s, DT / 2, {}); assert.equal(s.undoCount, 1); assert.equal(s.foldsUsed, 0);
  ticks(s, 2); assert.equal(s.undoCount, 1); assert.equal(s.foldCount, 1);
  Model.step(s, DT / 2, { aPressed: true }); Model.step(s, DT / 2, { bPressed: true });
  assert.equal(s.lastAction.type, 'empty-undo'); assert.equal(s.foldCount, 1);
});

test('cancellation epochs initialize without cancelling, then suppress actions and never queue cancelled edges', () => {
  const initialized = Model.create(); tick(initialized, { cancelEpoch: 7, a: true });
  assert.equal(initialized.foldCount, 1, 'the first observed epoch is a baseline');
  const s = Model.create(); tick(s, { cancelEpoch: 3 }); const before = geometry(s);
  tick(s, { cancelEpoch: 4, a: true, b: true, x: 1 });
  assert.deepEqual(geometry(s), before); assert.equal(s.tick, 2); assert.equal(s.foldCount, 0);
  ticks(s, 30, { cancelEpoch: 4, cancelled: true, a: true, aPressed: true, bPressed: true, y: 1 });
  assert.equal(s.selectedIndex, 1); assert.equal(s.foldCount, 0); assert.equal(s.undoCount, 0);
  tick(s, { cancelEpoch: 4, a: true }); assert.equal(s.foldCount, 0, 'continued physical hold is not a fresh edge');
  tick(s, { cancelEpoch: 4 }); tick(s, { cancelEpoch: 4, a: true }); assert.equal(s.foldCount, 1);
});

test('cancelled samples advance clock and animation but discard pending sub-tick presses and animation inputs', () => {
  const pending = Model.create(); Model.step(pending, DT / 2, { aPressed: true });
  Model.step(pending, DT / 2, { cancelled: true });
  assert.equal(pending.tick, 1); assert.equal(pending.foldCount, 0); ticks(pending, 2); assert.equal(pending.foldCount, 0);
  const s = Model.create(); tick(s, { cancelEpoch: 1 }); beginFold(s, 'x-2-low');
  const started = s.tick;
  ticks(s, 36, { cancelEpoch: 2, cancelled: true, aPressed: true, bPressed: true, x: 1 });
  assert.equal(s.tick, started + 36); assert.equal(s.mode, 'editing'); assert.equal(s.foldAnimation, null);
  ticks(s, 8, { cancelled: true, aPressed: true, bPressed: true }); tick(s);
  assert.equal(s.foldCount, 1); assert.equal(s.undoCount, 0); assert.equal(s.invalidFolds, 0);
  assert.equal(s.selectedId, 'x-2-low'); assert.ok(s.remaining < 90);
});

test('deadline wins priority over a final settling fold, while settling one tick earlier really wins', () => {
  for (const extraTicks of [0, 1]) {
    const s = twoRedFixture(); beginFold(s, 'x-2-low');
    // Explicit boundary fixture: shorten the deadline to the known animation end.
    s.timeLimit = (s.tick + 36 + extraTicks) * DT;
    ticks(s, 36);
    assert.equal(s.targetMatched, true);
    if (!extraTicks) {
      assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'timeout');
      assert.equal(s.reviewCount, 0); assert.equal(s.mismatches, 0); assert.equal(s.remaining, 0);
    } else {
      assert.equal(s.phase, 'won'); assert.equal(s.reviewCount, 1); assert.equal(s.lostReason, null);
      assert.ok(s.remaining > 0 && s.remaining < DT + 1e-12);
    }
  }
  const s = wrongReviewFixture(); s.mismatches = 2; beginFold(s, 'x-2-low');
  s.timeLimit = (s.tick + 36) * DT; ticks(s, 36);
  assert.equal(s.lostReason, 'timeout'); assert.equal(s.mismatches, 2); assert.equal(s.reviewCount, 0);
});

test('score derives from visible matched cells, undo cannot farm it, and winning bonus freezes exactly once', () => {
  const s = twoRedFixture({ foldLimit: 2 });
  doFold(s, 'x-2-low'); assert.equal(s.phase, 'playing'); assert.equal(s.score, 100);
  tick(s, { b: true }); assert.equal(s.score, 0); tick(s);
  doFold(s, 'x-2-low'); assert.equal(s.score, 100); assert.equal(s.foldCount, 2);
  const won = twoRedFixture(); doFold(won, 'x-2-low');
  assert.equal(won.score, 100 + 1000 + Math.floor(won.remaining) * 5 + 300);
  const frozen = clone(won);
  for (const dt of [DT, 1, NaN, Infinity]) Model.step(won, dt, { aPressed: true, bPressed: true, x: 1 });
  assert.deepEqual(won, frozen); assert.equal(won.canUndo, false); assert.equal(won.reviewPending, false);
});

test('numeric inputs are bounded, fixed-step partitioning agrees, and retry/JSON states share no mutable geometry', () => {
  assert.equal(Model.create(NaN, NaN).seed, 1); assert.equal(Model.create(2, -100).level, 1);
  assert.equal(Model.create(2, 100).level, 3); assert.equal(Model.create(2, 1.9).level, 2);
  const s = Model.create(); const original = clone(s);
  for (const dt of [0, -1, NaN, Infinity, -Infinity, '1', undefined]) Model.step(s, dt, { aPressed: true });
  assert.deepEqual(s, original);
  tick(s, { x: NaN, y: Infinity }); assert.equal(s.selectedIndex, 1);
  tick(s, { x: -1e30 }); assert.equal(s.selectedIndex, 0);
  const large = Model.create(); Model.step(large, 100, {}); assert.equal(large.tick, 15, 'dt caps at .25 seconds');
  const a = Model.create(), b = Model.create(); beginFold(a, 'x-2-low'); beginFold(b, 'x-2-low');
  for (let i = 0; i < 4; i++) Model.step(a, 0.125, {});
  ticks(b, 30);
  const { _remainder: remainderA, ...stateA } = a;
  const { _remainder: remainderB, ...stateB } = b;
  assert.ok(Math.abs(remainderA - remainderB) < 1e-12, 'fractional accumulator permits floating-point roundoff');
  assert.deepEqual(stateA, stateB);
  const restored = clone(a); ticks(a, 6); ticks(restored, 6); assert.deepEqual(restored, a);
  const fresh = Model.create(); doFold(a, 'y-2-low');
  assert.deepEqual(fresh, original); assert.notStrictEqual(a.pieces, fresh.pieces);
  assert.notStrictEqual(a.cells[0].layers, fresh.cells[0].layers);
  assert.notStrictEqual(a.palette[0].rgb, fresh.palette[0].rgb);
  assert.equal(a.historyDepth, 2); assert.ok(a.events.length <= 32);
  const again = clone(a); tick(again, { b: true }); assert.equal(again.historyDepth, 1); assert.equal(a.historyDepth, 2);
});

for (let difficulty = 0; difficulty < 3; difficulty++) {
  test(`public geometry search solves authored level ${difficulty + 1} after a real trial fold and ordinary undo`, async t => {
    const { createPilot, assertProgress } = await import(pathToFileURL(path.join(__dirname, 'automation.mjs')).href);
    const pilot = createPilot(), s = Model.create(29, difficulty);
    const snapshot = () => ({ phase: s.phase, paused: false, level: difficulty,
      model: clone(Object.fromEntries(Object.entries(s).filter(([key]) => !key.startsWith('_')))) });
    const before = snapshot(), trace = [];
    let held = new Set(), previous = new Set(), trialBefore = null, sawRestored = false, sawAnimation = false;
    for (let frame = 0; frame < 5400 && s.phase === 'playing'; frame++) {
      if (frame % 5 === 0) {
        const view = snapshot(), unchanged = clone(view);
        held = new Set(pilot(view, { elapsed: s.elapsed, mode: 'record' }));
        assert.deepEqual(view, unchanged, 'planning must never write the observed public board');
        assert.ok(!('_history' in view.model), 'the planner gets no private undo snapshots');
        trace.push({ state: view });
      }
      const input = { x: Number(held.has('ArrowRight')) - Number(held.has('ArrowLeft')),
        y: Number(held.has('ArrowDown')) - Number(held.has('ArrowUp')), a: held.has('Space'), b: held.has('b'),
        aPressed: held.has('Space') && !previous.has('Space'), bPressed: held.has('b') && !previous.has('b'), cancelEpoch: 0 };
      if (input.aPressed && s.foldCount === 0) trialBefore = { geometry: geometry(s), elapsed: s.elapsed, mismatches: s.mismatches };
      const oldUndos = s.undoCount;
      tick(s, input); previous = new Set(held);
      if (s.mode === 'folding' && s.foldAnimation.progress > 0 && s.foldAnimation.progress < 1) sawAnimation = true;
      if (s.undoCount > oldUndos) {
        assert.ok(trialBefore); assert.deepEqual(geometry(s), trialBefore.geometry, 'B restores the actual pre-trial material and selected crease');
        assert.ok(s.elapsed > trialBefore.elapsed, 'inspection/undo never restores time');
        assert.equal(s.mismatches, trialBefore.mismatches); sawRestored = true;
      }
    }
    assert.equal(s.phase, 'won'); assert.equal(s.lostReason, null); assert.ok(sawAnimation && sawRestored);
    assert.equal(s.undoCount, 1); assert.equal(s.foldCount, s.foldLimit + 1); assert.equal(s.foldsUsed, s.foldLimit);
    assert.equal(s.mismatches, 0); assert.equal(s.reviewCount, 1); assert.ok(s.elapsed >= 30 && s.elapsed < 90);
    assert.ok(pilot.diagnostics().some(item => item.kind === 'planned-visible-trial'));
    assert.ok(pilot.diagnostics().some(item => item.kind === 'observed-trial-restored'));
    assertProgress({ before, after: snapshot(), trace }, assert);
    t.diagnostic(JSON.stringify({ kind: 'ordinary-public-fold-round', level: s.level, elapsed: s.elapsed,
      folds: s.foldCount, finalBudgetUsed: s.foldsUsed, undos: s.undoCount, mismatches: s.mismatches, score: s.score }));
  });
}
