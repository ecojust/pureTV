// Independent public-contract algebra; no Model, pilot, filesystem or simulation entry.
export function readParameters(text) {
  const json = text.match(/```json\s*\n([\s\S]*?)```/);
  if (!json) throw new Error('Missing canonical public JSON');
  return JSON.parse(json[1]);
}

const integer = value => {
  if (!Number.isSafeInteger(value)) throw new Error('Noninteger or unsafe public arithmetic');
  return value;
};
export const mod = (value, length) => ((value % length) + length) % length;

// The sign changes the count of crossed multiples, not the nonnegative position modulo.
// For v<0, reaching x=0 is still generation g; the next strictly negative raw endpoint wraps.
export function beltAt(initialX, velocity, tick, length) {
  const unwrapped = integer(initialX + integer(velocity * tick));
  const quotient = Math.floor(unwrapped / length);
  return {x: mod(unwrapped, length), generation: velocity < 0 ? Math.abs(quotient) : quotient};
}

export function generationStart(initialX, velocity, generation, length) {
  if (generation === 0) return 0;
  if (velocity > 0) return Math.ceil((generation * length - initialX) / velocity);
  if (velocity < 0) return Math.floor((initialX + (generation - 1) * length) / -velocity) + 1;
  throw new Error('A stationary belt cannot create a later generation');
}

export function motionAt(item, velocity, fromTick, length) {
  const before = beltAt(item.initialX, velocity, fromTick, length), after = beltAt(item.initialX, velocity, fromTick + 1, length);
  return {id: item.id, generationBefore: before.generation, generationAfter: after.generation,
    fromX: before.x, rawToX: integer(before.x + velocity), toX: after.x, velocity, wrapped: after.generation !== before.generation};
}

// Enumerate only algebraic wrap events, not every mechanical tick.
export function wrapCalendar(parameters, scenario, untilTick) {
  const length = parameters.geometry.trackLengthUnits, result = [];
  for (const [belt, items, velocity, beltOrder] of [['source', scenario.sourceCarriers, scenario.sourceVelocity, 0], ['target', scenario.targetSlots, scenario.targetVelocity, 1]]) {
    items.forEach((item, itemOrder) => {
      const lastGeneration = beltAt(item.initialX, velocity, untilTick, length).generation;
      for (let generation = 1; generation <= lastGeneration; generation++) {
        const endedTick = generationStart(item.initialX, velocity, generation, length);
        result.push({endedTick, belt, carrierId: item.id, beltOrder, itemOrder, generation, motion: motionAt(item, velocity, endedTick - 1, length)});
      }
    });
  }
  return result.sort((a, b) => a.endedTick - b.endedTick || a.beltOrder - b.beltOrder || a.itemOrder - b.itemOrder);
}

export function gripperTimeline(parameters, velocities) {
  const [low, high] = parameters.geometry.gripperXRange, segments = [];
  let x = parameters.geometry.initialGripperX;
  for (let start = 0; start < velocities.length;) {
    const velocity = velocities[start];
    if (![0, parameters.geometry.gripperSpeedUnitsPerTick, -parameters.geometry.gripperSpeedUnitsPerTick].includes(velocity)) throw new Error('Invalid independently derived gripper velocity');
    let end = start + 1;
    while (end < velocities.length && velocities[end] === velocity) end++;
    segments.push({fromTick: start, toTick: end, originX: x, velocity});
    x = Math.max(low, Math.min(high, integer(x + velocity * (end - start))));
    start = end;
  }
  return segments;
}

export function latestAt(entries, tick, key = 'availableTick') {
  let low = 0, high = entries.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (entries[middle][key] <= tick) low = middle + 1;
    else high = middle;
  }
  return low ? entries[low - 1] : null;
}

export function gripperXAt(parameters, segments, tick) {
  const segment = latestAt(segments, tick, 'fromTick');
  if (!segment) return parameters.geometry.initialGripperX;
  if (tick > segment.toTick) throw new Error('Gripper query outside actual input coverage');
  const [low, high] = parameters.geometry.gripperXRange;
  return Math.max(low, Math.min(high, integer(segment.originX + segment.velocity * (tick - segment.fromTick))));
}

export function gateAt(scenario, tick) {
  const phaseTick = mod(tick + scenario.gate.phaseOffsetTicks, scenario.gate.periodTicks);
  return {tick, phaseTick, open: scenario.gate.openFromPhaseTick <= phaseTick && phaseTick < scenario.gate.openUntilPhaseTick, windowXRange: [...scenario.windowXRange]};
}

export function windowFits(parameters, scenario, x) {
  const half = parameters.geometry.partHalfSizeUnits;
  return x - half >= scenario.windowXRange[0] && x + half <= scenario.windowXRange[1];
}

export function nearest(items, x) {
  return [...items].sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0] ?? null;
}

export function dispatchResult(parameters, scenario, tick, x, part, slot) {
  if (!gateAt(scenario, tick).open) return 'shutter_closed';
  if (!windowFits(parameters, scenario, x)) return 'outside_window';
  if (!slot || Math.abs(slot.x - x) > parameters.geometry.placementRadiusUnits) return 'no_slot_in_reach';
  if (slot.occupantPartId !== null) return 'occupied_slot';
  if (part.type !== slot.requiredType) return 'wrong_type';
  if (part.quarterTurns !== slot.requiredQuarterTurns) return 'wrong_orientation';
  return 'seated';
}

export function previewAt(parameters, scenario, tick, gripper, sourceCarriers, targetSlots) {
  const source = nearest(sourceCarriers.filter(item => item.partId !== null), gripper.x), slot = nearest(targetSlots, gripper.x);
  return {tick, gripperX: gripper.x, heldPartId: gripper.heldPartId, gateOpen: gateAt(scenario, tick).open, windowFits: windowFits(parameters, scenario, gripper.x),
    nearestSource: source ? {id: source.id, generation: source.generation, x: source.x, distance: Math.abs(source.x - gripper.x), inReach: Math.abs(source.x - gripper.x) <= parameters.geometry.pickupRadiusUnits, partId: source.partId} : null,
    nearestSlot: slot ? {id: slot.id, generation: slot.generation, x: slot.x, distance: Math.abs(slot.x - gripper.x), inReach: Math.abs(slot.x - gripper.x) <= parameters.geometry.placementRadiusUnits, occupantPartId: slot.occupantPartId, requiredType: slot.requiredType, requiredQuarterTurns: slot.requiredQuarterTurns} : null};
}

export function outcomeAt(scenario, counters, endedTick, faultLimit) {
  const reason = counters.streak >= scenario.requiredStreak ? 'required_streak' : counters.faults >= faultLimit ? 'fault_limit' : endedTick >= scenario.deadlineTick ? 'deadline' : null;
  return reason ? {reason, actionBoundaryTick: reason === 'deadline' ? null : endedTick - 1, endedTick} : null;
}
