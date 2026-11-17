(function (root) {
  'use strict';
  var config = root.PureModel.config;
  var C = { background: '#171e23', text: '#f6efdc', muted: '#bac7c6', floor: '#c4c4b4',
    shadow: '#555b72', target: '#6fe0dc', forbidden: '#edb45d', bad: '#ff796a',
    good: '#b9efd7', foot: '#e7a5f1', guide: '#fff4cf', line: '#76868a' };
  function rounded(ctx, x, y, w, h, radius, fill, stroke) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function prismPainter(height) {
    return function (ctx, tileWidth, tileHeight, art) {
      var z = height * 18, n = [32, 90 - z], e = [52, 100 - z], s = [32, 110 - z], w = [12, 100 - z];
      var colors = height === 1 ? ['#edc594', '#9c654a', '#684c42'] : height === 2 ? ['#d7e0d9', '#789498', '#455e68'] : ['#a3bfcb', '#527383', '#304c5c'];
      art.path(ctx, [w, s, [32, 110], [12, 100]], art.linear(ctx, 12, 100 - z, 32, 110, [[0, colors[1]], [1, colors[2]]]), '#233c48', 1);
      art.path(ctx, [s, e, [52, 100], [32, 110]], art.linear(ctx, 32, 100 - z, 52, 110, [[0, colors[1]], [1, colors[2]]]), '#233c48', 1);
      art.path(ctx, [n, e, s, w], art.linear(ctx, 12, 90 - z, 52, 110 - z, [[0, '#f5eee0'], [.42, colors[0]], [1, colors[1]]]), '#d3dcd4', 1);
      ctx.save(); ctx.beginPath(); ctx.moveTo(w[0], w[1]); ctx.lineTo(s[0], s[1]); ctx.lineTo(32, 110); ctx.lineTo(12, 100); ctx.closePath(); ctx.clip();
      for (var i = 0; i < 18; i++) { ctx.strokeStyle = i % 3 ? 'rgba(245,251,244,.08)' : 'rgba(16,32,43,.12)'; ctx.beginPath(); ctx.moveTo(9, 102 - z + i * 3); ctx.lineTo(35, 115 - z + i * 3); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = '#dce4d9'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(32, 110 - z); ctx.lineTo(32, 109); ctx.stroke();
      art.path(ctx, [[26, 98 - z], [32, 95 - z], [38, 98 - z], [32, 101 - z]], 'rgba(24,53,65,.16)', 'rgba(250,247,230,.65)', .7);
      art.ellipse(ctx, 18, 103 - z * .45, 1.1, .8, '#d9d9bf'); art.ellipse(ctx, 45, 103 - z * .45, 1.1, .8, '#d9d9bf');
    };
  }
  var atlas = { builtins: [], tiles: [
    { name: 'bench', x: 0, y: 0, w: 512, h: 432, paint: function (ctx, tileWidth, tileHeight, art) {
      ctx.fillStyle = art.linear(ctx, 0, 0, 512, 432, [[0, '#485357'], [.5, '#28353b'], [1, '#15252d']]); ctx.fillRect(0, 0, 512, 432);
      for (var y = 0; y < 432; y += 4) { ctx.fillStyle = y % 12 ? 'rgba(240,224,183,.025)' : 'rgba(5,15,20,.07)'; ctx.fillRect(0, y, 512, 1); }
      ctx.fillStyle = 'rgba(10,22,28,.45)'; ctx.fillRect(0, 0, 512, 47); ctx.fillRect(0, 392, 512, 40);
      for (var x = 24; x < 512; x += 48) { art.ellipse(ctx, x, 62, 2.5, 2.5, '#647878'); art.ellipse(ctx, x, 62, 1, 1, '#203239'); }
    } },
    { name: 'prism1', x: 512, y: 0, w: 64, h: 112, paint: prismPainter(1) },
    { name: 'prism2', x: 576, y: 0, w: 64, h: 112, paint: prismPainter(2) },
    { name: 'prism3', x: 640, y: 0, w: 64, h: 112, paint: prismPainter(3) },
    { name: 'tray', x: 704, y: 0, w: 320, h: 224, paint: function (ctx, tileWidth, tileHeight, art) {
      rounded(ctx, 2, 2, 316, 220, 12, art.linear(ctx, 0, 0, 320, 224, [[0, '#45545b'], [1, '#23343d']]), '#73837e');
      rounded(ctx, 8, 8, 304, 208, 8, '#24353e', '#172a34');
      for (var x = 19; x < 304; x += 19) { ctx.fillStyle = 'rgba(182,197,186,.07)'; ctx.fillRect(x, 15, 1, 194); }
      [[9, 9], [311, 9], [9, 215], [311, 215]].forEach(function (p) { art.ellipse(ctx, p[0], p[1], 2.5, 2.5, '#8e9e95'); });
    } },
    { name: 'floor', x: 0, y: 800, w: 96, h: 48, paint: function (ctx, tileWidth, tileHeight, art) {
      art.path(ctx, [[48, 0], [96, 24], [48, 48], [0, 24]], art.linear(ctx, 0, 0, 96, 48, [[0, '#ffffff'], [1, '#d8ddd8']]), 'rgba(39,58,62,.26)', 1);
    } },
    { name: 'lamp', x: 128, y: 800, w: 112, h: 96, paint: function (ctx, tileWidth, tileHeight, art) {
      art.path(ctx, [[27, 77], [51, 44], [58, 48], [36, 81]], '#70858b', '#182e3b', 2);
      art.path(ctx, [[40, 36], [70, 21], [92, 43], [62, 58]], art.linear(ctx, 40, 20, 92, 58, [[0, '#e6e4cd'], [1, '#748d92']]), '#c1cec1', 2);
      art.path(ctx, [[62, 58], [92, 43], [92, 53], [62, 68]], '#435d68', '#182e39', 2);
      art.path(ctx, [[44, 38], [68, 26], [83, 41], [61, 52]], '#ffe3a0', '#fff2cc', 2);
      art.ellipse(ctx, 32, 79, 22, 7, '#1d343f'); art.ellipse(ctx, 32, 76, 22, 7, '#718681');
    } }
  ] };
  function text(r, value, x, y, size, color, width) {
    if (r.measureText(value, size) > width) throw new Error('Shadow Foundry text exceeds width: ' + value);
    r.text(value, x, y, size, color);
  }
  function point(value) { return '(' + value[0] + ',' + value[1] + ')'; }
  function iso(x, y, z) { return [330 + 20 * (x - y), 230 + 10 * (x + y) - 18 * (z || 0)]; }
  function plan(x, y) { return [800 + 16 * x, 220 + 16 * y]; }
  function frame(r, x, y, w, h, color, thick) {
    r.rect(x, y, w, thick, color); r.rect(x, y + h - thick, w, thick, color);
    r.rect(x, y, thick, h, color); r.rect(x + w - thick, y, thick, h, color);
  }
  function loop(r, points, color, width) {
    points.forEach(function (p, i) { var q = points[(i + 1) % points.length]; r.line(p[0], p[1], q[0], q[1], width, color); });
  }
  function ring(r, p, radius, color) {
    var points = []; for (var i = 0; i < 16; i++) { var angle = i * Math.PI / 8; points.push([p[0] + Math.cos(angle) * radius, p[1] + Math.sin(angle) * radius]); }
    loop(r, points, color, 1.7);
  }
  function diamond(r, p, size, color, filled) {
    if (filled) r.rect(p[0] - size * .6, p[1] - size * .6, size * 1.2, size * 1.2, color, Math.PI / 4);
    else loop(r, [[p[0], p[1] - size], [p[0] + size, p[1]], [p[0], p[1] + size], [p[0] - size, p[1]]], color, 2);
  }
  function arrow(r, a, b, color, width) {
    r.line(a[0], a[1], b[0], b[1], width, color);
    var angle = Math.atan2(b[1] - a[1], b[0] - a[0]), len = 8;
    r.line(b[0], b[1], b[0] - len * Math.cos(angle - .5), b[1] - len * Math.sin(angle - .5), width, color);
    r.line(b[0], b[1], b[0] - len * Math.cos(angle + .5), b[1] - len * Math.sin(angle + .5), width, color);
  }
  function keys(cells) {
    var result = Object.create(null); cells.forEach(function (p) { result[p[0] + ',' + p[1]] = true; }); return result;
  }
  function cellOutline(r, x, y, color) {
    loop(r, [iso(x - .5, y - .5), iso(x + .5, y - .5), iso(x + .5, y + .5), iso(x - .5, y + .5)], color, 1.4);
  }
  function guides(r, geometry, task, project) {
    var foot = project(geometry.footPoint[0], geometry.footPoint[1]), wantedFoot = project(task.guideFoot[0], task.guideFoot[1]);
    var tip = project(geometry.tipPoint[0], geometry.tipPoint[1]), wantedTip = project(task.guideTip[0], task.guideTip[1]);
    ring(r, wantedFoot, 8, C.foot); r.circle(foot[0], foot[1], 4, '#23343d'); r.circle(foot[0], foot[1], 2.8, C.foot);
    diamond(r, wantedTip, 9, '#1b303b', false); diamond(r, wantedTip, 7, C.guide, false);
    diamond(r, tip, 4.3, '#21313c', true); diamond(r, tip, 2.7, C.guide, true);
  }
  function scene(r, state, task) {
    var g = state.geometry, target = keys(task.targetCells), forbidden = keys(task.forbiddenCells);
    var hitTarget = keys(g.targetHitCells), hitForbidden = keys(g.forbiddenHitCells);
    r.sprite('tray', 330, 246, 620, 356, 0, '#ffffff');
    text(r, '3D CAST / CENTER SAMPLES', 36, 79, 24, C.muted, 560);
    for (var y = config.boardMin; y <= config.boardMax; y++) for (var x = config.boardMin; x <= config.boardMax; x++) {
      var key = x + ',' + y, p = iso(x, y), color = target[key] ? '#6caaa8' : forbidden[key] ? '#9b805d' : C.floor;
      r.sprite('floor', p[0], p[1], 40, 20, 0, color);
    }
    g.coveredCells.forEach(function (cell) {
      var key = cell[0] + ',' + cell[1], p = iso(cell[0], cell[1]);
      r.sprite('floor', p[0], p[1], 40, 20, 0, hitForbidden[key] ? C.bad : hitTarget[key] ? C.target : C.shadow);
    });
    task.targetCells.forEach(function (cell) { cellOutline(r, cell[0], cell[1], C.target); });
    task.forbiddenCells.forEach(function (cell) {
      cellOutline(r, cell[0], cell[1], C.forbidden); var a = iso(cell[0] - .25, cell[1] - .25), b = iso(cell[0] + .25, cell[1] + .25);
      r.line(a[0], a[1], b[0], b[1], 1.5, C.forbidden);
    });
    g.shadowHulls2.forEach(function (hull) { loop(r, hull.map(function (p) { return iso(p[0] / 2, p[1] / 2); }), '#394655', 1.5); });
    g.prisms.slice().sort(function (a, b) { return a.center[0] + a.center[1] - b.center[0] - b.center[1] || a.center[0] - b.center[0]; }).forEach(function (prism) {
      var p = iso(prism.center[0], prism.center[1]); r.sprite('prism' + prism.height, p[0], p[1] - 44, 64, 112, 0, '#ffffff');
    });
    var top = iso(g.lightCenter[0], g.lightCenter[1], g.lightHeight), tip = iso(g.tipPoint[0], g.tipPoint[1]);
    var source = iso(g.lightCenter[0] + g.lightVector[0] * 2, g.lightCenter[1] + g.lightVector[1] * 2, g.lightHeight + 2);
    r.sprite('lamp', source[0], source[1] - 13, 56, 48, 0, '#ffffff'); arrow(r, source, top, '#e8c483', 1.6);
    arrow(r, top, tip, C.guide, 2); r.circle(top[0], top[1], 3, C.guide); guides(r, g, task, iso);
    r.rect(28, 370, 604, 68, '#20343e');
    text(r, 'FOOT ' + point(g.footPoint) + '  GUIDE ' + point(task.guideFoot), 53, 378, 24, C.foot, 572);
    ring(r, [39, 390], 7, C.foot);
    text(r, 'POST ' + point(g.lightCenter) + ' H' + g.lightHeight + '  TIP ' + point(g.tipPoint) + ' > ' + point(task.guideTip), 53, 406, 24, C.guide, 572);
    diamond(r, [39, 418], 7, C.guide, false);
  }
  function coveragePlan(r, state, task) {
    var g = state.geometry, target = keys(task.targetCells), forbidden = keys(task.forbiddenCells), covered = keys(g.coveredCells);
    var hitTarget = keys(g.targetHitCells), hitForbidden = keys(g.forbiddenHitCells);
    r.sprite('tray', 800, 246, 280, 356, 0, '#ffffff'); text(r, 'PLAN / 169 CENTERS', 676, 79, 24, C.muted, 251);
    r.rect(695, 115, 210, 210, '#c9ccbb'); frame(r, 695, 115, 210, 210, '#71868a', 2);
    for (var y = config.boardMin; y <= config.boardMax; y++) for (var x = config.boardMin; x <= config.boardMax; x++) {
      var key = x + ',' + y, p = plan(x, y);
      if (covered[key]) r.rect(p[0] - 8, p[1] - 8, 16, 16, hitForbidden[key] ? C.bad : hitTarget[key] ? C.target : C.shadow);
      if (target[key]) frame(r, p[0] - 7, p[1] - 7, 14, 14, '#1a777d', 1.6);
      if (forbidden[key]) { frame(r, p[0] - 7, p[1] - 7, 14, 14, '#7c511c', 1.5); r.line(p[0] - 4, p[1] - 4, p[0] + 4, p[1] + 4, 1.5, '#7c511c'); }
      r.circle(p[0], p[1], 1, covered[key] ? '#d6dfce' : '#708687');
    }
    g.shadowHulls2.forEach(function (hull) { loop(r, hull.map(function (p) { return plan(p[0] / 2, p[1] / 2); }), '#3c4754', 1.2); });
    arrow(r, plan(g.lightCenter[0], g.lightCenter[1]), plan(g.tipPoint[0], g.tipPoint[1]), '#f6e9b9', 1.6); guides(r, g, task, plan);
    text(r, 'SRC ' + config.lampNames[state.lamp] + ' / RAY ' + config.lampNames[(state.lamp + 4) % 8], 677, 338, 24, C.guide, 248);
    r.rect(668, 367, 272, 71, '#20343e');
    text(r, 'TARGET ' + g.targetHits + ' / ' + task.requiredTargetHits, 677, 373, 24, g.targetPassed ? C.good : C.target, 220);
    text(r, g.targetPassed ? 'OK' : '--', 899, 373, 24, g.targetPassed ? C.good : C.muted, 39);
    text(r, 'FORBIDDEN ' + g.forbiddenHits + ' / ' + task.maxForbiddenHits, 677, 405, 24, g.forbiddenPassed ? C.good : C.bad, 220);
    text(r, g.forbiddenPassed ? 'OK' : 'NO', 899, 405, 24, g.forbiddenPassed ? C.good : C.bad, 39);
  }
  function render(r, state) {
    var task = config.tasks[state.level], left = task.budget - state.adjustmentsUsed;
    r.sprite('bench', 480, 270, 960, 540, 0, '#ffffff'); text(r, task.name, 22, 22, 29, C.text, 425);
    text(r, 'ADJUSTMENTS LEFT ' + left + ' / ' + task.budget, 540, 26, 25, left <= 3 ? C.forbidden : C.text, 398);
    scene(r, state, task); coveragePlan(r, state, task);
    ['WORK ' + state.yaw * 90 + ' DEG', 'LIGHT ' + config.lampNames[state.lamp] + ' SOURCE'].forEach(function (label, i) {
      var x = 20 + i * 470; r.rect(x, 447, 450, 39, state.focus === i ? '#31565e' : '#21343f');
      frame(r, x, 447, 450, 39, state.focus === i ? C.target : '#52666e', state.focus === i ? 2 : 1);
      r.circle(x + 18, 466, 5, state.focus === i ? C.target : '#52666e'); text(r, label, x + 34, 455, 24, state.focus === i ? C.text : C.muted, 405);
    });
    text(r, 'ARROWS: WORK / LIGHT', 25, 503, 24, C.muted, 320);
    text(r, 'A CW / B CCW', 377, 503, 24, C.guide, 210);
    text(r, state.phase === 'won' ? 'CAST ACCEPTED' : state.phase === 'lost' ? 'BUDGET EXHAUSTED' : 'HOLLOW = GUIDE', 650, 503, 24, state.phase === 'lost' ? C.bad : C.good, 290);
  }
  root.GameDef = {
    id: 'shadow-foundry', title: '影形铸坊', seed: config.defaultSeed, accent: C.target, background: C.background, atlas: atlas,
    levelLabel: '铸影任务', levelNames: config.tasks.map(function (task) { return task.nameZh; }), holdConfirmAsA: true,
    actionLabels: ['CW / 顺时针', 'CCW / 逆时针'], tagline: '转动金属，校准光线，让影子落在正确的地方',
    description: '上或左选择工件，下或右选择灯光；A 顺时针，B 逆时针。每次旋转消耗一次调整，覆盖全部青色目标格并避开琥珀色禁区即完成。按地面格中心计数，重叠只算一次。',
    controls: { move: '上/左选工件，下/右选灯光；先松开再按', a: '空格、Z、确认键 / 手机右上半区：顺时针旋转', b: 'X、B / 手机右下半区：逆时针旋转' },
    tip: '先把实心脚标对准同色空心圆；再用高柱中心、高度与空心影尖推算灯光方向。光源方向与投影相反。空心标仅是提示，青色覆盖和禁区计数才决定结果。',
    winTitle: '铸影校准完成', loseTitle: '调整次数用尽',
    hud: function (state) {
      var task = config.tasks[state.level], g = state.geometry;
      return [{ label: '工坊任务', value: task.nameZh }, { label: '当前聚焦', value: state.focus ? '灯光 · ' + config.lampNames[state.lamp] : '工件 · ' + state.yaw * 90 + '°' },
        { label: '剩余调整', value: task.budget - state.adjustmentsUsed, tone: task.budget - state.adjustmentsUsed <= 3 ? 'warn' : '' },
        { label: '目标 / 禁区', value: g.targetHits + '/' + task.requiredTargetHits + ' · ' + g.forbiddenHits + '/' + task.maxForbiddenHits, tone: g.matched ? 'good' : '' }];
    },
    result: function (state) {
      var task = config.tasks[state.level], g = state.geometry;
      return (state.phase === 'won' ? '实际阴影已满足两项条件。' : '12 次调整已用尽；目标和禁区必须同时合格。') + '目标 ' + g.targetHits + '/' + task.requiredTargetHits + '，禁区 ' + g.forbiddenHits + '/' + task.maxForbiddenHits + '；工件旋转 ' + state.workRotations + ' 次，灯光旋转 ' + state.lightRotations + ' 次。';
    }, render: render
  };
})(window);
