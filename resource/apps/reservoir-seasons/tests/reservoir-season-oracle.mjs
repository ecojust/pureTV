// Independent seasonal water algebra; no controls, gameplay loop or observed-state reset.
function integer(value, label, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new RangeError(label);
  return value;
}
function triple(values, label) {
  if (!Array.isArray(values) || values.length !== 3) throw new TypeError(label);
  return values.map((value, index) => integer(value, label + '[' + index + ']'));
}
const sum = values => integer(values.reduce((total, value) => total + value, 0), 'water sum');

export function readParameters(contractText) {
  const match = /^## Public level data\s*\n+```json\s*\n([\s\S]*?)\n```/m.exec(contractText);
  if (!match) throw new Error('missing public level data');
  const parameters = JSON.parse(match[1]);
  if (parameters.id !== 30 || parameters.slug !== 'reservoir-seasons') throw new Error('unexpected contract');
  return parameters;
}

export function prepareSeason(carry, season, capacity) {
  integer(carry, 'carry-in'); integer(capacity, 'capacity', 1);
  const requestedEvaporationUnits = integer(season.evaporationUnits, 'forecast evaporation');
  const inflowUnits = integer(season.inflowUnits, 'forecast inflow');
  const actualEvaporationUnits = Math.min(carry, requestedEvaporationUnits);
  const afterInflow = integer(carry - actualEvaporationUnits + inflowUnits, 'post-inflow water');
  return {carryInUnits: carry, requestedEvaporationUnits, actualEvaporationUnits, inflowUnits,
    overflowUnits: Math.max(0, afterInflow - capacity), preparedStorageUnits: Math.min(capacity, afterInflow)};
}

export function deliveredAt(committed, age, physics) {
  const duration = integer(physics.releaseDurationTicks, 'release duration', 1);
  integer(age, 'release age'); if (age > duration) throw new RangeError('release age exceeds duration');
  return triple(committed, 'committed water').map(value =>
    Math.floor(integer(value * age, 'delivery numerator') / duration));
}
export function intervalDelta(committed, fromAge, toAge, physics) {
  const before = deliveredAt(committed, fromAge, physics), after = deliveredAt(committed, toAge, physics);
  if (toAge < fromAge) throw new RangeError('reversed release interval');
  return after.map((value, index) => value - before[index]);
}

export function annualDemand(seasons) {
  if (!Array.isArray(seasons) || seasons.length !== 4) throw new TypeError('four seasons required');
  const demands = seasons.map((season, index) => triple(season.demandUnits, 'season demand ' + index));
  return [0, 1, 2].map(index => sum(demands.map(demand => demand[index])));
}
export function annualTargets(annual, demand, percent, physics) {
  const denominator = integer(physics.targetDenominator, 'target denominator', 1);
  const actual = triple(annual, 'annual delivered'), required = triple(demand, 'annual demand');
  const percentages = triple(percent, 'target percentages');
  if (percentages.some(value => value > denominator)) throw new RangeError('percentage above denominator');
  const actualProducts = actual.map(value => integer(value * denominator, 'actual crossproduct'));
  const requiredProducts = required.map((value, index) => integer(value * percentages[index], 'target crossproduct'));
  return {actualProducts, requiredProducts, met: actualProducts.map((value, index) => value >= requiredProducts[index])};
}

// Called only after all 480 release intervals, with annual totals including this season.
export function finishFacts({seasonIndex, tick, seasonActual, annual, dryBefore}, level, physics) {
  integer(seasonIndex, 'season index'); integer(tick, 'completion tick', 1); integer(dryBefore, 'prior dry streak');
  if (seasonIndex > 3) throw new RangeError('season index');
  const actual = triple(seasonActual, 'season actual'), season = level.seasons[seasonIndex];
  const floor = integer(season.residentFloorUnits, 'resident floor');
  const dryLimit = integer(physics.drySeasonFailureCount, 'dry streak limit', 1);
  const riverDryStreakAfter = actual[2] === 0 ? integer(dryBefore + 1, 'updated dry streak') : 0;
  const targets = annualTargets(annual, annualDemand(level.seasons), level.minimumFulfillmentPercent, physics);
  const failures = [], residentFloorMet = actual[0] >= floor;
  const fact = (kind, categoryIndex, actualValue, limitValue, unit) =>
    ({kind, seasonIndex, tick, categoryIndex, actualValue, limitValue, unit});
  if (!residentFloorMet) failures.push(fact('resident-floor', 0, actual[0], floor, 'water-units'));
  if (riverDryStreakAfter >= dryLimit) failures.push(fact('river-dry-streak', 2, riverDryStreakAfter, dryLimit, 'seasons'));
  if (seasonIndex === 3) targets.met.forEach((met, index) => {
    if (!met) failures.push(fact('annual-target', index, targets.actualProducts[index], targets.requiredProducts[index], 'water-percent-product'));
  });
  return {residentFloorMet, riverDryStreakAfter, annualTargetsMet: targets.met, failures};
}

export function inventory(values) {
  const keys = ['initialStorageUnits', 'totalInflowUnits', 'totalEvaporationUnits', 'totalOverflowUnits', 'storedUnits'];
  const base = Object.fromEntries(keys.map(key => [key, integer(values[key], key)]));
  const deliveredUnits = triple(values.deliveredUnits, 'delivered water'), totalDeliveredUnits = sum(deliveredUnits);
  const totalAccountedUnits = sum([base.storedUnits, base.totalEvaporationUnits, base.totalOverflowUnits, totalDeliveredUnits]);
  const totalAvailableUnits = sum([base.initialStorageUnits, base.totalInflowUnits]);
  return {...base, deliveredUnits, totalDeliveredUnits, totalAccountedUnits,
    balanceErrorUnits: totalAvailableUnits - totalAccountedUnits};
}
