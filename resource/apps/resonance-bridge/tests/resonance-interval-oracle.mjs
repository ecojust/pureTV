// Public oscillator algebra and safe-interval sets; no pedestrian/input state machine.
function integer(value, label, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new RangeError(label);
  return value;
}
function finite(value, label) {
  if (!Number.isFinite(value)) throw new RangeError(label);
  return value;
}

export function readParameters(contractText) {
  const match = /^## Public level data\s*\n+```json\s*\n([\s\S]*?)\n```/m.exec(contractText);
  if (!match) throw new Error('missing public level data');
  const parameters = JSON.parse(match[1]);
  if (parameters.number !== 31 || parameters.game !== 'resonance-bridge') throw new Error('unexpected contract');
  return parameters;
}

export function endpoint({phaseUnits, resonanceUnits}, p) {
  integer(phaseUnits, 'unwrapped phase'); integer(resonanceUnits, 'resonance');
  const turn = integer(p.phaseUnitsPerTurn, 'phase units per turn', 1);
  const scale = integer(p.resonanceUnitsPerAmplitudeMetre, 'amplitude scale', 1);
  const phaseWrappedUnits = phaseUnits % turn;
  const phaseRadians = 2 * Math.PI * phaseWrappedUnits / turn;
  const amplitudeMetres = finite(p.baseAmplitudeMetres, 'base amplitude') + resonanceUnits / scale;
  return {phaseUnits, phaseWrappedUnits, phaseRadians, resonanceUnits, amplitudeMetres,
    heightMetres: amplitudeMetres * Math.sin(phaseRadians)};
}

// The caller splits spans at any frequency/pulse change. Zero is a lower clamp only.
export function constantDriveSpan(start, effectiveSpeed, count, p) {
  integer(effectiveSpeed, 'effective speed', 1); integer(count, 'span intervals');
  integer(start.phaseUnits, 'starting phase'); integer(start.resonanceUnits, 'starting resonance');
  if (!p.frequencyPhaseUnitsPerTick.some(speed => effectiveSpeed === speed || effectiveSpeed === speed + p.phasePulseUnitsPerTick)) {
    throw new RangeError('effective speed outside published choices');
  }
  const rate = effectiveSpeed === p.resonantEffectivePhaseUnitsPerTick
    ? integer(p.resonanceGainPerTick, 'resonance gain') : -integer(p.resonanceDecayPerTick, 'resonance decay');
  const change = integer(rate * count, 'resonance change', -Number.MAX_SAFE_INTEGER);
  const rawResonance = integer(start.resonanceUnits + change, 'unclipped resonance', -Number.MAX_SAFE_INTEGER);
  return endpoint({phaseUnits: integer(start.phaseUnits + effectiveSpeed * count, 'ending phase'),
    resonanceUnits: Math.max(0, rawResonance)}, p);
}

// Full node heights are [left bank, three boards, right bank]. Banks are exactly zero.
export function contactFromEndpoints(fromHeights, toHeights, p) {
  for (const heights of [fromHeights, toHeights]) {
    if (!Array.isArray(heights) || heights.length !== 5 || !heights.every(Number.isFinite) || heights[0] !== 0 || heights[4] !== 0) {
      throw new RangeError('five finite node heights with fixed banks required');
    }
  }
  const limit = finite(p.maximumContactGapMetres, 'contact gap limit');
  if (limit < 0) throw new RangeError('negative contact limit');
  return [0, 1, 2, 3].map(edgeIndex => {
    const gapFrom = toDifference(fromHeights, edgeIndex), gapTo = toDifference(toHeights, edgeIndex);
    const maxGapMetres = Math.max(Math.abs(gapFrom), Math.abs(gapTo));
    return {edgeIndex, sourceNode: edgeIndex, destinationNode: edgeIndex + 1, gapFrom, gapTo,
      maxGapMetres, safe: maxGapMetres <= limit, closing: Math.abs(gapTo) <= Math.abs(gapFrom)};
  });
}
const toDifference = (heights, edge) => heights[edge + 1] - heights[edge];

// Input is one edge's ordered [{tick,safe,...}], with tick naming the interval END.
// Missing ticks break a run; they are never inferred safe.
export function safeRuns(contacts) {
  if (!Array.isArray(contacts)) throw new TypeError('contact intervals');
  const runs = []; let previousTick = 0;
  for (const contact of contacts) {
    integer(contact.tick, 'contact ending tick', 1);
    if (contact.tick <= previousTick || typeof contact.safe !== 'boolean') throw new Error('unordered contact interval / nonboolean safety');
    previousTick = contact.tick;
    if (!contact.safe) continue;
    const last = runs.at(-1);
    if (last && last.lastTick === contact.tick - 1) last.lastTick = contact.tick;
    else runs.push({firstTick: contact.tick, lastTick: contact.tick});
  }
  return runs;
}

export function firstQualifiedEnd(runs, closingTicks, firstEligibleTick, qualification = 24, horizon = Number.MAX_SAFE_INTEGER) {
  integer(firstEligibleTick, 'first eligible ending tick', 1); integer(qualification, 'qualification intervals', 1); integer(horizon, 'horizon');
  const normalized = []; let previousLast = 0, previousClosing = 0;
  for (const run of runs) {
    integer(run.firstTick, 'safe run first tick', 1); integer(run.lastTick, 'safe run last tick', run.firstTick);
    if (run.firstTick <= previousLast) throw new Error('overlapping or unordered safe runs');
    const last = normalized.at(-1);
    if (last && last.lastTick === run.firstTick - 1) last.lastTick = run.lastTick;
    else normalized.push({firstTick: run.firstTick, lastTick: run.lastTick});
    previousLast = run.lastTick;
  }
  for (const tick of closingTicks) {
    integer(tick, 'closing ending tick', 1);
    if (tick <= previousClosing) throw new Error('unordered closing ticks'); previousClosing = tick;
  }
  for (const run of normalized) {
    const earliest = Math.max(run.firstTick, firstEligibleTick) + qualification - 1, last = Math.min(run.lastTick, horizon);
    if (earliest > last) continue;
    const found = closingTicks.find(tick => tick >= earliest && tick <= last);
    if (found !== undefined) return found;
  }
  return null;
}

function completeWindow(contacts, firstTick, lastTick) {
  integer(firstTick, 'window first tick', 1); integer(lastTick, 'window last tick', firstTick);
  const selected = contacts.filter(row => firstTick <= row.tick && row.tick <= lastTick);
  if (selected.length !== lastTick - firstTick + 1 || selected.some((row, index) => row.tick !== firstTick + index || typeof row.safe !== 'boolean')) {
    throw new Error('window requires every actual interval in order');
  }
  return selected;
}
export function rangeMax(contacts, firstTick, lastTick) {
  return Math.max(...completeWindow(contacts, firstTick, lastTick).map(row => finite(row.maxGapMetres, 'interval maximum')));
}
export function firstUnsafe(contacts, firstTick, lastTick) {
  return completeWindow(contacts, firstTick, lastTick).find(row => row.safe === false)?.tick ?? null;
}
