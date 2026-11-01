/* Deterministic railway dispatch. Every train follows the visible track geometry. */
(function (root, factory) {
  'use strict';
  var model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.PureModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 60, TRAIN_LENGTH = 28, LOCK_RADIUS = 50, RELEASE_CLEARANCE = 90;
  var DIRECTIONS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  var COLORS = ['red', 'blue', 'green', 'blue', 'red', 'green', 'blue', 'red', 'green'];
  var COLOR_BITS = { red: 1, green: 2, blue: 4 };
  var SPEEDS = [100, 130, 140, 112, 126, 108, 136, 116, 138];
  var SCHEDULES = [[0, 0, 1, 12, 18], [0, 0, 1, 8, 13, 18, 23], [0, 0, 1, 6, 10, 14, 18, 22, 26]];
  function finite(value, fallback) { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function node(state, id) { return state.nodes.find(function (item) { return item.id === id; }); }
  function edge(state, id) { return state.edges.find(function (item) { return item.id === id; }); }
  function trainById(state, id) { return state.trains.find(function (item) { return item.id === id; }); }
  function emit(state, type, details) { state.events.push(Object.assign({ type: type, tick: state.tick }, details || {})); }
  function arc(cx, cy, start, end) {
    var points = [], direction = end > start ? 10 : -10;
    for (var angle = start; direction > 0 ? angle <= end : angle >= end; angle += direction) {
      points.push({ x: cx + Math.cos(angle * Math.PI / 180) * 48, y: cy + Math.sin(angle * Math.PI / 180) * 48 });
    }
    return points;
  }
  function makeEdge(id, from, to, points) {
    var length = 0;
    for (var i = 1; i < points.length; i += 1) length += distance(points[i - 1], points[i]);
    return { id: id, from: from, to: to, points: points, length: length,
      x1: points[0].x, y1: points[0].y, x2: points[points.length - 1].x, y2: points[points.length - 1].y };
  }
  function create(seed, difficulty) {
    var level = Math.max(0, Math.min(2, Math.floor(finite(difficulty, 0))));
    var state = {
      seed: finite(seed, 1) >>> 0, difficulty: level, level: level + 1,
      levelName: ['双向早班', '交错货运', '繁忙站场'][level], width: 960, height: 540,
      phase: 'playing', elapsed: 0, tick: 0, timeLimit: 90, remaining: 90,
      deliveries: 0, target: SCHEDULES[level].length, score: 0, delay: 0, delayLimit: [100, 180, 260][level],
      nodes: [], edges: [], gates: [], switches: [], trains: [], selectedId: 'switch-main',
      trainLength: TRAIN_LENGTH, lockRadius: LOCK_RADIUS, releaseClearance: RELEASE_CLEARANCE,
      message: '先设好同色站台路线 · 方向键选择 · A 切岔道 · B 放行队首',
      events: [], lostReason: null, collision: null,
      _remainder: 0, _aDown: false, _bDown: false, _direction: -1, _repeatIn: 0
    };
    state.gates = [
      { id: 'gate-west', type: 'gate', x: 100, y: 270, name: '西侧等待区', queue: [], blocked: false, nextId: null, edgeId: 'west-main' },
      { id: 'gate-east', type: 'gate', x: 860, y: 270, name: '东侧等待区', queue: [], blocked: false, nextId: null, edgeId: 'east-main' }
    ];
    state.switches = [
      { id: 'switch-main', type: 'switch', x: 430, y: 270, name: '中央道岔', route: 1,
        outputs: ['switch-color', 'platform-blue'], routeNames: ['红 / 绿支线', '蓝色站台'], locked: false, lockedBy: [] },
      { id: 'switch-color', type: 'switch', x: 580, y: 150, name: '分色道岔', route: 0,
        outputs: ['platform-red', 'platform-green'], routeNames: ['红色站台', '绿色站台'], locked: false, lockedBy: [] }
    ];
    state.nodes = state.gates.concat(state.switches, [
      { id: 'platform-red', type: 'platform', x: 820, y: 80, color: 'red', colorBits: 1, name: '红色站台' },
      { id: 'platform-green', type: 'platform', x: 820, y: 190, color: 'green', colorBits: 2, name: '绿色站台' },
      { id: 'platform-blue', type: 'platform', x: 700, y: 440, color: 'blue', colorBits: 4, name: '蓝色站台' }
    ]);
    state.edges = [
      makeEdge('west-main', 'gate-west', 'switch-main', [{ x: 100, y: 270 }, { x: 430, y: 270 }]),
      makeEdge('east-main', 'gate-east', 'switch-main', [{ x: 860, y: 270 }, { x: 430, y: 270 }]),
      makeEdge('main-color', 'switch-main', 'switch-color', [{ x: 430, y: 270 }].concat(arc(478, 198, 180, 270), [{ x: 580, y: 150 }])),
      makeEdge('main-blue', 'switch-main', 'platform-blue', [{ x: 430, y: 270 }].concat(arc(478, 392, 180, 90), [{ x: 700, y: 440 }])),
      makeEdge('color-red', 'switch-color', 'platform-red', [{ x: 580, y: 150 }, { x: 820, y: 80 }]),
      makeEdge('color-green', 'switch-color', 'platform-green', [{ x: 580, y: 150 }, { x: 820, y: 190 }])
    ];
    SCHEDULES[level].forEach(function (readyAt, index) {
      var gate = state.gates[index % 2], color = COLORS[index];
      var train = { id: 'train-' + (index + 1), name: (index + 1) + ' 号货车', color: color, colorBits: COLOR_BITS[color],
        destination: 'platform-' + color, gateId: gate.id, readyAt: readyAt, speed: SPEEDS[index],
        status: readyAt === 0 ? 'waiting' : 'scheduled', x: gate.x, y: gate.y, angle: index % 2 ? Math.PI : 0,
        edgeId: null, from: gate.id, to: null, progress: 0, length: TRAIN_LENGTH,
        routeChoices: {}, releasedAt: null, arrivedAt: null, waitingTime: 0 };
      state.trains.push(train); gate.queue.push(train.id);
    });
    updateOccupancy(state);
    return state;
  }
  function updateOccupancy(state) {
    state.switches.forEach(function (junction) {
      junction.lockedBy = state.trains.filter(function (train) { return train.status === 'moving' && distance(train, junction) <= LOCK_RADIUS + 1e-8; }).map(function (train) { return train.id; });
      junction.locked = junction.lockedBy.length > 0;
      state.trains.forEach(function (train) {
        if (train.status === 'moving' && train.to === junction.id) {
          var track = edge(state, train.edgeId);
          if (track && track.length - train.progress <= LOCK_RADIUS + 1e-8 && train.routeChoices[junction.id] === undefined) train.routeChoices[junction.id] = junction.route;
        }
      });
    });
    state.gates.forEach(function (gate) {
      gate.blocked = state.trains.some(function (train) { return train.status === 'moving' && distance(train, gate) < RELEASE_CLEARANCE - 1e-8; });
      gate.nextId = gate.queue.length ? gate.queue[0] : null;
    });
  }
  function select(state, direction) {
    var controls = state.gates.concat(state.switches), current = controls.find(function (item) { return item.id === state.selectedId; });
    if (!current) return;
    var v = DIRECTIONS[direction], candidates = controls.map(function (item) {
      var dx = item.x - current.x, dy = item.y - current.y;
      return { item: item, forward: dx * v[0] + dy * v[1], side: Math.abs(dx * v[1] - dy * v[0]), distance: dx * dx + dy * dy };
    }).filter(function (item) { return item.forward > 0; }).sort(function (a, b) { return a.distance - b.distance; });
    var next = candidates.find(function (item) { return item.forward >= item.side; }) || candidates[0];
    if (next) { state.selectedId = next.item.id; emit(state, 'select', { selectedId: state.selectedId }); }
  }
  function toggle(state) {
    var junction = state.switches.find(function (item) { return item.id === state.selectedId; });
    if (!junction) { state.message = '等待区按 B 放行 · 选择道岔后按 A 改道'; return; }
    if (junction.locked) { state.message = '列车正在通过 · 道岔锁定，请等车尾离开'; emit(state, 'blocked', { reason: 'switch-occupied', id: junction.id }); return; }
    junction.route = 1 - junction.route;
    state.message = junction.name + ' → ' + junction.routeNames[junction.route];
    emit(state, 'toggle', { id: junction.id, route: junction.route });
  }
  function release(state) {
    var gate = state.gates.find(function (item) { return item.id === state.selectedId; });
    if (!gate) { state.message = '先选择西侧或东侧等待区，再按 B 放行队首'; return; }
    var train = trainById(state, gate.nextId);
    if (!train || train.status !== 'waiting' || gate.blocked) {
      state.message = gate.blocked ? '出口仍有列车 · 留出间距再放行' : train ? '下一班列车尚未到达等待区' : '这侧班次已全部放行';
      emit(state, 'blocked', { reason: gate.blocked ? 'gate-occupied' : train ? 'not-ready' : 'empty', id: gate.id }); return;
    }
    var track = edge(state, gate.edgeId);
    train.status = 'moving'; train.edgeId = track.id; train.from = gate.id; train.to = track.to;
    train.progress = 0; train.releasedAt = state.elapsed; train.routeChoices = {};
    gate.queue.shift(); updateOccupancy(state);
    state.message = train.name + '已放行 · 注意中央汇合区，提前设好同色路线';
    emit(state, 'release', { trainId: train.id, gateId: gate.id });
  }
  function sample(points, progress) {
    var traversed = 0;
    for (var i = 1; i < points.length; i += 1) {
      var a = points[i - 1], b = points[i], length = distance(a, b);
      if (progress < traversed + length - 1e-8 || i === points.length - 1) {
        var u = Math.max(0, Math.min(1, (progress - traversed) / length));
        return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u,
          angle: Math.atan2(b.y - a.y, b.x - a.x), remaining: Math.max(0, traversed + length - progress) };
      }
      traversed += length;
    }
    return { x: points[0].x, y: points[0].y, angle: 0, remaining: 0 };
  }
  // Produces timestamped linear pieces, including every sampled curve segment.
  function move(state, original, duration) {
    var train = Object.assign({}, original, { routeChoices: Object.assign({}, original.routeChoices) });
    var segments = [], time = 0, pending = null, guard = 0;
    while (time < duration - 1e-10 && !pending && guard++ < 256) {
      var track = edge(state, train.edgeId);
      if (!track) break;
      var points = train.from === track.from ? track.points : track.points.slice().reverse();
      var start = sample(points, train.progress), speed = Math.max(0, finite(train.speed, 0));
      if (!speed) { segments.push({ t0: time, t1: duration, x0: train.x, y0: train.y, x1: train.x, y1: train.y }); time = duration; break; }
      var durationLeft = duration - time, travel = Math.min(speed * durationLeft, start.remaining);
      var pieceTime = travel / speed, endProgress = train.progress + travel, end = sample(points, endProgress);
      var nextJunction = state.switches.find(function (item) { return item.id === train.to; });
      if (nextJunction && track.length - endProgress <= LOCK_RADIUS + 1e-8 && train.routeChoices[nextJunction.id] === undefined) train.routeChoices[nextJunction.id] = nextJunction.route;
      segments.push({ t0: time, t1: time + pieceTime, x0: start.x, y0: start.y, x1: end.x, y1: end.y });
      train.x = end.x; train.y = end.y; train.angle = start.angle; train.progress = endProgress; time += pieceTime;
      if (track.length - train.progress <= 1e-7) {
        var destination = node(state, train.to);
        if (!destination || destination.type !== 'switch') { pending = { nodeId: train.to, time: time }; break; }
        var choice = train.routeChoices[destination.id];
        if (choice === undefined) choice = destination.route;
        var target = destination.outputs[choice];
        var nextEdge = state.edges.find(function (item) { return item.from === destination.id && item.to === target; });
        if (!nextEdge) { pending = { nodeId: train.to, time: time }; break; }
        train.edgeId = nextEdge.id; train.from = destination.id; train.to = target; train.progress = 0;
      }
    }
    return { train: train, segments: segments, pending: pending };
  }
  function at(piece, time) {
    var span = piece.t1 - piece.t0, u = span > 1e-12 ? (time - piece.t0) / span : 0;
    return { x: piece.x0 + (piece.x1 - piece.x0) * u, y: piece.y0 + (piece.y1 - piece.y0) * u };
  }
  function firstContact(a, b, radius) {
    var low = Math.max(a.t0, b.t0), high = Math.min(a.t1, b.t1);
    if (high < low - 1e-10) return null;
    var pa = at(a, low), pb = at(b, low), rx = pa.x - pb.x, ry = pa.y - pb.y;
    var c = rx * rx + ry * ry - radius * radius;
    if (c <= 1e-8) return low;
    var da = a.t1 - a.t0, db = b.t1 - b.t0;
    var vx = (da > 1e-12 ? (a.x1 - a.x0) / da : 0) - (db > 1e-12 ? (b.x1 - b.x0) / db : 0);
    var vy = (da > 1e-12 ? (a.y1 - a.y0) / da : 0) - (db > 1e-12 ? (b.y1 - b.y0) / db : 0);
    var aa = vx * vx + vy * vy;
    if (aa <= 1e-12) return null;
    var bb = 2 * (rx * vx + ry * vy), discriminant = bb * bb - 4 * aa * c;
    if (discriminant < 0) return null;
    var root = (-bb - Math.sqrt(Math.max(0, discriminant))) / (2 * aa);
    return root >= -1e-10 && root <= high - low + 1e-10 ? low + Math.max(0, root) : null;
  }
  function collision(motions) {
    var earliest = null;
    for (var i = 0; i < motions.length; i += 1) for (var j = i + 1; j < motions.length; j += 1) {
      var a = motions[i], b = motions[j], radius = (a.train.length + b.train.length) / 2;
      for (var p = 0; p < a.segments.length; p += 1) for (var q = 0; q < b.segments.length; q += 1) {
        var time = firstContact(a.segments[p], b.segments[q], radius);
        if (time !== null && (!earliest || time < earliest.time)) earliest = { time: time, trainIds: [a.train.id, b.train.id] };
      }
    }
    return earliest;
  }
  function finish(state, phase, reason) {
    state.phase = phase; state.lostReason = reason || null; state._remainder = 0;
    if (phase === 'won') { state.score += Math.max(0, Math.round(state.remaining * 10 - state.delay * 2)); state.message = '全部 ' + state.target + ' 班列车安全进站！调度完成'; }
    else state.message = reason === 'collision' ? '列车发生碰撞 · 错开放行，给汇合区留出间隔' : reason === 'wrong-platform' ? '驶入了错误站台 · 放行前检查两处道岔' : reason === 'delay' ? '累计等待已超限 · 减少空等，及时安排班次' : '本轮调度时间已到 · 再试一次';
    emit(state, phase, { reason: reason || null });
  }
  function advance(state) {
    var startTime = state.elapsed, endTime = (state.tick + 1) * DT;
    updateOccupancy(state);
    var moving = state.trains.filter(function (train) { return train.status === 'moving'; });
    var motions = moving.map(function (train) { return move(state, train, DT); }), hit = collision(motions);
    state.tick += 1; state.elapsed = endTime; state.remaining = Math.max(0, state.timeLimit - endTime);
    state.trains.forEach(function (train) {
      if (train.status === 'scheduled' && train.readyAt <= endTime + 1e-10) train.status = 'waiting';
      if (train.status === 'waiting') {
        var delay = Math.max(0, endTime - Math.max(startTime, train.readyAt)); train.waitingTime += delay; state.delay += delay;
      }
    });
    if (hit) {
      moving.forEach(function (train) { Object.assign(train, move(state, train, hit.time).train); });
      var first = trainById(state, hit.trainIds[0]), second = trainById(state, hit.trainIds[1]);
      state.collision = { trainIds: hit.trainIds, x: (first.x + second.x) / 2, y: (first.y + second.y) / 2, at: startTime + hit.time };
      updateOccupancy(state); finish(state, 'lost', 'collision'); return;
    }
    motions.forEach(function (motion) { Object.assign(trainById(state, motion.train.id), motion.train); });
    var wrong = motions.find(function (motion) { return motion.pending && motion.pending.nodeId !== motion.train.destination; });
    if (wrong) { updateOccupancy(state); finish(state, 'lost', 'wrong-platform'); return; }
    motions.forEach(function (motion) {
      if (!motion.pending) return;
      var train = trainById(state, motion.train.id);
      train.status = 'arrived'; train.arrivedAt = startTime + motion.pending.time;
      state.deliveries += 1; state.score += 1000;
      state.message = train.name + '已安全进站 · ' + state.deliveries + ' / ' + state.target;
      emit(state, 'arrival', { trainId: train.id, platformId: motion.pending.nodeId });
    });
    updateOccupancy(state);
    if (state.delay >= state.delayLimit - 1e-8) finish(state, 'lost', 'delay');
    else if (state.deliveries === state.target) finish(state, 'won');
    else if (state.remaining <= 1e-8) finish(state, 'lost', 'timeout');
  }
  function step(state, dt, input) {
    if (!state || state.phase !== 'playing') return state;
    dt = Math.max(0, Math.min(0.25, finite(dt, 0)));
    if (!dt) return state;
    input = input || {}; state.events = []; updateOccupancy(state);
    var x = finite(input.x, 0), y = finite(input.y, 0), direction = -1;
    if (Math.max(Math.abs(x), Math.abs(y)) >= 0.45) direction = Math.abs(x) >= Math.abs(y) ? (x > 0 ? 0 : 2) : (y > 0 ? 1 : 3);
    if (direction !== state._direction) { state._direction = direction; state._repeatIn = 0.42; if (direction >= 0) select(state, direction); }
    else if (direction >= 0) { state._repeatIn -= dt; while (state._repeatIn <= 1e-10) { select(state, direction); state._repeatIn += 0.16; } }
    var aEdge = !!input.aPressed || (!!input.a && !state._aDown), bEdge = !!input.bPressed || (!!input.b && !state._bDown);
    state._aDown = !!input.a; state._bDown = !!input.b;
    if (aEdge) toggle(state);
    if (bEdge) release(state);
    state._remainder += dt;
    while (state._remainder >= DT - 1e-10 && state.phase === 'playing') { state._remainder = Math.max(0, state._remainder - DT); advance(state); }
    return state;
  }
  return { create: create, step: step, TICK_HZ: 60 };
});
