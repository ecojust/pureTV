// Headless cost of the destruction effects: 5 cars wrecking at once (explosions, part loss, burning wrecks) -> ms per frame of JS.
import * as THREE from 'three';
import { createEffects } from '../src/render/effects.js';
const scene = new THREE.Scene();
const fx = createEffects(scene, { soft: true });
const cars = Array.from({ length: 5 }, (_, i) => ({ id: i, x: i * 12, y: 0, heading: 0, vx: 20, vy: 0, speed: 20, wrecked: false, armor: 10, armorMax: 100, dmg: [0.9, 0.2, 0.1, 0.1], color: 8, slip: 0, throttle: 1 }));
const PARTS = ['hood', 'doorL', 'doorR', 'bumperF', 'bumperR', 'spoiler', 'wheelFR', 'turret', 'wheelRL'];
let tick = 0; const times = [];
for (let f = 0; f < 600; f++) {
  const events = [];
  if (f % 90 === 5) for (const c of cars) {
    c.wrecked = true;
    events.push({ type: 'explosion', x: c.x, y: c.y, radius: 5, kind: 'wreck', big: true, carId: c.id });
    events.push({ type: 'wreck', carId: c.id, x: c.x, y: c.y });
    PARTS.forEach((p, k) => events.push({ type: 'partLost', carId: c.id, part: p, wreck: true, power: 1.2, x: c.x, y: c.y, dx: Math.cos(k), dy: Math.sin(k), vx: 20, vy: 0, seed: c.id * 100 + k + 1 }));
    events.push({ type: 'scrape', carId: c.id, x: c.x, y: c.y + 8, speed: 40, impact: 3, side: 1 });
  }
  const t0 = performance.now();
  fx.update({ tick: ++tick, events, cars, projectiles: [], hazards: [], pickups: [] }, 1 / 60);
  times.push(performance.now() - t0);
}
times.sort((a, b) => a - b);
const avg = times.reduce((a, b) => a + b, 0) / times.length;
console.log(`effects JS ms/frame: avg ${avg.toFixed(2)} p95 ${times[Math.floor(times.length * 0.95)].toFixed(2)} max ${times[times.length - 1].toFixed(2)} | particles alive ${fx.particles.active} debris ${fx.debris.field.count}`);
