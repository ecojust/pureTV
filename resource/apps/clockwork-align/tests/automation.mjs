// Ordinary public feedback only: no Model import, future stop schedule, rollout, or search.
export const budgets = { maxWebGLDrawCalls: 1 };
export const lossPolicies = ['leave-trains-running', 'spend-last-adjustment', 'brake-too-early'];
export const lossReasons = ['deadline', 'budget_exhausted', 'deadline'];
const need = (ok, message) => { if (!ok) throw Error(message); };
const clone = value => structuredClone(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const mod = (value, turn) => value - turn * Math.floor(value / turn);
function shape(m) {
  need(m?.scenario?.trains?.length === m?.trains?.length && m.trains.length >= 2, 'Actual public clockwork scenario required');
  need(m.physics.angleUnitsPerTurn === 43200 && m.physics.ticksPerSecond === 60 && m.physics.axisThreshold === .55, 'Published exact clockwork units required');
}
function neutral(m) {
  const li = m.lastInput, l = m.inputState;
  return li && !li.cancelled && !li.epochChanged && !l.quarantined && Math.abs(li.x) < .55 && Math.abs(li.y) < .55
    && !li.effectiveA && !li.effectiveB && l.aArmed && l.bArmed && l.direction === 0 && l.repeatAgeTicks === 0;
}
function pointersFor(m, train) { return m.pointers.filter(p => train.gearIds.includes(p.gearId)); }
export function createPilot({ mode = 'record', policy = mode === 'loss' ? 'leave-trains-running' : 'normal' } = {}) {
  need(policy === 'normal' || lossPolicies.includes(policy), 'Unknown clockwork policy');
  let identity = null, lastTransaction = -1, primed = false, pending = null;
  let stats = { prime: null, issued: [], acknowledged: [] };
  function reset(m) {
    identity = `${m.seed}:${m.level}`; lastTransaction = m.transactionCount; primed = false; pending = null;
    stats = { prime: null, issued: [], acknowledged: [] };
  }
  function prime(state) {
    const m = state?.model; shape(m);
    need(m.tick === 0 && m.transactionCount === 0 && m.actionReceipts.length === 0 && m.trains.every(t => t.engaged),
      'Prime requires the actual untouched initial public model');
    reset(m); primed = true;
    stats.prime = { level: m.level, observedInitialTrainIds: m.trains.map(t => t.id), initialBudget: clone(m.budget),
      limits: { maxOrdinaryKeys: 80, plannedSteps: 0, searches: 0 },
      scope: 'Observe each engaged train in authored row order; brake only after its actual pointers jointly align. No predicted stop times or simulated future states.' };
    return clone(stats.prime);
  }
  function issue(m, key, intent) {
    need(!pending && stats.issued.length < 80, 'One ordinary key at a time, bounded to eighty issued keys');
    pending = { key, intent: clone(intent), transactionId: m.transactionCount, tick: m.tick, cursorBefore: m.cursor,
      receiptCount: m.actionReceipts.length, budgetBefore: clone(m.budget), phase: 'press', releaseTransaction: null };
    stats.issued.push(clone(pending)); return [key];
  }
  function select(m, index) {
    if (m.cursor === index) return null;
    const direction = index > m.cursor ? 1 : -1;
    return issue(m, direction > 0 ? 'ArrowDown' : 'ArrowUp', { kind: 'navigate', direction, cursor: mod(m.cursor + direction, m.trains.length) });
  }
  function command(m, key, request, role) {
    return issue(m, key, { kind: 'action', request, selectedTrainId: m.selectedTrainId, role });
  }
  function acknowledge(m) {
    const p = pending;
    if (p.phase === 'release') {
      if (m.transactionCount <= p.releaseTransaction || !neutral(m)) return true;
      pending = null; return false;
    }
    if (m.transactionCount <= p.transactionId) return true;
    let observed = null;
    if (p.intent.kind === 'navigate' && m.cursor === p.intent.cursor) {
      need(m.inputState.direction === p.intent.direction && m.inputState.repeatAgeTicks >= 1 && m.inputState.repeatAgeTicks <= 18,
        'One initial held direction must reach the actual adjacent wrapped row');
      need(m.actionReceipts.length === p.receiptCount, 'Selection must not spend or create a clutch receipt');
      observed = { kind: 'navigation-observation', transactionId: m.transactionCount, tick: m.tick,
        cursorBefore: p.cursorBefore, cursorAfter: m.cursor, input: clone(m.lastInput), inputState: clone(m.inputState) };
    } else if (p.intent.kind === 'action' && m.actionReceipts.length > p.receiptCount) {
      const row = m.actionReceipts[p.receiptCount];
      need(m.actionReceipts.length === p.receiptCount + 1 && row.accepted && row.request === p.intent.request
        && row.selectedTrainAfter === p.intent.selectedTrainId && row.transactionId > p.transactionId,
      'One accepted actual receipt must acknowledge the requested clutch action');
      need(same(row.budgetBefore, p.budgetBefore), 'The accepted command must spend from the observed actual budget');
      need(row.gearsBefore.every((g, i) => g.id === row.gearsAfter[i].id && g.unwrappedUnits === row.gearsAfter[i].unwrappedUnits), 'Clutch switching must preserve every actual phase');
      if (p.intent.role === 'brake-observed-alignment') {
        const train = m.trains.find(t => t.id === p.intent.selectedTrainId);
        need(!train.engaged && pointersFor(m, train).every(pointer => pointer.instantAligned), 'The actually braked train must retain its observed alignment');
      }
      observed = { kind: 'action-receipt', receipt: clone(row) };
    }
    if (!observed) { need(m.transactionCount - p.transactionId <= 60, 'Ordinary key lacks an actual acknowledgement within sixty transactions'); return true; }
    stats.acknowledged.push({ issuedTransactionId: p.transactionId, observedTransactionId: m.transactionCount, key: p.key,
      role: p.intent.role || null, ...observed });
    p.phase = 'release'; p.releaseTransaction = m.transactionCount; return true;
  }
  function pilot(state) {
    const m = state?.model; if (!m) return [];
    if (identity !== `${m.seed}:${m.level}` || m.transactionCount < lastTransaction) reset(m); lastTransaction = m.transactionCount;
    if (state.phase !== 'playing' || state.paused || m.phase !== 'playing') return [];
    shape(m); need(primed, 'Pilot must first receive the actual initial public snapshot');
    if (pending && acknowledge(m)) return pending.phase === 'press' ? [pending.key] : [];
    if (m.inputState.quarantined || (m.transactionCount > 0 && !neutral(m))) return [];
    if (policy === 'leave-trains-running') return [];
    if (policy === 'spend-last-adjustment') return select(m, 0) || command(m, 'Space', 'toggle_selected', 'spend-on-first-clutch');
    if (policy === 'brake-too-early') return m.trains.some(t => t.engaged) ? command(m, 'b', 'brake_all', 'brake-without-aligning') : [];
    for (const train of m.trains) if (!train.engaged)
      need(pointersFor(m, train).every(p => p.instantAligned), 'A previously braked train must remain actually aligned');
    const next = m.trains.findIndex(t => t.engaged);
    if (next < 0) return [];
    const navigation = select(m, next); if (navigation) return navigation;
    return pointersFor(m, m.trains[next]).every(p => p.instantAligned)
      ? command(m, 'Space', 'toggle_selected', 'brake-observed-alignment') : [];
  }
  pilot.prime = prime; pilot.keys = pilot; pilot.diagnostics = () => clone({ policy, pending, ...stats }); return pilot;
}
const defaultPilot = createPilot();
export const keys = (state, context) => defaultPilot(state, context);
export const prime = state => defaultPilot.prime(state);
export function assertPublicBoard(m, assert) {
  shape(m); assert.equal(m.elapsed, m.tick / 60); assert.equal(m.level, m.difficulty + 1); assert.equal(m.scenarioId, m.scenario.id);
  assert.equal(m.selectedTrainId, m.trains[m.cursor].id); assert.equal(m.budget.initial, m.budget.spent + m.budget.remaining);
  assert.ok(m.budget.remaining >= 0); assert.equal(m.budget.spent, m.actionReceipts.reduce((n, row) => n + row.chargedCost, 0));
  assert.equal(m.motor.unwrappedUnits, 30 * m.tick); assert.equal(m.motor.normalizedUnits, mod(m.motor.unwrappedUnits, 43200));
  for (const g of m.gears) {
    assert.ok(Number.isSafeInteger(g.unwrappedUnits) && Number.isSafeInteger(g.velocityUnitsPerTick));
    assert.equal(g.normalizedUnits, mod(g.unwrappedUnits, 43200));
    const train = m.trains.find(t => t.id === g.trainId);
    if (!train.engaged) assert.equal(g.velocityUnitsPerTick, 0);
    if (g.meshParentId !== null) {
      const parent = m.gears.find(p => p.id === g.meshParentId);
      assert.equal(parent.teeth * parent.velocityUnitsPerTick + g.teeth * g.velocityUnitsPerTick, 0);
      assert.equal(parent.teeth * parent.unwrappedUnits + g.teeth * g.unwrappedUnits, 0);
    }
  }
  for (const p of m.pointers) {
    assert.equal(p.unwrappedUnits, m.gears.find(g => g.id === p.gearId).unwrappedUnits + p.mountOffsetUnits);
    assert.equal(p.signedErrorUnits, mod(p.unwrappedUnits - p.targetUnits + 21600, 43200) - 21600);
    assert.equal(p.instantAligned, Math.abs(p.signedErrorUnits) <= p.toleranceUnits);
  }
  assert.equal(m.alignment.allInstantAligned, m.pointers.every(p => p.instantAligned));
  assert.equal(m.alignment.holdStartTick === null, m.alignment.holdTicks === 0);
  assert.equal(m.score, m.phase === 'won' ? 1000 + 100 * m.budget.remaining : 0);
  m.actionReceipts.forEach((row, i) => {
    assert.equal(row.receiptId, i + 1); assert.ok(row.transactionId <= m.transactionCount && row.boundaryTick <= m.tick);
    assert.equal(row.budgetBefore.remaining - row.chargedCost, row.budgetAfter.remaining);
    assert.deepEqual(row.holdBefore, row.holdAfterCommand);
    row.gearsBefore.forEach((g, j) => assert.equal(g.unwrappedUnits, row.gearsAfter[j].unwrappedUnits));
  });
  if (m.lastTransaction) {
    const tr = m.lastTransaction; assert.equal(tr.id, m.transactionCount); assert.equal(tr.toTick, m.tick);
    assert.equal(tr.toTick - tr.fromTick, tr.advanced ? 1 : 0); assert.deepEqual(tr.terminalAfter, m.terminal);
    assert.deepEqual(tr.actionReceiptIds, m.lastActionReceipts.map(row => row.receiptId));
    if (tr.advanced) { assert.equal(m.lastInterval.transactionId, tr.id); assert.equal(m.lastInterval.intervalId, m.tick); assert.equal(m.transactionCount, m.tick); }
    else { assert.equal(m.lastInterval, null); assert.equal(tr.intervalId, null); assert.equal(m.phase, 'lost'); assert.equal(m.lostReason, 'budget_exhausted'); assert.equal(m.transactionCount, m.tick + 1); }
  }
}
export function assertProgress({ after }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won'); assert.equal(m.stage, 'finished');
  assert.equal(m.terminal.reason, 'global_hold_complete'); assert.equal(m.lostReason, null); assert.ok(m.elapsed >= 30 && m.elapsed <= 90);
  assert.equal(m.alignment.holdTicks, m.appointment.holdRequiredTicks); assert.ok(m.alignment.holdStartTick >= m.appointment.windowStartTick);
  assert.equal(m.tick, m.alignment.holdStartTick + m.alignment.holdTicks); assert.ok(m.tick <= m.appointment.windowEndTick);
  assert.ok(m.trains.every(t => !t.engaged)); assert.ok(m.pointers.every(p => p.instantAligned));
  assert.equal(m.actionReceipts.length, m.trains.length);
  assert.ok(m.actionReceipts.every(row => row.accepted && row.request === 'toggle_selected' && row.chargedCost === 1
    && row.gearsBefore.some(g => g.unwrappedUnits !== 0)));
  assert.ok(m.lastInterval.windowEligible && m.lastInterval.allPointersFullInterval);
}
export function assertRetry({ after, initial }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(m.phase, 'playing'); assert.equal(m.stage, 'tuning');
  assert.ok(m.tick >= 0 && m.tick < 120); assert.equal(m.transactionCount, m.tick); assert.equal(m.cursor, 0);
  assert.deepEqual(m.scenario, initial.model.scenario); assert.deepEqual(m.actionReceipts, []);
  assert.deepEqual(m.budget, { initial: m.scenario.adjustmentBudget, spent: 0, remaining: m.scenario.adjustmentBudget });
  assert.ok(m.trains.every(t => t.engaged)); assert.equal(m.alignment.holdTicks, 0); assert.equal(m.alignment.holdStartTick, null);
  for (const train of m.scenario.trains) for (const configured of train.gears) {
    const actual = m.gears.find(g => g.id === configured.id);
    assert.equal(actual.velocityUnitsPerTick, configured.engagedVelocityUnitsPerTick);
    assert.equal(actual.unwrappedUnits, configured.engagedVelocityUnitsPerTick * m.tick);
  }
}
