'use strict';
// Contract-driven mechanism tests. No private route, solver, renderer or pilot is imported.
const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../src/main/assets/game-model.js');
const DT = 1 / 60;
const copy = value => JSON.parse(JSON.stringify(value));
const step = (state, input = {}) => { Model.step(state, DT, input); return state; };

function until(state, tick, input = {}) {
  while (state.tick < tick) {
    assert.equal(state.phase, 'playing', 'bounded prefix must remain active');
    step(state, input);
  }
  assert.equal(state.tick, tick);
  return state;
}

// SYNTHETIC FORMAL FIXTURES ONLY: injected stock/heat and relocated clocks are
// isolated opening balances, not reachable authored play or reconstructed receipts.
// Their scalar ledgers and public aliases are kept consistent. Receipt arrays contain
// only real step-produced events within the test; no historical event is fabricated.
// The model owner confirmed step consumes public state without hidden fixture caches.
function supply(state) {
  const scenario = state.scenario;
  const count = scenario.pulseCount - state.pulseCursor;
  const index = state.pulseCursor + 1;
  const amount = i => scenario.pulsePatternEU[(i - 1) % scenario.pulsePatternEU.length];
  let futureSupplyEU = 0;
  for (let i = index; i <= scenario.pulseCount; i++) {
    if (i * scenario.periodTicks > state.tick && i * scenario.periodTicks <= state.deadlineTick) futureSupplyEU += amount(i);
  }
  const minimumSpendEU = state.locks.filter(lock => lock.status === 'closed')
    .reduce((total, lock) => total + state.doseOptionsEU.find(dose => dose >= lock.thresholdEU), 0);
  const requiredEU = minimumSpendEU + state.reserveEU;
  state.supply = {nextPulse:count ? {index,dueTick:index * scenario.periodTicks,amountEU:amount(index),ticksUntil:index * scenario.periodTicks - state.tick} : null,
    remainingPulseCount:count,futureSupplyEU,minimumSpendEU,requiredEU,
    optimisticAvailableEU:state.energyEU + futureSupplyEU,feasibleByEnergy:state.energyEU + futureSupplyEU >= requiredEU};
}

function fund(state, amount) {
  assert.ok(amount >= 0 && state.energyEU + amount <= state.capacityEU);
  state.energyEU += amount;
  state.energyLedger.harvestedGrossEU += amount;
  state.energyLedger.offeredEU += amount;
  supply(state);
}

function synthetic({base = Model.create(), tick = base.tick, energy = base.energyEU,
  heat = base.heatHU, doseIndex = base.doseIndex} = {}) {
  const state = copy(base);
  fund(state, energy - state.energyEU);
  if (heat >= state.heatHU) state.thermalLedger.captureAddedHU += heat - state.heatHU;
  else state.thermalLedger.cooledHU += state.heatHU - heat;
  state.heatHU = heat;
  state.tick = tick; state.elapsed = tick / 60;
  state.pulseCursor = Math.min(state.scenario.pulseCount, Math.floor(tick / state.scenario.periodTicks));
  state.doseIndex = doseIndex; state.selectedDoseEU = state.doseOptionsEU[doseIndex];
  state.charging = false;
  state.inputState = {cancelEpoch:0,quarantined:false,bArmed:true,axisArmed:true};
  state.lastInput = state.lastDischarge = state.lastPulse = state.lastCooling = state.lastStep = null;
  supply(state);
  return state;
}

// Real B calls create every open-lock credit and receipt. Funding is explicitly
// synthetic, so this setup is neither a normal successful round nor an author route.
function openedPrefix(count) {
  const state = synthetic();
  for (let i = 0; i < count; i++) {
    const threshold = state.locks[i].thresholdEU;
    fund(state, threshold);
    state.doseIndex = state.doseOptionsEU.indexOf(threshold);
    state.selectedDoseEU = threshold;
    step(state, {b:true});
    assert.equal(state.lastDischarge.result, 'opened');
    step(state);
  }
  assert.equal(state.openedCount, count);
  assert.equal(state.phase, 'playing');
  return state;
}

function accounts(state) {
  const e = state.energyLedger, h = state.thermalLedger;
  assert.equal(e.offeredEU, e.harvestedGrossEU + e.missedEU);
  assert.equal(state.energyEU, e.harvestedGrossEU - e.dischargedEU - e.overflowLostEU);
  assert.equal(e.dischargedEU, e.usefulToLocksEU + e.dischargeWasteEU);
  assert.equal(e.usefulToLocksEU, state.locks.filter(lock => lock.status === 'open').reduce((sum, lock) => sum + lock.thresholdEU, 0));
  assert.equal(state.heatHU, h.captureAddedHU + h.overflowAddedHU + h.dischargeAddedHU - h.cooledHU);
  assert.ok(state.energyEU >= 0 && state.energyEU <= 72 && state.heatHU >= 0);
}

test('creation publishes exact identity, authored scenarios and fresh independent state', () => {
  const initial = Model.create();
  assert.deepEqual(initial.identity, {gameId:35,name:'脉冲储库',englishName:'Pulse Vault',slug:'pulse-vault',packageId:'com.ecojust.pulsevaulttv',versionName:'0.1.0',versionCode:1,seed:735,actionCount:2});
  assert.equal(initial.physics.ticksPerSecond, 60);
  assert.deepEqual([initial.tick,initial.elapsed,initial.energyEU,initial.heatHU,initial.doseIndex,initial.selectedDoseEU], [0,0,0,0,1,24]);
  assert.deepEqual(initial.inputState, {cancelEpoch:null,quarantined:true,bArmed:false,axisArmed:false});
  const authored = [[180,[12],18,[24,36,24,48],12,3600],[180,[8,16],20,[36,24,48,36],16,3840],[150,[18,6,12],21,[48,36,60,24],18,3600]];
  for (let difficulty = 0; difficulty < 3; difficulty++) {
    const state = Model.create(7, difficulty), scenario = state.scenario;
    assert.equal(state.identity.seed, 7); assert.equal(state.level, difficulty + 1);
    assert.deepEqual([scenario.periodTicks,scenario.pulsePatternEU,scenario.pulseCount,scenario.lockThresholdsEU,state.reserveEU,state.deadlineTick], authored[difficulty]);
    assert.ok(Object.isFrozen(state.identity) && Object.isFrozen(state.scenario) && Object.isFrozen(state.physics));
    accounts(state);
  }
  const other = Model.create(); step(initial);
  assert.equal(other.tick, 0); assert.notEqual(initial.locks, other.locks);
  assert.deepEqual(Model.create(undefined, undefined), other);
});

test('invalid create arguments and invalid active dt cannot write state', () => {
  for (const seed of [-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER + 1,'735',null]) assert.throws(() => Model.create(seed), RangeError);
  for (const difficulty of [-1,3,0.5,NaN,'0',null]) assert.throws(() => Model.create(735, difficulty), RangeError);
  const state = Model.create(), before = copy(state);
  for (const dt of [-1,NaN,Infinity,undefined,null,'0.016',1,DT + 2e-12]) {
    assert.throws(() => Model.step(state, dt, {a:true,b:true}), RangeError);
    assert.deepEqual(state, before);
  }
  Model.step(state, 0, {a:true,b:true,cancelled:true}); assert.deepEqual(state, before);
  Model.step(state, DT + 0.5e-12, {}); assert.equal(state.tick, 1);
  assert.deepEqual([state.lastStep.fromTick,state.lastStep.toTick], [0,1]);
});

test('held A collects only at the real pulse boundary and can collect a later pulse', () => {
  const state = Model.create(); step(state); until(state, 179, {a:true});
  assert.equal(state.pulseCursor, 0); assert.equal(state.energyEU, 0);
  step(state, {a:true});
  assert.deepEqual([state.tick,state.energyEU,state.pulseCursor,state.lastPulse.endedTick], [180,12,1,180]);
  assert.equal(state.lastPulse.result, 'collected');
  step(state, {a:true}); assert.equal(state.energyEU, 12); assert.equal(state.lastPulse, null);
  until(state, 360, {a:true});
  assert.equal(state.energyEU, 24); assert.equal(state.pulseReceipts.length, 2); accounts(state);
});

test('aPressed charges only its own interval; missing the next pulse still advances its cursor', () => {
  const state = Model.create(); step(state); until(state, 179);
  step(state, {aPressed:true}); assert.equal(state.energyEU, 12); assert.equal(state.charging, true);
  step(state); assert.equal(state.charging, false); assert.equal(state.lastInput.effectiveA, false);
  until(state, 360);
  assert.equal(state.lastPulse.result, 'missed'); assert.equal(state.pulseCursor, 2);
  assert.equal(state.energyEU, 12); assert.equal(state.energyLedger.missedEU, 12); accounts(state);
});

test('B cannot spend an arriving pulse: insufficient old stock has zero discharge cost', () => {
  const state = synthetic({tick:179,energy:12}); step(state, {b:true,a:true});
  const receipt = state.lastDischarge;
  assert.equal(receipt.result, 'insufficient_stock');
  assert.deepEqual([receipt.boundaryTick,receipt.energyBeforeEU,receipt.energyAfterEU,receipt.spentEU,receipt.heatAddedHU], [179,12,12,0,0]);
  assert.equal(state.lastPulse.energyBeforeEU, 12); assert.equal(state.energyEU, 24);
  assert.equal(state.openedCount, 0); assert.equal(state.lastStep.toTick, 180); accounts(state);
});

test('B spends before the pulse, freeing capacity instead of causing a false overflow', () => {
  const state = synthetic({tick:179,energy:72}); step(state, {b:true,a:true});
  assert.equal(state.lastDischarge.result, 'opened'); assert.equal(state.lastPulse.energyBeforeEU, 48);
  assert.equal(state.lastPulse.overflowLostEU, 0); assert.equal(state.energyEU, 60);
  assert.equal(state.lastStep.dischargeId, 1); assert.equal(state.lastStep.pulseId, 1); accounts(state);
});

test('below-threshold dose is fully spent and wasted without accumulating lock credit', () => {
  const state = synthetic({energy:24,doseIndex:0}), target = copy(state.locks[0]);
  step(state, {b:true}); const receipt = state.lastDischarge;
  assert.equal(receipt.result, 'below_threshold');
  assert.deepEqual([receipt.spentEU,receipt.usefulEU,receipt.wasteEU,receipt.heatAddedHU], [12,0,12,2]);
  assert.deepEqual(state.locks[0], target); assert.deepEqual(receipt.targetBefore, receipt.targetAfter);
  assert.equal(state.currentLockIndex, 0); assert.equal(state.energyEU, 12); accounts(state);
});

test('excess dose opens only one lock, even when its waste equals the next threshold', () => {
  const state = synthetic({energy:72,doseIndex:4}); step(state, {b:true});
  const receipt = state.lastDischarge;
  assert.deepEqual([receipt.spentEU,receipt.usefulEU,receipt.wasteEU], [60,24,36]);
  assert.equal(state.openedCount, 1); assert.equal(state.currentLockIndex, 1);
  assert.equal(state.locks[1].status, 'closed'); assert.equal(state.locks[1].acceptedEU, 0);
  assert.equal(state.locks[0].openedByDischargeId, receipt.id); assert.equal(state.score, 100); accounts(state);
});

test('capacity accounting separates gross harvest and one overflow deduction, including exact fit', () => {
  for (const [energy,overflow,heat] of [[60,0,7],[71,11,29]]) {
    const state = synthetic({tick:179,energy}); step(state, {a:true});
    assert.equal(state.energyEU, 72); assert.equal(state.lastPulse.harvestedGrossEU, 12);
    assert.equal(state.lastPulse.overflowLostEU, overflow); assert.equal(state.energyLedger.overflowLostEU, overflow);
    assert.equal(state.lastPulse.result, overflow ? 'overflow' : 'collected');
    assert.equal(state.lastPulse.heatAfterHU, heat + 1); assert.equal(state.heatHU, heat); accounts(state);
  }
});

test('pulse heat reaching 100 loses even when same-tick cooling leaves 99', () => {
  const state = synthetic({tick:179,heat:92}); step(state, {a:true});
  assert.equal(state.lastPulse.heatAfterHU, 100); assert.equal(state.lastCooling.heatAfterHU, 99);
  assert.equal(state.heatHU, 99); assert.equal(state.phase, 'lost');
  assert.deepEqual(state.terminal, {reason:'overheat',endedTick:180,peakHeatHU:100});
  assert.equal(state.lastStep.peakHeatHU, 100); assert.equal(state.lastStep.toTick, 180); accounts(state);
});

test('energy feasibility includes equality and excludes every already missed pulse', () => {
  const state = Model.create(); step(state); until(state, 1080);
  assert.equal(state.energyEU, 0); assert.equal(state.energyLedger.missedEU, 72);
  assert.equal(state.supply.futureSupplyEU, 144); assert.equal(state.supply.requiredEU, 144);
  assert.equal(state.supply.optimisticAvailableEU, 144); assert.equal(state.supply.feasibleByEnergy, true);
  assert.equal(state.supply.nextPulse.dueTick, 1260); assert.equal(state.phase, 'playing');
  until(state, 1259); step(state);
  assert.equal(state.supply.futureSupplyEU, 132); assert.equal(state.pulseCursor, 7);
  assert.equal(state.supply.feasibleByEnergy, false); assert.equal(state.lostReason, 'energy_exhausted');
  assert.equal(state.terminal.endedTick, 1260); accounts(state);
});

test('four opened locks may wait for reserve; no-current-lock B is free before the winning pulse', () => {
  const base = openedPrefix(4); assert.equal(base.energyEU, 0);
  const state = synthetic({base,tick:179,heat:0}); step(state, {a:true,b:true});
  const receipt = state.lastDischarge;
  assert.equal(receipt.result, 'no_current_lock'); assert.equal(receipt.targetIndex, 4);
  assert.equal(receipt.targetBefore, null); assert.equal(receipt.targetAfter, null);
  assert.deepEqual([receipt.spentEU,receipt.usefulEU,receipt.wasteEU,receipt.heatAddedHU], [0,0,0,0]);
  assert.equal(state.energyEU, 12); assert.equal(state.phase, 'won');
  assert.equal(state.terminal.reason, 'reserve_ready'); assert.equal(state.score, 1412); accounts(state);
});

test('synthetic last-boundary priority is heat, then win, then energy, then deadline', () => {
  // Clock relocation and injected balances isolate terminal precedence. All three
  // existing lock credits and each final opening still come from real B receipts.
  const base = openedPrefix(3);
  const cases = [
    {energy:60,heat:92,input:{b:true},phase:'lost',reason:'overheat'},
    {energy:60,heat:0,input:{b:true},phase:'won',reason:'reserve_ready'},
    {energy:59,heat:0,input:{},phase:'lost',reason:'energy_exhausted'},
    {energy:60,heat:0,input:{},phase:'lost',reason:'deadline'}
  ];
  for (const expected of cases) {
    const state = synthetic({base,tick:3599,energy:expected.energy,heat:expected.heat,doseIndex:3});
    step(state, expected.input);
    assert.equal(state.phase, expected.phase); assert.equal(state.terminal.reason, expected.reason);
    assert.equal(state.tick, 3600); assert.equal(state.lastStep.fromTick, 3599); assert.equal(state.lastStep.toTick, 3600);
    assert.deepEqual(state.lastStep.terminalAfter, state.terminal);
    assert.equal(state.supply.nextPulse, null); assert.equal(state.supply.futureSupplyEU, 0); accounts(state);
  }
});

test('B edge latch rearms while A remains held and does not repeat held or pressed B', () => {
  const state = synthetic({energy:72}); step(state, {a:true,b:true});
  step(state, {a:true,b:true,bPressed:true}); assert.equal(state.dischargeReceipts.length, 1);
  step(state, {a:true}); assert.equal(state.inputState.bArmed, true); assert.equal(state.charging, true);
  step(state, {a:true,bPressed:true});
  assert.equal(state.dischargeReceipts.length, 2); assert.equal(state.lastDischarge.result, 'below_threshold');
  assert.equal(state.charging, true); accounts(state);
});

test('horizontal dose selection is edge-based, independently rearmed, and clamps without wrapping', () => {
  const state = synthetic(); step(state, {x:0.55,a:true}); assert.equal(state.doseIndex, 2);
  step(state, {x:1,a:true}); step(state, {x:-1,a:true}); assert.equal(state.doseIndex, 2);
  step(state, {x:0,a:true}); step(state, {x:-0.55,a:true}); assert.equal(state.doseIndex, 1);
  const edge = synthetic({doseIndex:4}); step(edge, {x:1});
  assert.equal(edge.doseIndex, 4); assert.equal(edge.lastInput.freshAxis, true); assert.equal(edge.lastInput.axisStep, 0);
  step(edge, {x:-1}); assert.equal(edge.doseIndex, 4);
  step(edge); step(edge, {x:-1}); assert.equal(edge.doseIndex, 3);
  assert.equal(edge.selectedDoseEU, 48);
});

test('direction changes the dose before same-boundary B', () => {
  const state = synthetic({energy:60}); step(state, {x:1,b:true});
  assert.equal(state.doseIndex, 2); assert.equal(state.lastDischarge.selectedDoseIndex, 2);
  assert.equal(state.lastDischarge.selectedDoseEU, 36); assert.equal(state.lastDischarge.wasteEU, 12);
  assert.equal(state.energyEU, 24); accounts(state);
});

test('cancel stops charging and all actions while the pulse clock and cooling continue', () => {
  const state = synthetic({tick:179,energy:24,heat:1});
  step(state, {a:true,b:true,x:1,cancelled:true,cancelEpoch:1});
  assert.equal(state.tick, 180); assert.equal(state.charging, false); assert.equal(state.lastPulse.result, 'missed');
  assert.equal(state.lastCooling.cooledHU, 1); assert.equal(state.energyEU, 24);
  assert.equal(state.doseIndex, 1); assert.equal(state.dischargeReceipts.length, 0);
  assert.equal(state.inputState.quarantined, true);
  step(state, {cancelled:true,cancelEpoch:1}); assert.equal(state.inputState.quarantined, true);
  step(state, {y:1,cancelEpoch:1}); assert.equal(state.inputState.quarantined, true);
  step(state, {aPressed:true,cancelEpoch:1}); assert.equal(state.inputState.quarantined, true);
  step(state, {cancelEpoch:1}); assert.equal(state.inputState.quarantined, false);
  assert.equal(state.lastInput.neutralAcknowledged, true); assert.equal(state.charging, false);
  step(state, {a:true,b:true,x:1,cancelEpoch:1});
  assert.equal(state.doseIndex, 2); assert.equal(state.lastDischarge.result, 'insufficient_stock');
  assert.equal(state.charging, true); accounts(state);
});

test('initial and changed-epoch quarantine require a later complete neutral sample', () => {
  const state = Model.create(); step(state, {a:true,b:true,x:1});
  assert.equal(state.inputState.quarantined, true); assert.equal(state.charging, false);
  step(state, {cancelEpoch:0}); assert.equal(state.lastInput.epochChanged, true);
  assert.equal(state.inputState.quarantined, true);
  step(state, {cancelEpoch:0}); assert.equal(state.inputState.quarantined, false);
  step(state, {a:true,cancelEpoch:0}); assert.equal(state.charging, true);
  step(state, {a:true,cancelEpoch:1}); assert.equal(state.charging, false); assert.equal(state.inputState.quarantined, true);
});

test('input normalization records invalid raw numbers without accepting truthy button aliases', () => {
  const state = synthetic(); step(state, {x:Infinity,y:NaN,a:1,aPressed:'yes',b:'true',cancelEpoch:Infinity});
  assert.deepEqual([state.lastInput.rawX,state.lastInput.rawY,state.lastInput.rawCancelEpoch], [null,null,null]);
  assert.deepEqual([state.lastInput.x,state.lastInput.y,state.lastInput.rawA,state.lastInput.rawB], [0,0,false,false]);
  assert.equal(state.charging, false); assert.equal(state.dischargeReceipts.length, 0);
  step(state, {x:9,y:-9}); assert.equal(state.lastInput.rawX, 9); assert.equal(state.lastInput.x, 1); assert.equal(state.lastInput.y, -1);
});

test('actual cooling includes zero heat and never removes more heat than exists', () => {
  for (const heat of [0,1]) {
    const state = synthetic({tick:29,heat}); step(state);
    assert.deepEqual(state.lastCooling, {endedTick:30,heatBeforeHU:heat,cooledHU:heat,heatAfterHU:0});
    assert.deepEqual(state.lastStep.cooling, state.lastCooling); accounts(state);
    step(state); assert.equal(state.lastCooling, null); assert.equal(state.lastStep.cooling, null);
  }
});

test('receipts and step summaries are detached, frozen, and survive later local-event clearing', () => {
  const state = synthetic({tick:179,energy:72,doseIndex:4}); step(state, {a:true,b:true});
  const discharge = state.lastDischarge, pulse = state.lastPulse, interval = state.lastStep;
  const before = copy({discharge,pulse,interval});
  assert.ok(Object.isFrozen(discharge) && Object.isFrozen(discharge.targetBefore) && Object.isFrozen(discharge.targetAfter));
  assert.ok(Object.isFrozen(pulse) && Object.isFrozen(interval) && Object.isFrozen(interval.energyLedgerDelta) && Object.isFrozen(interval.supplyAfter));
  assert.notEqual(discharge.targetAfter, state.locks[0]); assert.notEqual(interval.supplyAfter, state.supply);
  assert.deepEqual(interval.energyLedgerDelta, {offeredEU:12,harvestedGrossEU:12,missedEU:0,dischargedEU:60,overflowLostEU:0,usefulToLocksEU:24,dischargeWasteEU:36});
  assert.deepEqual(interval.thermalLedgerDelta, {captureAddedHU:8,overflowAddedHU:0,dischargeAddedHU:10,cooledHU:1});
  step(state); assert.equal(state.lastDischarge, null); assert.equal(state.lastPulse, null); assert.equal(state.lastCooling, null);
  assert.equal(state.dischargeReceipts[0], discharge); assert.equal(state.pulseReceipts[0], pulse);
  assert.deepEqual({discharge,pulse,interval}, before); accounts(state);
});

test('dt zero, terminal calls and retry do not leak prior events or resource state', () => {
  const state = synthetic({tick:179,heat:92}); step(state, {a:true});
  const terminal = copy(state);
  for (const dt of [0,DT,-1,NaN]) { Model.step(state, dt, {a:true,b:true,x:1,cancelled:true}); assert.deepEqual(state, terminal); }
  const active = synthetic({tick:179,energy:72}); step(active, {a:true,b:true});
  const frozen = copy(active); Model.step(active, 0, {b:true,cancelled:true}); assert.deepEqual(active, frozen);
  const retry = Model.create(state.seed, state.difficulty);
  assert.deepEqual(retry, Model.create()); assert.equal(retry.dischargeReceipts.length, 0); assert.equal(retry.pulseReceipts.length, 0);
  assert.notEqual(retry.locks, state.locks); assert.equal(retry.energyEU, 0); assert.equal(retry.heatHU, 0);
});
