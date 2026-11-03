/*
 * Moiré Atelier independent PUBLIC-only auditor, version 1.
 * Optical arithmetic and rules authored from accepted game44 public documents.
 * Reporting shape adapts the authorized game43 public-only auditor baseline.
 * No production imports, private helpers, pilot policy, search, or hidden witness.
 * Full expectations begin with each ACTUAL before; calculated results never feed forward.
 * Sparse endpoints do not establish intervening calls, releases, gates, or lifecycle.
 */

const INITIAL_MESSAGE = '左右滑纹，上下旋转；B 切换膜，A 同时验收五个测点。';
const LIMIT = 2147483647;
const DIRECTIONS = ['none', 'up', 'down', 'left', 'right'];
const COMMANDS = [...DIRECTIONS, 'a', 'b'];
const INPUT_KEYS = ['x', 'y', 'a', 'b', 'cancelEpoch', 'cancelled', 'paused'];
const ACCEPTED_DOC_DIGESTS = {
  publicDesign: 'f4bece2841ff69281b1ccd46ce82b8d2552a235dadd0eb889a5ca9c0a673ea87',
  modelContract: 'bc5105bcff12c9cde2acddb649c7dd7beaab9d401e661897a4210f889e3fdb5d',
  publicInterface: 'd089af47d695bf8770e1b8f49e5e07d4aadad169db036b12a8e569e3030b7094',
};
const finite = value => typeof value === 'number' && Number.isFinite(value);
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const copy = value => Array.isArray(value) ? value.map(copy) : object(value)
  ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)])) : value;
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
const wrap = value => value - Math.floor(value);
const transmission = cycles => (1 + Math.cos(2 * Math.PI * wrap(cycles))) / 2;
const point = (x, y) => ({x, y});
function reference(guide) {
  const dx = guide.end.x - guide.pin.x, dy = guide.end.y - guide.pin.y;
  const length = Math.hypot(dx, dy);
  return {x: dy / length, y: -dx / length};
}
function descriptor(id, name, nameZh, initial, fiducials, positions) {
  const guides = fiducials.map(([x, y, dx, dy]) => ({pin: point(x, y), end: point(x + dx, y + dy)}));
  const normals = guides.map(reference);
  const probes = positions.map(([x, y], i) => {
    const cycles = guides.map((guide, layer) => [24, 25][layer]
      * (normals[layer].x * (x - guide.pin.x) + normals[layer].y * (y - guide.pin.y)));
    return {id: ['C', '1', '2', '3', '4'][i], position: point(x, y), targetPhases: cycles.map(wrap),
      targetBrightness: transmission(cycles[0]) * transmission(cycles[1]), tolerance: 0.035};
  });
  return {id, name, nameZh, initialLayers: initial.map(([phaseTick, angleTick]) => ({phaseTick, angleTick})), guides, probes};
}
const c3 = Math.cos(Math.PI / 60), s3 = Math.sin(Math.PI / 60);
const c6 = Math.cos(Math.PI / 30), s6 = Math.sin(Math.PI / 30);
export const PUBLIC_CONFIG = freeze({
  defaultSeed: 744, board: {minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5},
  sampleBounds: {min: -1, max: 1}, frequencies: [24, 25], phaseSteps: 24,
  angleStepDegrees: 3, angleBounds: [-4, 4], timeLimit: 90, attemptLimit: 4,
  probeTolerance: 0.035, guideTolerance: 1e-9, maxCounter: LIMIT,
  tasks: [
    descriptor('parallel-light', 'PARALLEL LIGHT', '平行光纹', [[6, -2], [18, 2]],
      [[0, 0, 0, 0.36], [0, 0, 0, 0.36]],
      [[0, 0], [-3 / 8, -1 / 4], [-1 / 96, 1 / 4], [13 / 48, -0.22], [5 / 24, 0.26]]),
    descriptor('crossed-silk', 'CROSSED SILK', '交织细幕', [[2, -1], [22, 1]],
      [[c3 / 192, s3 / 192, -0.36 * s3, 0.36 * c3], [-c3 / 150, s3 / 150, 0.36 * s3, 0.36 * c3]],
      [[0, 0], [-0.34, -0.25], [-0.20, 0.28], [0.16, -0.30], [0.34, 0.24]]),
    descriptor('oblique-study', 'OBLIQUE STUDY', '斜光习作', [[12, -2], [10, 2]],
      [[-c6 / 96, -s6 / 96, -0.36 * s6, 0.36 * c6], [c6 / 75, -s6 / 75, 0.36 * s6, 0.36 * c6]],
      [[0, 0], [-0.32, -0.28], [-0.27, 0.25], [0.25, -0.25], [0.32, 0.29]]),
  ],
});

function equal(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b)
    && a.length === b.length && a.every((value, i) => equal(value, b[i]));
  if (!object(a) || !object(b)) return false;
  const ak = Object.keys(a).sort(), bk = Object.keys(b).sort();
  return equal(ak, bk) && ak.every(key => equal(a[key], b[key]));
}
function report(mode) {
  return {auditorVersion: 1, game: 'moire-atelier', mode, ok: true,
    acceptedPublicDocHashes: copy(ACCEPTED_DOC_DIGESTS),
    counts: {endpoints: 0, fullPairs: 0, sparseIntervals: 0, declaredBoundaryGaps: 0}, findings: [], limits: []};
}
function requireThat(r, condition, path, detail) {
  if (!condition) { r.ok = false; r.findings.push({path, detail}); }
  return condition;
}
const expect = (r, actual, expected, path) => requireThat(r, equal(actual, expected), path, {expected, actual});
const keysExactly = (r, value, keys, path) => requireThat(r,
  object(value) && equal(Object.keys(value).sort(), [...keys].sort()), path, 'Exact documented fields required.');
function guarded(r, path, callback) {
  try { return callback(); }
  catch (error) { requireThat(r, false, path, `Malformed public projection: ${String(error.message || error)}`); return null; }
}
function checkSources(r, sources, path) {
  if (!requireThat(r, object(sources) && Object.keys(sources).length > 0, path, 'Nonempty declared sourceHashes map required.')) return;
  for (const [name, value] of Object.entries(sources)) {
    requireThat(r, name.length > 0, path, 'Source name must be nonempty.');
    requireThat(r, typeof value === 'string' && /^[a-f0-9]{64}$/.test(value), `${path}.${name}`, 'Lowercase SHA256 digest required; source authenticity is not established.');
  }
}
const timestamp = (r, value, path) => requireThat(r, typeof value === 'string' && Number.isFinite(Date.parse(value)), path, 'Actual UTC observation timestamp required.');
function checkDocHashes(r, sources, path) {
  checkSources(r, sources, path);
  for (const [name, digest] of Object.entries(ACCEPTED_DOC_DIGESTS))
    requireThat(r, object(sources) && Object.values(sources).includes(digest), `${path}.${name}`, 'Accepted canonical public-document digest must be retained.');
}
function checkLayers(r, layers, path) {
  if (!requireThat(r, Array.isArray(layers) && layers.length === 2, path, 'Two canonical layer controls required.')) return false;
  return layers.map((layer, i) => keysExactly(r, layer, ['phaseTick', 'angleTick'], `${path}[${i}]`)
    && requireThat(r, integer(layer.phaseTick, 0, 23) && integer(layer.angleTick, -4, 4), `${path}[${i}]`, 'Legal integer phase and angle detents required.')).every(Boolean);
}

// Evaluates only an ACTUALLY supplied layer pair. No controls are searched or proposed.
function optics(level, controls) {
  const task = PUBLIC_CONFIG.tasks[level];
  const layers = controls.map((control, index) => {
    const frequency = PUBLIC_CONFIG.frequencies[index], phase = control.phaseTick / 24;
    const angleRadians = control.angleTick * Math.PI / 60, angleDegrees = control.angleTick * 3;
    const normal = point(Math.cos(angleRadians), Math.sin(angleRadians)), tangent = point(-normal.y, normal.x);
    const fixed = task.guides[index], referenceNormal = reference(fixed);
    const turnErrorDegrees = Math.atan2(referenceNormal.x * normal.y - referenceNormal.y * normal.x,
      referenceNormal.x * normal.x + referenceNormal.y * normal.y) * 180 / Math.PI;
    const phaseError = wrap(frequency * (normal.x * fixed.pin.x + normal.y * fixed.pin.y) + phase + 0.5) - 0.5;
    return {index, frequency, phase, angleDegrees, angleRadians, normal, tangent,
      guide: {pin: copy(fixed.pin), end: copy(fixed.end), referenceNormal, turnErrorDegrees,
        phaseError, phaseErrorTicks: 24 * phaseError,
        turnAligned: Math.abs(turnErrorDegrees) <= 1e-9, phaseAligned: Math.abs(phaseError) <= 1e-9}};
  });
  const probes = task.probes.map(probe => {
    const {x, y} = probe.position;
    const cycles = layers.map(layer => layer.frequency * (layer.normal.x * x + layer.normal.y * y) + layer.phase);
    const transmissions = cycles.map(transmission);
    const sample = {x, y, cycles, phases: cycles.map(wrap), transmissions, brightness: transmissions[0] * transmissions[1]};
    const error = sample.brightness - probe.targetBrightness;
    return {...copy(probe), sample, error, matched: Math.abs(error) <= probe.tolerance};
  });
  return {layers, probes, matched: probes.every(probe => probe.matched)};
}
function expectedCreate(seed, level) {
  seed = integer(seed, 0, 4294967295) ? seed : 744;
  level = integer(level, 0, 2) ? level : 0;
  const layers = copy(PUBLIC_CONFIG.tasks[level].initialLayers);
  return {schema: 1, seed, level, phase: 'playing', reason: '', score: 0, layers, selected: 0,
    optics: optics(level, layers), elapsed: 0, failures: 0, submissions: [], terminalReceipt: null,
    calls: 0, adjustments: 0, switches: 0, blockedTurns: 0, counterSaturated: false,
    inputArmed: false, cancelEpoch: null, cancelledLast: false,
    lastHeld: {a: false, b: false, direction: 'none'}, lastCommand: 'none', events: [], message: INITIAL_MESSAGE};
}
const STATE_KEYS = ['schema', 'seed', 'level', 'phase', 'reason', 'score', 'layers', 'selected', 'optics', 'elapsed',
  'failures', 'submissions', 'terminalReceipt', 'calls', 'adjustments', 'switches', 'blockedTurns', 'counterSaturated',
  'inputArmed', 'cancelEpoch', 'cancelledLast', 'lastHeld', 'lastCommand', 'events', 'message'];
const SUBMISSION_KEYS = ['index', 'call', 'elapsed', 'selected', 'layers', 'probes', 'matched', 'failuresBefore',
  'failuresAfter', 'remaining', 'phase', 'reason'];
function terminalReceipt(state) {
  return {cause: state.phase === 'won' ? 'success' : state.reason, call: state.calls, elapsed: state.elapsed,
    layers: copy(state.layers), probes: copy(state.optics.probes), matched: state.optics.matched,
    failures: state.failures, remaining: 4 - state.failures, score: state.score, phase: state.phase, reason: state.reason};
}
function checkEndpoint(r, state, path) {
  r.counts.endpoints++;
  if (!keysExactly(r, state, STATE_KEYS, path)) return;
  if (!requireThat(r, integer(state.level, 0, 2), `${path}.level`, 'Normalized task index required.')
    || !checkLayers(r, state.layers, `${path}.layers`)) return;
  expect(r, state.schema, 1, `${path}.schema`);
  requireThat(r, integer(state.seed, 0, 4294967295), `${path}.seed`, 'Normalized seed required.');
  requireThat(r, integer(state.selected, 0, 1), `${path}.selected`, 'Selected mask must be zero or one.');
  expect(r, state.optics, optics(state.level, state.layers), `${path}.optics`);
  requireThat(r, finite(state.elapsed) && state.elapsed >= 0 && state.elapsed <= 90, `${path}.elapsed`, 'Active clock must be within 0..90.');
  for (const field of ['calls', 'adjustments', 'switches', 'blockedTurns']) {
    requireThat(r, integer(state[field], 0, LIMIT), `${path}.${field}`, 'Bounded integer counter required.');
    requireThat(r, state[field] <= state.calls, `${path}.${field}`, 'Counter cannot exceed admitted calls.');
  }
  for (const field of ['counterSaturated', 'inputArmed', 'cancelledLast']) requireThat(r, typeof state[field] === 'boolean', `${path}.${field}`, 'Boolean required.');
  requireThat(r, !state.counterSaturated || state.calls === LIMIT, `${path}.counterSaturated`, 'Any counter overflow requires saturated calls.');
  requireThat(r, state.cancelEpoch === null || Number.isSafeInteger(state.cancelEpoch) && state.cancelEpoch >= 0, `${path}.cancelEpoch`, 'Null or nonnegative safe epoch required.');
  requireThat(r, !state.cancelledLast || !state.inputArmed, `${path}.inputArmed`, 'Cancelled sample cannot remain armed.');
  if (keysExactly(r, state.lastHeld, ['a', 'b', 'direction'], `${path}.lastHeld`))
    requireThat(r, typeof state.lastHeld.a === 'boolean' && typeof state.lastHeld.b === 'boolean' && DIRECTIONS.includes(state.lastHeld.direction), `${path}.lastHeld`, 'Normalized held fields required.');
  requireThat(r, COMMANDS.includes(state.lastCommand), `${path}.lastCommand`, 'Documented command required.');
  requireThat(r, typeof state.message === 'string' && state.message.length <= 160, `${path}.message`, 'Bounded display message required.');
  if (state.lastCommand !== 'none') {
    requireThat(r, state.inputArmed && !state.cancelledLast, path, 'Command requires armed uncancelled input.');
    if (['a', 'b'].includes(state.lastCommand)) expect(r, state.lastHeld[state.lastCommand], true, `${path}.heldCommand`);
    else expect(r, state.lastHeld.direction, state.lastCommand, `${path}.heldCommand`);
  }
  if (!requireThat(r, Array.isArray(state.submissions) && state.submissions.length <= 4, `${path}.submissions`, 'At most four submission receipts required.')) return;
  if (state.calls < LIMIT) requireThat(r, state.adjustments + state.switches + state.blockedTurns + state.submissions.length <= state.calls,
    `${path}.commandCount`, 'At most one operation per admitted call.');
  let failures = 0, lastCall = 0, lastElapsed = 0;
  state.submissions.forEach((receipt, index) => guarded(r, `${path}.submissions[${index}]`, () => {
    const p = `${path}.submissions[${index}]`;
    if (!keysExactly(r, receipt, SUBMISSION_KEYS, p) || !checkLayers(r, receipt.layers, `${p}.layers`)) return;
    expect(r, receipt.index, index, `${p}.index`);
    requireThat(r, integer(receipt.call, 1, state.calls) && (receipt.call > lastCall || receipt.call === LIMIT && lastCall === LIMIT), `${p}.call`, 'Receipt call order required.');
    requireThat(r, finite(receipt.elapsed) && receipt.elapsed >= lastElapsed && receipt.elapsed < 90 && receipt.elapsed <= state.elapsed, `${p}.elapsed`, 'Submission precedes deadline and lies within observed clock.');
    requireThat(r, integer(receipt.selected, 0, 1), `${p}.selected`, 'Valid selected mask required.');
    const fresh = optics(state.level, receipt.layers);
    expect(r, receipt.probes, fresh.probes, `${p}.probes`); expect(r, receipt.matched, fresh.matched, `${p}.matched`);
    expect(r, receipt.failuresBefore, failures, `${p}.failuresBefore`);
    if (!fresh.matched) failures++;
    expect(r, receipt.failuresAfter, failures, `${p}.failuresAfter`); expect(r, receipt.remaining, 4 - failures, `${p}.remaining`);
    const phase = fresh.matched ? 'won' : failures === 4 ? 'lost' : 'playing';
    expect(r, receipt.phase, phase, `${p}.phase`); expect(r, receipt.reason, phase === 'lost' ? 'attempts' : '', `${p}.reason`);
    requireThat(r, phase === 'playing' || index === state.submissions.length - 1, p, 'No submission can follow a terminal submission.');
    lastCall = receipt.call; lastElapsed = receipt.elapsed;
  }));
  expect(r, state.failures, failures, `${path}.failures`);
  requireThat(r, integer(state.failures, 0, 4), `${path}.failures`, 'Failure allowance exceeded.');
  requireThat(r, ['playing', 'won', 'lost'].includes(state.phase), `${path}.phase`, 'Valid phase required.');
  expect(r, state.score, state.phase === 'won' ? 100 : 0, `${path}.score`);
  if (!requireThat(r, Array.isArray(state.events) && state.events.length <= 1, `${path}.events`, 'At most one event required.')) return;
  const receipt = state.submissions.at(-1), event = state.events[0];
  if (state.phase === 'playing') {
    requireThat(r, state.elapsed < 90 && failures < 4, path, 'Playing requires remaining clock and allowance.');
    requireThat(r, !receipt || receipt.phase === 'playing', `${path}.submissions`, 'Playing cannot follow terminal receipt.');
    expect(r, state.reason, '', `${path}.reason`); expect(r, state.terminalReceipt, null, `${path}.terminalReceipt`);
  } else {
    expect(r, state.terminalReceipt, terminalReceipt(state), `${path}.terminalReceipt`);
    if (state.reason === 'time') {
      expect(r, state.phase, 'lost', `${path}.phase`); expect(r, state.elapsed, 90, `${path}.elapsed`);
      requireThat(r, failures < 4 && (!receipt || receipt.phase === 'playing'), path, 'Timeout cannot follow terminal submission.');
      requireThat(r, state.calls > lastCall || state.calls === LIMIT, `${path}.timeoutCall`, 'Timeout must be later than every submission.');
      expect(r, state.lastCommand, 'none', `${path}.lastCommand`);
      expect(r, state.events, [{type: 'collision', reason: 'time', call: state.calls}], `${path}.events`);
    } else {
      requireThat(r, !!receipt && state.elapsed < 90, path, 'Submit terminal requires a final receipt before deadline.');
      expect(r, state.reason, state.phase === 'won' ? '' : 'attempts', `${path}.reason`);
      requireThat(r, state.phase === 'won' ? state.optics.matched && failures < 4 : !state.optics.matched && failures === 4, path, 'Terminal submission must satisfy current simultaneous checks and failure accounting.');
      expect(r, state.lastCommand, 'a', `${path}.lastCommand`);
      if (receipt) for (const field of ['call', 'elapsed', 'selected', 'layers', 'phase', 'reason'])
        expect(r, receipt[field], field === 'call' ? state.calls : state[field], `${path}.finalSubmission.${field}`);
      expect(r, state.events, state.phase === 'won' ? [{type: 'win', call: state.calls}]
        : [{type: 'collision', reason: 'attempts', call: state.calls}], `${path}.events`);
    }
  }
  if (state.phase === 'playing') {
    if (state.lastCommand === 'none') expect(r, state.events, [], `${path}.events`);
    else if (state.lastCommand === 'b') {
      requireThat(r, state.switches >= 1, `${path}.switches`, 'Switch must be counted.');
      expect(r, state.events, [{type: 'switch', selected: state.selected, call: state.calls}], `${path}.events`);
    } else if (state.lastCommand === 'a') {
      requireThat(r, !!receipt && receipt.call === state.calls && receipt.elapsed === state.elapsed, path, 'Rejected command requires a current submission.');
      if (receipt) { expect(r, receipt.layers, state.layers, `${path}.currentSubmission.layers`); expect(r, receipt.selected, state.selected, `${path}.currentSubmission.selected`); }
      expect(r, state.events, [{type: 'reject', matchedCount: state.optics.probes.filter(probe => probe.matched).length, call: state.calls}], `${path}.events`);
    } else {
      const control = state.layers[state.selected], phaseAxis = ['left', 'right'].includes(state.lastCommand);
      const requested = ['left', 'down'].includes(state.lastCommand) ? 1 : -1;
      if (event?.type === 'blocked') {
        requireThat(r, !phaseAxis && control.angleTick === (requested < 0 ? -4 : 4) && state.blockedTurns >= 1, path, 'Blocked operation must face an angle stop.');
        expect(r, state.events, [{type: 'blocked', layer: state.selected, axis: 'angle', requested, call: state.calls}], `${path}.events`);
      } else {
        const to = phaseAxis ? control.phaseTick : control.angleTick;
        const from = phaseAxis ? (to - requested + 24) % 24 : to - requested;
        requireThat(r, state.adjustments >= 1 && (phaseAxis || integer(from, -4, 4)), path, 'Adjustment must originate at a legal detent and be counted.');
        expect(r, state.events, [{type: 'adjust', layer: state.selected, axis: phaseAxis ? 'phase' : 'angle', from, to, call: state.calls}], `${path}.events`);
      }
    }
  }
  if (state.calls === 0) expect(r, state, expectedCreate(state.seed, state.level), `${path}.unadvancedOrigin`);
}

function normalize(input) {
  let values = Object.create(null);
  try {
    if (object(input)) {
      const descriptors = INPUT_KEYS.map(key => [key, Object.getOwnPropertyDescriptor(input, key)]);
      for (const [key, descriptor] of descriptors)
        if (descriptor && Object.hasOwn(descriptor, 'value')) values[key] = descriptor.value;
    }
  } catch { values = Object.create(null); }
  const axis = value => finite(value) ? Math.max(-1, Math.min(1, value)) : 0;
  const x = axis(values.x), y = axis(values.y);
  const direction = Math.abs(x) <= 0.5 && Math.abs(y) <= 0.5 ? 'none'
    : Math.abs(y) >= Math.abs(x) ? y > 0 ? 'down' : 'up' : x > 0 ? 'right' : 'left';
  return {a: values.a === true, b: values.b === true, cancelled: values.cancelled === true, paused: values.paused === true,
    epoch: Number.isSafeInteger(values.cancelEpoch) && values.cancelEpoch >= 0 ? values.cancelEpoch : null, direction};
}
function increment(state, field) {
  if (state[field] === LIMIT) state.counterSaturated = true;
  state[field] = Math.min(LIMIT, state[field] + 1);
}
// One expected transition from one actual before. Never continued as a simulated run.
function expectedAfter(before, dt, rawInput) {
  if (before.phase !== 'playing' || !finite(dt) || dt <= 0 || dt > 0.25) return {state: before, exactNoop: true};
  const input = normalize(rawInput);
  if (input.paused) return {state: before, exactNoop: true};
  const next = copy(before); next.events = []; next.lastCommand = 'none'; increment(next, 'calls');
  const elapsed = before.elapsed + dt; next.elapsed = Math.min(90, elapsed);
  if (elapsed >= 90) {
    next.optics = optics(next.level, next.layers); next.phase = 'lost'; next.reason = 'time'; next.score = 0;
    next.events = [{type: 'collision', reason: 'time', call: next.calls}]; next.terminalReceipt = terminalReceipt(next);
    return {state: next, exactNoop: false};
  }
  if (input.epoch !== null && before.cancelEpoch !== null && input.epoch !== before.cancelEpoch || input.cancelled && !before.cancelledLast) next.inputArmed = false;
  if (input.epoch !== null) next.cancelEpoch = input.epoch;
  next.cancelledLast = input.cancelled;
  let command = 'none';
  if (next.inputArmed && !input.cancelled) {
    if (input.b && !before.lastHeld.b) command = 'b';
    else if (input.a && !before.lastHeld.a) command = 'a';
    else if (input.direction !== 'none' && input.direction !== before.lastHeld.direction) command = input.direction;
  }
  next.lastHeld = {a: input.a, b: input.b, direction: input.direction};
  if (!input.cancelled && !input.a && !input.b && input.direction === 'none') next.inputArmed = true;
  next.lastCommand = command;
  if (command === 'b') {
    next.selected = 1 - before.selected; increment(next, 'switches');
    next.events = [{type: 'switch', selected: next.selected, call: next.calls}];
  } else if (command === 'a') {
    next.optics = optics(next.level, next.layers);
    if (next.optics.matched) { next.phase = 'won'; next.reason = ''; next.score = 100; }
    else { next.failures++; if (next.failures === 4) { next.phase = 'lost'; next.reason = 'attempts'; next.score = 0; } }
    next.events = next.phase === 'won' ? [{type: 'win', call: next.calls}]
      : next.phase === 'lost' ? [{type: 'collision', reason: 'attempts', call: next.calls}]
      : [{type: 'reject', matchedCount: next.optics.probes.filter(probe => probe.matched).length, call: next.calls}];
    next.submissions.push({index: before.submissions.length, call: next.calls, elapsed: next.elapsed, selected: next.selected,
      layers: copy(next.layers), probes: copy(next.optics.probes), matched: next.optics.matched,
      failuresBefore: before.failures, failuresAfter: next.failures, remaining: 4 - next.failures, phase: next.phase, reason: next.reason});
    if (next.phase !== 'playing') next.terminalReceipt = terminalReceipt(next);
  } else if (command !== 'none') {
    const phaseAxis = ['left', 'right'].includes(command), field = phaseAxis ? 'phaseTick' : 'angleTick';
    const requested = ['left', 'down'].includes(command) ? 1 : -1;
    const from = before.layers[before.selected][field], to = phaseAxis ? (from + requested + 24) % 24 : from + requested;
    if (!phaseAxis && !integer(to, -4, 4)) {
      increment(next, 'blockedTurns');
      next.events = [{type: 'blocked', layer: before.selected, axis: 'angle', requested, call: next.calls}];
    } else {
      next.layers[before.selected][field] = to; increment(next, 'adjustments'); next.optics = optics(next.level, next.layers);
      next.events = [{type: 'adjust', layer: before.selected, axis: phaseAxis ? 'phase' : 'angle', from, to, call: next.calls}];
    }
  }
  return {state: next, exactNoop: false};
}

const COMMON_LIMITS = [
  'Checks public projections only; claimed source hashes and capture provenance need independent source review.',
  'JSON cannot prove reference identity, detached objects, deep freezing, accessor/Proxy behavior, or absence of hidden code. Non-JSON fixtures require separate faithful typed evidence.',
  'Optical numeric fields follow the documented JavaScript expressions exactly; probe acceptance uses inclusive 0.035 with no extra epsilon.',
  'Display messages are checked for type/length except exact creation and no-op snapshots; text never decides outcomes.',
  'Does not establish actual rendered pixels, phone contact/release, lifecycle, recording readability, frame pairing, or hardware performance.',
  'Endpoint mode requires legal canonical controls; synthetic corruption/math fixtures are not ordinary runs.',
];
export function auditEndpoint(snapshot) {
  const r = report('endpoint'); guarded(r, 'snapshot', () => checkEndpoint(r, snapshot, 'snapshot'));
  r.limits = [...COMMON_LIMITS, 'Embedded submission/terminal receipts establish arithmetic self-consistency only, not observed calls.'];
  return r;
}
export function auditFullRun(run) {
  const r = report('full-model-transitions');
  guarded(r, 'run', () => {
    expect(r, run.schema, 1, 'run.schema'); expect(r, run.kind, 'moire-atelier-ordinary-run', 'run.kind');
    requireThat(r, typeof run.runId === 'string' && run.runId.length > 0, 'run.runId', 'Nonempty run identity required.');
    expect(r, run.channel, 'model', 'run.channel'); checkSources(r, run.sourceHashes, 'run.sourceHashes');
    expect(r, run.origin.kind, 'create', 'run.origin.kind'); expect(r, run.origin.completeCallCapture, true, 'run.origin.completeCallCapture');
    requireThat(r, Object.hasOwn(run.origin, 'seed') && Object.hasOwn(run.origin, 'level'), 'run.origin', 'Actual create arguments required.');
    requireThat(r, typeof run.origin.clock === 'string' && run.origin.clock.length > 0, 'run.origin.clock', 'Declared monotonic clock required.');
    requireThat(r, typeof run.origin.inputRepresentation === 'string' && run.origin.inputRepresentation.length > 0, 'run.origin.inputRepresentation', 'Input representation description required.');
    checkSources(r, run.origin.sourceHashes, 'run.origin.sourceHashes'); checkDocHashes(r, run.origin.publicDocHashes, 'run.origin.publicDocHashes');
    timestamp(r, run.origin.observedAt, 'run.origin.observedAt');
    expect(r, run.origin.state, expectedCreate(run.origin.seed, run.origin.level), 'run.origin.state');
    expect(r, run.origin.publicConfig, PUBLIC_CONFIG, 'run.origin.publicConfig'); checkEndpoint(r, run.origin.state, 'run.origin.state');
    if (!requireThat(r, Array.isArray(run.calls), 'run.calls', 'Every actual invocation must be retained.')) return;
    const monotonicPresent = Object.hasOwn(run.origin, 'observedMonotonicSeconds');
    let previousMonotonic = run.origin.observedMonotonicSeconds;
    if (monotonicPresent) requireThat(r, finite(previousMonotonic) && previousMonotonic >= 0, 'run.origin.observedMonotonicSeconds', 'Actual nonnegative monotonic seconds required.');
    r.observationTimes = [{kind: 'origin', observedAt: run.origin.observedAt, observedMonotonicSeconds: previousMonotonic}];
    r.clock = copy(run.origin.clock);
    let previousActual = run.origin.state;
    run.calls.forEach((call, index) => guarded(r, `run.calls[${index}]`, () => {
      const p = `run.calls[${index}]`; expect(r, call.kind, 'call', `${p}.kind`); expect(r, call.seq, index + 1, `${p}.seq`);
      requireThat(r, call.error === null || call.error === undefined, `${p}.error`, 'Actual execution error retained: this attempt fails audit.');
      requireThat(r, Object.hasOwn(call, 'dt') && Object.hasOwn(call, 'input'), p, 'Own exact dt/input fields required; missing input keys differ from false.');
      timestamp(r, call.observedAt, `${p}.observedAt`); expect(r, call.before, previousActual, `${p}.actualAdjacency`);
      if (monotonicPresent) {
        requireThat(r, finite(call.observedMonotonicSeconds) && call.observedMonotonicSeconds >= previousMonotonic,
          `${p}.observedMonotonicSeconds`, 'Retained actual monotonic observation times must not decrease.');
        previousMonotonic = call.observedMonotonicSeconds;
      }
      r.observationTimes.push({kind: 'call', seq: call.seq, observedAt: call.observedAt, observedMonotonicSeconds: call.observedMonotonicSeconds});
      checkEndpoint(r, call.before, `${p}.before`); checkEndpoint(r, call.after, `${p}.after`);
      const expected = expectedAfter(call.before, call.dt, call.input);
      if (expected.exactNoop) expect(r, call.after, expected.state, `${p}.exactNoop`);
      else {
        const actual = {...call.after}, calculated = {...expected.state}; delete actual.message; delete calculated.message;
        expect(r, actual, calculated, `${p}.transition`);
      }
      expect(r, call.after.submissions.slice(0, call.before.submissions.length), call.before.submissions, `${p}.immutableSubmissionPrefix`);
      if (call.before.terminalReceipt !== null) expect(r, call.after.terminalReceipt, call.before.terminalReceipt, `${p}.immutableTerminalReceipt`);
      r.counts.fullPairs++; previousActual = call.after; // ACTUAL only, never expected.state.
    }));
    expect(r, run.end.kind, 'end', 'run.end.kind'); timestamp(r, run.end.observedAt, 'run.end.observedAt');
    if (monotonicPresent) requireThat(r, finite(run.end.observedMonotonicSeconds) && run.end.observedMonotonicSeconds >= previousMonotonic,
      'run.end.observedMonotonicSeconds', 'Actual terminal observation must retain monotonic ordering.');
    r.observationTimes.push({kind: 'end', observedAt: run.end.observedAt, observedMonotonicSeconds: run.end.observedMonotonicSeconds});
    expect(r, run.end.complete, true, 'run.end.complete'); expect(r, run.end.final, previousActual, 'run.end.final');
    expect(r, run.end.calls, run.calls.length, 'run.end.calls'); expect(r, run.end.outcome, previousActual.phase, 'run.end.outcome');
    expect(r, run.end.reason, previousActual.reason, 'run.end.reason');
    requireThat(r, previousActual.phase !== 'playing', 'run.end.outcome', 'Complete ordinary run must reach its actual terminal outcome.');
    requireThat(r, run.end.failure === null || run.end.failure === undefined, 'run.end.failure', 'Producer failure retained rather than replaced.');
    r.runId = run.runId; r.level = run.origin.state.level; r.outcome = previousActual.phase; r.sourceHashes = copy(run.sourceHashes);
  });
  r.limits = [...COMMON_LIMITS, 'Full-pair result is conditional on accurate complete recording of every actual invocation and raw input.'];
  return r;
}
export function auditSparseSegments(corpus) {
  const r = report('sparse-endpoints'); r.segments = []; r.gaps = [];
  guarded(r, 'corpus', () => {
    if (!requireThat(r, object(corpus) && Array.isArray(corpus.segments) && corpus.segments.length > 0, 'corpus.segments', 'Nonempty explicit task/retry segments required.')) return;
    checkSources(r, corpus.sourceHashes, 'corpus.sourceHashes'); r.sourceHashes = copy(corpus.sourceHashes);
    requireThat(r, Array.isArray(corpus.boundaryGaps), 'corpus.boundaryGaps', 'Explicit boundary gaps required, even when empty.');
    const segmentIds = new Set(), runIds = new Set();
    corpus.segments.forEach((segment, si) => guarded(r, `segments[${si}]`, () => {
      const p = `segments[${si}]`;
      for (const [field, seen] of [['segmentId', segmentIds], ['runId', runIds]]) {
        requireThat(r, typeof segment[field] === 'string' && segment[field].length > 0 && !seen.has(segment[field]), `${p}.${field}`, 'Distinct nonempty task/retry identity required.'); seen.add(segment[field]);
      }
      expect(r, segment.channel, 'browser', `${p}.channel`);
      requireThat(r, typeof segment.originKind === 'string' && segment.originKind.length > 0, `${p}.originKind`, 'Declared actual origin kind required.');
      requireThat(r, object(segment.parentContext) && typeof segment.parentContext.clock === 'string' && segment.parentContext.clock.length > 0, `${p}.parentContext.clock`, 'Actual parent clock description, units and origin required.');
      if (!requireThat(r, Array.isArray(segment.observations) && segment.observations.length > 0, `${p}.observations`, 'Nonempty original observations required.')) return;
      let prior = null, previousActualModel = null, modelIdentity = null, endpointCount = 0;
      segment.observations.forEach((observation, oi) => guarded(r, `${p}.observations[${oi}]`, () => {
        const op = `${p}.observations[${oi}]`, window = observation.readWindow;
        requireThat(r, Number.isSafeInteger(observation.seq) && observation.seq >= 1, `${op}.seq`, 'Original sequence required.');
        requireThat(r, Number.isSafeInteger(observation.sourceObservationIndex) && observation.sourceObservationIndex >= 0, `${op}.sourceObservationIndex`, 'Original source index required.');
        if (!requireThat(r, object(window) && finite(window.start) && finite(window.end) && window.start >= 0 && window.end >= window.start, `${op}.readWindow`, 'Actual finite read window in declared parent clock required.')) return;
        timestamp(r, observation.observedAt, `${op}.observedAt`);
        if (!requireThat(r, object(observation.snapshot) && Object.hasOwn(observation.snapshot, 'model'), `${op}.snapshot`, 'Full actual host wrapper with model/null field required.')) return;
        const hostFields = ['id', 'phase', 'paused', 'tick', 'elapsed', 'level', 'best', 'model', 'renderer', 'frameTimesMs', 'connection'];
        requireThat(r, hostFields.every(key => Object.hasOwn(observation.snapshot, key)), `${op}.snapshot`, 'Every documented actual host field must be retained.');
        expect(r, observation.snapshot.id, 'moire-atelier', `${op}.snapshot.id`);
        if (prior) {
          requireThat(r, observation.seq > prior.seq && observation.sourceObservationIndex > prior.sourceObservationIndex, op, 'Original stream indices must increase.');
          requireThat(r, window.start >= prior.readWindow.start, `${op}.readWindow`, 'Read windows must retain parent-clock order.');
          r.counts.sparseIntervals++;
          r.gaps.push({segmentId: segment.segmentId, fromSourceIndex: prior.sourceObservationIndex, toSourceIndex: observation.sourceObservationIndex,
            observedReadWindows: [copy(prior.readWindow), copy(window)], continuity: 'not-observed', inputAndGateTransitions: 'review-required'});
        }
        const model = observation.snapshot.model;
        if (model !== null) {
          checkEndpoint(r, model, `${op}.snapshot.model`); endpointCount++;
          const identity = {seed: model.seed, level: model.level};
          if (modelIdentity) expect(r, identity, modelIdentity, `${op}.segmentIdentity`); else modelIdentity = identity;
          if (segment.level !== undefined) expect(r, model.level, segment.level, `${op}.declaredLevel`);
          if (segment.seed !== undefined) expect(r, model.seed, segment.seed, `${op}.declaredSeed`);
          if (previousActualModel) {
            for (const field of ['calls', 'elapsed', 'adjustments', 'failures', 'switches', 'blockedTurns'])
              requireThat(r, model[field] >= previousActualModel[field], `${op}.${field}`, 'Observed reset requires a distinct retry/task segment.');
            expect(r, model.submissions.slice(0, previousActualModel.submissions.length), previousActualModel.submissions, `${op}.observedSubmissionPrefix`);
            requireThat(r, !previousActualModel.counterSaturated || model.counterSaturated, `${op}.counterSaturated`, 'Sticky saturation cannot reset.');
            if (model.calls === previousActualModel.calls && model.calls < LIMIT) expect(r, model, previousActualModel, `${op}.unchangedAdmittedCount`);
            if (previousActualModel.phase !== 'playing') expect(r, model, previousActualModel, `${op}.observedTerminalFreeze`);
          }
          previousActualModel = model;
        }
        prior = observation;
      }));
      r.segments.push({segmentId: segment.segmentId, runId: segment.runId, declaredOrigin: segment.originKind,
        parentContext: copy(segment.parentContext), modelIdentity, observations: segment.observations.length, endpoints: endpointCount,
        retainedSegment: copy(segment), continuity: 'not-observed', lifecycle: 'review-required'});
    }));
    if (Array.isArray(corpus.boundaryGaps)) {
      r.counts.declaredBoundaryGaps = corpus.boundaryGaps.length; r.boundaryGaps = copy(corpus.boundaryGaps);
      for (let i = 1; i < corpus.segments.length; i++) {
        const from = corpus.segments[i - 1].segmentId, to = corpus.segments[i].segmentId;
        requireThat(r, corpus.boundaryGaps.some(gap => gap.fromSegmentId === from && gap.toSegmentId === to), 'corpus.boundaryGaps', `Missing declared boundary ${from} -> ${to}.`);
      }
    }
    r.sourceHashSources = copy(corpus.sourceHashSources); r.projection = copy(corpus.projection);
  });
  r.limits = [...COMMON_LIMITS,
    'Every sparse interval has unobserved calls/dt/inputs; adjustment, submission, release and gate continuity remain not-observed or review-required.',
    'Receipts establish arithmetic self-consistency only; embedded receipts never become observed adjacent calls.',
    'Equal endpoint controls do not exclude intervening forward/back adjustments or invisible same-identity retries.',
    'Original indices, read windows, declared boundaries and retained host/input/capture context need provenance and lifecycle review.',
    'Completeness and exactly-once mapping of rows against the original source streams require independent projection review.',
    'Null-menu observations are retained without a model endpoint; source-stream clocks are never implicitly aligned.',
  ];
  return r;
}
