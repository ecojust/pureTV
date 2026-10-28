"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const Game = require("../src/main/assets/game-model.js"),
  Levels = require("../src/main/assets/levels.js");
const neutral = (id = 1) => ({
  id,
  connected: true,
  x: 0,
  y: 0,
  a: false,
  b: false,
  start: false,
  select: false,
});
function tick(g, input = {}, n = 1, second) {
  for (let i = 0; i < n; i++)
    g.step(
      1 / 60,
      [Object.assign(neutral(), input)].concat(second ? [second] : []),
    );
}
function start(two) {
  const g = new Game();
  g.selectedPlayers = two ? 2 : 1;
  tick(g, { start: true }, 1, two ? neutral(2) : null);
  tick(g, {}, 1, two ? neutral(2) : null);
  return g;
}
function jumpApex(y) {
  const g = start();
  g.room.enemies = [];
  const begin = g.player.y;
  tick(g, { a: true, y });
  let min = g.player.y;
  for (let i = 0; i < 120; i++) {
    tick(g, { a: false });
    min = Math.min(min, g.player.y);
  }
  return begin - min;
}
test("normal, high and low jumps have different physical arcs", () => {
  const low = jumpApex(1),
    normal = jumpApex(0),
    high = jumpApex(-1);
  assert(low > 25);
  assert(normal > low + 35);
  assert(high > normal + 35);
});
test("A slows only descent and actor lands on raised ledge without tunnelling", () => {
  const g = start();
  g.room.enemies = [];
  g.player.x = 84;
  g.player.y = 90;
  g.player.vy = 1;
  g.player.onGround = false;
  tick(g, { a: true }, 20);
  assert(g.player.vy <= 0.55);
  assert(g.player.y < 105);
  tick(g, {}, 60);
  assert.equal(g.player.y, 144);
  assert.equal(g.player.onGround, true);
});
test("key chest opens via real landing, doorway remains locked until opened", () => {
  const g = start(),
    r = g.room;
  g.player.x = r.door.x;
  assert.equal(g.enterDoor(), false);
  g.player.x = r.chests[0].x + 2;
  g.player.y = 164;
  g.player.vy = 2;
  g.player.onGround = false;
  r.enemies = [];
  tick(g, {}, 10);
  assert.equal(r.chests[0].opened, true);
  assert.equal(g.player.key, true);
  g.player.x = r.door.x;
  g.player.y = r.door.y;
  assert.equal(g.enterDoor(), true);
  assert.equal(g.room.kind, "royal");
});
test("burning bomb order yields higher score and opens palace only when all collected", () => {
  const g = start();
  g.loadRoom(g.player, "royal");
  const r = g.room;
  g.collectBomb(r.bombs[0]);
  assert.equal(g.player.score, 100);
  assert.equal(r.flame, 1);
  g.collectBomb(r.bombs[1]);
  assert.equal(g.player.score, 300);
  g.collectBomb(r.bombs[3]);
  assert.equal(r.chain, 0);
  g.player.x = r.door.x;
  g.player.y = r.door.y;
  assert.equal(g.enterDoor(), false);
  r.bombs.forEach((b) => g.collectBomb(b));
  assert.equal(g.enterDoor(), true);
  assert.equal(g.player.stage, 2);
});
test("blue unlocks orange chest, orange side-touches chest, green converts enemies for five seconds", () => {
  const g = start();
  let orange = g.room.chests.find((c) => c.color === "orange");
  assert.equal(g.openChest(orange), false);
  g.player.mightyCoins = 3;
  g.usePower();
  assert.equal(g.player.power, 1);
  assert.equal(g.openChest(orange), true);
  g.usePower();
  assert.equal(g.player.power, 2);
  const brown = g.room.chests[1];
  g.player.x = brown.x;
  g.player.y = brown.y;
  tick(g);
  assert.equal(brown.opened, true);
  const alive = g.room.enemies.filter((e) => e.alive).length;
  g.usePower();
  assert.equal(g.player.power, 3);
  assert.equal(g.room.items.length, alive);
  assert(g.room.enemies.every((e) => !e.alive));
  tick(g, {}, 299);
  assert.equal(g.player.power, 3);
  tick(g);
  assert.equal(g.player.power, 0);
});
test("secret room restores visited action room and cannot farm its chest", () => {
  const g = start(),
    r = g.room,
    c = r.chests.find((c) => c.reward === "sphinx");
  g.player.power = 1;
  g.openChest(c);
  g.player.x = r.secret.x;
  g.player.y = r.secret.y;
  assert.equal(g.enterDoor(), true);
  assert.equal(g.room.kind, "secret");
  g.player.x = g.room.door.x;
  g.player.y = g.room.door.y;
  g.enterDoor();
  assert.equal(g.room, r);
  assert.equal(c.opened, true);
  assert.equal(g.room.secret.open, false);
  assert.equal(g.openChest(c), false);
});
test("excess time sends Jack to torture room, counted grounded jumps return to action", () => {
  const g = start();
  g.player.time = 95;
  g.openChest(g.room.chests.find((c) => c.reward === "drink"));
  assert.equal(g.room.kind, "torture");
  assert.equal(g.room.jumps, 12);
  g.room.enemies = [];
  for (let i = 0; i < 12; i++) {
    g.player.onGround = true;
    g.player.y = 184;
    g.jump({ y: 1 });
  }
  assert.equal(g.room.kind, "action");
  assert.equal(g.player.time, 60);
  assert.equal(g.player.mightyCoins, 0);
});
test("excess coins trigger torture room through actual item pickup", () => {
  const g = start();
  g.player.mightyCoins = 9;
  g.room.items.push({ x: g.player.x, y: g.player.y, kind: "coin" });
  tick(g);
  assert.equal(g.room.kind, "torture");
});
test("2P retains separate lives, score, stage and each actor gets its turn", () => {
  const g = start(true);
  g.advanceStage();
  g.addScore(g.player, 1234);
  const score = g.player.score;
  g.loseLife("enemy");
  assert.equal(g.activePlayer, 2);
  assert.equal(g.players[0].lives, 2);
  assert.equal(g.players[0].stage, 2);
  assert.equal(g.players[1].stage, 1);
  g.loseLife("enemy");
  assert.equal(g.activePlayer, 1);
  assert.equal(g.player.stage, 2);
  assert.equal(g.player.score, score);
  assert.equal(g.players[1].lives, 2);
  assert.deepEqual(
    g.status().players.map((p) => p.active),
    [true, false],
  );
});
test("only active controller disconnect pauses and manual pause stays manual", () => {
  const g = start(true);
  tick(g, {}, 1, { id: 2, connected: false });
  assert.equal(g.phase, "playing");
  g.step(1 / 60, [{ id: 1, connected: false }, neutral(2)]);
  assert.equal(g.phase, "paused");
  assert.equal(g.autoPause, true);
  tick(g, {}, 1, neutral(2));
  assert.equal(g.phase, "playing");
  tick(g, { start: true }, 1, neutral(2));
  assert.equal(g.phase, "paused");
  g.step(1 / 60, [{ id: 1, connected: false }, neutral(2)]);
  tick(g, {}, 1, neutral(2));
  assert.equal(g.phase, "paused");
  assert.equal(g.autoPause, false);
});
test("sixteen distinct action rooms and royal rooms have valid dimensions and bomb bounds", () => {
  assert.equal(Levels.count, 16);
  const shapes = new Set(),
    royals = new Set();
  for (let stage = 1; stage <= 16; stage++) {
    const r = Levels.room(stage, "action");
    shapes.add(JSON.stringify([r.w, r.h, r.platforms]));
    royals.add(JSON.stringify(Levels.room(stage, "royal").platforms));
    assert.equal(Levels.room(stage, "royal").bombs.length, 24);
    for (const kind of ["action", "royal"]) {
      const room = Levels.room(stage, kind);
      for (const b of room.bombs) {
        assert(b.x >= 0 && b.x < room.w && b.y >= 0 && b.y < room.h);

      }
    }
  }
  assert.equal(shapes.size, 16);
  assert.equal(royals.size, 16);
});
test("legitimate palace exit checks can complete all sixteen stages and reach ending", () => {
  const g = start();
  for (let stage = 1; stage <= 16; stage++) {
    assert.equal(g.player.stage, stage);
    const action = g.room;
    g.openChest(action.chests[0]);
    g.player.x = action.door.x;
    g.player.y = action.door.y;
    g.enterDoor();
    assert.equal(g.room.kind, "royal");
    g.room.bombs.forEach((b) => g.collectBomb(b));
    g.player.x = g.room.door.x;
    g.player.y = g.room.door.y;
    g.enterDoor();
  }
  assert.equal(g.phase, "ending");
  assert.equal(g.player.finished, true);
  assert(g.highScore > 50000);
});
test("time expires via update and last life produces gameover", () => {
  const g = start();
  g.player.lives = 1;
  g.player.time = 1;
  g.player.timer = 59;
  tick(g);
  assert.equal(g.phase, "gameover");
  assert.equal(g.player.lives, 0);
});

test('all sixteen action rooms are physically traversable to their key and palace using real button input', () => {
  // Enemies are removed only to isolate the level geometry. No position/velocity
  // assignment, openChest, enterDoor, or stage-complete calls are used in a route.
  function input(g, value) {
    tick(g, value);
    assert.equal(g.player.lives, 3, 'route must finish within the normal timer');
    assert.equal(g.phase, 'playing');
  }
  function walkTo(g, x) {
    for (let frame = 0; frame < 400; frame++) {
      const delta = x - g.player.x;
      input(g, {x: Math.abs(delta) > 1 ? Math.sign(delta) : 0});
      if (Math.abs(delta) <= 1 && g.player.onGround) return;
    }
    assert.fail('walk never reached target ' + x);
  }
  function jumpTo(g, x) {
    input(g, {});
    input(g, {a:true, y:-1, x:Math.abs(x-g.player.x)>1?Math.sign(x-g.player.x):0});
    for (let frame = 0; frame < 700; frame++) {
      input(g, {a:true, x:Math.abs(x-g.player.x)>1?Math.sign(x-g.player.x):0});
      if (g.player.onGround) return;
    }
    assert.fail('jump never landed at target ' + x);
  }
  for (let stage = 1; stage <= 16; stage++) {
    const g = start();
    g.player.stage = stage;
    g.player.level = stage;
    g.loadRoom(g.player, 'action');
    g.room.enemies = [];
    const spec = Levels.stages[stage-1];
    const center = ledge => ledge[0] + ledge[2] / 2 - 5;
    walkTo(g, center(spec.p[0]));
    for (const ledge of spec.p) jumpTo(g, center(ledge));
    const key = g.room.chests[0];
    jumpTo(g, key.x + 2);
    if (!g.player.key) jumpTo(g, key.x + 2);
    assert.equal(g.player.key, true, 'land on key chest in stage ' + stage);
    assert.equal(key.opened, true);
    walkTo(g, g.room.w-12); // Go beyond the last ledge, then fall to the floor.
    walkTo(g, g.room.door.x+4);
    input(g, {y:-1});
    assert.equal(g.room.kind, 'royal', 'enter palace using UP in stage ' + stage);
    assert(g.tick < 3600, 'route fits the ordinary room timer');
  }
});
