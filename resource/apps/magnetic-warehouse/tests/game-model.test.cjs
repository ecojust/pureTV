'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const model = require('../src/main/assets/game-model.js');
const DT = 1 / 60;
const clone = value => structuredClone(value);

// Public-board fixtures retain the native 13x9 row-major grid. They replace only
// documented board/entity fields, never call production helpers or install caches.
function board({ player = [2, 4, 1], crates = [{ id: 1, col: 10, row: 6, polarity: 1 }], docks,
  walls = [], scraps = [], budget = 100 } = {}) {
  const state = model.create(17, 0), grid = state.grid;
  const point = (col, row) => ({ x: grid.x + (col + 0.5) * grid.cellSize, y: grid.y + (row + 0.5) * grid.cellSize });
  state.cells = Array.from({ length: grid.cols * grid.rows }, (_, id) => {
    const col = id % grid.cols, row = Math.floor(id / grid.cols);
    const boundary = col === 0 || row === 0 || col === grid.cols - 1 || row === grid.rows - 1;
    return { id, col, row, ...point(col, row), type: boundary || walls.some(([c, r]) => c === col && r === row) ? 'wall'
      : scraps.some(([c, r]) => c === col && r === row) ? 'scrap' : 'floor', dockId: null };
  });
  state.player = { col: player[0], row: player[1], ...point(player[0], player[1]), polarity: player[2], facingX: 1, facingY: 0 };
  state.crates = crates.map(crate => ({ ...crate, ...point(crate.col, crate.row), docked: false }));
  state.docks = (docks || crates.map((crate, i) => ({ id: crate.id, col: i + 2, row: 1 })))
    .map(dock => ({ ...dock, ...point(dock.col, dock.row), occupiedBy: null, matched: false }));
  state.docks.forEach(dock => { state.cells[dock.row * grid.cols + dock.col].dockId = dock.id; });
  state.target = state.docks.length; state.matched = 0;
  state.actionBudget = budget; state.actionsUsed = 0; state.actionsRemaining = budget;
  return state;
}
function tick(state, input = {}) { model.step(state, DT, input); return state; }
function ticks(state, count, input = {}) { for (let i = 0; i < count; i += 1) tick(state, input); return state; }
function pulse(state) { return tick(state, { bPressed: true }); }
function position(state, id) { const crate = state.crates.find(item => item.id === id); return [crate.col, crate.row]; }
function positions(state) { return state.crates.map(crate => ({ id: crate.id, col: crate.col, row: crate.row })).sort((a, b) => a.id - b.id); }
function cell(state, col, row) { return state.cells[row * state.grid.cols + col]; }
function permutations(items) {
  if (items.length < 2) return [items.slice()];
  return items.flatMap((item, index) => permutations(items.filter((_, i) => i !== index)).map(rest => [item, ...rest]));
}
function winningBoard(options = {}) {
  return board({ player: [2, 4, 1], crates: [{ id: 1, col: 4, row: 4, polarity: -1 }], docks: [{ id: 1, col: 3, row: 4 }], ...options });
}

test('CommonJS/browser APIs expose only normal rules and independent native-grid layouts', () => {
  const context = {}; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/main/assets/game-model.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(model).sort(), ['TICK_HZ', 'create', 'step']);
  assert.deepEqual(Object.keys(context.PureModel).sort(), Object.keys(model).sort());
  assert.equal(model.TICK_HZ, 60);
  for (let level = 0; level < 3; level += 1) {
    const state = model.create(7, level); assert.equal(state.level, level + 1); assert.equal(state.cells.length, 13 * 9);
    assert.deepEqual([state.grid.cols, state.grid.rows], [13, 9]); assert.equal(state.crates.length, level + 2);
    state.cells.forEach((item, id) => { assert.equal(item.id, id); assert.equal(item.col, id % 13); assert.equal(item.row, Math.floor(id / 13)); });
    assert.ok(state.crates.every(crate => Number.isFinite(crate.x) && Number.isFinite(crate.y)));
  }
  assert.equal(model.create().level, 1); assert.equal(model.create(NaN, -9).level, 1); assert.equal(model.create(1, 99).level, 3);
});

test('equal poles repel and opposite poles attract exactly one cell in all four directions', () => {
  for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) for (const polarity of [1, -1]) {
    const state = board({ player: [6, 4, 1], crates: [{ id: 1, col: 6 + 2 * dx, row: 4 + 2 * dy, polarity }] });
    pulse(state); const distance = polarity === 1 ? 3 : 1;
    assert.deepEqual(position(state, 1), [6 + distance * dx, 4 + distance * dy]);
    assert.equal(state.pulse.targets[0].mode, polarity === 1 ? 'repel' : 'attract');
    assert.equal(state.pulse.targets[0].reason, 'moved'); assert.equal(state.actionsUsed, 1);
    assert.equal(state.repelledMoves, polarity === 1 ? 1 : 0); assert.equal(state.attractedMoves, polarity === -1 ? 1 : 0);
  }
});

test('only aligned crates are affected, but the field extends across the full board', () => {
  const state = board({ crates: [{ id: 1, col: 11, row: 4, polarity: -1 }, { id: 2, col: 10, row: 6, polarity: 1 }] });
  pulse(state); assert.deepEqual(position(state, 1), [10, 4]); assert.deepEqual(position(state, 2), [10, 6]);
  assert.deepEqual(state.pulse.targets.map(target => target.crateId), [1]);
});

test('walls occlude only crates behind them, and later board edits are read without stale collision caches', () => {
  const state = board({ crates: [{ id: 1, col: 4, row: 4, polarity: 1 }, { id: 2, col: 7, row: 4, polarity: 1 }], walls: [[6, 4]] });
  pulse(state); assert.deepEqual(position(state, 1), [5, 4]); assert.deepEqual(position(state, 2), [7, 4]);
  assert.deepEqual(state.pulse.targets.map(target => target.crateId), [1]);
  cell(state, 6, 4).type = 'floor'; pulse(state);
  assert.deepEqual(position(state, 1), [6, 4]); assert.deepEqual(position(state, 2), [8, 4]);
  assert.deepEqual(state.pulse.targets.map(target => target.crateId), [1, 2]);
});

test('other crates, dock markers and scrap chutes do not shield the magnetic field', () => {
  const crates = board({ crates: [{ id: 1, col: 4, row: 4, polarity: 1 }, { id: 2, col: 7, row: 4, polarity: -1 }] });
  pulse(crates); assert.deepEqual(position(crates, 1), [5, 4]); assert.deepEqual(position(crates, 2), [6, 4]);
  const markers = board({ crates: [{ id: 1, col: 6, row: 4, polarity: 1 }], docks: [{ id: 1, col: 4, row: 4 }], scraps: [[3, 4]] });
  pulse(markers); assert.deepEqual(position(markers, 1), [7, 4]); assert.equal(markers.phase, 'playing');
});

test('crate proposals refuse walls, the robot and destinations beyond the native grid', () => {
  const wall = board({ crates: [{ id: 1, col: 4, row: 4, polarity: 1 }], walls: [[5, 4]] }); pulse(wall);
  assert.deepEqual(position(wall, 1), [4, 4]); assert.equal(wall.pulse.targets[0].reason, 'wall');
  const robot = board({ crates: [{ id: 1, col: 3, row: 4, polarity: -1 }] }); pulse(robot);
  assert.deepEqual(position(robot, 1), [3, 4]); assert.equal(robot.pulse.targets[0].reason, 'player');
  const outside = board({ crates: [{ id: 1, col: 0, row: 4, polarity: 1 }] }); cell(outside, 0, 4).type = 'floor'; pulse(outside);
  assert.deepEqual(position(outside, 1), [0, 4]); assert.equal(outside.pulse.targets[0].reason, 'wall');
  assert.equal(outside.pulse.targets[0].toCol, -1, 'the blocked proposal is reported without changing crate coordinates');
});

test('repelling and attracting dependency chains use one shared pre-pulse state', () => {
  const repel = board({ crates: [3, 4, 5].map((col, i) => ({ id: i + 1, col, row: 4, polarity: 1 })) });
  pulse(repel); assert.deepEqual(positions(repel).map(item => item.col), [4, 5, 6]);
  assert.ok(repel.pulse.targets.every(target => target.moved)); assert.equal(repel.pulseCount, 1); assert.equal(repel.actionsUsed, 1);
  const attract = board({ crates: [4, 5, 6].map((col, i) => ({ id: i + 1, col, row: 4, polarity: -1 })) });
  pulse(attract); assert.deepEqual(positions(attract).map(item => item.col), [3, 4, 5]);
  assert.equal(attract.attractedMoves, 3); assert.equal(new Set(attract.crates.map(crate => `${crate.col},${crate.row}`)).size, 3);
});

test('a chain ending at a blocked occupant cannot tunnel through it', () => {
  const playerBlocked = board({ crates: [3, 4, 5].map((col, i) => ({ id: i + 1, col, row: 4, polarity: -1 })) });
  pulse(playerBlocked); assert.deepEqual(positions(playerBlocked).map(item => item.col), [3, 4, 5]);
  assert.deepEqual(playerBlocked.pulse.targets.map(target => target.reason), ['player', 'occupied', 'occupied']);
  const wallBlocked = board({ crates: [4, 5, 6].map((col, i) => ({ id: i + 1, col, row: 4, polarity: 1 })), walls: [[7, 4]] });
  pulse(wallBlocked); assert.deepEqual(positions(wallBlocked).map(item => item.col), [4, 5, 6]);
  assert.deepEqual(wallBlocked.pulse.targets.map(target => target.reason), ['occupied', 'occupied', 'wall']);
});

test('competing destinations reject every contender and propagate rejection to followers', () => {
  const state = board({ crates: [{ id: 1, col: 4, row: 4, polarity: 1 }, { id: 2, col: 6, row: 4, polarity: -1 }, { id: 3, col: 3, row: 4, polarity: 1 }] });
  const before = positions(state); pulse(state); assert.deepEqual(positions(state), before);
  assert.deepEqual(state.pulse.targets.map(target => target.reason), ['conflict', 'conflict', 'occupied']);
  assert.ok(state.pulse.targets.every(target => !target.moved)); assert.equal(state.blockedPulses, 1);
});

test('adjacent opposite-motion crates cannot swap through one another', () => {
  const state = board({ crates: [{ id: 1, col: 5, row: 4, polarity: 1 }, { id: 2, col: 6, row: 4, polarity: -1 }] });
  pulse(state); assert.deepEqual(position(state, 1), [5, 4]); assert.deepEqual(position(state, 2), [6, 4]);
  assert.deepEqual(state.pulse.targets.map(target => target.reason), ['cycle', 'cycle']);
});

test('crate and dock array order never changes chain, conflict or cycle outcomes', () => {
  const cases = [
    [4, 5, 6].map((col, i) => ({ id: i + 1, col, row: 4, polarity: 1 })),
    [{ id: 1, col: 4, row: 4, polarity: 1 }, { id: 2, col: 6, row: 4, polarity: -1 }, { id: 3, col: 3, row: 4, polarity: 1 }],
    [{ id: 1, col: 5, row: 4, polarity: 1 }, { id: 2, col: 6, row: 4, polarity: -1 }]
  ];
  for (const crates of cases) {
    const reference = board({ crates }); pulse(reference);
    for (const reordered of permutations(crates)) {
      const state = board({ crates: reordered, docks: reference.docks.map(({ id, col, row }) => ({ id, col, row })).reverse() });
      pulse(state); assert.deepEqual(positions(state), positions(reference)); assert.deepEqual(state.pulse.targets, reference.pulse.targets);
      assert.equal(state.actionsUsed, reference.actionsUsed); assert.equal(state.matched, reference.matched);
    }
  }
});

test('dock matching uses exact crate IDs independently of magnetic polarity', () => {
  const crates = [{ id: 1, col: 4, row: 2, polarity: -1 }, { id: 2, col: 8, row: 2, polarity: 1 }];
  const wrong = board({ crates, docks: [{ id: 1, col: 8, row: 2 }, { id: 2, col: 4, row: 2 }] });
  tick(wrong, { aPressed: true }); assert.equal(wrong.phase, 'playing'); assert.equal(wrong.matched, 0); assert.equal(wrong.score, 0);
  assert.deepEqual(wrong.docks.map(dock => dock.occupiedBy), [2, 1]); assert.ok(wrong.crates.every(crate => !crate.docked));
  const correct = board({ crates, docks: crates.map(({ id, col, row }) => ({ id, col, row })) });
  tick(correct, { aPressed: true }); assert.equal(correct.phase, 'won'); assert.equal(correct.matched, 2);
  assert.ok(correct.docks.every(dock => dock.matched)); assert.ok(correct.crates.every(crate => crate.docked));
});

test('a matched crate remains movable and leaving its own dock removes partial score', () => {
  const state = board({ player: [6, 4, 1], crates: [{ id: 1, col: 4, row: 4, polarity: 1 }, { id: 2, col: 10, row: 6, polarity: -1 }],
    docks: [{ id: 1, col: 4, row: 4 }, { id: 2, col: 10, row: 1 }] });
  tick(state, { aPressed: true }); assert.equal(state.matched, 1); assert.equal(state.score, 300); assert.equal(state.crates[0].docked, true);
  pulse(state); assert.deepEqual(position(state, 1), [5, 4]); assert.equal(state.matched, 0); assert.equal(state.score, 0); assert.equal(state.docks[0].occupiedBy, null);
});

test('the robot refuses walls, scrap, crates and outside tiles without spending actions or pushing', () => {
  const cases = [
    board({ walls: [[3, 4]] }), board({ scraps: [[3, 4]] }),
    board({ crates: [{ id: 1, col: 3, row: 4, polarity: 1 }] })
  ];
  for (const state of cases) {
    const crateBefore = positions(state); tick(state, { x: 1 });
    assert.deepEqual([state.player.col, state.player.row], [2, 4]); assert.equal(state.actionsUsed, 0); assert.equal(state.moveCount, 0);
    assert.equal(state.blockedMoves, 1); assert.deepEqual(positions(state), crateBefore); assert.equal(state.phase, 'playing');
  }
  const outside = board({ player: [0, 4, 1] }); cell(outside, 0, 4).type = 'floor'; tick(outside, { x: -1 });
  assert.equal(outside.player.col, 0); assert.equal(outside.actionsUsed, 0); assert.equal(outside.blockedMoves, 1);
});

test('flipping and empty pulses always consume one action; blocked walking consumes none', () => {
  const state = board({ walls: [[3, 4]], budget: 3 }); tick(state, { x: 1 }); assert.equal(state.actionsRemaining, 3);
  tick(state, { aPressed: true }); assert.equal(state.actionsRemaining, 2); assert.equal(state.flipCount, 1);
  pulse(state); assert.equal(state.actionsRemaining, 1); assert.equal(state.pulseCount, 1); assert.equal(state.blockedPulses, 1); assert.deepEqual(state.pulse.targets, []);
  tick(state, { aPressed: true }); assert.equal(state.phase, 'lost'); assert.equal(state.lostReason, 'actions'); assert.equal(state.actionsUsed, 3);
});

test('movement is immediate, waits twenty ticks for its first repeat, then repeats every ten', () => {
  const state = board(); tick(state, { x: 1 }); assert.equal(state.player.col, 3);
  ticks(state, 19, { x: 1 }); assert.equal(state.player.col, 3);
  tick(state, { x: 1 }); assert.equal(state.player.col, 4);
  ticks(state, 9, { x: 1 }); assert.equal(state.player.col, 4); tick(state, { x: 1 }); assert.equal(state.player.col, 5);
  tick(state, {}); tick(state, { x: 1 }); assert.equal(state.player.col, 6, 'release resets the delay');
  tick(state, { y: 1 }); assert.deepEqual([state.player.col, state.player.row], [6, 5], 'changing direction moves immediately');
  const blocked = board({ walls: [[3, 4]] }); tick(blocked, { x: 1 }); ticks(blocked, 19, { x: 1 }); assert.equal(blocked.blockedMoves, 1);
  tick(blocked, { x: 1 }); assert.equal(blocked.blockedMoves, 2); cell(blocked, 3, 4).type = 'floor';
  ticks(blocked, 9, { x: 1 }); assert.equal(blocked.player.col, 2); tick(blocked, { x: 1 }); assert.equal(blocked.player.col, 3);
  assert.equal(blocked.actionsUsed, 1, 'only the successful repeat spends an action');
});

test('movement applies the dead zone, clamping, dominant axis and horizontal diagonal tie rule', () => {
  const cases = [
    [{ x: 0.2499, y: -0.2499 }, [2, 4]], [{ x: 0.25 }, [3, 4]],
    [{ x: 1, y: 1 }, [3, 4]], [{ x: -1, y: -1 }, [1, 4]],
    [{ x: 0.3, y: -0.8 }, [2, 3]], [{ x: 100, y: 2 }, [3, 4]],
    [{ x: NaN, y: Infinity }, [2, 4]], [{ x: '1', y: 0 }, [2, 4]]
  ];
  for (const [input, expected] of cases) { const state = board(); tick(state, input); assert.deepEqual([state.player.col, state.player.row], expected); }
});

test('held buttons act once, explicit pulses preserve re-presses, and sub-tick edges are buffered', () => {
  const held = board(); tick(held, { a: true, b: true }); ticks(held, 20, { a: true, b: true });
  assert.equal(held.flipCount, 1); assert.equal(held.pulseCount, 1);
  tick(held, { a: true, b: true, aPressed: true, bPressed: true }); assert.equal(held.flipCount, 2); assert.equal(held.pulseCount, 2);
  tick(held, {}); tick(held, { a: true, b: true }); assert.equal(held.flipCount, 3); assert.equal(held.pulseCount, 3);
  const buffered = board(); model.step(buffered, DT / 4, { aPressed: true, bPressed: true });
  assert.equal(buffered.tick, 0); assert.equal(buffered.actionsUsed, 0);
  model.step(buffered, DT / 4, {}); assert.equal(buffered.flipCount, 0);
  model.step(buffered, DT / 2, {}); assert.equal(buffered.tick, 1); assert.equal(buffered.flipCount, 1); assert.equal(buffered.pulseCount, 1);
  tick(buffered, {}); assert.equal(buffered.actionsUsed, 2, 'buffered edges are not replayed on later ticks');
});

test('simultaneous input executes A, then B at the new polarity, then movement from the pulse origin', () => {
  const state = board({ player: [3, 4, 1], crates: [{ id: 1, col: 6, row: 4, polarity: 1 }] });
  tick(state, { aPressed: true, bPressed: true, x: 1 });
  assert.equal(state.player.polarity, -1); assert.deepEqual(position(state, 1), [5, 4]); assert.deepEqual([state.player.col, state.player.row], [4, 4]);
  assert.equal(state.actionsUsed, 3); assert.equal(state.pulse.polarity, -1); assert.equal(state.pulse.origin.col, 3);
  assert.deepEqual(state.events.map(event => event.type), ['flip', 'pulse', 'move']); assert.equal(state.lastAction.type, 'move');
});

test('terminal evaluation after each atomic action suppresses later actions in the same tick', () => {
  const exhausted = board({ budget: 1 }); tick(exhausted, { aPressed: true, bPressed: true, y: 1 });
  assert.equal(exhausted.lostReason, 'actions'); assert.equal(exhausted.flipCount, 1); assert.equal(exhausted.pulseCount, 0); assert.equal(exhausted.moveCount, 0);
  const pulseExhausted = board({ budget: 1 }); tick(pulseExhausted, { bPressed: true, y: 1 });
  assert.equal(pulseExhausted.lostReason, 'actions'); assert.equal(pulseExhausted.pulseCount, 1); assert.equal(pulseExhausted.moveCount, 0);
  const won = winningBoard({ crates: [{ id: 1, col: 4, row: 4, polarity: 1 }], budget: 2 });
  tick(won, { aPressed: true, bPressed: true, y: 1 }); assert.equal(won.phase, 'won'); assert.equal(won.actionsRemaining, 0);
  assert.equal(won.flipCount, 1); assert.equal(won.pulseCount, 1); assert.equal(won.moveCount, 0); assert.equal(won.player.row, 4);
});

test('the final action may win, while scrap loss outranks matched docks and exhausted actions', () => {
  const last = winningBoard({ budget: 1 }); pulse(last);
  assert.equal(last.phase, 'won'); assert.equal(last.actionsRemaining, 0); assert.equal(last.matched, 1);
  // Explicit precedence fixture: the numbered dock is on a marked scrap tile.
  const scrap = board({ crates: [{ id: 1, col: 3, row: 4, polarity: 1 }], docks: [{ id: 1, col: 4, row: 4 }], scraps: [[4, 4]], budget: 1 });
  tick(scrap, { bPressed: true, y: 1 }); assert.equal(scrap.phase, 'lost'); assert.equal(scrap.lostReason, 'scrap');
  assert.equal(scrap.matched, 1); assert.equal(scrap.actionsRemaining, 0); assert.equal(scrap.score, 300); assert.equal(scrap.moveCount, 0);
});

test('deadline expiry precedes pending actions; a safe action before the deadline can still win', () => {
  const expired = winningBoard({ budget: 1 }); expired.timeLimit = DT; expired.remaining = DT;
  tick(expired, { aPressed: true, bPressed: true, x: 1 });
  assert.equal(expired.lostReason, 'timeout'); assert.equal(expired.actionsUsed, 0); assert.equal(expired.pulse, null); assert.deepEqual(position(expired, 1), [4, 4]);
  const early = winningBoard({ budget: 1 }); early.timeLimit = 2 * DT; early.remaining = 2 * DT;
  pulse(early); assert.equal(early.phase, 'won'); assert.equal(early.tick, 1); assert.equal(early.score, 800);
});

test('pulse evidence stays at its emission coordinates, expires after 0.45 seconds and does not accumulate events', () => {
  const state = board({ crates: [{ id: 1, col: 6, row: 4, polarity: 1 }] }); pulse(state);
  const emitted = clone(state.pulse); tick(state, { y: -1 }); assert.deepEqual(state.pulse, emitted);
  assert.equal(state.pulse.origin.row, 4); assert.equal(state.player.row, 3);
  ticks(state, 25); assert.equal(state.tick, 27); assert.deepEqual(state.pulse, emitted);
  tick(state); assert.equal(state.tick, 28); assert.equal(state.pulse, null); assert.deepEqual(state.events, []);
  assert.ok(state.events.length <= 32); assert.equal(emitted.targets[0].fromCol, 6); assert.equal(emitted.targets[0].toCol, 7);
});

test('terminal calls freeze all fields and retry restores independent arrays, counters and held-edge state', () => {
  const won = winningBoard(); pulse(won); const terminalWin = clone(won);
  model.step(won, 0.25, { aPressed: true, bPressed: true, x: -1 }); assert.deepEqual(won, terminalWin);
  const lost = board({ budget: 1 }); tick(lost, { aPressed: true }); const terminalLoss = clone(lost);
  ticks(lost, 50, { a: true, b: true, y: 1 }); assert.deepEqual(lost, terminalLoss);
  for (let level = 0; level < 3; level += 1) {
    const original = model.create(61, level), played = model.create(61, level);
    tick(played, { a: true, b: true, y: 1 }); played.cells[1].type = 'scrap'; played.crates[0].col = 0;
    const retry = model.create(61, level); assert.deepEqual(retry, original); assert.notEqual(retry.cells, original.cells); assert.notEqual(retry.crates[0], original.crates[0]);
    tick(retry, { a: true }); assert.equal(retry.flipCount, 1); assert.equal(retry.player.polarity, -1);
    assert.deepEqual(model.create(61, level), original, 'a play session cannot modify the authored layout');
  }
});

test('serialized states replay identically, frame subdivision preserves rules, and invalid numeric time is inert', () => {
  const state = board({ player: [3, 4, 1], crates: [{ id: 1, col: 6, row: 4, polarity: 1 }, { id: 2, col: 3, row: 6, polarity: -1 }] });
  const restored = JSON.parse(JSON.stringify(state));
  const sequence = [{ bPressed: true }, { x: 1 }, {}, { aPressed: true }, { bPressed: true }, { y: -1 }];
  sequence.forEach(input => { tick(state, input); tick(restored, input); }); assert.deepEqual(restored, state);
  const coarse = board(), fine = board(); model.step(coarse, 0.1, { bPressed: true }); tick(fine, { bPressed: true }); ticks(fine, 5);
  for (const key of ['tick', 'elapsed', 'remaining', 'actionsUsed', 'pulseCount', 'player', 'crates', 'pulse']) assert.deepEqual(coarse[key], fine[key]);
  const before = clone(state); for (const dt of [0, -1, NaN, Infinity, '0.1', undefined]) model.step(state, dt, { aPressed: true, bPressed: true, x: 1 });
  assert.deepEqual(state, before);
  const capped = board(); model.step(capped, 100, {}); assert.equal(capped.tick, 15); assert.equal(capped.elapsed, 0.25);
});

// Authored solutions are test data only. The actual model receives ordinary
// directional/A/B states; no entity, budget, map or terminal state is changed.
const ordinaryRoutes = [
  'RRDDABBBBBRUUURRRDDRBBBB',
  'UABBLDABRURRABBRDDRRRRBBBB',
  'RRRUURRRDBRDRDDBBLLLLLLLLUUABBLDABRURRABBRDDRRRRBBBB'
];
function ordinaryKey(state, key, intervalTicks = 80) {
  tick(state, { x: key === 'R' ? 1 : key === 'L' ? -1 : 0,
    y: key === 'D' ? 1 : key === 'U' ? -1 : 0, a: key === 'A', b: key === 'B' });
  for (let i = 1; i < intervalTicks && state.phase === 'playing'; i += 1) tick(state, {});
}
ordinaryRoutes.forEach((route, difficulty) => {
  test(`ordinary keys solve authored map ${difficulty + 1} using actual attraction, repulsion and polarity flips`, () => {
    const state = model.create(17, difficulty), initialPoles = state.crates.map(crate => crate.polarity);
    assert.equal(state.phase, 'playing'); assert.equal(state.matched, 0);
    for (const key of route) {
      assert.equal(state.phase, 'playing', 'the solution must not issue commands after the last winning action');
      const before = state.actionsUsed; ordinaryKey(state, key);
      assert.equal(state.actionsUsed, before + 1, 'every planned movement/button must really execute once');
      assert.equal(new Set(state.crates.map(crate => `${crate.col},${crate.row}`)).size, state.crates.length);
      assert.ok(state.crates.every(crate => cell(state, crate.col, crate.row).type === 'floor'));
      assert.ok(!state.crates.some(crate => crate.col === state.player.col && crate.row === state.player.row));
    }
    assert.equal(state.phase, 'won'); assert.equal(state.lostReason, null);
    assert.equal(state.matched, state.target); assert.ok(state.docks.every(dock => dock.matched && dock.occupiedBy === dock.id));
    assert.ok(state.crates.every(crate => crate.docked)); assert.deepEqual(state.crates.map(crate => crate.polarity), initialPoles);
    assert.equal(state.actionsUsed, route.length); assert.equal(state.blockedMoves, 0);
    assert.equal(state.actionsUsed, state.moveCount + state.flipCount + state.pulseCount);
    assert.ok(state.attractedMoves > 0 && state.repelledMoves > 0 && state.flipCount > 0);
    assert.ok(state.elapsed >= 30 && state.elapsed <= 90, 'defined 80-tick inspection cadence is a feasible full round');
    assert.equal(state.score, state.target * 300 + 500 + state.actionsRemaining * 10 + Math.floor(state.remaining) * 5);
  });
});

test('ordinary first-map mistakes can really send a crate into the marked scrap chute', () => {
  const state = model.create(17, 0);
  for (const key of 'RRURRRRDAB') ordinaryKey(state, key, 6);
  assert.equal(state.phase, 'lost'); assert.equal(state.lostReason, 'scrap');
  assert.deepEqual(position(state, 2), [10, 5]); assert.equal(cell(state, 10, 5).type, 'scrap');
  assert.equal(state.actionsUsed, 10); assert.equal(state.score, 0);
});

test('all actual layouts expire at 90 seconds and free wall bumps cannot extend the round', () => {
  for (let difficulty = 0; difficulty < 3; difficulty += 1) {
    const state = model.create(17, difficulty), originalCrates = clone(state.crates);
    ticks(state, 5399); assert.equal(state.phase, 'playing'); assert.equal(state.actionsUsed, 0);
    tick(state); assert.equal(state.phase, 'lost'); assert.equal(state.lostReason, 'timeout');
    assert.equal(state.elapsed, 90); assert.equal(state.remaining, 0); assert.deepEqual(state.crates, originalCrates);
  }
  const blocked = model.create(17, 0); ticks(blocked, 5400, { x: -1 });
  assert.equal(blocked.lostReason, 'timeout'); assert.equal(blocked.actionsUsed, 1);
  assert.ok(blocked.blockedMoves > 100); assert.equal(blocked.actionsRemaining, blocked.actionBudget - 1);
});
