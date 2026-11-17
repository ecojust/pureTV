(function (root) {
  'use strict';
  var model = root.PureModel, config = model.config;
  var C = { background: '#152932', text: '#edf2e8', muted: '#adbec0', frame: '#52707b',
    quiet: '#10232d', card: '#213943', selected: '#2e4850', good: '#a5e1bb', bad: '#f3a28f',
    masks: ['#8bd6de', '#efc985'] };
  var FIELD = { x: 40, y: 100, size: 344, cx: 212, cy: 272 };

  function rounded(c, x, y, w, h, radius, fill, stroke) {
    c.beginPath(); c.moveTo(x + radius, y); c.lineTo(x + w - radius, y);
    c.quadraticCurveTo(x + w, y, x + w, y + radius); c.lineTo(x + w, y + h - radius);
    c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); c.lineTo(x + radius, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - radius); c.lineTo(x, y + radius);
    c.quadraticCurveTo(x, y, x + radius, y); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
  }
  var atlas = { builtins: [], tiles: [
    { name: 'bench', x: 0, y: 0, w: 512, h: 288, paint: function (c, w, h, art) {
      c.fillStyle = art.linear(c, 0, 0, w, h, [[0, '#38515a'], [.48, '#243e49'], [1, '#142a36']]);
      c.fillRect(0, 0, w, h);
      for (var y = 0; y < h; y += 3) {
        c.fillStyle = y % 9 ? 'rgba(222,238,228,.025)' : 'rgba(4,18,27,.14)'; c.fillRect(0, y, w, 1);
      }
      for (var x = 8; x < w; x += 24) {
        c.fillStyle = 'rgba(5,22,31,.13)'; c.fillRect(x, 34, 1, 217);
      }
      // Atlas artwork uses 512x288; the screen mapping is uniformly 1.875.
      var s = 1 / 1.875, fx = FIELD.x * s, fy = FIELD.y * s, fs = FIELD.size * s;
      rounded(c, 10, 34, 202, 218, 9, art.linear(c, 0, 34, 0, 252,
        [[0, '#82969a'], [.05, '#d4dcd3'], [.09, '#556e78'], [.93, '#304b59'], [1, '#8c9d9c']]), '#132c39');
      rounded(c, fx - 5, fy - 5, fs + 10, fs + 10, 3, '#10242f', '#a7b8b6');
      c.strokeStyle = '#9cb0b1'; c.lineWidth = .6;
      for (var t = 0; t <= 24; t++) {
        var p = fs * t / 24, len = t % 6 ? 2.3 : 4.4;
        c.beginPath(); c.moveTo(fx + p, fy - 7); c.lineTo(fx + p, fy - 7 - len);
        c.moveTo(fx - 7, fy + p); c.lineTo(fx - 7 - len, fy + p); c.stroke();
      }
      [[15, 39], [207, 39], [15, 246], [207, 246], [502, 8], [502, 279]].forEach(function (p) {
        art.ellipse(c, p[0], p[1], 2.7, 2.7, '#132e3c');
        art.ellipse(c, p[0], p[1] - .4, 1.8, 1.8, '#b3c3be');
        c.strokeStyle = '#3b5762'; c.lineWidth = .8; c.beginPath();
        c.moveTo(p[0] - 1.2, p[1]); c.lineTo(p[0] + 1.2, p[1]); c.stroke();
      });
      // The opaque housing masks the rotated period strips outside one square.
      // No glass tint or decoration changes the judged grayscale light inside.
      c.clearRect(fx, fy, fs, fs);
    } },
    { name: 'maskWave', x: 512, y: 0, w: 256, h: 16, paint: function (c, w, h) {
      // Endpoints both sample phase zero. Half-texel UV insets interpolate a
      // complete period; adjacent copies meet at fully transparent crests.
      for (var x = 0; x < w; x++) {
        c.fillStyle = 'rgba(0,0,0,' + (1 - model.transmission(x / (w - 1))) + ')';
        c.fillRect(x, 0, 1, h);
      }
    } },
    { name: 'rim', x: 512, y: 32, w: 96, h: 96, paint: function (c, w, h, art) {
      c.beginPath(); c.arc(48, 48, 44, 0, Math.PI * 2); c.strokeStyle = '#10252f'; c.lineWidth = 7; c.stroke();
      c.beginPath(); c.arc(48, 48, 43, 0, Math.PI * 2);
      c.strokeStyle = art.linear(c, 12, 10, 79, 88, [[0, '#ffffff'], [.38, '#bcc9c5'], [.61, '#647c85'], [1, '#c6d3cd']]);
      c.lineWidth = 3; c.stroke();
      for (var i = 0; i < 24; i++) {
        var a = i * Math.PI / 12, inner = i % 3 ? 39 : 36;
        c.beginPath(); c.moveTo(48 + Math.cos(a) * inner, 48 + Math.sin(a) * inner);
        c.lineTo(48 + Math.cos(a) * 41, 48 + Math.sin(a) * 41);
        c.strokeStyle = '#e6eeea'; c.lineWidth = 1; c.stroke();
      }
    } },
    { name: 'knob', x: 608, y: 32, w: 96, h: 96, paint: function (c, w, h, art) {
      art.ellipse(c, 48, 52, 39, 39, '#10252f');
      art.ellipse(c, 48, 47, 36, 36, art.linear(c, 20, 13, 72, 82,
        [[0, '#dce7df'], [.26, '#8da5aa'], [.54, '#385866'], [.78, '#6d8993'], [1, '#213d4b']]));
      for (var i = 0; i < 24; i++) {
        var a = i * Math.PI / 12;
        c.beginPath(); c.moveTo(48 + Math.cos(a) * 29, 47 + Math.sin(a) * 29);
        c.lineTo(48 + Math.cos(a) * 34, 47 + Math.sin(a) * 34);
        c.strokeStyle = 'rgba(225,241,232,.62)'; c.lineWidth = 1.2; c.stroke();
      }
      art.ellipse(c, 48, 47, 25, 25, art.radial(c, 48, 47, 28,
        [[0, '#526f7a'], [1, '#213f4e']], 39, 36));
      c.fillStyle = '#f1f2dc'; c.fillRect(46, 19, 4, 15);
      art.ellipse(c, 48, 47, 4, 4, '#99b1b5');
    } },
    { name: 'probeRim', x: 704, y: 32, w: 80, h: 80, paint: function (c) {
      c.beginPath(); c.arc(40, 40, 33, 0, Math.PI * 2); c.strokeStyle = '#081820'; c.lineWidth = 10; c.stroke();
      c.beginPath(); c.arc(40, 40, 33, 0, Math.PI * 2); c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.stroke();
    } },
    { name: 'lightScale', x: 512, y: 144, w: 256, h: 16, paint: function (c, w, h, art) {
      c.fillStyle = art.linear(c, 0, 0, w, 0, [[0, '#000000'], [1, '#ffffff']]); c.fillRect(0, 0, w, h);
    } }
  ] };

  function text(r, value, x, y, size, color, width) {
    if (r.measureText(value, size) > width) throw new Error('Moire Atelier text exceeds width: ' + value);
    r.text(value, x, y, size, color);
  }
  function frame(r, x, y, w, h, color, thick) {
    r.rect(x, y, w, thick, color); r.rect(x, y + h - thick, w, thick, color);
    r.rect(x, y, thick, h, color); r.rect(x + w - thick, y, thick, h, color);
  }
  function world(p) { return { x: FIELD.cx + p.x * FIELD.size, y: FIELD.cy + p.y * FIELD.size }; }
  function gray(value) { return [value, value, value, 1]; }
  function signed(value, decimals) {
    var n = value.toFixed(decimals); return (value > 0 ? '+' : '') + n;
  }
  function matchedCount(state) {
    return state.optics.probes.filter(function (probe) { return probe.matched; }).length;
  }
  function seconds(state) { return Math.max(0, Math.ceil(config.timeLimit - state.elapsed)); }

  function lightTable(r, state) {
    r.rect(FIELD.x, FIELD.y, FIELD.size, FIELD.size, '#ffffff');
    state.optics.layers.forEach(function (layer) {
      var n = layer.normal, half = (Math.abs(n.x) + Math.abs(n.y)) * .5;
      var first = Math.floor(-half * layer.frequency + layer.phase) - 1;
      var last = Math.ceil(half * layer.frequency + layer.phase) + 1;
      for (var k = first; k <= last; k++) {
        // Texture phase runs from k to k+1; u=f*n.P+phase. Increasing
        // phase therefore moves a fixed crest toward negative normal.
        var distance = (k + .5 - layer.phase) / layer.frequency;
        r.sprite('maskWave', FIELD.cx + n.x * distance * FIELD.size,
          FIELD.cy + n.y * distance * FIELD.size, FIELD.size / layer.frequency,
          FIELD.size * 1.5, layer.angleRadians, '#ffffff');
      }
    });
    // Black opacity 1-T over white gives T; the second layer gives T0*T1.
    // This foreground cutout is the common crop for both rotated masks.
    r.sprite('bench', 480, 270, 960, 540, 0, '#ffffff');
    frame(r, FIELD.x - 1, FIELD.y - 1, FIELD.size + 2, FIELD.size + 2, '#b9c9c6', 1);
  }
  function dashed(r, a, b, color) {
    var dx = b.x - a.x, dy = b.y - a.y, length = Math.sqrt(dx * dx + dy * dy);
    if (!length) return;
    for (var p = 0; p < length; p += 7) {
      var end = Math.min(p + 3.5, length);
      r.line(a.x + dx * p / length, a.y + dy * p / length,
        a.x + dx * end / length, a.y + dy * end / length, 2, color);
    }
  }
  function maskWindow(r, layer, cx, cy, color) {
    var radius = 38, scale = radius * 2, n = layer.normal, t = layer.tangent;
    r.circle(cx, cy, radius, '#ffffff');
    // Each clipped half-pixel strip is constant along the actual tangent.
    // Miniature plate world origin and orientation match the main square.
    for (var d = -radius + .25; d < radius; d += .5) {
      var reach = Math.sqrt(Math.max(0, radius * radius - d * d));
      var alpha = 1 - model.transmission(layer.frequency * d / scale + layer.phase);
      r.line(cx + n.x * d - t.x * reach, cy + n.y * d - t.y * reach,
        cx + n.x * d + t.x * reach, cy + n.y * d + t.y * reach, .5, [0, 0, 0, alpha]);
    }
    var pin = { x: cx + layer.guide.pin.x * scale, y: cy + layer.guide.pin.y * scale };
    var end = { x: cx + layer.guide.end.x * scale, y: cy + layer.guide.end.y * scale };
    dashed(r, pin, end, '#081b24'); dashed(r, { x: pin.x + 1, y: pin.y }, { x: end.x + 1, y: end.y }, color);
    r.circle(pin.x, pin.y, 4, '#0b202b'); r.circle(pin.x, pin.y, 2, color);
    // Two outside ticks show the current stripe tangent, separate from the
    // fixed dashed fiducial and its crest pin inside the circular plate.
    [-1, 1].forEach(function (side) {
      r.line(cx + t.x * 35 * side, cy + t.y * 35 * side,
        cx + t.x * 43 * side, cy + t.y * 43 * side, 3, color);
    });
    r.sprite('rim', cx, cy, 87, 87, 0, color);
  }
  function layerCard(r, state, layer, y) {
    var active = state.selected === layer.index, color = C.masks[layer.index], guide = layer.guide;
    r.rect(414, y, 222, 184, active ? C.selected : C.card);
    frame(r, 414, y, 222, 184, active ? color : C.frame, active ? 2 : 1);
    text(r, 'MASK ' + (layer.index + 1) + (active ? ' >' : ''), 428, y + 8, 25, color, 160);
    r.sprite('knob', 611, y + 24, 31, 31, layer.phase * Math.PI * 2, '#ffffff');
    maskWindow(r, layer, 465, y + 80, color);
    text(r, 'ANG ' + signed(layer.angleDegrees, 0), 511, y + 52, 24, C.text, 116);
    text(r, 'PH ' + state.layers[layer.index].phaseTick + '/24', 511, y + 85, 24, C.text, 116);
    var turn = guide.turnAligned ? 'TURN 0 OK' : 'TURN ' + signed(guide.turnErrorDegrees, 0) + (guide.turnErrorDegrees > 0 ? ' UP' : ' DN');
    var slide = guide.phaseAligned ? 'SLIDE 0 OK' : 'SLIDE ' + signed(guide.phaseErrorTicks, 1) + (guide.phaseError > 0 ? ' R' : ' L');
    text(r, turn, 428, y + 122, 24, guide.turnAligned ? C.good : C.text, 196);
    text(r, slide, 428, y + 152, 24, guide.phaseAligned ? C.good : C.text, 196);
  }
  function probeMarkers(r, state) {
    state.optics.probes.forEach(function (probe) {
      var p = world(probe.position), value = model.sampleAt(state, probe.position.x, probe.position.y).brightness;
      r.circle(p.x, p.y, 10.3, gray(value));
      r.sprite('probeRim', p.x, p.y, 29, 29, 0, '#ffffff');
      r.rect(p.x + 12, p.y - 16, 23, 28, '#122832');
      text(r, probe.id, p.x + 16, p.y - 16, 24, probe.matched ? C.good : C.text, 21);
    });
  }
  function probeCards(r, state) {
    text(r, 'LIVE / TARGET', 663, 65, 25, C.muted, 273);
    state.optics.probes.forEach(function (probe, index) {
      var y = 96 + index * 74, value = model.sampleAt(state, probe.position.x, probe.position.y).brightness;
      var color = probe.matched ? C.good : C.frame;
      r.rect(652, y, 290, 66, '#19313d'); frame(r, 652, y, 290, 66, color, 1);
      text(r, probe.id, 664, y + 10, 25, probe.matched ? C.good : C.text, 24);
      r.circle(704, y + 25, 11, gray(value)); r.sprite('probeRim', 704, y + 25, 27, 27, 0, '#ffffff');
      r.circle(821, y + 25, 11, gray(probe.targetBrightness)); r.sprite('probeRim', 821, y + 25, 27, 27, 0, '#ffffff');
      text(r, Math.round(value * 100) + '%', 724, y + 10, 25, C.text, 84);
      text(r, Math.round(probe.targetBrightness * 100) + '%', 841, y + 10, 25, C.text, 88);
      var left = 688, width = 239, low = Math.max(0, probe.targetBrightness - probe.tolerance);
      var high = Math.min(1, probe.targetBrightness + probe.tolerance);
      r.sprite('lightScale', left + width / 2, y + 53, width, 6, 0, '#ffffff');
      r.rect(left + low * width, y + 47, Math.max(2, (high - low) * width), 12, [0.65, .88, .73, .45]);
      r.line(left + value * width, y + 44, left + value * width, y + 62, 2, probe.matched ? C.good : C.bad);
      r.line(left + probe.targetBrightness * width, y + 48, left + probe.targetBrightness * width, y + 58, 1, '#ffffff');
    });
  }
  function render(r, state) {
    var task = config.tasks[state.level], count = matchedCount(state), remaining = config.attemptLimit - state.failures;
    lightTable(r, state);
    r.rect(14, 12, 932, 44, C.quiet);
    text(r, task.name, 27, 19, 28, C.text, 480);
    text(r, 'TIME ' + seconds(state) + 's', 540, 21, 26, seconds(state) <= 15 ? C.bad : C.text, 180);
    text(r, 'ERRORS ' + remaining + ' / ' + config.attemptLimit, 744, 21, 26, remaining <= 1 ? C.bad : C.text, 195);
    text(r, 'LIGHT TABLE', 39, 66, 25, C.text, 345);
    probeMarkers(r, state);
    layerCard(r, state, state.optics.layers[0], 84);
    layerCard(r, state, state.optics.layers[1], 280);
    probeCards(r, state);
    text(r, 'NOW ' + count + ' / 5', 40, 450, 25, count === 5 ? C.good : C.text, 200);
    text(r, count === 5 ? 'A READY' : 'ALL AT ONCE', 219, 450, 24, count === 5 ? C.good : C.muted, 179);
    r.rect(14, 480, 932, 27, C.quiet);
    text(r, 'MASK ' + (state.selected + 1) + ' ACTIVE', 26, 479, 24, C.masks[state.selected], 222);
    text(r, 'LEFT / RIGHT SLIDE', 267, 479, 24, C.text, 307);
    text(r, 'UP / DOWN TURN', 620, 479, 24, C.text, 315);
    r.rect(14, 512, 932, 28, C.quiet);
    text(r, 'A SUBMIT', 26, 512, 24, C.text, 168);
    text(r, 'B SWITCH', 209, 512, 24, C.text, 168);
    text(r, '+/-3.5%', 404, 512, 24, C.muted, 158);
    text(r, 'TURN THEN CREST', 617, 512, 24, C.muted, 317);
  }

  root.GameDef = {
    id: 'moire-atelier', title: '纹幕校准', seed: config.defaultSeed, accent: C.masks[0], background: C.background,
    atlas: atlas, holdConfirmAsA: true, levelLabel: '校准课题', levelNames: config.tasks.map(function (task) { return task.nameZh; }),
    actionLabels: ['SUBMIT / 验收', 'SWITCH MASK / 切换膜'], tagline: '移动两层细纹，让五束光同时抵达目标',
    description: '左右滑动条纹，上下旋转当前膜；B 切换两层，A 同时验收五个测点。先对齐参考方向，再把亮纹移到标针。所有实测亮度进入目标范围才合格；90 秒或四次错误验收后结束。长按不连动，暂停后先松手。',
    controls: { move: '左右滑纹，上下旋转；松开再按调整一步', a: '空格、Z、确认键 / 手机右上半区：同时验收五点', b: 'X、B / 手机右下半区：切换当前膜' },
    tip: '圆窗虚线是固定参考方向，小点是亮纹标针。先按 TURN 的 UP/DN 对齐方向，再按 SLIDE 的 L/R 移纹；ANG 是角度，PH 是相位格。LIVE 为实测，TARGET 为目标；五点只看当前状态，全部进入 ±3.5% 后按 A。',
    winTitle: '五点光纹校准完成', loseTitle: '本次校准结束',
    hud: function (state) {
      return [{ label: '当前膜', value: 'MASK ' + (state.selected + 1) },
        { label: '当前合格测点', value: matchedCount(state) + ' / 5', tone: state.optics.matched ? 'good' : '' },
        { label: '剩余秒数', value: seconds(state), tone: seconds(state) <= 15 ? 'warn' : '' },
        { label: '可用错误验收', value: config.attemptLimit - state.failures, tone: state.failures >= 3 ? 'warn' : '' }];
    },
    result: function (state) {
      return (state.phase === 'won' ? '本次验收中，五个当前亮度同时进入目标范围。' :
        state.reason === 'time' ? '90 秒校准时间已到；当前光纹未在时限内通过验收。' : '四次错误验收已用尽。') +
        '当前合格 ' + matchedCount(state) + '/5 点；错误验收 ' + state.failures + '/' + config.attemptLimit +
        ' 次，实际调整 ' + state.adjustments + ' 次，用时 ' + state.elapsed.toFixed(1) + ' 秒。';
    }, render: render
  };
})(window);
