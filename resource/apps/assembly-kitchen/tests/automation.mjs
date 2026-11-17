// Public feedback scheduling only. No Model import, author route or private-state access.
export const budgets = { maxWebGLDrawCalls: 1 };
const need = (condition, message) => { if (!condition) throw Error(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const STAGES = ['cook', 'cool', 'pack'];
const ORDER_FIELDS = ['id', 'attempt', 'phase', 'location', 'temperatureQ', 'heatingAddedQ', 'coolingRemovedQ', 'cookedAtTick', 'holdingAgeTicks', 'expiresAtTick', 'taskId'];
const dynamic = order => Object.fromEntries(ORDER_FIELDS.map(key => [key, order[key]]));
function options(value = {}) {
  const result = { inputSpacingTicks: 20, observationSlackTicks: 11, ...value };
  for (const key of ['inputSpacingTicks', 'observationSlackTicks']) need(Number.isInteger(result[key]) && result[key] >= 1 && result[key] <= 120, 'Finite, bounded input-delay assumptions required');
  return result;
}
function publicShape(m) {
  need(m && Array.isArray(m.orders) && m.orders.length === 3, 'Three public orders required');
  need(new Set(m.orders.map(o => o.id)).size === 3 && m.deliveryOrder.length === 3 && new Set(m.deliveryOrder).size === 3, 'Stable distinct public order identities required');
  need(m.deliveryOrder.every(id => m.orders.some(o => o.id === id)), 'Delivery IDs must identify actual orders');
  need(STAGES.every(id => m.stations[id]?.id === id), 'The public station map must expose cook/cool/pack');
  need(m.orders.some(o => o.id === m.selectedOrderId), 'Selected order must exist');
}
const station = (m, id) => m.stations[id].task;
function actionFor(m, order) {
  if (order.phase === 'raw' && !station(m, 'cook')) return 'start-cook';
  if (order.phase === 'cooked' && order.location === 'cook') return 'collect-cook';
  if (order.phase === 'cooked' && order.location === 'tray' && !station(m, 'cool')) return 'start-cool';
  if (order.phase === 'cooled' && order.location === 'cool') return 'collect-cool';
  if (order.phase === 'cooled' && order.location === 'tray' && !station(m, 'pack')) return 'start-pack';
  if (order.phase === 'packed' && order.location === 'pack') return 'deliver';
  return null;
}
function arrivalTicks(m, orderId, cfg) {
  return Math.abs(m.orders.findIndex(o => o.id === orderId) - m.orders.findIndex(o => o.id === m.selectedOrderId)) * cfg.inputSpacingTicks + 1;
}
function packReleaseTicks(m, cfg) {
  const task = station(m, 'pack');
  if (!task) return 0;
  const order = m.orders.find(o => o.id === task.orderId);
  const remaining = Math.max(0, task.durationTicks - task.progressTicks);
  const tooHotWait = Math.max(0, order.temperatureQ + m.physics.packRateQ * remaining - order.deliveryMaxQ);
  return remaining + Math.ceil(tooHotWait / -m.physics.packRateQ) + 2 * cfg.inputSpacingTicks + cfg.observationSlackTicks;
}
export function predictDeliveryTemperature(m, orderId, plannerOptions = {}) {
  publicShape(m); const cfg = options(plannerOptions), order = m.orders.find(o => o.id === orderId);
  need(order && order.location === 'cool' && order.phase === 'cooled', 'Projection starts from an actual ready cooler occupant');
  const collectDelay = arrivalTicks(m, orderId, cfg);
  const waitToPack = Math.max(cfg.inputSpacingTicks, packReleaseTicks(m, cfg) - collectDelay + cfg.inputSpacingTicks);
  const packingAndDispatch = order.packTicks + 2 * cfg.inputSpacingTicks + cfg.observationSlackTicks;
  const temperatureQ = Math.max(m.physics.ambientQ, order.temperatureQ + m.fanRateQ * (collectDelay - 1)
    + m.physics.passiveRateQ * waitToPack + m.physics.packRateQ * packingAndDispatch);
  return { orderId, attempt: order.attempt, observedTick: m.tick, collectDelay, waitToPack, packingAndDispatch,
    projectedDeliveryTick: m.tick + collectDelay + waitToPack + packingAndDispatch, temperatureQ,
    scope: 'Public scheduling hypothesis with disclosed input delay; not an observed receipt or a guarantee against later competing work.' };
}
function targetTemperature(order, policy) {
  return policy === 'wrong-temperature' ? order.deliveryMinQ - 480 : Math.floor((order.deliveryMinQ + order.deliveryMaxQ) / 2);
}
function fanForStart(m, order, targetQ, cfg) {
  const startDelay = arrivalTicks(m, order.id, cfg);
  const minimumFastDelivery = order.temperatureQ + m.physics.passiveRateQ * (startDelay - 1)
    + m.physics.fastCoolRateQ * m.physics.minCoolTicks + m.physics.passiveRateQ * cfg.inputSpacingTicks
    + m.physics.packRateQ * (order.packTicks + 2 * cfg.inputSpacingTicks + cfg.observationSlackTicks);
  return minimumFastDelivery >= targetQ ? 'fast' : 'slow';
}
export function planVisibleState(m, { policy = 'normal', ...plannerOptions } = {}) {
  publicShape(m); const cfg = options(plannerOptions);
  need(['normal', 'wrong-temperature', 'wrong-order', 'expiry'].includes(policy), 'Known public policy required');
  if (m.phase !== 'playing') return { kind: 'wait', reason: 'terminal', consideredOrders: 0 };
  let ids = m.deliveryOrder;
  if (policy === 'wrong-temperature') ids = [m.deliveryOrder[0]];
  if (policy === 'wrong-order') ids = [m.orders.find(o => o.id !== m.deliveryOrder[0]).id];
  if (policy === 'expiry') ids = m.orders.slice(0, 2).map(o => o.id);
  const orders = ids.map(id => m.orders.find(o => o.id === id)), candidates = [], waits = [];
  const add = (priority, order, action, extra = {}) => candidates.push({ kind: 'action', priority, orderId: order.id, attempt: order.attempt, action, ...extra });
  for (const [rank, order] of orders.entries()) {
    if (order.phase === 'delivered' || (policy === 'expiry' && order.attempt > 1)) continue;
    const action = actionFor(m, order), task = STAGES.map(id => station(m, id)).find(t => t?.orderId === order.id);
    if (task && !task.ready) waits.push({ tick: m.tick + task.durationTicks - task.progressTicks, orderId: order.id, reason: 'actual-task-completion' });
    if (policy === 'expiry') {
      if (action === 'collect-cook') add(1, order, action);
      if (action === 'start-cook') add(5 + rank, order, action);
      if (order.expiresAtTick !== null) waits.push({ tick: order.expiresAtTick, orderId: order.id, reason: 'deliberate-natural-expiry' });
      continue;
    }
    const targetQ = targetTemperature(order, policy);
    if (action === 'deliver') {
      const intentional = policy === 'wrong-order' || policy === 'wrong-temperature';
      const arrivalQ = order.temperatureQ + m.physics.packRateQ * (arrivalTicks(m, order.id, cfg) - 1);
      if (policy === 'normal') need(arrivalQ >= order.deliveryMinQ, 'The actual packed dish is already too cold for an ordinary zero-strike delivery');
      if ((intentional || order.id === m.nextOrderId) && arrivalQ <= (policy === 'wrong-temperature' ? order.deliveryMinQ - 1 : order.deliveryMaxQ)) add(0, order, action);
      else waits.push({ tick: m.tick + Math.max(1, Math.ceil((arrivalQ - order.deliveryMaxQ) / -m.physics.packRateQ)), orderId: order.id, reason: 'delivery-band-or-order' });
    }
    if (action === 'start-pack' && (policy !== 'normal' || order.id === m.nextOrderId)) add(1, order, action);
    if (action === 'collect-cool') {
      const projection = predictDeliveryTemperature(m, order.id, cfg);
      if (projection.temperatureQ <= targetQ) add(2, order, action, { projection });
      else waits.push({ tick: m.tick + Math.max(1, Math.ceil((projection.temperatureQ - targetQ) / -m.fanRateQ)), orderId: order.id, reason: 'actual-cooling-toward-delivery-band' });
    }
    if (action === 'start-cool') {
      const desiredFan = fanForStart(m, order, targetQ, cfg);
      if (m.fanMode !== desiredFan) candidates.push({ kind: 'fan', priority: 3 + rank / 10, fanMode: desiredFan, orderId: order.id, reason: 'Public minimum-cool plus packing temperature forecast' });
      else add(3 + rank / 10, order, action);
    }
    if (action === 'collect-cook') add(4 + rank / 10, order, action);
    if (action === 'start-cook' && !orders.slice(0, rank).some(o => o.phase === 'raw')) add(5 + rank / 10, order, action);
  }
  candidates.sort((a, b) => a.priority - b.priority); waits.sort((a, b) => a.tick - b.tick || ids.indexOf(a.orderId) - ids.indexOf(b.orderId));
  return { ...(candidates[0] ?? { kind: 'wait', ...(waits[0] ?? { reason: 'No legal useful action at this observation', tick: m.tick + 1 }) }),
    consideredOrders: orders.length, candidateCount: candidates.length, inputSpacingTicks: cfg.inputSpacingTicks,
    scope: 'Bounded public feedback policy, at most three order scans; restricted cooking order, not an exhaustive feasibility proof.' };
}
export function createPilot({ policy = 'normal', plannerOptions = {} } = {}) {
  options(plannerOptions); let identity = null, lastTick = -1, pending = null, releaseNext = false, lastDecision = null;
  let stats = { decisions: [], issued: [], acknowledged: [] };
  function reset(m) { identity = `${m.level}:${m.seed}`; lastTick = m.tick; pending = null; releaseNext = false; lastDecision = null; stats = { decisions: [], issued: [], acknowledged: [] }; }
  function issue(m, key, kind, detail = {}) {
    pending = { kind, key, tick: m.tick, commandCount: m.commandCount, blockedCommands: m.blockedCommands, selectedOrderId: m.selectedOrderId, ...detail };
    releaseNext = true; stats.issued.push(structuredClone(pending)); return [key];
  }
  function pilot(state) {
    const m = state?.model; if (!m) return [];
    if (identity !== `${m.level}:${m.seed}` || m.tick < lastTick) reset(m); lastTick = m.tick;
    if (state.phase !== 'playing' || state.paused || m.phase !== 'playing') return [];
    if (releaseNext) { releaseNext = false; return []; }
    if (pending) {
      const p = pending; let applied = false;
      if (p.kind === 'navigate') applied = m.selectedOrderId !== p.selectedOrderId;
      else if (m.commandCount > p.commandCount) {
        const op = m.lastOperation;
        need(m.commandCount === p.commandCount + 1 && op.id === m.commandCount && op.tick > p.tick && op.at === op.tick / 60, 'One actual accepted operation must acknowledge its issued key');
        if (p.kind === 'fan') need(op.type === 'fan' && op.after.fanMode === p.fanMode && m.fanMode === p.fanMode, 'B must change the actual cooler mode');
        else {
          need(op.type === 'action' && op.action === p.action && op.orderId === p.orderId && op.attempt === p.attempt, 'Actual A must act on the intended physical attempt and stage');
          need(op.before.order.phase === p.phase && op.before.order.location === p.location, 'A cannot skip prerequisites or silently replace an expired attempt');
          need(same(m.actionReceipts.at(-1), op), 'Permanent A receipt must be the exact input-boundary operation');
          if (p.action.startsWith('start-')) need(op.after.station.task.progressTicks === 0 && op.after.order.taskId === op.taskId, 'Start receipt is before its first work interval');
          if (p.action.startsWith('collect-')) need(op.after.order.location === 'tray' && op.after.station.task === null && op.after.order.taskId === null, 'Collection actually releases exactly its occupied station');
        }
        stats.acknowledged.push({ issuedTick: p.tick, observedTick: m.tick, operation: structuredClone(op) }); applied = true;
      }
      need(m.blockedCommands === p.blockedCommands, 'The intended legal input was rejected by the actual context');
      if (!applied) { need(m.tick - p.tick <= 120, 'An ordinary input was not observed after two seconds'); return []; }
      if (p.kind === 'navigate') stats.acknowledged.push({ issuedTick: p.tick, observedTick: m.tick, selectedOrderId: m.selectedOrderId });
      pending = null;
    }
    const decision = planVisibleState(m, { policy, ...plannerOptions });
    const signature = JSON.stringify([decision.kind, decision.action, decision.orderId, decision.fanMode, decision.reason]);
    if (signature !== lastDecision) { stats.decisions.push({ observedTick: m.tick, ...structuredClone(decision) }); lastDecision = signature; }
    if (decision.kind === 'fan') return issue(m, 'b', 'fan', { fanMode: decision.fanMode });
    if (decision.orderId && m.selectedOrderId !== decision.orderId) {
      const from = m.orders.findIndex(o => o.id === m.selectedOrderId), to = m.orders.findIndex(o => o.id === decision.orderId);
      return issue(m, to > from ? 'ArrowRight' : 'ArrowLeft', 'navigate');
    }
    if (decision.kind !== 'action') return [];
    const order = m.orders.find(o => o.id === decision.orderId);
    need(actionFor(m, order) === decision.action, 'Reobserve the actual context before issuing A');
    return issue(m, 'Space', 'action', { action: decision.action, orderId: order.id, attempt: order.attempt, phase: order.phase, location: order.location });
  }
  pilot.diagnostics = () => structuredClone({ policy, ...stats }); return pilot;
}
const defaultPilot = createPilot();
export const keys = (state, context) => defaultPilot(state, context);
export function assertPublicBoard(m, assert) {
  publicShape(m); const eq = (a, b, message) => assert.deepEqual(a, b, message), p = m.physics;
  eq(m.elapsed, m.tick / 60); eq(m.remaining, Math.max(0, (m.closeTick - m.tick) / 60));
  eq(m.commandCount, m.actionReceipts.length + m.fanChangeCount); eq(m.discardedAttempts, m.disposalReceipts.length); eq(m.strikes, m.discardedAttempts);
  eq(m.deliveredCount, m.orders.filter(o => o.phase === 'delivered').length); eq(m.deliveredCount, m.deliveryReceipts.filter(r => r.accepted).length);
  eq(m.nextOrderId, m.deliveryOrder.find(id => m.orders.find(o => o.id === id).phase !== 'delivered') ?? null);
  eq(m.fanRateQ, m.fanMode === 'fast' ? p.fastCoolRateQ : p.slowCoolRateQ);
  for (const order of m.orders) {
    assert.ok(Number.isInteger(order.temperatureQ) && order.temperatureQ >= p.ambientQ);
    eq(order.temperatureQ, p.ambientQ + order.heatingAddedQ - order.coolingRemovedQ);
    const occupied = STAGES.filter(id => station(m, id)?.orderId === order.id);
    if (STAGES.includes(order.location)) {
      eq(occupied, [order.location]); const task = station(m, order.location); eq(task.id, order.taskId); eq(task.attempt, order.attempt);
    } else { eq(occupied, []); eq(order.taskId, null); }
    if (order.cookedAtTick !== null) {
      eq(order.expiresAtTick, order.cookedAtTick + order.holdTicks);
      eq(order.holdingAgeTicks, (order.phase === 'delivered' ? order.delivery.tick - 1 : m.tick) - order.cookedAtTick);
    } else { eq(order.holdingAgeTicks, 0); eq(order.expiresAtTick, null); }
    if (order.phase === 'delivered') { eq(order.delivery.accepted, true); assert.ok(order.temperatureQ >= order.deliveryMinQ && order.temperatureQ <= order.deliveryMaxQ); }
  }
  for (const id of STAGES) {
    const task = station(m, id), counts = m.taskStats[id];
    eq(counts.started, counts.completed + counts.cancelled + Number(!!task && !task.ready));
    eq(counts.completed, counts.collected + counts.discardedReady + Number(!!task?.ready));
    if (task) {
      const order = m.orders.find(o => o.id === task.orderId); eq(task.stage, id);
      eq(task.durationTicks, id === 'cook' ? order.cookTicks : id === 'cool' ? p.minCoolTicks : order.packTicks);
      eq(task.progressTicks, task.ready ? task.durationTicks : m.tick - task.startedTick + 1);
      eq(task.completedAtTick, task.ready ? task.startedTick + task.durationTicks - 1 : null);
    }
  }
  eq(m.taskCount, STAGES.reduce((sum, id) => sum + m.taskStats[id].started, 0)); eq(m.taskCount, m.taskStartReceipts.length);
  const issued = m.orders.reduce((sum, o) => sum + o.attempt, 0), archived = m.disposalReceipts.map(r => r.before);
  eq(m.inventory.issuedAttempts, issued); eq(issued, 3 + m.discardedAttempts); eq(m.inventory.liveAttempts, 3 - m.deliveredCount);
  eq(issued, m.inventory.liveAttempts + m.inventory.deliveredAttempts + m.inventory.discardedAttempts); eq(m.inventory.error, 0);
  const all = [...m.orders, ...archived], ledger = m.thermalLedger;
  eq(ledger.issuedAmbientQ, issued * p.ambientQ); eq(ledger.heatingAddedQ, all.reduce((n, o) => n + o.heatingAddedQ, 0));
  eq(ledger.coolingRemovedQ, all.reduce((n, o) => n + o.coolingRemovedQ, 0)); eq(ledger.discardedTemperatureQ, archived.reduce((n, o) => n + o.temperatureQ, 0));
  eq(ledger.recordedCurrentTemperatureQ, m.orders.reduce((n, o) => n + o.temperatureQ, 0)); eq(ledger.error, 0);
  eq(ledger.issuedAmbientQ + ledger.heatingAddedQ - ledger.coolingRemovedQ, ledger.discardedTemperatureQ + ledger.recordedCurrentTemperatureQ);
  eq(m.score, m.phase === 'won' ? 1000 + 2 * Math.floor((m.closeTick - m.tick) / 60) + 50 * (2 - m.strikes) : 0);
  if (m.lastInterval) {
    const interval = m.lastInterval; eq(interval.toTick, m.tick); eq(interval.fromTick, m.tick - 1);
    eq(interval.orders.map(row => row.orderId), m.orders.map(o => o.id));
    for (const row of interval.orders) { eq(row.afterWork.temperatureQ - row.before.temperatureQ, row.actualDeltaQ); eq(row.after, dynamic(m.orders.find(o => o.id === row.orderId))); }
  }
}
export function assertProgress({ after }, assert) {
  assertPublicBoard(after.model, assert); const m = after.model;
  assert.equal(after.phase, 'won'); assert.equal(m.phase, 'won'); assert.equal(m.strikes, 0); assert.equal(m.blockedCommands, 0);
  assert.equal(m.deliveredCount, 3); assert.equal(m.actionReceipts.length, 18); assert.equal(m.disposalReceipts.length, 0);
  assert.deepEqual(m.deliveryReceipts.map(r => r.orderId), m.deliveryOrder);
  for (const id of STAGES) { assert.equal(m.stations[id].task, null); assert.deepEqual(m.taskStats[id], { started: 3, completed: 3, collected: 3, cancelled: 0, discardedReady: 0 }); }
}
export function assertRetry({ after, initial }, assert) {
  assertPublicBoard(after.model, assert); assert.equal(after.model.phase, 'playing'); assert.ok(after.model.tick >= 0 && after.model.tick < 120);
  for (const key of ['orders', 'stations', 'selectedOrderId', 'fanMode', 'fanChangeCount', 'strikes', 'discardedAttempts', 'commandCount', 'blockedCommands', 'deliveredCount', 'nextOrderId', 'taskCount', 'taskStats', 'actionReceipts', 'deliveryReceipts', 'disposalReceipts', 'inventory', 'thermalLedger']) assert.deepEqual(after.model[key], initial.model[key], 'Fresh retry restores ' + key);
}
