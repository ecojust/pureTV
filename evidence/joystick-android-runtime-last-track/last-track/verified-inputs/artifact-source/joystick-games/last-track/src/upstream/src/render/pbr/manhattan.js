// Daylite "waterfront" kit (slice-only, PBR): a red-dust sunset over the lower-Manhattan harbour. Street-front blocks and towers in
// haze on the land side (granite, limestone, brownstone, glass) with lit window panes, spires and water tanks; a quay wall and a
// promenade; the harbour with two ferries; a granite star-fort island and the Statue of Liberty (47 m pedestal, 46 m statue, torch
// lit). addManhattan() places the static geometry (Node-safe); createDustFx() drifts red dust motes (one Points draw call).
import * as THREE from 'three';
import { TB } from '../heroTrack.js';
import { mulberry32 } from '../../core/mathUtil.js';
import { glowSprite } from './maps.js';

/** The kit's look. roadTone multiplies the road's grey tint; strips are the barrier lights through corners; steam tints the dust banks. */
export const MANHATTAN_KIT = Object.freeze({
  roadTone: [1.08, 0.9, 0.8],
  strips: [[2.4, 1.2, 0.35], [0.5, 1.9, 2.4], [2.2, 0.55, 1.4]],        // sodium amber, cool LED, magenta sign light
  lamp: [2.5, 1.45, 0.5],
  steam: [0.42, 0.2, 0.12],
  billboards: [['MANHATTAN', [255, 170, 70]], ['LIBERTY', [120, 230, 255]], ['HUDSON', [255, 110, 170]], ['RED DUST', [255, 150, 60]], ['LAST LIGHT', [255, 200, 120]], ['PIER 9', [110, 255, 200]], ['DAYLITE', [255, 190, 90]], ['FERRY 3', [120, 200, 255]]],
  billboardTex: Object.freeze({ w: 256, h: 128, fit: true }),
});

const HDR = { sodium: [2.0, 1.2, 0.45], cool: [1.0, 1.35, 1.8], warm: [1.8, 1.0, 0.42], beacon: [3.2, 0.2, 0.08], flame: [3.6, 2.2, 0.9], floodlight: [2.8, 2.2, 1.4] };
const STONE = ['#5b5752', '#6b6258', '#7a7266', '#4a4f57', '#8a7f72', '#5e5147'];   // granite, limestone, brownstone, glass-steel
const PATINA = '#6fae98', PATINA_DK = '#4f8a74', GOLD = '#c9a24a', GRANITE = '#8f8a80', GRANITE_TOP = '#9a9488';
const QUAY = '#8a8478', QUAY_SIDE = '#55504a', ISLAND = '#4f5e3c', PATH = '#8a8170';
const UV0 = [0, 0], TAU = Math.PI * 2;

/** One lit window pane on a vertical face: axis 'z' = the plane z=p (a is x), axis 'x' = the plane x=p (a is z). Emissive, double-sided. */
function pane(b, axis, p, a, y, w, h, rgb) {
  const a0 = a - w / 2, a1 = a + w / 2, y0 = y - h / 2, y1 = y + h / 2;
  const q = axis === 'z' ? [[a0, y0, p], [a1, y0, p], [a1, y1, p], [a0, y1, p]] : [[p, y0, a0], [p, y0, a1], [p, y1, a1], [p, y1, a0]];
  return b.quadRaw(q, [UV0, UV0, UV0, UV0], [rgb, rgb, rgb, rgb]);
}
/** Emissive box in raw HDR colour (all six faces). */
function glowBox(b, cx, cy, cz, sx, sy, sz, rgb) {
  const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
  const faces = [
    [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]],
    [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]],
    [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]],
    [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]],
    [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
  ];
  for (const f of faces) b.quadRaw(f, [UV0, UV0, UV0, UV0], [rgb, rgb, rgb, rgb]);
  return b;
}
/** Emissive cone (the torch flame): base ring at y0 with radius r0, apex at y1. */
function glowCone(b, cx, y0, cz, r0, y1, seg, rgb) {
  for (let k = 0; k < seg; k++) {
    const a0 = (k / seg) * TAU, a1 = ((k + 1) / seg) * TAU;
    b.triRaw([cx + Math.cos(a0) * r0, y0, cz + Math.sin(a0) * r0], [cx + Math.cos(a1) * r0, y0, cz + Math.sin(a1) * r0], [cx, y1, cz], UV0, UV0, UV0, rgb, rgb, rgb);
  }
  return b;
}

/**
 * A tower of stacked tiers (setbacks) with lit window panes on all four faces. style: 'setback' (a needle and a beacon), 'deco'
 * (a stepped drum and a spire), 'slab' (flat roof with a water tank). near: corner pilasters, worth the triangles only up close.
 */
function tower(H, w, d, style, rr, near = false) {
  const lit = new TB(), glow = new TB();
  const body = STONE[(rr() * STONE.length) | 0], trim = '#948b7e';
  const tiers = style === 'slab' ? 1 : 2 + ((rr() * 2) | 0);
  let y = 0, cw = w, cd = d;
  for (let k = 0; k < tiers; k++) {
    const last = k === tiers - 1, th = last ? H - y : H * (k === 0 ? 0.55 : 0.45 / (tiers - 1));
    lit.box(0, y + th / 2, 0, cw, th, cd, body, trim);
    if (near) for (const sx of [-1, 1]) for (const sz of [-1, 1]) lit.box(sx * (cw / 2 - 0.3), y + th / 2, sz * (cd / 2 - 0.3), 0.8, th, 0.8, trim);
    // window panes on the four faces: a column every 3.4 m, a row every 4 m, about a third of them lit
    for (const [axis, p, span] of [['z', cd / 2 + 0.05, cw], ['z', -cd / 2 - 0.05, cw], ['x', cw / 2 + 0.05, cd], ['x', -cw / 2 - 0.05, cd]]) {
      for (let a = -span / 2 + 2.2; a < span / 2 - 1.5; a += 3.4) for (let yy = y + 2.6; yy < y + th - 2; yy += 4) if (rr() < 0.24) pane(glow, axis, p, a, yy, 1.5, 2.1, rr() < 0.7 ? HDR.sodium : HDR.cool);
    }
    y += th; cw *= 0.74 + 0.08 * rr(); cd *= 0.74 + 0.08 * rr();
  }
  if (style === 'deco') {
    lit.cyl(0, y + 4, 0, cw * 0.42, cw * 0.3, 8, 'y', 12, trim, body);          // stepped drum
    lit.cyl(0, y + 17, 0, cw * 0.22, 0.5, 18, 'y', 8, trim, trim);               // needle
    glowBox(glow, 0, y + 26.2, 0, 0.7, 0.7, 0.7, HDR.beacon);
  } else if (style === 'setback') {
    lit.cyl(0, y + 5, 0, cw * 0.2, 0.4, 10, 'y', 8, trim, trim);
    glowBox(glow, 0, y + 10.3, 0, 0.6, 0.6, 0.6, HDR.beacon);
  } else {
    lit.cyl(cw * 0.22, y + 2.6, cd * 0.18, 2.4, 2.4, 5.2, 'y', 10, '#5a4a3a', '#3a2e24');   // water tank on the roof
  }
  return { lit, glow };
}

/** A harbour ferry, along +x: dark hull, white superstructure, a funnel and two rows of cabin windows. */
function ferry() {
  const lit = new TB(), glow = new TB();
  lit.box(0, 0.9, 0, 28, 1.8, 8, '#2c3038', '#3a3f48');
  lit.box(0, 3.2, 0, 26, 2.8, 6.4, '#c9c6bb', '#d8d4c8');
  lit.box(0, 5.4, 0, 22, 0.6, 5.2, '#d8d4c8', '#d8d4c8');
  lit.cyl(-6, 7.2, 0, 0.9, 1.1, 2.8, 'y', 8, '#8a3a26', '#3a2e24');
  for (const sz of [-1, 1]) for (let a = -11; a <= 11; a += 2.6) pane(glow, 'z', sz * 3.24, a, 3.4, 1.4, 1.1, HDR.warm);
  return { lit, glow };
}

/**
 * The Statue of Liberty at the island's surface (y=0): a stepped granite star-fort base, a 47 m pedestal and the 46 m statue on
 * top, torch tip at 93 m. Her face is +z and her torch arm is on her right (+x). Patina for the copper, HDR for the torch and floodlights.
 */
export function libertyStatue() {
  const lit = new TB(), glow = new TB(), P = 47;                 // P: the pedestal's height = the statue's base
  lit.cyl(0, 3, 0, 30, 30, 6, 'y', 8, GRANITE, GRANITE);          // star-fort base (octagonal)
  lit.box(0, 16, 0, 24, 20, 24, GRANITE, GRANITE_TOP);            // lower pedestal
  for (const [y0, y1, w] of [[26, 32, 22], [32, 38, 20], [38, 44, 18.5], [44, P, 17]]) lit.box(0, (y0 + y1) / 2, 0, w, y1 - y0, w, GRANITE, GRANITE_TOP);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; glowBox(glow, Math.cos(a) * 27.6, 6.6, Math.sin(a) * 27.6, 0.9, 0.9, 0.9, HDR.floodlight); }
  // the statue: a stepped plinth, the robe as tapered drums, head, crown, arms and tablet
  const drum = (y0, y1, r0, r1, col) => lit.cyl(0, (y0 + y1) / 2, 0, r0, r1, y1 - y0, 'y', 16, col, col);
  lit.box(0, P + 0.6, 0, 9.5, 1.2, 9.5, GRANITE);
  drum(P, P + 13, 4.7, 4.2, PATINA);
  drum(P + 13, P + 26, 4.2, 3.7, PATINA);
  drum(P + 26, P + 34, 3.7, 3.9, PATINA);
  drum(P + 34, P + 36, 3.9, 2.4, PATINA);
  drum(P + 36, P + 37.4, 1.1, 1.0, PATINA);                       // neck
  drum(P + 37.4, P + 42, 2.1, 2.3, PATINA);                       // head
  drum(P + 40.6, P + 41.6, 2.5, 2.5, PATINA_DK);                  // crown band
  // seven crown rays, splayed outward from the head
  const ray = new TB();
  ray.cyl(0, 2, 0, 0.26, 0.05, 4.2, 'y', 5, PATINA, PATINA);
  for (let k = 0; k < 7; k++) {
    const phi = (k / 7) * TAU;
    lit.place(ray, Math.cos(phi) * 2.1, P + 41.8, Math.sin(phi) * 2.1, Math.atan2(-Math.cos(phi), Math.sin(phi)), 1, 0.55);
  }
  lit.box(4.0, P + 34, 0, 1.9, 11, 1.9, PATINA);                  // raised right arm
  lit.cyl(4.0, P + 40.4, 0, 1.2, 0.9, 1.8, 'y', 12, GOLD, GOLD);  // torch cup
  glowCone(glow, 4.0, P + 41.3, 0, 1.0, P + 45.6, 10, HDR.flame); // flame
  lit.box(-4.0, P + 24, 0, 1.8, 14, 1.8, PATINA);                 // left arm, down to the tablet
  lit.box(-1.8, P + 27, 4.6, 4.2, 7.2, 0.5, PATINA);              // tablet of independence
  for (const x of [-2.6, -1.3, 0, 1.3, 2.6]) lit.box(x, P + 18, Math.sqrt(Math.max(0, 4.4 * 4.4 - x * x)) + 0.1, 0.4, 26, 0.4, PATINA_DK);   // drapery folds
  return { lit, glow, height: P + 45.6 };
}

/**
 * Places the waterfront around the circuit into the builders the race geometry already has.
 * ctx: { n, half, W(i,d,y), smp(i), clear(x,z,r), rng, towers, towerGlow, bounds }. The quay is the land side's edge: the water lies
 * east of it, the towers stand west of it. Returns { plumes:[], embers:[], gantries:0, water:{cx,cz,w,h}, motes:{center,span,count,wind},
 * statue:{x,z} }: the runtime makes the water plane and the dust (createDustFx).
 */
export function addManhattan({ n, half, W, smp, clear, rng, towers, towerGlow, bounds }) {
  const cx = (bounds.minX + bounds.maxX) / 2, cz = (bounds.minY + bounds.maxY) / 2;
  const waterX = bounds.maxX + 34;                                // quay edge: a 34 m promenade past the east barrier
  const onLand = (p) => p[0] < waterX - 34;
  const yawAt = (i) => smp(i).heading;
  const put = (u, p, yaw) => { towers.place(u.lit, p[0], 0, p[2], yaw); towerGlow.place(u.glow, p[0], 0, p[2], yaw); };
  // buildings set back from the barrier; keeps trying spots until one is on land and clears the road by `rad` metres
  const plant = (count, near, span, rad, build) => {
    let placed = 0;
    for (let tries = 0; tries < 400 && placed < count; tries++) {
      const i = Math.floor(rng() * n), sd = rng() < 0.5 ? 1 : -1, p = W(i, sd * (half + near + rng() * span));
      if (!onLand(p) || !clear(p[0], p[2], rad)) continue;
      build(p, yawAt(i) + (rng() - 0.5) * 0.4, mulberry32(Math.floor(rng() * 1e9)));
      placed++;
    }
    return placed;
  };
  // street-front blocks right behind the barrier, then the canyon towers, then the skyline behind them
  plant(16, 22, 6, 12, (p, yaw, rr) => put(tower(18 + rr() * 30, 16 + rr() * 8, 14 + rr() * 8, rr() < 0.5 ? 'slab' : 'setback', rr, true), p, yaw));
  plant(14, 40, 70, 30, (p, yaw, rr) => {
    const style = ['setback', 'deco', 'slab'][(rr() * 3) | 0];
    put(tower(60 + rr() * 90, 22 + rr() * 12, 20 + rr() * 10, style, rr, rr() < 0.5), p, yaw);
  });
  plant(30, 130, 520, 60, (p, yaw, rr) => put(tower(90 + rr() * 210, 28 + rr() * 24, 26 + rr() * 20, rr() < 0.45 ? 'deco' : 'setback', rr), p, yaw));
  // the far shore, behind the water, mostly lost in the haze
  for (let k = 0; k < 18; k++) {
    const rr = mulberry32(Math.floor(rng() * 1e9)), p = [waterX + 1330 + rng() * 160, 0, cz - 600 + (k + rng()) * (1200 / 18)];
    put(tower(120 + rr() * 190, 30 + rr() * 30, 26 + rr() * 20, rr() < 0.5 ? 'deco' : 'setback', rr), p, rng() * 0.2);
  }
  // quay wall along the harbour edge, long enough to run past the circuit
  for (let z = cz - 1200; z < cz + 1200; z += 24) towers.box(waterX, 0.15, z + 12, 1.2, 0.7, 24, QUAY_SIDE, QUAY);
  // ferries in the harbour, lined up with the quay
  for (const [dx, dz, yaw] of [[200, -180, Math.PI / 2], [430, 150, Math.PI / 2 + 0.12]]) put(ferry(), [waterX + dx, 0, cz + dz], yaw);
  // the island and the statue, facing out to sea (+x), her back to the city; close enough to read from the quay and the start straight
  const ix = waterX + 160, iz = cz, st = libertyStatue();
  const isl = new TB(); isl.cyl(0, 0.7, 0, 105, 100, 1.4, 'y', 28, ISLAND, PATH);
  towers.place(isl, ix, 0, iz, 0);
  towers.place(st.lit, ix, 1.4, iz, -Math.PI / 2); towerGlow.place(st.glow, ix, 1.4, iz, -Math.PI / 2);
  return {
    plumes: [], embers: [], gantries: 0,
    water: { cx: waterX + 650, cz, w: 1300, h: 2400 },            // harbour: from the quay out 1.3 km
    motes: { center: [cx, cz], span: [900, 900], count: 1400, wind: [1.3, 0.4] },
    statue: { x: ix, z: iz, height: st.height },
  };
}

/**
 * createDustFx(group, { center, span, count, wind, seed }) -> { stats, update(dt, camera, time), setQuality(q), dispose() }.
 * Red dust motes drifting on the wind in a box around the circuit. Positions are a pure function of time (seek-safe), wrapping at the edges.
 */
export function createDustFx(group, { center = [0, 0], span = [900, 900], count = 1000, wind = [1, 0], seed = 61 } = {}) {
  const r = mulberry32(seed);
  const phase = new Float32Array(count * 3), pos = new Float32Array(count * 3);
  for (let k = 0; k < count * 3; k++) phase[k] = r();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tex = new THREE.DataTexture(glowSprite(32), 32, 32, THREE.RGBAFormat);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  const mat = new THREE.PointsMaterial({ color: 0xc8703f, size: 1.6, sizeAttenuation: true, map: tex, transparent: true, opacity: 0.42, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  pts.name = 'dust'; pts.frustumCulled = false; pts.renderOrder = 6;
  group.add(pts);
  const wrap = (v) => v - Math.floor(v);
  return {
    stats: { motes: count },
    update(dt, camera, time) {
      for (let k = 0; k < count; k++) {
        const u = wrap(phase[k * 3] + (wind[0] * time) / span[0]), v = wrap(phase[k * 3 + 2] + (wind[1] * time) / span[1]);
        pos[k * 3] = center[0] - span[0] / 2 + u * span[0];
        pos[k * 3 + 1] = 1 + phase[k * 3 + 1] * 26 + 0.8 * Math.sin(time * 0.6 + k);   // a gentle bob, never below the road
        pos[k * 3 + 2] = center[1] - span[1] / 2 + v * span[1];
      }
      geo.attributes.position.needsUpdate = true;
    },
    setQuality(q) { pts.visible = q.name !== 'low'; },
    dispose() { group.remove(pts); geo.dispose(); mat.dispose(); tex.dispose(); },
  };
}
