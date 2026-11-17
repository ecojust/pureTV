// Independent arithmetic from the public model contract only.
// The caller splits intervals at input, completion, expiry and terminal events.
export const IDS = ['O1', 'O2', 'O3'];
export const STAGES = ['cook', 'cool', 'pack'];
export const AMBIENT = 4800;
const recipe = (id, recipeId, cook, pack, hold, low, high) => ({
  id, recipeId, cookTicks: cook * 60, packTicks: pack * 60, holdTicks: hold * 60,
  deliveryMinQ: low * 240, deliveryMaxQ: high * 240,
});
export const LEVELS = [
  { closeTick: 4500, deliveryOrder: ['O1', 'O2', 'O3'], recipes: [
    recipe('O1', 'custard', 10, 4, 20, 64, 68),
    recipe('O2', 'tomato-soup', 10, 4, 24, 52, 58),
    recipe('O3', 'compote', 10, 4, 26, 40, 46),
  ] },
  { closeTick: 4800, deliveryOrder: ['O2', 'O1', 'O3'], recipes: [
    recipe('O1', 'pumpkin-soup', 12, 5, 24, 56, 62),
    recipe('O2', 'custard', 10, 4, 18, 64, 68),
    recipe('O3', 'stew', 14, 5, 25, 64, 70),
  ] },
  { closeTick: 5100, deliveryOrder: ['O3', 'O1', 'O2'], recipes: [
    recipe('O1', 'stew', 14, 6, 25, 58, 64),
    recipe('O2', 'bean-soup', 12, 5, 26, 48, 54),
    recipe('O3', 'custard', 10, 4, 18, 64, 68),
  ] },
];
const SNAPSHOT_FIELDS = ['id', 'attempt', 'phase', 'location', 'temperatureQ',
  'heatingAddedQ', 'coolingRemovedQ', 'cookedAtTick', 'holdingAgeTicks', 'expiresAtTick', 'taskId'];
export function snapshot(order) {
  return Object.fromEntries(SNAPSHOT_FIELDS.map(key => [key, order[key]]));
}
export function freshAttempt(id, attempt) {
  return { id, attempt, phase: 'raw', location: 'tray', temperatureQ: AMBIENT,
    heatingAddedQ: 0, coolingRemovedQ: 0, cookedAtTick: null, holdingAgeTicks: 0,
    expiresAtTick: null, taskId: null };
}
export function rateFor(order, fanMode) {
  const { phase, location } = order;
  if ((phase === 'raw' && location === 'tray') || (phase === 'delivered' && location === 'delivered')) return 0;
  if (phase === 'cooking' && location === 'cook') return 20;
  if ((phase === 'cooked' && ['cook', 'tray'].includes(location)) || (phase === 'cooled' && location === 'tray')) return -2;
  if (['cooling', 'cooled'].includes(phase) && location === 'cool') {
    if (fanMode === 'fast') return -12;
    if (fanMode === 'slow') return -2;
    throw new Error('Unknown fan mode: ' + fanMode);
  }
  if (['packing', 'packed'].includes(phase) && location === 'pack') return -1;
  throw new Error('Invalid phase/location: ' + phase + '/' + location);
}
export function integrate(order, count, fanMode) {
  if (!Number.isInteger(count) || count < 0) throw new Error('Interval length must be a nonnegative integer');
  const next = snapshot(order), rate = rateFor(next, fanMode);
  const temperature = rate < 0 ? Math.max(AMBIENT, next.temperatureQ + rate * count) : next.temperatureQ + rate * count;
  const delta = temperature - next.temperatureQ;
  next.temperatureQ = temperature;
  next.heatingAddedQ += Math.max(0, delta);
  next.coolingRemovedQ += Math.max(0, -delta);
  if (next.cookedAtTick !== null && next.phase !== 'delivered') next.holdingAgeTicks += count;
  return next; // No task progress, completion, disposal or delivery is committed here.
}
export function summarize(currentOrders, disposalReceipts) {
  const byOrder = currentOrders.map(order => ({ orderId: order.id, issued: order.attempt,
    live: order.phase === 'delivered' ? 0 : 1, delivered: order.phase === 'delivered' ? 1 : 0,
    discarded: order.attempt - 1 }));
  const sum = (items, key) => items.reduce((total, item) => total + item[key], 0);
  const issuedAttempts = sum(byOrder, 'issued'), liveAttempts = sum(byOrder, 'live');
  const deliveredAttempts = sum(byOrder, 'delivered'), discardedAttempts = disposalReceipts.length;
  const inventory = { initialAttempts: IDS.length, issuedAttempts, liveAttempts, deliveredAttempts,
    discardedAttempts, byOrder, error: issuedAttempts - liveAttempts - deliveredAttempts - discardedAttempts };
  const archived = disposalReceipts.map(receipt => receipt.before);
  const issuedAmbientQ = issuedAttempts * AMBIENT;
  const heatingAddedQ = sum(currentOrders, 'heatingAddedQ') + sum(archived, 'heatingAddedQ');
  const coolingRemovedQ = sum(currentOrders, 'coolingRemovedQ') + sum(archived, 'coolingRemovedQ');
  const discardedTemperatureQ = sum(archived, 'temperatureQ'), recordedCurrentTemperatureQ = sum(currentOrders, 'temperatureQ');
  return { inventory, thermalLedger: { issuedAmbientQ, heatingAddedQ, coolingRemovedQ,
    discardedTemperatureQ, recordedCurrentTemperatureQ,
    error: issuedAmbientQ + heatingAddedQ - coolingRemovedQ - discardedTemperatureQ - recordedCurrentTemperatureQ } };
}
export function outcome(tick, closeTick, strikes, currentOrders) {
  const allDelivered = IDS.every(id => currentOrders.some(order => order.id === id && order.phase === 'delivered'));
  const lostReason = strikes >= 2 ? 'mistakes' : allDelivered ? null : tick >= closeTick ? 'closing' : null;
  const phase = lostReason ? 'lost' : allDelivered ? 'won' : 'playing';
  const score = phase === 'won' ? 1000 + 2 * Math.floor((closeTick - tick) / 60) + 50 * (2 - strikes) : 0;
  return { phase, lostReason, score };
}
