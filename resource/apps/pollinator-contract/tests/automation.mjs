// Public, receipt-acknowledged control only. No Model, private route, replay, search or clock advance.
export const budgets = { maxWebGLDrawCalls: 1 };
export const lossPolicies = ['skip-first-bloom', 'overstay-root-fields', 'skip-first-bloom'];
const need = (ok, message) => { if (!ok) throw Error(message); };
const clone = value => structuredClone(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function shape(m) {
  need(m && m.swarms?.length === 2 && [4, 5, 6].includes(m.fields?.length), 'Actual two-swarm public garden required');
  need(m.swarms.map(g => g.id).join(',') === 'B1,B2' && m.physics.tickHz === 60 && m.physics.speedPixelsPerTick === 3,
    'Published swarm identities and flight units required');
}
function realNeutral(m) {
  return m.lastInput && !m.lastInput.cancelled && !m.lastInput.sample.cancelled && !m.inputState.quarantined
    && Math.abs(m.lastInput.sample.x) <= .45 && Math.abs(m.lastInput.sample.y) <= .45
    && !m.lastInput.sample.aDown && !m.lastInput.sample.bDown && m.inputState.aArmed && m.inputState.bArmed
    && m.inputState.navigationHeldTicks === 0;
}
function travelTicks(g, destination) {
  const distance = Math.hypot(destination.x - g.x, destination.y - g.y), nearest = Math.round(distance / 3) * 3;
  return Math.max(1, Math.ceil((Math.abs(distance - nearest) <= 1e-9 ? nearest : distance) / 3));
}
export function createPilot({ mode = 'record', policy = mode === 'loss' ? 'skip-first-bloom' : 'normal' } = {}) {
  need(['normal', 'skip-first-bloom', 'overstay-root-fields'].includes(policy), 'Unknown public garden policy');
  let identity = null, lastTick = -1, pending = null, primed = false, demonstrationFlight = null, demonstrationRetarget = null;
  let stats = { prime: null, issued: [], acknowledged: [], decisions: [] };
  function reset(m) {
    identity = `${m.level}:${m.seed}`; lastTick = m.tick; pending = null; primed = false;
    demonstrationFlight = null; demonstrationRetarget = null;
    stats = { prime: null, issued: [], acknowledged: [], decisions: [] };
  }
  function prime(state) {
    const m = state?.model; shape(m);
    need(m.tick === 0 && m.commandCount === 0 && m.swarms.every(g => g.mode === 'home'), 'Prime only an untouched actual initial snapshot');
    reset(m); primed = true;
    stats.prime = { scope: 'Current public assignments, actual work and stamina feedback. No search, simulation or source clock advance.',
      candidates: 0, transitions: 0, elapsedMs: 0 };
    return clone(stats.prime);
  }
  function issue(m, key, intent) {
    need(!pending && stats.issued.length < 180, 'One ordinary edge at a time; bounded to 180 issued keys');
    pending = { key, intent: clone(intent), tick: m.tick, commandCount: m.commandCount, blockedCommands: m.blockedCommands,
      navigationCount: m.navigationCount, beforeSelection: { swarmCursor: m.swarmCursor, fieldCursor: m.fieldCursor }, phase: 'press', releaseTick: null };
    stats.issued.push(clone(pending)); return [key];
  }
  function selectSwarm(m, index) {
    return m.swarmCursor === index ? null : issue(m, index > m.swarmCursor ? 'ArrowDown' : 'ArrowUp', { kind: 'navigate', axis: 'swarm', index });
  }
  function selectField(m, index) {
    return m.fieldCursor === index ? null : issue(m, index > m.fieldCursor ? 'ArrowRight' : 'ArrowLeft',
      { kind: 'navigate', axis: 'field', index: m.fieldCursor + Math.sign(index - m.fieldCursor) });
  }
  function dispatch(m, swarmIndex, fieldIndex, role) {
    const selection = selectSwarm(m, swarmIndex) || selectField(m, fieldIndex); if (selection) return selection;
    const g = m.swarms[swarmIndex], f = m.fields[fieldIndex];
    need(!f.completed && g.assignment !== f.id, 'Dispatch only a currently unfinished, different destination');
    stats.decisions.push({ tick: m.tick, role, swarmId: g.id, destinationId: f.id, actualMode: g.mode,
      actualStaminaTicks: g.staminaTicks, actualWorkTicks: f.workTicks, requiredWorkTicks: f.requiredWorkTicks,
      actualUnlocked: f.unlocked, actualBloomPhase: f.bloomPhase });
    return issue(m, 'Space', { kind: 'command', key: 'a', swarmId: g.id, destinationId: f.id, role });
  }
  function recall(m, swarmIndex, role) {
    const selection = selectSwarm(m, swarmIndex); if (selection) return selection;
    const g = m.swarms[swarmIndex]; need(g.mode !== 'home' && g.assignment !== 'hive', 'Recall only an actual away, non-returning swarm');
    stats.decisions.push({ tick: m.tick, role, swarmId: g.id, destinationId: 'hive', actualMode: g.mode,
      actualStaminaTicks: g.staminaTicks, directHomeTicks: g.directHomeTicks, homeReserveTicks: g.homeReserveTicks,
      predictionScope: 'Published direct-home estimate is a decision aid, not an actual arrival.' });
    return issue(m, 'b', { kind: 'command', key: 'b', swarmId: g.id, destinationId: 'hive', role });
  }
  function acknowledge(m) {
    const p = pending;
    if (p.phase === 'release') {
      if (m.tick <= p.releaseTick || !realNeutral(m)) return true;
      pending = null; return false;
    }
    if (m.tick <= p.tick) return true;
    need(m.blockedCommands === p.blockedCommands, 'Ordinary requested input was blocked; retain the actual failure');
    let receipt = null;
    if (p.intent.kind === 'navigate' && m.navigationCount > p.navigationCount) {
      receipt = m.navigationReceipts[p.navigationCount];
      const before = p.beforeSelection[p.intent.axis + 'Cursor'];
      need(m.navigationCount === p.navigationCount + 1 && receipt.axis === p.intent.axis && receipt.beforeIndex === before
        && receipt.afterIndex === p.intent.index && m[p.intent.axis + 'Cursor'] === p.intent.index && receipt.heldTicks === 1,
        'One actual initial navigation must acknowledge the selection key');
    } else if (p.intent.kind === 'command' && m.commandCount > p.commandCount) {
      receipt = m.commandReceipts[p.commandCount];
      need(m.commandCount === p.commandCount + 1 && receipt.id === p.commandCount + 1 && receipt.key === p.intent.key
        && receipt.swarmId === p.intent.swarmId && receipt.destinationId === p.intent.destinationId,
        'One actual accepted command must acknowledge the requested swarm and destination');
      need(receipt.before.x === receipt.after.x && receipt.before.y === receipt.after.y
        && receipt.before.staminaTicks === receipt.after.staminaTicks && receipt.after.flight.id === receipt.flightId,
        'Command receipt must preserve position and stamina before physical movement');
      if (p.intent.role === 'demonstration-outbound') {
        need(receipt.action === 'dispatch' && receipt.before.mode === 'home', 'Demonstration begins with actual hive departure');
        demonstrationFlight = receipt.flightId;
      }
      if (p.intent.role === 'demonstration-retarget') {
        need(receipt.action === 'retarget' && receipt.before.mode === 'flying' && receipt.before.flight.id === demonstrationFlight
          && receipt.before.assignment !== receipt.destinationId && receipt.flightId !== demonstrationFlight,
          'Demonstration must change the destination of the same actual in-flight swarm');
        demonstrationRetarget = receipt.id;
      }
    }
    if (!receipt) { need(m.tick - p.tick <= 60, 'Ordinary input lacks an actual acknowledgement within sixty ticks'); return true; }
    need(receipt.tick > p.tick, 'Actual receipt must follow the observation issuing the input');
    stats.acknowledged.push({ issuedTick: p.tick, observedTick: m.tick, key: p.key, receipt: clone(receipt) });
    p.phase = 'release'; p.releaseTick = m.tick; return true;
  }
  function negative(m) {
    if (policy === 'skip-first-bloom') return m.commandCount === 0 ? dispatch(m, 0, 1, 'leave-first-bloom-unserved') : [];
    for (let index = 0; index < 2; index++) {
      if (m.swarms[index].mode === 'home') return dispatch(m, index, index, 'work-root-then-overstay');
    }
    return [];
  }
  function normal(m) {
    // A publicly visible distant field leaves time to observe and redirect the actual flight.
    // No arrival is invented if browser feedback instead observes that this flight has finished.
    if (demonstrationFlight === null) return dispatch(m, 0, 2, 'demonstration-outbound');
    if (demonstrationRetarget === null) {
      need(m.swarms[0].mode === 'flying' && m.swarms[0].flight.id === demonstrationFlight,
        'Initial flight already arrived before the ordinary retarget; no mid-flight claim can be made');
      return dispatch(m, 0, 0, 'demonstration-retarget');
    }
    // Return as soon as a real assignment finishes, or while a conservative home reserve remains.
    for (const g of m.swarms) {
      if (g.mode === 'home' || g.assignment === 'hive') continue;
      const f = m.fields.find(field => field.id === g.assignment);
      if (f.completed) return recall(m, g.index, 'completed-assignment');
      if (g.homeReserveTicks <= 180) return recall(m, g.index, 'preserve-return-reserve');
    }
    for (const g of m.swarms) {
      if (g.mode !== 'home' || g.staminaTicks !== g.staminaCapacityTicks) continue;
      const choices = m.fields.filter(f => !f.completed && f.unlocked && m.tick < f.closeTick
        && f.openTick <= m.tick + travelTicks(g, f) + 240).map(f => ({ field: f,
          assigned: m.swarms.filter(other => other.mode !== 'home' && other.assignment === f.id).length }))
        .filter(choice => choice.assigned === 0 || choice.field.requiredWorkTicks - choice.field.workTicks > 120);
      choices.sort((a, b) => a.assigned - b.assigned || a.field.closeTick - b.field.closeTick || a.field.index - b.field.index);
      if (choices.length) return dispatch(m, g.index, choices[0].field.index, 'rested-current-window');
    }
    return [];
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
  pilot.prime = prime; pilot.keys = pilot;
  pilot.diagnostics = () => clone({ policy, demonstrationFlight, demonstrationRetarget, ...stats }); return pilot;
}
const defaultPilot = createPilot();
export const keys = (state, context) => defaultPilot(state, context);
export const prime = state => defaultPilot.prime(state);
export function assertPublicBoard(m, assert) {
  shape(m); assert.equal(m.elapsed, m.tick / 60); assert.equal(m.remaining, Math.max(0, (m.deadlineTick - m.tick) / 60));
  assert.equal(m.commandCount, m.commandReceipts.length); assert.equal(m.flightCount, m.commandCount);
  assert.equal(m.blockedCommands, m.blockedReceipts.length); assert.equal(m.navigationCount, m.navigationReceipts.length);
  assert.equal(m.inventory.totalBees, 12); assert.equal(m.inventory.swarmCount, 2); assert.equal(m.inventory.idsExactlyOnce, true);
  const allIds = ['homeIds', 'flyingIds', 'fieldIds'].flatMap(key => m.inventory[key]);
  assert.deepEqual([...allIds].sort(), ['B1', 'B2']); assert.equal(new Set(allIds).size, 2);
  assert.equal(Object.values(m.inventory.bees).reduce((n, value) => n + value, 0), 12);
  assert.equal(m.inventory.errorWorkTicks, 0);
  let groupWork = 0, fieldWork = 0;
  for (const g of m.swarms) {
    assert.equal(g.beeCount, 6); assert.equal(g.staminaTicks, g.staminaCapacityTicks - g.awayTicks + g.recoveredTicks);
    assert.ok(Number.isSafeInteger(g.staminaTicks) && g.staminaTicks >= 0 && g.staminaTicks <= 1800);
    assert.equal(g.workTicks, g.contributions.reduce((n, value) => n + value, 0)); groupWork += g.workTicks;
    assert.equal(g.remainingAwaySeconds, g.staminaTicks / 60); assert.equal(g.homeReserveTicks, g.staminaTicks - g.directHomeTicks);
    assert.ok(Number.isFinite(g.x) && Number.isFinite(g.y)); assert.ok(m.inventory[g.mode + 'Ids'].includes(g.id));
    if (g.mode === 'flying') { assert.ok(g.flight && g.fieldId === null); assert.equal(g.assignment, g.flight.destination.id); }
    else {
      assert.equal(g.flight, null); const destination = g.mode === 'home' ? m.hive : m.fields.find(f => f.id === g.fieldId);
      assert.equal(g.assignment, destination.id); assert.equal(g.x, destination.x); assert.equal(g.y, destination.y);
    }
  }
  for (const f of m.fields) {
    assert.equal(f.workTicks, f.contributions.reduce((n, value) => n + value, 0)); fieldWork += f.workTicks;
    assert.ok(Number.isSafeInteger(f.workTicks) && f.workTicks >= 0 && f.workTicks <= f.requiredWorkTicks);
    assert.deepEqual(f.contributions, m.swarms.map(g => g.contributions[f.index]));
    assert.equal(f.completed, f.workTicks === f.requiredWorkTicks);
    assert.equal(f.unlocked, f.prerequisites.every(id => m.fields.find(item => item.id === id).completed));
    assert.equal(f.bloomPhase, m.tick < f.openTick ? 'unopened' : m.tick < f.closeTick ? 'open' : 'closed');
  }
  assert.equal(fieldWork, groupWork); assert.equal(m.inventory.totalCreditedWorkTicks, fieldWork); assert.equal(m.inventory.totalSwarmWorkTicks, groupWork);
  if (m.lastInterval) { assert.equal(m.lastInterval.tick, m.tick); assert.equal(m.lastInterval.fromTick, m.tick - 1); assert.deepEqual(m.lastInterval.inventoryAfter, m.inventory); }
}
export function assertProgress({ after }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won');
  assert.deepEqual(m.failures, []); assert.ok(m.fields.every(f => f.completed)); assert.ok(m.swarms.every(g => g.mode === 'home'));
  assert.equal(m.inventory.totalCreditedWorkTicks, m.fields.reduce((n, f) => n + f.requiredWorkTicks, 0));
  assert.equal(m.completionReceipts.length, m.fields.length);
  assert.ok(m.commandReceipts.some(r => r.action === 'retarget' && r.before.mode === 'flying'
    && r.before.assignment !== r.destinationId && r.before.x === r.after.x && r.before.y === r.after.y), 'A genuine in-flight retarget is observed');
  assert.ok(m.arrivalReceipts.some(r => r.destinationId === 'hive'), 'An actual return must precede victory');
  assert.ok(m.commandReceipts.some(r => r.key === 'a' && r.before.mode === 'home'
    && m.restCompleteReceipts.some(rest => rest.swarmId === r.swarmId && rest.tick <= r.fromTick)),
    'A swarm must actually recover at home before a later departure');
}
export function assertRetry({ after, initial }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(m.phase, 'playing'); assert.ok(m.tick >= 0 && m.tick < 120);
  for (const key of ['swarmCursor', 'fieldCursor', 'swarms', 'fields', 'inventory', 'commandCount', 'flightCount', 'blockedCommands',
    'navigationCount', 'commandReceipts', 'blockedReceipts', 'navigationReceipts', 'arrivalReceipts', 'completionReceipts', 'unlockReceipts', 'restCompleteReceipts']) {
    assert.ok(same(m[key], initial.model[key]), 'Fresh retry restores ' + key);
  }
}
