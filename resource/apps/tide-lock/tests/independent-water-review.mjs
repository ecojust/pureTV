// Independent read-only model review. Fixtures alter physical initial conditions;
// complete voyages below use only ordinary keys returned from read-only snapshots.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const modelPath = fileURLToPath(new URL('../src/main/assets/game-model.js', import.meta.url));
const pilotPath = fileURLToPath(new URL('./automation.mjs', import.meta.url));
const reportPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (reportPath) assert.ok(![modelPath, pilotPath, fileURLToPath(import.meta.url)].includes(reportPath), 'Report must not overwrite source files');
const hash = value => createHash('sha256').update(value).digest('hex');
const modelBytes = await readFile(modelPath), pilotBytes = await readFile(pilotPath);
const model = createRequire(import.meta.url)(modelPath);
const pilot = await import(pathToFileURL(pilotPath).href);
const DT = 1 / 60, EPS = 1e-8, seed = 20261101;
let rng = seed;
function random() { rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0; return rng / 4294967296; }
function near(actual, expected, label, tolerance = EPS) { assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: actual=${actual}, expected=${expected}`); }
function sumVolume(state) { return state.zones.filter(zone => !zone.isReservoir).reduce((sum, zone) => sum + zone.volume, 0); }
function inventoryFixture(level = 0) {
  const state = model.create(1, level);
  state.boats.forEach(boat => { boat.status = 'queued'; }); state.activeBoatId = null;
  return state;
}
function levels(state, values) {
  state.zones.forEach((zone, index) => {
    zone.level = values[index];
    if (!zone.isReservoir) zone.volume = zone.area * (zone.level - zone.floor);
  });
  state.initialVolume = sumVolume(state); state.totalVolume = state.initialVolume;
}
function accounted(state) { return state.initialVolume + state.sourceVolume - state.sinkVolume - state.overflowVolume; }
function step(state, count = 1) { for (let i = 0; i < count; i += 1) model.step(state, DT, {}); }
function action(state, selectedId, buttons) { if (selectedId) state.selectedId = selectedId; model.step(state, 0.000001, buttons); }
const report = {
  schemaVersion: 1, startedAt: new Date().toISOString(),
  source: { modelPath, modelSha256: hash(modelBytes), automationPath: pilotPath, automationSha256: hash(pilotBytes),
    reviewScript: fileURLToPath(import.meta.url), reviewScriptSha256: hash(await readFile(fileURLToPath(import.meta.url))) },
  execution: { runtime: process.version, command: 'node ' + fileURLToPath(import.meta.url), sourceFilesModified: false,
    liveStateWinHooksUsed: false, publicModelApiOnly: true,
    fixtureScope: 'Physical water inventories, gate/valve opening combinations and isolated rule boundaries; ordinary-input voyage validation has no state writes.' },
  random: { seed, generator: 'LCG32: rng=(Math.imul(rng,1664525)+1013904223)>>>0; U=rng/4294967296',
    drawsInOrder: 'Single-step gate cases, multistep gate cases, valve cases',
    reference: 'Independent signed edge-flow balance from old levels; gate conductivity 4, maximum rate 2.5, dt=1/60. Local old-neighborhood extrema checked independently from volume predictions.' },
  checks: [], voyages: [], failures: []
};
function check(name, body) {
  const started = performance.now();
  try { const details = body(); report.checks.push({ name, passed: true, elapsedMs: performance.now() - started, ...details }); }
  catch (error) { report.checks.push({ name, passed: false, error: error.stack }); report.failures.push(name); throw error; }
}
try {
  check('50000 randomized gate networks: signed balance, local maximum principle, fixed reservoirs', () => {
    const count = 50000; let maxVolumeError = 0, maxBalanceError = 0;
    for (let i = 0; i < count; i += 1) {
      const state = inventoryFixture(i % 3), old = [random() * 7.95, random() * 7.95, random() * 7.95, random() * 7.95];
      levels(state, old);
      state.gates.forEach(gate => { gate.open = random() < 0.5; });
      const delta = [0, 0, 0, 0]; let source = 0, sink = 0;
      for (let edgeIndex = 0; edgeIndex < 3; edgeIndex += 1) {
        if (!state.gates[edgeIndex].open) continue;
        const difference = old[edgeIndex] - old[edgeIndex + 1];
        const signed = Math.sign(difference) * Math.min(2.5, 4 * Math.abs(difference)) * DT;
        delta[edgeIndex] -= signed; delta[edgeIndex + 1] += signed;
        if (edgeIndex === 0) { source += Math.max(0, signed); sink += Math.max(0, -signed); }
        if (edgeIndex === 2) { source += Math.max(0, -signed); sink += Math.max(0, signed); }
      }
      const before = state.zones.map(zone => zone.volume);
      step(state);
      assert.equal(state.phase, 'playing'); near(state.zones[0].level, old[0], 'entry remains fixed'); near(state.zones[3].level, old[3], 'exit remains fixed');
      for (const index of [1, 2]) {
        const zone = state.zones[index], expected = before[index] + delta[index];
        maxVolumeError = Math.max(maxVolumeError, Math.abs(zone.volume - expected)); near(zone.volume, expected, 'independent signed balance');
        const neighborhood = [old[index]];
        if (state.gates[index - 1].open) neighborhood.push(old[index - 1]);
        if (state.gates[index].open) neighborhood.push(old[index + 1]);
        assert.ok(zone.level >= Math.min(...neighborhood) - EPS && zone.level <= Math.max(...neighborhood) + EPS, 'water cannot overshoot old connected-neighborhood extrema');
      }
      near(state.sourceVolume, source, 'source boundary integral'); near(state.sinkVolume, sink, 'sink boundary integral');
      const error = Math.abs(sumVolume(state) - accounted(state)); maxBalanceError = Math.max(maxBalanceError, error); assert.ok(error < EPS);
    }
    return { cases: count, actualLayoutsCovered: 3, initialLevels: '[0,7.95) m independently for all four zones', gateOpenProbability: 0.5,
      maxAbsoluteVolumePredictionError: maxVolumeError, maxAbsoluteConservationError: maxBalanceError };
  });

  check('200 randomized open-gate networks remain bounded and conservative over 120 ticks', () => {
    let maximumError = 0;
    for (let i = 0; i < 200; i += 1) {
      const state = inventoryFixture(i % 3), old = [random() * 7.95, random() * 7.95, random() * 7.95, random() * 7.95];
      levels(state, old); state.gates.forEach(gate => { gate.open = random() < 0.7; });
      for (let tick = 0; tick < 120; tick += 1) {
        step(state); assert.equal(state.phase, 'playing');
        for (const zone of state.zones) assert.ok(zone.level >= Math.min(...old) - EPS && zone.level <= Math.max(...old) + EPS);
        const error = Math.abs(sumVolume(state) - accounted(state)); maximumError = Math.max(maximumError, error); assert.ok(error < 1e-7);
      }
    }
    return { cases: 200, ticksPerCase: 120, maxAbsoluteConservationError: maximumError };
  });

  check('5000 randomized fill/drain combinations obey rate, capacity and cumulative flux accounting', () => {
    let overflowCases = 0, maximumError = 0;
    for (let i = 0; i < 5000; i += 1) {
      const state = inventoryFixture(i % 3);
      levels(state, [state.zones[0].level, random() * 8, random() * 8, state.zones[3].level]);
      state.valves.forEach(valve => { valve.open = random() < 0.5; });
      const expected = state.zones.map(zone => zone.volume); let source = 0, sink = 0, spill = 0;
      for (let j = 1; j <= 2; j += 1) {
        const zone = state.zones[j], fill = state.valves.find(valve => valve.zoneId === zone.id && valve.type === 'fill'), drain = state.valves.find(valve => valve.zoneId === zone.id && valve.type === 'drain');
        const incoming = fill.open ? Math.min(state.valveRate * DT, Math.max(0, state.fillHead - zone.level) * zone.area) : 0;
        const outgoing = drain.open ? Math.min(state.valveRate * DT, Math.max(0, zone.level - state.drainHead) * zone.area) : 0;
        source += incoming; sink += outgoing;
        const unconstrained = expected[j] + incoming - outgoing, capacity = zone.capacity * zone.area;
        spill += Math.max(0, unconstrained - capacity); expected[j] = Math.min(capacity, Math.max(0, unconstrained));
      }
      step(state);
      for (let j = 1; j <= 2; j += 1) { near(state.zones[j].volume, expected[j], 'valve independent inventory'); assert.ok(state.zones[j].level >= -EPS && state.zones[j].level <= 8 + EPS); }
      for (const valve of state.valves) assert.ok(valve.flow >= -EPS && valve.flow <= state.valveRate + EPS);
      near(state.sourceVolume, source, 'valve source integral'); near(state.sinkVolume, sink, 'valve sink integral'); near(state.overflowVolume, spill, 'overflow integral');
      if (spill > EPS) { overflowCases += 1; assert.equal(state.lostReason, 'overflow'); }
      const error = Math.abs(sumVolume(state) - accounted(state)); maximumError = Math.max(maximumError, error); assert.ok(error < EPS);
    }
    return { cases: 5000, overflowCases, maxAbsoluteConservationError: maximumError };
  });

  check('closed valves/gates freeze volume; unequal-area isolated middle gate equilibrates conservatively', () => {
    const isolated = inventoryFixture(2), original = isolated.zones.map(zone => zone.volume);
    step(isolated, 600); assert.deepEqual(isolated.zones.map(zone => zone.volume), original); assert.equal(isolated.sourceVolume, 0); assert.equal(isolated.sinkVolume, 0);
    const joined = inventoryFixture(2); levels(joined, [1, 2, 7, 7]); joined.gates[1].open = true;
    const expected = joined.initialVolume / (joined.zones[1].area + joined.zones[2].area);
    step(joined, 600); near(joined.zones[1].level, expected, 'weighted common head', 1e-7); near(joined.zones[2].level, expected, 'weighted common head', 1e-7);
    near(joined.totalVolume, joined.initialVolume, 'isolated inventory'); assert.equal(joined.sourceVolume, 0); assert.equal(joined.sinkVolume, 0);
    return { ticks: 600, area1: joined.zones[1].area, area2: joined.zones[2].area, expectedCommonLevel: expected };
  });

  check('gate threshold and mutual gate/valve interlocks', () => {
    for (const [difference, allowed] of [[0.15, true], [0.150001, false]]) {
      const state = model.create(); state.zones[1].volume = state.zones[1].area * (state.zones[0].level + difference);
      action(state, 'gate-1', { aPressed: true }); assert.equal(state.gates[0].open, allowed);
    }
    const state = model.create(); action(state, 'fill-1', { aPressed: true }); assert.equal(state.valves[0].open, true);
    action(state, 'gate-1', { aPressed: true }); assert.equal(state.gates[0].open, false);
    action(state, 'fill-1', { aPressed: true }); action(state, 'gate-1', { aPressed: true }); assert.equal(state.gates[0].open, true);
    action(state, 'fill-1', { aPressed: true }); assert.equal(state.valves[0].open, false);
    return { acceptedDifference: 0.15, rejectedDifference: 0.150001 };
  });

  check('ordinary B crosses only an open safe gate and locks it until the boat has passed', () => {
    const state = model.create(), boat = state.boats[0], firstX = boat.x;
    action(state, null, { bPressed: true }); assert.equal(boat.status, 'waiting'); assert.equal(boat.x, firstX);
    action(state, 'gate-1', { aPressed: true, bPressed: true }); assert.equal(boat.status, 'moving'); assert.equal(state.gates[0].locked, true);
    action(state, 'gate-1', { aPressed: true }); assert.equal(state.gates[0].open, true);
    action(state, 'fill-1', { aPressed: true }); assert.equal(state.valves[0].open, false);
    let ticks = 0;
    while (boat.status === 'moving' && ticks++ < 1000) {
      const x = boat.x; step(state); assert.ok(boat.x >= x && boat.x <= (state.zones[1].x1 + state.zones[1].x2) / 2 + EPS);
      assert.ok(boat.y + boat.draft * state.levelScale <= state.floorY + EPS);
    }
    assert.equal(boat.zoneId, 'lock-1'); assert.equal(boat.status, 'waiting'); assert.equal(state.gates[0].locked, false); assert.equal(state.deliveries, 0);
    action(state, 'gate-1', { aPressed: true }); assert.equal(state.gates[0].open, false);
    const x = boat.x; action(state, null, { bPressed: true }); assert.equal(boat.x, x); assert.equal(boat.status, 'waiting');
    return { firstCrossingTicks: ticks, firstCrossingModelSeconds: state.elapsed, deliveriesAfterFirstGate: state.deliveries };
  });

  check('overflow is reachable by an ordinary open fill valve; spill ledger balances and terminal freezes', () => {
    const state = model.create(); action(state, 'fill-1', { aPressed: true });
    for (let tick = 0; tick < 1000 && state.phase === 'playing'; tick += 1) step(state);
    assert.equal(state.phase, 'lost'); assert.equal(state.lostReason, 'overflow'); assert.ok(state.overflowVolume > 0); near(state.zones[1].level, 8, 'overflow clamps crest');
    near(state.totalVolume, accounted(state), 'overflow accounting');
    const frozen = structuredClone(state); model.step(state, 0.25, { aPressed: true, bPressed: true, x: 1 }); assert.deepEqual(state, frozen);
    return { lostAt: state.elapsed, chamberLevel: state.zones[1].level, sourceVolume: state.sourceVolume, spillVolume: state.overflowVolume };
  });

  check('ordinary boat admission followed by drainage reaches grounding without floor penetration', () => {
    const state = model.create(); action(state, 'gate-1', { aPressed: true, bPressed: true });
    while (state.boats[0].status === 'moving') step(state);
    action(state, 'gate-1', { aPressed: true }); action(state, 'drain-1', { aPressed: true });
    let firstGroundedAt = null;
    for (let i = 0; i < 1000 && state.phase === 'playing'; i += 1) {
      step(state); const boat = state.boats[0];
      if (boat.grounded && firstGroundedAt === null) firstGroundedAt = state.elapsed;
      assert.ok(boat.y + boat.draft * state.levelScale <= state.floorY + EPS); assert.ok(state.zones[1].volume >= -EPS);
    }
    assert.equal(state.lostReason, 'grounding'); near(state.boats[0].groundedTime, 3, 'grounding duration', 1e-7);
    near(state.totalVolume, accounted(state), 'drain accounting');
    return { firstGroundedAt, lostAt: state.elapsed, continuousGroundedSeconds: state.boats[0].groundedTime, chamberLevel: state.zones[1].level };
  });

  check('restored water depth resets continuous grounding duration; empty drain cannot create negative inventory', () => {
    const state = model.create(), boat = state.boats[0]; boat.zoneId = 'lock-1'; state.zones[1].volume = 0.1 * state.zones[1].area;
    step(state, 100); assert.ok(boat.groundedTime > 1); state.zones[1].volume = 1 * state.zones[1].area; step(state); assert.equal(boat.groundedTime, 0);
    const empty = inventoryFixture(); levels(empty, [2, 0, 4, 6]); empty.valves.find(valve => valve.id === 'drain-1').open = true;
    step(empty, 600); assert.equal(empty.zones[1].volume, 0); assert.equal(empty.sinkVolume, 0); assert.equal(empty.phase, 'playing');
    return { resetVerified: true, emptyDrainTicks: 600 };
  });

  check('timeout is exact and terminal state freezes', () => {
    const state = inventoryFixture(); state.timeLimit = 3 * DT; state.remaining = state.timeLimit;
    step(state, 2); assert.equal(state.phase, 'playing'); step(state); assert.equal(state.lostReason, 'timeout'); assert.equal(state.remaining, 0);
    const frozen = structuredClone(state); step(state, 100); assert.deepEqual(state, frozen);
    return { boundarySeconds: state.timeLimit };
  });

  for (const mode of ['qa', 'record']) for (let difficulty = 0; difficulty < 3; difficulty += 1) {
    const state = model.create(1, difficulty), initial = { phase: state.phase, model: structuredClone(state) }, trace = [];
    let held = new Set(), commands = 0;
    for (let wall = 0; wall < 100 && state.phase === 'playing'; wall += 0.08) {
      const snapshot = { phase: state.phase, paused: false, level: difficulty, model: structuredClone(state) }, frozenSnapshot = structuredClone(snapshot);
      const keys = pilot.keys(snapshot, { elapsed: wall, mode }); assert.deepEqual(snapshot, frozenSnapshot, 'pilot must be read-only');
      assert.ok(keys.every(key => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'b'].includes(key)));
      const down = new Set(keys); commands += keys.length;
      model.step(state, 0.08, { x: Number(down.has('ArrowRight')) - Number(down.has('ArrowLeft')), y: Number(down.has('ArrowDown')) - Number(down.has('ArrowUp')),
        a: down.has('Space'), b: down.has('b'), aPressed: down.has('Space') && !held.has('Space'), bPressed: down.has('b') && !held.has('b') });
      held = down; trace.push({ state: { phase: state.phase, model: structuredClone(state) } });
    }
    const after = { phase: state.phase, model: structuredClone(state) };
    pilot.assertProgress({ before: initial, after, trace }, assert);
    pilot.assertRetry({ before: after, after: { phase: 'playing', model: model.create(1, difficulty) } }, assert);
    const delivered = state.deliveries, terminal = structuredClone(state); step(state, 100); assert.deepEqual(state, terminal); assert.equal(state.deliveries, delivered);
    report.voyages.push({ mode, level: state.level, phase: state.phase, target: state.target, deliveries: state.deliveries, modelSeconds: state.elapsed,
      sourceVolume: state.sourceVolume, sinkVolume: state.sinkVolume, overflowVolume: state.overflowVolume, commands, stateWrites: false });
  }
  assert.equal(hash(await readFile(modelPath)), report.source.modelSha256, 'model source changed during independent review');
  assert.equal(hash(await readFile(pilotPath)), report.source.automationSha256, 'automation source changed during independent review');
  report.passed = true;
} catch (error) { report.passed = false; report.error = error.stack; process.exitCode = 1; }
report.finishedAt = new Date().toISOString();
if (reportPath) await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, reportPath, sourceSha256: report.source.modelSha256, checks: report.checks.map(check => ({ name: check.name, passed: check.passed })), voyages: report.voyages, error: report.error }, null, 2));
