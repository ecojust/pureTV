// Offline event-interval arithmetic. No Model, controller or author-route import.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import { IDS, STAGES, AMBIENT, LEVELS, snapshot, freshAttempt, rateFor, integrate, summarize, outcome } from './kitchen-interval-oracle.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [corpusArg, outputArg, approvedIndexHash] = process.argv.slice(2);
if (!corpusArg || !outputArg || !/^[a-f0-9]{64}$/.test(approvedIndexHash || '')) throw new Error('Supply public projection directory, fresh output directory and approved index SHA256');
const corpus = path.resolve(corpusArg), output = path.resolve(outputArg);
const contractHash = '288c8a91f3f7152d7ca0db308de1822793094de5e36ce9106ae0f1716db5f28b';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const copy = value => structuredClone(value);
const indexPath = path.join(corpus, 'index.json');
if (hash(indexPath) !== approvedIndexHash) throw new Error('Unapproved public observation index; no round files read');
const index = read(indexPath);
if (index.rounds.length !== 6 || new Set(index.rounds.map(r => r.file)).size !== 6 ||
  !index.rounds.every(r => /^level[1-3]-(record|loss)\.json$/.test(r.file) && r.file === r.name + '.json')) throw new Error('Expected six approved public observation basenames');
const portable = file => file.startsWith('/workspace/pureTV/') ? 'repoRelative:' + file.slice('/workspace/pureTV/'.length) : 'scratchRelative:' + path.relative('/workspace/scratch', file);
const sourceFiles = [indexPath, path.join(app, 'docs/model-contract.md'),
  ...['kitchen-interval-oracle.mjs', 'independent-kitchen-review.mjs'].map(file => path.join(app, 'tests', file)), ...index.rounds.map(r => path.join(corpus, r.file))];
const hashes = () => Object.fromEntries(sourceFiles.map(file => [portable(file), hash(file)]));
const startedAt = new Date().toISOString(), startHashes = hashes(), failures = [];
let assertions = 0;
function equal(actual, expected, label) {
  assertions++;
  if (!isDeepStrictEqual(actual, expected)) failures.push({ label, actual, expected });
}
function fields(actual, expected, label) { for (const [key, value] of Object.entries(expected)) equal(actual?.[key], value, label + '.' + key); }
equal(hash(path.join(app, 'docs/model-contract.md')), contractHash, 'approved contract');
equal(index.sourceHashes.contract, contractHash, 'ordinary corpus contract identity');

const receiptNames = ['taskStartReceipts', 'completionReceipts', 'collectionReceipts', 'disposalReceipts', 'deliveryReceipts'];
const nextOrder = (state, level) => level.deliveryOrder.find(id => state.orders.find(o => o.id === id).phase !== 'delivered') || null;
const recipeFor = (level, id) => level.recipes.find(recipe => recipe.id === id);
const orderIndex = id => IDS.indexOf(id);
const durationFor = (level, id, stage) => stage === 'cool' ? 120 : recipeFor(level, id)[stage + 'Ticks'];
const configuredRate = mode => mode === 'fast' ? -12 : -2;
function initialCore() {
  return { tick: 0, selectedOrderId: 'O1', fanMode: 'fast', orders: IDS.map(id => freshAttempt(id, 1)),
    stations: Object.fromEntries(STAGES.map(id => [id, { id, task: null }])),
    ...Object.fromEntries(receiptNames.map(name => [name, []])), operations: [], rejections: [],
    eventCount: 0, events: [], lastEvent: null, lastInterval: null };
}
function context(order, stations) {
  if (order.phase === 'delivered') return { action: null, stage: null, reason: 'already-delivered' };
  if (['cooking', 'cooling', 'packing'].includes(order.phase)) return { action: null, stage: order.location, reason: 'not-ready' };
  const key = order.phase + '/' + order.location;
  const action = ({ 'raw/tray': 'start-cook', 'cooked/cook': 'collect-cook', 'cooked/tray': 'start-cool',
    'cooled/cool': 'collect-cool', 'cooled/tray': 'start-pack', 'packed/pack': 'deliver' })[key];
  if (!action) throw new Error('Unsupported public phase/location ' + key);
  const stage = action === 'deliver' ? 'pack' : action.split('-')[1];
  return { action, stage, reason: action.startsWith('start-') && stations[stage].task ? 'station-busy' : null };
}
function stats(state) {
  return Object.fromEntries(STAGES.map(stage => [stage, {
    started: state.taskStartReceipts.filter(r => r.stage === stage).length,
    completed: state.completionReceipts.filter(r => r.stage === stage).length,
    collected: state.collectionReceipts.filter(r => r.stage === stage).length,
    cancelled: state.disposalReceipts.filter(r => r.stationTask?.stage === stage && r.cancelledTaskId !== null).length,
    discardedReady: state.disposalReceipts.filter(r => r.stationTask?.stage === stage && r.discardedReadyTaskId !== null).length,
  }]));
}
function disposal(state, i, tick, boundary, reason, issues, commandId) {
  const before = snapshot(state.orders[i]), stage = STAGES.includes(before.location) ? before.location : null;
  const stationTask = stage ? copy(state.stations[stage].task) : null;
  const after = freshAttempt(before.id, before.attempt + 1), strikesBefore = state.disposalReceipts.length;
  const receipt = { id: strikesBefore + 1, orderId: before.id, attempt: before.attempt, replacementAttempt: after.attempt,
    tick, at: tick / 60, boundary, reason, issues: copy(issues), commandId, before, stationTask,
    cancelledTaskId: stationTask && !stationTask.ready ? stationTask.id : null,
    discardedReadyTaskId: stationTask?.ready ? stationTask.id : null,
    strikesBefore, strikesAfter: strikesBefore + 1, after: copy(after) };
  if (stage) state.stations[stage].task = null;
  state.orders[i] = after; state.disposalReceipts.push(receipt);
  return receipt;
}
function collectReceipt(state, task, order, tick, commandId, kind) {
  const receipt = { id: state.collectionReceipts.length + 1, taskId: task.id, stage: task.stage, orderId: order.id,
    attempt: order.attempt, tick, at: tick / 60, commandId, kind, temperatureQ: order.temperatureQ, holdingAgeTicks: order.holdingAgeTicks };
  state.collectionReceipts.push(receipt); return receipt;
}
function applyObservedInput(state, record, level, label) {
  const tick = record.tick, facts = [], selections = record.events.filter(e => e.type === 'selection');
  equal(selections.length <= 1, true, label + '.at most one selection');
  for (const event of selections) {
    equal(event.fromOrderId, state.selectedOrderId, label + '.selection origin');
    equal(IDS.includes(event.toOrderId), true, label + '.selection target domain');
    equal(Math.abs(orderIndex(event.toOrderId) - orderIndex(event.fromOrderId)), 1, label + '.selection one adjacent card');
    state.selectedOrderId = event.toOrderId; facts.push({ type: 'selection', fromOrderId: event.fromOrderId, toOrderId: event.toOrderId });
  }
  const commands = record.events.filter(e => e.type === 'command'), blocked = record.events.filter(e => e.type === 'blocked');
  equal(commands.length + blocked.length <= 1, true, label + '.one input action');
  let inputCommandId = null, blockedId = null;
  if (commands.length) {
    const operation = commands[0].operation;
    fields(operation, { id: state.operations.length + 1, tick, at: tick / 60 }, label + '.command identity');
    equal(commands[0].commandId, operation.id, label + '.command link'); inputCommandId = operation.id;
    const effects = [];
    if (operation.type === 'fan') {
      equal(selections.length, 0, label + '.fan consumes navigation');
      equal(operation.before, { fanMode: state.fanMode, fanRateQ: configuredRate(state.fanMode) }, label + '.fan before');
      state.fanMode = state.fanMode === 'fast' ? 'slow' : 'fast';
      equal(operation.after, { fanMode: state.fanMode, fanRateQ: configuredRate(state.fanMode) }, label + '.fan after');
    } else {
      equal(operation.type, 'action', label + '.A operation type');
      equal(operation.orderId, state.selectedOrderId, label + '.A selected order');
      const i = orderIndex(operation.orderId), before = snapshot(state.orders[i]), rule = context(before, state.stations);
      equal(rule.reason, null, label + '.accepted action legal'); equal(operation.action, rule.action, label + '.context action');
      const stage = rule.stage, station = state.stations[stage];
      equal(operation.before, { order: before, station: copy(station), strikes: state.disposalReceipts.length, nextOrderId: nextOrder(state, level) }, label + '.immediate input before');
      equal(operation.attempt, before.attempt, label + '.input attempt');
      let taskId = before.taskId, deliveryReceiptId = null, disposalId = null;
      if (rule.action.startsWith('start-')) {
        taskId = state.taskStartReceipts.length + 1;
        const durationTicks = durationFor(level, before.id, stage);
        station.task = { id: taskId, stage, orderId: before.id, attempt: before.attempt, startedTick: tick,
          durationTicks, progressTicks: 0, completedAtTick: null, ready: false };
        state.orders[i] = { ...before, phase: { cook: 'cooking', cool: 'cooling', pack: 'packing' }[stage], location: stage, taskId };
        state.taskStartReceipts.push({ taskId, stage, orderId: before.id, attempt: before.attempt, tick, at: tick / 60, durationTicks, commandId: operation.id });
      } else if (rule.action.startsWith('collect-')) {
        equal(station.task?.ready, true, label + '.collect only ready task');
        const collection = collectReceipt(state, station.task, before, tick, operation.id, 'collect');
        effects.push({ type: 'collected', collection }); station.task = null;
        state.orders[i] = { ...before, location: 'tray', taskId: null };
      } else {
        equal(station.task?.ready, true, label + '.deliver ready packed task');
        const recipe = recipeFor(level, before.id), expectedOrderId = nextOrder(state, level);
        const issues = { wrongOrder: before.id !== expectedOrderId,
          wrongTemperature: before.temperatureQ < recipe.deliveryMinQ || before.temperatureQ > recipe.deliveryMaxQ };
        const accepted = !issues.wrongOrder && !issues.wrongTemperature;
        deliveryReceiptId = state.deliveryReceipts.length + 1;
        if (accepted) {
          const collection = collectReceipt(state, station.task, before, tick, operation.id, 'deliver');
          effects.push({ type: 'collected', collection }); station.task = null;
          state.orders[i] = { ...before, phase: 'delivered', location: 'delivered', taskId: null };
        } else {
          const discarded = disposal(state, i, tick, 'input', issues.wrongOrder ? 'wrong-order' : 'wrong-temperature', issues, operation.id);
          disposalId = discarded.id; effects.push({ type: 'discarded', disposal: discarded });
        }
        const delivery = { id: deliveryReceiptId, commandId: operation.id, taskId, orderId: before.id, attempt: before.attempt,
          tick, at: tick / 60, expectedOrderId, temperatureQ: before.temperatureQ, holdingAgeTicks: before.holdingAgeTicks,
          deliveryMinQ: recipe.deliveryMinQ, deliveryMaxQ: recipe.deliveryMaxQ, issues, accepted, disposalId, nextOrderIdAfter: nextOrder(state, level) };
        state.deliveryReceipts.push(delivery);
        if (accepted) effects.push({ type: 'delivered', delivery });
      }
      fields(operation, { taskId, deliveryReceiptId, disposalId }, label + '.input receipt links');
      equal(operation.after, { order: snapshot(state.orders[i]), station: copy(state.stations[stage]), strikes: state.disposalReceipts.length,
        nextOrderId: nextOrder(state, level) }, label + '.immediate input after, before thermal work');
    }
    state.operations.push(copy(operation)); facts.push({ type: 'command', commandId: operation.id, operation: copy(operation) }, ...effects);
  }
  if (blocked.length) {
    const order = state.orders[orderIndex(state.selectedOrderId)], rule = context(order, state.stations);
    equal(rule.reason !== null, true, label + '.blocked context actually impossible');
    const rejection = { id: state.rejections.length + 1, tick, at: tick / 60, orderId: order.id, attempt: order.attempt,
      phase: order.phase, location: order.location, stationId: rule.stage, reason: rule.reason };
    equal(blocked[0].rejection, rejection, label + '.blocked receipt');
    blockedId = rejection.id; state.rejections.push(rejection); facts.push({ type: 'blocked', rejection });
  }
  return { facts, inputCommandId, blockedId };
}

// Only actual event endpoints use this boundary audit. Gaps use n-tick closed
// formulas below; no controller/navigation state or outer step loop is run.
function eventBoundary(previous, record, level, label) {
  const state = copy(previous), tick = record.tick, disposalCountBefore = state.disposalReceipts.length;
  const input = applyObservedInput(state, record, level, label), before = state.orders.map(snapshot);
  const work = STAGES.flatMap(stage => {
    const task = state.stations[stage].task;
    if (!task) return [];
    return [{ stationId: stage, taskId: task.id, orderId: task.orderId, attempt: task.attempt, progressBefore: task.progressTicks,
      increment: task.ready ? 0 : 1, progressAfter: Math.min(task.durationTicks, task.progressTicks + (task.ready ? 0 : 1)),
      durationTicks: task.durationTicks, completedNow: !task.ready && task.progressTicks + 1 === task.durationTicks }];
  });
  state.orders = before.map(order => integrate(order, 1, state.fanMode));
  const completionReceiptIds = [], facts = input.facts;
  for (const row of work) {
    const task = state.stations[row.stationId].task; task.progressTicks = row.progressAfter;
    if (row.completedNow) {
      equal(tick, task.startedTick + task.durationTicks - 1, label + '.inclusive completion tick');
      task.ready = true; task.completedAtTick = tick;
      const order = state.orders[orderIndex(task.orderId)];
      order.phase = { cook: 'cooked', cool: 'cooled', pack: 'packed' }[task.stage];
      if (task.stage === 'cook') {
        order.cookedAtTick = tick; order.holdingAgeTicks = 0; order.expiresAtTick = tick + recipeFor(level, order.id).holdTicks;
      }
      const completion = { id: state.completionReceipts.length + 1, taskId: task.id, stage: task.stage, orderId: task.orderId,
        attempt: task.attempt, tick, at: tick / 60, startedTick: task.startedTick, durationTicks: task.durationTicks,
        temperatureQ: order.temperatureQ, holdingAgeTicks: order.holdingAgeTicks };
      state.completionReceipts.push(completion); completionReceiptIds.push(completion.id); facts.push({ type: 'task-completed', completion });
    }
  }
  const afterWork = state.orders.map(snapshot);
  for (let i = 0; i < IDS.length; i++) {
    const order = state.orders[i];
    if (order.cookedAtTick !== null && order.phase !== 'delivered' && tick >= order.expiresAtTick) {
      const discarded = disposal(state, i, tick, 'interval-end', 'expired', { expired: true }, null);
      facts.push({ type: 'discarded', disposal: discarded });
    }
  }
  state.tick = tick;
  const ending = outcome(tick, level.closeTick, state.disposalReceipts.length, state.orders);
  if (ending.phase === 'won') facts.push({ type: 'won', score: ending.score, deliveredOrderIds: level.deliveryOrder.slice() });
  if (ending.phase === 'lost') facts.push({ type: 'lost', reason: ending.lostReason, strikes: state.disposalReceipts.length,
    undeliveredOrderIds: IDS.filter(id => state.orders[orderIndex(id)].phase !== 'delivered') });
  state.events = facts.map(fact => ({ id: ++state.eventCount, type: fact.type, tick, at: tick / 60, ...fact }));
  if (state.events.length) state.lastEvent = copy(state.events.at(-1));
  equal(record.events, state.events, label + '.all input/completion/expiry/terminal events in order');
  state.lastInterval = { fromTick: tick - 1, toTick: tick, inputCommandId: input.inputCommandId, blockedId: input.blockedId, fanMode: state.fanMode,
    orders: IDS.map((orderId, i) => ({ orderId, before: before[i], nominalDeltaQ: rateFor(before[i], state.fanMode),
      actualDeltaQ: afterWork[i].temperatureQ - before[i].temperatureQ, afterWork: afterWork[i], after: snapshot(state.orders[i]) })),
    work, completionReceiptIds, disposalReceiptIds: state.disposalReceipts.slice(disposalCountBefore).map(receipt => receipt.id), terminalPhase: ending.phase };
  return state;
}

function stableLastInterval(previous, count) {
  const tick = previous.tick + count;
  const before = previous.orders.map(order => integrate(order, count - 1, previous.fanMode));
  const after = previous.orders.map(order => integrate(order, count, previous.fanMode));
  const work = STAGES.flatMap(stage => {
    const task = previous.stations[stage].task;
    if (!task) return [];
    const progressBefore = task.progressTicks + (task.ready ? 0 : count - 1), increment = task.ready ? 0 : 1;
    return [{ stationId: stage, taskId: task.id, orderId: task.orderId, attempt: task.attempt,
      progressBefore, increment, progressAfter: progressBefore + increment, durationTicks: task.durationTicks, completedNow: false }];
  });
  return { fromTick: tick - 1, toTick: tick, inputCommandId: null, blockedId: null, fanMode: previous.fanMode,
    orders: IDS.map((orderId, i) => ({ orderId, before: before[i], nominalDeltaQ: rateFor(before[i], previous.fanMode),
      actualDeltaQ: after[i].temperatureQ - before[i].temperatureQ, afterWork: after[i], after: after[i] })),
    work, completionReceiptIds: [], disposalReceiptIds: [], terminalPhase: 'playing' };
}
function stableInterval(previous, count, level, label) {
  if (!count) return copy(previous);
  const tick = previous.tick + count;
  for (const stage of STAGES) {
    const task = previous.stations[stage].task;
    if (task && !task.ready) equal(task.progressTicks + count < task.durationTicks, true, label + '.no omitted completion in stable interval');
  }
  for (const order of previous.orders) if (order.cookedAtTick !== null && order.phase !== 'delivered')
    equal(tick < order.expiresAtTick, true, label + '.no omitted expiry in stable interval');
  equal(tick < level.closeTick, true, label + '.no omitted closing event');
  const state = copy(previous);
  state.orders = previous.orders.map(order => integrate(order, count, previous.fanMode));
  for (const stage of STAGES) {
    const task = state.stations[stage].task;
    if (task && !task.ready) task.progressTicks += count;
  }
  state.tick = tick; state.events = [];
  state.lastInterval = stableLastInterval(previous, count);
  return state;
}

function reviewRound(entry) {
  const initialFailures = failures.length, initialAssertions = assertions, name = entry.name;
  const file = path.join(corpus, entry.file), raw = read(file), levelNumber = Number(/^level([1-3])-/.exec(name)[1]), level = LEVELS[levelNumber - 1];
  equal(hash(file), entry.sha256, name + '.projection hash'); equal(Object.hasOwn(raw, 'pilotDiagnostics'), false, name + '.no pilot diagnostics');
  equal(/^[a-f0-9]{64}$/.test(entry.originalRawSha256), true, name + '.raw provenance from approved index');
  const events = raw.eventTransitions.flatMap(record => record.events), operations = raw.operations.map(record => record.receipt);
  const sources = [{ label: 'initial', state: raw.initial }, { label: 'final', state: raw.final },
    ...raw.retained.map((record, i) => ({ label: `retained[${i}]`, state: record.state })),
    ...raw.eventTransitions.flatMap((record, i) => ['before', 'after'].map(side => ({ label: `events[${i}].${side}`, state: record[side] }))),
    ...raw.operations.flatMap((record, i) => ['before', 'after'].map(side => ({ label: `operations[${i}].${side}`, state: record[side] })))];
  const wanted = new Set([0, raw.final.model.tick, ...sources.map(source => source.state.model.tick), ...raw.compactTrace.map(point => point.tick)]);
  const predicted = new Map([[0, initialCore()]]), segments = [];
  let current = initialCore(), firstTerminal = null;
  for (const record of raw.eventTransitions) {
    fields(record.before.model, { tick: record.tick - 1, eventCount: record.eventCountBefore }, name + '.event before');
    fields(record.after.model, { tick: record.tick, eventCount: record.eventCountAfter }, name + '.event after');
    equal(record.events, record.after.model.events, name + '.actual event window');
    equal(record.tick > current.tick, true, name + '.ordered unique event ticks');
    const gap = record.tick - 1 - current.tick;
    if (gap) {
      segments.push({ fromTick: current.tick, toTick: current.tick + gap, kind: 'closed-form', intervals: gap, origin: current });
      for (const tick of wanted) if (tick > current.tick && tick <= current.tick + gap)
        predicted.set(tick, stableInterval(current, tick - current.tick, level, name + '@' + tick));
      current = stableInterval(current, gap, level, name + '.gap endpoint'); predicted.set(current.tick, copy(current));
    }
    current = eventBoundary(current, record, level, name + '@' + record.tick); predicted.set(current.tick, copy(current));
    segments.push({ fromTick: record.tick - 1, toTick: record.tick, kind: 'event-boundary', intervals: 1, interval: current.lastInterval });
    const ending = outcome(current.tick, level.closeTick, current.disposalReceipts.length, current.orders);
    if (ending.phase !== 'playing' && !firstTerminal) firstTerminal = { tick: current.tick, reason: ending.phase === 'won' ? 'won' : ending.lostReason };
  }
  if (current.tick < raw.final.model.tick) {
    const until = raw.final.model.tick, origin = current;
    segments.push({ fromTick: origin.tick, toTick: until, kind: 'closed-form', intervals: until - origin.tick, origin });
    for (const tick of wanted) if (tick > origin.tick && tick <= until) predicted.set(tick, stableInterval(origin, tick - origin.tick, level, name + '@' + tick));
    current = stableInterval(origin, until - origin.tick, level, name + '.tail'); predicted.set(until, copy(current));
  }
  equal(firstTerminal, { tick: raw.final.model.tick, reason: raw.final.model.phase === 'won' ? 'won' : raw.final.model.lostReason }, name + '.first terminal priority');
  equal(current.operations, operations, name + '.all accepted operation receipts');
  for (const [i, operation] of operations.entries()) {
    const transition = raw.eventTransitions.find(record => record.tick === operation.tick);
    equal(raw.operations[i].before, transition?.before, name + '.operation full before window');
    equal(raw.operations[i].after, transition?.after, name + '.operation full after window');
    equal(operation, raw.operations[i].after.model.lastOperation, name + '.operation receipt actual lastOperation');
  }
  for (const source of sources) {
    const actual = source.state.model, expected = predicted.get(actual.tick), label = `${name}.${source.label}@${actual.tick}`;
    const strikes = expected.disposalReceipts.length, ending = outcome(actual.tick, level.closeTick, strikes, expected.orders);
    fields(actual, { level: levelNumber, difficulty: levelNumber - 1, tick: expected.tick, closeTick: level.closeTick, elapsed: expected.tick / 60,
      timeLimit: level.closeTick / 60, remaining: Math.max(0, (level.closeTick - expected.tick) / 60), ...ending,
      selectedOrderId: expected.selectedOrderId, fanMode: expected.fanMode, fanRateQ: configuredRate(expected.fanMode), strikeLimit: 2,
      deliveryOrder: level.deliveryOrder, nextOrderId: nextOrder(expected, level), deliveredCount: expected.orders.filter(order => order.phase === 'delivered').length,
      strikes, discardedAttempts: strikes, fanChangeCount: expected.operations.filter(operation => operation.type === 'fan').length,
      commandCount: expected.operations.length, blockedCommands: expected.rejections.length,
      lastOperation: expected.operations.at(-1) || null, lastRejected: expected.rejections.at(-1) || null,
      actionReceipts: expected.operations.filter(operation => operation.type === 'action'), taskCount: expected.taskStartReceipts.length,
      taskStats: stats(expected), stations: expected.stations, eventCount: expected.eventCount, events: expected.events,
      lastEvent: expected.lastEvent, lastInterval: expected.lastInterval }, label);
    fields(actual.physics, { tickHz: 60, temperatureScale: 240, ambientQ: 4800, cookRateQ: 20, passiveRateQ: -2, packRateQ: -1,
      fastCoolRateQ: -12, slowCoolRateQ: -2, minCoolTicks: 120 }, label + '.physics');
    equal(actual.orders.length, 3, label + '.one current record per order');
    expected.orders.forEach((order, i) => {
      fields(actual.orders[i], { ...level.recipes[i], ...order,
        delivery: expected.deliveryReceipts.find(receipt => receipt.orderId === order.id && receipt.accepted) || null }, label + '.' + order.id);
      equal(order.temperatureQ, AMBIENT + order.heatingAddedQ - order.coolingRemovedQ, label + '.attempt thermal identity');
      if (order.cookedAtTick !== null) equal(order.holdingAgeTicks,
        order.phase === 'delivered' ? expected.deliveryReceipts.find(receipt => receipt.orderId === order.id && receipt.accepted).tick - 1 - order.cookedAtTick : expected.tick - order.cookedAtTick,
        label + '.delivery-preinterval versus active-postinterval age');
      if (STAGES.includes(order.location)) {
        const task = expected.stations[order.location].task;
        fields(task, { id: order.taskId, orderId: order.id, attempt: order.attempt }, label + '.one physical location');
      } else equal(order.taskId, null, label + '.tray/delivered no station task');
    });
    for (const receiptName of receiptNames) equal(actual[receiptName], expected[receiptName], label + '.' + receiptName);
    const accounting = summarize(expected.orders, expected.disposalReceipts);
    fields(actual, accounting, label + '.integer accounting');
    equal(accounting.inventory.error, 0, label + '.inventory conservation'); equal(accounting.thermalLedger.error, 0, label + '.Q accounting identity');
    for (const stage of STAGES) {
      const item = stats(expected)[stage], task = expected.stations[stage].task;
      equal(item.started, item.completed + item.cancelled + Number(Boolean(task && !task.ready)), label + '.working stage ledger ' + stage);
      equal(item.completed, item.collected + item.discardedReady + Number(Boolean(task?.ready)), label + '.ready stage ledger ' + stage);
      if (task) {
        equal(task.progressTicks, Math.min(task.durationTicks, expected.tick - task.startedTick + 1), label + '.inclusive task progress');
        equal(task.completedAtTick, task.ready ? task.startedTick + task.durationTicks - 1 : null, label + '.inclusive task completion');
      }
    }
    equal(actual.failure, ending.phase === 'lost' ? { reason: ending.lostReason, tick: expected.tick, strikes,
      undeliveredOrderIds: expected.orders.filter(order => order.phase !== 'delivered').map(order => order.id) } : null, label + '.failure facts');
  }
  // Bind every physical field of the approved compact schema. Held-key policy
  // is outside this review; selection continuity is checked through receipts.
  const compactFieldsChecked = new Set();
  for (const [i, point] of raw.compactTrace.entries()) {
    const expected = predicted.get(point.tick), ending = outcome(point.tick, level.closeTick, expected.disposalReceipts.length, expected.orders);
    const available = { selectedOrderId: expected.selectedOrderId, fanMode: expected.fanMode, strikes: expected.disposalReceipts.length,
      deliveredCount: expected.orders.filter(order => order.phase === 'delivered').length, nextOrderId: nextOrder(expected, level),
      commandCount: expected.operations.length, phase: ending.phase,
      orders: expected.orders.map(order => ({ id: order.id, attempt: order.attempt, phase: order.phase, location: order.location,
        temperatureQ: order.temperatureQ, holdingAgeTicks: order.holdingAgeTicks })) };
    for (const [key, value] of Object.entries(available)) {
      equal(point[key], value, `${name}.compact[${i}].${key}`); compactFieldsChecked.add(key);
    }
  }
  // Each stored interval is sampled directly from its fixed-span formula, or
  // from its one audited event boundary. No tick feeds the next tick's Q here.
  equal(raw.intervalTrace.length, raw.final.model.tick, name + '.complete interval trace');
  let segmentIndex = 0, maximumPostInputOccupiedStations = 0, maximumWorkingStations = 0, simultaneousWorkingTicks = 0;
  const actualCoolerHeatRemovalTicks = { fast: 0, slow: 0 };
  for (const [i, actual] of raw.intervalTrace.entries()) {
    fields(actual, { fromTick: i, toTick: i + 1 }, name + '.interval trace continuity');
    while (segments[segmentIndex].toTick < actual.toTick) segmentIndex++;
    const segment = segments[segmentIndex], interval = segment.kind === 'event-boundary' ? segment.interval : stableLastInterval(segment.origin, actual.toTick - segment.fromTick);
    equal(actual, { ...interval, orders: interval.orders.map(row => ({ orderId: row.orderId, inputAttempt: row.before.attempt,
      inputPhase: row.before.phase, inputLocation: row.before.location, temperatureBeforeQ: row.before.temperatureQ,
      nominalDeltaQ: row.nominalDeltaQ, actualDeltaQ: row.actualDeltaQ, temperatureAfterWorkQ: row.afterWork.temperatureQ,
      holdingAgeAfterWorkTicks: row.afterWork.holdingAgeTicks, finalAttempt: row.after.attempt, finalPhase: row.after.phase,
      finalTemperatureQ: row.after.temperatureQ })) }, `${name}.intervalTrace[${i}]`);
    const working = interval.work.filter(row => row.increment === 1).length;
    maximumPostInputOccupiedStations = Math.max(maximumPostInputOccupiedStations, interval.work.length);
    maximumWorkingStations = Math.max(maximumWorkingStations, working); if (working >= 2) simultaneousWorkingTicks++;
    if (interval.orders.some(row => row.before.location === 'cool' && row.actualDeltaQ < 0)) actualCoolerHeatRemovalTicks[interval.fanMode]++;
  }
  return { name, passed: failures.length === initialFailures, assertions: assertions - initialAssertions,
    projectionSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, fullStateOccurrences: sources.length,
    distinctFullTicks: new Set(sources.map(source => source.state.model.tick)).size, retainedStates: raw.retained.length,
    compactCheckpoints: raw.compactTrace.length, compactFieldsChecked: [...compactFieldsChecked].sort(), intervalCheckpoints: raw.intervalTrace.length,
    eventTransitions: raw.eventTransitions.length, events: events.length, operations: operations.length,
    closedFormIntervals: segments.filter(segment => segment.kind === 'closed-form').length,
    closedFormTicks: segments.filter(segment => segment.kind === 'closed-form').reduce((sum, segment) => sum + segment.intervals, 0),
    boundaryTicks: segments.filter(segment => segment.kind === 'event-boundary').length, terminal: firstTerminal,
    taskStats: stats(current), successfulDeliveries: current.deliveryReceipts.filter(receipt => receipt.accepted).map(receipt =>
      ({ orderId: receipt.orderId, attempt: receipt.attempt, tick: receipt.tick, temperatureQ: receipt.temperatureQ, holdingAgeTicks: receipt.holdingAgeTicks })),
    coverage: { maximumPostInputOccupiedStations, maximumWorkingStations, simultaneousWorkingTicks, actualCoolerHeatRemovalTicks,
      fanChanges: current.operations.filter(operation => operation.type === 'fan').length, blockedActions: current.rejections.length,
      disposals: current.disposalReceipts.length, expiries: current.disposalReceipts.filter(receipt => receipt.reason === 'expired').length,
      wrongOrderDeliveries: current.deliveryReceipts.filter(receipt => receipt.issues.wrongOrder).length,
      wrongTemperatureDeliveries: current.deliveryReceipts.filter(receipt => receipt.issues.wrongTemperature).length,
      dualIssueDeliveries: current.deliveryReceipts.filter(receipt => receipt.issues.wrongOrder && receipt.issues.wrongTemperature).length,
      completionThenExpirySameTick: current.disposalReceipts.filter(receipt => receipt.boundary === 'interval-end' && receipt.stationTask?.completedAtTick === receipt.tick).length,
      maxSameTickExpiries: Math.max(0, ...raw.eventTransitions.map(record => current.disposalReceipts.filter(receipt => receipt.tick === record.tick && receipt.reason === 'expired').length)),
      deliveredExactlyAtExpiry: current.deliveryReceipts.filter(receipt => receipt.accepted && receipt.tick === current.orders[orderIndex(receipt.orderId)].expiresAtTick).length,
      finalDeliveryAtClosing: firstTerminal?.reason === 'won' && firstTerminal.tick === level.closeTick },
    inventory: summarize(current.orders, current.disposalReceipts).inventory, thermalLedger: summarize(current.orders, current.disposalReceipts).thermalLedger };
}

// Three hand-computed mathematical fixtures, not production or gameplay runs.
const heated = integrate({ ...freshAttempt('O1', 1), phase: 'cooking', location: 'cook', taskId: 1 }, 600, 'fast');
equal(heated.temperatureQ, 16800, 'oracle fixture final heating interval included');
const clamped = integrate({ ...freshAttempt('O1', 1), phase: 'cooled', location: 'cool', temperatureQ: 4805, heatingAddedQ: 5,
  cookedAtTick: 100, holdingAgeTicks: 2, expiresAtTick: 1300, taskId: 2 }, 3, 'fast');
fields(clamped, { temperatureQ: 4800, coolingRemovedQ: 5, holdingAgeTicks: 5 }, 'oracle fixture actual clamped delta and age');
const delivered = { ...heated, phase: 'delivered', location: 'delivered', taskId: null, cookedAtTick: 600, holdingAgeTicks: 99, expiresAtTick: 1800 };
equal(integrate(delivered, 120, 'fast'), delivered, 'oracle fixture delivered temperature and age freeze');
const results = [];
for (const entry of index.rounds) {
  try { results.push(reviewRound(entry)); }
  catch (error) { failures.push({ name: entry.name, error: error.message }); results.push({ name: entry.name, passed: false, error: error.message }); }
}
const endHashes = hashes(); equal(endHashes, startHashes, 'sources and public observations unchanged');
const report = { passed: failures.length === 0, scope: 'Independent event-interval integer thermal, timing and ledger review of six existing ordinary rounds; no Model/pilot/game execution.',
  startedAt, completedAt: new Date().toISOString(), startHashes, endHashes, sourceUnchanged: isDeepStrictEqual(startHashes, endHashes),
  publicObservationIndexSha256: approvedIndexHash, originalReportSha256: index.originalReportSha256, observedProductionHashesFromIndex: index.sourceHashes,
  method: [
    'Start from the authored recipes and ambient raw attempts. Event-free spans integrate temperature/age/progress directly for n ticks; they do not restart from observed temperatures.',
    'Audit only recorded event boundaries: immediate input snapshots, simultaneous work/completions, all expiries, then terminal priority. Never choose new controls or simulate navigation repeat state.',
    'Separate input delivery age/temperature from post-work expiry facts; preserve ready occupancy and derive stage, attempt and Q-accounting totals from verified permanent receipts.',
  ],
  limitations: [
    'Original raw hashes are provenance from the approved diagnostic-free projection index; private policies, predictors and author witnesses are not inspected.',
    'Only present ordinary events are production coverage. Three mathematical fixtures validate the oracle only; they are not additional gameplay or production boundary tests.',
    'TemperatureQ ledgers account for integer Q changes and archived attempts; they are not physical energy conservation.',
    'No pause/retry/cancel/subtick/held-edge or post-terminal runtime claim is made. Exact expiry/closing delivery and simultaneous expiry coverage are reported rather than presumed.',
  ], integerTolerance: 0, oracleOnlyFixtureCount: 3, assertions, results, failureCount: failures.length, failures };
fs.mkdirSync(output, { recursive: false });
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, assertions, failureCount: failures.length,
  results: results.map(r => ({ name: r.name, passed: r.passed, terminal: r.terminal, coverage: r.coverage, error: r.error })) }, null, 2));
if (!report.passed) process.exitCode = 1;
