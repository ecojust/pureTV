// Reads the timetable and visible switch state. All operations are ordinary keys.
export const budgets = Object.freeze({ maxWebGLDrawCalls: 3 });
export const budget = budgets;
const vectors = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const arrows = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
let modeSeen, levelSeen, previousTime = -1, releaseNext = false, nextAction = 0;
function neighbor(controls, current, direction) {
  const [vx, vy] = vectors[direction];
  const candidates = controls.map(item => {
    const dx = item.x - current.x, dy = item.y - current.y;
    return { item, forward: dx * vx + dy * vy, side: Math.abs(dx * vy - dy * vx), distance: dx * dx + dy * dy };
  }).filter(item => item.forward > 0).sort((a, b) => a.distance - b.distance);
  return (candidates.find(item => item.forward >= item.side) || candidates[0])?.item;
}
function navigate(state, targetId) {
  const controls = [...state.gates, ...state.switches], visited = new Set([state.selectedId]);
  const queue = [{ id: state.selectedId, first: null }];
  for (let head = 0; head < queue.length; head += 1) {
    const item = queue[head], current = controls.find(control => control.id === item.id);
    for (let direction = 0; direction < 4; direction += 1) {
      const next = neighbor(controls, current, direction);
      if (!next || visited.has(next.id)) continue;
      const first = item.first || arrows[direction];
      if (next.id === targetId) return first;
      visited.add(next.id); queue.push({ id: next.id, first });
    }
  }
  throw new Error('No ordinary directional route to ' + targetId);
}
function routeTo(state, from, destination, visited = new Set()) {
  if (from === destination) return [];
  if (visited.has(from)) return null;
  visited.add(from);
  const junction = state.switches.find(item => item.id === from);
  const outputs = junction ? junction.outputs : state.edges.filter(edge => edge.from === from).map(edge => edge.to);
  for (let route = 0; route < outputs.length; route += 1) {
    const rest = routeTo(state, outputs[route], destination, new Set(visited));
    if (rest) return junction ? [{ id: junction.id, route }, ...rest] : rest;
  }
  return null;
}
export function keys(snapshot, { elapsed = 0, mode = 'qa' } = {}) {
  const state = snapshot?.model;
  if (!state?.trains || state.phase !== 'playing' || snapshot.paused) return [];
  if (mode !== modeSeen || levelSeen !== state.level || state.elapsed + 0.001 < previousTime) {
    modeSeen = mode; levelSeen = state.level; releaseNext = false;
    nextAction = elapsed + (mode === 'record' ? 0.7 : 0);
  }
  previousTime = state.elapsed;
  if (releaseNext) { releaseNext = false; return []; }
  if (elapsed < nextAction || state.trains.some(train => train.status === 'moving')) return [];
  const pending = state.gates.map(gate => state.trains.find(train => train.id === gate.nextId))
    .filter(train => train?.status === 'waiting').sort((a, b) => a.readyAt - b.readyAt || Number(a.id.split('-')[1]) - Number(b.id.split('-')[1]));
  const train = pending[0];
  if (!train) return [];
  const route = routeTo(state, train.gateId, train.destination);
  if (!route) throw new Error('No track route to scheduled destination');
  const change = route.find(item => state.switches.find(junction => junction.id === item.id).route !== item.route);
  const targetId = change ? change.id : train.gateId;
  const key = state.selectedId === targetId ? (change ? 'Space' : 'b') : navigate(state, targetId);
  releaseNext = true; nextAction = elapsed + (mode === 'record' ? 0.24 : 0.12);
  return [key];
}
function observations(before, after, trace) {
  return [before, ...(trace || []).map(entry => entry.state || entry.snapshot || entry), after].filter(snapshot => snapshot?.model);
}
export function assertProgress({ before, after, trace }, assert) {
  const first = before.model, last = after.model, samples = observations(before, after, trace);
  assert.equal(after.phase, 'won', 'ordinary dispatch must complete the whole timetable');
  assert.equal(last.phase, 'won'); assert.equal(last.level, first.level);
  assert.equal(last.deliveries, last.target);
  assert.ok(last.trains.every(train => train.status === 'arrived' && train.to === train.destination), 'every train must arrive at its own colored platform');
  assert.ok(last.trains.every(train => train.arrivedAt > train.releasedAt && train.releasedAt >= train.readyAt - 0.02));
  assert.ok(last.elapsed >= 30 && last.elapsed <= 90, 'a full dispatch round lasts 30–90 seconds');
  assert.ok(last.delay > 0 && last.delay < last.delayLimit, 'the waiting budget must be used but respected');
  assert.ok(samples.some(({ model }) => model.trains.some(train => train.status === 'moving')), 'automatic train movement must be observed');
  assert.ok(samples.some(({ model }) => model.switches.some(junction => junction.locked)), 'occupied switches must visibly lock');
  assert.ok(samples.some(({ model }) => model.selectedId !== first.selectedId), 'direction keys must select controls');
  assert.ok(last.switches.some((junction, i) => junction.route !== first.switches[i].route) || samples.some(({ model }) => model.switches.some((junction, i) => junction.route !== first.switches[i].route)), 'A must change a track route');
  let previous = first.deliveries;
  for (const { model } of samples) {
    assert.ok(model.deliveries >= previous, 'arrivals never reset mid-round'); previous = model.deliveries;
    assert.equal(model.deliveries, model.trains.filter(train => train.status === 'arrived').length, 'one train yields exactly one arrival');
  }
  assert.equal(last.lostReason, null); assert.equal(last.collision, null); assert.ok(last.score >= last.target * 1000);
}
export function assertRetry({ before, after }, assert) {
  const state = after.model;
  assert.equal(after.phase, 'playing'); assert.equal(state.phase, 'playing'); assert.equal(state.level, before.model.level);
  assert.ok(state.elapsed < 0.5 && state.elapsed < before.model.elapsed);
  assert.equal(state.deliveries, 0); assert.equal(state.score, 0); assert.equal(state.collision, null);
  assert.ok(state.delay < 1.1); assert.ok(state.switches.every(junction => !junction.locked && junction.lockedBy.length === 0));
  assert.deepEqual(state.switches.map(junction => junction.route), [1, 0]); assert.equal(state.selectedId, 'switch-main');
  assert.ok(state.trains.every(train => ['scheduled', 'waiting'].includes(train.status) && train.releasedAt === null && train.arrivedAt === null && Object.keys(train.routeChoices).length === 0));
  assert.equal(state.gates.reduce((count, gate) => count + gate.queue.length, 0), state.target);
}
