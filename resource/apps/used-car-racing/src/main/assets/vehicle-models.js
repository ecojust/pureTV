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
  function create(T, styleId, color, seed) {
    if (!T || !T.BufferGeometry) throw new Error('Three.js is required to build vehicles');
    var style = STYLES[styleId] ? styleId : 'compact', d = STYLES[style];
    var group = new T.Group(), body = new T.Group(); group.add(body);
    group.name = 'used-car-' + style;
    var geometries = [], materials = [], textures = [], disposed = false;
    var batches = {}, shared = {}, wheelMeshes = [], damageMeshes = [];
    var randomState = (Number(seed) || 97123) >>> 0;
    function rnd() { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; }
    function geo(g) { geometries.push(g); return g; }
    function material(options) {
      var m = new T.MeshPhongMaterial(options); m.color.convertSRGBToLinear();
      if (m.emissive) m.emissive.convertSRGBToLinear(); materials.push(m); return m;
    }
    var paint = material({ color: color === undefined ? 0x335e78 : color, shininess: 76, specular: 0xb9d0d7 });
    var black = material({ color: 0x11161c, shininess: 18, specular: 0x384452 });
    var rubber = material({ color: 0x111316, shininess: 5, specular: 0x252b31 });
    var chrome = material({ color: 0xa7b7c3, shininess: 110, specular: 0xffffff });
    var alloy = material({ color: 0xd2dce2, shininess: 105, specular: 0xffffff });
    var disc = material({ color: 0x5c6670, shininess: 60, specular: 0xb0bcc4 });
    var caliper = material({ color: style === 'rally' ? 0xe7a83c : 0xc23b32, shininess: 42 });
    var cabin = material({ color: 0x253039, shininess: 7 });
    var fabric = material({ color: style === 'muscle' ? 0x5f403a : 0x39434c, shininess: 2 });
    var glass = material({ color: 0x65838e, shininess: 120, specular: 0xe6ffff, transparent: true, opacity: .58, depthWrite: false, side: T.DoubleSide });
    var headlamp = material({ color: 0xf5f0d7, emissive: 0xc8eaff, emissiveIntensity: .82, shininess: 130 });
    var taillamp = material({ color: 0xd63735, emissive: 0xb01c18, emissiveIntensity: .26, shininess: 100 });
    var indicator = material({ color: 0xf5ac43, emissive: 0x53310c, shininess: 95 });
    var marks = material({ color: 0xe8e4d7, shininess: 30 });
    var rust = material({ color: 0x83472e, shininess: 1, transparent: true, opacity: .48, depthWrite: false, side: T.DoubleSide });
    var undercar = material({ color: 0x333c43, shininess: 24 });
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
    function merge(parts) {
      var positions = [], normals = [];
      parts.forEach(function (p) {
        var g = p.geometry.index ? p.geometry.toNonIndexed() : p.geometry.clone(); g.applyMatrix4(p.matrix);
        var a = g.attributes.position.array, n = g.attributes.normal.array;
        for (var j = 0; j < a.length; j++) { positions.push(a[j]); normals.push(n[j]); } g.dispose();
      });
      var merged = geo(new T.BufferGeometry()); merged.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); merged.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
      merged.computeBoundingSphere(); return merged;
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
    cube('paint', 0, roofY, (rf + rr) / 2, roofW * 2.05, .065, rf - rr + .07, 0, 0, 0);
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
      cube('fabric', side * .38, .60, -.17, .50, .15, .59);
      cube('fabric', side * .38, .89, -.48, .49, .62, .16, -.14, 0, 0);
      ellipsoid('fabric', side * .38, 1.21, -.50, .18, .12, .085);
      [-1, 1].forEach(function (bolster) { ellipsoid('cabin', side * .38 + bolster * .215, .84, -.40, .065, .26, .11); });
    });
    cube('cabin', 0, .87, cf - .20, width * 1.67, .19, .34);
    cube('fabric', 0, .71, cr + .32, width * 1.43, .22, .45);
    cube('fabric', 0, .95, cr + .13, width * 1.43, .49, .14, -.12, 0, 0);
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
    /* Reproducible age: paint chips, side scratches and oxidised lower seams. */
    for (var sc = 0; sc < 27; sc++) {
      var side = rnd() < .5 ? -1 : 1, zz = (rnd() - .5) * d.length * .72, yy = .40 + rnd() * .41;
      cube('rust', side * (width + .021), yy, zz, .009, .008 + rnd() * .017, .045 + rnd() * .23, (rnd() - .5) * .15);
    }
    [-1, 1].forEach(function (side) { cube('rust', side * (width + .024), .35, .1, .013, .035, d.wheelbase * .65); });
    var mats = { paint: paint, black: black, chrome: chrome, alloy: alloy, disc: disc, caliper: caliper, rubber: rubber, cabin: cabin, fabric: fabric, glass: glass, headlamp: headlamp, taillamp: taillamp, indicator: indicator, marks: marks, rust: rust, undercar: undercar };
    var headLights = [], brakeLights = [];
    Object.keys(batches).forEach(function (key) {
      var mesh = new T.Mesh(merge(batches[key]), mats[key]); mesh.name = 'vehicle-' + key; body.add(mesh);
      if (key === 'headlamp') headLights.push(mesh); if (key === 'taillamp') brakeLights.push(mesh); if (key === 'rust') damageMeshes.push(mesh);
    });
    /* Rotating five-spoke wheels. The disc/caliper stay readable through the rim. */
    function buildWheel(side, isFront) {
      var pivot = new T.Group(), spin = new T.Group(); pivot.add(spin); group.add(pivot);
      pivot.position.set(side * (width - .015), wheelY, isFront ? axle : -axle);
      pivot.name = (isFront ? 'front' : 'rear') + (side < 0 ? '-left' : '-right');
      var tireGeo = shared.tire || (shared.tire = geo(new T.CylinderBufferGeometry(radius, radius, .23, 24, 1, true)));
      var tireParts = [{ geometry: tireGeo, matrix: transform(0, 0, 0, 1, 1, 1, 0, 0, PI / 2) }];
      var sidewallGeo = shared.sidewall || (shared.sidewall = geo(new T.TorusBufferGeometry(radius * .83, radius * .145, 5, 24)));
      [-1, 1].forEach(function (face) { tireParts.push({ geometry: sidewallGeo, matrix: transform(face * .116, 0, 0, 1, 1, 1, 0, PI / 2, 0) }); });
      var rimParts = [], rotorParts = [], treadParts = [], hubParts = [];
      function wp(list, g, x, y, z, sx, sy, sz, rx, ry, rz) { list.push({ geometry: g, matrix: transform(x, y, z, sx, sy, sz, rx, ry, rz) }); }
      var outward = side * .135, discX = side * .115, rimR = radius * .65;
      var rimRing = shared.rimRing || (shared.rimRing = geo(new T.TorusBufferGeometry(rimR, .022, 5, 20)));
      wp(rimParts, rimRing, outward, 0, 0, 1, 1, 1, 0, PI / 2);
      wp(rotorParts, cylinder, discX, 0, 0, radius * .56, .012, radius * .56, 0, 0, PI / 2);
      for (var spoke = 0; spoke < 5; spoke++) {
        var a = spoke * PI * 2 / 5, yy = Math.cos(a) * rimR * .49, zz = Math.sin(a) * rimR * .49;
        wp(rimParts, box, outward, yy, zz, .033, rimR * .94, .035, a, 0, 0);
        wp(hubParts, smallCylinder, outward + side * .022, Math.cos(a) * .060, Math.sin(a) * .060, .013, .016, .013, 0, 0, PI / 2);
      }
      wp(rimParts, cylinder, outward, 0, 0, .065, .04, .065, 0, 0, PI / 2);
      for (var stripe = 0; stripe < 24; stripe++) {
        var angle = stripe * PI * 2 / 24;
        wp(treadParts, box, 0, Math.cos(angle) * (radius + .001), Math.sin(angle) * (radius + .001), .19, .008, .014, -angle, .08, 0);
      }
      var rotor = new T.Mesh(merge(rotorParts), disc); spin.add(rotor);
      spin.add(new T.Mesh(merge(rimParts), alloy)); spin.add(new T.Mesh(merge(tireParts.concat(hubParts, treadParts)), rubber));
      var brake = new T.Mesh(box, caliper); brake.position.set(discX, radius * .28, radius * .38); brake.scale.set(.04, .14, .08); pivot.add(brake);
      var data = { pivot: pivot, mesh: spin, front: isFront, side: side, radius: radius, brake: brake }; wheelMeshes.push(data);
    }
    [-1, 1].forEach(function (side) { buildWheel(side, true); buildWheel(side, false); });
    var steeringWheel = new T.Group(); steeringWheel.position.set(-.37, 1.02, cf - .48); steeringWheel.rotation.x = -.28; body.add(steeringWheel);
    var steeringRing = geo(new T.TorusBufferGeometry(.142, .018, 5, 20));
    steeringWheel.add(new T.Mesh(merge([{ geometry: steeringRing, matrix: new T.Matrix4() }, { geometry: cylinder, matrix: transform(0, 0, 0, .046, .032, .046, PI / 2) }]), black));
    var steeringSpokes = [];
    for (var spokeIndex = 0; spokeIndex < 3; spokeIndex++) { var spokeAngle = spokeIndex * PI * 2 / 3; steeringSpokes.push({ geometry: box, matrix: transform(-Math.sin(spokeAngle) * .06, Math.cos(spokeAngle) * .06, 0, .021, .13, .013, 0, 0, spokeAngle) }); }
    steeringWheel.add(new T.Mesh(merge(steeringSpokes), chrome));
    group.userData.vehicleStyle = style; group.userData.originalArtwork = true;
    function setBrakeLights(on) { taillamp.emissiveIntensity = on ? 2.35 : .26; }
    function setCondition(condition) { condition = condition || {}; rust.opacity = clamp(Number(condition.rust) || 0, 0, 1) * .72; paint.shininess = 76 - clamp(Number(condition.bodyDamage) || 0, 0, 1) * 42; }
    function dispose() {
      if (disposed) return; disposed = true;
      geometries.forEach(function (g) { g.dispose(); }); materials.forEach(function (m) { m.dispose(); }); textures.forEach(function (t) { t.dispose(); });
      if (group.parent) group.parent.remove(group);
      while (group.children.length) group.remove(group.children[0]);
    }
    return { group: group, body: body, wheels: wheelMeshes, steeringWheel: steeringWheel, brakeLights: brakeLights, headLights: headLights, damageMeshes: damageMeshes, dimensions: { width: d.width, length: d.length, height: d.height, wheelbase: d.wheelbase, wheelRadius: radius }, style: style, setBrakeLights: setBrakeLights, setCondition: setCondition, dispose: dispose, resources: { geometries: geometries, materials: materials, textures: textures } };
  }
  var api = { create: create, styles: STYLES };
  root.UsedCarVehicles = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
