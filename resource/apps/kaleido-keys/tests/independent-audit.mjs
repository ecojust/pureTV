/* Kaleido Keys independent PUBLIC-only auditor, version 1.
 * Authored from the accepted game45 public specification before corpus access.
 * No production/pilot/private-helper imports, source-answer cache, route, or search.
 * Each full-pair expectation starts with the recorded ACTUAL before state.
 * Sparse endpoint/receipt consistency never becomes observed hidden transitions.
 */
const GAME = 'kaleido-keys', LIMIT = 2147483647, ELAPSED_LIMIT = 86400;
const INITIAL_MESSAGE = '摆放源扇区，比较镜像窗口；验收格 A 提交，B 清空。';
const DOC_HASHES = {
  design: 'cb339cafa3f59d407813aead24427ee36c1abc1678b89e3d53920b00c8da012f',
  contract: '029b34e53ce544d45d6405938dd585c358e40dfa361d68c849a847f6a2bf7aaf',
  interface: 'edf8b355944cd6d4bc248669b6287db2120e730618599db6dfdda0618be8c64b',
};
const ORDERS = [3, 4, 5], RADII = [0.42, 0.66, 0.90], GLYPH_IDS = ['hook', 'flag', 'sprout'];
const ZH = {hook: '钩', flag: '旗', sprout: '芽'};
const DIRECTIONS = ['none', 'up', 'down', 'left', 'right'], COMMANDS = [...DIRECTIONS, 'a', 'b'];
const INPUT_KEYS = ['x', 'y', 'a', 'b', 'cancelEpoch', 'cancelled', 'paused'];
const COUNTERS = ['calls', 'moves', 'placements', 'rotations', 'removals', 'orderChanges', 'paletteChanges', 'clears', 'blockedActions'];
const finite = value => typeof value === 'number' && Number.isFinite(value);
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const clone = value => Array.isArray(value) ? value.map(clone) : object(value)
  ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)])) : value;
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function equal(left, right) {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length && left.every((item, i) => equal(item, right[i]));
  if (!object(left) || !object(right)) return false;
  const keys = Object.keys(left).sort(), other = Object.keys(right).sort();
  return equal(keys, other) && keys.every(key => equal(left[key], right[key]));
}
const round12 = value => Math.round(value * 1e12) / 1e12 || 0;
const normalizedTurn = value => (4 - value) % 4;

// Forward geometry for an actual supplied source, or the publicly defined target window.
// Sector-local iteration gives the public ordering without sorting floating coordinates.
function plate(order, source) {
  const cells = [], instances = [], alpha = Math.PI / order;
  for (let sector = 0; sector < 2 * order; sector++) {
    const mirrored = sector % 2 === 1, beta = sector * alpha;
    for (let slot = 0; slot < 6; slot++) {
      const row = Math.floor(slot / 2), col = slot % 2, sourceCol = mirrored ? 1 - col : col;
      const piece = source[2 * row + sourceCol];
      if (piece === null) { cells.push(null); continue; }
      const turn = mirrored ? normalizedTurn(piece.turn) : piece.turn;
      cells.push({glyph: piece.glyph, turn, mirrored});
      const t = (2 * sourceCol - 1) * alpha / 4;
      const px = RADII[row] * Math.sin(t), py = -RADII[row] * Math.cos(t), reflectedX = mirrored ? -px : px;
      const x = Math.cos(beta) * reflectedX - Math.sin(beta) * py;
      const y = Math.sin(beta) * reflectedX + Math.cos(beta) * py;
      const angle = sector * alpha + (mirrored ? -1 : 1) * piece.turn * Math.PI / 2;
      instances.push({sector, slot, row, col, glyph: piece.glyph, turn, mirrored,
        x: round12(x), y: round12(y), angle: round12(angle)});
    }
  }
  return {cells, instances};
}
function publicTarget(order, sector, rows) {
  const mirrored = sector % 2 === 1;
  const window = rows.map(cell => cell === null ? null : {glyph: cell[0], turn: cell[1], mirrored});
  const inverse = Array(6).fill(null);
  window.forEach((cell, slot) => {
    if (cell === null) return;
    const row = Math.floor(slot / 2), col = slot % 2;
    inverse[2 * row + (mirrored ? 1 - col : col)] = {glyph: cell.glyph, turn: mirrored ? normalizedTurn(cell.turn) : cell.turn};
  });
  return {order, sector, window, ...plate(order, inverse)}; // No inverse/source array is retained.
}
export const PUBLIC_CONFIG = freeze({
  defaultSeed: 745, orders: [...ORDERS], radii: [...RADII], glyphScale: 0.007,
  glyphs: [
    {id: 'hook', name: 'HOOK', nameZh: '钩', polygons: [[[-4, -5], [-1, -5], [-1, 2], [4, 2], [4, 5], [-4, 5]]]},
    {id: 'flag', name: 'FLAG', nameZh: '旗', polygons: [[[-4, -5], [-2, -5], [-2, 5], [-4, 5]], [[-2, -5], [5, -2], [-2, 1]]]},
    {id: 'sprout', name: 'SPROUT', nameZh: '芽', polygons: [[[-1, -5], [1, -5], [1, 5], [-1, 5]],
      [[1, -3], [5, -5], [5, -1], [1, 1]], [[0, 1], [-4, 2], [-4, 4], [0, 3]]]},
  ],
  attemptLimit: 4, maxElapsed: ELAPSED_LIMIT, maxCounter: LIMIT,
  tasks: [
    {id: 'first-rosette', name: 'FIRST ROSETTE', nameZh: '初见花钥', initialOrder: 4,
      inventory: {hook: 1, flag: 1, sprout: 1},
      target: publicTarget(3, 0, [['hook', 0], null, null, ['flag', 1], ['sprout', 3], null])},
    {id: 'mirror-bloom', name: 'MIRROR BLOOM', nameZh: '镜中花钥', initialOrder: 3,
      inventory: {hook: 2, flag: 1, sprout: 1},
      target: publicTarget(4, 1, [null, ['hook', 3], ['flag', 1], null, ['sprout', 0], ['hook', 2]])},
    {id: 'fivefold-crown', name: 'FIVEFOLD CROWN', nameZh: '五重冠钥', initialOrder: 4,
      inventory: {hook: 1, flag: 1, sprout: 2},
      target: publicTarget(5, 3, [['sprout', 1], ['flag', 2], null, ['hook', 3], ['sprout', 2], null])},
  ],
});
function stock(level, source) {
  const result = clone(PUBLIC_CONFIG.tasks[level].inventory);
  source.forEach(cell => { if (cell !== null) result[cell.glyph]--; });
  return result;
}
function pattern(level, order, source) {
  const target = PUBLIC_CONFIG.tasks[level].target, current = plate(order, source);
  const inspection = clone(current.cells.slice(target.sector * 6, target.sector * 6 + 6));
  const windowMatches = inspection.map((cell, i) => equal(cell, target.window[i]));
  const orderMatched = order === target.order;
  return {order, sectorCount: 2 * order, ...current, inspection, windowMatches,
    windowMatchedCount: windowMatches.filter(Boolean).length, orderMatched,
    matched: orderMatched && equal(current.cells, target.cells)};
}
function visibleTarget(level) {
  const target = PUBLIC_CONFIG.tasks[level].target;
  return {order: target.order, sector: target.sector, window: clone(target.window)};
}
function expectedCreate(seed, level) {
  seed = integer(seed, 0, 4294967295) ? seed : 745; level = integer(level, 0, 2) ? level : 0;
  const order = PUBLIC_CONFIG.tasks[level].initialOrder, source = Array(6).fill(null);
  return {schema: 1, seed, level, phase: 'playing', reason: '', score: 0, order, source,
    focus: {row: 0, col: 0}, selectedGlyph: 'hook', target: visibleTarget(level), stock: stock(level, source),
    pattern: pattern(level, order, source), elapsed: 0, elapsedCapped: false, failures: 0, submissions: [], terminalReceipt: null,
    calls: 0, moves: 0, placements: 0, rotations: 0, removals: 0, orderChanges: 0, paletteChanges: 0, clears: 0, blockedActions: 0,
    counterSaturated: false, inputArmed: false, cancelEpoch: null, cancelledLast: false,
    lastHeld: {a: false, b: false, direction: 'none'}, lastCommand: 'none', events: [], message: INITIAL_MESSAGE};
}
const focusLabel = focus => focus.col === 2 ? ['阶数', '图符', '验收'][focus.row]
  : ['内圈左槽', '内圈右槽', '中圈左槽', '中圈右槽', '外圈左槽', '外圈右槽'][focus.row * 2 + focus.col];
function eventMessage(event, failures) {
  const name = ZH[event.type === 'palette' ? event.to : event.glyph];
  switch (event.type) {
    case 'move': return `已选择${focusLabel(event.focus)}。`;
    case 'blocked': return event.reason === 'boundary' ? '已到选择边界。' : event.reason === 'empty' ? '此源插槽为空。'
      : `所选${name}图符库存已用完，先取回再放置。`;
    case 'place': return `已放置${name}图符，朝向 0。`;
    case 'rotate': return `已将${name}图符旋转到朝向 ${event.to}。`;
    case 'remove': return `已取回${name}图符，返还 1 枚。`;
    case 'order': return `镜面对称阶数改为 ${event.to}；源图符与库存不变。`;
    case 'palette': return `已选择${name}图符。`;
    case 'clear': return `已清空源扇区，返还 ${event.removed} 枚图符；错误记录保留。`;
    case 'reject': return `整幅钥匙尚未匹配，剩余 ${4 - failures} 次错误额度。`;
    case 'win': return '完整钥匙匹配，验收成功。';
    case 'collision': return '四次错误提交，花钥未能开启。';
    default: throw new Error('Unknown event cannot determine a public message.');
  }
}
function terminal(state) {
  return {cause: state.phase === 'won' ? 'success' : 'attempts', call: state.calls, elapsed: state.elapsed,
    order: state.order, source: clone(state.source), stock: clone(state.stock), cells: clone(state.pattern.cells),
    matched: state.pattern.matched, failures: state.failures, remaining: 4 - state.failures,
    score: state.score, phase: state.phase, reason: state.reason};
}
const STATE_KEYS = ['schema', 'seed', 'level', 'phase', 'reason', 'score', 'order', 'source', 'focus', 'selectedGlyph',
  'target', 'stock', 'pattern', 'elapsed', 'elapsedCapped', 'failures', 'submissions', 'terminalReceipt', ...COUNTERS,
  'counterSaturated', 'inputArmed', 'cancelEpoch', 'cancelledLast', 'lastHeld', 'lastCommand', 'events', 'message'];
const RECEIPT_KEYS = ['index', 'call', 'elapsed', 'order', 'source', 'stock', 'inspection', 'orderMatched',
  'windowMatchedCount', 'cells', 'matched', 'failuresBefore', 'failuresAfter', 'remaining', 'phase', 'reason'];
function report(mode) {
  return {auditorVersion: 1, game: GAME, mode, ok: true, acceptedPublicDocHashes: clone(DOC_HASHES),
    counts: {endpoints: 0, fullPairs: 0, sparseIntervals: 0, declaredBoundaryGaps: 0}, findings: [], limits: []};
}
function requireThat(result, condition, path, detail) {
  if (!condition) { result.ok = false; result.findings.push({path, detail}); }
  return condition;
}
const expect = (r, actual, expected, path) => requireThat(r, equal(actual, expected), path, {expected, actual});
const exactKeys = (r, value, keys, path) => requireThat(r, object(value)
  && equal(Object.keys(value).sort(), [...keys].sort()), path, 'Exact documented fields required.');
function guarded(r, path, action) {
  try { return action(); } catch (error) { requireThat(r, false, path, `Malformed public projection: ${String(error.message || error)}`); return null; }
}
function hashes(r, value, path) {
  if (!requireThat(r, object(value) && Object.keys(value).length > 0, path, 'Nonempty declared source digest map required.')) return;
  for (const [key, digest] of Object.entries(value)) requireThat(r, key.length > 0 && typeof digest === 'string'
    && /^[a-f0-9]{64}$/.test(digest), `${path}.${key}`, 'Nonempty source name and lowercase SHA256 required; authenticity remains source-review scope.');
}
function docHashes(r, value, path) {
  hashes(r, value, path);
  for (const [name, digest] of Object.entries(DOC_HASHES)) requireThat(r, object(value) && Object.values(value).includes(digest),
    `${path}.${name}`, 'Accepted canonical public-document digest required.');
}
const timestamp = (r, value, path) => requireThat(r, typeof value === 'string' && Number.isFinite(Date.parse(value)), path, 'Actual UTC observation timestamp required.');
function sourceValid(r, source, level, path) {
  if (!requireThat(r, Array.isArray(source) && source.length === 6, path, 'Six source sockets required.')) return false;
  let valid = true;
  source.forEach((cell, i) => {
    if (cell !== null && (!exactKeys(r, cell, ['glyph', 'turn'], `${path}[${i}]`)
      || !requireThat(r, GLYPH_IDS.includes(cell.glyph) && integer(cell.turn, 0, 3), `${path}[${i}]`, 'Public glyph and integer quarter turn required.'))) valid = false;
  });
  if (valid) valid = requireThat(r, Object.values(stock(level, source)).every(value => value >= 0), path, 'Physical source pieces cannot exceed finite inventory.');
  return valid;
}
const delta = command => ({up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1]})[command];
function checkEndpoint(r, state, path) {
  r.counts.endpoints++;
  if (!exactKeys(r, state, STATE_KEYS, path)) return;
  if (!requireThat(r, integer(state.level, 0, 2), `${path}.level`, 'Normalized task index required.')
    || !sourceValid(r, state.source, state.level, `${path}.source`)
    || !requireThat(r, ORDERS.includes(state.order), `${path}.order`, 'Public order 3, 4 or 5 required.')) return;
  expect(r, state.schema, 1, `${path}.schema`); requireThat(r, integer(state.seed, 0, 4294967295), `${path}.seed`, 'Normalized seed required.');
  if (!exactKeys(r, state.focus, ['row', 'col'], `${path}.focus`) || !requireThat(r,
    integer(state.focus.row, 0, 2) && integer(state.focus.col, 0, 2), `${path}.focus`, 'Focus must remain on the 3×3 board.')) return;
  requireThat(r, GLYPH_IDS.includes(state.selectedGlyph), `${path}.selectedGlyph`, 'Selected palette glyph required.');
  expect(r, state.target, visibleTarget(state.level), `${path}.target`);
  expect(r, state.stock, stock(state.level, state.source), `${path}.stock`);
  expect(r, state.pattern, pattern(state.level, state.order, state.source), `${path}.pattern`);
  requireThat(r, finite(state.elapsed) && state.elapsed >= 0 && state.elapsed <= ELAPSED_LIMIT, `${path}.elapsed`, 'Finite informational elapsed within cap required.');
  for (const field of COUNTERS) {
    requireThat(r, integer(state[field], 0, LIMIT), `${path}.${field}`, 'Bounded integer counter required.');
    requireThat(r, state[field] <= state.calls, `${path}.${field}`, 'Action counter cannot exceed admitted calls.');
  }
  for (const field of ['elapsedCapped', 'counterSaturated', 'inputArmed', 'cancelledLast']) requireThat(r, typeof state[field] === 'boolean', `${path}.${field}`, 'Boolean required.');
  requireThat(r, !state.elapsedCapped || state.elapsed === ELAPSED_LIMIT, `${path}.elapsedCapped`, 'Clock overflow flag requires capped elapsed.');
  requireThat(r, !state.counterSaturated || state.calls === LIMIT, `${path}.counterSaturated`, 'Counter overflow requires saturated admitted calls.');
  requireThat(r, state.cancelEpoch === null || Number.isSafeInteger(state.cancelEpoch) && state.cancelEpoch >= 0, `${path}.cancelEpoch`, 'Null or nonnegative safe epoch required.');
  requireThat(r, !state.cancelledLast || !state.inputArmed, `${path}.inputArmed`, 'Cancelled input cannot remain armed.');
  if (exactKeys(r, state.lastHeld, ['a', 'b', 'direction'], `${path}.lastHeld`)) requireThat(r,
    typeof state.lastHeld.a === 'boolean' && typeof state.lastHeld.b === 'boolean' && DIRECTIONS.includes(state.lastHeld.direction), `${path}.lastHeld`, 'Normalized held fields required.');
  requireThat(r, COMMANDS.includes(state.lastCommand), `${path}.lastCommand`, 'Public command token required.');
  requireThat(r, typeof state.message === 'string' && state.message.length <= 160, `${path}.message`, 'Bounded message required.');
  if (state.lastCommand !== 'none') {
    requireThat(r, state.inputArmed && !state.cancelledLast, path, 'Accepted command requires armed uncancelled input.');
    if (['a', 'b'].includes(state.lastCommand)) expect(r, state.lastHeld[state.lastCommand], true, `${path}.commandHeld`);
    else expect(r, state.lastHeld.direction, state.lastCommand, `${path}.commandHeld`);
  }
  if (!requireThat(r, Array.isArray(state.submissions) && state.submissions.length <= 4, `${path}.submissions`, 'At most four actual submission receipts required.')) return;
  if (state.calls < LIMIT) requireThat(r, COUNTERS.slice(1).reduce((sum, key) => sum + state[key], state.submissions.length) <= state.calls,
    `${path}.operationCount`, 'At most one operation per admitted call.');
  requireThat(r, state.source.filter(Boolean).length <= state.placements, `${path}.placements`, 'Current pieces require prior placements.');
  requireThat(r, state.removals <= state.placements, `${path}.removals`, 'Each removal requires an earlier placement.');
  let failures = 0, lastCall = 0, lastElapsed = 0;
  state.submissions.forEach((receipt, index) => guarded(r, `${path}.submissions[${index}]`, () => {
    const p = `${path}.submissions[${index}]`;
    if (!exactKeys(r, receipt, RECEIPT_KEYS, p) || !sourceValid(r, receipt.source, state.level, `${p}.source`)
      || !requireThat(r, ORDERS.includes(receipt.order), `${p}.order`, 'Public submission order required.')) return;
    expect(r, receipt.index, index, `${p}.index`);
    requireThat(r, integer(receipt.call, 1, state.calls) && (receipt.call > lastCall || receipt.call === LIMIT && lastCall === LIMIT), `${p}.call`, 'Receipt call order required.');
    requireThat(r, finite(receipt.elapsed) && receipt.elapsed >= lastElapsed && receipt.elapsed <= state.elapsed, `${p}.elapsed`, 'Receipt elapsed order required.');
    const fresh = pattern(state.level, receipt.order, receipt.source);
    expect(r, receipt.stock, stock(state.level, receipt.source), `${p}.stock`);
    for (const key of ['inspection', 'orderMatched', 'windowMatchedCount', 'cells', 'matched']) expect(r, receipt[key], fresh[key], `${p}.${key}`);
    expect(r, receipt.failuresBefore, failures, `${p}.failuresBefore`); if (!fresh.matched) failures++;
    expect(r, receipt.failuresAfter, failures, `${p}.failuresAfter`); expect(r, receipt.remaining, 4 - failures, `${p}.remaining`);
    const phase = fresh.matched ? 'won' : failures === 4 ? 'lost' : 'playing';
    expect(r, receipt.phase, phase, `${p}.phase`); expect(r, receipt.reason, phase === 'lost' ? 'attempts' : '', `${p}.reason`);
    requireThat(r, phase === 'playing' || index === state.submissions.length - 1, p, 'No receipt may follow a terminal submission.');
    lastCall = receipt.call; lastElapsed = receipt.elapsed;
  }));
  expect(r, state.failures, failures, `${path}.failures`); requireThat(r, integer(state.failures, 0, 4), `${path}.failures`, 'Bounded rejection allowance required.');
  requireThat(r, ['playing', 'won', 'lost'].includes(state.phase), `${path}.phase`, 'Public phase required.');
  expect(r, state.score, state.phase === 'won' ? 100 : 0, `${path}.score`);
  if (!requireThat(r, Array.isArray(state.events) && state.events.length <= 1, `${path}.events`, 'At most one event required.')) return;
  const receipt = state.submissions.at(-1), event = state.events[0], call = state.calls;
  if (state.phase !== 'playing') {
    requireThat(r, !!receipt && receipt.phase === state.phase, path, 'Terminal result requires a final submission.');
    expect(r, state.focus, {row: 2, col: 2}, `${path}.terminalFocus`); expect(r, state.lastCommand, 'a', `${path}.terminalCommand`);
    expect(r, state.reason, state.phase === 'lost' ? 'attempts' : '', `${path}.reason`);
    requireThat(r, state.phase === 'won' ? state.pattern.matched && failures < 4 : !state.pattern.matched && failures === 4,
      path, 'Terminal result must use all current semantic cells and correct rejection accounting.');
    if (receipt) for (const key of ['call', 'elapsed', 'order', 'source', 'stock', 'phase', 'reason'])
      expect(r, receipt[key], key === 'call' ? state.calls : state[key], `${path}.terminalSubmission.${key}`);
    expect(r, state.terminalReceipt, terminal(state), `${path}.terminalReceipt`);
    const terminalEvent = state.phase === 'won' ? {type: 'win', call} : {type: 'collision', reason: 'attempts', call};
    expect(r, state.events, [terminalEvent], `${path}.events`); expect(r, state.message, eventMessage(terminalEvent, failures), `${path}.message`);
  } else {
    requireThat(r, failures < 4 && (!receipt || receipt.phase === 'playing'), path, 'Playing cannot follow a terminal submission.');
    expect(r, state.reason, '', `${path}.reason`); expect(r, state.terminalReceipt, null, `${path}.terminalReceipt`);
    let expectedEvent = null;
    if (state.lastCommand === 'none') expect(r, state.events, [], `${path}.events`);
    else if (delta(state.lastCommand)) {
      const [dr, dc] = delta(state.lastCommand);
      if (event?.type === 'blocked') {
        requireThat(r, state.blockedActions > 0 && (!integer(state.focus.row + dr, 0, 2) || !integer(state.focus.col + dc, 0, 2)), path, 'Blocked navigation must face a boundary.');
        expectedEvent = {type: 'blocked', reason: 'boundary', call};
      } else {
        requireThat(r, state.moves > 0 && integer(state.focus.row - dr, 0, 2) && integer(state.focus.col - dc, 0, 2), path, 'Move must have a legal adjacent prior focus.');
        expectedEvent = {type: 'move', focus: clone(state.focus), call};
      }
    } else if (['a', 'b'].includes(state.lastCommand)) {
      const forward = state.lastCommand === 'a', {row, col} = state.focus, slot = row * 2 + col, piece = state.source[slot];
      if (col < 2) {
        if (forward && event?.type === 'place') {
          requireThat(r, state.placements > 0 && piece !== null && piece.glyph === state.selectedGlyph && piece.turn === 0, path, 'Place requires selected glyph at turn zero.');
          expectedEvent = {type: 'place', slot, glyph: state.selectedGlyph, turn: 0, call};
        } else if (forward && event?.type === 'rotate') {
          requireThat(r, state.rotations > 0 && piece !== null, path, 'Rotation requires an occupied source.');
          if (piece) expectedEvent = {type: 'rotate', slot, glyph: piece.glyph, from: (piece.turn + 3) % 4, to: piece.turn, call};
        } else if (forward) {
          requireThat(r, state.blockedActions > 0 && piece === null && state.stock[state.selectedGlyph] === 0, path, 'Blocked placement requires empty focus and depleted selected stock.');
          expectedEvent = {type: 'blocked', reason: 'stock', slot, glyph: state.selectedGlyph, call};
        } else if (event?.type === 'remove') {
          requireThat(r, state.removals > 0 && piece === null && GLYPH_IDS.includes(event.glyph) && integer(event.turn, 0, 3)
            && state.stock[event.glyph] >= 1, path, 'Removal requires an emptied source, valid removed piece and at least one refunded piece in stock.');
          expectedEvent = {type: 'remove', slot, glyph: event.glyph, turn: event.turn, call};
        } else {
          requireThat(r, state.blockedActions > 0 && piece === null, path, 'Empty removal must be blocked and counted.');
          expectedEvent = {type: 'blocked', reason: 'empty', slot, call};
        }
      } else if (row === 0) {
        requireThat(r, state.orderChanges > 0, path, 'Order operation must be counted.');
        expectedEvent = {type: 'order', from: ORDERS[(ORDERS.indexOf(state.order) + (forward ? 2 : 1)) % 3], to: state.order, call};
      } else if (row === 1) {
        requireThat(r, state.paletteChanges > 0, path, 'Palette operation must be counted.');
        expectedEvent = {type: 'palette', from: GLYPH_IDS[(GLYPH_IDS.indexOf(state.selectedGlyph) + (forward ? 2 : 1)) % 3], to: state.selectedGlyph, call};
      } else if (!forward) {
        const capacity = Object.values(PUBLIC_CONFIG.tasks[state.level].inventory).reduce((a, b) => a + b, 0);
        requireThat(r, state.clears > 0 && state.source.every(cell => cell === null) && integer(event?.removed, 0, capacity)
          && event.removed <= state.placements, path, 'Clear must empty the source and report a bounded previously placed physical count.');
        expectedEvent = {type: 'clear', removed: event?.removed, call};
      } else {
        requireThat(r, !!receipt && receipt.call === call && receipt.elapsed === state.elapsed, path, 'CHECK/A requires a current submission receipt.');
        if (receipt) for (const key of ['order', 'source', 'stock']) expect(r, receipt[key], state[key], `${path}.currentSubmission.${key}`);
        expectedEvent = {type: 'reject', windowMatchedCount: state.pattern.windowMatchedCount, orderMatched: state.pattern.orderMatched, call};
      }
    }
    if (state.lastCommand !== 'none') {
      requireThat(r, expectedEvent !== null, `${path}.events`, 'Command requires its documented event.');
      if (expectedEvent) { expect(r, state.events, [expectedEvent], `${path}.events`); expect(r, state.message, eventMessage(expectedEvent, failures), `${path}.message`); }
    }
  }
  if (state.calls === 0) expect(r, state, expectedCreate(state.seed, state.level), `${path}.unadvancedOrigin`);
}

function normalized(input) {
  let values = Object.create(null);
  try {
    if (object(input)) {
      const descriptors = INPUT_KEYS.map(key => [key, Object.getOwnPropertyDescriptor(input, key)]);
      for (const [key, descriptor] of descriptors) if (descriptor && Object.hasOwn(descriptor, 'value')) values[key] = descriptor.value;
    }
  } catch { values = Object.create(null); }
  const axis = value => finite(value) ? Math.max(-1, Math.min(1, value)) : 0, x = axis(values.x), y = axis(values.y);
  const direction = Math.abs(x) <= 0.5 && Math.abs(y) <= 0.5 ? 'none'
    : Math.abs(y) >= Math.abs(x) ? y > 0 ? 'down' : 'up' : x > 0 ? 'right' : 'left';
  return {direction, a: values.a === true, b: values.b === true, paused: values.paused === true, cancelled: values.cancelled === true,
    epoch: Number.isSafeInteger(values.cancelEpoch) && values.cancelEpoch >= 0 ? values.cancelEpoch : null};
}
function increment(state, field) {
  if (state[field] === LIMIT) state.counterSaturated = true;
  state[field] = Math.min(LIMIT, state[field] + 1);
}
function refresh(state) { state.stock = stock(state.level, state.source); state.pattern = pattern(state.level, state.order, state.source); }
function expectedAfter(before, dt, rawInput) {
  if (before.phase !== 'playing' || !finite(dt) || dt <= 0 || dt > 0.25) return before;
  const input = normalized(rawInput); if (input.paused) return before;
  const next = clone(before); next.events = []; next.lastCommand = 'none'; increment(next, 'calls');
  const elapsed = before.elapsed + dt; next.elapsed = Math.min(ELAPSED_LIMIT, elapsed);
  if (elapsed > ELAPSED_LIMIT) next.elapsedCapped = true;
  if (input.epoch !== null && before.cancelEpoch !== null && input.epoch !== before.cancelEpoch || input.cancelled && !before.cancelledLast) next.inputArmed = false;
  if (input.epoch !== null) next.cancelEpoch = input.epoch; next.cancelledLast = input.cancelled;
  let command = 'none';
  if (next.inputArmed && !input.cancelled) {
    if (input.b && !before.lastHeld.b) command = 'b';
    else if (input.a && !before.lastHeld.a) command = 'a';
    else if (input.direction !== 'none' && input.direction !== before.lastHeld.direction) command = input.direction;
  }
  next.lastHeld = {a: input.a, b: input.b, direction: input.direction};
  if (!input.cancelled && !input.a && !input.b && input.direction === 'none') next.inputArmed = true;
  next.lastCommand = command; const call = next.calls;
  if (delta(command)) {
    const [dr, dc] = delta(command), row = before.focus.row + dr, col = before.focus.col + dc;
    if (integer(row, 0, 2) && integer(col, 0, 2)) {
      next.focus = {row, col}; increment(next, 'moves'); next.events = [{type: 'move', focus: {row, col}, call}];
    } else { increment(next, 'blockedActions'); next.events = [{type: 'blocked', reason: 'boundary', call}]; }
  } else if (command === 'a' || command === 'b') {
    const forward = command === 'a', {row, col} = before.focus, slot = row * 2 + col;
    if (col < 2) {
      const old = before.source[slot];
      if (forward && old !== null) {
        next.source[slot].turn = (old.turn + 1) % 4; increment(next, 'rotations'); refresh(next);
        next.events = [{type: 'rotate', slot, glyph: old.glyph, from: old.turn, to: next.source[slot].turn, call}];
      } else if (forward && stock(before.level, before.source)[before.selectedGlyph] > 0) {
        next.source[slot] = {glyph: before.selectedGlyph, turn: 0}; increment(next, 'placements'); refresh(next);
        next.events = [{type: 'place', slot, glyph: before.selectedGlyph, turn: 0, call}];
      } else if (forward) {
        increment(next, 'blockedActions'); next.events = [{type: 'blocked', reason: 'stock', slot, glyph: before.selectedGlyph, call}];
      } else if (old !== null) {
        next.source[slot] = null; increment(next, 'removals'); refresh(next);
        next.events = [{type: 'remove', slot, glyph: old.glyph, turn: old.turn, call}];
      } else { increment(next, 'blockedActions'); next.events = [{type: 'blocked', reason: 'empty', slot, call}]; }
    } else if (row === 0) {
      next.order = ORDERS[(ORDERS.indexOf(before.order) + (forward ? 1 : 2)) % 3]; increment(next, 'orderChanges'); refresh(next);
      next.events = [{type: 'order', from: before.order, to: next.order, call}];
    } else if (row === 1) {
      next.selectedGlyph = GLYPH_IDS[(GLYPH_IDS.indexOf(before.selectedGlyph) + (forward ? 1 : 2)) % 3]; increment(next, 'paletteChanges');
      next.events = [{type: 'palette', from: before.selectedGlyph, to: next.selectedGlyph, call}];
    } else if (!forward) {
      const removed = before.source.filter(Boolean).length; next.source = Array(6).fill(null); increment(next, 'clears'); refresh(next);
      next.events = [{type: 'clear', removed, call}];
    } else {
      refresh(next);
      if (next.pattern.matched) { next.phase = 'won'; next.reason = ''; next.score = 100; }
      else { next.failures++; if (next.failures === 4) { next.phase = 'lost'; next.reason = 'attempts'; next.score = 0; } }
      next.events = next.phase === 'won' ? [{type: 'win', call}] : next.phase === 'lost'
        ? [{type: 'collision', reason: 'attempts', call}]
        : [{type: 'reject', windowMatchedCount: next.pattern.windowMatchedCount, orderMatched: next.pattern.orderMatched, call}];
      next.submissions.push({index: before.submissions.length, call, elapsed: next.elapsed, order: next.order,
        source: clone(next.source), stock: clone(next.stock), inspection: clone(next.pattern.inspection), orderMatched: next.pattern.orderMatched,
        windowMatchedCount: next.pattern.windowMatchedCount, cells: clone(next.pattern.cells), matched: next.pattern.matched,
        failuresBefore: before.failures, failuresAfter: next.failures, remaining: 4 - next.failures, phase: next.phase, reason: next.reason});
      if (next.phase !== 'playing') next.terminalReceipt = terminal(next);
    }
  }
  if (next.events.length) next.message = eventMessage(next.events[0], next.failures);
  return next;
}
const LIMITS = [
  'Public JSON projections only; source digests and capture authenticity require independent source review.',
  'Full semantic cells/order/glyph/turn/mirror and stock decide matching exactly; round12 coordinates are display fields, never predicate tolerances.',
  'JSON cannot establish mutable-reference isolation, freezing, getter avoidance, Proxy behavior, or hidden-code absence; typed fixtures are separate evidence.',
  'No rendered pixels, true tile chirality, phone contact/release, hardware performance, recording readability or exact frame/state pairing is established.',
  'Embedded receipts prove arithmetic consistency only; they are not observed historical model calls.',
];
export function auditEndpoint(snapshot) {
  const r = report('endpoint'); guarded(r, 'snapshot', () => checkEndpoint(r, snapshot, 'snapshot')); r.limits = [...LIMITS]; return r;
}
export function auditFullRun(run) {
  const r = report('full-model-transitions');
  guarded(r, 'run', () => {
    expect(r, run.schema, 1, 'run.schema'); expect(r, run.kind, `${GAME}-ordinary-run`, 'run.kind'); expect(r, run.channel, 'model', 'run.channel');
    requireThat(r, typeof run.runId === 'string' && run.runId.length > 0, 'run.runId', 'Nonempty actual run identity required.'); hashes(r, run.sourceHashes, 'run.sourceHashes');
    expect(r, run.origin.kind, 'create', 'run.origin.kind'); expect(r, run.origin.completeCallCapture, true, 'run.origin.completeCallCapture');
    requireThat(r, Object.hasOwn(run.origin, 'seed') && Object.hasOwn(run.origin, 'level'), 'run.origin', 'Actual create arguments required.');
    requireThat(r, typeof run.origin.clock === 'string' && run.origin.clock.length > 0, 'run.origin.clock', 'Actual monotonic clock description required.');
    requireThat(r, typeof run.origin.inputRepresentation === 'string' && run.origin.inputRepresentation.length > 0, 'run.origin.inputRepresentation', 'Raw input representation description required.');
    hashes(r, run.origin.sourceHashes, 'run.origin.sourceHashes'); docHashes(r, run.origin.publicDocHashes, 'run.origin.publicDocHashes');
    expect(r, run.origin.state, expectedCreate(run.origin.seed, run.origin.level), 'run.origin.state'); expect(r, run.origin.publicConfig, PUBLIC_CONFIG, 'run.origin.publicConfig');
    checkEndpoint(r, run.origin.state, 'run.origin.state'); timestamp(r, run.origin.observedAt, 'run.origin.observedAt');
    if (!requireThat(r, Array.isArray(run.calls), 'run.calls', 'Every actual invocation including no-ops must be retained.')) return;
    const timed = Object.hasOwn(run.origin, 'observedMonotonicSeconds'); let lastTime = run.origin.observedMonotonicSeconds;
    if (timed) requireThat(r, finite(lastTime) && lastTime >= 0, 'run.origin.observedMonotonicSeconds', 'Nonnegative actual monotonic seconds required.');
    r.clock = clone(run.origin.clock); r.observationTimes = [{kind: 'origin', observedAt: run.origin.observedAt, observedMonotonicSeconds: lastTime}];
    let previousActual = run.origin.state;
    run.calls.forEach((call, index) => guarded(r, `run.calls[${index}]`, () => {
      const p = `run.calls[${index}]`; expect(r, call.kind, 'call', `${p}.kind`); expect(r, call.seq, index + 1, `${p}.seq`);
      requireThat(r, call.error === null || call.error === undefined, `${p}.error`, 'Actual call failure is retained and fails this audit.');
      requireThat(r, Object.hasOwn(call, 'dt') && Object.hasOwn(call, 'input'), p, 'Own exact actual dt/input required; missing keys are not false.');
      timestamp(r, call.observedAt, `${p}.observedAt`);
      if (timed) { requireThat(r, finite(call.observedMonotonicSeconds) && call.observedMonotonicSeconds >= lastTime, `${p}.observedMonotonicSeconds`, 'Original monotonic observations must not decrease.'); lastTime = call.observedMonotonicSeconds; }
      r.observationTimes.push({kind: 'call', seq: call.seq, observedAt: call.observedAt, observedMonotonicSeconds: call.observedMonotonicSeconds});
      expect(r, call.before, previousActual, `${p}.actualAdjacency`); checkEndpoint(r, call.before, `${p}.before`); checkEndpoint(r, call.after, `${p}.after`);
      expect(r, call.after, expectedAfter(call.before, call.dt, call.input), `${p}.transition`);
      expect(r, call.after.submissions.slice(0, call.before.submissions.length), call.before.submissions, `${p}.preservedReceiptPrefix`);
      if (call.before.terminalReceipt !== null) expect(r, call.after.terminalReceipt, call.before.terminalReceipt, `${p}.preservedTerminalReceipt`);
      r.counts.fullPairs++; previousActual = call.after; // ACTUAL only. Never feed expectedAfter forward.
    }));
    expect(r, run.end.kind, 'end', 'run.end.kind'); timestamp(r, run.end.observedAt, 'run.end.observedAt');
    if (timed) requireThat(r, finite(run.end.observedMonotonicSeconds) && run.end.observedMonotonicSeconds >= lastTime, 'run.end.observedMonotonicSeconds', 'Actual end monotonic ordering required.');
    r.observationTimes.push({kind: 'end', observedAt: run.end.observedAt, observedMonotonicSeconds: run.end.observedMonotonicSeconds});
    expect(r, run.end.complete, true, 'run.end.complete'); expect(r, run.end.calls, run.calls.length, 'run.end.calls');
    expect(r, run.end.final, previousActual, 'run.end.final'); expect(r, run.end.outcome, previousActual.phase, 'run.end.outcome'); expect(r, run.end.reason, previousActual.reason, 'run.end.reason');
    requireThat(r, previousActual.phase !== 'playing', 'run.end.outcome', 'Complete ordinary run must reach an actual terminal outcome.');
    requireThat(r, run.end.failure === null || run.end.failure === undefined, 'run.end.failure', 'Actual producer failure retained rather than replaced.');
    r.runId = run.runId; r.level = run.origin.state.level; r.outcome = previousActual.phase; r.sourceHashes = clone(run.sourceHashes);
  });
  r.limits = [...LIMITS, 'Full-pair verdict is conditional on complete accurate capture of every actual invocation and raw input.']; return r;
}
export function auditSparseSegments(corpus) {
  const r = report('sparse-endpoints'); r.segments = []; r.gaps = [];
  guarded(r, 'corpus', () => {
    if (!requireThat(r, object(corpus) && Array.isArray(corpus.segments) && corpus.segments.length > 0, 'corpus.segments', 'Explicit nonempty source/round segments required.')) return;
    hashes(r, corpus.sourceHashes, 'corpus.sourceHashes'); r.sourceHashes = clone(corpus.sourceHashes);
    requireThat(r, Array.isArray(corpus.boundaryGaps), 'corpus.boundaryGaps', 'Explicit boundary list required, even when empty.');
    const ids = new Set(), runs = new Set();
    corpus.segments.forEach((segment, si) => guarded(r, `segments[${si}]`, () => {
      const p = `segments[${si}]`;
      for (const [key, seen] of [['segmentId', ids], ['runId', runs]]) {
        requireThat(r, typeof segment[key] === 'string' && segment[key].length > 0 && !seen.has(segment[key]), `${p}.${key}`, 'Distinct nonempty projection identity required.'); seen.add(segment[key]);
      }
      expect(r, segment.channel, 'browser', `${p}.channel`);
      requireThat(r, typeof segment.originKind === 'string' && segment.originKind.length > 0, `${p}.originKind`, 'Actual declared origin kind required.');
      requireThat(r, object(segment.parentContext) && typeof segment.parentContext.clock === 'string' && segment.parentContext.clock.length > 0,
        `${p}.parentContext.clock`, 'Original parent clock, units and origin description required.');
      if (!requireThat(r, Array.isArray(segment.observations) && segment.observations.length > 0, `${p}.observations`, 'Original observation rows required.')) return;
      let prior = null, previousActual = null, identity = null, endpoints = 0;
      segment.observations.forEach((observation, oi) => guarded(r, `${p}.observations[${oi}]`, () => {
        const op = `${p}.observations[${oi}]`, window = observation.readWindow;
        requireThat(r, Number.isSafeInteger(observation.seq) && observation.seq >= 1 && Number.isSafeInteger(observation.sourceObservationIndex) && observation.sourceObservationIndex >= 0,
          op, 'Original source sequence/index required.'); timestamp(r, observation.observedAt, `${op}.observedAt`);
        if (!requireThat(r, object(window) && finite(window.start) && finite(window.end) && window.start >= 0 && window.end >= window.start,
          `${op}.readWindow`, 'Actual finite read window in its declared parent clock required.')) return;
        const host = observation.snapshot;
        if (!requireThat(r, object(host) && Object.hasOwn(host, 'model'), `${op}.snapshot`, 'Complete host wrapper including model/null required.')) return;
        requireThat(r, ['id', 'phase', 'paused', 'tick', 'elapsed', 'level', 'best', 'model', 'renderer', 'frameTimesMs', 'connection'].every(key => Object.hasOwn(host, key)), `${op}.snapshot`, 'All documented host fields required.');
        expect(r, host.id, GAME, `${op}.snapshot.id`);
        if (prior) {
          requireThat(r, observation.seq > prior.seq && observation.sourceObservationIndex > prior.sourceObservationIndex && window.start >= prior.readWindow.start,
            op, 'Original stream indices and parent-clock read order must increase.');
          r.counts.sparseIntervals++;
          r.gaps.push({segmentId: segment.segmentId, fromSourceIndex: prior.sourceObservationIndex, toSourceIndex: observation.sourceObservationIndex,
            observedReadWindows: [clone(prior.readWindow), clone(window)], continuity: 'not-observed', inputAndGateTransitions: 'review-required'});
        }
        if (host.model !== null) {
          const current = host.model; checkEndpoint(r, current, `${op}.snapshot.model`); endpoints++;
          const currentIdentity = {seed: current.seed, level: current.level};
          if (identity) expect(r, currentIdentity, identity, `${op}.identity`); else identity = currentIdentity;
          if (segment.level !== undefined) expect(r, current.level, segment.level, `${op}.declaredLevel`);
          if (segment.seed !== undefined) expect(r, current.seed, segment.seed, `${op}.declaredSeed`);
          if (previousActual) {
            for (const key of [...COUNTERS, 'elapsed', 'failures']) requireThat(r, current[key] >= previousActual[key], `${op}.${key}`, 'Observed decrease requires a separate retry/task segment.');
            expect(r, current.submissions.slice(0, previousActual.submissions.length), previousActual.submissions, `${op}.observedReceiptPrefix`);
            for (const key of ['counterSaturated', 'elapsedCapped']) requireThat(r, !previousActual[key] || current[key], `${op}.${key}`, 'Observed sticky cap flag cannot reset.');
            if (current.calls === previousActual.calls && current.calls < LIMIT) expect(r, current, previousActual, `${op}.unchangedAdmittedCount`);
            if (previousActual.phase !== 'playing') expect(r, current, previousActual, `${op}.observedTerminalFreeze`);
          }
          previousActual = current;
        }
        prior = observation;
      }));
      r.segments.push({segmentId: segment.segmentId, runId: segment.runId, declaredOrigin: segment.originKind, parentContext: clone(segment.parentContext),
        modelIdentity: identity, observations: segment.observations.length, endpoints, retainedSegment: clone(segment), continuity: 'not-observed', lifecycle: 'review-required'});
    }));
    if (Array.isArray(corpus.boundaryGaps)) {
      r.boundaryGaps = clone(corpus.boundaryGaps); r.counts.declaredBoundaryGaps = corpus.boundaryGaps.length;
      for (let i = 1; i < corpus.segments.length; i++) {
        const from = corpus.segments[i - 1].segmentId, to = corpus.segments[i].segmentId;
        requireThat(r, corpus.boundaryGaps.some(gap => gap.fromSegmentId === from && gap.toSegmentId === to), 'corpus.boundaryGaps', `Missing declared boundary ${from} -> ${to}.`);
      }
    }
    r.sourceHashSources = clone(corpus.sourceHashSources); r.projection = clone(corpus.projection);
  });
  r.limits = [...LIMITS,
    'Every sparse interval has unobserved calls/dt/inputs; no gate, physical release, movement, source edit or full lifecycle continuity is inferred.',
    'Equal endpoint source/focus does not exclude intervening edits or an invisible same-identity retry.',
    'Exactly-once source-row mapping, original file authenticity and clock conversions require separate public projection review.',
    'Whole segments retain raw rows, original parent/context, input/capture metadata and alias fields; their existence does not prove exact frame/state pairing.',
    'Null-menu rows remain retained without model endpoint checks; different source-stream clocks are never implicitly aligned.'];
  return r;
}
