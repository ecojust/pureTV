// Observation-only current-guide policy. No Model import, target controls or future sampling.
export const budgets = Object.freeze({ maxWebGLDrawCalls: 1, maxCanvasPaintCommands: 0 });
function check(condition, message) { if (!condition) throw Error(message); }
export function createPilot({ policy = 'align' } = {}) {
  check(['align', 'reject', 'timeout'].includes(policy), 'Unknown public-feedback policy');
  let decisions = 0, lastCue = null, actualOrigin = null;
  const pilot = snapshot => {
    decisions++;
    const s = snapshot?.model;
    if (!s || snapshot.paused || snapshot.phase !== 'playing' || s.phase !== 'playing') return [];
    if (!actualOrigin) actualOrigin = { layers: structuredClone(s.layers), failures: s.failures, submissions: s.submissions.length };
    if (policy === 'timeout') { lastCue = { kind: 'fresh-neutral-idle', observedElapsed: s.elapsed }; return []; }
    if (!s.inputArmed || s.lastHeld.a || s.lastHeld.b || s.lastHeld.direction !== 'none') return [];
    check(s.optics?.layers?.length === 2 && s.optics.probes?.length === 5, 'Current public optical feedback unavailable');
    if (policy === 'reject') {
      check(actualOrigin.failures === 0 && actualOrigin.submissions === 0, 'Natural rejection starts at a fresh observed round');
      check(JSON.stringify(s.layers) === JSON.stringify(actualOrigin.layers), 'Natural rejection keeps actual initial masks unchanged');
      check(!s.optics.matched, 'Fresh unchanged optical arrangement unexpectedly matches');
      lastCue = { kind: 'fresh-current-rejection', observedFailures: s.failures, currentMatched: s.optics.probes.map(p => p.matched) };
      return ['Space'];
    }
    if (s.optics.probes.every(p => p.matched)) {
      check(s.optics.matched === true, 'All current flags disagree with the optical conjunction');
      lastCue = { kind: 'all-five-current-checks', currentMatched: s.optics.probes.map(p => p.matched) };
      return ['Space'];
    }
    const turn = s.optics.layers.find(layer => !layer.guide.turnAligned);
    const layer = turn || s.optics.layers.find(row => !row.guide.phaseAligned);
    check(layer, 'All visible guides align but current optical probes still fail');
    const error = turn ? layer.guide.turnErrorDegrees : layer.guide.phaseError;
    check(Number.isFinite(error) && error !== 0, 'Nonaligned guide has invalid signed current error');
    lastCue = { kind: turn ? 'current-turn-guide' : 'current-crest-guide', layer: layer.index, signedError: error,
      errorUnits: turn ? 'degrees' : 'cycles', selected: s.selected };
    if (s.selected !== layer.index) return ['b'];
    // Left increases phase and moves physical crests left; a positive crest error therefore asks for Right.
    return [turn ? (error > 0 ? 'ArrowUp' : 'ArrowDown') : (error > 0 ? 'ArrowRight' : 'ArrowLeft')];
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
  assert.ok(end.calls > start.calls && end.adjustments > start.adjustments, 'Actual optical adjustments advanced');
  assert.equal(end.phase, 'won'); assert.equal(end.score, 100); assert.equal(end.reason, '');
  assert.equal(end.optics.matched, true); assert.equal(end.optics.probes.length, 5); assert.ok(end.optics.probes.every(p => p.matched));
  assert.ok(end.elapsed > start.elapsed && end.elapsed < 90); assert.equal(end.failures, 0);
  assert.equal(end.submissions.length, 1); assert.equal(end.submissions[0].matched, true); assert.equal(end.submissions[0].phase, 'won');
  assert.deepEqual(end.submissions[0].layers, end.layers); assert.deepEqual(end.submissions[0].probes, end.optics.probes);
  assert.equal(end.terminalReceipt.cause, 'success'); assert.deepEqual(end.terminalReceipt.probes, end.optics.probes);
  const samples = [before, ...trace.map(row => row.snapshot ?? row), after].map(row => row.model).filter(Boolean);
  for (let layer = 0; layer < 2; layer++) assert.ok(samples.some(s => JSON.stringify(s.layers[layer]) !== JSON.stringify(start.layers[layer])), 'Observed mask changed: ' + layer);
  assert.ok(samples.some(s => s.phase === 'playing' && s.optics.matched && s.submissions.length === 0), 'Current simultaneous match remained playing until A');
}
export function assertRetry({ after, initial }, assert) {
  const s = after.model;
  // Public initial controls only, used to check actual retry feedback, never by the pilot.
  const pairs = [[[6, -2], [18, 2]], [[2, -1], [22, 1]], [[12, -2], [10, 2]]][s.level];
  const layers = pairs.map(([phaseTick, angleTick]) => ({ phaseTick, angleTick }));
  assert.equal(s.phase, 'playing'); assert.equal(s.reason, ''); assert.equal(s.score, 0); assert.equal(s.selected, 0);
  assert.deepEqual(s.layers, layers); assert.equal(s.optics.matched, false); assert.equal(s.terminalReceipt, null);
  for (const field of ['adjustments', 'switches', 'blockedTurns', 'failures']) assert.equal(s[field], 0, 'Retry clears ' + field);
  assert.deepEqual(s.submissions, []); assert.equal(s.counterSaturated, false);
  assert.deepEqual(s.lastHeld, { a: false, b: false, direction: 'none' });
  if (initial) assert.deepEqual(s.optics, initial.model.optics);
  // Real neutral host calls may precede this sparse read; exact creation is retained separately.
}
