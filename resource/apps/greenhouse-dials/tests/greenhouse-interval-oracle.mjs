// Independent arithmetic from docs/model-contract.md only. No production imports.
// Climate is evaluated by geometric sums over constant-forcing intervals;
// no endpoint is computed by an Euler recurrence over previous tick samples.
export const HZ = 60;
export const dimensions = ['temperature', 'humidity', 'soilMoisture'];
export const dialIds = ['vent', 'shade', 'drip'];
export const cropIds = ['C1', 'C2', 'C3'];
export const comfort = [[22, 28.5, 55, 75, 45, 68], [25, 32, 45, 68, 35, 60], [24, 30, 50, 72, 40, 64]];
export const safe = [[12, 37, 25, 95, 15, 90], [12, 41, 20, 95, 10, 88], [12, 39, 25, 95, 12, 90]];
export const levels = [
  { initial: [30, 60, 48], water: 24, heat: [.90, 1.45, .60], delay: 90, maturity: [1800, 2280, 2040] },
  { initial: [31, 58, 44], water: 23, heat: [1.05, 1.65, .65], delay: 120, maturity: [1980, 2460, 2220] },
  { initial: [29, 62, 52], water: 22, heat: [.80, 1.55, .55], delay: 150, maturity: [2160, 2640, 2400] },
];
export const damageLimits = [480, 600, 540];
const clip = (x, low, high) => Math.max(low, Math.min(high, x));
const env = values => Object.fromEntries(dimensions.map((key, i) => [key, values[i]]));
const firstTrue = (low, high, predicate) => {
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (predicate(mid)) high = mid; else low = mid + 1;
  }
  return low;
};

// For a monotone sequence, return the first index whose predicate differs.
function signCut(length, predicate) {
  if (length < 2 || predicate(0) === predicate(length - 1)) return length;
  const first = predicate(0);
  return firstTrue(1, length - 1, i => predicate(i) !== first);
}

function decay(initial, equilibrium, ratio, ceiling) {
  const logarithm = Math.log(ratio);
  const raw = k => equilibrium + (initial - equilibrium) * Math.exp(k * logarithm);
  const value = k => clip(raw(k), 0, ceiling);
  const sumRaw = (start, count) => equilibrium * count + (initial - equilibrium) *
    Math.exp(start * logarithm) * (-Math.expm1(count * logarithm)) / (1 - ratio);
  return { raw, value, sumRaw };
}

export function climateInterval(initial, count, heat, applied, usedPerTick) {
  const [v, s] = applied;
  const t = decay(initial.temperature, 24 + (heat * (1 - .30 * s) - .35 * v) / .08, 1 - .08 / HZ, 60);
  const h = decay(initial.humidity, 45 + (.55 - .40 * v + .80 * usedPerTick * HZ) / .035, 1 - .035 / HZ, 100);
  const base = .35 + .08 * v - .06 * s;
  if (base < 0) throw new Error('Oracle is restricted to the public nonnegative evaporation base');
  // Split the old-temperature sum at both clamp edges and the hot threshold.
  const temperatureCuts = [...new Set([0, count, signCut(count, k => t.raw(k) >= 0),
    signCut(count, k => t.raw(k) > 24), signCut(count, k => t.raw(k) >= 60)])].sort((a, b) => a - b);
  const hotSum = n => {
    let total = 0;
    for (let j = 0; j + 1 < temperatureCuts.length; j++) {
      const from = temperatureCuts[j], to = Math.min(n, temperatureCuts[j + 1]);
      if (to <= from) continue;
      const value = t.value(from), length = to - from;
      if (value >= 60) total += 36 * length;
      else if (value > 24) total += t.sumRaw(from, length) - 24 * length;
    }
    return total;
  };
  const baseGain = 2 * usedPerTick - base / HZ;
  const cumulative = n => n * baseGain - .025 / HZ * hotSum(n);
  const increment = k => baseGain - .025 / HZ * Math.max(t.value(k) - 24, 0);
  // Soil increments are monotone because T is monotone. Split at their sign
  // change, then at the first clamp hit within each monotone moisture run.
  const soilCuts = [...new Set([0, signCut(count, k => increment(k) >= 0), count])].sort((a, b) => a - b);
  const soilPieces = [];
  let moisture = initial.soilMoisture;
  for (let j = 0; j + 1 < soilCuts.length; j++) {
    const from = soilCuts[j], to = soilCuts[j + 1], start = moisture;
    const raw = k => start + cumulative(k) - cumulative(from);
    const increasing = increment(from) >= 0;
    const bound = increasing ? 100 : 0;
    const reaches = k => increasing ? raw(k) >= 100 : raw(k) <= 0;
    const hit = reaches(to) ? firstTrue(from + 1, to, reaches) : to + 1;
    soilPieces.push({ from, to: Math.min(to, hit), origin: from, start, kind: 'sum' });
    if (hit < to) soilPieces.push({ from: hit, to, value: bound, kind: 'clamp' });
    moisture = clip(raw(to), 0, 100);
  }
  const sample = k => {
    if (!Number.isInteger(k) || k < 0 || k > count) throw new Error('Invalid interval index');
    if (k === 0) return { ...initial };
    const piece = soilPieces.find(part => k > part.from && k <= part.to);
    const m = piece.kind === 'clamp' ? piece.value : clip(piece.start + cumulative(k) - cumulative(piece.origin), 0, 100);
    return env([t.value(k), h.value(k), m]);
  };
  return { sample, temperatureCuts, soilPieces };
}

export function weather(level, oldTick) {
  const index = oldTick < 1080 ? 0 : oldTick < 2520 ? 1 : 2;
  return { id: ['dawn', 'noon', 'late'][index], from: [0, 18, 42][index], to: [18, 42, 90][index], heatInput: level.heat[index] };
}

// Public d=0/1/2 spends 0/1/2 units of 1/120 litre per tick. Authored initial
// reservoirs are integral in those units, avoiding repeated-subtraction drift.
export function waterPhases(units, drip, count) {
  if (!drip || units <= 0) return [{ count, unitsPerTick: 0 }];
  const full = Math.min(count, Math.floor(units / drip));
  const phases = full ? [{ count: full, unitsPerTick: drip }] : [];
  let remaining = count - full;
  const residual = units - full * drip;
  if (remaining && residual > 0) { phases.push({ count: 1, unitsPerTick: residual }); remaining--; }
  if (remaining) phases.push({ count: remaining, unitsPerTick: 0 });
  return phases;
}

export function climateTrajectory(level, commands, finalTick) {
  const changes = new Map();
  for (const command of commands) {
    if (command.dueTick <= finalTick) changes.set(command.dueTick - 1, command);
  }
  const cuts = [...new Set([0, finalTick, 1080, 2520, ...changes.keys()])]
    .filter(x => x >= 0 && x <= finalTick).sort((a, b) => a - b);
  const initial = env(level.initial);
  const samples = [{ environment: initial, water: level.water, usedTotal: 0, applied: [0, 0, 0] }];
  const segments = [];
  let current = initial, units = level.water * 120, applied = [0, 0, 0];
  for (let i = 0; i + 1 < cuts.length; i++) {
    let from = cuts[i];
    const command = changes.get(from);
    if (command) applied[dialIds.indexOf(command.dialId)] = command.afterRequested;
    const period = weather(level, from);
    for (const phase of waterPhases(units, applied[2], cuts[i + 1] - from)) {
      const used = phase.unitsPerTick / 120;
      const curve = climateInterval(current, phase.count, period.heatInput, applied, used);
      segments.push({ fromTick: from, toTick: from + phase.count, applied: [...applied], heatInput: period.heatInput,
        usedPerTick: used, temperatureCuts: curve.temperatureCuts, soilPieces: curve.soilPieces });
      for (let k = 1; k <= phase.count; k++) {
        const water = Math.max(0, (units - k * phase.unitsPerTick) / 120);
        samples[from + k] = { environment: curve.sample(k), water, usedTotal: level.water - water,
          applied: [...applied], used, weather: period };
      }
      current = curve.sample(phase.count);
      units = Math.max(0, units - phase.count * phase.unitsPerTick);
      from += phase.count;
    }
  }
  return { samples, segments };
}

export function classify(environment, cropIndex) {
  const checks = {}, failed = [], unsafe = [];
  dimensions.forEach((key, i) => {
    const value = environment[key], c = comfort[cropIndex], s = safe[cropIndex];
    checks[key] = value >= c[2 * i] && value <= c[2 * i + 1];
    if (!checks[key]) failed.push(key);
    if (value < s[2 * i] || value > s[2 * i + 1]) unsafe.push(key);
  });
  return { comfortChecks: checks, failedComfortDimensions: failed, unsafeDimensions: unsafe,
    inRange: failed.length === 0, dangerous: unsafe.length > 0 };
}

export function cropTrajectory(level, climate) {
  const growth = [0, 0, 0], damage = [0, 0, 0], states = [];
  let stall = 0, firstTerminal = null, nearestBoundary = null;
  const ambiguousBoundaries = [];
  for (let tick = 0; tick < climate.length; tick++) {
    const state = climate[tick];
    const crops = cropIds.map((id, i) => {
      const gate = classify(state.environment, i);
      const growing = tick > 0 && growth[i] < level.maturity[i] && gate.inRange;
      if (growing) growth[i]++;
      if (tick > 0 && gate.dangerous) damage[i]++;
      if (tick > 0) dimensions.forEach((key, j) => {
        for (const kind of ['comfort', 'safe']) for (const edge of (kind === 'comfort' ? comfort : safe)[i].slice(2 * j, 2 * j + 2)) {
          const margin = Math.abs(state.environment[key] - edge);
          const item = { tick, crop: id, dimension: key, kind, edge, margin };
          if (!nearestBoundary || margin < nearestBoundary.margin) nearestBoundary = item;
          if (margin <= 1e-8) ambiguousBoundaries.push(item);
        }
      });
      return { id, ...gate, growthTicks: growth[i], damageTicks: damage[i], growing,
        mature: growth[i] >= level.maturity[i], dead: damage[i] >= damageLimits[i] };
    });
    const unfinishedCropIds = crops.filter(c => !c.mature).map(c => c.id);
    const deadCropIds = crops.filter(c => c.dead).map(c => c.id);
    if (tick > 0) stall = state.water <= 1e-9 && unfinishedCropIds.length &&
      !crops.some(c => !c.mature && c.growing) ? stall + 1 : 0;
    const reason = deadCropIds.length ? 'crop' : !unfinishedCropIds.length ? 'won' : stall >= 180 ? 'water' : tick >= 5400 ? 'timeout' : null;
    if (reason && !firstTerminal) firstTerminal = { tick, reason };
    const phase = reason === 'won' ? 'won' : reason ? 'lost' : 'playing';
    let score = crops.reduce((sum, c, i) => sum + (c.mature ? 200 : Math.floor(200 * c.growthTicks / level.maturity[i])), 0);
    if (phase === 'won') score += 1000 + Math.floor(state.water + 1e-8);
    states.push({ crops, dryStallTicks: stall, unfinishedCropIds, deadCropIds, matureCount: 3 - unfinishedCropIds.length,
      phase, lostReason: phase === 'lost' ? reason : null, score });
  }
  return { states, firstTerminal, nearestBoundary, ambiguousBoundaries };
}
