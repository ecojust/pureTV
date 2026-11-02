/** Independent public-contract interval arithmetic. No Model or pilot imports. */
export const COMPARISON_TOLERANCE = 1e-8;
export const PHYSICS = {
  ticksPerSecond: 60, timeBudgetTicks: 5400,
  startRadius: 210, coreRadius: 18, exitRadius: 210,
  initialDurability: 4, baseRadialSpeed: 7.5, resistanceSpeedPenalty: 0.5,
  ringHalfThickness: 5,
  emptyProbe: { radialHalfLength: 2, angularHalfWidthDegrees: 2 },
  keyProbe: { radialHalfLength: 4, angularHalfWidthDegrees: 5 },
  neutralAxisThreshold: 0.35, driveAxisThreshold: 0.55,
  radialBoundaryMargin: 1e-9, angularBoundaryMarginDegrees: 1e-9,
  independentNumericComparisonTolerance: 1e-8, keyScore: 100, winScore: 1000,
};
const ring = (id, radius, gapHalfWidthDegrees, initialAngleDegrees, gearRatio) =>
  ({ id, radius, halfThickness: 5, gapHalfWidthDegrees, initialAngleDegrees, gearRatio });
export const SCENARIOS = [
  { id: 'brass-triad', name: '黄铜三联', outerRateDegreesPerSecond: 36,
    rings: [ring('outer', 180, 38, 90, 1), ring('middle', 126, 36, 210, -1), ring('inner', 72, 34, 300, 2)] },
  { id: 'countergear-room', name: '反向齿室', outerRateDegreesPerSecond: 42,
    rings: [ring('outer', 184, 34, 225, 1), ring('middle', 128, 32, 60, 2), ring('inner', 68, 30, 150, -2)] },
  { id: 'triple-core', name: '三倍锁核', outerRateDegreesPerSecond: 48,
    rings: [ring('outer', 188, 30, 315, 1), ring('middle', 124, 28, 180, -2), ring('inner', 60, 26, 45, 3)] },
];
export function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
export const finite = value => typeof value === 'number' && Number.isFinite(value);
export const zero = value => value === 0 ? 0 : value;
export const clampRadius = value => Math.min(210, Math.max(18, value));
export const wrap360 = value => zero(((value % 360) + 360) % 360);
export const signedGap = value => zero(wrap360(value + 180) - 180);
export const speed = resistance => 7.5 - 0.5 * resistance;
export function envelope(hasKey, radius) {
  const dimensions = hasKey ? PHYSICS.keyProbe : PHYSICS.emptyProbe;
  return { ...dimensions, innerRadius: radius - dimensions.radialHalfLength,
    outerRadius: radius + dimensions.radialHalfLength };
}
export function limits(item, hasKey) {
  const shape = hasKey ? PHYSICS.keyProbe : PHYSICS.emptyProbe;
  return {
    effectiveInnerRadius: item.radius - 5 - shape.radialHalfLength + 1e-9,
    effectiveOuterRadius: item.radius + 5 + shape.radialHalfLength - 1e-9,
    effectiveSafeHalfWidthDegrees: item.gapHalfWidthDegrees - shape.angularHalfWidthDegrees + 1e-9,
  };
}
const BUTTONS = ['a', 'b', 'aPressed', 'bPressed', 'start', 'select',
  'startPressed', 'selectPressed', 'confirm', 'retry', 'cancelled'];
export function normalizeControls(previous, supplied, tick) {
  invariant(supplied !== null && typeof supplied === 'object' && !Array.isArray(supplied), 'Input must be an object');
  const axis = name => !Object.hasOwn(supplied, name) ? { value: 0, valid: true } :
    finite(supplied[name]) ? { value: Math.max(-1, Math.min(1, supplied[name])), valid: true } : { value: 0, valid: false };
  const x = axis('x'), y = axis('y');
  const menuValid = !Object.hasOwn(supplied, 'menuDelta') || finite(supplied.menuDelta);
  const menuDelta = finite(supplied.menuDelta) ? supplied.menuDelta : 0;
  const cancelEpoch = finite(supplied.cancelEpoch) ? Math.floor(Math.max(0, supplied.cancelEpoch)) : 0;
  const buttons = Object.fromEntries(BUTTONS.map(name => [name, supplied[name] === true]));
  const fullNeutral = x.valid && y.valid && Math.abs(x.value) <= 0.35 && Math.abs(y.value) <= 0.35 &&
    menuValid && menuDelta === 0 && BUTTONS.every(name => !buttons[name]);
  const epochChanged = previous.inputState.cancelEpoch !== cancelEpoch;
  let quarantined = previous.inputState.quarantined || epochChanged || buttons.cancelled;
  let impactLocked = previous.inputState.impactLocked;
  let mode = 'active';
  if ((quarantined || impactLocked) && fullNeutral) {
    quarantined = false; impactLocked = false; mode = 'neutral_ack';
  } else if (quarantined) mode = 'quarantine';
  else if (impactLocked) mode = 'impact_lock';
  const a = buttons.a || buttons.aPressed, b = buttons.b || buttons.bPressed;
  const requested = {
    drive: x.valid && y.valid ? (x.value >= 0.55 ? 1 : x.value <= -0.55 ? -1 : 0) : 0,
    radial: a === b ? 0 : a ? -1 : 1, a, b,
  };
  const effective = mode === 'active' ? { ...requested } : { drive: 0, radial: 0, a: false, b: false };
  const raw = Object.fromEntries(['x', 'y', 'menuDelta', 'cancelEpoch'].map(name =>
    [name, finite(supplied[name]) ? supplied[name] : null]));
  Object.assign(raw, buttons);
  return {
    tick, raw, x: zero(x.value), y: zero(y.value), menuDelta: zero(menuDelta),
    axesValid: x.valid && y.valid, menuDeltaValid: menuValid, cancelEpoch, epochChanged, fullNeutral, mode,
    quarantinedBefore: previous.inputState.quarantined, quarantinedAfter: quarantined,
    impactLockedBefore: previous.inputState.impactLocked, impactLockedAfterInput: impactLocked,
    neutralAcknowledged: mode === 'neutral_ack', requested, effective,
  };
}

// Continuous real intervals: membership flags belong to the actual set, not an EPS-expanded set.
function interval(start, end, startIncluded, endIncluded) {
  start = zero(start); end = zero(end);
  return start < end || (start === end && startIncluded && endIncluded) ?
    { start, end, startIncluded, endIncluded } : null;
}
const UNIT = { start: 0, end: 1, startIncluded: true, endIncluded: true };
function intersect(a, b) {
  if (!a || !b) return null;
  const start = Math.max(a.start, b.start), end = Math.min(a.end, b.end);
  return interval(start, end,
    (start !== a.start || a.startIncluded) && (start !== b.start || b.startIncluded),
    (end !== a.end || a.endIncluded) && (end !== b.end || b.endIncluded));
}
function contains(range, value) {
  return range && (value > range.start || value === range.start && range.startIncluded) &&
    (value < range.end || value === range.end && range.endIncluded);
}
function subtract(a, b) {
  const overlap = intersect(a, b);
  if (!overlap) return [a];
  return [interval(a.start, overlap.start, a.startIncluded, contains(a, overlap.start) && !overlap.startIncluded),
    interval(overlap.end, a.end, contains(a, overlap.end) && !overlap.endIncluded, a.endIncluded)].filter(Boolean);
}
function affineRange(origin, delta, low, high, lowIncluded, highIncluded) {
  if (delta === 0) return ((origin > low || lowIncluded && origin === low) &&
    (origin < high || highIncluded && origin === high)) ? { ...UNIT } : null;
  const a = (low - origin) / delta, b = (high - origin) / delta;
  return intersect(UNIT, delta > 0 ? interval(a, b, lowIncluded, highIncluded) : interval(b, a, highIncluded, lowIncluded));
}
function radialRange(r0, dr, low, high) {
  // Preimage of the strict band under clamp, including the constant endpoint tails.
  if (low >= 210 || high <= 18 || low >= high) return null;
  return affineRange(r0, dr, low < 18 ? -Infinity : low, high > 210 ? Infinity : high, false, false);
}
function periodCandidates(first, last, halfWidth) {
  const lo = Math.min(first, last), hi = Math.max(first, last);
  const result = [];
  for (let k = Math.floor((lo - halfWidth) / 360) - 1; k <= Math.ceil((hi + halfWidth) / 360) + 1; k++) result.push(k);
  return result;
}
export function analyzeRing(item, hasKey, r0, dr, q0, dq) {
  const bound = limits(item, hasKey), low = bound.effectiveInnerRadius, high = bound.effectiveOuterRadius;
  const width = bound.effectiveSafeHalfWidthDegrees;
  const theta0 = item.initialAngleDegrees + item.gearRatio * q0, delta = item.gearRatio * dq;
  const radial = radialRange(r0, dr, low, high);
  const output = { id: item.id, ...bound, unwrappedAngleBefore: theta0, plannedDeltaDegrees: delta,
    radialInterval: radial, angleAtIntervalStart: null, angleAtIntervalEnd: null,
    safeComponentIndex: null, firstUnsafeFraction: null, unsafeComponent: null };
  if (!radial) return output;
  const first = theta0 + delta * radial.start, last = theta0 + delta * radial.end;
  output.angleAtIntervalStart = first; output.angleAtIntervalEnd = last;
  let unsafe = [radial];
  for (const k of periodCandidates(first, last, width)) {
    const safeLow = 360 * k - width, safeHigh = 360 * k + width;
    if (first >= safeLow && first <= safeHigh && last >= safeLow && last <= safeHigh) output.safeComponentIndex = k;
    const safe = affineRange(theta0, delta, safeLow, safeHigh, true, true);
    if (safe) unsafe = unsafe.flatMap(part => subtract(part, safe));
  }
  unsafe.sort((a, b) => a.start - b.start || Number(b.startIncluded) - Number(a.startIncluded));
  if (unsafe.length) {
    output.unsafeComponent = unsafe[0]; output.firstUnsafeFraction = unsafe[0].start;
    output.safeComponentIndex = null;
  }
  return output;
}
export function plannedMotion(previous, controls) {
  const scenario = SCENARIOS[previous.difficulty];
  invariant(scenario, 'Unknown difficulty');
  const dr = controls.effective.radial * speed(previous.resistance) / 60;
  const dq = controls.effective.drive * scenario.outerRateDegreesPerSecond / 60;
  const checks = scenario.rings.map(item => analyzeRing(item, previous.hasKey,
    previous.probeRadius, dr, previous.driveAngleDegrees, dq));
  const hits = checks.filter(item => item.firstUnsafeFraction !== null);
  const candidateFraction = hits.length ? Math.min(...hits.map(item => item.firstUnsafeFraction)) : 1;
  const tiedRingIds = hits.filter(item => item.firstUnsafeFraction === candidateFraction).map(item => item.id);
  return { scenario, dr, dq, checks, candidateFraction, hasCollision: hits.length > 0,
    primaryRingId: tiedRingIds[0] ?? null, tiedRingIds };
}
export function endpoint(previous, motion, fraction) {
  // Keep these operations separate: do not replace them with theta0 + delta*f.
  const radius = Math.min(210, Math.max(18, previous.probeRadius + motion.dr * fraction));
  const q = previous.driveAngleDegrees + motion.dq * fraction;
  return { radius, q, angles: motion.scenario.rings.map(item => item.initialAngleDegrees + item.gearRatio * q) };
}
export function endpointIsSafe(previous, motion, fraction) {
  const point = endpoint(previous, motion, fraction);
  return motion.scenario.rings.every((item, index) => {
    const bound = limits(item, previous.hasKey);
    if (!(point.radius > bound.effectiveInnerRadius && point.radius < bound.effectiveOuterRadius)) return true;
    const angle = point.angles[index], k = Math.round(angle / 360), width = bound.effectiveSafeHalfWidthDegrees;
    return angle >= 360 * k - width && angle <= 360 * k + width;
  });
}

// Nonnegative finite binary64 bit patterns have the same order as their numeric values.
// Inverse monotone ranges avoid an unbounded walk through individual ULPs near zero.
const floatBuffer = new ArrayBuffer(8), floatView = new DataView(floatBuffer);
function bits(value) { floatView.setFloat64(0, zero(value), false); return floatView.getBigUint64(0, false); }
function fromBits(value) { floatView.setBigUint64(0, value, false); return floatView.getFloat64(0, false); }
function lowerBound(maximum, predicate) {
  let lo = 0n, hi = maximum + 1n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1n;
    if (predicate(mid)) hi = mid; else lo = mid + 1n;
  }
  return lo;
}
function discreteRange(maximum, valueAt, increasing, low, high, lowIncluded, highIncluded) {
  if (!increasing) {
    const original = valueAt; valueAt = index => -original(index);
    [low, high] = [-high, -low]; [lowIncluded, highIncluded] = [highIncluded, lowIncluded];
  }
  const start = lowerBound(maximum, index => lowIncluded ? valueAt(index) >= low : valueAt(index) > low);
  const stop = lowerBound(maximum, index => highIncluded ? valueAt(index) > high : valueAt(index) >= high);
  return start < stop ? { start, end: stop - 1n } : null;
}
function discreteSubtract(source, cover) {
  if (!cover || cover.end < source.start || cover.start > source.end) return [source];
  const result = [];
  if (source.start < cover.start) result.push({ start: source.start, end: cover.start - 1n });
  if (source.end > cover.end) result.push({ start: cover.end + 1n, end: source.end });
  return result;
}
export function normalizedFraction(previous, motion, candidateFraction) {
  invariant(finite(candidateFraction) && candidateFraction >= 0 && candidateFraction <= 1, 'Invalid candidate fraction');
  if (!endpointIsSafe(previous, motion, 0)) {
    invariant(motion.hasCollision && candidateFraction === 0, 'Overlapping fixture must collide at zero');
    return 0;
  }
  if (endpointIsSafe(previous, motion, candidateFraction)) return candidateFraction;
  const maximum = bits(candidateFraction), forbidden = [];
  const radiusAt = index => endpoint(previous, motion, fromBits(index)).radius;
  for (let i = 0; i < motion.scenario.rings.length; i++) {
    const item = motion.scenario.rings[i], bound = limits(item, previous.hasKey);
    const radial = discreteRange(maximum, radiusAt, motion.dr >= 0,
      bound.effectiveInnerRadius, bound.effectiveOuterRadius, false, false);
    if (!radial) continue;
    const angleAt = index => endpoint(previous, motion, fromBits(index)).angles[i];
    let unsafe = [radial];
    const width = bound.effectiveSafeHalfWidthDegrees;
    for (const k of periodCandidates(angleAt(0n), angleAt(maximum), width)) {
      const safe = discreteRange(maximum, angleAt, item.gearRatio * motion.dq >= 0,
        360 * k - width, 360 * k + width, true, true);
      unsafe = unsafe.flatMap(part => discreteSubtract(part, safe));
    }
    forbidden.push(...unsafe);
  }
  forbidden.sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : a.end < b.end ? -1 : a.end > b.end ? 1 : 0);
  const merged = [];
  for (const current of forbidden) {
    const tail = merged[merged.length - 1];
    if (tail && current.start <= tail.end + 1n) tail.end = current.end > tail.end ? current.end : tail.end;
    else merged.push({ ...current });
  }
  let chosen = maximum;
  for (let i = merged.length - 1; i >= 0; i--) {
    if (chosen > merged[i].end) break;
    if (chosen >= merged[i].start) chosen = merged[i].start - 1n;
  }
  invariant(chosen >= 0n && chosen < maximum, 'No safe representable fraction found');
  const result = fromBits(chosen);
  invariant(candidateFraction - result <= 1e-8 && endpointIsSafe(previous, motion, result), 'Numerical submission exceeds its fixed bound');
  return result;
}
