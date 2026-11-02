// Existing public transactions only: exact gear ratios, affine spans and circular-window intersections.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { readParameters, deriveSpeeds, mod, phaseAt, pointerAt, bandIndex, alignedRanges, mergeRanges, intersectRanges, holdAt, firstHoldEnd } from './clockwork-interval-oracle.mjs';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), contractPath = path.join(app, 'docs/model-contract.md');
const CONTRACT_SHA = 'bace22d315f78cb13fca1ddfad290816e66bc5acccaab95a013ea08f60bd629e';
const copy = value => structuredClone(value), sum = values => values.reduce((a, b) => a + b, 0);
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let parameters, assertions = 0, failureCount = 0; const failureSamples = [], maximumErrors = { phaseUnits: 0, velocityUnitsPerTick: 0, budgetUnits: 0, holdTicks: 0 };
function equal(actual, expected, label) {
  assertions++; if (!isDeepStrictEqual(actual, expected)) { failureCount++; if (failureSamples.length < 60) failureSamples.push({ label, actual, expected }); }
}
const contains = (ranges, tick) => ranges.some(row => row.first <= tick && tick <= row.last);

function calendar(observedActions, finalTick, transactionCount, scenario, label) {
  const u = parameters.units, m = parameters.mechanics, period = u.angleUnitsPerTurn, tolerance = u.pointerToleranceUnits;
  const trains = scenario.trains, trainIds = trains.map(train => train.id), gears = [], speeds = {}, pointers = [];
  for (const train of trains) {
    const derived = deriveSpeeds(train, m.motor.shaftSpeedUnitsPerTick); Object.assign(speeds, derived);
    const artwork = m.toothArtworkOffsetsByChain.find(row => isDeepStrictEqual(row.teeth, train.meshChain.map(id => train.gears.find(gear => gear.id === id).teeth)));
    equal(Boolean(artwork), true, label + '.published artwork row');
    for (const gear of train.gears) {
      const index = train.meshChain.indexOf(gear.id);
      equal(derived[gear.id], gear.engagedVelocityUnitsPerTick, label + '.authored velocity independently derived from teeth');
      gears.push({ id: gear.id, trainId: train.id, teeth: gear.teeth, role: gear.role, meshParentId: index ? train.meshChain[index - 1] : null,
        toothArtworkOffsetUnits: artwork.offsetUnitsInChainOrder[index] });
      if (Object.hasOwn(gear, 'targetUnits')) pointers.push({ gearId: gear.id, trainId: train.id, mountOffsetUnits: m.pointerMountOffsetUnits, targetUnits: gear.targetUnits, toleranceUnits: tolerance });
    }
  }
  equal(new Set(gears.map(gear => gear.id)).size, gears.length, label + '.unique physical gear identities');
  const initialPhases = Object.fromEntries(gears.map(gear => [gear.id, m.initialGearUnwrappedUnits]));
  let phases = copy(initialPhases), engaged = Object.fromEntries(trainIds.map(id => [id, m.initialTrainEngaged])), time = 0;
  let budget = { initial: scenario.adjustmentBudget, spent: 0, remaining: scenario.adjustmentBudget }, budgetTerminal = null;
  const spans = [], actions = [], versions = [{ transactionId: 0, engaged: copy(engaged), budget: copy(budget) }];
  const velocity = (gear, configuration) => configuration[gear.trainId] ? speeds[gear.id] : 0;
  const advanceTo = tick => {
    if (tick <= time) return;
    spans.push({ fromTick: time, toTick: tick, phases: copy(phases), engaged: copy(engaged) });
    phases = Object.fromEntries(gears.map(gear => [gear.id, phaseAt(phases[gear.id], velocity(gear, engaged), tick - time)])); time = tick;
  };
  const gearReceipt = () => gears.map(gear => ({ id: gear.id, unwrappedUnits: phases[gear.id], velocityUnitsPerTick: velocity(gear, engaged) }));
  const clutches = () => trainIds.map(trainId => ({ trainId, engaged: engaged[trainId] }));
  let previousTransaction = 0, previousBoundary = -1;
  for (const observed of observedActions) {
    const transactionId = observed.transactionId, boundaryTick = observed.boundaryTick, request = observed.request;
    equal(Number.isSafeInteger(transactionId) && transactionId > previousTransaction && transactionId <= transactionCount, true, label + '.action transaction chronology');
    equal(Number.isSafeInteger(boundaryTick) && boundaryTick > previousBoundary && boundaryTick <= finalTick, true, label + '.action boundary chronology');
    equal(budgetTerminal, null, label + '.no command after budget terminal'); previousTransaction = transactionId; previousBoundary = boundaryTick;
    equal(['toggle_selected', 'brake_all', 'conflicting_buttons'].includes(request), true, label + '.actual request domain');
    equal(trainIds.includes(observed.selectedTrainBefore) && trainIds.includes(observed.selectedTrainAfter), true, label + '.selection identity domain');
    advanceTo(boundaryTick);
    const budgetBefore = copy(budget), clutchesBefore = clutches(), gearsBefore = gearReceipt();
    const requestedTrainIds = request === 'conflicting_buttons' ? [] : request === 'toggle_selected' ? [observed.selectedTrainAfter] : trainIds.filter(id => engaged[id]);
    const requiredCost = request === 'conflicting_buttons' ? null : requestedTrainIds.length;
    const reason = request === 'conflicting_buttons' ? request : request === 'brake_all' && requiredCost === 0 ? 'already_braked' : requiredCost > budget.remaining ? 'insufficient_budget' : 'applied';
    const accepted = reason === 'applied', changedTrainIds = accepted ? requestedTrainIds.slice() : [], chargedCost = accepted ? requiredCost : 0;
    if (accepted) {
      for (const id of changedTrainIds) engaged[id] = request === 'toggle_selected' ? !engaged[id] : false;
      budget = { initial: budget.initial, spent: budget.spent + chargedCost, remaining: budget.remaining - chargedCost };
      const allInstantAligned = pointers.every(pointer => pointerAt(phases[pointer.gearId] + pointer.mountOffsetUnits, pointer.targetUnits, tolerance, period).instantAligned);
      if (budget.remaining === 0 && !(trainIds.every(id => !engaged[id]) && allInstantAligned)) budgetTerminal = { reason: 'budget_exhausted', boundaryTick, transactionId };
    }
    actions.push({ receiptId: actions.length + 1, transactionId, boundaryTick, request, selectedTrainBefore: observed.selectedTrainBefore, selectedTrainAfter: observed.selectedTrainAfter,
      requestedTrainIds, accepted, reason, requiredCost, chargedCost, budgetBefore, budgetAfter: copy(budget), clutchesBefore, clutchesAfter: clutches(), changedTrainIds,
      gearsBefore, gearsAfter: gearReceipt(), terminalAfterCommand: budgetTerminal ? copy(budgetTerminal) : null });
    versions.push({ transactionId, engaged: copy(engaged), budget: copy(budget) });
  }
  advanceTo(finalTick);
  const rawJointRanges = [];
  for (const span of spans) {
    const count = span.toTick - span.fromTick; let joint = [{ first: 0, last: count - 1 }];
    for (const pointer of pointers) {
      const gear = gears.find(gear => gear.id === pointer.gearId);
      joint = intersectRanges(joint, alignedRanges({ phaseUnits: span.phases[gear.id] + pointer.mountOffsetUnits, speedUnitsPerTick: velocity(gear, span.engaged),
        targetUnits: pointer.targetUnits, toleranceUnits: tolerance, periodUnits: period, intervalCount: count }));
    }
    rawJointRanges.push(...joint.map(row => ({ first: row.first + span.fromTick, last: row.last + span.fromTick })));
  }
  const jointRanges = mergeRanges(rawJointRanges), eligibleRanges = intersectRanges(jointRanges, [{ first: scenario.windowStartTick, last: scenario.windowEndTick - 1 }]);
  const holdHistory = tick => {
    const hold = holdAt(eligibleRanges, tick), lastEligible = tick ? scenario.windowStartTick <= tick - 1 && tick <= scenario.windowEndTick : null;
    const lastAllFullInterval = tick ? contains(jointRanges, tick - 1) : null;
    return { ...hold, lastEligible, lastAllFullInterval, lastResetReason: tick === 0 ? null : !lastEligible ? 'outside_window' : !lastAllFullInterval ? 'pointer_outside_band' : null };
  };
  for (const action of actions) { action.holdBefore = holdHistory(action.boundaryTick); action.holdAfterCommand = copy(action.holdBefore); }
  equal(observedActions, actions, label + '.independent action/budget/continuity receipts');
  const completionTick = firstHoldEnd(eligibleRanges, scenario.holdRequiredTicks);
  const terminals = [budgetTerminal, completionTick === null ? null : { reason: 'global_hold_complete', boundaryTick: completionTick, transactionId: completionTick },
    finalTick < scenario.windowEndTick ? null : { reason: 'deadline', boundaryTick: scenario.windowEndTick, transactionId: scenario.windowEndTick }].filter(Boolean);
  // Any earlier completed interval resolves before a later command at that same mechanical boundary.
  terminals.sort((a, b) => a.transactionId - b.transactionId || Number(a.reason === 'deadline') - Number(b.reason === 'deadline'));
  const terminal = terminals[0] || null;
  equal([terminal?.boundaryTick, terminal?.transactionId], [finalTick, transactionCount], label + '.first terminal matches actual tick and transaction');
  const tickAt = transactionId => transactionId - (budgetTerminal && transactionId >= budgetTerminal.transactionId ? 1 : 0);
  equal(tickAt(transactionCount), finalTick, label + '.zero-interval budget transaction counted separately');
  const configurationAt = transactionId => versions.findLast(row => row.transactionId <= transactionId);
  const phaseAtTick = (id, tick) => {
    if (tick === 0) return initialPhases[id];
    const span = spans.find(row => row.fromTick < tick && tick <= row.toTick), gear = gears.find(row => row.id === id);
    if (!span) throw new Error('Missing affine phase span');
    return phaseAt(span.phases[id], velocity(gear, span.engaged), tick - span.fromTick);
  };
  const pointerState = tick => pointers.map(({ trainId, ...pointer }) => ({ ...pointer,
    ...pointerAt(phaseAtTick(pointer.gearId, tick) + pointer.mountOffsetUnits, pointer.targetUnits, pointer.toleranceUnits, period) }));
  const stateAt = transactionId => {
    const tick = tickAt(transactionId), configuration = configurationAt(transactionId), currentPointers = pointerState(tick);
    const finished = terminal !== null && transactionId >= terminal.transactionId, won = finished && terminal.reason === 'global_hold_complete';
    return { transactionCount: transactionId, tick, elapsed: tick / u.ticksPerSecond, phase: finished ? won ? 'won' : 'lost' : 'playing',
      stage: finished ? 'finished' : tick >= scenario.windowStartTick ? 'appointment' : 'tuning', score: won ? 1000 + 100 * configuration.budget.remaining : 0,
      lostReason: finished && !won ? terminal.reason : null, terminal: finished ? terminal : null,
      appointment: { windowStartTick: scenario.windowStartTick, windowEndTick: scenario.windowEndTick, holdRequiredTicks: scenario.holdRequiredTicks,
        phase: tick < scenario.windowStartTick ? 'before' : tick < scenario.windowEndTick ? 'eligible' : 'closed' }, budget: configuration.budget,
      motor: { unwrappedUnits: phaseAt(m.motor.initialUnwrappedUnits, m.motor.shaftSpeedUnitsPerTick, tick), normalizedUnits: mod(phaseAt(m.motor.initialUnwrappedUnits, m.motor.shaftSpeedUnitsPerTick, tick), period), velocityUnitsPerTick: m.motor.shaftSpeedUnitsPerTick },
      trains: trains.map(train => ({ id: train.id, name: train.name, engaged: configuration.engaged[train.id], clutchState: configuration.engaged[train.id] ? 'engaged' : 'braked', gearIds: train.gears.map(gear => gear.id) })),
      gears: gears.map(gear => ({ ...gear, unwrappedUnits: phaseAtTick(gear.id, tick), normalizedUnits: mod(phaseAtTick(gear.id, tick), period), velocityUnitsPerTick: velocity(gear, configuration.engaged) })),
      pointers: currentPointers, alignment: { allInstantAligned: currentPointers.every(pointer => pointer.instantAligned), ...holdHistory(tick) },
      actionReceipts: actions.filter(row => row.transactionId <= transactionId), lastActionReceipts: actions.filter(row => row.transactionId === transactionId) };
  };
  const transactionAt = id => {
    const advanced = tickAt(id) > tickAt(id - 1);
    return { id, fromTick: tickAt(id - 1), toTick: tickAt(id), advanced, actionReceiptIds: actions.filter(row => row.transactionId === id).map(row => row.receiptId),
      intervalId: advanced ? tickAt(id) : null, terminalAfter: stateAt(id).terminal };
  };
  const intervalAt = transactionId => {
    const transaction = transactionAt(transactionId); if (!transaction.advanced) return null;
    const { fromTick, toTick } = transaction, configuration = configurationAt(transactionId), before = holdHistory(fromTick), after = holdHistory(toTick), current = stateAt(transactionId);
    return { intervalId: toTick, transactionId, fromTick, toTick, precedingActionReceiptIds: transaction.actionReceiptIds,
      motor: { fromUnwrappedUnits: phaseAt(m.motor.initialUnwrappedUnits, m.motor.shaftSpeedUnitsPerTick, fromTick), toUnwrappedUnits: current.motor.unwrappedUnits, velocityUnitsPerTick: m.motor.shaftSpeedUnitsPerTick },
      trains: trains.map(train => ({ id: train.id, engaged: configuration.engaged[train.id], gears: train.gears.map(gear => ({ id: gear.id, teeth: gear.teeth,
        fromUnwrappedUnits: phaseAtTick(gear.id, fromTick), toUnwrappedUnits: phaseAtTick(gear.id, toTick), velocityUnitsPerTick: configuration.engaged[train.id] ? speeds[gear.id] : 0 })) })),
      pointerIntervals: pointers.map(({ trainId, ...pointer }) => {
        const a = phaseAtTick(pointer.gearId, fromTick) + pointer.mountOffsetUnits, b = phaseAtTick(pointer.gearId, toTick) + pointer.mountOffsetUnits;
        const containingBandIndex = bandIndex(a, b, pointer.targetUnits, pointer.toleranceUnits, period);
        return { ...pointer, fromUnwrappedUnits: a, toUnwrappedUnits: b, fromNormalizedUnits: mod(a, period), toNormalizedUnits: mod(b, period), containingBandIndex, fullIntervalAligned: containingBandIndex !== null };
      }), windowEligible: after.lastEligible, allPointersFullInterval: after.lastAllFullInterval,
      hold: { beforeTicks: before.holdTicks, afterTicks: after.holdTicks, startBeforeTick: before.holdStartTick, startAfterTick: after.holdStartTick, resetReason: after.lastResetReason },
      budgetAtInterval: configuration.budget, terminalAfter: current.terminal, phaseAfter: current.phase };
  };
  return { actions, spans, jointRanges, eligibleRanges, terminal, gears, speeds, tickAt, stateAt, transactionAt, intervalAt };
}

function snapshot(wrapper, audit, scenario, difficulty, seed, cursor, transactionId, label) {
  const physics = { ...parameters.units, mechanics: parameters.mechanics, stepSeconds: 1 / 60, dtTolerance: 1e-12,
    axisThreshold: 0.55, navigationFirstRepeatTick: 18, navigationRepeatPeriodTicks: 9 };
  const expected = { width: 960, height: 540, seed, difficulty, level: difficulty + 1, levelName: scenario.name, scenarioId: scenario.id,
    schemaVersion: parameters.schemaVersion, identity: parameters.identity, scenario, physics, ...audit.stateAt(transactionId), cursor, selectedTrainId: scenario.trains[cursor].id,
    lastTransaction: transactionId ? audit.transactionAt(transactionId) : null, lastInterval: transactionId ? audit.intervalAt(transactionId) : null };
  for (const [key, value] of Object.entries(expected)) equal(wrapper.model[key], value, label + '.' + key);
  for (let index = 0; index < expected.gears.length; index++) {
    maximumErrors.phaseUnits = Math.max(maximumErrors.phaseUnits, Math.abs(wrapper.model.gears[index].unwrappedUnits - expected.gears[index].unwrappedUnits));
    maximumErrors.velocityUnitsPerTick = Math.max(maximumErrors.velocityUnitsPerTick, Math.abs(wrapper.model.gears[index].velocityUnitsPerTick - expected.gears[index].velocityUnitsPerTick));
  }
  maximumErrors.budgetUnits = Math.max(maximumErrors.budgetUnits, Math.abs(wrapper.model.budget.remaining - expected.budget.remaining));
  maximumErrors.holdTicks = Math.max(maximumErrors.holdTicks, Math.abs(wrapper.model.alignment.holdTicks - expected.alignment.holdTicks));
  equal({ phase: wrapper.phase, paused: wrapper.paused, level: wrapper.level, difficulty: wrapper.difficulty, score: wrapper.score },
    { phase: expected.phase, paused: false, level: difficulty, difficulty, score: expected.score }, label + '.wrapper');
  equal(expected.budget.initial, expected.budget.spent + expected.budget.remaining, label + '.budget conservation');
  for (const gear of wrapper.model.gears.filter(gear => gear.meshParentId !== null)) {
    const parent = wrapper.model.gears.find(row => row.id === gear.meshParentId);
    equal(parent.teeth * parent.velocityUnitsPerTick + gear.teeth * gear.velocityUnitsPerTick, 0, label + '.actual inverse-tooth signed velocity');
    equal(parent.teeth * parent.unwrappedUnits + gear.teeth * gear.unwrappedUnits, 0, label + '.actual neutral-assembly displacement invariant');
  }
}

function expand(raw, index, label) {
  const frame = raw.frames[index], count = frame.receiptPrefixLengths.actionReceipts;
  equal([frame.transactionIndex, frame.state.model.transactionCount, frame.tick], [index, index, frame.state.model.tick], label + '.transaction frame identity');
  equal(Object.keys(frame.receiptPrefixLengths), ['actionReceipts'], label + '.one receipt prefix');
  equal(Object.hasOwn(frame.state.model, 'actionReceipts'), false, label + '.compressed receipt bank');
  equal(count, raw.actualReceipts.actionReceipts.filter(row => row.transactionId <= index).length, label + '.prefix uses transaction identity, not mechanical tick');
  return { ...frame.state, model: { ...frame.state.model, actionReceipts: raw.actualReceipts.actionReceipts.slice(0, count) } };
}

function inputBindings(raw, audit, scenario, label) {
  let previousKeys = [], previousIndex = -1;
  for (const change of raw.inputChanges) {
    equal(Number.isSafeInteger(change.transactionIndex) && change.transactionIndex > previousIndex && change.transactionIndex < raw.actualTransactions, true, label + '.input change transaction chronology');
    equal([change.tick, change.elapsed, change.from], [audit.tickAt(change.transactionIndex), audit.tickAt(change.transactionIndex) / 60, previousKeys], label + '.input change time and held-key continuity');
    equal(new Set(change.to).size === change.to.length && change.to.every(key => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'b'].includes(key)), true, label + '.ordinary key domain');
    previousKeys = change.to; previousIndex = change.transactionIndex;
  }
  const keysAt = index => raw.inputChanges.findLast(row => row.transactionIndex <= index)?.to || [], cursors = [0], threshold = 0.55;
  const finiteOrNull = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
  for (let id = 1; id <= raw.actualTransactions; id++) {
    const supplied = raw.transactionTrace[id - 1].input, before = raw.frames[id - 1].state.model.inputState, after = raw.frames[id].state.model, keys = keysAt(id - 1);
    equal(supplied, { x: Number(keys.includes('ArrowRight')) - Number(keys.includes('ArrowLeft')), y: Number(keys.includes('ArrowDown')) - Number(keys.includes('ArrowUp')),
      a: keys.includes('Space'), b: keys.includes('b'), aPressed: false, bPressed: false, cancelled: false, cancelEpoch: 0 }, label + '.declared ordinary held input@' + id);
    const rawX = finiteOrNull(supplied.x), rawY = finiteOrNull(supplied.y), x = Math.max(-1, Math.min(1, rawX ?? 0)), y = Math.max(-1, Math.min(1, rawY ?? 0));
    const axisX = x >= threshold ? 1 : x <= -threshold ? -1 : 0, axisY = y >= threshold ? 1 : y <= -threshold ? -1 : 0;
    const rawA = supplied.a === true, rawB = supplied.b === true, rawAPressed = supplied.aPressed === true, rawBPressed = supplied.bPressed === true;
    const effectiveA = rawA || rawAPressed, effectiveB = rawB || rawBPressed, rawCancelEpoch = finiteOrNull(supplied.cancelEpoch), cancelEpoch = rawCancelEpoch ?? before.cancelEpoch;
    const cancelled = supplied.cancelled === true, epochChanged = cancelEpoch !== before.cancelEpoch, trigger = cancelled || epochChanged;
    const isolated = before.quarantined, neutralAcknowledged = isolated && !trigger && axisX === 0 && axisY === 0 && !effectiveA && !effectiveB;
    const quarantinedAfter = trigger || isolated && !neutralAcknowledged, freshA = !trigger && !isolated && effectiveA && before.aArmed, freshB = !trigger && !isolated && effectiveB && before.bArmed;
    const actions = audit.actions.filter(row => row.transactionId === id), requests = freshA && freshB ? ['conflicting_buttons'] : freshA ? ['toggle_selected'] : freshB ? ['brake_all'] : [];
    equal(actions.map(row => row.request), requests, label + '.actual fresh command/conflict linkage');
    const nav = after.lastInput.navigationApplied, direction = trigger || isolated ? 0 : axisY || axisX;
    equal(typeof nav, 'boolean', label + '.navigation application is boolean'); if (!direction) equal(nav, false, label + '.no navigation while ineligible/neutral');
    const cursor = nav ? mod(cursors[id - 1] + direction, scenario.trains.length) : cursors[id - 1]; cursors.push(cursor);
    for (const action of actions) {
      equal(action.boundaryTick, audit.tickAt(id - 1), label + '.action time is its real transaction start');
      equal([action.selectedTrainBefore, action.selectedTrainAfter], [scenario.trains[cursors[id - 1]].id, scenario.trains[cursor].id], label + '.action selection brackets navigation');
    }
    const preparedAge = direction && direction === before.direction ? before.repeatAgeTicks : 0;
    const age = preparedAge + Number(audit.transactionAt(id).advanced && direction !== 0 && !quarantinedAfter);
    equal(after.inputState, { cancelEpoch, quarantined: quarantinedAfter, aArmed: quarantinedAfter ? false : neutralAcknowledged ? true : !effectiveA,
      bArmed: quarantinedAfter ? false : neutralAcknowledged ? true : !effectiveB, direction, repeatAgeTicks: age }, label + '.input latch facts and actual interval age');
    equal(after.lastInput, { transactionId: id, rawX, rawY, x, y, axisX, axisY, rawA, rawB, rawAPressed, rawBPressed, effectiveA, effectiveB, cancelled,
      rawCancelEpoch, cancelEpoch, epochChanged, quarantinedBefore: isolated, quarantinedAfter, neutralAcknowledged, freshA, freshB, direction,
      repeatAgeBefore: before.repeatAgeTicks, repeatAgeAfter: age, selectionBefore: cursors[id - 1], selectionAfter: cursor, navigationApplied: nav, actionReceiptIds: actions.map(row => row.receiptId) }, label + '.complete normalized input receipt@' + id);
    equal([after.cursor, after.selectedTrainId], [cursor, scenario.trains[cursor].id], label + '.actual selected train');
  }
  return { cursors, keysAt };
}

function references(raw, audit, inputs, label) {
  const expectedTransitions = [], actualIntervalIds = [];
  for (let id = 1; id <= raw.actualTransactions; id++) {
    const before = audit.stateAt(id - 1), after = audit.stateAt(id), { input, beforeFrameIndex, afterFrameIndex, ...transaction } = raw.transactionTrace[id - 1];
    equal([beforeFrameIndex, afterFrameIndex], [id - 1, id], label + '.transaction adjacent frames');
    equal(transaction, raw.frames[id].state.model.lastTransaction, label + '.actual detached transaction');
    equal(transaction, audit.transactionAt(id), label + '.independent transaction including no-interval terminal');
    if (transaction.advanced) actualIntervalIds.push(id);
    if (before.actionReceipts.length !== after.actionReceipts.length || before.phase !== after.phase || before.stage !== after.stage) expectedTransitions.push(id);
  }
  equal(raw.intervalTrace.map(row => row.transactionId), actualIntervalIds, label + '.all and only actually advanced transactions');
  for (let index = 0; index < raw.intervalTrace.length; index++) {
    const { input, beforeFrameIndex, afterFrameIndex, ...interval } = raw.intervalTrace[index], id = interval.transactionId;
    equal([interval.intervalId, interval.toTick, interval.fromTick], [index + 1, index + 1, index], label + '.continuous physical intervals');
    equal([beforeFrameIndex, afterFrameIndex], [id - 1, id], label + '.interval actual transaction references');
    equal(input, raw.transactionTrace[id - 1].input, label + '.interval actual transaction input');
    equal(interval, raw.frames[id].state.model.lastInterval, label + '.detached actual interval');
  }
  equal(raw.eventTransitions.map(row => row.transactionId), expectedTransitions, label + '.all and only receipt/stage/terminal transitions');
  for (const row of raw.eventTransitions) {
    const id = row.transactionId; equal([row.tick, row.beforeFrameIndex, row.afterFrameIndex], [audit.tickAt(id), id - 1, id], label + '.event transaction references');
    equal(row.input, raw.transactionTrace[id - 1].input, label + '.event actual input');
    equal(row.actualTransaction, raw.frames[id].state.model.lastTransaction, label + '.event actual transaction');
    equal(row.actualLastInterval, raw.frames[id].state.model.lastInterval, label + '.event nullable actual interval');
    equal(row.receiptIds, { actionReceipts: audit.actions.filter(action => action.transactionId === id).map(action => action.receiptId) }, label + '.event receipt ids');
  }
  equal(raw.operations.map(row => row.receipt), raw.actualReceipts.actionReceipts, label + '.every actual receipt observed once and unchanged');
  for (const row of raw.operations) {
    const id = row.receipt.transactionId;
    equal([row.kind, row.observedAt, row.beforeFrameIndex, row.afterFrameIndex], ['actionReceipts', audit.tickAt(id) / 60, id - 1, id], label + '.operation actual observation boundary');
  }
  for (const row of raw.retained) {
    equal(Number.isSafeInteger(row.frameIndex) && row.frameIndex >= 0 && row.frameIndex <= raw.actualTransactions, true, label + '.retained real transaction frame');
    equal(row.seconds, audit.tickAt(row.frameIndex) / 60, label + '.retained mechanical time');
  }
  equal([raw.retained[0]?.frameIndex, raw.retained.at(-1)?.frameIndex], [0, raw.actualTransactions], label + '.retained initial/final including zero-interval loss');
  let previousIndex = -1;
  for (const row of raw.compactTrace) {
    const id = row.transactionIndex, state = audit.stateAt(id); equal(Number.isSafeInteger(id) && id > previousIndex && id <= raw.actualTransactions, true, label + '.compact chronological transaction'); previousIndex = id;
    equal(row, { transactionIndex: id, tick: state.tick, keys: inputs.keysAt(id), phase: state.phase, stage: state.stage, cursor: inputs.cursors[id], budget: state.budget,
      trains: state.trains, pointers: state.pointers, alignment: state.alignment, receiptCounts: { actionReceipts: state.actionReceipts.length } }, label + '.all compact fields');
  }
}

function review(raw, entry) {
  const label = entry.name, assertionStart = assertions, failureStart = failureCount, tick = raw.final.model.tick, count = raw.final.model.transactionCount, difficulty = raw.initial.model.difficulty;
  equal(Number.isSafeInteger(difficulty) && difficulty >= 0 && difficulty <= 2, true, label + '.difficulty'); const scenario = parameters.scenarios[difficulty];
  equal([raw.name, raw.difficulty, raw.initial.model.level, raw.mode], [label, difficulty, Number(/^level([1-3])-/.exec(label)[1]), label.endsWith('-record') ? 'record' : 'loss'], label + '.case identity');
  equal(Object.hasOwn(raw, 'pilotDiagnostics'), false, label + '.no diagnostics'); equal(entry.removedPaths, ['pilotDiagnostics'], label + '.lossless projection scope');
  equal(Number.isSafeInteger(tick) && tick >= 0 && tick <= scenario.windowEndTick && Number.isSafeInteger(count) && count >= 1, true, label + '.bounded actual terminal');
  equal([raw.initial.model.tick, raw.initial.model.transactionCount, raw.actualFixedTicks, entry.actualFixedTicks, raw.actualTransactions, raw.frames.length, raw.transactionTrace.length, raw.intervalTrace.length],
    [0, 0, tick, tick, count, count + 1, count, tick], label + '.complete transactions and physical intervals counted separately');
  for (const [key, value] of Object.entries({ version: 2, frameIndexEqualsTransactionIndex: true, frameIndexEqualsTick: false })) equal(raw.evidenceEncoding[key], value, label + '.encoding.' + key);
  equal(Object.keys(raw.actualReceipts), ['actionReceipts'], label + '.one permanent bank');
  equal(raw.actualReceipts.actionReceipts, raw.final.model.actionReceipts, label + '.complete actual final bank');
  equal(raw.initial, expand(raw, 0, label), label + '.initial expansion'); equal(raw.final, expand(raw, count, label), label + '.final expansion');
  equal(raw.initial.model.inputState, { cancelEpoch: 0, quarantined: true, aArmed: false, bArmed: false, direction: 0, repeatAgeTicks: 0 }, label + '.initial input state');
  equal(raw.initial.model.lastInput, null, label + '.initial input'); const seed = raw.initial.model.seed;
  equal(Number.isSafeInteger(seed) && seed >= 0, true, label + '.valid recorded seed');
  const audit = calendar(raw.actualReceipts.actionReceipts, tick, count, scenario, label), inputs = inputBindings(raw, audit, scenario, label);
  snapshot(raw.initial, audit, scenario, difficulty, seed, 0, 0, label + '.initial'); snapshot(raw.final, audit, scenario, difficulty, seed, inputs.cursors[count], count, label + '.final');
  for (let index = 0; index <= count; index++) snapshot(expand(raw, index, label + '@' + index), audit, scenario, difficulty, seed, inputs.cursors[index], index, label + '@' + index);
  references(raw, audit, inputs, label); const final = audit.stateAt(count), actions = audit.actions;
  equal(final.phase, raw.mode === 'record' ? 'won' : 'lost', label + '.requested natural outcome');
  const pointerIntervals = raw.intervalTrace.flatMap(row => row.pointerIntervals), intervalLength = rows => sum(rows.map(row => row.last - row.first + 1));
  const accepted = actions.filter(row => row.accepted), rejected = actions.filter(row => !row.accepted);
  return { name: label, level: difficulty + 1, passed: failureCount === failureStart, assertions: assertions - assertionStart,
    projectionSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, originalReportSha256: entry.originalReportSha256, sourceHashes: entry.sourceHashes,
    result: Object.fromEntries(['transactionCount', 'tick', 'elapsed', 'phase', 'stage', 'score', 'lostReason', 'terminal', 'appointment', 'budget', 'motor', 'trains', 'gears', 'pointers', 'alignment'].map(key => [key, final[key]])),
    counts: { transactions: count, actualFrames: count + 1, fullSnapshotChecks: count + 3, intervals: tick, retained: raw.retained.length, compact: raw.compactTrace.length,
      eventWindows: raw.eventTransitions.length, operations: raw.operations.length, inputChanges: raw.inputChanges.length, actionReceipts: actions.length,
      affineSpans: audit.spans.length, fullGearEndpointChecks: (count + 3) * final.gears.length, pointerIntervalChecks: tick * final.pointers.length,
      simultaneousAlignedRuns: audit.jointRanges.length, eligibleHoldRuns: audit.eligibleRanges.length },
    coverage: { acceptedAdjustments: accepted.length, chargedAdjustmentUnits: sum(accepted.map(row => row.chargedCost)),
      rejectedReasons: Object.fromEntries([...new Set(rejected.map(row => row.reason))].map(reason => [reason, rejected.filter(row => row.reason === reason).length])),
      atomicMultiTrainBrakes: accepted.filter(row => row.request === 'brake_all' && row.changedTrainIds.length > 1).length,
      nonzeroPhaseReengagements: accepted.filter(row => row.request === 'toggle_selected' && row.clutchesAfter.find(clutch => clutch.trainId === row.requestedTrainIds[0]).engaged &&
        row.gearsBefore.some(gear => audit.gears.find(item => item.id === gear.id).trainId === row.requestedTrainIds[0] && gear.unwrappedUnits !== 0)).length,
      zeroIntervalTransactions: count - tick, zeroBudgetAdvancedIntervals: raw.intervalTrace.filter(row => row.budgetAtInterval.remaining === 0).length,
      historicalPartialHoldAtBudgetLoss: final.terminal?.reason === 'budget_exhausted' && final.alignment.holdTicks > 0,
      simultaneousAlignedIntervals: intervalLength(audit.jointRanges), eligibleHoldIntervals: intervalLength(audit.eligibleRanges),
      alignedBeforeAppointmentIntervals: intervalLength(intersectRanges(audit.jointRanges, [{ first: 0, last: scenario.windowStartTick - 1 }])),
      positiveHoldResets: audit.eligibleRanges.filter(row => row.last + 1 < tick).length,
      alignedCircularWrapPointerIntervals: pointerIntervals.filter(row => row.fullIntervalAligned && Math.abs(row.toNormalizedUnits - row.fromNormalizedUnits) > parameters.units.angleUnitsPerTurn / 2).length,
      inclusiveBandEdgePointerIntervals: pointerIntervals.filter(row => row.fullIntervalAligned && [row.fromUnwrappedUnits, row.toUnwrappedUnits].some(q => Math.abs(q - row.targetUnits - row.containingBandIndex * parameters.units.angleUnitsPerTurn) === row.toleranceUnits)).length,
      wonExactlyAtDeadline: final.phase === 'won' && tick === scenario.windowEndTick, terminalReason: final.terminal?.reason ?? null },
    simultaneousAlignedRanges: audit.jointRanges, eligibleHoldRanges: audit.eligibleRanges };
}

const [corpusArg, outputArg, approvedIndexSha] = process.argv.slice(2);
if (!corpusArg || !outputArg || !/^[a-f0-9]{64}$/.test(approvedIndexSha || '')) throw new Error('Supply approved public corpus, fresh output and index SHA256');
const corpus = path.resolve(corpusArg), output = path.resolve(outputArg), indexPath = path.join(corpus, 'index.json');
if (hash(indexPath) !== approvedIndexSha) throw new Error('Unapproved public index'); const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
if (index.rounds.length !== 6 || new Set(index.rounds.map(row => row.file)).size !== 6 || !index.rounds.every(row => /^level[1-3]-(record|loss)\.json$/.test(row.file) && row.file === row.name + '.json')) throw new Error('Expected six ordinary case basenames');
const portable = file => file.startsWith('/workspace/pureTV/') ? 'repoRelative:' + file.slice('/workspace/pureTV/'.length) : 'scratchRelative:' + path.relative('/workspace/scratch', file);
const files = [indexPath, contractPath, ...['clockwork-interval-oracle.mjs', 'independent-clockwork-review.mjs'].map(name => path.join(app, 'tests', name)), ...index.rounds.map(row => path.join(corpus, row.file))];
const hashes = () => Object.fromEntries(files.map(file => [portable(file), hash(file)]));
if (fs.existsSync(output)) throw new Error('Fresh output required; preserve prior evidence'); fs.mkdirSync(output, { recursive: true });
const startedAt = new Date().toISOString(), startHashes = hashes(), rounds = []; let executionError = null;
try {
  equal(hash(contractPath), CONTRACT_SHA, 'approved contract'); parameters = readParameters(fs.readFileSync(contractPath, 'utf8')); equal(index.originalFilesUnchanged, true, 'original bytes unchanged');
  for (const run of index.sourceRuns) { equal(run.startHashes, run.endHashes, 'original source window'); equal(run.startHashes.contract, CONTRACT_SHA, 'actual source contract'); }
  for (const entry of index.rounds) {
    const run = index.sourceRuns.find(row => row.sha256 === entry.originalReportSha256), file = path.join(corpus, entry.file);
    equal(entry.originalReportSha256, index.originalReportSha256, entry.name + '.report binding'); equal(entry.sourceHashes, run?.startHashes, entry.name + '.source binding'); equal(hash(file), entry.sha256, entry.name + '.actual public bytes');
    rounds.push(review(JSON.parse(fs.readFileSync(file, 'utf8')), entry));
  }
} catch (error) { executionError = { name: error.name, message: error.message, stack: error.stack }; }
const endHashes = hashes(), completedAt = new Date().toISOString(); equal(endHashes, startHashes, 'source/evidence window unchanged');
const countKeys = ['transactions', 'actualFrames', 'fullSnapshotChecks', 'intervals', 'retained', 'compact', 'eventWindows', 'operations', 'inputChanges', 'actionReceipts', 'affineSpans', 'fullGearEndpointChecks', 'pointerIntervalChecks', 'simultaneousAlignedRuns', 'eligibleHoldRuns'];
const report = { game: 'clockwork-align', kind: 'independent-existing-observation-review', passed: !executionError && failureCount === 0 && rounds.length === 6,
  startedAt, completedAt, sourceUnchanged: isDeepStrictEqual(startHashes, endHashes), startHashes, endHashes,
  source: { index: portable(indexPath), indexSha256: approvedIndexSha, originalReportSha256: index.originalReportSha256,
    runs: index.sourceRuns.map(run => ({ report: portable(run.path), sha256: run.sha256, startHashes: run.startHashes, endHashes: run.endHashes })) },
  method: 'Mesh-chain tooth counts independently determine signed gear velocities. Actual control transactions partition absolute phase algebra from the original neutral assembly. Each affine pointer span yields exact integer full-interval start ranges in translated circular bands; intersections across all pointers and the appointment produce the one continuous global hold. Budget and action receipts are audited separately from physical tick advancement, including the final zero-interval transaction. No production predicate, controller, witness or observed phase reset is used.',
  numericalComparison: { mechanicalAndGateTolerance: 0, timingTolerance: 0, maximumErrors, comparison: 'All gear, budget and hold calculations are exact integers. BigInt signed division determines band/range bounds; outputs return safe integers. Elapsed seconds are compared to mechanical tick/60. No epsilon widens a circular or terminal boundary.' },
  assertions, failureCount, failureSamples, failureSamplesTruncated: failureCount > failureSamples.length, executionError,
  totals: Object.fromEntries(countKeys.map(key => [key, sum(rounds.map(row => row.counts[key]))])), rounds,
  limitations: ['Only the first existing ordinary six-case public projection is audited. No Model/pilot import, private design witness, gameplay, search, synthetic predicate fixture or new route is used.',
    'Actual held inputs, raw/effective button fields, fresh conflicts, quarantine/arming, selection deltas and actual repeat-age advancement are linked. Navigation repeat firing itself is not independently replayed.',
    'These ordinary inputs do not claim coverage of browser short-pulse aliases, cancellation, host pause/retry, invalid dt or extra terminal/zero-dt calls. Coverage fields list only observed boundaries.',
    'Transactions are complete and receipt-prefix restoration is lossless. Physical intervals are separately continuous; a zero-interval budget loss does not invent motion or reset historical hold. Sparse browser/video observations are outside this audit.',
    'Artwork offsets are checked as public metadata and never treated as physical pointer phase; renderer tooth geometry and GPU output are outside this mathematical review.'] };
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, assertions, failureCount, executionError, totals: report.totals, numericalComparison: report.numericalComparison, reportSha256: hash(path.join(output, 'report.json')) }, null, 2));
if (!report.passed) process.exitCode = 1;
