/* PureTV: one locally baked atlas, one WebGL 1 batch, 960 x 540 logical pixels. */
(function (global) {
  'use strict';

  var WIDTH = 960, HEIGHT = 540, ATLAS_SIZE = 1024, MAX_QUADS = 8192;
  var sharedAtlas = null;

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

  // All light, material and shadow work happens once, before the render loop.
  function bakeAtlas() {
    if (sharedAtlas) return sharedAtlas;
    var canvas = document.createElement('canvas'); canvas.width = canvas.height = ATLAS_SIZE;
    var ctx = canvas.getContext('2d'), regions = {}, glyphs = {};
    function tile(name, x, y, w, h, paint) {
      regions[name] = { x: x, y: y, w: w, h: h };
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.translate(x, y);
      paint(ctx, w, h); ctx.restore();
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

    // A local system font is baked once. No font loading, per-frame canvas text, or network request.
    ctx.font = '600 40px Arial, sans-serif'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff';
    for (var code = 32; code <= 126; code++) {
      var index = code - 32, x = (index % 20) * 48, y = 448 + Math.floor(index / 20) * 64;
      var ch = String.fromCharCode(code), measured = ctx.measureText(ch);
      ctx.fillText(ch, x + 4, y + 45);
      glyphs[ch] = { x: x, y: y, w: 48, h: 64, advance: measured.width };
    }
    sharedAtlas = { canvas: canvas, regions: regions, glyphs: glyphs };
    return sharedAtlas;
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

  function PureRenderer(canvas) {
    if (!canvas || !canvas.getContext) throw new TypeError('PureRenderer needs a canvas');
    this.canvas = canvas; this.width = WIDTH; this.height = HEIGHT;
    this.atlas = bakeAtlas(); this.disposed = false; this.contextLost = false;
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
