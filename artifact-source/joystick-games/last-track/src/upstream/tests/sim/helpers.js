import { createRaceSim, COUNTDOWN_SECONDS } from '../../src/sim/raceSim.js';
import { createRaceConfig } from '../../src/data/raceConfig.js';
import { defaultSave } from '../../src/data/saveStore.js';
import { SIM_DT } from '../../src/sim/carPhysics.js';

export function makeConfig(trackId, { mode = 'practice', rivalIds, seed = 7, save } = {}) {
  return createRaceConfig({ mode, trackId, seed, rivalIds, save: save || defaultSave() });
}

/** Step through the countdown so cars are free. */
export function goRacing(sim) {
  let n = 0;
  while (sim.phase === 'countdown' && n++ < 120 * (COUNTDOWN_SECONDS + 2)) sim.step(null);
}

/** Teleport a car to (s, d) on the track, aligned with it, at the given speed; resets progress tracking. */
export function place(sim, car, s, d = 0, speed = 0) {
  const tr = sim.track;
  const p = tr.pointAt(s);
  car.x = p.x - Math.sin(p.heading) * d; car.y = p.y + Math.cos(p.heading) * d;
  car.heading = p.heading;
  car.vx = Math.cos(p.heading) * speed; car.vy = Math.sin(p.heading) * speed;
  car.yawRate = 0; car.steer = 0;
  car.proj = tr.project(car.x, car.y);
  car.lastS = car.proj.s; car.raw = car.proj.s; car.progress = car.proj.s;
}

export { createRaceSim, SIM_DT };
