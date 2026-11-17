// Public current-state feedback only: no Model imports, rollouts, future key route or wall-clock schedule.
export const budgets = { maxWebGLDrawCalls: 1 };
export const lossPolicies = ['hold-both', 'omit-hold', 'skip-taps'];
export const lossReasons = ['broken_threads', 'broken_threads', 'broken_threads'];
const need = (ok, message) => { if (!ok) throw Error(message); };
const clone = value => structuredClone(value);
const keyFor = lane => lane === 'left' ? 'Space' : 'b';
const armed = (m, lane) => m.inputState[lane === 'left' ? 'aArmed' : 'bArmed'];
const rawReleased = (m, lane) => lane === 'left' ? !m.lastInput.raw.a && !m.lastInput.raw.aPressed : !m.lastInput.raw.b && !m.lastInput.raw.bPressed;
function shape(m) {
  need(m?.physics?.ticksPerSecond === 60 && m.physics.recoveryTicks === 60, 'Actual public Beat Braid rules required');
  need(Number.isSafeInteger(m.tick) && Number.isSafeInteger(m.activeTick) && m.activeTick <= m.tick, 'Separate actual tick and activeTick required');
  need(Array.isArray(m.tapReceipts) && Array.isArray(m.segmentReceipts) && Array.isArray(m.segmentStates), 'Actual public progress and receipt banks required');
}
export function createPilot({ mode = 'record', policy = mode === 'loss' ? lossPolicies[0] : 'normal' } = {}) {
  need(policy === 'normal' || lossPolicies.includes(policy), 'Unknown braid input policy');
  let identity = null, lastTick = -1, primed = false, pending = null, needsNeutral = true;
  let stats, attempted = new Set();
  function reset(m) {
    identity = `${m.seed}:${m.level}`; lastTick = m.tick; primed = false; pending = null; needsNeutral = true;
    attempted = new Set(); stats = { prime: null, issued: [], acknowledged: [], cancellations: [] };
  }
  function prime(state) {
    const m = state?.model; shape(m);
    need(m.tick === 0 && m.activeTick === 0 && !m.tapReceipts.length && !m.segmentReceipts.length, 'Prime needs an actual untouched initial public snapshot');
    reset(m); primed = true;
    stats.prime = { level: m.level, planningIterations: 0, modelSteps: 0, routeSearches: 0,
      scope: 'No preparation route. At each observation use only the current segment role, current pending tap window and actual independent key latches. Preparation uses the actual hold role; taps need real edge/receipt ACK and independent release.' };
    return clone(stats.prime);
  }
  function recordAck(m) {
    if (!pending || pending.acknowledged || m.tick <= pending.issuedTick) return;
    const receipt = m.tapReceipts.find(r => r.id === pending.pulseId);
    const ordinal = m.inputState.edgeOrdinals[pending.lane];
    if (ordinal > pending.beforeOrdinal || receipt) {
      pending.acknowledged = true; attempted.add(pending.pulseId);
      stats.acknowledged.push({ kind: 'actual-edge-or-resolved-tap', observedTick: m.tick, activeTick: m.activeTick,
        pulseId: pending.pulseId, lane: pending.lane, edgeOrdinal: ordinal, receipt: receipt ? clone(receipt) : null });
    }
  }
  function pilot(state) {
    const m = state?.model; if (!m) return [];
    if (identity !== `${m.seed}:${m.level}` || m.tick < lastTick) reset(m); lastTick = m.tick;
    if (m.phase !== 'playing') { if (primed) recordAck(m); return []; }
    if (state.phase !== 'playing' || state.paused) return [];
    shape(m); need(primed, 'Pilot must prime from the actual menu/initial snapshot');
    if (m.inputState.quarantined || m.lastInput?.raw.cancelled) {
      if (pending) stats.cancellations.push({ tick: m.tick, activeTick: m.activeTick, pending: clone(pending) });
      pending = null; needsNeutral = true; return [];
    }
    if (needsNeutral) {
      if (!m.lastInput?.fullNeutral || !m.inputState.aArmed || !m.inputState.bArmed) return [];
      needsNeutral = false; stats.acknowledged.push({ kind: 'actual-complete-neutral', tick: m.tick, activeTick: m.activeTick });
    }
    const current = m.currentSegment; if (!current) return [];
    const hold = policy === 'omit-hold' ? [] : [keyFor(current.config.holdLane)];
    if (policy === 'hold-both') return ['Space', 'b'];
    if (policy === 'skip-taps') return hold;
    recordAck(m);
    if (pending) {
      if (!pending.acknowledged) {
        need(m.tick - pending.issuedTick <= 120, 'Tap input has no actual edge or result acknowledgement');
        return [...new Set([...hold, keyFor(pending.lane)])];
      }
      if (pending.releaseTick === null) { pending.releaseTick = m.tick; return hold; }
      // A role change may make the previous tap key the new hold key. Its acknowledged tap is already resolved.
      const changedRole = current.config.index !== pending.segmentIndex;
      if (!changedRole && !(m.tick > pending.releaseTick && armed(m, pending.lane) && rawReleased(m, pending.lane))) return hold;
      stats.acknowledged.push({ kind: changedRole ? 'actual-role-change-after-edge' : 'actual-independent-tap-release', tick: m.tick,
        activeTick: m.activeTick, lane: pending.lane, effectiveHeld: clone(m.effectiveHeld), input: clone(m.lastInput) });
      pending = null;
    }
    if (m.clockMode !== 'running' || m.inputState.recoveryRemainingTicks > 0) return hold;
    const pulse = current.config.pulses.find(p => !attempted.has(p.id) && current.state.taps[p.localIndex].status === 'pending' &&
      m.activeTick >= p.openActiveTick && m.activeTick < p.closeActiveTick);
    if (!pulse || !armed(m, pulse.lane) || !rawReleased(m, pulse.lane)) return hold;
    need(stats.issued.length < m.segmentCount * 3 + 3, 'Bounded current-window tap attempts only');
    pending = { pulseId: pulse.id, segmentIndex: current.config.index, lane: pulse.lane, beforeOrdinal: m.inputState.edgeOrdinals[pulse.lane],
      issuedTick: m.tick, issuedActiveTick: m.activeTick, acknowledged: false, releaseTick: null };
    stats.issued.push(clone(pending)); return [...new Set([...hold, keyFor(pulse.lane)])];
  }
  pilot.prime = prime; pilot.keys = pilot;
  pilot.diagnostics = () => clone({ policy, pending, needsNeutral, ...(stats || {}) }); return pilot;
}
const defaultPilot = createPilot();
export const keys = (state, context) => defaultPilot(state, context);
export const prime = state => defaultPilot.prime(state);
export function assertPublicBoard(m, assert) {
  shape(m); assert.equal(m.elapsed, m.tick / 60); assert.equal(m.activeElapsed, m.activeTick / 60);
  assert.equal(m.level, m.difficulty + 1); assert.equal(m.scenarioId, m.scenario.id); assert.equal(m.identity.seed, m.seed);
  assert.equal(m.segmentCount, m.scenario.segmentCount); assert.equal(m.currentSegmentIndex, m.completedSegments);
  assert.equal(m.completedSegments, m.segmentReceipts.length); assert.equal(m.wovenSegments, m.segmentReceipts.filter(r => r.result === 'woven').length);
  assert.equal(m.breaks, m.segmentReceipts.filter(r => r.result === 'frayed').length);
  assert.equal(m.tapHitCount, m.tapReceipts.filter(r => r.result === 'hit').length); assert.equal(m.tapMissCount, m.tapReceipts.filter(r => r.result === 'missed').length);
  assert.equal(m.chainBonus, m.segmentReceipts.reduce((sum, r) => sum + r.chainBonusAdded, 0));
  assert.equal(m.score, 10 * m.tapHitCount + 100 * m.wovenSegments + m.chainBonus);
  assert.equal(m.currentStreak, m.segmentReceipts.at(-1)?.streakAfter ?? 0);
  assert.equal(m.longestStreak, Math.max(0, ...m.segmentReceipts.map(r => r.streakAfter)));
  assert.equal(m.segmentStates.length, m.segmentCount);
  const edges = new Set();
  m.tapReceipts.forEach((r, i) => {
    assert.equal(r.id, i + 1); assert.ok(r.resolvedTick <= m.tick && r.resolvedActiveTick <= m.activeTick);
    if (r.result === 'hit') { assert.ok(r.resolvedActiveTick >= r.openActiveTick && r.resolvedActiveTick <= r.closeActiveTick); assert.equal(r.holdEffectiveAtResolution, true);
      const key = `${r.lane}:${r.edgeOrdinal}`; assert.ok(!edges.has(key)); edges.add(key); }
    else { assert.equal(r.result, 'missed'); assert.equal(r.edgeOrdinal, null); assert.equal(r.resolvedActiveTick, r.closeActiveTick + 1); }
  });
  m.segmentReceipts.forEach((r, i) => { assert.equal(r.id, i + 1); assert.equal(r.index, i); assert.equal(r.resolvedActiveTick, m.scenario.segments[i].endActiveTick);
    assert.equal(r.scoreAfter - r.scoreBefore, r.segmentScoreAdded + r.chainBonusAdded); });
  if (m.currentSegment) { assert.deepEqual(m.currentSegment.config, m.scenario.segments[m.currentSegmentIndex]); assert.deepEqual(m.currentSegment.state, m.segmentStates[m.currentSegmentIndex]); }
  else assert.equal(m.completedSegments, m.segmentCount);
  if (m.tick === 0) { assert.equal(m.activeTick, 0); assert.equal(m.lastStep, null); assert.equal(m.lastInput, null); return; }
  const st = m.lastStep; assert.equal(st.toTick, m.tick); assert.equal(st.fromTick, m.tick - 1); assert.equal(st.toActiveTick, m.activeTick);
  assert.equal(st.toActiveTick - st.fromActiveTick, st.mode === 'running' ? 1 : 0); assert.equal(m.lastInput.tick, m.tick);
  assert.equal(st.scoreAfter, m.score); assert.deepEqual(st.terminalAfter, m.terminal); assert.deepEqual(m.effectiveHeld, m.lastInput.held);
  assert.deepEqual(m.lastTap, st.tapReceiptId === null ? null : m.tapReceipts[st.tapReceiptId - 1]);
  assert.deepEqual(m.lastSegment, st.segmentReceiptId === null ? null : m.segmentReceipts[st.segmentReceiptId - 1]);
  if (m.phase === 'playing') { assert.equal(m.terminal, null); assert.equal(m.lostReason, null); }
  else { assert.equal(m.terminal.endedTick, m.tick); assert.equal(m.terminal.endedActiveTick, m.activeTick); assert.equal(m.terminal.breaks, m.breaks);
    assert.equal(m.terminal.reason, m.phase === 'won' ? 'braid_complete' : m.lostReason); }
}
export function assertProgress({ after }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won');
  assert.equal(m.terminal.reason, 'braid_complete'); assert.equal(m.completedSegments, m.segmentCount);
  assert.equal(m.activeTick, m.deadlineActiveTick); assert.ok(m.longestStreak >= m.requiredStreak && m.breaks <= m.maxBreaks);
  assert.ok(m.activeElapsed >= 30 && m.activeElapsed <= 90);
  for (const lane of ['left', 'right']) assert.ok(m.tapReceipts.some(r => r.result === 'hit' && r.lane === lane));
}
export function assertRetry({ after, initial }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(m.phase, 'playing'); assert.ok(m.tick >= 0 && m.tick < 120);
  assert.ok(m.activeTick < m.physics.holdStartLocalTick); assert.deepEqual(m.scenario, initial.model.scenario);
  assert.equal(m.completedSegments, 0); assert.equal(m.breaks, 0); assert.equal(m.score, 0); assert.equal(m.tapHitCount, 0); assert.equal(m.tapMissCount, 0);
  assert.deepEqual(m.tapReceipts, []); assert.deepEqual(m.segmentReceipts, []); assert.equal(m.terminal, null);
  assert.ok(m.segmentStates.every(s => !s.holdMissingTicks && !s.tapHits && !s.missedTaps));
}
