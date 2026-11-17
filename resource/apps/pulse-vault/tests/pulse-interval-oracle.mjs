// Independent public-contract algebra. No Model, pilot, input controller or gameplay calls.
export const ENERGY_KEYS = ['offeredEU', 'harvestedGrossEU', 'missedEU', 'dischargedEU', 'overflowLostEU', 'usefulToLocksEU', 'dischargeWasteEU'];
export const THERMAL_KEYS = ['captureAddedHU', 'overflowAddedHU', 'dischargeAddedHU', 'cooledHU'];
const total = values => values.reduce((sum, value) => sum + value, 0);
const require = (condition, message) => { if (!condition) throw new Error(message); };
const integer = value => Number.isSafeInteger(value) && value >= 0;

export function parseContract(markdown) {
  const line = markdown.match(/^共享常量：(.+)$/m)?.[1];
  require(line, 'Missing public shared constants');
  const physics = Object.fromEntries([...line.matchAll(/([A-Za-z][A-Za-z0-9]*)=([^；。]+)/g)].map(([, key, value]) =>
    [key, value.startsWith('[') ? JSON.parse(value) : Number(value)]));
  const scenarios = markdown.split('\n').filter(row => /^\| [a-z]+(?:-[a-z]+)+ \|/.test(row)).map(row => {
    const [id, name, period, pattern, count, thresholds, reserve, deadline] = row.split('|').slice(1, -1).map(cell => cell.trim());
    return {id, name, periodTicks: Number(period), pulsePatternEU: JSON.parse(pattern), pulseCount: Number(count),
      lockThresholdsEU: JSON.parse(thresholds), reserveEU: Number(reserve), deadlineTick: Number(deadline)};
  });
  require(Object.keys(physics).length === 12 && scenarios.length === 3, 'Unexpected public parameter shape');
  require(Object.entries(physics).every(([key, value]) => key === 'doseOptionsEU' ? value.every(integer) : Number.isFinite(value)), 'Invalid public constant');
  physics.ticksPerSecond = Number(markdown.match(/ticksPerSecond:(\d+)/)?.[1]);
  require(physics.ticksPerSecond === 60, 'Missing or changed public tick unit');
  return {physics, scenarios};
}

export function pulsePrefix(scenario, count) {
  require(integer(count) && count <= scenario.pulseCount, 'Pulse prefix outside finite source');
  const pattern = scenario.pulsePatternEU, cycles = Math.floor(count / pattern.length), remainder = count % pattern.length;
  return cycles * total(pattern) + total(pattern.slice(0, remainder));
}

export function pulseAt(scenario, index) {
  require(integer(index) && index >= 1 && index <= scenario.pulseCount, 'Invalid pulse index');
  return {index, dueTick: index * scenario.periodTicks, amountEU: scenario.pulsePatternEU[(index - 1) % scenario.pulsePatternEU.length]};
}

export function supplyAt(scenario, physics, tick, energyEU, openedCount) {
  require(integer(tick) && integer(energyEU) && integer(openedCount) && openedCount <= scenario.lockThresholdsEU.length, 'Invalid supply query');
  const processed = Math.min(scenario.pulseCount, Math.floor(tick / scenario.periodTicks));
  const eligible = Math.min(scenario.pulseCount, Math.floor(scenario.deadlineTick / scenario.periodTicks));
  const futureSupplyEU = pulsePrefix(scenario, eligible) - pulsePrefix(scenario, Math.min(eligible, processed));
  const doses = scenario.lockThresholdsEU.slice(openedCount).map(threshold => physics.doseOptionsEU.find(dose => dose >= threshold));
  require(doses.every(Number.isFinite), 'No public dose reaches a remaining threshold');
  const minimumSpendEU = total(doses), requiredEU = minimumSpendEU + scenario.reserveEU;
  const next = processed === scenario.pulseCount ? null : pulseAt(scenario, processed + 1);
  return {nextPulse: next && {...next, ticksUntil: next.dueTick - tick}, remainingPulseCount: scenario.pulseCount - processed,
    futureSupplyEU, minimumSpendEU, requiredEU, optimisticAvailableEU: energyEU + futureSupplyEU,
    feasibleByEnergy: energyEU + futureSupplyEU >= requiredEU};
}

export function dischargeTerms(energyEU, doseEU, thresholdEU, physics) {
  const spentEU = thresholdEU === null || energyEU < doseEU ? 0 : doseEU;
  const opened = thresholdEU !== null && spentEU >= thresholdEU;
  const usefulEU = opened ? thresholdEU : 0;
  return {result: thresholdEU === null ? 'no_current_lock' : energyEU < doseEU ? 'insufficient_stock' : opened ? 'opened' : 'below_threshold',
    spentEU, usefulEU, wasteEU: spentEU - usefulEU, energyAfterEU: energyEU - spentEU, heatAddedHU: spentEU / physics.dischargeHeatDivisor};
}

export function captureTerms(energyEU, amountEU, charging, physics) {
  const harvestedGrossEU = charging ? amountEU : 0;
  const overflowLostEU = Math.max(0, energyEU + harvestedGrossEU - physics.capacityEU);
  return {result: !charging ? 'missed' : overflowLostEU ? 'overflow' : 'collected', harvestedGrossEU,
    missedEU: amountEU - harvestedGrossEU, overflowLostEU, energyAfterEU: energyEU + harvestedGrossEU - overflowLostEU,
    captureAddedHU: charging ? physics.captureHeatHU : 0, overflowAddedHU: overflowLostEU * physics.overflowHeatPerEU};
}

// Both endpoints denote completed states; only cooling boundaries in (fromTick,toTick] count.
export function coolSpan(heatHU, fromTick, toTick, physics) {
  require(integer(heatHU) && integer(fromTick) && integer(toTick) && toTick >= fromTick, 'Invalid cooling span');
  const opportunities = Math.floor(toTick / physics.coolEveryTicks) - Math.floor(fromTick / physics.coolEveryTicks);
  const cooledHU = Math.min(heatHU, opportunities * physics.coolHU);
  return {heatHU: heatHU - cooledHU, cooledHU, opportunities};
}

// Input is only the independently derived heat additions at actual event intervals, never observed temperatures.
// Group all additions before endpoint cooling; no physical-tick recurrence is used between events.
export function heatCalendar(additions, horizon, physics) {
  require(integer(horizon), 'Invalid actual observation horizon');
  const grouped = new Map();
  for (const {endedTick, addedHU} of additions) {
    require(integer(endedTick) && endedTick > 0 && endedTick <= horizon && integer(addedHU), 'Invalid heat event');
    grouped.set(endedTick, (grouped.get(endedTick) || 0) + addedHU);
  }
  const anchors = [{tick: 0, heatHU: physics.initialHeatHU, cooledHU: 0, addedHU: 0, peakHeatHU: null}];
  for (const tick of [...grouped.keys()].sort((a, b) => a - b)) {
    const previous = anchors.at(-1), idle = coolSpan(previous.heatHU, previous.tick, tick - 1, physics);
    const peakHeatHU = idle.heatHU + grouped.get(tick), endpoint = coolSpan(peakHeatHU, tick - 1, tick, physics);
    anchors.push({tick, heatHU: endpoint.heatHU, cooledHU: previous.cooledHU + idle.cooledHU + endpoint.cooledHU,
      addedHU: previous.addedHU + grouped.get(tick), peakHeatHU});
  }
  function at(tick) {
    require(integer(tick) && tick <= horizon, 'Heat query outside actual corpus');
    let lo = 0, hi = anchors.length;
    while (lo + 1 < hi) { const mid = Math.floor((lo + hi) / 2); if (anchors[mid].tick <= tick) lo = mid; else hi = mid; }
    const anchor = anchors[lo], span = coolSpan(anchor.heatHU, anchor.tick, tick, physics);
    const peakHeatHU = tick === anchor.tick ? anchor.peakHeatHU : coolSpan(anchor.heatHU, anchor.tick, tick - 1, physics).heatHU;
    return {heatHU: span.heatHU, cooledHU: anchor.cooledHU + span.cooledHU, addedHU: anchor.addedHU, peakHeatHU};
  }
  function coolingAt(tick) {
    if (tick === 0 || tick % physics.coolEveryTicks !== 0) return null;
    const current = at(tick), cooledHU = Math.min(current.peakHeatHU, physics.coolHU);
    return {endedTick: tick, heatBeforeHU: current.peakHeatHU, cooledHU, heatAfterHU: current.heatHU};
  }
  return {anchors, at, coolingAt};
}

export function outcome(scenario, physics, tick, energyEU, openedCount, peakHeatHU) {
  const supply = supplyAt(scenario, physics, tick, energyEU, openedCount);
  const reason = peakHeatHU >= physics.heatLimitHU ? 'overheat' : openedCount === scenario.lockThresholdsEU.length && energyEU >= scenario.reserveEU ?
    'reserve_ready' : !supply.feasibleByEnergy ? 'energy_exhausted' : tick >= scenario.deadlineTick ? 'deadline' : null;
  const phase = reason === null ? 'playing' : reason === 'reserve_ready' ? 'won' : 'lost';
  return {phase, lostReason: phase === 'lost' ? reason : null, terminal: reason === null ? null : {reason, endedTick: tick, peakHeatHU},
    score: phase === 'won' ? 1000 + 100 * openedCount + energyEU : 100 * openedCount};
}
