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
function ticks(s, n, input = {}) { for (let i = 0; i < n; i++) tick(s, input); return s; }
function pressA(s) { tick(s, { a: true }); tick(s); return s; }
function pressB(s) { tick(s, { b: true }); tick(s); return s; }
function focus(s, id) {
  assert.equal(s.mode, 'probe');
  while (s.cursor.col !== id % 4) { tick(s, { x: Math.sign(id % 4 - s.cursor.col) }); tick(s); }
  while (s.cursor.row !== Math.floor(id / 4)) { tick(s, { y: Math.sign(Math.floor(id / 4) - s.cursor.row) }); tick(s); }
}
function neighbors(id) {
  return [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => [id % 4 + dx, Math.floor(id / 4) + dy])
    .filter(([x, y]) => x >= 0 && x < 4 && y >= 0 && y < 4).map(([x, y]) => y * 4 + x);
}
function walk(s, ids) {
  assert.equal(s.mode, 'route'); assert.equal(s.path.at(-1).cellId, ids[0]);
  for (let i = 1; i < ids.length; i++) {
    const from = s.path.at(-1).cellId, to = ids[i];
    assert.ok(neighbors(from).includes(to));
    tick(s, { x: to % 4 - from % 4, y: Math.floor(to / 4) - Math.floor(from / 4) }); tick(s);
  }
}
function exhaust(s) {
  assert.equal(s.mode, 'probe');
  while (s.probesRemaining > 0) { focus(s, s.cells.find(c => c.knowledge === 'unknown').id); pressA(s); }
  return s;
}
function shape(s) {
  return clone({ cells: s.cells, mode: s.mode, probeCursorId: s.probeCursorId, selectedId: s.selectedId,
    cursor: s.cursor, path: s.path, visited: s.visited, pathEdges: s.pathEdges,
    probesUsed: s.probesUsed, probesRemaining: s.probesRemaining, revealedCount: s.revealedCount,
    probeLog: s.probeLog, score: s.score });
}
function audit(s) {
  assert.equal(s.visited.length, 16); assert.equal(s.pathEdges, s.path.length - 1);
  assert.equal(s.probesRemaining, s.probeBudget - s.probesUsed);
  assert.equal(s.probeLog.length, s.probesUsed); assert.equal(s.revealedCount, s.cells.filter(c => c.knowledge !== 'unknown').length);
  assert.equal(s.cells.filter(c => c.probed).length, s.probesUsed);
  assert.equal(s.revealedCount, s.probesUsed + 2);
  s.visited.forEach((visited, id) => assert.equal(visited, s.path.some(p => p.cellId === id)));
  assert.deepEqual(s.probeLog.map(p => p.cellId).sort((a, b) => a - b), s.cells.filter(c => c.probed).map(c => c.id));
  assert.ok(s.probeLog.every(p => ['open', 'wall'].includes(p.result)));
}

// Oracle construction uses ONLY ordinary paid probes on fresh original states.
// It is a rule-test reconstruction across retries, not a claim of solving one
// round within its probe budget. No authored-layout or reference-route file is read.
const observations = new Map();
function observedMap(difficulty = 0) {
  if (observations.has(difficulty)) return observations.get(difficulty);
  const base = Model.create(1, difficulty), map = [];
  for (const c of base.cells) {
    if (c.knowledge !== 'unknown') { map[c.id] = c.knowledge; continue; }
    const s = Model.create(1, difficulty); focus(s, c.id); pressA(s);
    assert.equal(s.probesUsed, 1); map[c.id] = s.cells[c.id].knowledge;
  }
  observations.set(difficulty, map); return map;
}
function findRoute(start, end, length, allowed = () => true, accept = () => true) {
  function visit(route, used) {
    const last = route.at(-1), remaining = length - route.length + 1;
    const distance = Math.abs(last % 4 - end % 4) + Math.abs(Math.floor(last / 4) - Math.floor(end / 4));
    if (distance > remaining || (remaining - distance) % 2) return null;
    if (!remaining) return last === end && accept(route) ? route : null;
    for (const next of neighbors(last)) {
      if (used.has(next) || !allowed(next)) continue;
      const found = visit([...route, next], new Set([...used, next])); if (found) return found;
    }
    return null;
  }
  return visit([start], new Set([start]));
}
function anyPath(start, end, avoid) {
  const queue = [[start]], seen = new Set([start]);
  for (const route of queue) {
    if (route.at(-1) === end) return route;
    for (const next of neighbors(route.at(-1))) if (next !== avoid && !seen.has(next)) { seen.add(next); queue.push([...route, next]); }
  }
  throw Error('public grid path not found');
}
function wallPath() {
  const s = Model.create(), wall = observedMap().findIndex(result => result === 'wall');
  return anyPath(s.entry.id, wall, s.exit.id);
}
// Malformed route/knowledge fixtures alter public fields on the ORIGINAL state.
function setPath(s, ids) {
  s.mode = 'route';
  s.path = ids.map(id => id === null ? null : s.cells[id]
    ? { cellId: id, col: s.cells[id].col, row: s.cells[id].row, x: s.cells[id].x, y: s.cells[id].y }
    : { cellId: id });
}

test('UMD API exposes only original-state operations and each board has free endpoints and public edge-distance clues', () => {
  assert.deepEqual(Object.keys(Model).sort(), ['TICK_HZ', 'create', 'step']); assert.equal(Model.TICK_HZ, 60);
  const sandbox = {}; vm.runInNewContext(fs.readFileSync(modelPath, 'utf8'), sandbox);
  assert.deepEqual(clone(sandbox.PureModel.create(7, 1)), Model.create(7, 1));
  let detour = false;
  for (let d = 0; d < 3; d++) {
    const s = Model.create(7, d); assert.equal(s.level, d + 1); assert.equal(s.probeBudget, [3, 4, 5][d]);
    assert.equal(s.mode, 'probe'); assert.equal(s.phase, 'playing'); assert.equal(s.timeLimit, 90); assert.equal(s.remaining, 90);
    assert.equal(s.pathEdges, 0); assert.equal(s.path.length, 1); assert.equal(s.path[0].cellId, s.entry.id);
    assert.equal(s.revealedCount, 2); assert.equal(s.probeLog.length, 0);
    for (const c of s.cells) {
      assert.equal(c.id, c.row * 4 + c.col); assert.equal(c.x, 110 + (c.col + .5) * 84); assert.equal(c.y, 106 + (c.row + .5) * 84);
      assert.equal(c.knowledge, c.role ? 'open' : 'unknown'); assert.equal(c.probed, false);
    }
    const manhattan = Math.abs(s.entry.col - s.exit.col) + Math.abs(s.entry.row - s.exit.row);
    detour ||= s.requiredDistance > manhattan; audit(s);
  }
  assert.equal(detour, true, 'at least one distance clue cannot be replaced by Manhattan distance');
});

test('public snapshots contain no truth, hidden cell fields, symbols or nonenumerable payloads', () => {
  const s = Model.create();
  const inputKeys = ['_accumulator', '_lastA', '_lastB', '_pendingA', '_pendingB', '_heldDirection', '_nextMoveTick', '_cancelEpoch'];
  assert.deepEqual(Object.keys(s).filter(k => k.startsWith('_')).sort(), inputKeys.sort());
  assert.deepEqual(Object.getOwnPropertyNames(s).sort(), Object.keys(s).sort()); assert.deepEqual(Object.getOwnPropertySymbols(s), []);
  const cellKeys = ['id', 'col', 'row', 'x', 'y', 'role', 'knowledge', 'probed'];
  for (const c of s.cells) assert.deepEqual(Reflect.ownKeys(c).sort(), cellKeys.slice().sort());
  function publicTree(value) {
    if (!value || typeof value !== 'object') return;
    for (const key of Reflect.ownKeys(value)) {
      assert.equal(typeof key, 'string'); assert.ok(!/wallMask|truth|solution|reference|answer|safePath/i.test(key), key);
      if (!(Array.isArray(value) && key === 'length')) assert.equal(Object.getOwnPropertyDescriptor(value, key).enumerable, true);
      publicTree(value[key]);
    }
  }
  publicTree(s); focus(s, 5); pressA(s); pressB(s); tick(s, { x: 1 }); publicTree(s);
  const snapshot = JSON.parse(JSON.stringify(s)); assert.deepEqual(snapshot, s); assert.equal(snapshot.cells.filter(c => c.knowledge === 'unknown').length, 13);
});

test('JSON copies, foreign model states and arbitrary objects are rejected with the same generic error', () => {
  const s = Model.create(); const sandbox = {}; vm.runInNewContext(fs.readFileSync(modelPath, 'utf8'), sandbox);
  for (const fake of [clone(s), sandbox.PureModel.create(), {}, null]) {
    assert.throws(() => Model.step(fake, DT, { a: true }), { name: 'TypeError', message: 'Model state must be an original create() result' });
  }
  assert.doesNotThrow(() => tick(s)); assert.equal(s.tick, 1);
});

test('ordinary probing spends once, reveals only the selected cell and records its actual result', () => {
  const s = Model.create(); focus(s, 5); const before = clone(s.cells); tick(s, { a: true });
  assert.equal(s.probesUsed, 1); assert.equal(s.probesRemaining, 2); assert.equal(s.probeAttempts, 1);
  assert.ok(['open', 'wall'].includes(s.cells[5].knowledge)); assert.equal(s.cells[5].probed, true);
  s.cells.forEach((c, id) => { if (id !== 5) assert.deepEqual(c, before[id]); });
  assert.deepEqual(s.probeLog, [{ cellId: 5, result: s.cells[5].knowledge, at: s.elapsed, tick: s.tick }]);
  assert.equal(s.lastProbe.charged, true); assert.equal(s.lastProbe.reason, 'revealed'); assert.equal(s.score, 40); audit(s);
  ticks(s, 40, { a: true }); assert.equal(s.probesUsed, 1); assert.equal(s.probeAttempts, 1); assert.equal(s.lastProbe, null);
});

test('known probes are free both before and after exhaustion, while unknown exhausted probes disclose no result', () => {
  const s = Model.create(); pressA(s); assert.equal(s.lastProbe.reason, 'known'); assert.equal(s.lastProbe.result, 'open'); assert.equal(s.probesUsed, 0);
  exhaust(s); const observed = s.probeLog[0], used = s.probesUsed, revealed = s.revealedCount;
  focus(s, observed.cellId); pressA(s); assert.equal(s.lastProbe.result, observed.result); assert.equal(s.lastProbe.charged, false);
  assert.equal(s.lastProbe.reason, 'known'); assert.equal(s.probesUsed, used); assert.equal(s.repeatedProbes, 2);
  focus(s, s.exit.id); pressA(s); assert.equal(s.lastProbe.result, 'open'); assert.equal(s.cells[s.exit.id].probed, false);
  const unknown = s.cells.find(c => c.knowledge === 'unknown').id; focus(s, unknown); pressA(s);
  assert.equal(s.lastProbe.reason, 'exhausted'); assert.equal(s.lastProbe.result, null); assert.equal(s.lastProbe.charged, false);
  assert.equal(s.cells[unknown].knowledge, 'unknown'); assert.equal(s.cells[unknown].probed, false);
  assert.equal(s.blockedProbes, 1); assert.equal(s.probesUsed, used); assert.equal(s.revealedCount, revealed);
  assert.equal(s.exhaustedStrikes, 0); assert.equal(s.phase, 'playing'); assert.match(s.message, /累计三次/); audit(s);
});

test('the final paid probe reveals normally and does not retroactively charge earlier wrong submissions', () => {
  const s = Model.create(); pressB(s); pressA(s);
  assert.equal(s.lastSubmission.reason, 'endpoint'); assert.equal(s.totalWrong, 1); assert.equal(s.exhaustedStrikes, 0);
  const earlier = clone(s.lastSubmission); pressB(s); exhaust(s);
  assert.equal(s.probesRemaining, 0); assert.equal(s.lastProbe.reason, 'revealed'); assert.equal(s.lastProbe.charged, true);
  assert.deepEqual(s.lastSubmission, earlier); assert.equal(s.totalWrong, 1); assert.equal(s.exhaustedStrikes, 0); assert.equal(s.phase, 'playing');
});

test('only fresh invalid submissions after exhaustion charge strikes; the third loses and held A charges once', () => {
  const s = exhaust(Model.create()); pressB(s); tick(s, { a: true });
  assert.equal(s.submissions, 1); assert.equal(s.totalWrong, 1); assert.equal(s.exhaustedStrikes, 1); assert.equal(s.lastSubmission.chargedStrike, true);
  ticks(s, 50, { a: true }); assert.equal(s.submissions, 1); assert.equal(s.exhaustedStrikes, 1);
  tick(s); pressA(s); assert.equal(s.exhaustedStrikes, 2); assert.equal(s.phase, 'playing');
  pressA(s); assert.equal(s.exhaustedStrikes, 3); assert.equal(s.totalWrong, 3); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'strikes');
  const frozen = clone(s); pressB(s); assert.deepEqual(s, frozen);
});

test('B switches modes at entry, preserves the probe cursor, pops exactly one cell and releases occupancy', () => {
  const s = Model.create(); focus(s, 10); pressA(s); const knowledge = clone(s.cells), probes = s.probesUsed;
  pressB(s); assert.equal(s.mode, 'route'); assert.equal(s.selectedId, s.entry.id); assert.equal(s.probeCursorId, 10);
  walk(s, [0, 1, 2]); tick(s, { b: true }); assert.deepEqual(s.path.map(p => p.cellId), [0, 1]); assert.equal(s.visited[2], false);
  ticks(s, 40, { b: true }); assert.equal(s.path.length, 2); assert.equal(s.backtracks, 1);
  tick(s); walk(s, [1, 2]); assert.equal(s.routeMoves, 3); assert.equal(s.visited[2], true);
  pressB(s); pressB(s); assert.equal(s.mode, 'route'); assert.equal(s.path.length, 1);
  pressB(s); assert.equal(s.mode, 'probe'); assert.equal(s.selectedId, 10); assert.equal(s.modeSwitches, 2);
  assert.equal(s.backtracks, 3); assert.equal(s.probesUsed, probes); assert.deepEqual(s.cells, knowledge); audit(s);
});

test('known walls block route drawing while the identical unprobed real wall is drawable without secret collision tests', () => {
  const route = wallPath(), wall = route.at(-1);
  const known = Model.create(); focus(known, wall); pressA(known); assert.equal(known.cells[wall].knowledge, 'wall'); pressB(known);
  walk(known, route); assert.equal(known.lastAction.reason, 'known-wall'); assert.deepEqual(known.path.map(p => p.cellId), route.slice(0, -1));
  const unknown = Model.create(); pressB(unknown); walk(unknown, route);
  assert.equal(unknown.selectedId, wall); assert.deepEqual(unknown.path.map(p => p.cellId), route);
  assert.equal(unknown.cells[wall].knowledge, 'unknown'); assert.equal(unknown.totalWrong, 0); assert.equal(unknown.phase, 'playing');
  audit(known); audit(unknown);
});

test('board-edge and reentry moves are blocked, exit is locked, and an ordinary drawn dead end never auto-rejects', () => {
  const s = Model.create(); pressB(s); tick(s, { y: -1 }); assert.equal(s.lastAction.reason, 'edge'); assert.equal(s.path.length, 1);
  walk(s, [0, 4, 5, 1, 2, 6, 7, 3]); assert.equal(s.phase, 'playing'); assert.equal(s.totalWrong, 0); assert.equal(s.lastSubmission, null);
  tick(s, { x: -1 }); assert.equal(s.lastAction.reason, 'visited'); assert.equal(s.path.length, 8);
  const exit = Model.create(); pressB(exit); walk(exit, [0, 1, 2, 3, 7, 11, 15]);
  assert.equal(exit.atExit, true); assert.equal(exit.phase, 'playing'); const before = shape(exit);
  tick(exit, { x: -1 }); assert.equal(exit.lastAction.reason, 'exit'); assert.deepEqual(shape(exit), before); assert.equal(exit.submissions, 0);
});

test('submission checks malformed public shape before endpoint, length or hidden safety', () => {
  const wall = wallPath().at(-1);
  for (const ids of [[], [15], [0, 0], [0, 5], [0, 16], [0, null], [0, wall, 0]]) {
    const s = Model.create(); setPath(s, ids); tick(s, { a: true });
    assert.equal(s.lastSubmission.reason, 'shape', JSON.stringify(ids)); assert.equal(s.lastSubmission.accepted, false);
    assert.equal(s.totalWrong, 1); assert.equal(s.exhaustedStrikes, 0); assert.equal(s.probesUsed, 0);
    assert.equal(s.cells.filter(c => c.knowledge !== 'unknown').length, 2);
  }
});

test('endpoint then length errors take precedence even when a submitted public route includes an observed real wall', () => {
  const incomplete = Model.create(), partial = wallPath(); setPath(incomplete, partial); tick(incomplete, { a: true });
  assert.equal(incomplete.lastSubmission.reason, 'endpoint'); assert.equal(incomplete.cells[partial.at(-1)].knowledge, 'unknown');
  const full = Model.create(), observed = observedMap();
  const longer = findRoute(full.entry.id, full.exit.id, full.requiredDistance + 2, () => true, ids => ids.some(id => observed[id] === 'wall'));
  assert.ok(longer); setPath(full, longer); tick(full, { a: true });
  assert.equal(full.lastSubmission.reason, 'length'); assert.equal(full.lastSubmission.pathEdges, full.requiredDistance + 2);
  assert.equal(full.probesUsed, 0); assert.equal(full.revealedCount, 2); assert.equal(full.exhaustedStrikes, 0);
});

test('a complete correct-length unsafe route gets only a generic verdict despite spoofed public open knowledge', () => {
  const s = Model.create(), observed = observedMap();
  const unsafe = findRoute(s.entry.id, s.exit.id, s.requiredDistance, () => true, ids => ids.some(id => observed[id] === 'wall'));
  assert.ok(unsafe);
  // Explicit public-knowledge spoof fixture: truth must still come from the original registration.
  s.cells.forEach(c => { c.knowledge = 'open'; }); setPath(s, unsafe); tick(s, { a: true });
  assert.equal(s.lastSubmission.reason, 'unsafe'); assert.equal(s.lastSubmission.accepted, false); assert.equal(s.phase, 'playing');
  assert.deepEqual(Object.keys(s.lastSubmission).sort(), ['id', 'accepted', 'reason', 'routeIds', 'pathEdges', 'requiredDistance', 'probesRemaining', 'chargedStrike', 'exhaustedStrikes', 'at'].sort());
  assert.deepEqual(s.lastSubmission.routeIds, unsafe); assert.equal(s.events.length, 1); assert.equal(s.events[0].reason, 'unsafe');
  assert.match(s.message, /完整路线不安全/); assert.ok(!/offending|wallId|wallCount/.test(JSON.stringify(s.lastSubmission)));
  const snapshot = clone(s.lastSubmission); pressB(s); assert.deepEqual(s.lastSubmission, snapshot, 'backtracking does not mutate the submitted copy');
});

test('ordinary drawing of reconstructed safe routes needs A to win and never reveals unprobed route cells', () => {
  for (let d = 0; d < 3; d++) {
    const s = Model.create(9, d), observed = observedMap(d);
    const safe = findRoute(s.entry.id, s.exit.id, s.requiredDistance, id => observed[id] === 'open'); assert.ok(safe);
    const originalKnowledge = clone(s.cells); pressB(s); walk(s, safe);
    assert.equal(s.pathEdges, s.requiredDistance); assert.equal(s.atExit, true); assert.equal(s.phase, 'playing');
    assert.ok(s.path.some(p => s.cells[p.cellId].knowledge === 'unknown')); assert.equal(s.submissions, 0);
    tick(s, { a: true }); assert.equal(s.phase, 'won'); assert.equal(s.lastSubmission.reason, 'accepted');
    assert.deepEqual(s.cells, originalKnowledge); assert.equal(s.probesUsed, 0); assert.equal(s.probeLog.length, 0); assert.equal(s.revealedCount, 2);
    assert.equal(s.score, s.requiredDistance * 10 + 1000 + s.probeBudget * 100 + Math.floor(s.remaining) * 5); audit(s);
  }
});

test('public score is equal for open/wall observations and safe/unsafe partial paths of equal public length', () => {
  const map = observedMap(), initial = Model.create();
  const openId = initial.cells.find(c => !c.role && map[c.id] === 'open').id, wallId = map.findIndex(v => v === 'wall');
  for (const id of [openId, wallId]) {
    const s = Model.create(); focus(s, id); pressA(s); assert.equal(s.score, 40); pressA(s); assert.equal(s.score, 40);
  }
  let safe, unsafe;
  for (let length = 1; length <= initial.requiredDistance && !unsafe; length++) for (let end = 0; end < 16; end++) {
    if (end === initial.exit.id) continue;
    const candidateUnsafe = findRoute(initial.entry.id, end, length, () => true, ids => ids.some(id => map[id] === 'wall'));
    if (!candidateUnsafe) continue;
    for (let safeEnd = 0; safeEnd < 16; safeEnd++) {
      if (safeEnd === initial.exit.id) continue;
      const candidateSafe = findRoute(initial.entry.id, safeEnd, length, id => map[id] === 'open');
      if (candidateSafe) { safe = candidateSafe; unsafe = candidateUnsafe; break; }
    }
    if (unsafe) break;
  }
  assert.ok(safe && unsafe); const scores = [];
  for (const route of [safe, unsafe]) {
    const s = Model.create(); pressB(s); walk(s, route); scores.push(s.score); assert.equal(s.score, (route.length - 1) * 10);
    const before = s.score; pressA(s); assert.equal(s.score, before); pressB(s); assert.equal(s.score, before - 10);
    walk(s, route.slice(-2)); assert.equal(s.score, before, 're-marking restores rather than accumulates path score');
  }
  assert.equal(scores[0], scores[1]);
});

test('fresh retries of each difficulty return identical ordinary probe results and restore independent public resources', () => {
  for (let d = 0; d < 3; d++) {
    const map = observedMap(d), reference = Model.create(1, d);
    const ids = reference.cells.filter(c => !c.role).map(c => c.id);
    for (const id of ids) {
      const retry = Model.create(999, d); focus(retry, id); pressA(retry); assert.equal(retry.cells[id].knowledge, map[id]);
      assert.deepEqual(retry.rowOpenCounts, reference.rowOpenCounts); assert.equal(retry.requiredDistance, reference.requiredDistance);
    }
    const retry = Model.create(1, d); assert.deepEqual(retry, reference);
    for (const key of ['cells', 'path', 'visited', 'rowOpenCounts', 'probeLog']) assert.notStrictEqual(retry[key], reference[key]);
  }
});

test('cursor cadence is immediate then 20/10 ticks, with clamp, release/change reset, deadzone and horizontal ties', () => {
  const s = Model.create(); tick(s, { x: 1 }); assert.equal(s.selectedId, 1);
  ticks(s, 19, { x: 1 }); assert.equal(s.selectedId, 1); tick(s, { x: 1 }); assert.equal(s.selectedId, 2);
  ticks(s, 9, { x: 1 }); assert.equal(s.selectedId, 2); tick(s, { x: 1 }); assert.equal(s.selectedId, 3);
  ticks(s, 10, { x: 1 }); assert.equal(s.selectedId, 3); assert.equal(s.lastAction.reason, 'edge');
  tick(s, { x: -1 }); assert.equal(s.selectedId, 2); tick(s); tick(s, { x: -1 }); assert.equal(s.selectedId, 1);
  for (const [input, id] of [[{ x: .5, y: .5 }, 6], [{ x: -.5, y: -.5 }, 4], [{ x: .4, y: .5 }, 9], [{ x: .249, y: -.249 }, 5], [{ x: .25 }, 6]]) {
    const sample = Model.create(); focus(sample, 5); tick(sample, input); assert.equal(sample.selectedId, id);
  }
});

test('navigation precedes probing or submission, while B suppresses navigation and discards simultaneous A', () => {
  const s = Model.create(); tick(s, { x: 1, a: true }); assert.equal(s.lastProbe.cellId, 1); assert.equal(s.probesUsed, 1);
  assert.deepEqual(s.events.map(e => e.type), ['select', 'probe']); tick(s);
  tick(s, { b: true, a: true, y: 1 }); assert.equal(s.mode, 'route'); assert.equal(s.path.length, 1); assert.equal(s.submissions, 0);
  assert.deepEqual(s.events.map(e => e.type), ['mode']);
  tick(s, { b: true, a: true, y: 1 }); assert.equal(s.path.length, 2); assert.equal(s.submissions, 0);
  tick(s); tick(s, { x: 1, a: true }); assert.equal(s.path.at(-1).cellId, 5); assert.equal(s.lastSubmission.routeIds.at(-1), 5);
  assert.deepEqual(s.events.map(e => e.type), ['append', 'submit']);
});

test('larger dt preserves per-tick priority and is equivalent to ordinary ticks on separate original states', () => {
  const combined = Model.create(), split = Model.create();
  Model.step(combined, .25, { b: true, aPressed: true, x: 1 });
  tick(split, { b: true, aPressed: true, x: 1 }); ticks(split, 14, { b: true, x: 1 });
  assert.equal(combined.mode, 'route'); assert.equal(combined.pathEdges, 1); assert.equal(combined.submissions, 0); assert.equal(combined.probesUsed, 0);
  assert.deepEqual(combined.events.map(e => e.type), ['mode', 'append']);
  const { events: ea, _accumulator: ra, ...a } = combined, { events: eb, _accumulator: rb, ...b } = split;
  assert.ok(Math.abs(ra - rb) < 1e-12); assert.deepEqual(a, b);
});

test('zero-dt and sub-tick button edges cache once, but movement is not queued and coalesced A is discarded by B', () => {
  const s = Model.create(); focus(s, 5); const at = s.tick;
  Model.step(s, DT / 2, { aPressed: true }); assert.equal(s.probesUsed, 0); assert.equal(s.tick, at);
  Model.step(s, DT / 2, {}); assert.equal(s.probesUsed, 1);
  Model.step(s, 0, { aPressed: true, x: 1 }); Model.step(s, 0, { bPressed: true });
  assert.equal(s.mode, 'probe'); assert.equal(s.selectedId, 5); tick(s);
  assert.equal(s.mode, 'route'); assert.equal(s.pathEdges, 0); assert.equal(s.submissions, 0); assert.equal(s.probeAttempts, 1);
  tick(s); assert.equal(s.submissions, 0); assert.equal(s.pathEdges, 0);
});

test('cancellation clears queued actions/repeats while preserving mode, probe knowledge, cursor and marked route', () => {
  const first = Model.create(); tick(first, { cancelEpoch: 8, b: true }); assert.equal(first.mode, 'route');
  const s = Model.create(); tick(s, { cancelEpoch: 2 }); focus(s, 5); pressA(s); pressB(s); walk(s, [0, 1]);
  const before = shape(s), counters = [s.probeAttempts, s.submissions, s.modeSwitches, s.backtracks], at = s.tick;
  tick(s, { cancelEpoch: 3, a: true, b: true, y: 1 });
  ticks(s, 8, { cancelled: true, a: true, b: true, aPressed: true, bPressed: true, x: 1 });
  assert.deepEqual(shape(s), before); assert.deepEqual([s.probeAttempts, s.submissions, s.modeSwitches, s.backtracks], counters); assert.equal(s.tick, at + 9);
  tick(s, { a: true, b: true }); assert.deepEqual(shape(s), before); tick(s); tick(s, { b: true }); assert.equal(s.pathEdges, 0);
  const pending = Model.create(); Model.step(pending, DT / 2, { aPressed: true, bPressed: true });
  Model.step(pending, DT / 2, { cancelled: true }); tick(pending); assert.equal(pending.probeAttempts, 0); assert.equal(pending.mode, 'probe');
  const repeat = Model.create(); tick(repeat, { x: 1 }); tick(repeat, { cancelled: true, x: 1 }); tick(repeat, { x: 1 }); assert.equal(repeat.selectedId, 2);
});

test('deadline precedes probe, B mode change, navigation and an otherwise valid winning submission', () => {
  const original = Model.create(), map = observedMap();
  const safe = findRoute(original.entry.id, original.exit.id, original.requiredDistance, id => map[id] === 'open');
  const cases = [[Model.create(), { a: true }], [Model.create(), { b: true }], [Model.create(), { x: 1 }]];
  pressB(original); walk(original, safe); cases.push([original, { a: true }]);
  for (const [s, input] of cases) {
    const before = shape(s), counters = [s.probeAttempts, s.submissions, s.modeSwitches, s.backtracks]; s.timeLimit = (s.tick + 1) / 60;
    tick(s, input); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'timeout'); assert.equal(s.remaining, 0);
    assert.deepEqual(shape(s), before); assert.deepEqual([s.probeAttempts, s.submissions, s.modeSwitches, s.backtracks], counters);
    assert.deepEqual(s.events.map(e => e.type), ['lost']);
  }
});

test('terminal original states freeze all fields, including events and transient records; snapshots remain non-restorable', () => {
  const won = Model.create(), map = observedMap(); pressB(won);
  walk(won, findRoute(won.entry.id, won.exit.id, won.requiredDistance, id => map[id] === 'open')); tick(won, { a: true });
  const lost = Model.create(); focus(lost, 5); pressA(lost); lost.timeLimit = (lost.tick + 1) / 60; tick(lost);
  for (const s of [won, lost]) {
    const frozen = clone(s);
    for (const dt of [0, DT, .25, 100, NaN]) Model.step(s, dt, { aPressed: true, bPressed: true, x: 1, cancelEpoch: 100 });
    assert.deepEqual(s, frozen); assert.throws(() => Model.step(frozen, DT, {}), /original create\(\) result/);
  }
});

test('numeric inputs are bounded and public logs, route occupancy and events remain finite', () => {
  const s = Model.create();
  for (const dt of [NaN, Infinity, -Infinity, -1, '1', undefined]) Model.step(s, dt, {});
  assert.equal(s.tick, 0); tick(s, { x: NaN, y: Infinity }); assert.equal(s.selectedId, s.entry.id);
  tick(s, { x: 1e30 }); assert.equal(s.selectedId, 1); const at = s.tick; Model.step(s, 100, {}); assert.equal(s.tick, at + 15);
  assert.equal(Model.create(NaN, NaN).seed, 1); assert.equal(Model.create(1, -9).level, 1);
  assert.equal(Model.create(1, 99).level, 3); assert.equal(Model.create(1, 1.9).level, 2);
  assert.ok(s.events.length <= 32); assert.ok(s.path.length <= 16); assert.ok(s.probeLog.length <= s.probeBudget); audit(s);
  function finiteTree(value) { if (typeof value === 'number') assert.ok(Number.isFinite(value)); else if (value && typeof value === 'object') Object.values(value).forEach(finiteTree); }
  finiteTree(s);
});

// Defined ordinary-input integration scenarios. The pilot receives only public
// JSON observations, never an original state/WeakMap registration or private map.
{
  const normalTest = require('node:test');
  const normalAssert = require('node:assert/strict');
  const NormalModel = require('../src/main/assets/game-model.js');
  const { pathToFileURL: normalFileURL } = require('node:url');
  const normalPath = require('node:path');
  const normalPilotModule = import(normalFileURL(normalPath.join(__dirname, 'automation.mjs')).href);
  function normalSnapshot(s) {
    const model = JSON.parse(JSON.stringify(s, (key, value) => key.startsWith('_') ? undefined : value));
    return {phase:s.phase,paused:false,model};
  }
  function normalFreeze(x) {
    if (x && typeof x === 'object') {Object.values(x).forEach(normalFreeze);Object.freeze(x);}
    return x;
  }
  function normalTap(s, input) {NormalModel.step(s,1/60,input);NormalModel.step(s,1/60,{});}
  function normalCursor(s,id) {
    for(let n=0;s.selectedId!==id&&n<16;n++) {
      const from=s.cells[s.selectedId],to=s.cells[id];
      normalTap(s,from.col!==to.col?{x:Math.sign(to.col-from.col)}:{y:Math.sign(to.row-from.row)});
    }
    normalAssert.equal(s.selectedId,id);
  }
  for(let difficulty=0;difficulty<3;difficulty++) {
    normalTest(`ordinary public-inference record route through puzzle ${difficulty+1}`,async()=>{
      const pilotModule=await normalPilotModule,pilot=pilotModule.createPilot();
      const s=NormalModel.create(17,difficulty),initial=normalSnapshot(s),trace=[{elapsed:0,state:initial}];
      let keys=[],lastA=false,lastB=false;
      // Same 60 Hz stepping as runtime, with an explicitly defined observation
      // every five ticks; this is not a guarantee of every possible input timing.
      for(let frame=0;frame<5401&&s.phase==='playing';frame++) {
        if(frame%5===0) {
          const observation=normalSnapshot(s);trace.push({elapsed:s.elapsed,state:observation});
          keys=pilot(normalFreeze(observation),{mode:'record',elapsed:s.elapsed});
        }
        const a=keys.includes('Space'),b=keys.includes('b');
        NormalModel.step(s,1/60,{x:Number(keys.includes('ArrowRight'))-Number(keys.includes('ArrowLeft')),
          y:Number(keys.includes('ArrowDown'))-Number(keys.includes('ArrowUp')),a,b,
          aPressed:a&&!lastA,bPressed:b&&!lastB,cancelEpoch:0});
        lastA=a;lastB=b;
      }
      const after=normalSnapshot(s);trace.push({elapsed:s.elapsed,state:after});
      pilotModule.assertProgress({after,trace},normalAssert);
      normalAssert.equal(s.phase,'won');normalAssert.ok(s.elapsed>=30&&s.elapsed<90);
      normalAssert.ok(s.probeLog.some(p=>p.result==='open'));
      normalAssert.ok(s.probeLog.some(p=>p.result==='wall'));
      normalAssert.equal(s.totalWrong,0);normalAssert.equal(s.exhaustedStrikes,0);
      normalAssert.equal(s.revealedCount,s.probesUsed+2,'success must not disclose unknown route cells');
      normalAssert.ok(s.path.some(p=>s.cells[p.cellId].knowledge==='unknown'));
      normalAssert.ok(pilot.diagnostics().some(e=>e.type==='observed-information-gain'));
      const terminal=JSON.stringify(s);NormalModel.step(s,.25,{a:true,b:true,x:1,y:1,cancelled:true});
      normalAssert.equal(JSON.stringify(s),terminal);
      const retry=NormalModel.create(17,difficulty);
      pilotModule.assertRetry({after:normalSnapshot(retry),initial},normalAssert);
    });
    normalTest(`ordinary probe exhaustion and three fresh invalid submissions lose puzzle ${difficulty+1}`,()=>{
      const s=NormalModel.create(17,difficulty);
      normalTap(s,{b:true});normalTap(s,{a:true});
      normalAssert.equal(s.lastSubmission.reason,'endpoint');
      normalAssert.equal(s.totalWrong,1);normalAssert.equal(s.exhaustedStrikes,0);
      normalTap(s,{b:true});normalAssert.equal(s.mode,'probe');
      while(s.probesRemaining>0) {
        const next=s.cells.find(c=>c.knowledge==='unknown').id;
        normalCursor(s,next);normalTap(s,{a:true});
      }
      normalAssert.equal(s.probesUsed,s.probeBudget);
      normalAssert.equal(s.phase,'playing');normalAssert.equal(s.exhaustedStrikes,0,'earlier error is not retroactive');
      const log=JSON.stringify(s.probeLog),used=s.probesUsed;
      normalTap(s,{a:true});normalAssert.equal(s.lastProbe.reason,'known');
      normalAssert.equal(s.probesUsed,used);normalAssert.equal(JSON.stringify(s.probeLog),log);
      const unknown=s.cells.find(c=>c.knowledge==='unknown').id;
      normalCursor(s,unknown);normalTap(s,{a:true});
      normalAssert.equal(s.lastProbe.reason,'exhausted');normalAssert.equal(s.lastProbe.result,null);
      normalAssert.equal(s.cells[unknown].knowledge,'unknown');normalAssert.equal(s.phase,'playing');
      normalTap(s,{b:true});
      for(let strike=1;strike<=3;strike++) {
        normalTap(s,{a:true});normalAssert.equal(s.exhaustedStrikes,strike);
        normalAssert.equal(s.totalWrong,strike+1);normalAssert.equal(s.lastSubmission.chargedStrike,true);
        normalAssert.equal(s.phase,strike===3?'lost':'playing');
      }
      normalAssert.equal(s.lostReason,'strikes');normalAssert.equal(s.lastSubmission.reason,'endpoint');
      normalAssert.equal(s.score,s.probeBudget*40);normalAssert.ok(s.elapsed<90);
      const frozen=JSON.stringify(s);NormalModel.step(s,.25,{b:true,x:1,a:true});
      normalAssert.equal(JSON.stringify(s),frozen);
    });
  }
}
