'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { create, step, snapshot } = require('../src/main/assets/game-model.js');
const DT = 1 / 60;
const axes = { up: { y: -1 }, right: { x: 1 }, down: { y: 1 }, left: { x: -1 }, wait: { a: true } };
const clone = value => JSON.parse(JSON.stringify(value));
const ids = queue => queue.map(command => command.id);

function tick(state, input = {}, dt = DT) {
  assert.equal(step(state, dt, input), state);
  return state;
}
function ready(difficulty = 0) { return tick(create(737, difficulty)); }
function queued(kinds, difficulty = 0) {
  const state = ready(difficulty);
  for (const kind of kinds) { tick(state, axes[kind]); tick(state); }
  return state;
}
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function frozen(value) {
  if (value && typeof value === 'object') {
    assert.equal(Object.isFrozen(value), true);
    Object.values(value).forEach(frozen);
  }
}
function detached(original, copy) {
  assert.deepEqual(copy, original);
  if (original && typeof original === 'object') {
    assert.notEqual(copy, original);
    for (const key of Object.keys(original)) detached(original[key], copy[key]);
  }
}

// Synthetic boundary fixtures are NOT ordinary playthroughs. Commands and queue
// receipts come from actual input above; only public current time/position/marker
// facts are relocated. Earlier beat history is deliberately not manufactured.
// Maps, gate rules, physics, command IDs and genuine receipt prefixes are retained.
function boundary(source, nextBeat = 1, position = source.player, markers = source.collectedMarkerIds) {
  const state = clone(source);
  state.tick = nextBeat * 72 - 1;
  state.elapsed = state.tick / 60;
  state.beatNo = nextBeat - 1;
  state.beatPhaseTicks = 71;
  state.ticksUntilBeat = 1;
  state.beatsRemaining = state.beatBudget - state.beatNo;
  state.player = { ...position };
  state.collectedMarkerIds = [...markers];
  state.collectedCount = markers.length;
  state.exitUnlocked = markers.length === state.markerCount;
  state.score = 100 * markers.length;
  state.events = [];
  state.lastInput = state.lastStep = state.lastBeat = null;
  state.lastQueueReceipts = [];
  state.gateStates = state.scenario.gates.map(gate => ({
    id: gate.id, period: gate.period, openResidues: [...gate.openResidues],
    currentBeatNo: state.beatNo, openNow: gate.openResidues.includes(state.beatNo % gate.period),
    nextBeatNo: nextBeat, openNext: gate.openResidues.includes(nextBeat % gate.period),
    preview: Array.from({ length: Math.min(6, state.beatsRemaining) }, (_, i) => ({
      beatNo: nextBeat + i, open: gate.openResidues.includes((nextBeat + i) % gate.period)
    }))
  }));
  [state.identity, state.scenario, state.physics, state.lastInput, state.lastStep, state.lastBeat].forEach(freeze);
  [state.queue, state.queueReceipts, state.beatReceipts, state.lastQueueReceipts].forEach(bank => bank.forEach(freeze));
  return state;
}

test('creation exposes fixed public identity, configuration and empty facts', () => {
  const s = create();
  assert.deepEqual(s.identity, { gameId: 37, name: '节拍闸道', englishName: 'Metronome Gates',
    slug: 'metronome-gates', packageId: 'com.ecojust.metronomegatestv', versionName: '0.1.0',
    versionCode: 1, seed: 737, actionCount: 2 });
  assert.deepEqual(s.physics, { ticksPerSecond: 60, ticksPerBeat: 72, queueCapacity: 6,
    neutralAxisThreshold: 0.35, directionAxisThreshold: 0.55, markerScore: 100, winScore: 1000 });
  assert.deepEqual([s.width, s.height, s.schemaVersion, s.tick, s.elapsed, s.beatNo, s.beatPhaseTicks,
    s.ticksUntilBeat, s.beatsRemaining, s.score, s.nextCommandId], [960, 540, 1, 0, 0, 0, 0, 72, 48, 0, 1]);
  assert.equal(s.phase, 'playing');
  for (const key of ['lostReason', 'terminal', 'lastInput', 'lastStep', 'lastBeat']) assert.equal(s[key], null);
  for (const key of ['queue', 'events', 'queueReceipts', 'beatReceipts', 'lastQueueReceipts', 'collectedMarkerIds']) assert.deepEqual(s[key], []);
  assert.deepEqual(s.inputState, { cancelEpoch: null, quarantined: true, directionArmed: false,
    aArmed: false, bArmed: false, edgeOrdinals: { direction: 0, a: 0, b: 0 } });
  [s.identity, s.scenario, s.physics].forEach(frozen);
  const other = create();
  for (const key of ['identity', 'scenario', 'physics']) detached(s[key], other[key]);
});

test('seed and difficulty normalization preserve the three public scenarios', () => {
  const expected = [[48, { x: 1, y: 1 }, { x: 3, y: 1 }, 3, 4],
    [64, { x: 6, y: 1 }, { x: 6, y: 9 }, 4, 5], [62, { x: 6, y: 5 }, { x: 6, y: 1 }, 4, 8]];
  expected.forEach(([budget, start, exit, markers, gates], difficulty) => {
    const s = create(-8.9, difficulty);
    assert.equal(s.seed, -8); assert.equal(s.identity.seed, -8);
    assert.equal(s.level, difficulty + 1); assert.equal(s.levelName, s.scenario.name);
    assert.equal(s.scenarioId, `metronome-gates-${difficulty + 1}`);
    assert.equal(s.scenario.id, s.scenarioId); assert.equal(s.beatBudget, budget);
    assert.deepEqual(s.player, start); assert.deepEqual(s.scenario.start, start); assert.deepEqual(s.scenario.exit, exit);
    assert.equal(s.markerCount, markers); assert.equal(s.scenario.gates.length, gates);
    assert.equal(s.scenario.grid.length, 11); s.scenario.grid.forEach(row => assert.equal(row.length, 13));
    assert.deepEqual(s.scenario, create(12345, difficulty).scenario);
  });
  assert.equal(create(Infinity, NaN).seed, 737);
  assert.equal(create('5', '2').difficulty, 0);
  assert.equal(create(0, -4).difficulty, 0); assert.equal(create(0, 8.9).difficulty, 2);
});

test('initial held input stays quarantined until a neutral acknowledgement', () => {
  const s = create();
  tick(s, { x: 1, a: true, bPressed: true });
  assert.equal(s.lastInput.mode, 'quarantine'); assert.equal(s.lastInput.direction, null);
  assert.deepEqual(s.queueReceipts, []); assert.equal(s.tick, 1);
  tick(s, { x: 0.35, y: -0.35 });
  assert.equal(s.lastInput.mode, 'neutral_ack'); assert.equal(s.lastInput.neutralAcknowledged, true);
  assert.deepEqual(s.lastInput.fresh, { direction: false, a: false, b: false });
  assert.deepEqual(s.lastInput.armedAfter, { direction: true, a: true, b: true });
  tick(s, { x: 1 }); assert.equal(s.queue[0].kind, 'right');
});

test('full neutral includes system buttons, menu validity and both axis validity flags', () => {
  const blockers = ['a', 'b', 'aPressed', 'bPressed', 'start', 'select', 'startPressed', 'selectPressed',
    'confirm', 'retry', 'cancelled'].map(key => ({ [key]: true }));
  blockers.push({ menuDelta: 1 }, { menuDelta: NaN }, { menuDelta: '0' }, { x: NaN }, { y: null }, { x: 0.36 });
  for (const input of blockers) {
    const s = create(); tick(s, input);
    assert.equal(s.lastInput.fullNeutral, false); assert.equal(s.inputState.quarantined, true);
    assert.deepEqual(s.queue, []);
    tick(s); assert.equal(s.lastInput.mode, 'neutral_ack');
  }
  const s = ready(); tick(s, { start: true, select: true, confirm: true, retry: true });
  assert.deepEqual(s.queueReceipts, []);
});

test('direction thresholds require actual return to the inclusive neutral box', () => {
  const s = ready();
  tick(s, { x: 0.54 }); assert.equal(s.queue.length, 0);
  tick(s, { x: 0.55 }); assert.equal(s.queue[0].kind, 'right');
  for (const x of [-1, 0.36, -0.55]) tick(s, { x });
  assert.equal(s.queue.length, 1); assert.equal(s.lastInput.direction, 'left');
  tick(s, { x: 0.35, y: -0.35 }); assert.equal(s.inputState.directionArmed, true);
  tick(s, { x: -0.55 }); assert.deepEqual(s.queue.map(c => c.kind), ['right', 'left']);
  assert.equal(s.inputState.edgeOrdinals.direction, 2);
});

test('dominant axis uses normalized values and vertical wins exact ties', () => {
  const s = ready();
  tick(s, { x: 5, y: -5 });
  assert.deepEqual([s.lastInput.x, s.lastInput.y, s.lastInput.raw.x, s.lastInput.raw.y], [1, -1, 5, -5]);
  assert.equal(s.queue[0].kind, 'up');
  tick(s); tick(s, { x: 0.55, y: 0.55 });
  tick(s); tick(s, { x: -0.9, y: 0.6 });
  assert.deepEqual(s.queue.map(c => c.kind), ['up', 'down', 'left']);
});

test('invalid axes cannot trigger or rearm direction and raw invalid numbers become null', () => {
  const s = ready(); tick(s, { x: 1 });
  for (const input of [{ x: NaN }, { y: '0' }, { x: Infinity, y: -1 }]) {
    tick(s, input); assert.equal(s.lastInput.axesValid, false);
    assert.equal(s.lastInput.direction, null); assert.equal(s.inputState.directionArmed, false);
  }
  assert.equal(s.lastInput.x, 0); assert.equal(s.lastInput.raw.x, null);
  tick(s, { x: -1 }); assert.equal(s.queue.length, 1);
  tick(s); tick(s, { x: -1 }); assert.equal(s.queue.length, 2);
});

test('literal buttons and pressed-only input use one edge latch per button', () => {
  const s = ready(); tick(s, { a: 1, b: 'true', aPressed: 'true', bPressed: 1 });
  assert.deepEqual(s.queueReceipts, []); assert.equal(s.lastInput.raw.a, false);
  tick(s, { aPressed: true }); tick(s, { aPressed: true });
  tick(s, { a: true, aPressed: true }); tick(s, { a: true });
  assert.equal(s.queue.length, 1); assert.equal(s.inputState.edgeOrdinals.a, 1);
  tick(s); tick(s, { a: true, aPressed: true });
  assert.equal(s.queue.length, 2); assert.equal(s.inputState.edgeOrdinals.a, 2);
});

test('direction, A and B rearm independently while other controls remain held', () => {
  const s = ready(); tick(s, { x: 1, aPressed: true, bPressed: true });
  tick(s, { x: 1, bPressed: true }); tick(s, { x: 1, aPressed: true, bPressed: true });
  assert.deepEqual(s.inputState.edgeOrdinals, { direction: 1, a: 2, b: 1 });
  tick(s, { x: 1, aPressed: true }); tick(s, { x: 1, aPressed: true, bPressed: true });
  assert.deepEqual(s.inputState.edgeOrdinals, { direction: 1, a: 2, b: 2 });
  tick(s, { aPressed: true, bPressed: true }); tick(s, { y: 1, aPressed: true, bPressed: true });
  assert.deepEqual(s.inputState.edgeOrdinals, { direction: 2, a: 2, b: 2 });
  assert.deepEqual(s.queue.map(c => c.kind), ['right', 'wait', 'down']);
});

test('cancellation preserves the queue and does not stop boundary consumption', () => {
  const s = boundary(queued(['right', 'wait']));
  const before = s.queueReceipts.length;
  tick(s, { cancelled: true, x: 1, a: true });
  assert.equal(s.tick, 72); assert.equal(s.beatNo, 1); assert.deepEqual(s.player, { x: 2, y: 1 });
  assert.deepEqual(ids(s.queue), [2]); assert.equal(s.queueReceipts.length, before);
  assert.equal(s.lastInput.mode, 'quarantine'); assert.equal(s.lastBeat.command.id, 1);
  tick(s, { x: 1 }); assert.equal(s.lastInput.mode, 'quarantine');
  tick(s); assert.equal(s.lastInput.mode, 'neutral_ack');
  tick(s, { x: 1 }); assert.deepEqual(ids(s.queue), [2, 3]);
});

test('epoch changes isolate input, normalize epochs and may acknowledge neutral immediately', () => {
  const s = boundary(queued(['wait', 'right']));
  tick(s, { cancelEpoch: 4.9, x: 1 });
  assert.equal(s.lastInput.cancelEpoch, 4); assert.equal(s.lastInput.raw.cancelEpoch, 4.9);
  assert.equal(s.lastInput.epochChanged, true); assert.equal(s.lastInput.mode, 'quarantine');
  assert.equal(s.beatNo, 1); assert.deepEqual(ids(s.queue), [2]);
  tick(s, { cancelEpoch: 4 }); assert.equal(s.lastInput.mode, 'neutral_ack');
  tick(s, { cancelEpoch: -8 }); assert.equal(s.lastInput.cancelEpoch, 0);
  assert.equal(s.lastInput.mode, 'neutral_ack');
  tick(s, { cancelEpoch: Infinity }); assert.equal(s.lastInput.epochChanged, false);
  assert.equal(s.lastInput.raw.cancelEpoch, null); assert.equal(s.lastInput.mode, 'active');
});

test('empty undo consumes its edge and undone command IDs are never reused', () => {
  const s = ready(); tick(s, { b: true }); tick(s, { b: true });
  assert.equal(s.queueReceipts.length, 1); assert.equal(s.queueReceipts[0].result, 'empty');
  assert.equal(s.queueReceipts[0].command, null); assert.equal(s.nextCommandId, 1);
  tick(s); tick(s, { x: 1 }); tick(s); tick(s, { bPressed: true });
  assert.equal(s.lastQueueReceipts[0].result, 'undone'); assert.equal(s.lastQueueReceipts[0].command.id, 1);
  assert.deepEqual(s.player, s.scenario.start);
  tick(s); tick(s, { x: -1 }); assert.deepEqual(ids(s.queue), [2]); assert.equal(s.nextCommandId, 3);
  assert.deepEqual(s.queueReceipts.map(r => r.id), [1, 2, 3, 4]);
  const single = boundary(queued(['right'])); tick(single, { b: true });
  assert.equal(single.lastQueueReceipts[0].command.id, 1); assert.equal(single.lastBeat.command, null);
  assert.equal(single.lastBeat.waitSource, 'empty'); assert.deepEqual(single.player, single.scenario.start);
});

test('tick 71 to 72 applies B then direction then A before consuming the head', () => {
  const s = boundary(queued(['right', 'down']));
  tick(s, { b: true, y: 1, a: true });
  const receipts = s.lastQueueReceipts;
  assert.deepEqual(receipts.map(r => [r.source, r.result, r.tick, r.beatNo]),
    [['b', 'undone', 72, 0], ['direction', 'enqueued', 72, 0], ['a', 'enqueued', 72, 0]]);
  assert.deepEqual(receipts.map(r => r.queueBeforeIds), [[1, 2], [1], [1, 3]]);
  assert.deepEqual(receipts.map(r => r.queueAfterIds), [[1], [1, 3], [1, 3, 4]]);
  assert.deepEqual(ids(s.queue), [3, 4]); assert.equal(s.nextCommandId, 5);
  assert.deepEqual(s.lastBeat.queueBeforeIds, [1, 3, 4]); assert.equal(s.lastBeat.command.id, 1);
  assert.deepEqual(s.lastStep, { fromTick: 71, toTick: 72, fromBeatNo: 0, toBeatNo: 1,
    phaseTicksBefore: 71, phaseTicksAfter: 0, inputMode: 'active', queueBeforeIds: [1, 2], queueAfterIds: [3, 4],
    queueReceiptIds: [3, 4, 5], beatReceiptId: 1, consumedCommandId: 1,
    positionBefore: { x: 1, y: 1 }, positionAfter: { x: 2, y: 1 }, markersBeforeIds: [], markersAfterIds: [],
    scoreBefore: 0, scoreAfter: 0, terminalAfter: null });
  assert.deepEqual(s.events, ['undo', 'enqueue', 'enqueue', 'beat'].map((type, i) => ({ type, tick: 72, beatNo: i === 3 ? 1 : 0 })));
  assert.deepEqual(receipts[1].command, { id: 3, kind: 'down', queuedTick: 72, source: 'direction', edgeOrdinal: 3 });
  assert.deepEqual(receipts[2].command, { id: 4, kind: 'wait', queuedTick: 72, source: 'a', edgeOrdinal: 1 });
});

test('full queue rejects edges before a same-tick pop and does not borrow its capacity', () => {
  const s = boundary(queued(Array(6).fill('wait')));
  tick(s, { x: 1, a: true });
  assert.deepEqual(s.lastQueueReceipts.map(r => [r.result, r.command]), [['full', null], ['full', null]]);
  for (const r of s.lastQueueReceipts) {
    assert.deepEqual(r.queueBeforeIds, [1, 2, 3, 4, 5, 6]); assert.deepEqual(r.queueAfterIds, r.queueBeforeIds);
  }
  assert.deepEqual(ids(s.queue), [2, 3, 4, 5, 6]); assert.equal(s.nextCommandId, 7);
  assert.deepEqual(s.inputState.edgeOrdinals, { direction: 1, a: 7, b: 0 });
  tick(s, { x: 1, a: true }); assert.equal(s.lastQueueReceipts.length, 0);
  assert.equal(s.queue.length, 5);
  const freed = boundary(queued(Array(6).fill('wait'))); tick(freed, { b: true, x: 1, a: true });
  assert.deepEqual(freed.lastQueueReceipts.map(r => r.result), ['undone', 'enqueued', 'full']);
  assert.deepEqual(freed.lastBeat.queueBeforeIds, [1, 2, 3, 4, 5, 7]);
  assert.deepEqual(ids(freed.queue), [2, 3, 4, 5, 7]); assert.equal(freed.nextCommandId, 8);
});

test('every positive finite dt advances exactly one tick; invalid dt is a whole-state no-op', () => {
  const s = ready();
  for (const dt of [Number.MIN_VALUE, 0.001, DT, 1, 100000]) {
    const before = s.tick; tick(s, {}, dt); assert.equal(s.tick, before + 1); assert.equal(s.elapsed, s.tick / 60);
  }
  tick(s, { x: 1 });
  for (const dt of [undefined, null, NaN, Infinity, -Infinity, 0, -1, '1', false]) {
    const before = clone(s); assert.equal(step(s, dt, { cancelled: true, b: true }), s); assert.deepEqual(s, before);
  }
});

test('only the 72nd tick consumes a beat and later valid steps clear transient facts', () => {
  const s = create();
  for (let i = 0; i < 71; i++) tick(s);
  assert.equal(s.beatNo, 0); assert.equal(s.beatPhaseTicks, 71); assert.equal(s.ticksUntilBeat, 1);
  assert.deepEqual(s.beatReceipts, []); assert.deepEqual(s.player, s.scenario.start);
  tick(s, { x: 1 });
  assert.equal(s.beatNo, 1); assert.equal(s.beatPhaseTicks, 0); assert.equal(s.ticksUntilBeat, 72);
  assert.equal(s.lastBeat.command.queuedTick, 72); assert.deepEqual(s.player, { x: 2, y: 1 });
  assert.equal(s.lastStep.beatReceiptId, 1); assert.equal(s.lastStep.fromTick, 71); assert.equal(s.lastStep.toTick, 72);
  tick(s); assert.equal(s.lastBeat, null); assert.deepEqual(s.lastQueueReceipts, []); assert.deepEqual(s.events, []);
  assert.equal(s.beatReceipts.length, 1); assert.equal(s.queueReceipts.length, 1);
});

test('explicit and empty waits both consume budget but only explicit waits consume a command', () => {
  for (const explicit of [false, true]) {
    const s = boundary(explicit ? queued(['wait']) : ready()); tick(s);
    const b = s.lastBeat;
    assert.equal(b.action, 'wait'); assert.equal(b.waitSource, explicit ? 'explicit' : 'empty');
    assert.equal(b.command && b.command.id, explicit ? 1 : null);
    assert.equal(b.outcome, 'waited'); assert.equal(b.targetCell, 'S'); assert.equal(b.gateCheck, null);
    assert.deepEqual(b.from, b.candidate); assert.deepEqual(b.to, b.from);
    assert.deepEqual([b.remainingBefore, b.remainingAfter, s.beatsRemaining], [48, 47, 47]);
    assert.equal(s.nextCommandId, explicit ? 2 : 1);
  }
});

test('all two- and three-period gates share the absolute beat and previews stop at budget', () => {
  const s = boundary(queued(['wait'], 2), 6); tick(s);
  assert.deepEqual(s.gateStates.map(g => g.openNow), [true, false, false, false, true, true, false, false]);
  assert.deepEqual(s.gateStates.map(g => g.openNext), [false, true, true, false, false, false, true, true]);
  for (const gate of s.gateStates) {
    assert.equal(gate.currentBeatNo, 6); assert.equal(gate.nextBeatNo, 7);
    assert.deepEqual(gate.preview.map(p => p.beatNo), [7, 8, 9, 10, 11, 12]);
  }
  assert.deepEqual(s.gateStates[0].preview.map(p => p.open), [false, true, false, true, false, true]);
  const nearEnd = boundary(queued(['wait'], 2), 61); tick(nearEnd);
  nearEnd.gateStates.forEach(g => assert.deepEqual(g.preview, [{ beatNo: 62, open: g.openResidues.includes(62 % g.period) }]));
});

test('entering the same gate uses the newly consumed beat for both open and closed receipts', () => {
  for (const [beat, open] of [[1, false], [2, true]]) {
    const s = boundary(queued(['right']), beat, { x: 5, y: 1 }); tick(s);
    assert.deepEqual(s.lastBeat.gateCheck, { id: 'a', period: 2, residue: beat % 2, open });
    assert.equal(s.lastBeat.targetCell, 'a'); assert.equal(s.lastBeat.outcome, open ? 'moved' : 'closed_gate');
    assert.deepEqual(s.lastBeat.candidate, { x: 6, y: 1 }); assert.deepEqual(s.player, { x: open ? 6 : 5, y: 1 });
    assert.equal(s.phase, open ? 'playing' : 'lost');
  }
});

test('a source gate closing cannot kill a wait, blocked move, or departure', () => {
  for (const [kind, outcome, x] of [['wait', 'waited', 6], ['up', 'blocked', 6], ['left', 'moved', 5]]) {
    const s = boundary(queued([kind]), 3, { x: 6, y: 1 }); tick(s);
    assert.equal(s.gateStates[0].openNow, false); assert.equal(s.lastBeat.gateCheck, null);
    assert.equal(s.lastBeat.outcome, outcome); assert.deepEqual(s.player, { x, y: 1 }); assert.equal(s.phase, 'playing');
  }
});

test('wall blocking consumes the head and the beat without executing the next command', () => {
  const s = boundary(queued(['left', 'right'])); tick(s);
  assert.equal(s.lastBeat.outcome, 'blocked'); assert.equal(s.lastBeat.targetCell, '#');
  assert.deepEqual(s.lastBeat.candidate, { x: 0, y: 1 }); assert.deepEqual(s.player, { x: 1, y: 1 });
  assert.deepEqual(ids(s.queue), [2]); assert.equal(s.beatsRemaining, 47); assert.equal(s.phase, 'playing');
});

test('a marker scores and emits an event only on its first collection', () => {
  let s = boundary(queued(['right']), 1, { x: 10, y: 1 }); tick(s);
  assert.deepEqual(s.collectedMarkerIds, ['m1']); assert.equal(s.score, 100); assert.equal(s.collectedCount, 1);
  assert.equal(s.lastBeat.collectedMarkerId, 'm1'); assert.deepEqual(s.events.map(e => e.type), ['beat', 'marker']);
  assert.deepEqual([s.lastBeat.scoreBefore, s.lastBeat.scoreAfter], [0, 100]);
  tick(s, { x: -1 }); tick(s); s = boundary(s, 2); tick(s);
  tick(s, { x: 1 }); tick(s); s = boundary(s, 3); tick(s);
  assert.deepEqual(s.player, { x: 11, y: 1 }); assert.deepEqual(s.collectedMarkerIds, ['m1']); assert.equal(s.score, 100);
  assert.equal(s.lastBeat.collectedMarkerId, null); assert.deepEqual(s.events.map(e => e.type), ['beat']);
  assert.deepEqual(s.lastBeat.markersBeforeIds, ['m1']); assert.deepEqual(s.lastBeat.markersAfterIds, ['m1']);
});

test('entering the exit early is ordinary movement and never grants missing markers', () => {
  const s = boundary(queued(['right']), 1, { x: 2, y: 1 }); tick(s);
  assert.deepEqual(s.player, s.scenario.exit); assert.equal(s.phase, 'playing'); assert.equal(s.exitUnlocked, false);
  assert.deepEqual(s.collectedMarkerIds, []); assert.equal(s.score, 0); assert.equal(s.terminal, null);
});

test('a legal exit on the final budget beat wins before budget failure', () => {
  const source = queued(['right', 'wait']);
  const s = boundary(source, 48, { x: 2, y: 1 }, source.scenario.markers.map(m => m.id)); tick(s);
  assert.equal(s.phase, 'won'); assert.equal(s.lostReason, null); assert.equal(s.score, 1300);
  assert.equal(s.exitUnlocked, true); assert.equal(s.beatsRemaining, 0); assert.deepEqual(ids(s.queue), [2]);
  assert.deepEqual(s.terminal, { reason: 'all_markers_exit', tick: 3456, beatNo: 48,
    position: { x: 3, y: 1 }, markerIds: ['m1', 'm2', 'm3'], beatsRemaining: 0, commandId: 1 });
  assert.equal(s.lastBeat.terminalReason, 'all_markers_exit'); assert.equal(s.lastStep.terminalAfter, 'all_markers_exit');
  assert.deepEqual(s.events.map(e => e.type), ['beat', 'win']); frozen(s.terminal);
  detached(s.terminal, snapshot(s).terminal);
});

test('budget failure occurs after the final nonfatal beat and preserves the pending tail', () => {
  const s = boundary(queued(['wait', 'right']), 48); tick(s);
  assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'beat_budget'); assert.equal(s.beatNo, 48);
  assert.equal(s.beatsRemaining, 0); assert.equal(s.lastBeat.outcome, 'waited'); assert.deepEqual(ids(s.queue), [2]);
  assert.equal(s.terminal.commandId, 1); assert.equal(s.lastStep.terminalAfter, 'beat_budget');
  assert.deepEqual(s.events.map(e => e.type), ['beat', 'lose']); s.gateStates.forEach(g => assert.deepEqual(g.preview, []));
});

test('hazards beat budget failure: closed gates retain from, traps commit their target', () => {
  for (const [position, reason, finalPosition] of [[{ x: 11, y: 4 }, 'closed_gate', { x: 11, y: 4 }],
    [{ x: 3, y: 1 }, 'trap', { x: 3, y: 2 }]]) {
    const source = queued(['down', 'wait']);
    const s = boundary(source, 48, position, ['m1', 'm2', 'm3']); tick(s);
    assert.equal(s.lostReason, reason); assert.equal(s.lastBeat.outcome, reason); assert.equal(s.terminal.reason, reason);
    assert.deepEqual(s.player, finalPosition); assert.deepEqual(s.lastBeat.to, finalPosition);
    assert.equal(s.score, 300); assert.equal(s.lastBeat.collectedMarkerId, null); assert.equal(s.beatsRemaining, 0);
    assert.deepEqual(ids(s.queue), [2]); assert.deepEqual(s.events.map(e => e.type), ['beat', 'lose']);
  }
});

test('all terminal reasons make every later call a complete no-op', () => {
  const cases = [boundary(queued(['right', 'wait']), 1, { x: 5, y: 1 }),
    boundary(queued(['down', 'wait']), 1, { x: 3, y: 1 }), boundary(queued(['wait', 'right']), 48),
    boundary(queued(['right', 'wait']), 48, { x: 2, y: 1 }, ['m1', 'm2', 'm3'])];
  for (const s of cases) {
    tick(s); const before = clone(s); assert.notEqual(s.phase, 'playing');
    for (const dt of [DT, 1000, NaN, -1]) {
      assert.equal(step(s, dt, { x: 1, a: true, b: true, cancelled: true, cancelEpoch: 99 }), s);
      assert.deepEqual(s, before);
    }
  }
});

test('commands, receipts and summaries freeze deeply; snapshots are complete detached frozen copies', () => {
  const s = ready(); const input = { x: 1, a: true }; tick(s, input);
  const command = s.queue[0], enqueue = s.queueReceipts[0];
  detached(command, enqueue.command); frozen(command); frozen(enqueue); frozen(s.lastInput); frozen(s.lastStep);
  input.x = -1; assert.equal(s.lastInput.raw.x, 1);
  assert.throws(() => { command.kind = 'left'; }, TypeError);
  assert.throws(() => { enqueue.queueAfterIds.push(99); }, TypeError);
  for (; s.tick < 72;) tick(s);
  const beat = s.beatReceipts[0];
  detached(command, beat.command); detached(enqueue.command, beat.command);
  [beat, s.lastBeat, s.lastStep, s.lastInput].forEach(frozen);
  assert.throws(() => { beat.to.x = 99; }, TypeError);
  const before = clone(s), first = snapshot(s), second = snapshot(s);
  assert.deepEqual(s, before); detached(s, first); detached(first, second); frozen(first); frozen(second);
  assert.deepEqual(Object.keys(first).sort(), Object.keys(s).sort());
  assert.throws(() => { first.inputState.edgeOrdinals.direction++; }, TypeError);
  s.player.x = 9; s.queue.pop(); s.inputState.edgeOrdinals.direction++;
  assert.deepEqual(first.player, { x: 2, y: 1 }); assert.deepEqual(ids(first.queue), [2]);
  assert.equal(first.inputState.edgeOrdinals.direction, 1); assert.equal(first.queueReceipts[0].command.kind, 'right');
});
