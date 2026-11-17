// Feedback from the current public composition only. No Model import, future motion plan, or search.
export const budgets = { maxWebGLDrawCalls: 1 };
export const lossPolicies = ['empty-film', 'wait-deadline', 'wrong-frame-film'];
export const lossReasons = ['film_exhausted', 'deadline', 'film_exhausted'];
const need = (ok, message) => { if (!ok) throw Error(message); };
const clone = value => structuredClone(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const mod = (value, period) => value - period * Math.floor(value / period);
function shape(m) {
  need(m?.physics?.geometry?.unitsPerCell === 480 && m.physics.geometry.ticksPerSecond === 60, 'Actual public shadow geometry required');
  need(m.scene.actors.length === 3 && m.targets.length === 3 && Number.isSafeInteger(m.transactionCount), 'Actual scene, targets and transaction required');
}
function neutral(m) {
  const li = m.lastInput, l = m.inputState;
  return li && !li.cancelled && !li.epochChanged && !l.quarantined && Math.abs(li.x) < .55 && Math.abs(li.y) < .55
    && !li.effectiveA && !li.effectiveB && l.aArmed && l.bArmed && l.direction === null && l.repeatAgeTicks === 0;
}
function visibleGoal(m) {
  const target = m.targets[m.activeTargetIndex], actor = m.scene.actors[0], part = target.actors.find(row => row.id === actor.id);
  // Region extrema place the window only. The full current preview, never these extrema, decides whether to photograph.
  const x = Math.min(...actor.worldRects.map(r => r.x0)) - Math.min(...part.localRects.map(r => r.x0));
  const y = Math.min(...actor.worldRects.map(r => r.y0)) - Math.min(...part.localRects.map(r => r.y0));
  const unit = m.physics.geometry.unitsPerCell, world = m.physics.geometry.worldSizeCells;
  const cx = Math.max(target.widthCells, Math.min(2 * world[0] - target.widthCells, target.widthCells + 2 * Math.round(x / unit)));
  const cy = Math.max(target.heightCells, Math.min(2 * world[1] - target.heightCells, target.heightCells + 2 * Math.round(y / unit)));
  const dx = cx - m.aperture.centerX2, dy = cy - m.aperture.centerY2;
  return { mode: target.mode, centerX2: cx, centerY2: cy,
    key: dx && Math.abs(dx) >= Math.abs(dy) ? dx < 0 ? 'ArrowLeft' : 'ArrowRight' : dy ? dy < 0 ? 'ArrowUp' : 'ArrowDown' : null };
}
export function createPilot({ mode = 'record', policy = mode === 'loss' ? 'empty-film' : 'normal' } = {}) {
  need(policy === 'normal' || lossPolicies.includes(policy), 'Unknown shadow policy');
  let identity = null, lastTransaction = -1, primed = false, pending = null;
  let stats = { prime: null, issued: [], acknowledged: [] };
  function reset(m) { identity = `${m.seed}:${m.level}`; lastTransaction = m.transactionCount; primed = false; pending = null; stats = { prime: null, issued: [], acknowledged: [] }; }
  function prime(state) {
    const m = state?.model; shape(m);
    need(m.tick === 0 && m.transactionCount === 0 && m.photoReceipts.length === 0 && m.targetCredits.length === 0, 'Prime requires the real untouched initial model');
    reset(m); primed = true;
    stats.prime = { level: m.level, targetIds: m.targets.map(t => t.targetId), initialFilm: clone(m.film),
      limits: { maxOrdinaryKeys: 256, plannedSteps: 0, searches: 0 },
      scope: 'Follow the currently observed first paper part relative to the current target; use the current complete geometric preview to decide whether to press the shutter. No future motion samples or shutter schedule.' };
    return clone(stats.prime);
  }
  function issue(m, key, kind, goal = null) {
    need(!pending && stats.issued.length < 256, 'One bounded ordinary key hold at a time');
    pending = { key, kind, goal: clone(goal), transactionId: m.transactionCount, tick: m.tick, apertureBefore: clone(m.aperture),
      filmBefore: clone(m.film), targetIndex: m.activeTargetIndex, receiptCount: m.photoReceipts.length, previewAtIssue: clone(m.preview),
      acknowledged: false, phase: 'press', releaseTransaction: null };
    stats.issued.push(clone(pending)); return [key];
  }
  function acknowledge(m, terminal = false) {
    const p = pending;
    if (p.phase === 'terminal') return true;
    if (p.phase === 'release') {
      if (terminal || m.transactionCount <= p.releaseTransaction || !neutral(m)) return true;
      pending = null; return false;
    }
    if (m.transactionCount <= p.transactionId) return true;
    if (!p.acknowledged) {
      let observed = null;
      if (p.kind === 'photo' && m.photoReceipts.length > p.receiptCount) {
        const photo = m.photoReceipts[p.receiptCount];
        need(m.photoReceipts.length === p.receiptCount + 1 && photo.transactionId > p.transactionId, 'One real photo must acknowledge a held shutter');
        need(same(photo.filmBefore, p.filmBefore) && photo.chargedFilm === 1 && photo.targetIndexBefore === p.targetIndex, 'Photo must retain the actual film and target at request');
        need(same(photo.aperture, p.apertureBefore), 'A-only input cannot change the exposure window');
        observed = { kind: 'actual-photo-receipt', receipt: clone(photo) };
      } else if (p.kind === 'mode' && m.aperture.mode === p.goal.mode) {
        need(m.aperture.mode !== p.apertureBefore.mode && m.photoReceipts.length === p.receiptCount && same(m.film, p.filmBefore), 'Real B must toggle once without consuming film');
        observed = { kind: 'actual-mode-observation', before: clone(p.apertureBefore), after: clone(m.aperture), input: clone(m.lastInput), frameChange: clone(m.lastFrameChange) };
      } else if (p.kind === 'navigate') {
        const horizontal = ['ArrowLeft', 'ArrowRight'].includes(p.key), key = horizontal ? 'centerX2' : 'centerY2', other = horizontal ? 'centerY2' : 'centerX2';
        const sign = ['ArrowLeft', 'ArrowUp'].includes(p.key) ? -1 : 1;
        if ((m.aperture[key] - p.apertureBefore[key]) * sign > 0) {
          need(m.aperture[other] === p.apertureBefore[other] && m.aperture.mode === p.apertureBefore.mode, 'One held direction changes only its real window axis');
          need(m.photoReceipts.length === p.receiptCount && same(m.film, p.filmBefore), 'Navigation cannot create a photo');
          observed = { kind: 'actual-navigation-observation', before: clone(p.apertureBefore), after: clone(m.aperture), input: clone(m.lastInput), frameChange: clone(m.lastFrameChange) };
        }
      }
      if (!observed) { need(m.transactionCount - p.transactionId <= 80, 'Ordinary key lacks actual acknowledgement within eighty transactions'); return true; }
      p.acknowledged = true; stats.acknowledged.push({ issuedTransactionId: p.transactionId, observedTransactionId: m.transactionCount, observedTick: m.tick, key: p.key, ...observed });
    }
    if (terminal) { p.phase = 'terminal'; return true; }
    if (p.kind === 'navigate' && policy === 'normal') {
      const goal = visibleGoal(m);
      if (goal.mode === m.aperture.mode && !m.preview.matched && goal.key === p.key) return true;
    }
    p.phase = 'release'; p.releaseTransaction = m.transactionCount; return true;
  }
  function pilot(state) {
    const m = state?.model; if (!m) return [];
    if (identity !== `${m.seed}:${m.level}` || m.transactionCount < lastTransaction) reset(m); lastTransaction = m.transactionCount;
    if (m.phase !== 'playing') { if (primed && pending?.kind === 'photo') acknowledge(m, true); return []; }
    if (state.phase !== 'playing' || state.paused) return [];
    shape(m); need(primed, 'Pilot must first observe the actual initial public snapshot');
    if (pending && acknowledge(m)) return pending.phase === 'press' ? [pending.key] : [];
    if (m.inputState.quarantined || (m.transactionCount > 0 && !neutral(m))) return [];
    if (policy === 'wait-deadline') return [];
    if (policy === 'empty-film') return issue(m, 'Space', 'photo');
    if (policy === 'wrong-frame-film') {
      if (m.aperture.mode === m.targets[m.activeTargetIndex].mode) return issue(m, 'b', 'mode', { mode: m.aperture.mode === 'landscape' ? 'portrait' : 'landscape' });
      return issue(m, 'Space', 'photo');
    }
    const goal = visibleGoal(m);
    if (m.aperture.mode !== goal.mode) return issue(m, 'b', 'mode', goal);
    if (m.preview.matched) return issue(m, 'Space', 'photo');
    return goal.key ? issue(m, goal.key, 'navigate', goal) : [];
  }
  pilot.prime = prime; pilot.keys = pilot; pilot.diagnostics = () => clone({ policy, pending, ...stats }); return pilot;
}
const defaultPilot = createPilot();
export const keys = (state, context) => defaultPilot(state, context);
export const prime = state => defaultPilot.prime(state);
export function assertPublicBoard(m, assert) {
  shape(m); assert.equal(m.elapsed, m.tick / 60); assert.equal(m.level, m.difficulty + 1); assert.equal(m.scenarioId, m.scenario.id);
  assert.equal(m.film.initial, m.film.used + m.film.remaining); assert.ok(m.film.remaining >= 0); assert.equal(m.film.used, m.photoReceipts.length);
  assert.equal(m.activeTargetIndex, m.targetCredits.length); assert.equal(m.activeTargetId, m.targets[m.activeTargetIndex]?.targetId ?? null);
  assert.equal(m.scene.motionPhaseTick, mod(m.tick + m.scenario.phaseOffsetTicks, m.physics.motion.periodTicks));
  assert.equal(m.score, m.phase === 'won' ? 1000 + 100 * m.film.remaining : 100 * m.targetCredits.length);
  assert.ok(m.aperture.centerX2 % 2 === 1 && m.aperture.centerY2 % 2 === 1);
  const size = m.physics.aperture.modes.find(row => row.id === m.aperture.mode).sizeCells, unit = m.physics.geometry.unitsPerCell;
  assert.equal(m.aperture.widthCells, size[0]); assert.equal(m.aperture.heightCells, size[1]);
  assert.deepEqual(m.aperture.rect, { x0: (m.aperture.centerX2 - size[0]) * unit / 2, y0: (m.aperture.centerY2 - size[1]) * unit / 2,
    x1: (m.aperture.centerX2 + size[0]) * unit / 2, y1: (m.aperture.centerY2 + size[1]) * unit / 2 });
  for (const [i, actor] of m.scene.actors.entries()) {
    assert.equal(actor.id, m.physics.geometry.requiredActors[i]); assert.equal(actor.depth, i);
    assert.ok(Number.isSafeInteger(actor.originX) && Number.isSafeInteger(actor.originY));
    assert.ok(actor.worldRects.every(r => Object.values(r).every(Number.isSafeInteger) && r.x0 < r.x1 && r.y0 < r.y1));
  }
  let credits = 0;
  m.photoReceipts.forEach((r, i) => {
    assert.equal(r.receiptId, i + 1); assert.ok(r.transactionId <= m.transactionCount && r.boundaryTick <= m.tick);
    assert.deepEqual(r.filmBefore, { initial: m.film.initial, used: i, remaining: m.film.initial - i });
    assert.deepEqual(r.filmAfter, { initial: m.film.initial, used: i + 1, remaining: m.film.initial - i - 1 }); assert.equal(r.chargedFilm, 1);
    assert.equal(r.targetIndexBefore, credits); assert.equal(r.expected.targetId, r.targetIdBefore); assert.equal(r.targetIdBefore, m.targets[credits].targetId);
    assert.equal(r.matched, r.modeMatches && r.allFullyVisible && r.allRegistered && r.exposureEqualsTarget);
    if (r.matched) { const c = m.targetCredits[credits]; assert.deepEqual(c, { creditId: credits + 1, targetIndex: credits, targetId: r.targetIdBefore, photoReceiptId: r.receiptId, transactionId: r.transactionId, boundaryTick: r.boundaryTick }); credits++; }
    assert.equal(r.targetIndexAfter, credits); assert.equal(r.targetIdAfter, m.targets[credits]?.targetId ?? null); assert.equal(r.creditedTargetId, r.matched ? r.targetIdBefore : null);
  });
  assert.equal(credits, m.targetCredits.length);
  if (m.preview) {
    assert.equal(m.preview.tick, m.tick); assert.equal(m.preview.activeTargetIndex, m.activeTargetIndex); assert.equal(m.preview.activeTargetId, m.activeTargetId);
    assert.equal(m.preview.matched, m.preview.modeMatches && m.preview.allFullyVisible && m.preview.allRegistered && m.preview.exposureEqualsTarget);
  } else assert.equal(m.activeTargetIndex, 3);
  const photos = m.photoReceipts.filter(r => r.transactionId === m.transactionCount), currentCredits = m.targetCredits.filter(c => c.transactionId === m.transactionCount);
  assert.deepEqual(m.lastPhoto, photos[0] ?? null);
  if (m.lastTransaction) {
    const tx = m.lastTransaction; assert.equal(tx.id, m.transactionCount); assert.equal(tx.toTick, m.tick); assert.equal(tx.toTick - tx.fromTick, tx.advanced ? 1 : 0);
    assert.deepEqual(tx.terminalAfter, m.terminal); assert.deepEqual(tx.photoReceiptIds, photos.map(r => r.receiptId)); assert.deepEqual(tx.creditIds, currentCredits.map(c => c.creditId));
    assert.equal(m.lastInput.transactionId, tx.id); assert.equal(m.lastFrameChange.transactionId, tx.id); assert.deepEqual(m.lastFrameChange.apertureAfterB, m.aperture);
    if (tx.advanced) { assert.equal(m.lastInterval.intervalId, m.tick); assert.equal(m.lastInterval.transactionId, tx.id); assert.equal(m.transactionCount, m.tick); }
    else { assert.equal(m.lastInterval, null); assert.equal(tx.intervalId, null); assert.equal(m.transactionCount, m.tick + 1); assert.equal(photos.length, 1); assert.deepEqual(photos[0].terminalAfterCapture, m.terminal); assert.notEqual(m.phase, 'playing'); }
  }
}
export function assertProgress({ after }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won');
  assert.equal(m.terminal.reason, 'all_targets_captured'); assert.equal(m.lostReason, null); assert.equal(m.activeTargetIndex, 3); assert.equal(m.preview, null);
  assert.ok(m.elapsed >= 30 && m.elapsed <= 90); assert.equal(m.targetCredits.length, 3); assert.ok(m.photoReceipts.length >= 3 && m.photoReceipts.length <= m.film.initial);
  assert.equal(m.lastTransaction.advanced, false); assert.equal(m.lastInterval, null); assert.equal(m.lastPhoto.matched, true);
}
export function assertRetry({ after, initial }, assert) {
  const m = after.model; assertPublicBoard(m, assert); assert.equal(m.phase, 'playing'); assert.ok(m.tick >= 0 && m.tick < 120); assert.equal(m.transactionCount, m.tick);
  assert.deepEqual(m.scenario, initial.model.scenario); assert.deepEqual(m.targets, initial.model.targets); assert.deepEqual(m.aperture, initial.model.aperture);
  assert.deepEqual(m.film, { initial: m.scenario.initialFilm, used: 0, remaining: m.scenario.initialFilm }); assert.deepEqual(m.photoReceipts, []); assert.deepEqual(m.targetCredits, []);
  assert.equal(m.activeTargetIndex, 0); assert.equal(m.lastPhoto, null); assert.equal(m.terminal, null);
  if (m.tick === 0) assert.deepEqual(m.scene, initial.model.scene);
}
