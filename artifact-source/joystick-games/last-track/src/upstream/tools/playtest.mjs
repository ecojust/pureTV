// Headless balance playtest: AI-driven "player" vs the track's field on every track/car.
// Usage: node tools/playtest.mjs [seeds=4] [playerSkill=0.8] [trackId|all] [loadout=default|full] [field=new|old]
//   loadout=full gives the AI player the expansion weapons (mine/oil/flamethrower/ramplate) it has slots for.
import { createRaceSim } from '../src/sim/raceSim.js';
import { createRaceConfig } from '../src/data/raceConfig.js';
import { defaultSave } from '../src/data/saveStore.js';
import { TRACKS } from '../src/data/tracks/index.js';
import { CARS } from '../src/data/cars.js';

const seeds = +process.argv[2] || 4, pskill = +process.argv[3] || 0.8;
const only = process.argv[4] && process.argv[4] !== 'all' ? process.argv[4] : null;
const full = process.argv[5] === 'full';
const oldField = process.argv[6] === 'old' ? ['vex', 'rust', 'fuse', 'kane'] : undefined;
const FULL = { wasp: [{ id: 'flamethrower', ammo: 200 }], hammer: [{ id: 'machinegun', ammo: 200 }, { id: 'mine', ammo: 8 }, { id: 'oil', ammo: 8 }], bulwark: [{ id: 'ramplate', ammo: 1 }, { id: 'flamethrower', ammo: 200 }] };
const NO = { throttle: 0, brake: 0, steer: 0, fire: false, cycleWeapon: false, selectWeapon: null, handbrake: false };
const rows = [];
const tot = { n: 0, rivalWrecks: 0, wrecked: 0, dnf: 0, stuck: 0, hitDmg: {}, kills: {} };
for (const tr of TRACKS) if (!only || tr.id === only) for (const car of CARS) {
  const agg = { n: 0, pos: 0, wins: 0, time: 0, dmg: 0, wrecked: 0, kills: 0, rivalWrecks: 0, dnf: 0, ticks: 0, best: 1e9, leader: 0 };
  for (let s = 0; s < seeds; s++) {
    const save = { ...defaultSave(), carId: car.id, weapons: (full ? FULL[car.id] : car.startWeapons).map((w) => ({ ...w })) };
    const cfg = createRaceConfig({ mode: 'race', trackId: tr.id, save, seed: 1000 + s, rivalIds: oldField });
    const sim = createRaceSim(cfg, { aiPlayer: true, aiSkill: pskill });
    sim.events.on('hit', (e) => { tot.hitDmg[e.weaponId] = (tot.hitDmg[e.weaponId] || 0) + e.dmg; });
    let ticks = 0; const maxTicks = 120 * 60 * 15;
    const still = new Map();   // rival id -> consecutive seconds crawling while racing (stuck detector)
    while (!sim.isOver() && ticks++ < maxTicks) {
      sim.step(NO);
      if (ticks % 60 === 0 && sim.phase === 'racing') for (const c of sim.cars) {
        if (c.isPlayer || c.wrecked || c.finished) continue;
        const t = c.speed < 1.5 ? (still.get(c.id) || 0) + 0.5 : 0; still.set(c.id, t);
        if (t === 6) tot.stuck++;
      }
    }
    const r = sim.result();
    agg.n++; agg.ticks += ticks / 120;
    if (!r.player.time) agg.dnf++;
    agg.pos += r.player.position; agg.wins += r.player.position === 1;
    if (r.player.time) { agg.time += r.player.time; agg.best = Math.min(agg.best, r.player.time); }
    agg.dmg += r.player.damageFraction; agg.wrecked += r.player.wrecked ? 1 : 0; agg.kills += r.player.kills;
    agg.rivalWrecks += r.finishOrder.filter((f) => !f.isPlayer && f.wrecked).length;
    const w = r.finishOrder.find((f) => f.position === 1); agg.leader += w?.time || 0;
  }
  const f = (x, d = 1) => (x / agg.n).toFixed(d);
  tot.n += agg.n; tot.rivalWrecks += agg.rivalWrecks; tot.wrecked += agg.wrecked; tot.dnf += agg.dnf;
  rows.push(`${tr.id.padEnd(9)} ${car.id.padEnd(7)} pos ${f(agg.pos)} win ${agg.wins}/${agg.n} dnf ${agg.dnf} time ${f(agg.time, 0)}s winT ${f(agg.leader,0)}s dmg ${f(agg.dmg, 2)} wrk ${agg.wrecked} rivalWrecks ${f(agg.rivalWrecks)} sim ${f(agg.ticks,0)}s`);
}
console.log(rows.join('\n'));
const dmg = Object.entries(tot.hitDmg).map(([k, v]) => `${k}:${(v / tot.n).toFixed(0)}`).join(' ');
console.log(`TOTAL races ${tot.n} rivalWrecks/race ${(tot.rivalWrecks / tot.n).toFixed(2)} playerWreck ${tot.wrecked}/${tot.n} playerDNF ${tot.dnf} stuckEvents(>6s crawl) ${tot.stuck}\ndmg/race by source: ${dmg}`);
