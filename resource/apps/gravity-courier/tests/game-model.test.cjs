"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Model = require("../src/main/assets/game-model.js");

function run(state, seconds, input = {}, dt = 1 / 60) {
  const frames = Math.round(seconds / dt);
  for (let i = 0; i < frames; i += 1) Model.step(state, dt, input);
  return state;
}

function vacuum(seed = 1) {
  const state = Model.create(seed);
  state.planets = [];
  state.player.x = 400;
  state.player.y = 280;
  return state;
}

function place(state, target, vx = 0, vy = 0) {
  Object.assign(state.player, { x: target.x, y: target.y, vx, vy });
}

function loadCurrent(state) {
  const parcel = state.parcels.find((item) => item.id === state.activeParcelId);
  place(state, parcel);
  Model.step(state, 1 / 60, {});
  assert.equal(state.player.cargo, parcel.id, "the active parcel loads through proximity");
  return parcel;
}

function deliverCurrent(state) {
  const parcel = loadCurrent(state);
  const station = state.stations.find((item) => item.id === parcel.stationId);
  place(state, station);
  Model.step(state, 1 / 60, { a: true });
  return parcel;
}

test("the pure UMD model exports the same public API in Node and a browser", () => {
  const context = {};
  vm.runInNewContext(fs.readFileSync(require.resolve("../src/main/assets/game-model.js"), "utf8"), context);
  assert.equal(typeof context.PureModel.create, "function");
  assert.equal(typeof context.PureModel.step, "function");
  assert.equal(context.PureModel.create().player.x, Model.create().player.x);
  assert.equal(Model.WIDTH, 960);
  assert.equal(Model.HEIGHT, 540);
});

test("seeded runs reproduce exactly and fresh games share no mutable objects", () => {
  const first = Model.create(731, 1);
  const second = Model.create(731, 1);
  assert.deepEqual(first, second);
  assert.notDeepEqual(first.parcels, Model.create(732, 1).parcels);
  for (let i = 0; i < 120; i += 1) {
    const input = { x: Math.sin(i * 0.1), y: Math.cos(i * 0.08), b: i % 30 > 23 };
    Model.step(first, 1 / 60, input);
    Model.step(second, 1 / 60, input);
  }
  assert.deepEqual(first, second);
  first.parcels[0].status = "delivered";
  first.stations[0].x = -50;
  first.planets[0].gravity = 0;
  first.player.fuel = 0;
  const restart = Model.create(731, 1);
  assert.equal(restart.parcels[0].status, "waiting");
  assert.equal(restart.player.fuel, 100);
  assert.ok(restart.stations[0].x > 0);
  assert.ok(restart.planets[0].gravity > 0);
  assert.equal(restart.elapsed, 0);
  assert.equal(restart.phase, "playing");
});

test("a ship coasts on inertia while a gravity source attracts it toward its center", () => {
  const drifting = vacuum();
  drifting.player.vx = 55;
  run(drifting, 0.5);
  assert.ok(drifting.player.x > 425);
  assert.ok(drifting.player.vx > 50, "letting go does not stop the ship");
  const attracted = vacuum();
  attracted.planets = [{ id: "test-planet", x: 600, y: 280, radius: 30, gravity: 180000 }];
  run(attracted, 0.5);
  assert.ok(attracted.player.vx > 0);
  assert.ok(attracted.player.x > 400);
  assert.ok(Math.abs(attracted.player.vy) < 1e-9);
  const otherSide = vacuum();
  otherSide.player.x = 800;
  otherSide.planets = attracted.planets.map((planet) => ({ ...planet }));
  run(otherSide, 0.5);
  assert.ok(otherSide.player.vx < 0, "gravity reverses direction across the planet");
});

test("directional thrust burns fuel, diagonals are normalized, and empty tanks cannot thrust", () => {
  const straight = vacuum();
  const diagonal = vacuum();
  run(straight, 0.5, { x: 1 });
  run(diagonal, 0.5, { x: 1, y: 1 });
  assert.ok(straight.player.x > 410);
  assert.ok(straight.player.vx > 35);
  assert.ok(straight.player.fuel < 100);
  assert.ok(Math.abs(Math.hypot(diagonal.player.vx, diagonal.player.vy) - straight.player.vx) < 1e-6);
  assert.ok(Math.abs(diagonal.player.fuel - straight.player.fuel) < 1e-6);
  const empty = vacuum();
  empty.player.fuel = 0;
  run(empty, 1, { x: 1 });
  assert.equal(empty.player.x, 400);
  assert.equal(empty.player.vx, 0);
  assert.equal(empty.player.fuel, 0);
  assert.equal(empty.player.thrusting, false);
});

test("B spends energy to slow an inertial ship, including the final fraction of fuel", () => {
  const coasting = vacuum();
  const braking = vacuum();
  coasting.player.vx = braking.player.vx = 100;
  run(coasting, 0.5);
  run(braking, 0.5, { b: true });
  assert.ok(braking.player.vx < 25);
  assert.ok(braking.player.vx < coasting.player.vx / 3);
  assert.ok(braking.player.fuel < coasting.player.fuel);
  braking.player.fuel = 0.001;
  Model.step(braking, 0.25, { b: true, x: 1 });
  assert.equal(braking.player.fuel, 0);
  assert.ok(Number.isFinite(braking.player.vx));
});

test("only the next parcel is collectible, and loading requires a controlled approach", () => {
  const state = vacuum();
  place(state, state.parcels[1]);
  Model.step(state, 1 / 60, {});
  assert.equal(state.player.cargo, null);
  place(state, state.parcels[0], 110);
  Model.step(state, 1 / 60, {});
  assert.equal(state.player.cargo, null, "a fast flyby does not collect a box");
  place(state, state.parcels[0]);
  Model.step(state, 1 / 60, {});
  assert.equal(state.player.cargo, state.parcels[0].id);
  assert.equal(state.parcels[0].status, "carried");
  assert.ok(state.events.some((event) => event.type === "pickup"));
  assert.equal(state.deliveries, 0);
});

test("A rejects a wrong destination, high speed, and a destination outside docking range", () => {
  const state = vacuum();
  const parcel = loadCurrent(state);
  place(state, state.stations[1]);
  Model.step(state, 1 / 60, { a: true });
  assert.equal(state.deliveries, 0);
  assert.equal(state.player.cargo, parcel.id);
  assert.ok(state.events.some((event) => event.reason === "wrong-station"));
  Model.step(state, 1 / 60, {});
  place(state, state.stations[0], 90);
  Model.step(state, 1 / 60, { a: true });
  assert.equal(state.deliveries, 0);
  assert.ok(state.events.some((event) => event.reason === "speed"));
  Model.step(state, 1 / 60, {});
  place(state, { x: state.stations[0].x, y: 300 });
  Model.step(state, 1 / 60, { a: true });
  assert.equal(state.deliveries, 0);
  assert.ok(state.events.some((event) => event.reason === "distance"));
  Model.step(state, 1 / 60, {});
  place(state, state.stations[0], 10);
  Model.step(state, 1 / 60, { a: true });
  assert.equal(state.deliveries, 1);
  assert.equal(parcel.status, "delivered");
  assert.equal(state.player.cargo, null);
  assert.equal(state.activeParcelId, state.parcels[1].id);
});

test("holding A or repeated pressed flags cannot sign for another parcel without release", () => {
  const state = vacuum();
  deliverCurrent(state);
  const nextParcel = state.parcels[1];
  const nextStation = state.stations[1];
  nextParcel.x = nextStation.x;
  nextParcel.y = nextStation.y;
  place(state, nextStation);
  Model.step(state, 0.25, { a: true, aPressed: true });
  assert.equal(state.player.cargo, nextParcel.id);
  for (let i = 0; i < 5; i += 1) Model.step(state, 0.25, { a: true, aPressed: true });
  assert.equal(state.deliveries, 1);
  Model.step(state, 1 / 60, {});
  Model.step(state, 1 / 60, { aPressed: true });
  assert.equal(state.deliveries, 2);
  assert.equal(state.events.filter((event) => event.type === "delivery").length, 1);
});

test("planet contact reflects motion and its grace period prevents damage every frame", () => {
  const state = vacuum();
  const planet = { id: "impact", x: 500, y: 280, radius: 40, gravity: 0 };
  state.planets = [planet];
  place(state, { x: 449, y: 280 }, 110);
  Model.step(state, 1 / 60, {});
  assert.ok(state.player.shield < 100 && state.player.shield > 60);
  assert.ok(state.player.vx < 0, "the ship bounces away from the surface");
  assert.ok(Math.hypot(state.player.x - planet.x, state.player.y - planet.y) >= planet.radius + state.player.radius);
  const afterImpact = state.player.shield;
  for (let i = 0; i < 60; i += 1) {
    place(state, { x: 449, y: 280 }, 110);
    Model.step(state, 1 / 120, {});
  }
  assert.equal(state.player.shield, afterImpact);
  run(state, 1);
  place(state, planet);
  Model.step(state, 1 / 60, {});
  assert.ok(state.player.shield < afterImpact, "a later distinct collision costs shield again");
  assert.ok(Number.isFinite(state.player.x) && Number.isFinite(state.player.y), "an exact center overlap resolves safely");
});

test("the visible world bounds contain the ship and absorb a shielded impact", () => {
  const state = vacuum();
  place(state, { x: state.player.radius + 1, y: 280 }, -150);
  Model.step(state, 0.25, {});
  assert.ok(state.player.x >= state.player.radius);
  assert.ok(state.player.vx > 0);
  assert.ok(state.player.shield < 100);
  place(state, { x: 960 - state.player.radius - 1, y: 540 - state.player.radius - 1 }, 150, 150);
  Model.step(state, 0.25, {});
  assert.ok(state.player.x <= 960 - state.player.radius);
  assert.ok(state.player.y <= 540 - state.player.radius);
  assert.ok(state.player.vx < 0 && state.player.vy < 0);
});

test("a fuel station replenishes a slow docked ship, including an empty tank", () => {
  const state = vacuum();
  const station = state.stations.find((item) => item.kind === "fuel");
  state.player.fuel = 0;
  place(state, station);
  Model.step(state, 0.25, {});
  assert.ok(state.player.fuel > 5);
  assert.ok(state.events.some((event) => event.type === "refuel"));
  run(state, 4);
  assert.equal(state.player.fuel, state.player.maxFuel);
  state.player.fuel = 20;
  place(state, station, 100);
  Model.step(state, 1 / 60, {});
  assert.equal(state.player.fuel, 20, "flying through above docking speed does not refuel");
});

test("only all three real deliveries win, and a won state freezes exactly", () => {
  const state = vacuum();
  state.score = 99999999;
  Model.step(state, 1 / 60, { a: true });
  assert.equal(state.phase, "playing", "score cannot substitute for deliveries");
  for (let i = 0; i < state.target; i += 1) {
    deliverCurrent(state);
    assert.equal(state.deliveries, i + 1);
    assert.equal(state.phase, i === state.target - 1 ? "won" : "playing");
  }
  assert.equal(state.player.cargo, null);
  assert.equal(state.activeParcelId, null);
  assert.ok(state.parcels.every((parcel) => parcel.status === "delivered"));
  const finished = JSON.stringify(state);
  run(state, 5, { x: 1, y: -1, a: true, b: true });
  assert.equal(JSON.stringify(state), finished);
});

test("shield exhaustion and the time limit lose and both terminal states freeze", () => {
  const destroyed = vacuum();
  destroyed.player.shield = 1;
  place(destroyed, { x: 13, y: 280 }, -100);
  Model.step(destroyed, 0.1, {});
  assert.equal(destroyed.phase, "lost");
  assert.equal(destroyed.lostReason, "shield");
  assert.equal(destroyed.player.shield, 0);
  const expired = vacuum();
  expired.elapsed = expired.timeLimit - 0.05;
  expired.remaining = 0.05;
  Model.step(expired, 0.25, {});
  assert.equal(expired.phase, "lost");
  assert.equal(expired.lostReason, "timeout");
  assert.equal(expired.remaining, 0);
  assert.equal(expired.elapsed, expired.timeLimit);
  [destroyed, expired].forEach((state) => {
    const snapshot = JSON.stringify(state);
    Model.step(state, 0.25, { x: 1, aPressed: true, bPressed: true });
    assert.equal(JSON.stringify(state), snapshot);
  });
});

test("low frame rates preserve flight and large frame gaps have bounded simulation cost", () => {
  const fast = Model.create(78);
  const slow = Model.create(78);
  run(fast, 2, { x: 0.5, y: -0.25 }, 1 / 120);
  run(slow, 2, { x: 0.5, y: -0.25 }, 0.25);
  assert.ok(Math.abs(fast.player.x - slow.player.x) < 0.05);
  assert.ok(Math.abs(fast.player.y - slow.player.y) < 0.05);
  assert.ok(Math.abs(fast.player.fuel - slow.player.fuel) < 0.01);
  const before = slow.elapsed;
  const tickBefore = slow.tick;
  Model.step(slow, 50, { x: 1 });
  assert.ok(slow.elapsed - before <= 0.2500001);
  assert.ok(slow.tick - tickBefore <= 30);
  assert.ok(slow.player.x >= slow.player.radius && slow.player.x <= 960 - slow.player.radius);
});

test("invalid frame/input values cannot introduce NaN or reverse simulation time", () => {
  const state = vacuum();
  const original = JSON.stringify(state);
  [NaN, Infinity, -0.1, 0].forEach((dt) => Model.step(state, dt, { x: Infinity, y: NaN }));
  assert.equal(JSON.stringify(state), original);
  state.player.x = NaN;
  state.player.y = Infinity;
  state.player.vx = Infinity;
  state.player.vy = NaN;
  state.player.angle = NaN;
  Model.step(state, 0.25, { x: Infinity, y: NaN });
  ["x", "y", "vx", "vy", "angle", "fuel", "shield"].forEach((key) => {
    assert.ok(Number.isFinite(state.player[key]), key + " must remain finite");
  });
  assert.ok(Number.isFinite(state.elapsed));
  assert.ok(state.player.x >= state.player.radius);
  assert.ok(state.player.y <= 540 - state.player.radius);
});

test("a pilot can complete the actual map through thrust, braking, pickup, docking and A", () => {
  for (const seed of [1, 7, 983]) {
    const state = Model.create(seed);
    // Navigation observations only: this pilot never edits game state or teleports.
    const route = [
      state.parcels[0], state.stations[0], state.stations[3],
      state.parcels[1], state.stations[4], state.stations[1],
      { x: 810, y: 65 }, { x: 410, y: 65 }, state.parcels[2], state.stations[2],
    ];
    let waypoint = 0;
    let pickups = 0;
    let deliveries = 0;
    for (let frame = 0; frame < 5400 && state.phase === "playing"; frame += 1) {
      const target = route[waypoint];
      const p = state.player;
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const distance = Math.hypot(dx, dy);
      const speed = Math.hypot(p.vx, p.vy);
      const desiredSpeed = Math.min(100, distance * 1.8);
      const wantedX = distance ? (dx / distance) * desiredSpeed : 0;
      const wantedY = distance ? (dy / distance) * desiredSpeed : 0;
      Model.step(state, 1 / 60, {
        x: (wantedX - p.vx) / 37,
        y: (wantedY - p.vy) / 37,
        b: distance < 55 && speed > 25,
        a: target.kind === "delivery" && distance < 40 && speed < 30 && frame % 2 === 0,
      });
      pickups += state.events.filter((event) => event.type === "pickup").length;
      deliveries += state.events.filter((event) => event.type === "delivery").length;
      const reached = target.id?.startsWith("parcel") ? p.cargo === target.id
        : target.kind === "delivery" ? state.deliveries === [1, 5, 9].indexOf(waypoint) + 1
          : target.kind === "fuel" ? distance < 35 && p.fuel > 94
            : distance < 18;
      if (reached) waypoint += 1;
    }
    assert.equal(state.phase, "won", `seed ${seed}: ${state.message}`);
    assert.equal(pickups, 3);
    assert.equal(deliveries, 3);
    assert.equal(state.deliveries, 3);
    assert.ok(state.elapsed > 20 && state.elapsed < state.timeLimit);
    assert.ok(state.player.fuel > 0);
    assert.ok(state.player.shield > 0);
  }
});
