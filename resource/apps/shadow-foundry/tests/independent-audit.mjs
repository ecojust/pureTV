/*
 * Shadow Foundry independent PUBLIC-only arithmetic auditor, version 1.
 * Authored from the three canonical public docs, before any evidence corpus.
 * No production imports, future-pose search, pilot policy, or hidden witnesses.
 * Expected transitions always begin with the record's actual observed before.
 * Sparse endpoints never establish the calls or controls between observations.
 */

const INITIAL_MESSAGE = '选择工件或灯光，A 顺时针，B 逆时针；覆盖目标并避开禁区。';
const LIMIT = 2147483647;
const DIRECTIONS = ['none', 'up', 'down', 'left', 'right'];
const COMMANDS = [...DIRECTIONS, 'a', 'b'];
const INPUT_KEYS = ['a', 'b', 'cancelled', 'paused', 'x', 'y', 'cancelEpoch'];

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export const PUBLIC_CONFIG = freeze({
  defaultSeed: 742, boardMin: -6, boardMax: 6,
  focusNames: ['WORK', 'LIGHT'],
  lampNames: ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'],
  lampVectors: [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]],
  maxCounter: LIMIT, maxElapsed: 3600,
  tasks: [
    {
      id: 'west-cast', name: 'WEST CAST', nameZh: '西光落影', pivot: [0, 0],
      prisms: [{center: [0, 0], height: 3}, {center: [1, 0], height: 1}, {center: [1, 1], height: 2}],
      initialYaw: 2, initialLamp: 0, footPrism: 2, lightPrism: 0,
      guideFoot: [1, 1], guideTip: [3, 0],
      targetCells: [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1], [2, 1], [3, 1]],
      forbiddenCells: [[0, -1], [1, -1], [2, -1], [3, -1], [-3, 0], [-2, 0], [-1, 0]],
      requiredTargetHits: 7, maxForbiddenHits: 0, budget: 12,
    },
    {
      id: 'north-cast', name: 'NORTH CAST', nameZh: '北光长脊', pivot: [-1, 0],
      prisms: [{center: [0, 0], height: 2}, {center: [1, 0], height: 3}, {center: [0, 1], height: 1}],
      initialYaw: 3, initialLamp: 2, footPrism: 2, lightPrism: 1,
      guideFoot: [-2, 0], guideTip: [-1, 4],
      targetCells: [[-2, 0], [-1, 0], [-2, 1], [-1, 1], [-1, 2], [-1, 3], [-1, 4]],
      forbiddenCells: [[-3, -1], [-2, -1], [-1, -1], [0, 0], [0, 1], [0, 2]],
      requiredTargetHits: 7, maxForbiddenHits: 0, budget: 12,
    },
    {
      id: 'diagonal-pour', name: 'DIAGONAL POUR', nameZh: '斜光交叠', pivot: [0, 1],
      prisms: [{center: [0, 0], height: 3}, {center: [1, 0], height: 1}, {center: [1, 1], height: 2}],
      initialYaw: 1, initialLamp: 7, footPrism: 2, lightPrism: 0,
      guideFoot: [1, 0], guideTip: [3, -2],
      targetCells: [[2, -2], [3, -2], [0, -1], [1, -1], [2, -1], [3, -1], [0, 0], [1, 0], [2, 0], [0, 1], [1, 1]],
      forbiddenCells: [[-2, 1], [-1, 1], [-2, 2], [-1, 2], [0, 2], [1, 2]],
      requiredTargetHits: 11, maxForbiddenHits: 0, budget: 12,
    },
  ],
});

const integer = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
const finite = n => typeof n === 'number' && Number.isFinite(n);
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const modulo = (n, m) => ((n % m) + m) % m;
const key = point => point.join(',');
const copy = value => Array.isArray(value) ? value.map(copy) : object(value)
  ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, copy(v)])) : value;
const normalizeSeed = seed => integer(seed, 0, 4294967295) ? seed : 742;
const normalizeLevel = level => integer(level, 0, 2) ? level : 0;

function equal(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b)
    && a.length === b.length && a.every((v, i) => equal(v, b[i]));
  if (!object(a) || !object(b)) return false;
  const ak = Object.keys(a).sort(), bk = Object.keys(b).sort();
  return equal(ak, bk) && ak.every(k => equal(a[k], b[k]));
}

function report(mode) {
  return {auditorVersion: 1, mode, ok: true,
    counts: {endpoints: 0, fullPairs: 0, sparseIntervals: 0, declaredBoundaryGaps: 0},
    findings: [], limits: []};
}
function requireThat(r, condition, path, detail) {
  if (!condition) { r.ok = false; r.findings.push({path, detail}); }
  return condition;
}
function expect(r, actual, expected, path) {
  requireThat(r, equal(actual, expected), path, {expected, actual});
}
function keysExactly(r, value, keys, path) {
  return requireThat(r, object(value) && equal(Object.keys(value).sort(), [...keys].sort()), path, 'Exact documented object fields required.');
}
function guarded(r, path, callback) {
  try { return callback(); }
  catch (error) { requireThat(r, false, path, `Malformed public projection: ${String(error.message || error)}`); return null; }
}

const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
function hull(points) {
  const sorted = [...new Map(points.map(p => [key(p), p])).values()]
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const lower = [], upper = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), p) <= 0) lower.pop();
    lower.push(p);
  }
  for (const p of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
const inside = (polygon, point) => polygon.every((v, i) => cross(v, polygon[(i + 1) % polygon.length], point) >= 0);

// Only an observed pose is evaluated. This function does not search orientations.
function geometry(level, yaw, lamp) {
  const task = PUBLIC_CONFIG.tasks[level], source = PUBLIC_CONFIG.lampVectors[lamp];
  const prisms = task.prisms.map(descriptor => {
    let [x, y] = descriptor.center;
    for (let i = 0; i < yaw; i++) [x, y] = [-y, x];
    x += task.pivot[0]; y += task.pivot[1];
    const footprint2 = [[2*x-1, 2*y-1], [2*x+1, 2*y-1], [2*x+1, 2*y+1], [2*x-1, 2*y+1]];
    return {center: [x, y], height: descriptor.height, footprint2,
      vertices2: footprint2.map(p => [...p, 0]).concat(footprint2.map(p => [...p, 2*descriptor.height]))};
  });
  const shadowHulls2 = prisms.map(p => hull(p.vertices2.map(([x, y, z]) => [x-z*source[0], y-z*source[1]])));
  const shadowMask = [], coveredCells = [];
  for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
    const covered = shadowHulls2.some(h => inside(h, [2*x, 2*y]));
    shadowMask.push(covered);
    if (covered) coveredCells.push([x, y]);
  }
  const targets = new Set(task.targetCells.map(key)), forbidden = new Set(task.forbiddenCells.map(key));
  const targetHitCells = coveredCells.filter(p => targets.has(key(p)));
  const forbiddenHitCells = coveredCells.filter(p => forbidden.has(key(p)));
  const targetHits = targetHitCells.length, forbiddenHits = forbiddenHitCells.length;
  const targetPassed = targetHits >= task.requiredTargetHits, forbiddenPassed = forbiddenHits <= task.maxForbiddenHits;
  const light = prisms[task.lightPrism];
  return {prisms, shadowHulls2, shadowMask, coveredCells, targetHitCells, forbiddenHitCells,
    targetHits, forbiddenHits, shadowCells: coveredCells.length, targetPassed, forbiddenPassed,
    matched: targetPassed && forbiddenPassed, lightVector: [...source], lightRay: [-source[0], -source[1], -1],
    footPoint: [...prisms[task.footPrism].center], lightCenter: [...light.center], lightHeight: light.height,
    tipPoint: light.center.map((n, i) => n - light.height*source[i])};
}

function expectedCreate(seed, level) {
  seed = normalizeSeed(seed); level = normalizeLevel(level);
  const task = PUBLIC_CONFIG.tasks[level];
  return {schema: 1, seed, level, phase: 'playing', reason: '', score: 0,
    yaw: task.initialYaw, lamp: task.initialLamp, focus: 0,
    geometry: geometry(level, task.initialYaw, task.initialLamp),
    adjustmentsUsed: 0, workRotations: 0, lightRotations: 0, adjustments: [],
    calls: 0, focusChanges: 0, elapsed: 0, counterSaturated: false, clockSaturated: false,
    inputArmed: false, cancelEpoch: null, cancelledLast: false,
    lastHeld: {a: false, b: false, direction: 'none'}, lastCommand: 'none', events: [], message: INITIAL_MESSAGE};
}

const RECEIPT_KEYS = ['index', 'call', 'elapsed', 'focus', 'turn', 'from', 'to', 'targetHits', 'forbiddenHits', 'shadowCells', 'matched', 'remaining', 'phase'];
const STATE_KEYS = ['schema', 'seed', 'level', 'phase', 'reason', 'score', 'yaw', 'lamp', 'focus', 'geometry',
  'adjustmentsUsed', 'workRotations', 'lightRotations', 'adjustments', 'calls', 'focusChanges', 'elapsed',
  'counterSaturated', 'clockSaturated', 'inputArmed', 'cancelEpoch', 'cancelledLast', 'lastHeld', 'lastCommand', 'events', 'message'];

function checkEndpoint(r, state, path) {
  r.counts.endpoints++;
  if (!keysExactly(r, state, STATE_KEYS, path)) return;
  if (!requireThat(r, integer(state.level, 0, 2) && integer(state.yaw, 0, 3) && integer(state.lamp, 0, 7), path, 'Invalid task or physical indices.')) return;
  const task = PUBLIC_CONFIG.tasks[state.level], fresh = geometry(state.level, state.yaw, state.lamp);
  expect(r, state.schema, 1, `${path}.schema`);
  requireThat(r, integer(state.seed, 0, 4294967295), `${path}.seed`, 'Invalid normalized seed.');
  requireThat(r, integer(state.focus, 0, 1), `${path}.focus`, 'Invalid focus.');
  expect(r, state.geometry, fresh, `${path}.geometry`);
  for (const name of ['adjustmentsUsed', 'workRotations', 'lightRotations'])
    requireThat(r, integer(state[name], 0, 12), `${path}.${name}`, 'Counter outside budget.');
  for (const name of ['calls', 'focusChanges'])
    requireThat(r, integer(state[name], 0, LIMIT), `${path}.${name}`, 'Counter outside public bounds.');
  requireThat(r, state.focusChanges <= state.calls && state.adjustmentsUsed <= state.calls, path, 'Commands cannot exceed admitted calls.');
  requireThat(r, finite(state.elapsed) && state.elapsed >= 0 && state.elapsed <= 3600, `${path}.elapsed`, 'Invalid elapsed time.');
  for (const name of ['counterSaturated', 'clockSaturated', 'inputArmed', 'cancelledLast'])
    requireThat(r, typeof state[name] === 'boolean', `${path}.${name}`, 'Boolean required.');
  requireThat(r, !state.counterSaturated || state.calls === LIMIT, path, 'Counter saturation without saturated calls.');
  requireThat(r, !state.clockSaturated || state.elapsed === 3600, path, 'Clock saturation without capped elapsed.');
  requireThat(r, state.cancelEpoch === null || Number.isSafeInteger(state.cancelEpoch) && state.cancelEpoch >= 0, `${path}.cancelEpoch`, 'Invalid cancellation epoch.');
  requireThat(r, !state.cancelledLast || !state.inputArmed, path, 'Cancelled sample cannot remain armed.');
  if (keysExactly(r, state.lastHeld, ['a', 'b', 'direction'], `${path}.lastHeld`)) {
    requireThat(r, typeof state.lastHeld.a === 'boolean' && typeof state.lastHeld.b === 'boolean' && DIRECTIONS.includes(state.lastHeld.direction), `${path}.lastHeld`, 'Invalid normalized held sample.');
  }
  requireThat(r, COMMANDS.includes(state.lastCommand), `${path}.lastCommand`, 'Invalid command token.');
  requireThat(r, typeof state.message === 'string' && state.message.length <= 160, `${path}.message`, 'Display message must be a bounded string.');
  if (!requireThat(r, Array.isArray(state.adjustments) && state.adjustments.length <= 12, `${path}.adjustments`, 'Bounded receipt array required.')) return;
  expect(r, state.adjustmentsUsed, state.adjustments.length, `${path}.adjustmentsUsed`);
  expect(r, state.workRotations + state.lightRotations, state.adjustmentsUsed, `${path}.rotationSum`);
  let pose = {yaw: task.initialYaw, lamp: task.initialLamp}, lastCall = 0, lastElapsed = 0, works = 0, lights = 0;
  state.adjustments.forEach((receipt, index) => {
    const p = `${path}.adjustments[${index}]`;
    if (!keysExactly(r, receipt, RECEIPT_KEYS, p)) return;
    expect(r, receipt.index, index, `${p}.index`);
    expect(r, receipt.from, pose, `${p}.from`);
    requireThat(r, integer(receipt.call, 1, state.calls) && (receipt.call > lastCall || receipt.call === LIMIT && lastCall === LIMIT), `${p}.call`, 'Receipt call order is inconsistent.');
    requireThat(r, finite(receipt.elapsed) && receipt.elapsed >= lastElapsed && receipt.elapsed <= state.elapsed, `${p}.elapsed`, 'Receipt elapsed order is inconsistent.');
    if (!requireThat(r, integer(receipt.focus, 0, 1) && [1, -1].includes(receipt.turn), p, 'Invalid recorded rotation.')) return;
    const to = {...pose};
    if (receipt.focus === 0) { to.yaw = modulo(to.yaw + receipt.turn, 4); works++; }
    else { to.lamp = modulo(to.lamp + receipt.turn, 8); lights++; }
    expect(r, receipt.to, to, `${p}.to`);
    const g = geometry(state.level, to.yaw, to.lamp);
    for (const field of ['targetHits', 'forbiddenHits', 'shadowCells', 'matched']) expect(r, receipt[field], g[field], `${p}.${field}`);
    expect(r, receipt.remaining, 11-index, `${p}.remaining`);
    const phase = g.matched ? 'won' : index === 11 ? 'lost' : 'playing';
    expect(r, receipt.phase, phase, `${p}.phase`);
    requireThat(r, phase === 'playing' || index === state.adjustments.length-1, p, 'Receipt follows a terminal receipt.');
    pose = to; lastCall = receipt.call; lastElapsed = receipt.elapsed;
  });
  expect(r, {yaw: state.yaw, lamp: state.lamp}, pose, `${path}.receiptEndpoint`);
  expect(r, state.workRotations, works, `${path}.workRotations`);
  expect(r, state.lightRotations, lights, `${path}.lightRotations`);
  const phase = fresh.matched ? 'won' : state.adjustmentsUsed === 12 ? 'lost' : 'playing';
  expect(r, state.phase, phase, `${path}.phase`);
  expect(r, state.reason, phase === 'lost' ? 'budget' : '', `${path}.reason`);
  expect(r, state.score, phase === 'won' ? 100 : 0, `${path}.score`);
  requireThat(r, Array.isArray(state.events) && state.events.length <= 1, `${path}.events`, 'At most one event per admitted call.');
  if (state.calls === 0) expect(r, state, expectedCreate(state.seed, state.level), `${path}.unadvancedOrigin`);
  if (phase === 'playing' && Array.isArray(state.events)) {
    const event = state.events[0], receipt = state.adjustments.at(-1);
    if (event?.type === 'focus') {
      expect(r, event, {type: 'focus', focus: state.focus, call: state.calls}, `${path}.focusEvent`);
      requireThat(r, ['up', 'down', 'left', 'right'].includes(state.lastCommand), `${path}.focusCommand`, 'Focus event needs a direction command.');
    } else if (event?.type === 'rotate') {
      const turn = state.lastCommand === 'a' ? 1 : -1;
      requireThat(r, ['a', 'b'].includes(state.lastCommand), `${path}.rotateCommand`, 'Rotate event needs an action command.');
      expect(r, event, {type: 'rotate', focus: state.focus, turn, call: state.calls}, `${path}.rotateEvent`);
      requireThat(r, receipt && receipt.call === state.calls && receipt.elapsed === state.elapsed && receipt.turn === turn && receipt.focus === state.focus, `${path}.rotateReceipt`, 'Latest rotation event must match the endpoint receipt.');
    } else {
      expect(r, state.events, [], `${path}.playingEvents`);
      requireThat(r, !['a', 'b'].includes(state.lastCommand), `${path}.lastCommand`, 'An actual action must emit its rotation event.');
    }
  }
  if (phase !== 'playing') {
    requireThat(r, state.adjustments.length >= 1, path, 'Terminal state lacks an actual receipt.');
    expect(r, state.calls, lastCall, `${path}.terminalCalls`);
    expect(r, state.elapsed, lastElapsed, `${path}.terminalElapsed`);
    expect(r, state.events, phase === 'won' ? [{type: 'win', call: state.calls}] : [{type: 'collision', reason: 'budget', call: state.calls}], `${path}.terminalEvent`);
    requireThat(r, ['a', 'b'].includes(state.lastCommand), `${path}.terminalCommand`, 'Terminal state must follow a rotation.');
  }
}

function normalize(input) {
  let values = {};
  try {
    if (object(input)) {
      const descriptors = Object.fromEntries(INPUT_KEYS.map(k => [k, Object.getOwnPropertyDescriptor(input, k)]));
      values = Object.fromEntries(INPUT_KEYS.filter(k => descriptors[k] && Object.hasOwn(descriptors[k], 'value')).map(k => [k, descriptors[k].value]));
    }
  } catch { values = {}; }
  const axis = n => finite(n) ? Math.min(1, Math.max(-1, n)) : 0;
  const x = axis(values.x), y = axis(values.y);
  const direction = Math.abs(x) <= .5 && Math.abs(y) <= .5 ? 'none'
    : Math.abs(y) >= Math.abs(x) ? (y > 0 ? 'down' : 'up') : (x > 0 ? 'right' : 'left');
  return {a: values.a === true, b: values.b === true, cancelled: values.cancelled === true,
    paused: values.paused === true, direction,
    epoch: Number.isSafeInteger(values.cancelEpoch) && values.cancelEpoch >= 0 ? values.cancelEpoch : null};
}

// This is a single adjacent-pair expectation, never a replay state accumulator.
function expectedAfter(before, dt, rawInput) {
  if (before.phase !== 'playing' || !finite(dt) || dt <= 0 || dt > .25) return {state: before, exactNoop: true};
  const input = normalize(rawInput);
  if (input.paused) return {state: before, exactNoop: true};
  const next = copy(before);
  next.events = []; next.lastCommand = 'none';
  if (before.calls === LIMIT) next.counterSaturated = true;
  next.calls = Math.min(LIMIT, before.calls + 1);
  const elapsed = before.elapsed + dt;
  next.elapsed = Math.min(3600, elapsed);
  if (elapsed > 3600) next.clockSaturated = true;
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
  if (['up', 'left', 'down', 'right'].includes(command)) {
    const focus = command === 'up' || command === 'left' ? 0 : 1;
    if (focus !== before.focus) {
      next.focus = focus;
      if (before.focusChanges === LIMIT) next.counterSaturated = true;
      next.focusChanges = Math.min(LIMIT, before.focusChanges + 1);
      next.events = [{type: 'focus', focus, call: next.calls}];
    }
  }
  if (command === 'a' || command === 'b') {
    const turn = command === 'a' ? 1 : -1, from = {yaw: before.yaw, lamp: before.lamp};
    if (before.focus === 0) { next.yaw = modulo(before.yaw + turn, 4); next.workRotations++; }
    else { next.lamp = modulo(before.lamp + turn, 8); next.lightRotations++; }
    next.adjustmentsUsed++;
    next.geometry = geometry(before.level, next.yaw, next.lamp);
    next.phase = next.geometry.matched ? 'won' : next.adjustmentsUsed === 12 ? 'lost' : 'playing';
    next.reason = next.phase === 'lost' ? 'budget' : ''; next.score = next.phase === 'won' ? 100 : 0;
    next.events = next.phase === 'won' ? [{type: 'win', call: next.calls}]
      : next.phase === 'lost' ? [{type: 'collision', reason: 'budget', call: next.calls}]
      : [{type: 'rotate', focus: before.focus, turn, call: next.calls}];
    next.adjustments.push({index: before.adjustments.length, call: next.calls, elapsed: next.elapsed,
      focus: before.focus, turn, from, to: {yaw: next.yaw, lamp: next.lamp},
      targetHits: next.geometry.targetHits, forbiddenHits: next.geometry.forbiddenHits,
      shadowCells: next.geometry.shadowCells, matched: next.geometry.matched,
      remaining: 12-next.adjustmentsUsed, phase: next.phase});
  }
  return {state: next, exactNoop: false};
}

const COMMON_LIMITS = [
  'Checks public numerical projections; does not authenticate capture provenance or source-hash contents.',
  'JSON snapshots cannot prove object identity, alias freedom, deep freezing, getter/trap behavior, or absence of hidden code.',
  'Display message content is not a decision field; only its type/length is checked, except exact create and no-op snapshots.',
  'Does not establish renderer visibility, actual phone contact/release, browser lifecycle, recording readability, or hardware performance.',
];

export function auditEndpoint(snapshot) {
  const r = report('endpoint');
  guarded(r, 'snapshot', () => checkEndpoint(r, snapshot, 'snapshot'));
  r.limits = [...COMMON_LIMITS, 'Embedded receipt arithmetic is self-consistency only; it does not prove those calls occurred.'];
  return r;
}

export function auditFullRun(run) {
  const r = report('full-model-transitions');
  guarded(r, 'run', () => {
    requireThat(r, object(run) && typeof run.runId === 'string' && run.runId.length > 0, 'run.runId', 'Nonempty run ID required.');
    expect(r, run.channel, 'model', 'run.channel');
    expect(r, run.origin.kind, 'create', 'run.origin.kind');
    expect(r, run.origin.state, expectedCreate(run.origin.seed, run.origin.level), 'run.origin.state');
    if (run.origin.publicConfig !== undefined) expect(r, run.origin.publicConfig, PUBLIC_CONFIG, 'run.origin.publicConfig');
    checkEndpoint(r, run.origin.state, 'run.origin.state');
    if (!requireThat(r, Array.isArray(run.calls), 'run.calls', 'Actual call array required.')) return;
    let previousActual = run.origin.state;
    run.calls.forEach((call, index) => guarded(r, `run.calls[${index}]`, () => {
      const p = `run.calls[${index}]`;
      expect(r, call.kind, 'call', `${p}.kind`);
      expect(r, call.seq, index+1, `${p}.seq`);
      requireThat(r, call.error === null || call.error === undefined, `${p}.error`, 'Recorded execution error: preserved attempt fails audit.');
      requireThat(r, Object.hasOwn(call, 'dt') && Object.hasOwn(call, 'input'), p, 'Exact actual dt and input fields required.');
      expect(r, call.before, previousActual, `${p}.actualAdjacency`);
      checkEndpoint(r, call.before, `${p}.before`);
      checkEndpoint(r, call.after, `${p}.after`);
      const expected = expectedAfter(call.before, call.dt, call.input);
      if (expected.exactNoop) expect(r, call.after, expected.state, `${p}.exactNoop`);
      else {
        const actualWithoutMessage = {...call.after}, expectedWithoutMessage = {...expected.state};
        delete actualWithoutMessage.message; delete expectedWithoutMessage.message;
        expect(r, actualWithoutMessage, expectedWithoutMessage, `${p}.transition`);
      }
      expect(r, call.after.adjustments.slice(0, call.before.adjustments.length), call.before.adjustments, `${p}.immutableReceiptPrefix`);
      r.counts.fullPairs++;
      previousActual = call.after; // Actual data only, never expected.state.
    }));
    expect(r, run.end.final, previousActual, 'run.end.final');
    expect(r, run.end.calls, run.calls.length, 'run.end.calls');
    expect(r, run.end.outcome, previousActual.phase, 'run.end.outcome');
    expect(r, run.end.reason, previousActual.reason, 'run.end.reason');
    requireThat(r, run.end.failure === null || run.end.failure === undefined, 'run.end.failure', 'Producer reports a failed attempt; preserved rather than replaced.');
    r.runId = run.runId; r.level = run.origin.state.level; r.outcome = previousActual.phase;
  });
  r.limits = [...COMMON_LIMITS, 'Full transition verdict is conditional on the producer retaining every actual call without omission.'];
  return r;
}

export function auditSparseSegments(corpus) {
  const r = report('sparse-endpoints');
  r.segments = []; r.gaps = [];
  guarded(r, 'corpus', () => {
    if (!requireThat(r, object(corpus) && Array.isArray(corpus.segments), 'corpus.segments', 'Explicit task/retry segments required.')) return;
    requireThat(r, Array.isArray(corpus.boundaryGaps), 'corpus.boundaryGaps', 'Explicit boundary gap array required, even when empty.');
    const segmentIds = new Set(), runIds = new Set();
    corpus.segments.forEach((segment, si) => guarded(r, `segments[${si}]`, () => {
      const p = `segments[${si}]`;
      for (const [field, seen] of [['segmentId', segmentIds], ['runId', runIds]]) {
        requireThat(r, typeof segment[field] === 'string' && segment[field].length > 0 && !seen.has(segment[field]), `${p}.${field}`, 'Every task/retry segment requires a distinct nonempty identity.');
        seen.add(segment[field]);
      }
      expect(r, segment.channel, 'browser', `${p}.channel`);
      requireThat(r, typeof segment.originKind === 'string' && segment.originKind.length > 0, `${p}.originKind`, 'Record the actual declared origin kind.');
      requireThat(r, object(segment.parentContext) && typeof segment.parentContext.clock === 'string' && segment.parentContext.clock.length > 0, `${p}.parentContext.clock`, 'Retain the actual parent capture clock description, units and origin.');
      requireThat(r, Array.isArray(segment.observations), `${p}.observations`, 'Actual observations required.');
      let prior = null, modelIdentity = null, endpointCount = 0;
      segment.observations.forEach((observation, oi) => guarded(r, `${p}.observations[${oi}]`, () => {
        const op = `${p}.observations[${oi}]`, window = observation.readWindow;
        requireThat(r, Number.isSafeInteger(observation.seq) && observation.seq >= 1, `${op}.seq`, 'Original observation sequence required.');
        requireThat(r, Number.isSafeInteger(observation.sourceObservationIndex) && observation.sourceObservationIndex >= 0, `${op}.sourceObservationIndex`, 'Original source index required.');
        if (!requireThat(r, object(window) && finite(window.start) && finite(window.end) && window.start >= 0 && window.end >= window.start, `${op}.readWindow`, 'Actual parent-clock read start/end required.')) return;
        requireThat(r, typeof observation.observedAt === 'string' && Number.isFinite(Date.parse(observation.observedAt)), `${op}.observedAt`, 'Actual completion timestamp required.');
        requireThat(r, object(observation.snapshot), `${op}.snapshot`, 'Unmodified full host wrapper required.');
        if (prior) {
          requireThat(r, observation.seq > prior.seq && observation.sourceObservationIndex > prior.sourceObservationIndex, op, 'Original indices must increase within a segment.');
          requireThat(r, window.start >= prior.readWindow.start, `${op}.readWindow`, 'Read windows must retain monotone parent-clock order.');
          r.counts.sparseIntervals++;
          r.gaps.push({segmentId: segment.segmentId, fromSourceIndex: prior.sourceObservationIndex,
            toSourceIndex: observation.sourceObservationIndex, observedReadWindows: [prior.readWindow, window],
            continuity: 'not-observed', inputAndGateTransitions: 'review-required'});
        }
        const model = observation.snapshot.model;
        if (model !== null && model !== undefined) {
          checkEndpoint(r, model, `${op}.snapshot.model`); endpointCount++;
          const identity = {seed: model.seed, level: model.level};
          if (modelIdentity) expect(r, identity, modelIdentity, `${op}.segmentIdentity`);
          else modelIdentity = identity;
          if (segment.level !== undefined) expect(r, model.level, segment.level, `${op}.declaredLevel`);
          if (segment.seed !== undefined) expect(r, model.seed, segment.seed, `${op}.declaredSeed`);
          if (prior?.snapshot?.model) {
            const earlier = prior.snapshot.model;
            requireThat(r, model.calls >= earlier.calls && model.elapsed >= earlier.elapsed && model.adjustmentsUsed >= earlier.adjustmentsUsed, op, 'Observed counter reset requires a separate retry/task segment.');
            expect(r, model.adjustments.slice(0, earlier.adjustments.length), earlier.adjustments, `${op}.observedReceiptPrefix`);
          }
        }
        prior = observation;
      }));
      r.segments.push({segmentId: segment.segmentId, runId: segment.runId, declaredOrigin: segment.originKind,
        modelIdentity, observations: segment.observations.length, endpoints: endpointCount,
        continuity: 'not-observed', lifecycle: 'review-required'});
    }));
    if (Array.isArray(corpus.boundaryGaps)) {
      r.counts.declaredBoundaryGaps = corpus.boundaryGaps.length;
      r.boundaryGaps = copy(corpus.boundaryGaps);
      for (let i = 1; i < corpus.segments.length; i++) {
        const from = corpus.segments[i-1].segmentId, to = corpus.segments[i].segmentId;
        requireThat(r, corpus.boundaryGaps.some(g => g.fromSegmentId === from && g.toSegmentId === to), 'corpus.boundaryGaps', `Missing declared boundary ${from} -> ${to}.`);
      }
    }
  });
  r.limits = [...COMMON_LIMITS,
    'All sparse interval continuity, unseen rotations, input edges, call dt and gate changes remain not-observed or review-required.',
    'Embedded receipts are checked for arithmetic consistency only; no embedded history is promoted to observed adjacent transitions.',
    'Equal endpoint poses do not exclude intervening full revolutions; endpoint call counts do not reveal individual calls.',
    'Declared source indices, segment boundaries and parent clock metadata are preserved claims requiring source review.',
    'Menu/null-model observations are retained but have no model endpoint to check.'];
  return r;
}
