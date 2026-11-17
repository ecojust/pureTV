/* Frost Brake: original baked artwork and read-only presentation of public state. */
(function (root) {
  'use strict';

  const C = {
    ink: '#eff8f8', muted: '#b4cdd7', navy: '#102536', deep: '#0a1b29',
    ice: '#bfe8ee', cyan: '#8ad9e5', gold: '#f3c96d', teal: '#73c8b5',
    orange: '#db9258', warning: '#f1ae59', danger: '#ec7e6c'
  };
  const VIEW = { left: 24, width: 688, span: 20, scale: 34.4 };
  const SLED_CONTENT = { left: 16, right: 240, tileWidth: 256 };

  function rounded(c, x, y, w, h, radius, fill, stroke) {
    const r = Math.min(radius, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
  }

  function clawPaint(mode) {
    return function (c, w, h, art) {
      rounded(c, 37, 12, 22, 22, 6, '#526a76', '#d9edf0');
      const tip = mode === 'engaged' ? 83 : mode === 'held' ? 62 : 45;
      art.path(c, [[43, 28], [53, 28], [58, tip - 12], [73, tip - 12],
        [65, tip], [47, tip], [39, tip - 9]],
      art.linear(c, 35, 20, 65, tip, [[0, '#ebf5ef'], [1, '#667f8e']]));
      if (mode === 'engaged') {
        art.path(c, [[45, 78], [52, 87], [58, 77], [64, 87], [70, 77]], '#c8fbff');
        art.ellipse(c, 56, 86, 22, 4, '#b1f4f791');
      } else if (mode === 'held') {
        c.strokeStyle = '#f3c96d'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(26, 72); c.lineTo(68, 72); c.stroke();
      }
    };
  }

  const atlas = {
    builtins: [],
    tiles: [
      { name: 'sledCargo', x: 0, y: 0, w: 256, h: 160, paint(c, w, h, art) {
        // Only the runner fills touch x=16 and x=240: this exact content width
        // maps to the public physical sled length, excluding transparent padding.
        art.path(c, [[16, 132], [32, 139], [220, 139], [240, 128],
          [237, 136], [224, 146], [33, 146], [16, 140]], '#263f4c');
        art.path(c, [[16, 132], [34, 136], [219, 136], [240, 128],
          [236, 132], [221, 140], [33, 140], [16, 136]], '#c8e6e8');
        rounded(c, 28, 111, 199, 19, 7,
          art.linear(c, 0, 111, 0, 130, [[0, '#d4e9e9'], [1, '#6a939f']]));
        rounded(c, 45, 43, 106, 70, 11,
          art.linear(c, 45, 43, 151, 113, [[0, '#efb775'], [0.5, '#d48b4f'], [1, '#a85f38']]), '#f4cca0');
        rounded(c, 156, 65, 58, 47, 8,
          art.linear(c, 156, 65, 214, 112, [[0, '#e0a979'], [1, '#b97445']]), '#f3c79a');
        rounded(c, 65, 22, 72, 24, 8, '#cea379', '#edcaa3');
        rounded(c, 70, 24, 10, 88, 3, '#f3d3a0');
        rounded(c, 121, 24, 9, 88, 3, '#f0d09a');
        rounded(c, 178, 66, 8, 46, 2, '#f5dbaa');
        rounded(c, 84, 70, 32, 22, 4, '#945c37');
        art.path(c, [[91, 81], [100, 74], [109, 81], [100, 88]], '#f2d5a3');
        c.strokeStyle = '#ffe5bc8c'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(53, 53); c.lineTo(141, 53);
        c.moveTo(163, 75); c.lineTo(206, 75); c.stroke();
        [43, 209].forEach(x => art.ellipse(c, x, 120, 3, 3, '#3b5968'));
      } },
      { name: 'iceShelf', x: 256, y: 0, w: 384, h: 192, paint(c, w, h, art) {
        c.fillStyle = art.linear(c, 0, 0, 0, h,
          [[0, '#cdebf0'], [0.18, '#9bcbd7'], [0.7, '#4e8ca4'], [1, '#315c75']]);
        c.fillRect(0, 0, w, h);
        c.fillStyle = '#e9faf8a0'; c.fillRect(0, 7, w, 3);
        c.strokeStyle = '#def8fb40'; c.lineWidth = 2;
        for (let i = 0; i < 14; i++) {
          const x = (i * 89 + 17) % 340, y = 26 + (i * 31) % 135;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + 27, y - 4); c.stroke();
        }
      } },
      { name: 'snowBank', x: 640, y: 0, w: 384, h: 192, paint(c, w, h, art) {
        c.fillStyle = art.linear(c, 0, 45, 0, h, [[0, '#a2c9d7'], [1, '#4d7b94']]);
        c.beginPath(); c.moveTo(0, 157);
        c.bezierCurveTo(48, 133, 57, 66, 113, 79);
        c.bezierCurveTo(162, 86, 165, 27, 210, 44);
        c.bezierCurveTo(267, 63, 279, 122, 384, 91);
        c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill();
        art.path(c, [[153, 79], [199, 47], [215, 48], [240, 73], [217, 68], [203, 58], [187, 76]], '#d4e8ed');
      } },
      { name: 'glassPanel', x: 0, y: 192, w: 256, h: 64, paint(c, w, h, art) {
        rounded(c, 1, 1, w - 2, h - 2, 12,
          art.linear(c, 0, 0, w, h, [[0, '#1c3b50ee'], [1, '#102536ee']]), '#78a9bc55');
      } },
      { name: 'frostStrip', x: 256, y: 192, w: 384, h: 64, paint(c, w, h, art) {
        c.fillStyle = art.linear(c, 0, 0, 0, h,
          [[0, '#dcfcfa30'], [0.4, '#d9ffffbd'], [1, '#d8f7fa20']]);
        c.fillRect(0, 0, w, h);
        c.strokeStyle = '#f0ffffb3'; c.lineWidth = 1.5;
        for (let i = 0; i < 28; i++) {
          const x = 7 + (i * 53) % 365, y = 9 + (i * 17) % 45;
          c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y);
          c.moveTo(x, y - 5); c.lineTo(x, y + 5);
          c.moveTo(x - 3, y - 3); c.lineTo(x + 3, y + 3); c.stroke();
        }
      } },
      { name: 'zoneGlow', x: 640, y: 192, w: 192, h: 64, paint(c, w, h, art) {
        c.fillStyle = art.linear(c, 0, 0, 0, h,
          [[0, '#f3c96d00'], [0.5, '#f3c96d38'], [1, '#f3c96d08']]);
        c.fillRect(0, 0, w, h);
      } },
      { name: 'clawFolded', x: 0, y: 256, w: 96, h: 96, paint: clawPaint('folded') },
      { name: 'clawHeld', x: 96, y: 256, w: 96, h: 96, paint: clawPaint('held') },
      { name: 'clawEngaged', x: 192, y: 256, w: 96, h: 96, paint: clawPaint('engaged') },
      { name: 'brakeChip', x: 288, y: 256, w: 64, h: 64, paint(c, w, h, art) {
        art.path(c, [[11, 36], [26, 12], [52, 29], [35, 52]], '#dffcffb8', '#f2ffff', 2);
        art.path(c, [[26, 12], [29, 33], [52, 29]], '#ffffff80');
      } },
      { name: 'travelArrow', x: 352, y: 256, w: 96, h: 64, paint(c, w, h, art) {
        art.path(c, [[8, 23], [59, 23], [59, 10], [88, 32], [59, 54], [59, 41], [8, 41]], '#ffffff');
      } },
      { name: 'targetBracket', x: 448, y: 256, w: 96, h: 128, paint(c, w, h) {
        rounded(c, 38, 8, 8, 112, 4, '#ffffff');
        rounded(c, 38, 8, 37, 8, 4, '#ffffff');
        rounded(c, 38, 112, 37, 8, 4, '#ffffff');
      } },
      { name: 'routeMarker', x: 544, y: 256, w: 64, h: 64, paint(c, w, h, art) {
        art.path(c, [[32, 5], [55, 30], [32, 56], [9, 30]], '#f3c96d', '#fff2cd', 3);
        art.ellipse(c, 32, 30, 7, 7, '#354c58');
      } },
      { name: 'checkMark', x: 608, y: 256, w: 64, h: 64, paint(c, w, h) {
        c.strokeStyle = '#ffffff'; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(12, 34); c.lineTo(26, 47); c.lineTo(53, 17); c.stroke();
      } },
      { name: 'iceEnd', x: 0, y: 352, w: 256, h: 96, paint(c, w, h, art) {
        art.path(c, [[16, 4], [221, 4], [240, 19], [215, 33], [224, 60],
          [190, 86], [166, 61], [141, 91], [106, 72], [55, 83], [29, 48]],
        art.linear(c, 0, 0, 0, h, [[0, '#d0f4f1'], [1, '#245b78']]));
        art.path(c, [[16, 4], [221, 4], [240, 19], [215, 22], [29, 14]], '#e4fbf6');
      } },
      { name: 'loadStress', x: 256, y: 352, w: 96, h: 96, paint(c, w, h, art) {
        art.path(c, [[14, 39], [25, 17], [31, 40], [20, 55]], '#f3bd66');
        art.path(c, [[58, 21], [72, 10], [67, 39], [54, 51]], '#ffde9b');
        art.path(c, [[70, 62], [85, 54], [79, 77], [63, 85]], '#f3bd66');
      } },
      { name: 'backdrop', x: 0, y: 800, w: 640, h: 224, paint(c, w, h, art) {
        c.fillStyle = art.linear(c, 0, 0, 0, h,
          [[0, '#102a3d'], [0.6, '#335c73'], [1, '#628d9f']]);
        c.fillRect(0, 0, w, h);
        c.fillStyle = art.radial(c, 425, 64, 170,
          [[0, '#c3f1e622'], [1, '#a1d9ee00']]); c.fillRect(0, 0, w, h);
        art.ellipse(c, 492, 52, 18, 18, '#d7ede56b');
        c.strokeStyle = '#b6dbdf24'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(40, 83); c.bezierCurveTo(170, 33, 300, 80, 441, 25); c.stroke();
      } }
    ]
  };

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function number(n, digits) { return n.toFixed(digits); }
  function signed(n) { return (n > 0 ? '+' : '') + number(n, 2); }
  function clock(seconds) {
    const minutes = Math.floor(seconds / 60);
    return String(minutes).padStart(2, '0') + ':' + (seconds % 60).toFixed(1).padStart(4, '0');
  }
  function label(r, value, x, y, size, color) { r.text(value, x, y, size, color || C.ink); }
  function centered(r, value, x, y, size, color) {
    label(r, value, x - r.measureText(value, size) / 2, y, size, color);
  }
  function outline(r, x, y, w, h, color, thickness) {
    const t = thickness || 2;
    r.rect(x, y, w, t, color); r.rect(x, y + h - t, w, t, color);
    r.rect(x, y, t, h, color); r.rect(x + w - t, y, t, h, color);
  }
  function bar(r, x, y, w, fraction, color) {
    r.rect(x, y, w, 10, '#070f1f');
    r.rect(x, y, w * clamp(fraction, 0, 1), 10, color);
  }
  function clawStatus(s) {
    if (!s.controlsReady) return { en: 'RELEASE', zh: '松开后再按', color: C.warning };
    if (s.contact.clawEngaged) return { en: 'ENGAGED', zh: '接地刹车', color: C.cyan };
    if (s.contact.clawRequested) return { en: 'NO FROST', zh: '按住·无霜', color: C.gold };
    return { en: 'FOLDED', zh: '已收起', color: C.muted };
  }

  function drawMain(r, s) {
    const camera = clamp(s.x, 10, 90), lo = camera - VIEW.span / 2, hi = camera + VIEW.span / 2;
    const project = x => VIEW.left + (x - lo) * VIEW.scale;
    const right = VIEW.left + VIEW.width;
    const active = s.layout.docks[s.deliveries];
    const crop = (a, b) => [project(Math.max(a, lo)), project(Math.min(b, hi))];
    r.sprite('backdrop', 368, 243, 688, 294, 0, '#fff');
    r.sprite('snowBank', 368, 234, 688, 180, 0, '#a1c4d0a0');
    r.rect(24, 309, 688, 81, '#102f43');
    r.sprite('iceShelf', 368, 344, 688, 76, 0, '#fff');
    r.line(24, 313, right, 313, 2, '#def8f5');
    s.layout.frostBands.forEach(band => {
      const p = crop(band[0], band[1]);
      if (p[1] <= p[0]) return;
      r.sprite('frostStrip', (p[0] + p[1]) / 2, 321, p[1] - p[0], 40, 0, '#fff');
      r.line(p[0], 339, p[1], 339, 2, C.cyan);
      band.forEach(edge => {
        if (edge >= lo && edge <= hi) r.line(project(edge), 304, project(edge), 340, 2, C.cyan);
      });
    });
    s.layout.docks.forEach((dock, index) => {
      const a = dock.center - dock.width / 2, b = dock.center + dock.width / 2;
      const p = crop(a, b);
      if (p[1] <= p[0]) return;
      const current = index === s.deliveries, done = index < s.deliveries;
      const color = current ? C.gold : done ? C.teal : '#a4bccd';
      if (current) r.sprite('zoneGlow', (p[0] + p[1]) / 2, 301, p[1] - p[0], 126, 0, '#fff');
      r.line(p[0], 348, p[1], 348, current ? 4 : 2, color);
      [a, b].forEach((edge, end) => {
        if (edge < lo || edge > hi) return;
        const x = project(edge), inward = end === 0 ? 1 : -1;
        r.line(x, 249, x, 350, current ? 3 : 2, color);
        r.line(x, 249, x + inward * 12, 249, 3, color);
        r.line(x, 350, x + inward * 12, 350, 3, color);
      });
      if (a < lo) label(r, '<', 28, 327, 26, color);
      if (b > hi) label(r, '>', 691, 327, 26, color);
      if (dock.center >= lo && dock.center <= hi) {
        const x = clamp(project(dock.center), 44, 692);
        centered(r, String(index + 1), x, 215, 32, color);
        if (done) r.sprite('checkMark', x + 23, 229, 20, 20, 0, C.teal);
      }
      if (current) {
        const allowed = crop(a + s.layout.halfLength, b - s.layout.halfLength);
        if (allowed[1] > allowed[0]) {
          r.line(allowed[0], 370, allowed[1], 370, 3, C.gold);
          [a + s.layout.halfLength, b - s.layout.halfLength].forEach(edge => {
            if (edge >= lo && edge <= hi) r.line(project(edge), 364, project(edge), 376, 2, C.gold);
          });
        }
      }
    });
    for (let world = Math.ceil(lo / 2) * 2; world <= hi; world += 2) {
      const x = project(world);
      r.line(x, 382, x, 389, 1, '#bddae0a0');
      if (x > 41 && x < 695) centered(r, String(world), x, 393, 18, C.muted);
    }
    s.layout.lane.forEach((edge, index) => {
      if (edge < lo || edge > hi) return;
      const x = project(edge), inward = index === 0 ? 1 : -1;
      r.rect(x + (index === 0 ? 0 : -3), 299, 3, 91, C.danger);
      label(r, 'EDGE', x + (inward > 0 ? 7 : -66), 277, 22, '#f9cebb');
    });
    const sx = project(s.x), bodyWidth = 2 * s.layout.halfLength * VIEW.scale;
    r.sprite('iceEnd', sx, 322, bodyWidth * 0.9, 13, 0, '#527e8c38');
    const spriteWidth = bodyWidth * SLED_CONTENT.tileWidth / (SLED_CONTENT.right - SLED_CONTENT.left);
    r.sprite('sledCargo', sx, 275, spriteWidth, 86, 0, '#fff');
    const pose = s.contact.clawEngaged ? 'clawEngaged' : s.contact.clawRequested ? 'clawHeld' : 'clawFolded';
    r.sprite(pose, sx, 299, 36, 36, 0, '#fff');
    if (s.contact.clawEngaged && Math.abs(s.v) > 0) {
      const direction = Math.sign(s.v);
      for (let i = 0; i < 3; i++) {
        const phase = (s.time * 2.6 + i / 3) % 1;
        const chipX = sx - direction * (10 + phase * 22);
        if (chipX > 29 && chipX < 707) r.sprite('brakeChip', chipX, 311 - phase * 11,
          6 + phase * 3, 7 + phase * 4, phase, '#d7f8f2a0');
      }
    }
    if (s.contact.clawEngaged && Math.abs(s.v) > s.rules.safeClawSpeed) {
      r.sprite('loadStress', sx, 246, 60, 52, 0, '#fff');
    }
    [s.x - s.layout.halfLength, s.x + s.layout.halfLength].forEach(edge => {
      const x = project(edge);
      r.line(x, 307, x, 326, 2, '#fff8df');
    });
    r.circle(sx, 370, 4, C.ink);
    if (s.v !== 0) r.sprite('travelArrow', sx, 192, 38, 24, s.v < 0 ? Math.PI : 0, C.ice);
    const axis = s.lastInput ? s.lastInput.effectiveAxis : 0;
    if (axis) r.sprite('travelArrow', sx, 162, 24, 16, axis < 0 ? Math.PI : 0, C.orange);
    if (active) {
      const delta = active.center - s.x;
      label(r, 'DOCK ' + (s.deliveries + 1) + '  ' + (delta < 0 ? '< ' : '> ') + number(Math.abs(delta), 1) + ' m',
        42, 117, 28, C.gold);
      if (active.center < lo || active.center > hi) {
        r.sprite('travelArrow', active.center < lo ? 50 : 686, 196, 35, 24,
          active.center < lo ? Math.PI : 0, C.gold);
      }
    } else label(r, 'ALL DOCKS DELIVERED', 42, 117, 28, C.teal);
    return { lo, hi };
  }

  function drawOverview(r, s, camera) {
    const project = x => 24 + x * VIEW.width / 100;
    label(r, 'ROUTE 100m', 24, 418, 26, C.muted);
    r.line(24, 463, 712, 463, 4, '#507c92');
    s.layout.frostBands.forEach(b => r.rect(project(b[0]), 454, (b[1] - b[0]) * 6.88, 9, '#9cdce2'));
    s.layout.docks.forEach((dock, index) => {
      const color = index === s.deliveries ? C.gold : index < s.deliveries ? C.teal : '#9fb7c8';
      const x = project(dock.center);
      r.rect(project(dock.center - dock.width / 2), 468, dock.width * 6.88, 5, color);
      centered(r, String(index + 1), x, 485, 26, color);
      if (index < s.deliveries) r.sprite('checkMark', x + 17, 495, 14, 14, 0, C.teal);
    });
    outline(r, project(camera.lo), 450, VIEW.span * 6.88, 31, '#f4f8fa9c', 2);
    r.sprite('routeMarker', project(s.x), 461, 17, 17, 0, '#fff');
    r.line(project(s.x - s.layout.halfLength), 481, project(s.x + s.layout.halfLength), 481, 3, C.ink);
    r.line(24, 450, 24, 480, 3, C.danger); r.line(712, 450, 712, 480, 3, C.danger);
    label(r, '0', 24, 486, 20, C.muted); label(r, '100m', 661, 486, 20, C.muted);
  }

  function drawRail(r, s) {
    const x = 752, width = 168, status = clawStatus(s);
    const integrity = Math.max(0, s.rules.damageLimit - s.damage);
    const load = s.contact.clawEngaged ? s.rules.loadCoefficient * Math.max(Math.abs(s.v) - s.rules.safeClawSpeed, 0) : 0;
    r.sprite('glassPanel', 836, 270, 200, 500, 0, '#fff');
    label(r, 'SPEED m/s', x, 32, 27, C.muted);
    label(r, signed(s.v), x, 63, 40, load > 0 ? C.warning : C.ink);
    label(r, 'SAFE <=' + s.rules.safeClawSpeed, x, 106, 23, C.muted);
    r.line(x, 137, x + width, 137, 1, '#446375');
    label(r, 'CLAW / A', x, 148, 27, C.muted);
    label(r, status.en, x, 181, 28, status.color);
    r.line(x, 220, x + width, 220, 1, '#446375');
    label(r, 'CARGO', x, 230, 27, C.muted);
    label(r, number(integrity, 1) + '%', x, 260, 34, integrity < 35 ? C.danger : C.ink);
    bar(r, x, 300, width, integrity / s.rules.damageLimit, integrity < 35 ? C.danger : C.teal);
    label(r, 'LOAD ' + number(load, 1) + '/s', x, 316, 22, load > 0 ? C.warning : C.muted);
    label(r, 'DWELL', x, 351, 27, C.muted);
    label(r, number(s.dwell, 2) + '/' + number(s.rules.dockDwell, 2), x, 381, 29, C.gold);
    bar(r, x, 416, width, s.dwell / s.rules.dockDwell, C.gold);
    const active = s.layout.docks[s.deliveries];
    const inside = active && s.x - s.layout.halfLength >= active.center - active.width / 2 &&
      s.x + s.layout.halfLength <= active.center + active.width / 2;
    const condition = !active ? 'COMPLETE' : !inside ? 'ENTER DOCK' :
      Math.abs(s.v) > s.rules.dockSpeed ? 'TOO FAST' : 'SETTLING';
    label(r, condition, x, 433, 23, s.contact.eligible ? C.gold : C.muted);
    label(r, 'TIME', x, 466, 23, C.muted);
    label(r, clock(s.time), x, 491, 29, C.ink);
  }

  root.GameDef = {
    id: 'frost-brake', title: '冰面刹停', seed: 739,
    tagline: '惯性滑行 · 霜带制动 · 精准交付', accent: C.cyan, background: C.deep,
    levelLabel: '冰道', levelNames: ['晨霜直道', '回程冰湾', '窄岸货线'],
    holdConfirmAsA: true, actionLabels: ['按住冰爪'],
    controls: {
      move: '左右推货橇；松开方向仍会滑行。',
      a: '按住 A / 空格 / Z / 确认：冰爪只在霜带刹车。',
      b: 'B 仅在菜单切换声音；P / START 独立暂停。'
    },
    tip: '整橇入亮区，速度≤0.30持续0.60秒。冰爪安全速度≤5；下方全程图显示全部霜带和停靠区。',
    description: '左右推货橇，松开仍会滑行。按住 A：冰爪只在结霜带刹车。整辆货橇入亮区，速度≤0.30持续0.60秒交付。高速冰爪会伤货，速度≤5可安全刹车。完成三个渐窄停靠区；越出冰面或货损满格失败。局部视野20米，下方总览100米；金线内段表示橇中心可停范围。',
    winTitle: '三站平稳交付', loseTitle: '本次运输结束',
    hud(s) {
      const status = clawStatus(s), integrity = Math.max(0, s.rules.damageLimit - s.damage);
      return [
        { label: '速度 m/s · 安全冰爪≤5', value: (s.v < 0 ? '← ' : s.v > 0 ? '→ ' : '') + number(Math.abs(s.v), 2), tone: s.contact.clawEngaged && Math.abs(s.v) > s.rules.safeClawSpeed ? 'warn' : '' },
        { label: '货物完好', value: number(integrity, 1) + '%', tone: integrity < 35 ? 'warn' : 'good' },
        { label: '交付 · 整橇停稳0.60秒', value: s.deliveries + ' / 3', tone: s.deliveries === 3 ? 'good' : '' },
        { label: '冰爪 · 仅霜带有效', value: status.zh, tone: s.contact.clawEngaged ? 'good' : s.contact.clawRequested || !s.controlsReady ? 'warn' : '' }
      ];
    },
    result(s) {
      const integrity = Math.max(0, s.rules.damageLimit - s.damage);
      if (s.phase === 'won') return '三个停靠区全部交付，货物完好 ' + number(integrity, 1) + '%，用时 ' + number(s.time, 1) + ' 秒。可选择另一条冰道或再次出发。';
      return (s.failure === 'edge' ? '货橇越出冰面边缘。' : '高速冰爪载荷使货损达到上限。') +
        ' 已交付 ' + s.deliveries + '/3。调整推力和制动，再试一次。';
    },
    atlas,
    render(r, s) {
      // Presentation uses current public model fields only. No state mutation,
      // host input prediction, QA storage, trace parsing, or private route data.
      r.rect(0, 0, 960, 540, C.deep);
      label(r, 'LOCAL 20m', 24, 21, 28, C.cyan);
      label(r, 'DOCK ' + Math.min(s.deliveries + 1, 3) + '/3', 24, 58, 35, C.ink);
      const next = s.layout.docks[s.deliveries + 1];
      label(r, next ? 'NEXT ' + (s.deliveries + 2) + (next.center < s.x ? '  <' : '  >') :
        s.deliveries === 3 ? 'COMPLETE' : 'FINAL DOCK', 380, 62, 27, C.muted);
      const camera = drawMain(r, s);
      drawOverview(r, s, camera);
      drawRail(r, s);
      label(r, 'FROST', 24, 514, 20, C.cyan);
      label(r, 'DOCK / CENTER', 154, 514, 20, C.gold);
      label(r, 'STOP <=0.30 m/s', 430, 514, 20, C.muted);
    }
  };
})(window);
