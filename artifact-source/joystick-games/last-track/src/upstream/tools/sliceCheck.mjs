// Headless check of the game: 6 cars (AI-driven player + 5 drawn enemies) on every track and with every player car.
// Usage: node tools/sliceCheck.mjs [seeds=3] [playerSkill=0.85]
import { createRaceSim } from '../src/sim/raceSim.js';
import { createGameConfig } from '../src/data/sliceConfig.js';
import { defaultSave } from '../src/data/saveStore.js';
import { GAME_TRACKS } from '../src/data/tracks/index.js';
import { CARS } from '../src/data/cars.js';
const seeds = +process.argv[2] || 3, pskill = +process.argv[3] || 0.85;
const NO = { throttle: 0, brake: 0, steer: 0, fire: false, cycleWeapon: false, selectWeapon: null, handbrake: false };
for (const tr of GAME_TRACKS) for (const car of CARS) {
  const agg = { n: 0, fin: 0, wr: 0, shots: 0, hits: 0, win: 0, pos: 0, sim: 0, cars: new Set() };
  for (let s = 0; s < seeds; s++) {
    const save = { ...defaultSave(), carId: car.id, weapons: car.startWeapons.map((w) => ({ ...w })) };
    const cfg = createGameConfig({ trackId: tr.id, save, seed: 700 + s });
    cfg.rivals.forEach((r) => agg.cars.add(r.carId));
    const sim = createRaceSim(cfg, { aiPlayer: true, aiSkill: pskill });
    sim.events.on('shot', (e) => { if (e.carId > 0) agg.shots++; });
    sim.events.on('hit', (e) => { if (e.byId > 0 && e.weaponId !== 'wall' && e.weaponId !== 'ram' && e.weaponId !== 'flamethrower') agg.hits++; });
    let n = 0; while (!sim.isOver() && n++ < 120 * 600) sim.step(NO);
    const r = sim.result(); agg.n++; agg.sim += n / 120; agg.fin += r.finishOrder.filter((f) => f.time != null).length; agg.wr += r.finishOrder.filter((f) => f.wrecked).length;
    agg.win += r.finishOrder[0].time || 0; agg.pos += r.player.position;
  }
  console.log(`${tr.id.padEnd(8)} player ${car.id.padEnd(7)} 6 cars: finishers ${(agg.fin / agg.n).toFixed(1)}/6 wrecks ${(agg.wr / agg.n).toFixed(1)} winner ${(agg.win / agg.n).toFixed(0)}s playerPos ${(agg.pos / agg.n).toFixed(1)} enemy shots ${(agg.shots / agg.n).toFixed(0)} hits ${(agg.hits / agg.n).toFixed(0)} enemyCars ${[...agg.cars].join('/')}`);
}
