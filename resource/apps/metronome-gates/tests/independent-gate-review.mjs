// Offline audit of approved actual public observations. No Model/pilot imports or new gameplay.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {parseRules, queueCalendar, beatCalendar, clockAt, gateView} from './gate-event-oracle.mjs';
const copy = value => structuredClone(value);
const BUTTONS = ['a', 'b', 'aPressed', 'bPressed', 'start', 'select', 'startPressed', 'selectPressed', 'confirm', 'retry', 'cancelled'];
const initialSafety = () => ({cancelEpoch: null, quarantined: true, directionArmed: false, aArmed: false, bArmed: false, edgeOrdinals: {direction: 0, a: 0, b: 0}});
const armedView = state => ({direction: state.directionArmed, a: state.aArmed, b: state.bArmed});

export function normalizedInput(input, physics) {
  const valid = key => !Object.hasOwn(input, key) || Number.isFinite(input[key]);
  const numeric = key => Number.isFinite(input[key]) ? input[key] : 0;
  const raw = Object.fromEntries(['x', 'y', 'menuDelta', 'cancelEpoch'].map(key => [key, Number.isFinite(input[key]) ? input[key] : null]));
  for (const button of BUTTONS) raw[button] = input[button] === true;
  const x = Math.max(-1, Math.min(1, numeric('x'))), y = Math.max(-1, Math.min(1, numeric('y'))), menuDelta = numeric('menuDelta');
  const axesValid = valid('x') && valid('y'), menuDeltaValid = valid('menuDelta');
  const cancelEpoch = Number.isFinite(input.cancelEpoch) ? Math.floor(Math.max(0, input.cancelEpoch)) : 0;
  const fullNeutral = axesValid && Math.abs(x) <= physics.neutralAxisThreshold && Math.abs(y) <= physics.neutralAxisThreshold &&
    menuDeltaValid && menuDelta === 0 && BUTTONS.every(key => !raw[key]);
  return {raw, x, y, menuDelta, axesValid, menuDeltaValid, cancelEpoch, fullNeutral};
}

// Fold only the public input protocol over original valid calls. No queue/grid/game state is advanced here.
// All fresh flags and edge ordinals below are derived from raw input; observed lastInput is never an oracle input.
export function inputCalendar(inputs, physics) {
  let state = initialSafety(); const rows = [];
  for (const [index, input] of inputs.entries()) {
    const tick = index + 1, before = copy(state), normalized = normalizedInput(input ?? {}, physics);
    const epochChanged = normalized.cancelEpoch !== before.cancelEpoch;
    state = {...before, cancelEpoch: normalized.cancelEpoch, edgeOrdinals: {...before.edgeOrdinals}};
    if (epochChanged || normalized.raw.cancelled) state = {...state, quarantined: true, directionArmed: false, aArmed: false, bArmed: false};
    let mode, direction = null, neutralAcknowledged = false;
    const fresh = {direction: false, a: false, b: false};
    if (state.quarantined) {
      if (normalized.fullNeutral) {
        state = {...state, quarantined: false, directionArmed: true, aArmed: true, bArmed: true};
        neutralAcknowledged = true; mode = 'neutral_ack';
      } else mode = 'quarantine';
    } else {
      mode = 'active';
      if (normalized.axesValid) {
        const ax = Math.abs(normalized.x), ay = Math.abs(normalized.y);
        if (Math.max(ax, ay) <= physics.neutralAxisThreshold) state.directionArmed = true;
        if (Math.max(ax, ay) >= physics.directionAxisThreshold) {
          direction = ax > ay ? normalized.x > 0 ? 'right' : 'left' : normalized.y > 0 ? 'down' : 'up';
          if (state.directionArmed) { fresh.direction = true; state.directionArmed = false; state.edgeOrdinals.direction++; }
        }
      }
      for (const source of ['a', 'b']) {
        const down = normalized.raw[source] || normalized.raw[source + 'Pressed'], armed = source + 'Armed';
        fresh[source] = down && state[armed];
        if (fresh[source]) state.edgeOrdinals[source]++;
        state[armed] = !down;
      }
    }
    const lastInput = {tick, ...normalized, epochChanged, mode, quarantinedBefore: before.quarantined, quarantinedAfter: state.quarantined,
      neutralAcknowledged, armedBefore: armedView(before), armedAfter: armedView(state), direction, fresh, edgeOrdinals: {...state.edgeOrdinals}};
    rows.push({tick, inputState: copy(state), lastInput});
  }
  return {rows, initialSafety: initialSafety()};
}

export function reviewCalendar(scenario, physics, originalInputs) {
  const input = inputCalendar(originalInputs, physics), queue = queueCalendar(input.rows, physics), board = beatCalendar(scenario, physics, queue.consumptions);
  const queueByTick = new Map(), beatByTick = new Map(board.beatReceipts.map(receipt => [receipt.tick, receipt]));
  for (const receipt of queue.queueReceipts) {
    if (!queueByTick.has(receipt.tick)) queueByTick.set(receipt.tick, []);
    queueByTick.get(receipt.tick).push(receipt);
  }
  function stateAt(tick) {
    if (!Number.isSafeInteger(tick) || tick < 0 || tick > input.rows.length) throw new Error('Query outside actual valid input calls');
    const row = tick ? input.rows[tick - 1] : null, queueState = queue.at(tick), boardState = board.at(tick);
    const {tick: boardBoundaryTick, ...boardFacts} = boardState, lastQueueReceipts = copy(queueByTick.get(tick) ?? []), lastBeat = copy(beatByTick.get(tick) ?? null);
    const events = lastQueueReceipts.map(receipt => ({type: receipt.result === 'enqueued' ? 'enqueue' : receipt.result === 'undone' ? 'undo' : 'reject', tick, beatNo: receipt.beatNo}));
    if (lastBeat) {
      events.push({type: 'beat', tick, beatNo: lastBeat.beatNo});
      if (lastBeat.collectedMarkerId !== null) events.push({type: 'marker', tick, beatNo: lastBeat.beatNo});
      if (lastBeat.terminalReason !== null) events.push({type: boardState.phase === 'won' ? 'win' : 'lose', tick, beatNo: lastBeat.beatNo});
    }
    let lastStep = null;
    if (row) {
      const beforeClock = clockAt(tick - 1, scenario, physics), afterClock = clockAt(tick, scenario, physics), beforeQueue = queue.at(tick - 1), beforeBoard = board.at(tick - 1);
      lastStep = {fromTick: tick - 1, toTick: tick, fromBeatNo: beforeClock.beatNo, toBeatNo: afterClock.beatNo,
        phaseTicksBefore: beforeClock.beatPhaseTicks, phaseTicksAfter: afterClock.beatPhaseTicks, inputMode: row.lastInput.mode,
        queueBeforeIds: beforeQueue.queue.map(command => command.id), queueAfterIds: queueState.queue.map(command => command.id),
        queueReceiptIds: lastQueueReceipts.map(receipt => receipt.id), beatReceiptId: lastBeat?.id ?? null, consumedCommandId: lastBeat?.command?.id ?? null,
        positionBefore: copy(beforeBoard.player), positionAfter: copy(boardState.player), markersBeforeIds: [...beforeBoard.collectedMarkerIds], markersAfterIds: [...boardState.collectedMarkerIds],
        scoreBefore: beforeBoard.score, scoreAfter: boardState.score, terminalAfter: boardState.terminal?.reason ?? null};
    }
    return {...boardFacts, ...clockAt(tick, scenario, physics), markerCount: scenario.markers.length, queue: copy(queueState.queue), nextCommandId: queueState.nextCommandId,
      gateStates: gateView(Math.floor(tick / physics.ticksPerBeat), scenario, physics), inputState: copy(row?.inputState ?? input.initialSafety),
      lastInput: copy(row?.lastInput ?? null), lastQueueReceipts, lastBeat, lastStep, events};
  }
  return {input, queue, board, stateAt};
}

const DOCUMENTS = {
  contract: ['model-contract.md', 'df9b0af9f11fefa401eaae9c078d372935a3d2122855c0db5c8d554d70316c29'],
  publicInterface: ['public-interface.md', '5ef47ee50b82b908be3fa81f05a73f29e8d6d8957e15692c1bbf5221144f4540'],
  publicDesign: ['public-design.md', '722ffb614b0298ca5e839f9d37891f3e2d810435c16df70aebef648b2a2c55ea']};
const BANKS = ['queueReceipts', 'beatReceipts'], KEYS = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Space', 'b'];
let parameters, assertionCount = 0, failureCount = 0, maxAbsoluteNumericError = 0;
const failures = [], check = (ok, message) => { if (!ok) throw new Error(message); };
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const keyInput = keys => ({x: Number(keys.includes('ArrowRight')) - Number(keys.includes('ArrowLeft')), y: Number(keys.includes('ArrowDown')) - Number(keys.includes('ArrowUp')),
  menuDelta: 0, cancelEpoch: 0, a: keys.includes('Space'), b: keys.includes('b'), aPressed: false, bPressed: false,
  start: false, select: false, startPressed: false, selectPressed: false, confirm: false, retry: false, cancelled: false});

function equal(actual, expected, label) {
  assertionCount++; const matched = isDeepStrictEqual(actual, expected);
  if (!matched) { failureCount++; if (failures.length < 100) failures.push({label, actual: JSON.stringify(actual)?.slice(0, 700), expected: JSON.stringify(expected)?.slice(0, 700)}); }
  return matched;
}
function compare(actual, expected, label) {
  if (expected === null || typeof expected !== 'object') {
    if (typeof actual === 'number' && typeof expected === 'number') maxAbsoluteNumericError = Math.max(maxAbsoluteNumericError, Math.abs(actual - expected));
    equal(actual, expected, label); return;
  }
  equal(Array.isArray(actual), Array.isArray(expected), label + '.container'); check(actual !== null && typeof actual === 'object', label + ': missing object');
  equal(Object.keys(actual).sort(), Object.keys(expected).sort(), label + '.keys');
  for (const key of Object.keys(expected)) compare(actual[key], expected[key], label + '.' + key);
}
function expandFrame(raw, index) {
  const frame = raw.frames[index], result = {...frame.state, model: {...frame.state.model}};
  for (const bank of BANKS) result.model[bank] = raw.actualReceipts[bank].slice(0, frame.receiptPrefixLengths[bank]);
  return result;
}

function checkBindings(raw, label) {
  const finalTick = raw.final.model.tick, p = parameters.physics;
  check(equal(Number.isSafeInteger(finalTick) && finalTick > 0, true, label + '.finite valid horizon'), 'Invalid actual tick horizon');
  equal(raw.name, label, label + '.name'); equal(raw.passed, true, label + '.original passed'); equal(raw.failure, null, label + '.original failure');
  equal(raw.difficulty, raw.initial.model.difficulty, label + '.difficulty metadata'); equal(Number(label.match(/^level([123])-/)?.[1]), raw.initial.model.level, label + '.named level');
  equal(Object.hasOwn(raw, 'pilotDiagnostics'), false, label + '.public only'); equal(raw.evidenceEncoding.version, 3, label + '.encoding');
  equal(raw.evidenceEncoding.frameIndexBase, 0, label + '.frame base'); equal(raw.evidenceEncoding.frameIndexEqualsTick, true, label + '.frame clock');
  equal(raw.evidenceEncoding.receiptFields, BANKS, label + '.receipt fields'); equal(Object.keys(raw.actualReceipts).sort(), [...BANKS].sort(), label + '.two banks');
  check(equal([raw.frames.length, raw.intervalTrace.length], [finalTick + 1, finalTick], label + '.all actual frames and intervals'), 'Incomplete actual call sequence');
  equal(raw.actualFixedTicks, finalTick, label + '.actual fixed ticks'); equal(raw.cadenceTicks, [5, 8, 11], label + '.cadence');
  for (const bank of BANKS) {
    equal(raw.actualReceipts[bank], raw.final.model[bank], label + '.complete bank');
    raw.actualReceipts[bank].forEach((receipt, i) => {
      equal(receipt.id, i + 1, label + '.bank ID'); equal(Number.isSafeInteger(receipt.tick) && receipt.tick >= 1 && receipt.tick <= finalTick, true, label + '.receipt time domain');
      if (i) equal(receipt.tick >= raw.actualReceipts[bank][i - 1].tick, true, label + '.append order');
    });
  }
  const expectedEvents = [], expectedOperations = [];
  for (let i = 0; i < raw.frames.length; i++) {
    const frame = raw.frames[i], model = frame.state.model;
    equal(Object.keys(frame).sort(), ['frameIndex', 'receiptPrefixLengths', 'state', 'tick'], label + '.frame fields');
    check(equal([frame.frameIndex, frame.tick, model.tick], [i, i, i], label + '.consecutive actual model ticks'), 'Nonconsecutive actual ticks');
    equal(Object.keys(frame.receiptPrefixLengths).sort(), [...BANKS].sort(), label + '.prefix fields');
    for (const bank of BANKS) {
      equal(Object.hasOwn(model, bank), false, label + '.only bank omitted');
      equal(frame.receiptPrefixLengths[bank], raw.actualReceipts[bank].filter(receipt => receipt.tick <= i).length, label + '.exact bank prefix');
    }
    const {model: ignored, ...outer} = frame.state;
    equal(outer, {phase: model.phase, paused: false, level: model.difficulty, difficulty: model.difficulty, score: model.score}, label + '.actual wrapper');
    if (!i) continue;
    const before = raw.frames[i - 1].state.model, {input, dt, beforeFrameIndex, afterFrameIndex, ...lastStep} = raw.intervalTrace[i - 1];
    check(equal(before.phase, 'playing', label + '.actual call began playing'), 'Observed call after terminal');
    check(equal(Number.isFinite(dt) && dt > 0 && dt === 1 / p.ticksPerSecond, true, label + '.actual valid fixed dt'), 'Invalid/nonordinary dt');
    check(equal([beforeFrameIndex, afterFrameIndex, lastStep.fromTick, lastStep.toTick], [i - 1, i, i - 1, i], label + '.adjacent complete interval'), 'Invalid actual interval references');
    equal(lastStep, model.lastStep, label + '.complete actual lastStep'); equal(input, model.lastInput.raw, label + '.actual original input');
    equal([lastStep.fromBeatNo, lastStep.toBeatNo], [before.beatNo, model.beatNo], label + '.actual interval beat clock');
    if (i % p.ticksPerBeat !== 0) equal(model.player, before.player, label + '.no between-beat movement');
    const current = Object.fromEntries(BANKS.map(bank => [bank, raw.actualReceipts[bank].filter(receipt => receipt.tick === i)]));
    const receiptIds = Object.fromEntries(BANKS.map(bank => [bank, current[bank].map(receipt => receipt.id)]));
    equal(current.queueReceipts.length <= 3 && current.beatReceipts.length <= 1, true, label + '.receipt multiplicities');
    equal(model.lastQueueReceipts, current.queueReceipts, label + '.actual local queue receipts'); equal(model.lastBeat, current.beatReceipts[0] ?? null, label + '.actual local beat');
    equal(lastStep.queueReceiptIds, receiptIds.queueReceipts, label + '.interval queue IDs'); equal(lastStep.beatReceiptId, receiptIds.beatReceipts[0] ?? null, label + '.interval beat ID');
    if (BANKS.some(bank => receiptIds[bank].length) || before.phase !== model.phase) expectedEvents.push({tick: i, beatNo: model.beatNo, input, dt,
      beforeFrameIndex: i - 1, afterFrameIndex: i, receiptIds, actualLastStep: model.lastStep});
    for (const bank of BANKS) for (const receipt of current[bank]) expectedOperations.push({kind: bank, observedAt: i / p.ticksPerSecond, receipt, beforeFrameIndex: i - 1, afterFrameIndex: i});
  }
  equal(raw.initial, expandFrame(raw, 0), label + '.full initial'); equal(raw.final, expandFrame(raw, finalTick), label + '.full final');
  equal(raw.eventTransitions, expectedEvents, label + '.all-and-only event windows');
  equal(raw.operations.map(({boundaryScope, ...operation}) => { equal(typeof boundaryScope, 'string', label + '.scope'); return operation; }), expectedOperations, label + '.all-and-only operations');
  const eventTicks = new Set(expectedEvents.map(event => event.tick)), retainedTicks = [0]; let lastRetained = 0;
  for (let tick = 1; tick <= finalTick; tick++) if (eventTicks.has(tick) || tick - lastRetained >= p.ticksPerSecond) { retainedTicks.push(tick); lastRetained = tick; }
  if (retainedTicks.at(-1) !== finalTick) retainedTicks.push(finalTick);
  equal(raw.retained.map(item => item.frameIndex), retainedTicks, label + '.retained coverage');
  raw.retained.forEach(item => { equal(item.seconds, item.frameIndex / p.ticksPerSecond, label + '.retained time'); equal(typeof item.basis, 'string', label + '.retained basis'); });
  const sampleTicks = []; for (let tick = 0, n = 0; tick < finalTick; tick += [5, 8, 11][n++ % 3]) sampleTicks.push(tick);
  equal(raw.compactTrace.map(item => item.tick), sampleTicks, label + '.actual decision cadence');
  const timings = raw.pilotCallTimings.filter(item => item.terminalObservation !== true), terminalTimings = raw.pilotCallTimings.filter(item => item.terminalObservation === true);
  equal(timings.length, raw.compactTrace.length, label + '.actual decision timing count'); equal(terminalTimings.length <= 1, true, label + '.at most one terminal acknowledgement');
  for (const item of terminalTimings) {
    const {milliseconds, ...facts} = item; equal(facts, {tick: finalTick, returnedKeys: [], terminalObservation: true, applied: false}, label + '.terminal acknowledgement is not a new input');
    equal(Number.isFinite(milliseconds) && milliseconds >= 0, true, label + '.terminal timing'); equal(raw.pilotCallTimings.at(-1), item, label + '.terminal acknowledgement last');
  }
  let keysBefore = [], changeIndex = 0;
  raw.compactTrace.forEach((compact, i) => {
    const frame = raw.frames[compact.tick], m = frame.state.model, keys = compact.keys;
    equal(keys.every(key => KEYS.includes(key)) && new Set(keys).size === keys.length, true, label + '.ordinary keys');
    equal(compact, {tick: m.tick, beatNo: m.beatNo, beatPhaseTicks: m.beatPhaseTicks, ticksUntilBeat: m.ticksUntilBeat, keys, phase: m.phase, player: m.player,
      queueIds: m.queue.map(command => command.id), nextCommandId: m.nextCommandId, collectedMarkerIds: m.collectedMarkerIds, collectedCount: m.collectedCount,
      beatsRemaining: m.beatsRemaining, score: m.score, quarantined: m.inputState.quarantined, armed: armedView(m.inputState), edgeOrdinals: m.inputState.edgeOrdinals,
      receiptCounts: frame.receiptPrefixLengths}, label + '.compact seventeen actual fields');
    if (!isDeepStrictEqual(keys, keysBefore)) { equal(raw.inputChanges[changeIndex++], {tick: m.tick, beatNo: m.beatNo, elapsed: m.elapsed, from: keysBefore, to: keys}, label + '.input change'); keysBefore = keys; }
    const {milliseconds, ...facts} = timings[i]; equal(facts, {tick: m.tick, returnedKeys: keys}, label + '.actual decision timing fields');
    equal(Number.isFinite(milliseconds) && milliseconds >= 0, true, label + '.actual decision duration');
  });
  equal(raw.inputChanges.length, changeIndex, label + '.all original changes');
  let sampleIndex = 0;
  raw.intervalTrace.forEach((trace, tick) => { while (sampleIndex + 1 < raw.compactTrace.length && raw.compactTrace[sampleIndex + 1].tick <= tick) sampleIndex++;
    equal(trace.input, keyInput(raw.compactTrace[sampleIndex].keys), label + '.held keys match every supplied input'); });
  equal(raw.final.model.phase, raw.mode === 'record' ? 'won' : 'lost', label + '.case outcome');
  if (raw.mode === 'loss') equal(raw.final.model.lostReason, raw.expectedReason, label + '.natural loss reason');
  return {frames: raw.frames.length, intervals: raw.intervalTrace.length, fullSnapshots: raw.frames.length + 2, retained: raw.retained.length,
    compactSamples: raw.compactTrace.length, terminalAcknowledgements: terminalTimings.length, eventWindows: raw.eventTransitions.length, operations: raw.operations.length, inputChanges: raw.inputChanges.length};
}

function observedCoverage(raw) {
  const p = parameters.physics, coverage = {inputModes: {}, freshEdges: {direction: 0, a: 0, b: 0}, queueResults: {}, beatOutcomes: {}, gateChecksByPeriod: {},
    nonBeatIntervals: 0, nonBeatQueueEdits: 0, maxQueueLength: 0, multipleEditsSameTick: 0, sameTickEnqueueConsumption: 0, explicitWaits: 0, emptyWaits: 0,
    invalidAxes: 0, invalidMenu: 0, cancelledCalls: 0, epochChanges: 0, isolationBeats: 0, neutralAcknowledgements: 0, reentryAcknowledgements: 0,
    deadbandInputs: 0, verticalTies: 0, directionHeldWithoutFresh: 0, closedGateWaits: 0, closedOriginDepartures: 0, markerRevisits: 0,
    lockedExitVisits: 0, lastBudgetBeatWins: 0, lastBudgetBeatHazards: 0, terminalQueuedCommands: raw.final.model.queue.length};
  const increment = (map, key) => { map[key] = (map[key] ?? 0) + 1; };
  for (let tick = 1; tick < raw.frames.length; tick++) {
    const m = raw.frames[tick].state.model, input = m.lastInput, magnitude = Math.max(Math.abs(input.x), Math.abs(input.y));
    increment(coverage.inputModes, input.mode); for (const source of ['direction', 'a', 'b']) coverage.freshEdges[source] += Number(input.fresh[source]);
    coverage.nonBeatIntervals += Number(tick % p.ticksPerBeat !== 0); coverage.nonBeatQueueEdits += Number(tick % p.ticksPerBeat !== 0 && m.lastQueueReceipts.length > 0);
    coverage.maxQueueLength = Math.max(coverage.maxQueueLength, m.queue.length, ...m.lastQueueReceipts.map(receipt => receipt.queueAfterIds.length), m.lastBeat?.queueBeforeIds.length ?? 0);
    coverage.multipleEditsSameTick += Number(m.lastQueueReceipts.length > 1); coverage.invalidAxes += Number(!input.axesValid); coverage.invalidMenu += Number(!input.menuDeltaValid);
    coverage.cancelledCalls += Number(input.raw.cancelled); coverage.epochChanges += Number(input.epochChanged); coverage.neutralAcknowledgements += Number(input.neutralAcknowledged);
    coverage.reentryAcknowledgements += Number(input.neutralAcknowledged && tick > 1); coverage.isolationBeats += Number(input.mode !== 'active' && m.lastBeat !== null);
    coverage.deadbandInputs += Number(input.axesValid && magnitude > p.neutralAxisThreshold && magnitude < p.directionAxisThreshold);
    coverage.verticalTies += Number(input.mode === 'active' && input.axesValid && magnitude >= p.directionAxisThreshold && Math.abs(input.x) === Math.abs(input.y));
    coverage.directionHeldWithoutFresh += Number(input.mode === 'active' && input.direction !== null && !input.fresh.direction);
  }
  for (const receipt of raw.actualReceipts.queueReceipts) increment(coverage.queueResults, receipt.result);
  for (const beat of raw.actualReceipts.beatReceipts) {
    increment(coverage.beatOutcomes, beat.outcome); coverage.sameTickEnqueueConsumption += Number(beat.command !== null && beat.command.queuedTick === beat.tick);
    coverage.explicitWaits += Number(beat.waitSource === 'explicit'); coverage.emptyWaits += Number(beat.waitSource === 'empty');
    if (beat.gateCheck) increment(coverage.gateChecksByPeriod, `${beat.gateCheck.period}:${beat.gateCheck.open ? 'open' : 'closed'}`);
    const scenario = raw.initial.model.scenario, originGate = scenario.gates.find(gate => isDeepStrictEqual({x: gate.x, y: gate.y}, beat.from));
    const originClosed = originGate && !originGate.openResidues.includes(beat.beatNo % originGate.period);
    coverage.closedGateWaits += Number(Boolean(originClosed) && beat.outcome === 'waited');
    coverage.closedOriginDepartures += Number(Boolean(originClosed) && !isDeepStrictEqual(beat.from, beat.to));
    const marker = scenario.markers.find(item => item.x === beat.to.x && item.y === beat.to.y);
    coverage.markerRevisits += Number(beat.outcome === 'moved' && Boolean(marker) && beat.markersBeforeIds.includes(marker?.id));
    coverage.lockedExitVisits += Number(beat.outcome === 'moved' && isDeepStrictEqual(beat.to, scenario.exit) && beat.markersAfterIds.length < scenario.markers.length);
    coverage.lastBudgetBeatWins += Number(beat.remainingAfter === 0 && beat.terminalReason === 'all_markers_exit');
    coverage.lastBudgetBeatHazards += Number(beat.remainingAfter === 0 && ['trap', 'closed_gate'].includes(beat.terminalReason));
  }
  return coverage;
}

function auditRound(raw, label, entry) {
  const startAssertions = assertionCount, startFailures = failureCount, counts = checkBindings(raw, label), difficulty = raw.initial.model.difficulty, seed = raw.initial.model.seed;
  check(equal([0, 1, 2].includes(difficulty), true, label + '.difficulty domain'), 'Invalid scenario'); equal(Number.isFinite(seed) && Number.isInteger(seed), true, label + '.normalized seed');
  const scenario = parameters.scenarios[difficulty], physics = parameters.physics, calendar = reviewCalendar(scenario, physics, raw.intervalTrace.map(trace => trace.input));
  // Reject terminal extras BEFORE stateAt/clockAt queries can describe an impossible later model tick.
  check(equal(calendar.board.firstTerminal?.tick, raw.final.model.tick, label + '.independent first terminal is exact actual horizon'), 'Actual frames extend beyond or end before independent first terminal');
  compare(raw.actualReceipts.queueReceipts, calendar.queue.queueReceipts, label + '.independent full queue bank'); compare(raw.actualReceipts.beatReceipts, calendar.board.beatReceipts, label + '.independent full beat bank');
  const fullState = tick => ({width: 960, height: 540, schemaVersion: 1, seed, difficulty, level: difficulty + 1, levelName: scenario.name, scenarioId: scenario.id,
    identity: {gameId: 37, name: '节拍闸道', englishName: 'Metronome Gates', slug: 'metronome-gates', packageId: 'com.ecojust.metronomegatestv', versionName: '0.1.0', versionCode: 1, seed, actionCount: 2},
    physics, scenario, ...calendar.stateAt(tick), queueReceipts: calendar.queue.queueReceipts.filter(receipt => receipt.tick <= tick), beatReceipts: calendar.board.beatReceipts.filter(receipt => receipt.tick <= tick)});
  const compareModel = (actual, expected, scope, compressed = false) => {
    const {message, ...facts} = actual, expectedFacts = {...expected}; if (compressed) for (const bank of BANKS) delete expectedFacts[bank];
    equal(typeof message, 'string', scope + '.display message'); compare(facts, expectedFacts, scope);
  };
  compareModel(raw.initial.model, fullState(0), label + '.initial');
  raw.frames.forEach((frame, tick) => { const expected = fullState(tick); compareModel(frame.state.model, expected, label + '.frame' + tick, true);
    if (tick < raw.final.model.tick) equal(expected.phase, 'playing', label + '.no earlier terminal'); });
  const expectedFinal = fullState(raw.final.model.tick); compareModel(raw.final.model, expectedFinal, label + '.final'); equal(expectedFinal.tick, entry.actualFixedTicks, label + '.manifest ticks');
  const enqueued = raw.actualReceipts.queueReceipts.filter(receipt => receipt.result === 'enqueued').map(receipt => receipt.command.id);
  const undone = raw.actualReceipts.queueReceipts.filter(receipt => receipt.result === 'undone').map(receipt => receipt.command.id);
  const consumed = raw.actualReceipts.beatReceipts.filter(receipt => receipt.command !== null).map(receipt => receipt.command.id);
  const retained = raw.final.model.queue.map(command => command.id), partition = [...undone, ...consumed, ...retained];
  equal(enqueued, Array.from({length: expectedFinal.nextCommandId - 1}, (_, i) => i + 1), label + '.accepted IDs never reused');
  equal(partition.sort((a, b) => a - b), enqueued, label + '.commands exactly undone consumed or retained'); equal(new Set(partition).size, partition.length, label + '.unique command ownership');
  return {label, difficulty, level: difficulty + 1, passed: failureCount === startFailures, assertions: assertionCount - startAssertions,
    counts: {...counts, queueCalendarBoundaries: calendar.queue.boundaries.length - 1, queueReceipts: calendar.queue.queueReceipts.length, beatReceipts: calendar.board.beatReceipts.length,
      commandsEnqueued: enqueued.length, commandsUndone: undone.length, commandsConsumed: consumed.length, commandsRetained: retained.length}, coverage: observedCoverage(raw),
    result: {phase: expectedFinal.phase, terminal: expectedFinal.terminal, tick: expectedFinal.tick, elapsed: expectedFinal.elapsed, beatNo: expectedFinal.beatNo,
      beatPhaseTicks: expectedFinal.beatPhaseTicks, ticksUntilBeat: expectedFinal.ticksUntilBeat, beatsRemaining: expectedFinal.beatsRemaining, player: expectedFinal.player,
      collectedMarkerIds: expectedFinal.collectedMarkerIds, collectedCount: expectedFinal.collectedCount, exitUnlocked: expectedFinal.exitUnlocked,
      score: expectedFinal.score, nextCommandId: expectedFinal.nextCommandId, queue: expectedFinal.queue, edgeOrdinals: expectedFinal.inputState.edgeOrdinals}};
}

function main() {
  const [indexArgument, outputArgument, approvedIndexSha256] = process.argv.slice(2);
  check(indexArgument && outputArgument && /^[a-f0-9]{64}$/.test(approvedIndexSha256 ?? ''), 'Usage: node independent-gate-review.mjs PUBLIC_INDEX FRESH_OUTPUT ROOT_APPROVED_INDEX_SHA');
  const indexPath = path.resolve(indexArgument), outputPath = path.resolve(outputArgument), runnerPath = fileURLToPath(import.meta.url);
  check(!fs.existsSync(outputPath), 'Refusing to overwrite prior audit output');
  const app = path.resolve(path.dirname(runnerPath), '..'), repo = path.resolve(app, '../../..'), scratch = path.resolve(repo, '../scratch');
  check(indexPath === path.join(scratch, 'hundred-games/metronome-gates/public-observations-first/index.json'), 'Only approved first public projection is allowed');
  const documentPaths = Object.fromEntries(Object.entries(DOCUMENTS).map(([key, [filename]]) => [key, path.join(app, 'docs', filename)])), oraclePath = path.join(app, 'tests/gate-event-oracle.mjs');
  const indexBytes = fs.readFileSync(indexPath), index = JSON.parse(indexBytes);
  check(index.rounds.every(entry => /^level[123]-(record|loss)\.json$/.test(entry.file)), 'Unexpected public case path');
  const sourceFiles = [runnerPath, oraclePath, ...Object.values(documentPaths), indexPath, ...index.rounds.map(entry => path.join(path.dirname(indexPath), entry.file))];
  const portable = filename => filename.startsWith(repo + path.sep) ? 'repo:' + path.relative(repo, filename) : filename.startsWith(scratch + path.sep) ? 'scratch:' + path.relative(scratch, filename) : (() => { throw new Error('Source outside approved roots'); })();
  const hashWindow = () => Object.fromEntries(sourceFiles.map(filename => [portable(filename), sha(fs.readFileSync(filename))]));
  fs.mkdirSync(outputPath, {recursive: false}); const startedAt = new Date().toISOString(), startHashes = hashWindow(), rounds = []; let exception = null;
  try {
    check(equal([sha(indexBytes), startHashes[portable(indexPath)]], [approvedIndexSha256, approvedIndexSha256], 'approved public index/window'), 'Public index changed');
    for (const [key, [, pin]] of Object.entries(DOCUMENTS)) check(equal(startHashes[portable(documentPaths[key])], pin, 'approved ' + key), 'Public document changed');
    equal(index.rounds.map(entry => entry.name), [1, 2, 3].flatMap(level => ['record', 'loss'].map(mode => `level${level}-${mode}`)), 'six original cases'); equal(index.originalFilesUnchanged, true, 'original bytes preserved by root projection');
    parameters = parseRules(fs.readFileSync(documentPaths.publicDesign, 'utf8'), fs.readFileSync(documentPaths.contract, 'utf8'), fs.readFileSync(documentPaths.publicInterface, 'utf8'));
    for (const run of index.sourceRuns) { equal(run.startHashes, run.endHashes, 'original ordinary source window'); for (const [key, [, pin]] of Object.entries(DOCUMENTS)) equal(run.startHashes[key], pin, 'original ordinary ' + key); }
    for (const entry of index.rounds) {
      const filename = path.join(path.dirname(indexPath), entry.file); check(equal(startHashes[portable(filename)], entry.sha256, entry.name + '.projected bytes'), 'Projected bytes changed');
      equal(entry.sourceHashes, index.sourceRuns.find(run => run.sha256 === entry.originalReportSha256)?.startHashes, entry.name + '.original source binding'); equal(entry.removedPaths, ['pilotDiagnostics'], entry.name + '.only diagnostics removed');
      const result = auditRound(JSON.parse(fs.readFileSync(filename, 'utf8')), entry.name, entry);
      rounds.push({...result, source: {file: entry.file, projectedSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, originalReportSha256: entry.originalReportSha256, sourceHashes: entry.sourceHashes}});
      process.stdout.write(JSON.stringify({case: entry.name, passed: result.passed, assertions: result.assertions, result: result.result}) + '\n'); if (failureCount) break;
    }
  } catch (error) { exception = {name: error.name, message: error.message, stack: String(error.stack).split('\n').slice(0, 10)}; }
  const endHashes = hashWindow(), completedAt = new Date().toISOString(); equal(endHashes, startHashes, 'independent source window unchanged');
  const roundAssertions = rounds.reduce((sum, round) => sum + round.assertions, 0), totals = {};
  for (const round of rounds) for (const [key, value] of Object.entries(round.counts)) totals[key] = (totals[key] ?? 0) + value;
  const report = {schemaVersion: 1, game: 'metronome-gates', passed: !exception && failureCount === 0 && rounds.length === 6,
    method: 'Original raw inputs independently determine neutral/epoch gates, direction and button edges. Only fresh-input times and absolute beat boundaries form the queue transaction calendar. FIFO identities drive one public-grid classification per beat; integer modular gates and actual arrival prefixes determine marker ownership, score and the first terminal. Every actual frame/lastStep/receipt is compared; no Model/pilot import, route search, new gameplay or empty-tick game-state replay.',
    limitations: ['Only the approved first six public ordinary cases. Formal synthetic boundaries, browser controller/pause/disconnect/retry and recording evidence are separate.',
      'This corpus contains valid fixed positive-dt playing calls. Invalid dt, gaps, calls after an observed terminal or frames past the independently derived first terminal are rejected; invalid-dt and post-terminal no-op behavior is not claimed as ordinary coverage.',
      'Full-capacity, undo, simultaneous edits, same-boundary enqueue/consume, invalid input, cancel reentry and final-budget victory/hazard are counted only when actually observed; no fixtures or extra routes are created.',
      'An optional terminal observation timing acknowledges an existing terminal receipt and applies no input. It is bound separately and never counted as a new interval.',
      'All integer identities, clocks, coordinates, gate residues and priorities use exact comparison with no epsilon. Numeric error is reported in each original field unit; elapsed derives from tick/60.',
      'Only queueReceipts and beatReceipts are prefix encoded. Mutable queue/player/markers/input/last fields remain full actual observations; serialized equality cannot prove object identity or Object.freeze.',
      'Production/pilot/raw diagnostic-bearing originals are not read. Their byte identities and ordinary source window are bound through the root-approved public projection; no future-route or feasibility material is used.'],
    sources: {...Object.fromEntries(Object.entries(DOCUMENTS).map(([key, [, pin]]) => [key, {repoRelative: path.relative(repo, documentPaths[key]), sha256: pin}])),
      oracle: {repoRelative: path.relative(repo, oraclePath), sha256: startHashes[portable(oraclePath)]}, runner: {repoRelative: path.relative(repo, runnerPath), sha256: startHashes[portable(runnerPath)]},
      publicIndex: {scratchRelative: path.relative(scratch, indexPath), sha256: sha(indexBytes)}, originalReportSha256: index.originalReportSha256,
      sourceRuns: index.sourceRuns.map(({path: filename, ...rest}) => ({scratchRelative: path.relative(scratch, filename), ...rest}))},
    sourceWindow: {startedAt, completedAt, startHashes, endHashes, unchanged: isDeepStrictEqual(startHashes, endHashes)}, assertions: assertionCount, roundAssertions,
    globalAssertions: assertionCount - roundAssertions, failureCount, failures, exception, comparisonTolerance: 0, maxAbsoluteNumericError, totals, rounds};
  fs.writeFileSync(path.join(outputPath, 'report.json'), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  process.stdout.write(JSON.stringify({passed: report.passed, assertions: assertionCount, globalAssertions: report.globalAssertions, failureCount, maxAbsoluteNumericError, totals}) + '\n'); process.exitCode = report.passed ? 0 : 1;
}

main();
