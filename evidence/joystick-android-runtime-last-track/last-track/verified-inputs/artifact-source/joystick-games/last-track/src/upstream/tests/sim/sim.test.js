import test from 'node:test';
import assert from 'node:assert/strict';
import { makeConfig, goRacing, place, createRaceSim, SIM_DT } from './helpers.js';
import { TRACKS } from '../../src/data/tracks/index.js';
import { idealLapTime } from '../../src/sim/ai/racingLine.js';
import { createDirector } from '../../src/sim/raceDirector.js';
import { defaultSave } from '../../src/data/saveStore.js';
import { WRECK_LIFETIME } from '../../src/sim/damage.js';

const IDS = TRACKS.map((t) => t.id);
const MAXSTEPS = 120 * 700;
const runUntilOver = (sim, input = null, max = MAXSTEPS) => { let n = 0; while (!sim.isOver() && n++ < max) sim.step(input); return n; };

test('director: lap counting is monotonic (no skipping, no reversing credit)', () => {
  const sim = createRaceSim(makeConfig('scrapyard'), { aiPlayer: true });
  const L = sim.track.length;
  const d = createDirector(sim.track, 3);
  const car = { id: 0, wrecked: false, finished: false, speed: 30, proj: { s: L - 8 } };
  d.initCar(car);
  const laps = [];
  const emit = (type, p) => laps.push([type, p.lap ?? p.position]);
  const move = (s, t) => { car.proj.s = ((s % L) + L) % L; d.update([car], t, emit); };
  for (let s = L - 8; s <= L + 20; s += 2) move(s, 1);       // crossing the start line is not a lap
  assert.deepEqual(laps, []);
  for (let s = L + 20; s <= 2 * L - 4; s += 40) move(s, 2);   // drive round
  for (let s = 2 * L - 4; s <= 2 * L + 5; s += 2) move(s, 3); // complete lap 1
  for (let s = 2 * L + 5; s >= 2 * L - 5; s -= 2) move(s, 4); // reverse over the line
  for (let s = 2 * L - 5; s <= 2 * L + 5; s += 2) move(s, 5); // and forward again: still one lap
  assert.deepEqual(laps, [['lap', 1]]);
  car.proj.s = (car.proj.s + L / 2) % L; d.update([car], 6, emit);   // projection glitch must not skip laps
  assert.equal(laps.length, 1);
});

for (const id of IDS) {
  test(`AI alone finishes 3 laps on ${id} near the ideal time`, () => {
    const cfg = makeConfig(id);
    const sim = createRaceSim(cfg, { aiPlayer: true, aiSkill: 1 });
    const lapEvents = [];
    sim.events.on('lap', (e) => lapEvents.push(e.lap));
    runUntilOver(sim);
    assert.ok(sim.isOver());
    const r = sim.result();
    assert.equal(r.player.position, 1);
    assert.deepEqual(lapEvents, Array.from({ length: cfg.laps }, (_, i) => i + 1));
    const ideal = idealLapTime(sim.track, cfg.player.stats) * cfg.laps;
    assert.ok(r.player.time < ideal * 1.12, `time ${r.player.time} vs ideal ${ideal}`);
    assert.ok(r.player.time > ideal * 0.85, 'sanity: not faster than the speed profile');
    assert.equal(r.player.damageFraction < 0.05, true, 'clean run does not wreck the car');
  });

  test(`no wall tunnelling at max speed on ${id}`, () => {
    for (const steer of [-1, -0.35, 0, 0.35, 1]) {
      const save = defaultSave(); save.upgrades.engine = 3;
      const sim = createRaceSim(makeConfig(id, { save }), {});
      goRacing(sim);
      const car = sim.cars[0], hw = sim.track.width / 2;
      let maxD = 0, peak = 0;
      for (let i = 0; i < 120 * 40; i++) {
        sim.step({ throttle: 1, brake: 0, steer: i < 120 * 4 ? 0 : steer, fire: false });
        const pr = sim.track.project(car.x, car.y);
        maxD = Math.max(maxD, Math.abs(pr.d)); peak = Math.max(peak, car.speed);
        assert.ok(Number.isFinite(car.x) && Number.isFinite(car.y));
      }
      assert.ok(maxD < hw + 0.2, `steer ${steer}: |d|=${maxD} > ${hw}`);
      assert.ok(peak > 40, 'actually fast');
    }
  });
}

test('car reaches near top speed and brakes', () => {
  const sim = createRaceSim(makeConfig('strip'), { aiPlayer: true, aiSkill: 1 });
  goRacing(sim);
  const car = sim.cars[0];
  let peak = 0;
  for (let i = 0; i < 120 * 40; i++) { sim.step(null); peak = Math.max(peak, car.speed); }
  assert.ok(peak > car.stats.maxSpeed * 0.9, String(peak));
  assert.ok(peak <= car.stats.maxSpeed * 1.01);
  car.aiControlled = false;
  const s0 = car.speed;
  for (let i = 0; i < 120; i++) sim.step({ throttle: 0, brake: 1, steer: 0 });
  // realistic braking: ~1.1-1.7 g (the old arcade value was ~4 g)
  const decel = (s0 - car.speed) / 1;
  assert.ok(s0 < 20 || (decel > 10.5 && decel < 17), `brake decel ${decel.toFixed(1)} m/s^2 from ${s0.toFixed(1)}`);
});

function duel(extra = {}) {
  const sim = createRaceSim(makeConfig('strip', { mode: 'race', rivalIds: ['vex'], ...extra }), {});
  goRacing(sim);
  const [a, b] = sim.cars;
  place(sim, a, 400, 0, 0);
  place(sim, b, 440, 0, 0);
  b.aiControlled = false;             // stationary target
  return { sim, a, b };
}
const give = (car, id, ammo = 50) => { car.weapons = [{ id, ammo }]; car.cooldowns = [0]; car.activeWeapon = 0; };

test('machinegun: damage and tracer events', () => {
  const { sim, a, b } = duel();
  give(a, 'machinegun', 100);
  const armor0 = b.armor;
  const seen = [];
  sim.events.on('hit', (e) => seen.push(e));
  for (let i = 0; i < 120; i++) sim.step({ throttle: 0, brake: 0, steer: 0, fire: true });
  assert.ok(b.armor < armor0, 'target damaged');
  assert.ok(seen.length > 3 && seen.every((e) => e.byId === 0 && e.carId === 1 && e.weaponId === 'machinegun'));
  assert.ok(a.weapons[0].ammo < 100);
  const snap = sim.snapshot();
  assert.ok(snap.events.some((e) => e.type === 'shot' && e.weaponId === 'machinegun'));
});

test('kill credit: shooter gets the kill and wreck event', () => {
  const { sim, a, b } = duel();
  give(a, 'machinegun', 200);
  b.armor = 2;
  const wrecks = [];
  sim.events.on('wreck', (e) => wrecks.push(e));
  for (let i = 0; i < 240 && !b.wrecked; i++) sim.step({ throttle: 0, brake: 0, steer: 0, fire: true });
  assert.ok(b.wrecked);
  assert.deepEqual(wrecks.map((w) => [w.carId, w.byId]), [[1, 0]]);
  assert.equal(a.kills, 1);
  assert.equal(sim.snapshot().cars[1].wrecked, true);
  assert.ok(sim.snapshot().hazards.some((h) => h.type === 'wreck'));
  // a wreck stays on the track as an obstacle for WRECK_LIFETIME seconds, then is removed
  for (let i = 0; i < 120 * (WRECK_LIFETIME + 1); i++) sim.step({ throttle: 0, brake: 0, steer: 0, fire: false });
  assert.ok(!sim.snapshot().hazards.some((h) => h.type === 'wreck'));
  assert.equal(sim.result().player.kills, 1);
});

test('rocket: projectile, explosion damage with falloff, kill credit', () => {
  const { sim, a, b } = duel();
  give(a, 'rocket', 5);
  b.armor = b.armorMax = 100;
  const ex = [];
  sim.events.on('explosion', (e) => ex.push(e));
  let sawProjectile = false;
  sim.step({ throttle: 0, brake: 0, steer: 0, fire: true });
  for (let i = 0; i < 120 && !ex.length; i++) {
    sim.step({ throttle: 0, brake: 0, steer: 0, fire: false });
    if (sim.snapshot().projectiles.some((p) => p.type === 'rocket' && p.ownerId === 0)) sawProjectile = true;
  }
  assert.ok(sawProjectile);
  assert.equal(ex.length, 1);
  assert.ok(b.armor <= 100 - 20, `armor ${b.armor}`);
  assert.equal(a.weapons[0].ammo, 4);
  // lethal rocket credits the owner
  b.armor = 5;
  a.cooldowns[0] = 0;
  sim.step({ throttle: 0, brake: 0, steer: 0, fire: true });
  for (let i = 0; i < 120 && !b.wrecked; i++) sim.step({ throttle: 0, brake: 0, steer: 0, fire: false });
  assert.ok(b.wrecked && a.kills === 1);
});

test('terminator homes onto a car that is not dead ahead', () => {
  const { sim, a, b } = duel();
  give(a, 'terminator', 2);
  place(sim, b, 460, 5, 0);           // offset by 5 m laterally
  b.armor = b.armorMax = 200;
  sim.step({ throttle: 0, brake: 0, steer: 0, fire: true });
  for (let i = 0; i < 240; i++) sim.step({ throttle: 0, brake: 0, steer: 0, fire: false });
  assert.ok(b.armor < 200, 'missile curved into the target');
});

test('caltrops: pop tyres (slow + grip loss for ~6 s) and damage', () => {
  const { sim, a, b } = duel();
  give(a, 'caltrops', 3);
  place(sim, a, 440, 0, 30);          // a drives past dropping caltrops, b parked behind later
  place(sim, b, 380, 0, 40);
  b.aiControlled = false;
  sim.step({ throttle: 1, brake: 0, steer: 0, fire: true });
  assert.ok(sim.snapshot().hazards.some((h) => h.type === 'caltrops'));
  a.vx = a.vy = 0;                     // park a out of the way
  place(sim, a, 300, 6, 0);
  const armor0 = b.armor;
  let popped = false, peak = 0;
  for (let i = 0; i < 120 * 3; i++) {
    sim.step({ throttle: 0, brake: 0, steer: 0 });
    b.vx = Math.cos(b.heading) * Math.max(Math.hypot(b.vx, b.vy), 40); b.vy = Math.sin(b.heading) * Math.max(Math.hypot(b.vx, b.vy), 40);
    if (sim.snapshot().cars[1].tyresPopped) { popped = true; break; }
  }
  assert.ok(popped, 'tyresPopped flagged');
  assert.ok(b.armor < armor0, 'caltrops damage');
  assert.ok(!sim.snapshot().hazards.some((h) => h.type === 'caltrops'), 'consumed');
  // effect: slower top speed and weaker grip while popped
  b.vx = b.vy = 0;
  place(sim, b, 200, 0, 0);
  for (let i = 0; i < 120 * 5; i++) sim.step({ throttle: 0, brake: 0, steer: 0 }), (b.aiControlled = false);
  const before = b.tyreTimer;
  assert.ok(before >= 0);
  b.tyreTimer = 6;
  for (let i = 0; i < 120 * 10; i++) { sim.step({ throttle: 1, brake: 0, steer: 0 }); b.aiControlled = false; if (b.tyreTimer > 0) b.tyreTimer = 6; }
  assert.ok(b.speed <= b.stats.maxSpeed * 0.7 + 1, `popped top speed ${b.speed}`);
  assert.equal(sim.snapshot().cars[1].tyresPopped, true);
  b.tyreTimer = 5.9;
  for (let i = 0; i < 120 * 7; i++) sim.step({ throttle: 0, brake: 0, steer: 0 });
  assert.equal(sim.snapshot().cars[1].tyresPopped, false, 'recovers after ~6 s');
});

test('ramming damages both cars, heavier car takes less', () => {
  const sim = createRaceSim(makeConfig('strip', { mode: 'race', rivalIds: ['vex'] }), {});
  goRacing(sim);
  const [a, b] = sim.cars;
  a.aiControlled = b.aiControlled = false;
  a.stats = { ...a.stats, mass: 1000 }; b.stats = { ...b.stats, mass: 3000 };
  place(sim, a, 400, 0, 50);
  place(sim, b, 420, 0, 0);
  const a0 = a.armor, b0 = b.armor;
  for (let i = 0; i < 120; i++) sim.step({ throttle: 0, brake: 0, steer: 0 });
  assert.ok(a.armor < a0 && b.armor < b0);
  assert.ok(a0 - a.armor > b0 - b.armor);
});

test('snapshot shape matches the frozen spec', () => {
  const sim = createRaceSim(makeConfig('mojave', { mode: 'race' }), {});
  const s = sim.snapshot();
  for (const k of ['t', 'tick', 'phase', 'countdown', 'lapsTotal', 'cars', 'projectiles', 'hazards', 'pickups', 'events']) assert.ok(k in s, k);
  assert.equal(s.phase, 'countdown');
  assert.equal(s.cars.length, 5);
  assert.equal(s.cars[0].isPlayer, true);
  for (const k of ['id', 'driverId', 'isPlayer', 'name', 'x', 'y', 'heading', 'vx', 'vy', 'speed', 'steer', 'yawRate', 'armor', 'armorMax', 'wrecked', 'smoke', 'burning', 'tyresPopped', 'lap', 's', 'position', 'finished', 'finishTime', 'kills', 'weapons', 'activeWeapon', 'firing', 'color', 'helmetColor']) assert.ok(k in s.cars[0], k);
  assert.ok(s.pickups.length > 0 && 'active' in s.pickups[0]);
  const types = [];
  sim.events.on('countdown', (e) => types.push(e.n)); sim.events.on('go', () => types.push('go'));
  goRacing(sim);
  assert.deepEqual(types, [3, 2, 1, 'go']);
  assert.ok(sim.snapshot().cars.every((c) => c.speed < 100));
});

test('cars are held during the countdown', () => {
  const sim = createRaceSim(makeConfig('scrapyard', { mode: 'race' }), {});
  for (let i = 0; i < 120 * 2; i++) sim.step({ throttle: 1, brake: 0, steer: 0 });
  assert.ok(sim.snapshot().cars.every((c) => c.speed === 0));
  assert.equal(sim.phase, 'countdown');
});

test('pickups: repair restores armor, then respawns', () => {
  const sim = createRaceSim(makeConfig('strip', { mode: 'race' }), {});
  goRacing(sim);
  const car = sim.cars[0];
  const p = sim.track.pickups.find((q) => q.type === 'repair') || sim.track.pickups[0];
  car.armor = 10;
  car.x = p.x; car.y = p.y; car.vx = car.vy = 0;
  const types = [];
  sim.events.on('pickup', (e) => types.push(e.pickupType));
  sim.step({ throttle: 0, brake: 0, steer: 0 });
  assert.equal(types.length, 1);
  const snap = sim.snapshot();
  assert.equal(snap.pickups.find((q) => q.id === p.id).active, false);
  place(sim, car, 100, 0, 0);
  for (let i = 0; i < 120 * 16; i++) sim.step({ throttle: 0, brake: 0, steer: 0 });
  assert.equal(sim.snapshot().pickups.find((q) => q.id === p.id).active, true);
});

test('determinism: same seed and inputs give identical snapshots; different seed differs', () => {
  const run = (seed) => {
    const sim = createRaceSim(makeConfig('scrapyard', { mode: 'race', seed }), { aiPlayer: true });
    const out = [];
    for (let i = 0; i < 120 * 40; i++) { sim.step(null); if (i % 60 === 0) out.push(JSON.stringify(sim.snapshot())); else sim.snapshot(); }
    return out.join('|');
  };
  assert.equal(run(11), run(11));
  assert.notEqual(run(11), run(12));
});

test('determinism with a scripted human player', () => {
  const run = () => {
    const sim = createRaceSim(makeConfig('mojave', { mode: 'race', seed: 3 }), {});
    for (let i = 0; i < 120 * 30; i++) sim.step({ throttle: 1, brake: i % 400 > 300 ? 1 : 0, steer: Math.sin(i / 90), fire: i % 50 < 25, cycleWeapon: i % 300 === 0 });
    return JSON.stringify(sim.snapshot());
  };
  assert.equal(run(), run());
});

for (const id of IDS) {
  test(`headless 5-car race with combat on ${id}`, () => {
    const cfg = makeConfig(id, { mode: 'race' });
    const nCars = cfg.rivals.length + 1;
    const sim = createRaceSim(cfg, { aiPlayer: true });
    const counts = {};
    for (const t of ['shot', 'hit', 'finish', 'lap']) sim.events.on(t, () => { counts[t] = (counts[t] || 0) + 1; });
    const n = runUntilOver(sim);
    assert.ok(sim.isOver(), 'race ended');
    const secs = n / 120;
    assert.ok(secs > 90 && secs < 600, `sane duration ${secs}s`);
    const r = sim.result();
    assert.equal(r.finishOrder.length, nCars);
    assert.deepEqual(r.finishOrder.map((f) => f.position), Array.from({ length: nCars }, (_, i) => i + 1));
    assert.equal(new Set(r.finishOrder.map((f) => f.carId)).size, nCars);
    assert.ok(r.finishOrder[0].time > 0 && !r.finishOrder[0].wrecked, 'winner finished');
    assert.ok(counts.shot > 5 && counts.hit > 5, `combat happened ${JSON.stringify(counts)}`);
    assert.ok(counts.finish >= 2, 'several cars cross the line');
    // classification: finishers first, wrecks last
    const wreckedIdx = r.finishOrder.map((f) => f.wrecked);
    const firstWreck = wreckedIdx.indexOf(true);
    if (firstWreck >= 0) assert.ok(wreckedIdx.slice(firstWreck).every(Boolean));
    assert.equal(r.player.position, r.finishOrder.find((f) => f.isPlayer).position);
  });
}

test('practice mode: solo player, ends when laps are done', () => {
  const sim = createRaceSim(makeConfig('scrapyard', { mode: 'practice' }), { aiPlayer: true });
  assert.equal(sim.snapshot().cars.length, 1);
  runUntilOver(sim);
  assert.equal(sim.result().finishOrder.length, 1);
});
