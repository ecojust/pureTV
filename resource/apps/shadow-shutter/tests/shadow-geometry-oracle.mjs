// Public-contract-only algebra. No Model, pilot, clock, filesystem, or gameplay dependency.
export function readParameters(contractText) {
  const section = contractText.split('## Public level data')[1];
  const match = section?.match(/```json\s*\n([\s\S]*?)```/);
  if (!match) throw new Error('Canonical contract must contain fenced Public level data');
  return JSON.parse(match[1]);
}

const integer = value => {
  if (!Number.isSafeInteger(value)) throw new Error('Unsafe/noninteger geometric value');
  return value;
};
const rectangle = r => {
  for (const k of ['x0', 'y0', 'x1', 'y1']) integer(r[k]);
  if (!(r.x0 < r.x1 && r.y0 < r.y1)) throw new Error('Nonpositive rectangle');
  return r;
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const mod = (n, d) => ((n % d) + d) % d;

function mergedIntervals(intervals) {
  const result = [];
  for (const [left, right] of intervals.sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
    const last = result.at(-1);
    if (last && left <= last[1]) last[1] = Math.max(last[1], right);
    else result.push([left, right]);
  }
  return result;
}

function intervalDifference(a, b) {
  const result = [];
  for (const [left, right] of a) {
    let cursor = left;
    for (const [cutLeft, cutRight] of b) {
      if (cutRight <= cursor) continue;
      if (cutLeft >= right) break;
      if (cutLeft > cursor) result.push([cursor, Math.min(cutLeft, right)]);
      cursor = Math.max(cursor, cutRight);
      if (cursor >= right) break;
    }
    if (cursor < right) result.push([cursor, right]);
  }
  return result;
}

// A shared y partition makes equality independent of the producer's rectangle partition.
// Covering a complete half-open band avoids center/pixel sampling and all floating geometry.
function sweep(a, b, operation) {
  const all = [...a, ...b].map(rectangle);
  const ys = [...new Set(all.flatMap(r => [r.y0, r.y1]))].sort((x, y) => x - y);
  const bands = [];
  for (let i = 1; i < ys.length; i++) {
    const y0 = ys[i - 1], y1 = ys[i];
    const intervals = region => mergedIntervals(region.filter(r => r.y0 <= y0 && r.y1 >= y1).map(r => [r.x0, r.x1]));
    const left = intervals(a), right = intervals(b);
    let spans;
    if (operation === 'union') spans = mergedIntervals([...left, ...right]);
    else if (operation === 'difference') spans = intervalDifference(left, right);
    else if (operation === 'intersection') spans = intervalDifference(left, intervalDifference(left, right));
    else if (operation === 'xor') spans = mergedIntervals([...intervalDifference(left, right), ...intervalDifference(right, left)]);
    else throw new Error('Unknown region operation');
    if (!spans.length) continue;
    const previous = bands.at(-1);
    if (previous?.y1 === y0 && same(previous.spans, spans)) previous.y1 = y1;
    else bands.push({y0, y1, spans});
  }
  return bands.flatMap(b => b.spans.map(([x0, x1]) => ({x0, y0: b.y0, x1, y1: b.y1})));
}

export const regionUnion = regions => sweep(regions.flat(), [], 'union');
export const regionIntersection = (a, b) => sweep(a, b, 'intersection');
export const regionDifference = (a, b) => sweep(a, b, 'difference');
export const regionEqual = (a, b) => sweep(a, b, 'xor').length === 0;
export const regionContained = (a, b) => regionDifference(a, b).length === 0;
export const translateRegion = (region, x, y) => region.map(r => rectangle({x0: r.x0 + x, y0: r.y0 + y, x1: r.x1 + x, y1: r.y1 + y}));
export const area = region => regionUnion([region]).reduce((total, r) => integer(total + integer((r.x1 - r.x0) * (r.y1 - r.y0))), 0);

export function validatePublishedRegion(region) {
  region.forEach(rectangle);
  for (let i = 0; i < region.length; i++) {
    if (i) {
      const a = region[i - 1], b = region[i];
      const delta = a.y0 - b.y0 || a.x0 - b.x0 || a.y1 - b.y1 || a.x1 - b.x1;
      if (delta > 0) throw new Error('Unsorted published region');
    }
    for (let j = 0; j < i; j++) {
      const a = region[i], b = region[j];
      if (Math.max(a.x0, b.x0) < Math.min(a.x1, b.x1) && Math.max(a.y0, b.y0) < Math.min(a.y1, b.y1)) throw new Error('Overlapping published partition');
    }
  }
  return region;
}

function actorRegion(parameters, actor, originX, originY, mirrorX) {
  const unit = parameters.geometry.unitsPerCell;
  return regionUnion([actor.cells.map(([x, y]) => {
    const column = mirrorX ? actor.widthCells - 1 - x : x;
    return {x0: originX + column * unit, y0: originY + y * unit, x1: originX + (column + 1) * unit, y1: originY + (y + 1) * unit};
  })]);
}

export function apertureAt(parameters, mode, centerX2, centerY2) {
  const [widthCells, heightCells] = parameters.aperture.modes.find(item => item.id === mode).sizeCells;
  const unit = parameters.geometry.unitsPerCell;
  const x0 = integer((centerX2 - widthCells) * unit / 2), y0 = integer((centerY2 - heightCells) * unit / 2);
  return {mode, centerX2, centerY2, widthCells, heightCells, rect: {x0, y0, x1: x0 + widthCells * unit, y1: y0 + heightCells * unit}};
}

export function moveAperture(parameters, before, direction, toggle) {
  const offset = {left: [-2, 0], right: [2, 0], up: [0, -2], down: [0, 2], none: [0, 0]}[direction ?? 'none'];
  if (!offset) throw new Error('Unknown navigation token');
  const clamp = (mode, x, y) => {
    const [w, h] = parameters.aperture.modes.find(item => item.id === mode).sizeCells;
    const [worldW, worldH] = parameters.geometry.worldSizeCells;
    return apertureAt(parameters, mode, Math.max(w, Math.min(worldW * 2 - w, x)), Math.max(h, Math.min(worldH * 2 - h, y)));
  };
  const afterNavigation = clamp(before.mode, before.centerX2 + offset[0], before.centerY2 + offset[1]);
  const mode = toggle ? parameters.aperture.modes.find(item => item.id !== before.mode).id : before.mode;
  return {afterNavigation, afterB: clamp(mode, afterNavigation.centerX2, afterNavigation.centerY2)};
}

export function targetsFor(parameters, scenario) {
  const unit = parameters.geometry.unitsPerCell;
  return scenario.poses.map((pose, targetIndex) => {
    const [widthCells, heightCells] = parameters.aperture.modes.find(mode => mode.id === pose.mode).sizeCells;
    const actors = scenario.actors.map(actor => {
      const placement = pose.parts[actor.id];
      return {id: actor.id, localRects: actorRegion(parameters, actor, placement.originCells[0] * unit, placement.originCells[1] * unit, placement.mirrorX)};
    });
    return {targetIndex, targetId: pose.id, name: pose.name, mode: pose.mode, widthCells, heightCells, actors, unionRects: regionUnion(actors.map(actor => actor.localRects))};
  });
}

export function sceneAt(parameters, scenario, tick) {
  integer(tick);
  const unit = parameters.geometry.unitsPerCell, motion = parameters.motion;
  const motionPhaseTick = mod(tick + scenario.phaseOffsetTicks, motion.periodTicks);
  const segmentIndex = motion.segments.findIndex(s => s.fromPhaseTick <= motionPhaseTick && motionPhaseTick < s.toPhaseTick);
  const segment = motion.segments[segmentIndex], age = motionPhaseTick - segment.fromPhaseTick;
  const origin = (pose, id) => pose.stageOriginCells.map((coordinate, axis) => (coordinate + pose.parts[id].originCells[axis]) * unit);
  const interpolate = (from, to, n, duration) => from.map((value, axis) => integer(value + integer((to[axis] - value) / duration) * n));
  const actors = scenario.actors.map(actor => {
    let xy, mirrorX;
    if (segment.kind === 'translate') {
      const from = scenario.poses[segment.fromPose], to = scenario.poses[segment.toPose];
      const duration = segment.toPhaseTick - segment.fromPhaseTick;
      xy = interpolate(origin(from, actor.id), origin(to, actor.id), age, duration);
      mirrorX = (age < duration / 2 ? from : to).parts[actor.id].mirrorX;
    } else {
      const pose = scenario.poses[segment.pose];
      xy = origin(pose, actor.id); mirrorX = pose.parts[actor.id].mirrorX;
    }
    const [originX, originY] = xy;
    return {id: actor.id, depth: parameters.geometry.depthOrder.indexOf(actor.id), originX, originY, mirrorX, widthCells: actor.widthCells, heightCells: actor.heightCells, worldRects: actorRegion(parameters, actor, originX, originY, mirrorX)};
  });
  const stripOrigin = (pose, exit) => {
    const height = parameters.aperture.modes.find(mode => mode.id === pose.mode).sizeCells[1];
    return [pose.stageOriginCells[0] * unit, (pose.stageOriginCells[1] + (exit ? height + 1 : 1)) * unit];
  };
  let stripXY;
  if (segment.kind === 'translate') stripXY = interpolate(stripOrigin(scenario.poses[segment.fromPose], true), stripOrigin(scenario.poses[segment.toPose], false), age, segment.toPhaseTick - segment.fromPhaseTick);
  else {
    const pose = scenario.poses[segment.pose], duration = motion.occluder.dwellExitTravelTicks;
    stripXY = interpolate(stripOrigin(pose, false), stripOrigin(pose, true), Math.min(age, duration), duration);
  }
  const [originX, originY] = stripXY, [w, h] = motion.occluder.sizeCells;
  const strip = {id: motion.occluder.id, depth: parameters.geometry.depthOrder.indexOf(motion.occluder.id), originX, originY, worldRect: {x0: originX, y0: originY, x1: originX + w * unit, y1: originY + h * unit}};
  return {motionPhaseTick, segmentIndex, actors, strip};
}

export function evaluateCapture(parameters, scene, aperture, target) {
  const unit = parameters.geometry.unitsPerCell, [width, height] = parameters.geometry.worldSizeCells;
  const world = [{x0: 0, y0: 0, x1: width * unit, y1: height * unit}];
  const local = region => translateRegion(region, -aperture.rect.x0, -aperture.rect.y0);
  const actorChecks = scene.actors.map((actor, index) => {
    const worldRects = actor.worldRects;
    const blockers = regionUnion([...scene.actors.slice(index + 1).map(item => item.worldRects), [scene.strip.worldRect]]);
    const clipped = regionIntersection(regionIntersection(worldRects, world), [aperture.rect]);
    const visibleWorldRects = regionDifference(clipped, blockers);
    const outsideWorldRects = regionDifference(worldRects, world), outsideApertureRects = regionDifference(worldRects, [aperture.rect]);
    const occludedWorldRects = regionIntersection(worldRects, blockers);
    const localRawRects = local(worldRects), expectedLocalRects = target.actors.find(item => item.id === actor.id).localRects;
    return {id: actor.id, worldRects, localRawRects, visibleWorldRects, visibleLocalRects: local(visibleWorldRects), outsideWorldRects, outsideApertureRects, occludedWorldRects, expectedLocalRects,
      insideWorld: outsideWorldRects.length === 0, insideAperture: outsideApertureRects.length === 0, unoccluded: occludedWorldRects.length === 0,
      fullVisible: regionEqual(visibleWorldRects, worldRects), registered: regionEqual(localRawRects, expectedLocalRects)};
  });
  const exposureLocalRects = regionUnion(actorChecks.map(actor => actor.visibleLocalRects));
  const modeMatches = aperture.mode === target.mode, allFullyVisible = actorChecks.every(actor => actor.fullVisible), allRegistered = actorChecks.every(actor => actor.registered);
  const exposureEqualsTarget = regionEqual(exposureLocalRects, target.unionRects);
  const matched = modeMatches && allFullyVisible && allRegistered && exposureEqualsTarget;
  const reason = !modeMatches ? 'wrong_frame_mode' : actorChecks.some(a => !a.insideWorld || !a.insideAperture) ? 'required_piece_clipped' : actorChecks.some(a => !a.unoccluded) ? 'required_piece_occluded' : !allRegistered ? 'component_registration_mismatch' : !exposureEqualsTarget ? 'exposure_mismatch' : 'matched';
  return {actorChecks, exposureLocalRects, modeMatches, allFullyVisible, allRegistered, exposureEqualsTarget, matched, reason};
}

export function previewAt(parameters, scene, aperture, target, tick) {
  if (!target) return null;
  const result = evaluateCapture(parameters, scene, aperture, target);
  const {modeMatches, allFullyVisible, allRegistered, exposureEqualsTarget, matched, reason} = result;
  return {tick, activeTargetIndex: target.targetIndex, activeTargetId: target.targetId, actors: result.actorChecks.map(({id, fullVisible, registered}) => ({id, fullVisible, registered})), modeMatches, allFullyVisible, allRegistered, exposureEqualsTarget, matched, reason};
}
