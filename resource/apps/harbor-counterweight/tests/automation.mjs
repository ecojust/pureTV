// One bounded public planner and receipt-driven ordinary-key pilot.
// No Model imports, author witness, state mutation or physical replay.
export const budgets = { maxWebGLDrawCalls: 1 };
export const lossPolicies = ['port-side-overload', 'starboard-side-overload', 'idle-after-ballast'];
const need = (ok, message) => { if (!ok) throw Error(message); };
const clone = value => structuredClone(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const LIMITS = { layouts: 4096, transitions: 3000000, wallMilliseconds: 2000, inputTicks: 24, observationSlackTicks: 11 };
const DEG = Math.PI / 180;
function shape(m) {
  need(m && m.cargo?.length === 6 && m.stacks?.length === 4 && m.tasks?.length === 10, 'Public six-cargo, four-column harbor required');
  need(m.columnXM.every((x, n) => x === [-3, -1, 1, 3][n]) && m.physics.tickHz === 60, 'Published geometry and time required');
  need(Number.isInteger(m.cursor) && m.cursor >= 0 && m.cursor < 4, 'Actual public cursor required');
  need(new Set(m.cargo.map(c => c.id)).size === 6, 'Cargo identities must be unique');
}
function targetColumn(m, oldUnits, nextUnits) {
  const sought = nextUnits === 0 ? oldUnits : nextUnits;
  const col = m.columnXM.findIndex(x => x * 60 === sought);
  need(col >= 0, 'Centering requires the current noncentral target column'); return col;
}
function inputCost(m, oldTarget, nextTarget, oldCursor, jobColumn) {
  let cursor = oldCursor, presses = 0;
  if (oldTarget !== nextTarget) {
    const col = targetColumn(m, oldTarget, nextTarget); presses += Math.abs(cursor - col) + 1; cursor = col;
  }
  if (jobColumn !== null) presses += Math.abs(cursor - jobColumn) + 1;
  return presses * LIMITS.inputTicks;
}
function buildTransitions(m, placements) {
  const mass = Object.fromEntries(m.cargo.map(c => [c.id, c.massT]));
  const columns = Object.fromEntries(m.loadOrder.map((id, n) => [id, placements[n]]));
  const stacks = [[], [], [], []], jobs = []; let aboardMass = 0, moment = 0;
  for (let n = 0; n < 6; n++) {
    const id = m.loadOrder[n], column = columns[id];
    if (stacks[column].length >= 2) return null;
    const beforeMass = 32 + aboardMass, beforeMoment = moment;
    stacks[column].push(id); aboardMass += mass[id]; moment += mass[id] * m.columnXM[column];
    jobs.push({ taskId: 'load-' + (n + 1), type: 'load', cargoId: id, column, beforeMass, beforeMoment, afterMass: 32 + aboardMass, afterMoment: moment });
  }
  for (let n = 0; n < 4; n++) {
    const id = m.unloadOrder[n], column = columns[id];
    if (stacks[column].at(-1) !== id) return null;
    const beforeMass = 32 + aboardMass, beforeMoment = moment;
    stacks[column].pop(); aboardMass -= mass[id]; moment -= mass[id] * m.columnXM[column];
    jobs.push({ taskId: 'unload-' + (n + 1), type: 'unload', cargoId: id, column, beforeMass, beforeMoment, afterMass: 32 + aboardMass, afterMoment: moment });
  }
  if (!same(stacks.flat().sort(), [...m.exportIds].sort())) return null;
  return jobs.map(job => {
    const travel = Math.abs(m.columnXM[job.column] - m.shoreXM) * 60 / m.physics.craneSpeedMS;
    return { ...job, travelTicks: travel, jobTicks: 2 * travel + 48, transferTicks: travel + (job.type === 'load' ? 48 : 24) };
  });
}
function planPublic(m) {
  shape(m); need(m.tick === 0 && m.jobsStarted === 0, 'Plan only from an actual untouched public starting board');
  const started = performance.now(), targets = [-180, -60, 0, 60, 180];
  let layouts = 0, eligibleLayouts = 0, transitions = 0, best = null;
  function budget() {
    need(layouts <= LIMITS.layouts && transitions <= LIMITS.transitions, 'Public planner finite work budget exceeded');
    need(performance.now() - started <= LIMITS.wallMilliseconds, 'Public planner wall budget exceeded');
  }
  for (let code = 0; code < LIMITS.layouts; code++) {
    layouts++; budget(); let value = code; const placements = [];
    for (let n = 0; n < 6; n++) { placements.push(value % 4); value = Math.floor(value / 4); }
    const jobs = buildTransitions(m, placements); if (!jobs) continue; eligibleLayouts++;
    let states = [{ targetUnits: 0, cursor: m.cursor, estimatedTicks: 0, staticPeakRad: 0, path: [] }];
    for (const job of jobs) {
      const next = new Map();
      for (const prior of states) for (const targetUnits of targets) {
        transitions++; if (transitions % 128 === 0) budget();
        // Static equilibrium and transfer access only. No theta/omega integration is performed.
        const moment = 8 * (targetUnits / 60);
        const priorAngle = Math.abs((job.beforeMoment + 8 * (prior.targetUnits / 60)) / (2 * job.beforeMass));
        const beforeAngle = Math.abs((job.beforeMoment + moment) / (2 * job.beforeMass));
        const afterAngle = Math.abs((job.afterMoment + moment) / (2 * job.afterMass));
        const staticPeakRad = Math.max(prior.staticPeakRad, priorAngle, beforeAngle, afterAngle);
        if (staticPeakRad > 8 * DEG) continue;
        const waitTicks = Math.max(0, Math.abs(targetUnits - prior.targetUnits) - job.transferTicks);
        const estimatedTicks = prior.estimatedTicks + inputCost(m, prior.targetUnits, targetUnits, prior.cursor, job.column)
          + waitTicks + job.jobTicks + LIMITS.observationSlackTicks;
        const candidate = { targetUnits, cursor: job.column, estimatedTicks, staticPeakRad,
          path: [...prior.path, { ...job, targetUnits }] };
        const previous = next.get(targetUnits);
        if (!previous || estimatedTicks < previous.estimatedTicks || (estimatedTicks === previous.estimatedTicks && staticPeakRad < previous.staticPeakRad)) next.set(targetUnits, candidate);
      }
      states = [...next.values()]; if (!states.length) break;
    }
    for (const prior of states) for (const departureTargetUnits of targets) {
      transitions++; if (transitions % 128 === 0) budget(); const last = jobs.at(-1);
      const finalAngle = Math.abs((last.afterMoment + 8 * (departureTargetUnits / 60)) / (2 * last.afterMass));
      if (finalAngle > 2.5 * DEG) continue;
      // Budget a full five seconds for settling, plus the actual four-second stability requirement.
      const estimatedTicks = prior.estimatedTicks + inputCost(m, prior.targetUnits, departureTargetUnits, prior.cursor, null)
        + Math.abs(departureTargetUnits - prior.targetUnits) + 300 + m.limits.departureStableTicks;
      if (estimatedTicks >= m.deadlineTick) continue;
      const candidate = { placements, jobs: prior.path, departureTargetUnits, estimatedTicks, staticPeakRad: Math.max(prior.staticPeakRad, finalAngle) };
      if (!best || estimatedTicks < best.estimatedTicks || (estimatedTicks === best.estimatedTicks && candidate.staticPeakRad < best.staticPeakRad)) best = candidate;
    }
  }
  budget(); need(best, 'No plan satisfies public access, static-angle and conservative time limits; no hidden fallback');
  return { ...best, statistics: { layouts, eligibleLayouts, transitions, elapsedMs: performance.now() - started,
    scope: 'Public fixed queues/masses, 4096 placements and five-target static dynamic programming; not physical or independent validation.' } };
}
export function createPilot({ mode = 'record', policy = mode === 'loss' ? 'port-side-overload' : 'normal' } = {}) {
  need(policy === 'normal' || lossPolicies.includes(policy), 'Unknown public pilot policy');
  let identity = null, lastTick = -1, plan = null, pending = null;
  let stats = { planning: null, issued: [], acknowledged: [], taskObservations: [] };
  function reset(m) { identity = `${m.level}:${m.seed}`; lastTick = m.tick; plan = null; pending = null;
    stats = { planning: null, issued: [], acknowledged: [], taskObservations: [] }; }
  function prime(state) {
    const m = state?.model; shape(m); reset(m);
    if (policy === 'normal') { plan = planPublic(m); stats.planning = clone(plan); return clone(plan.statistics); }
    stats.planning = { policy, scope: 'Only legal public keys; intentionally unsafe or incomplete work.' };
    return { layouts: 0, transitions: 0, elapsedMs: 0, scope: stats.planning.scope };
  }
  function realNeutral(m) {
    return m.lastInput && !m.lastInput.sample.cancelled && !m.lastInput.cancelled && !m.inputState.quarantined
      && Math.abs(m.lastInput.sample.x) <= .25 && !m.lastInput.sample.aDown && !m.lastInput.sample.bDown
      && m.inputState.aArmed && m.inputState.bArmed && m.inputState.navigationHeldTicks === 0;
  }
  function issue(m, key, intent) {
    need(!pending, 'One input edge at a time');
    pending = { key, intent: clone(intent), issuedTick: m.tick, cursor: m.cursor, commandCount: m.commandCount,
      navigationCount: m.navigationCount, blockedCommands: m.blockedCommands, phase: 'press', releaseTick: null };
    stats.issued.push(clone(pending)); return [key];
  }
  function navigation(m, column) {
    if (m.cursor === column) return null;
    const sign = Math.sign(column - m.cursor);
    return issue(m, sign > 0 ? 'ArrowRight' : 'ArrowLeft', { kind: 'navigation', cursor: m.cursor + sign });
  }
  function target(m, units) {
    if (m.ballastTargetUnits === units) return null;
    const column = targetColumn(m, m.ballastTargetUnits, units), nav = navigation(m, column);
    return nav || issue(m, 'b', { kind: 'target', units, column });
  }
  function acknowledge(m) {
    const p = pending; if (!p) return false;
    need(m.blockedCommands === p.blockedCommands, 'The actual intended ordinary command was rejected');
    if (p.phase === 'release') {
      if (m.tick <= p.releaseTick || !realNeutral(m)) return true;
      pending = null; return false;
    }
    if (m.tick <= p.issuedTick) return true;
    let receipt;
    if (p.intent.kind === 'navigation') {
      if (m.navigationCount > p.navigationCount) {
        receipt = m.navigationReceipts[p.navigationCount];
        need(m.navigationCount === p.navigationCount + 1 && receipt.beforeCursor === p.cursor && receipt.afterCursor === p.intent.cursor
          && m.cursor === p.intent.cursor && receipt.heldTicks === 1, 'Exactly one real initial navigation must acknowledge the key');
      }
    } else if (m.commandCount > p.commandCount) {
      receipt = m.commandReceipts[p.commandCount]; need(m.commandCount === p.commandCount + 1 && receipt.id === p.commandCount + 1, 'Exactly one accepted command per edge');
      if (p.intent.kind === 'target') need(receipt.inputKey === 'b' && receipt.action === 'retarget-ballast'
        && receipt.after.ballastTargetUnits === p.intent.units && receipt.before.ballastPositionUnits === receipt.after.ballastPositionUnits,
      'B must acknowledge the intended target without teleporting actual ballast');
      else {
        const job = m.jobStartReceipts[receipt.jobId - 1]?.job;
        need(receipt.inputKey === 'a' && receipt.action === 'request-' + p.intent.type && job?.taskId === p.intent.taskId
          && job.cargoId === p.intent.cargoId && job.column === p.intent.column, 'A must acknowledge the actual intended cargo identity and column');
      }
    }
    if (!receipt) { need(m.tick - p.issuedTick <= 40, 'Input was not acknowledged within forty physical ticks'); return true; }
    need(receipt.tick > p.issuedTick, 'Receipt must follow the dispatched key');
    stats.acknowledged.push({ issuedTick: p.issuedTick, observedTick: m.tick, key: p.key, receipt: clone(receipt) });
    p.phase = 'release'; p.releaseTick = m.tick; return true;
  }
  function negative(m) {
    if (policy === 'idle-after-ballast') return target(m, -60) || [];
    const column = policy === 'port-side-overload' ? 0 : 3, units = m.columnXM[column] * 60;
    if (m.jobsStarted === 0) {
      const nav = navigation(m, column); if (nav) return nav;
      return issue(m, 'Space', { kind: 'job', type: 'load', taskId: 'load-1', cargoId: m.loadOrder[0], column });
    }
    return target(m, units) || [];
  }
  function pilot(state) {
    const m = state?.model; if (!m) return [];
    if (identity !== `${m.level}:${m.seed}` || m.tick < lastTick) reset(m); lastTick = m.tick;
    if (state.phase !== 'playing' || state.paused || m.phase !== 'playing') return [];
    shape(m);
    if (pending && acknowledge(m)) return pending.phase === 'press' ? [pending.key] : [];
    if (m.inputState.quarantined) return [];
    if (m.tick > 0 && !realNeutral(m)) return [];
    if (policy !== 'normal') return negative(m);
    need(plan, 'Normal pilot must be primed from the initial public snapshot before gameplay');
    if (!m.crane.idle) return [];
    if (m.operationPhase === 'departure') return target(m, plan.departureTargetUnits) || [];
    const current = m.currentTask, job = plan.jobs.find(row => row.taskId === current?.id);
    need(job && current.status === 'pending' && current.cargoId === job.cargoId, 'Next real task must match the public planned identity');
    if (stats.taskObservations.at(-1)?.taskId !== current.id) stats.taskObservations.push({ tick: m.tick, taskId: current.id, jobsCompleted: m.jobsCompleted });
    const retarget = target(m, job.targetUnits); if (retarget) return retarget;
    const nav = navigation(m, job.column); if (nav) return nav;
    // Actual current ballast position controls any wait. No wall clock or exact schedule assumption.
    if (Math.abs(m.ballastTargetUnits - m.ballastPositionUnits) > job.transferTicks) return [];
    if (job.type === 'load') need(m.shoreIds[0] === job.cargoId && m.stacks[job.column].length < 2, 'Actual loading queue/space must still be valid');
    else need(m.stacks[job.column].at(-1) === job.cargoId, 'Actual prescribed unload cargo must be the selected top');
    return issue(m, 'Space', { kind: 'job', type: job.type, taskId: job.taskId, cargoId: job.cargoId, column: job.column });
  }
  pilot.prime = prime; pilot.keys = pilot; pilot.diagnostics = () => clone({ policy, bounds: LIMITS, ...stats }); return pilot;
}
const defaultPilot = createPilot();
export const keys = (state, context) => defaultPilot(state, context);
export const prime = state => defaultPilot.prime(state);
export function assertPublicBoard(m, assert) {
  shape(m); assert.equal(m.elapsed, m.tick / 60); assert.equal(m.remaining, (m.deadlineTick - m.tick) / 60);
  assert.equal(m.commandCount, m.commandReceipts.length); assert.equal(m.blockedCommands, m.blockedReceipts.length);
  assert.equal(m.navigationCount, m.navigationReceipts.length); assert.equal(m.jobsStarted, m.jobStartReceipts.length);
  assert.equal(m.jobsCompleted, m.jobCompletionReceipts.length); assert.equal(m.ballastTargetChangeCount, m.targetChangeReceipts.length);
  assert.equal(m.ballastXM, m.ballastPositionUnits / 60); assert.equal(m.ballastTargetXM, m.ballastTargetUnits / 60);
  const ids = [...m.shoreIds, ...m.stacks.flat(), ...(m.hookId === null ? [] : [m.hookId]), ...m.deliveredIds, ...m.overboardIds];
  assert.equal(ids.length, 6); assert.equal(new Set(ids).size, 6); assert.deepEqual([...ids].sort(), m.cargo.map(c => c.id).sort());
  assert.equal(m.inventory.errorT, 0); assert.equal(m.inventory.allIdsExactlyOnce, true);
  const mass = location => m.cargo.filter(c => c.location === location).reduce((n, c) => n + c.massT, 0);
  assert.equal(m.inventory.shoreMassT, mass('shore')); assert.equal(m.inventory.shipCargoMassT, mass('ship'));
  assert.equal(m.inventory.hookMassT, mass('hook')); assert.equal(m.inventory.deliveredMassT, mass('delivered')); assert.equal(m.inventory.overboardMassT, mass('overboard'));
  assert.equal(m.ship.massT, 32 + mass('ship')); assert.equal(m.crane.carriedId, m.hookId);
  assert.deepEqual(m.ship.aboardIds, m.stacks.flat());
  for (const cargo of m.cargo) {
    if (cargo.location === 'ship') assert.equal(m.stacks[cargo.column][cargo.tier], cargo.id);
    else { assert.equal(cargo.column, null); assert.equal(cargo.tier, null); }
  }
  assert.equal(m.loadQueueIndex, 6 - m.shoreIds.length); assert.equal(m.unloadJobsCompleted, m.deliveredIds.length);
  if (m.lastInterval) { assert.equal(m.lastInterval.tick, m.tick); assert.equal(m.lastInterval.fromTick, m.tick - 1);
    assert.equal(m.lastInterval.roll.thetaAfterRad, m.ship.rollRad); assert.equal(m.lastInterval.roll.omegaAfterRadS, m.ship.angularVelocityRadS); }
}
export function assertProgress({ after }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won');
  assert.deepEqual(m.failures, []); assert.equal(m.blockedCommands, 0); assert.equal(m.jobsCompleted, 10); assert.equal(m.transferReceipts.length, 20);
  assert.equal(m.loadJobsCompleted, 6); assert.equal(m.unloadJobsCompleted, 4); assert.equal(m.stableTicks, 240);
  assert.deepEqual(m.deliveredIds, m.unloadOrder); assert.deepEqual([...m.ship.aboardIds].sort(), [...m.exportIds].sort());
  assert.equal(m.crane.idle, true); assert.equal(m.hookId, null); assert.equal(m.shoreIds.length, 0);
}
export function assertRetry({ after, initial }, assert) {
  assertPublicBoard(after.model, assert); assert.equal(after.model.phase, 'playing'); assert.ok(after.model.tick >= 0 && after.model.tick < 120);
  for (const key of ['cargo', 'stacks', 'shoreIds', 'deliveredIds', 'overboardIds', 'hookId', 'cursor', 'crane', 'ballastPositionUnits',
    'ballastTargetUnits', 'ship', 'inventory', 'commandCount', 'blockedCommands', 'jobsStarted', 'jobsCompleted', 'unsafeTicks', 'stableTicks',
    'commandReceipts', 'transferReceipts', 'jobStartReceipts', 'jobCompletionReceipts']) assert.deepEqual(after.model[key], initial.model[key], 'Fresh retry restores ' + key);
}
