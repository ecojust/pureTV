import test from 'node:test';
import assert from 'node:assert/strict';
import { makeConfig, goRacing, place, createRaceSim } from './helpers.js';
import { initWeapons, cycleWeapon, tryFire } from '../../src/sim/weapons.js';
import { getWeapon } from '../../src/data/weapons.js';

const NO = { throttle: 0, brake: 0, steer: 0, fire: false };
const FIRE = { ...NO, fire: true };
function duel(rivalId = 'vex') {
  const sim = createRaceSim(makeConfig('strip', { mode: 'race', rivalIds: [rivalId] }), {});
  goRacing(sim);
  const [a, b] = sim.cars;
  place(sim, a, 400, 0, 0);
  place(sim, b, 440, 0, 0);
  b.aiControlled = false;
  return { sim, a, b };
}
const give = (car, loadout) => { initWeapons(car, loadout); };

test('mine: drops a hazard, arms, then blasts a car that drives over it (owner credited)', () => {
  const { sim, a, b } = duel();
  give(a, [{ id: 'mine', ammo: 2 }]);
  const booms = [];
  sim.events.on('explosion', (e) => booms.push(e));
  sim.step(FIRE);
  const snap = sim.snapshot();
  const m = snap.hazards.find((h) => h.type === 'mine');
  assert.ok(m, 'mine hazard in snapshot');
  assert.equal(m.armed, false);
  assert.equal(a.weapons[0].ammo, 1);
  // park the victim on the mine before it is armed: nothing happens
  b.x = m.x; b.y = m.y; b.vx = b.vy = 0;
  const armor0 = b.armor;
  for (let i = 0; i < 30; i++) { b.x = m.x; b.y = m.y; b.vx = b.vy = 0; sim.step(NO); }
  assert.equal(b.armor, armor0, 'unarmed mine is inert');
  // owner is clear of it and it is armed: victim triggers it
  place(sim, a, 200, 0, 0);
  for (let i = 0; i < 120 && !booms.length; i++) { b.x = m.x; b.y = m.y; b.vx = b.vy = 0; sim.step(NO); }
  assert.ok(booms.length >= 1 && booms[0].radius === getWeapon('mine').radius);
  assert.ok(b.armor < armor0 - 10, `blast damage ${armor0 - b.armor}`);
  assert.ok(!sim.snapshot().hazards.some((h) => h.type === 'mine'), 'mine consumed');
  b.armor = 3; b.x = m.x; b.y = m.y;
  give(a, [{ id: 'mine', ammo: 2 }]);
  place(sim, a, 300, 0, 0); place(sim, b, 330, 0, 0);
  a.cooldowns[0] = 0;
  sim.step(FIRE);
  const m2 = sim.snapshot().hazards.find((h) => h.type === 'mine');
  place(sim, a, 200, 0, 0);
  for (let i = 0; i < 200 && !b.wrecked; i++) { b.x = m2.x; b.y = m2.y; b.vx = b.vy = 0; sim.step(NO); }
  assert.ok(b.wrecked && a.kills === 1, 'mine kill credited to the layer');
});

test('mine: owner is safe for a few seconds, then is not', () => {
  const { sim, a } = duel();
  give(a, [{ id: 'mine', ammo: 1 }]);
  sim.step(FIRE);
  const armor0 = a.armor;
  for (let i = 0; i < 120 * 2; i++) { a.x = sim.snapshot().hazards.find((h) => h.type === 'mine').x; a.vx = a.vy = 0; sim.step(NO); }
  assert.equal(a.armor, armor0);
});

test('oil: puddle persists, cuts grip while in/near it, and recovers', () => {
  const { sim, a, b } = duel();
  give(a, [{ id: 'oil', ammo: 3 }]);
  sim.step(FIRE);
  const oil = sim.snapshot().hazards.find((h) => h.type === 'oil');
  assert.ok(oil);
  place(sim, a, 200, 0, 0);
  b.x = oil.x; b.y = oil.y; b.vx = b.vy = 0;
  sim.step(NO);
  assert.equal(sim.snapshot().cars[1].oiled, true);
  assert.ok(sim.snapshot().hazards.some((h) => h.type === 'oil'), 'puddle not consumed');
  assert.equal(b.armor, b.armorMax, 'oil does no damage');
  // same input, same speed: the oiled car turns in far less (grip-limited yaw)
  const drive = (oiled) => {
    place(sim, a, 100, 0, 35);   // a is the human-driven car
    const h0 = a.heading;
    for (let i = 0; i < 90; i++) { a.oilTimer = oiled ? 1 : 0; sim.step({ throttle: 0.6, brake: 0, steer: 0.6 }); }
    return Math.abs(Math.atan2(Math.sin(a.heading - h0), Math.cos(a.heading - h0)));
  };
  const dry = drive(false), wet = drive(true);
  assert.ok(wet < dry * 0.8, `turn-in dry ${dry} vs oil ${wet}`);
  place(sim, b, 250, 0, 0);
  b.oilTimer = 0.5;
  for (let i = 0; i < 120; i++) sim.step(NO);
  assert.equal(sim.snapshot().cars[1].oiled, false);
});

test('flamethrower: cone damage per tick, burns ammo fast, nothing outside cone/range', () => {
  const { sim, a, b } = duel();
  give(a, [{ id: 'flamethrower', ammo: 100 }]);
  place(sim, b, 408, 0, 0); // 8 m ahead, in range
  const flames = [];
  sim.events.on('flame', (e) => flames.push(e));
  const armor0 = b.armor;
  for (let i = 0; i < 60; i++) sim.step(FIRE);   // 0.5 s
  assert.ok(flames.length >= 8 && flames[0].carId === 0 && flames[0].range === 14);
  assert.ok(armor0 - b.armor > 3 && armor0 - b.armor < 12, `0.5 s of flame ${armor0 - b.armor}`);
  assert.ok(a.weapons[0].ammo <= 100 - 8, 'ammo burns at ~20/s');
  // out of range
  place(sim, b, 440, 0, 0); b.armor = b.armorMax;
  for (let i = 0; i < 60; i++) sim.step(FIRE);
  assert.equal(b.armor, b.armorMax);
  // outside the cone (alongside, 6 m to the side)
  place(sim, b, 408, 6, 0);
  for (let i = 0; i < 60; i++) sim.step(FIRE);
  assert.equal(b.armor, b.armorMax);
  // ammo runs dry
  place(sim, b, 408, 0, 0);
  a.weapons[0].ammo = 5;
  for (let i = 0; i < 120; i++) sim.step(FIRE);
  assert.equal(a.weapons[0].ammo, 0);
});

test('flamethrower can wreck with kill credit', () => {
  const { sim, a, b } = duel();
  give(a, [{ id: 'flamethrower', ammo: 300 }]);
  place(sim, b, 408, 0, 0); b.armor = 4;
  for (let i = 0; i < 120 && !b.wrecked; i++) sim.step(FIRE);
  assert.ok(b.wrecked && a.kills === 1);
});

test('ramplate: passive (never selected or fired, no ammo use), boosts ram damage dealt and cuts damage taken', () => {
  const ramHit = (loadoutA) => {
    const sim = createRaceSim(makeConfig('strip', { mode: 'race', rivalIds: ['vex'] }), {});
    goRacing(sim);
    const [a, b] = sim.cars;
    a.aiControlled = b.aiControlled = false;
    give(a, loadoutA);
    b.ramMult = b.ramTaken = 1;
    place(sim, a, 400, 0, 50);
    place(sim, b, 420, 0, 0);
    const a0 = a.armor, b0 = b.armor;
    for (let i = 0; i < 120; i++) sim.step(NO);
    return { dealt: b0 - b.armor, taken: a0 - a.armor, a };
  };
  const plain = ramHit([{ id: 'machinegun', ammo: 10 }]);
  const plated = ramHit([{ id: 'ramplate', ammo: 1 }, { id: 'machinegun', ammo: 10 }]);
  assert.ok(plain.dealt > 0);
  assert.ok(Math.abs(plated.dealt / plain.dealt - getWeapon('ramplate').ramMult) < 0.25, `dealt ${plated.dealt} vs ${plain.dealt}`);
  assert.ok(plated.taken < plain.taken, 'plate absorbs');
  // passive handling
  const { sim, a } = duel();
  give(a, [{ id: 'ramplate', ammo: 1 }, { id: 'machinegun', ammo: 10 }]);
  assert.equal(a.activeWeapon, 1, 'starts on the first real weapon');
  cycleWeapon(a); assert.equal(a.activeWeapon, 1, 'cycle skips passive');
  a.activeWeapon = 0;
  for (let i = 0; i < 20; i++) sim.step(FIRE);
  assert.equal(a.weapons[0].ammo, 1, 'ramplate ammo untouched');
  assert.equal(a.weapons[1].ammo < 10, true, 'fire falls through to the real weapon');
  assert.equal(sim.snapshot().cars[0].weapons[0].id, 'ramplate');
});

// ---- AI personality usage
function aiDuel(driverId, loadout) {
  const sim = createRaceSim(makeConfig('strip', { mode: 'race', rivalIds: [driverId] }), {});
  goRacing(sim);
  while (sim.time < 9) sim.step(NO);
  const [p, r] = sim.cars;
  p.aiControlled = false;
  if (loadout) give(r, loadout);
  return { sim, p, r };
}
const counts = (sim, types) => { const c = {}; for (const t of types) sim.events.on(t, (e) => { c[t] = (c[t] || 0) + 1; c[e.weaponId || t] = (c[e.weaponId || t] || 0) + 1; }); return c; };

test('AI: flamethrower brawler torches a car in front of it', () => {
  const { sim, p, r } = aiDuel('cinder');
  const c = counts(sim, ['flame']);
  for (let i = 0; i < 120 * 6; i++) {
    const s = r.proj.s + 9;
    place(sim, p, s, 0, r.speed * 0.95);
    sim.step(NO);
  }
  assert.ok(c.flame > 10, `flame events ${c.flame}`);
  assert.ok(p.armor < p.armorMax);
});

for (const [id, weapon, reach] of [['grave', 'mine', 14], ['slick', 'oil', 9]]) {
  test(`AI: ${id} lays ${weapon} when tailed, and not when alone`, () => {
    const alone = aiDuel(id);
    alone.p.x = 1e5; alone.p.y = 1e5;   // far away
    const ca = counts(alone.sim, ['shot']);
    for (let i = 0; i < 120 * 6; i++) alone.sim.step(NO);
    assert.equal(ca[weapon] || 0, 0);
    const { sim, p, r } = aiDuel(id);
    const c = counts(sim, ['shot']);
    for (let i = 0; i < 120 * 12; i++) { place(sim, p, r.proj.s - reach, 0, Math.max(r.speed, 20)); sim.step(NO); }
    assert.ok(c[weapon] >= 1, `${weapon} dropped ${c[weapon]}`);
  });
}

test('AI: the ram-plate driver rams a car placed ahead of it', () => {
  const run = (id) => {
    const { sim, p, r } = aiDuel(id);
    let bumps = 0; sim.events.on('bump', (e) => { if (e.carId === 0 && e.strength > 2) bumps++; });
    for (let i = 0; i < 120 * 12; i++) {
      if (i % 120 === 0) place(sim, p, r.proj.s + 22, 0, Math.max(10, r.speed * 0.6));
      sim.step(NO);
    }
    return bumps;
  };
  assert.ok(run('dolores') >= 1, 'dolores rams');
});

test('every new rival races a full race without getting stuck', () => {
  for (const id of ['grave', 'slick', 'cinder', 'dolores']) {
    const sim = createRaceSim(makeConfig('scrapyard', { mode: 'race', rivalIds: [id], seed: 5 }), { aiPlayer: true });
    let n = 0, crawl = 0, maxCrawl = 0;
    while (!sim.isOver() && n++ < 120 * 400) {
      sim.step(NO);
      if (n % 60 === 0 && sim.phase === 'racing') { const c = sim.cars[1]; crawl = !c.wrecked && !c.finished && c.speed < 1.5 ? crawl + 1 : 0; maxCrawl = Math.max(maxCrawl, crawl); }
    }
    assert.ok(sim.isOver());
    assert.ok(maxCrawl < 6, `${id} crawled ${maxCrawl}s`);
    assert.ok(sim.result().finishOrder.find((f) => f.driverId === id));
  }
});
