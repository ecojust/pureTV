// Existing public observations only; event-segment oscillator algebra and safe-window calendars.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { readParameters, endpoint, constantDriveSpan, contactFromEndpoints, safeRuns, firstQualifiedEnd, rangeMax, firstUnsafe } from './resonance-interval-oracle.mjs';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), contractPath = path.join(app, 'docs/model-contract.md');
const CONTRACT_SHA = '142339acc92a0c2738caf5813409064b5495ba039fc0444a44dd660df10c5e40';
const BANKS = ['actionReceipts', 'phasePulseReceipts', 'pedestrianEvents'];
const copy = value => structuredClone(value), sum = values => values.reduce((a, b) => a + b, 0);
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let parameters, assertions = 0, failureCount = 0; const failureSamples = [];
const maximumErrors = { metres: 0, radians: 0 }, margins = { contactMetres: Infinity, closingMetres: Infinity };
function equal(actual, expected, label) {
  assertions++; if (!isDeepStrictEqual(actual, expected)) { failureCount++; if (failureSamples.length < 60) failureSamples.push({ label, actual, expected }); }
}
function compare(actual, expected, label, key = '') {
  if (typeof expected === 'number' && /(?:Metres|gapFrom|gapTo|amplitudeFrom|amplitudeTo|heightFrom|heightTo|phaseRadians)$/.test(key)) {
    const unit = key === 'phaseRadians' ? 'radians' : 'metres', tolerance = unit === 'radians' ? 1e-12 : 1e-10;
    const error = typeof actual === 'number' && Number.isFinite(actual) ? Math.abs(actual - expected) : Infinity;
    maximumErrors[unit] = Math.max(maximumErrors[unit], error); equal(error <= tolerance, true, label + '.absolute numerical comparison');
  } else if (expected && typeof expected === 'object') {
    equal(Array.isArray(actual), Array.isArray(expected), label + '.array shape');
    equal(actual && Object.keys(actual).sort(), Object.keys(expected).sort(), label + '.keys');
    for (const name of Object.keys(expected)) compare(actual?.[name], expected[name], label + '.' + name, name);
  } else equal(actual, expected, label);
}

function oscillatorCalendar(raw, level, label) {
  const p = parameters.simulation, horizon = raw.final.model.tick, actions = [], pulses = [];
  const boards = [0, 1, 2].map(index => ({ index, time: 0, frequencyIndex: level.initialFrequencyIndices[index], pulse: null, segments: [],
    physical: endpoint({ phaseUnits: level.initialPhaseUnits[index], resonanceUnits: level.initialResonanceUnits[index] }, p) }));
  const advance = (board, toTick) => {
    while (board.time < toTick) {
      const end = Math.min(toTick, board.pulse?.endTick ?? toTick), effectiveSpeed = p.frequencyPhaseUnitsPerTick[board.frequencyIndex] + (board.pulse ? p.phasePulseUnitsPerTick : 0);
      board.segments.push({ fromTick: board.time, toTick: end, start: copy(board.physical), frequencyIndex: board.frequencyIndex, effectiveSpeed, pulse: board.pulse });
      board.physical = constantDriveSpan(board.physical, effectiveSpeed, end - board.time, p); board.time = end;
      if (board.pulse?.endTick === end) board.pulse = null;
    }
  };
  const commandState = board => ({ phaseUnits: board.physical.phaseUnits, resonanceUnits: board.physical.resonanceUnits,
    amplitudeMetres: board.physical.amplitudeMetres, heightMetres: board.physical.heightMetres, frequencyIndex: board.frequencyIndex,
    trimTicksRemaining: board.pulse ? board.pulse.endTick - board.time : 0 });
  let dispatch = null, previousFrom = -1;
  for (const observed of raw.actualReceipts.actionReceipts) {
    const fromTick = observed.fromTick, tick = fromTick + 1, cursor = observed.cursor, key = observed.key;
    equal(Number.isSafeInteger(fromTick) && fromTick > previousFrom && fromTick < horizon, true, label + '.one chronological action per interval'); previousFrom = fromTick;
    equal(['a', 'b'].includes(key) && Number.isSafeInteger(cursor) && cursor >= 0 && cursor <= 3, true, label + '.actual control domain');
    boards.forEach(board => advance(board, fromTick));
    const board = cursor < 3 ? boards[cursor] : null, kind = key === 'b' ? 'phase' : board ? 'frequency' : 'dispatch';
    const before = board ? commandState(board) : { dispatchAtTick: dispatch?.fromTick ?? null, scheduledReleaseTicks: dispatch?.schedule.slice() || [] };
    let reason = null, pulse = null;
    if (board && kind === 'frequency') board.frequencyIndex = (board.frequencyIndex + 1) % p.frequencyPhaseUnitsPerTick.length;
    else if (board && kind === 'phase') {
      if (board.pulse) reason = 'phase-pulse-active';
      else { pulse = { id: pulses.length + 1, actionId: actions.length + 1, boardIndex: cursor, startTick: fromTick, endTick: fromTick + p.phasePulseTicks }; pulses.push(pulse); board.pulse = pulse; }
    } else if (kind === 'phase') reason = 'no-oscillator';
    else if (dispatch) reason = 'already-dispatched';
    else dispatch = { fromTick, tick, schedule: Array.from({ length: level.pedestrianCount }, (_, i) => fromTick + i * p.pedestrianSpacingTicks) };
    const after = board ? commandState(board) : { dispatchAtTick: dispatch?.fromTick ?? null, scheduledReleaseTicks: dispatch?.schedule.slice() || [] };
    actions.push({ id: actions.length + 1, fromTick, tick, key, kind, boardIndex: board?.index ?? null, accepted: reason === null, reason, cursor,
      before, after, pulseId: pulse?.id ?? null, pulseStartedAtTick: pulse?.startTick ?? null, extraPhaseUnits: pulse ? p.phasePulseUnits : 0,
      scheduledReleaseTicks: kind === 'dispatch' && reason === null ? dispatch.schedule.slice() : null });
  }
  boards.forEach(board => advance(board, horizon));
  const completions = pulses.filter(pulse => pulse.endTick <= horizon).sort((a, b) => a.endTick - b.endTick || a.boardIndex - b.boardIndex).map((pulse, index) => ({
    id: index + 1, fromTick: pulse.endTick - 1, tick: pulse.endTick, pulseId: pulse.id, actionReceiptId: pulse.actionId, boardIndex: pulse.boardIndex,
    startedAtTick: pulse.startTick, completedAtTick: pulse.endTick, intervalCount: p.phasePulseTicks, extraPhaseUnits: p.phasePulseUnits }));
  const physicalAt = (index, tick) => {
    const board = boards[index]; if (tick === 0) return endpoint({ phaseUnits: level.initialPhaseUnits[index], resonanceUnits: level.initialResonanceUnits[index] }, p);
    const segment = board.segments.find(row => row.fromTick < tick && tick <= row.toTick);
    if (!segment) throw new Error('Missing independently derived oscillator span');
    return constantDriveSpan(segment.start, segment.effectiveSpeed, tick - segment.fromTick, p);
  };
  const boardAt = (index, tick) => {
    const frequencyIndex = actions.findLast(row => row.boardIndex === index && row.kind === 'frequency' && row.accepted && row.tick <= tick)?.after.frequencyIndex ?? level.initialFrequencyIndices[index];
    const pulse = pulses.find(row => row.boardIndex === index && row.startTick + 1 <= tick && tick < row.endTick), base = p.frequencyPhaseUnitsPerTick[frequencyIndex];
    return { index, label: '桥板 ' + (index + 1), ...physicalAt(index, tick), frequencyIndex, basePhaseUnitsPerTick: base,
      effectivePhaseUnitsPerTick: base + (pulse ? p.phasePulseUnitsPerTick : 0), trimTicksRemaining: pulse ? pulse.endTick - tick : 0,
      activePulseId: pulse?.id ?? null, activePulseStartedAtTick: pulse?.startTick ?? null, completedPulseCount: completions.filter(row => row.boardIndex === index && row.tick <= tick).length };
  };
  const intervalAt = tick => boards.map(board => {
    const segment = board.segments.find(row => row.fromTick <= tick - 1 && tick - 1 < row.toTick), before = physicalAt(board.index, tick - 1), after = physicalAt(board.index, tick), pulse = segment.pulse;
    return { boardIndex: board.index, phaseFrom: before.phaseUnits, phaseTo: after.phaseUnits, resonanceFrom: before.resonanceUnits, resonanceTo: after.resonanceUnits,
      amplitudeFrom: before.amplitudeMetres, amplitudeTo: after.amplitudeMetres, heightFrom: before.heightMetres, heightTo: after.heightMetres,
      frequencyIndex: segment.frequencyIndex, basePhaseUnitsPerTick: p.frequencyPhaseUnitsPerTick[segment.frequencyIndex], effectivePhaseUnitsPerTick: segment.effectiveSpeed,
      pulseIncrementUnits: pulse ? p.phasePulseUnitsPerTick : 0, trimTicksFrom: pulse ? pulse.endTick - (tick - 1) : 0, trimTicksTo: pulse ? pulse.endTick - tick : 0,
      pulseId: pulse?.id ?? null, completedPulseReceiptId: completions.find(row => row.boardIndex === board.index && row.tick === tick)?.id ?? null };
  });
  compare(raw.actualReceipts.actionReceipts, actions, label + '.independent actions'); compare(raw.actualReceipts.phasePulseReceipts, completions, label + '.independent pulse completions');
  return { actions, pulses, completions, dispatch, boards, physicalAt, boardAt, intervalAt };
}

function pedestrianCalendar(oscillators, level, horizon) {
  const p = parameters.simulation, nodes = Array.from({ length: horizon + 1 }, (_, tick) => [0, ...[0, 1, 2].map(index => oscillators.physicalAt(index, tick).heightMetres), 0]);
  const contacts = Array.from({ length: horizon + 1 }, (_, tick) => tick ? contactFromEndpoints(nodes[tick - 1], nodes[tick], p) : null);
  const edges = [0, 1, 2, 3].map(edge => contacts.slice(1).map((rows, index) => ({ tick: index + 1, ...rows[edge] })));
  const runs = edges.map(safeRuns), closing = edges.map(rows => rows.filter(row => row.closing).map(row => row.tick)), events = [], people = [];
  for (const rows of edges) for (const row of rows) { margins.contactMetres = Math.min(margins.contactMetres, Math.abs(row.maxGapMetres - p.maximumContactGapMetres)); margins.closingMetres = Math.min(margins.closingMetres, Math.abs(Math.abs(row.gapTo) - Math.abs(row.gapFrom))); }
  const event = (id, tick, kind, fields) => events.push({ fromTick: tick - 1, tick, kind, personId: id, ...fields });
  const max = (edge, first, last) => first > last ? 0 : rangeMax(edges[edge].slice(first - 1, last), first, last);
  for (let id = 1; id <= level.pedestrianCount; id++) {
    const scheduled = oscillators.dispatch?.schedule[id - 1] ?? null, person = { id, scheduled, legs: [], fallen: null, passed: null }; people.push(person);
    if (scheduled === null || scheduled >= horizon) continue;
    event(id, scheduled + 1, 'released', { scheduledReleaseTick: scheduled, releasedAtTick: scheduled, node: 0 });
    let visible = scheduled + 1, eligible = scheduled + 1;
    for (let edge = 0; edge < 4; edge++) {
      const movement = edge * (p.crossingTicks + p.plateWalkingTicks), start = firstQualifiedEnd(runs[edge], closing[edge], eligible, p.contactQualificationTicks, horizon);
      const leg = { edge, visible, eligible, start, end: start === null ? null : start + p.crossingTicks, walkEnd: null }; person.legs.push(leg);
      if (start === null) break;
      const contact = contacts[start][edge]; event(id, start, 'crossing-started', { edgeIndex: edge, startedAtTick: start, qualifiedContactTicks: p.contactQualificationTicks,
        gapFrom: contact.gapFrom, gapTo: contact.gapTo, closing: contact.closing, movementTicks: movement });
      if (start === horizon) break;
      const unsafe = firstUnsafe(edges[edge], start + 1, Math.min(leg.end, horizon));
      if (unsafe !== null) {
        const successful = unsafe - start - 1, failed = contacts[unsafe][edge], height = nodes[unsafe - 1][edge] + (nodes[unsafe - 1][edge + 1] - nodes[unsafe - 1][edge]) * (successful / p.crossingTicks);
        person.fallen = { tick: unsafe, edge, movement: movement + successful, height };
        event(id, unsafe, 'fallen', { edgeIndex: edge, startedAtTick: start, fallenAtTick: unsafe, successfulCrossingIntervals: successful,
          maxGapMetres: max(edge, start + 1, unsafe), gapFrom: failed.gapFrom, gapTo: failed.gapTo, intervalMaxGapMetres: failed.maxGapMetres, movementTicks: movement + successful, heightMetres: height }); break;
      }
      if (leg.end > horizon) break;
      event(id, leg.end, edge === 3 ? 'passed' : 'crossing-completed', { edgeIndex: edge, sourceNode: edge, destinationNode: edge + 1, startedAtTick: start, completedAtTick: leg.end,
        successfulCrossingIntervals: p.crossingTicks, maxGapMetres: max(edge, start + 1, leg.end), movementTicks: movement + p.crossingTicks });
      if (edge === 3) { person.passed = leg.end; break; }
      leg.walkEnd = leg.end + p.plateWalkingTicks; if (leg.walkEnd > horizon) break;
      event(id, leg.walkEnd, 'walking-completed', { node: edge + 1, completedAtTick: leg.walkEnd, successfulWalkingIntervals: p.plateWalkingTicks, movementTicks: movement + p.crossingTicks + p.plateWalkingTicks });
      visible = leg.walkEnd; eligible = leg.walkEnd + 1;
    }
  }
  events.sort((a, b) => a.tick - b.tick || Number(a.kind !== 'released') - Number(b.kind !== 'released') || a.personId - b.personId);
  const history = events.map((row, i) => ({ id: i + 1, ...row }));
  const personAt = (person, tick) => {
    const dispatched = oscillators.dispatch && oscillators.dispatch.tick <= tick, released = person.scheduled !== null && person.scheduled < tick;
    const value = { id: person.id, stage: 'pending', scheduledReleaseTick: dispatched ? person.scheduled : null, releasedAtTick: released ? person.scheduled : null,
      passedAtTick: null, fallenAtTick: null, node: 0, edgeIndex: null, contactTicks: 0, crossingAgeTicks: 0, crossingStartedAtTick: null,
      walkingAgeTicks: 0, movementTicks: 0, heightMetres: 0, crossingMaxGapMetres: 0, failedEdgeIndex: null };
    if (!released) return value;
    if (person.fallen && person.fallen.tick <= tick) return { ...value, stage: 'fallen', node: person.fallen.edge, fallenAtTick: person.fallen.tick,
      movementTicks: person.fallen.movement, heightMetres: person.fallen.height, failedEdgeIndex: person.fallen.edge };
    if (person.passed !== null && person.passed <= tick) return { ...value, stage: 'passed', node: 4, passedAtTick: person.passed, movementTicks: 4 * p.crossingTicks + 3 * p.plateWalkingTicks };
    const leg = person.legs.findLast(row => row.visible <= tick), movement = leg.edge * (p.crossingTicks + p.plateWalkingTicks);
    if (leg.start === null || tick < leg.start) {
      const run = runs[leg.edge].find(row => row.firstTick <= tick && tick <= row.lastTick), contactTicks = run && tick >= leg.eligible ? Math.min(p.contactQualificationTicks, tick - Math.max(run.firstTick, leg.eligible) + 1) : 0;
      return { ...value, stage: 'waiting', node: leg.edge, edgeIndex: leg.edge, contactTicks, movementTicks: movement, heightMetres: nodes[tick][leg.edge] };
    }
    if (tick < leg.end) {
      const age = tick - leg.start;
      return { ...value, stage: 'crossing', node: leg.edge, edgeIndex: leg.edge, crossingAgeTicks: age, crossingStartedAtTick: leg.start,
        movementTicks: movement + age, heightMetres: nodes[tick][leg.edge] + (nodes[tick][leg.edge + 1] - nodes[tick][leg.edge]) * (age / p.crossingTicks), crossingMaxGapMetres: max(leg.edge, leg.start + 1, tick) };
    }
    return { ...value, stage: 'walking', node: leg.edge + 1, walkingAgeTicks: tick - leg.end, movementTicks: movement + p.crossingTicks + tick - leg.end, heightMetres: nodes[tick][leg.edge + 1] };
  };
  const beforeAt = (person, tick) => {
    const value = personAt(person, tick - 1);
    if (oscillators.dispatch?.fromTick === tick - 1) value.scheduledReleaseTick = person.scheduled;
    if (person.scheduled === tick - 1) Object.assign(value, { stage: 'waiting', releasedAtTick: person.scheduled, node: 0, edgeIndex: 0 });
    return value;
  };
  return { nodes, contacts, edges, runs, history, people, personAt, beforeAt };
}

function calendar(raw, level, label) {
  const p = parameters.simulation, horizon = raw.final.model.tick, oscillators = oscillatorCalendar(raw, level, label), pedestrians = pedestrianCalendar(oscillators, level, horizon);
  compare(raw.actualReceipts.pedestrianEvents, pedestrians.history, label + '.independent pedestrian calendar');
  const failuresAt = tick => {
    const failures = [];
    [0, 1, 2].forEach(boardIndex => { const board = oscillators.physicalAt(boardIndex, tick); if (board.resonanceUnits > p.maximumSafeResonanceUnits) failures.push({
      kind: 'unstable-amplitude', fromTick: tick - 1, tick, boardIndex, resonanceUnits: board.resonanceUnits, amplitudeMetres: board.amplitudeMetres, maximumSafeResonanceUnits: p.maximumSafeResonanceUnits }); });
    for (const event of pedestrians.history.filter(row => row.kind === 'fallen' && row.tick === tick)) failures.push({ kind: 'pedestrian-fall', fromTick: tick - 1, tick,
      personId: event.personId, edgeIndex: event.edgeIndex, eventId: event.id, gapFrom: event.gapFrom, gapTo: event.gapTo, maxGapMetres: event.intervalMaxGapMetres, maximumContactGapMetres: p.maximumContactGapMetres });
    const remainingCount = pedestrians.people.filter(person => !(person.passed !== null && person.passed <= tick) && !(person.fallen && person.fallen.tick <= tick)).length;
    if (!failures.length && tick >= p.deadlineTicks && remainingCount > 0) failures.push({ kind: 'deadline', fromTick: tick - 1, tick, remainingCount, deadlineTicks: p.deadlineTicks });
    return failures;
  };
  const firstAmplitude = Math.min(Infinity, ...oscillators.boards.flatMap(board => board.segments.filter(segment => segment.effectiveSpeed === p.resonantEffectivePhaseUnitsPerTick).map(segment => {
    const offset = Math.max(1, Math.floor((p.maximumSafeResonanceUnits - segment.start.resonanceUnits) / p.resonanceGainPerTick) + 1);
    return offset <= segment.toTick - segment.fromTick ? segment.fromTick + offset : Infinity;
  })));
  const firstFall = Math.min(Infinity, ...pedestrians.people.filter(person => person.fallen).map(person => person.fallen.tick));
  const allPassed = pedestrians.people.every(person => person.passed !== null) ? Math.max(...pedestrians.people.map(person => person.passed)) : Infinity;
  const terminalTick = Math.min(firstAmplitude, firstFall, allPassed, p.deadlineTicks);
  equal(terminalTick, horizon, label + '.first independently derived terminal');
  const histories = { actionReceipts: oscillators.actions, phasePulseReceipts: oscillators.completions, pedestrianEvents: pedestrians.history };
  const states = new Map();
  const stateAt = tick => {
    if (states.has(tick)) return states.get(tick);
    const persons = pedestrians.people.map(person => pedestrians.personAt(person, tick)), passedCount = persons.filter(person => person.stage === 'passed').length, fallenCount = persons.filter(person => person.stage === 'fallen').length;
    const failures = tick > 0 ? failuresAt(tick) : [], finished = tick >= terminalTick, won = finished && !failures.length && passedCount === level.pedestrianCount;
    const dispatched = oscillators.dispatch && oscillators.dispatch.tick <= tick;
    const state = { tick, elapsed: tick / p.tickHz, phase: finished ? won ? 'won' : 'lost' : 'playing', stage: finished ? 'finished' : dispatched ? 'crossing' : 'tuning',
      score: won ? 1000 + 100 * level.pedestrianCount + Math.floor((p.deadlineTicks - tick) / p.tickHz) : 0, lostReason: failures[0]?.kind ?? null, failures,
      dispatchAtTick: dispatched ? oscillators.dispatch.fromTick : null, scheduledReleaseTicks: dispatched ? oscillators.dispatch.schedule : [], passedCount, fallenCount,
      remainingCount: level.pedestrianCount - passedCount - fallenCount, deadlineTicksRemaining: Math.max(0, p.deadlineTicks - tick),
      boards: [0, 1, 2].map(index => oscillators.boardAt(index, tick)), pedestrians: persons,
      ...Object.fromEntries(BANKS.map(name => [name, histories[name].filter(row => row.tick <= tick)])), lastAction: oscillators.actions.find(row => row.tick === tick) || null };
    states.set(tick, state); return state;
  };
  const intervalAt = tick => ({ fromTick: tick - 1, toTick: tick, stageBefore: stateAt(tick - 1).stage, stageAfter: stateAt(tick).stage,
    actionReceiptId: oscillators.actions.find(row => row.tick === tick)?.id ?? null, oscillators: oscillators.intervalAt(tick), contacts: pedestrians.contacts[tick],
    pedestrians: pedestrians.people.map(person => ({ personId: person.id, before: pedestrians.beforeAt(person, tick), after: pedestrians.personAt(person, tick),
      eventIds: pedestrians.history.filter(event => event.personId === person.id && event.tick === tick).map(event => event.id) })), failures: failuresAt(tick), deadlineReached: tick >= p.deadlineTicks });
  return { histories, oscillators, pedestrians, stateAt, intervalAt, terminalTick };
}

function expand(raw, tick, label) {
  const frame = raw.frames[tick], restored = {};
  equal([frame.tick, frame.state.model.tick], [tick, tick], label + '.actual frame identity');
  equal(Object.keys(frame.receiptPrefixLengths).sort(), BANKS.slice().sort(), label + '.three prefix names');
  for (const name of BANKS) {
    equal(Object.hasOwn(frame.state.model, name), false, label + '.compressed bank ' + name);
    const count = frame.receiptPrefixLengths[name]; equal(count, raw.actualReceipts[name].filter(row => row.tick <= tick).length, label + '.prefix time ' + name);
    restored[name] = raw.actualReceipts[name].slice(0, count);
  }
  return { ...frame.state, model: { ...frame.state.model, ...restored } };
}

function inputBindings(raw, audit, label) {
  let previousKeys = [], previousChangeTick = -1;
  for (const change of raw.inputChanges) {
    equal(Number.isSafeInteger(change.tick) && change.tick > previousChangeTick && change.tick < raw.actualFixedTicks, true, label + '.input change chronology');
    equal(change.from, previousKeys, label + '.held-key continuity'); equal(change.elapsed, change.tick / 60, label + '.input change time');
    equal(new Set(change.to).size === change.to.length && change.to.every(key => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'b'].includes(key)), true, label + '.ordinary key domain');
    previousKeys = change.to; previousChangeTick = change.tick;
  }
  const keysAt = tick => raw.inputChanges.findLast(change => change.tick <= tick)?.to || [], cursors = [0];
  const axis = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
  for (let tick = 1; tick <= raw.actualFixedTicks; tick++) {
    const supplied = raw.intervalTrace[tick - 1].input, before = raw.frames[tick - 1].state.model, after = raw.frames[tick].state.model, last = after.lastInput;
    const keys = keysAt(tick - 1), x = axis(supplied.x), y = axis(supplied.y), a = supplied.a === true, b = supplied.b === true;
    equal([supplied.x, supplied.y, a, b], [Number(keys.includes('ArrowRight')) - Number(keys.includes('ArrowLeft')), Number(keys.includes('ArrowDown')) - Number(keys.includes('ArrowUp')), keys.includes('Space'), keys.includes('b')], label + '.actual held keys@' + tick);
    const epoch = typeof supplied.cancelEpoch === 'number' && Number.isFinite(supplied.cancelEpoch) ? supplied.cancelEpoch : before.inputState.cancelEpoch;
    const cancelled = supplied.cancelled === true, epochChanged = epoch !== before.inputState.cancelEpoch, trigger = cancelled || epochChanged, isolated = before.inputState.quarantined;
    const threshold = parameters.controls.axisThreshold, neutralAcknowledged = isolated && !trigger && Math.abs(x) < threshold && Math.abs(y) < threshold && !a && !b;
    const freshA = !trigger && !isolated && before.inputState.aArmed && a, freshB = !trigger && !isolated && before.inputState.bArmed && b;
    const attempts = audit.histories.actionReceipts.filter(row => row.tick === tick), nav = last.navigationApplied;
    equal(attempts.map(row => row.key), freshB ? ['b'] : freshA ? ['a'] : [], label + '.fresh reported armed edges and B priority');
    equal([-1, 0, 1].includes(nav), true, label + '.navigation delta domain');
    if (trigger || isolated) equal(nav, 0, label + '.quarantined navigation suppressed');
    if (nav) equal(nav, x >= threshold ? 1 : x <= -threshold ? -1 : 0, label + '.horizontal input supports navigation');
    const cursor = Math.max(0, Math.min(3, cursors[tick - 1] + nav)); equal(cursor - cursors[tick - 1], nav, label + '.actual clamped delta');
    cursors.push(cursor); attempts.forEach(row => equal(row.cursor, cursor, label + '.action uses post-navigation cursor'));
    const quarantinedAfter = trigger || isolated && !neutralAcknowledged;
    const direction = after.inputState.navigationDirection, age = after.inputState.navigationHeldTicks;
    equal([-1, 0, 1].includes(direction) && Number.isSafeInteger(age) && age >= 0, true, label + '.navigation latch domain');
    equal([typeof after.inputState.aArmed, typeof after.inputState.bArmed], ['boolean', 'boolean'], label + '.armed latch domain');
    if (trigger || isolated || Math.abs(x) < threshold) equal([direction, age], [0, 0], label + '.neutral/quarantine clears direction age');
    else equal(direction, x >= threshold ? 1 : -1, label + '.reported direction matches axis');
    if (quarantinedAfter) equal([after.inputState.aArmed, after.inputState.bArmed], [false, false], label + '.quarantine disarms');
    if (neutralAcknowledged) equal([after.inputState.aArmed, after.inputState.bArmed], [true, true], label + '.neutral acknowledgment rearms');
    equal(last, { x, y, a, b, cancelEpoch: epoch, cancelled, epochChanged, quarantinedBefore: isolated, quarantinedAfter, neutralAcknowledged,
      aFresh: freshA, bFresh: freshB, navigationDirection: direction, navigationHeldTicks: age, navigationApplied: nav, actionReceiptId: attempts[0]?.id ?? null,
      cursorBefore: cursors[tick - 1], cursorAfter: cursor }, label + '.lastInput@' + tick);
    equal([after.cursor, after.inputState.cancelEpoch, after.inputState.quarantined], [cursor, epoch, quarantinedAfter], label + '.input state links');
  }
  return { keysAt, cursors };
}

function snapshot(wrapper, audit, level, cursor, tick, label) {
  const physics = { ...parameters.simulation, ...Object.fromEntries(['axisThreshold', 'navigationFirstRepeatTick', 'navigationRepeatPeriodTicks'].map(key => [key, parameters.controls[key]])) };
  const expected = { width: 960, height: 540, seed: parameters.seed, difficulty: level.difficulty, level: level.level, levelName: level.name, levelNameEn: level.nameEn,
    physics, scenario: level, ...audit.stateAt(tick), cursor, lastInterval: tick ? audit.intervalAt(tick) : null };
  for (const [key, value] of Object.entries(expected)) compare(wrapper.model[key], value, label + '.' + key, key);
  equal({ phase: wrapper.phase, paused: wrapper.paused, level: wrapper.level, difficulty: wrapper.difficulty, score: wrapper.score },
    { phase: expected.phase, paused: false, level: level.difficulty, difficulty: level.difficulty, score: expected.score }, label + '.wrapper');
  equal(expected.passedCount + expected.fallenCount + expected.remainingCount, level.pedestrianCount, label + '.unique population conservation');
  if (tick) for (const contact of wrapper.model.lastInterval.contacts) {
    equal(contact.maxGapMetres, Math.max(Math.abs(contact.gapFrom), Math.abs(contact.gapTo)), label + '.actual linear interval maximum');
    equal(contact.safe, contact.maxGapMetres <= parameters.simulation.maximumContactGapMetres, label + '.actual strict gap gate');
    equal(contact.closing, Math.abs(contact.gapTo) <= Math.abs(contact.gapFrom), label + '.actual strict closing gate');
  }
}

function references(raw, audit, inputs, label) {
  const expectedTransitions = [];
  for (let tick = 1; tick <= raw.actualFixedTicks; tick++) {
    const before = audit.stateAt(tick - 1), after = audit.stateAt(tick);
    if (BANKS.some(name => before[name].length !== after[name].length) || ['stage', 'phase'].some(key => before[key] !== after[key])) expectedTransitions.push(tick);
  }
  equal(raw.eventTransitions.map(row => row.tick), expectedTransitions, label + '.all and only receipt/stage/terminal boundaries');
  for (const row of raw.eventTransitions) {
    const tick = row.tick; equal([row.beforeFrameIndex, row.afterFrameIndex], [tick - 1, tick], label + '.transition adjacent frames');
    equal(row.input, raw.intervalTrace[tick - 1].input, label + '.transition actual input'); equal(row.actualLastInterval, raw.frames[tick].state.model.lastInterval, label + '.transition actual interval');
    equal(row.receiptIds, Object.fromEntries(BANKS.map(name => [name, audit.histories[name].filter(receipt => receipt.tick === tick).map(receipt => receipt.id)])), label + '.transition receipt ids');
  }
  const observed = Object.fromEntries(BANKS.map(name => [name, []]));
  for (const row of raw.operations) {
    equal(BANKS.includes(row.kind), true, label + '.operation bank'); const tick = row.receipt.tick;
    equal([row.beforeFrameIndex, row.afterFrameIndex, row.observedAt], [tick - 1, tick, tick / 60], label + '.operation actual boundary'); observed[row.kind].push(row.receipt);
  }
  equal(observed, raw.actualReceipts, label + '.every actual receipt observed once without alteration');
  for (const row of raw.retained) { equal(Number.isSafeInteger(row.frameIndex) && row.frameIndex >= 0 && row.frameIndex <= raw.actualFixedTicks, true, label + '.retained existing frame'); equal(row.seconds, row.frameIndex / 60, label + '.retained time'); }
  equal([raw.retained[0]?.frameIndex, raw.retained.at(-1)?.frameIndex], [0, raw.actualFixedTicks], label + '.retained initial and terminal');
  let previousTick = -1;
  for (const row of raw.compactTrace) {
    const t = row.tick, state = audit.stateAt(t); equal(Number.isSafeInteger(t) && t > previousTick && t <= raw.actualFixedTicks, true, label + '.compact chronological reference'); previousTick = t;
    compare(row, { tick: t, keys: inputs.keysAt(t), phase: state.phase, stage: state.stage, cursor: inputs.cursors[t], dispatchAtTick: state.dispatchAtTick,
      passedCount: state.passedCount, fallenCount: state.fallenCount, remainingCount: state.remainingCount, boards: state.boards, pedestrians: state.pedestrians,
      receiptCounts: Object.fromEntries(BANKS.map(name => [name, state[name].length])) }, label + '.all compact fields');
  }
}

function review(raw, entry) {
  const label = entry.name, assertionStart = assertions, failureStart = failureCount, tick = raw.final.model.tick, difficulty = raw.initial.model.difficulty;
  equal(Number.isSafeInteger(difficulty) && difficulty >= 0 && difficulty <= 2, true, label + '.difficulty'); const level = parameters.levels[difficulty];
  equal([raw.name, raw.difficulty, raw.initial.model.level, raw.mode], [label, difficulty, Number(/^level([1-3])-/.exec(label)[1]), label.endsWith('-record') ? 'record' : 'loss'], label + '.case identity');
  equal(Object.hasOwn(raw, 'pilotDiagnostics'), false, label + '.no diagnostics'); equal(entry.removedPaths, ['pilotDiagnostics'], label + '.lossless projection scope');
  equal(Number.isSafeInteger(tick) && tick >= 1 && tick <= parameters.simulation.deadlineTicks, true, label + '.actual bounded terminal tick');
  equal([raw.initial.model.tick, raw.actualFixedTicks, entry.actualFixedTicks, raw.frames.length, raw.intervalTrace.length], [0, tick, tick, tick + 1, tick], label + '.complete actual tick coverage');
  for (const [key, value] of Object.entries({ version: 1, frameIndexBase: 0, frameIndexEqualsTick: true, receiptFields: BANKS })) equal(raw.evidenceEncoding[key], value, label + '.encoding.' + key);
  equal(Object.keys(raw.actualReceipts).sort(), BANKS.slice().sort(), label + '.three banks');
  for (const name of BANKS) equal(raw.actualReceipts[name], raw.final.model[name], label + '.complete actual final bank ' + name);
  equal(raw.initial, expand(raw, 0, label), label + '.initial expansion'); equal(raw.final, expand(raw, tick, label), label + '.final expansion');
  equal(raw.initial.model.inputState, { cancelEpoch: 0, quarantined: false, aArmed: true, bArmed: true, navigationDirection: 0, navigationHeldTicks: 0 }, label + '.initial input state');
  equal(raw.initial.model.lastInput, null, label + '.initial input');
  const audit = calendar(raw, level, label), inputs = inputBindings(raw, audit, label);
  snapshot(raw.initial, audit, level, 0, 0, label + '.initial'); snapshot(raw.final, audit, level, inputs.cursors[tick], tick, label + '.final');
  for (let t = 0; t <= tick; t++) {
    const frame = expand(raw, t, label + '@' + t); snapshot(frame, audit, level, inputs.cursors[t], t, label + '@' + t);
    if (t) {
      const { input, beforeFrameIndex, afterFrameIndex, ...interval } = raw.intervalTrace[t - 1];
      equal([beforeFrameIndex, afterFrameIndex], [t - 1, t], label + '.interval adjacent frames'); equal(interval, frame.model.lastInterval, label + '.detached actual interval');
    }
  }
  references(raw, audit, inputs, label); const final = audit.stateAt(tick), h = audit.histories, c = audit.pedestrians.contacts.slice(1).flat();
  equal(final.phase, raw.mode === 'record' ? 'won' : 'lost', label + '.requested natural outcome');
  const starts = h.pedestrianEvents.filter(row => row.kind === 'crossing-started'), falls = h.pedestrianEvents.filter(row => row.kind === 'fallen');
  return { name: label, level: level.level, passed: failureCount === failureStart, assertions: assertions - assertionStart,
    projectionSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, originalReportSha256: entry.originalReportSha256, sourceHashes: entry.sourceHashes,
    result: Object.fromEntries(['tick', 'elapsed', 'phase', 'stage', 'score', 'lostReason', 'failures', 'dispatchAtTick', 'scheduledReleaseTicks', 'passedCount', 'fallenCount', 'remainingCount', 'boards', 'pedestrians'].map(key => [key, final[key]])),
    counts: { actualFrames: tick + 1, fullSnapshotChecks: tick + 3, intervals: tick, retained: raw.retained.length, compact: raw.compactTrace.length,
      eventWindows: raw.eventTransitions.length, operations: raw.operations.length, inputChanges: raw.inputChanges.length,
      receipts: Object.fromEntries(BANKS.map(name => [name, h[name].length])), oscillatorSegments: sum(audit.oscillators.boards.map(board => board.segments.length)),
      fullBoardEndpointChecks: 3 * (tick + 3), contactIntervals: 4 * tick, safeRuns: sum(audit.pedestrians.runs.map(rows => rows.length)), personCalendars: level.pedestrianCount },
    coverage: { acceptedFrequencyChanges: h.actionReceipts.filter(row => row.accepted && row.kind === 'frequency').length, acceptedPulses: audit.oscillators.pulses.length,
      rejectedReasons: Object.fromEntries([...new Set(h.actionReceipts.filter(row => !row.accepted).map(row => row.reason))].map(reason => [reason, h.actionReceipts.filter(row => row.reason === reason).length])),
      completedPulses: h.phasePulseReceipts.length, unfinishedPulsesAtTerminal: audit.oscillators.pulses.length - h.phasePulseReceipts.length,
      safeContactIntervals: c.filter(row => row.safe).length, exactContactThresholds: c.filter(row => row.maxGapMetres === parameters.simulation.maximumContactGapMetres).length,
      exactClosingEqualities: c.filter(row => Math.abs(row.gapFrom) === Math.abs(row.gapTo)).length, crossingStarts: starts.length,
      completedCrossings: h.pedestrianEvents.filter(row => ['crossing-completed', 'passed'].includes(row.kind)).length, failedCrossings: falls.length,
      failedFinalCrossingIntervals: falls.filter(row => row.successfulCrossingIntervals === parameters.simulation.crossingTicks - 1).length,
      hazardWithSameTickPass: final.failures.length > 0 && h.pedestrianEvents.some(row => row.kind === 'passed' && row.tick === tick),
      wonExactlyAtDeadline: final.phase === 'won' && tick === parameters.simulation.deadlineTicks, failureKinds: [...new Set(final.failures.map(row => row.kind))] } };
}

const [corpusArg, outputArg, approvedIndexSha] = process.argv.slice(2);
if (!corpusArg || !outputArg || !/^[a-f0-9]{64}$/.test(approvedIndexSha || '')) throw new Error('Supply approved public corpus, fresh output and index SHA256');
const corpus = path.resolve(corpusArg), output = path.resolve(outputArg), indexPath = path.join(corpus, 'index.json');
if (hash(indexPath) !== approvedIndexSha) throw new Error('Unapproved public index'); const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
if (index.rounds.length !== 6 || new Set(index.rounds.map(row => row.file)).size !== 6 || !index.rounds.every(row => /^level[1-3]-(record|loss)\.json$/.test(row.file) && row.file === row.name + '.json')) throw new Error('Expected six ordinary case basenames');
const portable = file => file.startsWith('/workspace/pureTV/') ? 'repoRelative:' + file.slice('/workspace/pureTV/'.length) : 'scratchRelative:' + path.relative('/workspace/scratch', file);
const files = [indexPath, contractPath, ...['resonance-interval-oracle.mjs', 'independent-resonance-review.mjs'].map(name => path.join(app, 'tests', name)), ...index.rounds.map(row => path.join(corpus, row.file))];
const hashes = () => Object.fromEntries(files.map(file => [portable(file), hash(file)]));
if (fs.existsSync(output)) throw new Error('Fresh output required; preserve prior evidence'); fs.mkdirSync(output, { recursive: true });
const startedAt = new Date().toISOString(), startHashes = hashes(), rounds = []; let executionError = null;
try {
  equal(hash(contractPath), CONTRACT_SHA, 'approved contract'); parameters = readParameters(fs.readFileSync(contractPath, 'utf8')); equal(index.originalFilesUnchanged, true, 'original bytes unchanged');
  for (const run of index.sourceRuns) { equal(run.startHashes, run.endHashes, 'original source window'); equal(run.startHashes.contract, CONTRACT_SHA, 'actual source contract'); }
  for (const entry of index.rounds) {
    const run = index.sourceRuns.find(row => row.sha256 === entry.originalReportSha256), file = path.join(corpus, entry.file);
    equal(entry.originalReportSha256, index.originalReportSha256, entry.name + '.report binding'); equal(entry.sourceHashes, run?.startHashes, entry.name + '.source binding'); equal(hash(file), entry.sha256, entry.name + '.actual public bytes');
    rounds.push(review(JSON.parse(fs.readFileSync(file, 'utf8')), entry));
  }
} catch (error) { executionError = { name: error.name, message: error.message, stack: error.stack }; }
const endHashes = hashes(), completedAt = new Date().toISOString(); equal(endHashes, startHashes, 'source/evidence window unchanged');
const countKeys = ['actualFrames', 'fullSnapshotChecks', 'intervals', 'retained', 'compact', 'eventWindows', 'operations', 'inputChanges', 'oscillatorSegments', 'fullBoardEndpointChecks', 'contactIntervals', 'safeRuns', 'personCalendars'];
const report = { game: 'resonance-bridge', kind: 'independent-existing-observation-review', passed: !executionError && failureCount === 0 && rounds.length === 6,
  startedAt, completedAt, sourceUnchanged: isDeepStrictEqual(startHashes, endHashes), startHashes, endHashes,
  source: { index: portable(indexPath), indexSha256: approvedIndexSha, originalReportSha256: index.originalReportSha256,
    runs: index.sourceRuns.map(run => ({ report: portable(run.path), sha256: run.sha256, startHashes: run.startHashes, endHashes: run.endHashes })) },
  method: 'Actual action times partition each oscillator into constant effective-speed spans. Integer phase and clipped resonance are evaluated by span formulas from the original initial state; sine endpoints define the declared linear physical intervals. Independent safe-run/closing sets locate each person\'s earliest contact qualification, then fixed crossing/walking dates and the first unsafe crossing interval determine every observed state and receipt. No observed endpoint resets the independent trajectory and no production controller is imported or replayed.',
  numericalComparison: { heightAmplitudeToleranceMetres: 1e-10, phaseRadiansTolerance: 1e-12, integerAndGateTolerance: 0, maximumErrors,
    minimumContactThresholdMarginMetres: Number.isFinite(margins.contactMetres) ? margins.contactMetres : null,
    minimumClosingComparisonMarginMetres: Number.isFinite(margins.closingMetres) ? margins.closingMetres : null,
    comparison: 'Tolerances compare derived numbers only. All contact/closing booleans must agree exactly with both the independently derived endpoints and the recorded endpoints; resonance safety uses exact integer units. Exact boundary equalities are counted only where observed.' },
  assertions, failureCount, failureSamples, failureSamplesTruncated: failureCount > failureSamples.length, executionError,
  totals: Object.fromEntries(countKeys.map(key => [key, sum(rounds.map(row => row.counts[key]))])), rounds,
  limitations: ['Only these existing six public ordinary rounds are audited. No gameplay, fixture, Model/pilot import, private witness or design-feasibility result is used.',
    'Actual normalized input, reported armed edges, cancellation/quarantine, navigation deltas and command selection are bound. Full navigation-repeat and ordinary button-rearming latches are not independently replayed.',
    'The physical contact path is the public linear interpolation between 60 Hz sine endpoints; this does not verify extrema of a continuously evaluated sine between endpoints.',
    'The full actual tick corpus permits exact receipt-prefix restoration; sparse browser/video captures are outside this audit. No missing physical interval is synthesized.',
    'Invalid dt, extra post-terminal calls, runtime pause/retry and boundaries absent from these six rounds are not claimed as independently exercised.'] };
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, assertions, failureCount, executionError, totals: report.totals, numericalComparison: report.numericalComparison, reportSha256: hash(path.join(output, 'report.json')) }, null, 2));
if (!report.passed) process.exitCode = 1;
