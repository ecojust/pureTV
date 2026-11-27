export const FIXED_HZ = 60;
export const CAMERA_ORIGIN = [0, 1.62, 5.2];
export const TARGET_SPECS = [
  {x: -4.8, y: 1.35, z: -8.5, radius: 0.46, points: 100, color: 0},
  {x: -1.7, y: 2.65, z: -9.4, radius: 0.38, points: 150, color: 1},
  {x: 0.0, y: 1.62, z: -8.9, radius: 0.44, points: 100, color: 0},
  {x: 4.9, y: 3.05, z: -10.1, radius: 0.32, points: 250, color: 2},
  {x: -5.9, y: 3.65, z: -16.8, radius: 0.42, points: 150, color: 1},
  {x: -3.0, y: 1.45, z: -18.2, radius: 0.36, points: 250, color: 2},
  {x: 0.0, y: 2.9, z: -17.4, radius: 0.48, points: 100, color: 0},
  {x: 3.1, y: 1.7, z: -18.7, radius: 0.38, points: 150, color: 1},
  {x: 5.8, y: 3.8, z: -16.6, radius: 0.34, points: 250, color: 2},
  {x: -5.2, y: 1.6, z: -26.7, radius: 0.40, points: 150, color: 1},
  {x: -2.5, y: 3.6, z: -28.3, radius: 0.31, points: 250, color: 2},
  {x: 0.2, y: 1.35, z: -27.2, radius: 0.43, points: 100, color: 0},
  {x: 2.8, y: 3.05, z: -28.8, radius: 0.34, points: 250, color: 2},
  {x: 5.3, y: 1.85, z: -26.2, radius: 0.39, points: 150, color: 1},
  {x: 0.0, y: 4.65, z: -31.4, radius: 0.30, points: 300, color: 2},
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function targetPositionAtTime(spec, _seconds) {
  return {
    x: spec.x,
    y: spec.y,
    z: spec.z,
  };
}

export function aimDirection(yaw, pitch) {
  const cp = Math.cos(pitch);
  return {
    x: -Math.sin(yaw) * cp,
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * cp,
  };
}

export function raySphereDistance(origin, direction, center, radius, maxDistance) {
  const ox = center.x - origin.x;
  const oy = center.y - origin.y;
  const oz = center.z - origin.z;
  const projected = ox * direction.x + oy * direction.y + oz * direction.z;
  if (projected <= 0 || projected > maxDistance) return -1;
  const perpendicularSq = ox * ox + oy * oy + oz * oz - projected * projected;
  const radiusSq = radius * radius;
  if (perpendicularSq > radiusSq) return -1;
  return projected - Math.sqrt(Math.max(0, radiusSq - perpendicularSq));
}

export function scoreForHit(points, combo) {
  const streak = 1 + Math.min(4, combo - 1) * 0.1;
  return Math.round(points * streak);
}

export function gradeFor(accuracy, elapsed) {
  if (accuracy >= 90 && elapsed <= 35) return 'S';
  if (accuracy >= 80 && elapsed <= 50) return 'A';
  if (accuracy >= 65) return 'B';
  return 'C';
}

function cloneTargets() {
  return TARGET_SPECS.map(function (spec, index) {
    const position = targetPositionAtTime(spec, 0);
    return {
      index: index,
      x: position.x,
      y: position.y,
      z: position.z,
      radius: spec.radius,
      points: spec.points,
      color: spec.color,
      active: true,
      scale: 1,
    };
  });
}

function accuracyFor(hits, shots) {
  return shots > 0 ? Math.round(hits / shots * 100) : 100;
}

function decorate(state) {
  state.remaining = state.targets.filter(function (target) { return target.active; }).length;
  state.targetCount = state.targets.length;
  state.accuracy = accuracyFor(state.hits, state.shots);

}

function initialState(seed, round, reason) {
  const state = {
    phase: 'ready',
    state: 'menu',
    seed: seed,
    round: round,
    resetReason: reason,
    tick: 0,
    elapsed: 0,
    score: 0,
    shots: 0,
    hits: 0,
    combo: 0,
    bestCombo: 0,
    grade: '—',
    lastPoints: 0,
    lastTarget: -1,
    cameraYaw: 0,
    cameraPitch: 0,
    cameraX: CAMERA_ORIGIN[0],
    cameraY: CAMERA_ORIGIN[1],
    cameraZ: CAMERA_ORIGIN[2],
    cameraYawDeg: 0,
    cameraPitchDeg: 0,
    targets: cloneTargets(),
  };
  decorate(state);
  return state;
}

export function createGame(options = {}) {
  const seed = Number(options.seed || 23);
  let state = initialState(seed, 1, 'boot');
  let events = [];

  function emit(type, payload) {
    events.push(Object.assign({type: type}, payload || {}));
  }

  function updateAimDegrees() {
    state.cameraYawDeg = state.cameraYaw * 180 / Math.PI;
    state.cameraPitchDeg = state.cameraPitch * 180 / Math.PI;
  }

  function reset(reason) {
    const why = reason || 'reset';
    const round = why === 'retry' ? state.round + 1 : 1;
    state = initialState(seed, round, why);
    events = why === 'retry' ? [{type: 'game-restarted', round: round}] : [];
  }

  function start() {
    if (state.phase !== 'ready') return;
    state.phase = 'playing';
    decorate(state);
    emit('round-start', {round: state.round});
  }

  function finish() {
    state.phase = 'result';
    state.grade = gradeFor(accuracyFor(state.hits, state.shots), state.elapsed);
    decorate(state);
    emit('round-complete', {
      score: state.score,
      accuracy: state.accuracy,
      grade: state.grade,
    });
  }

  function fire() {
    if (state.phase === 'ready') start();
    if (state.phase !== 'playing') return;
    state.shots += 1;
    emit('shot-fired', {shots: state.shots});

    const origin = {x: state.cameraX, y: state.cameraY, z: state.cameraZ};
    const direction = aimDirection(state.cameraYaw, state.cameraPitch);
    let nearest = null;
    for (let index = 0; index < state.targets.length; index += 1) {
      const target = state.targets[index];
      if (!target.active) continue;
      const distance = raySphereDistance(origin, direction, target, target.radius, 150);
      if (distance >= 0 && (!nearest || distance < nearest.distance)) nearest = {target: target, distance: distance};
    }

    if (!nearest) {
      state.combo = 0;
      decorate(state);
      emit('shot-missed', {shots: state.shots});
      return;
    }

    const target = nearest.target;
    target.active = false;
    target.scale = 0.001;
    state.hits += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.lastPoints = scoreForHit(target.points, state.combo);
    state.lastTarget = target.index;
    state.score += state.lastPoints;
    decorate(state);
    emit('target-hit', {index: target.index, points: state.lastPoints, combo: state.combo});
    emit('score-changed', {score: state.score});
    if (state.remaining === 0) finish();
  }

  function setAim(yaw, pitch) {
    state.cameraYaw = clamp(Number(yaw || 0), -1.15, 1.15);
    state.cameraPitch = clamp(Number(pitch || 0), -0.72, 0.72);
    updateAimDegrees();
  }

  function setCamera(input) {
    const x = Number(input.x);
    const y = Number(input.y);
    const z = Number(input.z);
    if (Number.isFinite(x)) state.cameraX = x;
    if (Number.isFinite(y)) state.cameraY = y;
    if (Number.isFinite(z)) state.cameraZ = z;
    setAim(input.yaw, input.pitch);
  }

  function step() {
    state.tick += 1;
    if (state.phase === 'playing') state.elapsed += 1 / FIXED_HZ;
    const seconds = state.tick / FIXED_HZ;
    for (let index = 0; index < state.targets.length; index += 1) {
      const position = targetPositionAtTime(TARGET_SPECS[index], seconds);
      state.targets[index].x = position.x;
      state.targets[index].y = position.y;
      state.targets[index].z = position.z;
    }
    decorate(state);
  }

  return {
    reset: reset,
    dispatch: function (input) {
      const action = input || {};
      if (action.type === 'start') start();
      else if (action.type === 'set-aim') setAim(action.yaw, action.pitch);
      else if (action.type === 'set-camera') setCamera(action);
      else if (action.type === 'fire') fire();
      else if (action.type === 'reset') reset(action.reason || 'reset');
    },
    step: step,
    snapshot: function () { return JSON.parse(JSON.stringify(state)); },
    drainEvents: function () {
      const drained = events;
      events = [];
      return drained;
    },
  };
}
