// Independent public-contract arithmetic; no production or controller imports.
// Matrix samples are approximate non-gate values. The reviewer separately checks
// strict safety predicates against the actual saved interval values.

export function readParameters(contractText) {
  const section = contractText.split('## Frozen numerical design data')[1];
  const fence = section?.match(/```json\s*([\s\S]*?)```/);
  if (!fence) throw new Error('Missing frozen public numerical design data');
  const parameters = JSON.parse(fence[1]);
  if (parameters.game?.id !== 27 || parameters.game?.slug !== 'harbor-counterweight') throw new Error('Unexpected public contract');
  return parameters;
}

function checkUnits(units, parameters) {
  const targets = parameters.motion.ballastTargetUnits;
  if (!Number.isSafeInteger(units) || units < Math.min(...targets) || units > Math.max(...targets))
    throw new RangeError('Ballast position must be an integer in the published range');
}

function coefficients(aboardCargoMassT, parameters) {
  if (!Number.isFinite(aboardCargoMassT) || aboardCargoMassT < 0) throw new RangeError('Invalid aboard cargo mass');
  const p = parameters.ship, massT = p.baseMassT + p.ballastMassT + aboardCargoMassT;
  const inertiaTM2 = massT * p.rollRadiusM * p.rollRadiusM;
  const restoringKNmPerRad = massT * p.gravityMS2 * p.metacentricHeightM;
  const dampingKNmSPerRad = (2 * p.dampingRatio) * Math.sqrt(inertiaTM2 * restoringKNmPerRad);
  return { massT, inertiaTM2, restoringKNmPerRad, dampingKNmSPerRad };
}

// Ordered aboard rows explicitly exclude shore, hook, delivered and spilled IDs.
// The caller verifies the complete ownership partition independently.
export function massProperties(cargo, stacks, ballastPositionUnits, parameters) {
  const columns = parameters.layout.columnXM;
  if (!Array.isArray(cargo) || cargo.length > 6 || !Array.isArray(stacks) || stacks.length !== columns.length)
    throw new RangeError('Invalid cargo or stack collection');
  checkUnits(ballastPositionUnits, parameters);
  const byId = new Map();
  for (const row of cargo) {
    if (typeof row?.id !== 'string' || !row.id.length || byId.has(row.id) || !Number.isFinite(row.massT) || row.massT <= 0)
      throw new RangeError('Cargo IDs and positive masses must be unique and finite');
    byId.set(row.id, row.massT);
  }
  const aboard = [], seen = new Set();
  let aboardCargoMassT = 0, cargoMomentTM = 0;
  for (const [column, stack] of stacks.entries()) {
    if (!Array.isArray(stack) || stack.length > parameters.layout.maximumStackHeight) throw new RangeError('Invalid stack height');
    for (const [tier, id] of stack.entries()) {
      if (!byId.has(id) || seen.has(id)) throw new RangeError('Unknown or duplicated aboard cargo');
      seen.add(id);
      const massT = byId.get(id), columnXM = columns[column];
      aboard.push({ id, massT, column, tier, columnXM });
      aboardCargoMassT += massT;
      cargoMomentTM += massT * columnXM;
    }
  }
  const ballastXM = ballastPositionUnits / parameters.motion.ballastUnitsPerMeter;
  const firstMomentTM = parameters.ship.ballastMassT * ballastXM + cargoMomentTM;
  const body = coefficients(aboardCargoMassT, parameters);
  const result = { aboardIds: aboard.map(row => row.id), aboard, aboardCargoMassT, cargoMomentTM, ballastXM,
    ...body, firstMomentTM, centerOfMassXM: firstMomentTM / body.massT,
    gravityTorqueKNm: parameters.ship.gravityMS2 * firstMomentTM };
  for (const value of Object.values(result)) if (typeof value === 'number' && !Number.isFinite(value)) throw new RangeError('Nonfinite mass property');
  return result;
}

function multiply(left, right) {
  return left.map(row => right[0].map((_, column) => row.reduce((total, value, k) => total + value * right[k][column], 0)));
}

function matrixVector(matrix, vector) {
  return matrix.map(row => row.reduce((total, value, i) => total + value * vector[i], 0));
}

// Binary powers require O(log n) matrix operations, with no per-tick roll loop.
function poweredVector(matrix, count, vector) {
  let result = vector.slice(), power = matrix, remaining = count;
  while (remaining > 0) {
    if (remaining % 2 === 1) result = matrixVector(power, result);
    remaining = Math.floor(remaining / 2);
    if (remaining > 0) power = multiply(power, power);
  }
  return result;
}

// The caller must split at every cargo change, target change and ballast arrival.
// direction is the fixed movement in integer units per interval, not a control.
// origin.units is the OLD position; forcing uses u + direction each interval.
export function rollSpan(origin, aboardCargoMassT, cargoMomentTM, direction, count, parameters) {
  if (!Number.isFinite(origin.theta) || !Number.isFinite(origin.omega) || !Number.isFinite(cargoMomentTM) ||
    ![-1, 0, 1].includes(direction) || !Number.isSafeInteger(count) || count < 0)
    throw new RangeError('Invalid fixed-configuration roll span');
  checkUnits(origin.units, parameters);
  const endUnits = origin.units + direction * count;
  checkUnits(endUnits, parameters);
  const body = coefficients(aboardCargoMassT, parameters);
  if (!count) return { theta: origin.theta, omega: origin.omega, units: origin.units };
  const hz = parameters.motion.tickHz, gravity = parameters.ship.gravityMS2;
  const restoring = body.restoringKNmPerRad / body.inertiaTM2;
  const damping = body.dampingKNmSPerRad / body.inertiaTM2;
  const perUnit = gravity * parameters.ship.ballastMassT / (body.inertiaTM2 * parameters.motion.ballastUnitsPerMeter);
  const fixedTorqueAcceleration = gravity * cargoMomentTM / body.inertiaTM2;
  // w' = -k/hz*theta + (1-c/hz)*w + b/hz*u + (a+b*d)/hz;
  // theta' = theta + w'/hz, u' = u+d. The last coordinate stays one.
  const omegaRow = [-restoring / hz, 1 - damping / hz, perUnit / hz, (fixedTorqueAcceleration + perUnit * direction) / hz];
  const matrix = [
    [1 + omegaRow[0] / hz, omegaRow[1] / hz, omegaRow[2] / hz, omegaRow[3] / hz],
    omegaRow,
    [0, 0, 1, direction],
    [0, 0, 0, 1],
  ];
  const result = poweredVector(matrix, count, [origin.theta, origin.omega, origin.units, 1]);
  if (!result.every(Number.isFinite) || result[2] !== endUnits || result[3] !== 1) throw new Error('Invalid augmented matrix result');
  return { theta: result[0], omega: result[1], units: endUnits };
}
