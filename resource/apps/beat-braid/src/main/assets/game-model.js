(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PureModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const BUTTONS = ['a', 'b', 'aPressed', 'bPressed', 'start', 'select', 'startPressed', 'selectPressed', 'confirm', 'retry'];
  const LEVELS = [
    { name: '双线入门', lanes: ['left', 'right', 'left', 'right', 'left', 'right'], requiredStreak: 3 },
    { name: '双结回环', lanes: ['left', 'left', 'right', 'right', 'left', 'left', 'right', 'right'], requiredStreak: 4 },
    { name: '交错长辫', lanes: ['left', 'right', 'right', 'left', 'right', 'left', 'left', 'right', 'left', 'right'], requiredStreak: 5 }
  ];
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const opposite = lane => lane === 'left' ? 'right' : 'left';
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  }
  const immutable = value => freeze(JSON.parse(JSON.stringify(value)));
  function physics() {
    return freeze({ ticksPerSecond: 60, segmentTicks: 360, holdStartLocalTick: 61, holdEndLocalTick: 330,
      tapCentersLocalTick: [120, 210, 300], tapHalfWindowTicks: 24, recoveryTicks: 60,
      neutralAxisThreshold: 0.35, maxBreaks: 2, tapHitScore: 10, wovenSegmentScore: 100, streakStepScore: 20 });
  }
  function scenario(difficulty, p) {
    const level = LEVELS[difficulty];
    const segments = level.lanes.map((holdLane, index) => {
      const offset = index * p.segmentTicks, tapLane = opposite(holdLane);
      return { index, id: 'segment-' + (index + 1), holdLane, tapLane,
        expectedCrossing: holdLane === 'left' ? 'left-over-right' : 'right-over-left',
        startActiveTick: offset + 1, endActiveTick: offset + p.segmentTicks,
        holdStartActiveTick: offset + p.holdStartLocalTick, holdEndActiveTick: offset + p.holdEndLocalTick,
        pulses: p.tapCentersLocalTick.map((center, localIndex) => ({ id: index * 3 + localIndex + 1, segmentIndex: index,
          localIndex, lane: tapLane, dueActiveTick: offset + center,
          openActiveTick: offset + center - p.tapHalfWindowTicks, closeActiveTick: offset + center + p.tapHalfWindowTicks })) };
    });
    return freeze({ id: 'beat-braid-' + (difficulty + 1), name: level.name, segmentCount: segments.length,
      requiredStreak: level.requiredStreak, maxBreaks: p.maxBreaks, deadlineActiveTick: segments.length * p.segmentTicks, segments });
  }
  function refresh(s) {
    const i = s.inputState;
    s.clockMode = i.quarantined ? 'quarantine' : i.recoveryRemainingTicks > 0 ? 'preparing' : 'running';
    s.currentSegmentIndex = s.completedSegments;
    s.localTick = s.completedSegments < s.segmentCount ? s.activeTick - s.completedSegments * s.physics.segmentTicks : 0;
    s.currentSegment = s.completedSegments < s.segmentCount ? Object.freeze({
      config: s.scenario.segments[s.completedSegments], state: s.segmentStates[s.completedSegments] }) : null;
    if (s.phase === 'won') s.message = '编带完成 · 最长连续 ' + s.longestStreak + ' 段';
    else if (s.phase === 'lost') s.message = s.lostReason === 'broken_threads' ? '断线超过上限，请重新编织' : '编带结束，连续性尚未达标';
    else if (s.clockMode === 'quarantine') s.message = '请松开所有按键和摇杆，重新接线';
    else if (s.clockMode === 'preparing') s.message = '准备 ' + (i.recoveryRemainingTicks / 60).toFixed(1) + ' 秒 · 可重新按住经线';
    else s.message = '第 ' + (s.currentSegmentIndex + 1) + ' 段 · 按住 ' +
      (s.currentSegment.config.holdLane === 'left' ? 'A 左线，点按 B 右线' : 'B 右线，点按 A 左线');
  }
  function create(seed = 736, difficulty = 0) {
    seed = finite(seed) ? Math.trunc(seed) : 736;
    difficulty = finite(difficulty) ? Math.max(0, Math.min(2, Math.trunc(difficulty))) : 0;
    const p = physics(), sc = scenario(difficulty, p);
    const s = { width: 960, height: 540, schemaVersion: 1,
      identity: freeze({ gameId: 36, name: '双线节律', englishName: 'Beat Braid', slug: 'beat-braid',
        packageId: 'com.ecojust.beatbraidtv', versionName: '0.1.0', versionCode: 1, seed, actionCount: 2 }),
      seed, difficulty, level: difficulty + 1, levelName: sc.name, scenarioId: sc.id, physics: p, scenario: sc,
      phase: 'playing', tick: 0, elapsed: 0, activeTick: 0, activeElapsed: 0, clockMode: 'quarantine',
      score: 0, lostReason: null, message: '', terminal: null, events: [],
      segmentCount: sc.segmentCount, requiredStreak: sc.requiredStreak, maxBreaks: sc.maxBreaks,
      deadlineActiveTick: sc.deadlineActiveTick, currentSegmentIndex: 0, localTick: 0,
      completedSegments: 0, wovenSegments: 0, breaks: 0, currentStreak: 0, longestStreak: 0,
      tapHitCount: 0, tapMissCount: 0, chainBonus: 0,
      segmentStates: sc.segments.map(config => ({ index: config.index, status: 'pending', holdCheckedTicks: 0,
        holdMissingTicks: 0, firstMissingActiveTick: null, holdBroken: false, faulted: false, firstFaultActiveTick: null,
        tapHits: 0, missedTaps: 0, taps: config.pulses.map(pulse => ({ pulseId: pulse.id, status: 'pending',
          resolvedActiveTick: null, resolvedTick: null, edgeOrdinal: null })) })), currentSegment: null,
      inputState: { cancelEpoch: null, quarantined: true, recoveryRemainingTicks: 0, aArmed: false, bArmed: false,
        edgeOrdinals: { left: 0, right: 0 } }, effectiveHeld: { left: false, right: false },
      tapReceipts: [], segmentReceipts: [], lastInput: null, lastStep: null, lastTap: null, lastSegment: null };
    refresh(s); return s;
  }
  function normalize(input, threshold) {
    const source = input && typeof input === 'object' ? input : {}, raw = {};
    for (const key of ['x', 'y', 'menuDelta', 'cancelEpoch']) raw[key] = finite(source[key]) ? source[key] : null;
    for (const key of [...BUTTONS, 'cancelled']) raw[key] = source[key] === true;
    const valid = key => !Object.prototype.hasOwnProperty.call(source, key) || finite(source[key]);
    const axis = key => finite(source[key]) ? Math.max(-1, Math.min(1, source[key])) : 0;
    const x = axis('x'), y = axis('y'), menuDelta = finite(source.menuDelta) ? source.menuDelta : 0;
    const axesValid = valid('x') && valid('y'), menuDeltaValid = valid('menuDelta');
    const cancelEpoch = finite(source.cancelEpoch) ? Math.floor(Math.max(0, source.cancelEpoch)) : 0;
    const fullNeutral = axesValid && menuDeltaValid && Math.abs(x) <= threshold && Math.abs(y) <= threshold &&
      menuDelta === 0 && !raw.cancelled && BUTTONS.every(key => !raw[key]);
    return { raw, x, y, menuDelta, axesValid, menuDeltaValid, cancelEpoch, fullNeutral };
  }
  function handleInput(s, input) {
    const n = normalize(input, s.physics.neutralAxisThreshold), i = s.inputState;
    const before = { quarantined: i.quarantined, recovery: i.recoveryRemainingTicks, aArmed: i.aArmed, bArmed: i.bArmed };
    const epochChanged = i.cancelEpoch !== n.cancelEpoch;
    if (epochChanged || n.raw.cancelled) {
      i.quarantined = true; i.recoveryRemainingTicks = 0; i.aArmed = false; i.bArmed = false;
    }
    i.cancelEpoch = n.cancelEpoch;
    const held = { left: false, right: false }, fresh = { left: false, right: false };
    let mode, neutralAcknowledged = false;
    if (i.quarantined && n.fullNeutral) {
      i.quarantined = false; i.recoveryRemainingTicks = s.physics.recoveryTicks;
      i.aArmed = true; i.bArmed = true; neutralAcknowledged = true; mode = 'neutral_ack';
    } else if (i.quarantined) mode = 'quarantine';
    else {
      for (const [button, lane] of [['a', 'left'], ['b', 'right']]) {
        const armed = button + 'Armed', pressed = n.raw[button + 'Pressed']; held[lane] = n.raw[button];
        if (!held[lane] && !pressed) i[armed] = true;
        else if (i[armed]) { fresh[lane] = true; i[armed] = false; i.edgeOrdinals[lane]++; }
      }
      if (i.recoveryRemainingTicks > 0) { mode = 'preparing'; i.recoveryRemainingTicks--; }
      else mode = 'running';
    }
    s.effectiveHeld = held;
    s.lastInput = immutable({ tick: s.tick, ...n, epochChanged, quarantinedBefore: before.quarantined,
      quarantinedAfter: i.quarantined, recoveryBefore: before.recovery, recoveryAfter: i.recoveryRemainingTicks,
      neutralAcknowledged, aArmedBefore: before.aArmed, aArmedAfter: i.aArmed,
      bArmedBefore: before.bArmed, bArmedAfter: i.bArmed, held, fresh, edgeOrdinals: i.edgeOrdinals });
    return { mode, held, fresh, recoveryBefore: before.recovery };
  }
  function event(s, type) { s.events.push(freeze({ type, tick: s.tick, activeTick: s.activeTick })); }
  function fault(progress, activeTick) {
    progress.faulted = true;
    if (progress.firstFaultActiveTick === null) progress.firstFaultActiveTick = activeTick;
  }
  function resolveTap(s, config, progress, localIndex, result, held) {
    const pulse = config.pulses[localIndex], tap = progress.taps[localIndex];
    const edgeOrdinal = result === 'hit' ? s.inputState.edgeOrdinals[config.tapLane] : null;
    tap.status = result; tap.resolvedActiveTick = s.activeTick; tap.resolvedTick = s.tick; tap.edgeOrdinal = edgeOrdinal;
    if (result === 'hit') {
      progress.tapHits++; s.tapHitCount++; s.score += s.physics.tapHitScore; event(s, 'hit');
    } else { progress.missedTaps++; s.tapMissCount++; fault(progress, s.activeTick); }
    const receipt = immutable({ id: pulse.id, segmentIndex: config.index, localIndex, lane: config.tapLane,
      result, resolvedTick: s.tick, resolvedActiveTick: s.activeTick, dueActiveTick: pulse.dueActiveTick,
      openActiveTick: pulse.openActiveTick, closeActiveTick: pulse.closeActiveTick,
      edgeOrdinal, holdLane: config.holdLane, holdEffectiveAtResolution: held[config.holdLane] });
    s.tapReceipts.push(receipt); s.lastTap = receipt;
  }
  function settleSegment(s, config, progress) {
    const breaksBefore = s.breaks, streakBefore = s.currentStreak, scoreBefore = s.score;
    const holdLength = s.physics.holdEndLocalTick - s.physics.holdStartLocalTick + 1;
    const woven = progress.holdCheckedTicks === holdLength && progress.holdMissingTicks === 0 && progress.tapHits === 3;
    progress.status = woven ? 'woven' : 'frayed'; s.completedSegments++;
    let segmentScoreAdded = 0, chainBonusAdded = 0;
    if (woven) {
      s.wovenSegments++; s.currentStreak++; s.longestStreak = Math.max(s.longestStreak, s.currentStreak);
      segmentScoreAdded = s.physics.wovenSegmentScore; chainBonusAdded = s.physics.streakStepScore * s.currentStreak;
      s.chainBonus += chainBonusAdded; s.score += segmentScoreAdded + chainBonusAdded;
    } else { s.breaks++; s.currentStreak = 0; }
    const receipt = immutable({ id: config.index + 1, index: config.index, result: progress.status,
      resolvedTick: s.tick, resolvedActiveTick: s.activeTick, holdLane: config.holdLane, tapLane: config.tapLane,
      expectedCrossing: config.expectedCrossing, actualCrossing: woven ? config.expectedCrossing : null,
      holdCheckedTicks: progress.holdCheckedTicks, holdMissingTicks: progress.holdMissingTicks,
      firstMissingActiveTick: progress.firstMissingActiveTick, firstFaultActiveTick: progress.firstFaultActiveTick,
      tapIds: config.pulses.map(pulse => pulse.id), tapHits: progress.tapHits, missedTaps: progress.missedTaps,
      breaksBefore, breaksAfter: s.breaks, streakBefore, streakAfter: s.currentStreak, longestStreakAfter: s.longestStreak,
      scoreBefore, scoreAfter: s.score, segmentScoreAdded, chainBonusAdded });
    s.segmentReceipts.push(receipt); s.lastSegment = receipt; event(s, progress.status);
    let reason = null;
    if (s.breaks > s.maxBreaks) reason = 'broken_threads';
    else if (s.completedSegments === s.segmentCount) reason = s.longestStreak >= s.requiredStreak ? 'braid_complete' : 'continuity_not_met';
    if (reason !== null) {
      s.phase = reason === 'braid_complete' ? 'won' : 'lost'; s.lostReason = s.phase === 'lost' ? reason : null;
      s.terminal = freeze({ reason, endedTick: s.tick, endedActiveTick: s.activeTick,
        completedSegments: s.completedSegments, breaks: s.breaks, longestStreak: s.longestStreak });
      event(s, s.phase === 'won' ? 'win' : 'lose');
    }
  }
  function runInterval(s, control, summary) {
    s.activeTick++; s.activeElapsed = s.activeTick / s.physics.ticksPerSecond;
    const index = Math.floor((s.activeTick - 1) / s.physics.segmentTicks);
    const local = (s.activeTick - 1) % s.physics.segmentTicks + 1;
    const config = s.scenario.segments[index], progress = s.segmentStates[index];
    summary.processedSegmentIndex = index; summary.processedLocalTick = local;
    if (local === 1) progress.status = 'active';
    if (local >= s.physics.holdStartLocalTick && local <= s.physics.holdEndLocalTick) {
      summary.holdChecked = true; summary.holdPresent = control.held[config.holdLane]; progress.holdCheckedTicks++;
      if (!summary.holdPresent) {
        summary.holdMissingAdded = 1; progress.holdMissingTicks++; progress.holdBroken = true;
        if (progress.firstMissingActiveTick === null) progress.firstMissingActiveTick = s.activeTick;
        fault(progress, s.activeTick);
      }
    }
    if (control.fresh[config.tapLane] && control.held[config.holdLane]) {
      const j = config.pulses.findIndex((pulse, k) => progress.taps[k].status === 'pending' &&
        s.activeTick >= pulse.openActiveTick && s.activeTick <= pulse.closeActiveTick);
      if (j >= 0) resolveTap(s, config, progress, j, 'hit', control.held);
    }
    config.pulses.forEach((pulse, j) => {
      if (progress.taps[j].status === 'pending' && s.activeTick === pulse.closeActiveTick + 1)
        resolveTap(s, config, progress, j, 'missed', control.held);
    });
    if (local === s.physics.segmentTicks) settleSegment(s, config, progress);
  }
  function step(s, dt, input) {
    if (s.phase !== 'playing' || !finite(dt) || dt <= 0) return s;
    const before = { tick: s.tick, activeTick: s.activeTick, score: s.score, hits: s.tapHitCount, misses: s.tapMissCount,
      completed: s.completedSegments, woven: s.wovenSegments, breaks: s.breaks, streak: s.currentStreak };
    s.events = []; s.lastTap = null; s.lastSegment = null;
    s.tick++; s.elapsed = s.tick / s.physics.ticksPerSecond;
    const control = handleInput(s, input);
    const summary = { fromTick: before.tick, toTick: s.tick, fromActiveTick: before.activeTick, toActiveTick: before.activeTick,
      mode: control.mode, processedSegmentIndex: null, processedLocalTick: null,
      holdChecked: false, holdPresent: null, holdMissingAdded: 0, tapReceiptId: null, segmentReceiptId: null,
      scoreBefore: before.score, scoreAfter: before.score, tapHitsAdded: 0, tapMissesAdded: 0, completedSegmentsAdded: 0,
      wovenSegmentsAdded: 0, breaksAdded: 0, streakBefore: before.streak, streakAfter: before.streak,
      recoveryBefore: control.recoveryBefore, recoveryAfter: s.inputState.recoveryRemainingTicks, terminalAfter: null };
    if (control.mode === 'running') runInterval(s, control, summary);
    summary.toActiveTick = s.activeTick; summary.tapReceiptId = s.lastTap ? s.lastTap.id : null;
    summary.segmentReceiptId = s.lastSegment ? s.lastSegment.id : null;
    summary.scoreAfter = s.score; summary.tapHitsAdded = s.tapHitCount - before.hits; summary.tapMissesAdded = s.tapMissCount - before.misses;
    summary.completedSegmentsAdded = s.completedSegments - before.completed; summary.wovenSegmentsAdded = s.wovenSegments - before.woven;
    summary.breaksAdded = s.breaks - before.breaks; summary.streakAfter = s.currentStreak; summary.terminalAfter = s.terminal;
    s.lastStep = immutable(summary); refresh(s); return s;
  }
  return Object.freeze({ create, step });
});
