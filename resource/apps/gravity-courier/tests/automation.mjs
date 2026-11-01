// Observational keyboard pilot shared by the browser QA pass and MP4 capture.
// All flight, cargo handling, refueling and delivery still pass through normal input.
export const budgets = Object.freeze({ maxWebGLDrawCalls: 3 });
export const budget = budgets;

let sessionMode;
let previousTime = -1;
let waypoint = 0;

function newSession(state, mode) {
  sessionMode = mode;
  previousTime = state.elapsed;
  waypoint = state.deliveries >= 2 ? (state.player.cargo ? 9 : 6)
    : state.deliveries === 1 ? (state.player.cargo ? 4 : 2)
      : state.player.cargo ? 1 : 0;
}

function routeFor(state) {
  const delivery = state.stations.filter((station) => station.kind === "delivery");
  const fuel = state.stations.filter((station) => station.kind === "fuel");
  return [
    state.parcels[0], delivery[0], fuel[0], state.parcels[1], fuel[1], delivery[1],
    { x: 810, y: 60 }, { x: 410, y: 60 }, state.parcels[2], delivery[2],
  ];
}

export function keys(snapshot, { elapsed = 0, mode = "qa" } = {}) {
  const state = snapshot?.model;
  if (!state?.player || state.phase !== "playing" || snapshot.paused) return [];
  if (mode !== sessionMode || state.elapsed + 0.01 < previousTime) newSession(state, mode);
  previousTime = state.elapsed;
  const route = routeFor(state);
  const player = state.player;
  // A sign-off can happen between polls. Advance from observed cargo/receipts only.
  for (let guard = 0; guard < route.length && waypoint < route.length; guard += 1) {
    const target = route[waypoint];
    const distance = Math.hypot(target.x - player.x, target.y - player.y);
    const reached = target.id?.startsWith("parcel") ? player.cargo === target.id || target.status === "delivered"
      : target.kind === "delivery" ? state.deliveries >= [1, 5, 9].indexOf(waypoint) + 1
        : target.kind === "fuel" ? distance < 35 && player.fuel > 94
          : distance < 22;
    if (!reached) break;
    waypoint += 1;
  }
  const target = route[waypoint];
  if (!target) return [];
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const distance = Math.hypot(dx, dy);
  const speed = Math.hypot(player.vx, player.vy);
  const desiredSpeed = Math.min(64, distance * 1.65);
  const desiredX = distance ? dx / distance * desiredSpeed : 0;
  const desiredY = distance ? dy / distance * desiredSpeed : 0;
  const errorX = desiredX - player.vx;
  const errorY = desiredY - player.vy;
  const held = [];
  // A velocity dead band avoids rapid left/right alternation at 80 ms sampling.
  if (errorX > 6) held.push("ArrowRight");
  else if (errorX < -6) held.push("ArrowLeft");
  if (errorY > 6) held.push("ArrowDown");
  else if (errorY < -6) held.push("ArrowUp");
  if (distance < 58 && speed > 24) held.push("b");
  // Half-second hold/release cycles provide distinct A edges after every delivery.
  if (target.kind === "delivery" && distance < 40 && speed < 30 && Math.floor(elapsed * 2) % 2 === 0) held.push("Space");
  return held;
}

function snapshots(before, after, trace) {
  return [before, ...(trace || []).map((entry) => entry.state || entry.snapshot || entry), after]
    .filter((snapshot) => snapshot?.model);
}

export function assertProgress({ before, after, trace }, assert) {
  const samples = snapshots(before, after, trace);
  const first = before.model;
  const last = after.model;
  assert.ok(last.elapsed > first.elapsed + 3, "flight time must advance through the normal runtime");
  assert.ok(samples.some(({ model }) => Math.hypot(model.player.x - first.player.x, model.player.y - first.player.y) > 65), "direction keys must move the ship along the route");
  assert.ok(samples.some(({ model }) => model.player.fuel < first.player.fuel - 1), "normal thrust/braking must spend fuel");
  assert.ok(last.deliveries >= 1, "the keyboard pilot must make at least one actual delivery");
  assert.equal(last.parcels.filter((parcel) => parcel.status === "delivered").length, last.deliveries, "receipts must match delivered parcels");
  let previous = first;
  for (const { model } of samples) {
    assert.ok(model.deliveries >= previous.deliveries, "progress cannot reset during the flight");
    assert.ok(model.deliveries - previous.deliveries <= 1, "separate parcels need separate A sign-offs");
    if (model.deliveries > previous.deliveries) {
      const parcel = model.parcels[model.deliveries - 1];
      const station = model.stations.find((item) => item.id === parcel.stationId);
      assert.ok(Math.hypot(model.player.x - station.x, model.player.y - station.y) <= station.dockingRadius + 18, "each receipt must be observed near its correct station");
      assert.ok(Math.hypot(model.player.vx, model.player.vy) <= model.dockSpeed + 18, "each receipt must follow a low-speed docking approach");
    }
    previous = model;
  }
  assert.ok(last.player.shield > 0, "the route must preserve the ship");
  assert.notEqual(last.phase, "lost", "the normal keyboard route must remain playable");
  if (last.phase === "won") {
    assert.equal(last.deliveries, last.target, "winning requires every cargo receipt");
    assert.ok(last.parcels.every((parcel) => parcel.status === "delivered"));
  }
}

export function assertRetry({ before, after, initial }, assert) {
  const state = after.model;
  const original = initial?.model;
  assert.equal(after.phase, "playing");
  assert.equal(state.phase, "playing");
  assert.equal(state.deliveries, 0);
  assert.equal(state.score, 0);
  assert.equal(state.player.cargo, null);
  assert.ok(state.parcels.every((parcel) => parcel.status === "waiting"));
  assert.ok(state.elapsed < 0.5, "retry must create a fresh round");
  assert.ok(state.elapsed < before.model.elapsed);
  assert.equal(state.player.shield, state.player.maxShield);
  assert.ok(state.player.fuel > state.player.maxFuel - 1);
  const startX = original?.player.x ?? 125;
  const startY = original?.player.y ?? 430;
  assert.ok(Math.hypot(state.player.x - startX, state.player.y - startY) < 6, "retry returns to the launch point");
  assert.equal(state.activeParcelId, state.parcels[0].id);
}
