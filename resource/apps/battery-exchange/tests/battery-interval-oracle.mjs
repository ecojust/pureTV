// Independent arithmetic from the public contract. No Model/controller imports.
export const CELL_IDS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
export const LOAD_IDS = ['L1', 'L2'];
export const sum = values => values.reduce((total, value) => total + value, 0);

export function readParameters(contract) {
  const marked = contract.split('<!-- BATTERY_PARAMETERS_BEGIN -->')[1]?.split('<!-- BATTERY_PARAMETERS_END -->')[0];
  const json = marked?.match(/```json\s*([\s\S]*?)```/);
  if (!json) throw new Error('Missing public battery parameters');
  return JSON.parse(json[1]);
}

// A Thevenin source gives the terminal current. Parallel branch fractions come
// from conductance, rather than copying a per-cell update from the game.
export function circuit(topology, cellIds, parameters) {
  const resistance = parameters.circuit.loadResistanceOhm, voltage = parameters.simulation.nominalCellVoltageV;
  const cells = cellIds.map(id => parameters.cells.find(cell => cell.id === id));
  if (!['series', 'parallel'].includes(topology) || cellIds.length > 2 || new Set(cellIds).size !== cellIds.length || cells.some(cell => !cell))
    throw new Error('Outside public circuit domain');
  const parallel = topology === 'parallel', conductance = sum(cells.map(cell => 1 / cell.resistanceOhm));
  const internal = cells.length ? (parallel ? 1 / conductance : sum(cells.map(cell => cell.resistanceOhm))) : null;
  const openVoltage = cells.length ? voltage * (parallel ? 1 : cells.length) : 0;
  const current = cells.length ? openVoltage / (resistance + internal) : 0;
  const branches = cells.map(cell => {
    const branchCurrent = parallel ? current / (conductance * cell.resistanceOhm) : current;
    return { cellId: cell.id, voltageV: voltage, resistanceOhm: cell.resistanceOhm, currentA: branchCurrent,
      sourcePowerW: voltage * branchCurrent, heatPowerW: branchCurrent ** 2 * cell.resistanceOhm };
  });
  const source = sum(branches.map(branch => branch.sourcePowerW)), heat = sum(branches.map(branch => branch.heatPowerW));
  const load = resistance * current ** 2;
  return { topology, connected: cells.length > 0, cellIds: cellIds.slice(), loadResistanceOhm: resistance,
    openCircuitVoltageV: openVoltage, internalResistanceOhm: internal,
    parallelConductanceS: cells.length && parallel ? conductance : null,
    currentA: current, terminalVoltageV: resistance * current, sourcePowerW: source,
    loadPowerW: load, internalHeatPowerW: heat, powerBalanceErrorW: source - load - heat, branches };
}

export const deficit = (work, target) => Math.max(0, target - work);
export const done = (work, target, physics) => deficit(work, target) <= physics.workCompletionToleranceJ;
export const inBand = (power, request, physics) => power >= request.minimumPowerW - physics.powerCompareToleranceW &&
  power <= request.maximumPowerW + physics.powerCompareToleranceW;

// Closed form of explicit Euler: theta(n)=a^n theta(0)+(P/K)(1-a^n).
// expm1 preserves the small 1-a^n term. Removed heat is derived from the
// integrated storage balance, not from a second Euler temperature loop.
export function thermal(body, power, count, capacity, conductance, physics) {
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Nonnegative integer interval count required');
  if (!count) return { temperatureC: body.temperatureC, generatedHeatJ: body.generatedHeatJ, removedHeatJ: body.removedHeatJ };
  const theta = body.temperatureC - physics.ambientC;
  const decay = -Math.expm1(count * Math.log1p(-conductance / (physics.tickHz * capacity)));
  const deltaTheta = (power / conductance - theta) * decay;
  const generated = count * power / physics.tickHz;
  return { temperatureC: physics.ambientC + theta + deltaTheta,
    generatedHeatJ: body.generatedHeatJ + generated,
    removedHeatJ: body.removedHeatJ + generated - capacity * deltaTheta };
}

export function cellSpan(cell, branch, count, physics) {
  const current = branch?.currentA || 0, power = branch?.sourcePowerW || 0, heat = branch?.heatPowerW || 0;
  const consumed = cell.consumedChargeC + count * current / physics.tickHz;
  return { ...cell, ...thermal(cell, heat, count, physics.cellThermalCapacityJK, physics.cellConductanceWK, physics),
    consumedChargeC: consumed, remainingChargeC: cell.initialChargeC - consumed,
    sourceEnergyJ: cell.sourceEnergyJ + count * power / physics.tickHz,
    lastCurrentA: current, lastSourcePowerW: power, lastHeatPowerW: heat };
}

// This is a span length, never a control choice. It only determines when the
// constant actual circuit's accepted service first meets the published quota.
export function completionIntervals(work, request, power, physics) {
  if (done(work, request.targetWorkJ, physics)) return 0;
  if (!inBand(power, request, physics) || power <= 0) return Infinity;
  return Math.max(1, Math.ceil((request.targetWorkJ - physics.workCompletionToleranceJ - work) * physics.tickHz / power));
}

export function workSpan(stage, power, count, physics) {
  const good = inBand(power, stage, physics), delivered = count * power / physics.tickHz;
  const credit = good ? Math.min(delivered, deficit(stage.workJ, stage.targetWorkJ)) : 0;
  const work = stage.workJ + credit;
  return { workJ: work, deficitJ: deficit(work, stage.targetWorkJ), deliveredEnergyJ: stage.deliveredEnergyJ + delivered,
    overflowEnergyJ: stage.overflowEnergyJ + (good ? delivered - credit : 0),
    outOfBandEnergyJ: stage.outOfBandEnergyJ + (good ? 0 : delivered),
    goodIntervals: stage.goodIntervals + (good ? count : 0), badIntervals: stage.badIntervals + (good ? 0 : count),
    delta: { deliveredEnergyJ: delivered, creditedWorkJ: credit, overflowEnergyJ: good ? delivered - credit : 0,
      outOfBandEnergyJ: good ? 0 : delivered } };
}

export function schedulePosition(level, tick) {
  for (let i = 0; i < level.stages.length; i++) {
    const [startTick, endTick] = level.windows[i], stage = level.stages[i];
    if (tick >= startTick && tick < endTick) return { index: i * 2, kind: 'window', windowIndex: i, stageIndex: null, startTick, endTick };
    if (tick >= stage.startTick && tick < stage.endTick) return { index: i * 2 + 1, kind: 'supply', windowIndex: null,
      stageIndex: i, startTick: stage.startTick, endTick: stage.endTick };
  }
  return { index: level.stages.length * 2, kind: 'end', windowIndex: null, stageIndex: null, startTick: level.closeTick, endTick: level.closeTick };
}
