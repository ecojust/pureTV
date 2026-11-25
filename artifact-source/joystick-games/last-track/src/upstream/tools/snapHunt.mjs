// Finds discontinuities (heading / speed jumps per tick) in a headless AI run. Usage: node tools/snapHunt.mjs [track=scrapyard] [seeds=3] [car=hammer]
import { createRaceSim } from '../src/sim/raceSim.js';
import { createRaceConfig } from '../src/data/raceConfig.js';
import { defaultSave } from '../src/data/saveStore.js';
const track = process.argv[2] || 'scrapyard', seeds = +process.argv[3] || 3, carId = process.argv[4] || 'hammer';
const NO = { throttle: 0, brake: 0, steer: 0, fire: false, cycleWeapon: false, selectWeapon: null, handbrake: false };
let total = 0, maxBrake = 0;
for (let s = 0; s < seeds; s++) {
  const save = { ...defaultSave(), carId, weapons: [{ id: 'machinegun', ammo: 200 }] };
  const sim = createRaceSim(createRaceConfig({ mode: 'race', trackId: track, save, seed: 1000 + s }), { aiPlayer: true, aiSkill: 0.8 });
  const prev = sim.cars.map((c) => ({ h: c.heading, u: Math.hypot(c.vx, c.vy), v: c.speed }));
  let n = 0;
  while (!sim.isOver() && n++ < 120 * 400) {
    sim.step(NO);
    if (sim.phase !== 'racing') continue;
    sim.cars.forEach((c, i) => {
      const p = prev[i]; let dh = c.heading - p.h; dh -= Math.round(dh / (2 * Math.PI)) * 2 * Math.PI;
      const dv = Math.hypot(c.vx, c.vy) - p.u;
      const decel = -dv * 120 / 9.81; if (decel > maxBrake && !c.wrecked) maxBrake = decel;
      if ((Math.abs(dh) > 0.08 || Math.abs(dv) > 1.2) && !c.wrecked) { total++; if (total < 25) console.log(`seed ${s} t=${sim.time.toFixed(2)} car ${i} dh=${dh.toFixed(3)} dv=${dv.toFixed(2)} speed=${c.speed.toFixed(1)} yaw=${c.yawRate.toFixed(2)}`); }
      p.h = c.heading; p.u = Math.hypot(c.vx, c.vy);
    });
  }
}
console.log('jumps', total, 'max decel g (per-tick, incl. impacts)', maxBrake.toFixed(2));
