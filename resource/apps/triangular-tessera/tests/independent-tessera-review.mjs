// Independent geometry/enumeration plus one ordinary counterexample. Existing QA rounds are read, never rerun.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { positiveSegmentOverlap, prepareBoard, evaluateArrangement, transform, physicalOrientations, enumeratePublicBoard } from './independent-tessera-math.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2);
const arg = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const app = path.resolve(arg('--app', path.join(here, '..'))), output = path.resolve(arg('--output', '/tmp/triangular-tessera-independent.json'));
const ordinaryPath = arg('--ordinary-report', null);
assert.ok(ordinaryPath, '--ordinary-report is required: the unique six rounds must already exist');
assert.ok(!fs.existsSync(output), 'refuse to overwrite prior independent evidence');
const files = { model: path.join(app, 'src/main/assets/game-model.js'), contract: path.join(app, 'docs/model-contract.md'),
  automation: path.join(app, 'tests/automation.mjs'), math: path.join(here, 'independent-tessera-math.mjs'), review: fileURLToPath(import.meta.url) };
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const hashes = () => Object.fromEntries(Object.entries(files).map(([k, p]) => [k, hash(p)]));
const beforeHashes = hashes(), results = [], proofs = [], initialBoards = [];
const report = { passed: false, scope: 'Independent exact sector-boundary geometry and exhaustive public color states; one fresh ordinary edge-only counterexample. The six recorded model rounds are verified from existing evidence, not executed again.',
  sourceHashesBefore: beforeHashes, modelSha256: beforeHashes.model, automationSha256: beforeHashes.automation, contractSha256: beforeHashes.contract,
  mathSha256: beforeHashes.math, reviewSourceSha256: beforeHashes.review, results, proofs, actualModelCounterexamples: [], reusedOrdinaryEvidence: [] };
let Model, actualTicks = 0, snapshotChecks = 0;
const assignments = s => s.tiles.map(t => [...t.slotSectorIds]);
const clone = value => JSON.parse(JSON.stringify(value, (key, child) => key.startsWith('_') ? undefined : child));
function check(name, callback) { const details = callback(); results.push({ name, passed: true, ...details }); }

function inspect(s, initial) {
  const p = prepareBoard(s), actual = assignments(s), f = evaluateArrangement(p, actual); snapshotChecks++;
  assert.deepEqual(s.vertices.map(v => [v.u, v.v]), [[0,0],[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]]);
  assert.equal(p.geometry.nodes.length, 18); assert.equal(p.geometry.sharedEdges.length, 6);
  assert.equal(p.geometry.adjacency.filter(e => e.kind === 'within-tile').length, 18);
  const pairKey = ids => ids.sort().join('|');
  const geometricPairs = p.geometry.sharedEdges.map(e => pairKey([p.geometry.nodes[e.a].id,p.geometry.nodes[e.b].id])).sort();
  assert.deepEqual(geometricPairs, s.tiles.map((t,i)=>pairKey([t.id+'@0',s.tiles[(i+5)%6].id+'@2'])).sort());
  assert.deepEqual(s.edges.filter(e=>e.shared).map(e=>pairKey(e.incidences.map(v=>v.tileId+'@'+v.slotIndex))).sort(),geometricPairs);
  for (const edge of s.edges) {
    const edgeColors=edge.incidences.map(v=>p.sectorMap.get(actual[s.tiles.findIndex(t=>t.id===v.tileId)][v.slotIndex]).colorId);
    assert.deepEqual(edge.colorIds,edgeColors); assert.equal(edge.matched,edge.shared?edgeColors[0]===edgeColors[1]:null);
  }
  assert.deepEqual(s.targetRegions,initial.targetRegions); assert.equal(s.moveLimit,initial.moveLimit);
  assert.equal(s.timeLimit,90); assert.equal(s.elapsed,s.tick/60); assert.equal(s.remaining,Math.max(0,90-s.elapsed));
  for (const key of ['regionCounts','matchedEdgeCount','sharedEdgeCount','allEdgesMatched','allRegionsMatched','goalReady']) assert.deepEqual(s[key], f[key], key);
  assert.deepEqual(s.regions, f.components.map(c => ({ id: 'region-' + c.sectorIds[0], ...c })));
  assert.equal(Object.values(s.regionCounts).reduce((a, b) => a + b, 0), 14 - s.matchedEdgeCount);
  assert.equal(s.movesUsed, s.rotationCount + s.mirrorCount); assert.equal(s.movesRemaining, s.moveLimit - s.movesUsed);
  assert.equal(s.historyDepth, s.movesUsed); assert.equal(s.history.length, s.movesUsed);
  assert.equal(s.matchedRegionColorCount, s.colors.filter(c => s.regionCounts[c.id] === s.targetRegions[c.id]).length);
  assert.equal(s.score, s.matchedEdgeCount * 40 + s.matchedRegionColorCount * 100 + (s.phase === 'won' ? 1000 + Math.floor(s.remaining) * 5 + s.movesRemaining * 40 : 0));
  const recovered = assignments(initial), immutable = new Map(initial.sectors.map(v => [v.id, v]));
  let rotations = 0, mirrors = 0, lastTick = 0;
  for (const [i, receipt] of s.history.entries()) {
    const t = s.tiles.findIndex(tile => tile.id === receipt.tileId), key = receipt.kind === 'rotate' ? 'A' : 'B';
    assert.ok(t >= 0 && ['rotate','mirror'].includes(receipt.kind)); assert.equal(receipt.id, i + 1);
    assert.deepEqual(receipt.beforeSectorIds, recovered[t]);
    recovered[t] = transform(recovered[t], key); assert.deepEqual(receipt.afterSectorIds, recovered[t]);
    assert.deepEqual(receipt.beforeColors, receipt.beforeSectorIds.map(id => immutable.get(id).colorId));
    assert.deepEqual(receipt.afterColors, receipt.afterSectorIds.map(id => immutable.get(id).colorId));
    assert.equal(receipt.colorChanged, receipt.beforeColors.join('') !== receipt.afterColors.join(''));
    assert.ok(Number.isInteger(receipt.tick) && receipt.tick > lastTick && receipt.tick <= s.tick); lastTick = receipt.tick;
    assert.equal(receipt.at, receipt.tick / 60); key === 'A' ? rotations++ : mirrors++;
  }
  assert.deepEqual(recovered, actual); assert.equal(s.rotationCount, rotations); assert.equal(s.mirrorCount, mirrors);
  assert.deepEqual(s.lastOperation, s.history.at(-1) ?? null);
  for (const sector of s.sectors) {
    const fixed = immutable.get(sector.id); assert.ok(fixed); assert.equal(sector.colorId, fixed.colorId); assert.equal(sector.mark, fixed.mark); assert.equal(sector.tileId, fixed.tileId);
    assert.equal(sector.slotIndex, actual[s.tiles.findIndex(t => t.id === sector.tileId)].indexOf(sector.id));
  }
  const selected = s.tiles.findIndex(t => t.id === s.selectedId);
  for (const [key, preview] of [['A',s.previewRotate],['B',s.previewMirror]]) {
    const predicted = actual.map(ids => [...ids]); predicted[selected] = transform(predicted[selected], key);
    const next = evaluateArrangement(p, predicted);
    assert.deepEqual(preview.beforeSectorIds, actual[selected]); assert.deepEqual(preview.afterSectorIds, predicted[selected]);
    assert.equal(preview.tileId, s.selectedId); assert.equal(preview.cost, 1);
    for (const field of ['regionCounts','matchedEdgeCount','allEdgesMatched','allRegionsMatched']) assert.deepEqual(preview[field], next[field]);
    assert.equal(preview.willWin, next.goalReady); assert.equal(preview.willExhaustMoves, s.movesUsed + 1 >= s.moveLimit && !next.goalReady);
  }
  return f;
}
const directions = { N: {x:0,y:-1}, E: {x:1,y:0}, S: {x:0,y:1}, W: {x:-1,y:0} };
function focusDestination(s, fromId, direction) {
  const from = s.focusItems.find(f => f.id === fromId), d = directions[direction];
  const options = s.focusItems.map((f, index) => {
    const dx = f.x - from.x, dy = f.y - from.y, along = dx * d.x + dy * d.y, across = Math.abs(dx * d.y - dy * d.x), distance = dx * dx + dy * dy;
    return { id: f.id, along, rank: [distance + 2 * across * across, distance, across, index] };
  }).filter(f => f.along > 0);
  options.sort((a, b) => { for (let i = 0; i < 4; i++) if (a.rank[i] !== b.rank[i]) return a.rank[i] - b.rank[i]; return 0; });
  return options[0]?.id ?? fromId;
}
function tick(s, input = {}) { assert.equal(s.phase, 'playing'); Model.step(s, 1 / 60, {cancelEpoch:0,...input}); actualTicks++; }
function select(s, target) {
  const queue = [{ id:s.selectedId, route:[] }], seen = new Set([s.selectedId]);
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    if (current.id === target) { for (const direction of current.route) { tick(s); const expected = focusDestination(s, s.selectedId, direction); tick(s, directions[direction]); assert.equal(s.selectedId, expected); } return; }
    for (const direction of Object.keys(directions)) { const next = focusDestination(s, current.id, direction); if (!seen.has(next)) { seen.add(next); queue.push({ id:next, route:[...current.route,direction] }); } }
  }
  throw Error('public focus graph cannot reach witness tile');
}

try {
  assert.equal(beforeHashes.model, arg('--expected-model', beforeHashes.model));
  assert.equal(beforeHashes.automation, arg('--expected-pilot', beforeHashes.automation));
  Model = createRequire(import.meta.url)(files.model);
  check('positive-length boundaries and physical D3', () => {
    assert.equal(positiveSegmentOverlap({u:0,v:0},{u:3,v:0},{u:3,v:0},{u:6,v:0}), false);
    assert.equal(positiveSegmentOverlap({u:0,v:0},{u:3,v:0},{u:2,v:0},{u:1,v:0}), true);
    assert.equal(positiveSegmentOverlap({u:0,v:0},{u:3,v:0},{u:1,v:-1},{u:1,v:1}), false);
    const ids = ['x','y','z']; assert.equal(physicalOrientations(ids).length, 6);
    assert.deepEqual(transform(transform(transform(ids,'A'),'A'),'A'), ids); assert.deepEqual(transform(transform(ids,'B'),'B'), ids);
    assert.notDeepEqual(transform(transform(ids,'A'),'B'), transform(transform(ids,'B'),'A'));
    return { geometryFixtures:3, identityChecks:3, scope:'Small exact geometry and permutation fixtures, not gameplay' };
  });
  check('complete public board enumeration and minimum physical costs', () => {
    for (let level = 0; level < 3; level++) {
      const state = Model.create(1, level); initialBoards.push(clone(state)); inspect(state, state);
      const proof = enumeratePublicBoard(state); proofs.push({ level:level+1, ...proof });
      assert.equal(proof.counts.colorStates, 2916); assert.equal(proof.counts.physicalStates, 46656);
      assert.equal(proof.counts.goals, 1); assert.equal(proof.counts.goalPhysicalStates, 16); assert.deepEqual(proof.forestResiduals, [0]);
      assert.equal(proof.internalComponents, 14); assert.equal(proof.counts.regionOnly, 0);
      assert.equal(proof.minimumGoal.cost, level + 4); assert.equal(state.moveLimit, proof.minimumGoal.cost + 2);
      assert.equal(proof.counts.rotationsOnlyGoals, 0); assert.equal(proof.counts.mirrorsOnlyGoals, 0);
      assert.ok(proof.minimumGoal.largestTileSpan >= 3); assert.ok(proof.minimumEdgeOnly.cost < state.moveLimit);
      assert.ok(proof.minimumEdgeOnly.cost <= proof.minimumGoal.cost);
      for (const witness of [proof.minimumGoal, proof.minimumEdgeOnly]) {
        const pure = assignments(state);
        for (const op of witness.operations) { const i = state.tiles.findIndex(t => t.id === op.tileId); pure[i] = transform(pure[i], op.key); }
        assert.deepEqual(pure, witness.assignment); assert.equal(witness.operations.length, witness.cost);
      }
    }
    return { boards:3, colorStates:8748, physicalStatesAccounted:139968, minimumCosts:proofs.map(p=>p.minimumGoal.cost),
      limitation:'Exact per-color targets imply all shared edges matched on these authored forest boards; the reverse negative case is impossible.' };
  });
  check('one ordinary all-edges-matched but wrong-region counterexample', () => {
    const state = Model.create(1, 0), initial = clone(state), witness = proofs[0].minimumEdgeOnly;
    for (const op of witness.operations) { select(state, op.tileId); tick(state); tick(state, op.key === 'A' ? {a:true} : {b:true}); inspect(state, initial); assert.equal(state.phase, 'playing'); }
    assert.equal(state.allEdgesMatched, true); assert.equal(state.allRegionsMatched, false); assert.equal(state.goalReady, false);
    assert.deepEqual(assignments(state), witness.assignment); assert.equal(state.movesUsed, witness.cost);
    report.actualModelCounterexamples.push({ level:1, initial, final:clone(state), operations:witness.operations,
      scope:'Fresh model, ordinary direction/A/B input only; no state mutation or authored action route. No claim of browser duration.' });
    return { ordinaryCounterexamplesExecuted:1, chargedOperations:state.movesUsed, matchedEdges:state.matchedEdgeCount, regionCounts:state.regionCounts };
  });
  check('independent read-only verification of the unique six ordinary rounds', () => {
    const ordinary = JSON.parse(fs.readFileSync(ordinaryPath)); assert.equal(ordinary.passed, true); assert.equal(ordinary.results.length, 6);
    assert.deepEqual(ordinary.results.map(r=>`${r.name}|${r.level}|${r.mode}`).sort(),
      [1,2,3].flatMap(level=>['record','budget-loss'].map(mode=>`level${level}-${mode}|${level}|${mode}`)).sort());
    assert.equal(ordinary.sourceUnchanged, true); assert.deepEqual(ordinary.startHashes, ordinary.endHashes);
    for (const k of ['model','automation','contract']) assert.equal(ordinary.startHashes[k], beforeHashes[k]);
    for (const r of ordinary.results) {
      assert.ok(r.passed); const p = path.join(path.dirname(ordinaryPath), r.name+'.json'), raw = JSON.parse(fs.readFileSync(p));
      assert.deepEqual(raw.result, r); assert.equal(raw.failure, null); const start = raw.initial.model, end = raw.final.model;
      assert.deepEqual(start, initialBoards[r.level-1]); assert.equal(start.movesUsed,0);
      for (const state of [raw.initial,...raw.retained.map(v=>v.state),raw.final]) inspect(state.model, start);
      if (r.mode === 'record') {
        assert.equal(end.phase,'won'); assert.equal(end.goalReady,true); assert.equal(end.movesUsed,end.moveLimit); assert.equal(end.movesRemaining,0);
        const first = raw.retained.find(v=>v.state.model.movesUsed===1).state.model, second = raw.retained.find(v=>v.state.model.movesUsed===2).state.model;
        assert.equal(first.lastOperation.kind,'mirror'); assert.equal(first.lastOperation.colorChanged,true);
        assert.equal(second.lastOperation.kind,'mirror'); assert.equal(second.lastOperation.tileId,first.lastOperation.tileId);
        assert.deepEqual(assignments(second), assignments(start)); assert.equal(second.mirrorCount,2); assert.equal(second.movesRemaining,start.moveLimit-2);
        assert.ok(second.elapsed>first.elapsed && first.elapsed>0); assert.ok(end.regions.some(c=>c.tileIds.length>=3));
      } else { assert.equal(r.mode,'budget-loss'); assert.equal(end.phase,'lost'); assert.equal(end.lostReason,'moves'); assert.equal(end.goalReady,false); assert.equal(end.movesUsed,end.moveLimit); }
      report.reusedOrdinaryEvidence.push({ name:r.name, sourceSha256:hash(p), phase:end.phase, movesUsed:end.movesUsed, elapsed:end.elapsed,
        regionCounts:end.regionCounts, physicalFinal:assignments(end), scope:'Existing QA execution independently recomputed; no replay or new Model.step calls.' });
    }
    return { existingRoundsVerified:6, reportSha256:hash(ordinaryPath), ordinaryRoundsExecutedHere:0 };
  });
  report.passed = true;
} catch (error) { report.failure = { message:error.message, stack:error.stack }; process.exitCode=1; }
report.sourceHashesAfter=hashes(); report.sourceUnchanged=JSON.stringify(beforeHashes)===JSON.stringify(report.sourceHashesAfter);
report.passed=report.passed&&report.sourceUnchanged; report.checks=results.length; report.snapshotChecks=snapshotChecks; report.actualModelTicks=actualTicks;
if (!report.passed) process.exitCode=1;
fs.mkdirSync(path.dirname(output),{recursive:true}); fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify({passed:report.passed,checks:report.checks,sourceUnchanged:report.sourceUnchanged,snapshotChecks,actualModelTicks:actualTicks,failure:report.failure?.message})+'\n');
