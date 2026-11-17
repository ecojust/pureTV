/** Actual public six-case review. Run only after root review and separate execution GO. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { COMPARISON_TOLERANCE, PHYSICS, SCENARIOS, invariant, finite, speed,
  envelope, limits, wrap360, signedGap, normalizeControls, plannedMotion,
  endpoint, endpointIsSafe, normalizedFraction } from './rotor-interval-oracle.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const BANKS = ['contactReceipts', 'travelReceipts'];
const INPUT_KEYS = ['x', 'y', 'menuDelta', 'cancelEpoch', 'a', 'b', 'aPressed', 'bPressed',
  'start', 'select', 'startPressed', 'selectPressed', 'confirm', 'retry', 'cancelled'];
const SOURCE_KEYS = ['automation', 'model', 'contract', 'publicInterface', 'publicDesign',
  'harness', 'evidenceFormat', 'evidenceSpec', 'approvedPins'];
const DOCUMENTS = {
  contract: ['docs/model-contract.md', 'fb8bbf70f5d46b353662a8ad6b732815f9098c96e66688e5712990f8a1c90696'],
  publicInterface: ['docs/public-interface.md', '440277f97ce553d58ad41b455b06e542421606a6c8ba254b8d5d1a0fa07889df'],
  publicDesign: ['docs/public-design.md', '0b699d2ae25d592f81d6dfb03fcfd87e437fb39e320850b302ebca9ae9b44699'],
};
const SCOPE = 'Adjacent actual model ticks. Bank grouping is storage order, not cross-bank event chronology. Actual fractions, lastInput/lastStep and events are retained unchanged; analytic roots and actual motionFraction remain distinct.';
const EXACT_NAMES = new Set(['tick', 'fromTick', 'toTick', 'seed', 'difficulty', 'level', 'schemaVersion',
  'remainingTicks', 'score', 'durability', 'resistance', 'id', 'contactReceiptId', 'cancelEpoch',
  'direction', 'radialDirection', 'driveDirection', 'drive', 'radial', 'safeComponentIndex',
  'durabilityBefore', 'durabilityAfter', 'resistanceBefore', 'resistanceAfter', 'scoreBefore', 'scoreAfter']);
const IMMUTABLE_FIELDS = ['width', 'height', 'schemaVersion', 'identity', 'physics', 'scenario',
  'seed', 'difficulty', 'level', 'levelName', 'scenarioId'];
let assertions = 0;
function check(condition, message) { assertions++; invariant(condition, message); }
function same(actual, expected, label, exactNumbers = false) {
  if (typeof expected === 'number') {
    const leaf = label.split('.').at(-1);
    const exact = exactNumbers || EXACT_NAMES.has(leaf) || label.includes('.raw.') || label.includes('.travelReceiptIds[');
    check(finite(actual) && (exact ? actual === expected : Math.abs(actual - expected) <= COMPARISON_TOLERANCE), label + ': numeric mismatch');
    return;
  }
  if (expected === null || typeof expected !== 'object') {
    check(actual === expected, label + ': value mismatch'); return;
  }
  if (Array.isArray(expected)) {
    check(Array.isArray(actual) && actual.length === expected.length, label + ': array shape mismatch');
    expected.forEach((value, index) => same(actual[index], value, label + '[' + index + ']', exactNumbers));
    return;
  }
  check(actual !== null && typeof actual === 'object' && !Array.isArray(actual), label + ': object required');
  const keys = Object.keys(expected).sort();
  check(JSON.stringify(Object.keys(actual).sort()) === JSON.stringify(keys), label + ': keys mismatch');
  for (const key of keys) same(actual[key], expected[key], label + '.' + key, exactNumbers);
}
function hash(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function hashFile(file) { return hash(fs.readFileSync(file)); }
function sha(value) { return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value); }
function equalKeys(actual, expected, label) {
  check(actual && typeof actual === 'object' && !Array.isArray(actual), label + ': object required');
  same(Object.keys(actual).sort(), [...expected].sort(), label + '.keys', true);
}
function viewRings(model) {
  return SCENARIOS[model.difficulty].rings.map(item => {
    const bound = limits(item, model.hasKey), angle = item.initialAngleDegrees + item.gearRatio * model.driveAngleDegrees;
    const k = Math.round(angle / 360), width = bound.effectiveSafeHalfWidthDegrees;
    return { ...item, unwrappedAngleDegrees: angle, angleDegrees: wrap360(angle), ...bound,
      wrappedGapOffsetDegrees: signedGap(angle),
      probeAngularlyClear: angle >= 360 * k - width && angle <= 360 * k + width,
      probeRadiallyInside: model.probeRadius > bound.effectiveInnerRadius && model.probeRadius < bound.effectiveOuterRadius };
  });
}
function initialModel(seed, difficulty, message) {
  const scenario = SCENARIOS[difficulty];
  const model = {
    width: 960, height: 540, schemaVersion: 1,
    identity: { gameId: 38, name: '旋环锁匠', englishName: 'Rotor Locksmith', slug: 'rotor-locksmith',
      packageId: 'com.ecojust.rotorlocksmithtv', versionName: '0.1.0', versionCode: 1, seed, actionCount: 2 },
    physics: PHYSICS, scenario, seed, difficulty, level: difficulty + 1, levelName: scenario.name, scenarioId: scenario.id,
    phase: 'playing', mission: 'approach', tick: 0, elapsed: 0, remainingTicks: 5400, remainingSeconds: 90,
    probeRadius: 210, driveAngleDegrees: 0, hasKey: false, durability: 4, resistance: 0, radialSpeed: 7.5,
    score: 0, lostReason: null, message, terminal: null, events: [],
    inputState: { cancelEpoch: null, quarantined: true, impactLocked: false },
    rings: [], probeEnvelope: envelope(false, 210), contactReceipts: [], travelReceipts: [],
    lastInput: null, lastStep: null, lastContact: null, lastTravelReceipts: [],
  };
  model.rings = viewRings(model); return model;
}
function identityChecks(model, difficulty, label) {
  check(Number.isInteger(model.seed) && finite(model.seed), label + ': finite integer seed required');
  check(Number.isInteger(difficulty) && difficulty >= 0 && difficulty <= 2, label + ': invalid difficulty');
  check(typeof model.message === 'string', label + ': message must be text');
  const initial = initialModel(model.seed, difficulty, model.message);
  for (const key of IMMUTABLE_FIELDS)
    same(model[key], initial[key], label + '.' + key, true);
}
function wrapper(model) {
  return { phase: model.phase, paused: false, level: model.difficulty, difficulty: model.difficulty, score: model.score, model };
}
function expandFrame(data, index) {
  const frame = data.frames[index];
  equalKeys(frame, ['frameIndex', 'tick', 'state', 'receiptPrefixLengths'], 'frame');
  check(frame.frameIndex === index && frame.tick === index && frame.state.model.tick === index, 'Frame identity must equal actual model tick');
  equalKeys(frame.receiptPrefixLengths, BANKS, 'frame.receiptPrefixLengths');
  const model = { ...frame.state.model };
  for (const bank of BANKS) {
    check(!Object.hasOwn(model, bank), 'Only final-bank prefixes may supply omitted banks');
    const prefix = frame.receiptPrefixLengths[bank];
    check(Number.isInteger(prefix) && prefix >= 0 && prefix <= data.actualReceipts[bank].length, 'Invalid receipt prefix');
    const expected = data.actualReceipts[bank].findIndex(receipt => receipt.tick > index);
    check(prefix === (expected < 0 ? data.actualReceipts[bank].length : expected), 'Receipt prefix is not its exact first-observation prefix');
    model[bank] = data.actualReceipts[bank].slice(0, prefix);
  }
  same({ ...frame.state, model }, wrapper(model), 'frame.wrapper', true);
  return model;
}
function boundaryEvents(previous, motion, fraction, point, tick) {
  const rows = [];
  if (motion.dr === 0) return rows;
  motion.scenario.rings.forEach((item, ringIndex) => {
    const bound = limits(item, previous.hasKey);
    for (const [boundary, radius] of [['inner', bound.effectiveInnerRadius], ['outer', bound.effectiveOuterRadius]]) {
      const movedAcross = motion.dr < 0 ? previous.probeRadius > radius && point.radius <= radius : previous.probeRadius < radius && point.radius >= radius;
      const reached = (radius - previous.probeRadius) / motion.dr;
      if (movedAcross && reached >= 0 && reached <= fraction) rows.push({ tick, fraction: reached,
        kind: 'boundary', ringId: item.id, boundary, direction: Math.sign(motion.dr), radius,
        driveAngleDegrees: previous.driveAngleDegrees + motion.dq * reached,
        hasKeyBefore: previous.hasKey, hasKeyAfter: previous.hasKey, endpointReachedFraction: null,
        scoreBefore: previous.score, scoreAfter: previous.score, reason: null, ringIndex });
    }
  });
  rows.sort((a, b) => a.fraction - b.fraction || a.ringIndex - b.ringIndex || (a.boundary === b.boundary ? 0 : a.boundary === 'inner' ? -1 : 1));
  return rows.map(({ ringIndex, ...row }) => row);
}
function taskEvent(kind, previous, point, tick, fraction, beforeKey, afterKey, beforeScore, afterScore, reason = null, endpointReachedFraction = null) {
  return { tick, fraction, kind, ringId: null, boundary: null, direction: null,
    radius: point.radius, driveAngleDegrees: point.q, hasKeyBefore: beforeKey, hasKeyAfter: afterKey,
    endpointReachedFraction, scoreBefore: beforeScore, scoreAfter: afterScore, reason };
}
function reviewStep(previous, after, trace, label) {
  check(previous.phase === 'playing' && trace.dt === 1 / 60, label + ': ordinary trace must contain one valid playing call');
  for (const key of IMMUTABLE_FIELDS) same(after[key], previous[key], label + '.immutable.' + key, true);
  equalKeys(trace.input, INPUT_KEYS, label + '.input');
  const tick = previous.tick + 1, controls = normalizeControls(previous, trace.input, tick);
  const motion = plannedMotion(previous, controls);
  same(after.lastStep.ringChecks, motion.checks, label + '.ringChecks');
  const recordedRoots = after.lastStep.ringChecks.map(row => row.firstUnsafeFraction).filter(value => value !== null);
  check(recordedRoots.every(value => finite(value) && value >= 0 && value < 1), label + ': analytical contact roots must be in [0,1)');
  // Roots were independently checked above. Their recorded binary64 representation is the submitted candidate.
  const recordedCandidate = recordedRoots.length ? Math.min(...recordedRoots) : 1;
  same(recordedCandidate, motion.candidateFraction, label + '.analyticalCandidate');
  const fraction = normalizedFraction(previous, motion, recordedCandidate);
  check(after.lastStep.motionFraction === fraction, label + ': actual fraction is not the greatest canonical safe representable fraction');
  const point = endpoint(previous, motion, fraction);
  check(after.probeRadius === point.radius && after.driveAngleDegrees === point.q, label + ': committed endpoint is not canonical binary64 recomputation');
  check(endpointIsSafe(previous, motion, fraction), label + ': ordinary committed endpoint is inside a wall');
  const ringMotion = motion.scenario.rings.map(item => ({ id: item.id,
    unwrappedAngleBefore: item.initialAngleDegrees + item.gearRatio * previous.driveAngleDegrees,
    angleBefore: wrap360(item.initialAngleDegrees + item.gearRatio * previous.driveAngleDegrees),
    plannedDeltaDegrees: item.gearRatio * motion.dq, actualDeltaDegrees: item.gearRatio * (motion.dq * fraction),
    unwrappedAngleAfter: item.initialAngleDegrees + item.gearRatio * point.q,
    angleAfter: wrap360(item.initialAngleDegrees + item.gearRatio * point.q) }));
  let durability = previous.durability, resistance = previous.resistance, hasKey = previous.hasKey;
  let phase = 'playing', mission = previous.mission, score = previous.score, reason = null;
  const travel = boundaryEvents(previous, motion, fraction, point, tick);
  const events = travel.map(row => ({ type: 'boundary', tick, fraction: row.fraction }));
  if (motion.hasCollision) {
    durability--; resistance++; events.push({ type: 'hit', tick, fraction });
    if (durability === 0) { phase = 'lost'; reason = 'durability'; }
  } else if (!hasKey && point.radius === 18) {
    hasKey = true; mission = 'return'; score = 100;
    const reached = previous.probeRadius === 18 ? 0 : (18 - previous.probeRadius) / motion.dr;
    check(finite(reached) && reached >= 0 && reached <= fraction, label + ': invalid key endpoint arrival');
    travel.push(taskEvent('key-acquired', previous, point, tick, 1, false, true, previous.score, score, null, reached));
    events.push({ type: 'key', tick, fraction: 1 });
  } else if (hasKey && point.radius === 210) {
    phase = 'won'; mission = 'complete'; score = 1100; reason = 'key-extracted';
    const reached = previous.probeRadius === 210 ? 0 : (210 - previous.probeRadius) / motion.dr;
    check(finite(reached) && reached >= 0 && reached <= fraction, label + ': invalid extraction endpoint arrival');
    travel.push(taskEvent('key-extracted', previous, point, tick, 1, true, true, previous.score, score, null, reached));
    events.push({ type: 'win', tick, fraction: 1 });
  }
  if (phase === 'playing' && tick === 5400) { phase = 'lost'; reason = 'timeout'; }
  if (phase === 'lost') {
    const terminalFraction = reason === 'durability' ? fraction : 1;
    travel.push(taskEvent('lost', previous, point, tick, terminalFraction, hasKey, hasKey, score, score, reason));
    events.push({ type: 'lose', tick, fraction: terminalFraction });
  }
  const newTravel = travel.map((row, index) => ({ id: previous.travelReceipts.length + index + 1, ...row }));
  const contact = motion.hasCollision ? {
    id: previous.contactReceipts.length + 1, tick, fraction, primaryRingId: motion.primaryRingId, tiedRingIds: motion.tiedRingIds,
    radialDirection: controls.effective.radial, driveDirection: controls.effective.drive, hasKey: previous.hasKey,
    envelope: envelope(previous.hasKey, point.radius), probeRadiusBefore: previous.probeRadius,
    rawTargetRadius: previous.probeRadius + motion.dr, candidateRadius: Math.min(210, Math.max(18, previous.probeRadius + motion.dr)),
    probeRadiusAtContact: point.radius, driveAngleBefore: previous.driveAngleDegrees,
    plannedOuterDeltaDegrees: motion.dq, actualOuterDeltaDegrees: motion.dq * fraction, driveAngleAtContact: point.q,
    ringChecks: motion.checks, ringMotion, durabilityBefore: previous.durability, durabilityAfter: durability,
    resistanceBefore: previous.resistance, resistanceAfter: resistance, impactLockedAfter: true,
    terminalReason: durability === 0 ? 'durability' : null,
  } : null;
  const lastStep = {
    fromTick: previous.tick, toTick: tick, inputMode: controls.mode, requested: controls.requested, effective: controls.effective,
    probeRadiusBefore: previous.probeRadius, rawTargetRadius: previous.probeRadius + motion.dr,
    candidateRadius: Math.min(210, Math.max(18, previous.probeRadius + motion.dr)), probeRadiusAfter: point.radius,
    driveAngleBefore: previous.driveAngleDegrees, plannedOuterDeltaDegrees: motion.dq,
    actualOuterDeltaDegrees: motion.dq * fraction, driveAngleAfter: point.q,
    motionFraction: fraction, hasCollision: motion.hasCollision, primaryRingId: motion.primaryRingId,
    tiedRingIds: motion.tiedRingIds, contactReceiptId: contact?.id ?? null,
    envelopeBefore: envelope(previous.hasKey, previous.probeRadius), envelopeAfter: envelope(hasKey, point.radius),
    ringMotion, ringChecks: motion.checks, durabilityBefore: previous.durability, durabilityAfter: durability,
    resistanceBefore: previous.resistance, resistanceAfter: resistance,
    radialSpeedBefore: speed(previous.resistance), radialSpeedAfter: speed(resistance),
    hasKeyBefore: previous.hasKey, hasKeyAfter: hasKey, missionBefore: previous.mission, missionAfter: mission,
    scoreBefore: previous.score, scoreAfter: score, quarantinedAfter: controls.quarantinedAfter,
    impactLockedAfter: controls.impactLockedAfterInput || motion.hasCollision,
    travelReceiptIds: newTravel.map(row => row.id), terminalAfter: reason,
  };
  const terminal = phase === 'playing' ? null : { reason, tick, fraction: reason === 'durability' ? fraction : 1,
    probeRadius: point.radius, driveAngleDegrees: point.q, hasKey, durability, resistance, score };
  check(typeof after.message === 'string', label + ': message must be text; exact wording is outside this contract');
  const expected = { ...previous, phase, mission, tick, elapsed: tick / 60, remainingTicks: 5400 - tick,
    remainingSeconds: (5400 - tick) / 60, probeRadius: point.radius, driveAngleDegrees: point.q,
    hasKey, durability, resistance, radialSpeed: speed(resistance), score, lostReason: phase === 'lost' ? reason : null,
    message: after.message, terminal, events,
    inputState: { cancelEpoch: controls.cancelEpoch, quarantined: controls.quarantinedAfter,
      impactLocked: controls.impactLockedAfterInput || motion.hasCollision },
    probeEnvelope: envelope(hasKey, point.radius), contactReceipts: contact ? [...previous.contactReceipts, contact] : previous.contactReceipts,
    travelReceipts: [...previous.travelReceipts, ...newTravel], lastInput: controls, lastStep,
    lastContact: contact, lastTravelReceipts: newTravel };
  expected.rings = viewRings(expected);
  same(after, expected, label + '.model');
  if (motion.hasCollision) {
    check(after.lastContact.fraction === fraction && after.contactReceipts.at(-1).fraction === fraction,
      label + ': contact fractions must equal the exact submitted fraction');
  }
  if (terminal) check(after.terminal.fraction === terminal.fraction, label + ': terminal fraction differs from its actual event');
  after.events.forEach((event, index) => {
    check(finite(event.fraction) && event.fraction >= 0 && event.fraction <= 1, label + ': event fraction outside tick');
    if (event.type !== 'boundary') check(event.fraction === events[index].fraction, label + ': task/contact event fraction differs');
  });
  after.rings.forEach((item, index) => check(item.unwrappedAngleDegrees === point.angles[index], label + ': stored ring angle is not derived from the canonical common q'));
  const { input, dt, beforeFrameIndex, afterFrameIndex, ...stepCopy } = trace;
  check(beforeFrameIndex === previous.tick && afterFrameIndex === tick, label + ': trace adjacency differs');
  same(stepCopy, after.lastStep, label + '.actualLastStepCopy', true);
  same(input, after.lastInput.raw, label + '.actualInputCopy', true);
  return { numericalReduction: fraction < recordedCandidate, newContact: contact ? [contact] : [], newTravel };
}

const ALLOWED_KEYS = ['ArrowLeft', 'ArrowRight', 'Space', 'b'];
function keySet(keys, label) {
  check(Array.isArray(keys) && keys.every(key => ALLOWED_KEYS.includes(key)) && new Set(keys).size === keys.length, label + ': invalid held-key set');
  return [...keys];
}
function inputForKeys(keys) {
  return { x: Number(keys.includes('ArrowRight')) - Number(keys.includes('ArrowLeft')), y: 0, menuDelta: 0, cancelEpoch: 0,
    a: keys.includes('Space'), b: keys.includes('b'), aPressed: false, bPressed: false,
    start: false, select: false, startPressed: false, selectPressed: false, confirm: false, retry: false, cancelled: false };
}
function compact(model, keys) {
  return { tick: model.tick, elapsed: model.elapsed, keys, phase: model.phase, mission: model.mission,
    probeRadius: model.probeRadius, driveAngleDegrees: model.driveAngleDegrees, hasKey: model.hasKey,
    durability: model.durability, resistance: model.resistance, radialSpeed: model.radialSpeed,
    remainingTicks: model.remainingTicks, score: model.score, quarantined: model.inputState.quarantined,
    impactLocked: model.inputState.impactLocked, ringAnglesDegrees: model.rings.map(item => item.angleDegrees),
    contactCount: model.contactReceipts.length, travelCount: model.travelReceipts.length,
    lastContactId: model.lastContact?.id ?? null, lastTravelIds: model.lastTravelReceipts.map(row => row.id) };
}
export function reviewCase(data, round) {
  const startedAssertions = assertions;
  check(!Object.hasOwn(data, 'pilotDiagnostics'), 'Only the public projection is accepted; private diagnostics must not be present');
  check(data.passed === true && data.failure === null && data.name === round.name, 'Case is not an actual successful collection');
  check(Number.isInteger(data.difficulty) && data.difficulty >= 0 && data.difficulty < 3, 'Invalid case difficulty');
  check(data.mode === 'record' || data.mode === 'loss', 'Unknown ordinary case mode');
  check(data.name === 'level' + (data.difficulty + 1) + '-' + data.mode, 'Case name is not bound to its difficulty/mode');
  check(typeof data.policy === 'string', 'Public policy label required, without reading policy implementation');
  check(Number.isInteger(data.actualFixedTicks) && data.actualFixedTicks > 0 && data.actualFixedTicks <= 5400, 'Incomplete or over-budget case');
  check(data.actualFixedTicks === round.actualFixedTicks && data.harnessTickLimit === 5460, 'Case clock/call-cap metadata differs');
  check(Array.isArray(data.frames) && data.frames.length === data.actualFixedTicks + 1, 'All actual fixed-tick frames are required');
  check(Array.isArray(data.intervalTrace) && data.intervalTrace.length === data.actualFixedTicks, 'Every actual input interval is required');
  equalKeys(data.actualReceipts, BANKS, 'actualReceipts');
  for (const bank of BANKS) {
    check(Array.isArray(data.actualReceipts[bank]), 'Final receipt bank must be an array');
    data.actualReceipts[bank].forEach((row, index, rows) => {
      check(row.id === index + 1 && Number.isInteger(row.tick) && row.tick > 0 && row.tick <= data.actualFixedTicks,
        'Receipt id/tick is not in the actual case');
      check(index === 0 || rows[index - 1].tick <= row.tick, 'Receipt ticks are not append-only');
      check(finite(row.fraction) && row.fraction >= 0 && row.fraction <= 1, 'Receipt fraction outside its tick');
    });
  }
  const models = data.frames.map((unused, index) => expandFrame(data, index));
  const first = models[0], final = models.at(-1);
  identityChecks(first, data.difficulty, data.name + '.initial');
  check(first.probeRadius === 210 && first.driveAngleDegrees === 0, 'Ordinary cases must start at the exact public radial/drive origin');
  same(first, initialModel(first.seed, data.difficulty, first.message), data.name + '.initial');
  same(data.initial, wrapper(first), data.name + '.initialWrapper', true);
  same(data.final, wrapper(final), data.name + '.finalWrapper', true);
  const expectedTransitions = [], expectedOperations = [];
  const expectedRetained = [{ seconds: 0, frameIndex: 0, basis: 'actual-initial-mechanics-input-and-clock' }];
  let numericalReductions = 0, previousRetained = 0;
  for (let tick = 1; tick <= data.actualFixedTicks; tick++) {
    const before = models[tick - 1], after = models[tick], trace = data.intervalTrace[tick - 1];
    const result = reviewStep(before, after, trace, data.name + '.tick' + tick);
    if (result.numericalReduction) numericalReductions++;
    const receiptIds = Object.fromEntries(BANKS.map(bank => [bank, after[bank].slice(before[bank].length).map(row => row.id)]));
    const changed = BANKS.some(bank => receiptIds[bank].length > 0) || before.phase !== after.phase;
    if (changed) {
      expectedTransitions.push({ tick, mission: after.mission, input: trace.input, dt: trace.dt,
        beforeFrameIndex: tick - 1, afterFrameIndex: tick, receiptIds, actualLastStep: after.lastStep });
    }
    for (const bank of BANKS) for (const receipt of after[bank].slice(before[bank].length)) {
      expectedOperations.push({ kind: bank, observedAt: tick / 60, receipt,
        beforeFrameIndex: tick - 1, afterFrameIndex: tick, boundaryScope: SCOPE });
    }
    if (changed || tick - previousRetained >= 60) {
      expectedRetained.push({ seconds: tick / 60, frameIndex: tick,
        basis: changed ? 'actual-contact-travel-or-terminal-boundary' : 'one-second-checkpoint' });
      previousRetained = tick;
    }
  }
  if (previousRetained !== data.actualFixedTicks) expectedRetained.push({ seconds: final.elapsed,
    frameIndex: final.tick, basis: 'final-observation' });
  same(data.eventTransitions, expectedTransitions, data.name + '.eventTransitions', true);
  same(data.operations, expectedOperations, data.name + '.operations', true);
  same(data.retained, expectedRetained, data.name + '.retained', true);
  same(data.cadenceTicks, [5, 8, 11], data.name + '.cadenceTicks', true);
  const decisionTicks = [];
  for (let tick = 0, cycle = 0; tick < final.tick; tick += data.cadenceTicks[cycle++ % data.cadenceTicks.length]) decisionTicks.push(tick);
  check(Array.isArray(data.compactTrace) && data.compactTrace.length === decisionTicks.length, 'Compact decisions do not cover the declared cycling cadence');
  check(Array.isArray(data.inputChanges), 'Input-change array required');
  let held = [], changeIndex = 0;
  data.compactTrace.forEach((row, index) => {
    const tick = decisionTicks[index], model = models[tick];
    const next = keySet(row.keys, data.name + '.decisionKeys');
    same({ ...row, keys: next }, compact(model, next), data.name + '.compactTrace[' + index + ']', true);
    const changed = JSON.stringify(next) !== JSON.stringify(held);
    if (changed) {
      const change = data.inputChanges[changeIndex++];
      check(change && typeof change === 'object', 'Missing actual input change');
      same({ ...change, from: keySet(change.from, 'inputChanges.from'), to: keySet(change.to, 'inputChanges.to') },
        { tick, elapsed: model.elapsed, mission: model.mission, from: held, to: next }, 'inputChanges.row', true);
    }
    for (let intervalIndex = tick; intervalIndex < (decisionTicks[index + 1] ?? final.tick); intervalIndex++) {
      same(data.intervalTrace[intervalIndex].input, inputForKeys(next), data.name + '.heldInput[' + intervalIndex + ']', true);
    }
    held = next;
  });
  check(changeIndex === data.inputChanges.length, 'Unexpected extra input-change rows');
  check(data.prewarm && data.prewarm.actualTickBefore === 0 && data.prewarm.actualTickAfter === 0 && data.prewarm.modelUnchanged === true,
    'Prewarm must leave the independently checked initial model unchanged');
  check(final.phase === (data.mode === 'record' ? 'won' : 'lost'), 'Ordinary result differs from the requested case mode');
  check(final.terminal !== null, 'Actual terminal state required');
  if (data.mode === 'record') {
    check(data.expectedReason === null && final.terminal.reason === 'key-extracted', 'Winning case must actually extract the key');
    const taskKinds = final.travelReceipts.filter(row => row.kind !== 'boundary').map(row => row.kind);
    same(taskKinds, ['key-acquired', 'key-extracted'], 'winningTaskEvents', true);
    for (const item of SCENARIOS[data.difficulty].rings) for (const boundary of ['inner', 'outer']) {
      for (const [direction, hasKey] of [[-1, false], [1, true]]) {
        check(final.travelReceipts.some(row => row.kind === 'boundary' && row.ringId === item.id && row.boundary === boundary &&
          row.direction === direction && row.hasKeyBefore === hasKey && row.hasKeyAfter === hasKey),
        'Winning case lacks an actual empty inward/key-bearing outward boundary arrival');
      }
    }
  } else {
    check(['durability', 'timeout'].includes(data.expectedReason) && final.terminal.reason === data.expectedReason,
      'Negative case must actually reach its declared natural failure');
  }
  return { name: data.name, difficulty: data.difficulty, mode: data.mode, phase: final.phase, reason: final.terminal.reason,
    actualFixedTicks: final.tick, elapsed: final.elapsed, score: final.score, hasKey: final.hasKey, mission: final.mission,
    durability: final.durability, resistance: final.resistance, frames: models.length, intervals: data.intervalTrace.length,
    contactReceipts: final.contactReceipts.length, travelReceipts: final.travelReceipts.length,
    numericalSubmissionReductions: numericalReductions, assertions: assertions - startedAssertions };
}

function within(root, file) {
  const relative = path.relative(root, file);
  return relative !== '' && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}
function resolveEvidence(root, base, value) {
  check(typeof value === 'string' && value.length > 0, 'Evidence path required');
  const target = path.isAbsolute(value) ? path.resolve(value) : path.resolve(base, value);
  check(within(root, target), 'Evidence path escapes this game scratch');
  check(!fs.lstatSync(target).isSymbolicLink() && fs.statSync(target).isFile(), 'Evidence must be a regular file');
  check(within(root, fs.realpathSync(target)), 'Resolved evidence escapes this game scratch');
  return target;
}
function readPinned(file, expected) {
  check(sha(expected), 'Expected evidence SHA256 required');
  const bytes = fs.readFileSync(file);
  check(hash(bytes) === expected, 'Evidence bytes differ: ' + path.basename(file));
  return JSON.parse(bytes.toString('utf8'));
}
function sourceWindow(values, label) {
  equalKeys(values, SOURCE_KEYS, label);
  for (const value of Object.values(values)) check(sha(value), label + ': actual source SHA256 required');
  for (const [key, entry] of Object.entries(DOCUMENTS)) check(values[key] === entry[1], label + ': canonical public document differs');
}
export function main(argv) {
  assertions = 0;
  const options = {};
  for (let i = 0; i < argv.length; i += 2) {
    check(['--index', '--index-sha256', '--out'].includes(argv[i]) && typeof argv[i + 1] === 'string' && !Object.hasOwn(options, argv[i]), 'Expected --index PATH --index-sha256 SHA256 --out PATH');
    options[argv[i]] = argv[i + 1];
  }
  check(Object.keys(options).length === 3, 'Actual reviewed corpus hash and output path are mandatory');
  const indexPath = path.resolve(options['--index']), indexDirectory = path.dirname(indexPath);
  const scratch = path.resolve(indexDirectory, '..');
  check(path.basename(scratch) === 'rotor-locksmith', 'Index must be within the current game public-observation directory');
  const output = path.resolve(options['--out']);
  check(within(scratch, output) && !fs.existsSync(output), 'Output must be a new file within this game scratch');
  const documentHashes = {};
  for (const [key, [relative, expected]] of Object.entries(DOCUMENTS)) {
    check(hashFile(path.join(APP, relative)) === expected, 'Canonical public contract bytes changed');
    documentHashes[key] = { path: relative, sha256: expected };
  }
  const index = readPinned(indexPath, options['--index-sha256']);
  check(index.originalFilesUnchanged === true && sha(index.originalReportSha256), 'Original corpus identity is missing');
  check(Array.isArray(index.rounds) && index.rounds.length === 6 && Array.isArray(index.sourceRuns) && index.sourceRuns.length === 1, 'This format requires six actual public cases from one complete source run');
  const sourceRuns = new Map(), sourceEvidence = [];
  for (const run of index.sourceRuns) {
    equalKeys(run, ['path', 'sha256', 'startHashes', 'endHashes'], 'sourceRun');
    check(!sourceRuns.has(run.sha256), 'Duplicate source-run report');
    sourceWindow(run.startHashes, 'sourceRun.startHashes');
    same(run.endHashes, run.startHashes, 'sourceRun.endHashes', true);
    const reportPath = resolveEvidence(scratch, indexDirectory, run.path);
    const report = readPinned(reportPath, run.sha256);
    check(report.passed === true && report.setupFailure === null && report.sourceUnchanged === true, 'Original ordinary source run did not complete successfully');
    same(report.startHashes, run.startHashes, 'originalReport.startHashes', true);
    same(report.endHashes, run.endHashes, 'originalReport.endHashes', true);
    check(Array.isArray(report.tests) && report.tests.length === 6 && report.tests.every(row => row.passed === true), 'Original ordinary report must contain all six actual passed cases');
    sourceRuns.set(run.sha256, { run, report, directory: path.dirname(reportPath) });
    sourceEvidence.push({ path: path.relative(scratch, reportPath).split(path.sep).join('/'), sha256: run.sha256, sourceHashes: run.startHashes });
  }
  check(sourceRuns.has(index.originalReportSha256), 'Index original report is not among bound source runs');
  const formatPath = path.join(scratch, 'qa-tools/evidence-format.md'), formatHash = hashFile(formatPath);
  const results = [], caseEvidence = [], names = new Set();
  for (const round of index.rounds) {
    check(round.passed === true && !names.has(round.name), 'Duplicate or failed public case');
    names.add(round.name);
    same(round.removedPaths, ['pilotDiagnostics'], 'projection.removedPaths', true);
    check(sha(round.originalRawSha256) && sourceRuns.has(round.originalReportSha256), 'Original case/report hash is missing');
    const source = sourceRuns.get(round.originalReportSha256);
    same(round.sourceHashes, source.run.startHashes, 'round.sourceHashes', true);
    check(round.sourceHashes.evidenceSpec === formatHash, 'Public evidence-format bytes differ from the actual collection window');
    const originals = source.report.tests.filter(row => row.name === round.name);
    check(originals.length === 1 && originals[0].passed === true && originals[0].reportSha256 === round.originalRawSha256,
      'Projected case does not name one actual successful original case');
    const file = resolveEvidence(scratch, indexDirectory, round.file);
    const data = readPinned(file, round.sha256);
    results.push(reviewCase(data, round));
    caseEvidence.push({ name: round.name, path: path.relative(scratch, file).split(path.sep).join('/'), sha256: round.sha256,
      originalRawSha256: round.originalRawSha256, originalReportSha256: round.originalReportSha256 });
  }
  for (let difficulty = 0; difficulty < 3; difficulty++) for (const mode of ['record', 'loss'])
    check(results.filter(row => row.difficulty === difficulty && row.mode === mode).length === 1, 'Exactly one actual win and one actual loss per public level are required');
  const roundAssertions = results.reduce((total, row) => total + row.assertions, 0);
  const report = {
    game: 'rotor-locksmith', kind: 'independent-public-full-tick-interval-review', passed: true,
    publicDocuments: documentHashes, publicEvidenceFormat: { path: 'qa-tools/evidence-format.md', sha256: formatHash },
    implementationRead: false, pilotImplementationRead: false, privateWitnessRead: false,
    productionModelImported: false, productionModelReplayed: false, routeSearchPerformed: false,
    source: { index: path.relative(scratch, indexPath).split(path.sep).join('/'), sha256: options['--index-sha256'] },
    auditorSources: {
      intervalOracle: { path: 'tests/rotor-interval-oracle.mjs', sha256: hashFile(path.join(HERE, 'rotor-interval-oracle.mjs')) },
      reviewer: { path: 'tests/independent-rotor-review.mjs', sha256: hashFile(fileURLToPath(import.meta.url)) },
    },
    sourceRuns: sourceEvidence, evidence: caseEvidence, rounds: results,
    assertions, roundAssertions, globalAssertions: assertions - roundAssertions,
    cases: results.length, winningCases: results.filter(row => row.phase === 'won').length,
    losingCases: results.filter(row => row.phase === 'lost').length,
    fullTickIntervals: results.reduce((total, row) => total + row.intervals, 0),
    numericalSubmissionReductions: results.reduce((total, row) => total + row.numericalSubmissionReductions, 0),
    scope: 'Independent interval arithmetic over all saved actual ordinary ticks; no Model import, input replay, route search or private diagnostics. Strict collision membership is separate from numeric output comparison. The binary64 submission maximum is recomputed from discrete monotone preimages. Root and event geometry, damage, clocks, key return, exact bank prefixes and public adjacent-frame references are checked. Message text is checked only as a string because the public contract does not specify its wording. Host pause, invalid-dt fixtures, physical hardware and every browser animation frame are outside these six headless ordinary cases.',
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  process.stdout.write(JSON.stringify({ passed: true, cases: report.cases, fullTickIntervals: report.fullTickIntervals,
    assertions: report.assertions, report: output }) + '\n');
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main(process.argv.slice(2));
