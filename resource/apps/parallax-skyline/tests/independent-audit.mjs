/** Independent arithmetic from the three public specifications only.
 * This file neither imports nor reads the game, pilot, renderer or test source.
 * Calculated transitions are compared with one actual pair and then discarded.
 */
import { isDeepStrictEqual as equal } from 'node:util';

export const PUBLIC_DOCUMENT_SHA256 = Object.freeze({
  'public-design.md': 'cc8b11d7e8080fe910b6a0bc53e99fd951eb81885c7eb0a22ae6a5e2b49ea036',
  'model-contract.md': '059606d8195439ba5ebcc7225ddd1090e47898fcb157c10495d6de9aadfe5863',
  'public-interface.md': '58a99431116ba26a78f0f68aaf362a8c8ecbb2bdd207013b675d514a97a12400',
});
export const LIMITATIONS = Object.freeze([
  'Arithmetic checks establish consistency of recorded public facts, not source execution or artifact authenticity.',
  'No Model, renderer, pilot, formal-test source, private witness or diagnostic corpus is read or imported.',
  'Each transition starts from its actual recorded before state. Calculated states never become later observations.',
  'Sparse endpoints do not establish intervening calls, held-input continuity, undo history transitions or ordinary reachability.',
  'JSON cannot establish fresh object identity, accessor/Proxy behavior, missing native values or the truth of display prose.',
  'Model consistency does not establish browser lifecycle, trusted touch handling, visuals, performance or physical-device behavior.',
]);

const SCALES = [2, 1], OFFSETS = [[0, 0], [-4, -1]], BOUNDS = [[2, 5], [4, 14]];
const MAX = 2147483647, CLOCK_MAX = 3600;
const DIRECTIONS = ['none', 'up', 'down', 'left', 'right'];
const COUNTERS = ['calls', 'moves', 'undos', 'viewChanges', 'focusChanges'];
const INITIAL_MESSAGE = '上下选近层、远层或视角，左右调整；A 验收，B 撤销。';
const TASKS = [
  { profiles: [[2,4,5,4,2],[1,3,2,3,1]], initial: [5,4],
    targets: [[0,0,0,0,0,0,2,2,4,4,5,5,4,4,2,2,0,0,0,0],
      [0,0,2,2,4,4,5,5,4,4,2,3,1,0,0,0,0,0,0,0]], landmarks: [[0,2,10,5],[1,3,11,3]] },
  { profiles: [[3,5,3,6,2],[2,4,5,2,4]], initial: [2,13],
    targets: [[0,0,0,0,0,0,2,4,5,3,5,5,3,3,6,6,2,2,0,0],
      [0,0,0,0,3,3,5,5,3,4,6,6,2,2,0,0,0,0,0,0]], landmarks: [[0,3,14,6],[1,4,9,4]] },
  { profiles: [[2,6,3,5,4],[4,2,6,3,2]], initial: [5,4],
    targets: [[0,0,0,0,2,2,6,6,3,3,5,5,4,4,6,3,2,0,0,0],
      [2,2,6,6,3,3,5,5,4,4,0,4,2,6,3,2,0,0,0,0]], landmarks: [[0,1,6,6],[1,2,13,6]] },
];
const TASK_NAMES = [['courtyard','COURTYARD','庭院遮挡'], ['riverfront','RIVERFRONT','河岸交错'], ['twin-spires','TWIN SPIRES','双塔视差']];
const PUBLIC_CONFIG = { defaultSeed: 741, columns: 20, maxHeight: 6, scales: SCALES, offsets: OFFSETS,
  bounds: BOUNDS, focusNames: ['NEAR','FAR','VIEW'], attemptLimit: 4, historyLimit: 32,
  maxCounter: MAX, maxElapsed: CLOCK_MAX, tasks: TASKS.map((task, index) => ({
    id: TASK_NAMES[index][0], name: TASK_NAMES[index][1], nameZh: TASK_NAMES[index][2],
    profiles: task.profiles, initialPositions: task.initial, targets: task.targets,
    landmarks: task.landmarks.map(([layer, localColumn, column, height]) => ({ layer, localColumn, column, height })),
  })) };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value, lo, hi) => Number.isInteger(value) && value >= lo && value <= hi;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const copy = value => structuredClone(value);
const positionPair = value => Array.isArray(value) && value.length === 2
  && value.every((p, layer) => integer(p, ...BOUNDS[layer]));
const timestamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
function requireFact(ok, code, message) {
  if (!ok) { const error = new Error(message); error.auditCode = code; throw error; }
}
function project(level, positions) {
  const task = TASKS[level];
  return [0, 1].map(view => {
    const heights = Array(20).fill(0), owners = Array(20).fill(-1);
    for (let layer = 0; layer < 2; layer++) for (let j = 0; j < 5; j++) {
      const h = task.profiles[layer][j], start = SCALES[layer] * (positions[layer] + j) + OFFSETS[view][layer];
      for (let k = 0; k < SCALES[layer]; k++) {
        const u = start + k;
        if (h > heights[u] || (h === heights[u] && h > 0 && layer === 0)) {
          heights[u] = h; owners[u] = layer;
        }
      }
    }
    const [layer, localColumn, targetColumn, targetHeight] = task.landmarks[view];
    const column = SCALES[layer] * (positions[layer] + localColumn) + OFFSETS[view][layer];
    const height = task.profiles[layer][localColumn];
    const visible = owners[column] === layer && heights[column] === height;
    return { heights, owners, silhouetteMatched: equal(heights, task.targets[view]),
      anchor: { layer, localColumn, column, height, visible,
        matched: visible && column === targetColumn && height === targetHeight } };
  });
}
const checksOf = views => views.map(view => ({ silhouette: view.silhouetteMatched, anchor: view.anchor.matched }));
const allMatch = views => views.every(view => view.silhouetteMatched && view.anchor.matched);
function initial(seed, level) {
  const positions = [...TASKS[level].initial];
  return { schema: 1, seed, level, phase: 'playing', reason: '', positions, focus: 0, view: 0,
    views: project(level, positions), undoStack: [], failures: 0, score: 0, submissions: [],
    calls: 0, moves: 0, undos: 0, viewChanges: 0, focusChanges: 0, elapsed: 0,
    counterSaturated: false, clockSaturated: false, inputArmed: false, cancelEpoch: null,
    cancelledLast: false, lastHeld: { a: false, b: false, direction: 'none' },
    lastCommand: 'none', events: [], message: INITIAL_MESSAGE };
}
function checkState(state) {
  requireFact(object(state), 'state-object', 'Public model state must be an object.');
  requireFact(state.schema === 1 && integer(state.seed, 0, 4294967295) && integer(state.level, 0, 2),
    'state-identity', 'Invalid schema, normalized seed or level.');
  requireFact(positionPair(state.positions) && integer(state.focus, 0, 2) && integer(state.view, 0, 1),
    'placement', 'Invalid physical placement, focus or displayed view.');
  requireFact(equal(state.views, project(state.level, state.positions)), 'projection', 'Cached views differ from public geometry.');
  requireFact(Array.isArray(state.undoStack) && state.undoStack.length <= 32 && state.undoStack.every(positionPair),
    'history', 'Undo history must contain at most 32 legal full position pairs.');
  requireFact(COUNTERS.every(key => integer(state[key], 0, MAX)) && finite(state.elapsed)
    && state.elapsed >= 0 && state.elapsed <= CLOCK_MAX, 'counters', 'Invalid admitted counters or elapsed seconds.');
  requireFact(typeof state.counterSaturated === 'boolean' && typeof state.clockSaturated === 'boolean'
    && (!state.counterSaturated || COUNTERS.some(key => state[key] === MAX))
    && (!state.clockSaturated || state.elapsed === CLOCK_MAX), 'saturation', 'Invalid saturation flags.');
  if (!state.counterSaturated) requireFact(state.moves >= state.undos
    && state.undoStack.length <= state.moves - state.undos
    && COUNTERS.slice(1).every(key => state[key] <= state.calls), 'history-counts', 'History/counter identities differ.');
  requireFact(typeof state.inputArmed === 'boolean' && typeof state.cancelledLast === 'boolean'
    && (state.cancelEpoch === null || integer(state.cancelEpoch, 0, Number.MAX_SAFE_INTEGER))
    && (!state.cancelledLast || !state.inputArmed), 'input-gate', 'Invalid input gate or cancellation epoch.');
  requireFact(object(state.lastHeld) && equal(Object.keys(state.lastHeld).sort(), ['a','b','direction'])
    && typeof state.lastHeld.a === 'boolean' && typeof state.lastHeld.b === 'boolean'
    && DIRECTIONS.includes(state.lastHeld.direction) && [...DIRECTIONS, 'a', 'b'].includes(state.lastCommand),
  'held-state', 'Invalid previous held sample or selected command.');
  requireFact(typeof state.message === 'string' && state.message.length <= 160, 'message', 'Display message is missing or too long.');
  requireFact(integer(state.failures, 0, 4) && Array.isArray(state.submissions) && state.submissions.length <= 4,
    'submission-shape', 'Invalid failure count or receipt array.');
  let rejected = 0, won = false, lastCall = -1, lastElapsed = -1;
  for (let i = 0; i < state.submissions.length; i++) {
    const receipt = state.submissions[i];
    requireFact(object(receipt) && positionPair(receipt.positions), 'receipt-placement', 'Invalid receipt placement.');
    const checks = checksOf(project(state.level, receipt.positions)), matched = checks.every(row => row.silhouette && row.anchor);
    if (!matched) rejected++;
    requireFact(!won && receipt.index === i && equal(receipt.checks, checks) && receipt.matched === matched
      && receipt.failuresAfter === rejected && receipt.attemptsLeft === 4 - rejected,
    'receipt-result', 'A receipt disagrees with public geometry or failure accounting.');
    requireFact(integer(receipt.call, 1, state.calls) && receipt.call >= lastCall
      && (receipt.call > lastCall || receipt.call === MAX) && finite(receipt.elapsed)
      && receipt.elapsed >= 0 && receipt.elapsed <= state.elapsed && receipt.elapsed >= lastElapsed,
    'receipt-clock', 'Invalid receipt call/elapsed ordering.');
    won = matched; lastCall = receipt.call; lastElapsed = receipt.elapsed;
  }
  const phase = won ? 'won' : rejected === 4 ? 'lost' : 'playing';
  requireFact(state.failures === rejected && state.phase === phase && state.reason === (phase === 'lost' ? 'attempts' : '')
    && state.score === (won ? 100 : 0), 'outcome', 'Outcome, score and actual receipt history disagree.');
  if (phase !== 'playing') requireFact(equal(state.positions, state.submissions.at(-1).positions),
    'terminal-placement', 'Terminal placement differs from its final submission.');
  requireFact(Array.isArray(state.events) && state.events.length <= 1, 'events', 'At most one current-call event is allowed.');
  if (phase !== 'playing') requireFact(state.lastCommand === 'a' && state.events.length === 1,
    'terminal-event', 'Terminal submission event must remain frozen.');
  if (state.events.length) {
    const event = state.events[0];
    requireFact(object(event) && event.call === state.calls, 'event-call', 'Event call must match current admitted call.');
    const templates = {
      focus: { type: 'focus', focus: state.focus, call: state.calls }, view: { type: 'view', view: state.view, call: state.calls },
      undo: { type: 'undo', call: state.calls }, win: { type: 'win', call: state.calls },
      reject: { type: 'reject', call: state.calls }, collision: { type: 'collision', reason: 'attempts', call: state.calls },
    };
    if (event.type === 'move') requireFact(integer(event.layer, 0, 1) && event.layer === state.focus
      && integer(event.from, ...BOUNDS[event.layer]) && event.to === state.positions[event.layer]
      && Math.abs(event.to - event.from) === 1
      && equal(Object.keys(event).sort(), ['call','from','layer','to','type']), 'move-event', 'Invalid physical-move event.');
    else requireFact(own(templates, event.type) && equal(event, templates[event.type]), 'event-shape', 'Event differs from public schema.');
    const commands = { focus: ['up','down'], move: ['left','right'], view: ['left','right'], undo: ['b'],
      win: ['a'], reject: ['a'], collision: ['a'] };
    requireFact(commands[event.type]?.includes(state.lastCommand), 'event-command', 'Event and selected command disagree.');
    if (['win','reject','collision'].includes(event.type)) requireFact(state.submissions.length > 0
      && state.submissions.at(-1).call === state.calls && equal(state.submissions.at(-1).positions, state.positions)
      && event.type === (phase === 'won' ? 'win' : phase === 'lost' ? 'collision' : 'reject'),
    'settlement-event', 'Submission event and outcome disagree.');
  }
}
export function validateEndpoint(state) {
  try { checkState(state); return { verdict: 'checked', findings: [] }; }
  catch (error) { return { verdict: 'mismatch', findings: [{ verdict: 'mismatch', code: error.auditCode ?? 'invalid-state', message: error.message }] }; }
}
function normalize(input) {
  let values = {};
  try {
    if (object(input)) for (const key of ['x','y','a','b','cancelled','paused','cancelEpoch']) {
      const descriptor = Object.getOwnPropertyDescriptor(input, key);
      if (descriptor && own(descriptor, 'value')) values[key] = descriptor.value;
    }
  } catch { values = {}; }
  const axis = value => finite(value) ? Math.max(-1, Math.min(1, value)) : 0;
  const x = axis(values.x), y = axis(values.y), ax = Math.abs(x), ay = Math.abs(y);
  const direction = Math.max(ax, ay) <= .5 ? 'none' : ay >= ax ? (y > 0 ? 'down' : 'up') : (x > 0 ? 'right' : 'left');
  return { a: values.a === true, b: values.b === true, cancelled: values.cancelled === true,
    paused: values.paused === true, cancelEpoch: integer(values.cancelEpoch, 0, Number.MAX_SAFE_INTEGER) ? values.cancelEpoch : null, direction };
}
function expectedPair(before, dt, input) {
  const next = copy(before);
  if (before.phase !== 'playing') return { next, kind: 'terminal-no-op' };
  if (!finite(dt) || dt <= 0 || dt > .25) return { next, kind: 'invalid-dt-no-op' };
  const raw = normalize(input);
  if (raw.paused) return { next, kind: 'paused-no-op', raw };
  const increment = key => { if (next[key] + 1 > MAX) next.counterSaturated = true; next[key] = Math.min(MAX, next[key] + 1); };
  increment('calls');
  if (before.elapsed + dt > CLOCK_MAX) next.clockSaturated = true;
  next.elapsed = Math.min(CLOCK_MAX, before.elapsed + dt); next.events = []; next.lastCommand = 'none';
  const cancelEdge = (raw.cancelEpoch !== null && before.cancelEpoch !== null && raw.cancelEpoch !== before.cancelEpoch)
    || (raw.cancelled && !before.cancelledLast);
  if (cancelEdge) next.inputArmed = false;
  if (raw.cancelEpoch !== null) next.cancelEpoch = raw.cancelEpoch;
  next.cancelledLast = raw.cancelled;
  if (next.inputArmed && !raw.cancelled) {
    if (raw.b && !before.lastHeld.b) next.lastCommand = 'b';
    else if (raw.a && !before.lastHeld.a) next.lastCommand = 'a';
    else if (raw.direction !== 'none' && raw.direction !== before.lastHeld.direction) next.lastCommand = raw.direction;
  }
  next.lastHeld = { a: raw.a, b: raw.b, direction: raw.direction };
  if (!raw.cancelled && !raw.a && !raw.b && raw.direction === 'none') next.inputArmed = true;
  const command = next.lastCommand, emit = event => { next.events = [{ ...event, call: next.calls }]; };
  if (command === 'up' || command === 'down') {
    next.focus = (before.focus + (command === 'up' ? 2 : 1)) % 3;
    increment('focusChanges'); emit({ type: 'focus', focus: next.focus });
  } else if (command === 'left' || command === 'right') {
    if (before.focus === 2) {
      next.view = command === 'left' ? 0 : 1;
      if (next.view !== before.view) { increment('viewChanges'); emit({ type: 'view', view: next.view }); }
    } else {
      const layer = before.focus, from = before.positions[layer], to = from + (command === 'left' ? -1 : 1);
      if (integer(to, ...BOUNDS[layer])) {
        next.undoStack.push([...before.positions]); if (next.undoStack.length > 32) next.undoStack.shift();
        next.positions[layer] = to; increment('moves'); next.views = project(next.level, next.positions);
        emit({ type: 'move', layer, from, to });
      }
    }
  } else if (command === 'b' && before.undoStack.length) {
    next.positions = [...next.undoStack.pop()]; increment('undos'); next.views = project(next.level, next.positions); emit({ type: 'undo' });
  } else if (command === 'a') {
    next.views = project(next.level, next.positions); const matched = allMatch(next.views);
    if (matched) { next.phase = 'won'; next.score = 100; emit({ type: 'win' }); }
    else { next.failures++; if (next.failures === 4) { next.phase = 'lost'; next.reason = 'attempts'; emit({ type: 'collision', reason: 'attempts' }); }
      else emit({ type: 'reject' }); }
    next.submissions.push({ index: before.submissions.length, call: next.calls, elapsed: next.elapsed,
      positions: [...next.positions], checks: checksOf(next.views), matched, failuresAfter: next.failures, attemptsLeft: 4 - next.failures });
  }
  return { next, kind: 'admitted', raw, command };
}
function semanticState(state) { const result = copy(state); delete result.message; return result; }
function addFinding(findings, scope, code, message, verdict = 'mismatch') { findings.push({ verdict, scope, code, message }); }
function pairMechanisms(before, after, calculated, mechanisms, movedLayers) {
  const add = key => { mechanisms[key] = (mechanisms[key] ?? 0) + 1; };
  if (calculated.kind !== 'admitted') { add(calculated.kind); return; }
  const raw = calculated.raw, event = after.events[0];
  if (!before.inputArmed && after.inputArmed) add('neutralRearms');
  if (event?.type === 'move') { add(event.layer === 0 ? 'nearMoves' : 'farMoves'); movedLayers.add(event.layer); }
  if (event?.type === 'view') add('viewSwitchesPreservingPlacements');
  if (event?.type === 'undo') { add('wholePairUndos'); if (movedLayers.size === 2) add('undoAfterBothLayersMoved'); if (before.failures > 0) add('undoRetainingFailedSubmissions'); }
  if (calculated.command === 'a' && !allMatch(before.views) && before.views[0].silhouetteMatched && before.views[0].anchor.matched) add('frontOnlyRejected');
  if (after.phase === 'won' && before.failures === 3) add('lastChanceWins');
  if (raw.a && before.lastHeld.a && calculated.command !== 'a') add('heldANotRepeated');
  if (raw.direction !== 'none' && raw.direction === before.lastHeld.direction && !DIRECTIONS.slice(1).includes(calculated.command)) add('heldDirectionNotRepeated');
  if (raw.a && raw.b && !before.lastHeld.a && !before.lastHeld.b && calculated.command === 'b') add('simultaneousBPriority');
  if (['left','right'].includes(calculated.command) && before.focus < 2 && !event) add('boundedMoveNoOps');
  if ((raw.cancelled || !before.inputArmed) && calculated.command === 'none' && (raw.a || raw.b || raw.direction !== 'none')) add('heldSamplesQuarantined');
}
export function auditModelRun(run) {
  const findings = [], mechanisms = {}, movedLayers = new Set();
  const origin = run?.origin, calls = run?.calls, end = run?.end;
  const report = { runId: origin?.runId ?? null, channel: 'model', level: origin?.level ?? null,
    verdict: 'not-observed', completeCoverage: false, outcome: null, naturalLoss: false, findings,
    counts: { recordedCalls: Array.isArray(calls) ? calls.length : 0, checkedPairs: 0, checkedEndpoints: 0 }, mechanisms, limitations: [...LIMITATIONS] };
  if (!object(run) || run.kind !== 'parallax-skyline-ordinary-run' || own(run, 'pilotDiagnostics') || !object(origin) || !Array.isArray(calls) || !object(end)) {
    addFinding(findings, 'run', 'run-schema', 'Expected the designated public ordinary run without pilotDiagnostics.'); report.verdict = 'mismatch'; return report;
  }
  const validIdentity = integer(origin.seed, 0, 4294967295) && integer(origin.level, 0, 2);
  if (!validIdentity || origin.kind !== 'origin' || typeof origin.runId !== 'string' || !origin.runId
      || origin.origin !== 'create' || origin.channel !== 'model' || origin.completeCallCapture !== true
      || !equal(origin.created, validIdentity ? initial(origin.seed, origin.level) : null)) addFinding(findings, 'origin', 'create-origin', 'Actual origin does not match the specified fresh public create state.');
  if (!equal(origin.publicConfig, PUBLIC_CONFIG)) addFinding(findings, 'origin', 'public-configuration', 'Observed public configuration differs from the frozen public rules.');
  const startCheck = validateEndpoint(origin.created);
  if (startCheck.verdict === 'checked') report.counts.checkedEndpoints++;
  else for (const finding of startCheck.findings) findings.push({ ...finding, scope: 'origin' });
  let previousActual = origin.created, previousActualKnown = own(origin, 'created');
  let previousTime = timestamp(origin.observedAt) ? Date.parse(origin.observedAt) : null;
  if (previousTime === null) addFinding(findings, 'origin', 'observation-time', 'Actual origin timestamp is missing or invalid.');
  for (let index = 0; index < calls.length; index++) {
    const row = calls[index], scope = `call:${index + 1}`, firstFinding = findings.length;
    if (!object(row) || row.kind !== 'call' || row.seq !== index + 1 || !['dt','input','before','after'].every(key => own(row, key))) {
      addFinding(findings, scope, 'missing-call', 'The actual call sequence or before/after/input/dt evidence is incomplete.', 'not-observed');
      previousActual = row?.after; previousActualKnown = object(row) && own(row, 'after'); continue;
    }
    if (row.error !== null) addFinding(findings, scope, 'call-error', 'An actual call error must be retained and resolved, not treated as a checked transition.');
    if (!previousActualKnown) addFinding(findings, scope, 'chain-gap', 'No preceding actual after state is available; this link remains unobserved.', 'not-observed');
    else if (!equal(row.before, previousActual)) addFinding(findings, scope, 'chain-link', 'Actual before state does not equal the preceding actual observation.');
    const now = timestamp(row.observedAt) ? Date.parse(row.observedAt) : null;
    if (now === null || (previousTime !== null && now < previousTime)) addFinding(findings, scope, 'observation-time', 'Call timestamps are absent, invalid or reversed.');
    if (now !== null) previousTime = now;
    const beforeCheck = validateEndpoint(row.before), afterCheck = validateEndpoint(row.after);
    for (const [label, checked] of [['before', beforeCheck], ['after', afterCheck]]) {
      if (checked.verdict === 'checked') report.counts.checkedEndpoints++;
      else for (const finding of checked.findings) findings.push({ ...finding, scope: `${scope}:${label}` });
    }
    if (beforeCheck.verdict === 'checked' && afterCheck.verdict === 'checked') {
      const calculated = expectedPair(row.before, row.dt, row.input);
      const same = calculated.kind === 'admitted' ? equal(semanticState(row.after), semanticState(calculated.next)) : equal(row.after, calculated.next);
      if (!same) addFinding(findings, scope, 'transition', 'Actual after state disagrees with the independently calculated public transition.');
      if (findings.length === firstFinding) { report.counts.checkedPairs++; pairMechanisms(row.before, row.after, calculated, mechanisms, movedLayers); }
    }
    previousActual = row.after; // Only the actual observation is carried to the next chain-link check.
    previousActualKnown = true;
  }
  if (end.kind !== 'end' || end.calls !== calls.length || end.complete !== true || end.failure !== null
      || end.outcome !== end.final?.phase || end.reason !== end.final?.reason)
    addFinding(findings, 'end', 'end-receipt', 'End receipt does not describe the complete actual call chain.');
  if (previousActualKnown) {
    if (!equal(end.final, previousActual)) addFinding(findings, 'end', 'end-link', 'End state differs from the last actual after state.');
  } else {
    addFinding(findings, 'end', 'end-gap', 'The final call has no actual after state; end continuity remains unobserved.', 'not-observed');
    const checked = validateEndpoint(end.final);
    if (checked.verdict === 'checked') report.counts.checkedEndpoints++;
    else for (const finding of checked.findings) findings.push({ ...finding, scope: 'end' });
  }
  if (!timestamp(end.observedAt) || (previousTime !== null && Date.parse(end.observedAt) < previousTime))
    addFinding(findings, 'end', 'observation-time', 'End timestamp is missing, invalid or earlier than an actual call.');
  report.outcome = end.final?.phase ?? null;
  if (!['won','lost'].includes(report.outcome)) addFinding(findings, 'end', 'ordinary-outcome', 'No actual terminal ordinary outcome was observed.', 'not-observed');
  report.verdict = findings.some(f => f.verdict === 'mismatch') ? 'mismatch' : findings.length ? 'not-observed' : 'checked';
  report.completeCoverage = report.verdict === 'checked' && report.counts.checkedPairs === calls.length && calls.length > 0;
  report.naturalLoss = report.completeCoverage && report.outcome === 'lost' && previousActual.failures === 4
    && previousActual.submissions.length === 4 && previousActual.submissions.every(receipt => receipt.matched === false);
  report.mechanismScope = 'Counts include only individually checked actual call pairs; they do not establish browser-visible or physical-device behavior.';
  return report;
}
export function auditSparseRun(run) {
  const findings = [], mechanisms = {}, rows = run?.observations;
  const report = { runId: run?.runId ?? null, channel: run?.channel ?? 'sparse', level: run?.level ?? null, seed: run?.seed ?? null,
    verdict: 'not-observed', continuousCoverage: 'not-observed', findings,
    counts: { observations: Array.isArray(rows) ? rows.length : 0, checkedEndpoints: 0,
      unobservedGaps: Array.isArray(rows) ? Math.max(0, rows.length - 1) : 0, checkedPairs: 0 }, mechanisms, limitations: [...LIMITATIONS] };
  if (!object(run) || own(run, 'pilotDiagnostics') || !Array.isArray(rows) || !Array.isArray(run.calls) || run.calls.length) {
    addFinding(findings, 'sparse', 'sparse-schema', 'Sparse public input must retain observations and an empty calls array.'); report.verdict = 'mismatch'; return report;
  }
  if (!rows.length) addFinding(findings, 'sparse', 'missing-endpoints', 'No actual sparse endpoints were supplied.', 'not-observed');
  let priorSeq = -1, priorIndex = -1, priorTime = null, priorReadEnd = null;
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index], scope = `observation:${index}`, firstFinding = findings.length;
    if (!object(row)) { addFinding(findings, scope, 'observation-schema', 'Observation must be an object.'); continue; }
    if (!integer(row.seq, 0, Number.MAX_SAFE_INTEGER) || row.seq <= priorSeq) addFinding(findings, scope, 'observation-sequence', 'Observation ordinals must strictly increase.');
    if (!integer(row.sourceObservationIndex, 0, Number.MAX_SAFE_INTEGER) || row.sourceObservationIndex <= priorIndex)
      addFinding(findings, scope, 'source-index', 'Actual source observation indices must strictly increase.');
    priorSeq = row.seq; priorIndex = row.sourceObservationIndex;
    if (own(row, 'observedAt')) {
      const time = timestamp(row.observedAt) ? Date.parse(row.observedAt) : null;
      if (time === null || (priorTime !== null && time < priorTime)) addFinding(findings, scope, 'observation-time', 'Actual sparse timestamps are invalid or reversed.');
      if (time !== null) priorTime = time;
    }
    if (own(row, 'readStartedAt') || own(row, 'readCompletedAt')) {
      if (!finite(row.readStartedAt) || !finite(row.readCompletedAt) || row.readStartedAt < 0 || row.readCompletedAt < row.readStartedAt
          || (priorReadEnd !== null && row.readStartedAt < priorReadEnd)) addFinding(findings, scope, 'read-window', 'Actual sparse read windows are invalid or overlap out of order.');
      priorReadEnd = row.readCompletedAt;
    }
    if (!own(row, 'observedAt') && !own(row, 'readStartedAt')) addFinding(findings, scope, 'missing-timing', 'No actual timestamp or read window is supplied.', 'not-observed');
    const state = row.model ?? row.state?.model;
    if (row.model !== undefined && row.state?.model !== undefined && !equal(row.model, row.state.model)) addFinding(findings, scope, 'ambiguous-model', 'Two supplied model observations disagree.');
    const checked = validateEndpoint(state);
    for (const finding of checked.findings) findings.push({ ...finding, scope });
    if (report.level === null && checked.verdict === 'checked') report.level = state.level;
    if (report.seed === null && checked.verdict === 'checked') report.seed = state.seed;
    if (checked.verdict === 'checked' && state.level !== report.level) addFinding(findings, scope, 'task-identity', 'Task identity changed inside one sparse run.');
    if (checked.verdict === 'checked' && state.seed !== report.seed) addFinding(findings, scope, 'seed-identity', 'Seed identity changed inside one sparse run.');
    if (checked.verdict === 'checked' && findings.length === firstFinding) {
      report.counts.checkedEndpoints++;
      const add = key => { mechanisms[key] = (mechanisms[key] ?? 0) + 1; };
      if (state.views[0].silhouetteMatched && state.views[0].anchor.matched && !allMatch(state.views)) add('frontOnlyMatchingEndpoints');
      if (state.phase === 'playing' && allMatch(state.views)) add('readyButUnsubmittedEndpoints');
      if (state.views.some(view => !view.anchor.visible)) add('hiddenLandmarkEndpoints');
      if (state.phase === 'won') add('wonEndpoints'); if (state.phase === 'lost') add('lostEndpoints');
    }
  }
  report.verdict = findings.some(f => f.verdict === 'mismatch') ? 'mismatch' : findings.length ? 'not-observed' : 'checked';
  report.mechanismScope = 'Endpoint geometry only. No action, transition, duration, reachability or continuity is inferred between reads.';
  return report;
}
