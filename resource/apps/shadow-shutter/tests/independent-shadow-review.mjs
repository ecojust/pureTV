// Offline review of existing public observations; never imports or runs Model/pilot.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {readParameters, apertureAt, moveAperture, sceneAt, targetsFor, evaluateCapture, previewAt,
  validatePublishedRegion, regionEqual, regionDifference, regionIntersection, area} from './shadow-geometry-oracle.mjs';

const CONTRACT_SHA = 'b887e44320fa8fc9f871b620c2e8bf5041c183dcac93f214af8251a459255f45';
const INDEX_SHA = 'c24a01e2f047dacedf9db33d552dfdc16d7540ab788b957b6e92d37df8c342de';
const BANKS = ['photoReceipts', 'targetCredits'];
const INITIAL_INPUT = {cancelEpoch: 0, quarantined: true, aArmed: false, bArmed: false, direction: null, repeatAgeTicks: 0};
let parameters, assertionCount = 0, failureCount = 0, regionComparisons = 0;
const failures = [];
const maximumErrors = {geometryUnits: 0, regionSymmetricDifferenceArea: 0, filmSheets: 0, targetCount: 0, mechanicalTicks: 0};
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const readJSON = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));

function equal(actual, expected, label) {
  assertionCount++;
  if (!isDeepStrictEqual(actual, expected)) {
    failureCount++;
    if (failures.length < 100) failures.push({label, actual: JSON.stringify(actual)?.slice(0, 700), expected: JSON.stringify(expected)?.slice(0, 700)});
    return false;
  }
  return true;
}

// Raw geometry is validated independently; producer rectangle partitions need not match ours.
function compare(actual, expected, label) {
  if (label.endsWith('Rects')) {
    regionComparisons++;
    validatePublishedRegion(actual);
    const matched = regionEqual(actual, expected);
    equal(matched, true, label + '.exact region');
    if (!matched) maximumErrors.regionSymmetricDifferenceArea = Math.max(maximumErrors.regionSymmetricDifferenceArea, area(regionDifference(actual, expected)) + area(regionDifference(expected, actual)));
    return;
  }
  if (expected === null || typeof expected !== 'object') {
    if (typeof expected === 'number' && typeof actual === 'number') {
      const key = /(?:Origin[XY]|origin[XY]|velocity[XY]|x[01]|y[01])$/.test(label) ? 'geometryUnits' : /\.film\.(?:used|remaining|initial)$/.test(label) ? 'filmSheets' : label.endsWith('.activeTargetIndex') ? 'targetCount' : label.endsWith('.tick') ? 'mechanicalTicks' : null;
      if (key) maximumErrors[key] = Math.max(maximumErrors[key], Math.abs(actual - expected));
    }
    equal(actual, expected, label); return;
  }
  equal(Array.isArray(actual), Array.isArray(expected), label + '.container');
  if (actual === null || typeof actual !== 'object') throw new Error(label + ': missing object');
  equal(Object.keys(actual).sort(), Object.keys(expected).sort(), label + '.keys');
  for (const key of Object.keys(expected)) compare(actual[key], expected[key], label + '.' + key);
}

function controlFacts(before, raw, transactionId) {
  const finite = value => Number.isFinite(value) ? value : null;
  const rawX = finite(raw.x), rawY = finite(raw.y), rawCancelEpoch = finite(raw.cancelEpoch);
  const x = Math.max(-1, Math.min(1, rawX ?? 0)), y = Math.max(-1, Math.min(1, rawY ?? 0));
  const axis = value => value >= 0.55 ? 1 : value <= -0.55 ? -1 : 0;
  const axisX = axis(x), axisY = axis(y), rawA = raw.a === true, rawB = raw.b === true;
  const rawAPressed = raw.aPressed === true, rawBPressed = raw.bPressed === true;
  const effectiveA = rawA || rawAPressed, effectiveB = rawB || rawBPressed, cancelled = raw.cancelled === true;
  const cancelEpoch = rawCancelEpoch ?? before.cancelEpoch, epochChanged = cancelEpoch !== before.cancelEpoch;
  const after = {...before, cancelEpoch};
  let neutralAcknowledged = false, freshA = false, freshB = false, navigationRequested = null;
  if (cancelled || epochChanged) Object.assign(after, {quarantined: true, aArmed: false, bArmed: false, direction: null, repeatAgeTicks: 0});
  else if (before.quarantined) {
    if (!axisX && !axisY && !effectiveA && !effectiveB) {
      Object.assign(after, {quarantined: false, aArmed: true, bArmed: true}); neutralAcknowledged = true;
    }
  } else {
    const direction = axisY ? (axisY > 0 ? 'down' : 'up') : axisX ? (axisX > 0 ? 'right' : 'left') : null;
    const age = direction === before.direction ? before.repeatAgeTicks : 0;
    if (direction && (direction !== before.direction || age >= 12 && (age - 12) % 6 === 0)) navigationRequested = direction;
    freshA = effectiveA && before.aArmed; freshB = effectiveB && before.bArmed;
    Object.assign(after, {aArmed: !effectiveA, bArmed: !effectiveB, direction, repeatAgeTicks: direction ? age : 0});
  }
  const lastInput = {transactionId, rawX, rawY, x, y, axisX, axisY, rawA, rawB, rawAPressed, rawBPressed, effectiveA, effectiveB, cancelled, rawCancelEpoch, cancelEpoch, epochChanged,
    quarantinedBefore: before.quarantined, quarantinedAfter: after.quarantined, neutralAcknowledged, freshA, freshB, direction: after.direction, repeatAgeBefore: before.repeatAgeTicks, repeatAgeAfter: null};
  return {after, lastInput, navigationRequested, freshA, freshB};
}

function intervalFacts(from, to, transactionId, tick, aperture, film, targetIndex, photoReceiptIds, terminal) {
  return {intervalId: tick + 1, transactionId, fromTick: tick, toTick: tick + 1, fromMotionPhaseTick: from.motionPhaseTick, toMotionPhaseTick: to.motionPhaseTick, sourceSegmentIndex: from.segmentIndex, precedingPhotoReceiptIds: photoReceiptIds,
    actors: from.actors.map((a, index) => {
      const b = to.actors[index];
      return {id: a.id, fromOriginX: a.originX, fromOriginY: a.originY, toOriginX: b.originX, toOriginY: b.originY, velocityX: b.originX - a.originX, velocityY: b.originY - a.originY,
        fromMirrorX: a.mirrorX, toMirrorX: b.mirrorX, mirrorChangedAtEnd: a.mirrorX !== b.mirrorX};
    }),
    strip: {fromOriginX: from.strip.originX, fromOriginY: from.strip.originY, toOriginX: to.strip.originX, toOriginY: to.strip.originY, velocityX: to.strip.originX - from.strip.originX, velocityY: to.strip.originY - from.strip.originY},
    apertureDuringInterval: aperture, filmDuringInterval: film, targetIndexDuringInterval: targetIndex, terminalAfter: terminal, phaseAfter: terminal ? 'lost' : 'playing'};
}

function baseState(difficulty, seed) {
  const scenario = parameters.scenarios[difficulty], targets = targetsFor(parameters, scenario);
  const aperture = apertureAt(parameters, parameters.aperture.initialMode, ...parameters.aperture.initialCenterDoubledCells), scene = sceneAt(parameters, scenario, 0);
  return {schemaVersion: 1, identity: parameters.identity, width: 960, height: 540, seed, difficulty, level: difficulty + 1, levelName: scenario.name, scenarioId: scenario.id, scenario,
    physics: {geometry: parameters.geometry, aperture: parameters.aperture, motion: parameters.motion}, targets, deadlineTick: scenario.deadlineTick,
    phase: 'playing', tick: 0, elapsed: 0, score: 0, lostReason: null, terminal: null, activeTargetIndex: 0, activeTargetId: targets[0].targetId,
    film: {initial: scenario.initialFilm, used: 0, remaining: scenario.initialFilm}, aperture, scene, preview: previewAt(parameters, scene, aperture, targets[0], 0),
    inputState: {...INITIAL_INPUT}, lastInput: null, transactionCount: 0, lastTransaction: null, lastInterval: null, lastPhoto: null, lastFrameChange: null, photoReceipts: [], targetCredits: []};
}

function compareModel(actual, expected, label) {
  const {message, ...facts} = actual;
  equal(typeof message, 'string', label + '.display message type');
  compare(facts, expected, label);
}

// This calendar consumes actual input records. Motion is always absolute-time algebra,
// never an Euler step or a state correction from an observed scene/preview/match flag.
function auditRound(raw, label, entry) {
  const beforeAssertions = assertionCount, beforeFailures = failureCount, beforeRegions = regionComparisons;
  const bindingCounts = checkBindings(raw, label);
  const difficulty = raw.initial.model.difficulty, seed = raw.initial.model.seed;
  equal([0, 1, 2].includes(difficulty), true, label + '.difficulty domain');
  equal(Number.isSafeInteger(seed) && seed >= 0, true, label + '.seed domain');
  let expected = baseState(difficulty, seed);
  const counts = {transactions: 0, intervals: 0, frames: 0, photographs: 0, credits: 0, previews: 0, mirrorBitChanges: 0, segmentBoundaries: 0};
  const coverage = {captureTerminalWithoutInterval: 0, photosWithDifferentExposureNextTick: 0, finalSheetWin: 0, finalSheetNonfinalCreditLoss: 0,
    simultaneousBAndA: 0, navigationAndPhoto: 0, clampedNavigation: 0, heldShutterSuppressed: 0, cancelledIntervals: 0, neutralAcknowledgements: 0,
    captureAtMidpointMirror: 0, captureAtPhaseWrap: 0, stripOccludedPhotos: 0, requiredActorOccludedPhotos: 0, clippedPhotos: 0, symmetricMirrorGeometryUnchanged: 0,
    photoReasons: {}, terminalReasons: {}, ordinaryCounterexamplesToFuturePreview: 0};
  compareModel(raw.initial.model, expected, label + '.initial');
  for (let transactionIndex = 1; transactionIndex < raw.frames.length; transactionIndex++) {
    if (expected.terminal) throw new Error(label + ': actual transaction after first independently derived terminal');
    const trace = raw.transactionTrace[transactionIndex - 1], rawInput = trace.input;
    const transactionId = transactionIndex, fromTick = expected.tick, scenario = expected.scenario;
    const control = controlFacts(expected.inputState, rawInput, transactionId);
    const moved = moveAperture(parameters, expected.aperture, control.navigationRequested, control.freshB);
    const aperture = moved.afterB, sceneBefore = sceneAt(parameters, scenario, fromTick), target = expected.targets[expected.activeTargetIndex];
    const lastFrameChange = {transactionId, apertureBefore: expected.aperture, navigationRequested: control.navigationRequested,
      navigationChanged: moved.afterNavigation.centerX2 !== expected.aperture.centerX2 || moved.afterNavigation.centerY2 !== expected.aperture.centerY2,
      apertureAfterNavigation: moved.afterNavigation, modeToggleRequested: control.freshB, modeToggleApplied: control.freshB, apertureAfterB: aperture};
    let film = expected.film, targetIndex = expected.activeTargetIndex, photos = expected.photoReceipts, credits = expected.targetCredits, photo = null, terminal = null;
    const photoReceiptIds = [], creditIds = [];
    if (control.freshA) {
      const receiptId = photos.length + 1, result = evaluateCapture(parameters, sceneBefore, aperture, target);
      film = {initial: film.initial, used: film.used + 1, remaining: film.remaining - 1};
      if (result.matched) {
        const creditId = credits.length + 1;
        credits = [...credits, {creditId, targetIndex, targetId: target.targetId, photoReceiptId: receiptId, transactionId, boundaryTick: fromTick}];
        creditIds.push(creditId); targetIndex++;
      }
      const reason = targetIndex === expected.targets.length ? 'all_targets_captured' : film.remaining === 0 ? 'film_exhausted' : null;
      if (reason) terminal = {reason, boundaryTick: fromTick, transactionId};
      photo = {receiptId, transactionId, boundaryTick: fromTick, motionPhaseTick: sceneBefore.motionPhaseTick, segmentIndex: sceneBefore.segmentIndex,
        targetIndexBefore: expected.activeTargetIndex, targetIdBefore: target.targetId, targetIndexAfter: targetIndex, targetIdAfter: expected.targets[targetIndex]?.targetId ?? null,
        aperture, sceneAtCapture: sceneBefore, expected: target, ...result, filmBefore: expected.film, filmAfter: film, chargedFilm: 1, creditedTargetId: result.matched ? target.targetId : null, terminalAfterCapture: terminal};
      photos = [...photos, photo]; photoReceiptIds.push(receiptId);
      const observedPhoto = raw.frames[transactionIndex].state.model.lastPhoto;
      coverage.photoReasons[observedPhoto.reason] = (coverage.photoReasons[observedPhoto.reason] ?? 0) + 1;
      coverage.simultaneousBAndA += Number(control.freshB); coverage.navigationAndPhoto += Number(control.navigationRequested !== null);
      coverage.finalSheetWin += Number(film.remaining === 0 && terminal?.reason === 'all_targets_captured');
      coverage.finalSheetNonfinalCreditLoss += Number(result.matched && terminal?.reason === 'film_exhausted');
      coverage.clippedPhotos += Number(observedPhoto.actorChecks.some(actor => actor.outsideWorldRects.length || actor.outsideApertureRects.length));
      const observedScene = observedPhoto.sceneAtCapture;
      coverage.stripOccludedPhotos += Number(observedScene.actors.some(actor => regionIntersection(actor.worldRects, [observedScene.strip.worldRect]).length > 0));
      coverage.requiredActorOccludedPhotos += Number(observedScene.actors.some((actor, i) => observedScene.actors.slice(i + 1).some(front => regionIntersection(actor.worldRects, front.worldRects).length > 0)));
      coverage.captureAtPhaseWrap += Number(sceneBefore.motionPhaseTick === 0);
      const segment = parameters.motion.segments[sceneBefore.segmentIndex];
      coverage.captureAtMidpointMirror += Number(segment.kind === 'translate' && sceneBefore.motionPhaseTick - segment.fromPhaseTick === (segment.toPhaseTick - segment.fromPhaseTick) / 2);
    }
    const advanced = terminal === null, toTick = fromTick + Number(advanced);
    const scene = sceneAt(parameters, scenario, toTick);
    if (advanced && toTick >= scenario.deadlineTick) terminal = {reason: 'deadline', boundaryTick: toTick, transactionId};
    const phase = terminal ? terminal.reason === 'all_targets_captured' ? 'won' : 'lost' : 'playing';
    if (advanced && !control.after.quarantined && control.after.direction !== null) control.after.repeatAgeTicks++;
    control.lastInput.repeatAgeAfter = control.after.repeatAgeTicks;
    const lastInterval = advanced ? intervalFacts(sceneBefore, scene, transactionId, fromTick, aperture, film, targetIndex, photoReceiptIds, terminal) : null;
    const lastTransaction = {id: transactionId, fromTick, toTick, advanced, photoReceiptIds, creditIds, intervalId: advanced ? toTick : null, terminalAfter: terminal};
    const preview = previewAt(parameters, scene, aperture, expected.targets[targetIndex], toTick);
    expected = {...expected, tick: toTick, elapsed: toTick / 60, phase, terminal, lostReason: phase === 'lost' ? terminal.reason : null,
      score: phase === 'won' ? 1000 + 100 * film.remaining : 100 * targetIndex, activeTargetIndex: targetIndex, activeTargetId: expected.targets[targetIndex]?.targetId ?? null,
      film, aperture, scene, preview, inputState: control.after, lastInput: control.lastInput, transactionCount: transactionId,
      lastTransaction, lastInterval, lastPhoto: photo, lastFrameChange, photoReceipts: photos, targetCredits: credits};
    const frame = raw.frames[transactionIndex];
    equal(frame.transactionIndex, transactionIndex, label + '.frame transaction index');
    equal(frame.tick, toTick, label + '.frame mechanical tick');
    compareModel(expandFrame(raw, transactionIndex).model, expected, label + '.transaction' + transactionIndex);
    counts.transactions++; counts.frames++; counts.intervals += Number(advanced); counts.photographs += photoReceiptIds.length; counts.credits += creditIds.length; counts.previews += Number(preview !== null);
    coverage.captureTerminalWithoutInterval += Number(!advanced);
    coverage.clampedNavigation += Number(control.navigationRequested !== null && !lastFrameChange.navigationChanged);
    coverage.heldShutterSuppressed += Number(control.lastInput.effectiveA && !control.freshA && !control.lastInput.quarantinedBefore && !control.lastInput.cancelled && !control.lastInput.epochChanged && !control.lastInput.neutralAcknowledged);
    coverage.cancelledIntervals += Number(advanced && (control.lastInput.cancelled || control.lastInput.epochChanged));
    coverage.neutralAcknowledgements += Number(control.lastInput.neutralAcknowledged);
    if (lastInterval) {
      counts.segmentBoundaries += Number(sceneBefore.segmentIndex !== scene.segmentIndex);
      counts.mirrorBitChanges += lastInterval.actors.filter(actor => actor.mirrorChangedAtEnd).length;
      coverage.symmetricMirrorGeometryUnchanged += scene.actors.filter((actor, i) => lastInterval.actors[i].mirrorChangedAtEnd && regionEqual(actor.worldRects.map(r => ({x0: r.x0 - actor.originX, y0: r.y0 - actor.originY, x1: r.x1 - actor.originX, y1: r.y1 - actor.originY})), sceneBefore.actors[i].worldRects.map(r => ({x0: r.x0 - sceneBefore.actors[i].originX, y0: r.y0 - sceneBefore.actors[i].originY, x1: r.x1 - sceneBefore.actors[i].originX, y1: r.y1 - sceneBefore.actors[i].originY})))).length;
      if (photo) {
        const observedPhoto = frame.state.model.lastPhoto;
        const afterMotion = evaluateCapture(parameters, frame.state.model.scene, observedPhoto.aperture, observedPhoto.expected);
        coverage.photosWithDifferentExposureNextTick += Number(!regionEqual(observedPhoto.exposureLocalRects, afterMotion.exposureLocalRects));
        coverage.ordinaryCounterexamplesToFuturePreview += Number(observedPhoto.matched !== afterMotion.matched);
      }
    }
    if (terminal) coverage.terminalReasons[terminal.reason] = (coverage.terminalReasons[terminal.reason] ?? 0) + 1;
  }
  counts.frames++;
  compareModel(raw.final.model, expected, label + '.final');
  equal(expected.terminal !== null, true, label + '.natural terminal');
  equal(expected.tick, entry.actualFixedTicks, label + '.manifest actual ticks');
  equal(expected.transactionCount, entry.actualTransactions, label + '.manifest actual transactions');
  return {label, difficulty, level: difficulty + 1, passed: failureCount === beforeFailures, assertions: assertionCount - beforeAssertions,
    regionComparisons: regionComparisons - beforeRegions, counts: {...counts, ...bindingCounts}, coverage,
    result: {phase: expected.phase, terminal: expected.terminal, tick: expected.tick, transactionCount: expected.transactionCount, elapsed: expected.elapsed, score: expected.score, film: expected.film, activeTargetIndex: expected.activeTargetIndex, targetCredits: expected.targetCredits}};
}

function expandFrame(raw, index) {
  const frame = raw.frames[index], state = {...frame.state, model: {...frame.state.model}};
  for (const field of BANKS) state.model[field] = raw.actualReceipts[field].slice(0, frame.receiptPrefixLengths[field]);
  return state;
}

const keyInput = keys => ({x: Number(keys.includes('ArrowRight')) - Number(keys.includes('ArrowLeft')),
  y: Number(keys.includes('ArrowDown')) - Number(keys.includes('ArrowUp')), a: keys.includes('Space'), b: keys.includes('b'),
  aPressed: false, bPressed: false, cancelled: false, cancelEpoch: 0});

function checkBindings(raw, label) {
  const txCount = raw.final.model.transactionCount, tickCount = raw.final.model.tick;
  equal(raw.name, label, label + '.actual case name');
  equal(raw.passed, true, label + '.original result'); equal(raw.failure, null, label + '.original failure');
  equal(raw.difficulty, raw.initial.model.difficulty, label + '.difficulty metadata');
  equal(Number(label.match(/^level([123])-/)?.[1]), raw.initial.model.level, label + '.filename level');
  equal(Object.hasOwn(raw, 'pilotDiagnostics'), false, label + '.public projection');
  equal(raw.evidenceEncoding.version, 2, label + '.encoding version');
  equal(raw.evidenceEncoding.frameIndexBase, 0, label + '.frame base');
  equal(raw.evidenceEncoding.frameIndexEqualsTransactionIndex, true, label + '.transaction indices');
  equal(raw.evidenceEncoding.frameIndexEqualsTick, false, label + '.separate mechanical clock');
  equal(raw.evidenceEncoding.receiptFields, BANKS, label + '.banks');
  equal(Object.keys(raw.actualReceipts).sort(), [...BANKS].sort(), label + '.bank keys');
  equal(raw.actualTransactions, txCount, label + '.actual transactions'); equal(raw.actualFixedTicks, tickCount, label + '.actual intervals');
  equal(raw.frames.length, txCount + 1, label + '.frame count'); equal(raw.transactionTrace.length, txCount, label + '.transaction trace count');
  equal(raw.intervalTrace.length, tickCount, label + '.interval trace count');
  for (const bank of BANKS) {
    equal(raw.actualReceipts[bank], raw.final.model[bank], label + '.' + bank + '.complete actual bank');
    raw.actualReceipts[bank].forEach((receipt, index) => {
      equal(receipt[bank === 'photoReceipts' ? 'receiptId' : 'creditId'], index + 1, label + '.receipt sequence');
      equal(Number.isSafeInteger(receipt.transactionId) && receipt.transactionId >= 1 && receipt.transactionId <= txCount, true, label + '.receipt transaction domain');
      equal(receipt.boundaryTick, raw.frames[receipt.transactionId - 1].tick, label + '.capture boundary');
      if (index) equal(receipt.transactionId > raw.actualReceipts[bank][index - 1].transactionId, true, label + '.append order');
      if (bank === 'photoReceipts') {
        equal(receipt.sceneAtCapture, raw.frames[receipt.transactionId - 1].state.model.scene, label + '.detached actual capture scene');
        equal(receipt.aperture, raw.frames[receipt.transactionId].state.model.lastFrameChange.apertureAfterB, label + '.actual post-B aperture');
        equal(receipt.expected, raw.initial.model.targets[receipt.targetIndexBefore], label + '.detached actual target');
      }
    });
  }
  const expectedIntervals = [], expectedEvents = [], expectedOperations = [];
  for (let i = 0; i < raw.frames.length; i++) {
    const frame = raw.frames[i], model = frame.state.model;
    equal(Object.keys(frame).sort(), ['receiptPrefixLengths', 'state', 'tick', 'transactionIndex'], label + '.frame exact keys');
    equal(frame.transactionIndex, i, label + '.frame index'); equal(model.transactionCount, i, label + '.model transaction count');
    equal(frame.tick, model.tick, label + '.frame tick'); equal(Object.keys(frame.receiptPrefixLengths).sort(), [...BANKS].sort(), label + '.prefix keys');
    equal(model.targets, raw.initial.model.targets, label + '.immutable actual target values');
    for (const bank of BANKS) {
      equal(Object.hasOwn(model, bank), false, label + '.omitted bank');
      equal(frame.receiptPrefixLengths[bank], raw.actualReceipts[bank].filter(receipt => receipt.transactionId <= i).length, label + '.exact receipt prefix');
    }
    const {model: ignored, ...outer} = frame.state;
    equal(outer, {phase: model.phase, paused: false, level: model.difficulty, difficulty: model.difficulty, score: model.score}, label + '.outer wrapper');
    if (!i) continue;
    const trace = raw.transactionTrace[i - 1], before = raw.frames[i - 1].state.model;
    const {input, beforeFrameIndex, afterFrameIndex, ...actualTransaction} = trace;
    equal(beforeFrameIndex, i - 1, label + '.transaction before ref'); equal(afterFrameIndex, i, label + '.transaction after ref');
    equal(actualTransaction, model.lastTransaction, label + '.full transaction observation');
    equal(actualTransaction.id, i, label + '.transaction ID'); equal(actualTransaction.fromTick, before.tick, label + '.transaction from tick');
    equal(actualTransaction.toTick, model.tick, label + '.transaction to tick');
    equal(model.tick - before.tick, Number(actualTransaction.advanced), label + '.one or zero real interval');
    if (model.lastInterval !== null) {
      equal(actualTransaction.advanced, true, label + '.interval requires advance');
      equal(model.lastInterval.intervalId, expectedIntervals.length + 1, label + '.continuous interval ID');
      equal(model.lastInterval.transactionId, i, label + '.interval transaction');
      equal(model.lastInterval.fromTick, before.tick, label + '.interval from'); equal(model.lastInterval.toTick, model.tick, label + '.interval to');
      expectedIntervals.push({...model.lastInterval, input, beforeFrameIndex: i - 1, afterFrameIndex: i});
    } else equal(actualTransaction.advanced, false, label + '.no fabricated interval');
    const receiptIds = Object.fromEntries(BANKS.map(bank => [bank, raw.actualReceipts[bank].filter(receipt => receipt.transactionId === i).map(receipt => receipt[bank === 'photoReceipts' ? 'receiptId' : 'creditId'])]));
    equal(model.lastPhoto, raw.actualReceipts.photoReceipts.find(receipt => receipt.transactionId === i) ?? null, label + '.actual transaction photo copy');
    equal(model.lastTransaction.photoReceiptIds, receiptIds.photoReceipts, label + '.transaction photo IDs');
    equal(model.lastTransaction.creditIds, receiptIds.targetCredits, label + '.transaction credit IDs');
    if (BANKS.some(bank => receiptIds[bank].length) || before.phase !== model.phase || model.lastFrameChange.navigationRequested !== null || model.lastFrameChange.modeToggleRequested) {
      expectedEvents.push({transactionId: i, tick: model.tick, input, beforeFrameIndex: i - 1, afterFrameIndex: i, receiptIds,
        actualTransaction: model.lastTransaction, actualLastInterval: model.lastInterval, actualFrameChange: model.lastFrameChange});
    }
    for (const bank of BANKS) for (const receipt of raw.actualReceipts[bank].filter(receipt => receipt.transactionId === i)) {
      expectedOperations.push({kind: bank, observedAt: model.elapsed, receipt, beforeFrameIndex: i - 1, afterFrameIndex: i});
    }
  }
  equal(raw.initial, expandFrame(raw, 0), label + '.full initial expansion');
  equal(raw.final, expandFrame(raw, txCount), label + '.full final expansion');
  equal(raw.intervalTrace, expectedIntervals, label + '.all-and-only complete actual intervals');
  equal(raw.eventTransitions, expectedEvents, label + '.all-and-only event windows');
  equal(raw.operations.map(({boundaryScope, ...operation}) => { equal(typeof boundaryScope, 'string', label + '.operation scope'); return operation; }), expectedOperations, label + '.all-and-only operations');
  const eventIndices = new Set(expectedEvents.map(event => event.transactionId));
  const retainedIndices = [0]; let lastRetainedTick = 0;
  for (let i = 1; i < raw.frames.length; i++) if (eventIndices.has(i) || raw.frames[i].tick - lastRetainedTick >= 60) {
    retainedIndices.push(i); lastRetainedTick = raw.frames[i].tick;
  }
  if (retainedIndices.at(-1) !== txCount) retainedIndices.push(txCount);
  equal(raw.retained.map(item => item.frameIndex), retainedIndices, label + '.retained frame coverage');
  raw.retained.forEach(item => {
    equal(item.seconds, raw.frames[item.frameIndex].tick / 60, label + '.retained time');
    equal(typeof item.basis, 'string', label + '.retained basis');
  });
  let previousKeys = [], changeIndex = 0, sampleIndex = 0;
  const observationIndices = []; for (let tx = 0, n = 0; tx < txCount; tx += [5, 8, 11][n++ % 3]) observationIndices.push(tx);
  equal(raw.cadenceTicks, [5, 8, 11], label + '.actual cadence metadata');
  equal(raw.compactTrace.map(item => item.transactionIndex), observationIndices, label + '.complete actual feedback samples');
  for (const compact of raw.compactTrace) {
    const frame = raw.frames[compact.transactionIndex], model = frame.state.model, keys = compact.keys;
    equal(keys.every(key => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'b'].includes(key)) && new Set(keys).size === keys.length, true, label + '.ordinary key domain');
    equal(compact, {transactionIndex: frame.transactionIndex, tick: model.tick, keys, phase: model.phase, activeTargetIndex: model.activeTargetIndex, activeTargetId: model.activeTargetId,
      film: model.film, aperture: model.aperture, preview: model.preview, receiptCounts: frame.receiptPrefixLengths}, label + '.compact actual fields');
    if (!isDeepStrictEqual(keys, previousKeys)) {
      equal(raw.inputChanges[changeIndex++], {transactionIndex: frame.transactionIndex, tick: model.tick, elapsed: model.elapsed, from: previousKeys, to: keys}, label + '.input change');
      previousKeys = keys;
    }
    const timing = raw.pilotCallTimings[sampleIndex++];
    equal(timing.transactionIndex, frame.transactionIndex, label + '.call transaction'); equal(timing.tick, model.tick, label + '.call tick');
    equal(timing.returnedKeys, keys, label + '.actual returned keys'); equal(Number.isFinite(timing.milliseconds) && timing.milliseconds >= 0, true, label + '.measured call time');
  }
  equal(changeIndex, raw.inputChanges.length, label + '.all input changes'); equal(sampleIndex, raw.pilotCallTimings.length, label + '.all actual call timings');
  sampleIndex = 0;
  raw.transactionTrace.forEach((trace, index) => {
    while (sampleIndex + 1 < raw.compactTrace.length && raw.compactTrace[sampleIndex + 1].transactionIndex <= index) sampleIndex++;
    equal(trace.input, keyInput(raw.compactTrace[sampleIndex].keys), label + '.held input applies to next transaction');
  });
  equal(raw.final.model.phase, raw.mode === 'record' ? 'won' : 'lost', label + '.actual mode outcome');
  if (raw.mode === 'loss') equal(raw.final.model.lostReason, raw.expectedReason, label + '.natural loss reason');
  return {retained: raw.retained.length, compactSamples: raw.compactTrace.length, eventWindows: raw.eventTransitions.length, operations: raw.operations.length, inputChanges: raw.inputChanges.length, fullSnapshots: raw.frames.length + 2};
}

function main() {
  const [indexArgument, outputArgument, approvedIndex] = process.argv.slice(2);
  if (!indexArgument || !outputArgument || approvedIndex !== INDEX_SHA) throw new Error('Usage: node independent-shadow-review.mjs PUBLIC_INDEX FRESH_OUTPUT APPROVED_INDEX_SHA');
  const indexPath = path.resolve(indexArgument), outputPath = path.resolve(outputArgument);
  if (fs.existsSync(outputPath)) throw new Error('Refusing to overwrite an audit output directory');
  const thisFile = fileURLToPath(import.meta.url), app = path.resolve(path.dirname(thisFile), '..'), repo = path.resolve(app, '../../..');
  const scratch = path.resolve(repo, '../scratch'), contractPath = path.join(app, 'docs/model-contract.md'), oraclePath = path.join(app, 'tests/shadow-geometry-oracle.mjs');
  const indexBytes = fs.readFileSync(indexPath), index = JSON.parse(indexBytes);
  const sourceFiles = [thisFile, oraclePath, contractPath, indexPath, ...index.rounds.map(entry => path.join(path.dirname(indexPath), entry.file))];
  const portable = filename => filename.startsWith(repo + path.sep) ? 'repo:' + path.relative(repo, filename) : filename.startsWith(scratch + path.sep) ? 'scratch:' + path.relative(scratch, filename) : (() => {throw new Error('Source outside approved roots');})();
  const hashWindow = () => Object.fromEntries(sourceFiles.map(filename => [portable(filename), sha(fs.readFileSync(filename))]));
  fs.mkdirSync(outputPath, {recursive: false});
  const startedAt = new Date().toISOString(), startHashes = hashWindow(), rounds = [];
  let exception = null;
  try {
    if (!equal([sha(indexBytes), startHashes[portable(indexPath)]], [INDEX_SHA, INDEX_SHA], 'approved public index bytes and source window')) throw new Error('Public index changed');
    if (!equal(startHashes[portable(contractPath)], CONTRACT_SHA, 'approved public contract')) throw new Error('Public contract changed');
    equal(index.rounds.map(entry => entry.name), [1, 2, 3].flatMap(level => ['record', 'loss'].map(mode => `level${level}-${mode}`)), 'six original cases');
    equal(index.originalFilesUnchanged, true, 'root projection preserves original bytes');
    parameters = readParameters(fs.readFileSync(contractPath, 'utf8'));
    for (const run of index.sourceRuns) {
      equal(run.startHashes, run.endHashes, 'original ordinary source window');
      equal(run.startHashes.contract, CONTRACT_SHA, 'original ordinary contract');
    }
    for (const entry of index.rounds) {
      const filename = path.join(path.dirname(indexPath), entry.file);
      if (!equal(startHashes[portable(filename)], entry.sha256, entry.name + '.projected bytes')) throw new Error('Projected bytes changed');
      equal(entry.sourceHashes, index.sourceRuns.find(run => run.sha256 === entry.originalReportSha256)?.startHashes, entry.name + '.original source binding');
      equal(entry.removedPaths, ['pilotDiagnostics'], entry.name + '.only removed diagnostics');
      const raw = readJSON(filename), summary = auditRound(raw, entry.name, entry);
      rounds.push({...summary, source: {file: entry.file, projectedSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, originalReportSha256: entry.originalReportSha256, sourceHashes: entry.sourceHashes}});
      process.stdout.write(JSON.stringify({case: entry.name, passed: summary.passed, assertions: summary.assertions, result: summary.result}) + '\n');
      if (failureCount) break;
    }
  } catch (error) { exception = {name: error.name, message: error.message, stack: String(error.stack).split('\n').slice(0, 10)}; }
  const endHashes = hashWindow(), completedAt = new Date().toISOString();
  equal(endHashes, startHashes, 'audit source window unchanged');
  const sumAssertions = rounds.reduce((sum, round) => sum + round.assertions, 0);
  const totals = {}; for (const round of rounds) for (const [key, value] of Object.entries(round.counts)) totals[key] = (totals[key] ?? 0) + value;
  const report = {schemaVersion: 1, game: 'shadow-shutter', passed: !exception && failureCount === 0 && rounds.length === 6,
    method: 'Independent exact horizontal-band sweep and interval-set algebra; absolute-tick piecewise origin/mirror/strip formulas; original held inputs and transaction-local aperture/film/credit receipts. No production import, replay, search or new gameplay.',
    limitations: ['Only the six existing public ordinary cases; unencountered last-sheet wins, clipping/occlusion/mirror boundaries, cancellation and dt/error inputs are not claimed as ordinary coverage.',
      'Geometric equality is partition-independent, while record copies and provenance bindings preserve exact actual JSON values. All integer geometry, gates, film and time comparisons use zero tolerance.',
      'Input checks cover recorded ordinary held-key samples and their documented normalization/repeat congruence; browser event delivery, pause/retry, video, rendering, object identity and runtime Object.freeze are not established by JSON observations.',
      'Next-interval exposure counters use the saved actual photo and the actually retained returned scene, evaluated against that photo target; no future predicted state or hypothetical route is counted.',
      'Original raw source hashes are inherited from the root-reviewed lossless public manifest; original diagnostic-bearing files and production implementations are not read.'],
    sources: {contract: {repoRelative: path.relative(repo, contractPath), sha256: CONTRACT_SHA}, oracle: {repoRelative: path.relative(repo, oraclePath), sha256: startHashes[portable(oraclePath)]}, runner: {repoRelative: path.relative(repo, thisFile), sha256: startHashes[portable(thisFile)]},
      publicIndex: {scratchRelative: path.relative(scratch, indexPath), sha256: sha(indexBytes)}, originalReportSha256: index.originalReportSha256,
      sourceRuns: index.sourceRuns.map(({path: filename, ...rest}) => ({scratchRelative: path.relative(scratch, filename), ...rest}))},
    sourceWindow: {startedAt, completedAt, startHashes, endHashes, unchanged: isDeepStrictEqual(startHashes, endHashes)},
    assertions: assertionCount, roundAssertions: sumAssertions, globalAssertions: assertionCount - sumAssertions, failureCount, failures, exception,
    comparisonTolerance: {geometricUnits: 0, regionArea: 0, film: 0, targetCount: 0, ticks: 0}, maximumErrors, regionComparisons, totals, rounds};
  fs.writeFileSync(path.join(outputPath, 'report.json'), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  process.stdout.write(JSON.stringify({passed: report.passed, assertions: report.assertions, failureCount, totals, maximumErrors}) + '\n');
  process.exitCode = report.passed ? 0 : 1;
}

main();
