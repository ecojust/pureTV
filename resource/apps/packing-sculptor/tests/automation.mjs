// Ordinary current-board packing assistant. No model import, future calls,
// solved layout, route, recursive board search or state assignment.
export const budgets = Object.freeze({ maxWebGLDrawCalls: 1, maxCanvasPaintCommands: 0 });

// These are the six publicly displayed rack silhouettes, copied from the
// public design. No task, placement or answer is encoded in this catalogue.
const SHAPES = {
  rail: { width: 3, height: 1, cells: [[0, 0], [1, 0], [2, 0]] },
  elbow: { width: 2, height: 2, cells: [[0, 0], [0, 1], [1, 1]] },
  crate: { width: 2, height: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  bar: { width: 2, height: 1, cells: [[0, 0], [1, 0]] },
  tee: { width: 3, height: 2, cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  zig: { width: 3, height: 2, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] }
};
function check(condition, message) { if (!condition) throw Error(message); }
function key(x, y) { return `${x},${y}`; }
function neutral() { return { x: 0, y: 0, a: false, b: false }; }
function command(name) {
  const input = neutral();
  if (name === 'a' || name === 'b') input[name] = true;
  else if (name === 'left' || name === 'right') input.x = name === 'right' ? 1 : -1;
  else input.y = name === 'down' ? 1 : -1;
  return input;
}
function floor(box, x, y) { return x >= 0 && y >= 0 && x < box.width && y < box.height && box.rows[y][x] === '1'; }
function cellsAt(id, pose) {
  const shape = SHAPES[id];
  check(shape, `Unknown visible piece ${id}`);
  return shape.cells.map(([x, y]) => {
    const rotated = pose.turn === 0 ? [x, y] : pose.turn === 1 ? [shape.height - 1 - y, x]
      : pose.turn === 2 ? [shape.width - 1 - x, shape.height - 1 - y] : [y, shape.width - 1 - x];
    return [rotated[0] + pose.x, rotated[1] + pose.y];
  }).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
function intersects(rect, cell) {
  return rect.minX < cell[0] + 1 && cell[0] < rect.maxX && rect.minY < cell[1] + 1 && cell[1] < rect.maxY;
}
function corridor(box, door, cells) {
  const lowX = Math.min(...cells.map(c => c[0])), highX = Math.max(...cells.map(c => c[0])) + 1;
  const lowY = Math.min(...cells.map(c => c[1])), highY = Math.max(...cells.map(c => c[1])) + 1;
  const horizontal = door.direction === 'left' || door.direction === 'right';
  const fits = door.start <= (horizontal ? lowY : lowX) && (horizontal ? highY : highX) <= door.end;
  const distance = door.direction === 'right' ? box.width - lowX : door.direction === 'left' ? highX
    : door.direction === 'down' ? box.height - lowY : highY;
  const rects = cells.map(([x, y]) => ({ minX: x - (door.direction === 'left' ? distance : 0),
    minY: y - (door.direction === 'up' ? distance : 0), maxX: x + 1 + (door.direction === 'right' ? distance : 0),
    maxY: y + 1 + (door.direction === 'down' ? distance : 0) }));
  let hitsWall = false;
  for (let y = 0; y < box.height; y++) for (let x = 0; x < box.width; x++) {
    if (!floor(box, x, y) && rects.some(rect => intersects(rect, [x, y]))) hitsWall = true;
  }
  return { fits, distance, rects, hitsWall };
}
function actualPieces(s, exceptIndex) {
  return s.placements.flatMap((pose, index) => pose && index !== exceptIndex
    ? [{ index, id: s.pieceIds[index], cells: cellsAt(s.pieceIds[index], pose) }] : []);
}
function requiredOptions(s, index, cells, others) {
  const requirement = s.container.requirements.find(item => item.pieceId === s.pieceIds[index]);
  if (!requirement) return null;
  return requirement.doorIds.map(id => {
    const door = s.container.doors.find(item => item.id === id);
    check(door, `Displayed requirement references missing door ${id}`);
    const route = corridor(s.container, door, cells);
    const blocked = others.some(other => other.cells.some(cell => route.rects.some(rect => intersects(rect, cell))));
    return { ...route, doorId: id, clear: route.fits && !route.hitsWall && !blocked };
  });
}
function keepsExistingExits(s, index, cells, others) {
  // Only corridors of pieces already on the actual board are reserved. This
  // tests the proposed single piece against that current geometry; it never
  // places another hypothetical piece or explores a future board.
  return others.every(other => {
    const obstacles = others.filter(item => item.index !== other.index).concat([{ index, cells }]);
    const options = requiredOptions(s, other.index, other.cells, obstacles);
    return options === null || options.some(option => option.clear);
  });
}
function compareRank(a, b) {
  for (let i = 0; i < a.rank.length; i++) if (a.rank[i] !== b.rank[i]) return a.rank[i] - b.rank[i];
  return 0;
}
function localCandidates(s, index) {
  const box = s.container, id = s.pieceIds[index], others = actualPieces(s, index);
  const occupied = new Set(others.flatMap(other => other.cells.map(cell => key(...cell))));
  const seen = new Set(), choices = [];
  // Enumerate poses of ONE visible piece against the unchanged current board.
  // There is no recursive call, multi-piece hypothetical state or action tree.
  for (let turn = 0; turn < 4; turn++) for (let y = 0; y < box.height; y++) for (let x = 0; x < box.width; x++) {
    const pose = { x, y, turn }, cells = cellsAt(id, pose), signature = JSON.stringify(cells);
    if (seen.has(signature)) continue;
    seen.add(signature);
    if (cells.some(cell => !floor(box, ...cell) || occupied.has(key(...cell)))) continue;
    const exits = requiredOptions(s, index, cells, others);
    if (exits && !exits.some(option => option.clear)) continue;
    if (!keepsExistingExits(s, index, cells, others)) continue;
    const own = new Set(cells.map(cell => key(...cell)));
    let wallContact = 0, pieceContact = 0;
    for (const [cx, cy] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (!own.has(key(nx, ny))) {
        if (!floor(box, nx, ny)) wallContact++;
        else if (occupied.has(key(nx, ny))) pieceContact++;
      }
    }
    let reservedEmpty = 0, distance = 0;
    if (exits) {
      const options = exits.filter(option => option.clear).map(option => {
        let empty = 0;
        for (let ry = 0; ry < box.height; ry++) for (let rx = 0; rx < box.width; rx++) {
          if (floor(box, rx, ry) && !own.has(key(rx, ry)) && option.rects.some(rect => intersects(rect, [rx, ry]))) empty++;
        }
        return { empty, distance: option.distance };
      }).sort((a, b) => a.empty - b.empty || a.distance - b.distance);
      reservedEmpty = options[0].empty; distance = options[0].distance;
    }
    // Pack close to the actual permitted mouth; other pieces prefer a corner
    // or an existing boundary. The tie-break uses only present coordinates.
    const rank = [reservedEmpty, distance, -(2 * wallContact + pieceContact), y, x, turn];
    choices.push({ index, pose, cells, rank, wallContact, pieceContact, reservedEmpty });
  }
  return choices.sort(compareRank);
}
function chooseCurrentPiece(s) {
  const missing = s.placements.map((pose, index) => pose === null ? index : -1).filter(index => index >= 0);
  const required = missing.filter(index => s.container.requirements.some(item => item.pieceId === s.pieceIds[index]));
  // Establish actual marked exits first. For the remaining rack, pick the
  // shape with the fewest distinct legal CURRENT-board poses (not lookahead).
  const pool = required.length ? required : missing;
  const choices = pool.map(index => ({ index, candidates: localCandidates(s, index) }));
  choices.sort((a, b) => a.candidates.length - b.candidates.length || SHAPES[s.pieceIds[b.index]].cells.length - SHAPES[s.pieceIds[a.index]].cells.length || a.index - b.index);
  check(choices.length && choices[0].candidates.length, 'No local current-board pocket remains; retain this actual unsuccessful packing for review');
  return { ...choices[0].candidates[0], alternatives: choices[0].candidates.length };
}
function rackCommand(s, index, whenFocused) { return s.rackIndex === index ? whenFocused : s.rackIndex < index ? 'down' : 'up'; }
function poseCommand(from, to) {
  if (from.turn !== to.turn) return 'b';
  if (from.y !== to.y) return from.y < to.y ? 'down' : 'up';
  if (from.x !== to.x) return from.x < to.x ? 'right' : 'left';
  return 'a';
}

export function makePilot(mode = 'win') {
  check(mode === 'win' || mode === 'loss', 'Unknown ordinary packing policy');
  let decisions = 0, origin = null, lastCue = null, selected = null, boardSignature = '';
  function request(name, label, reason) {
    lastCue = { label, reason, selected: selected ? { index: selected.index, pose: { ...selected.pose }, alternatives: selected.alternatives } : null };
    return { input: name === null ? neutral() : command(name), label, reason };
  }
  return {
    next(value) {
      decisions++;
      const wrapped = value && Object.hasOwn(value, 'model'), s = wrapped ? value.model : value;
      if (!s) return request(null, 'await-visible-state', 'No current model has been observed.');
      if (s.phase === 'won' || s.phase === 'lost') return null;
      if (wrapped && (value.paused || value.phase !== 'playing')) return request(null, 'await-playing', 'Host menu or pause needs its ordinary host control.');
      check(s.phase === 'playing' && Array.isArray(s.placements) && s.container && s.pieceIds.length === s.placements.length,
        'Current public packing state is unavailable');
      if (!origin) origin = { seed: s.seed, level: s.level, placements: structuredClone(s.placements), failures: s.failures,
        submissions: s.submissions.length, calls: s.calls };
      check(s.seed === origin.seed && s.level === origin.level, 'A fresh pilot is required for a different round');
      if (!s.inputArmed || s.cancelledLast || s.lastHeld.a || s.lastHeld.b || s.lastHeld.direction !== 'none')
        return request(null, 'release-and-observe', 'Wait for a genuine admitted neutral sample; held edges never repeat.');
      if (mode === 'loss') {
        check(origin.failures === 0 && origin.submissions === 0 && origin.placements.every(pose => pose === null),
          'Natural loss must begin from an observed fresh empty rack');
        check(s.mode === 'rack' && s.placements.every(pose => pose === null) && !s.geometry.canShip,
          'Natural loss must keep every physical piece in the rack');
        return request(rackCommand(s, s.pieceIds.length, 'a'), 'empty-rack-check', 'Move to CHECK and submit the actually empty box.');
      }
      const signature = JSON.stringify(s.placements);
      if (signature !== boardSignature) { selected = null; boardSignature = signature; }
      if (s.geometry.allPlaced) {
        check(s.geometry.canShip, 'Actual full packing has a blocked required exit; preserve this attempt instead of forcing success');
        check(s.mode === 'rack', 'Ordinary completion must leave preview mode through a real commit');
        return request(rackCommand(s, s.pieceIds.length, 'a'), 'visible-ready-check', 'All actual pieces and their displayed straight exits are ready; submit CHECK.');
      }
      if (!selected) selected = chooseCurrentPiece(s);
      if (s.mode === 'rack') return request(rackCommand(s, selected.index, 'a'), 'select-current-pocket',
        'Pick a visible piece for one legal pocket on the current board; no later placements have been planned.');
      check(s.mode === 'place' && s.rackIndex === selected.index && s.preview, 'Observed preview differs from the selected physical piece');
      const action = poseCommand(s.preview, selected.pose);
      if (action === 'a') check(s.previewCheck?.valid === true, 'Public local candidate and the actual placement feedback disagree; retain the blocked attempt');
      return request(action, action === 'a' ? 'commit-visible-preview' : action === 'b' ? 'turn-visible-preview' : 'move-visible-anchor',
        action === 'a' ? 'Commit only after the actual preview says the whole polygon is legal.' : 'Make one real input edge, release, and inspect the next current preview.');
    },
    diagnostics() { return { mode, decisions, origin: origin ? structuredClone(origin) : null,
      lastCue: lastCue ? structuredClone(lastCue) : null, scope: 'One local candidate on the actual current board; no future multi-piece search or prepared layout.' }; }
  };
}

function inputKeys(input) {
  if (!input) return [];
  if (input.b) return ['b'];
  if (input.a) return ['Space'];
  if (input.y) return [input.y > 0 ? 'ArrowDown' : 'ArrowUp'];
  if (input.x) return [input.x > 0 ? 'ArrowRight' : 'ArrowLeft'];
  return [];
}
export function createPilot({ policy = 'align' } = {}) {
  check(policy === 'align' || policy === 'reject', 'Unknown public packing policy');
  const engine = makePilot(policy === 'reject' ? 'loss' : 'win');
  const pilot = snapshot => inputKeys(engine.next(snapshot)?.input);
  pilot.diagnostics = engine.diagnostics;
  return pilot;
}
let activePilot = null, identity = '', lastCalls = -1, lastElapsed = -1, lastPlacementsMade = -1;
export function keys(snapshot, { mode = 'qa' } = {}) {
  const s = snapshot?.model;
  if (!s || snapshot.phase !== 'playing' || snapshot.paused) return [];
  const next = `${mode}:${s.seed}:${s.level}`;
  if (!activePilot || identity !== next || s.calls < lastCalls || s.elapsed < lastElapsed || s.placementsMade < lastPlacementsMade) {
    activePilot = createPilot(); identity = next;
  }
  lastCalls = s.calls; lastElapsed = s.elapsed; lastPlacementsMade = s.placementsMade;
  return activePilot(snapshot);
}
export function assertProgress({ before, after, trace = [] }, assert) {
  const start = before.model, end = after.model;
  assert.ok(end.calls > start.calls && end.placementsMade > start.placementsMade, 'Actual committed packing progressed');
  assert.equal(end.phase, 'won'); assert.equal(end.reason, ''); assert.equal(end.score, 100);
  assert.equal(end.geometry.canShip, true); assert.equal(end.geometry.validPacking, true);
  assert.equal(end.geometry.allPlaced, true); assert.equal(end.geometry.allInside, true); assert.equal(end.geometry.noOverlap, true);
  assert.ok(end.geometry.extractions.every(entry => entry.canExit)); assert.ok(end.placements.every(Boolean));
  assert.ok(Object.values(end.inventory).every(value => value === 0));
  assert.equal(end.submissions.at(-1).matched, true); assert.equal(end.terminalReceipt.cause, 'success');
  assert.deepEqual(end.submissions.at(-1).placements, end.placements); assert.deepEqual(end.terminalReceipt.geometry, end.geometry);
  const observed = [before, ...trace.map(row => row.snapshot ?? row), after].map(row => row.model).filter(Boolean);
  assert.ok(observed.some(s => s.phase === 'playing' && s.geometry.canShip), 'Actual valid packing remained playing before CHECK');
  assert.ok(observed.some(s => s.geometry.placedCount > 0 && !s.geometry.allPlaced), 'Actual partial packing was observed');
}
export function assertRetry({ after, initial }, assert) {
  const s = after.model;
  assert.equal(s.phase, 'playing'); assert.equal(s.reason, ''); assert.equal(s.score, 0);
  assert.equal(s.mode, 'rack'); assert.equal(s.rackIndex, 0); assert.equal(s.preview, null); assert.equal(s.previewCheck, null);
  assert.ok(s.placements.every(pose => pose === null)); assert.ok(Object.values(s.inventory).every(value => value === 1));
  assert.equal(s.geometry.placedCount, 0); assert.equal(s.geometry.canShip, false); assert.equal(s.terminalReceipt, null);
  for (const field of ['moves', 'pickups', 'placementsMade', 'rotations', 'removals', 'clears', 'blockedActions', 'failures']) assert.equal(s[field], 0, `Retry resets ${field}`);
  assert.deepEqual(s.submissions, []); assert.equal(s.counterSaturated, false); assert.equal(s.elapsedCapped, false);
  assert.deepEqual(s.lastHeld, { a: false, b: false, direction: 'none' });
  if (initial) { assert.deepEqual(s.pieceIds, initial.model.pieceIds); assert.deepEqual(s.container, initial.model.container); assert.deepEqual(s.geometry, initial.model.geometry); }
  // Browser reads can follow actual neutral calls. Exact origin/time/gate
  // bytes are checked in the complete model corpus, not invented here.
}
