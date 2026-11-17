// Observational canal operator. Every valve, gate and boat request uses normal keys.
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
  const queue = [{ id: state.selectedId, first: null }], visited = new Set([state.selectedId]);
  for (let head = 0; head < queue.length; head += 1) {
    const item = queue[head], current = state.controls.find(control => control.id === item.id);
    for (let direction = 0; direction < 4; direction += 1) {
      const next = neighbor(state.controls, current, direction);
      if (!next || visited.has(next.id)) continue;
      const first = item.first || arrows[direction];
      if (next.id === targetId) return first;
      visited.add(next.id); queue.push({ id: next.id, first });
    }
  }
  throw new Error('No ordinary direction route to ' + targetId);
}
export function keys(snapshot, { elapsed = 0, mode = 'qa' } = {}) {
  const state = snapshot?.model;
  if (!state?.boats || state.phase !== 'playing' || snapshot.paused) return [];
  if (mode !== modeSeen || levelSeen !== state.level || state.elapsed + 0.001 < previousTime) {
    modeSeen = mode; levelSeen = state.level; releaseNext = false; nextAction = elapsed + (mode === 'record' ? 0.7 : 0);
  }
  previousTime = state.elapsed;
  if (releaseNext) { releaseNext = false; return []; }
  if (elapsed < nextAction) return [];
  const boat = state.boats.find(item => item.id === state.activeBoatId);
  if (!boat || boat.status !== 'waiting') return [];
  const zone = id => state.zones.find(item => item.id === id);
  const gate = state.gates.find(item => item.leftId === boat.zoneId);
  const goals = boat.zoneId === 'entry' ? [['lock-1', zone('entry').level], ['lock-2', state.midLevel]]
    : boat.zoneId === 'lock-1' ? [['lock-1', zone('lock-2').level]] : [['lock-2', zone('exit').level]];
  const toggle = targetId => state.selectedId === targetId ? 'Space' : navigate(state, targetId);
  let command;
  const flowing = state.valves.find(item => item.open);
  if (flowing) {
    const goal = goals.find(([id]) => id === flowing.zoneId), gap = goal ? goal[1] - zone(flowing.zoneId).level : 0;
    const direction = flowing.type === 'fill' ? 1 : -1;
    // Remain beside the running valve so it can be closed promptly near the target.
    if (goal && gap * direction > 0.1) return [];
    command = toggle(flowing.id);
  } else {
    const oldGate = state.gates.find(item => item.open && item.id !== gate.id);
    const adjust = goals.find(([id, target]) => Math.abs(zone(id).level - target) > 0.1);
    if (oldGate) command = toggle(oldGate.id);
    else if (adjust) {
      if (gate.open) command = toggle(gate.id);
      else {
        const [id, target] = adjust, type = target > zone(id).level ? 'fill' : 'drain';
        command = toggle(state.valves.find(item => item.zoneId === id && item.type === type).id);
      }
    } else if (!gate.open) command = toggle(gate.id);
    else command = 'b';
  }
  releaseNext = true; nextAction = elapsed + (mode === 'record' ? 0.2 : 0.12);
  return [command];
}
function samples(before, after, trace) {
  return [before, ...(trace || []).map(entry => entry.state || entry.snapshot || entry), after].filter(snapshot => snapshot?.model);
}
export function assertProgress({ before, after, trace }, assert) {
  const first = before.model, last = after.model, observations = samples(before, after, trace);
  assert.equal(after.phase, 'won', 'ordinary valve and gate operations must finish the voyage'); assert.equal(last.phase, 'won');
  assert.equal(last.level, first.level); assert.equal(last.deliveries, last.target);
  assert.ok(last.boats.every(boat => boat.status === 'exited' && boat.zoneId === 'exit' && boat.dry));
  assert.ok(last.boats.every(boat => boat.exitedAt > 0));
  assert.ok(last.elapsed >= 30 && last.elapsed <= 90, 'full voyages last 30–90 seconds');
  assert.ok(observations.some(({ model }) => model.boats.some(boat => boat.status === 'moving')), 'normal B requests must move the boat');
  assert.ok(observations.some(({ model }) => model.gates.some(gate => gate.locked)), 'crossing boats must lock their gate');
  assert.ok(observations.some(({ model }) => model.valves.some(valve => valve.open)), 'finite valve flow must be observed');
  assert.ok(last.sourceVolume > 1, 'the upstream voyage must receive water from a real boundary');
  if (last.target > 1) assert.ok(last.sinkVolume > 1, 'subsequent voyages must drain and refill through valves');
  let delivered = first.deliveries;
  for (const { model } of observations) {
    assert.ok(model.deliveries >= delivered); delivered = model.deliveries;
    assert.equal(model.deliveries, model.boats.filter(boat => boat.status === 'exited').length, 'each boat counts once after exiting');
    assert.ok(Math.abs(model.totalVolume - (model.initialVolume + model.sourceVolume - model.sinkVolume - model.overflowVolume)) < 1e-7, 'every water exchange must be accounted for');
    assert.ok(model.zones.filter(zone => !zone.isReservoir).every(zone => zone.level >= zone.floor - 1e-8 && zone.level <= zone.capacity + 1e-8));
    assert.ok(model.boats.every(boat => boat.y + boat.draft * model.levelScale <= model.floorY + 1e-7), 'the keel cannot penetrate the floor');
  }
  assert.equal(last.lostReason, null); assert.equal(last.overflowVolume, 0); assert.ok(last.score >= last.target * 1000);
}
export function assertRetry({ before, after }, assert) {
  const state = after.model;
  assert.equal(after.phase, 'playing'); assert.equal(state.phase, 'playing'); assert.equal(state.level, before.model.level);
  assert.ok(state.elapsed < 0.5 && state.elapsed < before.model.elapsed);
  assert.equal(state.deliveries, 0); assert.equal(state.score, 0); assert.equal(state.sourceVolume, 0); assert.equal(state.sinkVolume, 0); assert.equal(state.overflowVolume, 0);
  assert.equal(state.totalVolume, state.initialVolume); assert.equal(state.zones[1].level, state.zones[0].level); assert.equal(state.zones[2].level, 4);
  assert.ok(state.gates.every(gate => !gate.open && !gate.locked)); assert.ok(state.valves.every(valve => !valve.open && valve.flow === 0));
  assert.equal(state.selectedId, 'gate-1'); assert.equal(state.activeBoatId, 'boat-1');
  assert.ok(state.boats.every((boat, i) => boat.zoneId === 'entry' && boat.status === (i ? 'queued' : 'waiting') && boat.dry && boat.groundedTime === 0 && boat.progress === 0));
}
