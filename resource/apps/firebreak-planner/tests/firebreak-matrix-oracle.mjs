// Public-contract arithmetic only. No production model/controller imports.
export const STEP_TICKS = 120;
export const DIRECTIONS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
export const LEVELS = [
  { ap: 2, cursor: { column: 3, row: 3 }, ignitions: [[3, 3, 16]],
    map: ['..FFFFVFF', '...F.....', '...F.....', 'FFFX~....', '...F.....', '...F.....', 'FFFFFFFFF'],
    weather: [{ from: 1, direction: 'N' }, { from: 3, direction: 'W' }, { from: 7, direction: 'S' }, { from: 11, direction: 'E' }] },
  { ap: 3, cursor: { column: 4, row: 4 }, ignitions: [[4, 4, 20]],
    map: ['..FFFFVFF', '....F....', '....F....', '....F....', 'FFFFXFFFV', '....F....', '....F....', '....F....', 'FFFFFFFFF'],
    weather: [{ from: 1, direction: 'E' }, { from: 4, direction: 'N' }, { from: 7, direction: 'W' }, { from: 13, direction: 'S' }] },
  { ap: 3, cursor: { column: 4, row: 4 }, ignitions: [[4, 4, 24], [1, 1, 12]],
    map: ['.~..F..FF', '~X~.F.~..', '.~..F....', '....F....', 'VFFFXFFFF', '....F..FF', '....F..FF', '....F..FF', '..FFVFFFF'],
    weather: [{ from: 1, direction: 'S' }, { from: 4, direction: 'E' }, { from: 7, direction: 'N' }, { from: 13, direction: 'W' }] },
];
export const mutable = cell => ({ status: cell.status, heat: cell.heat, fuelRemaining: cell.fuelRemaining });
export function authoredCells(level) {
  const columns = level.map[0].length;
  return level.map.flatMap((line, row) => [...line].map((symbol, column) => {
    const terrain = symbol === 'F' || symbol === 'X' ? 'forest' : symbol === 'V' ? 'village' : symbol === '~' ? 'wetland' : 'ground';
    const initialFuel = symbol === 'X' ? level.ignitions.find(([x, y]) => x === column && y === row)[2] : symbol === 'F' ? 3 : 0;
    return { id: 'C' + (row * columns + column), row, column, terrain, initialFuel,
      status: symbol === 'X' ? 'burning' : symbol === 'F' ? 'standing' : symbol === 'V' ? 'intact' : 'inert',
      heat: symbol === 'X' ? 5 : 0, fuelRemaining: initialFuel };
  }));
}
export function windAt(level, step) {
  return level.weather.filter(segment => segment.from <= step).at(-1).direction;
}

// Rows are targets; columns are sources. Weights depend only on geometry and
// the wind. Eligibility and old-burning masks are applied during multiplication.
export function influenceMatrix(columns, rows, wind) {
  const [wx, wy] = DIRECTIONS[wind], count = columns * rows;
  return Array.from({ length: count }, (_, target) => Array.from({ length: count }, (_, source) => {
    const dx = target % columns - source % columns;
    const dy = Math.floor(target / columns) - Math.floor(source / columns);
    return Math.abs(dx) + Math.abs(dy) === 1 ? 2 + dx * wx + dy * wy : 0;
  }));
}
function direction(from, to) {
  return Object.entries(DIRECTIONS).find(([, [dx, dy]]) => to.column - from.column === dx && to.row - from.row === dy)[0];
}
export function wave(oldCells, matrix, wind, step) {
  const oldFire = oldCells.map(cell => cell.status === 'burning' ? 1 : 0);
  const eligible = oldCells.map(cell => (cell.terrain === 'forest' && cell.status === 'standing') ||
    (cell.terrain === 'village' && cell.status === 'intact'));
  const incoming = matrix.map((weights, target) => eligible[target] ? weights.reduce((sum, weight, source) => sum + weight * oldFire[source], 0) : 0);
  const cells = oldCells.map((cell, i) => {
    const next = { ...cell };
    if (eligible[i] && incoming[i]) {
      next.heat = Math.min(5, cell.heat + incoming[i]);
      if (next.heat === 5) next.status = cell.terrain === 'forest' ? 'burning' : 'destroyed';
      // Newly ignited forest retains its complete fuel and is absent from oldFire.
    }
    if (oldFire[i]) {
      next.fuelRemaining = cell.fuelRemaining - 1;
      if (next.fuelRemaining === 0) { next.status = 'burnt'; next.heat = 0; }
    }
    return next;
  });
  const contributions = [];
  eligible.forEach((allowed, target) => {
    if (allowed) matrix[target].forEach((weight, source) => {
      if (weight && oldFire[source]) contributions.push({ from: oldCells[source].id, to: oldCells[target].id,
        direction: direction(oldCells[source], oldCells[target]), amount: weight });
    });
  });
  const ids = predicate => cells.filter((cell, i) => predicate(cell, oldCells[i], i)).map(cell => cell.id);
  const lastWave = {
    step, fromTick: step * STEP_TICKS - 1, toTick: step * STEP_TICKS, previousWaveTick: (step - 1) * STEP_TICKS, wind,
    oldBurningIds: ids((cell, old, i) => Boolean(oldFire[i])), contributions,
    changes: cells.flatMap((cell, i) => oldFire[i] || incoming[i] ? [{ id: cell.id, before: mutable(oldCells[i]), after: mutable(cell), addedHeat: incoming[i] }] : []),
    ignitedIds: ids((cell, old) => old.status === 'standing' && cell.status === 'burning'),
    burntOutIds: ids((cell, old) => old.status === 'burning' && cell.status === 'burnt'),
    destroyedVillageIds: ids((cell, old) => old.status === 'intact' && cell.status === 'destroyed'),
    fuelConsumed: oldFire.reduce((sum, value) => sum + value, 0),
  };
  return { cells, lastWave };
}
export function counts(cells, burned, clearedFuel, apInitial, spent) {
  const forestCells = cells.filter(cell => cell.terrain === 'forest');
  const villageCells = cells.filter(cell => cell.terrain === 'village');
  const forest = { initial: forestCells.length, minimum: Math.floor((7 * forestCells.length + 9) / 10), numerator: 7, denominator: 10,
    ...Object.fromEntries(['standing', 'burning', 'burnt', 'cleared'].map(status => [status, forestCells.filter(cell => cell.status === status).length])) };
  const villages = { initial: villageCells.length, intact: villageCells.filter(cell => cell.status === 'intact').length,
    destroyed: villageCells.filter(cell => cell.status === 'destroyed').length };
  const initial = cells.reduce((sum, cell) => sum + cell.initialFuel, 0), remaining = cells.reduce((sum, cell) => sum + cell.fuelRemaining, 0);
  return { forest, villages, ap: { initial: apInitial, remaining: apInitial - spent, spent },
    fuel: { initial, remaining, burned, cleared: clearedFuel, error: initial - remaining - burned - clearedFuel } };
}
export function result(counted, tick) {
  const reason = counted.villages.destroyed ? 'village' : counted.forest.standing < counted.forest.minimum ? 'forest' :
    counted.forest.burning === 0 ? 'won' : tick >= 5400 ? 'timeout' : null;
  const phase = reason === 'won' ? 'won' : reason ? 'lost' : 'playing';
  return { reason, phase, lostReason: phase === 'lost' ? reason : null,
    score: phase === 'won' ? 1000 + 10 * counted.forest.standing + 25 * counted.ap.remaining : 0 };
}
