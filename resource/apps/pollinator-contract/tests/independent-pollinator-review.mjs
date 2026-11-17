// Audit existing public observations only: no Model, pilot or private-plan import.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readParameters, makeFlight, flightAt, directHomeTicks, staminaSpan, intervalCount, lastEligibleTick } from './pollinator-flight-oracle.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contractPath = path.join(app, 'docs/model-contract.md');
const CONTRACT_HASH = '9649a3183e467c4410023109947f91671fac29764aae0c6f49095cd5c6282bc5';
const RECEIPTS = ['commandReceipts', 'blockedReceipts', 'navigationReceipts', 'arrivalReceipts', 'completionReceipts', 'unlockReceipts', 'restCompleteReceipts'];
const SWARMS = ['B1', 'B2'];
const copy = value => structuredClone(value), hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let parameters, assertions = 0, failureCount = 0;
const failures = [], maximumErrors = { positionPx: 0, distancePx: 0, direction: 0, other: 0 };
function mismatch(value) { failureCount++; if (failures.length < 100) failures.push(value); }
function exact(actual, expected, label) { assertions++; if (!isDeepStrictEqual(actual, expected)) mismatch({ label, actual, expected }); }
const floatFields = new Set(['x', 'y', 'dx', 'dy', 'rawLengthPx', 'scheduleLengthPx', 'cumulativeDistancePx', 'movedDistancePx']);
function compare(actual, expected, label) {
  const field = label.split('.').at(-1);
  if (typeof expected === 'number' && floatFields.has(field)) {
    assertions++; const error = Math.abs(actual - expected), kind = label.includes('.nominalDirection.') ? 'direction' : ['x', 'y', 'dx', 'dy'].includes(field) ? 'positionPx' : /Length|Distance/.test(field) ? 'distancePx' : 'other';
    if (Number.isFinite(error)) maximumErrors[kind] = Math.max(maximumErrors[kind], error);
    if (!Number.isFinite(actual) || !Number.isFinite(expected) || error > 1e-8) mismatch({ label, actual, expected, tolerance: 1e-8 });
  } else if (Array.isArray(expected)) {
    exact(Array.isArray(actual), true, label + '.array'); exact(actual?.length, expected.length, label + '.length');
    expected.forEach((value, i) => compare(actual?.[i], value, label + '[' + i + ']'));
  } else if (expected && typeof expected === 'object') {
    exact(actual && typeof actual === 'object' ? Object.keys(actual).sort() : null, Object.keys(expected).sort(), label + '.keys');
    for (const [key, value] of Object.entries(expected)) compare(actual?.[key], value, label + '.' + key);
  } else exact(actual, expected, label);
}

function buildMotion(finalModel, level, label) {
  const segments = [[], []], commands = finalModel.commandReceipts, navigation = finalModel.navigationReceipts;
  const selections = [{ tick: 0, swarmCursor: 0, fieldCursor: 0 }], navigationExpected = [];
  let swarmCursor = 0, fieldCursor = 0;
  const at = (source, tick) => {
    const row = segments[source].findLast(row => row.flight.startedAtTick <= tick);
    if (!row) return { mode: 'home', x: parameters.hive.x, y: parameters.hive.y, assignment: 'hive', fieldId: null, flight: null };
    const sampled = flightAt(row.flight, Math.min(tick, row.arrivalTick), parameters.physics), destination = row.flight.destination;
    return { mode: sampled.arrived ? destination.id === 'hive' ? 'home' : 'field' : 'flying', ...sampled.position,
      assignment: destination.id, fieldId: sampled.arrived && destination.id !== 'hive' ? destination.id : null,
      flight: sampled.arrived ? null : sampled.flight };
  };
  const ticks = [...new Set([...commands, ...navigation, ...finalModel.blockedReceipts].map(row => row.tick))].sort((a, b) => a - b);
  for (const tick of ticks) {
    const basis = label + '.commands@' + tick, moves = navigation.filter(row => row.tick === tick), actions = commands.filter(row => row.tick === tick), blocked = finalModel.blockedReceipts.filter(row => row.tick === tick);
    exact(Number.isSafeInteger(tick) && tick >= 1 && tick <= finalModel.tick, true, basis + '.tick domain');
    exact(moves.length <= 1 && actions.length + blocked.length <= 1, true, basis + '.one navigation and action');
    if ([...actions, ...blocked].some(row => row.key === 'b')) exact(moves.length, 0, basis + '.B suppresses navigation even if blocked');
    for (const row of moves) {
      exact(['left', 'right', 'up', 'down'].includes(row.direction), true, basis + '.direction');
      const axis = ['left', 'right'].includes(row.direction) ? 'field' : 'swarm', beforeIndex = axis === 'field' ? fieldCursor : swarmCursor;
      const delta = ['left', 'up'].includes(row.direction) ? -1 : 1, afterIndex = Math.max(0, Math.min(axis === 'field' ? level.fields.length - 1 : 1, beforeIndex + delta));
      exact(beforeIndex !== afterIndex, true, basis + '.clamp attempts have no receipt');
      exact(row.heldTicks === 1 || Number.isSafeInteger(row.heldTicks) && row.heldTicks >= 24 && row.heldTicks % 12 === 0, true, basis + '.reported eligible age');
      navigationExpected.push({ id: navigationExpected.length + 1, fromTick: tick - 1, tick, direction: row.direction, heldTicks: row.heldTicks,
        mode: row.heldTicks === 1 ? 'initial' : 'repeat', axis, beforeIndex, afterIndex });
      if (axis === 'field') fieldCursor = afterIndex; else swarmCursor = afterIndex;
    }
    for (const receipt of actions) {
      const source = SWARMS.indexOf(receipt.swarmId); exact(source, swarmCursor, basis + '.selected swarm');
      exact(['a', 'b'].includes(receipt.key), true, basis + '.accepted key');
      const destination = receipt.key === 'b' ? parameters.hive : level.fields[fieldCursor];
      exact(receipt.destinationId, destination.id, basis + '.selected destination');
      const previous = at(source, tick - 1), flight = makeFlight(receipt.id, tick - 1, { x: previous.x, y: previous.y }, { id: destination.id, x: destination.x, y: destination.y }, parameters.physics);
      exact(receipt.flightId, receipt.id, basis + '.one global flight per accepted command');
      if (segments[source].length) segments[source].at(-1).lastTick = tick - 1;
      segments[source].push({ flight, source, command: receipt, arrivalTick: flight.fromTick + flight.durationTicks, lastTick: finalModel.tick });
    }
    selections.push({ tick, swarmCursor, fieldCursor });
  }
  const arrivalRows = segments.flat().filter(row => row.arrivalTick <= row.lastTick).sort((a, b) => a.arrivalTick - b.arrivalTick || a.source - b.source);
  arrivalRows.forEach((row, i) => { row.arrivalId = i + 1; });
  const residence = [[], []], homeWindows = [[], []];
  for (const source of [0, 1]) {
    const initialEnd = segments[source][0]?.flight.fromTick ?? finalModel.tick;
    if (initialEnd >= 1) homeWindows[source].push({ firstTick: 1, lastTick: initialEnd });
    for (const row of segments[source]) if (row.arrivalTick < row.lastTick) {
      const window = { firstTick: row.arrivalTick + 1, lastTick: row.lastTick };
      if (row.flight.destination.id === 'hive') homeWindows[source].push(window);
      else residence[source].push({ ...window, fieldId: row.flight.destination.id });
    }
  }
  const selectionAt = tick => selections.findLast(row => row.tick <= tick);
  const afterInput = (source, tick) => {
    const accepted = segments[source].find(row => row.flight.startedAtTick === tick);
    return accepted ? { mode: 'flying', ...accepted.flight.origin, assignment: accepted.flight.destination.id, fieldId: null, flight: copy(accepted.flight) } : at(source, tick - 1);
  };
  const distanceAt = (source, tick) => segments[source].reduce((sum, row) => {
    if (tick < row.flight.startedAtTick) return sum;
    const end = Math.min(tick, row.lastTick, row.arrivalTick);
    return sum + flightAt(row.flight, end, parameters.physics).travelledDistancePx;
  }, 0);
  return { segments, at, afterInput, selectionAt, navigationExpected, arrivalRows, residence, homeWindows, distanceAt };
}

function buildEnergy(motion, finalTick) {
  const spans = [[], []], rests = [];
  for (const source of [0, 1]) {
    let cursor = 1, stamina = parameters.physics.staminaCapacityTicks, away = 0, recovered = 0;
    const phases = [];
    for (const home of motion.homeWindows[source]) {
      if (cursor < home.firstTick) phases.push({ firstTick: cursor, lastTick: home.firstTick - 1, mode: 'away' });
      phases.push({ ...home, mode: 'home' }); cursor = home.lastTick + 1;
    }
    if (cursor <= finalTick) phases.push({ firstTick: cursor, lastTick: finalTick, mode: 'away' });
    for (const phase of phases) {
      // Flying and field residence have the same debit; "away" is an accounting span.
      const result = staminaSpan(stamina, phase.mode === 'home' ? 'home' : 'flying', phase.lastTick - phase.firstTick + 1, parameters.physics);
      const row = { ...phase, startStamina: stamina, awayBefore: away, recoveredBefore: recovered };
      spans[source].push(row);
      if (result.fullAtOffset !== null) rests.push({ source, tick: phase.firstTick + result.fullAtOffset - 1 });
      stamina = result.stamina; away += result.awayDebit; recovered += result.recoveryCredit;
    }
  }
  rests.sort((a, b) => a.tick - b.tick || a.source - b.source); rests.forEach((row, i) => { row.id = i + 1; });
  const at = (source, tick) => {
    if (tick === 0) return { staminaTicks: parameters.physics.staminaCapacityTicks, awayTicks: 0, recoveredTicks: 0 };
    const span = spans[source].find(row => row.firstTick <= tick && tick <= row.lastTick);
    if (!span) throw new Error('Energy query outside actual horizon');
    const result = staminaSpan(span.startStamina, span.mode === 'home' ? 'home' : 'flying', tick - span.firstTick + 1, parameters.physics);
    return { staminaTicks: result.stamina, awayTicks: span.awayBefore + result.awayDebit, recoveredTicks: span.recoveredBefore + result.recoveryCredit };
  };
  return { spans, rests, at };
}

// Each field is solved from inclusive integer residence windows and its DAG.
// Prefix C(t) is a count of eligible group-intervals, not a tickwise work accumulator.
function buildWork(motion, level, finalTick) {
  const solved = new Map(), visiting = new Set();
  function solve(field) {
    if (solved.has(field.id)) return solved.get(field.id);
    if (visiting.has(field.id)) throw new Error('Cyclic public field prerequisites'); visiting.add(field.id);
    const predecessors = field.prerequisites.map(id => {
      const dependency = level.fields.find(row => row.id === id); if (!dependency) throw new Error('Unknown prerequisite'); return solve(dependency);
    });
    const unlockedAtTick = predecessors.some(row => row.completedAtTick === null) ? null : Math.max(0, ...predecessors.map(row => row.completedAtTick));
    const windows = [0, 1].map(source => unlockedAtTick === null ? [] : motion.residence[source].filter(row => row.fieldId === field.id).map(row => ({
      firstTick: Math.max(row.firstTick, field.openTick + 1, unlockedAtTick + 1), lastTick: Math.min(row.lastTick, field.closeTick, finalTick)
    })).filter(row => row.firstTick <= row.lastTick));
    const potentialAt = tick => windows.reduce((sum, spans) => sum + intervalCount(spans, tick), 0);
    let completedAtTick = null;
    if (potentialAt(finalTick) >= field.requiredWorkTicks) {
      let lo = 1, hi = finalTick;
      while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (potentialAt(mid) >= field.requiredWorkTicks) hi = mid; else lo = mid + 1; }
      completedAtTick = lo;
    }
    const eligibleAt = (source, tick) => windows[source].some(row => row.firstTick <= tick && tick <= row.lastTick);
    const creditAt = (source, tick) => {
      if (!eligibleAt(source, tick) || completedAtTick !== null && tick > completedAtTick) return 0;
      const before = potentialAt(tick - 1), earlier = source === 1 && eligibleAt(0, tick) ? 1 : 0;
      return before + earlier < field.requiredWorkTicks ? 1 : 0;
    };
    const contributionsAt = tick => [0, 1].map(source => {
      if (completedAtTick === null || tick < completedAtTick) return intervalCount(windows[source], tick);
      return intervalCount(windows[source], completedAtTick - 1) + creditAt(source, completedAtTick);
    });
    const lastWorkAt = (source, tick) => {
      if (completedAtTick !== null && tick >= completedAtTick && creditAt(source, completedAtTick)) return completedAtTick;
      return lastEligibleTick(windows[source], completedAtTick === null ? tick : Math.min(tick, completedAtTick - 1));
    };
    const result = { field, windows, unlockedAtTick, completedAtTick, potentialAt, eligibleAt, creditAt, contributionsAt, lastWorkAt };
    solved.set(field.id, result); visiting.delete(field.id); return result;
  }
  const rows = level.fields.map(solve);
  const fieldsAt = tick => rows.map((row, index) => {
    const contributions = row.contributionsAt(tick), completed = row.completedAtTick !== null && row.completedAtTick <= tick;
    const unlocked = row.unlockedAtTick !== null && row.unlockedAtTick <= tick;
    return { ...row.field, index, workTicks: contributions[0] + contributions[1], contributions, completed,
      completedAtTick: completed ? row.completedAtTick : null, unlocked, unlockedAtTick: unlocked ? row.unlockedAtTick : null,
      bloomPhase: tick < row.field.openTick ? 'unopened' : tick < row.field.closeTick ? 'open' : 'closed' };
  });
  return { rows, solved, fieldsAt };
}

function deriveStates(motion, energy, work, level, finalTick) {
  const states = new Map(); let firstTerminal = null;
  for (let tick = 0; tick <= finalTick; tick++) {
    const fields = work.fieldsAt(tick), swarms = SWARMS.map((id, source) => {
      const moving = motion.at(source, tick), resource = energy.at(source, tick), contributions = work.rows.map(row => row.contributionsAt(tick)[source]);
      const lastWorks = work.rows.map(row => row.lastWorkAt(source, tick)).filter(value => value !== null);
      const homeTicks = directHomeTicks(moving, parameters.hive, parameters.physics, moving.mode);
      return { id, index: source, beeCount: parameters.physics.beesPerSwarm, ...moving, ...resource,
        staminaCapacityTicks: parameters.physics.staminaCapacityTicks, remainingAwaySeconds: resource.staminaTicks / 60,
        cumulativeDistancePx: motion.distanceAt(source, tick), workTicks: contributions.reduce((a, b) => a + b, 0), contributions,
        lastArrivalTick: motion.arrivalRows.filter(row => row.source === source && row.arrivalTick <= tick).at(-1)?.arrivalTick ?? null,
        lastWorkTick: lastWorks.length ? Math.max(...lastWorks) : null, directHomeTicks: homeTicks, homeReserveTicks: resource.staminaTicks - homeTicks,
        workedLastInterval: tick > 0 && work.rows.some(row => row.creditAt(source, tick) > 0) };
    });
    const counts = Object.fromEntries(['home', 'flying', 'field'].map(mode => [mode, swarms.filter(row => row.mode === mode).length]));
    const totalCreditedWorkTicks = fields.reduce((sum, row) => sum + row.workTicks, 0), totalSwarmWorkTicks = swarms.reduce((sum, row) => sum + row.workTicks, 0);
    const inventory = { swarmCount: 2, totalBees: 12, homeIds: swarms.filter(row => row.mode === 'home').map(row => row.id),
      flyingIds: swarms.filter(row => row.mode === 'flying').map(row => row.id), fieldIds: swarms.filter(row => row.mode === 'field').map(row => row.id),
      idsExactlyOnce: true, counts, bees: Object.fromEntries(Object.entries(counts).map(([mode, count]) => [mode, count * 6])), totalCreditedWorkTicks, totalSwarmWorkTicks, errorWorkTicks: totalCreditedWorkTicks - totalSwarmWorkTicks };
    const facts = [];
    for (const swarm of swarms.filter(row => row.mode !== 'home' && row.staminaTicks === 0)) facts.push({ kind: 'exhausted', fromTick: tick - 1, tick,
      swarmId: swarm.id, fieldId: null, actualValue: 0, limitValue: 0, unit: 'stamina-ticks' });
    for (const field of fields.filter(row => !row.completed && tick >= row.closeTick)) facts.push({ kind: 'missed-bloom', fromTick: tick - 1, tick,
      swarmId: null, fieldId: field.id, actualValue: field.workTicks, limitValue: field.requiredWorkTicks, unit: 'work-ticks' });
    if (tick >= level.deadlineTick) facts.push({ kind: 'deadline', fromTick: tick - 1, tick, swarmId: null, fieldId: null, actualValue: tick, limitValue: level.deadlineTick, unit: 'ticks' });
    const phase = facts.length ? 'lost' : fields.every(row => row.completed) && swarms.every(row => row.mode === 'home') ? 'won' : 'playing';
    const score = phase === 'won' ? 1000 + 2 * Math.floor((level.deadlineTick - tick) / 60) : 0;
    const state = { tick, swarms, fields, inventory, phase, lostReason: facts[0]?.kind || null, failures: facts, score };
    states.set(tick, state); if (phase !== 'playing' && firstTerminal === null) firstTerminal = { tick, phase, reason: state.lostReason, score };
  }
  return { states, firstTerminal };
}

const inputSnapshot = swarm => Object.fromEntries(['mode', 'x', 'y', 'assignment', 'fieldId', 'staminaTicks', 'flight'].map(key => [key, copy(swarm[key])]));
function rejection(key, before, field) {
  if (key === 'b') return before.mode === 'home' ? 'already-home' : before.mode === 'flying' && before.assignment === 'hive' ? 'already-returning' : null;
  if (field.completed) return 'field-complete';
  if (before.mode === 'home' && before.staminaTicks === 0) return 'rest-required';
  return before.assignment === field.id && ['field', 'flying'].includes(before.mode) ? 'same-destination' : null;
}

function buildReceipts(finalModel, motion, energy, work, derived, level, label) {
  const histories = Object.fromEntries(RECEIPTS.map(name => [name, []])); histories.navigationReceipts = motion.navigationExpected;
  for (const command of finalModel.commandReceipts) {
    const source = SWARMS.indexOf(command.swarmId), before = derived.states.get(command.fromTick).swarms[source], after = { ...motion.afterInput(source, command.tick), staminaTicks: before.staminaTicks };
    const field = derived.states.get(command.fromTick).fields[motion.selectionAt(command.tick).fieldCursor];
    exact(rejection(command.key, before, field), null, label + '.accepted command legal@' + command.tick);
    histories.commandReceipts.push({ id: histories.commandReceipts.length + 1, fromTick: command.tick - 1, tick: command.tick, key: command.key,
      action: command.key === 'b' ? 'recall' : before.mode === 'flying' ? 'retarget' : 'dispatch', swarmId: SWARMS[source], destinationId: after.assignment,
      before: inputSnapshot(before), after: inputSnapshot(after), flightId: after.flight.id });
  }
  for (const receipt of finalModel.blockedReceipts) {
    const selection = motion.selectionAt(receipt.tick), source = selection.swarmCursor, previous = derived.states.get(receipt.fromTick), before = previous.swarms[source], field = previous.fields[selection.fieldCursor];
    exact(['a', 'b'].includes(receipt.key), true, label + '.blocked key');
    const reason = rejection(receipt.key, before, field); exact(reason !== null, true, label + '.blocked command has actual cause');
    histories.blockedReceipts.push({ id: histories.blockedReceipts.length + 1, fromTick: receipt.tick - 1, tick: receipt.tick, key: receipt.key, swarmId: SWARMS[source],
      fieldId: receipt.key === 'a' ? field.id : null, reason, before: inputSnapshot(before), after: inputSnapshot(before) });
  }
  histories.arrivalReceipts = motion.arrivalRows.map(row => ({ id: row.arrivalId, fromTick: row.arrivalTick - 1, tick: row.arrivalTick, swarmId: SWARMS[row.source],
    flight: flightAt(row.flight, row.arrivalTick, parameters.physics).flight, position: { x: row.flight.destination.x, y: row.flight.destination.y },
    destinationId: row.flight.destination.id, modeAfter: row.flight.destination.id === 'hive' ? 'home' : 'field', staminaTicks: energy.at(row.source, row.arrivalTick).staminaTicks }));
  const completions = work.rows.filter(row => row.completedAtTick !== null).sort((a, b) => a.completedAtTick - b.completedAtTick || level.fields.indexOf(a.field) - level.fields.indexOf(b.field));
  histories.completionReceipts = completions.map((row, i) => ({ id: i + 1, fromTick: row.completedAtTick - 1, tick: row.completedAtTick, fieldId: row.field.id,
    workBefore: row.contributionsAt(row.completedAtTick - 1).reduce((a, b) => a + b, 0), workAfter: row.field.requiredWorkTicks,
    requiredWorkTicks: row.field.requiredWorkTicks, contributions: row.contributionsAt(row.completedAtTick) }));
  const unlocks = work.rows.filter(row => row.unlockedAtTick !== null && row.unlockedAtTick > 0).sort((a, b) => a.unlockedAtTick - b.unlockedAtTick || level.fields.indexOf(a.field) - level.fields.indexOf(b.field));
  histories.unlockReceipts = unlocks.map((row, i) => ({ id: i + 1, fromTick: row.unlockedAtTick - 1, tick: row.unlockedAtTick, fieldId: row.field.id,
    prerequisites: row.field.prerequisites.map(id => ({ fieldId: id, completedAtTick: work.solved.get(id).completedAtTick })) }));
  histories.restCompleteReceipts = energy.rests.map(row => ({ id: row.id, fromTick: row.tick - 1, tick: row.tick, swarmId: SWARMS[row.source],
    beforeStamina: energy.at(row.source, row.tick - 1).staminaTicks, afterStamina: parameters.physics.staminaCapacityTicks }));
  const types = { navigationReceipts: ['navigate', 'navigationId', 0], commandReceipts: ['command', 'commandId', 1], blockedReceipts: ['blocked', 'blockedId', 1],
    arrivalReceipts: ['arrival', 'arrivalId', 2], completionReceipts: ['complete', 'completionId', 3], unlockReceipts: ['unlock', 'unlockId', 4], restCompleteReceipts: ['rest-complete', 'restCompleteId', 5] };
  const chronological = RECEIPTS.flatMap(name => histories[name].map(receipt => ({ name, receipt, spec: types[name] })))
    .sort((a, b) => a.receipt.tick - b.receipt.tick || a.spec[2] - b.spec[2] || a.receipt.id - b.receipt.id);
  const events = new Map(), lastEvents = new Map(), eventCounts = new Map(); let eventCount = 0, lastEvent = null;
  for (let tick = 0; tick <= finalModel.tick; tick++) {
    const current = [];
    for (const { receipt, spec } of chronological.filter(row => row.receipt.tick === tick)) {
      const event = { id: ++eventCount, type: spec[0], fromTick: tick - 1, tick, [spec[1]]: receipt.id }; receipt.eventSeq = event.id; current.push(event);
    }
    const state = derived.states.get(tick);
    if (state.phase !== 'playing') current.push({ id: ++eventCount, type: state.phase === 'won' ? 'win' : 'loss', fromTick: tick - 1, tick,
      ...(state.phase === 'won' ? { score: state.score } : { reason: state.lostReason }) });
    if (current.length) lastEvent = current.at(-1);
    events.set(tick, current); lastEvents.set(tick, lastEvent); eventCounts.set(tick, eventCount);
  }
  for (const name of RECEIPTS) compare(finalModel[name], histories[name], label + '.independent ' + name);
  return { histories, events, lastEvents, eventCounts };
}

function intervalAt(tick, motion, energy, work, derived, receipts) {
  const before = derived.states.get(tick - 1), after = derived.states.get(tick), credits = SWARMS.map((_, source) => work.rows.reduce((sum, row) => sum + row.creditAt(source, tick), 0));
  const inputModes = SWARMS.map((_, source) => motion.afterInput(source, tick));
  const groups = SWARMS.map((swarmId, source) => {
    const pre = inputModes[source], post = after.swarms[source], prior = before.swarms[source];
    let workInfo;
    if (pre.mode !== 'field') workInfo = { fieldId: null, eligible: false, reason: pre.mode, fieldWorkBefore: null, fieldWorkAfter: null, credit: 0 };
    else {
      const field = before.fields.find(row => row.id === pre.fieldId), earlier = source === 1 && inputModes[0].mode === 'field' && inputModes[0].fieldId === pre.fieldId ? credits[0] : 0;
      const priorWork = field.workTicks + earlier;
      const reason = field.completed ? 'field-complete' : !field.unlocked ? 'locked' : tick - 1 < field.openTick ? 'unopened' : tick - 1 >= field.closeTick ? 'closed' : credits[source] === 0 ? 'demand-filled' : 'credited';
      workInfo = { fieldId: field.id, eligible: ['demand-filled', 'credited'].includes(reason), reason, fieldWorkBefore: priorWork, fieldWorkAfter: priorWork + credits[source], credit: credits[source] };
    }
    return { swarmId, modeAfterInput: pre.mode, assignmentAfterInput: pre.assignment,
      positionBefore: { x: pre.x, y: pre.y }, positionAfter: { x: post.x, y: post.y }, flightBefore: pre.flight, flightAfter: post.flight,
      staminaBefore: prior.staminaTicks, staminaAfter: post.staminaTicks, awayDebit: post.awayTicks - prior.awayTicks, recoveryCredit: post.recoveredTicks - prior.recoveredTicks,
      movedDistancePx: Math.hypot(post.x - pre.x, post.y - pre.y), arrivalId: motion.arrivalRows.find(row => row.source === source && row.arrivalTick === tick)?.arrivalId ?? null, work: workInfo };
  });
  const links = { commandIds: 'commandReceipts', blockedIds: 'blockedReceipts', navigationIds: 'navigationReceipts', arrivalIds: 'arrivalReceipts',
    completionIds: 'completionReceipts', unlockIds: 'unlockReceipts', restCompleteIds: 'restCompleteReceipts' };
  return { fromTick: tick - 1, tick, seconds: 1 / 60, completedAtStart: before.fields.filter(row => row.completed).map(row => row.id),
    ...Object.fromEntries(Object.entries(links).map(([key, name]) => [key, receipts.histories[name].filter(row => row.tick === tick).map(row => row.id)])),
    groups, inventoryBefore: before.inventory, inventoryAfter: after.inventory, failures: after.failures,
    terminal: after.phase === 'playing' ? null : { phase: after.phase, reason: after.lostReason } };
}

function deriveRound(finalModel, level, label) {
  const motion = buildMotion(finalModel, level, label), energy = buildEnergy(motion, finalModel.tick), work = buildWork(motion, level, finalModel.tick);
  const derived = deriveStates(motion, energy, work, level, finalModel.tick);
  exact(derived.firstTerminal?.tick, finalModel.tick, label + '.first terminal is actual final tick');
  const receipts = buildReceipts(finalModel, motion, energy, work, derived, level, label), intervals = new Map();
  for (let tick = 1; tick <= finalModel.tick; tick++) {
    const interval = intervalAt(tick, motion, energy, work, derived, receipts); intervals.set(tick, interval);
    for (const group of interval.groups) if (group.modeAfterInput !== 'home') {
      exact(group.staminaBefore >= 1, true, label + '.no nonhome interval continues after exhaustion@' + tick + '.' + group.swarmId);
      exact(group.awayDebit, 1, label + '.one actual away debit@' + tick + '.' + group.swarmId);
    }
  }
  return { motion, energy, work, derived, receipts, intervals };
}

function expandFrame(raw, index, label) {
  exact(Number.isSafeInteger(index) && index >= 0 && index < raw.frames.length, true, label + '.index domain');
  const frame = raw.frames[index]; if (!frame) throw new Error('Missing actual frame');
  exact(frame.tick, index, label + '.frame tick'); exact(frame.state.model.tick, index, label + '.model tick');
  exact(Object.keys(frame.receiptPrefixLengths).sort(), RECEIPTS.slice().sort(), label + '.seven prefix fields');
  const restored = {};
  for (const name of RECEIPTS) {
    exact(Object.hasOwn(frame.state.model, name), false, label + '.bank-only field.' + name);
    const count = frame.receiptPrefixLengths[name], bank = raw.actualReceipts[name];
    exact(Number.isSafeInteger(count) && count >= 0 && count <= bank.length, true, label + '.prefix domain.' + name);
    exact(count, bank.filter(row => row.tick <= index).length, label + '.prefix actual chronology.' + name); restored[name] = bank.slice(0, count);
  }
  return { ...frame.state, model: { ...frame.state.model, ...restored } };
}

function checkSnapshot(wrapper, audit, level, tick, seed, label) {
  const m = wrapper.model, state = audit.derived.states.get(tick), selection = audit.motion.selectionAt(tick), histories = audit.receipts.histories;
  const commands = histories.commandReceipts.filter(row => row.tick <= tick);
  const expected = { width: 960, height: 540, seed, difficulty: level.difficulty, level: level.difficulty + 1, levelName: level.name, levelNameEn: level.nameEn,
    phase: state.phase, tick, elapsed: tick / 60, deadlineTick: level.deadlineTick, remaining: Math.max(0, (level.deadlineTick - tick) / 60), score: state.score,
    lostReason: state.lostReason, failures: state.failures, physics: parameters.physics, hive: parameters.hive,
    swarmCursor: selection.swarmCursor, fieldCursor: selection.fieldCursor, swarms: state.swarms, fields: state.fields, inventory: state.inventory,
    commandCount: commands.length, flightCount: commands.length, blockedCommands: histories.blockedReceipts.filter(row => row.tick <= tick).length,
    navigationCount: histories.navigationReceipts.filter(row => row.tick <= tick).length, eventCount: audit.receipts.eventCounts.get(tick), events: audit.receipts.events.get(tick),
    lastEvent: audit.receipts.lastEvents.get(tick), lastOperation: commands.at(-1) || null };
  for (const [key, value] of Object.entries(expected)) compare(m[key], value, label + '.' + key);
  exact(m.physics, parameters.physics, label + '.immutable published physics');
  exact(m.hive, parameters.hive, label + '.immutable hive');
  level.fields.forEach((field, i) => exact(Object.fromEntries(Object.keys(field).map(key => [key, m.fields[i][key]])), field, label + '.immutable field[' + i + ']'));
  exact(wrapper.phase, state.phase, label + '.wrapper phase'); exact(wrapper.paused, false, label + '.unpaused ordinary observation');
  exact(wrapper.level, level.difficulty, label + '.wrapper level'); exact(wrapper.difficulty, level.difficulty, label + '.wrapper difficulty'); exact(wrapper.score, state.score, label + '.wrapper score');
  for (const name of RECEIPTS) compare(m[name], histories[name].filter(row => row.tick <= tick), label + '.full history prefix.' + name);
  if (tick) compare(m.lastInterval, audit.intervals.get(tick), label + '.entire interval');
  else { exact(m.lastInterval, null, label + '.initial interval'); exact(m.lastInput, null, label + '.initial input'); }
}

function keyTimeline(raw, label) {
  let previous = [], previousTick = -1;
  for (const [i, row] of raw.inputChanges.entries()) {
    const basis = label + '.inputChanges[' + i + ']';
    exact(Number.isSafeInteger(row.tick) && row.tick > previousTick && row.tick < raw.final.model.tick, true, basis + '.chronological actual change');
    exact(row.elapsed, row.tick / 60, basis + '.elapsed'); exact(row.from, previous, basis + '.previous held keys');
    exact(new Set(row.to).size, row.to.length, basis + '.no duplicate keys');
    exact(row.to.every(key => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'b'].includes(key)), true, basis + '.ordinary held-key domain');
    previous = row.to; previousTick = row.tick;
  }
  return tick => raw.inputChanges.findLast(row => row.tick <= tick)?.to || [];
}

function checkInputObservations(raw, audit, keysAt, level, label) {
  const normalizedAxis = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
  for (let tick = 1; tick <= raw.final.model.tick; tick++) {
    const supplied = raw.intervalTrace[tick - 1].input, before = raw.frames[tick - 1].state.model, after = raw.frames[tick].state.model, last = after.lastInput;
    const basis = label + '.actual input@' + tick, keys = keysAt(tick - 1), x = normalizedAxis(supplied.x), y = normalizedAxis(supplied.y);
    exact(supplied.x, Number(keys.includes('ArrowRight')) - Number(keys.includes('ArrowLeft')), basis + '.real horizontal held keys');
    exact(supplied.y, Number(keys.includes('ArrowDown')) - Number(keys.includes('ArrowUp')), basis + '.real vertical held keys');
    exact(!!(supplied.a || supplied.aPressed), keys.includes('Space'), basis + '.real A'); exact(!!(supplied.b || supplied.bPressed), keys.includes('b'), basis + '.real B');
    const epoch = Number.isSafeInteger(supplied.cancelEpoch) && supplied.cancelEpoch >= 0 ? supplied.cancelEpoch : before.inputState.cancelEpoch;
    const cancelled = supplied.cancelled === true || epoch !== before.inputState.cancelEpoch;
    exact(last.sample, { x, y, aDown: !!(supplied.a || supplied.aPressed), bDown: !!(supplied.b || supplied.bPressed), cancelEpoch: epoch, cancelled: supplied.cancelled === true }, basis + '.normalized sample');
    exact(last.fromTick, tick - 1, basis + '.fromTick'); exact(last.tick, tick, basis + '.tick'); exact(last.cancelled, cancelled, basis + '.cancelled');
    exact(last.before, before.inputState, basis + '.actual input-state before'); exact(last.after, after.inputState, basis + '.actual input-state after');
    exact(last.quarantinedBefore, before.inputState.quarantined, basis + '.quarantined before'); exact(last.quarantinedAfter, after.inputState.quarantined, basis + '.quarantined after');
    const accepted = audit.receipts.histories.commandReceipts.filter(row => row.tick === tick), blocked = audit.receipts.histories.blockedReceipts.filter(row => row.tick === tick);
    const moves = audit.receipts.histories.navigationReceipts.filter(row => row.tick === tick), actions = [...accepted, ...blocked];
    exact(last.commandIds, accepted.map(row => row.id), basis + '.command links'); exact(last.blockedIds, blocked.map(row => row.id), basis + '.blocked links'); exact(last.navigationIds, moves.map(row => row.id), basis + '.movement links');
    if (cancelled || before.inputState.quarantined) exact(actions.length + moves.length, 0, basis + '.no cancelled/quarantined action');
    if (last.freshB) { exact(actions.map(row => row.key), ['b'], basis + '.B processed even if rejected'); exact(moves.length, 0, basis + '.B suppresses navigation'); exact(last.navigationAttempt, null, basis + '.no B-suppressed attempt'); }
    for (const action of actions) exact(action.key === 'a' ? last.sample.aDown && last.freshA && !last.freshB : last.sample.bDown && last.freshB, true, basis + '.real fresh sample supports action');
    if (last.navigationAttempt) {
      const direction = Math.abs(x) <= 0.45 && Math.abs(y) <= 0.45 ? null : Math.abs(x) >= Math.abs(y) ? x < 0 ? 'left' : 'right' : y < 0 ? 'up' : 'down';
      const attempt = last.navigationAttempt, axis = ['left', 'right'].includes(direction) ? 'field' : 'swarm';
      const old = audit.motion.selectionAt(tick - 1), beforeIndex = axis === 'field' ? old.fieldCursor : old.swarmCursor;
      const afterIndex = Math.max(0, Math.min(axis === 'field' ? level.fields.length - 1 : 1, beforeIndex + (['left', 'up'].includes(direction) ? -1 : 1)));
      exact(direction !== null, true, basis + '.nonneutral axis'); exact(attempt.direction, direction, basis + '.dominant axis with horizontal tie'); exact(attempt.axis, axis, basis + '.selection axis');
      exact(attempt.beforeIndex, beforeIndex, basis + '.attempt before'); exact(attempt.afterIndex, afterIndex, basis + '.clamped attempt after'); exact(moves.length, Number(beforeIndex !== afterIndex), basis + '.move or clamped attempt');
      if (moves.length) exact(attempt, Object.fromEntries(['direction', 'heldTicks', 'mode', 'axis', 'beforeIndex', 'afterIndex'].map(key => [key, moves[0][key]])), basis + '.attempt receipt');
    } else exact(moves.length, 0, basis + '.no movement without actual attempt');
  }
}

function checkReferences(raw, audit, keysAt, label) {
  const finalTick = raw.final.model.tick, actualEventTicks = [];
  for (const [i, row] of raw.eventTransitions.entries()) {
    const tick = row.tick, basis = label + '.eventTransitions[' + i + ']'; actualEventTicks.push(tick);
    exact(row.beforeFrameIndex, tick - 1, basis + '.before frame'); exact(row.afterFrameIndex, tick, basis + '.after frame');
    exact(row.events, raw.frames[tick].state.model.events, basis + '.actual events'); exact(row.actualLastInterval, raw.frames[tick].state.model.lastInterval, basis + '.actual detached interval');
    exact(row.input, raw.intervalTrace[tick - 1].input, basis + '.same actual input');
    exact(row.eventCountBefore, audit.receipts.eventCounts.get(tick - 1), basis + '.event count before'); exact(row.eventCountAfter, audit.receipts.eventCounts.get(tick), basis + '.event count after');
  }
  exact(actualEventTicks, [...audit.receipts.events].filter(([, events]) => events.length).map(([tick]) => tick), label + '.all and only actual event windows');
  const operationKeys = [];
  for (const [i, row] of raw.operations.entries()) {
    const receipt = row.receipt, basis = label + '.operations[' + i + ']';
    exact(RECEIPTS.includes(row.kind), true, basis + '.known receipt bank'); exact(row.beforeFrameIndex, receipt.tick - 1, basis + '.before frame'); exact(row.afterFrameIndex, receipt.tick, basis + '.after frame');
    exact(row.observedAt, receipt.tick / 60, basis + '.observedAt'); exact(receipt, raw.actualReceipts[row.kind][receipt.id - 1], basis + '.original receipt'); operationKeys.push(row.kind + ':' + receipt.id);
  }
  exact(operationKeys.sort(), RECEIPTS.flatMap(name => audit.receipts.histories[name].map(row => name + ':' + row.id)).sort(), label + '.all permanent receipts observed exactly once');
  for (const [i, row] of raw.retained.entries()) {
    exact(Number.isSafeInteger(row.frameIndex) && row.frameIndex >= 0 && row.frameIndex <= finalTick, true, label + '.retained[' + i + '].frame domain'); exact(row.seconds, row.frameIndex / 60, label + '.retained[' + i + '].seconds');
  }
  const fields = ['tick', 'keys', 'phase', 'swarmCursor', 'fieldCursor', 'swarmModes', 'assignments', 'positions', 'staminaTicks', 'flightProgress', 'fieldWorkTicks', 'completedFieldIds', 'unlockedFieldIds', 'bloomPhases', 'commandCount', 'blockedCommands', 'navigationCount', 'flightCount', 'totalWorkTicks', 'eventCount'];
  let previousTick = -1;
  for (const [i, row] of raw.compactTrace.entries()) {
    const tick = row.tick, state = audit.derived.states.get(tick), select = audit.motion.selectionAt(tick), basis = label + '.compactTrace[' + i + ']';
    exact(Number.isSafeInteger(tick) && tick > previousTick && tick <= finalTick, true, basis + '.chronological sample'); previousTick = tick;
    exact(Object.keys(row).sort(), fields.slice().sort(), basis + '.all twenty observed fields');
    const commandCount = audit.receipts.histories.commandReceipts.filter(receipt => receipt.tick <= tick).length;
    compare(row, { tick, keys: keysAt(tick), phase: state.phase, swarmCursor: select.swarmCursor, fieldCursor: select.fieldCursor,
      swarmModes: state.swarms.map(swarm => swarm.mode), assignments: state.swarms.map(swarm => swarm.assignment), positions: state.swarms.map(({ x, y }) => ({ x, y })),
      staminaTicks: state.swarms.map(swarm => swarm.staminaTicks), flightProgress: state.swarms.map(swarm => swarm.flight === null ? null : { id: swarm.flight.id, ageTicks: swarm.flight.ageTicks, durationTicks: swarm.flight.durationTicks }),
      fieldWorkTicks: state.fields.map(field => field.workTicks), completedFieldIds: state.fields.filter(field => field.completed).map(field => field.id),
      unlockedFieldIds: state.fields.filter(field => field.unlocked).map(field => field.id), bloomPhases: state.fields.map(field => field.bloomPhase), commandCount, flightCount: commandCount,
      blockedCommands: audit.receipts.histories.blockedReceipts.filter(receipt => receipt.tick <= tick).length, navigationCount: audit.receipts.histories.navigationReceipts.filter(receipt => receipt.tick <= tick).length,
      totalWorkTicks: state.inventory.totalCreditedWorkTicks, eventCount: audit.receipts.eventCounts.get(tick) }, basis);
  }
  return fields;
}

function reviewRound(raw, entry) {
  const label = entry.name, assertionStart = assertions, failureStart = failureCount, finalTick = raw.final.model.tick;
  const level = parameters.levels.find(row => row.difficulty === raw.initial.model.difficulty);
  exact(Object.hasOwn(raw, 'pilotDiagnostics'), false, label + '.no planner diagnostics'); exact(entry.removedPaths, ['pilotDiagnostics'], label + '.projection scope');
  exact(raw.name, label, label + '.name'); exact(raw.initial.model.level, Number(/^level([1-3])-/.exec(label)[1]), label + '.named level');
  exact(raw.difficulty, level.difficulty, label + '.difficulty'); exact(raw.mode, label.endsWith('-record') ? 'record' : 'loss', label + '.mode');
  exact(entry.sourceHashes.contract, CONTRACT_HASH, label + '.actual run contract'); exact(raw.initial.model.tick, 0, label + '.initial tick');
  exact(raw.actualFixedTicks, finalTick, label + '.actual fixed ticks'); exact(entry.actualFixedTicks, finalTick, label + '.index fixed ticks');
  exact(raw.final.model.phase, raw.mode === 'record' ? 'won' : 'lost', label + '.requested actual outcome');
  exact(raw.frames.length, finalTick + 1, label + '.every actual committed frame'); exact(raw.intervalTrace.length, finalTick, label + '.every actual interval');
  for (const [key, value] of Object.entries({ version: 1, frameIndexBase: 0, frameIndexEqualsTick: true, receiptFields: RECEIPTS })) exact(raw.evidenceEncoding[key], value, label + '.encoding.' + key);
  exact(Object.keys(raw.actualReceipts).sort(), RECEIPTS.slice().sort(), label + '.seven receipt banks');
  for (const name of RECEIPTS) exact(raw.actualReceipts[name], raw.final.model[name], label + '.actual final bank.' + name);
  exact(raw.initial, expandFrame(raw, 0, label + '.initial expansion'), label + '.lossless initial'); exact(raw.final, expandFrame(raw, finalTick, label + '.final expansion'), label + '.lossless final');
  const seed = raw.initial.model.seed; exact(Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff, true, label + '.normalized seed metadata');
  exact(raw.initial.model.inputState, { cancelEpoch: 0, quarantined: false, aArmed: true, bArmed: true, navigationDirection: null, navigationHeldTicks: 0 }, label + '.initial input latches');
  const audit = deriveRound(raw.final.model, level, label), keysAt = keyTimeline(raw, label);
  checkSnapshot(raw.initial, audit, level, 0, seed, label + '.initial'); checkSnapshot(raw.final, audit, level, finalTick, seed, label + '.final');
  for (let tick = 0; tick <= finalTick; tick++) {
    const frame = expandFrame(raw, tick, label + '.frame[' + tick + ']'); checkSnapshot(frame, audit, level, tick, seed, label + '.frame[' + tick + ']');
    if (tick) {
      const { input, beforeFrameIndex, afterFrameIndex, ...interval } = raw.intervalTrace[tick - 1];
      exact(beforeFrameIndex, tick - 1, label + '.interval@' + tick + '.before reference'); exact(afterFrameIndex, tick, label + '.interval@' + tick + '.after reference');
      exact(interval, frame.model.lastInterval, label + '.interval@' + tick + '.actual detached interval');
    }
  }
  checkInputObservations(raw, audit, keysAt, level, label); const compactFields = checkReferences(raw, audit, keysAt, label);
  const final = audit.derived.states.get(finalTick), segments = audit.motion.segments.flat(), intervals = [...audit.intervals.values()];
  const groups = intervals.flatMap(interval => interval.groups.map(group => ({ tick: interval.tick, ...group })));
  const homeArrivals = audit.receipts.histories.arrivalReceipts.filter(row => row.destinationId === 'hive');
  const departuresAfterRecovery = audit.receipts.histories.commandReceipts.filter(row => row.key === 'a' && row.before.mode === 'home' && audit.energy.at(SWARMS.indexOf(row.swarmId), row.fromTick).recoveredTicks > 0);
  const totalRecovered = final.swarms.reduce((sum, row) => sum + row.recoveredTicks, 0), totalAway = final.swarms.reduce((sum, row) => sum + row.awayTicks, 0);
  const requirement = level.fields.reduce((sum, row) => sum + row.requiredWorkTicks, 0), initialStamina = 2 * parameters.physics.staminaCapacityTicks;
  if (level.difficulty === 2 && final.phase === 'won') {
    exact(requirement, 3960, label + '.published L3 group-work requirement'); exact(requirement > initialStamina, true, label + '.work exceeds initial endurance');
    exact(totalRecovered >= requirement - initialStamina && departuresAfterRecovery.length > 0, true, label + '.actual necessary recovery and subsequent departure');
  }
  const snapMargins = segments.map(row => Math.abs(Math.abs(row.flight.rawLengthPx - 3 * Math.round(row.flight.rawLengthPx / 3)) - parameters.physics.flightLengthSnapTolerancePixels));
  return { name: label, level: level.difficulty + 1, passed: failureCount === failureStart, assertions: assertions - assertionStart,
    projectionSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, originalReportSha256: entry.originalReportSha256, sourceHashes: entry.sourceHashes,
    result: { tick: finalTick, elapsed: finalTick / 60, phase: final.phase, lostReason: final.lostReason, failures: final.failures, score: final.score,
      fieldWorkTicks: final.fields.map(row => row.workTicks), completedFieldIds: final.fields.filter(row => row.completed).map(row => row.id),
      swarmModes: final.swarms.map(row => row.mode), staminaTicks: final.swarms.map(row => row.staminaTicks), recoveredTicks: final.swarms.map(row => row.recoveredTicks),
      totalBees: final.inventory.totalBees, totalWorkTicks: final.inventory.totalCreditedWorkTicks },
    counts: { actualFrames: raw.frames.length, fullSnapshotChecks: raw.frames.length + 2, distinctSnapshotTicks: raw.frames.length,
      referencedSnapshotObservations: raw.retained.length + 2 * raw.eventTransitions.length + 2 * raw.operations.length, retained: raw.retained.length,
      compact: raw.compactTrace.length, intervals: finalTick, swarmPositionSamples: 2 * raw.frames.length, eventWindows: raw.eventTransitions.length,
      events: raw.final.model.eventCount, operations: raw.operations.length, inputChanges: raw.inputChanges.length, flightSegments: segments.length,
      staminaSpans: audit.energy.spans.flat().length, eligibleWorkWindows: audit.work.rows.reduce((sum, row) => sum + row.windows.flat().length, 0),
      receipts: Object.fromEntries(RECEIPTS.map(name => [name, audit.receipts.histories[name].length])) },
    coverage: { interruptedFlights: segments.filter(row => row.arrivalTick > row.lastTick).length,
      midFlightAcceptedARetargets: audit.receipts.histories.commandReceipts.filter(row => row.key === 'a' && row.before.mode === 'flying').length,
      fieldArrivalsWithoutSameIntervalWork: audit.receipts.histories.arrivalReceipts.filter(row => row.modeAfter === 'field').length,
      hiveArrivalsWithoutSameIntervalRecovery: homeArrivals.length, zeroStaminaSafeHiveArrivals: homeArrivals.filter(row => row.staminaTicks === 0).length,
      partialRestDepartures: audit.receipts.histories.commandReceipts.filter(row => row.key === 'a' && row.before.mode === 'home' && row.before.staminaTicks > 0 && row.before.staminaTicks < parameters.physics.staminaCapacityTicks).length,
      departuresAfterActualRecovery: departuresAfterRecovery.length, lockedFieldWaitingGroupIntervals: groups.filter(row => row.work.reason === 'locked').length,
      unopenedFieldWaitingGroupIntervals: groups.filter(row => row.work.reason === 'unopened').length,
      cooperativeSameFieldCreditedIntervals: intervals.filter(row => row.groups[0].work.credit > 0 && row.groups[1].work.credit > 0 && row.groups[0].work.fieldId === row.groups[1].work.fieldId).length,
      lastDemandDeniedToSecondEligibleGroupIntervals: groups.filter(row => row.work.reason === 'demand-filled').length,
      lastBloomIntervalCredits: groups.filter(row => row.work.credit > 0 && level.fields.find(field => field.id === row.work.fieldId).closeTick === row.tick).length,
      residentSuccessorWaitsOnUnlockIntervals: intervals.filter(row => row.unlockIds.length && row.groups.some(group => group.work.reason === 'locked' && audit.receipts.histories.unlockReceipts.some(receipt => receipt.tick === row.tick && receipt.fieldId === group.work.fieldId))).length,
      zeroDistanceFlights: segments.filter(row => row.flight.rawLengthPx === 0).length, snappedScheduleLengths: segments.filter(row => row.flight.rawLengthPx !== row.flight.scheduleLengthPx).length,
      failureKinds: [...new Set(final.failures.map(row => row.kind))] },
    enduranceLedger: { initialTotalStaminaTicks: initialStamina, totalAwayDebits: totalAway, totalRecoveryCredits: totalRecovered,
      remainingTotalStaminaTicks: final.swarms.reduce((sum, row) => sum + row.staminaTicks, 0), creditedGroupWorkTicks: final.inventory.totalCreditedWorkTicks, requiredGroupWorkTicks: requirement },
    geometryBoundary: { declaredScheduleSnapTolerancePx: parameters.physics.flightLengthSnapTolerancePixels, minimumDistanceFromSnapThresholdPx: snapMargins.length ? Math.min(...snapMargins) : null,
      scope: 'The declared length-normalization rule is applied before ceil. Arrival ticks and all integer gates must match exactly; coordinate comparison does not widen them.' },
    compactFieldsChecked: compactFields };
}

const [corpusArg, outputArg, approvedIndexHash] = process.argv.slice(2);
if (!corpusArg || !outputArg || !/^[a-f0-9]{64}$/.test(approvedIndexHash || '')) throw new Error('Supply public corpus, fresh output and approved index SHA256');
const corpus = path.resolve(corpusArg), output = path.resolve(outputArg), indexPath = path.join(corpus, 'index.json');
if (hash(indexPath) !== approvedIndexHash) throw new Error('Unapproved public index; no case read');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
if (index.rounds.length !== 6 || new Set(index.rounds.map(row => row.file)).size !== 6 || !index.rounds.every(row => /^level[1-3]-(record|loss)\.json$/.test(row.file) && row.file === row.name + '.json')) throw new Error('Expected six unique ordinary case basenames');
const portable = file => file.startsWith('/workspace/pureTV/') ? 'repoRelative:' + file.slice('/workspace/pureTV/'.length) : 'scratchRelative:' + path.relative('/workspace/scratch', file);
const sourceFiles = [indexPath, contractPath, ...['pollinator-flight-oracle.mjs', 'independent-pollinator-review.mjs'].map(name => path.join(app, 'tests', name)), ...index.rounds.map(row => path.join(corpus, row.file))];
const hashes = () => Object.fromEntries(sourceFiles.map(file => [portable(file), hash(file)]));
if (fs.existsSync(output)) throw new Error('Fresh output required; preserve prior evidence'); fs.mkdirSync(output, { recursive: true });
const startedAt = new Date().toISOString(), startHashes = hashes(), rounds = []; let executionError = null;
try {
  exact(hash(contractPath), CONTRACT_HASH, 'approved contract'); parameters = readParameters(fs.readFileSync(contractPath, 'utf8'));
  exact(index.originalFilesUnchanged, true, 'projection preserves original bytes');
  for (const run of index.sourceRuns) { exact(run.startHashes, run.endHashes, 'original run source window'); exact(run.startHashes.contract, CONTRACT_HASH, 'original run contract'); }
  for (const entry of index.rounds) {
    const sourceRun = index.sourceRuns.find(run => run.sha256 === entry.originalReportSha256);
    exact(entry.originalReportSha256, index.originalReportSha256, entry.name + '.original report binding');
    exact(entry.sourceHashes, sourceRun?.startHashes, entry.name + '.original source-window binding');
    const file = path.join(corpus, entry.file); exact(hash(file), entry.sha256, entry.name + '.approved public bytes');
    rounds.push(reviewRound(JSON.parse(fs.readFileSync(file, 'utf8')), entry));
  }
} catch (error) { executionError = { name: error.name, message: error.message, stack: error.stack }; }
const endHashes = hashes(), completedAt = new Date().toISOString(); exact(endHashes, startHashes, 'audit source and evidence unchanged');
const countFields = ['actualFrames', 'fullSnapshotChecks', 'distinctSnapshotTicks', 'referencedSnapshotObservations', 'retained', 'compact', 'intervals', 'swarmPositionSamples', 'eventWindows', 'events', 'operations', 'inputChanges', 'flightSegments', 'staminaSpans', 'eligibleWorkWindows'];
const report = { game: 'pollinator-contract', kind: 'independent-existing-observation-review', passed: executionError === null && failureCount === 0 && rounds.length === 6,
  startedAt, completedAt, sourceUnchanged: isDeepStrictEqual(startHashes, endHashes), startHashes, endHashes,
  source: { index: portable(indexPath), indexSha256: approvedIndexHash, originalReportSha256: index.originalReportSha256,
    runs: index.sourceRuns.map(run => ({ report: portable(run.path), sha256: run.sha256, startHashes: run.startHashes, endHashes: run.endHashes })) },
  method: 'Accepted commands define uninterrupted absolute flight segments. Position and travelled distance are evaluated directly from segment origin and age; observed coordinates do not reset predictions. Home/away spans integrate integer stamina with explicit saturation. Per-field residence windows intersect flower intervals and prerequisite completion dates; integer prefix counts and binary search find completion, with stable B1/B2 allocation of the last demand. Each observed frame is checked against these functions, not a replay of a per-tick movement/work controller.',
  numericalComparison: { coordinateDirectionAndDerivedDistanceAbsoluteTolerance: 1e-8, maximumErrors, integerGateAndReceiptTimeTolerance: 0,
    declaredScheduleLengthNormalizationPx: 1e-9, cumulativeDistanceMethod: 'Sum straight-line distance travelled on each accepted uninterrupted segment, compared with the actual accumulated per-step distances.' },
  assertions, failureCount, failureSamples: failures, failureSamplesTruncated: failureCount > failures.length, executionError,
  totals: Object.fromEntries(countFields.map(key => [key, rounds.reduce((sum, row) => sum + row.counts[key], 0)])), rounds,
  limitations: [
    'Only the six existing actual public rounds are audited. No new gameplay, Model/pilot import, private plan, author checker or witness is used.',
    'Receipt-prefix restoration recovers archived observations; it does not fill missing physical ticks. All stored physical frames and intervals are checked.',
    'Accepted/rejected commands, actual input samples, dominant-axis selection, local priority and receipt links are checked; full rearming/navigation-repeat/cancellation state machines are not independently replayed.',
    'API invalid dt, pause/retry and post-terminal freeze beyond these ordinary observations are outside this audit. Per-case counts identify encountered zero-endurance arrivals, final-demand contention and flower-boundary cases; absent cases are not claimed covered.',
    'The public 1e-9 schedule-length normalization is part of the rule. The separate 1e-8 derived-value comparison does not widen arrival, stamina, flower, dependency or terminal gates. No additional fixtures are run.'
  ] };
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, rounds: rounds.length, assertions, failureCount, executionError, totals: report.totals, maximumErrors, reportSha256: hash(path.join(output, 'report.json')) }, null, 2));
if (!report.passed) process.exitCode = 1;
