// Offline public-observation review; never imports Model, pilot or a production helper.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {readParameters, beltAt, motionAt, wrapCalendar, gripperTimeline, gripperXAt, latestAt,
  gateAt, nearest, dispatchResult, previewAt, outcomeAt} from './conveyor-interval-oracle.mjs';

const CONTRACT_SHA = 'aedd91ef43b66ebe6fe40351509ef612ea6f1fe9e9ad3315634ebbf529f80ba1';
const BANKS = ['actionReceipts', 'wrapReceipts'];
const INITIAL_INPUT = {cancelEpoch: null, quarantined: true, aArmed: false, bArmed: false};
let parameters, assertionCount = 0, failureCount = 0;
const failures = [], maximumErrors = {positionUnits: 0, generation: 0, counters: 0, ticks: 0};
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

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
      const key = /\.(?:x|y|fromX|rawToX|toX|gripperX)$/.test(label) ? 'positionUnits' : /(?:Generation|generation)$/.test(label) ? 'generation' : /\.(?:streak|totalCorrect|faults)$/.test(label) ? 'counters' : /(?:Tick|tick)$/.test(label) ? 'ticks' : null;
      if (key) maximumErrors[key] = Math.max(maximumErrors[key], Math.abs(actual - expected));
    }
    equal(actual, expected, label); return;
  }
  equal(Array.isArray(actual), Array.isArray(expected), label + '.container');
  if (actual === null || typeof actual !== 'object') throw new Error(label + ': missing object');
  equal(Object.keys(actual).sort(), Object.keys(expected).sort(), label + '.keys');
  for (const key of Object.keys(expected)) compare(actual[key], expected[key], label + '.' + key);
}

// Only input latches are folded in order. Mechanical positions and ownership are not stepped.
function inputCalendar(samples) {
  let latch = {...INITIAL_INPUT};
  return samples.map((raw, boundaryTick) => {
    const finite = value => Number.isFinite(value) ? value : null;
    const rawX = finite(raw.x), rawY = finite(raw.y), rawCancelEpoch = finite(raw.cancelEpoch);
    const x = Math.max(-1, Math.min(1, rawX ?? 0)), y = Math.max(-1, Math.min(1, rawY ?? 0));
    const axis = value => value >= 0.55 ? 1 : value <= -0.55 ? -1 : 0;
    const axisX = axis(x), axisY = axis(y), rawA = raw.a === true, rawB = raw.b === true;
    const rawAPressed = raw.aPressed === true, rawBPressed = raw.bPressed === true;
    const effectiveA = rawA || rawAPressed, effectiveB = rawB || rawBPressed, cancelled = raw.cancelled === true;
    const cancelEpoch = rawCancelEpoch ?? latch.cancelEpoch, epochChanged = cancelEpoch !== latch.cancelEpoch;
    const before = latch, after = {...latch, cancelEpoch};
    let neutralAcknowledged = false, freshA = false, freshB = false, velocityX = 0;
    if (cancelled || epochChanged) Object.assign(after, {quarantined: true, aArmed: false, bArmed: false});
    else if (before.quarantined) {
      if (!axisX && !axisY && !effectiveA && !effectiveB) {
        Object.assign(after, {quarantined: false, aArmed: true, bArmed: true}); neutralAcknowledged = true;
      }
    } else {
      freshA = effectiveA && before.aArmed; freshB = effectiveB && before.bArmed;
      Object.assign(after, {aArmed: !effectiveA, bArmed: !effectiveB});
      velocityX = axisX * parameters.geometry.gripperSpeedUnitsPerTick;
    }
    latch = after;
    const lastInput = {boundaryTick, rawX, rawY, x, y, axisX, axisY, rawA, rawB, rawAPressed, rawBPressed, effectiveA, effectiveB, cancelled,
      rawCancelEpoch, cancelEpoch, epochChanged, quarantinedBefore: before.quarantined, quarantinedAfter: after.quarantined, neutralAcknowledged, freshA, freshB, velocityX};
    return {lastInput, inputState: after, actions: [...(freshB ? ['rotate'] : []), ...(freshA ? ['grab_or_dispatch'] : [])]};
  });
}

function buildLedger(scenario, inputs) {
  const geometry = parameters.geometry, length = geometry.trackLengthUnits;
  const segments = gripperTimeline(parameters, inputs.map(input => input.lastInput.velocityX));
  const wraps = wrapCalendar(parameters, scenario, inputs.length);
  const catalog = [], byId = new Map(), sourceOccupants = new Map(), slotOccupants = new Map(scenario.targetSlots.map(slot => [slot.id, null]));
  const actionReceipts = [], wrapReceipts = [], ownershipVersions = [], counterVersions = [];
  let heldPartId = null, counters = {streak: 0, totalCorrect: 0, faults: 0};
  let terminal = {reason: 'deadline', actionBoundaryTick: null, endedTick: scenario.deadlineTick};
  const xAt = tick => gripperXAt(parameters, segments, tick);
  const sourceById = new Map(scenario.sourceCarriers.map(item => [item.id, item])), slotById = new Map(scenario.targetSlots.map(item => [item.id, item]));
  const sourceRows = (tick, occupants) => scenario.sourceCarriers.map(item => ({id: item.id, ...beltAt(item.initialX, scenario.sourceVelocity, tick, length), y: geometry.sourceY,
    type: item.type, initialQuarterTurns: item.initialQuarterTurns, partId: occupants.get(item.id)}));
  const slotRows = (tick, occupants) => scenario.targetSlots.map(item => ({id: item.id, ...beltAt(item.initialX, scenario.targetVelocity, tick, length), y: geometry.targetY,
    requiredType: item.requiredType, requiredQuarterTurns: item.requiredQuarterTurns, occupantPartId: occupants.get(item.id)}));
  function addPart(carrier, generation, createdTick) {
    const id = `${carrier.id}@${generation}`;
    if (byId.has(id)) throw new Error('Duplicate independently derived part identity');
    const entry = {id, sourceCarrierId: carrier.id, birthGeneration: generation, type: carrier.type, createdTick,
      versions: [{availableTick: createdTick, quarterTurns: carrier.initialQuarterTurns, owner: 'source', ownerId: carrier.id, ownerGeneration: generation, endedTick: null, endReason: null}]};
    catalog.push(entry); byId.set(id, entry); sourceOccupants.set(carrier.id, id);
    return id;
  }
  function partValue(entry, version, tick) {
    const {availableTick, fixedX, fixedY, ...fields} = version;
    let x, y;
    if (fields.owner === 'source') { const carrier = sourceById.get(fields.ownerId); x = beltAt(carrier.initialX, scenario.sourceVelocity, tick, length).x; y = geometry.sourceY; }
    else if (fields.owner === 'slot') { const slot = slotById.get(fields.ownerId); x = beltAt(slot.initialX, scenario.targetVelocity, tick, length).x; y = geometry.targetY; }
    else if (fields.owner === 'held') { x = xAt(tick); y = geometry.heldY; }
    else { x = fixedX; y = fixedY; }
    const {versions, ...identity} = entry;
    return {...identity, ...fields, x, y};
  }
  const livePart = (id, tick) => id === null ? null : partValue(byId.get(id), byId.get(id).versions.at(-1), tick);
  function changePart(id, availableTick, changes) {
    const entry = byId.get(id);
    entry.versions.push({...entry.versions.at(-1), ...changes, availableTick});
  }
  function remember(availableTick) {
    ownershipVersions.push({availableTick, heldPartId, source: Object.fromEntries(sourceOccupants), slots: Object.fromEntries(slotOccupants)});
    counterVersions.push({availableTick, ...counters});
  }
  scenario.sourceCarriers.forEach(carrier => addPart(carrier, 0, 0)); remember(0);

  // Wraps at t finish the previous interval; actions at t then see that new generation.
  // An action version is visible in returned frame t+1; later wraps at t+1 supersede it.
  const events = [...wraps.map((wrap, order) => ({time: wrap.endedTick, priority: 0, order, wrap})),
    ...inputs.flatMap((input, tick) => input.actions.map((action, order) => ({time: tick, priority: 1, order, action})))];
  events.sort((a, b) => a.time - b.time || a.priority - b.priority || a.order - b.order);
  for (const event of events) {
    const tick = event.time;
    if (event.wrap) {
      const wrap = event.wrap, source = wrap.belt === 'source', occupants = source ? sourceOccupants : slotOccupants;
      const exitedPartId = occupants.get(wrap.carrierId), velocity = source ? scenario.sourceVelocity : scenario.targetVelocity;
      if (exitedPartId !== null) changePart(exitedPartId, tick, {owner: source ? 'retired' : 'completed', ownerId: null, ownerGeneration: null,
        endedTick: tick, endReason: source ? 'source_exit' : 'target_exit', fixedX: velocity > 0 ? length : 0, fixedY: source ? geometry.sourceY : geometry.targetY});
      let newPartId = null;
      if (source) newPartId = addPart(sourceById.get(wrap.carrierId), wrap.generation, tick);
      else slotOccupants.set(wrap.carrierId, null);
      const m = wrap.motion;
      wrapReceipts.push({id: wrapReceipts.length + 1, endedTick: tick, belt: wrap.belt, carrierId: wrap.carrierId,
        fromGeneration: m.generationBefore, toGeneration: m.generationAfter, fromX: m.fromX, rawToX: m.rawToX, toX: m.toX, exitedPartId, newPartId});
      remember(tick); continue;
    }
    const x = xAt(tick), beforeCounters = {...counters};
    let partId = heldPartId, partBefore = livePart(partId, tick), sourceAtAction = null, slotAtAction = null, result;
    if (event.action === 'rotate') {
      result = partId === null ? 'empty_rotate' : 'rotated';
      if (partId !== null) changePart(partId, tick + 1, {quarterTurns: (partBefore.quarterTurns + 1) % 4});
    } else if (heldPartId === null) {
      sourceAtAction = nearest(sourceRows(tick, sourceOccupants).filter(carrier => carrier.partId !== null), x);
      result = sourceAtAction && Math.abs(sourceAtAction.x - x) <= geometry.pickupRadiusUnits ? 'grabbed' : 'empty_grab';
      if (result === 'grabbed') {
        partId = sourceAtAction.partId; partBefore = livePart(partId, tick); sourceOccupants.set(sourceAtAction.id, null); heldPartId = partId;
        changePart(partId, tick + 1, {owner: 'held', ownerId: 'gripper', ownerGeneration: null});
      }
    } else {
      slotAtAction = nearest(slotRows(tick, slotOccupants), x);
      result = dispatchResult(parameters, scenario, tick, x, partBefore, slotAtAction);
      heldPartId = null;
      if (result === 'seated') {
        slotOccupants.set(slotAtAction.id, partId);
        changePart(partId, tick + 1, {owner: 'slot', ownerId: slotAtAction.id, ownerGeneration: slotAtAction.generation});
        counters = {...counters, streak: counters.streak + 1, totalCorrect: counters.totalCorrect + 1};
      } else {
        changePart(partId, tick + 1, {owner: 'damaged', ownerId: null, ownerGeneration: null, endedTick: tick, endReason: result, fixedX: x, fixedY: geometry.heldY});
        counters = {...counters, streak: 0, faults: counters.faults + 1};
      }
    }
    actionReceipts.push({id: actionReceipts.length + 1, boundaryTick: tick, action: event.action, partId, result, gripperX: x, gateAtAction: gateAt(scenario, tick),
      sourceAtAction, slotAtAction, partBefore, partAfter: livePart(partId, tick),
      streakBefore: beforeCounters.streak, streakAfter: counters.streak, totalCorrectBefore: beforeCounters.totalCorrect, totalCorrectAfter: counters.totalCorrect,
      faultsBefore: beforeCounters.faults, faultsAfter: counters.faults});
    const candidate = outcomeAt(scenario, counters, tick + 1, parameters.roundRules.faultLimit);
    if (candidate && candidate.endedTick <= terminal.endedTick) terminal = candidate;
    remember(tick + 1);
  }

  const ownershipAt = tick => latestAt(ownershipVersions, tick);
  const countersAt = tick => { const {availableTick, ...result} = latestAt(counterVersions, tick); return result; };
  const partsAt = tick => catalog.filter(entry => entry.createdTick <= tick).map(entry => partValue(entry, latestAt(entry.versions, tick), tick));
  const gripperAt = tick => ({x: xAt(tick), y: geometry.heldY, heldPartId: ownershipAt(tick).heldPartId});
  function stateAt(tick, difficulty, seed) {
    const ownership = ownershipAt(tick), counters = countersAt(tick), gripper = gripperAt(tick), parts = partsAt(tick);
    const sourceCarriers = sourceRows(tick, new Map(Object.entries(ownership.source))), targetSlots = slotRows(tick, new Map(Object.entries(ownership.slots)));
    const actions = actionReceipts.filter(receipt => receipt.boundaryTick < tick), visibleWraps = wrapReceipts.filter(receipt => receipt.endedTick <= tick);
    const terminalNow = tick >= terminal.endedTick ? terminal : null, phase = terminalNow ? terminalNow.reason === 'required_streak' ? 'won' : 'lost' : 'playing';
    const currentActions = actions.filter(receipt => receipt.boundaryTick === tick - 1), currentWraps = visibleWraps.filter(receipt => receipt.endedTick === tick);
    const lastStep = tick ? {fromTick: tick - 1, toTick: tick, gateBefore: gateAt(scenario, tick - 1), gateAfter: gateAt(scenario, tick),
      // Public clarification: Before means whole-call pre-input, After means completed interval.
      gripperBefore: gripperAt(tick - 1), gripperAfter: gripper, allowedVelocityX: inputs[tick - 1].lastInput.velocityX,
      sourceMotion: scenario.sourceCarriers.map(carrier => motionAt(carrier, scenario.sourceVelocity, tick - 1, length)), targetMotion: scenario.targetSlots.map(slot => motionAt(slot, scenario.targetVelocity, tick - 1, length)),
      actionReceiptIds: currentActions.map(receipt => receipt.id), wrapReceiptIds: currentWraps.map(receipt => receipt.id), countersBefore: countersAt(tick - 1), countersAfter: counters, terminalAfter: terminalNow} : null;
    return {width: 960, height: 540, schemaVersion: 1, identity: parameters.identity, seed, difficulty, level: difficulty + 1, levelName: scenario.name, scenarioId: scenario.id, scenario,
      physics: {geometry: parameters.geometry, motion: parameters.motion, gate: parameters.gate, dispatch: parameters.dispatch, roundRules: parameters.roundRules}, partTypes: parameters.partTypes,
      phase, tick, elapsed: tick / parameters.geometry.ticksPerSecond, score: phase === 'won' ? 1000 + 100 * scenario.requiredStreak + 100 * (parameters.roundRules.faultLimit - counters.faults) : 100 * counters.totalCorrect,
      lostReason: phase === 'lost' ? terminalNow.reason : null, terminal: terminalNow, deadlineTick: scenario.deadlineTick, requiredStreak: scenario.requiredStreak, faultLimit: parameters.roundRules.faultLimit,
      ...counters, gripper, gate: gateAt(scenario, tick), sourceCarriers, targetSlots, parts, preview: previewAt(parameters, scenario, tick, gripper, sourceCarriers, targetSlots),
      inputState: tick ? inputs[tick - 1].inputState : {...INITIAL_INPUT}, lastInput: tick ? inputs[tick - 1].lastInput : null,
      actionReceipts: actions, wrapReceipts: visibleWraps, lastAction: currentActions.at(-1) ?? null, lastStep};
  }
  return {stateAt, terminal, actionReceipts, wrapReceipts, catalog, segments, ownershipVersions};
}

function compareModel(actual, expected, label, compressed = false) {
  const {message, ...facts} = actual;
  const expectedFacts = {...expected};
  if (compressed) for (const bank of BANKS) delete expectedFacts[bank];
  equal(typeof message, 'string', label + '.display message'); compare(facts, expectedFacts, label);
}

const firstObservedTick = (bank, receipt) => bank === 'actionReceipts' ? receipt.boundaryTick + 1 : receipt.endedTick;
const ownerCounts = parts => Object.fromEntries(['source', 'held', 'slot', 'completed', 'retired', 'damaged'].map(owner => [owner, parts.filter(part => part.owner === owner).length]));
const keyInput = keys => ({x: Number(keys.includes('ArrowRight')) - Number(keys.includes('ArrowLeft')), y: 0,
  a: keys.includes('Space'), b: keys.includes('b'), aPressed: false, bPressed: false, cancelled: false, cancelEpoch: 0});

function expandFrame(raw, index) {
  const frame = raw.frames[index], result = {...frame.state, model: {...frame.state.model}};
  for (const bank of BANKS) result.model[bank] = raw.actualReceipts[bank].slice(0, frame.receiptPrefixLengths[bank]);
  return result;
}

function checkBindings(raw, label) {
  const finalTick = raw.final.model.tick;
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
    equal(Array.isArray(model.parts), true, label + '.full mutable registry present');
    if (!i) continue;
    const trace = raw.intervalTrace[i - 1], before = raw.frames[i - 1].state.model;
    const {input, beforeFrameIndex, afterFrameIndex, ...lastStep} = trace;
    equal(beforeFrameIndex, i - 1, label + '.interval before frame'); equal(afterFrameIndex, i, label + '.interval after frame');
    equal(lastStep, model.lastStep, label + '.complete actual lastStep');
    equal(lastStep.fromTick, i - 1, label + '.interval from'); equal(lastStep.toTick, i, label + '.interval to');
    const current = Object.fromEntries(BANKS.map(bank => [bank, raw.actualReceipts[bank].filter(receipt => firstObservedTick(bank, receipt) === i)]));
    const receiptIds = Object.fromEntries(BANKS.map(bank => [bank, current[bank].map(receipt => receipt.id)]));
    equal(model.lastAction, current.actionReceipts.at(-1) ?? null, label + '.actual last action copy');
    equal(lastStep.actionReceiptIds, receiptIds.actionReceipts, label + '.interval action IDs'); equal(lastStep.wrapReceiptIds, receiptIds.wrapReceipts, label + '.interval wrap IDs');
    if (BANKS.some(bank => receiptIds[bank].length) || before.phase !== model.phase) expectedEvents.push({tick: i, input, beforeFrameIndex: i - 1, afterFrameIndex: i, receiptIds, actualLastStep: model.lastStep});
    for (const bank of BANKS) for (const receipt of current[bank]) expectedOperations.push({kind: bank, observedAt: i / 60, receipt, beforeFrameIndex: i - 1, afterFrameIndex: i});
  }
  equal(raw.initial, expandFrame(raw, 0), label + '.full initial expansion'); equal(raw.final, expandFrame(raw, finalTick), label + '.full final expansion');
  equal(raw.eventTransitions, expectedEvents, label + '.all-and-only event windows');
  equal(raw.operations.map(({boundaryScope, ...operation}) => { equal(typeof boundaryScope, 'string', label + '.operation scope'); return operation; }), expectedOperations, label + '.all-and-only receipt operations');
  const eventTicks = new Set(expectedEvents.map(event => event.tick)), retainedTicks = [0]; let lastRetained = 0;
  for (let tick = 1; tick <= finalTick; tick++) if (eventTicks.has(tick) || tick - lastRetained >= 60) { retainedTicks.push(tick); lastRetained = tick; }
  if (retainedTicks.at(-1) !== finalTick) retainedTicks.push(finalTick);
  equal(raw.retained.map(item => item.frameIndex), retainedTicks, label + '.retained exact coverage');
  raw.retained.forEach(item => { equal(item.seconds, item.frameIndex / 60, label + '.retained time'); equal(typeof item.basis, 'string', label + '.retained basis'); });
  const sampleTicks = []; for (let tick = 0, n = 0; tick < finalTick; tick += [5, 8, 11][n++ % 3]) sampleTicks.push(tick);
  equal(raw.compactTrace.map(item => item.tick), sampleTicks, label + '.actual feedback cadence');
  let keysBefore = [], changeIndex = 0;
  raw.compactTrace.forEach((compact, i) => {
    const frame = raw.frames[compact.tick], model = frame.state.model, keys = compact.keys;
    equal(keys.every(key => ['ArrowLeft', 'ArrowRight', 'Space', 'b'].includes(key)) && new Set(keys).size === keys.length && !(keys.includes('ArrowLeft') && keys.includes('ArrowRight')), true, label + '.ordinary keys');
    equal(compact, {tick: model.tick, keys, phase: model.phase, gripper: model.gripper, gate: model.gate, streak: model.streak, totalCorrect: model.totalCorrect,
      faults: model.faults, preview: model.preview, ownerCounts: ownerCounts(model.parts), receiptCounts: frame.receiptPrefixLengths}, label + '.compact actual fields');
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
  return {frames: raw.frames.length, intervals: raw.intervalTrace.length, fullSnapshots: raw.frames.length + 2, retained: raw.retained.length, compactSamples: raw.compactTrace.length,
    eventWindows: raw.eventTransitions.length, operations: raw.operations.length, inputChanges: raw.inputChanges.length};
}

function checkInventory(model, label) {
  const parts = new Map(model.parts.map(part => [part.id, part])), counts = ownerCounts(model.parts);
  equal(parts.size, model.parts.length, label + '.unique part IDs');
  equal(Object.values(counts).reduce((sum, value) => sum + value, 0), model.parts.length, label + '.complete owner partition');
  const links = [...model.sourceCarriers.filter(carrier => carrier.partId !== null).map(carrier => [carrier.partId, 'source', carrier.id, carrier.generation]),
    ...model.targetSlots.filter(slot => slot.occupantPartId !== null).map(slot => [slot.occupantPartId, 'slot', slot.id, slot.generation]),
    ...(model.gripper.heldPartId === null ? [] : [[model.gripper.heldPartId, 'held', 'gripper', null]])];
  equal(new Set(links.map(link => link[0])).size, links.length, label + '.one owner location per active part');
  equal(links.length, counts.source + counts.held + counts.slot, label + '.all active parts linked');
  for (const [id, owner, ownerId, ownerGeneration] of links) {
    const part = parts.get(id); equal(part !== undefined, true, label + '.linked part exists');
    if (part) equal({owner: part.owner, ownerId: part.ownerId, ownerGeneration: part.ownerGeneration}, {owner, ownerId, ownerGeneration}, label + '.exact owner link');
  }
  equal(counts.held <= 1, true, label + '.one gripper part');
  equal(model.totalCorrect, counts.slot + counts.completed, label + '.seating credited once'); equal(model.faults, counts.damaged, label + '.damage counted once');
  return counts;
}

function observedCoverage(raw) {
  const model = raw.final.model, actions = raw.actualReceipts.actionReceipts, wraps = raw.actualReceipts.wrapReceipts;
  const coverage = {actionResults: {}, wrapBelts: {}, openingBoundaryDispatches: 0, closingBoundaryDispatches: 0, actionGateDiffersFromNextTick: 0,
    pickupAtReachLimit: 0, dispatchAtReachLimit: 0, footprintAtWindowEdge: 0, rotateAndSeatSameTick: 0, emptyRotateThenGrab: 0,
    grabBeforeSourceWrap: 0, seatBeforeTargetWrap: 0, heldAcrossOriginalSourceWrap: 0, negativeWrapFromZero: 0, sourceRetirements: 0, targetCompletions: 0,
    streakResetAfterSuccess: 0, heldPartIntervals: 0, cancelledIntervals: 0, epochChangedIntervals: 0, neutralAcknowledgements: 0, heldASuppressed: 0,
    movedIntervals: 0, gateTransitions: 0, terminalIncludesFinalInterval: Number(model.lastStep?.toTick === model.tick), finalBoundaryWin: Number(model.phase === 'won' && model.tick === model.deadlineTick)};
  for (const receipt of actions) {
    coverage.actionResults[receipt.result] = (coverage.actionResults[receipt.result] ?? 0) + 1;
    coverage.streakResetAfterSuccess += Number(receipt.streakBefore > 0 && receipt.streakAfter === 0 && receipt.faultsAfter > receipt.faultsBefore);
    const dispatch = receipt.action === 'grab_or_dispatch' && receipt.partBefore?.owner === 'held';
    if (dispatch) {
      coverage.openingBoundaryDispatches += Number(receipt.gateAtAction.phaseTick === model.scenario.gate.openFromPhaseTick);
      coverage.closingBoundaryDispatches += Number(receipt.gateAtAction.phaseTick === model.scenario.gate.openUntilPhaseTick);
      coverage.actionGateDiffersFromNextTick += Number(receipt.gateAtAction.open !== raw.frames[receipt.boundaryTick + 1].state.model.gate.open);
      coverage.dispatchAtReachLimit += Number(receipt.slotAtAction !== null && Math.abs(receipt.slotAtAction.x - receipt.gripperX) === parameters.geometry.placementRadiusUnits);
      coverage.footprintAtWindowEdge += Number(receipt.gripperX - parameters.geometry.partHalfSizeUnits === model.scenario.windowXRange[0] || receipt.gripperX + parameters.geometry.partHalfSizeUnits === model.scenario.windowXRange[1]);
    }
    coverage.pickupAtReachLimit += Number(receipt.sourceAtAction !== null && Math.abs(receipt.sourceAtAction.x - receipt.gripperX) === parameters.geometry.pickupRadiusUnits);
    const previous = actions[receipt.id - 2];
    if (previous?.boundaryTick === receipt.boundaryTick) {
      coverage.rotateAndSeatSameTick += Number(previous.result === 'rotated' && receipt.result === 'seated');
      coverage.emptyRotateThenGrab += Number(previous.result === 'empty_rotate' && receipt.result === 'grabbed');
    }
    coverage.grabBeforeSourceWrap += Number(receipt.result === 'grabbed' && wraps.some(wrap => wrap.belt === 'source' && wrap.carrierId === receipt.sourceAtAction.id && wrap.endedTick === receipt.boundaryTick + 1));
    coverage.seatBeforeTargetWrap += Number(receipt.result === 'seated' && wraps.some(wrap => wrap.belt === 'target' && wrap.carrierId === receipt.slotAtAction.id && wrap.exitedPartId === receipt.partId && wrap.endedTick === receipt.boundaryTick + 1));
  }
  for (const wrap of wraps) {
    coverage.wrapBelts[wrap.belt] = (coverage.wrapBelts[wrap.belt] ?? 0) + 1;
    coverage.negativeWrapFromZero += Number(wrap.fromX === 0 && wrap.rawToX < 0);
    coverage.sourceRetirements += Number(wrap.belt === 'source' && wrap.exitedPartId !== null); coverage.targetCompletions += Number(wrap.belt === 'target' && wrap.exitedPartId !== null);
    const before = raw.frames[wrap.endedTick - 1].state.model, after = raw.frames[wrap.endedTick].state.model;
    const held = before.parts.find(part => part.id === before.gripper.heldPartId);
    coverage.heldAcrossOriginalSourceWrap += Number(wrap.belt === 'source' && held?.sourceCarrierId === wrap.carrierId && held.owner === 'held' && after.gripper.heldPartId === held.id);
  }
  for (let tick = 1; tick < raw.frames.length; tick++) {
    const before = raw.frames[tick - 1].state.model, after = raw.frames[tick].state.model, input = after.lastInput;
    coverage.heldPartIntervals += Number(before.gripper.heldPartId !== null && before.gripper.heldPartId === after.gripper.heldPartId);
    coverage.cancelledIntervals += Number(input.cancelled); coverage.epochChangedIntervals += Number(input.epochChanged); coverage.neutralAcknowledgements += Number(input.neutralAcknowledged);
    coverage.heldASuppressed += Number(input.effectiveA && !input.freshA && !input.quarantinedBefore && !input.epochChanged && !input.cancelled);
    coverage.movedIntervals += Number(before.gripper.x !== after.gripper.x); coverage.gateTransitions += Number(before.gate.open !== after.gate.open);
  }
  return coverage;
}

function auditRound(raw, label, entry) {
  const startAssertions = assertionCount, startFailures = failureCount, counts = checkBindings(raw, label);
  const difficulty = raw.initial.model.difficulty, seed = raw.initial.model.seed;
  equal([0, 1, 2].includes(difficulty), true, label + '.difficulty domain'); equal(Number.isSafeInteger(seed) && seed >= 0, true, label + '.seed domain');
  const scenario = parameters.scenarios[difficulty], inputs = inputCalendar(raw.intervalTrace.map(interval => interval.input)), ledger = buildLedger(scenario, inputs);
  equal(ledger.terminal.endedTick, raw.final.model.tick, label + '.first independently derived terminal');
  compare(raw.actualReceipts.actionReceipts, ledger.actionReceipts, label + '.all independent action receipts');
  compare(raw.actualReceipts.wrapReceipts, ledger.wrapReceipts, label + '.all independent wrap receipts');
  compareModel(raw.initial.model, ledger.stateAt(0, difficulty, seed), label + '.initial');
  let finalOwners;
  for (let tick = 0; tick < raw.frames.length; tick++) {
    const actual = raw.frames[tick].state.model, expected = ledger.stateAt(tick, difficulty, seed);
    compareModel(actual, expected, label + '.frame' + tick, true);
    finalOwners = checkInventory(actual, label + '.frame' + tick);
    equal(actual.parts.length, scenario.sourceCarriers.length + ledger.wrapReceipts.filter(receipt => receipt.belt === 'source' && receipt.endedTick <= tick).length, label + '.source generation inventory');
    if (tick < ledger.terminal.endedTick) equal(actual.phase, 'playing', label + '.no early terminal');
  }
  const expectedFinal = ledger.stateAt(raw.final.model.tick, difficulty, seed);
  compareModel(raw.final.model, expectedFinal, label + '.final'); equal(raw.final.model.tick, entry.actualFixedTicks, label + '.manifest ticks');
  const coverage = observedCoverage(raw);
  return {label, difficulty, level: difficulty + 1, passed: failureCount === startFailures, assertions: assertionCount - startAssertions,
    counts: {...counts, gripperSegments: ledger.segments.length, ownershipVersions: ledger.ownershipVersions.length, createdParts: ledger.catalog.length, actionReceipts: ledger.actionReceipts.length, wrapReceipts: ledger.wrapReceipts.length}, coverage,
    result: {phase: expectedFinal.phase, terminal: expectedFinal.terminal, tick: expectedFinal.tick, elapsed: expectedFinal.elapsed, score: expectedFinal.score, streak: expectedFinal.streak,
      totalCorrect: expectedFinal.totalCorrect, faults: expectedFinal.faults, heldPartId: expectedFinal.gripper.heldPartId, ownerCounts: finalOwners}};
}

function main() {
  const [indexArgument, outputArgument, approvedIndexSha256] = process.argv.slice(2);
  if (!indexArgument || !outputArgument || !/^[a-f0-9]{64}$/.test(approvedIndexSha256 ?? '')) throw new Error('Usage: node independent-conveyor-review.mjs PUBLIC_INDEX FRESH_OUTPUT ROOT_APPROVED_INDEX_SHA');
  const indexPath = path.resolve(indexArgument), outputPath = path.resolve(outputArgument);
  if (fs.existsSync(outputPath)) throw new Error('Refusing to overwrite an audit output directory');
  const runnerPath = fileURLToPath(import.meta.url), app = path.resolve(path.dirname(runnerPath), '..'), repo = path.resolve(app, '../../..'), scratch = path.resolve(repo, '../scratch');
  const contractPath = path.join(app, 'docs/model-contract.md'), oraclePath = path.join(app, 'tests/conveyor-interval-oracle.mjs');
  const indexBytes = fs.readFileSync(indexPath), index = JSON.parse(indexBytes);
  const sourceFiles = [runnerPath, oraclePath, contractPath, indexPath, ...index.rounds.map(entry => path.join(path.dirname(indexPath), entry.file))];
  const portable = filename => filename.startsWith(repo + path.sep) ? 'repo:' + path.relative(repo, filename) : filename.startsWith(scratch + path.sep) ? 'scratch:' + path.relative(scratch, filename) : (() => {throw new Error('Source outside approved roots');})();
  const hashWindow = () => Object.fromEntries(sourceFiles.map(filename => [portable(filename), sha(fs.readFileSync(filename))]));
  fs.mkdirSync(outputPath, {recursive: false});
  const startedAt = new Date().toISOString(), startHashes = hashWindow(), rounds = [];
  let exception = null;
  try {
    if (!equal([sha(indexBytes), startHashes[portable(indexPath)]], [approvedIndexSha256, approvedIndexSha256], 'approved public index and source window')) throw new Error('Public index changed');
    if (!equal(startHashes[portable(contractPath)], CONTRACT_SHA, 'approved public contract')) throw new Error('Public contract changed');
    equal(index.rounds.map(entry => entry.name), [1, 2, 3].flatMap(level => ['record', 'loss'].map(mode => `level${level}-${mode}`)), 'six original cases');
    equal(index.originalFilesUnchanged, true, 'root projection preserves original bytes');
    parameters = readParameters(fs.readFileSync(contractPath, 'utf8'));
    for (const run of index.sourceRuns) { equal(run.startHashes, run.endHashes, 'original ordinary source window'); equal(run.startHashes.contract, CONTRACT_SHA, 'original ordinary contract'); }
    for (const entry of index.rounds) {
      const filename = path.join(path.dirname(indexPath), entry.file);
      if (!equal(startHashes[portable(filename)], entry.sha256, entry.name + '.projected bytes')) throw new Error('Projected bytes changed');
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
  const report = {schemaVersion: 1, game: 'conveyor-window', passed: !exception && failureCount === 0 && rounds.length === 6,
    method: 'Absolute modular belt positions and closed-form generation/wrap calendar; constant-input clamped gripper segments; ownership and counter versions only at independently derived actual actions and wrap events. Every current part and actual interval is checked. No Model/pilot import, tick physics replay, search or new gameplay.',
    limitations: ['Only the root-approved existing six public ordinary cases. Earlier retained attempts, formal synthetic boundary coverage, browser controls, pause/retry, video and rendering are separate.',
      'Serialized observations prove values and exact historical copies, not runtime object identity or Object.freeze. Only actionReceipts/wrapReceipts use bank prefixes; every mutable parts registry remains a full observation.',
      'All integer position, phase, generation, ownership, counter and terminal gates use zero tolerance. Observed coverage counters do not claim unencountered boundary actions.',
      'Input checks cover recorded ordinary held keys and public latch semantics; unobserved cancellation/pulses/invalid dt calls are not synthesized.',
      'Original source hashes and raw report hashes are bound through the root-reviewed lossless public manifest; no diagnostic-bearing raw case or production implementation is read.'],
    sources: {contract: {repoRelative: path.relative(repo, contractPath), sha256: CONTRACT_SHA}, oracle: {repoRelative: path.relative(repo, oraclePath), sha256: startHashes[portable(oraclePath)]}, runner: {repoRelative: path.relative(repo, runnerPath), sha256: startHashes[portable(runnerPath)]},
      publicIndex: {scratchRelative: path.relative(scratch, indexPath), sha256: sha(indexBytes)}, originalReportSha256: index.originalReportSha256,
      sourceRuns: index.sourceRuns.map(({path: filename, ...rest}) => ({scratchRelative: path.relative(scratch, filename), ...rest}))},
    sourceWindow: {startedAt, completedAt, startHashes, endHashes, unchanged: isDeepStrictEqual(startHashes, endHashes)}, assertions: assertionCount, roundAssertions, globalAssertions: assertionCount - roundAssertions,
    failureCount, failures, exception, comparisonTolerance: {positionUnits: 0, generation: 0, ownership: 0, counters: 0, ticks: 0}, maximumErrors, totals, rounds};
  fs.writeFileSync(path.join(outputPath, 'report.json'), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  process.stdout.write(JSON.stringify({passed: report.passed, assertions: assertionCount, globalAssertions: report.globalAssertions, failureCount, maximumErrors, totals}) + '\n');
  process.exitCode = report.passed ? 0 : 1;
}

main();
