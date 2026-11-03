(function (root) {
  'use strict';
  // The atlas contains only original, synchronous geometric artwork.
  // All physical geometry and judging indicators are drawn from public state.
  var C = { background: '#eee9dc', ink: '#203f3e', muted: '#637a73', teal: '#167c79',
    mint: '#d1eee5', amber: '#cf8423', ray: '#e7a33d', good: '#18765d', bad: '#ae563d',
    pearl: '#fffdf3', line: '#a7bcb2' };
  function round(c, x, y, w, h, radius, fill, stroke, weight) {
    c.beginPath(); c.moveTo(x + radius, y); c.lineTo(x + w - radius, y);
    c.quadraticCurveTo(x + w, y, x + w, y + radius); c.lineTo(x + w, y + h - radius);
    c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); c.lineTo(x + radius, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - radius); c.lineTo(x, y + radius);
    c.quadraticCurveTo(x, y, x + radius, y); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = weight || 1; c.stroke(); }
  }
  function screw(c, x, y, radius, art) {
    art.ellipse(c, x, y + 1, radius + 1, radius + 1, '#1a4c4930');
    art.ellipse(c, x, y, radius, radius, art.linear(c, x, y - radius, x, y + radius,
      [[0, '#ffffff'], [.4, '#e3e9df'], [1, '#7c9a8f']]));
    c.strokeStyle = '#718d82'; c.lineWidth = 1; c.beginPath();
    c.moveTo(x - radius * .6, y + radius * .4); c.lineTo(x + radius * .6, y - radius * .4); c.stroke();
  }
  function plateTile(name, column, draw) { return { name: name, x: column * 64, y: 384, w: 64, h: 64,
    paint: function (c, w, h, art) { c.fillStyle = '#ffffff'; c.strokeStyle = '#ffffff'; draw(c, art); } }; }
  var atlas = { builtins: [], tiles: [
    { name: 'lab', x: 0, y: 0, w: 640, h: 384, paint: function (c, w, h, art) {
      c.save(); c.scale(w / 960, h / 540);
      c.fillStyle = art.linear(c, 0, 0, 960, 540, [[0, '#fcfaf0'], [.46, '#f2efe4'], [1, '#dddcca']]);
      c.fillRect(0, 0, 960, 540);
      c.strokeStyle = '#c8cec225'; c.lineWidth = 1;
      for (var x = 30; x < 960; x += 70) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 540); c.stroke(); }
      round(c, 14, 12, 932, 46, 14, '#fffef8', '#cbd5c9');
      round(c, 18, 72, 620, 332, 18, art.linear(c, 0, 72, 0, 404,
        [[0, '#fdfef5'], [.58, '#eaf1e6'], [.7, '#e4e9dc'], [.71, '#d0d8ca'], [1, '#e9e8d9']]), '#b4c7ba');
      c.save(); round(c, 20, 74, 616, 328, 16, null, null); c.clip();
      c.fillStyle = '#ffffff66'; c.beginPath(); c.moveTo(20, 75); c.lineTo(328, 75); c.lineTo(120, 280); c.lineTo(20, 280); c.closePath(); c.fill();
      c.strokeStyle = '#72999012'; c.lineWidth = 1;
      for (var gx = 40; gx < 638; gx += 28) { c.beginPath(); c.moveTo(gx, 116); c.lineTo(gx, 292); c.stroke(); }
      for (var gy = 116; gy < 292; gy += 28) { c.beginPath(); c.moveTo(36, gy); c.lineTo(620, gy); c.stroke(); }
      c.restore();
      // Rail highlights and calibrated ticks are decor; numerical world marks are dynamic.
      round(c, 44, 311, 568, 24, 5, '#1c5551', '#355e56');
      round(c, 44, 307, 568, 16, 5, art.linear(c, 0, 307, 0, 323,
        [[0, '#add2bf'], [.24, '#d4e5cd'], [.3, '#4a9990'], [.65, '#276f68'], [1, '#15514d']]), '#2c655b');
      c.fillStyle = '#d2e7ce'; c.fillRect(55, 310, 546, 2);
      c.fillStyle = '#133f3c'; c.fillRect(55, 320, 546, 2);
      [67, 589].forEach(function (xx) {
        round(c, xx - 16, 333, 32, 12, 4, '#9aaea0', '#6f8f80');
        round(c, xx - 11, 344, 22, 4, 2, '#42665c');
      });
      [[29, 84], [626, 84], [29, 392], [626, 392]].forEach(function (p) { screw(c, p[0], p[1], 3, art); });
      round(c, 652, 72, 294, 426, 18, art.linear(c, 652, 72, 946, 498,
        [[0, '#fcfdf5'], [1, '#e8eddf']]), '#b4c7ba');
      round(c, 18, 416, 620, 82, 14, '#fafbf1', '#b4c7ba');
      c.fillStyle = '#b6c5b7'; c.fillRect(18, 508, 928, 1);
      c.restore();
    } },
    { name: 'glassLens', x: 640, y: 0, w: 96, h: 232, paint: function (c, w, h, art) {
      // Symmetric biconvex glass: smooth silhouette with low polygon internal facets.
      c.beginPath(); c.moveTo(48, 13); c.bezierCurveTo(13, 46, 13, 158, 48, 191);
      c.bezierCurveTo(83, 158, 83, 46, 48, 13); c.closePath();
      c.fillStyle = art.linear(c, 15, 30, 81, 172, [[0, '#e4fffa99'], [.22, '#b4e9e9bb'],
        [.42, '#f3fff2bb'], [.61, '#60aaa88c'], [.83, '#b5e8d5c9'], [1, '#338f8bb0']]); c.fill();
      c.strokeStyle = '#538f84'; c.lineWidth = 2; c.stroke();
      art.path(c, [[48, 17], [25, 85], [45, 66], [65, 96]], '#ffffff46');
      art.path(c, [[25, 85], [27, 145], [48, 186], [45, 66]], '#c3f5e32e');
      art.path(c, [[65, 96], [48, 186], [70, 141]], '#51a4a444');
      c.strokeStyle = '#fffff1c9'; c.lineWidth = 3; c.beginPath(); c.moveTo(43, 28);
      c.bezierCurveTo(23, 62, 24, 126, 35, 153); c.stroke();
      c.strokeStyle = '#2e787759'; c.lineWidth = 1; c.beginPath(); c.moveTo(48, 19); c.lineTo(48, 189); c.stroke();
      [13, 191].forEach(function (y) {
        round(c, 36, y - 6, 24, 12, 4, art.linear(c, 36, y, 60, y,
          [[0, '#245f59'], [.45, '#92c7b5'], [1, '#2d6e65']]), '#255e58');
        screw(c, 48, y, 3, art);
      });
      round(c, 43, 198, 10, 31, 3, art.linear(c, 43, 0, 53, 0,
        [[0, '#557e71'], [.45, '#e0eee0'], [1, '#70998b']]));
    } },
    { name: 'carriage', x: 736, y: 0, w: 160, h: 96, paint: function (c, w, h, art) {
      art.ellipse(c, 80, 78, 72, 11, '#194e3c25');
      round(c, 15, 48, 130, 25, 5, art.linear(c, 0, 48, 0, 73,
        [[0, '#426f63'], [.25, '#628f7d'], [.35, '#2e645b'], [1, '#184c47']]), '#17473e');
      art.path(c, [[15, 48], [30, 30], [132, 30], [145, 48]], art.linear(c, 0, 30, 0, 48,
        [[0, '#dce9d7'], [1, '#8da992']]), '#5b8b78', 1.3);
      round(c, 60, 13, 40, 28, 5, art.linear(c, 60, 0, 100, 0,
        [[0, '#6c9d89'], [.4, '#e0ecda'], [.65, '#b4d0bb'], [1, '#487665']]), '#618773');
      [35, 125].forEach(function (x) { screw(c, x, 43, 4, art); });
      round(c, 117, 50, 29, 12, 4, '#183f3b', '#47786b');
      for (var x = 121; x < 144; x += 4) { c.strokeStyle = '#b0caba'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x, 51); c.lineTo(x, 60); c.stroke(); }
      c.fillStyle = '#e4eed9'; c.fillRect(28, 52, 71, 3);
      c.fillStyle = '#719c85'; c.fillRect(28, 57, 71, 2);
    } },
    { name: 'objectStand', x: 736, y: 96, w: 160, h: 128, paint: function (c, w, h, art) {
      art.ellipse(c, 80, 112, 64, 9, '#68533118');
      round(c, 24, 96, 112, 15, 5, '#967640', '#6f623f');
      art.path(c, [[24, 96], [38, 85], [124, 85], [136, 96]], '#d5ba77', '#ae985f', 1);
      round(c, 73, 18, 14, 74, 4, art.linear(c, 73, 0, 87, 0,
        [[0, '#a98543'], [.45, '#fae7ad'], [1, '#be9c56']]));
      round(c, 59, 12, 42, 21, 5, '#d8bd79', '#8c7f50');
      screw(c, 80, 21, 4, art);
      screw(c, 43, 96, 3, art); screw(c, 117, 96, 3, art);
    } },
    { name: 'screenStand', x: 896, y: 0, w: 128, h: 224, paint: function (c, w, h, art) {
      // The physical screen plane is its centerline; wide front view is a separate inset.
      round(c, 48, 12, 32, 172, 5, art.linear(c, 48, 0, 80, 0,
        [[0, '#fcfff2'], [.45, '#e8edda'], [.52, '#b4c2ac'], [1, '#8da68e']]), '#5d8170', 2);
      round(c, 54, 18, 8, 160, 2, '#fffef3', '#dce5d1');
      c.fillStyle = '#c2d4b9'; c.fillRect(70, 24, 3, 148);
      round(c, 58, 185, 12, 36, 3, art.linear(c, 58, 0, 70, 0,
        [[0, '#4f796b'], [.45, '#d4e2ce'], [1, '#769480']]));
      screw(c, 69, 21, 3, art); screw(c, 69, 174, 3, art);
    } },
    plateTile('arrowPlate', 0, function (c, art) {
      art.path(c, [[32, 0], [57, 26], [41, 26], [41, 64], [23, 64], [23, 26], [7, 26]], '#ffffff');
    }),
    plateTile('leafPlate', 1, function (c) {
      c.beginPath(); c.moveTo(32, 0); c.bezierCurveTo(66, 17, 65, 41, 36, 51);
      c.lineTo(36, 64); c.lineTo(28, 64); c.lineTo(28, 51); c.bezierCurveTo(0, 41, 0, 17, 32, 0); c.fill();
      c.globalCompositeOperation = 'destination-out'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(32, 11); c.lineTo(32, 45);
      c.moveTo(32, 29); c.lineTo(18, 20); c.moveTo(32, 38); c.lineTo(45, 28); c.stroke();
    }),
    plateTile('starPlate', 2, function (c, art) {
      var points = [];
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? 13 : 30;
        points.push([32 + Math.cos(a) * radius, 30 + Math.sin(a) * radius]); }
      art.path(c, points, '#ffffff'); c.fillRect(28, 49, 8, 15);
    }),
    plateTile('keyPlate', 3, function (c, art) {
      art.ellipse(c, 32, 19, 19, 19, '#ffffff'); c.fillRect(27, 28, 10, 36);
      c.fillRect(32, 45, 16, 7); c.fillRect(32, 57, 16, 7);
      c.globalCompositeOperation = 'destination-out'; art.ellipse(c, 32, 18, 8, 8, '#ffffff');
    }),
    plateTile('petalPlate', 4, function (c, art) {
      for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        art.ellipse(c, 32 + Math.cos(a) * 17, 27 + Math.sin(a) * 17, 10, 10, '#ffffff'); }
      art.ellipse(c, 32, 27, 12, 12, '#ffffff'); c.fillRect(28, 38, 8, 26);
      art.path(c, [[32, 56], [45, 44], [49, 49], [35, 60]], '#ffffff');
    }),
    plateTile('spirePlate', 5, function (c, art) {
      art.path(c, [[32, 0], [43, 23], [39, 23], [39, 46], [48, 46], [52, 64], [12, 64], [16, 46], [25, 46], [25, 23], [21, 23]], '#ffffff');
      c.globalCompositeOperation = 'destination-out'; c.fillRect(29, 31, 6, 10);
    }),
    { name: 'rayEmblem', x: 736, y: 384, w: 192, h: 64, paint: function (c, w, h, art) {
      c.strokeStyle = '#c68e38'; c.lineWidth = 3;
      [-1, 0, 1].forEach(function (sign) { c.beginPath(); c.moveTo(7, 32 + sign * 23);
        c.lineTo(87, 32 + sign * 23); c.lineTo(149, 32); c.lineTo(185, 32 - sign * 13); c.stroke(); });
      art.ellipse(c, 87, 32, 8, 29, '#acded2d9');
      c.strokeStyle = '#408e82'; c.lineWidth = 2; c.beginPath(); c.ellipse(87, 32, 8, 29, 0, 0, Math.PI * 2); c.stroke();
    } },
    { name: 'iris', x: 0, y: 800, w: 192, h: 192, paint: function (c, w, h, art) {
      art.ellipse(c, 96, 102, 85, 85, '#3a60432b');
      art.ellipse(c, 96, 96, 83, 83, art.linear(c, 22, 10, 163, 177,
        [[0, '#fcfff1'], [.28, '#c2d5bd'], [.48, '#658d78'], [.73, '#b3ccb0'], [1, '#41695b']]));
      art.ellipse(c, 96, 96, 70, 70, '#234d45');
      for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6;
        c.strokeStyle = i % 3 ? '#d8e6cc' : '#f9f8de'; c.lineWidth = i % 3 ? 2 : 3;
        c.beginPath(); c.moveTo(96 + Math.cos(a) * 75, 96 + Math.sin(a) * 75);
        c.lineTo(96 + Math.cos(a) * 80, 96 + Math.sin(a) * 80); c.stroke(); }
      for (var j = 0; j < 6; j++) { c.save(); c.translate(96, 96); c.rotate(j * Math.PI / 3);
        art.path(c, [[-7, -10], [15, -61], [47, -39], [29, 19]],
          art.linear(c, -10, -60, 30, 30, [[0, '#d3e0c7'], [.5, '#7f9e84'], [1, '#3e6556']]), '#315b4e', 1.5);
        c.restore(); }
      art.ellipse(c, 96, 96, 27, 27, '#163f37');
      c.strokeStyle = '#e5e8b5'; c.lineWidth = 3; c.beginPath(); c.arc(96, 96, 27, .2, 2.3); c.stroke();
    } },
    { name: 'controlCard', x: 192, y: 800, w: 320, h: 192, paint: function (c, w, h, art) {
      round(c, 2, 2, w - 4, h - 4, 22, art.linear(c, 0, 0, 0, h,
        [[0, '#fffff7'], [.8, '#f4f5e7'], [1, '#e3e9d5']]), '#c3d1bf', 2);
      c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(24, 7); c.lineTo(w - 24, 7); c.stroke();
    } },
    { name: 'monitor', x: 512, y: 800, w: 256, h: 192, paint: function (c, w, h, art) {
      round(c, 2, 5, 252, 182, 14, art.linear(c, 0, 0, 256, 192,
        [[0, '#d5e0cb'], [.4, '#fcfff2'], [.6, '#92ad94'], [1, '#658c77']]), '#73947d', 2);
      round(c, 11, 14, 234, 164, 9, '#385f4d', '#e3ecd6', 2);
      round(c, 17, 20, 222, 152, 4, art.linear(c, 0, 20, 0, 172,
        [[0, '#f1f3d8'], [.6, '#ffffed'], [1, '#e3e9c9']]), '#193f35');
      [[8, 10], [248, 10], [8, 182], [248, 182]].forEach(function (p) { screw(c, p[0], p[1], 2, art); });
    } }
  ] };

  var RAIL = { left: 52, right: 604, minimum: 0, maximum: 36, axis: 220, top: 144, bottom: 292 };
  function X(world) { return RAIL.left + (world - RAIL.minimum) * (RAIL.right - RAIL.left) / (RAIL.maximum - RAIL.minimum); }
  function Y(world) { return RAIL.axis - world * (RAIL.right - RAIL.left) / (RAIL.maximum - RAIL.minimum); }
  function text(r, value, x, y, size, color, width) {
    if (size < 24) throw new Error('Lens Distance labels must be at least 24 logical pixels');
    if (r.measureText(value, size) > width) throw new Error('Lens Distance label exceeds its reserved width: ' + value);
    r.text(value, x, y, size, color);
  }
  function centered(r, value, x, y, size, color, width) {
    text(r, value, x - r.measureText(value, size) / 2, y, size, color, width);
  }
  function border(r, x, y, w, h, color, thickness) {
    r.rect(x, y, w, thickness, color); r.rect(x, y + h - thickness, w, thickness, color);
    r.rect(x, y, thickness, h, color); r.rect(x + w - thickness, y, thickness, h, color);
  }
  function dashed(r, x1, y1, x2, y2, width, color) {
    var dx = x2 - x1, dy = y2 - y1, length = Math.sqrt(dx * dx + dy * dy);
    if (!(length > 0)) return;
    for (var p = 0; p < length; p += 11) {
      var end = Math.min(p + 5.5, length);
      r.line(x1 + dx * p / length, y1 + dy * p / length,
        x1 + dx * end / length, y1 + dy * end / length, width, color);
    }
  }
  function clip(x1, y1, x2, y2) {
    // Liang-Barsky clipping prevents finite but distant image constructions
    // from entering control cards or the screen inset. No geometry is clamped.
    var dx = x2 - x1, dy = y2 - y1, p = [-dx, dx, -dy, dy];
    var q = [x1 - RAIL.left, RAIL.right - x1, y1 - RAIL.top, RAIL.bottom - y1];
    var low = 0, high = 1;
    for (var i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return null; }
      else { var t = q[i] / p[i]; if (p[i] < 0) low = Math.max(low, t); else high = Math.min(high, t); }
      if (low > high) return null;
    }
    return [x1 + low * dx, y1 + low * dy, x1 + high * dx, y1 + high * dy];
  }
  function ray(r, x1, y1, x2, y2, color, dotted, weight) {
    var line = clip(X(x1), Y(y1), X(x2), Y(y2));
    if (!line) return;
    if (dotted) dashed(r, line[0], line[1], line[2], line[3], weight || 1.5, color);
    else r.line(line[0], line[1], line[2], line[3], weight || 2, color);
  }
  function arrow(r, x, baseline, height, color, thickness) {
    if (Math.abs(height) < 2) return;
    var tip = baseline - height, direction = Math.sign(height), head = Math.min(10, Math.abs(height) * .4);
    r.line(x, baseline, x, tip, thickness, color);
    r.line(x, tip, x - head * .65, tip + direction * head, thickness, color);
    r.line(x, tip, x + head * .65, tip + direction * head, thickness, color);
  }
  function format(value, digits) { return value === null ? '--' : Number(value).toFixed(digits == null ? 1 : digits); }
  function band(r, x, y, w, current, low, high, maximum, passed) {
    r.rect(x, y, w, 9, '#d4ddcc');
    r.rect(x + w * low / maximum, y - 3, Math.max(3, w * (high - low) / maximum), 15, '#98c8a9');
    var mark = Math.max(0, Math.min(1, current / maximum)) * w;
    r.line(x + mark, y - 7, x + mark, y + 17, 3, passed ? C.good : C.bad);
    r.circle(x + mark, y - 7, 3, passed ? C.good : C.bad);
  }

  var model = root.PureModel, config = model.config;
  var plateNames = { 'arrow-plate': 'arrowPlate', 'leaf-plate': 'leafPlate', 'star-plate': 'starPlate',
    'key-plate': 'keyPlate', 'petal-plate': 'petalPlate', 'spire-plate': 'spirePlate' };
  function remaining(state) { return Math.max(0, state.card.adjustmentLimit - state.adjustmentsUsed); }
  function opticalBay(r, state) {
    var o = state.optics, card = state.card, lx = X(state.lensX), sx = X(state.screenX), ox = X(state.objectX);
    text(r, 'THIN LENS  f=4', 40, 82, 24, C.muted, 252);
    var kind = o.imageKind === 'focal' ? 'FOCAL / PARALLEL' : o.imageKind === 'virtual' ? 'VIRTUAL IMAGE' : 'REAL IMAGE';
    text(r, kind, 378, 82, 24, o.imageKind === 'real' ? C.good : C.bad, 250);
    text(r, o.imageKind === 'focal' ? 'NO FINITE IMAGE' : o.imageX < 0 ? 'IMAGE < OUTSIDE RAIL' :
      o.imageX > 36 ? 'IMAGE > OUTSIDE RAIL' : o.imageKind === 'virtual' ? 'DASHES: BACK PROJECTION' : 'SOLID RAYS: CONVERGING',
    40, 111, 24, C.muted, 568);
    dashed(r, RAIL.left, RAIL.axis, RAIL.right, RAIL.axis, 1, '#608e7955');
    [state.lensX - config.focalLength, state.lensX + config.focalLength].forEach(function (position) {
      if (position < 0 || position > 36) return;
      var px = X(position); r.line(px, RAIL.axis - 6, px, RAIL.axis + 6, 2, '#6f9682');
      centered(r, 'F', px, RAIL.axis + 11, 24, '#6f8a73', 22);
    });
    [-state.aperture / 2, 0, state.aperture / 2].forEach(function (h, index) {
      var slope = (h - config.objectHeight) / o.u - h / config.focalLength;
      var color = index === 1 ? '#c68123' : '#dfa13bb8';
      ray(r, state.objectX, config.objectHeight, state.lensX, h, color, false, index === 1 ? 2.5 : 2);
      ray(r, state.lensX, h, 36, h + (36 - state.lensX) * slope, color, false, index === 1 ? 2.5 : 2);
      if (o.imageKind === 'virtual') ray(r, state.lensX, h, 0, h - state.lensX * slope, '#b88f58aa', true, 1.5);
    });
    if (o.imageX !== null && o.imageX >= 0 && o.imageX <= 36) {
      var imageHeight = config.objectHeight * o.magnification;
      ray(r, o.imageX, 0, o.imageX, imageHeight, '#378b7499', true, 2);
      if (Y(imageHeight) >= RAIL.top && Y(imageHeight) <= RAIL.bottom) {
        r.circle(X(o.imageX), Y(imageHeight), 5, C.pearl); r.circle(X(o.imageX), Y(imageHeight), 3, C.teal);
      } else {
        var edgeY = imageHeight > 0 ? RAIL.top + 3 : RAIL.bottom - 3;
        r.line(X(o.imageX) - 5, edgeY, X(o.imageX) + 5, edgeY, 3, C.teal);
      }
    }
    r.sprite('objectStand', ox, 267, 56, 98, 0, '#ffffff');
    var objectHeight = config.objectHeight * (RAIL.right - RAIL.left) / 36;
    r.sprite(plateNames[card.id], ox, RAIL.axis - objectHeight / 2, objectHeight, objectHeight, 0, C.amber);
    r.sprite('glassLens', lx, RAIL.axis + 10.5, 72, 174, 0, '#ffffff');
    // Aperture lips use the same axis and scale as the actual admitted rays.
    var apertureTop = Y(state.aperture / 2), apertureBottom = Y(-state.aperture / 2);
    r.line(lx - 10, apertureTop, lx + 10, apertureTop, 3, '#276b5c');
    r.line(lx - 10, apertureBottom, lx + 10, apertureBottom, 3, '#276b5c');
    r.sprite('screenStand', sx + 2.1, RAIL.axis + 10.875, 44.8, 174, 0, '#ffffff');
    // The bright physical strip is centered on S, independent of the frame bevel.
    r.line(sx, 157, sx, 283, 2, '#fbfff1');
    r.sprite('carriage', lx, 315, 75, 45, 0, '#ffffff');
    r.sprite('carriage', sx, 315, 75, 45, 0, '#ffffff');
    var selectedX = state.selected === 'lens' ? lx : sx;
    r.rect(selectedX - 26, 298, 52, 4, C.teal); r.circle(selectedX, 304, 3, C.pearl);
    [0, 12, 24, 36].forEach(function (position) {
      var px = X(position); r.line(px, 322, px, 330, 1.5, '#3f7360');
      centered(r, String(position), px, 333, 24, C.muted, 42);
    });
    var low = state.selected === 'lens' ? card.lensMin : card.screenMin;
    var high = state.selected === 'lens' ? card.lensMax : card.screenMax;
    r.line(X(low), 366, X(high), 366, 4, '#77ae99');
    r.line(X(low), 359, X(low), 372, 3, C.teal); r.line(X(high), 359, X(high), 372, 3, C.teal);
    r.circle(selectedX, 366, 5, C.teal); r.circle(selectedX, 366, 2, C.pearl);
    text(r, 'O ' + state.objectX + '   u ' + o.u + '   v ' + o.v, 40, 378, 24, C.ink, 310);
    text(r, 'q ' + format(o.imageDistance), 430, 378, 24, C.ink, 190);
  }
  function projection(r, state) {
    var o = state.optics, card = state.card;
    text(r, 'SCREEN VIEW', 676, 84, 24, C.ink, 250);
    r.sprite('monitor', 799, 188, 266, 170, 0, '#ffffff');
    if (o.imageKind !== 'real') {
      // An empty screen icon must not imply converging rays in a virtual/focal setup.
      border(r, 770, 146, 58, 38, '#91a590', 2);
      r.line(799, 184, 799, 193, 2, '#91a590');
      r.line(786, 193, 812, 193, 2, '#91a590');
      centered(r, 'NO REAL IMAGE', 799, 217, 24, C.bad, 238);
      return;
    }
    var middle = (card.brightnessMin + card.brightnessMax) / 2;
    var relative = o.brightness / middle, strength = Math.max(.06, Math.min(1, relative));
    var height = Math.max(18, Math.min(73, config.objectHeight * o.v / o.u * 13));
    var blur = Math.max(0, Math.min(13, o.blur * 5));
    var centerY = 165 + height / 2, name = plateNames[card.id];
    r.line(715, 165, 883, 165, 1, '#90ac8c55');
    if (relative > 1.25) r.rect(686, 124, 225, 126, [1, .91, .62, Math.min(.6, (relative - 1.25) * .18)]);
    if (blur > .6) {
      for (var i = 0; i < 8; i++) { var angle = i * Math.PI / 4;
        r.sprite(name, 799 + Math.cos(angle) * blur, centerY + Math.sin(angle) * blur,
          height, height, Math.PI, [.77, .44, .10, strength * .085]); }
    }
    r.sprite(name, 799, centerY, height, height, Math.PI,
      [.75, .43, .09, strength * Math.max(.16, .88 - o.blur * .32)]);
  }
  function readings(r, state) {
    var o = state.optics, card = state.card;
    text(r, 'BLUR <=1', 676, 278, 24, C.ink, 151);
    text(r, format(o.blur, 2), 831, 278, 24, o.clarityOk ? C.good : C.bad, 101);
    var clarity = o.imageKind !== 'real' ? 'NO REAL IMAGE' : o.clarityOk ? 'PASS  <= 1.00' : 'SOFT  > 1.00';
    text(r, clarity, 676, 306, 24, o.clarityOk ? C.good : C.bad, 256);
    band(r, 679, 338, 240, o.blur, 0, 1, Math.max(3, o.blur), o.clarityOk);
    text(r, 'LIGHT', 676, 368, 24, C.ink, 110);
    text(r, format(o.brightness), 831, 368, 24, o.brightnessOk ? C.good : C.bad, 101);
    var brightness = o.brightnessOk ? 'OK' : o.brightness < card.brightnessMin ? 'DIM' : 'OVER';
    text(r, brightness + '  ' + card.brightnessMin + '-' + card.brightnessMax, 676, 396, 24,
      o.brightnessOk ? C.good : C.bad, 256);
    band(r, 679, 428, 240, o.brightness, card.brightnessMin, card.brightnessMax,
      Math.max(card.brightnessMax * 1.5, o.brightness), o.brightnessOk);
    r.circle(688, 475, 10, o.canExpose ? C.good : '#c6cdbb');
    if (o.canExpose) { r.line(683, 475, 687, 479, 2, C.pearl); r.line(687, 479, 694, 470, 2, C.pearl); }
    text(r, o.canExpose ? 'A  READY' : 'A  EXPOSE', 712, 462, 26, o.canExpose ? C.good : C.ink, 215);
  }
  function controls(r, state) {
    [{ name: 'LENS', id: 'lens', x: 28, value: state.lensX, low: state.card.lensMin, high: state.card.lensMax },
      { name: 'SCREEN', id: 'screen', x: 232, value: state.screenX, low: state.card.screenMin, high: state.card.screenMax }]
      .forEach(function (control) {
        var active = state.selected === control.id;
        r.sprite('controlCard', control.x + 95, 457, 190, 64, 0, '#ffffff');
        if (active) { r.rect(control.x + 2, 427, 186, 60, '#b7dedb44'); border(r, control.x, 425, 190, 64, C.teal, 2); }
        text(r, control.name + ' ' + control.value + (active ? ' >' : ''), control.x + 9, 429, 24,
          active ? C.teal : C.ink, 174);
        text(r, 'RANGE ' + control.low + '-' + control.high, control.x + 9, 459, 24, C.muted, 174);
      });
    r.sprite('iris', 459, 455, 45, 45, 0, '#ffffff');
    text(r, 'IRIS ' + state.aperture + '/6', 489, 427, 24, C.ink, 140);
    for (var i = 1; i <= 6; i++) r.circle(491 + i * 21, 475, i === state.aperture ? 6 : 4,
      i === state.aperture ? C.amber : '#b9c9af');
    text(r, 'L/R SLIDE', 24, 513, 24, C.ink, 208);
    text(r, 'U/D IRIS', 257, 513, 24, C.ink, 190);
    text(r, 'B SELECT', 488, 513, 24, C.ink, 208);
    text(r, 'A EXPOSE', 730, 513, 24, C.ink, 208);
  }
  function render(r, state) {
    r.sprite('lab', 480, 270, 960, 540, 0, '#ffffff');
    text(r, state.card.name, 28, 21, 26, C.ink, 246);
    text(r, 'ENERGY ' + state.energy + '/4', 290, 21, 26, state.energy <= 1 ? C.bad : C.ink, 186);
    text(r, 'ADJ LEFT ' + remaining(state), 503, 21, 26, remaining(state) <= 3 ? C.bad : C.ink, 203);
    text(r, 'CARD ' + (state.cardIndex + 1) + '/2', 753, 21, 26, C.teal, 180);
    opticalBay(r, state); projection(r, state); readings(r, state); controls(r, state);
  }
  root.GameDef = {
    id: 'lens-distance', title: '焦距实验室', seed: config.defaultSeed, accent: '#77c9b6', background: C.background,
    atlas: atlas, holdConfirmAsA: true, levelLabel: '光台',
    levelNames: config.layouts.map(function (layout) { return layout.nameZh; }),
    actionLabels: ['EXPOSE / 曝光验收', 'LENS / SCREEN / 切换'], tagline: '移动透镜与屏幕，让两张底片清晰曝光',
    description: '左右移动当前透镜或屏幕，B 切换；上下调光阑。实像、清晰度和亮度都合格时按 A 曝光。每张底片有4次曝光电量；调整次数有限，正好用完仍可曝光。完成两张底片获胜。长按不连动。',
    controls: { move: '左右移动选中支架；上下增减光阑；松开再按一步',
      a: '空格、Z、确认键 / 手机右上区：曝光验收', b: 'X、B / 手机右下区：切换透镜和屏幕' },
    tip: '这是理想薄透镜与简化亮度、模糊指标。LENS 为透镜，SCREEN 为屏幕，IRIS 为光阑；REAL 才能成像。分别看 BLUR≤1 和 LIGHT 目标范围，光阑6始终不够清晰。虚线是虚像反向延长线；ADJ LEFT 为剩余调整，0时仍可按 A。',
    winTitle: '两张底片曝光完成', loseTitle: '本次实验结束',
    hud: function (state) {
      return [{ label: '当前支架与范围', value: (state.selected === 'lens' ? '透镜 ' + state.lensX + ' [' + state.card.lensMin + '-' + state.card.lensMax :
        '屏幕 ' + state.screenX + ' [' + state.card.screenMin + '-' + state.card.screenMax) + ']' },
      { label: '已完成底片', value: state.completed + ' / 2', tone: state.completed === 2 ? 'good' : '' },
      { label: '当前曝光电量', value: state.energy + ' / 4', tone: state.energy <= 1 ? 'warn' : '' },
      { label: '剩余调整（0仍可曝光）', value: remaining(state), tone: remaining(state) <= 3 ? 'warn' : '' }];
    },
    result: function (state) {
      return (state.phase === 'won' ? '两张底片的实像、清晰度和亮度均已通过实际曝光验收。' :
        state.reason === 'energy' ? '本张底片的4次曝光电量已用尽。' : '本张底片超过了允许的实际调整次数。') +
        '已完成 ' + state.completed + '/2 张；共调整 ' + state.totalAdjustments + ' 次，曝光 ' + state.exposures +
        ' 次，用时 ' + state.elapsed.toFixed(1) + ' 秒。';
    }, render: render
  };
})(window);
