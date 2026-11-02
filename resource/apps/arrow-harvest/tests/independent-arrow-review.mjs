// Read-only independent review of already-recorded normal rounds. Does not
// import/step Model or pilot, search solutions, or replay ordinary games.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { inspectGeometry, predictByArrivalTimes } from './arrow-path-oracle.mjs';
const argv = process.argv.slice(2), arg = (name, fallback) => { const i = argv.indexOf(name); return i < 0 ? fallback : argv[i + 1]; };
const here = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(arg('--app', path.join(here, '..')));
const ROUNDS = path.resolve(arg('--rounds', '/workspace/scratch/hundred-games/arrow-harvest/ordinary-rounds-first'));
const FORMAL = path.resolve(arg('--formal-evidence', '/workspace/scratch/hundred-games/arrow-harvest/model-tests-first/source-revisit-atomic.json'));
const OUT = path.resolve(arg('--output', '/workspace/scratch/hundred-games/arrow-harvest/independent-review-first'));
const read = p => JSON.parse(fs.readFileSync(p, 'utf8')), sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const relative = p => path.relative(APP, p).split(path.sep).join('/');
const sourcePaths = { model: path.join(APP, 'src/main/assets/game-model.js'), automation: path.join(APP, 'tests/automation.mjs'), tests: path.join(APP, 'tests/game-model.test.cjs'), contract: path.join(APP, 'docs/model-contract.md'), math: path.join(here, 'arrow-path-oracle.mjs'), review: fileURLToPath(import.meta.url) };
const hashes = () => Object.fromEntries(Object.entries(sourcePaths).map(([k, p]) => [k, sha(p)]));
const beforeHashes = hashes(), checks = [], evidence = [], results = [];
const startedAt = new Date().toISOString();
assert.ok(!fs.existsSync(OUT), 'Fresh output directory preserves any previous failure');
fs.mkdirSync(OUT, { recursive: true });
const copy = v => JSON.parse(JSON.stringify(v)), equal = (a, b, label) => assert.deepEqual(a, b, label);
const directions = ['N', 'E', 'S', 'W'];
const publicDefinitions = [
  { sources: [0, 15], stops: [1, 14], forbidden: [5, 6, 9, 10], editable: [0, 4, 7, 13, 15], arrows: ['E', null, 'W', 'W', 'N', null, null, 'W', 'S', null, null, 'N', 'E', 'N', null, 'W'] },
  { sources: [4, 9], stops: [6, 11], forbidden: [5, 10], editable: [1, 3, 4, 9, 13, 15], arrows: ['E', 'N', 'E', 'W', 'S', null, null, 'W', 'S', 'W', null, null, 'E', 'N', 'E', 'W'] },
  { sources: [0, 4, 10], stops: [5, 7, 13], forbidden: [3, 12], editable: [0, 1, 4, 9, 10, 11, 14], arrows: ['S', 'N', 'S', null, 'E', null, 'E', null, 'E', 'S', 'N', 'N', null, null, 'E', 'W'] }
];
function boardFromDefinition(d) {
  return { grid: { rows: 4, cols: 4, x: 104, y: 108, cellSize: 84 }, cells: d.arrows.map((initialArrow, i) => ({
    id: `C${i + 1}`, row: Math.floor(i / 4), col: i % 4,
    role: d.sources.includes(i) ? 'source' : d.stops.includes(i) ? 'stop' : d.forbidden.includes(i) ? 'forbidden' : 'field',
    target: !d.forbidden.includes(i), editable: d.editable.includes(i), initialArrow
  })) };
}
const boards = publicDefinitions.map(boardFromDefinition), boardFacts = boards.map(inspectGeometry);
function group(name, fn) { fn(); checks.push({ name, passed: true }); }
function assertFields(actual, expected, label) { for (const [key, value] of Object.entries(expected)) equal(actual[key], value, `${label}.${key}`); }

// Sparse hand-labelled public 4x4 fixtures, not production model states or games.
function handBoard(roles, arrows) {
  const d = { sources: [], stops: [], forbidden: [], editable: [], arrows: Array(16).fill(null) };
  for (let i = 0; i < 16; i++) {
    const role = roles[i] ?? 'forbidden';
    if (role === 'source') d.sources.push(i); if (role === 'stop') d.stops.push(i); if (role === 'forbidden') d.forbidden.push(i);
    if (role === 'source' || role === 'field') d.arrows[i] = arrows[i];
  }
  return boardFromDefinition(d);
}
function pureFixtures() {
  const cases = [
    { name: 'two simultaneous legal stops', roles: { 0: 'source', 1: 'stop', 4: 'source', 5: 'stop' }, arrows: { 0: 'E', 4: 'E' }, reason: null, covered: 4, wave: 1 },
    { name: 'same-wave unvisited destination', roles: { 0: 'source', 5: 'source', 4: 'field', 1: 'stop', 8: 'stop' }, arrows: { 0: 'S', 5: 'W', 4: 'S' }, reason: 'overlap', covered: 2, wave: 1 },
    { name: 'old source blocks another legal stop atomically', roles: { 0: 'source', 4: 'source', 5: 'stop', 1: 'stop' }, arrows: { 0: 'S', 4: 'E' }, reason: 'overlap', covered: 2, wave: 1 },
    { name: 'own return has finite first duplicate', roles: { 0: 'source', 1: 'field', 4: 'stop' }, arrows: { 0: 'E', 1: 'W' }, reason: 'overlap', covered: 2, wave: 2 },
    { name: 'outside takes priority while retaining another revisit', roles: { 0: 'source', 4: 'source', 1: 'stop', 5: 'stop' }, arrows: { 0: 'N', 4: 'N' }, reason: 'forbidden', covered: 2, wave: 1 }
  ];
  for (const f of cases) {
    const b = handBoard(f.roles, f.arrows), p = predictByArrivalTimes(b, b.cells.map(c => c.initialArrow));
    equal(p.final.lostReason, f.reason, f.name); equal(p.final.coveredCount, f.covered); equal(p.final.waveIndex, f.wave);
    if (f.name.startsWith('same-wave')) equal(p.waves[0].wave.issues.simultaneousCellIds, ['C5']);
    if (f.name.startsWith('old source')) { equal(p.waves[0].wave.intents.length, 2); equal(p.final.stoppedSeedCount, 0); equal(p.waves[0].wave.newlyCoveredIds, []); }
    if (f.name.startsWith('outside')) { equal(p.waves[0].wave.issues.outsideSeedIds, ['S1']); equal(p.waves[0].wave.issues.revisitedCellIds, ['C1']); }
  }
  results.push({ scope: 'Pure oracle hand calculations only; no production execution', fixtures: cases.map(c => c.name) });
}

function validateSnapshot(m, level, prediction = null) {
  const board = boards[level - 1], facts = boardFacts[level - 1];
  equal(m.grid, board.grid); equal(inspectGeometry(m), facts, 'Immutable public board facts');
  assertFields(m, { level, difficulty: level - 1, seed: 1, width: 960, height: 540, timeLimit: 90, waveIntervalTicks: 30 });
  assert.ok(Number.isInteger(m.tick) && m.tick >= 0 && m.tick <= 5400);
  equal(m.elapsed, m.tick / 60); equal(m.remaining, Math.max(0, 90 - m.elapsed));
  for (const key of ['sourceIds', 'stopIds', 'targetIds', 'forbiddenIds', 'editableIds']) equal(m[key], facts[key]);
  for (const [key, ids] of [['sourceCount', facts.sourceIds], ['stopCount', facts.stopIds], ['targetCount', facts.targetIds], ['editableCount', facts.editableIds]]) equal(m[key], ids.length);
  const cursorCell = m.cells.find(c => c.id === m.selectedId); assert.ok(cursorCell);
  equal(m.cursor, Object.fromEntries(['id', 'row', 'col', 'x', 'y', 'editable', 'role'].map(k => [k, cursorCell[k]])));
  const arrows = m.cells.map(c => c.arrow);
  for (let i = 0; i < 16; i++) {
    const cell = m.cells[i]; equal(cell.x, 104 + (cell.col + .5) * 84); equal(cell.y, 108 + (cell.row + .5) * 84);
    if (!cell.editable) equal(arrows[i], cell.initialArrow); else assert.ok(directions.includes(arrows[i]));
    equal(cell.coverageCount, m.coverageCounts[i]); equal(cell.covered, m.coverageCounts[i] === 1);
    equal(cell.seedIds, m.seeds.filter(s => s.cellId === cell.id).map(s => s.id));
  }
  if (!m.launchCount) {
    equal(m.phase, 'playing'); equal(m.mode, 'editing'); equal(m.runArrows, null); equal(m.coverageCounts, Array(16).fill(0));
    equal(m.seeds, facts.sourceIds.map((id, i) => ({ id: `S${i + 1}`, sourceId: id, cellId: id, status: 'waiting', steps: 0, stopId: null, stoppedAtWave: null })));
    assertFields(m, { waveIndex: 0, acceptedWaves: 0, nextWaveTick: null, waveProgress: 0, lastWave: null, activeSeedCount: 0, stoppedSeedCount: 0, allSeedsStopped: false, coveredTargetIds: [], uncoveredTargetIds: facts.targetIds, coveredCount: 0, remainingTargetCount: facts.targetIds.length, allTargetsCovered: false, goalReady: false, failure: null });
  } else {
    equal(m.launchCount, 1); equal(arrows, m.runArrows); assert.ok(prediction);
    const expected = m.waveIndex ? prediction.waves[m.waveIndex - 1]?.after : prediction.launch; assert.ok(expected);
    assertFields(m, expected, 'Actual prefix');
    if (m.waveIndex) {
      equal(m.lastWave, { ...prediction.waves[m.waveIndex - 1].wave, tick: m.sowingStartedTick + 30 * m.waveIndex, at: (m.sowingStartedTick + 30 * m.waveIndex) / 60 });
    } else equal(m.lastWave, null);
    if (m.phase === 'playing') {
      equal(m.mode, 'propagating'); equal(m.failure, null);
      equal(m.nextWaveTick, m.sowingStartedTick + 30 * (m.waveIndex + 1));
      equal(m.waveProgress, Math.min(1, Math.max(0, (m.tick - (m.nextWaveTick - 30)) / 30)));
    } else {
      assertFields(m, prediction.final, 'Terminal'); equal(m.nextWaveTick, null); equal(m.waveProgress, 0);
      equal(m.tick, m.sowingStartedTick + 30 * m.waveIndex);
    }
    equal(m.sowingStartedAt, m.sowingStartedTick / 60);
  }
  equal(m.score, m.coveredCount * 40 + (m.phase === 'won' ? 1000 + Math.floor(m.remaining) * 5 : 0));
}

function reviewRound(raw, expectedResult) {
  const { level, mode, name } = expectedResult, initial = raw.initial.model, final = raw.final.model;
  equal(raw.result, expectedResult); equal(raw.failure, null); equal(raw.initial.phase, 'playing'); equal(initial.tick, 0); equal(initial.editCount, 0); equal(initial.lastEdit, null);
  equal(initial.cells.map(c => c.arrow), publicDefinitions[level - 1].arrows); equal(initial.selectedId, boardFacts[level - 1].editableIds[0]);
  validateSnapshot(initial, level);
  const prediction = predictByArrivalTimes(initial, final.runArrows), edited = [...publicDefinitions[level - 1].arrows];
  let edits = 0, launch = null, previousTick = -1; const waveIds = [];
  assert.ok(raw.retained.length > 0); equal(raw.receipts.length, raw.retained.length);
  for (let i = 0; i < raw.retained.length; i++) {
    const { state, seconds } = raw.retained[i], m = state.model;
    assert.ok(m.tick >= previousTick); previousTick = m.tick; equal(seconds, m.elapsed); equal(state.phase, m.phase);
    if (m.editCount !== edits) {
      equal(m.editCount, edits + 1); assert.equal(m.launchCount, 0); const e = m.lastEdit, cellIndex = m.cells.findIndex(c => c.id === e.cellId);
      assert.ok(m.cells[cellIndex].editable); equal(e.id, m.editCount); equal(e.before, edited[cellIndex]);
      equal(e.after, directions[(directions.indexOf(e.before) + 1) % 4]); edited[cellIndex] = e.after; edits++;
      equal(e.at, e.tick / 60); equal(m.selectedId, e.cellId);
      assert.ok(raw.inputChanges.some(input => input.tick + 1 === e.tick && input.to.includes('Space') && !input.from.includes('Space')), 'Rotation has ordinary fresh A edge');
    }
    equal(m.cells.map(c => c.arrow), edited, 'Only recorded clockwise edits change arrows');
    if (m.launchCount && !launch) { launch = m; equal(m.runArrows, edited); assert.ok(raw.inputChanges.some(input => input.tick + 1 === m.sowingStartedTick && input.to.includes('b') && !input.from.includes('b'))); }
    if (launch) { equal(m.runArrows, launch.runArrows); equal(m.editCount, launch.editCount); equal(m.selectedId, launch.selectedId); }
    validateSnapshot(m, level, prediction);
    if (m.waveIndex && !waveIds.includes(m.waveIndex)) waveIds.push(m.waveIndex);
    const r = raw.receipts[i]; equal(r.observedAt, m.elapsed);
    for (const k of ['phase', 'mode', 'selectedId', 'editCount', 'launchCount', 'waveIndex', 'acceptedWaves', 'coverageCounts', 'seeds', 'lastEdit', 'lastWave']) equal(r[k], m[k]);
    equal(r.arrows, edited);
  }
  equal(waveIds, prediction.waves.map(w => w.wave.id), 'Every actual attempted wave retained');
  equal(raw.retained.at(-1).state, raw.final); validateSnapshot(final, level, prediction);
  for (const key of ['level', 'phase', 'lostReason', 'elapsed', 'editCount', 'launchCount', 'waveIndex', 'acceptedWaves', 'coveredCount', 'targetCount', 'stoppedSeedCount', 'sourceCount', 'score']) equal(expectedResult[key], final[key], `Round summary ${key}`);
  equal(raw.inputChanges.filter(i => i.to.includes('b')).length, 1);
  assert.ok(raw.inputChanges.filter(i => i.elapsed > final.sowingStartedAt).every(i => i.to.length === 0));
  if (mode === 'record') { equal(final.phase, 'won'); assert.ok(final.elapsed >= 30 && final.elapsed < 90); assert.ok(edits > 1); }
  else {
    equal(final.phase, 'lost'); equal(final.lostReason, ['incomplete', 'overlap', 'forbidden'][level - 1]);
    if (level === 2) assert.ok(final.lastWave.issues.simultaneousCellIds.length > 0);
  }
  results.push({ name, level, mode, rawFileSha256: sha(path.join(ROUNDS, name + '.json')), statesChecked: raw.retained.length + 1, editedArrowCount: edits, attemptedWaves: final.waveIndex, acceptedWaves: final.acceptedWaves, coveredCount: final.coveredCount, phase: final.phase, lostReason: final.lostReason, score: final.score, pathLengths: prediction.pathLengths, naturalAttemptBound: prediction.naturalAttemptBound });
}

let failure = null;
try {
  group('Independent path-time oracle matches five hand-calculated fixtures', pureFixtures);
  const reportPath = path.join(ROUNDS, 'report.json'), ordinary = read(reportPath);
  group('Exact six-case identity and immutable source window', () => {
    equal(ordinary.passed, true); equal(ordinary.sourceUnchanged, true); equal(ordinary.setupFailure, null); equal(ordinary.startHashes, ordinary.endHashes);
    for (const k of ['model', 'automation', 'contract']) equal(ordinary.startHashes[k], beforeHashes[k]);
    equal(ordinary.results.map(r => `${r.name}:${r.level}:${r.mode}`).sort(), [1, 2, 3].flatMap(level => [`level${level}-record:${level}:record`, `level${level}-loss:${level}:loss`]).sort());
    assert.ok(ordinary.results.every(r => r.passed)); evidence.push({ role: 'only-six-ordinary-rounds', file: 'report.json', sha256: sha(reportPath), scope: ordinary.scope });
  });
  group('Existing six ordinary rounds: public boards, edit receipts, complete atomic waves and exact terminal state', () => {
    for (const result of ordinary.results) reviewRound(read(path.join(ROUNDS, result.name + '.json')), result);
  });
  // The focused formal suite owns this already-executed boundary. This review
  // consumes its snapshots only; no extra Model import, fixture or seventh game.
  group('Read-only formal evidence: old-source revisit rejects the entire simultaneous batch', () => {
    const formalReportPath = path.join(path.dirname(FORMAL), 'report.json'), formal = read(formalReportPath);
    equal(formal.passed, true); equal(formal.sourceUnchanged, true); equal(formal.sourceHashesBefore, formal.sourceHashesAfter);
    equal(formal.modelSha256, beforeHashes.model); equal(formal.contractSha256, beforeHashes.contract);
    equal(formal.testSourceSha256, beforeHashes.tests);
    equal(formal.evidence[path.basename(FORMAL)].sha256, sha(FORMAL));
    evidence.push({ role: 'formal-source-window', file: 'report.json', sha256: sha(formalReportPath) });
    const e = read(FORMAL), initial = e.beforeSow, after = e.afterFailedWave;
    equal(initial.level, 3); equal(initial.cells.map(c => c.arrow), publicDefinitions[2].arrows);
    const prediction = predictByArrivalTimes(initial, after.runArrows);
    validateSnapshot(initial, 3); validateSnapshot(after, 3, prediction);
    equal(after.lostReason, 'overlap'); equal(after.waveIndex, 1); equal(after.acceptedWaves, 0); equal(after.coveredCount, 3); equal(after.stoppedSeedCount, 0);
    equal(after.lastWave.issues.revisitedCellIds, ['C5']); equal(after.lastWave.intents.length, 3); equal(after.lastWave.newlyCoveredIds, []);
    evidence.push({ role: 'existing-formal-old-source-boundary', file: path.basename(FORMAL), sha256: sha(FORMAL), scope: 'Recomputed saved public state; no Model execution by this review' });
  });
} catch (error) { failure = { message: error.message, stack: error.stack }; }
const afterHashes = hashes(), sourceUnchanged = JSON.stringify(beforeHashes) === JSON.stringify(afterHashes);
const report = { passed: !failure && sourceUnchanged, checks: checks.length, scope: 'Independent path-time mathematics and read-only verification of QA six ordinary rounds plus one already-executed formal boundary. No Model or pilot import, authored routes, solution search, browser or hardware test.', startedAt, completedAt: new Date().toISOString(), sourceHashesBefore: beforeHashes, sourceHashesAfter: afterHashes, sourceUnchanged, sourcePaths: Object.fromEntries(Object.entries(sourcePaths).map(([k, p]) => [k, relative(p)])), results: checks, evidence, details: results, failure };
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify({ passed: report.passed, checks: report.checks, sourceUnchanged, failure: failure?.message ?? null }) + '\n');
if (!report.passed) process.exitCode = 1;
