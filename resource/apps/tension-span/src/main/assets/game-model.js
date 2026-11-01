/* Vertical small-deflection bridge model: kg, N, seconds, 50 pixels per metre.
 * Fixed horizontal coordinates omit lateral dynamics. Panels transfer symmetric
 * shear forces; tension-only elastic cables supply the actual vertical support. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 120, SCALE = 50, G = 9.81;
  var DIRECTIONS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  var SETTINGS = [
    { name: '峡谷初桥', ends: [220, 740], towers: [[220, 120], [740, 120]], mass: 90, strength: 1100, budget: 255 },
    { name: '重载高塔', ends: [200, 760], towers: [[185, 95], [775, 95]], mass: 110, strength: 1350, budget: 285 },
    { name: '偏塔货运', ends: [200, 760], towers: [[200, 100], [760, 170]], mass: 120, strength: 1500, budget: 260 }
  ];
  function finite(value, fallback) { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
  function emit(state, type, details) { state.events.push(Object.assign({ type: type, tick: state.tick }, details || {})); }
  function findNode(state, id) { return state.nodes.find(function (node) { return node.id === id; }); }
  function findAnchor(state, id) { return state.anchors.find(function (anchor) { return anchor.id === id; }); }
  function material(state) {
    state.spent = state.cables.reduce(function (sum, cable) { return sum + (cable.installed ? cable.cost : 0); }, 0);
    state.remainingBudget = state.budget - state.spent;
  }
  function surface(state, x) {
    var left = state.nodes[0], right = state.nodes[state.nodes.length - 1];
    if (x < left.x) return { y: left.restY, panelId: 'bank-left', aId: null, bId: null, u: 0 };
    if (x > right.x) return { y: right.restY, panelId: 'bank-right', aId: null, bId: null, u: 0 };
    for (var i = 0; i < state.panels.length; i += 1) {
      var panel = state.panels[i], a = findNode(state, panel.aId), b = findNode(state, panel.bId);
      if (x >= a.x - 1e-8 && x <= b.x + 1e-8 && !panel.broken) {
        var u = Math.max(0, Math.min(1, (x - a.x) / (b.x - a.x)));
        return { y: a.y + (b.y - a.y) * u, panelId: panel.id, aId: a.id, bId: b.id, u: u };
      }
    }
    return null;
  }
  function contacts(state) {
    var car = state.car;
    return [-1, 1].map(function (sign) { return surface(state, car.x + sign * car.wheelbase / 2); });
  }
  function poseCar(state) {
    var car = state.car, support = contacts(state);
    if (!car.falling && support.every(Boolean)) {
      car.wheels = support.map(function (hit, index) { return { x: car.x + (index ? 1 : -1) * car.wheelbase / 2,
        y: hit.y - car.wheelRadius, contact: true, panelId: hit.panelId }; });
      car.y = (car.wheels[0].y + car.wheels[1].y) / 2 - 18;
      car.angle = Math.atan2(car.wheels[1].y - car.wheels[0].y, car.wheelbase);
    } else {
      car.wheels = [-1, 1].map(function (sign) { return { x: car.x + Math.cos(car.angle) * sign * car.wheelbase / 2,
        y: car.y + 18 + Math.sin(car.angle) * sign * car.wheelbase / 2, contact: false, panelId: null }; });
    }
  }
  function buildGeometry(state) {
    var settings = SETTINGS[state.difficulty], left = settings.ends[0], right = settings.ends[1];
    state.anchors = settings.towers.map(function (point, i) { return { id: 'anchor-' + (i + 1), x: point[0], y: point[1], name: i ? '东塔锚点' : '西塔锚点' }; });
    state.nodes = [];
    for (var i = 0; i < 5; i += 1) state.nodes.push({ id: 'node-' + i, x: left + (right - left) * i / 4,
      y: 310, restY: 310, fixed: i === 0 || i === 4, mass: 5, vy: 0, load: 0, force: 0 });
    state.panels = [];
    for (var p = 0; p < 4; p += 1) state.panels.push({ id: 'panel-' + p, aId: 'node-' + p, bId: 'node-' + (p + 1),
      broken: false, stiffness: 250, damping: 20 });
    state.cables = [];
    for (var n = 1; n < 4; n += 1) state.anchors.forEach(function (anchor) {
      var node = state.nodes[n], length = Math.hypot(node.x - anchor.x, node.y - anchor.y) / SCALE;
      state.cables.push({ id: 'cable-' + n + '-' + anchor.id.slice(-1), anchorId: anchor.id, nodeId: node.id,
        installed: false, broken: false, tension: 0, maxTension: settings.strength, restLength: length, length: length,
        stiffness: 6000, damping: 90, cost: Math.ceil(length * 10), x: (anchor.x + node.x) / 2, y: (anchor.y + node.y) / 2,
        brokenAt: null });
    });
    state.car = { x: left - 80, y: 282, angle: 0, speed: 20, mass: settings.mass, wheelbase: 56, wheelRadius: 10,
      wheels: [], falling: false, vy: 0, finished: false, finishX: right + 80 };
    state.brokenCount = 0; state.peakTensionRatio = 0; poseCar(state);
  }
  function create(seed, difficulty) {
    var index = Math.max(0, Math.min(2, Math.floor(finite(difficulty, 0)))), settings = SETTINGS[index];
    var state = { seed: finite(seed, 1) >>> 0, difficulty: index, level: index + 1, levelName: settings.name,
      width: 960, height: 540, pixelScale: SCALE, gravity: G, phase: 'playing', mode: 'editing', elapsed: 0, tick: 0,
      timeLimit: 90, remaining: 90, score: 0, budget: settings.budget, spent: 0, remainingBudget: settings.budget,
      anchors: [], nodes: [], panels: [], cables: [], car: null, selectedId: 'cable-1-1', attempts: 0,
      brokenCount: 0, peakTensionRatio: 0, lastFailure: null, lostReason: null,
      message: '方向选择候选索 · A 加装 / 拆除 · B 开始载重测试', events: [],
      _blueprint: null, _remainder: 0, _aDown: false, _bDown: false, _direction: -1, _repeatIn: 0 };
    buildGeometry(state); return state;
  }
  function select(state, direction) {
    var current = state.cables.find(function (cable) { return cable.id === state.selectedId; });
    if (!current) return;
    var v = DIRECTIONS[direction], candidates = state.cables.map(function (cable) {
      var dx = cable.x - current.x, dy = cable.y - current.y;
      return { cable: cable, forward: dx * v[0] + dy * v[1], side: Math.abs(dx * v[1] - dy * v[0]), distance: dx * dx + dy * dy };
    }).filter(function (item) { return item.forward > 1e-8; }).sort(function (a, b) { return a.distance - b.distance; });
    var next = candidates.find(function (item) { return item.forward >= item.side - 1e-8; }) || candidates[0];
    if (next) { state.selectedId = next.cable.id; emit(state, 'select', { id: state.selectedId }); }
  }
  function toggleCable(state) {
    if (state.mode !== 'editing') { state.message = '试载时不能改索 · B 回到原搭建方案'; return; }
    var cable = state.cables.find(function (item) { return item.id === state.selectedId; });
    if (!cable) return;
    if (!cable.installed && cable.cost > state.remainingBudget) {
      state.message = '材料不足 · 拆除其他索或选择较短的连接'; emit(state, 'blocked', { reason: 'budget', id: cable.id }); return;
    }
    cable.installed = !cable.installed; material(state);
    state.message = (cable.installed ? '已加装' : '已拆除') + '拉索 · 剩余材料 ' + state.remainingBudget;
    emit(state, 'build', { id: cable.id, installed: cable.installed, spent: state.spent });
  }
  function testOrEdit(state) {
    if (state.mode === 'editing') {
      state._blueprint = { installed: state.cables.filter(function (cable) { return cable.installed; }).map(function (cable) { return cable.id; }), selectedId: state.selectedId };
      state.mode = 'testing'; state.attempts += 1; state.lastFailure = null;
      state.message = '载重测试进行中 · 看索的张力与桥面下沉 · B 可回编辑'; emit(state, 'test-start', { attempt: state.attempts });
    } else {
      var saved = state._blueprint;
      buildGeometry(state);
      state.cables.forEach(function (cable) { cable.installed = !!saved && saved.installed.indexOf(cable.id) >= 0; });
      if (saved) state.selectedId = saved.selectedId;
      material(state); state.mode = 'editing'; state._blueprint = null;
      state.message = '已恢复测试前搭建 · 材料账不变，可继续修改'; emit(state, 'edit-restored');
    }
  }
  function failure(state, reason) {
    if (state.mode !== 'testing') return;
    state.mode = 'test-failed'; state.lastFailure = reason;
    state.message = reason === 'vehicle-fall' ? '载重车坠落 · B 恢复原搭建方案再加固'
      : reason === 'bridge-collapse' ? '车辆虽已过岸，桥面仍已损坏 · B 回编辑修复支撑' : '桥面倾斜过大 · B 回编辑调整支撑';
    emit(state, 'test-failed', { reason: reason });
  }
  function finish(state, phase, reason) {
    state.phase = phase; state.lostReason = reason || null; state._remainder = 0;
    if (phase === 'won') { state.car.finished = true; state.score = 1000 + state.remainingBudget * 5 + Math.round(state.remaining * 10); state.message = '载重车安全通过！拉索桥承载测试完成'; }
    else state.message = '建造与试载时间已到 · 重新规划材料再试一次';
    emit(state, phase, { reason: reason || null });
  }
  function physics(state) {
    var car = state.car, forces = Object.create(null), loads = Object.create(null);
    state.nodes.forEach(function (node) { forces[node.id] = node.mass * G - node.vy * 12; loads[node.id] = 0; });
    if (!car.falling) {
      var support = contacts(state);
      if (!support.every(Boolean)) { car.falling = true; car.vy = 0; emit(state, 'fall'); }
      else support.forEach(function (hit) {
        if (!hit.aId) return;
        var weight = car.mass * G / 2;
        loads[hit.aId] += weight * (1 - hit.u); loads[hit.bId] += weight * hit.u;
      });
    }
    state.panels.forEach(function (panel) {
      if (panel.broken) return;
      var a = findNode(state, panel.aId), b = findNode(state, panel.bId);
      var force = panel.stiffness * (b.y - a.y) / SCALE + panel.damping * (b.vy - a.vy);
      forces[a.id] += force; forces[b.id] -= force;
    });
    state.cables.forEach(function (cable) {
      var node = findNode(state, cable.nodeId), anchor = findAnchor(state, cable.anchorId);
      var dx = (node.x - anchor.x) / SCALE, dy = (node.y - anchor.y) / SCALE, length = Math.hypot(dx, dy);
      cable.length = length; cable.tension = 0;
      if (!cable.installed || cable.broken) return;
      var extension = length - cable.restLength;
      if (extension <= 0 || !length) return;
      var force = Math.max(0, cable.stiffness * extension + cable.damping * node.vy * dy / length);
      state.peakTensionRatio = Math.max(state.peakTensionRatio, force / cable.maxTension);
      if (force > cable.maxTension) {
        cable.broken = true; cable.brokenAt = state.elapsed; state.brokenCount += 1;
        emit(state, 'cable-break', { id: cable.id, tension: force }); return;
      }
      cable.tension = force; forces[node.id] -= force * dy / length;
    });
    state.nodes.forEach(function (node) {
      node.load = loads[node.id]; node.force = forces[node.id] + node.load;
      if (node.fixed) { node.vy = 0; node.y = node.restY; return; }
      node.vy += node.force / node.mass * DT; node.y += node.vy * SCALE * DT;
    });
    state.cables.forEach(function (cable) {
      var node = findNode(state, cable.nodeId), anchor = findAnchor(state, cable.anchorId);
      cable.length = Math.hypot(node.x - anchor.x, node.y - anchor.y) / SCALE;
    });
    state.panels.forEach(function (panel) {
      if (panel.broken) return;
      var a = findNode(state, panel.aId), b = findNode(state, panel.bId);
      if (Math.abs(a.y - b.y) > 72 || Math.max(a.y - a.restY, b.y - b.restY) > 95) {
        panel.broken = true; emit(state, 'panel-break', { id: panel.id });
      }
    });
    if (!car.falling && !contacts(state).every(Boolean)) { car.falling = true; car.vy = 0; emit(state, 'fall'); }
    car.x += car.speed * DT * (car.falling ? 0.35 : 1);
    if (car.falling) { car.vy += G * DT; car.y += car.vy * SCALE * DT; car.angle += 0.45 * DT; }
    poseCar(state);
    if (car.falling && car.y > 500) failure(state, 'vehicle-fall');
    else if (!car.falling && Math.abs(car.angle) > 0.7) failure(state, 'bridge-slope');
    else if (!car.falling && car.x >= car.finishX) {
      if (state.panels.some(function (panel) { return panel.broken; })) failure(state, 'bridge-collapse');
      else finish(state, 'won');
    }
  }
  function step(state, dt, input) {
    if (!state || state.phase !== 'playing') return state;
    dt = Math.max(0, Math.min(0.25, finite(dt, 0))); if (!dt) return state;
    input = input || {}; state.events = [];
    var x = finite(input.x, 0), y = finite(input.y, 0), direction = -1;
    if (Math.max(Math.abs(x), Math.abs(y)) >= 0.45) direction = Math.abs(x) >= Math.abs(y) ? (x > 0 ? 0 : 2) : (y > 0 ? 1 : 3);
    if (direction !== state._direction) { state._direction = direction; state._repeatIn = 0.42; if (direction >= 0) select(state, direction); }
    else if (direction >= 0) { state._repeatIn -= dt; while (state._repeatIn <= 1e-10) { select(state, direction); state._repeatIn += 0.16; } }
    var a = !!input.aPressed || (!!input.a && !state._aDown), b = !!input.bPressed || (!!input.b && !state._bDown);
    state._aDown = !!input.a; state._bDown = !!input.b;
    if (a) toggleCable(state);
    if (b) testOrEdit(state);
    state._remainder += dt;
    while (state._remainder >= DT - 1e-10 && state.phase === 'playing') {
      state._remainder = Math.max(0, state._remainder - DT); state.tick += 1; state.elapsed = state.tick * DT;
      state.remaining = Math.max(0, state.timeLimit - state.elapsed);
      if (state.mode === 'testing') physics(state);
      if (state.phase === 'playing' && state.remaining <= 1e-9) finish(state, 'lost', 'timeout');
    }
    return state;
  }
  return { create: create, step: step, TICK_HZ: 120 };
});
