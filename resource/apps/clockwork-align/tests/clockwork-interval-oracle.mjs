// Public integer geometry and interval-set algebra; no controller or tick replay.
const MAX = BigInt(Number.MAX_SAFE_INTEGER);
function integer(value, label, minimum = -Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new RangeError(label);
  return value === 0 ? 0 : value;
}
const big = (value, label, minimum) => BigInt(integer(value, label, minimum));
function number(value, label) {
  if (value < -MAX || value > MAX) throw new RangeError(label);
  return Number(value); // BigInt zero converts to positive zero.
}
function floorDiv(numerator, denominator) {
  const quotient = numerator / denominator, remainder = numerator % denominator;
  return quotient - (remainder < 0n ? 1n : 0n);
}
const ceilDiv = (numerator, denominator) => -floorDiv(-numerator, denominator);
function bandArguments(target, tolerance, period) {
  const tau = big(target, 'target', 0), d = big(tolerance, 'tolerance', 0), p = big(period, 'period', 1);
  if (tau >= p || 2n * d >= p) throw new RangeError('normalized target / unique circular band');
  return {tau, d, p};
}

export function readParameters(contractText) {
  const match = /^## Public level data\s*\n+```json\s*\n([\s\S]*?)\n```/m.exec(contractText);
  if (!match) throw new Error('missing public level data');
  const parameters = JSON.parse(match[1]);
  if (parameters.identity?.gameId !== 32 || parameters.identity?.slug !== 'clockwork-align') throw new Error('unexpected contract');
  return parameters;
}

export function deriveSpeeds(train, motorSpeed) {
  if (!Array.isArray(train.meshChain) || !Array.isArray(train.gears) || !train.meshChain.length) throw new TypeError('gear chain');
  const gears = new Map(train.gears.map(gear => {
    if (typeof gear.id !== 'string' || !gear.id.length) throw new TypeError('gear id');
    return [gear.id, big(gear.teeth, 'tooth count', 1)];
  }));
  const chain = train.meshChain;
  if (gears.size !== train.gears.length || chain.length !== gears.size || new Set(chain).size !== gears.size || !chain.every(id => gears.has(id))) {
    throw new Error('mesh chain must contain every physical gear exactly once');
  }
  let velocity = big(motorSpeed, 'driver speed');
  return Object.fromEntries(chain.map((id, index) => {
    if (index) {
      const numerator = -velocity * gears.get(chain[index - 1]), divisor = gears.get(id);
      if (numerator % divisor !== 0n) throw new RangeError('noninteger mesh velocity');
      velocity = numerator / divisor;
    }
    return [id, number(velocity, 'derived gear speed')];
  }));
}

export function mod(value, period) {
  const p = big(period, 'period', 1), remainder = big(value, 'angular value') % p;
  return number(remainder < 0n ? remainder + p : remainder, 'normalized phase');
}
export function phaseAt(start, speed, count) {
  return number(big(start, 'starting phase') + big(speed, 'phase speed') * big(count, 'interval count', 0), 'ending phase');
}
export function pointerAt(q, target, tolerance, period) {
  const phase = big(q, 'pointer phase'), {tau, d, p} = bandArguments(target, tolerance, period);
  const residue = ((phase - tau) % p + p) % p, error = 2n * residue >= p ? residue - p : residue;
  return {unwrappedUnits: number(phase, 'pointer phase'), normalizedUnits: mod(q, period),
    signedErrorUnits: number(error, 'signed error'), instantAligned: (error < 0n ? -error : error) <= d};
}
export function bandIndex(a, b, target, tolerance, period) {
  const from = big(a, 'interval start'), to = big(b, 'interval end'), {tau, d, p} = bandArguments(target, tolerance, period);
  const lowerNumerator = (from > to ? from : to) - tau - d, upperNumerator = (from < to ? from : to) - tau + d;
  number(lowerNumerator, 'lower band numerator'); number(upperNumerator, 'upper band numerator');
  const lower = ceilDiv(lowerNumerator, p), upper = floorDiv(upperNumerator, p);
  return lower <= upper ? number(lower, 'containing band index') : null;
}

// Inclusive offsets n describe complete intervals [n,n+1], not endpoint samples.
export function alignedRanges({phaseUnits, speedUnitsPerTick, targetUnits, toleranceUnits, periodUnits, intervalCount}) {
  const q = big(phaseUnits, 'span phase'), v = big(speedUnitsPerTick, 'span speed'), n = big(intervalCount, 'span intervals', 0);
  const {tau, d, p} = bandArguments(targetUnits, toleranceUnits, periodUnits), w = v < 0n ? -v : v;
  if (n === 0n || w > 2n * d) return [];
  const end = BigInt(phaseAt(phaseUnits, speedUnitsPerTick, intervalCount));
  if (v === 0n) return bandIndex(phaseUnits, phaseUnits, targetUnits, toleranceUnits, periodUnits) === null ? [] : [{first: 0, last: number(n - 1n, 'last offset')}];
  const minimum = q < end ? q : end, maximum = q > end ? q : end;
  const firstBand = ceilDiv(minimum + w - tau - d, p), lastBand = floorDiv(maximum - w - tau + d, p), rows = [];
  for (let k = firstBand; k <= lastBand; k++) {
    const a = tau - d + k * p - q - (v < 0n ? v : 0n);
    const b = tau + d + k * p - q - (v > 0n ? v : 0n);
    let first = v > 0n ? ceilDiv(a, v) : ceilDiv(-b, w), last = v > 0n ? floorDiv(b, v) : floorDiv(-a, w);
    if (first < 0n) first = 0n; if (last >= n) last = n - 1n;
    if (first <= last) rows.push({first: number(first, 'first offset'), last: number(last, 'last offset')});
  }
  return mergeRanges(rows);
}

export function mergeRanges(rows) {
  if (!Array.isArray(rows)) throw new TypeError('interval ranges');
  const sorted = rows.map(row => ({first: integer(row.first, 'range first', 0), last: integer(row.last, 'range last', row.first)}))
    .sort((a, b) => a.first - b.first || a.last - b.last), merged = [];
  for (const row of sorted) {
    const previous = merged.at(-1);
    if (previous && BigInt(row.first) <= BigInt(previous.last) + 1n) previous.last = Math.max(previous.last, row.last);
    else merged.push({...row});
  }
  return merged;
}
export function intersectRanges(a, b) {
  const left = mergeRanges(a), right = mergeRanges(b), result = []; let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    const first = Math.max(left[i].first, right[j].first), last = Math.min(left[i].last, right[j].last);
    if (first <= last) result.push({first, last});
    if (left[i].last < right[j].last) i++; else j++;
  }
  return mergeRanges(result);
}

// Ranges already include the appointment and all pointers, in absolute start ticks.
export function holdAt(ranges, boundaryTick) {
  integer(boundaryTick, 'hold boundary', 0);
  const run = mergeRanges(ranges).find(row => row.first <= boundaryTick - 1 && boundaryTick - 1 <= row.last);
  return run ? {holdTicks: boundaryTick - run.first, holdStartTick: run.first} : {holdTicks: 0, holdStartTick: null};
}
export function firstHoldEnd(ranges, required) {
  const length = big(required, 'required hold', 1);
  const run = mergeRanges(ranges).find(row => BigInt(row.last) - BigInt(row.first) + 1n >= length);
  return run ? number(BigInt(run.first) + length, 'hold completion boundary') : null;
}
