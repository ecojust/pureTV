// Public-only scheduling hypotheses. No production Model, private fields or author routes.
export const budgets = { maxWebGLDrawCalls: 1 };
const EPS = 1e-9, CHECK_EPS = 1e-7, FPS = 60;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const must = (condition, message) => { if (!condition) throw Error(message); };
const clone = value => structuredClone(value);
const ids = m => [...m.groups.map(g => g.id), 'leak'];
function validate(m) {
  must(m && Number.isInteger(m.tick) && m.tick >= 0 && Number.isFinite(m.timeLimit) && m.timeLimit > 0 && m.timeLimit <= 90, 'Finite public time required');
  must(m.groups.length === 3 && new Set(m.groups.map(g => g.id)).size === 3, 'Three unique public groups required');
  must(m.groups.every(g => Number.isFinite(g.breathingRate) && g.breathingRate > 0 && Number.isInteger(g.deadlineTick) && ['A', 'B', 'C'].includes(g.location)), 'Invalid public group facts');
  for (const key of ['recoveryRate', 'recoveryEfficiency', 'ventRate', 'fillRate', 'loadTicks', 'unloadTicks']) must(Number.isFinite(m.physics[key]) && m.physics[key] > 0, 'Missing public physics ' + key);
  must(m.physics.recoveryEfficiency <= 1 && Number.isInteger(m.leak.serviceTicks) && m.leak.serviceTicks > 0 && Number.isFinite(m.leak.rate) && m.leak.rate >= 0, 'Invalid transfer or isolation facts');
  must(Number.isFinite(m.tank.oxygen) && Number.isFinite(m.tank.capacity) && m.tank.capacity > 0 && m.tank.oxygen >= -EPS && m.tank.oxygen <= m.tank.capacity + EPS, 'Invalid public tank');
  must(Number.isFinite(m.chambers.A.air) && m.chambers.A.capacity > 0 && m.chambers.A.air >= -EPS && m.chambers.A.air <= m.chambers.A.capacity + EPS, 'Invalid public airlock');
  must(ids(m).includes(m.selectedId) && ['recover', 'vent'].includes(m.modeSelection), 'Invalid public selection');
}

function forecastState(m) {
  return { tick: m.tick, oxygen: m.tank.oxygen, air: m.chambers.A.air, isolated: m.leak.isolated,
    groups: m.groups.map(g => ({ id: g.id, location: g.location, arrivalTick: g.arrivalTick })),
    task: m.task ? { phase: m.task.phase, phaseTicks: m.task.phaseTicks, groupId: m.task.groupId, stopped: m.task.stopped } : null,
    selectedId: m.selectedId, mode: m.modeSelection, reason: null, arrivals: [], segments: 0, boundaryTicks: 0 };
}
// Exact disclosed ordering for a prospective interval: equipment, leak, then proportional respiration.
function flow(m, s) {
  const p = m.physics, task = s.task, running = task && !task.stopped;
  let oxygen = s.oxygen, air = s.air, removed = 0, vented = 0, filled = 0, recovered = 0;
  if (running && task.phase === 'recover') { removed = Math.min(p.recoveryRate / FPS, Math.max(0, air), Math.max(0, m.tank.capacity - oxygen) / p.recoveryEfficiency); recovered = removed * p.recoveryEfficiency; oxygen += recovered; air -= removed; }
  if (running && task.phase === 'vent') { vented = Math.min(p.ventRate / FPS, Math.max(0, air)); air -= vented; }
  if (running && task.phase === 'fill') { filled = Math.min(p.fillRate / FPS, Math.max(0, oxygen), Math.max(0, m.chambers.A.capacity - air)); oxygen -= filled; air += filled; }
  const leaked = Math.min(Math.max(0, oxygen), s.isolated ? 0 : m.leak.rate / FPS); oxygen -= leaked;
  const demands = m.groups.map((g, i) => s.groups[i].location === 'C' ? 0 : g.breathingRate / FPS), demand = demands.reduce((a, b) => a + b, 0);
  const breathed = Math.min(Math.max(0, oxygen), demand), ratio = demand > 0 ? breathed / demand : 1;
  const insufficient = demands.some(d => d * ratio < d - EPS); oxygen -= breathed;
  return { oxygen: Math.max(0, oxygen), air: Math.max(0, air), removed, vented, filled, recovered, leaked, breathed, insufficient };
}
function phaseComplete(m, s, f, count = 1) {
  const t = s.task; if (!t || t.stopped) return false;
  if (t.phase === 'recover' || t.phase === 'vent') return f.air <= EPS;
  if (t.phase === 'fill') return f.air >= m.chambers.A.capacity - EPS;
  const limit = t.phase === 'load' ? m.physics.loadTicks : t.phase === 'unload' ? m.physics.unloadTicks : m.leak.serviceTicks;
  return t.phaseTicks + count >= limit;
}
function terminal(m, s, insufficient) {
  if (insufficient) s.reason = 'oxygen';
  else if (m.groups.some((g, i) => s.groups[i].location !== 'C' && s.tick >= g.deadlineTick)) s.reason = 'deadline';
  else if (s.groups.every(g => g.location === 'C') && s.isolated) s.reason = s.oxygen + EPS >= m.tank.reserveFloor ? 'won' : 'reserve';
  else if (s.tick >= m.timeLimit * FPS) s.reason = 'timeout';
}
function boundaryTick(m, s) {
  const f = flow(m, s); s.tick++; s.boundaryTicks++; s.oxygen = f.oxygen; s.air = f.air;
  if (s.task && !s.task.stopped) {
    const t = s.task; t.phaseTicks++;
    // Count was incremented above, so use zero when checking timed phases.
    if (phaseComplete(m, s, f, 0)) {
      if (t.phase === 'recover' || t.phase === 'vent') { t.phase = 'load'; t.phaseTicks = 0; }
      else if (t.phase === 'load') { s.groups.find(g => g.id === t.groupId).location = 'A'; t.phase = 'fill'; t.phaseTicks = 0; }
      else if (t.phase === 'fill') { t.phase = 'unload'; t.phaseTicks = 0; }
      else if (t.phase === 'unload') { const g = s.groups.find(g => g.id === t.groupId); g.location = 'C'; g.arrivalTick = s.tick; s.arrivals.push({ groupId: g.id, tick: s.tick }); s.task = null; }
      else { s.isolated = true; s.task = null; }
    }
  }
  terminal(m, s, f.insufficient);
}

// A constant-flow segment is certified at both endpoints. Each min() argument is
// affine within it, hence its endpoint inequalities also hold in its interior.
// Leave phase changes, finite-stock edges, deadlines and ceil/EPS decisions to exact ticks.
function advance(m, s, requestedTicks = m.timeLimit * FPS - s.tick, stopAtTaskEnd = false) {
  let remaining = requestedTicks;
  while (remaining > 0 && !s.reason && (!stopAtTaskEnd || s.task)) {
    const deadline = Math.min(m.timeLimit * FPS, ...m.groups.filter((g, i) => s.groups[i].location !== 'C').map(g => g.deadlineTick));
    let hi = Math.max(0, Math.min(remaining, deadline - s.tick - 1));
    const first = flow(m, s), dO = first.oxygen - s.oxygen, dA = first.air - s.air;
    const constant = n => {
      if (n < 1 || first.insufficient) return false;
      const at = { ...s, oxygen: s.oxygen + dO * (n - 1), air: s.air + dA * (n - 1) };
      if (at.oxygen < -EPS || at.oxygen > m.tank.capacity + EPS || at.air < -EPS || at.air > m.chambers.A.capacity + EPS) return false;
      const last = flow(m, at);
      return !last.insufficient && !phaseComplete(m, s, last, n) && ['removed', 'vented', 'filled', 'recovered', 'leaked', 'breathed'].every(k => Math.abs(last[k] - first[k]) <= 1e-13);
    };
    let lo = 0;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (constant(mid)) lo = mid; else hi = mid - 1; }
    if (lo >= 2) { s.oxygen += dO * lo; s.air += dA * lo; s.tick += lo; if (s.task && !s.task.stopped) s.task.phaseTicks += lo; s.segments++; remaining -= lo; }
    else { boundaryTick(m, s); remaining--; }
  }
}

// 16 ticks is the polling-cadence mean of two 5/8/11-tick observations, not a worst-case guarantee.
export function predictSchedule(m, schedule, { controlDelayTicks = 16, pollDelayTicks = 11 } = {}) {
  validate(m); must(!m.task, 'Schedule decisions require an actually idle task');
  must(Number.isInteger(controlDelayTicks) && controlDelayTicks >= 0 && controlDelayTicks <= 30, 'Bounded normal-input allowance required');
  must(Number.isInteger(pollDelayTicks) && pollDelayTicks >= 0 && pollDelayTicks <= 15, 'Bounded observation delay required');
  must(Array.isArray(schedule) && schedule.length <= 4, 'At most four remaining services');
  const s = forecastState(m), used = new Set(); let previousServiceTicks = 0;
  for (const [index, action] of schedule.entries()) {
    must(ids(m).includes(action.id) && !used.has(action.id), 'Distinct public tasks required'); used.add(action.id);
    must(action.id === 'leak' ? !s.isolated : s.groups.find(g => g.id === action.id)?.location === 'B', 'Only actual remaining tasks may be scheduled');
    must(action.id === 'leak' || ['recover', 'vent'].includes(action.mode), 'Batch emptying mode required');
    const canPreselect = index > 0 && previousServiceTicks >= 3 * controlDelayTicks + pollDelayTicks;
    const hops = canPreselect ? 0 : Math.abs(ids(m).indexOf(action.id) - ids(m).indexOf(s.selectedId));
    const toggle = action.id !== 'leak' && action.mode !== s.mode ? 1 : 0;
    // First key is immediate. During each >=3-second service, directions can
    // preselect the next id without changing this transaction. The next idle
    // boundary only needs one polling interval and, if required, B then A.
    advance(m, s, controlDelayTicks * (hops + toggle) + (index === 0 ? 0 : pollDelayTicks)); if (s.reason) break;
    s.selectedId = action.id; if (action.id !== 'leak') s.mode = action.mode;
    s.task = { phase: action.id === 'leak' ? 'isolate' : action.mode, phaseTicks: 0, groupId: action.id === 'leak' ? null : action.id, stopped: false };
    const taskStartTick = s.tick;
    advance(m, s, m.timeLimit * FPS - s.tick, true); previousServiceTicks = s.tick - taskStartTick; if (s.reason) break;
  }
  return { reason: s.reason, tick: s.tick, elapsed: s.tick / FPS, tankOxygen: s.oxygen, air: s.air, isolated: s.isolated,
    groups: s.groups, arrivals: s.arrivals, segments: s.segments, boundaryTicks: s.boundaryTicks,
    scope: 'Public schedule hypothesis with explicit key-navigation allowance; not an observed production state.' };
}

export function planVisibleState(m, { onlyMode = null, controlDelayTicks = 16, pollDelayTicks = 11, maxCandidates = 192 } = {}) {
  validate(m); must(!m.task, 'Wait for the actual current task to finish');
  must(onlyMode === null || ['recover', 'vent'].includes(onlyMode), 'Unknown mode restriction');
  must(Number.isInteger(maxCandidates) && maxCandidates > 0 && maxCandidates <= 192, 'Deterministic schedule cap required');
  const remaining = m.groups.filter(g => g.location !== 'C').map(g => g.id); if (!m.leak.isolated) remaining.push('leak');
  const outcomes = [];
  function visit(rest, prefix) {
    if (!rest.length) { must(outcomes.length < maxCandidates, 'Public schedule enumeration cap reached'); outcomes.push({ schedule: prefix, projected: predictSchedule(m, prefix, { controlDelayTicks, pollDelayTicks }) }); return; }
    for (const id of rest) for (const mode of id === 'leak' ? [null] : onlyMode ? [onlyMode] : ['recover', 'vent']) visit(rest.filter(v => v !== id), [...prefix, { id, mode }]);
  }
  visit(remaining, []);
  outcomes.sort((a, b) => Number(b.projected.reason === 'won') - Number(a.projected.reason === 'won') ||
    (a.projected.reason === 'won' ? a.projected.tick - b.projected.tick : b.projected.groups.filter(g => g.location === 'C').length - a.projected.groups.filter(g => g.location === 'C').length) ||
    b.projected.tankOxygen - a.projected.tankOxygen || JSON.stringify(a.schedule).localeCompare(JSON.stringify(b.schedule)));
  return { ...outcomes[0], candidateCount: outcomes.length, hypothesisSegments: outcomes.reduce((n, o) => n + o.projected.segments, 0), hypothesisBoundaryTicks: outcomes.reduce((n, o) => n + o.projected.boundaryTicks, 0) };
}

export function predictFocus(m, direction) {
  must(['up', 'left', 'down', 'right'].includes(direction), 'Cardinal input required');
  const choices = ids(m), index = choices.indexOf(m.selectedId); must(index >= 0, 'Unknown focus');
  return choices[Math.max(0, Math.min(choices.length - 1, index + (['up', 'left'].includes(direction) ? -1 : 1)))];
}

export function createPilot({ policy = 'public-schedule' } = {}) {
  must(['public-schedule', 'recover-earliest', 'vent-latest', 'vent-only'].includes(policy), 'Unknown public policy');
  let previousTick = -1, releaseNext = false, neutralTick = -1, pending = null, target = null, nextSelection = null, taskIdentity = null;
  const diagnostics = [], note = (type, data) => diagnostics.push({ type, ...data });
  const reset = () => { releaseNext = false; neutralTick = -1; pending = null; target = null; nextSelection = null; taskIdentity = null; diagnostics.length = 0; };
  const issue = (m, key, kind, fields = {}) => { pending = { kind, tick: m.tick, selectedId: m.selectedId, commandCount: m.commandCount, blockedCommands: m.blockedCommands, ...fields }; releaseNext = true; note('input', { tick: m.tick, key, kind, ...fields }); return [key]; };
  function pilot(state) {
    const m = state.model; if (!m) return [];
    if (m.tick < previousTick) reset(); previousTick = m.tick;
    if (state.phase !== 'playing' || state.paused || m.phase !== 'playing') return [];
    if (releaseNext) { releaseNext = false; neutralTick = m.tick; return []; }
    if (m.tick <= neutralTick) return [];
    if (pending) {
      must(m.blockedCommands === pending.blockedCommands, 'Normal input unexpectedly blocked');
      let acknowledged = false;
      if (pending.kind === 'navigate') { must(m.commandCount === pending.commandCount, 'Focus movement cannot issue a task'); acknowledged = m.selectedId === pending.expectedId; }
      else if (m.commandCount === pending.commandCount + 1) {
        const op = m.lastOperation;
        must(op && op.id === m.commandCount && op.type === pending.kind && op.tick > pending.tick && op.tick <= m.tick && op.at === op.tick / FPS, 'Actual accepted operation receipt required');
        if (pending.kind === 'mode') must(op.mode === pending.mode && m.modeSelection === pending.mode, 'Actual emptying mode did not change');
        if (pending.kind === 'start') {
          const task = m.task || m.completedTasks.find(t => t.id === op.taskId);
          must(task && task.id === pending.taskId && op.taskId === task.id && task.kind === pending.taskKind && task.groupId === pending.groupId && task.mode === pending.mode, 'Started task identity differs from public request');
          taskIdentity = { id: task.id, kind: task.kind, groupId: task.groupId, mode: task.mode }; target = null;
        }
        if (pending.kind === 'resume') must(m.task?.id === pending.taskId && !m.task.stopped, 'Resume must retain the actual task');
        note('observed-operation', { observedTick: m.tick, operation: clone(op) }); acknowledged = true;
      } else must(m.commandCount === pending.commandCount, 'Unexpected multiple operations');
      if (acknowledged) pending = null;
      else if (m.tick - pending.tick > 90) { note('unobserved-input', { tick: m.tick, kind: pending.kind }); pending = null; target = null; return []; }
      else return [];
    }
    if (m.task) {
      const actual = { id: m.task.id, kind: m.task.kind, groupId: m.task.groupId, mode: m.task.mode };
      if (taskIdentity) must(same(actual, taskIdentity), 'An active transaction cannot change its group or mode'); else taskIdentity = actual;
      if (m.task.stopped) return issue(m, 'Space', 'resume', { taskId: m.task.id });
      if (nextSelection && m.selectedId !== nextSelection) {
        const direction = ids(m).indexOf(nextSelection) > ids(m).indexOf(m.selectedId) ? 'right' : 'left';
        return issue(m, direction === 'right' ? 'ArrowRight' : 'ArrowLeft', 'navigate', { expectedId: predictFocus(m, direction), duringTaskId: m.task.id });
      }
      return [];
    }
    if (taskIdentity) { must(m.completedTasks.some(t => t.id === taskIdentity.id), 'Observed task disappeared without completion'); taskIdentity = null; target = null; nextSelection = null; }
    if (!target) {
      if (policy === 'recover-earliest' || policy === 'vent-latest') {
        const groups = m.groups.filter(g => !g.evacuated).sort((a, b) => (policy === 'vent-latest' ? -1 : 1) * (a.deadlineTick - b.deadlineTick));
        target = groups.length ? { id: groups[0].id, mode: policy === 'recover-earliest' ? 'recover' : 'vent' } : { id: 'leak', mode: null };
        nextSelection = groups.length > 1 ? groups[1].id : groups.length && !m.leak.isolated ? 'leak' : null;
        note('deliberate-policy', { tick: m.tick, policy, target });
      } else {
        const plan = planVisibleState(m, { onlyMode: policy === 'vent-only' ? 'vent' : null });
        if (policy === 'public-schedule') must(plan.projected.reason === 'won', 'No public feasible schedule within the disclosed finite search');
        target = plan.schedule[0]; must(target, 'No remaining ordinary task');
        nextSelection = plan.schedule[1]?.id ?? null;
        note('plan', { tick: m.tick, policy, ...clone(plan) });
      }
    }
    if (m.selectedId !== target.id) {
      const direction = ids(m).indexOf(target.id) > ids(m).indexOf(m.selectedId) ? 'right' : 'left';
      return issue(m, direction === 'right' ? 'ArrowRight' : 'ArrowLeft', 'navigate', { expectedId: predictFocus(m, direction) });
    }
    if (target.id !== 'leak' && m.modeSelection !== target.mode) return issue(m, 'b', 'mode', { mode: target.mode });
    return issue(m, 'Space', 'start', { taskId: m.taskCount + 1, taskKind: target.id === 'leak' ? 'isolate' : 'batch', groupId: target.id === 'leak' ? null : target.id, mode: target.mode });
  }
  pilot.diagnostics = () => clone(diagnostics); return pilot;
}
const defaultPilot = createPilot();
export function keys(state, options) { return defaultPilot(state, options); }

export function assertPublicBoard(m, assert) {
  validate(m); const near = (a, b, label) => assert.ok(Number.isFinite(a) && Math.abs(a - b) <= CHECK_EPS, `${label}: ${a} vs ${b}`), a = m.chambers.A;
  near(m.elapsed, m.tick / FPS, 'Fixed clock'); near(m.remaining, Math.max(0, m.timeLimit - m.elapsed), 'Remaining clock'); near(a.pressure, a.air / a.capacity, 'Actual pressure');
  assert.ok(!(a.doorBOpen && a.doorCOpen)); if (a.doorBOpen) assert.ok(a.air <= EPS); if (a.doorCOpen) assert.ok(a.air >= a.capacity - EPS);
  near(m.ledger.initialTotal, m.tank.oxygen + a.air + m.ledger.breathing + m.ledger.leak + m.ledger.vent + m.ledger.recoveryLoss, 'Physical oxygen ledger'); near(m.ledger.error, 0, 'Reported conservation residual');
  near(m.groups.reduce((n, g) => n + g.consumedOxygen, 0), m.ledger.breathing, 'Group consumption ledger');
  assert.equal(m.evacuatedCount, m.groups.filter(g => g.location === 'C').length);
  for (const g of m.groups) { assert.equal(g.evacuated, g.location === 'C'); if (g.evacuated) { assert.ok(Number.isInteger(g.arrivalTick) && g.arrivalTick <= g.deadlineTick); } else assert.equal(g.arrivalTick, null); }
  assert.equal(m.taskCount, m.completedTasks.length + Number(!!m.task));
  if (m.task) { assert.ok(['recover', 'vent', 'load', 'fill', 'unload', 'isolate'].includes(m.task.phase)); assert.ok(m.task.phaseTicks >= 0 && m.task.totalTicks >= m.task.phaseTicks); }
  if (m.commandCount) { assert.equal(m.lastOperation.id, m.commandCount); assert.equal(m.lastOperation.at, m.lastOperation.tick / FPS); }
  else assert.equal(m.lastOperation, null);
  if (m.lastInterval) { const f = m.lastInterval; assert.equal(f.fromTick, m.tick - 1); assert.equal(f.toTick, m.tick); near(f.tankAfter, m.tank.oxygen, 'Actual last tank'); near(f.airAfter, a.air, 'Actual last airlock'); near(f.tankAfter, f.tankBefore + f.recovered - f.filled - f.leak - f.breathing, 'Last interval tank transfers'); near(f.airAfter, f.airBefore - f.airRemoved - f.vented + f.filled, 'Last interval airlock transfers'); near(f.airRemoved, f.recovered + f.recoveryLoss, 'Recovery efficiency ledger'); near(f.groupBreathing.reduce((n, g) => n + g.actual, 0), f.breathing, 'Actual interval group use'); }
  const score = m.evacuatedCount * 300 + (m.phase === 'won' ? 1000 + 10 * Math.floor(m.tank.oxygen + EPS) : 0); assert.equal(m.score, score);
  if (m.phase === 'won') { assert.equal(m.evacuatedCount, m.groups.length); assert.equal(m.leak.isolated, true); assert.ok(m.tank.oxygen + EPS >= m.tank.reserveFloor); assert.equal(m.lostReason, null); }
}

export function assertProgress({ before, after, trace }, assert) {
  assert.equal(after.phase, 'won'); assertPublicBoard(after.model, assert); const m = after.model;
  assert.equal(m.completedTasks.length, 4); assert.equal(m.task, null); assert.equal(m.blockedCommands, 0); assert.ok(m.elapsed >= 30 && m.elapsed <= 90);
  assert.equal(new Set(m.completedTasks.map(t => t.groupId).filter(Boolean)).size, 3); assert.equal(m.completedTasks.filter(t => t.kind === 'isolate').length, 1);
  assert.ok(m.ledger.filledTransferred > 0 && m.ledger.breathing > 0 && m.ledger.leak > 0);
  for (const row of trace || []) { const s = row.state || row; if (!s.model) continue; assertPublicBoard(s.model, assert); assert.deepEqual(s.model.physics, before.model.physics); assert.deepEqual(s.model.groups.map(g => [g.id, g.people, g.breathingRate, g.deadlineTick]), before.model.groups.map(g => [g.id, g.people, g.breathingRate, g.deadlineTick])); }
}
export function assertRetry({ after, initial }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'playing'); assert.ok(m.tick < 120); assert.equal(m.task, null); assert.deepEqual(m.completedTasks, []); assert.equal(m.taskCount, 0); assert.equal(m.commandCount, 0); assert.equal(m.blockedCommands, 0); assert.equal(m.evacuatedCount, 0); assert.equal(m.leak.isolated, false); assert.ok(m.groups.every(g => g.location === 'B'));
  assert.equal(m.ledger.vent, 0); assert.equal(m.ledger.recoveryLoss, 0); assert.equal(m.ledger.recoveredTransferred, 0); assert.equal(m.ledger.filledTransferred, 0);
  if (initial) { assert.deepEqual(m.physics, initial.model.physics); assert.equal(m.level, initial.model.level); assert.equal(m.chambers.A.air, initial.model.chambers.A.air); const rate = m.leak.rate + m.groups.reduce((n, g) => n + g.breathingRate, 0); assert.ok(Math.abs(m.tank.oxygen - (initial.model.tank.oxygen - rate * m.elapsed)) <= CHECK_EPS); }
}
