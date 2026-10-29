"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Game = require("../src/main/assets/game-model.js");
const W = Game.World;
const input = (id, patch = {}) => ({
  id,
  connected: true,
  x: 0,
  y: 0,
  ...patch,
});
function pulse(g, id, button, both = true) {
  const list = both ? [input(1), input(2)] : [input(id)];
  list.find((p) => p.id === id)[button] = true;
  g.step(0.016, list);
  g.step(0.016, both ? [input(1), input(2)] : [input(id)]);
}
function memory() {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) || null,
    setItem: (k, v) => data.set(k, v),
    data,
  };
}
function playing(two = false, options = {}) {
  const g = new Game({ language: "en", random: () => 0, ...options });
  if (two) pulse(g, 1, "select");
  pulse(g, 1, "start");
  return g;
}
test("title START remains playing when held; both residents remain active", () => {
  const g = new Game();
  pulse(g, 1, "select");
  for (let i = 0; i < 6; i++)
    g.step(0.016, [input(1, { start: true }), input(2)]);
  assert.equal(g.phase, "playing");
  assert.equal(g.selectedPlayers, 2);
  assert.ok(g.status().players.every((p) => p.active && p.joined));
  assert.ok(JSON.stringify(g.status()).length < 4096);
});
test("real joystick movement crosses the island and all building doors are reachable", () => {
  const g = playing(true),
    p = g.players[0],
    other = g.players[1];
  const start = { x: p.x, y: p.y },
    p2start = { x: other.x, y: other.y };
  for (let i = 0; i < 40; i++)
    g.step(0.05, [input(1, { x: 1 }), input(2, { x: -1 })]);
  assert.ok(Math.hypot(p.x - start.x, p.y - start.y) > 2);
  assert.ok(Math.hypot(other.x - p2start.x, other.y - p2start.y) > 2);
  assert.ok(W.onLand(p.x, p.y));
  for (let i = 0; i < 1000; i++) g.step(0.05, [input(1, { x: 1 }), input(2)]);
  assert.ok(W.onLand(p.x, p.y));
  // Door fixtures verify enter/exit semantics; traversal above is real input.
  p.x = 8.5;
  p.y = 8.9;
  p.tool = "hand";
  pulse(g, 1, "a");
  assert.equal(p.location, "home");
  const outdoor = { x: other.x, y: other.y, location: other.location };
  pulse(g, 1, "a");
  assert.equal(p.location, "island");
  assert.deepEqual(
    { x: other.x, y: other.y, location: other.location },
    outdoor,
  );
});
test("bag menus, placement previews and inventory belong to each player", () => {
  const g = playing(true),
    p = g.players[0],
    q = g.players[1];
  pulse(g, 1, "b");
  pulse(g, 2, "b");
  assert.equal(p.menu.kind, "bag");
  assert.equal(q.menu.kind, "bag");
  pulse(g, 2, "b");
  assert.equal(q.menu, null);
  assert.equal(p.menu.kind, "bag");
  const x = p.x,
    y = p.y,
    qx = q.x;
  for (let i = 0; i < 12; i++)
    g.step(0.05, [input(1, { x: 1 }), input(2, { x: 1 })]);
  assert.equal(p.x, x);
  assert.equal(p.y, y);
  assert.notEqual(q.x, qx);
  pulse(g, 1, "b");
  const node = W.nodes[0];
  p.x = node.x;
  p.y = node.y + 1;
  q.x = p.x + 0.1;
  q.y = p.y;
  g.step(0.016, [input(1, { a: true }), input(2, { a: true })]);
  assert.equal((p.inventory.fruit || 0) + (q.inventory.fruit || 0), 2);
  assert.ok((p.inventory.fruit || 0) !== (q.inventory.fruit || 0));
});
test("full bag, purchases, crafting and sell commits do not partially consume resources", () => {
  const storage = memory(),
    g = playing(false, { storage }),
    p = g.players[0],
    node = W.nodes[0];
  p.inventory = { wood: 24 };
  const before = JSON.stringify(p.inventory);
  assert.equal(g.harvest(p, node), false);
  assert.equal(JSON.stringify(p.inventory), before);
  assert.equal(g.harvested[node.id], undefined);
  g.coins = 100;
  assert.equal(g.buy(p, "lamp"), false);
  assert.equal(g.coins, 100);
  p.inventory = { wood: 3, stone: 1 };
  assert.equal(g.craft(p, "bench"), false);
  assert.deepEqual(p.inventory, { wood: 3, stone: 1 });
  p.inventory = { wood: 4, stone: 20 };
  assert.equal(g.craft(p, "bench"), true);
  assert.equal(p.inventory.bench, 1);
  assert.equal(Game.inventoryCount(p.inventory), 20);
  assert.equal(g.sell(p, "stone", true), true);
  assert.equal(g.coins, 176);
  assert.equal(g.sell(p, "stone", true), false);
  const saved = JSON.parse(storage.getItem(Game.SAVE_KEY));
  assert.equal(saved.coins, 176);
  assert.equal(saved.players[0].inventory.bench, 1);
});
test("fishing requires the actual bite timing and has early and missed failures", () => {
  const g = playing(),
    p = g.players[0];
  p.x = 20.2;
  p.y = 11.2;
  p.tool = "rod";
  pulse(g, 1, "a");
  assert.equal(p.fishing.phase, "waiting");
  pulse(g, 1, "a");
  assert.equal(p.inventory.fish, undefined);
  assert.equal(p.fishing, null);
  pulse(g, 1, "a");
  for (let i = 0; i < 8; i++) g.step(0.25, [input(1)]);
  assert.equal(p.fishing.phase, "bite");
  pulse(g, 1, "a");
  assert.equal(p.inventory.fish, 1);
  assert.equal(p.fishing, null);
  pulse(g, 1, "a");
  for (let i = 0; i < 14; i++) g.step(0.25, [input(1)]);
  assert.equal(p.fishing, null);
  assert.equal(p.inventory.fish, 1);
  p.x = 12;
  p.y = 12;
  assert.equal(g.startFishing(p), false);
  // A controlled capacity change during a bite must never overflow the bag.
  p.inventory = { wood: 24 };
  p.fishing = { phase: "bite", remaining: 1 };
  g.reel(p);
  assert.equal(Game.inventoryCount(p.inventory), 24);
  assert.equal(p.fishing, null);
  assert.match(p.message, /Bag full/);
});
test("placement checks terrain, doorway, character and furniture collisions; pickup preserves items", () => {
  const g = playing(true),
    p = g.players[0];
  p.inventory = { bench: 2, lamp: 1 };
  p.x = 11.2;
  p.y = 12.4;
  assert.equal(g.place(p, "bench", p.x, p.y, 0), false);
  assert.equal(g.place(p, "bench", 0, 0, 0), false);
  assert.equal(g.place(p, "bench", 11.2, 14, 1), true);
  assert.equal(p.inventory.bench, 1);
  assert.equal(g.decorations[0].rotation, 1);
  assert.equal(g.place(p, "lamp", 11.3, 14, 0), false);
  assert.equal(p.inventory.lamp, 1);
  assert.equal(g.blocked(11.2, 14, "island"), true);
  assert.equal(g.remove(p), true);
  assert.equal(g.decorations.length, 0);
  assert.equal(p.inventory.bench, 2);
  p.location = "home";
  p.x = 4;
  p.y = 4.5;
  assert.equal(g.place(p, "bench", 4, 5.8, 0), false);
  assert.equal(g.place(p, "bench", 2.2, 4.5, 3), true);
  p.inventory = { wood: 24 };
  assert.equal(g.remove(p), false);
  assert.equal(g.decorations.length, 1);
});
test("five resident requests and both upgrades form a finite completable progression", () => {
  const g = playing(),
    p = g.players[0];
  // Economy fixtures isolate rewards and milestone guards. An independent
  // input-only browser/model walkthrough validates traversal and acquisition.
  p.inventory = { fruit: 3 };
  assert.equal(g.deliver(p, W.tasks[0]), true);
  assert.equal(p.inventory.lamp, 1);
  const coins = g.coins;
  assert.equal(g.deliver(p, W.tasks[0]), false);
  assert.equal(g.coins, coins);
  p.inventory = { wood: 4, lamp: 1 };
  assert.equal(g.deliver(p, W.tasks[1]), true);
  assert.equal(p.inventory.bench, 1);
  p.inventory = { fish: 2, lamp: 1, bench: 1 };
  assert.equal(g.deliver(p, W.tasks[2]), true);
  p.inventory = { shell: 3, stone: 4, lamp: 1, bench: 1 };
  assert.equal(g.deliver(p, W.tasks[3]), true);
  assert.equal(g.deliver(p, W.tasks[4]), false);
  p.x = 11.2;
  p.y = 12.4;
  assert.equal(g.place(p, "bench", 11.2, 14, 0), true);
  assert.equal(g.place(p, "lamp", 9.8, 13.4, 0), true);
  p.inventory = { wood: 8, stone: 6 };
  assert.equal(g.upgrade(p), true);
  assert.equal(g.houseLevel, 1);
  assert.equal(g.deliver(p, W.tasks[4]), true);
  assert.equal(p.inventory.trophy, 1);
  assert.equal(g.completed.length, 5);
  p.inventory = { wood: 12, stone: 10 };
  g.coins = 220;
  assert.equal(g.upgrade(p), true);
  assert.equal(g.houseLevel, 2);
  assert.equal(g.coins, 0);
  assert.equal(g.upgrade(p), false);
});
test("shared economy serializes simultaneous purchases and quests without double rewards", () => {
  const g = playing(true),
    p = g.players[0],
    q = g.players[1];
  g.coins = 50;
  p.menu = { kind: "buy", index: 1 };
  q.menu = { kind: "buy", index: 1 };
  g.step(0.016, [input(1, { a: true }), input(2, { a: true })]);
  assert.equal(g.coins, 0);
  assert.equal((p.inventory.lamp || 0) + (q.inventory.lamp || 0), 1);
  p.inventory = { fruit: 3 };
  q.inventory = { fruit: 3 };
  g.deliver(p, W.tasks[0]);
  const coins = g.coins;
  assert.equal(g.deliver(q, W.tasks[0]), false);
  assert.equal(g.coins, coins);
  assert.equal(q.inventory.fruit, 3);
});
test("disconnect pause resumes automatically, manual pause survives reconnect, simulation freezes", () => {
  const g = playing(true);
  const clock = g.clock;
  g.step(0.2, [input(1), input(2, { connected: false })]);
  assert.equal(g.phase, "paused");
  assert.equal(g.pausedReason, "disconnect");
  assert.equal(g.clock, clock);
  g.step(0.2, [input(1), input(2)]);
  assert.equal(g.phase, "playing");
  pulse(g, 1, "start");
  assert.equal(g.phase, "paused");
  g.step(0.2, [input(1), input(2, { connected: false })]);
  g.step(0.2, [input(1), input(2)]);
  assert.equal(g.phase, "paused");
  assert.equal(g.pausedReason, "manual");
  pulse(g, 1, "start");
  assert.equal(g.phase, "playing");
});
test("save restores transactions, bounds offline growth, and rejects corrupt/prototype inventories", () => {
  const storage = memory(),
    g = playing(false, { storage, now: () => 100000 });
  const p = g.players[0];
  g.harvest(p, W.nodes[0]);
  g.save();
  const raw = storage.getItem(Game.SAVE_KEY),
    restored = new Game({ storage, now: () => 100000 + 48 * 3600 * 1000 });
  assert.equal(restored.players[0].inventory.fruit, 2);
  assert.equal(restored.clock, g.clock + 8 * 3600);
  assert.equal(restored.harvest(restored.players[0], W.nodes[0]), true);
  for (const bad of ["toString", "constructor", "__proto__", "unknown"]) {
    const s = JSON.parse(raw);
    s.players[0].inventory = JSON.parse('{"' + bad + '":1}');
    storage.setItem(Game.SAVE_KEY, JSON.stringify(s));
    const recovery = new Game({ storage });
    assert.equal(recovery.saveRecovered, true);
    assert.deepEqual(recovery.players[0].inventory, {});
  }
  storage.setItem(Game.SAVE_KEY, "not JSON");
  const bad = new Game({ storage });
  assert.equal(bad.saveRecovered, true);
  assert.equal(bad.coins, 20);
});
test("reset requires the affirmative choice and erases both players together", () => {
  const storage = memory(),
    g = playing(true, { storage }),
    p = g.players[0];
  p.inventory = { fish: 3 };
  g.players[1].inventory = { shell: 2 };
  g.coins = 180;
  p.menu = { kind: "reset", index: 0 };
  g.choose(p);
  assert.equal(g.coins, 180);
  p.menu = { kind: "reset", index: 1 };
  g.choose(p);
  assert.equal(g.phase, "title");
  assert.equal(g.coins, 20);
  assert.deepEqual(
    g.players.map((p) => p.inventory),
    [{}, {}],
  );
  assert.equal(JSON.parse(storage.getItem(Game.SAVE_KEY)).coins, 20);
});

test("fish species follow day and overnight windows without removing common catches", () => {
  const g = playing();
  g.clock = 12 * 60;
  assert.deepEqual(g.availableFish().map((f) => f.id), ["sardine", "bass", "butterfly"]);
  g.clock = 22 * 60;
  assert.deepEqual(g.availableFish().map((f) => f.id), ["sardine", "bass", "ray", "moonfish"]);
  g.clock = 2 * 60;
  assert.ok(g.availableFish().some((f) => f.id === "moonfish"));
  g.clock = 6 * 60;
  assert.ok(!g.availableFish().some((f) => f.id === "ray"));
  g.random = () => 0.99999;
  assert.equal(g.rollFish().id, "butterfly");
});

test("nibbles are not bites; only the final signal awards a catch", () => {
  const g = playing(false, { random: () => 0.5 }), p = g.players[0];
  p.x = 20.2;
  p.y = 11.2;
  p.tool = "rod";
  pulse(g, 1, "a");
  for (let i = 0; i < 30 && p.fishing.phase !== "nibble"; i++) g.step(0.1, [input(1)]);
  assert.equal(p.fishing.phase, "nibble");
  pulse(g, 1, "a");
  assert.equal(p.fishing, null);
  assert.equal(p.inventory.fish, undefined);
  assert.deepEqual(g.fishJournal, {});
  pulse(g, 1, "a");
  for (let i = 0; i < 70 && p.fishing.phase !== "bite"; i++) g.step(0.1, [input(1)]);
  assert.equal(p.fishing.phase, "bite");
  pulse(g, 1, "a");
  assert.equal(p.inventory.fish, 1);
  assert.equal(Object.keys(g.fishJournal).length, 1);
});

test("shared fish journal saves records, awards first discovery once and respects full bags", () => {
  const storage = memory(), g = playing(true, { storage }), p = g.players[0], q = g.players[1];
  const coins = g.coins;
  p.fishing = { phase: "bite", species: "ray", remaining: 0.8 };
  q.fishing = { phase: "bite", species: "ray", remaining: 0.8 };
  g.step(0.01, [input(1, { a: true }), input(2, { a: true })]);
  assert.equal(g.fishJournal.ray.count, 2);
  assert.equal(g.coins, coins + 10);
  assert.equal(p.inventory.fish, 1);
  assert.equal(q.inventory.fish, 1);
  const restored = new Game({ storage });
  assert.deepEqual(restored.fishJournal, g.fishJournal);
  p.inventory = { wood: 24 };
  p.fishing = { phase: "bite", species: "moonfish", remaining: 1 };
  g.reel(p);
  assert.equal(g.fishJournal.moonfish, undefined);
  assert.equal(g.coins, coins + 10);
  p.menu = { kind: "journal", index: 0 };
  assert.match(g.menuRows(p)[3].label, /2 × \/ 55 cm/);
  p.menu = { kind: "reset", index: 1 };
  g.choose(p);
  assert.deepEqual(g.fishJournal, {});
  assert.deepEqual(JSON.parse(storage.getItem(Game.SAVE_KEY)).fishJournal, {});
});

test("old saves migrate to an empty journal; invalid journal entries are rejected", () => {
  const storage = memory(), g = playing(false, { storage });
  const old = JSON.parse(storage.getItem(Game.SAVE_KEY));
  delete old.fishJournal;
  storage.setItem(Game.SAVE_KEY, JSON.stringify(old));
  const migrated = new Game({ storage });
  assert.equal(migrated.saveRecovered, false);
  assert.deepEqual(migrated.fishJournal, {});
  for (const journal of [{ sardine: { count: -1, best: 20 } }, { ray: { count: 1, best: 500 } }, { unknown: { count: 1, best: 12 } }]) {
    storage.setItem(Game.SAVE_KEY, JSON.stringify({ ...old, fishJournal: journal }));
    assert.equal(new Game({ storage }).saveRecovered, true);
  }
});
