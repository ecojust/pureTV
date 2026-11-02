'use strict';

// Static contract tests for game 36. This file was authored without executing,
// importing, inspecting, or searching the production model.
// Public sources read in full:
// model-contract.md SHA-256 23b6328f9b5aa6506570f5bd5940fe0ea7f381b6f2272d221356555452d1d725
// public-interface.md SHA-256 026fd01bb622e605c6d148ba76c576511a395674ef30b331bbfbd7efadbfe33d

const { test } = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');

const clone = (value) => structuredClone(value);

function freezeTree(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeTree(child);
    Object.freeze(value);
  }
  return value;
}

function assertFrozenTree(value) {
  if (value && typeof value === 'object') {
    assert.equal(Object.isFrozen(value), true);
    for (const child of Object.values(value)) assertFrozenTree(child);
  }
}

function step(state, input = {}) {
  Model.step(state, 1 / 60, { cancelEpoch: 0, ...input });
}

function readyState() {
  const state = Model.create();
  step(state);
  for (let index = 0; index < 60; index += 1) step(state);
  assert.equal(state.activeTick, 0);
  assert.equal(state.inputState.recoveryRemainingTicks, 0);
  return state;
}

function assertCompleteNoOp(state, dt, input) {
  const before = clone(state);
  const references = Object.entries(state);
  Model.step(state, dt, input);
  assert.deepEqual(state, before);
  for (const [key, value] of references) assert.equal(state[key], value, key);
}

function progress(state) {
  const keys = [
    'activeTick', 'activeElapsed', 'score', 'currentSegmentIndex', 'localTick',
    'completedSegments', 'wovenSegments', 'breaks', 'currentStreak',
    'longestStreak', 'tapHitCount', 'tapMissCount', 'chainBonus',
    'segmentStates', 'currentSegment', 'tapReceipts', 'segmentReceipts',
  ];
  return clone(Object.fromEntries(keys.map((key) => [key, state[key]])));
}

function assertNoGameDelta(state) {
  const summary = state.lastStep;
  assert.equal(summary.toActiveTick, summary.fromActiveTick);
  assert.equal(summary.processedSegmentIndex, null);
  assert.equal(summary.processedLocalTick, null);
  assert.equal(summary.holdChecked, false);
  assert.equal(summary.holdPresent, null);
  assert.equal(summary.holdMissingAdded, 0);
  assert.equal(summary.tapReceiptId, null);
  assert.equal(summary.segmentReceiptId, null);
  for (const key of [
    'tapHitsAdded', 'tapMissesAdded', 'completedSegmentsAdded',
    'wovenSegmentsAdded', 'breaksAdded',
  ]) assert.equal(summary[key], 0, key);
}

// SYNTHETIC FIXTURE ONLY. This is not an ordinary player, an input trace,
// a completed ordinary game, or evidence of reaching these positions by play.
// Deep-clone create(), retain the published frozen rules, and place public
// counters and receipts at a chosen boundary. Prior woven segments have three
// synthetic hits; prior frayed segments have three synthetic misses and no
// hold gaps. The current segment can name resolved taps and exact hold gaps.
// Receipt times/counts/score/streak are internally consistent with the public
// integer formulae. No actual input history is claimed: lastInput/lastStep
// remain null until the real step under test creates its own summaries.
function syntheticBefore(at, { prior = [], taps, missing = [] } = {}) {
  const state = clone(Model.create(736, 0));
  freezeTree(state.identity);
  freezeTree(state.physics);
  freezeTree(state.scenario);
  assert.equal(prior.length, Math.floor(at / 360));
  assert.ok(prior.length < state.segmentCount);

  state.tick = at + 61;
  state.elapsed = state.tick / 60;
  state.activeTick = at;
  state.activeElapsed = at / 60;
  state.clockMode = 'running';
  state.inputState = {
    cancelEpoch: 0, quarantined: false, recoveryRemainingTicks: 0,
    aArmed: true, bArmed: true, edgeOrdinals: { left: 0, right: 0 },
  };
  state.effectiveHeld = { left: false, right: false };
  state.events = [];
  state.lastInput = null;
  state.lastStep = null;
  state.lastTap = null;
  state.lastSegment = null;

  function populateSegment(index, results, gaps, checked) {
    const config = state.scenario.segments[index];
    const segment = state.segmentStates[index];
    segment.status = 'active';
    segment.holdCheckedTicks = checked;
    segment.holdMissingTicks = gaps.length;
    segment.firstMissingActiveTick = gaps.length ? Math.min(...gaps) : null;
    segment.holdBroken = gaps.length > 0;
    const faults = [...gaps];
    for (let localIndex = 0; localIndex < 3; localIndex += 1) {
      const result = results[localIndex];
      if (result === 'pending') continue;
      assert.ok(result === 'hit' || result === 'missed');
      const pulse = config.pulses[localIndex];
      const resolvedActiveTick = result === 'hit'
        ? pulse.dueActiveTick : pulse.closeActiveTick + 1;
      assert.ok(resolvedActiveTick <= at);
      const edgeOrdinal = result === 'hit' ? pulse.id * 2 : null;
      const receipt = freezeTree({
        id: pulse.id, segmentIndex: index, localIndex, lane: config.tapLane,
        result, resolvedTick: resolvedActiveTick + 61, resolvedActiveTick,
        dueActiveTick: pulse.dueActiveTick, openActiveTick: pulse.openActiveTick,
        closeActiveTick: pulse.closeActiveTick, edgeOrdinal,
        holdLane: config.holdLane,
        holdEffectiveAtResolution: !gaps.includes(resolvedActiveTick),
      });
      if (result === 'hit') assert.equal(receipt.holdEffectiveAtResolution, true);
      state.tapReceipts.push(receipt);
      Object.assign(segment.taps[localIndex], {
        status: result, resolvedActiveTick,
        resolvedTick: receipt.resolvedTick, edgeOrdinal,
      });
      if (result === 'hit') {
        segment.tapHits += 1;
        state.tapHitCount += 1;
        state.score += 10;
        state.inputState.edgeOrdinals[config.tapLane] = edgeOrdinal;
      } else {
        segment.missedTaps += 1;
        state.tapMissCount += 1;
        faults.push(resolvedActiveTick);
      }
    }
    segment.faulted = faults.length > 0;
    segment.firstFaultActiveTick = faults.length ? Math.min(...faults) : null;
    return segment;
  }

  for (let index = 0; index < prior.length; index += 1) {
    const result = prior[index];
    assert.ok(result === 'woven' || result === 'frayed');
    const config = state.scenario.segments[index];
    const segment = populateSegment(
      index, Array(3).fill(result === 'woven' ? 'hit' : 'missed'), [], 270,
    );
    const breaksBefore = state.breaks;
    const streakBefore = state.currentStreak;
    const scoreBefore = state.score;
    const segmentScoreAdded = result === 'woven' ? 100 : 0;
    if (result === 'woven') {
      state.wovenSegments += 1;
      state.currentStreak += 1;
      state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
    } else {
      state.breaks += 1;
      state.currentStreak = 0;
    }
    const chainBonusAdded = result === 'woven' ? 20 * state.currentStreak : 0;
    state.chainBonus += chainBonusAdded;
    state.score += segmentScoreAdded + chainBonusAdded;
    state.completedSegments += 1;
    segment.status = result;
    state.segmentReceipts.push(freezeTree({
      id: index + 1, index, result,
      resolvedTick: config.endActiveTick + 61,
      resolvedActiveTick: config.endActiveTick,
      holdLane: config.holdLane, tapLane: config.tapLane,
      expectedCrossing: config.expectedCrossing,
      actualCrossing: result === 'woven' ? config.expectedCrossing : null,
      holdCheckedTicks: 270, holdMissingTicks: 0, firstMissingActiveTick: null,
      firstFaultActiveTick: segment.firstFaultActiveTick,
      tapIds: config.pulses.map((pulse) => pulse.id),
      tapHits: segment.tapHits, missedTaps: segment.missedTaps,
      breaksBefore, breaksAfter: state.breaks,
      streakBefore, streakAfter: state.currentStreak,
      longestStreakAfter: state.longestStreak,
      scoreBefore, scoreAfter: state.score, segmentScoreAdded, chainBonusAdded,
    }));
  }

  const index = prior.length;
  const config = state.scenario.segments[index];
  const checked = Math.max(0, Math.min(270, at - config.holdStartActiveTick + 1));
  assert.equal(new Set(missing).size, missing.length);
  for (const tick of missing) {
    assert.ok(tick >= config.holdStartActiveTick);
    assert.ok(tick <= Math.min(at, config.holdEndActiveTick));
  }
  const currentResults = taps || config.pulses.map((pulse) =>
    pulse.dueActiveTick <= at ? 'hit' : 'pending');
  assert.equal(currentResults.length, 3);
  for (let localIndex = 0; localIndex < 3; localIndex += 1) {
    if (currentResults[localIndex] === 'pending') {
      assert.ok(at <= config.pulses[localIndex].closeActiveTick);
    }
  }
  const segment = populateSegment(index, currentResults, missing, checked);
  state.currentSegmentIndex = index;
  state.localTick = at - index * 360;
  if (state.localTick === 0) segment.status = 'pending';
  state.currentSegment = Object.freeze({ config, state: segment });
  assert.equal(state.score,
    10 * state.tapHitCount + 100 * state.wovenSegments + state.chainBonus);
  assert.equal(state.tapReceipts.length, state.tapHitCount + state.tapMissCount);
  assert.equal(state.segmentReceipts.length, state.completedSegments);
  return state;
}

test('creation normalizes identity and exposes separate, deeply frozen rules', () => {
  const first = Model.create(18.9, 9.8);
  const second = Model.create(Infinity, '2');
  assert.equal(first.seed, 18);
  assert.equal(first.identity.seed, 18);
  assert.equal(first.difficulty, 2);
  assert.equal(first.level, 3);
  assert.equal(first.identity.gameId, 36);
  assert.equal(first.segmentCount, 10);
  assert.equal(first.requiredStreak, 5);
  assert.equal(second.seed, 736);
  assert.equal(second.difficulty, 0);
  assert.equal(second.scenario.deadlineActiveTick, 2160);
  assert.equal(Model.create(-4.9, -1.9).seed, -4);
  assert.equal(Model.create(1, -1.9).difficulty, 0);
  for (const key of ['identity', 'physics', 'scenario']) {
    assertFrozenTree(first[key]);
    assertFrozenTree(second[key]);
    assert.notEqual(first[key], second[key]);
  }
  assert.notEqual(first.scenario.segments[0], second.scenario.segments[0]);
  assert.deepEqual(second.inputState, {
    cancelEpoch: null, quarantined: true, recoveryRemainingTicks: 0,
    aArmed: false, bArmed: false, edgeOrdinals: { left: 0, right: 0 },
  });
  assert.equal(second.currentSegment.config, second.scenario.segments[0]);
  assert.equal(second.currentSegment.state, second.segmentStates[0]);
});

test('invalid dt preserves every field, reference, receipt and current event', () => {
  const state = syntheticBefore(95);
  step(state, { a: true, b: true });
  assert.equal(state.tapReceipts.length, 1);
  for (const dt of [undefined, null, false, '1', NaN, Infinity, -Infinity, 0, -1]) {
    assertCompleteNoOp(state, dt, { cancelled: true, cancelEpoch: 99, a: true });
  }
});

test('first neutral acknowledges its epoch and each finite positive dt is one call', () => {
  const state = Model.create();
  Model.step(state, 999999, {});
  assert.equal(state.tick, 1);
  assert.equal(state.elapsed, 1 / 60);
  assert.equal(state.activeTick, 0);
  assert.equal(state.lastStep.mode, 'neutral_ack');
  assert.equal(state.lastInput.epochChanged, true);
  assert.equal(state.lastInput.cancelEpoch, 0);
  assert.equal(state.lastInput.fullNeutral, true);
  assert.equal(state.inputState.recoveryRemainingTicks, 60);
  assert.equal(state.clockMode, 'preparing');
  assertNoGameDelta(state);
  Model.step(state, Number.MIN_VALUE, {});
  assert.equal(state.tick, 2);
  assert.equal(state.activeTick, 0);
  assert.equal(state.lastStep.mode, 'preparing');
  assert.equal(state.inputState.recoveryRemainingTicks, 59);
});

test('every raw button, either nonneutral axis and menuDelta block neutral acknowledgement', () => {
  const blockers = [
    ...['a', 'b', 'aPressed', 'bPressed', 'start', 'select', 'startPressed',
      'selectPressed', 'confirm', 'retry', 'cancelled'].map((key) => ({ [key]: true })),
    { x: 0.350001 }, { y: -0.350001 }, { menuDelta: -1 },
  ];
  for (const input of blockers) {
    const state = Model.create();
    step(state, input);
    assert.equal(state.lastInput.fullNeutral, false, JSON.stringify(input));
    assert.equal(state.lastInput.neutralAcknowledged, false);
    assert.equal(state.lastStep.mode, 'quarantine');
    assert.equal(state.inputState.quarantined, true);
    assert.equal(state.inputState.recoveryRemainingTicks, 0);
    assert.deepEqual(state.effectiveHeld, { left: false, right: false });
    assert.deepEqual(state.lastInput.fresh, { left: false, right: false });
    assertNoGameDelta(state);
  }
});

test('explicit invalid axes or menuDelta display zero but cannot acknowledge neutral', () => {
  for (const input of [
    { x: NaN }, { y: Infinity }, { x: '0' }, { y: null }, { x: undefined },
    { menuDelta: NaN }, { menuDelta: '0' }, { menuDelta: undefined },
  ]) {
    const state = Model.create();
    step(state, input);
    const key = Object.keys(input)[0];
    assert.equal(state.lastInput[key], 0);
    assert.equal(state.lastInput.raw[key], null);
    assert.equal(state.lastInput[key === 'menuDelta' ? 'menuDeltaValid' : 'axesValid'], false);
    assert.equal(state.lastInput.fullNeutral, false);
    assert.equal(state.inputState.quarantined, true);
  }
});

test('neutral includes axis thresholds and buttons accept only literal true', () => {
  const state = Model.create();
  step(state, {
    x: 0.35, y: -0.35, menuDelta: 0,
    a: 1, b: 'true', aPressed: 1, bPressed: 'true',
    start: 1, select: 'true', startPressed: 1, selectPressed: 'true',
    confirm: 1, retry: 'true', cancelled: 1,
  });
  assert.equal(state.lastInput.fullNeutral, true);
  assert.equal(state.lastStep.mode, 'neutral_ack');
  assert.equal(state.lastInput.raw.a, false);
  assert.equal(state.lastInput.raw.cancelled, false);
  const clamped = Model.create();
  step(clamped, { x: 9, y: -8 });
  assert.equal(clamped.lastInput.x, 1);
  assert.equal(clamped.lastInput.y, -1);
  assert.equal(clamped.lastInput.raw.x, 9);
  assert.equal(clamped.lastInput.raw.y, -8);
  assert.equal(clamped.lastInput.axesValid, true);
  assert.equal(clamped.inputState.quarantined, true);
});

test('epoch floors valid numbers and invalid values normalize to zero before comparison', () => {
  const state = Model.create();
  step(state, { cancelEpoch: 2.9 });
  assert.equal(state.inputState.cancelEpoch, 2);
  assert.equal(state.lastInput.raw.cancelEpoch, 2.9);
  step(state, { cancelEpoch: 2.1, a: true });
  assert.equal(state.lastInput.epochChanged, false);
  assert.equal(state.inputState.recoveryRemainingTicks, 59);
  step(state, { cancelEpoch: '2', a: true });
  assert.equal(state.inputState.cancelEpoch, 0);
  assert.equal(state.lastInput.raw.cancelEpoch, null);
  assert.equal(state.lastInput.epochChanged, true);
  assert.equal(state.lastStep.mode, 'quarantine');
  assert.equal(state.inputState.recoveryRemainingTicks, 0);
  step(state, { cancelEpoch: Infinity, a: true });
  assert.equal(state.lastInput.epochChanged, false);
  assert.equal(state.inputState.quarantined, true);
  step(state, { cancelEpoch: -7.8 });
  assert.equal(state.inputState.cancelEpoch, 0);
  assert.equal(state.lastInput.raw.cancelEpoch, -7.8);
  assert.equal(state.lastStep.mode, 'neutral_ack');
  assert.equal(state.inputState.recoveryRemainingTicks, 60);
});

test('sustained cancellation and changing epochs preserve progress without starting preparation', () => {
  const state = syntheticBefore(150, { missing: [61] });
  const before = progress(state);
  for (const cancelEpoch of [1, 1, 2]) {
    step(state, { cancelled: true, cancelEpoch });
    assert.equal(state.lastStep.mode, 'quarantine');
    assert.equal(state.inputState.recoveryRemainingTicks, 0);
    assert.equal(state.inputState.aArmed, false);
    assert.equal(state.inputState.bArmed, false);
    assert.deepEqual(progress(state), before);
    assertNoGameDelta(state);
  }
  step(state, { cancelEpoch: 2 });
  assert.equal(state.lastStep.mode, 'neutral_ack');
  assert.equal(state.inputState.recoveryRemainingTicks, 60);
  assert.deepEqual(progress(state), before);
});

test('all 60 preparation calls freeze rhythm, including the zero step, and consume fresh edges', () => {
  const state = Model.create();
  step(state);
  for (let index = 0; index < 60; index += 1) {
    step(state, { a: true, bPressed: true });
    assert.equal(state.lastStep.mode, 'preparing');
    assert.equal(state.activeTick, 0);
    assert.equal(state.inputState.recoveryRemainingTicks, 59 - index);
    assert.equal(state.lastInput.fresh.left, index === 0);
    assert.equal(state.lastInput.fresh.right, index === 0);
    assertNoGameDelta(state);
  }
  assert.equal(state.tick, 61);
  assert.equal(state.clockMode, 'running');
  assert.deepEqual(state.inputState.edgeOrdinals, { left: 1, right: 1 });
  assert.equal(state.tapReceipts.length, 0);
  step(state, { a: true, bPressed: true });
  assert.equal(state.lastStep.mode, 'running');
  assert.equal(state.activeTick, 1);
  assert.equal(state.activeElapsed, 1 / 60);
  assert.deepEqual(state.lastInput.fresh, { left: false, right: false });
  assert.deepEqual(state.effectiveHeld, { left: true, right: false });
});

test('cancellation can interrupt preparation, preserves faults and never restores a held line automatically', () => {
  const state = syntheticBefore(124, { missing: [61] });
  const before = progress(state);
  const receipt = state.tapReceipts[0];
  step(state, { cancelled: true, cancelEpoch: 1, a: true });
  step(state, { cancelEpoch: 1 });
  for (let index = 0; index < 59; index += 1) step(state, { cancelEpoch: 1, a: true });
  assert.equal(state.inputState.recoveryRemainingTicks, 1);
  step(state, { cancelEpoch: 2, a: true });
  assert.equal(state.lastStep.mode, 'quarantine');
  assert.equal(state.inputState.recoveryRemainingTicks, 0);
  assert.deepEqual(progress(state), before);
  step(state, { cancelEpoch: 2 });
  for (let index = 0; index < 60; index += 1) step(state, { cancelEpoch: 2 });
  assert.equal(state.activeTick, 124);
  assert.deepEqual(progress(state), before);
  assert.equal(state.tapReceipts[0], receipt);
  assert.deepEqual(state.effectiveHeld, { left: false, right: false });
  step(state, { cancelEpoch: 2 });
  assert.equal(state.activeTick, 125);
  assert.equal(state.segmentStates[0].holdMissingTicks, 2);
  assert.equal(state.segmentStates[0].firstMissingActiveTick, 61);
  assert.equal(state.score, 10);
});

test('A and B rearm independently, while held or repeated pressed hints prevent duplicate edges', () => {
  const state = readyState();
  step(state, { a: true, b: true });
  assert.deepEqual(state.lastInput.fresh, { left: true, right: true });
  step(state, { a: true, bPressed: true });
  assert.deepEqual(state.lastInput.fresh, { left: false, right: false });
  assert.deepEqual(state.effectiveHeld, { left: true, right: false });
  step(state, { a: true });
  assert.equal(state.inputState.bArmed, true);
  assert.equal(state.inputState.aArmed, false);
  step(state, { a: true, bPressed: true });
  assert.deepEqual(state.lastInput.fresh, { left: false, right: true });
  assert.deepEqual(state.inputState.edgeOrdinals, { left: 1, right: 2 });
  step(state, { aPressed: true, b: true });
  assert.equal(state.lastInput.fresh.left, false);
  assert.equal(state.inputState.aArmed, false);
  step(state, { b: true });
  assert.equal(state.inputState.aArmed, true);
  step(state, { aPressed: true, b: true });
  assert.deepEqual(state.lastInput.fresh, { left: true, right: false });
  assert.deepEqual(state.inputState.edgeOrdinals, { left: 2, right: 2 });
});

test('two simultaneous fresh held keys can hit exactly one tap without duplicating held-plus-pressed edges', () => {
  const state = syntheticBefore(95);
  const input = { a: true, b: true, aPressed: true, bPressed: true };
  step(state, input);
  assert.deepEqual(state.lastInput.fresh, { left: true, right: true });
  assert.deepEqual(state.inputState.edgeOrdinals, { left: 1, right: 1 });
  assert.equal(state.lastStep.holdPresent, true);
  assert.equal(state.tapReceipts.length, 1);
  assert.equal(state.tapReceipts[0].edgeOrdinal, 1);
  assert.equal(state.tapReceipts[0].lane, 'right');
  assert.equal(state.score, 10);
  assert.deepEqual(state.events, [{ type: 'hit', tick: state.tick, activeTick: 96 }]);
  step(state, input);
  assert.deepEqual(state.lastInput.fresh, { left: false, right: false });
  assert.equal(state.tapReceipts.length, 1);
  assert.equal(state.lastTap, null);
  assert.equal(state.lastStep.tapReceiptId, null);
  assert.deepEqual(state.events, []);
});

test('pressed-only keys produce edges but cannot satisfy the held strand', () => {
  const state = syntheticBefore(95);
  step(state, { aPressed: true, bPressed: true });
  assert.deepEqual(state.lastInput.fresh, { left: true, right: true });
  assert.deepEqual(state.effectiveHeld, { left: false, right: false });
  assert.equal(state.lastStep.holdMissingAdded, 1);
  assert.equal(state.segmentStates[0].firstMissingActiveTick, 96);
  assert.equal(state.segmentStates[0].taps[0].status, 'pending');
  assert.equal(state.score, 0);
  step(state, { a: true, b: true });
  assert.deepEqual(state.lastInput.fresh, { left: false, right: false });
  assert.equal(state.lastStep.holdPresent, true);
  assert.equal(state.tapReceipts.length, 0);
});

test('an early fresh tap has no cache; after a real release a pressed-only tap can hit', () => {
  const state = syntheticBefore(94);
  step(state, { a: true, b: true });
  assert.equal(state.activeTick, 95);
  assert.equal(state.tapReceipts.length, 0);
  step(state, { a: true, b: true });
  assert.equal(state.activeTick, 96);
  assert.equal(state.tapReceipts.length, 0);
  assert.equal(state.score, 0);
  step(state, { a: true });
  step(state, { a: true, bPressed: true });
  assert.equal(state.tapReceipts.length, 1);
  assert.equal(state.tapReceipts[0].resolvedActiveTick, 98);
  assert.equal(state.tapReceipts[0].edgeOrdinal, 2);
  assert.equal(state.effectiveHeld.right, false);
  assert.equal(state.tapReceipts[0].holdEffectiveAtResolution, true);
});

test('the opening window endpoint is inclusive', () => {
  const state = syntheticBefore(95);
  step(state, { a: true, bPressed: true });
  const receipt = state.tapReceipts[0];
  assert.equal(receipt.result, 'hit');
  assert.equal(receipt.openActiveTick, 96);
  assert.equal(receipt.resolvedActiveTick, receipt.openActiveTick);
  assert.equal(state.lastStep.tapHitsAdded, 1);
  assert.equal(state.lastStep.tapMissesAdded, 0);
  assert.equal(state.segmentStates[0].taps[0].resolvedTick, state.tick);
});

test('the closing window endpoint is inclusive and later calls cannot rewrite its receipt', () => {
  const state = syntheticBefore(143, { taps: ['pending', 'pending', 'pending'] });
  const input = { a: true, bPressed: true };
  Model.step(state, 1 / 60, input);
  const receipt = state.tapReceipts[0];
  const saved = clone(receipt);
  const summary = state.lastInput;
  assert.equal(receipt.result, 'hit');
  assert.equal(receipt.closeActiveTick, 144);
  assert.equal(receipt.resolvedActiveTick, 144);
  assertFrozenTree(receipt);
  assertFrozenTree(summary);
  assertFrozenTree(state.lastStep);
  input.a = false;
  assert.equal(summary.raw.a, true);
  step(state, { a: true, b: true });
  assert.equal(state.tapReceipts.length, 1);
  assert.equal(state.tapReceipts[0], receipt);
  assert.deepEqual(receipt, saved);
  assert.equal(state.tapMissCount, 0);
  assert.equal(state.lastTap, null);
  assert.deepEqual(state.events, []);
});

test('close plus one misses exactly once even with fresh input and never buffers that edge', () => {
  const state = syntheticBefore(144, { taps: ['pending', 'pending', 'pending'] });
  step(state, { a: true, bPressed: true });
  const receipt = state.tapReceipts[0];
  assert.equal(state.lastInput.fresh.right, true);
  assert.equal(receipt.result, 'missed');
  assert.equal(receipt.resolvedActiveTick, 145);
  assert.equal(receipt.edgeOrdinal, null);
  assert.equal(receipt.holdEffectiveAtResolution, true);
  assert.equal(state.segmentStates[0].firstFaultActiveTick, 145);
  assert.equal(state.tapMissCount, 1);
  assert.equal(state.breaks, 0);
  assert.equal(state.score, 0);
  assert.deepEqual(state.events, []);
  step(state, { a: true });
  step(state, { a: true, bPressed: true });
  assert.equal(state.tapReceipts.length, 1);
  assert.equal(state.tapReceipts[0], receipt);
  assert.equal(state.tapMissCount, 1);
  assert.equal(state.lastStep.tapMissesAdded, 0);
  assert.equal(state.lastTap, null);
});

test('fresh on the hold lane alone never substitutes for the tap lane', () => {
  const state = syntheticBefore(95);
  step(state, { a: true, aPressed: true });
  assert.equal(state.lastInput.fresh.left, true);
  assert.equal(state.lastInput.fresh.right, false);
  assert.equal(state.lastStep.holdPresent, true);
  assert.equal(state.segmentStates[0].taps[0].status, 'pending');
  assert.equal(state.tapReceipts.length, 0);
  assert.equal(state.score, 0);
});

test('hold tick 61 is included and tick 60 is excluded', () => {
  const state = syntheticBefore(59);
  step(state);
  assert.equal(state.activeTick, 60);
  assert.equal(state.lastStep.holdChecked, false);
  assert.equal(state.lastStep.holdPresent, null);
  assert.equal(state.segmentStates[0].holdCheckedTicks, 0);
  step(state);
  assert.equal(state.activeTick, 61);
  assert.equal(state.lastStep.holdChecked, true);
  assert.equal(state.lastStep.holdPresent, false);
  assert.equal(state.lastStep.holdMissingAdded, 1);
  assert.equal(state.segmentStates[0].holdCheckedTicks, 1);
  assert.equal(state.segmentStates[0].firstMissingActiveTick, 61);
  assert.equal(state.segmentStates[0].firstFaultActiveTick, 61);
  assert.equal(state.breaks, 0);
});

test('hold tick 330 is included and tick 331 is excluded, for exactly 270 checks', () => {
  const state = syntheticBefore(329);
  assert.equal(state.segmentStates[0].holdCheckedTicks, 269);
  step(state);
  assert.equal(state.activeTick, 330);
  assert.equal(state.lastStep.holdChecked, true);
  assert.equal(state.segmentStates[0].holdCheckedTicks, 270);
  assert.equal(state.segmentStates[0].holdMissingTicks, 1);
  assert.equal(state.segmentStates[0].firstMissingActiveTick, 330);
  step(state);
  assert.equal(state.activeTick, 331);
  assert.equal(state.lastStep.holdChecked, false);
  assert.equal(state.lastStep.holdPresent, null);
  assert.equal(state.lastStep.holdMissingAdded, 0);
  assert.equal(state.segmentStates[0].holdCheckedTicks, 270);
  assert.equal(state.segmentStates[0].holdMissingTicks, 1);
});

test('a prior hold fault permits a truthful later tap hit but cannot be repaired', () => {
  const state = syntheticBefore(95, { missing: [61] });
  step(state, { a: true, bPressed: true });
  const segment = state.segmentStates[0];
  assert.equal(state.tapReceipts[0].result, 'hit');
  assert.equal(state.score, 10);
  assert.equal(segment.holdMissingTicks, 1);
  assert.equal(segment.holdBroken, true);
  assert.equal(segment.faulted, true);
  assert.equal(segment.firstFaultActiveTick, 61);
  assert.equal(state.breaks, 0);
});

test('multiple hold gaps and misses cost one break only at settlement and keep earned tap score', () => {
  const state = syntheticBefore(359, {
    taps: ['hit', 'missed', 'missed'], missing: [61, 62, 330],
  });
  assert.equal(state.breaks, 0);
  step(state);
  const receipt = state.segmentReceipts[0];
  assert.equal(receipt.result, 'frayed');
  assert.equal(receipt.holdCheckedTicks, 270);
  assert.equal(receipt.holdMissingTicks, 3);
  assert.equal(receipt.firstFaultActiveTick, 61);
  assert.equal(receipt.tapHits, 1);
  assert.equal(receipt.missedTaps, 2);
  assert.equal(receipt.breaksBefore, 0);
  assert.equal(receipt.breaksAfter, 1);
  assert.equal(receipt.actualCrossing, null);
  assert.equal(receipt.segmentScoreAdded, 0);
  assert.equal(receipt.chainBonusAdded, 0);
  assert.equal(receipt.scoreBefore, 10);
  assert.equal(receipt.scoreAfter, 10);
  assert.equal(state.score, 10);
  assert.equal(state.lastStep.breaksAdded, 1);
  assert.deepEqual(state.events, [{ type: 'frayed', tick: state.tick, activeTick: 360 }]);
  assert.equal(state.currentSegmentIndex, 1);
  assert.equal(state.localTick, 0);
  assert.equal(state.currentSegment.state.status, 'pending');
  const saved = clone(receipt);
  assertFrozenTree(receipt);
  assert.notEqual(receipt.tapIds, state.scenario.segments[0].pulses);
  step(state);
  assert.equal(state.breaks, 1);
  assert.equal(state.segmentReceipts.length, 1);
  assert.deepEqual(receipt, saved);
  assert.equal(state.lastSegment, null);
  assert.equal(state.currentSegment.state.status, 'active');
  assert.equal(state.localTick, 1);
});

test('woven settlement adds its segment and chain scores and exposes the next pending segment', () => {
  const state = syntheticBefore(359);
  step(state);
  const receipt = state.segmentReceipts[0];
  assert.equal(receipt.result, 'woven');
  assert.equal(receipt.actualCrossing, 'left-over-right');
  assert.equal(receipt.holdCheckedTicks, 270);
  assert.equal(receipt.holdMissingTicks, 0);
  assert.deepEqual(receipt.tapIds, [1, 2, 3]);
  assert.equal(receipt.scoreBefore, 30);
  assert.equal(receipt.segmentScoreAdded, 100);
  assert.equal(receipt.chainBonusAdded, 20);
  assert.equal(receipt.scoreAfter, 150);
  assert.equal(state.score, 150);
  assert.equal(state.chainBonus, 20);
  assert.equal(state.currentStreak, 1);
  assert.equal(state.longestStreak, 1);
  assert.equal(state.lastSegment, receipt);
  assert.equal(state.lastTap, null);
  assert.equal(state.lastStep.segmentReceiptId, 1);
  assert.equal(state.currentSegment.config, state.scenario.segments[1]);
  assert.equal(state.currentSegment.state, state.segmentStates[1]);
  assert.equal(state.currentSegment.state.status, 'pending');
  assert.equal(state.localTick, 0);
  assertFrozenTree(receipt);
  assert.equal(Object.isFrozen(receipt.tapIds), true);
  assert.deepEqual(state.events, [{ type: 'woven', tick: state.tick, activeTick: 360 }]);
});

test('reaching required continuity before the deadline never ends the game early', () => {
  const state = syntheticBefore(1079, { prior: ['woven', 'woven'] });
  step(state);
  assert.equal(state.completedSegments, 3);
  assert.equal(state.longestStreak, state.requiredStreak);
  assert.equal(state.score, 510);
  assert.equal(state.phase, 'playing');
  assert.equal(state.terminal, null);
  assert.equal(state.lostReason, null);
  assert.equal(state.currentSegmentIndex, 3);
});

test('completion with sufficient continuity wins and every subsequent call is a complete no-op', () => {
  const state = syntheticBefore(2159, {
    prior: ['woven', 'woven', 'woven', 'frayed', 'woven'],
  });
  step(state);
  assert.equal(state.phase, 'won');
  assert.equal(state.lostReason, null);
  assert.equal(state.completedSegments, 6);
  assert.equal(state.wovenSegments, 5);
  assert.equal(state.breaks, 1);
  assert.equal(state.longestStreak, 3);
  assert.equal(state.score, 830);
  assert.equal(state.currentSegment, null);
  assert.equal(state.currentSegmentIndex, 6);
  assert.equal(state.localTick, 0);
  assert.deepEqual(state.terminal, {
    reason: 'braid_complete', endedTick: state.tick, endedActiveTick: 2160,
    completedSegments: 6, breaks: 1, longestStreak: 3,
  });
  assert.equal(state.lastStep.toActiveTick, 2160);
  assert.equal(state.lastSegment.resolvedActiveTick, 2160);
  assert.deepEqual(state.events, [
    { type: 'woven', tick: state.tick, activeTick: 2160 },
    { type: 'win', tick: state.tick, activeTick: 2160 },
  ]);
  assertCompleteNoOp(state, 1 / 60, { cancelled: true, cancelEpoch: 99, a: true });
  assertCompleteNoOp(state, NaN, {});
});

test('completion with at most two breaks but insufficient continuity loses only at the deadline', () => {
  const state = syntheticBefore(2159, {
    prior: ['woven', 'woven', 'frayed', 'woven', 'woven'],
    taps: ['missed', 'missed', 'missed'],
  });
  assert.equal(state.phase, 'playing');
  assert.equal(state.breaks, 1);
  step(state);
  assert.equal(state.phase, 'lost');
  assert.equal(state.lostReason, 'continuity_not_met');
  assert.equal(state.terminal.reason, 'continuity_not_met');
  assert.equal(state.terminal.endedActiveTick, 2160);
  assert.equal(state.completedSegments, 6);
  assert.equal(state.breaks, 2);
  assert.equal(state.longestStreak, 2);
  assert.equal(state.score, 640);
  assert.equal(state.currentSegment, null);
  assert.equal(state.currentSegmentIndex, 6);
  assert.equal(state.localTick, 0);
  assert.deepEqual(state.events, [
    { type: 'frayed', tick: state.tick, activeTick: 2160 },
    { type: 'lose', tick: state.tick, activeTick: 2160 },
  ]);
  assertCompleteNoOp(state, 1000, { retry: true, confirm: true, cancelEpoch: 8 });
});

test('the third broken segment loses immediately and preserves a future pending segment', () => {
  const state = syntheticBefore(1079, {
    prior: ['frayed', 'frayed'], taps: ['missed', 'missed', 'missed'],
  });
  assert.equal(state.phase, 'playing');
  assert.equal(state.breaks, 2);
  step(state);
  assert.equal(state.phase, 'lost');
  assert.equal(state.lostReason, 'broken_threads');
  assert.deepEqual(state.terminal, {
    reason: 'broken_threads', endedTick: state.tick, endedActiveTick: 1080,
    completedSegments: 3, breaks: 3, longestStreak: 0,
  });
  assert.equal(state.currentSegmentIndex, 3);
  assert.equal(state.currentSegment.state.status, 'pending');
  assert.equal(state.currentSegment.config, state.scenario.segments[3]);
  assert.equal(state.localTick, 0);
  assert.equal(state.lastStep.breaksAdded, 1);
  assertCompleteNoOp(state, 1 / 60, { a: true, b: true, cancelEpoch: 77 });
});

test('a third break at the final boundary has priority even when continuity qualifies for victory', () => {
  const state = syntheticBefore(2159, {
    prior: ['woven', 'woven', 'woven', 'frayed', 'frayed'],
    taps: ['missed', 'missed', 'missed'],
  });
  assert.equal(state.longestStreak, state.requiredStreak);
  assert.equal(state.phase, 'playing');
  step(state);
  assert.equal(state.completedSegments, state.segmentCount);
  assert.equal(state.breaks, 3);
  assert.equal(state.phase, 'lost');
  assert.equal(state.lostReason, 'broken_threads');
  assert.equal(state.terminal.reason, 'broken_threads');
  assert.equal(state.terminal.endedActiveTick, state.deadlineActiveTick);
  assert.equal(state.currentSegment, null);
  assert.equal(state.currentSegmentIndex, state.segmentCount);
  assert.equal(state.localTick, 0);
  assert.equal(state.score, 510);
});
