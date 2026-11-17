// Independent algebra from the frozen public contract; no Model or input FSM.
const CUP_IDS = ['left', 'center', 'right'];
const SOURCE_IDS = ['left', 'right'];

function integer(value, label, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new RangeError(label);
  return value;
}

function checkedRoute(route) {
  if (route !== 'outer' && route !== 'center') throw new RangeError('locked route');
  return route;
}

export function readParameters(contractText) {
  const match = /^## Frozen numerical data\s*\n+```json\s*\n([\s\S]*?)\n```/m.exec(contractText);
  if (!match) throw new Error('missing frozen numerical data');
  const parameters = JSON.parse(match[1]);
  if (parameters.gameId !== 28 || parameters.slug !== 'sandglass-split' ||
      parameters.physics.massPerPacketG !== 1) throw new Error('unexpected contract');
  return parameters;
}

export function cupGeometry(level, parameters) {
  const scale = integer(parameters.physics.unitsPerPixel, 'units per pixel', 1);
  const halfWidth = integer(parameters.physics.cupMouthHalfWidthUnits, 'cup half width', 1);
  const toleranceG = integer(level.toleranceG, 'tolerance');
  const cups = CUP_IDS.map((id, index) => {
    const centerXU = integer(level.cupCentersX[index] * scale, 'cup center');
    const targetG = integer(level.targetsG[index], 'target');
    return {id, index, centerXU, planeYU: integer(level.cupPlaneY * scale, 'cup plane'),
      leftU: centerXU - halfWidth, rightU: centerXU + halfWidth, targetG, toleranceG,
      minimumG: targetG - toleranceG, capacityG: targetG + toleranceG};
  });
  if (cups.some((cup, index) => index > 0 && cups[index - 1].rightU > cup.leftU)) {
    throw new Error('overlapping or unordered cup mouths');
  }
  return cups;
}

export function locateCup(xU, cups) {
  integer(xU, 'cup query xU', -Number.MAX_SAFE_INTEGER);
  return cups.find(cup => cup.leftU <= xU && xU < cup.rightU)?.id ?? null;
}

// Spans name committed ticks whose input has left the valve open, inclusively.
// Candidate enumeration is bounded by twice the reservoir mass, never elapsed ticks.
export function sourceSchedule(level, openSpans, finalTick) {
  integer(finalTick, 'final tick');
  const mass = integer(level.initialMassG, 'initial mass', 1);
  if (!Array.isArray(openSpans) || level.emitPeriodsTicks.length !== 2) {
    throw new TypeError('open spans / two source periods');
  }
  let previousLast = 0, cumulative = 0;
  const spans = openSpans.map(({firstTick, lastTick}) => {
    integer(firstTick, 'first open tick', 1);
    integer(lastTick, 'last open tick', firstTick);
    if (firstTick <= previousLast) throw new Error('open spans overlap or are unordered');
    const firstAge = cumulative + 1;
    cumulative += lastTick - firstTick + 1;
    previousLast = lastTick;
    return {firstTick, lastTick, firstAge, lastAge: cumulative};
  });
  const candidates = level.emitPeriodsTicks.flatMap((period, sourceIndex) => {
    integer(period, 'emission period', 1);
    return Array.from({length: mass}, (_, k) => ({sourceIndex,
      sourceAgeTicks: integer(1 + k * period, 'candidate source age', 1)}));
  }).sort((a, b) => a.sourceAgeTicks - b.sourceAgeTicks || a.sourceIndex - b.sourceIndex)
    .slice(0, mass);
  const exhaustionAge = candidates[mass - 1].sourceAgeTicks;
  const openTicksAt = tick => {
    integer(tick, 'query tick');
    if (tick > finalTick) throw new RangeError('query exceeds observed horizon');
    return spans.reduce((sum, span) => sum + Math.max(0,
      Math.min(tick, span.lastTick) - span.firstTick + 1), 0);
  };
  const ageAt = tick => Math.min(exhaustionAge, openTicksAt(tick));
  const available = openTicksAt(finalTick);
  const emissions = candidates.map((candidate, index) => ({id: index + 1, ...candidate}))
    .filter(candidate => candidate.sourceAgeTicks <= available).map(candidate => {
      const span = spans.find(row => row.firstAge <= candidate.sourceAgeTicks &&
        candidate.sourceAgeTicks <= row.lastAge);
      const bornAtTick = span.firstTick + candidate.sourceAgeTicks - span.firstAge;
      return {id: candidate.id, sourceIndex: candidate.sourceIndex,
        bornFromTick: bornAtTick - 1, bornAtTick, sourceAgeTicks: candidate.sourceAgeTicks};
    });
  return {emissions, exhaustionAge, ageAt, openTicksAt};
}

export function packetTimes(emission, level) {
  integer(emission.id, 'packet id', 1);
  integer(emission.sourceIndex, 'source index');
  if (emission.sourceIndex > 1) throw new RangeError('source index');
  integer(emission.bornFromTick, 'birth from tick');
  integer(emission.bornAtTick, 'birth tick', 1);
  if (emission.bornAtTick !== emission.bornFromTick + 1) throw new Error('birth ticks');
  const fall = integer(level.fallTicks[emission.sourceIndex], 'fall ticks', 1);
  const guided = integer(level.guidedTicks[emission.sourceIndex], 'guided ticks', 1);
  const contactTick = integer(emission.bornAtTick + fall - 1, 'contact tick', 1);
  return {contactTick, arrivalTick: integer(contactTick + guided, 'arrival tick', 1)};
}

export function arrivalPosition(emission, route, level, parameters) {
  packetTimes(emission, level);
  const source = emission.sourceIndex, scale = parameters.physics.unitsPerPixel;
  const vx = level.outgoingVxUnits[source][checkedRoute(route)];
  const guided = level.guidedTicks[source];
  return {xU: level.gatePositions[source][0] * scale + vx * guided,
    yU: level.gatePositions[source][1] * scale + parameters.physics.downwardUnitsPerTick * guided};
}

// The first fall move is in the birth interval; the contact interval has no guided move.
// The caller supplies the route fixed by accepted A history through contactTick.
export function packetAt(emission, tick, route, level, parameters) {
  integer(tick, 'packet query tick');
  const {contactTick, arrivalTick} = packetTimes(emission, level);
  if (tick < emission.bornAtTick || tick >= arrivalTick) return null;
  const source = emission.sourceIndex, scale = parameters.physics.unitsPerPixel;
  const vyU = parameters.physics.downwardUnitsPerTick;
  const guided = tick >= contactTick;
  const lockedRoute = guided ? checkedRoute(route) : null;
  const vxU = guided ? level.outgoingVxUnits[source][lockedRoute] : 0;
  const moves = guided ? tick - contactTick : tick - emission.bornFromTick;
  const origin = guided ? level.gatePositions[source] : level.sourcePositions[source];
  return {id: emission.id, massG: parameters.physics.massPerPacketG, sourceIndex: source,
    bornFromTick: emission.bornFromTick, bornAtTick: emission.bornAtTick,
    stage: guided ? 'guided' : 'fall', xU: origin[0] * scale + vxU * moves,
    yU: origin[1] * scale + vyU * moves, vxU, vyU, route: lockedRoute,
    contactTick: guided ? contactTick : null, contactGateId: guided ? SOURCE_IDS[source] : null};
}
