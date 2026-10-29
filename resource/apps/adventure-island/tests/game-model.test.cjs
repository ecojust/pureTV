"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Game = require("../src/main/assets/game-model.js");
const connected = (id, extra = {}) =>
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
function frames(g, count, one = {}, two = {}) {
  for (let i = 0; i < count; i++)
    g.step(1 / 60, [connected(1, one), connected(2, two)]);
}
function started(two = false) {
  let g = new Game();
  if (two) {
    frames(g, 1, { select: true });
    frames(g, 1);
  }
  frames(g, 1, { start: true });
  frames(g, 1);
  return g;
}
function clean(g) {
  g.level.enemies = [];
  g.level.hazards = [];
  g.level.items = [];
  g.level.eggs = [];
}

test("32 fixed routes, four checkpoints, eight distinct boss arenas and escalating head HP", () => {
  assert.equal(Game.ROUTES.length, 32);
  assert.equal(new Set(Game.ROUTES.map((r) => r.join("/"))).size, 32);
  for (let i = 0; i < 32; i++) {
    let l = Game.makeLevel(i);
    assert.equal(l.label, `${Math.floor(i / 4) + 1}-${(i % 4) + 1}`);
    assert.equal(l.checkpoints.length, 4);
    assert.ok(l.width >= 2000);
    assert.ok(l.items.length >= 12);
    assert.ok(l.enemies.length >= 5);
    for (let p of l.checkpoints)
      assert.ok(
        l.ground.some((t) => p >= t.x && p + 14 <= t.x + t.w),
        "checkpoint starts on solid ground",
      );
    assert.equal(Boolean(l.boss), i % 4 === 3);
    if (l.boss) assert.equal(l.boss.hp, 8 + 2 * Math.floor(i / 4));
    for (let gap of l.gaps) assert.ok(gap.w <= 64);
  }
});

test("A has a rising edge jump, hold gives additional height, B increases running speed", () => {
  let short = started(),
    long = started();
  clean(short);
  clean(long);
  frames(short, 1, { a: true });
  frames(short, 14);
  frames(long, 15, { a: true });
  assert.ok(long.current().y < short.current().y - 8);
  assert.ok(long.current().vy < 0);
  frames(short, 70, { a: true });
  assert.ok(short.current().grounded, "holding A never auto hops");
  let walk = started(),
    run = started();
  clean(walk);
  clean(run);
  frames(walk, 24, { x: 1 });
  frames(run, 24, { x: 1, b: true });
  assert.ok(run.current().x > walk.current().x + 15);
});

test("touch opens the first egg, then collecting its axe equips it; at most two active shots", () => {
  const g = started();
  frames(g, 26, { x: 1, b: true });
  assert.equal(g.level.eggs[0].open, true);
  assert.equal(g.current().weapon, "none", "opening is distinct from collecting");
  frames(g, 4, { x: 1, b: true });
  assert.equal(g.current().weapon, "axe");
  frames(g, 1);
  frames(g, 1, { b: true });
  assert.equal(g.projectiles.length, 1);
  frames(g, 1);
  frames(g, 1, { b: true });
  assert.equal(g.projectiles.length, 2);
  assert.equal(g.throwWeapon(), false);
});

test("vitality starts at 11, decreases with time, fruit replenishes and milk fills 16", () => {
  let g = started();
  clean(g);
  assert.equal(g.current().energy, 11);
  frames(g, 110);
  assert.equal(g.current().energy, 10);
  g.pickup("apple");
  assert.equal(g.current().energy, 12);
  g.pickup("milk");
  assert.equal(g.current().energy, 16);
  g.pickup("banana");
  assert.equal(g.current().energy, 16);
  g.pickup("eggplant");
  frames(g, 25);
  assert.equal(g.current().energy, 15);
  g.pickup("milk");
  assert.equal(g.current().eggplant, false);
});

test("rock costs two vitality without death; fire/contact costs a life; skateboard absorbs one hit", () => {
  let g = started();
  clean(g);
  let p = g.current();
  g.level.hazards = [
    { type: "rock", x: p.x, y: 190, w: 13, h: 10, cooldown: 0 },
  ];
  frames(g, 1);
  assert.equal(p.energy, 9);
  assert.equal(p.lives, 3);
  assert.ok(p.stun);
  g.pickup("board");
  g.hit("enemy");
  assert.equal(p.skateboard, false);
  assert.equal(p.lives, 3);
  assert.ok(p.invulnerable);
  p.invulnerable = 0;
  g.hit("fire");
  assert.equal(p.lives, 2);
  assert.equal(g.transition.type, "death");
});

test("invincibility and a skateboard never prevent drowning, pits or starvation", () => {
  for (const reason of ["water", "pit", "energy"]) {
    let g = started(),
      p = g.current();
    p.fairy = 600;
    p.invulnerable = 90;
    p.skateboard = true;
    g.hit(reason);
    assert.equal(p.lives, 2, reason);
    assert.equal(g.transition.type, "death");
  }
});

test("normal enemy cannot be stomped; fairy contact defeats it and expires", () => {
  let g = started();
  clean(g);
  let p = g.current();
  g.level.enemies = [
    {
      type: "snake",
      x: p.x,
      y: p.y,
      w: 16,
      h: 14,
      homeX: p.x,
      homeY: p.y,
      age: 0,
      alive: true,
    },
  ];
  frames(g, 1);
  assert.equal(g.transition.type, "death");
  g = started();
  clean(g);
  p = g.current();
  g.pickup("honey");
  g.level.enemies = [
    {
      type: "snake",
      x: p.x,
      y: p.y,
      w: 16,
      h: 14,
      homeX: p.x,
      homeY: p.y,
      age: 0,
      alive: true,
    },
  ];
  frames(g, 1);
  assert.equal(g.level.enemies[0].alive, false);
  assert.equal(p.lives, 3);
  frames(g, 599);
  assert.equal(p.fairy, 0);
});

test("two weapon hits open an egg and jumping at hidden spot reveals it", () => {
  let g = started();
  clean(g);
  let egg = {
    type: "axe",
    x: 180,
    y: 180,
    w: 16,
    h: 16,
    hidden: false,
    hits: 0,
    open: false,
  };
  g.level.eggs = [egg];
  function shoot() {
    g.projectiles.push({
      x: 177,
      y: 183,
      w: 8,
      h: 8,
      vx: 3,
      vy: 0,
      type: "axe",
      life: 90,
    });
    g.updateWorld();
  }
  shoot();
  assert.equal(egg.hits, 1);
  assert.equal(egg.open, false);
  shoot();
  assert.equal(egg.open, true);
  assert.equal(g.current().weapon, "none", "shooting from afar does not equip the item");
  assert.equal(g.level.items.filter((item) => item.released).length, 1);
  const released = g.level.items[0];
  assert.equal(released.type, "axe");
  assert.equal(released.taken, false);
  g.current().x = released.x;
  frames(g, 4);
  assert.equal(g.current().weapon, "axe");
  assert.equal(released.taken, true);
  egg = {
    type: "pot",
    x: 60,
    y: 184,
    w: 16,
    h: 16,
    hidden: true,
    hits: 0,
    open: false,
  };
  g.level.eggs = [egg];
  g.current().x = 60;
  g.cameraX = 0;
  frames(g, 10, { a: true });
  assert.equal(egg.hidden, false);
});

test("fire upgrade breaks stones that axes cannot destroy", () => {
  let g = started();
  clean(g);
  g.pickup("axe");
  g.pickup("fire");
  assert.equal(g.current().weapon, "fire");
  let rock = { type: "rock", x: 130, y: 190, w: 13, h: 10, dead: false };
  g.level.hazards = [rock];
  g.projectiles = [
    { x: 128, y: 186, w: 8, h: 8, vx: 1, vy: 0, type: "axe", life: 90 },
  ];
  g.updateWorld();
  assert.equal(rock.dead, false);
  g.projectiles = [
    { x: 128, y: 186, w: 8, h: 8, vx: 1, vy: 0, type: "fire", life: 90 },
  ];
  g.updateWorld();
  assert.equal(rock.dead, true);
});

test("extra lives awarded once at 50k, 100k and 200k; pot doubles clear vitality bonus", () => {
  let g = started();
  g.addScore(50000);
  assert.equal(g.current().lives, 4);
  g.addScore(150000);
  assert.equal(g.current().lives, 6);
  g.addScore(1);
  assert.equal(g.current().lives, 6);
  let p = g.current();
  p.pot = true;
  p.energy = 7;
  const prior = p.score;
  g.finishStage();
  assert.equal(p.score - prior, 1400);
  assert.equal(g.highScore, p.score);
});

test("boss body is not a weak point, head takes hits, stage advances after defeating it", () => {
  let g = started();
  g.loadStage(3);
  clean(g);
  let boss = g.level.boss,
    p = g.current();
  p.x = boss.x - 70;
  g.cameraX = g.level.width - 256;
  g.projectiles = [
    {
      x: boss.x + 7,
      y: boss.y + 25,
      w: 8,
      h: 8,
      vx: 0,
      vy: 0,
      type: "axe",
      life: 90,
    },
  ];
  g.updateWorld();
  assert.equal(boss.hp, 8);
  for (let i = 0; i < 8; i++) {
    boss.flash = 0;
    g.projectiles = [
      {
        x: boss.x + 7,
        y: boss.y + 2,
        w: 8,
        h: 8,
        vx: 0,
        vy: 0,
        type: "axe",
        life: 90,
      },
    ];
    g.updateWorld();
  }
  assert.equal(boss.alive, false);
  p.x = g.level.goalX;
  g.updateWorld();
  assert.equal(g.transition.type, "clear");
  frames(g, 90);
  assert.equal(p.stage, 4);
  assert.equal(g.status().stageLabel, "2-1");
});

test("all 32 transitions reach final ending and retain scores", () => {
  let g = started();
  for (let i = 0; i < 32; i++) {
    assert.equal(g.current().stage, i);
    g.finishStage();
    frames(g, 90);
  }
  assert.equal(g.phase, "ending");
  assert.ok(g.current().score > 30000);
  frames(g, 1, { start: true });
  assert.equal(g.phase, "title");
});

test("two-player alternating turns preserve independent stage, checkpoint, lives and scores", () => {
  let g = started(true);
  g.finishStage();
  frames(g, 90);
  assert.equal(g.current().stage, 1);
  g.current().checkpoint = g.level.checkpoints[1];
  const checkpoint = g.current().checkpoint;
  g.addScore(123);
  const score = g.current().score;
  g.loseLife("enemy");
  frames(g, 70);
  assert.equal(g.activePlayer, 2);
  assert.equal(g.current().stage, 0);
  assert.equal(g.current().lives, 3);
  g.loseLife("enemy");
  frames(g, 70);
  assert.equal(g.activePlayer, 1);
  assert.equal(g.current().stage, 1);
  assert.equal(g.current().checkpoint, checkpoint);
  assert.equal(g.current().x, checkpoint);
  assert.equal(g.current().score, score);
  assert.equal(g.current().lives, 2);
});

test("only active player disconnect pauses; reconnect restores auto pause; manual pause remains", () => {
  let g = started(true);
  g.step(1 / 60, [connected(1)]);
  assert.equal(g.phase, "playing");
  g.step(1 / 60, [connected(2)]);
  assert.equal(g.phase, "paused");
  assert.equal(g.autoPaused, true);
  frames(g, 1);
  assert.equal(g.phase, "playing");
  frames(g, 1, { start: true });
  assert.equal(g.phase, "paused");
  frames(g, 1);
  assert.equal(g.phase, "paused");
  frames(g, 1, { select: true });
  assert.equal(g.muted, true);
  frames(g, 1);
  frames(g, 1, { start: true });
  assert.equal(g.phase, "playing");
});

test("waiting player cannot pause active player or move their character", () => {
  const g = started(true),
    x = g.current().x;
  frames(g, 12, {}, { x: 1, a: true, b: true, start: true });
  assert.equal(g.phase, "playing");
  assert.equal(g.current().x, x);
  assert.equal(g.current().grounded, true);
});

test("exhausted player is skipped and game over happens only when all selected lives are gone", () => {
  let g = started(true);
  g.players[0].lives = 1;
  g.loseLife("enemy");
  frames(g, 70);
  assert.equal(g.activePlayer, 2);
  assert.equal(g.players[0].alive, false);
  g.players[1].lives = 1;
  g.loseLife("enemy");
  frames(g, 70);
  assert.equal(g.phase, "gameover");
});

test("all 32 reconstructed terrain paths can be crossed by the actual jump/move integrator", () => {
  // Enemy/energy fixtures are disabled only in this geometry proof; terrain and physics are unchanged.
  // Each test driver jumps before a pit or raised step, stops inputs after landing, and walks the route.
  for (let stage = 0; stage < 32; stage++) {
    let g = started();
    g.loadStage(stage);
    clean(g);
    g.level.boss = null;
    let p = g.current(),
      holding = 0,
      lastGrounded = true;
    for (let tick = 0; tick < 4000 && !g.transition; tick++) {
      p.energy = 16;
      let obstacle = g.level.gaps.find(
        (h) => h.x > p.x + p.w && h.x - p.x - p.w < 25,
      );
      if (p.grounded && obstacle && !holding)
        holding = obstacle.w <= 40 ? 8 : obstacle.w <= 48 ? 15 : 22;
      let a = holding > 0;
      if (holding) holding--;
      frames(g, 1, { x: 1, b: true, a });
      assert.notEqual(
        g.transition && g.transition.type,
        "death",
        `terrain route ${stage + 1} fell at x=${p.x} y=${p.y}`,
      );
      lastGrounded = p.grounded;
    }
    assert.equal(
      g.transition && g.transition.type,
      "clear",
      `route ${stage + 1} did not finish at x=${p.x}`,
    );
  }
});

test("first forest and coast stages clear through ordinary controls with all hazards, vitality and items enabled", () => {
  for (const stage of [0, 1]) {
    const g = started();
    g.loadStage(stage);
    const p = g.current();
    let hold = 0;
    for (let tick = 0; tick < 2400 && !g.transition; tick++) {
      const gap = g.level.gaps.find(
        (h) => h.x > p.x + p.w && h.x - p.x - p.w < 25,
      );
      const fire = g.level.hazards.find(
        (h) => h.type === "fire" && h.x > p.x && h.x - p.x < 31,
      );
      if (p.grounded && !hold && (gap || fire))
        hold = gap ? (gap.w <= 40 ? 8 : gap.w <= 48 ? 15 : 22) : 30;
      const a = hold > 0;
      if (hold) hold--;
      frames(g, 1, { x: 1, b: tick % 16 !== 0, a });
    }
    assert.equal(
      g.transition && g.transition.type,
      "clear",
      `actual stage ${stage + 1}`,
    );
    assert.equal(p.lives, 3);
    assert.ok(p.energy > 0);
    assert.ok(p.score > 0);
    assert.notEqual(p.weapon, "none");
  }
});

test("all eight bosses can be defeated by real B throwing and movement within starting vitality", () => {
  // Only position and the axe pickup are seeded at the arena; shots, collision, boss AI,
  // invulnerability windows, vitality and win detection execute their normal update paths.
  for (let stage = 3; stage < 32; stage += 4) {
    const g = started();
    g.loadStage(stage);
    const p = g.current(),
      boss = g.level.boss;
    p.x = g.level.width - 180;
    g.cameraX = g.level.width - 256;
    g.pickup("axe");
    for (let tick = 0; tick < 1200 && boss.alive && !g.transition; tick++) {
      const distance = boss.x - p.x,
        x = distance > 45 ? 1 : distance < 38 ? -1 : 0;
      frames(g, 1, { x, b: tick % 16 !== 0 });
    }
    assert.equal(boss.alive, false, `area ${Math.floor(stage / 4) + 1}`);
    assert.equal(p.lives, 3);
    assert.ok(p.energy > 0);
    for (let tick = 0; tick < 180 && !g.transition; tick++)
      frames(g, 1, { x: 1, b: true });
    assert.equal(g.transition && g.transition.type, "clear");
    frames(g, 90);
    assert.equal(g.phase, stage === 31 ? "ending" : "playing");
  }
});


test("released egg contents arc, land on terrain and cannot be collected twice", () => {
  const g = started();
  clean(g);
  const egg = { type: "milk", x: 180, y: 184, w: 16, h: 16, hidden: false, open: false };
  g.level.eggs = [egg];
  g.openEgg(egg);
  g.openEgg(egg);
  assert.equal(g.level.items.length, 1, "one item per egg");
  const item = g.level.items[0];
  frames(g, 8);
  assert.ok(item.y < egg.y - 15, "contents visibly pop out of the shell");
  frames(g, 42);
  assert.equal(item.y, 188, "item settles on the ground");
  assert.equal(item.vy, 0);
  assert.equal(item.taken, false);
  g.current().x = item.x;
  g.current().energy = 3;
  frames(g, 1);
  assert.equal(g.current().energy, 16);
  assert.equal(g.current().score, 1000);
  frames(g, 10);
  assert.equal(g.current().score, 1000);
});

test("a released skateboard rolls forward; falling contents cannot be picked up remotely", () => {
  const g = started();
  clean(g);
  const egg = { type: "board", x: 180, y: 184, w: 16, h: 16, hidden: false, open: false };
  g.openEgg(egg);
  const item = g.level.items[0];
  frames(g, 40);
  assert.ok(item.x > 210);
  assert.equal(g.current().skateboard, false);
  g.level.ground = [];
  for (let i = 0; i < 50; i++) g.updateWorld();
  assert.equal(item.taken, true, "out-of-world items expire");
  assert.equal(g.current().skateboard, false);
});

test("birds commit to a readable dive then climb away; offscreen enemies remain asleep", () => {
  const g = started();
  clean(g);
  const bird = { type: "bird", x: 140, y: 110, homeX: 140, homeY: 110,
    w: 16, h: 14, age: 0, alive: true };
  const distant = Object.assign({}, bird, { x: 600, homeX: 600 });
  g.level.enemies = [bird, distant];
  g.updateWorld();
  assert.equal(bird.diving, true);
  const target = bird.targetY;
  const startY = bird.y;
  g.current().y = 30;
  for (let i = 0; i < 20; i++) g.updateWorld();
  assert.equal(bird.targetY, target, "dive does not unfairly track a dodge");
  assert.ok(bird.y > startY + 20);
  for (let i = 0; i < 15; i++) g.updateWorld();
  const bottom = bird.y;
  for (let i = 0; i < 10; i++) g.updateWorld();
  assert.ok(bird.y < bottom - 5);
  assert.equal(distant.age, 0);
});
