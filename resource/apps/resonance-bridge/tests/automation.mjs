// Actual public-state feedback only: no Model import, rollout, search, or private author schedule.
export const budgets = { maxWebGLDrawCalls: 1 };
export const lossPolicies = ['leave-resonance-running', 'disturb-live-crossing', 'leave-resonance-running'];
export const lossReasons = ['unstable-amplitude', 'pedestrian-fall', 'unstable-amplitude'];
const need = (ok, message) => { if (!ok) throw Error(message); };
const clone = value => structuredClone(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function shape(m) {
  need(m?.boards?.length === 3 && m.pedestrians?.length === m.scenario?.pedestrianCount, 'Actual three-plate public bridge required');
  need(m.physics.phaseUnitsPerTurn === 6000 && m.physics.phasePulseTicks === 10 && m.physics.crossingTicks === 24,
    'Published continuous-phase and contact rules required');
}
function neutral(m) {
  return m.lastInput && !m.lastInput.cancelled && !m.lastInput.epochChanged && !m.inputState.quarantined
    && Math.abs(m.lastInput.x) < .45 && Math.abs(m.lastInput.y) < .45 && !m.lastInput.a && !m.lastInput.b
    && m.inputState.aArmed && m.inputState.bArmed && m.inputState.navigationHeldTicks === 0;
}
export function createPilot({ mode = 'record', policy = mode === 'loss' ? 'leave-resonance-running' : 'normal' } = {}) {
  need(policy === 'normal' || lossPolicies.includes(policy), 'Unknown bridge feedback policy');
  let identity = null, lastTick = -1, primed = false, pending = null, reference = null, prepared = false;
  let stats = { prime: null, issued: [], acknowledged: [], alignmentReference: null, preparedObservation: null };
  function reset(m) {
    identity = `${m.level}:${m.seed}`; lastTick = m.tick; primed = false; pending = null; reference = null; prepared = false;
    stats = { prime: null, issued: [], acknowledged: [], alignmentReference: null, preparedObservation: null };
  }
  function prime(state) {
    const m = state?.model; shape(m);
    need(m.tick === 0 && m.stage === 'tuning' && m.dispatchAtTick === null && m.actionReceipts.length === 0
      && m.phasePulseReceipts.length === 0 && m.pedestrianEvents.length === 0, 'Prime only an untouched actual initial board');
    reset(m); primed = true;
    stats.prime = { level: m.level, initialBoards: clone(m.boards), pedestrianCount: m.scenario.pedestrianCount,
      limits: { maxOrdinaryKeys: 240, searches: 0, simulatedSteps: 0 },
      scope: 'No planned timeline. Later controls depend on actual frequency, relative phase, completed pulses, cooling, and observed crossing stages.' };
    return clone(stats.prime);
  }
  function issue(m, key, intent) {
    need(!pending && stats.issued.length < 240, 'One receipt-acknowledged ordinary key at a time, at most 240');
    pending = { key, intent: clone(intent), tick: m.tick, cursorBefore: m.cursor, actionCount: m.actionReceipts.length,
      phase: 'press', releaseTick: null };
    stats.issued.push(clone(pending)); return [key];
  }
  function select(m, target) {
    return m.cursor === target ? null : issue(m, target > m.cursor ? 'ArrowRight' : 'ArrowLeft',
      { kind: 'navigate', cursor: m.cursor + Math.sign(target - m.cursor) });
  }
  function act(m, target, key, action, role) {
    return select(m, target) || issue(m, key, { kind: 'action', action, boardIndex: target < 3 ? target : null, role });
  }
  function acknowledge(m) {
    const p = pending;
    if (p.phase === 'release') {
      if (m.tick <= p.releaseTick || !neutral(m)) return true;
      pending = null; return false;
    }
    if (m.tick <= p.tick) return true;
    let observed = null;
    if (p.intent.kind === 'navigate' && m.cursor === p.intent.cursor) {
      need(m.inputState.navigationDirection === Math.sign(p.intent.cursor - p.cursorBefore)
        && m.inputState.navigationHeldTicks >= 1 && m.inputState.navigationHeldTicks < 24,
      'An actual initial held direction must reach exactly the adjacent selection');
      need(m.actionReceipts.length === p.actionCount, 'Navigation must not create a tuning command');
      observed = { kind: 'navigation-observation', fromObservedTick: p.tick, observedTick: m.tick,
        cursorBefore: p.cursorBefore, cursorAfter: m.cursor, lastInput: clone(m.lastInput), inputState: clone(m.inputState) };
    } else if (p.intent.kind === 'action' && m.actionReceipts.length > p.actionCount) {
      const row = m.actionReceipts[p.actionCount];
      need(m.actionReceipts.length === p.actionCount + 1 && row.accepted && row.kind === p.intent.action
        && row.boardIndex === p.intent.boardIndex && row.tick > p.tick, 'One accepted actual receipt must acknowledge the requested command');
      if (row.boardIndex !== null) for (const key of ['phaseUnits', 'resonanceUnits', 'amplitudeMetres', 'heightMetres'])
        need(row.before[key] === row.after[key], 'A tuning command must not teleport physical state');
      observed = { kind: 'action-receipt', receipt: clone(row) };
    }
    if (!observed) { need(m.tick - p.tick <= 60, 'Ordinary key has no actual acknowledgement within sixty ticks'); return true; }
    stats.acknowledged.push({ issuedTick: p.tick, observedTick: m.tick, key: p.key, role: p.intent.role || null, ...observed });
    p.phase = 'release'; p.releaseTick = m.tick; return true;
  }
  function prepare(m) {
    for (const b of m.boards) if (b.frequencyIndex !== 0) return act(m, b.index, 'Space', 'frequency', 'select-slow-frequency');
    if (m.boards.some(b => b.trimTicksRemaining > 0)) return [];
    if (reference === null) {
      reference = m.boards.reduce((best, b) => b.phaseUnits > m.boards[best].phaseUnits ? b.index : best, 0);
      stats.alignmentReference = { observedTick: m.tick, boardIndex: reference, actualPhaseUnits: m.boards.map(b => b.phaseUnits) };
    }
    // A fixed reference id keeps advancing at the same slow speed. Each completed pulse
    // moves one lagging plate forward 250 units; overshoot stays strictly below 250.
    const anchor = m.boards[reference];
    for (const b of m.boards) if (b.phaseUnits < anchor.phaseUnits) return act(m, b.index, 'b', 'phase', 'align-observed-phase');
    need(m.boards.every(b => b.phaseUnits >= anchor.phaseUnits && b.phaseUnits - anchor.phaseUnits < 250),
      'Actual completed phase corrections must fit one public 250-unit band');
    if (m.boards.some(b => b.resonanceUnits !== 0)) return [];
    prepared = true; stats.preparedObservation = { observedTick: m.tick, boards: clone(m.boards),
      actualCompletedPulseIds: m.phasePulseReceipts.map(row => row.pulseId), dispatchAtTick: m.dispatchAtTick };
    return null;
  }
  function decisions(m) {
    if (policy === 'leave-resonance-running') return [];
    if (m.dispatchAtTick === null) {
      if (!prepared) { const keys = prepare(m); if (keys !== null) return keys; }
      if (policy === 'disturb-live-crossing' && m.boards[0].frequencyIndex === 0)
        return act(m, 0, 'Space', 'frequency', 'excite-first-plate-before-dispatch');
      return act(m, 3, 'Space', 'dispatch', 'release-observed-ready-queue');
    }
    if (policy === 'normal') return [];
    const selected = select(m, 0); if (selected) return selected;
    const crossing = m.pedestrians.find(p => p.stage === 'crossing' && p.edgeIndex === 0);
    if (crossing && m.boards[0].trimTicksRemaining === 0)
      return act(m, 0, 'b', 'phase', 'disturb-an-actual-crossing');
    return [];
  }
  function pilot(state) {
    const m = state?.model; if (!m) return [];
    if (identity !== `${m.level}:${m.seed}` || m.tick < lastTick) reset(m); lastTick = m.tick;
    if (state.phase !== 'playing' || state.paused || m.phase !== 'playing') return [];
    shape(m); need(primed, 'Pilot must be primed using the actual initial public snapshot');
    if (pending && acknowledge(m)) return pending.phase === 'press' ? [pending.key] : [];
    if (m.inputState.quarantined || (m.tick > 0 && !neutral(m))) return [];
    return decisions(m);
  }
  pilot.prime = prime; pilot.keys = pilot; pilot.diagnostics = () => clone({ policy, reference, prepared, ...stats }); return pilot;
}
const defaultPilot = createPilot();
export const keys = (state, context) => defaultPilot(state, context);
export const prime = state => defaultPilot.prime(state);
export function assertPublicBoard(m, assert) {
  shape(m); assert.equal(m.elapsed, m.tick / 60); assert.equal(m.deadlineTicksRemaining, Math.max(0, 5400 - m.tick));
  assert.equal(m.passedCount + m.fallenCount + m.remainingCount, m.scenario.pedestrianCount);
  assert.equal(m.passedCount, m.pedestrians.filter(p => p.stage === 'passed').length);
  assert.equal(m.fallenCount, m.pedestrians.filter(p => p.stage === 'fallen').length);
  for (const b of m.boards) {
    assert.ok(Number.isSafeInteger(b.phaseUnits) && Number.isSafeInteger(b.resonanceUnits) && b.resonanceUnits >= 0);
    assert.equal(b.phaseWrappedUnits, ((b.phaseUnits % 6000) + 6000) % 6000);
    assert.equal(b.basePhaseUnitsPerTick, [10, 15, 20][b.frequencyIndex]);
    assert.equal(b.effectivePhaseUnitsPerTick, b.basePhaseUnitsPerTick + (b.trimTicksRemaining > 0 ? 25 : 0));
    assert.ok(Math.abs(b.amplitudeMetres - (.8 + b.resonanceUnits / 3000)) < 1e-10);
    assert.ok(Math.abs(b.heightMetres - b.amplitudeMetres * Math.sin(2 * Math.PI * b.phaseWrappedUnits / 6000)) < 1e-10);
    assert.equal(b.completedPulseCount, m.phasePulseReceipts.filter(row => row.boardIndex === b.index).length);
  }
  for (const p of m.pedestrians) {
    assert.ok(Number.isInteger(p.movementTicks) && p.movementTicks >= 0 && p.movementTicks <= 456);
    assert.ok(p.contactTicks >= 0 && p.contactTicks <= 24);
    if (p.stage !== 'waiting') assert.equal(p.contactTicks, 0);
    if (p.stage === 'passed') { assert.equal(p.movementTicks, 456); assert.equal(p.node, 4); assert.equal(p.heightMetres, 0); }
  }
  for (const field of ['actionReceipts', 'phasePulseReceipts', 'pedestrianEvents']) m[field].forEach((row, index) => {
    assert.equal(row.id, index + 1); assert.equal(row.tick, row.fromTick + 1); assert.ok(row.tick <= m.tick);
  });
  for (const row of m.actionReceipts) if (row.boardIndex !== null)
    for (const key of ['phaseUnits', 'resonanceUnits', 'amplitudeMetres', 'heightMetres']) assert.equal(row.before[key], row.after[key]);
  for (const row of m.phasePulseReceipts) {
    assert.equal(row.completedAtTick, row.startedAtTick + 10); assert.equal(row.intervalCount, 10); assert.equal(row.extraPhaseUnits, 250);
    const action = m.actionReceipts[row.actionReceiptId - 1]; assert.equal(action.pulseId, row.pulseId); assert.equal(action.fromTick, row.startedAtTick);
  }
  if (m.lastInterval) { assert.equal(m.lastInterval.toTick, m.tick); assert.equal(m.lastInterval.fromTick, m.tick - 1); }
}
export function assertProgress({ after }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won');
  assert.equal(m.stage, 'finished'); assert.deepEqual(m.failures, []); assert.equal(m.passedCount, m.scenario.pedestrianCount);
  assert.equal(m.remainingCount, 0); assert.equal(m.fallenCount, 0);
  assert.equal(m.score, 1000 + 100 * m.scenario.pedestrianCount + Math.floor((5400 - m.tick) / 60));
  assert.ok(m.actionReceipts.some(row => row.kind === 'frequency' && row.accepted)); assert.ok(m.phasePulseReceipts.length > 0);
  assert.ok(m.actionReceipts.filter(row => row.kind !== 'dispatch').every(row => row.fromTick < m.dispatchAtTick));
  for (const p of m.pedestrians) {
    const events = m.pedestrianEvents.filter(row => row.personId === p.id);
    assert.equal(events.filter(row => row.kind === 'crossing-started').length, 4);
    assert.equal(events.filter(row => row.kind === 'crossing-completed').length, 3);
    assert.equal(events.filter(row => row.kind === 'walking-completed').length, 3);
    assert.equal(events.filter(row => row.kind === 'passed').length, 1); assert.equal(p.releasedAtTick, m.dispatchAtTick + 600 * (p.id - 1));
  }
}
export function assertRetry({ after, initial }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(m.phase, 'playing'); assert.equal(m.stage, 'tuning');
  assert.ok(m.tick >= 0 && m.tick < 120); assert.equal(m.dispatchAtTick, null); assert.equal(m.cursor, 0);
  for (const field of ['actionReceipts', 'phasePulseReceipts', 'pedestrianEvents', 'scheduledReleaseTicks', 'failures']) assert.deepEqual(m[field], []);
  assert.ok(same(m.scenario, initial.model.scenario));
  for (const b of m.boards) {
    const speed = [10, 15, 20][m.scenario.initialFrequencyIndices[b.index]];
    assert.equal(b.phaseUnits, m.scenario.initialPhaseUnits[b.index] + speed * m.tick);
    assert.equal(b.resonanceUnits, speed === 15 ? m.scenario.initialResonanceUnits[b.index] + m.tick
      : Math.max(0, m.scenario.initialResonanceUnits[b.index] - 2 * m.tick));
    assert.equal(b.trimTicksRemaining, 0);
  }
  assert.ok(m.pedestrians.every(p => p.stage === 'pending' && p.movementTicks === 0));
}
