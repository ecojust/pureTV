/* Rotor Locksmith: public continuous geometry, one fixed tick and detached receipts. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PureModel = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PHYSICS = {
    ticksPerSecond: 60, timeBudgetTicks: 5400,
    startRadius: 210, coreRadius: 18, exitRadius: 210,
    initialDurability: 4, baseRadialSpeed: 7.5, resistanceSpeedPenalty: 0.5,
    ringHalfThickness: 5,
    emptyProbe: { radialHalfLength: 2, angularHalfWidthDegrees: 2 },
    keyProbe: { radialHalfLength: 4, angularHalfWidthDegrees: 5 },
    neutralAxisThreshold: 0.35, driveAxisThreshold: 0.55,
    radialBoundaryMargin: 1e-9, angularBoundaryMarginDegrees: 1e-9,
    independentNumericComparisonTolerance: 1e-8, keyScore: 100, winScore: 1000
  };
  const LEVELS = [
    ['brass-triad', '黄铜三联', 36, [[180, 38, 90, 1], [126, 36, 210, -1], [72, 34, 300, 2]]],
    ['countergear-room', '反向齿室', 42, [[184, 34, 225, 1], [128, 32, 60, 2], [68, 30, 150, -2]]],
    ['triple-core', '三倍锁核', 48, [[188, 30, 315, 1], [124, 28, 180, -2], [60, 26, 45, 3]]]
  ];
  const BUTTONS = ['a', 'b', 'aPressed', 'bPressed', 'start', 'select',
    'startPressed', 'selectPressed', 'confirm', 'retry', 'cancelled'];
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const zero = value => value === 0 ? 0 : value;
  const wrap = value => zero((value % 360 + 360) % 360);
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      for (const item of Object.values(value)) freeze(item);
      Object.freeze(value);
    }
    return value;
  }
  const immutable = value => freeze(JSON.parse(JSON.stringify(value)));
  function envelope(physics, hasKey, radius) {
    const size = hasKey ? physics.keyProbe : physics.emptyProbe;
    return { ...size, innerRadius: radius - size.radialHalfLength, outerRadius: radius + size.radialHalfLength };
  }
  function band(ring, size, physics) {
    return {
      effectiveInnerRadius: ring.radius - ring.halfThickness - size.radialHalfLength + physics.radialBoundaryMargin,
      effectiveOuterRadius: ring.radius + ring.halfThickness + size.radialHalfLength - physics.radialBoundaryMargin,
      effectiveSafeHalfWidthDegrees: ring.gapHalfWidthDegrees - size.angularHalfWidthDegrees + physics.angularBoundaryMarginDegrees
    };
  }
  function component(angle, width) {
    const k = zero(Math.floor((angle + width) / 360));
    return angle >= 360 * k - width && angle <= 360 * k + width ? k : null;
  }
  function refresh(state) {
    const p = state.physics;
    state.elapsed = state.tick / p.ticksPerSecond;
    state.remainingTicks = p.timeBudgetTicks - state.tick;
    state.remainingSeconds = state.remainingTicks / p.ticksPerSecond;
    state.radialSpeed = p.baseRadialSpeed - p.resistanceSpeedPenalty * state.resistance;
    state.probeEnvelope = immutable(envelope(p, state.hasKey, state.probeRadius));
    state.rings = immutable(state.scenario.rings.map(ring => {
      const bounds = band(ring, state.probeEnvelope, p);
      const angle = ring.initialAngleDegrees + ring.gearRatio * state.driveAngleDegrees;
      return { ...ring, unwrappedAngleDegrees: angle, angleDegrees: wrap(angle), ...bounds,
        wrappedGapOffsetDegrees: zero(wrap(angle + 180) - 180),
        probeAngularlyClear: component(angle, bounds.effectiveSafeHalfWidthDegrees) !== null,
        probeRadiallyInside: bounds.effectiveInnerRadius < state.probeRadius && state.probeRadius < bounds.effectiveOuterRadius };
    }));
    state.message = state.phase === 'won' ? '钥匙完整带出，锁芯开启！'
      : state.phase === 'lost' ? (state.lostReason === 'durability' ? '探头耐久耗尽' : '时间耗尽')
      : state.inputState.quarantined ? '松开全部操作，确认准备'
      : state.inputState.impactLocked ? '碰壁制动：松开全部操作后再试'
      : state.hasKey ? '钥匙已取得：按住 B 完整退回出口' : '左右拨转外环，按住 A 推进；B 退回';
  }
  function create(seed, difficulty) {
    seed = finite(seed) ? Math.trunc(seed) : 738;
    difficulty = finite(difficulty) ? clamp(Math.trunc(difficulty), 0, 2) : 0;
    const row = LEVELS[difficulty];
    const scenario = immutable({ id: row[0], name: row[1], outerRateDegreesPerSecond: row[2],
      rings: row[3].map((values, i) => ({ id: ['outer', 'middle', 'inner'][i], radius: values[0],
        halfThickness: 5, gapHalfWidthDegrees: values[1], initialAngleDegrees: values[2], gearRatio: values[3] })) });
    const state = {
      width: 960, height: 540, schemaVersion: 1,
      identity: immutable({ gameId: 38, name: '旋环锁匠', englishName: 'Rotor Locksmith', slug: 'rotor-locksmith',
        packageId: 'com.ecojust.rotorlocksmithtv', versionName: '0.1.0', versionCode: 1, seed, actionCount: 2 }),
      physics: immutable(PHYSICS), scenario, seed, difficulty, level: difficulty + 1,
      levelName: scenario.name, scenarioId: scenario.id, phase: 'playing', mission: 'approach',
      tick: 0, elapsed: 0, remainingTicks: 5400, remainingSeconds: 90,
      probeRadius: 210, driveAngleDegrees: 0, hasKey: false, durability: 4, resistance: 0, radialSpeed: 7.5,
      score: 0, lostReason: null, message: '', terminal: null, events: [],
      inputState: { cancelEpoch: null, quarantined: true, impactLocked: false },
      rings: [], probeEnvelope: null, contactReceipts: [], travelReceipts: [],
      lastInput: null, lastStep: null, lastContact: null, lastTravelReceipts: []
    };
    refresh(state);
    return state;
  }

  function inputStep(state, input, tick) {
    input = input && typeof input === 'object' ? input : {};
    const own = key => Object.prototype.hasOwnProperty.call(input, key);
    const valid = key => !own(key) || finite(input[key]);
    const raw = {};
    for (const key of ['x', 'y', 'menuDelta', 'cancelEpoch']) raw[key] = finite(input[key]) ? input[key] : null;
    for (const key of BUTTONS) raw[key] = input[key] === true;
    const x = finite(input.x) ? clamp(input.x, -1, 1) : 0;
    const y = finite(input.y) ? clamp(input.y, -1, 1) : 0;
    const menuDelta = finite(input.menuDelta) ? input.menuDelta : 0;
    const axesValid = valid('x') && valid('y'), menuDeltaValid = valid('menuDelta');
    const cancelEpoch = finite(input.cancelEpoch) ? Math.floor(Math.max(0, input.cancelEpoch)) : 0;
    const latch = state.inputState, epochChanged = cancelEpoch !== latch.cancelEpoch;
    const quarantinedBefore = latch.quarantined, impactLockedBefore = latch.impactLocked;
    const fullNeutral = axesValid && Math.abs(x) <= state.physics.neutralAxisThreshold
      && Math.abs(y) <= state.physics.neutralAxisThreshold && menuDeltaValid && menuDelta === 0
      && BUTTONS.every(key => !raw[key]);
    const a = raw.a || raw.aPressed, b = raw.b || raw.bPressed;
    const requested = { drive: axesValid && Math.abs(x) >= state.physics.driveAxisThreshold ? Math.sign(x) : 0,
      radial: a === b ? 0 : a ? -1 : 1, a, b };
    latch.cancelEpoch = cancelEpoch;
    if (epochChanged || raw.cancelled) latch.quarantined = true;
    let mode = 'active', neutralAcknowledged = false;
    if (latch.quarantined || latch.impactLocked) {
      if (fullNeutral) {
        latch.quarantined = false; latch.impactLocked = false;
        mode = 'neutral_ack'; neutralAcknowledged = true;
      } else mode = latch.quarantined ? 'quarantine' : 'impact_lock';
    }
    const effective = mode === 'active' ? { ...requested } : { drive: 0, radial: 0, a: false, b: false };
    state.lastInput = immutable({ tick, raw, x, y, menuDelta, axesValid, menuDeltaValid, cancelEpoch, epochChanged,
      fullNeutral, mode, quarantinedBefore, quarantinedAfter: latch.quarantined, impactLockedBefore,
      impactLockedAfterInput: latch.impactLocked, neutralAcknowledged, requested, effective });
    return state.lastInput;
  }

  function interval(start, end, startIncluded, endIncluded) {
    if (start > end || (start === end && !(startIncluded && endIncluded))) return null;
    return { start: zero(start), end: zero(end), startIncluded, endIncluded };
  }
  function intersect(a, b) {
    if (!a || !b) return null;
    const start = Math.max(a.start, b.start), end = Math.min(a.end, b.end);
    const startIncluded = (start !== a.start || a.startIncluded) && (start !== b.start || b.startIncluded);
    const endIncluded = (end !== a.end || a.endIncluded) && (end !== b.end || b.endIncluded);
    return interval(start, end, startIncluded, endIncluded);
  }
  function radialInterval(radius, delta, low, high, core, exit) {
    const whole = interval(0, 1, true, true);
    if (high <= core || low >= exit) return null;
    if (delta === 0) return low < clamp(radius, core, exit) && clamp(radius, core, exit) < high ? whole : null;
    // Inverting clamp first preserves its endpoint dwell. A bound outside the
    // clamp range imposes no restriction on the underlying affine trajectory.
    const lower = low < core ? -Infinity : low;
    const upper = high > exit ? Infinity : high;
    const a = (lower - radius) / delta, b = (upper - radius) / delta;
    return intersect(whole, interval(Math.min(a, b), Math.max(a, b), false, false));
  }
  function checkRing(ring, bounds, radius, radialDelta, q, outerDelta, physics) {
    const angle = ring.initialAngleDegrees + ring.gearRatio * q;
    const delta = zero(ring.gearRatio * outerDelta), width = bounds.effectiveSafeHalfWidthDegrees;
    const radial = radialInterval(radius, radialDelta, bounds.effectiveInnerRadius, bounds.effectiveOuterRadius,
      physics.coreRadius, physics.exitRadius);
    const check = { id: ring.id, ...bounds, unwrappedAngleBefore: angle, plannedDeltaDegrees: delta,
      radialInterval: radial, angleAtIntervalStart: null, angleAtIntervalEnd: null,
      safeComponentIndex: null, firstUnsafeFraction: null, unsafeComponent: null };
    if (!radial) return check;
    const first = angle + delta * radial.start, last = angle + delta * radial.end;
    check.angleAtIntervalStart = first; check.angleAtIntervalEnd = last;
    const k = component(first, width);
    if (k !== null && last >= 360 * k - width && last <= 360 * k + width) {
      check.safeComponentIndex = k;
      return check;
    }
    const safe = [];
    if (delta !== 0) {
      const lowK = Math.ceil((Math.min(first, last) - width) / 360);
      const highK = Math.floor((Math.max(first, last) + width) / 360);
      for (let index = lowK; index <= highK; index++) {
        const a = (360 * index - width - angle) / delta, b = (360 * index + width - angle) / delta;
        const piece = intersect(radial, interval(Math.min(a, b), Math.max(a, b), true, true));
        if (piece) safe.push(piece);
      }
      safe.sort((a, b) => a.start - b.start);
    }
    let cursor = radial.start, included = radial.startIncluded;
    for (const piece of safe) {
      const gap = intersect(radial, interval(cursor, piece.start, included, !piece.startIncluded));
      if (gap) { check.unsafeComponent = gap; break; }
      cursor = piece.end; included = !piece.endIncluded;
    }
    if (!check.unsafeComponent) check.unsafeComponent = intersect(radial, interval(cursor, radial.end, included, radial.endIncluded));
    if (check.unsafeComponent) check.firstUnsafeFraction = check.unsafeComponent.start;
    return check;
  }

  function nextUp(value) {
    if (value === 0) return Number.MIN_VALUE;
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, value, false);
    const low = (view.getUint32(4, false) + 1) >>> 0;
    view.setUint32(4, low, false);
    if (low === 0) view.setUint32(0, view.getUint32(0, false) + 1, false);
    return view.getFloat64(0, false);
  }
  function submissionFraction(candidate, radius, radialDelta, q, outerDelta, checks, state) {
    const safe = fraction => {
      const r = clamp(radius + radialDelta * fraction, state.physics.coreRadius, state.physics.exitRadius);
      const drive = q + outerDelta * fraction;
      return state.scenario.rings.every((ring, i) => {
        const check = checks[i], angle = ring.initialAngleDegrees + ring.gearRatio * drive;
        return !(check.effectiveInnerRadius < r && r < check.effectiveOuterRadius)
          || component(angle, check.effectiveSafeHalfWidthDegrees) !== null;
      });
    };
    // Already-overlapping local fixtures retain their actual zero-fraction hit.
    if (!safe(0) || safe(candidate)) return candidate;
    const budget = 1e-8;
    let low = Math.max(0, candidate - budget), high = candidate;
    if (candidate - low > budget) low = nextUp(low);
    if (candidate - low > budget || !safe(low)) throw new Error('Unsafe numerical submission bracket');
    // Authored radial steps cannot span two disjoint ring bands, and an angular
    // step cannot span two gap boundaries. The unsafe component containing high
    // has one entry in this small bracket; thus the safe/unsafe bracket is monotone.
    // 1200 covers binary64's complete exponent and significand range, including
    // subnormal fractions. Stagnation must prove adjacency, never imply success.
    for (let i = 0; i < 1200; i++) {
      const middle = low + (high - low) / 2;
      if (middle === low || middle === high) {
        if (nextUp(low) !== high || !safe(low) || safe(high) || candidate - low > budget) {
          throw new Error('Numerical submission is not the nearest safe fraction');
        }
        return low;
      }
      if (safe(middle)) low = middle; else high = middle;
    }
    throw new Error('Numerical submission did not reach adjacent binary64 values');
  }

  function event(state, type, tick, fraction) {
    state.events.push(immutable({ type, tick, fraction }));
  }
  function travel(state, tick, values) {
    const receipt = immutable({ id: state.travelReceipts.length + 1, tick, fraction: 1,
      kind: null, ringId: null, boundary: null, direction: null,
      radius: state.probeRadius, driveAngleDegrees: state.driveAngleDegrees,
      hasKeyBefore: state.hasKey, hasKeyAfter: state.hasKey, endpointReachedFraction: null,
      scoreBefore: state.score, scoreAfter: state.score, reason: null, ...values });
    state.travelReceipts.push(receipt); state.lastTravelReceipts.push(receipt);
    return receipt;
  }
  function finish(state, tick, reason, fraction) {
    state.phase = reason === 'key-extracted' ? 'won' : 'lost';
    if (state.phase === 'won') state.mission = 'complete';
    else state.lostReason = reason;
    state.terminal = immutable({ reason, tick, fraction, probeRadius: state.probeRadius,
      driveAngleDegrees: state.driveAngleDegrees, hasKey: state.hasKey,
      durability: state.durability, resistance: state.resistance, score: state.score });
    if (state.phase === 'lost') travel(state, tick, { kind: 'lost', fraction, reason });
    event(state, state.phase === 'won' ? 'win' : 'lose', tick, fraction);
  }
  function step(state, dt, input) {
    if (state.phase !== 'playing' || !finite(dt) || dt <= 0) return state;
    const p = state.physics, fromTick = state.tick, toTick = fromTick + 1;
    const radius = state.probeRadius, q = state.driveAngleDegrees, hasKey = state.hasKey;
    const durability = state.durability, resistance = state.resistance, mission = state.mission, score = state.score;
    const speed = p.baseRadialSpeed - p.resistanceSpeedPenalty * resistance;
    const beforeEnvelope = envelope(p, hasKey, radius);
    state.events = []; state.lastContact = null; state.lastTravelReceipts = [];
    const controls = inputStep(state, input, toTick), effective = controls.effective;
    const outerDelta = effective.drive * state.scenario.outerRateDegreesPerSecond / p.ticksPerSecond;
    const radialDelta = effective.radial * speed / p.ticksPerSecond;
    const rawTargetRadius = radius + radialDelta, candidateRadius = clamp(rawTargetRadius, p.coreRadius, p.exitRadius);
    const checks = state.scenario.rings.map(ring => checkRing(ring, band(ring, beforeEnvelope, p),
      radius, radialDelta, q, outerDelta, p));
    const hits = checks.filter(check => check.firstUnsafeFraction !== null);
    const hasCollision = hits.length > 0;
    const candidate = hasCollision ? Math.min(...hits.map(check => check.firstUnsafeFraction)) : 1;
    const tiedRingIds = hits.filter(check => check.firstUnsafeFraction === candidate).map(check => check.id);
    const primaryRingId = tiedRingIds[0] || null;
    const fraction = submissionFraction(candidate, radius, radialDelta, q, outerDelta, checks, state);
    state.probeRadius = clamp(radius + radialDelta * fraction, p.coreRadius, p.exitRadius);
    const actualOuterDelta = zero(outerDelta * fraction);
    state.driveAngleDegrees = q + actualOuterDelta;
    const ringMotion = state.scenario.rings.map(ring => {
      const before = ring.initialAngleDegrees + ring.gearRatio * q;
      const after = ring.initialAngleDegrees + ring.gearRatio * state.driveAngleDegrees;
      return { id: ring.id, unwrappedAngleBefore: before, angleBefore: wrap(before),
        plannedDeltaDegrees: zero(ring.gearRatio * outerDelta), actualDeltaDegrees: zero(ring.gearRatio * actualOuterDelta),
        unwrappedAngleAfter: after, angleAfter: wrap(after) };
    });
    const boundaries = [];
    if (radialDelta !== 0) checks.forEach((check, ringIndex) => {
      for (const [boundary, edge] of [['inner', check.effectiveInnerRadius], ['outer', check.effectiveOuterRadius]]) {
        const crossed = radialDelta < 0 ? radius > edge && state.probeRadius <= edge : radius < edge && state.probeRadius >= edge;
        if (!crossed) continue;
        const arrival = (edge - radius) / radialDelta;
        if (arrival < 0 || arrival > fraction) throw new Error('Radial milestone exceeds actual submitted motion');
        boundaries.push({ fraction: arrival, ringIndex, ringId: check.id, boundary, edge });
      }
    });
    boundaries.sort((a, b) => a.fraction - b.fraction || a.ringIndex - b.ringIndex || (a.boundary === 'inner' ? -1 : 1));
    for (const item of boundaries) {
      travel(state, toTick, { kind: 'boundary', fraction: item.fraction, ringId: item.ringId, boundary: item.boundary,
        direction: effective.radial, radius: item.edge, driveAngleDegrees: q + outerDelta * item.fraction,
        hasKeyBefore: hasKey, hasKeyAfter: hasKey, scoreBefore: score, scoreAfter: score });
      event(state, 'boundary', toTick, item.fraction);
    }
    if (hasCollision) {
      state.durability--; state.resistance++; state.inputState.impactLocked = true;
      state.lastContact = immutable({ id: state.contactReceipts.length + 1, tick: toTick, fraction,
        primaryRingId, tiedRingIds, radialDirection: effective.radial, driveDirection: effective.drive, hasKey,
        envelope: envelope(p, hasKey, state.probeRadius), probeRadiusBefore: radius, rawTargetRadius, candidateRadius,
        probeRadiusAtContact: state.probeRadius, driveAngleBefore: q, plannedOuterDeltaDegrees: outerDelta,
        actualOuterDeltaDegrees: actualOuterDelta, driveAngleAtContact: state.driveAngleDegrees,
        ringChecks: checks, ringMotion, durabilityBefore: durability, durabilityAfter: state.durability,
        resistanceBefore: resistance, resistanceAfter: state.resistance, impactLockedAfter: true,
        terminalReason: state.durability === 0 ? 'durability' : null });
      state.contactReceipts.push(state.lastContact);
      event(state, 'hit', toTick, fraction);
      if (state.durability === 0) finish(state, toTick, 'durability', fraction);
    } else {
      if (!hasKey && state.probeRadius === p.coreRadius) {
        state.hasKey = true; state.mission = 'return'; state.score = p.keyScore;
        travel(state, toTick, { kind: 'key-acquired', endpointReachedFraction: radius === p.coreRadius ? 0 : (p.coreRadius - radius) / radialDelta,
          hasKeyBefore: false, hasKeyAfter: true, scoreBefore: score, scoreAfter: state.score });
        event(state, 'key', toTick, 1);
      }
      if (state.hasKey && state.probeRadius === p.exitRadius) {
        const previousScore = state.score;
        state.score = p.keyScore + p.winScore;
        travel(state, toTick, { kind: 'key-extracted', endpointReachedFraction: radius === p.exitRadius ? 0 : (p.exitRadius - radius) / radialDelta,
          scoreBefore: previousScore, scoreAfter: state.score });
        finish(state, toTick, 'key-extracted', 1);
      }
    }
    state.tick = toTick;
    if (state.phase === 'playing' && toTick === p.timeBudgetTicks) finish(state, toTick, 'timeout', 1);
    refresh(state);
    state.lastStep = immutable({ fromTick, toTick, inputMode: controls.mode, requested: controls.requested, effective,
      probeRadiusBefore: radius, rawTargetRadius, candidateRadius, probeRadiusAfter: state.probeRadius,
      driveAngleBefore: q, plannedOuterDeltaDegrees: outerDelta, actualOuterDeltaDegrees: actualOuterDelta,
      driveAngleAfter: state.driveAngleDegrees, motionFraction: fraction, hasCollision, primaryRingId, tiedRingIds,
      contactReceiptId: state.lastContact ? state.lastContact.id : null,
      envelopeBefore: beforeEnvelope, envelopeAfter: state.probeEnvelope, ringMotion, ringChecks: checks,
      durabilityBefore: durability, durabilityAfter: state.durability, resistanceBefore: resistance, resistanceAfter: state.resistance,
      radialSpeedBefore: speed, radialSpeedAfter: state.radialSpeed, hasKeyBefore: hasKey, hasKeyAfter: state.hasKey,
      missionBefore: mission, missionAfter: state.mission, scoreBefore: score, scoreAfter: state.score,
      quarantinedAfter: state.inputState.quarantined, impactLockedAfter: state.inputState.impactLocked,
      travelReceiptIds: state.lastTravelReceipts.map(receipt => receipt.id), terminalAfter: state.terminal ? state.terminal.reason : null });
    return state;
  }

  return Object.freeze({ create, step, snapshot: immutable });
}));
