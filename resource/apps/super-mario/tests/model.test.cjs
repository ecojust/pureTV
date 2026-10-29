"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Game = require("../src/main/assets/game-model.js");
const pad = (id = 1, extra = {}) =>
  Object.assign(
    {
      id,
      connected: true,
      x: 0,
      y: 0,
      a: false,
      b: false,
      start: false,
      select: false,
    },
    extra,
  );
function tick(g, input = {}, count = 1) {
  for (let i = 0; i < count; i++) g.tick([pad(g.activePlayer, input)]);
}
function fresh() {
  const g = new Game();
  g.begin();
  tick(g, {}, 2);
  return g;
}
function floorFixture(g) {
  g.enemies = [];
  g.level.map = Array.from({ length: 15 }, (_, y) =>
    Array(320).fill(y >= 13 ? 1 : 0),
  );
  g.level.items = {};
  g.level.pipes = [];
  g.level.coins = [];
  g.level.platforms = [];
  g.level.flag = null;
  g.level.axe = null;
  g.level.width = 5120;
  g.level.checkpoint = 5000;
  g.player().x = 64;
  g.player().y = 192;
  g.player().vx = 0;
  g.player().vy = 0;
  g.player().grounded = true;
  g.cameraX = 0;
}
function foe(type, x, y, more = {}) {
  return Object.assign(
    {
      type,
      x,
      y,
      w: 14,
      h: 14,
      vx: 0,
      vy: 0,
      alive: true,
      age: 0,
      hp: 1,
      shell: false,
      shellTicks: 0,
    },
    more,
  );
}
test("title selection, start, 1-based status and active-only pause controls", () => {
  const g = new Game();
  g.tick([pad(1, { select: true }), pad(2)]);
  assert.equal(g.selectedPlayers, 2);
  g.tick([pad(), pad(2)]);
  g.tick([pad(1, { start: true }), pad(2)]);
  assert.equal(g.phase, "playing");
  assert.equal(g.status().activePlayer, 1);
  assert.deepEqual(
    g.status().players.map((p) => p.joined),
    [true, true],
  );
  g.tick([pad(), pad(2, { start: true })]);
  assert.equal(g.phase, "playing");
  g.tick([pad(1, { start: true }), pad(2)]);
  assert.equal(g.phase, "paused");
  g.tick([pad(), pad(2)]);
  g.tick([pad(1, { select: true }), pad(2)]);
  assert.equal(g.muted, true);
  assert.equal(g.phase, "paused");
});
test("acceleration, running speed, inertia and release braking use actual inputs", () => {
  const walk = fresh(),
    run = fresh();
  floorFixture(walk);
  floorFixture(run);
  tick(walk, { x: 1 }, 60);
  tick(run, { x: 1, b: true }, 60);
  assert.equal(walk.player().vx, 1.75);
  assert.equal(run.player().vx, 3.1);
  assert.ok(run.player().x > walk.player().x + 40);
  const before = run.player().x;
  tick(run, {}, 1);
  assert.ok(run.player().x > before);
  assert.ok(run.player().vx < 3.1);
  tick(run, {}, 35);
  assert.equal(run.player().vx, 0);
});
test("holding A produces a higher jump and does not auto-jump on landing", () => {
  function arc(hold) {
    const g = fresh();
    floorFixture(g);
    let top = g.player().y;
    for (let i = 0; i < 100; i++) {
      tick(g, { a: i < hold, b: true });
      top = Math.min(top, g.player().y);
    }
    return { top, g };
  }
  const short = arc(2),
    long = arc(100);
  assert.ok(long.top < short.top - 25);
  assert.ok(long.g.player().grounded);
  assert.equal(long.g.player().y, 192);
});
test("head collision releases mushroom, then fire flower, and big player breaks bricks", () => {
  const g = fresh();
  floorFixture(g);
  const p = g.player();
  p.x = 64;
  g.level.map[9][4] = 3;
  g.level.items["4:9"] = "power";
  tick(g, { a: true }, 24);
  assert.equal(g.level.map[9][4], 4);
  assert.equal(g.powerups[0].type, "mushroom");
  g.setPower(1);
  g.level.map[9][5] = 3;
  g.level.items["5:9"] = "power";
  g.hitBlock(5, 9);
  assert.equal(g.powerups.at(-1).type, "flower");
  g.level.map[9][6] = 2;
  g.hitBlock(6, 9);
  assert.equal(g.level.map[9][6], 0);
  assert.ok(g.particles.length >= 4);
});
test("coins, extra life and score are collectible through collision", () => {
  const g = fresh();
  floorFixture(g);
  g.player().coins = 99;
  g.level.coins = [{ x: 66, y: 194, w: 6, h: 10 }];
  tick(g);
  assert.equal(g.player().coins, 0);
  assert.equal(g.player().lives, 4);
  assert.equal(g.player().score, 200);
  assert.equal(g.level.coins[0].taken, true);
});
test("power-up collision changes size and star protects from enemies", () => {
  const g = fresh();
  floorFixture(g);
  const p = g.player();
  g.powerups = [
    {
      type: "mushroom",
      x: p.x,
      y: p.y,
      w: 14,
      h: 16,
      vx: 0,
      vy: 0,
      alive: true,
    },
  ];
  g.updateItems();
  assert.equal(p.power, 1);
  assert.equal(p.h, 30);
  assert.equal(p.y + p.h, 208);
  g.powerups = [
    { type: "star", x: p.x, y: p.y, w: 14, h: 16, vx: 0, vy: 0, alive: true },
  ];
  g.updateItems();
  assert.equal(p.star, 600);
  g.enemies = [foe("goomba", p.x, p.y)];
  g.updateEnemies();
  assert.equal(g.enemies[0].alive, false);
  assert.equal(p.lives, 3);
});
test("damage shrinks big player, grants invulnerability, then costs one life", () => {
  const g = fresh();
  floorFixture(g);
  g.setPower(2);
  g.hurt();
  assert.equal(g.player().power, 0);
  assert.equal(g.player().lives, 3);
  assert.equal(g.player().invulnerable, 120);
  g.hurt();
  assert.equal(g.player().lives, 3);
  g.player().invulnerable = 0;
  g.hurt();
  assert.equal(g.player().lives, 2);
  g.hurt();
  assert.equal(g.player().lives, 2);
});
test("descending stomp defeats Goomba and turns Koopa into a kickable shell", () => {
  const g = fresh();
  floorFixture(g);
  const p = g.player();
  p.x = 64;
  p.y = 178;
  p.vy = 2;
  g.previousBottom = 188;
  g.enemies = [foe("goomba", 64, 192)];
  g.updateEnemies();
  assert.equal(g.enemies[0].alive, false);
  assert.equal(p.vy, -3.2);
  p.y = 178;
  p.vy = 2;
  g.previousBottom = 188;
  const turtle = foe("koopa", 64, 192);
  g.enemies = [turtle];
  g.updateEnemies();
  assert.equal(turtle.shell, true);
  assert.equal(turtle.vx, 0);
  turtle.y = 194;
  p.y = 192;
  p.x = 55;
  p.vy = 0;
  g.previousBottom = 208;
  g.updateEnemies();
  assert.equal(turtle.vx, 3.4);
  assert.ok(p.invulnerable > 0);
});
test("rolling shell defeats a second enemy", () => {
  const g = fresh();
  floorFixture(g);
  g.player().x = 32;
  const shell = foe("koopa", 90, 194, { shell: true, vx: 3.4, shellTicks: 0 }),
    target = foe("goomba", 100, 194);
  g.enemies = [shell, target];
  g.updateEnemies();
  assert.equal(target.alive, false);
  assert.ok(g.player().score >= 200);
});
test("B fires only in fire form with bounded shots and damages Bowser in five hits", () => {
  const g = fresh();
  floorFixture(g);
  g.setPower(2);
  tick(g, { b: true });
  assert.equal(g.projectiles.length, 1);
  tick(g, { b: true }, 20);
  assert.equal(g.projectiles.length, 1);
  tick(g, {});
  tick(g, { b: true });
  assert.equal(g.projectiles.length, 2);
  const boss = foe("bowser", 100, 160, { hp: 5, w: 28, h: 28 });
  g.enemies = [boss];
  for (let i = 0; i < 5; i++) {
    g.projectiles = [
      {
        owner: "player",
        type: "fire",
        x: 100,
        y: 160,
        w: 6,
        h: 6,
        vx: 0,
        vy: 0,
        life: 30,
      },
    ];
    g.updateItems();
    assert.equal(boss.alive, i < 4);
  }
  assert.equal(boss.hp, 0);
});
test("pipe entry visits a coin room and returns to the same course", () => {
  const g = fresh(),
    pipe = g.level.pipes.find((p) => p.bonus),
    p = g.player();
  assert.ok(pipe);
  const course = g.level;
  p.x = pipe.x + 9;
  p.y = pipe.y - p.h;
  p.vx = p.vy = 0;
  p.grounded = true;
  tick(g, { y: 1 });
  assert.equal(g.level.bonus, true);
  assert.ok(g.level.coins.length >= 20);
  // Return traversal uses normal input, no destination teleport.
  tick(g, { x: 1, b: true }, 200);
  assert.equal(g.level, course);
  assert.equal(g.bonusReturn, null);
  assert.ok(p.x >= pipe.returnX);
});
test("water responds to repeated swimming strokes and sinks between them", () => {
  const g = fresh();
  g.loadStage(5, false);
  g.enemies = [];
  const p = g.player();
  p.x = 50;
  p.y = 120;
  p.vx = p.vy = 0;
  tick(g, { a: true });
  assert.ok(p.vy < 0);
  const upward = p.y;
  tick(g, {}, 100);
  assert.ok(p.y > upward);
  assert.ok(p.y + p.h <= 208);
});
test("death alternates players and preserves their separate progress, score and lives", () => {
  const g = new Game();
  g.selectedPlayers = 2;
  g.begin();
  g.loadStage(2, false);
  g.player().score = 900;
  g.loseLife("test fixture");
  for (let i = 0; i < 91; i++) g.tick([pad(), pad(2)]);
  assert.equal(g.activePlayer, 2);
  assert.equal(g.player().stageIndex, 0);
  assert.equal(g.players[0].stageIndex, 2);
  assert.equal(g.players[0].lives, 2);
  g.loseLife("test fixture");
  for (let i = 0; i < 91; i++) g.tick([pad(), pad(2)]);
  assert.equal(g.activePlayer, 1);
  assert.equal(g.player().stageIndex, 2);
  assert.equal(g.player().score, 900);
});
test("active controller disconnect pauses timers, waiting player disconnect does not", () => {
  const g = new Game();
  g.selectedPlayers = 2;
  g.begin();
  g.tick([pad(), pad(2)]);
  const time = g.time;
  g.tick([pad(2)]);
  assert.equal(g.phase, "paused");
  for (let i = 0; i < 60; i++) g.tick([pad(2)]);
  assert.equal(g.time, time);
  g.tick([pad()]);
  assert.equal(g.phase, "playing");
  assert.equal(g.autoPaused, false);
});
test("timer death, game over and restart title do not continue the previous scene", () => {
  const g = fresh();
  g.player().lives = 1;
  g.time = 1;
  g.timeTicks = 23;
  tick(g);
  assert.ok(g.player().dying);
  tick(g, {}, 91);
  assert.equal(g.phase, "gameover");
  tick(g, { start: true });
  assert.equal(g.phase, "title");
  assert.equal(g.status().players[0].joined, false);
  tick(g, {});
  tick(g, { start: true });
  assert.equal(g.player().lives, 3);
  assert.equal(g.player().stageIndex, 0);
});
test("checkpoint respawn never starts inside a pipe, staircase or pit", () => {
  for (let stage = 0; stage < 32; stage++) {
    const g = fresh();
    g.loadStage(stage, false);
    g.player().checkpointX = g.level.pipes[0]
      ? g.level.pipes[0].x
      : g.level.checkpoint;
    g.setPower(1);
    g.loadStage(stage, true);
    const p = g.player();
    assert.equal(g.isSolid(p.x + 2, p.y + 2), false);
    assert.equal(g.isSolid(p.x + p.w - 2, p.y + p.h - 2), false);
    assert.equal(g.isSolid(p.x + 2, p.y + p.h + 1), true);
  }
});
test("all 32 courses have distinct geometry, defined exits and bounded data", () => {
  const hashes = new Set();
  for (let i = 0; i < 32; i++) {
    const c = Game.buildCourse(i);
    assert.equal(c.label, `${Math.floor(i / 4) + 1}-${(i % 4) + 1}`);
    assert.equal(c.map.length, 15);
    assert.ok(c.width >= 2000);
    assert.ok(c.axe || c.flag);
    assert.ok(c.map.every((row) => row.length === c.width / 16));
    hashes.add(JSON.stringify(c.map));
  }
  assert.equal(hashes.size, 32);
});
// This traversal deliberately removes enemies to isolate geometry/collision reachability.
// It never moves the character, edits terrain, calls finishStage, grants flight, or teleports
// between stages: 32 natural flag/axe exits and the real inter-stage transition are exercised.
function traverse(g, index) {
  const configs = {
    7: [24, 32],
    10: [24, 24, true],
    12: [24, 32],
    22: [8, 24],
    26: [40, 40, true],
    27: [24, 32],
    30: [24, 32],
    31: [24, 40],
  };
  const [gap, wall, lookUp] = configs[index] || [24, 24, false];
  g.enemies = [];
  let lastA = false;
  for (let frame = 0; frame < 4000; frame++) {
    const p = g.player();
    let a = false,
      x = 1;
    if (g.level.type === "water") a = p.y > 90 && frame % 20 === 0;
    else if (!p.grounded) a = lastA;
    else {
      let danger = false;
      for (let dx = 2; dx <= wall; dx += 3)
        if (
          g.isSolid(p.x + p.w + dx, p.y + 2) ||
          g.isSolid(p.x + p.w + dx, p.y + p.h - 2)
        )
          danger = true;
      for (let dx = 2; dx <= gap; dx += 3)
        if (!g.isSolid(p.x + p.w + dx, p.y + p.h + 4)) danger = true;
      a = danger && !lastA;
    }
    if (lookUp && p.grounded && !lastA)
      for (let dx = 2; dx <= wall; dx += 3)
        for (let dy = 16; dy <= 64; dy += 16)
          if (g.isSolid(p.x + p.w + dx, p.y - dy)) a = true;
    if (lookUp && p.vy > 0) a = false;
    if (g.level.axe && p.x > g.level.axe.x - 8) {
      x = p.x > g.level.axe.x + 3 ? -1 : 0;
      a = false;
    }
    tick(g, { x, b: true, a });
    lastA = a;
    assert.equal(p.dying, 0, `geometry death at ${index + 1}, ${p.x}, ${p.y}`);
    if (g.clearTicks) return frame;
  }
  assert.fail(`No reachable exit in stage ${index + 1}`);
}
test("continuous natural-input traversal reaches all 32 exits and the final ending", () => {
  const g = fresh();
  let total = 0;
  for (let stage = 0; stage < 32; stage++) {
    assert.equal(g.player().stageIndex, stage);
    total += traverse(g, stage);
    assert.ok(g.clearTicks);
    if (g.level.axe)
      assert.ok(
        g.level.map[12]
          .slice(g.level.bridgeStart, g.level.bridgeStart + 15)
          .every((v) => v === 0),
      );
    while (g.clearTicks && g.phase === "playing") tick(g);
  }
  assert.equal(g.phase, "ending");
  assert.equal(g.winner, 1);
  assert.equal(g.player().won, true);
  assert.ok(g.player().lives >= 3);
  assert.ok(total > 30000);
  assert.ok(g.player().score > 100000);
});
test("fixed-step integration is refresh-rate independent and high score rejects invalid data", () => {
  const a = fresh(),
    b = fresh();
  floorFixture(a);
  floorFixture(b);
  for (let i = 0; i < 120; i++) a.step(1 / 60, [pad(1, { x: 1, b: true })]);
  for (let i = 0; i < 240; i++) b.step(1 / 120, [pad(1, { x: 1, b: true })]);
  assert.ok(Math.abs(a.player().x - b.player().x) < 0.01);
  assert.equal(new Game({ highScore: Infinity }).highScore, 0);
});
test("first course reaches its flag using only controller input with all real enemies enabled", () => {
  const g = fresh();
  let previousA = false,
    reached = false;
  const initialEnemies = g.enemies.length;
  assert.ok(initialEnemies > 0);
  for (let frame = 0; frame < 4000; frame++) {
    const p = g.player();
    let a = false;
    if (!p.grounded) a = previousA;
    else {
      let danger = false;
      for (let dx = 2; dx <= 24; dx += 3)
        if (
          g.isSolid(p.x + p.w + dx, p.y + 2) ||
          g.isSolid(p.x + p.w + dx, p.y + p.h - 2) ||
          !g.isSolid(p.x + p.w + dx, p.y + p.h + 4)
        )
          danger = true;
      for (const e of g.enemies)
        if (
          e.alive &&
          e.x > p.x + p.w - 4 &&
          e.x - p.x - p.w < 24 &&
          Math.abs(e.y - p.y) < 40
        )
          danger = true;
      a = danger && !previousA;
    }
    tick(g, { x: 1, b: true, a });
    previousA = a;
    assert.equal(p.dying, 0);
    if (g.clearTicks) {
      reached = true;
      break;
    }
  }
  assert.equal(reached, true);
  assert.equal(g.player().lives, 3);
  assert.ok(g.enemies.some((e) => e.age > 0));
});
test("music changes use the same persisted callback for TV button and paused SELECT", () => {
  const saved = [],
    g = new Game({ muted: true, saveMuted: (v) => saved.push(v) });
  g.toggleMusic();
  assert.equal(g.muted, false);
  g.begin();
  tick(g, { start: true });
  tick(g);
  tick(g, { select: true });
  assert.equal(g.muted, true);
  assert.deepEqual(saved, [false, true]);
});

test("large player crouch-slides through a low ceiling and stands only after clearing it", () => {
  const g = fresh();
  floorFixture(g);
  g.setPower(1);
  const p = g.player();
  for (let col = 6; col <= 9; col++) g.level.map[11][col] = 2;
  p.vx = 3.1;
  tick(g, { y: 1 }, 12);
  assert.equal(p.h, 16);
  assert.equal(p.y + p.h, 208);
  assert(p.x > 90, "momentum should carry the crouching character into the tunnel");
  tick(g, { x: 1 }, 10);
  assert.equal(p.crouching, true, "releasing down cannot stand through solid bricks");
  assert.equal(g.clearBody(p.x, p.y, p.w, p.h), true);
  tick(g, { x: 1 }, 90);
  assert(p.x > 160);
  assert.equal(p.crouching, false);
  assert.equal(p.h, 30);
  assert.equal(p.y + p.h, 208);
});

test("moving lifts carry a grounded player through rising and falling parts of their cycle", () => {
  const g = fresh();
  floorFixture(g);
  const platform = { x: 48, y: 150, w: 64, baseY: 150, phase: -g.frame, range: 20 };
  g.level.platforms = [platform];
  const p = g.player();
  p.y = platform.y - p.h;
  const heights = [];
  for (let i = 0; i < 330; i++) {
    tick(g);
    heights.push(p.y);
    assert.equal(p.grounded, true);
    assert(Math.abs(p.y + p.h - platform.y) < 0.01);
  }
  assert(Math.max(...heights) - Math.min(...heights) > 39);
});

test("successive airborne stomps escalate to an extra life and landing resets the chain", () => {
  const g = fresh();
  floorFixture(g);
  const p = g.player();
  for (let i = 0; i < 9; i++) {
    p.x = 64; p.y = 144; p.vy = 1; p.grounded = false;
    g.previousBottom = 158;
    const enemy = foe("goomba", 64, 158);
    g.enemies = [enemy];
    g.updateEnemies();
    assert.equal(enemy.alive, false);
  }
  assert.equal(p.stompChain, 9);
  assert.equal(p.score, 16500);
  assert.equal(p.lives, 4);
  assert.equal(g.particles.at(-1).text, "1UP");
  g.enemies = [];
  tick(g, {}, 80);
  assert.equal(p.grounded, true);
  assert.equal(p.stompChain, 0);
});

test("a moving shell tracks its own escalating chain independently of player stomps", () => {
  const g = fresh();
  floorFixture(g);
  const shell = foe("koopa", 150, 194, { shell: true, vx: 3.4, chain: 0 });
  g.enemies = [shell];
  for (let i = 0; i < 7; i++) {
    const target = foe("goomba", shell.x + 8, 194);
    g.enemies.push(target);
    g.updateEnemies();
    assert.equal(target.alive, false);
  }
  assert.equal(shell.chain, 7);
  assert.equal(g.player().score, 16300);
  assert.equal(g.player().lives, 4);
  assert.equal(g.player().stompChain, 0);
});
