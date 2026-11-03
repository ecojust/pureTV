(function () {
  'use strict';

  function copy(value) {
    if (Array.isArray(value)) return value.map(copy);
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).forEach(function (key) { out[key] = copy(value[key]); });
      return out;
    }
    return value;
  }

  function freeze(value) {
    if (value && typeof value === 'object') {
      Object.keys(value).forEach(function (key) { freeze(value[key]); });
      Object.freeze(value);
    }
    return value;
  }

  function round12(value) {
    var rounded = Math.round(value * 1e12) / 1e12;
    return rounded === 0 ? 0 : rounded;
  }

  function sameCell(a, b) {
    return a === null || b === null ? a === b :
      a.glyph === b.glyph && a.turn === b.turn && a.mirrored === b.mirrored;
  }

  // Source lookup is temporary. Targets look through their public window inverse.
  function plate(order, sourceAt) {
    var alpha = Math.PI / order;
    var cells = [];
    var instances = [];
    for (var sector = 0; sector < 2 * order; sector += 1) {
      var mirrored = sector % 2 === 1;
      var theta = sector * alpha;
      var cosine = Math.cos(theta);
      var sine = Math.sin(theta);
      for (var slot = 0; slot < 6; slot += 1) {
        var row = Math.floor(slot / 2);
        var col = slot % 2;
        var sourceCol = mirrored ? 1 - col : col;
        var piece = sourceAt(row * 2 + sourceCol);
        if (piece === null) {
          cells.push(null);
          continue;
        }
        var turn = mirrored ? (4 - piece.turn) % 4 : piece.turn;
        cells.push({ glyph: piece.glyph, turn: turn, mirrored: mirrored });
        var t = (2 * sourceCol - 1) * alpha / 4;
        var px = config.radii[row] * Math.sin(t);
        var py = -config.radii[row] * Math.cos(t);
        if (mirrored) px = -px;
        instances.push({
          sector: sector, slot: slot, row: row, col: col,
          glyph: piece.glyph, turn: turn, mirrored: mirrored,
          x: round12(cosine * px - sine * py),
          y: round12(sine * px + cosine * py),
          angle: round12(theta + (mirrored ? -1 : 1) * piece.turn * Math.PI / 2)
        });
      }
    }
    return { cells: cells, instances: instances };
  }

  var config = {
    defaultSeed: 745,
    orders: [3, 4, 5],
    radii: [0.42, 0.66, 0.90],
    glyphScale: 0.007,
    glyphs: [
      { id: 'hook', name: 'HOOK', nameZh: '钩',
        polygons: [[[-4, -5], [-1, -5], [-1, 2], [4, 2], [4, 5], [-4, 5]]] },
      { id: 'flag', name: 'FLAG', nameZh: '旗',
        polygons: [[[-4, -5], [-2, -5], [-2, 5], [-4, 5]], [[-2, -5], [5, -2], [-2, 1]]] },
      { id: 'sprout', name: 'SPROUT', nameZh: '芽',
        polygons: [[[-1, -5], [1, -5], [1, 5], [-1, 5]],
          [[1, -3], [5, -5], [5, -1], [1, 1]], [[0, 1], [-4, 2], [-4, 4], [0, 3]]] }
    ],
    attemptLimit: 4,
    maxElapsed: 86400,
    maxCounter: 2147483647,
    tasks: [
      { id: 'first-rosette', name: 'FIRST ROSETTE', nameZh: '初见花钥', initialOrder: 4,
        inventory: { hook: 1, flag: 1, sprout: 1 },
        target: { order: 3, sector: 0, window: [
          { glyph: 'hook', turn: 0, mirrored: false }, null, null,
          { glyph: 'flag', turn: 1, mirrored: false },
          { glyph: 'sprout', turn: 3, mirrored: false }, null
        ] } },
      { id: 'mirror-bloom', name: 'MIRROR BLOOM', nameZh: '镜中花钥', initialOrder: 3,
        inventory: { hook: 2, flag: 1, sprout: 1 },
        target: { order: 4, sector: 1, window: [
          null, { glyph: 'hook', turn: 3, mirrored: true },
          { glyph: 'flag', turn: 1, mirrored: true }, null,
          { glyph: 'sprout', turn: 0, mirrored: true },
          { glyph: 'hook', turn: 2, mirrored: true }
        ] } },
      { id: 'fivefold-crown', name: 'FIVEFOLD CROWN', nameZh: '五重冠钥', initialOrder: 4,
        inventory: { hook: 1, flag: 1, sprout: 2 },
        target: { order: 5, sector: 3, window: [
          { glyph: 'sprout', turn: 1, mirrored: true },
          { glyph: 'flag', turn: 2, mirrored: true }, null,
          { glyph: 'hook', turn: 3, mirrored: true },
          { glyph: 'sprout', turn: 2, mirrored: true }, null
        ] } }
    ]
  };

  config.tasks.forEach(function (task) {
    var target = task.target;
    var odd = target.sector % 2 === 1;
    var generated = plate(target.order, function (sourceSlot) {
      var row = Math.floor(sourceSlot / 2);
      var col = sourceSlot % 2;
      var visible = target.window[row * 2 + (odd ? 1 - col : col)];
      return visible === null ? null : {
        glyph: visible.glyph, turn: odd ? (4 - visible.turn) % 4 : visible.turn
      };
    });
    target.cells = generated.cells;
    target.instances = generated.instances;
  });
  freeze(config);

  function stockFrom(state) {
    var stock = copy(config.tasks[state.level].inventory);
    state.source.forEach(function (piece) { if (piece !== null) stock[piece.glyph] -= 1; });
    return stock;
  }

  function refresh(state) {
    var target = config.tasks[state.level].target;
    var generated = plate(state.order, function (slot) { return state.source[slot]; });
    var inspection = copy(generated.cells.slice(target.sector * 6, target.sector * 6 + 6));
    var windowMatches = inspection.map(function (cell, index) { return sameCell(cell, target.window[index]); });
    var orderMatched = state.order === target.order;
    state.stock = stockFrom(state);
    state.pattern = {
      order: state.order, sectorCount: 2 * state.order,
      cells: generated.cells, instances: generated.instances, inspection: inspection,
      windowMatches: windowMatches,
      windowMatchedCount: windowMatches.filter(function (matched) { return matched; }).length,
      orderMatched: orderMatched,
      matched: orderMatched && generated.cells.length === target.cells.length &&
        generated.cells.every(function (cell, index) { return sameCell(cell, target.cells[index]); })
    };
  }

  function create(seed, level) {
    seed = Number.isInteger(seed) && seed >= 0 && seed <= 4294967295 ? seed : config.defaultSeed;
    level = Number.isInteger(level) && level >= 0 && level < config.tasks.length ? level : 0;
    var task = config.tasks[level];
    var state = {
      schema: 1, seed: seed, level: level, phase: 'playing', reason: '', score: 0,
      order: task.initialOrder, source: [null, null, null, null, null, null],
      focus: { row: 0, col: 0 }, selectedGlyph: 'hook',
      target: { order: task.target.order, sector: task.target.sector, window: copy(task.target.window) },
      stock: null, pattern: null, elapsed: 0, elapsedCapped: false,
      failures: 0, submissions: [], terminalReceipt: null,
      calls: 0, moves: 0, placements: 0, rotations: 0, removals: 0,
      orderChanges: 0, paletteChanges: 0, clears: 0, blockedActions: 0,
      counterSaturated: false, inputArmed: false, cancelEpoch: null, cancelledLast: false,
      lastHeld: { a: false, b: false, direction: 'none' }, lastCommand: 'none', events: [],
      message: '摆放源扇区，比较镜像窗口；验收格 A 提交，B 清空。'
    };
    refresh(state);
    return state;
  }

  function increment(state, field) {
    var next = state[field] + 1;
    if (next > config.maxCounter) state.counterSaturated = true;
    state[field] = Math.min(config.maxCounter, next);
  }

  function glyphName(id) {
    for (var i = 0; i < config.glyphs.length; i += 1) {
      if (config.glyphs[i].id === id) return config.glyphs[i].nameZh;
    }
    return '';
  }

  function emit(state, event) {
    event.call = state.calls;
    state.events = [event];
    var name = glyphName(event.type === 'palette' ? event.to : event.glyph);
    if (event.type === 'move') {
      var label = event.focus.col === 2 ? ['阶数', '图符', '验收'][event.focus.row] :
        ['内圈左槽', '内圈右槽', '中圈左槽', '中圈右槽', '外圈左槽', '外圈右槽'][event.focus.row * 2 + event.focus.col];
      state.message = '已选择' + label + '。';
    } else if (event.type === 'blocked') {
      state.message = event.reason === 'boundary' ? '已到选择边界。' :
        event.reason === 'empty' ? '此源插槽为空。' : '所选' + name + '图符库存已用完，先取回再放置。';
    } else if (event.type === 'place') state.message = '已放置' + name + '图符，朝向 0。';
    else if (event.type === 'rotate') state.message = '已将' + name + '图符旋转到朝向 ' + event.to + '。';
    else if (event.type === 'remove') state.message = '已取回' + name + '图符，返还 1 枚。';
    else if (event.type === 'order') state.message = '镜面对称阶数改为 ' + event.to + '；源图符与库存不变。';
    else if (event.type === 'palette') state.message = '已选择' + name + '图符。';
    else if (event.type === 'clear') state.message = '已清空源扇区，返还 ' + event.removed + ' 枚图符；错误记录保留。';
    else if (event.type === 'reject') state.message = '整幅钥匙尚未匹配，剩余 ' + (4 - state.failures) + ' 次错误额度。';
    else if (event.type === 'win') state.message = '完整钥匙匹配，验收成功。';
    else if (event.type === 'collision') state.message = '四次错误提交，花钥未能开启。';
  }

  function submit(state) {
    refresh(state);
    var before = state.failures;
    if (state.pattern.matched) {
      state.phase = 'won';
      state.score = 100;
      emit(state, { type: 'win' });
    } else {
      state.failures += 1;
      if (state.failures === config.attemptLimit) {
        state.phase = 'lost';
        state.reason = 'attempts';
        emit(state, { type: 'collision', reason: 'attempts' });
      } else emit(state, { type: 'reject', windowMatchedCount: state.pattern.windowMatchedCount,
        orderMatched: state.pattern.orderMatched });
    }
    state.submissions.push({
      index: state.submissions.length, call: state.calls, elapsed: state.elapsed, order: state.order,
      source: copy(state.source), stock: copy(state.stock), inspection: copy(state.pattern.inspection),
      orderMatched: state.pattern.orderMatched, windowMatchedCount: state.pattern.windowMatchedCount,
      cells: copy(state.pattern.cells), matched: state.pattern.matched,
      failuresBefore: before, failuresAfter: state.failures, remaining: config.attemptLimit - state.failures,
      phase: state.phase, reason: state.reason
    });
    if (state.phase !== 'playing') state.terminalReceipt = {
      cause: state.phase === 'won' ? 'success' : 'attempts', call: state.calls,
      elapsed: state.elapsed, order: state.order, source: copy(state.source), stock: copy(state.stock),
      cells: copy(state.pattern.cells), matched: state.pattern.matched, failures: state.failures,
      remaining: config.attemptLimit - state.failures, score: state.score, phase: state.phase, reason: state.reason
    };
  }

  function command(state, selected) {
    if (selected !== 'a' && selected !== 'b') {
      var row = state.focus.row + (selected === 'down' ? 1 : selected === 'up' ? -1 : 0);
      var col = state.focus.col + (selected === 'right' ? 1 : selected === 'left' ? -1 : 0);
      if (row < 0 || row > 2 || col < 0 || col > 2) {
        increment(state, 'blockedActions');
        emit(state, { type: 'blocked', reason: 'boundary' });
      } else {
        state.focus = { row: row, col: col };
        increment(state, 'moves');
        emit(state, { type: 'move', focus: copy(state.focus) });
      }
      return;
    }
    if (state.focus.col < 2) {
      var slot = state.focus.row * 2 + state.focus.col;
      var piece = state.source[slot];
      if (selected === 'b') {
        if (piece === null) {
          increment(state, 'blockedActions');
          emit(state, { type: 'blocked', reason: 'empty', slot: slot });
        } else {
          state.source[slot] = null;
          increment(state, 'removals');
          refresh(state);
          emit(state, { type: 'remove', slot: slot, glyph: piece.glyph, turn: piece.turn });
        }
      } else if (piece !== null) {
        var fromTurn = piece.turn;
        piece.turn = (piece.turn + 1) % 4;
        increment(state, 'rotations');
        refresh(state);
        emit(state, { type: 'rotate', slot: slot, glyph: piece.glyph, from: fromTurn, to: piece.turn });
      } else if (stockFrom(state)[state.selectedGlyph] === 0) {
        increment(state, 'blockedActions');
        emit(state, { type: 'blocked', reason: 'stock', slot: slot, glyph: state.selectedGlyph });
      } else {
        state.source[slot] = { glyph: state.selectedGlyph, turn: 0 };
        increment(state, 'placements');
        refresh(state);
        emit(state, { type: 'place', slot: slot, glyph: state.selectedGlyph, turn: 0 });
      }
    } else if (state.focus.row === 0) {
      var fromOrder = state.order;
      state.order = config.orders[(config.orders.indexOf(state.order) + (selected === 'a' ? 1 : 2)) % 3];
      increment(state, 'orderChanges');
      refresh(state);
      emit(state, { type: 'order', from: fromOrder, to: state.order });
    } else if (state.focus.row === 1) {
      var fromGlyph = state.selectedGlyph;
      var ids = config.glyphs.map(function (glyph) { return glyph.id; });
      state.selectedGlyph = ids[(ids.indexOf(fromGlyph) + (selected === 'a' ? 1 : 2)) % 3];
      increment(state, 'paletteChanges');
      emit(state, { type: 'palette', from: fromGlyph, to: state.selectedGlyph });
    } else if (selected === 'b') {
      var removed = state.source.filter(function (piece) { return piece !== null; }).length;
      state.source = [null, null, null, null, null, null];
      increment(state, 'clears');
      refresh(state);
      emit(state, { type: 'clear', removed: removed });
    } else submit(state);
  }

  function normalize(input) {
    var values = Object.create(null);
    try {
      if (input !== null && typeof input === 'object' && !Array.isArray(input)) {
        ['x', 'y', 'a', 'b', 'cancelEpoch', 'cancelled', 'paused'].forEach(function (key) {
          var descriptor = Object.getOwnPropertyDescriptor(input, key);
          if (descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')) values[key] = descriptor.value;
        });
      }
    } catch (error) {
      values = Object.create(null);
    }
    var x = typeof values.x === 'number' && Number.isFinite(values.x) ? Math.max(-1, Math.min(1, values.x)) : 0;
    var y = typeof values.y === 'number' && Number.isFinite(values.y) ? Math.max(-1, Math.min(1, values.y)) : 0;
    var direction = 'none';
    if (Math.abs(x) > 0.5 || Math.abs(y) > 0.5) {
      direction = Math.abs(y) >= Math.abs(x) ? (y > 0 ? 'down' : 'up') : (x > 0 ? 'right' : 'left');
    }
    return {
      a: values.a === true, b: values.b === true, direction: direction,
      paused: values.paused === true, cancelled: values.cancelled === true,
      epoch: Number.isSafeInteger(values.cancelEpoch) && values.cancelEpoch >= 0 ? values.cancelEpoch : null
    };
  }

  function step(state, dt, input) {
    if (state.phase !== 'playing') return state;
    if (typeof dt !== 'number' || !Number.isFinite(dt) || dt <= 0 || dt > 0.25) return state;
    var held = normalize(input);
    if (held.paused) return state;
    state.events = [];
    state.lastCommand = 'none';
    increment(state, 'calls');
    var nextElapsed = state.elapsed + dt;
    if (nextElapsed > config.maxElapsed) state.elapsedCapped = true;
    state.elapsed = Math.min(config.maxElapsed, nextElapsed);
    if (held.epoch !== null) {
      if (state.cancelEpoch !== null && held.epoch !== state.cancelEpoch) state.inputArmed = false;
      state.cancelEpoch = held.epoch;
    }
    if (held.cancelled && !state.cancelledLast) state.inputArmed = false;
    state.cancelledLast = held.cancelled;
    var selected = 'none';
    if (state.inputArmed && !held.cancelled) {
      if (held.b && !state.lastHeld.b) selected = 'b';
      else if (held.a && !state.lastHeld.a) selected = 'a';
      else if (held.direction !== 'none' && held.direction !== state.lastHeld.direction) selected = held.direction;
    }
    state.lastHeld = { a: held.a, b: held.b, direction: held.direction };
    if (!held.cancelled && !held.a && !held.b && held.direction === 'none') state.inputArmed = true;
    if (selected !== 'none') {
      state.lastCommand = selected;
      command(state, selected);
    }
    return state;
  }

  var api = { create: create, step: step, config: config };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.PureModel = api;
}());
