"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Game = require("../src/main/assets/game-model.js");
const input = (id = 1, values = {}) =>
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
    values,
  );
function press(game, action, two = false) {
  const list = [input(1, { [action]: true })];
  if (two) list.push(input(2));
  game.step(1 / 60, list);
  game.step(
    1 / 60,
    list.map((p) => input(p.id)),
  );
}
function start(options = {}) {
  const game = new Game(options);
  press(game, "start");
  return game;
}
function pilot(game, player) {
  // Observe track bend and lateral position. Do not set position, speed, lap or gates.
  const bend = Game.curve(game.track, player.s);
  return input(player.id, {
    x: Math.max(
      -1,
      Math.min(
        1,
        -player.x * 2.5 + bend * Math.pow(player.speed / 180, 2) * 0.49,
      ),
    ),
    a: !!player.item,
  });
}
function complete(game, max = 6500) {
  for (let i = 0; i < max && game.phase === "playing"; i++)
    game.step(
      0.05,
      game.players.filter((p) => p.joined).map((p) => pilot(game, p)),
    );
  assert.equal(game.phase, "results");
}

test("four distinct circuits finish three laps through normal steering physics", () => {
  assert.equal(
    new Set(
      Game.TRACKS.map((t) =>
        JSON.stringify([t.length, t.width, t.turns, t.hill]),
      ),
    ).size,
    4,
  );
  Game.TRACKS.forEach((track, index) => {
    const game = new Game();
    game.trackIndex = index;
    press(game, "start");
    assert.equal(game.racers.length, 7);
    complete(game);
    const p = game.players[0];
    assert.equal(p.lap, 4);
    assert.equal(p.nextCheckpoint, 13);
    assert.ok(p.finishTime > 60 && p.finishTime < 150);
    assert.ok(
      game.racers.filter((r) => !r.human).every((r) => r.s > track.length * 2),
      "all six AI navigate the actual circuit",
    );
    assert.deepEqual(
      game.racers.map((r) => r.rank).sort((a, b) => a - b),
      [1, 2, 3, 4, 5, 6, 7],
    );
  });
});

test("signed travel and ordered checkpoints reject reversing and gate skips", () => {
  const game = start();
  const p = game.players[0];
  for (let i = 0; i < 1600; i++) game.step(0.05, [input(1, { y: 1 })]);
  assert.ok(p.s < -1000);
  assert.equal(p.lap, 1);
  assert.equal(p.nextCheckpoint, 1);
  assert.equal(p.finished, false);
  // Controlled gate fixture: intentionally skip quarter gates, then cross finish.
  const skipped = start();
  const s = skipped.players[0];
  s.s = skipped.track.length - 10;
  skipped.advance(s, 20);
  assert.equal(s.lap, 1);
  assert.equal(s.nextCheckpoint, 1);
  const reverse = start();
  const r = reverse.players[0];
  r.s = reverse.track.length + 10;
  r.nextCheckpoint = 4;
  reverse.advance(r, -20);
  assert.equal(r.lap, 1);
  assert.equal(r.finished, false);
});

test("two human drivers steer independently while six AI advance", () => {
  const game = new Game();
  press(game, "select", true);
  assert.equal(game.selectedPlayers, 2);
  press(game, "start", true);
  for (let i = 0; i < 75; i++) game.step(0.05, [input(1), input(2)]);
  const a = game.players[0],
    b = game.players[1],
    oldA = a.x,
    oldB = b.x;
  for (let i = 0; i < 8; i++)
    game.step(0.05, [input(1, { x: -0.7 }), input(2, { x: 0.7 })]);
  assert.ok(a.x < oldA && b.x > oldB);
  assert.ok(a.s > 0 && b.s > 0);
  assert.equal(game.racers.length, 8);
  assert.ok(game.status().players.every((p) => p.active));
  complete(game);
  assert.ok(a.finished && b.finished);
  assert.equal(new Set([a.rank, b.rank]).size, 2);
});

test("joining, disconnect/rejoin and manual pause preserve the race", () => {
  const game = new Game();
  press(game, "select");
  press(game, "start");
  assert.equal(
    game.phase,
    "title",
    "2P cannot start without the second controller",
  );
  press(game, "start", true);
  for (let i = 0; i < 100; i++) game.step(0.05, [input(1), input(2)]);
  const s = game.players[0].s;
  game.step(0.05, [input(1)]);
  assert.equal(game.phase, "paused");
  assert.equal(game.pauseReason, "controller");
  for (let i = 0; i < 10; i++) game.step(0.05, [input(1)]);
  assert.equal(game.players[0].s, s);
  game.step(0.05, [input(1), input(2)]);
  assert.equal(game.phase, "playing");
  press(game, "start", true);
  assert.equal(game.pauseReason, "manual");
  game.step(0.05, [input(1)]);
  game.step(0.05, [input(1), input(2)]);
  assert.equal(game.phase, "paused");
  press(game, "select", true);
  assert.equal(game.muted, true);
  press(game, "start", true);
  assert.equal(game.phase, "playing");
});

test("drift charges at speed, release boosts, and a short tap gives no boost", () => {
  // Controlled short straight fixture isolates drift thresholds from race travel.
  const game = start(),
    p = game.players[0];
  game.countdown = 0;
  p.speed = 180;
  p.s = 20;
  for (let i = 0; i < 20; i++)
    game.step(0.05, [input(1, { x: i < 10 ? 0.25 : -0.25, b: true })]);
  assert.ok(p.drift > 0.9);
  game.step(0.05, [input()]);
  assert.ok(p.boost > 0.7);
  assert.equal(p.drift, 0);
  p.boost = 0;
  p.x = 0;
  p.s = 20;
  game.step(0.05, [input(1, { x: 0.3, b: true })]);
  game.step(0.05, [input()]);
  assert.equal(p.boost, 0);
});

test("off-road slows the kart and barrier recovery returns it to the road", () => {
  const game = start(),
    p = game.players[0];
  game.countdown = 0;
  p.speed = 180;
  p.x = 1.25;
  for (let i = 0; i < 15; i++) game.step(0.05, [input()]);
  assert.ok(p.speed < 120);
  p.x = 1.64;
  p.speed = 180;
  game.step(0.05, [input(1, { x: 1 })]);
  assert.ok(p.recover > 0);
  assert.equal(p.speed, 0);
  for (let i = 0; i < 16; i++) game.step(0.05, [input()]);
  assert.ok(Math.abs(p.x) < 0.3);
  assert.ok(p.speed > 0);
});

test("pickup lanes grant items once and honor the cooldown", () => {
  const game = start(),
    p = game.players[0];
  game.countdown = 0;
  const box = game.boxes[1];
  p.s = box.s - 5;
  p.x = box.x;
  p.speed = 180;
  game.step(0.05, [input()]);
  assert.ok(p.item);
  assert.ok(box.ready > game.clock);
  p.item = null;
  p.s = box.s - 5;
  p.speed = 180;
  game.step(0.05, [input()]);
  assert.equal(p.item, null);
});

test("four item effects are distinct, shields block a hit, held A does not double fire", () => {
  const game = start(),
    p = game.players[0];
  game.countdown = 0;
  p.item = "boost";
  game.step(0.05, [input(1, { a: true })]);
  assert.ok(p.boost > 2);
  assert.equal(p.item, null);
  p.item = "shield";
  game.step(0.05, [input(1, { a: true })]);
  assert.equal(p.item, "shield", "held A requires release");
  game.step(0.05, [input()]);
  game.step(0.05, [input(1, { a: true })]);
  assert.ok(p.shield > 4);
  game.hit(p);
  assert.equal(p.shield, 0);
  assert.equal(p.stun, 0);
  game.hit(p);
  assert.ok(p.stun > 0);
  p.item = "trap";
  game.useItem(p);
  assert.equal(game.items[0].type, "trap");
  assert.equal(game.items[0].speed, 0);
  p.item = "pulse";
  game.useItem(p);
  assert.equal(game.items[1].type, "pulse");
  assert.equal(game.items[1].speed, 300);
});

test("projectiles hit opponents, disappear and do not hit their owner", () => {
  const game = start(),
    p = game.players[0],
    r = game.racers[1];
  game.countdown = 0;
  p.s = 600;
  p.x = 0;
  p.speed = 150;
  r.s = 680;
  r.x = 0;
  r.speed = 150;
  p.item = "pulse";
  game.useItem(p);
  for (let i = 0; i < 4; i++) game.step(0.05, [input()]);
  assert.ok(r.stun > 0);
  assert.equal(p.stun, 0);
  assert.equal(game.items.length, 0);
});

test("finish order is stable and the second human can finish later", () => {
  // Controlled final-gate fixture exercises finishing without a multi-minute duplicate race.
  const game = new Game();
  game.selectedPlayers = 2;
  game.start();
  game.countdown = 0;
  const p = game.players[0],
    q = game.players[1];
  p.s = game.track.length * 3 - 5;
  p.nextCheckpoint = 12;
  p.lap = 3;
  p.speed = 180;
  q.s = game.track.length * 3 - 50;
  q.nextCheckpoint = 12;
  q.lap = 3;
  q.speed = 180;
  game.step(0.05, [input(1), input(2)]);
  assert.equal(game.phase, "playing");
  assert.equal(p.finished, true);
  assert.equal(q.finished, false);
  for (let i = 0; i < 20 && game.phase === "playing"; i++)
    game.step(0.05, [input(1), input(2)]);
  assert.equal(game.phase, "results");
  assert.equal(p.rank, 1);
  assert.equal(q.rank, 2);
  assert.deepEqual(game.resultOrder.slice(0, 2), [1, 2]);
});

test("four-round championship accumulates points and returns cleanly to title", () => {
  const saved = [];
  const game = new Game({
    saveRecords: (r) => saved.push(JSON.parse(JSON.stringify(r))),
  });
  game.modeIndex = 1;
  press(game, "start");
  let total = 0;
  for (let round = 0; round < 4; round++) {
    assert.equal(game.trackIndex, round);
    complete(game);
    total += game.players[0].score;
    assert.equal(game.cupPoints[1], total);
    press(game, "start");
  }
  assert.equal(game.phase, "ending");
  assert.equal(saved.length, 4);
  assert.equal(game.records.cup, total);
  press(game, "start");
  assert.equal(game.phase, "title");
  press(game, "start");
  assert.equal(game.cupRound, 0);
  assert.deepEqual(game.cupPoints, {});
});

test("time trial is solo, has no items or AI, persists best times but not race state", () => {
  let saved;
  const game = new Game({
    saveRecords: (r) => {
      saved = JSON.parse(JSON.stringify(r));
    },
  });
  game.modeIndex = 2;
  game.selectedPlayers = 2;
  press(game, "start", true);
  assert.equal(game.selectedPlayers, 1);
  assert.equal(game.racers.length, 1);
  complete(game);
  assert.equal(game.players[0].item, null);
  assert.ok(saved["coast-time"] > 60);
  assert.ok(saved["coast-lap"] > 20);
  const restored = new Game({ records: saved });
  assert.equal(restored.phase, "title");
  assert.equal(restored.clock, 0);
  assert.equal(restored.records["coast-time"], saved["coast-time"]);
  press(game, "select");
  assert.equal(game.phase, "title");
  press(game, "start");
  assert.equal(game.clock, 0);
  assert.equal(game.players[0].lap, 1);
});

test("model output stays bounded and deterministic under the same inputs", () => {
  const a = start(),
    b = start();
  for (let i = 0; i < 400; i++) {
    const value = [input(1, { x: Math.sin(i / 70) * 0.1, a: i % 30 === 0 })];
    a.step(0.05, value);
    b.step(0.05, value);
  }
  assert.equal(JSON.stringify(a.racers), JSON.stringify(b.racers));
  assert.ok(Buffer.byteLength(JSON.stringify(a.status())) < 4096);
  assert.ok(Number.isFinite(a.players[0].s));
  assert.ok(a.clock > 0);
});
