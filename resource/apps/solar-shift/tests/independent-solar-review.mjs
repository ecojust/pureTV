// Read only the unique QA six-round corpus; no Model/pilot imports or new games.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { publicConstants, createIntegralState, advanceIntegralTo, intervalProjection, eulerTemperature } from './solar-interval-oracle.mjs';
const argv = process.argv.slice(2), arg = (key, fallback) => { const i = argv.indexOf(key); return i < 0 ? fallback : argv[i + 1]; };
const here = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(arg('--app', path.join(here, '..')));
const ROUNDS = path.resolve(arg('--rounds', '/workspace/scratch/hundred-games/solar-shift/ordinary-rounds-first'));
const FORMAL = path.resolve(arg('--formal-report', '/workspace/scratch/hundred-games/solar-shift/model-tests-first/report.json'));
const OUT = path.resolve(arg('--output', '/workspace/scratch/hundred-games/solar-shift/independent-review-first'));
const paths = { model: path.join(APP, 'src/main/assets/game-model.js'), automation: path.join(APP, 'tests/automation.mjs'), tests: path.join(APP, 'tests/game-model.test.cjs'), contract: path.join(APP, 'docs/model-contract.md'), math: path.join(here, 'solar-interval-oracle.mjs'), review: fileURLToPath(import.meta.url) };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'), read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const hashes = () => Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, sha(p)]));
const beforeHashes = hashes(), startedAt = new Date().toISOString(), checks = [], details = [], evidence = [];
assert.ok(!fs.existsSync(OUT), 'Never overwrite any earlier independent attempt'); fs.mkdirSync(OUT, { recursive: true });
const equal = (a, b, why) => assert.deepEqual(a, b, why);
function close(a, b, why) { assert.ok(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-8, `${why}: ${a} versus ${b}`); }
function projection(actual, expected, label = '') {
  if (typeof expected === 'number') { close(actual, expected, label); return; }
  if (Array.isArray(expected)) { assert.ok(Array.isArray(actual)); equal(actual.length, expected.length, label); expected.forEach((x, i) => projection(actual[i], x, `${label}[${i}]`)); return; }
  if (expected && typeof expected === 'object') { assert.ok(actual && typeof actual === 'object', label); for (const [key, value] of Object.entries(expected)) projection(actual[key], value, `${label}.${key}`); return; }
  equal(actual, expected, label);
}
function group(name, run) { run(); checks.push({ name, passed: true }); }
const PERIODS = [
  { id: 'dawn', name: '晨光', start: 0, end: 14, angleDeg: -60, irradiance: .8 },
  { id: 'noon', name: '正午', start: 14, end: 28, angleDeg: 0, irradiance: 1 },
  { id: 'dusk', name: '夕照', start: 28, end: 42, angleDeg: 60, irradiance: .8 },
  { id: 'night', name: '夜间', start: 42, end: 60, angleDeg: null, irradiance: 0 }
];
const definitions = [
  { name: '海边信标', ratedW: 15, shadows: [[10, 13], [25, 28]], battery: [90, 36, 5, 8, 24, 26, 58, .05, .10, .08], devices: [['信标', 'BEACON', 4, 224, 150], ['水泵', 'PUMP', 3, 72, null], ['工坊', 'WORKSHOP', 5, 60, null]] },
  { name: '山谷泵站', ratedW: 17.5, shadows: [[5, 11], [30, 33]], battery: [105, 55, 4.5, 8, 26, 32, 54, .05, .10, .10], devices: [['监测站', 'MONITOR', 4, 224, 150], ['水泵', 'PUMP', 4, 76, null], ['通信站', 'RADIO', 5, 70, null]] },
  { name: '夜间诊所', ratedW: 20, shadows: [[8, 12], [24, 28]], battery: [120, 65, 6, 8, 25, 29, 62, .05, .10, .10], devices: [['诊疗灯', 'CLINIC', 3, 170, 120], ['冷藏箱', 'FRIDGE', 2, 110, 90], ['净水泵', 'PURIFIER', 5, 100, null]] }
];
const batteryKeys = ['capacityJ', 'initialEnergyJ', 'maxChargeW', 'maxDischargeW', 'ambientC', 'initialTemperatureC', 'thermalLimitC', 'heatChargeCoefficient', 'heatDischargeCoefficient', 'coolingPerSecond'];
const deviceKeys = ['id', 'name', 'nameEn', 'priority', 'demandW', 'quotaJ', 'critical', 'maxBrownoutTicks'];
function expectedBoard(level) {
  const d = definitions[level - 1];
  return { width: 960, height: 540, level, difficulty: level - 1, levelName: d.name, seed: 1, timeLimit: 60, deviceCount: 3,
    solar: { ratedW: d.ratedW }, sunPeriods: PERIODS, shadowWindows: d.shadows.map(([start, end]) => ({ start, end })),
    battery: Object.fromEntries(batteryKeys.map((key, i) => [key, d.battery[i]])),
    devices: d.devices.map(([name, nameEn, demandW, quotaJ, maxBrownoutTicks], i) => ({ id: `D${i + 1}`, name, nameEn, priority: i + 1, demandW, quotaJ, critical: maxBrownoutTicks !== null, maxBrownoutTicks })) };
}
function immutablePart(m) {
  return { ...Object.fromEntries(['width', 'height', 'level', 'difficulty', 'levelName', 'seed', 'timeLimit', 'deviceCount'].map(k => [k, m[k]])),
    solar: { ratedW: m.solar.ratedW }, sunPeriods: m.sunPeriods, shadowWindows: m.shadowWindows,
    battery: Object.fromEntries(batteryKeys.map(k => [k, m.battery[k]])), devices: m.devices.map(d => Object.fromEntries(deviceKeys.map(k => [k, d[k]]))) };
}

function pureHandFixtures() {
  // These deliberately small arithmetic inputs are not authored levels or Model
  // states. Their expected energies are hand calculations, not generated routes.
  const base = expectedBoard(1); base.sunPeriods = [{ id: 'test', name: 'test', start: 0, end: 60, angleDeg: -60, irradiance: 1 }]; base.shadowWindows = [];
  base.battery = { ...base.battery, capacityJ: 2, initialEnergyJ: 1, maxChargeW: 1, maxDischargeW: 4, ambientC: 20, initialTemperatureC: 20, thermalLimitC: 100, heatChargeCoefficient: 0, heatDischargeCoefficient: 0, coolingPerSecond: .1 };
  base.devices = [3, 2, 1].map((demandW, i) => ({ id: `D${i + 1}`, priority: i + 1, demandW, quotaJ: 100, critical: false, maxBrownoutTicks: null }));
  base.solar.ratedW = 0;
  let s = createIntegralState(publicConstants(base)); advanceIntegralTo(s, 60, []);
  equal(s.energy, 0); equal(s.delivered, [180, 60, 0]); equal(s.discharge, 240); equal(s.spill, 0);
  base.battery.initialEnergyJ = 1.5; base.solar.ratedW = 8;
  s = createIntegralState(publicConstants(base)); advanceIntegralTo(s, 60, []);
  equal(s.energy, 480); equal(s.charge, 120); equal(s.solar, 1920); equal(s.delivery, 1440); equal(s.spill, 360);
  const one = 30 + (2 - .1 * (30 - 20)) / 60, two = one + (2 - .1 * (one - 20)) / 60;
  close(eulerTemperature(30, 20, .1, 2, 2), two, 'Two hand-written Euler updates equal the closed form');
  details.push({ scope: 'Pure arithmetic fixtures only; no production execution or gameplay', checks: ['Power-limited discharge empties1J in15ticks with priority shares .75/.25/0J', 'Charge power/capacity intersection stores .5J and spills1.5J', 'Closed-form Euler equals two hand-calculated updates'] });
}

function checkState(raw, expected, board) {
  equal(immutablePart(raw), board, 'Immutable initial facts match the public contract');
  ensureCounters(raw); projection(raw, intervalProjection(expected));
  assert.ok(['D1', 'D2', 'D3'].includes(raw.selectedId));
  const score = raw.devices.reduce((total, d) => total + (d.quotaMet ? 200 : Math.floor(200 * Math.min(1, d.deliveredJ / d.quotaJ))), 0)
    + (raw.phase === 'won' ? 1000 + 2 * Math.floor(raw.battery.energyJ + 1e-8) : 0);
  equal(raw.score, score, 'Score uses actual separate quota counters and scoring-only epsilon');
  close(raw.ledger.initialBatteryJ + raw.ledger.solarJ, raw.battery.energyJ + raw.ledger.deliveredJ + raw.ledger.spilledJ, 'Published energy ledger');
  close(raw.devices.reduce((n, d) => n + d.deliveredJ, 0), raw.ledger.deliveredJ, 'Independent device quotas sum to actual delivery');
}
function ensureCounters(m) {
  for (const value of [m.tick, m.panelTurns, m.toggleCount, m.quotaMetCount, ...m.devices.map(d => d.brownoutTicks)]) assert.ok(Number.isInteger(value) && value >= 0);
}
function reviewRound(raw, result, rawPath) {
  equal(raw.result, result); equal(raw.failure, null);
  const board = expectedBoard(result.level), before = raw.initial.model, after = raw.final.model;
  equal(before.tick, 0); equal(before.selectedId, 'D1'); equal(before.lastOperation, null); equal(before.lastFlow, null);
  const expected = createIntegralState(publicConstants(board)); checkState(before, expected, board);
  const operations = raw.operations.map(row => row.receipt);
  equal(operations.length, after.panelTurns + after.toggleCount);
  equal(operations.filter(o => o.kind === 'rotate').length, after.panelTurns); equal(operations.filter(o => o.kind === 'toggle').length, after.toggleCount);
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i], row = raw.operations[i], key = op.kind === 'rotate' ? 'Space' : 'b';
    assert.ok(Number.isInteger(op.id) && op.id === op.tick && (i === 0 || op.tick > operations[i - 1].tick));
    equal(row.observedAt, op.at); equal(row.state.model.tick, op.tick); equal(row.state.model.lastOperation, op);
    if (op.kind === 'toggle') equal(row.state.model.selectedId, op.deviceId);
    assert.ok(raw.inputChanges.some(input => input.tick + 1 === op.tick && input.to.includes(key) && !input.from.includes(key)), 'Operation corresponds to one ordinary fresh button edge');
  }
  equal(raw.inputChanges.filter(c => c.to.includes('Space')).length, after.panelTurns); equal(raw.inputChanges.filter(c => c.to.includes('b')).length, after.toggleCount);
  const checkpoints = new Map();
  function save(state) { const tick = state.model.tick; equal(state.phase, state.model.phase); if (checkpoints.has(tick)) equal(checkpoints.get(tick), state, 'Duplicate observations at one tick retain identical actual state'); else checkpoints.set(tick, state); }
  save(raw.initial);
  for (const row of raw.retained) { equal(row.seconds, row.state.model.elapsed); save(row.state); }
  raw.operations.forEach(row => save(row.state)); save(raw.final);
  for (const [tick, state] of [...checkpoints].sort((a, b) => a[0] - b[0])) { advanceIntegralTo(expected, tick, operations); checkState(state.model, expected, board); }
  equal(expected.operationIndex, operations.length); equal(raw.retained.at(-1).state, raw.final);
  for (const key of ['phase', 'lostReason', 'elapsed', 'panelTurns', 'toggleCount', 'quotaMetCount', 'score']) equal(result[key], after[key], `Summary ${key}`);
  equal(result.deliveredJ, after.devices.map(d => d.deliveredJ)); equal(result.energyJ, after.battery.energyJ); equal(result.temperatureC, after.battery.temperatureC);
  if (result.mode === 'record') { equal(after.phase, 'won'); equal(after.tick, 3600); equal(after.allQuotasMet, true); }
  else { equal(after.phase, 'lost'); equal(after.lostReason, ['brownout', 'heat', 'quota'][result.level - 1]); }
  details.push({ name: result.name, level: result.level, mode: result.mode, rawFileSha256: sha(rawPath), uniqueCheckpoints: checkpoints.size, actualOperations: operations.length,
    constantFlowSegments: expected.segments, phase: after.phase, lostReason: after.lostReason, terminalTick: after.tick, score: after.score,
    independentlyComputedEnergyJ: expected.energy / 240, independentlyComputedDeviceJ: expected.delivered.map(q => q / 240), independentlyComputedTemperatureC: expected.temperature,
    exactIntegerConservation: expected.facts.initialEnergy + expected.solar === expected.energy + expected.delivery + expected.spill });
}

let failure = null;
try {
  group('Pure arithmetic examples for integer capacity/power/priority and closed-form Euler', pureHandFixtures);
  const ordinaryPath = path.join(ROUNDS, 'report.json'), ordinary = read(ordinaryPath), formal = read(FORMAL);
  group('Existing formal and exact six-case ordinary corpus source bindings', () => {
    equal(ordinary.passed, true); equal(ordinary.sourceUnchanged, true); equal(ordinary.setupFailure, null); equal(ordinary.startHashes, ordinary.endHashes);
    for (const key of ['model', 'automation', 'contract']) equal(ordinary.startHashes[key], beforeHashes[key]);
    equal(ordinary.results.map(r => `${r.name}:${r.level}:${r.mode}`).sort(), [1, 2, 3].flatMap(level => [`level${level}-record:${level}:record`, `level${level}-loss:${level}:loss`]).sort());
    assert.ok(ordinary.results.every(r => r.passed));
    equal(formal.passed, true); equal(formal.sourceUnchanged, true); equal(formal.sourceHashesBefore, formal.sourceHashesAfter);
    equal(formal.modelSha256, beforeHashes.model); equal(formal.contractSha256, beforeHashes.contract); equal(formal.testSourceSha256, beforeHashes.tests);
    evidence.push({ role: 'only-six-ordinary-rounds', sha256: sha(ordinaryPath), scope: ordinary.scope }, { role: 'already-executed-focused-formal', sha256: sha(FORMAL), scope: formal.scope });
  });
  group('Read-only six ordinary rounds: independent interval integration, actual operations, separate quotas and first failure', () => {
    for (const result of ordinary.results) { const p = path.join(ROUNDS, result.name + '.json'); reviewRound(read(p), result, p); }
  });
} catch (error) { failure = { message: error.message, stack: error.stack }; }
const afterHashes = hashes(), sourceUnchanged = JSON.stringify(beforeHashes) === JSON.stringify(afterHashes);
const report = { passed: !failure && sourceUnchanged, checks: checks.length,
  scope: 'Integer1/240J constant-flow integration and closed-form fixed-step Euler heat, read-only over QA unique six actual ordinary rounds. No Model/pilot import, author witness, policy search, extra ordinary games, browser or hardware test.',
  startedAt, completedAt: new Date().toISOString(), sourceHashesBefore: beforeHashes, sourceHashesAfter: afterHashes, sourceUnchanged,
  sourcePaths: Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, path.relative(APP, p).split(path.sep).join('/')])), results: checks, details, evidence, failure };
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify({ passed: report.passed, checks: report.checks, sourceUnchanged, failure: failure?.message ?? null }) + '\n');
if (!report.passed) process.exitCode = 1;
