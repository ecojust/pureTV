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
const inputFor = { N: { y: -1 }, E: { x: 1 }, S: { y: 1 }, W: { x: -1 } };
const tick = (s, input = {}) => Model.step(s, DT, input);
function ticks(s, count, input = {}) { for (let i = 0; i < count; i++) tick(s, input); return s; }
function tap(s, direction) { tick(s, inputFor[direction]); tick(s); return s; }
const point = c => ({ id: c.id, col: c.col, row: c.row, x: c.x, y: c.y });
function route(s) {
  return clone({ path: s.path, player: s.player, visited: s.visited, symbols: s.symbols, emissions: s.emissions,
    cells: s.cells, moves: s.moves, totalMoves: s.totalMoves, conditionHits: s.conditionHits, conditionSkips: s.conditionSkips });
}
function assertOccupancy(s) {
  assert.equal(s.moves, s.path.length - 1); assert.equal(s.visited.length, 25);
  assert.equal(new Set(s.path.map(p => p.cellId)).size, s.path.length);
  assert.equal(s.visited.filter(Boolean).length, s.path.length);
  s.cells.forEach(c => {
    const index = s.path.findIndex(p => p.cellId === c.id);
    assert.equal(s.visited[c.id], index >= 0); assert.equal(c.visited, index >= 0);
    assert.equal(c.visitIndex, index >= 0 ? index : null);
  });
  const end = s.path.at(-1);
  assert.deepEqual(s.player, { cellId: end.cellId, col: end.col, row: end.row, x: end.x, y: end.y, enteredFrom: end.enteredFrom });
  assert.deepEqual(s.emissions.map(e => e.symbol), s.symbols);
}

// Explicit public-board boundary fixtures, not solutions of authored puzzles.
// A real B tick rebuilds all route/occupancy views after changing visible facts.
function fixture({ start = 12, exit = 24, floors = null, walls = [], runes = {}, target = ['N'] } = {}) {
  const s = Model.create(71, 0);
  s.cells.forEach(c => {
    c.type = (floors ? floors.includes(c.id) : !walls.includes(c.id)) ? 'floor' : 'wall';
    c.role = c.id === start ? 'start' : c.id === exit ? 'exit' : null;
    c.rune = c.type === 'wall' ? null : clone(runes[c.id] || null);
  });
  s.start = point(s.cells[start]); s.exit = point(s.cells[exit]); s.target = target.slice();
  tick(s, { b: true }); Model.step(s, 0, {});
  return s;
}
const rune = (symbol, enterFrom = null) => ({ symbol, enterFrom });
function exitFixture({ symbols = ['N'], target = ['N'] } = {}) {
  const runes = Object.fromEntries(symbols.map((symbol, i) => [i + 1, rune(symbol)]));
  return fixture({ start: 0, exit: symbols.length, floors: Array.from({ length: symbols.length + 1 }, (_, i) => i), runes, target });
}
function reachExit(s) { while (s.routeStatus === 'drawing') tap(s, 'E'); return s; }

test('UMD exposes only create/step/60Hz and all three public boards begin with independent bounded resources', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['TICK_HZ', 'create', 'step']); assert.equal(Model.TICK_HZ, 60);
  const sandbox = {}; vm.runInNewContext(fs.readFileSync(modelPath, 'utf8'), sandbox);
  assert.deepEqual(clone(sandbox.PureModel.create(2, 1)), Model.create(2, 1));
  for (let d = 0; d < 3; d++) {
    const s = Model.create(2, d);
    assert.equal(s.level, d + 1); assert.equal(s.difficulty, d); assert.equal(s.phase, 'playing');
    assert.equal(s.cells.length, 25); assert.equal(s.target.length, [6, 7, 8][d]); assert.equal(s.maxMistakes, 3);
    assert.equal(s.timeLimit, 90); assert.equal(s.remaining, 90); assert.equal(s.tick, 0);
    assert.equal(s.routeStatus, 'drawing'); assert.equal(s.path.length, 1); assert.equal(s.path[0].cellId, s.start.id);
    assert.deepEqual(s.symbols, []); assert.deepEqual(s.emissions, []); assert.equal(s.score, 0);
    for (const c of s.cells) {
      assert.equal(c.id, c.row * 5 + c.col); assert.equal(c.x, 305 + (c.col + .5) * 70); assert.equal(c.y, 90 + (c.row + .5) * 70);
      if (c.type === 'wall') assert.equal(c.rune, null);
    }
    assertOccupancy(s);
  }
});

test('all four entry sides are opposite the movement direction and matched conditions emit the declared symbol', () => {
  for (const [direction, start, entry] of [['N', 17, 'S'], ['E', 11, 'W'], ['S', 7, 'N'], ['W', 13, 'E']]) {
    const s = fixture({ start, runes: { 12: rune('N', entry) } }); tick(s, inputFor[direction]);
    assert.equal(s.player.cellId, 12); assert.equal(s.player.enteredFrom, entry);
    assert.deepEqual(s.symbols, ['N']); assert.equal(s.path[1].emitted, 'N');
    assert.equal(s.conditionHits, 1); assert.equal(s.conditionSkips, 0);
    assert.deepEqual(s.emissions, [{ cellId: 12, symbol: 'N', enteredFrom: entry, pathIndex: 1 }]);
    assert.equal(s.lastMove.conditionalResult, 'active'); assertOccupancy(s);
  }
});

test('an unconditional rune emits once with real provenance and does not increment condition counters', () => {
  const s = fixture({ start: 11, runes: { 12: rune('W') } }); tick(s, { x: 1 });
  assert.deepEqual(s.symbols, ['W']); assert.equal(s.conditionHits, 0); assert.equal(s.conditionSkips, 0);
  assert.deepEqual(s.emissions, [{ cellId: 12, symbol: 'W', enteredFrom: 'W', pathIndex: 1 }]);
  assert.equal(s.lastMove.conditionalResult, null); assert.equal(s.lastMove.fromCellId, 11); assert.equal(s.lastMove.toCellId, 12);
  assert.equal(s.lastMove.expiresAt, s.lastMove.at + .6);
  tap(s, 'S'); tick(s, { y: -1 });
  assert.equal(s.lastAction.reason, 'visited'); assert.deepEqual(s.symbols, ['W']); assert.equal(s.emissions.length, 1);
  assertOccupancy(s);
});

test('a mismatched conditional entry emits nothing, remains visited, and cannot be retried from a different side', () => {
  const s = fixture({ start: 11, runes: { 12: rune('S', 'N') } }); tap(s, 'E');
  assert.deepEqual(s.symbols, []); assert.deepEqual(s.emissions, []); assert.equal(s.conditionHits, 0); assert.equal(s.conditionSkips, 1);
  assert.equal(s.path[1].emitted, null); assert.equal(s.lastMove.conditionalResult, 'skipped');
  tap(s, 'S'); tick(s, { y: -1 });
  assert.equal(s.player.cellId, 17); assert.equal(s.lastAction.reason, 'visited'); assert.equal(s.conditionSkips, 1);
  assert.equal(s.cells[12].visited, true); assert.equal(s.cells[12].visitIndex, 1); assertOccupancy(s);
});

test('a start rune never emits without entry, including initial and repeated B clears', () => {
  for (const condition of [null, 'W']) {
    const s = fixture({ runes: { 12: rune('E', condition) } });
    ticks(s, 10); assert.deepEqual(s.symbols, []); assert.equal(s.path[0].enteredFrom, null); assert.equal(s.path[0].emitted, null);
    tick(s, { b: true }); assert.deepEqual(s.symbols, []); assert.deepEqual(s.emissions, []);
    assert.equal(s.conditionHits, 0); assert.equal(s.conditionSkips, 0); assert.equal(s.player.enteredFrom, null);
  }
});

test('wall, outside and visited attempts only affect blocked feedback/time/cooldown, never route material or failures', () => {
  const wall = fixture({ walls: [13] }), outside = fixture({ start: 0 });
  const visited = fixture({ start: 11, runes: { 12: rune('N') } }); tap(visited, 'E');
  for (const [s, direction, reason] of [[wall, 'E', 'wall'], [outside, 'W', 'outside'], [visited, 'W', 'visited']]) {
    const before = route(s); const counters = [s.mistakes, s.submissions, s.clears, s.score]; const blocked = s.blockedMoves;
    tick(s, inputFor[direction]); assert.deepEqual(route(s), before); assert.equal(s.blockedMoves, blocked + 1);
    assert.deepEqual([s.mistakes, s.submissions, s.clears, s.score], counters); assert.equal(s.lastAction.reason, reason);
    assert.equal(s.lastAction.type, 'blocked'); assertOccupancy(s);
  }
});

test('occupancy never releases and the real symbol/provenance stacks retain all 24 possible entries', () => {
  const runes = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [i + 1, rune('N')]));
  const s = fixture({ start: 0, exit: 24, runes, target: ['N'] });
  for (const direction of 'EEEESWWW WSEEEE SWWW WSEEEE'.replaceAll(' ', '')) tap(s, direction);
  assert.equal(s.path.length, 25); assert.equal(s.moves, 24); assert.equal(s.symbols.length, 24); assert.equal(s.emissions.length, 24);
  assert.equal(s.visited.filter(Boolean).length, 25); assert.equal(s.prefixLength, 1); assert.equal(s.sequenceMatches, false);
  assert.equal(s.routeStatus, 'at-exit'); assert.equal(s.mistakes, 0); assertOccupancy(s);
  tick(s, { a: true }); assert.equal(s.rejection.reason, 'wrong-sequence'); assert.equal(s.rejection.symbols.length, 24);
});

test('held movement acts immediately, waits 20 ticks for the first repeat, then repeats every 10', () => {
  const s = fixture({ start: 10 }); tick(s, { x: 1 }); assert.equal(s.player.cellId, 11);
  ticks(s, 19, { x: 1 }); assert.equal(s.player.cellId, 11);
  tick(s, { x: 1 }); assert.equal(s.player.cellId, 12);
  ticks(s, 9, { x: 1 }); assert.equal(s.player.cellId, 12);
  tick(s, { x: 1 }); assert.equal(s.player.cellId, 13);
  ticks(s, 10, { x: 1 }); assert.equal(s.player.cellId, 14); assert.equal(s.totalMoves, 4);
});

test('blocked first attempts follow the same 20/10 cadence without spending mistakes', () => {
  const s = fixture({ start: 0 }); tick(s, { x: -1 }); assert.equal(s.blockedMoves, 1);
  ticks(s, 19, { x: -1 }); assert.equal(s.blockedMoves, 1);
  tick(s, { x: -1 }); assert.equal(s.blockedMoves, 2);
  ticks(s, 9, { x: -1 }); assert.equal(s.blockedMoves, 2);
  tick(s, { x: -1 }); assert.equal(s.blockedMoves, 3);
  assert.equal(s.path.length, 1); assert.equal(s.mistakes, 0); assert.equal(s.score, 0);
});

test('neutral release and direction change each restart immediate movement and the initial repeat delay', () => {
  const s = fixture(); tick(s, { x: 1 }); ticks(s, 3, { x: 1 }); assert.equal(s.player.cellId, 13);
  tick(s); tick(s, { x: 1 }); assert.equal(s.player.cellId, 14);
  tick(s, { y: -1 }); assert.equal(s.player.cellId, 9);
  ticks(s, 19, { y: -1 }); assert.equal(s.player.cellId, 9);
  tick(s, { y: -1 }); assert.equal(s.player.cellId, 4);
});

test('direction uses the larger magnitude, horizontal ties, and the inclusive .25 deadzone boundary', () => {
  for (const [input, destination] of [[{ x: .5, y: -.5 }, 13], [{ x: -.5, y: .5 }, 11],
    [{ x: .5, y: -.6 }, 7], [{ x: -.1, y: .7 }, 17], [{ x: .249, y: -.249 }, 12], [{ x: .25 }, 13]]) {
    const s = fixture(); tick(s, input); assert.equal(s.player.cellId, destination);
  }
  const s = fixture(); assert.deepEqual(s.availableMoves, ['N', 'E', 'S', 'W']);
  tap(s, 'E'); assert.deepEqual(s.availableMoves, ['N', 'E', 'S']);
});

test('fractional-step edges are buffered once, and a short A tap suppresses movement only on its action tick', () => {
  const s = fixture(); const at = s.tick;
  Model.step(s, DT / 2, { a: true }); assert.equal(s.tick, at); assert.equal(s.lastAction.type, 'clear');
  Model.step(s, DT / 2, { x: 1 }); assert.equal(s.lastAction.type, 'submit-blocked'); assert.equal(s.player.cellId, 12);
  tick(s, { x: 1 }); assert.equal(s.player.cellId, 13); assert.equal(s.submissions, 0);
  const clears = s.clears; Model.step(s, DT / 2, { bPressed: true }); assert.equal(s.clears, clears);
  Model.step(s, DT / 2, {}); assert.equal(s.clears, clears + 1); assert.equal(s.player.cellId, 12);
  ticks(s, 3); assert.equal(s.clears, clears + 1);
});

test('zero-dt edge samples cache B over A without executing or leaving a discarded A for a later tick', () => {
  const s = fixture(); tap(s, 'E'); const at = s.tick, clears = s.clears;
  Model.step(s, 0, { aPressed: true }); Model.step(s, 0, { bPressed: true });
  assert.equal(s.tick, at); assert.equal(s.player.cellId, 13); assert.equal(s.clears, clears);
  tick(s, { x: 1 }); assert.equal(s.clears, clears + 1); assert.equal(s.player.cellId, 12); assert.equal(s.lastAction.type, 'clear');
  tick(s, { x: 1 }); assert.equal(s.player.cellId, 13); assert.equal(s.lastAction.type, 'move'); assert.equal(s.submissions, 0);
});

test('B beats A and movement, A beats movement, and held buttons do not repeat their actions', () => {
  const s = fixture({ runes: { 13: rune('N') } }); tap(s, 'E'); const clears = s.clears;
  tick(s, { b: true, a: true, x: 1 }); assert.equal(s.player.cellId, 12); assert.equal(s.clears, clears + 1); assert.deepEqual(s.symbols, []);
  tick(s, { b: true, a: true, x: 1 }); assert.equal(s.player.cellId, 13); assert.equal(s.clears, clears + 1);
  tick(s); tick(s, { a: true, y: 1 }); assert.equal(s.player.cellId, 13); assert.equal(s.lastAction.type, 'submit-blocked');
  tick(s, { a: true, y: 1 }); assert.equal(s.player.cellId, 18); assert.equal(s.submissions, 0);
  const atExit = reachExit(exitFixture()); tick(atExit, { a: true, b: true, x: 1 });
  assert.equal(atExit.phase, 'playing'); assert.equal(atExit.player.cellId, 0); assert.equal(atExit.submissions, 0);
});

test('priority is per fixed tick: a .25-second B/A/direction sample matches fifteen tick-sized samples', () => {
  const combined = fixture(), split = clone(combined); const clears = combined.clears;
  Model.step(combined, .25, { b: true, aPressed: true, x: 1 });
  tick(split, { b: true, aPressed: true, x: 1 }); ticks(split, 14, { b: true, x: 1 });
  assert.equal(combined.clears, clears + 1); assert.equal(combined.player.cellId, 13); assert.equal(combined.totalMoves, 1);
  assert.deepEqual(combined.events.map(e => e.type), ['clear', 'move']);
  const { events: ea, _accumulator: ra, ...a } = combined, { events: eb, _accumulator: rb, ...b } = split;
  assert.ok(Math.abs(ra - rb) < 1e-12); assert.deepEqual(a, b);
  const explanatory = fixture(); Model.step(explanatory, .25, { a: true, x: 1 });
  assert.deepEqual(explanatory.events.map(e => e.type), ['submit-blocked', 'move']); assert.equal(explanatory.totalMoves, 1);
});

test('cancel epochs establish a baseline, then neutralize actions, clear pending edges and reset repetition', () => {
  const initial = fixture(); tick(initial, { cancelEpoch: 3, x: 1 }); assert.equal(initial.player.cellId, 13);
  const s = fixture(); tick(s, { cancelEpoch: 2, x: 1 }); const before = route(s), clears = s.clears;
  tick(s, { cancelEpoch: 3, x: 1, a: true, b: true }); assert.deepEqual(route(s), before); assert.equal(s.clears, clears);
  ticks(s, 5, { cancelled: true, x: 1, a: true, b: true, aPressed: true, bPressed: true });
  assert.deepEqual(route(s), before); assert.equal(s.clears, clears);
  tick(s, { x: 1, a: true, b: true }); assert.equal(s.player.cellId, 14, 'direction can restart, continued buttons are not new edges');
  tick(s); tick(s, { b: true }); assert.equal(s.player.cellId, 12); assert.equal(s.clears, clears + 1);
  const pending = fixture(); Model.step(pending, DT / 2, { aPressed: true, bPressed: true });
  const oldClears = pending.clears; Model.step(pending, DT / 2, { cancelled: true }); tick(pending, { x: 1 });
  assert.equal(pending.clears, oldClears); assert.equal(pending.player.cellId, 13); assert.equal(pending.lastAction.type, 'move');
});

test('exact sequence at the exit needs an explicit A submission and awards the declared bonus once', () => {
  const s = reachExit(exitFixture()); assert.equal(s.routeStatus, 'at-exit'); assert.equal(s.phase, 'playing');
  assert.equal(s.sequenceMatches, true); assert.equal(s.prefixLength, 1); assert.equal(s.score, 100); assert.equal(s.submissions, 0);
  ticks(s, 30); assert.equal(s.phase, 'playing'); assert.equal(s.mistakes, 0);
  tick(s, { a: true }); assert.equal(s.phase, 'won'); assert.equal(s.submissions, 1); assert.equal(s.mistakes, 0);
  assert.equal(s.score, 100 + 1000 + Math.floor(s.remaining) * 5 + 300); assert.deepEqual(s.events.map(e => e.type), ['submit', 'won']);
  assert.deepEqual(s.availableMoves, []);
});

test('incomplete, extra and reordered exit sequences reject even if a prefix or the same set of symbols matches', () => {
  for (const [symbols, target] of [[['N'], ['N', 'E']], [['N', 'S'], ['N']], [['S', 'N'], ['N', 'S']]]) {
    const s = reachExit(exitFixture({ symbols, target }));
    assert.equal(s.phase, 'playing'); assert.equal(s.routeStatus, 'at-exit'); assert.equal(s.mistakes, 0); assert.equal(s.sequenceMatches, false);
    tick(s, { a: true }); assert.equal(s.phase, 'playing'); assert.equal(s.routeStatus, 'rejected');
    assert.equal(s.rejection.reason, 'wrong-sequence'); assert.deepEqual(s.rejection.symbols, symbols);
    assert.equal(s.submissions, 1); assert.equal(s.mistakes, 1); assert.equal(s.score, s.prefixLength * 100);
  }
});

test('exit arrival locks movement but is never rejected merely for having no unvisited neighbor', () => {
  const s = reachExit(exitFixture({ symbols: ['S'], target: ['N'] })); const before = route(s), blocked = s.blockedMoves;
  for (const direction of ['N', 'E', 'S', 'W']) ticks(s, 25, inputFor[direction]);
  assert.deepEqual(route(s), before); assert.equal(s.blockedMoves, blocked); assert.equal(s.mistakes, 0);
  assert.equal(s.routeStatus, 'at-exit'); assert.deepEqual(s.availableMoves, []); assert.equal(s.phase, 'playing');
});

test('only a non-exit endpoint with no unvisited adjacent floor is a dead end, including an isolated start', () => {
  const s = fixture({ start: 0, exit: 24, floors: [0, 1, 24] }); tick(s, { x: 1 });
  assert.equal(s.player.cellId, 1); assert.equal(s.routeStatus, 'rejected'); assert.equal(s.rejection.reason, 'dead-end');
  assert.deepEqual(s.rejection.path, [0, 1]); assert.equal(s.mistakes, 1); assert.equal(s.submissions, 0);
  const isolated = fixture({ start: 0, exit: 24, floors: [0, 24] });
  assert.equal(isolated.routeStatus, 'drawing'); tick(isolated); assert.equal(isolated.rejection.reason, 'dead-end');
  assert.deepEqual(isolated.rejection.path, [0]);
});

test('wrong prefixes remain walkable and do not fail before a true dead end or explicit exit submission', () => {
  const s = fixture({ start: 0, runes: { 1: rune('S') }, target: ['N'] }); tap(s, 'E');
  assert.equal(s.prefixLength, 0); assert.equal(s.sequenceMatches, false); assert.equal(s.routeStatus, 'drawing');
  assert.deepEqual(s.availableMoves, ['E', 'S']); assert.equal(s.mistakes, 0);
  tap(s, 'S'); assert.equal(s.player.cellId, 6); assert.equal(s.moves, 2); assert.equal(s.mistakes, 0);
  tick(s, { a: true }); assert.equal(s.lastAction.type, 'submit-blocked'); assert.equal(s.submissions, 0); assert.equal(s.mistakes, 0);
});

test('a rejected route charges once and ignores held or fresh A and directions until a real B clear', () => {
  const s = reachExit(exitFixture({ symbols: ['S'], target: ['N'] })); tick(s, { a: true });
  const before = route(s), record = clone(s.rejection); const at = s.elapsed;
  ticks(s, 50, { a: true, x: -1 });
  for (let i = 0; i < 3; i++) tick(s, { aPressed: true, y: 1 });
  assert.deepEqual(route(s), before); assert.deepEqual(s.rejection, record); assert.equal(s.mistakes, 1); assert.equal(s.submissions, 1);
  assert.ok(s.elapsed > at); assert.equal(s.lastMove, null, 'render feedback expires during inspection');
  tick(s, { b: true }); assert.equal(s.routeStatus, 'drawing'); assert.equal(s.rejection, null); assert.equal(s.mistakes, 1);
  assert.deepEqual(s.rejections, [record]);
});

test('B clears full geometry, occupancy, provenance and current conditional counts while retaining total counters', () => {
  const s = fixture({ start: 0, runes: { 1: rune('N', 'W'), 2: rune('E', 'N'), 7: rune('S') }, target: ['N', 'S'] });
  tap(s, 'E'); tap(s, 'E'); tap(s, 'S'); tick(s, { y: -1 });
  assert.equal(s.conditionHits, 1); assert.equal(s.conditionSkips, 1); assert.deepEqual(s.symbols, ['N', 'S']);
  assert.equal(s.score, 200); assert.equal(s.blockedMoves, 1);
  const totals = [s.totalMoves, s.blockedMoves, s.submissions], clears = s.clears, at = s.elapsed;
  tick(s, { b: true }); assert.equal(s.path.length, 1); assert.equal(s.path[0].cellId, 0); assert.equal(s.player.enteredFrom, null);
  assert.deepEqual(s.symbols, []); assert.deepEqual(s.emissions, []); assert.equal(s.conditionHits, 0); assert.equal(s.conditionSkips, 0);
  assert.equal(s.moves, 0); assert.equal(s.prefixLength, 0); assert.equal(s.score, 0); assert.equal(s.lastMove, null);
  assert.deepEqual([s.totalMoves, s.blockedMoves, s.submissions], totals); assert.equal(s.clears, clears + 1); assert.ok(s.elapsed > at);
  assert.deepEqual(s.availableMoves, ['E', 'S']); assertOccupancy(s);
  ticks(s, 40, { b: true }); assert.equal(s.clears, clears + 1, 'held B does not clear repeatedly');
});

test('rejection records remain independent snapshots across clears and later routes, with no time or mistake refund', () => {
  const s = reachExit(exitFixture({ symbols: ['S'], target: ['N'] })); tick(s, { a: true });
  const first = clone(s.rejections[0]); const at = s.elapsed, totalMoves = s.totalMoves;
  tick(s, { b: true }); tick(s); assert.equal(s.mistakes, 1); assert.deepEqual(s.rejections, [first]);
  assert.ok(s.elapsed > at); assert.equal(s.totalMoves, totalMoves); assert.equal(s.rejection, null);
  tap(s, 'E'); assert.deepEqual(s.rejections, [first]); tick(s, { a: true });
  assert.equal(s.mistakes, 2); assert.equal(s.rejections.length, 2); assert.deepEqual(s.rejections[0], first);
  assert.notStrictEqual(s.rejections[0].symbols, s.symbols); assert.notStrictEqual(s.rejections[0].path, s.rejections[1].path);
  assert.equal(s.rejections[1].attempt, 2); assert.ok(s.rejections[1].at > first.at);
});

test('the third distinct rejection loses permanently and B cannot repair a terminal round', () => {
  const s = exitFixture({ symbols: ['S'], target: ['N'] });
  for (let attempt = 1; attempt <= 3; attempt++) {
    reachExit(s); tick(s, { a: true }); assert.equal(s.mistakes, attempt); assert.equal(s.rejections.length, attempt);
    if (attempt < 3) { tick(s, { b: true }); tick(s); }
  }
  assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'mistakes'); assert.equal(s.submissions, 3); assert.deepEqual(s.availableMoves, []);
  const frozen = clone(s); tick(s, { b: true, aPressed: true, x: 1 }); assert.deepEqual(s, frozen);
});

test('clearing and recollecting a prefix cannot farm score; empty or blocked moves add no points', () => {
  const s = fixture({ start: 0, runes: { 1: rune('N') }, target: ['N', 'E'] }); const clears = s.clears;
  for (let i = 0; i < 3; i++) {
    tap(s, 'E'); assert.equal(s.score, 100); tap(s, 'S'); assert.equal(s.score, 100);
    tick(s, { y: -1 }); assert.equal(s.score, 100); tick(s, { b: true }); tick(s); assert.equal(s.score, 0);
  }
  assert.equal(s.totalMoves, 6); assert.equal(s.blockedMoves, 3); assert.equal(s.clears, clears + 3); assert.equal(s.mistakes, 0);
});

test('deadline precedes A submission, B clearing and movement on the expiry tick', () => {
  for (const action of ['A', 'B', 'move']) {
    const s = action === 'A' ? reachExit(exitFixture()) : fixture({ runes: { 13: rune('N') } });
    if (action === 'B') tap(s, 'E');
    const before = route(s), counters = [s.submissions, s.clears, s.mistakes]; s.timeLimit = (s.tick + 1) / 60;
    tick(s, action === 'A' ? { a: true } : action === 'B' ? { b: true } : { x: 1 });
    assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'timeout'); assert.equal(s.remaining, 0);
    assert.deepEqual(route(s), before); assert.deepEqual([s.submissions, s.clears, s.mistakes], counters);
    assert.deepEqual(s.events.map(e => e.type), ['lost']);
  }
  const beforeDeadline = reachExit(exitFixture()); beforeDeadline.timeLimit = (beforeDeadline.tick + 2) / 60;
  tick(beforeDeadline, { a: true }); assert.equal(beforeDeadline.phase, 'won');
});

test('terminal states freeze timers, events and transients; retries and JSON continuations share no mutable state', () => {
  const won = reachExit(exitFixture()); tick(won, { a: true });
  const lost = fixture(); lost.timeLimit = (lost.tick + 1) / 60; tick(lost);
  for (const s of [won, lost]) {
    const frozen = clone(s);
    for (const dt of [0, DT, .25, 100, NaN]) Model.step(s, dt, { aPressed: true, bPressed: true, x: 1, cancelEpoch: 100 });
    assert.deepEqual(s, frozen);
  }
  const active = fixture({ start: 10 }); tick(active, { x: 1 }); const restored = clone(active);
  ticks(active, 31, { x: 1 }); ticks(restored, 31, { x: 1 }); assert.deepEqual(restored, active);
  const original = Model.create(4, 1), changed = Model.create(4, 1);
  tick(changed, inputFor[changed.availableMoves[0]]); tick(changed, { b: true });
  const retry = Model.create(4, 1); assert.deepEqual(retry, original);
  for (const field of ['cells', 'path', 'visited', 'target', 'symbols', 'emissions', 'rejections']) assert.notStrictEqual(retry[field], changed[field]);
  assert.notStrictEqual(retry.cells.find(c => c.rune).rune, changed.cells.find(c => c.rune).rune);
});

test('invalid dt and numeric input are bounded, and event/route resources stay within board limits', () => {
  const s = fixture(); const at = s.tick;
  for (const dt of [NaN, Infinity, -Infinity, -1, '1', undefined]) Model.step(s, dt, {});
  assert.equal(s.tick, at); tick(s, { x: NaN, y: Infinity }); assert.equal(s.player.cellId, 12);
  tick(s, { x: 1e30 }); assert.equal(s.player.cellId, 13);
  const oldTick = s.tick; Model.step(s, 100, {}); assert.equal(s.tick, oldTick + 15);
  assert.equal(Model.create(NaN, NaN).seed, 1); assert.equal(Model.create(1, -100).level, 1);
  assert.equal(Model.create(1, 100).level, 3); assert.equal(Model.create(1, 1.9).level, 2);
  assert.ok(s.events.length <= 32); assert.ok(s.path.length <= 25); assert.ok(s.symbols.length <= 24); assert.ok(s.rejections.length <= 3);
  function finiteTree(value) { if (typeof value === 'number') assert.ok(Number.isFinite(value)); else if (value && typeof value === 'object') Object.values(value).forEach(finiteTree); }
  finiteTree(s);
});

// These authored-puzzle demonstrations use only public snapshots and ordinary
// keys: one defined 60 Hz scenario with observations every five ticks. They
// include an actual rejected submission and B recovery, not state fixtures or
// an assertion that every possible input cadence must win.
function publicSnapshot(s) {
  return { phase: s.phase, paused: false,
    model: clone(Object.fromEntries(Object.entries(s).filter(([key]) => !key.startsWith('_')))) };
}
for (let difficulty = 0; difficulty < 3; difficulty++) {
  test(`authored puzzle ${difficulty + 1}: public search, wrong submission, B recovery and exact ordinary-input win`, async () => {
    const automation = await import('./automation.mjs');
    const pilot = automation.createPilot(), s = Model.create(1, difficulty);
    const initial = publicSnapshot(s), trace = [];
    let held = [], previousA = false, previousB = false, firstRejection = null, clearSnapshot = null;
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
      assertOccupancy(s);
      if (s.rejections.length) {
        if (!firstRejection) firstRejection = clone(s.rejections[0]);
        else assert.deepEqual(s.rejections[0], firstRejection, 'actual rejection evidence survives later actions and clearing');
      }
      if (s.events.some(event => event.type === 'clear')) clearSnapshot = publicSnapshot(s);
      assert.ok(s.mistakes <= 1, 'this defined demonstration makes exactly one deliberate wrong submission');
    }
    const after = publicSnapshot(s); trace.push({ state: after });
    automation.assertProgress({ after, trace, initial }, assert);
    assert.equal(s.mistakes, 1); assert.equal(s.clears, 1); assert.equal(s.submissions, 2);
    assert.equal(firstRejection.reason, 'wrong-sequence'); assert.equal(firstRejection.path.at(-1), s.exit.id);
    assert.notDeepEqual(firstRejection.symbols, s.target);
    assert.ok(clearSnapshot); assert.equal(clearSnapshot.model.path.length, 1);
    assert.equal(clearSnapshot.model.player.cellId, s.start.id); assert.deepEqual(clearSnapshot.model.symbols, []);
    assert.deepEqual(clearSnapshot.model.emissions, []); assert.equal(clearSnapshot.model.conditionHits, 0);
    assert.equal(clearSnapshot.model.conditionSkips, 0); assert.equal(clearSnapshot.model.mistakes, 1);
    assert.equal(clearSnapshot.model.score, 0); assert.ok(clearSnapshot.model.elapsed > firstRejection.at);
    const rejected = trace.filter(item => item.state.model.routeStatus === 'rejected');
    assert.ok(rejected.at(-1).state.model.elapsed - rejected[0].state.model.elapsed >= 4.2,
      'the real rejected route remains observable before B');
    automation.assertRetry({ after: publicSnapshot(Model.create(1, difficulty)), initial }, assert);
    const terminal = clone(s); Model.step(s, DT, { b: true, x: 1 }); assert.deepEqual(s, terminal);
  });
}
