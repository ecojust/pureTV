// Current public feedback; only a bounded scalar projection chooses the next component type.
export const budgets = { maxWebGLDrawCalls: 1 };
export const lossPolicies = ['closed-shutter', 'wait-deadline', 'wrong-orientation'];
export const lossReasons = ['fault_limit', 'deadline', 'fault_limit'];
const need = (ok, message) => { if (!ok) throw Error(message); };
const clone = value => structuredClone(value);
const mod = (value, period) => value - period * Math.floor(value / period);
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const INPUT_MARGIN = 6; // Public physical ticks allowed per press/release observation; not a scheduled action time.
function shape(m) {
  need(m?.physics?.geometry?.ticksPerSecond === 60 && m.physics.geometry.trackLengthUnits === 720, 'Actual conveyor geometry required');
  need(Array.isArray(m.parts) && m.sourceCarriers.length >= 2 && m.targetSlots.length >= 2, 'Actual unique-owner registry required');
}
function neutral(m) {
  const li = m.lastInput, l = m.inputState;
  return li && !li.cancelled && !li.epochChanged && !l.quarantined && li.axisX === 0 && li.axisY === 0
    && !li.effectiveA && !li.effectiveB && l.aArmed && l.bArmed;
}
const anchor = m => (m.scenario.windowXRange[0] + m.scenario.windowXRange[1]) / 2;
const held = m => m.parts.find(row => row.id === m.gripper.heldPartId) || null;
const pickupReach = m => m.physics.geometry.pickupRadiusUnits - INPUT_MARGIN * Math.abs(m.scenario.sourceVelocity);
const collectReach = m => pickupReach(m) - 2 * INPUT_MARGIN * Math.abs(m.scenario.sourceVelocity); // Stop inside the A radius before releasing.
function preparation(m, source, slot, wrong) {
  if (source.partId === null) return null; // Wait for an actual replacement, never invent a future part.
  const g = m.physics.geometry, part = m.parts.find(row => row.id === source.partId), direction = Math.sign(source.x - m.gripper.x);
  const closing = g.gripperSpeedUnitsPerTick - direction * m.scenario.sourceVelocity;
  const chase = Math.ceil(Math.max(0, Math.abs(source.x - m.gripper.x) - collectReach(m)) / closing);
  const sourceAtGrab = source.x + m.scenario.sourceVelocity * chase;
  if (sourceAtGrab < 0 || sourceAtGrab >= g.trackLengthUnits) return null; // No forecast through a source replacement.
  const gripperAtGrab = clamp(m.gripper.x + direction * g.gripperSpeedUnitsPerTick * chase, ...g.gripperXRange);
  const returnTicks = Math.ceil(Math.abs(gripperAtGrab - anchor(m)) / g.gripperSpeedUnitsPerTick);
  const quarterTurns = mod(slot.requiredQuarterTurns + (wrong ? 1 : 0) - part.quarterTurns, 4);
  return { chaseTicks: chase, returnTicks, quarterTurns,
    preparationTicks: chase + returnTicks + 2 * INPUT_MARGIN * (quarterTurns + 2) };
}
function chooseGoal(m, wrong) {
  const g = m.physics.geometry, gate = m.scenario.gate, radius = g.placementRadiusUnits;
  const lo = anchor(m) - radius, hi = anchor(m) + radius, v = m.scenario.targetVelocity, length = g.trackLengthUnits;
  let first = m.tick - m.gate.phaseTick + gate.openFromPhaseTick;
  if (m.gate.phaseTick >= gate.openUntilPhaseTick) first += gate.periodTicks;
  const candidates = [];
  // At most two shutter windows and the actual <=4 slots. No future tick loop or Model call.
  for (let windowIndex = 0; windowIndex < 2; windowIndex++) {
    const opening = first + windowIndex * gate.periodTicks, start = Math.max(m.tick, opening);
    const until = opening + gate.openUntilPhaseTick - gate.openFromPhaseTick - 1;
    for (const slot of m.targetSlots) {
      const source = m.sourceCarriers.find(row => row.type === slot.requiredType), prep = preparation(m, source, slot, wrong);
      if (!prep) continue;
      const x = mod(slot.x + v * (start - m.tick), length);
      let entry, exit;
      if (v > 0) {
        const shift = x > hi ? length : 0; entry = Math.max(0, (lo + shift - x) / v); exit = (hi + shift - x) / v;
      } else {
        const speed = -v, shift = x < lo ? length : 0; entry = Math.max(0, (x + shift - hi) / speed); exit = (x + shift - lo) / speed;
      }
      const firstReach = start + Math.ceil(entry), lastReach = Math.min(until, start + Math.floor(exit));
      const wrapIn = v > 0 ? Math.ceil((length - slot.x) / v) : Math.floor(slot.x / -v) + 1;
      if (firstReach > lastReach || m.tick + prep.preparationTicks > lastReach - 2 * INPUT_MARGIN) continue;
      if (slot.occupantPartId !== null && firstReach - m.tick < wrapIn) continue;
      candidates.push({ slotId: slot.id, type: slot.requiredType, sourceId: source.id,
        selectedAtTick: m.tick, windowIndex, firstReach, lastReach, ...prep });
    }
  }
  candidates.sort((a, b) => a.firstReach - b.firstReach || a.preparationTicks - b.preparationTicks || a.slotId.localeCompare(b.slotId));
  return candidates[0] || null;
}
function canSeatNow(m, part, wrong) {
  const slot = m.preview.nearestSlot, gate = m.scenario.gate;
  return m.gate.open && gate.openUntilPhaseTick - m.gate.phaseTick > 2 * INPUT_MARGIN && m.preview.windowFits &&
    slot && slot.occupantPartId === null && slot.inReach && slot.distance <= m.physics.geometry.placementRadiusUnits - INPUT_MARGIN * Math.abs(m.scenario.targetVelocity) &&
    slot.requiredType === part.type && (wrong ? part.quarterTurns !== slot.requiredQuarterTurns : part.quarterTurns === slot.requiredQuarterTurns);
}
export function createPilot({ mode = 'record', policy = mode === 'loss' ? 'closed-shutter' : 'normal' } = {}) {
  need(policy === 'normal' || lossPolicies.includes(policy), 'Unknown conveyor policy');
  let identity = null, lastTick = -1, primed = false, pending = null, goal = null;
  let stats = { prime: null, selections: [], issued: [], acknowledged: [] };
  function reset(m) {
    identity = m.seed + ':' + m.level; lastTick = m.tick; primed = false; pending = null; goal = null;
    stats = { prime: null, selections: [], issued: [], acknowledged: [] };
  }
  function prime(state) {
    const m = state?.model; shape(m);
    need(m.tick === 0 && m.actionReceipts.length === 0 && m.wrapReceipts.length === 0, 'Prime requires the real untouched initial snapshot');
    reset(m); primed = true;
    stats.prime = { level: m.level, initialGripper: clone(m.gripper),
      limits: { windowsPerDecision: 2, slotsPerWindow: m.targetSlots.length, futureTickIterations: 0, modelRollouts: 0, routeSearches: 0, maxIssuedKeys: 512 },
      scope: 'Project current slot x/velocity into only current/next shutter windows to choose a component type. Preparation is direct relative-speed chase plus return distance plus six ticks per input edge; reject a projected source wrap. No input timeline is generated. Chase and every grab/rotation/dispatch use actual snapshots and receipt acknowledgement; final dispatch needs current gate/fit/empty nearest matching slot. Diagnostics stay outside Model and public evidence.' };
    return clone(stats.prime);
  }
  function moveKey(m, intent) {
    const source = intent.kind === 'collect' ? m.sourceCarriers.find(row => row.id === intent.sourceId) : null;
    const x = source ? source.x : anchor(m), tolerance = source ? collectReach(m) : 3 * m.physics.geometry.gripperSpeedUnitsPerTick;
    if (source && source.partId === null) return null;
    return Math.abs(x - m.gripper.x) <= tolerance ? null : x < m.gripper.x ? 'ArrowLeft' : 'ArrowRight';
  }
  function issue(m, key, kind, intent = null, expectedResult = null) {
    need(!pending && stats.issued.length < 512, 'One bounded ordinary key hold at a time');
    pending = { key, kind, intent: clone(intent), expectedResult, issuedTick: m.tick,
      gripperBefore: clone(m.gripper), heldBefore: clone(held(m)), receiptCount: m.actionReceipts.length,
      acknowledged: false, phase: 'press', releaseTick: null };
    stats.issued.push(clone(pending)); return [key];
  }
  function acknowledge(m, terminal = false) {
    const p = pending;
    if (p.phase === 'terminal') return true;
    if (p.phase === 'release') {
      if (terminal || m.tick <= p.releaseTick || !neutral(m)) return true;
      pending = null; return false;
    }
    if (m.tick <= p.issuedTick) return true;
    if (!p.acknowledged) {
      let observed = null;
      if (p.kind === 'action' && m.actionReceipts.length > p.receiptCount) {
        const receipt = m.actionReceipts[p.receiptCount];
        need(m.actionReceipts.length === p.receiptCount + 1 && receipt.boundaryTick >= p.issuedTick, 'One held action must have exactly one actual receipt');
        need(receipt.action === (p.key === 'b' ? 'rotate' : 'grab_or_dispatch'), 'ACK must describe the actual requested button');
        observed = { kind: 'actual-action-receipt', receipt: clone(receipt), expectedResult: p.expectedResult, expectedObserved: receipt.result === p.expectedResult };
        if (receipt.result !== 'rotated') goal = null;
      } else if (p.kind === 'navigate' && m.gripper.x !== p.gripperBefore.x) {
        need(m.actionReceipts.length === p.receiptCount, 'Horizontal input cannot create a component action');
        observed = { kind: 'actual-gripper-motion', before: clone(p.gripperBefore), after: clone(m.gripper), input: clone(m.lastInput) };
      }
      if (!observed) { need(m.tick - p.issuedTick <= 120, 'Ordinary key lacks real acknowledgement within 120 ticks'); return true; }
      p.acknowledged = true; stats.acknowledged.push({ issuedTick: p.issuedTick, observedTick: m.tick, key: p.key, ...observed });
    }
    if (terminal) { p.phase = 'terminal'; return true; }
    if (p.kind === 'navigate' && moveKey(m, p.intent) === p.key) return true;
    p.phase = 'release'; p.releaseTick = m.tick; return true;
  }
  function pilot(state) {
    const m = state?.model; if (!m) return [];
    if (identity !== m.seed + ':' + m.level || m.tick < lastTick) reset(m); lastTick = m.tick;
    if (m.phase !== 'playing') { if (primed && pending?.kind === 'action') acknowledge(m, true); return []; }
    if (state.phase !== 'playing' || state.paused) return [];
    shape(m); need(primed, 'Pilot must prime the actual initial snapshot');
    if (pending && acknowledge(m)) return pending.phase === 'press' ? [pending.key] : [];
    if (m.inputState.quarantined || !neutral(m) || policy === 'wait-deadline') return [];
    const part = held(m);
    if (!part) {
      if (policy === 'closed-shutter') {
        const source = m.preview.nearestSource;
        if (!source) return [];
        goal = { sourceId: source.id, type: m.sourceCarriers.find(row => row.id === source.id).type };
      } else if (!goal || m.tick > goal.lastReach) {
        goal = chooseGoal(m, policy === 'wrong-orientation');
        if (goal) stats.selections.push(clone(goal));
      }
      if (!goal) return [];
      const nearest = m.preview.nearestSource, source = m.sourceCarriers.find(row => row.id === goal.sourceId);
      if (nearest?.id === source.id && nearest.inReach && nearest.distance <= pickupReach(m)) return issue(m, 'Space', 'action', null, 'grabbed');
      const intent = { kind: 'collect', sourceId: source.id }, key = moveKey(m, intent);
      return key ? issue(m, key, 'navigate', intent) : [];
    }
    if (policy === 'closed-shutter') {
      const gate = m.scenario.gate, untilOpen = m.gate.phaseTick < gate.openFromPhaseTick ?
        gate.openFromPhaseTick - m.gate.phaseTick : gate.periodTicks - m.gate.phaseTick + gate.openFromPhaseTick;
      return !m.gate.open && untilOpen > 2 * INPUT_MARGIN ? issue(m, 'Space', 'action', null, 'shutter_closed') : [];
    }
    const intent = { kind: 'return' }, key = moveKey(m, intent);
    if (key) return issue(m, key, 'navigate', intent);
    const target = m.targetSlots.find(row => row.requiredType === part.type);
    const quarterTurns = mod(target.requiredQuarterTurns + (policy === 'wrong-orientation' ? 1 : 0), 4);
    if (part.quarterTurns !== quarterTurns) return issue(m, 'b', 'action', null, 'rotated');
    return canSeatNow(m, part, policy === 'wrong-orientation') ?
      issue(m, 'Space', 'action', null, policy === 'wrong-orientation' ? 'wrong_orientation' : 'seated') : [];
  }
  pilot.prime = prime; pilot.keys = pilot; pilot.diagnostics = () => clone({ policy, pending, goal, ...stats }); return pilot;
}
const defaultPilot = createPilot();
export const keys = (state, context) => defaultPilot(state, context);
export const prime = state => defaultPilot.prime(state);
export function assertPublicBoard(m, assert) {
  shape(m); assert.equal(m.elapsed, m.tick / 60); assert.equal(m.level, m.difficulty + 1); assert.equal(m.scenarioId, m.scenario.id);
  const g = m.physics.geometry, rule = m.scenario.gate, phase = mod(m.tick + rule.phaseOffsetTicks, rule.periodTicks);
  assert.deepEqual(m.gate, { tick: m.tick, phaseTick: phase, open: phase >= rule.openFromPhaseTick && phase < rule.openUntilPhaseTick, windowXRange: m.scenario.windowXRange });
  assert.equal(m.preview.tick, m.tick); assert.equal(m.preview.gateOpen, m.gate.open); assert.equal(m.preview.heldPartId, m.gripper.heldPartId);
  assert.equal(m.score, m.phase === 'won' ? 1000 + 100 * m.requiredStreak + 100 * (m.faultLimit - m.faults) : 100 * m.totalCorrect);
  assert.equal(new Set(m.parts.map(row => row.id)).size, m.parts.length);
  const activeIds = [];
  for (const [rows, authored, velocity, source] of [[m.sourceCarriers, m.scenario.sourceCarriers, m.scenario.sourceVelocity, true],
    [m.targetSlots, m.scenario.targetSlots, m.scenario.targetVelocity, false]]) {
    rows.forEach((row, index) => {
      const raw = authored[index].initialX + velocity * m.tick;
      assert.equal(row.id, authored[index].id); assert.equal(row.x, mod(raw, g.trackLengthUnits));
      assert.equal(row.generation, Math.abs(Math.floor(raw / g.trackLengthUnits)));
      const id = source ? row.partId : row.occupantPartId;
      if (id !== null) {
        const part = m.parts.find(p => p.id === id); assert.ok(part); activeIds.push(id);
        assert.equal(part.owner, source ? 'source' : 'slot'); assert.equal(part.ownerId, row.id); assert.equal(part.ownerGeneration, row.generation);
        assert.equal(part.x, row.x); assert.equal(part.y, row.y); assert.equal(part.endedTick, null); assert.equal(part.endReason, null);
      }
    });
  }
  if (m.gripper.heldPartId !== null) {
    const p = held(m); assert.ok(p); activeIds.push(p.id); assert.equal(p.owner, 'held'); assert.equal(p.ownerId, 'gripper'); assert.equal(p.ownerGeneration, null);
    assert.equal(p.x, m.gripper.x); assert.equal(p.y, m.gripper.y); assert.equal(p.endedTick, null);
  }
  assert.equal(new Set(activeIds).size, activeIds.length);
  assert.equal(activeIds.length, m.parts.filter(row => ['source', 'held', 'slot'].includes(row.owner)).length);
  for (const part of m.parts) {
    assert.equal(part.id, part.sourceCarrierId + '@' + part.birthGeneration);
    assert.ok(['source', 'held', 'slot', 'completed', 'retired', 'damaged'].includes(part.owner));
    assert.ok(part.createdTick <= m.tick && Number.isInteger(part.quarterTurns) && part.quarterTurns >= 0 && part.quarterTurns < 4);
    if (!activeIds.includes(part.id)) { assert.equal(part.ownerId, null); assert.equal(part.ownerGeneration, null); assert.ok(part.endedTick >= part.createdTick && part.endedTick <= m.tick); }
  }
  assert.equal(m.parts.length, m.sourceCarriers.length + m.sourceCarriers.reduce((n, row) => n + row.generation, 0));
  m.actionReceipts.forEach((r, i) => { assert.equal(r.id, i + 1); assert.ok(r.boundaryTick < m.tick); });
  m.wrapReceipts.forEach((r, i) => { assert.equal(r.id, i + 1); assert.ok(r.endedTick <= m.tick); });
  assert.equal(m.totalCorrect, m.actionReceipts.filter(r => r.result === 'seated').length);
  assert.equal(m.faults, m.parts.filter(row => row.owner === 'damaged').length);
  if (m.lastStep) {
    assert.equal(m.lastStep.fromTick, m.tick - 1); assert.equal(m.lastStep.toTick, m.tick); assert.equal(m.lastInput.boundaryTick, m.tick - 1);
    assert.deepEqual(m.lastStep.gripperAfter, m.gripper); assert.deepEqual(m.lastStep.terminalAfter, m.terminal);
    assert.deepEqual(m.lastStep.countersAfter, { streak: m.streak, totalCorrect: m.totalCorrect, faults: m.faults });
    assert.deepEqual(m.lastStep.actionReceiptIds, m.actionReceipts.filter(r => r.boundaryTick === m.tick - 1).map(r => r.id));
    assert.deepEqual(m.lastStep.wrapReceiptIds, m.wrapReceipts.filter(r => r.endedTick === m.tick).map(r => r.id));
  } else assert.equal(m.tick, 0);
}
export function assertProgress({ after }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won');
  assert.equal(m.lostReason, null); assert.equal(m.terminal.reason, 'required_streak'); assert.equal(m.streak, m.requiredStreak);
  assert.ok(m.elapsed >= 30 && m.elapsed <= 90); assert.equal(m.terminal.actionBoundaryTick, m.tick - 1); assert.equal(m.terminal.endedTick, m.tick);
  for (const result of ['grabbed', 'rotated', 'seated']) assert.ok(m.actionReceipts.some(row => row.result === result));
  assert.equal(m.lastAction.result, 'seated'); assert.equal(m.lastStep.toTick, m.lastStep.fromTick + 1);
}
export function assertRetry({ after, initial }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(m.phase, 'playing'); assert.ok(m.tick >= 0 && m.tick < 120);
  assert.deepEqual(m.scenario, initial.model.scenario); assert.deepEqual(m.gripper, initial.model.gripper);
  assert.equal(m.streak, 0); assert.equal(m.totalCorrect, 0); assert.equal(m.faults, 0); assert.equal(m.score, 0);
  assert.deepEqual(m.actionReceipts, []); assert.equal(m.lastAction, null); assert.equal(m.terminal, null);
  assert.ok(m.parts.every(row => ['source', 'retired'].includes(row.owner)));
  assert.ok(m.targetSlots.every(row => row.occupantPartId === null));
  // Real initial-motion prefixes may already wrap: e.g. L3's negative slot at x12 wraps at tick13.
  for (const carrier of m.sourceCarriers) assert.equal(carrier.partId, carrier.id + '@' + carrier.generation);
  assert.equal(m.wrapReceipts.length, [...m.sourceCarriers, ...m.targetSlots].reduce((n, row) => n + row.generation, 0));
}
