// Independent interval/window and finite-sequence algebra from the public contract; no production imports.
const check = (condition, message) => { if (!condition) throw new Error(message); };
const sum = values => values.reduce((a, b) => a + b, 0);

export function parseRules(contract, api) {
  const shared = contract.match(/^共享常量：(.+)$/m)?.[1];
  check(shared, 'Missing public beat constants');
  const physics = Object.fromEntries([...shared.matchAll(/([A-Za-z][A-Za-z0-9]*)=([^、。]+)/g)].map(([, key, value]) =>
    [key, value.startsWith('[') ? JSON.parse(value) : Number(value)]));
  for (const key of ['tapHitScore', 'wovenSegmentScore', 'streakStepScore']) physics[key] = Number(api.match(new RegExp(key + '=(\\d+)'))?.[1]);
  check(Object.keys(physics).length === 12 && physics.ticksPerSecond === 60 && physics.holdEndLocalTick - physics.holdStartLocalTick + 1 === 270, 'Unexpected public units');
  check(Object.entries(physics).every(([key, value]) => key === 'tapCentersLocalTick' ? value.every(Number.isSafeInteger) : Number.isFinite(value)), 'Invalid public constant');
  const scenarios = contract.split('\n').filter(row => /^\| [012] \|/.test(row)).map(row => {
    const [level, name, lanes, streak] = row.split('|').slice(1, -1).map(cell => cell.trim());
    const holdLanes = lanes.split(','); check(holdLanes.every(lane => ['left', 'right'].includes(lane)), 'Unknown public lane');
    const segments = holdLanes.map((holdLane, index) => {
      const tapLane = holdLane === 'left' ? 'right' : 'left', offset = index * physics.segmentTicks;
      return {index, id: 'segment-' + (index + 1), holdLane, tapLane, expectedCrossing: holdLane === 'left' ? 'left-over-right' : 'right-over-left',
        startActiveTick: offset + 1, endActiveTick: offset + physics.segmentTicks,
        holdStartActiveTick: offset + physics.holdStartLocalTick, holdEndActiveTick: offset + physics.holdEndLocalTick,
        pulses: physics.tapCentersLocalTick.map((center, localIndex) => ({id: index * physics.tapCentersLocalTick.length + localIndex + 1,
          segmentIndex: index, localIndex, lane: tapLane, dueActiveTick: offset + center,
          openActiveTick: offset + center - physics.tapHalfWindowTicks, closeActiveTick: offset + center + physics.tapHalfWindowTicks}))};
    });
    return {id: 'beat-braid-' + (Number(level) + 1), name, segmentCount: segments.length, requiredStreak: Number(streak),
      maxBreaks: physics.maxBreaks, deadlineActiveTick: segments.length * physics.segmentTicks, segments};
  });
  check(scenarios.length === 3, 'Missing public scenarios');
  for (const scenario of scenarios) {
    const pulses = scenario.segments.flatMap(segment => segment.pulses);
    check(pulses.every((pulse, i) => i === 0 || pulses[i - 1].closeActiveTick < pulse.openActiveTick), 'Window matching requires disjoint published windows');
  }
  return {physics, scenarios};
}

// Only actual running input rows enter these intervals. Frozen rhythm steps occupy no active-clock interval.
export function heldIntervals(running, lane, held) {
  const ranges = [];
  for (const row of running) if (row.held[lane] === held) {
    const previous = ranges.at(-1);
    if (previous && previous[1] + 1 === row.activeTick) previous[1] = row.activeTick;
    else ranges.push([row.activeTick, row.activeTick]);
  }
  return ranges;
}

export function intervalCoverage(ranges, from, to) {
  let count = 0, first = null;
  if (to < from) return {count, first};
  for (const [start, end] of ranges) {
    if (start > to) break;
    const a = Math.max(start, from), b = Math.min(end, to);
    if (a <= b) { count += b - a + 1; if (first === null) first = a; }
  }
  return {count, first};
}

export function streakSummary(wovenFlags, physics) {
  const runs = wovenFlags.map(value => value ? '1' : '0').join('').split('0').map(run => run.length);
  return {wovenSegments: wovenFlags.filter(Boolean).length, breaks: wovenFlags.filter(value => !value).length,
    currentStreak: runs.at(-1), longestStreak: Math.max(...runs),
    chainBonus: physics.streakStepScore * sum(runs.map(length => length * (length + 1) / 2))};
}

export function braidCalendar(scenario, physics, running) {
  check(running.every((row, i) => row.activeTick === i + 1), 'Incomplete independently derived active clock');
  const horizon = running.length, missing = Object.fromEntries(['left', 'right'].map(lane => [lane, heldIntervals(running, lane, false)]));
  const eligible = Object.fromEntries(['left', 'right'].map(lane => [lane, running.filter(row => row.fresh[lane] && row.held[lane === 'left' ? 'right' : 'left'])]));
  const tapReceipts = [], consumed = new Set();
  for (const config of scenario.segments) for (const pulse of config.pulses) {
    const hit = eligible[pulse.lane].find(row => row.activeTick >= pulse.openActiveTick && row.activeTick <= pulse.closeActiveTick);
    const resolvedActiveTick = hit?.activeTick ?? (horizon > pulse.closeActiveTick ? pulse.closeActiveTick + 1 : null);
    if (resolvedActiveTick === null) continue;
    const row = running[resolvedActiveTick - 1], edgeOrdinal = hit ? hit.edgeOrdinals[pulse.lane] : null;
    if (hit) { const key = pulse.lane + ':' + edgeOrdinal; check(!consumed.has(key), 'One edge matched two pulses'); consumed.add(key); }
    tapReceipts.push({id: pulse.id, segmentIndex: pulse.segmentIndex, localIndex: pulse.localIndex, lane: pulse.lane, result: hit ? 'hit' : 'missed',
      resolvedTick: row.tick, resolvedActiveTick, dueActiveTick: pulse.dueActiveTick, openActiveTick: pulse.openActiveTick,
      closeActiveTick: pulse.closeActiveTick, edgeOrdinal, holdLane: config.holdLane, holdEffectiveAtResolution: row.held[config.holdLane]});
  }
  const tapById = new Map(tapReceipts.map(receipt => [receipt.id, receipt]));
  function segmentStateAt(config, activeTick) {
    const end = Math.min(activeTick, config.holdEndActiveTick);
    const holdCheckedTicks = Math.max(0, end - config.holdStartActiveTick + 1), gaps = intervalCoverage(missing[config.holdLane], config.holdStartActiveTick, end);
    const resolved = config.pulses.map(pulse => tapById.get(pulse.id)).filter(receipt => receipt && receipt.resolvedActiveTick <= activeTick);
    const missed = resolved.filter(receipt => receipt.result === 'missed'), tapHits = resolved.length - missed.length;
    const faultTimes = [gaps.first, ...missed.map(receipt => receipt.resolvedActiveTick)].filter(value => value !== null);
    const firstFaultActiveTick = faultTimes.length ? Math.min(...faultTimes) : null;
    const status = activeTick < config.startActiveTick ? 'pending' : activeTick < config.endActiveTick ? 'active' : gaps.count === 0 && tapHits === config.pulses.length ? 'woven' : 'frayed';
    return {index: config.index, status, holdCheckedTicks, holdMissingTicks: gaps.count, firstMissingActiveTick: gaps.first,
      holdBroken: gaps.count > 0, faulted: firstFaultActiveTick !== null, firstFaultActiveTick, tapHits, missedTaps: missed.length,
      taps: config.pulses.map(pulse => { const receipt = tapById.get(pulse.id), visible = receipt && receipt.resolvedActiveTick <= activeTick;
        return {pulseId: pulse.id, status: visible ? receipt.result : 'pending', resolvedActiveTick: visible ? receipt.resolvedActiveTick : null,
          resolvedTick: visible ? receipt.resolvedTick : null, edgeOrdinal: visible ? receipt.edgeOrdinal : null}; })};
  }
  const completed = scenario.segments.filter(config => config.endActiveTick <= horizon);
  const endStates = completed.map(config => segmentStateAt(config, config.endActiveTick)), wovenFlags = endStates.map(state => state.status === 'woven');
  const segmentReceipts = completed.map((config, index) => {
    const state = endStates[index], before = streakSummary(wovenFlags.slice(0, index), physics), after = streakSummary(wovenFlags.slice(0, index + 1), physics);
    const hits = tapReceipts.filter(receipt => receipt.result === 'hit' && receipt.resolvedActiveTick <= config.endActiveTick).length;
    const scoreBefore = physics.tapHitScore * hits + physics.wovenSegmentScore * before.wovenSegments + before.chainBonus;
    const segmentScoreAdded = state.status === 'woven' ? physics.wovenSegmentScore : 0, chainBonusAdded = after.chainBonus - before.chainBonus;
    return {id: index + 1, index, result: state.status, resolvedTick: running[config.endActiveTick - 1].tick, resolvedActiveTick: config.endActiveTick,
      holdLane: config.holdLane, tapLane: config.tapLane, expectedCrossing: config.expectedCrossing, actualCrossing: state.status === 'woven' ? config.expectedCrossing : null,
      holdCheckedTicks: state.holdCheckedTicks, holdMissingTicks: state.holdMissingTicks, firstMissingActiveTick: state.firstMissingActiveTick,
      firstFaultActiveTick: state.firstFaultActiveTick, tapIds: config.pulses.map(pulse => pulse.id), tapHits: state.tapHits, missedTaps: state.missedTaps,
      breaksBefore: before.breaks, breaksAfter: after.breaks, streakBefore: before.currentStreak, streakAfter: after.currentStreak,
      longestStreakAfter: after.longestStreak, scoreBefore, scoreAfter: scoreBefore + segmentScoreAdded + chainBonusAdded, segmentScoreAdded, chainBonusAdded};
  });
  let firstTerminal = null;
  for (const receipt of segmentReceipts) {
    const count = receipt.index + 1, reason = receipt.breaksAfter > scenario.maxBreaks ? 'broken_threads' : count === scenario.segmentCount ?
      receipt.longestStreakAfter >= scenario.requiredStreak ? 'braid_complete' : 'continuity_not_met' : null;
    if (reason) { firstTerminal = {reason, endedTick: receipt.resolvedTick, endedActiveTick: receipt.resolvedActiveTick,
      completedSegments: count, breaks: receipt.breaksAfter, longestStreak: receipt.longestStreakAfter}; break; }
  }
  function progressAt(activeTick) {
    check(Number.isSafeInteger(activeTick) && activeTick >= 0 && activeTick <= horizon, 'Progress query outside actual active horizon');
    const completedSegments = Math.min(scenario.segmentCount, Math.floor(activeTick / physics.segmentTicks));
    const summary = streakSummary(wovenFlags.slice(0, completedSegments), physics), visibleTaps = tapReceipts.filter(receipt => receipt.resolvedActiveTick <= activeTick);
    const tapHitCount = visibleTaps.filter(receipt => receipt.result === 'hit').length, segmentStates = scenario.segments.map(config => segmentStateAt(config, activeTick));
    const currentSegment = completedSegments === scenario.segmentCount ? null : {config: scenario.segments[completedSegments], state: segmentStates[completedSegments]};
    const terminal = firstTerminal && activeTick >= firstTerminal.endedActiveTick ? {...firstTerminal} : null;
    const phase = terminal === null ? 'playing' : terminal.reason === 'braid_complete' ? 'won' : 'lost';
    return {completedSegments, ...summary, tapHitCount, tapMissCount: visibleTaps.length - tapHitCount,
      score: physics.tapHitScore * tapHitCount + physics.wovenSegmentScore * summary.wovenSegments + summary.chainBonus,
      currentSegmentIndex: completedSegments, localTick: currentSegment === null ? 0 : activeTick - completedSegments * physics.segmentTicks,
      segmentStates, currentSegment, phase, lostReason: phase === 'lost' ? terminal.reason : null, terminal};
  }
  return {horizon, missing, tapReceipts, segmentReceipts, firstTerminal, segmentStateAt, progressAt};
}
