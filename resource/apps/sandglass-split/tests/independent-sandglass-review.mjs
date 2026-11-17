// Public existing observations only. No Model, pilot, author solver or replay import.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readParameters, cupGeometry, locateCup, sourceSchedule, packetTimes, packetAt, arrivalPosition } from './sandglass-packet-oracle.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contractPath = path.join(app, 'docs/model-contract.md');
const contractHash = 'c2585c494cf67beaa39721597e1416451e7e2343d5c9b1291bf6bf677597e64a';
const copy = value => structuredClone(value), hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let parameters;
const CUP_IDS = ['left', 'center', 'right'], GATE_IDS = ['left', 'right'];
const RECEIPTS = ['commandReceipts', 'navigationReceipts', 'flowReceipts'];
let assertions = 0, failureCount = 0, maximumAngleError = 0;
const failures = [];
function mismatch(value) { failureCount++; if (failures.length < 100) failures.push(value); }
function exact(actual, expected, label) {
  assertions++;
  if (!isDeepStrictEqual(actual, expected)) mismatch({ label, actual, expected });
}
function angle(actual, expected, label) {
  assertions++; const error = Math.abs(actual - expected);
  if (Number.isFinite(error)) maximumAngleError = Math.max(maximumAngleError, error);
  if (!Number.isFinite(actual) || !Number.isFinite(expected) || error > 1e-12) mismatch({ label, actual, expected, tolerance: 1e-12 });
}

function controlCalendar(finalModel, finalTick, label) {
  const commands = finalModel.commandReceipts, navigation = finalModel.navigationReceipts;
  const history = [{ tick: 0, cursor: 0, sourceOpen: false, gateModes: ['outer', 'outer'] }], expectedCommands = [], expectedNavigation = [], openSpans = [];
  let cursor = 0, sourceOpen = false, gateModes = ['outer', 'outer'], openedAt = null;
  const configuration = () => ({ cursor, sourceOpen, gateModes: gateModes.slice() });
  const ticks = [...new Set([...commands, ...navigation].map(row => row.tick))].sort((a, b) => a - b);
  for (const tick of ticks) {
    const basis = label + '.control@' + tick, nav = navigation.filter(row => row.tick === tick), action = commands.filter(row => row.tick === tick);
    exact(Number.isSafeInteger(tick) && tick >= 1 && tick <= finalTick, true, basis + '.actual interval');
    exact(nav.length <= 1 && action.length <= 1, true, basis + '.one navigation and action maximum');
    if (action[0]?.inputKey === 'b') exact(nav.length, 0, basis + '.B suppresses navigation');
    for (const receipt of nav) {
      exact([-1, 1].includes(receipt.direction), true, basis + '.horizontal direction');
      const afterCursor = Math.max(0, Math.min(1, cursor + receipt.direction)), held = receipt.heldTicks;
      exact(afterCursor !== cursor, true, basis + '.clamped attempts are not moves');
      exact(held === 1 || Number.isSafeInteger(held) && held >= 24 && held % 12 === 0, true, basis + '.reported eligible age');
      expectedNavigation.push({ id: expectedNavigation.length + 1, fromTick: tick - 1, tick, direction: receipt.direction,
        heldTicks: held, mode: held === 1 ? 'initial' : 'repeat', beforeCursor: cursor, afterCursor });
      cursor = afterCursor;
    }
    for (const receipt of action) {
      const before = configuration(); exact(['a', 'b'].includes(receipt.inputKey), true, basis + '.action key');
      if (receipt.inputKey === 'b') {
        sourceOpen = !sourceOpen;
        if (sourceOpen) openedAt = tick;
        else { openSpans.push({ firstTick: openedAt, lastTick: tick - 1 }); openedAt = null; }
      } else gateModes[cursor] = gateModes[cursor] === 'outer' ? 'center' : 'outer';
      expectedCommands.push({ id: expectedCommands.length + 1, fromTick: tick - 1, tick, inputKey: receipt.inputKey,
        action: receipt.inputKey === 'b' ? 'toggle-source' : 'rotate-gate', gateId: receipt.inputKey === 'b' ? null : GATE_IDS[cursor], before, after: configuration() });
    }
    history.push({ tick, ...configuration() });
  }
  if (openedAt !== null) openSpans.push({ firstTick: openedAt, lastTick: finalTick });
  const at = tick => history.findLast(row => row.tick <= tick);
  return { history, at, commands: expectedCommands, navigation: expectedNavigation, openSpans };
}

// Event dates and integer coordinates are functions of births and accepted controls.
// No packet is stepped forward from its previous observed or predicted position.
function packetCalendar(level, control, finalTick) {
  const source = sourceSchedule(level, control.openSpans, finalTick), cups = cupGeometry(level, parameters);
  const records = source.emissions.map(emission => {
    const times = packetTimes(emission, level), route = times.contactTick <= finalTick ? control.at(times.contactTick).gateModes[emission.sourceIndex] : null;
    return { emission, ...times, route, arrivalPosition: route === null ? null : arrivalPosition(emission, route, level, parameters) };
  });
  const arrivals = records.filter(row => row.arrivalTick <= finalTick).sort((a, b) => a.arrivalTick - b.arrivalTick || a.emission.id - b.emission.id);
  const ranks = [0, 0, 0]; let spilled = 0;
  for (const row of arrivals) {
    const cupId = locateCup(row.arrivalPosition.xU, cups), index = CUP_IDS.indexOf(cupId), cup = index < 0 ? null : cups[index];
    const rank = cup ? ++ranks[index] : null, capture = cup !== null && rank <= cup.capacityG;
    row.outcome = { kind: capture ? 'capture' : 'spill', cupId, cupBeforeG: cup ? Math.min(cup.capacityG, rank - 1) : null,
      cupAfterG: cup ? Math.min(cup.capacityG, rank) : null, massToCupG: capture ? 1 : 0, massToSpillG: capture ? 0 : 1 };
    if (!capture) Object.assign(row.outcome, { reason: cup ? 'overflow' : 'missed-cup', spillBeforeG: spilled, spillAfterG: ++spilled });
  }
  const flow = [];
  for (const row of records) {
    const { emission: emit, contactTick, arrivalTick, route } = row, sourceIndex = emit.sourceIndex;
    const payload = { packetId: emit.id, massG: 1, sourceIndex };
    flow.push({ ...payload, fromTick: emit.bornFromTick, tick: emit.bornAtTick, kind: 'emit',
      position: { xU: level.sourcePositions[sourceIndex][0] * 10, yU: level.sourcePositions[sourceIndex][1] * 10 },
      reservoirBeforeG: level.initialMassG - emit.id + 1, reservoirAfterG: level.initialMassG - emit.id, sourceAgeTicks: emit.sourceAgeTicks });
    if (contactTick <= finalTick) flow.push({ ...payload, fromTick: contactTick - 1, tick: contactTick, kind: 'contact',
      gateId: GATE_IDS[sourceIndex], mode: route, position: { xU: level.gatePositions[sourceIndex][0] * 10, yU: level.gatePositions[sourceIndex][1] * 10 },
      beforeVelocity: { vxU: 0, vyU: 20 }, afterVelocity: { vxU: level.outgoingVxUnits[sourceIndex][route], vyU: 20 }, routeBefore: null, routeAfter: route });
    if (arrivalTick <= finalTick) flow.push({ ...payload, fromTick: arrivalTick - 1, tick: arrivalTick,
      ...row.outcome, position: row.arrivalPosition, route, contactTick });
  }
  // Emission precedes motion; all contacts and exits are in actual packet ID order.
  flow.sort((a, b) => a.tick - b.tick || Number(a.kind !== 'emit') - Number(b.kind !== 'emit') || a.packetId - b.packetId);
  flow.forEach((row, i) => { row.id = i + 1; });
  return { source, cups, records, arrivals, flow };
}

function physicalAt(calendar, level, tick) {
  const born = calendar.records.filter(row => row.emission.bornAtTick <= tick);
  const packets = born.map(row => packetAt(row.emission, tick, row.route, level, parameters)).filter(Boolean);
  const arrived = calendar.arrivals.filter(row => row.arrivalTick <= tick), captured = arrived.filter(row => row.outcome.kind === 'capture'), spilled = arrived.filter(row => row.outcome.kind === 'spill');
  const cups = calendar.cups.map(cup => {
    const rows = captured.filter(row => row.outcome.cupId === cup.id), massG = rows.length;
    return { ...cup, massG, contributionsG: [0, 1].map(source => rows.filter(row => row.emission.sourceIndex === source).length),
      withinTarget: massG >= cup.minimumG && massG <= cup.capacityG, full: massG === cup.capacityG };
  });
  const emittedBySource = [0, 1].map(source => born.filter(row => row.emission.sourceIndex === source).length);
  const reservoirMassG = level.initialMassG - born.length, cupMassG = captured.length, spillMassG = spilled.length;
  const inventory = { initialMassG: level.initialMassG, reservoirMassG, inFlightMassG: packets.length, cupMassG, spillMassG,
    totalMassG: reservoirMassG + packets.length + cupMassG + spillMassG, errorG: reservoirMassG + packets.length + cupMassG + spillMassG - level.initialMassG,
    emittedMassG: born.length, capturedMassG: captured.length, packetsExactlyOnce: new Set(packets.map(packet => packet.id)).size === packets.length,
    packetCount: packets.length, bySource: [0, 1].map(source => ({ emittedG: emittedBySource[source], inFlightG: packets.filter(packet => packet.sourceIndex === source).length,
      capturedG: captured.filter(row => row.emission.sourceIndex === source).length, spilledG: spilled.filter(row => row.emission.sourceIndex === source).length })) };
  return { sourceAgeTicks: calendar.source.ageAt(tick), reservoirMassG, spillMassG, emittedBySource, nextPacketId: born.length + 1, packets, cups, inventory };
}

function terminalAt(calendar, level, tick, physical) {
  const spills = calendar.arrivals.filter(row => row.arrivalTick === tick && row.outcome.kind === 'spill'), facts = [];
  for (const kind of ['overflow', 'missed-cup']) for (const row of spills.filter(row => row.outcome.reason === kind)) facts.push({
    kind, fromTick: tick - 1, tick, packetIds: [row.emission.id], cupIds: row.outcome.cupId === null ? [] : [row.outcome.cupId], actualValue: 1, limitValue: 0, unit: 'g-spilled' });
  if (tick >= level.deadlineTick) facts.push({ kind: 'deadline', fromTick: tick - 1, tick, packetIds: [], cupIds: [], actualValue: tick, limitValue: level.deadlineTick, unit: 'ticks' });
  const drained = physical.reservoirMassG === 0 && physical.packets.length === 0;
  if (drained) for (const cup of physical.cups.filter(cup => cup.massG < cup.minimumG)) facts.push({ kind: 'shortfall', fromTick: tick - 1, tick,
    packetIds: [], cupIds: [cup.id], actualValue: cup.massG, limitValue: cup.minimumG, unit: 'g' });
  const won = !facts.length && drained && physical.spillMassG === 0 && physical.cups.every(cup => cup.withinTarget);
  return { phase: facts.length ? 'lost' : won ? 'won' : 'playing', lostReason: facts[0]?.kind || null, failures: facts,
    score: won ? 1000 + 2 * Math.floor((level.deadlineTick - tick) / 60) + Math.max(0, 100 - 5 * physical.cups.reduce((sum, cup) => sum + Math.abs(cup.massG - cup.targetG), 0)) : 0 };
}

function expectedTimeline(finalModel, level, label) {
  const finalTick = finalModel.tick, control = controlCalendar(finalModel, finalTick, label), calendar = packetCalendar(level, control, finalTick);
  const physical = new Map(), outcomes = new Map(); let firstTerminal = null;
  // Evaluating each retained time uses algebraic dates/ranks, never a prior packet state.
  for (let tick = 0; tick <= finalTick; tick++) {
    const state = physicalAt(calendar, level, tick), outcome = terminalAt(calendar, level, tick, state);
    physical.set(tick, state); outcomes.set(tick, outcome);
    if (outcome.phase !== 'playing' && firstTerminal === null) firstTerminal = { tick, ...outcome };
  }
  exact(firstTerminal?.tick, finalTick, label + '.first terminal equals final observed tick');
  const events = new Map(), lastEvents = new Map(), eventCounts = new Map(), all = [
    ...control.navigation.map(row => ({ row, type: 'navigate', priority: 0, link: { navigationId: row.id } })),
    ...control.commands.map(row => ({ row, type: 'command', priority: 1, link: { commandId: row.id } })),
    ...calendar.flow.map(row => ({ row, type: 'flow', priority: 2, link: { flowId: row.id, kind: row.kind } }))
  ];
  all.sort((a, b) => a.row.tick - b.row.tick || a.priority - b.priority || a.row.id - b.row.id);
  let eventCount = 0, lastEvent = null;
  for (let tick = 0; tick <= finalTick; tick++) {
    const current = [];
    for (const item of all.filter(item => item.row.tick === tick)) {
      const event = { id: ++eventCount, type: item.type, fromTick: tick - 1, tick, ...item.link };
      item.row.eventSeq = event.id; current.push(event);
    }
    const outcome = outcomes.get(tick);
    if (outcome.phase !== 'playing') current.push({ id: ++eventCount, type: outcome.phase === 'won' ? 'win' : 'loss', fromTick: tick - 1, tick,
      ...(outcome.phase === 'won' ? { score: outcome.score } : { reason: outcome.lostReason }) });
    if (current.length) lastEvent = current.at(-1);
    events.set(tick, current); lastEvents.set(tick, lastEvent); eventCounts.set(tick, eventCount);
  }
  const histories = { commandReceipts: control.commands, navigationReceipts: control.navigation, flowReceipts: calendar.flow };
  for (const name of RECEIPTS) exact(finalModel[name], histories[name], label + '.complete independently derived ' + name);
  return { control, calendar, physical, outcomes, firstTerminal, histories, events, lastEvents, eventCounts };
}

function expandFrame(raw, index, label) {
  exact(Number.isSafeInteger(index) && index >= 0 && index < raw.frames.length, true, label + '.frame index domain');
  const frame = raw.frames[index];
  if (!frame) throw new Error('Missing actual frame');
  exact(frame.tick, index, label + '.recorded frame tick'); exact(frame.state.model.tick, index, label + '.model tick');
  exact(Object.keys(frame.receiptPrefixLengths).sort(), RECEIPTS.slice().sort(), label + '.prefix fields');
  const prefixes = {};
  for (const name of RECEIPTS) {
    exact(Object.hasOwn(frame.state.model, name), false, label + '.receipt array stored only in bank.' + name);
    const count = frame.receiptPrefixLengths[name], bank = raw.actualReceipts[name];
    exact(Number.isSafeInteger(count) && count >= 0 && count <= bank.length, true, label + '.prefix length.' + name);
    exact(count, bank.filter(receipt => receipt.tick <= index).length, label + '.actual receipt chronology.' + name);
    prefixes[name] = bank.slice(0, count);
  }
  // Read-only views of archived values; no physical state is reconstructed or mutated.
  return { ...frame.state, model: { ...frame.state.model, ...prefixes } };
}

function expectedInterval(timeline, level, tick) {
  const before = timeline.physical.get(tick - 1), after = timeline.physical.get(tick), previousControl = timeline.control.at(tick - 1), control = timeline.control.at(tick);
  const flow = timeline.calendar.flow.filter(receipt => receipt.tick === tick), outcome = timeline.outcomes.get(tick);
  return { fromTick: tick - 1, tick, seconds: 1 / 60, inventoryBefore: before.inventory, inventoryAfter: after.inventory,
    source: { openBefore: previousControl.sourceOpen, openAfterInput: control.sourceOpen, ageBefore: before.sourceAgeTicks, ageAfter: after.sourceAgeTicks,
      reservoirBeforeG: before.reservoirMassG, reservoirAfterEmissionG: after.reservoirMassG, emittedPacketIds: flow.filter(row => row.kind === 'emit').map(row => row.packetId) },
    gatesBefore: previousControl.gateModes, gatesAfterInput: control.gateModes,
    commandIds: timeline.control.commands.filter(row => row.tick === tick).map(row => row.id), navigationIds: timeline.control.navigation.filter(row => row.tick === tick).map(row => row.id),
    flowIds: flow.map(row => row.id), emitFlowIds: flow.filter(row => row.kind === 'emit').map(row => row.id),
    contactFlowIds: flow.filter(row => row.kind === 'contact').map(row => row.id), captureFlowIds: flow.filter(row => row.kind === 'capture').map(row => row.id),
    spillFlowIds: flow.filter(row => row.kind === 'spill').map(row => row.id),
    advancedPacketIds: timeline.calendar.records.filter(row => row.emission.bornAtTick <= tick && row.arrivalTick >= tick).map(row => row.emission.id),
    failures: outcome.failures, terminal: outcome.phase === 'playing' ? null : { phase: outcome.phase, reason: outcome.lostReason } };
}

function checkSnapshot(wrapper, timeline, level, tick, initialSeed, label) {
  const model = wrapper.model, physical = timeline.physical.get(tick), control = timeline.control.at(tick), outcome = timeline.outcomes.get(tick);
  if (!physical || !outcome) throw new Error('Snapshot outside the observed tick domain');
  const flow = timeline.calendar.flow.filter(row => row.tick <= tick), commands = timeline.control.commands.filter(row => row.tick <= tick);
  const expected = { width: 960, height: 540, seed: initialSeed, difficulty: level.difficulty, level: level.difficulty + 1,
    levelName: level.name, levelNameEn: level.nameEn, tick, elapsed: tick / 60, deadlineTick: level.deadlineTick, remaining: Math.max(0, (level.deadlineTick - tick) / 60),
    ...outcome, cursor: control.cursor, sourceOpen: control.sourceOpen, ...physical, initialMassG: level.initialMassG,
    physics: { tickHz: 60, unitsPerPixel: 10, massPerPacketG: 1, downwardUnitsPerTick: 20, gateHalfLengthUnits: 420 },
    emitPeriodsTicks: level.emitPeriodsTicks, sourcePositionsU: level.sourcePositions.map(([x, y]) => ({ xU: x * 10, yU: y * 10 })),
    commandCount: commands.length, navigationCount: timeline.control.navigation.filter(row => row.tick <= tick).length,
    deflectionCount: flow.filter(row => row.kind === 'contact').length, capturedCount: flow.filter(row => row.kind === 'capture').length, spilledCount: flow.filter(row => row.kind === 'spill').length,
    eventCount: timeline.eventCounts.get(tick), events: timeline.events.get(tick), lastEvent: timeline.lastEvents.get(tick), lastOperation: commands.at(-1) || null };
  for (const [key, value] of Object.entries(expected)) exact(model[key], value, label + '.' + key);
  exact(wrapper.phase, outcome.phase, label + '.wrapper phase'); exact(wrapper.paused, false, label + '.ordinary unpaused');
  exact(wrapper.level, level.difficulty, label + '.wrapper difficulty-level'); exact(wrapper.difficulty, level.difficulty, label + '.wrapper difficulty'); exact(wrapper.score, outcome.score, label + '.wrapper score');
  exact(model.gates.length, 2, label + '.two gates');
  for (let source = 0; source < 2; source++) {
    const mode = control.gateModes[source], gate = model.gates[source], { angleRad, ...actual } = gate;
    exact(actual, { id: GATE_IDS[source], index: source, sourceIndex: source, pivotXU: level.gatePositions[source][0] * 10, pivotYU: level.gatePositions[source][1] * 10,
      halfLengthU: 420, mode, outgoingVxUnits: level.outgoingVxUnits[source], outgoingVyU: 20, outerCupId: GATE_IDS[source], centerCupId: 'center', fallTicks: level.fallTicks[source], guidedTicks: level.guidedTicks[source] }, label + '.gate[' + source + ']');
    angle(angleRad, Math.atan2(20, level.outgoingVxUnits[source][mode]), label + '.gate[' + source + '].angleRad');
  }
  for (const name of RECEIPTS) exact(model[name], timeline.histories[name].filter(receipt => receipt.tick <= tick), label + '.immutable receipt prefix.' + name);
  if (tick) exact(model.lastInterval, expectedInterval(timeline, level, tick), label + '.complete actual interval');
  else { exact(model.lastInterval, null, label + '.initial interval'); exact(model.lastInput, null, label + '.initial input'); }
}

function inputKeys(raw, label) {
  let prior = [], priorTick = -1;
  for (const [i, row] of raw.inputChanges.entries()) {
    const basis = label + '.inputChanges[' + i + ']';
    exact(Number.isSafeInteger(row.tick) && row.tick > priorTick && row.tick < raw.final.model.tick, true, basis + '.chronological changes');
    exact(row.elapsed, row.tick / 60, basis + '.elapsed'); exact(row.from, prior, basis + '.previous held keys');
    exact(new Set(row.to).size, row.to.length, basis + '.unique held keys');
    exact(row.to.every(key => ['ArrowLeft', 'ArrowRight', 'Space', 'b'].includes(key)), true, basis + '.ordinary keys');
    prior = row.to; priorTick = row.tick;
  }
  return tick => raw.inputChanges.findLast(row => row.tick <= tick)?.to || [];
}

function checkObservedInputs(raw, timeline, keysAt, label) {
  for (let tick = 1; tick <= raw.final.model.tick; tick++) {
    const interval = raw.intervalTrace[tick - 1], before = raw.frames[tick - 1].state.model, after = raw.frames[tick].state.model;
    const supplied = interval.input, last = after.lastInput, keys = keysAt(tick - 1), basis = label + '.actual input@' + tick;
    exact(supplied.x, Number(keys.includes('ArrowRight')) - Number(keys.includes('ArrowLeft')), basis + '.held horizontal input');
    exact(!!(supplied.a || supplied.aPressed), keys.includes('Space'), basis + '.held A'); exact(!!(supplied.b || supplied.bPressed), keys.includes('b'), basis + '.held B');
    const x = typeof supplied.x === 'number' && Number.isFinite(supplied.x) ? Math.max(-1, Math.min(1, supplied.x)) : 0;
    const epoch = Number.isSafeInteger(supplied.cancelEpoch) && supplied.cancelEpoch >= 0 ? supplied.cancelEpoch : before.inputState.cancelEpoch;
    const cancelled = supplied.cancelled === true || epoch !== before.inputState.cancelEpoch;
    exact(last.sample, { x, aDown: !!(supplied.a || supplied.aPressed), bDown: !!(supplied.b || supplied.bPressed), cancelled: supplied.cancelled === true, cancelEpoch: epoch }, basis + '.normalized sample');
    exact(last.fromTick, tick - 1, basis + '.fromTick'); exact(last.tick, tick, basis + '.tick'); exact(last.cancelled, cancelled, basis + '.cancellation');
    exact(last.before, before.inputState, basis + '.actual input-state before'); exact(last.after, after.inputState, basis + '.actual input-state after');
    const commands = timeline.control.commands.filter(row => row.tick === tick), navigation = timeline.control.navigation.filter(row => row.tick === tick);
    exact(last.commandIds, commands.map(row => row.id), basis + '.command links'); exact(last.navigationIds, navigation.map(row => row.id), basis + '.navigation links');
    if (cancelled || before.inputState.quarantined) exact(commands.length + navigation.length, 0, basis + '.quarantine has no accepted controls');
    if (last.freshB) { exact(commands.map(row => row.inputKey), ['b'], basis + '.B accepted'); exact(navigation.length, 0, basis + '.B navigation priority'); }
    for (const command of commands) exact(command.inputKey === 'a' ? last.sample.aDown && last.freshA && !last.freshB : last.sample.bDown && last.freshB, true, basis + '.accepted real action');
    if (last.navigationAttempt) {
      const attempt = last.navigationAttempt, direction = x < -0.45 ? -1 : x > 0.45 ? 1 : 0;
      exact(direction !== 0, true, basis + '.attempt beyond deadzone'); exact(attempt.direction, direction, basis + '.attempt direction');
      exact(attempt.beforeCursor, timeline.control.at(tick - 1).cursor, basis + '.attempt before cursor');
      exact(attempt.afterCursor, Math.max(0, Math.min(1, attempt.beforeCursor + direction)), basis + '.clamped cursor');
      exact(navigation.length, Number(attempt.afterCursor !== attempt.beforeCursor), basis + '.move versus clamped attempt');
      if (navigation.length) exact(attempt, Object.fromEntries(['direction', 'heldTicks', 'mode', 'beforeCursor', 'afterCursor'].map(key => [key, navigation[0][key]])), basis + '.attempt receipt');
    } else exact(navigation.length, 0, basis + '.no unobserved movement attempt');
  }
}

function checkReferences(raw, timeline, keysAt, label) {
  const finalTick = raw.final.model.tick, operations = [], windowTicks = [];
  for (const [i, row] of raw.eventTransitions.entries()) {
    const tick = row.tick, basis = label + '.eventTransitions[' + i + ']'; windowTicks.push(tick);
    exact(row.beforeFrameIndex, tick - 1, basis + '.actual preceding frame'); exact(row.afterFrameIndex, tick, basis + '.actual committed frame');
    exact(row.events, timeline.events.get(tick), basis + '.actual events'); exact(row.actualLastInterval, raw.frames[tick].state.model.lastInterval, basis + '.actual interval copy');
    exact(row.input, raw.intervalTrace[tick - 1].input, basis + '.same real sample');
    exact(row.eventCountBefore, timeline.eventCounts.get(tick - 1), basis + '.before event count'); exact(row.eventCountAfter, timeline.eventCounts.get(tick), basis + '.after event count');
  }
  exact(windowTicks, [...timeline.events].filter(([, events]) => events.length > 0).map(([tick]) => tick), label + '.all and only event windows');
  for (const [i, row] of raw.operations.entries()) {
    const receipt = row.receipt, basis = label + '.operations[' + i + ']';
    exact(RECEIPTS.includes(row.kind), true, basis + '.receipt kind'); exact(row.beforeFrameIndex, receipt.tick - 1, basis + '.before frame'); exact(row.afterFrameIndex, receipt.tick, basis + '.after frame');
    exact(row.observedAt, receipt.tick / 60, basis + '.observedAt'); exact(receipt, raw.actualReceipts[row.kind][receipt.id - 1], basis + '.original receipt');
    operations.push(row.kind + ':' + receipt.id);
  }
  exact(operations.sort(), RECEIPTS.flatMap(name => timeline.histories[name].map(row => name + ':' + row.id)).sort(), label + '.receipt-operation bijection');
  for (const [i, row] of raw.retained.entries()) {
    exact(Number.isSafeInteger(row.frameIndex) && row.frameIndex >= 0 && row.frameIndex <= finalTick, true, label + '.retained[' + i + '].actual frame');
    exact(row.seconds, row.frameIndex / 60, label + '.retained[' + i + '].seconds');
  }
  const fields = ['tick', 'keys', 'phase', 'cursor', 'sourceOpen', 'sourceAgeTicks', 'gateModes', 'reservoirMassG', 'spillMassG', 'inFlightMassG', 'cupMassesG', 'emittedBySource', 'commandCount', 'navigationCount', 'flowReceiptCount', 'eventCount'];
  let previousTick = -1;
  for (const [i, row] of raw.compactTrace.entries()) {
    const tick = row.tick, physical = timeline.physical.get(tick), control = timeline.control.at(tick), basis = label + '.compactTrace[' + i + ']';
    exact(Number.isSafeInteger(tick) && tick > previousTick && tick <= finalTick, true, basis + '.chronological actual sample'); previousTick = tick;
    exact(Object.keys(row).sort(), fields.slice().sort(), basis + '.all actual compact fields');
    exact(row, { tick, keys: keysAt(tick), phase: timeline.outcomes.get(tick).phase, cursor: control.cursor, sourceOpen: control.sourceOpen,
      sourceAgeTicks: physical.sourceAgeTicks, gateModes: control.gateModes, reservoirMassG: physical.reservoirMassG, spillMassG: physical.spillMassG,
      inFlightMassG: physical.packets.length, cupMassesG: physical.cups.map(cup => cup.massG), emittedBySource: physical.emittedBySource,
      commandCount: timeline.control.commands.filter(receipt => receipt.tick <= tick).length, navigationCount: timeline.control.navigation.filter(receipt => receipt.tick <= tick).length,
      flowReceiptCount: timeline.calendar.flow.filter(receipt => receipt.tick <= tick).length, eventCount: timeline.eventCounts.get(tick) }, basis);
  }
  return fields;
}

function reviewRound(raw, entry) {
  const label = entry.name, initialAssertions = assertions, initialFailures = failureCount, finalTick = raw.final.model.tick;
  const level = parameters.levels.find(level => level.difficulty === raw.initial.model.difficulty);
  exact(Object.hasOwn(raw, 'pilotDiagnostics'), false, label + '.strategy diagnostics excluded');
  exact(raw.name, label, label + '.case name'); exact(raw.initial.model.level, Number(/^level([1-3])-/.exec(label)[1]), label + '.named level');
  exact(raw.difficulty, level.difficulty, label + '.difficulty'); exact(raw.mode, label.endsWith('-record') ? 'record' : 'loss', label + '.actual mode');
  exact(entry.sourceHashes.contract, contractHash, label + '.actual run contract'); exact(entry.removedPaths, ['pilotDiagnostics'], label + '.lossless projection scope');
  exact(raw.initial.model.tick, 0, label + '.initial tick'); exact(raw.final.model.phase, raw.mode === 'record' ? 'won' : 'lost', label + '.requested actual outcome');
  exact(raw.actualFixedTicks, finalTick, label + '.actual fixed ticks'); exact(entry.actualFixedTicks, finalTick, label + '.index actual ticks');
  exact(raw.frames.length, finalTick + 1, label + '.all actual frames including tick zero'); exact(raw.intervalTrace.length, finalTick, label + '.all actual intervals');
  for (const [key, value] of Object.entries({ version: 1, frameIndexBase: 0, frameIndexEqualsTick: true, receiptFields: RECEIPTS })) exact(raw.evidenceEncoding[key], value, label + '.encoding.' + key);
  exact(Object.keys(raw.actualReceipts).sort(), RECEIPTS.slice().sort(), label + '.three receipt banks');
  for (const name of RECEIPTS) exact(raw.actualReceipts[name], raw.final.model[name], label + '.bank equals actual final.' + name);
  exact(raw.initial, expandFrame(raw, 0, label + '.initial expansion'), label + '.initial lossless expansion');
  exact(raw.final, expandFrame(raw, finalTick, label + '.final expansion'), label + '.final lossless expansion');
  exact(raw.initial.model.inputState, { cancelEpoch: 0, quarantined: false, aArmed: true, bArmed: true, navigationDirection: 0, navigationHeldTicks: 0 }, label + '.initial input state');
  const seed = raw.initial.model.seed; exact(Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff, true, label + '.normalized seed metadata');
  const timeline = expectedTimeline(raw.final.model, level, label), keysAt = inputKeys(raw, label);
  checkSnapshot(raw.initial, timeline, level, 0, seed, label + '.initial'); checkSnapshot(raw.final, timeline, level, finalTick, seed, label + '.final');
  let packetPositionSamples = 0;
  for (let tick = 0; tick <= finalTick; tick++) {
    const expanded = expandFrame(raw, tick, label + '.frame[' + tick + ']');
    checkSnapshot(expanded, timeline, level, tick, seed, label + '.frame[' + tick + ']'); packetPositionSamples += expanded.model.packets.length;
    if (tick) {
      const { input, beforeFrameIndex, afterFrameIndex, ...actualInterval } = raw.intervalTrace[tick - 1];
      exact(beforeFrameIndex, tick - 1, label + '.interval@' + tick + '.before frame'); exact(afterFrameIndex, tick, label + '.interval@' + tick + '.after frame');
      exact(actualInterval, expanded.model.lastInterval, label + '.interval@' + tick + '.detached actual interval');
    }
  }
  checkObservedInputs(raw, timeline, keysAt, label);
  const compactFields = checkReferences(raw, timeline, keysAt, label), flow = timeline.calendar.flow, control = timeline.control;
  const byTick = new Map();
  for (const receipt of flow) { if (!byTick.has(receipt.tick)) byTick.set(receipt.tick, []); byTick.get(receipt.tick).push(receipt); }
  const flowCounts = Object.fromEntries(['emit', 'contact', 'capture', 'spill'].map(kind => [kind, flow.filter(row => row.kind === kind).length]));
  const rotationContacts = control.commands.filter(command => command.inputKey === 'a' && flow.some(row => row.tick === command.tick && row.kind === 'contact' && row.gateId === command.gateId));
  const outletGroups = [...byTick.values()].filter(rows => rows.filter(row => row.kind === 'emit').length === 2);
  const centralGroups = [...byTick.values()].filter(rows => new Set(rows.filter(row => ['capture', 'spill'].includes(row.kind) && row.cupId === 'center').map(row => row.sourceIndex)).size === 2);
  const capacityConflicts = [...byTick.values()].filter(rows => rows.some(row => row.kind === 'capture' && rows.some(other => other.kind === 'spill' && other.reason === 'overflow' && other.cupId === row.cupId)));
  const arrivals = timeline.calendar.arrivals, boundaryArrivals = arrivals.filter(row => timeline.calendar.cups.some(cup => row.arrivalPosition.xU === cup.leftU || row.arrivalPosition.xU === cup.rightU));
  let closedMoving = 0, closedCapturing = 0, emptyOpen = 0;
  for (let tick = 1; tick <= finalTick; tick++) {
    const interval = expectedInterval(timeline, level, tick);
    if (!control.at(tick).sourceOpen && interval.advancedPacketIds.length) closedMoving++;
    if (!control.at(tick).sourceOpen && interval.captureFlowIds.length) closedCapturing++;
    if (control.at(tick).sourceOpen && timeline.physical.get(tick - 1).reservoirMassG === 0) emptyOpen++;
  }
  const final = timeline.physical.get(finalTick);
  return { name: label, level: level.difficulty + 1, passed: failureCount === initialFailures, assertions: assertions - initialAssertions,
    projectionSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, originalReportSha256: entry.originalReportSha256, sourceHashes: entry.sourceHashes,
    result: { tick: finalTick, ...timeline.outcomes.get(finalTick), elapsed: finalTick / 60, reservoirMassG: final.reservoirMassG, inFlightMassG: final.packets.length,
      cupMassesG: final.cups.map(cup => cup.massG), contributionsG: final.cups.map(cup => cup.contributionsG), spillMassG: final.spillMassG },
    counts: { actualFrames: raw.frames.length, fullSnapshotChecks: raw.frames.length + 2, distinctSnapshotTicks: raw.frames.length,
      referencedSnapshotObservations: raw.retained.length + 2 * raw.eventTransitions.length + 2 * raw.operations.length,
      retained: raw.retained.length, compact: raw.compactTrace.length, intervals: finalTick, packetPositionSamples,
      eventWindows: raw.eventTransitions.length, events: raw.final.model.eventCount, operations: raw.operations.length, inputChanges: raw.inputChanges.length,
      receipts: Object.fromEntries(RECEIPTS.map(name => [name, timeline.histories[name].length])), flows: flowCounts },
    coverage: { openSpans: control.openSpans.length, concurrentOutletEmissionTicks: outletGroups.length, bothSourcesArriveAtCentralCupTicks: centralGroups.length, sameTickCupCaptureAndOverflowIntervals: capacityConflicts.length,
      rotationAndSameGateContactTicks: rotationContacts.length, sourceClosedWithMovingPacketsIntervals: closedMoving, sourceClosedWithCapturesIntervals: closedCapturing,
      sourceEmptyButOpenIntervals: emptyOpen, reopenWithRetainedAgeCommands: control.commands.filter(row => row.inputKey === 'b' && row.after.sourceOpen && timeline.physical.get(row.fromTick).sourceAgeTicks > 0).length,
      rotationsWhileOwnGuidedPacketsAlreadyExist: control.commands.filter(row => row.inputKey === 'a' && timeline.physical.get(row.fromTick).packets.some(packet => packet.stage === 'guided' && GATE_IDS[packet.sourceIndex] === row.gateId)).length,
      halfOpenMouthBoundaryArrivals: boundaryArrivals.length, capturesExactlyFillingCapacity: flow.filter(row => row.kind === 'capture' && row.cupAfterG === timeline.calendar.cups.find(cup => cup.id === row.cupId).capacityG).length,
      failureKinds: [...new Set(timeline.outcomes.get(finalTick).failures.map(row => row.kind))] },
    sourceAlgebra: { exhaustionAgeFromMergedEmissionProgressions: timeline.calendar.source.exhaustionAge,
      actualOpenIntervals: timeline.calendar.source.openTicksAt(finalTick), finalSourceAgeTicks: final.sourceAgeTicks, emittedBySource: final.emittedBySource },
    compactFieldsChecked: compactFields };
}

const [corpusArg, outputArg, approvedIndexHash] = process.argv.slice(2);
if (!corpusArg || !outputArg || !/^[a-f0-9]{64}$/.test(approvedIndexHash || '')) throw new Error('Supply public corpus, fresh output and approved index SHA256');
const corpus = path.resolve(corpusArg), output = path.resolve(outputArg), indexPath = path.join(corpus, 'index.json');
if (hash(indexPath) !== approvedIndexHash) throw new Error('Unapproved public index; no case read');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
if (index.rounds.length !== 6 || new Set(index.rounds.map(row => row.file)).size !== 6 ||
  !index.rounds.every(row => /^level[1-3]-(record|loss)\.json$/.test(row.file) && row.file === row.name + '.json')) throw new Error('Expected six unique ordinary case basenames');
const portable = file => file.startsWith('/workspace/pureTV/') ? 'repoRelative:' + file.slice('/workspace/pureTV/'.length) : 'scratchRelative:' + path.relative('/workspace/scratch', file);
const sourceFiles = [indexPath, contractPath, ...['sandglass-packet-oracle.mjs', 'independent-sandglass-review.mjs'].map(name => path.join(app, 'tests', name)), ...index.rounds.map(row => path.join(corpus, row.file))];
const hashes = () => Object.fromEntries(sourceFiles.map(file => [portable(file), hash(file)]));
if (fs.existsSync(output)) throw new Error('Fresh output required; preserve previous evidence');
fs.mkdirSync(output, { recursive: true });
const startedAt = new Date().toISOString(), startHashes = hashes(), rounds = [];
let executionError = null;
try {
  exact(hash(contractPath), contractHash, 'approved contract'); parameters = readParameters(fs.readFileSync(contractPath, 'utf8'));
  exact(index.originalFilesUnchanged, true, 'projection preserves original evidence');
  for (const run of index.sourceRuns) { exact(run.startHashes, run.endHashes, 'original run source window'); exact(run.startHashes.contract, contractHash, 'original run contract'); }
  for (const entry of index.rounds) {
    const file = path.join(corpus, entry.file); exact(hash(file), entry.sha256, entry.name + '.approved projected bytes');
    rounds.push(reviewRound(JSON.parse(fs.readFileSync(file, 'utf8')), entry));
  }
} catch (error) { executionError = { name: error.name, message: error.message, stack: error.stack }; }
const endHashes = hashes(), completedAt = new Date().toISOString(); exact(endHashes, startHashes, 'audit source and evidence window unchanged');
const countFields = ['actualFrames', 'fullSnapshotChecks', 'distinctSnapshotTicks', 'referencedSnapshotObservations', 'retained', 'compact', 'intervals', 'packetPositionSamples', 'eventWindows', 'events', 'operations', 'inputChanges'];
const report = { game: 'sandglass-split', kind: 'independent-existing-observation-review',
  passed: executionError === null && failureCount === 0 && rounds.length === 6, startedAt, completedAt,
  sourceUnchanged: isDeepStrictEqual(startHashes, endHashes), startHashes, endHashes,
  source: { index: portable(indexPath), indexSha256: approvedIndexHash, originalReportSha256: index.originalReportSha256,
    runs: index.sourceRuns.map(run => ({ report: portable(run.path), sha256: run.sha256, startHashes: run.startHashes, endHashes: run.endHashes })) },
  method: 'Valve-open spans map merged arithmetic emission-age progressions to birth ticks. Each packet contact/arrival date and integer position is evaluated directly from its birth and public geometry; only accepted gate history through the contact tick locks its route. Arrival x is classified by half-open cup mouths, then chronological per-cup rank determines capture or overflow. No position is stepped from a preceding observed or predicted position. Actual frame expansion only restores recorded receipt prefixes.',
  numericalComparison: { integerPositionMassTimingAndGateTolerance: 0, derivedAngleAbsoluteTolerance: 1e-12, maximumAngleError },
  assertions, failureCount, failureSamples: failures, failureSamplesTruncated: failureCount > failures.length, executionError,
  totals: Object.fromEntries(countFields.map(key => [key, rounds.reduce((sum, row) => sum + row.counts[key], 0)])), rounds,
  limitations: [
    'Only these existing ordinary observations are audited. No new game, Model/pilot import, design checker, private plan or author witness is used.',
    'Every stored physical tick is checked by absolute dates and coordinates. Receipt-prefix expansion is serialization recovery, not inferred missing gameplay.',
    'Accepted commands, selected gates, input sample links, local action priority and reported navigation ages are checked; the complete button rearming/navigation repeat/cancellation state machine is not independently replayed.',
    'A half-open classifier is used for every real arrival. Implementing that rule is not evidence of unobserved mouth-edge or synthetic boundaries; actual per-case edge and same-tick capacity-conflict counts are reported.',
    'API invalid dt, pause/retry and post-terminal freeze beyond the retained ordinary round are outside this audit. No additional fixtures or hardware evidence are generated.'
  ] };
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, rounds: rounds.length, assertions, failureCount, executionError, totals: report.totals,
  maximumAngleError, reportSha256: hash(path.join(output, 'report.json')) }, null, 2));
if (!report.passed) process.exitCode = 1;
