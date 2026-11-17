// A normal-key bridge builder. It reads geometry and constructs a redundant span.
export const budgets = Object.freeze({ maxWebGLDrawCalls: 3 });
export const budget = budgets;
const vectors = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const arrows = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
let modeSeen, levelSeen, previousTime = -1, releaseNext = false, nextAction = 0, failedSince = null;
function neighbor(cables, current, direction) {
  const [vx, vy] = vectors[direction];
  const candidates = cables.map(cable => {
    const dx = cable.x - current.x, dy = cable.y - current.y;
    return { cable, forward: dx * vx + dy * vy, side: Math.abs(dx * vy - dy * vx), distance: dx * dx + dy * dy };
  }).filter(item => item.forward > 1e-8).sort((a, b) => a.distance - b.distance);
  return (candidates.find(item => item.forward >= item.side - 1e-8) || candidates[0])?.cable;
}
function navigate(state, targetId) {
  const queue = [{ id: state.selectedId, first: null }], visited = new Set([state.selectedId]);
  for (let head = 0; head < queue.length; head += 1) {
    const item = queue[head], current = state.cables.find(cable => cable.id === item.id);
    for (let direction = 0; direction < 4; direction += 1) {
      const next = neighbor(state.cables, current, direction);
      if (!next || visited.has(next.id)) continue;
      const first = item.first || arrows[direction];
      if (next.id === targetId) return first;
      visited.add(next.id); queue.push({ id: next.id, first });
    }
  }
  throw new Error('A candidate cable cannot be reached with ordinary direction keys');
}
function safePlan(state) {
  const interior = state.nodes.filter(node => !node.fixed).sort((a, b) => a.x - b.x), ids = [];
  interior.forEach((node, index) => {
    const choices = state.cables.filter(cable => cable.nodeId === node.id).sort((a, b) => a.restLength - b.restLength);
    const selected = index === Math.floor(interior.length / 2) ? choices : choices.slice(0, 1);
    ids.push(...selected.map(cable => cable.id));
  });
  const cost = state.cables.filter(cable => ids.includes(cable.id)).reduce((sum, cable) => sum + cable.cost, 0);
  if (cost > state.budget) throw new Error('The observed geometry does not admit the planned material budget');
  return new Set(ids);
}
export function keys(snapshot, { elapsed = 0, mode = 'qa' } = {}) {
  const state = snapshot?.model;
  if (!state?.cables || state.phase !== 'playing' || snapshot.paused) return [];
  if (modeSeen !== mode || levelSeen !== state.level || state.elapsed + 0.001 < previousTime) {
    modeSeen = mode; levelSeen = state.level; releaseNext = false; failedSince = null; nextAction = elapsed + (mode === 'record' ? 0.8 : 0);
  }
  previousTime = state.elapsed;
  if (releaseNext) { releaseNext = false; return []; }
  if (elapsed < nextAction || state.mode === 'testing') return [];
  let command;
  if (state.mode === 'test-failed') {
    if (mode !== 'record' || state.attempts !== 1) throw new Error('The planned bridge failed its normal load test');
    if (failedSince === null) failedSince = elapsed;
    if (elapsed - failedSince < 4.2) return [];
    // The recording demonstrates a real failed experiment and the normal B restore.
    command = 'b';
  } else {
    let plan = safePlan(state);
    if (mode === 'record' && state.attempts === 0) {
      const first = state.nodes.find(node => !node.fixed);
      const weak = state.cables.filter(cable => cable.nodeId === first.id).sort((a, b) => b.restLength - a.restLength)[0];
      plan = new Set([weak.id]);
    }
    const remove = state.cables.find(cable => cable.installed && !plan.has(cable.id));
    const add = state.cables.find(cable => !cable.installed && plan.has(cable.id));
    const target = remove || add;
    command = target ? state.selectedId === target.id ? 'Space' : navigate(state, target.id) : 'b';
  }
  releaseNext = true; nextAction = elapsed + (mode === 'record' ? 0.32 : 0.12);
  return [command];
}
function observations(before, after, trace) {
  return [before, ...(trace || []).map(entry => entry.state || entry.snapshot || entry), after].filter(snapshot => snapshot?.model);
}
export function assertProgress({ before, after, trace }, assert) {
  const first = before.model, last = after.model, samples = observations(before, after, trace);
  assert.equal(after.phase, 'won', 'normal building and load-test controls must complete the round'); assert.equal(last.phase, 'won');
  assert.ok(last.panels.every(panel => !panel.broken), 'the bridge deck must remain intact after the crossing');
  assert.equal(last.level, first.level); assert.equal(last.car.finished, true); assert.equal(last.car.falling, false);
  assert.ok(last.car.x >= last.car.finishX && last.car.x - last.car.wheelbase / 2 > last.nodes.at(-1).x, 'the complete vehicle must pass the far bank');
  assert.ok(last.elapsed >= 30 && last.elapsed <= 90); assert.ok(last.score >= 1000);
  assert.ok(samples.some(({ model }) => model.mode === 'editing' && model.spent > 0), 'A must install actual material');
  assert.ok(samples.some(({ model }) => model.mode === 'testing' && model.cables.some(cable => cable.tension > 20)), 'the crossing must produce real tensile forces');
  assert.ok(samples.some(({ model }) => model.nodes.some(node => !node.fixed && node.y > node.restY + 0.3)), 'loaded nodes must actually deflect');
  assert.ok(samples.some(({ model }) => model.selectedId !== first.selectedId), 'direction keys must select other candidates');
  for (const { model } of samples) {
    assert.equal(model.spent, model.cables.filter(cable => cable.installed).reduce((sum, cable) => sum + cable.cost, 0));
    assert.equal(model.remainingBudget, model.budget - model.spent); assert.ok(model.remainingBudget >= 0);
    assert.ok(model.cables.every(cable => cable.tension >= 0 && (!cable.broken || cable.tension === 0)));
  }
  assert.equal(last.lostReason, null);
}
export function assertRetry({ before, after }, assert) {
  const state = after.model;
  assert.equal(after.phase, 'playing'); assert.equal(state.phase, 'playing'); assert.equal(state.mode, 'editing');
  assert.equal(state.level, before.model.level); assert.equal(state.spent, 0); assert.equal(state.remainingBudget, state.budget);
  assert.equal(state.attempts, 0); assert.equal(state.brokenCount, 0); assert.equal(state.score, 0); assert.equal(state._blueprint, null);
  assert.ok(state.elapsed < 0.5 && state.elapsed < before.model.elapsed);
  assert.ok(state.cables.every(cable => !cable.installed && !cable.broken && cable.tension === 0));
  assert.ok(state.nodes.every(node => node.y === node.restY && node.vy === 0)); assert.ok(state.panels.every(panel => !panel.broken));
  assert.equal(state.car.x, state.nodes[0].x - 80); assert.equal(state.car.falling, false); assert.equal(state.car.finished, false);
}
