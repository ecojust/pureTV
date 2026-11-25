// "Keyboard human" stress test: a digital-input bot (steer is only -1/0/+1, throttle/brake on/off, handbrake in tight turns)
// drives the player car alone around every track. Reports lap time vs the analogue AI, wall damage, scrapes, recoveries, drift.
// Usage: node tools/keyboardBot.mjs [trackId|all] [nitro=0|1]
import { createRaceSim } from '../src/sim/raceSim.js';
import { createRaceConfig } from '../src/data/raceConfig.js';
import { defaultSave } from '../src/data/saveStore.js';
import { TRACKS } from '../src/data/tracks/index.js';
import { driveAI } from '../src/sim/ai/aiDriver.js';
import { SIM_DT } from '../src/sim/carPhysics.js';

const only = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2] : null;
const nitro = process.argv[3] === '1';
const DZ = +process.argv[4] || 0.3;   // dead-zone of the bang-bang steering
for (const tr of TRACKS) {
  if (only && tr.id !== only) continue;
  const cfg = createRaceConfig({ mode: 'practice', trackId: tr.id, save: defaultSave(), seed: 5 });
  const sim = createRaceSim(cfg, {});
  const car = sim.cars[0];
  const st = { scrapes: 0, bumps: 0, recov: 0, wallDmg: 0, maxBeta: 0, driftT: 0 };
  const imp = []; sim.events.on('scrape', () => st.scrapes++); sim.events.on('bump', (e) => { st.bumps++; imp.push(e.strength); }); sim.events.on('recover', () => st.recov++);
  sim.events.on('hit', (e) => { if (e.weaponId === 'wall') st.wallDmg += e.dmg; });
  const laps = []; sim.events.on('lap', (e) => laps.push(e.lapTime));
  let n = 0, hold = 0;
  while (!sim.isOver() && n++ < 120 * 60 * 12) {
    const ai = driveAI(car, { track: sim.track, cars: sim.cars, t: sim.time, dt: SIM_DT, racing: sim.phase === 'racing', cruise: 1, playerProgress: null }, car.aiRng);
    const sg = ai.steer > DZ ? 1 : ai.steer < -DZ ? -1 : 0;
    const inp = { throttle: ai.throttle > 0.5 ? 1 : 0, brake: ai.brake > 0.5 ? 1 : 0, steer: sg, fire: false, handbrake: Math.abs(ai.steer) > 0.9 && car.speed > 25 && ai.brake > 0.2, nitro };
    sim.step(inp);
    if (sim.phase === 'racing') { st.maxBeta = Math.max(st.maxBeta, Math.abs(Math.atan2(car.w, Math.max(4, Math.abs(car.u))))); if (car.drift > 0.3) st.driftT += SIM_DT; }
  }
  const r = sim.result();
  console.log(`${tr.id.padEnd(9)} laps ${laps.map((l) => l.toFixed(1)).join('/')} total ${r.player.time?.toFixed(1)} scrapes ${st.scrapes} bumps ${st.bumps} recov ${st.recov} wallDmg ${st.wallDmg.toFixed(1)} armorLeft ${(r.player.armorLeft / r.player.armorMax * 100).toFixed(0)}% maxβ ${st.maxBeta.toFixed(2)} drift ${st.driftT.toFixed(0)}s impacts>9: ${imp.filter((x) => x > 9).map((x) => x.toFixed(0)).join(',')}`);
}
