// Existing public observations only; no Model, pilot or author-solver import.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readParameters, massProperties, rollSpan } from './harbor-roll-oracle.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [corpusArg, outputArg, approvedIndexHash] = process.argv.slice(2);
if (!corpusArg || !outputArg || !/^[a-f0-9]{64}$/.test(approvedIndexHash || '')) throw new Error('Supply public corpus, fresh output and approved index SHA256');
const corpus = path.resolve(corpusArg), output = path.resolve(outputArg), contractPath = path.join(app, 'docs/model-contract.md');
const contractHash = '65d39cee24a8d3252d0624ff16b1234514d34e25e5f58b497029ff54c724ffe5';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8')), copy = value => structuredClone(value);
const indexPath = path.join(corpus, 'index.json');
if (hash(indexPath) !== approvedIndexHash) throw new Error('Unapproved public index; no case files read');
const index = read(indexPath);
if (index.rounds.length !== 6 || new Set(index.rounds.map(row => row.file)).size !== 6 ||
  !index.rounds.every(row => /^level[1-3]-(record|loss)\.json$/.test(row.file) && row.file === row.name + '.json')) throw new Error('Expected six completed case basenames');
const portable = file => file.startsWith('/workspace/pureTV/') ? 'repoRelative:' + file.slice('/workspace/pureTV/'.length) : 'scratchRelative:' + path.relative('/workspace/scratch', file);
const sourceFiles = [indexPath, contractPath, ...['harbor-roll-oracle.mjs', 'independent-harbor-review.mjs'].map(file => path.join(app, 'tests', file)), ...index.rounds.map(row => path.join(corpus, row.file))];
const hashes = () => Object.fromEntries(sourceFiles.map(file => [portable(file), hash(file)]));
const startedAt = new Date().toISOString(), startHashes = hashes(), parameters = readParameters(fs.readFileSync(contractPath, 'utf8'));
const IDS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'], tolerance = 1e-8, degreeScale = Math.PI / 180;
const limits = { ...parameters.limits, unsafeRollRad: parameters.limits.unsafeRollDegrees * degreeScale,
  overboardRollRad: parameters.limits.overboardRollDegrees * degreeScale,
  departureMaximumRollRad: parameters.limits.departureMaximumRollDegrees * degreeScale,
  departureMaximumAngularVelocityRadS: parameters.limits.departureMaximumAngularVelocityDegreesS * degreeScale };
const receiptNames = ['commandReceipts', 'blockedReceipts', 'navigationReceipts', 'targetChangeReceipts',
  'jobStartReceipts', 'jobCompletionReceipts', 'craneStageReceipts', 'transferReceipts'];
let assertions = 0;
const failures = [], maximumErrors = { rollRad: 0, angularVelocityRadS: 0, otherDerived: 0 };
function exact(actual, expected, label) {
  assertions++;
  if (!isDeepStrictEqual(actual, expected)) failures.push({ label, actual, expected });
}
function near(actual, expected, label) {
  assertions++;
  const error = Math.abs(actual - expected), kind = /omega|angularVelocity/.test(label) ? 'angularVelocityRadS' : /theta|rollRad|RollRad/.test(label) ? 'rollRad' : 'otherDerived';
  if (Number.isFinite(error)) maximumErrors[kind] = Math.max(maximumErrors[kind], error);
  if (typeof actual !== 'number' || !Number.isFinite(actual) || !Number.isFinite(expected) || error > tolerance) failures.push({ label, actual, expected, tolerance });
}
function match(actual, expected, label) {
  if (typeof expected === 'number') {
    const field = label.split('.').at(-1);
    // Integer IDs, counters, mass ledgers and receipt ticks are never tolerant.
    return Number.isInteger(expected) && !/XM|TM|Rad|KNm|Progress/.test(field) && !['seconds', 'elapsed', 'remaining', 'observedAt'].includes(field) ? exact(actual, expected, label) : near(actual, expected, label);
  }
  if (Array.isArray(expected)) {
    exact(Array.isArray(actual), true, label + '.array'); exact(actual?.length, expected.length, label + '.length');
    for (const [i, value] of expected.entries()) match(actual?.[i], value, label + '[' + i + ']');
  } else if (expected && typeof expected === 'object') for (const [key, value] of Object.entries(expected)) match(actual?.[key], value, label + '.' + key);
  else exact(actual, expected, label);
}
exact(hash(contractPath), contractHash, 'approved contract');

const cargoFor = level => IDS.map(id => ({ id, massT: level.massTByCargo[id] }));
const initialOwnership = level => ({ shoreIds: level.loadOrder.slice(), stacks: [[], [], [], []], hookId: null, deliveredIds: [], overboardIds: [] });
const endpoint = (location, column = null, tier = null) => ({ location, column, tier });
const phaseFor = (loads, unloads) => loads < 6 ? 'loading' : unloads < 4 ? 'unloading' : 'departure';
function inventory(ownership, level) {
  const groups = { shore: ownership.shoreIds, ship: ownership.stacks.flat(), hook: ownership.hookId === null ? [] : [ownership.hookId],
    delivered: ownership.deliveredIds, overboard: ownership.overboardIds };
  const total = ids => ids.reduce((value, id) => value + level.massTByCargo[id], 0), all = Object.values(groups).flat();
  const initial = total(IDS), masses = Object.fromEntries(Object.entries(groups).map(([key, ids]) => [key, total(ids)]));
  const recorded = Object.values(masses).reduce((a, b) => a + b, 0);
  return { initialCargoMassT: initial, shoreMassT: masses.shore, shipCargoMassT: masses.ship, hookMassT: masses.hook,
    deliveredMassT: masses.delivered, overboardMassT: masses.overboard, totalLocationMassT: recorded, errorT: recorded - initial,
    counts: Object.fromEntries(Object.entries(groups).map(([key, ids]) => [key, ids.length])), allIdsExactlyOnce: isDeepStrictEqual(all.slice().sort(), IDS) };
}
function locatedCargo(ownership, level) {
  return IDS.map(id => {
    const column = ownership.stacks.findIndex(stack => stack.includes(id));
    const location = column >= 0 ? 'ship' : ownership.hookId === id ? 'hook' : ownership.shoreIds.includes(id) ? 'shore' : ownership.deliveredIds.includes(id) ? 'delivered' : 'overboard';
    return { id, massT: level.massTByCargo[id], location, column: column >= 0 ? column : null,
      tier: column >= 0 ? ownership.stacks[column].indexOf(id) : null };
  });
}
function emptyCrane() {
  return { idle: true, jobId: null, taskId: null, type: null, cargoId: null, column: null, tier: null, source: null, destination: null,
    startedFromTick: null, startedAtTick: null, stage: null, stageIndex: null, stageFromTick: null,
    stageElapsedTicks: 0, stageDurationTicks: 0, stageProgress: 0, jobElapsedTicks: 0, jobTotalTicks: 0, travelTicks: 0, carriedId: null, railXM: parameters.layout.shoreXM };
}
function tasksAt(level, jobs, tick) {
  const tasks = ['load', 'unload'].flatMap(type => level[type + 'Order'].map((cargoId, orderIndex) => ({
    id: type + '-' + (orderIndex + 1), index: (type === 'load' ? 0 : 6) + orderIndex, type, orderIndex, cargoId, massT: level.massTByCargo[cargoId],
    status: 'pending', jobId: null, column: null, startedAtTick: null, completedAtTick: null })));
  for (const job of jobs) if (job.startedAtTick <= tick) {
    const task = tasks.find(task => task.id === job.taskId), end = job.startedFromTick + job.jobTotalTicks;
    Object.assign(task, { status: tick >= end ? 'completed' : 'active', jobId: job.jobId, column: job.column,
      startedAtTick: job.startedAtTick, completedAtTick: tick >= end ? end : null });
  }
  return tasks;
}
function makeJob(task, column, tier, fromTick, jobId) {
  const travelTicks = Math.abs(parameters.layout.columnXM[column] - parameters.layout.shoreXM) * parameters.motion.tickHz / parameters.motion.craneSpeedMS;
  const names = parameters.transfer[task.type === 'load' ? 'loadingStages' : 'unloadingStages'];
  const durations = task.type === 'load' ? [parameters.motion.liftTicks, travelTicks, parameters.motion.lowerTicks, travelTicks] :
    [travelTicks, parameters.motion.liftTicks, travelTicks, parameters.motion.lowerTicks];
  return { jobId, taskId: task.id, type: task.type, cargoId: task.cargoId, column, tier,
    source: task.type === 'load' ? endpoint('shore') : endpoint('ship', column, tier),
    destination: task.type === 'load' ? endpoint('ship', column, tier) : endpoint('shore'),
    startedFromTick: fromTick, startedAtTick: fromTick + 1, travelTicks, jobTotalTicks: durations.reduce((a, b) => a + b, 0),
    stages: names.map((stage, i) => ({ stage, index: i, durationTicks: durations[i] })) };
}
function viewOfJob(job, elapsed, hookId) {
  if (elapsed >= job.jobTotalTicks) return emptyCrane();
  let prefix = 0, index = 0;
  while (elapsed >= prefix + job.stages[index].durationTicks) { prefix += job.stages[index].durationTicks; index++; }
  const stage = job.stages[index], progress = (elapsed - prefix) / stage.durationTicks;
  const shore = parameters.layout.shoreXM, ship = parameters.layout.columnXM[job.column];
  const rail = ['lift-shore', 'lower-shore'].includes(stage.stage) ? shore : ['lift-ship', 'lower-ship'].includes(stage.stage) ? ship :
    ['carry-to-ship', 'approach-ship'].includes(stage.stage) ? shore + (ship - shore) * progress : ship + (shore - ship) * progress;
  const { stages, ...identity } = job;
  return { idle: false, ...identity, stage: stage.stage, stageIndex: index, stageFromTick: job.startedFromTick + prefix,
    stageElapsedTicks: elapsed - prefix, stageDurationTicks: stage.durationTicks, stageProgress: progress,
    jobElapsedTicks: elapsed, carriedId: hookId, railXM: rail };
}
function craneAt(jobs, tick, hookId) {
  const job = jobs.find(job => job.startedAtTick <= tick && tick < job.startedFromTick + job.jobTotalTicks);
  return job ? viewOfJob(job, tick - job.startedFromTick, hookId) : emptyCrane();
}
function calendarFromReceipts(raw, level, label) {
  const initialTasks = tasksAt(level, [], 0), jobs = [], stages = new Map(), transfers = new Map(), completions = new Map();
  let previousEnd = 0, stageId = 0;
  for (const [i, receipt] of raw.final.model.jobStartReceipts.entries()) {
    exact(i < initialTasks.length, true, label + '.no extra job');
    exact(Number.isInteger(receipt.fromTick) && receipt.fromTick >= 0 && receipt.tick <= raw.final.model.tick, true, label + '.job exists within actual round');
    exact(receipt.id, i + 1, label + '.job id'); exact(receipt.fromTick + 1, receipt.tick, label + '.job start tick');
    const { column, tier } = receipt.job;
    exact(Number.isInteger(column) && column >= 0 && column < 4 && Number.isInteger(tier) && tier >= 0 && tier < 2, true, label + '.job slot domain');
    exact(receipt.fromTick >= previousEnd, true, label + '.exclusive crane job intervals');
    const job = makeJob(initialTasks[i], column, tier, receipt.fromTick, i + 1);
    exact(receipt.job, job, label + '.immutable authored job identity and durations'); jobs.push(job);
    previousEnd = job.startedFromTick + job.jobTotalTicks;
    let boundary = job.startedFromTick;
    for (const [j, stage] of job.stages.entries()) {
      const from = boundary; boundary += stage.durationTicks;
      if (boundary > raw.final.model.tick) continue;
      const row = { id: ++stageId, fromTick: boundary - 1, tick: boundary, jobId: job.jobId, type: job.type, cargoId: job.cargoId,
        stage: stage.stage, stageIndex: j, stageFromTick: from, durationTicks: stage.durationTicks,
        completedElapsedTicks: stage.durationTicks, nextStage: job.stages[j + 1]?.stage || null, jobComplete: j === 3 };
      stages.set(boundary, row);
      const transfer = ({ 'lift-shore': 'shore-pickup', 'lower-ship': 'ship-deposit', 'lift-ship': 'ship-pickup', 'lower-shore': 'shore-delivery' })[stage.stage];
      if (transfer) transfers.set(boundary, { boundary: transfer, job });
      if (j === 3) completions.set(boundary, job);
    }
  }
  return { jobs, stages, transfers, completions };
}

const inputConfiguration = (cursor, position, target, crane) => ({ cursor, ballastPositionUnits: position, ballastTargetUnits: target, crane: copy(crane) });
const movementSample = (movement, tick) => movement.units + Math.sign(movement.target - movement.units) *
  Math.min(tick - movement.fromTick, Math.abs(movement.target - movement.units));
function rejectReason(crane, task, ownership, cursor) {
  if (!crane.idle) return 'crane-busy';
  if (!task) return 'task-complete';
  const stack = ownership.stacks[cursor];
  if (task.type === 'load') return stack.length >= 2 ? 'load-full' : null;
  if (!stack.length) return 'empty-column';
  if (stack.at(-1) === task.cargoId) return null;
  return stack.includes(task.cargoId) ? 'required-covered' : 'wrong-column';
}
function transfer(ownership, boundary, job, tick, level, id, activeJobId = null) {
  const before = copy(ownership), cargoId = job.cargoId, column = job.column, tier = job.tier;
  let from, to;
  if (boundary === 'shore-pickup') {
    if (ownership.shoreIds[0] !== cargoId || ownership.hookId !== null) throw new Error('Invalid shore pickup ownership');
    ownership.shoreIds.shift(); ownership.hookId = cargoId; from = endpoint('shore'); to = endpoint('hook');
  } else if (boundary === 'ship-deposit') {
    if (ownership.hookId !== cargoId || ownership.stacks[column].length !== tier || tier >= 2) throw new Error('Invalid ship deposit ownership');
    ownership.hookId = null; ownership.stacks[column].push(cargoId); from = endpoint('hook'); to = endpoint('ship', column, tier);
  } else if (boundary === 'ship-pickup') {
    if (ownership.stacks[column].at(-1) !== cargoId || ownership.stacks[column].length - 1 !== tier || ownership.hookId !== null) throw new Error('Invalid accessible ship pickup');
    ownership.stacks[column].pop(); ownership.hookId = cargoId; from = endpoint('ship', column, tier); to = endpoint('hook');
  } else if (boundary === 'shore-delivery') {
    if (ownership.hookId !== cargoId || level.unloadOrder[ownership.deliveredIds.length] !== cargoId) throw new Error('Invalid ordered shore delivery');
    ownership.hookId = null; ownership.deliveredIds.push(cargoId); from = endpoint('hook'); to = endpoint('delivered');
  } else if (boundary === 'overboard') {
    if (ownership.stacks[column].at(-1) !== cargoId || ownership.stacks[column].length - 1 !== tier) throw new Error('Spill must remove a real top cargo');
    ownership.stacks[column].pop(); ownership.overboardIds.push(cargoId); from = endpoint('ship', column, tier); to = endpoint('overboard');
  } else throw new Error('Unknown ownership boundary');
  return { id, fromTick: tick - 1, tick, jobId: boundary === 'overboard' ? null : job.jobId, boundary, cargoId, massT: level.massTByCargo[cargoId],
    from, to, before, after: copy(ownership), ...(boundary === 'overboard' ? { activeJobId } : {}) };
}

// Fold the recorded input intent and the derived absolute crane calendar.
// Crane stages are evaluated from timestamps, not advanced by a second model.
function auditCalendar(raw, level, label) {
  const calendar = calendarFromReceipts(raw, level, label), finalTick = raw.final.model.tick;
  const actualHistories = Object.fromEntries(receiptNames.map(name => [name, raw.final.model[name]]));
  const histories = Object.fromEntries(receiptNames.map(name => [name, []])), actualAt = (name, tick) => actualHistories[name].filter(r => r.tick === tick);
  const ownership = initialOwnership(level), checkpoints = new Map(), intervals = [], cargo = cargoFor(level);
  let cursor = 0, movement = { units: 0, target: 0, fromTick: 0 }, loads = 0, unloads = 0, eventCount = 0, lastEvent = null;
  let unsafe = 0, maxUnsafe = 0, peak = 0, stable = 0, firstTerminal = null;
  checkpoints.set(0, { ownership: copy(ownership), cursor, position: 0, target: 0, loads, unloads, unsafe, maxUnsafe, peak, stable,
    phase: 'playing', lostReason: null, failures: [], score: 0, events: [], eventCount: 0, lastEvent: null });
  const inputWindows = new Map(raw.eventTransitions.map(record => [record.tick, record]));
  for (const [i, actual] of raw.intervalTrace.entries()) {
    const tick = i + 1, fromTick = i, basis = label + '@' + tick, events = [];
    exact(actual.fromTick, fromTick, basis + '.fromTick'); exact(actual.tick, tick, basis + '.tick');
    const emit = (type, references) => {
      const event = { id: ++eventCount, type, fromTick, tick, ...references }; events.push(event); lastEvent = event; return event.id;
    };
    const append = (name, payload, type, referenceKey, other = {}) => {
      const receipt = { id: histories[name].length + 1, ...payload };
      receipt.eventSeq = emit(type, { [referenceKey]: receipt.id, ...other }); histories[name].push(receipt); return receipt;
    };
    const positionBefore = movementSample(movement, fromTick), operationPhaseBefore = phaseFor(loads, unloads);
    const craneBefore = craneAt(calendar.jobs, fromTick, ownership.hookId), tasks = tasksAt(level, calendar.jobs, fromTick), currentTask = tasks.find(task => task.status !== 'completed') || null;
    const inputBefore = inputConfiguration(cursor, positionBefore, movement.target, craneBefore);
    const navigation = actualAt('navigationReceipts', tick), commands = actualAt('commandReceipts', tick), blocked = actualAt('blockedReceipts', tick);
    exact(navigation.length <= 1 && commands.length + blocked.length <= 1, true, basis + '.at most one movement and action');
    for (const receipt of navigation) {
      exact(receipt.beforeCursor, cursor, basis + '.navigation starts at current cursor');
      exact(['left', 'right'].includes(receipt.direction), true, basis + '.horizontal direction');
      const target = Math.max(0, Math.min(3, cursor + (receipt.direction === 'left' ? -1 : 1)));
      exact(target !== cursor, true, basis + '.no fabricated clamped movement'); exact(receipt.afterCursor, target, basis + '.adjacent cursor');
      const held = receipt.heldTicks; exact(held === 1 || Number.isInteger(held) && held >= 20 && held % 10 === 0, true, basis + '.reported eligible repeat age');
      append('navigationReceipts', { fromTick, tick, direction: receipt.direction, heldTicks: held, mode: held === 1 ? 'initial' : 'repeat', beforeCursor: cursor, afterCursor: target }, 'navigate', 'navigationId');
      cursor = target;
    }
    let cranePostInput = craneBefore;
    for (const receipt of commands) {
      const before = inputConfiguration(cursor, positionBefore, movement.target, craneBefore), id = histories.commandReceipts.length + 1;
      exact(['a', 'b'].includes(receipt.inputKey), true, basis + '.accepted input key');
      if (receipt.inputKey === 'b') {
        exact(navigation.length, 0, basis + '.B suppresses movement');
        const selected = parameters.layout.columnXM[cursor] * parameters.motion.ballastUnitsPerMeter;
        const target = movement.target === selected ? 0 : selected, targetId = histories.targetChangeReceipts.length + 1;
        append('commandReceipts', { fromTick, tick, inputKey: 'b', action: 'retarget-ballast', before,
          after: inputConfiguration(cursor, positionBefore, target, craneBefore), jobId: null, targetChangeId: targetId }, 'command', 'commandId');
        append('targetChangeReceipts', { fromTick, tick, commandId: id, column: cursor, beforeTargetUnits: movement.target,
          afterTargetUnits: target, actualPositionUnits: positionBefore }, 'target-change', 'targetChangeId');
        movement = { units: positionBefore, target, fromTick };
      } else {
        exact(rejectReason(craneBefore, currentTask, ownership, cursor), null, basis + '.legal accepted A');
        const job = calendar.jobs.find(job => job.startedAtTick === tick);
        exact(!!job, true, basis + '.accepted A has one original job');
        if (!job) throw new Error('Accepted A missing job calendar');
        exact(job.taskId, currentTask?.id, basis + '.next authored task'); exact(job.column, cursor, basis + '.job selected column');
        exact(job.tier, ownership.stacks[cursor].length - (job.type === 'unload' ? 1 : 0), basis + '.actual accepted tier');
        if (job.type === 'load') exact(ownership.shoreIds[0], job.cargoId, basis + '.next shore cargo');
        cranePostInput = viewOfJob(job, 0, ownership.hookId);
        append('commandReceipts', { fromTick, tick, inputKey: 'a', action: 'request-' + job.type, before,
          after: inputConfiguration(cursor, positionBefore, movement.target, cranePostInput), jobId: job.jobId, targetChangeId: null }, 'command', 'commandId');
        append('jobStartReceipts', { fromTick, tick, commandId: id, job }, 'job-start', 'jobId');
      }
    }
    for (const receipt of blocked) {
      const reason = rejectReason(craneBefore, currentTask, ownership, cursor), config = inputConfiguration(cursor, positionBefore, movement.target, craneBefore);
      exact(reason !== null, true, basis + '.actual rejection has a cause');
      append('blockedReceipts', { fromTick, tick, inputKey: 'a', reason, expectedCargoId: currentTask?.cargoId || null,
        actualTopId: ownership.stacks[cursor].at(-1) || null, column: cursor, before: config, after: copy(config) }, 'blocked', 'blockedId');
    }
    const position = movementSample(movement, tick), ballast = { beforeUnits: positionBefore, targetUnits: movement.target, afterUnits: position,
      deltaUnits: position - positionBefore, beforeXM: positionBefore / 60, targetXM: movement.target / 60, afterXM: position / 60 };
    const stage = calendar.stages.get(tick), scheduledTransfer = calendar.transfers.get(tick), completeJob = calendar.completions.get(tick);
    const stageIds = [], craneTransferIds = [], completionIds = [];
    if (stage) stageIds.push(append('craneStageReceipts', stage, 'crane-stage-complete', 'stageReceiptId').id);
    if (scheduledTransfer) {
      const payload = transfer(ownership, scheduledTransfer.boundary, scheduledTransfer.job, tick, level, histories.transferReceipts.length + 1);
      craneTransferIds.push(append('transferReceipts', payload, 'cargo-transfer', 'transferReceiptId').id);
    }
    if (completeJob) {
      if (completeJob.type === 'load') loads++; else unloads++;
      const payload = { fromTick, tick, jobId: completeJob.jobId, taskId: completeJob.taskId, type: completeJob.type,
        cargoId: completeJob.cargoId, column: completeJob.column, tier: completeJob.tier, jobElapsedTicks: completeJob.jobTotalTicks,
        jobTotalTicks: completeJob.jobTotalTicks, loadJobsCompleted: loads, unloadJobsCompleted: unloads,
        operationPhaseBefore, operationPhaseAfter: phaseFor(loads, unloads), ownership: copy(ownership) };
      completionIds.push(append('jobCompletionReceipts', payload, 'job-complete', 'jobCompletionId', { jobId: completeJob.jobId }).id);
    }
    const afterAdvance = craneAt(calendar.jobs, tick, ownership.hookId), preRollOwnership = copy(ownership);
    const measured = massProperties(cargo, ownership.stacks, position, parameters);
    const theta = actual.roll.thetaAfterRad, omega = actual.roll.omegaAfterRadS, abs = Math.abs(theta);
    const unsafeBefore = unsafe, maxBefore = maxUnsafe, peakBefore = peak, stableBefore = stable;
    unsafe = abs > limits.unsafeRollRad ? unsafe + 1 : 0; maxUnsafe = Math.max(maxUnsafe, unsafe); peak = Math.max(peak, abs);
    const spillEligible = abs >= limits.overboardRollRad && measured.aboardIds.length > 0, facts = [], transferIds = craneTransferIds.slice();
    let spillId = null;
    if (spillEligible) {
      const occupied = ownership.stacks.map((stack, column) => stack.length ? column : -1).filter(column => column >= 0);
      const column = theta > 0 ? Math.max(...occupied) : Math.min(...occupied), tier = ownership.stacks[column].length - 1, cargoId = ownership.stacks[column][tier];
      const payload = transfer(ownership, 'overboard', { cargoId, column, tier }, tick, level, histories.transferReceipts.length + 1, afterAdvance.jobId);
      spillId = append('transferReceipts', payload, 'cargo-transfer', 'transferReceiptId').id; transferIds.push(spillId);
      facts.push({ kind: 'overboard', fromTick, tick, actualValue: abs, limitValue: limits.overboardRollRad, unit: 'rad',
        signedRollRad: theta, cargoId, column, tier, massT: level.massTByCargo[cargoId], transferReceiptId: spillId });
    }
    if (unsafe >= limits.unsafeConsecutiveTicks) facts.push({ kind: 'sustained-heel', fromTick, tick, actualValue: unsafe,
      limitValue: limits.unsafeConsecutiveTicks, unit: 'ticks', signedRollRad: theta, unsafeThresholdRad: limits.unsafeRollRad });
    if (tick >= level.deadlineTick) facts.push({ kind: 'deadline', fromTick, tick, actualValue: tick, limitValue: level.deadlineTick, unit: 'ticks' });
    const operationPhase = phaseFor(loads, unloads), inventoryValid = ownership.shoreIds.length === 0 && ownership.hookId === null && afterAdvance.idle &&
      ownership.overboardIds.length === 0 && isDeepStrictEqual(ownership.deliveredIds, level.unloadOrder) && isDeepStrictEqual(ownership.stacks.flat().slice().sort(), level.exportIds.slice().sort());
    const angleWithinLimit = abs <= limits.departureMaximumRollRad, velocityWithinLimit = Math.abs(omega) <= limits.departureMaximumAngularVelocityRadS;
    const ballastAtTarget = position === movement.target, eligible = operationPhase === 'departure' && inventoryValid && angleWithinLimit && velocityWithinLimit && ballastAtTarget;
    if (!facts.length) {
      if (operationPhase === 'departure') exact(inventoryValid, true, basis + '.complete departure inventory');
      stable = eligible ? stable + 1 : 0;
    }
    const phase = facts.length ? 'lost' : stable >= limits.departureStableTicks ? 'won' : 'playing', lostReason = facts[0]?.kind || null;
    const score = phase === 'won' ? 1000 + 2 * Math.floor((level.deadlineTick - tick) / 60) + 100 - Math.min(100, histories.blockedReceipts.length) : 0;
    if (phase !== 'playing') { emit(phase === 'won' ? 'win' : 'loss', phase === 'won' ? { score } : { reason: lostReason }); if (!firstTerminal) firstTerminal = { tick, phase, reason: lostReason }; }
    const advancedStage = cranePostInput.idle ? null : { jobId: cranePostInput.jobId, stage: cranePostInput.stage, stageIndex: cranePostInput.stageIndex,
      stageFromTick: cranePostInput.stageFromTick, elapsedBefore: cranePostInput.stageElapsedTicks, elapsedAfter: cranePostInput.stageElapsedTicks + 1,
      durationTicks: cranePostInput.stageDurationTicks, completed: cranePostInput.stageElapsedTicks + 1 === cranePostInput.stageDurationTicks };
    const expectedInterval = { fromTick, tick, seconds: 1 / 60, operationPhaseBefore, operationPhaseAfterCrane: operationPhase,
      inputCommandIds: histories.commandReceipts.filter(r => r.tick === tick).map(r => r.id), blockedInputIds: histories.blockedReceipts.filter(r => r.tick === tick).map(r => r.id),
      ballast, crane: { beforeAdvance: cranePostInput, advancedStage, afterAdvance, stageReceiptIds: stageIds, transferReceiptIds: craneTransferIds, jobCompletionReceiptIds: completionIds },
      safety: { absoluteRollRad: abs, unsafe: abs > limits.unsafeRollRad, unsafeTicksBefore: unsafeBefore, unsafeTicksAfter: unsafe,
        maxUnsafeTicksBefore: maxBefore, maxUnsafeTicksAfter: maxUnsafe, peakAbsRollRadBefore: peakBefore, peakAbsRollRadAfter: peak,
        overboardEligible: spillEligible, overboardTransferId: spillId },
      departure: { eligible, inventoryValid, angleWithinLimit, velocityWithinLimit, ballastAtTarget, stableTicksBefore: stableBefore, stableTicksAfter: stable, blockedByFailure: facts.length > 0 },
      transferReceiptIds: transferIds, failures: facts, terminal: phase === 'playing' ? null : { phase, reason: lostReason } };
    match(actual, expectedInterval, basis + '.calendar/strict observed gates');
    exact(actual.roll.aboard, measured.aboard, basis + '.actual pre-spill aboard rows');
    exact(inventory(ownership, level).allIdsExactlyOnce, true, basis + '.entity partition');
    intervals.push({ expected: expectedInterval, measured, preRollOwnership, ownership: copy(ownership), position, target: movement.target, direction: ballast.deltaUnits, theta, omega,
      input: { fromTick, tick, commandIds: expectedInterval.inputCommandIds, blockedIds: expectedInterval.blockedInputIds,
        navigationIds: histories.navigationReceipts.filter(r => r.tick === tick).map(r => r.id), before: inputBefore,
        after: inputConfiguration(cursor, positionBefore, movement.target, cranePostInput) } });
    checkpoints.set(tick, { ownership: copy(ownership), cursor, position, target: movement.target, loads, unloads, unsafe, maxUnsafe, peak, stable,
      phase, lostReason, failures: facts, score, events, eventCount, lastEvent: copy(lastEvent) });
    const inputWindow = inputWindows.get(tick);
    exact(inputWindow?.events || [], events, basis + '.exact event order');
  }
  for (const name of receiptNames) match(actualHistories[name], histories[name], label + '.independent.' + name);
  exact(firstTerminal?.tick, finalTick, label + '.first terminal is actual final tick');
  return { ...calendar, histories, intervals, checkpoints, firstTerminal };
}

function matrixReview(raw, audit, level, label) {
  const spans = [], sampled = new Map([[0, { theta: 0, omega: 0, units: 0 }]]), gateRows = [];
  let origin = { theta: 0, omega: 0, units: 0 }, cursor = 0, previousActual = { theta: 0, omega: 0 };
  const signature = interval => JSON.stringify([interval.measured.aboard, interval.direction, interval.target]);
  while (cursor < audit.intervals.length) {
    const start = cursor, first = audit.intervals[start], key = signature(first);
    while (cursor < audit.intervals.length && signature(audit.intervals[cursor]) === key) cursor++;
    const count = cursor - start, mass = first.measured.aboardCargoMassT, moment = first.measured.cargoMomentTM;
    exact(origin.units, first.expected.ballast.beforeUnits, label + '.matrix span origin units');
    const span = { fromTick: start, toTick: cursor, count, origin: copy(origin), cargoMassT: mass, cargoMomentTM: moment,
      direction: first.direction, targetUnits: first.target };
    for (let n = 1; n <= count; n++) {
      const tick = start + n, recorded = audit.intervals[tick - 1], actual = raw.intervalTrace[tick - 1].roll;
      const old = rollSpan(origin, mass, moment, first.direction, n - 1, parameters), next = rollSpan(origin, mass, moment, first.direction, n, parameters);
      const body = recorded.measured, basis = label + '.matrix@' + tick;
      exact(next.units, recorded.position, basis + '.integer position');
      exact(actual.thetaBeforeRad, previousActual.theta, basis + '.actual angle continuity');
      exact(actual.omegaBeforeRadS, previousActual.omega, basis + '.actual angular velocity continuity');
      const alpha = (body.gravityTorqueKNm - body.restoringKNmPerRad * old.theta - body.dampingKNmSPerRad * old.omega) / body.inertiaTM2;
      const fields = ['aboardIds', 'aboard', 'ballastXM', 'massT', 'firstMomentTM', 'centerOfMassXM', 'inertiaTM2', 'restoringKNmPerRad', 'dampingKNmSPerRad', 'gravityTorqueKNm'];
      const expected = { ...Object.fromEntries(fields.map(key => [key, body[key]])), thetaBeforeRad: old.theta, omegaBeforeRadS: old.omega,
        alphaRadS2: alpha, omegaAfterRadS: next.omega, thetaAfterRad: next.theta };
      match(actual, expected, basis + '.roll');
      const predicates = [
        ['unsafe', limits.unsafeRollRad, Math.abs(actual.thetaAfterRad), Math.abs(next.theta), value => value > limits.unsafeRollRad],
        ['overboardAngle', limits.overboardRollRad, Math.abs(actual.thetaAfterRad), Math.abs(next.theta), value => value >= limits.overboardRollRad],
        ['departureAngle', limits.departureMaximumRollRad, Math.abs(actual.thetaAfterRad), Math.abs(next.theta), value => value <= limits.departureMaximumRollRad],
        ['departureVelocity', limits.departureMaximumAngularVelocityRadS, Math.abs(actual.omegaAfterRadS), Math.abs(next.omega), value => value <= limits.departureMaximumAngularVelocityRadS],
      ];
      for (const [kind, boundary, observed, predicted, predicate] of predicates) {
        exact(predicate(observed), predicate(predicted), basis + '.strict gate agreement.' + kind);
        gateRows.push({ kind, tick, observedMargin: boundary - observed, predictedMargin: boundary - predicted, difference: Math.abs(observed - predicted) });
      }
      sampled.set(tick, next); previousActual = { theta: actual.thetaAfterRad, omega: actual.omegaAfterRadS };
    }
    origin = rollSpan(origin, mass, moment, first.direction, count, parameters); spans.push(span);
  }
  const margins = {};
  for (const kind of new Set(gateRows.map(row => row.kind))) {
    const rows = gateRows.filter(row => row.kind === kind), error = Math.max(...rows.map(row => row.difference));
    margins[kind] = { samples: rows.length, minimumAbsoluteObservedMargin: Math.min(...rows.map(row => Math.abs(row.observedMargin))),
      minimumAbsolutePredictedMargin: Math.min(...rows.map(row => Math.abs(row.predictedMargin))), maximumObservedDifference: error,
      withinObservedErrorEnvelope: rows.filter(row => Math.min(Math.abs(row.observedMargin), Math.abs(row.predictedMargin)) <= error).length };
  }
  return { sampled, spans, margins };
}

function sourcesOf(raw) {
  return [{ label: 'initial', state: raw.initial }, { label: 'final', state: raw.final },
    ...raw.retained.map((row, i) => ({ label: `retained[${i}]`, state: row.state })),
    ...raw.eventTransitions.flatMap((row, i) => [{ label: `eventTransitions[${i}].before`, state: row.before }, { label: `eventTransitions[${i}].after`, state: row.after }]),
    ...raw.operations.flatMap((row, i) => [{ label: `operations[${i}].before`, state: row.before }, { label: `operations[${i}].after`, state: row.after }])];
}
function checkSnapshots(raw, audit, matrix, level, label) {
  const cargo = cargoFor(level), physics = { ...Object.fromEntries(['baseMassT', 'ballastMassT', 'gravityMS2', 'rollRadiusM', 'metacentricHeightM', 'dampingRatio'].map(key => [key, parameters.ship[key]])),
    ...Object.fromEntries(['tickHz', 'craneSpeedMS', 'liftTicks', 'lowerTicks', 'ballastSpeedMS'].map(key => [key, parameters.motion[key]])), ballastUnitsPerM: parameters.motion.ballastUnitsPerMeter };
  for (const source of sourcesOf(raw)) {
    const m = source.state.model, tick = m.tick, state = audit.checkpoints.get(tick), roll = matrix.sampled.get(tick), basis = label + '.' + source.label;
    const mass = massProperties(cargo, state.ownership.stacks, state.position, parameters), { aboard, cargoMomentTM, ballastXM, ...ship } = mass;
    const tasks = tasksAt(level, audit.jobs, tick), current = tasks.find(task => task.status !== 'completed') || null;
    match(m, { level: level.level, difficulty: level.level - 1, tick, elapsed: tick / 60, remaining: Math.max(0, (level.deadlineTick - tick) / 60), deadlineTick: level.deadlineTick,
      phase: state.phase, lostReason: state.lostReason, failures: state.failures, score: state.score, operationPhase: phaseFor(state.loads, state.unloads),
      cursor: state.cursor, ...state.ownership, loadQueueIndex: level.loadOrder.length - state.ownership.shoreIds.length,
      loadJobsCompleted: state.loads, unloadJobsCompleted: state.unloads, ballastPositionUnits: state.position, ballastTargetUnits: state.target,
      ballastXM: state.position / 60, ballastTargetXM: state.target / 60,
      ship: { ...ship, rollRad: roll.theta, angularVelocityRadS: roll.omega },
      crane: craneAt(audit.jobs, tick, state.ownership.hookId), unsafeTicks: state.unsafe, maxUnsafeTicks: state.maxUnsafe,
      peakAbsRollRad: state.peak, stableTicks: state.stable }, basis);
    exact(m.cargo, locatedCargo(state.ownership, level), basis + '.exact cargo location and integer mass');
    exact(m.inventory, inventory(state.ownership, level), basis + '.integer inventory');
    exact(m.tasks, tasks, basis + '.authored task calendar'); exact(m.currentTask, current, basis + '.currentTask');
    exact(m.nextTask, current ? tasks[current.index + 1] || null : null, basis + '.nextTask');
    exact(m.loadOrder, level.loadOrder, basis + '.load queue'); exact(m.unloadOrder, level.unloadOrder, basis + '.unload queue'); exact(m.exportIds, level.exportIds, basis + '.export IDs');
    exact(m.columnXM, parameters.layout.columnXM, basis + '.column positions'); exact(m.maximumStackHeight, parameters.layout.maximumStackHeight, basis + '.height');
    exact(m.shoreXM, parameters.layout.shoreXM, basis + '.shore'); match(m.physics, physics, basis + '.published physics'); match(m.limits, limits, basis + '.published limits');
    exact(source.state.phase, state.phase, basis + '.wrapper phase'); exact(source.state.score, state.score, basis + '.wrapper score');
    for (const name of receiptNames) match(m[name], audit.histories[name].filter(receipt => receipt.tick <= tick), basis + '.' + name + '.complete immutable prefix');
    match(m, { commandCount: audit.histories.commandReceipts.filter(r => r.tick <= tick).length, blockedCommands: audit.histories.blockedReceipts.filter(r => r.tick <= tick).length,
      navigationCount: audit.histories.navigationReceipts.filter(r => r.tick <= tick).length, ballastTargetChangeCount: audit.histories.targetChangeReceipts.filter(r => r.tick <= tick).length,
      jobsStarted: audit.histories.jobStartReceipts.filter(r => r.tick <= tick).length, jobsCompleted: audit.histories.jobCompletionReceipts.filter(r => r.tick <= tick).length }, basis + '.receipt counts');
    exact(m.events, state.events, basis + '.events'); exact(m.eventCount, state.eventCount, basis + '.eventCount'); exact(m.lastEvent, state.lastEvent, basis + '.lastEvent');
    match(m.lastOperation, audit.histories.commandReceipts.filter(r => r.tick <= tick).at(-1) || null, basis + '.lastOperation');
    if (tick) {
      exact(m.lastInterval, raw.intervalTrace[tick - 1], basis + '.actual interval copy');
      match(m.lastInput, audit.intervals[tick - 1].input, basis + '.input receipt links and immediate configurations');
    } else { exact(m.lastInterval, null, basis + '.initial lastInterval'); exact(m.lastInput, null, basis + '.initial lastInput'); }
  }
}

function checkBindings(raw, audit, matrix, label) {
  const finalTick = raw.final.model.tick, changes = raw.inputChanges, windows = new Map(), operationKeys = [];
  let previousKeys = [], previousChangeTick = -1;
  for (const [i, row] of changes.entries()) {
    const basis = label + '.inputChanges[' + i + ']';
    exact(Number.isInteger(row.tick) && row.tick >= 0 && row.tick < finalTick && row.tick > previousChangeTick, true, basis + '.chronological actual input');
    exact(row.from, previousKeys, basis + '.continuous prior held keys'); near(row.elapsed, row.tick / 60, basis + '.elapsed');
    exact(new Set(row.to).size, row.to.length, basis + '.unique keys');
    exact(row.to.every(key => ['ArrowLeft', 'ArrowRight', 'Space', 'b'].includes(key)), true, basis + '.ordinary input domain');
    previousKeys = row.to; previousChangeTick = row.tick;
  }
  const keysAt = tick => changes.filter(row => row.tick <= tick).at(-1)?.to || [];
  let previousWindowTick = 0;
  for (const [i, row] of raw.eventTransitions.entries()) {
    const basis = label + '.eventTransitions[' + i + ']', tick = row.tick, before = row.before.model, after = row.after.model;
    exact(tick > previousWindowTick && tick <= finalTick, true, basis + '.unique chronological window'); previousWindowTick = tick; windows.set(tick, row);
    exact(before.tick, tick - 1, basis + '.actual before tick'); exact(after.tick, tick, basis + '.actual after tick');
    exact(row.eventCountBefore, before.eventCount, basis + '.before event count'); exact(row.eventCountAfter, after.eventCount, basis + '.after event count');
    exact(row.events, after.events, basis + '.actual detached events'); exact(row.actualLastInterval, after.lastInterval, basis + '.actual detached interval');
    exact(after.eventCount - before.eventCount, row.events.length, basis + '.event count difference');
    const supplied = row.input, keys = keysAt(tick - 1), last = after.lastInput;
    exact(supplied.x, Number(keys.includes('ArrowRight')) - Number(keys.includes('ArrowLeft')), basis + '.held horizontal input');
    exact(!!(supplied.a || supplied.aPressed), keys.includes('Space'), basis + '.held A input');
    exact(!!(supplied.b || supplied.bPressed), keys.includes('b'), basis + '.held B input');
    const x = typeof supplied.x === 'number' && Number.isFinite(supplied.x) ? Math.max(-1, Math.min(1, supplied.x)) : 0;
    const epoch = Number.isSafeInteger(supplied.cancelEpoch) && supplied.cancelEpoch >= 0 ? supplied.cancelEpoch : before.inputState.cancelEpoch;
    const cancelled = !!supplied.cancelled || epoch !== before.inputState.cancelEpoch;
    exact(last.sample, { x, aDown: !!(supplied.a || supplied.aPressed), bDown: !!(supplied.b || supplied.bPressed),
      cancelled: !!supplied.cancelled, cancelEpoch: epoch }, basis + '.normalized actual sample');
    exact(last.cancelled, cancelled, basis + '.cancellation');
    if (cancelled || before.inputState.quarantined) exact(last.commandIds.length + last.blockedIds.length + last.navigationIds.length, 0, basis + '.no quarantined input actions');
    if (last.freshB) {
      exact(audit.histories.commandReceipts.filter(receipt => receipt.tick === tick).map(receipt => receipt.inputKey), ['b'], basis + '.fresh B priority');
      exact(last.blockedIds.length + last.navigationIds.length, 0, basis + '.B suppresses A rejection and navigation');
    }
    for (const command of audit.histories.commandReceipts.filter(receipt => receipt.tick === tick)) {
      exact(command.inputKey === 'a' ? last.sample.aDown : last.sample.bDown, true, basis + '.command supported by real key');
      exact(command.inputKey === 'a' ? last.freshA : last.freshB, true, basis + '.command linked to reported fresh sample');
    }
    for (const receipt of audit.histories.blockedReceipts.filter(receipt => receipt.tick === tick)) {
      exact(last.sample.aDown && last.freshA, true, basis + '.rejection supported by real A');
      exact(receipt.inputKey, 'a', basis + '.only A rejects');
    }
    for (const receipt of audit.histories.navigationReceipts.filter(receipt => receipt.tick === tick)) {
      exact(Math.sign(x), receipt.direction === 'left' ? -1 : 1, basis + '.navigation direction matches real axis');
      exact(Math.abs(x) > 0.25, true, basis + '.navigation outside deadzone');
      exact(last.navigationAttempt, { direction: receipt.direction, heldTicks: receipt.heldTicks, mode: receipt.mode,
        beforeCursor: receipt.beforeCursor, afterCursor: receipt.afterCursor }, basis + '.navigation attempt receipt');
    }
  }
  exact([...windows.keys()], [...audit.checkpoints].filter(([tick, state]) => tick > 0 && (state.events.length > 0 ||
    (state.unsafe > 0) !== (audit.checkpoints.get(tick - 1).unsafe > 0))).map(([tick]) => tick), label + '.all and only event or unsafe-transition boundaries retained');
  for (const [i, row] of raw.operations.entries()) {
    const basis = label + '.operations[' + i + ']', receipt = row.receipt, window = windows.get(receipt.tick);
    exact(receiptNames.includes(row.kind), true, basis + '.known receipt kind');
    exact(!!window, true, basis + '.actual event window exists');
    if (!window) throw new Error('Operation has no actual event window');
    exact(row.before, window.before, basis + '.same actual pre-interval snapshot'); exact(row.after, window.after, basis + '.same actual post-interval snapshot');
    near(row.observedAt, receipt.tick / 60, basis + '.observedAt');
    exact(receipt, row.after.model[row.kind][receipt.id - 1], basis + '.detached original permanent receipt');
    operationKeys.push(row.kind + ':' + receipt.id);
  }
  exact(operationKeys.slice().sort(), receiptNames.flatMap(name => audit.histories[name].map(receipt => name + ':' + receipt.id)).sort(), label + '.all permanent receipts have exactly one operation observation');
  const compactFields = ['tick', 'keys', 'phase', 'operationPhase', 'cursor', 'commandCount', 'blockedCommands', 'eventCount', 'jobId', 'stage',
    'stageElapsedTicks', 'hookId', 'loadJobsCompleted', 'unloadJobsCompleted', 'ballastPositionUnits', 'ballastTargetUnits', 'rollRad', 'angularVelocityRadS', 'unsafeTicks', 'stableTicks'];
  let previousCompactTick = -1;
  for (const [i, row] of raw.compactTrace.entries()) {
    const tick = row.tick, state = audit.checkpoints.get(tick), roll = matrix.sampled.get(tick), basis = label + '.compactTrace[' + i + ']';
    exact(Number.isInteger(tick) && tick >= 0 && tick <= finalTick && tick > previousCompactTick, true, basis + '.unique chronological sample'); previousCompactTick = tick;
    exact(Object.keys(row).sort(), compactFields.slice().sort(), basis + '.all observed compact fields');
    if (!state || !roll) throw new Error('Compact state falls outside actual trajectory');
    const crane = craneAt(audit.jobs, tick, state.ownership.hookId);
    match(row, { tick, keys: keysAt(tick), phase: state.phase, operationPhase: phaseFor(state.loads, state.unloads), cursor: state.cursor,
      commandCount: audit.histories.commandReceipts.filter(receipt => receipt.tick <= tick).length,
      blockedCommands: audit.histories.blockedReceipts.filter(receipt => receipt.tick <= tick).length, eventCount: state.eventCount,
      jobId: crane.jobId, stage: crane.stage, stageElapsedTicks: crane.stageElapsedTicks, hookId: state.ownership.hookId,
      loadJobsCompleted: state.loads, unloadJobsCompleted: state.unloads, ballastPositionUnits: state.position, ballastTargetUnits: state.target,
      rollRad: roll.theta, angularVelocityRadS: roll.omega, unsafeTicks: state.unsafe, stableTicks: state.stable }, basis);
  }
  for (const [i, row] of raw.retained.entries()) near(row.seconds, row.state.model.tick / 60, label + '.retained[' + i + '].seconds');
  return compactFields;
}

function reviewRound(entry) {
  const file = path.join(corpus, entry.file), initialAssertions = assertions, initialFailures = failures.length;
  exact(hash(file), entry.sha256, entry.name + '.approved projection bytes');
  const raw = read(file), label = entry.name, level = parameters.levels.find(level => level.level === raw.initial.model.level);
  exact(Object.hasOwn(raw, 'pilotDiagnostics'), false, label + '.no strategy diagnostics');
  exact(entry.removedPaths, ['pilotDiagnostics'], label + '.approved lossless projection scope');
  exact(entry.sourceHashes.contract, contractHash, label + '.original actual run contract');
  exact(raw.name, label, label + '.name'); exact(raw.difficulty, level.level - 1, label + '.difficulty');
  exact(raw.initial.model.level, Number(/^level([1-3])-/.exec(label)[1]), label + '.named level');
  exact(raw.mode, label.endsWith('-record') ? 'record' : 'loss', label + '.actual case mode');
  exact(raw.initial.model.tick, 0, label + '.initial tick');
  exact(raw.intervalTrace.length, raw.final.model.tick, label + '.every actual interval retained');
  exact(raw.actualFixedTicks, raw.intervalTrace.length, label + '.actual fixed ticks'); exact(entry.actualFixedTicks, raw.actualFixedTicks, label + '.index actual ticks');
  exact(raw.final.model.phase, raw.mode === 'record' ? 'won' : 'lost', label + '.actual requested outcome');
  exact(raw.initial.model.inputState, { cancelEpoch: 0, quarantined: false, aArmed: true, bArmed: true, navigationDirection: null, navigationHeldTicks: 0 }, label + '.initial public input latches');
  const audit = auditCalendar(raw, level, label), matrix = matrixReview(raw, audit, level, label);
  checkSnapshots(raw, audit, matrix, level, label);
  const compactFields = checkBindings(raw, audit, matrix, label), sources = sourcesOf(raw);
  return { name: label, level: level.level, passed: failures.length === initialFailures, assertions: assertions - initialAssertions,
    projectionSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, originalReportSha256: entry.originalReportSha256,
    sourceHashes: entry.sourceHashes, result: { ...audit.firstTerminal, score: raw.final.model.score, elapsed: raw.final.model.tick / 60 },
    counts: { fullSnapshotCopies: sources.length, distinctSnapshotTicks: new Set(sources.map(row => row.state.model.tick)).size,
      retained: raw.retained.length, compact: raw.compactTrace.length, intervals: raw.intervalTrace.length,
      eventWindows: raw.eventTransitions.length, events: raw.final.model.eventCount, operations: raw.operations.length,
      inputChanges: raw.inputChanges.length, matrixSpans: matrix.spans.length,
      receipts: Object.fromEntries(receiptNames.map(name => [name, audit.histories[name].length])) },
    coverage: { movingBallastIntervals: audit.intervals.filter(row => row.direction !== 0).length,
      concurrentCraneAndBallastIntervals: audit.intervals.filter(row => row.direction !== 0 && !row.expected.crane.beforeAdvance.idle).length,
      cargoMassChangeIntervals: audit.intervals.filter((row, i) => row.measured.aboardCargoMassT !== (i ? audit.intervals[i - 1].measured.aboardCargoMassT : 0)).length,
      overboardTransfers: audit.histories.transferReceipts.filter(row => row.boundary === 'overboard').length,
      unsafeIntervals: audit.intervals.filter(row => row.expected.safety.unsafe).length,
      qualifyingDepartureIntervals: audit.intervals.filter(row => row.expected.departure.eligible && !row.expected.departure.blockedByFailure).length,
      failureFacts: raw.final.model.failures.map(row => row.kind) },
    compactFieldsChecked: compactFields, strictGateMargins: matrix.margins,
    matrixSpans: matrix.spans.map(({ origin, ...span }) => span) };
}

if (fs.existsSync(output)) throw new Error('Output directory must be fresh; prior evidence is never overwritten');
fs.mkdirSync(output, { recursive: true });
const rounds = [];
let executionError = null;
try {
  exact(index.originalFilesUnchanged, true, 'projection original bytes preserved');
  for (const run of index.sourceRuns) {
    exact(run.startHashes, run.endHashes, 'original actual run source window unchanged');
    exact(run.startHashes.contract, contractHash, 'original actual run approved contract');
  }
  for (const entry of index.rounds) rounds.push(reviewRound(entry));
} catch (error) { executionError = { name: error.name, message: error.message, stack: error.stack }; }
const endHashes = hashes(), completedAt = new Date().toISOString();
exact(endHashes, startHashes, 'independent helper and actual evidence unchanged during audit');
const total = key => rounds.reduce((sum, round) => sum + round.counts[key], 0);
const report = {
  game: 'harbor-counterweight', kind: 'independent-existing-observation-review', passed: executionError === null && failures.length === 0 && rounds.length === 6,
  startedAt, completedAt, sourceUnchanged: isDeepStrictEqual(startHashes, endHashes), startHashes, endHashes,
  source: { index: portable(indexPath), indexSha256: approvedIndexHash, originalReportSha256: index.originalReportSha256,
    runs: index.sourceRuns.map(run => ({ report: portable(run.path), sha256: run.sha256, startHashes: run.startHashes, endHashes: run.endHashes })) },
  method: 'Existing actual observations only. Immutable job receipts define an absolute stage/transfer calendar; integer target spans determine ballast. Ownership mass/moment is recomputed from IDs. A 4-by-4 augmented matrix raised by repeated squaring integrates each constant-cargo and constant-ballast-direction span from the independent prior endpoint; observed angles never reset that origin. Each actual post-angle gate is checked strictly, and every matrix-derived gate must agree without tolerance.',
  numericalComparison: { absoluteTolerance: tolerance, integerAndIdentityTolerance: 0, maximumErrors,
    gateTolerance: 0, gateMargins: 'Per-round observed and predicted distances from all four angular thresholds, with measured matrix-vs-observation error envelopes; no gate is widened.' },
  assertions, failureCount: failures.length, failures, executionError,
  totals: Object.fromEntries(['fullSnapshotCopies', 'distinctSnapshotTicks', 'retained', 'compact', 'intervals', 'eventWindows', 'events', 'operations', 'inputChanges', 'matrixSpans'].map(key => [key, total(key)])),
  rounds,
  limitations: [
    'This is an audit of these six existing ordinary rounds, not a new game run or proof for every possible input/layout.',
    'Input samples, command legality, action priority, receipt links and reported eligible navigation ages are checked. Full button rearming, navigation repeat timing and cancellation state machines are not independently replayed.',
    'API invalid-dt, terminal/pause freeze, retry and synthetic simultaneous-failure boundaries are outside this ordinary-corpus audit; absent branches are not claimed covered.',
    'The roll matrix is mathematically equivalent to the public fixed-step recurrence but groups floating arithmetic differently. The 1e-8 absolute allowance applies only to derived numeric values; every observed safety/departure gate remains strict and is separately compared with the independent prediction.',
    'The physical model has fixed GM/roll radius and shore-supported cargo; this report makes no real-vessel engineering claim. No Model, pilot, author solver, private witness or new gameplay was read or executed.'
  ]
};
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, rounds: rounds.length, assertions, failureCount: failures.length, executionError,
  totals: report.totals, maximumErrors, reportSha256: hash(path.join(output, 'report.json')) }, null, 2));
if (!report.passed) process.exitCode = 1;
