// STATIC REVIEW CANDIDATE: run only after root has read this entire script and explicitly approved.
// Synthetic controller isolation only; evaluateBoard fills fixtures and is NOT an independent rule oracle.
// node review.mjs --app /path/triangular-tessera --out /path/report.json --expected-pilot 70d897...
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const PIN = { pilot: '70d897c22491ec011bddff76a9b38da2de4c6ca13763ebc4de6556bcfee49e8d', contract: '4c53cd5a8832c22e1fa685f7b3488dbd7edede87406904dd39142ca041d923f8' };
const argv = process.argv.slice(2), args = {};
assert.equal(argv.length, 6, 'Exactly --app, --out and --expected-pilot are required');
for (let i = 0; i < argv.length; i += 2) { assert.ok(['--app', '--out', '--expected-pilot'].includes(argv[i])); assert.equal(args[argv[i]], undefined); args[argv[i]] = argv[i + 1]; }
assert.ok(args['--app'] && args['--out']); assert.equal(args['--expected-pilot'], PIN.pilot);
const app = path.resolve(args['--app']), out = path.resolve(args['--out']);
const files = { pilot: path.join(app, 'tests/automation.mjs'), contract: path.join(app, 'docs/model-contract.md'), modelBytesOnly: path.join(app, 'src/main/assets/game-model.js'), script: fileURLToPath(import.meta.url) };
// Model is only an uninterpreted Buffer passed directly to crypto. No decode, import or execution.
async function hashes() { return Object.fromEntries(await Promise.all(Object.entries(files).map(async ([k, file]) => [k, createHash('sha256').update(await readFile(file)).digest('hex')]))); }
const startHashes = await hashes(), startedAt = new Date().toISOString();
let importHashes = null, failure = null;
const counts = { publicObservationsAndExports: 0, observations: 0, exports: 0, diagnostics: 0, factories: 0, aggregateIncludingFactories: 0, frozenSnapshots: 0, privateReads: 0, writes: 0 };
const checks = [], trace = [], details = {};
const copy = value => structuredClone(value);
function invoke(kind, fn, ...values) {
  if (kind !== 'factories') { assert.ok(counts.publicObservationsAndExports < 24, 'Hard public observation/export cap reached'); counts.publicObservationsAndExports++; }
  else assert.ok(counts.factories < 3, 'Only three independent factories are permitted');
  counts[kind]++; counts.aggregateIncludingFactories++;
  return fn(...values);
}
function check(name, fn) { try { fn(); checks.push({ name, passed: true }); } catch (e) { checks.push({ name, passed: false, error: String(e.stack || e) }); throw e; } }

try {
  assert.equal(startHashes.pilot, PIN.pilot); assert.equal(startHashes.contract, PIN.contract);
  const api = await import(pathToFileURL(files.pilot).href); // The ONLY executable app import.
  importHashes = await hashes(); assert.deepEqual(importHashes, startHashes, 'Sources changed across pilot import');
  const exported = (name, ...values) => invoke('exports', api[name], ...values);
  const factory = () => invoke('factories', api.createPilot);
  const diagnostic = p => invoke('diagnostics', p.diagnostics);
  const vertices = [[0, 0], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]].map(([u, v], i) => ({ id: 'V' + (i + 1), u, v, x: 324 + 190 * (u + v / 2), y: 270 + 190 * Math.sqrt(3) * v / 2 }));
  // Hand-made colors, not an authored board or feasibility table. A reference target arrangement
  // has per-tile colors BGR / RGR / RBG / GRG / GGB / BRB, giving targets R3/G3/B2.
  // Initial T1 and T2 are each mirrored relative to that hand construction; at least two edits remain.
  const colorRows = [['B', 'G', 'R'], ['R', 'G', 'R'], ['R', 'B', 'G'], ['G', 'R', 'G'], ['G', 'G', 'B'], ['B', 'R', 'B']];
  const sectors = colorRows.flatMap((colors, t) => colors.map((colorId, s) => ({ id: `T${t + 1}S${s + 1}`, tileId: `T${t + 1}`, mark: s + 1, colorId, slotIndex: s })));
  const tiles = colorRows.map((_, t) => {
    const id = 'T' + (t + 1), vertexIds = ['V1', 'V' + (t + 2), 'V' + ((t + 1) % 6 + 2)], vs = vertexIds.map(id => vertices.find(v => v.id === id));
    const center = { x: vs.reduce((n, v) => n + v.x, 0) / 3, y: vs.reduce((n, v) => n + v.y, 0) / 3 };
    return { id, vertexIds, vertices: copy(vs), center, ...center, slotSectorIds: [id + 'S1', id + 'S2', id + 'S3'], mirrorAxis: { a: { x: vs[2].x, y: vs[2].y }, b: { x: (vs[0].x + vs[1].x) / 2, y: (vs[0].y + vs[1].y) / 2 } } };
  });
  for (const t of tiles.slice(0, 2)) t.slotSectorIds = [t.slotSectorIds[0], t.slotSectorIds[2], t.slotSectorIds[1]];
  const base = { width: 960, height: 540, seed: 90219, level: 1, difficulty: 0, levelName: 'Independent synthetic protocol fixture',
    projection: { x: 324, y: 270, unit: 190 }, colors: ['R', 'G', 'B'].map(id => ({ id, name: id, rgb: [128, 128, 128] })), vertices, sectors, tiles,
    targetRegions: { R: 3, G: 3, B: 2 }, focusItems: tiles.map(t => ({ id: t.id, kind: 'tile', x: t.x, y: t.y })), selectedId: 'T1',
    phase: 'playing', tick: 60, elapsed: 1, timeLimit: 90, remaining: 89, movesUsed: 0, moveLimit: 8, movesRemaining: 8,
    rotationCount: 0, mirrorCount: 0, historyDepth: 0, history: [], lastOperation: null, lostReason: null, lastAction: null, events: [], message: 'Synthetic public fixture' };
  function time(m, tick) { const result = copy(m); result.tick = tick; result.elapsed = tick / 60; result.remaining = 90 - result.elapsed; return result; }
  function cache(m) {
    const facts = exported('evaluateBoard', m); // Shared pilot evaluator is merely fixture-cache construction.
    const { assignments: unused, ...visibleFacts } = facts; Object.assign(m, visibleFacts);
    for (const t of m.tiles) {
      t.slotColors = t.slotSectorIds.map(id => m.sectors.find(s => s.id === id).colorId);
      t.slots = t.slotSectorIds.map((id, i) => { const s = m.sectors.find(s => s.id === id); s.slotIndex = i;
        const edge = m.edges.find(e => e.incidences.some(p => p.tileId === t.id && p.slotIndex === i));
        return { index: i, edgeId: edge.id, sectorId: id, mark: s.mark, colorId: s.colorId, polygon: [copy(t.center), { x: t.vertices[i].x, y: t.vertices[i].y }, { x: t.vertices[(i + 1) % 3].x, y: t.vertices[(i + 1) % 3].y }], regionId: m.regions.find(r => r.sectorIds.includes(id)).id }; });
    }
    m.cursor = copy(m.focusItems.find(f => f.id === m.selectedId)); m.score = m.matchedEdgeCount * 40 + m.matchedRegionColorCount * 100; return m;
  }
  cache(base); assert.equal(base.goalReady, false);
  // The public planner may choose any cheapest first operation. This is a protocol fixture,
  // not an independent proof of its CSP correctness or optimality.
  const plan = exported('planVisibleState', base, { maxExpanded: 10000, maxMilliseconds: 250, maxMoves: 8 });
  assert.ok(plan.found && plan.cost >= 2 && plan.operations.length === plan.cost);
  const operation = plan.operations[0]; assert.ok(['rotate', 'mirror'].includes(operation.kind));
  base.selectedId = operation.tileId; base.cursor = copy(base.focusItems.find(f => f.id === base.selectedId));
  // A free-focus, one-second public observation is sufficient; no synthetic claim of Model.create.
  const after = time(base, 91), changed = after.tiles.find(t => t.id === operation.tileId), beforeIds = [...changed.slotSectorIds];
  const expectedIds = operation.kind === 'rotate' ? [beforeIds[2], beforeIds[0], beforeIds[1]] : [beforeIds[0], beforeIds[2], beforeIds[1]];
  const colorsFor = ids => ids.map(id => after.sectors.find(s => s.id === id).colorId);
  const receipt = { id: 1, kind: operation.kind, tileId: operation.tileId, beforeSectorIds: beforeIds, afterSectorIds: [...expectedIds], beforeColors: colorsFor(beforeIds), afterColors: colorsFor(expectedIds),
    colorChanged: JSON.stringify(colorsFor(beforeIds)) !== JSON.stringify(colorsFor(expectedIds)), at: 91 / 60, tick: 91 };
  changed.slotSectorIds = [...expectedIds]; after.movesUsed = 1; after.movesRemaining = 7; after.historyDepth = 1;
  after.rotationCount = Number(operation.kind === 'rotate'); after.mirrorCount = Number(operation.kind === 'mirror');
  after.history = [copy(receipt)]; after.lastOperation = copy(receipt); cache(after); assert.equal(after.goalReady, false, 'Pending success needs an ordinary nonterminal observation');
  const wrong = copy(after), corruptTile = wrong.tiles.find(t => t.id === 'T4');
  const i = corruptTile.slotSectorIds.indexOf('T4S1'), j = corruptTile.slotSectorIds.indexOf('T4S3');
  assert.equal(wrong.sectors.find(s => s.id === 'T4S1').colorId, wrong.sectors.find(s => s.id === 'T4S3').colorId);
  [corruptTile.slotSectorIds[i], corruptTile.slotSectorIds[j]] = [corruptTile.slotSectorIds[j], corruptTile.slotSectorIds[i]]; cache(wrong);
  assert.deepEqual(wrong.regionCounts, after.regionCounts); assert.equal(wrong.matchedEdgeCount, after.matchedEdgeCount); assert.equal(wrong.score, after.score);
  assert.deepEqual(wrong.tiles.map(t => t.slotColors), after.tiles.map(t => t.slotColors)); assert.deepEqual(wrong.history, after.history);

  function snapshot(m, variant, paused = false) {
    const state = { phase: m.phase, paused, model: copy(m) }, hiddenBacking = variant === 'left' ? ['private-left'] : ['private-right'];
    for (const object of [state, state.model]) for (const key of ['_private', '_input', '_route', '_expected']) Object.defineProperty(object, key, { get() { counts.privateReads++; throw Error('Forbidden private getter ' + key + ':' + hiddenBacking[0]); } });
    function freeze(value) {
      if (!value || typeof value !== 'object') return value;
      for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(value))) if ('value' in desc && desc.configurable) {
        const child = freeze(desc.value); Object.defineProperty(value, key, { enumerable: desc.enumerable, configurable: true, get() { return child; }, set() { counts.writes++; throw Error('Frozen public snapshot write'); } });
      }
      Object.freeze(value);
      if (value !== state && value !== state.model) return value; // Nested receipts must remain structuredClone-compatible.
      return new Proxy(value, { get(target, key, receiver) { if (typeof key === 'string' && key.startsWith('_')) { counts.privateReads++; throw Error('Forbidden private read ' + key); } return Reflect.get(target, key, receiver); },
        set() { counts.writes++; throw Error('Frozen root write'); }, defineProperty() { counts.writes++; throw Error('Frozen root definition'); }, deleteProperty() { counts.writes++; throw Error('Frozen root deletion'); }, setPrototypeOf() { counts.writes++; throw Error('Frozen root prototype'); } });
    }
    const frozen = freeze(state);
    function verify(value) { if (!value || typeof value !== 'object') return; assert.ok(Object.isFrozen(value)); for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(value))) if (!key.startsWith('_')) verify('value' in desc ? desc.value : desc.get?.call(value)); }
    verify(frozen); counts.frozenSnapshots++; return frozen;
  }
  function observe(p, m, label, variant = 'left', paused = false) {
    const keys = invoke('observations', p, snapshot(m, variant, paused), { mode: 'qa' });
    assert.ok(Array.isArray(keys) && keys.length <= 1 && keys.every(k => ['Space', 'b', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)));
    trace.push({ label, variant, synthetic: true, elapsed: m.elapsed, paused, keys: [...keys], movesUsed: m.movesUsed, movesRemaining: m.movesRemaining, selectedId: m.selectedId }); return keys;
  }
  const left = factory(), right = factory(), negative = factory(), key = operation.kind === 'rotate' ? 'Space' : 'b';
  const start = p => [observe(p, base, 'initialize'), observe(p, time(base, 78), 'public-preview'), observe(p, time(base, 90), 'ordinary-transform-edge')];
  check('Independent factories and inaccessible private state emit the same ordinary transform edge', () => {
    const a = start(left); assert.deepEqual(diagnostic(right), [], 'Driving left must not initialize right');
    const b = [observe(right, base, 'initialize', 'right'), observe(right, time(base, 78), 'public-preview', 'right'), observe(right, time(base, 90), 'ordinary-transform-edge', 'right')];
    assert.deepEqual(a, [[], [], [key]]); assert.deepEqual(a, b);
  });
  check('Release then exact physical receipt and charged counters are accepted from ordinary nonterminal observations', () => {
    for (const [p, variant] of [[left, 'left'], [right, 'right']]) {
      assert.deepEqual(observe(p, time(after, 94), 'release-transform-key', variant), []);
      assert.deepEqual(observe(p, time(after, 96), 'accept-exact-physical-receipt', variant), []);
    }
    const beforePause = diagnostic(left); assert.equal(beforePause.filter(e => e.type === 'observed-operation').length, 1);
    assert.deepEqual(beforePause.find(e => e.type === 'observed-operation').receipt, receipt);
    assert.deepEqual(observe(left, time(after, 96), 'paused-observation', 'left', true), []); assert.deepEqual(diagnostic(left), beforePause);
  });
  check('Equal-color physical-ID corruption is rejected despite identical colors, regions, score, receipt and counters', () => {
    assert.deepEqual(start(negative), [[], [], [key]]);
    assert.deepEqual(observe(negative, time(wrong, 94), 'negative-release'), []);
    assert.throws(() => observe(negative, time(wrong, 96), 'reject-equal-color-ID-swap'), /Actual transform disagrees with physical IDs, operation kind, focus or charged budget/);
  });
  check('Private reads and writes remain zero within the explicit small interface budget', () => {
    assert.equal(counts.privateReads, 0); assert.equal(counts.writes, 0); assert.equal(counts.publicObservationsAndExports, 23); assert.equal(counts.factories, 3);
    assert.equal(counts.aggregateIncludingFactories, 26); assert.equal(counts.publicObservationsAndExports, counts.observations + counts.exports + counts.diagnostics);
  });
  details.fixture = { colorRows, targetRegions: base.targetRegions, initialAssignments: base.tiles.map(t => ({ tileId: t.id, slotSectorIds: t.slotSectorIds })), initialSelectedId: base.selectedId };
  details.publicPlanForProtocolOnly = { cost: plan.cost, firstOperation: operation }; details.manuallyExpectedReceipt = receipt;
  details.negative = { wrongTile: 'T4', sameColorSwappedIds: ['T4S1', 'T4S3'], expectedThrow: 'Actual transform disagrees with physical IDs, operation kind, focus or charged budget' };
} catch (e) { failure = String(e.stack || e); }
const endHashes = await hashes(), sourceUnchanged = JSON.stringify(startHashes) === JSON.stringify(importHashes) && JSON.stringify(startHashes) === JSON.stringify(endHashes);
const passed = !failure && sourceUnchanged && checks.length === 4 && checks.every(c => c.passed);
const report = { schemaVersion: 1, game: 'triangular-tessera', evidenceKind: 'small-synthetic-controller-isolation', startedAt, completedAt: new Date().toISOString(), passed, counts,
  limits: { publicObservationsAndExportsIncludingDiagnostics: 24, factoriesSeparatelyCounted: 3 }, startHashes, importHashes, endHashes, sourceUnchanged, checks, details, trace, failure,
  scope: { syntheticOnly: true, ownColorTable: true, publicEvaluatorUsedOnlyForFixtureCaches: true, independentGeometryOrOptimalityProof: false, modelBytesHashedOnly: true,
    modelDecoded: false, modelImported: false, modelExecuted: false, authorTablesOrRoutesRead: false, browserExecuted: false, actualGameWinsClaimed: 0, physicalPhoneTested: false,
    expectedNegativeThrows: 1, doubleMirrorRetestIncluded: false, limitation: 'Manual synthetic observations isolate controller receipt/ID/accounting behavior; actual gameplay, geometry, CSP optimality and B-twice charging are covered elsewhere.' } };
await mkdir(path.dirname(out), { recursive: true }); await writeFile(out, JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify({ out, passed, checks: checks.length, counts, sourceUnchanged, failure }) + '\n'); if (!passed) process.exitCode = 1;
