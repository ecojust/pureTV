// REVIEW CANDIDATE: do not execute until the root reviewer has read and approved it.
// Synthetic public fixtures only. Never imports, decodes, or executes the production Model.
// Usage after approval: node review.mjs --app /path/to/number-dunes --output /path/report.json
//   --expected-pilot d7ff4e890abc19c9f43ca2e4dca9092f35a3ce5607882f982cb186594dea8d13
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const PIN = {
  pilot: 'd7ff4e890abc19c9f43ca2e4dca9092f35a3ce5607882f982cb186594dea8d13',
  contract: '2a636094b001400c3465e461e3c0ce88feccca6079cb420a456b09d6d37fead8',
  math: 'ecde86f46e2ff6c2e66d4bf5ba0ffd2f9f3bdfba8b5e6ceedec5065b742482a2'
};
const args = Object.fromEntries(Array.from({ length: (process.argv.length - 2) / 2 }, (_, i) =>
  [process.argv[2 + i * 2], process.argv[3 + i * 2]]));
assert.ok(args['--app'] && args['--output'] && args['--expected-pilot'], 'Explicit --app, --output and --expected-pilot required');
assert.ok(Object.keys(args).every(k => ['--app', '--output', '--expected-pilot'].includes(k)), 'Unknown option');
assert.match(args['--expected-pilot'], /^[a-f0-9]{64}$/);
assert.equal(args['--expected-pilot'], PIN.pilot, 'This reviewed candidate binds one exact pilot; update/review the script before rebinding');
const app = path.resolve(args['--app']), output = path.resolve(args['--output']);
const files = {
  pilot: path.join(app, 'tests/automation.mjs'),
  contract: path.join(app, 'docs/model-contract.md'),
  math: path.join(app, 'tests/independent-dunes-math.mjs'),
  modelBytesOnly: path.join(app, 'src/main/assets/game-model.js'),
  reviewScript: fileURLToPath(import.meta.url)
};
// The Model file is used ONLY here as an uninterpreted Buffer passed to SHA-256.
async function hashes() {
  return Object.fromEntries(await Promise.all(Object.entries(files).map(async ([k, file]) =>
    [k, createHash('sha256').update(await readFile(file)).digest('hex')])));
}
const startHashes = await hashes(), startedAt = new Date().toISOString();
const counts = { totalPilotInterfaceCalls: 0, exports: 0, observations: 0, factories: 0, diagnostics: 0, frozenSnapshots: 0, privateReads: 0, writes: 0 };
const limits = { totalPilotInterfaceCalls: 100, plannerMilliseconds: 100, plannerExpanded: 1000, plannerQueued: 2000 };
const checks = [], observations = [], details = {};
let failure = null;
function call(kind, label, fn, ...values) {
  assert.ok(['exports', 'observations', 'factories', 'diagnostics'].includes(kind));
  assert.ok(counts.totalPilotInterfaceCalls < limits.totalPilotInterfaceCalls, 'Hard total pilot-interface call cap reached');
  counts.totalPilotInterfaceCalls++; counts[kind]++;
  return fn(...values);
}
function check(name, fn) {
  try { const result = fn(); checks.push({ name, passed: true }); return result; }
  catch (e) { checks.push({ name, passed: false, error: String(e.stack || e) }); throw e; }
}
const copy = value => structuredClone(value);

try {
  for (const key of ['pilot', 'contract', 'math']) assert.equal(startHashes[key], PIN[key], `${key} source pin`);
  // These are the only two executable app imports. The math module has no IO, Model import, or import-time search.
  const pilot = await import(pathToFileURL(files.pilot).href);
  const math = await import(pathToFileURL(files.math).href);
  const api = (name, ...values) => call('exports', name, pilot[name], ...values);
  const factory = () => call('factories', 'createPilot', pilot.createPilot);
  const diagnostics = p => call('diagnostics', 'diagnostics', p.diagnostics);
  const g = math.geometry();
  const ordinaryKeys = new Set(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Space', 'b']);

  // These layouts are hand-made specifically for this review, with 2 or 4 stones.
  // None is an authored level, author route, Model-created board, or actual browser trace.
  function fixture({ placements, pillars, values, targetOccupied, moveLimit = 8 }) {
    const occupied = new Map(placements.map(([id, cellId]) => [cellId, id]));
    const targetSet = new Set(g.cells.filter(c => !pillars.includes(c.id) && !targetOccupied.includes(c.id)).map(c => c.id));
    const m = {
      width: 960, height: 540, seed: 90218, level: 1, difficulty: 0, levelName: 'Independent synthetic fixture',
      grid: { cols: 4, rows: 4, x: 180, y: 136, cellSize: 72 }, phase: 'playing', tick: 0, elapsed: 0, remaining: 90, timeLimit: 90,
      cells: g.cells.map(c => ({ ...c, kind: pillars.includes(c.id) ? 'pillar' : 'sand', stoneId: occupied.get(c.id) || null, targetHole: targetSet.has(c.id) })),
      stones: values.map((value, i) => ({ id: 'S' + (i + 1), value, cellId: placements.find(([id]) => id === 'S' + (i + 1))[1] })),
      targetHoleIds: g.cells.filter(c => targetSet.has(c.id)).map(c => c.id), moveLimit,
      actions: copy(g.actions), focusItems: g.actions.map(a => ({ id: a.id, kind: 'compact', x: a.x, y: a.y })),
      selectedId: 'R1W', movesUsed: 0, movesRemaining: moveLimit, undos: 0, compactionAttempts: 0, noOpAttempts: 0,
      history: [], historyDepth: 0, lastCompaction: null, lastUndo: null, transition: null, lostReason: null,
      message: 'Synthetic public observation', lastAction: null, events: []
    };
    return refresh(m);
  }
  function refresh(m) {
    for (const stone of m.stones) stone.cellId = m.cells.find(c => c.stoneId === stone.id).id;
    const board = math.publicBoard(m), position = m.cells.map(c => c.stoneId);
    Object.assign(m, math.facts(board, position));
    m.lines = g.lines.map(l => ({ id: l.id, axis: l.axis, index: l.index, cellIds: copy(l.cellIds), segments: math.segments(board, l.id) }));
    m.cursor = copy(m.focusItems.find(f => f.id === m.selectedId));
    m.elapsed = m.tick / 60; m.remaining = Math.max(0, m.timeLimit - m.elapsed);
    m.movesRemaining = Math.max(0, m.moveLimit - m.movesUsed); m.historyDepth = m.history.length;
    m.score = m.orderedPairs * 25 + m.matchedHoleCount * 20 + (m.phase === 'won' ? 1000 + Math.floor(m.remaining) * 5 + m.movesRemaining * 50 : 0);
    const p = math.compact(board, position, m.selectedId), next = math.facts(board, p.position);
    const { position: unused, ...prediction } = p;
    m.preview = { ...prediction, willWin: p.changed && next.goalReady, willExhaustMoves: p.changed && m.movesUsed + 1 >= m.moveLimit && !next.goalReady };
    if (m.transition && m.elapsed >= m.transition.startedAt + .24) m.transition = null;
    return m;
  }
  const at = (m, tick) => refresh(Object.assign(copy(m), { tick }));
  function assign(m, assignments) {
    const map = new Map(assignments.map(a => [a.cellId, a.stoneId]));
    for (const c of m.cells) c.stoneId = map.get(c.id) || null;
  }
  function assignments(m) { return m.cells.filter(c => c.stoneId !== null).map(c => ({ cellId: c.id, stoneId: c.stoneId })); }
  function syntheticCompact(m, actionId, tick) {
    const next = at(m, tick), board = math.publicBoard(next), p = math.compact(board, next.cells.map(c => c.stoneId), actionId);
    assert.ok(p.changed, 'The manually scripted synthetic trial must actually move stones');
    const receipt = { id: next.movesUsed + 1, actionId, lineId: p.lineId, direction: p.direction, beforeAssignments: assignments(next),
      afterAssignments: copy(p.afterAssignments), moves: copy(p.moves), movedCount: p.movedCount, at: tick / 60, tick };
    assign(next, p.afterAssignments); next.movesUsed++; next.compactionAttempts++; next.selectedId = actionId;
    next.history.push(copy(receipt)); next.lastCompaction = copy(receipt);
    next.transition = { kind: 'compact', actionId, startedAt: tick / 60, duration: .24, moves: copy(p.moves) };
    return refresh(next);
  }
  function syntheticUndo(m, tick) {
    const next = at(m, tick), receipt = next.history.pop(); assert.ok(receipt);
    assign(next, receipt.beforeAssignments); next.selectedId = receipt.actionId; next.undos++;
    next.lastUndo = { edit: copy(receipt), at: tick / 60, tick };
    next.transition = { kind: 'undo', actionId: receipt.actionId, startedAt: tick / 60, duration: .24,
      moves: receipt.moves.map(m => ({ stoneId: m.stoneId, fromCellId: m.toCellId, toCellId: m.fromCellId })) };
    return refresh(next);
  }

  // Frozen recursively, with setter traps on existing nested public properties. Private backing values differ
  // by variant, but any attempted private read throws rather than exposing either value.
  function guardedSnapshot(m, variant, paused = false) {
    const secret = { variant, future: variant === 'left' ? ['R4E', 'C3S'] : ['C2N', 'R2W'] };
    const state = { phase: m.phase, paused, model: copy(m) };
    for (const obj of [state, state.model]) for (const name of ['_private', '_route', '_expected', '_future', '_input']) {
      Object.defineProperty(obj, name, { enumerable: false, configurable: false, get() {
        counts.privateReads++; throw Error('Forbidden private getter: ' + name + ':' + secret.variant);
      } });
    }
    function wrap(value) {
      if (!value || typeof value !== 'object') return value;
      for (const [k, desc] of Object.entries(Object.getOwnPropertyDescriptors(value))) if ('value' in desc && desc.configurable) {
        const child = wrap(desc.value);
        Object.defineProperty(value, k, { enumerable: desc.enumerable, configurable: true, get() { return child; },
          set() { counts.writes++; throw Error('Read-only nested public property write: ' + k); } });
      }
      Object.freeze(value);
      // Permanent receipts must stay structuredClone-compatible: their frozen plain accessor
      // objects deliberately are NOT Proxies. Only the state/model roots guard arbitrary private names.
      if (value !== state && value !== state.model) return value;
      return new Proxy(value, {
        get(target, key, receiver) {
          if (typeof key === 'string' && key.startsWith('_')) { counts.privateReads++; throw Error('Forbidden private read: ' + key); }
          return Reflect.get(target, key, receiver);
        },
        set() { counts.writes++; throw Error('Read-only snapshot write'); },
        deleteProperty() { counts.writes++; throw Error('Read-only snapshot delete'); },
        defineProperty() { counts.writes++; throw Error('Read-only snapshot define'); },
        setPrototypeOf() { counts.writes++; throw Error('Read-only snapshot prototype write'); }
      });
    }
    const wrapped = wrap(state);
    function assertFrozen(value) {
      if (!value || typeof value !== 'object') return;
      assert.ok(Object.isFrozen(value));
      for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
        if (key.startsWith('_')) continue;
        assertFrozen('value' in desc ? desc.value : desc.get?.call(value));
      }
    }
    assertFrozen(wrapped); counts.frozenSnapshots++; return wrapped;
  }
  function observe(p, m, { variant = 'left', mode = 'record', paused = false, label = '' } = {}) {
    const result = call('observations', label, p, guardedSnapshot(m, variant, paused), { mode });
    assert.ok(Array.isArray(result) && result.every(k => ordinaryKeys.has(k)), 'Only ordinary keyboard inputs may be emitted');
    assert.ok(result.length <= 1, 'This discrete pilot emits at most one key per observation');
    observations.push({ label, variant, synthetic: true, elapsed: m.elapsed, tick: m.tick, paused,
      keys: [...result], selectedId: m.selectedId, assignments: assignments(m), movesUsed: m.movesUsed, movesRemaining: m.movesRemaining,
      undos: m.undos, historyDepth: m.historyDepth, transition: m.transition?.kind ?? null, lastCompactionId: m.lastCompaction?.id ?? null });
    return result;
  }

  const base = fixture({ placements: [['S1', 'C2'], ['S2', 'C4']], values: [1, 2], pillars: ['C6'], targetOccupied: ['C3', 'C4'] });
  const horizontal = fixture({ placements: [['S1', 'C1'], ['S2', 'C3'], ['S3', 'C5'], ['S4', 'C8']], values: [3, 1, 4, 2], pillars: ['C6', 'C11'], targetOccupied: ['C1', 'C3', 'C5', 'C8'] });
  const vertical = fixture({ placements: [['S1', 'C1'], ['S2', 'C9'], ['S3', 'C2'], ['S4', 'C14']], values: [3, 1, 4, 2], pillars: ['C7', 'C10'], targetOccupied: ['C1', 'C9', 'C2', 'C14'] });
  const compacted = syntheticCompact(base, 'R1W', 271), restored = syntheticUndo(compacted, 553);
  details.fixtureDefinitions = { base: { assignments: assignments(base), targetHoleIds: base.targetHoleIds, pillars: base.pillarIds, values: base.stones.map(s => s.value) },
    horizontal: { assignments: assignments(horizontal), pillars: horizontal.pillarIds }, vertical: { assignments: assignments(vertical), pillars: vertical.pillarIds } };

  check('Independent predecessor-rank predictions preserve IDs and order in W/E/N/S and pillar-separated segments', () => {
    const cases = [[horizontal, 'R1W'], [horizontal, 'R1E'], [horizontal, 'R2W'], [horizontal, 'R2E'], [vertical, 'C1N'], [vertical, 'C1S'], [vertical, 'C2N'], [vertical, 'C2S']];
    details.predictions = [];
    for (const [m, actionId] of cases) {
      const board = math.publicBoard(m), expected = math.compact(board, m.cells.map(c => c.stoneId), actionId), nextFacts = math.facts(board, expected.position);
      const actual = api('predictCompaction', guardedSnapshot(m, 'left').model, actionId);
      assert.deepEqual(actual, { actionId, lineId: expected.lineId, direction: expected.direction, changed: expected.changed, movedCount: expected.movedCount,
        moves: expected.moves, afterAssignments: expected.afterAssignments, willWin: expected.changed && nextFacts.goalReady,
        willExhaustMoves: expected.changed && m.movesUsed + 1 >= m.moveLimit && !nextFacts.goalReady });
      assert.equal(new Set(actual.afterAssignments.map(a => a.stoneId)).size, 4);
      details.predictions.push({ actionId, movedCount: actual.movedCount, assignments: actual.afterAssignments });
    }
    assert.deepEqual(details.predictions[0].assignments.filter(a => ['C1', 'C2'].includes(a.cellId)).map(a => a.stoneId), ['S1', 'S2']);
    assert.deepEqual(details.predictions[1].assignments.filter(a => ['C3', 'C4'].includes(a.cellId)).map(a => a.stoneId), ['S1', 'S2']);
  });
  check('Duplicate numbers retain distinct physical IDs and cannot satisfy strict numeric ordering', () => {
    const duplicate = fixture({ placements: [['S1', 'C2'], ['S2', 'C4']], values: [7, 7], pillars: ['C6'], targetOccupied: ['C3', 'C4'] });
    const m = guardedSnapshot(duplicate, 'left').model;
    const evaluated = api('evaluateBoard', m), predicted = api('predictCompaction', m, 'R1W'), planned = api('planVisibleState', m, { maxMilliseconds: 100, maxExpanded: 1000, maxQueued: 2000 });
    assert.equal(evaluated.strictlyIncreasing, false); assert.equal(evaluated.goalReady, false);
    assert.equal(predicted.afterAssignments.length, 2); assert.equal(new Set(predicted.afterAssignments.map(a => a.stoneId)).size, 2);
    assert.equal(predicted.willWin, false); assert.equal(planned.found, false); assert.equal(planned.reason, 'duplicate-values-cannot-be-strictly-increasing');
    details.duplicates = { evaluated, predicted, planned };
  });
  check('Fresh public targets yield one ordinary move, while depth/node/queue/time caps remain distinguishable', () => {
    const m = guardedSnapshot(base, 'left').model;
    const options = { maxMilliseconds: 100, maxExpanded: 1000, maxQueued: 2000, maxMoves: 4 };
    const solution = api('planVisibleState', m, options);
    assert.equal(solution.found, true); assert.deepEqual(solution.actionIds, ['R1E']);
    const projected = math.compact(math.publicBoard(base), base.cells.map(c => c.stoneId), solution.actionIds[0]);
    assert.equal(math.facts(math.publicBoard(base), projected.position).goalReady, true);
    const depth = api('planVisibleState', m, { ...options, maxMoves: 0 });
    const nodes = api('planVisibleState', m, { ...options, maxExpanded: 1 });
    const queue = api('planVisibleState', m, { ...options, maxQueued: 1 });
    // Real monotonic clock, no clock patch. The tiny positive deadline must stop search explicitly.
    const time = api('planVisibleState', m, { ...options, maxMilliseconds: .000001 });
    assert.equal(depth.reason, 'no-public-solution-within-budget'); assert.equal(depth.found, false);
    for (const [actual, reason] of [[nodes, 'node-cap'], [queue, 'queue-cap'], [time, 'time-cap']]) { assert.equal(actual.found, false); assert.equal(actual.reason, reason); }
    assert.ok(nodes.expanded <= 1); assert.ok(queue.maximumQueued <= 1 && queue.visited <= 1);
    details.searchBounds = { solution, depth, nodes, queue, time };
  });
  check('Nonfinite and invalid bounded-search, numeric-value and focus parameters are rejected', () => {
    for (const options of [{ maxMilliseconds: NaN }, { maxMilliseconds: Infinity }, { maxQueued: Infinity }, { maxExpanded: 0 }, { maxMoves: .5 }])
      assert.throws(() => api('planVisibleState', guardedSnapshot(base, 'left').model, options), /Invalid explicit bounded public search parameters/);
    const value = copy(base); value.stones[0].value = Infinity;
    assert.throws(() => api('evaluateBoard', guardedSnapshot(value, 'left').model), /finite integer values/);
    const focus = copy(base); focus.focusItems[0].x = NaN;
    assert.throws(() => api('predictFocus', guardedSnapshot(focus, 'left').model, 'E'), /finite sixteen-action focus/);
  });
  check('No-op is idempotent, free of move/history charges, and cannot claim budget exhaustion', () => {
    const noop = at(compacted, 300); noop.noOpAttempts++; noop.compactionAttempts++; refresh(noop);
    const p = api('predictCompaction', guardedSnapshot(noop, 'left').model, 'R1W');
    assert.equal(p.changed, false); assert.equal(p.movedCount, 0); assert.equal(p.willExhaustMoves, false); assert.equal(p.willWin, false);
    assert.deepEqual(p.afterAssignments, assignments(compacted));
    api('assertPublicBoard', guardedSnapshot(noop, 'left').model, assert);
    assert.equal(noop.movesUsed, 1); assert.equal(noop.historyDepth, 1); assert.equal(noop.noOpAttempts, 1); assert.equal(noop.compactionAttempts, 2);
    details.noop = { predictions: p, movesUsed: noop.movesUsed, historyDepth: noop.historyDepth, noOpAttempts: noop.noOpAttempts };
  });

  const left = factory(), right = factory(), unusedFactory = factory();
  const sequence = [
    { label: 'fresh-record', m: at(base, 0), keys: [] },
    { label: 'plan-and-inspect-public-preview', m: at(base, 120), keys: [] },
    { label: 'ordinary-A-trial', m: at(base, 270), keys: ['Space'] },
    { label: 'release-after-late-compaction-observation', m: at(compacted, 291), keys: [] },
    { label: 'accept-permanent-compaction-receipt', m: at(compacted, 294), keys: [] },
    { label: 'ordinary-B-undo', m: at(compacted, 552), keys: ['b'] },
    { label: 'release-after-late-undo-observation', m: at(restored, 573), keys: [] },
    { label: 'accept-exact-unrefunded-undo', m: at(restored, 576), keys: [] },
    { label: 'replan-from-observed-restored-board', m: at(restored, 834), keys: null }
  ];
  check('Frozen paired observations with different inaccessible private state drive identical trial, release, undo and replan keys', () => {
    assert.equal(sequence[3].m.transition, null); assert.equal(sequence[6].m.transition, null);
    assert.ok(sequence[3].m.elapsed - compacted.lastCompaction.at > .24);
    assert.ok(sequence[6].m.elapsed - restored.lastUndo.at > .24);
    for (const item of sequence) {
      const a = observe(left, item.m, { variant: 'left', label: item.label });
      const b = observe(right, item.m, { variant: 'right', label: item.label });
      assert.deepEqual(a, b);
      if (item.keys) assert.deepEqual(a, item.keys);
      else assert.ok(a.length === 1 && a[0].startsWith('Arrow'), 'Replanning must reach a real direction decision');
    }
    const logs = diagnostics(left), compactLog = logs.find(e => e.type === 'observed-compaction'), undoLog = logs.find(e => e.type === 'observed-undo');
    assert.equal(compactLog.edit.movedCount, 2); assert.equal(undoLog.movesUsed, 1); assert.equal(undoLog.movesRemaining, 7);
    assert.deepEqual(undoLog.assignments, assignments(base)); assert.equal(sequence[7].m.selectedId, 'R1W');
    assert.equal(logs.filter(e => e.type === 'public-A-star-search').length, 2);
    assert.equal(logs.at(-1).type, 'ordinary-input'); assert.equal(logs.at(-1).kind, 'navigate');
    details.syntheticTrial = { logs, receipt: compacted.lastCompaction, undoReceipt: restored.lastUndo, finalObserved: {
      assignments: assignments(restored), selectedId: restored.selectedId, movesUsed: restored.movesUsed, movesRemaining: restored.movesRemaining,
      undos: restored.undos, historyDepth: restored.historyDepth, lastCompactionRetained: restored.lastCompaction } };
    for (const m of [base, sequence[4].m, sequence[7].m]) api('assertPublicBoard', guardedSnapshot(m, 'left').model, assert);
  });
  check('Paused observations have no pilot effects; factories are independent and retry resets observed state', () => {
    const before = diagnostics(left);
    assert.deepEqual(observe(left, sequence.at(-1).m, { paused: true, label: 'paused-with-pending-navigation' }), []);
    assert.deepEqual(diagnostics(left), before);
    assert.deepEqual(diagnostics(unusedFactory), [], 'A separate untouched factory must remain untouched');
    for (const tick of [0, 24]) {
      const fresh = at(base, tick);
      const a = observe(left, fresh, { mode: 'qa', label: 'retry-existing-factory' });
      const b = observe(unusedFactory, fresh, { mode: 'qa', variant: 'right', label: 'first-use-independent-factory' });
      assert.deepEqual(a, b); if (tick === 24) assert.ok(a.length === 1 && a[0].startsWith('Arrow'));
    }
    api('assertRetry', { after: guardedSnapshot(at(base, 0), 'left'), initial: guardedSnapshot(base, 'right') }, assert);
  });
  check('A changed physical ID assignment is rejected even when the counters and receipt appear successful', () => {
    const p = factory();
    for (const item of sequence.slice(0, 4)) observe(p, item.m, { label: 'wrong-ID-setup-' + item.label });
    const corrupt = at(compacted, 294), a = corrupt.cells.find(c => c.stoneId === 'S1'), b = corrupt.cells.find(c => c.stoneId === 'S2');
    [a.stoneId, b.stoneId] = [b.stoneId, a.stoneId]; refresh(corrupt);
    assert.throws(() => observe(p, corrupt, { label: 'reject-wrong-stable-ID' }), /Actual compaction lost stable IDs/);
  });
  check('An undo that refunds charged moves is rejected instead of accepted as a legitimate restore', () => {
    const p = factory();
    for (const item of sequence.slice(0, 7)) observe(p, item.m, { label: 'refund-setup-' + item.label });
    const corrupt = at(restored, 576); corrupt.movesUsed = 0; refresh(corrupt);
    assert.throws(() => observe(p, corrupt, { label: 'reject-refunded-undo' }), /B must restore exact pre-trial IDs and focus without refunding time or successful moves/);
  });
  check('No private getter or write trap fired, and total pilot API/observation/factory/diagnostic calls stayed bounded', () => {
    assert.equal(counts.privateReads, 0); assert.equal(counts.writes, 0);
    assert.ok(counts.totalPilotInterfaceCalls <= 100); assert.ok(counts.frozenSnapshots > 20);
    assert.equal(counts.totalPilotInterfaceCalls, counts.exports + counts.observations + counts.factories + counts.diagnostics);
  });
} catch (e) { failure = String(e.stack || e); }

const endHashes = await hashes();
const sourceUnchanged = Object.keys(startHashes).every(k => startHashes[k] === endHashes[k]);
const passed = !failure && sourceUnchanged && checks.length > 0 && checks.every(c => c.passed) && counts.privateReads === 0 && counts.writes === 0 && counts.totalPilotInterfaceCalls <= 100;
const report = {
  schemaVersion: 1, game: 'number-dunes', passed, evidenceKind: 'independent-synthetic-public-pilot-review', startedAt, completedAt: new Date().toISOString(),
  limits, counts, sourceUnchanged, startHashes, endHashes, checks, details, observations, failure,
  scope: {
    syntheticFixturesOnly: true, handMadeStoneCounts: [2, 4], productionModelImported: false, productionModelExecuted: false,
    productionModelDecoded: false, productionModelBytesHashedOnly: true, authorLayoutsOrRoutesUsed: false,
    actualBrowserExecuted: false, runtimeWinClaimed: false, actualGameWinsClaimed: 0, physicalPhoneTested: false,
    hiddenPrivateReads: counts.privateReads, snapshotWrites: counts.writes,
    countDefinition: 'All externally invoked pilot exports, observation calls, factories, and diagnostics count toward the hard 100-call bound. Pure independent geometry/facts/rank utility calls construct fixtures only and perform no search. Internal pilot calls are bounded by its own reviewed search limits.',
    observationMeaning: 'Hand-authored public fixture observations with synthetic permanent receipts and charged ledgers, not production transitions or captured gameplay.',
    limitations: ['This does not prove the three authored levels are solvable or that browser input timing is correct.', 'The permanent-receipt and undo checks test the pilot against explicit synthetic public transitions, not the production Model.', 'Private-read traps cover arbitrary underscore-prefixed reads and five throwing private accessors; all actual puzzle targets remain public.']
  }
};
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify({ output, passed, checks: checks.length, counts, sourceUnchanged, failure }) + '\n');
if (!passed) process.exitCode = 1;
