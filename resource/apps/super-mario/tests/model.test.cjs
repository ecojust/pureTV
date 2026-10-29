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
    if (g.level.axe) {
      // This geometry-only route removed every enemy: with no living boss,
      // the axe skips the collapse and preserves the intact bridge.
      assert.equal(g.clearSequence.phase, "walk");
      assert(g.level.map[12].slice(g.level.bridgeStart, g.level.bridgeStart + 15).every((v) => v === 10));
    }
    let clearFrames = 0;
    while (g.clearTicks && g.phase === "playing" && clearFrames++ < 600) tick(g);
    assert(clearFrames < 600, "goal sequence must complete without extra input: " + JSON.stringify({stage, sequence:g.clearSequence, x:g.player().x, y:g.player().y}));
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

function touchGoal(g, time = 213, y = 90) {
  const p = g.player();
  g.enemies = [];
  g.time = time;
  g.timeTicks = 0;
  p.x = g.level.flag.x - p.w;
  p.y = y;
  p.vx = p.vy = 0;
  p.grounded = false;
  tick(g);
  assert.equal(g.clearSequence.phase, "slide");
  return p;
}

test("flag clear locks to the pole, slides before walking, then hides inside the castle", () => {
  const g = fresh(), p = touchGoal(g, 213, 90), flagX = g.level.flag.x;
  const score = p.score;
  assert.equal(score, 2000);
  assert.equal(p.x + p.w, flagX);
  const time = g.time;
  tick(g, { x: -1, a: true, b: true }, 10);
  assert.equal(p.x + p.w, flagX, "controls cannot pull Mario off the clear animation");
  assert.equal(p.y, 110.48);
  assert.equal(g.time, time, "timer tally waits for the castle entry");
  while (g.clearSequence.phase === "slide") tick(g);
  assert.equal(p.y + p.h, 192);
  assert.equal(g.clearSequence.flagY, 178);
  while (g.clearSequence.phase === "walk") tick(g);
  assert.equal(p.x, g.level.castleX + 24);
  assert.equal(p.y + p.h, 208);
  assert.equal(g.clearSequence.hidden, true);
  assert.equal(g.clearSequence.phase, "tally");
});

test("fireworks use the touch-time last digit, award 500 each, and tally time once", () => {
  for (const time of [210, 211, 213, 216, 218]) {
    const g = fresh(), p = touchGoal(g, time, 190);
    const goalScore = p.score;
    let fireworks = 0, frames = 0;
    while (p.stageIndex === 0 && frames++ < 600) {
      g.step(1 / Game.FPS, [pad()]);
      fireworks += g.events.filter((e) => e.type === "firework").length;
    }
    const expected = [1, 3, 6].includes(time % 10) ? time % 10 : 0;
    assert.equal(fireworks, expected);
    assert.equal(p.score, goalScore + time * 50 + expected * 500);
    assert.equal(p.stageIndex, 1);
    assert.equal(g.clearSequence, null);
  }
});

test("flagpole awards all five height tiers without granting a top-of-pole extra life", () => {
  for (const [y, score] of [[60, 5000], [100, 2000], [140, 800], [170, 400], [190, 100]]) {
    const g = fresh();
    touchGoal(g, 210, y);
    assert.equal(g.player().score, score);
    assert.equal(g.player().lives, 3);
  }
});

test("a living castle boss falls as the axe removes bridge segments in order", () => {
  const g = fresh();
  g.loadStage(3, false);
  const boss = g.enemies.find((e) => e.type === "bowser"), p = g.player();
  g.enemies = [boss];
  p.x = g.level.axe.x; p.y = 176; p.vx = p.vy = 0;
  tick(g);
  assert.equal(g.clearSequence.phase, "bridge");
  assert.equal(boss.alive, true);
  const bridge = () => g.level.map[12].slice(g.level.bridgeStart, g.level.bridgeStart + 15);
  assert.equal(bridge().filter(Boolean).length, 15);
  tick(g, {}, 4);
  assert.equal(bridge().filter(Boolean).length, 14);
  assert.equal(bridge()[14], 0, "collapse starts at the axe end");
  const initialY = boss.y;
  assert(boss.x >= g.cameraX && boss.x + boss.w <= g.cameraX + 256, "boss stays visible during the collapse");
  let sawFalling = false, frames = 0;
  while (g.clearSequence.phase === "bridge" && frames++ < 200) {
    tick(g);
    if (boss.alive && boss.y > initialY + 4) sawFalling = true;
  }
  assert.equal(sawFalling, true);
  assert.equal(boss.alive, false);
  assert.equal(bridge().filter(Boolean).length, 0);
  assert.equal(g.clearSequence.phase, "walk");
  assert.equal(g.clearSequence.fireworks, 0);
  assert.equal(p.lives, 3);
});

test("an already defeated castle boss skips collapse and goal animations freeze while paused or disconnected", () => {
  const g = fresh();
  g.loadStage(3, false);
  g.enemies.find((e) => e.type === "bowser").alive = false;
  g.time = 216;
  const p = g.player();
  p.x = g.level.axe.x; p.y = 176; p.vx = p.vy = 0;
  tick(g);
  assert.equal(g.clearSequence.phase, "walk");
  assert.equal(g.clearSequence.fireworks, 0);
  assert(g.level.map[12].slice(g.level.bridgeStart, g.level.bridgeStart + 15).every((v) => v === 10));
  tick(g, { start: true });
  const paused = JSON.stringify([g.clearSequence, p.x, p.y, g.time, p.score]);
  tick(g, {}, 60);
  assert.equal(JSON.stringify([g.clearSequence, p.x, p.y, g.time, p.score]), paused);
  tick(g, { start: true });
  g.tick([]);
  const disconnected = JSON.stringify([g.clearSequence, p.x, p.y, g.time, p.score]);
  for (let i = 0; i < 60; i++) g.tick([]);
  assert.equal(JSON.stringify([g.clearSequence, p.x, p.y, g.time, p.score]), disconnected);
  tick(g);
  assert.equal(g.phase, "playing");
});

function fireball(x, y, extra = {}) {
  return Object.assign({ owner: "player", type: "fire", x, y, w: 6, h: 6, vx: 3.6, vy: 0, life: 180 }, extra);
}
test("fireballs stop at brick sides, bounce only when descending onto a top, and cannot damage through walls", () => {
  const g = fresh();
  floorFixture(g);
  g.level.map[10][8] = 2;
  const protectedEnemy = foe("goomba", 128, 156);
  g.enemies = [protectedEnemy];
  g.projectiles = [fireball(123, 156)];
  g.updateItems();
  assert.equal(g.projectiles.length, 0);
  assert.equal(protectedEnemy.alive, true);
  g.enemies = [];
  const falling = fireball(130, 152, { vx: 0, vy: 3 });
  g.projectiles = [falling];
  g.updateItems();
  assert.equal(falling.y, 154);
  assert.equal(falling.vy, -3.2);
  assert.equal(g.projectiles.length, 1);
});
test("one fireball hits one enemy and Buzzy Beetles absorb it without taking damage", () => {
  const g = fresh();
  floorFixture(g);
  const first = foe("goomba", 100, 180), second = foe("goomba", 100, 180);
  g.enemies = [first, second];
  g.projectiles = [fireball(100, 180, { vx: 0 })];
  g.updateItems();
  assert.equal(first.alive, false);
  assert.equal(second.alive, true);
  const beetle = foe("buzzy", 100, 180);
  g.enemies = [beetle, second];
  g.projectiles = [fireball(100, 180, { vx: 0 })];
  g.updateItems();
  assert.equal(beetle.hp, 1);
  assert.equal(second.alive, true);
  assert.equal(g.projectiles.length, 0);
});
test("power items rise out of a block before they can move or be collected", () => {
  const g = fresh();
  floorFixture(g);
  g.level.map[9][4] = 3;
  g.level.items["4:9"] = "power";
  g.hitBlock(4, 9);
  const item = g.powerups[0], p = g.player();
  assert.equal(item.y, 144);
  const x = item.x;
  p.x = item.x; p.y = 128; p.vx = p.vy = 0;
  for (let i = 0; i < 32; i++) {
    g.updateItems();
    assert.equal(item.alive, true, "cannot collect an emerging mushroom");
    assert.equal(item.x, x);
    assert.equal(p.power, 0);
  }
  assert.equal(item.y, 128);
  assert.equal(item.emergeTicks, 0);
  g.updateItems();
  assert.equal(item.alive, false);
  assert.equal(p.power, 1);
});
test("large characters enter bonus rooms above supported ground and all flag exits have clear castle approaches", () => {
  const g = fresh();
  g.setPower(1);
  g.enterBonus(g.level.pipes.find((pipe) => pipe.bonus));
  assert.equal(g.player().y + g.player().h, 208);
  assert.equal(g.clearBody(g.player().x, g.player().y, g.player().w, g.player().h), true);
  for (let stage = 0; stage < 32; stage++) {
    const level = Game.buildCourse(stage);
    if (!level.flag) continue;
    for (let x = level.flag.x / 16; x < level.map[0].length; x++) {
      assert(level.map.slice(3, 13).every((row) => row[x] === 0), "clear exit in stage " + stage);
      assert.equal(level.map[13][x], 1);
    }
  }
});
test("repeated clear requests do not duplicate a two-player stage reward or steal the active turn", () => {
  const g = new Game();
  g.selectedPlayers = 2; g.begin();
  const p = touchGoal(g, 211, 100), other = JSON.stringify(g.players[1]);
  const sequence = g.clearSequence;
  g.finishStage(); g.finishStage();
  assert.equal(g.clearSequence, sequence);
  for (let frames = 0; p.stageIndex === 0 && frames < 600; frames++) g.tick([pad(), pad(2)]);
  assert.equal(p.stageIndex, 1);
  assert.equal(p.score, 2000 + 211 * 50 + 500);
  assert.equal(g.activePlayer, 1);
  assert.equal(JSON.stringify(g.players[1]), other);
});

test("enemy placement stride does not accidentally exclude Koopas from worlds three and six", () => {
  for (const stage of [8, 9, 10, 20, 21, 22]) {
    const course = Game.buildCourse(stage);
    assert(course.enemies.some((e) => e.type === "koopa"), "mixed enemies in " + course.label);
    assert(course.enemies.some((e) => e.type === "goomba"), "mixed enemies in " + course.label);
  }
});
