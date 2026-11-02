// Observation-only current-guide controller. No Model import or future geometry calculation.
// Every command follows the signed anchor/clamp gap currently drawn by the public interface.
export const budgets = Object.freeze({ maxWebGLDrawCalls: 1, maxCanvasPaintCommands: 0 });
function check(condition, message) { if (!condition) throw Error(message); }
const axisKey = (axis, sign) => axis === 'x' ? (sign < 0 ? 'ArrowLeft' : 'ArrowRight') : (sign < 0 ? 'ArrowUp' : 'ArrowDown');
function selectTerminal(s, target) {
  if (s.selected === target) return null;
  const count = s.geometry.rails.length, forward = (target - s.selected + count) % count;
  return [forward <= count / 2 ? 'Space' : 'b'];
}
export function createPilot({ policy = 'align' } = {}) {
  check(['align', 'exhaust'].includes(policy), 'Unknown public-feedback policy');
  let decisions = 0, lastCue = null, actualOrigin = null;
  const pilot = snapshot => {
    decisions++;
    const s = snapshot?.model;
    if (!s || snapshot.paused || snapshot.phase !== 'playing' || s.phase !== 'playing') return [];
    if (!actualOrigin) actualOrigin = { positions: [...s.positions], movesUsed: s.movesUsed };
    if (!s.inputArmed || s.lastHeld.a || s.lastHeld.b || s.lastHeld.direction !== 'none') return [];
    check(s.geometry?.groups?.length > 0 && s.geometry.rails.length === 3, 'Public task geometry unavailable');
    if (policy === 'exhaust') {
      check(actualOrigin.movesUsed === 0, 'Natural-loss policy requires a fresh observed origin');
      check(s.positions.slice(1).every((value, i) => value === actualOrigin.positions[i + 1]), 'Natural loss leaves other groups at their actual initial positions');
      const first = s.geometry.groups[0], sign = s.movesUsed % 2 === 0 ? 1 : -1;
      lastCue = { kind: 'first-group-alternation', group: first.id, axis: first.axis, sign, actualUsed: s.movesUsed };
      return selectTerminal(s, 0) || [axisKey(first.axis, sign)];
    }
    const group = s.geometry.groups.find(row => row.guideErrorNumerator !== 0);
    check(group, 'All visible guides align but the observed round did not finish');
    check(Number.isInteger(group.guideErrorNumerator) && ['x', 'y'].includes(group.axis), 'Invalid current visible guide');
    const selected = s.geometry.nodes.find(node => node.terminalIndex === s.selected);
    const target = s.geometry.nodes.find(node => node.terminalIndex !== null && group.members.includes(node.id));
    check(target && selected, 'Visible group membership unavailable');
    lastCue = { kind: 'current-visible-guide', group: group.id, axis: group.axis, currentNumerator: group.guideCurrentNumerator,
      denominator: group.guideDenominator, reference: group.guideReference, errorNumerator: group.guideErrorNumerator };
    if (!group.members.includes(selected.id)) return selectTerminal(s, target.terminalIndex);
    return [axisKey(group.axis, -Math.sign(group.guideErrorNumerator))];
  };
  pilot.diagnostics = () => ({ policy, decisions, lastCue: lastCue ? structuredClone(lastCue) : null, actualOrigin: actualOrigin ? structuredClone(actualOrigin) : null });
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
  assert.ok(end.calls > start.calls && end.movesUsed > start.movesUsed, 'Actual admitted calls and physical adjustments advanced');
  assert.equal(end.phase, 'won'); assert.equal(end.score, 100); assert.equal(end.reason, '');
  assert.equal(end.geometry.matched, true); assert.equal(end.geometry.conflictCount, 0);
  assert.deepEqual(end.geometry.coincidentNodes, []); assert.deepEqual(end.geometry.zeroLengthEdges, []); assert.equal(end.geometry.railsValid, true);
  assert.equal(end.moves.at(-1).matched, true); assert.equal(end.moves.at(-1).phase, 'won');
  const samples = [before, ...trace.map(row => row.snapshot ?? row), after].map(row => row.model).filter(Boolean);
  assert.ok(samples.some(s => s.positions.some((value, i) => value !== start.positions[i])), 'Observed physical terminal position changed');
}
export function assertRetry({ after }, assert) {
  const s = after.model;
  // These are the three public initial placements, used only to check actual retry feedback.
  const initial = [[8, 5, 2], [6, 2], [3, -1]][s.level];
  assert.equal(s.phase, 'playing'); assert.equal(s.reason, ''); assert.equal(s.score, 0); assert.equal(s.selected, 0);
  assert.deepEqual(s.positions, initial); assert.equal(s.geometry.matched, false);
  for (const field of ['movesUsed', 'selectionChanges', 'blockedMoves']) assert.equal(s[field], 0, 'Retry clears ' + field);
  assert.deepEqual(s.moves, []); assert.equal(s.counterSaturated, false); assert.equal(s.clockSaturated, false);
  assert.deepEqual(s.lastHeld, { a: false, b: false, direction: 'none' });
  // Real neutral host calls may precede this sparse read; an exact create is recorded separately.
}
