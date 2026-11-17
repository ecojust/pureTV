// Observation-only controller. Public anchor measurements are copied from docs/public-design.md.
// No Model import, target-position table, shadow simulation, future search or state mutation.
const targetColumns = Object.freeze([[10, 11], [14, 9], [6, 13]].map(Object.freeze));
export const budgets = Object.freeze({ maxWebGLDrawCalls: 1, maxCanvasPaintCommands: 0 });

function check(condition, message) { if (!condition) throw Error(message); }
function focus(s, row) { return s.focus === row ? null : ['ArrowDown']; }
function align(s, farOffset = 0) {
  const targets = targetColumns[s.level]; check(targets, 'Unknown public task');
  // Each view's designated landmark belongs to a different physical layer.
  for (const layer of [0, 1]) {
    const anchor = s.views[layer].anchor, scale = layer === 0 ? 2 : 1;
    check(anchor.layer === layer, 'Observed public anchor ownership differs');
    const delta = targets[layer] + (layer === 1 ? farOffset : 0) - anchor.column;
    check(Number.isInteger(delta / scale), 'Target displacement must lie on the public layer grid');
    if (delta) return focus(s, layer) || [delta < 0 ? 'ArrowLeft' : 'ArrowRight'];
  }
  return null;
}
const complete = s => s.views.every(view => view.silhouetteMatched && view.anchor.matched);

export function createPilot({ policy = 'align', exercise = true } = {}) {
  check(['align', 'reject'].includes(policy), 'Unknown observation policy');
  let stage = null, decisions = 0, beforeUndo = null, undoChecked = false;
  const pilot = snapshot => {
    decisions++;
    const s = snapshot?.model;
    if (!s || snapshot.paused || snapshot.phase !== 'playing' || s.phase !== 'playing') return [];
    if (!s.inputArmed) return []; // Only genuine neutral input can acknowledge release.
    if (s.lastHeld.a || s.lastHeld.b || s.lastHeld.direction !== 'none') return [];
    if (policy === 'reject') return ['Space']; // Four actual rejected submissions at the initial board.
    if (stage === null) stage = exercise && s.level === 0 ? 'false-main' : 'align';
    for (let transitions = 0; transitions < 6; transitions++) {
      if (stage === 'false-main') {
        if (s.failures === 0) {
          // The public COURTYARD false-main example is one far projected column
          // before the measured secondary landmark, not a private position route.
          const action = align(s, -1); if (action) return action;
          check(s.views[0].silhouetteMatched && s.views[0].anchor.matched && !complete(s), 'Public false-main example differs');
          return ['Space'];
        }
        check(s.failures === 1, 'Exactly one public false-main rejection expected'); stage = 'view';
      } else if (stage === 'view') {
        const select = focus(s, 2); if (select) return select;
        if (s.view !== 1) return ['ArrowRight'];
        stage = 'align';
      } else if (stage === 'align') {
        const action = align(s); if (action) return action;
        check(complete(s), 'Observed anchor alignment must satisfy all four public checks');
        if (!(exercise && s.level === 0)) return ['Space'];
        beforeUndo = { positions: [...s.positions], failures: s.failures, undos: s.undos };
        stage = 'offset';
      } else if (stage === 'offset') {
        const select = focus(s, 0); if (select) return select;
        if (s.positions[0] === beforeUndo.positions[0]) return ['ArrowRight'];
        check(s.positions[0] === beforeUndo.positions[0] + 1 && s.positions[1] === beforeUndo.positions[1], 'Observed one-step near edit differs');
        stage = 'undo';
      } else if (stage === 'undo') {
        if (s.undos === beforeUndo.undos) return ['b'];
        check(s.undos === beforeUndo.undos + 1 && s.positions.every((p, i) => p === beforeUndo.positions[i]), 'Undo did not restore the observed complete pair');
        check(s.failures === beforeUndo.failures, 'Undo refunded the rejected submission');
        undoChecked = true; stage = 'submit';
      } else {
        check(stage === 'submit' && complete(s), 'Final observed arrangement differs'); return ['Space'];
      }
    }
    throw Error('Unexpected controller stage cycle');
  };
  pilot.diagnostics = () => ({ policy, exercise, stage, decisions, beforeUndo, undoChecked });
  return pilot;
}

let activePilot = null, identity = '', lastCalls = -1;
export function keys(snapshot, { mode = 'qa' } = {}) {
  const s = snapshot?.model; if (!s || snapshot.phase !== 'playing' || snapshot.paused) return [];
  const next = `${mode}:${s.seed}:${s.level}`;
  if (!activePilot || identity !== next || s.calls < lastCalls) { activePilot = createPilot(); identity = next; }
  lastCalls = s.calls; return activePilot(snapshot);
}
export function assertProgress({ before, after, trace = [] }, assert) {
  const start = before.model, end = after.model;
  assert.ok(end.calls > start.calls, 'Actual admitted calls advanced');
  assert.ok(end.moves > start.moves, 'Actual physical edits occurred');
  assert.equal(end.phase, 'won'); assert.equal(end.score, 100);
  assert.ok(complete(end)); assert.equal(end.submissions.at(-1).matched, true);
  const samples = [before, ...trace.map(row => row.state ?? row), after].map(row => row.model).filter(Boolean);
  assert.ok(samples.some(s => s.positions.some((p, i) => p !== start.positions[i])), 'Observed physical arrangement changed');
}
export function assertRetry({ after }, assert) {
  const s = after.model;
  assert.equal(s.phase, 'playing'); assert.equal(s.reason, ''); assert.equal(s.score, 0); assert.equal(s.failures, 0);
  assert.equal(s.focus, 0); assert.equal(s.view, 0); assert.deepEqual(s.undoStack, []); assert.deepEqual(s.submissions, []);
  for (const field of ['moves', 'undos', 'viewChanges', 'focusChanges']) assert.equal(s[field], 0, 'Retry clears ' + field);
  assert.equal(s.counterSaturated, false); assert.equal(s.clockSaturated, false);
  assert.deepEqual(s.lastHeld, { a: false, b: false, direction: 'none' });
  // The host may have admitted real neutral calls before observation; exact create identity is a separate check.
}
