// Independent closed-form geometry and stamina accounting from the public contract.
// No gameplay state machine, observed-coordinate integration, or per-tick simulation.
function integer(value, label, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new RangeError(label);
  return value;
}

function point(value, label) {
  if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)) throw new RangeError(label);
  return {x: value.x, y: value.y};
}

function checkMode(mode) {
  if (!['home', 'field', 'flying'].includes(mode)) throw new RangeError('swarm mode');
}

function geometry(origin, destination, physics) {
  const speed = physics.speedPixelsPerTick, tolerance = physics.flightLengthSnapTolerancePixels;
  if (!Number.isFinite(speed) || speed <= 0 || !Number.isFinite(tolerance) || tolerance < 0) {
    throw new RangeError('flight physics');
  }
  const dx = destination.x - origin.x, dy = destination.y - origin.y;
  const rawLengthPx = Math.hypot(dx, dy);
  if (!Number.isFinite(rawLengthPx)) throw new RangeError('flight length');
  const nearestStepLength = speed * Math.round(rawLengthPx / speed);
  const scheduleLengthPx = Math.abs(rawLengthPx - nearestStepLength) <= tolerance ? nearestStepLength : rawLengthPx;
  const durationTicks = integer(Math.max(1, Math.ceil(scheduleLengthPx / speed)), 'flight duration', 1);
  return {dx, dy, rawLengthPx, scheduleLengthPx, durationTicks,
    nominalDirection: rawLengthPx === 0 ? {x: 0, y: 0} : {x: dx / rawLengthPx, y: dy / rawLengthPx}};
}

export function readParameters(contractText) {
  const match = /^## Public level data\s*\n+```json\s*\n([\s\S]*?)\n```/m.exec(contractText);
  if (!match) throw new Error('missing public level data');
  const parameters = JSON.parse(match[1]);
  if (parameters.id !== 29 || parameters.slug !== 'pollinator-contract') throw new Error('unexpected contract');
  return parameters;
}

export function makeFlight(id, fromTick, origin, destination, physics) {
  integer(id, 'flight id', 1); integer(fromTick, 'flight fromTick');
  const start = point(origin, 'flight origin'), end = point(destination, 'flight destination');
  if (typeof destination.id !== 'string' || destination.id.length === 0) throw new TypeError('destination id');
  return {id, fromTick, startedAtTick: integer(fromTick + 1, 'flight startedAtTick', 1),
    origin: start, destination: {id: destination.id, ...end}, ...geometry(start, end, physics), ageTicks: 0};
}

// Absolute age is measured from the pre-command tick. The command interval is age 1.
// Re-derive the segment rather than trusting supplied age or other derived fields.
export function flightAt(flight, tick, physics) {
  integer(tick, 'flight query tick');
  const base = makeFlight(flight.id, flight.fromTick, flight.origin, flight.destination, physics);
  const ageTicks = tick - base.fromTick;
  if (ageTicks < 0 || ageTicks > base.durationTicks) throw new RangeError('query outside flight segment');
  const arrived = ageTicks === base.durationTicks;
  const fraction = base.rawLengthPx === 0 ? 0 : Math.min(physics.speedPixelsPerTick * ageTicks / base.rawLengthPx, 1);
  const position = arrived ? {x: base.destination.x, y: base.destination.y} : {
    x: base.origin.x + base.dx * fraction, y: base.origin.y + base.dy * fraction};
  const travelledDistancePx = Math.hypot(position.x - base.origin.x, position.y - base.origin.y);
  return {position, flight: {...base, ageTicks}, arrived, travelledDistancePx};
}

export function directHomeTicks(position, hive, physics, mode) {
  checkMode(mode);
  const origin = point(position, 'current position'), destination = point(hive, 'hive');
  return mode === 'home' ? 0 : geometry(origin, destination, physics).durationTicks;
}

// A span has one input-stage mode throughout. Arrival and new commands split spans.
// Debit means actual stamina removed: a zero clamp cannot create a fictitious debit.
export function staminaSpan(start, mode, count, physics) {
  checkMode(mode); integer(start, 'starting stamina'); integer(count, 'stamina interval count');
  const capacity = integer(physics.staminaCapacityTicks, 'stamina capacity', 1);
  const recovery = integer(physics.homeRecoveryPerTick, 'home recovery', 1);
  const awayCost = integer(physics.awayCostPerTick, 'away cost', 1);
  if (start > capacity) throw new RangeError('stamina above capacity');
  if (mode !== 'home') {
    const awayDebit = Math.min(start, count * awayCost);
    return {stamina: start - awayDebit, awayDebit, recoveryCredit: 0, fullAtOffset: null};
  }
  const deficit = capacity - start, recoveryCredit = Math.min(deficit, count * recovery);
  const completionOffset = deficit > 0 ? Math.ceil(deficit / recovery) : null;
  return {stamina: start + recoveryCredit, awayDebit: 0, recoveryCredit,
    fullAtOffset: completionOffset !== null && completionOffset <= count ? completionOffset : null};
}

// These are disjoint inclusive windows for one activity, not a union of two swarms.
// The runner counts each swarm separately when both can work during the same tick.
function checkedSpans(spans) {
  if (!Array.isArray(spans)) throw new TypeError('interval spans');
  let previousLast = -1;
  for (const span of spans) {
    integer(span.firstTick, 'first eligible tick');
    integer(span.lastTick, 'last eligible tick', span.firstTick);
    if (span.firstTick <= previousLast) throw new Error('spans overlap or are unordered');
    previousLast = span.lastTick;
  }
  return spans;
}

export function intervalCount(spans, tick) {
  integer(tick, 'prefix query tick', -1);
  return checkedSpans(spans).reduce((sum, span) => sum + Math.max(0,
    Math.min(tick, span.lastTick) - span.firstTick + 1), 0);
}

export function lastEligibleTick(spans, tick) {
  integer(tick, 'last eligible query tick', -1);
  checkedSpans(spans);
  for (let index = spans.length - 1; index >= 0; index--) {
    if (spans[index].firstTick <= tick) return Math.min(spans[index].lastTick, tick);
  }
  return null;
}
