/* Magnetic Warehouse: simultaneous one-cell fields and numbered destinations. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 60, EPS = 1e-9, COLS = 13, ROWS = 9, TILE = 44, OX = 194, OY = 72;
  var LEVELS = [
    { name: '双极入库', budget: 100, player: [2, 5], doors: [4],
      crates: [[4, 1, 1], [9, 5, -1]], docks: [[4, 6], [9, 1]], scraps: [[10, 5]], walls: [] },
    { name: '三箱转运', budget: 130, player: [2, 5], doors: [3, 6],
      crates: [[4, 1, 1], [9, 5, -1], [2, 7, 1]], docks: [[4, 3], [9, 1], [3, 5]], scraps: [[10, 6], [5, 7]], walls: [[8, 2]] },
    { name: '四箱协同', budget: 160, player: [2, 4], doors: [2, 6],
      crates: [[4, 1, 1], [9, 5, -1], [2, 7, 1], [11, 3, -1]], docks: [[4, 3], [9, 1], [3, 5], [10, 5]], scraps: [[7, 1], [7, 7], [11, 7]], walls: [[8, 4]] }
  ];
  function finite(n, fallback) { return typeof n === 'number' && Number.isFinite(n) ? n : fallback; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function key(c, r) { return c + ',' + r; }
  function point(c, r) { return { x: OX + (c + 0.5) * TILE, y: OY + (r + 0.5) * TILE }; }
  function cellAt(s, c, r) { return c >= 0 && c < COLS && r >= 0 && r < ROWS ? s.cells[r * COLS + c] : null; }
  function emit(s, type, data) { if (s.events.length < 32) s.events.push(Object.assign({ type: type, tick: s.tick }, data || {})); }
  function refresh(s) {
    s.matched = 0;
    s.crates.forEach(function (c) { Object.assign(c, point(c.col, c.row)); c.docked = false; });
    s.docks.forEach(function (d) {
      var crate = s.crates.find(function (c) { return c.col === d.col && c.row === d.row; });
      d.occupiedBy = crate ? crate.id : null; d.matched = !!crate && crate.id === d.id;
      if (d.matched) { crate.docked = true; s.matched += 1; }
    });
    Object.assign(s.player, point(s.player.col, s.player.row));
    s.actionsRemaining = Math.max(0, s.actionBudget - s.actionsUsed);
    s.remaining = Math.max(0, s.timeLimit - s.elapsed);
    s.score = s.matched * 300;
  }
  function finish(s, phase, reason) {
    s.phase = phase; s.lostReason = reason || null; s._remainder = 0;
    if (phase === 'won') {
      s.score += 500 + s.actionsRemaining * 10 + Math.floor(s.remaining) * 5;
      s.message = '全部编号准确入库！';
    } else s.message = reason === 'scrap' ? '箱体落入废料槽 · 按 R 重新规划' : reason === 'actions' ? '行动预算耗尽 · 先看清吸引与排斥方向' : '90 秒作业窗口结束 · 按 R 重试';
    emit(s, phase, { reason: reason || null });
  }
  function afterAction(s) {
    refresh(s);
    if (s.crates.some(function (c) { var cell = cellAt(s, c.col, c.row); return cell && cell.type === 'scrap'; })) finish(s, 'lost', 'scrap');
    else if (s.matched === s.target) finish(s, 'won');
    else if (s.actionsRemaining === 0) finish(s, 'lost', 'actions');
  }
  function lineClear(s, c) {
    var p = s.player;
    if (c.col !== p.col && c.row !== p.row) return false;
    var dx = Math.sign(c.col - p.col), dy = Math.sign(c.row - p.row), x = p.col + dx, y = p.row + dy;
    for (var i = 0; i < COLS + ROWS && (x !== c.col || y !== c.row); i += 1, x += dx, y += dy) {
      var cell = cellAt(s, x, y); if (!cell || cell.type === 'wall') return false;
    }
    return c.col !== p.col || c.row !== p.row;
  }
  function pulse(s) {
    var p = s.player, occupied = new Map(), proposals = new Map(), destinations = new Map();
    s.crates.forEach(function (c) { occupied.set(key(c.col, c.row), c.id); });
    s.crates.forEach(function (c) {
      if (!lineClear(s, c)) return;
      var repel = c.polarity === p.polarity, sign = repel ? 1 : -1;
      var col = c.col + Math.sign(c.col - p.col) * sign, row = c.row + Math.sign(c.row - p.row) * sign;
      var cell = cellAt(s, col, row), reason = !cell || cell.type === 'wall' ? 'wall' : col === p.col && row === p.row ? 'player' : null;
      var item = { crateId: c.id, fromCol: c.col, fromRow: c.row, toCol: col, toRow: row, mode: repel ? 'repel' : 'attract', moved: false, reason: reason };
      proposals.set(c.id, item);
      // Conflict groups include every proposed destination, before dependency resolution.
      var k = key(col, row); if (!destinations.has(k)) destinations.set(k, []); destinations.get(k).push(item);
    });
    destinations.forEach(function (group) { if (group.length > 1) group.forEach(function (item) { if (!item.reason) item.reason = 'conflict'; }); });
    var resolved = new Map(), visiting = new Set();
    function accepts(id) {
      if (resolved.has(id)) return resolved.get(id);
      var item = proposals.get(id);
      if (!item || item.reason) { resolved.set(id, false); return false; }
      if (visiting.has(id)) {
        // Mark the whole detected dependency cycle; no traversal order chooses a winner.
        var cursor = id;
        do { var cyclic = proposals.get(cursor); cyclic.reason = 'cycle'; resolved.set(cursor, false); cursor = occupied.get(key(cyclic.toCol, cyclic.toRow)); } while (cursor !== id);
        return false;
      }
      visiting.add(id);
      var dependency = occupied.get(key(item.toCol, item.toRow));
      var ok = dependency === undefined || accepts(dependency);
      visiting.delete(id);
      if (!ok && !item.reason) item.reason = 'occupied';
      resolved.set(id, ok); return ok;
    }
    proposals.forEach(function (item, id) { accepts(id); });
    var moved = 0;
    s.crates.forEach(function (c) {
      var item = proposals.get(c.id); if (!item || !resolved.get(c.id)) return;
      c.col = item.toCol; c.row = item.toRow; item.moved = true; item.reason = 'moved'; moved += 1;
      if (item.mode === 'attract') s.attractedMoves += 1; else s.repelledMoves += 1;
    });
    s.actionsUsed += 1; s.pulseCount += 1; if (!moved) s.blockedPulses += 1;
    s.pulse = { id: s.pulseCount, createdAt: s.elapsed, expiresAt: s.elapsed + 0.45, polarity: p.polarity,
      origin: { col: p.col, row: p.row, x: p.x, y: p.y }, targets: Array.from(proposals.values()).sort(function (a, b) { return a.crateId - b.crateId; }) };
    s.lastAction = { type: 'pulse', tick: s.tick, moved: moved };
    s.message = moved ? '磁脉冲移动 ' + moved + ' 箱 · 同极排斥，异极吸引' : '空脉冲：没有箱体可移动，本次仍消耗 1 行动';
    emit(s, 'pulse', { moved: moved, pulseId: s.pulseCount }); afterAction(s);
  }
  function flip(s) {
    s.player.polarity *= -1; s.flipCount += 1; s.actionsUsed += 1;
    s.lastAction = { type: 'flip', tick: s.tick, polarity: s.player.polarity };
    s.message = s.player.polarity === 1 ? '正极 + · 排斥 + 箱，吸引 − 箱' : '负极 − · 排斥 − 箱，吸引 + 箱';
    emit(s, 'flip', { polarity: s.player.polarity }); afterAction(s);
  }
  function move(s, dx, dy) {
    var p = s.player, col = p.col + dx, row = p.row + dy, cell = cellAt(s, col, row);
    p.facingX = dx; p.facingY = dy;
    var blocked = !cell || cell.type !== 'floor' || s.crates.some(function (c) { return c.col === col && c.row === row; });
    if (blocked) {
      s.blockedMoves += 1; s.lastAction = { type: 'blocked', tick: s.tick, col: col, row: row };
      s.message = '前方有障碍 · 无法推箱，受阻行走不扣行动'; emit(s, 'blocked'); return;
    }
    p.col = col; p.row = row; s.moveCount += 1; s.actionsUsed += 1;
    s.lastAction = { type: 'move', tick: s.tick, col: col, row: row };
    emit(s, 'move', { col: col, row: row }); afterAction(s);
  }
  function direction(input) {
    var x = clamp(finite(input.x, 0), -1, 1), y = clamp(finite(input.y, 0), -1, 1);
    if (Math.max(Math.abs(x), Math.abs(y)) < 0.25) return [0, 0];
    return Math.abs(x) >= Math.abs(y) ? [Math.sign(x), 0] : [0, Math.sign(y)];
  }
  function advance(s, input) {
    s.tick += 1; s.elapsed = s.tick * DT; s.remaining = Math.max(0, s.timeLimit - s.elapsed);
    if (s.pulse && s.elapsed >= s.pulse.expiresAt - EPS) s.pulse = null;
    if (s.remaining <= EPS) { finish(s, 'lost', 'timeout'); return; }
    if (s._pendingA) { s._pendingA = false; flip(s); if (s.phase !== 'playing') return; }
    if (s._pendingB) { s._pendingB = false; pulse(s); if (s.phase !== 'playing') return; }
    var d = direction(input), code = d[0] + ',' + d[1];
    if (!d[0] && !d[1]) { s._moveDirection = ''; s._repeatTicks = 0; return; }
    if (code !== s._moveDirection) { s._moveDirection = code; s._repeatTicks = 20; move(s, d[0], d[1]); }
    else { s._repeatTicks -= 1; if (s._repeatTicks <= 0) { s._repeatTicks = 10; move(s, d[0], d[1]); } }
  }
  function create(seed, difficulty) {
    var index = clamp(Math.floor(finite(difficulty, 0)), 0, 2), level = LEVELS[index];
    var s = { seed: finite(seed, 1) >>> 0, difficulty: index, level: index + 1, levelName: level.name,
      width: 960, height: 540, grid: { cols: COLS, rows: ROWS, cellSize: TILE, x: OX, y: OY },
      phase: 'playing', lostReason: null, score: 0, tick: 0, elapsed: 0, timeLimit: 90, remaining: 90,
      target: level.crates.length, matched: 0, actionBudget: level.budget, actionsUsed: 0, actionsRemaining: level.budget,
      moveCount: 0, blockedMoves: 0, flipCount: 0, pulseCount: 0, attractedMoves: 0, repelledMoves: 0, blockedPulses: 0,
      cells: [], crates: [], docks: [], pulse: null, events: [], lastAction: null,
      player: Object.assign({ col: level.player[0], row: level.player[1], polarity: 1, facingX: 1, facingY: 0 }, point(level.player[0], level.player[1])),
      message: '先看编号与磁极 · A 翻极，B 发出磁脉冲',
      _remainder: 0, _aDown: false, _bDown: false, _pendingA: false, _pendingB: false, _moveDirection: '', _repeatTicks: 0 };
    for (var r = 0; r < ROWS; r += 1) for (var c = 0; c < COLS; c += 1) {
      var boundary = c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1;
      var divider = c === 6 && level.doors.indexOf(r) < 0;
      var extra = level.walls.some(function (w) { return w[0] === c && w[1] === r; });
      var scrap = level.scraps.some(function (w) { return w[0] === c && w[1] === r; });
      s.cells.push(Object.assign({ id: r * COLS + c, col: c, row: r, type: boundary || divider || extra ? 'wall' : scrap ? 'scrap' : 'floor', dockId: null }, point(c, r)));
    }
    level.crates.forEach(function (c, i) { s.crates.push(Object.assign({ id: i + 1, col: c[0], row: c[1], polarity: c[2], docked: false }, point(c[0], c[1]))); });
    level.docks.forEach(function (d, i) { s.docks.push(Object.assign({ id: i + 1, col: d[0], row: d[1], occupiedBy: null, matched: false }, point(d[0], d[1]))); cellAt(s, d[0], d[1]).dockId = i + 1; });
    refresh(s); return s;
  }
  function step(s, dt, input) {
    if (!s || s.phase !== 'playing') return s;
    dt = clamp(finite(dt, 0), 0, 0.25); if (!dt) return s;
    input = input || {}; s.events = [];
    if (input.aPressed || (input.a && !s._aDown)) s._pendingA = true;
    if (input.bPressed || (input.b && !s._bDown)) s._pendingB = true;
    s._aDown = !!input.a; s._bDown = !!input.b; s._remainder += dt;
    while (s._remainder >= DT - EPS && s.phase === 'playing') { s._remainder = Math.max(0, s._remainder - DT); advance(s, input); }
    return s;
  }
  return { create: create, step: step, TICK_HZ: 60 };
});
