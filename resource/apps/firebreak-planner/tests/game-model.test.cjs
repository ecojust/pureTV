const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60;
const copy = value => JSON.parse(JSON.stringify(value));
function advance(state, ticks, input = {}) { for (let i = 0; i < ticks; i++) Model.step(state, DT, input); return state; }
function cell(state, x, y = 0) { return state.cells[y * state.columns + x]; }
function invariant(s) {
  assert.equal(s.tick / 60, s.elapsed); assert.equal(s.remaining, Math.max(0, 90 - s.elapsed));
  assert.equal(s.ap.initial, s.ap.remaining + s.ap.spent); assert.equal(s.ap.spent, s.clearCount);
  assert.equal(s.clearReceipts.length, s.clearCount); assert.ok(s.clearReceipts.length <= s.ap.initial);
  for (const c of s.cells) { assert.ok(Number.isInteger(c.heat) && c.heat >= 0 && c.heat <= 5); assert.ok(Number.isInteger(c.fuelRemaining) && c.fuelRemaining >= 0 && c.fuelRemaining <= c.initialFuel); }
  assert.equal(s.fuel.remaining, s.cells.reduce((n, c) => n + c.fuelRemaining, 0));
  assert.equal(s.fuel.initial, s.fuel.remaining + s.fuel.burned + s.fuel.cleared); assert.equal(s.fuel.error, 0);
  assert.equal(s.forest.initial, s.forest.standing + s.forest.burning + s.forest.burnt + s.forest.cleared);
  assert.equal(s.forest.cleared, s.clearCount); assert.equal(s.villages.initial, s.villages.intact + s.villages.destroyed);
  assert.equal(s.score, s.phase === 'won' ? 1000 + 10 * s.forest.standing + 25 * s.ap.remaining : 0);
}

// Explicit synthetic boundary fixtures. They replace map, clock and forest floor
// to isolate one rule, and are never counted as ordinary gameplay or real wins.
function fixture(rows, { wind = 'E', fuel = 2, tick = 119, floor = 0, ap = 2 } = {}) {
  const s = Model.create(1, 0); s.columns = rows[0].length; s.rows = rows.length; s.authoredMap = rows.slice();
  s.cells = rows.flatMap((row, y) => [...row].map((token, x) => {
    const terrain = 'FX'.includes(token) ? 'forest' : token === 'V' ? 'village' : token === '~' ? 'wetland' : 'ground';
    const initialFuel = token === 'X' ? fuel : token === 'F' ? 3 : 0;
    return { id: 'C' + (y * s.columns + x), row: y, column: x, terrain, initialFuel, fuelRemaining: initialFuel,
      status: token === 'X' ? 'burning' : token === 'F' ? 'standing' : token === 'V' ? 'intact' : 'inert', heat: token === 'X' ? 5 : 0 };
  }));
  s.authoredIgnitions = s.cells.filter(c => c.status === 'burning').map(c => ({ x: c.column, y: c.row, fuel: c.initialFuel }));
  s.cursor = { column: 0, row: 0 }; s.weather = [{ from: 1, direction: wind }];
  s.tick = tick; s.elapsed = tick / 60; s.remaining = 90 - s.elapsed; s.fireStep = Math.floor(tick / 120);
  s.nextFireTick = (s.fireStep + 1) * 120; s.secondsToFireStep = (s.nextFireTick - tick) / 60; s.nextWind = wind;
  s.forest = { initial: s.cells.filter(c => c.terrain === 'forest').length, minimum: floor, numerator: 7, denominator: 10,
    standing: s.cells.filter(c => c.status === 'standing').length, burning: s.cells.filter(c => c.status === 'burning').length, burnt: 0, cleared: 0 };
  s.ap = { initial: ap, remaining: ap, spent: 0 };
  s.villages = { initial: s.cells.filter(c => c.terrain === 'village').length, intact: s.cells.filter(c => c.terrain === 'village').length, destroyed: 0 };
  const total = s.cells.reduce((n, c) => n + c.initialFuel, 0); s.fuel = { initial: total, remaining: total, burned: 0, cleared: 0, error: 0 };
  return s;
}

test('authored maps have detached exact counts, coarse fuel, AP and fixed weather', () => {
  const states = [0, 1, 2].map(level => Model.create(87, level));
  assert.deepEqual(states.map(s => [s.columns, s.rows, s.forest.initial, s.forest.minimum, s.forest.burning, s.villages.initial, s.ap.initial]),
    [[9, 7, 23, 17, 1, 1, 2], [9, 9, 29, 21, 1, 2, 3], [9, 9, 30, 21, 2, 2, 3]]);
  assert.deepEqual(states.map(s => s.cells.filter(c => c.status === 'burning').map(c => c.fuelRemaining)), [[16], [20], [12, 24]]);
  assert.deepEqual(states.map(s => s.weather.map(w => w.from)), [[1, 3, 7, 11], [1, 4, 7, 13], [1, 4, 7, 13]]);
  for (const s of states) invariant(s);
  const fresh = Model.create(87, 0); states[0].cells[0].heat = 4; states[0].weather[0].direction = 'S';
  assert.equal(fresh.cells[0].heat, 0); assert.equal(fresh.weather[0].direction, 'N');
});

test('ordinary untouched level uses exact 120-tick waves and inclusive weather changes', () => {
  const s = Model.create(87, 0); advance(s, 119); assert.equal(s.fireStep, 0); assert.equal(s.lastWave, null);
  advance(s, 1); assert.equal(s.fireStep, 1); assert.equal(s.lastWind, 'N');
  assert.deepEqual([cell(s, 3, 2).heat, cell(s, 2, 3).heat, cell(s, 3, 4).heat], [3, 2, 1]);
  advance(s, 120); assert.equal(cell(s, 3, 2).status, 'burning'); assert.equal(s.lastWind, 'N'); assert.equal(s.nextWind, 'W');
  advance(s, 120); assert.equal(s.lastWind, 'W'); assert.equal(cell(s, 2, 3).status, 'burning');
  assert.equal(cell(s, 3, 1).heat, 2); assert.equal(s.lastWave.fromTick, 359); assert.equal(s.lastWave.toTick, 360); invariant(s);
});

test('synthetic orthogonal target weights are downwind3 crosswind2 upwind1', () => {
  const s = fixture(['.F.', 'FXF', '.F.']); advance(s, 1);
  assert.deepEqual([cell(s, 1, 0).heat, cell(s, 2, 1).heat, cell(s, 1, 2).heat, cell(s, 0, 1).heat], [2, 3, 2, 1]);
  assert.equal(s.lastWave.contributions.length, 4); assert.equal(s.lastWave.fuelConsumed, 1); invariant(s);
});

test('synthetic last fuel contributes but a new fire cannot chain in its ignition wave', () => {
  const s = fixture(['XFF'], { fuel: 1 }); cell(s, 1).heat = 2; advance(s, 1);
  assert.deepEqual(s.cells.map(c => [c.status, c.heat, c.fuelRemaining]), [['burnt', 0, 0], ['burning', 5, 3], ['standing', 0, 3]]);
  assert.deepEqual(s.lastWave.oldBurningIds, ['C0']); assert.deepEqual(s.lastWave.ignitedIds, ['C1']); assert.deepEqual(s.lastWave.burntOutIds, ['C0']);
  advance(s, 120); assert.equal(cell(s, 2).heat, 3); assert.equal(cell(s, 1).fuelRemaining, 2); invariant(s);
});

test('synthetic multiple old sources add to persistent heat before one capped ignition', () => {
  const s = fixture(['XFX']); cell(s, 1).heat = 2; advance(s, 1);
  assert.equal(cell(s, 1).status, 'burning'); assert.equal(cell(s, 1).heat, 5); assert.equal(cell(s, 1).fuelRemaining, 3);
  assert.equal(s.lastWave.contributions.reduce((n, e) => n + e.amount, 0), 4);
  assert.equal(s.lastWave.changes.find(c => c.id === 'C1').addedHeat, 4); assert.deepEqual(s.lastWave.ignitedIds, ['C1']); invariant(s);
});

test('synthetic ground and wetland block transmission with no diagonal or jumping heat', () => {
  for (const row of ['X~F', 'X.F']) {
    const s = fixture([row, '.F.', '..V']); advance(s, 1);
    assert.equal(cell(s, 2).heat, 0); assert.equal(cell(s, 1, 1).heat, 0); assert.equal(cell(s, 2, 2).heat, 0);
    assert.deepEqual(s.lastWave.contributions, []); invariant(s);
  }
});

test('synthetic clear on a wave tick takes effect first with exact AP and discarded-fuel receipts', () => {
  const s = fixture(['XFF']); s.cursor.column = 1; cell(s, 1).heat = 4; advance(s, 1, { a: true });
  assert.deepEqual([cell(s, 1).status, cell(s, 1).heat, cell(s, 1).fuelRemaining], ['cleared', 0, 0]);
  assert.equal(cell(s, 2).heat, 0); assert.deepEqual(s.lastWave.contributions, []);
  assert.deepEqual([s.ap.remaining, s.ap.spent, s.fuel.cleared, s.fuel.burned], [1, 1, 3, 1]);
  assert.equal(s.lastOperation.tick, 120); assert.equal(s.lastOperation.before.heat, 4);
  assert.deepEqual(s.clearReceipts, [s.lastOperation]); assert.notEqual(s.clearReceipts[0], s.lastOperation);
  assert.deepEqual(s.events.map(e => e.type), ['command', 'fire-step']); assert.equal(s.events[0].commandId, 1); assert.equal(s.events[1].step, 1); invariant(s);
});

test('synthetic invalid clearing and exhausted AP never spend or fabricate a command', () => {
  for (const x of [0, 1, 2, 3]) {
    const s = fixture(['X.~VF'], { tick: 0 }); s.cursor.column = x; advance(s, 1, { a: true });
    assert.equal(s.blockedCommands, 1); assert.equal(s.lastRejected.reason, 'not-standing-forest'); assert.equal(s.commandCount, 0);
    assert.equal(s.ap.remaining, 2); assert.equal(s.fuel.cleared, 0); invariant(s);
  }
  const s = fixture(['XF'], { tick: 0, ap: 0 }); s.cursor.column = 1; advance(s, 1, { a: true });
  assert.equal(s.lastRejected.reason, 'no-ap'); assert.equal(s.forest.standing, 1); assert.equal(s.commandCount, 0); invariant(s);
});

test('synthetic held A clears once and rearmed direction plus A acts on the new cell', () => {
  const s = fixture(['XFFF'], { tick: 0 }); s.cursor.column = 1; advance(s, 5, { a: true });
  assert.equal(s.clearCount, 1); assert.equal(s.blockedCommands, 0); const first = copy(s.clearReceipts[0]);
  advance(s, 1); advance(s, 1, { x: 1, a: true });
  assert.equal(s.cursor.column, 2); assert.equal(s.clearCount, 2); assert.equal(s.ap.remaining, 0); assert.deepEqual(s.clearReceipts[0], first);
  advance(s, 1); advance(s, 1, { a: true }); assert.equal(s.lastRejected.reason, 'not-standing-forest'); invariant(s);
});

test('B view edge has priority over movement and A without changing cell physics or AP', () => {
  const s = Model.create(87, 0), cells = copy(s.cells), cursor = copy(s.cursor); advance(s, 1, { b: true, a: true, x: 1 });
  assert.deepEqual(s.cursor, cursor); advance(s, 4, { b: true, a: true });
  assert.equal(s.commandCount, 1); assert.equal(s.viewHeat, true); assert.deepEqual(s.cursor, cursor);
  assert.deepEqual(s.cells, cells); assert.equal(s.clearCount, 0); assert.equal(s.blockedCommands, 0);
  advance(s, 1); advance(s, 1, { b: true }); assert.equal(s.viewHeat, false); assert.equal(s.commandCount, 2); invariant(s);
});

test('navigation uses deadzone horizontal ties bounded grid and20/10tick held repeats', () => {
  const s = Model.create(87, 0); advance(s, 1, { x: .24, y: .24 }); assert.deepEqual(s.cursor, { column: 3, row: 3 });
  advance(s, 1, { x: .25, y: .25 }); assert.deepEqual(s.cursor, { column: 4, row: 3 });
  advance(s, 19, { x: 1 }); assert.equal(s.cursor.column, 4);
  advance(s, 1, { x: 1 }); assert.equal(s.cursor.column, 5);
  advance(s, 9, { x: 1 }); assert.equal(s.cursor.column, 5); advance(s, 1, { x: 1 }); assert.equal(s.cursor.column, 6);
  advance(s, 30, { x: 1 }); assert.equal(s.cursor.column, 8); assert.equal(s.commandCount, 0); invariant(s);
});

test('neutral direction on a B-priority tick resets repeat so the next direction is fresh', () => {
  const s = Model.create(87, 0); advance(s, 1, { x: 1 }); assert.equal(s.cursor.column, 4);
  advance(s, 1, { b: true }); advance(s, 1, { x: 1 }); assert.equal(s.cursor.column, 5); invariant(s);
});

test('synthetic cancellation drops partial-tick action and quarantines its held level until release', () => {
  const s = fixture(['XFF'], { tick: 0 }); s.cursor.column = 1;
  Model.step(s, DT / 2, { a: true, cancelEpoch: 0 }); assert.equal(s.tick, 0);
  Model.step(s, DT / 2, { a: true, x: 1, cancelled: true, cancelEpoch: 1 }); assert.equal(s.tick, 1); assert.equal(s.clearCount, 0);
  advance(s, 1, { a: true, cancelEpoch: 1 }); assert.equal(s.clearCount, 0); assert.equal(s.cursor.column, 1);
  advance(s, 1, { cancelEpoch: 1 }); advance(s, 1, { a: true, cancelEpoch: 1 }); assert.equal(s.clearCount, 1); invariant(s);
});

test('synthetic simultaneous terminal gates prioritize village then forest then extinction then timeout', () => {
  const village = fixture(['XVF'], { fuel: 1, tick: 5399, floor: 2 }); cell(village, 1).heat = 2; advance(village, 1);
  assert.equal(village.phase, 'lost'); assert.equal(village.lostReason, 'village'); assert.equal(village.forest.burning, 0);
  const forest = fixture(['XF'], { fuel: 1, tick: 5399, floor: 2 }); advance(forest, 1); assert.equal(forest.lostReason, 'forest');
  const won = fixture(['XF'], { fuel: 1, tick: 5399 }); advance(won, 1); assert.equal(won.phase, 'won'); assert.equal(won.tick, 5400);
  const timeout = fixture(['XF'], { fuel: 2, tick: 5399 }); advance(timeout, 1); assert.equal(timeout.lostReason, 'timeout'); assert.equal(timeout.forest.burning, 1);
  for (const s of [village, forest, won, timeout]) { assert.equal(s.events.at(-1).type, s.phase); invariant(s); }
});

test('synthetic terminal is fully frozen and fresh create restores authored state without retained view or cuts', () => {
  const s = fixture(['XF'], { fuel: 1 }); advance(s, 1); assert.equal(s.phase, 'won'); const final = copy(s);
  Model.step(s, 10, { x: 1, a: true, b: true, cancelEpoch: 4 }); assert.deepEqual(s, final);
  const fresh = Model.create(87, 0); assert.deepEqual(fresh, Model.create(87, 0)); assert.equal(fresh.viewHeat, false);
  assert.equal(fresh.fireStep, 0); assert.equal(fresh.lastWave, null); assert.deepEqual(fresh.clearReceipts, []); assert.equal(fresh.eventCount, 0); invariant(fresh);
});

test('clamped gaps and deterministic ordinary input remain bounded', () => {
  const s = Model.create(87, 0); Model.step(s, 999, {}); assert.equal(s.tick, 15);
  Model.step(s, -1, {}); Model.step(s, NaN, {}); assert.equal(s.tick, 15);
  const a = Model.create(87, 0), b = Model.create(87, 0);
  for (let tick = 0; tick < 900; tick++) {
    const input = { x: tick < 30 ? -1 : 0, b: tick % 20 === 0 };
    Model.step(a, DT, input); Model.step(b, DT, input);
    assert.ok(a.events.length <= 256 && a.clearReceipts.length <= a.ap.initial);
  }
  assert.deepEqual(a, b); invariant(a);
});

test('ordinary single cut lowers standing forest as well as AP while keeping denominator fixed', () => {
  const s = Model.create(87, 0); advance(s, 1, { y: -1, a: true });
  assert.equal(cell(s, 3, 2).status, 'cleared'); assert.equal(s.forest.initial, 23); assert.equal(s.forest.minimum, 17);
  assert.equal(s.forest.standing, 21); assert.equal(s.forest.cleared, 1); assert.equal(s.ap.remaining, 1);
  assert.equal(s.fuel.cleared, 3); assert.equal(s.lastOperation.cellId, 'C21'); invariant(s);
});
