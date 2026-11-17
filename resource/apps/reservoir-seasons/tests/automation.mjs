// Public forecast planning and ordinary receipt-acknowledged keys only; no Model import or private author plan.
export const budgets = { maxWebGLDrawCalls: 1 };
export const lossPolicies = ['zero-first-season', 'two-dry-seasons', 'farms-unserved'];
export const lossReasons = ['resident-floor', 'river-dry-streak', 'annual-target'];
const need = (ok, message) => { if (!ok) throw Error(message); };
const clone = value => structuredClone(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sum = values => values.reduce((a, b) => a + b, 0);
function shape(m) {
  need(m && m.seasons?.length === 4 && m.planUnits?.length === 3 && m.deliveredUnits?.length === 3, 'Actual public four-season reservoir required');
  need(m.physics.tickHz === 60 && m.physics.allocationQuantumUnits === 5 && m.physics.releaseDurationTicks === 480,
    'Published water quantum and metering duration required');
}
function realNeutral(m) {
  return m.lastInput && !m.lastInput.cancelled && !m.inputState.quarantined && Math.abs(m.lastInput.x) < .45 && Math.abs(m.lastInput.y) < .45
    && !m.lastInput.a && !m.lastInput.b && m.inputState.aArmed && m.inputState.bArmed && m.inputState.navigationHeldTicks === 0;
}
function planPublicForecast(m) {
  const limits = { expandedStates: 20000, transitions: 2000000 }, counters = { expandedStates: 0, transitions: 0, memoHits: 0, necessaryPrunes: 0 };
  const target = m.annualDemandUnits.map((value, i) => Math.ceil(value * m.minimumFulfillmentPercent[i] / 500) * 5);
  const suffixDemand = Array.from({ length: 5 }, () => [0, 0, 0]);
  for (let season = 3; season >= 0; season--) suffixDemand[season] = suffixDemand[season + 1].map((value, i) => value + m.seasons[season].demandUnits[i]);
  const failed = new Set();
  function visit(seasonIndex, prepared, delivered, dryStreak) {
    const clipped = delivered.map((value, i) => Math.min(value, target[i]));
    const key = [seasonIndex, prepared, ...clipped, dryStreak].join(':');
    if (failed.has(key)) { counters.memoHits++; return null; }
    need(++counters.expandedStates <= limits.expandedStates, 'Public forecast state budget exceeded; preserve the first planning failure');
    const deficit = target.map((value, i) => Math.max(0, value - delivered[i]));
    const optimisticWater = prepared + sum(m.seasons.slice(seasonIndex + 1).map(season => season.inflowUnits));
    if (delivered.some((value, i) => value + suffixDemand[seasonIndex][i] < target[i]) || sum(deficit) > optimisticWater) {
      counters.necessaryPrunes++; failed.add(key); return null;
    }
    const season = m.seasons[seasonIndex], minimumResidents = Math.ceil(season.residentFloorUnits / 5) * 5;
    for (let residents = season.demandUnits[0]; residents >= minimumResidents; residents -= 5) {
      for (let river = season.demandUnits[2]; river >= 0; river -= 5) {
        for (let farms = season.demandUnits[1]; farms >= 0; farms -= 5) {
          need(++counters.transitions <= limits.transitions, 'Public forecast transition budget exceeded; preserve the first planning failure');
          const allocation = [residents, farms, river], total = sum(allocation), nextDry = river === 0 ? dryStreak + 1 : 0;
          if (total > prepared || nextDry >= 2) continue;
          const after = delivered.map((value, i) => value + allocation[i]), carry = prepared - total;
          const row = { seasonIndex, planUnits: allocation, predictedPreparedStorageUnits: prepared, predictedCarryOutUnits: carry,
            predictedDeliveredAfterUnits: after, predictedDryStreakAfter: nextDry };
          if (seasonIndex === 3) {
            if (after.every((value, i) => value >= target[i])) return [row];
          } else {
            const forecast = m.seasons[seasonIndex + 1];
            const nextPrepared = Math.min(m.capacityUnits, carry - Math.min(forecast.evaporationUnits, carry) + forecast.inflowUnits);
            const remainder = visit(seasonIndex + 1, nextPrepared, after, nextDry);
            if (remainder) return [row, ...remainder];
          }
        }
      }
    }
    failed.add(key); return null;
  }
  const plan = visit(0, m.storedUnits, m.deliveredUnits, m.riverDryStreak);
  need(plan && plan.length === 4, 'No feasible allocation found within the declared public forecast budget');
  return { plan, limits, counters, targetUnits: target,
    scope: 'Finite seasonal arithmetic from the four visible forecasts, five-unit allocations and public obligations; predicted plan only, not actual game observations.' };
}
export function createPilot({ mode = 'record', policy = mode === 'loss' ? 'zero-first-season' : 'normal' } = {}) {
  need(policy === 'normal' || lossPolicies.includes(policy), 'Unknown reservoir policy');
  let identity = null, lastTick = -1, primed = false, pending = null, plan = null, prologue = 0;
  let stats = { prime: null, issued: [], acknowledged: [], prologueReceiptIds: [] };
  function reset(m) {
    identity = `${m.level}:${m.seed}`; lastTick = m.tick; primed = false; pending = null; plan = null; prologue = 0;
    stats = { prime: null, issued: [], acknowledged: [], prologueReceiptIds: [] };
  }
  function prime(state) {
    const m = state?.model; shape(m);
    need(m.tick === 0 && m.seasonIndex === 0 && m.stage === 'planning' && m.commits.length === 0
      && m.actionReceipts.length === 0 && sum(m.planUnits) === 0, 'Prime only the untouched actual initial public board');
    reset(m); const began = performance.now();
    if (policy === 'normal') { const result = planPublicForecast(m); plan = clone(result.plan); stats.prime = result; }
    else {
      plan = m.seasons.map((season, seasonIndex) => ({ seasonIndex, planUnits: policy === 'zero-first-season' ? [0, 0, 0]
        : policy === 'two-dry-seasons' ? [season.residentFloorUnits, 0, 0] : [season.demandUnits[0], 0, season.demandUnits[2]] }));
      stats.prime = { plan: clone(plan), limits: { expandedStates: 0, transitions: 0 }, counters: { expandedStates: 0, transitions: 0 },
        scope: 'Direct public negative policy; actual deliveries and losses remain to be observed.' };
    }
    stats.prime.elapsedMs = performance.now() - began; primed = true; return clone(stats.prime);
  }
  function issue(m, key, intent) {
    need(!pending && stats.issued.length < 240, 'One acknowledged ordinary key at a time, bounded to 240 keys');
    pending = { key, intent: clone(intent), tick: m.tick, seasonIndex: m.seasonIndex, cursorBefore: m.cursor,
      actionCount: m.actionReceipts.length, planBefore: m.planUnits.slice(), phase: 'press', releaseTick: null };
    stats.issued.push(clone(pending)); return [key];
  }
  function select(m, target) {
    return m.cursor === target ? null : issue(m, target > m.cursor ? 'ArrowRight' : 'ArrowLeft',
      { kind: 'navigate', cursor: m.cursor + Math.sign(target - m.cursor) });
  }
  function add(m, category, role) {
    return select(m, category) || issue(m, 'Space', { kind: 'action', action: 'add', categoryIndex: category, role });
  }
  function acknowledge(m) {
    const p = pending;
    if (p.phase === 'release') {
      if (m.tick <= p.releaseTick || !realNeutral(m)) return true;
      pending = null; return false;
    }
    if (m.tick <= p.tick) return true;
    let observed = null;
    if (p.intent.kind === 'navigate' && m.cursor === p.intent.cursor) {
      const direction = Math.sign(p.intent.cursor - p.cursorBefore);
      need(m.stage === 'planning' && m.seasonIndex === p.seasonIndex && m.inputState.navigationDirection === direction
        && m.inputState.navigationHeldTicks >= 1 && m.inputState.navigationHeldTicks < 24,
        'One initial held navigation must reach the actually observed next selection');
      need(m.actionReceipts.length === p.actionCount, 'Selection must not create a water action');
      observed = { kind: 'navigation-observation', fromObservedTick: p.tick, observedTick: m.tick, cursorBefore: p.cursorBefore,
        cursorAfter: m.cursor, actualLastInput: clone(m.lastInput), actualInputState: clone(m.inputState) };
    } else if (p.intent.kind === 'action' && m.actionReceipts.length > p.actionCount) {
      const row = m.actionReceipts[p.actionCount];
      need(m.actionReceipts.length === p.actionCount + 1 && row.accepted && row.seasonIndex === p.seasonIndex
        && row.kind === p.intent.action && row.categoryIndex === p.intent.categoryIndex && row.tick > p.tick,
        'One actual accepted receipt must acknowledge the requested plan operation');
      need(same(row.planBefore, p.planBefore) && row.storedBefore === row.storedAfter, 'Plan operations preserve real stored water');
      if (p.intent.role?.startsWith('prologue-')) {
        need(row.seasonIndex === 0 && m.commits.length === 0, 'Actual reversible edits precede the first commit');
        stats.prologueReceiptIds.push(row.id); prologue++;
        if (prologue === 4) need(same(row.planAfter, [0, 0, 0]) && row.undoDepthAfter === 0, 'Both actual LIFO undos restore an empty plan');
      }
      observed = { kind: 'action-receipt', receipt: clone(row) };
    }
    if (!observed) { need(m.tick - p.tick <= 60, 'Ordinary key lacks an actual acknowledgement within sixty ticks'); return true; }
    stats.acknowledged.push({ issuedTick: p.tick, observedTick: m.tick, key: p.key, ...observed });
    p.phase = 'release'; p.releaseTick = m.tick; return true;
  }
  function edit(m) {
    if (policy === 'normal' && prologue < 4) {
      need(m.seasonIndex === 0 && m.commits.length === 0, 'Reversible edit demonstration belongs only to the first actual season');
      if (prologue < 2) return add(m, prologue, prologue === 0 ? 'prologue-add-residents' : 'prologue-add-farms');
      return issue(m, 'b', { kind: 'action', action: 'undo', categoryIndex: prologue === 2 ? 1 : 0,
        role: prologue === 2 ? 'prologue-undo-farms' : 'prologue-undo-residents' });
    }
    const desired = plan[m.seasonIndex];
    need(desired && sum(desired.planUnits) <= m.storedUnits, 'Current actual prepared storage must afford the intended public allocation');
    if (policy === 'normal') {
      need(m.storedUnits === desired.predictedPreparedStorageUnits, 'Actual season entry must match the visible-forecast arithmetic before editing');
      for (const ledger of m.seasonLedgers) need(same(ledger.deliveredUnits, plan[ledger.seasonIndex].planUnits)
        && ledger.carryOutUnits === plan[ledger.seasonIndex].predictedCarryOutUnits, 'Past actual deliveries must acknowledge the plan before using its next season');
    }
    for (let category = 0; category < 3; category++) {
      need(m.planUnits[category] <= desired.planUnits[category], 'Actual plan must not silently exceed its intended allocation');
      if (m.planUnits[category] < desired.planUnits[category]) return add(m, category, 'allocate-current-season');
    }
    return select(m, 3) || issue(m, 'Space', { kind: 'action', action: 'commit', categoryIndex: null, role: 'commit-current-season' });
  }
  function pilot(state) {
    const m = state?.model; if (!m) return [];
    if (identity !== `${m.level}:${m.seed}` || m.tick < lastTick) reset(m); lastTick = m.tick;
    if (state.phase !== 'playing' || state.paused || m.phase !== 'playing') return [];
    shape(m); need(primed, 'Pilot must be primed from the actual initial public state');
    if (pending && acknowledge(m)) return pending.phase === 'press' ? [pending.key] : [];
    if (m.inputState.quarantined || (m.tick > 0 && !realNeutral(m))) return [];
    return m.stage === 'planning' ? edit(m) : [];
  }
  pilot.prime = prime; pilot.keys = pilot; pilot.diagnostics = () => clone({ policy, prologue, ...stats }); return pilot;
}
const defaultPilot = createPilot();
export const keys = (state, context) => defaultPilot(state, context);
export const prime = state => defaultPilot.prime(state);
export function assertPublicBoard(m, assert) {
  shape(m); assert.equal(m.elapsed, m.tick / 60); assert.equal(m.completedSeasons, m.seasonLedgers.length);
  assert.equal(m.seasonEntries.length, m.seasonIndex + 1);
  const accounted = m.storedUnits + m.totalEvaporationUnits + m.totalOverflowUnits + sum(m.deliveredUnits);
  assert.equal(m.initialStorageUnits + m.totalInflowUnits, accounted); assert.equal(m.inventory.balanceErrorUnits, 0);
  assert.equal(m.inventory.totalAccountedUnits, accounted); assert.deepEqual(m.inventory.deliveredUnits, m.deliveredUnits);
  assert.equal(m.inventory.totalDeliveredUnits, sum(m.deliveredUnits)); assert.equal(m.planTotalUnits, sum(m.planUnits));
  const reserved = m.stage === 'planning' ? sum(m.planUnits) : m.stage === 'releasing' ? sum(m.committedUnits) - sum(m.currentDeliveredUnits) : 0;
  assert.equal(m.reservedUndeliveredUnits, reserved); assert.equal(m.unallocatedStoredUnits, m.storedUnits - reserved);
  assert.ok(Number.isSafeInteger(m.storedUnits) && m.storedUnits >= 0 && m.storedUnits <= m.capacityUnits && reserved >= 0 && reserved <= m.storedUnits);
  assert.equal(m.releaseSecondsRemaining, m.stage === 'releasing' ? (480 - m.releaseAgeTicks) / 60 : 0);
  for (let category = 0; category < 3; category++) {
    assert.ok(Number.isSafeInteger(m.planUnits[category]) && m.planUnits[category] >= 0 && m.planUnits[category] % 5 === 0);
    assert.ok(m.planUnits[category] <= m.seasons[m.seasonIndex].demandUnits[category]);
    const actual = sum(m.seasonLedgers.filter(row => row.seasonIndex < m.seasonIndex).map(row => row.deliveredUnits[category])) + m.currentDeliveredUnits[category];
    assert.equal(m.deliveredUnits[category], actual);
    assert.equal(m.annualTargetsMet[category], actual * 100 >= m.annualDemandUnits[category] * m.minimumFulfillmentPercent[category]);
  }
  if (m.stage === 'planning') { assert.equal(m.committedUnits, null); assert.equal(m.undoStack.length * 5, sum(m.planUnits)); }
  else { assert.deepEqual(m.planUnits, m.committedUnits); assert.equal(m.undoStack.length, 0); }
  for (const row of m.actionReceipts) assert.equal(row.storedBefore, row.storedAfter);
  for (const ledger of m.seasonLedgers) {
    assert.equal(ledger.completedAtTick, ledger.commitFromTick + 480); assert.deepEqual(ledger.deliveredUnits, ledger.plannedUnits);
    assert.equal(ledger.balanceErrorUnits, 0); assert.equal(ledger.carryInUnits + ledger.inflowUnits,
      ledger.actualEvaporationUnits + ledger.overflowUnits + sum(ledger.deliveredUnits) + ledger.carryOutUnits);
  }
  for (let i = 1; i < m.seasonEntries.length; i++) assert.equal(m.seasonEntries[i].carryInUnits, m.seasonLedgers[i - 1].carryOutUnits);
  if (m.lastInterval) { assert.equal(m.lastInterval.tick, m.tick); assert.equal(m.lastInterval.fromTick, m.tick - 1); assert.deepEqual(m.lastInterval.inventoryAfter, m.inventory); }
}
export function assertProgress({ after }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won'); assert.equal(m.stage, 'finished');
  assert.deepEqual(m.failures, []); assert.equal(m.completedSeasons, 4); assert.equal(m.commits.length, 4);
  assert.ok(m.annualTargetsMet.every(Boolean)); assert.ok(m.seasonLedgers.every(row => row.residentFloorMet && row.riverDryStreakAfter < 2));
  assert.equal(m.score, 1000 + sum(m.deliveredUnits));
  const first = m.actionReceipts.slice(0, 4);
  assert.deepEqual(first.map(row => row.kind), ['add', 'add', 'undo', 'undo']); assert.ok(first.every(row => row.accepted && row.seasonIndex === 0));
  assert.deepEqual(first.map(row => row.categoryIndex), [0, 1, 1, 0]); assert.deepEqual(first[3].planAfter, [0, 0, 0]);
  assert.equal(first[3].undoDepthAfter, 0); assert.ok(first[3].tick <= m.commits[0].fromTick);
}
export function assertRetry({ after, initial }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(m.phase, 'playing'); assert.equal(m.stage, 'planning');
  assert.ok(m.tick >= 0 && m.tick < 120);
  for (const key of ['seasonIndex', 'completedSeasons', 'cursor', 'releaseAgeTicks', 'planUnits', 'undoStack', 'committedUnits', 'currentDeliveredUnits',
    'storedUnits', 'totalInflowUnits', 'totalEvaporationUnits', 'totalOverflowUnits', 'deliveredUnits', 'annualTargetsMet', 'riverDryStreak',
    'seasonEntries', 'seasonLedgers', 'actionReceipts', 'commits', 'inventory', 'seasons']) assert.deepEqual(m[key], initial.model[key], 'Retry restores ' + key);
}
