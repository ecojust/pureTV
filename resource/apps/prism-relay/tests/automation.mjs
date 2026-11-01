// Observational pilot: reads snapshots and presses the ordinary controller keys.
// Answers live only in test tooling; the shipped model contains initial layouts.
export const budgets = Object.freeze({ maxWebGLDrawCalls: 3 });
export const budget = budgets;
const targets = [[0], [0, 1, 1], [0, 0, 1, 1, 0, 0]];
const initial = [[1], [2, 0, 0], [3, 1, 0, 0, 1, 1]];
const arrows = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
const vectors = [[1, 0], [0, 1], [-1, 0], [0, -1]];
let modeSeen, levelSeen, previousTime = -1, releaseNext = false, nextAction = 0, wonSince = null;

function neighbor(devices, current, direction) {
  const [vx, vy] = vectors[direction];
  const candidates = devices.map(device => {
    const dx = device.x - current.x, dy = device.y - current.y;
    return { device, forward: dx * vx + dy * vy, side: Math.abs(dx * vy - dy * vx), distance: dx * dx + dy * dy };
  }).filter(item => item.forward > 0).sort((a, b) => a.distance - b.distance);
  return (candidates.find(item => item.forward >= item.side) || candidates[0])?.device;
}
function firstArrow(devices, selectedId, targetId) {
  const queue = [{ id: selectedId, first: null }], visited = new Set([selectedId]);
  for (let head = 0; head < queue.length; head += 1) {
    const item = queue[head], current = devices.find(device => device.id === item.id);
    for (let direction = 0; direction < 4; direction += 1) {
      const next = neighbor(devices, current, direction);
      if (!next || visited.has(next.id)) continue;
      const first = item.first || arrows[direction];
      if (next.id === targetId) return first;
      visited.add(next.id); queue.push({ id: next.id, first });
    }
  }
  throw new Error('The target device is unreachable through direction keys');
}
export function keys(snapshot, { elapsed = 0, mode = 'qa' } = {}) {
  const state = snapshot?.model;
  if (!state?.devices || snapshot.paused) return [];
  if (mode !== modeSeen || levelSeen !== state.level || state.elapsed + 0.001 < previousTime) {
    modeSeen = mode; levelSeen = state.level; releaseNext = false; wonSince = null;
    nextAction = elapsed + (mode === 'record' ? 1.2 : 0);
  }
  previousTime = state.elapsed;
  if (releaseNext) { releaseNext = false; return []; }
  if (state.phase === 'won') {
    if (mode !== 'record' || state.level === 3) return [];
    if (wonSince === null) wonSince = elapsed;
    if (elapsed - wonSince < 2.7) return [];
    releaseNext = true;
    // Runtime menu level is zero based; model.level is one based.
    return snapshot.level === state.level ? ['Enter'] : ['ArrowRight'];
  }
  if (state.phase !== 'playing' || elapsed < nextAction) return [];
  const answer = targets[state.level - 1];
  const index = state.devices.findIndex((device, i) => device.orientation !== answer[i]);
  if (index < 0) return [];
  const target = state.devices[index];
  let key;
  if (state.selectedId !== target.id) key = firstArrow(state.devices, state.selectedId, target.id);
  else {
    const turns = (answer[index] - target.orientation + 4) % 4;
    key = target.type === 'mirror' ? (index % 2 ? 'b' : 'Space') : turns === 3 ? 'b' : 'Space';
  }
  releaseNext = true;
  nextAction = elapsed + (mode === 'record' ? 0.65 : 0.14);
  return [key];
}

function samples(before, after, trace) {
  return [before, ...(trace || []).map(entry => entry.state || entry.snapshot || entry), after]
    .filter(snapshot => snapshot?.model);
}
export function assertProgress({ before, after, trace }, assert) {
  const first = before.model, last = after.model, observations = samples(before, after, trace);
  assert.equal(after.phase, 'won', 'normal keyboard operations must finish the current level');
  assert.equal(last.phase, 'won');
  assert.equal(last.level, first.level, 'QA must finish the selected level without skipping');
  assert.ok(last.tick - first.tick >= 19, 'winning must include sustained 10 Hz charging');
  assert.ok(last.elapsed >= 2, 'twenty rule ticks require two seconds');
  assert.ok(last.devices.some((device, i) => device.orientation !== first.devices[i].orientation), 'ordinary A/B input must rotate an optical device');
  if (last.devices.length > 1) assert.ok(observations.some(({ model }) => model.selectedId !== first.selectedId), 'direction keys must select different devices');
  assert.ok(last.receivers.every(receiver => receiver.incident === receiver.required && receiver.charge === 20), 'every target must receive exactly its required colors for twenty consecutive ticks');
  assert.ok(last.hazards.every(hazard => hazard.heat < hazard.limit), 'the route must avoid overheating');
  assert.ok(last.remainingTicks >= 0 && last.remainingTicks < last.timeLimitTicks);
  assert.equal(last.lostReason, null);
  assert.ok(last.score > 1000);
  assert.ok(last.beams.length > 1, 'the final light path must have been traced');
}
export function assertRetry({ before, after }, assert) {
  const state = after.model;
  assert.equal(after.phase, 'playing'); assert.equal(state.phase, 'playing');
  assert.equal(state.level, before.model.level);
  assert.ok(state.elapsed < 0.5 && state.elapsed < before.model.elapsed, 'retry starts a fresh timer');
  assert.equal(state.score, 0);
  assert.deepEqual(state.devices.map(device => device.orientation), initial[state.level - 1]);
  assert.equal(state.selectedId, state.devices[0].id);
  assert.ok(state.receivers.every(receiver => receiver.charge === 0));
  assert.ok(state.hazards.every(hazard => hazard.heat === 0));
  assert.ok(state.remaining >= state.timeLimit - 0.5);
}
