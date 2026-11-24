import * as THREE from 'three';
import { makeTrack, sampleTrack, projectTrack } from './tracks.mjs';

// Every mesh, marking and texture below is generated locally. The road uses the
// same center line and width as collision and lap logic, not a visual shortcut.
const UP = new THREE.Vector3(0, 1, 0);
const TAU = Math.PI * 2;
const THEMES = {
  skyport: { sky: '#152c50', horizon: '#647b9a', fog: '#354e72', road: '#344558', ground: '#243744', curb: '#ff764a', accent: '#6be7ed', sun: '#dcecff', light: 0xffd5ad, night: true },
  coast: { sky: '#54add1', horizon: '#c5e8e9', fog: '#a9d5dd', road: '#637274', ground: '#759357', curb: '#2687c6', accent: '#ffe4a3', sun: '#fff7db', light: 0xfff3d4, night: false },
  canyon: { sky: '#c98467', horizon: '#f1c28e', fog: '#d3a078', road: '#67524c', ground: '#b17f56', curb: '#f9bd57', accent: '#53e2dc', sun: '#ffeab4', light: 0xffcf96, night: false },
};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function random(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function themeFor(id) { return THEMES[id] || THEMES.skyport; }
function color(value) { return new THREE.Color(value); }
function roadPoint(track, s, lateral = 0, lift = 0) { const p = sampleTrack(track, s); return new THREE.Vector3(p.x + Math.cos(p.yaw) * lateral, p.y + lift, p.z - Math.sin(p.yaw) * lateral); }

// Static scenery is merged by material. This also avoids hundreds of Object3D
// update calls on television browsers with slow JavaScript and software GPUs.
class Batch {
  constructor() { this.positions = []; this.normals = []; this.colors = []; }
  add(geometry, matrix, tint = '#ffffff') {
    const p = geometry.getAttribute('position'), n = geometry.getAttribute('normal'), idx = geometry.index, originalColors = geometry.getAttribute('color');
    const c = color(tint), normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix), v = new THREE.Vector3(), q = new THREE.Vector3();
    const count = idx ? idx.count : p.count;
    for (let j = 0; j < count; j++) { const i = idx ? idx.getX(j) : j; v.fromBufferAttribute(p, i).applyMatrix4(matrix); q.fromBufferAttribute(n, i).applyMatrix3(normalMatrix).normalize(); this.positions.push(v.x, v.y, v.z); this.normals.push(q.x, q.y, q.z); this.colors.push(c.r * (originalColors ? originalColors.getX(i) : 1), c.g * (originalColors ? originalColors.getY(i) : 1), c.b * (originalColors ? originalColors.getZ(i) : 1)); }
  }
  triangle(a, b, c, tint) {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize(), col = color(tint);
    for (const v of [a, b, c]) { this.positions.push(v.x, v.y, v.z); this.normals.push(n.x, n.y, n.z); this.colors.push(col.r, col.g, col.b); }
  }
  quad(a, b, c, d, tint) { this.triangle(a, b, c, tint); this.triangle(a, c, d, tint); }
  geometry() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3)); g.computeBoundingSphere(); return g; }
}
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYL = new THREE.CylinderGeometry(1, 1, 1, 7, 1);
const UNIT_CONE = new THREE.ConeGeometry(1, 1, 7, 1);
const UNIT_SPHERE = new THREE.IcosahedronGeometry(1, 1);
const UNIT_ROCK = new THREE.IcosahedronGeometry(1, 0);
function transform(x, y, z, sx = 1, sy = 1, sz = 1, yaw = 0, roll = 0) { return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, roll)), new THREE.Vector3(sx, sy, sz)); }
function box(batch, x, y, z, sx, sy, sz, tint, yaw = 0) { batch.add(UNIT_BOX, transform(x, y, z, sx, sy, sz, yaw), tint); }
function cylinder(batch, x, y, z, radius, height, tint, yaw = 0, roll = 0) { batch.add(UNIT_CYL, transform(x, y, z, radius, height, radius, yaw, roll), tint); }
function beam(batch, a, b, width, depth, tint) { const d = new THREE.Vector3().subVectors(b, a), matrix = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()), new THREE.Vector3(width, d.length(), depth)); batch.add(UNIT_BOX, matrix, tint); }
function mesh(batch, material) { return new THREE.Mesh(batch.geometry(), material); }
function disposeGroup(group) { const gs = new Set(), ms = new Set(), ts = new Set(); group.traverse(o => { if (o.geometry) gs.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) { ms.add(m); for (const key of ['map', 'alphaMap', 'emissiveMap']) if (m[key]) ts.add(m[key]); } }); gs.forEach(g => g.dispose()); ms.forEach(m => m.dispose()); ts.forEach(t => t.dispose()); group.clear(); }

function canvasTexture(width, height, draw) { const c = document.createElement('canvas'); c.width = width; c.height = height; draw(c.getContext('2d'), width, height); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function asphaltTexture() { const r = random(9142); const t = canvasTexture(128, 128, (ctx, w, h) => { ctx.fillStyle = '#c4c4c4'; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 3500; i++) { const v = 140 + Math.floor(r() * 85); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(r() * w, r() * h, 1, 1); } ctx.strokeStyle = '#b6b6b6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 110); ctx.lineTo(39, 102); ctx.lineTo(55, 111); ctx.lineTo(128, 90); ctx.stroke(); }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 1; return t; }
function windowsTexture(r) { const t = canvasTexture(64, 128, (ctx, w, h) => { ctx.fillStyle = '#1a2e46'; ctx.fillRect(0, 0, w, h); for (let y = 4; y < h; y += 10) for (let x = 4; x < w; x += 10) { ctx.fillStyle = r() > .32 ? (r() > .3 ? '#c8cfb3' : '#85b6cd') : '#243953'; ctx.fillRect(x, y, 4, 5); } }); return t; }
function signTexture(title, subtitle, accent) { return canvasTexture(512, 128, (ctx, w, h) => { ctx.fillStyle = '#142b40'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = accent; ctx.fillRect(0, 0, 12, h); ctx.fillRect(w - 12, 0, 12, h); ctx.textAlign = 'center'; ctx.font = '900 49px sans-serif'; ctx.fillStyle = '#fff4df'; ctx.fillText(title, w / 2, 61); ctx.font = '600 19px sans-serif'; ctx.fillStyle = accent; ctx.fillText(subtitle, w / 2, 99); }); }
function shadowTexture() { return canvasTexture(64, 64, (ctx, w, h) => { const gradient = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2); gradient.addColorStop(0, 'rgba(0,9,20,.9)'); gradient.addColorStop(.55, 'rgba(0,9,20,.65)'); gradient.addColorStop(1, 'rgba(0,9,20,0)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h); }); }
function roadGeometry(track) {
  const positions = [], uvs = [], indices = [], count = 384;
  for (let i = 0; i <= count; i++) { const s = i / count * track.length, p = sampleTrack(track, s), n = p.width * .5; for (const side of [-1, 1]) { positions.push(p.x + Math.cos(p.yaw) * n * side, p.y, p.z - Math.sin(p.yaw) * n * side); uvs.push(side < 0 ? 0 : 2, s / 10); } if (i < count) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals(); return g;
}
function wedge(batch, width, z0, z1, bottom, frontTop, backTop, tint) {
  const a = new THREE.Vector3(-width, bottom, z0), b = new THREE.Vector3(width, bottom, z0), c = new THREE.Vector3(width, bottom, z1), d = new THREE.Vector3(-width, bottom, z1);
  const e = new THREE.Vector3(-width, backTop, z0), f = new THREE.Vector3(width, backTop, z0), g = new THREE.Vector3(width * .72, frontTop, z1), h = new THREE.Vector3(-width * .72, frontTop, z1);
  batch.quad(e, h, g, f, tint); batch.quad(a, e, f, b, tint); batch.quad(b, f, g, c, tint); batch.quad(c, g, h, d, tint); batch.quad(d, h, e, a, tint); batch.quad(a, b, c, d, tint);
}
function carParts() {
  const body = new Batch(), dark = new Batch(), trim = new Batch(), glass = new Batch(), lamps = new Batch(), rear = new Batch(), helmet = new Batch();
  // Wedge nose, swept sidepods, rear wing and an exposed driver's cockpit.
  wedge(body, 1.0, -.65, 2.12, .42, .64, 1.0, '#ffffff');
  wedge(body, 1.04, -1.7, -.48, .42, .94, .84, '#eeeeee');
  for (const side of [-1, 1]) { box(body, side * 1.05, .67, -.12, .48, .55, 2.35, '#ffffff'); box(trim, side * 1.30, .42, -.08, .18, .13, 2.8, '#1c2935'); box(trim, side * .99, 1.02, -.3, .05, .06, 1.25, '#ffeac7'); }
  box(body, 0, 1.24, -1.68, 2.8, .16, .53, '#ffffff');
  for (const side of [-1, 1]) box(dark, side * .72, .96, -1.67, .11, .55, .13, '#202939');
  box(dark, 0, .42, .08, 1.9, .2, 3.8, '#1b2632'); box(dark, 0, .92, -.25, 1.16, .33, 1.45, '#1b2632');
  box(trim, 0, .71, 1.62, .20, .04, .78, '#f4edd8'); box(trim, 0, .52, 2.13, 1.25, .14, .08, '#162b37');
  wedge(glass, .56, .31, .76, .93, 1.05, 1.30, '#507786');
  helmet.add(UNIT_SPHERE, transform(0, 1.5, -.28, .40, .43, .39), '#fff4dd'); box(glass, 0, 1.52, .035, .61, .18, .18, '#152839');
  box(dark, 0, 1.12, -.39, .69, .55, .56, '#334252');
  for (const side of [-1, 1]) { box(lamps, side * .66, .72, 1.95, .38, .12, .12, '#fff3b7'); box(rear, side * .72, .82, -1.76, .40, .13, .12, '#ff583e'); cylinder(dark, side * .48, .53, -1.88, .14, .34, '#2d3544', 0, Math.PI / 2); }
  return { body, dark, trim, glass, lamps, rear, helmet };
}

export class RushRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    const attributes = { alpha: false, antialias: false, depth: true, stencil: false, powerPreference: 'high-performance' };
    const context = canvas.getContext('webgl2', attributes) || canvas.getContext('webgl', attributes);
    if (!context) throw new Error('此设备未能启动 WebGL 3D 图形，请更新系统 WebView 或使用支持 WebGL 的设备。');
    this.renderer = new THREE.WebGLRenderer({ canvas, context, ...attributes });
    this.renderer.setPixelRatio(1); this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.shadowMap.enabled = false;
    this.scene = new THREE.Scene(); this.world = new THREE.Group(); this.scene.add(this.world);
    this.camera = new THREE.PerspectiveCamera(65, 16 / 9, .3, 1200);
    this.ambient = new THREE.HemisphereLight(0xe4f4ff, 0x625344, 2.0); this.scene.add(this.ambient);
    this.sunlight = new THREE.DirectionalLight(0xffe4bb, 2.1); this.sunlight.position.set(-100, 180, -80); this.scene.add(this.sunlight);
    this.karts = new THREE.Group(); this.scene.add(this.karts);
    this.metrics = { backend: 'webgl', renderer: 'three-webgl', webglVersion: this.renderer.capabilities.isWebGL2 ? 2 : 1, drawCalls: 0, triangles: 0, width: 0, height: 0, pixelRatio: 1 };
    this.currentTrack = null; this.track = null; this.lastTime = -1; this.lastFrame = 0; this.lastParticleSpawn = 0; this.cameraReady = false; this.lastPlayer = null;
    this.position = new THREE.Vector3(); this.look = new THREE.Vector3(); this.dummy = new THREE.Object3D(); this.particles = [];
    this.buildKarts(); this.buildEffects();
  }
  begin() {}
  end() {}
  createInstances(geometry, material, count) { const instance = new THREE.InstancedMesh(geometry, material, count); instance.instanceMatrix.setUsage(THREE.DynamicDrawUsage); instance.frustumCulled = false; this.karts.add(instance); return instance; }
  buildKarts() {
    this.parts = {};
    for (const [name, batch] of Object.entries(carParts())) {
      const material = name === 'lamps' || name === 'rear' ? new THREE.MeshBasicMaterial({ vertexColors: true }) : new THREE.MeshLambertMaterial({ vertexColors: true });
      this.parts[name] = this.createInstances(batch.geometry(), material, 6);
    }
    const tyre = new THREE.CylinderGeometry(.49, .49, .34, 10, 1); tyre.rotateZ(Math.PI / 2);
    this.wheels = this.createInstances(tyre, new THREE.MeshLambertMaterial({ color: '#192231' }), 24);
    const rims = new Batch(); cylinder(rims, 0, 0, 0, .29, .355, '#a4bcc8', 0, Math.PI / 2);
    this.rims = this.createInstances(rims.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }), 24);
    const shadow = new THREE.PlaneGeometry(3.9, 5.5); shadow.rotateX(-Math.PI / 2);
    this.shadows = this.createInstances(shadow, new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, opacity: .36, depthWrite: false }), 6);
    this.shadows.renderOrder = 1;
  }
  buildEffects() {
    const flame = new THREE.ConeGeometry(.31, 1, 5); flame.rotateX(-Math.PI / 2); flame.translate(0, 0, -.5);
    this.flames = this.createInstances(flame, new THREE.MeshBasicMaterial({ color: '#69efff', transparent: true, opacity: .9, depthWrite: false }), 12);
    this.smoke = this.createInstances(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: '#dbdfd5', transparent: true, opacity: .25, depthWrite: false }), 56);
    this.smoke.renderOrder = 3;
  }
  buildTrack(id) {
    disposeGroup(this.world); this.track = makeTrack(id); this.currentTrack = id; this.cameraReady = false; this.particles = [];
    const track = this.track, theme = themeFor(track.id), r = random(track.id === 'skyport' ? 91013 : track.id === 'coast' ? 22041 : 52083);
    this.scene.background = color(theme.sky); this.scene.fog = new THREE.Fog(theme.fog, 200, 1000);
    this.ambient.color.set(theme.night ? '#a9c9ee' : '#e1f4ff'); this.ambient.groundColor.set(theme.ground); this.ambient.intensity = theme.night ? 1.65 : 2.0;
    this.sunlight.color.set(theme.light); this.sunlight.intensity = theme.night ? 1.8 : 2.2;
    const scenery = new Batch(), markings = new Batch(), bright = new Batch();
    this.buildSky(theme);
    const roadMaterial = new THREE.MeshLambertMaterial({ color: theme.road, map: asphaltTexture() });
    this.world.add(new THREE.Mesh(roadGeometry(track), roadMaterial));
    for (let i = 0; i < 384; i++) {
      const s = i / 384 * track.length, end = (i + 1) / 384 * track.length, p = sampleTrack(track, s), q = sampleTrack(track, end);
      for (const side of [-1, 1]) {
        const a = roadPoint(track, s, side * p.width * .5, .025), b = roadPoint(track, end, side * q.width * .5, .025), c = roadPoint(track, end, side * (q.width * .5 + .85), .025), d = roadPoint(track, s, side * (p.width * .5 + .85), .025);
        if (side < 0) markings.quad(a, b, c, d, i % 4 < 2 ? theme.curb : '#eee8d6'); else markings.quad(d, c, b, a, i % 4 < 2 ? theme.curb : '#eee8d6');
        const edge = p.width * .5 + 1.1, nextEdge = q.width * .5 + 1.1;
        beam(scenery, roadPoint(track, s, side * edge, .86), roadPoint(track, end, side * nextEdge, .86), .16, .16, theme.night ? '#7b9caa' : '#c6c5ad');
        if (i % 4 === 0) { const post = roadPoint(track, s, side * edge, .43); box(scenery, post.x, post.y, post.z, .19, .86, .19, '#576778'); }
        if (theme.night && i % 2 === 0) beam(bright, roadPoint(track, s, side * (edge + .02), .98), roadPoint(track, end, side * (nextEdge + .02), .98), .065, .065, theme.accent);
      }
      if (i % 7 < 3) markings.quad(roadPoint(track, s, -.10, .035), roadPoint(track, end, -.10, .035), roadPoint(track, end, .10, .035), roadPoint(track, s, .10, .035), '#e9e3c5');
      if (i % 14 === 0) { const p1 = roadPoint(track, s, -p.width * .42, -.3), p2 = roadPoint(track, s, p.width * .42, -.3); beam(scenery, p1, p2, .55, 1.3, '#465669'); const ground = theme.night ? -4 : -5; for (const side of [-1, 1]) { const point = roadPoint(track, s, side * p.width * .33); const h = Math.max(.8, point.y - ground); cylinder(scenery, point.x, ground + h * .5, point.z, .7, h, theme.night ? '#314759' : '#a8a28a'); } }
    }
    this.buildGround(scenery, r, theme);
    this.buildStart(scenery, bright, theme);
    this.buildPads(markings, bright, theme);
    this.buildTurnSigns(scenery, bright, theme);
    if (track.id === 'skyport') this.buildCity(scenery, bright, r, theme);
    else if (track.id === 'coast') this.buildCoast(scenery, r, theme);
    else this.buildCanyon(scenery, bright, r, theme);
    this.world.add(mesh(scenery, new THREE.MeshLambertMaterial({ vertexColors: true })));
    this.world.add(mesh(markings, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    this.world.add(mesh(bright, new THREE.MeshBasicMaterial({ vertexColors: true })));
  }
  buildSky(theme) {
    const texture = canvasTexture(8, 256, (ctx, w, h) => { const gradient = ctx.createLinearGradient(0, 0, 0, h); gradient.addColorStop(0, theme.sky); gradient.addColorStop(.26, theme.sky); gradient.addColorStop(.5, theme.horizon); gradient.addColorStop(1, theme.horizon); ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h); });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1100, 16, 12), new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, fog: false, depthWrite: false })); dome.renderOrder = -2; this.world.add(dome);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(theme.night ? 14 : 24, 12, 8), new THREE.MeshBasicMaterial({ color: theme.sun, fog: false })); sun.position.set(-320, theme.night ? 210 : 160, 420); this.world.add(sun);
    if (theme.night) { const points = [], rng = random(67213); for (let i = 0; i < 100; i++) { const a = rng() * TAU, e = .25 + rng() * .9; points.push(Math.cos(a) * Math.cos(e) * 950, Math.sin(e) * 950, Math.sin(a) * Math.cos(e) * 950); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3)); this.world.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#d7e8ee', size: 1.6, sizeAttenuation: true, fog: false }))); }
  }
  buildGround(scenery, r, theme) {
    const track = this.track, b = track.bounds, cx = (b.minX + b.maxX) * .5, cz = (b.minZ + b.maxZ) * .5;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshLambertMaterial({ color: track.id === 'coast' ? '#269dc0' : track.id === 'skyport' ? '#183f59' : theme.ground })); water.rotation.x = -Math.PI / 2; water.position.set(cx, -6, cz); this.world.add(water);
    if (track.id === 'coast') {
      const outer = new THREE.CylinderGeometry(1, 1.06, 1, 40); scenery.add(outer, transform(cx, -5.1, cz, (b.maxX - b.minX) * .57, 3.8, (b.maxZ - b.minZ) * .57), '#d8c796'); outer.dispose();
      const inner = new THREE.CylinderGeometry(1, 1.05, 1, 40); scenery.add(inner, transform(cx, -3.6, cz, (b.maxX - b.minX) * .54, 3.1, (b.maxZ - b.minZ) * .54), theme.ground); inner.dispose();
    } else if (track.id === 'skyport') box(scenery, cx, -5.2, cz, b.maxX - b.minX + 60, 1.3, b.maxZ - b.minZ + 60, '#273e4b');
    else box(scenery, cx, -5.6, cz, 2000, 1.0, 2000, theme.ground);
    // Faceted far silhouettes give a horizon without external sky images.
    for (let i = 0; i < 22; i++) { const a = i / 22 * TAU, radius = 500 + r() * 110, x = cx + Math.sin(a) * radius, z = cz + Math.cos(a) * radius, h = 80 + r() * 130; scenery.add(UNIT_CONE, transform(x, h * .3 - 15, z, 65 + r() * 50, h, 65 + r() * 40, a), track.id === 'canyon' ? (i % 2 ? '#9b6956' : '#ac775b') : track.id === 'coast' ? '#6c8d94' : '#344660'); }
  }
  buildStart(scenery, bright, theme) {
    const track = this.track, p = sampleTrack(track, 0), half = p.width * .5 + 2.4;
    const a = roadPoint(track, 0, -half), b = roadPoint(track, 0, half);
    for (const point of [a, b]) { box(scenery, point.x, point.y + 4.9, point.z, .8, 9.8, .8, '#d5d4ba', p.yaw); box(bright, point.x, point.y + 5, point.z, .95, .2, .95, theme.accent, p.yaw); }
    beam(scenery, a.clone().add(new THREE.Vector3(0, 9, 0)), b.clone().add(new THREE.Vector3(0, 9, 0)), 1.0, 1.0, '#b5c6c7');
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 3.2), new THREE.MeshBasicMaterial({ map: signTexture('NEON RUSH', 'START / FINISH', theme.accent), side: THREE.DoubleSide })); sign.position.set(p.x - Math.sin(p.yaw) * .65, p.y + 8.65, p.z - Math.cos(p.yaw) * .65); sign.rotation.y = p.yaw + Math.PI; this.world.add(sign);
    for (let s = 0; s < 3; s++) for (let j = 0; j < 16; j++) { const left = (j / 16 - .5) * p.width, right = ((j + 1) / 16 - .5) * p.width; const tint = (j + s) % 2 ? '#283642' : '#f4eed8'; bright.quad(roadPoint(track, s * .9, left, .04), roadPoint(track, (s + 1) * .9, left, .04), roadPoint(track, (s + 1) * .9, right, .04), roadPoint(track, s * .9, right, .04), tint); }
    for (let i = 0; i < 6; i++) { const s = -6 - Math.floor(i / 2) * 6.8, lateral = i % 2 ? 3.8 : -3.8; for (const side of [-1, 1]) beam(bright, roadPoint(track, s, lateral + side * 1.6, .04), roadPoint(track, s - 4.7, lateral + side * 1.6, .04), .07, .07, '#f7e3a9'); }
  }
  buildPads(markings, bright, theme) {
    for (const [kind, pads] of [['boost', this.track.boostPads || []], ['jump', this.track.jumpPads || []]]) for (const pad of pads) {
      const count = Math.max(3, Math.ceil(pad.length / 2.5));
      for (let i = 0; i < count; i++) { const s = pad.s + (i + .5) / count * pad.length, p = sampleTrack(this.track, s), w = p.width * .35; const c = kind === 'boost' ? theme.accent : '#ffcf6b';
        const a = roadPoint(this.track, s - .8, -w, .06), b = roadPoint(this.track, s + .9, 0, .06), d = roadPoint(this.track, s - .8, w, .06);
        const aa = roadPoint(this.track, s - 1.5, -w, .06), bb = roadPoint(this.track, s + .2, 0, .06), dd = roadPoint(this.track, s - 1.5, w, .06);
        markings.quad(a, b, bb, aa, c); markings.quad(b, d, dd, bb, c);
      }
      const p = sampleTrack(this.track, pad.s); for (const side of [-1, 1]) { const point = roadPoint(this.track, pad.s, side * (p.width * .5 + 1.6), 1.8); box(bright, point.x, point.y, point.z, .5, 2.2, .5, kind === 'boost' ? theme.accent : '#ffb84d'); }
    }
  }
  buildTurnSigns(scenery, bright, theme) {
    for (let s = 55; s < this.track.length; s += 48) {
      const p = sampleTrack(this.track, s); if (Math.abs(p.curvature || 0) < .008) continue;
      const side = p.curvature > 0 ? -1 : 1, p0 = roadPoint(this.track, s, side * (p.width * .5 + 3), 1.8);
      box(scenery, p0.x, p0.y - .7, p0.z, .18, 2.2, .18, '#50616a');
      const board = new THREE.Matrix4().compose(p0, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.yaw, 0)), new THREE.Vector3(1, 1, 1));
      const sign = new Batch(); box(sign, 0, .7, 0, 2.8, 1.3, .18, '#182e42');
      const x = Math.sign(p.curvature) * .6; beam(sign, new THREE.Vector3(-x, 1.13, -.11), new THREE.Vector3(x, .7, -.11), .23, .13, '#f7da8b'); beam(sign, new THREE.Vector3(x, .7, -.11), new THREE.Vector3(-x, .27, -.11), .23, .13, '#f7da8b');
      const g = sign.geometry(); scenery.add(g, board, '#ffffff'); g.dispose();
    }
  }
  roadsideFree(x, z, margin = 20) { const p = projectTrack(this.track, x, z, 0); return p.distance > p.width * .5 + margin; }
  buildCity(scenery, bright, r, theme) {
    const b = this.track.bounds, centerX = (b.minX + b.maxX) / 2, centerZ = (b.minZ + b.maxZ) / 2, placements = [];
    for (let i = 0; i < 140 && placements.length < 75; i++) { const x = centerX + (r() - .5) * (b.maxX - b.minX + 280), z = centerZ + (r() - .5) * (b.maxZ - b.minZ + 280); if (!this.roadsideFree(x, z, 24)) continue; const w = 10 + r() * 15, h = 15 + r() * 74, d = 10 + r() * 17; placements.push({ x, z, w, h, d }); box(scenery, x, h - 3.8, z, w + .5, .8, d + .5, '#536b7d'); if (h > 63) cylinder(scenery, x, h + 3, z, .17, 12, '#9fb9c7'); }
    const instances = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ map: windowsTexture(r), color: '#b3bfd0' }), placements.length);
    placements.forEach((p, i) => instances.setMatrixAt(i, transform(p.x, p.h / 2 - 4, p.z, p.w, p.h, p.d))); this.world.add(instances);
    for (let s = 18; s < this.track.length; s += 42) { const p = sampleTrack(this.track, s), point = roadPoint(this.track, s, p.width * .5 + 3, 0); cylinder(scenery, point.x, point.y + 4.2, point.z, .16, 8.4, '#5a6d7a'); const end = roadPoint(this.track, s, p.width * .5, 8.2); beam(scenery, new THREE.Vector3(point.x, point.y + 8.2, point.z), end, .18, .18, '#738d97'); box(bright, end.x, end.y, end.z, 1.6, .12, .6, '#b9e4ea', p.yaw); }
    // Cargo pads and geometric radio towers suggest a working elevated port.
    for (let j = 0; j < 14; j++) { const x = centerX + (r() - .5) * 180, z = centerZ + (r() - .5) * 180; if (!this.roadsideFree(x, z, 12)) continue; box(scenery, x, -1.8, z, 8, 4.5, 4.6, ['#b85f45', '#3e7388', '#aaa776'][j % 3], j * .6); }
  }
  buildCoast(scenery, r, theme) {
    const b = this.track.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    for (let i = 0; i < 85; i++) {
      const x = cx + (r() - .5) * (b.maxX - b.minX + 80), z = cz + (r() - .5) * (b.maxZ - b.minZ + 80);
      if (!this.roadsideFree(x, z, 13)) continue;
      if (i % 3 === 0) { const h = 6 + r() * 8, w = 6 + r() * 5; box(scenery, x, h * .5 - 2, z, w, h, w * .8, '#ede6d3'); box(scenery, x, h - 1.8, z, w + .4, .5, w * .8 + .4, '#4b94bc'); box(scenery, x, .2, z + w * .405, 1.8, 4.2, .12, '#33779e'); for (let k = -1; k <= 1; k += 2) box(scenery, x + k * w * .28, h * .60 - 1, z + w * .405, 1.1, 1.7, .12, '#497c96'); if (i % 6 === 0) scenery.add(UNIT_SPHERE, transform(x, h - 1.4, z, w * .36, w * .34, w * .36), '#3c91bd'); }
      else this.palm(scenery, x, -2, z, 6 + r() * 4, r() * TAU);
    }
    // A small marina sits below the race circuit, entirely procedural.
    for (let i = 0; i < 7; i++) { const x = cx + (i - 3) * 14, z = b.maxZ + 28; box(scenery, x, -4.3, z, 4, .7, 10, '#d9ddd2', .3); cylinder(scenery, x, .8, z, .10, 10, '#d9ddd2'); const a = new THREE.Vector3(x, 5.4, z), c = new THREE.Vector3(x + 4, -2.7, z), d = new THREE.Vector3(x, -2.7, z); scenery.triangle(a, c, d, i % 2 ? '#f0ddbd' : '#f39364'); }
    const lighthouseX = b.maxX + 23, lighthouseZ = cz; cylinder(scenery, lighthouseX, 8, lighthouseZ, 3.8, 24, '#ece8d5'); cylinder(scenery, lighthouseX, 14, lighthouseZ, 3.9, 3.2, '#c85843'); cylinder(scenery, lighthouseX, 20.5, lighthouseZ, 4.4, 3.4, '#39667c'); scenery.add(UNIT_CONE, transform(lighthouseX, 24.2, lighthouseZ, 5, 4.0, 5), '#cf7149');
  }
  palm(scenery, x, y, z, height, angle) {
    cylinder(scenery, x, y + height * .5, z, .31, height, '#8a7556');
    const tip = new THREE.Vector3(x, y + height, z);
    for (let i = 0; i < 6; i++) { const a = angle + i / 6 * TAU, end = new THREE.Vector3(x + Math.sin(a) * 4.5, y + height - 1.6, z + Math.cos(a) * 4.5), mid = tip.clone().lerp(end, .54).add(new THREE.Vector3(0, .5, 0)), side = new THREE.Vector3(Math.cos(a) * .9, 0, -Math.sin(a) * .9); scenery.triangle(tip, mid.clone().add(side), end, i % 2 ? '#4d885c' : '#6c9b5c'); scenery.triangle(tip, end, mid.clone().sub(side), '#518656'); }
  }
  buildCanyon(scenery, bright, r, theme) {
    const b = this.track.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    for (let i = 0; i < 85; i++) { const x = cx + (r() - .5) * (b.maxX - b.minX + 210), z = cz + (r() - .5) * (b.maxZ - b.minZ + 210); if (!this.roadsideFree(x, z, 18)) continue;
      if (i % 3) { const h = 9 + r() * 34, w = 6 + r() * 15; scenery.add(UNIT_ROCK, transform(x, h * .27 - 3, z, w, h, w * .75, r() * TAU), ['#b57856', '#ca9668', '#ad7055'][i % 3]); cylinder(scenery, x, h * .32, z, w * .72, h * .22, '#c48e64'); }
      else { const h = 4 + r() * 4; cylinder(scenery, x, h * .5 - 4.4, z, .55, h, '#6a8456'); for (const side of [-1, 1]) { cylinder(scenery, x + side * .9, h * .35 - 3.8, z, .39, 2.0, '#6a8456', 0, Math.PI / 2); cylinder(scenery, x + side * 1.7, h * .45 - 3.0, z, .4, 2.8, '#78915c'); } }
    }
    for (let s = 100; s < this.track.length; s += 180) { const p = sampleTrack(this.track, s), half = p.width * .5 + 4.6; const a = roadPoint(this.track, s, -half), b = roadPoint(this.track, s, half); for (const v of [a, b]) { scenery.add(UNIT_ROCK, transform(v.x, v.y + 5, v.z, 3.7, 10, 3.7), '#b27d58'); } beam(scenery, a.clone().add(new THREE.Vector3(0, 13, 0)), b.clone().add(new THREE.Vector3(0, 13, 0)), 3.4, 3.8, '#b9855b'); }
  }
  updateKarts(state) {
    const cars = state.cars || [], count = Math.min(6, cars.length), now = Number(state.time) || 0;
    for (const part of Object.values(this.parts)) part.count = count; this.wheels.count = this.rims.count = count * 4; this.shadows.count = count; this.flames.count = count * 2;
    const temp = this.dummy, bodyQ = new THREE.Quaternion();
    cars.slice(0, 6).forEach((car, i) => {
      const steer = Number(car.steer) || 0, slip = Number(car.slip) || 0, air = Math.max(0, Number(car.airHeight) || 0);
      const roll = clamp(-slip * .05 - steer * Math.min(.035, Math.abs(car.speed || 0) * .001), -.12, .12);
      const roadBefore = sampleTrack(this.track, (car.trackS || 0) - 2), roadAfter = sampleTrack(this.track, (car.trackS || 0) + 2);
      const pitch = -Math.atan2(roadAfter.y - roadBefore.y, 4) * (air > .2 ? .3 : 1);
      temp.position.set(car.x, car.y + .04, car.z); temp.rotation.set(pitch, car.yaw, roll, 'YXZ'); temp.scale.set(1, 1, 1); temp.updateMatrix(); bodyQ.copy(temp.quaternion);
      for (const [name, part] of Object.entries(this.parts)) part.setMatrixAt(i, temp.matrix);
      const tint = (car.collisionFlash || 0) > .02 && Math.floor(now * 16) % 2 ? '#ffffff' : car.color || ['#ff743f', '#58d8e3', '#ae83e5', '#5a9df5', '#f2ce69', '#88bc70'][i]; this.parts.body.setColorAt(i, color(tint));
      for (let w = 0; w < 4; w++) { const side = w % 2 ? 1 : -1, front = w < 2, local = new THREE.Vector3(side * 1.29, .49, front ? 1.13 : -1.17).applyQuaternion(bodyQ); temp.position.set(car.x + local.x, car.y + .04 + local.y, car.z + local.z); temp.rotation.set(0, car.yaw + (front ? steer * .28 : 0), 0); temp.scale.set(1, 1, 1); temp.updateMatrix(); this.wheels.setMatrixAt(i * 4 + w, temp.matrix); this.rims.setMatrixAt(i * 4 + w, temp.matrix); }
      const ground = sampleTrack(this.track, car.trackS || 0).y; temp.position.set(car.x, ground + .07, car.z); temp.rotation.set(0, car.yaw, 0); const shadowSize = 1 + Math.min(.8, air * .07); temp.scale.set(shadowSize, shadowSize, shadowSize); temp.updateMatrix(); this.shadows.setMatrixAt(i, temp.matrix);
      const boosting = (car.boostTime || 0) > 0 || (car.miniBoostTime || 0) > 0, flameScale = boosting ? .9 + .25 * Math.sin(now * 37 + i * 4) : 0;
      for (const side of [-1, 1]) { const local = new THREE.Vector3(side * .49, .55, -1.92).applyQuaternion(bodyQ); temp.position.set(car.x + local.x, car.y + local.y, car.z + local.z); temp.rotation.set(0, car.yaw, 0); temp.scale.set(.85 * flameScale, .85 * flameScale, (car.boostTime > 0 ? 2.7 : 1.5) * flameScale); temp.updateMatrix(); this.flames.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), temp.matrix); }
    });
    for (const p of Object.values(this.parts)) { p.instanceMatrix.needsUpdate = true; if (p.instanceColor) p.instanceColor.needsUpdate = true; }
    for (const p of [this.wheels, this.rims, this.shadows, this.flames]) p.instanceMatrix.needsUpdate = true;
    if (now < this.lastTime || now - this.lastTime > 1) { this.particles = []; this.lastParticleSpawn = now; }
    if (now > this.lastParticleSpawn + .085) { this.lastParticleSpawn = now; cars.forEach((car, i) => { if (!car.drifting || Math.abs(car.speed || 0) < 5 || (car.airHeight || 0) > .3) return; for (const side of [-1, 1]) { const rear = new THREE.Vector3(side * 1.3, .18, -1.3).applyAxisAngle(UP, car.yaw); this.particles.push({ x: car.x + rear.x, y: car.y + rear.y, z: car.z + rear.z, born: now, angle: i + now * 3 }); } }); }
    this.particles = this.particles.filter(p => now - p.born < .9).slice(-56); this.smoke.count = this.particles.length;
    this.particles.forEach((p, i) => { const life = now - p.born, scale = .18 + life * .8; temp.position.set(p.x + Math.sin(p.angle) * life * .3, p.y + life * .7, p.z + Math.cos(p.angle) * life * .3); temp.rotation.set(life, p.angle, 0); temp.scale.setScalar(scale * (1 - life / 1.0)); temp.updateMatrix(); this.smoke.setMatrixAt(i, temp.matrix); }); this.smoke.instanceMatrix.needsUpdate = true;
    this.lastTime = now;
  }
  draw(state) {
    if (!state || !state.cars || !state.cars[0]) return;
    const id = state.trackId || ['skyport', 'coast', 'canyon'][state.trackIndex || 0]; if (id !== this.currentTrack) this.buildTrack(id);
    const w = Math.max(1, Math.round(this.canvas.clientWidth || 960)), h = Math.max(1, Math.round(this.canvas.clientHeight || 540));
    if (w !== this.width || h !== this.height) { this.width = w; this.height = h; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.metrics.width = w; this.metrics.height = h; }
    this.updateKarts(state);
    const player = state.cars[0], speed = Math.abs(player.speed || 0), trackPoint = sampleTrack(this.track, (player.trackS || 0) + 16 + speed * .16);
    const followYaw = player.yaw - clamp(Number(player.slip) || 0, -.55, .55) * .26, distance = 10.5 + speed * .055;
    const wanted = new THREE.Vector3(player.x - Math.sin(followYaw) * distance, player.y + 5.5 + speed * .025, player.z - Math.cos(followYaw) * distance);
    const target = new THREE.Vector3(player.x + Math.sin(followYaw) * 12, Math.max(player.y + 1.2, trackPoint.y + .8), player.z + Math.cos(followYaw) * 12);
    const clock = typeof performance !== 'undefined' ? performance.now() : Date.now(), delta = this.lastFrame ? clamp((clock - this.lastFrame) / 1000, .001, .1) : 1 / 30; this.lastFrame = clock;
    const discontinuity = this.lastPlayer && (Math.hypot(player.x - this.lastPlayer.x, player.z - this.lastPlayer.z) > 25 || (state.time || 0) < this.lastPlayer.time);
    if (!this.cameraReady || discontinuity) { this.position.copy(wanted); this.look.copy(target); this.cameraReady = true; } else { this.position.lerp(wanted, 1 - Math.exp(-delta * 9)); this.look.lerp(target, 1 - Math.exp(-delta * 12)); }
    this.lastPlayer = { x: player.x, z: player.z, time: state.time || 0 };
    this.camera.position.copy(this.position); this.camera.lookAt(this.look); const fov = 64 + Math.min(9, speed * .13) + (player.boostTime > 0 ? 3 : 0); if (Math.abs(this.camera.fov - fov) > .1) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
    this.renderer.render(this.scene, this.camera); this.metrics.drawCalls = this.renderer.info.render.calls; this.metrics.triangles = this.renderer.info.render.triangles; this.metrics.geometries = this.renderer.info.memory.geometries; this.metrics.textures = this.renderer.info.memory.textures;
  }
  dispose() { disposeGroup(this.world); disposeGroup(this.karts); this.renderer.dispose(); }
}
