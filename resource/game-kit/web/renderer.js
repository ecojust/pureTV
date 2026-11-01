/* PureTV: one locally baked atlas, one WebGL 1 batch, 960 x 540 logical pixels. */
(function (global) {
  'use strict';

  var WIDTH = 960, HEIGHT = 540, ATLAS_SIZE = 1024, MAX_QUADS = 8192, MAX_ATLAS_TILES = 128;

  function ellipse(ctx, x, y, rx, ry, color) {
    // Keep the current transform: changing it here would also distort gradient coordinates.
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    else {
      var k = .5522847498;
      ctx.moveTo(x + rx, y);
      ctx.bezierCurveTo(x + rx, y + ry * k, x + rx * k, y + ry, x, y + ry);
      ctx.bezierCurveTo(x - rx * k, y + ry, x - rx, y + ry * k, x - rx, y);
      ctx.bezierCurveTo(x - rx, y - ry * k, x - rx * k, y - ry, x, y - ry);
      ctx.bezierCurveTo(x + rx * k, y - ry, x + rx, y - ry * k, x + rx, y);
    }
    ctx.fillStyle = color; ctx.fill();
  }
  function path(ctx, points, fill, stroke, width) {
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 2; ctx.stroke(); }
  }
  function linear(ctx, x1, y1, x2, y2, stops) {
    var g = ctx.createLinearGradient(x1, y1, x2, y2);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    return g;
  }
  function radial(ctx, x, y, radius, stops, innerX, innerY) {
    var g = ctx.createRadialGradient(innerX == null ? x : innerX, innerY == null ? y : innerY, 0, x, y, radius);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    return g;
  }

  function atlasError(message) { throw new Error('PureRenderer atlas: ' + message); }
  function atlasTiles(legacy, config) {
    var selected = legacy;
    if (config != null) {
      if (typeof config !== 'object' || Array.isArray(config)) atlasError('configuration must be an object');
      var builtins = config.builtins === undefined ? [] : config.builtins;
      var custom = config.tiles === undefined ? [] : config.tiles;
      if (!Array.isArray(builtins) || !Array.isArray(custom)) atlasError('builtins and tiles must be arrays');
      if (builtins.length + custom.length + 2 > MAX_ATLAS_TILES) atlasError('too many active tiles');
      var known = Object.create(null), wanted = Object.create(null);
      for (var k = 0; k < legacy.length; k++) known[legacy[k].name] = legacy[k];
      wanted.white = wanted.disc = true;
      for (var b = 0; b < builtins.length; b++) {
        var name = builtins[b];
        if (typeof name !== 'string' || !known[name]) atlasError('unknown builtin ' + String(name));
        if (wanted[name]) atlasError('duplicate builtin/core tile ' + name);
        wanted[name] = true;
      }
      selected = legacy.filter(function (entry) { return !!wanted[entry.name]; });
      for (var c = 0; c < custom.length; c++) {
        var entry = custom[c];
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) atlasError('tile must be an object');
        // Snapshot descriptors before any painter executes; later caller changes
        // cannot move a validated tile or replace a subsequent paint callback.
        selected.push({ name: entry.name, x: entry.x, y: entry.y, w: entry.w, h: entry.h, paint: entry.paint });
      }
    }
    var names = Object.create(null);
    for (var i = 0; i < selected.length; i++) {
      var tile = selected[i];
      if (typeof tile.name !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(tile.name)
          || tile.name === 'constructor' || tile.name === 'prototype') atlasError('invalid tile name');
      if (names[tile.name]) atlasError('duplicate tile ' + tile.name);
      names[tile.name] = true;
      var dimensions = [tile.x, tile.y, tile.w, tile.h];
      for (var d = 0; d < dimensions.length; d++) {
        if (typeof dimensions[d] !== 'number' || !isFinite(dimensions[d]) || Math.floor(dimensions[d]) !== dimensions[d]) atlasError('tile ' + tile.name + ' needs finite integer coordinates');
      }
      if (tile.x < 0 || tile.y < 0 || tile.w <= 0 || tile.h <= 0 || tile.x + tile.w > ATLAS_SIZE || tile.y + tile.h > ATLAS_SIZE) atlasError('tile ' + tile.name + ' is outside the 1024 atlas');
      if (typeof tile.paint !== 'function') atlasError('tile ' + tile.name + ' needs a paint function');
      for (var g = 0; g < 95; g++) {
        var gx = (g % 20) * 48, gy = 448 + Math.floor(g / 20) * 64;
        if (tile.x < gx + 48 && tile.x + tile.w > gx && tile.y < gy + 64 && tile.y + tile.h > gy) atlasError('tile ' + tile.name + ' overlaps a reserved glyph');
      }
      for (var j = 0; j < i; j++) {
        var previous = selected[j];
        if (tile.x < previous.x + previous.w && tile.x + tile.w > previous.x && tile.y < previous.y + previous.h && tile.y + tile.h > previous.y) atlasError('tile ' + tile.name + ' overlaps ' + previous.name);
      }
    }
    return selected;
  }

  // All light, material and shadow work happens once, before the render loop.
  function bakeAtlas(config) {
    var definitions = [], regions = {}, glyphs = {};
    function tile(name, x, y, w, h, paint) {
      definitions.push({ name: name, x: x, y: y, w: w, h: h, paint: paint });
    }
    tile('orb', 0, 0, 224, 224, function (c) {
      ellipse(c, 114, 191, 75, 13, radial(c, 114, 191, 76, [[0, 'rgba(0,0,0,.55)'], [1, 'transparent']]));
      ellipse(c, 112, 108, 87, 87, radial(c, 112, 108, 91, [[0, '#ffffff'], [.22, '#e5f1f7'], [.58, '#93b0c3'], [.84, '#4c687d'], [1, '#253d55']], 79, 65));
      c.strokeStyle = 'rgba(237,251,255,.48)'; c.lineWidth = 2;
      c.beginPath(); c.arc(112, 108, 85, Math.PI * 1.06, Math.PI * 1.88); c.stroke();
      ellipse(c, 84, 68, 26, 17, radial(c, 84, 68, 28, [[0, 'rgba(255,255,255,.60)'], [1, 'rgba(255,255,255,0)']]));
      c.save(); c.translate(112, 108); c.rotate(-.25); c.scale(1, .34);
      c.beginPath(); c.arc(0, 0, 83, .12, Math.PI - .12); c.strokeStyle = 'rgba(16,40,61,.20)'; c.lineWidth = 3; c.stroke(); c.restore();
    });
    tile('ship', 224, 0, 224, 224, function (c) {
      // Nose points up: rotate PI/2 to face right.
      ellipse(c, 112, 183, 70, 16, radial(c, 112, 183, 73, [[0, 'rgba(0,0,0,.48)'], [1, 'transparent']]));
      path(c, [[108, 54], [35, 162], [38, 178], [95, 155], [129, 155], [186, 178], [189, 162], [116, 54]], linear(c, 40, 78, 162, 180, [[0, '#f1f9ff'], [.32, '#8098ac'], [.57, '#d3e2e9'], [1, '#344c63']]), '#263e54', 3);
      path(c, [[112, 20], [145, 137], [130, 176], [94, 176], [79, 137]], linear(c, 78, 70, 148, 147, [[0, '#627b90'], [.38, '#f4f8fa'], [.53, '#b6cad6'], [1, '#405c72']]), '#294459', 3);
      path(c, [[112, 49], [127, 109], [112, 127], [97, 109]], linear(c, 100, 65, 126, 125, [[0, '#e0fbff'], [.22, '#84d9ef'], [.6, '#2386b1'], [1, '#123c62']]), '#d8f4ff', 2);
      path(c, [[55, 150], [75, 122], [75, 152]], '#51d9e6');
      path(c, [[169, 150], [149, 122], [149, 152]], '#51d9e6');
      c.fillStyle = '#203749'; c.fillRect(93, 166, 14, 17); c.fillRect(117, 166, 14, 17);
      c.fillStyle = '#7ce9ff'; c.fillRect(95, 177, 10, 5); c.fillRect(119, 177, 10, 5);
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(112, 25); c.lineTo(84, 137); c.stroke();
    });
    tile('crate', 448, 0, 192, 192, function (c) {
      ellipse(c, 99, 164, 76, 14, radial(c, 99, 164, 78, [[0, 'rgba(0,0,0,.45)'], [1, 'transparent']]));
      path(c, [[33, 56], [122, 34], [165, 61], [76, 85]], linear(c, 65, 38, 113, 85, [[0, '#fff1be'], [1, '#c99959']]), '#573d29', 2);
      path(c, [[33, 56], [76, 85], [76, 167], [33, 137]], linear(c, 33, 75, 76, 155, [[0, '#c19860'], [1, '#6b4b30']]), '#573d29', 2);
      path(c, [[76, 85], [165, 61], [165, 142], [76, 167]], linear(c, 81, 83, 153, 158, [[0, '#edc980'], [1, '#a7713c']]), '#573d29', 2);
      path(c, [[91, 90], [151, 74], [151, 130], [91, 146]], '#795335', '#f1ca85', 3);
      path(c, [[97, 96], [145, 83], [145, 124], [97, 137]], '#ba8b50');
      c.strokeStyle = '#f6d99b'; c.lineWidth = 7; c.beginPath(); c.moveTo(97, 99); c.lineTo(145, 122); c.moveTo(145, 85); c.lineTo(97, 135); c.stroke();
      path(c, [[65, 49], [80, 45], [121, 73], [107, 77]], '#83949c');
      path(c, [[107, 77], [121, 73], [121, 155], [107, 159]], '#71828b');
      ellipse(c, 114, 92, 3, 3, '#d4e8ed'); ellipse(c, 114, 143, 3, 3, '#d4e8ed');
    });
    tile('station', 640, 0, 256, 256, function (c) {
      ellipse(c, 129, 211, 101, 17, radial(c, 129, 211, 104, [[0, 'rgba(0,0,0,.45)'], [1, 'transparent']]));
      c.save(); c.translate(128, 125); c.rotate(-.32); c.scale(1, .62);
      c.beginPath(); c.arc(0, 0, 96, 0, Math.PI * 2); c.strokeStyle = '#2a4359'; c.lineWidth = 29; c.stroke();
      c.beginPath(); c.arc(0, -6, 96, 0, Math.PI * 2); c.strokeStyle = linear(c, -80, -70, 70, 75, [[0, '#f1f8fa'], [.4, '#afc8d5'], [1, '#4b6b80']]); c.lineWidth = 22; c.stroke();
      c.beginPath(); c.arc(0, -8, 96, .12, Math.PI * 1.84); c.strokeStyle = '#86eaf0'; c.lineWidth = 3; c.stroke(); c.restore();
      path(c, [[40, 95], [103, 115], [116, 141], [49, 117]], '#9fb9c8', '#29455a', 2);
      path(c, [[158, 107], [218, 134], [207, 155], [143, 130]], '#678fa5', '#29455a', 2);
      path(c, [[119, 47], [142, 48], [148, 111], [111, 119]], '#c1d6df', '#29455a', 2);
      ellipse(c, 128, 121, 44, 48, radial(c, 128, 121, 51, [[0, '#effbff'], [.25, '#cae3ec'], [.64, '#7098af'], [1, '#2c4e68']], 115, 100));
      ellipse(c, 128, 121, 24, 25, '#1d4e69');
      ellipse(c, 128, 119, 18, 18, radial(c, 128, 119, 19, [[0, '#d5ffff'], [.3, '#7af5f1'], [1, '#218dbe']], 122, 112));
      for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; ellipse(c, 128 + Math.cos(a) * 33, 121 + Math.sin(a) * 35, 2.6, 2.6, '#d5ffff'); }
    });
    tile('glow', 0, 256, 192, 192, function (c) {
      ellipse(c, 96, 96, 94, 94, radial(c, 96, 96, 94, [[0, 'rgba(255,255,255,.8)'], [.2, 'rgba(255,255,255,.46)'], [.52, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']]));
    });
    tile('ring', 192, 256, 192, 192, function (c) {
      c.beginPath(); c.arc(96, 96, 80, 0, Math.PI * 2); c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = 17; c.stroke();
      c.beginPath(); c.arc(96, 96, 80, 0, Math.PI * 2); c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
    });
    tile('shadow', 384, 256, 192, 128, function (c) {
      c.save(); c.translate(96, 64); c.scale(1, .64);
      ellipse(c, 0, 0, 93, 93, radial(c, 0, 0, 93, [[0, 'rgba(0,0,0,.62)'], [.35, 'rgba(0,0,0,.38)'], [1, 'rgba(0,0,0,0)']])); c.restore();
    });
    tile('spark', 576, 256, 128, 128, function (c) {
      ellipse(c, 64, 64, 61, 61, radial(c, 64, 64, 61, [[0, 'rgba(255,255,255,.9)'], [.25, 'rgba(255,255,255,.24)'], [1, 'rgba(255,255,255,0)']]));
      path(c, [[64, 12], [70, 56], [116, 64], [70, 72], [64, 116], [58, 72], [12, 64], [58, 56]], 'rgba(255,255,255,.9)');
      ellipse(c, 64, 64, 9, 9, '#fff');
    });
    tile('disc', 704, 256, 128, 128, function (c) { ellipse(c, 64, 64, 62, 62, '#fff'); });
    tile('white', 848, 272, 16, 16, function (c) { c.fillStyle = '#fff'; c.fillRect(0, 0, 16, 16); });

    // Optical bench hardware, facing right (prism) and / (mirror) by default.
    tile('mirror', 0, 800, 192, 192, function (c) {
      ellipse(c, 98, 156, 67, 16, radial(c, 98, 156, 70, [[0, 'rgba(0,0,0,.55)'], [1, 'transparent']]));
      ellipse(c, 96, 100, 65, 65, linear(c, 50, 45, 130, 155, [[0, '#536b80'], [.47, '#20374c'], [1, '#102438']]));
      ellipse(c, 96, 97, 57, 57, linear(c, 58, 44, 125, 150, [[0, '#2b4056'], [1, '#102235']]));
      c.save(); c.translate(96, 96); c.rotate(-Math.PI / 4);
      path(c, [[-73, -13], [66, -13], [73, -6], [73, 12], [-66, 12], [-73, 5]], linear(c, 0, -13, 0, 12, [[0, '#e5f2f8'], [.3, '#8299aa'], [.66, '#4d6d85'], [1, '#18364c']]), '#9ab6c7', 2);
      c.fillStyle = linear(c, 0, -8, 0, 8, [[0, '#d8ffff'], [.45, '#b4e7f3'], [.55, '#55a7c6'], [1, '#d9f7ff']]); c.fillRect(-62, -8, 124, 16);
      c.strokeStyle = '#f4ffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-60, -6); c.lineTo(60, -6); c.stroke();
      c.restore();
      ellipse(c, 54, 54, 5, 5, '#bdd1db'); ellipse(c, 138, 138, 5, 5, '#7896a9');
      c.strokeStyle = '#274052'; c.lineWidth = 2; c.beginPath(); c.moveTo(51, 54); c.lineTo(57, 54); c.moveTo(135, 138); c.lineTo(141, 138); c.stroke();
    });
    tile('prism', 192, 800, 192, 192, function (c) {
      ellipse(c, 100, 155, 69, 16, radial(c, 100, 155, 72, [[0, 'rgba(0,0,0,.5)'], [1, 'transparent']]));
      path(c, [[47, 30], [161, 96], [47, 162]], linear(c, 55, 25, 137, 159, [[0, '#eefaff'], [.34, '#86a8bf'], [.72, '#354f6d'], [1, '#9bbdcd']]), '#c0d9e8', 2);
      path(c, [[56, 45], [145, 96], [56, 147]], linear(c, 50, 58, 133, 125, [[0, '#c7f7ff'], [.42, '#84b5dc'], [.7, '#887db8'], [1, '#98d9e8']]), '#e5faff', 2);
      path(c, [[59, 49], [97, 96], [59, 143]], linear(c, 58, 55, 95, 131, [[0, '#e4ffff'], [.6, '#82c9e0'], [1, '#688bbc']]));
      path(c, [[59, 49], [141, 96], [97, 96]], 'rgba(218,247,255,.52)');
      path(c, [[59, 143], [97, 96], [141, 96]], 'rgba(127,119,218,.44)');
      c.strokeStyle = 'rgba(241,255,255,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(59, 49); c.lineTo(97, 96); c.lineTo(59, 143); c.moveTo(97, 96); c.lineTo(140, 96); c.stroke();
      path(c, [[24, 90], [36, 90], [36, 83], [48, 96], [36, 109], [36, 102], [24, 102]], '#edfaff');
      ellipse(c, 54, 36, 3, 3, '#f5a6af'); ellipse(c, 154, 96, 3, 3, '#9cebb7'); ellipse(c, 54, 156, 3, 3, '#91bbff');
    });
    tile('locomotive', 384, 800, 224, 128, function (c) {
      // Raised cab, roof vents, steel trucks and warm lamps, with the nose facing right.
      ellipse(c, 113, 96, 100, 23, radial(c, 113, 96, 101, [[0, 'rgba(0,0,0,.60)'], [1, 'transparent']]));
      c.fillStyle = '#162433'; c.fillRect(33, 70, 151, 29);
      [52, 75, 151, 174].forEach(function (x) { ellipse(c, x, 91, 11, 12, '#101c29'); ellipse(c, x, 91, 6, 7, '#778b9b'); ellipse(c, x, 91, 2.5, 3, '#bacbd3'); });
      path(c, [[24, 50], [181, 50], [201, 62], [201, 85], [182, 96], [24, 96]], linear(c, 20, 52, 20, 99, [[0, '#b7cbd4'], [.22, '#7995a6'], [.53, '#3f6076'], [1, '#264357']]), '#1d3448', 2);
      path(c, [[30, 43], [182, 43], [201, 58], [179, 71], [30, 71]], linear(c, 60, 37, 173, 76, [[0, '#f1f6f6'], [.5, '#b9d0dc'], [1, '#7193a9']]), '#c3d6df', 2);
      path(c, [[41, 34], [88, 34], [98, 43], [98, 70], [41, 70]], linear(c, 39, 35, 101, 70, [[0, '#f5fafb'], [.45, '#b8d1df'], [1, '#567c96']]), '#425e75', 2);
      path(c, [[41, 34], [51, 24], [89, 24], [98, 34]], '#dce9ee', '#eaf4f7', 2);
      c.fillStyle = '#173a53'; c.fillRect(47, 42, 15, 18); c.fillRect(70, 42, 20, 18);
      c.fillStyle = '#92d8ed'; c.fillRect(49, 44, 11, 5); c.fillRect(72, 44, 16, 5);
      c.fillStyle = '#58778b'; c.fillRect(108, 46, 48, 16);
      c.strokeStyle = '#d2e1e7'; c.lineWidth = 2;
      for (var v = 112; v < 156; v += 7) { c.beginPath(); c.moveTo(v, 47); c.lineTo(v, 61); c.stroke(); }
      path(c, [[165, 49], [182, 49], [191, 57], [178, 64], [165, 64]], '#c4d8e2');
      c.fillStyle = '#e9c879'; c.fillRect(28, 76, 156, 5);
      c.strokeStyle = '#e8f2f6'; c.lineWidth = 2; c.beginPath(); c.moveTo(28, 50); c.lineTo(28, 89); c.moveTo(184, 76); c.lineTo(195, 69); c.stroke();
      ellipse(c, 197, 65, 4, 4, '#fff5c9'); ellipse(c, 197, 79, 4, 4, '#fff5c9');
      c.fillStyle = '#20384b'; c.fillRect(15, 78, 13, 5); c.fillRect(199, 75, 12, 5);
    });
    tile('freight', 608, 800, 192, 128, function (c) {
      ellipse(c, 96, 99, 86, 19, radial(c, 96, 99, 87, [[0, 'rgba(0,0,0,.50)'], [1, 'transparent']]));
      [42, 63, 132, 153].forEach(function (x) { ellipse(c, x, 94, 10, 11, '#132331'); ellipse(c, x, 94, 5, 6, '#8ca0ac'); });
      c.fillStyle = '#284454'; c.fillRect(23, 82, 145, 14);
      path(c, [[27, 47], [165, 47], [165, 89], [27, 89]], linear(c, 20, 43, 20, 90, [[0, '#a8c2d0'], [.4, '#7399ad'], [1, '#426a80']]), '#2b4b60', 2);
      path(c, [[27, 47], [40, 33], [153, 33], [165, 47]], '#d6e6ec', '#ebf4f8', 2);
      c.strokeStyle = '#c8dee8'; c.lineWidth = 2;
      for (var rib = 38; rib < 163; rib += 12) { c.beginPath(); c.moveTo(rib, 51); c.lineTo(rib, 84); c.stroke(); }
      c.fillStyle = '#b0ccd9'; c.fillRect(77, 56, 36, 22); c.strokeStyle = '#dcecf2'; c.lineWidth = 2; c.strokeRect(77, 56, 36, 22);
      c.fillStyle = '#2b475c'; c.fillRect(15, 82, 12, 5); c.fillRect(165, 82, 12, 5);
    });

    // Validate the complete layout before allocating/painting. Each renderer owns
    // its atlas, so distinct per-game configurations cannot share stale pixels.
    var active = atlasTiles(definitions, config);
    var canvas = document.createElement('canvas'); canvas.width = canvas.height = ATLAS_SIZE;
    var ctx = canvas.getContext('2d');
    if (!ctx) atlasError('Canvas 2D is required for baking');
    var art = Object.freeze({ ellipse: ellipse, path: path, linear: linear, radial: radial });
    for (var t = 0; t < active.length; t++) {
      var current = active[t];
      regions[current.name] = { x: current.x, y: current.y, w: current.w, h: current.h };
      ctx.save(); ctx.beginPath(); ctx.rect(current.x, current.y, current.w, current.h); ctx.clip(); ctx.translate(current.x, current.y);
      try { current.paint(ctx, current.w, current.h, art); }
      finally { ctx.restore(); }
    }
    // A local system font is baked once. No font loading, per-frame canvas text, or network request.
    ctx.font = '600 40px Arial, sans-serif'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff';
    for (var code = 32; code <= 126; code++) {
      var index = code - 32, x = (index % 20) * 48, y = 448 + Math.floor(index / 20) * 64;
      var ch = String.fromCharCode(code), measured = ctx.measureText(ch);
      // Legacy painting remains byte-for-byte unchanged. Configured layouts can
      // use adjacent free cells, so clip font substitution ink to its own cell.
      if (config != null) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, 48, 64); ctx.clip(); }
      ctx.fillText(ch, x + 4, y + 45);
      if (config != null) ctx.restore();
      glyphs[ch] = { x: x, y: y, w: 48, h: 64, advance: measured.width };
    }
    return { canvas: canvas, regions: regions, glyphs: glyphs };
  }

  function parseColor(value) {
    if (Array.isArray(value) || (value && typeof value !== 'string' && value.length >= 3)) {
      return [value[0], value[1], value[2], value.length > 3 ? value[3] : 1];
    }
    var s = String(value == null ? '#fff' : value).trim().toLowerCase(), m;
    if (s.charAt(0) === '#') {
      s = s.slice(1);
      if (s.length === 3 || s.length === 4) return [parseInt(s[0] + s[0], 16) / 255, parseInt(s[1] + s[1], 16) / 255, parseInt(s[2] + s[2], 16) / 255, s.length === 4 ? parseInt(s[3] + s[3], 16) / 255 : 1];
      if (s.length === 6 || s.length === 8) return [parseInt(s.slice(0, 2), 16) / 255, parseInt(s.slice(2, 4), 16) / 255, parseInt(s.slice(4, 6), 16) / 255, s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1];
    }
    if ((m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(s))) return [+m[1] / 255, +m[2] / 255, +m[3] / 255, m[4] == null ? 1 : +m[4]];
    var named = { white: [1, 1, 1, 1], black: [0, 0, 0, 1], transparent: [0, 0, 0, 0], red: [1, 0, 0, 1], blue: [0, 0, 1, 1], green: [0, .502, 0, 1], yellow: [1, 1, 0, 1], cyan: [0, 1, 1, 1], magenta: [1, 0, 1, 1] };
    return named[s] || [1, 1, 1, 1];
  }
  function rgba(c) { return 'rgba(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ',' + c[3] + ')'; }

  function PureRenderer(canvas, options) {
    if (!canvas || !canvas.getContext) throw new TypeError('PureRenderer needs a canvas');
    if (options != null && (typeof options !== 'object' || Array.isArray(options))) atlasError('renderer options must be an object');
    var config = options == null ? null : options.atlas;
    this.canvas = canvas; this.width = WIDTH; this.height = HEIGHT;
    this.atlas = bakeAtlas(config); this._configuredAtlas = config != null; this.disposed = false; this.contextLost = false;
    this.metrics = { kind: 'webgl', drawCalls: 0, quads: 0, textureCount: 1, atlasSize: ATLAS_SIZE, contextLost: false };
    this._count = 0; this._colors = Object.create(null); this._colorCount = 0;
    this._vertices = new Float32Array(MAX_QUADS * 4 * 8);
    this._indices = new Uint16Array(MAX_QUADS * 6);
    for (var i = 0; i < MAX_QUADS; i++) { var v = i * 4, p = i * 6; this._indices[p] = v; this._indices[p + 1] = v + 1; this._indices[p + 2] = v + 2; this._indices[p + 3] = v; this._indices[p + 4] = v + 2; this._indices[p + 5] = v + 3; }
    var attrs = { alpha: false, antialias: true, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'low-power' };
    this.gl = canvas.getContext('webgl', attrs) || canvas.getContext('experimental-webgl', attrs);
    var self = this;
    this._lost = function (event) {
      event.preventDefault(); self.contextLost = true; self.metrics.contextLost = true; self._count = 0;
      self.metrics.drawCalls = 0; self.metrics.quads = 0;
      self._notify('renderercontextlost');
    };
    this._restored = function () {
      if (self.disposed) return;
      self._initGL(); self.contextLost = false; self.metrics.contextLost = false;
      self._notify('renderercontextrestored');
    };
    canvas.addEventListener('webglcontextlost', this._lost, false);
    canvas.addEventListener('webglcontextrestored', this._restored, false);
    if (this.gl) this._initGL();
    else {
      this.ctx = canvas.getContext('2d', { alpha: false });
      if (!this.ctx) throw new Error('No supported canvas renderer');
      this.metrics.kind = 'canvas2d'; this.metrics.textureCount = 0;
      this._tints = Object.create(null); this._tintCount = 0;
    }
    this.resize();
  }

  PureRenderer.prototype._notify = function (name) {
    if (typeof global.CustomEvent === 'function') this.canvas.dispatchEvent(new CustomEvent(name, { detail: { renderer: this } }));
    var callback = name === 'renderercontextlost' ? this.oncontextlost : this.oncontextrestored;
    if (typeof callback === 'function') callback(this);
  };
  PureRenderer.prototype._color = function (value) {
    if (typeof value !== 'string') return parseColor(value);
    var cached = this._colors[value];
    if (cached) return cached;
    if (++this._colorCount > 512) { this._colors = Object.create(null); this._colorCount = 1; }
    return (this._colors[value] = parseColor(value));
  };
  PureRenderer.prototype._initGL = function () {
    var gl = this.gl;
    function shader(type, source) {
      var obj = gl.createShader(type); gl.shaderSource(obj, source); gl.compileShader(obj);
      if (!gl.getShaderParameter(obj, gl.COMPILE_STATUS)) { var message = gl.getShaderInfoLog(obj); gl.deleteShader(obj); throw new Error('PureRenderer shader: ' + message); }
      return obj;
    }
    var vertex = shader(gl.VERTEX_SHADER, 'attribute vec2 a_position;attribute vec2 a_uv;attribute vec4 a_color;varying vec2 v_uv;varying vec4 v_color;void main(){gl_Position=vec4(a_position*vec2(2.0/960.0,-2.0/540.0)+vec2(-1.0,1.0),0.0,1.0);v_uv=a_uv;v_color=a_color;}');
    var fragment = shader(gl.FRAGMENT_SHADER, 'precision mediump float;uniform sampler2D u_atlas;varying vec2 v_uv;varying vec4 v_color;void main(){vec4 tex=texture2D(u_atlas,v_uv);gl_FragColor=vec4(tex.rgb*v_color.rgb*v_color.a,tex.a*v_color.a);}');
    this._program = gl.createProgram(); gl.attachShader(this._program, vertex); gl.attachShader(this._program, fragment); gl.linkProgram(this._program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) throw new Error('PureRenderer link: ' + gl.getProgramInfoLog(this._program));
    this._vertexBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer); gl.bufferData(gl.ARRAY_BUFFER, this._vertices.byteLength, gl.DYNAMIC_DRAW);
    this._indexBuffer = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indices, gl.STATIC_DRAW);
    this._position = gl.getAttribLocation(this._program, 'a_position'); this._uv = gl.getAttribLocation(this._program, 'a_uv'); this._tint = gl.getAttribLocation(this._program, 'a_color');
    this._texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.atlas.canvas);
    gl.useProgram(this._program); gl.uniform1i(gl.getUniformLocation(this._program, 'u_atlas'), 0);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.STENCIL_TEST);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  };
  PureRenderer.prototype.resize = function () {
    if (this.disposed) return;
    this.dpr = Math.min(1.5, Math.max(1, global.devicePixelRatio || 1));
    var w = Math.round(WIDTH * this.dpr), h = Math.round(HEIGHT * this.dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
  };
  PureRenderer.prototype.begin = function (backgroundColor) {
    this.metrics.drawCalls = 0; this.metrics.quads = 0; this._count = 0;
    if (this.disposed || this.contextLost) return false;
    this.resize(); var c = this._color(backgroundColor || '#071321');
    if (this.gl) {
      var gl = this.gl;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height); gl.clearColor(c[0], c[1], c[2], c[3]); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(this._program); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this._texture);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
      gl.enableVertexAttribArray(this._position); gl.vertexAttribPointer(this._position, 2, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(this._uv); gl.vertexAttribPointer(this._uv, 2, gl.FLOAT, false, 32, 8);
      gl.enableVertexAttribArray(this._tint); gl.vertexAttribPointer(this._tint, 4, gl.FLOAT, false, 32, 16);
    } else {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); this.ctx.globalAlpha = 1;
      this.ctx.globalCompositeOperation = 'source-over'; this.ctx.fillStyle = rgba(c); this.ctx.fillRect(0, 0, WIDTH, HEIGHT);
      this.ctx.imageSmoothingEnabled = true;
    }
    return true;
  };
  PureRenderer.prototype._quad = function (region, cx, cy, w, h, angle, color) {
    if (this.disposed || this.contextLost || !region || !(w > 0) || !(h > 0) || !isFinite(cx + cy + w + h + angle)) return;
    var c = this._color(color); if (!(c[3] > 0)) return;
    // A rotated quad stays inside a radius of half its diagonal; reject fully offscreen work.
    var radius = (w + h) * .5;
    if (cx + radius < 0 || cx - radius > WIDTH || cy + radius < 0 || cy - radius > HEIGHT) return;
    if (!this.gl) { this._canvasQuad(region, cx, cy, w, h, angle, c); this.metrics.quads++; return; }
    if (this._count === MAX_QUADS) this._flush();
    var cos = Math.cos(angle), sin = Math.sin(angle), hx = w * .5, hy = h * .5;
    var ax = cos * hx, ay = sin * hx, bx = -sin * hy, by = cos * hy;
    // Half-texel insets keep glyph/sprite boundaries independent under bilinear sampling.
    var u0 = (region.x + .5) / ATLAS_SIZE, v0 = (region.y + .5) / ATLAS_SIZE;
    var u1 = (region.x + region.w - .5) / ATLAS_SIZE, v1 = (region.y + region.h - .5) / ATLAS_SIZE;
    var p = this._count * 32, data = this._vertices;
    data[p] = cx - ax - bx; data[p + 1] = cy - ay - by; data[p + 2] = u0; data[p + 3] = v0;
    data[p + 8] = cx + ax - bx; data[p + 9] = cy + ay - by; data[p + 10] = u1; data[p + 11] = v0;
    data[p + 16] = cx + ax + bx; data[p + 17] = cy + ay + by; data[p + 18] = u1; data[p + 19] = v1;
    data[p + 24] = cx - ax + bx; data[p + 25] = cy - ay + by; data[p + 26] = u0; data[p + 27] = v1;
    for (var k = 0; k < 4; k++) { var offset = p + k * 8; data[offset + 4] = c[0]; data[offset + 5] = c[1]; data[offset + 6] = c[2]; data[offset + 7] = c[3]; }
    this._count++; this.metrics.quads++;
  };
  PureRenderer.prototype.rect = function (x, y, w, h, color, angle) {
    this._quad(this.atlas.regions.white, x + w / 2, y + h / 2, w, h, angle || 0, color);
  };
  PureRenderer.prototype.sprite = function (name, cx, cy, w, h, angle, color) {
    if (this._configuredAtlas && !Object.prototype.hasOwnProperty.call(this.atlas.regions, name)) atlasError('missing configured sprite ' + String(name));
    this._quad(this.atlas.regions[name] || this.atlas.regions.orb, cx, cy, w, h, angle || 0, color);
  };
  PureRenderer.prototype.circle = function (cx, cy, r, color) {
    // Compensate the atlas padding so r means the visible disc radius.
    this._quad(this.atlas.regions.disc, cx, cy, r * 128 / 62, r * 128 / 62, 0, color);
  };
  PureRenderer.prototype.line = function (x1, y1, x2, y2, width, color) {
    var dx = x2 - x1, dy = y2 - y1;
    this._quad(this.atlas.regions.white, (x1 + x2) / 2, (y1 + y2) / 2, Math.sqrt(dx * dx + dy * dy), width, Math.atan2(dy, dx), color);
  };
  PureRenderer.prototype.text = function (value, x, y, size, color) {
    var text = String(value), scale = (size || 20) / 40, startX = x;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === '\n') { x = startX; y += (size || 20) * 1.3; continue; }
      var g = this.atlas.glyphs[ch] || this.atlas.glyphs['?'];
      if (ch !== ' ') this._quad(g, x + (g.w / 2 - 4) * scale, y + (g.h / 2 - 12) * scale, g.w * scale, g.h * scale, 0, color);
      x += g.advance * scale;
    }
    return x;
  };
  PureRenderer.prototype.measureText = function (value, size) {
    var text = String(value), scale = (size || 20) / 40, width = 0, maximum = 0;
    for (var i = 0; i < text.length; i++) { if (text[i] === '\n') { maximum = Math.max(maximum, width); width = 0; } else width += (this.atlas.glyphs[text[i]] || this.atlas.glyphs['?']).advance * scale; }
    return Math.max(maximum, width);
  };
  PureRenderer.prototype._flush = function () {
    if (!this._count || this.contextLost || this.disposed) return;
    var gl = this.gl;
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._vertices.subarray(0, this._count * 32));
    gl.drawElements(gl.TRIANGLES, this._count * 6, gl.UNSIGNED_SHORT, 0);
    this.metrics.drawCalls++; this._count = 0;
  };
  PureRenderer.prototype._canvasQuad = function (region, cx, cy, w, h, angle, color) {
    var ctx = this.ctx, source = this.atlas.canvas, sx = region.x, sy = region.y;
    if (region === this.atlas.regions.white) {
      ctx.save(); ctx.translate(cx, cy); if (angle) ctx.rotate(angle); ctx.fillStyle = rgba(color); ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore(); return;
    }
    if (color[0] !== 1 || color[1] !== 1 || color[2] !== 1) {
      var key = region.x + ':' + region.y + ':' + color.slice(0, 3).join(',');
      var tint = this._tints[key];
      if (!tint) {
        if (++this._tintCount > 96) { this._tints = Object.create(null); this._tintCount = 1; }
        tint = document.createElement('canvas'); tint.width = region.w; tint.height = region.h;
        var tc = tint.getContext('2d'); tc.drawImage(source, sx, sy, region.w, region.h, 0, 0, region.w, region.h);
        tc.globalCompositeOperation = 'multiply'; tc.fillStyle = rgba([color[0], color[1], color[2], 1]); tc.fillRect(0, 0, region.w, region.h);
        tc.globalCompositeOperation = 'destination-in'; tc.drawImage(source, sx, sy, region.w, region.h, 0, 0, region.w, region.h);
        this._tints[key] = tint;
      }
      source = tint; sx = sy = 0;
    }
    ctx.save(); ctx.translate(cx, cy); if (angle) ctx.rotate(angle); ctx.globalAlpha = color[3];
    ctx.drawImage(source, sx, sy, region.w, region.h, -w / 2, -h / 2, w, h); ctx.restore();
  };
  PureRenderer.prototype.end = function () {
    if (this.gl && !this.disposed && !this.contextLost) this._flush();
    return this.metrics;
  };
  PureRenderer.prototype.dispose = function () {
    if (this.disposed) return;
    this.canvas.removeEventListener('webglcontextlost', this._lost, false); this.canvas.removeEventListener('webglcontextrestored', this._restored, false);
    if (this.gl && !this.contextLost) {
      this.gl.deleteBuffer(this._vertexBuffer); this.gl.deleteBuffer(this._indexBuffer);
      this.gl.deleteTexture(this._texture); this.gl.deleteProgram(this._program);
    }
    this._count = 0; this.disposed = true; this._vertices = null; this._indices = null; this._tints = null;
    this.metrics.drawCalls = 0; this.metrics.quads = 0;
  };
  PureRenderer.WIDTH = WIDTH; PureRenderer.HEIGHT = HEIGHT;
  global.PureRenderer = PureRenderer;
})(window);
