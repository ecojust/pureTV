(function (root) {
  'use strict';
  var config = root.PureModel.config;
  var C = { background: '#231d32', panel: '#292337', inset: '#1b1d2c', text: '#f4ebd4', muted: '#c4b5ad',
    brass: '#dcb974', rim: '#74604d', selected: '#f7d895', good: '#a5dbbc', bad: '#ed9a94', glass: '#87d1c7',
    glyphs: { hook: '#de817d', flag: '#5bbdb3', sprout: '#b7a0d7' } };
  var GLYPH_PIXELS = 64, GLYPH_UNIT = 5;
  var letters = { hook: 'H', flag: 'F', sprout: 'S' };

  function rounded(c, x, y, w, h, radius, fill, stroke) {
    c.beginPath(); c.moveTo(x + radius, y); c.lineTo(x + w - radius, y);
    c.quadraticCurveTo(x + w, y, x + w, y + radius); c.lineTo(x + w, y + h - radius);
    c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); c.lineTo(x + radius, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - radius); c.lineTo(x, y + radius);
    c.quadraticCurveTo(x, y, x + radius, y); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
  }
  function polygonPath(c, polygons) {
    c.beginPath();
    polygons.forEach(function (polygon) {
      var points = polygon.slice(), twiceArea = 0;
      for (var edge = 0; edge < points.length; edge++) {
        var next = points[(edge + 1) % points.length];
        twiceArea += points[edge][0] * next[1] - points[edge][1] * next[0];
      }
      // Equal winding makes nonzero clipping the union, including the sprout
      // leaf that overlaps its stem. The immutable public vertices stay intact.
      if (twiceArea < 0) points.reverse();
      c.moveTo(points[0][0], points[0][1]);
      for (var i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
      c.closePath();
    });
  }
  function glyphPainter(glyph, mirrored) {
    return function (c, w, h, art) {
      // Both tiles use the same exact public polygons. Reflection changes x
      // before any runtime rotation, including the enamel highlight itself.
      c.save(); c.translate(w / 2, h / 2); c.scale(mirrored ? -GLYPH_UNIT : GLYPH_UNIT, GLYPH_UNIT);
      polygonPath(c, glyph.polygons); c.clip();
      c.fillStyle = C.glyphs[glyph.id]; c.fillRect(-7, -7, 14, 14);
      c.fillStyle = art.linear(c, -5, -5, 5, 5,
        [[0, 'rgba(255,249,213,.40)'], [.4, 'rgba(255,255,255,.05)'], [1, 'rgba(31,22,46,.31)']]);
      c.fillRect(-7, -7, 14, 14);
      // The bevel is clipped inside the union, preserving its asymmetric edge.
      polygonPath(c, glyph.polygons); c.strokeStyle = '#f7d99c'; c.lineWidth = .45; c.stroke();
      c.restore();
    };
  }
  function fanPainter(order) {
    return function (c) {
      var half = Math.PI / (order * 2);
      c.beginPath(); c.moveTo(112, 112); c.arc(112, 112, 100, -Math.PI / 2 - half, -Math.PI / 2 + half);
      c.closePath(); c.fillStyle = '#ffffff'; c.fill();
    };
  }
  var tiles = [
    { name: 'velvet', x: 0, y: 0, w: 512, h: 288, paint: function (c, w, h, art) {
      c.fillStyle = art.linear(c, 0, 0, w, h, [[0, '#3b2a40'], [.42, '#2b263d'], [1, '#182335']]); c.fillRect(0, 0, w, h);
      for (var y = 2; y < h; y += 4) {
        c.fillStyle = y % 12 ? 'rgba(237,213,178,.016)' : 'rgba(4,5,22,.10)'; c.fillRect(0, y, w, 1);
      }
      c.strokeStyle = 'rgba(210,175,113,.12)'; c.lineWidth = .8;
      [8, w - 8].forEach(function (x) { c.beginPath(); c.moveTo(x, 8); c.lineTo(x, h - 8); c.stroke(); });
      [8, h - 8].forEach(function (y) { c.beginPath(); c.moveTo(8, y); c.lineTo(w - 8, y); c.stroke(); });
      [[8, 8], [w - 8, 8], [8, h - 8], [w - 8, h - 8]].forEach(function (p) {
        art.ellipse(c, p[0], p[1], 2.2, 2.2, '#d9b875');
      });
      rounded(c, 8, 33, 175, 230, 5, 'rgba(20,17,31,.44)', 'rgba(220,185,116,.25)');
      rounded(c, 188, 33, 151, 230, 5, 'rgba(20,17,31,.32)', 'rgba(220,185,116,.20)');
      rounded(c, 345, 33, 158, 230, 5, 'rgba(20,17,31,.32)', 'rgba(220,185,116,.20)');
    } },
    { name: 'socket', x: 512, y: 160, w: 96, h: 96, paint: function (c, w, h, art) {
      art.ellipse(c, 48, 51, 43, 43, '#171523');
      art.ellipse(c, 48, 48, 41, 41, art.linear(c, 16, 10, 80, 87,
        [[0, '#f8e4b2'], [.28, '#d1ad6a'], [.52, '#765540'], [.78, '#c7a16a'], [1, '#4d3b39']]));
      art.ellipse(c, 48, 48, 35, 35, '#292538');
      art.ellipse(c, 48, 48, 32, 32, art.radial(c, 48, 48, 35,
        [[0, '#494255'], [1, '#242233']], 38, 35));
      c.beginPath(); c.arc(48, 48, 36, Math.PI * 1.06, Math.PI * 1.84);
      c.strokeStyle = '#f7e4b4'; c.lineWidth = 1.2; c.stroke();
    } },
    { name: 'plate', x: 0, y: 800, w: 224, h: 224, paint: function (c, w, h, art) {
      art.ellipse(c, 112, 115, 111, 108, 'rgba(6,8,20,.52)');
      art.ellipse(c, 112, 112, 109, 109, art.linear(c, 35, 15, 185, 209,
        [[0, '#f7e2aa'], [.27, '#c9a466'], [.51, '#76543d'], [.71, '#e4c78d'], [1, '#614735']]));
      art.ellipse(c, 112, 112, 104, 104, '#332d3b');
      art.ellipse(c, 112, 112, 100, 100, art.radial(c, 112, 112, 103,
        [[0, '#fff6dd'], [.7, '#eee2c5'], [1, '#cab893']], 94, 81));
      [.42, .66, .90].forEach(function (radius) {
        c.beginPath(); c.arc(112, 112, radius * 100, 0, Math.PI * 2);
        c.strokeStyle = 'rgba(99,79,66,.17)'; c.lineWidth = .7; c.stroke();
      });
      for (var i = 0; i < 60; i++) {
        var a = i * Math.PI / 30, inner = i % 5 ? 105 : 102;
        c.beginPath(); c.moveTo(112 + Math.cos(a) * inner, 112 + Math.sin(a) * inner);
        c.lineTo(112 + Math.cos(a) * 107, 112 + Math.sin(a) * 107);
        c.strokeStyle = i % 5 ? '#a4865d' : '#fbe7b4'; c.lineWidth = .8; c.stroke();
      }
      art.ellipse(c, 112, 112, 13, 13, '#d0b176'); art.ellipse(c, 112, 112, 10, 10, '#302b3b');
      art.ellipse(c, 112, 109, 3.6, 3.6, '#e7c78a');
      art.path(c, [[110, 111], [114, 111], [116, 118], [108, 118]], '#e7c78a');
    } },
    { name: 'fan3', x: 224, y: 800, w: 224, h: 224, paint: fanPainter(3) },
    { name: 'fan4', x: 448, y: 800, w: 224, h: 224, paint: fanPainter(4) },
    { name: 'fan5', x: 672, y: 800, w: 224, h: 224, paint: fanPainter(5) }
  ];
  config.glyphs.forEach(function (glyph, index) {
    [false, true].forEach(function (mirrored, parity) {
      tiles.push({ name: glyph.id + (mirrored ? 'Mirror' : 'Normal'), x: 512 + index * 64, y: parity * 72,
        w: GLYPH_PIXELS, h: GLYPH_PIXELS, paint: glyphPainter(glyph, mirrored) });
    });
  });
  var atlas = { builtins: [], tiles: tiles };

  function text(r, value, x, y, size, color, width) {
    if (r.measureText(value, size) > width) throw new Error('Kaleido Keys text exceeds width: ' + value);
    r.text(value, x, y, size, color);
  }
  function centerText(r, value, cx, y, size, color, width) {
    text(r, value, cx - r.measureText(value, size) / 2, y, size, color, width);
  }
  function frame(r, x, y, w, h, color, thickness) {
    r.rect(x, y, w, thickness, color); r.rect(x, y + h - thickness, w, thickness, color);
    r.rect(x, y, thickness, h, color); r.rect(x + w - thickness, y, thickness, h, color);
  }
  function glyph(r, cell, x, y, size, angle) {
    r.sprite(cell.glyph + (cell.mirrored ? 'Mirror' : 'Normal'), x, y, size, size, angle, '#ffffff');
  }
  function focusName(state) {
    return state.focus.col < 2 ? 'SLOT ' + (2 * state.focus.row + state.focus.col) : ['ORDER', 'GLYPH', 'CHECK'][state.focus.row];
  }
  function actions(state) {
    if (state.focus.col < 2) {
      var occupied = state.source[2 * state.focus.row + state.focus.col];
      return [occupied ? 'A ROTATE' : state.stock[state.selectedGlyph] ? 'A PLACE' : 'A NO STOCK', occupied ? 'B RETURN' : 'B EMPTY'];
    }
    return state.focus.row === 2 ? ['A SUBMIT', 'B CLEAR'] : ['A NEXT', 'B PREV'];
  }
  function sourceGrid(r, state) {
    text(r, 'SOURCE GRID', 24, 67, 25, C.text, 310);
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 3; col++) {
        var x = col < 2 ? 18 + col * 102 : 222, y = 104 + row * 100, w = col < 2 ? 94 : 116;
        var active = state.focus.row === row && state.focus.col === col;
        r.rect(x, y, w, 92, active ? '#51414b' : C.panel);
        frame(r, x, y, w, 92, active ? C.selected : C.rim, active ? 3 : 1);
        if (col < 2) {
          var slot = 2 * row + col, piece = state.source[slot];
          text(r, slot, x + 9, y + 5, 24, active ? C.selected : C.muted, 24);
          if (piece) {
            text(r, 'q' + piece.turn, x + 53, y + 5, 24, C.text, 36);
            r.sprite('socket', x + 47, y + 60, 54, 54, 0, '#ffffff');
            glyph(r, piece, x + 47, y + 60, 50, piece.turn * Math.PI / 2);
          } else {
            centerText(r, 'EMPTY', x + w / 2, y + 43, 24, '#b8a99f', w - 10);
          }
        } else if (row === 0) {
          centerText(r, 'ORDER', x + w / 2, y + 7, 24, C.brass, w - 8);
          centerText(r, 'N ' + state.order, x + w / 2, y + 38, 28, state.pattern.orderMatched ? C.good : C.text, w - 8);
          centerText(r, 'A+ B-', x + w / 2, y + 65, 24, C.muted, w - 8);
        } else if (row === 1) {
          centerText(r, 'GLYPH', x + w / 2, y + 7, 24, C.brass, w - 8);
          glyph(r, { glyph: state.selectedGlyph, mirrored: false }, x + 31, y + 61, 45, 0);
          text(r, letters[state.selectedGlyph] + ':' + state.stock[state.selectedGlyph], x + 61, y + 45, 26,
            state.stock[state.selectedGlyph] ? C.text : C.bad, w - 68);
        } else {
          centerText(r, 'CHECK', x + w / 2, y + 7, 24, state.pattern.matched ? C.good : C.brass, w - 8);
          centerText(r, 'A TEST', x + w / 2, y + 36, 24, C.text, w - 8);
          centerText(r, 'B CLEAR', x + w / 2, y + 64, 24, C.muted, w - 8);
        }
      }
    }
    text(r, 'STOCK  H / F / S', 24, 407, 24, C.muted, 312);
    config.glyphs.forEach(function (item, index) {
      var x = 18 + index * 108, active = state.selectedGlyph === item.id;
      r.rect(x, 441, 104, 48, C.inset); frame(r, x, 441, 104, 48, active ? C.selected : C.rim, active ? 2 : 1);
      glyph(r, { glyph: item.id, mirrored: false }, x + 25, 465, 38, 0);
      text(r, letters[item.id] + ':' + state.stock[item.id], x + 52, 449, 26, state.stock[item.id] ? C.text : C.bad, 48);
    });
  }
  function socketPosition(order, sector, row, col) {
    var alpha = Math.PI / order, t = (2 * col - 1) * alpha / 4, radius = config.radii[row];
    var x = radius * Math.sin(t), y = -radius * Math.cos(t), a = sector * alpha;
    // This is decorative empty-socket geometry only. Every occupied glyph
    // center and angle below comes directly from the public instance output.
    return { x: Math.cos(a) * x - Math.sin(a) * y, y: Math.sin(a) * x + Math.cos(a) * y };
  }
  function fullKey(r, state, target, cx) {
    var data = target ? config.tasks[state.level].target : state.pattern, order = data.order;
    var cy = 205, radius = 98, alpha = Math.PI / order, diameter = radius * 2.24;
    centerText(r, (target ? 'TARGET N' : 'LIVE N') + order, cx, 67, 25,
      target ? C.brass : state.pattern.orderMatched ? C.good : C.bad, 278);
    r.sprite('plate', cx, cy, diameter, diameter, 0, '#ffffff');
    for (var sector = 0; sector < 2 * order; sector++) {
      if (sector % 2) r.sprite('fan' + order, cx, cy, diameter, diameter, sector * alpha, [.23, .54, .53, .11]);
      var boundary = -Math.PI / 2 + (sector - .5) * alpha;
      r.line(cx + Math.cos(boundary) * radius * .15, cy + Math.sin(boundary) * radius * .15,
        cx + Math.cos(boundary) * radius, cy + Math.sin(boundary) * radius, .8, '#b8a890');
      for (var slot = 0; slot < 6; slot++) {
        var p = socketPosition(order, sector, Math.floor(slot / 2), slot % 2);
        r.circle(cx + p.x * radius, cy + p.y * radius, data.cells[sector * 6 + slot] ? 2.6 : 1.25,
          data.cells[sector * 6 + slot] ? '#fff6df' : '#a49584');
      }
    }
    // Gold always identifies the actual upward source sector0, independently
    // of the unrolled SOURCE GRID. Cyan boundaries locate the inspection pair.
    r.sprite('fan' + order, cx, cy, diameter, diameter, 0, [1, .76, .31, .19]);
    var inspected = state.target.sector;
    [-.5, .5].forEach(function (offset) {
      var a = -Math.PI / 2 + (inspected + offset) * alpha;
      r.line(cx + Math.cos(a) * radius * .17, cy + Math.sin(a) * radius * .17,
        cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, 2, '#368d8b');
    });
    data.instances.forEach(function (instance) {
      // The tile's local coordinates have 5 atlas pixels per public vertex
      // unit. This sets the nominal glyphScale; shared atlas filtering applies.
      glyph(r, instance, cx + instance.x * radius, cy + instance.y * radius,
        GLYPH_PIXELS / GLYPH_UNIT * config.glyphScale * radius, instance.angle);
    });
    if (!target && state.focus.col < 2) {
      var focus = socketPosition(order, 0, state.focus.row, state.focus.col);
      var fx = cx + focus.x * radius, fy = cy + focus.y * radius;
      r.line(fx - 5, fy - 6, fx + 5, fy - 6, 1.5, '#8a532a');
      r.line(fx - 5, fy + 6, fx + 5, fy + 6, 1.5, '#8a532a');
    }
  }
  function inspection(r, state, target, x) {
    var window = target ? state.target.window : state.pattern.inspection, mirrored = state.target.sector % 2 === 1;
    centerText(r, 'S' + state.target.sector + ' ' + (mirrored ? 'MIRROR' : 'NORMAL'), x + 142, 318, 24, C.glass, 282);
    window.forEach(function (cell, index) {
      var left = x + index % 2 * 144, top = 353 + Math.floor(index / 2) * 47;
      var matching = !target && state.pattern.windowMatches[index];
      r.rect(left, top, 140, 43, '#222132'); frame(r, left, top, 140, 43, target ? C.rim : matching ? C.good : '#70505a', matching ? 2 : 1);
      text(r, index, left + 8, top + 7, 24, matching ? C.good : C.muted, 24);
      if (cell) {
        glyph(r, cell, left + 66, top + 21.5, 42, cell.turn * Math.PI / 2);
        text(r, 'q' + cell.turn, left + 100, top + 7, 24, C.text, 36);
      } else centerText(r, 'EMPTY', left + 84, top + 7, 24, '#b8a99f', 99);
    });
  }
  function render(r, state) {
    var task = config.tasks[state.level], currentActions = actions(state), remaining = config.attemptLimit - state.failures;
    r.sprite('velvet', 480, 270, 960, 540, 0, '#ffffff');
    r.rect(14, 12, 932, 43, C.inset);
    text(r, task.name, 26, 18, 28, C.text, 433);
    text(r, 'WINDOW ' + state.pattern.windowMatchedCount + '/6', 491, 20, 26,
      state.pattern.windowMatchedCount === 6 ? C.good : C.muted, 220);
    text(r, 'ERRORS LEFT ' + remaining, 722, 20, 26, remaining <= 1 ? C.bad : C.text, 218);
    sourceGrid(r, state); fullKey(r, state, true, 490); fullKey(r, state, false, 790);
    inspection(r, state, true, 348); inspection(r, state, false, 648);
    r.rect(14, 500, 932, 40, C.inset);
    text(r, focusName(state), 25, 507, 24, C.selected, 124);
    text(r, currentActions[0], 165, 507, 24, C.text, 181);
    text(r, currentActions[1], 360, 507, 24, C.text, 171);
    text(r, 'ORDER ' + state.order + '/' + state.target.order, 549, 507, 24,
      state.pattern.orderMatched ? C.good : C.bad, 209);
    text(r, state.pattern.matched ? 'KEY READY' : !state.pattern.orderMatched ? 'ORDER!' : 'WORKING',
      786, 507, 24, state.pattern.matched ? C.good : !state.pattern.orderMatched ? C.bad : C.muted, 151);
  }

  root.GameDef = {
    id: 'kaleido-keys', title: '万花钥匙', seed: config.defaultSeed, accent: C.brass, background: C.background, atlas: atlas,
    holdConfirmAsA: true, levelLabel: '花钥图谱', levelNames: config.tasks.map(function (task) { return task.nameZh; }),
    actionLabels: ['放置 / 旋转 / 确认', '取回 / 反向 / 清空'], tagline: '六格珐琅，经镜面折成一枚完整花钥',
    description: '方向移动源网格焦点。A 放置或顺时针旋转，B 取回；右列切换阶数、图符与验收，验收格 B 清空。MIRROR 窗口左右互换、朝向反转。阶数及完整花钥一致后在验收格按 A；四次错误结束。长按不连动，暂停后先松手。',
    controls: { move: '方向移动 3×3 源网格焦点；上内圈、下外圈', a: '空格、Z、确认 / 手机右上：放置、旋转或工具确认', b: 'X、B / 手机右下：取回、反向切换；验收格清空' },
    tip: 'H 钩、F 旗、S 芽；q0–3 为四种朝向。金色楔是物理源扇区 0，青色边界对应 S 编号窗口。MIRROR 要交换左右、反转朝向；下方两窗保留真实镜像。窗口 6/6 仍需阶数一致；CHECK 的 A 验收、B 清空，清空不退错误次数。',
    winTitle: '花钥完整，镜环开启', loseTitle: '本次花钥未能开启',
    hud: function (state) {
      var selected = config.glyphs.filter(function (item) { return item.id === state.selectedGlyph; })[0];
      return [{ label: '所选图符 / 库存', value: selected.nameZh + ' / ' + state.stock[state.selectedGlyph] },
        { label: '阶数 当前 / 目标', value: state.order + ' / ' + state.target.order, tone: state.pattern.orderMatched ? 'good' : 'warn' },
        { label: '当前窗口吻合', value: state.pattern.windowMatchedCount + ' / 6', tone: state.pattern.windowMatchedCount === 6 ? 'good' : '' },
        { label: '可用错误验收', value: config.attemptLimit - state.failures, tone: state.failures >= 3 ? 'warn' : '' }];
    },
    result: function (state) {
      return (state.phase === 'won' ? '整幅花钥的阶数、图符、朝向与镜像全部通过验收。' : '四次错误验收已用尽；完整花钥仍未匹配。') +
        '当前阶数 ' + state.order + '/' + state.target.order + '，窗口吻合 ' + state.pattern.windowMatchedCount + '/6；错误 ' + state.failures +
        '/' + config.attemptLimit + ' 次，放置 ' + state.placements + ' 次、旋转 ' + state.rotations + ' 次，用时 ' + state.elapsed.toFixed(1) + ' 秒。';
    }, render: render
  };
})(window);
