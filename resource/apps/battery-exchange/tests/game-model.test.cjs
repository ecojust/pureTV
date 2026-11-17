'use strict';
// These are synthetic rule-boundary fixtures, not complete ordinary routes.
// No design-author witness, scheduler, browser pilot, or route search is used.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60;
const copy = value => JSON.parse(JSON.stringify(value));
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const tick = (s, input = {}) => Model.step(s, DT, input);
function advance(s, count, input = {}) {
  const before = s.tick;
  for (let i = 0; i < count; i++) tick(s, input);
  assert.equal(s.tick, before + count, 'fixture must actually commit every requested tick');
}
function fixtureAt(fromTick = 361, difficulty = 0) {
  const s = Model.create(528, difficulty);
  // Deliberate isolated boundary placement; this is not claimed as normal input.
  s.tick = fromTick;
  return s;
}
function poweredFixture(stageIndex = 0) {
  const s = Model.create(528, 0);
  s.tick = s.loads[0].stages[stageIndex].startTick + 1;
  // A one-interval circuit fixture: 1Ω+3Ω series and 2Ω||2Ω parallel.
  s.slots = ['C1', 'C5', 'C2', 'C3', 'C4', 'C6'];
  s.topologies = ['series', stageIndex === 2 ? 'series' : 'parallel'];
  return s;
}
function setStageWork(s, row, index, value) {
  // Synthetic work-boundary counter setup; no ordinary completion is implied.
  const load = s.loads[row], stage = load.stages[index];
  stage.workJ = value; stage.deficitJ = Math.max(0, stage.targetWorkJ - value);
  stage.deliveredEnergyJ = value; load.deliveredEnergyJ = value; load.creditedWorkJ = value;
}
function exhaustCell(s, index, remaining) {
  s.cells[index].remainingChargeC = remaining;
  s.cells[index].consumedChargeC = s.cells[index].initialChargeC - remaining;
}
function cell(id, resistanceOhm = 1, voltageV = 12) { return { id, resistanceOhm, voltageV }; }
function circuit(topology, cells, loadResistanceOhm = 6) { return Model.solveCircuit({ topology, cells, loadResistanceOhm }); }

test('authored three-level parameters match the public contract and creates are detached', () => {
  const text = fs.readFileSync(path.join(__dirname, '../docs/model-contract.md'), 'utf8');
  const match = text.match(/<!-- BATTERY_PARAMETERS_BEGIN -->\s*```json\s*([\s\S]*?)```\s*<!-- BATTERY_PARAMETERS_END -->/);
  assert.ok(match); const parameters = JSON.parse(match[1]);
  for (let difficulty = 0; difficulty < 3; difficulty++) {
    const s = Model.create(528, difficulty), authored = parameters.levels[difficulty];
    assert.equal(s.level, authored.level); assert.equal(s.closeTick, authored.closeTick);
    assert.deepEqual(s.slots, authored.initialSlots); assert.deepEqual(s.topologies, authored.initialTopologies);
    assert.deepEqual(s.cells.map(c => c.initialChargeC), authored.initialChargeC);
    assert.deepEqual(s.cells.map(c => c.resistanceOhm), parameters.cells.map(c => c.resistanceOhm));
    for (const [key, value] of Object.entries(s.physics)) assert.equal(value, parameters.simulation[key], key);
    assert.deepEqual(s.schedule.filter(x => x.kind === 'window').map(x => [x.startTick, x.endTick]), authored.windows);
    assert.equal(s.schedule.some(x => Object.hasOwn(x, 'remainingTicks')), false);
    for (let row = 0; row < 2; row++) for (let index = 0; index < 3; index++) {
      const actual = s.loads[row].stages[index], wanted = authored.stages[index];
      assert.equal(actual.startTick, wanted.startTick); assert.equal(actual.endTick, wanted.endTick);
      assert.equal(actual.requirementId, wanted.requirements[row]);
      for (const [key, value] of Object.entries(authored.requirements[actual.requirementId])) assert.equal(actual[key], value);
      assert.equal(actual.workJ, 0); assert.equal(actual.deficitJ, actual.targetWorkJ);
    }
    assert.equal(s.controlsOpen, true); assert.equal(s.viewSegment.remainingTicks, 360);
    assert.equal(s.nextSegment.kind, 'supply'); assert.equal(s.lastInterval, null);
  }
  const a = Model.create(528, 0), b = Model.create(528, 0), unchanged = copy(b);
  a.cells[0].remainingChargeC = -1; a.loads[0].stages[0].targetWorkJ = -1; a.physics.tickHz = -1;
  a.schedule[1].requirements[0].targetWorkJ = -1; a.slots.reverse();
  assert.deepEqual(b, unchanged); assert.deepEqual(Model.create(528, 0), unchanged);
});

test('creation normalizes numeric metadata without coercing other types or randomizing levels', () => {
  const a = Model.create(-1.9, 2.9); assert.equal(a.seed, 0xffffffff); assert.equal(a.difficulty, 2);
  assert.equal(Model.create(Infinity, NaN).seed, 528); assert.equal(Model.create(null, '2').difficulty, 0);
  assert.equal(Model.create('12', false).seed, 528); assert.equal(Model.create(1, -4).difficulty, 0);
  assert.equal(Model.create(1, 12).difficulty, 2);
  const b = Model.create(123, 1), c = Model.create(987, 1); b.seed = c.seed;
  assert.deepEqual(b, c); assert.equal(Object.isFrozen(Model), true);
});

test('empty and one-cell circuits have finite JSON output and agree across topologies', () => {
  for (const topology of ['series', 'parallel']) {
    const empty = circuit(topology, []);
    assert.equal(empty.connected, false); assert.equal(empty.internalResistanceOhm, null);
    assert.equal(empty.parallelConductanceS, null); assert.deepEqual(empty.branches, []);
    for (const key of ['currentA', 'terminalVoltageV', 'loadPowerW', 'sourcePowerW', 'internalHeatPowerW']) assert.equal(empty[key], 0);
    const one = circuit(topology, [cell('fixture', 2)]);
    assert.equal(one.currentA, 1.5); assert.equal(one.terminalVoltageV, 9);
    assert.equal(one.loadPowerW, 13.5); assert.equal(one.sourcePowerW, 18); assert.equal(one.internalHeatPowerW, 4.5);
    assert.equal(one.powerBalanceErrorW, 0); assert.equal(one.branches[0].currentA, 1.5);
    assert.deepEqual(copy(one), one);
  }
});

test('series and inverse-resistance parallel splits obey independent hand-calculated energy identities', () => {
  const cells = [cell('A', 1), cell('B', 3)], before = copy(cells);
  const series = circuit('series', cells), parallel = circuit('parallel', cells);
  near(series.currentA, 12 / 5); near(series.loadPowerW, 864 / 25);
  near(series.sourcePowerW, 288 / 5); near(series.internalHeatPowerW, 576 / 25);
  assert.equal(series.branches[0].currentA, series.branches[1].currentA);
  near(parallel.internalResistanceOhm, 3 / 4); near(parallel.currentA, 16 / 9);
  near(parallel.branches[0].currentA, 4 / 3); near(parallel.branches[1].currentA, 4 / 9);
  near(parallel.loadPowerW, 512 / 27); near(parallel.sourcePowerW, 64 / 3);
  near(parallel.internalHeatPowerW, 64 / 27); near(parallel.powerBalanceErrorW, 0);
  assert.deepEqual(cells, before); series.cellIds[0] = 'other'; series.branches[0].voltageV = -1;
  assert.deepEqual(cells, before);
});

test('invalid circuits including finite values whose sum overflows are rejected without mutation', () => {
  const invalid = [undefined, {}, { topology: 'series', loadResistanceOhm: 6, cells: null },
    { topology: 'unknown', loadResistanceOhm: 6, cells: [] },
    { topology: 'series', loadResistanceOhm: 0, cells: [] },
    { topology: 'series', loadResistanceOhm: 6, cells: [cell('A'), cell('B'), cell('C')] },
    { topology: 'series', loadResistanceOhm: 6, cells: [cell('A'), cell('A')] },
    { topology: 'series', loadResistanceOhm: 6, cells: [cell('')] },
    { topology: 'series', loadResistanceOhm: 6, cells: [null] },
    { topology: 'series', loadResistanceOhm: 6, cells: [cell('A', -1)] },
    { topology: 'parallel', loadResistanceOhm: 6, cells: [cell('A', 1, 12), cell('B', 1, 13)] },
    { topology: 'series', loadResistanceOhm: 1.4e308, cells: [cell('A', 1.4e308)] },
    { topology: 'series', loadResistanceOhm: 6, cells: [cell('A', 1, 1e308), cell('B', 1, 1e308)] }];
  for (const value of invalid) {
    const before = value === undefined ? undefined : copy(value);
    assert.throws(() => Model.solveCircuit(value), RangeError); assert.deepEqual(value, before);
  }
  for (const value of [NaN, Infinity, -Infinity, '1', null]) {
    assert.throws(() => circuit('series', [cell('A', value)]), RangeError);
    assert.throws(() => circuit('series', [cell('A', 1, value)]), RangeError);
  }
});

test('zero dt consumes nothing and invalid active dt rejects before changing any state', () => {
  const s = Model.create(528, 0), before = copy(s);
  assert.equal(Model.step(s, 0, { a: true, cancelEpoch: 5 }), s); assert.deepEqual(s, before);
  for (const dt of [-DT, 1 / 120, 1 / 30, NaN, Infinity, null, '0.0166667']) {
    assert.throws(() => Model.step(s, dt, { a: true }), RangeError); assert.deepEqual(s, before);
  }
  Model.step(s, DT + 5e-13, {}); assert.equal(s.tick, 1); assert.equal(s.elapsed, DT);
});

test('marking keeps the cell in place and an atomic swap preserves identity, charge and heat history', () => {
  const s = Model.create(528, 0); s.cells[0].consumedChargeC = 1.25; s.cells[0].remainingChargeC -= 1.25;
  s.cells[0].temperatureC = 30; s.cells[0].generatedHeatJ = 48;
  const ids = s.slots.slice().sort(); tick(s, { a: true });
  assert.equal(s.sourceSlot, 0); assert.deepEqual(s.slots.slice().sort(), ids); assert.equal(s.slots[0], 'C1');
  tick(s); tick(s, { x: 1, a: true });
  assert.equal(s.swapCount, 1); assert.equal(s.sourceSlot, null); assert.deepEqual(s.slots.slice().sort(), ids);
  assert.equal(s.slots[0], 'C2'); assert.equal(s.slots[1], 'C1'); assert.equal(s.cells[0].slot, 1);
  assert.equal(s.cells[0].consumedChargeC, 1.25); assert.equal(s.cells[0].remainingChargeC, 52.75);
  assert.ok(s.cells[0].temperatureC < 30 && s.cells[0].temperatureC > 29);
  assert.equal(s.cells[0].generatedHeatJ, 48); assert.ok(s.cells[0].removedHeatJ > 0);
  const swap = s.commandReceipts[1]; assert.equal(swap.action, 'swap'); assert.deepEqual(swap.cellIds, ['C1', 'C2']);
  assert.equal(swap.before.sourceSlot, 0); assert.equal(swap.after.sourceSlot, null);
  assert.equal(swap.fromTick, 2); assert.equal(swap.tick, 3);
});

test('same-slot A and marked-source B cancel without rewiring or input quarantine', () => {
  const s = Model.create(528, 0), initial = s.slots.slice();
  tick(s, { a: true }); tick(s); tick(s, { a: true });
  assert.equal(s.commandReceipts[1].action, 'cancel-mark-same-slot'); assert.equal(s.sourceSlot, null);
  tick(s); tick(s, { a: true }); tick(s, { b: true });
  assert.equal(s.commandReceipts[3].action, 'cancel-mark-b'); assert.equal(s.markCancelCount, 2);
  assert.deepEqual(s.slots, initial); assert.deepEqual(s.topologies, ['series', 'parallel']);
  assert.equal(s.inputState.quarantined, false); assert.equal(s.automaticMarkClearCount, 0);
});

test('navigation uses 1,21,31 held ticks, clamped neighbours, axis ties and fresh direction changes', () => {
  const s = Model.create(528, 0);
  tick(s, { x: 1, b: true }); assert.equal(s.cursor, 0); assert.equal(s.inputState.navigationHeldTicks, 1);
  advance(s, 19, { x: 1 }); assert.equal(s.cursor, 0); assert.equal(s.inputState.navigationHeldTicks, 20);
  tick(s, { x: 1 }); assert.equal(s.cursor, 1); assert.equal(s.navigationReceipts[0].heldTicks, 21);
  advance(s, 9, { x: 1 }); assert.equal(s.cursor, 1); tick(s, { x: 1 }); assert.equal(s.cursor, 2);
  tick(s, { x: -1 }); assert.equal(s.cursor, 1); assert.equal(s.inputState.navigationHeldTicks, 1);
  tick(s); tick(s, { x: 1, y: 1 }); assert.equal(s.cursor, 2); // Exact tie is horizontal.
  const count = s.navigationCount; tick(s); tick(s, { x: 1 }); assert.equal(s.cursor, 2); assert.equal(s.navigationCount, count);
  tick(s, { x: 0.25, y: -0.25 }); assert.equal(s.inputState.navigationHeldTicks, 0);
});

test('fresh B consumes simultaneous A and navigation while unopposed navigation precedes A', () => {
  const s = Model.create(528, 0); tick(s, { x: 1, a: true, b: true });
  assert.equal(s.cursor, 0); assert.equal(s.sourceSlot, null); assert.equal(s.topologies[0], 'parallel');
  tick(s, { x: 1, a: true }); assert.equal(s.sourceSlot, null); assert.equal(s.commandCount, 1);
  tick(s); tick(s, { x: 1, a: true }); assert.equal(s.cursor, 1); assert.equal(s.sourceSlot, 1);
  tick(s, { y: 1, b: true }); assert.equal(s.cursor, 1); assert.equal(s.sourceSlot, null);
  assert.equal(s.commandReceipts.at(-1).action, 'cancel-mark-b'); assert.equal(s.topologyChangeCount, 1);
  tick(s); tick(s, { x: 1 }); assert.equal(s.cursor, 2); tick(s, { b: true });
  assert.equal(s.commandReceipts.at(-1).row, 0); // Spare column still belongs to row 0.
});

test('held actions and short pressed-only pulses act once until a real release', () => {
  const s = Model.create(528, 0); tick(s, { a: true }); advance(s, 8, { a: true });
  assert.equal(s.commandCount, 1); tick(s); tick(s, { aPressed: true });
  assert.equal(s.commandCount, 2); assert.equal(s.sourceSlot, null);
  tick(s, { aPressed: true }); assert.equal(s.commandCount, 2);
  tick(s); tick(s, { aPressed: true }); assert.equal(s.commandCount, 3); assert.equal(s.sourceSlot, 0);
});

test('malformed axes and cancellation epochs do not coerce into movement or synthetic cancellation', () => {
  const s = Model.create(528, 0); tick(s, { x: Infinity, y: true, cancelEpoch: '3' });
  assert.equal(s.cursor, 0); assert.equal(s.inputState.cancelEpoch, 0); assert.equal(s.lastInput.cancellation, false);
  tick(s, { x: 2, y: 1 }); assert.equal(s.cursor, 1); assert.equal(s.lastInput.sampled.x, 1);
  tick(s, { cancelEpoch: 2 }); assert.equal(s.inputState.quarantined, true);
  tick(s, { cancelEpoch: 1 }); assert.equal(s.lastInput.cancellation, true); assert.equal(s.inputState.cancelEpoch, 1);
  tick(s, { cancelEpoch: Infinity }); assert.equal(s.inputState.cancelEpoch, 1); assert.equal(s.inputState.quarantined, false);
  assert.doesNotThrow(() => tick(s, null)); assert.doesNotThrow(() => tick(s, 12));
});

test('runtime cancellation clears a mark separately and requires all real controls neutral before rearming', () => {
  const s = Model.create(528, 0); tick(s, { a: true }); tick(s, { a: true, cancelEpoch: 1 });
  assert.equal(s.sourceSlot, null); assert.equal(s.commandCount, 1); assert.equal(s.automaticMarkClearCount, 1);
  assert.equal(s.automaticMarkClearReceipts[0].reason, 'runtime-cancel'); assert.equal(s.inputState.quarantined, true);
  tick(s, { a: true, cancelEpoch: 1 }); assert.equal(s.commandCount, 1);
  tick(s, { cancelled: true, cancelEpoch: 1 }); assert.equal(s.inputState.quarantined, true);
  tick(s, { x: 1, cancelEpoch: 1 }); assert.equal(s.cursor, 0); assert.equal(s.inputState.quarantined, true);
  tick(s, { cancelEpoch: 1 }); assert.equal(s.inputState.quarantined, false); assert.equal(s.lastInput.quarantineCleared, true);
  tick(s, { a: true, cancelEpoch: 1 }); assert.equal(s.commandCount, 2); assert.equal(s.sourceSlot, 0);
});

test('last off-window input is legal at 359 but the poststate view at 360 is supply', () => {
  const s = fixtureAt(359); s.sourceSlot = 0; s.cursor = 1; tick(s, { a: true });
  assert.equal(s.swapCount, 1); assert.equal(s.tick, 360); assert.equal(s.controlsOpen, false);
  assert.equal(s.lastInterval.segment.kind, 'window'); assert.equal(s.lastInterval.segment.remainingTicks, 1);
  assert.equal(s.viewSegment.kind, 'supply'); assert.equal(s.commandReceipts[0].fromTick, 359);
  assert.equal(s.commandReceipts[0].windowIndex, 0); assert.equal(s.lastInterval.cells.every(c => c.currentA === 0), true);
});

test('first supply tick clears a source before runtime cancellation and never double-clears it', () => {
  const s = fixtureAt(359); tick(s, { a: true }); assert.equal(s.sourceSlot, 0);
  tick(s, { a: true, b: true, cancelEpoch: 1 });
  assert.equal(s.sourceSlot, null); assert.equal(s.automaticMarkClearCount, 1);
  assert.equal(s.automaticMarkClearReceipts[0].reason, 'window-close'); assert.equal(s.commandCount, 1);
  assert.equal(s.inputState.quarantined, true); assert.equal(s.stageStartReceipts.length, 1);
  assert.equal(s.stageStartReceipts[0].fromTick, 360); assert.equal(s.stageStartReceipts[0].tick, 361);
});

test('supply-time rewiring is blocked once per fresh press while physical delivery continues', () => {
  const s = fixtureAt(), before = s.slots.slice(), topology = s.topologies.slice();
  tick(s, { x: 1, a: true, b: true }); assert.equal(s.blockedCommands, 1); assert.equal(s.commandCount, 0);
  assert.equal(s.cursor, 0); assert.deepEqual(s.slots, before); assert.deepEqual(s.topologies, topology);
  assert.equal(s.blockedReceipts[0].action, 'toggle-topology'); assert.deepEqual(s.blockedReceipts[0].before, s.blockedReceipts[0].after);
  assert.ok(s.cells[0].consumedChargeC > 0); tick(s, { a: true, b: true }); assert.equal(s.blockedCommands, 1);
  tick(s); tick(s, { a: true }); assert.equal(s.blockedCommands, 2); assert.equal(s.sourceSlot, null);
});

test('actual fixed intervals conserve charge and source/load/internal energy without counting load heat twice', () => {
  const s = poweredFixture(); advance(s, 120);
  assert.equal(s.phase, 'playing'); near(s.cells[0].consumedChargeC, 4.8); near(s.cells[4].consumedChargeC, 4.8);
  near(s.cells[2].consumedChargeC, 12 / 7); near(s.cells[3].consumedChargeC, 12 / 7);
  assert.equal(s.cells[1].consumedChargeC, 0); assert.equal(s.cells[5].consumedChargeC, 0);
  near(s.chargeLedger.errorC, 0); near(s.electricalLedger.errorJ, 0);
  for (const c of s.cells) { near(c.initialChargeC, c.consumedChargeC + c.remainingChargeC); near(c.heatBalanceErrorJ, 0); }
  for (const load of s.loads) { near(load.workPartitionErrorJ, 0); near(load.heatBalanceErrorJ, 0); near(load.generatedHeatJ, load.deliveredEnergyJ * 0.3); }
  near(s.electricalLedger.sourceEnergyJ, s.electricalLedger.deliveredEnergyJ + s.electricalLedger.internalHeatJ);
  assert.equal(s.lastInterval.cells[1].currentA, 0); near(s.loads[0].lastElectrical.terminalVoltageV, 14.4);
});

test('passive thermal decay follows physical ticks for spare cells and disconnected loads', () => {
  const s = Model.create(528, 0); s.cells[4].temperatureC = 34; s.cells[4].generatedHeatJ = 80;
  s.loads[0].temperatureC = 34; s.loads[0].generatedHeatJ = 150;
  advance(s, 60);
  near(s.cells[4].temperatureC, 24 + 10 * (1 - 0.3 / 480) ** 60);
  near(s.loads[0].temperatureC, 24 + 10 * (1 - 0.35 / 900) ** 60);
  near(s.cells[4].heatBalanceErrorJ, 0); near(s.loads[0].heatBalanceErrorJ, 0);
  assert.equal(s.cells[4].slot, 2); assert.equal(s.cells[4].loadId, null);
  assert.equal(s.cells[4].consumedChargeC, 0); assert.equal(s.loads[0].lastElectrical.circuit, null);
  assert.equal(s.loads[0].lastElectrical.powerInBand, null); assert.equal(s.lastInterval.loads[0].requested, false);
});

test('finishing consumes a full interval, partitions overflow and disconnects only on the next interval', () => {
  const s = poweredFixture(), stage = s.loads[0].stages[0]; setStageWork(s, 0, 0, stage.targetWorkJ - 0.1);
  const charge = s.cells[0].remainingChargeC; tick(s);
  assert.equal(s.workCompletionReceipts.length, 1); const r = s.workCompletionReceipts[0];
  near(r.creditedWorkJ, 0.1); near(r.deliveredEnergyJ, 0.576); near(r.overflowEnergyJ, 0.476);
  near(charge - s.cells[0].remainingChargeC, 0.04); assert.equal(r.disconnectFromTick, s.tick);
  assert.equal(s.loads[0].lastElectrical.connected, true); assert.equal(s.lastInterval.loads[0].completedNow, true);
  const consumed = s.cells[0].consumedChargeC; tick(s);
  assert.equal(s.cells[0].consumedChargeC, consumed); assert.equal(s.loads[0].lastElectrical.connected, false);
  assert.equal(s.loads[0].lastElectrical.disconnectReason, 'stage-complete'); assert.equal(s.workCompletionReceipts.length, 1);
  near(s.loads[0].workPartitionErrorJ, 0);
});

test('work completion tolerance keeps the true tiny deficit and never invents credited joules', () => {
  const s = poweredFixture(), target = s.loads[0].stages[0].targetWorkJ;
  setStageWork(s, 0, 0, target - 0.576 - 5e-9); const before = s.loads[0].creditedWorkJ;
  tick(s); const stage = s.loads[0].stages[0], r = s.workCompletionReceipts[0];
  assert.ok(stage.deficitJ > 0 && stage.deficitJ <= 1e-8); assert.ok(stage.workJ < target);
  near(s.loads[0].creditedWorkJ - before, 0.576, 1e-12); assert.equal(r.overflowEnergyJ, 0); assert.equal(r.deficitJ, stage.deficitJ);
  tick(s); assert.equal(s.loads[0].lastElectrical.connected, false); assert.equal(s.loads[0].stages[0].deficitJ, stage.deficitJ);
});

test('the 75th consecutive bad supply interval faults after delivering all of its real energy', () => {
  const s = fixtureAt(); advance(s, 74);
  assert.equal(s.phase, 'playing'); assert.equal(s.loads[0].consecutiveBadPowerTicks, 74); assert.equal(s.loads[0].stages[0].workJ, 0);
  tick(s); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'power-fault'); assert.equal(s.loads[0].consecutiveBadPowerTicks, 75);
  near(s.loads[0].deliveredEnergyJ, 67.5); near(s.loads[0].outOfBandEnergyJ, 67.5); near(s.loads[0].workPartitionErrorJ, 0);
  assert.equal(s.failures[0].actualValue, 75); assert.equal(s.failures[0].unit, 'ticks'); assert.equal(s.lastInterval.loads[0].deliveredEnergyJ, 0.9);
});

test('a good requested interval resets the consecutive fault counter without erasing bad history', () => {
  const s = poweredFixture(); s.loads[0].consecutiveBadPowerTicks = 74;
  s.loads[0].stages[0].badIntervals = 74; s.loads[0].stages[0].peakBadPowerTicks = 74;
  tick(s); assert.equal(s.loads[0].consecutiveBadPowerTicks, 0); assert.equal(s.loads[0].stages[0].badIntervals, 74);
  assert.equal(s.loads[0].stages[0].peakBadPowerTicks, 74); assert.equal(s.loads[0].stages[0].goodIntervals, 1);
  s.topologies[0] = 'parallel'; // Explicit second boundary fixture: a bad power interval follows a good one.
  const work = s.loads[0].stages[0].workJ; tick(s);
  assert.equal(s.loads[0].consecutiveBadPowerTicks, 1); assert.equal(s.loads[0].stages[0].workJ, work);
});

test('inclusive power bands use their stated absolute tolerance rather than display rounding', () => {
  for (const [offset, accepted] of [[0.5e-9, true], [2e-9, false]]) {
    const s = poweredFixture(); const stage = s.loads[0].stages[0];
    stage.minimumPowerW = 34.56 + offset; stage.maximumPowerW = 40; tick(s);
    assert.equal(s.loads[0].lastElectrical.powerInBand, accepted);
    assert.equal(s.loads[0].consecutiveBadPowerTicks, accepted ? 0 : 1);
    assert.equal(s.loads[0].stages[0].workJ > 0, accepted);
  }
});

test('pre-supply empty-charge guard preserves non-reset fault counters and still passively cools', () => {
  const s = fixtureAt(); exhaustCell(s, 0, 0); s.cells[0].temperatureC = 30; s.cells[0].generatedHeatJ = 48;
  s.loads[0].temperatureC = 30; s.loads[0].generatedHeatJ = 90; s.loads[0].consecutiveBadPowerTicks = 74;
  s.loads[1].consecutiveBadPowerTicks = 74; setStageWork(s, 1, 0, s.loads[1].stages[0].targetWorkJ);
  tick(s); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'cell-charge');
  assert.equal(s.loads[0].consecutiveBadPowerTicks, 74); assert.equal(s.loads[1].consecutiveBadPowerTicks, 0);
  assert.equal(s.failures.some(x => x.kind === 'power-fault'), false); assert.deepEqual(s.lastInterval.preSupplyChargeFailureCellIds, ['C1']);
  assert.equal(s.lastInterval.cells.every(c => c.currentA === 0 && c.generatedHeatJ === 0 && c.sourceEnergyJ === 0), true);
  assert.ok(s.cells[0].temperatureC < 30); assert.ok(s.loads[0].temperatureC < 30);
  assert.equal(s.loads[0].lastElectrical.circuit, null); assert.equal(s.loads[0].lastElectrical.powerInBand, null);
  assert.equal(s.loads[0].lastElectrical.disconnectReason, 'pre-supply-charge-failure');
  const newStage = fixtureAt(360); exhaustCell(newStage, 0, 0); newStage.loads[0].consecutiveBadPowerTicks = 74; tick(newStage);
  assert.equal(newStage.loads[0].consecutiveBadPowerTicks, 0); assert.equal(newStage.stageStartReceipts.length, 1);
  const window = fixtureAt(100); exhaustCell(window, 0, 0); window.loads[0].consecutiveBadPowerTicks = 74; tick(window);
  assert.equal(window.loads[0].consecutiveBadPowerTicks, 0);
});

test('exact temperature-limit comparison loses after active heat has been accounted', () => {
  const s = poweredFixture();
  // Synthetic threshold fixture: the limit equals the analytically known first step from ambient.
  // This isolates >= semantics from floating-point back-solving an initial temperature.
  s.physics.cellMaximumTemperatureC = 24 + (5.76 / 60) / 8;
  tick(s); assert.equal(s.cells[0].temperatureC, s.physics.cellMaximumTemperatureC);
  assert.equal(s.phase, 'lost'); assert.equal(s.failures.some(x => x.kind === 'cell-overheat' && x.entityId === 'C1'), true);
  assert.ok(s.cells[0].consumedChargeC > 0); assert.ok(s.cells[0].generatedHeatJ > 0);
});

test('simultaneous charge, heat, power and deadline failures retain all facts in stable priority order', () => {
  const s = fixtureAt(1079); exhaustCell(s, 0, 0.01); s.cells[0].temperatureC = 52;
  s.loads[0].temperatureC = 41; s.loads[0].consecutiveBadPowerTicks = 74;
  tick(s); assert.equal(s.tick, 1080); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'cell-charge');
  assert.ok(s.cells[0].remainingChargeC < 0); near(s.lastInterval.cells[0].chargeUsedC, 0.05);
  assert.deepEqual(s.failures.map(x => [x.kind, x.entityId]), [
    ['cell-charge', 'C1'], ['cell-overheat', 'C1'], ['load-overheat', 'L1'], ['power-fault', 'L1'], ['stage-quota', 'L1'], ['stage-quota', 'L2']
  ]);
  assert.equal(s.viewSegment.kind, 'window'); assert.equal(s.controlsOpen, false); assert.equal(s.lastInterval.segment.kind, 'supply');
  assert.equal(s.stageEndReceipts.length, 1); assert.equal(s.stageEndReceipts[0].loads.every(x => !x.complete), true);
  const quota = s.failures.find(x => x.kind === 'stage-quota'); assert.equal(quota.unit, 'J'); assert.equal(quota.deficitJ, quota.limitValue - quota.actualValue);
});

test('a work completion and charge exhaustion on the same interval keep the receipt but lose', () => {
  const s = poweredFixture(); setStageWork(s, 0, 0, s.loads[0].stages[0].targetWorkJ - 0.1); exhaustCell(s, 0, 0.01);
  tick(s); assert.equal(s.phase, 'lost'); assert.equal(s.lostReason, 'cell-charge'); assert.equal(s.workCompletionReceipts.length, 1);
  assert.equal(s.lastInterval.loads[0].completedNow, true); assert.equal(s.loads[0].lastElectrical.connected, true);
  near(s.cells[0].remainingChargeC, -0.03); near(s.lastInterval.loads[0].deliveredEnergyJ, 0.576);
});

test('new-stage counters reset and a missed deadline fails even below the power-fault grace', () => {
  const s = fixtureAt(1380); s.loads[0].consecutiveBadPowerTicks = 74;
  const stage = s.loads[0].stages[1]; stage.workJ = 12; stage.goodIntervals = 4; stage.badIntervals = 3;
  tick(s); assert.equal(s.stageStartReceipts[0].stageIndex, 1); assert.equal(stage.startedAtTick, 1381);
  assert.equal(stage.workJ, 0); assert.equal(stage.goodIntervals, 0); assert.equal(stage.badIntervals, 1);
  assert.equal(s.loads[0].consecutiveBadPowerTicks, 1); assert.equal(s.loads[0].stages[0].startedAtTick, null);
  const end = poweredFixture(); end.tick = 1079; tick(end);
  assert.equal(end.phase, 'lost'); assert.equal(end.lostReason, 'stage-quota');
  assert.equal(end.loads.every(x => x.consecutiveBadPowerTicks < 75), true); assert.equal(end.stageEndReceipts[0].tick, 1080);
});

test('final-stage completion can win before its deadline and every terminal field remains frozen', () => {
  const s = poweredFixture(2);
  for (let row = 0; row < 2; row++) setStageWork(s, row, 2, s.loads[row].stages[2].targetWorkJ - 0.1);
  tick(s); assert.equal(s.phase, 'won'); assert.ok(s.tick < s.closeTick); assert.equal(s.workCompletionReceipts.length, 2);
  assert.equal(s.controlsOpen, false); assert.equal(s.failures.length, 0);
  assert.equal(s.score, 1000 + 2 * Math.floor((s.closeTick - s.tick) / 60) + Math.floor(s.cells.reduce((n, c) => n + c.remainingChargeC, 0)));
  const frozen = copy(s); assert.equal(Model.step(s, NaN, { a: true, b: true, x: -1, cancelled: true, cancelEpoch: 9 }), s);
  assert.deepEqual(s, frozen); assert.equal(Model.step(s, 0, {}), s); assert.deepEqual(s, frozen);
  const loss = fixtureAt(1079); tick(loss); const failed = copy(loss); Model.step(loss, -1, { a: true }); assert.deepEqual(loss, failed);
});

test('historical receipts and interval snapshots are detached and per-step events do not replay', () => {
  const s = Model.create(528, 0); tick(s, { a: true });
  const command = s.commandReceipts[0], operation = s.lastOperation, interval = s.lastInterval;
  const commandBefore = copy(command), operationBefore = copy(operation), intervalBefore = copy(interval), eventCount = s.eventCount;
  tick(s); assert.deepEqual(s.events, []); assert.equal(s.eventCount, eventCount);
  tick(s, { x: 1, a: true });
  assert.deepEqual(command, commandBefore); assert.deepEqual(operation, operationBefore); assert.deepEqual(interval, intervalBefore);
  assert.notEqual(s.commandReceipts[1].before.slots, s.commandReceipts[1].after.slots);
  assert.notEqual(s.commandReceipts[1].after.slots, s.slots); assert.notEqual(s.lastInput.segment, s.lastInterval.segment);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});
