/* Pulse Vault: finite energy inputs, atomic lock payments and a separate thermal ledger. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  function freeze(value) {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  const detached = value => freeze(clone(value));
  const PHYSICS = freeze({ ticksPerSecond: 60, capacityEU: 72, doseOptionsEU: [12, 24, 36, 48, 60],
    initialDoseIndex: 1, initialEnergyEU: 0, initialHeatHU: 0, heatLimitHU: 100, captureHeatHU: 8,
    overflowHeatPerEU: 2, dischargeHeatDivisor: 6, coolEveryTicks: 30, coolHU: 1, axisThreshold: .55 });
  const SCENARIOS = freeze([
    { id: 'steady-current', name: '均流试验', periodTicks: 180, pulsePatternEU: [12], pulseCount: 18,
      lockThresholdsEU: [24, 36, 24, 48], reserveEU: 12, deadlineTick: 3600 },
    { id: 'twin-crest', name: '双峰接力', periodTicks: 180, pulsePatternEU: [8, 16], pulseCount: 20,
      lockThresholdsEU: [36, 24, 48, 36], reserveEU: 16, deadlineTick: 3840 },
    { id: 'triple-beat', name: '三拍深锁', periodTicks: 150, pulsePatternEU: [18, 6, 12], pulseCount: 21,
      lockThresholdsEU: [48, 36, 60, 24], reserveEU: 18, deadlineTick: 3600 }
  ]);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const energyKeys = ['offeredEU', 'harvestedGrossEU', 'missedEU', 'dischargedEU', 'overflowLostEU', 'usefulToLocksEU', 'dischargeWasteEU'];
  const thermalKeys = ['captureAddedHU', 'overflowAddedHU', 'dischargeAddedHU', 'cooledHU'];
  const zeros = keys => Object.fromEntries(keys.map(key => [key, 0]));
  const delta = (after, before) => Object.fromEntries(Object.keys(before).map(key => [key, after[key] - before[key]]));
  const pulseAmount = (s, index) => s.scenario.pulsePatternEU[(index - 1) % s.scenario.pulsePatternEU.length];
  function supplyAt(s) {
    const index = s.pulseCursor + 1, dueTick = index * s.scenario.periodTicks;
    const nextPulse = index > s.scenario.pulseCount ? null :
      { index, dueTick, amountEU: pulseAmount(s, index), ticksUntil: dueTick - s.tick };
    let futureSupplyEU = 0, minimumSpendEU = 0;
    for (let k = index; k <= s.scenario.pulseCount; k++) {
      const due = k * s.scenario.periodTicks;
      if (due > s.tick && due <= s.deadlineTick) futureSupplyEU += pulseAmount(s, k);
    }
    for (const lock of s.locks) if (lock.status === 'closed') minimumSpendEU += s.doseOptionsEU.find(dose => dose >= lock.thresholdEU);
    const requiredEU = minimumSpendEU + s.reserveEU, optimisticAvailableEU = s.energyEU + futureSupplyEU;
    return { nextPulse, remainingPulseCount: s.scenario.pulseCount - s.pulseCursor, futureSupplyEU,
      minimumSpendEU, requiredEU, optimisticAvailableEU, feasibleByEnergy: optimisticAvailableEU >= requiredEU };
  }
  function feedback(s) {
    s.openedCount = s.currentLockIndex;
    s.score = s.phase === 'won' ? 1000 + 100 * s.openedCount + s.energyEU : 100 * s.openedCount;
    const recent = s.dischargeReceipts[s.dischargeReceipts.length - 1];
    const labels = { no_current_lock: '四门已开，继续收能达到储备要求', insufficient_stock: '库存不足以支付整档；本次未扣能量',
      below_threshold: '低于门槛：放出能量全部浪费', opened: '当前门锁已开启；多余能量不会穿透后门' };
    s.message = s.phase === 'won' ? '四门开启且储备达标！' : s.lostReason === 'overheat' ? '峰值温度达到危险线，储库爆裂' :
      s.lostReason === 'energy_exhausted' ? '剩余有限供能已不足以完成门锁与储备' : s.lostReason === 'deadline' ? '期限到，任务尚未完成' :
      s.currentLockIndex === s.locks.length ? '门锁全部开启，保持收能补足储备' : recent ? labels[recent.result] : '按住 A 收能；左右选档，B 向当前门放电';
  }
  function create(seed = 735, difficulty = 0) {
    if (!Number.isSafeInteger(seed) || seed < 0 || !Number.isInteger(difficulty) || difficulty < 0 || difficulty > 2) {
      throw new RangeError('Expected a nonnegative safe-integer seed and difficulty 0, 1 or 2');
    }
    const scenario = detached(SCENARIOS[difficulty]), physics = detached(PHYSICS);
    const s = { width: 960, height: 540, schemaVersion: 1, seed, difficulty, level: difficulty + 1,
      levelName: scenario.name, scenarioId: scenario.id, phase: 'playing', tick: 0, elapsed: 0, score: 0, lostReason: null,
      message: '', terminal: null,
      identity: detached({ gameId: 35, name: '脉冲储库', englishName: 'Pulse Vault', slug: 'pulse-vault',
        packageId: 'com.ecojust.pulsevaulttv', versionName: '0.1.0', versionCode: 1, seed, actionCount: 2 }),
      scenario, physics, capacityEU: physics.capacityEU, heatLimitHU: physics.heatLimitHU,
      reserveEU: scenario.reserveEU, deadlineTick: scenario.deadlineTick, doseOptionsEU: detached(physics.doseOptionsEU),
      doseIndex: physics.initialDoseIndex, selectedDoseEU: physics.doseOptionsEU[physics.initialDoseIndex],
      energyEU: physics.initialEnergyEU, heatHU: physics.initialHeatHU, charging: false, pulseCursor: 0, currentLockIndex: 0, openedCount: 0,
      locks: scenario.lockThresholdsEU.map((thresholdEU, i) => ({ id: 'lock-' + (i + 1), thresholdEU, status: 'closed',
        openedAtBoundaryTick: null, openedByDischargeId: null, acceptedEU: 0 })),
      energyLedger: zeros(energyKeys), thermalLedger: zeros(thermalKeys), supply: null,
      inputState: { cancelEpoch: null, quarantined: true, bArmed: false, axisArmed: false },
      lastInput: null, lastDischarge: null, lastPulse: null, lastCooling: null, lastStep: null, dischargeReceipts: [], pulseReceipts: [] };
    s.supply = supplyAt(s); feedback(s); return s;
  }
  function normalize(s, input) {
    const finite = value => Number.isFinite(value) ? value : null;
    const rawX = finite(input.x), rawY = finite(input.y), x = rawX === null ? 0 : clamp(rawX, -1, 1), y = rawY === null ? 0 : clamp(rawY, -1, 1);
    const axis = value => value >= s.physics.axisThreshold ? 1 : value <= -s.physics.axisThreshold ? -1 : 0;
    const axisX = axis(x), axisY = axis(y), rawA = input.a === true, rawB = input.b === true;
    const rawAPressed = input.aPressed === true, rawBPressed = input.bPressed === true, cancelled = input.cancelled === true;
    const rawCancelEpoch = finite(input.cancelEpoch), l = s.inputState;
    const quarantinedBefore = l.quarantined, bArmedBefore = l.bArmed, axisArmedBefore = l.axisArmed;
    const epochChanged = rawCancelEpoch !== null && rawCancelEpoch !== l.cancelEpoch;
    if (rawCancelEpoch !== null) l.cancelEpoch = rawCancelEpoch;
    let effectiveA = false, freshB = false, freshAxis = false, axisStep = 0, neutralAcknowledged = false;
    if (cancelled || epochChanged) {
      l.quarantined = true; l.bArmed = false; l.axisArmed = false;
    } else if (l.quarantined) {
      if (axisX === 0 && axisY === 0 && !rawA && !rawB && !rawAPressed && !rawBPressed) {
        l.quarantined = false; l.bArmed = true; l.axisArmed = true; neutralAcknowledged = true;
      }
    } else {
      effectiveA = rawA || rawAPressed;
      const effectiveB = rawB || rawBPressed;
      freshB = effectiveB && l.bArmed; l.bArmed = !effectiveB;
      freshAxis = axisX !== 0 && l.axisArmed;
      if (axisX === 0) l.axisArmed = true;
      else {
        l.axisArmed = false;
        if (freshAxis) {
          const before = s.doseIndex; s.doseIndex = clamp(before + axisX, 0, s.doseOptionsEU.length - 1); axisStep = s.doseIndex - before;
        }
      }
    }
    s.selectedDoseEU = s.doseOptionsEU[s.doseIndex];
    return detached({ boundaryTick: s.tick, rawX, rawY, x, y, axisX, axisY, rawA, rawB, rawAPressed, rawBPressed,
      cancelled, rawCancelEpoch, cancelEpoch: l.cancelEpoch, epochChanged, quarantinedBefore, quarantinedAfter: l.quarantined,
      neutralAcknowledged, bArmedBefore, bArmedAfter: l.bArmed, axisArmedBefore, axisArmedAfter: l.axisArmed,
      effectiveA, freshB, freshAxis, axisStep });
  }
  function discharge(s) {
    const id = s.dischargeReceipts.length + 1, targetIndex = s.currentLockIndex, target = s.locks[targetIndex] || null;
    const targetBefore = target ? clone(target) : null, energyBeforeEU = s.energyEU, heatBeforeHU = s.heatHU;
    let result, spentEU = 0, usefulEU = 0, wasteEU = 0, heatAddedHU = 0;
    if (!target) result = 'no_current_lock';
    else if (s.energyEU < s.selectedDoseEU) result = 'insufficient_stock';
    else {
      spentEU = s.selectedDoseEU; s.energyEU -= spentEU; heatAddedHU = spentEU / s.physics.dischargeHeatDivisor;
      s.heatHU += heatAddedHU;
      if (spentEU < target.thresholdEU) { result = 'below_threshold'; wasteEU = spentEU; }
      else {
        result = 'opened'; usefulEU = target.thresholdEU; wasteEU = spentEU - usefulEU;
        target.status = 'open'; target.acceptedEU = target.thresholdEU; target.openedAtBoundaryTick = s.tick;
        target.openedByDischargeId = id; s.currentLockIndex++;
      }
    }
    s.energyLedger.dischargedEU += spentEU; s.energyLedger.usefulToLocksEU += usefulEU; s.energyLedger.dischargeWasteEU += wasteEU;
    s.thermalLedger.dischargeAddedHU += heatAddedHU;
    s.lastDischarge = detached({ id, boundaryTick: s.tick, selectedDoseIndex: s.doseIndex, selectedDoseEU: s.selectedDoseEU,
      targetIndex, targetBefore, targetAfter: target ? clone(target) : null, result, energyBeforeEU, energyAfterEU: s.energyEU,
      spentEU, usefulEU, wasteEU, heatBeforeHU, heatAddedHU, heatAfterHU: s.heatHU,
      currentLockIndexBefore: targetIndex, currentLockIndexAfter: s.currentLockIndex });
    s.dischargeReceipts.push(s.lastDischarge);
  }
  function receivePulse(s) {
    const index = s.pulseCursor + 1, amountEU = pulseAmount(s, index), energyBeforeEU = s.energyEU, heatBeforeHU = s.heatHU;
    let harvestedGrossEU = 0, missedEU = 0, overflowLostEU = 0, captureAddedHU = 0, overflowAddedHU = 0, result = 'missed';
    s.energyLedger.offeredEU += amountEU; s.pulseCursor++;
    if (!s.charging) missedEU = amountEU;
    else {
      harvestedGrossEU = amountEU; overflowLostEU = Math.max(0, s.energyEU + amountEU - s.capacityEU);
      s.energyEU += amountEU - overflowLostEU; captureAddedHU = s.physics.captureHeatHU; overflowAddedHU = overflowLostEU * s.physics.overflowHeatPerEU;
      s.heatHU += captureAddedHU + overflowAddedHU; result = overflowLostEU > 0 ? 'overflow' : 'collected';
    }
    s.energyLedger.harvestedGrossEU += harvestedGrossEU; s.energyLedger.missedEU += missedEU; s.energyLedger.overflowLostEU += overflowLostEU;
    s.thermalLedger.captureAddedHU += captureAddedHU; s.thermalLedger.overflowAddedHU += overflowAddedHU;
    s.lastPulse = detached({ id: index, index, endedTick: s.tick, amountEU, charging: s.charging, result,
      energyBeforeEU, harvestedGrossEU, missedEU, overflowLostEU, energyAfterEU: s.energyEU,
      heatBeforeHU, captureAddedHU, overflowAddedHU, heatAfterHU: s.heatHU });
    s.pulseReceipts.push(s.lastPulse);
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing' || dt === 0) return s;
    if (!Number.isFinite(dt) || dt <= 0 || Math.abs(dt - 1 / 60) > 1e-12) throw new RangeError('Expected one 1/60-second interval');
    const fromTick = s.tick, doseIndexBefore = s.doseIndex, energyBeforeEU = s.energyEU, heatBeforeHU = s.heatHU, currentLockIndexBefore = s.currentLockIndex;
    const energyBefore = clone(s.energyLedger), thermalBefore = clone(s.thermalLedger);
    s.lastDischarge = null; s.lastPulse = null; s.lastCooling = null;
    s.lastInput = normalize(s, input || {}); s.charging = s.lastInput.effectiveA;
    if (s.lastInput.freshB) discharge(s);
    let peakHeatHU = Math.max(heatBeforeHU, s.heatHU);
    s.tick++; s.elapsed = s.tick / s.physics.ticksPerSecond;
    if (s.pulseCursor < s.scenario.pulseCount && s.tick === (s.pulseCursor + 1) * s.scenario.periodTicks) receivePulse(s);
    peakHeatHU = Math.max(peakHeatHU, s.heatHU);
    if (s.tick % s.physics.coolEveryTicks === 0) {
      const before = s.heatHU, cooledHU = Math.min(s.physics.coolHU, before);
      s.heatHU -= cooledHU; s.thermalLedger.cooledHU += cooledHU;
      s.lastCooling = detached({ endedTick: s.tick, heatBeforeHU: before, cooledHU, heatAfterHU: s.heatHU });
    }
    s.supply = supplyAt(s);
    const reason = peakHeatHU >= s.heatLimitHU ? 'overheat' :
      s.currentLockIndex === s.locks.length && s.energyEU >= s.reserveEU ? 'reserve_ready' :
      !s.supply.feasibleByEnergy ? 'energy_exhausted' : s.tick >= s.deadlineTick ? 'deadline' : null;
    if (reason) {
      s.phase = reason === 'reserve_ready' ? 'won' : 'lost'; s.lostReason = s.phase === 'lost' ? reason : null;
      s.terminal = detached({ reason, endedTick: s.tick, peakHeatHU });
    }
    feedback(s);
    s.lastStep = detached({ fromTick, toTick: s.tick, doseIndexBefore, doseIndexAfter: s.doseIndex,
      energyBeforeEU, energyAfterEU: s.energyEU, heatBeforeHU, heatAfterHU: s.heatHU, peakHeatHU, charging: s.charging,
      dischargeId: s.lastDischarge ? s.lastDischarge.id : null, pulseId: s.lastPulse ? s.lastPulse.id : null, cooling: s.lastCooling,
      currentLockIndexBefore, currentLockIndexAfter: s.currentLockIndex, energyLedgerDelta: delta(s.energyLedger, energyBefore),
      thermalLedgerDelta: delta(s.thermalLedger, thermalBefore), supplyAfter: s.supply, terminalAfter: s.terminal });
    return s;
  }
  return Object.freeze({ create, step });
});
