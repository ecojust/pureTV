// Observation-only public-feedback controller. No Model import or projection simulation.
// These blueprint clues are copied from docs/public-design.md and visible in the game.
const clues = Object.freeze([
  { pivot: [0, 0], guideFoot: [1, 1], guideTip: [3, 0], initialYaw: 2, initialLamp: 0 },
  { pivot: [-1, 0], guideFoot: [-2, 0], guideTip: [-1, 4], initialYaw: 3, initialLamp: 2 },
  { pivot: [0, 1], guideFoot: [1, 0], guideTip: [3, -2], initialYaw: 1, initialLamp: 7 }
].map(clue => { Object.values(clue).filter(Array.isArray).forEach(Object.freeze); return Object.freeze(clue); }));
const compass = Object.freeze({ '1,0': 0, '1,1': 1, '0,1': 2, '-1,1': 3, '-1,0': 4, '-1,-1': 5, '0,-1': 6, '1,-1': 7 });
export const budgets = Object.freeze({ maxWebGLDrawCalls: 1, maxCanvasPaintCommands: 0 });
function check(condition, message) { if (!condition) throw Error(message); }
const select = (s, focus) => s.focus === focus ? null : [focus === 0 ? 'ArrowUp' : 'ArrowDown'];

export function createPilot({ policy = 'align' } = {}) {
  check(['align', 'exhaust'].includes(policy), 'Unknown public-feedback policy');
  let decisions = 0, lastCue = null;
  const pilot = snapshot => {
    decisions++;
    const s = snapshot?.model;
    if (!s || snapshot.paused || snapshot.phase !== 'playing' || s.phase !== 'playing') return [];
    if (!s.inputArmed || s.lastHeld.a || s.lastHeld.b || s.lastHeld.direction !== 'none') return [];
    const clue = clues[s.level]; check(clue, 'Unknown public task');
    if (policy === 'exhaust') {
      check(s.lamp === clue.initialLamp, 'Natural-loss policy must retain the actual initial lamp');
      lastCue = { kind: 'fixed-source-work-rotation', source: s.lamp, actualUsed: s.adjustmentsUsed };
      return select(s, 0) || ['Space'];
    }
    const g = s.geometry, current = g.footPoint.map((n, i) => n - clue.pivot[i]);
    const desired = clue.guideFoot.map((n, i) => n - clue.pivot[i]);
    const cross = current[0] * desired[1] - current[1] * desired[0];
    const dot = current[0] * desired[0] + current[1] * desired[1];
    check(current[0] ** 2 + current[1] ** 2 === desired[0] ** 2 + desired[1] ** 2 && dot * dot + cross * cross > 0,
      'Visible foot registration must lie on the same noncentral quarter-turn orbit');
    if (cross !== 0 || dot < 0) {
      // In x-right/y-down coordinates positive cross is clockwise; an opposite tie uses CW.
      lastCue = { kind: 'visible-foot', current: [...g.footPoint], guide: [...clue.guideFoot], cross, dot };
      return select(s, 0) || [cross < 0 ? 'b' : 'Space'];
    }
    check(g.lightHeight > 0 && Number.isInteger(g.lightHeight), 'Visible tall-post height is positive');
    const source = g.lightCenter.map((n, i) => (n - clue.guideTip[i]) / g.lightHeight);
    const sector = compass[source.join(',')];
    check(Number.isInteger(sector), 'Visible top-center/tip ruler must identify one public compass sector');
    const clockwise = (sector - s.lamp + 8) % 8;
    lastCue = { kind: 'visible-light-ruler', center: [...g.lightCenter], height: g.lightHeight,
      guideTip: [...clue.guideTip], source, currentSector: s.lamp, clockwiseSteps: clockwise };
    if (clockwise) return select(s, 1) || [clockwise > 4 ? 'b' : 'Space'];
    throw Error('Both visible registrations align but the observed round did not finish');
  };
  pilot.diagnostics = () => ({ policy, decisions, lastCue: lastCue ? structuredClone(lastCue) : null });
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
  assert.ok(end.calls > start.calls, 'Actual admitted calls advanced');
  assert.ok(end.workRotations > start.workRotations && end.lightRotations > start.lightRotations, 'Both physical adjustments occurred');
  assert.equal(end.phase, 'won'); assert.equal(end.score, 100); assert.equal(end.reason, '');
  assert.equal(end.geometry.matched, true); assert.equal(end.geometry.targetPassed, true); assert.equal(end.geometry.forbiddenPassed, true);
  assert.equal(end.adjustments.at(-1).matched, true); assert.equal(end.adjustments.at(-1).phase, 'won');
  const samples = [before, ...trace.map(row => row.snapshot ?? row), after].map(row => row.model).filter(Boolean);
  assert.ok(samples.some(s => s.yaw !== start.yaw), 'Observed workpiece bearing changed');
  assert.ok(samples.some(s => s.lamp !== start.lamp), 'Observed source bearing changed');
}
export function assertRetry({ after }, assert) {
  const s = after.model, clue = clues[s.level];
  assert.equal(s.phase, 'playing'); assert.equal(s.reason, ''); assert.equal(s.score, 0); assert.equal(s.focus, 0);
  assert.equal(s.yaw, clue.initialYaw); assert.equal(s.lamp, clue.initialLamp); assert.equal(s.geometry.matched, false);
  for (const field of ['adjustmentsUsed', 'workRotations', 'lightRotations', 'focusChanges']) assert.equal(s[field], 0, 'Retry clears ' + field);
  assert.deepEqual(s.adjustments, []); assert.equal(s.counterSaturated, false); assert.equal(s.clockSaturated, false);
  assert.deepEqual(s.lastHeld, { a: false, b: false, direction: 'none' });
  // Real neutral host calls may precede this sparse read; an exact create is recorded separately.
}
