// Public-board planner and normal-key observer. No production Model import.
const DIRS = [
  { id: 'N', dr: -1, dc: 0, key: 'ArrowUp' }, { id: 'E', dr: 0, dc: 1, key: 'ArrowRight' },
  { id: 'S', dr: 1, dc: 0, key: 'ArrowDown' }, { id: 'W', dr: 0, dc: -1, key: 'ArrowLeft' }
];
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const must = (condition, message) => { if (!condition) throw Error(message); };
const turn = direction => DIRS[(DIRS.findIndex(d => d.id === direction) + 1) % 4].id;
export const publicArrows = model => model.cells.map(cell => cell.arrow);

function context(model) {
  const { rows, cols } = model.grid;
  must(Number.isInteger(rows) && Number.isInteger(cols) && rows > 0 && cols > 0 && rows * cols <= 16, 'Bounded rectangular board required');
  const cells = model.cells.map(({ id, row, col, role, target, editable, initialArrow, arrow }) => ({ id, row, col, role, target, editable, initialArrow, arrow }));
  must(cells.length === rows * cols && new Set(cells.map(c => c.id)).size === cells.length, 'Unique complete public cells required');
  cells.forEach((cell, i) => {
    must(cell.row === Math.floor(i / cols) && cell.col === i % cols, 'Public cells must be row-major');
    must(['source', 'field', 'stop', 'forbidden'].includes(cell.role) && cell.target === (cell.role !== 'forbidden'), 'Invalid public role/target');
    const carriesArrow = ['source', 'field'].includes(cell.role);
    must(carriesArrow ? DIRS.some(d => d.id === cell.arrow) && DIRS.some(d => d.id === cell.initialArrow) : cell.arrow === null && cell.initialArrow === null, 'Invalid public arrow');
    must(typeof cell.editable === 'boolean' && (!cell.editable || carriesArrow), 'Invalid editable cell');
    must(cell.editable || cell.arrow === cell.initialArrow, 'A fixed arrow changed');
  });
  const ids = new Map(cells.map((cell, i) => [cell.id, i])), source = cells.filter(c => c.role === 'source'), targets = cells.filter(c => c.target);
  must(source.length > 0 && cells.some(c => c.role === 'stop'), 'Sources and stopping cells required');
  return { rows, cols, cells, ids, source, targets };
}

function simulate(board, arrows, keepWaves) {
  must(arrows.length === board.cells.length, 'Complete public arrow assignment required');
  board.cells.forEach((cell, i) => must(cell.editable ? DIRS.some(d => d.id === arrows[i]) : arrows[i] === cell.arrow, 'Invalid or changed fixed arrow assignment'));
  let coverageCounts = board.cells.map(c => Number(c.role === 'source'));
  let seeds = board.source.map((cell, i) => ({ id: `S${i + 1}`, sourceId: cell.id, cellId: cell.id, status: 'active', steps: 0, stopId: null, stoppedAtWave: null }));
  const launch = { coverageCounts: [...coverageCounts], seeds: seeds.map(s => ({ ...s })), phase: 'playing', lostReason: null, acceptedWaves: 0 };
  const waves = [], bound = board.targets.length - board.source.length + 1;
  let acceptedWaves = 0;
  for (let waveIndex = 1; waveIndex <= bound; waveIndex++) {
    const intents = seeds.filter(s => s.status === 'active').map(seed => {
      const from = board.cells[board.ids.get(seed.cellId)], direction = arrows[board.ids.get(from.id)], d = DIRS.find(v => v.id === direction);
      must(d, 'Active seed needs a cardinal arrow');
      const toRow = from.row + d.dr, toCol = from.col + d.dc, outside = toRow < 0 || toRow >= board.rows || toCol < 0 || toCol >= board.cols;
      return { seedId: seed.id, fromId: from.id, direction, toId: outside ? null : board.cells[toRow * board.cols + toCol].id, toRow, toCol, outside };
    });
    const arrivals = board.cells.flatMap((cell, i) => {
      const seedIds = intents.filter(intent => intent.toId === cell.id).map(intent => intent.seedId);
      return seedIds.length ? [{ cellId: cell.id, seedIds, count: seedIds.length, previousCoverage: coverageCounts[i] }] : [];
    });
    const issues = {
      outsideSeedIds: intents.filter(i => i.outside).map(i => i.seedId),
      forbiddenCellIds: arrivals.filter(a => board.cells[board.ids.get(a.cellId)].role === 'forbidden').map(a => a.cellId),
      revisitedCellIds: arrivals.filter(a => a.previousCoverage === 1).map(a => a.cellId),
      simultaneousCellIds: arrivals.filter(a => a.count > 1).map(a => a.cellId)
    };
    const failureReason = issues.outsideSeedIds.length || issues.forbiddenCellIds.length ? 'forbidden' : issues.revisitedCellIds.length || issues.simultaneousCellIds.length ? 'overlap' : null;
    const accepted = failureReason === null, newlyCoveredIds = [], stoppedSeedIds = [];
    if (accepted) {
      acceptedWaves++;
      coverageCounts = [...coverageCounts];
      for (const arrival of arrivals) { coverageCounts[board.ids.get(arrival.cellId)] = 1; newlyCoveredIds.push(arrival.cellId); }
      seeds = seeds.map(seed => {
        if (seed.status !== 'active') return { ...seed };
        const intent = intents.find(i => i.seedId === seed.id), stop = board.cells[board.ids.get(intent.toId)].role === 'stop';
        if (stop) stoppedSeedIds.push(seed.id);
        return { ...seed, cellId: intent.toId, steps: seed.steps + 1, status: stop ? 'stopped' : 'active', stopId: stop ? intent.toId : null, stoppedAtWave: stop ? waveIndex : null };
      });
    }
    const allStopped = seeds.every(s => s.status === 'stopped'), allCovered = board.targets.every(c => coverageCounts[board.ids.get(c.id)] === 1);
    const lostReason = failureReason ?? (allStopped && !allCovered ? 'incomplete' : null);
    const phase = lostReason ? 'lost' : allStopped && allCovered ? 'won' : 'playing';
    const wave = { id: waveIndex, accepted, failureReason, intents, arrivals, issues, newlyCoveredIds, stoppedSeedIds };
    const state = { coverageCounts: [...coverageCounts], seeds: seeds.map(s => ({ ...s })), phase, lostReason, acceptedWaves };
    if (keepWaves) waves.push({ wave, ...state });
    if (phase !== 'playing') return { phase, lostReason, waveCount: waveIndex, bound, launch, waves, final: state };
  }
  throw Error('Permanent coverage theorem violated by public simulation');
}

export function predictRun(model, arrows = publicArrows(model)) { return simulate(context(model), [...arrows], true); }
export function planVisibleState(model, { maxConfigurations = 262144, maxMilliseconds = 2500 } = {}) {
  must(Number.isSafeInteger(maxConfigurations) && maxConfigurations > 0 && maxConfigurations <= 262144, 'Invalid configuration cap');
  must(Number.isFinite(maxMilliseconds) && maxMilliseconds > 0 && maxMilliseconds <= 10000, 'Invalid time cap');
  const started = performance.now(), board = context(model), editable = board.cells.flatMap((c, i) => c.editable ? [i] : []), count = 4 ** editable.length;
  const result = (found, reason, extra = {}) => ({ found, reason, configurations: count, examined, simulated, milliseconds: performance.now() - started, ...extra });
  let examined = 0, simulated = 0, best = null;
  if (editable.length > 9 || count > maxConfigurations) return result(false, 'configuration-cap');
  for (let code = 0; code < count; code++) {
    if (performance.now() - started >= maxMilliseconds) return result(false, 'time-cap');
    const arrows = board.cells.map(c => c.arrow); let rest = code, cost = 0;
    for (const i of editable) { const turns = rest % 4; rest = Math.floor(rest / 4); cost += turns; arrows[i] = DIRS[(DIRS.findIndex(d => d.id === arrows[i]) + turns) % 4].id; }
    examined++;
    if (best && cost >= best.cost) continue;
    const run = simulate(board, arrows, false); simulated++;
    if (run.phase === 'won') best = { arrows, cost, waveCount: run.waveCount };
  }
  if (performance.now() - started >= maxMilliseconds) return result(false, 'time-cap');
  if (!best) return result(false, 'no-exact-cover-assignment');
  const operations = [];
  board.cells.forEach((cell, i) => { let direction = cell.arrow; while (direction !== best.arrows[i]) { operations.push({ cellId: cell.id, before: direction, after: turn(direction) }); direction = turn(direction); } });
  return result(true, null, { ...best, operations });
}

export function predictFocus(model, direction) {
  const board = context(model), c = board.cells[board.ids.get(model.selectedId)], d = DIRS.find(v => v.id === direction);
  must(c && d, 'Invalid public focus request');
  return board.cells[Math.max(0, Math.min(board.rows - 1, c.row + d.dr)) * board.cols + Math.max(0, Math.min(board.cols - 1, c.col + d.dc))].id;
}
export function focusPath(model, targetId) {
  const board = context(model), from = board.cells[board.ids.get(model.selectedId)], to = board.cells[board.ids.get(targetId)];
  must(from && to, 'Unknown public focus cell');
  return [...Array(Math.abs(to.col - from.col)).fill(to.col > from.col ? 'E' : 'W'), ...Array(Math.abs(to.row - from.row)).fill(to.row > from.row ? 'S' : 'N')];
}

export function createPilot() {
  let previousTick = -1, release = false, neutralTick = -1, pending = null, plan = null, task = null, due = 0, dwell = .03, launchBoard = null;
  const diagnostics = [], note = (type, fields) => diagnostics.push({ type, ...fields });
  function reset() { release = false; neutralTick = -1; pending = plan = task = launchBoard = null; due = 0; diagnostics.length = 0; }
  function issue(m, kind, key, extra = {}) {
    pending = { kind, at: m.elapsed, arrows: publicArrows(m), editCount: m.editCount, selectedId: m.selectedId, ...extra };
    release = true; note('input', { at: m.elapsed, kind, key, selectedId: m.selectedId }); return [key];
  }
  function pilot(state, { mode = 'qa' } = {}) {
    const m = state.model;
    if (!m) return [];
    if (m.tick < previousTick) reset(); previousTick = m.tick;
    if (state.phase !== 'playing' || state.paused || m.phase !== 'playing') return [];
    const record = mode === 'record';
    if (release) { release = false; neutralTick = m.tick; return []; }
    if (m.tick <= neutralTick) return [];
    if (pending) {
      let observed = false;
      if (pending.kind === 'launch') {
        if (m.launchCount === 1) {
          must(equal(m.runArrows, pending.arrows) && equal(publicArrows(m), pending.arrows) && m.editCount === pending.editCount, 'Launch changed the observed arrow board');
          must(m.sowingStartedAt >= pending.at && m.sowingStartedTick / 60 === m.sowingStartedAt, 'Invalid actual sow receipt');
          launchBoard = { arrows: [...m.runArrows], editCount: m.editCount, selectedId: m.selectedId }; observed = true;
          note('observed-sow', { at: m.sowingStartedAt, observedAt: m.elapsed, arrows: [...m.runArrows], editCount: m.editCount });
        }
      } else if (pending.kind === 'navigate') {
        must(equal(publicArrows(m), pending.arrows) && m.editCount === pending.editCount && m.launchCount === 0, 'Navigation changed the puzzle');
        if (m.selectedId !== pending.selectedId || m.selectedId === pending.expectedId) {
          observed = true; note(m.selectedId === pending.expectedId ? 'observed-focus' : 'observed-overshoot-replan', { at: m.elapsed, selectedId: m.selectedId });
        }
      } else if (m.editCount === pending.editCount + 1) {
        const expected = [...pending.arrows], index = m.cells.findIndex(c => c.id === pending.selectedId); expected[index] = turn(expected[index]);
        const e = m.lastEdit;
        must(equal(publicArrows(m), expected) && m.selectedId === pending.selectedId && m.launchCount === 0, 'Unexpected actual arrow edit');
        must(e && e.id === m.editCount && e.cellId === pending.selectedId && e.before === pending.arrows[index] && e.after === expected[index] && e.at >= pending.at && e.at <= m.elapsed && e.at === e.tick / 60, 'Actual edit receipt does not continue the observed board');
        observed = true; task = null; due = m.elapsed + (record ? .35 : .03); note('observed-edit', { observedAt: m.elapsed, receipt: { ...e }, arrows: expected });
      } else must(m.editCount === pending.editCount && equal(publicArrows(m), pending.arrows) && m.launchCount === 0, 'Uncharged or multiple arrow edits');
      if (observed) pending = null;
      else if (m.elapsed - pending.at > 1.5) { note('unobserved-input-retry', { at: m.elapsed, kind: pending.kind }); pending = null; due = m.elapsed + .2; }
      else return [];
    }
    if (m.mode === 'propagating') {
      if (launchBoard) must(equal(publicArrows(m), launchBoard.arrows) && equal(m.runArrows, launchBoard.arrows) && m.editCount === launchBoard.editCount && m.selectedId === launchBoard.selectedId, 'Propagation must freeze editing and selection');
      return [];
    }
    must(m.mode === 'editing' && m.launchCount === 0, 'Unexpected live mode');
    if (m.elapsed < due) return [];
    if (!plan) {
      plan = planVisibleState(m); note('public-search', { at: m.elapsed, ...plan, arrows: undefined, operations: undefined });
      must(plan.found, 'No bounded public exact-cover plan: ' + plan.reason);
      dwell = record ? Math.max(1, 28 / Math.max(1, plan.operations.length)) : .03;
      due = m.elapsed + (record ? 1.5 : .03); return [];
    }
    const target = m.cells.find((cell, i) => cell.arrow !== plan.arrows[i]);
    if (!target) {
      if (!task || task.kind !== 'launch') { must(predictRun(m).phase === 'won', 'Observed arrow assignment does not predict an exact-cover run'); task = { kind: 'launch' }; due = m.elapsed + (record ? 2.5 : .1); return []; }
      return issue(m, 'launch', 'b');
    }
    must(target.editable, 'Planned fixed arrow changed');
    const route = focusPath(m, target.id);
    if (route.length) return issue(m, 'navigate', DIRS.find(d => d.id === route[0]).key, { expectedId: predictFocus(m, route[0]) });
    if (!task) { task = { kind: 'edit', cellId: target.id }; due = m.elapsed + dwell; note('inspect-current-arrow', { at: m.elapsed, cellId: target.id, direction: target.arrow }); return []; }
    return issue(m, 'edit', 'Space');
  }
  pilot.diagnostics = () => structuredClone(diagnostics); return pilot;
}
const defaultPilot = createPilot();
export function keys(state, options) { return defaultPilot(state, options); }

export function assertPublicBoard(m, assert) {
  const b = context(m), idsFor = predicate => b.cells.filter(predicate).map(c => c.id);
  for (const [key, predicate] of [['source', c => c.role === 'source'], ['stop', c => c.role === 'stop'], ['target', c => c.target], ['forbidden', c => c.role === 'forbidden'], ['editable', c => c.editable]]) {
    assert.deepEqual(m[key + 'Ids'], idsFor(predicate)); if (key !== 'forbidden') assert.equal(m[key + 'Count'], m[key + 'Ids'].length);
  }
  assert.equal(m.waveIntervalTicks, 30); assert.ok(Number.isInteger(m.editCount) && m.editCount >= 0); assert.ok([0, 1].includes(m.launchCount));
  const selected = m.cells.find(c => c.id === m.selectedId); assert.ok(selected);
  assert.deepEqual(m.cursor, Object.fromEntries(['id', 'row', 'col', 'x', 'y', 'editable', 'role'].map(k => [k, selected[k]])));
  let expected, run = null;
  if (m.launchCount === 0) {
    expected = { coverageCounts: b.cells.map(() => 0), seeds: b.source.map((c, i) => ({ id: `S${i + 1}`, sourceId: c.id, cellId: c.id, status: 'waiting', steps: 0, stopId: null, stoppedAtWave: null })), acceptedWaves: 0 };
    assert.equal(m.runArrows, null); assert.equal(m.sowingStartedAt, null); assert.equal(m.sowingStartedTick, null); assert.equal(m.waveIndex, 0);
  } else {
    assert.deepEqual(publicArrows(m), m.runArrows); run = predictRun(m, m.runArrows);
    assert.ok(m.waveIndex >= 0 && m.waveIndex <= run.waveCount); expected = m.waveIndex ? run.waves[m.waveIndex - 1] : run.launch;
    assert.equal(m.sowingStartedAt, m.sowingStartedTick / 60); assert.ok(m.sowingStartedTick > 0 && m.sowingStartedTick <= m.tick);
  }
  assert.deepEqual(m.coverageCounts, expected.coverageCounts); assert.deepEqual(m.seeds, expected.seeds); assert.equal(m.acceptedWaves, expected.acceptedWaves);
  assert.equal(m.activeSeedCount, m.seeds.filter(s => s.status === 'active').length); assert.equal(m.stoppedSeedCount, m.seeds.filter(s => s.status === 'stopped').length); assert.equal(m.allSeedsStopped, m.stoppedSeedCount === m.sourceCount);
  m.cells.forEach((cell, i) => { assert.equal(cell.coverageCount, m.coverageCounts[i]); assert.equal(cell.covered, Boolean(m.coverageCounts[i])); assert.deepEqual(cell.seedIds, m.seeds.filter(s => s.cellId === cell.id).map(s => s.id)); });
  const covered = idsFor(c => c.target && m.coverageCounts[b.ids.get(c.id)] === 1), missing = idsFor(c => c.target && m.coverageCounts[b.ids.get(c.id)] === 0);
  assert.deepEqual(m.coveredTargetIds, covered); assert.deepEqual(m.uncoveredTargetIds, missing); assert.equal(m.coveredCount, covered.length); assert.equal(m.remainingTargetCount, missing.length); assert.equal(m.allTargetsCovered, !missing.length); assert.equal(m.goalReady, m.allTargetsCovered && m.allSeedsStopped);
  assert.equal(m.coveredCount, m.launchCount ? m.sourceCount + m.seeds.reduce((n, s) => n + s.steps, 0) : 0);
  if (m.waveIndex) {
    const wave = expected.wave, tick = m.sowingStartedTick + m.waveIndex * 30;
    assert.deepEqual(m.lastWave, { ...wave, tick, at: tick / 60 }); assert.ok(tick <= m.tick);
  } else assert.equal(m.lastWave, null);
  if (m.mode === 'propagating') { assert.equal(m.phase, 'playing'); assert.equal(m.nextWaveTick, m.sowingStartedTick + (m.waveIndex + 1) * 30); assert.equal(m.waveProgress, Math.max(0, Math.min(1, (m.tick - (m.nextWaveTick - 30)) / 30))); }
  else { assert.equal(m.nextWaveTick, null); assert.equal(m.waveProgress, 0); assert.equal(m.mode, m.phase === 'playing' ? 'editing' : 'finished'); }
  if (m.phase === 'lost') {
    let cellIds = [], seedIds = [];
    if (['forbidden', 'overlap'].includes(m.lostReason)) {
      const issue = expected.wave.issues, bad = new Set([...issue.forbiddenCellIds, ...issue.revisitedCellIds, ...issue.simultaneousCellIds]);
      cellIds = idsFor(c => bad.has(c.id)); seedIds = expected.wave.intents.filter(i => i.outside || bad.has(i.toId)).map(i => i.seedId);
    }
    assert.deepEqual(m.failure, { reason: m.lostReason, waveIndex: m.lostReason === 'timeout' ? null : m.waveIndex, cellIds, seedIds, missingTargetIds: missing });
    if (m.lostReason !== 'timeout') { assert.equal(expected.phase, 'lost'); assert.equal(m.lostReason, expected.lostReason); }
  } else { assert.equal(m.failure, null); assert.equal(m.lostReason, null); if (m.phase === 'won') { assert.equal(expected.phase, 'won'); assert.equal(m.goalReady, true); } }
  if (!m.editCount) assert.equal(m.lastEdit, null);
  else { const e = m.lastEdit; assert.equal(e.id, m.editCount); assert.equal(e.after, turn(e.before)); assert.ok(e.at <= m.elapsed); assert.equal(e.at, e.tick / 60); assert.ok(m.cells.find(c => c.id === e.cellId)?.editable); }
  assert.equal(m.elapsed, m.tick / 60); assert.equal(m.remaining, Math.max(0, m.timeLimit - m.elapsed));
  assert.equal(m.score, m.coveredCount * 40 + (m.phase === 'won' ? 1000 + Math.floor(m.remaining) * 5 : 0));
}

export function assertProgress({ before, after, trace }, assert) {
  assert.equal(after.phase, 'won'); assertPublicBoard(after.model, assert);
  const immutable = m => m.cells.map(({ id, row, col, x, y, role, target, editable, initialArrow }) => ({ id, row, col, x, y, role, target, editable, initialArrow }));
  const arrows = publicArrows(before.model); let edits = before.model.editCount;
  for (const sample of trace) {
    const m = sample.state.model; assertPublicBoard(m, assert); assert.deepEqual(immutable(m), immutable(before.model));
    if (m.editCount !== edits) {
      assert.equal(m.editCount, edits + 1, 'Retain every actual edit observation'); const e = m.lastEdit, i = before.model.cells.findIndex(c => c.id === e.cellId);
      assert.equal(e.before, arrows[i]); assert.equal(e.after, turn(arrows[i])); arrows[i] = e.after; edits++;
    }
    assert.deepEqual(publicArrows(m), arrows);
  }
  assert.deepEqual(after.model.runArrows, arrows); assert.equal(after.model.launchCount, 1); assert.ok(after.model.editCount > 0);
  assert.equal(after.model.coveredCount, after.model.targetCount); assert.equal(after.model.stoppedSeedCount, after.model.sourceCount);
  assert.equal(after.model.waveIndex, after.model.acceptedWaves); assert.ok(trace.some(s => s.state.model.mode === 'propagating'));
}
export function assertRetry({ after, initial }, assert) {
  const m = after.model; assert.equal(after.phase, 'playing'); assert.equal(m.mode, 'editing'); assertPublicBoard(m, assert);
  for (const key of ['editCount', 'launchCount', 'waveIndex', 'acceptedWaves', 'coveredCount']) assert.equal(m[key], 0);
  assert.equal(m.selectedId, m.editableIds[0]); assert.equal(m.score, 0); assert.deepEqual(publicArrows(m), m.cells.map(c => c.initialArrow));
  if (initial) { assert.deepEqual(m.cells, initial.model.cells); assert.deepEqual(m.seeds, initial.model.seeds); }
}
