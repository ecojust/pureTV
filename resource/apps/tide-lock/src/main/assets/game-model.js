/* Two finite-volume locks. Boat displacement is intentionally ignored. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 60, TOLERANCE = 0.15, GATE_K = 4, GATE_MAX_FLOW = 2.5;
  var VECTORS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  function finite(value, fallback) { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
  function zone(state, id) { return state.zones.find(function (item) { return item.id === id; }); }
  function active(state) { return state.boats.find(function (boat) { return boat.id === state.activeBoatId; }); }
  function center(item) { return (item.x1 + item.x2) / 2; }
  function emit(state, type, details) { state.events.push(Object.assign({ type: type, tick: state.tick }, details || {})); }
  function localValves(state, ids) { return state.valves.filter(function (valve) { return ids.indexOf(valve.zoneId) >= 0; }); }
  function adjacentGates(state, id) { return state.gates.filter(function (gate) { return gate.leftId === id || gate.rightId === id; }); }
  function updateWater(state) {
    state.totalVolume = 0;
    state.zones.forEach(function (item) {
      if (!item.isReservoir) { item.level = item.floor + item.volume / item.area; state.totalVolume += item.volume; }
      item.waterY = state.floorY - item.level * state.levelScale;
    });
  }
  function updateGeometry(state) {
    state.gates.forEach(function (gate) {
      gate.locked = state.boats.some(function (boat) { return boat.status === 'moving' && boat.gateId === gate.id; });
      gate.difference = Math.abs(zone(state, gate.leftId).level - zone(state, gate.rightId).level);
      gate.blockedReason = gate.locked ? 'boat-crossing' : localValves(state, [gate.leftId, gate.rightId]).some(function (valve) { return valve.open; }) ? 'valve-open' : gate.difference > TOLERANCE + 1e-9 ? 'water-difference' : null;
    });
    state.boats.forEach(function (boat) {
      var here = zone(state, boat.zoneId), surface = here.level, floor = here.floor;
      if (boat.status === 'moving') {
        var from = zone(state, boat.fromZoneId), to = zone(state, boat.toZoneId);
        surface = from.level + (to.level - from.level) * boat.progress;
        floor = Math.max(from.floor, to.floor);
        boat.x = center(from) + (center(to) - center(from)) * boat.progress;
      } else boat.x = center(here);
      // y is the hull's waterline. The keel cannot pass below the canal floor.
      boat.y = state.floorY - Math.max(surface, floor + boat.draft) * state.levelScale;
      boat.depth = Math.max(0, surface - floor);
      boat.grounded = boat.status !== 'queued' && boat.status !== 'exited' && boat.depth < boat.draft - 1e-9;
    });
  }
  function create(seed, difficulty) {
    var index = Math.max(0, Math.min(2, Math.floor(finite(difficulty, 0))));
    var bounds = [[80, 245, 480, 715, 895], [80, 230, 470, 730, 895], [80, 220, 460, 735, 895]][index];
    var low = [2, 1.5, 1][index], high = [6, 6.5, 7][index], areas = [[1, 1.05], [1.1, 1.15], [1.2, 1.25]][index];
    var state = {
      seed: finite(seed, 1) >>> 0, difficulty: index, level: index + 1, levelName: ['初潮', '连航', '满载'][index],
      width: 960, height: 540, floorY: 460, levelScale: 40,
      phase: 'playing', elapsed: 0, tick: 0, timeLimit: [65, 90, 90][index], remaining: [65, 90, 90][index],
      midLevel: 4, fillHead: 10, drainHead: 0, maxGroundedTime: 3, gateTolerance: TOLERANCE,
      boatSpeed: [31, 52, 68][index], valveRate: [0.5, 0.85, 1.3][index],
      deliveries: 0, target: index + 1, score: 0, zones: [], gates: [], valves: [], controls: [], boats: [],
      selectedId: 'gate-1', activeBoatId: 'boat-1', sourceVolume: 0, sinkVolume: 0, overflowVolume: 0,
      totalVolume: 0, initialVolume: 0, lostReason: null,
      message: 'A 开闸，B 让船进入第一闸室 · 先关闸，再用阀门调平水位', events: [],
      _remainder: 0, _aDown: false, _bDown: false, _direction: -1, _repeatIn: 0
    };
    ['entry', 'lock-1', 'lock-2', 'exit'].forEach(function (id, i) {
      var reservoir = i === 0 || i === 3, level = [low, low, 4, high][i], area = reservoir ? null : areas[i - 1];
      state.zones.push({ id: id, name: ['下游', '第一闸室', '第二闸室', '上游'][i], x1: bounds[i], x2: bounds[i + 1],
        level: level, waterY: 0, floor: 0, area: area, volume: reservoir ? null : area * level, capacity: 8, isReservoir: reservoir });
    });
    for (var i = 0; i < 3; i += 1) state.gates.push({ id: 'gate-' + (i + 1), type: 'gate', name: ['下游闸门', '中间闸门', '上游闸门'][i],
      x: bounds[i + 1], y: 265, leftId: state.zones[i].id, rightId: state.zones[i + 1].id, open: false, locked: false, blockedReason: null, difference: 0, flow: 0 });
    state.zones.filter(function (item) { return !item.isReservoir; }).forEach(function (item, i) {
      ['fill', 'drain'].forEach(function (type) {
        state.valves.push({ id: type + '-' + (i + 1), type: type, name: (i + 1) + ' 号' + (type === 'fill' ? '注水阀' : '排水阀'),
          zoneId: item.id, x: center(item), y: type === 'fill' ? 105 : 450, open: false, flow: 0 });
      });
    });
    state.controls = state.gates.concat(state.valves);
    for (var b = 0; b < state.target; b += 1) state.boats.push({ id: 'boat-' + (b + 1), name: (b + 1) + ' 号货船',
      x: center(state.zones[0]), y: 0, zoneId: 'entry', status: b === 0 ? 'waiting' : 'queued', draft: [0.55, 0.6, 0.65][index], length: 44,
      grounded: false, groundedTime: 0, dry: true, fromZoneId: null, toZoneId: null, gateId: null, progress: 0, exitedAt: null });
    updateWater(state); state.initialVolume = state.totalVolume; updateGeometry(state);
    return state;
  }
  function select(state, direction) {
    var current = state.controls.find(function (item) { return item.id === state.selectedId; });
    if (!current) return;
    var v = VECTORS[direction], candidates = state.controls.map(function (item) {
      var dx = item.x - current.x, dy = item.y - current.y;
      return { item: item, forward: dx * v[0] + dy * v[1], side: Math.abs(dx * v[1] - dy * v[0]), distance: dx * dx + dy * dy };
    }).filter(function (item) { return item.forward > 0; }).sort(function (a, b) { return a.distance - b.distance; });
    var next = candidates.find(function (item) { return item.forward >= item.side; }) || candidates[0];
    if (next) { state.selectedId = next.item.id; emit(state, 'select', { id: state.selectedId }); }
  }
  function toggle(state) {
    var gate = state.gates.find(function (item) { return item.id === state.selectedId; });
    if (gate) {
      if (gate.locked || (!gate.open && gate.blockedReason)) {
        var reason = gate.blockedReason;
        state.message = reason === 'boat-crossing' ? '船正在跨闸 · 船尾完全离开后才能关门' : reason === 'valve-open' ? '先关闭相邻注水、排水阀，再开闸' : '两侧水位差太大 · 调到相差不超过 0.15 米';
        emit(state, 'blocked', { id: gate.id, reason: reason }); return;
      }
      gate.open = !gate.open; state.message = gate.name + (gate.open ? '已开 · B 请求船只前进' : '已关 · 可以安全调节水位');
      emit(state, 'gate', { id: gate.id, open: gate.open }); return;
    }
    var valve = state.valves.find(function (item) { return item.id === state.selectedId; });
    if (!valve) return;
    if (!valve.open && adjacentGates(state, valve.zoneId).some(function (item) { return item.open || item.locked; })) {
      state.message = '先关闭这间闸室的两侧闸门，再开启水阀'; emit(state, 'blocked', { id: valve.id, reason: 'gate-open' }); return;
    }
    valve.open = !valve.open; if (!valve.open) valve.flow = 0;
    state.message = valve.name + (valve.open ? '已开 · 看好水位，接近目标时及时关闭' : '已关闭');
    emit(state, 'valve', { id: valve.id, open: valve.open });
  }
  function requestAdvance(state) {
    var boat = active(state);
    if (!boat || boat.status !== 'waiting') { emit(state, 'blocked', { reason: 'boat-moving' }); return; }
    var gate = state.gates.find(function (item) { return item.leftId === boat.zoneId; });
    if (!gate || !gate.open) { state.message = '先把前方水位调平并开闸，再按 B 前进'; emit(state, 'blocked', { reason: 'gate-closed' }); return; }
    var from = zone(state, gate.leftId), to = zone(state, gate.rightId);
    if (gate.difference > TOLERANCE + 1e-9 || Math.min(from.level - from.floor, to.level - to.floor) < boat.draft + 0.05 - 1e-9) {
      state.message = '水深不足或水位未平 · 货船暂不能前进'; emit(state, 'blocked', { reason: 'unsafe-water' }); return;
    }
    boat.status = 'moving'; boat.fromZoneId = from.id; boat.toZoneId = to.id; boat.gateId = gate.id; boat.progress = 0;
    state.message = boat.name + '正在平稳过闸 · 过船时不能关闭闸门'; emit(state, 'advance', { boatId: boat.id, gateId: gate.id });
  }
  // All pairwise gate fluxes use the same old state. 2*K*DT/area <= 0.134
  // for these layouts, so the isolated gate network obeys a maximum principle.
  function waterStep(state) {
    var changes = Object.create(null), flows = [], overflowed = [];
    state.zones.forEach(function (item) { if (!item.isReservoir) changes[item.id] = 0; });
    function add(from, to, amount, device) { if (amount > 0) flows.push({ from: from, to: to, amount: amount, device: device }); }
    state.gates.forEach(function (gate) {
      gate.flow = 0; if (!gate.open) return;
      var left = zone(state, gate.leftId), right = zone(state, gate.rightId), diff = left.level - right.level;
      var q = Math.min(GATE_MAX_FLOW, Math.abs(diff) * GATE_K);
      add(diff >= 0 ? left : right, diff >= 0 ? right : left, q * DT, gate);
    });
    state.valves.forEach(function (valve) {
      valve.flow = 0; if (!valve.open) return;
      var chamber = zone(state, valve.zoneId), fill = valve.type === 'fill';
      var head = fill ? state.fillHead - chamber.level : chamber.level - state.drainHead;
      var amount = Math.min(state.valveRate * DT, Math.max(0, head) * chamber.area);
      add(fill ? null : chamber, fill ? chamber : null, amount, valve);
    });
    // Bound combined withdrawals (including simultaneous valves) by old inventory.
    var out = Object.create(null);
    flows.forEach(function (flow) { if (flow.from && !flow.from.isReservoir) out[flow.from.id] = (out[flow.from.id] || 0) + flow.amount; });
    flows.forEach(function (flow) {
      var amount = flow.amount;
      if (flow.from && !flow.from.isReservoir && out[flow.from.id] > flow.from.volume) amount *= flow.from.volume / out[flow.from.id];
      if (flow.from && !flow.from.isReservoir) changes[flow.from.id] -= amount; else state.sourceVolume += amount;
      if (flow.to && !flow.to.isReservoir) changes[flow.to.id] += amount; else state.sinkVolume += amount;
      flow.device.flow += amount / DT;
    });
    state.zones.forEach(function (item) {
      if (item.isReservoir) return;
      var next = Math.max(0, item.volume + changes[item.id]), capacity = (item.capacity - item.floor) * item.area;
      if (next > capacity + 1e-10) { state.overflowVolume += next - capacity; next = capacity; overflowed.push(item.id); }
      item.volume = next;
    });
    updateWater(state);
    return overflowed;
  }
  function finish(state, phase, reason) {
    state.phase = phase; state.lostReason = reason || null; state._remainder = 0;
    if (phase === 'won') { state.score += Math.round(state.remaining * 10); state.message = '全部 ' + state.target + ' 艘货船安全过闸，货物保持干燥！'; }
    else state.message = reason === 'overflow' ? '闸室溢流 · 注水时及时关阀，别让水漫过岸顶' : reason === 'grounding' ? '货船搁浅过久 · 留足船底吃水深度' : '潮汐窗口已结束 · 重新安排开闸与调水顺序';
    emit(state, phase, { reason: reason || null });
  }
  function advanceTick(state) {
    state.tick += 1; state.elapsed = state.tick * DT; state.remaining = Math.max(0, state.timeLimit - state.elapsed);
    var overflowed = waterStep(state), boat = active(state), arrived = false;
    if (boat && boat.status === 'moving') {
      var span = center(zone(state, boat.toZoneId)) - center(zone(state, boat.fromZoneId));
      boat.progress = Math.min(1, boat.progress + state.boatSpeed * DT / span);
      if (boat.progress >= 1 - 1e-10) { boat.progress = 1; arrived = true; }
    }
    updateGeometry(state);
    state.boats.forEach(function (item) {
      if (item.status !== 'queued' && item.status !== 'exited') item.groundedTime = item.grounded ? item.groundedTime + DT : 0;
      if (overflowed.indexOf(item.zoneId) >= 0 || (item.status === 'moving' && (overflowed.indexOf(item.fromZoneId) >= 0 || overflowed.indexOf(item.toZoneId) >= 0))) item.dry = false;
    });
    if (overflowed.length) { finish(state, 'lost', 'overflow'); return; }
    if (state.boats.some(function (item) { return item.groundedTime >= state.maxGroundedTime - 1e-9; })) { finish(state, 'lost', 'grounding'); return; }
    if (arrived) {
      boat.zoneId = boat.toZoneId; boat.status = boat.zoneId === 'exit' ? 'exited' : 'waiting';
      boat.gateId = null; boat.fromZoneId = null; boat.toZoneId = null;
      if (boat.status === 'exited') {
        boat.exitedAt = state.elapsed; state.deliveries += 1; state.score += 1000;
        emit(state, 'delivery', { boatId: boat.id });
        var next = state.boats.find(function (item) { return item.status === 'queued'; });
        state.activeBoatId = next ? next.id : null;
        if (next) { next.status = 'waiting'; state.message = '上一艘已安全出港 · 用排水阀准备闸室，迎接下一艘'; }
      } else state.message = '船已停稳 · 关上身后闸门，再调平前方水位';
      updateGeometry(state);
    }
    if (state.deliveries === state.target && state.boats.every(function (item) { return item.dry; })) finish(state, 'won');
    else if (state.remaining <= 1e-9) finish(state, 'lost', 'timeout');
  }
  function step(state, dt, input) {
    if (!state || state.phase !== 'playing') return state;
    dt = Math.max(0, Math.min(0.25, finite(dt, 0))); if (!dt) return state;
    input = input || {}; state.events = []; updateWater(state); updateGeometry(state);
    var x = finite(input.x, 0), y = finite(input.y, 0), direction = -1;
    if (Math.max(Math.abs(x), Math.abs(y)) >= 0.45) direction = Math.abs(x) >= Math.abs(y) ? (x > 0 ? 0 : 2) : (y > 0 ? 1 : 3);
    if (direction !== state._direction) { state._direction = direction; state._repeatIn = 0.42; if (direction >= 0) select(state, direction); }
    else if (direction >= 0) { state._repeatIn -= dt; while (state._repeatIn <= 1e-10) { select(state, direction); state._repeatIn += 0.16; } }
    var a = !!input.aPressed || (!!input.a && !state._aDown), b = !!input.bPressed || (!!input.b && !state._bDown);
    state._aDown = !!input.a; state._bDown = !!input.b;
    if (a) { toggle(state); updateGeometry(state); }
    if (b) { requestAdvance(state); updateGeometry(state); }
    state._remainder += dt;
    while (state._remainder >= DT - 1e-10 && state.phase === 'playing') { state._remainder = Math.max(0, state._remainder - DT); advanceTick(state); }
    return state;
  }
  return { create: create, step: step, TICK_HZ: 60 };
});
