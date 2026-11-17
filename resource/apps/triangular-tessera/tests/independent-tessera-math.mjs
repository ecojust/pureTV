// Pure independent oracle. No Model, pilot, authored route, I/O or import-time search.
function need(value, message) { if (!value) throw new Error(message); }
const cross = (a, b, c) => (b.u - a.u) * (c.v - a.v) - (b.v - a.v) * (c.u - a.u);

// Affine lattice coordinates suffice: projection preserves collinearity and overlap.
export function positiveSegmentOverlap(a, b, c, d) {
  if (samePoint(a, b) || samePoint(c, d) || cross(a, b, c) || cross(a, b, d)) return false;
  const key = a.u !== b.u ? 'u' : 'v';
  return Math.min(Math.max(a[key], b[key]), Math.max(c[key], d[key])) >
    Math.max(Math.min(a[key], b[key]), Math.min(c[key], d[key]));
}
function samePoint(a, b) { return a.u === b.u && a.v === b.v; }
function shareBoundary(a, b) {
  return a.some((p, i) => b.some((q, j) => positiveSegmentOverlap(p, a[(i + 1) % 3], q, b[(j + 1) % 3])));
}

export function buildGeometry(vertices, tiles) {
  const vertexMap = new Map(vertices.map(v => [v.id, v]));
  need(vertexMap.size === vertices.length, 'duplicate vertex ID');
  for (const v of vertices) need(Number.isSafeInteger(v.u) && Number.isSafeInteger(v.v), 'noninteger lattice vertex');
  const nodes = [];
  for (const [tileIndex, tile] of tiles.entries()) {
    need(tile.vertexIds.length === 3 && new Set(tile.vertexIds).size === 3, 'tile must have three distinct vertices');
    const vs = tile.vertexIds.map(id => { need(vertexMap.has(id), 'unknown vertex'); return vertexMap.get(id); });
    need(cross(...vs) !== 0, 'degenerate triangle');
    // Coordinates multiplied by three make the centroid exact, without rounding.
    const center = { u: vs.reduce((s, v) => s + v.u, 0), v: vs.reduce((s, v) => s + v.v, 0) };
    for (let slot = 0; slot < 3; slot++) nodes.push({
      id: `${tile.id}@${slot}`, tileId: tile.id, tileIndex, slot,
      polygon: [center, vs[slot], vs[(slot + 1) % 3]].map((p, i) => i ? { u: 3 * p.u, v: 3 * p.v } : { ...p })
    });
  }
  need(new Set(tiles.map(t => t.id)).size === tiles.length, 'duplicate tile ID');
  const adjacency = [], neighbors = nodes.map(() => []);
  for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
    if (!shareBoundary(nodes[a].polygon, nodes[b].polygon)) continue;
    const kind = nodes[a].tileIndex === nodes[b].tileIndex ? 'within-tile' : 'across-tiles';
    adjacency.push({ a, b, kind }); neighbors[a].push(b); neighbors[b].push(a);
  }
  return { nodes, adjacency, neighbors, sharedEdges: adjacency.filter(e => e.kind === 'across-tiles') };
}

export function prepareBoard(board) {
  const colorIds = board.colors.map(c => c.id), sectorMap = new Map(board.sectors.map(s => [s.id, s]));
  need(new Set(colorIds).size === colorIds.length && colorIds.length > 0, 'duplicate or absent colors');
  need(sectorMap.size === board.sectors.length, 'duplicate physical sector ID');
  need(board.sectors.length === board.tiles.length * 3, 'physical sector count');
  for (const s of board.sectors) need(colorIds.includes(s.colorId), 'unknown physical color');
  const geometry = buildGeometry(board.vertices, board.tiles);
  const ownSectorIds = board.tiles.map(t => board.sectors.filter(s => s.tileId === t.id).map(s => s.id));
  need(ownSectorIds.every(ids => ids.length === 3), 'each tile must own exactly three sectors');
  const targetRegions = Object.fromEntries(colorIds.map(id => {
    need(Number.isSafeInteger(board.targetRegions[id]) && board.targetRegions[id] >= 0, 'invalid region target');
    return [id, board.targetRegions[id]];
  }));
  return { geometry, colorIds, sectorMap, sectors: board.sectors, tiles: board.tiles, ownSectorIds, targetRegions };
}

export function evaluateArrangement(p, assignment) {
  need(assignment.length === p.tiles.length, 'tile assignment count');
  for (let t = 0; t < assignment.length; t++) {
    need(assignment[t].length === 3 && new Set(assignment[t]).size === 3, 'physical tile permutation');
    need(assignment[t].every(id => p.ownSectorIds[t].includes(id)), 'physical sector left its tile');
  }
  const ids = assignment.flat(), colors = ids.map(id => p.sectorMap.get(id).colorId), seen = new Set(), components = [];
  const sectorOrder = new Map(p.sectors.map((s, i) => [s.id, i]));
  for (let start = 0; start < ids.length; start++) {
    if (seen.has(start)) continue;
    const members = [], stack = [start]; seen.add(start);
    while (stack.length) {
      const n = stack.pop(); members.push(n);
      for (const next of p.geometry.neighbors[n]) if (!seen.has(next) && colors[next] === colors[start]) {
        seen.add(next); stack.push(next);
      }
    }
    const sectorIds = members.map(n => ids[n]).sort((a, b) => sectorOrder.get(a) - sectorOrder.get(b));
    const tileIds = p.tiles.filter(t => members.some(n => p.geometry.nodes[n].tileId === t.id)).map(t => t.id);
    components.push({ colorId: colors[start], sectorIds, tileIds });
  }
  components.sort((a, b) => p.colorIds.indexOf(a.colorId) - p.colorIds.indexOf(b.colorId) || sectorOrder.get(a.sectorIds[0]) - sectorOrder.get(b.sectorIds[0]));
  const regionCounts = Object.fromEntries(p.colorIds.map(id => [id, components.filter(c => c.colorId === id).length]));
  const matchedEdgeCount = p.geometry.sharedEdges.filter(e => colors[e.a] === colors[e.b]).length;
  const allEdgesMatched = matchedEdgeCount === p.geometry.sharedEdges.length;
  const allRegionsMatched = p.colorIds.every(id => regionCounts[id] === p.targetRegions[id]);
  return { regionCounts, components, matchedEdgeCount, sharedEdgeCount: p.geometry.sharedEdges.length,
    allEdgesMatched, allRegionsMatched, goalReady: allEdgesMatched && allRegionsMatched,
    largestTileSpan: Math.max(0, ...components.map(c => c.tileIds.length)) };
}

// Map each physical source slot to its destination, rather than filter/relabel colors.
export function transform(ids, key) {
  need(ids.length === 3 && (key === 'A' || key === 'B'), 'invalid D3 operation');
  const out = Array(3);
  for (let source = 0; source < 3; source++) out[key === 'A' ? (source + 1) % 3 : (3 - source) % 3] = ids[source];
  return out;
}
export function physicalOrientations(initial) {
  need(initial.length === 3 && new Set(initial).size === 3, 'D3 requires distinct physical identities');
  const states = [{ ids: [...initial], word: '', cost: 0 }], seen = new Set([initial.join('|')]);
  for (let i = 0; i < states.length; i++) for (const key of ['A', 'B']) {
    const ids = transform(states[i].ids, key), signature = ids.join('|');
    if (seen.has(signature)) continue;
    seen.add(signature); states.push({ ids, word: states[i].word + key, cost: states[i].cost + 1 });
  }
  need(states.length === 6, 'D3 group size');
  return states;
}
function colorVariants(p, initial) {
  const groups = new Map();
  for (const orientation of physicalOrientations(initial)) {
    const key = orientation.ids.map(id => p.sectorMap.get(id).colorId).join('|');
    if (!groups.has(key)) groups.set(key, { representative: orientation, physicalOrientations: [] });
    groups.get(key).physicalOrientations.push(orientation);
  }
  return [...groups.values()]; // BFS insertion preserves a minimum-cost exact physical representative.
}
function witness(p, selected, facts) {
  return { assignment: selected.map(v => [...v.representative.ids]), cost: selected.reduce((n, v) => n + v.representative.cost, 0),
    operations: selected.flatMap((v, t) => [...v.representative.word].map(key => ({ tileId: p.tiles[t].id, key }))),
    regionCounts: { ...facts.regionCounts }, matchedEdgeCount: facts.matchedEdgeCount, largestTileSpan: facts.largestTileSpan };
}

// Fixed tile-order Cartesian enumeration: no production solver or CSP pruning.
export function enumeratePublicBoard(board, { maxColorStates = 50000 } = {}) {
  need(Number.isSafeInteger(maxColorStates) && maxColorStates > 0, 'invalid enumeration bound');
  const p = prepareBoard(board), variants = p.tiles.map(t => colorVariants(p, t.slotSectorIds));
  const expectedColorStates = variants.reduce((n, v) => n * v.length, 1);
  need(expectedColorStates <= maxColorStates, 'color state enumeration bound exceeded');
  const counts = { colorStates: 0, physicalStates: 0, goals: 0, goalPhysicalStates: 0, edgeOnly: 0, regionOnly: 0, rotationsOnlyGoals: 0, mirrorsOnlyGoals: 0 };
  let minimumGoal = null, minimumEdgeOnly = null, minimumRegionOnly = null, widestRegion = null;
  const forestResiduals = new Set(), selected = [];
  const internalComponents = p.tiles.reduce((sum, t) => sum + new Set(t.slotSectorIds.map(id => p.sectorMap.get(id).colorId)).size, 0);
  const rotationsOnlyColors = p.tiles.map(t => {
    let ids = [...t.slotSectorIds]; const set = new Set();
    for (let k = 0; k < 3; k++) { set.add(ids.map(id => p.sectorMap.get(id).colorId).join('|')); ids = transform(ids, 'A'); }
    return set;
  });
  const mirrorsOnlyColors = p.tiles.map(t => new Set([t.slotSectorIds, transform(t.slotSectorIds, 'B')]
    .map(ids => ids.map(id => p.sectorMap.get(id).colorId).join('|'))));
  function visit(tileIndex) {
    if (tileIndex < variants.length) {
      for (const v of variants[tileIndex]) { selected.push(v); visit(tileIndex + 1); selected.pop(); }
      return;
    }
    const assignment = selected.map(v => v.representative.ids), facts = evaluateArrangement(p, assignment);
    const multiplicity = selected.reduce((n, v) => n * v.physicalOrientations.length, 1);
    counts.colorStates++; counts.physicalStates += multiplicity;
    forestResiduals.add(Object.values(facts.regionCounts).reduce((a, b) => a + b, 0) - internalComponents + facts.matchedEdgeCount);
    const w = () => witness(p, selected, facts), cost = selected.reduce((n, v) => n + v.representative.cost, 0);
    if (facts.goalReady) {
      counts.goals++; counts.goalPhysicalStates += multiplicity;
      if (!minimumGoal || cost < minimumGoal.cost) minimumGoal = w();
      if (assignment.every((ids, t) => rotationsOnlyColors[t].has(ids.map(id => p.sectorMap.get(id).colorId).join('|')))) counts.rotationsOnlyGoals++;
      if (assignment.every((ids, t) => mirrorsOnlyColors[t].has(ids.map(id => p.sectorMap.get(id).colorId).join('|')))) counts.mirrorsOnlyGoals++;
    }
    if (facts.allEdgesMatched && !facts.allRegionsMatched) {
      counts.edgeOnly++; if (!minimumEdgeOnly || cost < minimumEdgeOnly.cost) minimumEdgeOnly = w();
    }
    if (facts.allRegionsMatched && !facts.allEdgesMatched) {
      counts.regionOnly++; if (!minimumRegionOnly || cost < minimumRegionOnly.cost) minimumRegionOnly = w();
    }
    if (!widestRegion || facts.largestTileSpan > widestRegion.largestTileSpan) widestRegion = w();
  }
  visit(0);
  need(counts.colorStates === expectedColorStates, 'enumeration incomplete');
  need(counts.physicalStates === 6 ** p.tiles.length, 'physical multiplicity incomplete');
  return { counts, internalComponents, forestResiduals: [...forestResiduals].sort((a, b) => a - b),
    minimumGoal, minimumEdgeOnly, minimumRegionOnly, widestRegion,
    geometry: { sectorNodes: p.geometry.nodes.length, internalAdjacencies: p.geometry.adjacency.filter(e => e.kind === 'within-tile').length,
      sharedEdges: p.geometry.sharedEdges.length },
    proofScope: 'Complete public color-state Cartesian product; all physical D3 states counted through exact multiplicities. Witnesses independently derived, not authored routes.' };
}
