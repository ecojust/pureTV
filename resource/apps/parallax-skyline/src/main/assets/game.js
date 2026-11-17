/* Parallax Skyline: two exact public projections, one locally baked atlas. */
(function (root) {
  'use strict';

  const config = root.PureModel.config;
  const C = Object.freeze({
    background: '#101c29', panel: '#192c3c', inset: '#102332', line: '#456071',
    text: '#f5f0df', muted: '#bdccd0', near: '#e4b17e', far: '#81cccd',
    target: '#fff3c8', selected: '#a6e4d5', good: '#a9e3c3', bad: '#f49a89'
  });
  const focusZh = Object.freeze(['近层', '远层', '视角']);

  function rounded(c, x, y, w, h, radius, fill, stroke, width) {
    c.beginPath(); c.moveTo(x + radius, y); c.lineTo(x + w - radius, y);
    c.quadraticCurveTo(x + w, y, x + w, y + radius); c.lineTo(x + w, y + h - radius);
    c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); c.lineTo(x + radius, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - radius); c.lineTo(x, y + radius);
    c.quadraticCurveTo(x, y, x + radius, y); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width || 1; c.stroke(); }
  }
  function facade(c, w, h, art, near) {
    const edge = near ? '#75513c' : '#254c60';
    c.fillStyle = art.linear(c, 0, 0, w, h, near
      ? [[0, '#f0cf9e'], [.42, '#c69b70'], [1, '#8b6248']]
      : [[0, '#9cc8c8'], [.42, '#5b929e'], [1, '#345d75']]);
    c.fillRect(0, 0, w, h);
    c.fillStyle = near ? '#f9dfb6' : '#c1e3dc'; c.fillRect(0, 0, w, 5);
    c.fillStyle = edge; c.fillRect(w - 9, 5, 9, h - 5);
    c.fillStyle = near ? '#e4be90' : '#82b8bc'; c.fillRect(3, 5, 4, h - 5);
    for (let floor = 0; floor < 6; floor++) {
      const y = 16 + floor * 28;
      c.fillStyle = near ? '#a97d59' : '#386b7e'; c.fillRect(7, y + 19, w - 16, 3);
      for (let window = 0; window < 3; window++) {
        const x = 14 + window * 22;
        c.fillStyle = edge; c.fillRect(x - 2, y - 2, 17, 20);
        c.fillStyle = art.linear(c, x, y, x, y + 16, near
          ? [[0, '#335567'], [.55, '#52707b'], [1, '#c0b795']]
          : [[0, '#214456'], [.55, '#365f71'], [1, '#91c0c0']]);
        c.fillRect(x, y, 13, 16);
        c.fillStyle = near ? '#f1dba7' : '#afddd2'; c.fillRect(x + 1, y + 12, 10, 3);
        c.fillStyle = near ? '#ddba8d' : '#84aeb5'; c.fillRect(x + 5, y, 2, 16);
      }
    }
    c.fillStyle = near ? '#674a3a' : '#244857'; c.fillRect(0, h - 7, w, 7);
  }

  // Custom rectangles avoid the shared glyph cells, white tile and disc tile.
  const atlas = {
    builtins: [],
    tiles: [
      { name: 'desk', x: 0, y: 0, w: 512, h: 432, paint: function (c, w, h, a) {
        c.fillStyle = a.linear(c, 0, 0, w, h, [[0, '#26394a'], [.5, '#142b3b'], [1, '#0c1926']]); c.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 24) { c.fillStyle = 'rgba(141,176,180,.035)'; c.fillRect(x, 0, 1, h); }
        for (let y = 0; y < h; y += 24) { c.fillStyle = 'rgba(141,176,180,.035)'; c.fillRect(0, y, w, 1); }
        a.path(c, [[0, 390], [230, 390], [255, 415], [512, 415]], null, '#54707a', 2);
        a.path(c, [[12, 0], [12, 360], [42, 390]], null, '#47606b', 1);
        c.fillStyle = '#c99e6b'; c.fillRect(0, 0, 512, 4);
        c.fillStyle = 'rgba(238,212,164,.13)'; c.fillRect(0, 4, 512, 2);
      } },
      { name: 'nearFace', x: 512, y: 0, w: 96, h: 192, paint: function (c, w, h, a) { facade(c, w, h, a, true); } },
      { name: 'farFace', x: 608, y: 0, w: 96, h: 192, paint: function (c, w, h, a) { facade(c, w, h, a, false); } },
      { name: 'plate', x: 704, y: 0, w: 320, h: 224, paint: function (c, w, h, a) {
        rounded(c, 1, 1, w - 2, h - 2, 8, a.linear(c, 0, 0, w, h, [[0, '#314958'], [.18, '#203846'], [1, '#112432']]), '#5c7380', 2);
        rounded(c, 6, 6, w - 12, h - 12, 5, '#172d3b', '#0c202e', 2);
        c.fillStyle = 'rgba(190,218,212,.025)'; c.fillRect(10, 9, w - 20, 55);
        for (const x of [12, w - 12]) for (const y of [12, h - 12]) {
          a.ellipse(c, x, y, 3, 3, '#79919a');
          c.strokeStyle = '#1a3342'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 2, y + 1); c.lineTo(x + 2, y - 1); c.stroke();
        }
      } },
      { name: 'rail', x: 0, y: 800, w: 512, h: 192, paint: function (c, w, h, a) {
        rounded(c, 1, 1, w - 2, h - 2, 10, a.linear(c, 0, 0, 0, h, [[0, '#263e4e'], [.45, '#1a3140'], [1, '#102533']]), '#48606f', 2);
        rounded(c, 12, 134, w - 24, 35, 8, '#0b1e2b', '#3f5969', 2);
        c.fillStyle = '#708992'; c.fillRect(18, 144, w - 36, 3);
        c.fillStyle = '#273f4e'; c.fillRect(18, 153, w - 36, 5);
        for (let x = 20; x < w - 20; x += 24) { c.fillStyle = '#506b78'; c.fillRect(x, 138, 2, 5); }
      } },
      { name: 'slider', x: 512, y: 800, w: 128, h: 128, paint: function (c, w, h, a) {
        rounded(c, 5, 27, 118, 79, 12, '#061a27');
        rounded(c, 5, 18, 118, 79, 12, a.linear(c, 5, 18, 123, 97, [[0, '#e7e2c8'], [.3, '#9fb3b4'], [1, '#486c7b']]), '#cee0d8', 2);
        rounded(c, 20, 31, 88, 49, 5, '#254b5d', '#759caa', 2);
        for (let x = 38; x < 100; x += 16) { c.fillStyle = '#94b8bc'; c.fillRect(x, 40, 4, 30); }
        c.fillStyle = '#d7ede1'; c.fillRect(13, 24, 103, 3);
      } },
      { name: 'camera', x: 640, y: 800, w: 128, h: 128, paint: function (c, w, h, a) {
        a.path(c, [[48, 76], [63, 75], [40, 120], [25, 120]], '#71939f', '#2b495c', 2);
        a.path(c, [[66, 75], [79, 76], [101, 120], [86, 120]], '#71939f', '#2b495c', 2);
        rounded(c, 13, 28, 87, 53, 10, a.linear(c, 13, 28, 91, 81, [[0, '#d2dfd9'], [.45, '#92adb5'], [1, '#486f83']]), '#203f53', 3);
        rounded(c, 28, 16, 39, 17, 4, '#e1c38e', '#725d45', 2);
        a.path(c, [[96, 43], [120, 33], [120, 77], [96, 67]], '#547f91', '#a7d0d1', 2);
        a.ellipse(c, 58, 54, 19, 19, '#203f55'); a.ellipse(c, 58, 54, 13, 13, '#a1d7d5');
        a.ellipse(c, 58, 54, 8, 8, '#335e73'); a.ellipse(c, 54, 50, 3, 3, '#e0f2e6');
      } }
    ]
  };

  function text(r, value, x, y, size, color, maxWidth) {
    if (maxWidth != null && r.measureText(value, size) > maxWidth) throw new Error('Parallax Skyline text budget: ' + value);
    r.text(value, x, y, size, color || C.text);
  }
  function frame(r, x, y, w, h, color, thickness) {
    const t = thickness || 2;
    r.rect(x, y, w, t, color); r.rect(x, y + h - t, w, t, color);
    r.rect(x, y, t, h, color); r.rect(x + w - t, y, t, h, color);
  }
  function diamond(r, x, y, radius, color, filled) {
    if (filled) r.rect(x - radius / Math.SQRT2, y - radius / Math.SQRT2, radius * Math.SQRT2, radius * Math.SQRT2, color, Math.PI / 4);
    else {
      r.line(x, y - radius, x + radius, y, 3, color); r.line(x + radius, y, x, y + radius, 3, color);
      r.line(x, y + radius, x - radius, y, 3, color); r.line(x - radius, y, x, y - radius, 3, color);
    }
  }
  function roof(r, heights, x, base, cell, unit, color, thickness) {
    let last = 0;
    for (let column = 0; column < config.columns; column++) {
      const height = heights[column], left = x + column * cell;
      if (height !== last) r.line(left, base - last * unit, left, base - height * unit, thickness, color);
      r.line(left, base - height * unit, left + cell, base - height * unit, thickness, color);
      last = height;
    }
    if (last) r.line(x + config.columns * cell, base - last * unit, x + config.columns * cell, base, thickness, color);
  }
  function projection(r, state, task, index) {
    const view = state.views[index], panelX = index === 0 ? 20 : 490;
    const x = panelX + 25, base = 310, cell = 20, unit = 31;
    const target = task.targets[index], landmark = task.landmarks[index], anchor = view.anchor;
    r.sprite('plate', panelX + 225, 216, 450, 286);
    frame(r, panelX, 73, 450, 286, state.view === index ? C.selected : C.line, state.view === index ? 3 : 2);
    text(r, 'VIEW ' + index, panelX + 21, 84, 27, state.view === index ? C.selected : C.text, 132);
    text(r, landmark.layer === 0 ? 'NEAR MARK' : 'FAR MARK', panelX + 222, 87, 24, landmark.layer === 0 ? C.near : C.far, 206);
    r.rect(x, base - config.maxHeight * unit, cell * config.columns, config.maxHeight * unit, C.inset);
    for (let col = 0; col <= config.columns; col++) r.line(x + col * cell, base - config.maxHeight * unit, x + col * cell, base, 1, '#294454');
    for (let row = 0; row <= config.maxHeight; row++) r.line(x, base - row * unit, x + config.columns * cell, base - row * unit, 1, '#33505e');
    // Only public visible skyline cells decide filled geometry; no second projection implementation.
    for (let col = 0; col < config.columns; col++) {
      const height = view.heights[col];
      if (height > 0) r.sprite(view.owners[col] === 0 ? 'nearFace' : 'farFace', x + (col + .5) * cell, base - height * unit / 2, cell, height * unit);
    }
    roof(r, view.heights, x, base, cell, unit, '#132936', 5);
    roof(r, target, x, base, cell, unit, '#081922', 7);
    roof(r, target, x, base, cell, unit, C.target, 3);
    const tx = x + (landmark.column + .5) * cell, ty = base - landmark.height * unit;
    const ax = x + (anchor.column + .5) * cell, ay = base - anchor.height * unit;
    diamond(r, tx, ty, 12, '#0a202d', false); diamond(r, tx, ty, 10, C.target, false);
    if (anchor.visible) {
      diamond(r, ax, ay, 8, '#0a202d', true);
      diamond(r, ax, ay, 5, anchor.layer === 0 ? C.near : C.far, true);
    } else {
      r.line(ax - 7, ay - 7, ax + 7, ay + 7, 7, '#102634'); r.line(ax + 7, ay - 7, ax - 7, ay + 7, 7, '#102634');
      r.line(ax - 7, ay - 7, ax + 7, ay + 7, 3, C.bad); r.line(ax + 7, ay - 7, ax - 7, ay + 7, 3, C.bad);
    }
    r.rect(x - 3, base + 5, config.columns * cell + 6, 5, '#697f85');
    text(r, view.silhouetteMatched ? 'SKY OK' : 'SKY NO', panelX + 23, 327, 24, view.silhouetteMatched ? C.good : C.bad, 160);
    text(r, anchor.matched ? 'MARK OK' : anchor.visible ? 'MARK NO' : 'MARK HIDDEN', panelX + 222, 327, 24, anchor.matched ? C.good : C.bad, 206);
  }
  function focusCard(r, state, focus) {
    const x = 20 + focus * 314, color = focus === 0 ? C.near : focus === 1 ? C.far : C.selected;
    r.sprite('rail', x + 146, 425, 292, 92);
    if (state.focus === focus) frame(r, x, 379, 292, 92, C.selected, 3);
    r.rect(x + 14, 394, focus === 1 ? 5 : 9, 24, color);
    if (focus === 1) r.rect(x + 23, 394, 5, 24, color);
    text(r, config.focusNames[focus], x + 39, 391, 28, state.focus === focus ? C.text : C.muted, 150);
    if (focus < 2) {
      text(r, 'WORLD ' + state.positions[focus] + ' | x' + config.scales[focus], x + 17, 418, 24, color, 258);
      const bounds = config.bounds[focus], ratio = (state.positions[focus] - bounds[0]) / (bounds[1] - bounds[0]);
      r.sprite('slider', x + 214 + ratio * 47, 407, 28, 28);
    } else {
      text(r, 'POINT ' + state.view + '  < >', x + 17, 418, 24, C.selected, 258);
      r.sprite('camera', x + 254, 404, 35, 35);
    }
  }
  function matchedCount(state) {
    return Number(state.views[0].silhouetteMatched) + Number(state.views[0].anchor.matched) + Number(state.views[1].silhouetteMatched) + Number(state.views[1].anchor.matched);
  }
  function render(r, state) {
    const task = config.tasks[state.level], ready = matchedCount(state) === 4;
    r.sprite('desk', 480, 270, 960, 540);
    text(r, task.name, 22, 25, 29, C.text, 430);
    text(r, 'ERRORS LEFT ' + (config.attemptLimit - state.failures), 662, 27, 26, state.failures >= 3 ? C.bad : C.muted, 278);
    projection(r, state, task, 0); projection(r, state, task, 1);
    for (let focus = 0; focus < 3; focus++) focusCard(r, state, focus);
    r.rect(20, 487, 920, 39, C.inset);
    frame(r, 20, 487, 920, 39, '#3d5969', 1);
    text(r, 'A SUBMIT', 36, 495, 25, C.target, 178);
    text(r, state.undoStack.length ? 'B UNDO ' + state.undoStack.length : 'B UNDO EMPTY', 249, 495, 25, state.undoStack.length ? C.far : C.muted, 254);
    const status = state.phase === 'won' ? 'BOTH VIEWS MATCH' : state.phase === 'lost' ? 'NO ERRORS LEFT' : ready ? 'READY - PRESS A' : 'ALIGN BOTH VIEWS';
    text(r, status, 597, 495, 25, state.phase === 'lost' ? C.bad : ready ? C.good : C.muted, 326);
  }
  function viewResult(view, index) {
    return '视角 ' + index + '：' + (view.silhouetteMatched ? '轮廓合格' : '轮廓不符') + '、' +
      (view.anchor.matched ? '锚点合格' : view.anchor.visible ? '锚点错位' : '锚点被遮挡');
  }

  root.GameDef = {
    id: 'parallax-skyline', title: '视差天际', seed: config.defaultSeed,
    accent: C.selected, background: C.background, atlas: atlas,
    levelLabel: '任务', levelNames: config.tasks.map(function (task) { return task.nameZh; }),
    holdConfirmAsA: true, actionLabels: ['SUBMIT / 验收', 'UNDO / 撤销移动'],
    tagline: '换一个角度，让城市严丝合缝',
    description: '上下选近层、远层或视角，左右调整；每次松开再按。A 验收，B 撤销移动。两个视角的轮廓和锚点都匹配才通关，错验四次失败。亮线与空心菱形是目标，叉号表示锚点被遮挡。',
    controls: {
      move: '上下选近层/远层/视角；左右调整，松开再按一步',
      a: '空格、Z、确认键 / 手机右上半区：验收两个视角',
      b: 'X、B / 手机右下半区：撤销上次移动，不退容错'
    },
    tip: '亮线与空心菱形是目标，实心菱形是当前锚点，叉号表示遮挡。近层移一格投影动两格；四项都合格后按 A 验收。',
    winTitle: '双重视角 · 验收通过', loseTitle: '容错已用尽',
    hud: function (state) {
      return [
        { label: '建筑任务', value: config.tasks[state.level].nameZh },
        { label: '当前聚焦 · 观察点 ' + state.view, value: focusZh[state.focus] },
        { label: '剩余容错', value: (config.attemptLimit - state.failures) + ' / ' + config.attemptLimit, tone: state.failures >= 3 ? 'warn' : '' },
        { label: '轮廓与锚点', value: matchedCount(state) + ' / 4', tone: matchedCount(state) === 4 ? 'good' : '' }
      ];
    },
    result: function (state) {
      if (state.phase === 'won') return config.tasks[state.level].nameZh + '验收通过：两个视角的轮廓与锚点全部合格。误验 ' + state.failures + ' 次；近层 ' + state.positions[0] + '，远层 ' + state.positions[1] + '。';
      return '四次误验已用尽。' + viewResult(state.views[0], 0) + '；' + viewResult(state.views[1], 1) + '。重试恢复初始位置与容错。';
    },
    render: render
  };
})(window);
