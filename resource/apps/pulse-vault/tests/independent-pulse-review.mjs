// Offline review of the approved actual public corpus; no production imports, proposed inputs or gameplay calls.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {ENERGY_KEYS, THERMAL_KEYS, parseContract, pulseAt, dischargeTerms, captureTerms, heatCalendar, supplyAt, outcome} from './pulse-interval-oracle.mjs';
const copy = value => structuredClone(value);
const zeros = keys => Object.fromEntries(keys.map(key => [key, 0]));
const check = (condition, message) => { if (!condition) throw new Error(message); };
const initialInputState = () => ({cancelEpoch: null, quarantined: true, bArmed: false, axisArmed: false});
const finite = value => Number.isFinite(value) ? value : null;
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

// Only the documented input protocol is folded per observed call; it has no energy, heat or door state.
// Calls supplied by the future corpus binder are original {boundaryTick,input}, not proposed commands.
export function controlCalendar(calls, physics) {
  let state = initialInputState(), doseIndex = physics.initialDoseIndex;
  const controls = [], commands = [];
  for (const [boundaryTick, call] of calls.entries()) {
    check(call.boundaryTick === boundaryTick, 'Missing or reordered actual input interval');
    const input = call.input || {}, before = {...state}, doseIndexBefore = doseIndex;
    const rawX = finite(input.x), rawY = finite(input.y), rawCancelEpoch = finite(input.cancelEpoch);
    const x = clamp(rawX ?? 0, -1, 1), y = clamp(rawY ?? 0, -1, 1);
    const axis = value => value >= physics.axisThreshold ? 1 : value <= -physics.axisThreshold ? -1 : 0;
    const axisX = axis(x), axisY = axis(y), rawA = input.a === true, rawB = input.b === true;
    const rawAPressed = input.aPressed === true, rawBPressed = input.bPressed === true, cancelled = input.cancelled === true;
    const epochChanged = rawCancelEpoch !== null && rawCancelEpoch !== before.cancelEpoch;
    const neutral = axisX === 0 && axisY === 0 && !rawA && !rawB && !rawAPressed && !rawBPressed;
    state = {...before, cancelEpoch: rawCancelEpoch === null ? before.cancelEpoch : rawCancelEpoch};
    let effectiveA = false, freshB = false, freshAxis = false, neutralAcknowledged = false;
    if (cancelled || epochChanged) state = {...state, quarantined: true, bArmed: false, axisArmed: false};
    else if (before.quarantined) {
      if (neutral) { state = {...state, quarantined: false, bArmed: true, axisArmed: true}; neutralAcknowledged = true; }
    } else {
      effectiveA = rawA || rawAPressed;
      freshB = (rawB || rawBPressed) && before.bArmed;
      freshAxis = axisX !== 0 && before.axisArmed;
      state.bArmed = !(rawB || rawBPressed); state.axisArmed = axisX === 0;
      if (freshAxis) doseIndex = clamp(doseIndex + axisX, 0, physics.doseOptionsEU.length - 1);
    }
    const lastInput = {boundaryTick, rawX, rawY, x, y, axisX, axisY, rawA, rawB, rawAPressed, rawBPressed,
      cancelled, rawCancelEpoch, cancelEpoch: state.cancelEpoch, epochChanged, quarantinedBefore: before.quarantined,
      quarantinedAfter: state.quarantined, neutralAcknowledged, bArmedBefore: before.bArmed, bArmedAfter: state.bArmed,
      axisArmedBefore: before.axisArmed, axisArmedAfter: state.axisArmed, effectiveA, freshB, freshAxis, axisStep: doseIndex - doseIndexBefore};
    controls.push({doseIndexBefore, doseIndex, charging: effectiveA, inputState: {...state}, lastInput});
    if (freshB) commands.push({id: commands.length + 1, boundaryTick, selectedDoseIndex: doseIndex});
  }
  return {controls, commands};
}

// Build scalar accounts only at real B attempts and absolute source pulses; event-free intervals use closed-form cooling.
export function eventBook(scenario, physics, controls, commands) {
  const horizon = controls.length, calendar = new Map();
  const atEvent = tick => { if (!calendar.has(tick)) calendar.set(tick, {command: null, pulse: null}); return calendar.get(tick); };
  for (const [index, command] of commands.entries()) {
    const tick = command.boundaryTick + 1;
    check(command.id === index + 1 && Number.isSafeInteger(tick) && tick >= 1 && tick <= horizon, 'Invalid actual command calendar');
    check(atEvent(tick).command === null, 'More than one B attempt in one actual interval');
    atEvent(tick).command = command;
  }
  const pulseCount = Math.min(scenario.pulseCount, Math.floor(horizon / scenario.periodTicks));
  for (let index = 1; index <= pulseCount; index++) {
    const pulse = pulseAt(scenario, index); atEvent(pulse.dueTick).pulse = pulse;
  }
  const locks = scenario.lockThresholdsEU.map((thresholdEU, index) => ({id: 'lock-' + (index + 1), thresholdEU, status: 'closed',
    openedAtBoundaryTick: null, openedByDischargeId: null, acceptedEU: 0}));
  let energyEU = physics.initialEnergyEU, openedCount = 0;
  const energyLedger = zeros(ENERGY_KEYS), thermalLedger = zeros(THERMAL_KEYS), dischargeReceipts = [], pulseReceipts = [], additions = [];
  const anchors = [{tick: 0, energyEU, openedCount, energyLedger: {...energyLedger}, thermalLedger: {...thermalLedger}, locks: copy(locks)}];
  const dischargesByTick = new Map(), pulsesByTick = new Map();
  for (const tick of [...calendar.keys()].sort((a, b) => a - b)) {
    const {command, pulse} = calendar.get(tick); let heatAdded = 0;
    if (command) {
      const targetIndex = openedCount, targetBefore = copy(locks[targetIndex] || null), selectedDoseEU = physics.doseOptionsEU[command.selectedDoseIndex];
      check(Number.isSafeInteger(selectedDoseEU), 'Command selects no public dose');
      const terms = dischargeTerms(energyEU, selectedDoseEU, targetBefore?.thresholdEU ?? null, physics);
      if (terms.result === 'opened') {
        locks[targetIndex] = {...targetBefore, status: 'open', openedAtBoundaryTick: command.boundaryTick,
          openedByDischargeId: command.id, acceptedEU: targetBefore.thresholdEU}; openedCount++;
      }
      const receipt = {...command, selectedDoseEU, targetIndex, targetBefore, targetAfter: copy(locks[targetIndex] || null),
        result: terms.result, energyBeforeEU: energyEU, energyAfterEU: terms.energyAfterEU,
        spentEU: terms.spentEU, usefulEU: terms.usefulEU, wasteEU: terms.wasteEU, heatAddedHU: terms.heatAddedHU,
        currentLockIndexBefore: targetIndex, currentLockIndexAfter: openedCount};
      energyEU = terms.energyAfterEU; energyLedger.dischargedEU += terms.spentEU;
      energyLedger.usefulToLocksEU += terms.usefulEU; energyLedger.dischargeWasteEU += terms.wasteEU;
      thermalLedger.dischargeAddedHU += terms.heatAddedHU; heatAdded += terms.heatAddedHU;
      dischargeReceipts.push(receipt); dischargesByTick.set(tick, receipt);
    }
    if (pulse) {
      const charging = controls[tick - 1].charging, terms = captureTerms(energyEU, pulse.amountEU, charging, physics);
      const receipt = {id: pulse.index, index: pulse.index, endedTick: tick, amountEU: pulse.amountEU, charging,
        result: terms.result, energyBeforeEU: energyEU, harvestedGrossEU: terms.harvestedGrossEU, missedEU: terms.missedEU,
        overflowLostEU: terms.overflowLostEU, energyAfterEU: terms.energyAfterEU,
        captureAddedHU: terms.captureAddedHU, overflowAddedHU: terms.overflowAddedHU};
      energyEU = terms.energyAfterEU; energyLedger.offeredEU += pulse.amountEU;
      for (const key of ['harvestedGrossEU', 'missedEU', 'overflowLostEU']) energyLedger[key] += terms[key];
      thermalLedger.captureAddedHU += terms.captureAddedHU; thermalLedger.overflowAddedHU += terms.overflowAddedHU;
      heatAdded += terms.captureAddedHU + terms.overflowAddedHU;
      pulseReceipts.push(receipt); pulsesByTick.set(tick, receipt);
    }
    additions.push({endedTick: tick, addedHU: heatAdded});
    anchors.push({tick, energyEU, openedCount, energyLedger: {...energyLedger}, thermalLedger: {...thermalLedger}, locks: copy(locks)});
  }
  const heat = heatCalendar(additions, horizon, physics);
  for (const receipt of dischargeReceipts) {
    receipt.heatBeforeHU = heat.at(receipt.boundaryTick).heatHU;
    receipt.heatAfterHU = receipt.heatBeforeHU + receipt.heatAddedHU;
  }
  for (const receipt of pulseReceipts) {
    receipt.heatBeforeHU = heat.at(receipt.endedTick - 1).heatHU + (dischargesByTick.get(receipt.endedTick)?.heatAddedHU || 0);
    receipt.heatAfterHU = receipt.heatBeforeHU + receipt.captureAddedHU + receipt.overflowAddedHU;
  }
  function resourcesAt(tick) {
    check(Number.isSafeInteger(tick) && tick >= 0 && tick <= horizon, 'Account query outside actual corpus');
    let lo = 0, hi = anchors.length;
    while (lo + 1 < hi) { const mid = Math.floor((lo + hi) / 2); if (anchors[mid].tick <= tick) lo = mid; else hi = mid; }
    const row = anchors[lo], thermal = heat.at(tick);
    return {tick, elapsed: tick / physics.ticksPerSecond, energyEU: row.energyEU, heatHU: thermal.heatHU,
      energyLedger: {...row.energyLedger}, thermalLedger: {...row.thermalLedger, cooledHU: thermal.cooledHU},
      currentLockIndex: row.openedCount, openedCount: row.openedCount, locks: copy(row.locks),
      pulseCursor: Math.min(scenario.pulseCount, Math.floor(tick / scenario.periodTicks)),
      supply: supplyAt(scenario, physics, tick, row.energyEU, row.openedCount),
      ...outcome(scenario, physics, tick, row.energyEU, row.openedCount, thermal.peakHeatHU)};
  }
  function intervalAt(tick) {
    check(tick > 0, 'Initial state has no actual interval');
    const before = resourcesAt(tick - 1), after = resourcesAt(tick), control = controls[tick - 1];
    const delta = key => Object.fromEntries(Object.keys(before[key]).map(name => [name, after[key][name] - before[key][name]]));
    return {fromTick: tick - 1, toTick: tick, doseIndexBefore: control.doseIndexBefore, doseIndexAfter: control.doseIndex,
      energyBeforeEU: before.energyEU, energyAfterEU: after.energyEU, heatBeforeHU: before.heatHU, heatAfterHU: after.heatHU,
      peakHeatHU: heat.at(tick).peakHeatHU, charging: control.charging, dischargeId: dischargesByTick.get(tick)?.id ?? null,
      pulseId: pulsesByTick.get(tick)?.id ?? null, cooling: heat.coolingAt(tick), currentLockIndexBefore: before.currentLockIndex,
      currentLockIndexAfter: after.currentLockIndex, energyLedgerDelta: delta('energyLedger'), thermalLedgerDelta: delta('thermalLedger'),
      supplyAfter: after.supply, terminalAfter: after.terminal};
  }
  function stateAt(tick) {
    const control = tick === 0 ? null : controls[tick - 1], resources = resourcesAt(tick);
    const doseIndex = control?.doseIndex ?? physics.initialDoseIndex;
    return {...resources, doseIndex, selectedDoseEU: physics.doseOptionsEU[doseIndex], charging: control?.charging ?? false,
      inputState: copy(control?.inputState ?? initialInputState()), lastInput: copy(control?.lastInput ?? null),
      lastDischarge: copy(dischargesByTick.get(tick) || null), lastPulse: copy(pulsesByTick.get(tick) || null),
      lastCooling: heat.coolingAt(tick), lastStep: tick === 0 ? null : intervalAt(tick)};
  }
  return {horizon, eventIntervals: calendar.size, anchors, heat, dischargeReceipts, pulseReceipts, resourcesAt, intervalAt, stateAt};
}

const CONTRACT_SHA = '22d484b37dcbbff64375d8992a2dd93b948a89a5ab06e9288799e2c6511a6dd8';
const INTERFACE_SHA = 'a3c5fc54ac0b20513bad24f967204de1901b1479d45959588af270d231b0ac5b';
const BANKS = ['dischargeReceipts', 'pulseReceipts'];
let parameters, assertionCount = 0, failureCount = 0;
const failures = [], maximumErrors = {energyEU: 0, heatHU: 0, ticks: 0, elapsedSeconds: 0};
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const firstObservedTick = (bank, receipt) => bank === 'dischargeReceipts' ? receipt.boundaryTick + 1 : receipt.endedTick;
const keyInput = keys => ({x: Number(keys.includes('ArrowRight')) - Number(keys.includes('ArrowLeft')), y: 0,
  a: keys.includes('Space'), b: keys.includes('b'), aPressed: false, bPressed: false, cancelled: false, cancelEpoch: 0});

function equal(actual, expected, label) {
  assertionCount++;
  const matched = isDeepStrictEqual(actual, expected);
  if (!matched) {
    failureCount++;
    if (failures.length < 100) failures.push({label, actual: JSON.stringify(actual)?.slice(0, 700), expected: JSON.stringify(expected)?.slice(0, 700)});
  }
  return matched;
}

function compare(actual, expected, label) {
  if (expected === null || typeof expected !== 'object') {
    if (typeof actual === 'number' && typeof expected === 'number') {
      const key = /EU$/.test(label) ? 'energyEU' : /HU$/.test(label) ? 'heatHU' : /(?:Tick|tick)$/.test(label) ? 'ticks' : /\.elapsed$/.test(label) ? 'elapsedSeconds' : null;
      if (key) maximumErrors[key] = Math.max(maximumErrors[key], Math.abs(actual - expected));
    }
    equal(actual, expected, label); return;
  }
  equal(Array.isArray(actual), Array.isArray(expected), label + '.container');
  check(actual !== null && typeof actual === 'object', label + ': missing object');
  equal(Object.keys(actual).sort(), Object.keys(expected).sort(), label + '.keys');
  for (const key of Object.keys(expected)) compare(actual[key], expected[key], label + '.' + key);
}

function expandFrame(raw, index) {
  const frame = raw.frames[index], result = {...frame.state, model: {...frame.state.model}};
  for (const bank of BANKS) result.model[bank] = raw.actualReceipts[bank].slice(0, frame.receiptPrefixLengths[bank]);
  return result;
}

function checkBindings(raw, label) {
  const finalTick = raw.final.model.tick, hz = parameters.physics.ticksPerSecond;
  equal(raw.name, label, label + '.name'); equal(raw.passed, true, label + '.original passed'); equal(raw.failure, null, label + '.original failure');
  equal(raw.difficulty, raw.initial.model.difficulty, label + '.difficulty metadata');
  equal(Number(label.match(/^level([123])-/)?.[1]), raw.initial.model.level, label + '.named level');
  equal(Object.hasOwn(raw, 'pilotDiagnostics'), false, label + '.public projection');
  equal(raw.evidenceEncoding.version, 3, label + '.encoding'); equal(raw.evidenceEncoding.frameIndexBase, 0, label + '.frame base');
  equal(raw.evidenceEncoding.frameIndexEqualsTick, true, label + '.frame clock'); equal(raw.evidenceEncoding.receiptFields, BANKS, label + '.receipt fields');
  equal(Object.keys(raw.actualReceipts).sort(), [...BANKS].sort(), label + '.bank keys');
  equal(raw.actualFixedTicks, finalTick, label + '.actual fixed ticks'); equal(raw.frames.length, finalTick + 1, label + '.all tick frames');
  equal(raw.intervalTrace.length, finalTick, label + '.all real intervals');
  for (const bank of BANKS) {
    equal(raw.actualReceipts[bank], raw.final.model[bank], label + '.complete final bank');
    raw.actualReceipts[bank].forEach((receipt, i) => {
      equal(receipt.id, i + 1, label + '.receipt ID');
      const at = firstObservedTick(bank, receipt);
      equal(Number.isSafeInteger(at) && at >= 1 && at <= finalTick, true, label + '.receipt clock');
      if (i) equal(at >= firstObservedTick(bank, raw.actualReceipts[bank][i - 1]), true, label + '.bank append order');
    });
  }
  const expectedEvents = [], expectedOperations = [];
  for (let i = 0; i < raw.frames.length; i++) {
    const frame = raw.frames[i], model = frame.state.model;
    equal(Object.keys(frame).sort(), ['frameIndex', 'receiptPrefixLengths', 'state', 'tick'], label + '.frame fields');
    equal(frame.frameIndex, i, label + '.frame index'); equal(frame.tick, i, label + '.frame tick'); equal(model.tick, i, label + '.model tick');
    equal(Object.keys(frame.receiptPrefixLengths).sort(), [...BANKS].sort(), label + '.prefix fields');
    for (const bank of BANKS) {
      equal(Object.hasOwn(model, bank), false, label + '.only bank omitted');
      equal(frame.receiptPrefixLengths[bank], raw.actualReceipts[bank].filter(receipt => firstObservedTick(bank, receipt) <= i).length, label + '.exact bank prefix');
    }
    const {model: ignored, ...outer} = frame.state;
    equal(outer, {phase: model.phase, paused: false, level: model.difficulty, difficulty: model.difficulty, score: model.score}, label + '.wrapper');
    if (!i) continue;
    const {input, beforeFrameIndex, afterFrameIndex, ...lastStep} = raw.intervalTrace[i - 1], before = raw.frames[i - 1].state.model;
    equal(beforeFrameIndex, i - 1, label + '.interval before frame'); equal(afterFrameIndex, i, label + '.interval after frame');
    equal(lastStep, model.lastStep, label + '.complete actual lastStep');
    equal(lastStep.fromTick, i - 1, label + '.interval from'); equal(lastStep.toTick, i, label + '.interval to');
    const current = Object.fromEntries(BANKS.map(bank => [bank, raw.actualReceipts[bank].filter(receipt => firstObservedTick(bank, receipt) === i)]));
    const receiptIds = Object.fromEntries(BANKS.map(bank => [bank, current[bank].map(receipt => receipt.id)]));
    for (const [bank, lastKey, idKey] of [['dischargeReceipts', 'lastDischarge', 'dischargeId'], ['pulseReceipts', 'lastPulse', 'pulseId']]) {
      equal(current[bank].length <= 1, true, label + '.at most one event of each kind per interval');
      equal(model[lastKey], current[bank][0] ?? null, label + '.actual local event');
      equal(lastStep[idKey], current[bank][0]?.id ?? null, label + '.interval event ID');
    }
    equal(lastStep.cooling, model.lastCooling, label + '.actual local cooling copy');
    if (BANKS.some(bank => receiptIds[bank].length) || before.phase !== model.phase) expectedEvents.push({tick: i, input, beforeFrameIndex: i - 1, afterFrameIndex: i, receiptIds, actualLastStep: model.lastStep});
    for (const bank of BANKS) for (const receipt of current[bank]) expectedOperations.push({kind: bank, observedAt: i / hz, receipt, beforeFrameIndex: i - 1, afterFrameIndex: i});
  }
  equal(raw.initial, expandFrame(raw, 0), label + '.full initial expansion'); equal(raw.final, expandFrame(raw, finalTick), label + '.full final expansion');
  equal(raw.eventTransitions, expectedEvents, label + '.all-and-only event windows');
  equal(raw.operations.map(({boundaryScope, ...operation}) => { equal(typeof boundaryScope, 'string', label + '.operation scope'); return operation; }), expectedOperations, label + '.all-and-only receipt operations');
  const eventTicks = new Set(expectedEvents.map(event => event.tick)), retainedTicks = [0]; let lastRetained = 0;
  for (let tick = 1; tick <= finalTick; tick++) if (eventTicks.has(tick) || tick - lastRetained >= hz) { retainedTicks.push(tick); lastRetained = tick; }
  if (retainedTicks.at(-1) !== finalTick) retainedTicks.push(finalTick);
  equal(raw.retained.map(item => item.frameIndex), retainedTicks, label + '.retained exact coverage');
  raw.retained.forEach(item => { equal(item.seconds, item.frameIndex / hz, label + '.retained time'); equal(typeof item.basis, 'string', label + '.retained basis'); });
  const sampleTicks = []; for (let tick = 0, n = 0; tick < finalTick; tick += [5, 8, 11][n++ % 3]) sampleTicks.push(tick);
  equal(raw.compactTrace.map(item => item.tick), sampleTicks, label + '.actual feedback cadence');
  let keysBefore = [], changeIndex = 0;
  raw.compactTrace.forEach((compact, i) => {
    const frame = raw.frames[compact.tick], model = frame.state.model, keys = compact.keys;
    equal(keys.every(key => ['ArrowLeft', 'ArrowRight', 'Space', 'b'].includes(key)) && new Set(keys).size === keys.length && !(keys.includes('ArrowLeft') && keys.includes('ArrowRight')), true, label + '.ordinary keys');
    equal(compact, {tick: model.tick, keys, phase: model.phase, energyEU: model.energyEU, heatHU: model.heatHU, charging: model.charging,
      doseIndex: model.doseIndex, selectedDoseEU: model.selectedDoseEU, openedCount: model.openedCount, currentLockIndex: model.currentLockIndex,
      pulseCursor: model.pulseCursor, supply: model.supply, receiptCounts: frame.receiptPrefixLengths}, label + '.compact actual fields');
    if (!isDeepStrictEqual(keys, keysBefore)) { equal(raw.inputChanges[changeIndex++], {tick: model.tick, elapsed: model.elapsed, from: keysBefore, to: keys}, label + '.input change'); keysBefore = keys; }
    const timing = raw.pilotCallTimings[i];
    equal(timing.tick, model.tick, label + '.actual call tick'); equal(timing.returnedKeys, keys, label + '.actual returned keys');
    equal(Number.isFinite(timing.milliseconds) && timing.milliseconds >= 0, true, label + '.call duration');
  });
  equal(raw.inputChanges.length, changeIndex, label + '.all changes'); equal(raw.pilotCallTimings.length, raw.compactTrace.length, label + '.all call timings');
  let sampleIndex = 0;
  raw.intervalTrace.forEach((trace, tick) => {
    while (sampleIndex + 1 < raw.compactTrace.length && raw.compactTrace[sampleIndex + 1].tick <= tick) sampleIndex++;
    equal(trace.input, keyInput(raw.compactTrace[sampleIndex].keys), label + '.held input for actual interval');
  });
  equal(raw.final.model.phase, raw.mode === 'record' ? 'won' : 'lost', label + '.case outcome');
  if (raw.mode === 'loss') equal(raw.final.model.lostReason, raw.expectedReason, label + '.natural loss reason');
  return {frames: raw.frames.length, intervals: raw.intervalTrace.length, fullSnapshots: raw.frames.length + 2, retained: raw.retained.length,
    compactSamples: raw.compactTrace.length, eventWindows: raw.eventTransitions.length, operations: raw.operations.length, inputChanges: raw.inputChanges.length};
}

function checkAccounts(model, label) {
  const e = model.energyLedger, h = model.thermalLedger, p = parameters.physics;
  equal([model.energyEU, model.heatHU, ...Object.values(e), ...Object.values(h)].every(value => Number.isSafeInteger(value) && value >= 0), true, label + '.nonnegative integer accounts');
  equal(model.energyEU <= p.capacityEU, true, label + '.capacity');
  equal(e.offeredEU, e.harvestedGrossEU + e.missedEU, label + '.offered partition');
  equal(model.energyEU, p.initialEnergyEU + e.harvestedGrossEU - e.dischargedEU - e.overflowLostEU, label + '.energy balance');
  equal(e.dischargedEU, e.usefulToLocksEU + e.dischargeWasteEU, label + '.discharge partition');
  equal(e.usefulToLocksEU, model.locks.filter(lock => lock.status === 'open').reduce((sum, lock) => sum + lock.thresholdEU, 0), label + '.one credit per open lock');
  equal(model.heatHU, p.initialHeatHU + h.captureAddedHU + h.overflowAddedHU + h.dischargeAddedHU - h.cooledHU, label + '.thermal balance');
}

function observedCoverage(raw) {
  const coverage = {dischargeResults: {}, pulseResults: {}, exactThresholdOpens: 0, overThresholdOpens: 0, dischargeAndPulseSameInterval: 0,
    insufficientBeforeIncomingPulse: 0, chargingIntervals: 0, capacityEndpoints: 0, zeroHeatCooling: 0, cancelledIntervals: 0,
    epochChanges: 0, neutralAcknowledgements: 0, suppressedHeldB: 0, clippedAxisAttempts: 0, waitingForReserveIntervals: 0,
    optimisticEqualityStates: 0, coldAfterHotPeak: 0, finalBoundaryWin: 0, terminalWithRealInterval: 0};
  for (const receipt of raw.actualReceipts.dischargeReceipts) {
    coverage.dischargeResults[receipt.result] = (coverage.dischargeResults[receipt.result] || 0) + 1;
    coverage.exactThresholdOpens += Number(receipt.result === 'opened' && receipt.spentEU === receipt.usefulEU);
    coverage.overThresholdOpens += Number(receipt.result === 'opened' && receipt.spentEU > receipt.usefulEU);
    const pulse = raw.actualReceipts.pulseReceipts.find(item => item.endedTick === receipt.boundaryTick + 1);
    coverage.dischargeAndPulseSameInterval += Number(!!pulse);
    coverage.insufficientBeforeIncomingPulse += Number(receipt.result === 'insufficient_stock' && !!pulse?.charging && pulse.energyAfterEU >= receipt.selectedDoseEU);
  }
  for (const pulse of raw.actualReceipts.pulseReceipts) coverage.pulseResults[pulse.result] = (coverage.pulseResults[pulse.result] || 0) + 1;
  for (let tick = 1; tick < raw.frames.length; tick++) {
    const before = raw.frames[tick - 1].state.model, model = raw.frames[tick].state.model, input = model.lastInput;
    coverage.chargingIntervals += Number(model.charging); coverage.capacityEndpoints += Number(model.energyEU === model.capacityEU);
    coverage.zeroHeatCooling += Number(model.lastCooling?.cooledHU === 0); coverage.cancelledIntervals += Number(input.cancelled);
    coverage.epochChanges += Number(input.epochChanged); coverage.neutralAcknowledgements += Number(input.neutralAcknowledged);
    coverage.suppressedHeldB += Number((input.rawB || input.rawBPressed) && !input.freshB && !input.quarantinedBefore && !input.epochChanged && !input.cancelled);
    coverage.clippedAxisAttempts += Number(input.freshAxis && input.axisStep === 0);
    coverage.waitingForReserveIntervals += Number(before.openedCount === before.locks.length && before.energyEU < before.reserveEU);
    coverage.optimisticEqualityStates += Number(model.supply.optimisticAvailableEU === model.supply.requiredEU);
    coverage.coldAfterHotPeak += Number(model.lastStep.peakHeatHU >= model.heatLimitHU && model.heatHU < model.heatLimitHU);
  }
  const final = raw.final.model;
  coverage.finalBoundaryWin = Number(final.phase === 'won' && final.tick === final.deadlineTick);
  coverage.terminalWithRealInterval = Number(final.terminal?.endedTick === final.tick && final.lastStep?.fromTick === final.tick - 1);
  return coverage;
}

function auditRound(raw, label, entry) {
  const startAssertions = assertionCount, startFailures = failureCount, counts = checkBindings(raw, label);
  const difficulty = raw.initial.model.difficulty, seed = raw.initial.model.seed, physics = parameters.physics;
  equal([0, 1, 2].includes(difficulty), true, label + '.difficulty domain'); equal(Number.isSafeInteger(seed) && seed >= 0, true, label + '.seed domain');
  const scenario = parameters.scenarios[difficulty], controls = controlCalendar(raw.intervalTrace.map((trace, boundaryTick) => ({boundaryTick, input: trace.input})), physics);
  const book = eventBook(scenario, physics, controls.controls, controls.commands);
  compare(raw.actualReceipts.dischargeReceipts, book.dischargeReceipts, label + '.all independent discharge receipts');
  compare(raw.actualReceipts.pulseReceipts, book.pulseReceipts, label + '.all independent pulse receipts');
  const fullState = tick => ({width: 960, height: 540, schemaVersion: 1, seed, difficulty, level: difficulty + 1, levelName: scenario.name, scenarioId: scenario.id,
    identity: {gameId: 35, name: '脉冲储库', englishName: 'Pulse Vault', slug: 'pulse-vault', packageId: 'com.ecojust.pulsevaulttv', versionName: '0.1.0', versionCode: 1, seed, actionCount: 2},
    scenario, physics, capacityEU: physics.capacityEU, heatLimitHU: physics.heatLimitHU, reserveEU: scenario.reserveEU, deadlineTick: scenario.deadlineTick,
    doseOptionsEU: physics.doseOptionsEU, ...book.stateAt(tick),
    dischargeReceipts: book.dischargeReceipts.filter(receipt => receipt.boundaryTick < tick), pulseReceipts: book.pulseReceipts.filter(receipt => receipt.endedTick <= tick)});
  const compareModel = (actual, expected, scope, compressed = false) => {
    const {message, ...facts} = actual, expectedFacts = {...expected};
    if (compressed) for (const bank of BANKS) delete expectedFacts[bank];
    equal(typeof message, 'string', scope + '.display message'); compare(facts, expectedFacts, scope);
  };
  compareModel(raw.initial.model, fullState(0), label + '.initial');
  let firstTerminal = null;
  for (let tick = 0; tick < raw.frames.length; tick++) {
    const actual = raw.frames[tick].state.model, expected = fullState(tick);
    compareModel(actual, expected, label + '.frame' + tick, true); checkAccounts(actual, label + '.frame' + tick);
    if (expected.terminal && firstTerminal === null) firstTerminal = expected.terminal;
    if (tick < raw.final.model.tick) equal(expected.phase, 'playing', label + '.no earlier terminal');
  }
  equal(firstTerminal?.endedTick, raw.final.model.tick, label + '.first independently derived terminal');
  const expectedFinal = fullState(raw.final.model.tick);
  compareModel(raw.final.model, expectedFinal, label + '.final'); equal(raw.final.model.tick, entry.actualFixedTicks, label + '.manifest ticks');
  return {label, difficulty, level: difficulty + 1, passed: failureCount === startFailures, assertions: assertionCount - startAssertions,
    counts: {...counts, resourceEventIntervals: book.eventIntervals, heatAnchors: book.heat.anchors.length,
      dischargeReceipts: book.dischargeReceipts.length, pulseReceipts: book.pulseReceipts.length, coolingIntervals: Math.floor(book.horizon / physics.coolEveryTicks)},
    coverage: observedCoverage(raw), result: {phase: expectedFinal.phase, terminal: expectedFinal.terminal, tick: expectedFinal.tick, elapsed: expectedFinal.elapsed,
      score: expectedFinal.score, energyEU: expectedFinal.energyEU, heatHU: expectedFinal.heatHU, openedCount: expectedFinal.openedCount,
      pulseCursor: expectedFinal.pulseCursor, energyLedger: expectedFinal.energyLedger, thermalLedger: expectedFinal.thermalLedger, supply: expectedFinal.supply}};
}

function main() {
  const [indexArgument, outputArgument, approvedIndexSha256] = process.argv.slice(2);
  check(indexArgument && outputArgument && /^[a-f0-9]{64}$/.test(approvedIndexSha256 ?? ''), 'Usage: node independent-pulse-review.mjs PUBLIC_INDEX FRESH_OUTPUT ROOT_APPROVED_INDEX_SHA');
  const indexPath = path.resolve(indexArgument), outputPath = path.resolve(outputArgument);
  check(!fs.existsSync(outputPath), 'Refusing to overwrite an audit output directory');
  const runnerPath = fileURLToPath(import.meta.url), app = path.resolve(path.dirname(runnerPath), '..'), repo = path.resolve(app, '../../..'), scratch = path.resolve(repo, '../scratch');
  check(indexPath === path.join(scratch, 'hundred-games/pulse-vault/public-observations-first/index.json'), 'Only the approved first public projection is allowed');
  const contractPath = path.join(app, 'docs/model-contract.md'), interfacePath = path.join(app, 'docs/public-interface.md'), oraclePath = path.join(app, 'tests/pulse-interval-oracle.mjs');
  const indexBytes = fs.readFileSync(indexPath), index = JSON.parse(indexBytes);
  check(index.rounds.every(entry => /^level[123]-(record|loss)\.json$/.test(entry.file)), 'Unexpected public case path');
  const sourceFiles = [runnerPath, oraclePath, contractPath, interfacePath, indexPath, ...index.rounds.map(entry => path.join(path.dirname(indexPath), entry.file))];
  const portable = filename => filename.startsWith(repo + path.sep) ? 'repo:' + path.relative(repo, filename) : filename.startsWith(scratch + path.sep) ? 'scratch:' + path.relative(scratch, filename) : (() => {throw new Error('Source outside approved roots');})();
  const hashWindow = () => Object.fromEntries(sourceFiles.map(filename => [portable(filename), sha(fs.readFileSync(filename))]));
  fs.mkdirSync(outputPath, {recursive: false});
  const startedAt = new Date().toISOString(), startHashes = hashWindow(), rounds = []; let exception = null;
  try {
    check(equal([sha(indexBytes), startHashes[portable(indexPath)]], [approvedIndexSha256, approvedIndexSha256], 'approved public index and source window'), 'Public index changed');
    check(equal(startHashes[portable(contractPath)], CONTRACT_SHA, 'approved public contract'), 'Public contract changed');
    check(equal(startHashes[portable(interfacePath)], INTERFACE_SHA, 'approved public interface'), 'Public interface changed');
    equal(index.rounds.map(entry => entry.name), [1, 2, 3].flatMap(level => ['record', 'loss'].map(mode => `level${level}-${mode}`)), 'six original cases');
    equal(index.originalFilesUnchanged, true, 'root projection preserves original bytes');
    parameters = parseContract(fs.readFileSync(contractPath, 'utf8'));
    for (const run of index.sourceRuns) {
      equal(run.startHashes, run.endHashes, 'original ordinary source window'); equal(run.startHashes.contract, CONTRACT_SHA, 'original ordinary contract');
      equal(run.startHashes.publicInterface, INTERFACE_SHA, 'original ordinary interface');
    }
    for (const entry of index.rounds) {
      const filename = path.join(path.dirname(indexPath), entry.file);
      check(equal(startHashes[portable(filename)], entry.sha256, entry.name + '.projected bytes'), 'Projected bytes changed');
      equal(entry.sourceHashes, index.sourceRuns.find(run => run.sha256 === entry.originalReportSha256)?.startHashes, entry.name + '.original source binding');
      equal(entry.removedPaths, ['pilotDiagnostics'], entry.name + '.only diagnostics removed');
      const raw = JSON.parse(fs.readFileSync(filename, 'utf8')), result = auditRound(raw, entry.name, entry);
      rounds.push({...result, source: {file: entry.file, projectedSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, originalReportSha256: entry.originalReportSha256, sourceHashes: entry.sourceHashes}});
      process.stdout.write(JSON.stringify({case: entry.name, passed: result.passed, assertions: result.assertions, result: result.result}) + '\n');
      if (failureCount) break;
    }
  } catch (error) { exception = {name: error.name, message: error.message, stack: String(error.stack).split('\n').slice(0, 10)}; }
  const endHashes = hashWindow(), completedAt = new Date().toISOString(); equal(endHashes, startHashes, 'audit source window unchanged');
  const roundAssertions = rounds.reduce((sum, round) => sum + round.assertions, 0), totals = {};
  for (const round of rounds) for (const [key, value] of Object.entries(round.counts)) totals[key] = (totals[key] ?? 0) + value;
  const report = {schemaVersion: 1, game: 'pulse-vault', passed: !exception && failureCount === 0 && rounds.length === 6,
    method: 'Absolute finite periodic source prefixes; original-input-derived B attempts and effective charging; sparse discharge/pulse resource accounts; closed-form clipped cooling between heat-event anchors. All actual frames, complete intervals, lock and terminal outcomes and receipt copies are compared. No Model/pilot import, per-tick thermal integration, search or new gameplay.',
    limitations: ['Only the root-approved first six actual public ordinary cases. Formal synthetic boundaries, browser controls, pause/retry, rendering and video are separate evidence.',
      'Serialized observations prove values and historical copies, not object identity or Object.freeze. Only the two append-only receipt arrays use prefixes; mutable locks and ledgers remain full observations.',
      'Integer energy, heat, times, IDs and all threshold comparisons have zero tolerance. Elapsed time is derived from the explicitly parsed 60 Hz unit and also compared exactly.',
      'The necessary-energy failure is independently derived from optimistic remaining finite supply and minimum outstanding payments plus reserve; a nonnegative margin is not a proof that every such state can win.',
      'Original recorded keys and public input latch semantics are checked; unencountered cancellation, pressed aliases, pause, dt0 and invalid-dt behavior are not synthesized.',
      'Observed coverage is counted only from this corpus. Original raw/source hashes are bound via the approved lossless public manifest without reading diagnostic-bearing originals or production implementations.'],
    sources: {contract: {repoRelative: path.relative(repo, contractPath), sha256: CONTRACT_SHA}, publicInterface: {repoRelative: path.relative(repo, interfacePath), sha256: INTERFACE_SHA},
      oracle: {repoRelative: path.relative(repo, oraclePath), sha256: startHashes[portable(oraclePath)]}, runner: {repoRelative: path.relative(repo, runnerPath), sha256: startHashes[portable(runnerPath)]},
      publicIndex: {scratchRelative: path.relative(scratch, indexPath), sha256: sha(indexBytes)}, originalReportSha256: index.originalReportSha256,
      sourceRuns: index.sourceRuns.map(({path: filename, ...rest}) => ({scratchRelative: path.relative(scratch, filename), ...rest}))},
    sourceWindow: {startedAt, completedAt, startHashes, endHashes, unchanged: isDeepStrictEqual(startHashes, endHashes)},
    assertions: assertionCount, roundAssertions, globalAssertions: assertionCount - roundAssertions, failureCount, failures, exception,
    comparisonTolerance: {energyEU: 0, heatHU: 0, ticks: 0, elapsedSeconds: 0, gates: 0}, maximumErrors, totals, rounds};
  fs.writeFileSync(path.join(outputPath, 'report.json'), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  process.stdout.write(JSON.stringify({passed: report.passed, assertions: assertionCount, globalAssertions: report.globalAssertions, failureCount, maximumErrors, totals}) + '\n');
  process.exitCode = report.passed ? 0 : 1;
}

main();
