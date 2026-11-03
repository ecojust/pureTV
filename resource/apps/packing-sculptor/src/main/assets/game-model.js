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

  var config = freeze({
    defaultSeed: 746, attemptLimit: 4, maxElapsed: 86400, maxCounter: 2147483647,
    pieces: [
      { id: 'rail', name: 'RAIL', nameZh: '长轨', width: 3, height: 1,
        cells: [[0, 0], [1, 0], [2, 0]], vertices: [[0, 0], [3, 0], [3, 1], [0, 1]] },
      { id: 'elbow', name: 'ELBOW', nameZh: '弯角', width: 2, height: 2,
        cells: [[0, 0], [0, 1], [1, 1]], vertices: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [0, 2]] },
      { id: 'crate', name: 'CRATE', nameZh: '方块', width: 2, height: 2,
        cells: [[0, 0], [1, 0], [0, 1], [1, 1]], vertices: [[0, 0], [2, 0], [2, 2], [0, 2]] },
      { id: 'bar', name: 'BAR', nameZh: '短条', width: 2, height: 1,
        cells: [[0, 0], [1, 0]], vertices: [[0, 0], [2, 0], [2, 1], [0, 1]] },
      { id: 'tee', name: 'TEE', nameZh: '丁板', width: 3, height: 2,
        cells: [[0, 0], [1, 0], [2, 0], [1, 1]],
        vertices: [[0, 0], [3, 0], [3, 1], [2, 1], [2, 2], [1, 2], [1, 1], [0, 1]] },
      { id: 'zig', name: 'ZIG', nameZh: '折板', width: 3, height: 2,
        cells: [[0, 0], [1, 0], [1, 1], [2, 1]],
        vertices: [[0, 0], [2, 0], [2, 1], [3, 1], [3, 2], [1, 2], [1, 1], [0, 1]] }
    ],
    tasks: [
      { id: 'side-hatch', name: 'SIDE HATCH', nameZh: '侧门小箱', width: 5, height: 4,
        rows: ['11110', '11111', '11111', '01111'], pieceIds: ['rail', 'elbow', 'crate', 'bar'],
        doors: [{ id: 'east', direction: 'right', start: 1, end: 2 }],
        requirements: [{ pieceId: 'rail', doorIds: ['east'] }] },
      { id: 'two-way-crate', name: 'TWO WAY CRATE', nameZh: '双向货箱', width: 5, height: 5,
        rows: ['11111', '11111', '01111', '01111', '01110'], pieceIds: ['rail', 'elbow', 'crate', 'bar', 'tee'],
        doors: [{ id: 'north', direction: 'up', start: 1, end: 3 },
          { id: 'south', direction: 'down', start: 1, end: 4 }],
        requirements: [{ pieceId: 'elbow', doorIds: ['north'] }, { pieceId: 'rail', doorIds: ['south'] }] },
      { id: 'opposite-dispatch', name: 'OPPOSITE DISPATCH', nameZh: '对向出库', width: 6, height: 5,
        rows: ['011110', '111111', '111111', '111111', '011110'],
        pieceIds: ['rail', 'elbow', 'crate', 'bar', 'tee', 'zig'],
        doors: [{ id: 'east', direction: 'right', start: 1, end: 3 },
          { id: 'west', direction: 'left', start: 3, end: 4 }],
        requirements: [{ pieceId: 'zig', doorIds: ['east'] }, { pieceId: 'rail', doorIds: ['west'] }] }
    ]
  });

  function pieceById(id) {
    return config.pieces.find(function (piece) { return piece.id === id; });
  }

  function inside(task, cell) {
    return cell[0] >= 0 && cell[0] < task.width && cell[1] >= 0 && cell[1] < task.height &&
      task.rows[cell[1]][cell[0]] === '1';
  }

  // The cells and outline rotate as the same polygon, normalized to its new
  // bounding-box origin. Integer coordinates make edge contact exact.
  function transformed(piece, pose, vertices) {
    return (vertices ? piece.vertices : piece.cells).map(function (point) {
      var x = point[0], y = point[1], d = vertices ? 0 : 1, result;
      if (pose.turn === 1) result = [piece.height - d - y, x];
      else if (pose.turn === 2) result = [piece.width - d - x, piece.height - d - y];
      else if (pose.turn === 3) result = [y, piece.width - d - x];
      else result = [x, y];
      return [result[0] + pose.x, result[1] + pose.y];
    });
  }

  function shape(task, id, pose) {
    if (pose === null) return { id: id, pose: null, cells: [], vertices: [], outsideCells: [], overlapIds: [] };
    var piece = pieceById(id);
    var cells = transformed(piece, pose, false).sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });
    return { id: id, pose: copy(pose), cells: cells, vertices: transformed(piece, pose, true),
      outsideCells: cells.filter(function (cell) { return !inside(task, cell); }).map(copy), overlapIds: [] };
  }

  function sharesCell(first, second) {
    return first.some(function (a) {
      return second.some(function (b) { return a[0] === b[0] && a[1] === b[1]; });
    });
  }

  function actualShapes(task, placements) {
    return task.pieceIds.map(function (id, index) { return shape(task, id, placements[index]); });
  }

  function hitsCell(rect, cell) {
    return Math.max(rect.minX, cell[0]) < Math.min(rect.maxX, cell[0] + 1) &&
      Math.max(rect.minY, cell[1]) < Math.min(rect.maxY, cell[1] + 1);
  }

  function extraction(task, required, pieces) {
    var moving = pieces[task.pieceIds.indexOf(required.pieceId)];
    if (moving.pose === null) return { pieceId: required.pieceId, placed: false, options: [], canExit: false };
    var xs = moving.cells.map(function (cell) { return cell[0]; });
    var ys = moving.cells.map(function (cell) { return cell[1]; });
    var loX = Math.min.apply(null, xs), hiX = Math.max.apply(null, xs) + 1;
    var loY = Math.min.apply(null, ys), hiY = Math.max.apply(null, ys) + 1;
    var options = required.doorIds.map(function (id) {
      var door = task.doors.find(function (entry) { return entry.id === id; });
      var direction = door.direction;
      var horizontal = direction === 'left' || direction === 'right';
      var distance = direction === 'right' ? task.width - loX : direction === 'left' ? hiX :
        direction === 'down' ? task.height - loY : hiY;
      var doorFits = horizontal ? door.start <= loY && hiY <= door.end : door.start <= loX && hiX <= door.end;
      // A swept cell is one exact rectangle, including every intermediate t.
      var sweptRects = moving.cells.map(function (cell) {
        return { minX: cell[0] - (direction === 'left' ? distance : 0),
          minY: cell[1] - (direction === 'up' ? distance : 0),
          maxX: cell[0] + 1 + (direction === 'right' ? distance : 0),
          maxY: cell[1] + 1 + (direction === 'down' ? distance : 0) };
      });
      var wallHits = [];
      for (var y = 0; y < task.height; y += 1) {
        for (var x = 0; x < task.width; x += 1) {
          if (task.rows[y][x] === '0' && sweptRects.some(function (rect) { return hitsCell(rect, [x, y]); })) {
            wallHits.push([x, y]);
          }
        }
      }
      var blockerIds = pieces.filter(function (other) {
        return other.id !== moving.id && other.cells.some(function (cell) {
          return sweptRects.some(function (rect) { return hitsCell(rect, cell); });
        });
      }).map(function (other) { return other.id; });
      return { doorId: id, direction: direction, distance: distance, doorFits: doorFits,
        sweptRects: sweptRects, wallHits: wallHits, blockerIds: blockerIds,
        clear: doorFits && moving.outsideCells.length === 0 && wallHits.length === 0 && blockerIds.length === 0 };
    });
    return { pieceId: required.pieceId, placed: true, options: options,
      canExit: options.some(function (option) { return option.clear; }) };
  }

  function refresh(state) {
    var task = config.tasks[state.level], pieces = actualShapes(task, state.placements), inventory = {};
    pieces.forEach(function (piece) {
      piece.overlapIds = pieces.filter(function (other) {
        return other.id !== piece.id && sharesCell(piece.cells, other.cells);
      }).map(function (other) { return other.id; });
      inventory[piece.id] = piece.pose === null ? 1 : 0;
    });
    var missingIds = pieces.filter(function (piece) { return piece.pose === null; }).map(function (piece) { return piece.id; });
    var allPlaced = missingIds.length === 0;
    var allInside = pieces.every(function (piece) { return piece.outsideCells.length === 0; });
    var noOverlap = pieces.every(function (piece) { return piece.overlapIds.length === 0; });
    var extractions = task.requirements.map(function (required) { return extraction(task, required, pieces); });
    var validPacking = allPlaced && allInside && noOverlap;
    state.inventory = inventory;
    state.geometry = { pieces: pieces, placedCount: pieces.length - missingIds.length, missingIds: missingIds,
      allPlaced: allPlaced, allInside: allInside, noOverlap: noOverlap, validPacking: validPacking,
      extractions: extractions, canShip: validPacking && extractions.every(function (entry) { return entry.canExit; }) };
  }

  function refreshPreview(state) {
    if (state.mode !== 'place') { state.previewCheck = null; return; }
    var task = config.tasks[state.level], id = task.pieceIds[state.rackIndex];
    var preview = shape(task, id, state.preview);
    var blockers = actualShapes(task, state.placements).filter(function (other) {
      return other.id !== id && sharesCell(preview.cells, other.cells);
    }).map(function (other) { return other.id; });
    state.previewCheck = { id: id, pose: preview.pose, cells: preview.cells, vertices: preview.vertices,
      outsideCells: preview.outsideCells, blockerIds: blockers,
      valid: state.preview.x < task.width && preview.outsideCells.length === 0 && blockers.length === 0 };
  }

  function create(seed, level) {
    seed = Number.isInteger(seed) && seed >= 0 && seed <= 4294967295 ? seed : config.defaultSeed;
    level = Number.isInteger(level) && level >= 0 && level < config.tasks.length ? level : 0;
    var task = config.tasks[level];
    var state = {
      schema: 1, seed: seed, level: level, phase: 'playing', reason: '', score: 0,
      mode: 'rack', rackIndex: 0, preview: null, pieceIds: copy(task.pieceIds),
      container: copy({ width: task.width, height: task.height, rows: task.rows,
        doors: task.doors, requirements: task.requirements }),
      placements: task.pieceIds.map(function () { return null; }), inventory: null, geometry: null, previewCheck: null,
      elapsed: 0, elapsedCapped: false, failures: 0, submissions: [], terminalReceipt: null,
      calls: 0, moves: 0, pickups: 0, placementsMade: 0, rotations: 0, removals: 0, clears: 0, blockedActions: 0,
      counterSaturated: false, inputArmed: false, cancelEpoch: null, cancelledLast: false,
      lastHeld: { a: false, b: false, direction: 'none' }, lastCommand: 'none', events: [],
      message: '选择零件后装入箱内；为标记零件留出指定直线出口。'
    };
    refresh(state);
    return state;
  }

  function increment(state, field) {
    var next = state[field] + 1;
    if (next > config.maxCounter) state.counterSaturated = true;
    state[field] = Math.min(config.maxCounter, next);
  }

  function emit(state, event) {
    event.call = state.calls;
    state.events = [copy(event)];
    var task = config.tasks[state.level];
    var name = event.pieceId ? pieceById(event.pieceId).nameZh : '';
    var pose = event.to;
    if (event.type === 'rack') state.message = '已选择' +
      (event.to === task.pieceIds.length ? '验收' : pieceById(task.pieceIds[event.to]).nameZh) + '。';
    else if (event.type === 'pick') state.message = '正在摆放' + name + '：A 落定，B 旋转；右侧 BACK 可取消。';
    else if (event.type === 'move') state.message = pose.x === task.width ?
      '已到 BACK 栏；A 取消预览，原摆放保持不变。' : '锚点 (' + pose.x + ',' + pose.y + ')，朝向 ' + pose.turn + '。';
    else if (event.type === 'rotate') state.message = '已将' + name + '旋转到朝向 ' + pose.turn + '；锚点保持不变。';
    else if (event.type === 'place') state.message = '已放入' + name + '，锚点 (' + pose.x + ',' + pose.y + ')，朝向 ' + pose.turn + '。';
    else if (event.type === 'remove') state.message = '已取回' + name + '。';
    else if (event.type === 'cancel') state.message = '已取消预览，原摆放保持不变。';
    else if (event.type === 'clear') state.message = '已取回 ' + event.removed + ' 件零件；错误记录保留。';
    else if (event.type === 'blocked') state.message = {
      boundary: '已到选择边界。', empty: '该零件尚未放入箱体。',
      outside: '零件越过箱壁，不能落定。', overlap: '零件相互重叠，不能落定。'
    }[event.reason];
    else if (event.type === 'reject') state.message = '装箱或抽出通道未通过，剩余 ' + (4 - state.failures) + ' 次错误额度。';
    else if (event.type === 'win') state.message = '全部零件已装箱，指定抽出通道畅通。';
    else if (event.type === 'collision') state.message = '四次错误验收，本次装箱结束。';
  }

  function blocked(state, reason, id) {
    increment(state, 'blockedActions');
    var event = { type: 'blocked', reason: reason };
    if (id !== undefined) event.pieceId = id;
    emit(state, event);
  }

  function submit(state) {
    refresh(state);
    var before = state.failures;
    if (state.geometry.canShip) {
      state.phase = 'won'; state.reason = ''; state.score = 100;
      emit(state, { type: 'win' });
    } else {
      state.failures += 1;
      state.score = 0;
      if (state.failures === config.attemptLimit) {
        state.phase = 'lost'; state.reason = 'attempts';
        emit(state, { type: 'collision', reason: 'attempts' });
      } else {
        state.reason = '';
        emit(state, { type: 'reject', placedCount: state.geometry.placedCount,
          clearRequired: state.geometry.extractions.filter(function (entry) { return entry.canExit; }).length });
      }
    }
    state.submissions.push({ index: state.submissions.length, call: state.calls, elapsed: state.elapsed,
      placements: copy(state.placements), inventory: copy(state.inventory), geometry: copy(state.geometry),
      matched: state.geometry.canShip, failuresBefore: before, failuresAfter: state.failures,
      remaining: config.attemptLimit - state.failures, phase: state.phase, reason: state.reason });
    if (state.phase !== 'playing') state.terminalReceipt = {
      cause: state.phase === 'won' ? 'success' : 'attempts', call: state.calls, elapsed: state.elapsed,
      placements: copy(state.placements), inventory: copy(state.inventory), geometry: copy(state.geometry),
      matched: state.geometry.canShip, failures: state.failures, remaining: config.attemptLimit - state.failures,
      score: state.score, phase: state.phase, reason: state.reason
    };
  }

  function command(state, selected) {
    var task = config.tasks[state.level], index = state.rackIndex, id = task.pieceIds[index];
    if (selected !== 'a' && selected !== 'b') {
      if (state.mode === 'rack') {
        var next = index + (selected === 'up' || selected === 'left' ? -1 : 1);
        if (next < 0 || next > task.pieceIds.length) blocked(state, 'boundary');
        else {
          state.rackIndex = next; increment(state, 'moves');
          emit(state, { type: 'rack', from: index, to: next });
        }
      } else {
        var from = copy(state.preview), to = copy(from);
        to.x += selected === 'right' ? 1 : selected === 'left' ? -1 : 0;
        to.y += selected === 'down' ? 1 : selected === 'up' ? -1 : 0;
        if (to.x < 0 || to.x > task.width || to.y < 0 || to.y >= task.height) blocked(state, 'boundary');
        else {
          state.preview = to; increment(state, 'moves'); refreshPreview(state);
          emit(state, { type: 'move', from: from, to: to });
        }
      }
      return;
    }
    if (state.mode === 'rack') {
      if (index === task.pieceIds.length) {
        if (selected === 'a') submit(state);
        else {
          var removed = state.placements.filter(function (pose) { return pose !== null; }).length;
          state.placements = task.pieceIds.map(function () { return null; });
          increment(state, 'clears'); refresh(state);
          emit(state, { type: 'clear', removed: removed });
        }
      } else if (selected === 'a') {
        var old = state.placements[index];
        state.mode = 'place'; state.preview = old === null ? { x: 0, y: 0, turn: 0 } : copy(old);
        increment(state, 'pickups'); refreshPreview(state);
        emit(state, { type: 'pick', pieceId: id, pose: state.preview, wasPlaced: old !== null });
      } else if (state.placements[index] === null) blocked(state, 'empty', id);
      else {
        var removedPose = state.placements[index]; state.placements[index] = null;
        increment(state, 'removals'); refresh(state);
        emit(state, { type: 'remove', pieceId: id, pose: removedPose });
      }
    } else if (selected === 'b') {
      var previous = copy(state.preview);
      state.preview.turn = (state.preview.turn + 1) % 4;
      increment(state, 'rotations'); refreshPreview(state);
      emit(state, { type: 'rotate', pieceId: id, from: previous, to: state.preview });
    } else if (state.preview.x === task.width) {
      state.mode = 'rack'; state.preview = null; state.previewCheck = null;
      emit(state, { type: 'cancel', pieceId: id });
    } else {
      refreshPreview(state);
      if (!state.previewCheck.valid) blocked(state, state.previewCheck.outsideCells.length ? 'outside' : 'overlap', id);
      else {
        var oldPose = copy(state.placements[index]), placed = copy(state.preview);
        state.placements[index] = placed;
        increment(state, 'placementsMade'); state.mode = 'rack'; state.preview = null; state.previewCheck = null;
        refresh(state);
        emit(state, { type: 'place', pieceId: id, from: oldPose, to: placed });
      }
    }
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
    } catch (error) { values = Object.create(null); }
    var x = typeof values.x === 'number' && Number.isFinite(values.x) ? Math.max(-1, Math.min(1, values.x)) : 0;
    var y = typeof values.y === 'number' && Number.isFinite(values.y) ? Math.max(-1, Math.min(1, values.y)) : 0;
    var direction = 'none';
    if (Math.abs(x) > 0.5 || Math.abs(y) > 0.5) {
      direction = Math.abs(y) >= Math.abs(x) ? (y > 0 ? 'down' : 'up') : (x > 0 ? 'right' : 'left');
    }
    return { a: values.a === true, b: values.b === true, direction: direction,
      paused: values.paused === true, cancelled: values.cancelled === true,
      epoch: Number.isSafeInteger(values.cancelEpoch) && values.cancelEpoch >= 0 ? values.cancelEpoch : null };
  }

  function step(state, dt, input) {
    if (state.phase !== 'playing') return state;
    if (typeof dt !== 'number' || !Number.isFinite(dt) || dt <= 0 || dt > 0.25) return state;
    var held = normalize(input);
    if (held.paused) return state;
    state.events = []; state.lastCommand = 'none'; increment(state, 'calls');
    var nextElapsed = state.elapsed + dt;
    if (nextElapsed > config.maxElapsed) state.elapsedCapped = true;
    state.elapsed = Math.min(config.maxElapsed, nextElapsed);
    var wasArmed = state.inputArmed;
    var disarm = (held.epoch !== null && state.cancelEpoch !== null && held.epoch !== state.cancelEpoch) ||
      (held.cancelled && !state.cancelledLast);
    if (disarm) state.inputArmed = false;
    if (held.epoch !== null) state.cancelEpoch = held.epoch;
    state.cancelledLast = held.cancelled;
    var selected = 'none';
    if (!disarm && wasArmed && !held.cancelled) {
      if (held.b && !state.lastHeld.b) selected = 'b';
      else if (held.a && !state.lastHeld.a) selected = 'a';
      else if (held.direction !== 'none' && held.direction !== state.lastHeld.direction) selected = held.direction;
    }
    state.lastHeld = { a: held.a, b: held.b, direction: held.direction };
    if (!disarm && !held.cancelled && !held.a && !held.b && held.direction === 'none') state.inputArmed = true;
    if (selected !== 'none') { state.lastCommand = selected; command(state, selected); }
    return state;
  }

  var api = { create: create, step: step, config: config };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.PureModel = api;
}());
