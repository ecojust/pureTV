'use strict';

// Formal regression only: this file is not an ordinary-play corpus. Direct
// state edits are confined to explicitly SYNTHETIC partial-board/cache/cap
// fixtures. No complete winning configuration or stored input solution exists
// here; actual three-level wins and final-allowance success are separate QA.
const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');
const C = Model.config;
const DT = 1 / 60;
const clone = value => JSON.parse(JSON.stringify(value));
const counterKeys = ['calls', 'moves', 'pickups', 'placementsMade', 'rotations', 'removals', 'clears', 'blockedActions'];

function call(state, input = {}, dt = DT) {
  assert.equal(Model.step(state, dt, input), state);
  return state;
}

function press(state, input) {
  call(state, {});
  call(state, input);
  return state.events[0];
}

function rack(state, index) {
  assert.equal(state.mode, 'rack');
  let guard = 0;
  while (state.rackIndex !== index) {
    assert.ok(guard++ < 7, 'bounded rack navigation');
    press(state, { x: index > state.rackIndex ? 1 : -1 });
  }
}

function anchor(state, x, y) {
  assert.equal(state.mode, 'place');
  let guard = 0;
  while (state.preview.x !== x) {
    assert.ok(guard++ < 12, 'bounded preview navigation');
    press(state, { x: x > state.preview.x ? 1 : -1 });
  }
  while (state.preview.y !== y) {
    assert.ok(guard++ < 12, 'bounded preview navigation');
    press(state, { y: y > state.preview.y ? 1 : -1 });
  }
}

function check(state) {
  rack(state, state.pieceIds.length);
  return press(state, { a: true });
}

function syntheticJudge(level, poses) {
  // SYNTHETIC partial physical fixture, not a played or solved configuration.
  const state = Model.create(746, level);
  for (const [id, pose] of Object.entries(poses)) {
    state.placements[state.pieceIds.indexOf(id)] = clone(pose);
  }
  assert.ok(state.placements.some(pose => pose === null), 'fixtures intentionally omit at least one piece');
  check(state); // Canonical positions are freshly judged by the public CHECK action.
  assert.equal(state.phase, 'playing');
  assert.equal(state.failures, 1);
  return state;
}

function tree(value) {
  if (!value || typeof value !== 'object') return null;
  return { ref: value, children: Object.keys(value).map(key => [key, tree(value[key])]) };
}

function sameTree(value, saved) {
  if (!saved) return;
  assert.equal(value, saved.ref);
  for (const [key, child] of saved.children) sameTree(value[key], child);
}

function exactNoop(state, dt, input) {
  const before = clone(state), references = tree(state);
  assert.equal(Model.step(state, dt, input), state);
  assert.deepEqual(state, before);
  sameTree(state, references);
}

function detached(first, second) {
  const seen = new Set();
  function visit(value, fn) {
    if (!value || typeof value !== 'object') return;
    fn(value);
    Object.values(value).forEach(child => visit(child, fn));
  }
  visit(first, value => seen.add(value));
  visit(second, value => assert.equal(seen.has(value), false, 'independent object graphs'));
}

function deepFrozen(value) {
  if (!value || typeof value !== 'object') return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(deepFrozen);
}

function invariants(state) {
  const task = C.tasks[state.level];
  assert.equal(state.placements.length, task.pieceIds.length);
  assert.equal(state.geometry.pieces.length, task.pieceIds.length);
  assert.equal(state.failures, state.submissions.filter(receipt => !receipt.matched).length);
  assert.equal(state.score, state.phase === 'won' ? 100 : 0);
  assert.ok(state.events.length <= 1 && state.submissions.length <= 4);
  assert.ok(state.message.length <= 160);
  assert.ok(state.rackIndex >= 0 && state.rackIndex <= task.pieceIds.length);
  task.pieceIds.forEach((id, index) => {
    assert.equal(state.inventory[id], state.placements[index] === null ? 1 : 0);
    assert.ok(state.geometry.pieces[index].cells.length <= 4);
    assert.ok(state.geometry.pieces[index].vertices.length <= 8);
  });
  assert.equal(state.geometry.placedCount, state.placements.filter(Boolean).length);
  if (state.mode === 'place') {
    assert.ok(state.rackIndex < task.pieceIds.length);
    assert.ok(state.preview.x >= 0 && state.preview.x <= task.width);
    assert.ok(state.preview.y >= 0 && state.preview.y < task.height);
    assert.ok(state.preview.turn >= 0 && state.preview.turn < 4);
  } else assert.equal(state.preview, null);
  function finite(value) {
    if (typeof value === 'number') assert.ok(Number.isFinite(value));
    else if (value && typeof value === 'object') Object.values(value).forEach(finite);
  }
  finite(state);
}

// Independent test geometry uses polygon winding/area and iterative rotation
// of cell centers, rather than calling any private production geometry helper.
function polygonArea(vertices) {
  return vertices.reduce((sum, point, i) => {
    const next = vertices[(i + 1) % vertices.length];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0) / 2;
}

function containsPoint(vertices, x, y) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const a = vertices[i], b = vertices[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

function rotatedExpected(piece, turn, pose) {
  function rotate(point) {
    let result = point.slice();
    for (let index = 0; index < turn; index += 1) result = [-result[1], result[0]];
    return result;
  }
  const vertices = piece.vertices.map(rotate);
  const minX = Math.min(...vertices.map(point => point[0]));
  const minY = Math.min(...vertices.map(point => point[1]));
  const shift = point => [point[0] - minX + pose.x, point[1] - minY + pose.y];
  const cells = piece.cells.map(([x, y]) => shift(rotate([x + 0.5, y + 0.5])))
    .map(([x, y]) => [x - 0.5, y - 0.5]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  return { cells, vertices: vertices.map(shift) };
}

test('public API, exact original shape/box/door data, deeply immutable config', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['config', 'create', 'step']);
  assert.deepEqual(Object.keys(C).sort(), ['attemptLimit', 'defaultSeed', 'maxCounter', 'maxElapsed', 'pieces', 'tasks']);
  assert.deepEqual([C.defaultSeed, C.attemptLimit, C.maxElapsed, C.maxCounter], [746, 4, 86400, 2147483647]);
  assert.deepEqual(C.pieces.map(p => [p.id, p.name, p.nameZh, p.width, p.height]), [
    ['rail', 'RAIL', '长轨', 3, 1], ['elbow', 'ELBOW', '弯角', 2, 2], ['crate', 'CRATE', '方块', 2, 2],
    ['bar', 'BAR', '短条', 2, 1], ['tee', 'TEE', '丁板', 3, 2], ['zig', 'ZIG', '折板', 3, 2]
  ]);
  assert.deepEqual(C.pieces.map(p => p.cells), [
    [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]]
  ]);
  assert.deepEqual(C.pieces.map(p => p.vertices), [
    [[0, 0], [3, 0], [3, 1], [0, 1]], [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [0, 2]],
    [[0, 0], [2, 0], [2, 2], [0, 2]], [[0, 0], [2, 0], [2, 1], [0, 1]],
    [[0, 0], [3, 0], [3, 1], [2, 1], [2, 2], [1, 2], [1, 1], [0, 1]],
    [[0, 0], [2, 0], [2, 1], [3, 1], [3, 2], [1, 2], [1, 1], [0, 1]]
  ]);
  assert.deepEqual(C.tasks, [
    { id: 'side-hatch', name: 'SIDE HATCH', nameZh: '侧门小箱', width: 5, height: 4,
      rows: ['11110', '11111', '11111', '01111'], pieceIds: ['rail', 'elbow', 'crate', 'bar'],
      doors: [{ id: 'east', direction: 'right', start: 1, end: 2 }],
      requirements: [{ pieceId: 'rail', doorIds: ['east'] }] },
    { id: 'two-way-crate', name: 'TWO WAY CRATE', nameZh: '双向货箱', width: 5, height: 5,
      rows: ['11111', '11111', '01111', '01111', '01110'], pieceIds: ['rail', 'elbow', 'crate', 'bar', 'tee'],
      doors: [{ id: 'north', direction: 'up', start: 1, end: 3 }, { id: 'south', direction: 'down', start: 1, end: 4 }],
      requirements: [{ pieceId: 'elbow', doorIds: ['north'] }, { pieceId: 'rail', doorIds: ['south'] }] },
    { id: 'opposite-dispatch', name: 'OPPOSITE DISPATCH', nameZh: '对向出库', width: 6, height: 5,
      rows: ['011110', '111111', '111111', '111111', '011110'],
      pieceIds: ['rail', 'elbow', 'crate', 'bar', 'tee', 'zig'],
      doors: [{ id: 'east', direction: 'right', start: 1, end: 3 }, { id: 'west', direction: 'left', start: 3, end: 4 }],
      requirements: [{ pieceId: 'zig', doorIds: ['east'] }, { pieceId: 'rail', doorIds: ['west'] }] }
  ]);
  assert.deepEqual(C.tasks.map(t => t.rows.join('').split('').filter(x => x === '1').length), [18, 21, 26]);
  assert.deepEqual(C.tasks.map(t => t.pieceIds.reduce((sum, id) => sum + C.pieces.find(p => p.id === id).cells.length, 0)), [12, 16, 20]);
  for (const piece of C.pieces) {
    assert.equal(polygonArea(piece.vertices), piece.cells.length);
    assert.equal(new Set(piece.cells.map(String)).size, piece.cells.length);
    for (let y = 0; y < piece.height; y += 1) for (let x = 0; x < piece.width; x += 1) {
      assert.equal(containsPoint(piece.vertices, x + 0.5, y + 0.5), piece.cells.some(c => c[0] === x && c[1] === y));
    }
  }
  deepFrozen(C);
  assert.throws(() => { C.tasks[0].rows[0] = '11111'; }, TypeError);
  assert.throws(() => { C.pieces[0].cells[0][0] = 999; }, TypeError);
});

test('fresh seed/level normalization, isolated states/config and complete retry restoration', () => {
  for (const seed of [0, 1, 746, 4294967295]) assert.equal(Model.create(seed, 0).seed, seed);
  for (const seed of [undefined, null, '746', true, -1, 1.5, 4294967296, NaN, Infinity, {}, 1n]) {
    assert.equal(Model.create(seed, 0).seed, 746);
  }
  for (const level of [-1, 3, 0.5, '1', NaN, undefined, null]) assert.equal(Model.create(1, level).level, 0);
  for (let level = 0; level < 3; level += 1) {
    const state = Model.create(10, level), fresh = Model.create(10, level), task = C.tasks[level];
    assert.deepEqual(state, fresh); detached(state, fresh); detached(state, C);
    assert.deepEqual(state.placements, task.pieceIds.map(() => null));
    assert.deepEqual(state.pieceIds, task.pieceIds);
    assert.deepEqual(state.container, { width: task.width, height: task.height, rows: task.rows,
      doors: task.doors, requirements: task.requirements });
    assert.deepEqual([state.phase, state.reason, state.score, state.mode, state.rackIndex], ['playing', '', 0, 'rack', 0]);
    assert.equal(state.preview, null); assert.equal(state.previewCheck, null);
    assert.deepEqual([state.inputArmed, state.cancelEpoch, state.cancelledLast], [false, null, false]);
    assert.deepEqual([state.elapsed, state.elapsedCapped, state.counterSaturated], [0, false, false]);
    assert.equal(state.message, '选择零件后装入箱内；为标记零件留出指定直线出口。');
    assert.equal(state.geometry.allInside, true); assert.equal(state.geometry.noOverlap, true);
    assert.equal(state.geometry.allPlaced, false); assert.equal(state.geometry.canShip, false);
    assert.deepEqual(state.geometry.extractions, task.requirements.map(r => ({ pieceId: r.pieceId, placed: false, options: [], canExit: false })));
    counterKeys.forEach(key => assert.equal(state[key], 0));
    press(state, { a: true }); press(state, { b: true });
    anchor(state, task.width, 0); press(state, { a: true }); check(state);
    call(state, { cancelEpoch: 10, cancelled: true });
    assert.deepEqual(Model.create(10, level), fresh);
    invariants(state);
  }
});

test('all six true polygon outlines and cells rotate around normalized unchanged anchors', () => {
  const state = Model.create(746, 2);
  C.pieces.forEach((piece, index) => {
    rack(state, index); press(state, { a: true }); anchor(state, 1, 1);
    for (let q = 0; q < 4; q += 1) {
      assert.deepEqual(state.preview, { x: 1, y: 1, turn: q });
      const expected = rotatedExpected(piece, q, state.preview);
      assert.deepEqual(state.previewCheck.cells, expected.cells);
      assert.deepEqual(state.previewCheck.vertices, expected.vertices);
      assert.equal(polygonArea(state.previewCheck.vertices), piece.cells.length);
      assert.equal(state.inventory[piece.id], 1, 'preview does not consume inventory');
      assert.equal(state.geometry.placedCount, 0);
      detached(state.preview, state.previewCheck.pose);
      const event = press(state, { b: true });
      assert.equal(event.type, 'rotate');
      assert.deepEqual(event.from, { x: 1, y: 1, turn: q });
      assert.deepEqual(event.to, { x: 1, y: 1, turn: (q + 1) % 4 });
      detached(event.to, state.preview);
    }
    anchor(state, 6, 1); press(state, { a: true });
  });
  assert.equal(state.rotations, 24); assert.equal(state.placementsMade, 0);
  invariants(state);
});

test('bounded rack/anchor navigation, axis threshold and priority consume other fresh edges', () => {
  const state = Model.create();
  assert.equal(press(state, { x: -1 }).reason, 'boundary');
  press(state, { x: 0.5, y: -0.5 }); assert.equal(state.lastCommand, 'none');
  press(state, { x: -1, y: 1 }); assert.equal(state.rackIndex, 1, 'vertical wins equal magnitude');
  call(state, { x: 0, y: 0.8 }); assert.equal(state.moves, 1, 'held direction does not repeat');
  call(state, { x: -100, y: 0.8 }); assert.equal(state.rackIndex, 0, 'clamped horizontal wins');
  call(state, { x: Infinity, y: NaN }); assert.equal(state.lastCommand, 'none');
  press(state, { a: true, x: 1 }); assert.equal(state.mode, 'place');
  assert.equal(state.preview.x, 0); call(state, { a: true, x: 1 }); assert.equal(state.preview.x, 0);
  call(state, { a: true, y: 1 }); assert.equal(state.preview.y, 1, 'fresh changed direction acts while A stays held');
  press(state, { b: true, a: true, x: 1 }); assert.equal(state.preview.turn, 1);
  assert.equal(state.preview.x, 0); assert.equal(state.placementsMade, 0);
  call(state, { a: true, x: 1 }); assert.equal(state.preview.x, 0, 'suppressed direction did not queue');
  assert.equal(state.placementsMade, 0, 'suppressed A did not queue');
  anchor(state, 5, 3); assert.equal(press(state, { x: 1 }).reason, 'boundary');
  assert.equal(press(state, { y: 1 }).reason, 'boundary');
  assert.equal(state.preview.x, 5); assert.equal(state.preview.y, 3);
  press(state, { a: true }); rack(state, 4);
  assert.equal(press(state, { x: 1 }).reason, 'boundary');
  const event = press(state, { a: true, b: true });
  assert.equal(event.type, 'clear'); assert.equal(state.failures, 0);
  call(state, { a: true }); assert.equal(state.failures, 0);
  assert.equal(press(state, { a: true }).type, 'reject');
  invariants(state);
});

test('physical inventory, editing old pose, BACK cancellation, atomic replacement and removal', () => {
  const state = Model.create();
  assert.equal(press(state, { b: true }).reason, 'empty');
  const pick = press(state, { a: true });
  assert.deepEqual(pick, { type: 'pick', pieceId: 'rail', pose: { x: 0, y: 0, turn: 0 }, wasPlaced: false, call: state.calls });
  const commit = press(state, { a: true });
  assert.deepEqual(commit, { type: 'place', pieceId: 'rail', from: null, to: { x: 0, y: 0, turn: 0 }, call: state.calls });
  assert.equal(state.inventory.rail, 0); detached(commit.to, state.placements[0]);
  const oldGeometry = clone(state.geometry), oldPose = clone(state.placements[0]);
  press(state, { a: true }); assert.equal(state.events[0].wasPlaced, true);
  assert.equal(state.previewCheck.valid, true, 'own actual pose does not block editing');
  anchor(state, 0, 1);
  assert.deepEqual(state.geometry, oldGeometry); assert.deepEqual(state.placements[0], oldPose);
  assert.equal(state.inventory.rail, 0); assert.equal(state.geometry.placedCount, 1);
  anchor(state, 5, 1); press(state, { b: true });
  assert.equal(state.preview.turn, 1, 'B rotates even on BACK');
  assert.equal(state.previewCheck.valid, false);
  const cancel = press(state, { a: true });
  assert.deepEqual(cancel, { type: 'cancel', pieceId: 'rail', call: state.calls });
  assert.deepEqual(state.placements[0], oldPose); assert.deepEqual(state.geometry, oldGeometry);
  assert.equal(state.placementsMade, 1); assert.equal(state.inventory.rail, 0);
  press(state, { a: true }); anchor(state, 0, 1); press(state, { a: true });
  assert.deepEqual(state.placements[0], { x: 0, y: 1, turn: 0 });
  assert.equal(state.geometry.placedCount, 1); assert.equal(state.placementsMade, 2);
  press(state, { a: true }); press(state, { a: true });
  assert.equal(state.placementsMade, 3, 'same-pose recommit is still a commit');
  assert.equal(state.geometry.placedCount, 1);
  assert.deepEqual(press(state, { b: true }), { type: 'remove', pieceId: 'rail', pose: { x: 0, y: 1, turn: 0 }, call: state.calls });
  assert.equal(state.inventory.rail, 1); assert.equal(state.geometry.placedCount, 0);
  assert.equal(press(state, { b: true }).reason, 'empty');
  assert.equal(state.failures, 0); invariants(state);
});

test('SYNTHETIC nonconvex gaps and boundary touch differ from real cell overlap; IDs deduplicate in rack order', () => {
  const touching = syntheticJudge(0, { elbow: { x: 1, y: 1, turn: 0 }, bar: { x: 2, y: 1, turn: 0 } });
  assert.equal(touching.geometry.noOverlap, true, 'overlapping bounding boxes do not fill the L-shaped notch');
  assert.equal(touching.geometry.allInside, true);
  assert.equal(touching.geometry.validPacking, false, 'area or fit cannot replace missing pieces');
  const overlap = syntheticJudge(0, { elbow: { x: 1, y: 1, turn: 0 }, crate: { x: 1, y: 1, turn: 0 } });
  assert.deepEqual(overlap.geometry.pieces[1].overlapIds, ['crate']);
  assert.deepEqual(overlap.geometry.pieces[2].overlapIds, ['elbow']);
  assert.equal(overlap.geometry.noOverlap, false);
  const piled = Model.create();
  // SYNTHETIC invalid all-pieces fixture: every distinct piece is piled on the
  // same anchor. Sufficient floor area and full inventory use are not a fit.
  piled.placements = piled.pieceIds.map(() => ({ x: 1, y: 1, turn: 0 }));
  check(piled);
  assert.equal(piled.geometry.allPlaced, true); assert.equal(piled.geometry.allInside, true);
  assert.equal(piled.geometry.noOverlap, false); assert.equal(piled.geometry.canShip, false);
  assert.equal(piled.failures, 1); assert.equal(piled.phase, 'playing');
  const preview = syntheticJudge(1, { rail: { x: 0, y: 1, turn: 0 }, bar: { x: 2, y: 2, turn: 0 } });
  rack(preview, 2); press(preview, { a: true }); anchor(preview, 1, 1);
  assert.deepEqual(preview.previewCheck.blockerIds, ['rail', 'bar']);
  assert.equal(preview.previewCheck.valid, false);
  assert.equal(press(preview, { a: true }).reason, 'overlap');
  assert.equal(preview.failures, 1, 'blocked preview does not submit');
  invariants(preview);
});

test('outside previews remain visible; blocked commit never spends attempt; rotation can correct fit', () => {
  const state = Model.create();
  press(state, { a: true }); anchor(state, 3, 0);
  assert.deepEqual(state.previewCheck.outsideCells, [[4, 0], [5, 0]]);
  const pose = clone(state.preview);
  assert.equal(press(state, { a: true }).reason, 'outside');
  assert.deepEqual(state.preview, pose); assert.equal(state.placements[0], null);
  assert.equal(state.inventory.rail, 1); assert.equal(state.failures, 0);
  press(state, { b: true });
  assert.deepEqual(state.preview, { x: 3, y: 0, turn: 1 });
  assert.equal(state.previewCheck.valid, true);
  press(state, { a: true }); assert.equal(state.inventory.rail, 0);
  assert.equal(state.geometry.placedCount, 1); assert.equal(state.failures, 0);
  invariants(state);
});

test('SYNTHETIC exact four-direction sweeps, door endpoints, complete exit distances and missing-piece rejection', () => {
  const fixtures = [
    [0, 'rail', { x: 1, y: 1, turn: 0 }, 'right', 4, [1, 1, 6, 2]],
    [1, 'elbow', { x: 1, y: 2, turn: 0 }, 'up', 4, [1, -2, 2, 3]],
    [1, 'rail', { x: 1, y: 1, turn: 0 }, 'down', 4, [1, 1, 2, 6]],
    [2, 'rail', { x: 2, y: 3, turn: 0 }, 'left', 5, [-3, 3, 3, 4]],
    [2, 'zig', { x: 1, y: 1, turn: 0 }, 'right', 5, [1, 1, 7, 2]]
  ];
  for (const [level, id, pose, direction, distance, firstRect] of fixtures) {
    const state = syntheticJudge(level, { [id]: pose });
    const extraction = state.geometry.extractions.find(e => e.pieceId === id);
    const option = extraction.options[0];
    assert.equal(extraction.canExit, true); assert.equal(option.clear, true);
    assert.equal(option.direction, direction); assert.equal(option.distance, distance);
    assert.equal(option.doorFits, true); assert.deepEqual(option.wallHits, []); assert.deepEqual(option.blockerIds, []);
    assert.deepEqual([option.sweptRects[0].minX, option.sweptRects[0].minY, option.sweptRects[0].maxX, option.sweptRects[0].maxY], firstRect);
    const cells = state.geometry.pieces.find(p => p.id === id).cells;
    assert.equal(option.sweptRects.length, cells.length);
    const shifted = cells.map(([x, y]) => [x + (direction === 'right' ? distance : direction === 'left' ? -distance : 0),
      y + (direction === 'down' ? distance : direction === 'up' ? -distance : 0)]);
    const task = C.tasks[level];
    assert.ok(shifted.every(([x, y]) => x + 1 <= 0 || y + 1 <= 0 || x >= task.width || y >= task.height));
    assert.equal(state.geometry.canShip, false); assert.equal(state.submissions[0].matched, false);
  }
  const narrow = syntheticJudge(2, { zig: { x: 1, y: 1, turn: 1 } });
  assert.equal(narrow.geometry.allInside, true);
  assert.equal(narrow.geometry.extractions[0].options[0].doorFits, false);
  assert.equal(narrow.geometry.extractions[0].canExit, false);
  assert.deepEqual(narrow.geometry.extractions[0].options.map(x => x.doorId), ['east'], 'no alternate unnamed door/direction');
  const wrongBand = syntheticJudge(0, { rail: { x: 1, y: 2, turn: 0 } });
  assert.equal(wrongBand.geometry.allInside, true);
  assert.equal(wrongBand.geometry.extractions[0].options[0].doorFits, false);
});

test('SYNTHETIC middle-of-sweep blockers and notch walls; required pieces remain fixed during both exit tests', () => {
  const blocked = syntheticJudge(0, { rail: { x: 1, y: 1, turn: 0 }, bar: { x: 4, y: 1, turn: 1 } });
  assert.equal(blocked.geometry.noOverlap, true);
  assert.deepEqual(blocked.geometry.extractions[0].options[0].blockerIds, ['bar']);
  assert.equal(blocked.geometry.extractions[0].canExit, false, 'starting and fully-outside endpoints alone miss the intervening bar');
  rack(blocked, 3); press(blocked, { b: true });
  assert.equal(blocked.geometry.extractions[0].canExit, true, 'actual removal opens the same corridor');
  const wall = syntheticJudge(0, { rail: { x: 0, y: 0, turn: 0 } });
  assert.equal(wall.geometry.allInside, true);
  assert.deepEqual(wall.geometry.extractions[0].options[0].wallHits, [[4, 0]]);
  assert.equal(wall.geometry.extractions[0].canExit, false);
  // This real task's corner wall is also outside its door band; both predicates
  // are intentionally asserted, rather than claiming an isolated wall-only case.
  assert.equal(wall.geometry.extractions[0].options[0].doorFits, false);
  const fixed = syntheticJudge(1, { rail: { x: 1, y: 0, turn: 0 }, elbow: { x: 1, y: 1, turn: 0 } });
  assert.equal(fixed.geometry.allInside, true); assert.equal(fixed.geometry.noOverlap, true);
  assert.deepEqual(fixed.geometry.extractions.map(e => e.options[0].blockerIds), [['rail'], ['elbow']]);
  assert.deepEqual(fixed.geometry.extractions.map(e => e.canExit), [false, false]);
  assert.equal(fixed.geometry.canShip, false, 'testing one exit never removes its piece for the other exit');
});

test('SYNTHETIC preview/CHECK cache and copied-container corruption cannot bypass fresh physical judging', () => {
  const both = syntheticJudge(0, { bar: { x: 3, y: 0, turn: 1 } });
  rack(both, 0); press(both, { a: true }); anchor(both, 3, 0);
  assert.deepEqual(both.previewCheck.blockerIds, ['bar']);
  assert.deepEqual(both.previewCheck.outsideCells, [[4, 0], [5, 0]]);
  assert.equal(press(both, { a: true }).reason, 'outside', 'outside wins when overlap is also present');
  const state = Model.create();
  press(state, { a: true }); anchor(state, 3, 0);
  state.previewCheck.valid = true; state.previewCheck.outsideCells = []; // Synthetic stale cache.
  assert.equal(press(state, { a: true }).reason, 'outside');
  assert.equal(state.placements[0], null);
  press(state, { b: true });
  state.previewCheck.valid = false; state.previewCheck.blockerIds = ['rail']; // Synthetic stale veto.
  assert.equal(press(state, { a: true }).type, 'place');
  rack(state, 4);
  state.geometry.canShip = true; state.geometry.allPlaced = true; state.geometry.validPacking = true;
  state.inventory = { rail: 99, elbow: 99, crate: 99, bar: 99 };
  state.container.rows = ['11111', '11111', '11111', '11111'];
  state.container.doors = [{ id: 'east', direction: 'right', start: 0, end: 4 }];
  state.container.requirements = [];
  assert.equal(press(state, { a: true }).type, 'reject');
  assert.equal(state.geometry.canShip, false); assert.equal(state.geometry.allPlaced, false);
  assert.deepEqual(state.inventory, { rail: 0, elbow: 1, crate: 1, bar: 1 });
  assert.equal(state.geometry.extractions[0].options[0].doorFits, false, 'immutable door aperture remains authoritative');
  assert.equal(state.failures, 1);
  invariants(state);
});

test('clear preserves actual rejection history; receipt snapshots stay detached through subsequent edits', () => {
  const state = Model.create();
  press(state, { a: true }); press(state, { a: true }); check(state);
  assert.equal(state.failures, 1); assert.equal(state.geometry.placedCount, 1);
  const saved = clone(state.submissions[0]), refs = tree(state.submissions[0]);
  detached(state.submissions[0], state.geometry); detached(state.submissions[0], state.placements);
  detached(state.submissions[0].placements, state.submissions[0].geometry);
  const elapsed = state.elapsed;
  assert.deepEqual(press(state, { b: true }), { type: 'clear', removed: 1, call: state.calls });
  assert.equal(state.rackIndex, 4); assert.equal(state.clears, 1); assert.equal(state.failures, 1);
  assert.equal(state.geometry.placedCount, 0); assert.ok(state.elapsed > elapsed);
  assert.equal(press(state, { b: true }).removed, 0); assert.equal(state.clears, 2);
  rack(state, 0); press(state, { a: true }); press(state, { b: true });
  anchor(state, 1, 0); press(state, { a: true });
  assert.deepEqual(state.submissions, [saved]); sameTree(state.submissions[0], refs);
  assert.equal(state.inventory.rail, 0); invariants(state);
});

test('three natural empty-rack four-CHECK losses and exact terminal no-ops', () => {
  for (let level = 0; level < 3; level += 1) {
    const state = Model.create(746, level);
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const event = check(state), receipt = state.submissions[attempt - 1];
      assert.equal(event.type, attempt === 4 ? 'collision' : 'reject');
      assert.equal(state.phase, attempt === 4 ? 'lost' : 'playing');
      assert.equal(state.failures, attempt); assert.equal(state.submissions.length, attempt);
      assert.deepEqual([receipt.index, receipt.failuresBefore, receipt.failuresAfter, receipt.remaining, receipt.matched],
        [attempt - 1, attempt - 1, attempt, 4 - attempt, false]);
      assert.deepEqual(receipt.placements, state.placements);
      assert.deepEqual(receipt.geometry, state.geometry);
      detached(receipt, state.geometry);
    }
    assert.equal(state.message, '四次错误验收，本次装箱结束。');
    assert.equal(state.reason, 'attempts');
    assert.deepEqual(state.terminalReceipt, { cause: 'attempts', call: state.calls, elapsed: state.elapsed,
      placements: state.placements, inventory: state.inventory, geometry: state.geometry, matched: false,
      failures: 4, remaining: 0, score: 0, phase: 'lost', reason: 'attempts' });
    detached(state.terminalReceipt, state.submissions); detached(state.terminalReceipt, state.geometry);
    let reads = 0;
    const hostile = new Proxy({}, { getOwnPropertyDescriptor() { reads += 1; throw new Error('terminal input'); } });
    exactNoop(state, DT, hostile); exactNoop(state, NaN, { a: true }); exactNoop(state, 0.25, { b: true, cancelled: true });
    assert.equal(reads, 0); invariants(state);
  }
});

test('initial gate and strict epoch/cancel disarm require a subsequent real normalized neutral call', () => {
  const state = Model.create();
  call(state, { a: true }); call(state, { a: true });
  assert.equal(state.pickups, 0); assert.equal(state.inputArmed, false); assert.equal(state.calls, 2);
  call(state, { cancelEpoch: 0 }); assert.equal(state.inputArmed, true, 'initial baseline-neutral can arm');
  call(state, { a: true, cancelEpoch: 0 }); assert.equal(state.pickups, 1);
  call(state, { a: true, cancelEpoch: 0 }); assert.equal(state.placementsMade, 0, 'holding A does not place');
  call(state, { cancelEpoch: 1 });
  assert.equal(state.inputArmed, false, 'changed-epoch neutral cannot rearm on the disarm call');
  assert.equal(state.lastCommand, 'none');
  call(state, { b: true, cancelEpoch: 1 }); assert.equal(state.rotations, 0);
  call(state, { cancelEpoch: 1 }); assert.equal(state.inputArmed, true);
  call(state, { b: true, cancelEpoch: 2 });
  assert.equal(state.rotations, 0, 'changed epoch suppresses a fresh command even when previously armed');
  assert.equal(state.inputArmed, false); assert.equal(state.lastHeld.b, true);
  call(state, {}); call(state, { b: true, cancelEpoch: 2 }); assert.equal(state.rotations, 1);
  call(state, { cancelled: true, cancelEpoch: 2 }); assert.equal(state.inputArmed, false);
  call(state, { cancelled: true }); assert.equal(state.inputArmed, false);
  call(state, { b: true }); assert.equal(state.rotations, 1);
  call(state, {}); call(state, { b: true }); assert.equal(state.rotations, 2);
  call(state, { cancelEpoch: 0 }); assert.equal(state.inputArmed, false, 'decreasing epoch also disarms');
  call(state, {}); assert.equal(state.inputArmed, true);
  for (const epoch of [-1, '4', 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    call(state, { cancelEpoch: epoch }); assert.equal(state.cancelEpoch, 0); assert.equal(state.inputArmed, true);
  }
  const baseline = Model.create(); call(baseline, {});
  call(baseline, { a: true, cancelEpoch: Number.MAX_SAFE_INTEGER });
  assert.equal(baseline.pickups, 1, 'first valid epoch is a baseline, not a disarm');
  invariants(state);
});

test('own data descriptors, literal flags, atomic Proxy failure and ignored legacy input fields', () => {
  const state = Model.create(); call(state, {});
  let getters = 0;
  const input = Object.create(null);
  Object.defineProperty(input, 'a', { get() { getters += 1; throw new Error('getter'); } });
  Object.defineProperty(input, 'paused', { get() { getters += 1; return true; } });
  Object.defineProperty(input, 'x', { value: 1 });
  call(state, input); assert.equal(getters, 0); assert.equal(state.rackIndex, 1);
  call(state, Object.create({ a: true, b: true, x: 1, paused: true, cancelEpoch: 70 }));
  assert.equal(state.lastCommand, 'none'); assert.equal(state.cancelEpoch, null);
  call(state, { a: 1, b: 'true', cancelled: 1, paused: 'true', x: '1', aPressed: true, bPressed: true, direction: 'left' });
  assert.equal(state.lastCommand, 'none'); assert.equal(state.pickups, 0);
  const seen = [], partial = new Proxy({ x: 1, a: true, paused: true }, {
    getOwnPropertyDescriptor(target, key) {
      seen.push(key);
      if (key === 'paused') throw new Error('drop partially gathered fields');
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  const calls = state.calls; call(state, partial);
  assert.deepEqual(seen, ['x', 'y', 'a', 'b', 'cancelEpoch', 'cancelled', 'paused']);
  assert.equal(state.calls, calls + 1, 'throwing late paused read discards earlier paused=true too');
  assert.equal(state.lastCommand, 'none'); assert.equal(state.pickups, 0);
  const revoked = Proxy.revocable({}, {}); revoked.revoke(); call(state, revoked.proxy);
  assert.equal(state.lastCommand, 'none');
  for (const malformed of [null, undefined, [], true, 'a', 3, Symbol('a'), () => ({ a: true })]) {
    const fresh = Model.create(); Model.step(fresh, DT, malformed);
    assert.equal(fresh.inputArmed, true); assert.equal(fresh.calls, 1);
  }
  const frozenInput = Object.freeze({ a: true, cancelEpoch: 0 }); call(state, frozenInput);
  assert.equal(state.pickups, 1); assert.deepEqual(frozenInput, { a: true, cancelEpoch: 0 });
  detached(state.lastHeld, frozenInput);
});

test('invalid dt and normalized pause are exact no-ops without consuming release or input', () => {
  const state = Model.create(); press(state, { a: true });
  let reads = 0;
  const hostile = new Proxy({}, { getOwnPropertyDescriptor() { reads += 1; throw new Error('input read'); } });
  for (const dt of [0, -0, -1, 0.25000001, NaN, Infinity, -Infinity, undefined, null, '0.1', true, {}, 1n]) {
    exactNoop(state, dt, hostile);
  }
  assert.equal(reads, 0);
  exactNoop(state, DT, { paused: true, a: false, b: true, x: 1, cancelEpoch: 99, cancelled: true });
  call(state, { a: true }); assert.equal(state.placementsMade, 0, 'paused neutral did not release A');
  const message = state.message; call(state, {}); assert.equal(state.message, message); assert.deepEqual(state.events, []);
  call(state, { a: true }, 0.25); assert.equal(state.placementsMade, 1); invariants(state);
});

test('SYNTHETIC elapsed and every counter cap are strict, bounded and do not settle a round', () => {
  const state = Model.create(); call(state, {});
  state.elapsed = C.maxElapsed - 0.25; state.calls = C.maxCounter - 1;
  call(state, {}, 0.25);
  assert.equal(state.elapsed, C.maxElapsed); assert.equal(state.elapsedCapped, false);
  assert.equal(state.calls, C.maxCounter); assert.equal(state.counterSaturated, false);
  call(state, { a: true }, 0.25);
  assert.equal(state.elapsed, C.maxElapsed); assert.equal(state.elapsedCapped, true);
  assert.equal(state.calls, C.maxCounter); assert.equal(state.counterSaturated, true);
  assert.equal(state.pickups, 1); assert.equal(state.phase, 'playing');
  const tiny = Model.create(); tiny.elapsed = C.maxElapsed;
  call(tiny, {}, Number.MIN_VALUE);
  assert.equal(tiny.elapsed, C.maxElapsed); assert.equal(tiny.elapsedCapped, false); assert.equal(tiny.calls, 1);
  const cases = [
    ['moves', () => {}, { x: 1 }], ['pickups', () => {}, { a: true }],
    ['placementsMade', s => press(s, { a: true }), { a: true }],
    ['rotations', s => press(s, { a: true }), { b: true }],
    ['removals', s => { press(s, { a: true }); press(s, { a: true }); }, { b: true }],
    ['clears', s => rack(s, 4), { b: true }], ['blockedActions', () => {}, { x: -1 }]
  ];
  for (const [key, setup, input] of cases) {
    const sample = Model.create(); setup(sample);
    sample[key] = C.maxCounter; sample.counterSaturated = false; // Synthetic cap fixture.
    press(sample, input);
    assert.equal(sample[key], C.maxCounter); assert.equal(sample.counterSaturated, true, key);
    assert.equal(sample.phase, 'playing'); invariants(sample);
  }
});

test('long running cancellation/edit loops keep fixed state, receipt and geometry bounds', () => {
  const state = Model.create(746, 2), keys = Object.keys(state).sort();
  for (let cycle = 0; cycle < 128; cycle += 1) {
    rack(state, 0); press(state, { a: true }); anchor(state, 1, 1); press(state, { a: true });
    rack(state, 6); press(state, { b: true }); invariants(state);
  }
  for (let i = 0; i < 2048; i += 1) call(state, { cancelled: true, a: true, cancelEpoch: i });
  assert.equal(state.submissions.length, 0); assert.equal(state.terminalReceipt, null);
  assert.equal(state.phase, 'playing'); assert.equal(state.clears, 128);
  assert.deepEqual(Object.keys(state).sort(), keys); assert.deepEqual(state.events, []);
  assert.ok(JSON.stringify(state).length < 12000); invariants(state);
});
