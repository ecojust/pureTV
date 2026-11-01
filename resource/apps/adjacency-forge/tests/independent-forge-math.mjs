import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Only public axial geometry/material rules are used. Importing does not run fixtures or read files.
const IDS = Object.freeze(['copper', 'iron', 'silver']);
const TARGET = Object.freeze({ copper: 'iron', iron: 'silver', silver: 'copper' });
const LABELS = Object.freeze(['E', 'SE', 'SW', 'W', 'NW', 'NE']);
const insist = (condition, message) => { if (!condition) throw new Error(message); };
const integer = value => Number.isSafeInteger(value);
const abs = value => value < 0n ? -value : value;
const idValid = value => typeof value === 'string' && value.length > 0;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function axial(point) {
  insist(point && integer(point.q) && integer(point.r), 'Axial coordinates must be safe integers');
  return [BigInt(point.q), BigInt(point.r)];
}

/** An independently constructed cube-distance edge; no direction table or screen coordinates. */
export function cubeAdjacent(a, b) {
  const [aq, ar] = axial(a), [bq, br] = axial(b);
  const dq = bq - aq, dr = br - ar, ds = -dq - dr;
  return abs(dq) + abs(dr) + abs(ds) === 2n;
}

/** World direction rank E,SE,SW,W,NW,NE; null for a zero/non-neighbor displacement. */
export function directionOf(a, b) {
  if (!cubeAdjacent(a, b)) return null;
  const [aq, ar] = axial(a), [bq, br] = axial(b);
  const dq = bq - aq, dr = br - ar;
  if (dr === 0n) return dq > 0n ? 0 : 3;
  if (dr > 0n) return dq === 0n ? 1 : 2;
  return dq === 0n ? 4 : 5;
}

/**
 * Pure public oracle. Optional assignment is a complete tileId permutation in current cells order.
 * Input tile.cellId/cell.tileId describe the baseline; an override never mutates that baseline.
 * Counts of zero are accepted mathematical boundaries, not claims about authored recipes.
 */
export function deriveForge(board, assignment) {
  insist(board && typeof board === 'object', 'Public board required');
  const { cells, tiles, materials, sourceCellId, moldCellId } = board;
  insist(Array.isArray(cells) && cells.length >= 2 && cells.length <= 7, 'Use 2..7 cells with distinct source and mold');
  insist(Array.isArray(tiles) && tiles.length === cells.length, 'One physical tile per cell is required');
  insist(Array.isArray(materials) && materials.length === 3, 'Exactly three public materials required');
  const cellMap = new Map(), tileMap = new Map(), rules = new Map(), coordinates = new Set();
  for (const c of cells) {
    axial(c);
    insist(idValid(c.id) && !cellMap.has(c.id), 'Cell IDs must be unique');
    const key = `${c.q},${c.r}`;
    insist(!coordinates.has(key), 'Coincident axial cells are invalid');
    insist(c.role === null || c.role === 'source' || c.role === 'mold', 'Unknown cell role');
    coordinates.add(key); cellMap.set(c.id, c);
  }
  insist(sourceCellId !== moldCellId && cellMap.has(sourceCellId) && cellMap.has(moldCellId), 'Source and mold must be distinct existing cell IDs');
  insist(cells.filter(c => c.role === 'source').length === 1 && cells.filter(c => c.role === 'mold').length === 1 &&
    cellMap.get(sourceCellId).role === 'source' && cellMap.get(moldCellId).role === 'mold', 'Role IDs disagree with unique source/mold roles');
  for (const m of materials) {
    insist(m && IDS.includes(m.id) && !rules.has(m.id), 'Material IDs must be copper, iron and silver exactly once');
    insist(integer(m.requiredCount) && m.requiredCount >= 0 && m.requiredCount <= 6, 'Recipe count must be an integer in 0..6');
    insist(m.heatTarget === TARGET[m.id] && m.neighborMaterial === m.heatTarget, 'Material target cycle/recipe neighbor differs from the contract');
    rules.set(m.id, m);
  }
  for (const t of tiles) {
    insist(t && idValid(t.id) && !tileMap.has(t.id) && rules.has(t.material), 'Physical tile IDs/materials must be valid and unique');
    insist(cellMap.has(t.cellId), 'Baseline tile location is unknown');
    tileMap.set(t.id, t);
  }
  const baseline = cells.map(c => c.tileId);
  insist(new Set(baseline).size === cells.length && baseline.every(id => tileMap.has(id)), 'Baseline assignment is not a tile permutation');
  insist(cells.every(c => tileMap.get(c.tileId).cellId === c.id), 'Baseline inventory locations disagree');
  const arrangement = assignment === undefined ? baseline : assignment;
  insist(Array.isArray(arrangement) && arrangement.length === cells.length && new Set(arrangement).size === tiles.length &&
    arrangement.every(id => tileMap.has(id)), 'Assignment must contain every physical tile ID exactly once');
  const assigned = new Map(cells.map((c, i) => [c.id, tileMap.get(arrangement[i])]));
  const materialCounts = Object.fromEntries(IDS.map(id => [id, 0]));
  for (const t of assigned.values()) materialCounts[t.material]++;
  const derived = cells.map(c => {
    const neighborByDirection = Array(6).fill(null);
    // Pairwise cube edges are established before assigning their world orientation.
    for (const other of cells) if (cubeAdjacent(c, other)) {
      const direction = directionOf(c, other);
      insist(neighborByDirection[direction] === null, 'Duplicate neighbor in a world direction');
      neighborByDirection[direction] = other.id;
    }
    const neighborIds = neighborByDirection.filter(id => id !== null);
    const neighborCounts = Object.fromEntries(IDS.map(id => [id, 0]));
    for (const id of neighborIds) neighborCounts[assigned.get(id).material]++;
    const tile = assigned.get(c.id), rule = rules.get(tile.material);
    const matchingRanks = neighborByDirection.flatMap((id, rank) =>
      id !== null && assigned.get(id).material === rule.heatTarget ? [rank] : []);
    const outletDirection = c.id === moldCellId || matchingRanks.length === 0 ? null : Math.min(...matchingRanks);
    return { id: c.id, tileId: tile.id, material: tile.material, neighborIds, neighborByDirection, neighborCounts,
      requiredCount: rule.requiredCount, actualCount: neighborCounts[rule.neighborMaterial],
      recipeMet: neighborCounts[rule.neighborMaterial] === rule.requiredCount,
      outletCellId: outletDirection === null ? null : neighborByDirection[outletDirection], outletDirection };
  });
  const byId = new Map(derived.map(c => [c.id, c]));
  // Acceptance is solved by reverse predecessor closure, not by the diagnostic walk below.
  const good = new Set([moldCellId]), layers = [[moldCellId]];
  for (let pass = 0; pass < cells.length - 1; pass++) {
    const added = derived.filter(c => !good.has(c.id) && c.outletCellId !== null && good.has(c.outletCellId)).map(c => c.id).sort();
    if (!added.length) break;
    layers.push(added); for (const id of added) good.add(id);
  }
  const delivered = good.has(sourceCellId), visited = new Set(), pathCellIds = [], edges = [];
  let current = sourceCellId, status = null, stopCellId = null;
  for (let count = 0; count < cells.length; count++) {
    insist(!visited.has(current), 'Diagnostic entered a repeated node without its closing edge');
    visited.add(current); pathCellIds.push(current);
    if (current === moldCellId) { status = 'delivered'; stopCellId = current; break; }
    const row = byId.get(current);
    if (row.outletCellId === null) { status = 'blocked'; stopCellId = current; break; }
    edges.push({ fromId: current, toId: row.outletCellId, direction: row.outletDirection });
    if (visited.has(row.outletCellId)) { status = 'loop'; stopCellId = row.outletCellId; break; }
    current = row.outletCellId;
  }
  insist(status !== null && pathCellIds.length <= cells.length && edges.length <= cells.length, 'Finite graph diagnostic exceeded the proof bound');
  insist(delivered === (status === 'delivered'), 'Reverse reachability and bounded path certificate disagree');
  const matchedCells = derived.filter(c => c.recipeMet).length, allRecipesMet = matchedCells === cells.length;
  const neighborPairs = derived.flatMap(c => c.neighborIds.filter(id => c.id < id).map(id => [c.id, id])).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return { cells: derived, tiles: tiles.map(t => ({ id: t.id, material: t.material, cellId: cells[arrangement.indexOf(t.id)].id })),
    sourceCellId, moldCellId, materialCounts, matchedCells, allRecipesMet, goalReady: allRecipesMet && delivered,
    heat: { status, delivered, pathCellIds, edges, stopCellId, hops: edges.length },
    certificate: { method: 'reverse-predecessor-fixed-point', reverseReachableCellIds: [...good].sort(), fixedPointLayers: layers,
      fixedPointRounds: layers.length - 1, neighborPairs, distinctCellBound: cells.length, directedEdgeBound: cells.length,
      diagnosticAgreesWithReverseReachability: true } };
}

/** Small synthetic public fixtures only. No production model, gameplay, solver routes, or authored layouts. */
export function runSyntheticFixtures() {
  const checks = [], counts = { deriveCalls: 0, assertions: 0, rejectedInputs: 0, maximumCells: 0 };
  const assert = (yes, message) => { counts.assertions++; insist(yes, message); };
  const derive = (board, assignment) => { counts.deriveCalls++; counts.maximumCells = Math.max(counts.maximumCells, board.cells.length); return deriveForge(board, assignment); };
  const clone = value => JSON.parse(JSON.stringify(value));
  const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const item of Object.values(value)) freeze(item); Object.freeze(value); } return value; };
  const make = (coords, metals, source = 0, mold = coords.length - 1, required = {}) => ({
    cells: coords.map(([q, r], i) => ({ id: `C${i + 1}`, q, r, role: i === source ? 'source' : i === mold ? 'mold' : null, tileId: `T${i + 1}` })),
    tiles: metals.map((material, i) => ({ id: `T${i + 1}`, material, cellId: `C${i + 1}` })),
    materials: IDS.map(id => ({ id, neighborMaterial: TARGET[id], requiredCount: required[id] ?? 1, heatTarget: TARGET[id] })),
    sourceCellId: `C${source + 1}`, moldCellId: `C${mold + 1}`,
  });
  const group = (name, scope, body) => { const detail = body(); checks.push({ name, passed: true, scope, ...detail }); };
  const triangle = () => make([[0, 0], [1, 0], [0, 1]], ['copper', 'iron', 'silver'], 0, 1);
  const ring = () => make([[0, 0], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]], ['copper', 'iron', 'silver', 'copper', 'iron', 'silver', 'iron'], 0, 1);
  group('cube-neighbors-and-world-orientations', 'Only this named seven-cell ring has degrees 6/3 and 12 edges; no universal footprint assumption.', () => {
    const board = ring(), result = derive(board);
    assert(same(result.cells[0].neighborByDirection, ['C2', 'C3', 'C4', 'C5', 'C6', 'C7']), 'Six world directions differ');
    assert(result.cells[0].neighborIds.length === 6 && result.cells.slice(1).every(c => c.neighborIds.length === 3), 'Named ring degrees differ');
    assert(result.certificate.neighborPairs.length === 12, 'Named ring edge count differs');
    for (let i = 1; i <= 6; i++) assert(directionOf(board.cells[0], board.cells[i]) === i - 1 && directionOf(board.cells[i], board.cells[0]) === (i + 2) % 6, 'Opposite world direction differs');
    assert(!cubeAdjacent(board.cells[0], board.cells[0]) && directionOf(board.cells[0], board.cells[0]) === null, 'Zero vector became a neighbor/direction');
    assert(!cubeAdjacent({ q: 0, r: 0 }, { q: 1, r: 1 }), 'Axial diagonal at cube distance two became adjacent');
    return { degreeSequence: result.cells.map(c => c.neighborIds.length), undirectedEdges: 12, directionLabels: [...LABELS] };
  });
  group('irregular-boundaries-and-missing-cells', 'Five-cell asymmetric/disconnected mathematical shape, not a selected authored board.', () => {
    const result = derive(make([[0, 0], [1, 0], [2, 0], [0, 1], [3, 3]], ['copper', 'iron', 'silver', 'iron', 'silver']));
    assert(same(result.cells.map(c => c.neighborIds.length), [2, 3, 1, 2, 0]), 'Irregular neighbor degrees differ');
    assert(result.certificate.neighborPairs.length === 4 && result.cells[4].neighborByDirection.every(id => id === null), 'Missing edge was wrapped or clamped');
    for (const row of result.cells) {
      assert(new Set(row.neighborIds).size === row.neighborIds.length && !row.neighborIds.includes(row.id), 'Neighbor duplicated or counted itself');
      assert(Object.values(row.neighborCounts).reduce((a, b) => a + b, 0) === row.neighborIds.length, 'Material counts do not conserve actual degree');
      for (const id of row.neighborIds) assert(result.cells.find(c => c.id === id).neighborIds.includes(row.id), 'Undirected adjacency is asymmetric');
    }
    return { degreeSequence: [2, 3, 1, 2, 0], undirectedEdges: 4 };
  });
  group('first-matching-direction-is-not-route-optimization', 'Zero-count recipes are explicit synthetic domain boundaries, not authored-level feasibility claims.', () => {
    const result = derive(make([[0, 0], [1, 0], [0, 1]], ['copper', 'iron', 'iron'], 0, 2, { copper: 2, iron: 0, silver: 0 }));
    assert(result.cells[0].outletCellId === 'C2' && result.cells[0].outletDirection === 0, 'Lower-priority reachable sink replaced the first matching outlet');
    assert(result.cells[0].neighborByDirection[1] === 'C3', 'Later matching mold witness missing');
    assert(result.allRecipesMet && !result.goalReady && result.heat.status === 'blocked' && result.heat.stopCellId === 'C2', 'All local counts incorrectly implied heat acceptance');
    assert(same(result.certificate.reverseReachableCellIds, ['C3']), 'Reverse basin optimized an outlet');
    return { firstOutlet: 'C2', laterMatchingMold: 'C3', allRecipesMet: true, heat: result.heat, goalReady: false };
  });
  group('absorbing-mold-still-needs-its-recipe', 'Absorption is checked before an outgoing edge; sink local recipe remains a separate conjunct.', () => {
    const board = triangle(), result = derive(board);
    assert(result.cells[1].neighborCounts.silver === 1 && result.cells[1].outletCellId === null && result.cells[1].outletDirection === null, 'Mold failed to suppress an otherwise matching outlet');
    assert(same(result.heat.pathCellIds, ['C1', 'C2']) && result.heat.hops === 1 && result.heat.delivered && result.goalReady, 'Mold did not absorb immediately');
    const wrong = clone(board); wrong.materials.find(m => m.id === 'iron').requiredCount = 2;
    const rejected = derive(wrong);
    assert(rejected.heat.delivered && !rejected.cells[1].recipeMet && !rejected.allRecipesMet && !rejected.goalReady, 'Successful heat hid a wrong mold recipe');
    const noOutlet = derive(make([[0, 0], [1, 0]], ['copper', 'iron'], 0, 1));
    assert(noOutlet.heat.delivered && noOutlet.heat.hops === 1, 'Mold required a matching downstream material');
    return { deliveredBeforeOtherwiseCyclicOutlet: true, wrongMoldRecipeRejected: true, blockedDownstreamDoesNotPreventAbsorption: true };
  });
  group('non-source-cycle-closing-edge-certificate', 'A five-cell synthetic graph enters a three-node cycle after leaving the source.', () => {
    const result = derive(make([[-1, 0], [0, 0], [1, 0], [0, 1], [3, 3]], ['copper', 'iron', 'silver', 'copper', 'iron']));
    assert(result.heat.status === 'loop' && result.heat.stopCellId === 'C2' && !result.heat.delivered, 'Only a return-to-source cycle was detected');
    assert(same(result.heat.pathCellIds, ['C1', 'C2', 'C3', 'C4']) && result.heat.hops === 4, 'Cycle repeated a path node or omitted closing edge');
    assert(same(result.heat.edges[3], { fromId: 'C4', toId: 'C2', direction: 4 }), 'Closing edge certificate differs');
    assert(same(result.certificate.reverseReachableCellIds, ['C5']) && result.certificate.diagnosticAgreesWithReverseReachability, 'Cycle entered mold basin');
    return { heat: result.heat, reverseReachableCellIds: result.certificate.reverseReachableCellIds };
  });
  group('exact-counts-and-physical-assignment-permutations', 'Assignment overrides are mathematics, not simulated input swaps or undo evidence.', () => {
    const board = ring(), baseline = derive(board), sameMetal = board.cells.map(c => c.tileId);
    [sameMetal[1], sameMetal[4]] = [sameMetal[4], sameMetal[1]];
    const swapped = derive(board, sameMetal);
    const withoutIdentity = rows => rows.map(({ tileId, ...row }) => row);
    assert(same(withoutIdentity(baseline.cells), withoutIdentity(swapped.cells)) && same(baseline.heat, swapped.heat), 'Equal materials were mistaken for different rules');
    assert(swapped.cells[1].tileId === 'T5' && swapped.cells[4].tileId === 'T2' && swapped.tiles.find(t => t.id === 'T5').cellId === 'C2', 'Identical materials aliased physical tile IDs');
    assert(baseline.cells[0].actualCount === 3 && baseline.cells[0].requiredCount === 1 && !baseline.cells[0].recipeMet, 'Exact recipe degraded to an at-least count');
    const distinct = board.cells.map(c => c.tileId); [distinct[1], distinct[2]] = [distinct[2], distinct[1]];
    const changed = derive(board, distinct);
    assert(same(changed.materialCounts, baseline.materialCounts) && changed.cells[0].outletDirection === 1 && baseline.cells[0].outletDirection === 0, 'Material conservation hid a changed actual outlet');
    assert(same(derive(board, board.cells.map(c => c.tileId)), baseline), 'Exact assignment restoration changed derived facts');
    return { equalMaterialIDsRemainDistinct: true, globalCountsConserved: true, fixedWorldOutletChanged: true, exactRequiredCount: true };
  });
  group('input-order-translation-and-frozen-state-invariance', 'Public array order affects assignment indexing only, never world-direction priority; screen coordinates are unread.', () => {
    const board = ring(), baseline = derive(board), before = JSON.stringify(board);
    for (const c of board.cells) for (const k of ['x', 'y']) Object.defineProperty(c, k, { get() { throw new Error('Screen coordinate read'); }, enumerable: false });
    freeze(board); const frozenResult = derive(board);
    assert(JSON.stringify(board) === before && same(frozenResult, baseline), 'Pure oracle changed or read forbidden screen state');
    const reordered = clone(board); reordered.cells.reverse(); reordered.tiles.reverse(); reordered.materials.reverse();
    const result = derive(reordered);
    const canonical = rows => [...rows].sort((a, b) => a.id.localeCompare(b.id));
    assert(same(canonical(result.cells), canonical(baseline.cells)) && same(result.heat, baseline.heat) && same(result.certificate, baseline.certificate), 'Array order changed graph/priority');
    const ids = board.cells.map(c => c.tileId); [ids[1], ids[2]] = [ids[2], ids[1]];
    const byCell = new Map(board.cells.map((c, i) => [c.id, ids[i]]));
    const override = derive(reordered, reordered.cells.map(c => byCell.get(c.id)));
    assert(same(canonical(override.cells), canonical(derive(board, ids).cells)), 'Override was not interpreted in current cells order');
    const translated = clone(board); for (const c of translated.cells) { c.q += 23; c.r -= 19; }
    assert(same(derive(translated), baseline), 'Integer translation changed axial geometry');
    return { deeplyFrozenInputUnchanged: true, screenCoordinatesUnread: true, arraysReorderedWithoutSemanticChange: true, assignmentOrderExplicit: true, translation: [23, -19] };
  });
  group('domain-role-and-inventory-rejections', 'Invalid public inputs are rejected; no silent correction or invented assignments.', () => {
    const invalid = [];
    const reject = (name, change, override) => {
      const board = triangle(); change(board); let caught = false;
      try { derive(board, override); } catch { caught = true; }
      assert(caught, `Accepted invalid public fixture: ${name}`); counts.rejectedInputs++; invalid.push(name);
    };
    reject('duplicate-cell-id', b => { b.cells[1].id = b.cells[0].id; });
    reject('coincident-axial-cells', b => { b.cells[1].q = 0; b.cells[1].r = 0; });
    reject('fractional-axial-coordinate', b => { b.cells[1].q = 0.5; });
    reject('duplicate-physical-tile-id', b => { b.tiles[1].id = b.tiles[0].id; });
    reject('baseline-location-mismatch', b => { b.tiles[1].cellId = 'C1'; });
    reject('assignment-duplicates-an-id', () => {}, ['T1', 'T1', 'T3']);
    reject('assignment-has-unknown-id', () => {}, ['T1', 'T2', 'not-a-tile']);
    reject('source-equals-mold', b => { b.moldCellId = b.sourceCellId; });
    reject('source-role-id-mismatch', b => { b.sourceCellId = 'C3'; });
    reject('duplicate-source-role', b => { b.cells[2].role = 'source'; });
    reject('unknown-mold-id', b => { b.moldCellId = 'missing'; });
    for (const value of [-1, 1.5, 7, NaN, '1']) reject(`invalid-required-count-${String(value)}`, b => { b.materials[0].requiredCount = value; });
    reject('changed-heat-cycle', b => { b.materials[0].heatTarget = 'silver'; });
    reject('changed-count-neighbor', b => { b.materials[0].neighborMaterial = 'copper'; });
    reject('duplicate-material-id', b => { b.materials[1].id = 'copper'; });
    return { invalidFixtures: invalid };
  });
  return { passed: checks.every(c => c.passed), checks, counts,
    scope: 'Eight bounded synthetic public-mathematics groups only. No production Model, QA pilot, authored board, reference assignment, or gameplay is loaded or executed. No ordinary win, input action, browser, APK, or hardware claim.',
    zeroCountRecipeScope: 'requiredCount=0 appears only in explicitly labelled mathematical boundary fixtures; authored positive recipes and three-board feasibility require the separate main review.' };
}

function cli(argv) {
  const options = new Map();
  for (let i = 0; i < argv.length; i += 2) {
    insist(['--contract', '--output'].includes(argv[i]) && argv[i + 1] && !options.has(argv[i]), 'Usage: oracle.mjs --contract model-contract.md --output report.json');
    options.set(argv[i], resolve(argv[i + 1]));
  }
  insist(options.has('--contract') && options.has('--output'), 'Both --contract and --output are required');
  const script = fileURLToPath(import.meta.url), contract = options.get('--contract'), output = options.get('--output');
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const before = { script: sha(readFileSync(script)), contract: sha(readFileSync(contract)) };
  const startedAt = new Date().toISOString(), review = runSyntheticFixtures();
  const after = { script: sha(readFileSync(script)), contract: sha(readFileSync(contract)) };
  insist(same(before, after), 'Review source/contract changed while fixtures ran');
  const report = { schema: 1, game: 'adjacency-forge', startedAt, finishedAt: new Date().toISOString(), ...review,
    sourceHashes: { script: { path: script, sha256: before.script }, contract: { path: contract, sha256: before.contract } },
    sourceHashesAtStart: before, sourceHashesAtEnd: after, sourceUnchanged: true,
    productionModelImported: false, authoredLayoutsRead: false, browserUsed: false, physicalTvTested: false, physicalPhoneTested: false };
  mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ passed: report.passed, checks: report.checks.length, counts: report.counts, sourceHashes: before, reportSha256: sha(readFileSync(output)) })}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli(process.argv.slice(2));
