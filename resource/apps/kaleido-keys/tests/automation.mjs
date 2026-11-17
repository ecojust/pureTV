// Ordinary observation-only editor. No model imports, hidden source answer or future simulation.
export const budgets = Object.freeze({ maxWebGLDrawCalls: 1, maxCanvasPaintCommands: 0 });
function check(condition, message) { if (!condition) throw Error(message); }
function sameCell(a, b) {
  return a === null && b === null || !!a && !!b && a.glyph === b.glyph && a.turn === b.turn && a.mirrored === b.mirrored;
}
function directionTo(focus, row, col) {
  if (focus.row !== row) return focus.row < row ? 'ArrowDown' : 'ArrowUp';
  if (focus.col !== col) return focus.col < col ? 'ArrowRight' : 'ArrowLeft';
  return null;
}
function sourceSlot(windowIndex, sector) {
  const row = Math.floor(windowIndex / 2), lane = windowIndex % 2;
  return 2 * row + (sector % 2 ? 1 - lane : lane);
}

export function createPilot({ policy = 'align' } = {}) {
  check(policy === 'align' || policy === 'reject', 'Unknown public editor policy');
  let decisions = 0, lastCue = null, actualOrigin = null;
  function at(state, row, col, key) {
    const direction = directionTo(state.focus, row, col);
    return [direction || key];
  }
  const pilot = snapshot => {
    decisions++;
    const s = snapshot?.model;
    if (!s || snapshot.paused || snapshot.phase !== 'playing' || s.phase !== 'playing') return [];
    if (!actualOrigin) actualOrigin = { source: structuredClone(s.source), order: s.order, failures: s.failures, submissions: s.submissions.length };
    // Every action is followed by a genuine neutral observation before another
    // action. Gate fields acknowledge input only; they supply no puzzle answer.
    if (!s.inputArmed || s.lastHeld.a || s.lastHeld.b || s.lastHeld.direction !== 'none') return [];
    check(s.target?.window?.length === 6 && s.pattern?.inspection?.length === 6 && s.source?.length === 6,
      'Visible source and inspection windows unavailable');
    if (policy === 'reject') {
      check(actualOrigin.failures === 0 && actualOrigin.submissions === 0 && actualOrigin.source.every(cell => cell === null),
        'Natural rejection starts with an observed fresh empty source');
      check(s.source.every(cell => cell === null) && s.order === actualOrigin.order,
        'Natural rejection must preserve the observed empty source and initial order');
      check(!s.pattern.matched, 'Empty source unexpectedly matches the complete target');
      lastCue = { kind: 'empty-source-rejection', failures: s.failures, focus: { ...s.focus } };
      return at(s, 2, 2, 'Space');
    }
    if (s.order !== s.target.order) {
      lastCue = { kind: 'visible-order', current: s.order, target: s.target.order, focus: { ...s.focus } };
      // The displayed ORDER control cycles forward. Observe each actual cycle.
      return at(s, 0, 2, 'Space');
    }
    // Refund visibly incorrect pieces before requesting stock for an empty
    // socket. Each inverse lookup is just one displayed inspection cell and
    // the documented lane swap; no desired-source vector is built or stored.
    for (let index = 0; index < 6; index++) {
      const wanted = s.target.window[index], slot = sourceSlot(index, s.target.sector), piece = s.source[slot];
      if (piece && (!wanted || piece.glyph !== wanted.glyph)) {
        lastCue = { kind: 'visible-remove', windowCell: index, sourceSlot: slot, currentGlyph: piece.glyph,
          targetGlyph: wanted?.glyph ?? null, sector: s.target.sector };
        return at(s, Math.floor(slot / 2), slot % 2, 'b');
      }
    }
    for (let index = 0; index < 6; index++) {
      const wanted = s.target.window[index], live = s.pattern.inspection[index];
      if (sameCell(wanted, live)) continue;
      const slot = sourceSlot(index, s.target.sector), piece = s.source[slot];
      check(wanted, 'Live occupied window disagrees with its observed empty source');
      check(wanted.mirrored === (s.target.sector % 2 === 1), 'Visible target handedness disagrees with its sector');
      if (!piece) {
        check(s.stock[wanted.glyph] > 0, 'Visible desired glyph has no stock after incorrect pieces were returned');
        if (s.selectedGlyph !== wanted.glyph) {
          lastCue = { kind: 'visible-palette', current: s.selectedGlyph, target: wanted.glyph, windowCell: index };
          return at(s, 1, 2, 'Space');
        }
        lastCue = { kind: 'visible-place', windowCell: index, sourceSlot: slot, glyph: wanted.glyph,
          remaining: s.stock[wanted.glyph], sector: s.target.sector };
        return at(s, Math.floor(slot / 2), slot % 2, 'Space');
      }
      check(piece.glyph === wanted.glyph, 'Incorrect visible piece was not returned');
      const requiredTurn = s.target.sector % 2 ? (4 - wanted.turn) % 4 : wanted.turn;
      check(piece.turn !== requiredTurn, 'Current window disagrees despite the displayed lane/turn reflection rule');
      lastCue = { kind: 'visible-quarter-turn', windowCell: index, sourceSlot: slot,
        observedSourceTurn: piece.turn, observedWindowTurn: live?.turn ?? null, targetWindowTurn: wanted.turn,
        sector: s.target.sector };
      // A rotates the real source once. Reflected live turns run backwards;
      // the next choice is made from the new visible window, not a prediction.
      return at(s, Math.floor(slot / 2), slot % 2, 'Space');
    }
    check(s.pattern.matched === true && s.pattern.orderMatched === true,
      'Visible order/window match but the actual complete key does not match');
    lastCue = { kind: 'visible-full-key-ready', currentOrder: s.order, targetOrder: s.target.order,
      windowMatchedCount: s.pattern.windowMatchedCount, focus: { ...s.focus } };
    return at(s, 2, 2, 'Space');
  };
  pilot.diagnostics = () => ({ policy, decisions, lastCue: lastCue ? structuredClone(lastCue) : null,
    actualOrigin: actualOrigin ? structuredClone(actualOrigin) : null });
  return pilot;
}

let activePilot = null, identity = '', lastCalls = -1;
export function keys(snapshot, { mode = 'qa' } = {}) {
  const s = snapshot?.model;
  if (!s || snapshot.phase !== 'playing' || snapshot.paused) return [];
  const next = `${mode}:${s.seed}:${s.level}`;
  if (!activePilot || identity !== next || s.calls < lastCalls) { activePilot = createPilot(); identity = next; }
  lastCalls = s.calls; return activePilot(snapshot);
}
export function assertProgress({ before, after, trace = [] }, assert) {
  const start = before.model, end = after.model;
  assert.ok(end.calls > start.calls && end.placements > start.placements, 'Actual source placement progressed');
  assert.equal(end.phase, 'won'); assert.equal(end.reason, ''); assert.equal(end.score, 100);
  assert.equal(end.order, end.target.order); assert.equal(end.pattern.orderMatched, true);
  assert.equal(end.pattern.matched, true); assert.equal(end.pattern.windowMatchedCount, 6);
  assert.ok(end.pattern.windowMatches.every(Boolean)); assert.equal(end.failures, 0);
  assert.equal(end.submissions.length, 1); assert.equal(end.submissions[0].matched, true);
  assert.deepEqual(end.submissions[0].source, end.source); assert.deepEqual(end.submissions[0].cells, end.pattern.cells);
  assert.deepEqual(end.submissions[0].inspection, end.pattern.inspection);
  assert.equal(end.terminalReceipt.cause, 'success'); assert.deepEqual(end.terminalReceipt.cells, end.pattern.cells);
  assert.ok(end.orderChanges > start.orderChanges && end.paletteChanges > start.paletteChanges);
  assert.ok(end.rotations > start.rotations); assert.ok(Object.values(end.stock).every(value => value === 0));
  const observed = [before, ...trace.map(row => row.snapshot ?? row), after].map(row => row.model).filter(Boolean);
  assert.ok(observed.some(s => s.phase === 'playing' && s.pattern.matched && s.submissions.length === 0),
    'Actual complete match remained playing until CHECK/A');
  assert.ok(observed.some(s => s.source.some(Boolean) && !s.pattern.matched), 'Actual partial key was observed');
}
export function assertRetry({ after, initial }, assert) {
  const s = after.model;
  assert.equal(s.phase, 'playing'); assert.equal(s.reason, ''); assert.equal(s.score, 0);
  assert.deepEqual(s.source, [null, null, null, null, null, null]); assert.deepEqual(s.focus, { row: 0, col: 0 });
  assert.equal(s.selectedGlyph, 'hook'); assert.equal(s.pattern.matched, false); assert.equal(s.terminalReceipt, null);
  for (const field of ['moves', 'placements', 'rotations', 'removals', 'orderChanges', 'paletteChanges', 'clears', 'blockedActions', 'failures'])
    assert.equal(s[field], 0, 'Retry resets ' + field);
  assert.deepEqual(s.submissions, []); assert.equal(s.counterSaturated, false); assert.equal(s.elapsedCapped, false);
  assert.deepEqual(s.lastHeld, { a: false, b: false, direction: 'none' });
  if (initial) {
    assert.equal(s.order, initial.model.order); assert.deepEqual(s.stock, initial.model.stock);
    assert.deepEqual(s.target, initial.model.target); assert.deepEqual(s.pattern, initial.model.pattern);
  }
  // Sparse browser reads may follow genuine neutral host calls; exact create
  // bytes and informational elapsed reset are observed in the model corpus.
}
