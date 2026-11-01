// Observational explorer: only charted floor cells, observed beacons and visible
// hazards guide ordinary keys. It never reads hidden terrain or patrol routes.
export const budgets = Object.freeze({ maxWebGLDrawCalls: 3 });
export const budget = budgets;
const directions = [[1, 0, 'ArrowRight'], [0, 1, 'ArrowDown'], [-1, 0, 'ArrowLeft'], [0, -1, 'ArrowUp']];
const tileKey = (col, row) => `${col},${row}`;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function chart(state) {
  const floors = new Map(), seen = new Set();
  for (const cell of state.cells) {
    if (!cell.seen) continue;
    const id = tileKey(cell.col, cell.row);
    seen.add(id);
    if (cell.type === 'floor') floors.set(id, { id, x: cell.x, y: cell.y, col: cell.col, row: cell.row });
  }
  return { floors, seen };
}
function routes(floors, start, visibleHazards) {
  const found = new Map([[start, []]]), costs = new Map([[start, 0]]), pending = new Set([start]);
  while (pending.size) {
    const id = [...pending].sort((a, b) => costs.get(a) - costs.get(b))[0]; pending.delete(id);
    const current = floors.get(id); if (!current) continue;
    for (const [dx, dy] of directions) {
      const next = tileKey(current.col + dx, current.row + dy), cell = floors.get(next);
      if (!cell) continue;
      const risk = visibleHazards.reduce((sum, hazard) => sum + (distance(cell, hazard) < 45 ? 4 : distance(cell, hazard) < 85 ? 1 : 0), 0);
      const cost = costs.get(id) + 1 + risk;
      if (cost >= (costs.get(next) ?? Infinity)) continue;
      costs.set(next, cost); found.set(next, [...found.get(id), next]); pending.add(next);
    }
  }
  return { paths: found, costs };
}

// Independent instances permit non-interference tests of hidden observations.
export function createPilot() {
  let sessionMode, level, previousTime = -1, waypoint = null;
  let scanRequested = false, nextScanAt = 0, initialScan = true, goal = null;
  const beacons = new Map(), visited = new Set(), scanned = new Set(), scanOrigins = [], hazardMemory = new Map();
  return function pilot(snapshot, { elapsed = 0, mode = 'qa' } = {}) {
    const state = snapshot?.model;
    if (!state?.cells || state.phase !== 'playing' || snapshot.paused) return [];
    if (sessionMode !== mode || level !== state.level || state.elapsed + 0.001 < previousTime) {
      sessionMode = mode; level = state.level; waypoint = null;
      scanRequested = false; nextScanAt = 0; initialScan = true; goal = null;
      beacons.clear(); visited.clear(); scanned.clear(); scanOrigins.length = 0; hazardMemory.clear();
    }
    previousTime = state.elapsed;
    const player = state.player, map = chart(state);
    const current = tileKey(player.col, player.row);
    // Only a beacon that has actually been illuminated can enter this memory.
    for (const beacon of state.beacons) {
      if (beacon.visible) beacons.set(beacon.id, { id: beacon.id, x: beacon.x, y: beacon.y, col: beacon.col, row: beacon.row });
      if (beacons.has(beacon.id) && beacon.collected) beacons.delete(beacon.id);
    }
    const visibleHazards = state.hazards.filter(hazard => hazard.visible).map(hazard => ({ id: hazard.id, x: hazard.x, y: hazard.y, radius: hazard.radius, alerted: hazard.alerted }));
    for (const hazard of visibleHazards) hazardMemory.set(hazard.id, { ...hazard, seenAt: state.elapsed });
    // A short memory of an observed pursuer prevents stopping to scan as it leaves the lamp.
    const threatened = [...hazardMemory.values()].some(hazard => state.elapsed - hazard.seenAt < 2 && distance(player, hazard) < (hazard.alerted ? 180 : 80));
    const urgent = visibleHazards.some(hazard => hazard.alerted && distance(player, hazard) < 80);
    const quiet = !urgent && (visibleHazards.some(hazard => distance(player, hazard) < 200) || (state.elapsed > 2 && state.elapsed < 4));
    const move = target => {
      const dx = target.x - player.x, dy = target.y - player.y;
      let key;
      if (Math.abs(dx) >= Math.abs(dy)) key = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
      else key = dy > 0 ? 'ArrowDown' : 'ArrowUp';
      return quiet ? [key, 'b'] : [key];
    };
    const scan = () => {
      scanRequested = true; initialScan = false; goal = null;
      scanned.add(current); scanOrigins.push({ x: player.x, y: player.y }); nextScanAt = state.elapsed + 1.75;
      return ['Space'];
    };
    // Distinct release frames make every A activation a genuine edge.
    if (scanRequested) { scanRequested = false; return []; }
    if (initialScan && state.cooldown <= 0 && state.battery >= state.sonarCost) return scan();
    if (waypoint) {
      if (distance(player, waypoint) <= 4) { visited.add(waypoint.id); waypoint = null; }
      else return move(waypoint);
    }
    const center = map.floors.get(current);
    if (center && distance(player, center) > 4) { waypoint = center; return move(center); }
    visited.add(current);
    if (goal?.id === current) goal = null;
    if (state.elapsed < nextScanAt && !threatened) return [];
    // Scan a new area before blindly following its edge with the near lamp.
    // This spacing uses only the explorer's own previously emitted positions.
    if (state.collected < state.target && !threatened && state.remaining > 20 && beacons.size === 0 && state.cooldown <= 0 && state.battery >= state.sonarCost && scanOrigins.every(origin => distance(player, origin) >= state.sonarRange * 0.62)) return scan();
    const { paths, costs } = routes(map.floors, current, visibleHazards);
    let target;
    if (state.collected === state.target) target = tileKey(state.entry.col, state.entry.row);
    else {
      const knownTargets = [...beacons.values()].map(beacon => tileKey(beacon.col, beacon.row)).filter(id => paths.has(id));
      knownTargets.sort((a, b) => costs.get(a) - costs.get(b));
      // Keep an observed objective until it is reached; changing patrol costs
      // may alter the route, but must not repeatedly abandon the objective.
      target = goal?.kind === 'beacon' && knownTargets.includes(goal.id) ? goal.id : knownTargets[0];
      if (target) goal = { id: target, kind: 'beacon' };
      if (!target) {
        const frontiers = [...map.floors.values()].filter(cell => paths.has(cell.id) && directions.some(([dx, dy]) => {
          const col = cell.col + dx, row = cell.row + dy;
          return col >= 0 && col < state.grid.cols && row >= 0 && row < state.grid.rows && !map.seen.has(tileKey(col, row));
        }));
        frontiers.sort((a, b) => costs.get(a.id) - costs.get(b.id) || Number(visited.has(a.id)) - Number(visited.has(b.id)) || a.row - b.row || a.col - b.col);
        // Keep an observed objective until it is reached; changing patrol costs
      // may alter the route, but must not repeatedly abandon the objective.
      target = goal?.kind === 'frontier' && paths.has(goal.id) ? goal.id : frontiers.find(cell => !scanned.has(cell.id))?.id;
        if (target) goal = { id: target, kind: 'frontier' };
      }
    }
    if (target && target !== current && paths.has(target)) {
      waypoint = map.floors.get(paths.get(target)[0]); return move(waypoint);
    }
    if (state.collected < state.target && !threatened && state.remaining > 20 && state.cooldown <= 0 && state.battery >= state.sonarCost && state.elapsed >= nextScanAt && !scanned.has(current)) return scan();
    return quiet ? ['b'] : [];
  };
}
const defaultPilot = createPilot();
export const keys = (snapshot, options) => defaultPilot(snapshot, options);

function snapshots(before, after, trace) {
  return [before, ...(trace || []).map(entry => entry.state || entry.snapshot || entry), after].filter(snapshot => snapshot?.model);
}
export function assertProgress({ before, after, trace }, assert) {
  const samples = snapshots(before, after, trace), first = before.model, last = after.model;
  assert.equal(after.phase, 'won', 'ordinary discovery, collection and return must finish the expedition');
  assert.equal(last.phase, 'won'); assert.equal(last.level, first.level);
  assert.equal(last.collected, last.target); assert.ok(last.beacons.every(beacon => beacon.collected));
  assert.ok(distance(last.player, last.entry) <= last.entry.radius + 1e-7, 'winning requires an actual return to the entrance');
  assert.equal(last.entry.unlocked, true); assert.equal(last.lostReason, null);
  assert.ok(last.player.shield > 0 && last.reserve > 0);
  assert.equal(last.score, last.target * 500 + 500 + Math.round(last.remaining * 10) + last.player.shield * 100);
  assert.ok(last.sonarCount >= 1, 'the ordinary A button must emit a paid sonar pulse');
  assert.ok(last.revealedCount > first.revealedCount, 'exploration must reveal additional terrain');
  assert.ok(last.battery < first.battery, 'exploration must consume the finite battery');
  assert.ok(samples.some(({ model }) => distance(model.player, first.player) > model.grid.cellSize * 2), 'direction keys must leave the entrance area');
  assert.ok(samples.some(({ model }) => model.player.quiet && Math.hypot(model.player.vx, model.player.vy) > 1), 'held B must produce real quiet movement');
  assert.ok(samples.some(({ model }) => !model.player.quiet && Math.hypot(model.player.vx, model.player.vy) > 1), 'normal movement must also occur');
  assert.ok(samples.some(({ model }) => model.waves.some(wave => wave.radius > 0 && wave.radius < wave.maxDistance)), 'a pulse must propagate over time rather than reveal instantly');
  const illuminated = new Set(), remembered = new Set(), waveOrigins = new Map();
  let previousCollected = first.collected, previousSeen = first.revealedCount, fadedMemoryObserved = false;
  for (const { model } of samples) {
    assert.ok(model.collected >= previousCollected); previousCollected = model.collected;
    assert.equal(model.collected, model.beacons.filter(beacon => beacon.collected).length, 'each physical beacon counts once');
    assert.ok(model.revealedCount >= previousSeen); previousSeen = model.revealedCount;
    assert.equal(model.revealedCount, model.cells.filter(cell => cell.seen).length);
    assert.ok(model.battery >= 0 && model.battery <= model.maxBattery && model.reserve >= 0 && model.reserve <= model.maxReserve);
    assert.ok(Math.abs(model.remaining - (model.battery / model.batteryDrain + model.reserve)) < 1e-7);
    if (model.battery > 0) assert.ok(Math.abs(model.maxBattery - model.battery - model.elapsed * model.batteryDrain - model.sonarCount * model.sonarCost) < 1e-6, 'passive drain and each sonar cost must explain the battery');
    assert.ok(model.player.shield >= 0 && model.player.shield <= model.player.maxShield);
    for (const cell of model.cells) {
      if (remembered.has(cell.id)) assert.equal(cell.seen, true, 'charted terrain must persist after its echo fades');
      if (cell.seen) remembered.add(cell.id);
      if (cell.visible) { assert.equal(cell.seen, true); illuminated.add(cell.id); }
      else if (cell.seen && illuminated.has(cell.id)) fadedMemoryObserved = true;
    }
    for (const wave of model.waves) {
      const origin = { x: wave.x, y: wave.y, tileId: wave.originTileId };
      if (waveOrigins.has(wave.id)) assert.deepEqual(origin, waveOrigins.get(wave.id), 'moving the player must not move an already emitted sonar origin');
      else waveOrigins.set(wave.id, origin);
      assert.ok(wave.radius >= 0 && wave.radius <= wave.maxDistance + 1e-7);
    }
  }
  assert.ok(fadedMemoryObserved, 'temporary light must fade while the discovered map remains');
}
export function assertRetry({ before, after, initial }, assert) {
  const state = after.model;
  assert.equal(after.phase, 'playing'); assert.equal(state.phase, 'playing');
  assert.equal(state.level, before.model.level); assert.ok(state.elapsed < 0.5 && state.elapsed < before.model.elapsed);
  assert.equal(state.collected, 0); assert.equal(state.score, 0); assert.equal(state.sonarCount, 0);
  assert.equal(state.lostReason, null); assert.equal(state.entry.unlocked, false);
  assert.equal(state.player.shield, state.player.maxShield); assert.equal(state.player.quiet, false);
  assert.equal(state.reserve, state.maxReserve); assert.ok(Math.abs(state.battery - (state.maxBattery - state.elapsed * state.batteryDrain)) < 1e-6);
  assert.equal(state.waves.length, 0); assert.equal(state.cooldown, 0);
  assert.ok(state.beacons.every(beacon => !beacon.collected));
  assert.ok(distance(state.player, state.entry) < 4, 'retry must restore the entrance position');
  if (initial?.model) assert.equal(state.revealedCount, initial.model.revealedCount, 'retry must clear explored terrain back to the initial lamp area');
}
