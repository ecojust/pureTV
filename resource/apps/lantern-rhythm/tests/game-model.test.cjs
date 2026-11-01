'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const model = require('../src/main/assets/game-model.js');
const DT = 1 / 60;
const clone = value => structuredClone(value);
const arrows = { up: { y: -1 }, right: { x: 1 }, down: { y: 1 }, left: { x: -1 } };
const opposite = { up: 'down', down: 'up', right: 'left', left: 'right' };
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
function tick(state, input = {}) { model.step(state, DT, input); return state; }
function ticks(state, count, input = {}) { for (let i = 0; i < count; i += 1) tick(state, input); return state; }
function untilTick(state, target, input = {}) {
  assert.ok(target >= state.tick, 'test schedule cannot rewind time');
  while (state.tick < target && state.phase === 'playing') tick(state, input);
  assert.equal(state.tick, target);
}
// Expected notes are learned solely from actually visible listening cues.
// Tests never inspect the private expected-phrase arrays.
function listen(state = model.create(), input = {}) {
  let guard = 0;
  while (state.mode === 'feedback' && state.phase === 'playing' && guard++ < 100) tick(state, input);
  assert.equal(state.mode, 'listen');
  const seen = new Map();
  function observe() { if (state.visibleCue) seen.set(state.visibleCue.index, clone(state.visibleCue)); }
  observe();
  while (state.mode === 'listen' && state.phase === 'playing' && guard++ < 1000) { tick(state, input); observe(); }
  assert.equal(seen.size, state.phraseLength); assert.equal(state.mode, 'count-in');
  return [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([, cue]) => cue);
}
function start(state, cue, offsetTicks = 0, extra = {}) {
  const pressTick = Math.round(state.onsets[state.answered] / DT) + offsetTicks;
  untilTick(state, pressTick - 1);
  tick(state, { ...arrows[cue.direction], a: true, ...extra });
  return pressTick;
}
function releaseAfter(state, cue, durationTicks, extra = {}, holdingDirection = cue.direction) {
  ticks(state, durationTicks - 1, { ...arrows[holdingDirection], a: true, ...extra });
  tick(state, { ...arrows[holdingDirection], a: false, ...extra });
}
function answer(state, cue, durationTicks = cue.kind === 'short' ? 18 : 43, offsetTicks = 0) {
  start(state, cue, offsetTicks); releaseAfter(state, cue, durationTicks); return state;
}
function prepareKind(kind) {
  const state = model.create(), cues = listen(state), index = cues.findIndex(cue => cue.kind === kind);
  assert.ok(index >= 0);
  for (let i = 0; i < index; i += 1) answer(state, cues[i]);
  return { state, cue: cues[index], cues, index };
}
function finishPhrase(state, cues) { for (let i = state.answered; i < cues.length; i += 1) answer(state, cues[i]); }
function prepareFinalHold() {
  const state = model.create();
  for (let phrase = 0; phrase < 2; phrase += 1) finishPhrase(state, listen(state));
  const cues = listen(state);
  for (let i = 0; i < cues.length - 1; i += 1) answer(state, cues[i]);
  const cue = cues.at(-1), duration = cue.kind === 'short' ? 18 : 43;
  start(state, cue); ticks(state, duration - 1, { ...arrows[cue.direction], a: true });
  return state;
}

test('UMD exposes the ordinary API and creates independent three-, four- and five-note voyages', () => {
  const context = {}; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/main/assets/game-model.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(model).sort(), ['TICK_HZ', 'create', 'step']); assert.deepEqual(Object.keys(context.PureModel).sort(), Object.keys(model).sort());
  assert.equal(model.TICK_HZ, 60);
  assert.deepEqual([0, 1, 2].map(level => model.create(7, level).phraseLength), [3, 4, 5]);
  assert.ok([0, 1, 2].every(level => model.create(7, level).phraseCount === 3));
  assert.equal(model.create().level, 1); assert.equal(model.create(1, -5).level, 1); assert.equal(model.create(1, 100).level, 3);
});

test('a current listening cue has a real lead-in, finite flash and a separate finite identifying display', () => {
  const state = model.create(), firstTick = Math.round(state.listenStartedAt / DT);
  assert.equal(state.visibleCue, null); untilTick(state, firstTick - 1); assert.equal(state.visibleCue, null);
  tick(state); const cue = clone(state.visibleCue); assert.equal(cue.index, 0); assert.equal(cue.active, true);
  assert.equal(cue.startedAt, state.listenStartedAt); assert.equal(cue.kind, 'short');
  untilTick(state, firstTick + Math.round(cue.duration / DT)); assert.equal(state.visibleCue.active, false); assert.equal(state.visibleCue.index, 0);
  untilTick(state, firstTick + Math.round(state.cueDisplayDuration / DT) - 1); assert.ok(state.visibleCue);
  tick(state); assert.equal(state.visibleCue, null);
  untilTick(state, firstTick + Math.round(state.beatPeriod / DT)); assert.equal(state.visibleCue.index, 1);
});

test('only observed current cues identify notes; response/count-in fields expose timing without future answers', () => {
  const state = model.create(), cues = listen(state);
  assert.equal(cues.length, 3); assert.equal(state.visibleCue, null);
  assert.ok(state.onsets.every(onset => typeof onset === 'number'));
  near(state.onsets[1] - state.onsets[0], state.beatPeriod);
  const publicState = Object.fromEntries(Object.entries(state).filter(([key]) => !key.startsWith('_')));
  assert.equal('phrases' in publicState, false); assert.equal('pattern' in publicState, false); assert.equal('expected' in publicState, false);
  start(state, cues[0]); assert.equal(state.visibleCue, null);
  assert.deepEqual(Object.keys(state.activeHold).sort(), ['direction', 'duration', 'index', 'startedAt']);
  assert.equal(state.activeHold.direction, cues[0].direction); assert.equal('kind' in state.activeHold, false);
});

test('joystick selection sanitizes input, applies the dead zone and resolves diagonal ties horizontally', () => {
  const cases = [[{}, null], [{ x: 0.2499, y: -0.2499 }, null], [{ x: 0.25 }, 'right'], [{ x: -1, y: -1 }, 'left'],
    [{ x: 0.3, y: -0.7 }, 'up'], [{ x: 2, y: 100 }, 'right'], [{ x: NaN, y: Infinity }, null], [{ x: '1', y: 0 }, null]];
  for (const [input, direction] of cases) { const state = model.create(); tick(state, input); assert.equal(state.playerDirection, direction); }
});

test('all four directions are latched on press and changing direction during a hold cannot rewrite that note', () => {
  const state = model.create(1, 1), cues = listen(state);
  assert.equal(new Set(cues.map(cue => cue.direction)).size, 4);
  for (let i = 0; i < cues.length; i += 1) {
    const cue = cues[i]; start(state, cue); assert.equal(state.activeHold.direction, cue.direction);
    const duration = cue.kind === 'short' ? 18 : 43;
    releaseAfter(state, cue, duration, {}, opposite[cue.direction]);
    assert.equal(state.acceptedCount, i + 1); assert.equal(state.mistakes, 0);
    const accepted = state.events.find(event => event.type === 'accepted'); assert.equal(accepted.direction, cue.direction);
  }
  assert.equal(state.litCount, 1); assert.equal(state.beacons[0].lit, true);
});

test('every short duration from nine through twenty-seven fixed ticks is accepted inclusively', () => {
  for (let duration = 9; duration <= 27; duration += 1) {
    const { state, cue } = prepareKind('short'); answer(state, cue, duration);
    assert.equal(state.answered, 1, 'short duration ' + duration); assert.equal(state.mistakes, 0); near(state.feedback.holdDuration, duration * DT);
  }
});

test('every long duration from thirty-four through fifty-two fixed ticks is accepted inclusively', () => {
  for (let duration = 34; duration <= 52; duration += 1) {
    const { state, cue, index } = prepareKind('long'); answer(state, cue, duration);
    assert.equal(state.answered, index + 1, 'long duration ' + duration); assert.equal(state.mistakes, 0); near(state.feedback.holdDuration, duration * DT);
  }
});

test('duration boundaries and the gap between short and long cannot earn a note', () => {
  for (const [kind, duration] of [['short', 8], ['short', 28], ['long', 33], ['long', 53], ...[28, 29, 30, 31, 32, 33].map(n => ['long', n])]) {
    const { state, cue } = prepareKind(kind), accepted = state.acceptedCount; answer(state, cue, duration);
    assert.equal(state.mistakes, 1, kind + ' ' + duration); assert.equal(state.acceptedCount, accepted); assert.equal(state.answered, 0);
    assert.ok(['too-short', 'wrong-duration', 'overhold'].includes(state.lastError));
  }
});

test('onsets thirteen ticks early or late are accepted, with the actual hold measured from that press', () => {
  for (const offset of [-13, 13]) {
    const { state, cue } = prepareKind('short'); const pressTick = start(state, cue, offset);
    assert.equal(state.mode, 'respond'); near(state.activeHold.startedAt, pressTick * DT);
    releaseAfter(state, cue, 18); assert.equal(state.answered, 1); assert.equal(state.mistakes, 0);
  }
});

test('fourteen-tick early/late presses and no-response expiry produce one correctly classified mistake', () => {
  for (const [offset, reason] of [[-14, 'early'], [14, 'late']]) {
    const { state, cue } = prepareKind('short'); start(state, cue, offset);
    assert.equal(state.mistakes, 1); assert.equal(state.lastError, reason); ticks(state, 30, { a: true }); assert.equal(state.mistakes, 1);
  }
  const state = model.create(); listen(state); const onset = Math.round(state.nextOnset / DT);
  untilTick(state, onset + 13); assert.equal(state.mistakes, 0); tick(state);
  assert.equal(state.mistakes, 1); assert.equal(state.lastError, 'missed'); ticks(state, 30); assert.equal(state.mistakes, 1);
});

test('wrong or absent direction at a valid onset is rejected without beginning an accepted hold', () => {
  for (const missing of [false, true]) {
    const { state, cue } = prepareKind('short'); const pressTick = Math.round(state.nextOnset / DT); untilTick(state, pressTick - 1);
    tick(state, { ...(missing ? {} : arrows[opposite[cue.direction]]), a: true });
    assert.equal(state.lastError, 'direction'); assert.equal(state.activeHold, null); assert.equal(state.acceptedCount, 0); assert.equal(state.mistakes, 1);
  }
});

test('overholding is rejected once immediately after the allowed maximum, even before physical release', () => {
  for (const kind of ['short', 'long']) {
    const { state, cue } = prepareKind(kind), before = state.acceptedCount; start(state, cue);
    ticks(state, kind === 'short' ? 27 : 52, { ...arrows[cue.direction], a: true }); assert.ok(state.activeHold);
    tick(state, { ...arrows[cue.direction], a: true }); assert.equal(state.lastError, 'overhold'); assert.equal(state.activeHold, null);
    ticks(state, 60, { a: true, aPressed: true }); assert.equal(state.mistakes, 1); assert.equal(state.acceptedCount, before); assert.equal(state.requiresNeutral, true);
    tick(state, {}); assert.equal(state.requiresNeutral, false);
  }
});

test('A held from listening cannot auto-start a response, and a pressed pulse without a real hold has zero duration', () => {
  const held = model.create(); const cues = listen(held, { a: true });
  untilTick(held, Math.round(held.nextOnset / DT) + 13, { a: true }); assert.equal(held.activeHold, null); assert.equal(held.acceptedCount, 0);
  tick(held, { a: true }); assert.equal(held.lastError, 'missed'); assert.equal(held.mistakes, 1); assert.ok(cues.length);
  const { state, cue } = prepareKind('short'); untilTick(state, Math.round(state.nextOnset / DT) - 1);
  tick(state, { ...arrows[cue.direction], aPressed: true });
  assert.equal(state.lastError, 'too-short'); assert.equal(state.feedback.holdDuration, 0); assert.equal(state.acceptedCount, 0);
});

test('a sub-tick A edge is buffered until a rule tick and still requires the actual later key-up', () => {
  const { state, cue } = prepareKind('short'); untilTick(state, Math.round(state.nextOnset / DT) - 1);
  const before = state.tick; model.step(state, DT / 2, { ...arrows[cue.direction], a: true, aPressed: true });
  assert.equal(state.tick, before); assert.equal(state.activeHold, null);
  model.step(state, DT / 2, { ...arrows[cue.direction], a: true }); assert.ok(state.activeHold);
  ticks(state, 17, { ...arrows[cue.direction], a: true }); assert.equal(state.acceptedCount, 0);
  tick(state, {}); assert.equal(state.acceptedCount, 1); assert.equal(state.mistakes, 0);
});

test('B has two paid credits, consumes active time without mistakes, and holding B does not repeat', () => {
  const state = model.create(), serial = state.listenSerial;
  tick(state, { b: true }); assert.equal(state.replaysRemaining, 1); assert.equal(state.replayCount, 1); assert.equal(state.listenSerial, serial + 1);
  const onset = state.listenStartedAt; ticks(state, 30, { b: true }); assert.equal(state.replayCount, 1); assert.equal(state.listenStartedAt, onset);
  tick(state, {}); tick(state, { b: true }); assert.equal(state.replaysRemaining, 0); assert.equal(state.replayCount, 2);
  const lastStart = state.listenStartedAt, lastSerial = state.listenSerial, time = state.elapsed;
  tick(state, {}); tick(state, { b: true }); assert.equal(state.replayCount, 2); assert.equal(state.listenStartedAt, lastStart); assert.equal(state.listenSerial, lastSerial);
  assert.ok(state.elapsed > time); assert.equal(state.mistakes, 0); assert.equal(state.phase, 'playing');
});

test('paid replay discards provisional prefix points without farming progress or accepted-count rewards', () => {
  const state = model.create(); let cues = listen(state); answer(state, cues[0]);
  assert.equal(state.score, 100); assert.equal(state.correctNotes, 1); assert.equal(state.acceptedCount, 1);
  const previousTime = state.elapsed; tick(state, { bPressed: true });
  assert.equal(state.score, 0); assert.equal(state.correctNotes, 0); assert.equal(state.answered, 0); assert.equal(state.acceptedCount, 1); assert.equal(state.mistakes, 0);
  assert.ok(state.elapsed > previousTime); cues = listen(state); answer(state, cues[0]);
  assert.equal(state.score, 100); assert.equal(state.acceptedCount, 2); tick(state, { bPressed: true });
  assert.equal(state.score, 0); assert.equal(state.correctNotes, 0); assert.equal(state.replaysRemaining, 0);
});

test('available B suppresses simultaneous A, but an exhausted replay request cannot suppress a valid A', () => {
  const available = model.create(), seen = listen(available); untilTick(available, Math.round(available.nextOnset / DT) - 1);
  tick(available, { ...arrows[seen[0].direction], a: true, b: true });
  assert.equal(available.mode, 'listen'); assert.equal(available.activeHold, null); assert.equal(available.replayCount, 1); assert.equal(available.mistakes, 0);
  const exhausted = model.create(); tick(exhausted, { b: true }); tick(exhausted, {}); tick(exhausted, { b: true }); tick(exhausted, {});
  const cues = listen(exhausted); start(exhausted, cues[0], 0, { b: true }); assert.ok(exhausted.activeHold);
  releaseAfter(exhausted, cues[0], 18); assert.equal(exhausted.answered, 1); assert.equal(exhausted.replayCount, 2); assert.equal(exhausted.mistakes, 0);
});

test('B during feedback changes neither the feedback schedule nor replay resources', () => {
  const state = model.create(); const cues = listen(state); tick(state, { ...arrows[cues[0].direction], a: true });
  assert.equal(state.mode, 'feedback'); const errorTick = state.tick, credits = state.replaysRemaining, serial = state.listenSerial;
  tick(state, { bPressed: true }); assert.equal(state.mode, 'feedback'); assert.equal(state.replaysRemaining, credits); assert.equal(state.listenSerial, serial);
  untilTick(state, errorTick + 47); assert.equal(state.mode, 'feedback'); tick(state); assert.equal(state.mode, 'listen');
});

test('the first cancellation epoch only initializes tracking, while lower or repeated epochs do not cancel a hold', () => {
  const { state, cue } = prepareKind('short'); start(state, cue, 0, { cancelEpoch: 17 });
  assert.ok(state.activeHold); assert.equal(state.cancelCount, 0); assert.equal(state.resumeCount, 0);
  ticks(state, 5, { ...arrows[cue.direction], a: true, cancelEpoch: 16 }); assert.ok(state.activeHold); assert.equal(state.cancelCount, 0);
  ticks(state, 12, { ...arrows[cue.direction], a: true, cancelEpoch: 17 }); tick(state, { cancelEpoch: 17 });
  assert.equal(state.answered, 1); assert.equal(state.cancelCount, 0);
});

test('changed epoch cancels a hold without reward or penalty and preserves lit beacons and accepted prefix', () => {
  const state = model.create(); finishPhrase(state, listen(state, { cancelEpoch: 0 }));
  const cues = listen(state, { cancelEpoch: 0 }); answer(state, cues[0]);
  assert.equal(state.litCount, 1); assert.equal(state.answered, 1); assert.equal(state.score, 1100);
  start(state, cues[1], 0, { cancelEpoch: 0 }); ticks(state, 4, { a: true, cancelEpoch: 0 });
  const accepted = state.acceptedCount, credits = state.replaysRemaining;
  tick(state, { cancelEpoch: 1, cancelled: true, aPressed: true, bPressed: true });
  assert.equal(state.mode, 'count-in'); assert.equal(state.activeHold, null); assert.equal(state.visibleCue, null);
  assert.equal(state.cancelCount, 1); assert.equal(state.resumeCount, 1); assert.equal(state.answered, 1); assert.equal(state.litCount, 1); assert.equal(state.score, 1100);
  assert.equal(state.acceptedCount, accepted); assert.equal(state.replaysRemaining, credits); assert.equal(state.mistakes, 0); assert.equal(state.requiresNeutral, true);
  near(state.onsets[1], state.elapsed + 1.8); near(state.onsets[2] - state.onsets[1], 1.5); near(state.nextOnset, state.onsets[1]);
});

test('every cancellation-owned tick preserves quarantine; only later real neutral then a fresh press can rearm', () => {
  const { state, cue } = prepareKind('short'); start(state, cue, 0, { cancelEpoch: 0 }); ticks(state, 4, { a: true, cancelEpoch: 0 });
  tick(state, { cancelEpoch: 1, cancelled: true }); const reanchored = state.nextOnset, cancelTime = state.elapsed;
  model.step(state, 0.25, { cancelEpoch: 1, cancelled: true, a: false, aPressed: true, bPressed: true });
  assert.equal(state.requiresNeutral, true); assert.equal(state.cancelCount, 1); assert.equal(state.resumeCount, 1); assert.equal(state.nextOnset, reanchored);
  assert.equal(state.replaysRemaining, 2); assert.ok(state.elapsed > cancelTime);
  untilTick(state, Math.round(reanchored / DT) - 4, { cancelEpoch: 1, cancelled: true });
  tick(state, { ...arrows[cue.direction], a: true, cancelEpoch: 1 }); assert.equal(state.activeHold, null); assert.equal(state.requiresNeutral, true);
  tick(state, { a: false, cancelEpoch: 1 }); assert.equal(state.requiresNeutral, false);
  tick(state, { ...arrows[cue.direction], a: true, cancelEpoch: 1 }); assert.ok(state.activeHold);
  releaseAfter(state, cue, 18, { cancelEpoch: 1 }); assert.equal(state.answered, 1); assert.equal(state.cancelCount, 1); assert.equal(state.mistakes, 0);
});

test('cancellation-owned release and buffered A/B edges cannot award a note or spend replay credits', () => {
  const released = prepareKind('short'); start(released.state, released.cue, 0, { cancelEpoch: 0 });
  ticks(released.state, 17, { ...arrows[released.cue.direction], a: true, cancelEpoch: 0 });
  tick(released.state, { a: false, cancelEpoch: 1, cancelled: true });
  assert.equal(released.state.acceptedCount, 0); assert.equal(released.state.mistakes, 0); assert.equal(released.state.activeHold, null);
  const buffered = prepareKind('short'); tick(buffered.state, { cancelEpoch: 0 }); untilTick(buffered.state, Math.round(buffered.state.nextOnset / DT) - 1);
  model.step(buffered.state, DT / 2, { ...arrows[buffered.cue.direction], a: true, aPressed: true, bPressed: true, cancelEpoch: 0 });
  model.step(buffered.state, DT / 2, { a: false, cancelEpoch: 1, cancelled: true });
  assert.equal(buffered.state.acceptedCount, 0); assert.equal(buffered.state.replayCount, 0); assert.equal(buffered.state.mistakes, 0); assert.equal(buffered.state.requiresNeutral, true);
});

test('cancellation during listening or feedback does not restart their scheduled clocks', () => {
  const listening = model.create(); tick(listening, { cancelEpoch: 0 });
  const startAt = listening.listenStartedAt, endAt = listening.listenEndsAt, serial = listening.listenSerial;
  tick(listening, { cancelEpoch: 1, cancelled: true }); ticks(listening, 10, { cancelEpoch: 1, cancelled: true });
  assert.equal(listening.listenStartedAt, startAt); assert.equal(listening.listenEndsAt, endAt); assert.equal(listening.listenSerial, serial); assert.equal(listening.resumeCount, 0);
  untilTick(listening, Math.round(startAt / DT)); assert.ok(listening.visibleCue); assert.equal(listening.visibleCue.startedAt, startAt);
  const state = model.create(), cues = listen(state, { cancelEpoch: 0 }); tick(state, { ...arrows[cues[0].direction], a: true, cancelEpoch: 0 });
  const errorTick = state.tick; ticks(state, 11, { cancelEpoch: 0 }); tick(state, { cancelEpoch: 1, cancelled: true });
  assert.equal(state.mode, 'feedback'); assert.equal(state.resumeCount, 0); untilTick(state, errorTick + 47); assert.equal(state.mode, 'feedback');
  tick(state); assert.equal(state.mode, 'listen'); near(state.listenStartedAt, state.elapsed + 0.8);
});

test('repeated cancellation and re-count-ins never freeze or extend the finite ninety-second clock', () => {
  const state = model.create(); tick(state, { cancelEpoch: 0 });
  for (let epoch = 1; state.phase === 'playing' && epoch < 400; epoch += 1) model.step(state, 0.25, { cancelEpoch: epoch, cancelled: true });
  assert.equal(state.phase, 'lost'); assert.equal(state.lostReason, 'timeout'); assert.equal(state.elapsed, 90); assert.equal(state.tick, 5400);
  assert.equal(state.mistakes, 0); assert.equal(state.acceptedCount, 0); assert.equal(state.replaysRemaining, 2); assert.ok(state.cancelCount > 300);
});

test('four genuine mistakes lose once; incomplete prefixes reset while completed beacons keep their score', () => {
  const state = model.create(); finishPhrase(state, listen(state)); assert.equal(state.litCount, 1);
  for (let error = 1; error <= 4; error += 1) {
    const cues = listen(state); tick(state, { ...arrows[cues[0].direction], a: true });
    assert.equal(state.mistakes, error); assert.equal(state.lastError, 'early'); assert.equal(state.answered, 0); assert.equal(state.score, 1000);
    assert.equal(state.phase, error < 4 ? 'playing' : 'lost');
  }
  assert.equal(state.lostReason, 'mistakes'); assert.equal(state.litCount, 1); assert.equal(state.beacons[0].lit, true);
  const terminal = clone(state); ticks(state, 120, { a: true, b: true }); assert.deepEqual(state, terminal);
});

test('the deadline is checked before final-release judging; a release one tick before ninety seconds may win', () => {
  const prepared = prepareFinalHold(); assert.equal(prepared.litCount, 2); assert.ok(prepared.activeHold);
  function clockFixture(releaseTick) {
    // Explicit clock-boundary fixture; all preceding notes/holds were observed
    // and entered normally. Only public timestamps are shifted together.
    const state = clone(prepared), deltaTicks = releaseTick - (state.tick + 1), delta = deltaTicks * DT;
    state.tick += deltaTicks; state.elapsed = state.tick * DT; state.remaining = state.timeLimit - state.elapsed;
    state.onsets = state.onsets.map(time => time + delta); state.responseStartAt += delta; state.nextOnset += delta; state.activeHold.startedAt += delta;
    return state;
  }
  const expired = clockFixture(5400), accepted = expired.acceptedCount; tick(expired, { a: false, bPressed: true, cancelEpoch: 1 });
  assert.equal(expired.phase, 'lost'); assert.equal(expired.lostReason, 'timeout'); assert.equal(expired.acceptedCount, accepted); assert.equal(expired.litCount, 2); assert.equal(expired.replaysRemaining, 2);
  const inTime = clockFixture(5399); tick(inTime, { a: false });
  assert.equal(inTime.phase, 'won'); assert.equal(inTime.litCount, 3); assert.equal(inTime.score, 3400); assert.ok(inTime.remaining > 0 && inTime.remaining < DT * 1.01);
  const final = clone(inTime); model.step(inTime, 0.25, { a: true, b: true, cancelEpoch: 99, cancelled: true }); assert.deepEqual(inTime, final);
});

test('retry restores independent phrase/timing/progress state, and JSON round trips preserve an actual active hold', () => {
  for (let level = 0; level < 3; level += 1) {
    const original = model.create(61, level), played = model.create(61, level); tick(played, { bPressed: true, cancelEpoch: 0 }); tick(played, { cancelEpoch: 1, cancelled: true });
    played.beacons[0].lit = true; const retry = model.create(61, level);
    assert.deepEqual(retry, original); assert.notEqual(retry.beacons, original.beacons); assert.equal(retry.replaysRemaining, 2); assert.equal(retry.cancelCount, 0); assert.equal(retry.requiresNeutral, false);
  }
  const { state, cue } = prepareKind('short'); start(state, cue); ticks(state, 5, { ...arrows[cue.direction], a: true });
  const restored = JSON.parse(JSON.stringify(state));
  ticks(state, 12, { a: true }); ticks(restored, 12, { a: true }); tick(state, {}); tick(restored, {});
  assert.deepEqual(restored, state); assert.equal(state.answered, 1); assert.equal(state.mistakes, 0);
});

test('invalid dt is inert and fixed-step subdivisions preserve replay and listening timing', () => {
  const state = model.create(), before = clone(state);
  for (const dt of [0, -1, NaN, Infinity, '0.1', undefined]) model.step(state, dt, { aPressed: true, bPressed: true, cancelEpoch: 99, cancelled: true });
  assert.deepEqual(state, before);
  const coarse = model.create(), fine = model.create(); model.step(coarse, 0.1, { bPressed: true }); tick(fine, { bPressed: true }); ticks(fine, 5);
  for (const key of ['tick', 'elapsed', 'remaining', 'mode', 'listenSerial', 'listenStartedAt', 'listenEndsAt', 'replaysRemaining', 'requiresNeutral', 'beacons', 'visibleCue', 'onsets']) assert.deepEqual(coarse[key], fine[key]);
  const capped = model.create(); model.step(capped, 100, {}); assert.equal(capped.tick, 15); assert.equal(capped.elapsed, 0.25);
});

for (let difficulty = 0; difficulty < 3; difficulty += 1) {
  const scenario = ['with one paid replay', 'after cancelling a real in-progress hold', 'without intervention'][difficulty];
  test(`public-cue-only ordinary inputs finish all three phrases of level ${difficulty + 1} ${scenario}`, async t => {
    const { createPilot } = await import(pathToFileURL(path.join(__dirname, 'automation.mjs')).href);
    const pilot = createPilot(), state = model.create(31, difficulty);
    let held = new Set(), previous = new Set(), epoch = 0, cancellationTicks = 0;
    let replayed = false, cancelled = false, sawShort = false, sawLong = false, observations = 0;
    for (let frame = 0; frame < 5400 && state.phase === 'playing'; frame += 1) {
      if (frame % 5 === 0) {
        // Strip all private answers/input machinery before exposing a snapshot.
        // The observer can remember only cues that were actually displayed.
        const publicState = Object.fromEntries(Object.entries(state).filter(([key]) => !key.startsWith('_')));
        const snapshot = { phase: state.phase, paused: false, level: difficulty, model: clone(publicState) }, unchanged = clone(snapshot);
        held = new Set(pilot(snapshot, { elapsed: state.elapsed, mode: 'qa' })); observations += 1;
        assert.deepEqual(snapshot, unchanged, 'the pilot is a read-only observer');
        if (difficulty === 0 && !replayed && state.mode === 'count-in') {
          held = new Set(['b']); replayed = true;
        }
      }
      const cancellingNow = difficulty === 1 && !cancelled && state.answered === 1 && state.activeHold?.duration >= 0.1;
      const acceptedBefore = state.acceptedCount, scoreBefore = state.score;
      if (cancellingNow) { cancelled = true; epoch += 1; cancellationTicks = 3; held = new Set(); }
      const input = { x: Number(held.has('ArrowRight')) - Number(held.has('ArrowLeft')),
        y: Number(held.has('ArrowDown')) - Number(held.has('ArrowUp')), a: held.has('Space'), b: held.has('b'),
        aPressed: held.has('Space') && !previous.has('Space'), bPressed: held.has('b') && !previous.has('b'), cancelEpoch: epoch };
      if (cancellationTicks > 0) {
        Object.assign(input, { x: 0, y: 0, a: false, b: false, aPressed: false, bPressed: false, cancelled: true });
        held = new Set(); cancellationTicks -= 1;
      }
      tick(state, input); previous = new Set(held);
      if (cancellingNow) {
        assert.equal(state.answered, 1); assert.equal(state.acceptedCount, acceptedBefore); assert.equal(state.score, scoreBefore);
        assert.equal(state.activeHold, null); assert.equal(state.mode, 'count-in'); assert.equal(state.requiresNeutral, true);
        assert.equal(state.replaysRemaining, 2); assert.equal(state.mistakes, 0);
      }
      for (const event of state.events) if (event.type === 'accepted') {
        const short = event.holdDuration >= state.shortMin && event.holdDuration <= state.shortMax;
        const long = event.holdDuration >= state.longMin && event.holdDuration <= state.longMax;
        assert.notEqual(short, long, 'an accepted actual hold belongs to exactly one disjoint band');
        sawShort ||= short; sawLong ||= long;
      }
    }
    assert.equal(state.phase, 'won', `ordinary response ended with ${state.lastError || state.lostReason}`);
    assert.equal(state.litCount, 3); assert.ok(state.beacons.every(beacon => beacon.lit));
    assert.equal(state.correctNotes, state.phraseLength * 3); assert.equal(state.acceptedCount, state.phraseLength * 3);
    assert.equal(state.mistakes, 0); assert.equal(state.replayCount, difficulty === 0 ? 1 : 0);
    assert.equal(state.cancelCount, difficulty === 1 ? 1 : 0); assert.equal(state.resumeCount, difficulty === 1 ? 1 : 0);
    assert.ok(sawShort && sawLong); assert.equal(state.activeHold, null); assert.equal(state.visibleCue, null);
    assert.ok(state.elapsed >= 30 && state.elapsed <= 60); assert.ok(observations > 100);
    assert.equal(state.score, 3000 + Math.floor(state.remaining) * 10 + state.replaysRemaining * 100 + 200);
    t.diagnostic(JSON.stringify({ kind: 'ordinary-observed-round', level: state.level, elapsed: state.elapsed,
      accepted: state.acceptedCount, replays: state.replayCount, cancellations: state.cancelCount, mistakes: state.mistakes }));
  });
}
