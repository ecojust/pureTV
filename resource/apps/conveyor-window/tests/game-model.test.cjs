'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60, SEED = 734;
const clone = value => JSON.parse(JSON.stringify(value));
const mod = (value, period) => ((value % period) + period) % period;
const part = (s, id) => s.parts.find(row => row.id === id);
const advance = (s, input = {}) => Model.step(s, DT, input);

// FORMAL SYNTHETIC BOUNDARIES ONLY: not authored layouts, ordinary rounds or
// solution routes. Clone create and place one current boundary without replaying
// its earlier history. Recalibrate public initialX to that boundary, keep owner
// coordinates/generations and gate/preview coherent, and explicitly arm input.
// Counter seeds and any window/deadline changes are stated in each test. Only
// real step calls below create receipts, wrapping, faults and terminal outcomes.
function sourceAt(s, index, x) {
  const row = s.sourceCarriers[index]; row.x = x;
  s.scenario.sourceCarriers[index].initialX = mod(x - s.scenario.sourceVelocity * s.tick, 720);
}
function slotAt(s, index, x) {
  const row = s.targetSlots[index]; row.x = x;
  s.scenario.targetSlots[index].initialX = mod(x - s.scenario.targetVelocity * s.tick, 720);
}
function sync(s) {
  s.elapsed = s.tick / 60;
  const cfg = s.scenario.gate, phase = mod(s.tick + cfg.phaseOffsetTicks, cfg.periodTicks);
  s.gate = { tick: s.tick, phaseTick: phase, open: phase >= cfg.openFromPhaseTick && phase < cfg.openUntilPhaseTick,
    windowXRange: [...s.scenario.windowXRange] };
  for (const p of s.parts) {
    const owner = p.owner === 'source' ? s.sourceCarriers.find(row => row.id === p.ownerId)
      : p.owner === 'slot' ? s.targetSlots.find(row => row.id === p.ownerId) : p.owner === 'held' ? s.gripper : null;
    if (owner) { p.x = owner.x; p.y = owner.y; p.ownerGeneration = p.owner === 'held' ? null : owner.generation; }
  }
  const nearest = rows => [...rows].sort((a, b) => Math.abs(a.x - s.gripper.x) - Math.abs(b.x - s.gripper.x) || a.id.localeCompare(b.id))[0];
  const a = nearest(s.sourceCarriers.filter(row => row.partId !== null)), b = nearest(s.targetSlots);
  const near = row => ({ id: row.id, generation: row.generation, x: row.x, distance: Math.abs(row.x - s.gripper.x), inReach: Math.abs(row.x - s.gripper.x) <= 60 });
  s.preview = { tick: s.tick, gripperX: s.gripper.x, heldPartId: s.gripper.heldPartId, gateOpen: s.gate.open,
    windowFits: s.gripper.x - 18 >= s.scenario.windowXRange[0] && s.gripper.x + 18 <= s.scenario.windowXRange[1],
    nearestSource: a ? { ...near(a), partId: a.partId } : null,
    nearestSlot: b ? { ...near(b), occupantPartId: b.occupantPartId, requiredType: b.requiredType, requiredQuarterTurns: b.requiredQuarterTurns } : null };
  return s;
}
function fixture({ difficulty = 0, tick = 120, x = 360 } = {}) {
  const s = clone(Model.create(SEED, difficulty)); s.tick = tick; s.gripper.x = x;
  s.inputState = { cancelEpoch: null, quarantined: false, aArmed: true, bArmed: true };
  const positions = [360, 600, 100, 200];
  s.sourceCarriers.forEach((row, i) => sourceAt(s, i, positions[i]));
  s.targetSlots.forEach((row, i) => slotAt(s, i, positions[i]));
  return sync(s);
}
function hold(s, quarterTurns = 1) {
  const source = s.sourceCarriers[0], p = part(s, source.partId); source.partId = null;
  Object.assign(p, { owner: 'held', ownerId: 'gripper', ownerGeneration: null, quarterTurns });
  s.gripper.heldPartId = p.id; sync(s); return p.id;
}
function occupy(s, slotIndex = 0, sourceIndex = 1) {
  const source = s.sourceCarriers[sourceIndex], slot = s.targetSlots[slotIndex], p = part(s, source.partId);
  source.partId = null; slot.occupantPartId = p.id;
  // A valid occupied synthetic socket: its already seated part matches its key.
  slot.requiredType = s.scenario.targetSlots[slotIndex].requiredType = p.type;
  p.quarterTurns = slot.requiredQuarterTurns;
  Object.assign(p, { owner: 'slot', ownerId: slot.id, ownerGeneration: slot.generation });
  sync(s); return p.id;
}
function inventory(s) {
  assert.equal(new Set(s.parts.map(p => p.id)).size, s.parts.length);
  const refs = [...s.sourceCarriers.map(row => row.partId), s.gripper.heldPartId, ...s.targetSlots.map(row => row.occupantPartId)].filter(id => id !== null);
  assert.equal(new Set(refs).size, refs.length);
  for (const p of s.parts) {
    assert.ok(['source', 'held', 'slot', 'completed', 'retired', 'damaged'].includes(p.owner));
    const active = ['source', 'held', 'slot'].includes(p.owner);
    assert.equal(refs.filter(id => id === p.id).length, Number(active));
    if (active) {
      const owner = p.owner === 'held' ? s.gripper : (p.owner === 'source' ? s.sourceCarriers : s.targetSlots).find(row => row.id === p.ownerId);
      assert.ok(owner); assert.deepEqual([p.x, p.y], [owner.x, owner.y]);
      assert.equal(p.ownerGeneration, p.owner === 'held' ? null : owner.generation);
      assert.equal(p.endedTick, null); assert.equal(p.endReason, null);
    } else { assert.equal(p.ownerId, null); assert.equal(p.ownerGeneration, null); assert.ok(Number.isInteger(p.endedTick)); }
  }
  assert.equal(s.parts.filter(p => p.owner === 'held').length, Number(s.gripper.heldPartId !== null));
  for (const bank of [s.actionReceipts, s.wrapReceipts]) assert.deepEqual(bank.map(row => row.id), bank.map((_, i) => i + 1));
}
function deepFrozen(value) {
  if (value && typeof value === 'object') { assert.ok(Object.isFrozen(value)); Object.values(value).forEach(deepFrozen); }
}

test('create validates its domain, exposes independent initial inventories and the authored three scenarios', () => {
  const defaults = Model.create(); assert.deepEqual(defaults, Model.create(SEED, 0));
  assert.equal(defaults.width, 960); assert.equal(defaults.height, 540); assert.equal(defaults.gripper.x, 360);
  for (const [difficulty, count, required, deadline] of [[0, 2, 6, 5040], [1, 3, 6, 5400], [2, 4, 5, 5400]]) {
    const s = Model.create(SEED, difficulty);
    assert.equal(s.level, difficulty + 1); assert.equal(s.requiredStreak, required); assert.equal(s.deadlineTick, deadline);
    assert.equal(s.sourceCarriers.length, count); assert.equal(s.targetSlots.length, count); assert.equal(s.parts.length, count);
    assert.deepEqual([s.phase, s.tick, s.elapsed, s.streak, s.totalCorrect, s.faults, s.score], ['playing', 0, 0, 0, 0, 0, 0]);
    assert.equal(s.gripper.heldPartId, null); assert.equal(s.terminal, null); assert.equal(s.lastInput, null); assert.equal(s.lastAction, null); assert.equal(s.lastStep, null);
    assert.deepEqual(s.actionReceipts, []); assert.deepEqual(s.wrapReceipts, []);
    assert.deepEqual(s.inputState, { cancelEpoch: null, quarantined: true, aArmed: false, bArmed: false }); inventory(s);
    for (const value of [s.identity, s.scenario, s.physics, s.partTypes]) deepFrozen(value);
  }
  for (const seed of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '734', null]) assert.throws(() => Model.create(seed, 0), RangeError);
  for (const level of [-1, 3, 0.5, NaN, '0', null]) assert.throws(() => Model.create(SEED, level), RangeError);
  assert.equal(Model.create(0, 2).seed, 0); assert.equal(Model.create(Number.MAX_SAFE_INTEGER, 1).seed, Number.MAX_SAFE_INTEGER);
  const other = Model.create(); advance(defaults, {}); assert.equal(other.tick, 0); assert.equal(other.sourceCarriers[0].x, 180);
});

test('active invalid dt throws before mutation; dt zero is a complete no-op', () => {
  const s = Model.create(), before = clone(s), unread = new Proxy({}, { get() { throw Error('input must not be read'); } });
  Model.step(s, 0, unread); assert.deepEqual(s, before);
  for (const dt of [-DT, NaN, Infinity, 1 / 30, DT + 2e-12, undefined, null, '0']) {
    assert.throws(() => Model.step(s, dt, { a: true }), RangeError); assert.deepEqual(s, before);
  }
  Model.step(s, DT + 0.5e-12, {}); assert.equal(s.tick, 1); assert.equal(s.elapsed, DT);
});

test('gate endpoints judge the action at the current tick, then publish the next gate after one interval', () => {
  for (const [tick, isOpen, nextOpen] of [[119, false, true], [120, true, true], [239, true, false], [240, false, false]]) {
    const s = fixture({ tick }); hold(s); const beforeGate = clone(s.gate), fromX = s.targetSlots[0].x;
    assert.equal(s.gate.open, isOpen); assert.equal(s.preview.gateOpen, isOpen);
    advance(s, { a: true }); const r = s.actionReceipts[0];
    assert.deepEqual(r.gateAtAction, beforeGate); assert.equal(r.result, isOpen ? 'seated' : 'shutter_closed');
    assert.equal(r.boundaryTick, tick); assert.equal(s.tick, tick + 1); assert.equal(s.gate.open, nextOpen); assert.equal(s.preview.gateOpen, nextOpen);
    assert.equal(s.targetSlots[0].x, fromX + 1); assert.deepEqual(s.lastStep.gateBefore, beforeGate); assert.deepEqual(s.lastStep.gateAfter, s.gate); inventory(s);
  }
});

test('held B then A rotates before matching and preserves both immediate action snapshots', () => {
  const s = fixture(), id = hold(s, 0), oldSlot = clone(s.targetSlots[0]);
  advance(s, { aPressed: true, bPressed: true, x: 1 });
  assert.deepEqual(s.actionReceipts.map(r => [r.action, r.result]), [['rotate', 'rotated'], ['grab_or_dispatch', 'seated']]);
  const [b, a] = s.actionReceipts;
  assert.deepEqual([b.partBefore.quarterTurns, b.partAfter.quarterTurns, a.partBefore.quarterTurns], [0, 1, 1]);
  assert.equal(b.sourceAtAction, null); assert.equal(b.slotAtAction, null); assert.deepEqual(a.slotAtAction, oldSlot);
  assert.equal(a.partAfter.owner, 'slot'); assert.equal(a.partAfter.ownerGeneration, oldSlot.generation);
  assert.deepEqual([a.partAfter.x, a.partAfter.y], [360, 270]); assert.deepEqual([part(s, id).x, part(s, id).y], [361, 270]);
  assert.equal(s.gripper.x, 364); assert.equal(s.gripper.heldPartId, null); assert.deepEqual([s.streak, s.totalCorrect, s.faults], [1, 1, 0]); inventory(s);
});

test('empty B then A cannot rotate the newly grabbed part; grab uses old gripper x', () => {
  const s = fixture(); part(s, s.sourceCarriers[0].partId).quarterTurns = 2; const oldSource = clone(s.sourceCarriers[0]);
  advance(s, { b: true, a: true, x: -1 }); const [b, a] = s.actionReceipts;
  assert.equal(b.result, 'empty_rotate'); assert.deepEqual([b.partId, b.partBefore, b.partAfter], [null, null, null]);
  assert.equal(a.result, 'grabbed'); assert.deepEqual(a.sourceAtAction, oldSource); assert.equal(a.slotAtAction, null);
  assert.equal(a.partAfter.quarterTurns, 2); assert.equal(a.partAfter.x, 360); assert.equal(part(s, a.partId).x, 356);
  assert.equal(s.sourceCarriers[0].partId, null); assert.equal(s.faults, 0); inventory(s);
});

test('pickup chooses a true nearest source with inclusive reach, deterministic ties and harmless outside miss', () => {
  const tie = fixture(); sourceAt(tie, 0, 300); sourceAt(tie, 1, 420); sync(tie);
  advance(tie, { a: true }); assert.equal(tie.lastAction.result, 'grabbed'); assert.equal(tie.lastAction.sourceAtAction.id, 'source-a'); inventory(tie);
  const outside = fixture(); sourceAt(outside, 0, 421); sync(outside); advance(outside, { a: true, x: 1 });
  assert.equal(outside.lastAction.result, 'empty_grab'); assert.equal(outside.lastAction.sourceAtAction.x, 421);
  assert.deepEqual([outside.lastAction.partId, outside.lastAction.partBefore, outside.lastAction.partAfter], [null, null, null]);
  assert.equal(outside.gripper.x, 364); assert.equal(outside.gripper.heldPartId, null); assert.equal(outside.faults, 0); inventory(outside);
});

test('full-footprint window and magnetic placement limits are inclusive on both sides', () => {
  for (const x of [258, 462]) {
    const s = fixture({ x }); hold(s); slotAt(s, 0, x + (x === 258 ? 60 : -60)); sync(s);
    advance(s, { a: true }); assert.equal(s.lastAction.result, 'seated'); assert.equal(s.totalCorrect, 1); inventory(s);
  }
});

test('all six dispatch faults follow priority, damage exactly one part and reset only the streak', () => {
  const rows = [
    ['shutter_closed', s => { s.gripper.x = 36; slotAt(s, 0, 600); }],
    ['outside_window', s => { s.gripper.x = 257; slotAt(s, 0, 500); }],
    ['no_slot_in_reach', s => { slotAt(s, 0, 421); }],
    ['occupied_slot', s => { occupy(s); }],
    ['wrong_type', s => { s.targetSlots[0].requiredType = s.scenario.targetSlots[0].requiredType = 'arrow'; }],
    ['wrong_orientation', () => {}]
  ];
  for (const [reason, arrange] of rows) {
    const s = fixture({ tick: reason === 'shutter_closed' ? 119 : 120 }), id = hold(s, 0); arrange(s);
    // Synthetic prior counters only: no fabricated earlier action receipts.
    s.streak = s.totalCorrect = 2; s.faults = 1; s.score = 200; sync(s);
    const oldSlots = clone(s.targetSlots), t = s.tick, x = s.gripper.x;
    advance(s, { a: true }); const r = s.actionReceipts.at(-1), p = part(s, id);
    assert.equal(r.result, reason); assert.deepEqual([s.streak, s.totalCorrect, s.faults, s.score], [0, 2, 2, 200]);
    assert.equal(s.actionReceipts.length, 1); assert.equal(s.gripper.heldPartId, null); assert.equal(p.owner, 'damaged');
    assert.equal(p.endedTick, t); assert.equal(p.endReason, reason); assert.deepEqual([p.x, p.y], [x, 150]);
    assert.equal(s.tick, t + 1); assert.deepEqual(s.targetSlots.map(row => row.occupantPartId), oldSlots.map(row => row.occupantPartId));
    assert.deepEqual(r.partAfter, p); inventory(s);
  }
});

test('nearest occupied slot is not skipped for a farther matching empty slot', () => {
  const s = fixture(), id = hold(s), occupied = occupy(s); slotAt(s, 1, 400);
  s.targetSlots[1].requiredType = s.scenario.targetSlots[1].requiredType = 'elbow';
  s.targetSlots[1].requiredQuarterTurns = s.scenario.targetSlots[1].requiredQuarterTurns = 1; sync(s);
  advance(s, { a: true }); assert.equal(s.lastAction.result, 'occupied_slot'); assert.equal(s.lastAction.slotAtAction.id, 'slot-a');
  assert.equal(s.targetSlots[0].occupantPartId, occupied); assert.equal(s.targetSlots[1].occupantPartId, null); assert.equal(part(s, id).owner, 'damaged'); inventory(s);
});

test('a held old generation survives source wrap and follows only the moving gripper', () => {
  const s = fixture(), id = hold(s); sourceAt(s, 0, 718); sync(s); advance(s, { x: -1 });
  const wrap = s.wrapReceipts.find(r => r.carrierId === 'source-a');
  assert.deepEqual([wrap.fromX, wrap.rawToX, wrap.toX, wrap.fromGeneration, wrap.toGeneration], [718, 720, 0, 0, 1]);
  assert.equal(wrap.exitedPartId, null); assert.equal(wrap.newPartId, 'source-a@1'); assert.equal(s.gripper.heldPartId, id);
  assert.deepEqual([part(s, id).x, part(s, id).y, part(s, id).owner], [356, 150, 'held']);
  assert.equal(part(s, 'source-a@1').createdTick, 121); assert.equal(part(s, 'source-a@1').x, 0); inventory(s);
});

test('a just-grabbed source part survives that same interval exit and replacement', () => {
  const s = fixture({ x: 684 }); sourceAt(s, 0, 718); sync(s); const id = s.sourceCarriers[0].partId;
  advance(s, { a: true, x: -1 }); assert.equal(s.lastAction.result, 'grabbed'); assert.equal(s.lastAction.partAfter.x, 684);
  assert.equal(s.lastAction.sourceAtAction.partId, id); assert.equal(s.wrapReceipts[0].exitedPartId, null);
  assert.equal(s.wrapReceipts[0].newPartId, 'source-a@1'); assert.equal(s.sourceCarriers[0].partId, 'source-a@1');
  assert.deepEqual([part(s, id).owner, part(s, id).x], ['held', 680]); inventory(s);
});

test('just-seated target exit completes once after input; simultaneous source refill cannot retire that part', () => {
  const s = fixture({ x: 684 }), id = hold(s); sourceAt(s, 0, 718); slotAt(s, 0, 719);
  // Synthetic widened divider admits the boundary at the physical belt exit.
  s.scenario.windowXRange = [0, 720]; sync(s); advance(s, { a: true });
  assert.equal(s.lastAction.result, 'seated'); assert.equal(s.lastAction.slotAtAction.occupantPartId, null);
  assert.deepEqual([s.lastAction.partAfter.owner, s.lastAction.partAfter.x], ['slot', 719]);
  assert.deepEqual(s.wrapReceipts.map(r => [r.belt, r.carrierId]), [['source', 'source-a'], ['target', 'slot-a']]);
  assert.equal(s.wrapReceipts[0].exitedPartId, null); assert.equal(s.wrapReceipts[1].exitedPartId, id); assert.equal(s.wrapReceipts[1].newPartId, null);
  assert.deepEqual([part(s, id).owner, part(s, id).endedTick, part(s, id).x, part(s, id).endReason], ['completed', 121, 720, 'target_exit']);
  assert.equal(s.targetSlots[0].occupantPartId, null); assert.equal(s.targetSlots[0].generation, 1);
  assert.deepEqual([s.streak, s.totalCorrect, s.score], [1, 1, 100]); inventory(s);
  advance(s, {}); assert.deepEqual([s.streak, s.totalCorrect, s.score, s.actionReceipts.length, s.wrapReceipts.length], [1, 1, 100, 1, 2]); inventory(s);
});

test('negative wrap departs x zero, while arriving exactly at zero does not wrap', () => {
  const s = fixture({ difficulty: 1 }); sourceAt(s, 0, 0); sourceAt(s, 1, 2); sync(s); const old = s.sourceCarriers[0].partId;
  advance(s, {}); assert.equal(s.sourceCarriers[0].x, 718); assert.equal(s.sourceCarriers[0].generation, 1);
  assert.equal(s.sourceCarriers[1].x, 0); assert.equal(s.sourceCarriers[1].generation, 0);
  assert.deepEqual([part(s, old).owner, part(s, old).x, part(s, old).endedTick], ['retired', 0, 121]);
  assert.equal(s.wrapReceipts.length, 1); assert.equal(s.wrapReceipts[0].rawToX, -2); assert.equal(s.wrapReceipts[0].newPartId, 'source-a@1'); inventory(s);
  const t = fixture({ difficulty: 2 }); slotAt(t, 0, 0); const seated = occupy(t, 0, 0);
  // Synthetic one-prior-seat counters; the exit must not award it a second time.
  t.streak = t.totalCorrect = 1; t.score = 100; sync(t); advance(t, {});
  assert.equal(t.targetSlots[0].x, 719); assert.equal(t.targetSlots[0].generation, 1); assert.equal(t.targetSlots[0].occupantPartId, null);
  assert.deepEqual([part(t, seated).owner, part(t, seated).x, part(t, seated).endedTick], ['completed', 0, 121]);
  assert.deepEqual([t.totalCorrect, t.streak, t.score], [1, 1, 100]); inventory(t);
});

test('unpicked positive source exit retires once and supplies one fresh authored replacement', () => {
  const s = fixture(); sourceAt(s, 0, 719); sync(s); const id = s.sourceCarriers[0].partId, count = s.parts.length;
  advance(s, {}); const p = part(s, 'source-a@1');
  assert.equal(s.parts.length, count + 1); assert.deepEqual([part(s, id).owner, part(s, id).x, part(s, id).endReason], ['retired', 720, 'source_exit']);
  assert.deepEqual([p.createdTick, p.birthGeneration, p.owner, p.x, p.quarterTurns], [121, 1, 'source', 1, 0]); inventory(s);
  advance(s, {}); assert.equal(s.parts.length, count + 1); assert.equal(s.wrapReceipts.length, 1); inventory(s);
});

test('final seating wins on the deadline only after a real interval, before deadline loss', () => {
  const s = fixture({ tick: 5039 }), id = hold(s);
  // Synthetic prior correct count and phase offset; no prior route is asserted.
  s.streak = s.totalCorrect = s.requiredStreak - 1; s.score = 100 * s.totalCorrect; s.faults = 2;
  s.scenario.gate.phaseOffsetTicks = mod(120 - s.tick, s.scenario.gate.periodTicks); sync(s);
  advance(s, { a: true, x: 1 });
  assert.equal(s.tick, 5040); assert.equal(s.elapsed, 84); assert.equal(s.phase, 'won'); assert.equal(s.lostReason, null); assert.equal(s.score, 1700);
  assert.deepEqual(s.terminal, { reason: 'required_streak', actionBoundaryTick: 5039, endedTick: 5040 });
  assert.deepEqual([s.lastStep.fromTick, s.lastStep.toTick, s.lastStep.allowedVelocityX, s.gripper.x, part(s, id).x], [5039, 5040, 4, 364, 361]);
  assert.deepEqual(s.lastStep.terminalAfter, s.terminal); assert.deepEqual(s.lastStep.actionReceiptIds, [1]); inventory(s);
});

test('third dispatch fault still advances belts and outranks the same deadline; passive deadline has no action boundary', () => {
  const s = fixture({ tick: 5039 }), id = hold(s); s.faults = 2; s.streak = s.totalCorrect = 2; s.score = 200;
  advance(s, { a: true, x: -1 }); assert.equal(s.lastAction.result, 'shutter_closed');
  assert.equal(s.tick, 5040); assert.equal(s.targetSlots[0].x, 361); assert.equal(s.gripper.x, 356);
  assert.equal(part(s, id).endedTick, 5039); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'fault_limit'); assert.equal(s.score, 200);
  assert.deepEqual(s.terminal, { reason: 'fault_limit', actionBoundaryTick: 5039, endedTick: 5040 }); inventory(s);
  const passive = fixture({ tick: 5039 }); advance(passive, {});
  assert.deepEqual(passive.terminal, { reason: 'deadline', actionBoundaryTick: null, endedTick: 5040 }); assert.equal(passive.lastAction, null);
  const frozen = clone(s), unread = new Proxy({}, { get() { throw Error('terminal input must not be read'); } });
  for (const dt of [0, DT, NaN, -1]) { Model.step(s, dt, unread); assert.deepEqual(s, frozen); }
});

test('held and pressed flags share edge latches; neutral rearms rotation and quarter turns wrap', () => {
  const s = fixture(), id = hold(s, 3); advance(s, { b: true }); assert.equal(part(s, id).quarterTurns, 0);
  advance(s, { bPressed: true }); assert.equal(s.actionReceipts.length, 1); assert.equal(s.lastAction, null);
  advance(s, {}); advance(s, { bPressed: true }); assert.equal(part(s, id).quarterTurns, 1); assert.equal(s.actionReceipts.length, 2);
  const a = fixture(); advance(a, { a: true }); const heldId = a.gripper.heldPartId;
  advance(a, { aPressed: true }); assert.equal(a.gripper.heldPartId, heldId); assert.equal(a.actionReceipts.length, 1);
  advance(a, {}); advance(a, { aPressed: true }); assert.equal(a.actionReceipts.length, 2); assert.equal(a.lastInput.freshA, true); inventory(a);
});

test('cancellation and changed epoch suppress all controls until a later complete real neutral, without stopping belts', () => {
  const fresh = Model.create(); advance(fresh, { a: true, b: true, x: 1 });
  assert.equal(fresh.actionReceipts.length, 0); assert.equal(fresh.gripper.x, 360); assert.equal(fresh.sourceCarriers[0].x, 182);
  advance(fresh, {}); assert.equal(fresh.lastInput.neutralAcknowledged, true); assert.equal(fresh.inputState.quarantined, false);
  const s = fixture(), id = hold(s, 0), x = s.gripper.x, sourceX = s.sourceCarriers[1].x;
  advance(s, { cancelled: true, x: 1, a: true, b: true });
  assert.equal(s.actionReceipts.length, 0); assert.equal(s.gripper.x, x); assert.equal(s.sourceCarriers[1].x, sourceX + 2); assert.equal(s.inputState.quarantined, true);
  advance(s, { cancelled: true }); assert.equal(s.inputState.quarantined, true);
  advance(s, { y: 0.55 }); assert.equal(s.inputState.quarantined, true);
  advance(s, { aPressed: true }); assert.equal(s.inputState.quarantined, true);
  advance(s, { x: 0.54, y: -0.54 }); assert.equal(s.inputState.quarantined, false); assert.equal(s.lastInput.neutralAcknowledged, true);
  assert.equal(s.gripper.x, x); assert.equal(s.actionReceipts.length, 0);
  advance(s, { b: true }); assert.equal(part(s, id).quarterTurns, 1);
  advance(s, { cancelEpoch: 7, b: true, x: 1 }); assert.equal(s.lastInput.epochChanged, true); assert.equal(s.inputState.quarantined, true); assert.equal(s.gripper.x, x);
  advance(s, { cancelEpoch: 7 }); assert.equal(s.inputState.quarantined, false);
  advance(s, { cancelEpoch: Infinity, b: true }); assert.equal(s.inputState.cancelEpoch, 7); assert.equal(s.lastInput.rawCancelEpoch, null); assert.equal(part(s, id).quarterTurns, 2); inventory(s);
});

test('literal flags and inclusive horizontal thresholds normalize predictably; y never moves the gripper', () => {
  const s = fixture({ x: 682 }); advance(s, { x: 5, y: Infinity, a: 1, bPressed: 'true' });
  assert.equal(s.gripper.x, 684); assert.equal(s.lastInput.x, 1); assert.equal(s.lastInput.rawY, null); assert.equal(s.actionReceipts.length, 0);
  advance(s, { x: -0.55, y: 1 }); assert.equal(s.gripper.x, 680); assert.equal(s.lastInput.axisX, -1); assert.equal(s.lastInput.axisY, 1);
  advance(s, { x: 0.55 }); assert.equal(s.gripper.x, 684);
  advance(s, { x: NaN, y: -1 }); assert.equal(s.gripper.x, 684); assert.equal(s.lastInput.rawX, null); assert.equal(s.lastInput.velocityX, 0);
  const left = fixture({ x: 38 }); advance(left, { x: -1 }); assert.equal(left.gripper.x, 36);
});

test('receipts and lastStep are deeply immutable and detached from later current ownership and motion', () => {
  const s = fixture(); advance(s, { a: true, x: 1 }); const receipt = s.actionReceipts[0], step = s.lastStep;
  const savedReceipt = clone(receipt), savedStep = clone(step), id = receipt.partId;
  deepFrozen(receipt); deepFrozen(step); assert.notStrictEqual(receipt.partAfter, part(s, id)); assert.notStrictEqual(receipt.sourceAtAction, s.sourceCarriers[0]);
  advance(s, {}); advance(s, { b: true, x: -1 });
  assert.deepEqual(receipt, savedReceipt); assert.deepEqual(step, savedStep); assert.notStrictEqual(s.lastStep, step);
  assert.notEqual(part(s, id).quarterTurns, receipt.partAfter.quarterTurns); inventory(s);
  const w = fixture(); sourceAt(w, 0, 719); sync(w); advance(w, {}); const wrap = w.wrapReceipts[0], savedWrap = clone(wrap);
  deepFrozen(wrap); advance(w, {}); assert.deepEqual(wrap, savedWrap);
  const retry = Model.create(SEED, 0); assert.deepEqual(retry, Model.create(SEED, 0)); assert.equal(retry.parts.length, 2); assert.equal(retry.actionReceipts.length, 0);
});
