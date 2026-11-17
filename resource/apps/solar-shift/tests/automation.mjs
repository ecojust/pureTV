// Public telemetry controller. No Model import, private state, author witness or level-specific policy.
const ORIENTATIONS = ['E', 'S', 'W'], ANGLES = [-60, 0, 60], EPS = 1e-8;
const must = (value, message) => { if (!value) throw Error(message); };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const finite = (...values) => values.every(Number.isFinite);
const controls = m => ({ selectedId: m.selectedId, orientationIndex: m.solar.orientationIndex, enabled: m.devices.map(d => d.enabled), panelTurns: m.panelTurns, toggleCount: m.toggleCount });

function validate(m) {
  must(m.devices.length === 3 && new Set(m.devices.map(d => d.id)).size === 3, 'Three unique public devices required');
  must(m.devices.every((d, i) => d.priority === i + 1 && finite(d.demandW, d.quotaJ, d.deliveredJ) && d.demandW > 0 && d.quotaJ > 0 && typeof d.enabled === 'boolean'), 'Invalid public device demand/priority');
  must(m.devices.some(d => d.id === m.selectedId) && ORIENTATIONS[m.solar.orientationIndex] === m.solar.orientation, 'Invalid observed controls');
  const b = m.battery;
  must(finite(m.elapsed, m.timeLimit, m.solar.ratedW, b.energyJ, b.capacityJ, b.maxChargeW, b.maxDischargeW, b.temperatureC, b.ambientC, b.thermalLimitC, b.heatChargeCoefficient, b.heatDischargeCoefficient, b.coolingPerSecond), 'Finite public physics required');
  must(b.energyJ >= -EPS && b.energyJ <= b.capacityJ + EPS && b.maxChargeW >= 0 && b.maxDischargeW >= 0 && b.thermalLimitC > b.ambientC, 'Invalid battery bounds');
  must(m.sunPeriods.length > 0 && m.sunPeriods.length <= 8 && m.shadowWindows.length <= 16, 'Bounded public weather schedule required');
  for (const p of m.sunPeriods) must(finite(p.start, p.end, p.irradiance) && p.start < p.end && p.irradiance >= 0 && (p.angleDeg === null || ANGLES.includes(p.angleDeg)), 'Invalid public sun period');
  for (const p of m.shadowWindows) must(finite(p.start, p.end) && p.start < p.end, 'Invalid public shadow interval');
}

export function sunlightAt(m, at, orientationIndex = m.solar.orientationIndex) {
  must(Number.isInteger(orientationIndex) && orientationIndex >= 0 && orientationIndex < 3 && Number.isFinite(at), 'Invalid orientation/time');
  const period = m.sunPeriods.find(p => at >= p.start && at < p.end) ?? (at === m.timeLimit ? m.sunPeriods.at(-1) : null);
  must(period, 'Public schedule does not cover the requested time');
  const shadowed = m.shadowWindows.some(p => at >= p.start && at < p.end);
  const gap = period.angleDeg === null ? 2 : Math.abs(ANGLES[orientationIndex] - period.angleDeg) / 60;
  const alignment = period.angleDeg === null ? 0 : gap === 0 ? 1 : gap === 1 ? .5 : 0;
  return { periodId: period.id, sunAngleDeg: period.angleDeg, irradiance: period.irradiance, shadowed, alignment, generationW: shadowed ? 0 : m.solar.ratedW * period.irradiance * alignment };
}

// A disclosed-physics hypothesis for one interval, not a read of a future production state.
export function predictInterval(m, { fromTime = m.elapsed, dt = 1 / 60, orientationIndex = m.solar.orientationIndex, enabled = m.devices.map(d => d.enabled), energyJ = m.battery.energyJ, temperatureC = m.battery.temperatureC } = {}) {
  must(finite(fromTime, dt, energyJ, temperatureC) && dt > 0 && dt <= .25 && enabled.length === m.devices.length && enabled.every(v => typeof v === 'boolean'), 'Invalid public interval hypothesis');
  const b = m.battery, sun = sunlightAt(m, fromTime, orientationIndex), solarJ = sun.generationW * dt;
  const requested = m.devices.map((d, i) => enabled[i] ? d.demandW * dt : 0), requestJ = requested.reduce((n, x) => n + x, 0);
  const dischargeJ = Math.min(Math.max(0, requestJ - solarJ), energyJ, b.maxDischargeW * dt);
  const chargeJ = Math.min(Math.max(0, solarJ - requestJ), b.capacityJ - energyJ, b.maxChargeW * dt);
  let available = solarJ + dischargeJ;
  const deviceFlows = m.devices.map((d, i) => { const deliveredJ = Math.min(requested[i], Math.max(0, available)); available -= deliveredJ; return { deviceId: d.id, requestedW: requested[i] / dt, deliveredW: deliveredJ / dt, deliveredJ }; });
  const deliveredJ = deviceFlows.reduce((n, d) => n + d.deliveredJ, 0), spillJ = Math.max(0, solarJ + dischargeJ - deliveredJ - chargeJ);
  const chargeW = chargeJ / dt, dischargeW = dischargeJ / dt;
  const thermalRate = b.heatChargeCoefficient * chargeW ** 2 + b.heatDischargeCoefficient * dischargeW ** 2 - b.coolingPerSecond * (temperatureC - b.ambientC);
  return { sun, fromTime, toTime: fromTime + dt, solarW: sun.generationW, requestedW: requestJ / dt, deliveredW: deliveredJ / dt, unservedW: (requestJ - deliveredJ) / dt,
    chargeW, dischargeW, spillW: spillJ / dt, solarJ, deliveredJ, chargeJ, dischargeJ, spillJ, batteryBeforeJ: energyJ, batteryAfterJ: Math.max(0, Math.min(b.capacityJ, energyJ - dischargeJ + chargeJ)),
    temperatureBeforeC: temperatureC, temperatureAfterC: Math.max(b.ambientC, temperatureC + thermalRate * dt), thermalRate, deviceFlows };
}

function minimumGeneration(m, orientationIndex, horizon) {
  const end = Math.min(m.timeLimit, m.elapsed + horizon), times = [m.elapsed];
  for (const interval of [...m.sunPeriods, ...m.shadowWindows]) for (const t of [interval.start, interval.end]) if (t > m.elapsed && t < end) times.push(t);
  return Math.min(...times.map(t => sunlightAt(m, t, orientationIndex).generationW));
}

export function planVisibleState(m, { lookaheadSeconds = 2, serveOptional = true } = {}) {
  validate(m); must(Number.isFinite(lookaheadSeconds) && lookaheadSeconds >= .5 && lookaheadSeconds <= 3, 'Lookahead must be bounded to 0.5–3 seconds');
  must(typeof serveOptional === 'boolean', 'Explicit optional-service objective required');
  const weather = sunlightAt(m, m.elapsed), desiredOrientation = weather.sunAngleDeg === null ? m.solar.orientationIndex : ANGLES.indexOf(weather.sunAngleDeg);
  const criticalW = m.devices.filter(d => d.critical).reduce((n, d) => n + d.demandW, 0);
  const optional = m.devices.map((d, i) => ({ d, i })).filter(({ d }) => serveOptional && !d.critical && !d.quotaMet)
    .sort((a, b) => (b.d.quotaJ - b.d.deliveredJ) / b.d.demandW - (a.d.quotaJ - a.d.deliveredJ) / a.d.demandW || a.d.priority - b.d.priority);
  function candidate(orientationIndex) {
    const generationFloorW = minimumGeneration(m, orientationIndex, lookaheadSeconds), enabled = m.devices.map(d => d.critical);
    let spareW = Math.max(0, generationFloorW - criticalW);
    for (const { d, i } of optional) if (d.demandW <= spareW + EPS) { enabled[i] = true; spareW -= d.demandW; }
    let energyJ = m.battery.energyJ, temperatureC = m.battery.temperatureC, maxTemperatureC = temperatureC, criticalDeficitJ = 0;
    const ticks = Math.min(Math.ceil(lookaheadSeconds * 60), 3600 - m.tick);
    for (let i = 0; i < ticks; i++) {
      const flow = predictInterval(m, { fromTime: (m.tick + i) / 60, orientationIndex, enabled, energyJ, temperatureC });
      energyJ = flow.batteryAfterJ; temperatureC = flow.temperatureAfterC; maxTemperatureC = Math.max(maxTemperatureC, temperatureC);
      flow.deviceFlows.forEach((d, j) => { if (m.devices[j].critical) criticalDeficitJ += Math.max(0, m.devices[j].demandW / 60 - d.deliveredJ); });
    }
    return { orientationIndex, enabled, generationFloorW, projectedEnergyJ: energyJ, maxTemperatureC, criticalDeficitJ, hypothesisTicks: ticks };
  }
  let desired = candidate(desiredOrientation);
  // Reducing generation can reduce charge heating. Disabling a load is not assumed to cool a charging battery.
  if (desired.maxTemperatureC >= m.battery.thermalLimitC - 2) {
    const alternatives = [0, 1, 2].map(candidate).filter(c => c.criticalDeficitJ <= EPS);
    alternatives.sort((a, b) => a.maxTemperatureC - b.maxTemperatureC || b.projectedEnergyJ - a.projectedEnergyJ);
    if (alternatives.length && alternatives[0].maxTemperatureC < desired.maxTemperatureC - .25) desired = alternatives[0];
  }
  return { ...desired, criticalW, lookaheadSeconds, quotaDeficitsJ: m.devices.map(d => Math.max(0, d.quotaJ - d.deliveredJ)),
    thermalMarginC: m.battery.thermalLimitC - m.battery.temperatureC, scope: 'Bounded public weather/energy hypothesis; upcoming inputs still require actual observed acknowledgement.' };
}

export function predictFocus(m, direction) {
  const at = m.devices.findIndex(d => d.id === m.selectedId); must(at >= 0 && ['up', 'down', 'left', 'right'].includes(direction), 'Unknown focus request');
  return m.devices[Math.max(0, Math.min(m.devices.length - 1, at + (['down', 'right'].includes(direction) ? 1 : -1)))].id;
}

export function createPilot({ serveOptional = true } = {}) {
  let previousTick = -1, release = false, neutralTick = -1, pending = null;
  const diagnostics = [], note = (type, fields) => diagnostics.push({ type, ...fields });
  const reset = () => { release = false; neutralTick = -1; pending = null; diagnostics.length = 0; };
  const issue = (m, kind, key, extra = {}) => { pending = { kind, at: m.elapsed, tick: m.tick, ...controls(m), ...extra }; release = true; note('input', { at: m.elapsed, kind, key, selectedId: m.selectedId }); return [key]; };
  function pilot(state) {
    const m = state.model; if (!m) return [];
    if (m.tick < previousTick) reset(); previousTick = m.tick;
    if (state.phase !== 'playing' || state.paused || m.phase !== 'playing') return [];
    if (release) { release = false; neutralTick = m.tick; return []; }
    if (m.tick <= neutralTick) return [];
    if (pending) {
      const c = controls(m); let observed = false;
      if (pending.kind === 'navigate') {
        must(c.panelTurns === pending.panelTurns && c.toggleCount === pending.toggleCount && c.orientationIndex === pending.orientationIndex && equal(c.enabled, pending.enabled), 'Navigation changed physical controls');
        if (c.selectedId !== pending.selectedId || c.selectedId === pending.expectedId) { observed = true; note(c.selectedId === pending.expectedId ? 'observed-focus' : 'observed-overshoot-replan', { at: m.elapsed, selectedId: c.selectedId }); }
      } else {
        const counter = pending.kind === 'rotate' ? 'panelTurns' : 'toggleCount', other = pending.kind === 'rotate' ? 'toggleCount' : 'panelTurns';
        if (c[counter] === pending[counter] + 1) {
          const op = m.lastOperation, expectedEnabled = [...pending.enabled], index = m.devices.findIndex(d => d.id === pending.selectedId);
          if (pending.kind === 'toggle') expectedEnabled[index] = !expectedEnabled[index];
          must(op && op.kind === pending.kind && op.id === op.tick && op.tick > pending.tick && op.tick <= m.tick && op.at === op.tick / 60, 'Operation must use its actual sparse committed tick');
          must(c[other] === pending[other] && c.selectedId === pending.selectedId && equal(c.enabled, expectedEnabled), 'Unexpected extra physical operation');
          must(c.orientationIndex === (pending.kind === 'rotate' ? (pending.orientationIndex + 1) % 3 : pending.orientationIndex), 'Wrong actual panel orientation');
          must(op.deviceId === (pending.kind === 'toggle' ? pending.selectedId : null) && op.before === (pending.kind === 'toggle' ? pending.enabled[index] : ORIENTATIONS[pending.orientationIndex]) && op.after === (pending.kind === 'toggle' ? expectedEnabled[index] : ORIENTATIONS[c.orientationIndex]), 'Operation receipt must continue observed controls');
          observed = true; note('observed-operation', { observedAt: m.elapsed, operation: { ...op }, energyJ: m.battery.energyJ, temperatureC: m.battery.temperatureC });
        } else must(c.panelTurns === pending.panelTurns && c.toggleCount === pending.toggleCount && c.orientationIndex === pending.orientationIndex && equal(c.enabled, pending.enabled), 'Uncharged/multiple control change');
      }
      if (observed) pending = null;
      else if (m.elapsed - pending.at > 1.5) { note('unobserved-input-retry', { at: m.elapsed, kind: pending.kind }); pending = null; }
      else return [];
    }
    const plan = planVisibleState(m, { serveOptional }), urgent = m.devices.find((d, i) => d.critical && !d.enabled && plan.enabled[i]);
    if (!urgent && m.solar.orientationIndex !== plan.orientationIndex) return issue(m, 'rotate', 'Space');
    const target = urgent ?? m.devices.find((d, i) => d.enabled && !plan.enabled[i]) ?? m.devices.find((d, i) => !d.enabled && plan.enabled[i]);
    if (!target) return [];
    if (m.selectedId !== target.id) {
      const direction = m.devices.findIndex(d => d.id === target.id) > m.devices.findIndex(d => d.id === m.selectedId) ? 'down' : 'up';
      return issue(m, 'navigate', direction === 'down' ? 'ArrowDown' : 'ArrowUp', { expectedId: predictFocus(m, direction) });
    }
    return issue(m, 'toggle', 'b');
  }
  pilot.diagnostics = () => structuredClone(diagnostics); return pilot;
}
const defaultPilot = createPilot();
export function keys(state, options) { return defaultPilot(state, options); }

export function assertPublicBoard(m, assert) {
  validate(m); const near = (a, b, label) => assert.ok(Number.isFinite(a) && Math.abs(a - b) <= EPS, `${label}: ${a} vs ${b}`);
  assert.equal(m.deviceCount, 3); assert.equal(m.elapsed, m.tick / 60); assert.equal(m.remaining, Math.max(0, m.timeLimit - m.elapsed));
  assert.equal(m.solar.panelAngleDeg, ANGLES[m.solar.orientationIndex]);
  assert.equal(m.quotaMetCount, m.devices.filter(d => d.quotaMet).length); assert.equal(m.allQuotasMet, m.quotaMetCount === 3);
  for (const d of m.devices) { assert.equal(d.quotaMet, d.deliveredJ >= d.quotaJ - EPS); assert.equal(d.brownoutSeconds, d.brownoutTicks / 60); if (!d.critical) assert.equal(d.brownoutTicks, 0); }
  const l = m.ledger, b = m.battery;
  near(l.initialBatteryJ, b.initialEnergyJ, 'initial energy'); near(l.deliveredJ, m.devices.reduce((n, d) => n + d.deliveredJ, 0), 'independent delivered quotas');
  near(l.initialBatteryJ + l.solarJ - b.energyJ - l.deliveredJ - l.spilledJ, 0, 'global energy conservation'); near(l.energyErrorJ, l.initialBatteryJ + l.solarJ - b.energyJ - l.deliveredJ - l.spilledJ, 'ledger residual');
  assert.ok(b.temperatureC >= b.ambientC && b.energyJ >= 0 && b.energyJ <= b.capacityJ);
  const f = m.lastFlow;
  if (!m.tick) { assert.equal(f, null); assert.equal(m.solar.generationW, 0); assert.equal(m.panelTurns + m.toggleCount, 0); }
  else {
    assert.ok(f); assert.equal(f.id, m.tick); assert.equal(f.fromTime, (m.tick - 1) / 60); assert.equal(f.toTime, m.tick / 60);
    const p = predictInterval(m, { fromTime: f.fromTime, energyJ: f.batteryBeforeJ, temperatureC: f.temperatureBeforeC });
    for (const key of ['solarW', 'requestedW', 'deliveredW', 'unservedW', 'chargeW', 'dischargeW', 'spillW', 'solarJ', 'deliveredJ', 'chargeJ', 'dischargeJ', 'spillJ', 'batteryAfterJ', 'temperatureAfterC']) near(f[key], p[key], 'lastFlow.' + key);
    for (const key of ['periodId', 'sunAngleDeg', 'irradiance', 'shadowed', 'alignment', 'generationW']) assert.equal(m.solar[key], p.sun[key]);
    p.deviceFlows.forEach((d, i) => { assert.equal(f.deviceFlows[i].deviceId, d.deviceId); for (const key of ['requestedW', 'deliveredW', 'deliveredJ']) near(f.deviceFlows[i][key], d[key], 'deviceFlow.' + key); near(m.devices[i].requestedW, d.requestedW, 'requestedW'); near(m.devices[i].deliveredW, d.deliveredW, 'deliveredW'); });
    near(b.energyJ, f.batteryAfterJ, 'committed battery'); near(b.temperatureC, f.temperatureAfterC, 'committed temperature'); near(b.chargeW, f.chargeW, 'charge power'); near(b.dischargeW, f.dischargeW, 'discharge power'); near(b.thermalRateCPerSecond, p.thermalRate, 'thermal rate');
  }
  const op = m.lastOperation;
  if (!m.panelTurns && !m.toggleCount) assert.equal(op, null);
  else { assert.ok(op); assert.equal(op.id, op.tick); assert.equal(op.at, op.tick / 60); assert.ok(op.tick > 0 && op.tick <= m.tick); if (op.kind === 'rotate') { assert.equal(op.deviceId, null); assert.equal(op.after, m.solar.orientation); assert.equal(op.after, ORIENTATIONS[(ORIENTATIONS.indexOf(op.before) + 1) % 3]); } else { assert.equal(op.kind, 'toggle'); assert.equal(op.after, !op.before); assert.equal(m.devices.find(d => d.id === op.deviceId).enabled, op.after); } }
  const missing = m.devices.filter(d => !d.quotaMet).map(d => d.id), brownout = m.devices.filter(d => d.critical && d.brownoutTicks >= d.maxBrownoutTicks).map(d => d.id);
  const reason = b.temperatureC >= b.thermalLimitC ? 'heat' : brownout.length ? 'brownout' : m.tick >= 3600 && missing.length ? 'quota' : null;
  assert.equal(m.phase, reason ? 'lost' : m.tick >= 3600 ? 'won' : 'playing');
  if (reason) { assert.equal(m.lostReason, reason); assert.deepEqual(m.failure, { reason, deviceIds: reason === 'heat' ? [] : reason === 'brownout' ? brownout : missing, missingQuotaDeviceIds: missing, temperatureC: b.temperatureC }); }
  else { assert.equal(m.failure, null); assert.equal(m.lostReason, null); }
  assert.equal(m.score, m.devices.reduce((n, d) => n + (d.quotaMet ? 200 : Math.floor(200 * Math.min(1, d.deliveredJ / d.quotaJ))), 0) + (m.phase === 'won' ? 1000 + 2 * Math.floor(b.energyJ + EPS) : 0));
}

export function assertProgress({ before, after, trace }, assert) {
  assert.equal(after.phase, 'won'); assertPublicBoard(after.model, assert);
  let c = controls(before.model), opTick = before.model.lastOperation?.tick ?? 0;
  for (const sample of trace) {
    const m = sample.state.model; assertPublicBoard(m, assert);
    assert.deepEqual(m.sunPeriods, before.model.sunPeriods); assert.deepEqual(m.shadowWindows, before.model.shadowWindows);
    const next = controls(m), delta = next.panelTurns + next.toggleCount - c.panelTurns - c.toggleCount;
    assert.ok(delta === 0 || delta === 1, 'This assertion needs the ordinary per-action observation trace, not sparse video sampling');
    if (delta) { const op = m.lastOperation; assert.ok(op.tick > opTick); opTick = op.tick; if (op.kind === 'rotate') { assert.equal(op.before, ORIENTATIONS[c.orientationIndex]); c.orientationIndex = (c.orientationIndex + 1) % 3; c.panelTurns++; } else { const index = m.devices.findIndex(d => d.id === op.deviceId); assert.equal(op.before, c.enabled[index]); c.enabled[index] = !c.enabled[index]; c.toggleCount++; } }
    assert.equal(next.orientationIndex, c.orientationIndex); assert.deepEqual(next.enabled, c.enabled); assert.equal(next.panelTurns, c.panelTurns); assert.equal(next.toggleCount, c.toggleCount); c.selectedId = next.selectedId;
  }
  const m = after.model; assert.equal(m.tick, 3600); assert.equal(m.elapsed, 60); assert.equal(m.allQuotasMet, true); assert.ok(m.panelTurns > 0 && m.toggleCount > 0);
  assert.ok(trace.some(s => s.state.model.solar.shadowed && s.state.model.solar.generationW === 0));
  assert.ok(trace.some(s => s.state.model.battery.chargeW > 0) && trace.some(s => s.state.model.battery.dischargeW > 0));
}

export function assertRetry({ after, initial }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'playing'); assert.ok(m.tick < 120);
  assert.equal(m.panelTurns, 0); assert.equal(m.toggleCount, 0); assert.equal(m.selectedId, m.devices[0].id); assert.equal(m.solar.orientation, 'E'); assert.ok(m.devices.every(d => d.enabled));
  if (initial) { assert.equal(m.level, initial.model.level); assert.deepEqual(m.sunPeriods, initial.model.sunPeriods); assert.deepEqual(m.shadowWindows, initial.model.shadowWindows); }
  let energyJ = m.battery.initialEnergyJ, temperatureC = m.battery.initialTemperatureC; const delivered = m.devices.map(() => 0);
  for (let tick = 0; tick < m.tick; tick++) { const f = predictInterval(m, { fromTime: tick / 60, energyJ, temperatureC }); energyJ = f.batteryAfterJ; temperatureC = f.temperatureAfterC; f.deviceFlows.forEach((d, i) => { delivered[i] += d.deliveredJ; }); }
  assert.ok(Math.abs(m.battery.energyJ - energyJ) <= EPS && Math.abs(m.battery.temperatureC - temperatureC) <= EPS);
  m.devices.forEach((d, i) => assert.ok(Math.abs(d.deliveredJ - delivered[i]) <= EPS, 'Retry must restore initial accumulators before ordinary time advances'));
}
