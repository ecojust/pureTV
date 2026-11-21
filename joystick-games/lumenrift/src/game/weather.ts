// Seasonal weather: each season adds two mechanics on top of either campaign.
//   Spring  — Bloom (a new vein sprouts every dawn) · Spring rain (puddles form where foes walk and bog them down)
//   Summer  — Wildfire (blasts set dry grass alight; it spreads, burns foes and scorches nearby structures)
//             · Thunderstorms (lightning strikes the field; towers near a strike catch it and are overcharged)
//   Autumn  — Gales (a night wind carries flyers and stretches tower reach downwind, shortens it upwind)
//             · Fog banks (drifting mist hides foes from all but the closest towers; the Nova burns it away)
//   Winter  — Frozen ponds (ice is walkable and slippery: new shortcuts for the enemy)
//             · Blizzards (whiteouts that shorten every tower's reach and slow everything down)
import { CORE_X, CORE_Y, hpScale, MAP_H, MAP_W, Season } from './config';
import { idx, inBounds, isCoreTile, Terrain } from './grid';
import type { Building, Enemy, Game } from './game';

const N = MAP_W * MAP_H;
const TAU = Math.PI * 2;

// spring
const PUDDLE_SLOW = 0.4;
const PUDDLE_EVERY = 2.2; // seconds of rain per new puddle
const PUDDLE_MAX = 18;
const PUDDLE_DAWNS = 2; // puddles dry up after this many dawns
const SPROUT_MAX = 10;
// summer
const FIRE_TIME = 5;
const FIRE_SPREAD = 0.08; // rate per second at which each neighbouring tile catches
const FIRE_MAX = 45;
const SCORCH_TIME = 35;
const FIRE_HEAT = 4; // hp per second to structures next to a fire
const BOLT_WARN = 1.1;
const BOLT_RADIUS = 1.1;
const ROD_REACH = 1.6;
const OVERCHARGE = 8; // seconds
export const OVERCHARGE_BONUS = 0.8; // attack speed while overcharged
// autumn
const GALE_RANGE = 0.2;
const GALE_DRIFT = 0.45; // tiles/s pushed onto flyers at full strength
export const VEIL_REACH = 1.9; // foes in fog can only be targeted from this close
// winter
const ICE_SPEED = 1.4;
const BLIZZARD_RANGE = 0.7;

export interface Fog {
  x: number;
  y: number;
  r: number;
  max: number;
}
export interface Bolt {
  x: number;
  y: number;
  t: number;
}

export interface WeatherSave {
  rain: boolean;
  storm: boolean;
  blizzardNight: boolean;
  blizzard: number;
  blizzardNext: number;
  windA: number;
  windS: number;
  fog: Fog[];
  bolts: Bolt[];
  boltT: number;
  rainAcc: number;
  puddles: [number, number][];
  fires: [number, number][];
  scorch: [number, number][];
  sprouted: number[];
}

export type WeatherKind = 'rain' | 'storm' | 'gale' | 'blizzard' | 'blizzardEnd' | 'sprout';

export class Weather {
  rain = false;
  storm = false;
  blizzardNight = false;
  /** Seconds of blizzard left (>0 while one rages). */
  blizzard = 0;
  blizzardNext = 0;
  windA = 0;
  windS = 0;
  fog: Fog[] = [];
  bolts: Bolt[] = [];
  boltT = 0;
  private rainAcc = 0;
  /** 0 = dry, otherwise 1 + dawns the puddle has lasted. */
  puddle = new Uint8Array(N);
  /** Seconds a tile keeps burning. */
  fire = new Float32Array(N);
  /** Seconds until a burnt tile can catch again (also drawn as ash). */
  scorch = new Float32Array(N);
  /** Tiles that sprouted into veins (re-applied to the regenerated map on load). */
  sprouted: number[] = [];
  fireCount = 0;
  /** Bumped whenever puddles/sprouts change, so the renderer can refresh cached overlays. */
  version = 0;

  constructor(
    readonly season: Season | null,
    private g: Game,
  ) {
    if (season === 'autumn') {
      const r = g.rng;
      this.windA = r.range(0, TAU);
      this.windS = r.range(0.5, 1);
      for (let i = 0; i < 3; i++) this.fog.push(this.newFog(r.range(0, MAP_W), r.range(0, MAP_H)));
    }
  }

  private newFog(x: number, y: number): Fog {
    const max = this.g.rng.range(2.2, 3.2);
    return { x, y, r: max, max };
  }

  get raining() {
    return this.rain && this.g.phase === 'wave';
  }
  get frozen() {
    return this.season === 'winter';
  }

  // ---------------------------------------------------------------- night / dawn

  onNightStart() {
    const g = this.g,
      r = g.rng,
      w = g.wave;
    switch (this.season) {
      case 'spring':
        this.rain = w >= 2 && (w === 2 || r.chance(0.6));
        this.rainAcc = 0;
        if (this.rain) this.emit('rain');
        break;
      case 'summer':
        this.storm = w >= 2 && (w === 3 || r.chance(0.5));
        this.boltT = r.range(2.5, 5);
        if (this.storm) this.emit('storm');
        break;
      case 'autumn': {
        this.windA = r.range(0, TAU);
        this.windS = r.range(0.5, 1);
        const want = Math.min(5, 3 + Math.floor(w / 10));
        while (this.fog.length < want) this.fog.push(this.newFog(r.range(0, MAP_W), r.range(0, MAP_H)));
        this.emit('gale');
        break;
      }
      case 'winter':
        this.blizzardNight = w >= 3 && (w === 3 || r.chance(0.5));
        this.blizzardNext = r.range(5, 14);
        break;
    }
  }

  onDawn() {
    switch (this.season) {
      case 'spring': {
        this.rain = false;
        for (let i = 0; i < N; i++) if (this.puddle[i] && ++this.puddle[i] > PUDDLE_DAWNS) this.puddle[i] = 0;
        this.version++;
        this.sprout();
        break;
      }
      case 'summer':
        this.storm = false;
        this.bolts = [];
        for (let i = 0; i < N; i++)
          if (this.fire[i] > 0) {
            this.fire[i] = 0;
            this.scorch[i] = SCORCH_TIME;
          }
        this.fireCount = 0;
        break;
      case 'winter':
        if (this.blizzard > 0) this.emit('blizzardEnd');
        this.blizzard = 0;
        this.blizzardNight = false;
        break;
    }
  }

  /** Bloom: a fresh vein pushes up through the grass somewhere in the middle distance. */
  private sprout() {
    const g = this.g;
    if (this.sprouted.length >= SPROUT_MAX) return;
    for (let tries = 0; tries < 200; tries++) {
      const x = g.rng.int(2, MAP_W - 3),
        y = g.rng.int(2, MAP_H - 3);
      const d = Math.hypot(x - CORE_X, y - CORE_Y);
      if (d < 4 || d > 14) continue;
      const i = idx(x, y);
      if (g.map.terrain[i] !== Terrain.Grass || g.buildingAt[i] || this.puddle[i]) continue;
      if (g.map.rifts.some((r) => Math.abs(r.x - x) <= 2 && Math.abs(r.y - y) <= 2)) continue;
      g.map.terrain[i] = Terrain.Crystal;
      this.sprouted.push(i);
      this.version++;
      this.emit('sprout', x + 0.5, y + 0.5);
      return;
    }
  }

  private emit(kind: WeatherKind, x = CORE_X + 0.5, y = CORE_Y + 0.5) {
    this.g.events.push({ type: 'weather', kind, x, y });
  }

  // ---------------------------------------------------------------- per step

  update(dt: number) {
    const g = this.g;
    const wave = g.phase === 'wave';
    if (this.season === 'autumn') this.driftFog(dt);
    if (!wave) return;
    switch (this.season) {
      case 'spring':
        if (this.rain) {
          this.rainAcc += dt;
          if (this.rainAcc >= PUDDLE_EVERY) {
            this.rainAcc -= PUDDLE_EVERY;
            this.formPuddle();
          }
        }
        break;
      case 'summer':
        this.updateFires(dt);
        if (this.storm) this.updateStorm(dt);
        break;
      case 'winter':
        if (this.blizzard > 0) {
          this.blizzard -= dt;
          if (this.blizzard <= 0) {
            this.blizzard = 0;
            this.emit('blizzardEnd');
          }
        } else if (this.blizzardNight) {
          this.blizzardNext -= dt;
          if (this.blizzardNext <= 0) {
            this.blizzard = g.rng.range(12, 16);
            this.blizzardNext = g.rng.range(22, 34);
            this.emit('blizzard');
          }
        }
        break;
    }
  }

  private formPuddle() {
    const g = this.g;
    let count = 0;
    for (let i = 0; i < N; i++) if (this.puddle[i]) count++;
    if (count >= PUDDLE_MAX) return;
    // puddles gather where the enemy walks (that is where the ground is trodden into hollows)
    const walkers = g.enemies.filter((e) => !e.dead && !e.def.flying);
    for (let tries = 0; tries < 30; tries++) {
      let x: number, y: number;
      if (walkers.length && g.rng.chance(0.8)) {
        const e = walkers[g.rng.int(0, walkers.length - 1)];
        x = Math.floor(e.x) + g.rng.int(-1, 1);
        y = Math.floor(e.y) + g.rng.int(-1, 1);
      } else {
        x = g.rng.int(1, MAP_W - 2);
        y = g.rng.int(1, MAP_H - 2);
      }
      if (!inBounds(x, y) || isCoreTile(x, y)) continue;
      const i = idx(x, y);
      const t = g.map.terrain[i];
      if (t !== Terrain.Grass || this.puddle[i]) continue;
      const b = g.buildingAtTile(x, y);
      if (b && b.def.blocks) continue;
      this.puddle[i] = 1;
      this.version++;
      return;
    }
  }

  private updateFires(dt: number) {
    const g = this.g;
    for (let i = 0; i < N; i++) if (this.scorch[i] > 0) this.scorch[i] = Math.max(0, this.scorch[i] - dt);
    if (!this.fireCount) return;
    const spread = 1 - Math.exp(-FIRE_SPREAD * dt);
    const newly: number[] = [];
    let n = 0;
    for (let i = 0; i < N; i++) {
      if (this.fire[i] <= 0) continue;
      this.fire[i] -= dt;
      if (this.fire[i] <= 0) {
        this.fire[i] = 0;
        this.scorch[i] = SCORCH_TIME;
        continue;
      }
      n++;
      const x = i % MAP_W,
        y = (i / MAP_W) | 0;
      for (const [dx, dy] of ORTHO) {
        const nx = x + dx,
          ny = y + dy;
        if (!inBounds(nx, ny)) continue;
        const b = g.buildingAtTile(nx, ny);
        if (b && b.def.blocks) {
          g.damageBuilding(b, FIRE_HEAT * dt); // heat scorches structures beside the blaze
          continue;
        }
        if (g.rng.next() < spread) newly.push(idx(nx, ny));
      }
    }
    this.fireCount = n;
    for (const i of newly) this.ignite(i);
    // the flames burn whoever walks through them
    const dps = 12 * Math.pow(hpScale(g.wave), 0.75);
    for (const e of g.enemies) {
      if (e.dead || e.def.flying) continue;
      const tx = Math.floor(e.x),
        ty = Math.floor(e.y);
      if (!inBounds(tx, ty) || this.fire[idx(tx, ty)] <= 0) continue;
      g.damageEnemy(e, dps * dt, 99, -1, true);
      e.burn = Math.max(e.burn, dps * 0.25);
      e.burnT = Math.max(e.burnT, 1.5);
    }
  }

  /** Set a tile alight if it is dry, open grass. Returns true if it caught. */
  ignite(i: number): boolean {
    const g = this.g;
    if (this.season !== 'summer' || g.phase !== 'wave') return false;
    if (this.fire[i] > 0 || this.scorch[i] > 0 || this.fireCount >= FIRE_MAX) return false;
    if (g.map.terrain[i] !== Terrain.Grass || g.buildingAt[i]) return false;
    // the paved plaza around the Beacon / Sanctum doesn't burn
    if (Math.hypot((i % MAP_W) - CORE_X, ((i / MAP_W) | 0) - CORE_Y) < 3.6) return false;
    this.fire[i] = FIRE_TIME * g.rng.range(0.8, 1.2);
    this.fireCount++;
    g.events.push({ type: 'ignite', x: (i % MAP_W) + 0.5, y: ((i / MAP_W) | 0) + 0.5 });
    return true;
  }

  igniteAt(x: number, y: number, chance: number) {
    if (this.season !== 'summer') return;
    const tx = Math.floor(x),
      ty = Math.floor(y);
    if (!inBounds(tx, ty) || this.g.rng.next() >= chance) return;
    this.ignite(idx(tx, ty));
  }

  private updateStorm(dt: number) {
    const g = this.g;
    this.boltT -= dt;
    if (this.boltT <= 0) {
      this.boltT = g.rng.range(4.5, 8);
      const foes = g.enemies.filter((e) => !e.dead);
      let x: number, y: number;
      if (foes.length && g.rng.chance(0.7)) {
        const e = foes[g.rng.int(0, foes.length - 1)];
        x = e.x + g.rng.range(-0.6, 0.6);
        y = e.y + g.rng.range(-0.6, 0.6);
      } else {
        x = g.rng.range(1, MAP_W - 1);
        y = g.rng.range(1, MAP_H - 1);
      }
      this.bolts.push({ x, y, t: BOLT_WARN });
      g.events.push({ type: 'boltWarn', x, y });
    }
    for (const b of this.bolts) {
      b.t -= dt;
      if (b.t <= 0) this.strike(b.x, b.y);
    }
    this.bolts = this.bolts.filter((b) => b.t > 0);
  }

  private strike(x: number, y: number) {
    const g = this.g;
    // the tallest thing around takes the bolt: a tower within reach acts as a lightning rod
    let rod: Building | null = null,
      rd = ROD_REACH * ROD_REACH;
    for (const b of g.buildings) {
      if (b.def.kind !== 'tower') continue;
      const d2 = (b.x + 0.5 - x) ** 2 + (b.y + 0.5 - y) ** 2;
      if (d2 <= rd) {
        rd = d2;
        rod = b;
      }
    }
    if (rod) {
      rod.charge = OVERCHARGE;
      g.events.push({ type: 'bolt', x: rod.x + 0.5, y: rod.y + 0.5, rod: true });
      return;
    }
    const dmg = 40 * hpScale(g.wave);
    for (const e of g.enemies) {
      if (e.dead) continue;
      if ((e.x - x) ** 2 + (e.y - y) ** 2 <= (BOLT_RADIUS + e.def.radius) ** 2) g.damageEnemy(e, dmg, 99, -1);
    }
    g.events.push({ type: 'bolt', x, y, rod: false });
    this.igniteAt(x, y, 1);
  }

  private driftFog(dt: number) {
    const vx = Math.cos(this.windA) * this.windS * 0.3,
      vy = Math.sin(this.windA) * this.windS * 0.3;
    for (const f of this.fog) {
      f.x += vx * dt;
      f.y += vy * dt;
      if (f.r < f.max) f.r = Math.min(f.max, f.r + dt * 0.12);
      // banks that leave the field roll back in from the opposite side
      const m = f.max + 1;
      if (f.x > MAP_W + m) f.x = -m;
      if (f.x < -m) f.x = MAP_W + m;
      if (f.y > MAP_H + m) f.y = -m;
      if (f.y < -m) f.y = MAP_H + m;
    }
  }

  // ---------------------------------------------------------------- queries used by the simulation

  /** Ice is walkable in winter. */
  passableWater(): boolean {
    return this.season === 'winter';
  }

  /** Status effects from the ground a foe stands on (call before its speed is computed). */
  groundEffects(e: Enemy) {
    if (e.def.flying) return;
    const tx = Math.floor(e.x),
      ty = Math.floor(e.y);
    if (!inBounds(tx, ty)) return;
    if (this.puddle[idx(tx, ty)]) e.slow = Math.max(e.slow, PUDDLE_SLOW);
  }

  /** Movement speed multiplier from weather and ground. */
  speedMul(e: Enemy): number {
    let k = 1;
    switch (this.season) {
      case 'spring':
        if (this.raining && e.def.flying) k *= 0.85;
        break;
      case 'winter': {
        if (this.blizzard > 0) k *= e.def.flying ? 0.6 : 0.8;
        if (!e.def.flying) {
          const tx = Math.floor(e.x),
            ty = Math.floor(e.y);
          if (inBounds(tx, ty) && this.g.map.terrain[idx(tx, ty)] === Terrain.Water) k *= ICE_SPEED;
        }
        break;
      }
    }
    return k;
  }

  /** Autumn gales push flyers along with the wind. */
  drift(e: Enemy, dt: number) {
    if (this.season !== 'autumn' || !e.def.flying || this.g.phase !== 'wave') return;
    e.x += Math.cos(this.windA) * this.windS * GALE_DRIFT * dt;
    e.y += Math.sin(this.windA) * this.windS * GALE_DRIFT * dt;
    e.x = Math.max(-1, Math.min(MAP_W + 1, e.x));
    e.y = Math.max(-1, Math.min(MAP_H + 1, e.y));
  }

  /** Does weather change how far towers reach? */
  get rangeFx(): boolean {
    return this.season === 'autumn' || this.blizzard > 0;
  }

  /** Reach multiplier for a shot from (x,y) in direction `ang`. */
  rangeMulDir(ang: number): number {
    let k = 1;
    if (this.season === 'autumn') k *= 1 + GALE_RANGE * this.windS * Math.cos(ang - this.windA);
    if (this.blizzard > 0) k *= BLIZZARD_RANGE;
    return k;
  }

  /** Is this foe hidden in a fog bank? */
  veiled(e: Enemy): boolean {
    if (this.season !== 'autumn') return false;
    for (const f of this.fog) if ((e.x - f.x) ** 2 + (e.y - f.y) ** 2 < f.r * f.r * 0.85) return true;
    return false;
  }

  /** The Nova / Daybreak burns away fog around the core. */
  clearFog(x: number, y: number, r: number) {
    for (const f of this.fog) if (Math.hypot(f.x - x, f.y - y) < r + f.r * 0.5) f.r = 0;
  }

  // ---------------------------------------------------------------- save / load

  toSave(): WeatherSave {
    const pairs = (a: ArrayLike<number>): [number, number][] => {
      const out: [number, number][] = [];
      for (let i = 0; i < a.length; i++) if (a[i]) out.push([i, a[i]]);
      return out;
    };
    return {
      rain: this.rain,
      storm: this.storm,
      blizzardNight: this.blizzardNight,
      blizzard: this.blizzard,
      blizzardNext: this.blizzardNext,
      windA: this.windA,
      windS: this.windS,
      fog: this.fog.map((f) => ({ ...f })),
      bolts: this.bolts.map((b) => ({ ...b })),
      boltT: this.boltT,
      rainAcc: this.rainAcc,
      puddles: pairs(this.puddle),
      fires: pairs(this.fire),
      scorch: pairs(this.scorch),
      sprouted: this.sprouted.slice(),
    };
  }

  load(d: WeatherSave) {
    Object.assign(this, {
      rain: d.rain,
      storm: d.storm,
      blizzardNight: d.blizzardNight,
      blizzard: d.blizzard,
      blizzardNext: d.blizzardNext,
      windA: d.windA,
      windS: d.windS,
      fog: d.fog,
      bolts: d.bolts,
      boltT: d.boltT,
      rainAcc: d.rainAcc,
    });
    for (const [i, v] of d.puddles) this.puddle[i] = v;
    for (const [i, v] of d.fires) this.fire[i] = v;
    for (const [i, v] of d.scorch) this.scorch[i] = v;
    this.fireCount = d.fires.length;
    this.sprouted = d.sprouted.slice();
    for (const i of this.sprouted) this.g.map.terrain[i] = Terrain.Crystal;
    this.version++;
  }
}

const ORTHO: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
