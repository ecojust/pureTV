// Offline public-observation review; never loads Model, pilot or design witnesses.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { LEVELS, STEP_TICKS, authoredCells, influenceMatrix, wave, windAt, mutable, counts, result } from './firebreak-matrix-oracle.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [corpusArgument, outputArgument, approvedIndexHash] = process.argv.slice(2);
if (!corpusArgument || !outputArgument || !/^[a-f0-9]{64}$/.test(approvedIndexHash || ''))
  throw new Error('Usage: node independent-firebreak-review.mjs PUBLIC_PROJECTION_DIR FRESH_OUTPUT_DIR APPROVED_INDEX_SHA256');
const corpus = path.resolve(corpusArgument), output = path.resolve(outputArgument);
const contractHash = 'c02340acf897fc7ac2c605f456857163b4de3aad4a6e79623fc5c292197b99ba';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const indexPath = path.join(corpus, 'index.json');
if (hash(indexPath) !== approvedIndexHash) throw new Error('Unapproved public index; no round files read');
const index = json(indexPath);
if (index.rounds.length !== 6 || new Set(index.rounds.map(r => r.file)).size !== 6 ||
  !index.rounds.every(r => /^level[1-3]-(record|loss)\.json$/.test(r.file) && r.file === r.name + '.json'))
  throw new Error('Expected exactly six approved public observation basenames');
const relative = file => file.startsWith('/workspace/pureTV/') ? 'repoRelative:' + file.slice('/workspace/pureTV/'.length) :
  'scratchRelative:' + path.relative('/workspace/scratch', file);
const files = [indexPath, path.join(app, 'docs/model-contract.md'),
  ...['firebreak-matrix-oracle.mjs', 'independent-firebreak-review.mjs'].map(file => path.join(app, 'tests', file)),
  ...index.rounds.map(r => path.join(corpus, r.file))];
const sourceHashes = () => Object.fromEntries(files.map(file => [relative(file), hash(file)]));
const startedAt = new Date().toISOString(), startHashes = sourceHashes(), failures = [];
let assertions = 0;
function equal(actual, expected, label) {
  assertions++;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push({ label, actual, expected });
}
function fields(actual, expected, label) {
  for (const [key, value] of Object.entries(expected)) equal(actual?.[key], value, label + '.' + key);
}
equal(hash(path.join(app, 'docs/model-contract.md')), contractHash, 'approved contract hash');
equal(index.sourceHashes.contract, contractHash, 'ordinary evidence contract identity');
const sorted = list => [...list].sort();
function idSet(actual, expected, label) {
  equal(new Set(actual).size, actual.length, label + '.unique'); equal(sorted(actual), sorted(expected), label);
}
function checkWave(actual, expected, label) {
  if (!expected) { equal(actual, null, label); return; }
  for (const key of ['step', 'fromTick', 'toTick', 'previousWaveTick', 'wind', 'fuelConsumed']) equal(actual?.[key], expected[key], label + '.' + key);
  for (const key of ['oldBurningIds', 'ignitedIds', 'burntOutIds', 'destroyedVillageIds']) idSet(actual[key], expected[key], label + '.' + key);
  const edges = rows => rows.map(row => JSON.stringify([row.from, row.to, row.direction, row.amount])).sort();
  equal(new Set(actual.contributions.map(row => row.from + '>' + row.to)).size, actual.contributions.length, label + '.unique source-target edges');
  equal(edges(actual.contributions), edges(expected.contributions), label + '.target-matrix contributions');
  const changes = rows => rows.map(row => ({ id: row.id, before: mutable(row.before), after: mutable(row.after), addedHeat: row.addedHeat }))
    .sort((a, b) => a.id.localeCompare(b.id));
  equal(new Set(actual.changes.map(row => row.id)).size, actual.changes.length, label + '.unique changed cells');
  equal(changes(actual.changes), changes(expected.changes), label + '.synchronous changes');
}

function reviewRound(entry) {
  const initialFailures = failures.length, initialAssertions = assertions;
  const file = path.join(corpus, entry.file), raw = json(file), name = entry.name;
  equal(hash(file), entry.sha256, name + '.public projection SHA');
  equal(Object.hasOwn(raw, 'pilotDiagnostics'), false, name + '.no diagnostic access');
  equal(raw.projection.originalRawSha256, entry.originalRawSha256, name + '.original raw provenance');
  const levelNumber = Number(/^level([1-3])-/.exec(name)[1]);
  fields(raw.initial.model, { tick: 0, level: levelNumber, difficulty: levelNumber - 1, commandCount: 0, eventCount: 0 }, name + '.authored initial identity');
  const level = LEVELS[levelNumber - 1], columns = level.map[0].length, rows = level.map.length;
  fields(raw.initial.model.cursor, level.cursor, name + '.authored initial cursor');
  const events = raw.eventTransitions.flatMap(record => record.events), operations = raw.operations.map(record => record.receipt);
  const cursorAt = tick => {
    const event = events.filter(event => event.type === 'cursor' && event.tick <= tick).at(-1);
    return event ? { column: event.column, row: event.row } : level.cursor;
  };
  events.forEach((event, i) => {
    fields(event, { id: i + 1, at: event.tick / 60 }, name + '.event sequence');
    equal(Number.isInteger(event.tick) && event.tick > 0, true, name + '.committed event tick');
  });
  operations.forEach((operation, i) => {
    fields(operation, { id: i + 1, at: operation.tick / 60 }, name + '.operation sequence');
    equal(['clear', 'view'].includes(operation.type), true, name + '.accepted operation type');
    const command = events.find(event => event.type === 'command' && event.commandId === operation.id);
    equal(command?.tick, operation.tick, name + '.accepted command event tick');
    const transition = raw.eventTransitions.find(record => record.tick === operation.tick);
    equal(raw.operations[i].before, transition?.before, name + '.operation before is actual event window');
    equal(raw.operations[i].after, transition?.after, name + '.operation after is actual event window');
    equal(operation, raw.operations[i].after.model.lastOperation, name + '.operation receipt is actual lastOperation');
  });
  equal(events.filter(event => event.type === 'command').map(event => event.commandId), operations.map(operation => operation.id), name + '.operation-event bijection');
  for (const record of raw.eventTransitions) {
    fields(record.before.model, { tick: record.tick - 1, eventCount: record.eventCountBefore }, name + '.transition before');
    fields(record.after.model, { tick: record.tick, eventCount: record.eventCountAfter }, name + '.transition after');
    equal(record.events, record.after.model.events, name + '.event window is actual after.events');
    equal(record.events.map(event => event.id), Array.from({ length: record.eventCountAfter - record.eventCountBefore }, (_, i) => record.eventCountBefore + i + 1), name + '.complete event window');
    const wavePosition = record.events.findIndex(event => event.type === 'fire-step');
    if (wavePosition >= 0) equal(record.events.every((event, i) => !['cursor', 'command', 'blocked'].includes(event.type) || i < wavePosition), true, name + '.controls precede wave receipts');
    const terminalPosition = record.events.findIndex(event => ['won', 'lost'].includes(event.type));
    if (terminalPosition >= 0) equal(terminalPosition, record.events.length - 1, name + '.terminal receipt follows input and wave');
  }
  const sources = [{ label: 'initial', state: raw.initial }, { label: 'final', state: raw.final },
    ...raw.retained.map((record, i) => ({ label: `retained[${i}]`, state: record.state })),
    ...raw.eventTransitions.flatMap((record, i) => ['before', 'after'].map(side => ({ label: `events[${i}].${side}`, state: record[side] }))),
    ...raw.operations.flatMap((record, i) => ['before', 'after'].map(side => ({ label: `operations[${i}].${side}`, state: record[side] })))];
  const finalTick = raw.final.model.tick;
  const ticks = new Set([0, finalTick, ...sources.map(source => source.state.model.tick), ...raw.compactTrace.map(point => point.tick), ...events.map(event => event.tick)]);
  for (let tick = STEP_TICKS; tick <= finalTick; tick += STEP_TICKS) ticks.add(tick);
  if (finalTick >= 5400) ticks.add(5400);
  const matrices = Object.fromEntries(['N', 'E', 'S', 'W'].map(wind => [wind, influenceMatrix(columns, rows, wind)]));
  const predicted = new Map(), waveChecks = [];
  let cells = authoredCells(level), burned = 0, clearedFuel = 0, spent = 0, viewHeat = false;
  let fireStep = 0, lastWave = null, lastRejected = null, blocked = 0, firstTerminal = null;
  const acceptedClears = [];
  for (const tick of [...ticks].sort((a, b) => a - b)) {
    const tickOperations = operations.filter(operation => operation.tick === tick);
    const rejected = events.filter(event => event.tick === tick && event.type === 'blocked');
    equal(tickOperations.length + rejected.length <= 1, true, name + '.one action per fixed tick@' + tick);
    for (const operation of tickOperations) {
      if (operation.type === 'view') {
        viewHeat = !viewHeat; equal(operation.viewHeat, viewHeat, name + '.view toggles@' + tick);
      } else {
        const i = cells.findIndex(cell => cell.id === operation.cellId), before = cells[i];
        equal(Boolean(before) && before.terrain === 'forest' && before.status === 'standing', true, name + '.legal cut target@' + tick);
        equal(level.ap - spent > 0, true, name + '.cut AP available@' + tick);
        equal(mutable(operation.before), mutable(before), name + '.cut before heat/fuel@' + tick);
        equal(operation.apBefore, level.ap - spent, name + '.AP before cut@' + tick);
        const after = { ...before, status: 'cleared', heat: 0, fuelRemaining: 0 };
        equal(mutable(operation.after), mutable(after), name + '.cut after heat/fuel@' + tick);
        clearedFuel += before.fuelRemaining; spent++;
        equal(operation.apAfter, level.ap - spent, name + '.AP after cut@' + tick);
        cells = cells.map((cell, j) => j === i ? after : cell); acceptedClears.push(operation);
        const observed = raw.operations.find(record => record.receipt.id === operation.id).after.model;
        equal(operation.cellId, 'C' + (observed.cursor.row * columns + observed.cursor.column), name + '.cut uses selected cell@' + tick);
      }
    }
    for (const event of rejected) {
      const cell = cells.find(cell => cell.id === event.cellId);
      const reason = !cell || cell.terrain !== 'forest' || cell.status !== 'standing' ? 'not-standing-forest' : level.ap - spent <= 0 ? 'no-ap' : null;
      equal(event.reason, reason, name + '.blocked priority@' + tick); equal(reason !== null, true, name + '.rejection valid@' + tick);
      const observed = raw.eventTransitions.find(record => record.tick === tick).after.model;
      equal(event.cellId, 'C' + (observed.cursor.row * columns + observed.cursor.column), name + '.blocked target is selected cell@' + tick);
      lastRejected = { tick, cellId: event.cellId, reason }; blocked++;
    }
    const waveEvents = events.filter(event => event.tick === tick && event.type === 'fire-step');
    if (tick > 0 && tick % STEP_TICKS === 0) {
      fireStep++; const wind = windAt(level, fireStep), before = cells;
      const next = wave(before, matrices[wind], wind, fireStep);
      cells = next.cells; lastWave = next.lastWave; burned += lastWave.fuelConsumed;
      equal(waveEvents.length, 1, name + '.one event for due wave@' + tick);
      if (waveEvents.length) {
        fields(waveEvents[0], { step: fireStep, wind }, name + '.actual wave event');
        for (const key of ['oldBurningIds', 'ignitedIds', 'burntOutIds', 'destroyedVillageIds']) idSet(waveEvents[0][key], lastWave[key], name + '.wave event ' + key);
      }
      waveChecks.push({ step: fireStep, tick, wind, oldBurning: lastWave.oldBurningIds.length,
        lastFuelSources: before.filter(cell => cell.status === 'burning' && cell.fuelRemaining === 1).length,
        ignitionCount: lastWave.ignitedIds.length, contributionCount: lastWave.contributions.length,
        maximumUncappedAddedHeat: Math.max(0, ...lastWave.changes.map(change => change.addedHeat)),
        sameTickClearCount: tickOperations.filter(operation => operation.type === 'clear').length });
    } else equal(waveEvents.length, 0, name + '.no premature wave@' + tick);
    const counted = counts(cells, burned, clearedFuel, level.ap, spent), ending = result(counted, tick);
    if (ending.reason && !firstTerminal) firstTerminal = { tick, reason: ending.reason };
    predicted.set(tick, { cells, counted, ...ending, tick, fireStep, lastWave, lastWind: lastWave?.wind ?? null,
      nextWind: windAt(level, fireStep + 1), nextFireTick: (fireStep + 1) * STEP_TICKS,
      secondsToFireStep: ((fireStep + 1) * STEP_TICKS - tick) / 60, viewHeat, lastRejected, blocked,
      clearReceipts: [...acceptedClears] });
  }
  equal(firstTerminal, { tick: finalTick, reason: raw.final.model.phase === 'won' ? 'won' : raw.final.model.lostReason }, name + '.first terminal priority');
  equal(events.filter(event => ['won', 'lost'].includes(event.type)).map(event => ({ type: event.type, tick: event.tick, reason: event.reason })),
    firstTerminal ? [{ type: firstTerminal.reason === 'won' ? 'won' : 'lost', tick: firstTerminal.tick,
      reason: firstTerminal.reason === 'won' ? null : firstTerminal.reason }] : [], name + '.unique independent terminal receipt');
  for (const source of sources) {
    const actual = source.state.model, expected = predicted.get(actual.tick), tick = actual.tick, label = `${name}.${source.label}@${tick}`;
    fields(actual, { level: levelNumber, difficulty: levelNumber - 1, columns, rows, authoredMap: level.map, fireStep: expected.fireStep, lastWind: expected.lastWind, nextWind: expected.nextWind,
      nextFireTick: expected.nextFireTick, secondsToFireStep: expected.secondsToFireStep, viewHeat: expected.viewHeat,
      phase: expected.phase, lostReason: expected.lostReason, score: expected.score, elapsed: tick / 60, remaining: Math.max(0, 90 - tick / 60), timeLimit: 90 }, label);
    equal(actual.cells.length, expected.cells.length, label + '.cell count');
    expected.cells.forEach((cell, i) => fields(actual.cells[i], cell, label + '.' + cell.id));
    for (const key of ['forest', 'villages', 'ap', 'fuel']) fields(actual[key], expected.counted[key], label + '.' + key);
    fields(actual.physics, { tickHz: 60, fireStepTicks: 120, ignitionHeat: 5, downwindHeat: 3, crosswindHeat: 2, upwindHeat: 1, ordinaryFuel: 3 }, label + '.physics');
    equal(actual.weather.map(segment => ({ from: segment.from, direction: segment.direction })), level.weather, label + '.immutable weather');
    equal(actual.authoredIgnitions.map(ignition => [ignition.x, ignition.y, ignition.fuel]), level.ignitions, label + '.immutable authored ignitions');
    equal(actual.clearCount, expected.counted.ap.spent, label + '.clear count'); equal(actual.clearReceipts, expected.clearReceipts, label + '.retained full cut receipts');
    equal(actual.blockedCommands, expected.blocked, label + '.blocked count'); equal(actual.lastRejected, expected.lastRejected, label + '.last rejection');
    equal(actual.ap.initial, actual.ap.remaining + actual.ap.spent, label + '.AP conservation');
    equal(actual.fuel.initial, actual.fuel.remaining + actual.fuel.burned + actual.fuel.cleared, label + '.integer fuel conservation');
    equal(actual.forest.initial, actual.forest.standing + actual.forest.burning + actual.forest.burnt + actual.forest.cleared, label + '.fixed forest denominator');
    equal(Number.isInteger(actual.cursor.row) && actual.cursor.row >= 0 && actual.cursor.row < rows && Number.isInteger(actual.cursor.column) && actual.cursor.column >= 0 && actual.cursor.column < columns, true, label + '.cursor bounds');
    fields(actual.cursor, cursorAt(tick), label + '.cursor receipt continuity');
    const issued = operations.filter(operation => operation.tick <= tick), occurred = events.filter(event => event.tick <= tick);
    equal(actual.commandCount, issued.length, label + '.command count'); equal(actual.lastOperation, issued.at(-1) || null, label + '.last operation');
    equal(actual.eventCount, occurred.length, label + '.event count'); equal(actual.lastEvent, occurred.at(-1) || null, label + '.last event');
    if (expected.phase === 'lost') {
      fields(actual.failure, { reason: expected.lostReason, tick, standing: expected.counted.forest.standing, minimum: expected.counted.forest.minimum }, label + '.failure');
      idSet(actual.failure.destroyedVillageIds, expected.cells.filter(cell => cell.status === 'destroyed').map(cell => cell.id), label + '.failure villages');
    } else equal(actual.failure, null, label + '.no failure');
    checkWave(actual.lastWave, expected.lastWave, label + '.lastWave');
  }
  // Actual compact schema from the approved observations. Cursor continuity is
  // checked against receipts; the direction/input policy is not re-simulated.
  const compactFields = new Set();
  for (const [i, point] of raw.compactTrace.entries()) {
    const expected = predicted.get(point.tick), c = expected.counted;
    const available = { fireStep: expected.fireStep, viewHeat: expected.viewHeat, standing: c.forest.standing,
      burning: c.forest.burning, villagesIntact: c.villages.intact, apRemaining: c.ap.remaining,
      clearCount: c.ap.spent, blockedCommands: expected.blocked, phase: expected.phase,
      fuelRemaining: c.fuel.remaining, commandCount: operations.filter(o => o.tick <= point.tick).length };
    for (const [key, value] of Object.entries(available)) {
      equal(point[key], value, `${name}.compact[${i}].${key}`); compactFields.add(key);
    }
    fields(point.cursor, cursorAt(point.tick), `${name}.compact[${i}].cursor`); compactFields.add('cursor');
  }
  const final = predicted.get(finalTick), commands = operations.filter(operation => operation.type === 'clear');
  return { name, passed: failures.length === initialFailures, assertions: assertions - initialAssertions,
    projectionSha256: entry.sha256, originalRawSha256: entry.originalRawSha256, fullStateOccurrences: sources.length,
    distinctFullTicks: new Set(sources.map(source => source.state.model.tick)).size, retainedStates: raw.retained.length,
    compactCheckpoints: raw.compactTrace.length, compactFieldsChecked: [...compactFields].sort(), eventTransitions: raw.eventTransitions.length,
    events: events.length, acceptedOperations: operations.length, acceptedClears: commands.length, blockedActions: blocked,
    terminal: firstTerminal, standing: final.counted.forest.standing, requiredStanding: final.counted.forest.minimum,
    apRemaining: final.counted.ap.remaining, fuel: final.counted.fuel, waves: waveChecks,
    coverage: { waves: waveChecks.length, lastFuelSourceEmissions: waveChecks.reduce((sum, w) => sum + w.lastFuelSources, 0),
      newlyIgnitedCells: waveChecks.reduce((sum, w) => sum + w.ignitionCount, 0), sameTickClearAndWave: waveChecks.reduce((sum, w) => sum + w.sameTickClearCount, 0),
      uncappedHeatAboveFiveWaves: waveChecks.filter(w => w.maximumUncappedAddedHeat > 5).length,
      viewOperations: operations.filter(operation => operation.type === 'view').length },
  };
}

// Two deliberately synthetic oracle-only arithmetic fixtures, not model runs.
const forest = (id, column, row, status, heat, fuel) => ({ id, column, row, terrain: 'forest', initialFuel: 3, status, heat, fuelRemaining: fuel });
const small = [forest('C0', 0, 0, 'burning', 5, 1), forest('C1', 1, 0, 'standing', 2, 3), forest('C2', 2, 0, 'standing', 0, 3)];
const first = wave(small, influenceMatrix(3, 1, 'E'), 'E', 1);
equal(first.cells.map(mutable), [{ status: 'burnt', heat: 0, fuelRemaining: 0 }, { status: 'burning', heat: 5, fuelRemaining: 3 },
  { status: 'standing', heat: 0, fuelRemaining: 3 }], 'oracle fixture last-fuel contribution and no same-wave new source');
const cross = Array.from({ length: 9 }, (_, id) => ({ id: 'C' + id, row: Math.floor(id / 3), column: id % 3,
  terrain: 'ground', initialFuel: 0, status: 'inert', heat: 0, fuelRemaining: 0 }));
cross[4] = forest('C4', 1, 1, 'standing', 4, 3);
for (const id of [1, 3, 5]) cross[id] = forest('C' + id, id % 3, Math.floor(id / 3), 'burning', 5, 1);
const combined = wave(cross, influenceMatrix(3, 3, 'E'), 'E', 1);
equal(combined.lastWave.changes.find(change => change.id === 'C4').addedHeat, 6, 'oracle fixture uncapped sum');
equal(combined.cells[4].heat, 5, 'oracle fixture capped target heat');
const results = [];
for (const entry of index.rounds) {
  try { results.push(reviewRound(entry)); }
  catch (error) { failures.push({ name: entry.name, error: error.message }); results.push({ name: entry.name, passed: false, error: error.message }); }
}
const endHashes = sourceHashes(); equal(endHashes, startHashes, 'sources and public observations unchanged');
const report = { passed: failures.length === 0, scope: 'Independent exact-integer matrix-wave review of six existing ordinary rounds; no gameplay/model/controller execution.',
  startedAt, completedAt: new Date().toISOString(), startHashes, endHashes, sourceUnchanged: JSON.stringify(startHashes) === JSON.stringify(endHashes),
  publicObservationIndexSha256: approvedIndexHash, originalReportSha256: index.originalReportSha256, observedProductionHashesFromIndex: index.sourceHashes,
  method: [
    'Initialize literal maps/fuel/AP from the public contract. Replay only already-accepted cut/view receipts; navigation is not re-simulated.',
    'At each numbered fire wave, use a geometry/wind matrix whose rows are targets and columns are old sources; multiply by the old burning indicator before changing any cell.',
    'Apply old-source fuel consumption separately from target heat/ignition. Compare complete matrices, uncapped contributions, unique change maps, AP/fuel/forest identities and first terminal priority.',
    'Compare all full initial/final/retained/event/operation states. Preserve lastWave between waves; integer assertions use no numerical tolerance.',
  ],
  limitations: [
    'Original raw hashes are provenance from the approved public projection index; diagnostic/private route bytes are not inspected.',
    'Actual coverage counters describe only these six rounds. Two synthetic hand fixtures validate the oracle and do not establish production boundary coverage.',
    'This is a wave-rule and receipt review, not a full input/runtime implementation; no pause/retry/cancel/subtick or post-terminal freeze claim.',
    'Unspecified array order is normalized for wave contribution edges, change IDs and result ID sets, while duplicates remain failures.',
  ],
  integerTolerance: 0, oracleOnlyFixtureCount: 2, assertions, results, failureCount: failures.length, failures };
fs.mkdirSync(output, { recursive: false });
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, assertions, failureCount: failures.length,
  results: results.map(r => ({ name: r.name, passed: r.passed, terminal: r.terminal, coverage: r.coverage, error: r.error })) }, null, 2));
if (!report.passed) process.exitCode = 1;
