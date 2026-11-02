'use strict';
// Explicit synthetic boundary fixtures; no winning route or ordinary-run claim.
const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60, copy = x => structuredClone(x);
const step = (s, input = {}) => Model.step(s, DT, input);
function ticks(s, count, input = {}) { for (let n = 0; n < count; n++) step(s, input); return s; }
function fixture(s, packets = [], masses = [0, 0, 0]) {
  s.packets = copy(packets); s.cups.forEach((c, n) => { c.massG = masses[n]; c.contributionsG = [masses[n], 0]; c.withinTarget = c.massG >= c.minimumG && c.massG <= c.capacityG; c.full = c.massG === c.capacityG; });
  const cupMass = masses.reduce((a, b) => a + b, 0), bySource = [0, 1].map(source => ({ emittedG: 0, inFlightG: packets.filter(p => p.sourceIndex === source).length, capturedG: source === 0 ? cupMass : 0, spilledG: 0 }));
  bySource.forEach(row => { row.emittedG = row.inFlightG + row.capturedG; });
  s.emittedBySource = bySource.map(row => row.emittedG); s.reservoirMassG = s.initialMassG - cupMass - packets.length;
  s.nextPacketId = Math.max(cupMass, ...packets.map(p => p.id), 0) + 1; s.capturedCount = cupMass;
  s.inventory = { initialMassG: s.initialMassG, reservoirMassG: s.reservoirMassG, inFlightMassG: packets.length,
    cupMassG: cupMass, spillMassG: 0, totalMassG: s.initialMassG, errorG: 0, emittedMassG: cupMass + packets.length,
    capturedMassG: cupMass, packetsExactlyOnce: true, packetCount: packets.length, bySource };
  assert.ok(s.reservoirMassG >= 0, 'Synthetic mass must fit the real reservoir'); return s;
}
function falling(s, source = 0, id = 1) {
  const g = s.gates[source];
  return { id, massG: 1, sourceIndex: source, bornFromTick: 0, bornAtTick: 1, stage: 'fall',
    xU: g.pivotXU, yU: g.pivotYU - 20, vxU: 0, vyU: 20, route: null, contactTick: null, contactGateId: null };
}
function arriving(s, source, id, landingXU, route = 'center') {
  const g = s.gates[source], vxU = g.outgoingVxUnits[route];
  return { id, massG: 1, sourceIndex: source, bornFromTick: 0, bornAtTick: 1, stage: 'guided',
    xU: landingXU - vxU, yU: s.cups[0].planeYU - 20, vxU, vyU: 20, route, contactTick: 0, contactGateId: g.id };
}
function lastGram() {
  const s = Model.create(); return fixture(s, [arriving(s, 1, 360, s.cups[2].centerXU, 'outer')], [101, 139, 119]);
}

test('create normalizes metadata without coercion and publishes all level geometry', () => {
  assert.equal(Model.create('1', '2').seed, 728); assert.equal(Model.create(null, true).difficulty, 0);
  assert.equal(Model.create(-1.8, 8).seed, 4294967295); assert.equal(Model.create(3, -2).difficulty, 0);
  for (let d = 0; d < 3; d++) {
    const s = Model.create(NaN, d); assert.equal(s.seed, 728); assert.equal(s.initialMassG, [360, 378, 480][d]);
    assert.equal(s.deadlineTick, [3600, 4080, 4680][d]); assert.equal(s.sourceOpen, false); assert.equal(s.sourceAgeTicks, 0);
    assert.deepEqual(s.gates.map(g => g.mode), ['outer', 'outer']); assert.equal(s.inventory.totalMassG, s.initialMassG);
    for (const g of s.gates) {
      assert.equal((g.pivotYU - s.sourcePositionsU[g.sourceIndex].yU) / 20, g.fallTicks);
      for (const route of ['outer', 'center']) {
        const cup = s.cups.find(c => c.id === (route === 'center' ? 'center' : g.outerCupId));
        assert.equal(g.pivotXU + g.outgoingVxUnits[route] * g.guidedTicks, cup.centerXU);
        assert.equal(g.pivotYU + 20 * g.guidedTicks, cup.planeYU);
      }
    }
  }
});
test('creates, configuration arrays and snapshots are detached', () => {
  const a = Model.create(), b = Model.create(), before = copy(b);
  a.physics.tickHz = 1; a.gates[0].outgoingVxUnits.outer = 0; a.cups[0].contributionsG[0] = 10; a.emitPeriodsTicks[0] = 1;
  assert.deepEqual(b, before); const snapshot = copy(b); snapshot.sourcePositionsU[0].xU = 0; assert.equal(b.sourcePositionsU[0].xU, 3000);
});
test('dt zero and malformed active dt do not consume input or mutate any field', () => {
  const s = Model.create(), before = copy(s);
  assert.equal(Model.step(s, 0, { b: true, cancelEpoch: 9 }), s); assert.deepEqual(s, before);
  for (const dt of [NaN, Infinity, -DT, DT * 2, '0.016666666666666666', null, DT + 2e-12]) {
    assert.throws(() => Model.step(s, dt, { b: true }), RangeError); assert.deepEqual(s, before);
  }
  Model.step(s, DT + 5e-13, {}); assert.equal(s.tick, 1); assert.equal(s.elapsed, DT);
});
test('locateCup uses half-open edges for every cup including the rightmost one', () => {
  for (let d = 0; d < 3; d++) for (const c of Model.create(1, d).cups) {
    assert.equal(Model.locateCup(d, c.leftU), c.id); assert.equal(Model.locateCup(d, c.rightU - 1), c.id);
    assert.equal(Model.locateCup(d, c.leftU - 1), null); assert.equal(Model.locateCup(d, c.rightU), null);
    assert.equal(Model.locateCup(d, c.centerXU), c.id);
  }
  assert.equal(Model.locateCup(0, Number.MIN_SAFE_INTEGER), null); assert.equal(Model.locateCup(0, Number.MAX_SAFE_INTEGER), null);
});
test('locateCup rejects noninteger coordinates and invalid difficulty without normalization', () => {
  for (const difficulty of [-1, 3, .5, '0', null, true, NaN, Infinity]) assert.throws(() => Model.locateCup(difficulty, 1800), RangeError);
  for (const xU of [1.1, '1800', null, true, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => Model.locateCup(0, xU), RangeError);
});
test('opening emits left then right and new packets advance immediately from actual source receipts', () => {
  const s = Model.create(); step(s, { b: true });
  assert.deepEqual(s.emittedBySource, [1, 1]); assert.equal(s.sourceAgeTicks, 1); assert.equal(s.reservoirMassG, 358);
  assert.deepEqual(s.packets.map(p => p.id), [1, 2]); assert.deepEqual(s.lastInterval.advancedPacketIds, [1, 2]);
  assert.deepEqual(s.lastInterval.source.emittedPacketIds, [1, 2]);
  for (const [i, p] of s.packets.entries()) {
    assert.equal(p.yU, s.sourcePositionsU[i].yU + 20); assert.equal(p.route, null); assert.equal(p.vxU, 0);
    assert.deepEqual(s.flowReceipts[i].position, s.sourcePositionsU[i]); assert.equal(p.bornAtTick, 1);
  }
  assert.deepEqual(s.events.map(e => e.type), ['command', 'flow', 'flow']);
});
test('closing before emission suppresses an eligible phase while all existing packets still move', () => {
  const s = Model.create(); step(s, { b: true }); ticks(s, 11); const positions = s.packets.map(p => p.yU);
  assert.equal(s.sourceAgeTicks, 12); step(s, { b: true });
  assert.equal(s.sourceOpen, false); assert.equal(s.sourceAgeTicks, 12); assert.deepEqual(s.emittedBySource, [1, 1]);
  assert.deepEqual(s.packets.map(p => p.yU), positions.map(y => y + 20)); assert.deepEqual(s.lastInterval.emitFlowIds, []);
});
test('closed source age at emission phase is not replayed and reopening resumes without catch-up', () => {
  const s = Model.create(); step(s, { b: true }); step(s); step(s, { b: true }); const age = s.sourceAgeTicks;
  ticks(s, 20); assert.equal(s.sourceAgeTicks, age); assert.deepEqual(s.emittedBySource, [1, 1]);
  step(s, { b: true }); assert.equal(s.sourceAgeTicks, 3); assert.deepEqual(s.emittedBySource, [1, 1]);
  ticks(s, 10); assert.equal(s.sourceAgeTicks, 13); assert.deepEqual(s.emittedBySource, [2, 2]);
  const phase = Model.create(); phase.sourceAgeTicks = 1; ticks(phase, 12); assert.equal(phase.sourceAgeTicks, 1); assert.equal(phase.packets.length, 0);
});
test('a final shared gram is consumed only by the first eligible source', () => {
  const s = fixture(Model.create(), [], [100, 140, 119]); step(s, { b: true });
  assert.equal(s.reservoirMassG, 0); assert.deepEqual(s.lastInterval.source.emittedPacketIds, [360]);
  assert.equal(s.packets.length, 1); assert.equal(s.packets[0].sourceIndex, 0); assert.equal(s.inventory.errorG, 0);
});
test('unequal outlet periods count actual open source age and retain unique sequential IDs', () => {
  const s = Model.create(1, 1); step(s, { b: true }); ticks(s, 60);
  assert.equal(s.sourceAgeTicks, 61); assert.deepEqual(s.emittedBySource, [6, 5]);
  const emits = s.flowReceipts.filter(r => r.kind === 'emit'); assert.deepEqual(emits.map(r => r.packetId), Array.from({ length: 11 }, (_, n) => n + 1));
  assert.deepEqual(emits.filter(r => r.sourceIndex === 1).map(r => r.sourceAgeTicks), [1, 16, 31, 46, 61]);
});
test('empty source can still toggle but never restores mass or advances source age', () => {
  const s = lastGram(); s.packets[0].yU -= 20; s.sourceAgeTicks = 77; step(s, { b: true });
  assert.equal(s.phase, 'playing'); assert.equal(s.commandCount, 1); assert.equal(s.sourceOpen, true);
  assert.equal(s.reservoirMassG, 0); assert.equal(s.sourceAgeTicks, 77); assert.deepEqual(s.lastInterval.emitFlowIds, []);
});
test('source packets stay unassigned until their own actual gate contact across all levels', () => {
  for (let d = 0; d < 3; d++) {
    const s = Model.create(1, d); step(s, { b: true }); step(s); step(s, { b: true });
    const firstId = [1, 2];
    for (let t = s.tick; t < Math.max(...s.gates.map(g => g.fallTicks)); t++) {
      for (const source of [0, 1]) {
        const p = s.packets.find(p => p.id === firstId[source]);
        if (s.tick < s.gates[source].fallTicks) { assert.equal(p.route, null); assert.equal(p.stage, 'fall'); }
      }
      step(s);
    }
    for (const source of [0, 1]) {
      const c = s.flowReceipts.find(r => r.kind === 'contact' && r.packetId === firstId[source]);
      assert.equal(c.tick, s.gates[source].fallTicks); assert.equal(c.gateId, s.gates[source].id);
      assert.deepEqual(c.position, { xU: s.gates[source].pivotXU, yU: s.gates[source].pivotYU });
    }
  }
});
test('same-tick A rotation is sampled at contact without an extra guided movement', () => {
  const s = Model.create(); fixture(s, [falling(s)]); step(s, { a: true }); const p = s.packets[0];
  assert.equal(p.route, 'center'); assert.equal(p.contactTick, 1); assert.equal(p.xU, 3000); assert.equal(p.yU, 2200);
  assert.equal(p.vxU, 18); assert.deepEqual(s.lastInterval.gatesBefore, ['outer', 'outer']); assert.deepEqual(s.lastInterval.gatesAfterInput, ['center', 'outer']);
  assert.equal(s.flowReceipts[0].routeBefore, null); assert.equal(s.flowReceipts[0].routeAfter, 'center');
});
test('a later gate rotation changes neither an already locked route nor its actual velocity', () => {
  const s = Model.create(); fixture(s, [falling(s)]); step(s, { a: true }); step(s); const before = copy(s.packets[0]); step(s, { a: true });
  assert.equal(s.gates[0].mode, 'outer'); assert.equal(s.packets[0].route, 'center'); assert.equal(s.packets[0].vxU, 18);
  assert.equal(s.packets[0].xU, before.xU + 18); assert.equal(s.packets[0].yU, before.yU + 20);
  assert.equal(s.deflectionCount, 1); assert.equal(s.packets[0].contactTick, 1);
});
test('all published actual guided paths land on cup centers with no hidden travel timer', () => {
  for (let d = 0; d < 3; d++) for (const source of [0, 1]) for (const route of ['outer', 'center']) {
    const s = Model.create(1, d), g = s.gates[source]; g.mode = route; g.angleRad = Math.atan2(20, g.outgoingVxUnits[route]);
    fixture(s, [falling(s, source)]); step(s); ticks(s, g.guidedTicks - 1);
    assert.equal(s.capturedCount, 0); assert.equal(s.packets[0].yU, s.cups[0].planeYU - 20); step(s);
    const r = s.flowReceipts.at(-1), cup = s.cups.find(c => c.id === (route === 'center' ? 'center' : g.outerCupId));
    assert.equal(r.kind, 'capture'); assert.equal(r.cupId, cup.id); assert.equal(r.position.xU, cup.centerXU); assert.equal(cup.massG, 1);
    assert.equal(s.inventory.errorG, 0); assert.equal(s.inventory.bySource[source].capturedG, 1);
  }
});
test('capture classifies actual cup-plane x rather than the retained route label', () => {
  const s = Model.create(); fixture(s, [arriving(s, 0, 1, s.cups[0].leftU, 'center')]); step(s);
  assert.equal(s.cups[0].massG, 1); assert.equal(s.cups[1].massG, 0); assert.equal(s.flowReceipts[0].route, 'center');
  assert.equal(s.flowReceipts[0].cupId, 'left'); assert.equal(s.flowReceipts[0].position.xU, s.cups[0].leftU);
});
test('two actual center arrivals accumulate separately by packet ID and source', () => {
  const s = Model.create(); fixture(s, [arriving(s, 1, 2, 4800), arriving(s, 0, 1, 4800)]); step(s);
  assert.deepEqual(s.lastInterval.advancedPacketIds, [1, 2]); assert.equal(s.cups[1].massG, 2); assert.deepEqual(s.cups[1].contributionsG, [1, 1]);
  assert.deepEqual(s.flowReceipts.map(r => [r.packetId, r.cupBeforeG, r.cupAfterG]), [[1, 0, 1], [2, 1, 2]]);
});
test('one remaining central gram of capacity captures lower ID and spills the second without clipping', () => {
  const s = Model.create(); fixture(s, [arriving(s, 1, 145, 4800), arriving(s, 0, 144, 4800)], [0, 143, 0]); step(s);
  assert.equal(s.cups[1].massG, 144); assert.equal(s.cups[1].full, true); assert.equal(s.spillMassG, 1); assert.equal(s.packets.length, 0);
  assert.deepEqual(s.flowReceipts.map(r => [r.kind, r.packetId]), [['capture', 144], ['spill', 145]]);
  assert.equal(s.flowReceipts[1].cupBeforeG, 144); assert.equal(s.flowReceipts[1].cupAfterG, 144); assert.equal(s.flowReceipts[1].massToCupG, 0);
  assert.equal(s.lostReason, 'overflow'); assert.equal(s.inventory.errorG, 0); assert.equal(s.inventory.bySource[1].spilledG, 1);
});
test('filling a cup exactly to capacity alone is legal until another actual packet arrives', () => {
  const s = Model.create(); fixture(s, [arriving(s, 0, 104, 1800, 'outer')], [103, 0, 0]); step(s);
  assert.equal(s.phase, 'playing'); assert.equal(s.cups[0].full, true); assert.equal(s.spillMassG, 0); assert.equal(s.capturedCount, 104);
});
test('the entire interval completes even after the first overflow or missed-cup event', () => {
  const s = Model.create(); fixture(s, [arriving(s, 0, 105, 1800, 'outer'), arriving(s, 1, 106, 7800, 'outer'), arriving(s, 0, 107, 9000)], [104, 0, 0]); step(s);
  assert.equal(s.cups[2].massG, 1); assert.equal(s.spillMassG, 2); assert.equal(s.packets.length, 0);
  assert.deepEqual(s.lastInterval.advancedPacketIds, [105, 106, 107]); assert.equal(s.lastInterval.captureFlowIds.length, 1); assert.equal(s.lastInterval.spillFlowIds.length, 2);
  assert.deepEqual(s.failures.map(f => f.kind), ['overflow', 'missed-cup']); assert.equal(s.inventory.errorG, 0);
});
test('rightmost right edge falls outside and missed-cup receipts keep null cup facts', () => {
  const s = Model.create(); fixture(s, [arriving(s, 1, 1, s.cups[2].rightU, 'outer')]); step(s); const r = s.flowReceipts[0];
  assert.equal(s.lostReason, 'missed-cup'); assert.equal(r.cupId, null); assert.equal(r.cupBeforeG, null); assert.equal(r.cupAfterG, null);
  assert.equal(r.massToSpillG, 1); assert.equal(s.inventory.capturedMassG, 0); assert.deepEqual(s.failures[0].packetIds, [1]);
});
test('temporarily satisfying all three target windows does not end a nonempty world', () => {
  const s = fixture(Model.create(), [], [96, 136, 116]); step(s);
  assert.equal(s.cups.every(c => c.withinTarget), true); assert.equal(s.reservoirMassG, 12); assert.equal(s.phase, 'playing');
  const airborne = lastGram(); airborne.cups[0].massG = 100; airborne.cups[0].contributionsG[0] = 100;
  fixture(airborne, [arriving(airborne, 1, 360, 7800, 'outer')], [100, 140, 119]); airborne.packets[0].yU -= 20; step(airborne);
  assert.equal(airborne.reservoirMassG, 0); assert.equal(airborne.packets.length, 1); assert.equal(airborne.phase, 'playing');
});
test('real final capture drains the world and scores actual deviation without synthetic credit', () => {
  const s = lastGram(); step(s); assert.equal(s.phase, 'won'); assert.equal(s.packets.length, 0); assert.equal(s.reservoirMassG, 0);
  assert.deepEqual(s.cups.map(c => c.massG), [101, 139, 120]); assert.equal(s.score, 1000 + 2 * Math.floor(3599 / 60) + 90);
  assert.equal(s.lastInterval.terminal.phase, 'won'); assert.equal(s.events.at(-1).type, 'win');
});
test('shortfall is checked only on true empty reservoir and flight, with cup-order facts', () => {
  const s = fixture(Model.create(), [], [104, 144, 112]); step(s);
  assert.equal(s.lostReason, 'shortfall'); assert.equal(s.failures.length, 1); assert.deepEqual(s.failures[0].cupIds, ['right']);
  assert.equal(s.failures[0].actualValue, 112); assert.equal(s.failures[0].limitValue, 116); assert.equal(s.failures[0].unit, 'g');
});
test('failure categories remain ordered after all flows, deadline beats simultaneous drained success', () => {
  const tie = lastGram(); tie.deadlineTick = 1; step(tie); assert.equal(tie.lostReason, 'deadline'); assert.equal(tie.capturedCount, 360); assert.equal(tie.score, 0);
  const s = Model.create(); fixture(s, [arriving(s, 0, 359, 9000), arriving(s, 1, 360, 1800)], [104, 140, 114]); s.deadlineTick = 1; step(s);
  assert.deepEqual(s.failures.map(f => f.kind), ['overflow', 'missed-cup', 'deadline', 'shortfall']);
  assert.deepEqual(s.failures[0].packetIds, [360]); assert.deepEqual(s.failures[1].packetIds, [359]); assert.equal(s.inventory.errorG, 0);
});
test('direction ages are 1,24,36 with clamped attempts and exact neutral threshold', () => {
  const s = Model.create(); step(s, { x: .45 }); assert.equal(s.inputState.navigationHeldTicks, 0);
  step(s, { x: 1 }); assert.equal(s.cursor, 1); ticks(s, 22, { x: 1 }); assert.equal(s.lastInput.navigationAttempt, null);
  step(s, { x: 1 }); assert.equal(s.lastInput.navigationAttempt.heldTicks, 24); assert.equal(s.lastInput.navigationAttempt.beforeCursor, 1);
  assert.equal(s.lastInput.navigationAttempt.afterCursor, 1); assert.equal(s.navigationCount, 1);
  ticks(s, 12, { x: 1 }); assert.equal(s.lastInput.navigationAttempt.heldTicks, 36);
  step(s, { x: -1 }); assert.equal(s.cursor, 0); assert.equal(s.inputState.navigationHeldTicks, 1);
  step(s, { x: -.45 }); assert.equal(s.inputState.navigationHeldTicks, 0);
});
test('fresh B consumes A and navigation opportunity while the real direction age continues', () => {
  const s = Model.create(); step(s, { x: 1, aPressed: true, bPressed: true });
  assert.equal(s.cursor, 0); assert.equal(s.commandCount, 1); assert.equal(s.sourceOpen, true); assert.equal(s.gates[0].mode, 'outer');
  assert.equal(s.lastInput.navigationSuppressed, true); assert.equal(s.lastInput.navigationAttempt, null);
  ticks(s, 22, { x: 1, aPressed: true, bPressed: true }); assert.equal(s.cursor, 0); assert.equal(s.commandCount, 1);
  step(s, { x: 1, a: true, b: true }); assert.equal(s.cursor, 1); assert.equal(s.commandCount, 1);
});
test('navigation precedes A and pressed-only pulses need an actual false sample to rearm', () => {
  const s = Model.create(); step(s, { x: 1, aPressed: true });
  assert.equal(s.gates[1].mode, 'center'); assert.equal(s.commandReceipts[0].gateId, 'right'); assert.equal(s.gates[0].mode, 'outer');
  ticks(s, 3, { aPressed: true }); assert.equal(s.commandCount, 1); step(s); step(s, { aPressed: true });
  assert.equal(s.commandCount, 2); assert.equal(s.gates[1].mode, 'outer'); assert.equal(s.lastOperation.inputKey, 'a');
});
test('cancel and changed epoch quarantine inputs but keep real sand motion and source activity', () => {
  const s = Model.create(); step(s, { b: true }); const y = s.packets[0].yU;
  step(s, { a: true, b: true, x: 1, cancelEpoch: 2 }); assert.equal(s.inputState.quarantined, true); assert.equal(s.cursor, 0);
  assert.equal(s.sourceOpen, true); assert.equal(s.sourceAgeTicks, 2); assert.equal(s.packets[0].yU, y + 20); assert.equal(s.commandCount, 1);
  step(s, { cancelled: true, cancelEpoch: 2 }); assert.equal(s.inputState.quarantined, true);
  step(s, { x: 1, cancelEpoch: 2 }); assert.equal(s.cursor, 0);
  step(s, { y: 1, cancelEpoch: 2 }); assert.equal(s.lastInput.quarantineReleased, true); assert.equal(s.commandCount, 1);
  step(s, { a: true, cancelEpoch: 2 }); assert.equal(s.gates[0].mode, 'center');
});
test('input normalization and input-state snapshots distinguish raw cancellation from effective epoch change', () => {
  const s = Model.create();
  for (const x of [NaN, Infinity, '1', true]) { step(s, { x, cancelled: 'true', cancelEpoch: -1 }); assert.equal(s.lastInput.sample.x, 0); assert.equal(s.lastInput.cancelled, false); }
  step(s, { cancelEpoch: 5 }); assert.equal(s.lastInput.sample.cancelled, false); assert.equal(s.lastInput.cancelled, true);
  assert.equal(s.lastInput.before.cancelEpoch, 0); assert.equal(s.lastInput.after.cancelEpoch, 5); assert.equal('sourceOpen' in s.lastInput.before, false);
  step(s, { cancelEpoch: 5 }); step(s, { cancelEpoch: 4, b: true }); assert.equal(s.inputState.quarantined, true);
  step(s, { cancelEpoch: 4.1 }); assert.equal(s.lastInput.sample.cancelEpoch, 4); assert.equal(s.inputState.cancelEpoch, 4);
});
test('permanent receipts stay detached, no-event intervals retain lastEvent and IDs link real events', () => {
  const s = Model.create(); step(s, { a: true }); const op = copy(s.commandReceipts[0]), event = copy(s.lastEvent);
  step(s); assert.deepEqual(s.events, []); assert.deepEqual(s.lastEvent, event); step(s, { a: true });
  assert.deepEqual(s.commandReceipts[0], op); assert.equal(op.before.gateModes[0], 'outer'); assert.equal(op.after.gateModes[0], 'center');
  step(s); step(s, { b: true }); const emit = copy(s.flowReceipts[0]); ticks(s, 60);
  assert.deepEqual(s.flowReceipts[0], emit); assert.equal(emit.position.yU, 1000);
  const receipts = [...s.commandReceipts, ...s.navigationReceipts, ...s.flowReceipts];
  assert.equal(new Set(receipts.map(r => r.eventSeq)).size, receipts.length); for (const r of receipts) assert.equal(r.tick, r.fromTick + 1);
});
test('terminal states freeze everything before dt validation and retry restores original world', () => {
  const won = lastGram(); step(won); const lost = Model.create(); lost.deadlineTick = 1; step(lost);
  for (const s of [won, lost]) { const before = copy(s); for (const dt of [0, DT, NaN, Infinity]) { assert.equal(Model.step(s, dt, { b: true, a: true, x: 1, cancelEpoch: 9 }), s); assert.deepEqual(s, before); } }
  const fresh = Model.create(); assert.equal(fresh.tick, 0); assert.equal(fresh.sourceOpen, false); assert.equal(fresh.sourceAgeTicks, 0);
  assert.equal(fresh.reservoirMassG, 360); assert.deepEqual(fresh.packets, []); assert.equal(fresh.eventCount, 0); assert.equal(fresh.inventory.errorG, 0);
});
test('noninteger motion, skipped surfaces, fall drift and duplicate contact are explicit invariant errors', () => {
  const variants = [p => { p.xU += .5; }, p => { p.xU += 1; }, p => { p.yU += 1; }, p => { p.contactTick = 1; }, p => { p.route = 'center'; }];
  for (const mutate of variants) { const s = Model.create(), p = falling(s); mutate(p); fixture(s, [p]); assert.throws(() => step(s), /Invalid|skipped/); }
  const guided = Model.create(), p = arriving(guided, 0, 1, 4800); p.yU++; fixture(guided, [p]); assert.throws(() => step(guided), /skipped/);
});
