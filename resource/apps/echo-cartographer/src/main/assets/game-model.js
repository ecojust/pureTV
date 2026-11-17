/* Echo Cartographer: finite light, occluded tile-path acoustics, and quiet exploration. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 60, EPS = 1e-9, COLS = 19, ROWS = 11, TILE = 40, OX = 100, OY = 50;
  var DIRECTIONS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  // Authored walls, beacon positions and patrols; no routes or solved state are stored.
  var LAYOUTS = [
    { name: '入门回廊', entry: [1, 5], beacons: [[9, 2], [16, 8]],
      walls: [[6, 1, 6, 8, [3]], [12, 2, 12, 9, [7]]],
      patrols: [[[14, 4], [16, 4], [16, 6], [14, 6]]] },
    { name: '双厅追踪', entry: [1, 1], beacons: [[16, 2], [3, 8], [15, 8]],
      walls: [[1, 5, 17, 5, [4, 14]], [9, 1, 9, 4, [2]], [9, 6, 9, 9, [8]]],
      patrols: [[[13, 3], [16, 3]], [[6, 7], [7, 7], [7, 9], [6, 9]]] },
    { name: '折返迷宫', entry: [1, 8], beacons: [[3, 2], [12, 8], [17, 2]],
      walls: [[5, 1, 5, 9, [2, 8]], [10, 1, 10, 9, [5]], [14, 1, 14, 9, [2, 8]]],
      patrols: [[[2, 5], [3, 5]], [[7, 3], [8, 3], [8, 6], [7, 6]], [[16, 5], [17, 5], [17, 8], [16, 8]]] }
  ];
  function finite(n, fallback) { return typeof n === 'number' && Number.isFinite(n) ? n : fallback; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function id(col, row) { return row * COLS + col; }
  function point(col, row) { return { x: OX + (col + 0.5) * TILE, y: OY + (row + 0.5) * TILE }; }
  function cellAt(state, x, y) {
    var col = clamp(Math.floor((x - OX) / TILE), 0, COLS - 1), row = clamp(Math.floor((y - OY) / TILE), 0, ROWS - 1);
    return state.cells[id(col, row)];
  }
  function emit(state, type, extra) {
    if (state.events.length < 32) state.events.push(Object.assign({ type: type, tick: state.tick }, extra || {}));
  }
  function neighbors(state, tileId) {
    var cell = state.cells[tileId], result = [];
    DIRECTIONS.forEach(function (v) {
      var c = cell.col + v[0], r = cell.row + v[1];
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS) result.push(id(c, r));
    });
    return result;
  }
  function floorDistances(state, sourceId) {
    var distances = state.cells.map(function () { return null; }), queue = [sourceId]; distances[sourceId] = 0;
    for (var head = 0; head < queue.length; head += 1) {
      var current = queue[head];
      neighbors(state, current).forEach(function (next) {
        if (state.cells[next].type === 'floor' && distances[next] === null) { distances[next] = distances[current] + TILE; queue.push(next); }
      });
    }
    return distances;
  }
  function soundDistances(state, sourceId, x, y) {
    var distances = floorDistances(state, sourceId), source = state.cells[sourceId];
    var offset = Math.hypot(x - source.x, y - source.y);
    distances = distances.map(function (d, i) { return d === null ? null : i === sourceId ? 0 : d + offset; });
    state.cells.forEach(function (cell) {
      if (cell.type !== 'wall') return;
      var best = Infinity;
      neighbors(state, cell.id).forEach(function (n) {
        if (state.cells[n].type === 'floor' && distances[n] !== null) best = Math.min(best, (n === sourceId ? offset : distances[n]) + TILE);
      });
      if (best < Infinity) distances[cell.id] = best;
    });
    return distances;
  }
  // Closed rectangle intersection: a line touching a blocking wall corner is occluded.
  function intersectsRect(x1, y1, x2, y2, left, top, right, bottom) {
    var lo = 0, hi = 1, dx = x2 - x1, dy = y2 - y1;
    var p = [-dx, dx, -dy, dy], q = [x1 - left, right - x1, y1 - top, bottom - y1];
    for (var i = 0; i < 4; i += 1) {
      if (Math.abs(p[i]) < 1e-12) { if (q[i] < -EPS) return false; }
      else { var t = q[i] / p[i]; if (p[i] < 0) lo = Math.max(lo, t); else hi = Math.min(hi, t); if (lo > hi + EPS) return false; }
    }
    return lo <= hi + EPS && hi >= -EPS && lo <= 1 + EPS;
  }
  function lineOfSight(state, x, y, cell) {
    return !state.cells.some(function (wall) {
      if (wall.type !== 'wall' || wall.id === cell.id) return false;
      return intersectsRect(x, y, cell.x, cell.y, wall.x - TILE / 2, wall.y - TILE / 2, wall.x + TILE / 2, wall.y + TILE / 2);
    });
  }
  function updateVisibility(state) {
    var p = state.player, lamp = state.battery > EPS ? state.lampRadius : state.reserve > EPS ? state.reserveLampRadius : 0;
    function entityVisible(entity, tileId) {
      // A lit tile center is not proof that every point in that tile is visible
      // around a corner. Echoes illuminate a reached tile; the lamp tests the
      // entity's actual point independently, including its actual range.
      return state.cells[tileId].revealedUntil > state.elapsed + EPS || (lamp > 0
        && Math.hypot(entity.x - p.x, entity.y - p.y) <= lamp + EPS
        && lineOfSight(state, p.x, p.y, { id: tileId, x: entity.x, y: entity.y }));
    }
    state.revealedCount = 0;
    state.cells.forEach(function (cell) {
      var near = lamp > 0 && Math.hypot(cell.x - p.x, cell.y - p.y) <= lamp + EPS && lineOfSight(state, p.x, p.y, cell);
      cell.visible = near || cell.revealedUntil > state.elapsed + EPS;
      if (cell.visible) cell.seen = true;
      if (cell.seen) state.revealedCount += 1;
    });
    state.beacons.forEach(function (b) { b.visible = !b.collected && entityVisible(b, b.tileId); if (b.visible) b.seen = true; });
    state.hazards.forEach(function (h) { h.visible = entityVisible(h, cellAt(state, h.x, h.y).id); });
    var here = cellAt(state, p.x, p.y); p.col = here.col; p.row = here.row; p.tileId = here.id;
    state.entry.unlocked = state.collected === state.target;
    state.remaining = Math.max(0, state.battery / state.batteryDrain + state.reserve);
  }
  function create(seed, difficulty) {
    var index = clamp(Math.floor(finite(difficulty, 0)), 0, 2), layout = LAYOUTS[index], start = point(layout.entry[0], layout.entry[1]);
    var maximum = [120, 128, 136][index], drain = [1.6, 1.7, 1.8][index];
    var state = {
      seed: finite(seed, 1) >>> 0, difficulty: index, level: index + 1, levelName: layout.name,
      width: 960, height: 540, grid: { cols: COLS, rows: ROWS, cellSize: TILE, x: OX, y: OY },
      phase: 'playing', elapsed: 0, tick: 0, score: 0, lostReason: null,
      battery: maximum, maxBattery: maximum, batteryDrain: drain, reserve: 10, maxReserve: 10,
      timeLimit: maximum / drain + 10, remaining: maximum / drain + 10,
      sonarCost: 3, sonarSpeed: 200, sonarRange: 320, echoDuration: 4, cooldown: 0, cooldownMax: 1.1,
      lampRadius: 48, reserveLampRadius: 24, normalSpeed: 60, quietSpeed: 34,
      collected: 0, target: layout.beacons.length, sonarCount: 0, revealedCount: 0,
      cells: [], beacons: [], hazards: [], waves: [], events: [],
      entry: Object.assign({ col: layout.entry[0], row: layout.entry[1], tileId: id(layout.entry[0], layout.entry[1]), radius: 18, unlocked: false }, start),
      player: Object.assign({ radius: 10, vx: 0, vy: 0, angle: 0, quiet: false, noiseRadius: 0, speed: 60, shield: 3, maxShield: 3, invulnerable: 0 }, start),
      message: 'A 发射回声，淡色地图保留记忆 · 找齐信标后返回入口 · 按住 B 慢速静行',
      _remainder: 0, _aDown: false, _blockedMessageAt: -10
    };
    for (var row = 0; row < ROWS; row += 1) for (var col = 0; col < COLS; col += 1) {
      state.cells.push(Object.assign({ id: id(col, row), col: col, row: row, type: col === 0 || col === COLS - 1 || row === 0 || row === ROWS - 1 ? 'wall' : 'floor', seen: false, visible: false, revealedUntil: 0 }, point(col, row)));
    }
    layout.walls.forEach(function (wall) {
      for (var r = wall[1]; r <= wall[3]; r += 1) for (var c = wall[0]; c <= wall[2]; c += 1) {
        if (wall[4].indexOf(wall[0] === wall[2] ? r : c) < 0) state.cells[id(c, r)].type = 'wall';
      }
    });
    layout.beacons.forEach(function (pos, i) { state.beacons.push(Object.assign({ id: 'beacon-' + (i + 1), col: pos[0], row: pos[1], tileId: id(pos[0], pos[1]), radius: 8, collected: false, visible: false, seen: false }, point(pos[0], pos[1]))); });
    layout.patrols.forEach(function (route, i) {
      state.hazards.push(Object.assign({ id: 'hazard-' + (i + 1), radius: 11, angle: 0, visible: false, alerted: false, alertTime: 0, speed: 22,
        _patrol: route.map(function (pos) { return id(pos[0], pos[1]); }), _patrolIndex: 1, _lastHeardTileId: null, _navTarget: null, _route: [] }, point(route[0][0], route[0][1])));
    });
    updateVisibility(state); return state;
  }
  function emitSonar(state) {
    if (state.cooldown > EPS || state.battery + EPS < state.sonarCost) {
      emit(state, 'scanRejected', { reason: state.cooldown > EPS ? 'cooldown' : 'battery' });
      state.message = state.cooldown > EPS ? '声呐正在冷却，松开 A 后再按' : '主电池不足以扫描 · 沿记忆地图返回'; return;
    }
    var p = state.player, source = cellAt(state, p.x, p.y);
    state.battery = Math.max(0, state.battery - state.sonarCost); state.cooldown = state.cooldownMax; state.sonarCount += 1;
    state.remaining = state.battery / state.batteryDrain + state.reserve;
    state.waves.push({ id: 'wave-' + state.sonarCount, x: p.x, y: p.y, originTileId: source.id, emittedAt: state.elapsed, age: 0, radius: 0,
      speed: state.sonarSpeed, maxDistance: state.sonarRange, frontier: [], _distances: soundDistances(state, source.id, p.x, p.y) });
    if (state.waves.length > 2) state.waves.shift();
    emit(state, 'scan', { waveId: 'wave-' + state.sonarCount }); state.message = '回声沿走廊传播 · 亮光消退后，淡色测绘记忆仍然保留';
  }
  function moveCircle(state, body, dx, dy) {
    var originalX = body.x, originalY = body.y, radius = body.radius;
    function axis(amount, horizontal) {
      if (!amount) return;
      var start = horizontal ? body.x : body.y, fixed = horizontal ? body.y : body.x, end = start + amount;
      state.cells.forEach(function (wall) {
        if (wall.type !== 'wall') return;
        var along = horizontal ? wall.x : wall.y, across = horizontal ? wall.y : wall.x;
        var gap = Math.max(0, Math.abs(fixed - across) - TILE / 2);
        if (gap >= radius - EPS) return;
        var margin = Math.sqrt(Math.max(0, radius * radius - gap * gap));
        var low = along - TILE / 2 - margin, high = along + TILE / 2 + margin;
        if (amount > 0 && start <= low + EPS && end > low) end = Math.min(end, low);
        else if (amount < 0 && start >= high - EPS && end < high) end = Math.max(end, high);
      });
      if (horizontal) body.x = clamp(end, OX + TILE + radius, OX + (COLS - 1) * TILE - radius);
      else body.y = clamp(end, OY + TILE + radius, OY + (ROWS - 1) * TILE - radius);
    }
    axis(dx, true); axis(dy, false);
    return { x: originalX, y: originalY, blocked: Math.abs(body.x - originalX - dx) > 1e-7 || Math.abs(body.y - originalY - dy) > 1e-7 };
  }
  function routeTo(state, startId, endId) {
    if (startId === endId) return [startId];
    var queue = [startId], previous = state.cells.map(function () { return -1; }); previous[startId] = startId;
    for (var head = 0; head < queue.length && previous[endId] < 0; head += 1) {
      var current = queue[head];
      neighbors(state, current).forEach(function (next) { if (previous[next] < 0 && state.cells[next].type === 'floor') { previous[next] = current; queue.push(next); } });
    }
    if (previous[endId] < 0) return [];
    var path = [endId]; while (path[0] !== startId) path.unshift(previous[path[0]]); return path;
  }
  function moveHazard(state, h, noiseDistances) {
    var here = cellAt(state, h.x, h.y), p = state.player;
    var source = cellAt(state, p.x, p.y), distance = noiseDistances[here.id];
    // Both endpoint legs belong to a corridor-center sound route. Inside one
    // tile the actual entity separation is used, not either center offset.
    if (here.id === source.id) distance = Math.hypot(h.x - p.x, h.y - p.y);
    else if (distance !== null) distance += Math.hypot(p.x - source.x, p.y - source.y) + Math.hypot(h.x - here.x, h.y - here.y);
    var audible = p.noiseRadius > 0 && distance !== null && distance <= p.noiseRadius + EPS;
    if (audible) { h.alertTime = 1.2; h._lastHeardTileId = cellAt(state, p.x, p.y).id; }
    else h.alertTime = Math.max(0, h.alertTime - DT);
    h.alerted = h.alertTime > EPS; h.speed = h.alerted ? 42 : 22;
    var target = h.alerted ? h._lastHeardTileId : h._patrol[h._patrolIndex];
    var destination = state.cells[target];
    if (Math.hypot(h.x - destination.x, h.y - destination.y) < 0.01) {
      if (!h.alerted) { h._patrolIndex = (h._patrolIndex + 1) % h._patrol.length; target = h._patrol[h._patrolIndex]; }
      else return;
    }
    if (h._navTarget !== target || !h._route.length) { h._route = routeTo(state, here.id, target); h._navTarget = target; }
    while (h._route.length && Math.hypot(h.x - state.cells[h._route[0]].x, h.y - state.cells[h._route[0]].y) < 0.01) h._route.shift();
    if (!h._route.length) return;
    var next = state.cells[h._route[0]], dx = next.x - h.x, dy = next.y - h.y, length = Math.hypot(dx, dy), amount = Math.min(length, h.speed * DT);
    h.angle = Math.atan2(dy, dx); moveCircle(state, h, dx / length * amount, dy / length * amount);
  }
  function sweptHit(px, py, qx, qy, h0x, h0y, h1x, h1y, radius) {
    var x = px - h0x, y = py - h0y, dx = qx - px - (h1x - h0x), dy = qy - py - (h1y - h0y);
    var d = dx * dx + dy * dy, t = d > 0 ? clamp(-(x * dx + y * dy) / d, 0, 1) : 0;
    return (x + t * dx) * (x + t * dx) + (y + t * dy) * (y + t * dy) < radius * radius - EPS;
  }
  function finish(state, phase, reason) {
    state.phase = phase; state.lostReason = reason || null; state._remainder = 0; state.player.vx = state.player.vy = 0; state.player.noiseRadius = 0;
    if (phase === 'won') { state.score += 500 + Math.round(state.remaining * 10) + state.player.shield * 100; state.message = '信标全部带回入口，暗室测绘完成！'; }
    else state.message = reason === 'shield' ? '护盾耗尽 · 遇到追击先拉开距离，接近巡逻机前再用 B 静行' : '主电池与备用灯光耗尽 · 少发无效扫描，记住返航路线';
    emit(state, phase, { reason: reason || null });
  }
  function advanceTick(state, input) {
    state.tick += 1; state.elapsed = state.tick * DT;
    var p = state.player, x = clamp(finite(input.x, 0), -1, 1), y = clamp(finite(input.y, 0), -1, 1), length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; } else if (length < 0.12) x = y = 0;
    p.quiet = !!input.b; p.speed = p.quiet ? state.quietSpeed : state.normalSpeed;
    p.invulnerable = Math.max(0, p.invulnerable - DT); state.cooldown = Math.max(0, state.cooldown - DT);
    var before = moveCircle(state, p, x * p.speed * DT, y * p.speed * DT);
    p.vx = (p.x - before.x) / DT; p.vy = (p.y - before.y) / DT;
    var moving = Math.hypot(p.vx, p.vy) > 0.01; p.noiseRadius = moving ? p.quiet ? 35 : 180 : 0;
    if (moving) p.angle = Math.atan2(p.vy, p.vx);
    if (before.blocked && state.elapsed - state._blockedMessageAt > 1.5) { state._blockedMessageAt = state.elapsed; state.message = '舱壁挡住去路 · 发射回声看清转角，或按住 B 细调'; emit(state, 'wall'); }
    var noise = floorDistances(state, cellAt(state, p.x, p.y).id);
    state.hazards.forEach(function (h) {
      var oldX = h.x, oldY = h.y; moveHazard(state, h, noise);
      if (p.invulnerable <= EPS && sweptHit(before.x, before.y, p.x, p.y, oldX, oldY, h.x, h.y, p.radius + h.radius)) {
        p.shield = Math.max(0, p.shield - 1); p.invulnerable = 1.4; state.message = '护盾受损！先松开 B 拉开距离，接近巡逻机前再静行'; emit(state, 'collision', { hazardId: h.id, shield: p.shield });
      }
    });
    var powered = Math.min(DT, state.battery / state.batteryDrain);
    state.battery = Math.max(0, state.battery - state.batteryDrain * DT);
    state.reserve = Math.max(0, state.reserve - (DT - powered));
    state.waves.forEach(function (wave) {
      wave.age = state.elapsed - wave.emittedAt; wave.radius = Math.min(wave.maxDistance, wave.age * wave.speed); wave.frontier = [];
      wave._distances.forEach(function (distance, cellId) {
        if (distance !== null && distance <= wave.radius + EPS && distance <= wave.maxDistance + EPS) {
          var cell = state.cells[cellId]; cell.seen = true;
          cell.revealedUntil = Math.max(cell.revealedUntil, wave.emittedAt + distance / wave.speed + state.echoDuration);
          if (distance > wave.radius - TILE - EPS) wave.frontier.push(cellId);
        }
      });
    });
    state.waves = state.waves.filter(function (wave) { return wave.age <= wave.maxDistance / wave.speed + EPS; });
    updateVisibility(state);
    if (p.shield <= 0) { finish(state, 'lost', 'shield'); return; }
    if (state.battery <= EPS && state.reserve <= EPS) { finish(state, 'lost', 'darkness'); return; }
    state.beacons.forEach(function (beacon) {
      if (!beacon.collected && Math.hypot(p.x - beacon.x, p.y - beacon.y) <= p.radius + beacon.radius) {
        beacon.collected = true; beacon.visible = false; beacon.seen = true; state.collected += 1; state.score += 500;
        state.message = state.collected === state.target ? '信标已找齐 · 沿淡色测绘记忆返回入口' : '信标已记录，继续寻找剩余信标'; emit(state, 'pickup', { beaconId: beacon.id });
      }
    });
    state.entry.unlocked = state.collected === state.target;
    if (state.entry.unlocked && Math.hypot(p.x - state.entry.x, p.y - state.entry.y) <= state.entry.radius) finish(state, 'won');
  }
  function step(state, dt, input) {
    if (!state || state.phase !== 'playing') return state;
    dt = clamp(finite(dt, 0), 0, 0.25); if (!dt) return state;
    input = input || {}; state.events = [];
    var p = state.player;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) { p.x = state.entry.x; p.y = state.entry.y; }
    p.vx = finite(p.vx, 0); p.vy = finite(p.vy, 0); p.angle = finite(p.angle, 0);
    var edge = !!input.aPressed || (!!input.a && !state._aDown); state._aDown = !!input.a;
    if (edge) emitSonar(state);
    state._remainder += dt;
    while (state._remainder >= DT - EPS && state.phase === 'playing') { state._remainder = Math.max(0, state._remainder - DT); advanceTick(state, input); }
    return state;
  }
  return { create: create, step: step, TICK_HZ: 60 };
});
