const test = require("node:test");
const assert = require("node:assert/strict");
const {
  JackalGame,
  FPS,
  TICK,
  DATA,
} = require("../src/main/assets/game-model.js");
const input = (id = 1, more = {}) => ({
  id,
  connected: true,
  x: 0,
  y: 0,
  a: false,
  b: false,
  start: false,
  select: false,
  ...more,
});
function ready(players = 1, stage = 1) {
  const g = new JackalGame(1988);
  g.start([input(), input(2)], { players, stage, skipIntro: true });
  return g;
}
function quiet(g) {
  g.enemySystem.clear();
  g.huts = [];
  g.prisoners = [];
  g.helipads = [];
  g.helicopters = [];
  g.pickups = [];
  g.spawnEvents = [];
  g.spawnCommands = [];
  g.collision.fill(0);
  g.map.forEach((r) => r.fill(0));
}
function ticks(g, n, inputs = [input()]) {
  for (let i = 0; i < n; i++) g.tick(inputs);
}

test("all six recovered maps preserve tile/collision dimensions, event counts and original camera origins", () => {
  assert.deepEqual(
    DATA.stages.map((s) => [
      s.width_tiles,
      s.height_tiles,
      s.events.length,
      s.start_camera_x,
    ]),
    [
      [64, 390, 74, 0],
      [64, 390, 107, 128],
      [64, 390, 133, 68],
      [64, 390, 92, 0],
      [64, 390, 138, 144],
      [64, 420, 143, 205],
    ],
  );
  for (const stage of DATA.stages) {
    const length = stage.width_tiles * stage.height_tiles;
    assert.equal(stage.tiles.length, length);
    assert.equal(stage.palettes.length, length);
    assert.equal(stage.collision.length, length);
    assert.ok(
      stage.collision.every((c) => Number.isInteger(c) && c >= 0 && c <= 3),
    );
    assert.ok(
      stage.events.every((e) => e.distance >= 0 && e.x >= 0 && e.x < 512),
    );
    assert.match(
      stage.source.dataset,
      /b6d90a1c999dcb9d6f82cdc0e88ef876aac4ee77/,
    );
  }
  const first = DATA.stages[0];
  assert.equal(first.events[0].distance, 240);
  assert.equal(first.events[0].x, 256);
  assert.equal(first.events[0].source_type, 1);
});

test("stage 3 map events select long screen-7 and short screen-8 laser beams with matching charge endpoints", () => {
  const events = DATA.stages[2].events.filter((event) => event.source_type === 0x38);
  assert.deepEqual(events.map((event) => event.source_page), [7, 8]);
  for (const [index, event] of events.entries()) {
    const g = ready(1, 3);
    quiet(g);
    g.spawnEvents = [event];
    g.eventIndex = 0;
    g.commandIndex = 0;
    g.cameraY = g.worldHeight - event.distance;
    g.cameraX = 128;
    g.processSpawns();
    const laser = g.enemies.find((actor) => actor.sourceType === 0x38);
    assert.ok(laser, 'the actual stage spawn record reaches the enemy system');
    assert.equal(laser.data.short, index === 1);
    const y = laser.y;
    ticks(g, 1);
    const flashes = g.enemies.filter((actor) => actor.sourceType === 0x0d);
    const offset = index === 1 ? 56 : 64;
    assert.deepEqual(flashes.map((actor) => actor.y).sort((a, b) => a - b), [y - offset, y + offset]);
    assert.equal(laser.contact, false, 'warning flashes precede the dangerous beam');
    ticks(g, 32);
    assert.equal(laser.contact, true);
    assert.equal(laser.frameId, index === 1 ? 0x60 : 0x5f);
    assert.equal(laser.y, y, 'scrolling does not change the selected beam or its world anchor');
  }
});
test("Start/Select choose original one/two-player mode and five lives, A does not bypass title", () => {
  const g = new JackalGame();
  ticks(g, 1, [input(1, { a: true })]);
  assert.equal(g.phase, "title");
  ticks(g, 1, [input(1, { select: true })]);
  assert.equal(g.selectedPlayers, 2);
  ticks(g, 1, [input(1, { start: true }), input(2)]);
  assert.equal(g.phase, "intro");
  assert.equal(g.players[0].lives, 5);
  assert.equal(g.players[1].lives, 5);
  assert.equal(g.players[0].x, 80);
  assert.equal(g.players[1].x, 176);
  assert.equal(g.players[0].y - g.cameraY, 128);
  ticks(g, 648, [input(), input(2)]);
  assert.equal(g.phase, "playing");
  assert.equal(g.cinematicKey, null);
});
test("native intro, attract, stage-loading and ending are frame states", () => {
  const idle = new JackalGame();
  ticks(idle, 385);
  assert.equal(idle.phase, "attract");
  ticks(idle, 1143);
  assert.equal(idle.phase, "title");
  const g = ready();
  g.start([input()]);
  ticks(g, 82);
  assert.equal(g.phase, "intro");
  ticks(g, 1);
  assert.equal(g.phase, "deployment");
  assert.equal(g.cinematicFrame, 83);
  ticks(g, 549);
  assert.equal(g.phase, "playing");
  g.loadStage(6);
  g.bossDone();
  assert.equal(g.phase, "ending");
  ticks(g, 5161, [input(1, { start: true })]);
  assert.equal(g.endingRestart, false);
  ticks(g, 1, [input(1, { start: true })]);
  assert.equal(g.endingRestart, true);
  ticks(g, 84);
  assert.equal(g.phase, "playing");
  assert.equal(g.stage, 1);
  assert.equal(g.difficulty, 3);
  assert.equal(g.continuesUsed, 3);
});
test("fixed ticks, Start pause and disconnected-phone pause cannot advance combat", () => {
  const g = ready();
  quiet(g);
  g.step(TICK / 2, [input()]);
  assert.equal(g.frame, 0);
  g.step(TICK / 2, [input()]);
  assert.equal(g.frame, 1);
  g.tick([input(1, { start: true })]);
  assert.equal(g.phase, "paused");
  const before = [g.frame, g.time, g.players[0].x, g.cameraY];
  ticks(g, 60, [input()]);
  assert.deepEqual([g.frame, g.time, g.players[0].x, g.cameraY], before);
  g.tick([input(1, { start: true })]);
  assert.equal(g.phase, "playing");
  g.tick([]);
  assert.equal(g.phase, "paused");
  g.tick([input()]);
  assert.equal(g.phase, "playing");
});
test("native cardinal/diagonal movement and four-frame turning are not normalized", () => {
  const g = ready();
  quiet(g);
  const p = g.players[0],
    x = p.x,
    y = p.y;
  ticks(g, 4, [input(1, { x: 1, y: -1 })]);
  assert.equal(p.x - x, 4);
  assert.equal(y - p.y, 4);
  assert.equal(p.dir, 1);
  assert.equal(p.frameId, 3);
  p.invulnerable = 0;
  g.updatePlayerArt(p);
  assert.equal(p.palette, 0);
  const marsh = ready(1, 4);
  quiet(marsh);
  marsh.collision.fill(3);
  const m = marsh.players[0],
    my = m.y;
  ticks(marsh, 4, [input(1, { y: -1 })]);
  assert.equal(my - m.y, 2);
});
test("solid/water terrain blocks jeeps and only stage-four marsh is traversable", () => {
  for (const stage of [1, 4])
    for (const tile of [1, 2, 3]) {
      const g = ready(1, stage);
      quiet(g);
      g.collision.fill(tile);
      const p = g.players[0],
        y = p.y;
      ticks(g, 10, [input(1, { y: -1 })]);
      assert.equal(p.y, y - (stage === 4 && tile === 3 ? 5 : 0));
    }
});
test("camera retains original two axes, 64-pixel reverse budget, and co-op screen limits", () => {
  const g = ready();
  quiet(g);
  const p = g.players[0];
  p.y = g.cameraY + 95;
  g.updateCamera();
  assert.equal(g.backtrack, 1);
  const up = g.cameraY;
  p.y = g.cameraY + 192;
  g.updateCamera();
  assert.equal(g.cameraY, up + 1);
  assert.equal(g.backtrack, 0);
  g.updateCamera();
  assert.equal(g.cameraY, up + 1);
  g.cameraX = 128;
  p.x = g.cameraX + 63;
  g.updateCamera();
  assert.equal(g.cameraX, 127);
  p.x = g.cameraX + 192;
  g.updateCamera();
  assert.equal(g.cameraX, 128);
  const coop = ready(2);
  quiet(coop);
  const [a, b] = coop.players;
  a.y = coop.cameraY + 95;
  b.y = coop.cameraY + 176;
  const cy = coop.cameraY;
  coop.updateCamera();
  assert.equal(coop.cameraY, cy);
  b.y--;
  coop.updateCamera();
  assert.equal(coop.cameraY, cy - 1);
  ticks(coop, 300, [input(1, { y: -1 }), input(2, { y: 1 })]);
  for (const p of coop.players)
    assert.ok(p.y >= coop.cameraY + 48 && p.y <= coop.cameraY + 224);
});
test("native spawn anchors use 240-pixel pages and 239-pixel bottom entry; script commands drive forced scroll", () => {
  const g = ready();
  quiet(g);
  g.spawnEvents = [
    { distance: 240, x: 160, source_type: 1, from_bottom: false },
    { distance: 240, x: 192, source_type: 2, from_bottom: true },
  ];
  g.eventIndex = 0;
  g.spawnCommands = [{ distance: 240, command: "forced_scroll" }];
  g.commandIndex = 0;
  g.processSpawns();
  assert.equal(g.enemies[0].y, 2880);
  assert.equal(g.enemies[1].y, 3119);
  assert.equal(g.forcedScroll, true);
  const cy = g.cameraY;
  g.updateCamera();
  assert.equal(g.cameraY, cy - 1);
  g.processSpawns();
  assert.equal(
    g.enemies.length,
    2,
    "Backtracking never repeats an already consumed event",
  );
});
test("B fires north at six pixels/tick for sixteen ticks, with three slots and global32 repeat", () => {
  const g = ready();
  quiet(g);
  const p = g.players[0];
  p.dir = p.targetDir = 2;
  g.fire(p);
  const bullet = g.playerBullets[0],
    y = bullet.y;
  g.tickProjectiles();
  assert.equal(bullet.y, y - 6);
  assert.equal(bullet.vx, 0);
  assert.equal(bullet.life, 15);
  ticks(g, 0);
  for (let i = 0; i < 15; i++) g.tickProjectiles();
  assert.equal(g.playerBullets[0].state, "ground");
  assert.equal(g.playerBullets[0].frameId, 17);
  for (let i = 0; i < 5; i++) g.tickProjectiles();
  assert.equal(g.playerBullets.length, 0);
  assert.equal(g.fire(p), true);
  assert.equal(g.fire(p), true);
  assert.equal(g.fire(p), true);
  assert.equal(g.fire(p), false);
});
test("A is edge-triggered, grenade fuse40 and rocket22 with four distinct weapon states", () => {
  const g = ready();
  quiet(g);
  const p = g.players[0];
  p.targetDir = 1;
  g.throwGrenade(p);
  assert.equal(g.grenades[0].life, 40);
  assert.equal(g.grenades[0].vx, 1.5);
  assert.equal(g.grenades[0].vy, -1.5);
  assert.equal(g.throwGrenade(p), false);
  g.weapons = [];
  p.weaponLevel = 1;
  g.throwGrenade(p);
  assert.equal(g.grenades[0].life, 22);
  assert.equal(g.grenades[0].vx, 2.75);
  assert.equal(g.grenades[0].frameId, 14);
  g.weapons = [];
  p.weaponLevel = 2;
  g.explode({ x: p.x, y: p.y, owner: 1, power: 2, kind: "rocket" });
  assert.equal(g.weapons.find((w) => w.kind === "blast").power, 2);
  assert.equal(g.weapons.find((w) => w.kind === "blast").life, 40);
  g.weapons = [];
  p.weaponLevel = 3;
  g.explode({ x: p.x, y: p.y, owner: 1, power: 3, kind: "rocket" });
  assert.equal(g.weapons.find((w) => w.kind === "blast").power, 3);
  const edge = ready();
  quiet(edge);
  ticks(edge, 120, [input(1, { a: true })]);
  assert.equal(
    edge.weapons.length,
    0,
    "Holding A cannot repeatedly relaunch after explosion expires",
  );
});
test("direct main-weapon contact applies five damage once rather than double-counting impact and blast", () => {
  const g = ready();
  quiet(g);
  const p = g.players[0];
  const target = g.enemySystem.spawn({ source_type: 10, x: p.x, y: p.y - 4 });
  target.vulnerable = true;
  target.hp = 10;
  g.throwGrenade(p);
  g.tickProjectiles();
  assert.equal(target.hp, 5);
  assert.ok(g.weapons.some((w) => w.kind === "weapon-explosion"));
  assert.equal(g.grenades.length, 0);
});
test("hut variants contain two/four POWs, special POW or garage tank and use real background patches", () => {
  const g = ready();
  quiet(g);
  for (const [type, count] of [
    [19, 2],
    [20, 2],
    [21, 1],
    [28, 4],
    [29, 4],
  ]) {
    const h = g.spawnEvent({ source_type: type, x: 128, y: g.cameraY + 64 });
    assert.equal(h.remaining, count);
    if (type === 21) assert.equal(h.special, true);
    g.huts = [];
  }
  const h = g.spawnEvent({ source_type: 19, x: 128, y: g.cameraY + 64 });
  const before = g.tiles.slice();
  g.hitHut(h.x, h.y, 0, 1, "gun");
  assert.equal(h.open, false);
  g.hitHut(h.x, h.y, 4, 1, "grenade");
  assert.equal(h.open, true);
  assert.ok(g.tiles.some((t, i) => t !== before[i]));
  assert.equal(g.level.tiles, g.tiles);
  assert.equal(g.backgroundPatches.length, 1);
  assert.equal(g.players[0].score, 800);
  const garage = g.spawnEvent({ source_type: 25, x: 224, y: g.cameraY + 64 });
  g.openHut(garage);
  for (let n = 0; n < 25; n++) g.tickRescue();
  assert.ok(g.enemies.some((e) => e.sourceType === 35));
  assert.equal(g.prisoners.length, 0);
});
test("ordinary prisoners queue until predecessor collected; sparkling POW upgrades without invented capacity8", () => {
  const g = ready();
  quiet(g);
  const p = g.players[0],
    h = g.spawnEvent({ source_type: 19, x: 160, y: g.cameraY + 64 });
  g.openHut(h);
  for (let n = 0; n < 92; n++) g.tickRescue();
  assert.equal(g.prisoners.length, 2);
  assert.equal(g.prisoners[1].state, "waiting");
  g.prisoners[0].alive = false;
  g.tickRescue();
  assert.equal(g.prisoners[0].state, "emerging");
  g.prisoners = [];
  for (let n = 0; n < 10; n++)
    g.spawnPrisoner(p.x, p.y, { state: "waving", special: n === 9 });
  g.tickRescue();
  assert.equal(p.passengers, 10);
  assert.equal(p.weaponLevel, 1);
  assert.equal(p.score, 800, "POW pickup itself adds no invented bonus");
});
test("unload is16 ticks initially then32, upgrades at4/9/15, and awards no immediate score", () => {
  const g = ready();
  quiet(g);
  const p = g.players[0];
  p.passengers = 15;
  g.spawnEvent({ source_type: 61, x: p.x + 48, y: p.y });
  g.spawnEvent({ source_type: 63, x: p.x, y: p.y });
  for (let n = 0; n < 16; n++) g.tickRescue();
  assert.equal(p.passengers, 14);
  assert.equal(p.rescued, 1);
  assert.equal(p.score, 0);
  for (let n = 0; n < 32 * 3; n++) {
    g.tickRescue();
    g.tickEffects();
  }
  assert.equal(p.rescued, 4);
  assert.equal(p.weaponLevel, 1);
  for (let n = 0; n < 32 * 5; n++) {
    g.tickRescue();
    g.tickEffects();
  }
  assert.equal(p.rescued, 9);
  assert.equal(p.weaponLevel, 2);
  for (let n = 0; n < 32 * 6; n++) {
    g.tickRescue();
    g.tickEffects();
  }
  assert.equal(p.rescued, 15);
  assert.equal(p.weaponLevel, 3);
});
test("death returns to grenade, drops at most4 POWs, then114 ticks to respawn with160 invulnerable", () => {
  const g = ready();
  quiet(g);
  const p = g.players[0];
  p.invulnerable = 0;
  p.weaponLevel = 3;
  p.passengers = 8;
  g.hitPlayer(p);
  assert.equal(p.alive, false);
  assert.equal(p.weaponLevel, 0);
  assert.equal(p.passengers, 0);
  assert.equal(g.prisoners.length, 4);
  assert.equal(p.lives, 5);
  ticks(g, 114);
  assert.equal(p.lives, 4);
  assert.equal(p.alive, true);
  assert.equal(p.invulnerable, 160);
  g.hitPlayer(p);
  assert.equal(p.alive, true);
});
test("A+B can transfer one co-op life to eliminated partner; Start retains pause meaning", () => {
  const g = ready(2);
  quiet(g);
  const [a, b] = g.players;
  b.lives = 0;
  b.alive = false;
  g.tick([input(), input(2, { a: true, b: true })]);
  assert.equal(a.lives, 4);
  assert.equal(b.lives, 1);
  assert.equal(b.alive, true);
  assert.equal(b.x, a.x);
  assert.equal(b.y, a.y);
});
test("20k then50k extra lives cap at9; rescue tally counts delivered not carried across stages", () => {
  const g = ready();
  quiet(g);
  const p = g.players[0];
  g.awardScore(1, 20000);
  assert.equal(p.lives, 6);
  g.awardScore(1, 50000);
  assert.equal(p.lives, 7);
  g.awardScore(1, 400000);
  assert.equal(p.lives, 9);
  p.score = 0;
  p.nextLife = 20000;
  p.passengers = 3;
  p.rescued = 2;
  g.bossDone();
  ticks(g, 569);
  assert.equal(g.stage, 2);
  assert.equal(g.phase, "deployment");
  assert.equal(p.score, 4000);
  assert.equal(p.passengers, 3);
  ticks(g, 32);
  assert.equal(g.phase, "playing");
});
test("large rescue totals extend tally instead of loading while rewards still count", () => {
  const g = ready();
  quiet(g);
  g.players[0].rescued = 100;
  g.bossDone();
  ticks(g, 600);
  assert.equal(g.phase, "stageclear");
  assert.equal(g.stage, 1);
  ticks(g, 700);
  assert.equal(g.stage, 2);
  assert.equal(g.players[0].score, 200000);
});
test("Continue has no arbitrary timeout, Select toggles and Start accepts only three continues", () => {
  const g = ready();
  quiet(g);
  g.players[0].lives = 0;
  g.players[0].alive = false;
  g.tick([input()]);
  assert.equal(g.phase, "continue");
  ticks(g, 1800);
  assert.equal(g.phase, "continue");
  g.tick([input(1, { select: true })]);
  assert.equal(g.continueChoice, 1);
  g.tick([input()]);
  g.tick([input(1, { select: true })]);
  assert.equal(g.continueChoice, 0);
  g.tick([input(1, { start: true })]);
  assert.equal(g.continuesUsed, 1);
  assert.equal(g.players[0].lives, 5);
  assert.equal(g.cinematicKey, "continue_load_01");
  ticks(g, 161);
  assert.equal(g.phase, "playing");
  g.continuesUsed = 3;
  g.players[0].lives = 0;
  g.players[0].alive = false;
  g.tick([input()]);
  assert.equal(g.phase, "gameover");
  ticks(g, 450);
  assert.equal(g.phase, "title");
});
test("long identical co-op runs are deterministic, finite and respect shared16 actor budget", () => {
  const a = ready(2),
    b = ready(2);
  for (let n = 0; n < 3600; n++) {
    const controls = [
      input(1, {
        x: Math.sin(n / 71),
        y: Math.cos(n / 113),
        a: n % 50 === 0,
        b: true,
      }),
      input(2, {
        x: Math.cos(n / 79),
        y: Math.sin(n / 91),
        a: n % 60 === 0,
        b: true,
      }),
    ];
    for (const g of [a, b]) {
      g.tick(controls);
      assert.ok(g.enemySystem.count() <= 16);
      assert.ok(g.effects.length <= 64);
      for (const p of g.players)
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    }
  }
  assert.deepEqual(a.status(), b.status());
  assert.deepEqual(a.players, b.players);
});
test("large or invalid frame times cannot corrupt positions or skip arbitrarily many frames", () => {
  const g = ready();
  quiet(g);
  g.step(100, [input(1, { x: Infinity, y: -1 })]);
  assert.ok(g.frame <= Math.ceil(0.1 * FPS));
  g.step(NaN, [input(1, { x: NaN, y: "bad" })]);
  assert.ok(Number.isFinite(g.time) && Number.isFinite(g.players[0].x));
});

test("main weapon pierces infantry and continues flying; bullet ground animation retains its slot", () => {
  const g = ready();
  quiet(g);
  const p = g.players[0];
  g.enemySystem.spawn({ source_type: 1, x: p.x, y: p.y - 6 });
  g.throwGrenade(p);
  g.tickProjectiles();
  assert.equal(g.grenades.length, 1);
  assert.equal(g.enemySystem.actors[0].state, "dying");
  g.weapons = [];
  g.enemySystem.clear();
  g.fire(p);
  g.collision[Math.floor(p.y / 8) * 64 + Math.floor(p.x / 8)] = 1;
  g.tickProjectiles();
  assert.equal(g.playerBullets[0].state, "ground");
  assert.equal(g.playerBullets[0].life, 5);
  g.fire(p);
  g.fire(p);
  assert.equal(g.fire(p), false);
});
test("a prisoner earns the original500 points only after walking96 ticks into a helicopter", () => {
  const g = ready();
  quiet(g);
  const p = g.players[0];
  p.passengers = 1;
  g.spawnEvent({ source_type: 61, x: p.x + 48, y: p.y });
  g.spawnEvent({ source_type: 63, x: p.x, y: p.y });
  for (let n = 0; n < 16; n++) g.tickRescue();
  assert.equal(p.score, 0);
  for (let n = 0; n < 95; n++) g.tickEffects();
  assert.equal(p.score, 0);
  g.tickEffects();
  assert.equal(p.score, 500);
  assert.ok(g.events.includes("pow-boarded"));
});
test("stage-six escalator carries a motionless jeep half a pixel per tick", () => {
  const g = ready(1, 6);
  quiet(g);
  const p = g.players[0],
    y = p.y;
  g.enemySystem.spawn({ source_type: 68, x: p.x, y: p.y });
  ticks(g, 8);
  assert.equal(p.y - y, 4);
});

test("enemy control events never render as ordinary explosions", () => {
  const g = ready();
  quiet(g);
  const ctx = g.enemyContext();
  ctx.onEffect(256, 48, "final-boss-music");
  ctx.onEffect(256, 48, "boss-background-row", { index: 61 });
  assert.equal(g.effects.length, 0);
  assert.ok(g.events.includes("final-boss-music"));
  assert.equal(g.backgroundOperations[0].index, 61);
  ctx.onEffect(10, 20, "explosion", { sourceType: 10 });
  assert.equal(g.effects[0].sourceType, 10);
  assert.equal(g.effects[0].frameId, 25);
});
