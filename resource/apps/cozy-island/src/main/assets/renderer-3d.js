/* Original rounded 3D island art. Three r124, explicitly WebGL 1, local assets only. */
(function (root) {
  'use strict';
  var T = root.THREE, W = root.CozyIslandWorld;
  if (!T || !W) return;
  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  class CozyIsland3DRenderer {
    constructor() {
      this.canvas = document.createElement('canvas');
      var attributes = { alpha: false, antialias: true, depth: true, stencil: false, preserveDrawingBuffer: false };
      var context = this.canvas.getContext('webgl', attributes);
      if (!context) throw new Error('WebGL 1 unavailable');
      this.context = context;
      try {
      this.renderer = new T.WebGLRenderer({ canvas: this.canvas, context: context, antialias: true });
      this.renderer.outputEncoding = T.sRGBEncoding;
      this.renderer.toneMapping = T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = T.PCFSoftShadowMap;
      this.renderer.autoClear = false;
      this.renderer.setPixelRatio(1);
      this.scene = new T.Scene();
      this.scene.fog = new T.Fog('#b4dedb', 26, 66);
      this.outdoors = new T.Group(); this.home = new T.Group();
      this.scene.add(this.outdoors, this.home);
      this.materials = {}; this.geometries = {}; this.textures = [];
      this.views = []; this.cameras = []; this.follow = [];
      this.playerMeshes = {}; this.insectMeshes = {}; this.nodeMeshes = {};
      this.decorationMeshes = {}; this.ghosts = {}; this.residents = [];
      this.furnitureTemplates = {};
      this.lost = false; this.disposed = false; this.split = false;
      this.onLost = event => { event.preventDefault(); this.lost = true; };
      this.onRestored = () => { if (!this.disposed) this.lost = false; };
      this.canvas.addEventListener('webglcontextlost', this.onLost);
      this.canvas.addEventListener('webglcontextrestored', this.onRestored);
      this.hemisphere = new T.HemisphereLight('#d7f0ff', '#82975b', .72);
      this.sun = new T.DirectionalLight('#fff1d4', 1.3);
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(1024, 1024);
      this.sun.shadow.camera.near = .5; this.sun.shadow.camera.far = 48;
      this.sun.shadow.camera.left = this.sun.shadow.camera.bottom = -13;
      this.sun.shadow.camera.right = this.sun.shadow.camera.top = 13;
      this.sun.shadow.bias = -.0006; this.sun.shadow.normalBias = .025;
      this.sun.shadow.radius = 3;
      this.scene.add(this.hemisphere, this.sun, this.sun.target);
      this.makeMaterials(); this.makeIsland(); this.makeHome();
      [1, 2].forEach(id => {
        var mesh = this.avatar(id); this.playerMeshes[id] = mesh; this.scene.add(mesh);
        var ghost = new T.Group(); this.ghosts[id] = ghost; this.scene.add(ghost);
      });
      W.insects.forEach(species => {
        var mesh = this.insect(species); this.insectMeshes[species.id] = mesh; this.outdoors.add(mesh);
      });
      } catch (error) { this.dispose(); throw error; }
    }
    material(name, color, roughness) {
      if (!this.materials[name]) {
        var material = new T.MeshStandardMaterial({ color: color, roughness: roughness === undefined ? .82 : roughness, metalness: 0 });
        material.color.convertSRGBToLinear(); material.name = name; this.materials[name] = material;
      }
      return this.materials[name];
    }
    makeMaterials() {
      var palette = {
        cream: '#fff1d6', white: '#fffdf0', wood: '#ab754a', timber: '#deb883', bark: '#885737',
        leaf: '#5d9e46', leafLight: '#8ac357', leafDark: '#438153', grass: '#669b42', sand: '#e5cf9d',
        path: '#e5c994', rock: '#a7b0a4', rockLight: '#c7cbb8', peach: '#f5a285', peachLight: '#ffd4aa',
        mint: '#75ada3', coral: '#df8e6d', glass: '#93d8df', gold: '#e8b75a', soil: '#72573f',
        pink: '#ed99b2', yellow: '#ffe089', violet: '#b7a0d8', stem: '#5f994b', dark: '#3e4742',
        skin: '#edba90', hair: '#664734', blueHair: '#3d5558', shirt1: '#e58a6d', shirt2: '#6caec6',
        trousers: '#557a8a', shoe: '#e5d9bb', wall: '#f7e7c7', floor: '#d6ad78', floorLight: '#e4c28b'
      };
      Object.keys(palette).forEach(name => this.material(name, palette[name]));
      this.materials.glass.roughness = .24;
      this.materials.gold.roughness = .35; this.materials.gold.metalness = .25;
      this.material('lampGlow', '#fff3ad');
      this.materials.lampGlow.emissive.set('#ffd46a').convertSRGBToLinear();
      this.materials.lampGlow.emissiveIntensity = .6;
      this.materials.grass.map = this.surfaceTexture('grass');
      this.materials.sand.map = this.surfaceTexture('sand');
      this.materials.path.map = this.materials.sand.map;
    }
    surfaceTexture(kind) {
      var canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
      var c = canvas.getContext('2d'); c.fillStyle = '#ffffff'; c.fillRect(0, 0, 128, 128);
      // Small neutral fibers/grains modulate a lit 3D surface, not screen-space art.
      var seed = 27;
      for (var i = 0; i < 900; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0; var x = seed % 128;
        seed = (seed * 1664525 + 1013904223) >>> 0; var y = seed % 128;
        c.fillStyle = i % 3 ? 'rgba(89,98,66,.065)' : 'rgba(113,107,78,.12)';
        c.fillRect(x, y, kind === 'grass' ? 1 : 1.5, kind === 'grass' ? 3 : 1.5);
      }
      var texture = new T.CanvasTexture(canvas); texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.repeat.set(kind === 'grass' ? 9 : 7, kind === 'grass' ? 9 : 7);
      texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
      this.textures.push(texture); return texture;
    }
    geometry(kind) {
      if (!this.geometries[kind]) {
        var g;
        if (kind === 'sphere') g = new T.SphereBufferGeometry(1, 20, 14);
        else if (kind === 'smallSphere') g = new T.SphereBufferGeometry(1, 12, 8);
        else if (kind === 'petal') g = new T.SphereBufferGeometry(1, 8, 6);
        else if (kind === 'smallCylinder') g = new T.CylinderBufferGeometry(1, 1, 1, 8);
        else if (kind === 'cylinder') g = new T.CylinderBufferGeometry(1, 1, 1, 16);
        else if (kind === 'cone') g = new T.ConeBufferGeometry(1, 1, 24);
        else if (kind === 'rock') {
          g = new T.IcosahedronBufferGeometry(1, 2);
          var positions = g.attributes.position;
          for (var i = 0; i < positions.count; i++) {
            var x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i), noise = 1 + .075 * Math.sin(x * 8 + z * 3) * Math.cos(y * 7);
            positions.setXYZ(i, x * noise, y * noise, z * noise);
          }
          g.computeVertexNormals();
        } else {
          // Beveled cube with analytic normals; scaling gives softly rounded
          // walls, clothing, shoes, planks and furniture without extra assets.
          g = new T.BoxBufferGeometry(1, 1, 1, 4, 4, 4);
          var pos = g.attributes.position, normal = g.attributes.normal;
          for (var v = 0; v < pos.count; v++) {
            var p = new T.Vector3().fromBufferAttribute(pos, v), q = p.clone().clampScalar(-.38, .38), n = p.clone().sub(q).normalize();
            q.addScaledVector(n, .12); pos.setXYZ(v, q.x, q.y, q.z); normal.setXYZ(v, n.x, n.y, n.z);
          }
        }
        this.geometries[kind] = g;
      }
      return this.geometries[kind];
    }
    mesh(parent, kind, material, x, y, z, sx, sy, sz) {
      var mesh = new T.Mesh(this.geometry(kind), typeof material === 'string' ? this.materials[material] : material);
      mesh.position.set(x || 0, y || 0, z || 0); mesh.scale.set(sx || 1, sy || sx || 1, sz || sx || 1);
      mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    }
    box(parent, material, x, y, z, sx, sy, sz) { return this.mesh(parent, 'box', material, x, y, z, sx, sy, sz); }
    ball(parent, material, x, y, z, sx, sy, sz) {
      var size = Math.max(sx, sy || sx, sz || sx), kind = size <= .1 ? 'petal' : size <= .23 ? 'smallSphere' : 'sphere';
      var mesh = this.mesh(parent, kind, material, x, y, z, sx, sy, sz); mesh.castShadow = size > .23; return mesh;
    }
    cylinder(parent, material, x, y, z, radius, height) { return this.mesh(parent, radius < .12 ? 'smallCylinder' : 'cylinder', material, x, y, z, radius, height, radius); }
    mergeStatic(group) {
      // Merge per material instead of relying on ANGLE_instanced_arrays. This
      // keeps grass/flowers/planks economical on older WebGL 1 Android devices.
      group.updateMatrixWorld(true); var batches = {};
      group.traverse(mesh => {
        if (!mesh.isMesh) return;
        var id = mesh.material.uuid + (mesh.castShadow ? '-shadow' : '-detail'), batch = batches[id] || (batches[id] = { material: mesh.material, shadow: mesh.castShadow, p: [], n: [], uv: [] });
        var g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        g.applyMatrix4(mesh.matrixWorld);
        ['position', 'normal', 'uv'].forEach((key, i) => {
          var a = g.attributes[key], dest = batch[['p', 'n', 'uv'][i]];
          if (a) for (var j = 0; j < a.array.length; j++) dest.push(a.array[j]);
        }); g.dispose();
      });
      while (group.children.length) group.remove(group.children[0]);
      Object.keys(batches).forEach(key => {
        var batch = batches[key], g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(batch.p, 3));
        g.setAttribute('normal', new T.Float32BufferAttribute(batch.n, 3));
        if (batch.uv.length) g.setAttribute('uv', new T.Float32BufferAttribute(batch.uv, 2));
        this.geometries['merged-' + g.uuid] = g;
        var mesh = new T.Mesh(g, batch.material); mesh.castShadow = batch.shadow; mesh.receiveShadow = true; group.add(mesh);
      });
    }
    terrain(rx, rz, height, material) {
      var geometry = new T.CylinderBufferGeometry(1, 1, 1, 96), mesh = new T.Mesh(geometry, this.materials[material]);
      geometry.rotateY(Math.PI / 96); mesh.scale.set(rx, height, rz); mesh.position.set(12, -.14 + height / 2, 10.2);
      mesh.receiveShadow = true; mesh.castShadow = true;
      this.geometries['land-' + material] = geometry; this.outdoors.add(mesh); return mesh;
    }
    path(parent, from, to, width) {
      var dx = to[0] - from[0], dz = to[1] - from[1], length = Math.hypot(dx, dz);
      var strip = this.box(parent, 'path', (from[0] + to[0]) / 2, .165, (from[1] + to[1]) / 2, width, .035, length + width * .3);
      strip.rotation.y = Math.atan2(dx, dz);
      this.cylinder(parent, 'path', from[0], .166, from[1], width / 2, .028);
      this.cylinder(parent, 'path', to[0], .166, to[1], width / 2, .028);
    }
    flower(parent, x, z, index, size) {
      var height = size || .27, color = ['pink', 'yellow', 'white', 'violet'][index % 4];
      this.cylinder(parent, 'stem', x, .16 + height / 2, z, .018, height);
      this.ball(parent, 'leaf', x + .06, .21, z, .1, .027, .055).rotation.z = .4;
      for (var p = 0; p < 5; p++) this.ball(parent, color, x + Math.cos(p * TAU / 5) * .075, .16 + height, z + Math.sin(p * TAU / 5) * .075, .08, .04, .08);
      this.ball(parent, 'yellow', x, .18 + height, z, .045, .035, .045);
    }
    makeIsland() {
      var waterGeometry = new T.PlaneBufferGeometry(150, 150, 64, 64);
      this.geometries.water = waterGeometry;
      this.materials.water = new T.MeshPhongMaterial({ color: '#4aaab8', specular: '#b2eee6', shininess: 75 });
      this.materials.water.color.convertSRGBToLinear();
      this.waterTime = { value: 0 };
      this.materials.water.onBeforeCompile = shader => {
        shader.uniforms.islandTime = this.waterTime;
        shader.vertexShader = 'uniform float islandTime;\nvarying float islandWave;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nislandWave = sin(position.x * 1.7 + islandTime * .7) * cos(position.y * 1.4 + islandTime * .55);\ntransformed.z += islandWave * .045;');
        shader.fragmentShader = 'varying float islandWave;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb += vec3(.024, .035, .03) * islandWave;');
      };
      this.water = new T.Mesh(waterGeometry, this.materials.water); this.water.rotation.x = -Math.PI / 2;
      this.water.position.set(12, -.24, 10.2); this.water.receiveShadow = true; this.outdoors.add(this.water);
      this.terrain(10.15, 8.35, .18, 'sand'); this.terrain(9.22, 7.42, .28, 'grass');
      this.foam = new T.Group(); this.outdoors.add(this.foam);
      var foamMaterial = new T.MeshBasicMaterial({ color: '#e8f7e2', transparent: true, opacity: .55, depthWrite: false });
      this.materials.foam = foamMaterial;
      for (var band = 0; band < 2; band++) {
        var ring = new T.Mesh(new T.RingBufferGeometry(1, 1.013, 112), foamMaterial);
        this.geometries['foam' + band] = ring.geometry; ring.rotation.x = -Math.PI / 2;
        ring.position.set(12, -.16 + band * .003, 10.2); ring.scale.set(10.45 + band * .25, 8.65 + band * .25, 1); this.foam.add(ring);
      }
      var details = new T.Group(); this.outdoors.add(details);
      this.path(details, [8.5, 8.5], [10.7, 11], .8); this.path(details, [10.7, 11], [14, 11], .8);
      this.path(details, [14, 11], [16, 8.4], .8); this.path(details, [14, 11], [20.3, 11.2], .65);
      // A boardwalk with visible thickness, piles and individual rounded planks.
      for (var i = 0; i < 9; i++) this.box(details, i % 2 ? 'wood' : 'timber', 19.55 + i * .29, .18, 11.2, .27, .16, 1.48);
      [19.65, 21.72].forEach(x => [10.56, 11.84].forEach(z => {
        this.cylinder(details, 'bark', x, -.1, z, .09, .9); this.cylinder(details, 'timber', x, .3, z, .1, .14);
      }));
      for (var f = 0; f < 45; f++) {
        var fx = 4.8 + (f * 3.173) % 13.5, fz = 4 + (f * 2.817) % 12.2;
        if (W.onLand(fx, fz) && Math.abs(fz - 11) > 1 && W.landmarks.every(l => Math.hypot(l.x - fx, l.y - fz) > 1.6) && W.nodes.every(n => Math.hypot(n.x - fx, n.y - fz) > .8)) this.flower(details, fx, fz, f);
      }
      for (var flower = 0; flower < 9; flower++) this.flower(details, 6 + (flower % 3) * .36, 9.7 + Math.floor(flower / 3) * .35, flower, .22 + flower % 2 * .08);
      for (var grass = 0; grass < 150; grass++) {
        var gx = 3.3 + (grass * 2.413) % 17.4, gz = 3.2 + (grass * 1.723) % 13.5;
        if (Math.pow((gx - 12) / 8.8, 2) + Math.pow((gz - 10.2) / 7, 2) > 1 || Math.abs(gz - 11) < .65) continue;
        var tuft = this.mesh(details, 'cone', grass % 2 ? 'grass' : 'leafLight', gx, .21, gz, .035, .14, .035);
        tuft.rotation.z = .25;
      }
      this.mergeStatic(details);
      W.nodes.forEach(n => {
        var group = new T.Group(); group.position.set(n.x, .14, n.y); this.outdoors.add(group);
        var ready = new T.Group(); group.add(ready); group.userData.ready = ready; group.userData.node = n;
        if (n.item === 'fruit') {
          this.cylinder(group, 'bark', 0, .78, 0, .17, 1.56);
          [-1, 1].forEach(side => { var branch = this.cylinder(group, 'wood', side * .22, 1.15, 0, .07, .8); branch.rotation.z = side * -.48; });
          var crowns = new T.Group(); group.add(crowns); group.userData.crowns = crowns;
          var leafMaterial = this.material('tree-' + n.id, '#69aa50'); leafMaterial.transparent = true;
          [[0, 2.2, 0, .98], [-.53, 1.8, .15, .73], [.55, 1.85, .12, .78], [0, 1.8, -.5, .8], [-.3, 2.5, -.1, .61]].forEach(a => this.ball(crowns, leafMaterial, a[0], a[1], a[2], a[3], a[3] * .84, a[3]));
          [[-.56, 1.8, .66], [.48, 2.13, .65], [.05, 2.68, .43]].forEach(a => {
            this.ball(ready, 'peach', a[0], a[1], a[2], .19, .2, .18);
            this.ball(ready, 'peachLight', a[0] - .055, a[1] + .025, a[2] + .11, .085, .13, .05);
            this.ball(ready, 'leafDark', a[0] + .05, a[1] + .19, a[2], .12, .025, .045).rotation.z = .4;
          });
        } else if (n.item === 'stone') {
          this.mesh(group, 'rock', 'rock', 0, .28, 0, .57, .48, .47);
          this.mesh(ready, 'rock', 'rockLight', .38, .1, .25, .15, .12, .14);
        } else if (n.item === 'wood') {
          this.cylinder(group, 'bark', 0, .22, 0, .39, .44);
          this.cylinder(group, 'timber', 0, .45, 0, .36, .03);
          this.cylinder(group, 'wood', 0, .471, 0, .23, .01);
          this.cylinder(group, 'timber', 0, .48, 0, .2, .01);
          var stick = this.cylinder(ready, 'wood', .1, .55, .08, .075, .7); stick.rotation.z = 1.2;
        } else {
          for (var shell = 0; shell < 5; shell++) this.ball(ready, shell % 2 ? 'cream' : 'white', (shell - 2) * .055, .035, -.025 * Math.abs(shell - 2), .06, .08, .17).rotation.y = (shell - 2) * .18;
        }
        this.nodeMeshes[n.id] = group;
      });
      this.houseMesh = this.building(false); this.houseMesh.position.set(8.5, .15, 7.2); this.outdoors.add(this.houseMesh);
      this.shopMesh = this.building(true); this.shopMesh.position.set(16, .15, 7); this.outdoors.add(this.shopMesh);
      var bench = this.furniture({ item: 'bench', rotation: 0 }); bench.position.set(13.4, .15, 10.3); this.outdoors.add(bench);
      this.box(bench, 'cream', .2, .72, 0, .36, .08, .38); this.box(bench, 'rock', -.3, .77, .03, .23, .08, .13).rotation.y = .5;
      ['mira', 'pip'].forEach((name, i) => {
        var l = W.landmarks.find(v => v.id === name), npc = this.avatar(i + 3);
        npc.position.set(l.x, .15, l.y); npc.rotation.y = .55; this.outdoors.add(npc); this.residents.push(npc);
      });
    }
    building(shop) {
      var group = new T.Group();
      this.box(group, 'rockLight', 0, .12, 0, 2.45, .24, 2.12);
      this.box(group, 'wall', 0, 1.05, 0, 2.3, 1.9, 1.9);
      [-1.05, 1.05].forEach(x => this.box(group, 'timber', x, 1.02, .96, .12, 1.88, .12));
      this.box(group, 'wood', 0, .7, 1.005, .62, 1.24, .12);
      this.box(group, 'mint', 0, 1.02, 1.08, .4, .42, .025);
      this.ball(group, 'gold', .2, .64, 1.1, .045, .045, .045);
      [-.75, .75].forEach(x => {
        this.box(group, 'timber', x, 1.22, .99, .53, .68, .1);
        this.box(group, 'glass', x, 1.23, 1.06, .4, .53, .035);
        this.box(group, 'white', x, 1.23, 1.09, .035, .54, .035);
        this.box(group, 'white', x, 1.23, 1.09, .4, .035, .035);
        this.box(group, 'cream', x, .88, 1.05, .62, .09, .2);
      });
      var shape = new T.Shape(); shape.moveTo(-1.36, 0); shape.lineTo(1.36, 0); shape.lineTo(0, 1.14); shape.closePath();
      var geometry = new T.ExtrudeBufferGeometry(shape, { depth: 2.3, bevelEnabled: true, bevelThickness: .045, bevelSize: .04, bevelSegments: 2, steps: 1 });
      geometry.translate(0, 2, -1.15); this.geometries['roof-' + shop] = geometry;
      var material = this.material(shop ? 'shopRoof' : 'homeRoof', shop ? '#d78e70' : '#71a9a2');
      var roof = new T.Mesh(geometry, material); roof.castShadow = roof.receiveShadow = true; group.add(roof);
      // Raised roofing battens make the roof a lit volume rather than a decal.
      for (var r = 0; r < 7; r++) {
        var z = -1.04 + r * .35;
        [-1, 1].forEach(side => {
          var beam = this.box(group, material, side * .69, 2.57, z, 1.79, .06, .06); beam.rotation.z = side * -.697;
        });
      }
      this.box(group, material, 0, 3.15, 0, .15, .13, 2.46);
      this.box(group, 'cream', .7, 2.8, -.55, .35, .9, .38);
      this.box(group, 'rockLight', .7, 3.27, -.55, .47, .15, .5);
      this.box(group, 'timber', 0, .13, 1.25, .94, .18, .48);
      if (shop) {
        for (var a = 0; a < 7; a++) {
          var awning = this.box(group, a % 2 ? 'cream' : 'coral', (a - 3) * .31, 1.86, 1.26, .315, .1, .72); awning.rotation.x = .17;
          this.ball(group, a % 2 ? 'cream' : 'coral', (a - 3) * .31, 1.77, 1.59, .16, .1, .05);
        }
        this.box(group, 'wood', 0, 2.35, 1.22, 1.05, .43, .08);
        this.ball(group, 'peach', 0, 2.35, 1.3, .14, .15, .035);
        this.ball(group, 'leaf', .1, 2.5, 1.3, .12, .035, .035).rotation.z = .5;
      } else {
        var flag = new T.Group(); group.add(flag); flag.position.set(-.77, 2.85, -.25); group.userData.flag = flag;
        this.cylinder(flag, 'wood', 0, .6, 0, .025, 1.2);
        this.box(flag, 'gold', .19, 1, 0, .38, .26, .035);
      }
      var buildingMaterials = {};
      group.traverse(mesh => {
        if (!mesh.isMesh) return;
        var name = mesh.material.name;
        if (!buildingMaterials[name]) {
          var clone = mesh.material.clone(); clone.transparent = true; buildingMaterials[name] = clone;
          this.materials['building-' + shop + '-' + name] = clone;
        }
        mesh.material = buildingMaterials[name];
      });
      group.userData.materials = buildingMaterials;
      return group;
    }
    avatar(id) {
      var group = new T.Group(), body = new T.Group(); group.add(body); group.userData.body = body;
      var npc = id > 2, rabbit = id === 3, coat = id === 1 || rabbit ? 'shirt1' : id === 4 ? 'gold' : 'shirt2', skin = npc ? rabbit ? 'peachLight' : 'timber' : 'skin';
      this.ball(body, coat, 0, .78, 0, .34, .45, .27);
      this.box(body, 'cream', 0, .79, .255, .58, .065, .045);
      if (id === 2) this.box(body, 'trousers', 0, .65, .21, .37, .32, .09);
      var legs = [], arms = [];
      [-1, 1].forEach(side => {
        var leg = new T.Group(); leg.position.set(side * .16, .44, 0); body.add(leg); legs.push(leg);
        this.cylinder(leg, npc ? skin : 'trousers', 0, -.15, 0, .1, .3);
        this.box(leg, 'shoe', 0, -.34, .07, .24, .15, .37);
        var arm = new T.Group(); arm.position.set(side * .3, 1.02, 0); body.add(arm); arms.push(arm);
        this.ball(arm, coat, side * .08, -.1, 0, .13, .21, .14);
        this.ball(arm, skin, side * .11, -.31, .015, .105, .12, .1);
      });
      var head = new T.Group(); head.position.y = 1.4; body.add(head);
      this.ball(head, skin, 0, 0, 0, .46, .46, .41);
      if (!npc) {
        var hair = id === 1 ? 'hair' : 'blueHair';
        this.ball(head, hair, 0, .19, -.07, .47, .33, .4);
        for (var bang = 0; bang < 4; bang++) this.ball(head, hair, -.3 + bang * .19, .24 + Math.sin(bang) * .03, .29, .15, .16, .1);
        [-1, 1].forEach(side => this.ball(head, skin, side * .45, -.05, 0, .1, .14, .1));
        if (id === 2) {
          this.ball(head, 'mint', 0, .38, -.03, .49, .15, .43);
          this.ball(head, 'mint', 0, .29, .4, .43, .055, .3);
        }
      } else [-1, 1].forEach(side => {
        this.ball(head, skin, side * .29, rabbit ? .55 : .32, -.07, rabbit ? .12 : .21, rabbit ? .4 : .2, .12);
        this.ball(head, 'pink', side * .29, rabbit ? .57 : .33, .045, rabbit ? .055 : .1, rabbit ? .26 : .1, .025);
      });
      [-1, 1].forEach(side => {
        this.ball(head, 'white', side * .17, -.03, .367, .1, .125, .04);
        this.ball(head, 'dark', side * .17, -.04, .405, .052, .082, .025);
        this.ball(head, 'white', side * .155, -.01, .426, .016, .023, .012);
        this.ball(head, 'pink', side * .3, -.16, .325, .075, .032, .022);
      });
      this.ball(head, skin, 0, -.12, .414, .055, .05, .055);
      this.ball(head, 'wood', 0, -.255, .354, .07, .022, .025);
      group.userData.legs = legs; group.userData.arms = arms; group.userData.head = head;
      if (!npc) {
        var net = new T.Group(); net.position.set(.43, .87, .15); body.add(net);
        this.cylinder(net, 'wood', 0, .53, 0, .028, 1.06);
        var rim = new T.Mesh(new T.TorusBufferGeometry(.29, .024, 8, 28), this.materials.cream);
        this.geometries['net-rim-' + id] = rim.geometry; rim.rotation.x = Math.PI / 2; rim.position.y = 1.13; net.add(rim);
        var netMaterial = new T.MeshBasicMaterial({ color: '#f5f4d8', transparent: true, opacity: .43, wireframe: true });
        this.materials['net-' + id] = netMaterial;
        var netting = new T.Mesh(new T.ConeBufferGeometry(.28, .36, 14, 3, true), netMaterial);
        this.geometries['netting-' + id] = netting.geometry; netting.rotation.z = Math.PI; netting.position.y = .95; net.add(netting);
        var rod = new T.Group(); rod.position.set(.42, .77, .18); rod.rotation.x = .5; body.add(rod);
        this.cylinder(rod, 'wood', 0, .7, 0, .025, 1.4);
        group.userData.net = net; group.userData.rod = rod;
        var float = new T.Group(); this.outdoors.add(float); this.ball(float, 'coral', 0, 0, 0, .075, .13, .075); this.ball(float, 'cream', 0, .09, 0, .06, .045, .06);
        var floatRing = new T.Mesh(new T.RingBufferGeometry(.2, .23, 32), this.materials.foam);
        this.geometries['float-ring-' + id] = floatRing.geometry; floatRing.rotation.x = -Math.PI / 2; floatRing.position.y = -.04; float.add(floatRing);
        var lineGeometry = new T.BufferGeometry(); lineGeometry.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(9), 3));
        this.geometries['line-' + id] = lineGeometry;
        var lineMaterial = new T.LineBasicMaterial({ color: '#ffffe4', transparent: true, opacity: .8 }); this.materials['line-' + id] = lineMaterial;
        var line = new T.Line(lineGeometry, lineMaterial); this.outdoors.add(line);
        group.userData.float = float; group.userData.floatRing = floatRing; group.userData.line = line;
      }
      return group;
    }
    furniture(d) {
      if (this.furnitureTemplates[d.item]) {
        var copy = this.furnitureTemplates[d.item].clone(); copy.rotation.y = (d.rotation || 0) * Math.PI / 2; return copy;
      }
      var group = new T.Group();
      if (d.item === 'bench') {
        [-.48, .48].forEach(x => [-.22, .22].forEach(z => this.box(group, 'wood', x, .25, z, .11, .5, .11)));
        for (var p = 0; p < 3; p++) this.box(group, 'timber', 0, .53, (p - 1) * .19, 1.35, .1, .18);
        [-.53, .53].forEach(x => this.box(group, 'wood', x, .72, -.27, .09, .7, .09));
        [0, 1].forEach(n => this.box(group, 'timber', 0, .83 + n * .18, -.28, 1.34, .15, .08));
      } else if (d.item === 'lamp') {
        this.cylinder(group, 'rock', 0, .055, 0, .25, .11); this.cylinder(group, 'wood', 0, .73, 0, .045, 1.4);
        this.ball(group, 'lampGlow', 0, 1.5, 0, .22, .26, .22);
        this.mesh(group, 'cone', 'gold', 0, 1.82, 0, .28, .22, .28);
        this.cylinder(group, 'gold', 0, 1.24, 0, .2, .06);
      } else if (d.item === 'planter') {
        this.cylinder(group, 'coral', 0, .24, 0, .26, .44); this.cylinder(group, 'coral', 0, .44, 0, .3, .1);
        this.cylinder(group, 'soil', 0, .5, 0, .24, .025);
        for (var flower = 0; flower < 4; flower++) this.flower(group, Math.cos(flower * 2) * .13, Math.sin(flower * 2) * .13, flower, .54 + flower % 2 * .13);
      } else if (d.item === 'rug') {
        this.box(group, 'mint', 0, .018, 0, 1.3, .025, 1); this.box(group, 'cream', 0, .035, 0, 1.1, .01, .79);
        for (var stripe = -2; stripe <= 2; stripe++) this.box(group, 'mint', stripe * .2, .043, 0, .045, .01, .65);
      } else {
        this.cylinder(group, 'wood', 0, .12, 0, .35, .24);
        this.ball(group, 'gold', 0, .57, 0, .25, .4, .24); this.ball(group, 'gold', 0, 1.05, 0, .28, .28, .28);
        [-1, 1].forEach(side => this.ball(group, 'gold', side * .21, 1.29, 0, .1, .18, .09));
      }
      this.mergeStatic(group); this.furnitureTemplates[d.item] = group;
      var result = group.clone(); result.rotation.y = (d.rotation || 0) * Math.PI / 2; return result;
    }
    insect(species) {
      var group = new T.Group(), wings = [];
      this.ball(group, species.fly ? 'dark' : 'leafDark', 0, 0, 0, species.fly ? .035 : .09, .045, .12);
      this.ball(group, 'dark', 0, .01, .11, .045, .035, .04);
      if (species.fly) [-1, 1].forEach(side => {
        var wing = new T.Group(); group.add(wing); wings.push(wing);
        this.ball(wing, species.id === 'eveningFirefly' ? 'lampGlow' : 'pink', side * .13, 0, 0, .14, .022, .18);
        this.ball(wing, species.id === 'eveningFirefly' ? 'lampGlow' : 'violet', side * .11, 0, -.14, .1, .02, .1);
      });
      group.userData.wings = wings; return group;
    }
    makeHome() {
      var room = new T.Group(); this.home.add(room);
      this.box(room, 'wood', 4, -.15, 3.5, 8.3, .3, 7.3);
      for (var row = 0; row < 14; row++) for (var col = 0; col < 4; col++) this.box(room, (row + col) % 3 ? 'floor' : 'floorLight', 1 + col * 2, .015, .25 + row * .5, 1.98, .065, .485);
      this.box(room, 'wall', 4, 1.45, -.06, 8.2, 2.9, .16); this.box(room, 'wall', -.06, 1.45, 3.5, .16, 2.9, 7.2);
      this.box(room, 'cream', 4, .22, .05, 8, .4, .08); this.box(room, 'cream', .05, .22, 3.5, .08, .4, 7);
      this.box(room, 'wood', 4, .46, .06, 8, .07, .07); this.box(room, 'wood', .06, .46, 3.5, .07, .07, 7);
      this.box(room, 'timber', 5.1, 1.8, .1, 2.1, 1.65, .16);
      this.box(room, 'glass', 5.1, 1.8, .2, 1.86, 1.4, .04);
      this.box(room, 'white', 5.1, 1.8, .24, .08, 1.4, .05); this.box(room, 'white', 5.1, 1.8, .24, 1.86, .08, .05);
      this.box(room, 'cream', 5.1, 1.01, .2, 2.25, .15, .36);
      var curtainRod = this.cylinder(room, 'gold', 5.1, 2.71, .35, .035, 2.65); curtainRod.rotation.z = Math.PI / 2;
      [-1, 1].forEach(side => {
        for (var pleat = 0; pleat < 4; pleat++) this.ball(room, 'mint', 5.1 + side * (1 + pleat * .09), 1.9, .34 + Math.sin(pleat) * .04, .1, .79, .09);
      });
      this.box(room, 'timber', 1.6, 1.8, .14, 1.2, 1, .12); this.box(room, 'mint', 1.6, 1.8, .22, 1.04, .84, .04);
      this.ball(room, 'gold', 1.6, 1.85, .26, .21, .21, .025); this.ball(room, 'leaf', 1.37, 1.58, .27, .29, .09, .025);
      this.box(room, 'mint', 4, .065, 6.25, 1.5, .035, .85);
      this.box(room, 'cream', 4, .087, 6.25, 1.2, .01, .56);
      this.mergeStatic(room);
    }
    sync(game) {
      var time = game.elapsed;
      this.waterTime.value = time;
      this.foam.children.forEach((ring, i) => { var s = 1 + Math.sin(time * .7 + i * 2) * .009; ring.scale.set((10.45 + i * .25) * s, (8.65 + i * .25) * s, 1); });
      W.nodes.forEach(n => { this.nodeMeshes[n.id].userData.ready.visible = !(game.harvested[n.id] > game.clock); });
      this.houseMesh.userData.materials.homeRoof.color.set(game.houseLevel === 2 ? '#a08dbe' : game.houseLevel === 1 ? '#6d9daf' : '#71a9a2').convertSRGBToLinear();
      this.materials.floor.color.set(game.houseLevel === 2 ? '#b8a3c0' : '#d6ad78').convertSRGBToLinear();
      this.materials.floorLight.color.set(game.houseLevel === 2 ? '#d2bdd3' : '#e4c28b').convertSRGBToLinear();
      this.houseMesh.userData.flag.visible = game.houseLevel > 0;
      var decorationSignature = JSON.stringify(game.decorations);
      if (decorationSignature !== this.decorationSignature) {
        Object.keys(this.decorationMeshes).forEach(key => {
          var old = this.decorationMeshes[key]; this.scene.remove(old);
          old.traverse(mesh => { if (mesh.geometry) { mesh.geometry.dispose(); delete this.geometries['merged-' + mesh.geometry.uuid]; } });
        });
        this.decorationMeshes = {};
        ['island', 'home'].forEach(location => {
          var group = new T.Group(); group.userData.location = location;
          game.decorations.filter(d => d.location === location).forEach(d => {
            var mesh = this.furniture(d); mesh.position.set(d.x, location === 'home' ? .06 : .15, d.y); group.add(mesh);
          });
          this.mergeStatic(group); this.decorationMeshes[location] = group; this.scene.add(group);
        });
        this.decorationSignature = decorationSignature;
      }
      game.players.forEach(p => {
        var mesh = this.playerMeshes[p.id], data = mesh.userData, moving = p.movingSpeed > .01, stride = moving ? Math.sin(time * 11) * .55 : 0;
        mesh.position.set(p.x, p.location === 'home' ? .065 : .15, p.y); mesh.rotation.y = Math.atan2(p.facing.x, p.facing.y);
        data.body.position.y = moving ? Math.abs(Math.sin(time * 11)) * .035 : Math.sin(time * 2 + p.id) * .012;
        data.legs[0].rotation.x = stride; data.legs[1].rotation.x = -stride;
        data.arms[0].rotation.x = -stride * .6; data.arms[1].rotation.x = p.netRaised ? -.45 : stride * .6;
        data.net.visible = p.tool === 'net'; data.rod.visible = p.tool === 'rod';
        data.net.rotation.x = p.netSwing > 0 ? 1.2 + Math.sin(p.netSwing * 9) * .35 : p.netRaised ? .55 : -.45;
        data.net.rotation.z = p.netRaised ? -.12 : .25;
        data.float.visible = data.line.visible = !!p.fishing && p.location === 'island';
        if (p.fishing) {
          var x = 22.1, z = 10.5 + p.id * .55, dip = p.fishing.phase === 'bite' || p.fishing.phase === 'nibble';
          data.float.position.set(x, -.11 + Math.sin(time * (dip ? 14 : 3)) * (dip ? .055 : .018), z);
          data.floatRing.scale.setScalar(.8 + (time * (dip ? 1.5 : .6)) % .8);
          mesh.updateMatrixWorld(true);
          var tip = data.rod.localToWorld(new T.Vector3(0, 1.4, 0));
          var array = data.line.geometry.attributes.position;
          array.setXYZ(0, tip.x, tip.y, tip.z); array.setXYZ(1, (tip.x + x) / 2, Math.max(.2, tip.y / 2 - .18), (tip.z + z) / 2); array.setXYZ(2, x, -.08, z); array.needsUpdate = true;
        }
        var ghost = this.ghosts[p.id], placing = p.menu && p.menu.kind === 'place'; ghost.userData.location = p.location;
        ghost.userData.active = !!placing;
        if (placing) {
          if (ghost.userData.item !== p.menu.item) {
            ghost.children.forEach(child => child.traverse(node => { if (node.isMesh && node.material.userData.preview) node.material.dispose(); }));
            while (ghost.children.length) ghost.remove(ghost.children[0]);
            var preview = this.furniture({ item: p.menu.item }); ghost.add(preview); ghost.userData.item = p.menu.item;
            preview.traverse(node => { if (node.isMesh) { node.material = node.material.clone(); node.material.userData.preview = true; node.material.transparent = true; node.material.opacity = .58; node.castShadow = false; } });
            if (!this.geometries.previewRing) this.geometries.previewRing = new T.RingBufferGeometry(.49, .54, 32);
            var ring = new T.Mesh(this.geometries.previewRing, new T.MeshBasicMaterial({ color: '#76ba7c', transparent: true, opacity: .85, side: T.DoubleSide }));
            ring.rotation.x = -Math.PI / 2; ring.position.y = .025; ring.material.userData.preview = true;
            ghost.add(ring); ghost.userData.ring = ring;
          }
          ghost.position.set(p.menu.x, p.location === 'home' ? .09 : .18, p.menu.y); ghost.rotation.y = p.menu.rotation * Math.PI / 2;
          ghost.userData.ring.material.color.set(game.canPlace(p, p.menu.item, p.menu.x, p.menu.y) ? '#79bd7c' : '#e8837c');
        }
      });
      game.insects.forEach(insect => {
        var mesh = this.insectMeshes[insect.id], species = W.insects.find(s => s.id === insect.id);
        mesh.visible = game.insectVisible(insect); mesh.position.set(insect.x, species.fly ? .85 + Math.sin(time * 5 + insect.offset) * .12 : .21, insect.y);
        mesh.rotation.y = Math.sin(time * .5 + insect.offset);
        mesh.userData.wings.forEach((wing, i) => { wing.rotation.z = Math.sin(time * 16 + insect.offset) * .8 * (i ? 1 : -1); });
      });
      this.residents.forEach((npc, i) => { npc.userData.body.position.y = Math.sin(time * 2 + i) * .018; npc.userData.head.rotation.y = Math.sin(time * .5 + i) * .14; });
    }
    chooseViews(game) {
      var players = game.players.filter(p => p.joined), first = players[0] || game.players[0];
      if (players.length > 1) {
        var distance = Math.hypot(players[0].x - players[1].x, players[0].y - players[1].y);
        this.split = players[0].location !== players[1].location || distance > (this.split ? 4.8 : 6.2);
      } else this.split = false;
      var groups = this.split ? players.map(p => [p]) : [players.length ? players : [first]];
      this.views = groups.map((group, index) => {
        var player = group[0], x = group.reduce((s, p) => s + p.x, 0) / group.length, z = group.reduce((s, p) => s + p.y, 0) / group.length;
        if (group.length === 1 && player.menu && player.menu.kind === 'place') { x = (x + player.menu.x) / 2; z = (z + player.menu.y) / 2; }
        if (player.location === 'home') { x = (x + 4) / 2; z = (z + 3.5) / 2; }
        if (game.phase === 'title') { x = 10.8; z = 9.4; }
        var target = this.follow[index], location = player.location, jump = !target || target.location !== location || this.lastSplit !== this.split;
        if (jump) target = { x: x, z: z, location: location };
        else { target.x += (x - target.x) * .15; target.z += (z - target.z) * .15; }
        this.follow[index] = target;
        var camera = this.cameras[index];
        if (!camera) { camera = new T.OrthographicCamera(-8, 8, 4.5, -4.5, .2, 80); this.cameras[index] = camera; }
        var rect = { x: this.split ? index * 480 : 0, y: 0, w: this.split ? 480 : 960, h: 540 };
        var extent = location === 'home' ? 8.5 : game.phase === 'title' ? 10.8 : 8.8;
        if (group.length > 1) extent += Math.max(0, Math.hypot(group[0].x - group[1].x, group[0].y - group[1].y) - 2) * .5;
        camera.left = -extent * rect.w / rect.h / 2; camera.right = -camera.left; camera.top = extent / 2; camera.bottom = -camera.top;
        // Fixed azimuth preserves the existing screen-direction stick mapping.
        camera.position.set(target.x + 8, location === 'home' ? 7.8 : 6.8, target.z + 8); camera.lookAt(target.x, .75, target.z); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
        return { rect: rect, location: location, playerIds: group.map(p => p.id), camera: camera, target: target };
      });
      this.lastSplit = this.split;
    }
    lighting(game, view) {
      var hour = (game.clock / 60) % 24, night = hour < 6 || hour >= 20, dusk = hour >= 17 && hour < 20, indoor = view.location === 'home';
      var sky = indoor ? '#d6c9ad' : night ? '#293e61' : dusk ? '#e6cfb1' : '#b9deda';
      this.scene.background = new T.Color(sky).convertSRGBToLinear(); this.scene.fog.color.copy(this.scene.background);
      this.hemisphere.intensity = indoor ? .9 : night ? .55 : .72;
      this.hemisphere.color.set(indoor ? '#fff0dc' : night ? '#9cb6e5' : '#d7f0ff');
      this.hemisphere.groundColor.set(indoor ? '#b99875' : '#82975b');
      this.sun.color.set(indoor ? '#ffe2b0' : night ? '#c0d2ff' : dusk ? '#ffd0a0' : '#fff1d4');
      this.sun.intensity = indoor ? 1.05 : night ? .52 : dusk ? 1.05 : 1.3;
      this.sun.position.set(view.target.x - 7, indoor ? 10 : 15, view.target.z + 5); this.sun.target.position.set(view.target.x, 0, view.target.z);
      this.sun.target.updateMatrixWorld();
      this.materials.water.color.set(night ? '#244f70' : dusk ? '#50949e' : '#228aa5').convertSRGBToLinear();
      this.materials.glass.emissive.set(night ? '#e8b566' : '#000000').convertSRGBToLinear(); this.materials.glass.emissiveIntensity = night ? .6 : 0;
      [this.houseMesh, this.shopMesh].forEach(building => {
        building.userData.materials.glass.emissive.copy(this.materials.glass.emissive); building.userData.materials.glass.emissiveIntensity = this.materials.glass.emissiveIntensity;
      });
      this.materials.lampGlow.emissiveIntensity = night || indoor ? 1.8 : .3;
    }
    showLocation(game, view) {
      this.outdoors.visible = view.location === 'island'; this.home.visible = view.location === 'home';
      game.players.forEach(p => { this.playerMeshes[p.id].visible = p.joined && p.location === view.location; });
      Object.keys(this.decorationMeshes).forEach(key => { var mesh = this.decorationMeshes[key]; mesh.visible = mesh.userData.location === view.location; });
      Object.keys(this.ghosts).forEach(id => { var ghost = this.ghosts[id]; ghost.visible = ghost.userData.active && ghost.userData.location === view.location; });
      W.nodes.filter(n => n.item === 'fruit').forEach(n => {
        var fade = game.players.some(p => p.joined && p.location === 'island' && n.x + n.y > p.x + p.y && Math.hypot(p.x - n.x, p.y - n.y) < 2.2);
        var material = this.materials['tree-' + n.id]; material.opacity = fade ? .42 : 1; material.depthWrite = !fade;
      });
      [this.houseMesh, this.shopMesh].forEach(building => {
        var x = building.position.x, z = building.position.z;
        var fade = view.location === 'island' && game.players.some(p => p.joined && p.location === 'island' && view.playerIds.indexOf(p.id) >= 0 && x + z > p.x + p.y && Math.hypot(p.x - x, p.y - z) < 3.2);
        Object.keys(building.userData.materials).forEach(name => { var material = building.userData.materials[name]; material.opacity = fade ? .24 : 1; material.depthWrite = !fade; });
        building.traverse(mesh => { if (mesh.isMesh) mesh.castShadow = !fade; });
      });
    }
    draw(game, ctx, width, height) {
      if (this.disposed || this.lost || this.renderer.getContext().isContextLost()) return false;
      var renderWidth = Math.min(1920, Math.max(480, width)), renderHeight = Math.round(renderWidth * height / width);
      if (this.canvas.width !== renderWidth || this.canvas.height !== renderHeight) this.renderer.setSize(renderWidth, renderHeight, false);
      this.sync(game); this.chooseViews(game);
      this.renderer.setScissorTest(true);
      this.views.forEach(view => {
        var rect = view.rect, x = Math.round(rect.x / 960 * renderWidth), w = Math.round(rect.w / 960 * renderWidth);
        this.renderer.setViewport(x, 0, w, renderHeight); this.renderer.setScissor(x, 0, w, renderHeight);
        this.showLocation(game, view); this.lighting(game, view); this.renderer.clear(true, true, true); this.renderer.render(this.scene, view.camera);
      });
      this.renderer.setScissorTest(false);
      var gl = this.renderer.getContext();
      // Loss can occur during the draw, before its DOM event is delivered.
      // Keep the same scene/context owner available for Three's restoration.
      if (gl.isContextLost()) { this.lost = true; return false; }
      if (!this.renderer.info.render.calls || gl.getError() !== 0) throw new Error('Island WebGL draw failed');
      // Copy immediately: no animation-frame delay or preserved GPU framebuffer.
      ctx.drawImage(this.canvas, 0, 0, 960, 540);
      return true;
    }
    project(x, y, z, view) {
      var p = new T.Vector3(x, y, z).project(view.camera), rect = view.rect;
      return { x: rect.x + (p.x + 1) * rect.w / 2, y: (1 - p.y) * rect.h / 2, visible: p.z >= -1 && p.z <= 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1 };
    }
    dispose() {
      if (this.disposed) return; this.disposed = true;
      if (this.onLost) this.canvas.removeEventListener('webglcontextlost', this.onLost);
      if (this.onRestored) this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
      var geometries = new Set(), materials = new Set();
      if (this.scene) this.scene.traverse(mesh => { if (mesh.geometry) geometries.add(mesh.geometry); if (mesh.material) materials.add(mesh.material); });
      Object.keys(this.geometries || {}).forEach(key => geometries.add(this.geometries[key]));
      Object.keys(this.materials || {}).forEach(key => materials.add(this.materials[key]));
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); (this.textures || []).forEach(t => t.dispose());
      if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
      else if (this.context) { var lose = this.context.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); }
      this.views = [];
    }
  }
  root.CozyIsland3DRenderer = CozyIsland3DRenderer;
})(window);
