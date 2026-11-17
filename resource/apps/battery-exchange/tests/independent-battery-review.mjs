// Existing-observation review only. No production Model, pilot or author solver.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import { CELL_IDS, LOAD_IDS, sum, readParameters, circuit, thermal, cellSpan, workSpan,
  completionIntervals, done, deficit, inBand, schedulePosition } from './battery-interval-oracle.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [corpusArg, outputArg, approvedIndexHash, shapeArg] = process.argv.slice(2);
if (!corpusArg || !outputArg || !shapeArg || !/^[a-f0-9]{64}$/.test(approvedIndexHash || '')) throw new Error('Supply public corpus, fresh output, approved index SHA256 and public shape note');
const corpus = path.resolve(corpusArg), output = path.resolve(outputArg), contractPath = path.join(app, 'docs/model-contract.md');
const expectedContractHash = 'c88b77aa625c3f4f0378422f0e491a05c2d2c057553e4e60da91c049bb87062f';
const shapePath = path.resolve(shapeArg);
const expectedShapeHash = 'bedcea298e8d8fb1c5924c8788fd7e1cba37c5fec218c5876814c414774b0d24';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const copy = value => structuredClone(value);
const indexPath = path.join(corpus, 'index.json');
if (hash(indexPath) !== approvedIndexHash) throw new Error('Unapproved observation index; case files were not read');
const index = read(indexPath);
if (index.rounds.length !== 6 || new Set(index.rounds.map(r => r.file)).size !== 6 ||
  !index.rounds.every(r => /^level[1-3]-(record|loss)\.json$/.test(r.file) && r.file === r.name + '.json')) throw new Error('Expected six approved cases');
const portable = file => file.startsWith('/workspace/pureTV/') ? 'repoRelative:' + file.slice('/workspace/pureTV/'.length) : 'scratchRelative:' + path.relative('/workspace/scratch', file);
const sourceFiles = [indexPath, contractPath, shapePath, ...['battery-interval-oracle.mjs', 'independent-battery-review.mjs'].map(file => path.join(app, 'tests', file)),
  ...index.rounds.map(entry => path.join(corpus, entry.file))];
const hashes = () => Object.fromEntries(sourceFiles.map(file => [portable(file), hash(file)]));
const startedAt = new Date().toISOString(), startHashes = hashes();
const parameters = readParameters(fs.readFileSync(contractPath, 'utf8')), physics = parameters.simulation, tolerance = physics.ledgerComparisonTolerance;
let assertions = 0;
const failures = [], maximumErrors = { chargeC: 0, energyJ: 0, temperatureC: 0, powerW: 0, other: 0 };
let chargeBoundaryOverrides = new Map(), scalarChargeWitnesses = [], observedChargeError = new Map();
function exact(actual, expected, label) {
  assertions++;
  if (!isDeepStrictEqual(actual, expected)) failures.push({ label, actual, expected });
}
function near(actual, expected, label) {
  assertions++;
  const error = Math.abs(actual - expected), kind = /[Qq]uota|[Ww]ork|[Ee]nergy|[Hh]eatJ|deficitJ|errorJ/.test(label) ? 'energyJ' :
    /[Cc]harge|errorC/.test(label) ? 'chargeC' : /[Tt]emperature/.test(label) ? 'temperatureC' : /[Pp]ower/.test(label) ? 'powerW' : 'other';
  if (Number.isFinite(error)) maximumErrors[kind] = Math.max(maximumErrors[kind], error);
  if (typeof actual !== 'number' || !Number.isFinite(actual) || !Number.isFinite(expected) || error > tolerance) failures.push({ label, actual, expected, tolerance });
}
function match(actual, expected, label) {
  if (typeof expected === 'number') return near(actual, expected, label);
  if (Array.isArray(expected)) {
    exact(Array.isArray(actual), true, label + '.array'); exact(actual?.length, expected.length, label + '.length');
    for (const [i, value] of expected.entries()) match(actual?.[i], value, label + '[' + i + ']');
  } else if (expected && typeof expected === 'object') {
    for (const [key, value] of Object.entries(expected)) match(actual?.[key], value, label + '.' + key);
  } else exact(actual, expected, label);
}
exact(hash(contractPath), expectedContractHash, 'approved contract');
exact(hash(shapePath), expectedShapeHash, 'public receipt shape note');
for (const entry of index.rounds) {
  exact(entry.sourceHashes.contract, expectedContractHash, entry.name + '.ordinary contract identity');
  exact(/^[a-f0-9]{64}$/.test(entry.originalReportSha256), true, entry.name + '.source report provenance');
  exact(entry.passed, true, entry.name + '.completed actual corpus case');
  const run = index.sourceRuns.find(source => source.sha256 === entry.originalReportSha256);
  exact(!!run, true, entry.name + '.explicit source run');
  if (run) { exact(entry.sourceHashes, run.startHashes, entry.name + '.source run start identity'); exact(entry.sourceHashes, run.endHashes, entry.name + '.source run end identity'); }
}

const configOf = state => ({ cursor: state.cursor, sourceSlot: state.sourceSlot, slots: state.slots.slice(), topologies: state.topologies.slice() });
const physicalConfig = config => ({ slots: config.slots.slice(), topologies: config.topologies.slice() });
const classifiedCharge = (tick, cell) => chargeBoundaryOverrides.get(tick + ':' + cell.id) ?? cell.remainingChargeC;
const requests = (level, stageIndex) => stageIndex === null ? [] : LOAD_IDS.map((loadId, row) => ({ loadId, stageIndex,
  requirementId: level.stages[stageIndex].requirements[row], ...level.requirements[level.stages[stageIndex].requirements[row]] }));
const segmentView = (level, tick) => {
  const position = schedulePosition(level, tick);
  return { ...position, inputWindowOpen: position.kind === 'window', requirements: requests(level, position.stageIndex),
    remainingTicks: Math.max(0, position.endTick - tick) };
};
function initialPhysical(level) {
  return { tick: 0,
    cells: parameters.cells.map((cell, i) => ({ id: cell.id, voltageV: physics.nominalCellVoltageV, resistanceOhm: cell.resistanceOhm,
      initialChargeC: level.initialChargeC[i], consumedChargeC: 0, remainingChargeC: level.initialChargeC[i],
      temperatureC: physics.ambientC, generatedHeatJ: 0, removedHeatJ: 0, sourceEnergyJ: 0,
      lastCurrentA: 0, lastSourcePowerW: 0, lastHeatPowerW: 0 })),
    loads: LOAD_IDS.map((id, row) => ({ id, row, resistanceOhm: parameters.circuit.loadResistanceOhm, slotIndices: [row * 3, row * 3 + 1],
      temperatureC: physics.ambientC, generatedHeatJ: 0, removedHeatJ: 0, deliveredEnergyJ: 0, creditedWorkJ: 0,
      overflowEnergyJ: 0, outOfBandEnergyJ: 0, consecutiveBadPowerTicks: 0,
      stages: level.stages.map((stage, i) => ({ index: i, requirementId: stage.requirements[row], startTick: stage.startTick, endTick: stage.endTick,
        ...level.requirements[stage.requirements[row]], workJ: 0, deficitJ: level.requirements[stage.requirements[row]].targetWorkJ,
        deliveredEnergyJ: 0, overflowEnergyJ: 0, outOfBandEnergyJ: 0, goodIntervals: 0, badIntervals: 0, peakBadPowerTicks: 0,
        startedAtTick: null, completedAtTick: null, endedAtTick: null })),
      lastElectrical: { fromTick: null, toTick: null, stageIndex: null, requested: false, connected: false, disconnectReason: 'not-started',
        powerInBand: null, circuit: null, currentA: 0, terminalVoltageV: 0, loadPowerW: 0, sourcePowerW: 0, internalHeatPowerW: 0 } })) };
}

function ratesAt(origin, level, configuration) {
  const segment = schedulePosition(level, origin.tick), stageIndex = segment.stageIndex;
  const preGuard = origin.cells.filter(cell => classifiedCharge(origin.tick, cell) <= 0).map(cell => cell.id);
  const loads = origin.loads.map((load, row) => {
    const stage = stageIndex === null ? null : load.stages[stageIndex];
    const requested = stage !== null && !done(stage.workJ, stage.targetWorkJ, physics);
    const solved = requested && !preGuard.length ? circuit(configuration.topologies[row], configuration.slots.slice(row * 3, row * 3 + 2), parameters) : null;
    return { stage, requested, circuit: solved, connected: solved !== null,
      disconnectReason: !stage ? 'off-window' : !requested ? 'stage-complete' : preGuard.length ? 'pre-supply-charge-failure' : null,
      powerInBand: solved ? inBand(solved.loadPowerW, stage, physics) : null };
  });
  const branches = new Map(loads.flatMap(load => load.circuit?.branches || []).map(branch => [branch.cellId, branch]));
  return { segment, preGuard, loads, branches };
}

// Each sample is evaluated from the immutable span origin. A sampled endpoint
// is not fed into the next sampled tick; only true rate boundaries start spans.
function sampleSpan(span, count) {
  if (!count) return copy(span.origin);
  if (count < 0 || count > span.toTick - span.fromTick) throw new Error('Sample outside fixed-rate span');
  const { origin, rates } = span, tick = origin.tick + count;
  const cells = origin.cells.map(cell => cellSpan(cell, rates.branches.get(cell.id), count, physics));
  const loads = origin.loads.map((before, row) => {
    const rate = rates.loads[row], load = copy(before), stageIndex = rates.segment.stageIndex;
    const stage = stageIndex === null ? null : load.stages[stageIndex], power = rate.circuit?.loadPowerW || 0;
    Object.assign(load, thermal(before, power * physics.loadHeatFraction, count, physics.loadThermalCapacityJK, physics.loadConductanceWK, physics));
    if (stage && stage.startedAtTick === null) stage.startedAtTick = stage.startTick + 1;
    const reset = !rate.requested || origin.tick === rates.segment.startTick;
    const badBefore = reset ? 0 : before.consecutiveBadPowerTicks;
    load.consecutiveBadPowerTicks = !rate.connected ? (reset ? 0 : badBefore) : rate.powerInBand ? 0 : badBefore + count;
    if (rate.connected) {
      const advanced = workSpan(stage, power, count, physics), delta = advanced.delta;
      delete advanced.delta; Object.assign(stage, advanced);
      stage.peakBadPowerTicks = Math.max(stage.peakBadPowerTicks, load.consecutiveBadPowerTicks);
      load.deliveredEnergyJ += delta.deliveredEnergyJ; load.creditedWorkJ += delta.creditedWorkJ;
      load.overflowEnergyJ += delta.overflowEnergyJ; load.outOfBandEnergyJ += delta.outOfBandEnergyJ;
      if (done(stage.workJ, stage.targetWorkJ, physics) && stage.completedAtTick === null) stage.completedAtTick = tick;
    }
    if (stage && tick === stage.endTick) stage.endedAtTick = tick;
    load.lastElectrical = { fromTick: tick - 1, toTick: tick, stageIndex, requested: rate.requested, connected: rate.connected,
      disconnectReason: rate.disconnectReason, powerInBand: rate.powerInBand, circuit: copy(rate.circuit),
      ...Object.fromEntries(['currentA', 'terminalVoltageV', 'loadPowerW', 'sourcePowerW', 'internalHeatPowerW'].map(key => [key, rate.circuit?.[key] || 0])) };
    return load;
  });
  return { tick, cells, loads };
}

// The real-arithmetic closed form and a chronological Number sum can straddle
// strict zero. Only that measured ambiguity triggers this one-scalar fold.
// Its rates come exclusively from our circuits, never observed current values.
function resolveChargeBoundaries(state, observedRows, spans, label) {
  if (!state.tick) return;
  for (const [i, cell] of state.cells.entries()) {
    const observed = observedRows[i].chargeAfterC, error = Math.abs(observed - cell.remainingChargeC);
    const envelope = Math.max(observedChargeError.get(cell.id) || 0, error); observedChargeError.set(cell.id, envelope);
    const key = state.tick + ':' + cell.id;
    if (!envelope || Math.abs(cell.remainingChargeC) > envelope || chargeBoundaryOverrides.has(key)) continue;
    let consumed = 0, scalarAdditions = 0;
    for (const span of spans) {
      const count = Math.max(0, Math.min(state.tick, span.toTick) - span.fromTick), current = span.rates.branches.get(cell.id)?.currentA || 0;
      if (!current) continue;
      const increment = current / physics.tickHz;
      for (let n = 0; n < count; n++) consumed += increment;
      scalarAdditions += count;
    }
    const canonical = cell.initialChargeC - consumed, agrees = (canonical > 0) === (observed > 0);
    chargeBoundaryOverrides.set(key, canonical);
    scalarChargeWitnesses.push({ cellId: cell.id, tick: state.tick, scalarAdditions, chronologicalIntervals: state.tick,
      closedFormRemainingC: cell.remainingChargeC, independentlyAccumulatedRemainingC: canonical, observedRemainingC: observed,
      triggerErrorEnvelopeC: envelope, strictGateAgrees: agrees, status: agrees ? 'scalar-resolved' : 'inconclusive' });
    exact(agrees, true, label + '.independent canonical scalar charge gate; disagreement is inconclusive');
    near(canonical, observed, label + '.independent scalar charge value');
  }
}

function buildSpans(level, configurationAt, raw, label) {
  const finalTick = raw.final.model.tick;
  let origin = initialPhysical(level);
  const spans = [];
  while (origin.tick < finalTick) {
    if (origin.tick) resolveChargeBoundaries(origin, raw.intervalTrace[origin.tick - 1].cells, spans, label);
    const configuration = configurationAt(origin.tick + 1), rates = ratesAt(origin, level, configuration);
    let until = Math.min(finalTick, rates.segment.endTick);
    if (rates.preGuard.length) until = Math.min(until, origin.tick + 1);
    for (const rate of rates.loads) if (rate.connected && rate.powerInBand)
      until = Math.min(until, origin.tick + completionIntervals(rate.stage.workJ, rate.stage, rate.circuit.loadPowerW, physics));
    if (until <= origin.tick) throw new Error('Nonadvancing physical span');
    const span = { fromTick: origin.tick, toTick: until, origin, rates, configuration: physicalConfig(configuration) };
    spans.push(span); origin = sampleSpan(span, until - origin.tick);
  }
  return spans;
}

function endingAt(state, level, rates) {
  const tick = state.tick, stageIndex = rates?.segment.stageIndex ?? null, facts = [];
  const fact = (kind, entityId, actualValue, limitValue, unit, extra = {}) => ({ kind, entityId, stageIndex, fromTick: tick - 1, tick, actualValue, limitValue, unit, ...extra });
  for (const cell of state.cells) if (classifiedCharge(tick, cell) <= 0) facts.push(fact('cell-charge', cell.id, classifiedCharge(tick, cell), 0, 'C',
    { boundary: rates?.preGuard.includes(cell.id) ? 'pre-supply' : 'interval-end' }));
  for (const cell of state.cells) if (cell.temperatureC >= physics.cellMaximumTemperatureC) facts.push(fact('cell-overheat', cell.id, cell.temperatureC, physics.cellMaximumTemperatureC, 'degC'));
  for (const load of state.loads) if (load.temperatureC >= physics.loadMaximumTemperatureC) facts.push(fact('load-overheat', load.id, load.temperatureC, physics.loadMaximumTemperatureC, 'degC'));
  for (const load of state.loads) if (!rates?.preGuard.length && load.consecutiveBadPowerTicks >= physics.consecutivePowerFaultTicks)
    facts.push(fact('power-fault', load.id, load.consecutiveBadPowerTicks, physics.consecutivePowerFaultTicks, 'ticks'));
  if (stageIndex !== null && tick === level.stages[stageIndex].endTick) for (const load of state.loads) {
    const stage = load.stages[stageIndex];
    if (!done(stage.workJ, stage.targetWorkJ, physics)) facts.push(fact('stage-quota', load.id, stage.workJ, stage.targetWorkJ, 'J', { deficitJ: stage.deficitJ }));
  }
  const won = state.loads.every(load => done(load.stages[2].workJ, load.stages[2].targetWorkJ, physics));
  const phase = facts.length ? 'lost' : won ? 'won' : 'playing';
  return { phase, lostReason: facts[0]?.kind || null, failures: facts,
    score: phase === 'won' ? 1000 + 2 * Math.floor((level.closeTick - tick) / 60) + Math.floor(sum(state.cells.map(cell => cell.remainingChargeC))) : 0 };
}

function intervalAt(span, tick, configuration, level) {
  const count = tick - span.fromTick, before = sampleSpan(span, count - 1), after = sampleSpan(span, count), { rates } = span;
  const stageIndex = rates.segment.stageIndex;
  const cells = after.cells.map((cell, i) => {
    const old = before.cells[i], slot = configuration.slots.indexOf(cell.id), branch = rates.branches.get(cell.id);
    return { cellId: cell.id, slot, loadId: slot % 3 === 2 ? null : LOAD_IDS[Math.floor(slot / 3)],
      currentA: branch?.currentA || 0, sourcePowerW: branch?.sourcePowerW || 0, heatPowerW: branch?.heatPowerW || 0,
      chargeBeforeC: old.remainingChargeC, chargeUsedC: (branch?.currentA || 0) / physics.tickHz, chargeAfterC: cell.remainingChargeC,
      temperatureBeforeC: old.temperatureC, generatedHeatJ: (branch?.heatPowerW || 0) / physics.tickHz,
      removedHeatJ: physics.cellConductanceWK * (old.temperatureC - physics.ambientC) / physics.tickHz,
      temperatureAfterC: cell.temperatureC, sourceEnergyJ: (branch?.sourcePowerW || 0) / physics.tickHz };
  });
  const loads = after.loads.map((load, i) => {
    const old = before.loads[i], rate = rates.loads[i], stage = stageIndex === null ? null : load.stages[stageIndex];
    const oldStage = stageIndex === null ? null : old.stages[stageIndex], power = rate.circuit?.loadPowerW || 0;
    const delivered = power / physics.tickHz, credit = rate.connected && rate.powerInBand ? Math.min(delivered, deficit(oldStage.workJ, oldStage.targetWorkJ)) : 0;
    return { loadId: load.id, stageIndex, requested: rate.requested, connected: rate.connected, disconnectReason: rate.disconnectReason,
      circuit: copy(rate.circuit), powerInBand: rate.powerInBand, workBeforeJ: oldStage?.workJ ?? null, creditedWorkJ: credit, workAfterJ: stage?.workJ ?? null,
      deliveredEnergyJ: delivered, overflowEnergyJ: rate.powerInBand ? delivered - credit : 0, outOfBandEnergyJ: rate.powerInBand === false ? delivered : 0,
      badPowerTicksBefore: old.consecutiveBadPowerTicks, badPowerTicksAfter: load.consecutiveBadPowerTicks,
      temperatureBeforeC: old.temperatureC, generatedHeatJ: power * physics.loadHeatFraction / physics.tickHz,
      removedHeatJ: physics.loadConductanceWK * (old.temperatureC - physics.ambientC) / physics.tickHz, temperatureAfterC: load.temperatureC,
      completedNow: stage !== null && oldStage.completedAtTick === null && stage.completedAtTick === tick };
  });
  return { before, after, cells, loads, stageIndex, ending: endingAt(after, level, rates) };
}

function checkFull(wrapper, expected, rates, configuration, level, label) {
  const actual = wrapper.model, ending = endingAt(expected, level, rates), tick = expected.tick;
  match(actual, { tick, elapsed: tick / physics.tickHz, closeTick: level.closeTick, remaining: (level.closeTick - tick) / physics.tickHz,
    level: level.level, difficulty: level.level - 1, ...ending, ...configuration,
    controlsOpen: ending.phase === 'playing' && schedulePosition(level, tick).kind === 'window' }, label);
  exact(wrapper.phase, ending.phase, label + '.wrapper.phase'); near(wrapper.score, ending.score, label + '.wrapper.score');
  exact(actual.cells.map(cell => cell.id), CELL_IDS, label + '.stable cell identity');
  exact(actual.loads.map(load => load.id), LOAD_IDS, label + '.stable load identity');
  exact([...actual.slots].sort(), CELL_IDS, label + '.one instance of every cell');
  const schedule = level.windows.flatMap((window, i) => [window[0], level.stages[i].startTick]).map(start => {
    const view = segmentView(level, start); delete view.remainingTicks; return view;
  });
  match(actual.schedule, schedule, label + '.immutable schedule');
  match(actual.viewSegment, segmentView(level, tick), label + '.viewSegment');
  match(actual.nextSegment, schedule[schedulePosition(level, tick).index + 1] || null, label + '.nextSegment');
  match(actual.physics, Object.fromEntries(Object.entries(physics).filter(([, value]) => typeof value === 'number')), label + '.physics');
  for (const [i, cell] of expected.cells.entries()) {
    const slot = configuration.slots.indexOf(cell.id), actualCell = actual.cells[i];
    match(actualCell, { ...cell, slot, loadId: slot % 3 === 2 ? null : LOAD_IDS[Math.floor(slot / 3)], heatBalanceErrorJ: 0 }, label + '.cells[' + i + ']');
    near(actualCell.initialChargeC - actualCell.consumedChargeC - actualCell.remainingChargeC, 0, label + '.cell charge identity');
    near(physics.cellThermalCapacityJK * (actualCell.temperatureC - physics.ambientC) - actualCell.generatedHeatJ + actualCell.removedHeatJ, 0, label + '.cell heatJ identity');
    near(actualCell.sourceEnergyJ - physics.nominalCellVoltageV * actualCell.consumedChargeC, 0, label + '.source energyJ identity');
  }
  for (const [i, load] of expected.loads.entries()) {
    const actualLoad = actual.loads[i];
    match(actualLoad, { ...load, workPartitionErrorJ: 0, heatBalanceErrorJ: 0 }, label + '.loads[' + i + ']');
    near(actualLoad.deliveredEnergyJ - actualLoad.creditedWorkJ - actualLoad.overflowEnergyJ - actualLoad.outOfBandEnergyJ, 0, label + '.load workJ partition');
    near(physics.loadThermalCapacityJK * (actualLoad.temperatureC - physics.ambientC) - actualLoad.generatedHeatJ + actualLoad.removedHeatJ, 0, label + '.load heatJ identity');
    near(actualLoad.generatedHeatJ - physics.loadHeatFraction * actualLoad.deliveredEnergyJ, 0, label + '.load heatJ fraction');
    near(sum(actualLoad.stages.map(stage => stage.workJ)), actualLoad.creditedWorkJ, label + '.stage workJ total');
    for (const stage of actualLoad.stages) near(stage.deliveredEnergyJ - stage.workJ - stage.overflowEnergyJ - stage.outOfBandEnergyJ, 0, label + '.stage workJ partition');
  }
  match(actual.chargeLedger, { initialChargeC: sum(expected.cells.map(cell => cell.initialChargeC)), consumedChargeC: sum(expected.cells.map(cell => cell.consumedChargeC)),
    remainingChargeC: sum(expected.cells.map(cell => cell.remainingChargeC)), errorC: 0 }, label + '.chargeLedger');
  match(actual.electricalLedger, { sourceEnergyJ: sum(expected.cells.map(cell => cell.sourceEnergyJ)), deliveredEnergyJ: sum(expected.loads.map(load => load.deliveredEnergyJ)),
    internalHeatJ: sum(expected.cells.map(cell => cell.generatedHeatJ)), errorJ: 0 }, label + '.electricalLedger');
  near(sum(actual.cells.map(cell => cell.sourceEnergyJ)) - sum(actual.loads.map(load => load.deliveredEnergyJ)) - sum(actual.cells.map(cell => cell.generatedHeatJ)),
    0, label + '.round electrical energyJ identity');
}

function sourcesOf(raw) {
  return [{ label: 'initial', state: raw.initial }, { label: 'final', state: raw.final },
    ...raw.retained.map((record, i) => ({ label: `retained[${i}]`, state: record.state })),
    ...raw.eventTransitions.flatMap((record, i) => [{ label: `eventTransitions[${i}].before`, state: record.before }, { label: `eventTransitions[${i}].after`, state: record.after }]),
    ...raw.operations.flatMap((record, i) => [{ label: `operations[${i}].before`, state: record.before }, { label: `operations[${i}].after`, state: record.after }])];
}

function auditEventWindows(raw, label) {
  let eventCount = 0, lastTick = 0;
  const byTick = new Map();
  for (const [i, record] of raw.eventTransitions.entries()) {
    const basis = label + '.eventTransitions[' + i + ']';
    exact(record.tick > lastTick, true, basis + '.strictly ordered'); lastTick = record.tick;
    exact(record.before.model.tick, record.tick - 1, basis + '.before tick'); exact(record.after.model.tick, record.tick, basis + '.after tick');
    exact(record.events, record.after.model.events, basis + '.detached actual events');
    exact(record.actualLastInterval, record.after.model.lastInterval, basis + '.detached actual interval');
    exact(record.eventCountBefore, eventCount, basis + '.complete event count before');
    for (const event of record.events) { eventCount++; match(event, { id: eventCount, tick: record.tick }, basis + '.event identity'); }
    exact(record.eventCountAfter, eventCount, basis + '.complete event count after');
    exact(record.after.model.eventCount, eventCount, basis + '.model event count'); byTick.set(record.tick, record);
  }
  exact(eventCount, raw.final.model.eventCount, label + '.all events retained');
  for (const [i, operation] of raw.operations.entries()) {
    const tick = operation.after.model.tick, record = byTick.get(tick), basis = label + '.operations[' + i + ']';
    exact(!!record, true, basis + '.has actual event window');
    if (record) { exact(operation.before, record.before, basis + '.before window'); exact(operation.after, record.after, basis + '.after window'); }
  }
  return byTick;
}

const historyNames = ['commandReceipts', 'blockedReceipts', 'navigationReceipts', 'automaticMarkClearReceipts',
  'stageStartReceipts', 'workCompletionReceipts', 'stageEndReceipts'];
function auditConfiguration(raw, level, label) {
  const final = raw.final.model, configuration = { cursor: 0, sourceSlot: null, slots: level.initialSlots.slice(), topologies: level.initialTopologies.slice() };
  const configurations = [copy(configuration)], histories = Object.fromEntries(historyNames.map(name => [name, final[name]]));
  const groupAt = (name, tick) => histories[name].filter(receipt => receipt.tick === tick);
  for (const name of historyNames) {
    let lastTick = 0;
    for (const [i, receipt] of histories[name].entries()) {
      exact(receipt.id, i + 1, label + '.' + name + '.stable id');
      exact(Number.isSafeInteger(receipt.tick) && receipt.tick >= lastTick && receipt.tick <= final.tick, true, label + '.' + name + '.ordered tick');
      lastTick = receipt.tick;
    }
  }
  for (const [i, interval] of raw.intervalTrace.entries()) {
    const tick = i + 1, fromTick = i, segment = schedulePosition(level, fromTick), basis = label + '.configuration@' + tick;
    exact(interval.fromTick, fromTick, basis + '.interval fromTick'); exact(interval.tick, tick, basis + '.interval tick');
    const clears = groupAt('automaticMarkClearReceipts', tick), navigation = groupAt('navigationReceipts', tick);
    const commands = groupAt('commandReceipts', tick), blocked = groupAt('blockedReceipts', tick);
    exact(commands.length + blocked.length <= 1, true, basis + '.one fresh action'); exact(navigation.length <= 1, true, basis + '.one actual navigation');
    if (configuration.sourceSlot !== null && segment.kind === 'supply' && fromTick === segment.startTick)
      exact(clears.some(receipt => receipt.reason === 'window-close'), true, basis + '.required obsolete mark clear');
    for (const receipt of clears) {
      exact(receipt.before, configuration, basis + '.clear before'); exact(configuration.sourceSlot !== null, true, basis + '.clear existing mark');
      match(receipt, { fromTick, tick, segmentIndex: segment.index, sourceSlot: configuration.sourceSlot }, basis + '.clear identity');
      exact(['window-close', 'runtime-cancel'].includes(receipt.reason), true, basis + '.clear reason');
      if (receipt.reason === 'window-close') exact(segment.kind === 'supply' && fromTick === segment.startTick, true, basis + '.window clear boundary');
      configuration.sourceSlot = null; exact(receipt.after, configuration, basis + '.clear after');
    }
    const cursor = interval.configuration.cursor, beforeCursor = configuration.cursor;
    exact(Number.isInteger(cursor) && cursor >= 0 && cursor < 6, true, basis + '.cursor domain');
    if (cursor !== beforeCursor) {
      exact(navigation.length, 1, basis + '.moved cursor has receipt');
      const distance = Math.abs(Math.floor(cursor / 3) - Math.floor(beforeCursor / 3)) + Math.abs(cursor % 3 - beforeCursor % 3);
      exact(distance, 1, basis + '.one cardinal neighbour');
      const direction = cursor === beforeCursor - 1 ? 'left' : cursor === beforeCursor + 1 ? 'right' : cursor < beforeCursor ? 'up' : 'down';
      match(navigation[0], { fromTick, tick, segmentIndex: segment.index, beforeCursor, afterCursor: cursor, direction }, basis + '.navigation identity');
      const held = navigation[0].heldTicks;
      exact(navigation[0].mode, held === 1 ? 'initial' : 'repeat', basis + '.navigation mode');
      exact(held === 1 || Number.isInteger(held) && held >= 21 && (held - 21) % 10 === 0, true, basis + '.eligible observed held count');
      configuration.cursor = cursor;
    } else exact(navigation.length, 0, basis + '.no fabricated unchanged movement');
    for (const receipt of commands) {
      match(receipt, { fromTick, tick, segmentIndex: segment.index, windowIndex: segment.windowIndex }, basis + '.command boundary');
      exact(receipt.before, configuration, basis + '.command before');
      exact(['mark-source', 'cancel-mark-same-slot', 'cancel-mark-b', 'swap', 'toggle-topology'].includes(receipt.action), true, basis + '.known action');
      if (receipt.action !== 'cancel-mark-b') exact(segment.kind, 'window', basis + '.safe action window');
      const isB = receipt.action === 'cancel-mark-b' || receipt.action === 'toggle-topology';
      exact(receipt.inputKey, isB ? 'b' : 'a', basis + '.command key');
      if (isB) exact(navigation.length, 0, basis + '.B suppresses navigation');
      if (receipt.action === 'mark-source') {
        exact(configuration.sourceSlot, null, basis + '.mark empty selection');
        match(receipt, { fromSlot: cursor, cellId: configuration.slots[cursor] }, basis + '.mark identity'); configuration.sourceSlot = cursor;
      } else if (receipt.action === 'cancel-mark-same-slot') {
        exact(configuration.sourceSlot, cursor, basis + '.same slot cancellation');
        exact(receipt.fromSlot, configuration.sourceSlot, basis + '.cancel slot'); configuration.sourceSlot = null;
      } else if (receipt.action === 'cancel-mark-b') {
        exact(configuration.sourceSlot !== null, true, basis + '.B cancels existing mark');
        exact(receipt.fromSlot, configuration.sourceSlot, basis + '.cancel slot'); configuration.sourceSlot = null;
      } else if (receipt.action === 'swap') {
        const fromSlot = configuration.sourceSlot, toSlot = cursor;
        exact(Number.isInteger(fromSlot) && fromSlot >= 0 && fromSlot < 6 && fromSlot !== toSlot, true, basis + '.distinct swap endpoints');
        match(receipt, { fromSlot, toSlot, cellIds: [configuration.slots[fromSlot], configuration.slots[toSlot]] }, basis + '.swap identities');
        [configuration.slots[fromSlot], configuration.slots[toSlot]] = [configuration.slots[toSlot], configuration.slots[fromSlot]];
        configuration.sourceSlot = null;
      } else if (receipt.action === 'toggle-topology') {
        exact(configuration.sourceSlot, null, basis + '.toggle has no marked source');
        const row = Math.floor(cursor / 3), fromTopology = configuration.topologies[row], toTopology = fromTopology === 'series' ? 'parallel' : 'series';
        match(receipt, { row, fromTopology, toTopology }, basis + '.topology row'); configuration.topologies[row] = toTopology;
      }
      exact(receipt.after, configuration, basis + '.command immediate after');
    }
    for (const receipt of blocked) {
      match(receipt, { fromTick, tick, segmentIndex: segment.index, reason: 'outside-off-window' }, basis + '.blocked boundary');
      exact(['a', 'b'].includes(receipt.inputKey), true, basis + '.blocked input key domain');
      exact(receipt.action, receipt.inputKey === 'b' ? 'toggle-topology' : configuration.sourceSlot === null ? 'mark-source' : 'swap', basis + '.blocked attempted action');
      exact(segment.kind === 'window', false, basis + '.blocked outside safe window');
      exact(receipt.before, configuration, basis + '.blocked before'); exact(receipt.after, configuration, basis + '.blocked unchanged');
      if (receipt.inputKey === 'b') exact(navigation.length, 0, basis + '.blocked B suppresses navigation');
    }
    exact(interval.configuration, configuration, basis + '.actual post-input configuration');
    exact([...configuration.slots].sort(), CELL_IDS, basis + '.entity inventory preserved'); configurations.push(copy(configuration));
  }
  exact(raw.intervalTrace.length, final.tick, label + '.complete fixed-tick interval corpus');
  for (const source of sourcesOf(raw)) {
    const model = source.state.model;
    exact(configOf(model), configurations[model.tick], label + '.' + source.label + '.configuration');
    for (const name of historyNames) exact(model[name], histories[name].filter(receipt => receipt.tick <= model.tick), label + '.' + source.label + '.' + name + '.immutable history prefix');
    match(model, { commandCount: model.commandReceipts.length, blockedCommands: model.blockedReceipts.length, navigationCount: model.navigationReceipts.length,
      swapCount: model.commandReceipts.filter(r => r.action === 'swap').length, topologyChangeCount: model.commandReceipts.filter(r => r.action === 'toggle-topology').length,
      markCount: model.commandReceipts.filter(r => r.action === 'mark-source').length,
      markCancelCount: model.commandReceipts.filter(r => r.action === 'cancel-mark-b' || r.action === 'cancel-mark-same-slot').length,
      automaticMarkClearCount: model.automaticMarkClearReceipts.length }, label + '.' + source.label + '.receipt counters');
  }
  const inputReceipts = historyNames.slice(0, 4).flatMap(name => histories[name]);
  exact(raw.operations.length, inputReceipts.length, label + '.every input receipt has operation window');
  for (const receipt of inputReceipts) exact(raw.operations.filter(operation => isDeepStrictEqual(receipt, operation.receipt)).length, 1, label + '.one operation window per receipt');
  return { configurationAt: tick => configurations[tick], histories };
}

function auditPhysicsReceipts(raw, level, histories, intervals, label) {
  const starts = [], completions = [], ends = [], expectedEvents = new Map();
  let eventCount = 0, lastEvent = null;
  for (const [tick, { expected, span }] of intervals) {
    const fromTick = tick - 1, position = schedulePosition(level, fromTick), facts = [];
    for (const receipt of histories.automaticMarkClearReceipts.filter(r => r.tick === tick)) facts.push({ type: 'mark-clear', receiptId: receipt.id, reason: receipt.reason });
    for (const receipt of histories.navigationReceipts.filter(r => r.tick === tick)) facts.push({ type: 'navigate', receiptId: receipt.id });
    for (const receipt of histories.commandReceipts.filter(r => r.tick === tick)) facts.push({ type: 'command', receiptId: receipt.id, action: receipt.action });
    for (const receipt of histories.blockedReceipts.filter(r => r.tick === tick)) facts.push({ type: 'blocked', receiptId: receipt.id, action: receipt.action });
    if (position.kind === 'supply' && fromTick === position.startTick) {
      const receipt = { id: starts.length + 1, fromTick, tick, stageIndex: position.stageIndex, segmentIndex: position.index, requirements: requests(level, position.stageIndex) };
      starts.push(receipt); facts.push({ type: 'stage-start', receiptId: receipt.id, stageIndex: receipt.stageIndex });
    }
    for (const [i, row] of expected.loads.entries()) if (row.completedNow) {
      const stage = expected.after.loads[i].stages[row.stageIndex];
      const receipt = { id: completions.length + 1, fromTick, tick, stageIndex: row.stageIndex, loadId: row.loadId, targetWorkJ: stage.targetWorkJ,
        workBeforeJ: row.workBeforeJ, deliveredEnergyJ: row.deliveredEnergyJ, creditedWorkJ: row.creditedWorkJ, workAfterJ: row.workAfterJ,
        deficitJ: stage.deficitJ, overflowEnergyJ: row.overflowEnergyJ, disconnectFromTick: tick };
      completions.push(receipt); facts.push({ type: 'delivery', receiptId: receipt.id, loadId: row.loadId, stageIndex: row.stageIndex });
      if (tick < raw.final.model.tick) {
        const next = intervals.get(tick + 1).expected.loads[i];
        exact(next.connected, false, label + '.next interval after completion disconnected');
        exact(next.disconnectReason, schedulePosition(level, tick).kind === 'window' ? 'off-window' : 'stage-complete', label + '.completed load waits for new stage');
      }
    }
    if (position.kind === 'supply' && tick === position.endTick) {
      const receipt = { id: ends.length + 1, fromTick, tick, stageIndex: position.stageIndex,
        loads: expected.after.loads.map(load => { const stage = load.stages[position.stageIndex]; return { loadId: load.id,
          targetWorkJ: stage.targetWorkJ, workJ: stage.workJ, deficitJ: stage.deficitJ, complete: done(stage.workJ, stage.targetWorkJ, physics) }; }) };
      ends.push(receipt); facts.push({ type: 'stage-end', receiptId: receipt.id, stageIndex: receipt.stageIndex });
    }
    if (expected.ending.phase === 'lost') facts.push({ type: 'loss', reason: expected.ending.lostReason });
    if (expected.ending.phase === 'won') facts.push({ type: 'win' });
    const events = facts.map(fact => ({ id: ++eventCount, type: fact.type, fromTick, tick, ...fact }));
    if (events.length) lastEvent = events.at(-1);
    expectedEvents.set(tick, { events, eventCount, lastEvent });
    if (span.rates.preGuard.length) exact(tick, raw.final.model.tick, label + '.pre-supply failure cannot continue');
  }
  match(histories.stageStartReceipts, starts, label + '.independent stage-start receipts');
  match(histories.workCompletionReceipts, completions, label + '.independent completion receipts');
  match(histories.stageEndReceipts, ends, label + '.independent stage-end receipts');
  const actualEvents = new Map(raw.eventTransitions.map(record => [record.tick, record]));
  for (const [tick, expected] of expectedEvents) {
    const actual = actualEvents.get(tick);
    exact(actual?.events || [], expected.events, label + '.independent event order@' + tick);
    if (actual) {
      const input = actual.input;
      const changedEpoch = Number.isSafeInteger(input.cancelEpoch) && input.cancelEpoch >= 0 && input.cancelEpoch !== actual.before.model.inputState.cancelEpoch;
      if (input.cancelled || changedEpoch) exact(histories.commandReceipts.concat(histories.blockedReceipts, histories.navigationReceipts).filter(r => r.tick === tick).length,
        0, label + '.runtime cancellation suppresses all ordinary input');
      for (const receipt of histories.commandReceipts.concat(histories.blockedReceipts).filter(r => r.tick === tick))
        exact(!!(input[receipt.inputKey] || input[receipt.inputKey + 'Pressed']), true, label + '.command bound to sampled key');
      for (const receipt of histories.automaticMarkClearReceipts.filter(r => r.tick === tick && r.reason === 'runtime-cancel')) {
        exact(!!input.cancelled || changedEpoch, true, label + '.runtime clear bound to sampled cancellation');
      }
    }
  }
  for (const source of sourcesOf(raw)) {
    const model = source.state.model, tick = model.tick, expected = expectedEvents.get(tick) || { events: [], eventCount: 0, lastEvent: null };
    exact(model.events, expected.events, label + '.' + source.label + '.events'); exact(model.eventCount, expected.eventCount, label + '.' + source.label + '.eventCount');
    exact(model.lastEvent, expected.lastEvent, label + '.' + source.label + '.lastEvent');
    exact(model.lastOperation, histories.commandReceipts.filter(r => r.tick <= tick).at(-1) || null, label + '.' + source.label + '.last accepted operation');
    if (!tick) exact(model.lastInput, null, label + '.initial lastInput');
    else match(model.lastInput, { fromTick: tick - 1, tick, segment: segmentView(level, tick - 1),
      commandReceiptIds: histories.commandReceipts.filter(r => r.tick === tick).map(r => r.id),
      blockedReceiptIds: histories.blockedReceipts.filter(r => r.tick === tick).map(r => r.id),
      automaticClearReceiptIds: histories.automaticMarkClearReceipts.filter(r => r.tick === tick).map(r => r.id) }, label + '.' + source.label + '.input receipt references');
  }
}

function reviewRound(entry) {
  const startingFailures = failures.length, startingAssertions = assertions, label = entry.name;
  const file = path.join(corpus, entry.file), raw = read(file), level = parameters.levels[Number(/^level([1-3])-/.exec(entry.name)[1]) - 1];
  exact(hash(file), entry.sha256, label + '.projection hash'); exact(Object.hasOwn(raw, 'pilotDiagnostics'), false, label + '.diagnostics excluded');
  exact(/^[a-f0-9]{64}$/.test(entry.originalRawSha256), true, label + '.raw provenance from approved index');
  exact(raw.actualFixedTicks, raw.final.model.tick, label + '.actual committed tick count');
  exact(entry.actualFixedTicks, raw.actualFixedTicks, label + '.index committed tick count');
  chargeBoundaryOverrides = new Map(); scalarChargeWitnesses = []; observedChargeError = new Map();
  auditEventWindows(raw, label);
  const { configurationAt, histories } = auditConfiguration(raw, level, label), finalTick = raw.final.model.tick;
  const spans = buildSpans(level, configurationAt, raw, label), sources = sourcesOf(raw), wanted = new Set(sources.map(source => source.state.model.tick));
  for (const point of raw.compactTrace) wanted.add(point.tick);
  const sampled = new Map([[0, { state: initialPhysical(level), rates: null }]]), intervalExpectations = new Map();
  let spanIndex = 0, firstTerminal = null, activeSupplyIntervals = 0, bothLoadsConnectedIntervals = 0, unequalParallelIntervals = 0;
  let coolingOnlyCellIntervals = 0, overflowIntervals = 0, outOfBandIntervals = 0, maximumPowerBalanceErrorW = 0;
  const connectedTopologies = new Set(), completionBoundaries = [], gateSamples = [];
  const gate = (kind, actual, expected, safeActual, safeExpected, tick) => {
    gateSamples.push({ kind, actual, expected, difference: Math.abs(actual - expected), tick });
    exact(safeActual, safeExpected, `${label}.gate.${kind}@${tick}`);
  };
  for (const [i, actual] of raw.intervalTrace.entries()) {
    const tick = i + 1;
    while (spans[spanIndex].toTick < tick) spanIndex++;
    const span = spans[spanIndex], configuration = configurationAt(tick), expected = intervalAt(span, tick, configuration, level);
    resolveChargeBoundaries(expected.after, actual.cells, spans, label);
    expected.ending = endingAt(expected.after, level, span.rates);
    const position = schedulePosition(level, i), basis = label + '.interval@' + tick;
    if (position.kind === 'supply') exact(physicalConfig(configuration), span.configuration, basis + '.constant supply configuration');
    match(actual, { fromTick: i, tick, seconds: 1 / physics.tickHz, configuration,
      segment: segmentView(level, i),
      preSupplyChargeFailureCellIds: span.rates.preGuard, cells: expected.cells, loads: expected.loads,
      stageStarted: position.kind === 'supply' && i === position.startTick ? position.stageIndex : null,
      failures: expected.ending.failures, terminal: expected.ending.phase === 'playing' ? null : { phase: expected.ending.phase, reason: expected.ending.lostReason },
      workCompletionReceiptIds: histories.workCompletionReceipts.filter(receipt => receipt.tick === tick).map(receipt => receipt.id),
      stageEndReceiptIds: histories.stageEndReceipts.filter(receipt => receipt.tick === tick).map(receipt => receipt.id) }, basis);
    // Full expected interval data is retained in memory solely for binding the
    // copied snapshots and physics receipts; it is not serialized as a new run.
    intervalExpectations.set(tick, { expected, actual, span });
    if (wanted.has(tick)) sampled.set(tick, { state: expected.after, rates: span.rates });
    if (expected.ending.phase !== 'playing' && firstTerminal === null) firstTerminal = { tick, phase: expected.ending.phase, reason: expected.ending.lostReason };
    const connected = expected.loads.filter(load => load.connected);
    if (connected.length) activeSupplyIntervals++; if (connected.length === 2) bothLoadsConnectedIntervals++;
    for (const row of connected) {
      connectedTopologies.add(row.circuit.topology);
      maximumPowerBalanceErrorW = Math.max(maximumPowerBalanceErrorW, Math.abs(row.circuit.powerBalanceErrorW));
      near(row.circuit.sourcePowerW - row.circuit.loadPowerW - row.circuit.internalHeatPowerW, 0, basis + '.independent powerW identity');
      if (row.circuit.topology === 'parallel' && Math.abs(row.circuit.branches[0].currentA - row.circuit.branches[1].currentA) > tolerance) unequalParallelIntervals++;
      if (row.overflowEnergyJ > tolerance) overflowIntervals++; if (row.outOfBandEnergyJ > tolerance) outOfBandIntervals++;
    }
    for (const [j, cell] of expected.cells.entries()) {
      const observed = actual.cells[j];
      gate('chargeC', observed.chargeAfterC, cell.chargeAfterC, observed.chargeAfterC > 0, classifiedCharge(tick, expected.after.cells[j]) > 0, tick);
      gate('cellTemperatureMarginC', physics.cellMaximumTemperatureC - observed.temperatureAfterC, physics.cellMaximumTemperatureC - cell.temperatureAfterC,
        observed.temperatureAfterC < physics.cellMaximumTemperatureC, cell.temperatureAfterC < physics.cellMaximumTemperatureC, tick);
      if (cell.currentA === 0 && cell.removedHeatJ > tolerance) coolingOnlyCellIntervals++;
    }
    for (const [j, row] of expected.loads.entries()) {
      const observed = actual.loads[j];
      gate('loadTemperatureMarginC', physics.loadMaximumTemperatureC - observed.temperatureAfterC, physics.loadMaximumTemperatureC - row.temperatureAfterC,
        observed.temperatureAfterC < physics.loadMaximumTemperatureC, row.temperatureAfterC < physics.loadMaximumTemperatureC, tick);
      if (row.stageIndex !== null) {
        const request = expected.after.loads[j].stages[row.stageIndex], actualDeficit = deficit(observed.workAfterJ, request.targetWorkJ);
        const expectedDeficit = deficit(row.workAfterJ, request.targetWorkJ);
        gate('workCompletionMarginJ', actualDeficit - physics.workCompletionToleranceJ, expectedDeficit - physics.workCompletionToleranceJ,
          actualDeficit <= physics.workCompletionToleranceJ, expectedDeficit <= physics.workCompletionToleranceJ, tick);
        if (row.completedNow) {
          exact(deficit(row.workBeforeJ, request.targetWorkJ) > physics.workCompletionToleranceJ, true, basis + '.first completing interval');
          completionBoundaries.push({ loadId: row.loadId, stageIndex: row.stageIndex, tick,
            previousDeficitJ: deficit(row.workBeforeJ, request.targetWorkJ), finalDeficitJ: expectedDeficit,
            observedFinalDeficitJ: actualDeficit, creditedWorkJ: row.creditedWorkJ, overflowEnergyJ: row.overflowEnergyJ });
        }
      }
    }
  }
  exact(firstTerminal?.tick, finalTick, label + '.no omitted earlier terminal');
  exact(firstTerminal?.phase, raw.final.phase, label + '.terminal phase');
  for (const source of sources) {
    const tick = source.state.model.tick, predicted = sampled.get(tick);
    checkFull(source.state, predicted.state, predicted.rates, configurationAt(tick), level, label + '.' + source.label);
    if (tick) exact(source.state.model.lastInterval, intervalExpectations.get(tick).actual, label + '.' + source.label + '.retained interval identity');
    else exact(source.state.model.lastInterval, null, label + '.initial lastInterval');
  }
  auditPhysicsReceipts(raw, level, histories, intervalExpectations, label);
  const compactFieldsChecked = ['cursor', 'sourceSlot', 'slots', 'topologies', 'segmentIndex', 'commandCount', 'blockedCommands', 'phase', 'chargeC', 'cellTemperatureC', 'loadTemperatureC'];
  for (const [i, point] of raw.compactTrace.entries()) {
    const { state, rates } = sampled.get(point.tick), configuration = configurationAt(point.tick);
    match(point, { ...configuration, segmentIndex: schedulePosition(level, point.tick).index,
      commandCount: histories.commandReceipts.filter(r => r.tick <= point.tick).length,
      blockedCommands: histories.blockedReceipts.filter(r => r.tick <= point.tick).length,
      phase: endingAt(state, level, rates).phase, chargeC: state.cells.map(cell => cell.remainingChargeC),
      cellTemperatureC: state.cells.map(cell => cell.temperatureC), loadTemperatureC: state.loads.map(load => load.temperatureC) }, label + '.compact[' + i + ']');
  }
  const marginReview = {};
  for (const kind of new Set(gateSamples.map(sample => sample.kind))) {
    const rows = gateSamples.filter(sample => sample.kind === kind), maximumObservedDifference = Math.max(0, ...rows.map(row => row.difference));
    marginReview[kind] = { samples: rows.length, minimumAbsoluteObservedMargin: Math.min(...rows.map(row => Math.abs(row.actual))),
      minimumAbsoluteExpectedMargin: Math.min(...rows.map(row => Math.abs(row.expected))), maximumObservedDifference,
      withinObservedErrorEnvelope: rows.filter(row => Math.min(Math.abs(row.actual), Math.abs(row.expected)) <= maximumObservedDifference).length };
  }
  const finalExpected = sampled.get(finalTick).state, expectedCharge = sum(finalExpected.cells.map(cell => cell.remainingChargeC));
  const observedCharge = sum(raw.final.model.cells.map(cell => cell.remainingChargeC));
  const scoreFloorMargin = { expectedTotalChargeC: expectedCharge, observedTotalChargeC: observedCharge,
    distanceToNearestIntegerC: Math.abs(expectedCharge - Math.round(expectedCharge)), observedDifferenceC: Math.abs(expectedCharge - observedCharge),
    exactFloorAgrees: Math.floor(expectedCharge) === Math.floor(observedCharge) };
  if (raw.final.phase === 'won') exact(scoreFloorMargin.exactFloorAgrees, true, label + '.independent unrounded score floor');
  return { name: entry.name, passed: failures.length === startingFailures, assertions: assertions - startingAssertions,
    projectionSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, originalReportSha256: entry.originalReportSha256, observedSourceHashes: entry.sourceHashes,
    fullStateOccurrences: sources.length, distinctFullTicks: new Set(sources.map(source => source.state.model.tick)).size,
    retainedStates: raw.retained.length, intervalCheckpoints: raw.intervalTrace.length, compactCheckpoints: raw.compactTrace.length, compactFieldsChecked,
    eventTransitions: raw.eventTransitions.length, operations: raw.operations.length,
    closedFormSpans: spans.length, closedFormTicks: sum(spans.map(span => span.toTick - span.fromTick)), terminal: firstTerminal,
    completionBoundaries, marginReview, maximumPowerBalanceErrorW, scalarChargeWitnesses: copy(scalarChargeWitnesses), scoreFloorMargin,
    coverage: { connectedTopologies: [...connectedTopologies].sort(), activeSupplyIntervals, bothLoadsConnectedIntervals, unequalParallelIntervals,
      coolingOnlyCellIntervals, overflowIntervals, outOfBandIntervals, swaps: raw.final.model.swapCount,
      topologyChanges: raw.final.model.topologyChangeCount, blockedActions: raw.final.model.blockedCommands,
      automaticMarkClears: raw.final.model.automaticMarkClearCount, preSupplyGuardIntervals: raw.intervalTrace.filter(row => row.preSupplyChargeFailureCellIds.length > 0).length } };
}

// Four hand-computed oracle fixtures. These do not call production or add
// gameplay coverage: empty, one-cell equivalence, two-cell algebra, two heat ticks.
for (const topology of ['series', 'parallel']) {
  const empty = circuit(topology, [], parameters);
  match(empty, { connected: false, branches: [], currentA: 0, loadPowerW: 0, internalResistanceOhm: null }, 'oracle-only empty circuit');
}
const oneSeries = circuit('series', ['C1'], parameters), oneParallel = circuit('parallel', ['C1'], parameters);
for (const field of ['currentA', 'loadPowerW', 'sourcePowerW', 'internalHeatPowerW']) near(oneSeries[field], oneParallel[field], 'oracle-only single-cell equivalence.' + field);
near(oneSeries.currentA, 12 / 7, 'oracle-only one-cell current');
const pairSeries = circuit('series', ['C1', 'C3'], parameters), pairParallel = circuit('parallel', ['C1', 'C3'], parameters);
match(pairSeries, { currentA: 8 / 3, loadPowerW: 128 / 3 }, 'oracle-only paired series');
match(pairParallel, { currentA: 1.8, loadPowerW: 19.44, branches: [{ currentA: 1.2 }, { currentA: 0.6 }] }, 'oracle-only inverse-resistance parallel');
match(thermal({ temperatureC: 24, generatedHeatJ: 0, removedHeatJ: 0 }, 3, 2, 8, 0.3, physics),
  { temperatureC: 24.01249609375, generatedHeatJ: 0.1, removedHeatJ: 0.00003125 }, 'oracle-only two Euler intervals in closed form');

const results = [];
for (const entry of index.rounds) {
  try { results.push(reviewRound(entry)); }
  catch (error) { failures.push({ name: entry.name, error: error.message }); results.push({ name: entry.name, passed: false, error: error.message }); }
}
const endHashes = hashes(); exact(endHashes, startHashes, 'all sources and public observations unchanged');
const portableMetadata = value => typeof value === 'string' && value.startsWith('/workspace/') ? portable(value) : Array.isArray(value) ? value.map(portableMetadata) :
  value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, portableMetadata(child)])) : value;
const report = { passed: failures.length === 0, scope: 'Independent arithmetic review of six existing ordinary cases from their explicit source runs; no Model, pilot or new gameplay execution.',
  startedAt, completedAt: new Date().toISOString(), startHashes, endHashes, sourceUnchanged: isDeepStrictEqual(startHashes, endHashes),
  publicObservationIndexSha256: approvedIndexHash, aggregateReportSha256: index.originalReportSha256,
  originalSourceRunsFromIndex: portableMetadata(index.sourceRuns), retainedHistoryFromIndex: portableMetadata(index.retainedHistory),
  method: [
    'Audit actual detached input receipts and entity inventory, then derive constant supply circuits independently from those configurations.',
    'Split only at authored segment boundaries and independently calculated load completion ticks. Sample charge, electrical joules, work partitions and Euler temperature from each immutable span origin in closed form.',
    'Check all recorded interval endpoints and terminal priorities. When a strict-zero charge gate falls inside the measured closed-form error envelope, independently fold only that cell canonical consumedC scalar from zero using independently derived currents; retain and disclose both results.',
  ], limitations: [
    'Observed gate values trigger an ambiguity review but never supply its prediction. A scalar gate disagreement is inconclusive and makes this report fail. The observed-error envelope is empirical, not a universal floating-point error proof.',
    'The first four cases and the last two cases have distinct controller/harness source runs. The original zero-tick planner failure and diagnostic remain provenance, not completed gameplay evidence.',
    'Only ordinary events present here are production coverage. Four oracle-only mathematical fixtures add no Model or gameplay coverage.',
    'Navigation receipts are checked for adjacent actual movement and valid reported repeat counts; the held-input/quarantine state machine, browser dispatch, pause/retry, invalid-dt handling and terminal freeze are not replayed.',
    'All ordinary slots remain occupied. Pure zero/one-cell fixtures are not ordinary scenes; the generic solver input-validation domain is outside this evidence review.',
  ], resourceToleranceSI: tolerance, powerComparisonToleranceW: physics.powerCompareToleranceW, workCompletionToleranceJ: physics.workCompletionToleranceJ,
  exactChargeGate: 'remainingChargeC <= 0, without tolerance', oracleOnlyFixtureGroups: 4, maximumErrors, assertions, results,
  failureCount: failures.length, failures };
fs.mkdirSync(output, { recursive: false }); fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, assertions, failureCount: failures.length, maximumErrors,
  results: results.map(result => ({ name: result.name, passed: result.passed, terminal: result.terminal,
    scalarChargeWitnesses: result.scalarChargeWitnesses, coverage: result.coverage, error: result.error })) }, null, 2));
if (!report.passed) process.exitCode = 1;
