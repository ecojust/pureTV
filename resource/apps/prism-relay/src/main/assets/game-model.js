/* Mirror / prism optics and 10 Hz rules; independent of rendering and clocks. */
(function (root, factory) {
  "use strict";
  var model = factory();
  if (typeof module === "object" && module.exports) module.exports = model;
  else root.PureModel = model;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  var MIRRORS = [[3, 2, 1, 0], [1, 0, 3, 2]];
  var TICK = 0.1, CHARGE = 20, MAX_DT = 0.25;
  // Layouts contain initial positions only. There is no answer or auto-win path.
  var LEVELS = [
    { name: "一束光的转弯", width: 7, height: 5, duration: 450, heat: 300, cells: [
      ["source", 0, 3, 0, 1], ["mirror", 3, 3, 1], ["receiver", 3, 0, 1]
    ] },
    { name: "白光分成三路", width: 9, height: 7, duration: 600, heat: 300, cells: [
      ["source", 0, 3, 0, 7], ["prism", 3, 3, 2], ["mirror", 6, 3, 0], ["mirror", 3, 5, 0],
      ["receiver", 3, 0, 1], ["receiver", 6, 6, 2], ["receiver", 8, 5, 4],
      ["hazard", 6, 0], ["hazard", 0, 5]
    ] },
    { name: "相遇才是紫色", width: 11, height: 9, duration: 750, heat: 480, cells: [
      ["source", 0, 4, 0, 7], ["prism", 3, 4, 3], ["mirror", 3, 1, 1], ["mirror", 8, 1, 0],
      ["mirror", 3, 7, 0], ["mirror", 8, 7, 1], ["mirror", 5, 4, 1],
      ["receiver", 8, 4, 5], ["receiver", 5, 0, 2], ["hazard", 0, 1], ["hazard", 0, 7], ["hazard", 5, 8]
    ] }
  ];
  function finite(value, fallback) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
  function mod(value, modulus) { return ((value % modulus) + modulus) % modulus; }
  function event(state, type, details) { state.events.push(Object.assign({ type: type, tick: state.tick }, details || {})); }

  // Pure tracing also accepts a board fixture, useful for independently checking optics.
  // A ray carries its own mask. Only receivers combine masks, never intersections.
  function traceBeams(board) {
    var cells = Object.create(null), queue = [], beams = [], visited = Object.create(null);
    var receiverIncident = Object.create(null), illuminatedHazards = Object.create(null), count = 0;
    board.cells.forEach(function (cell) {
      cells[cell.x + "," + cell.y] = cell;
      if (cell.type === "source") queue.push({ x: cell.x, y: cell.y, direction: cell.direction, colorBits: cell.color });
      if (cell.type === "receiver") receiverIncident[cell.id || cell.x + "," + cell.y] = 0;
      if (cell.type === "hazard") illuminatedHazards[cell.id || cell.x + "," + cell.y] = false;
    });
    // Devices are authoritative even after a JSON round trip duplicates cell references.
    (board.devices || []).forEach(function (device) { cells[device.x + "," + device.y] = device; });
    function segment(x1, y1, x2, y2, colorBits) {
      if (x1 !== x2 || y1 !== y2) beams.push({ x1: x1, y1: y1, x2: x2, y2: y2, colorBits: colorBits });
    }
    for (var head = 0; head < queue.length; head += 1) {
      var ray = queue[head], x = ray.x, y = ray.y, direction = mod(ray.direction, 4), color = ray.colorBits & 7;
      if (!color) continue;
      while (true) {
        var nx = x + DX[direction], ny = y + DY[direction];
        if (nx < 0 || ny < 0 || nx >= board.width || ny >= board.height) {
          segment(ray.x, ray.y, x + DX[direction] * 0.5, y + DY[direction] * 0.5, color);
          break;
        }
        var key = nx + "," + ny + "," + direction + "," + color;
        if (visited[key]) { segment(ray.x, ray.y, nx, ny, color); break; }
        visited[key] = true; count += 1; x = nx; y = ny;
        var cell = cells[x + "," + y];
        if (!cell) continue;
        segment(ray.x, ray.y, x, y, color);
        if (cell.type === "mirror") {
          queue.push({ x: x, y: y, direction: MIRRORS[mod(cell.orientation, 2)][direction], colorBits: color });
        } else if (cell.type === "prism" && direction === mod(cell.orientation, 4)) {
          [1, 2, 4].forEach(function (bit, index) {
            if (color & bit) queue.push({ x: x, y: y, direction: mod(direction + index - 1, 4), colorBits: bit });
          });
        } else if (cell.type === "receiver") {
          var receiverKey = cell.id || x + "," + y;
          receiverIncident[receiverKey] |= color;
        } else if (cell.type === "hazard") illuminatedHazards[cell.id || x + "," + y] = true;
        // All other cells, including returning beams at sources, absorb the ray.
        break;
      }
    }
    return { beams: beams, receiverIncident: receiverIncident, illuminatedHazards: illuminatedHazards, visitedStates: count };
  }
  function refreshOptics(state) {
    var optics = traceBeams(state);
    state.beams = optics.beams;
    state.receivers.forEach(function (receiver) { receiver.incident = optics.receiverIncident[receiver.id] || 0; });
    state.hazards.forEach(function (hazard) { hazard.illuminated = !!optics.illuminatedHazards[hazard.id]; });
    state.traceVersion += 1;
    state.tracedStates = optics.visitedStates;
  }
  function create(seed, difficulty) {
    var index = Math.max(0, Math.min(2, Math.floor(finite(difficulty, 0)))), level = LEVELS[index];
    var state = {
      seed: finite(seed, 1) >>> 0, difficulty: index, level: index + 1, levelName: level.name,
      width: level.width, height: level.height, phase: "playing", elapsed: 0, tick: 0,
      timeLimit: level.duration / 10, remaining: level.duration / 10,
      timeLimitTicks: level.duration, remainingTicks: level.duration, score: 0,
      cells: [], devices: [], receivers: [], hazards: [], sources: [], beams: [], selectedId: null,
      chargeTicks: CHARGE, hazardLimit: level.heat, traceVersion: 0, tracedStates: 0,
      message: index === 0 ? "选中镜片 · A 顺时针 / B 逆时针 · 连续照亮目标 2 秒" : "方向键选择器件 · A 顺时针 / B 逆时针 · 棱镜红左绿直蓝右",
      events: [], lostReason: null, _tickRemainder: 0, _aDown: false, _bDown: false,
      _direction: -1, _repeatIn: 0
    };
    level.cells.forEach(function (data) {
      var cell = { type: data[0], x: data[1], y: data[2] };
      if (cell.type === "mirror" || cell.type === "prism") {
        cell.id = "device-" + (state.devices.length + 1); cell.orientation = data[3];
        cell.name = (cell.type === "prism" ? "分色棱镜 " : "反射镜 ") + (state.devices.length + 1);
        state.devices.push(cell);
      } else if (cell.type === "source") {
        cell.id = "source-" + (state.sources.length + 1); cell.direction = data[3]; cell.color = data[4]; state.sources.push(cell);
      } else if (cell.type === "receiver") {
        cell.id = "receiver-" + (state.receivers.length + 1); cell.required = data[3]; cell.incident = 0;
        cell.charge = 0; cell.maxCharge = CHARGE; state.receivers.push(cell);
      } else if (cell.type === "hazard") {
        cell.id = "hazard-" + (state.hazards.length + 1); cell.heat = 0; cell.limit = level.heat;
        cell.illuminated = false; state.hazards.push(cell);
      }
      state.cells.push(cell);
    });
    state.selectedId = state.devices[0].id;
    refreshOptics(state);
    return state;
  }
  function selected(state) { return state.devices.find(function (device) { return device.id === state.selectedId; }); }
  function selectDirection(state, direction) {
    var current = selected(state);
    if (!current) return;
    var near = null, nearDistance = Infinity, fallback = null, fallbackDistance = Infinity;
    state.devices.forEach(function (device) {
      var dx = device.x - current.x, dy = device.y - current.y;
      var forward = dx * DX[direction] + dy * DY[direction], side = Math.abs(dx * DY[direction] - dy * DX[direction]);
      var distance = dx * dx + dy * dy;
      if (forward <= 0) return;
      if (distance < fallbackDistance) { fallback = device; fallbackDistance = distance; }
      // Prefer the nearest device inside the requested 90-degree sector.
      if (forward >= side && distance < nearDistance) { near = device; nearDistance = distance; }
    });
    var next = near || fallback;
    if (next) { state.selectedId = next.id; event(state, "select", { deviceId: next.id }); }
  }
  function rotate(state, delta) {
    var device = selected(state);
    if (!device) return;
    device.orientation = mod(device.orientation + delta, device.type === "mirror" ? 2 : 4);
    var cell = state.cells.find(function (item) { return item.id === device.id; });
    if (cell !== device) cell.orientation = device.orientation;
    event(state, "rotate", { deviceId: device.id, delta: delta, orientation: device.orientation });
  }
  function finish(state, phase, reason) {
    state.phase = phase; state.lostReason = reason || null; state._tickRemainder = 0;
    if (phase === "won") {
      state.score += 1000 + state.remainingTicks * 2;
      state.message = "全部目标连续照亮！第 " + state.level + " 关光路接通";
    } else state.message = reason === "overheat" ? "危险吸收器过热 · 调整光路后再试一次" : "光源能量耗尽 · 再试一次";
    event(state, phase, { reason: reason || null });
  }
  function advanceTick(state) {
    state.tick += 1; state.remainingTicks = Math.max(0, state.remainingTicks - 1); state.remaining = state.remainingTicks / 10;
    state.receivers.forEach(function (receiver) {
      receiver.charge = receiver.incident === receiver.required ? Math.min(CHARGE, receiver.charge + 1) : 0;
    });
    state.hazards.forEach(function (hazard) { hazard.heat = hazard.illuminated ? hazard.heat + 1 : Math.max(0, hazard.heat - 2); });
    state.score = state.receivers.reduce(function (sum, receiver) { return sum + receiver.charge * 10; }, 0);
    if (state.hazards.some(function (hazard) { return hazard.heat >= hazard.limit; })) finish(state, "lost", "overheat");
    else if (state.receivers.every(function (receiver) { return receiver.charge >= CHARGE; })) finish(state, "won");
    else if (state.remainingTicks === 0) finish(state, "lost", "timeout");
  }
  function step(state, dt, input) {
    if (!state || state.phase !== "playing") return state;
    dt = Math.max(0, Math.min(MAX_DT, finite(dt, 0)));
    if (!dt) return state;
    input = input || {}; state.events = [];
    var x = finite(input.x, 0), y = finite(input.y, 0), direction = -1;
    if (Math.max(Math.abs(x), Math.abs(y)) >= 0.45) direction = Math.abs(x) >= Math.abs(y) ? (x > 0 ? 0 : 2) : (y > 0 ? 1 : 3);
    if (direction !== state._direction) {
      state._direction = direction; state._repeatIn = 0.42;
      if (direction >= 0) selectDirection(state, direction);
    } else if (direction >= 0) {
      state._repeatIn -= dt;
      while (state._repeatIn <= 1e-10) { selectDirection(state, direction); state._repeatIn += 0.16; }
    }
    var aDown = !!input.a, bDown = !!input.b;
    // Explicit pulses preserve quick release/press cycles between simulation steps.
    // The shared runtime suppresses browser repeat keydowns before producing them.
    var aEdge = !!input.aPressed || (aDown && !state._aDown), bEdge = !!input.bPressed || (bDown && !state._bDown);
    state._aDown = aDown; state._bDown = bDown;
    // Selection happens before rotation; simultaneous A/B are handled A then B.
    var device = selected(state), oldOrientation = device && device.orientation;
    if (aEdge) rotate(state, 1);
    if (bEdge) rotate(state, -1);
    if (device && oldOrientation !== device.orientation) {
      refreshOptics(state);
      state.message = state.receivers.every(function (receiver) { return receiver.incident === receiver.required; })
        ? "光路已接通 · 保持全部目标连续照亮 2 秒" : "继续调整光路 · 红左转、绿直行、蓝右转";
    }
    state._tickRemainder += dt;
    while (state._tickRemainder >= TICK - 1e-10 && state.phase === "playing") {
      state._tickRemainder = Math.max(0, state._tickRemainder - TICK);
      advanceTick(state);
    }
    state.elapsed = state.tick / 10 + state._tickRemainder;
    return state;
  }
  return { create: create, step: step, traceBeams: traceBeams, TICK_HZ: 10, CHARGE_TICKS: CHARGE };
});
