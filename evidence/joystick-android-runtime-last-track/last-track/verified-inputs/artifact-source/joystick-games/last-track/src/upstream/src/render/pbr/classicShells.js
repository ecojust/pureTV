// Two more cars on the shared PBR body pipeline (carBody.js shell profiles), each with its own parts:
//  - Gullwing: a low DeLorean-style wedge in brushed steel (fast, thin skin, three weapon slots).
//  - Rhino: a military 4x4, tall and boxy with flared arches, bull bar, winch, spare on the tailgate and a roll cage (slow, heavy, mud-ready).
// Each shell exports its profile (*_SHELL) and part hooks. heroCarPBR.js calls the hooks in place of the Hammer's parts, and they
// keep the same names and return shapes (kit / armour / lights / interior / internals / gaps / underglow), so damage, livery and
// turret code work unchanged. Node-safe: geometry only, no WebGL.
import * as THREE from 'three';
import { mergeGeo, xf, roundedBox, ribbon, tube, clamp } from './geo.js';
import { sectionAt } from './carBody.js';

// ------------------------------------------------------------------ helpers
const ens = (g) => {
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  if (!g.attributes.normal) g.computeVertexNormals();
  return g;
};
/** A zero-length geometry that still carries the attributes mergeGeo expects (for parts a car does not have). */
const emptyGeo = () => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([], 2));
  g.setIndex([]);
  return g;
};
const merge = (list) => (list.length ? mergeGeo(list.map(ens)) : emptyGeo());
const place = (g, pos, rot = [0, 0, 0]) => xf(g, { pos, rot });
/** Cylinder along an axis ('x' | 'y' | 'z'), optionally open-ended (liners). */
const cyl = (r, len, seg = 16, axis = 'y', open = false) => {
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, open);
  if (axis === 'x') g.rotateZ(Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2);
  return g;
};

// ------------------------------------------------------------------ Gullwing: DeLorean-style brushed-steel wedge
// Sections (x, half-width, bottom, shoulder, top): low wedge nose, raked windscreen, short flat roof, tall rear face.
export const GULLWING_SHELL = Object.freeze({
  keys: [
    [-2.12, 0.84, 0.30, 0.86, 0.90], [-1.85, 0.94, 0.27, 0.92, 0.96], [-1.40, 0.98, 0.26, 0.94, 0.99], [-0.80, 0.99, 0.25, 0.93, 0.98],
    [-0.20, 0.99, 0.25, 0.88, 0.92], [0.40, 0.99, 0.25, 0.74, 0.76], [1.00, 0.98, 0.24, 0.64, 0.66], [1.60, 0.90, 0.22, 0.56, 0.58],
    [1.95, 0.76, 0.20, 0.48, 0.52], [2.12, 0.58, 0.20, 0.42, 0.46],
  ],
  x0: -2.12, x1: 2.12, hoodX: [0.55, 1.9], ridge: 0,
  canopy: [[-1.25, 0.78, 0.0], [-1.0, 0.82, 0.1], [-0.6, 0.8, 0.19], [-0.1, 0.74, 0.2], [0.25, 0.66, 0.12], [0.55, 0.55, 0.0]],
  wheels: Object.freeze({ front: 1.2, rear: -1.15, track: 0.92, radius: 0.33, width: 0.27, archR: 0.4, archIn: 0.72 }),
  zones: Object.freeze({ hood: 1.1, trunk: -1.7, door: -0.2, flankY: 0.6 }),
});
const gA = (x) => sectionAt(x, GULLWING_SHELL);

export const gullwingHooks = {
  carbonKit() {
    const main = [], front = [], rear = [];
    front.push(place(roundedBox(0.12, 0.13, 1.8, 0.03, 2), [2.07, 0.2, 0]));                 // black rubber nose valance
    rear.push(place(roundedBox(0.12, 0.12, 1.7, 0.03, 2), [-2.1, 0.24, 0]));                  // black rear valance
    for (let k = 0; k < 6; k++) rear.push(place(roundedBox(0.03, 0.03, 0.9, 0.01, 1), [-2.13, 0.44 + k * 0.045, 0]));   // engine-air louvres
    return { main: merge(main), front: merge(front), rear: merge(rear) };
  },
  armour() {
    const p = [];
    p.push(place(roundedBox(0.16, 0.11, 1.92, 0.04, 2), [2.2, 0.25, 0]));                    // brushed-steel nose blade
    p.push(place(roundedBox(0.16, 0.13, 1.86, 0.04, 2), [-2.18, 0.28, 0]));                  // brushed-steel tail blade
    for (const s of [1, -1]) {
      p.push(place(roundedBox(2.7, 0.045, 0.05, 0.015, 1), [-0.05, 0.3, s * 1.0]));           // sill mouldings
      p.push(place(roundedBox(0.14, 0.08, 0.2, 0.03, 2), [0.1, 0.8, s * 1.1]));               // mirror blades
      p.push(place(roundedBox(0.14, 0.02, 0.03, 0.008, 1), [-0.2, 0.84, s * 1.0]));            // door pull
    }
    return merge(p);
  },
  headLights() {
    // full-width LED bar along the nose tip, plus the low running strip
    return merge([place(roundedBox(0.04, 0.03, 1.4, 0.012, 1), [2.11, 0.36, 0]), place(roundedBox(0.03, 0.02, 1.6, 0.01, 1), [2.1, 0.3, 0])]);
  },
  tailLights() {
    const p = [];
    p.push(place(roundedBox(0.03, 0.05, 1.56, 0.015, 2), [-2.12, 0.74, 0]));                 // full-width rear light bar
    p.push(place(roundedBox(0.04, 0.03, 0.5, 0.01, 1), [-1.22, 0.99, 0], [0, 0, 0.1]));      // brake light on the rear edge of the glass
    return merge(p);
  },
  reverseLights() { return merge([-0.55, 0.55].map((z) => place(roundedBox(0.04, 0.04, 0.12, 0.01, 1), [-2.13, 0.6, z]))); },
  displays() {
    const p = [];
    p.push(place(new THREE.PlaneGeometry(0.42, 0.11), [0.22, 0.9, 0], [0, -Math.PI / 2, -0.25]));       // digital dash strip
    p.push(place(new THREE.PlaneGeometry(0.16, 0.1), [0.3, 0.86, 0.26], [0, -Math.PI / 2, -0.25]));       // side readouts
    p.push(place(new THREE.PlaneGeometry(0.16, 0.1), [0.3, 0.86, -0.26], [0, -Math.PI / 2, -0.25]));
    return merge(p);
  },
  underglow() {
    const p = [];
    for (const s of [1, -1]) { const pts = []; for (let x = -1.5; x <= 1.7; x += 0.2) pts.push([x, 0.262, s * gA(x).hw * 0.9]); p.push(ribbon(pts, 0.025, [0, -1, 0])); }
    const front = [], rear = [];
    for (let z = -0.8; z <= 0.8; z += 0.2) { front.push([1.85, 0.25, z]); rear.push([-1.9, 0.26, z]); }
    p.push(ribbon(front, 0.025, [0, -1, 0]), ribbon(rear, 0.025, [0, -1, 0]));
    return merge(p);
  },
  interior() {
    const p = [];
    for (const s of [0.36, -0.36]) {
      p.push(place(roundedBox(0.5, 0.2, 0.42, 0.08, 3), [-0.35, 0.52, s]));                    // bucket seat base
      p.push(place(roundedBox(0.12, 0.46, 0.42, 0.06, 3), [-0.66, 0.8, s], [0, 0, 0.22]));       // backrest
      p.push(place(roundedBox(0.16, 0.12, 0.3, 0.05, 2), [-0.7, 1.0, s], [0, 0, 0.22]));         // headrest
    }
    p.push(place(roundedBox(0.5, 0.2, 1.42, 0.08, 4), [0.2, 0.84, 0], [0, 0, -0.25]));          // dash
    p.push(place(roundedBox(0.9, 0.14, 0.2, 0.05, 2), [-0.2, 0.52, 0]));                         // centre console
    p.push(place(roundedBox(2.0, 0.04, 1.4, 0.01, 1), [-0.3, 0.42, 0]));                         // cabin floor
    p.push(place(new THREE.TorusGeometry(0.17, 0.018, 8, 20), [0.05, 0.98, 0.34], [0, Math.PI / 2, 0.35]));   // steering wheel
    return merge(p);
  },
  internals() {
    const dark = [], metal = [];
    const D = (g) => dark.push(g), M = (g) => metal.push(g);
    // rear-mounted V6 with cylinder heads; front fuel tank
    M(place(roundedBox(0.95, 0.42, 0.7, 0.05, 3), [-1.55, 0.6, 0]));
    for (const s of [1, -1]) M(place(roundedBox(0.8, 0.14, 0.2, 0.04, 2), [-1.55, 0.78, s * 0.3]));
    M(place(roundedBox(0.8, 0.22, 0.9, 0.06, 2), [1.3, 0.42, 0]));
    M(place(roundedBox(0.08, 0.3, 0.9, 0.02, 2), [1.95, 0.36, 0]));                                  // radiator
    // twin exhaust out the rear underside
    for (const s of [1, -1]) M(tube([[-1.6, 0.3, s * 0.3], [-2.0, 0.27, s * 0.3], [-2.25, 0.3, s * 0.3]], 0.04, 8));
    // floor pan, transmission tunnel, wheel liners (dark, closed behind the arches)
    D(place(roundedBox(3.6, 0.03, 1.3, 0.01, 1), [-0.1, 0.27, 0]));
    D(place(roundedBox(3.0, 0.06, 0.32, 0.02, 2), [-0.2, 0.36, 0]));
    for (const xc of [1.2, -1.15]) for (const s of [1, -1]) D(place(cyl(0.36, 0.3, 16, 'z', true), [xc, 0.33, s * 0.75]));
    return { dark: merge(dark), metal: merge(metal) };
  },
  panelGaps() {
    const lines = [];
    const top = (x, z) => { const s = gA(x); const f = clamp(Math.abs(z) / (s.hw * 0.93), 0, 1); return [x, s.yt - (s.yt - s.ysh) * f * f * 0.62 + 0.004, z]; };
    const hood = []; for (let k = 0; k <= 12; k++) hood.push(top(0.55, -0.8 + (k / 12) * 1.6)); lines.push(ribbon(hood, 0.012, [0, 1, 0]));
    const deck = []; for (let k = 0; k <= 12; k++) deck.push(top(-1.25, -0.8 + (k / 12) * 1.6)); lines.push(ribbon(deck, 0.012, [0, 1, 0]));
    for (const s of [1, -1]) {
      for (const x of [-0.85, 0.45]) {                                                              // gull-wing door: front and rear shut lines
        const pts = []; for (let k = 0; k <= 8; k++) pts.push([x, 0.33 + (k / 8) * 0.6, s * (gA(x).hw + 0.003)]); lines.push(ribbon(pts, 0.012, [s, 0, 0]));
      }
      const sill = []; for (let x = -0.85; x <= 0.45; x += 0.13) sill.push([x, 0.33, s * (gA(x).hw + 0.003)]); lines.push(ribbon(sill, 0.012, [s, 0, 0]));
    }
    return merge(lines);
  },
  wingFlap() { return emptyGeo(); },   // no spoiler on this car
};

// ------------------------------------------------------------------ Rhino: military 4x4
// Sections: flat slab sides, high rocker (ground clearance), square cab, flat bonnet, near-vertical glass.
export const RHINO_SHELL = Object.freeze({
  keys: [
    [-2.62, 0.98, 0.50, 1.00, 1.06], [-2.45, 1.08, 0.48, 1.12, 1.16], [-1.70, 1.12, 0.46, 1.16, 1.20], [-0.40, 1.12, 0.46, 1.16, 1.22],
    [0.60, 1.12, 0.46, 1.16, 1.22], [1.60, 1.12, 0.48, 1.14, 1.20], [2.30, 1.10, 0.52, 1.10, 1.14], [2.52, 1.02, 0.56, 1.02, 1.06],
    [2.62, 0.92, 0.60, 0.98, 1.00],
  ],
  x0: -2.62, x1: 2.62, hoodX: [1.1, 2.3], ridge: 0,
  canopy: [[-1.45, 1.0, 0.0], [-1.3, 1.02, 0.36], [-0.9, 1.04, 0.5], [0.2, 1.04, 0.5], [0.8, 1.02, 0.44], [1.0, 0.98, 0.0]],
  wheels: Object.freeze({ front: 1.6, rear: -1.7, track: 1.0, radius: 0.47, width: 0.34, archR: 0.6, archIn: 0.9 }),
  zones: Object.freeze({ hood: 1.7, trunk: -2.3, door: -0.4, flankY: 0.9 }),
});
const rA = (x) => sectionAt(x, RHINO_SHELL);

export const rhinoHooks = {
  carbonKit() {
    const main = [], front = [], rear = [];
    // roof rack (rails, cross bars), two jerrycans, snorkel on the right A-pillar
    for (const s of [1, -1]) main.push(place(roundedBox(1.9, 0.06, 0.06, 0.02, 2), [-0.3, 1.8, s * 0.82]));
    for (const x of [-1.0, -0.2, 0.6]) main.push(place(roundedBox(0.06, 0.06, 1.7, 0.02, 2), [x, 1.8, 0]));
    for (const s of [1, -1]) main.push(place(roundedBox(0.36, 0.5, 0.24, 0.05, 2), [-0.9, 1.98, s * 0.5]));
    main.push(tube([[0.82, 1.1, 0.96], [0.6, 1.5, 1.0], [0.42, 1.8, 1.0]], 0.06, 10));
    main.push(place(roundedBox(0.16, 0.12, 0.16, 0.03, 2), [0.4, 1.9, 1.0]));
    // front bumper with bull bar, winch and hook, skid plate
    front.push(place(roundedBox(0.3, 0.32, 2.3, 0.06, 3), [2.72, 0.56, 0]));
    front.push(tube([[2.7, 0.5, 0.95], [2.95, 0.72, 0.7], [3.02, 0.8, 0], [2.95, 0.72, -0.7], [2.7, 0.5, -0.95]], 0.05, 8));
    front.push(place(cyl(0.11, 0.3, 14, 'x'), [2.9, 0.72, 0]));
    front.push(place(new THREE.TorusGeometry(0.05, 0.015, 6, 12), [3.06, 0.66, 0]));
    front.push(place(roundedBox(1.6, 0.06, 1.6, 0.02, 2), [2.2, 0.4, 0]));
    // rear bumper and step, spare wheel on the tailgate
    rear.push(place(roundedBox(0.3, 0.42, 2.3, 0.06, 3), [-2.8, 0.62, 0]));
    rear.push(place(roundedBox(0.32, 0.06, 1.6, 0.02, 2), [-2.82, 0.3, 0]));
    rear.push(place(new THREE.TorusGeometry(0.42, 0.13, 14, 32), [-2.98, 0.96, 0], [0, Math.PI / 2, 0]));
    rear.push(place(cyl(0.29, 0.22, 24, 'x'), [-2.98, 0.96, 0]));
    return { main: merge(main), front: merge(front), rear: merge(rear) };
  },
  armour() {
    const p = [];
    for (const s of [1, -1]) {
      p.push(place(roundedBox(1.7, 0.9, 0.05, 0.02, 2), [-0.2, 0.92, s * 1.2]));               // bolted door armour
      p.push(place(roundedBox(0.95, 0.5, 0.05, 0.02, 2), [-2.0, 0.85, s * 1.2]));              // rear quarter plate
      for (const x of [-0.9, 0.5]) for (const y of [0.55, 1.2]) p.push(place(cyl(0.02, 0.03, 8, 'z'), [x, y, s * 1.245]));   // door bolts
      for (const xc of [1.6, -1.7]) {                                                          // flared wheel arches: half-torus at the arch edge
        p.push(place(new THREE.TorusGeometry(0.64, 0.05, 8, 28, Math.PI), [xc, 0.47, s * 1.14]));
      }
      p.push(place(roundedBox(0.14, 0.2, 0.08, 0.02, 2), [0.7, 1.12, s * 1.22]));              // mirror arm
    }
    p.push(place(roundedBox(0.16, 0.2, 2.2, 0.05, 2), [2.9, 0.5, 0]));                          // front armour cross member
    return merge(p);
  },
  headLights() {
    const p = [];
    for (const s of [1, -1]) p.push(place(cyl(0.13, 0.06, 20, 'x'), [2.62, 1.0, s * 0.8]));    // round lamps in cages
    return merge(p);
  },
  tailLights() {
    const p = [];
    for (const s of [1, -1]) p.push(place(roundedBox(0.04, 0.16, 0.3, 0.012, 2), [-2.66, 1.12, s * 0.8]));
    return merge(p);
  },
  reverseLights() { return merge([-0.45, 0.45].map((z) => place(roundedBox(0.04, 0.06, 0.12, 0.01, 1), [-2.67, 0.9, z]))); },
  displays() {
    const p = [];
    for (const z of [-0.36, 0.36]) p.push(place(new THREE.CircleGeometry(0.07, 20), [0.6, 1.26, z], [0, -Math.PI / 2, 0]));   // gauges
    p.push(place(new THREE.PlaneGeometry(0.3, 0.14), [0.55, 1.2, 0], [0, -Math.PI / 2, -0.2]));                                 // screen
    return merge(p);
  },
  underglow() {
    const p = [];
    for (const s of [1, -1]) { const pts = []; for (let x = -2.0; x <= 2.0; x += 0.2) pts.push([x, 0.44, s * rA(x).hw * 0.8]); p.push(ribbon(pts, 0.025, [0, -1, 0])); }
    const front = [], rear = [];
    for (let z = -0.9; z <= 0.9; z += 0.2) { front.push([1.9, 0.44, z]); rear.push([-2.0, 0.44, z]); }
    p.push(ribbon(front, 0.025, [0, -1, 0]), ribbon(rear, 0.025, [0, -1, 0]));
    return merge(p);
  },
  interior() {
    const p = [];
    for (const s of [0.42, -0.42]) {
      p.push(place(roundedBox(0.52, 0.2, 0.46, 0.08, 3), [-0.45, 0.92, s]));                    // seat base
      p.push(place(roundedBox(0.14, 0.62, 0.46, 0.06, 3), [-0.78, 1.25, s], [0, 0, 0.14]));      // backrest
      p.push(place(roundedBox(0.2, 0.16, 0.34, 0.06, 2), [-0.82, 1.56, s], [0, 0, 0.14]));       // headrest
    }
    p.push(place(roundedBox(0.5, 0.26, 2.2, 0.08, 4), [0.42, 1.18, 0], [0, 0, -0.12]));         // flat dash
    p.push(place(roundedBox(0.4, 0.14, 0.3, 0.05, 2), [0.5, 1.02, 0.0]));                         // transmission tunnel
    p.push(place(roundedBox(2.4, 0.04, 1.7, 0.01, 1), [-0.3, 0.8, 0]));                           // cab floor
    p.push(place(new THREE.TorusGeometry(0.2, 0.024, 8, 24), [0.12, 1.36, 0.4], [0, Math.PI / 2, 0.3]));   // steering wheel
    return merge(p);
  },
  internals() {
    const dark = [], metal = [];
    const D = (g) => dark.push(g), M = (g) => metal.push(g);
    // engine under the bonnet, radiator behind the grille, fuel tank under the rear floor
    M(place(roundedBox(1.2, 0.55, 0.9, 0.06, 3), [1.6, 0.92, 0]));
    M(place(roundedBox(0.1, 0.5, 1.2, 0.03, 2), [2.4, 0.9, 0]));
    M(place(roundedBox(1.0, 0.32, 1.0, 0.07, 3), [-1.5, 0.66, 0]));
    // roll cage: side hoops and roof bars
    for (const s of [1, -1]) M(tube([[0.9, 0.8, s * 0.85], [0.7, 1.55, s * 0.88], [-1.0, 1.58, s * 0.88], [-1.45, 0.9, s * 0.86]], 0.04, 8));
    M(tube([[0.72, 1.58, -0.88], [0.72, 1.58, 0.88]], 0.04, 8));
    M(tube([[-1.0, 1.58, -0.88], [-1.0, 1.58, 0.88]], 0.04, 8));
    // axle tubes, driveshaft, exhaust stack behind the right side
    for (const x of [1.6, -1.7]) M(place(cyl(0.07, 2.2, 10, 'z'), [x, 0.47, 0]));
    M(place(cyl(0.06, 4.2, 10, 'x'), [-0.05, 0.6, 0]));
    M(place(cyl(0.06, 1.7, 12, 'y'), [-1.95, 1.2, -1.1]));
    // dark: floor pan and wheel liners behind the arches
    D(place(roundedBox(4.6, 0.04, 1.8, 0.01, 1), [0, 0.45, 0]));
    for (const xc of [1.6, -1.7]) for (const s of [1, -1]) D(place(cyl(0.34, 0.3, 16, 'z', true), [xc, 0.47, s * 0.78]));
    return { dark: merge(dark), metal: merge(metal) };
  },
  panelGaps() {
    const lines = [];
    const top = (x, z) => { const s = rA(x); const f = clamp(Math.abs(z) / (s.hw * 0.93), 0, 1); return [x, s.yt - (s.yt - s.ysh) * f * f * 0.5 + 0.004, z]; };
    const hood = []; for (let k = 0; k <= 12; k++) hood.push(top(1.1, -0.95 + (k / 12) * 1.9)); lines.push(ribbon(hood, 0.012, [0, 1, 0]));
    const tg = []; for (let k = 0; k <= 10; k++) tg.push(top(-2.2, -0.9 + (k / 10) * 1.8)); lines.push(ribbon(tg, 0.012, [0, 1, 0]));
    for (const s of [1, -1]) for (const x of [-1.25, 0.45]) {                                  // door shut lines
      const pts = []; for (let k = 0; k <= 8; k++) pts.push([x, 0.55 + (k / 8) * 0.65, s * (rA(x).hw + 0.003)]); lines.push(ribbon(pts, 0.012, [s, 0, 0]));
    }
    return merge(lines);
  },
  wingFlap() { return emptyGeo(); },   // no spoiler on this car
};
