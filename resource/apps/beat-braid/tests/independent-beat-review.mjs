// Offline audit of actual public observations; no Model/pilot imports or new gameplay.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {parseRules, braidCalendar} from './beat-interval-oracle.mjs';
const copy = value => structuredClone(value);
const BUTTONS = ['a', 'b', 'aPressed', 'bPressed', 'start', 'select', 'startPressed', 'selectPressed', 'confirm', 'retry', 'cancelled'];
const initialSafety = () => ({cancelEpoch: null, quarantined: true, recoveryRemainingTicks: 0, aArmed: false, bArmed: false, edgeOrdinals: {left: 0, right: 0}});
const finiteRaw = value => Number.isFinite(value) ? value : null;

export function normalizedInput(input, physics) {
  const valid = key => !Object.hasOwn(input, key) || Number.isFinite(input[key]);
  const numeric = key => Number.isFinite(input[key]) ? input[key] : 0;
  const x = Math.max(-1, Math.min(1, numeric('x'))), y = Math.max(-1, Math.min(1, numeric('y')));
  const axesValid = valid('x') && valid('y'), menuDeltaValid = valid('menuDelta'), menuDelta = numeric('menuDelta');
  const raw = {x: finiteRaw(input.x), y: finiteRaw(input.y), menuDelta: finiteRaw(input.menuDelta), cancelEpoch: finiteRaw(input.cancelEpoch),
    ...Object.fromEntries(BUTTONS.map(key => [key, input[key] === true]))};
  const cancelEpoch = Number.isFinite(input.cancelEpoch) ? Math.floor(Math.max(0, input.cancelEpoch)) : 0;
  const fullNeutral = axesValid && menuDeltaValid && Math.abs(x) <= physics.neutralAxisThreshold && Math.abs(y) <= physics.neutralAxisThreshold &&
    menuDelta === 0 && BUTTONS.every(key => !raw[key]);
  return {raw, x, y, menuDelta, axesValid, menuDeltaValid, cancelEpoch, fullNeutral};
}

// Only the public safety/latch protocol is folded in call order. No tap, hold, segment or score is advanced here.
// Active time is the ordinal of running rows, not the number of raw calls or elapsed wall time.
export function clockCalendar(inputs, physics) {
  let state = initialSafety(), activeTick = 0;
  const steps = [], running = [];
  for (const [index, input] of inputs.entries()) {
    const tick = index + 1, before = copy(state), fromActiveTick = activeTick, n = normalizedInput(input ?? {}, physics);
    const epochChanged = n.cancelEpoch !== before.cancelEpoch;
    state = {...before, cancelEpoch: n.cancelEpoch, edgeOrdinals: {...before.edgeOrdinals}};
    if (epochChanged || n.raw.cancelled) state = {...state, quarantined: true, recoveryRemainingTicks: 0, aArmed: false, bArmed: false};
    let mode, neutralAcknowledged = false;
    const held = {left: false, right: false}, fresh = {left: false, right: false};
    if (state.quarantined) {
      if (n.fullNeutral) {
        state = {...state, quarantined: false, recoveryRemainingTicks: physics.recoveryTicks, aArmed: true, bArmed: true};
        neutralAcknowledged = true; mode = 'neutral_ack';
      } else mode = 'quarantine';
    } else {
      for (const [lane, button, pressed, armed] of [['left', 'a', 'aPressed', 'aArmed'], ['right', 'b', 'bPressed', 'bArmed']]) {
        held[lane] = n.raw[button];
        const down = n.raw[button] || n.raw[pressed];
        fresh[lane] = down && state[armed];
        if (fresh[lane]) state.edgeOrdinals[lane]++;
        state[armed] = !down;
      }
      if (state.recoveryRemainingTicks > 0) { mode = 'preparing'; state.recoveryRemainingTicks--; }
      else { mode = 'running'; activeTick++; }
    }
    const clockMode = state.quarantined ? 'quarantine' : state.recoveryRemainingTicks > 0 ? 'preparing' : 'running';
    const lastInput = {tick, ...n, epochChanged, quarantinedBefore: before.quarantined, quarantinedAfter: state.quarantined,
      recoveryBefore: before.recoveryRemainingTicks, recoveryAfter: state.recoveryRemainingTicks, neutralAcknowledged,
      aArmedBefore: before.aArmed, aArmedAfter: state.aArmed, bArmedBefore: before.bArmed, bArmedAfter: state.bArmed,
      held: {...held}, fresh: {...fresh}, edgeOrdinals: {...state.edgeOrdinals}};
    const row = {tick, fromActiveTick, activeTick, mode, clockMode, held, fresh, edgeOrdinals: {...state.edgeOrdinals},
      inputState: copy(state), lastInput};
    steps.push(row); if (mode === 'running') running.push(row);
  }
  return {steps, running, initialSafety: initialSafety()};
}

export function reviewCalendar(scenario, physics, inputs) {
  const clock = clockCalendar(inputs, physics), braid = braidCalendar(scenario, physics, clock.running);
  const tapsByTick = new Map(braid.tapReceipts.map(receipt => [receipt.resolvedTick, receipt]));
  const segmentsByTick = new Map(braid.segmentReceipts.map(receipt => [receipt.resolvedTick, receipt]));
  function stateAt(tick) {
    if (!Number.isSafeInteger(tick) || tick < 0 || tick > clock.steps.length) throw new Error('Query outside actual input calls');
    const row = tick === 0 ? null : clock.steps[tick - 1], activeTick = row?.activeTick ?? 0, progress = braid.progressAt(activeTick);
    const tap = tapsByTick.get(tick) || null, segment = segmentsByTick.get(tick) || null, events = [];
    if (tap?.result === 'hit') events.push({type: 'hit', tick, activeTick});
    if (segment) events.push({type: segment.result, tick, activeTick});
    if (progress.terminal?.endedTick === tick) events.push({type: progress.phase === 'won' ? 'win' : 'lose', tick, activeTick});
    let lastStep = null;
    if (row) {
      const before = braid.progressAt(row.fromActiveTick), running = row.mode === 'running';
      const processedSegmentIndex = running ? Math.floor((activeTick - 1) / physics.segmentTicks) : null;
      const processedLocalTick = running ? (activeTick - 1) % physics.segmentTicks + 1 : null;
      const holdChecked = running && processedLocalTick >= physics.holdStartLocalTick && processedLocalTick <= physics.holdEndLocalTick;
      const holdPresent = holdChecked ? row.held[scenario.segments[processedSegmentIndex].holdLane] : null;
      lastStep = {fromTick: tick - 1, toTick: tick, fromActiveTick: row.fromActiveTick, toActiveTick: activeTick, mode: row.mode,
        processedSegmentIndex, processedLocalTick, holdChecked, holdPresent, holdMissingAdded: Number(holdChecked && !holdPresent),
        tapReceiptId: tap?.id ?? null, segmentReceiptId: segment?.id ?? null, scoreBefore: before.score, scoreAfter: progress.score,
        tapHitsAdded: progress.tapHitCount - before.tapHitCount, tapMissesAdded: progress.tapMissCount - before.tapMissCount,
        completedSegmentsAdded: progress.completedSegments - before.completedSegments, wovenSegmentsAdded: progress.wovenSegments - before.wovenSegments,
        breaksAdded: progress.breaks - before.breaks, streakBefore: before.currentStreak, streakAfter: progress.currentStreak,
        recoveryBefore: row.lastInput.recoveryBefore, recoveryAfter: row.lastInput.recoveryAfter, terminalAfter: copy(progress.terminal)};
    }
    return {tick, elapsed: tick / physics.ticksPerSecond, activeTick, activeElapsed: activeTick / physics.ticksPerSecond,
      clockMode: row?.clockMode ?? 'quarantine', ...progress, inputState: copy(row?.inputState ?? clock.initialSafety),
      effectiveHeld: copy(row?.held ?? {left: false, right: false}), events, lastInput: copy(row?.lastInput ?? null),
      lastTap: copy(tap), lastSegment: copy(segment), lastStep};
  }
  return {clock, braid, stateAt};
}

const CONTRACT_SHA = '23b6328f9b5aa6506570f5bd5940fe0ea7f381b6f2272d221356555452d1d725';
const INTERFACE_SHA = '026fd01bb622e605c6d148ba76c576511a395674ef30b331bbfbd7efadbfe33d';
const BANKS = ['tapReceipts', 'segmentReceipts'];
let parameters, assertionCount = 0, failureCount = 0;
const failures = [], maximumErrors = {modelTicks: 0, activeTicks: 0, score: 0, counts: 0, elapsedSeconds: 0};
const check = (condition, message) => { if (!condition) throw new Error(message); };
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const keyInput = keys => ({x: 0, y: 0, menuDelta: 0, cancelEpoch: 0, a: keys.includes('Space'), b: keys.includes('b'),
  aPressed: false, bPressed: false, start: false, select: false, startPressed: false, selectPressed: false, confirm: false, retry: false, cancelled: false});

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
      const key = /(?:ActiveTick|activeTick|LocalTick|localTick)$/.test(label) ? 'activeTicks' : /(?:Tick|tick)$/.test(label) ? 'modelTicks' :
        /(?:score|Score|scoreBefore|scoreAfter|chainBonus)$/.test(label) ? 'score' : /(?:Count|Ticks|Streak|Segments|breaks|tapHits|missedTaps)$/.test(label) ? 'counts' : /(?:Elapsed|elapsed)$/.test(label) ? 'elapsedSeconds' : null;
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
  equal(raw.evidenceEncoding.frameIndexEqualsTick, true, label + '.model frame clock'); equal(raw.evidenceEncoding.receiptFields, BANKS, label + '.receipt fields');
  equal(Object.keys(raw.actualReceipts).sort(), [...BANKS].sort(), label + '.bank keys');
  equal(raw.actualFixedTicks, finalTick, label + '.actual fixed ticks'); equal(raw.frames.length, finalTick + 1, label + '.all model-tick frames');
  equal(raw.intervalTrace.length, finalTick, label + '.all real intervals including gated calls');
  for (const bank of BANKS) {
    equal(raw.actualReceipts[bank], raw.final.model[bank], label + '.complete final bank');
    raw.actualReceipts[bank].forEach((receipt, i) => {
      equal(receipt.id, i + 1, label + '.receipt ID');
      equal(Number.isSafeInteger(receipt.resolvedTick) && receipt.resolvedTick >= 1 && receipt.resolvedTick <= finalTick, true, label + '.receipt model clock');
      if (i) equal(receipt.resolvedTick >= raw.actualReceipts[bank][i - 1].resolvedTick, true, label + '.bank append order');
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
      equal(frame.receiptPrefixLengths[bank], raw.actualReceipts[bank].filter(receipt => receipt.resolvedTick <= i).length, label + '.exact model-clock bank prefix');
    }
    const {model: ignored, ...outer} = frame.state;
    equal(outer, {phase: model.phase, paused: false, level: model.difficulty, difficulty: model.difficulty, score: model.score}, label + '.wrapper');
    if (!i) continue;
    const {input, beforeFrameIndex, afterFrameIndex, ...lastStep} = raw.intervalTrace[i - 1], before = raw.frames[i - 1].state.model;
    equal(beforeFrameIndex, i - 1, label + '.interval before frame'); equal(afterFrameIndex, i, label + '.interval after frame');
    equal(lastStep, model.lastStep, label + '.complete actual lastStep'); equal(input, model.lastInput.raw, label + '.complete ordinary raw input');
    equal([lastStep.fromTick, lastStep.toTick], [i - 1, i], label + '.interval model clock');
    equal([lastStep.fromActiveTick, lastStep.toActiveTick], [before.activeTick, model.activeTick], label + '.interval active clock');
    equal(model.activeTick - before.activeTick, Number(lastStep.mode === 'running'), label + '.only running advances active clock');
    const current = Object.fromEntries(BANKS.map(bank => [bank, raw.actualReceipts[bank].filter(receipt => receipt.resolvedTick === i)]));
    const receiptIds = Object.fromEntries(BANKS.map(bank => [bank, current[bank].map(receipt => receipt.id)]));
    for (const [bank, lastKey, idKey] of [['tapReceipts', 'lastTap', 'tapReceiptId'], ['segmentReceipts', 'lastSegment', 'segmentReceiptId']]) {
      equal(current[bank].length <= 1, true, label + '.one event of each kind per interval');
      equal(model[lastKey], current[bank][0] ?? null, label + '.actual local event');
      equal(lastStep[idKey], current[bank][0]?.id ?? null, label + '.interval event ID');
    }
    if (BANKS.some(bank => receiptIds[bank].length) || before.phase !== model.phase) expectedEvents.push({tick: i, activeTick: model.activeTick, input,
      beforeFrameIndex: i - 1, afterFrameIndex: i, receiptIds, actualLastStep: model.lastStep});
    for (const bank of BANKS) for (const receipt of current[bank]) expectedOperations.push({kind: bank, observedAt: i / hz, receipt, beforeFrameIndex: i - 1, afterFrameIndex: i});
  }
  equal(raw.initial, expandFrame(raw, 0), label + '.full initial expansion'); equal(raw.final, expandFrame(raw, finalTick), label + '.full final expansion');
  equal(raw.eventTransitions, expectedEvents, label + '.all-and-only event windows');
  equal(raw.operations.map(({boundaryScope, ...operation}) => { equal(typeof boundaryScope, 'string', label + '.operation scope'); return operation; }), expectedOperations, label + '.all-and-only receipt operations');
  const eventTicks = new Set(expectedEvents.map(event => event.tick)), retainedTicks = [0]; let lastRetained = 0;
  for (let tick = 1; tick <= finalTick; tick++) if (eventTicks.has(tick) || tick - lastRetained >= hz) { retainedTicks.push(tick); lastRetained = tick; }
  if (retainedTicks.at(-1) !== finalTick) retainedTicks.push(finalTick);
  equal(raw.retained.map(item => item.frameIndex), retainedTicks, label + '.retained exact coverage');
  raw.retained.forEach(item => { equal(item.seconds, item.frameIndex / hz, label + '.retained model time'); equal(typeof item.basis, 'string', label + '.retained basis'); });
  const sampleTicks = []; for (let tick = 0, n = 0; tick < finalTick; tick += [5, 8, 11][n++ % 3]) sampleTicks.push(tick);
  equal(raw.compactTrace.map(item => item.tick), sampleTicks, label + '.actual model-clock feedback cadence');
  let keysBefore = [], changeIndex = 0;
  raw.compactTrace.forEach((compact, i) => {
    const frame = raw.frames[compact.tick], m = frame.state.model, keys = compact.keys;
    equal(keys.every(key => ['Space', 'b'].includes(key)) && new Set(keys).size === keys.length, true, label + '.ordinary held keys');
    equal(compact, {tick: m.tick, activeTick: m.activeTick, keys, phase: m.phase, clockMode: m.clockMode,
      recoveryRemainingTicks: m.inputState.recoveryRemainingTicks, effectiveHeld: m.effectiveHeld, armed: {left: m.inputState.aArmed, right: m.inputState.bArmed},
      edgeOrdinals: m.inputState.edgeOrdinals, currentSegmentIndex: m.currentSegmentIndex, localTick: m.localTick, completedSegments: m.completedSegments,
      wovenSegments: m.wovenSegments, breaks: m.breaks, currentStreak: m.currentStreak, longestStreak: m.longestStreak,
      tapHitCount: m.tapHitCount, tapMissCount: m.tapMissCount, score: m.score, receiptCounts: frame.receiptPrefixLengths}, label + '.compact twenty actual fields');
    if (!isDeepStrictEqual(keys, keysBefore)) {
      equal(raw.inputChanges[changeIndex++], {tick: m.tick, activeTick: m.activeTick, elapsed: m.elapsed, activeElapsed: m.activeElapsed, from: keysBefore, to: keys}, label + '.input change'); keysBefore = keys;
    }
    const timing = raw.pilotCallTimings[i];
    equal(timing.tick, m.tick, label + '.actual call model tick'); equal(timing.returnedKeys, keys, label + '.actual returned keys');
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

function checkProgress(model, label) {
  const completed = model.segmentStates.filter(state => ['woven', 'frayed'].includes(state.status));
  equal(model.completedSegments, completed.length, label + '.completed segment partition');
  equal(model.wovenSegments + model.breaks, model.completedSegments, label + '.once per segment break count');
  equal(model.tapHitCount + model.tapMissCount, model.segmentStates.reduce((sum, state) => sum + state.tapHits + state.missedTaps, 0), label + '.resolved tap partition');
  equal(model.score, parameters.physics.tapHitScore * model.tapHitCount + parameters.physics.wovenSegmentScore * model.wovenSegments + model.chainBonus, label + '.score ledger');
  for (const state of completed) equal(state.holdCheckedTicks, parameters.physics.holdEndLocalTick - parameters.physics.holdStartLocalTick + 1, label + '.complete hold interval');
}

function observedCoverage(raw) {
  const coverage = {modes: {}, tapResults: {}, segmentResults: {}, actualCrossings: {}, freshEdges: {left: 0, right: 0}, preparingFreshEdges: 0,
    simultaneousFreshIntervals: 0, heldWithoutFreshLaneIntervals: 0, pendingTapHeldWithoutFresh: 0, holdCheckedIntervals: 0, holdMissingIntervals: 0,
    holdStartEndpoints: 0, holdEndEndpoints: 0, windowOpenHits: 0, windowCloseHits: 0, freshAtClosePlusOne: 0, hitsAfterHoldGap: 0,
    multipleDefectsOneBreak: 0, cancelledCalls: 0, epochChanges: 0, neutralAcknowledgements: 0, recoveryReentries: 0,
    preparationZeroStillFrozen: 0, longestReachedBeforeSongEnd: 0, terminalWithRealInterval: 0};
  for (const receipt of raw.actualReceipts.tapReceipts) {
    coverage.tapResults[receipt.result] = (coverage.tapResults[receipt.result] || 0) + 1;
    coverage.windowOpenHits += Number(receipt.result === 'hit' && receipt.resolvedActiveTick === receipt.openActiveTick);
    coverage.windowCloseHits += Number(receipt.result === 'hit' && receipt.resolvedActiveTick === receipt.closeActiveTick);
    const before = raw.frames[receipt.resolvedTick - 1].state.model, after = raw.frames[receipt.resolvedTick].state.model;
    coverage.freshAtClosePlusOne += Number(receipt.result === 'missed' && after.lastInput.fresh[receipt.lane]);
    coverage.hitsAfterHoldGap += Number(receipt.result === 'hit' && before.segmentStates[receipt.segmentIndex].holdMissingTicks > 0);
  }
  for (const receipt of raw.actualReceipts.segmentReceipts) {
    coverage.segmentResults[receipt.result] = (coverage.segmentResults[receipt.result] || 0) + 1;
    if (receipt.actualCrossing !== null) coverage.actualCrossings[receipt.actualCrossing] = (coverage.actualCrossings[receipt.actualCrossing] || 0) + 1;
    coverage.multipleDefectsOneBreak += Number(receipt.result === 'frayed' && Number(receipt.holdMissingTicks > 0) + receipt.missedTaps > 1 && receipt.breaksAfter - receipt.breaksBefore === 1);
  }
  for (let tick = 1; tick < raw.frames.length; tick++) {
    const before = raw.frames[tick - 1].state.model, model = raw.frames[tick].state.model, input = model.lastInput, step = model.lastStep;
    coverage.modes[step.mode] = (coverage.modes[step.mode] || 0) + 1;
    for (const lane of ['left', 'right']) {
      coverage.freshEdges[lane] += Number(input.fresh[lane]); coverage.preparingFreshEdges += Number(step.mode === 'preparing' && input.fresh[lane]);
      coverage.heldWithoutFreshLaneIntervals += Number(step.mode === 'running' && input.held[lane] && !input.fresh[lane]);
    }
    coverage.simultaneousFreshIntervals += Number(input.fresh.left && input.fresh.right);
    coverage.holdCheckedIntervals += Number(step.holdChecked); coverage.holdMissingIntervals += step.holdMissingAdded;
    coverage.holdStartEndpoints += Number(step.processedLocalTick === parameters.physics.holdStartLocalTick);
    coverage.holdEndEndpoints += Number(step.processedLocalTick === parameters.physics.holdEndLocalTick);
    if (step.mode === 'running') {
      const config = model.scenario.segments[step.processedSegmentIndex];
      const pending = config.pulses.some(pulse => before.segmentStates[config.index].taps[pulse.localIndex].status === 'pending' &&
        model.activeTick >= pulse.openActiveTick && model.activeTick <= pulse.closeActiveTick);
      coverage.pendingTapHeldWithoutFresh += Number(pending && input.held[config.tapLane] && !input.fresh[config.tapLane] && input.held[config.holdLane]);
    }
    coverage.cancelledCalls += Number(input.raw.cancelled); coverage.epochChanges += Number(input.epochChanged);
    coverage.neutralAcknowledgements += Number(input.neutralAcknowledged); coverage.recoveryReentries += Number(input.neutralAcknowledged && before.activeTick > 0);
    coverage.preparationZeroStillFrozen += Number(step.mode === 'preparing' && step.recoveryAfter === 0 && step.toActiveTick === step.fromActiveTick);
    coverage.longestReachedBeforeSongEnd += Number(model.phase === 'playing' && model.longestStreak >= model.requiredStreak && model.completedSegments < model.segmentCount);
  }
  const final = raw.final.model;
  coverage.terminalWithRealInterval = Number(final.terminal?.endedTick === final.tick && final.lastStep?.fromTick === final.tick - 1 && final.lastStep.mode === 'running');
  return coverage;
}

function auditRound(raw, label, entry) {
  const startAssertions = assertionCount, startFailures = failureCount, counts = checkBindings(raw, label);
  const difficulty = raw.initial.model.difficulty, seed = raw.initial.model.seed, physics = parameters.physics;
  equal([0, 1, 2].includes(difficulty), true, label + '.difficulty domain'); equal(Number.isFinite(seed) && Number.isInteger(seed), true, label + '.normalized seed domain');
  const scenario = parameters.scenarios[difficulty], calendar = reviewCalendar(scenario, physics, raw.intervalTrace.map(trace => trace.input));
  compare(raw.actualReceipts.tapReceipts, calendar.braid.tapReceipts, label + '.all independent tap receipts');
  compare(raw.actualReceipts.segmentReceipts, calendar.braid.segmentReceipts, label + '.all independent segment receipts');
  const fullState = tick => ({width: 960, height: 540, schemaVersion: 1, seed, difficulty, level: difficulty + 1, levelName: scenario.name, scenarioId: scenario.id,
    identity: {gameId: 36, name: '双线节律', englishName: 'Beat Braid', slug: 'beat-braid', packageId: 'com.ecojust.beatbraidtv', versionName: '0.1.0', versionCode: 1, seed, actionCount: 2},
    physics, scenario, segmentCount: scenario.segmentCount, requiredStreak: scenario.requiredStreak, maxBreaks: scenario.maxBreaks, deadlineActiveTick: scenario.deadlineActiveTick,
    ...calendar.stateAt(tick), tapReceipts: calendar.braid.tapReceipts.filter(receipt => receipt.resolvedTick <= tick),
    segmentReceipts: calendar.braid.segmentReceipts.filter(receipt => receipt.resolvedTick <= tick)});
  const compareModel = (actual, expected, scope, compressed = false) => {
    const {message, ...facts} = actual, expectedFacts = {...expected};
    if (compressed) for (const bank of BANKS) delete expectedFacts[bank];
    equal(typeof message, 'string', scope + '.display message'); compare(facts, expectedFacts, scope);
  };
  compareModel(raw.initial.model, fullState(0), label + '.initial');
  for (let tick = 0; tick < raw.frames.length; tick++) {
    const actual = raw.frames[tick].state.model, expected = fullState(tick);
    compareModel(actual, expected, label + '.frame' + tick, true); checkProgress(actual, label + '.frame' + tick);
    if (tick < raw.final.model.tick) equal(expected.phase, 'playing', label + '.no earlier terminal');
  }
  equal(calendar.braid.firstTerminal?.endedTick, raw.final.model.tick, label + '.first terminal model tick');
  equal(calendar.braid.firstTerminal?.endedActiveTick, raw.final.model.activeTick, label + '.first terminal active tick');
  const expectedFinal = fullState(raw.final.model.tick);
  compareModel(raw.final.model, expectedFinal, label + '.final'); equal(raw.final.model.tick, entry.actualFixedTicks, label + '.manifest ticks');
  return {label, difficulty, level: difficulty + 1, passed: failureCount === startFailures, assertions: assertionCount - startAssertions,
    counts: {...counts, activeIntervals: calendar.clock.running.length, gatedIntervals: calendar.clock.steps.length - calendar.clock.running.length,
      missingHoldRanges: calendar.braid.missing.left.length + calendar.braid.missing.right.length,
      tapReceipts: calendar.braid.tapReceipts.length, segmentReceipts: calendar.braid.segmentReceipts.length}, coverage: observedCoverage(raw),
    result: {phase: expectedFinal.phase, terminal: expectedFinal.terminal, tick: expectedFinal.tick, elapsed: expectedFinal.elapsed,
      activeTick: expectedFinal.activeTick, activeElapsed: expectedFinal.activeElapsed, score: expectedFinal.score, completedSegments: expectedFinal.completedSegments,
      wovenSegments: expectedFinal.wovenSegments, breaks: expectedFinal.breaks, currentStreak: expectedFinal.currentStreak, longestStreak: expectedFinal.longestStreak,
      tapHitCount: expectedFinal.tapHitCount, tapMissCount: expectedFinal.tapMissCount, chainBonus: expectedFinal.chainBonus,
      currentSegmentIndex: expectedFinal.currentSegmentIndex, localTick: expectedFinal.localTick, edgeOrdinals: expectedFinal.inputState.edgeOrdinals}};
}

function main() {
  const [indexArgument, outputArgument, approvedIndexSha256] = process.argv.slice(2);
  check(indexArgument && outputArgument && /^[a-f0-9]{64}$/.test(approvedIndexSha256 ?? ''), 'Usage: node independent-beat-review.mjs PUBLIC_INDEX FRESH_OUTPUT ROOT_APPROVED_INDEX_SHA');
  const indexPath = path.resolve(indexArgument), outputPath = path.resolve(outputArgument);
  check(!fs.existsSync(outputPath), 'Refusing to overwrite an audit output directory');
  const runnerPath = fileURLToPath(import.meta.url), app = path.resolve(path.dirname(runnerPath), '..'), repo = path.resolve(app, '../../..'), scratch = path.resolve(repo, '../scratch');
  check(indexPath === path.join(scratch, 'hundred-games/beat-braid/public-observations-first/index.json'), 'Only the approved first public projection is allowed');
  const contractPath = path.join(app, 'docs/model-contract.md'), interfacePath = path.join(app, 'docs/public-interface.md'), oraclePath = path.join(app, 'tests/beat-interval-oracle.mjs');
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
    parameters = parseRules(fs.readFileSync(contractPath, 'utf8'), fs.readFileSync(interfacePath, 'utf8'));
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
  const report = {schemaVersion: 1, game: 'beat-braid', passed: !exception && failureCount === 0 && rounds.length === 6,
    method: 'Original input safety gates and independent edge ordinals define the model-to-active clock mapping. Active held intervals intersect public hold ranges; first eligible fresh edges match disjoint closed windows. Completed woven flags determine crossings, streak runs, triangular chain bonus and the first segment-boundary terminal. All actual frames, interval summaries and receipt copies are compared without Model/pilot import, gameplay or per-tick rhythm-state replay.',
    limitations: ['Only the root-approved first six public ordinary cases. Formal synthetic boundaries, browser dual-pointer input, host pause/disconnect/retry and video remain separate evidence.',
      'All model ticks, including initial neutral acknowledgement and preparation, are retained. Cancel reentry, invalid axes, pressed aliases and post-terminal/invalid-dt calls are checked only if actually present; none are synthesized.',
      'Active-clock held continuity excludes frozen recovery calls exactly as the public rules require. Recovery-zero calls remain non-running; preparation edges consume ordinals without matching a pulse.',
      'Serialized observations prove values and historical copies, not object identity or Object.freeze. Only tapReceipts and segmentReceipts are prefix-encoded; mutable segment progress remains fully observed.',
      'Integer windows, hold counts, edge identities, scores and terminal gates use zero tolerance. Model and active elapsed values are separately derived from the public 60 Hz unit.',
      'Observed coverage counts do not turn absent boundary cases into ordinary evidence. Original raw/source hashes are bound through the approved projection without reading diagnostic-bearing originals or production implementation.'],
    sources: {contract: {repoRelative: path.relative(repo, contractPath), sha256: CONTRACT_SHA}, publicInterface: {repoRelative: path.relative(repo, interfacePath), sha256: INTERFACE_SHA},
      oracle: {repoRelative: path.relative(repo, oraclePath), sha256: startHashes[portable(oraclePath)]}, runner: {repoRelative: path.relative(repo, runnerPath), sha256: startHashes[portable(runnerPath)]},
      publicIndex: {scratchRelative: path.relative(scratch, indexPath), sha256: sha(indexBytes)}, originalReportSha256: index.originalReportSha256,
      sourceRuns: index.sourceRuns.map(({path: filename, ...rest}) => ({scratchRelative: path.relative(scratch, filename), ...rest}))},
    sourceWindow: {startedAt, completedAt, startHashes, endHashes, unchanged: isDeepStrictEqual(startHashes, endHashes)},
    assertions: assertionCount, roundAssertions, globalAssertions: assertionCount - roundAssertions, failureCount, failures, exception,
    comparisonTolerance: {modelTicks: 0, activeTicks: 0, score: 0, counts: 0, elapsedSeconds: 0, gates: 0}, maximumErrors, totals, rounds};
  fs.writeFileSync(path.join(outputPath, 'report.json'), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  process.stdout.write(JSON.stringify({passed: report.passed, assertions: assertionCount, globalAssertions: report.globalAssertions, failureCount, maximumErrors, totals}) + '\n');
  process.exitCode = report.passed ? 0 : 1;
}

main();
