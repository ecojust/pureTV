/* Alien Shooter TV — original low-poly models, local procedural materials.
 * World X/Y maps to Three X/Z. The orthographic camera never rotates sideways,
 * so screen-right and screen-down are the same directions as the controller.
 * Static objects are merged by material; animated creatures use bounded instance
 * pools. Rendering does not advance or mutate the game simulation. */
(function (root) {
  'use strict';
  var T = root.THREE, TAU = Math.PI * 2;
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function finite(n, fallback) { return Number.isFinite(n) ? n : fallback; }
  function random(seed) { return function () { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
  function canvas(width, height) { var c = document.createElement('canvas'); c.width = width; c.height = height || width; return c; }
  function compose(x, y, z, sx, sy, sz, rx, ry, rz) {
    return new T.Matrix4().compose(new T.Vector3(x || 0, y || 0, z || 0), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz));
  }
  function part(list, geometry, color, x, y, z, sx, sy, sz, rx, ry, rz) {
    list.push({ geometry: geometry, color: color, matrix: compose(x, y, z, sx, sy, sz, rx, ry, rz) });
  }
  function merge(parts, projectedUV) {
    var positions = [], normals = [], colors = [], uvs = [];
    parts.forEach(function (p) {
      var g = p.geometry.index ? p.geometry.toNonIndexed() : p.geometry.clone();
      g.applyMatrix4(p.matrix);
      var a = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, col = new T.Color(p.color === undefined ? 0xffffff : p.color).convertSRGBToLinear();
      for (var i = 0; i < a.count; i++) {
        positions.push(a.getX(i), a.getY(i), a.getZ(i));
        normals.push(n ? n.getX(i) : 0, n ? n.getY(i) : 1, n ? n.getZ(i) : 0);
        colors.push(col.r, col.g, col.b);
        if (projectedUV) {
          var nx = n ? Math.abs(n.getX(i)) : 0, ny = n ? Math.abs(n.getY(i)) : 1, nz = n ? Math.abs(n.getZ(i)) : 0;
          if (ny >= nx && ny >= nz) uvs.push(a.getX(i) / projectedUV, a.getZ(i) / projectedUV);
          else if (nx >= nz) uvs.push(a.getZ(i) / projectedUV, a.getY(i) / projectedUV);
          else uvs.push(a.getX(i) / projectedUV, a.getY(i) / projectedUV);
        } else uvs.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
      }
      g.dispose();
    });
    var result = new T.BufferGeometry();
    result.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    result.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    result.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    result.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    result.computeBoundingSphere();
    return result;
  }
  var PALETTES = [
    { floor: '#65716e', plate: '#5b6663', metal: 0x72827e, trim: 0xe2b75b, light: 0xffc877, shadow: 0x101c1a, label: 'CARGO / SECTOR 01' },
    { floor: '#73868a', plate: '#697b7f', metal: 0x8aafb5, trim: 0x79ded5, light: 0x8bffe5, shadow: 0x111d24, label: 'BIOLAB / SECTOR 02' },
    { floor: '#5c6369', plate: '#525b62', metal: 0x7e8794, trim: 0xef8548, light: 0xff854d, shadow: 0x1c1419, label: 'REACTOR / SECTOR 03' }
  ];
  function floorTexture(stage) {
    var p = PALETTES[stage], c = canvas(1024), g = c.getContext('2d'), r = random(7182 + stage * 137);
    g.fillStyle = p.floor; g.fillRect(0, 0, 1024, 1024);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
      var x = i * 256, y = j * 256;
      g.fillStyle = p.plate; g.fillRect(x + 4, y + 4, 248, 248);
      var grad = g.createLinearGradient(x, y, x + 256, y + 256); grad.addColorStop(0, 'rgba(255,255,255,.06)'); grad.addColorStop(1, 'rgba(0,0,0,.09)');
      g.fillStyle = grad; g.fillRect(x + 5, y + 5, 246, 246);
      g.strokeStyle = 'rgba(7,17,20,.6)'; g.lineWidth = 4; g.strokeRect(x + 3, y + 3, 250, 250);
      g.strokeStyle = 'rgba(215,228,216,.18)'; g.lineWidth = 1; g.strokeRect(x + 6, y + 6, 244, 244);
      [[14, 14], [242, 14], [14, 242], [242, 242]].forEach(function (v) {
        g.fillStyle = '#273432'; g.beginPath(); g.arc(x + v[0], y + v[1], 4, 0, TAU); g.fill();
        g.fillStyle = '#9ba49b'; g.fillRect(x + v[0] - 2, y + v[1] - 2, 3, 1);
      });
      if ((i + j) % 4 === 1) {
        for (var k = 0; k < 12; k++) { g.fillStyle = 'rgba(7,18,19,.4)'; g.fillRect(x + 36, y + 40 + k * 14, 184, 5); g.fillStyle = 'rgba(170,187,176,.2)'; g.fillRect(x + 36, y + 45 + k * 14, 184, 1); }
      } else if (stage === 2) {
        g.strokeStyle = 'rgba(160,172,174,.13)'; g.lineWidth = 3;
        for (k = 20; k < 244; k += 28) { g.beginPath(); g.moveTo(x + 20, y + k); g.lineTo(x + 244, y + k - 12); g.stroke(); }
      }
    }
    var img = g.getImageData(0, 0, 1024, 1024);
    for (i = 0; i < img.data.length; i += 4) { var d = (r() - .5) * 24; img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d; }
    g.putImageData(img, 0, 0);
    for (i = 0; i < 120; i++) {
      var cx = r() * 1024, cy = r() * 1024, rad = 12 + r() * 80, stain = g.createRadialGradient(cx, cy, 1, cx, cy, rad);
      stain.addColorStop(0, 'rgba(27,25,14,' + (.09 + r() * .23) + ')'); stain.addColorStop(1, 'rgba(27,25,14,0)'); g.fillStyle = stain; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
    for (i = 0; i < 420; i++) { x = r() * 1024; y = r() * 1024; g.strokeStyle = r() < .7 ? 'rgba(18,28,27,.3)' : 'rgba(184,198,182,.25)'; g.lineWidth = .5 + r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3 + r() * 30, y - r() * 8); g.stroke(); }
    return c;
  }
  function metalTexture() {
    var c = canvas(512), g = c.getContext('2d'), r = random(191);
    g.fillStyle = '#98a5a5'; g.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 512; i++) { g.fillStyle = 'rgba(30,48,49,' + r() * .08 + ')'; g.fillRect(0, i, 512, 1); }
    for (i = 0; i < 4; i++) { g.fillStyle = '#3b4a4c'; g.fillRect(i * 128, 0, 3, 512); g.fillStyle = '#bfcbca'; g.fillRect(i * 128 + 4, 0, 1, 512); }
    for (i = 0; i < 60; i++) { g.fillStyle = 'rgba(59,43,29,.13)'; g.fillRect(r() * 512, r() * 512, 2, 4 + r() * 36); }
    return c;
  }
  function skinTexture() {
    var c = canvas(512), g = c.getContext('2d'), r = random(5718);
    g.fillStyle = '#c3c1a1'; g.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 2100; i++) {
      var x = r() * 512, y = r() * 512, a = r() * TAU, size = 2 + r() * 11;
      g.fillStyle = r() < .6 ? 'rgba(45,51,32,.22)' : 'rgba(229,219,167,.22)';
      g.beginPath(); g.ellipse(x, y, size, size * .45, a, 0, TAU); g.fill();
    }
    for (i = 0; i < 100; i++) {
      x = r() * 512; y = r() * 512; g.strokeStyle = 'rgba(40,50,34,.21)'; g.lineWidth = .8 + r(); g.beginPath(); g.moveTo(x, y);
      for (var n = 0; n < 6; n++) { x += (r() - .4) * 16; y += 5 + r() * 10; g.lineTo(x, y); } g.stroke();
    }
    return c;
  }
  function blobTexture(kind) {
    var c = canvas(128), g = c.getContext('2d'), r = random(487);
    if (kind === 'blood') {
      g.fillStyle = 'white';
      for (var i = 0; i < 32; i++) { var a = r() * TAU, d = r() * 42, size = 2 + r() * 14; g.beginPath(); g.ellipse(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, size, size * .55, a, 0, TAU); g.fill(); }
    } else {
      var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, kind === 'glow' ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,.65)'); grad.addColorStop(.3, kind === 'glow' ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)'); grad.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    }
    return c;
  }
  function stencilTexture() {
    var c = canvas(1024, 512), g = c.getContext('2d');
    g.clearRect(0, 0, 1024, 512); g.fillStyle = '#d8d1ae'; g.font = '900 70px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['CARGO 01', 'BIOLAB 02', 'CORE 03'].forEach(function (s, i) { g.fillText(s, 512, 70 + i * 150); });
    return c;
  }
  function Renderer(target, options) {
    this.canvas = target; this.options = options || {}; this.width = 1280; this.height = 720;
    this.geometries = []; this.materials = []; this.textures = []; this.worldGeometries = [];
    this.stats = { mode: 'webgl', calls: 0, triangles: 0, frames: 0 }; this.active = false; this.failed = false; this.disposed = false; this.error = '';
    this.cameraCenter = { x: 8, y: 17 }; this.viewHeight = 18; this.time = 0; this.map = null; this.stage = -1;
    if (!T) { this.failed = true; this.error = 'Local Three.js library is unavailable'; return; }
    try {
      var gl = target.getContext('webgl', { alpha: false, antialias: true, depth: true, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
      if (!gl) throw new Error('WebGL is unavailable');
      this.renderer = new T.WebGLRenderer({ canvas: target, context: gl, antialias: true, alpha: false, preserveDrawingBuffer: false });
      this.renderer.setPixelRatio(1); this.renderer.outputEncoding = T.sRGBEncoding; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = .94;
      this.scene = new T.Scene(); this.scene.background = new T.Color(0x0b1419);
      this.camera = new T.OrthographicCamera(-18, 18, 11, -11, .1, 180);
      this.scene.add(new T.HemisphereLight(0xc3dce0, 0x1d292e, .53));
      this.keyLight = new T.DirectionalLight(0xffd9ad, .9); this.keyLight.position.set(-20, 35, -20); this.scene.add(this.keyLight);
      this.fillLight = new T.DirectionalLight(0x689fb7, .34); this.fillLight.position.set(20, 12, 10); this.scene.add(this.fillLight);
      this.world = new T.Group(); this.dynamic = new T.Group(); this.scene.add(this.world, this.dynamic);
      this.dummy = new T.Object3D(); this.color = new T.Color(); this.raycaster = new T.Raycaster(); this.groundPlane = new T.Plane(new T.Vector3(0, 1, 0), 0); this.hitPoint = new T.Vector3();
      this.buildMaterials(); this.buildModels(); this.buildEffects(); this.resize(target.width || 1280, target.height || 720);
      var self = this;
      this._lost = function (event) { event.preventDefault(); self.contextLost = true; self.active = false; self.error = 'Graphics context lost'; self.canvas.setAttribute('data-renderer', 'unavailable'); };
      this._restored = function () { if (!self.disposed) { self.contextLost = false; self.error = ''; self.canvas.setAttribute('data-renderer', 'webgl'); } };
      target.addEventListener('webglcontextlost', this._lost); target.addEventListener('webglcontextrestored', this._restored); target.setAttribute('data-renderer', 'webgl');
    } catch (error) { this.failed = true; this.error = String(error.message || error); target.setAttribute('data-renderer', 'unavailable'); }
  }
  Renderer.prototype.geometry = function (g) { this.geometries.push(g); return g; };
  Renderer.prototype.texture = function (image, repeat) {
    var t = new T.CanvasTexture(image); t.encoding = T.sRGBEncoding; t.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
    this.textures.push(t); return t;
  };
  Renderer.prototype.material = function (params, basic) {
    var m = basic ? new T.MeshBasicMaterial(params) : new T.MeshPhongMaterial(params);
    if (m.color) m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); this.materials.push(m); return m;
  };
  Renderer.prototype.buildMaterials = function () {
    var self = this;
    this.box = this.geometry(new T.BoxBufferGeometry(1, 1, 1)); this.sphere = this.geometry(new T.SphereBufferGeometry(1, 10, 7));
    this.cylinder = this.geometry(new T.CylinderBufferGeometry(1, 1, 1, 10)); this.cone = this.geometry(new T.ConeBufferGeometry(1, 1, 7));
    this.torus = this.geometry(new T.TorusBufferGeometry(1, .065, 6, 24));
    this.plane = this.geometry(new T.PlaneBufferGeometry(1, 1)); this.ring = this.geometry(new T.RingBufferGeometry(.82, 1, 40));
    [this.box, this.sphere, this.cylinder, this.cone, this.plane, this.ring, this.torus].forEach(function (g) { var c = new Float32Array(g.attributes.position.count * 3); c.fill(1); g.setAttribute('color', new T.BufferAttribute(c, 3)); });
    this.floors = PALETTES.map(function (_, stage) { var t = self.texture(floorTexture(stage), true); return self.material({ map: t, color: 0x82958e, shininess: 14, specular: 0x17201d, vertexColors: true }); });
    var metal = this.texture(metalTexture(), true);
    this.metal = this.material({ map: metal, color: 0xffffff, shininess: 24, specular: 0x202925, vertexColors: true });
    this.matte = this.material({ color: 0xffffff, shininess: 10, specular: 0x182027, vertexColors: true });
    var organic = this.texture(skinTexture(), true);
    this.skin = this.material({ color: 0xffffff, map: organic, bumpMap: organic, bumpScale: .045, shininess: 18, specular: 0x171f16, vertexColors: true });
    this.glowing = this.material({ color: 0xffffff, vertexColors: true }, true);
    this.glass = this.material({ color: 0x69a9a1, transparent: true, opacity: .28, shininess: 90, specular: 0xaddfdf, depthWrite: false, side: T.DoubleSide });
    this.shadowTexture = this.texture(blobTexture('shadow')); this.glowTexture = this.texture(blobTexture('glow')); this.bloodTexture = this.texture(blobTexture('blood'));
    this.shadowMaterial = this.material({ map: this.shadowTexture, color: 0x000000, transparent: true, opacity: .7, depthWrite: false }, true);
    this.glowMaterial = this.material({ map: this.glowTexture, transparent: true, color: 0xffffff, opacity: .72, vertexColors: true, blending: T.AdditiveBlending, depthWrite: false }, true);
    this.decalMaterial = this.material({ map: this.bloodTexture, color: 0xffffff, transparent: true, opacity: .75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }, true);
    this.stencilMaterial = this.material({ map: this.texture(stencilTexture()), color: 0xffffff, transparent: true, opacity: .3, depthWrite: false }, true);
  };
  Renderer.prototype.pool = function (g, material, max) {
    // Three r124 caches instancing shader defines on the material. Keep pool
    // materials separate from static meshes and from pools with other attributes.
    var poolMaterial = material.clone(); this.materials.push(poolMaterial);
    var mesh = new T.InstancedMesh(g, poolMaterial, max);
    // r124 setColorAt allocates from mesh.count; allocate before reducing the
    // visible count to zero, otherwise the initial colour buffer has no entries.
    var instanceColors = new Float32Array(max * 3); instanceColors.fill(1);
    mesh.instanceColor = new T.InstancedBufferAttribute(instanceColors, 3).setUsage(T.DynamicDrawUsage);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.count = 0; mesh.frustumCulled = false; this.dynamic.add(mesh); return mesh;
  };
  Renderer.prototype.setInstance = function (mesh, index, x, y, z, sx, sy, sz, angle, color, rx) {
    var d = this.dummy; d.position.set(x, y, z); d.rotation.set(rx || 0, rx ? 0 : (-angle || 0), rx ? (-angle || 0) : 0); d.scale.set(sx, sy, sz); d.updateMatrix(); mesh.setMatrixAt(index, d.matrix);
    if (color !== undefined) { this.color.set(color).convertSRGBToLinear(); mesh.setColorAt(index, this.color); }
  };
  Renderer.prototype.finishPool = function (mesh, count) { mesh.count = count; mesh.visible = count > 0; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  Renderer.prototype.buildModels = function () {
    var p = [], self = this;
    // Soldier: armoured vest, belt pouches, helmet, shoulder pads and oxygen pack.
    part(p, this.box, 0x475a66, 0, .88, 0, .37, .53, .45);
    part(p, this.box, 0xa6b0ad, .075, .96, 0, .25, .37, .49);
    part(p, this.box, 0x21312e, -.22, .97, 0, .17, .42, .35);
    part(p, this.sphere, 0x778c95, .03, 1.32, 0, .23, .23, .23);
    part(p, this.box, 0x101c1a, .23, 1.32, 0, .065, .095, .34);
    part(p, this.box, 0x94d5c2, .267, 1.325, 0, .018, .04, .24);
    part(p, this.box, 0x141e1b, .03, .61, 0, .42, .13, .48);
    [-1, 1].forEach(function (side) {
      part(p, self.sphere, 0x8c9fa2, -.01, 1.08, side * .29, .19, .2, .16);
      part(p, self.box, 0xdeaa62, -.01, 1.27, side * .29, .12, .025, .14);
      part(p, self.box, 0x65756a, .15, .94, side * .31, .32, .16, .16, 0, 0, side * .14);
      part(p, self.box, 0x2d3b2c, .1, .67, side * .26, .2, .18, .1);
    });
    this.soldiers = this.pool(this.geometry(merge(p)), this.matte, 2);
    p = []; part(p, this.box, 0x425449, 0, .32, 0, .18, .4, .17); part(p, this.box, 0x17201e, .07, .09, 0, .3, .18, .2); part(p, this.box, 0x829286, .07, .42, 0, .1, .15, .2);
    this.soldierLegs = this.pool(this.geometry(merge(p)), this.matte, 4);
    p = []; part(p, this.box, 0x192124, .52, .99, 0, .65, .14, .13); part(p, this.cylinder, 0x879794, .93, 1.01, 0, .045, .37, .045, 0, 0, Math.PI / 2); part(p, this.box, 0x56716b, .52, 1.1, 0, .25, .08, .1); part(p, this.box, 0x162122, .5, .85, 0, .16, .21, .09, 0, 0, -.2);
    this.guns = this.pool(this.geometry(merge(p)), this.metal, 2);
    this.weaponParts = {};
    ['shotgun', 'minigun', 'plasma'].forEach(function (type) {
      var parts = [];
      if (type === 'minigun') {
        for (var barrel = 0; barrel < 6; barrel++) { var phi = barrel * TAU / 6; part(parts, self.cylinder, 0x8d9b98, .95, 1.01 + Math.cos(phi) * .09, Math.sin(phi) * .09, .027, .6, .027, 0, 0, Math.PI / 2); }
        part(parts, self.cylinder, 0x3d514b, .48, .9, .12, .19, .2, .19, Math.PI / 2);
      } else if (type === 'shotgun') {
        part(parts, self.cylinder, 0x8b9890, .88, 1.01, .065, .042, .55, .042, 0, 0, Math.PI / 2);
        part(parts, self.box, 0x917552, .67, .95, 0, .28, .13, .19);
      } else {
        part(parts, self.box, 0x446a6a, .78, 1.01, 0, .44, .24, .28);
        for (var coil = 0; coil < 4; coil++) part(parts, self.box, 0x7de5dc, .64 + coil * .09, 1.15, 0, .035, .04, .25);
      }
      self.weaponParts[type] = self.pool(self.geometry(merge(parts)), self.metal, 2);
    });
    this.monsters = {}; this.corpses = []; this.lastDeathEvent = 0;
    ['crawler', 'runner', 'spitter', 'brute', 'boss'].forEach(function (type) {
      var heavy = type === 'brute' || type === 'boss', spit = type === 'spitter', runner = type === 'runner', body = [], legsA = [], legsB = [];
      var skin = heavy ? 0x596449 : spit ? 0x587b4a : runner ? 0x8a6b4c : 0x687854, armor = heavy ? 0x3b4138 : 0x3c4c38;
      part(body, self.sphere, skin, -.05, heavy ? .68 : .43, 0, heavy ? .64 : .52, heavy ? .54 : .32, heavy ? .51 : .37);
      part(body, self.sphere, armor, -.19, heavy ? .96 : .59, 0, heavy ? .57 : .45, heavy ? .27 : .17, heavy ? .48 : .35);
      part(body, self.sphere, skin, .48, heavy ? .66 : .38, 0, .32, .24, .31);
      part(body, self.box, 0x1e281c, .69, heavy ? .6 : .33, 0, .2, .12, .37);
      [-1, 1].forEach(function (side) {
        part(body, self.sphere, 0xffb74e, .67, heavy ? .81 : .49, side * .18, .055, .05, .045);
        part(body, self.cone, 0xd5cc95, .73, heavy ? .56 : .28, side * .22, .055, .23, .055, 0, 0, -Math.PI / 2 - side * .2);
        for (var n = 0; n < 3; n++) {
          var list = (n + (side > 0 ? 1 : 0)) % 2 ? legsA : legsB;
          part(list, self.cylinder, skin, -.32 + n * .31, .25, side * .44, .065, .46, .065, side * .9, 0, -.3 + n * .3);
          part(list, self.cone, armor, -.28 + n * .33, .10, side * .69, .07, .38, .065, side * .55, 0, -.35 + n * .25);
        }
      });
      for (var n = 0; n < 4; n++) part(body, self.cone, armor, -.45 + n * .25, heavy ? 1.22 : .75, 0, .11, heavy ? .4 : .24, .13, 0, 0, .4);
      if (spit) { part(body, self.sphere, 0xb2cb56, -.38, .59, 0, .38, .4, .4); part(body, self.cone, 0x476534, .85, .39, 0, .16, .3, .16, 0, 0, -Math.PI / 2); }
      if (runner) part(body, self.cone, 0x6a543d, -.87, .28, 0, .23, .9, .25, 0, 0, Math.PI / 2 + .2);
      if (heavy) for (n = 0; n < 3; n++) part(body, self.box, 0x5f6657, -.35 + n * .3, 1.05, 0, .2, .12, .89, 0, 0, .1);
      if (type === 'boss') {
        [-1, 1].forEach(function (side) { part(body, self.cone, 0xa79b67, .23, 1.16, side * .51, .13, .76, .13, side * .6, 0, -.35); part(body, self.sphere, 0xb9be48, -.46, .92, side * .26, .22, .23, .22); });
      }
      self.monsters[type] = { body: self.pool(self.geometry(merge(body)), self.skin, 110), legsA: self.pool(self.geometry(merge(legsA)), self.skin, 110), legsB: self.pool(self.geometry(merge(legsB)), self.skin, 110), corpses: self.pool(self.geometry(merge(body.concat(legsA, legsB))), self.skin, 48) };
    });
    this.shadows = this.pool(this.plane, this.shadowMaterial, 128);
    this.playerRings = this.pool(this.ring, this.material({ color: 0xffffff, transparent: true, opacity: .8, depthWrite: false }, true), 2);
    this.pickupBodies = this.pool(this.box, this.material({ color: 0xffffff, shininess: 50 }), 60);
    this.pickupMarks = this.pool(this.box, this.material({ color: 0xffffff }, true), 120);
    this.pickupGlows = this.pool(this.plane, this.glowMaterial, 60);
    this.barrelBodies = this.pool(this.cylinder, this.material({ color: 0x947247, shininess: 30 }), 32);
    this.barrelBands = this.pool(this.cylinder, this.material({ color: 0x262f2c, shininess: 45 }), 64);
    this.doors = this.pool(this.box, this.metal, 20);
    this.doorBars = this.pool(this.box, this.material({ color: 0xe6a052 }, true), 20);
    this.objectiveRings = this.pool(this.ring, this.material({ color: 0xffffff, transparent: true, opacity: .8, depthWrite: false }, true), 8);
    this.objectiveGlows = this.pool(this.plane, this.glowMaterial, 8);
    this.muzzleFlashes = this.pool(this.sphere, this.material({ color: 0xffe39a }, true), 2);
    this.grenadeBodies = this.pool(this.sphere, this.material({ color: 0x617545, shininess: 30 }), 20);
  };
  Renderer.prototype.buildEffects = function () {
    this.decals = this.pool(this.plane, this.decalMaterial, 180);
    // Blast soot has a soft radial falloff; blood keeps its irregular splatter
    // silhouette. Sharing the blood mask made large burns look like petals.
    this.scorches = this.pool(this.plane, this.material({ map: this.shadowTexture, color: 0xffffff, transparent: true, opacity: .85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }, true), 180);
    this.tracerPositions = new Float32Array(512 * 6); this.tracerColors = new Float32Array(512 * 6);
    this.tracerGeometry = this.geometry(new T.BufferGeometry()); this.tracerGeometry.setAttribute('position', new T.BufferAttribute(this.tracerPositions, 3).setUsage(T.DynamicDrawUsage)); this.tracerGeometry.setAttribute('color', new T.BufferAttribute(this.tracerColors, 3).setUsage(T.DynamicDrawUsage));
    var material = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .95 }); this.materials.push(material); this.tracers = new T.LineSegments(this.tracerGeometry, material); this.tracers.frustumCulled = false; this.dynamic.add(this.tracers);
    this.effectPositions = new Float32Array(360 * 3); this.effectColors = new Float32Array(360 * 3);
    this.effectGeometry = this.geometry(new T.BufferGeometry()); this.effectGeometry.setAttribute('position', new T.BufferAttribute(this.effectPositions, 3).setUsage(T.DynamicDrawUsage)); this.effectGeometry.setAttribute('color', new T.BufferAttribute(this.effectColors, 3).setUsage(T.DynamicDrawUsage));
    material = new T.PointsMaterial({ map: this.glowTexture, size: .4, transparent: true, blending: T.AdditiveBlending, depthWrite: false, vertexColors: true }); this.materials.push(material); this.effects = new T.Points(this.effectGeometry, material); this.effects.frustumCulled = false; this.dynamic.add(this.effects);
    this.explosions = this.pool(this.sphere, this.material({ color: 0xff9b43, transparent: true, opacity: .55, depthWrite: false }, true), 24);
  };
  Renderer.prototype.clearWorld = function () { while (this.world.children.length) this.world.remove(this.world.children[0]); this.worldGeometries.forEach(function (g) { g.dispose(); }); this.worldGeometries = []; };
  Renderer.prototype.batch = function (parts, material, projection) {
    if (!parts.length) return;
    var g = merge(parts, projection); this.worldGeometries.push(g); var mesh = new T.Mesh(g, material); this.world.add(mesh); return mesh;
  };
  Renderer.prototype.setMap = function (map, stage) {
    if (this.map === map && this.stage === stage) return;
    this.clearWorld(); this.corpses = []; this.mapChanged = true; this.map = map; this.stage = clamp(stage || 0, 0, 2);
    var p = PALETTES[this.stage], self = this, floor = [], metal = [], matte = [], glow = [], shadows = [], glass = [], w = map.width || 48, h = map.height || 34;
    this.scene.background.setHex(p.shadow); this.keyLight.color.setHex(this.stage === 1 ? 0xc9e7e3 : 0xffe5c3);
    part(floor, this.box, 0xffffff, w / 2, -.13, h / 2, w, .2, h); this.batch(floor, this.floors[this.stage], 6);
    // Wall sections include coping, recessed panels, vertical supports and pipes.
    (map.solids || []).forEach(function (s, index) {
      var sx = s.w || 1, sz = s.h || 1, x = s.x + sx / 2, z = s.y + sz / 2, type = s.type;
      if (type === 'crate') {
        var cols = Math.max(1, Math.round(sx / 1.5)), rows = Math.max(1, Math.round(sz / 1.5)), cw = sx / cols, ch = sz / rows;
        for (var ci = 0; ci < cols; ci++) for (var cj = 0; cj < rows; cj++) {
          var bx = s.x + (ci + .5) * cw, bz = s.y + (cj + .5) * ch, ht = .85 + ((ci + cj * 3 + index) % 3) * .19, crateColor = self.stage === 1 ? 0x617c78 : (ci + cj) % 2 ? 0x746b54 : 0x67715c;
          part(metal, self.box, crateColor, bx, ht / 2, bz, cw - .045, ht, ch - .045);
          part(matte, self.box, 0x24352d, bx, ht + .02, bz, cw - .16, .04, ch - .16);
          part(metal, self.box, crateColor, bx, ht + .045, bz, cw - .26, .035, ch - .26);
          for (var side = -1; side <= 1; side += 2) {
            part(metal, self.box, 0x89917a, bx + side * cw * .36, ht / 2 + .04, bz, .06, ht + .08, ch - .04);
            part(metal, self.box, 0x8c937e, bx, ht / 2 + .04, bz + side * ch * .37, cw - .04, ht + .08, .05);
          }
          part(matte, self.box, 0xc3be91, bx, ht + .07, bz, cw * .27, .015, ch * .18);
          part(matte, self.box, 0x3f493b, bx, ht + .08, bz, cw * .18, .012, ch * .045);
          for (var bolt = 0; bolt < 4; bolt++) part(metal, self.box, 0x172c25, bx + (bolt % 2 ? 1 : -1) * cw * .36, ht + .087, bz + (bolt < 2 ? 1 : -1) * ch * .37, .045, .015, .045);
          for (var stripe = 0; stripe < 4; stripe++) part(matte, self.box, stripe % 2 ? 0x17221a : 0xba9a4d, bx - cw * .3 + stripe * .095, ht + .09, bz - ch * .3, .07, .012, .14, 0, -.3);
        }
      } else if (type === 'tank') {
        part(metal, self.cylinder, 0x71847e, x, .78, z, sx * .47, 1.56, sz * .47);
        part(matte, self.cylinder, 0x2e403b, x, .18, z, sx * .5, .18, sz * .5);
        part(metal, self.cylinder, 0xb0c0b3, x, 1.51, z, sx * .5, .12, sz * .5);
        part(glow, self.box, p.light, x + sx * .43, .86, z, .035, .58, .09);
        if (self.stage === 2) {
          part(matte, self.cylinder, 0x253637, x, 1.63, z, sx * .32, .18, sz * .32);
          part(glow, self.cylinder, 0xdd985a, x, 1.74, z, sx * .19, .035, sz * .19);
          for (var ring = 0; ring < 3; ring++) part(metal, self.torus, 0xa69b73, x, .53 + ring * .4, z, sx * .48, sz * .48, 1, Math.PI / 2);
        } else if (self.stage === 1) {
          part(glass, self.cylinder, 0xffffff, x, 1.93, z, sx * .27, .75, sz * .27);
          part(glow, self.sphere, 0x83c5a1, x, 1.9, z, sx * .13, .36, sz * .13);
          part(metal, self.cylinder, 0x587b73, x, 2.33, z, sx * .3, .08, sz * .3);
        }
      } else {
        var tall = Math.min(1.45, .95 + ((index % 3) * .12));
        part(metal, self.box, self.stage === 1 ? 0x667e7d : 0x4b5d58, x, tall / 2, z, sx, tall, sz);
        part(matte, self.box, 0x293734, x, .12, z, sx + .08, .24, sz + .08);
        part(metal, self.box, 0x4c5953, x, tall + .035, z, sx + .12, .07, sz + .12);
        var length = Math.max(sx, sz), horizontal = sx > sz;
        part(matte, self.box, 0x1c2c26, x, tall + .076, z, horizontal ? sx : .1, .015, horizontal ? .1 : sz);
        for (var n = .35; n < length; n += 2.6) {
          var px = horizontal ? s.x + n : x, pz = horizontal ? z : s.y + n;
          part(metal, self.box, 0x364b48, px, tall * .55, pz, horizontal ? .12 : sx + .06, tall, horizontal ? sz + .06 : .12);
        }
        if (index % 3 === 0 && length > 3) part(glow, self.box, p.light, x, tall + .08, z, horizontal ? Math.min(1.5, sx) : .08, .025, horizontal ? .08 : Math.min(1.5, sz));
      }
      part(shadows, self.plane, 0xffffff, x + .18, .006, z + .25, sx + 1, sz + 1, 1, -Math.PI / 2);
    });
    (map.props || []).forEach(function (o, index) {
      var x = o.x, z = o.y, a = o.angle || 0;
      if (o.type === 'console') self.consoleParts(metal, matte, glow, x, z, a, p.light);
      else if (o.type === 'pipe') {
        part(metal, self.cylinder, 0x697b75, x, .34, z, .18, 2.4, .18, Math.PI / 2, -a, 0);
        [-.8, .8].forEach(function (off) { part(matte, self.cylinder, 0x263733, x, .34, z + off, .23, .1, .23, Math.PI / 2); });
      } else if (o.type === 'rack') {
        part(matte, self.box, 0x1f302d, x, .8, z, 1.2, 1.6, .65, 0, -a);
        for (var i = 0; i < 5; i++) { part(metal, self.box, 0x75877d, x, .25 + i * .27, z + .34, 1.08, .18, .05); part(glow, self.box, i % 2 ? 0xddbd60 : p.light, x - .4, .25 + i * .27, z + .38, .07, .045, .025); }
      } else if (o.type === 'tank') {
        part(metal, self.cylinder, 0x819e96, x, .12, z, .6, .24, .6); part(metal, self.cylinder, 0x819e96, x, 1.7, z, .6, .18, .6);
        part(glass, self.cylinder, 0xffffff, x, .95, z, .53, 1.45, .53);
        part(glow, self.sphere, self.stage === 1 ? 0x87bc61 : 0xd4c37a, x, .9, z, .28, .54, .28);
        [-1, 1].forEach(function (side) { part(metal, self.box, 0x47645b, x + side * .5, .95, z, .06, 1.5, .06); });
      } else if (o.type === 'vent') {
        part(metal, self.box, 0x243532, x, .03, z, 1.25, .06, .85);
        for (i = 0; i < 8; i++) part(metal, self.box, 0x9eaaa0, x - .49 + i * .14, .07, z, .045, .03, .72);
      } else if (o.type === 'warning') {
        for (i = 0; i < 8; i++) part(matte, self.box, i % 2 ? 0x202b27 : p.trim, x - .9 + i * .25, .024, z, .24, .025, .42, 0, -.2);
      } else if (o.type === 'cable') {
        for (i = 0; i < 5; i++) part(matte, self.cylinder, 0x182825, x + Math.sin(i * .6) * .15, .04, z + i * .34, .035, .5, .035, Math.PI / 2, i * .08);
      }
    });
    (map.objectives || []).forEach(function (o) { self.consoleParts(metal, matte, glow, o.x, o.y, 0, p.light); });
    // Floor lanes and tiny inset warning rectangles guide movement through rooms.
    for (var q = 0; q < 3; q++) {
      var cx = w * (q + .5) / 3;
      for (var k = 0; k < 8; k++) part(matte, this.box, p.trim, cx - 2.4 + k * .68, .018, 3.5, .42, .012, .14);
      part(matte, this.box, 0x9da99c, cx, .016, h - 3, 3.8, .01, .055);
    }
    if (map.exit) {
      for (q = -1; q <= 1; q++) { part(glow, this.box, 0x77b99a, map.exit.x + q * .5, .025, map.exit.y, .08, .025, 1.35); }
    }
    this.batch(shadows, this.shadowMaterial); this.batch(metal, this.metal, 2.4); this.batch(matte, this.matte); this.batch(glow, this.glowing); this.batch(glass, this.glass);
    var labels = [], labelPlane = new T.PlaneBufferGeometry(8, 2.2), uv = labelPlane.attributes.uv;
    for (q = 0; q < uv.count; q++) uv.setY(q, (1 - this.stage / 3) - (1 - uv.getY(q)) / 3);
    part(labels, labelPlane, 0xffffff, w / 2, .021, h / 2, 1, 1, 1, -Math.PI / 2); this.batch(labels, this.stencilMaterial); labelPlane.dispose();
    var glows = [], fixtures = [];
    for (var lampY = 4; lampY < h - 2; lampY += 7) {
      [1.1, w - 1.1].forEach(function (lampX) {
        part(fixtures, self.box, self.stage === 1 ? 0x8ddbd7 : 0xf1be77, lampX, .88, lampY, .12, .12, .65);
        part(glows, self.plane, self.stage === 1 ? 0x71b9cf : 0xd8a365, lampX, .018, lampY, 5.6, 5.6, 1, -Math.PI / 2);
      });
    }
    this.batch(fixtures, this.glowing);
    (map.lights || []).forEach(function (light) { part(glows, self.plane, light.color ? new T.Color(light.color).getHex() : p.light, light.x, .012, light.y, 4.2, 4.2, 1, -Math.PI / 2); });
    this.batch(glows, this.glowMaterial);
    this.cameraCenter.x = map.spawn ? map.spawn.x : w / 2; this.cameraCenter.y = map.spawn ? map.spawn.y : h / 2;
  };
  Renderer.prototype.consoleParts = function (metal, matte, glow, x, z, angle, color) {
    part(metal, this.box, 0x60766f, x, .45, z, .95, .9, .65, 0, -angle);
    part(matte, this.box, 0x142925, x, 1, z, .91, .08, .62, .32, -angle);
    part(glow, this.box, color, x, 1.055, z - .04, .6, .015, .26, .32, -angle);
    for (var n = 0; n < 3; n++) part(glow, this.box, n ? 0xecc370 : 0x83ca9e, x - .25 + n * .22, 1.01, z + .2, .08, .025, .055, .32, -angle);
  };
  Renderer.prototype.updateCamera = function (game, dt) {
    var active = (game.players || []).filter(function (p) { return p.active && (p.alive || p.downed); }), map = game.map || {}, x = this.cameraCenter.x, y = this.cameraCenter.y, span = 0;
    if (active.length) { x = active.reduce(function (n, p) { return n + p.x; }, 0) / active.length; y = active.reduce(function (n, p) { return n + p.y; }, 0) / active.length; if (active.length > 1) span = Math.max(Math.abs(active[0].x - active[1].x) / (this.width / this.height), Math.abs(active[0].y - active[1].y) * .8); }
    var maxView = Math.max(32, (map.height || 34) * 1.3, (map.width || 48) / (this.width / this.height) + 12);
    var wanted = clamp(17 + span, 18, maxView), lerp = game.phase === 'title' ? 1 : 1 - Math.exp(-Math.max(dt, .001) * 7);
    this.viewHeight += (wanted - this.viewHeight) * lerp; this.cameraCenter.x += (x - this.cameraCenter.x) * lerp; this.cameraCenter.y += (y - this.cameraCenter.y) * lerp;
    var halfY = this.viewHeight / 2, halfX = halfY * this.width / this.height;
    var centerX = clamp(this.cameraCenter.x, Math.min(halfX - 1, (map.width || 48) / 2), Math.max((map.width || 48) - halfX + 1, (map.width || 48) / 2));
    var centerY = clamp(this.cameraCenter.y, Math.min(halfY * 1.15 - 1, (map.height || 34) / 2), Math.max((map.height || 34) - halfY * 1.15 + 1, (map.height || 34) / 2));
    this.camera.left = -halfX; this.camera.right = halfX; this.camera.top = halfY; this.camera.bottom = -halfY; this.camera.updateProjectionMatrix();
    this.camera.position.set(centerX, 40, centerY + 30); this.camera.lookAt(centerX, 0, centerY); this.camera.updateMatrixWorld();
  };
  Renderer.prototype.updateActors = function (game) {
    var self = this, shadowCount = 0, soldierCount = 0, legs = 0, muzzleCount = 0, attachments = { shotgun: 0, minigun: 0, plasma: 0 };
    (game.players || []).forEach(function (p) {
      if (!p.active) return;
      var index = soldierCount++, a = finite(p.angle, 0), movement = p.moving ? 1 : 0, wave = Math.sin(self.time * 15 + p.id), scale = p.downed || !p.alive ? .45 : 1;
      self.setInstance(self.soldiers, index, p.x, 0, p.y, 1, scale, 1, a, p.id === 2 ? 0xbad1ec : 0xe5e9cd);
      self.setInstance(self.guns, index, p.x, 0, p.y, p.weapon === 'minigun' ? 1.25 : p.weapon === 'pistol' ? .72 : 1, scale, 1, a);
      if (self.weaponParts[p.weapon]) self.setInstance(self.weaponParts[p.weapon], attachments[p.weapon]++, p.x, 0, p.y, 1, scale, 1, a);
      [-1, 1].forEach(function (side) {
        var stride = wave * .13 * (movement ? 1 : 0) * side, ox = Math.cos(a) * stride - Math.sin(a) * side * .14, oz = Math.sin(a) * stride + Math.cos(a) * side * .14;
        self.setInstance(self.soldierLegs, legs++, p.x + ox, Math.max(0, wave * side) * .06 * (movement ? 1 : 0), p.y + oz, 1, scale, 1, a);
      });
      self.setInstance(self.shadows, shadowCount++, p.x, .008, p.y + .07, 1.5, 1.15, 1, 0, undefined, -Math.PI / 2);
      self.setInstance(self.playerRings, index, p.x, .022, p.y, .68, .68, .68, 0, p.downed ? 0xf07a5c : p.id === 2 ? 0x74b6ed : 0xc4d99a, -Math.PI / 2);
      if (p.fireFlash > 0 && p.alive) { var length = p.weapon === 'pistol' ? .85 : 1.16; self.setInstance(self.muzzleFlashes, muzzleCount++, p.x + Math.cos(a) * length, 1.02, p.y + Math.sin(a) * length, .22 + Math.sin(self.time * 91) * .08, .12, .12, a); }
    });
    Object.keys(attachments).forEach(function (type) { self.finishPool(self.weaponParts[type], attachments[type]); });
    this.finishPool(this.soldiers, soldierCount); this.finishPool(this.guns, soldierCount); this.finishPool(this.soldierLegs, legs); this.finishPool(this.playerRings, soldierCount); this.finishPool(this.muzzleFlashes, muzzleCount);
    var counts = { crawler: 0, runner: 0, spitter: 0, brute: 0, boss: 0 };
    (game.enemies || []).slice(0, 110).forEach(function (e) {
      var type = self.monsters[e.type] ? e.type : 'crawler', pool = self.monsters[type], i = counts[type]++, a = finite(e.angle, 0), size = Math.max(.4, finite(e.radius, .5) / .5), stride = Math.sin(self.time * (type === 'runner' ? 20 : 12) + e.id * 1.7), color = e.hitFlash > 0 ? 0xffddc1 : 0xffffff;
      self.setInstance(pool.body, i, e.x, Math.abs(stride) * .035 * size, e.y, size, size, size, a, color);
      self.setInstance(pool.legsA, i, e.x + Math.cos(a) * stride * .09 * size, Math.max(0, stride) * .08 * size, e.y + Math.sin(a) * stride * .09 * size, size, size, size, a, color);
      self.setInstance(pool.legsB, i, e.x - Math.cos(a) * stride * .09 * size, Math.max(0, -stride) * .08 * size, e.y - Math.sin(a) * stride * .09 * size, size, size, size, a, color);
      if (shadowCount < 128) self.setInstance(self.shadows, shadowCount++, e.x, .009, e.y + .08, size * 1.8, size * 1.25, 1, a, undefined, -Math.PI / 2);
    });
    Object.keys(counts).forEach(function (type) { var p = self.monsters[type]; self.finishPool(p.body, counts[type]); self.finishPool(p.legsA, counts[type]); self.finishPool(p.legsB, counts[type]); });
    this.finishPool(this.shadows, shadowCount);
    if (this.mapChanged) { this.lastDeathEvent = finite(game.eventSerial, 0); this.mapChanged = false; }
    (game.events || []).forEach(function (event) {
      if (event.id <= self.lastDeathEvent) return;
      if (event.kind === 'enemy-death') self.corpses.push({ id: event.id, type: event.enemyType || 'crawler', x: event.x, y: event.y, angle: (event.id * 1.78) % TAU, created: self.time });
      self.lastDeathEvent = Math.max(self.lastDeathEvent, event.id);
    });
    this.corpses = this.corpses.filter(function (c) { return self.time - c.created < 120; }).slice(-48);
    var deadCounts = { crawler: 0, runner: 0, spitter: 0, brute: 0, boss: 0 };
    this.corpses.forEach(function (c) { var type = self.monsters[c.type] ? c.type : 'crawler', spec = root.AlienShooterWorld && root.AlienShooterWorld.enemyTypes[type], size = (spec ? spec.radius : .46) / .5; self.setInstance(self.monsters[type].corpses, deadCounts[type]++, c.x, .015, c.y, size * 1.08, size * .22, size, c.angle, 0x82916e); });
    Object.keys(deadCounts).forEach(function (type) { self.finishPool(self.monsters[type].corpses, deadCounts[type]); });
  };
  Renderer.prototype.updateObjects = function (game) {
    var self = this, bodies = 0, marks = 0, colors = { health: 0xf28e78, armor: 0x73b7cf, ammo: 0xd6bd70, credits: 0xf1d68a, grenade: 0x9dbc6c };
    (game.pickups || []).slice(0, 60).forEach(function (p) {
      var i = bodies++, color = colors[p.type] || 0xffffff, hover = .28 + Math.sin(self.time * 3 + p.id) * .055;
      self.setInstance(self.pickupBodies, i, p.x, hover, p.y, .4, .25, .32, .15, color);
      self.setInstance(self.pickupGlows, i, p.x, .025, p.y, 1.3, 1.3, 1, 0, color, -Math.PI / 2);
      if (p.type === 'health') { self.setInstance(self.pickupMarks, marks++, p.x, hover + .135, p.y, .08, .018, .24, 0, 0xffffff); self.setInstance(self.pickupMarks, marks++, p.x, hover + .14, p.y, .24, .018, .08, 0, 0xffffff); }
      else self.setInstance(self.pickupMarks, marks++, p.x, hover + .135, p.y, .26, .018, .06, 0, 0xf1eee0);
    });
    this.finishPool(this.pickupBodies, bodies); this.finishPool(this.pickupGlows, bodies); this.finishPool(this.pickupMarks, marks);
    var count = 0;
    ((game.map || {}).barrels || []).slice(0, 32).forEach(function (b) { if (b.exploded || b.hp <= 0) return; var i = count++; self.setInstance(self.barrelBodies, i, b.x, .53, b.y, .43, 1.06, .43, 0); [-1, 1].forEach(function (s, n) { self.setInstance(self.barrelBands, i * 2 + n, b.x, .53 + s * .31, b.y, .445, .06, .445, 0); }); });
    this.finishPool(this.barrelBodies, count); this.finishPool(this.barrelBands, count * 2);
    count = 0;
    ((game.map || {}).doors || []).slice(0, 20).forEach(function (d) {
      if (d.open) return;
      var i = count++, x = d.x + d.w / 2, z = d.y + d.h / 2;
      self.setInstance(self.doors, i, x, .65, z, d.w, 1.3, d.h, 0, 0x71857b);
      self.setInstance(self.doorBars, i, x, 1.32, z, d.w > d.h ? d.w * .78 : .08, .035, d.h > d.w ? d.h * .78 : .08, 0);
    });
    this.finishPool(this.doors, count); this.finishPool(this.doorBars, count);
    count = 0;
    ((game.map || {}).objectives || []).slice(0, 8).forEach(function (o) {
      var i = count++, color = o.status === 'done' ? 0x8cd39a : o.status === 'locked' ? 0x6d7e75 : o.status === 'defending' ? 0xf1a864 : 0x88d6d4;
      self.setInstance(self.objectiveRings, i, o.x, .03, o.y, 1.1, 1.1, 1.1, 0, color, -Math.PI / 2);
      self.setInstance(self.objectiveGlows, i, o.x, .02, o.y, 2.6 + Math.sin(self.time * 2) * .12, 2.6 + Math.sin(self.time * 2) * .12, 1, 0, color, -Math.PI / 2);
    });
    this.finishPool(this.objectiveRings, count); this.finishPool(this.objectiveGlows, count);
    count = 0;
    (game.grenades || []).slice(0, 20).forEach(function (g) { var t = clamp((g.age || 0) / (g.fuse || 1.2), 0, 1); self.setInstance(self.grenadeBodies, count++, g.x, .15 + Math.sin(t * Math.PI) * .8, g.y, .13, .16, .13, self.time * 8); }); this.finishPool(this.grenadeBodies, count);
  };
  Renderer.prototype.updateEffects = function (game) {
    var self = this, count = 0, scorchCount = 0;
    (game.decals || []).slice(-180).forEach(function (d, index) {
      var size = finite(d.size, 1), scorch = d.type === 'scorch';
      self.setInstance(scorch ? self.scorches : self.decals, scorch ? scorchCount++ : count++, d.x, .013 + index * .00001, d.y, size, size, 1, finite(d.angle, 0), scorch ? 0xffffff : 0x4f662d, -Math.PI / 2);
    });
    this.finishPool(this.decals, count); this.finishPool(this.scorches, scorchCount);
    count = 0;
    (game.bullets || []).slice(0, 512).forEach(function (b) {
      var i = count++ * 6, vx = finite(b.vx, 0), vy = finite(b.vy, 0), speed = Math.hypot(vx, vy) || 1, length = b.enemy ? .3 : b.type === 'plasma' ? .75 : .65, color = b.enemy ? 0xb8e463 : b.type === 'plasma' ? 0x78dbe6 : 0xffda86;
      self.tracerPositions[i] = b.x - vx / speed * length; self.tracerPositions[i + 1] = b.enemy ? .4 : .96; self.tracerPositions[i + 2] = b.y - vy / speed * length;
      self.tracerPositions[i + 3] = b.x; self.tracerPositions[i + 4] = b.enemy ? .4 : .96; self.tracerPositions[i + 5] = b.y;
      self.color.setHex(color).convertSRGBToLinear(); for (var j = 0; j < 2; j++) { self.tracerColors[i + j * 3] = self.color.r; self.tracerColors[i + j * 3 + 1] = self.color.g; self.tracerColors[i + j * 3 + 2] = self.color.b; }
    });
    this.tracerGeometry.setDrawRange(0, count * 2); this.tracerGeometry.attributes.position.needsUpdate = true; this.tracerGeometry.attributes.color.needsUpdate = true; this.tracers.visible = count > 0;
    count = 0; var explosions = 0;
    (game.particles || []).slice(0, 360).forEach(function (p) {
      var ratio = clamp(finite(p.life, 0) / Math.max(.01, finite(p.maxLife, 1)), 0, 1);
      if (p.type === 'explosion' && explosions < 24) { var size = finite(p.size, 1) * (.25 + (1 - ratio) * .8); self.setInstance(self.explosions, explosions++, p.x, .32 + size * .3, p.y, size, size * .55, size, 0, ratio > .55 ? 0xffde87 : 0xca632d); }
      var i = count++ * 3, color = p.color || (p.type === 'blood' ? 0x87a756 : p.type === 'acid' ? 0xb4e668 : 0xffb467);
      self.effectPositions[i] = p.x; self.effectPositions[i + 1] = p.type === 'blood' ? .16 : .2 + (1 - ratio) * .7; self.effectPositions[i + 2] = p.y;
      self.color.set(color).convertSRGBToLinear().multiplyScalar(ratio); self.effectColors[i] = self.color.r; self.effectColors[i + 1] = self.color.g; self.effectColors[i + 2] = self.color.b;
    });
    this.effectGeometry.setDrawRange(0, count); this.effectGeometry.attributes.position.needsUpdate = true; this.effectGeometry.attributes.color.needsUpdate = true; this.effects.visible = count > 0; this.finishPool(this.explosions, explosions);
  };
  Renderer.prototype.resize = function (width, height) {
    if (this.disposed) return; width = Math.max(1, finite(width, 1280)); height = Math.max(1, finite(height, 720));
    var scale = Math.min(1, 1600 / width, 1000 / height); this.width = Math.round(width * scale); this.height = Math.round(height * scale);
    if (this.renderer) this.renderer.setSize(this.width, this.height, false);
  };
  Renderer.prototype.screenToWorld = function (nx, ny) {
    if (!this.camera || this.disposed) return null;
    this.raycaster.setFromCamera(new T.Vector2(clamp(nx, 0, 1) * 2 - 1, 1 - clamp(ny, 0, 1) * 2), this.camera);
    return this.raycaster.ray.intersectPlane(this.groundPlane, this.hitPoint) ? { x: this.hitPoint.x, y: this.hitPoint.z } : null;
  };
  Renderer.prototype.render = function (game, dt) {
    if (this.failed || this.disposed || this.contextLost || !game || !game.map) return;
    dt = clamp(finite(dt, 1 / 60), 0, .1); if (game.phase === 'playing' || game.phase === 'title') this.time += dt;
    this.setMap(game.map, game.stage); this.updateCamera(game, dt); this.updateActors(game); this.updateObjects(game); this.updateEffects(game);
    this.renderer.render(this.scene, this.camera); this.active = true;
    this.stats.calls = this.renderer.info.render.calls; this.stats.triangles = this.renderer.info.render.triangles; this.stats.frames++;
  };
  Renderer.prototype.dispose = function () {
    if (this.disposed) return; this.disposed = true; this.active = false;
    this.canvas.removeEventListener('webglcontextlost', this._lost); this.canvas.removeEventListener('webglcontextrestored', this._restored);
    if (this.world) this.clearWorld(); this.geometries.forEach(function (g) { g.dispose(); }); this.materials.forEach(function (m) { m.dispose(); }); this.textures.forEach(function (t) { t.dispose(); });
    if (this.renderer) { this.renderer.dispose(); if (this.renderer.forceContextLoss) this.renderer.forceContextLoss(); }
  };
  root.AlienShooterRenderer = Renderer;
})(typeof window !== 'undefined' ? window : this);
