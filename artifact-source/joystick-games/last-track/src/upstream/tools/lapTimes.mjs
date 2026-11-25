// Per-track AI race report: finish times, lap-time range, stuck detection. Usage: node tools/lapTimes.mjs [trackId] [seed=1000]
import { createRaceSim } from '../src/sim/raceSim.js';
import { createRaceConfig } from '../src/data/raceConfig.js';
import { defaultSave } from '../src/data/saveStore.js';
import { TRACKS } from '../src/data/tracks/index.js';
import { CARS } from '../src/data/cars.js';

const only = process.argv[2], seed = +process.argv[3] || 1000;
const NO = { throttle: 0, brake: 0, steer: 0, fire: false, cycleWeapon: false, selectWeapon: null, handbrake: false };
for (const tr of TRACKS) {
  if (only && tr.id !== only) continue;
  const car = CARS[0];
  const save = { ...defaultSave(), carId: car.id, weapons: car.startWeapons.map((w) => ({ ...w })) };
  const sim = createRaceSim(createRaceConfig({ mode: 'race', trackId: tr.id, save, seed }), { aiPlayer: true, aiSkill: 0.8 });
  const laps = [];
  sim.events.on('lap', (e) => laps.push(e.lapTime));
  const still = {}; let stuck = 0, t = 0;
  while (!sim.isOver() && t++ < 120 * 60 * 15) {
    sim.step(NO);
    if (t % 240 === 0 && t > 960) for (const c of sim.snapshot().cars) {
      if (!c.wrecked && !c.finished && c.speed < 4) { still[c.id] = (still[c.id] || 0) + 2; stuck = Math.max(stuck, still[c.id]); } else still[c.id] = 0;
    }
  }
  const r = sim.result();
  const fin = r.finishOrder.map((f) => `${f.isPlayer ? 'P' : f.driverId}:${f.wrecked ? 'wreck' : f.time ? f.time.toFixed(0) + 's' : 'DNF'}`).join(' ');
  console.log(`${tr.id.padEnd(9)} ${tr.laps}x${(sim.track.length / 1000).toFixed(2)}km lap ${Math.min(...laps).toFixed(1)}-${Math.max(...laps).toFixed(1)}s stillMax ${stuck}s | ${fin}`);
}
