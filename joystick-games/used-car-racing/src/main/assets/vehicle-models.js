/* Original road-car geometry for Used Car Racing TV. No brands or imported models.
 * Metres: local +Z is forward, +Y is up. Wheels spin around their local X axis.
 * Static details are merged by material; each wheel keeps a separate steering pivot.
 * Three.js r124 / WebGL 1. */
(function (root) {
  'use strict';
  var PI = Math.PI;
  var STYLES = {
    compact: { width: 1.74, length: 3.96, height: 1.43, wheelbase: 2.42, radius: .325, cabinRear: -1.39, roofRear: -1.10, roofFront: .34, cabinFront: .85, hood: .79, tail: .84, nose: .80, rear: .87, lamps: 'round', spoiler: false },
    sedan: { width: 1.82, length: 4.55, height: 1.44, wheelbase: 2.67, radius: .34, cabinRear: -1.23, roofRear: -.83, roofFront: .37, cabinFront: .98, hood: .86, tail: .85, nose: .84, rear: .89, lamps: 'rect', spoiler: false },
    coupe: { width: 1.88, length: 4.32, height: 1.24, wheelbase: 2.60, radius: .35, cabinRear: -1.37, roofRear: -.78, roofFront: .21, cabinFront: .92, hood: .74, tail: .82, nose: .72, rear: .88, lamps: 'slim', spoiler: true },
    wagon: { width: 1.84, length: 4.66, height: 1.48, wheelbase: 2.70, radius: .34, cabinRear: -1.92, roofRear: -1.66, roofFront: .37, cabinFront: .99, hood: .85, tail: .87, nose: .83, rear: .94, lamps: 'rect', spoiler: false },
    muscle: { width: 1.96, length: 4.78, height: 1.34, wheelbase: 2.76, radius: .36, cabinRear: -1.37, roofRear: -.94, roofFront: .03, cabinFront: .61, hood: .88, tail: .91, nose: .94, rear: .91, lamps: 'double', spoiler: true },
    rally: { width: 1.86, length: 4.10, height: 1.44, wheelbase: 2.48, radius: .35, cabinRear: -1.46, roofRear: -1.15, roofFront: .28, cabinFront: .87, hood: .84, tail: .84, nose: .83, rear: .90, lamps: 'rect', spoiler: true }
  };
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function create(T, styleId, color, seed, materialLibrary) {
    if (!T || !T.BufferGeometry) throw new Error('Three.js is required to build vehicles');
    var style = STYLES[styleId] ? styleId : 'compact', d = STYLES[style];
    var group = new T.Group(), body = new T.Group(); group.add(body);
    group.name = 'used-car-' + style;
    var geometries = [], materials = [], textures = [], disposed = false;
    var batches = {}, shared = {}, wheelMeshes = [], damageMeshes = [], atlasMaterial = null, atlasUniforms = null;
    var randomState = (Number(seed) || 97123) >>> 0;
    function rnd() { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; }
    function geo(g) { geometries.push(g); return g; }
    function material(options) {
      var m = new T.MeshPhongMaterial(options); m.color.convertSRGBToLinear();
      if (m.emissive) m.emissive.convertSRGBToLinear();
      if (m.specular) m.specular.convertSRGBToLinear(); materials.push(m); return m;
    }
    // Shared baked maps supply fine surface detail; the six silhouettes stay low polygon.
    // Cars own only their materials. The renderer owns the texture library and cube maps.
    function surface(m, name, normalStrength) {
      var maps = materialLibrary && materialLibrary.get(name);
      if (!maps) return m;
      if (maps.map) m.map = maps.map;
      if (maps.normalMap) { m.normalMap = maps.normalMap; m.normalScale.copy(maps.normalScale || new T.Vector2(1, 1)).multiplyScalar(normalStrength === undefined ? 1 : normalStrength); }
      if (maps.specularMap) m.specularMap = maps.specularMap;
      return m;
    }
    var paint = surface(material({ color: color === undefined ? 0x335e78 : color, shininess: 92, specular: 0xa2b3bf, vertexColors: true }), 'paint', .28);
    var black = material({ color: 0x151b20, shininess: 11, specular: 0x3b4650 });
    var rubber = surface(material({ color: 0x747879, shininess: 8, specular: 0x434950 }), 'rubber', .75);
    var chrome = material({ color: 0x9ba7b1, shininess: 145, specular: 0xe8eef1 });
    var alloy = material({ color: style === 'rally' ? 0xb49b62 : style === 'coupe' ? 0x7a8794 : style === 'muscle' ? 0xa4a9ac : 0xa9b3bb, shininess: 95, specular: 0xd2dde4 });
    var disc = material({ color: 0x4b535c, shininess: 52, specular: 0x798795 });
    var caliper = material({ color: style === 'rally' ? 0xd69831 : 0x9f3029, shininess: 32 });
    var cabin = material({ color: 0x20272c, shininess: 6 });
    var fabric = surface(material({ color: style === 'muscle' ? 0x80635b : 0x71808a, shininess: 2, specular: 0x151a1e }), 'fabric', .45);
    var glass = material({ color: 0x243f4b, shininess: 150, specular: 0x9ebbc7, transparent: true, opacity: .48, depthWrite: false, side: T.DoubleSide });
    var headlamp = surface(material({ color: 0xe8e5cf, emissive: 0xb1d6ee, emissiveIntensity: .48, shininess: 140 }), 'lamp', .8);
    var taillamp = surface(material({ color: 0xbf2524, emissive: 0x9b110d, emissiveIntensity: .24, shininess: 110 }), 'lamp', .8);
    var indicator = surface(material({ color: 0xe28c27, emissive: 0x4f2707, shininess: 100 }), 'lamp', .75);
    var marks = material({ color: 0xd6d3c6, shininess: 18 });
    var rust = surface(material({ color: 0x69432f, shininess: 1, specular: 0x12100d, transparent: true, opacity: .48, depthWrite: false, side: T.DoubleSide }), 'paint', .8);
    var undercar = material({ color: 0x252c31, shininess: 13 });
    paint.combine = chrome.combine = alloy.combine = glass.combine = T.MixOperation;
    paint.reflectivity = .20; chrome.reflectivity = .67; alloy.reflectivity = .31; glass.reflectivity = .43;
    var reflected = [paint, chrome, alloy, glass], currentEnvironment = null, studioLighting = false, finishAge = 0, finishDamage = 0;
    function updatePaintFinish() {
      paint.shininess = (studioLighting ? 110 : 100) - finishAge * 32 - finishDamage * 45;
      paint.reflectivity = (studioLighting ? .37 : .23) - finishAge * (studioLighting ? .11 : .065) - finishDamage * .10;
      if (atlasUniforms) atlasUniforms.carPaintFinish.value.set(paint.shininess, paint.reflectivity);
    }
    function setEnvironment(environment) {
      if (currentEnvironment === environment) return;
      currentEnvironment = environment || null;
      studioLighting = !!currentEnvironment && /\/garage$/.test(currentEnvironment.name || '');
      updatePaintFinish();
      reflected.forEach(function (m) {
        var shaderChange = !!m.envMap !== !!currentEnvironment;
        m.envMap = currentEnvironment;
        if (shaderChange) m.needsUpdate = true;
      });
    }
    var box = geo(new T.BoxBufferGeometry(1, 1, 1));
    var sphere = geo(new T.SphereBufferGeometry(1, 10, 6));
    var cylinder = geo(new T.CylinderBufferGeometry(1, 1, 1, 16));
    var smallCylinder = geo(new T.CylinderBufferGeometry(1, 1, 1, 8));
    function transform(x, y, z, sx, sy, sz, rx, ry, rz) {
      return new T.Matrix4().compose(new T.Vector3(x || 0, y || 0, z || 0), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz));
    }
    function push(name, g, matrix) { if (!batches[name]) batches[name] = []; batches[name].push({ geometry: g, matrix: matrix || new T.Matrix4() }); }
    function cube(name, x, y, z, sx, sy, sz, rx, ry, rz) { push(name, box, transform(x, y, z, sx, sy, sz, rx, ry, rz)); }
    function ellipsoid(name, x, y, z, sx, sy, sz) { push(name, sphere, transform(x, y, z, sx, sy, sz)); }
    function tube(name, x, y, z, radius, length, rx, ry, rz, primitive) { push(name, primitive || cylinder, transform(x, y, z, radius, length, radius, rx, ry, rz)); }
    function beam(name, a, b, thick, second) {
      var start = new T.Vector3(a[0], a[1], a[2]), end = new T.Vector3(b[0], b[1], b[2]);
      var dir = end.clone().sub(start), middle = start.clone().add(end).multiplyScalar(.5);
      var q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize());
      push(name, box, new T.Matrix4().compose(middle, q, new T.Vector3(thick, dir.length(), second || thick)));
    }
    function polygon(name, points) {
      var positions = [];
      for (var i = 1; i < points.length - 1; i++) positions.push.apply(positions, points[0].concat(points[i], points[i + 1]));
      var g = geo(new T.BufferGeometry()); g.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); g.computeVertexNormals(); push(name, g);
    }
    var ATLAS_TILE = { paint: 0, rubber: 1, headlamp: 2, taillamp: 2, indicator: 2, fabric: 3 };
    var DETAIL_STRENGTH = { paint: .0504, rubber: .4875, headlamp: .40, taillamp: .40, indicator: .375, fabric: .144 };
    function tagged(parts, id) { parts.forEach(function (p) { p.materialId = id; }); return parts; }
    function merge(parts, materialId) {
      var positions = [], normals = [], uvs = [], colors = [], surfaces = [], details = [], batched = materialId === 'atlas';
      parts.forEach(function (p) {
        var id = p.materialId || materialId, source = batched ? mats[id] : null;
        var g = p.geometry.index ? p.geometry.toNonIndexed() : p.geometry.clone(); g.applyMatrix4(p.matrix);
        var a = g.attributes.position.array, n = g.attributes.normal.array, nativeUv = g.attributes.uv && g.attributes.uv.array;
        var native = p.nativeUv || id === 'headlamp' || id === 'taillamp' || id === 'indicator';
        var density = id === 'fabric' ? 3 : id === 'rust' ? 2 : 1;
        var tile = ATLAS_TILE[id] === undefined ? -1 : ATLAS_TILE[id];
        var specular = source ? source.specular.r * .2126 + source.specular.g * .7152 + source.specular.b * .0722 : 0;
        var reflection = id === 'paint' ? -1 : id === 'chrome' || id === 'alloy' ? source && source.reflectivity || 0 : 0;
        var emission = id === 'headlamp' ? 1 : id === 'taillamp' ? 2 : id === 'indicator' ? 3 : 0;
        for (var j = 0; j < a.length; j += 9) {
          // Project once per triangle so interpolated corner normals never collapse
          // the tangent basis. The atlas shader wraps these local metre-scale UVs.
          var ax = a[j + 3] - a[j], ay = a[j + 4] - a[j + 1], az = a[j + 5] - a[j + 2];
          var bx = a[j + 6] - a[j], by = a[j + 7] - a[j + 1], bz = a[j + 8] - a[j + 2];
          var nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
          var projection = Math.abs(nx) > Math.abs(ny) && Math.abs(nx) > Math.abs(nz) ? 0 : Math.abs(ny) > Math.abs(nz) ? 1 : 2;
          for (var vertex = 0; vertex < 3; vertex++) {
            var at = j + vertex * 3, x = a[at], y = a[at + 1], z = a[at + 2], uvAt = at / 3 * 2;
            positions.push(x, y, z); normals.push(n[at], n[at + 1], n[at + 2]);
            if (native && nativeUv) uvs.push(nativeUv[uvAt] * (p.uvRepeatU || 1), nativeUv[uvAt + 1] * (p.uvRepeatV || 1));
            else if (projection === 0) uvs.push(z * (nx > 0 ? -1 : 1) * density, y * density);
            else if (projection === 1) uvs.push(x * density, z * (ny > 0 ? -1 : 1) * density);
            else uvs.push(x * (nz < 0 ? -1 : 1) * density, y * density);
            var shade = id === 'paint' ? (.72 + .28 * clamp((y - .23) / .70, 0, 1)) * (n[at + 1] < -.1 ? .74 : 1) : 1;
            colors.push(shade * (source ? source.color.r : 1), shade * (source ? source.color.g : 1), shade * (source ? source.color.b : 1));
            if (batched) {
              surfaces.push(tile, id === 'paint' ? -1 : source.shininess, reflection, specular);
              details.push(DETAIL_STRENGTH[id] || 0, emission);
            }
          }
        }
        g.dispose();
      });
      var merged = geo(new T.BufferGeometry()); merged.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); merged.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
      merged.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); merged.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
      if (batched) { merged.setAttribute('carSurface', new T.Float32BufferAttribute(surfaces, 4)); merged.setAttribute('carDetail', new T.Float32BufferAttribute(details, 2)); }
      merged.computeBoundingSphere(); return merged;
    }
    function makeAtlasMaterial() {
      var maps = materialLibrary && materialLibrary.get('vehicleAtlas');
      if (!maps || !maps.map || !maps.normalMap || !maps.specularMap) return null;
      var m = material({ color: 0xffffff, shininess: 100, specular: 0xffffff, vertexColors: true, map: maps.map, normalMap: maps.normalMap, specularMap: maps.specularMap });
      m.name = 'used-car-shared-surface-atlas'; m.combine = T.MixOperation;
      atlasUniforms = {
        carPaintFinish: { value: new T.Vector2(paint.shininess, paint.reflectivity) },
        carHeadEmission: { value: headlamp.emissive.clone().multiplyScalar(headlamp.emissiveIntensity) },
        carTailEmission: { value: taillamp.emissive.clone() },
        carTailBrightness: { value: taillamp.emissiveIntensity },
        carIndicatorEmission: { value: indicator.emissive.clone() }
      };
      // Preserve independent surface finishes in one opaque draw. Only two extra
      // varyings are needed, staying within WebGL 1's minimum varying-vector limit.
      m.onBeforeCompile = function (shader) {
        Object.keys(atlasUniforms).forEach(function (key) { shader.uniforms[key] = atlasUniforms[key]; });
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 carSurface; attribute vec2 carDetail; varying vec4 vCarSurface; varying vec2 vCarDetail;')
          .replace('#include <color_vertex>', '#include <color_vertex>\nvCarSurface = carSurface; vCarDetail = carDetail;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vCarSurface; varying vec2 vCarDetail; uniform vec2 carPaintFinish; uniform vec3 carHeadEmission; uniform vec3 carTailEmission; uniform float carTailBrightness; uniform vec3 carIndicatorEmission;')
          .replace('#include <map_fragment>', 'float carTile = max(0.0, vCarSurface.x);\nvec2 carAtlasUv = vec2(mod(carTile, 2.0) * .5 + .0078125, (carTile < 1.5 ? .5 : 0.0) + .0078125) + fract(vUv) * .484375;\nif (vCarSurface.x > -.5) diffuseColor *= mapTexelToLinear(texture2D(map, carAtlasUv));')
          .replace('#include <specularmap_fragment>', 'float specularStrength = vCarSurface.x > -.5 ? texture2D(specularMap, carAtlasUv).r : 1.0;')
          .replace('#include <normal_fragment_maps>', '#ifdef TANGENTSPACE_NORMALMAP\nvec3 carMapNormal = vec3(0.0, 0.0, 1.0);\nif (vCarSurface.x > -.5) { carMapNormal = texture2D(normalMap, carAtlasUv).xyz * 2.0 - 1.0; carMapNormal.xy *= vCarDetail.x; }\nnormal = perturbNormal2Arb(-vViewPosition, normal, carMapNormal);\n#endif')
          .replace('#include <emissivemap_fragment>', 'if (vCarDetail.y > .5 && vCarDetail.y < 1.5) totalEmissiveRadiance = carHeadEmission;\nelse if (vCarDetail.y > 1.5 && vCarDetail.y < 2.5) totalEmissiveRadiance = carTailEmission * carTailBrightness;\nelse if (vCarDetail.y > 2.5) totalEmissiveRadiance = carIndicatorEmission;')
          .replace('#include <lights_phong_fragment>', 'BlinnPhongMaterial material; material.diffuseColor = diffuseColor.rgb; material.specularColor = vec3(vCarSurface.w); material.specularShininess = vCarSurface.y < 0.0 ? carPaintFinish.x : vCarSurface.y; material.specularStrength = specularStrength;')
          .replace('#include <envmap_fragment>', 'float carReflection = vCarSurface.z < 0.0 ? carPaintFinish.y : vCarSurface.z;\nif (carReflection > .001) {\n' + T.ShaderChunk.envmap_fragment.replace(/\breflectivity\b/g, 'carReflection') + '\n}');
      };
      m.customProgramCacheKey = function () { return 'used-car-opaque-atlas-v1'; };
      reflected.push(m); return m;
    }
    var width = d.width * .5, front = d.length * .5, rear = -front, radius = d.radius, axle = d.wheelbase * .5, wheelY = radius + .015;
    /* Smooth-edged body shell; the lower side edge rises around the wheel arches. */
    var sections = [], count = 38;
    for (var k = 0; k <= count; k++) {
      var z = rear + d.length * k / count, tip = Math.abs(z) / front;
      var taper = 1 - .15 * Math.pow(Math.max(0, (tip - .67) / .33), 1.2);
      var w = width * taper, sideBottom = .25;
      [-axle, axle].forEach(function (center) { var q = Math.abs(z - center); if (q < radius + .065) sideBottom = Math.max(sideBottom, wheelY + Math.sqrt(Math.pow(radius + .065, 2) - q * q)); });
      var top = z > d.cabinFront ? d.hood - .12 * Math.pow((z - d.cabinFront) / (front - d.cabinFront), 1.4) : z < d.cabinRear ? d.tail - .05 * Math.abs((z - d.cabinRear) / (rear - d.cabinRear)) : .86;
      top = Math.max(top, sideBottom + .035);
      sections.push([[-w * .88, sideBottom, z], [-w, sideBottom + .04, z], [-w, top - .06, z], [-w * .81, top + .035, z], [0, top + .055, z], [w * .81, top + .035, z], [w, top - .06, z], [w, sideBottom + .04, z], [w * .88, sideBottom, z], [0, .25, z]]);
    }
    var shell = [], shellIndices = [];
    sections.forEach(function (section) { section.forEach(function (point) { shell.push.apply(shell, point); }); });
    for (var si = 0; si < sections.length - 1; si++) for (var v = 0; v < 10; v++) {
      var next = (v + 1) % 10, a = si * 10 + v, b = (si + 1) * 10 + v, c = (si + 1) * 10 + next, e = si * 10 + next;
      shellIndices.push(a, b, c, a, c, e);
    }
    var bodyGeometry = geo(new T.BufferGeometry()); bodyGeometry.setAttribute('position', new T.Float32BufferAttribute(shell, 3)); bodyGeometry.setIndex(shellIndices); bodyGeometry.computeVertexNormals(); push('paint', bodyGeometry);
    polygon('paint', sections[0]); polygon('paint', sections[sections.length - 1].slice().reverse());
    cube('black', 0, .27, 0, width * 1.56, .12, d.wheelbase + .48);
    cube('undercar', 0, .20, -.15, .15, .09, d.length * .72);
    [-1, 1].forEach(function (side) {
      /* Black lower sill, polished pinstripe, door gaps and flush handles. */
      cube('black', side * (width + .015), .32, 0, .065, .12, Math.max(.60, d.wheelbase - radius * 2));
      cube('chrome', side * (width + .014), .57, 0, .018, .016, d.length * .66);
      var doorZs = style === 'coupe' || style === 'muscle' ? [-.80, .62] : [-1.00, -.20, .68];
      doorZs.forEach(function (doorZ) { cube('black', side * (width + .009), .68, doorZ, .014, .42, .014); });
      [-.57, .28].forEach(function (doorZ, index) { if ((style === 'coupe' || style === 'muscle') && index === 0) return; cube('chrome', side * (width + .027), .91, doorZ, .038, .037, .19); cube('black', side * (width + .013), .905, doorZ, .024, .063, .23); });
      var arch = geo(new T.TorusBufferGeometry(radius + .068, style === 'rally' ? .052 : .024, 5, 20, PI));
      [-axle, axle].forEach(function (z) { push(style === 'rally' ? 'black' : 'paint', arch, transform(side * (width + .008), wheelY, z, 1, 1, 1, 0, PI / 2, 0)); });
      /* Mirror pedestal and convex housing. */
      beam('black', [side * width * .85, 1.03, d.cabinFront - .13], [side * (width + .12), 1.04, d.cabinFront - .18], .055);
      ellipsoid('paint', side * (width + .09), 1.055, d.cabinFront - .21, .09, .065, .14);
      cube('chrome', side * (width + .09), 1.05, d.cabinFront - .34, .14, .09, .015, .12, 0, 0);
      /* Tiny amber wing repeaters and exposed fuel filler. */
      cube('indicator', side * (width + .016), .83, axle + .43, .02, .045, .11);
      if (side === 1) cube('black', side * (width + .012), .82, -axle + .23, .014, .14, .16);
    });
    /* A separate glazed greenhouse with visible seats, dashboard and pillars. */
    var roofY = d.height - .035, glassBase = .925, roofW = width * .71, baseW = width * .92;
    var rf = d.roofFront, rr = d.roofRear, cf = d.cabinFront, cr = d.cabinRear;
    // Low coupes need lower seat mounts: shared head-rest heights must not pierce
    // the roof. Keep 4 cm below its lowest inner edge, including the tilted backrest.
    var seatDrop = Math.max(0, 1.43 - d.height);
    // A lightly crowned low-poly panel and bevelled edge catch broad studio reflections.
    var roofLo = roofW * 1.025, roofHi = roofLo - .045, roofBack = rr - .035, roofFore = rf + .035, roofBottom = roofY - .025, roofTop = roofY + .035;
    var roofPositions = [], roofIndices = [], roofColumns = 6, roofRows = 4;
    for (var rz = 0; rz <= roofRows; rz++) for (var rx = 0; rx <= roofColumns; rx++) {
      var ru = rx / roofColumns * 2 - 1, rv = rz / roofRows * 2 - 1;
      roofPositions.push(ru * roofHi, roofTop + .035 * (1 - ru * ru) * (1 - rv * rv), roofBack + .04 + rz / roofRows * (roofFore - roofBack - .08));
    }
    for (rz = 0; rz < roofRows; rz++) for (rx = 0; rx < roofColumns; rx++) {
      var ra = rz * (roofColumns + 1) + rx, rb = ra + roofColumns + 1;
      roofIndices.push(ra, rb, ra + 1, rb, rb + 1, ra + 1);
    }
    var roofGeometry = geo(new T.BufferGeometry()); roofGeometry.setAttribute('position', new T.Float32BufferAttribute(roofPositions, 3)); roofGeometry.setIndex(roofIndices); roofGeometry.computeVertexNormals(); push('paint', roofGeometry);
    [-1, 1].forEach(function (side) {
      var edge = [[side * roofLo, roofBottom, roofBack], [side * roofLo, roofBottom, roofFore], [side * roofHi, roofTop, roofFore - .04], [side * roofHi, roofTop, roofBack + .04]];
      polygon('paint', side < 0 ? edge : edge.reverse());
    });
    polygon('paint', [[-roofLo, roofBottom, roofFore], [roofLo, roofBottom, roofFore], [roofHi, roofTop, roofFore - .04], [-roofHi, roofTop, roofFore - .04]]);
    polygon('paint', [[roofLo, roofBottom, roofBack], [-roofLo, roofBottom, roofBack], [-roofHi, roofTop, roofBack + .04], [roofHi, roofTop, roofBack + .04]]);
    polygon('glass', [[-baseW, glassBase, cf], [baseW, glassBase, cf], [roofW, roofY - .018, rf], [-roofW, roofY - .018, rf]]);
    polygon('glass', [[baseW, glassBase, cr], [-baseW, glassBase, cr], [-roofW, roofY - .018, rr], [roofW, roofY - .018, rr]]);
    [-1, 1].forEach(function (side) {
      var mid = -.28;
      polygon('glass', [[side * baseW, glassBase, cf], [side * baseW, glassBase, mid + .045], [side * roofW, roofY - .02, mid + .045], [side * roofW, roofY - .02, rf]]);
      polygon('glass', [[side * baseW, glassBase, mid - .045], [side * baseW, glassBase, cr], [side * roofW, roofY - .02, rr], [side * roofW, roofY - .02, mid - .045]]);
      beam('paint', [side * baseW, glassBase - .02, cf], [side * roofW, roofY, rf], .075, .060);
      beam('paint', [side * baseW, glassBase - .02, cr], [side * roofW, roofY, rr], .085, .065);
      beam('black', [side * baseW, glassBase, mid], [side * roofW, roofY - .015, mid], .085, .050);
      beam('chrome', [side * baseW, glassBase - .01, cr], [side * baseW, glassBase - .01, cf], .020, .020);
      beam('chrome', [side * roofW * 1.01, roofY + .012, rr], [side * roofW * 1.01, roofY + .012, rf], .018, .018);
      /* Two front seats, backrest bolsters and head restraints. */
      cube('fabric', side * .38, .60 - seatDrop, -.17, .50, .15, .59);
      cube('fabric', side * .38, .89 - seatDrop, -.48, .49, .62, .16, -.14, 0, 0);
      ellipsoid('fabric', side * .38, 1.21 - seatDrop, -.50, .18, .12, .085);
      [-1, 1].forEach(function (bolster) { ellipsoid('cabin', side * .38 + bolster * .215, .84 - seatDrop, -.40, .065, .26, .11); });
    });
    cube('cabin', 0, .87, cf - .20, width * 1.67, .19, .34);
    cube('fabric', 0, .71 - seatDrop, cr + .32, width * 1.43, .22, .45);
    // The rear backrest also follows the sloping rear window, not just roof height.
    var rearCeiling = glassBase + (roofY - .018 - glassBase) * clamp(.095 / (rr - cr), 0, 1);
    var rearSeatY = Math.min(.95 - seatDrop, rearCeiling - .30);
    cube('fabric', 0, rearSeatY, cr + .13, width * 1.43, .49, .14, -.12, 0, 0);
    cube('cabin', 0, .64, .05, .25, .20, .87);
    tube('black', 0, .81, .17, .018, .18, 0, 0, 0, smallCylinder); ellipsoid('chrome', 0, .91, .17, .035, .035, .035);
    cube('black', -.37, 1.00, cf - .24, .40, .14, .04);
    /* Gauge needles, dashboard vents and original featureless instrument faces. */
    [-.48, -.28].forEach(function (x) { tube('chrome', x, 1.025, cf - .27, .063, .010, PI / 2); tube('black', x, 1.025, cf - .28, .054, .012, PI / 2); cube('marks', x, 1.03, cf - .29, .007, .055, .010, 0, 0, -.35); });
    [-.65, 0, .65].forEach(function (x) { cube('black', x, .93, cf - .38, .14, .06, .015); });
    /* Windshield wipers and small rear-view mirror. */
    [-.28, .25].forEach(function (x) { beam('black', [x, glassBase + .035, cf + .008], [x + .16, glassBase + .13, cf - .10], .017, .012); });
    cube('chrome', 0, roofY - .15, rf + .10, .24, .07, .04);
    beam('black', [0, roofY - .02, rf + .02], [0, roofY - .13, rf + .10], .018);
    /* Front and rear fascia, slatted radiator, intercooler and number plates. */
    cube('black', 0, .43, front + .015, width * 1.73, .17, .09);
    cube('paint', 0, .34, front + .012, width * 1.92, .09, .12);
    cube('black', 0, .72, front - .01, width * .91, .18, .05);
    for (var slat = -4; slat <= 4; slat++) cube('chrome', slat * width * .087, .72, front + .02, .017, .11, .012);
    for (var vent = -2; vent <= 2; vent++) cube('undercar', 0, .42 + vent * .023, front + .065, width * .72, .006, .015);
    cube('black', 0, .48, rear - .025, width * 1.82, .16, .09);
    cube('paint', 0, .38, rear - .02, width * 1.94, .09, .11);
    [front + .075, rear - .083].forEach(function (z) { cube('marks', 0, .51, z, .36, .115, .012); cube('black', 0, .51, z + (z > 0 ? .008 : -.008), .22, .022, .009); });
    /* Hood and boot seams are discrete geometry, visible from the chase camera. */
    var hoodRear = cf + .03;
    [-1, 1].forEach(function (side) { beam('black', [side * width * .66, d.hood + .055, hoodRear], [side * width * .63, d.hood - .045, front - .17], .010); });
    beam('black', [-width * .63, d.hood - .045, front - .17], [width * .63, d.hood - .045, front - .17], .010);
    beam('black', [-width * .70, d.tail + .035, cr - .03], [width * .70, d.tail + .035, cr - .03], .012);
    /* Round, rectangular and thin lamps distinguish the six silhouettes. */
    [-1, 1].forEach(function (side) {
      var lampX = side * width * .65, lampY = Math.min(d.hood - .025, .81);
      if (d.lamps === 'round' || d.lamps === 'double') {
        var centers = d.lamps === 'double' ? [lampX - .12, lampX + .12] : [lampX];
        centers.forEach(function (x) { tube('black', x, lampY, front - .025, .135, .065, PI / 2); tube('chrome', x, lampY, front + .006, .112, .015, PI / 2); tube('headlamp', x, lampY, front + .018, .095, .018, PI / 2); });
      } else {
        var lh = d.lamps === 'slim' ? .075 : .14;
        cube('black', lampX, lampY, front - .007, width * .47, lh + .04, .06);
        cube('headlamp', lampX, lampY, front + .028, width * .42, lh, .025);
        cube('chrome', lampX, lampY - lh * .4, front + .047, width * .36, .012, .012);
      }
      cube('indicator', side * width * .89, lampY, front + .01, .08, .075, .03);
      var tailY = d.tail - .035;
      cube('black', lampX, tailY, rear - .005, width * .59, .17, .06);
      cube('taillamp', lampX, tailY, rear - .040, width * .52, .117, .024);
      cube('marks', lampX - side * .10, tailY, rear - .054, .07, .076, .010);
      cube('indicator', lampX + side * .13, tailY, rear - .055, .09, .076, .010);
      cube('chrome', lampX, tailY + .067, rear - .036, width * .57, .013, .018);
      tube('chrome', side * (style === 'muscle' ? .64 : .57), .27, rear + .01, .060, .18, PI / 2);
      tube('black', side * (style === 'muscle' ? .64 : .57), .27, rear - .084, .045, .012, PI / 2);
    });
    if (style === 'wagon') {
      [-1, 1].forEach(function (side) { beam('black', [side * roofW * .80, roofY + .12, rr + .07], [side * roofW * .80, roofY + .12, rf - .10], .045); [-1.3, .08].forEach(function (z) { cube('chrome', side * roofW * .80, roofY + .065, z, .05, .12, .08); }); });
      beam('black', [-roofW * .80, roofY + .13, -.2], [roofW * .80, roofY + .13, -.2], .04);
    }
    if (style === 'muscle') {
      cube('black', 0, d.hood + .065, (cf + front) * .5, .35, .065, .75);
      cube('black', 0, d.hood + .12, front - .66, .31, .06, .17);
      [-1, 1].forEach(function (side) { cube('marks', side * .19, d.hood + .087, (cf + front) * .5, .12, .012, front - cf - .12, -.025); cube('marks', side * .19, roofY + .039, (rr + rf) / 2, .12, .007, rf - rr); });
    }
    if (style === 'rally') {
      [-.25, .25].forEach(function (x) { tube('black', x, .65, front + .14, .135, .11, PI / 2); tube('headlamp', x, .65, front + .20, .105, .014, PI / 2); });
      cube('black', 0, d.hood + .10, 1.20, .46, .10, .32, -.12);
      [-1, 1].forEach(function (side) { cube('black', side * width, .21, -axle - .28, .11, .24, .035, -.12); cube('marks', side * (width + .018), .73, -.08, .02, .24, .38); cube('black', side * (width + .031), .73, -.08, .015, .13, .10); });
    }
    if (d.spoiler) {
      var spoilerY = style === 'rally' ? 1.14 : .99;
      [-.56, .56].forEach(function (x) { cube('black', x, (spoilerY + d.tail) / 2, rear + .27, .065, spoilerY - d.tail + .04, .12); });
      cube('paint', 0, spoilerY + .025, rear + .23, width * 1.94, .055, .26, .08);
      [-1, 1].forEach(function (side) { cube('black', side * width * .94, spoilerY + .045, rear + .23, .045, .14, .32); });
    }
    /* Thin, irregular chips follow the body shell instead of floating block scratches.
       Colour and specular texture give the metal its grain without extra surface faces. */
    for (var sc = 0; sc < 34; sc++) {
      var side = rnd() < .5 ? -1 : 1, zz = (rnd() - .5) * d.length * .65, yy = .36 + rnd() * .45;
      var nearAxle = Math.min(Math.abs(zz - axle), Math.abs(zz + axle)), archRadius = radius + .068;
      if (nearAxle < archRadius) yy = Math.max(yy, wheelY + Math.sqrt(archRadius * archRadius - nearAxle * nearAxle) + .04);
      if (yy > .86) continue;
      var span = .015 + rnd() * .14, chipHeight = .003 + rnd() * .012, xx = side * (width + .012);
      polygon('rust', [[xx, yy, zz - span], [xx, yy + chipHeight * .45, zz - span * .4], [xx, yy + chipHeight, zz + span * .5], [xx, yy - chipHeight * .2, zz + span], [xx, yy - chipHeight * .7, zz - span * .2]]);
    }
    [-1, 1].forEach(function (side) {
      for (var chip = 0; chip < 8; chip++) {
        var center = (chip / 7 - .5) * Math.max(.6, d.wheelbase - radius * 2), xx = side * (width + .05), yy = .33 + rnd() * .02, span = .03 + rnd() * .08;
        polygon('rust', [[xx, yy, center - span], [xx, yy + .007 + rnd() * .008, center - span * .6], [xx, yy + rnd() * .012, center + span], [xx, yy - .006, center + span * .2]]);
      }
    });
    var mats = { paint: paint, black: black, chrome: chrome, alloy: alloy, disc: disc, caliper: caliper, rubber: rubber, cabin: cabin, fabric: fabric, glass: glass, headlamp: headlamp, taillamp: taillamp, indicator: indicator, marks: marks, rust: rust, undercar: undercar };
    var headLights = [], brakeLights = [], interiorBounds = new T.Box3();
    (batches.fabric || []).forEach(function (p) { p.geometry.computeBoundingBox(); interiorBounds.union(p.geometry.boundingBox.clone().applyMatrix4(p.matrix)); });
    group.userData.interiorMaxY = interiorBounds.max.y;
    atlasMaterial = makeAtlasMaterial();
    var opaqueParts = [];
    Object.keys(batches).forEach(function (key) {
      if (atlasMaterial && key !== 'glass' && key !== 'rust') { opaqueParts = opaqueParts.concat(tagged(batches[key], key)); return; }
      var mesh = new T.Mesh(merge(batches[key], key), mats[key]); mesh.name = 'vehicle-' + key; body.add(mesh);
      if (key === 'headlamp') headLights.push(mesh); if (key === 'taillamp') brakeLights.push(mesh); if (key === 'rust') damageMeshes.push(mesh);
    });
    if (atlasMaterial) {
      var opaqueMesh = new T.Mesh(merge(opaqueParts, 'atlas'), atlasMaterial); opaqueMesh.name = 'vehicle-opaque'; body.add(opaqueMesh);
      // Lamps share this mesh but retain independent emission through the shader.
      headLights.push(opaqueMesh); brakeLights.push(opaqueMesh);
    }
    /* Rotating five-spoke wheels. The disc/caliper stay readable through the rim. */
    function buildWheel(side, isFront) {
      var pivot = new T.Group(), spin = new T.Group(); pivot.add(spin); group.add(pivot);
      pivot.position.set(side * (width - .015), wheelY, isFront ? axle : -axle);
      pivot.name = (isFront ? 'front' : 'rear') + (side < 0 ? '-left' : '-right');
      var tireGeo = shared.tire || (shared.tire = geo(new T.CylinderBufferGeometry(radius, radius, .23, 24, 1, true)));
      var tireParts = [{ geometry: tireGeo, matrix: transform(0, 0, 0, 1, 1, 1, 0, 0, PI / 2), nativeUv: true, uvRepeatU: 5 }];
      var sidewallGeo = shared.sidewall || (shared.sidewall = geo(new T.TorusBufferGeometry(radius * .83, radius * .145, 5, 24)));
      [-1, 1].forEach(function (face) { tireParts.push({ geometry: sidewallGeo, matrix: transform(face * .116, 0, 0, 1, 1, 1, 0, PI / 2, 0), nativeUv: true, uvRepeatU: 5 }); });
      var rimParts = [], rotorParts = [], treadParts = [], hubParts = [];
      function wp(list, g, x, y, z, sx, sy, sz, rx, ry, rz) { list.push({ geometry: g, matrix: transform(x, y, z, sx, sy, sz, rx, ry, rz) }); }
      var outward = side * .135, discX = side * .115, rimR = radius * .65;
      var rimRing = shared.rimRing || (shared.rimRing = geo(new T.TorusBufferGeometry(rimR, .022, 5, 20)));
      wp(rimParts, rimRing, outward, 0, 0, 1, 1, 1, 0, PI / 2);
      wp(rotorParts, cylinder, discX, 0, 0, radius * .56, .012, radius * .56, 0, 0, PI / 2);
      var spokeCount = style === 'sedan' ? 10 : style === 'rally' ? 8 : style === 'wagon' ? 6 : style === 'compact' ? 4 : 5;
      for (var spoke = 0; spoke < spokeCount; spoke++) {
        var a = spoke * PI * 2 / spokeCount, yy = Math.cos(a) * rimR * .49, zz = Math.sin(a) * rimR * .49;
        wp(rimParts, box, outward, yy, zz, .033, rimR * .94, .035, a, 0, 0);
        wp(hubParts, smallCylinder, outward + side * .022, Math.cos(a) * .060, Math.sin(a) * .060, .011, .016, .011, 0, 0, PI / 2);
      }
      wp(rimParts, cylinder, outward, 0, 0, .065, .04, .065, 0, 0, PI / 2);
      for (var stripe = 0; !materialLibrary && stripe < 24; stripe++) {
        var angle = stripe * PI * 2 / 24;
        wp(treadParts, box, 0, Math.cos(angle) * (radius + .001), Math.sin(angle) * (radius + .001), .19, .008, .014, -angle, .08, 0);
      }
      if (atlasMaterial) {
        var wheelParts = tagged(rotorParts, 'disc').concat(tagged(rimParts, 'alloy'), tagged(tireParts.concat(hubParts, treadParts), 'rubber'));
        var wheelMesh = new T.Mesh(merge(wheelParts, 'atlas'), atlasMaterial); wheelMesh.name = 'vehicle-wheel-atlas'; spin.add(wheelMesh);
      } else {
        spin.add(new T.Mesh(merge(rotorParts), disc)); spin.add(new T.Mesh(merge(rimParts), alloy)); spin.add(new T.Mesh(merge(tireParts.concat(hubParts, treadParts)), rubber));
      }
      var brake = new T.Mesh(box, caliper); brake.position.set(discX, radius * .28, radius * .38); brake.scale.set(.04, .14, .08); pivot.add(brake);
      var data = { pivot: pivot, mesh: spin, front: isFront, side: side, radius: radius, brake: brake }; wheelMeshes.push(data);
    }
    [-1, 1].forEach(function (side) { buildWheel(side, true); buildWheel(side, false); });
    var steeringWheel = new T.Group(); steeringWheel.position.set(-.37, 1.02, cf - .48); steeringWheel.rotation.x = -.28; body.add(steeringWheel);
    var steeringRing = geo(new T.TorusBufferGeometry(.142, .018, 5, 20));
    var steeringRimParts = [{ geometry: steeringRing, matrix: new T.Matrix4() }, { geometry: cylinder, matrix: transform(0, 0, 0, .046, .032, .046, PI / 2) }];
    var steeringSpokes = [];
    for (var spokeIndex = 0; spokeIndex < 3; spokeIndex++) { var spokeAngle = spokeIndex * PI * 2 / 3; steeringSpokes.push({ geometry: box, matrix: transform(-Math.sin(spokeAngle) * .06, Math.cos(spokeAngle) * .06, 0, .021, .13, .013, 0, 0, spokeAngle) }); }
    if (atlasMaterial) steeringWheel.add(new T.Mesh(merge(tagged(steeringRimParts, 'black').concat(tagged(steeringSpokes, 'chrome')), 'atlas'), atlasMaterial));
    else { steeringWheel.add(new T.Mesh(merge(steeringRimParts), black)); steeringWheel.add(new T.Mesh(merge(steeringSpokes), chrome)); }
    group.userData.vehicleStyle = style; group.userData.originalArtwork = true;
    function setBrakeLights(on) { taillamp.emissiveIntensity = on ? 2.35 : .26; if (atlasUniforms) atlasUniforms.carTailBrightness.value = taillamp.emissiveIntensity; }
    function setCondition(condition) {
      condition = condition || {};
      var age = clamp(Number(condition.rust) || 0, 0, 1), damage = clamp(Number(condition.bodyDamage) || 0, 0, 1);
      rust.opacity = age * .85;
      finishAge = age; finishDamage = damage; updatePaintFinish();
    }
    function dispose() {
      if (disposed) return; disposed = true;
      geometries.forEach(function (g) { g.dispose(); }); materials.forEach(function (m) { m.dispose(); }); textures.forEach(function (t) { t.dispose(); });
      if (group.parent) group.parent.remove(group);
      while (group.children.length) group.remove(group.children[0]);
    }
    return { group: group, body: body, wheels: wheelMeshes, steeringWheel: steeringWheel, brakeLights: brakeLights, headLights: headLights, damageMeshes: damageMeshes, dimensions: { width: d.width, length: d.length, height: d.height, wheelbase: d.wheelbase, wheelRadius: radius }, style: style, setBrakeLights: setBrakeLights, setCondition: setCondition, setEnvironment: setEnvironment, dispose: dispose, resources: { geometries: geometries, materials: materials, textures: textures, atlasMaterial: atlasMaterial } };
  }
  var api = { create: create, styles: STYLES };
  root.UsedCarVehicles = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
