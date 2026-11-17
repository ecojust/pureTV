// Offline review of one already-recorded six-round corpus. Never loads/runs a
// production model, pilot, browser, author witness or design-exploration script.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { HZ, dimensions, dialIds, cropIds, levels, comfort, safe, damageLimits,
  climateInterval, waterPhases, weather, climateTrajectory, cropTrajectory } from './greenhouse-interval-oracle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = path.resolve(process.argv[2] || '/workspace/scratch/hundred-games/greenhouse-dials/ordinary-rounds-first');
const output = path.resolve(process.argv[3] || '/workspace/scratch/hundred-games/greenhouse-dials/independent-review-first');
const expectedContract = 'da85252bbb36e5c15214311aac90ccde7a036b2da8da20bd1afcdf8c21d80ad7';
const expectedReport = '1e7d505a3cb038727d4b4f0f2639fcfd903fe7502cc0f7de0bca0af4fc741705';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const failures = [];
let assertions = 0;
const equal = (actual, expected, where) => {
  assertions++;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push({ where, actual, expected });
};
const close = (actual, expected, where, maximums, key = where, tolerance = 1e-8) => {
  assertions++;
  const error = Math.abs(actual - expected);
  maximums[key] = Math.max(maximums[key] || 0, error);
  if (!Number.isFinite(actual) || !Number.isFinite(expected) || error > tolerance) failures.push({ where, actual, expected, error, tolerance });
};
const contractPath = path.join(root, 'docs/model-contract.md');
const startedAt = new Date().toISOString();
const sourcePaths = [contractPath, path.join(corpus, 'report.json'),
  ...['greenhouse-interval-oracle.mjs', 'independent-greenhouse-review.mjs'].map(name => path.join(root, 'tests', name)),
  ...[1, 2, 3].flatMap(level => ['record', 'loss'].map(mode => path.join(corpus, `level${level}-${mode}.json`)))];
const hashes = () => Object.fromEntries(sourcePaths.map(file => [file, hash(file)]));
const startHashes = hashes();
equal(hash(contractPath), expectedContract, 'contract SHA256');
equal(hash(path.join(corpus, 'report.json')), expectedReport, 'corpus report SHA256');
const report = json(path.join(corpus, 'report.json'));

// Evidence-level key mapping: this corpus uses Space=A, b=B, ArrowUp=previous,
// ArrowDown=next. Holds are checked to remain shorter than the 20-tick repeat
// delay. This review does not claim to test repeat/cancellation/pause behavior.
function reconstructInputs(raw, level) {
  const changes = raw.inputChanges, finalTick = raw.final.model.tick;
  let previous = [], selected = 0, index = 0, blocked = 0;
  const requested = [0, 0, 0], commands = [], snapshots = [];
  for (let i = 0; i < changes.length; i++) {
    const item = changes[i], end = i + 1 < changes.length ? changes[i + 1].tick : finalTick;
    equal(item.from, i ? changes[i - 1].to : [], `input ${i} chain`);
    equal(item.to.length <= 1, true, `input ${i} corpus uses at most one key`);
    equal(item.to.every(key => ['Space', 'b', 'ArrowUp', 'ArrowDown'].includes(key)), true, `input ${i} supported keys`);
    if (item.to.some(key => key.startsWith('Arrow'))) equal(end - item.tick < 20, true, `input ${i} below repeat delay`);
  }
  snapshots[0] = { requested: [...requested], selectedId: dialIds[selected], blockedCommands: blocked, commandCount: 0 };
  let held = [];
  for (let tick = 1; tick <= finalTick; tick++) {
    while (index < changes.length && changes[index].tick < tick) held = changes[index++].to;
    const fresh = held.filter(key => !previous.includes(key));
    if (fresh.includes('ArrowUp')) selected = Math.max(0, selected - 1);
    if (fresh.includes('ArrowDown')) selected = Math.min(2, selected + 1);
    const delta = fresh.includes('b') ? -1 : fresh.includes('Space') ? 1 : 0;
    if (delta) {
      const before = requested[selected], after = Math.max(0, Math.min(2, before + delta));
      if (before === after) blocked++;
      else {
        requested[selected] = after;
        commands.push({ id: commands.length + 1, dialId: dialIds[selected], beforeRequested: before,
          afterRequested: after, issuedTick: tick, dueTick: tick + level.delay });
      }
    }
    previous = held;
    snapshots[tick] = { requested: [...requested], selectedId: dialIds[selected], blockedCommands: blocked, commandCount: commands.length };
  }
  const applied = [0, 0, 0], applications = [];
  for (const command of commands) {
    if (command.dueTick > finalTick) continue;
    const index = dialIds.indexOf(command.dialId), before = applied[index];
    applied[index] = command.afterRequested;
    applications.push({ ...command, beforeApplied: before, afterApplied: command.afterRequested,
      appliedTick: command.dueTick, at: command.dueTick / HZ });
  }
  return { commands, applications, snapshots };
}

function reviewRound(name) {
  const startFailures = failures.length, startAssertions = assertions;
  const file = path.join(corpus, `${name}.json`), raw = json(file), level = levels[raw.result.level - 1];
  const maximumErrors = {}, inputs = reconstructInputs(raw, level);
  equal(raw.commands.map(item => item.receipt), inputs.commands, `${name} all accepted commands reconstructed from key changes`);
  equal(raw.applications.map(item => item.receipt), inputs.applications, `${name} all FIFO applications at exact due ticks`);
  const trajectory = climateTrajectory(level, inputs.commands, raw.final.model.tick);
  const crop = cropTrajectory(level, trajectory.samples);
  equal(crop.firstTerminal, { tick: raw.final.model.tick, reason: raw.final.model.phase === 'won' ? 'won' : raw.final.model.lostReason }, `${name} first terminal tick and priority`);
  const sources = [
    { label: 'initial', state: raw.initial }, { label: 'final', state: raw.final },
    ...raw.retained.map((item, i) => ({ label: `retained[${i}]`, state: item.state })),
    ...raw.commands.map((item, i) => ({ label: `commands[${i}]`, state: item.state })),
    ...raw.applications.map((item, i) => ({ label: `applications[${i}]`, state: item.state })),
  ];
  function numerical(actual, expected, label, prefix = '') {
    for (const key of dimensions) close(actual[key], expected[key], `${label}.${key}`, maximumErrors, prefix + key);
  }
  function commandState(tick) {
    const issued = inputs.commands.filter(c => c.issuedTick <= tick), applied = inputs.applications.filter(c => c.appliedTick <= tick);
    return { issued, applied, pending: issued.filter(c => c.dueTick > tick), input: inputs.snapshots[tick] };
  }
  for (const source of sources) {
    const actual = source.state.model, tick = actual.tick, expected = trajectory.samples[tick], gate = crop.states[tick];
    const label = `${name}.${source.label}@${tick}`, command = commandState(tick);
    numerical(actual.environment, expected.environment, label + '.environment');
    close(actual.reservoir.remainingLitres, expected.water, label + '.water', maximumErrors, 'remainingLitres');
    close(actual.reservoir.usedLitres, expected.usedTotal, label + '.used', maximumErrors, 'usedLitres');
    close(actual.reservoir.remainingLitres + actual.reservoir.usedLitres, level.water, label + '.ledger', maximumErrors, 'ledger');
    equal(actual.reservoir.initialLitres, level.water, label + '.initialWater');
    equal(actual.level, raw.result.level, label + '.level');
    equal(actual.delayTicks, level.delay, label + '.delayTicks');
    equal(actual.dryStallLimitTicks, 180, label + '.dryStallLimitTicks');
    equal(actual.elapsed, tick / HZ, label + '.elapsed');
    equal(actual.remaining, Math.max(0, 90 - tick / HZ), label + '.remaining');
    for (const key of ['dryStallTicks', 'unfinishedCropIds', 'deadCropIds', 'matureCount', 'phase', 'lostReason', 'score']) equal(actual[key], gate[key], label + '.' + key);
    equal(actual.selectedId, command.input.selectedId, label + '.selectedId');
    equal(actual.dials.map(d => d.id), dialIds, label + '.dialIds');
    equal(actual.dials.map(d => d.requestedLevel), command.input.requested, label + '.requested');
    equal(actual.dials.map(d => d.appliedLevel), expected.applied, label + '.applied');
    equal(actual.commandCount, command.issued.length, label + '.commandCount');
    equal(actual.appliedCommandCount, command.applied.length, label + '.appliedCommandCount');
    equal(actual.blockedCommands, command.input.blockedCommands, label + '.blockedCommands');
    equal(actual.pendingCommands, command.pending, label + '.pending FIFO');
    equal(actual.lastCommand, command.issued.at(-1) || null, label + '.lastCommand');
    equal(actual.lastAppliedCommands, tick ? inputs.applications.filter(c => c.appliedTick === tick) : null, label + '.lastAppliedCommands');
    equal(actual.currentWeather, weather(level, Math.max(0, tick - 1)), label + '.old-tick weather');
    actual.crops.forEach((item, i) => {
      for (const [key, value] of Object.entries(gate.crops[i])) equal(item[key], value, `${label}.${cropIds[i]}.${key}`);
      equal(item.maturityTicks, level.maturity[i], `${label}.${cropIds[i]}.maturityTicks`);
      equal(item.damageLimitTicks, damageLimits[i], `${label}.${cropIds[i]}.damageLimitTicks`);
      for (const [kind, bands] of [['comfort', comfort], ['safe', safe]])
        equal(item[kind], Object.fromEntries(dimensions.map((key, j) => [key, bands[i].slice(2 * j, 2 * j + 2)])), `${label}.${cropIds[i]}.${kind}`);
    });
    if (!tick) { equal(actual.lastInterval, null, label + '.initial interval'); continue; }
    const interval = actual.lastInterval, before = trajectory.samples[tick - 1], applied = expected.applied;
    numerical(interval.beforeEnvironment, before.environment, label + '.beforeEnvironment', 'intervalBefore.');
    numerical(interval.afterEnvironment, expected.environment, label + '.afterEnvironment', 'intervalAfter.');
    close(interval.beforeWater, before.water, label + '.beforeWater', maximumErrors, 'intervalBeforeWater');
    close(interval.usedLitres, expected.used, label + '.usedLitres', maximumErrors, 'intervalUsed');
    close(interval.actualDripLps, expected.used * HZ, label + '.actualDripLps', maximumErrors, 'actualDripLps');
    close(interval.evaporationPctPerSec, .35 + .025 * Math.max(before.environment.temperature - 24, 0) + .08 * applied[0] - .06 * applied[1], label + '.evaporation', maximumErrors, 'evaporation');
    for (const [key, value] of Object.entries({ fromTick: tick - 1, toTick: tick, fromTime: (tick - 1) / HZ, toTime: tick / HZ,
      appliedLevels: Object.fromEntries(dialIds.map((id, i) => [id, applied[i]])), heatInput: expected.weather.heatInput,
      growthCropIds: gate.crops.filter(c => c.growing).map(c => c.id), damagedCropIds: gate.crops.filter(c => c.dangerous).map(c => c.id) })) equal(interval[key], value, label + '.interval.' + key);
  }
  for (const [i, actual] of raw.compactTrace.entries()) {
    const tick = actual.tick, expected = trajectory.samples[tick], gate = crop.states[tick], command = commandState(tick), label = `${name}.compact[${i}]@${tick}`;
    numerical(actual.environment, expected.environment, label);
    close(actual.remainingLitres, expected.water, label + '.water', maximumErrors, 'remainingLitres');
    for (const [key, value] of Object.entries({ selectedId: command.input.selectedId, requested: command.input.requested, applied: expected.applied,
      growthTicks: gate.crops.map(c => c.growthTicks), damageTicks: gate.crops.map(c => c.damageTicks), commandCount: command.issued.length,
      appliedCommandCount: command.applied.length, pendingCount: command.pending.length, dryStallTicks: gate.dryStallTicks })) equal(actual[key], value, label + '.' + key);
  }
  for (const key of dimensions) {
    const values = trajectory.samples.map(s => s.environment[key]);
    close(raw.result.environmentBounds[key].minimum, Math.min(...values), `${name}.minimum.${key}`, maximumErrors, 'bounds.' + key);
    close(raw.result.environmentBounds[key].maximum, Math.max(...values), `${name}.maximum.${key}`, maximumErrors, 'bounds.' + key);
  }
  const final = crop.states.at(-1);
  equal(raw.result.growthTicks, final.crops.map(c => c.growthTicks), name + '.result growth');
  equal(raw.result.damageTicks, final.crops.map(c => c.damageTicks), name + '.result damage');
  equal(raw.result.maximumDryStallTicks, Math.max(...crop.states.map(s => s.dryStallTicks)), name + '.maximum stall');
  equal(raw.result.score, final.score, name + '.result score');
  const firstDryTick = trajectory.samples.findIndex(s => s.water <= 1e-9);
  const firstStallTick = crop.states.findIndex(s => s.dryStallTicks > 0);
  return { name, rawSha256: hash(file), passed: failures.length === startFailures, assertions: assertions - startAssertions,
    retainedStates: raw.retained.length, fullStateOccurrences: sources.length, compactCheckpoints: raw.compactTrace.length,
    distinctFullTicks: new Set(sources.map(s => s.state.model.tick)).size,
    commands: inputs.commands.length, applications: inputs.applications.length, intervals: trajectory.segments.length,
    terminal: crop.firstTerminal, growthTicks: final.crops.map(c => c.growthTicks), damageTicks: final.crops.map(c => c.damageTicks),
    water: trajectory.samples.at(-1).water, firstDryTick: firstDryTick < 0 ? null : firstDryTick,
    firstStallTick: firstStallTick < 0 ? null : firstStallTick, nearestBoundary: crop.nearestBoundary,
    ambiguousBoundaryCount: crop.ambiguousBoundaries.length, ambiguousBoundaries: crop.ambiguousBoundaries.slice(0, 12), maximumErrors,
    soilClampPieces: trajectory.segments.reduce((sum, s) => sum + s.soilPieces.filter(p => p.kind === 'clamp').length, 0),
    partialFlowIntervals: trajectory.segments.filter(s => s.usedPerTick > 0 && s.usedPerTick < s.applied[2] / 120).length };
}

// Two hand-computed oracle-only checks; these are not additional game rounds.
const fixtureErrors = {};
const one = climateInterval({ temperature: 24, humidity: 60, soilMoisture: 48 }, 1, .9, [0, 0, 1], 1 / 120).sample(1);
close(one.temperature, 24.015, 'hand fixture temperature', fixtureErrors);
close(one.humidity, 60 + .425 / 60, 'hand fixture humidity', fixtureErrors);
close(one.soilMoisture, 48 + .65 / 60, 'hand fixture soil uses old T=24', fixtureErrors);
equal(waterPhases(.025 * 120, 2, 3), [{ count: 1, unitsPerTick: 2 }, { count: 1, unitsPerTick: 1 }, { count: 1, unitsPerTick: 0 }], 'hand fixture 0.025L full/partial/dry phases');
const results = report.results.map(result => reviewRound(result.name));
const endHashes = hashes();
equal(endHashes, startHashes, 'source/input hashes unchanged across offline review');
const summary = {
  passed: failures.length === 0, scope: 'Independent offline arithmetic review of the existing first six ordinary model rounds; no model or pilot execution.',
  correction: { firstReviewSha256: '01857b3a7f40e878eca08dbbc2bc260ab75ade216e9a919c25b8ea4f0b8d53f2',
    reason: 'Correct partial-flow coverage classification relative to the applied drip level. A final drip2 tick using 1/120 litre was incorrectly counted as full flow. Climate arithmetic, integer counters and terminal checks are unchanged; the first review is preserved.' },
  startedAt, completedAt: new Date().toISOString(), startHashes, endHashes, sourceUnchanged: JSON.stringify(startHashes) === JSON.stringify(endHashes),
  contractSha256: hash(contractPath), corpusReportSha256: hash(path.join(corpus, 'report.json')),
  toolHashes: Object.fromEntries(['greenhouse-interval-oracle.mjs', 'independent-greenhouse-review.mjs'].map(name => [name, hash(path.join(root, 'tests', name))])),
  method: [
    'Reconstruct accepted command receipts from recorded held/released keys; check absolute targets, fixed delay, FIFO application and each checkpoint pending queue.',
    'Partition at old-tick weather boundaries, application ticks and water phases. T/H use discrete geometric decay; soil uses the cumulative old-temperature positive part, split at T=24 and soil increment sign/clamp changes.',
    'Evaluate the closed form at integer endpoints, then independently count each crop comfort conjunction, danger union, maturity cap, continued mature damage, unfinished-crop dry stall and first terminal tick.',
    'Compare every retained/command/application/initial/final full state and every compact climate/progress checkpoint; no observed climate is used to restart the oracle.',
  ],
  tolerances: { climateAndWaterAbsolute: 1e-8, integerCounters: 0, gatePredicates: 'Exact closed intervals without relaxed gates; report proximity <=1e-8 as numerical ambiguity.' },
  limitations: [
    'Double-precision geometric formulas rearrange the contract arithmetic and are not bit-identical to repeated IEEE-754 Euler updates.',
    'Only six existing ordinary rounds are evidence. Oracle hand fixtures are separate arithmetic checks, not game runs or production boundary tests.',
    'Input evidence has one key at a time, direction holds below 20 ticks, and no pause/retry/cancel/subtick events; those behaviors are outside this review.',
    'The six rounds do not establish simultaneous terminal precedence or post-terminal freeze behavior. The terminal rule is independently evaluated along the observed trajectories.',
    'T/H equilibrium bounds under authored controls stay inside their clamps; soil clamp handling is explicit but ordinary coverage is reported rather than presumed.',
    'Recorded keyboard mapping is evidence-specific; this review makes no browser or physical-device claim.',
  ],
  oracleOnlyFixtures: { count: 2, descriptions: ['One tick at T=24 with drip1 confirms old-temperature evaporation.', '0.025 litre with drip2 over three ticks separates full, partial and dry flow.'], maximumErrors: fixtureErrors },
  assertions, results, failureCount: failures.length, failures,
};
fs.mkdirSync(output, { recursive: false });
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ passed: summary.passed, assertions, failureCount: failures.length, output: path.join(output, 'report.json'),
  rounds: results.map(r => ({ name: r.name, passed: r.passed, terminal: r.terminal, nearestBoundary: r.nearestBoundary.margin, maximumErrors: r.maximumErrors })) }, null, 2));
if (!summary.passed) process.exitCode = 1;
