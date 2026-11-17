/*
 * Cable Unweaver independent PUBLIC-only auditor, version 1.
 * Domain arithmetic authored from the accepted game43 public rules, before corpus access.
 * Reporting/API structure adapts this auditor's game42 public-only baseline.
 * No production imports, pilot policy, route search, private helper, or hidden witness.
 * Full expectations start from each record's ACTUAL before; never replay expected states.
 * Sparse endpoints never prove the intervening calls, releases, moves, or continuity.
 */

const INITIAL_MESSAGE = 'A、B选择端子，方向沿轨道移动；消除线冲突和端子重合。';
const LIMIT = 2147483647;
const DIRECTIONS = ['none', 'up', 'down', 'left', 'right'];
const COMMANDS = [...DIRECTIONS, 'a', 'b'];
const INPUT_KEYS = ['a', 'b', 'cancelled', 'paused', 'x', 'y', 'cancelEpoch'];
const finite = n => typeof n === 'number' && Number.isFinite(n);
const integer = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const copy = value => Array.isArray(value) ? value.map(copy) : object(value)
  ? Object.fromEntries(Object.entries(value).map(([key, v]) => [key, copy(v)])) : value;
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

export const PUBLIC_CONFIG = freeze({
  defaultSeed: 743, board: {minX: -2, maxX: 10, minY: 0, maxY: 10},
  maxCounter: LIMIT, maxElapsed: 3600,
  tasks: [
    {id: 'straight-rack', name: 'STRAIGHT RACK', nameZh: '直排接线',
      fixed: [{id: 'P', position: {x: 0, y: 2}}, {id: 'Q', position: {x: 0, y: 5}}, {id: 'R', position: {x: 0, y: 8}}],
      terminals: [
        {id: 'a', group: 0, offset: 0, rail: {axis: 'y', fixed: 10, min: 1, max: 9}},
        {id: 'b', group: 1, offset: 0, rail: {axis: 'y', fixed: 10, min: 1, max: 9}},
        {id: 'c', group: 2, offset: 0, rail: {axis: 'y', fixed: 10, min: 1, max: 9}}],
      groups: [{id: 'ga', initial: 8, guideNode: 'P'}, {id: 'gb', initial: 5, guideNode: 'Q'}, {id: 'gc', initial: 2, guideNode: 'R'}],
      edges: [{id: 'e0', from: 'P', to: 'a'}, {id: 'e1', from: 'Q', to: 'b'}, {id: 'e2', from: 'R', to: 'c'}], budget: 18},
    {id: 'coupled-fan', name: 'COUPLED FAN', nameZh: '联动分线',
      fixed: [{id: 'H', position: {x: 0, y: 3}}, {id: 'K', position: {x: 0, y: 8}}],
      terminals: [
        {id: 'a', group: 0, offset: 0, rail: {axis: 'y', fixed: 10, min: 1, max: 8}},
        {id: 'b', group: 0, offset: 2, rail: {axis: 'y', fixed: 10, min: 3, max: 9}},
        {id: 'c', group: 1, offset: 0, rail: {axis: 'y', fixed: 10, min: 1, max: 9}}],
      groups: [{id: 'gAB', initial: 6, guideNode: 'H'}, {id: 'gC', initial: 2, guideNode: 'K'}],
      edges: [{id: 'e0', from: 'H', to: 'a'}, {id: 'e1', from: 'H', to: 'b'}, {id: 'e2', from: 'K', to: 'c'}], budget: 16},
    {id: 'staggered-clamp', name: 'STAGGERED CLAMP', nameZh: '错层线夹',
      fixed: [{id: 'H', position: {x: 0, y: 0}}, {id: 'K', position: {x: 8, y: 0}}],
      terminals: [
        {id: 'a', group: 0, offset: 0, rail: {axis: 'x', fixed: 6, min: -2, max: 4}},
        {id: 'b', group: 0, offset: 2, rail: {axis: 'x', fixed: 10, min: 0, max: 7}},
        {id: 'c', group: 1, offset: 0, rail: {axis: 'x', fixed: 10, min: -1, max: 9}}],
      groups: [{id: 'gAB', initial: 3, guideNode: 'H'}, {id: 'gC', initial: -1, guideNode: 'K'}],
      edges: [{id: 'e0', from: 'H', to: 'a'}, {id: 'e1', from: 'H', to: 'b'}, {id: 'e2', from: 'K', to: 'c'}], budget: 16},
  ],
});

function equal(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b)
    && a.length === b.length && a.every((v, i) => equal(v, b[i]));
  if (!object(a) || !object(b)) return false;
  const ak = Object.keys(a).sort(), bk = Object.keys(b).sort();
  return equal(ak, bk) && ak.every(key => equal(a[key], b[key]));
}
function report(mode) {
  return {auditorVersion: 1, game: 'cable-unweaver', mode, ok: true,
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
    requireThat(r, name.length > 0, path, 'Source names must be nonempty strings.');
    requireThat(r, typeof value === 'string' && /^[a-f0-9]{64}$/.test(value), `${path}.${name}`, 'Declared lowercase SHA256 digest string required; contents are not authenticated by this checker.');
  }
}

const samePoint = (a, b) => a.x === b.x && a.y === b.y;
const orient = (a, b, c) => (b.x-a.x)*(c.y-a.y) - (b.y-a.y)*(c.x-a.x);
const onSegment = (a, b, p) => orient(a, b, p) === 0
  && p.x >= Math.min(a.x, b.x) && p.x <= Math.max(a.x, b.x)
  && p.y >= Math.min(a.y, b.y) && p.y <= Math.max(a.y, b.y);
const lexPoint = (a, b) => a.x-b.x || a.y-b.y;
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
function rationalIntersection(a, b, c, d) {
  const rx = b.x-a.x, ry = b.y-a.y, sx = d.x-c.x, sy = d.y-c.y;
  let den = rx*sy-ry*sx;
  const tNum = (c.x-a.x)*sy-(c.y-a.y)*sx;
  let xNum = a.x*den+rx*tNum, yNum = a.y*den+ry*tNum;
  if (den < 0) { den = -den; xNum = -xNum; yNum = -yNum; }
  const divisor = gcd(gcd(xNum, yNum), den);
  return {xNum: xNum/divisor || 0, yNum: yNum/divisor || 0, den: den/divisor};
}
// No floating division participates in a segment predicate.
function pairConflict(first, second) {
  const {a, b} = first, {a: c, b: d} = second;
  if (samePoint(a, b) || samePoint(c, d)) return null;
  const sharedId = first.from === second.from || first.from === second.to
    || first.to === second.from || first.to === second.to;
  const o = [orient(a, b, c), orient(a, b, d), orient(c, d, a), orient(c, d, b)];
  if (o.every(value => value === 0)) {
    const axis = a.x === b.x ? 'y' : 'x';
    const lo = Math.max(Math.min(a[axis], b[axis]), Math.min(c[axis], d[axis]));
    const hi = Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis]));
    if (lo > hi) return null;
    const endpoints = [a, b, c, d].filter(p => onSegment(a, b, p) && onSegment(c, d, p)).sort(lexPoint);
    if (lo < hi) return {kind: 'overlap', point: null, overlap: [copy(endpoints[0]), copy(endpoints.at(-1))]};
    if (sharedId) return null;
    return {kind: 'touch', point: {xNum: endpoints[0].x, yNum: endpoints[0].y, den: 1}, overlap: null};
  }
  const proper = Math.sign(o[0])*Math.sign(o[1]) < 0 && Math.sign(o[2])*Math.sign(o[3]) < 0;
  const touching = o[0] === 0 && onSegment(a, b, c) || o[1] === 0 && onSegment(a, b, d)
    || o[2] === 0 && onSegment(c, d, a) || o[3] === 0 && onSegment(c, d, b);
  if (!proper && !touching || sharedId) return null;
  return {kind: proper ? 'cross' : 'touch', point: rationalIntersection(a, b, c, d), overlap: null};
}
const railPoint = (rail, varying) => rail.axis === 'x' ? {x: varying, y: rail.fixed} : {x: rail.fixed, y: varying};
function groupMembers(task, groupIndex) { return task.terminals.filter(t => t.group === groupIndex); }
function groupBounds(task, groupIndex) {
  const members = groupMembers(task, groupIndex);
  return {min: Math.max(...members.map(t => t.rail.min-t.offset)), max: Math.min(...members.map(t => t.rail.max-t.offset))};
}
function movement(task, positions, groupIndex, requested) {
  const members = groupMembers(task, groupIndex);
  const low = Math.max(...members.map(t => t.rail.min-(positions[groupIndex]+t.offset)));
  const high = Math.min(...members.map(t => t.rail.max-(positions[groupIndex]+t.offset)));
  return {delta: Math.min(high, Math.max(low, requested)),
    limiting: members.filter(t => positions[groupIndex]+t.offset === (requested < 0 ? t.rail.min : t.rail.max)).map(t => t.id)};
}

// Only an actually supplied placement is evaluated. There is no placement search.
function geometry(level, positions) {
  const task = PUBLIC_CONFIG.tasks[level];
  const nodes = task.fixed.map(n => ({id: n.id, position: copy(n.position), terminalIndex: null, groupIndex: null}));
  task.terminals.forEach((t, i) => nodes.push({id: t.id, position: railPoint(t.rail, positions[t.group]+t.offset), terminalIndex: i, groupIndex: t.group}));
  const byId = new Map(nodes.map(n => [n.id, n]));
  const rails = task.terminals.map(t => ({terminal: t.id, axis: t.rail.axis, start: railPoint(t.rail, t.rail.min),
    end: railPoint(t.rail, t.rail.max), min: t.rail.min, max: t.rail.max, fixed: t.rail.fixed}));
  const groups = task.groups.map((g, i) => {
    const members = groupMembers(task, i), axis = members[0].rail.axis, bounds = groupBounds(task, i);
    const current = members.reduce((sum, t) => sum+positions[i]+t.offset, 0);
    const reference = byId.get(g.guideNode).position[axis], error = current-members.length*reference;
    return {id: g.id, axis, members: members.map(t => t.id), position: positions[i], min: bounds.min, max: bounds.max,
      guideNode: g.guideNode, guideCurrentNumerator: current, guideDenominator: members.length,
      guideReference: reference, guideErrorNumerator: error, guideAligned: error === 0};
  });
  const segments = task.edges.map(e => ({id: e.id, from: e.from, to: e.to, a: copy(byId.get(e.from).position), b: copy(byId.get(e.to).position)}));
  const conflicts = [], coincidentNodes = [];
  for (let i = 0; i < segments.length; i++) for (let j = i+1; j < segments.length; j++) {
    const conflict = pairConflict(segments[i], segments[j]);
    if (conflict) conflicts.push({edges: [segments[i].id, segments[j].id], ...conflict});
  }
  for (let i = 0; i < nodes.length; i++) for (let j = i+1; j < nodes.length; j++)
    if (samePoint(nodes[i].position, nodes[j].position)) coincidentNodes.push([nodes[i].id, nodes[j].id]);
  const affected = new Set(conflicts.flatMap(c => c.edges));
  const conflictEdgeIds = task.edges.filter(e => affected.has(e.id)).map(e => e.id);
  const zeroLengthEdges = segments.filter(s => samePoint(s.a, s.b)).map(s => s.id);
  const railViolations = task.terminals.filter(t => !integer(positions[t.group]+t.offset, t.rail.min, t.rail.max)).map(t => t.id);
  const railsValid = railViolations.length === 0;
  return {nodes, rails, groups, segments, conflicts, conflictEdgeIds, conflictCount: conflicts.length,
    coincidentNodes, zeroLengthEdges, railViolations, railsValid,
    matched: railsValid && coincidentNodes.length === 0 && zeroLengthEdges.length === 0 && conflicts.length === 0};
}
const normalizeSeed = seed => integer(seed, 0, 4294967295) ? seed : 743;
const normalizeLevel = level => integer(level, 0, 2) ? level : 0;
function expectedCreate(seed, level) {
  seed = normalizeSeed(seed); level = normalizeLevel(level);
  const positions = PUBLIC_CONFIG.tasks[level].groups.map(g => g.initial);
  return {schema: 1, seed, level, phase: 'playing', reason: '', score: 0, positions, selected: 0,
    geometry: geometry(level, positions), movesUsed: 0, moves: [], calls: 0, selectionChanges: 0, blockedMoves: 0,
    elapsed: 0, counterSaturated: false, clockSaturated: false, inputArmed: false, cancelEpoch: null,
    cancelledLast: false, lastHeld: {a: false, b: false, direction: 'none'}, lastCommand: 'none', events: [], message: INITIAL_MESSAGE};
}
const STATE_KEYS = ['schema', 'seed', 'level', 'phase', 'reason', 'score', 'positions', 'selected', 'geometry',
  'movesUsed', 'moves', 'calls', 'selectionChanges', 'blockedMoves', 'elapsed', 'counterSaturated', 'clockSaturated',
  'inputArmed', 'cancelEpoch', 'cancelledLast', 'lastHeld', 'lastCommand', 'events', 'message'];
const RECEIPT_KEYS = ['index', 'call', 'elapsed', 'terminal', 'group', 'axis', 'delta', 'fromPositions', 'toPositions',
  'conflictCount', 'nodeCollisionCount', 'zeroLengthCount', 'railsValid', 'matched', 'remaining', 'phase'];
const commandAxis = command => ['left', 'right'].includes(command) ? 'x' : ['up', 'down'].includes(command) ? 'y' : null;
const commandSign = command => ['left', 'up'].includes(command) ? -1 : 1;
function checkPositions(r, positions, task, path) {
  if (!requireThat(r, Array.isArray(positions) && positions.length === task.groups.length, path, 'Complete canonical group positions required.')) return false;
  return positions.map((q, i) => {
    const bounds = groupBounds(task, i);
    return requireThat(r, integer(q, bounds.min, bounds.max), `${path}[${i}]`, 'Ordinary placement must be an integer within every member rail.');
  }).every(Boolean);
}
function checkEndpoint(r, state, path) {
  r.counts.endpoints++;
  if (!keysExactly(r, state, STATE_KEYS, path)) return;
  if (!requireThat(r, integer(state.level, 0, 2), `${path}.level`, 'Invalid task index.')) return;
  const task = PUBLIC_CONFIG.tasks[state.level];
  if (!checkPositions(r, state.positions, task, `${path}.positions`)) return;
  const fresh = geometry(state.level, state.positions);
  expect(r, state.schema, 1, `${path}.schema`);
  requireThat(r, integer(state.seed, 0, 4294967295), `${path}.seed`, 'Normalized seed required.');
  if (!requireThat(r, integer(state.selected, 0, task.terminals.length-1), `${path}.selected`, 'Invalid selected terminal.')) return;
  expect(r, state.geometry, fresh, `${path}.geometry`);
  requireThat(r, integer(state.movesUsed, 0, task.budget), `${path}.movesUsed`, 'Move count outside budget.');
  for (const name of ['calls', 'selectionChanges', 'blockedMoves']) requireThat(r, integer(state[name], 0, LIMIT), `${path}.${name}`, 'Counter outside public bounds.');
  for (const name of ['selectionChanges', 'blockedMoves', 'movesUsed']) requireThat(r, state[name] <= state.calls, `${path}.${name}`, 'Commands cannot exceed admitted calls.');
  if (state.calls < LIMIT) requireThat(r, state.selectionChanges+state.blockedMoves+state.movesUsed <= state.calls, path, 'At most one selected command per admitted call.');
  requireThat(r, finite(state.elapsed) && state.elapsed >= 0 && state.elapsed <= 3600, `${path}.elapsed`, 'Invalid elapsed time.');
  for (const name of ['counterSaturated', 'clockSaturated', 'inputArmed', 'cancelledLast']) requireThat(r, typeof state[name] === 'boolean', `${path}.${name}`, 'Boolean required.');
  requireThat(r, !state.counterSaturated || state.calls === LIMIT, path, 'Counter saturation requires capped calls.');
  requireThat(r, !state.clockSaturated || state.elapsed === 3600, path, 'Clock saturation requires capped elapsed.');
  requireThat(r, state.cancelEpoch === null || Number.isSafeInteger(state.cancelEpoch) && state.cancelEpoch >= 0, `${path}.cancelEpoch`, 'Invalid epoch.');
  requireThat(r, !state.cancelledLast || !state.inputArmed, path, 'Cancelled sample cannot remain armed.');
  if (keysExactly(r, state.lastHeld, ['a', 'b', 'direction'], `${path}.lastHeld`))
    requireThat(r, typeof state.lastHeld.a === 'boolean' && typeof state.lastHeld.b === 'boolean' && DIRECTIONS.includes(state.lastHeld.direction), `${path}.lastHeld`, 'Normalized held values required.');
  requireThat(r, COMMANDS.includes(state.lastCommand), `${path}.lastCommand`, 'Invalid command token.');
  requireThat(r, typeof state.message === 'string' && state.message.length <= 160, `${path}.message`, 'Bounded display string required.');
  if (!requireThat(r, Array.isArray(state.moves) && state.moves.length <= task.budget, `${path}.moves`, 'Bounded receipt array required.')) return;
  expect(r, state.movesUsed, state.moves.length, `${path}.movesUsed`);
  let previousActualPositions = task.groups.map(g => g.initial), lastCall = 0, lastElapsed = 0;
  state.moves.forEach((receipt, index) => guarded(r, `${path}.moves[${index}]`, () => {
    const p = `${path}.moves[${index}]`;
    if (!keysExactly(r, receipt, RECEIPT_KEYS, p)) return;
    expect(r, receipt.index, index, `${p}.index`);
    expect(r, receipt.fromPositions, previousActualPositions, `${p}.fromPositions`);
    requireThat(r, integer(receipt.call, 1, state.calls) && (receipt.call > lastCall || receipt.call === LIMIT && lastCall === LIMIT), `${p}.call`, 'Receipt call order invalid.');
    requireThat(r, finite(receipt.elapsed) && receipt.elapsed >= lastElapsed && receipt.elapsed <= state.elapsed, `${p}.elapsed`, 'Receipt elapsed order invalid.');
    const terminal = task.terminals.find(t => t.id === receipt.terminal);
    if (!requireThat(r, !!terminal && [-1, 1].includes(receipt.delta), p, 'Valid selected terminal and nonzero unit delta required.')) return;
    expect(r, receipt.group, task.groups[terminal.group].id, `${p}.group`);
    expect(r, receipt.axis, terminal.rail.axis, `${p}.axis`);
    if (!checkPositions(r, receipt.fromPositions, task, `${p}.fromPositions`) || !checkPositions(r, receipt.toPositions, task, `${p}.toPositions`)) return;
    expect(r, movement(task, receipt.fromPositions, terminal.group, receipt.delta).delta, receipt.delta, `${p}.commonClamp`);
    const expectedTo = [...receipt.fromPositions]; expectedTo[terminal.group] += receipt.delta;
    expect(r, receipt.toPositions, expectedTo, `${p}.uniformTranslation`);
    const g = geometry(state.level, receipt.toPositions);
    expect(r, receipt.conflictCount, g.conflictCount, `${p}.conflictCount`);
    expect(r, receipt.nodeCollisionCount, g.coincidentNodes.length, `${p}.nodeCollisionCount`);
    expect(r, receipt.zeroLengthCount, g.zeroLengthEdges.length, `${p}.zeroLengthCount`);
    expect(r, receipt.railsValid, g.railsValid, `${p}.railsValid`);
    expect(r, receipt.matched, g.matched, `${p}.matched`);
    expect(r, receipt.remaining, task.budget-index-1, `${p}.remaining`);
    const phase = g.matched ? 'won' : index+1 === task.budget ? 'lost' : 'playing';
    expect(r, receipt.phase, phase, `${p}.phase`);
    requireThat(r, phase === 'playing' || index === state.moves.length-1, p, 'Receipt follows a terminal receipt.');
    previousActualPositions = receipt.toPositions; // Observed receipt data, never expectedTo.
    lastCall = receipt.call; lastElapsed = receipt.elapsed;
  }));
  expect(r, state.positions, previousActualPositions, `${path}.receiptEndpoint`);
  const phase = fresh.matched ? 'won' : state.movesUsed === task.budget ? 'lost' : 'playing';
  expect(r, state.phase, phase, `${path}.phase`);
  expect(r, state.reason, phase === 'lost' ? 'budget' : '', `${path}.reason`);
  expect(r, state.score, phase === 'won' ? 100 : 0, `${path}.score`);
  if (!requireThat(r, Array.isArray(state.events) && state.events.length <= 1, `${path}.events`, 'At most one event per call.')) return;
  const selected = task.terminals[state.selected], group = task.groups[selected.group];
  const axis = commandAxis(state.lastCommand), sign = commandSign(state.lastCommand), receipt = state.moves.at(-1);
  if (state.lastCommand !== 'none') {
    requireThat(r, state.inputArmed && !state.cancelledLast, path, 'Commands require armed, uncancelled input.');
    if (axis) expect(r, state.lastHeld.direction, state.lastCommand, `${path}.commandHeld`);
    else expect(r, state.lastHeld[state.lastCommand], true, `${path}.commandHeld`);
  }
  const event = state.events[0];
  if (phase !== 'playing') {
    requireThat(r, state.moves.length >= 1, path, 'Terminal state lacks an actual move receipt.');
    expect(r, state.calls, lastCall, `${path}.terminalCalls`);
    expect(r, state.elapsed, lastElapsed, `${path}.terminalElapsed`);
    expect(r, state.events, phase === 'won' ? [{type: 'win', call: state.calls}] : [{type: 'collision', reason: 'budget', call: state.calls}], `${path}.terminalEvent`);
    requireThat(r, axis === selected.rail.axis, `${path}.terminalCommand`, 'Result requires a parallel physical move.');
    requireThat(r, receipt && receipt.terminal === selected.id && receipt.delta === sign, `${path}.terminalReceipt`, 'Result command must match the final receipt.');
  } else if (event?.type === 'select') {
    requireThat(r, state.selectionChanges >= 1, `${path}.selectionChanges`, 'Selection event requires a counted selection.');
    requireThat(r, ['a', 'b'].includes(state.lastCommand), `${path}.selectionCommand`, 'Selection requires A or B.');
    expect(r, event, {type: 'select', terminal: selected.id, group: group.id, call: state.calls}, `${path}.selectionEvent`);
  } else if (event?.type === 'blocked') {
    requireThat(r, state.blockedMoves >= 1, `${path}.blockedMoves`, 'Blocked event requires a counted blocked request.');
    requireThat(r, axis === selected.rail.axis, `${path}.blockedCommand`, 'Blocked event requires a parallel direction.');
    const blocked = movement(task, state.positions, selected.group, sign);
    expect(r, blocked.delta, 0, `${path}.blockedDelta`);
    expect(r, event, {type: 'blocked', terminal: selected.id, group: group.id, requested: sign, limiting: blocked.limiting, call: state.calls}, `${path}.blockedEvent`);
  } else if (event?.type === 'move') {
    requireThat(r, axis === selected.rail.axis, `${path}.moveCommand`, 'Move requires a parallel direction.');
    expect(r, event, {type: 'move', terminal: selected.id, group: group.id, delta: sign, call: state.calls}, `${path}.moveEvent`);
    requireThat(r, receipt && receipt.call === state.calls && receipt.elapsed === state.elapsed && receipt.terminal === selected.id && receipt.delta === sign, `${path}.moveReceipt`, 'Move event must match the latest receipt.');
  } else {
    expect(r, state.events, [], `${path}.playingEvents`);
    requireThat(r, state.lastCommand === 'none' || axis !== null && axis !== selected.rail.axis, `${path}.silentCommand`, 'Only neutral or orthogonal commands lack events.');
  }
  if (state.calls === 0) expect(r, state, expectedCreate(state.seed, state.level), `${path}.unadvancedOrigin`);
}

function normalize(input) {
  let values = Object.create(null);
  try {
    if (object(input)) {
      const descriptors = Object.fromEntries(INPUT_KEYS.map(key => [key, Object.getOwnPropertyDescriptor(input, key)]));
      for (const key of INPUT_KEYS)
        if (descriptors[key] && Object.hasOwn(descriptors[key], 'value')) values[key] = descriptors[key].value;
    }
  } catch { values = Object.create(null); }
  const axis = value => finite(value) ? Math.max(-1, Math.min(1, value)) : 0;
  const x = axis(values.x), y = axis(values.y);
  const direction = Math.abs(x) <= .5 && Math.abs(y) <= .5 ? 'none'
    : Math.abs(y) >= Math.abs(x) ? y > 0 ? 'down' : 'up' : x > 0 ? 'right' : 'left';
  return {a: values.a === true, b: values.b === true, cancelled: values.cancelled === true, paused: values.paused === true,
    direction, epoch: Number.isSafeInteger(values.cancelEpoch) && values.cancelEpoch >= 0 ? values.cancelEpoch : null};
}
function increment(state, field) {
  if (state[field] === LIMIT) state.counterSaturated = true;
  state[field] = Math.min(LIMIT, state[field]+1);
}
// One actual adjacent-pair expectation. The result is never fed into a later pair.
function expectedAfter(before, dt, rawInput) {
  if (before.phase !== 'playing' || !finite(dt) || dt <= 0 || dt > .25) return {state: before, exactNoop: true};
  const input = normalize(rawInput);
  if (input.paused) return {state: before, exactNoop: true};
  const next = copy(before), task = PUBLIC_CONFIG.tasks[before.level];
  next.events = []; next.lastCommand = 'none'; increment(next, 'calls');
  const elapsed = before.elapsed+dt; next.elapsed = Math.min(3600, elapsed);
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
  if (command === 'a' || command === 'b') {
    next.selected = (before.selected+(command === 'a' ? 1 : task.terminals.length-1)) % task.terminals.length;
    increment(next, 'selectionChanges');
    const selected = task.terminals[next.selected];
    next.events = [{type: 'select', terminal: selected.id, group: task.groups[selected.group].id, call: next.calls}];
  }
  const selected = task.terminals[before.selected];
  if (commandAxis(command) === selected.rail.axis) {
    const requested = commandSign(command), group = task.groups[selected.group];
    const move = movement(task, before.positions, selected.group, requested);
    if (move.delta === 0) {
      increment(next, 'blockedMoves');
      next.events = [{type: 'blocked', terminal: selected.id, group: group.id, requested, limiting: move.limiting, call: next.calls}];
    } else {
      next.positions[selected.group] += move.delta; next.movesUsed++;
      next.geometry = geometry(before.level, next.positions);
      next.phase = next.geometry.matched ? 'won' : next.movesUsed === task.budget ? 'lost' : 'playing';
      next.reason = next.phase === 'lost' ? 'budget' : ''; next.score = next.phase === 'won' ? 100 : 0;
      next.events = next.phase === 'won' ? [{type: 'win', call: next.calls}]
        : next.phase === 'lost' ? [{type: 'collision', reason: 'budget', call: next.calls}]
        : [{type: 'move', terminal: selected.id, group: group.id, delta: move.delta, call: next.calls}];
      next.moves.push({index: before.moves.length, call: next.calls, elapsed: next.elapsed, terminal: selected.id,
        group: group.id, axis: selected.rail.axis, delta: move.delta, fromPositions: [...before.positions], toPositions: [...next.positions],
        conflictCount: next.geometry.conflictCount, nodeCollisionCount: next.geometry.coincidentNodes.length,
        zeroLengthCount: next.geometry.zeroLengthEdges.length, railsValid: next.geometry.railsValid,
        matched: next.geometry.matched, remaining: task.budget-next.movesUsed, phase: next.phase});
    }
  }
  return {state: next, exactNoop: false};
}

const COMMON_LIMITS = [
  'Checks public projections; declared source hashes and capture provenance require independent source review.',
  'JSON cannot prove identity, detached arrays, deep freezing, getter/proxy behavior, or absence of hidden code; non-JSON raw values need separate accurately typed evidence.',
  'Display message content is not a decision field; only type/length is checked except exact creation and exact no-op snapshots.',
  'Does not establish renderer visibility, actual phone contact/release, browser lifecycle, recording readability, or hardware performance.',
  'Ordinary endpoint mode requires legal canonical rail positions and authentic receipt origins; injected mathematical or invalid-state fixtures are not ordinary runs.',
];
export function auditEndpoint(snapshot) {
  const r = report('endpoint'); guarded(r, 'snapshot', () => checkEndpoint(r, snapshot, 'snapshot'));
  r.limits = [...COMMON_LIMITS, 'Embedded receipt arithmetic is self-consistency only; it does not prove those calls occurred.'];
  return r;
}
export function auditFullRun(run) {
  const r = report('full-model-transitions');
  guarded(r, 'run', () => {
    requireThat(r, object(run) && typeof run.runId === 'string' && run.runId.length > 0, 'run.runId', 'Nonempty run ID required.');
    expect(r, run.channel, 'model', 'run.channel'); checkSources(r, run.sourceHashes, 'run.sourceHashes');
    expect(r, run.origin.kind, 'create', 'run.origin.kind');
    requireThat(r, Object.hasOwn(run.origin, 'seed') && Object.hasOwn(run.origin, 'level'), 'run.origin', 'Actual public create arguments required.');
    expect(r, run.origin.state, expectedCreate(run.origin.seed, run.origin.level), 'run.origin.state');
    if (run.origin.publicConfig !== undefined) expect(r, run.origin.publicConfig, PUBLIC_CONFIG, 'run.origin.publicConfig');
    checkEndpoint(r, run.origin.state, 'run.origin.state');
    if (!requireThat(r, Array.isArray(run.calls), 'run.calls', 'Actual call array required.')) return;
    let previousActual = run.origin.state;
    run.calls.forEach((call, index) => guarded(r, `run.calls[${index}]`, () => {
      const p = `run.calls[${index}]`; expect(r, call.kind, 'call', `${p}.kind`); expect(r, call.seq, index+1, `${p}.seq`);
      requireThat(r, call.error === null || call.error === undefined, `${p}.error`, 'Execution error retained: this attempt fails audit.');
      requireThat(r, Object.hasOwn(call, 'dt') && Object.hasOwn(call, 'input'), p, 'Exact actual dt and raw own-data input are required; missing is distinct from false.');
      expect(r, call.before, previousActual, `${p}.actualAdjacency`);
      checkEndpoint(r, call.before, `${p}.before`); checkEndpoint(r, call.after, `${p}.after`);
      const expected = expectedAfter(call.before, call.dt, call.input);
      if (expected.exactNoop) expect(r, call.after, expected.state, `${p}.exactNoop`);
      else {
        const actualWithoutMessage = {...call.after}, expectedWithoutMessage = {...expected.state};
        delete actualWithoutMessage.message; delete expectedWithoutMessage.message;
        expect(r, actualWithoutMessage, expectedWithoutMessage, `${p}.transition`);
      }
      expect(r, call.after.moves.slice(0, call.before.moves.length), call.before.moves, `${p}.immutableReceiptPrefix`);
      r.counts.fullPairs++; previousActual = call.after; // Actual only, never expected.state.
    }));
    expect(r, run.end.final, previousActual, 'run.end.final'); expect(r, run.end.calls, run.calls.length, 'run.end.calls');
    expect(r, run.end.outcome, previousActual.phase, 'run.end.outcome'); expect(r, run.end.reason, previousActual.reason, 'run.end.reason');
    requireThat(r, run.end.failure === null || run.end.failure === undefined, 'run.end.failure', 'Producer failure retained rather than replaced.');
    r.runId = run.runId; r.level = run.origin.state.level; r.outcome = previousActual.phase; r.sourceHashes = copy(run.sourceHashes);
  });
  r.limits = [...COMMON_LIMITS, 'Full transition verdict is conditional on the producer retaining every actual call and exact input without omission.'];
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
      requireThat(r, typeof segment.originKind === 'string' && segment.originKind.length > 0, `${p}.originKind`, 'Actual declared origin kind required.');
      requireThat(r, object(segment.parentContext) && typeof segment.parentContext.clock === 'string' && segment.parentContext.clock.length > 0, `${p}.parentContext.clock`, 'Retain actual parent clock description, units and origin.');
      if (!requireThat(r, Array.isArray(segment.observations) && segment.observations.length > 0, `${p}.observations`, 'Nonempty actual observations required.')) return;
      let prior = null, previousActualModel = null, modelIdentity = null, endpointCount = 0;
      segment.observations.forEach((observation, oi) => guarded(r, `${p}.observations[${oi}]`, () => {
        const op = `${p}.observations[${oi}]`, window = observation.readWindow;
        requireThat(r, Number.isSafeInteger(observation.seq) && observation.seq >= 1, `${op}.seq`, 'Original sequence required.');
        requireThat(r, Number.isSafeInteger(observation.sourceObservationIndex) && observation.sourceObservationIndex >= 0, `${op}.sourceObservationIndex`, 'Original source index required.');
        if (!requireThat(r, object(window) && finite(window.start) && finite(window.end) && window.start >= 0 && window.end >= window.start, `${op}.readWindow`, 'Actual read start/end in the declared parent clock required.')) return;
        requireThat(r, typeof observation.observedAt === 'string' && Number.isFinite(Date.parse(observation.observedAt)), `${op}.observedAt`, 'Actual completion timestamp required.');
        if (!requireThat(r, object(observation.snapshot) && Object.hasOwn(observation.snapshot, 'model'), `${op}.snapshot`, 'Full unmodified host wrapper with its model/null field required.')) return;
        if (prior) {
          requireThat(r, observation.seq > prior.seq && observation.sourceObservationIndex > prior.sourceObservationIndex, op, 'Original indices must increase.');
          requireThat(r, window.start >= prior.readWindow.start, `${op}.readWindow`, 'Read windows must retain monotone parent-clock order.');
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
            requireThat(r, model.calls >= previousActualModel.calls && model.elapsed >= previousActualModel.elapsed
              && model.movesUsed >= previousActualModel.movesUsed && model.selectionChanges >= previousActualModel.selectionChanges
              && model.blockedMoves >= previousActualModel.blockedMoves, op, 'Observed reset requires a separate retry/task segment.');
            expect(r, model.moves.slice(0, previousActualModel.moves.length), previousActualModel.moves, `${op}.observedReceiptPrefix`);
            requireThat(r, !previousActualModel.counterSaturated || model.counterSaturated, `${op}.counterSaturated`, 'Observed sticky counter flag cannot reset.');
            requireThat(r, !previousActualModel.clockSaturated || model.clockSaturated, `${op}.clockSaturated`, 'Observed sticky clock flag cannot reset.');
            if (model.calls === previousActualModel.calls && model.calls < LIMIT)
              expect(r, model, previousActualModel, `${op}.unchangedAdmittedCount`);
            if (previousActualModel.phase !== 'playing') expect(r, model, previousActualModel, `${op}.observedTerminalFreeze`);
          }
          previousActualModel = model;
        }
        prior = observation;
      }));
      r.segments.push({segmentId: segment.segmentId, runId: segment.runId, declaredOrigin: segment.originKind,
        parentContext: copy(segment.parentContext), modelIdentity, observations: segment.observations.length, endpoints: endpointCount,
        retainedObservations: copy(segment.observations), continuity: 'not-observed', lifecycle: 'review-required'});
    }));
    if (Array.isArray(corpus.boundaryGaps)) {
      r.counts.declaredBoundaryGaps = corpus.boundaryGaps.length; r.boundaryGaps = copy(corpus.boundaryGaps);
      for (let i = 1; i < corpus.segments.length; i++) {
        const from = corpus.segments[i-1].segmentId, to = corpus.segments[i].segmentId;
        requireThat(r, corpus.boundaryGaps.some(g => g.fromSegmentId === from && g.toSegmentId === to), 'corpus.boundaryGaps', `Missing declared boundary ${from} -> ${to}.`);
      }
    }
  });
  r.limits = [...COMMON_LIMITS,
    'All sparse interval continuity, unseen movement, input edges, dt and gate changes remain not-observed or review-required.',
    'Embedded receipts are checked for arithmetic consistency only; no embedded history becomes an observed adjacent transition.',
    'Equal endpoint placements do not exclude intervening forward/back movement; endpoint counts do not reveal individual calls.',
    'Source indices, segment boundaries, parent clocks and retained host wrappers are preserved claims requiring source review.',
    'Menu/null-model observations are retained but have no model endpoint to check.'];
  return r;
}
