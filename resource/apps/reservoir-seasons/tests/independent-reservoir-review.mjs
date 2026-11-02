// Existing observations only: four-season algebra, absolute release ages and action receipts.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { readParameters, prepareSeason, deliveredAt, intervalDelta, annualDemand, annualTargets, finishFacts, inventory } from './reservoir-season-oracle.mjs';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), contractPath = path.join(app, 'docs/model-contract.md');
const CONTRACT_SHA = '1e9d7a7f95eb49a24da5ddd1820f4c1ffda407787db2da3de4e2eeeb9ffb88a7';
const BANKS = ['seasonEntries', 'actionReceipts', 'commits', 'seasonLedgers'];
const when = (name, row) => name === 'seasonEntries' ? row.atTick : name === 'seasonLedgers' ? row.completedAtTick : row.tick;
const sum = values => values.reduce((a, b) => a + b, 0), copy = value => structuredClone(value);
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let parameters, assertions = 0, failureCount = 0; const failureSamples = [];
function equal(actual, expected, label) {
  assertions++; if (!isDeepStrictEqual(actual, expected)) { failureCount++; if (failureSamples.length < 60) failureSamples.push({ label, actual, expected }); }
}

function calendar(raw, level, label) {
  const duration = parameters.physics.releaseDurationTicks, finalTick = raw.final.model.tick, rows = [], histories = Object.fromEntries(BANKS.map(name => [name, []]));
  let carry = level.initialStorageUnits, atTick = 0, annual = [0, 0, 0], dry = 0, terminal = null;
  for (let seasonIndex = 0; seasonIndex < 4 && atTick <= finalTick; seasonIndex++) {
    const season = level.seasons[seasonIndex], entry = { id: seasonIndex + 1, seasonIndex, atTick, ...prepareSeason(carry, season, level.capacityUnits) };
    histories.seasonEntries.push(entry);
    const row = { entry, annualBefore: annual.slice(), versions: [{ tick: atTick, planUnits: [0, 0, 0], undoStack: [] }], commit: null, ledger: null };
    rows.push(row); const observed = raw.actualReceipts.commits[seasonIndex]; if (!observed) break;
    // The locked vector and command time are recorded user intent, subsequently bound to the independent LIFO action history.
    const plannedUnits = copy(observed.plannedUnits), fromTick = observed.fromTick;
    equal(Number.isSafeInteger(fromTick) && fromTick >= atTick && fromTick < finalTick, true, label + '.commit time domain');
    equal(plannedUnits.length === 3 && plannedUnits.every((n, i) => Number.isSafeInteger(n) && n >= 0 && n % parameters.physics.allocationQuantumUnits === 0 && n <= season.demandUnits[i]), true, label + '.per-category affordable plan');
    equal(sum(plannedUnits) <= entry.preparedStorageUnits, true, label + '.total affordable plan');
    row.commit = { id: seasonIndex + 1, seasonIndex, fromTick, tick: fromTick + 1, plannedUnits, preparedStorageUnits: entry.preparedStorageUnits, unallocatedUnits: entry.preparedStorageUnits - sum(plannedUnits) };
    histories.commits.push(row.commit); row.endTick = fromTick + duration;
    if (row.endTick > finalTick) break;
    annual = annual.map((value, i) => value + plannedUnits[i]); carry = entry.preparedStorageUnits - sum(plannedUnits);
    const facts = finishFacts({ seasonIndex, tick: row.endTick, seasonActual: plannedUnits, annual, dryBefore: dry }, level, parameters.physics);
    const { id: entryId, atTick: ignoredTick, ...water } = entry;
    row.ledger = { id: seasonIndex + 1, ...water, entryId, commitId: row.commit.id, commitFromTick: fromTick, completedAtTick: row.endTick,
      plannedUnits: plannedUnits.slice(), deliveredUnits: plannedUnits.slice(), carryOutUnits: carry, demandUnits: season.demandUnits.slice(), residentFloorUnits: season.residentFloorUnits,
      residentFloorMet: facts.residentFloorMet, riverDryStreakBefore: dry, riverDryStreakAfter: facts.riverDryStreakAfter,
      balanceErrorUnits: entry.carryInUnits + entry.inflowUnits - entry.actualEvaporationUnits - entry.overflowUnits - sum(plannedUnits) - carry };
    histories.seasonLedgers.push(row.ledger); equal(row.ledger.balanceErrorUnits, 0, label + '.season conservation'); dry = facts.riverDryStreakAfter;
    if (facts.failures.length || seasonIndex === 3) {
      terminal = { tick: row.endTick, phase: facts.failures.length ? 'lost' : 'won', failures: facts.failures,
        lostReason: facts.failures[0]?.kind || null, score: facts.failures.length ? 0 : 1000 + sum(annual) }; break;
    }
    atTick = row.endTick;
  }
  equal(terminal?.tick, finalTick, label + '.first terminal equals actual final');
  let previousActionTick = 0;
  for (const action of raw.actualReceipts.actionReceipts) {
    const t = action.tick, row = rows.findLast(row => row.entry.atTick < t), before = row.versions.at(-1);
    equal(Number.isSafeInteger(t) && t > previousActionTick && t <= finalTick, true, label + '.one chronological action attempt per tick'); previousActionTick = t;
    equal(['a', 'b'].includes(action.key) && Number.isSafeInteger(action.cursor) && action.cursor >= 0 && action.cursor <= 3, true, label + '.actual action domain');
    const releasing = row.commit !== null && t > row.commit.tick, plan = before.planUnits.slice(), stack = before.undoStack.slice();
    const kind = action.key === 'b' ? 'undo' : action.cursor === 3 ? 'commit' : 'add';
    const stored = row.entry.preparedStorageUnits - (releasing ? sum(deliveredAt(row.commit.plannedUnits, t - 1 - row.commit.fromTick, parameters.physics)) : 0);
    let reason = null, categoryIndex = null, commitId = null;
    if (releasing) reason = 'release-locked';
    else if (kind === 'undo') {
      if (!stack.length) reason = 'nothing-to-undo'; else { categoryIndex = stack.pop(); plan[categoryIndex] -= parameters.physics.allocationQuantumUnits; }
    } else if (kind === 'add') {
      categoryIndex = action.cursor; const quantum = parameters.physics.allocationQuantumUnits;
      if (plan[categoryIndex] + quantum > level.seasons[row.entry.seasonIndex].demandUnits[categoryIndex]) reason = 'demand-full';
      else if (sum(plan) + quantum > stored) reason = 'budget-short';
      else { plan[categoryIndex] += quantum; stack.push(categoryIndex); }
    } else {
      equal(row.commit?.tick, t, label + '.commit exists exactly at accepted A'); equal(row.commit?.plannedUnits, plan, label + '.locked vector equals actual LIFO plan');
      commitId = row.commit?.id; stack.length = 0;
    }
    const expected = { id: histories.actionReceipts.length + 1, fromTick: t - 1, tick: t, seasonIndex: row.entry.seasonIndex, key: action.key, kind,
      accepted: reason === null, reason, categoryIndex, cursor: action.cursor, planBefore: before.planUnits.slice(), planAfter: plan,
      undoDepthBefore: before.undoStack.length, undoDepthAfter: stack.length, storedBefore: stored, storedAfter: stored, commitId };
    histories.actionReceipts.push(expected); row.versions.push({ tick: t, planUnits: plan.slice(), undoStack: stack.slice() });
  }
  equal(histories.actionReceipts.filter(row => row.accepted && row.kind === 'commit').map(row => row.commitId), histories.commits.map(row => row.id), label + '.every commit supported exactly once');
  for (const name of BANKS) equal(raw.actualReceipts[name], histories[name], label + '.independent ' + name);
  const prefixes = tick => Object.fromEntries(BANKS.map(name => [name, histories[name].filter(row => when(name, row) <= tick)]));
  const stateAt = tick => {
    const row = rows.findLast(row => row.entry.atTick <= tick), started = row.commit !== null && row.commit.tick <= tick, finished = terminal !== null && terminal.tick <= tick;
    const stage = finished ? 'finished' : started ? 'releasing' : 'planning', age = started ? Math.min(duration, tick - row.commit.fromTick) : 0;
    const current = started ? deliveredAt(row.commit.plannedUnits, age, parameters.physics) : [0, 0, 0], delivered = row.annualBefore.map((value, i) => value + current[i]);
    const prepared = rows.filter(candidate => candidate.entry.atTick <= tick), completed = histories.seasonLedgers.filter(ledger => ledger.completedAtTick <= tick), version = row.versions.findLast(version => version.tick <= tick);
    const water = inventory({ initialStorageUnits: level.initialStorageUnits, totalInflowUnits: sum(prepared.map(row => row.entry.inflowUnits)),
      totalEvaporationUnits: sum(prepared.map(row => row.entry.actualEvaporationUnits)), totalOverflowUnits: sum(prepared.map(row => row.entry.overflowUnits)),
      storedUnits: row.entry.preparedStorageUnits - sum(current), deliveredUnits: delivered });
    const planTotalUnits = sum(version.planUnits), reservedUndeliveredUnits = stage === 'planning' ? planTotalUnits : stage === 'releasing' ? sum(row.commit.plannedUnits) - sum(current) : 0;
    return { phase: finished ? terminal.phase : 'playing', stage, tick, elapsed: tick / 60, score: finished ? terminal.score : 0,
      lostReason: finished ? terminal.lostReason : null, failures: finished ? terminal.failures : [], seasonIndex: row.entry.seasonIndex, completedSeasons: completed.length,
      releaseAgeTicks: age, releaseSecondsRemaining: stage === 'releasing' ? (duration - age) / 60 : 0,
      planUnits: version.planUnits, undoStack: version.undoStack, committedUnits: started ? row.commit.plannedUnits : null, currentDeliveredUnits: current,
      ...Object.fromEntries(['storedUnits', 'totalInflowUnits', 'totalEvaporationUnits', 'totalOverflowUnits', 'deliveredUnits'].map(key => [key, water[key]])),
      annualTargetsMet: annualTargets(delivered, annualDemand(level.seasons), level.minimumFulfillmentPercent, parameters.physics).met,
      riverDryStreak: completed.at(-1)?.riverDryStreakAfter || 0, planTotalUnits, reservedUndeliveredUnits, unallocatedStoredUnits: water.storedUnits - reservedUndeliveredUnits,
      inventory: water, ...prefixes(tick), lastAction: histories.actionReceipts.findLast(action => action.tick <= tick) || null };
  };
  const intervalAt = tick => {
    const before = stateAt(tick - 1), after = stateAt(tick), row = rows.find(row => row.commit && row.commit.tick <= tick && tick <= row.endTick);
    const fromAge = row ? tick - 1 - row.commit.fromTick : null, prior = row ? deliveredAt(row.commit.plannedUnits, fromAge, parameters.physics) : null;
    const current = row ? deliveredAt(row.commit.plannedUnits, fromAge + 1, parameters.physics) : null;
    return { fromTick: tick - 1, tick, stageBefore: before.stage, stageAfter: after.stage, seasonIndexBefore: before.seasonIndex, seasonIndexAfter: after.seasonIndex,
      actionIds: histories.actionReceipts.filter(action => action.tick === tick).map(action => action.id),
      release: row ? { seasonIndex: row.entry.seasonIndex, commitId: row.commit.id, fromAgeTicks: fromAge, toAgeTicks: fromAge + 1, committedUnits: row.commit.plannedUnits,
        deliveredBeforeUnits: prior, creditedUnits: intervalDelta(row.commit.plannedUnits, fromAge, fromAge + 1, parameters.physics), deliveredAfterUnits: current,
        storageBeforeUnits: row.entry.preparedStorageUnits - sum(prior), storageAfterUnits: row.entry.preparedStorageUnits - sum(current) } : null,
      completedSeasonIndex: rows.find(row => row.ledger?.completedAtTick === tick)?.entry.seasonIndex ?? null,
      enteredSeasonIndex: rows.find(row => row.entry.atTick === tick)?.entry.seasonIndex ?? null,
      terminalReason: after.phase === 'playing' ? null : after.lostReason || 'won', inventoryBefore: before.inventory, inventoryAfter: after.inventory };
  };
  return { rows, histories, prefixes, stateAt, intervalAt, terminal };
}

function expand(raw, tick, label) {
  equal(Number.isSafeInteger(tick) && tick >= 0 && tick < raw.frames.length, true, label + '.frame domain');
  const frame = raw.frames[tick], restored = {};
  equal([frame.tick, frame.state.model.tick], [tick, tick], label + '.actual frame identity');
  equal(Object.keys(frame.receiptPrefixLengths).sort(), BANKS.slice().sort(), label + '.four prefix names');
  for (const name of BANKS) {
    equal(Object.hasOwn(frame.state.model, name), false, label + '.compressed bank ' + name);
    const count = frame.receiptPrefixLengths[name]; equal(count, raw.actualReceipts[name].filter(row => when(name, row) <= tick).length, label + '.prefix time ' + name);
    restored[name] = raw.actualReceipts[name].slice(0, count);
  }
  return { ...frame.state, model: { ...frame.state.model, ...restored } };
}

function inputBindings(raw, audit, label) {
  let previousKeys = [], previousChangeTick = -1;
  for (const change of raw.inputChanges) {
    equal(Number.isSafeInteger(change.tick) && change.tick > previousChangeTick && change.tick < raw.actualFixedTicks, true, label + '.input change chronology');
    equal(change.from, previousKeys, label + '.held-key continuity'); equal(change.elapsed, change.tick / 60, label + '.input change time');
    equal(new Set(change.to).size === change.to.length && change.to.every(key => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'b'].includes(key)), true, label + '.ordinary key domain');
    previousKeys = change.to; previousChangeTick = change.tick;
  }
  const keysAt = tick => raw.inputChanges.findLast(change => change.tick <= tick)?.to || [], cursors = [0];
  const axis = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
  for (let tick = 1; tick <= raw.actualFixedTicks; tick++) {
    const supplied = raw.intervalTrace[tick - 1].input, before = raw.frames[tick - 1].state.model, after = raw.frames[tick].state.model, last = after.lastInput;
    const keys = keysAt(tick - 1), x = axis(supplied.x), y = axis(supplied.y), a = supplied.a === true, b = supplied.b === true;
    equal([supplied.x, supplied.y, a, b], [Number(keys.includes('ArrowRight')) - Number(keys.includes('ArrowLeft')), Number(keys.includes('ArrowDown')) - Number(keys.includes('ArrowUp')), keys.includes('Space'), keys.includes('b')], label + '.actual keys@' + tick);
    const epoch = Number.isSafeInteger(supplied.cancelEpoch) && supplied.cancelEpoch >= 0 ? supplied.cancelEpoch : before.inputState.cancelEpoch;
    const cancelled = supplied.cancelled === true, trigger = cancelled || epoch !== before.inputState.cancelEpoch, isolated = before.inputState.quarantined;
    const neutralAcknowledged = isolated && !trigger && Math.abs(x) < parameters.physics.axisThreshold && Math.abs(y) < parameters.physics.axisThreshold && !a && !b;
    const freshB = !trigger && !isolated && before.inputState.bArmed && b, freshA = !trigger && !isolated && before.inputState.aArmed && a;
    const attempts = audit.histories.actionReceipts.filter(row => row.tick === tick), nav = last.navigationApplied, prior = audit.stateAt(tick - 1), state = audit.stateAt(tick);
    equal(attempts.map(row => row.key), freshB ? ['b'] : freshA ? ['a'] : [], label + '.actual armed attempts@' + tick);
    equal([-1, 0, 1].includes(nav), true, label + '.navigation delta domain');
    if (trigger || isolated || freshB || prior.stage !== 'planning') equal(nav, 0, label + '.navigation suppressed');
    if (nav) equal(nav, x >= parameters.physics.axisThreshold ? 1 : x <= -parameters.physics.axisThreshold ? -1 : 0, label + '.horizontal input supports navigation');
    const afterNav = Math.max(0, Math.min(3, cursors[tick - 1] + nav)); equal(afterNav - cursors[tick - 1], nav, label + '.actual clamped delta');
    const entered = audit.histories.seasonEntries.some(entry => entry.atTick === tick), cursor = entered ? 0 : afterNav;
    cursors.push(cursor); attempts.forEach(row => equal(row.cursor, afterNav, label + '.action uses post-navigation cursor'));
    const quarantinedAfter = entered || trigger || isolated && !neutralAcknowledged;
    equal(last, { x, y, a, b, cancelEpoch: epoch, cancelled, quarantinedBefore: isolated, quarantinedAfter, neutralAcknowledged,
      actionIds: attempts.map(row => row.id), navigationApplied: nav, cursorBefore: cursors[tick - 1], cursorAfter: cursor }, label + '.lastInput@' + tick);
    equal([after.cursor, after.inputState.cancelEpoch, after.inputState.quarantined], [cursor, epoch, quarantinedAfter], label + '.input state links');
    if (state.stage !== 'planning' || entered) equal([after.inputState.navigationDirection, after.inputState.navigationHeldTicks], [0, 0], label + '.release/entry clears navigation');
  }
  return { keysAt, cursors };
}

function snapshot(wrapper, audit, level, difficulty, seed, cursor, tick, label) {
  const expected = { width: 960, height: 540, seed, difficulty, level: difficulty + 1, levelName: level.name, levelNameEn: level.nameEn,
    physics: parameters.physics, capacityUnits: level.capacityUnits, initialStorageUnits: level.initialStorageUnits,
    minimumFulfillmentPercent: level.minimumFulfillmentPercent, annualDemandUnits: annualDemand(level.seasons), seasons: level.seasons,
    ...audit.stateAt(tick), cursor, lastInterval: tick ? audit.intervalAt(tick) : null };
  for (const [key, value] of Object.entries(expected)) equal(wrapper.model[key], value, label + '.' + key);
  equal({ phase: wrapper.phase, paused: wrapper.paused, level: wrapper.level, difficulty: wrapper.difficulty, score: wrapper.score },
    { phase: expected.phase, paused: false, level: difficulty, difficulty, score: expected.score }, label + '.wrapper');
  equal(expected.inventory.balanceErrorUnits, 0, label + '.exact full water balance');
}

function references(raw, audit, inputs, label) {
  const expectedTransitions = [];
  for (let tick = 1; tick <= raw.actualFixedTicks; tick++) {
    const before = audit.stateAt(tick - 1), after = audit.stateAt(tick);
    if (BANKS.some(name => before[name].length !== after[name].length) || ['stage', 'seasonIndex', 'phase'].some(key => before[key] !== after[key])) expectedTransitions.push(tick);
  }
  equal(raw.eventTransitions.map(row => row.tick), expectedTransitions, label + '.all and only receipt/stage/season/terminal boundaries');
  for (const row of raw.eventTransitions) {
    const tick = row.tick; equal([row.beforeFrameIndex, row.afterFrameIndex], [tick - 1, tick], label + '.transition adjacent frames');
    equal(row.input, raw.intervalTrace[tick - 1].input, label + '.transition actual input');
    equal(row.actualLastInterval, raw.frames[tick].state.model.lastInterval, label + '.transition actual interval');
    equal(row.receiptIds, Object.fromEntries(BANKS.map(name => [name, audit.histories[name].filter(receipt => when(name, receipt) === tick).map(receipt => receipt.id)])), label + '.transition receipts');
  }
  const observed = Object.fromEntries(BANKS.map(name => [name, []]));
  for (const row of raw.operations) {
    equal(BANKS.includes(row.kind), true, label + '.operation bank'); const tick = when(row.kind, row.receipt);
    equal([row.beforeFrameIndex, row.afterFrameIndex, row.observedAt], [tick - 1, tick, tick / 60], label + '.operation actual boundary'); observed[row.kind].push(row.receipt);
  }
  equal(observed, Object.fromEntries(BANKS.map(name => [name, audit.histories[name].filter(receipt => when(name, receipt) > 0)])), label + '.all subsequent receipts exactly once; initial entry excluded');
  for (const row of raw.retained) { equal(Number.isSafeInteger(row.frameIndex) && row.frameIndex >= 0 && row.frameIndex <= raw.actualFixedTicks, true, label + '.retained reference'); equal(row.seconds, row.frameIndex / 60, label + '.retained time'); }
  let previousTick = -1;
  for (const row of raw.compactTrace) {
    const t = row.tick, state = audit.stateAt(t); equal(Number.isSafeInteger(t) && t > previousTick && t <= raw.actualFixedTicks, true, label + '.compact chronological reference'); previousTick = t;
    equal(row, { tick: t, keys: inputs.keysAt(t), phase: state.phase, stage: state.stage, seasonIndex: state.seasonIndex, completedSeasons: state.completedSeasons,
      cursor: inputs.cursors[t], planUnits: state.planUnits, undoDepth: state.undoStack.length, committedUnits: state.committedUnits, releaseAgeTicks: state.releaseAgeTicks,
      currentDeliveredUnits: state.currentDeliveredUnits, storedUnits: state.storedUnits, deliveredUnits: state.deliveredUnits, riverDryStreak: state.riverDryStreak,
      annualTargetsMet: state.annualTargetsMet, receiptCounts: Object.fromEntries(BANKS.map(name => [name, state[name].length])), balanceErrorUnits: state.inventory.balanceErrorUnits }, label + '.all eighteen compact fields');
  }
}

function review(raw, entry) {
  const label = entry.name, assertionStart = assertions, failureStart = failureCount, tick = raw.final.model.tick, difficulty = raw.initial.model.difficulty;
  equal(Number.isSafeInteger(difficulty) && difficulty >= 0 && difficulty <= 2, true, label + '.difficulty'); const level = parameters.levels[difficulty];
  equal([raw.name, raw.difficulty, raw.initial.model.level, raw.mode], [label, difficulty, Number(/^level([1-3])-/.exec(label)[1]), label.endsWith('-record') ? 'record' : 'loss'], label + '.case identity');
  equal(Object.hasOwn(raw, 'pilotDiagnostics'), false, label + '.no diagnostics'); equal(entry.removedPaths, ['pilotDiagnostics'], label + '.lossless projection scope');
  equal([raw.initial.model.tick, raw.actualFixedTicks, entry.actualFixedTicks, raw.frames.length, raw.intervalTrace.length], [0, tick, tick, tick + 1, tick], label + '.complete actual tick coverage');
  for (const [key, value] of Object.entries({ version: 1, frameIndexBase: 0, frameIndexEqualsTick: true, receiptFields: BANKS })) equal(raw.evidenceEncoding[key], value, label + '.encoding.' + key);
  equal(Object.keys(raw.actualReceipts).sort(), BANKS.slice().sort(), label + '.four banks');
  for (const name of BANKS) equal(raw.actualReceipts[name], raw.final.model[name], label + '.complete final bank ' + name);
  equal(raw.initial, expand(raw, 0, label), label + '.initial expansion'); equal(raw.final, expand(raw, tick, label), label + '.final expansion');
  equal(raw.initial.model.inputState, { cancelEpoch: 0, quarantined: false, aArmed: true, bArmed: true, navigationDirection: 0, navigationHeldTicks: 0 }, label + '.initial input state');
  equal(raw.initial.model.lastInput, null, label + '.initial input');
  const audit = calendar(raw, level, label), inputs = inputBindings(raw, audit, label), seed = raw.initial.model.seed;
  equal(Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff, true, label + '.seed metadata');
  snapshot(raw.initial, audit, level, difficulty, seed, 0, 0, label + '.initial'); snapshot(raw.final, audit, level, difficulty, seed, inputs.cursors[tick], tick, label + '.final');
  const intervals = [];
  for (let t = 0; t <= tick; t++) {
    const frame = expand(raw, t, label + '@' + t); snapshot(frame, audit, level, difficulty, seed, inputs.cursors[t], t, label + '@' + t);
    if (t) {
      const { input, beforeFrameIndex, afterFrameIndex, ...interval } = raw.intervalTrace[t - 1];
      equal([beforeFrameIndex, afterFrameIndex], [t - 1, t], label + '.interval adjacent frames'); equal(interval, frame.model.lastInterval, label + '.detached actual interval'); intervals.push(interval);
    }
  }
  references(raw, audit, inputs, label); const final = audit.stateAt(tick), h = audit.histories, releases = intervals.filter(row => row.release).map(row => row.release);
  equal(final.phase, raw.mode === 'record' ? 'won' : 'lost', label + '.requested natural outcome');
  return { name: label, level: difficulty + 1, passed: failureCount === failureStart, assertions: assertions - assertionStart,
    projectionSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, originalReportSha256: entry.originalReportSha256, sourceHashes: entry.sourceHashes,
    result: Object.fromEntries(['tick', 'elapsed', 'phase', 'stage', 'score', 'lostReason', 'failures', 'completedSeasons', 'storedUnits', 'deliveredUnits', 'annualTargetsMet', 'riverDryStreak', 'inventory'].map(key => [key, final[key]])),
    counts: { actualFrames: tick + 1, fullSnapshotChecks: tick + 3, intervals: tick, retained: raw.retained.length, compact: raw.compactTrace.length,
      eventWindows: raw.eventTransitions.length, operations: raw.operations.length, inputChanges: raw.inputChanges.length,
      receipts: Object.fromEntries(BANKS.map(name => [name, h[name].length])), releaseIntervals: releases.length, categoryFloorEndpoints: releases.length * 6 },
    coverage: { seasonEntriesWithOverflow: h.seasonEntries.filter(row => row.overflowUnits > 0).length,
      evaporationLimitedByCarry: h.seasonEntries.filter(row => row.actualEvaporationUnits < row.requestedEvaporationUnits).length,
      positiveSeasonCarryOuts: h.seasonLedgers.filter(row => row.carryOutUnits > 0).length, sameTickNextSeasonEntries: h.seasonEntries.length - 1,
      committedZeroPlans: h.commits.filter(row => sum(row.plannedUnits) === 0).length, exactBudgetCommits: h.commits.filter(row => row.unallocatedUnits === 0).length,
      acceptedUndos: h.actionReceipts.filter(row => row.accepted && row.kind === 'undo').length,
      rejectedReasons: Object.fromEntries([...new Set(h.actionReceipts.filter(row => !row.accepted).map(row => row.reason))].map(reason => [reason, h.actionReceipts.filter(row => row.reason === reason).length])),
      zeroWholeIntervalDeliveries: releases.filter(row => sum(row.creditedUnits) === 0).length, residentFloorEqualities: h.seasonLedgers.filter(row => row.deliveredUnits[0] === row.residentFloorUnits).length,
      riverDrySeasons: h.seasonLedgers.filter(row => row.deliveredUnits[2] === 0).length, riverDryStreakResets: h.seasonLedgers.filter(row => row.riverDryStreakBefore > 0 && row.riverDryStreakAfter === 0).length,
      failureKinds: [...new Set(final.failures.map(row => row.kind))] }, seasonEntries: h.seasonEntries, seasonLedgers: h.seasonLedgers };
}

const [corpusArg, outputArg, approvedIndexSha] = process.argv.slice(2);
if (!corpusArg || !outputArg || !/^[a-f0-9]{64}$/.test(approvedIndexSha || '')) throw new Error('Supply approved public corpus, fresh output and index SHA256');
const corpus = path.resolve(corpusArg), output = path.resolve(outputArg), indexPath = path.join(corpus, 'index.json');
if (hash(indexPath) !== approvedIndexSha) throw new Error('Unapproved public index'); const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
if (index.rounds.length !== 6 || new Set(index.rounds.map(row => row.file)).size !== 6 || !index.rounds.every(row => /^level[1-3]-(record|loss)\.json$/.test(row.file) && row.file === row.name + '.json')) throw new Error('Expected six ordinary case basenames');
const portable = file => file.startsWith('/workspace/pureTV/') ? 'repoRelative:' + file.slice('/workspace/pureTV/'.length) : 'scratchRelative:' + path.relative('/workspace/scratch', file);
const files = [indexPath, contractPath, ...['reservoir-season-oracle.mjs', 'independent-reservoir-review.mjs'].map(name => path.join(app, 'tests', name)), ...index.rounds.map(row => path.join(corpus, row.file))];
const hashes = () => Object.fromEntries(files.map(file => [portable(file), hash(file)]));
if (fs.existsSync(output)) throw new Error('Fresh output required; preserve prior evidence'); fs.mkdirSync(output, { recursive: true });
const startedAt = new Date().toISOString(), startHashes = hashes(), rounds = []; let executionError = null;
try {
  equal(hash(contractPath), CONTRACT_SHA, 'approved contract'); parameters = readParameters(fs.readFileSync(contractPath, 'utf8')); equal(index.originalFilesUnchanged, true, 'original bytes unchanged');
  for (const run of index.sourceRuns) { equal(run.startHashes, run.endHashes, 'original source window'); equal(run.startHashes.contract, CONTRACT_SHA, 'actual source contract'); }
  for (const entry of index.rounds) {
    const run = index.sourceRuns.find(row => row.sha256 === entry.originalReportSha256), file = path.join(corpus, entry.file);
    equal(entry.originalReportSha256, index.originalReportSha256, entry.name + '.report binding'); equal(entry.sourceHashes, run?.startHashes, entry.name + '.source binding'); equal(hash(file), entry.sha256, entry.name + '.actual public bytes');
    rounds.push(review(JSON.parse(fs.readFileSync(file, 'utf8')), entry));
  }
} catch (error) { executionError = { name: error.name, message: error.message, stack: error.stack }; }
const endHashes = hashes(), completedAt = new Date().toISOString(); equal(endHashes, startHashes, 'source/evidence window unchanged');
const countKeys = ['actualFrames', 'fullSnapshotChecks', 'intervals', 'retained', 'compact', 'eventWindows', 'operations', 'inputChanges', 'releaseIntervals', 'categoryFloorEndpoints'];
const report = { game: 'reservoir-seasons', kind: 'independent-existing-observation-review', passed: !executionError && failureCount === 0 && rounds.length === 6,
  startedAt, completedAt, sourceUnchanged: isDeepStrictEqual(startHashes, endHashes), startHashes, endHashes,
  source: { index: portable(indexPath), indexSha256: approvedIndexSha, originalReportSha256: index.originalReportSha256,
    runs: index.sourceRuns.map(run => ({ report: portable(run.path), sha256: run.sha256, startHashes: run.startHashes, endHashes: run.endHashes })) },
  method: 'Four-season event calendar from actual commit inputs, with independently checked LIFO add/undo actions. Carry, min evaporation, inflow and overflow are derived from public forecasts. Every stored frame and interval is checked using absolute release age and independent per-category floor endpoints; no production tick controller or observed inventory reset is used.',
  numericalComparison: { waterAndGateTolerance: 0, timingTolerance: 0, comparison: 'Exact integers, integer crossproducts and tick-derived seconds; no approximate or widened threshold.' },
  assertions, failureCount, failureSamples, failureSamplesTruncated: failureCount > failureSamples.length, executionError,
  totals: Object.fromEntries(countKeys.map(key => [key, sum(rounds.map(row => row.counts[key]))])), rounds,
  limitations: ['Only the existing six public rounds are audited. No new gameplay, fixture, Model/pilot import or private plan is used.',
    'Actual normalized inputs, reported armed states, navigation deltas, cancellation/season quarantine and receipt boundaries are linked. Full button rearming and navigation-repeat state machines are not independently replayed.',
    'Invalid dt, runtime pause/retry and extra post-terminal calls are outside these ordinary observations. Per-case coverage lists encountered boundaries only.',
    'Plans and reserved-undelivered water remain part of storage. Four-bank prefix restoration recovers recorded values and never fills missing physical ticks.'] };
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, assertions, failureCount, executionError, totals: report.totals, reportSha256: hash(path.join(output, 'report.json')) }, null, 2));
if (!report.passed) process.exitCode = 1;
