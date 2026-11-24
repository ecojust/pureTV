import { TRACKS, makeTrack, sampleTrack, projectTrack, wrapDistance } from './tracks.mjs';

// This is an arcade vehicle model: steering changes the heading, while grip
// determines how quickly the velocity follows it. No player rail-following.
const TAU = Math.PI * 2;
const COLORS = ['#ff713d', '#45e4e0', '#b68bff', '#5a9cff', '#ffce58', '#87e380'];
const NAMES = ['你', '流星', '脉冲', '游隼', '闪电', '北极星'];
const cache = new Map();
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const angle = n => ((n + Math.PI) % TAU + TAU) % TAU - Math.PI;
const approachAngle = (a, b, k) => a + angle(b - a) * k;
const trackFor = id => { if (!cache.has(id)) cache.set(id, makeTrack(id)); return cache.get(id); };
const forwardDelta = (a, b, length) => ((b - a + length * 1.5) % length) - length * .5;
function random(seed) {
  let value = (Number(seed) >>> 0) || 1;
  return () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return (value >>> 0) / 4294967296; };
}

export function create(seed = 1, difficulty = 0) {
  const selected = Number.isFinite(Number(difficulty)) ? Math.trunc(Number(difficulty)) : 0;
  const index = ((selected % TRACKS.length) + TRACKS.length) % TRACKS.length;
  const definition = TRACKS[index];
  const track = trackFor(definition.id);
  const rng = random(seed);
  const cars = Array.from({ length: 6 }, (_, id) => {
    const gridS = -Math.floor(id / 2) * 7 - 9;
    const lateral = id % 2 ? 2.7 : -2.7;
    const p = sampleTrack(track, gridS);
    const x = p.x + Math.cos(p.yaw) * lateral, z = p.z - Math.sin(p.yaw) * lateral;
    return { id, name: NAMES[id], color: COLORS[id], x, y: p.y, z, yaw: p.yaw, velocityYaw: p.yaw,
      speed: 0, steer: 0, slip: 0, progress: gridS, lap: 1, completedLaps: 0, checkpoint: 0, nextGate: 1,
      trackS: wrapDistance(gridS, track.length), lateral, nitro: 100, driftTime: 0, driftGrace: 0, drifting: false,
      boostTime: 0, miniBoostTime: 0, airHeight: 0, airVelocity: 0, finished: false, finishTime: 0,
      collisionFlash: 0, collisionCooldown: 0, jumpTime: 0, stalledTime: 0, safeS: wrapDistance(gridS, track.length),
      safeProgress: gridS, lastX: x, lastZ: z, lastS: wrapDistance(gridS, track.length), cancelEpoch: 0, padVisits: {}, jumpVisits: {},
      skill: .82 + rng() * .12, lane: id === 0 ? 0 : (id % 2 ? 4.4 : -4.4), resetCooldown: 0, driftCounted: false, nitroArmed: true };
  });
  return { phase: 'playing', trackId: track.id, trackIndex: index, seed: Number(seed) >>> 0,
    time: 0, countdown: 3, raceTime: 0, lapTarget: 2, cars, player: cars[0], rank: 1, score: 0,
    message: '自动加速 · 左右转向 · 按住漂移过弯，松开获得小喷', events: [],
    stats: { drifts: 0, nitros: 0, miniBoosts: 0, collisions: 0, jumps: 0 }, finishOrder: [] };
}

function emit(state, car, type, message) {
  if (car.id !== 0) return;
  state.events.push({ type });
  if (message) state.message = message;
}

function resetCar(state, car, track, automatic = false) {
  const point = sampleTrack(track, car.safeS);
  car.x = point.x; car.z = point.z; car.y = point.y;
  car.yaw = car.velocityYaw = point.yaw;
  car.speed = 0; car.steer = 0; car.slip = 0; car.lateral = 0;
  car.airHeight = car.airVelocity = 0; car.boostTime = car.miniBoostTime = 0;
  car.driftTime = 0; car.driftGrace = 0; car.drifting = false; car.driftCounted = false;
  car.progress = Math.min(car.progress, car.safeProgress);
  car.lastS = car.trackS = car.safeS;
  car.lastX = car.x; car.lastZ = car.z;
  car.stalledTime = 0;
  car.resetCooldown = 1.4;
  // A reset has a time/speed cost, never awards a gate, lap or forward distance.
  emit(state, car, 'reset', automatic ? '停滞后自动复位 · 计时继续，圈数不增加' : '赛车已复位 · 圈数与进度不会增加');
}

// Public observation-based controller, useful for the five opponents and for
// keyboard QA. It returns inputs only and never alters the supplied state.
export function aiInput(state, car = state.player) {
  const track = trackFor(state.trackId);
  const look = 12 + car.speed * .62;
  const target = sampleTrack(track, car.trackS + look);
  const lane = car.id === 0 ? 0 : car.lane;
  const tx = target.x + Math.cos(target.yaw) * lane;
  const tz = target.z - Math.sin(target.yaw) * lane;
  const heading = Math.atan2(tx - car.x, tz - car.z);
  const error = angle(heading - car.yaw);
  const x = clamp(error * 2.55 - car.slip * .32, -1, 1);
  const near = sampleTrack(track, car.trackS + 8);
  const further = sampleTrack(track, car.trackS + 44);
  const turn = Math.max(Math.abs(near.curvature || 0), Math.abs(target.curvature || 0), Math.abs(further.curvature || 0));
  const wanted = Math.min(38, Math.sqrt(25 / Math.max(turn, .003))) * (car.id === 0 ? 1 : car.skill);
  const brake = car.speed > wanted + (car.drifting ? 5 : 2) || Math.abs(error) > 1.1;
  return { x, y: brake ? 1 : -1, a: !brake && car.speed > 17 && Math.abs(x) > (car.drifting ? .1 : .23) && Math.abs(x) < .85,
    bPressed: !brake && turn < .006 && Math.abs(error) < .12 && car.nitro >= 100 && car.boostTime <= 0,
    cancelled: false, cancelEpoch: 0 };
}

function pads(state, car, track, beforeS, ds) {
  if (ds <= 0 || ds > car.speed / 6 + 3) return;
  const loop = Math.max(0, Math.floor(car.progress / track.length));
  const enters = pad => {
    const fromStart = wrapDistance(car.trackS - pad.s, track.length);
    const toStart = wrapDistance(pad.s - beforeS, track.length);
    return fromStart <= pad.length || toStart <= ds;
  };
  if (Math.abs(car.lateral) > track.width * .3) return;
  (track.boostPads || []).forEach((pad, index) => {
    const stamp = loop + ':' + index;
    if (car.speed > 8 && !car.padVisits[stamp] && enters(pad)) {
      car.padVisits[stamp] = true;
      car.boostTime = Math.max(car.boostTime, .85);
      emit(state, car, 'boost', '加速带 · 保持方向');
    }
  });
  (track.jumpPads || []).forEach((pad, index) => {
    const stamp = loop + ':' + index;
    if (car.speed > 13 && car.airHeight === 0 && !car.jumpVisits[stamp] && enters(pad)) {
      car.jumpVisits[stamp] = true;
      car.airVelocity = clamp(Number(pad.power) || 7.5, 5, 11);
      car.airHeight = .01; car.jumpTime = 0;
      if (car.id === 0) state.stats.jumps++;
      emit(state, car, 'jump', '腾空！稳住方向，落地获得小喷');
    }
  });
}

function advanceCar(state, car, track, dt, input) {
  if (car.finished) return;
  car.collisionFlash = Math.max(0, car.collisionFlash - dt * 2);
  car.collisionCooldown = Math.max(0, car.collisionCooldown - dt);
  car.resetCooldown = Math.max(0, car.resetCooldown - dt);
  car.boostTime = Math.max(0, car.boostTime - dt);
  car.miniBoostTime = Math.max(0, car.miniBoostTime - dt);

  const epoch = Number(input.cancelEpoch) || 0;
  const cancelled = !!input.cancelled || epoch !== car.cancelEpoch;
  car.cancelEpoch = epoch;
  const steering = cancelled ? 0 : clamp(Number(input.x) || 0, -1, 1);
  const brake = !cancelled && Number(input.y) > .25;
  car.driftGrace = Math.max(0, car.driftGrace - dt);
  const physicalTurn = Math.abs(car.steer) > .16;
  car.drifting = !cancelled && !!input.a && car.speed > 11 && physicalTurn && !brake && car.airHeight < .1;
  if (cancelled) {
    car.driftTime = 0; car.driftGrace = 0; car.driftCounted = false;
    car.nitroArmed = false;
  } else {
    if (!input.b && !input.bPressed) car.nitroArmed = true;
    if (input.bPressed && car.nitroArmed && car.nitro >= 99.99 && car.speed > 4 && car.boostTime < .15) {
      car.nitro = 0; car.boostTime = 2.1; car.nitroArmed = false;
      if (car.id === 0) state.stats.nitros++;
      emit(state, car, 'boost', '氮气释放 · 极速冲刺');
    }
    if (!input.a && car.driftTime >= .42 && car.driftGrace > 0 && !brake) {
      car.miniBoostTime = Math.max(car.miniBoostTime, .7);
      if (car.id === 0) state.stats.miniBoosts++;
      emit(state, car, 'mini', '漂亮漂移 · 松手小喷');
    }
    if (!input.a || brake || car.driftGrace <= 0) { car.driftTime = 0; car.driftCounted = false; }
  }
  if (input.resetPressed && car.resetCooldown <= 0) { resetCar(state, car, track); return; }
  // Detect discontinuities before physics. Normal vehicle motion and collisions
  // cannot move a car twenty metres between ticks; a stale/out-of-bounds state
  // is recovered without letting its projection grant checkpoint progress.
  if (Math.hypot(car.x - car.lastX, car.z - car.lastZ) > 20) { resetCar(state, car, track); return; }

  car.steer += (steering - car.steer) * (1 - Math.exp(-9 * dt));
  const baseTop = Number(input.y) < -.3 ? 38 : 36;
  const top = car.boostTime > 0 ? 52 : car.miniBoostTime > 0 ? 45 : baseTop;
  if (brake) car.speed = Math.max(0, car.speed - 27 * dt);
  else if (car.speed < top) car.speed = Math.min(top, car.speed + (car.boostTime > 0 ? 22 : 12) * dt);
  else car.speed = Math.max(top, car.speed - 7 * dt);
  if (car.drifting) car.speed = Math.max(0, car.speed - Math.abs(car.steer) * 1.2 * dt);
  if (car.resetCooldown > 0) car.speed = Math.min(car.speed, 6);

  const yawRate = car.steer * (.2 + car.speed * .025) * Math.min(1, car.speed / 6) * (car.airHeight > .2 ? .4 : 1);
  car.yaw = angle(car.yaw + yawRate * dt);
  const grip = car.airHeight > .2 ? .6 : car.drifting ? 2.8 : 8.5;
  car.velocityYaw = approachAngle(car.velocityYaw, car.yaw, 1 - Math.exp(-grip * dt));
  car.slip = angle(car.yaw - car.velocityYaw);
  if (car.drifting && Math.abs(car.slip) > .035) {
    car.driftGrace = .45;
    car.driftTime += dt;
    car.nitro = Math.min(100, car.nitro + dt * (16 + Math.min(.5, Math.abs(car.slip)) * 60));
    if (car.driftTime >= .42 && !car.driftCounted) {
      car.driftCounted = true;
      if (car.id === 0) state.stats.drifts++;
      emit(state, car, 'drift', '漂移集气中 · 出弯松手小喷');
    }
  }
  const beforeS = car.trackS;
  car.x += Math.sin(car.velocityYaw) * car.speed * dt;
  car.z += Math.cos(car.velocityYaw) * car.speed * dt;
  let road = projectTrack(track, car.x, car.z, car.trackS);
  const limit = road.width / 2 - 1.1;
  if (Math.abs(road.lateral) > limit) {
    const side = Math.sign(road.lateral);
    car.x = road.x + Math.cos(road.yaw) * side * limit;
    car.z = road.z - Math.sin(road.yaw) * side * limit;
    // The barrier removes normal velocity but never steers the player's body
    // around the next corner. Holding no steering will get stuck at bends.
    const travelDirection = Math.cos(angle(car.velocityYaw - road.yaw)) >= 0 ? road.yaw : road.yaw + Math.PI;
    car.velocityYaw = approachAngle(car.velocityYaw, travelDirection, .65);
    if (car.collisionCooldown <= 0) {
      car.speed *= .58; car.collisionCooldown = .5; car.collisionFlash = 1;
      if (car.id === 0) state.stats.collisions++;
      emit(state, car, 'collision', '护栏碰撞 · 松开漂移，转向回到路中');
    } else car.speed = Math.max(0, car.speed - 30 * dt);
    car.driftTime = 0; car.driftCounted = false; car.drifting = false;
    road = projectTrack(track, car.x, car.z, road.s);
  }
  car.lateral = road.lateral;
  car.trackS = road.s;
  const ds = forwardDelta(beforeS, car.trackS, track.length);
  const plausible = Math.abs(ds) <= car.speed * dt * 2.5 + 2 && Math.abs(road.lateral) <= road.width / 2;
  if (plausible) {
    const previous = car.progress;
    car.progress += ds;
    const gates = track.checkpoints || 8;
    const goal = car.nextGate * track.length / gates;
    if (ds > 0 && previous < goal && car.progress >= goal && Math.cos(angle(car.velocityYaw - road.yaw)) > .2) {
      car.checkpoint = car.nextGate % gates;
      car.nextGate++;
      car.completedLaps = Math.floor((car.nextGate - 1) / gates);
      car.lap = Math.min(state.lapTarget, car.completedLaps + 1);
      if (car.checkpoint === 0) emit(state, car, 'lap', car.completedLaps >= state.lapTarget ? '冲线！比赛完成' : '最后一圈 · 寻找机会超车');
      if (car.completedLaps >= state.lapTarget) {
        car.finished = true; car.finishTime = state.raceTime;
        car.boostTime = car.miniBoostTime = 0; car.drifting = false;
        state.finishOrder.push(car.id);
      }
    }
    if (Math.abs(car.lateral) < road.width * .35 && car.airHeight === 0) { car.safeS = road.s; car.safeProgress = car.progress; }
    pads(state, car, track, beforeS, ds);
  }
  if (car.airHeight > 0 || car.airVelocity > 0) {
    car.jumpTime += dt;
    car.airVelocity -= 18.5 * dt;
    car.airHeight = Math.max(0, car.airHeight + car.airVelocity * dt);
    if (car.airHeight === 0) {
      car.airVelocity = 0;
      if (car.jumpTime > .2 && car.speed > 8) {
        car.miniBoostTime = Math.max(car.miniBoostTime, .55);
        if (car.id === 0) state.stats.miniBoosts++;
        emit(state, car, 'land', '平稳落地 · 落地小喷');
      }
    }
  }
  car.y = road.y + car.airHeight;
  car.stalledTime = car.speed < 2 ? car.stalledTime + dt : 0;
  car.lastX = car.x; car.lastZ = car.z; car.lastS = car.trackS;
  // Every competitor, including the player, gets the same recovery rule. The
  // race clock keeps running and resetCar removes any unsaved forward progress.
  // Resetting the timer is essential: otherwise a stopped car resets forever.
  if (car.stalledTime >= 4 && car.resetCooldown <= 0) resetCar(state, car, track, true);
}

function contacts(state, track) {
  for (let i = 0; i < state.cars.length; i++) for (let j = i + 1; j < state.cars.length; j++) {
    const a = state.cars[i], b = state.cars[j];
    if (a.finished || b.finished || Math.abs(a.y - b.y) > 1.8) continue;
    const dx = a.x - b.x, dz = a.z - b.z, d = Math.hypot(dx, dz);
    if (d >= 2.25) continue;
    const nx = d > .001 ? dx / d : Math.cos(a.yaw), nz = d > .001 ? dz / d : -Math.sin(a.yaw);
    const push = (2.25 - d) * .5;
    a.x += nx * push; a.z += nz * push; b.x -= nx * push; b.z -= nz * push;
    if (a.collisionCooldown <= 0 && b.collisionCooldown <= 0) {
      const faster = a.speed >= b.speed ? a : b;
      faster.speed *= .76;
      a.collisionCooldown = b.collisionCooldown = .4;
      a.collisionFlash = b.collisionFlash = .6;
      if (i === 0) { state.stats.collisions++; emit(state, a, 'collision', '擦碰对手 · 留出超车空间'); }
    }
    a.lastX = a.x; a.lastZ = a.z; b.lastX = b.x; b.lastZ = b.z;
  }
}

export function step(state, dt, input = {}) {
  if (!state || state.phase !== 'playing') return state;
  state.player = state.cars[0];
  dt = clamp(Number(dt) || 0, 0, .1);
  if (dt === 0) return state;
  state.events = [];
  const track = trackFor(state.trackId);
  state.time += dt;
  if (state.countdown > 0) {
    state.countdown = Math.max(0, state.countdown - dt);
    state.message = state.countdown > 0 ? '准备出发 · ' + Math.ceil(state.countdown) : 'GO！自动加速，左右控制方向';
    return state;
  }
  state.raceTime += dt;
  // Substeps preserve the collision/gate bounds if a caller runs below 60 Hz.
  const n = Math.ceil(dt / (1 / 120)), h = dt / n;
  for (let k = 0; k < n; k++) {
    state.cars.forEach(car => {
      const drive = car.id === 0 ? { ...input, bPressed: k === 0 && !!input.bPressed, resetPressed: k === 0 && !!input.resetPressed } : aiInput(state, car);
      advanceCar(state, car, track, h, drive);
    });
    contacts(state, track);
  }
  const order = [...state.cars].sort((a, b) => a.finished && b.finished ? a.finishTime - b.finishTime || a.id - b.id : a.finished ? -1 : b.finished ? 1 : b.progress - a.progress || a.id - b.id);
  state.rank = order.findIndex(car => car.id === 0) + 1;
  if (state.player.finished) {
    state.phase = 'won';
    state.score = Math.max(100, Math.round((7 - state.rank) * 2000 + (180 - state.raceTime) * 40 + state.stats.drifts * 40));
    state.message = '第 ' + state.rank + ' 名完赛 · ' + state.raceTime.toFixed(2) + ' 秒';
    state.events.push({ type: 'win' });
  } else if (state.raceTime >= 180) {
    state.phase = 'lost'; state.message = '本次计时结束 · 再练习一次入弯和出弯';
    state.score = Math.max(0, Math.round(state.player.progress));
  }
  return state;
}
