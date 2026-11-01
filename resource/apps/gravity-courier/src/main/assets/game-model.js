/* Gravity Courier: deterministic, renderer-independent flight and delivery rules. */
(function (root, factory) {
  "use strict";
  var model = factory();
  if (typeof module === "object" && module.exports) module.exports = model;
  else root.PureModel = model;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var WIDTH = 960;
  var HEIGHT = 540;
  var MAX_DT = 0.25;
  var PHYSICS_DT = 1 / 120;

  function finite(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  }
  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }
  function length(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function distance(a, b) {
    return length(a.x - b.x, a.y - b.y);
  }
  function random(state) {
    state.rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0;
    return state.rng / 4294967296;
  }
  function event(state, type, details) {
    var item = { type: type, tick: state.tick };
    if (details) Object.keys(details).forEach(function (key) { item[key] = details[key]; });
    state.events.push(item);
  }
  function tell(state, text, seconds) {
    state.message = text;
    state.messageTime = seconds || 2.8;
  }
  function create(seed, difficulty) {
    var level = clamp(Math.floor(finite(difficulty, 0)), 0, 2);
    var normalizedSeed = finite(seed, 1) >>> 0;
    var state = {
      seed: normalizedSeed,
      rng: normalizedSeed,
      difficulty: level,
      width: WIDTH,
      height: HEIGHT,
      phase: "playing",
      elapsed: 0,
      remaining: 90 - level * 6,
      timeLimit: 90 - level * 6,
      tick: 0,
      score: 0,
      deliveries: 0,
      target: 3,
      pickupSpeed: 62,
      dockSpeed: 38,
      activeParcelId: "parcel-1",
      player: {
        x: 125, y: 430, vx: 0, vy: 0, angle: 0,
        radius: 12, fuel: 100, maxFuel: 100,
        shield: 100, maxShield: 100, cargo: null,
        invulnerable: 0, thrusting: false, braking: false, refueling: false,
      },
      parcels: [],
      stations: [
        { id: "station-1", kind: "delivery", x: 310, y: 430, radius: 25, dockingRadius: 45, name: "青鸟站", color: "#61e4ec" },
        { id: "station-2", kind: "delivery", x: 820, y: 120, radius: 25, dockingRadius: 45, name: "暮光站", color: "#f9bb6c" },
        { id: "station-3", kind: "delivery", x: 160, y: 105, radius: 25, dockingRadius: 45, name: "晨星站", color: "#b6a1ff" },
        { id: "fuel-1", kind: "fuel", x: 510, y: 395, radius: 22, dockingRadius: 47, name: "南部补给", color: "#a9ef9b" },
        { id: "fuel-2", kind: "fuel", x: 780, y: 270, radius: 22, dockingRadius: 47, name: "东部补给", color: "#a9ef9b" },
      ],
      planets: [
        { id: "planet-1", x: 464, y: 264, radius: 58, gravity: 210000 * (1 + level * 0.12), color: "#a278bd" },
        { id: "planet-2", x: 648, y: 153, radius: 37, gravity: 95000 * (1 + level * 0.12), color: "#b37b54" },
        { id: "planet-3", x: 604, y: 485, radius: 27, gravity: 30000, color: "#548ab0" },
      ],
      events: [],
      message: "推摇杆前往近处货箱 · B 减速 · 抵达青鸟站后按 A 交货",
      messageTime: 5,
      lostReason: null,
      _aDown: false,
      _refuelStation: null,
      _lowFuelAnnounced: false,
    };
    state.parcels = [
      { id: "parcel-1", x: 211, y: 430, stationId: "station-1", status: "waiting", radius: 12, name: "青鸟货箱", color: "#61e4ec" },
      { id: "parcel-2", x: 792 + (random(state) - 0.5) * 18, y: 429 + (random(state) - 0.5) * 14, stationId: "station-2", status: "waiting", radius: 12, name: "暮光货箱", color: "#f9bb6c" },
      { id: "parcel-3", x: 410 + (random(state) - 0.5) * 18, y: 89 + (random(state) - 0.5) * 14, stationId: "station-3", status: "waiting", radius: 12, name: "晨星货箱", color: "#b6a1ff" },
    ];
    return state;
  }
  function parcelFor(state, id) {
    return state.parcels.find(function (parcel) { return parcel.id === id; });
  }
  function stationFor(state, id) {
    return state.stations.find(function (station) { return station.id === id; });
  }
  function finish(state, phase, reason) {
    if (state.phase !== "playing") return;
    state.phase = phase;
    state.player.thrusting = false;
    state.player.braking = false;
    state.player.refueling = false;
    state.lostReason = reason || null;
    if (phase === "won") {
      state.score += Math.round(state.remaining * 5 + state.player.shield * 2);
      tell(state, "三件货物全部签收！星际快递任务完成", 999);
    } else {
      tell(state, reason === "shield" ? "护盾耗尽 · 按开始键重新出发" : "配送时间已到 · 按开始键再试一次", 999);
    }
    event(state, phase, { reason: reason || null });
  }
  function deliver(state) {
    var player = state.player;
    var parcel = parcelFor(state, player.cargo);
    if (!parcel || parcel.status !== "carried") {
      tell(state, "先减速靠近闪亮货箱，自动装载货物");
      event(state, "deliveryRejected", { reason: "empty" });
      return;
    }
    var nearby = state.stations.find(function (station) {
      return station.kind === "delivery" && distance(player, station) <= station.dockingRadius;
    });
    if (!nearby) {
      tell(state, "靠近" + stationFor(state, parcel.stationId).name + "，减速后按 A 交货");
      event(state, "deliveryRejected", { reason: "distance" });
      return;
    }
    if (nearby.id !== parcel.stationId) {
      tell(state, "这里不是收货站，请前往" + stationFor(state, parcel.stationId).name);
      event(state, "deliveryRejected", { reason: "wrong-station", stationId: nearby.id });
      return;
    }
    if (length(player.vx, player.vy) > state.dockSpeed) {
      tell(state, "速度太快！按住 B 刹车后再按 A");
      event(state, "deliveryRejected", { reason: "speed", stationId: nearby.id });
      return;
    }
    parcel.status = "delivered";
    player.cargo = null;
    state.deliveries += 1;
    state.score += 1000;
    event(state, "delivery", { parcelId: parcel.id, stationId: nearby.id });
    var next = state.parcels.find(function (item) { return item.status === "waiting"; });
    state.activeParcelId = next ? next.id : null;
    if (state.deliveries >= state.target) finish(state, "won");
    else tell(state, "签收成功！前往下一件闪亮货箱 · 绿色站可补给", 3.5);
  }
  function damage(state, amount, objectId) {
    var player = state.player;
    if (player.invulnerable > 0) return;
    player.shield = Math.max(0, player.shield - amount);
    player.invulnerable = 1.35;
    event(state, "collision", { objectId: objectId, damage: amount, x: player.x, y: player.y });
    tell(state, "护盾受损 · 提前用 B 刹车，绕开星球");
    if (player.shield <= 0) finish(state, "lost", "shield");
  }
  function collide(state) {
    var player = state.player;
    state.planets.forEach(function (planet) {
      var dx = player.x - planet.x;
      var dy = player.y - planet.y;
      var dist = length(dx, dy);
      var separation = player.radius + planet.radius;
      if (dist >= separation) return;
      var nx = dist > 0.0001 ? dx / dist : 1;
      var ny = dist > 0.0001 ? dy / dist : 0;
      var inward = player.vx * nx + player.vy * ny;
      player.x = planet.x + nx * (separation + 0.4);
      player.y = planet.y + ny * (separation + 0.4);
      if (inward < 0) {
        player.vx -= 1.55 * inward * nx;
        player.vy -= 1.55 * inward * ny;
      }
      // A small outward nudge lets a pilot recover instead of sticking to the surface.
      player.vx += nx * 12;
      player.vy += ny * 12;
      damage(state, Math.round(19 + Math.min(10, Math.abs(inward) * 0.07)), planet.id);
    });
    var hitBoundary = false;
    if (player.x < player.radius) {
      player.x = player.radius;
      player.vx = Math.abs(player.vx) * 0.5;
      hitBoundary = true;
    } else if (player.x > WIDTH - player.radius) {
      player.x = WIDTH - player.radius;
      player.vx = -Math.abs(player.vx) * 0.5;
      hitBoundary = true;
    }
    if (player.y < player.radius) {
      player.y = player.radius;
      player.vy = Math.abs(player.vy) * 0.5;
      hitBoundary = true;
    } else if (player.y > HEIGHT - player.radius) {
      player.y = HEIGHT - player.radius;
      player.vy = -Math.abs(player.vy) * 0.5;
      hitBoundary = true;
    }
    if (hitBoundary) damage(state, 9, "boundary");
  }
  function interact(state, dt) {
    var player = state.player;
    var speed = length(player.vx, player.vy);
    if (!player.cargo) {
      var parcel = parcelFor(state, state.activeParcelId);
      if (parcel && parcel.status === "waiting" && distance(player, parcel) <= player.radius + parcel.radius + 9 && speed <= state.pickupSpeed) {
        parcel.status = "carried";
        player.cargo = parcel.id;
        state.score += 100;
        event(state, "pickup", { parcelId: parcel.id, stationId: parcel.stationId });
        tell(state, "货物已装载！前往" + stationFor(state, parcel.stationId).name + "，减速按 A 签收");
      }
    }
    var fuelStation = state.stations.find(function (station) {
      return station.kind === "fuel" && distance(player, station) <= station.dockingRadius && speed <= state.dockSpeed;
    });
    player.refueling = !!fuelStation && player.fuel < player.maxFuel;
    if (fuelStation) {
      if (state._refuelStation !== fuelStation.id && player.fuel < player.maxFuel - 1) {
        event(state, "refuel", { stationId: fuelStation.id });
        tell(state, "正在补给燃料 · 减速停留即可加满");
      }
      player.fuel = Math.min(player.maxFuel, player.fuel + 30 * dt);
      // The docking field steadies a slow ship against nearby gravity.
      var dockDrag = Math.exp(-4 * dt);
      player.vx *= dockDrag;
      player.vy *= dockDrag;
      state._refuelStation = fuelStation.id;
      if (player.fuel > 35) state._lowFuelAnnounced = false;
    } else state._refuelStation = null;
    if (player.fuel < 18 && !state._lowFuelAnnounced) {
      state._lowFuelAnnounced = true;
      event(state, "lowFuel");
      tell(state, "燃料不足！在绿色补给站减速停留即可补满", 4);
    }
  }
  function integrate(state, dt, inputX, inputY, braking) {
    var player = state.player;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    state.messageTime = Math.max(0, state.messageTime - dt);
    var ax = 0;
    var ay = 0;
    state.planets.forEach(function (planet) {
      var dx = planet.x - player.x;
      var dy = planet.y - player.y;
      var dist = length(dx, dy);
      if (dist < 0.001) return;
      var pull = Math.min(78, planet.gravity / Math.max(1600, dist * dist));
      ax += dx / dist * pull;
      ay += dy / dist * pull;
    });
    var magnitude = length(inputX, inputY);
    var fuelCost = magnitude * 2.2 + (braking ? 3.1 : 0);
    var fuelScale = fuelCost > 0 ? Math.min(1, player.fuel / (fuelCost * dt)) : 1;
    player.fuel = Math.max(0, player.fuel - fuelCost * dt);
    player.thrusting = magnitude > 0.02 && fuelScale > 0;
    player.braking = braking && fuelScale > 0;
    ax += inputX * 92 * fuelScale;
    ay += inputY * 92 * fuelScale;
    player.vx += ax * dt;
    player.vy += ay * dt;
    var drag = Math.exp(-(0.025 + (braking ? 3.8 * fuelScale : 0)) * dt);
    player.vx *= drag;
    player.vy *= drag;
    var speed = length(player.vx, player.vy);
    if (speed > 150) {
      player.vx *= 150 / speed;
      player.vy *= 150 / speed;
    }
    if (player.thrusting) player.angle = Math.atan2(inputY, inputX);
    else if (speed > 8) player.angle = Math.atan2(player.vy, player.vx);
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    state.elapsed = Math.min(state.timeLimit, state.elapsed + dt);
    state.remaining = Math.max(0, state.timeLimit - state.elapsed);
    state.tick += 1;
    collide(state);
    if (state.phase !== "playing") return;
    interact(state, dt);
    if (state.remaining <= 0.0000001) {
      state.elapsed = state.timeLimit;
      state.remaining = 0;
      finish(state, "lost", "timeout");
    }
  }
  function step(state, dt, input) {
    if (!state || state.phase !== "playing") return state;
    dt = clamp(finite(dt, 0), 0, MAX_DT);
    if (dt <= 0) return state;
    input = input || {};
    state.events = [];
    var player = state.player;
    player.x = clamp(finite(player.x, 125), player.radius, WIDTH - player.radius);
    player.y = clamp(finite(player.y, 430), player.radius, HEIGHT - player.radius);
    player.vx = clamp(finite(player.vx, 0), -150, 150);
    player.vy = clamp(finite(player.vy, 0), -150, 150);
    player.angle = finite(player.angle, 0);
    player.fuel = clamp(finite(player.fuel, 0), 0, player.maxFuel);
    player.shield = clamp(finite(player.shield, 0), 0, player.maxShield);
    player.invulnerable = Math.max(0, finite(player.invulnerable, 0));
    if (player.shield <= 0) {
      finish(state, "lost", "shield");
      return state;
    }
    var aDown = !!input.a || !!input.aPressed;
    var aPressed = aDown && !state._aDown;
    state._aDown = aDown;
    if (aPressed) deliver(state);
    if (state.phase !== "playing") return state;
    var x = clamp(finite(input.x, 0), -1, 1);
    var y = clamp(finite(input.y, 0), -1, 1);
    var magnitude = length(x, y);
    if (magnitude > 1) { x /= magnitude; y /= magnitude; }
    if (magnitude < 0.08) { x = 0; y = 0; }
    var duration = Math.min(dt, Math.max(0, state.timeLimit - state.elapsed));
    if (duration <= 0) {
      finish(state, "lost", "timeout");
      return state;
    }
    var count = Math.ceil(duration / PHYSICS_DT);
    var slice = duration / count;
    for (var i = 0; i < count && state.phase === "playing"; i += 1) {
      integrate(state, slice, x, y, !!input.b || !!input.bPressed);
    }
    return state;
  }
  return { create: create, step: step, WIDTH: WIDTH, HEIGHT: HEIGHT };
});
