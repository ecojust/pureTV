'use strict';

// Formal checks are not the separately recorded ordinary corpus or browser play.
// All state mutation in tests is explicitly labeled SYNTHETIC below.
const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');
const C = Model.config;
const DT = 1 / 60;
const clone = value => JSON.parse(JSON.stringify(value));
const counterKeys = ['calls', 'moves', 'placements', 'rotations', 'removals',
  'orderChanges', 'paletteChanges', 'clears', 'blockedActions'];
const publicWindows = [
  [{ glyph: 'hook', turn: 0, mirrored: false }, null, null,
    { glyph: 'flag', turn: 1, mirrored: false }, { glyph: 'sprout', turn: 3, mirrored: false }, null],
  [null, { glyph: 'hook', turn: 3, mirrored: true }, { glyph: 'flag', turn: 1, mirrored: true },
    null, { glyph: 'sprout', turn: 0, mirrored: true }, { glyph: 'hook', turn: 2, mirrored: true }],
  [{ glyph: 'sprout', turn: 1, mirrored: true }, { glyph: 'flag', turn: 2, mirrored: true }, null,
    { glyph: 'hook', turn: 3, mirrored: true }, { glyph: 'sprout', turn: 2, mirrored: true }, null]
];

function call(state, input = {}, dt = DT) {
  assert.equal(Model.step(state, dt, input), state);
  return state;
}

function press(state, input) {
  call(state, {});
  call(state, input);
  return state.events[0];
}

function go(state, row, col) {
  let moves = 0;
  while (state.focus.row !== row) {
    assert.ok(moves++ < 4, 'bounded focus navigation must reach its destination in at most four moves');
    press(state, { y: state.focus.row < row ? 1 : -1 });
  }
  while (state.focus.col !== col) {
    assert.ok(moves++ < 4, 'bounded focus navigation must reach its destination in at most four moves');
    press(state, { x: state.focus.col < col ? 1 : -1 });
  }
}

function palette(state, glyph) {
  go(state, 1, 2);
  let guard = 0;
  while (state.selectedGlyph !== glyph) {
    assert.ok(guard++ < 3);
    press(state, { a: true });
  }
}

function setOrder(state, order) {
  go(state, 0, 2);
  let guard = 0;
  while (state.order !== order) {
    assert.ok(guard++ < 3);
    press(state, { a: true });
  }
}

// Directly interpret one currently displayed target cell at a time. No saved
// source vector, action route, future-state simulation, or production helper.
function matchVisibleWindow(state, changeOrder = true) {
  for (let visibleSlot = 0; visibleSlot < 6; visibleSlot += 1) {
    const visible = state.target.window[visibleSlot];
    const odd = state.target.sector % 2 === 1;
    const row = Math.floor(visibleSlot / 2);
    const col = odd ? 1 - visibleSlot % 2 : visibleSlot % 2;
    const slot = row * 2 + col;
    go(state, row, col);
    if (state.source[slot] && (!visible || state.source[slot].glyph !== visible.glyph)) press(state, { b: true });
    if (!visible) continue;
    if (!state.source[slot]) {
      palette(state, visible.glyph);
      go(state, row, col);
      assert.ok(state.stock[visible.glyph] > 0);
      press(state, { a: true });
    }
    const turn = odd ? (4 - visible.turn) % 4 : visible.turn;
    let guard = 0;
    while (state.source[slot].turn !== turn) {
      assert.ok(guard++ < 4);
      press(state, { a: true });
    }
  }
  if (changeOrder) setOrder(state, state.target.order);
}

function check(state) {
  go(state, 2, 2);
  return press(state, { a: true });
}

function objectTree(value) {
  if (!value || typeof value !== 'object') return null;
  return { value, children: Object.keys(value).map(key => [key, objectTree(value[key])]) };
}

function assertTree(value, saved) {
  if (!saved) return;
  assert.equal(value, saved.value, 'no-op retained object identity');
  for (const [key, child] of saved.children) assertTree(value[key], child);
}

function exactNoop(state, dt, input) {
  const before = clone(state);
  const refs = objectTree(state);
  assert.equal(Model.step(state, dt, input), state);
  assert.deepEqual(state, before);
  assertTree(state, refs);
}

function assertDeepFrozen(value) {
  if (!value || typeof value !== 'object') return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(assertDeepFrozen);
}

function assertNoSharedObjects(a, b) {
  const seen = new Set();
  function visit(value, fn) {
    if (!value || typeof value !== 'object') return;
    fn(value);
    Object.values(value).forEach(child => visit(child, fn));
  }
  visit(a, value => seen.add(value));
  visit(b, value => assert.equal(seen.has(value), false, 'detached object graph'));
}

function invariants(state) {
  assert.equal(state.source.length, 6);
  assert.equal(state.pattern.cells.length, 12 * state.order);
  assert.equal(state.pattern.sectorCount, 2 * state.order);
  assert.equal(state.pattern.inspection.length, 6);
  assert.equal(state.pattern.windowMatches.length, 6);
  assert.equal(state.target.window.length, 6);
  assert.ok(state.events.length <= 1);
  assert.ok(state.submissions.length <= 4);
  assert.ok(state.source.filter(Boolean).length <= 4);
  assert.equal(state.pattern.instances.length, state.source.filter(Boolean).length * 2 * state.order);
  assert.ok(state.pattern.instances.length <= 40);
  assert.ok(state.focus.row >= 0 && state.focus.row <= 2 && state.focus.col >= 0 && state.focus.col <= 2);
  assert.equal(state.failures, state.submissions.filter(receipt => !receipt.matched).length);
  assert.equal(state.score, state.phase === 'won' ? 100 : 0);
  for (const glyph of C.glyphs) {
    const occupied = state.source.filter(piece => piece && piece.glyph === glyph.id).length;
    assert.equal(state.stock[glyph.id] + occupied, C.tasks[state.level].inventory[glyph.id]);
    assert.ok(state.stock[glyph.id] >= 0);
  }
  function finite(value) {
    if (typeof value === 'number') assert.ok(Number.isFinite(value));
    else if (value && typeof value === 'object') Object.values(value).forEach(finite);
  }
  finite(state);
  assert.ok(state.message.length <= 160);
}

function round12(value) {
  const result = Math.round(value * 1e12) / 1e12;
  return result === 0 ? 0 : result;
}

function rotate([x, y], angle) {
  return [Math.cos(angle) * x - Math.sin(angle) * y, Math.sin(angle) * x + Math.cos(angle) * y];
}

function near(actual, expected, tolerance = 1e-11) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
}

test('only public API; exact public polygons and target windows; deeply immutable config', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['config', 'create', 'step']);
  assert.deepEqual(Object.keys(C).sort(), ['attemptLimit', 'defaultSeed', 'glyphScale', 'glyphs',
    'maxCounter', 'maxElapsed', 'orders', 'radii', 'tasks'].sort());
  assert.deepEqual(C.orders, [3, 4, 5]);
  assert.deepEqual(C.radii, [0.42, 0.66, 0.9]);
  assert.equal(C.glyphScale, 0.007);
  assert.equal(C.defaultSeed, 745);
  assert.equal(C.attemptLimit, 4);
  assert.equal(C.maxElapsed, 86400);
  assert.equal(C.maxCounter, 2147483647);
  assert.deepEqual(C.glyphs.map(glyph => [glyph.id, glyph.name, glyph.nameZh]),
    [['hook', 'HOOK', '钩'], ['flag', 'FLAG', '旗'], ['sprout', 'SPROUT', '芽']]);
  assert.deepEqual(C.glyphs.map(glyph => glyph.polygons), [
    [[[-4, -5], [-1, -5], [-1, 2], [4, 2], [4, 5], [-4, 5]]],
    [[[-4, -5], [-2, -5], [-2, 5], [-4, 5]], [[-2, -5], [5, -2], [-2, 1]]],
    [[[-1, -5], [1, -5], [1, 5], [-1, 5]], [[1, -3], [5, -5], [5, -1], [1, 1]],
      [[0, 1], [-4, 2], [-4, 4], [0, 3]]]
  ]);
  assert.deepEqual(C.tasks.map(task => [task.id, task.name, task.nameZh, task.initialOrder,
    task.inventory, task.target.order, task.target.sector]), [
    ['first-rosette', 'FIRST ROSETTE', '初见花钥', 4, { hook: 1, flag: 1, sprout: 1 }, 3, 0],
    ['mirror-bloom', 'MIRROR BLOOM', '镜中花钥', 3, { hook: 2, flag: 1, sprout: 1 }, 4, 1],
    ['fivefold-crown', 'FIVEFOLD CROWN', '五重冠钥', 4, { hook: 1, flag: 1, sprout: 2 }, 5, 3]
  ]);
  C.tasks.forEach((task, level) => {
    assert.deepEqual(task.target.window, publicWindows[level]);
    assert.deepEqual(Object.keys(task.target).sort(), ['cells', 'instances', 'order', 'sector', 'window']);
    assert.equal(task.target.cells.length, task.target.order * 12);
    assertNoSharedObjects(task.target.window, task.target.cells);
    for (let sector = 0; sector < 2 * task.target.order; sector += 1) {
      const reversed = sector % 2 !== task.target.sector % 2;
      for (let slot = 0; slot < 6; slot += 1) {
        const row = Math.floor(slot / 2), col = slot % 2;
        const visible = publicWindows[level][row * 2 + (reversed ? 1 - col : col)];
        assert.deepEqual(task.target.cells[sector * 6 + slot], visible && {
          glyph: visible.glyph, turn: reversed ? (4 - visible.turn) % 4 : visible.turn,
          mirrored: sector % 2 === 1
        });
      }
    }
  });
  assertDeepFrozen(C);
  assert.throws(() => { C.tasks[1].target.window[1].turn = 2; }, TypeError);
  assert.throws(() => { C.glyphs[0].polygons[0][0][0] = 900; }, TypeError);
});

test('fresh creation, seed/level normalization, isolated graphs and full retry reset', () => {
  for (const seed of [0, 1, 745, 4294967295]) assert.equal(Model.create(seed, 0).seed, seed);
  for (const seed of [undefined, null, '745', false, -1, 1.1, 4294967296, NaN, Infinity, {}, 1n]) {
    assert.equal(Model.create(seed, 0).seed, 745);
  }
  for (const level of [-1, 3, 0.1, '1', NaN, undefined, null]) assert.equal(Model.create(1, level).level, 0);
  for (let level = 0; level < 3; level += 1) {
    const state = Model.create(42, level), another = Model.create(42, level);
    assert.deepEqual(state, another);
    assertNoSharedObjects(state, another);
    assertNoSharedObjects(state, C);
    assert.deepEqual(state.source, [null, null, null, null, null, null]);
    assert.deepEqual(state.stock, C.tasks[level].inventory);
    assert.equal(state.order, C.tasks[level].initialOrder);
    assert.equal(state.pattern.orderMatched, false);
    assert.equal(state.pattern.matched, false);
    assert.equal(state.pattern.windowMatchedCount, publicWindows[level].filter(cell => !cell).length);
    assert.deepEqual(state.target, { order: C.tasks[level].target.order,
      sector: C.tasks[level].target.sector, window: publicWindows[level] });
    assert.deepEqual(state.focus, { row: 0, col: 0 });
    assert.equal(state.selectedGlyph, 'hook');
    assert.equal(state.phase, 'playing');
    assert.equal(state.reason, '');
    assert.equal(state.score, 0);
    assert.equal(state.inputArmed, false);
    assert.equal(state.cancelEpoch, null);
    assert.equal(state.cancelledLast, false);
    assert.equal(state.elapsedCapped, false);
    assert.equal(state.counterSaturated, false);
    assert.equal(state.message, '摆放源扇区，比较镜像窗口；验收格 A 提交，B 清空。');
    for (const key of counterKeys) assert.equal(state[key], 0);
    press(state, { a: true });
    check(state);
    press(state, { b: true });
    call(state, { cancelled: true, cancelEpoch: 14 });
    assert.deepEqual(Model.create(42, level), another, 'retry is a fresh complete create');
    invariants(state);
  }
});

test('bounded 3x3 navigation, vertical tie, clamped axes and changed-direction edges', () => {
  const state = Model.create();
  press(state, { x: -1 });
  assert.deepEqual(state.focus, { row: 0, col: 0 });
  assert.equal(state.blockedActions, 1);
  assert.equal(state.lastCommand, 'left');
  assert.equal(state.message, '已到选择边界。');
  press(state, { x: 0.5, y: -0.5 });
  assert.equal(state.lastCommand, 'none');
  press(state, { x: 1, y: 1 });
  assert.deepEqual(state.focus, { row: 1, col: 0 });
  assert.equal(state.message, '已选择中圈左槽。');
  call(state, { x: 0.8, y: 0.8 });
  assert.equal(state.moves, 1, 'same direction does not repeat at different magnitudes');
  call(state, { x: 100, y: 0.8 });
  assert.deepEqual(state.focus, { row: 1, col: 1 });
  call(state, { x: 0, y: -1 });
  assert.deepEqual(state.focus, { row: 0, col: 1 });
  press(state, { x: Infinity, y: NaN });
  assert.equal(state.lastCommand, 'none');
  const event = press(state, { x: 1 });
  assert.equal(state.message, '已选择阶数。');
  assertNoSharedObjects(event.focus, state.focus);
  press(state, { x: 1 });
  assert.equal(state.blockedActions, 2);
  go(state, 2, 2);
  press(state, { y: 1 });
  assert.deepEqual(state.focus, { row: 2, col: 2 });
  invariants(state);
});

test('finite stock; placement, four turns, replacement, backwards palette and empty blocking', () => {
  const state = Model.create(745, 0);
  press(state, { b: true });
  assert.equal(state.message, '此源插槽为空。');
  assert.equal(state.blockedActions, 1);
  const place = press(state, { a: true });
  assert.deepEqual(place, { type: 'place', slot: 0, glyph: 'hook', turn: 0, call: state.calls });
  assert.equal(state.message, '已放置钩图符，朝向 0。');
  assert.equal(state.stock.hook, 0);
  for (let turn = 1; turn <= 4; turn += 1) {
    const event = press(state, { a: true });
    assert.deepEqual(event, { type: 'rotate', slot: 0, glyph: 'hook', from: (turn - 1) % 4,
      to: turn % 4, call: state.calls });
    assert.equal(state.source[0].turn, turn % 4);
    assert.equal(state.stock.hook, 0);
  }
  go(state, 0, 1);
  press(state, { a: true });
  assert.equal(state.source[1], null);
  assert.equal(state.message, '所选钩图符库存已用完，先取回再放置。');
  assert.equal(state.failures, 0);
  const blockedMessage = state.message;
  call(state, {});
  assert.equal(state.message, blockedMessage);
  palette(state, 'sprout');
  assert.equal(state.message, '已选择芽图符。');
  press(state, { b: true });
  assert.equal(state.selectedGlyph, 'flag');
  press(state, { b: true });
  assert.equal(state.selectedGlyph, 'hook');
  press(state, { b: true });
  assert.equal(state.selectedGlyph, 'sprout');
  go(state, 0, 0);
  press(state, { a: true });
  assert.equal(state.source[0].glyph, 'hook', 'A on occupied cannot substitute selected glyph');
  assert.equal(state.message, '已将钩图符旋转到朝向 1。');
  const removal = press(state, { b: true });
  assert.deepEqual(removal, { type: 'remove', slot: 0, glyph: 'hook', turn: 1, call: state.calls });
  assert.equal(state.message, '已取回钩图符，返还 1 枚。');
  assert.equal(state.stock.hook, 1);
  press(state, { a: true });
  assert.deepEqual(state.source[0], { glyph: 'sprout', turn: 0 });
  assert.equal(state.stock.sprout, 0);
  assert.equal(state.placements, 2);
  assert.equal(state.rotations, 5);
  assert.equal(state.removals, 1);
  assert.equal(state.blockedActions, 2);
  invariants(state);
});

test('order cycles preserve pieces and stocks; clear refunds pieces without restoring rejected attempts', () => {
  const state = Model.create(745, 1);
  press(state, { a: true });
  go(state, 2, 1);
  press(state, { a: true });
  press(state, { a: true });
  const originalSource = clone(state.source), originalStock = clone(state.stock);
  go(state, 0, 2);
  for (const order of [4, 5, 3, 4]) {
    press(state, { a: true });
    assert.equal(state.order, order);
    assert.deepEqual(state.source, originalSource);
    assert.deepEqual(state.stock, originalStock);
    assert.equal(state.message, `镜面对称阶数改为 ${order}；源图符与库存不变。`);
  }
  for (const order of [3, 5, 4]) {
    press(state, { b: true });
    assert.equal(state.order, order);
    assert.deepEqual(state.source, originalSource);
    assert.deepEqual(state.stock, originalStock);
  }
  check(state);
  assert.equal(state.failures, 1);
  assert.equal(state.message, '整幅钥匙尚未匹配，剩余 3 次错误额度。');
  const receipt = clone(state.submissions[0]);
  const elapsed = state.elapsed, selected = state.selectedGlyph;
  const clear = press(state, { b: true });
  assert.deepEqual(clear, { type: 'clear', removed: 2, call: state.calls });
  assert.equal(state.message, '已清空源扇区，返还 2 枚图符；错误记录保留。');
  assert.equal(state.failures, 1);
  assert.deepEqual(state.submissions, [receipt]);
  assert.deepEqual(state.stock, C.tasks[1].inventory);
  assert.equal(state.order, 4);
  assert.equal(state.selectedGlyph, selected);
  assert.deepEqual(state.focus, { row: 2, col: 2 });
  assert.ok(state.elapsed > elapsed);
  press(state, { b: true });
  assert.equal(state.events[0].removed, 0);
  assert.equal(state.clears, 2);
  assert.equal(state.failures, 1);
  invariants(state);
});

test('true glyph reflection, semantic turns and rounded geometry at every order and both parities', () => {
  for (const glyph of C.glyphs) {
    const turnShapes = new Set();
    for (let q = 0; q < 4; q += 1) {
      const shape = glyph.polygons.map(polygon => polygon.map(point => rotate(point, q * Math.PI / 2)
        .map(value => Math.round(value))));
      turnShapes.add(JSON.stringify(shape));
    }
    assert.equal(turnShapes.size, 4);
    const state = Model.create(745, 2);
    palette(state, glyph.id);
    go(state, 1, 1);
    press(state, { a: true });
    for (let q = 0; q < 4; q += 1) {
      if (q > 0) { go(state, 1, 1); press(state, { a: true }); }
      for (const order of C.orders) {
        setOrder(state, order);
        const alpha = Math.PI / order;
        const px = 0.66 * Math.sin(alpha / 4), py = -0.66 * Math.cos(alpha / 4);
        assert.equal(state.pattern.instances.length, 2 * order);
        for (let sector = 0; sector < 2 * order; sector += 1) {
          const mirrored = sector % 2 === 1;
          const slot = mirrored ? 2 : 3;
          const instance = state.pattern.instances[sector];
          assert.deepEqual(state.pattern.cells[sector * 6 + slot], {
            glyph: glyph.id, turn: mirrored ? (4 - q) % 4 : q, mirrored
          });
          assert.equal(state.pattern.cells[sector * 6 + (mirrored ? 3 : 2)], null);
          assert.deepEqual([instance.sector, instance.slot, instance.row, instance.col], [sector, slot, 1, slot % 2]);
          assert.equal(instance.mirrored, mirrored);
          assert.equal(instance.turn, mirrored ? (4 - q) % 4 : q);
          const center = rotate([mirrored ? -px : px, py], sector * alpha);
          assert.equal(instance.x, round12(center[0]));
          assert.equal(instance.y, round12(center[1]));
          assert.equal(instance.angle, round12(sector * alpha + (mirrored ? -1 : 1) * q * Math.PI / 2));
          for (const key of ['x', 'y', 'angle']) assert.equal(Object.is(instance[key], -0), false);
          let naiveDifference = false;
          for (const polygon of glyph.polygons) for (const vertex of polygon) {
            const sourceVertex = rotate(vertex, q * Math.PI / 2);
            if (mirrored) sourceVertex[0] = -sourceVertex[0];
            const trueMirror = rotate(sourceVertex, sector * alpha);
            const baked = rotate([mirrored ? -vertex[0] : vertex[0], vertex[1]], instance.angle);
            near(instance.x + C.glyphScale * baked[0], center[0] + C.glyphScale * trueMirror[0]);
            near(instance.y + C.glyphScale * baked[1], center[1] + C.glyphScale * trueMirror[1]);
            const ordinaryTile = rotate(vertex, instance.angle);
            if (Math.abs(ordinaryTile[0] - trueMirror[0]) > 0.1 ||
                Math.abs(ordinaryTile[1] - trueMirror[1]) > 0.1) naiveDifference = true;
          }
          assert.equal(naiveDifference, mirrored, 'negating angle without mirrored tile is observably wrong');
        }
        invariants(state);
      }
    }
  }
});

test('all three public visible windows can be matched by ordinary edits; only CHECK/A settles victory', () => {
  for (let level = 0; level < 3; level += 1) {
    const state = Model.create(745, level);
    matchVisibleWindow(state);
    assert.equal(state.phase, 'playing');
    assert.equal(state.score, 0);
    assert.equal(state.pattern.matched, true);
    assert.equal(state.pattern.windowMatchedCount, 6);
    assert.equal(state.submissions.length, 0);
    assert.deepEqual(state.pattern.cells, C.tasks[level].target.cells);
    assert.deepEqual(state.pattern.instances, C.tasks[level].target.instances);
    assert.deepEqual(state.stock, { hook: 0, flag: 0, sprout: 0 });
    assert.equal(check(state).type, 'win');
    assert.equal(state.phase, 'won');
    assert.equal(state.score, 100);
    assert.equal(state.reason, '');
    assert.equal(state.message, '完整钥匙匹配，验收成功。');
    assert.equal(state.failures, 0);
    assert.equal(state.submissions.length, 1);
    const receipt = state.submissions[0];
    assert.equal(receipt.index, 0);
    assert.equal(receipt.matched, true);
    assert.equal(receipt.remaining, 4);
    assert.equal(receipt.failuresBefore, 0);
    assert.equal(receipt.failuresAfter, 0);
    assert.deepEqual(receipt.cells, state.pattern.cells);
    assertNoSharedObjects(receipt, state.pattern);
    assertNoSharedObjects(receipt, state.source);
    assertNoSharedObjects(state.terminalReceipt, receipt);
    assertNoSharedObjects(state.terminalReceipt, state.pattern);
    assert.deepEqual(state.terminalReceipt, {
      cause: 'success', call: state.calls, elapsed: state.elapsed, order: state.order,
      source: state.source, stock: state.stock, cells: state.pattern.cells, matched: true,
      failures: 0, remaining: 4, score: 100, phase: 'won', reason: ''
    });
    invariants(state);
  }
});

test('matching inspection at the wrong order fails; matches are current and never banked', () => {
  for (let level = 0; level < 3; level += 1) {
    const state = Model.create(745, level);
    matchVisibleWindow(state, false);
    assert.equal(state.pattern.windowMatchedCount, 6);
    assert.equal(state.pattern.orderMatched, false);
    assert.equal(state.pattern.matched, false);
    assert.equal(check(state).type, 'reject');
    const firstReceipt = clone(state.submissions[0]);
    assert.equal(firstReceipt.windowMatchedCount, 6);
    setOrder(state, state.target.order);
    assert.equal(state.pattern.matched, true);
    const slot = state.source.findIndex(Boolean);
    go(state, Math.floor(slot / 2), slot % 2);
    press(state, { a: true });
    assert.equal(state.pattern.windowMatchedCount, 5);
    assert.equal(state.pattern.matched, false);
    check(state);
    assert.equal(state.failures, 2);
    assert.deepEqual(state.submissions[0], firstReceipt);
    matchVisibleWindow(state);
    check(state);
    assert.equal(state.phase, 'won');
    assert.equal(state.failures, 2);
    assert.equal(state.submissions.length, 3);
    invariants(state);
  }
});

test('ordinary empty, glyph identity and turn errors each reject; correction wins on the final allowance', () => {
  const state = Model.create(745, 0);
  check(state);
  assert.equal(state.failures, 1, 'empty initial plate rejects');
  matchVisibleWindow(state);
  go(state, 0, 0);
  press(state, { a: true });
  check(state);
  assert.equal(state.failures, 2, 'quarter-turn difference rejects');
  matchVisibleWindow(state);
  go(state, 0, 0);
  press(state, { b: true });
  go(state, 1, 1);
  press(state, { b: true });
  palette(state, 'flag');
  go(state, 0, 0);
  press(state, { a: true });
  palette(state, 'hook');
  go(state, 1, 1);
  press(state, { a: true });
  press(state, { a: true });
  assert.equal(state.pattern.windowMatchedCount, 4, 'right occupancy and turns with swapped glyph identities');
  check(state);
  assert.equal(state.failures, 3);
  assert.equal(state.phase, 'playing');
  press(state, { b: true });
  assert.equal(state.failures, 3, 'clear retains every error');
  matchVisibleWindow(state);
  check(state);
  assert.equal(state.phase, 'won');
  assert.equal(state.failures, 3);
  assert.equal(state.submissions.length, 4);
  assert.equal(state.submissions[3].failuresBefore, 3);
  assert.equal(state.submissions[3].failuresAfter, 3);
  assert.equal(state.submissions[3].remaining, 1);
  assert.equal(state.terminalReceipt.remaining, 1);
  invariants(state);
});

test('three natural four-rejection losses and immutable terminal transitions', () => {
  for (let level = 0; level < 3; level += 1) {
    const state = Model.create(745, level);
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const event = check(state);
      assert.equal(event.type, attempt === 4 ? 'collision' : 'reject');
      assert.equal(state.failures, attempt);
      assert.equal(state.submissions.length, attempt);
      assert.equal(state.submissions[attempt - 1].index, attempt - 1);
      assert.equal(state.submissions[attempt - 1].remaining, 4 - attempt);
      assert.equal(state.phase, attempt === 4 ? 'lost' : 'playing');
    }
    assert.equal(state.reason, 'attempts');
    assert.equal(state.message, '四次错误提交，花钥未能开启。');
    assert.equal(state.terminalReceipt.cause, 'attempts');
    assert.equal(state.terminalReceipt.matched, false);
    assert.equal(state.terminalReceipt.remaining, 0);
    assert.equal(state.terminalReceipt.score, 0);
    const hostile = new Proxy({}, { getOwnPropertyDescriptor() { throw new Error('terminal must not inspect input'); } });
    exactNoop(state, DT, hostile);
    exactNoop(state, 0.25, { a: true, b: true, x: 1, cancelEpoch: 99, cancelled: true });
    exactNoop(state, NaN, null);
    invariants(state);
  }
  const won = Model.create();
  matchVisibleWindow(won);
  check(won);
  exactNoop(won, DT, { b: true });
});

test('initial release gate, held A, held B and B>A>direction consumption', () => {
  const state = Model.create();
  call(state, { a: true });
  call(state, { a: true });
  assert.equal(state.placements, 0);
  assert.equal(state.inputArmed, false);
  assert.equal(state.elapsed, DT * 2);
  call(state, {});
  call(state, { a: true, x: 1 });
  assert.equal(state.source[0].glyph, 'hook');
  assert.deepEqual(state.focus, { row: 0, col: 0 });
  call(state, { a: true, x: 1 });
  assert.equal(state.rotations, 0);
  assert.equal(state.moves, 0);
  call(state, { a: true, y: 1 });
  assert.deepEqual(state.focus, { row: 1, col: 0 });
  assert.equal(state.placements, 1, 'changing direction while A held only navigates');
  go(state, 0, 0);
  press(state, { b: true, a: true, x: 1 });
  assert.equal(state.removals, 1);
  assert.equal(state.lastCommand, 'b');
  assert.deepEqual(state.focus, { row: 0, col: 0 });
  call(state, { a: true, x: 1 });
  assert.equal(state.placements, 1, 'suppressed A/direction do not queue');
  assert.equal(state.moves, 2);
  call(state, { b: true });
  assert.equal(state.events[0].reason, 'empty');
  const blocked = state.blockedActions;
  call(state, { b: true });
  assert.equal(state.blockedActions, blocked);
  go(state, 2, 2);
  press(state, { a: true, b: true });
  assert.equal(state.events[0].type, 'clear');
  assert.equal(state.submissions.length, 0);
  call(state, { a: true });
  assert.equal(state.submissions.length, 0);
  press(state, { a: true });
  assert.equal(state.submissions.length, 1);
  invariants(state);
});

test('cancel epochs and cancelled edges suppress held samples until genuine neutral', () => {
  const state = Model.create();
  call(state, {});
  call(state, { a: true, cancelEpoch: 0 });
  assert.equal(state.placements, 1, 'first epoch establishes baseline without cancelling');
  call(state, {});
  call(state, { a: true, cancelEpoch: 1 });
  assert.equal(state.rotations, 0);
  assert.equal(state.inputArmed, false);
  assert.equal(state.lastHeld.a, true);
  call(state, { cancelled: true, cancelEpoch: 1 });
  assert.equal(state.inputArmed, false, 'cancelled neutral cannot acknowledge a release');
  call(state, { a: true, cancelEpoch: 1 });
  assert.equal(state.rotations, 0);
  call(state, { cancelEpoch: 1 });
  assert.equal(state.inputArmed, true);
  call(state, { a: true, cancelEpoch: 1 });
  assert.equal(state.rotations, 1);
  call(state, {});
  call(state, { a: true, cancelled: true });
  assert.equal(state.inputArmed, false);
  assert.equal(state.rotations, 1);
  call(state, { cancelled: true });
  call(state, { a: true });
  assert.equal(state.rotations, 1);
  call(state, {});
  call(state, { a: true, cancelEpoch: 0 });
  assert.equal(state.cancelEpoch, 0, 'epoch difference, including decreasing, cancels');
  assert.equal(state.rotations, 1);
  call(state, {});
  call(state, { a: true, cancelEpoch: -1 });
  assert.equal(state.rotations, 2);
  assert.equal(state.cancelEpoch, 0, 'invalid epoch ignored');
  for (const epoch of [NaN, Infinity, '3', 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    press(state, { cancelEpoch: epoch });
    assert.equal(state.cancelEpoch, 0);
  }
  assert.equal(state.calls, Math.round(state.elapsed / DT));
  assert.equal(state.phase, 'playing');
});

test('own data input only; literal booleans, ignored fields, accessor safety and atomic Proxy failure', () => {
  const state = Model.create();
  let getterReads = 0;
  const accessor = Object.create(null);
  Object.defineProperty(accessor, 'a', { get() { getterReads += 1; throw new Error('getter'); } });
  Object.defineProperty(accessor, 'paused', { get() { getterReads += 1; return true; } });
  Object.defineProperty(accessor, 'x', { value: 1 });
  call(state, {});
  call(state, accessor);
  assert.equal(getterReads, 0);
  assert.deepEqual(state.focus, { row: 0, col: 1 });
  call(state, Object.create({ a: true, b: true, x: 1, paused: true, cancelEpoch: 70 }));
  assert.equal(state.lastCommand, 'none');
  assert.equal(state.cancelEpoch, null);
  call(state, { a: 1, b: 'true', paused: 1, cancelled: 'true', x: '1', aPressed: true,
    bPressed: true, direction: 'down', start: true, select: true });
  assert.equal(state.lastCommand, 'none');
  assert.equal(state.placements, 0);
  const descriptors = [];
  const partial = new Proxy({ a: true, x: 1, paused: true }, {
    getOwnPropertyDescriptor(target, key) {
      descriptors.push(key);
      if (key === 'paused') throw new Error('discard all partial reads');
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  call(state, partial);
  assert.deepEqual(descriptors, ['x', 'y', 'a', 'b', 'cancelEpoch', 'cancelled', 'paused']);
  assert.equal(state.lastCommand, 'none');
  assert.equal(state.placements, 0);
  assert.equal(state.inputArmed, true);
  const revoked = Proxy.revocable({}, {});
  revoked.revoke();
  call(state, revoked.proxy);
  assert.equal(state.lastCommand, 'none');
  for (const malformed of [null, undefined, [], true, 'x', 42, Symbol('input'), () => ({ a: true })]) {
    const fresh = Model.create();
    Model.step(fresh, DT, malformed);
    assert.equal(fresh.inputArmed, true, 'malformed nonobject normalizes neutral');
    assert.equal(fresh.calls, 1);
  }
  const frozenInput = Object.freeze({ a: true, cancelEpoch: Number.MAX_SAFE_INTEGER });
  call(state, frozenInput);
  assert.equal(state.placements, 1);
  assert.equal(state.cancelEpoch, Number.MAX_SAFE_INTEGER);
  assert.deepEqual(frozenInput, { a: true, cancelEpoch: Number.MAX_SAFE_INTEGER });
  assertNoSharedObjects(state.lastHeld, frozenInput);
});

test('invalid dt and normalized pause are exact no-ops before input can be consumed', () => {
  const state = Model.create();
  press(state, { a: true });
  let descriptorReads = 0;
  const hostile = new Proxy({}, { getOwnPropertyDescriptor() { descriptorReads += 1; throw new Error('read'); } });
  for (const dt of [0, -0, -1, 0.25000001, 1, NaN, Infinity, -Infinity, undefined, null, '0.1', true, {}, 1n]) {
    exactNoop(state, dt, hostile);
  }
  assert.equal(descriptorReads, 0);
  const paused = { paused: true, a: false, b: true, x: -1, cancelEpoch: 700, cancelled: true };
  exactNoop(state, DT, paused);
  call(state, { a: true });
  assert.equal(state.rotations, 0, 'pause did not release a held A');
  const originalMessage = state.message;
  call(state, {});
  assert.equal(state.message, originalMessage);
  assert.equal(state.events.length, 0);
  call(state, { a: true }, 0.25);
  assert.equal(state.rotations, 1);
  invariants(state);
});

test('SYNTHETIC corrupted display/cache cannot authorize a false win or veto freshly correct full geometry', () => {
  const wrong = Model.create();
  go(wrong, 2, 2);
  // Deliberate unsupported cache/display corruption; canonical source stays empty.
  wrong.pattern.matched = true;
  wrong.pattern.orderMatched = true;
  wrong.pattern.windowMatchedCount = 6;
  wrong.pattern.cells = clone(C.tasks[0].target.cells);
  wrong.stock = { hook: 99, flag: 99, sprout: 99 };
  wrong.target.order = wrong.order;
  wrong.target.window = [null, null, null, null, null, null];
  press(wrong, { a: true });
  assert.equal(wrong.phase, 'playing');
  assert.equal(wrong.failures, 1);
  assert.equal(wrong.pattern.matched, false);
  assert.deepEqual(wrong.stock, C.tasks[0].inventory);
  assert.ok(wrong.submissions[0].cells.every(cell => cell === null));
  const correct = Model.create(745, 1);
  matchVisibleWindow(correct);
  go(correct, 2, 2);
  // Synthetic wrong mirror/coordinates and stale flags must be regenerated.
  correct.pattern.cells.forEach(cell => { if (cell) cell.mirrored = false; });
  correct.pattern.instances.forEach(instance => { instance.angle = 0; instance.x = 999; });
  correct.pattern.matched = false;
  correct.pattern.windowMatchedCount = 0;
  correct.target.window = [null, null, null, null, null, null];
  press(correct, { a: true });
  assert.equal(correct.phase, 'won');
  assert.deepEqual(correct.submissions[0].cells, C.tasks[1].target.cells);
  assert.deepEqual(correct.pattern.instances, C.tasks[1].target.instances);
  assert.equal(correct.submissions[0].cells.some(cell => cell && cell.mirrored), true);
});

test('SYNTHETIC placement derives physical stock; receipt objects cannot alias later edits', () => {
  const state = Model.create();
  press(state, { a: true });
  go(state, 0, 1);
  state.stock.hook = 99; // Deliberately corrupt derived display stock only.
  press(state, { a: true });
  assert.equal(state.source[1], null);
  assert.equal(state.events[0].reason, 'stock');
  check(state); // Fresh submission restores the derived stock.
  assert.equal(state.stock.hook, 0);
  const receipt = clone(state.submissions[0]);
  const refs = objectTree(state.submissions[0]);
  assertNoSharedObjects(state.submissions[0].cells, state.pattern.cells);
  assertNoSharedObjects(state.submissions[0].inspection, state.submissions[0].cells);
  assertNoSharedObjects(state.pattern.inspection, state.pattern.cells);
  press(state, { b: true });
  go(state, 0, 0);
  press(state, { a: true });
  press(state, { a: true });
  setOrder(state, 5);
  palette(state, 'flag');
  assert.deepEqual(state.submissions[0], receipt);
  assertTree(state.submissions[0], refs);
  invariants(state);
});

test('SYNTHETIC elapsed/counter caps are strict, finite and never settle or disable input', () => {
  const state = Model.create();
  call(state, {});
  state.elapsed = C.maxElapsed - 0.25;
  state.calls = C.maxCounter - 1;
  call(state, {}, 0.25);
  assert.equal(state.elapsed, C.maxElapsed);
  assert.equal(state.elapsedCapped, false, 'exactly reaching cap is not overflow');
  assert.equal(state.calls, C.maxCounter);
  assert.equal(state.counterSaturated, false);
  call(state, { a: true }, 0.25);
  assert.equal(state.elapsed, C.maxElapsed);
  assert.equal(state.elapsedCapped, true);
  assert.equal(state.calls, C.maxCounter);
  assert.equal(state.counterSaturated, true);
  assert.equal(state.placements, 1);
  assert.equal(state.phase, 'playing');
  const tiny = Model.create();
  tiny.elapsed = C.maxElapsed;
  call(tiny, {}, Number.MIN_VALUE);
  assert.equal(tiny.elapsed, C.maxElapsed);
  assert.equal(tiny.elapsedCapped, false, 'ordinary IEEE addition has no artificial epsilon');
  assert.equal(tiny.calls, 1);
  const cases = [
    ['moves', s => {}, { x: 1 }],
    ['placements', s => {}, { a: true }],
    ['rotations', s => press(s, { a: true }), { a: true }],
    ['removals', s => press(s, { a: true }), { b: true }],
    ['orderChanges', s => go(s, 0, 2), { a: true }],
    ['paletteChanges', s => go(s, 1, 2), { a: true }],
    ['clears', s => go(s, 2, 2), { b: true }],
    ['blockedActions', s => {}, { x: -1 }]
  ];
  for (const [key, setup, input] of cases) {
    const sample = Model.create();
    setup(sample);
    sample[key] = C.maxCounter; // Synthetic near-boundary counter fixture.
    sample.counterSaturated = false;
    press(sample, input);
    assert.equal(sample[key], C.maxCounter);
    assert.equal(sample.counterSaturated, true, key);
    assert.equal(sample.phase, 'playing');
    invariants(sample);
  }
});

test('bounded long-run admitted calls, source edits and receipts without accumulated history', () => {
  const state = Model.create(745, 2);
  const keys = Object.keys(state).sort();
  for (let cycle = 0; cycle < 500; cycle += 1) {
    go(state, 0, 0);
    press(state, { a: true });
    press(state, { a: true });
    setOrder(state, C.orders[cycle % 3]);
    palette(state, C.glyphs[cycle % 3].id);
    go(state, 2, 2);
    press(state, { b: true });
    invariants(state);
  }
  for (let index = 0; index < 10000; index += 1) call(state, { cancelled: true, a: true, cancelEpoch: index });
  assert.equal(state.submissions.length, 0);
  assert.equal(state.terminalReceipt, null);
  assert.equal(state.phase, 'playing');
  assert.equal(state.clears, 500);
  assert.equal(state.events.length, 0);
  assert.deepEqual(Object.keys(state).sort(), keys);
  assert.ok(JSON.stringify(state).length < 12000);
  invariants(state);
});

test('deterministic replay across all levels and seeds compares every complete state after mixed calls', () => {
  const samples = [
    [DT, { a: true }],
    [0.1, {}],
    [0.25, { a: true }],
    [0.01, { a: true }],
    [DT, { a: true, x: 1 }],
    [0, { b: true }],
    [0.125, {}],
    [DT, { b: true }],
    [0.2, { paused: true, a: true, y: 1 }],
    [DT, { x: 1 }],
    [DT, {}],
    [0.25, { a: true }],
    [DT, { y: 1 }],
    [DT, {}],
    [DT, { a: true }],
    [DT, { x: -1 }],
    [DT, {}],
    [0.2, { a: true }],
    [DT, { a: true, cancelEpoch: 7 }],
    [DT, { a: true, cancelEpoch: 8 }],
    [DT, { cancelled: true, cancelEpoch: 8 }],
    [DT, { a: true, cancelEpoch: 8 }],
    [DT, {}],
    [DT, { a: true }],
    [DT, { x: -1, y: 1 }],
    [DT, { b: true }],
    [Number.MIN_VALUE, {}],
    [DT, { y: -1 }],
    [DT, { b: true }],
    [Infinity, { a: true, paused: true }],
    [0.02, { x: 1 }],
    [DT, { b: true }]
  ];
  for (let level = 0; level < 3; level += 1) {
    for (const seed of [0, 745, 4294967295]) {
      const first = Model.create(seed, level), replay = Model.create(seed, level);
      assert.deepEqual(first, replay);
      assertNoSharedObjects(first, replay);
      samples.forEach(([dt, input], index) => {
        const firstInput = clone(input), replayInput = clone(input);
        call(first, firstInput, dt);
        call(replay, replayInput, dt);
        assert.deepEqual(firstInput, input, 'original input remains unchanged');
        assert.deepEqual(replayInput, input, 'replay input remains unchanged');
        assert.deepEqual(first, replay, `level ${level}, seed ${seed}, call ${index + 1}`);
        invariants(first);
        invariants(replay);
      });
      assert.equal(first.placements, 2);
      assert.equal(first.rotations, 1);
      assert.equal(first.removals, 1);
      assert.equal(first.orderChanges, 1);
      assert.equal(first.paletteChanges, 2);
      assert.equal(first.cancelEpoch, 8);
      assert.equal(first.phase, 'playing');
    }
  }
});
