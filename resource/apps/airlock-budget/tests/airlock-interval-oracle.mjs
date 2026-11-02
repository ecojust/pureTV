// Independent arithmetic from the public airlock-budget contract only.
// Constant-rate spans use cumulative closed forms, not a replay of the model.
export const HZ = 60;
export const EPS = 1e-9;
export const GROUP_IDS = ['G1', 'G2', 'G3'];
export const GROUP_RATES = [.14, .10, .08];
export const LEVELS = [
  { tank: 48, capacity: 58, reserve: 20, deadlines: [1080, 2520, 4080] },
  { tank: 54, capacity: 64, reserve: 20, deadlines: [2520, 4080, 720] },
  { tank: 48, capacity: 48, reserve: 24, deadlines: [2400, 3960, 5340] },
];
const fluxKeys = ['airRemoved', 'recovered', 'recoveryLoss', 'vented', 'filled', 'leak', 'breathing'];
const blank = (tank, air) => ({ tank, air, airRemoved: 0, recovered: 0, recoveryLoss: 0,
  vented: 0, filled: 0, leak: 0, breathing: 0, groupBreathing: [0, 0, 0], oxygenShortfall: [] });

// Only the resource-exhaustion boundary uses a single explicitly capped tick.
// This is not used to step through ordinary spans or to choose task phases.
function exhaustionTick(tank, air, capacity, phase, leakDemand, demands) {
  const result = blank(tank, air);
  if (phase === 'recover') {
    result.airRemoved = Math.min(.75 / HZ, air, Math.max(0, capacity - tank) / .9);
    result.recovered = .9 * result.airRemoved;
    result.recoveryLoss = result.airRemoved - result.recovered;
    result.tank += result.recovered;
    result.air -= result.airRemoved;
  } else if (phase === 'fill') {
    result.filled = Math.min(3 / HZ, tank, Math.max(0, 12 - air));
    result.tank -= result.filled;
    result.air += result.filled;
  } else if (phase === 'vent') {
    result.vented = Math.min(6 / HZ, air);
    result.air -= result.vented;
  }
  result.leak = Math.min(result.tank, leakDemand);
  result.tank -= result.leak;
  const totalDemand = demands.reduce((sum, value) => sum + value, 0);
  result.breathing = Math.min(result.tank, totalDemand);
  result.tank -= result.breathing;
  result.groupBreathing = demands.map(demand => totalDemand ? result.breathing * demand / totalDemand : 0);
  result.oxygenShortfall = GROUP_IDS.filter((id, i) => result.groupBreathing[i] < demands[i] - EPS);
  return result;
}

export function fixedInterval(initial, count) {
  const { tank, air, capacity, stopped, leaking, groupRates } = initial;
  const phase = stopped ? 'stopped' : initial.phase;
  const demands = groupRates.map(rate => rate / HZ);
  const demand = demands.reduce((sum, value) => sum + value, 0);
  const leakDemand = leaking ? .5 / HZ : 0;
  const consumption = leakDemand + demand;
  const netRecoveryRate = .9 * .75 / HZ;
  const headroom = Math.max(0, capacity - tank);
  const unrestricted = n => {
    const result = blank(tank, air);
    if (!n) return result;
    if (phase === 'recover') {
      // The (n-1) term preserves pump-before-consumption capacity timing.
      result.recovered = Math.min(.9 * air, n * netRecoveryRate,
        headroom + (n - 1) * Math.min(consumption, netRecoveryRate));
      result.airRemoved = result.recovered / .9;
      result.recoveryLoss = result.airRemoved - result.recovered;
    } else if (phase === 'fill') result.filled = Math.min(3 * n / HZ, 12 - air);
    else if (phase === 'vent') result.vented = Math.min(6 * n / HZ, air);
    result.leak = leakDemand * n;
    result.groupBreathing = demands.map(value => value * n);
    result.breathing = demand * n;
    result.tank = tank + result.recovered - result.filled - result.leak - result.breathing;
    result.air = air - result.airRemoved - result.vented + result.filled;
    return result;
  };
  let exhaustion = null;
  // This tiny arithmetic tolerance is below public EPS and is reported by the
  // runner. Exact gate predicates still use the contract's own EPS.
  if (unrestricted(count).tank < -1e-10) {
    let low = 1, high = count;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (unrestricted(middle).tank < -1e-10) high = middle; else low = middle + 1;
    }
    exhaustion = low;
  }
  const sample = n => {
    if (!Number.isInteger(n) || n < 0 || n > count) throw new Error('Invalid interval index');
    if (exhaustion === null || n < exhaustion) {
      const result = unrestricted(n);
      result.tank = Math.max(0, result.tank);
      return result;
    }
    const prefix = unrestricted(exhaustion - 1);
    const last = exhaustionTick(Math.max(0, prefix.tank), prefix.air, capacity, phase, leakDemand, demands);
    const result = { ...last };
    for (const key of fluxKeys) result[key] += prefix[key];
    result.groupBreathing = last.groupBreathing.map((value, i) => value + prefix.groupBreathing[i]);
    if (n > exhaustion) {
      if (demand > 0) throw new Error('Recorded span continues beyond first resource-exhaustion tick; split and review explicitly');
      // With no unfinished group, a depleted reservoir can remain empty until
      // reserve/timeout. Only independent venting can continue removing A air.
      if (phase === 'vent') {
        result.vented = Math.min(6 * n / HZ, air);
        result.air = air - result.vented;
      }
    }
    return result;
  };
  return { sample, exhaustionTick: exhaustion, phase, leakDemand, demands };
}

export function terminal({ tick, air, bDoor, cDoor, groups, isolated, tank, reserve, shortfalls }) {
  if ((bDoor && (air > EPS || cDoor)) || (cDoor && (air < 12 - EPS || bDoor))) return 'pressure';
  if (shortfalls.length) return 'oxygen';
  if (groups.some(group => group.location !== 'C' && tick >= group.deadlineTick)) return 'deadline';
  if (isolated && groups.every(group => group.location === 'C')) return tank + EPS >= reserve ? 'won' : 'reserve';
  if (tick >= 5400) return 'timeout';
  return null;
}
