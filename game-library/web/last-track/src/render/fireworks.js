// Fireworks for the win screen and the race's GO and first finish: a shell climbs straight up, bursts into sparks, and the sparks slow, fall and fade.
// The maths is pure (exported for tests); createFireworks() draws every live spark as one additive THREE.Points.
import * as THREE from '../../vendor/three.module.js';

/** Linear RGB of the burst colours (gold, cyan, magenta, orange, lime). Each burst takes one, and some sparks are white-hot. */
export const FIREWORK_COLORS = [[1.0, 0.82, 0.48], [0.21, 0.9, 1.0], [1.0, 0.31, 0.6], [1.0, 0.45, 0.24], [0.6, 1.0, 0.42]];
export const WHITE = [1, 1, 1];
export const GRAVITY = 4.9;        // m/s^2: half of Earth's, so the bursts hang a moment
export const DRAG = 1.1;           // 1/s: sparks slow as they spread
export const SHELL_SPEED = 26;     // m/s: a shell climbs at this speed (no gravity) until its fuse runs out
export const SPARK_CAPACITY = 1600;

/** Sparks of one burst centred on `c` ({x,y,z}): `count` directions spread over the sphere, speeds from 45% to 100% of `speed`. */
export function burstSparks(c, { count = 70, speed = 16, rng = Math.random, colors = FIREWORK_COLORS } = {}) {
  const base = colors[Math.floor(rng() * colors.length) % colors.length];
  const out = [];
  for (let i = 0; i < count; i++) {
    const u = rng() * 2 - 1, phi = rng() * Math.PI * 2, r = Math.sqrt(1 - u * u);   // uniform direction on the sphere
    const v = speed * (0.45 + 0.55 * rng());
    out.push({ x: c.x, y: c.y, z: c.z, vx: r * Math.cos(phi) * v, vy: u * v, vz: r * Math.sin(phi) * v, age: 0, life: 1.2 + rng() * 0.9, color: rng() < 0.15 ? WHITE : base, shell: false });
  }
  return out;
}

/** A shell fired from the ground under `target` ({x, y, z}): it climbs at `speed` and bursts at height `target.y`. */
export function shellSpark(target, { speed = SHELL_SPEED } = {}) {
  return { x: target.x, y: 0, z: target.z, vx: 0, vy: speed, vz: 0, age: 0, life: Math.max(0.2, target.y / speed), color: WHITE, shell: true };
}

/** Advance one spark by dt (mutates it). Returns false once its life is over (a shell then bursts) or a spark has hit the ground. */
export function stepSpark(p, dt) {
  p.age += dt;
  if (p.shell) { p.y += p.vy * dt; return p.age < p.life; }
  const k = Math.exp(-DRAG * dt);
  p.vx *= k; p.vz *= k;
  p.vy = p.vy * k - GRAVITY * dt;
  p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
  return p.age < p.life && p.y > 0;
}

/** How bright a spark still is, 1 when new and 0 at the end of its life. */
export const sparkFade = (p) => Math.max(0, 1 - p.age / p.life);

/** A soft round dot (white, alpha falling to 0 at the rim), so each spark is round rather than a square point. Built without a canvas. */
export function sparkTexture(size = 32) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot((x + 0.5) / size * 2 - 1, (y + 0.5) / size * 2 - 1);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(Math.pow(Math.max(0, 1 - d), 1.6) * 255);
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

// where shells burst: a random point in the upper-middle of the camera's frame (normalised device coordinates, -1..1, +y up), so it lands in shot
const FRAME = { xMax: 0.6, yMin: 0.15, yMax: 0.7 };
const BURST_DIST = [35, 70];   // m from the camera

/**
 * A burst point inside `camera`'s frame, 35-70 m out, so the bursts show whatever the camera does. Null when no try lands at 3 m or higher
 * (a camera looking down at the road has no air to burst in).
 */
export function burstInFrame(camera, rng = Math.random) {
  camera.updateMatrixWorld();
  for (let tries = 0; tries < 8; tries++) {
    const nx = (rng() * 2 - 1) * FRAME.xMax, ny = FRAME.yMin + rng() * (FRAME.yMax - FRAME.yMin);
    const dir = new THREE.Vector3(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
    const p = camera.position.clone().addScaledVector(dir, BURST_DIST[0] + rng() * (BURST_DIST[1] - BURST_DIST[0]));
    if (p.y >= 3) return p;
  }
  return null;
}

/**
 * Fireworks layer on `scene`: launch(target) sends a shell up to a burst point; each shell that ends becomes a burst. update(dt) moves the sparks
 * and rewrites the draw buffers; dispose() removes the layer. At most `capacity` sparks are alive; extra bursts are dropped.
 */
export function createFireworks(scene, { rng = Math.random, capacity = SPARK_CAPACITY } = {}) {
  let sparks = [];
  const pos = new Float32Array(capacity * 3), col = new Float32Array(capacity * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setDrawRange(0, 0);
  const map = sparkTexture();
  const mat = new THREE.PointsMaterial({ size: 2.8, map, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false; points.renderOrder = 5; points.name = 'fireworks';
  scene.add(points);
  return {
    /** Fire a shell that bursts at `target` ({x, y, z}); the caller picks where that is. */
    launch(target) { if (sparks.length < capacity) sparks.push(shellSpark(target)); },
    get count() { return sparks.length; },
    update(dt) {
      const live = [];
      for (const p of sparks) {
        if (stepSpark(p, dt)) live.push(p);
        else if (p.shell) for (const s of burstSparks(p, { rng, count: 90, speed: 14 + 6 * rng() })) live.push(s);
      }
      if (live.length > capacity) live.length = capacity;
      sparks = live;
      const GLOW = 1.6;   // additive sparks: a little over 1 so the bloom catches them
      for (let i = 0; i < live.length; i++) {
        const p = live[i], k = p.shell ? 1 : sparkFade(p) * GLOW;
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        col[i * 3] = p.color[0] * k; col[i * 3 + 1] = p.color[1] * k; col[i * 3 + 2] = p.color[2] * k;
      }
      geo.setDrawRange(0, live.length);
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    },
    dispose() { scene.remove(points); geo.dispose(); mat.dispose(); map.dispose(); sparks = []; },
  };
}
