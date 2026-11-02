// Pure current-state feedback: no future input schedule, Model import, rollout or route search.
export const budgets = { maxWebGLDrawCalls: 1 };
export const lossPolicies = ['hold-only', 'miss-all-pulses', 'under-dose-waste'];
export const lossReasons = ['overheat', 'energy_exhausted', 'energy_exhausted'];
const need = (ok, message) => { if (!ok) throw Error(message); };
const clone = value => structuredClone(value);
const ENERGY_KEYS = ['offeredEU', 'harvestedGrossEU', 'missedEU', 'dischargedEU', 'overflowLostEU', 'usefulToLocksEU', 'dischargeWasteEU'];
const HEAT_KEYS = ['captureAddedHU', 'overflowAddedHU', 'dischargeAddedHU', 'cooledHU'];
function shape(m) {
  need(m?.physics?.ticksPerSecond === 60 && m.capacityEU === 72 && m.heatLimitHU === 100, 'Actual Pulse Vault public rules required');
  need(m.locks.length === 4 && m.doseOptionsEU.length === 5 && Number.isSafeInteger(m.tick), 'Actual locks, doses and tick required');
}
function completeNeutral(m) {
  const i = m.lastInput;
  return i && !i.cancelled && !i.epochChanged && !m.inputState.quarantined && i.axisX === 0 && i.axisY === 0 &&
    !i.rawA && !i.rawAPressed && !i.rawB && !i.rawBPressed && m.inputState.bArmed && m.inputState.axisArmed;
}
export function createPilot({ mode = 'record', policy = mode === 'loss' ? 'hold-only' : 'normal' } = {}) {
  need(policy === 'normal' || lossPolicies.includes(policy), 'Unknown pulse policy');
  let identity = null, lastTick = -1, primed = false, pending = null, needsNeutral = true, observedCharging = null;
  let stats = { prime: null, issued: [], acknowledged: [], cancellations: [], chargeObservations: [] };
  function reset(m) {
    identity = m.seed + ':' + m.level; lastTick = m.tick; primed = false; pending = null; needsNeutral = true; observedCharging = null;
    stats = { prime: null, issued: [], acknowledged: [], cancellations: [], chargeObservations: [] };
  }
  function prime(state) {
    const m = state?.model; shape(m);
    need(m.tick === 0 && m.pulseReceipts.length === 0 && m.dischargeReceipts.length === 0, 'Prime requires a real untouched initial model');
    reset(m); primed = true;
    stats.prime = { level: m.level, initialDoseEU: m.selectedDoseEU, initialEnergyEU: m.energyEU,
      limits: { futureTickIterations: 0, modelRollouts: 0, routeSearches: 0, maxIssuedControls: 128 },
      scope: 'Hold real Space/A; choose only the current lock minimum sufficient public dose and discharge only current inventory. B release and axis return-to-center use independent actual latch acknowledgements while A remains held. Complete neutral is required after start/cancellation. No timing plan, hidden witness, state mutation or future action advice.' };
    return clone(stats.prime);
  }
  function issue(m, key, kind) {
    need(!pending && stats.issued.length < 128, 'Only one bounded auxiliary control at a time');
    pending = { key, kind, issuedTick: m.tick, doseIndexBefore: m.doseIndex, selectedDoseEU: m.selectedDoseEU,
      targetIndex: m.currentLockIndex, energyBeforeEU: m.energyEU, receiptCount: m.dischargeReceipts.length,
      acknowledged: false, phase: 'press', releaseTick: null };
    stats.issued.push(clone(pending)); return ['Space', key];
  }
  function observeControl(m) {
    const p = pending;
    if (!p || p.acknowledged || m.tick <= p.issuedTick) return;
    let observed = null;
    if (p.kind === 'discharge' && m.dischargeReceipts.length > p.receiptCount) {
      const receipt = m.dischargeReceipts[p.receiptCount];
      need(m.dischargeReceipts.length === p.receiptCount + 1 && receipt.boundaryTick >= p.issuedTick, 'One held B must create exactly one actual discharge receipt');
      need(receipt.currentLockIndexBefore === p.targetIndex && receipt.selectedDoseEU === p.selectedDoseEU, 'B must target the actual requested current lock and selected dose');
      observed = { kind: 'actual-discharge-receipt', receipt: clone(receipt) };
    } else if (p.kind === 'axis' && m.doseIndex !== p.doseIndexBefore) {
      const delta = p.key === 'ArrowLeft' ? -1 : 1;
      need(m.doseIndex === p.doseIndexBefore + delta && m.dischargeReceipts.length === p.receiptCount, 'One real axis edge changes one dose without discharging');
      observed = { kind: 'actual-dose-change', before: p.doseIndexBefore, after: m.doseIndex, input: clone(m.lastInput) };
    }
    if (observed) {
      p.acknowledged = true; stats.acknowledged.push({ issuedTick: p.issuedTick, observedTick: m.tick, key: p.key, ...observed });
    }
  }
  function advancePending(m) {
    const p = pending;
    if (p.phase === 'press') {
      if (!p.acknowledged) { need(m.tick - p.issuedTick <= 120, 'Control lacks an actual ACK within 120 ticks'); return ['Space', p.key]; }
      p.phase = 'release'; p.releaseTick = m.tick; return ['Space'];
    }
    const i = m.lastInput;
    const released = p.kind === 'discharge' ? m.inputState.bArmed && !i.rawB && !i.rawBPressed :
      m.inputState.axisArmed && i.axisX === 0;
    if (m.tick <= p.releaseTick || !released) return ['Space'];
    stats.acknowledged.push({ kind: p.kind === 'discharge' ? 'actual-B-release' : 'actual-axis-neutral',
      issuedTick: p.issuedTick, observedTick: m.tick, charging: m.charging, input: clone(i) });
    pending = null; return null;
  }
  function pilot(state) {
    const m = state?.model; if (!m) return [];
    if (identity !== m.seed + ':' + m.level || m.tick < lastTick) reset(m); lastTick = m.tick;
    if (m.phase !== 'playing') { if (primed) observeControl(m); return []; }
    if (state.phase !== 'playing' || state.paused) return [];
    shape(m); need(primed, 'Pilot must observe the actual initial model through prime');
    observeControl(m);
    if (m.inputState.quarantined || m.lastInput?.cancelled || m.lastInput?.epochChanged) {
      if (pending) stats.cancellations.push({ observedTick: m.tick, pending: clone(pending), input: clone(m.lastInput) });
      pending = null; needsNeutral = true; return [];
    }
    if (needsNeutral) {
      if (!completeNeutral(m)) return [];
      needsNeutral = false; stats.acknowledged.push({ kind: 'actual-complete-neutral', observedTick: m.tick, input: clone(m.lastInput) });
    }
    if (observedCharging !== m.charging) {
      observedCharging = m.charging; stats.chargeObservations.push({ observedTick: m.tick, charging: m.charging, input: clone(m.lastInput) });
    }
    if (policy === 'miss-all-pulses') return [];
    if (pending) { const keys = advancePending(m); if (keys) return keys; }
    if (!m.charging) return ['Space']; // First observe real held-A acceptance before any auxiliary action.
    if (policy === 'hold-only') return ['Space'];
    if (policy === 'normal' && m.currentLockIndex === m.locks.length) return ['Space'];
    const dose = policy === 'under-dose-waste' ? m.doseOptionsEU[0] :
      m.doseOptionsEU.find(value => value >= m.locks[m.currentLockIndex].thresholdEU);
    const index = m.doseOptionsEU.indexOf(dose);
    need(index >= 0, 'The public current lock must have a sufficient dose');
    if (m.doseIndex !== index) {
      return m.inputState.axisArmed ? issue(m, index < m.doseIndex ? 'ArrowLeft' : 'ArrowRight', 'axis') : ['Space'];
    }
    return m.energyEU >= dose && m.inputState.bArmed ? issue(m, 'b', 'discharge') : ['Space'];
  }
  pilot.prime = prime; pilot.keys = pilot; pilot.diagnostics = () => clone({ policy, pending, needsNeutral, ...stats }); return pilot;
}
const defaultPilot = createPilot();
export const keys = (state, context) => defaultPilot(state, context);
export const prime = state => defaultPilot.prime(state);
export function assertPublicBoard(m, assert) {
  shape(m); assert.equal(m.elapsed, m.tick / 60); assert.equal(m.level, m.difficulty + 1); assert.equal(m.scenarioId, m.scenario.id); assert.equal(m.identity.seed, m.seed);
  assert.equal(m.selectedDoseEU, m.doseOptionsEU[m.doseIndex]); assert.ok(Number.isInteger(m.doseIndex) && m.doseIndex >= 0 && m.doseIndex < 5);
  assert.equal(m.openedCount, m.currentLockIndex); assert.equal(m.locks.filter(row => row.status === 'open').length, m.openedCount);
  const e = m.energyLedger, h = m.thermalLedger;
  assert.deepEqual(Object.keys(e), ENERGY_KEYS); assert.deepEqual(Object.keys(h), HEAT_KEYS);
  assert.ok([...Object.values(e), ...Object.values(h)].every(value => Number.isSafeInteger(value) && value >= 0));
  assert.equal(e.offeredEU, e.harvestedGrossEU + e.missedEU); assert.equal(m.energyEU, m.physics.initialEnergyEU + e.harvestedGrossEU - e.dischargedEU - e.overflowLostEU);
  assert.equal(e.dischargedEU, e.usefulToLocksEU + e.dischargeWasteEU);
  assert.equal(m.heatHU, m.physics.initialHeatHU + h.captureAddedHU + h.overflowAddedHU + h.dischargeAddedHU - h.cooledHU);
  assert.ok(m.energyEU >= 0 && m.energyEU <= m.capacityEU && m.heatHU >= 0);
  assert.equal(m.score, m.phase === 'won' ? 1000 + 100 * m.openedCount + m.energyEU : 100 * m.openedCount);
  let opened = 0, spent = 0, useful = 0, waste = 0, dischargeHeat = 0;
  m.dischargeReceipts.forEach((r, i) => {
    assert.equal(r.id, i + 1); assert.ok(r.boundaryTick < m.tick); assert.equal(r.currentLockIndexBefore, opened); assert.equal(r.targetIndex, opened);
    assert.equal(r.selectedDoseEU, m.doseOptionsEU[r.selectedDoseIndex]); assert.equal(r.energyAfterEU, r.energyBeforeEU - r.spentEU);
    assert.equal(r.heatAfterHU, r.heatBeforeHU + r.heatAddedHU); assert.equal(r.spentEU, r.usefulEU + r.wasteEU);
    const lock = m.locks[opened];
    const result = !lock ? 'no_current_lock' : r.energyBeforeEU < r.selectedDoseEU ? 'insufficient_stock' :
      r.selectedDoseEU < lock.thresholdEU ? 'below_threshold' : 'opened';
    assert.equal(r.result, result);
    if (lock) assert.deepEqual(r.targetBefore, { id: lock.id, thresholdEU: lock.thresholdEU, status: 'closed', openedAtBoundaryTick: null, openedByDischargeId: null, acceptedEU: 0 });
    else { assert.equal(r.targetBefore, null); assert.equal(r.targetAfter, null); }
    if (['no_current_lock', 'insufficient_stock'].includes(result)) assert.equal(r.spentEU, 0);
    else assert.equal(r.spentEU, r.selectedDoseEU);
    assert.equal(r.heatAddedHU, r.spentEU / m.physics.dischargeHeatDivisor);
    if (result === 'opened') { assert.equal(r.usefulEU, lock.thresholdEU); assert.deepEqual(r.targetAfter, lock); opened++; }
    else { assert.equal(r.usefulEU, 0); assert.deepEqual(r.targetAfter, r.targetBefore); }
    assert.equal(r.currentLockIndexAfter, opened); spent += r.spentEU; useful += r.usefulEU; waste += r.wasteEU; dischargeHeat += r.heatAddedHU;
  });
  assert.equal(opened, m.openedCount); assert.equal(spent, e.dischargedEU); assert.equal(useful, e.usefulToLocksEU); assert.equal(waste, e.dischargeWasteEU); assert.equal(dischargeHeat, h.dischargeAddedHU);
  m.locks.forEach((lock, i) => {
    assert.equal(lock.id, 'lock-' + (i + 1)); assert.equal(lock.thresholdEU, m.scenario.lockThresholdsEU[i]);
    assert.equal(lock.status, i < opened ? 'open' : 'closed'); assert.equal(lock.acceptedEU, i < opened ? lock.thresholdEU : 0);
    if (i >= opened) { assert.equal(lock.openedAtBoundaryTick, null); assert.equal(lock.openedByDischargeId, null); }
  });
  assert.equal(m.pulseCursor, Math.min(m.scenario.pulseCount, Math.floor(m.tick / m.scenario.periodTicks)));
  assert.equal(m.pulseReceipts.length, m.pulseCursor);
  let offered = 0, harvested = 0, missed = 0, overflow = 0, captureHeat = 0, overflowHeat = 0;
  m.pulseReceipts.forEach((r, i) => {
    const amount = m.scenario.pulsePatternEU[i % m.scenario.pulsePatternEU.length];
    assert.equal(r.id, i + 1); assert.equal(r.index, r.id); assert.equal(r.endedTick, r.index * m.scenario.periodTicks); assert.equal(r.amountEU, amount);
    assert.equal(r.harvestedGrossEU, r.charging ? amount : 0); assert.equal(r.missedEU, r.charging ? 0 : amount);
    assert.equal(r.overflowLostEU, r.charging ? Math.max(0, r.energyBeforeEU + amount - m.capacityEU) : 0);
    assert.equal(r.energyAfterEU, r.energyBeforeEU + r.harvestedGrossEU - r.overflowLostEU);
    assert.equal(r.captureAddedHU, r.charging ? m.physics.captureHeatHU : 0); assert.equal(r.overflowAddedHU, r.overflowLostEU * m.physics.overflowHeatPerEU);
    assert.equal(r.heatAfterHU, r.heatBeforeHU + r.captureAddedHU + r.overflowAddedHU);
    assert.equal(r.result, !r.charging ? 'missed' : r.overflowLostEU > 0 ? 'overflow' : 'collected');
    offered += amount; harvested += r.harvestedGrossEU; missed += r.missedEU; overflow += r.overflowLostEU; captureHeat += r.captureAddedHU; overflowHeat += r.overflowAddedHU;
  });
  assert.equal(offered, e.offeredEU); assert.equal(harvested, e.harvestedGrossEU); assert.equal(missed, e.missedEU); assert.equal(overflow, e.overflowLostEU);
  assert.equal(captureHeat, h.captureAddedHU); assert.equal(overflowHeat, h.overflowAddedHU);
  const next = m.pulseCursor + 1, due = next * m.scenario.periodTicks; let future = 0;
  for (let i = next; i <= m.scenario.pulseCount; i++) if (i * m.scenario.periodTicks > m.tick && i * m.scenario.periodTicks <= m.deadlineTick) future += m.scenario.pulsePatternEU[(i - 1) % m.scenario.pulsePatternEU.length];
  const minimumSpend = m.locks.filter(row => row.status === 'closed').reduce((sum, row) => sum + m.doseOptionsEU.find(dose => dose >= row.thresholdEU), 0);
  assert.deepEqual(m.supply, { nextPulse: next > m.scenario.pulseCount ? null : { index: next, dueTick: due, amountEU: m.scenario.pulsePatternEU[(next - 1) % m.scenario.pulsePatternEU.length], ticksUntil: due - m.tick },
    remainingPulseCount: m.scenario.pulseCount - m.pulseCursor, futureSupplyEU: future, minimumSpendEU: minimumSpend, requiredEU: minimumSpend + m.reserveEU,
    optimisticAvailableEU: m.energyEU + future, feasibleByEnergy: m.energyEU + future >= minimumSpend + m.reserveEU });
  const d = m.dischargeReceipts.find(row => row.boundaryTick === m.tick - 1) || null, p = m.pulseReceipts.find(row => row.endedTick === m.tick) || null;
  assert.deepEqual(m.lastDischarge, d); assert.deepEqual(m.lastPulse, p);
  if (m.tick === 0) { assert.equal(m.lastInput, null); assert.equal(m.lastCooling, null); assert.equal(m.lastStep, null); return; }
  const st = m.lastStep; assert.equal(st.fromTick, m.tick - 1); assert.equal(st.toTick, m.tick); assert.equal(m.lastInput.boundaryTick, m.tick - 1);
  assert.equal(m.charging, m.lastInput.effectiveA); assert.equal(st.charging, m.charging);
  assert.equal(st.dischargeId, d?.id ?? null); assert.equal(st.pulseId, p?.id ?? null);
  assert.equal(st.doseIndexAfter, m.doseIndex); assert.equal(st.currentLockIndexAfter, m.currentLockIndex);
  assert.equal(st.energyAfterEU, m.energyEU); assert.equal(st.heatAfterHU, m.heatHU); assert.deepEqual(st.supplyAfter, m.supply); assert.deepEqual(st.terminalAfter, m.terminal);
  if (m.tick % m.physics.coolEveryTicks === 0) {
    const c = m.lastCooling; assert.equal(c.endedTick, m.tick); assert.equal(c.cooledHU, Math.min(m.physics.coolHU, c.heatBeforeHU)); assert.equal(c.heatAfterHU, c.heatBeforeHU - c.cooledHU); assert.equal(c.heatAfterHU, m.heatHU);
  } else assert.equal(m.lastCooling, null);
  assert.deepEqual(st.cooling, m.lastCooling);
  assert.deepEqual(st.energyLedgerDelta, { offeredEU: p?.amountEU ?? 0, harvestedGrossEU: p?.harvestedGrossEU ?? 0, missedEU: p?.missedEU ?? 0,
    dischargedEU: d?.spentEU ?? 0, overflowLostEU: p?.overflowLostEU ?? 0, usefulToLocksEU: d?.usefulEU ?? 0, dischargeWasteEU: d?.wasteEU ?? 0 });
  assert.deepEqual(st.thermalLedgerDelta, { captureAddedHU: p?.captureAddedHU ?? 0, overflowAddedHU: p?.overflowAddedHU ?? 0, dischargeAddedHU: d?.heatAddedHU ?? 0, cooledHU: m.lastCooling?.cooledHU ?? 0 });
  assert.equal(st.peakHeatHU, Math.max(st.heatBeforeHU, d?.heatAfterHU ?? st.heatBeforeHU, p?.heatAfterHU ?? st.heatBeforeHU));
  if (m.phase === 'playing') { assert.equal(m.terminal, null); assert.equal(m.lostReason, null); }
  else {
    const reason = st.peakHeatHU >= m.heatLimitHU ? 'overheat' : opened === 4 && m.energyEU >= m.reserveEU ? 'reserve_ready' : !m.supply.feasibleByEnergy ? 'energy_exhausted' : 'deadline';
    assert.deepEqual(m.terminal, { reason, endedTick: m.tick, peakHeatHU: st.peakHeatHU }); assert.equal(m.lostReason, reason === 'reserve_ready' ? null : reason);
  }
}
export function assertProgress({ after }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won');
  assert.equal(m.terminal.reason, 'reserve_ready'); assert.equal(m.openedCount, 4); assert.ok(m.energyEU >= m.reserveEU); assert.ok(m.lastStep.peakHeatHU < m.heatLimitHU);
  assert.ok(m.elapsed >= 30 && m.elapsed <= 90); assert.equal(m.dischargeReceipts.length, 4);
  assert.ok(m.dischargeReceipts.every(row => row.result === 'opened')); assert.ok(m.pulseReceipts.some(row => row.charging && row.result === 'collected'));
}
export function assertRetry({ after, initial }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(m.phase, 'playing'); assert.ok(m.tick >= 0 && m.tick < 120);
  assert.deepEqual(m.scenario, initial.model.scenario); assert.deepEqual(m.locks, initial.model.locks);
  assert.equal(m.doseIndex, m.physics.initialDoseIndex); assert.equal(m.energyEU, 0); assert.equal(m.heatHU, 0); assert.equal(m.charging, false);
  assert.equal(m.openedCount, 0); assert.equal(m.score, 0); assert.equal(m.pulseCursor, 0); assert.equal(m.terminal, null);
  assert.deepEqual(m.energyLedger, initial.model.energyLedger); assert.deepEqual(m.thermalLedger, initial.model.thermalLedger);
  assert.deepEqual(m.dischargeReceipts, []); assert.deepEqual(m.pulseReceipts, []);
}
