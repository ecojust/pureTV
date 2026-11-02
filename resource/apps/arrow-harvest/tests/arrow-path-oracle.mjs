// Independent public mathematics: static single-seed paths, then time-labelled
// occurrence pairs. No production Model, pilot, mutable batch simulator or routes.
const DELTAS = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
const requireFact = (ok, text) => { if (!ok) throw Error(text); };
const copy = value => JSON.parse(JSON.stringify(value));

export function inspectGeometry(board) {
  requireFact(board.grid.rows === 4 && board.grid.cols === 4, 'Expected 4 by 4 public geometry');
  requireFact(board.cells.length === 16, 'Expected sixteen cells');
  const cells = board.cells.map((cell, i) => {
    requireFact(cell.id === `C${i + 1}` && cell.row === Math.floor(i / 4) && cell.col === i % 4, 'Row-major identity');
    requireFact(['source', 'field', 'stop', 'forbidden'].includes(cell.role), 'Known role');
    requireFact(cell.target === (cell.role !== 'forbidden'), 'Every traversable cell is a target');
    requireFact(typeof cell.editable === 'boolean', 'Explicit editability');
    if (['stop', 'forbidden'].includes(cell.role)) requireFact(!cell.editable && cell.initialArrow === null, 'No arrow on terminal/forbidden cell');
    else requireFact(Object.hasOwn(DELTAS, cell.initialArrow), 'Cardinal initial arrow');
    return { id: cell.id, row: cell.row, col: cell.col, role: cell.role, target: cell.target, editable: cell.editable, initialArrow: cell.initialArrow };
  });
  const ids = role => cells.filter(c => c.role === role).map(c => c.id);
  const sourceIds = ids('source'), stopIds = ids('stop'), targetIds = cells.filter(c => c.target).map(c => c.id);
  requireFact(sourceIds.length > 0 && sourceIds.length === stopIds.length, 'One distinct stop per source in this contract');
  return { cells, sourceIds, stopIds, targetIds, forbiddenIds: ids('forbidden'), editableIds: cells.filter(c => c.editable).map(c => c.id) };
}

export function predictByArrivalTimes(board, arrows) {
  const facts = inspectGeometry(board), { cells, sourceIds, targetIds } = facts;
  requireFact(Array.isArray(arrows) && arrows.length === cells.length, 'Complete frozen arrow table');
  const byId = new Map(cells.map(c => [c.id, c])), order = ids => cells.filter(c => ids.has(c.id)).map(c => c.id);
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    requireFact(['source', 'field'].includes(cell.role) ? Object.hasOwn(DELTAS, arrows[i]) : arrows[i] === null, 'Arrow agrees with role');
    if (!cell.editable) requireFact(arrows[i] === cell.initialArrow, 'Fixed arrow unchanged');
  }
  // Paths are computed independently, without asking where any other seed is.
  // Each stops at its own stop, forbidden/outside step, or its first own repeat.
  const paths = sourceIds.map((sourceId, seedIndex) => {
    const seedId = `S${seedIndex + 1}`, visits = [{ seedId, cellId: sourceId, time: 0 }], intents = [];
    const ownSeen = new Set([sourceId]); let current = byId.get(sourceId), stopTime = Infinity, invalidTime = Infinity;
    for (let time = 1; time <= cells.length + 1; time++) {
      const direction = arrows[cells.indexOf(current)], [dr, dc] = DELTAS[direction];
      const toRow = current.row + dr, toCol = current.col + dc;
      const outside = toRow < 0 || toRow >= 4 || toCol < 0 || toCol >= 4;
      const destination = outside ? null : cells[toRow * 4 + toCol];
      intents.push({ seedId, fromId: current.id, direction, toId: destination?.id ?? null, toRow, toCol, outside });
      if (outside || destination.role === 'forbidden') { invalidTime = time; break; }
      visits.push({ seedId, cellId: destination.id, time });
      if (destination.role === 'stop') { stopTime = time; break; }
      if (ownSeen.has(destination.id)) break;
      ownSeen.add(destination.id); current = destination;
    }
    return { seedId, sourceId, visits, intents, stopTime, invalidTime };
  });
  // Two occurrences conflict when the later one would arrive; equal times are
  // the same-wave case. Time-zero source occurrences participate identically.
  const occurrences = paths.flatMap(p => p.visits), duplicateEvents = [];
  for (let i = 0; i < occurrences.length; i++) for (let j = i + 1; j < occurrences.length; j++) {
    const a = occurrences[i], b = occurrences[j];
    if (a.cellId === b.cellId) duplicateEvents.push({ time: Math.max(a.time, b.time), cellId: a.cellId, seeds: [a.seedId, b.seedId] });
  }
  const forbiddenTime = Math.min(...paths.map(p => p.invalidTime));
  const overlapTime = Math.min(Infinity, ...duplicateEvents.map(e => e.time));
  const failureTime = Math.min(forbiddenTime, overlapTime), allStoppedTime = Math.max(...paths.map(p => p.stopTime));
  const endWave = Math.min(failureTime, allStoppedTime);
  requireFact(Number.isInteger(endWave) && endWave >= 1, 'Finite resolution from a finite functional graph');
  const rejected = failureTime <= allStoppedTime;
  const rejectionReason = rejected ? (forbiddenTime <= overlapTime ? 'forbidden' : 'overlap') : null;
  const acceptedThrough = rejected ? endWave - 1 : endWave;
  requireFact(endWave <= targetIds.length - sourceIds.length + 1, 'Natural finite-wave theorem');

  function prefix(through) {
    const committed = occurrences.filter(v => v.time <= through), coverageCounts = cells.map(c => committed.filter(v => v.cellId === c.id).length);
    requireFact(coverageCounts.every(n => n === 0 || n === 1), 'Accepted prefix has no duplicate');
    const seeds = paths.map(p => {
      const steps = Math.min(through, p.stopTime), visit = p.visits.find(v => v.time === steps);
      requireFact(visit, 'Every accepted seed position is on its static path');
      const stopped = p.stopTime <= through;
      return { id: p.seedId, sourceId: p.sourceId, cellId: visit.cellId, status: stopped ? 'stopped' : 'active', steps, stopId: stopped ? visit.cellId : null, stoppedAtWave: stopped ? p.stopTime : null };
    });
    const coveredTargetIds = cells.filter((c, i) => c.target && coverageCounts[i] === 1).map(c => c.id), uncoveredTargetIds = targetIds.filter(id => !coveredTargetIds.includes(id));
    const stoppedSeedCount = seeds.filter(s => s.status === 'stopped').length, allSeedsStopped = stoppedSeedCount === seeds.length;
    const allTargetsCovered = uncoveredTargetIds.length === 0;
    requireFact(coveredTargetIds.length === sourceIds.length + seeds.reduce((n, s) => n + s.steps, 0), 'Conserved visits');
    return { coverageCounts, seeds, coveredTargetIds, uncoveredTargetIds, coveredCount: coveredTargetIds.length, remainingTargetCount: uncoveredTargetIds.length, activeSeedCount: seeds.length - stoppedSeedCount, stoppedSeedCount, allSeedsStopped, allTargetsCovered, goalReady: allSeedsStopped && allTargetsCovered };
  }

  const launch = prefix(0), waves = [];
  for (let time = 1; time <= endWave; time++) {
    const old = prefix(time - 1), intents = paths.filter(p => p.stopTime >= time).map(p => copy(p.intents[time - 1]));
    requireFact(intents.every(Boolean), 'Complete simultaneous intent set');
    const arrivals = cells.flatMap((cell, i) => {
      const seedIds = intents.filter(intent => intent.toId === cell.id).map(intent => intent.seedId);
      return seedIds.length ? [{ cellId: cell.id, seedIds, count: seedIds.length, previousCoverage: old.coverageCounts[i] }] : [];
    });
    const issues = {
      outsideSeedIds: intents.filter(i => i.outside).map(i => i.seedId),
      forbiddenCellIds: arrivals.filter(a => byId.get(a.cellId).role === 'forbidden').map(a => a.cellId),
      revisitedCellIds: arrivals.filter(a => a.previousCoverage === 1).map(a => a.cellId),
      simultaneousCellIds: arrivals.filter(a => a.count > 1).map(a => a.cellId)
    };
    const accepted = time <= acceptedThrough, after = accepted ? prefix(time) : old;
    const wave = { id: time, accepted, failureReason: accepted ? null : rejectionReason, intents, arrivals, issues,
      newlyCoveredIds: accepted ? arrivals.map(a => a.cellId) : [], stoppedSeedIds: accepted ? after.seeds.filter(s => s.stoppedAtWave === time).map(s => s.id) : [] };
    const hasIssues = Object.values(issues).some(ids => ids.length > 0);
    requireFact(hasIssues === !accepted, 'Pair-time classification agrees with complete diagnostics');
    waves.push({ wave, after: { ...after, waveIndex: time, acceptedWaves: accepted ? time : time - 1 } });
  }
  const final = waves.at(-1).after, lostReason = rejectionReason ?? (final.goalReady ? null : 'incomplete');
  const issueCells = new Set([...waves.at(-1).wave.issues.forbiddenCellIds, ...waves.at(-1).wave.issues.revisitedCellIds, ...waves.at(-1).wave.issues.simultaneousCellIds]);
  const offendingSeeds = waves.at(-1).wave.intents.filter(i => i.outside || issueCells.has(i.toId)).map(i => i.seedId);
  const failure = lostReason ? { reason: lostReason, waveIndex: endWave, cellIds: rejected ? order(issueCells) : [], seedIds: rejected ? offendingSeeds : [], missingTargetIds: final.uncoveredTargetIds } : null;
  return { method: 'Independent single-seed paths and pairwise time-labelled occurrences', facts, launch,
    pathLengths: paths.map(p => p.intents.length), earliestForbiddenWave: Number.isFinite(forbiddenTime) ? forbiddenTime : null,
    earliestDuplicateWave: Number.isFinite(overlapTime) ? overlapTime : null, waves, final: { ...final, phase: lostReason ? 'lost' : 'won', mode: 'finished', lostReason, failure },
    naturalAttemptBound: targetIds.length - sourceIds.length + 1 };
}
