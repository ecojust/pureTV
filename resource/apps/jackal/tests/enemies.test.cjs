"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  EnemySystem,
  SPECS,
  velocity,
} = require("../src/main/assets/enemies.js");
function rig(stage = 1, difficulty = 0) {
  const scores = [],
    effects = [],
    counts = { start: 0, done: 0 };
  const e = new EnemySystem({ stage, random: () => 0.5 });
  const ctx = {
    stage,
    difficulty,
    cameraX: 128,
    cameraY: 200,
    players: [],
    terrainBlocked: () => false,
    addScore: (owner, score) => scores.push({ owner, score }),
    onEffect: (x, y, kind) => effects.push({ x, y, kind }),
    onBossStart: () => counts.start++,
    onBossDefeated: () => counts.done++,
  };
  const tick = (n) => {
    for (let i = 0; i < n; i++) e.tick(ctx);
  };
  return { e, ctx, tick, scores, effects, counts };
}
function removeAllButBoss(e) {
  e.actors = e.actors.filter((a) => a.bossPart || a.controller);
  e.projectiles.length = 0;
}

test("native 32-way speed encoding retains documented fractional speed and signs", () => {
  assert.deepEqual(velocity(0, 0x11), { x: 0.75, y: 0 });
  assert.deepEqual(velocity(8, 0x40), { x: 0, y: 2 });
  assert.deepEqual(velocity(24, 0x31), { x: 0, y: -1.75 });
  assert.deepEqual(velocity(16, 0x22), { x: -1.125, y: 0 });
  assert.deepEqual(velocity(4, 0x20), { x: 180 / 256, y: 180 / 256 });
});
test("native source IDs preserve distinct boss stats and correct enemy families", () => {
  assert.equal(SPECS[10].hp, 10);
  assert.equal(SPECS[24].hp, 15);
  assert.equal(SPECS[64].hp, 32);
  assert.equal(SPECS[74].hp, 63);
  assert.equal(SPECS[75].hp, 127);
  assert.equal(SPECS[79].hp, 64);
  assert.equal(SPECS[47].kind, "left-falling-rock");
  assert.equal(SPECS[71].kind, "hq-laser-turret");
  assert.equal(SPECS[75].score, 9000);
});
test("ordinary hits award correct owner and a defeated enemy cannot score twice", () => {
  const r = rig(),
    a = r.e.spawn({ source_type: 7, x: 200, y: 250 });
  r.tick(1);
  assert.equal(r.e.damageAt(a.x, a.y, 0, 1, "gun", 2), true);
  assert.equal(a.hp, 3);
  r.e.damageAt(a.x, a.y, 0, 5, "grenade", 2);
  r.e.damageAt(a.x, a.y, 0, 5, "grenade", 1);
  r.tick(24);
  assert.deepEqual(r.scores, [{ owner: 2, score: 500 }]);
  assert.equal(r.e.actors.length, 0);
});
test("boss tank HP high bit means explosive resistance, not machine-gun immunity", () => {
  const r = rig(),
    a = r.e.spawn({ source_type: 10, x: 240, y: 260 });
  r.tick(1);
  r.e.damageAt(a.x, a.y, 0, 1, "gun", 1);
  assert.equal(a.hp, 9);
  r.e.damageAt(a.x, a.y, 0, 5, "grenade", 1);
  assert.equal(a.hp, 4);
  r.e.damageAt(a.x, a.y, 0, 5, "rocket", 1);
  assert.equal(a.state, "dying");
});
test("stage 1 spawns four alternating entry tanks, using weapon difficulty delays", () => {
  for (const [difficulty, delay] of [
    [0, 240],
    [3, 144],
  ]) {
    const r = rig(1, difficulty);
    r.e.spawn({ source_type: 9, x: 256, y: 200 });
    r.tick(delay);
    assert.equal(r.e.actors.filter((a) => a.sourceType === 10).length, 0);
    r.tick(1);
    let tanks = r.e.actors.filter((a) => a.sourceType === 10);
    assert.equal(tanks.length, 1);
    assert.equal(tanks[0].data.fromBottom, true);
    const entries = [true];
    for (let i = 0; i < 3; i++) {
      r.tick(delay);
      tanks = r.e.actors.filter((a) => a.sourceType === 10);
      entries.push(tanks.at(-1).data.fromBottom);
    }
    assert.deepEqual(entries, [true, false, true, false]);
    assert.equal(r.e.boss.pending, 0);
    assert.equal(r.counts.start, 1);
    assert.equal(r.counts.done, 0);
  }
});
test("stage 2 creates four statue heads at original world x positions, 24 ticks apart", () => {
  const r = rig(2);
  r.e.spawn({ source_type: 32, x: 0, y: 0 });
  r.tick(24);
  assert.equal(r.e.boss.spawned, 0);
  r.tick(73);
  assert.deepEqual(
    r.e.actors.filter((a) => a.sourceType === 24).map((a) => a.x),
    [308, 228, 268, 188],
  );
  assert.ok(
    r.e.actors.filter((a) => a.sourceType === 24).every((a) => a.y === 228),
  );
});
test("boss statue has 192 idle +24 eye-flash +24 mouth ticks, then a homing missile", () => {
  const r = rig(2),
    a = r.e.spawn({ source_type: 24, x: 256, y: 230 });
  r.tick(191);
  assert.equal(a.state, "closed");
  r.tick(1);
  assert.equal(a.state, "eyes");
  r.tick(24);
  assert.equal(a.state, "mouth");
  r.tick(24);
  assert.equal(a.state, "closed");
  assert.equal(r.e.projectiles.length, 1);
  assert.equal(r.e.projectiles[0].mode, 1);
  assert.equal(r.e.projectiles[0].dir, 8);
});
test("dormant statue only attacks at weapon difficulty 2 or higher", () => {
  const r = rig(2, 1),
    a = r.e.spawn({ source_type: 34, x: 256, y: 230 });
  r.tick(100);
  assert.equal(a.state, "closed");
  assert.equal(r.e.projectiles.length, 0);
  r.ctx.difficulty = 2;
  r.tick(100);
  assert.ok(a.age > 100);
  assert.ok(r.e.projectiles.length > 0);
});
test("stage 3 has six 6HP armored cannons that can take bullets when raised", () => {
  const r = rig(3);
  r.e.spawn({ source_type: 37, x: 0, y: 0 });
  r.tick(145);
  const parts = r.e.actors.filter((a) => a.bossPart);
  assert.equal(parts.length, 6);
  assert.deepEqual(
    parts.map((a) => [a.x, a.y]),
    [
      [296, 270],
      [232, 286],
      [232, 254],
      [184, 286],
      [184, 254],
      [112, 270],
    ],
  );
  assert.ok(
    parts.every(
      (a) =>
        a.sourceType === 18 &&
        a.hp === 6 &&
        a.explosiveResistance &&
        !a.gunImmune,
    ),
  );
});
test("spread turret hides from damage and fires five distinct native-angle bullets", () => {
  const r = rig(3),
    a = r.e.spawn({
      source_type: 18,
      raw_source_type: 146,
      bossPart: true,
      x: 256,
      y: 230,
      slot: 2,
    });
  assert.equal(r.e.damageAt(a.x, a.y, 0, 5, "grenade", 1), false);
  r.tick(72);
  assert.equal(a.state, "aim");
  r.tick(8);
  assert.equal(a.state, "retracting");
  assert.equal(r.e.projectiles.length, 5);
  assert.deepEqual(
    r.e.projectiles.map((p) => p.dir),
    [4, 6, 8, 10, 12],
  );
  assert.ok(r.e.projectiles.every((p) => p.bulletType === 6));
});
test("helicopter boss waits 128 ticks, enters for 144, then drops three paratroopers", () => {
  const r = rig(4),
    a = r.e.spawn({ source_type: 64, x: 256, y: 200 });
  r.tick(127);
  assert.equal(a.visible, false);
  r.tick(1);
  assert.equal(a.state, "entering");
  r.tick(144);
  assert.equal(a.state, "hover");
  r.e.projectiles.length = 0;
  r.tick(64);
  assert.equal(a.state, "leaving");
  assert.equal(r.e.actors.filter((o) => o.sourceType === 66).length, 3);
});
test("stage 5 core stays invulnerable until all four tank doors have exploded", () => {
  const r = rig(5);
  r.e.spawn({ source_type: 23, x: 0, y: 0 });
  r.tick(1);
  const spawningCore = r.e.actors.find((a) => a.sourceType === 38);
  assert.equal(r.e.boss.pending, 4);
  assert.equal(
    r.e.damageAt(spawningCore.x, spawningCore.y, 0, 5, "grenade", 1),
    false,
    "core remains protected before its doors occupy any actor slots",
  );
  r.tick(4);
  const core = r.e.actors.find((a) => a.sourceType === 38),
    doors = r.e.actors.filter((a) => a.sourceType === 49);
  assert.equal(doors.length, 4);
  assert.equal(core.vulnerable, false);
  assert.equal(r.e.damageAt(core.x, core.y, 0, 5, "grenade", 1), false);
  for (const a of doors) {
    a.vulnerable = true;
    r.e.damageAt(a.x, a.y, 0, 5, "grenade", 1);
  }
  r.tick(24);
  assert.equal(core.vulnerable, false);
  r.tick(1);
  assert.equal(core.vulnerable, true);
  assert.equal(core.state, "exposed");
});
test("tank door can only be damaged during its 32 tick open phase", () => {
  const r = rig(5),
    a = r.e.spawn({ source_type: 49, x: 128, y: 272, doorIndex: 0 });
  r.tick(48);
  assert.equal(a.state, "opening");
  assert.equal(a.vulnerable, false);
  r.tick(32);
  assert.equal(a.state, "open");
  assert.equal(a.vulnerable, true);
  r.tick(32);
  assert.equal(a.state, "closing");
  assert.equal(a.vulnerable, false);
});
test("final fight progresses from 63HP HQ plus two lasers to 127HP flame tank with separate 64HP turret", () => {
  const r = rig(6);
  r.e.spawn({ source_type: 69, x: 0, y: 0 });
  r.tick(3);
  const hq = r.e.actors.find((a) => a.sourceType === 74);
  assert.equal(hq.hp, 63);
  assert.equal(r.e.actors.filter((a) => a.sourceType === 71).length, 2);
  assert.deepEqual(
    r.e.actors.filter((a) => a.sourceType === 71).map((a) => a.x),
    [302, 210],
  );
  r.e.damageAt(hq.x, hq.y, 0, 63, "grenade", 1);
  assert.equal(r.e.boss.phase, "hq-dying");
  r.tick(24);
  assert.equal(r.e.boss.phase, "hq-exploding");
  r.tick(279);
  assert.equal(r.counts.done, 0);
  assert.equal(r.e.boss.phase, "hq-exploding");
  assert.equal(r.e.boss.freezePlayers, true);
  r.tick(1);
  assert.equal(r.e.boss.phase, "hq-to-tank");
  r.tick(1);
  assert.equal(r.e.boss.phase, "flame-tank");
  const tank = r.e.actors.find((a) => a.sourceType === 75),
    turret = r.e.actors.find((a) => a.sourceType === 79);
  assert.equal(tank.hp, 127);
  assert.equal(turret.hp, 64);
  assert.equal(r.counts.done, 0);
  r.e.damageAt(tank.x, tank.y, 0, 127, "grenade", 1);
  assert.equal(r.e.boss.phase, "tank-exploding");
  r.tick(207);
  assert.equal(r.counts.done, 0);
  assert.equal(r.e.boss.freezePlayers, true);
  r.tick(1);
  assert.equal(r.counts.done, 1);
  r.tick(100);
  assert.equal(r.counts.done, 1);
});
test("round bullet lifetime, delayed visibility and speed match the native projectile table", () => {
  const r = rig();
  r.e.ctx = r.ctx;
  const p = r.e.shot({ x: 256, y: 240 }, 1, 0);
  assert.equal(p.life, 96);
  assert.equal(p.vx, 1.125);
  assert.equal(p.hiddenTicks, 17);
  r.tick(16);
  assert.equal(p.visible, false);
  r.tick(1);
  assert.equal(p.visible, true);
});
test("original 16 shared slots include core entities and bullets; priority can evict ordinary actors", () => {
  const r = rig();
  r.e.externalActorCount = 15;
  assert.ok(r.e.spawn({ source_type: 1, x: 100, y: 200 }));
  assert.equal(r.e.spawn({ source_type: 2, x: 110, y: 200 }), null);
  const boss = r.e.spawn({
    source_type: 24,
    priority_spawn: true,
    bossPart: true,
    x: 200,
    y: 200,
  });
  assert.ok(boss);
  assert.equal(r.e.count(), 16);
  assert.equal(
    r.e.spawn({
      source_type: 24,
      priority_spawn: true,
      bossPart: true,
      x: 220,
      y: 200,
    }),
    null,
  );
});
test("five-shot spread trucks preserve left/right fire direction and three timed waves", () => {
  const r = rig(4),
    a = r.e.spawn({ source_type: 42, x: 256, y: 230 });
  r.tick(5);
  assert.equal(r.e.projectiles.length, 1);
  r.tick(18);
  assert.deepEqual(
    r.e.projectiles.map((p) => p.dir),
    [4, 3, 5, 2, 6],
  );
  assert.equal(a.state, "wait");
});
test("all supported ordinary source types tick without NaN or unbounded actor allocation", () => {
  for (const t of Object.keys(SPECS)
    .map(Number)
    .filter((t) => ![9, 23, 32, 37, 64, 69].includes(t))) {
    const r = rig(6, 3);
    r.ctx.players = [{ id: 1, x: 256, y: 380, alive: true, joined: true }];
    r.ctx.damagePlayer = () => {};
    r.e.spawn({ source_type: t, x: 256, y: 240 });
    r.tick(600);
    for (const a of [...r.e.actors, ...r.e.projectiles])
      assert.ok(Number.isFinite(a.x) && Number.isFinite(a.y), `source ${t}`);
    assert.ok(r.e.count() <= 16, `source ${t}`);
  }
});

test("stage 3 laser stays stationary and cycles three columns with 32 tick warning and 24 tick beam", () => {
  const r = rig(3),
    a = r.e.spawn({ source_type: 56, x: 100, y: 270 });
  r.tick(1);
  assert.equal(a.x, 368);
  assert.equal(a.state, "charging");
  assert.equal(r.e.actors.filter((e) => e.sourceType === 13).length, 2);
  r.tick(31);
  assert.equal(a.contact, false);
  r.tick(1);
  assert.equal(a.contact, true);
  assert.equal(a.frameId, 95);
  assert.equal(a.y, 270);
  r.tick(24);
  assert.equal(a.contact, false);
  r.tick(1);
  assert.equal(a.x, 240);
});
test("parked priority vehicle exposes a full-weapon star after its explosion, not a random reward", () => {
  const r = rig(3),
    spawns = [];
  r.ctx.spawnEntity = (event) => spawns.push(event);
  const a = r.e.spawn({
    source_type: 83,
    raw_source_type: 211,
    x: 200,
    y: 250,
  });
  r.tick(1);
  assert.equal(a.backgroundOnly, true);
  assert.equal(a.frameId, 0);
  r.e.damageAt(a.x, a.y, 0, 5, "grenade", 1);
  r.tick(23);
  assert.equal(spawns.length, 0);
  r.tick(1);
  assert.equal(spawns.length, 1);
  assert.equal(spawns[0].source_type, 81);
});
test("pillars wait for a player below within 112 pixels and release their falling top after explosion", () => {
  const r = rig(2),
    a = r.e.spawn({ source_type: 16, x: 200, y: 230 });
  r.ctx.players = [{ id: 1, x: 200, y: 350, alive: true }];
  r.tick(4);
  assert.equal(a.state, "standing");
  r.ctx.players[0].y = 320;
  r.tick(4);
  assert.equal(a.state, "dying");
  r.tick(24);
  const top = r.e.actors.find((e) => e.sourceType === 30);
  assert.ok(top);
  assert.equal(top.dir, 10);
});

test("hitbox gun-immunity is independent of HP and splash cannot damage armored bosses", () => {
  const r = rig(2),
    statue = r.e.spawn({ source_type: 24, x: 200, y: 230 });
  r.tick(1);
  assert.equal(r.e.damageAt(200, 230, 0, 1, "gun", 1), false);
  assert.equal(statue.hp, 15);
  assert.equal(r.e.damageAt(200, 230, 0, 5, "blast", 1), false);
  assert.equal(statue.hp, 15);
  assert.equal(r.e.damageAt(200, 230, 0, 5, "grenade", 1), true);
  assert.equal(statue.hp, 10);
  const boat = r.e.spawn({ source_type: 26, x: 300, y: 250 });
  assert.equal(boat.hp, 10);
  r.e.damageAt(boat.x, boat.y, 0, 5, "grenade", 1);
  assert.equal(boat.state, "dying");
});
test("main weapon passes through infantry but stops on a vehicle", () => {
  const r = rig(),
    soldier = r.e.spawn({ source_type: 1, x: 200, y: 250 });
  assert.equal(r.e.damageAt(200, 250, 0, 5, "grenade", 1), true);
  assert.equal(soldier.state, "dying");
  assert.equal(r.e.lastImpactStops, false);
  const tank = r.e.spawn({ source_type: 7, x: 300, y: 250 });
  r.e.damageAt(300, 250, 0, 5, "grenade", 1);
  assert.equal(tank.state, "dying");
  assert.equal(r.e.lastImpactStops, true);
});

test("destroying a train car propagates to the next car after each 24-frame explosion without extra kill points", () => {
  const r = rig(4);
  const cars = [0, 1, 2].map((trainIndex) =>
    r.e.spawn({
      source_type: 51,
      x: 200,
      y: 245 + trainIndex * 40,
      trainIndex,
    }),
  );
  r.tick(1);
  r.e.damageAt(cars[0].x, cars[0].y, 0, 5, "grenade", 1);
  r.tick(23);
  assert.notEqual(cars[1].state, "dying");
  r.tick(1);
  assert.equal(cars[1].state, "dying");
  assert.notEqual(cars[2].state, "dying");
  r.tick(24);
  assert.equal(cars[2].state, "dying");
  r.tick(24);
  assert.deepEqual(r.scores, [{ owner: 1, score: 1500 }]);
  assert.equal(r.e.actors.filter((a) => a.sourceType === 51).length, 0);
});
test("each tank door grows its population cap on its 64th natural opening", () => {
  const r = rig(5),
    a = r.e.spawn({ source_type: 49, x: 128, y: 272, doorIndex: 0 });
  r.tick(48 + 32 + 31);
  assert.equal(
    r.e.actors.filter((o) => o.sourceType === 35 || o.sourceType === 36).length,
    0,
  );
  r.tick(1);
  assert.equal(a.state, "closing");
  assert.equal(r.e.actors.find((o) => o.sourceType === 35)?.sourceType, 35);
  assert.equal(a.data.spawnOrder, 1);
  assert.equal(a.data.capacity, 4);
  for (let i = 0; i < 23000 && a.data.openings < 63; i++) r.tick(1);
  assert.equal(a.data.openings, 63);
  assert.equal(a.data.capacity, 4);
  for (let i = 0; i < 400 && a.data.openings < 64; i++) r.tick(1);
  assert.equal(a.data.openings, 64);
  assert.equal(a.data.capacity, 5);
});
test("co-op point tier is captured at spawn, even if player two is gone at the kill", () => {
  const r = rig(),
    a = r.e.spawn({ source_type: 7, x: 200, y: 240, coop: true });
  assert.equal(a.score, 800);
  r.tick(1);
  r.e.damageAt(a.x, a.y, 0, 5, "grenade", 1);
  r.tick(1);
  assert.deepEqual(r.scores, [{ owner: 1, score: 800 }]);
});
test("original stage6 checkpoint reaches the ending via real gun/rocket inputs and both boss transitions", () => {
  const { JackalGame } = require("../src/main/assets/game-model.js");
  const g = new JackalGame(1988);
  g.start([{ id: 1, connected: true }], { stage: 6, skipIntro: true });
  // Explicit saved-checkpoint fixture, not a complete unassisted campaign.
  // Retain original terrain, final event records, weapon collision and damage;
  // a long spawn shield isolates progression from the test pilot's survival.
  g.enemySystem.clear();
  g.huts = [];
  g.prisoners = [];
  g.helipads = [];
  g.helicopters = [];
  g.pickups = [];
  g.cameraX = 128;
  g.cameraY = 228;
  g.eventIndex = g.spawnEvents.findIndex((e) => e.distance >= 3132);
  g.commandIndex = g.spawnCommands.findIndex((e) => e.distance >= 3027);
  const p = g.players[0];
  Object.assign(p, { x: 256, y: 360, weaponLevel: 3, invulnerable: 10000 });
  const phases = [],
    hpChanges = [];
  let previousPhase, previousHp;
  for (let f = 0; f < 6000 && g.phase === "playing"; f++) {
    const target =
      g.enemies.find((e) => e.sourceType === 75 && e.hp > 0) ||
      g.enemies.find((e) => e.sourceType === 74 && e.hp > 0);
    const dx = target ? target.x - p.x : 0;
    const x = Math.abs(dx) > 5 ? Math.sign(dx) : 0,
      y = x ? 0 : target && p.dir !== 0 ? -1 : 0;
    const frozen = !!g.boss?.freezePlayers,
      before = [p.x, p.y, p.invulnerable];
    g.tick([
      {
        id: 1,
        connected: true,
        x: frozen ? 1 : x,
        y,
        a: !x && !y && f % 2 === 0,
        b: true,
      },
    ]);
    if (frozen)
      assert.deepEqual(
        [p.x, p.y, p.invulnerable],
        before,
        "transition freezes movement and spawn-shield timer",
      );
    if (target && target.hp !== previousHp) {
      hpChanges.push([target.sourceType, target.hp]);
      previousHp = target.hp;
    }
    if (g.boss?.phase !== previousPhase) {
      previousPhase = g.boss?.phase;
      if (previousPhase) phases.push([previousPhase, f]);
    }
  }
  assert.equal(g.phase, "ending");
  assert.equal(g.stage, 6);
  assert.equal(g.boss.done, true);
  assert.deepEqual(
    phases.map((p) => p[0]),
    [
      "headquarters",
      "hq-dying",
      "hq-exploding",
      "hq-to-tank",
      "flame-tank",
      "tank-exploding",
      "defeated",
    ],
  );
  const frame = Object.fromEntries(phases);
  assert.equal(frame["hq-exploding"] - frame["hq-dying"], 24);
  assert.equal(frame["hq-to-tank"] - frame["hq-exploding"], 280);
  assert.equal(frame["flame-tank"] - frame["hq-to-tank"], 1);
  assert.equal(frame.defeated - frame["tank-exploding"], 208);
  assert.ok(hpChanges.some(([type, hp]) => type === 74 && hp === 58));
  assert.ok(hpChanges.some(([type, hp]) => type === 75 && hp > 0 && hp < 127));
  assert.ok(g.events.includes("gun"));
  assert.ok(g.events.includes("rocket"));
  assert.equal(
    p.score,
    14000,
    "destroying the tank does not award a free turret kill",
  );
});

test("enemy bullets cross water and obey stage6 terrain3 rules, then show eight harmless impact frames", () => {
  for (const [stage, tile, type, stops] of [
    [1, 2, 1, false],
    [1, 3, 1, false],
    [6, 3, 9, true],
    [6, 3, 10, false],
    [6, 1, 14, false],
    [1, 1, 1, true],
  ]) {
    const r = rig(stage);
    r.ctx.terrainClass = () => tile;
    r.ctx.terrainBlocked = () => true;
    r.e.ctx = r.ctx;
    const p = r.e.shot({ x: 256, y: 240 }, type, 0);
    r.tick(1);
    assert.equal(
      p.state === "impact",
      stops,
      `stage${stage}, tile${tile}, bullet${type}`,
    );
    if (stops) {
      assert.equal(p.frameId, 17);
      const x = p.x;
      r.tick(7);
      assert.equal(p.alive, true);
      assert.equal(p.x, x);
      r.tick(1);
      assert.equal(p.alive, false);
    }
  }
});
