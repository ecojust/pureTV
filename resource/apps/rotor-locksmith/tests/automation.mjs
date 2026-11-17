// Public-observation controller. No Model import, rollout, private route or clock schedule.
export const lossPolicies = ['repeat-wall-contact', 'wait-out-clock', 'keep-key-at-core'];
export const lossReasons = ['durability', 'timeout', 'timeout'];
export const budgets = { seconds: 92, maxObservedTicks: 5400, maxWebGLDrawCalls: 1 };
const clone = value => JSON.parse(JSON.stringify(value));
const modelOf = state => state.model || state;
const equalKeys = (a, b) => a.length === b.length && a.every((key, i) => key === b[i]);
function controlsFor(keys) {
  const a = keys.includes('Space'), b = keys.includes('b');
  return { drive: Number(keys.includes('ArrowRight')) - Number(keys.includes('ArrowLeft')),
    radial: a === b ? 0 : a ? -1 : 1, a, b };
}
function observation(model) {
  return { tick: model.tick, probeRadius: model.probeRadius, driveAngleDegrees: model.driveAngleDegrees,
    hasKey: model.hasKey, mission: model.mission, durability: model.durability, resistance: model.resistance,
    contactCount: model.contactReceipts.length, travelCount: model.travelReceipts.length };
}
function neutral(model) {
  return !!model.lastInput?.fullNeutral && !model.inputState.quarantined && !model.inputState.impactLocked;
}

export function createPilot({ mode = 'record', policy = 'normal' } = {}) {
  if (!['normal', ...lossPolicies].includes(policy)) throw new Error('Unknown public policy: ' + policy);
  let held = [], pending = null, lastObservedTick = null, primedLevel = null;
  const diagnostics = {
    mode, policy, primed: false, calls: 0, requests: [], acknowledgements: [], interruptions: [],
    neutralAcknowledgements: [], terminalObservations: [], repeatedObservationCalls: 0,
    controlScope: 'Current public ring geometry only: select the next radial band, stop radial motion to align its actual gap, release the actual drive before crossing, and repeat on the real return envelope. No future trajectory, Model step, fixed crossing tick or private route is used.',
    alignmentScope: 'The target half-window is min(current effective safe half-width minus3 degrees,18 degrees). Its narrowest authored value is18 degrees, wider than half of the maximum26.4 degree displacement across the ordinary11-tick observation cadence. Actual neutral drive and actual gap position are rechecked before radial movement; this arithmetic is a sampling bound, not a predicted route.',
    outcomeScope: 'Policies are attempted inputs. Outcomes, contacts, key acquisition and extraction are accepted only from actual observed state and permanent receipts.'
  };
  function acknowledge(model) {
    if (!pending || model.tick <= pending.requestedAtTick || !model.lastInput) return;
    const wanted = pending.controls, actual = model.lastInput.effective;
    const matches = ['drive', 'radial', 'a', 'b'].every(key => actual[key] === wanted[key]);
    const isNeutral = pending.keys.length === 0;
    if (matches && (!isNeutral || neutral(model))) {
      const evidence = { requestId: pending.id, observed: observation(model), actualInput: clone(model.lastInput) };
      diagnostics.acknowledgements.push(evidence);
      pending.acknowledgedAtTick = model.tick;
      pending = null;
    } else if (model.inputState.quarantined || model.inputState.impactLocked) {
      diagnostics.interruptions.push({ requestId: pending.id, observed: observation(model), inputState: clone(model.inputState) });
      pending.interruptedAtTick = model.tick;
      pending = null;
    }
  }
  function request(keys, model, reason, target = null) {
    if (!equalKeys(keys, held)) {
      if (pending) {
        diagnostics.interruptions.push({ requestId: pending.id, observed: observation(model), reason: 'Actual state requires a different input before acknowledgement' });
        pending.interruptedAtTick = model.tick;
      }
      held = [...keys];
      pending = { id: diagnostics.requests.length + 1, requestedAtTick: model.tick, keys: [...keys],
        controls: controlsFor(keys), reason, target: target && clone(target), observed: observation(model),
        acknowledgedAtTick: null, interruptedAtTick: null };
      diagnostics.requests.push(pending);
    }
    return [...held];
  }
  function normalKeys(model) {
    const inward = !model.hasKey;
    const candidates = model.rings.filter(ring => inward
      ? model.probeRadius > ring.effectiveInnerRadius
      : model.probeRadius < ring.effectiveOuterRadius);
    candidates.sort((a, b) => inward ? b.radius - a.radius : a.radius - b.radius);
    const ring = candidates[0], radialKey = inward ? 'Space' : 'b';
    if (!ring) return { keys: [radialKey], reason: inward ? 'Current inner corridor to core' : 'Current outer corridor to full extraction' };
    const targetHalfWindow = Math.min(ring.effectiveSafeHalfWidthDegrees - 3, 18);
    if (targetHalfWindow < 13.2) throw new Error('Public gap cannot support the declared observation bound');
    const target = { id: ring.id, offsetDegrees: ring.wrappedGapOffsetDegrees, targetHalfWindow,
      effectiveInnerRadius: ring.effectiveInnerRadius, effectiveOuterRadius: ring.effectiveOuterRadius,
      probeRadiallyInside: ring.probeRadiallyInside, probeAngularlyClear: ring.probeAngularlyClear };
    // Inside a band, preserve its already observed clear angle and finish this
    // crossing. We never turn an occupied ring to chase a narrower center target.
    if (ring.probeRadiallyInside) {
      if (!ring.probeAngularlyClear) return { keys: [], reason: 'Observed occupied band is not clear', target };
      if (model.lastInput?.effective.drive !== 0) return { keys: [], reason: 'Await actual drive release inside band', target };
      return { keys: [radialKey], reason: 'Continue the actual occupied-band crossing', target };
    }
    if (Math.abs(ring.wrappedGapOffsetDegrees) > targetHalfWindow) {
      const sign = -Math.sign(ring.wrappedGapOffsetDegrees) * Math.sign(ring.gearRatio);
      return { keys: [sign > 0 ? 'ArrowRight' : 'ArrowLeft'], reason: 'Align the next actual ring from the current clear corridor', target };
    }
    // This is an observation acknowledgement, not a timed assumption that an
    // earlier Arrow key has already released. Re-evaluate the gap after release.
    if (model.lastInput?.effective.drive !== 0 || held.some(key => key.startsWith('Arrow'))) {
      return { keys: [], reason: 'Release aligned drive and await actual zero drive', target };
    }
    return { keys: [radialKey], reason: 'Current gap is aligned and actual drive is zero', target };
  }
  function pilot(state) {
    const model = modelOf(state);
    diagnostics.calls++;
    acknowledge(model);
    if (model.phase !== 'playing') {
      diagnostics.terminalObservations.push({ ...observation(model), phase: model.phase,
        reason: model.terminal?.reason || null, pendingRequestId: pending?.id || null });
      held = [];
      return [];
    }
    if (state.paused || (state.model && state.phase !== 'playing')) return request([], model, 'Host menu or pause');
    if (primedLevel !== null && primedLevel !== model.level) throw new Error('Pilot observed an unexpected scenario change');
    if (lastObservedTick === model.tick) {
      diagnostics.repeatedObservationCalls++;
      return [...held];
    }
    lastObservedTick = model.tick;
    if (neutral(model) && diagnostics.neutralAcknowledgements.at(-1)?.tick !== model.tick) {
      diagnostics.neutralAcknowledgements.push({ tick: model.tick, inputMode: model.lastInput.mode });
    }
    if (model.inputState.quarantined || model.inputState.impactLocked) return request([], model, 'Release all actual controls for the observed lock');
    if (pending) return [...held];
    if (policy === 'wait-out-clock') return request([], model, 'No operation; actual clock continues');
    if (policy === 'repeat-wall-contact') return request(['Space'], model, 'Attempt inward again only after observed lock clearance');
    if (policy === 'keep-key-at-core' && model.hasKey) return request(['Space'], model, 'Actual key is held at the core; no extraction input');
    const choice = normalKeys(model);
    return request(choice.keys, model, choice.reason, choice.target);
  }
  pilot.prime = state => {
    const model = modelOf(state);
    if (model.tick !== 0 || model.phase !== 'playing') throw new Error('Prime requires an actual unadvanced initial observation');
    if (primedLevel !== null) throw new Error('Pilot was already primed');
    primedLevel = model.level;
    diagnostics.primed = true;
    diagnostics.initialObservation = observation(model);
    return { level: model.level, scenarioId: model.scenarioId, policy, observedTick: model.tick,
      feedbackOnly: true, modelAdvanced: false, plannedInputSchedule: false };
  };
  pilot.keys = pilot;
  pilot.diagnostics = () => clone({ ...diagnostics, heldKeys: held, pendingRequestId: pending?.id || null });
  return pilot;
}

// Shared QA and recording call module-level exports. Each explicit prime is a
// new controller instance over the supplied real tick0 observation, never a Model reset.
let defaultPilot = null;
export function prime(state) {
  const next = createPilot({ mode: 'shared', policy: 'normal' });
  const preparation = next.prime(state);
  defaultPilot = next;
  return preparation;
}
export function keys(state, meta) {
  if (!defaultPilot) throw new Error('Shared automation requires an explicit prime from a real initial observation');
  return defaultPilot(state, meta);
}
export function diagnostics() {
  return defaultPilot ? defaultPilot.diagnostics() : null;
}

export function assertPublicBoard(model, assert) {
  const p = model.physics, tolerance = p.independentNumericComparisonTolerance;
  const near = (actual, expected, name) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance, name);
  assert.equal(model.identity.slug, 'rotor-locksmith');
  assert.equal(model.identity.gameId, 38); assert.equal(model.width, 960); assert.equal(model.height, 540);
  assert.equal(model.schemaVersion, 1); assert.ok([1, 2, 3].includes(model.level));
  assert.equal(model.difficulty, model.level - 1); assert.equal(model.scenarioId, model.scenario.id);
  assert.equal(model.levelName, model.scenario.name); assert.equal(model.rings.length, 3);
  assert.ok(Number.isInteger(model.tick) && model.tick >= 0 && model.tick <= p.timeBudgetTicks);
  near(model.elapsed, model.tick / p.ticksPerSecond, 'Actual fixed-tick elapsed time');
  assert.equal(model.remainingTicks, p.timeBudgetTicks - model.tick);
  near(model.remainingSeconds, model.remainingTicks / p.ticksPerSecond, 'Actual remaining time');
  assert.ok(model.probeRadius >= p.coreRadius && model.probeRadius <= p.exitRadius);
  assert.ok(Number.isFinite(model.driveAngleDegrees)); assert.equal(typeof model.hasKey, 'boolean');
  assert.ok(Number.isInteger(model.durability) && model.durability >= 0 && model.durability <= p.initialDurability);
  assert.equal(model.durability + model.resistance, p.initialDurability);
  near(model.radialSpeed, p.baseRadialSpeed - p.resistanceSpeedPenalty * model.resistance, 'Persistent resistance changes real speed');
  assert.equal(model.score, (model.hasKey ? p.keyScore : 0) + (model.phase === 'won' ? p.winScore : 0));
  assert.equal(model.mission, model.phase === 'won' ? 'complete' : model.hasKey ? 'return' : 'approach');
  const size = model.hasKey ? p.keyProbe : p.emptyProbe;
  assert.equal(model.probeEnvelope.radialHalfLength, size.radialHalfLength);
  assert.equal(model.probeEnvelope.angularHalfWidthDegrees, size.angularHalfWidthDegrees);
  near(model.probeEnvelope.innerRadius, model.probeRadius - size.radialHalfLength, 'Actual carried-envelope inner edge');
  near(model.probeEnvelope.outerRadius, model.probeRadius + size.radialHalfLength, 'Actual carried-envelope outer edge');
  for (const [i, ring] of model.rings.entries()) {
    const config = model.scenario.rings[i]; assert.equal(ring.id, config.id);
    near(ring.unwrappedAngleDegrees, config.initialAngleDegrees + config.gearRatio * model.driveAngleDegrees, 'Rigid signed gear coupling');
    assert.ok(ring.angleDegrees >= 0 && ring.angleDegrees < 360);
    near(ring.effectiveInnerRadius, config.radius - config.halfThickness - size.radialHalfLength + p.radialBoundaryMargin, 'Current expanded inner band');
    near(ring.effectiveOuterRadius, config.radius + config.halfThickness + size.radialHalfLength - p.radialBoundaryMargin, 'Current expanded outer band');
    near(ring.effectiveSafeHalfWidthDegrees, config.gapHalfWidthDegrees - size.angularHalfWidthDegrees + p.angularBoundaryMarginDegrees, 'Current angular clearance');
  }
  for (const field of ['contactReceipts', 'travelReceipts']) {
    assert.ok(Array.isArray(model[field]));
    for (const [i, receipt] of model[field].entries()) {
      assert.equal(receipt.id, i + 1); assert.ok(receipt.tick > 0 && receipt.tick <= model.tick);
      assert.ok(receipt.fraction >= 0 && receipt.fraction <= 1);
      if (i) assert.ok(receipt.tick >= model[field][i - 1].tick);
    }
  }
  assert.equal(model.contactReceipts.length, model.resistance);
  for (const receipt of model.contactReceipts) {
    assert.equal(receipt.durabilityAfter, receipt.durabilityBefore - 1);
    assert.equal(receipt.resistanceAfter, receipt.resistanceBefore + 1);
    assert.equal(receipt.impactLockedAfter, true);
  }
  if (model.tick > 0) {
    assert.equal(model.lastInput.tick, model.tick); assert.equal(model.lastStep.fromTick, model.tick - 1);
    assert.equal(model.lastStep.toTick, model.tick);
    assert.deepEqual(model.lastTravelReceipts, model.travelReceipts.filter(receipt => receipt.tick === model.tick));
    assert.equal(model.lastContact?.id || null, model.lastStep.contactReceiptId);
    assert.equal(model.lastStep.probeRadiusAfter, model.probeRadius);
    assert.equal(model.lastStep.driveAngleAfter, model.driveAngleDegrees);
    assert.equal(model.lastStep.terminalAfter, model.terminal?.reason || null);
  }
  if (model.phase === 'playing') { assert.equal(model.terminal, null); assert.equal(model.lostReason, null); }
  else {
    assert.equal(model.terminal.tick, model.tick);
    assert.equal(model.terminal.probeRadius, model.probeRadius);
    assert.equal(model.terminal.driveAngleDegrees, model.driveAngleDegrees);
    assert.equal(model.terminal.hasKey, model.hasKey);
    assert.equal(model.lostReason, model.phase === 'lost' ? model.terminal.reason : null);
  }
}

export function assertProgress({ before, after }, assert) {
  const model = modelOf(after); assertPublicBoard(model, assert);
  assert.equal(after.phase, 'won'); assert.equal(model.phase, 'won'); assert.equal(model.terminal.reason, 'key-extracted');
  assert.equal(model.hasKey, true); assert.equal(model.probeRadius, model.physics.exitRadius);
  assert.ok(model.durability > 0); assert.equal(model.score, model.physics.keyScore + model.physics.winScore);
  assert.ok(model.elapsed >= 30 && model.elapsed <= 90);
  const acquired = model.travelReceipts.filter(receipt => receipt.kind === 'key-acquired');
  const extracted = model.travelReceipts.filter(receipt => receipt.kind === 'key-extracted');
  assert.equal(acquired.length, 1); assert.equal(extracted.length, 1);
  assert.ok(acquired[0].tick < extracted[0].tick);
  for (const ring of model.scenario.rings) for (const boundary of ['inner', 'outer']) {
    assert.ok(model.travelReceipts.some(receipt => receipt.kind === 'boundary' && receipt.ringId === ring.id
      && receipt.boundary === boundary && receipt.direction === -1 && receipt.hasKeyBefore === false));
    assert.ok(model.travelReceipts.some(receipt => receipt.kind === 'boundary' && receipt.ringId === ring.id
      && receipt.boundary === boundary && receipt.direction === 1 && receipt.hasKeyBefore === true));
  }
  if (before) assert.equal(modelOf(before).scenarioId, model.scenarioId);
}

export function assertRetry({ after, initial }, assert) {
  const model = modelOf(after), origin = modelOf(initial); assertPublicBoard(model, assert);
  assert.equal(after.phase, 'playing'); assert.equal(model.phase, 'playing');
  assert.equal(model.level, origin.level); assert.deepEqual(model.scenario, origin.scenario);
  assert.deepEqual(model.physics, origin.physics); assert.equal(model.seed, origin.seed);
  assert.ok(model.tick >= 0 && model.tick < model.physics.ticksPerSecond * 2, 'Only a short actual reset prefix');
  assert.equal(model.probeRadius, model.physics.startRadius); assert.equal(model.driveAngleDegrees, 0);
  assert.equal(model.hasKey, false); assert.equal(model.mission, 'approach');
  assert.equal(model.durability, model.physics.initialDurability); assert.equal(model.resistance, 0); assert.equal(model.score, 0);
  assert.deepEqual(model.contactReceipts, []); assert.deepEqual(model.travelReceipts, []);
  assert.equal(model.terminal, null); assert.equal(model.lostReason, null);
}
