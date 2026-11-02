// Public delayed-actuator feedback. No Model import, author strategy, private fields or level-specific route.
const IDS = ['vent', 'shade', 'drip'], DIMENSIONS = ['temperature', 'humidity', 'soilMoisture'], EPS = 1e-8;
const must = (ok, message) => { if (!ok) throw Error(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const finite = (...values) => values.every(Number.isFinite);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const inside = (x, band) => x >= band[0] && x <= band[1];
const levels = (m, key) => Object.fromEntries(m.dials.map(d => [d.id, d[key]]));
const immutableControls = m => ({ selectedId: m.selectedId, requested: levels(m, 'requestedLevel'), commandCount: m.commandCount, blockedCommands: m.blockedCommands });

function validate(m) {
  must(m.dials.length === 3 && same(m.dials.map(d => d.id), IDS), 'Three public dials in their disclosed order required');
  must(IDS.includes(m.selectedId) && m.dials.every(d => [d.requestedLevel, d.appliedLevel].every(n => Number.isInteger(n) && n >= 0 && n <= 2)), 'Invalid requested/applied levels');
  must(Number.isInteger(m.tick) && m.tick >= 0 && m.elapsed === m.tick / 60 && m.timeLimit === 90, 'Invalid public clock');
  must(Number.isInteger(m.delayTicks) && m.delayTicks >= 1 && m.delayTicks <= 150, 'Bounded actuation delay required');
  must(finite(...DIMENSIONS.map(k => m.environment[k]), m.reservoir.initialLitres, m.reservoir.remainingLitres, m.reservoir.usedLitres), 'Finite public environment required');
  must(m.reservoir.remainingLitres >= -EPS && m.reservoir.usedLitres >= -EPS && m.pendingCommands.length <= m.delayTicks + 1, 'Invalid resource/queue bounds');
  must(m.crops.length === 3 && new Set(m.crops.map(c => c.id)).size === 3, 'Three independently identified crops required');
  for (const c of m.crops) {
    must(Number.isInteger(c.maturityTicks) && c.maturityTicks > 0 && Number.isInteger(c.damageLimitTicks) && c.damageLimitTicks > 0, 'Finite growth/damage thresholds required');
    for (const k of DIMENSIONS) must(c.comfort[k].length === 2 && c.safe[k].length === 2 && finite(...c.comfort[k], ...c.safe[k]) && c.safe[k][0] <= c.comfort[k][0] && c.comfort[k][0] < c.comfort[k][1] && c.comfort[k][1] <= c.safe[k][1], 'Invalid public crop bands');
  }
  must(m.weatherPeriods.length > 0 && m.weatherPeriods.length <= 8 && m.weatherPeriods.every(p => finite(p.from, p.to, p.heatInput) && p.from < p.to), 'Bounded public weather schedule required');
  for (const key of ['outsideTemperature', 'outsideHumidity', 'temperatureRelax', 'ventCooling', 'shadeHeatFraction', 'humidityRelax', 'naturalHumidity', 'ventDrying', 'irrigationHumidity', 'dripRatePerLevel', 'soilGain', 'baseEvaporation', 'hotEvaporation', 'ventEvaporation', 'shadeConservation']) must(Number.isFinite(m.physics[key]), 'Missing finite public physics: ' + key);
}

export function weatherAt(m, tick) {
  must(Number.isInteger(tick) && tick >= 0 && tick < m.timeLimit * 60, 'Weather hypothesis requires an active fixed tick');
  const at = tick / 60, p = m.weatherPeriods.find(p => at >= p.from && at < p.to);
  must(p, 'Public weather does not cover the requested interval'); return p;
}

// One disclosed fixed interval. This is a hypothesis, never a future production state.
export function predictInterval(m, { fromTick = m.tick, environment = m.environment, water = m.reservoir.remainingLitres, appliedLevels = levels(m, 'appliedLevel') } = {}) {
  must(finite(...DIMENSIONS.map(k => environment[k]), water) && water >= -EPS && IDS.every(id => Number.isInteger(appliedLevels[id]) && appliedLevels[id] >= 0 && appliedLevels[id] <= 2), 'Invalid public interval hypothesis');
  const p = m.physics, dt = 1 / 60, v = appliedLevels.vent, s = appliedLevels.shade, d = appliedLevels.drip, heatInput = weatherAt(m, fromTick).heatInput;
  const usedLitres = Math.min(Math.max(0, water), d * p.dripRatePerLevel * dt), e = environment;
  const evaporationPctPerSec = Math.max(0, p.baseEvaporation + p.hotEvaporation * Math.max(e.temperature - p.outsideTemperature, 0) + p.ventEvaporation * v - p.shadeConservation * s);
  const afterEnvironment = {
    temperature: clamp(e.temperature + (heatInput * (1 - p.shadeHeatFraction * s) - p.ventCooling * v - p.temperatureRelax * (e.temperature - p.outsideTemperature)) * dt, 0, 60),
    humidity: clamp(e.humidity + (p.naturalHumidity - p.ventDrying * v - p.humidityRelax * (e.humidity - p.outsideHumidity)) * dt + p.irrigationHumidity * usedLitres, 0, 100),
    soilMoisture: clamp(e.soilMoisture - evaporationPctPerSec * dt + p.soilGain * usedLitres, 0, 100)
  };
  return { fromTick, toTick: fromTick + 1, fromTime: fromTick / 60, toTime: (fromTick + 1) / 60, beforeEnvironment: { ...e }, afterEnvironment,
    beforeWater: water, afterWater: Math.max(0, water - usedLitres), usedLitres, actualDripLps: usedLitres / dt, evaporationPctPerSec, appliedLevels: { ...appliedLevels }, heatInput };
}

function climateCost(m, environment, crops) {
  let cost = 0;
  const unfinished = m.crops.filter((c, i) => crops[i].growthTicks < c.maturityTicks);
  for (const k of DIMENSIONS) {
    const active = unfinished.length ? unfinished : m.crops, lo = Math.max(...active.map(c => c.comfort[k][0])), hi = Math.min(...active.map(c => c.comfort[k][1]));
    must(lo <= hi, 'This bounded controller requires a public common comfort intersection');
    const half = Math.max((hi - lo) / 2, .5), centered = (environment[k] - (lo + hi) / 2) / half;
    const outside = Math.max(lo - environment[k], environment[k] - hi, 0) / half;
    cost += (k === 'humidity' ? .35 : 1) * (.35 * centered * centered + 8 * outside * outside);
  }
  return cost;
}

// At most seven hypotheses, each at most delay+180 <= 330 exact disclosed ticks.
// Existing absolute FIFO commands remain in every branch; one prospective request is added.
export function planVisibleState(m, { allowIrrigation = true, lookaheadAfterDelayTicks = 180 } = {}) {
  validate(m); must(typeof allowIrrigation === 'boolean' && Number.isInteger(lookaheadAfterDelayTicks) && lookaheadAfterDelayTicks >= 60 && lookaheadAfterDelayTicks <= 180, 'Bounded planner options required');
  const candidates = [null];
  for (const dial of m.dials) for (const delta of [-1, 1]) {
    const target = dial.requestedLevel + delta;
    if (target >= 0 && target <= 2 && (allowIrrigation || dial.id !== 'drip' || target === 0)) candidates.push({ dialId: dial.id, delta, beforeRequested: dial.requestedLevel, afterRequested: target });
  }
  const horizon = Math.min(m.delayTicks + lookaheadAfterDelayTicks, m.timeLimit * 60 - m.tick);
  must(horizon > 0, 'Planner needs an active public state');
  const outcomes = candidates.map(command => {
    let environment = { ...m.environment }, water = m.reservoir.remainingLitres, dryStallTicks = m.dryStallTicks, cost = command ? .012 : 0, reason = null;
    const applied = levels(m, 'appliedLevel'), crops = m.crops.map(c => ({ growthTicks: c.growthTicks, damageTicks: c.damageTicks }));
    const queue = m.pendingCommands.map(c => ({ ...c }));
    if (command) queue.push({ ...command, id: m.commandCount + 1, issuedTick: m.tick + 1, dueTick: m.tick + 1 + m.delayTicks });
    queue.sort((a, b) => a.dueTick - b.dueTick || a.id - b.id); let head = 0, simulatedTicks = 0;
    for (let i = 0; i < horizon; i++) {
      const tick = m.tick + i + 1;
      while (head < queue.length && queue[head].dueTick <= tick) { const c = queue[head++]; applied[c.dialId] = c.afterRequested; }
      const flow = predictInterval(m, { fromTick: tick - 1, environment, water, appliedLevels: applied }); environment = flow.afterEnvironment; water = flow.afterWater; simulatedTicks++;
      let gained = 0, damaged = 0; const gainedFlags = m.crops.map(() => false);
      m.crops.forEach((c, j) => {
        if (crops[j].growthTicks < c.maturityTicks && DIMENSIONS.every(k => inside(environment[k], c.comfort[k]))) { crops[j].growthTicks++; gained++; gainedFlags[j] = true; }
        if (DIMENSIONS.some(k => !inside(environment[k], c.safe[k]))) { crops[j].damageTicks++; damaged++; }
      });
      const unfinished = m.crops.some((c, j) => crops[j].growthTicks < c.maturityTicks);
      const unfinishedGrow = m.crops.some((c, j) => crops[j].growthTicks < c.maturityTicks && gainedFlags[j]);
      dryStallTicks = water <= 1e-9 && unfinished && !unfinishedGrow ? dryStallTicks + 1 : 0;
      cost += (climateCost(m, environment, crops) - 1.2 * gained + 30 * damaged) / 60 + .04 * flow.usedLitres;
      if (m.crops.some((c, j) => crops[j].damageTicks >= c.damageLimitTicks)) reason = 'crop';
      else if (!unfinished) reason = 'won';
      else if (dryStallTicks >= m.dryStallLimitTicks) reason = 'water';
      else if (tick >= m.timeLimit * 60) reason = 'timeout';
      if (reason) { cost += reason === 'won' ? -1000 : 100000; break; }
    }
    cost += 1.5 * climateCost(m, environment, crops);
    return { command, cost, simulatedTicks, environment, remainingLitres: water, growthTicks: crops.map(c => c.growthTicks), damageTicks: crops.map(c => c.damageTicks), reason };
  });
  outcomes.sort((a, b) => a.cost - b.cost || Number(!!a.command) - Number(!!b.command));
  return { command: outcomes[0].command, projected: outcomes[0], candidateCount: outcomes.length, hypothesisTicks: outcomes.reduce((n, row) => n + row.simulatedTicks, 0), scope: 'Public fixed-step hypotheses with existing FIFO commands; actual input and application still require observation.' };
}

export function predictFocus(m, direction) {
  must(['up', 'down', 'left', 'right'].includes(direction), 'Cardinal navigation only');
  const index = m.dials.findIndex(d => d.id === m.selectedId); must(index >= 0, 'Observed selection is not a public dial');
  return m.dials[clamp(index + (['up', 'left'].includes(direction) ? -1 : 1), 0, m.dials.length - 1)].id;
}

export function createPilot({ allowIrrigation = true } = {}) {
  let previousTick = -1, releaseNext = false, neutralTick = -1, pending = null, cachedPlan = null, plannedAt = -Infinity, planSignature = '';
  const diagnostics = [], note = (type, fields) => diagnostics.push({ type, ...fields });
  const reset = () => { releaseNext = false; neutralTick = -1; pending = null; cachedPlan = null; plannedAt = -Infinity; planSignature = ''; diagnostics.length = 0; };
  const issue = (m, key, kind, extra = {}) => { pending = { kind, at: m.elapsed, tick: m.tick, ...immutableControls(m), ...extra }; releaseNext = true; note('input', { tick: m.tick, key, kind, selectedId: m.selectedId }); return [key]; };
  function pilot(state) {
    const m = state.model; if (!m) return [];
    if (m.tick < previousTick) reset(); previousTick = m.tick;
    if (state.phase !== 'playing' || state.paused || m.phase !== 'playing') return [];
    if (releaseNext) { releaseNext = false; neutralTick = m.tick; return []; }
    if (m.tick <= neutralTick) return [];
    if (pending) {
      const now = immutableControls(m); let acknowledged = false;
      if (pending.kind === 'navigate') {
        must(now.commandCount === pending.commandCount && now.blockedCommands === pending.blockedCommands && same(now.requested, pending.requested), 'Navigation must not enqueue a physical command');
        if (now.selectedId !== pending.selectedId || now.selectedId === pending.expectedId) { acknowledged = true; note('observed-focus', { tick: m.tick, selectedId: now.selectedId }); }
      } else if (now.commandCount === pending.commandCount + 1) {
        const receipt = m.lastCommand, expected = { ...pending.requested, [pending.dialId]: pending.afterRequested };
        must(receipt && receipt.id === now.commandCount && receipt.dialId === pending.dialId && receipt.beforeRequested === pending.beforeRequested && receipt.afterRequested === pending.afterRequested, 'Accepted command must continue the observed requested level');
        must(receipt.issuedTick > pending.tick && receipt.issuedTick <= m.tick && receipt.dueTick === receipt.issuedTick + m.delayTicks, 'Command must use its actual issue tick and full delay');
        must(now.selectedId === pending.selectedId && same(now.requested, expected) && now.blockedCommands === pending.blockedCommands, 'Unexpected extra requested-level change');
        acknowledged = true; cachedPlan = null; note('observed-command', { observedTick: m.tick, command: { ...receipt } });
      } else must(now.commandCount === pending.commandCount && now.blockedCommands === pending.blockedCommands && same(now.requested, pending.requested), 'Uncharged or multiple requested-level changes');
      if (acknowledged) pending = null;
      else if (m.elapsed - pending.at > 1.5) { note('unobserved-input-retry', { tick: m.tick, kind: pending.kind }); pending = null; cachedPlan = null; }
      else return [];
    }
    const signature = `${m.commandCount}:${m.appliedCommandCount}:${m.currentWeather.id}`;
    if (!cachedPlan || m.tick - plannedAt >= 30 || signature !== planSignature) {
      cachedPlan = planVisibleState(m, { allowIrrigation }); plannedAt = m.tick; planSignature = signature;
      note('plan', { tick: m.tick, command: cachedPlan.command, candidateCount: cachedPlan.candidateCount, hypothesisTicks: cachedPlan.hypothesisTicks });
    }
    const command = cachedPlan.command; if (!command) return [];
    const actual = m.dials.find(d => d.id === command.dialId);
    if (actual.requestedLevel !== command.beforeRequested) { cachedPlan = null; return []; }
    if (m.selectedId !== command.dialId) {
      const direction = IDS.indexOf(command.dialId) > IDS.indexOf(m.selectedId) ? 'down' : 'up';
      return issue(m, direction === 'down' ? 'ArrowDown' : 'ArrowUp', 'navigate', { expectedId: predictFocus(m, direction) });
    }
    // Navigation time may change the climate: reevaluate the single prospective request immediately before dispatch.
    const fresh = plannedAt === m.tick ? cachedPlan : planVisibleState(m, { allowIrrigation }); cachedPlan = fresh; plannedAt = m.tick; planSignature = signature;
    if (!fresh.command || fresh.command.dialId !== m.selectedId) return [];
    return issue(m, fresh.command.delta > 0 ? 'Space' : 'b', 'command', fresh.command);
  }
  pilot.diagnostics = () => structuredClone(diagnostics); return pilot;
}
const defaultPilot = createPilot();
export function keys(state, options) { return defaultPilot(state, options); }

export function assertPublicBoard(m, assert) {
  validate(m); const near = (a, b, label) => assert.ok(Number.isFinite(a) && Math.abs(a - b) <= EPS, `${label}: ${a} vs ${b}`);
  assert.equal(m.remaining, Math.max(0, m.timeLimit - m.elapsed));
  near(m.reservoir.initialLitres, m.reservoir.remainingLitres + m.reservoir.usedLitres, 'Reservoir ledger');
  assert.equal(m.matureCount, m.crops.filter(c => c.mature).length);
  assert.deepEqual(m.deadCropIds, m.crops.filter(c => c.dead).map(c => c.id));
  assert.deepEqual(m.unfinishedCropIds, m.crops.filter(c => !c.mature).map(c => c.id));
  for (const c of m.crops) {
    assert.ok(Number.isInteger(c.growthTicks) && c.growthTicks >= 0 && c.growthTicks <= c.maturityTicks && Number.isInteger(c.damageTicks) && c.damageTicks >= 0);
    assert.equal(c.mature, c.growthTicks >= c.maturityTicks); assert.equal(c.dead, c.damageTicks >= c.damageLimitTicks);
    for (const key of DIMENSIONS) assert.equal(c.comfortChecks[key], inside(m.environment[key], c.comfort[key]));
    assert.equal(c.inRange, DIMENSIONS.every(k => c.comfortChecks[k]));
    assert.deepEqual(c.failedComfortDimensions, DIMENSIONS.filter(k => !c.comfortChecks[k]));
    assert.deepEqual(c.unsafeDimensions, DIMENSIONS.filter(k => !inside(m.environment[k], c.safe[k])));
    assert.equal(c.dangerous, c.unsafeDimensions.length > 0);
  }
  assert.equal(m.commandCount - m.appliedCommandCount, m.pendingCommands.length);
  let prior = m.appliedCommandCount;
  for (const c of m.pendingCommands) { assert.equal(c.id, ++prior); assert.ok(IDS.includes(c.dialId)); assert.equal(Math.abs(c.afterRequested - c.beforeRequested), 1); assert.equal(c.dueTick, c.issuedTick + m.delayTicks); assert.ok(c.issuedTick <= m.tick && c.dueTick > m.tick); }
  if (!m.commandCount) assert.equal(m.lastCommand, null);
  else { assert.equal(m.lastCommand.id, m.commandCount); assert.equal(m.lastCommand.dueTick, m.lastCommand.issuedTick + m.delayTicks); assert.equal(m.dials.find(d => d.id === m.lastCommand.dialId).requestedLevel, m.lastCommand.afterRequested); }
  const f = m.lastInterval;
  if (!m.tick) { assert.equal(f, null); assert.equal(m.lastAppliedCommands, null); assert.equal(m.commandCount, 0); assert.equal(m.appliedCommandCount, 0); assert.ok(m.crops.every(c => !c.growing)); }
  else {
    assert.ok(f); assert.equal(f.fromTick, m.tick - 1); assert.equal(f.toTick, m.tick); assert.equal(f.fromTime, f.fromTick / 60); assert.equal(f.toTime, m.tick / 60);
    assert.deepEqual(f.appliedLevels, levels(m, 'appliedLevel'));
    const predicted = predictInterval(m, { fromTick: f.fromTick, environment: f.beforeEnvironment, water: f.beforeWater, appliedLevels: f.appliedLevels });
    for (const key of DIMENSIONS) { near(f.afterEnvironment[key], predicted.afterEnvironment[key], 'Last interval ' + key); near(m.environment[key], f.afterEnvironment[key], 'Actual environment ' + key); }
    for (const key of ['usedLitres', 'actualDripLps', 'evaporationPctPerSec', 'heatInput']) near(f[key], predicted[key], 'Last interval ' + key);
    near(m.reservoir.remainingLitres, predicted.afterWater, 'Remaining actual water');
    assert.deepEqual(m.currentWeather, weatherAt(m, m.tick - 1));
    for (const c of m.crops) { assert.equal(c.growing, f.growthCropIds.includes(c.id)); if (c.growing) assert.ok(c.inRange && c.growthTicks > 0); assert.equal(f.damagedCropIds.includes(c.id), c.dangerous); }
    assert.ok(Array.isArray(m.lastAppliedCommands));
    for (const c of m.lastAppliedCommands) { assert.equal(c.appliedTick, m.tick); assert.equal(c.at, m.tick / 60); assert.equal(c.dueTick, m.tick); assert.equal(c.afterApplied, c.afterRequested); }
  }
  const reason = m.deadCropIds.length ? 'crop' : m.matureCount === m.crops.length ? null : m.dryStallTicks >= m.dryStallLimitTicks ? 'water' : m.tick >= m.timeLimit * 60 ? 'timeout' : null;
  assert.equal(m.phase, reason ? 'lost' : m.matureCount === m.crops.length ? 'won' : 'playing'); assert.equal(m.lostReason, reason);
  const score = m.crops.reduce((n, c) => n + (c.mature ? 200 : Math.floor(200 * c.growthTicks / c.maturityTicks)), 0) + (m.phase === 'won' ? 1000 + Math.floor(m.reservoir.remainingLitres + EPS) : 0);
  assert.equal(m.score, score);
}

export function assertProgress({ before, after, trace }, assert) {
  assert.equal(after.phase, 'won'); assertPublicBoard(after.model, assert);
  const known = new Map(before.model.pendingCommands.map(c => [c.id, c])), requested = levels(before.model, 'requestedLevel'), applied = levels(before.model, 'appliedLevel');
  let count = before.model.commandCount, appliedCount = before.model.appliedCommandCount;
  for (const sample of trace) {
    const m = sample.state.model; assertPublicBoard(m, assert);
    assert.deepEqual(m.physics, before.model.physics); assert.deepEqual(m.weatherPeriods, before.model.weatherPeriods);
    const delta = m.commandCount - count; assert.ok(delta === 0 || delta === 1, 'This assertion uses per-command observations, not sparse video states');
    if (delta) { const c = m.lastCommand; assert.equal(c.id, ++count); assert.equal(c.beforeRequested, requested[c.dialId]); requested[c.dialId] = c.afterRequested; known.set(c.id, c); }
    for (const c of known.values()) if (c.id > appliedCount && c.dueTick <= m.tick) { assert.equal(c.id, appliedCount + 1); applied[c.dialId] = c.afterRequested; appliedCount++; }
    assert.equal(m.appliedCommandCount, appliedCount); assert.deepEqual(levels(m, 'requestedLevel'), requested); assert.deepEqual(levels(m, 'appliedLevel'), applied);
  }
  assert.ok(after.model.elapsed >= 30 && after.model.elapsed <= 90); assert.equal(after.model.matureCount, 3); assert.deepEqual(after.model.deadCropIds, []);
  assert.ok(after.model.commandCount > 0 && after.model.appliedCommandCount > 0);
  assert.ok(trace.some(s => s.state.model.pendingCommands.length && s.state.model.dials.some(d => d.requestedLevel !== d.appliedLevel)), 'Actual delayed requested/applied distinction must be observed');
}

export function assertRetry({ after, initial }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'playing'); assert.ok(m.tick < 120);
  assert.equal(m.commandCount, 0); assert.equal(m.appliedCommandCount, 0); assert.equal(m.blockedCommands, 0); assert.deepEqual(m.pendingCommands, []); assert.equal(m.lastCommand, null);
  assert.equal(m.selectedId, IDS[0]); assert.ok(m.dials.every(d => d.requestedLevel === 0 && d.appliedLevel === 0));
  nearRetry(m.reservoir.remainingLitres, m.reservoir.initialLitres, assert); assert.equal(m.reservoir.usedLitres, 0);
  if (initial) {
    assert.equal(m.level, initial.model.level); assert.deepEqual(m.physics, initial.model.physics); assert.deepEqual(m.weatherPeriods, initial.model.weatherPeriods);
    let environment = { ...initial.model.environment };
    for (let tick = 0; tick < m.tick; tick++) environment = predictInterval(m, { fromTick: tick, environment, water: m.reservoir.initialLitres, appliedLevels: { vent: 0, shade: 0, drip: 0 } }).afterEnvironment;
    for (const key of DIMENSIONS) nearRetry(m.environment[key], environment[key], assert);
  }
}
function nearRetry(a, b, assert) { assert.ok(Math.abs(a - b) <= EPS, 'Retry restores the initial state before actual subsequent ticks'); }
