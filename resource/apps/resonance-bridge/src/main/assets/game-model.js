(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 60, SPEEDS = [10, 15, 20];
  var PHYSICS = { tickHz: 60, stepSeconds: DT, dtTolerance: 1e-12, deadlineTicks: 5400, phaseUnitsPerTurn: 6000,
    frequencyPhaseUnitsPerTick: SPEEDS, frequencyHertz: [.1, .15, .2], resonantEffectivePhaseUnitsPerTick: 15,
    phasePulseUnits: 250, phasePulseTicks: 10, phasePulseUnitsPerTick: 25, baseAmplitudeMetres: .8,
    resonanceUnitsPerAmplitudeMetre: 3000, resonanceGainPerTick: 1, resonanceDecayPerTick: 2,
    maximumSafeResonanceUnits: 1200, maximumSafeAmplitudeMetres: 1.2, maximumContactGapMetres: .35,
    contactQualificationTicks: 24, crossingTicks: 24, plateWalkingTicks: 120, pedestrianSpacingTicks: 600,
    heightInterpolation: 'Continuous linear interpolation between successive 60 Hz sine-derived endpoint heights.',
    contactIntervalRule: 'An entire interval is safe iff the maximum absolute gap at its two endpoints is at most 0.35 m.',
    crossingStartRule: 'A waiting person needs 24 consecutive safe intervals since arriving at this edge, then abs(gapTo) <= abs(gapFrom). Crossing begins at that interval\'s end; its first of 24 intervals is the next interval.',
    resonanceRule: 'Use actual effective phase speed, including an active phase pulse: exactly 15 units/tick gains 1 resonance unit; every other available speed decays 2 units to zero.',
    failurePriority: ['unstable-amplitude', 'pedestrian-fall', 'deadline'],
    completionRule: 'All people passed, with no amplitude or fall failure in the same interval. Passing exactly at tick 5400 is allowed; deadline failure applies only while people remain.',
    scoreRule: 'On win only: 1000 + 100 * pedestrianCount + floor((5400 - tick) / 60). Otherwise zero.',
    axisThreshold: .45, navigationFirstRepeatTick: 24, navigationRepeatPeriodTicks: 12 };
  var LEVELS = [
    { level: 1, difficulty: 0, name: '晨雾渡口', nameEn: 'Morning Crossing', initialPhaseUnits: [0, 500, 1000],
      initialFrequencyIndices: [0, 1, 2], initialResonanceUnits: [0, 120, 240], pedestrianCount: 3 },
    { level: 2, difficulty: 1, name: '错拍长廊', nameEn: 'Out-of-Step Walkway', initialPhaseUnits: [1000, 1750, 2500],
      initialFrequencyIndices: [1, 2, 0], initialResonanceUnits: [360, 180, 540], pedestrianCount: 4 },
    { level: 3, difficulty: 2, name: '暮潮接力', nameEn: 'Dusk Relay', initialPhaseUnits: [3250, 4250, 5250],
      initialFrequencyIndices: [2, 1, 2], initialResonanceUnits: [480, 720, 600], pedestrianCount: 5 }
  ];
  var clone = function (v) { return JSON.parse(JSON.stringify(v)); };
  var finite = function (v) { return typeof v === 'number' && Number.isFinite(v); };
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  function freeze(v) { if (v && typeof v === 'object') { Object.keys(v).forEach(function (key) { freeze(v[key]); }); Object.freeze(v); } return v; }
  function append(bank, row) { row.id = bank.length + 1; bank.push(freeze(row)); return row; }
  function refreshBoard(b) {
    b.phaseWrappedUnits = ((b.phaseUnits % 6000) + 6000) % 6000; b.phaseRadians = 2 * Math.PI * b.phaseWrappedUnits / 6000;
    b.basePhaseUnitsPerTick = SPEEDS[b.frequencyIndex]; b.effectivePhaseUnitsPerTick = b.basePhaseUnitsPerTick + (b.trimTicksRemaining > 0 ? 25 : 0);
    b.amplitudeMetres = .8 + b.resonanceUnits / 3000; b.heightMetres = b.amplitudeMetres * Math.sin(b.phaseRadians);
  }
  function counts(s) {
    s.passedCount = s.pedestrians.filter(function (p) { return p.stage === 'passed'; }).length;
    s.fallenCount = s.pedestrians.filter(function (p) { return p.stage === 'fallen'; }).length;
    s.remainingCount = s.scenario.pedestrianCount - s.passedCount - s.fallenCount;
    s.deadlineTicksRemaining = Math.max(0, 5400 - s.tick);
  }
  function create(seed, difficulty) {
    if (seed && typeof seed === 'object') { difficulty = seed.difficulty; seed = seed.seed; }
    if (seed === undefined) seed = 731; if (difficulty === undefined) difficulty = 0;
    if (seed !== 731 || !Number.isInteger(difficulty) || difficulty < 0 || difficulty > 2) throw new RangeError('Published seed 731 and integer difficulty 0..2 required');
    var level = LEVELS[difficulty], s = { width: 960, height: 540, seed: 731, difficulty: difficulty, level: difficulty + 1,
      levelName: level.name, levelNameEn: level.nameEn, physics: freeze(clone(PHYSICS)), scenario: freeze(clone(level)),
      phase: 'playing', stage: 'tuning', tick: 0, elapsed: 0, score: 0, lostReason: null, failures: [], cursor: 0,
      dispatchAtTick: null, scheduledReleaseTicks: [], passedCount: 0, fallenCount: 0, remainingCount: level.pedestrianCount,
      deadlineTicksRemaining: 5400, boards: [], pedestrians: [], actionReceipts: [], phasePulseReceipts: [], pedestrianEvents: [],
      lastAction: null, lastInterval: null, lastInput: null,
      inputState: { cancelEpoch: 0, quarantined: false, aArmed: true, bArmed: true, navigationDirection: 0, navigationHeldTicks: 0 },
      message: '先调频和调相，让三块桥板持续对齐，再派遣行人' };
    s.boards = level.initialPhaseUnits.map(function (phase, index) {
      var b = { index: index, label: '桥板 ' + (index + 1), phaseUnits: phase, phaseWrappedUnits: 0, phaseRadians: 0,
        frequencyIndex: level.initialFrequencyIndices[index], basePhaseUnitsPerTick: 0, effectivePhaseUnitsPerTick: 0,
        resonanceUnits: level.initialResonanceUnits[index], amplitudeMetres: 0, heightMetres: 0,
        trimTicksRemaining: 0, activePulseId: null, activePulseStartedAtTick: null, completedPulseCount: 0 };
      refreshBoard(b); return b;
    });
    for (var id = 1; id <= level.pedestrianCount; id++) s.pedestrians.push({ id: id, stage: 'pending',
      scheduledReleaseTick: null, releasedAtTick: null, passedAtTick: null, fallenAtTick: null, node: 0, edgeIndex: null,
      failedEdgeIndex: null, contactTicks: 0, crossingAgeTicks: 0, crossingStartedAtTick: null, walkingAgeTicks: 0,
      movementTicks: 0, heightMetres: 0, crossingMaxGapMetres: 0 });
    return s;
  }
  function commandState(s, b) {
    return b ? { phaseUnits: b.phaseUnits, resonanceUnits: b.resonanceUnits, amplitudeMetres: b.amplitudeMetres,
      heightMetres: b.heightMetres, frequencyIndex: b.frequencyIndex, trimTicksRemaining: b.trimTicksRemaining }
      : { dispatchAtTick: s.dispatchAtTick, scheduledReleaseTicks: s.scheduledReleaseTicks.slice() };
  }
  function action(s, t, key) {
    var b = s.cursor < 3 ? s.boards[s.cursor] : null, kind = key === 'b' ? 'phase' : b ? 'frequency' : 'dispatch';
    var row = { fromTick: t, tick: t + 1, key: key, kind: kind, boardIndex: b ? b.index : null, accepted: true,
      reason: null, cursor: s.cursor, before: commandState(s, b), after: null, pulseId: null,
      pulseStartedAtTick: null, extraPhaseUnits: 0, scheduledReleaseTicks: null };
    if (kind === 'phase') {
      if (!b) row.reason = 'no-oscillator';
      else if (b.trimTicksRemaining > 0) row.reason = 'phase-pulse-active';
      else {
        row.pulseId = 1 + s.actionReceipts.filter(function (a) { return a.kind === 'phase' && a.accepted; }).length;
        row.pulseStartedAtTick = t; row.extraPhaseUnits = 250;
        b.trimTicksRemaining = 10; b.activePulseId = row.pulseId; b.activePulseStartedAtTick = t;
      }
    } else if (kind === 'frequency') b.frequencyIndex = (b.frequencyIndex + 1) % 3;
    else if (s.dispatchAtTick !== null) row.reason = 'already-dispatched';
    else {
      s.dispatchAtTick = t; s.scheduledReleaseTicks = s.pedestrians.map(function (p) { return t + 600 * (p.id - 1); });
      s.pedestrians.forEach(function (p, i) { p.scheduledReleaseTick = s.scheduledReleaseTicks[i]; });
      s.stage = 'crossing'; row.scheduledReleaseTicks = s.scheduledReleaseTicks.slice(); s.message = '行人已派遣，跨缝期间也必须保持安全';
    }
    row.accepted = row.reason === null; row.after = commandState(s, b);
    s.lastAction = append(s.actionReceipts, row); s.lastInput.actionReceiptId = row.id;
  }
  function clearNavigation(latch) { latch.navigationDirection = 0; latch.navigationHeldTicks = 0; }
  function inputStep(s, t, input) {
    input = input && typeof input === 'object' ? input : {};
    var l = s.inputState, x = finite(input.x) ? clamp(input.x, -1, 1) : 0, y = finite(input.y) ? clamp(input.y, -1, 1) : 0;
    var a = input.a === true, b = input.b === true, epoch = finite(input.cancelEpoch) ? input.cancelEpoch : l.cancelEpoch;
    var li = s.lastInput = { x: x, y: y, a: a, b: b, cancelEpoch: epoch, cancelled: input.cancelled === true,
      epochChanged: epoch !== l.cancelEpoch, quarantinedBefore: l.quarantined, quarantinedAfter: l.quarantined,
      neutralAcknowledged: false, aFresh: false, bFresh: false, navigationDirection: 0, navigationHeldTicks: 0,
      navigationApplied: 0, actionReceiptId: null, cursorBefore: s.cursor, cursorAfter: s.cursor };
    l.cancelEpoch = epoch;
    if (li.cancelled || li.epochChanged) { l.quarantined = true; l.aArmed = false; l.bArmed = false; clearNavigation(l); }
    else if (l.quarantined) {
      if (Math.abs(x) < .45 && Math.abs(y) < .45 && !a && !b) {
        l.quarantined = false; l.aArmed = true; l.bArmed = true; clearNavigation(l); li.neutralAcknowledged = true;
      }
    } else {
      li.aFresh = a && l.aArmed; li.bFresh = b && l.bArmed; l.aArmed = !a; l.bArmed = !b;
      var direction = x >= .45 ? 1 : x <= -.45 ? -1 : 0;
      if (!direction) clearNavigation(l);
      else {
        l.navigationHeldTicks = direction === l.navigationDirection ? l.navigationHeldTicks + 1 : 1; l.navigationDirection = direction;
        var age = l.navigationHeldTicks;
        if (age === 1 || (age >= 24 && age % 12 === 0)) { var before = s.cursor; s.cursor = clamp(s.cursor + direction, 0, 3); li.navigationApplied = s.cursor - before; }
      }
      if (li.bFresh) action(s, t, 'b'); else if (li.aFresh) action(s, t, 'a');
    }
    li.quarantinedAfter = l.quarantined; li.navigationDirection = l.navigationDirection;
    li.navigationHeldTicks = l.navigationHeldTicks; li.cursorAfter = s.cursor;
  }
  function personEvent(s, t, p, kind, details) {
    return append(s.pedestrianEvents, Object.assign({ fromTick: t, tick: t + 1, kind: kind, personId: p.id }, details));
  }
  function movePerson(s, t, p, contact, heights, failures) {
    if (p.stage === 'waiting') {
      p.contactTicks = contact.safe ? Math.min(24, p.contactTicks + 1) : 0; p.heightMetres = heights[p.node];
      if (p.contactTicks === 24 && contact.closing) {
        personEvent(s, t, p, 'crossing-started', { edgeIndex: p.edgeIndex, startedAtTick: t + 1, qualifiedContactTicks: 24,
          gapFrom: contact.gapFrom, gapTo: contact.gapTo, closing: true, movementTicks: p.movementTicks });
        p.stage = 'crossing'; p.contactTicks = 0; p.crossingAgeTicks = 0; p.crossingStartedAtTick = t + 1; p.crossingMaxGapMetres = 0;
      }
    } else if (p.stage === 'crossing') {
      p.crossingMaxGapMetres = Math.max(p.crossingMaxGapMetres, contact.maxGapMetres);
      if (!contact.safe) {
        var fall = personEvent(s, t, p, 'fallen', { edgeIndex: p.edgeIndex, startedAtTick: p.crossingStartedAtTick,
          fallenAtTick: t + 1, successfulCrossingIntervals: p.crossingAgeTicks, maxGapMetres: p.crossingMaxGapMetres,
          gapFrom: contact.gapFrom, gapTo: contact.gapTo, intervalMaxGapMetres: contact.maxGapMetres,
          movementTicks: p.movementTicks, heightMetres: p.heightMetres });
        failures.push({ kind: 'pedestrian-fall', fromTick: t, tick: t + 1, personId: p.id, edgeIndex: p.edgeIndex,
          eventId: fall.id, gapFrom: contact.gapFrom, gapTo: contact.gapTo, maxGapMetres: contact.maxGapMetres, maximumContactGapMetres: .35 });
        p.stage = 'fallen'; p.failedEdgeIndex = p.edgeIndex; p.edgeIndex = null; p.fallenAtTick = t + 1;
        p.crossingAgeTicks = 0; p.crossingStartedAtTick = null; p.crossingMaxGapMetres = 0;
      } else {
        p.crossingAgeTicks++; p.movementTicks++;
        p.heightMetres = heights[p.node] + (heights[p.node + 1] - heights[p.node]) * p.crossingAgeTicks / 24;
        if (p.crossingAgeTicks === 24) {
          var destination = p.node + 1, passed = destination === 4;
          personEvent(s, t, p, passed ? 'passed' : 'crossing-completed', { edgeIndex: p.edgeIndex, sourceNode: p.node,
            destinationNode: destination, startedAtTick: p.crossingStartedAtTick, completedAtTick: t + 1,
            successfulCrossingIntervals: 24, maxGapMetres: p.crossingMaxGapMetres, movementTicks: p.movementTicks });
          p.node = destination; p.heightMetres = heights[destination]; p.stage = passed ? 'passed' : 'walking'; p.edgeIndex = null; p.walkingAgeTicks = 0;
          p.crossingAgeTicks = 0; p.crossingStartedAtTick = null; p.crossingMaxGapMetres = 0;
          if (passed) p.passedAtTick = t + 1;
        }
      }
    } else if (p.stage === 'walking') {
      p.walkingAgeTicks++; p.movementTicks++; p.heightMetres = heights[p.node];
      if (p.walkingAgeTicks === 120) {
        personEvent(s, t, p, 'walking-completed', { node: p.node, completedAtTick: t + 1, successfulWalkingIntervals: 120, movementTicks: p.movementTicks });
        p.stage = 'waiting'; p.edgeIndex = p.node; p.walkingAgeTicks = 0; p.contactTicks = 0;
      }
    }
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing' || dt === 0) return s;
    if (!finite(dt) || dt <= 0 || Math.abs(dt - DT) > 1e-12) throw new RangeError('step requires one fixed 1/60 second interval');
    var t = s.tick, beforeStage = s.stage, eventStart = s.pedestrianEvents.length; s.lastAction = null; inputStep(s, t, input);
    s.pedestrians.forEach(function (p) {
      if (p.stage === 'pending' && p.scheduledReleaseTick === t) {
        p.stage = 'waiting'; p.node = 0; p.edgeIndex = 0; p.releasedAtTick = t;
        personEvent(s, t, p, 'released', { scheduledReleaseTick: p.scheduledReleaseTick, releasedAtTick: t, node: 0 });
      }
    });
    var failures = [], oscillators = s.boards.map(function (b) {
      var pulse = b.trimTicksRemaining > 0, speed = SPEEDS[b.frequencyIndex] + (pulse ? 25 : 0);
      var row = { boardIndex: b.index, phaseFrom: b.phaseUnits, phaseTo: 0, resonanceFrom: b.resonanceUnits, resonanceTo: 0,
        amplitudeFrom: b.amplitudeMetres, amplitudeTo: 0, heightFrom: b.heightMetres, heightTo: 0, frequencyIndex: b.frequencyIndex,
        basePhaseUnitsPerTick: SPEEDS[b.frequencyIndex], effectivePhaseUnitsPerTick: speed, pulseIncrementUnits: pulse ? 25 : 0,
        trimTicksFrom: b.trimTicksRemaining, trimTicksTo: 0, pulseId: pulse ? b.activePulseId : null, completedPulseReceiptId: null };
      b.phaseUnits += speed; b.resonanceUnits = speed === 15 ? b.resonanceUnits + 1 : Math.max(0, b.resonanceUnits - 2);
      if (pulse && --b.trimTicksRemaining === 0) {
        var origin = s.actionReceipts.find(function (a) { return a.pulseId === b.activePulseId; });
        var done = append(s.phasePulseReceipts, { fromTick: t, tick: t + 1, pulseId: b.activePulseId, actionReceiptId: origin.id,
          boardIndex: b.index, startedAtTick: b.activePulseStartedAtTick, completedAtTick: t + 1, intervalCount: 10, extraPhaseUnits: 250 });
        row.completedPulseReceiptId = done.id; b.completedPulseCount++; b.activePulseId = null; b.activePulseStartedAtTick = null;
      }
      refreshBoard(b); row.phaseTo = b.phaseUnits; row.resonanceTo = b.resonanceUnits; row.amplitudeTo = b.amplitudeMetres;
      row.heightTo = b.heightMetres; row.trimTicksTo = b.trimTicksRemaining;
      if (b.resonanceUnits > 1200) failures.push({ kind: 'unstable-amplitude', fromTick: t, tick: t + 1, boardIndex: b.index,
        resonanceUnits: b.resonanceUnits, amplitudeMetres: b.amplitudeMetres, maximumSafeResonanceUnits: 1200 });
      return row;
    });
    var fromHeights = [0].concat(oscillators.map(function (b) { return b.heightFrom; }), [0]);
    var toHeights = [0].concat(s.boards.map(function (b) { return b.heightMetres; }), [0]);
    var contacts = [0, 1, 2, 3].map(function (edge) {
      var a = fromHeights[edge + 1] - fromHeights[edge], b = toHeights[edge + 1] - toHeights[edge], gap = Math.max(Math.abs(a), Math.abs(b));
      return { edgeIndex: edge, sourceNode: edge, destinationNode: edge + 1, gapFrom: a, gapTo: b,
        maxGapMetres: gap, safe: gap <= .35, closing: Math.abs(b) <= Math.abs(a) };
    });
    var people = s.pedestrians.map(function (p) {
      var before = clone(p); movePerson(s, t, p, p.edgeIndex === null ? null : contacts[p.edgeIndex], toHeights, failures);
      return { personId: p.id, before: before, after: clone(p), eventIds: s.pedestrianEvents.slice(eventStart)
        .filter(function (e) { return e.personId === p.id; }).map(function (e) { return e.id; }) };
    });
    s.tick = t + 1; s.elapsed = s.tick / 60; counts(s);
    if (!failures.length && s.remainingCount > 0 && s.tick >= 5400) failures.push({ kind: 'deadline', fromTick: t, tick: s.tick,
      remainingCount: s.remainingCount, deadlineTicks: 5400 });
    s.failures = failures.map(freeze);
    if (s.failures.length) {
      s.phase = 'lost'; s.stage = 'finished'; s.lostReason = s.failures[0].kind; s.score = 0;
      s.message = { 'unstable-amplitude': '共振振幅超过安全上限', 'pedestrian-fall': '行人跨缝期间失去安全接触', deadline: '渡口时间已到，仍有行人未通过' }[s.lostReason];
    } else if (s.passedCount === s.scenario.pedestrianCount) {
      s.phase = 'won'; s.stage = 'finished'; s.score = 1000 + 100 * s.scenario.pedestrianCount + Math.floor((5400 - s.tick) / 60);
      s.message = '全部行人安全通过，桥板保持稳定';
    }
    s.lastInterval = { fromTick: t, toTick: s.tick, stageBefore: beforeStage, stageAfter: s.stage,
      actionReceiptId: s.lastInput.actionReceiptId, oscillators: oscillators, contacts: contacts, pedestrians: people,
      failures: clone(s.failures), deadlineReached: s.tick >= 5400 };
    return s;
  }
  return { create: create, step: step };
}));
