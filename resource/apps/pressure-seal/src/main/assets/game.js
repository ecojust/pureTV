/* Pressure Seal: owned baked machinery, one shared atlas and one render batch. */
(function (root) {
  'use strict';

  const config = root.PureModel.config;
  const C = Object.freeze({
    background: '#08131b', panel: '#102632', recess: '#091b25', line: '#345362',
    white: '#edf6f6', muted: '#b4c8cf', steel: '#718b98', teal: '#67d9c4',
    amber: '#ffc16d', copper: '#d69c61', red: '#ff7c72', blue: '#8bdcf3'
  });
  const chinese = Object.freeze({ tin: '金属膜', fiber: '纤维层', foil: '薄封膜' });
  const scenarioChinese = Object.freeze(['起步', '换压', '高压']);

  function rounded(c, x, y, w, h, r, fill, stroke, width) {
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width || 1; c.stroke(); }
  }
  function ring(c, x, y, radius, width, color, start, end) {
    c.beginPath(); c.arc(x, y, radius, start == null ? 0 : start, end == null ? Math.PI * 2 : end);
    c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  function hexBolt(c, x, y, art) {
    const points = [];
    for (let n = 0; n < 6; n++) points.push([x + Math.cos(n * Math.PI / 3) * 10, y + Math.sin(n * Math.PI / 3) * 10]);
    art.path(c, points, art.linear(c, x - 5, y - 9, x + 6, y + 10, [[0, '#e2edf0'], [1, '#5a7584']]), '#203744', 2);
    art.ellipse(c, x, y, 4, 4, '#334d5b');
    c.strokeStyle = '#a4bdc8'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 3, y + 2); c.lineTo(x + 3, y - 2); c.stroke();
  }

  const atlas = {
    builtins: [],
    tiles: [
      { name: 'chamber', x: 0, y: 0, w: 512, h: 432, paint: function (c, w, h, a) {
        a.ellipse(c, 255, 402, 219, 21, a.radial(c, 255, 402, 219, [[0, 'rgba(0,0,0,.7)'], [1, 'transparent']]));
        a.path(c, [[105, 326], [158, 326], [148, 388], [88, 388]], a.linear(c, 100, 325, 148, 389, [[0, '#8b9fa8'], [1, '#263f4c']]), '#152d3b', 3);
        a.path(c, [[349, 326], [402, 326], [421, 388], [359, 388]], a.linear(c, 350, 325, 410, 389, [[0, '#8b9fa8'], [1, '#263f4c']]), '#152d3b', 3);
        rounded(c, 82, 384, 80, 15, 4, '#142b37', '#597382', 2);
        rounded(c, 350, 384, 80, 15, 4, '#142b37', '#597382', 2);
        rounded(c, 94, 35, 327, 327, 31, a.linear(c, 95, 35, 394, 372, [[0, '#8ca5ae'], [.2, '#455f70'], [1, '#162e3d']]), '#1c3643', 4);
        a.ellipse(c, 260, 215, 177, 177, '#071823');
        a.ellipse(c, 250, 202, 174, 174, a.linear(c, 118, 56, 388, 360, [[0, '#e0e9e8'], [.16, '#a3b7bd'], [.42, '#566f7e'], [.65, '#849ca7'], [1, '#294655']]));
        ring(c, 250, 202, 169, 3, '#d5e2e4', Math.PI * 1.04, Math.PI * 1.87);
        ring(c, 250, 202, 150, 9, '#142a37');
        ring(c, 250, 202, 142, 9, a.linear(c, 138, 80, 355, 327, [[0, '#d9e5e6'], [.4, '#829ba7'], [1, '#304f61']]));
        ring(c, 250, 202, 132, 12, '#091923');
        ring(c, 250, 202, 126, 3, '#75949e');
        a.ellipse(c, 250, 202, 121, 121, a.radial(c, 250, 202, 124, [[0, '#254b58'], [.6, '#15333e'], [1, '#081d2a']], 205, 142));
        a.ellipse(c, 250, 271, 85, 18, '#061723');
        c.save(); c.beginPath(); c.arc(250, 202, 119, 0, Math.PI * 2); c.clip();
        a.path(c, [[138, 111], [194, 84], [339, 314], [312, 333]], 'rgba(181,227,233,.055)');
        a.path(c, [[201, 82], [215, 79], [353, 304], [345, 315]], 'rgba(219,246,248,.06)');
        c.restore();
        ring(c, 250, 202, 117, 2, 'rgba(184,226,230,.42)', Math.PI * 1.05, Math.PI * 1.73);
        for (let i = 0; i < 8; i++) {
          const angle = Math.PI / 8 + i * Math.PI / 4;
          hexBolt(c, 250 + Math.cos(angle) * 158, 202 + Math.sin(angle) * 158, a);
        }
        for (const y of [135, 250]) {
          rounded(c, 61, y + 3, 55, 42, 8, '#132c39', '#57717f', 2);
          rounded(c, 65, y, 48, 31, 6, a.linear(c, 65, y, 100, y + 31, [[0, '#d1dfe1'], [.4, '#839da9'], [1, '#3d5d6e']]), '#b4c8cd', 1.5);
          rounded(c, 78, y + 4, 12, 25, 3, '#294957', '#b4c8cd', 1);
        }
        rounded(c, 391, 128, 42, 138, 12, a.linear(c, 391, 128, 430, 128, [[0, '#304c5d'], [.5, '#b4c8ce'], [1, '#486777']]), '#152e3d', 3);
        rounded(c, 402, 145, 20, 104, 6, '#122a37', '#7994a1', 2);
        rounded(c, 407, 153, 10, 88, 3, a.linear(c, 407, 153, 417, 153, [[0, '#658c9b'], [.5, '#b7d9df'], [1, '#315a6d']]));
        c.strokeStyle = '#b9ced2'; c.lineWidth = 2;
        for (let y = 163; y < 241; y += 14) { c.beginPath(); c.moveTo(409, y); c.lineTo(416, y); c.stroke(); }
        rounded(c, 198, 358, 108, 22, 5, '#182f3a', '#778f9a', 1.5);
        for (let x = 214; x <= 290; x += 19) rounded(c, x, 365, 10, 7, 2, '#bbd2d5');
      } },
      { name: 'heater', x: 512, y: 0, w: 160, h: 160, paint: function (c, w, h, a) {
        a.ellipse(c, 83, 145, 60, 10, 'rgba(0,0,0,.38)');
        rounded(c, 38, 17, 75, 126, 11, a.linear(c, 38, 20, 112, 20, [[0, '#6a4937'], [.28, '#e2b377'], [.56, '#b9814d'], [1, '#533627']]), '#332b29', 3);
        rounded(c, 50, 9, 51, 15, 5, '#b5c4c6', '#354a52', 2);
        rounded(c, 50, 135, 51, 15, 5, '#829b9f', '#354a52', 2);
        for (let y = 30; y < 131; y += 14) {
          rounded(c, 25, y, 100, 9, 3, a.linear(c, 25, y, 125, y, [[0, '#684731'], [.25, '#f0c386'], [.6, '#c28d52'], [1, '#674229']]), '#664832', 1);
          c.fillStyle = '#edc38c'; c.fillRect(35, y + 1, 76, 1);
        }
        a.path(c, [[110, 68], [144, 68], [144, 84], [110, 84]], '#8da3aa', '#344d59', 2);
        rounded(c, 132, 61, 14, 30, 3, '#b7c8cd', '#324b57', 2);
      } },
      { name: 'valve', x: 672, y: 0, w: 160, h: 160, paint: function (c, w, h, a) {
        a.ellipse(c, 80, 140, 58, 10, 'rgba(0,0,0,.38)');
        rounded(c, 18, 79, 113, 26, 7, a.linear(c, 18, 79, 18, 105, [[0, '#d5e6e9'], [.4, '#7e9ba8'], [1, '#304e61']]), '#253e4b', 2);
        rounded(c, 51, 64, 55, 56, 10, a.linear(c, 51, 65, 105, 116, [[0, '#b6cdd5'], [.5, '#63889c'], [1, '#223f55']]), '#1b3548', 3);
        rounded(c, 72, 27, 13, 43, 4, '#a8bec7', '#264658', 2);
        ring(c, 79, 34, 26, 8, '#7fc1cc');
        ring(c, 79, 34, 25, 2, '#d6f5f2', Math.PI, Math.PI * 2);
        for (let i = 0; i < 4; i++) {
          const angle = i * Math.PI / 2;
          c.beginPath(); c.moveTo(79, 34); c.lineTo(79 + Math.cos(angle) * 24, 34 + Math.sin(angle) * 24);
          c.strokeStyle = '#86b8c2'; c.lineWidth = 6; c.stroke();
        }
        a.ellipse(c, 79, 34, 7, 7, '#d0e3e5');
        for (const x of [23, 119]) rounded(c, x, 72, 12, 40, 3, '#b6cbd1', '#375667', 2);
        a.ellipse(c, 137, 92, 8, 15, '#365b6d');
        a.ellipse(c, 140, 92, 5, 10, '#0d2e43');
      } },
      { name: 'tin', x: 832, y: 0, w: 160, h: 160, paint: function (c, w, h, a) {
        a.ellipse(c, 81, 143, 54, 10, 'rgba(0,0,0,.45)');
        rounded(c, 35, 32, 91, 104, 15, a.linear(c, 35, 32, 126, 32, [[0, '#607c88'], [.18, '#c5d6d8'], [.47, '#e1e8e4'], [.72, '#91aab3'], [1, '#36576b']]), '#304f61', 2);
        a.ellipse(c, 80, 33, 46, 17, a.linear(c, 50, 18, 105, 47, [[0, '#edcf8d'], [.48, '#b78b48'], [1, '#6f532e']]));
        a.ellipse(c, 80, 32, 36, 11, '#5c6f70');
        a.ellipse(c, 80, 30, 34, 9, a.linear(c, 48, 22, 109, 37, [[0, '#d8e1de'], [1, '#8bafb8']]));
        ring(c, 80, 30, 5, 2, '#667e84');
        c.strokeStyle = '#e8eee7'; c.lineWidth = 2; c.beginPath(); c.moveTo(46, 52); c.lineTo(46, 115); c.stroke();
        for (const y of [51, 118, 128]) {
          c.beginPath(); c.ellipse(80, y, 43, 9, 0, 0, Math.PI); c.strokeStyle = y === 128 ? '#b58c4f' : '#6d8a95'; c.lineWidth = 3; c.stroke();
        }
        rounded(c, 54, 69, 52, 30, 5, '#254a57', '#6f919b', 2);
        a.path(c, [[67, 84], [76, 75], [85, 84], [76, 93]], '#c4a96e');
        c.fillStyle = '#a7c8c9'; c.fillRect(90, 76, 7, 16);
      } },
      { name: 'heatStrip', x: 512, y: 176, w: 160, h: 64, paint: function (c, w, h, a) {
        rounded(c, 5, 14, 150, 35, 17, a.linear(c, 0, 14, 0, 49, [[0, 'rgba(255,183,87,0)'], [.4, 'rgba(255,183,87,.5)'], [.5, '#ffe1a2'], [.6, 'rgba(255,183,87,.5)'], [1, 'rgba(255,183,87,0)']]));
      } },
      { name: 'exhaust', x: 832, y: 176, w: 160, h: 64, paint: function (c, w, h, a) {
        for (let i = 0; i < 3; i++) {
          const y = 20 + i * 12;
          a.path(c, [[7, y], [122 - i * 12, y - 3], [153 - i * 7, y + 2], [24, y + 5]], a.linear(c, 7, y, 153, y, [[0, 'rgba(171,230,245,.75)'], [1, 'rgba(171,230,245,0)']]));
        }
      } },
      { name: 'sealMark', x: 848, y: 304, w: 176, h: 128, paint: function (c, w, h, a) {
        a.ellipse(c, 88, 64, 48, 48, '#1a5a51'); ring(c, 88, 64, 45, 4, '#81e1c7');
        c.beginPath(); c.moveTo(64, 64); c.lineTo(81, 82); c.lineTo(114, 47);
        c.strokeStyle = '#c7f4dd'; c.lineWidth = 10; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
      } },
      { name: 'bench', x: 0, y: 800, w: 512, h: 192, paint: function (c, w, h, a) {
        c.fillStyle = a.linear(c, 0, 0, 0, 192, [[0, '#122d39'], [.62, '#0a1b26'], [1, '#102936']]); c.fillRect(0, 0, w, h);
        for (let x = 9; x < 510; x += 83) rounded(c, x, 8, 73, 133, 4, '#102632', '#1a3542', 1);
        c.fillStyle = '#233d49'; c.fillRect(0, 146, 512, 2);
        a.path(c, [[0, 192], [83, 149], [89, 149], [18, 192]], '#1c3541');
        a.path(c, [[346, 192], [303, 149], [308, 149], [362, 192]], '#1c3541');
      } },
      { name: 'fiber', x: 512, y: 800, w: 160, h: 160, paint: function (c, w, h, a) {
        a.ellipse(c, 81, 145, 58, 9, 'rgba(0,0,0,.45)');
        a.path(c, [[35, 29], [116, 24], [131, 42], [127, 133], [37, 138], [27, 120], [29, 45]], a.linear(c, 30, 30, 130, 138, [[0, '#e3cda3'], [.4, '#bfa577'], [1, '#7b694e']]), '#5c5040', 3);
        a.path(c, [[35, 29], [116, 24], [127, 42], [41, 49], [29, 45]], '#f0dab0', '#9a8058', 2);
        a.path(c, [[115, 45], [127, 42], [127, 133], [116, 125]], '#8c7654');
        rounded(c, 41, 58, 70, 60, 8, '#c5ad83', '#907b56', 2);
        for (let y = 63; y < 116; y += 7) {
          c.beginPath(); c.moveTo(45, y); c.lineTo(108, y - 3); c.strokeStyle = y % 2 ? '#b59a6f' : '#ddc69c'; c.lineWidth = 1; c.stroke();
        }
        c.strokeStyle = '#ede0bd'; c.lineWidth = 3; c.beginPath(); c.moveTo(37, 56); c.lineTo(36, 123); c.lineTo(118, 128); c.stroke();
        rounded(c, 59, 73, 35, 32, 5, '#477b70', '#a8c6aa', 1.5);
        a.path(c, [[69, 90], [78, 79], [87, 90], [78, 99]], '#c8ddb1');
      } },
      { name: 'foil', x: 672, y: 800, w: 160, h: 160, paint: function (c, w, h, a) {
        a.ellipse(c, 81, 146, 61, 9, 'rgba(0,0,0,.45)');
        a.path(c, [[38, 22], [123, 22], [119, 45], [135, 126], [121, 142], [37, 142], [25, 128], [43, 45]], a.linear(c, 25, 45, 134, 120, [[0, '#5a859a'], [.22, '#e0eff0'], [.46, '#8bb0c0'], [.65, '#c7dfe7'], [1, '#365e7a']]), '#34566b', 3);
        a.path(c, [[43, 45], [80, 67], [119, 45], [112, 120], [82, 130], [45, 121]], a.linear(c, 45, 48, 113, 124, [[0, '#bbdce3'], [.42, '#eff7f5'], [.65, '#80aabd'], [1, '#b6d7df']]), '#749caa', 1.5);
        a.path(c, [[38, 22], [123, 22], [120, 39], [40, 39]], '#a5bec9', '#e3efee', 2);
        for (let x = 44; x < 120; x += 7) {
          c.beginPath(); c.moveTo(x, 24); c.lineTo(x - 2, 37); c.strokeStyle = '#4b748b'; c.lineWidth = 2; c.stroke();
        }
        for (let x = 42; x < 122; x += 7) {
          c.beginPath(); c.moveTo(x, 133); c.lineTo(x, 140); c.strokeStyle = '#d2e8e9'; c.lineWidth = 2; c.stroke();
        }
        a.path(c, [[52, 78], [108, 78], [110, 110], [49, 110]], '#235c74', '#88c4d2', 2);
        a.path(c, [[64, 95], [80, 84], [97, 95], [80, 104]], '#a9d5de');
        c.strokeStyle = '#edf6f4'; c.lineWidth = 2; c.beginPath(); c.moveTo(46, 51); c.lineTo(36, 122); c.stroke();
      } }
    ]
  };

  function clamp01(value) { return Math.max(0, Math.min(1, value)); }
  function stageView(state) {
    const scenario = config.scenarios[state.level];
    const index = Math.min(state.materialIndex, scenario.stages.length - 1);
    const stage = scenario.stages[index];
    const material = config.materials[stage.material];
    const receipt = state.phase === 'won' ? state.seals[state.seals.length - 1] : null;
    return { scenario: scenario, index: index, stage: stage, material: material, receipt: receipt };
  }
  function text(r, value, x, y, size, color, maxWidth) {
    if (maxWidth != null && r.measureText(value, size) > maxWidth) throw new Error('Pressure Seal text budget: ' + value);
    r.text(value, x, y, size, color || C.white);
  }
  function frame(r, x, y, w, h, color, fill, thickness) {
    const t = thickness || 2;
    r.rect(x, y, w, h, color); r.rect(x + t, y + t, w - t * 2, h - t * 2, fill || C.panel);
  }
  function check(r, x, y, color) {
    r.line(x - 8, y, x - 1, y + 7, 4, color); r.line(x - 1, y + 7, x + 12, y - 9, 4, color);
  }
  function bar(r, x, y, w, value, color) {
    r.rect(x, y, w, 14, C.recess); r.rect(x, y, w, 2, C.line);
    if (value > 0) r.rect(x, y + 3, Math.max(2, w * clamp01(value)), 10, color);
  }
  function doseText(value) { return value > 0 && value < 0.1 ? '<0.1' : value.toFixed(1); }
  function releaseTrend(state) {
    const cooled = state.heat + (0 - state.heat) / 60;
    const rate = 0.15 * cooled - 5;
    if (rate === 0 || (state.pressure === 0 && rate < 0)) return 'FLAT';
    return rate > 0 ? 'RISE' : 'FALL';
  }
  function render(r, state) {
    const view = stageView(state), stage = view.stage, material = view.material;
    const dose = view.receipt ? view.receipt.dose : state.dose;
    const hold = view.receipt ? view.receipt.holdTicks : state.holdTicks;
    const required = stage.holdTicks * config.tickSeconds;
    const holdSeconds = hold * config.tickSeconds;
    const hot = state.heat > material.safeHeat;
    const damaged = dose / material.doseBudget;
    r.sprite('bench', 480, 270, 960, 540);
    r.rect(454, 119, 484, 351, '#071923');
    frame(r, 463, 120, 473, 350, '#2c4958', '#102632', 2);
    for (let i = 0; i < view.scenario.stages.length; i++) {
      const card = view.scenario.stages[i], mat = config.materials[card.material];
      const sealed = i < state.seals.length, current = i === state.materialIndex;
      const x = 24 + i * 312;
      frame(r, x, 22, 288, 82, current ? C.teal : sealed ? '#47746b' : C.line, current ? '#17383f' : '#102632', current ? 3 : 2);
      text(r, String(i + 1) + ' ' + mat.name, x + 15, 34, 30, sealed ? '#b6d7cd' : C.white, 224);
      if (sealed) check(r, x + 259, 51, C.teal);
      else if (current) { r.line(x + 250, 43, x + 260, 51, 4, C.teal); r.line(x + 260, 51, x + 250, 59, 4, C.teal); }
      text(r, card.low + '-' + card.high + ' kPa | ' + (card.holdTicks * config.tickSeconds).toFixed(1) + 's', x + 15, 72, 24, C.muted, 258);
    }
    r.sprite('chamber', 233, 291, 430, 363);
    r.sprite(stage.material, 228, 285, 132, 132);
    r.sprite('heater', 68, 315, 98, 133);
    r.sprite('heatStrip', 64, 316, 96, 43, Math.PI / 2, [1, 1, 1, clamp01(state.heat / 100)]);
    r.sprite('valve', 382, 339, 112, 112);
    if (state.lastAction.b) r.sprite('exhaust', 433, 351, 38, 31, 0, [1, 1, 1, 0.8]);
    if (state.phase === 'won') r.sprite('sealMark', 231, 289, 119, 87);
    r.rect(129, 418, 207, 39, '#071923');
    text(r, state.phase === 'won' ? 'ALL SEALED' : material.name + ' SEAL', 144, 427, 26, state.phase === 'won' ? C.teal : C.white, 181);
    text(r, 'P ' + state.pressure.toFixed(1) + ' kPa', 484, 137, 40, state.reason === 'burst' ? C.red : C.white, 345);
    text(r, state.lastAction.a && state.lastAction.b ? 'A+B' : state.lastAction.a ? 'A' : state.lastAction.b ? 'B' : 'OFF', 862, 148, 24, state.lastAction.b ? C.blue : state.lastAction.a ? C.amber : C.muted, 65);
    text(r, 'TARGET ' + stage.low + '-' + stage.high, 484, 188, 24, C.teal, 225);
    text(r, 'BURST ' + config.burstPressure, 755, 188, 24, C.red, 170);
    const px = 486, py = 226, pw = 426;
    r.rect(px, py, pw, 29, '#071923');
    r.rect(px, py + 12, pw, 5, '#35515e');
    const lowX = px + pw * stage.low / config.burstPressure;
    const highX = px + pw * stage.high / config.burstPressure;
    r.rect(lowX, py + 3, highX - lowX, 23, '#285e57');
    r.line(lowX, py, lowX, py + 29, 3, C.teal); r.line(highX, py, highX, py + 29, 3, C.teal);
    r.line(lowX, py, highX, py, 3, C.teal); r.line(lowX, py + 29, highX, py + 29, 3, C.teal);
    r.line(px + pw, py - 3, px + pw, py + 33, 4, C.red);
    const pressureX = px + pw * clamp01(state.pressure / config.burstPressure);
    r.rect(pressureX - 6, py - 5, 12, 39, '#081822');
    r.rect(pressureX - 3, py - 4, 6, 37, C.white);
    text(r, 'HOLD ' + holdSeconds.toFixed(1) + ' / ' + required.toFixed(1) + 's', 484, 283, 30, state.phase === 'won' ? C.teal : C.white, 440);
    bar(r, 486, 322, 426, hold / stage.holdTicks, C.teal);
    text(r, 'HEAT ' + state.heat.toFixed(1), 484, 352, 26, hot ? C.amber : C.white, 238);
    text(r, 'SAFE ' + material.safeHeat, 780, 352, 24, C.amber, 146);
    bar(r, 486, 388, 426, state.heat / 100, hot ? C.amber : C.copper);
    const safeX = 486 + 426 * material.safeHeat / 100;
    r.line(safeX, 384, safeX, 405, 3, C.white);
    text(r, 'DOSE ' + doseText(dose) + ' / ' + material.doseBudget, 484, 421, 26, state.reason === 'overheat' ? C.red : C.white, 359);
    text(r, 'H*s', 865, 423, 24, C.muted, 61);
    bar(r, 486, 454, 426, damaged, damaged >= 0.8 ? C.red : C.copper);
    const actionY = 483;
    frame(r, 24, actionY, 198, 40, state.lastAction.a ? C.amber : C.line, state.lastAction.a ? '#59422a' : '#102632', 2);
    text(r, 'A HEAT', 42, actionY + 9, 27, state.lastAction.a ? '#fff0d2' : C.muted, 132);
    r.circle(201, actionY + 20, 5, state.lastAction.a ? C.amber : '#36505c');
    frame(r, 240, actionY, 198, 40, state.lastAction.b ? C.blue : C.line, state.lastAction.b ? '#204355' : '#102632', 2);
    text(r, 'B VENT', 258, actionY + 9, 27, state.lastAction.b ? '#d6f5ff' : C.muted, 132);
    r.circle(417, actionY + 20, 5, state.lastAction.b ? C.blue : '#36505c');
    const release = releaseTrend(state);
    const footer = state.phase === 'won' ? '3 / 3 SEALED' : state.phase === 'lost' ? (state.reason === 'burst' ? 'BURST' : 'OVERHEAT') : 'RELEASE ' + release;
    text(r, footer, 484, 492, 27, state.phase === 'lost' ? C.red : state.phase === 'won' ? C.teal : release === 'RISE' ? C.amber : C.blue, 440);
  }

  root.GameDef = {
    id: 'pressure-seal', title: '压力封装', seed: config.defaultSeed,
    accent: C.teal, background: C.background, atlas: atlas,
    levelLabel: '工单', levelNames: config.scenarios.map(function (item) { return item.name; }),
    holdConfirmAsA: true, actionLabels: ['HEAT + PUMP / 按住加热加压', 'VENT / 按住泄压'],
    tagline: '余热仍在，密封未定',
    description: '依次封好三种材料：按住 A 加热加压，提前松手让余热继续升压；B 泄压。压力须连续留在目标区，出界保持归零。' + config.burstPressure + ' kPa 爆裂，热损满额失败。A+B 同按仍会加热，高热时仍可能升压。',
    controls: {
      move: '左右 / 摇杆：菜单选择工单；封装时无需方向操作',
      a: '按住空格、Z、确认键 / 手机右上半区：加热加压',
      b: '按住 B、X / 手机右下半区：泄压'
    },
    tip: 'RELEASE 提示松手后的下一步升降。HEAT 是余热，DOSE 是累计热损；A+B 同按仍加热，高热时仍可能升压。',
    winTitle: '三道密封 · 全部合格', loseTitle: '封装中止',
    hud: function (state) {
      const view = stageView(state);
      return [
        { label: '工单 · ' + scenarioChinese[state.level], value: state.phase === 'won' ? '3 / 3 合格' : (state.materialIndex + 1) + '/3 ' + chinese[view.stage.material], tone: state.phase === 'won' ? 'good' : '' },
        { label: '容器压力 · kPa', value: state.pressure.toFixed(1), tone: state.pressure >= config.burstPressure * 0.9 ? 'warn' : '' },
        { label: '储存余热 · HEAT', value: state.heat.toFixed(1), tone: state.heat > view.material.safeHeat ? 'warn' : '' },
        { label: '封装用时', value: (state.tick * config.tickSeconds).toFixed(1) + ' s' }
      ];
    },
    result: function (state) {
      if (state.phase === 'won') {
        return '三道密封全部合格。' + state.seals.map(function (receipt) {
          const mat = config.materials[receipt.material];
          return mat.name + ' ' + (receipt.holdTicks * config.tickSeconds).toFixed(1) + 's，热损 ' + doseText(receipt.dose) + '/' + mat.doseBudget;
        }).join('；') + '。';
      }
      const view = stageView(state);
      return (state.reason === 'burst' ? 'BURST：压力达到爆裂线。' : 'OVERHEAT：当前材料热损达到限额。') +
        '已合格 ' + state.seals.length + '/3。终值 ' + state.pressure.toFixed(1) + ' kPa，余热 ' + state.heat.toFixed(1) +
        '，热损 ' + doseText(state.dose) + '/' + view.material.doseBudget + '。重试从冷机重新开始。';
    },
    render: render
  };
})(window);
