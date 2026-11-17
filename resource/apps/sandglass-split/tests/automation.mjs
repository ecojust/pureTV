// Public observations and ordinary receipt-acknowledged keys only.
// No Model import, design route, physics replay, search or fixed action timetable.
export const budgets = { maxWebGLDrawCalls: 1 };
export const lossPolicies = ['outer-overflow', 'center-overflow', 'closed-deadline'];
const need = (ok, message) => { if (!ok) throw Error(message); };
const clone = value => structuredClone(value);
function shape(m) {
  need(m && m.gates?.length === 2 && m.cups?.length === 3 && Array.isArray(m.packets), 'Actual two-stream, three-cup board required');
  need(m.physics.tickHz === 60 && m.physics.massPerPacketG === 1 && m.cups.map(c => c.id).join(',') === 'left,center,right', 'Published flow units and cup identities required');
  need(m.cursor === 0 || m.cursor === 1, 'Actual left/right selector required');
}
function config(m) { return { cursor: m.cursor, sourceOpen: m.sourceOpen, gateModes: m.gates.map(g => g.mode) }; }
function lockedOuterMass(m, source) {
  const cup = m.cups.find(c => c.id === m.gates[source].outerCupId);
  // This is a controller observation, not a cup-weight claim: the two quantities stay separate in state/UI.
  const lockedInFlightG = m.packets.filter(p => p.sourceIndex === source && p.stage === 'guided' && p.route === 'outer').length;
  return { cupId: cup.id, actualCupMassG: cup.massG, lockedInFlightG, committedG: cup.massG + lockedInFlightG,
    targetG: cup.targetG, capacityG: cup.capacityG };
}
export function createPilot({ mode = 'record', policy = mode === 'loss' ? 'outer-overflow' : 'normal' } = {}) {
  need(policy === 'normal' || lossPolicies.includes(policy), 'Unknown public flow policy');
  let identity = null, lastTick = -1, pending = null, primed = false;
  let closedOnce = false, reopened = false, negativeOpened = false, negativeClosed = false;
  let stats = { prime: null, issued: [], acknowledged: [], decisions: [], closedObservations: [] };
  function reset(m) {
    identity = `${m.level}:${m.seed}`; lastTick = m.tick; pending = null; primed = false;
    closedOnce = false; reopened = false; negativeOpened = false; negativeClosed = false;
    stats = { prime: null, issued: [], acknowledged: [], decisions: [], closedObservations: [] };
  }
  function prime(state) {
    const m = state?.model; shape(m); need(m.tick === 0 && m.commandCount === 0 && !m.sourceOpen, 'Prime only the untouched public board');
    reset(m); primed = true;
    stats.prime = { scope: 'Live mass/contact feedback only; no plan, physical prediction, search or source clock advance.', candidates: 0, transitions: 0, elapsedMs: 0 };
    return clone(stats.prime);
  }
  function realNeutral(m) {
    return m.lastInput && !m.lastInput.cancelled && !m.lastInput.sample.cancelled && !m.inputState.quarantined
      && Math.abs(m.lastInput.sample.x) <= .45 && !m.lastInput.sample.aDown && !m.lastInput.sample.bDown
      && m.inputState.aArmed && m.inputState.bArmed && m.inputState.navigationHeldTicks === 0;
  }
  function issue(m, key, intent) {
    need(!pending && stats.issued.length < 24, 'One ordinary edge at a time, at most twenty-four issued keys');
    pending = { key, intent: clone(intent), tick: m.tick, before: config(m), commandCount: m.commandCount,
      navigationCount: m.navigationCount, phase: 'press', releaseTick: null };
    stats.issued.push(clone(pending)); return [key];
  }
  function select(m, source) {
    return m.cursor === source ? null : issue(m, source > m.cursor ? 'ArrowRight' : 'ArrowLeft', { kind: 'navigate', cursor: source });
  }
  function rotate(m, source) {
    return select(m, source) || issue(m, 'Space', { kind: 'rotate', source, mode: m.gates[source].mode === 'outer' ? 'center' : 'outer' });
  }
  function valve(m, open, role) {
    need(m.sourceOpen !== open, 'A valve command must change its actual state'); return issue(m, 'b', { kind: 'valve', open, role });
  }
  function acknowledge(m) {
    const p = pending;
    if (p.phase === 'release') {
      if (m.tick <= p.releaseTick || !realNeutral(m)) return true;
      pending = null; return false;
    }
    if (m.tick <= p.tick) return true;
    let receipt = null;
    if (p.intent.kind === 'navigate' && m.navigationCount > p.navigationCount) {
      receipt = m.navigationReceipts[p.navigationCount];
      need(m.navigationCount === p.navigationCount + 1 && receipt.beforeCursor === p.before.cursor
        && receipt.afterCursor === p.intent.cursor && m.cursor === p.intent.cursor && receipt.heldTicks === 1,
      'One actual initial navigation must acknowledge the selector key');
    } else if (p.intent.kind !== 'navigate' && m.commandCount > p.commandCount) {
      receipt = m.commandReceipts[p.commandCount];
      need(m.commandCount === p.commandCount + 1 && receipt.id === p.commandCount + 1
        && JSON.stringify(receipt.before) === JSON.stringify(p.before), 'One real input configuration boundary per action edge');
      if (p.intent.kind === 'rotate') {
        need(receipt.inputKey === 'a' && receipt.action === 'rotate-gate' && receipt.gateId === m.gates[p.intent.source].id
          && receipt.after.gateModes[p.intent.source] === p.intent.mode && receipt.after.sourceOpen === p.before.sourceOpen,
        'A must rotate the actually selected gate without changing the valve');
      } else {
        need(receipt.inputKey === 'b' && receipt.action === 'toggle-source' && receipt.gateId === null
          && receipt.after.sourceOpen === p.intent.open && JSON.stringify(receipt.after.gateModes) === JSON.stringify(p.before.gateModes),
        'B must acknowledge the actual requested valve state without changing either gate');
        if (p.intent.role === 'demonstrate-close') closedOnce = true;
        if (p.intent.role === 'resume-after-drain') reopened = true;
        if (p.intent.role === 'negative-open') negativeOpened = true;
        if (p.intent.role === 'negative-close') negativeClosed = true;
      }
    }
    if (!receipt) { need(m.tick - p.tick <= 40, 'Ordinary key did not produce an actual acknowledgement within forty ticks'); return true; }
    need(receipt.tick > p.tick, 'Actual receipt must follow the issued key');
    stats.acknowledged.push({ issuedTick: p.tick, observedTick: m.tick, key: p.key, receipt: clone(receipt) });
    p.phase = 'release'; p.releaseTick = m.tick; return true;
  }
  function negative(m) {
    if (policy === 'center-overflow') {
      const source = m.gates.findIndex(g => g.mode !== 'center'); if (source >= 0) return rotate(m, source);
    }
    if (!negativeOpened) return valve(m, true, 'negative-open');
    if (policy === 'closed-deadline' && !negativeClosed) return valve(m, false, 'negative-close');
    return [];
  }
  function normal(m) {
    if (m.sourceAgeTicks === 0 && !m.sourceOpen) return valve(m, true, 'initial-open');
    // One visible upstream stop is triggered by an actual first capture, not a timetable.
    if (!closedOnce && m.capturedCount > 0 && m.reservoirMassG > 0 && m.sourceOpen) return valve(m, false, 'demonstrate-close');
    if (closedOnce && !reopened) {
      need(!m.sourceOpen, 'The accepted demonstration close must remain closed while draining');
      stats.closedObservations.push({ tick: m.tick, packets: m.packets.length, capturedCount: m.capturedCount, sourceAgeTicks: m.sourceAgeTicks });
      if (m.packets.length > 0) return [];
      need(m.reservoirMassG > 0, 'The early observed drain must leave actual source mass');
      return valve(m, true, 'resume-after-drain');
    }
    const choices = m.gates.filter(g => g.mode === 'outer').map(g => {
      const counts = lockedOuterMass(m, g.sourceIndex);
      need(counts.committedG <= counts.capacityG, 'Actual locked outer flow already exceeds its real cup capacity');
      return { source: g.sourceIndex, ...counts, urgency: (counts.targetG - counts.committedG) * m.emitPeriodsTicks[g.sourceIndex] };
    }).sort((a, b) => a.urgency - b.urgency || a.source - b.source);
    if (!choices.length) return [];
    const current = choices[0], selection = select(m, current.source); if (selection) return selection;
    if (current.committedG < current.targetG) return [];
    stats.decisions.push({ tick: m.tick, source: current.source, actualCupMassG: current.actualCupMassG,
      lockedInFlightG: current.lockedInFlightG, observedCommittedG: current.committedG, targetG: current.targetG,
      basis: 'Only actual cup mass plus already contacted outer-route packets; falling packets remain unassigned.' });
    return rotate(m, current.source);
  }
  function pilot(state) {
    const m = state?.model; if (!m) return [];
    if (identity !== `${m.level}:${m.seed}` || m.tick < lastTick) reset(m); lastTick = m.tick;
    if (state.phase !== 'playing' || state.paused || m.phase !== 'playing') return [];
    shape(m); need(primed, 'Pilot must be primed from the actual initial public snapshot');
    if (pending && acknowledge(m)) return pending.phase === 'press' ? [pending.key] : [];
    if (m.inputState.quarantined || (m.tick > 0 && !realNeutral(m))) return [];
    return policy === 'normal' ? normal(m) : negative(m);
  }
  pilot.prime = prime; pilot.keys = pilot; pilot.diagnostics = () => clone({ policy, ...stats }); return pilot;
}
const defaultPilot = createPilot();
export const keys = (state, context) => defaultPilot(state, context);
export const prime = state => defaultPilot.prime(state);
export function assertPublicBoard(m, assert) {
  shape(m); assert.equal(m.elapsed, m.tick / 60); assert.equal(m.remaining, Math.max(0, (m.deadlineTick - m.tick) / 60));
  assert.equal(m.commandCount, m.commandReceipts.length); assert.equal(m.navigationCount, m.navigationReceipts.length);
  const cupMass = m.cups.reduce((n, c) => n + c.massG, 0), inFlight = m.packets.length;
  assert.equal(m.initialMassG, m.reservoirMassG + inFlight + cupMass + m.spillMassG);
  assert.equal(m.inventory.errorG, 0); assert.equal(m.inventory.totalMassG, m.initialMassG); assert.equal(m.inventory.packetsExactlyOnce, true);
  assert.equal(m.inventory.cupMassG, cupMass); assert.equal(m.inventory.inFlightMassG, inFlight); assert.equal(m.inventory.packetCount, inFlight);
  assert.equal(m.capturedCount, cupMass); assert.equal(m.spilledCount, m.spillMassG);
  assert.equal(new Set(m.packets.map(p => p.id)).size, m.packets.length);
  for (const c of m.cups) {
    assert.equal(c.massG, c.contributionsG[0] + c.contributionsG[1]); assert.equal(Number.isInteger(c.massG), true);
    assert.equal(c.withinTarget, c.massG >= c.minimumG && c.massG <= c.capacityG); assert.equal(c.full, c.massG === c.capacityG);
  }
  for (const p of m.packets) {
    assert.equal(p.massG, 1); assert.equal(Number.isSafeInteger(p.xU) && Number.isSafeInteger(p.yU), true);
    assert.equal(p.vyU, 20); assert.ok(p.sourceIndex === 0 || p.sourceIndex === 1);
    if (p.stage === 'fall') { assert.equal(p.route, null); assert.equal(p.contactTick, null); assert.equal(p.vxU, 0); }
    else { assert.equal(p.stage, 'guided'); assert.ok(['outer', 'center'].includes(p.route)); assert.ok(Number.isInteger(p.contactTick)); }
  }
  for (const [source, row] of m.inventory.bySource.entries()) {
    assert.equal(row.emittedG, m.emittedBySource[source]); assert.equal(row.emittedG, row.inFlightG + row.capturedG + row.spilledG);
    assert.equal(row.inFlightG, m.packets.filter(p => p.sourceIndex === source).length);
    assert.equal(row.capturedG, m.cups.reduce((n, c) => n + c.contributionsG[source], 0));
  }
  if (m.lastInterval) { assert.equal(m.lastInterval.tick, m.tick); assert.equal(m.lastInterval.fromTick, m.tick - 1);
    assert.deepEqual(m.lastInterval.inventoryAfter, m.inventory); }
}
export function assertProgress({ after }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won');
  assert.deepEqual(m.failures, []); assert.equal(m.reservoirMassG, 0); assert.equal(m.packets.length, 0); assert.equal(m.spillMassG, 0);
  assert.equal(m.capturedCount, m.initialMassG); assert.equal(m.deflectionCount, m.initialMassG); assert.ok(m.cups.every(c => c.withinTarget));
  assert.equal(m.flowReceipts.filter(r => r.kind === 'emit').length, m.initialMassG);
  assert.equal(m.flowReceipts.filter(r => r.kind === 'contact').length, m.initialMassG);
  assert.equal(m.flowReceipts.filter(r => r.kind === 'capture').length, m.initialMassG);
  const closes = m.commandReceipts.filter(r => r.action === 'toggle-source' && r.after.sourceOpen === false);
  assert.ok(closes.length >= 1, 'Normal run includes an actual accepted upstream close');
  assert.ok(m.flowReceipts.some(r => r.kind === 'capture' && closes.some(c => r.tick > c.tick
    && !m.commandReceipts.some(open => open.action === 'toggle-source' && open.after.sourceOpen && open.tick > c.tick && open.tick <= r.tick))),
  'Some actual captures continue while the source is closed');
}
export function assertRetry({ after, initial }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(m.phase, 'playing'); assert.ok(m.tick >= 0 && m.tick < 120);
  for (const key of ['cursor', 'sourceOpen', 'sourceAgeTicks', 'reservoirMassG', 'spillMassG', 'gates', 'cups', 'packets', 'inventory',
    'emittedBySource', 'nextPacketId', 'commandCount', 'navigationCount', 'deflectionCount', 'capturedCount', 'spilledCount',
    'commandReceipts', 'navigationReceipts', 'flowReceipts']) assert.deepEqual(m[key], initial.model[key], 'Fresh retry restores ' + key);
}
