/* Glass Fold: integer polygon reflection and ordered half-alpha glass stacks. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PureModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DT = 1 / 60, EPS = 1e-9;
  // Only initial mosaics and visible target colors are authored here. There is
  // no reference fold sequence, solved-state flag or privileged solution path.
  var LEVELS = [
    { name: '晨光叠窗', folds: 3, rows: ['RBYG', 'YRGB', 'BGRY', 'GYBR'],
      target: [[2, 0, 84, 166, 170], [3, 0, 187, 146, 141], [2, 1, 158, 119, 132], [3, 1, 194, 191, 139]] },
    { name: '暮色拼窗', folds: 3, rows: ['GYRB', 'BRGY', 'RYBG', 'YBGR'],
      target: [[2, 2, 137, 151, 115], [3, 2, 153, 172, 120], [2, 3, 98, 186, 201], [3, 3, 239, 172, 109]] },
    { name: '琉璃凝心', folds: 4, rows: ['RBGR', 'YGYB', 'BRGY', 'GYRB'], target: [[3, 1, 191, 99, 109]] },
    { name: '留白拱窗', folds: 2, rows: ['R..B', 'YGGY', 'BGGR', 'R..Y'], target: [[3, 0, 224, 145, 90], [2, 1, 60, 188, 145], [3, 1, 186, 128, 126]] },
    { name: '交错层光', folds: 3, rows: ['RBY.', 'YG.B', '.GRY', 'GYBR'], target: [[0, 2, 133, 144, 120], [1, 2, 176, 171, 109]], checks: 2 },
    { name: '万花凝珠', folds: 4, rows: ['RGBY', 'GBYR', 'BYRG', 'YRGB'], target: [[1, 3, 216, 153, 79]], checks: 2 }
  ];
  var PALETTE = [{ id: 'R', rgb: [226, 78, 95] }, { id: 'B', rgb: [49, 157, 216] },
    { id: 'Y', rgb: [241, 182, 53] }, { id: 'G', rgb: [48, 184, 139] }];
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function finite(n, fallback) { return typeof n === 'number' && Number.isFinite(n) ? n : fallback; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function emit(s, type, data) { if (s.events.length < 32) s.events.push(Object.assign({ type: type, tick: s.tick }, data || {})); }
  function moving(cell, crease) { return (crease.axis === 'x' ? cell.col : cell.row) < crease.at ? crease.movingSide === 'low' : crease.movingSide === 'high'; }
  function destination(cell, crease) { return { col: crease.axis === 'x' ? 2 * crease.at - 1 - cell.col : cell.col,
    row: crease.axis === 'y' ? 2 * crease.at - 1 - cell.row : cell.row }; }
  function validity(s, crease) {
    var moved = s.cells.filter(function (cell) { return cell.layers.length && moving(cell, crease); });
    var stationary = s.cells.filter(function (cell) { return cell.layers.length && !moving(cell, crease); });
    if (!moved.length) return 'empty-moving';
    if (!stationary.length) return 'empty-stationary';
    if (moved.some(function (cell) { var d = destination(cell, crease); return d.col < 0 || d.col > 3 || d.row < 0 || d.row > 3; })) return 'out-of-bounds';
    return null;
  }
  function color(s, layers) {
    if (!layers.length) return null;
    var numerator = s.substrateColor.slice(), denominator = 1;
    layers.forEach(function (id) {
      var piece = s.pieces.find(function (p) { return p.id === id; });
      var pigment = s.palette.find(function (p) { return p.id === piece.pigment; }).rgb;
      for (var c = 0; c < 3; c += 1) numerator[c] += pigment[c] * denominator;
      denominator *= 2;
    });
    return numerator.map(function (n) { return Math.floor(n / denominator + 0.5); });
  }
  function refresh(s) {
    s.cells.forEach(function (cell) { cell.depth = cell.layers.length; cell.color = color(s, cell.layers); cell.reverseColor = color(s, cell.layers.slice().reverse()); });
    s.materialArea = s.pieces.reduce(function (sum, piece) {
      var twiceArea = 0;
      piece.vertices.forEach(function (p, i) { var q = piece.vertices[(i + 1) % piece.vertices.length]; twiceArea += p.x * q.y - q.x * p.y; });
      return sum + Math.abs(twiceArea) / 2;
    }, 0);
    var occupied = s.cells.filter(function (cell) { return cell.depth > 0; }); s.occupiedArea = occupied.length;
    s.outlineMatches = occupied.length === s.target.cells.length && occupied.every(function (cell) {
      return s.target.cells.some(function (t) { return t.col === cell.col && t.row === cell.row; });
    });
    s.matchedCells = s.target.cells.filter(function (t) {
      var cell = s.cells[t.row * 4 + t.col]; return cell.depth && cell.color.every(function (v, i) { return v === t.color[i]; });
    }).length;
    s.targetMatched = s.outlineMatches && s.matchedCells === s.target.cells.length;
    s.score = s.matchedCells * 100; s.remaining = Math.max(0, s.timeLimit - s.elapsed);
    s.foldsRemaining = Math.max(0, s.foldLimit - s.foldsUsed); s.historyDepth = s._history.length;
    s.canUndo = s.phase === 'playing' && s.mode !== 'folding' && s.historyDepth > 0;
    s.reviewPending = s.phase === 'playing' && s.mode === 'folding' && s.foldsUsed === s.foldLimit;
    s.candidates.forEach(function (crease) { crease.reason = validity(s, crease); crease.valid = crease.reason === null; });
    s.selectedId = s.candidates[s.selectedIndex].id;
    if (s.foldAnimation) s.foldAnimation.progress = clamp((s.elapsed - s.foldAnimation.startedAt) / s.foldAnimation.duration, 0, 1);
  }
  function finish(s, phase, reason) {
    refresh(s); s.phase = phase; s.lostReason = reason || null; s._remainder = 0; s.canUndo = false; s.reviewPending = false;
    if (phase === 'won') { s.score += 1000 + Math.floor(s.remaining) * 5 + (s.maxMismatches - s.mismatches) * 100; s.message = '轮廓与可见色彩全部匹配！'; }
    else s.message = reason === 'timeout' ? '90 秒工坊时间结束 · 按 R 重新开始' : s.maxMismatches + ' 次验收未通过 · 按 R 重新规划';
    emit(s, phase, { reason: reason || null });
  }
  function review(s) {
    refresh(s); s.reviewCount += 1;
    if (!s.targetMatched) s.mismatches += 1;
    s.lastReview = { at: s.elapsed, matched: s.targetMatched, outlineMatches: s.outlineMatches, matchedCells: s.matchedCells, mismatches: s.mismatches };
    emit(s, 'review', { matched: s.targetMatched, mismatches: s.mismatches });
    if (s.targetMatched) { finish(s, 'won'); return; }
    s.mode = 'review'; s.message = '验收未匹配 · 先按 B 撤销修正，A 不会重复提交';
    if (s.mismatches >= s.maxMismatches) finish(s, 'lost', 'mismatches');
  }
  function fold(s) {
    var crease = s.candidates[s.selectedIndex], reason = validity(s, crease);
    if (s.mode !== 'editing' || s.foldsUsed >= s.foldLimit || reason) {
      s.invalidFolds += 1; s.lastAction = { type: 'invalid', at: s.elapsed, reason: s.mode === 'review' ? 'review-locked' : reason || 'budget' };
      s.message = s.mode === 'review' ? '先按 B 撤销后才能重新折叠验收' : reason === 'out-of-bounds' ? '折后将越出工作框 · 请选择另一侧' : '折线两侧都必须有玻璃 · 本次不消耗折叠';
      emit(s, 'invalid', { reason: s.lastAction.reason }); return;
    }
    var saved = { pieces: copy(s.pieces), cells: copy(s.cells), foldsUsed: s.foldsUsed, selectedIndex: s.selectedIndex };
    s._history.push(saved);
    var stacks = s.cells.map(function () { return []; }), movedIds = new Set();
    s.cells.forEach(function (cell) { if (!moving(cell, crease)) stacks[cell.row * 4 + cell.col] = cell.layers.slice(); });
    s.cells.forEach(function (cell) {
      if (!moving(cell, crease) || !cell.layers.length) return;
      var d = destination(cell, crease); stacks[d.row * 4 + d.col] = stacks[d.row * 4 + d.col].concat(cell.layers.slice().reverse());
      cell.layers.forEach(function (id) { movedIds.add(id); });
    });
    s.pieces.forEach(function (piece) {
      if (!movedIds.has(piece.id)) return;
      piece.vertices.forEach(function (point) { point[crease.axis] = 2 * crease.at - point[crease.axis]; });
      piece.face *= -1; piece.movedFolds += 1;
    });
    s.cells.forEach(function (cell, i) { cell.layers = stacks[i]; });
    s.foldsUsed += 1; s.foldCount += 1; s.mode = 'folding';
    s.foldAnimation = { axis: crease.axis, at: crease.at, movingSide: crease.movingSide, startedAt: s.elapsed,
      duration: 0.6, endsAt: s.elapsed + 0.6, progress: 0, beforeCells: copy(saved.cells), beforePieces: copy(saved.pieces) };
    s.lastAction = { type: 'fold', at: s.elapsed, candidateId: crease.id };
    s.message = '正在折叠 · 移动玻璃层翻面后叠在上方'; emit(s, 'fold', { candidateId: crease.id });
  }
  function undo(s) {
    if (!s._history.length) { s.message = '尚无可撤销的折叠'; s.lastAction = { type: 'empty-undo', at: s.elapsed }; return; }
    var saved = s._history.pop();
    s.pieces = copy(saved.pieces); s.cells = copy(saved.cells); s.foldsUsed = saved.foldsUsed; s.selectedIndex = saved.selectedIndex;
    s.mode = 'editing'; s.foldAnimation = null; s.undoCount += 1;
    s.lastAction = { type: 'undo', at: s.elapsed, restoredFolds: s.foldsUsed };
    s.message = '已恢复上一折 · 时间与验收失误不会返还'; emit(s, 'undo');
  }
  function direction(input) {
    var x = clamp(finite(input.x, 0), -1, 1), y = clamp(finite(input.y, 0), -1, 1);
    if (Math.max(Math.abs(x), Math.abs(y)) < 0.25) return [0, 0];
    return Math.abs(x) >= Math.abs(y) ? [Math.sign(x), 0] : [0, Math.sign(y)];
  }
  function select(s, dx, dy) {
    var selected = s.candidates[s.selectedIndex], row = clamp(selected.selectorRow + dy, 0, 3), col = clamp(selected.selectorCol + dx, 0, 2);
    var index = row * 3 + col;
    if (index !== s.selectedIndex) { s.selectedIndex = index; s.selectionCount += 1; emit(s, 'select', { index: index }); }
  }
  function advance(s, input) {
    s.tick += 1; s.elapsed = s.tick * DT; s.remaining = Math.max(0, s.timeLimit - s.elapsed);
    if (s.remaining <= EPS) { finish(s, 'lost', 'timeout'); return; }
    if (s.mode === 'folding') {
      var settled = s.elapsed >= s.foldAnimation.endsAt - EPS;
      if (settled) {
        s.foldAnimation = null; s.mode = 'editing';
        if (s.foldsUsed === s.foldLimit) review(s);
        else s.message = '折叠完成 · 请选择下一条折线，或按 B 撤销';
      }
      s._pendingA = false; s._pendingB = false; s._pendingCancel = false; s._moveDirection = ''; s._repeatTicks = 0;
      if (s.phase === 'playing') refresh(s); return;
    }
    if (input.cancelled || s._pendingCancel) {
      s._pendingA = false; s._pendingB = false; s._pendingCancel = false; s._moveDirection = ''; s._repeatTicks = 0; refresh(s); return;
    }
    var d = direction(input), code = d[0] + ',' + d[1];
    if (!d[0] && !d[1]) { s._moveDirection = ''; s._repeatTicks = 0; }
    else if (code !== s._moveDirection) { s._moveDirection = code; s._repeatTicks = 20; select(s, d[0], d[1]); }
    else { s._repeatTicks -= 1; if (s._repeatTicks <= 0) { s._repeatTicks = 10; select(s, d[0], d[1]); } }
    var a = s._pendingA, b = s._pendingB; s._pendingA = false; s._pendingB = false;
    if (b) undo(s); else if (a) fold(s);
    refresh(s);
  }
  function create(seed, difficulty) {
    var index = clamp(Math.floor(finite(difficulty, 0)), 0, LEVELS.length - 1), level = LEVELS[index];
    var s = { seed: finite(seed, 1) >>> 0, difficulty: index, level: index + 1, levelName: level.name, width: 960, height: 540,
      grid: { cols: 4, rows: 4 }, view: { current: { x: 42, y: 78, cellSize: 100 }, target: { x: 522, y: 78, cellSize: 100 } },
      palette: copy(PALETTE), layerAlpha: 0.5, substrateColor: [246, 244, 234], pieces: [], cells: [], candidates: [],
      target: { cells: level.target.map(function (c) { return { col: c[0], row: c[1], color: c.slice(2) }; }), occupiedCount: level.target.length },
      phase: 'playing', mode: 'editing', lostReason: null, tick: 0, elapsed: 0, timeLimit: 90, remaining: 90, score: 0,
      foldLimit: level.folds, foldsUsed: 0, foldsRemaining: level.folds, foldCount: 0, undoCount: 0, invalidFolds: 0, selectionCount: 0,
      selectedIndex: 1, selectedId: '', historyDepth: 0, canUndo: false, foldAnimation: null, reviewPending: false,
      mismatches: 0, maxMismatches: level.checks || 3, reviewCount: 0, lastReview: null, lastAction: null,
      materialArea: 16, occupiedArea: 16, matchedCells: 0, outlineMatches: false, targetMatched: false, message: '选择折线与翻折方向 · A 折叠，B 撤销', events: [],
      _history: [], _remainder: 0, _aDown: false, _bDown: false, _pendingA: false, _pendingB: false,
      _moveDirection: '', _repeatTicks: 0, _cancelEpoch: null, _pendingCancel: false };
    for (var row = 0; row < 4; row += 1) for (var col = 0; col < 4; col += 1) {
      var id = row * 4 + col + 1;
      if (level.rows[row][col] === '.') { s.cells.push({ col: col, row: row, layers: [], depth: 0, color: null, reverseColor: null }); continue; }
      s.pieces.push({ id: id, pigment: level.rows[row][col], vertices: [{ x: col, y: row }, { x: col + 1, y: row }, { x: col + 1, y: row + 1 }, { x: col, y: row + 1 }], face: 1, movedFolds: 0 });
      s.cells.push({ col: col, row: row, layers: [id], depth: 1, color: null, reverseColor: null });
    }
    for (var r = 0; r < 4; r += 1) for (var c = 0; c < 3; c += 1) {
      var axis = r < 2 ? 'x' : 'y', side = r % 2 === 0 ? 'low' : 'high';
      s.candidates.push({ id: axis + '-' + (c + 1) + '-' + side, axis: axis, at: c + 1, movingSide: side, selectorRow: r, selectorCol: c, valid: false, reason: null });
    }
    refresh(s); return s;
  }
  function step(s, dt, input) {
    if (!s || s.phase !== 'playing') return s;
    dt = clamp(finite(dt, 0), 0, 0.25); if (!dt) return s;
    input = input || {}; s.events = [];
    var epoch = finite(input.cancelEpoch, -1);
    if (epoch >= 0) { epoch = Math.floor(epoch); if (s._cancelEpoch === null) s._cancelEpoch = epoch;
      else if (epoch > s._cancelEpoch) { s._cancelEpoch = epoch; s._pendingCancel = true; } }
    if (!input.cancelled && !s._pendingCancel && s.mode !== 'folding') {
      if (input.aPressed || (input.a && !s._aDown)) s._pendingA = true;
      if (input.bPressed || (input.b && !s._bDown)) s._pendingB = true;
    }
    s._aDown = !!input.a; s._bDown = !!input.b; s._remainder += dt;
    while (s._remainder >= DT - EPS && s.phase === 'playing') { s._remainder = Math.max(0, s._remainder - DT); advance(s, input); }
    return s;
  }
  return { create: create, step: step, TICK_HZ: 60 };
});
