(function (root) {
  'use strict';
  var config = root.PureModel.config;
  var C = { background: '#101e2b', panel: '#162b3a', floor: '#243e4a', ink: '#f4ead6', muted: '#a9bdc5',
    metal: '#d5b47a', edge: '#6d634f', good: '#85e1c4', bad: '#ff9787', focus: '#ffe0a2', back: '#7887aa' };
  var colors = { rail: '#e79877', elbow: '#6ac8b5', crate: '#e2bd6e', bar: '#b1a0d5', tee: '#7eafd6', zig: '#e5d7b6' };
  var marks = { rail: 'R', elbow: 'E', crate: 'C', bar: 'B', tee: 'T', zig: 'Z' };
  var compass = { right: 'E', left: 'W', up: 'N', down: 'S' };
  var UNIT = 48, TILE_W = 192, TILE_H = 144;
  var board = { x: 275, y: 118, cell: 40 };

  function path(c, points) {
    c.beginPath(); c.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
    c.closePath();
  }
  function piecePainter(piece) {
    return function (c, w, h, art) {
      c.save(); c.translate((w - piece.width * UNIT) / 2, (h - piece.height * UNIT) / 2); c.scale(UNIT, UNIT);
      path(c, piece.vertices); c.clip();
      c.fillStyle = colors[piece.id]; c.fillRect(0, 0, piece.width, piece.height);
      c.fillStyle = art.linear(c, 0, 0, piece.width, piece.height,
        [[0, 'rgba(255,253,227,.43)'], [.42, 'rgba(255,255,255,.04)'], [1, 'rgba(15,26,38,.30)']]);
      c.fillRect(0, 0, piece.width, piece.height);
      // All bevel paint is clipped INSIDE the exact outline. No bounding-box
      // fill bridges a concavity, and no decorative fringe grants extra floor.
      path(c, piece.vertices); c.strokeStyle = '#172b34'; c.lineWidth = .15; c.stroke();
      for (var i = 0; i < piece.vertices.length; i++) {
        var a = piece.vertices[i], b = piece.vertices[(i + 1) % piece.vertices.length];
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
        c.strokeStyle = b[0] > a[0] || b[1] < a[1] ? 'rgba(255,249,218,.74)' : 'rgba(24,44,52,.40)';
        c.lineWidth = .075; c.stroke();
      }
      for (var y = .08; y < piece.height; y += .12) {
        c.strokeStyle = 'rgba(255,255,255,.025)'; c.lineWidth = .012;
        c.beginPath(); c.moveTo(0, y); c.lineTo(piece.width, y); c.stroke();
      }
      c.restore();
    };
  }
  var tiles = config.pieces.map(function (piece, i) {
    return { name: 'piece_' + piece.id, x: i % 3 * TILE_W, y: Math.floor(i / 3) * TILE_H,
      w: TILE_W, h: TILE_H, paint: piecePainter(piece) };
  });
  tiles.push({ name: 'bench', x: 0, y: 800, w: 512, h: 224, paint: function (c, w, h, art) {
    c.fillStyle = art.linear(c, 0, 0, w, h, [[0, '#233b4a'], [.55, '#152b39'], [1, '#0e1b2b']]); c.fillRect(0, 0, w, h);
    for (var y = 1; y < h; y += 3) {
      c.fillStyle = y % 9 ? 'rgba(150,200,211,.020)' : 'rgba(2,10,22,.10)'; c.fillRect(0, y, w, 1);
    }
    c.strokeStyle = 'rgba(221,199,151,.22)'; c.lineWidth = .7; c.strokeRect(5, 5, w - 10, h - 10);
    [[8, 8], [w - 8, 8], [8, h - 8], [w - 8, h - 8]].forEach(function (p) {
      art.ellipse(c, p[0], p[1], 2, 2, '#9c957c');
    });
  } });
  tiles.push({ name: 'floor', x: 592, y: 0, w: 96, h: 96, paint: function (c, w, h, art) {
    c.fillStyle = art.linear(c, 0, 0, w, h, [[0, '#2a4753'], [1, '#203845']]); c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(151,186,190,.13)'; c.lineWidth = 1; c.strokeRect(.5, .5, w - 1, h - 1);
    for (var x = 12; x < w; x += 24) for (var y = 12; y < h; y += 24) art.ellipse(c, x, y, .8, .8, '#49646c');
  } });
  tiles.push({ name: 'wall', x: 688, y: 0, w: 96, h: 96, paint: function (c, w, h, art) {
    c.fillStyle = art.linear(c, 0, 0, w, h, [[0, '#d9c08e'], [.45, '#af9160'], [1, '#75644d']]); c.fillRect(0, 0, w, h);
    for (var y = 5; y < h; y += 7) {
      c.strokeStyle = y % 3 ? 'rgba(76,57,40,.12)' : 'rgba(255,234,175,.17)'; c.lineWidth = .7;
      c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(w * .3, y - 3, w * .8, y + 3, w, y); c.stroke();
    }
    c.strokeStyle = '#e8d2a0'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3);
    art.ellipse(c, 14, 14, 4, 4, '#7c6a4b'); art.ellipse(c, 14, 13, 2.6, 2.6, '#d8c18d');
  } });
  tiles.push({ name: 'screw', x: 784, y: 0, w: 64, h: 64, paint: function (c, w, h, art) {
    art.ellipse(c, 32, 34, 25, 25, '#15242b');
    art.ellipse(c, 32, 32, 24, 24, art.linear(c, 9, 8, 52, 55, [[0, '#f2d99c'], [1, '#6a5d49']]));
    art.ellipse(c, 32, 32, 17, 17, '#9c8a64');
    c.strokeStyle = '#3b3b32'; c.lineWidth = 5; c.beginPath(); c.moveTo(19, 32); c.lineTo(45, 32); c.stroke();
  } });
  var atlas = { builtins: [], tiles: tiles };

  function text(r, value, x, y, size, color, width) {
    if (r.measureText(value, size) > width) throw Error('Packing Sculptor text exceeds width: ' + value);
    r.text(value, x, y, size, color);
  }
  function centered(r, value, x, y, size, color, width) {
    text(r, value, x - r.measureText(value, size) / 2, y, size, color, width);
  }
  function frame(r, x, y, w, h, color, size) {
    r.rect(x, y, w, size, color); r.rect(x, y + h - size, w, size, color);
    r.rect(x, y, size, h, color); r.rect(x + w - size, y, size, h, color);
  }
  function point(x, y) { return [board.x + x * board.cell, board.y + y * board.cell]; }
  function outline(r, vertices, color, width) {
    for (var i = 0; i < vertices.length; i++) {
      var a = point(vertices[i][0], vertices[i][1]), b = point(vertices[(i + 1) % vertices.length][0], vertices[(i + 1) % vertices.length][1]);
      r.line(a[0], a[1], b[0], b[1], width, color);
    }
  }
  function pieceById(id) { return config.pieces.filter(function (piece) { return piece.id === id; })[0]; }
  function pieceSprite(r, id, pose, x, y, unit, tint) {
    var piece = pieceById(id), odd = pose.turn % 2, w = odd ? piece.height : piece.width, h = odd ? piece.width : piece.height;
    r.sprite('piece_' + id, x + w * unit / 2, y + h * unit / 2,
      TILE_W * unit / UNIT, TILE_H * unit / UNIT, pose.turn * Math.PI / 2, tint);
  }
  function arrow(r, x, y, dx, dy, length, color) {
    var ex = x + dx * length, ey = y + dy * length;
    r.line(x, y, ex, ey, 3, color);
    r.line(ex, ey, ex - dx * 9 + dy * 7, ey - dy * 9 - dx * 7, 3, color);
    r.line(ex, ey, ex - dx * 9 - dy * 7, ey - dy * 9 + dx * 7, 3, color);
  }
  function isFloor(task, x, y) { return x >= 0 && x < task.width && y >= 0 && y < task.height && task.rows[y][x] === '1'; }
  function openEdge(task, direction, coordinate, outer) {
    return outer && task.doors.some(function (door) { return door.direction === direction && coordinate >= door.start && coordinate + 1 <= door.end; });
  }
  function floor(r, state) {
    var task = config.tasks[state.level], unit = board.cell, W = task.width, H = task.height;
    var right = board.x + W * unit, bottom = board.y + H * unit;
    r.rect(board.x - 9, board.y - 9, W * unit + 18, H * unit + 18, '#0e202b');
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var p = point(x, y); r.sprite(isFloor(task, x, y) ? 'floor' : 'wall', p[0] + unit / 2, p[1] + unit / 2, unit, unit, 0, '#ffffff');
    }
    // Each exposed unit edge is drawn, except the exact finite door aperture.
    // Notches are actual walls, independent of whether any piece is selected.
    for (var y2 = 0; y2 < H; y2++) for (var x2 = 0; x2 < W; x2++) {
      if (!isFloor(task, x2, y2)) continue;
      var edges = [
        { nx: x2 - 1, ny: y2, d: 'left', c: y2, outer: x2 === 0, a: [x2, y2], b: [x2, y2 + 1] },
        { nx: x2 + 1, ny: y2, d: 'right', c: y2, outer: x2 + 1 === W, a: [x2 + 1, y2], b: [x2 + 1, y2 + 1] },
        { nx: x2, ny: y2 - 1, d: 'up', c: x2, outer: y2 === 0, a: [x2, y2], b: [x2 + 1, y2] },
        { nx: x2, ny: y2 + 1, d: 'down', c: x2, outer: y2 + 1 === H, a: [x2, y2 + 1], b: [x2 + 1, y2 + 1] }
      ];
      edges.forEach(function (edge) {
        if (isFloor(task, edge.nx, edge.ny) || openEdge(task, edge.d, edge.c, edge.outer)) return;
        var a = point(edge.a[0], edge.a[1]), b = point(edge.b[0], edge.b[1]);
        r.line(a[0], a[1], b[0], b[1], 8, '#73644e'); r.line(a[0], a[1], b[0], b[1], 4, C.metal);
      });
    }
    // BACK is an editing strip outside the box, never a floor cell or exit.
    r.rect(right + 2, board.y, unit - 2, H * unit, [.33, .39, .56, .19]);
    frame(r, right + 2, board.y, unit - 2, H * unit, C.back, 1);
    for (var sy = board.y + 8; sy < bottom - 8; sy += 18) r.line(right + 7, sy, right + unit - 6, sy + 7, 1, '#556782');
    text(r, 'BACK', right + 3, board.y - 28, 24, C.back, 83);
    task.doors.forEach(function (door) {
      var horizontal = door.direction === 'left' || door.direction === 'right';
      var d = door.direction, coordinate = (door.start + door.end) / 2;
      var cx = d === 'left' ? board.x : d === 'right' ? right : board.x + coordinate * unit;
      var cy = d === 'up' ? board.y : d === 'down' ? bottom : board.y + coordinate * unit;
      var dx = d === 'left' ? -1 : d === 'right' ? 1 : 0, dy = d === 'up' ? -1 : d === 'down' ? 1 : 0;
      var span = (door.end - door.start) * unit / 2;
      var required = state.geometry.extractions.filter(function (exit) {
        return task.requirements.some(function (req) { return req.pieceId === exit.pieceId && req.doorIds.indexOf(door.id) >= 0; });
      });
      var color = required.length && required.every(function (exit) { return exit.canExit; }) ? C.good : C.metal;
      if (horizontal) {
        r.line(cx - 8, cy - span, cx + 8, cy - span, 4, color); r.line(cx - 8, cy + span, cx + 8, cy + span, 4, color);
      } else {
        r.line(cx - span, cy - 8, cx - span, cy + 8, 4, color); r.line(cx + span, cy - 8, cx + span, cy + 8, 4, color);
      }
      arrow(r, cx + dx * 5, cy + dy * 5, dx, dy, 33, color);
      centered(r, compass[d], d === 'up' ? cx + 23 : cx + dx * 57, d === 'up' ? board.y - 31 : cy + dy * 46 - 13, 26, color, 37);
    });
  }
  function placedPieces(r, state) {
    var selected = state.mode === 'place' ? state.pieceIds[state.rackIndex] : null;
    state.geometry.pieces.forEach(function (item) {
      if (!item.pose) return;
      var activeOld = item.id === selected;
      if (activeOld && item.pose.x === state.preview.x && item.pose.y === state.preview.y && item.pose.turn === state.preview.turn) return;
      if (!activeOld) {
        var p = point(item.pose.x, item.pose.y); pieceSprite(r, item.id, item.pose, p[0], p[1], board.cell, '#ffffff');
      }
      outline(r, item.vertices, activeOld ? C.muted : '#162a33', activeOld ? 2 : 1.2);
      var mark = item.cells[0], pos = point(mark[0] + .5, mark[1] + .5);
      centered(r, activeOld ? 'OLD' : marks[item.id] + item.pose.turn, pos[0], pos[1] - 13, 24,
        activeOld ? C.muted : '#213540', activeOld ? 72 : 45);
    });
    if (state.mode !== 'place') return;
    var preview = state.previewCheck, pose = state.preview, at = point(pose.x, pose.y);
    var back = pose.x === state.container.width, color = back ? C.back : preview.valid ? C.good : C.bad;
    pieceSprite(r, preview.id, pose, at[0], at[1], board.cell, [1, 1, 1, .55]);
    outline(r, preview.vertices, color, 2.8);
    r.circle(at[0], at[1], 4.5, color); r.line(at[0] - 7, at[1], at[0] + 10, at[1], 2, '#ffffff');
    r.line(at[0], at[1] - 7, at[0], at[1] + 10, 2, '#ffffff');
    var first = preview.cells[0], label = point(first[0] + .5, first[1] + .5);
    centered(r, marks[preview.id] + pose.turn, label[0], label[1] - 13, 24, '#f8f1d9', 45);
  }
  function rack(r, state) {
    var task = config.tasks[state.level], count = task.pieceIds.length + 1, gap = 8, width = (916 - gap * (count - 1)) / count;
    task.pieceIds.forEach(function (id, index) {
      var x = 22 + index * (width + gap), y = 440, selected = index === state.rackIndex, placed = state.placements[index] !== null;
      r.rect(x, y, width, 88, selected ? '#3d5350' : '#142d35');
      frame(r, x, y, width, 88, selected ? C.focus : '#4a6668', selected ? 3 : 1);
      var piece = pieceById(id), unit = 18;
      pieceSprite(r, id, { turn: 0 }, x + width / 2 - piece.width * unit / 2, y + 28 - piece.height * unit / 2, unit, placed ? [1, 1, 1, .4] : '#ffffff');
      centered(r, marks[id] + '  ' + piece.name, x + width / 2, y + 49, 17, selected ? C.focus : C.ink, width - 8);
      centered(r, placed ? 'LOADED' : 'PICK / ROTATE', x + width / 2, y + 69, 12, placed ? C.good : C.muted, width - 8);
    });
    var x = 22 + task.pieceIds.length * (width + gap), active = state.rackIndex === task.pieceIds.length;
    r.rect(x, 440, width, 88, state.geometry.canShip ? '#245848' : '#273b3b');
    frame(r, x, 440, width, 88, active ? C.focus : C.metal, active ? 3 : 1);
    centered(r, 'DISPATCH', x + width / 2, 456, 19, C.ink, width - 8);
    centered(r, state.geometry.canShip ? 'READY' : 'CHECK', x + width / 2, 484, 23, state.geometry.canShip ? C.good : C.metal, width - 8);
    centered(r, 'A SEND / B CLEAR', x + width / 2, 512, 11, C.muted, width - 8);
  }
  function actions(state) {
    if (state.mode === 'place') return [state.preview.x === state.container.width ? 'A BACK' : 'A PLACE', 'B TURN'];
    return state.rackIndex === state.pieceIds.length ? ['A CHECK', 'B CLEAR'] : ['A PICK', 'B TAKE'];
  }
  function previewStatus(state) {
    if (state.mode !== 'place') return state.geometry.canShip ? 'READY TO CHECK' : 'SELECT A PIECE';
    if (state.preview.x === state.container.width) return 'BACK: CANCEL';
    return state.previewCheck.valid ? 'LEGAL PREVIEW' : state.previewCheck.outsideCells.length ? 'OUTSIDE WALL' : 'PIECE OVERLAP';
  }
  function render(r, state) {
    var task = config.tasks[state.level], current = actions(state), remaining = config.attemptLimit - state.failures;
    board.x = 275 + (7 - task.width) * 20; board.y = 118 + (6 - task.height) * 20;
    r.sprite('bench', 480, 270, 960, 540, 0, '#ffffff');
    r.rect(0, 0, 960, 57, '#dac9a6');
    text(r, 'CARGO / ' + String(state.level + 1).padStart(2, '0'), 23, 13, 25, '#213c42', 245);
    text(r, task.name, 297, 13, 27, '#213c42', 372);
    text(r, 'PACK + EXIT', 737, 17, 20, '#465e5b', 198);
    // The center is the loading floor; the two narrow receipts describe the
    // job and its exit checks. The physical silhouettes live in a bottom tray.
    r.rect(18, 75, 187, 326, '#d9c8a8');
    text(r, 'LOAD SHEET', 33, 89, 21, '#263e43', 160);
    r.line(33, 122, 189, 122, 1, '#98896c');
    text(r, 'PIECES', 33, 138, 16, '#506361', 150);
    text(r, state.geometry.placedCount + ' / ' + state.pieceIds.length, 33, 163, 43, '#243e42', 152);
    var area = task.rows.join('').split('').filter(function (v) { return v === '1'; }).length;
    var used = state.geometry.pieces.reduce(function (total, item) { return total + item.cells.length; }, 0);
    text(r, 'FLOOR ' + used + '/' + area, 33, 222, 17, '#506361', 152);
    r.rect(33, 249, 155, 9, '#aa9d82');r.rect(33, 249, 155 * used / area, 9, '#3d786b');
    text(r, 'CHECKS LEFT', 33, 279, 16, '#506361', 152);
    for (var token = 0; token < 4; token++) r.rect(34 + token * 39, 305, 25, 22, token < remaining ? '#397a69' : '#ac7d64');
    text(r, current[0], 33, 348, 18, '#263e43', 160);text(r, current[1], 33, 376, 18, '#263e43', 160);
    floor(r, state); placedPieces(r, state);
    text(r, 'EXIT MANIFEST', 738, 88, 19, C.metal, 200);
    state.geometry.extractions.forEach(function (exit, index) {
      var y = 126 + index * 85, requirement = task.requirements.find(function (req) { return req.pieceId === exit.pieceId; });
      var doors = requirement.doorIds.map(function (id) { return compass[task.doors.find(function (d) { return d.id === id; }).direction]; }).join('/');
      r.rect(730, y, 210, 72, exit.canExit ? '#234d45' : '#1b343e');
      r.rect(730, y, 4, 72, exit.canExit ? C.good : C.metal);
      text(r, pieceById(exit.pieceId).name + ' > ' + doors, 742, y + 10, 18, C.ink, 186);
      text(r, !exit.placed ? 'AWAIT LOADING' : exit.canExit ? 'PATH CLEAR' : 'PATH BLOCKED', 742, y + 41, 15, exit.canExit ? C.good : C.muted, 186);
    });
    r.line(22, 421, 938, 421, 1, '#d5b47a66');
    text(r, 'PARTS TRAY', 22, 406, 13, C.muted, 140);
    text(r, previewStatus(state), 275, 406, 16, state.mode === 'place' && !state.previewCheck.valid ? C.bad : C.good, 340);
    text(r, state.mode === 'place' ? 'ANCHOR ' + state.preview.x + ',' + state.preview.y + ' / q' + state.preview.turn : 'ARROWS SELECT / A PICK', 650, 406, 14, C.muted, 288);
    rack(r, state);
  }

  root.GameDef = {
    id: 'packing-sculptor', stylesheet: 'game-theme.css', title: '异形装箱', seed: config.defaultSeed, accent: C.metal, background: C.background, atlas: atlas,
    holdConfirmAsA: true, levelLabel: '装箱任务', levelNames: config.tasks.map(function (task) { return task.nameZh; }),
    actionLabels: ['选取 / 落定 / 验收', '取回 / 旋转 / 清空'], tagline: '装得下，也要取得出',
    description: '六座货仓，从侧门小箱到环柱仓与三口分流。装入全部零件，并为标记货物留出完整直线出口。底部托盘选件，摆放时移动和旋转；DISPATCH 验收，四次错误结束。',
    controls: { move: '方向选件 / 移动锚点', a: 'A：选取、落定、验收', b: 'B：取回、旋转、清空' },
    tip: '金色 N/E/S/W 是出口。抽出时其他零件不动；留出完整通道。BACK 取消预览，清空不退错误次数。',
    winTitle: '装箱完成，出库畅通', loseTitle: '本次装箱未通过',
    hud: function (state) {
      var selected = state.rackIndex < state.pieceIds.length ? pieceById(state.pieceIds[state.rackIndex]).nameZh : '验收';
      return [{ label: '当前操作', value: selected + (state.mode === 'place' ? ' · 摆放 q' + state.preview.turn : ' · 零件架') },
        { label: '已装入零件', value: state.geometry.placedCount + ' / ' + state.pieceIds.length },
        { label: '畅通的指定出口', value: state.geometry.extractions.filter(function (exit) { return exit.canExit; }).length + ' / ' + state.geometry.extractions.length,
          tone: state.geometry.extractions.every(function (exit) { return exit.canExit; }) ? 'good' : '' },
        { label: '可用错误验收', value: config.attemptLimit - state.failures, tone: state.failures >= 3 ? 'warn' : '' }];
    },
    result: function (state) {
      return (state.phase === 'won' ? '全部零件都在箱内且互不重叠，指定零件的完整直线抽出通道均畅通。' : '四次错误验收已用尽，请重新安排零件与出口通道。') +
        '已装入 ' + state.geometry.placedCount + '/' + state.pieceIds.length + ' 件，错误 ' + state.failures + '/' + config.attemptLimit +
        ' 次，落定 ' + state.placementsMade + ' 次、旋转 ' + state.rotations + ' 次，用时 ' + state.elapsed.toFixed(1) + ' 秒。';
    }, render: render
  };
})(window);
