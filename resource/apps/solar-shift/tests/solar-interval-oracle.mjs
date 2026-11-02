// Independent contract arithmetic: integer 1/240 J quanta and constant-flow
// intervals, with closed-form Euler temperature. No Model/pilot/author policy.
const UNIT = 240, HZ = 60, ANGLES = [-60, 0, 60], ORIENTATIONS = ['E', 'S', 'W'];
const ensure = (ok, message) => { if (!ok) throw Error(message); };
const integer = (value, scale, label) => { const q = Math.round(value * scale); ensure(Number.isSafeInteger(q) && Math.abs(value * scale - q) < 1e-8, `${label} lies on the public integer grid`); return q; };
const clone = value => JSON.parse(JSON.stringify(value));

export function publicConstants(m) {
  const b = m.battery;
  const facts = { ratedW: m.solar.ratedW, sunPeriods: clone(m.sunPeriods), shadowWindows: clone(m.shadowWindows),
    capacity: integer(b.capacityJ, UNIT, 'capacity'), initialEnergy: integer(b.initialEnergyJ, UNIT, 'initial energy'),
    chargeLimit: integer(b.maxChargeW, 4, 'charge power'), dischargeLimit: integer(b.maxDischargeW, 4, 'discharge power'),
    ambient: b.ambientC, initialTemperature: b.initialTemperatureC, thermalLimit: b.thermalLimitC,
    chargeHeat: b.heatChargeCoefficient, dischargeHeat: b.heatDischargeCoefficient, cooling: b.coolingPerSecond,
    devices: m.devices.map(d => ({ id: d.id, priority: d.priority, power: integer(d.demandW, 4, 'device power'), quota: integer(d.quotaJ, UNIT, 'quota'), critical: d.critical, outageLimit: d.maxBrownoutTicks })) };
  ensure(facts.devices.length === 3 && facts.devices.every((d, i) => d.id === `D${i + 1}` && d.priority === i + 1), 'Three ordered devices');
  ensure(facts.initialEnergy >= 0 && facts.initialEnergy <= facts.capacity && facts.initialTemperature >= facts.ambient, 'Valid initial battery');
  ensure(facts.cooling > 0 && facts.cooling < HZ && facts.chargeHeat >= 0 && facts.dischargeHeat >= 0, 'Monotone Euler cooling coefficient');
  const boundaries = [0, 3600, ...facts.sunPeriods.flatMap(p => [integer(p.start, HZ, 'period'), integer(p.end, HZ, 'period')]), ...facts.shadowWindows.flatMap(p => [integer(p.start, HZ, 'shadow'), integer(p.end, HZ, 'shadow')])];
  facts.boundaries = [...new Set(boundaries)].sort((a, b) => a - b);
  return facts;
}

export function createIntegralState(facts) {
  const state = { facts, tick: 0, energy: facts.initialEnergy, temperature: facts.initialTemperature,
    orientation: 0, enabled: [true, true, true], delivered: [0, 0, 0], outages: [0, 0, 0],
    solar: 0, delivery: 0, spill: 0, charge: 0, discharge: 0, phase: 'playing', reason: null,
    turns: 0, toggles: 0, lastOperation: null, operationIndex: 0, lastFlow: null,
    solarTelemetry: null, chargeW: 0, dischargeW: 0, thermalRate: 0, segments: 0 };
  state.solarTelemetry = sunlight(state).telemetry; state.solarTelemetry.generationW = 0;
  return state;
}

function sunlight(s) {
  const t = s.tick / HZ, f = s.facts, period = f.sunPeriods.find(p => p.start <= t && t < p.end);
  ensure(period, 'A public period covers this interval');
  const shadowed = f.shadowWindows.some(w => w.start <= t && t < w.end);
  const sunIndex = period.angleDeg === null ? null : ANGLES.indexOf(period.angleDeg);
  ensure(sunIndex === null || sunIndex >= 0, 'Known public sun angle');
  const alignment = sunIndex === null ? 0 : [1, .5, 0][Math.abs(s.orientation - sunIndex)];
  const watts = shadowed ? 0 : f.ratedW * period.irradiance * alignment;
  return { q: integer(watts, 4, 'solar power'), telemetry: { ratedW: f.ratedW, orientationIndex: s.orientation,
    orientation: ORIENTATIONS[s.orientation], panelAngleDeg: ANGLES[s.orientation], periodId: period.id,
    sunAngleDeg: period.angleDeg, irradiance: period.irradiance, shadowed, alignment, generationW: watts } };
}

function applyOperation(s, op) {
  ensure(op.id === op.tick && op.tick === s.tick + 1 && op.at === op.tick / HZ, 'Committed sparse operation identity');
  if (op.kind === 'rotate') {
    ensure(op.deviceId === null && op.before === ORIENTATIONS[s.orientation], 'Rotation starts at actual orientation');
    s.orientation = (s.orientation + 1) % 3; ensure(op.after === ORIENTATIONS[s.orientation], 'Clockwise three-position rotation'); s.turns++;
  } else {
    ensure(op.kind === 'toggle', 'Known operation'); const index = s.facts.devices.findIndex(d => d.id === op.deviceId);
    ensure(index >= 0 && op.before === s.enabled[index] && op.after === !op.before, 'Actual selected-device toggle');
    s.enabled[index] = op.after; s.toggles++;
  }
  s.lastOperation = clone(op);
}

// Closed form for the exact fixed-step Euler recurrence, not the continuous ODE.
export function eulerTemperature(start, ambient, cooling, heat, ticks) {
  const equilibrium = ambient + heat / cooling;
  return equilibrium + (start - equilibrium) * (1 - cooling / HZ) ** ticks;
}

function firstHotTick(s, heat, horizon) {
  const f = s.facts, value = n => eulerTemperature(s.temperature, f.ambient, f.cooling, heat, n);
  if (value(1) >= f.thermalLimit) return 1;
  if (value(horizon) < f.thermalLimit) return Infinity;
  // If the first tick was safe but the end is hot, the affine recurrence rises
  // monotonically. Binary search locates the first actual discrete crossing.
  let low = 1, high = horizon;
  while (high - low > 1) { const middle = Math.floor((low + high) / 2); if (value(middle) >= f.thermalLimit) high = middle; else low = middle; }
  return high;
}

export function advanceIntegralTo(s, targetTick, operations) {
  ensure(Number.isInteger(targetTick) && targetTick >= s.tick && targetTick <= 3600, 'Bounded observation tick');
  while (s.tick < targetTick && s.phase === 'playing') {
    const f = s.facts, op = operations[s.operationIndex];
    if (op && op.tick === s.tick + 1) { applyOperation(s, op); s.operationIndex++; }
    else if (op) ensure(op.tick > s.tick + 1, 'Operations are strictly ordered and not skipped');
    const nextOp = operations[s.operationIndex], boundary = f.boundaries.find(t => t > s.tick);
    let length = Math.min(targetTick, boundary, nextOp ? nextOp.tick - 1 : 3600) - s.tick;
    ensure(length >= 1, 'Nonempty constant-control/weather interval');
    const sun = sunlight(s), request = f.devices.map((d, i) => s.enabled[i] ? d.power : 0), demand = request.reduce((a, b) => a + b, 0);
    const fullDischarge = Math.min(Math.max(0, demand - sun.q), f.dischargeLimit);
    const fullCharge = Math.min(Math.max(0, sun.q - demand), f.chargeLimit);
    let discharge = Math.min(fullDischarge, s.energy), charge = Math.min(fullCharge, f.capacity - s.energy);
    if (fullDischarge && s.energy > 0) length = Math.min(length, s.energy < fullDischarge ? 1 : Math.floor(s.energy / fullDischarge));
    if (fullCharge && s.energy < f.capacity) length = Math.min(length, f.capacity - s.energy < fullCharge ? 1 : Math.floor((f.capacity - s.energy) / fullCharge));
    let available = sun.q + discharge;
    const delivery = request.map(q => { const given = Math.min(q, available); available -= given; return given; });
    const delivered = delivery.reduce((a, b) => a + b, 0), spill = sun.q + discharge - delivered - charge;
    ensure(spill >= 0 && !(charge && discharge), 'Nonnegative spill and no simultaneous charge/discharge');
    const chargeW = charge / 4, dischargeW = discharge / 4, heat = f.chargeHeat * chargeW ** 2 + f.dischargeHeat * dischargeW ** 2;
    const hot = firstHotTick(s, heat, length);
    const brownout = Math.min(Infinity, ...f.devices.map((d, i) => d.critical && delivery[i] < d.power ? d.outageLimit - s.outages[i] : Infinity));
    const duration = Math.min(length, hot, brownout);
    ensure(Number.isInteger(duration) && duration >= 1, 'Positive bounded physical interval');
    const oldEnergy = s.energy, oldTemperature = s.temperature;
    const beforeLastTemperature = eulerTemperature(oldTemperature, f.ambient, f.cooling, heat, duration - 1);
    s.temperature = eulerTemperature(oldTemperature, f.ambient, f.cooling, heat, duration);
    s.energy += (charge - discharge) * duration;
    s.solar += sun.q * duration; s.delivery += delivered * duration; s.spill += spill * duration;
    s.charge += charge * duration; s.discharge += discharge * duration;
    for (let i = 0; i < 3; i++) { s.delivered[i] += delivery[i] * duration; s.outages[i] = f.devices[i].critical && delivery[i] < f.devices[i].power ? s.outages[i] + duration : 0; }
    s.tick += duration; s.segments++;
    s.solarTelemetry = sun.telemetry; s.chargeW = chargeW; s.dischargeW = dischargeW;
    s.thermalRate = heat - f.cooling * (beforeLastTemperature - f.ambient);
    s.lastFlow = { id: s.tick, fromTime: (s.tick - 1) / HZ, toTime: s.tick / HZ,
      solarW: sun.q / 4, requestedW: demand / 4, deliveredW: delivered / 4, unservedW: (demand - delivered) / 4,
      chargeW, dischargeW, spillW: spill / 4, solarJ: sun.q / UNIT, deliveredJ: delivered / UNIT,
      chargeJ: charge / UNIT, dischargeJ: discharge / UNIT, spillJ: spill / UNIT,
      batteryBeforeJ: (oldEnergy + (charge - discharge) * (duration - 1)) / UNIT, batteryAfterJ: s.energy / UNIT,
      temperatureBeforeC: beforeLastTemperature, temperatureAfterC: s.temperature,
      deviceFlows: f.devices.map((d, i) => ({ deviceId: d.id, requestedW: request[i] / 4, deliveredW: delivery[i] / 4, deliveredJ: delivery[i] / UNIT })) };
    ensure(s.energy >= 0 && s.energy <= f.capacity, 'Exact integer capacity bound');
    ensure(f.initialEnergy + s.solar === s.energy + s.delivery + s.spill, 'Exact integer energy conservation');
    ensure(s.delivered.reduce((a, b) => a + b, 0) === s.delivery, 'Separate device energy sums exactly');
    if (hot === duration) s.reason = 'heat';
    else if (brownout === duration) s.reason = 'brownout';
    else if (s.tick === 3600 && s.delivered.some((v, i) => v < f.devices[i].quota)) s.reason = 'quota';
    if (s.reason) s.phase = 'lost'; else if (s.tick === 3600) s.phase = 'won';
  }
  ensure(s.tick === targetTick, 'Observed terminal tick agrees with independently located first boundary');
  return s;
}

export function intervalProjection(s) {
  const f = s.facts, quotaMet = s.delivered.map((v, i) => v >= f.devices[i].quota);
  const missing = f.devices.filter((d, i) => !quotaMet[i]).map(d => d.id);
  return { phase: s.phase, lostReason: s.reason, tick: s.tick, elapsed: s.tick / HZ, remaining: (3600 - s.tick) / HZ,
    panelTurns: s.turns, toggleCount: s.toggles, lastOperation: s.lastOperation, lastFlow: s.lastFlow,
    quotaMetCount: quotaMet.filter(Boolean).length, allQuotasMet: quotaMet.every(Boolean),
    battery: { energyJ: s.energy / UNIT, temperatureC: s.temperature, chargeW: s.chargeW, dischargeW: s.dischargeW, thermalRateCPerSecond: s.thermalRate },
    ledger: { initialBatteryJ: f.initialEnergy / UNIT, solarJ: s.solar / UNIT, deliveredJ: s.delivery / UNIT, spilledJ: s.spill / UNIT, chargedJ: s.charge / UNIT, dischargedJ: s.discharge / UNIT, energyErrorJ: 0 },
    solar: s.solarTelemetry,
    devices: f.devices.map((d, i) => ({ id: d.id, enabled: s.enabled[i], deliveredJ: s.delivered[i] / UNIT, quotaMet: quotaMet[i], brownoutTicks: s.outages[i], brownoutSeconds: s.outages[i] / HZ,
      requestedW: s.lastFlow?.deviceFlows[i].requestedW ?? 0, deliveredW: s.lastFlow?.deviceFlows[i].deliveredW ?? 0 })),
    failure: s.reason ? { reason: s.reason, deviceIds: s.reason === 'heat' ? [] : s.reason === 'quota' ? missing : f.devices.filter((d, i) => d.critical && s.outages[i] >= d.outageLimit).map(d => d.id), missingQuotaDeviceIds: missing, temperatureC: s.temperature } : null };
}
