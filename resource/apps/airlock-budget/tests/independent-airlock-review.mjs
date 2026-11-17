// Offline review of public observations only; no production/pilot imports.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { fixedInterval, terminal, EPS, HZ, GROUP_IDS, GROUP_RATES, LEVELS } from './airlock-interval-oracle.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = path.resolve(process.argv[2] || '/workspace/scratch/hundred-games/airlock-budget/ordinary-rounds-v3/public-observations');
const output = path.resolve(process.argv[3] || '/workspace/scratch/hundred-games/airlock-budget/independent-review-first');
const expectedIndex = '2f778ed17ba129141a05fbec12a651c097f7e933d024cdbcbb19d90fc702793b';
const expectedContract = 'f05fe9de593222e4c5205b9582995a5aa2788b093336d082598d59745e45af06';
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const indexFile = path.join(corpus, 'index.json');
if (sha(indexFile) !== expectedIndex) throw new Error('Unapproved public observation index; no round files read');
const index = read(indexFile);
if (index.rounds.length !== 6 || new Set(index.rounds.map(round => round.file)).size !== 6 ||
  !index.rounds.every(round => /^level[1-3]-(record|loss)\.json$/.test(round.file) && round.file === round.name + '.json'))
  throw new Error('Public round filenames must be exactly the six approved basenames');
const portable = file => file.startsWith('/workspace/pureTV/') ? 'repoRelative:' + file.slice('/workspace/pureTV/'.length) :
  'scratchRelative:' + path.relative('/workspace/scratch', file);
const sourceFiles = [path.join(app, 'docs/model-contract.md'), indexFile,
  ...['airlock-interval-oracle.mjs', 'independent-airlock-review.mjs'].map(file => path.join(app, 'tests', file)),
  ...index.rounds.map(round => path.join(corpus, round.file))];
const hashes = () => Object.fromEntries(sourceFiles.map(file => [portable(file), sha(file)]));
const startedAt = new Date().toISOString(), startHashes = hashes(), failures = [];
let assertions = 0;
function equal(actual, expected, label) {
  assertions++;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push({ label, actual, expected });
}
function close(actual, expected, label, errors, metric = label) {
  assertions++;
  const error = Math.abs(actual - expected);
  errors[metric] = Math.max(errors[metric] || 0, error);
  if (!Number.isFinite(actual) || !Number.isFinite(expected) || error > 1e-8) failures.push({ label, actual, expected, error });
}
equal(sha(indexFile), expectedIndex, 'approved public observation index');
equal(sha(path.join(app, 'docs/model-contract.md')), expectedContract, 'approved public contract');
equal(index.sourceHashes.contract, expectedContract, 'ordinary corpus contract identity');

const fluxKeys = ['airRemoved', 'recovered', 'recoveryLoss', 'vented', 'filled', 'leak', 'breathing'];
const taskFluxKeys = ['recovered', 'vented', 'filled', 'recoveryLoss'];
const ledgerMapping = { breathing: 'breathing', leak: 'leak', vent: 'vented', recoveryLoss: 'recoveryLoss',
  recoveredTransferred: 'recovered', filledTransferred: 'filled' };
const zeroTotals = () => ({ ...Object.fromEntries(fluxKeys.map(key => [key, 0])), groupBreathing: [0, 0, 0] });
const forcing = task => ({ id: task?.id ?? null, phase: task?.phase ?? null, stopped: task?.stopped ?? false });

function reviewRound(entry) {
  const previousFailures = failures.length, previousAssertions = assertions;
  const file = path.join(corpus, entry.file), raw = read(file), name = entry.name;
  equal(sha(file), entry.sha256, name + ' projected observation SHA');
  equal(Object.hasOwn(raw, 'pilotDiagnostics'), false, name + ' no pilot diagnostics');
  equal(raw.projection.originalRawSha256, entry.originalRawSha256, name + ' original raw provenance');
  const level = LEVELS[raw.initial.model.level - 1], errors = {};
  const events = raw.eventTransitions.flatMap(record => record.events);
  events.forEach((event, i) => {
    equal(event.id, i + 1, `${name}.event id ${i}`);
    equal(event.at, event.tick / HZ, `${name}.event time ${i}`);
  });
  const taskStarts = events.filter(event => event.type === 'task-start');
  const taskEnds = events.filter(event => event.type === 'task-complete');
  const migrations = events.filter(event => event.type === 'migration');
  const isolations = events.filter(event => event.type === 'isolation-complete');
  const operations = raw.operations.map(record => record.receipt);
  equal(events.filter(event => event.type === 'command').map(event => event.commandId), operations.map(operation => operation.id), name + ' operation/event identity');
  operations.forEach((operation, i) => {
    equal(operation.id, i + 1, name + '.command sequence');
    equal(operation.at, operation.tick / HZ, name + '.command time');
    const commandEvent = events.find(event => event.type === 'command' && event.commandId === operation.id);
    equal(commandEvent?.operation, operation.type, name + '.command operation receipt');
    equal(commandEvent?.tick, operation.tick, name + '.command receipt tick');
    if (operation.type === 'start') {
      const before = raw.operations[i].before.model, after = raw.operations[i].after.model;
      equal(before.task, null, name + '.single shared task at start');
      equal(operation.kind === 'isolate' ? before.leak.isolated : before.groups.find(g => g.id === operation.groupId).evacuated, false, name + '.start only unfinished work');
      equal(after.selectedId, operation.kind === 'isolate' ? 'leak' : operation.groupId, name + '.start uses selected target');
      equal(operation.mode, operation.kind === 'isolate' ? null : before.modeSelection, name + '.start preserves selected mode');
      for (const key of ['kind', 'groupId', 'mode']) equal(after.task[key], operation[key], name + '.start identity ' + key);
      equal(after.task.id, operation.taskId, name + '.start task receipt');
      equal(after.task.startedTick, operation.tick, name + '.start tick');
    }
  });
  taskStarts.forEach((start, i) => {
    equal(start.taskId, i + 1, name + '.task identity sequence');
    if (i) equal(taskEnds.some(end => end.taskId === taskStarts[i - 1].taskId && end.tick < start.tick), true, name + '.no overlapping tasks/pump');
  });
  for (const id of GROUP_IDS) equal(migrations.filter(e => e.groupId === id).map(e => [e.from, e.to]),
    migrations.some(e => e.groupId === id && e.to === 'C') ? [['B', 'A'], ['A', 'C']] :
      migrations.some(e => e.groupId === id) ? [['B', 'A']] : [], name + '.' + id + ' migrates once per leg');
  equal(isolations.length <= 1, true, name + '.single leak isolation');
  const groupAt = (id, tick) => {
    const movements = migrations.filter(e => e.groupId === id && e.tick <= tick);
    const arrival = movements.find(e => e.to === 'C');
    return { id, location: movements.at(-1)?.to || 'B', arrivalTick: arrival?.tick ?? null,
      deadlineTick: level.deadlines[GROUP_IDS.indexOf(id)] };
  };
  const isolatedAt = tick => isolations.some(event => event.tick <= tick);
  const segments = [];
  let preceding = raw.initial.model;
  for (const record of raw.eventTransitions) {
    const before = record.before.model, after = record.after.model;
    equal(before.tick, record.tick - 1, name + '.event before endpoint');
    equal(after.tick, record.tick, name + '.event after endpoint');
    equal(record.eventCountBefore, before.eventCount, name + '.event count before');
    equal(record.eventCountAfter, after.eventCount, name + '.event count after');
    equal(record.events.map(e => e.id), Array.from({ length: after.eventCount - before.eventCount }, (_, i) => before.eventCount + i + 1), name + '.event window completeness');
    equal(before.tick >= preceding.tick, true, name + '.ordered event windows');
    if (before.tick > preceding.tick) segments.push({ from: preceding.tick, to: before.tick, before: preceding, force: forcing(preceding.task) });
    const interval = after.lastInterval;
    segments.push({ from: before.tick, to: after.tick, before, after, record,
      force: { id: interval.taskId, phase: interval.taskPhase, stopped: interval.taskStopped } });
    preceding = after;
  }
  if (raw.final.model.tick > preceding.tick) segments.push({ from: preceding.tick, to: raw.final.model.tick, before: preceding, force: forcing(preceding.task) });
  const predicted = [{ tank: level.tank, air: 12, totals: zeroTotals(), task: null, phase: 'playing', lostReason: null, score: 0 }];
  const taskTotals = new Map(), stageEnds = [], capacityConstraints = [];
  let firstTerminal = null, stoppedTicks = 0;
  for (const segment of segments) {
    equal(predicted.length - 1, segment.from, name + '.continuous interval coverage');
    const { force, before } = segment, count = segment.to - segment.from, origin = predicted.at(-1);
    const groupsBefore = GROUP_IDS.map(id => groupAt(id, segment.from));
    const rates = groupsBefore.map((group, i) => group.location === 'C' ? 0 : GROUP_RATES[i]);
    const curve = fixedInterval({ tank: origin.tank, air: origin.air, capacity: level.capacity,
      phase: force.phase, stopped: force.stopped, leaking: !isolatedAt(segment.from), groupRates: rates }, count);
    const baseTask = before.task?.id === force.id ? before.task : segment.after?.task;
    if (before.task) {
      equal(force.id, before.task.id, name + '.existing task retained during interval');
      equal(force.phase, before.task.phase, name + '.effective phase is the interval-start phase');
      const operation = segment.record && operations.find(operation => operation.tick === segment.to && ['stop', 'resume'].includes(operation.type));
      equal(force.stopped, operation ? operation.type === 'stop' : before.task.stopped, name + '.stop state requires accepted operation');
      if (operation) equal(operation.taskId, before.task.id, name + '.stop/resume retains task target');
    } else if (force.id !== null) {
      const operation = operations.find(operation => operation.tick === segment.to && operation.type === 'start');
      equal(operation?.taskId, force.id, name + '.new task requires accepted start');
      equal(force.phase, operation?.kind === 'isolate' ? 'isolate' : operation?.mode, name + '.first phase from accepted mode');
      equal(force.stopped, false, name + '.new task starts running');
    }
    if (force.id !== null) {
      equal(Boolean(baseTask), true, name + '.public task identity present');
      equal(baseTask.id, force.id, name + '.interval task identity');
      const startOperation = operations.find(operation => operation.type === 'start' && operation.taskId === force.id);
      for (const key of ['kind', 'groupId', 'mode']) equal(baseTask[key], startOperation?.[key], name + '.persistent original task ' + key);
      equal(baseTask.startedTick, startOperation?.tick, name + '.persistent original start tick');
      if (before.task) equal(force.id, before.task.id, name + '.in-flight identity cannot redirect');
    }
    const phaseBefore = before.task?.id === force.id && before.task.phase === force.phase ? before.task.phaseTicks : 0;
    const totalBefore = before.task?.id === force.id ? before.task.totalTicks : 0;
    const accumulatedTask = taskTotals.get(force.id) || Object.fromEntries(taskFluxKeys.map(key => [key, 0]));
    for (let k = 1; k <= count; k++) {
      const tick = segment.from + k, cumulative = curve.sample(k), previous = curve.sample(k - 1);
      const totals = Object.fromEntries(fluxKeys.map(key => [key, origin.totals[key] + cumulative[key]]));
      totals.groupBreathing = cumulative.groupBreathing.map((amount, i) => origin.totals.groupBreathing[i] + amount);
      const active = force.id !== null && !force.stopped;
      if (force.stopped) stoppedTicks++;
      const phaseTicks = phaseBefore + (active ? k : 0), totalTicks = totalBefore + (active ? k : 0);
      const completed = active && ((['recover', 'vent'].includes(force.phase) && cumulative.air <= EPS) ||
        (force.phase === 'fill' && cumulative.air >= 12 - EPS) ||
        (['load', 'unload'].includes(force.phase) && phaseTicks >= 120) || (force.phase === 'isolate' && phaseTicks >= 180));
      const taskSummary = force.id === null ? null : { id: force.id, kind: baseTask.kind, groupId: baseTask.groupId,
        mode: baseTask.mode, startedTick: baseTask.startedTick, phase: force.phase, stopped: force.stopped, phaseTicks, totalTicks,
        ...Object.fromEntries(taskFluxKeys.map(key => [key, accumulatedTask[key] + cumulative[key]])) };
      const eventEndpoint = segment.record && k === count;
      if (completed) {
        equal(Boolean(eventEndpoint), true, name + '.first completion must have a real event window at ' + tick);
        stageEnds.push({ taskId: force.id, phase: force.phase, tick, phaseTicks });
      }
      let task = taskSummary;
      if (eventEndpoint) {
        const after = segment.after;
        const expectedNext = completed ? ({ recover: 'load', vent: 'load', load: 'fill', fill: 'unload' }[force.phase] || null) : force.phase;
        equal(after.task?.id ?? null, completed && expectedNext === null ? null : force.id, name + '.task completion identity@' + tick);
        equal(after.task?.phase ?? null, expectedNext, name + '.stage transition@' + tick);
        if (completed && expectedNext !== null) task = { ...taskSummary, phase: expectedNext, phaseTicks: 0 };
        if (completed && expectedNext === null) task = null;
        const moves = segment.record.events.filter(e => e.type === 'migration');
        equal(moves.map(e => [e.groupId, e.from, e.to]), completed && ['load', 'unload'].includes(force.phase) ?
          [[baseTask.groupId, force.phase === 'load' ? 'B' : 'A', force.phase === 'load' ? 'A' : 'C']] : [], name + '.migration gate@' + tick);
        equal(segment.record.events.some(e => e.type === 'isolation-complete'), completed && force.phase === 'isolate', name + '.isolation gate@' + tick);
        equal(segment.record.events.filter(e => e.type === 'task-complete').map(e => e.taskId),
          completed && ['unload', 'isolate'].includes(force.phase) ? [force.id] : [], name + '.completion receipt required@' + tick);
      }
      const groups = GROUP_IDS.map(id => groupAt(id, tick));
      const airState = eventEndpoint ? segment.after.chambers.A : before.chambers.A;
      const reason = terminal({ tick, air: cumulative.air, bDoor: airState.doorBOpen, cDoor: airState.doorCOpen,
        groups, isolated: isolatedAt(tick), tank: cumulative.tank, reserve: level.reserve, shortfalls: cumulative.oxygenShortfall });
      if (reason && !firstTerminal) firstTerminal = { tick, reason };
      const phase = reason === 'won' ? 'won' : reason ? 'lost' : 'playing';
      const score = groups.filter(group => group.location === 'C').length * 300 + (phase === 'won' ? 1000 + 10 * Math.floor(cumulative.tank + EPS) : 0);
      const lastInterval = { fromTick: tick - 1, toTick: tick, tankBefore: predicted.at(-1).tank, tankAfter: cumulative.tank,
        airBefore: predicted.at(-1).air, airAfter: cumulative.air, taskId: force.id, taskPhase: force.phase, taskStopped: force.stopped,
        ...Object.fromEntries(fluxKeys.map(key => [key, cumulative[key] - previous[key]])),
        breathingDemand: rates.reduce((sum, rate) => sum + rate / HZ, 0),
        groupBreathing: GROUP_IDS.map((id, i) => ({ groupId: id, requested: rates[i] / HZ,
          actual: cumulative.groupBreathing[i] - previous.groupBreathing[i], location: groupsBefore[i].location })) };
      if (force.phase === 'recover' && !force.stopped) {
        const nominal = Math.min(.75 / HZ, lastInterval.airBefore);
        if (lastInterval.airRemoved < nominal - 1e-8) capacityConstraints.push({ tick, taskId: force.id,
          headroom: level.capacity - lastInterval.tankBefore, actualRecovered: lastInterval.recovered, nominalRecovered: nominal * .9 });
      }
      predicted.push({ tank: cumulative.tank, air: cumulative.air, totals, lastInterval, task, taskSummary, phase,
        lostReason: phase === 'lost' ? reason : null, score });
    }
    if (force.id !== null) taskTotals.set(force.id, Object.fromEntries(taskFluxKeys.map(key => [key, predicted.at(-1).taskSummary[key]])));
  }
  equal(firstTerminal, { tick: raw.final.model.tick, reason: raw.final.model.phase === 'won' ? 'won' : raw.final.model.lostReason }, name + '.first terminal and priority');
  for (const event of events.filter(event => event.type === 'door')) {
    close(event.air, predicted[event.tick].air, name + '.door receipt air', errors, 'door.air');
    close(event.pressure, predicted[event.tick].air / 12, name + '.door receipt pressure', errors, 'door.pressure');
    if (event.open) equal(!event.otherOpen && (event.door === 'B' ? event.air <= EPS : event.air >= 12 - EPS), true, name + '.actual door-opening receipt legal');
  }
  const sources = [{ label: 'initial', state: raw.initial }, { label: 'final', state: raw.final },
    ...raw.retained.map((entry, i) => ({ label: `retained[${i}]`, state: entry.state })),
    ...raw.eventTransitions.flatMap((entry, i) => ['before', 'after'].map(side => ({ label: `events[${i}].${side}`, state: entry[side] }))),
    ...raw.operations.flatMap((entry, i) => ['before', 'after'].map(side => ({ label: `operations[${i}].${side}`, state: entry[side] })))];
  function checkTask(actual, expected, label) {
    if (!expected) { equal(actual, null, label); return; }
    for (const [key, value] of Object.entries(expected)) {
      if (taskFluxKeys.includes(key)) close(actual?.[key], value, label + '.' + key, errors, 'task.' + key);
      else equal(actual?.[key], value, label + '.' + key);
    }
  }
  for (const source of sources) {
    const actual = source.state.model, tick = actual.tick, expected = predicted[tick], label = `${name}.${source.label}@${tick}`;
    close(actual.tank.oxygen, expected.tank, label + '.tank', errors, 'tank');
    close(actual.chambers.A.air, expected.air, label + '.air', errors, 'air');
    close(actual.chambers.A.pressure, expected.air / 12, label + '.pressure', errors, 'pressure');
    equal(actual.chambers.B.pressure, 0, label + '.B pressure'); equal(actual.chambers.C.pressure, 1, label + '.C pressure');
    equal(actual.chambers.A.capacity, 12, label + '.A capacity');
    equal(actual.tank.capacity, level.capacity, label + '.tank capacity'); equal(actual.tank.reserveFloor, level.reserve, label + '.reserve floor');
    equal(actual.tank.initialOxygen, level.tank, label + '.initial tank');
    equal(actual.tank.oxygen >= -1e-8 && actual.tank.oxygen <= level.capacity + 1e-8, true, label + '.bounded tank');
    equal(actual.chambers.A.air >= -1e-8 && actual.chambers.A.air <= 12 + 1e-8, true, label + '.bounded air');
    equal(!actual.chambers.A.doorBOpen || (actual.chambers.A.air <= EPS && !actual.chambers.A.doorCOpen), true, label + '.B interlock');
    equal(!actual.chambers.A.doorCOpen || (actual.chambers.A.air >= 12 - EPS && !actual.chambers.A.doorBOpen), true, label + '.C interlock');
    for (const [key, value] of Object.entries(ledgerMapping)) close(actual.ledger[key], expected.totals[value], label + '.ledger.' + key, errors, 'ledger.' + key);
    equal(actual.ledger.initialTotal, level.tank + 12, label + '.initial total');
    close(actual.tank.oxygen + actual.chambers.A.air + actual.ledger.breathing + actual.ledger.leak + actual.ledger.vent + actual.ledger.recoveryLoss,
      level.tank + 12, label + '.conservation', errors, 'conservation');
    close(actual.ledger.error, 0, label + '.reported residual', errors, 'reportedResidual');
    actual.groups.forEach((group, i) => {
      const location = groupAt(GROUP_IDS[i], tick);
      equal(group.id, GROUP_IDS[i], label + '.group identity'); equal(group.breathingRate, GROUP_RATES[i], label + '.group rate');
      equal(group.deadlineTick, level.deadlines[i], label + '.group deadline'); equal(group.location, location.location, label + '.group location');
      equal(group.arrivalTick, location.arrivalTick, label + '.group arrival'); equal(group.evacuated, location.location === 'C', label + '.group evacuated');
      close(group.consumedOxygen, expected.totals.groupBreathing[i], label + '.group consumption', errors, 'group.' + GROUP_IDS[i]);
    });
    close(actual.groups.reduce((sum, group) => sum + group.consumedOxygen, 0), actual.ledger.breathing, label + '.group ledger sum', errors, 'groupSum');
    equal(actual.chambers.A.groupId, GROUP_IDS.find(id => groupAt(id, tick).location === 'A') || null, label + '.A occupant');
    equal(actual.leak.isolated, isolatedAt(tick), label + '.isolated');
    equal(actual.leak.isolatedTick, isolations.find(e => e.tick <= tick)?.tick ?? null, label + '.isolated tick');
    equal(actual.leak.rate, .5, label + '.leak rate'); equal(actual.leak.serviceTicks, 180, label + '.isolation duration');
    equal(actual.elapsed, tick / HZ, label + '.elapsed'); equal(actual.remaining, 90 - tick / HZ, label + '.remaining');
    for (const key of ['phase', 'lostReason', 'score']) equal(actual[key], expected[key], label + '.' + key);
    equal(actual.evacuatedCount, GROUP_IDS.filter(id => groupAt(id, tick).location === 'C').length, label + '.evacuated count');
    checkTask(actual.task, expected.task, label + '.task');
    equal(actual.completedTasks.map(task => task.id), taskEnds.filter(e => e.tick <= tick).map(e => e.taskId), label + '.completed identities');
    actual.completedTasks.forEach(task => {
      const end = taskEnds.find(e => e.taskId === task.id);
      checkTask(task, predicted[end.tick].taskSummary, label + '.completed task');
      equal(task.completedTick, end.tick, label + '.completion tick');
    });
    equal(actual.taskCount, taskStarts.filter(e => e.tick <= tick).length, label + '.task count');
    const issued = operations.filter(operation => operation.tick <= tick), occurred = events.filter(event => event.tick <= tick);
    equal(actual.commandCount, issued.length, label + '.command count'); equal(actual.lastOperation, issued.at(-1) || null, label + '.last operation');
    equal(actual.eventCount, occurred.length, label + '.event count'); equal(actual.lastEvent, occurred.at(-1) || null, label + '.last event');
    if (!tick) equal(actual.lastInterval, null, label + '.initial interval');
    else for (const [key, value] of Object.entries(expected.lastInterval)) {
      if (fluxKeys.includes(key) || ['tankBefore', 'tankAfter', 'airBefore', 'airAfter', 'breathingDemand'].includes(key))
        close(actual.lastInterval[key], value, label + '.interval.' + key, errors, 'interval.' + key);
      else if (key === 'groupBreathing') value.forEach((group, i) => {
        for (const field of ['groupId', 'location']) equal(actual.lastInterval.groupBreathing[i][field], group[field], label + '.old group ' + field);
        for (const field of ['requested', 'actual']) close(actual.lastInterval.groupBreathing[i][field], group[field], label + '.group ' + field, errors, 'interval.group.' + field);
      });
      else equal(actual.lastInterval[key], value, label + '.interval.' + key);
    }
  }
  for (const [i, actual] of raw.compactTrace.entries()) {
    const expected = predicted[actual.tick], label = `${name}.compact[${i}]`;
    close(actual.oxygen, expected.tank, label + '.tank', errors, 'tank'); close(actual.air, expected.air, label + '.air', errors, 'air');
    equal(actual.locations, GROUP_IDS.map(id => groupAt(id, actual.tick).location), label + '.locations');
    equal(actual.isolated, isolatedAt(actual.tick), label + '.isolated');
    equal(actual.taskId, expected.task?.id ?? null, label + '.taskId'); equal(actual.taskPhase, expected.task?.phase ?? null, label + '.taskPhase');
    equal(actual.taskStopped, expected.task?.stopped ?? false, label + '.stopped'); equal(actual.phaseTicks, expected.task?.phaseTicks ?? null, label + '.phaseTicks');
    equal(actual.commandCount, operations.filter(o => o.tick <= actual.tick).length, label + '.commands');
    equal(actual.completedCount, taskEnds.filter(e => e.tick <= actual.tick).length, label + '.completed');
  }
  const recoveredStages = stageEnds.filter(stage => stage.phase === 'recover');
  return { name, passed: failures.length === previousFailures, assertions: assertions - previousAssertions,
    projectionSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, fullStateOccurrences: sources.length,
    distinctFullTicks: new Set(sources.map(source => source.state.model.tick)).size, retainedStates: raw.retained.length,
    compactCheckpoints: raw.compactTrace.length, eventTransitions: raw.eventTransitions.length, events: events.length,
    operations: operations.length, fixedIntervals: segments.length, terminal: firstTerminal, tank: predicted.at(-1).tank,
    reserveMargin: predicted.at(-1).tank - level.reserve, groupConsumptions: predicted.at(-1).totals.groupBreathing,
    arrivals: GROUP_IDS.map(id => groupAt(id, raw.final.model.tick).arrivalTick),
    completedStageDurations: stageEnds.map(({ taskId, phase, phaseTicks }) => ({ taskId, phase, activeTicks: phaseTicks })),
    recoveryBeyondUnconstrainedTicks: recoveredStages.map(stage => ({ taskId: stage.taskId, extraActiveTicks: stage.phaseTicks - 960 })),
    independentlyCapacityConstrainedTicks: capacityConstraints.length, capacityConstraintExamples: capacityConstraints.slice(0, 3),
    observedCapacityLimitedTicksNotIndependentlySpecified: raw.final.model.capacityLimitedTicks,
    stoppedTicks, oxygenExhaustionBoundaryTicks: predicted.filter(p => p.lastInterval && p.lastInterval.breathing < p.lastInterval.breathingDemand - EPS).length,
    maximumErrors: errors };
}

const fixtureErrors = {};
const cap = fixedInterval({ tank: 48, air: 12, capacity: 48, phase: 'recover', stopped: false, leaking: true, groupRates: GROUP_RATES }, 2);
close(cap.sample(1).recovered, 0, 'oracle fixture full tank first tick', fixtureErrors);
close(cap.sample(2).recovered, .01125, 'oracle fixture full tank second tick', fixtureErrors);
const stop = fixedInterval({ tank: 10, air: 12, capacity: 48, phase: 'fill', stopped: true, leaking: true, groupRates: [.14, 0, .08] }, 60).sample(60);
close(stop.tank, 9.28, 'oracle fixture stopped equipment still consumes/leaks', fixtureErrors); close(stop.air, 12, 'oracle fixture stopped air unchanged', fixtureErrors);
const partial = fixedInterval({ tank: .5 / 60 + .004, air: 0, capacity: 48, phase: null, stopped: false, leaking: true, groupRates: GROUP_RATES }, 1).sample(1);
close(partial.leak, .5 / 60, 'oracle fixture leak precedes breath', fixtureErrors);
partial.groupBreathing.forEach((value, i) => close(value, [.00175, .00125, .001][i], 'oracle fixture proportional final breath ' + i, fixtureErrors));
const results = [];
for (const entry of index.rounds) {
  try { results.push(reviewRound(entry)); }
  catch (error) { failures.push({ round: entry.name, error: error.message }); results.push({ name: entry.name, passed: false, error: error.message }); }
}
const endHashes = hashes(); equal(endHashes, startHashes, 'source and public observations unchanged');
const report = {
  passed: failures.length === 0, scope: 'Independent offline arithmetic and event-constraint review of the six existing v3 ordinary rounds. No model, controller, browser or private witness execution/access.',
  startedAt, completedAt: new Date().toISOString(), startHashes, endHashes, sourceUnchanged: JSON.stringify(startHashes) === JSON.stringify(endHashes),
  originalReportSha256: index.originalReportSha256, publicObservationIndexSha256: expectedIndex,
  observedProductionSourceHashesFromIndex: index.sourceHashes,
  method: [
    'Event before/after snapshots define constant phase, occupancy and isolation intervals. Each interval uses cumulative closed-form flows; global resources and ledgers continue from the authored initial state without resetting to observed inventories.',
    'Net recovery after n ticks is min(.9*A0,n*r,headroom0+(n-1)*min(consumption,r)); the offset preserves capacity limits before same-tick consumption.',
    'Check each observed phase transition at its first empty/full or exact 120/180 active-tick boundary, task identity/exclusivity, one migration per leg, old-occupancy breath, isolation-end leakage and every recorded door state.',
    'Re-evaluate first terminal tick from independent inventories/shortfalls and verified migration/isolation events; compare all retained, transition, operation and compact checkpoints.',
  ],
  tolerances: { numericAbsolute: 1e-8, contractEPS: EPS, cumulativeExhaustionDetection: 1e-10, integerCounters: 0 },
  limitations: [
    'The public projection excludes pilot diagnostics; original raw hashes are provenance from the approved index, not a claim that this reviewer inspected forbidden diagnostic bytes.',
    'This validates observed event timing and arithmetic, not a second implementation of input navigation, scheduling or the complete production state machine.',
    'Only actually present ordinary stop, exhaustion, pressure and exact-deadline cases count as production coverage. Three hand fixtures test the oracle only; they are not additional game rounds.',
    'A span continuing after first numerical depletion with unfinished groups is rejected for explicit review, including the possible sub-EPS-shortfall continuation edge; gates are not silently relaxed.',
    'capacityLimitedTicks lacks an exact public comparison predicate. Its reported value is retained for context; independent capacity evidence instead uses actual headroom-limited transfer and stage duration.',
    'No post-terminal freeze, pause/retry/cancel/subtick or physical-device claim is made. Simultaneous terminal priorities and exact deadline arrival are not presumed covered by ordinary rounds.',
  ],
  oracleOnlyFixtures: { count: 3, maximumErrors: fixtureErrors }, assertions, results, failureCount: failures.length, failures,
};
fs.mkdirSync(output, { recursive: false });
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, assertions, failureCount: failures.length,
  results: results.map(r => ({ name: r.name, passed: r.passed, terminal: r.terminal, errors: r.maximumErrors, error: r.error })) }, null, 2));
if (!report.passed) process.exitCode = 1;
