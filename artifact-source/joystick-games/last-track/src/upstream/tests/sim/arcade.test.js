import test from 'node:test';
import assert from 'node:assert/strict';
import { createCarBody, stepBody, driftTarget, slideRecovery, brakeLimit, gripAccel, TUNING, SIM_DT } from '../../src/sim/carPhysics.js';
import { resolveWall, softEdge, wallDamage, WALL } from '../../src/sim/collisions.js';
import { initRecovery, recoveryTimers, beginRecovery, stepRecovery, RECOVERY } from '../../src/sim/recovery.js';
import { getCar } from '../../src/data/cars.js';
import { TRACKS } from '../../src/data/tracks/index.js';
import { defaultSave } from '../../src/data/saveStore.js';
import { makeConfig, goRacing, createRaceSim } from './helpers.js';

const STATS = { ...getCar('hammer').base };
const car = (v = 0, stats = STATS) => { const b = createCarBody({ x: 0, y: 0, heading: 0 }, stats); b.vx = v; b.u = v; b.speed = v; return b; };
const run = (b, input, secs, onTick) => { const f = typeof input === 'function' ? input : () => input; for (let i = 0; i < secs * 120; i++) { stepBody(b, f(i * SIM_DT), SIM_DT, {}); if (onTick) onTick(b, i * SIM_DT); } return b; };
const beta = (b) => Math.atan2(b.w, Math.max(4, Math.abs(b.u)));

// ------------------------------------------------------------------ handling
test('steering stays responsive at high speed (>= 1.5 g of cornering, yaw reaches 90% within 0.15 s)', () => {
  for (const v of [20, 40, 55]) {
    const b = car(v); let yawEnd = 0, t90 = null;
    run(b, { throttle: 0.4, steer: 1 }, 1.0, (bb, t) => { yawEnd = bb.yawRate; if (t90 === null && Math.abs(bb.yawRate) > 0.9 * 0.25 * Math.abs(yawEnd)) t90 = t; });
    const latG = Math.abs(b.yawRate) * b.speed / 9.81;
    assert.ok(latG > 1.5, `v=${v}: ${latG.toFixed(2)} g`);
  }
  const b = car(50); let t = null;
  run(b, { throttle: 0.4, steer: 1 }, 0.5, (bb, tt) => { if (t === null && Math.abs(bb.yawRate) > 0.35) t = tt; });
  assert.ok(t !== null && t < 0.15, `time to 0.35 rad/s at 50 m/s: ${t}`);
});

test('no spin-outs: full lock held at speed, a steering flick and a handbrake yank all stay below the slip hard cap and recover by themselves', () => {
  for (const [id, v] of [['wasp', 60], ['hammer', 54], ['bulwark', 53]]) {
    const stats = { ...getCar(id).base };
    const hold = car(v, stats); let peak = 0;
    run(hold, (t) => (t < 3 ? { throttle: 1, steer: 1 } : { throttle: 1, steer: 0 }), 6, (b) => { peak = Math.max(peak, Math.abs(beta(b))); });
    assert.ok(peak < 0.75, `${id} held lock peak slip ${peak.toFixed(2)}`);
    assert.ok(Math.abs(beta(hold)) < 0.05, `${id} recovered, slip ${beta(hold).toFixed(3)}`);
    const flick = car(v, stats); let fp = 0;
    run(flick, (t) => (t < 0.2 ? { throttle: 1, steer: 1 } : t < 0.4 ? { throttle: 1, steer: -1 } : { throttle: 1, steer: 0 }), 2, (b) => { fp = Math.max(fp, Math.abs(beta(b))); });
    assert.ok(fp < 0.3, `${id} flick slip ${fp.toFixed(2)}`);
    assert.ok(Math.abs(flick.yawRate) < 0.05);
    const hb = car(v, stats); let hp = 0, rec = null;
    run(hb, (t) => (t < 1 ? { throttle: 0.5, steer: 0.7, handbrake: true } : { throttle: 0.5, steer: 0 }), 4, (b, t) => { const a = Math.abs(beta(b)); hp = Math.max(hp, a); if (t > 1 && rec === null && a < 0.06) rec = t - 1; });
    assert.ok(hp > 0.15 && hp < 0.75, `${id} handbrake drift is visible but bounded: ${hp.toFixed(2)}`);
    assert.ok(rec !== null && rec < 1.2, `${id} drift recovers by itself in ${rec}s`);
  }
});

test('drift: sustained hard lock at speed kicks the tail out, a tap does not, the AI kick switch (mods.kick=0) disables it', () => {
  const tap = car(45); let tp = 0;
  run(tap, (t) => (t < 0.2 ? { throttle: 1, steer: 1 } : { throttle: 1, steer: 0 }), 1.5, (b) => { tp = Math.max(tp, b.drift); });
  assert.ok(tp < 0.05, `tap drift ${tp}`);
  const held = car(45); let hp = 0;
  run(held, { throttle: 1, steer: 1 }, 2, (b) => { hp = Math.max(hp, b.drift); });
  assert.ok(hp > 0.3, `held drift ${hp}`);
  const ai = car(45); let ap = 0;
  for (let i = 0; i < 240; i++) { stepBody(ai, { throttle: 1, steer: 1 }, SIM_DT, { kick: 0 }); ap = Math.max(ap, ai.drift); }
  assert.equal(ap, 0);
});

test('driftTarget / slideRecovery are pure, bounded and signed', () => {
  assert.equal(driftTarget(1, 5, true, 1), 0, 'too slow');
  assert.ok(driftTarget(0, 30, true, 0) > 0.9, 'handbrake kicks regardless of steer');
  assert.equal(driftTarget(0.3, 40, false, 1), 0, 'gentle steering never kicks');
  assert.ok(driftTarget(1, 40, false, 1) > 0.9 && driftTarget(1, 40, false, 1) <= 1);
  assert.equal(driftTarget(1, 40, false, 1, 0), 0);
  assert.equal(slideRecovery(0.05, 30, 0), 0, 'dead zone: ordinary cornering slip is untouched');
  assert.ok(slideRecovery(0.4, 30, 0) > 0 && slideRecovery(-0.4, 30, 0) < 0);
  assert.ok(Math.abs(slideRecovery(0.4, 30, 1)) < Math.abs(slideRecovery(0.4, 30, 0)), 'holding a drift weakens the assist');
  assert.ok(Math.abs(slideRecovery(0.8, 30, 1)) > Math.abs(slideRecovery(0.5, 30, 1)) * 1.8, 'stiffens past the soft cap');
});

test('mild auto-straighten: the steering returns to centre faster than it builds', () => {
  const b = car(30);
  run(b, { throttle: 0.5, steer: 1 }, 0.5);
  assert.ok(b.steer > 0.95);
  const before = b.steer; let t = 0;
  while (Math.abs(b.steer) > 0.05 && t < 1) { stepBody(b, { throttle: 0.5, steer: 0 }, SIM_DT, {}); t += SIM_DT; }
  assert.ok(t < 0.1 && before > 0.95, `centred in ${t.toFixed(3)} s`);
});

test('braking is capped near 1.3 g for every car (not the old ~4 g) and scales with grip', () => {
  for (const id of ['wasp', 'hammer', 'bulwark']) {
    const stats = { ...getCar(id).base }, b = car(50, stats), s0 = b.speed;
    run(b, { throttle: 0, brake: 1, steer: 0 }, 1);
    const g = (s0 - b.speed) / 9.81;
    assert.ok(g > 1.2 && g < 1.55, `${id} ${g.toFixed(2)} g`);
    assert.ok(brakeLimit(stats) <= gripAccel(stats) * TUNING.brakeGrip + 1e-9);
  }
});

test('straight-line boost is modest and nitro has a charge, a cooldown and a recharge', () => {
  const b = car(0);
  run(b, { throttle: 1, steer: 0 }, 14);
  assert.ok(b.speed > STATS.maxSpeed * 1.03 && b.speed < STATS.maxSpeed * 1.08, `top ${b.speed.toFixed(1)} vs ${STATS.maxSpeed}`);
  assert.ok(b.boost > 0.99);
  let burn = 0; const n0 = b.nitro;
  run(b, { throttle: 1, steer: 0, nitro: true }, 1, (bb) => { if (bb.nitroOn) burn++; });
  assert.ok(burn > 100 && b.nitro < n0 - 0.4, `burned ${burn} ticks, charge ${b.nitro.toFixed(2)}`);
  assert.ok(b.speed > STATS.maxSpeed * 1.12, `nitro speed ${b.speed.toFixed(1)}`);
  run(b, { throttle: 1, steer: 0, nitro: true }, 3);                      // runs dry
  assert.equal(b.nitroOn, false);
  assert.ok(b.nitroCd > 0 || b.nitro < TUNING.nitroMin + 0.2);
  const dry = b.nitro;
  run(b, { throttle: 1, steer: 0 }, 6);
  assert.ok(b.nitro > dry + 0.5, `recharged ${dry.toFixed(2)} -> ${b.nitro.toFixed(2)}`);
  const noN = car(30); stepBody(noN, { throttle: 1, nitro: true }, SIM_DT, { noNitro: true });
  assert.equal(noN.nitroOn, false);
});

test('physics step is deterministic and finite', () => {
  const a = car(40), c = car(40);
  const inp = (t) => ({ throttle: 1, steer: Math.sin(t * 3), handbrake: t > 2 && t < 2.5, nitro: t > 1 && t < 2, brake: t > 4 ? 1 : 0 });
  run(a, inp, 8); run(c, inp, 8);
  assert.deepEqual({ x: a.x, y: a.y, h: a.heading, v: a.speed }, { x: c.x, y: c.y, h: c.heading, v: c.speed });
  assert.ok([a.x, a.y, a.heading, a.speed, a.yawRate].every(Number.isFinite));
});

// ------------------------------------------------------------------ walls (straight wall along heading 0, walls at y = ±8)
const HW = 8;
function wallRun(b, input, secs) {
  let impactPeak = 0, dmg = 0, contact = 0;
  for (let i = 0; i < secs * 120; i++) {
    stepBody(b, input, SIM_DT, {});
    const pr = { d: b.y, heading: 0, i: 0 };
    softEdge(b, pr, HW, SIM_DT);
    const imp = resolveWall(b, pr, HW);
    if (imp > 0) { contact++; impactPeak = Math.max(impactPeak, imp); dmg += wallDamage(imp); }
  }
  return { impactPeak, dmg, contact };
}
function carAtWall(speed, angle, d = 5.5) {
  const b = car(0); b.y = d; b.heading = angle; b.vx = Math.cos(angle) * speed; b.vy = Math.sin(angle) * speed; b.u = speed; b.speed = speed; return b;
}

test('wall damage has a clear threshold and scales above it', () => {
  assert.equal(wallDamage(0), 0); assert.equal(wallDamage(WALL.dmgMin), 0); assert.equal(wallDamage(WALL.dmgMin - 0.1), 0);
  assert.ok(wallDamage(WALL.dmgMin + 5) > 0 && wallDamage(WALL.dmgMin + 15) > wallDamage(WALL.dmgMin + 5) * 2.5);
  assert.ok(wallDamage(WALL.dmgMin + 20) < 10, `a hard bump costs under 10 armor: ${wallDamage(WALL.dmgMin + 20)}`);
});

test('Shift drift slides through a corner and keeps its speed (no handbrake stop)', () => {
  for (const id of ['hammer', 'wasp', 'bulwark']) {
    const b = car(35, { ...getCar(id).base }); let peak = 0;
    run(b, { throttle: 0.3, steer: 0.6, handbrake: true }, 2, (bb) => { peak = Math.max(peak, Math.abs(beta(bb))); });
    assert.ok(peak > 0.3 && peak < 0.75, `${id} drift slip ${peak.toFixed(2)}`);
    assert.ok(b.speed > 0.8 * 35, `${id} kept its speed: ${b.speed.toFixed(1)} m/s`);
  }
});

test('glancing wall hits deflect along the wall with little speed loss and no damage', () => {
  for (const [speed, deg] of [[55, 6], [45, 10], [30, 14]]) {
    const b = carAtWall(speed, (deg * Math.PI) / 180);
    const free = carAtWall(speed, 0, 0); run(free, { throttle: 0, steer: 0 }, 1.0);       // same coast without the wall
    const r = wallRun(b, { throttle: 0, steer: 0 }, 1.0);
    assert.equal(r.dmg, 0, `${speed}@${deg}°: ${r.impactPeak.toFixed(1)} m/s normal`);
    const along = b.vx;
    assert.ok(along > free.vx * (1 - 0.5 * Math.sin((deg * Math.PI) / 180)) - 0.005, `${speed}@${deg}°: speed ${speed} -> ${along.toFixed(1)} (free coast ${free.vx.toFixed(1)})`);
    assert.ok(Math.abs(b.y) < HW + 0.05, 'stays inside the wall');
    assert.ok(Math.abs(b.heading) < 0.12, `nose swings along the wall: ${b.heading.toFixed(2)}`);
  }
});

test('a head-on wall hit scrubs speed and does damage; no tunnelling at any speed incl. nitro', () => {
  const b = carAtWall(40, Math.PI / 2 - 0.05, 4);
  const r = wallRun(b, { throttle: 0, steer: 0 }, 1.0);
  assert.ok(r.dmg > 8 && r.impactPeak > 20, `dmg ${r.dmg} impact ${r.impactPeak}`);
  assert.ok(b.speed < 25, `speed ${b.speed}`);
  for (const speed of [60, 75, 90]) {
    const f = carAtWall(speed, 0.5, 2); let worst = 0;
    for (let i = 0; i < 240; i++) {
      stepBody(f, { throttle: 1, steer: 0, nitro: true }, SIM_DT, {});
      const pr = { d: f.y, heading: 0, i: 0 }; softEdge(f, pr, HW, SIM_DT); resolveWall(f, pr, HW);
      worst = Math.max(worst, Math.abs(f.y));
    }
    assert.ok(worst < HW + 0.1, `${speed} m/s reached |y|=${worst}`);
  }
});

test('soft run-off: edge push-back before the solid wall and no push in the middle of the road', () => {
  const mid = carAtWall(30, 0, 0); const pr0 = { d: 0, heading: 0 };
  assert.equal(softEdge(mid, pr0, HW), 0);
  const edge = carAtWall(30, 0.12, HW - 1.2 - 1.0 + 0.7);       // body corner inside the soft band, still clear of the wall
  const vy0 = edge.vy;
  const k = softEdge(edge, { d: edge.y, heading: 0 }, HW);
  assert.ok(k > 0 && k < 1);
  assert.ok(edge.vy < vy0, 'outward velocity is bled / pushed back');
  assert.ok(Math.abs(edge.vx - 30 * Math.cos(0.12)) < 0.5, 'but the forward speed is untouched');
});

test('no getting stuck: a car driven square into a wall or a corner works itself loose', () => {
  for (const ang of [Math.PI / 2, Math.PI / 2 - 0.4, 2.2, -Math.PI / 2 + 0.1]) {
    const b = carAtWall(25, ang, 5.5); let maxY = 0;
    wallRun(b, { throttle: 1, steer: 0 }, 0.4);
    wallRun(b, { throttle: 1, steer: 0 }, 3);
    assert.ok(Math.abs(b.vx) > 8 || Math.abs(Math.cos(b.heading)) > 0.6, `ang ${ang.toFixed(2)}: vx ${b.vx.toFixed(1)} heading ${b.heading.toFixed(2)} speed ${b.speed.toFixed(1)}`);
    maxY = Math.abs(b.y); assert.ok(maxY < HW + 0.1);
  }
});

test('recovery: wrong-way / wedged cars are swung round to face the track and restarted', () => {
  const c = car(0); initRecovery(c); c.heading = Math.PI; c.speed = 1;
  let started = false;
  for (let i = 0; i < 120 * 3 && !started; i++) started = recoveryTimers(c, Math.PI, false, SIM_DT);
  assert.ok(started, 'wrong way for > wrongTime triggers');
  const w = car(0); initRecovery(w); w.speed = 40;
  for (let i = 0; i < 120 * 4; i++) assert.equal(recoveryTimers(w, Math.PI, false, SIM_DT), false, 'a fast spin clears itself');
  const s = car(0); initRecovery(s); s.speed = 0.5; let wedged = false;
  for (let i = 0; i < 120 * 3 && !wedged; i++) wedged = recoveryTimers(s, 0.2, true, SIM_DT);
  assert.ok(wedged, 'wedged against a wall triggers');
  const pr = { heading: 0, d: 7.5 }; c.x = 10; c.y = 7.5;
  beginRecovery(c, pr);
  assert.equal(recoveryTimers(c, Math.PI, false, SIM_DT), false, 'cooldown');
  let n = 0; while (stepRecovery(c, pr, HW, SIM_DT) && n++ < 1000);
  assert.ok(Math.abs(Math.sin(c.heading)) < 1e-6 && Math.cos(c.heading) > 0.999, 'faces along the track');
  assert.ok(Math.abs(c.y) <= HW * RECOVERY.inset + 1e-6, `moved off the wall: y=${c.y}`);
  assert.ok(c.speed > RECOVERY.restartSpeed * 0.95);
});

// ------------------------------------------------------------------ whole-sim
test('sim: a human car brushing the wall keeps its speed and armor; head-on hits hurt; nitro cannot tunnel on any track', () => {
  for (const tr of TRACKS) {
    const save = defaultSave(); save.upgrades.engine = 3;
    for (const steer of [-1, 0, 1]) {
      const sim = createRaceSim(makeConfig(tr.id, { save }), {});
      goRacing(sim);
      const c = sim.cars[0], hw = sim.track.width / 2;
      let maxD = 0, peak = 0;
      for (let i = 0; i < 120 * 30; i++) {
        sim.step({ throttle: 1, brake: 0, steer: i < 120 * 4 ? 0 : steer, fire: false, nitro: i % 600 < 300 });
        const pr = sim.track.project(c.x, c.y);
        maxD = Math.max(maxD, Math.abs(pr.d)); peak = Math.max(peak, c.speed);
        assert.ok(Number.isFinite(c.x) && Number.isFinite(c.y));
      }
      assert.ok(maxD < hw + 0.2, `${tr.id} steer ${steer}: |d|=${maxD.toFixed(2)} > ${hw}`);
      assert.ok(peak > 40);
    }
  }
});

test('sim: an unattended wrong-way player car auto-recovers and emits a recover event', () => {
  const sim = createRaceSim(makeConfig('strip'), {});
  goRacing(sim);
  const c = sim.cars[0];
  c.heading += Math.PI; c.vx = c.vy = 0; c.speed = 0;
  let rec = 0; sim.events.on('recover', () => rec++);
  for (let i = 0; i < 120 * 5; i++) sim.step({ throttle: 0, brake: 0, steer: 0 });
  assert.equal(rec, 1);
  const err = Math.abs(Math.atan2(Math.sin(c.heading - c.proj.heading), Math.cos(c.heading - c.proj.heading)));
  assert.ok(err < 0.3, `facing the track again: ${err}`);
});
