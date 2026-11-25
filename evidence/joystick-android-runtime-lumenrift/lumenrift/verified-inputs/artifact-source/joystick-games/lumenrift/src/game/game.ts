import {
  BUILD_TIME,
  BUILDINGS,
  BuildingDef,
  BuildingId,
  bountyScale,
  CORE_X,
  CORE_Y,
  DIFFICULTY,
  Difficulty,
  EARLY_CALL_BONUS,
  ENEMIES,
  EnemyDef,
  EnemyId,
  FIRST_BUILD_TIME,
  hpScale,
  LevelStats,
  MAP_H,
  MAP_W,
  Realm,
  REALMS,
  Season,
  SEASONS,
  SELL_REFUND,
  VICTORY_WAVE,
} from './config';
import { computeFlow, DIRS, generateMap, idx, inBounds, INF, isCoreTile, isSolid, MAP_VERSION, MapData, Terrain } from './grid';
import type { StringKey } from '../i18n/en';
import { Rng } from './rng';
import { planWave, riftsOpenAt, WavePlan, WaveSpawn } from './waves';
import { OVERCHARGE_BONUS, VEIL_REACH, Weather, WeatherKind, WeatherSave } from './weather';

export type TargetMode = 'first' | 'last' | 'strong' | 'close';
export const TARGET_MODES: TargetMode[] = ['first', 'last', 'strong', 'close'];

export interface Building {
  uid: number;
  def: BuildingDef;
  x: number;
  y: number;
  level: number; // 0-based
  hp: number;
  maxHp: number;
  cd: number;
  angle: number;
  targetUid: number;
  invested: number;
  freshSpend: number; // spent during current build phase (fully refundable)
  beamTime: number;
  firing: number; // >0 while firing (render hint)
  recoil: number;
  mode: TargetMode;
  kills: number;
  dealt: number;
  hurt: number; // render hint: recently damaged
  /** Orbit angle (halo blades) / animation phase. */
  spin: number;
  /** Attack-speed bonus from nearby fountains and lightning overcharge (recomputed every step). */
  buff: number;
  /** Summer storms: seconds left overcharged after catching a lightning bolt. */
  charge?: number;
  /** Frozen or hexed by an enemy: does nothing for this many seconds. */
  disabledT?: number;
  disabledKind?: 'hex' | 'freeze';
  /** Avalanche ledge: 0..1, ready to unleash at 1. */
  prime?: number;
  /** Sundial's High Noon: seconds left, and the attack-speed bonus it gives. */
  noonT?: number;
  noonBuff?: number;
  /** Within a fire brazier's warmth (can't be frozen). */
  warm?: boolean;
}

/** Allied units: zombies raised by the Reanimator Coil, the war mammoth. */
export interface Ally {
  uid: number;
  kind: 'zombie' | 'mammoth';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  /** Damage per second (zombie) or per trample (mammoth). */
  dmg: number;
  speed: number;
  life: number;
  facing: number;
  /** Route from the core side toward a rift, walked from index `pi` downwards (toward the rift). */
  path: { x: number; y: number }[];
  pi: number;
  /** Mammoth: heading home, distance left to charge, foes already trampled, knockback. */
  home?: boolean;
  left?: number;
  hits?: number[];
  push?: number;
  hx?: number;
  hy?: number;
  /** Fighting (render hint). */
  busy?: number;
  src: number;
}

/** Lingering ground effects: bramble thickets, burning oil, poison puddles, slime trails, warm embers. */
export interface Hazard {
  kind: 'bramble' | 'fire' | 'poison' | 'slime' | 'warm';
  x: number;
  y: number;
  r: number;
  t: number;
  max: number;
  dps: number;
  slow: number;
  src: number;
}

/** Autumn's Will-o'-Wisp: draws the host toward it. */
export interface Lure {
  x: number;
  y: number;
  r: number;
  t: number;
  dps: number;
}

export interface Enemy {
  uid: number;
  def: EnemyDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  slow: number;
  slowT: number;
  slowAmt: number;
  burn: number;
  burnT: number;
  wx: number;
  wy: number;
  hasWp: boolean;
  jx: number;
  jy: number;
  attackCd: number;
  attacking: number; // -1 none, 0 core, >0 building uid
  dist: number;
  dead: boolean;
  age: number;
  hit: number;
  abilityCd: number;
  facing: number;
  bounty: number;
  elite: boolean;
  /** Stunned / rooted for this many seconds (snare, titan slam, Daybreak). */
  stunT: number;
  // ---- seasonal behaviours (all optional so older saves load)
  /** Underground for this many seconds (burrowers); `burrowCd` until the next dive. */
  burrowT?: number;
  burrowCd?: number;
  shellT?: number;
  shellUsed?: boolean;
  /** Collapsed and reassembling (skeletons) / reborn from its egg (phoenix). */
  reviveT?: number;
  revived?: boolean;
  /** A mirage's illusion: harmless, worthless, fades after `lifeT`. */
  illusion?: boolean;
  lifeT?: number;
  /** Stumbling back the way it came. */
  confT?: number;
  poison?: number;
  poisonT?: number;
  stacks?: number;
  /** Armour ground away by sandblasters. */
  shred?: number;
  /** Takes double damage while cursed. */
  curseT?: number;
  /** Extra damage taken from spirit lanterns (recomputed every step). */
  hexed?: number;
  /** Raven mark: extra bounty fraction. */
  greed?: number;
  sinkT?: number;
  /** Aurora exposure, and frozen solid (takes 1.5× damage). */
  frostBuild?: number;
  frozenT?: number;
  dashT?: number;
  slimeT?: number;
  /** Distance rolled (grows the snowball roller). */
  rolled?: number;
  scale?: number;
  /** Timer for trait abilities (hexes, freezes, illusions, dashes). */
  traitCd?: number;
  /** A ghost nobody can see right now (render hint). */
  veiled?: boolean;
}

export interface Projectile {
  kind: 'bolt' | 'shell' | 'missile' | 'core' | 'javelin' | 'falcon' | 'ballista' | 'pellet' | 'rollball';
  x: number;
  y: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  targetUid: number;
  speed: number;
  damage: number;
  splash: number;
  pierce: number;
  t: number;
  flight: number;
  air: boolean;
  ground: boolean;
  src: number;
  color: string;
  dead: boolean;
  /** Javelin: enemies already struck and how many more it may pass through. */
  hits?: number[];
  pierceLeft?: number;
  /** Ballista: double damage against targets below this hp fraction. */
  execute?: number;
  /** Falcon: seconds left to hunt, and its strike cooldown. */
  life?: number;
  cd?: number;
  /** On-hit extras: slow, stacking poison; shells: what they leave behind. */
  slow?: number;
  poison?: number;
  after?: 'bramble' | 'naphtha' | 'catapult';
  dur?: number;
  shots?: number;
  /** Rolling snowball: the route it rolls along. */
  route?: { x: number; y: number }[];
}

export interface Strike {
  x: number;
  y: number;
  targetUid: number;
  t: number;
  damage: number;
  splash: number;
  src: number;
  /** 'sun' = obelisk pillar; 'slam' = winged titan (stuns); aimed core powers; catapult bomblets. */
  kind?: 'sun' | 'slam' | 'sunstrike' | 'comet' | 'bomblet';
  stun?: number;
}

/** Visual/sound cues for seasonal mechanics. */
export type FxKind =
  | 'devour'
  | 'lash'
  | 'beam'
  | 'noon'
  | 'whirl'
  | 'potion'
  | 'reap'
  | 'timestop'
  | 'harpoon'
  | 'avalanche'
  | 'shatter'
  | 'freezepulse'
  | 'roots'
  | 'vines'
  | 'lure'
  | 'hex'
  | 'freeze'
  | 'thaw'
  | 'revive'
  | 'illusion'
  | 'burrow'
  | 'surface'
  | 'bomb'
  | 'swallow'
  | 'raise'
  | 'mammoth'
  | 'sting'
  | 'puff'
  | 'shell'
  | 'cast';

export type GameEvent =
  | { type: 'shoot'; kind: BuildingId | 'core'; x: number; y: number; tx: number; ty: number }
  | { type: 'hit'; x: number; y: number; color: string }
  | { type: 'explode'; x: number; y: number; r: number; color: string }
  | { type: 'die'; x: number; y: number; enemy: EnemyId; big: boolean }
  | { type: 'bounty'; x: number; y: number; amount: number }
  | { type: 'chain'; pts: { x: number; y: number }[] }
  | { type: 'build'; x: number; y: number; id: BuildingId }
  | { type: 'upgrade'; x: number; y: number; id: BuildingId; level: number }
  | { type: 'sell'; x: number; y: number; amount: number }
  | { type: 'destroyed'; x: number; y: number; id: BuildingId }
  | { type: 'coreHit'; x: number; y: number; dmg: number }
  | { type: 'coreUp'; level: number }
  | { type: 'nova'; r: number }
  | { type: 'strikeWarn'; x: number; y: number; r: number }
  | { type: 'strike'; x: number; y: number; r: number }
  | { type: 'harvest'; x: number; y: number; amount: number }
  | { type: 'waveStart'; wave: number; plan: WavePlan }
  | { type: 'waveClear'; wave: number; bonus: number }
  | { type: 'riftOpen'; x: number; y: number }
  | { type: 'bossSpawn'; x: number; y: number; enemy: EnemyId }
  | { type: 'spawn'; x: number; y: number }
  | { type: 'heal'; x: number; y: number }
  | { type: 'thorns'; x: number; y: number }
  | { type: 'frost'; x: number; y: number; r: number }
  | { type: 'pulse'; x: number; y: number; r: number; color: string }
  | { type: 'gust'; x: number; y: number; tx: number; ty: number }
  | { type: 'snare'; x: number; y: number }
  | { type: 'slamWarn'; x: number; y: number; r: number }
  | { type: 'slam'; x: number; y: number; r: number }
  | { type: 'weather'; kind: WeatherKind; x: number; y: number }
  | { type: 'ignite'; x: number; y: number }
  | { type: 'boltWarn'; x: number; y: number }
  | { type: 'bolt'; x: number; y: number; rod: boolean }
  | { type: 'fx'; kind: FxKind; x: number; y: number; x2?: number; y2?: number; r?: number; pts?: { x: number; y: number }[]; color?: string }
  | { type: 'error'; msg: StringKey; vars?: Record<string, string | number> }
  | { type: 'defeat' }
  | { type: 'victory' };

/** Everything needed to resume a game exactly where it was left (the map regenerates from the seed). */
export interface SaveData {
  v: 1;
  /** Missing in saves from before the day realm existed (= night, map version 1). */
  realm?: Realm;
  mapV?: number;
  /** Missing in saves from before seasons existed (= no seasonal weather). */
  season?: Season | null;
  weather?: WeatherSave;
  seed: number;
  difficulty: Difficulty;
  rng: number;
  uidSeq: number;
  money: number;
  coreLevel: number;
  coreHp: number;
  novaCd: number;
  wave: number;
  phase: 'build' | 'wave';
  buildTimer: number; // -1 = infinite (sandbox)
  waveTime: number;
  plan: WavePlan | null;
  nextPlan: WavePlan;
  queue: WaveSpawn[];
  time: number;
  won: boolean;
  endless: boolean;
  stats: Game['stats'];
  buildings: (Omit<Building, 'def'> & { def: BuildingId })[];
  enemies: (Omit<Enemy, 'def'> & { def: EnemyId })[];
  projectiles: Projectile[];
  strikes: Strike[];
  allies?: Ally[];
  hazards?: Hazard[];
  lures?: Lure[];
}

export interface PlaceCheck {
  ok: boolean;
  reason?: StringKey;
  vars?: Record<string, number>;
}

const DT = 1 / 60;

export class Game {
  readonly realm: Realm;
  /** Whose weather applies: a seasonal campaign's own season, a legacy modifier on old night/day saves, or null. */
  readonly season: Season | null;
  readonly weather: Weather;
  readonly map: MapData;
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly rng: Rng;

  buildings: Building[] = [];
  buildingAt: Int32Array; // tile -> building uid, 0 = none
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  strikes: Strike[] = [];
  allies: Ally[] = [];
  hazards: Hazard[] = [];
  lures: Lure[] = [];
  events: GameEvent[] = [];

  flowG = new Float32Array(MAP_W * MAP_H);
  flowB = new Float32Array(MAP_W * MAP_H);
  /** Terrain-only flow (burrowers tunnel under structures). */
  flowT = new Float32Array(MAP_W * MAP_H);
  flowVersion = 0;

  money = 0;
  /** Sandbox mode: everything is free, the Beacon can't fall, nights start only when called. */
  readonly sandbox: boolean;
  coreLevel = 0;
  coreHp = 0;
  coreCd = 0;
  coreAngle = 0;
  coreHurt = 0;
  novaCd = 12;
  wave = 0; // number of the last started wave
  phase: 'build' | 'wave' = 'build';
  buildTimer = FIRST_BUILD_TIME;
  waveTime = 0;
  plan: WavePlan | null = null;
  nextPlan: WavePlan;
  private queue: WaveSpawn[] = [];
  get queued() {
    return this.queue.length;
  }
  time = 0;
  over = false;
  won = false;
  endless = false;
  stats = { kills: 0, earned: 0, built: 0, lost: 0, bossKills: 0, leaked: 0, attempts: 1 };

  private uidSeq = 1;
  private byUid = new Map<number, Building>();
  private enemyByUid = new Map<number, Enemy>();

  constructor(seed: number, difficulty: Difficulty, realm: Realm = 'night', season: Season | null = null, mapVersion = MAP_VERSION) {
    this.seed = seed;
    this.difficulty = difficulty;
    this.realm = realm;
    // seasonal campaigns bring their season's weather; night/day runs only had one in old saves
    this.season = REALMS[realm].season ?? season;
    this.mapVersion = mapVersion;
    this.rng = new Rng(seed ^ 0xabcdef);
    this.map = generateMap(seed, realm, mapVersion, this.season);
    this.weather = new Weather(season, this);
    this.buildingAt = new Int32Array(MAP_W * MAP_H);
    this.money = Math.round(this.R.startMoney * DIFFICULTY[difficulty].money);
    this.coreHp = this.R.coreLevels[0].hp;
    this.sandbox = difficulty === 'sandbox';
    if (this.sandbox) {
      this.buildTimer = Infinity; // nights only start when called
      this.novaCd = 0;
    }
    this.recomputeFlow();
    this.nextPlan = planWave(1, difficulty, seed, realm);
  }

  readonly mapVersion: number;
  /** This campaign's rules (structures, Beacon/Sanctum levels, ability, rifts…). */
  get R() {
    return REALMS[this.realm];
  }
  /** Enemy hit point multiplier from difficulty and season. */
  get hpMul() {
    const legacySeason = this.season && !REALMS[this.realm].season;
    return DIFFICULTY[this.difficulty].hp * (legacySeason ? SEASONS[this.season!].hp : 1);
  }

  // ---------------------------------------------------------------- save / load

  toSave(): SaveData {
    return {
      v: 1,
      realm: this.realm,
      mapV: this.mapVersion,
      season: this.season,
      weather: this.weather.toSave(),
      seed: this.seed,
      difficulty: this.difficulty,
      rng: this.rng.state,
      uidSeq: this.uidSeq,
      money: this.money,
      coreLevel: this.coreLevel,
      coreHp: this.coreHp,
      novaCd: this.novaCd,
      wave: this.wave,
      phase: this.phase,
      buildTimer: isFinite(this.buildTimer) ? this.buildTimer : -1,
      waveTime: this.waveTime,
      plan: this.plan,
      nextPlan: this.nextPlan,
      queue: this.queue,
      time: this.time,
      won: this.won,
      endless: this.endless,
      stats: { ...this.stats },
      buildings: this.buildings.map((b) => ({ ...b, def: b.def.id })),
      enemies: this.enemies.filter((e) => !e.dead).map((e) => ({ ...e, def: e.def.id })),
      projectiles: this.projectiles.filter((p) => !p.dead),
      strikes: this.strikes,
      allies: this.allies,
      hazards: this.hazards,
      lures: this.lures,
    };
  }

  static fromSave(d: SaveData): Game {
    const g = new Game(d.seed, d.difficulty, d.realm ?? 'night', d.season ?? null, d.mapV ?? 1);
    if (d.weather) g.weather.load(d.weather);
    g.rng.state = d.rng;
    g.uidSeq = d.uidSeq;
    g.money = d.money;
    g.coreLevel = d.coreLevel;
    g.coreHp = d.coreHp;
    g.novaCd = d.novaCd;
    g.wave = d.wave;
    g.phase = d.phase;
    g.buildTimer = d.buildTimer < 0 ? Infinity : d.buildTimer;
    g.waveTime = d.waveTime;
    g.plan = d.plan;
    g.nextPlan = d.nextPlan;
    g.queue = d.queue;
    g.time = d.time;
    g.won = d.won;
    g.endless = d.endless || d.won; // a won game resumes as endless night
    g.stats = { ...g.stats, ...d.stats };
    for (const s of d.buildings) {
      const b: Building = { ...s, def: BUILDINGS[s.def] };
      g.buildings.push(b);
      g.byUid.set(b.uid, b);
      g.buildingAt[idx(b.x, b.y)] = b.uid;
    }
    for (const s of d.enemies) {
      const e: Enemy = { ...s, def: ENEMIES[s.def], hasWp: false };
      g.enemies.push(e);
      g.enemyByUid.set(e.uid, e);
    }
    g.projectiles = d.projectiles;
    g.strikes = d.strikes;
    g.allies = d.allies ?? [];
    g.hazards = d.hazards ?? [];
    g.lures = d.lures ?? [];
    g.recomputeFlow();
    // the flow field is the same as when saved, so foes keep the waypoints they were walking to
    d.enemies.forEach((s, i) => (g.enemies[i].hasWp = !!s.hasWp));
    return g;
  }

  // ---------------------------------------------------------------- queries

  get core() {
    return this.R.coreLevels[this.coreLevel];
  }
  get coreMaxHp() {
    return this.core.hp;
  }
  get riftCount() {
    return riftsOpenAt(Math.max(1, this.phase === 'build' ? this.wave + 1 : this.wave), this.realm);
  }
  /** Rifts that exist now (including one that will open with the next wave, shown as forming). */
  activeRifts() {
    return this.map.rifts.slice(0, riftsOpenAt(Math.max(1, this.wave), this.realm));
  }
  formingRifts() {
    return this.map.rifts.slice(riftsOpenAt(Math.max(1, this.wave), this.realm), riftsOpenAt(Math.max(1, this.wave + 1), this.realm));
  }
  buildingByUid(uid: number) {
    return this.byUid.get(uid);
  }
  enemyByUidGet(uid: number) {
    return this.enemyByUid.get(uid);
  }
  buildingAtTile(x: number, y: number): Building | undefined {
    if (!inBounds(x, y)) return undefined;
    const u = this.buildingAt[idx(x, y)];
    return u ? this.byUid.get(u) : undefined;
  }
  stats_(b: Building): LevelStats {
    return b.def.levels[b.level];
  }
  isUnlocked(id: BuildingId) {
    return BUILDINGS[id].tier <= this.coreLevel + 1;
  }
  upgradeCost(b: Building): number | null {
    return b.level + 1 < b.def.levels.length ? b.def.levels[b.level + 1].cost : null;
  }
  sellValue(b: Building): number {
    return Math.floor(b.freshSpend + (b.invested - b.freshSpend) * SELL_REFUND);
  }
  coreUpgradeCost(): number | null {
    return this.coreLevel + 1 < this.R.coreLevels.length ? this.R.coreLevels[this.coreLevel + 1].upgradeCost : null;
  }

  // ---------------------------------------------------------------- flow fields

  /** Impassable terrain (in winter the ponds freeze over and can be walked on). */
  private solid(t: number): boolean {
    return isSolid(t) && !(t === Terrain.Water && this.weather.passableWater());
  }

  private groundCost(i: number, extraBlock = -1): number {
    const t = this.map.terrain[i];
    if (this.solid(t) || t === Terrain.Core) return INF;
    if (i === extraBlock) return INF;
    const u = this.buildingAt[i];
    if (u) {
      const b = this.byUid.get(u)!;
      if (b.def.blocks) return INF;
    }
    return 1;
  }

  private breakerCost(i: number): number {
    const t = this.map.terrain[i];
    if (this.solid(t) || t === Terrain.Core) return INF;
    const u = this.buildingAt[i];
    if (u) {
      const b = this.byUid.get(u)!;
      if (b.def.blocks) return 3 + b.hp / 120;
    }
    return 1;
  }

  recomputeFlow() {
    computeFlow((i) => this.groundCost(i), this.flowG);
    computeFlow((i) => this.breakerCost(i), this.flowB);
    computeFlow((i) => (this.solid(this.map.terrain[i]) || this.map.terrain[i] === Terrain.Core ? INF : 1), this.flowT);
    this.flowVersion++;
    for (const e of this.enemies) e.hasWp = false;
  }

  // ---------------------------------------------------------------- player actions

  canPlace(id: BuildingId, x: number, y: number): PlaceCheck {
    const def = BUILDINGS[id];
    if (!inBounds(x, y)) return { ok: false, reason: 'err.bounds' };
    if (def.realm !== this.realm) return { ok: false, reason: 'err.bounds' };
    if (!this.isUnlocked(id)) return { ok: false, reason: 'err.locked', vars: { n: def.tier } };
    const i = idx(x, y);
    const t = this.map.terrain[i];
    if (t === Terrain.Rock) return { ok: false, reason: 'err.rock' };
    if (t === Terrain.Water) return { ok: false, reason: this.weather.frozen ? 'err.ice' : 'err.water' };
    if (t === Terrain.Tree) return { ok: false, reason: 'err.tree' };
    if (t === Terrain.Core) return { ok: false, reason: 'err.core' };
    if (t === Terrain.Rift) return { ok: false, reason: 'err.rift' };
    if (this.buildingAt[i]) return { ok: false, reason: 'err.occupied' };
    if (def.onlyOn === 'crystal' && t !== Terrain.Crystal) return { ok: false, reason: 'err.crystal' };
    if (!this.canAfford(def.levels[0].cost)) return { ok: false, reason: 'err.money' };
    if (def.blocks) {
      for (const e of this.enemies) {
        if (e.def.flying || e.dead) continue;
        if (Math.abs(e.x - (x + 0.5)) < 0.5 + e.def.radius && Math.abs(e.y - (y + 0.5)) < 0.5 + e.def.radius)
          return { ok: false, reason: 'err.enemy' };
      }
      if (!this.pathStillOpen(i)) return { ok: false, reason: 'err.seal' };
    }
    return { ok: true };
  }

  private scratch = new Float32Array(MAP_W * MAP_H);
  private pathStillOpen(blockIdx: number): boolean {
    const f = computeFlow((i) => this.groundCost(i, blockIdx), this.scratch);
    // every rift, including ones that have not opened yet, must keep a path to the Beacon
    for (const r of this.map.rifts) if (f[idx(r.x, r.y)] >= INF) return false;
    for (const e of this.enemies) {
      if (e.def.flying || e.dead) continue;
      const ti = idx(Math.floor(e.x), Math.floor(e.y));
      if (ti !== blockIdx && f[ti] >= INF && this.flowG[ti] < INF) return false;
    }
    return true;
  }

  place(id: BuildingId, x: number, y: number): Building | null {
    const chk = this.canPlace(id, x, y);
    if (!chk.ok) {
      this.events.push({ type: 'error', msg: chk.reason!, vars: chk.vars });
      return null;
    }
    const def = BUILDINGS[id];
    const L = def.levels[0];
    this.spend(L.cost);
    const b: Building = {
      uid: this.uidSeq++,
      def,
      x,
      y,
      level: 0,
      hp: L.hp,
      maxHp: L.hp,
      cd: 0.3,
      angle: -Math.PI / 2,
      targetUid: 0,
      invested: L.cost,
      freshSpend: this.phase === 'build' ? L.cost : 0,
      beamTime: 0,
      firing: 0,
      recoil: 0,
      mode: id === 'skyhunter' ? 'strong' : 'first',
      kills: 0,
      dealt: 0,
      hurt: 0,
      spin: 0,
      buff: 0,
    };
    this.buildings.push(b);
    this.byUid.set(b.uid, b);
    this.buildingAt[idx(x, y)] = b.uid;
    this.stats.built++;
    if (def.blocks) this.recomputeFlow();
    this.events.push({ type: 'build', x: x + 0.5, y: y + 0.5, id });
    return b;
  }

  upgrade(b: Building): boolean {
    const cost = this.upgradeCost(b);
    if (cost === null) return false;
    if (!this.canAfford(cost)) {
      this.events.push({ type: 'error', msg: 'err.money' });
      return false;
    }
    this.spend(cost);
    b.level++;
    b.invested += cost;
    if (this.phase === 'build') b.freshSpend += cost;
    const L = b.def.levels[b.level];
    const frac = b.hp / b.maxHp;
    b.maxHp = L.hp;
    b.hp = Math.max(b.hp, L.hp * frac, L.hp * 0.5);
    this.events.push({ type: 'upgrade', x: b.x + 0.5, y: b.y + 0.5, id: b.def.id, level: b.level });
    if (b.def.blocks) this.recomputeFlow(); // breaker costs depend on hp
    return true;
  }

  sell(b: Building) {
    const v = this.sellValue(b);
    this.money += v;
    this.removeBuilding(b);
    this.events.push({ type: 'sell', x: b.x + 0.5, y: b.y + 0.5, amount: v });
  }

  private removeBuilding(b: Building) {
    this.buildings = this.buildings.filter((o) => o !== b);
    this.byUid.delete(b.uid);
    this.buildingAt[idx(b.x, b.y)] = 0;
    for (const e of this.enemies) if (e.attacking === b.uid) e.attacking = -1;
    if (b.def.blocks) this.recomputeFlow();
  }

  upgradeCore(): boolean {
    const cost = this.coreUpgradeCost();
    if (cost === null) return false;
    if (!this.canAfford(cost)) {
      this.events.push({ type: 'error', msg: 'err.money' });
      return false;
    }
    this.spend(cost);
    const oldMax = this.coreMaxHp;
    this.coreLevel++;
    this.coreHp = Math.min(this.coreMaxHp, this.coreHp + (this.coreMaxHp - oldMax) + this.coreMaxHp * 0.25);
    this.events.push({ type: 'coreUp', level: this.coreLevel });
    return true;
  }

  canAfford(cost: number): boolean {
    return this.sandbox || this.money >= cost;
  }

  private spend(cost: number) {
    if (!this.sandbox) this.money -= cost;
  }

  /** Sandbox only: choose which night comes next (during the build phase). */
  setNextWave(n: number) {
    if (!this.sandbox || this.phase !== 'build') return;
    n = Math.max(1, Math.min(99, Math.round(n)));
    this.wave = n - 1;
    this.nextPlan = planWave(n, this.difficulty, this.seed, this.realm);
    this.recomputeFlow();
  }

  cycleMode(b: Building) {
    b.mode = TARGET_MODES[(TARGET_MODES.indexOf(b.mode) + 1) % TARGET_MODES.length];
  }

  callWaveNow() {
    if (this.phase !== 'build' || this.over) return;
    const bonus = this.sandbox ? 0 : Math.floor(this.buildTimer * EARLY_CALL_BONUS);
    if (bonus > 0) {
      this.money += bonus;
      this.stats.earned += bonus;
      this.events.push({ type: 'bounty', x: CORE_X + 0.5, y: CORE_Y - 1, amount: bonus });
    }
    this.startWave();
  }

  nova(): boolean {
    if (this.novaCd > 0 || this.over || this.R.aimed) return false;
    this.novaCd = this.sandbox ? 5 : this.R.abilityCooldown;
    const cx = CORE_X + 0.5,
      cy = CORE_Y + 0.5;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - cx, e.y - cy);
      if (d <= this.R.abilityRadius) {
        this.damageEnemy(e, this.core.nova * (d < 2.5 ? 1 : 0.7), 99, -1);
        if (this.R.abilityStun > 0) e.stunT = Math.max(e.stunT, this.R.abilityStun); // Daybreak dazzles
        else {
          e.slowT = 3; // Nova chills
          e.slowAmt = 0.5;
        }
      }
    }
    this.weather.clearFog(cx, cy, this.R.abilityRadius);
    this.events.push({ type: 'nova', r: this.R.abilityRadius });
    return true;
  }

  // ---------------------------------------------------------------- simulation

  update(dt: number) {
    // fixed timestep
    this.acc += dt;
    let n = 0;
    while (this.acc >= DT && n < 12) {
      this.step(DT);
      this.acc -= DT;
      n++;
    }
    if (n >= 12) this.acc = 0;
  }
  private acc = 0;

  step(dt: number) {
    if (this.over) return;
    this.time += dt;
    if (this.novaCd > 0) this.novaCd = Math.max(0, this.novaCd - dt);
    if (this.coreHurt > 0) this.coreHurt -= dt;

    if (this.phase === 'build') {
      this.buildTimer -= dt;
      if (this.buildTimer <= 0) this.startWave();
    } else {
      this.waveTime += dt;
      while (this.queue.length && this.queue[0].t <= this.waveTime) this.spawn(this.queue.shift()!);
    }
    this.weather.update(dt);

    this.prepareAuras(dt);
    this.updateEnemies(dt);
    this.updateHazards(dt);
    this.updateLures(dt);
    this.updateAllies(dt);
    this.updateBuildings(dt);
    this.updateCore(dt);
    this.updateProjectiles(dt);
    this.updateStrikes(dt);

    if (this.enemies.some((e) => e.dead)) {
      this.enemies = this.enemies.filter((e) => {
        if (e.dead) this.enemyByUid.delete(e.uid);
        return !e.dead;
      });
    }
    if (this.projectiles.some((p) => p.dead)) this.projectiles = this.projectiles.filter((p) => !p.dead);
    if (this.allies.some((a) => a.hp <= 0 || a.life <= 0)) this.allies = this.allies.filter((a) => a.hp > 0 && a.life > 0);

    if (this.phase === 'wave' && !this.queue.length && !this.enemies.length) this.endWave();
  }

  private startWave() {
    this.wave++;
    const newRifts = this.map.rifts.slice(riftsOpenAt(this.wave - 1, this.realm), riftsOpenAt(this.wave, this.realm));
    if (this.wave > 1) for (const r of newRifts) this.events.push({ type: 'riftOpen', x: r.x + 0.5, y: r.y + 0.5 });
    this.phase = 'wave';
    this.waveTime = 0;
    this.plan = this.nextPlan;
    this.queue = this.plan.spawns.slice();
    for (const b of this.buildings) b.freshSpend = 0;
    this.events.push({ type: 'waveStart', wave: this.wave, plan: this.plan });
    this.weather.onNightStart();
  }

  private endWave() {
    this.phase = 'build';
    this.hazards = [];
    this.lures = [];
    for (const b of this.buildings) b.disabledT = 0;
    this.buildTimer = this.sandbox ? Infinity : BUILD_TIME;
    let bonus = Math.round((20 + this.wave * 4) * DIFFICULTY[this.difficulty].money);
    for (const b of this.buildings) {
      const inc = this.stats_(b).income;
      if (inc) {
        bonus += inc;
        this.events.push({ type: 'harvest', x: b.x + 0.5, y: b.y + 0.5, amount: inc });
      }
    }
    this.money += bonus;
    this.stats.earned += bonus;
    this.events.push({ type: 'waveClear', wave: this.wave, bonus });
    this.weather.onDawn();
    this.nextPlan = planWave(this.wave + 1, this.difficulty, this.seed, this.realm);
    if (this.wave >= VICTORY_WAVE && !this.won && !this.endless && !this.sandbox) {
      this.won = true;
      this.over = true;
      this.events.push({ type: 'victory' });
    }
  }

  continueEndless() {
    this.endless = true;
    this.over = false;
  }

  private spawn(s: WaveSpawn) {
    const def = ENEMIES[s.enemy];
    const r = this.map.rifts[s.rift] ?? this.map.rifts[0];
    const hp = def.hp * hpScale(this.wave) * this.hpMul * s.elite;
    const e = this.makeEnemy(def, r.x + 0.5, r.y + 0.5, hp);
    if (s.elite > 1) {
      e.bounty *= s.elite;
      e.elite = true;
    }
    this.events.push({ type: def.boss ? 'bossSpawn' : 'spawn', x: e.x, y: e.y, ...(def.boss ? { enemy: def.id } : {}) } as GameEvent);
  }

  private makeEnemy(def: EnemyDef, x: number, y: number, hp: number): Enemy {
    const e: Enemy = {
      uid: this.uidSeq++,
      def,
      x: x + this.rng.range(-0.15, 0.15),
      y: y + this.rng.range(-0.15, 0.15),
      vx: 0,
      vy: 0,
      hp,
      maxHp: hp,
      slow: 0,
      slowT: 0,
      slowAmt: 0,
      burn: 0,
      burnT: 0,
      wx: 0,
      wy: 0,
      hasWp: false,
      jx: this.rng.range(-0.17, 0.17),
      jy: this.rng.range(-0.17, 0.17),
      attackCd: 0.5,
      attacking: -1,
      dist: 999,
      dead: false,
      age: 0,
      hit: 0,
      abilityCd: 3,
      facing: 0,
      bounty: def.bounty * bountyScale(this.wave) * DIFFICULTY[this.difficulty].money,
      elite: false,
      stunT: 0,
    };
    this.enemies.push(e);
    this.enemyByUid.set(e.uid, e);
    return e;
  }

  // ---------------------------------------------------------------- enemies

  private updateEnemies(dt: number) {
    const cx = CORE_X + 0.5,
      cy = CORE_Y + 0.5;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.age += dt;
      if (e.hit > 0) e.hit -= dt;
      const tr = e.def.traits;
      // a mirage's illusions fade away
      if (e.illusion) {
        e.lifeT = (e.lifeT ?? 0) - dt;
        if (e.lifeT <= 0) {
          e.dead = true;
          this.fx('illusion', e.x, e.y);
          continue;
        }
      }
      // collapsed skeleton / phoenix egg: lies still until it rises again
      if (e.reviveT && e.reviveT > 0) {
        e.reviveT -= dt;
        if (e.reviveT <= 0) {
          e.reviveT = 0;
          e.hp = e.maxHp * (tr?.revive ?? 0.5);
          this.fx('revive', e.x, e.y);
        }
        continue;
      }
      // status
      if (e.slowT > 0) {
        e.slowT -= dt;
        e.slow = Math.max(e.slow, e.slowAmt);
      }
      if (e.burnT > 0) {
        e.burnT -= dt;
        this.damageEnemy(e, e.burn * dt, 99, -1, true);
        if (e.dead) continue;
      }
      if (e.poisonT && e.poisonT > 0) {
        e.poisonT -= dt;
        this.damageEnemy(e, (e.poison ?? 0) * dt, 99, -1, true);
        if (e.poisonT <= 0) e.stacks = 0;
        if (e.dead) continue;
      }
      for (const k of ['curseT', 'frozenT', 'confT', 'slimeT', 'dashT', 'shellT'] as const) if (e[k]) e[k] = Math.max(0, e[k]! - dt);
      if (e.sinkT) e.sinkT = Math.max(0, e.sinkT - dt * 0.5);
      // abilities
      e.abilityCd -= dt;
      if (e.abilityCd <= 0) this.enemyAbility(e);
      if (tr) this.traitAbility(e, dt);
      if (e.dead) continue;

      if (e.stunT > 0) e.stunT -= dt;
      this.weather.groundEffects(e);
      const speed = e.stunT > 0 || (e.shellT ?? 0) > 0 ? 0 : e.def.speed * (1 - Math.min(0.8, e.slow)) * this.weather.speedMul(e) * this.traitSpeed(e);
      e.slow = 0; // re-applied each frame by auras
      const px = e.x,
        py = e.y;

      if (e.stunT > 0 || (e.shellT ?? 0) > 0) {
        // stunned or shut in its shell: neither moves nor attacks
      } else if (e.attacking >= 0) {
        this.enemyAttack(e, dt);
      } else if (e.def.flying) {
        const dx = cx - e.x,
          dy = cy - e.y;
        const d = Math.hypot(dx, dy);
        if (d < 1.55 + e.def.radius * 0.5 && !e.confT) {
          this.reachCore(e);
        } else {
          // dazed flyers drift back out
          const dir = e.confT ? -1 : 1;
          e.x += ((dx / d) * speed * dt * dir) / (e.confT ? 2 : 1);
          e.y += ((dy / d) * speed * dt * dir) / (e.confT ? 2 : 1);
          this.weather.drift(e, dt);
        }
        e.dist = d;
      } else {
        const lure = this.lureFor(e);
        if (lure) this.moveToward(e, lure.x, lure.y, speed, dt);
        else this.moveGround(e, speed, dt);
      }
      const moved = Math.hypot(e.x - px, e.y - py);
      if (tr?.grow && moved > 0) this.grow(e, moved);
      if (tr?.slime && moved > 0 && !e.burrowT) this.leaveSlime(e);
      e.vx = (e.x - px) / dt;
      e.vy = (e.y - py) / dt;
      if (Math.abs(e.vx) + Math.abs(e.vy) > 0.01) e.facing = Math.atan2(e.vy, e.vx);
    }
  }

  /** Speed multiplier from an enemy's own traits and states. */
  private traitSpeed(e: Enemy): number {
    let k = 1;
    const tr = e.def.traits;
    if (e.dashT) k *= 2.5;
    if (e.slimeT && !tr?.slime) k *= 1.25;
    if (e.burrowT) k *= 1.5;
    if (tr?.grow) k *= 1 + ((e.scale ?? 1) - 1) * 0.3;
    if (tr?.pack) {
      let n = 0;
      for (const o of this.enemies) if (o !== e && !o.dead && o.def.id === e.def.id && (o.x - e.x) ** 2 + (o.y - e.y) ** 2 < 2.25) n++;
      k *= 1 + 0.1 * Math.min(3, n);
    }
    return k;
  }

  /** Burrowing, illusions, hexes and freezes, dashes. */
  private traitAbility(e: Enemy, dt: number) {
    const tr = e.def.traits!;
    if (tr.burrow) {
      if (e.burrowT && e.burrowT > 0) {
        e.burrowT -= dt;
        // can't come up inside a structure or through the core
        const ti = idx(Math.floor(e.x), Math.floor(e.y));
        if (e.burrowT <= 0 && inBounds(Math.floor(e.x), Math.floor(e.y)) && this.buildingAt[ti]) e.burrowT = 0.1;
        if (e.burrowT <= 0) {
          e.burrowT = 0;
          e.burrowCd = e.def.boss ? 8 : 5.5;
          this.fx('surface', e.x, e.y, { r: e.def.radius });
        }
      } else {
        e.burrowCd = (e.burrowCd ?? 2.5) - dt;
        if (e.burrowCd <= 0 && e.attacking < 0 && e.stunT <= 0) this.burrow(e);
      }
    }
    if (!tr.disable && !tr.decoy && !tr.dash) return;
    e.traitCd = (e.traitCd ?? 2 + this.rng.next() * 2) - dt;
    if (e.traitCd > 0 || e.stunT > 0) return;
    if (tr.disable) {
      const D = tr.disable;
      e.traitCd = D.every;
      const r2 = D.r * D.r;
      const cands = this.buildings.filter((b) => b.def.kind !== 'wall' && b.def.kind !== 'trap' && (b.x + 0.5 - e.x) ** 2 + (b.y + 0.5 - e.y) ** 2 <= r2 && !(D.kind === 'freeze' && b.warm));
      if (!cands.length) {
        e.traitCd = 1;
        return;
      }
      const hit = D.aoe ? cands : [cands.sort((a, b) => (a.x - e.x) ** 2 + (a.y - e.y) ** 2 - ((b.x - e.x) ** 2 + (b.y - e.y) ** 2))[0]];
      for (const b of hit) {
        b.disabledT = Math.max(b.disabledT ?? 0, D.dur);
        b.disabledKind = D.kind;
        this.fx(D.kind, b.x + 0.5, b.y + 0.5, { x2: e.x, y2: e.y });
      }
      if (D.aoe) this.fx(D.kind, e.x, e.y, { r: D.r });
    } else if (tr.decoy) {
      e.traitCd = 6;
      if (e.illusion) return;
      for (let k = 0; k < 2; k++) {
        const m = this.makeEnemy(e.def, e.x + this.rng.range(-0.5, 0.5), e.y + this.rng.range(-0.5, 0.5), 1);
        m.illusion = true;
        m.lifeT = 6;
        m.bounty = 0;
        m.dist = e.dist;
      }
      this.fx('illusion', e.x, e.y);
    } else if (tr.dash) {
      e.traitCd = 7;
      e.dashT = 1;
    }
  }

  private burrow(e: Enemy) {
    e.burrowT = e.def.boss ? 2 : 1.8;
    e.attacking = -1;
    e.hasWp = false;
    this.fx('burrow', e.x, e.y, { r: e.def.radius });
  }

  /** The snowball roller packs on snow as it rolls. */
  private grow(e: Enemy, moved: number) {
    e.rolled = (e.rolled ?? 0) + moved;
    const scale = 1 + Math.min(1.4, e.rolled * 0.07);
    const old = e.scale ?? 1;
    if (scale - old < 0.01) return;
    const add = e.maxHp * (scale / old - 1);
    e.maxHp += add;
    e.hp += add;
    e.scale = scale;
  }

  private leaveSlime(e: Enemy) {
    const x = Math.floor(e.x) + 0.5,
      y = Math.floor(e.y) + 0.5;
    for (const h of this.hazards) if (h.kind === 'slime' && h.x === x && h.y === y) return void (h.t = h.max);
    if (this.hazards.length > 80) return;
    this.hazards.push({ kind: 'slime', x, y, r: 0.55, t: 4, max: 4, dps: 0, slow: 0, src: -1 });
  }

  /** The nearest active will-o'-wisp a lesser ground foe is drawn to, if any. */
  private lureFor(e: Enemy): Lure | null {
    if (!this.lures.length || e.def.boss || e.burrowT || e.confT) return null;
    for (const l of this.lures) if ((l.x - e.x) ** 2 + (l.y - e.y) ** 2 <= l.r * l.r) return l;
    return null;
  }

  /** Walk straight at a point, as far as open ground allows. */
  private moveToward(e: Enemy, x: number, y: number, speed: number, dt: number) {
    const dx = x - e.x,
      dy = y - e.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.15) return;
    const st = Math.min(d, speed * dt);
    const nx = e.x + (dx / d) * st,
      ny = e.y + (dy / d) * st;
    if (this.walkable(nx, ny)) {
      e.x = nx;
      e.y = ny;
    } else if (this.walkable(nx, e.y)) e.x = nx;
    else if (this.walkable(e.x, ny)) e.y = ny;
    e.hasWp = false;
  }

  private coreRectDist(x: number, y: number): number {
    const dx = Math.max(CORE_X - 1 - x, 0, x - (CORE_X + 2));
    const dy = Math.max(CORE_Y - 1 - y, 0, y - (CORE_Y + 2));
    return Math.hypot(dx, dy);
  }

  private moveGround(e: Enemy, speed: number, dt: number) {
    if (this.coreRectDist(e.x, e.y) < e.def.radius + 0.08) {
      e.dist = 0;
      this.reachCore(e);
      return;
    }
    const tx = Math.floor(e.x),
      ty = Math.floor(e.y);
    const tunnels = !!e.def.traits?.burrow;
    let field = tunnels ? this.flowT : e.def.breaker ? this.flowB : this.flowG;
    const ti = inBounds(tx, ty) ? idx(tx, ty) : -1;
    if (ti >= 0 && field[ti] >= INF) field = this.flowB;
    e.dist = ti >= 0 ? field[ti] : 999;

    if (!e.hasWp) this.pickWaypoint(e, field, !!e.confT);

    let gx: number, gy: number;
    if (e.wx < 0) {
      // adjacent to core: walk straight at it
      gx = CORE_X + 0.5;
      gy = CORE_Y + 0.5;
    } else {
      gx = e.wx + 0.5 + e.jx;
      gy = e.wy + 0.5 + e.jy;
      const bu = this.buildingAt[idx(e.wx, e.wy)];
      if (bu && !e.burrowT) {
        const b = this.byUid.get(bu)!;
        // burrowers tunnel under structures instead of fighting them
        if (b.def.blocks && tunnels) {
          this.burrow(e);
          return;
        }
        if (b.def.blocks) {
          const d = Math.hypot(e.wx + 0.5 - e.x, e.wy + 0.5 - e.y);
          if (d < 0.55 + e.def.radius) {
            e.attacking = b.uid;
            return;
          }
          gx = e.wx + 0.5;
          gy = e.wy + 0.5;
        }
      }
    }
    const dx = gx - e.x,
      dy = gy - e.y;
    const d = Math.hypot(dx, dy);
    const step = speed * dt;
    if (d <= step || d < 0.04) {
      e.x = gx;
      e.y = gy;
      e.hasWp = false;
    } else {
      e.x += (dx / d) * step;
      e.y += (dy / d) * step;
    }
  }

  private pickWaypoint(e: Enemy, field: Float32Array, reverse = false) {
    const x = Math.floor(e.x),
      y = Math.floor(e.y);
    e.hasWp = true;
    if (!inBounds(x, y)) {
      e.wx = Math.max(0, Math.min(MAP_W - 1, x));
      e.wy = Math.max(0, Math.min(MAP_H - 1, y));
      return;
    }
    const pass =
      field === this.flowT
        ? (i: number) => this.flowT[i] < INF
        : field === this.flowB
          ? (i: number) => this.breakerCost(i) < INF
          : (i: number) => this.groundCost(i) < INF;
    // dazed foes stumble uphill: back the way they came
    const better = (v: number, b: number) => (reverse ? v > b && v < INF : v < b);
    let best = field[idx(x, y)];
    let bx = -2,
      by = -2;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx,
        ny = y + dy;
      if (!inBounds(nx, ny)) continue;
      if (isCoreTile(nx, ny) && !reverse) {
        e.wx = -1;
        e.wy = -1;
        return;
      }
      const ni = idx(nx, ny);
      if (!pass(ni)) continue;
      if (dx && dy && (!pass(idx(x + dx, y)) || !pass(idx(x, y + dy)))) continue;
      if (better(field[ni], best)) {
        best = field[ni];
        bx = nx;
        by = ny;
      }
    }
    if (bx === -2) {
      // stuck (e.g. standing on a tile that just got blocked): head for tile center
      e.wx = x;
      e.wy = y;
    } else {
      e.wx = bx;
      e.wy = by;
    }
  }

  /** Regular enemies dive into the Beacon and burn out; bosses stay and pound on it. */
  private reachCore(e: Enemy) {
    if (e.illusion) {
      e.dead = true; // a mirage's illusion just fades against the core
      this.fx('illusion', e.x, e.y);
      return;
    }
    e.burrowT = 0;
    if (e.def.boss) {
      e.attacking = 0;
      return;
    }
    e.dead = true;
    this.hurtCore(e.def.leak * (1 + (this.wave - 1) * 0.03) * (e.hp / e.maxHp > 0.5 ? 1 : 0.6), e.x, e.y);
    this.events.push({ type: 'die', x: e.x, y: e.y, enemy: e.def.id, big: false });
  }

  private hurtCore(dmg: number, x: number, y: number) {
    this.coreHp -= dmg;
    this.coreHurt = 0.3;
    this.stats.leaked += dmg;
    this.events.push({ type: 'coreHit', x, y, dmg });
    if (this.sandbox && this.coreHp <= 0) {
      this.coreHp = this.coreMaxHp; // the sandbox Beacon rekindles instead of falling
      return;
    }
    if (this.coreHp <= 0 && !this.over) {
      this.coreHp = 0;
      this.over = true;
      this.won = false;
      this.events.push({ type: 'defeat' });
    }
  }

  private enemyAttack(e: Enemy, dt: number) {
    if (e.attacking > 0 && !this.byUid.has(e.attacking)) {
      e.attacking = -1;
      e.hasWp = false;
      return;
    }
    e.attackCd -= dt;
    if (e.attackCd > 0) return;
    e.attackCd = 1 / e.def.attackRate;
    const dmg = e.def.damage * (1 + (this.wave - 1) * 0.04);
    if (e.attacking === 0) {
      this.hurtCore(dmg, e.x, e.y);
    } else {
      const b = this.byUid.get(e.attacking)!;
      const bomb = e.def.traits?.bomb;
      if (bomb) {
        // firebugs burst against the first structure they reach
        for (const o of [...this.buildings])
          if ((o.x + 0.5 - e.x) ** 2 + (o.y + 0.5 - e.y) ** 2 <= (bomb + 0.5) ** 2) this.damageBuilding(o, dmg * (o === b ? 1 : 0.5));
        this.fx('bomb', e.x, e.y, { r: bomb });
        this.events.push({ type: 'explode', x: e.x, y: e.y, r: bomb, color: '#ff8a3a' });
        this.weather.igniteAt(e.x, e.y, 1);
        e.dead = true;
        return;
      }
      this.damageBuilding(b, dmg * (e.def.breaker ? 1.5 : 1));
      this.events.push({ type: 'hit', x: b.x + 0.5, y: b.y + 0.5, color: '#ffcf8a' });
      // living hedges prick back; ice walls numb the claws that scrape them
      const L = b.def.levels[b.level];
      if (b.def.id === 'hedge' && L.damage) this.damageEnemy(e, L.damage, 99, b.uid);
      if (b.def.id === 'icewall' && L.slow) {
        e.slowT = 1.5;
        e.slowAmt = L.slow;
      }
    }
  }

  damageBuilding(b: Building, dmg: number) {
    if (!this.byUid.has(b.uid)) return;
    b.hp -= dmg;
    b.hurt = 0.2;
    if (b.hp <= 0) {
      this.stats.lost++;
      this.events.push({ type: 'destroyed', x: b.x + 0.5, y: b.y + 0.5, id: b.def.id });
      this.removeBuilding(b);
    }
  }

  private enemyAbility(e: Enemy) {
    switch (e.def.role) {
      case 'healer': {
        e.abilityCd = 1.2;
        let any = false;
        for (const o of this.enemies) {
          if (o === e || o.dead) continue;
          if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 < 2.3 * 2.3 && o.hp < o.maxHp) {
            o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.06);
            any = true;
          }
        }
        if (any) this.events.push({ type: 'heal', x: e.x, y: e.y });
        break;
      }
      case 'bossGround':
      case 'bossAir': {
        const sp = e.def.spawns!;
        e.abilityCd = sp.every ?? 7;
        if (e.attacking >= 0) break; // no summoning while pounding the core
        for (let i = 0; i < sp.n; i++) this.spawnMinion(sp.id, e);
        break;
      }
      default:
        e.abilityCd = 99;
    }
  }

  private spawnMinion(id: EnemyId, from: Enemy) {
    const def = ENEMIES[id];
    const hp = def.hp * hpScale(this.wave) * this.hpMul * 0.8;
    const m = this.makeEnemy(def, from.x, from.y, hp);
    m.bounty *= 0.5;
    this.events.push({ type: 'spawn', x: m.x, y: m.y });
  }

  /** Can this foe be harmed right now? Underground, collapsed or carried foes can't; ghosts only where revealed. */
  hittable(e: Enemy, force = false): boolean {
    if (e.dead || (e.burrowT ?? 0) > 0 || (e.reviveT ?? 0) > 0) return false;
    return force || !e.def.traits?.ethereal || this.revealed(e);
  }

  /** Apply damage. `pierce` ignores that much armor. Returns damage dealt. `force` reaches unrevealed ghosts (salt). */
  damageEnemy(e: Enemy, amount: number, pierce: number, src: number, continuous = false, force = false): number {
    if (!this.hittable(e, force)) return 0;
    if (e.illusion) amount = e.hp + 1; // illusions pop at the first touch
    const shellArmor = (e.shellT ?? 0) > 0 ? 20 : 0;
    const armor = Math.max(0, e.def.armor - (e.shred ?? 0) + shellArmor - pierce);
    amount *= (e.curseT ? 2 : 1) * (e.frozenT ? 1.5 : 1) * (1 + (e.hexed ?? 0));
    let dmg: number;
    if (continuous) dmg = amount * (1 - Math.min(0.5, armor / 20));
    else dmg = Math.max(amount * 0.25, amount - armor);
    e.hp -= dmg;
    if (!continuous) e.hit = 0.12;
    // the armoured snail pulls into its shell once when badly hurt
    if (e.def.traits?.shell && !e.shellUsed && e.hp > 0 && e.hp < e.maxHp * 0.5) {
      e.shellUsed = true;
      e.shellT = 3;
      this.fx('shell', e.x, e.y);
    }
    if (src > 0) {
      const b = this.byUid.get(src);
      if (b) b.dealt += dmg;
    }
    if (e.hp <= 0) this.kill(e, src);
    return dmg;
  }

  private kill(e: Enemy, src: number) {
    if (e.illusion) {
      e.dead = true;
      this.fx('illusion', e.x, e.y);
      return;
    }
    const tr = e.def.traits;
    // skeletons collapse and reassemble; the phoenix is reborn from its egg (once)
    if (tr?.revive && !e.revived) {
      e.revived = true;
      e.reviveT = e.def.boss ? 3 : 2.2;
      e.hp = 0;
      e.attacking = -1;
      e.burnT = e.poisonT = 0;
      this.fx('revive', e.x, e.y, { r: e.def.radius });
      return;
    }
    e.dead = true;
    this.stats.kills++;
    if (e.def.boss) this.stats.bossKills++;
    const bounty = Math.max(1, Math.round(e.bounty * (1 + (e.greed ?? 0))));
    this.money += bounty;
    this.stats.earned += bounty;
    this.events.push({ type: 'die', x: e.x, y: e.y, enemy: e.def.id, big: !!e.def.boss || e.def.radius > 0.35 });
    this.events.push({ type: 'bounty', x: e.x, y: e.y - 0.3, amount: bounty });
    if (src > 0) {
      const b = this.byUid.get(src);
      if (b) b.kills++;
    }
    if (e.burnT > 0) this.weather.igniteAt(e.x, e.y, 0.35); // burning foes fall into dry grass
    // toadstool spores spread from a poisoned body to its neighbours
    if (e.poisonT && e.poisonT > 0 && e.poison) {
      for (const o of this.enemies)
        if (o !== e && !o.dead && !o.def.flying && (o.x - e.x) ** 2 + (o.y - e.y) ** 2 < 2.25) {
          o.poison = Math.max(o.poison ?? 0, e.poison);
          o.poisonT = Math.max(o.poisonT ?? 0, 3);
        }
      this.fx('puff', e.x, e.y, { r: 1.5, color: '#c86cff' });
    }
    if (tr?.deathSpawn) {
      const sd = ENEMIES[tr.deathSpawn.id];
      for (let i = 0; i < tr.deathSpawn.n; i++) this.makeEnemy(sd, e.x, e.y, sd.hp * hpScale(this.wave) * this.hpMul).bounty *= 0.5;
    }
    // the Reanimator Coil raises what it kills
    const sb = src > 0 ? this.byUid.get(src) : undefined;
    if (sb?.def.id === 'reanimator' && !e.def.boss && !e.def.flying && this.allies.filter((a) => a.kind === 'zombie').length < 8) this.raiseZombie(e, sb);
    if (e.def.role === 'splitter' && e.def.spawns) {
      const sd = ENEMIES[e.def.spawns.id];
      for (let i = 0; i < e.def.spawns.n; i++) {
        const s = this.makeEnemy(sd, e.x, e.y, sd.hp * hpScale(this.wave) * this.hpMul);
        s.bounty *= 0.5;
      }
    }
  }


  // ---------------------------------------------------------------- seasonal mechanics

  fx(kind: FxKind, x: number, y: number, o: { x2?: number; y2?: number; r?: number; pts?: { x: number; y: number }[]; color?: string } = {}) {
    this.events.push({ type: 'fx', kind, x, y, ...o });
  }

  /** Places where ghosts can be seen (and so hit): candles, spirit lanterns, will-o'-wisps, near the core. */
  private revealers: { x: number; y: number; r: number }[] = [];

  revealed(e: Enemy): boolean {
    for (const v of this.revealers) if ((e.x - v.x) ** 2 + (e.y - v.y) ** 2 <= v.r * v.r) return true;
    return false;
  }

  /** Per-step auras: what reveals ghosts, spirit-lantern curses, brazier warmth, sundial and hex timers. */
  private prepareAuras(dt: number) {
    const cx = CORE_X + 0.5,
      cy = CORE_Y + 0.5;
    this.revealers = [{ x: cx, y: cy, r: 2.8 }];
    for (const l of this.lures) this.revealers.push({ x: l.x, y: l.y, r: 3 });
    const lanterns: { x: number; y: number; r: number; k: number }[] = [];
    const braziers: { x: number; y: number; r: number }[] = [];
    for (const b of this.buildings) {
      const L = b.def.levels[b.level];
      if (b.noonT) b.noonT = Math.max(0, b.noonT - dt);
      if ((b.disabledT ?? 0) > 0) continue;
      if (L.reveal) this.revealers.push({ x: b.x + 0.5, y: b.y + 0.5, r: L.reveal });
      if (b.def.id === 'spiritlantern') lanterns.push({ x: b.x + 0.5, y: b.y + 0.5, r: L.range!, k: L.buff! });
      if (b.def.id === 'brazier') braziers.push({ x: b.x + 0.5, y: b.y + 0.5, r: L.range! });
    }
    for (const e of this.enemies) {
      if (e.def.traits?.ethereal) e.veiled = !this.revealed(e);
      e.hexed = 0;
      for (const l of lanterns) if ((e.x - l.x) ** 2 + (e.y - l.y) ** 2 <= l.r * l.r) e.hexed = Math.max(e.hexed, l.k);
    }
    for (const b of this.buildings) {
      const bx = b.x + 0.5,
        by = b.y + 0.5;
      b.warm = braziers.some((w) => (w.x - bx) ** 2 + (w.y - by) ** 2 <= w.r * w.r);
      if (!b.disabledT) continue;
      // warmth thaws frozen structures; a spirit lantern lifts hexes
      const cleanse = b.disabledKind === 'freeze' ? b.warm : lanterns.some((l) => (l.x - bx) ** 2 + (l.y - by) ** 2 <= l.r * l.r);
      if (cleanse) {
        b.disabledT = 0;
        this.fx('thaw', bx, by);
      }
    }
  }

  /** Follow the flow field uphill (away from the core, back toward the rifts) for `dist` tiles. */
  private uphill(x: number, y: number, dist: number, field = this.flowG): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    let tx = Math.floor(x),
      ty = Math.floor(y);
    if (!inBounds(tx, ty)) return pts;
    let left = dist;
    while (left > 0) {
      const cur = field[idx(tx, ty)];
      let best = cur,
        bx = -1,
        by = -1;
      for (const [dx, dy] of DIRS) {
        const nx = tx + dx,
          ny = ty + dy;
        if (!inBounds(nx, ny)) continue;
        const v = field[idx(nx, ny)];
        if (v >= INF || v <= best || this.groundCost(idx(nx, ny)) >= INF) continue;
        if (dx && dy && (this.groundCost(idx(tx + dx, ty)) >= INF || this.groundCost(idx(tx, ty + dy)) >= INF)) continue;
        best = v;
        bx = nx;
        by = ny;
      }
      if (bx < 0) break;
      left -= Math.hypot(bx - tx, by - ty);
      tx = bx;
      ty = by;
      pts.push({ x: tx + 0.5, y: ty + 0.5 });
    }
    return pts;
  }

  /** The live enemy trails (rift → core), cached until the flow field or the open rifts change. */
  private trailCache: { v: number; n: number; trails: { x: number; y: number }[][] } = { v: -1, n: -1, trails: [] };
  private trails(): { x: number; y: number }[][] {
    const n = this.activeRifts().length;
    if (this.trailCache.v !== this.flowVersion || this.trailCache.n !== n)
      this.trailCache = { v: this.flowVersion, n, trails: this.activeRifts().map((r) => this.tracePath(r.x, r.y)) };
    return this.trailCache.trails;
  }

  /**
   * Back along the real enemy trail: from the trail point nearest (x,y), the points leading back to its rift,
   * nearest first, up to `dist` tiles (and within `near` tiles of the start, else nothing).
   */
  trailBack(x: number, y: number, dist: number, near = 3): { x: number; y: number }[] {
    let best: { x: number; y: number }[] | null = null,
      bi = 0,
      bd = near * near;
    for (const tr of this.trails())
      for (let i = 0; i < tr.length; i++) {
        const d = (tr[i].x - x) ** 2 + (tr[i].y - y) ** 2;
        if (d < bd) {
          bd = d;
          best = tr;
          bi = i;
        }
      }
    if (!best) return [];
    const out: { x: number; y: number }[] = [];
    let left = dist;
    for (let i = bi; i >= 0 && left > 0; i--) {
      if (out.length) left -= Math.hypot(best[i].x - out[out.length - 1].x, best[i].y - out[out.length - 1].y);
      out.push(best[i]);
    }
    return out;
  }

  /** Drag a foe back along its path (harpoons, whirlwinds, trampling). */
  pushBack(e: Enemy, dist: number) {
    if (e.def.boss) dist *= 0.3;
    if (e.def.flying) {
      const a = Math.atan2(e.y - CORE_Y - 0.5, e.x - CORE_X - 0.5);
      e.x = Math.max(-1, Math.min(MAP_W + 1, e.x + Math.cos(a) * dist));
      e.y = Math.max(-1, Math.min(MAP_H + 1, e.y + Math.sin(a) * dist));
      return;
    }
    let pts = this.trailBack(e.x, e.y, dist + 0.5, 2);
    if (pts.length < 2) pts = this.uphill(e.x, e.y, dist, e.def.breaker ? this.flowB : this.flowG);
    if (!pts.length) return;
    const p = pts[pts.length - 1];
    e.x = p.x + e.jx * 0.5;
    e.y = p.y + e.jy * 0.5;
    e.hasWp = false;
    e.attacking = -1;
  }

  /** The cluster of foes worth aiming at: the point with the most foes within `r` (bosses count extra). */
  bestCluster(r: number, ground = false): { x: number; y: number; score: number } | null {
    let best: { x: number; y: number; score: number } | null = null;
    for (const c of this.enemies) {
      if (c.dead || (ground && c.def.flying) || !this.hittable(c)) continue;
      let n = 0;
      for (const o of this.enemies) if (!o.dead && (o.x - c.x) ** 2 + (o.y - c.y) ** 2 <= r * r) n += o.def.boss ? 5 : 1;
      if (!best || n > best.score) best = { x: c.x, y: c.y, score: n };
    }
    return best;
  }

  /** Aimed core powers (the seasonal campaigns): cast at a point. */
  cast(x: number, y: number): boolean {
    if (this.novaCd > 0 || this.over || !this.R.aimed) return false;
    this.novaCd = this.sandbox ? 5 : this.R.abilityCooldown;
    const N = this.core.nova,
      r = this.R.abilityRadius;
    this.fx('cast', x, y, { r });
    this.weather.clearFog(x, y, r);
    switch (this.R.ability) {
      case 'vines':
        // roots burst from the ground and hold every walking foe
        for (const e of this.enemies) {
          if (e.dead || (e.x - x) ** 2 + (e.y - y) ** 2 > (r + e.def.radius) ** 2) continue;
          this.damageEnemy(e, N * (e.def.flying ? 0.3 : 0.6), 99, -1);
          if (!e.def.flying) e.stunT = Math.max(e.stunT, this.R.abilityStun * (e.def.boss ? 0.35 : 1));
        }
        this.fx('vines', x, y, { r });
        break;
      case 'sunstrike':
        this.strikes.push({ x, y, targetUid: 0, t: 0.9, damage: N * 1.3, splash: r, src: -1, kind: 'sunstrike' });
        this.events.push({ type: 'strikeWarn', x, y, r });
        break;
      case 'lure':
        this.lures.push({ x, y, r, t: 6, dps: N * 0.12 });
        this.fx('lure', x, y, { r });
        break;
      case 'comet':
        this.strikes.push({ x, y, targetUid: 0, t: 1.0, damage: N, splash: r, src: -1, kind: 'comet' });
        this.events.push({ type: 'strikeWarn', x, y, r });
        break;
    }
    return true;
  }

  /** Unleash a primed avalanche ledge on the foes below it. */
  trigger(b: Building): boolean {
    if (b.def.id !== 'avalanche' || (b.prime ?? 0) < 1 || this.over) return false;
    const L = b.def.levels[b.level];
    const bx = b.x + 0.5,
      by = b.y + 0.5;
    // aim at the most crowded spot of the trail within reach
    let ax = bx,
      ay = by,
      bs = -1;
    for (const e of this.enemies) {
      if (e.dead || e.def.flying || (e.x - bx) ** 2 + (e.y - by) ** 2 > L.range! ** 2) continue;
      let n = 0;
      for (const o of this.enemies) if (!o.dead && !o.def.flying && (o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= L.splash! ** 2) n++;
      if (n > bs) {
        bs = n;
        ax = e.x;
        ay = e.y;
      }
    }
    if (bs < 0) {
      const p = this.trailBack(bx, by, 0.1, L.range!);
      if (p.length) [ax, ay] = [p[p.length - 1].x, p[p.length - 1].y];
    }
    b.prime = 0;
    b.firing = 1;
    for (const e of this.enemies) {
      if (e.dead || e.def.flying || (e.x - ax) ** 2 + (e.y - ay) ** 2 > (L.splash! + e.def.radius) ** 2) continue;
      this.damageEnemy(e, L.damage!, 6, b.uid);
      e.stunT = Math.max(e.stunT, L.stun! * (e.def.boss ? 0.35 : 1));
    }
    this.fx('avalanche', ax, ay, { r: L.splash!, x2: bx, y2: by });
    return true;
  }

  private raiseZombie(e: Enemy, src: Building) {
    const L = src.def.levels[src.level];
    const path = this.routeFrom(e.x, e.y);
    this.allies.push({
      uid: this.uidSeq++,
      kind: 'zombie',
      x: e.x,
      y: e.y,
      hp: e.maxHp * (0.4 + src.level * 0.1),
      maxHp: e.maxHp * (0.4 + src.level * 0.1),
      dmg: L.damage! * 0.5,
      speed: 0.9,
      life: L.duration!,
      facing: Math.PI,
      path,
      pi: path.length - 1,
      src: src.uid,
    });
    this.fx('raise', e.x, e.y);
  }

  /** A route from a point back toward the rifts (allies walk it). */
  /** A route from a point back toward the rifts along the real enemy trail (allies walk it, nearest point last). */
  private routeFrom(x: number, y: number): { x: number; y: number }[] {
    return this.trailBack(x, y, 60, 4).reverse();
  }

  private updateAllies(dt: number) {
    for (const a of this.allies) {
      a.life -= dt;
      if (a.busy) a.busy = Math.max(0, a.busy - dt);
      if (a.kind === 'zombie') {
        // shamble back toward the rifts, brawling with whatever it meets
        let foe: Enemy | null = null,
          fd = 1.1 * 1.1;
        for (const e of this.enemies) {
          if (e.dead || e.def.flying || !this.hittable(e)) continue;
          const d2 = (e.x - a.x) ** 2 + (e.y - a.y) ** 2;
          if (d2 < fd) {
            fd = d2;
            foe = e;
          }
        }
        if (foe && fd < 0.5 * 0.5) {
          a.busy = 0.3;
          this.damageEnemy(foe, a.dmg * dt, 2, a.src, true);
          a.hp -= foe.def.damage * 0.6 * dt;
          a.facing = Math.atan2(foe.y - a.y, foe.x - a.x);
          if (!foe.def.boss) foe.stunT = Math.max(foe.stunT, 0.05); // held in a grapple
        } else if (foe) this.allyStep(a, foe.x, foe.y, dt);
        else if (a.pi >= 0 && a.path.length) {
          const p = a.path[a.pi];
          if (this.allyStep(a, p.x, p.y, dt)) a.pi--;
        } else a.life = Math.min(a.life, 1);
        continue;
      }
      // the mammoth charges down the trail, trampling and tossing foes, then plods home
      const target = a.home ? { x: a.hx!, y: a.hy! } : a.pi >= 0 ? a.path[a.pi] : null;
      if (!target) {
        a.home = true;
        continue;
      }
      if (this.allyStep(a, target.x, target.y, dt)) {
        if (a.home) a.life = 0;
        else {
          a.pi--;
          a.left! -= 1;
          if (a.left! <= 0 || a.pi < 0) {
            a.home = true;
            a.speed *= 0.6;
          }
        }
      }
      if (a.home) continue;
      for (const e of this.enemies) {
        if (e.dead || e.def.flying || a.hits!.includes(e.uid) || (e.x - a.x) ** 2 + (e.y - a.y) ** 2 > (0.55 + e.def.radius) ** 2) continue;
        a.hits!.push(e.uid);
        a.busy = 0.25;
        this.damageEnemy(e, a.dmg, 4, a.src);
        if (!e.dead) {
          this.pushBack(e, a.push!);
          e.stunT = Math.max(e.stunT, 0.6);
        }
        this.events.push({ type: 'hit', x: e.x, y: e.y, color: '#e8d0a0' });
      }
    }
  }

  /** Move an ally toward a point; true once it arrives. */
  private allyStep(a: Ally, x: number, y: number, dt: number): boolean {
    const dx = x - a.x,
      dy = y - a.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.08) return true;
    const st = Math.min(d, a.speed * dt);
    a.x += (dx / d) * st;
    a.y += (dy / d) * st;
    a.facing = Math.atan2(dy, dx);
    return d <= st + 0.02;
  }

  private updateHazards(dt: number) {
    if (!this.hazards.length) return;
    for (const h of this.hazards) {
      h.t -= dt;
      if (h.kind === 'warm') {
        // embers of the hearth comet thaw structures
        for (const b of this.buildings)
          if (b.disabledKind === 'freeze' && b.disabledT && (b.x + 0.5 - h.x) ** 2 + (b.y + 0.5 - h.y) ** 2 <= h.r * h.r) b.disabledT = 0;
      }
      for (const e of this.enemies) {
        if (e.dead || e.def.flying || (e.x - h.x) ** 2 + (e.y - h.y) ** 2 > (h.r + e.def.radius * 0.5) ** 2) continue;
        if (h.kind === 'slime') {
          e.slimeT = 0.3;
          continue;
        }
        if (h.dps) this.damageEnemy(e, h.dps * dt, 99, h.src, true);
        if (h.slow) e.slow = Math.max(e.slow, h.slow);
        if (h.kind === 'fire' || h.kind === 'warm') {
          e.burn = Math.max(e.burn, h.dps * 0.3);
          e.burnT = Math.max(e.burnT, 1);
        }
      }
    }
    this.hazards = this.hazards.filter((h) => h.t > 0);
  }

  private updateLures(dt: number) {
    if (!this.lures.length) return;
    for (const l of this.lures) {
      l.t -= dt;
      for (const e of this.enemies)
        if (!e.dead && (e.x - l.x) ** 2 + (e.y - l.y) ** 2 <= 1.1 * 1.1) {
          this.damageEnemy(e, l.dps * dt, 99, -1, true);
          e.burn = Math.max(e.burn, l.dps * 0.2);
          e.burnT = Math.max(e.burnT, 1);
        }
    }
    this.lures = this.lures.filter((l) => l.t > 0);
  }

  // ---------------------------------------------------------------- buildings

  private canHit(targets: string, e: Enemy): boolean {
    if (targets === 'both') return true;
    if (targets === 'ground') return !e.def.flying;
    if (targets === 'air') return e.def.flying;
    return false;
  }

  private findTarget(
    x: number,
    y: number,
    range: number,
    targets: string,
    mode: TargetMode,
    minRange = 0,
    preferAir = false,
  ): Enemy | null {
    let best: Enemy | null = null;
    let bestScore = -Infinity;
    const r2 = range * range,
      m2 = minRange * minRange;
    for (const e of this.enemies) {
      if (e.dead || e.age < 0.15) continue;
      if (!this.canHit(targets, e) || !this.hittable(e)) continue;
      const d2 = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d2 < m2) continue;
      if (d2 > r2 && !this.weather.rangeFx) continue;
      if (!this.inReach(x, y, e, range, d2)) continue;
      let s: number;
      switch (mode) {
        case 'first':
          s = -e.dist;
          break;
        case 'last':
          s = e.dist;
          break;
        case 'strong':
          s = e.hp;
          break;
        default:
          s = -d2;
      }
      if (preferAir && e.def.flying) s += 1e6;
      if (s > bestScore) {
        bestScore = s;
        best = e;
      }
    }
    return best;
  }

  /** Can a tower at (x,y) with this range see and reach the foe, given the weather? */
  private inReach(x: number, y: number, e: Enemy, range: number, d2 = (e.x - x) ** 2 + (e.y - y) ** 2): boolean {
    const W = this.weather;
    if (W.rangeFx) {
      const r = range * W.rangeMulDir(Math.atan2(e.y - y, e.x - x));
      if (d2 > r * r) return false;
    } else if (d2 > range * range) return false;
    return d2 <= VEIL_REACH * VEIL_REACH || !W.veiled(e);
  }

  /** Fountains (and lightning overcharge) quicken towers: recompute every tower's attack-speed bonus. */
  private applyBuffs() {
    for (const b of this.buildings) b.buff = 0;
    for (const f of this.buildings) {
      if (f.def.id !== 'fountain') continue;
      const L = f.def.levels[f.level];
      const r2 = L.range! * L.range!;
      for (const b of this.buildings) {
        if (b === f || b.def.kind !== 'tower') continue;
        if ((b.x - f.x) ** 2 + (b.y - f.y) ** 2 <= r2) b.buff = Math.max(b.buff, L.buff!);
      }
    }
    for (const b of this.buildings) {
      if (b.charge && b.charge > 0) b.buff += OVERCHARGE_BONUS;
      if (b.noonT && b.noonT > 0) b.buff += b.noonBuff ?? 0;
    }
  }

  /** Is a ground unit allowed to stand at this point? (used by knockback) */
  private walkable(x: number, y: number): boolean {
    const tx = Math.floor(x),
      ty = Math.floor(y);
    if (!inBounds(tx, ty) || isCoreTile(tx, ty)) return false;
    return this.groundCost(idx(tx, ty)) < INF;
  }

  private updateBuildings(dt: number) {
    this.applyBuffs();
    for (const b of this.buildings) {
      const L = b.def.levels[b.level];
      if (b.charge && b.charge > 0) b.charge = Math.max(0, b.charge - dt);
      // living hedges regrow; avalanche ledges gather snow
      if (L.heal && b.def.kind === 'wall' && b.hp < b.maxHp) b.hp = Math.min(b.maxHp, b.hp + L.heal * dt);
      if (b.def.id === 'avalanche') b.prime = Math.min(1, (b.prime ?? 0) + dt / L.charge!);
      if (b.disabledT && b.disabledT > 0) {
        // frozen or hexed: does nothing until it wears off
        b.disabledT = Math.max(0, b.disabledT - dt);
        b.firing = 0;
        continue;
      }
      const bx = b.x + 0.5,
        by = b.y + 0.5;
      if (b.cd > 0) b.cd -= dt * (1 + b.buff);
      if (b.firing > 0) b.firing -= dt;
      if (b.recoil > 0) b.recoil = Math.max(0, b.recoil - dt * 4);
      if (b.hurt > 0) b.hurt -= dt;

      if (b.def.realm !== 'night' && b.def.realm !== 'day') {
        this.seasonBuilding(b, L, bx, by, dt);
        continue;
      }
      switch (b.def.id) {
        // ================================================================== day structures
        case 'javelin': {
          if (b.cd > 0) break;
          const t = this.findTarget(bx, by, L.range!, 'both', b.mode);
          if (!t) break;
          b.angle = Math.atan2(t.y - by, t.x - bx);
          b.cd = 1 / L.rate!;
          b.recoil = 1;
          const p = this.fireProjectile('javelin', b, t, L.damage!, 0, 15, '#ffe2a0');
          // flies straight along the aim line, through up to `pierce` foes
          p.vx = Math.cos(b.angle) * 15;
          p.vy = Math.sin(b.angle) * 15;
          p.flight = L.range! + 1.5;
          p.hits = [];
          p.pierceLeft = L.pierce!;
          break;
        }
        case 'glyph': {
          if (b.cd > 0) break;
          const on = this.enemies.some((e) => !e.dead && !e.def.flying && Math.abs(e.x - bx) < 0.55 && Math.abs(e.y - by) < 0.55);
          if (!on) break;
          b.cd = 1 / L.rate!;
          b.firing = 0.35;
          this.explode(bx, by, L.splash!, L.damage!, 6, b.uid, false, true, '#ffd76a');
          this.events.push({ type: 'shoot', kind: 'glyph', x: bx, y: by, tx: bx, ty: by });
          break;
        }
        case 'bell': {
          if (b.cd > 0) break;
          const r2 = L.range! * L.range!;
          const near = this.enemies.filter((e) => !e.dead && e.age > 0.15 && (e.x - bx) ** 2 + (e.y - by) ** 2 <= r2 * 2.5 && this.inReach(bx, by, e, L.range!));
          if (!near.length) break;
          b.cd = 1 / L.rate!;
          b.firing = 0.4;
          b.recoil = 1;
          for (const e of near) this.damageEnemy(e, L.damage!, 3, b.uid);
          this.events.push({ type: 'pulse', x: bx, y: by, r: L.range!, color: b.def.color });
          this.events.push({ type: 'shoot', kind: 'bell', x: bx, y: by, tx: bx, ty: by });
          break;
        }
        case 'windcatcher': {
          if (b.cd > 0) break;
          const t = this.findTarget(bx, by, L.range!, 'ground', b.mode);
          if (!t) break;
          b.cd = 1 / L.rate!;
          b.firing = 0.3;
          b.angle = Math.atan2(t.y - by, t.x - bx);
          // blow the target away from the tower, as far as open ground allows
          const d = Math.hypot(t.x - bx, t.y - by) || 1;
          const ux = (t.x - bx) / d,
            uy = (t.y - by) / d;
          const push = L.push! * (t.def.boss ? 0.35 : 1);
          for (let k = push; k > 0.05; k -= 0.2) {
            const nx = t.x + ux * k,
              ny = t.y + uy * k;
            if (this.walkable(nx, ny)) {
              this.events.push({ type: 'gust', x: bx, y: by, tx: nx, ty: ny });
              t.x = nx;
              t.y = ny;
              t.hasWp = false;
              t.attacking = -1;
              break;
            }
          }
          this.damageEnemy(t, L.damage!, 0, b.uid);
          this.events.push({ type: 'shoot', kind: 'windcatcher', x: bx, y: by, tx: t.x, ty: t.y });
          break;
        }
        case 'snare': {
          if (b.cd > 0) break;
          const caught = this.enemies.filter((e) => !e.dead && !e.def.flying && Math.abs(e.x - bx) < 0.55 && Math.abs(e.y - by) < 0.55);
          if (!caught.length) break;
          b.cd = 1 / L.rate!;
          b.firing = 1 / L.rate!; // render hint: drained while recharging
          for (const e of caught) {
            e.stunT = Math.max(e.stunT, L.stun! * (e.def.boss ? 0.3 : 1));
            if (L.damage) this.damageEnemy(e, L.damage, 99, b.uid);
          }
          this.events.push({ type: 'snare', x: bx, y: by });
          break;
        }
        case 'halo': {
          b.spin += dt * 2.4 * (1 + b.buff);
          const r = L.range!;
          let any = false;
          for (const e of this.enemies) {
            if (e.dead) continue;
            const d = Math.hypot(e.x - bx, e.y - by);
            if (d > r + e.def.radius || d < 0.35) continue;
            this.damageEnemy(e, L.damage! * dt * (1 + b.buff), 2, b.uid, true);
            any = true;
          }
          if (any) {
            b.firing = 0.1;
            if (b.cd <= 0) {
              b.cd = 0.45;
              this.events.push({ type: 'shoot', kind: 'halo', x: bx, y: by, tx: bx, ty: by });
            }
          }
          break;
        }
        case 'fountain': {
          b.spin += dt;
          const r2 = L.range! ** 2;
          for (const o of this.buildings) {
            if (o === b || o.hp >= o.maxHp) continue;
            if ((o.x - b.x) ** 2 + (o.y - b.y) ** 2 > r2) continue;
            o.hp = Math.min(o.maxHp, o.hp + L.heal! * dt);
          }
          if (this.coreRectDist(bx, by) <= L.range! && this.coreHp < this.coreMaxHp) this.coreHp = Math.min(this.coreMaxHp, this.coreHp + (L.heal! / 4) * dt);
          break;
        }
        case 'falconry': {
          if (b.cd > 0) break;
          const aloft = this.projectiles.filter((p) => p.kind === 'falcon' && p.src === b.uid && !p.dead).length;
          if (aloft >= L.shots!) break;
          const t = this.findTarget(bx, by, L.range!, 'both', 'close', 0, true);
          if (!t) break;
          b.cd = 1 / L.rate!;
          b.firing = 0.4;
          const p = this.fireProjectile('falcon', b, t, L.damage!, 0, 6.5, '#ffe6b0');
          p.life = L.duration!;
          p.cd = 0;
          p.pierce = 2;
          const a = Math.random() * Math.PI * 2;
          p.vx = Math.cos(a) * 3;
          p.vy = Math.sin(a) * 3 - 2;
          break;
        }
        case 'lens': {
          let t = b.targetUid ? this.enemyByUid.get(b.targetUid) : undefined;
          if (!t || t.dead || (t.x - bx) ** 2 + (t.y - by) ** 2 > L.range! ** 2) {
            const n = this.findTarget(bx, by, L.range!, 'both', b.mode);
            b.targetUid = n ? n.uid : 0;
            t = n ?? undefined;
          }
          if (!t) break;
          b.angle = Math.atan2(t.y - by, t.x - bx);
          b.firing = 0.1;
          // burn every foe lying along the beam, out to the target
          const len = Math.hypot(t.x - bx, t.y - by) || 1;
          const ux = (t.x - bx) / len,
            uy = (t.y - by) / len;
          for (const e of this.enemies) {
            if (e.dead) continue;
            const ex = e.x - bx,
              ey = (e.def.flying ? e.y : e.y) - by;
            const along = ex * ux + ey * uy;
            if (along < 0.3 || along > len + 0.3) continue;
            const off = Math.abs(ex * uy - ey * ux);
            if (off > 0.32 + e.def.radius * 0.6) continue;
            this.damageEnemy(e, L.damage! * dt * (1 + b.buff), 3, b.uid, true);
          }
          if (b.cd <= 0) {
            b.cd = 0.5;
            this.events.push({ type: 'shoot', kind: 'lens', x: bx, y: by, tx: t.x, ty: t.y });
          }
          break;
        }
        case 'ballista': {
          if (b.cd > 0) break;
          const t = this.findTarget(bx, by, L.range!, 'both', b.mode);
          if (!t) break;
          b.angle = Math.atan2(t.y - by, t.x - bx);
          b.cd = 1 / L.rate!;
          b.recoil = 1;
          const p = this.fireProjectile('ballista', b, t, L.damage!, 0, 18, '#fff0c8');
          p.pierce = 8;
          p.execute = L.execute;
          break;
        }
        case 'titan': {
          b.spin += dt;
          if (b.cd > 0) break;
          // leap onto the densest knot of foes in reach
          const r2 = L.range! ** 2,
            s2 = L.splash! ** 2;
          const cands = this.enemies.filter((e) => !e.dead && e.age > 0.3 && (e.x - bx) ** 2 + (e.y - by) ** 2 <= r2 * 2 && this.inReach(bx, by, e, L.range!));
          if (!cands.length) break;
          let best = cands[0],
            bs = -1;
          for (const c of cands) {
            let n = 0;
            for (const o of cands) if ((o.x - c.x) ** 2 + (o.y - c.y) ** 2 <= s2) n += o.def.boss ? 4 : 1;
            if (n > bs || (n === bs && c.hp > best.hp)) {
              bs = n;
              best = c;
            }
          }
          b.cd = 1 / L.rate!;
          b.firing = 1.4;
          b.angle = Math.atan2(best.y - by, best.x - bx);
          this.strikes.push({ x: best.x, y: best.y, targetUid: best.uid, t: 1.0, damage: L.damage!, splash: L.splash!, src: b.uid, kind: 'slam', stun: L.stun });
          this.events.push({ type: 'slamWarn', x: best.x, y: best.y, r: L.splash! });
          break;
        }
        // ================================================================== night structures
        case 'arbalest': {
          if (b.cd > 0) break;
          const t = this.findTarget(bx, by, L.range!, 'both', b.mode);
          if (!t) break;
          b.angle = Math.atan2(t.y - by, t.x - bx);
          b.cd = 1 / L.rate!;
          b.recoil = 1;
          this.fireProjectile('bolt', b, t, L.damage!, 0, 13, '#ffcf7a');
          break;
        }
        case 'mortar': {
          if (b.cd > 0) break;
          const t = this.findTarget(bx, by, L.range!, 'ground', b.mode, L.minRange);
          if (!t) break;
          b.angle = Math.atan2(t.y - by, t.x - bx);
          b.cd = 1 / L.rate!;
          b.recoil = 1;
          const flight = 0.75 + Math.hypot(t.x - bx, t.y - by) * 0.06;
          const p = this.fireProjectile('shell', b, t, L.damage!, L.splash!, 0, '#ff8a4a');
          p.tx = t.x + t.vx * flight * 0.9;
          p.ty = t.y + t.vy * flight * 0.9;
          p.flight = flight;
          break;
        }
        case 'tesla': {
          if (b.cd > 0) break;
          const t = this.findTarget(bx, by, L.range!, 'both', b.mode);
          if (!t) break;
          b.cd = 1 / L.rate!;
          b.firing = 0.15;
          const pts = [{ x: bx, y: by - 0.35 }];
          const hit = new Set<Enemy>();
          let cur: Enemy | null = t;
          let dmg = L.damage!;
          for (let k = 0; k < L.chain! && cur; k++) {
            hit.add(cur);
            pts.push({ x: cur.x, y: cur.y });
            this.damageEnemy(cur, dmg, 2, b.uid);
            dmg *= 0.85;
            let next: Enemy | null = null,
              nd = 2.2 * 2.2;
            for (const o of this.enemies) {
              if (o.dead || hit.has(o)) continue;
              const d2 = (o.x - cur.x) ** 2 + (o.y - cur.y) ** 2;
              if (d2 < nd) {
                nd = d2;
                next = o;
              }
            }
            cur = next;
          }
          this.events.push({ type: 'chain', pts });
          this.events.push({ type: 'shoot', kind: 'tesla', x: bx, y: by, tx: t.x, ty: t.y });
          break;
        }
        case 'pyre': {
          const t = this.findTarget(bx, by, L.range!, 'both', 'close');
          if (!t) break;
          const want = Math.atan2(t.y - by, t.x - bx);
          b.angle = turnToward(b.angle, want, 8 * dt);
          b.firing = 0.1;
          if (b.cd <= 0) {
            b.cd = 0.25;
            this.events.push({ type: 'shoot', kind: 'pyre', x: bx, y: by, tx: t.x, ty: t.y });
          }
          const r2 = L.range! * L.range!;
          for (const e of this.enemies) {
            if (e.dead) continue;
            const dx = e.x - bx,
              dy = e.y - by;
            const d2 = dx * dx + dy * dy;
            if (d2 > r2) continue;
            const da = Math.abs(angDiff(Math.atan2(dy, dx), b.angle));
            if (da > 0.5 && d2 > 0.5) continue;
            this.damageEnemy(e, L.damage! * dt * (1 + b.buff), 0, b.uid, true);
            e.burn = Math.max(e.burn, L.burn!);
            e.burnT = 2.5;
          }
          break;
        }
        case 'prism': {
          let t = b.targetUid ? this.enemyByUid.get(b.targetUid) : undefined;
          if (!t || t.dead || (t.x - bx) ** 2 + (t.y - by) ** 2 > L.range! ** 2) {
            const n = this.findTarget(bx, by, L.range!, 'both', b.mode);
            if (!n) {
              b.targetUid = 0;
              b.beamTime = 0;
              break;
            }
            if (t && !t.dead) b.beamTime *= 0.3; // keep some charge when switching
            else b.beamTime *= 0.5;
            t = n;
            b.targetUid = n.uid;
          }
          b.angle = Math.atan2(t.y - by, t.x - bx);
          b.beamTime += dt;
          b.firing = 0.1;
          const mult = 1 + 3 * Math.min(1, b.beamTime / 3);
          this.damageEnemy(t, L.damage! * mult * dt * (1 + b.buff), 4, b.uid, true);
          if (b.cd <= 0) {
            b.cd = 0.5;
            this.events.push({ type: 'shoot', kind: 'prism', x: bx, y: by, tx: t.x, ty: t.y });
          }
          break;
        }
        case 'skyhunter': {
          if (b.cd > 0) break;
          const cands: Enemy[] = [];
          const r2 = L.range! ** 2;
          for (const e of this.enemies) if (!e.dead && e.age > 0.15 && (e.x - bx) ** 2 + (e.y - by) ** 2 <= r2 * 2 && this.inReach(bx, by, e, L.range!)) cands.push(e);
          if (!cands.length) break;
          const key = (e: Enemy) =>
            (e.def.flying ? 1e7 : 0) + (b.mode === 'strong' ? e.hp : b.mode === 'last' ? e.dist : b.mode === 'close' ? -((e.x - bx) ** 2 + (e.y - by) ** 2) : -e.dist);
          cands.sort((a, c) => key(c) - key(a));
          b.cd = 1 / L.rate!;
          b.recoil = 1;
          for (let k = 0; k < L.shots!; k++) {
            const t = cands[k % Math.min(cands.length, 3)];
            const p = this.fireProjectile('missile', b, t, L.damage!, L.splash!, 5, '#7dffcf');
            const a = -Math.PI / 2 + (k - (L.shots! - 1) / 2) * 0.5;
            p.vx = Math.cos(a) * 3;
            p.vy = Math.sin(a) * 3;
            p.t = -k * 0.08;
          }
          b.angle = Math.atan2(cands[0].y - by, cands[0].x - bx);
          break;
        }
        case 'obelisk': {
          if (b.cd > 0) break;
          const t = this.findTarget(bx, by, L.range!, 'both', 'strong');
          if (!t) break;
          b.cd = 1 / L.rate!;
          b.firing = 0.9;
          this.strikes.push({ x: t.x, y: t.y, targetUid: t.uid, t: 0.85, damage: L.damage!, splash: L.splash!, src: b.uid });
          this.events.push({ type: 'strikeWarn', x: t.x, y: t.y, r: L.splash! });
          break;
        }
        case 'frost': {
          const r2 = L.range! ** 2;
          for (const e of this.enemies) {
            if (e.dead) continue;
            if ((e.x - bx) ** 2 + (e.y - by) ** 2 > r2) continue;
            e.slow = Math.max(e.slow, L.slow!);
            if (L.damage) this.damageEnemy(e, L.damage * dt, 99, b.uid, true);
          }
          if (b.cd <= 0) {
            b.cd = 1.6;
            this.events.push({ type: 'frost', x: bx, y: by, r: L.range! });
          }
          break;
        }
        case 'thorns': {
          if (b.cd > 0) break;
          let any = false;
          for (const e of this.enemies) {
            if (e.dead || e.def.flying) continue;
            if (Math.abs(e.x - bx) < 0.55 && Math.abs(e.y - by) < 0.55) {
              this.damageEnemy(e, L.damage!, 7, b.uid);
              any = true;
            }
          }
          if (any) {
            b.cd = 1 / L.rate!;
            b.firing = 0.15;
            this.events.push({ type: 'thorns', x: bx, y: by });
          }
          break;
        }
        case 'mire': {
          for (const e of this.enemies) {
            if (e.dead || e.def.flying) continue;
            if (Math.abs(e.x - bx) < 0.6 && Math.abs(e.y - by) < 0.6) {
              e.slow = Math.max(e.slow, L.slow!);
              if (L.damage) this.damageEnemy(e, L.damage * dt, 99, b.uid, true);
            }
          }
          break;
        }
        case 'mender': {
          const r2 = L.range! ** 2;
          let any = false;
          for (const o of this.buildings) {
            if (o === b || o.hp >= o.maxHp) continue;
            if ((o.x - b.x) ** 2 + (o.y - b.y) ** 2 > r2) continue;
            o.hp = Math.min(o.maxHp, o.hp + L.heal! * dt);
            any = true;
          }
          if (this.coreRectDist(bx, by) <= L.range! && this.coreHp < this.coreMaxHp) {
            this.coreHp = Math.min(this.coreMaxHp, this.coreHp + (L.heal! / 4) * dt);
            any = true;
          }
          if (any) b.firing = 0.1;
          break;
        }
      }
    }
  }

  /** Hit a ground trap: the foes standing on tile (bx,by) that it can catch (hares hop over). */
  private onTrap(bx: number, by: number, ghosts = false): Enemy[] {
    return this.enemies.filter(
      (e) =>
        !e.dead &&
        !e.burrowT &&
        !e.reviveT &&
        (!e.def.flying || (ghosts && e.def.traits?.ethereal)) &&
        !e.def.traits?.hop &&
        Math.abs(e.x - bx) < 0.55 &&
        Math.abs(e.y - by) < 0.55,
    );
  }

  private inRange(bx: number, by: number, r: number, targets: string): Enemy[] {
    const out: Enemy[] = [];
    for (const e of this.enemies) if (!e.dead && e.age > 0.15 && this.canHit(targets, e) && this.hittable(e) && this.inReach(bx, by, e, r)) out.push(e);
    return out;
  }

  /** Behaviour of the seasonal campaigns' structures. */
  private seasonBuilding(b: Building, L: LevelStats, bx: number, by: number, dt: number) {
    const ready = b.cd <= 0;
    switch (b.def.id) {
      // ---------------------------------------------------------- simple shooters
      case 'seedspitter':
      case 'slinger':
      case 'candle':
      case 'snowballer': {
        if (!ready) break;
        const t = this.findTarget(bx, by, L.range!, 'both', b.mode);
        if (!t) break;
        b.angle = Math.atan2(t.y - by, t.x - bx);
        b.cd = 1 / L.rate!;
        b.recoil = 1;
        const col = { seedspitter: '#b8f070', slinger: '#e8c898', candle: '#ffb050', snowballer: '#f4faff' }[b.def.id];
        const p = this.fireProjectile('pellet', b, t, L.damage!, 0, b.def.id === 'candle' ? 10 : 12, col);
        if (L.slow) p.slow = L.slow;
        break;
      }
      // ---------------------------------------------------------- traps
      case 'thistle':
      case 'icicles':
      case 'saltring': {
        if (!ready) break;
        const caught = this.onTrap(bx, by, b.def.id === 'saltring');
        if (!caught.length) break;
        b.cd = 1 / L.rate!;
        b.firing = 0.15;
        for (const e of caught) {
          const ghost = !!e.def.traits?.ethereal;
          this.damageEnemy(e, L.damage! * (ghost ? 3 : 1), 7, b.uid, false, ghost);
          if (L.slow) {
            e.slowT = 0.6;
            e.slowAmt = L.slow;
          }
        }
        if (L.splash) this.explode(bx, by, L.splash, L.damage! * 0.5, 4, b.uid, false, true, b.def.color);
        this.events.push({ type: 'thorns', x: bx, y: by });
        break;
      }
      case 'quicksand': {
        for (const e of this.onTrap(bx, by)) {
          e.slow = Math.max(e.slow, L.slow!);
          this.damageEnemy(e, L.damage! * dt, 99, b.uid, true);
          e.sinkT = (e.sinkT ?? 0) + dt * 1.5;
          // small foes that linger are swallowed whole
          if (!e.dead && !e.def.boss && !e.elite && e.def.radius <= 0.38 && e.sinkT >= L.duration!) {
            this.fx('swallow', e.x, e.y);
            e.hp = 0;
            this.kill(e, b.uid);
          }
          b.firing = 0.1;
        }
        break;
      }
      case 'mushroom': {
        if (!ready) break;
        const caught = this.onTrap(bx, by);
        if (!caught.length) break;
        b.cd = 1 / L.rate!;
        b.firing = 0.4;
        for (const e of caught) {
          e.poison = Math.max(e.poison ?? 0, L.poison!);
          e.poisonT = 4;
        }
        this.fx('puff', bx, by, { r: 0.8, color: b.def.color });
        break;
      }
      // ---------------------------------------------------------- economy
      case 'beehive': {
        // the bees sting the nearest pest
        const t = this.findTarget(bx, by, L.range!, 'both', 'close');
        if (t) {
          this.damageEnemy(t, L.damage! * dt, 2, b.uid, true);
          b.firing = 0.1;
          b.targetUid = t.uid;
          if (ready) {
            b.cd = 0.6;
            this.fx('sting', t.x, t.y, { x2: bx, y2: by });
          }
        } else b.targetUid = 0;
        break;
      }
      // ---------------------------------------------------------- spring
      case 'sprinkler': {
        b.spin += dt * 1.6;
        const r2 = L.range! ** 2;
        for (const e of this.enemies) if (!e.dead && !e.def.flying && (e.x - bx) ** 2 + (e.y - by) ** 2 <= r2) e.slow = Math.max(e.slow, L.slow!);
        if (ready && this.phase === 'wave') {
          b.cd = 1 / L.rate!;
          // a puddle forms somewhere in its spray
          const a = this.rng.range(0, Math.PI * 2),
            d = this.rng.range(1, L.range!);
          const tx = Math.floor(bx + Math.cos(a) * d),
            ty = Math.floor(by + Math.sin(a) * d);
          if (inBounds(tx, ty) && this.map.terrain[idx(tx, ty)] === Terrain.Grass && !this.buildingAt[idx(tx, ty)] && !isCoreTile(tx, ty)) {
            if (!this.weather.puddle[idx(tx, ty)]) this.weather.version++;
            this.weather.puddle[idx(tx, ty)] = 1;
          }
        }
        break;
      }
      case 'snapper': {
        if (!ready) break;
        const t = this.findTarget(bx, by, L.range!, 'ground', 'close');
        if (!t) break;
        b.angle = Math.atan2(t.y - by, t.x - bx);
        b.firing = 0.4;
        if (!t.def.boss && !t.elite && t.def.radius <= 0.36 && t.hp <= L.damage! * L.devour!) {
          // swallowed whole, then chewed
          this.fx('devour', t.x, t.y, { x2: bx, y2: by });
          t.hp = 0;
          this.kill(t, b.uid);
          b.cd = L.duration!; // chewing (render hint: cd > 1 / rate)
        } else {
          this.damageEnemy(t, L.damage!, 3, b.uid);
          this.fx('devour', t.x, t.y, { x2: bx, y2: by, r: 0 });
          b.cd = 1 / L.rate!;
        }
        break;
      }
      case 'puffer': {
        if (!ready) break;
        const t = this.findTarget(bx, by, L.range!, 'both', b.mode);
        if (!t) break;
        b.cd = 1 / L.rate!;
        b.firing = 0.5;
        b.angle = Math.atan2(t.y - by, t.x - bx);
        for (const e of this.enemies) {
          if (e.dead || (e.x - t.x) ** 2 + (e.y - t.y) ** 2 > (L.splash! + e.def.radius) ** 2) continue;
          this.damageEnemy(e, L.damage!, 0, b.uid);
          if (!e.dead) {
            e.confT = Math.max(e.confT ?? 0, L.confuse! * (e.def.boss ? 0.3 : 1));
            e.hasWp = false;
            e.attacking = -1;
          }
        }
        this.fx('puff', t.x, t.y, { r: L.splash!, color: b.def.color, x2: bx, y2: by });
        break;
      }
      case 'willow': {
        b.spin += dt;
        if (!ready) break;
        const cands = this.inRange(bx, by, L.range!, 'both').sort((a, c) => a.dist - c.dist);
        if (!cands.length) break;
        b.cd = 1 / (L.rate! * (1 + b.buff));
        b.firing = 0.35;
        const hit = cands.slice(0, L.shots!);
        for (const e of hit) this.damageEnemy(e, L.damage!, 3, b.uid);
        this.fx('lash', bx, by, { pts: hit.map((e) => ({ x: e.x, y: e.y - (e.def.flying ? 0.45 : 0) })) });
        break;
      }
      case 'brambler':
      case 'naphtha':
      case 'catapult': {
        if (!ready) break;
        const t = this.findTarget(bx, by, L.range!, 'ground', b.mode, L.minRange);
        if (!t) break;
        b.angle = Math.atan2(t.y - by, t.x - bx);
        b.cd = 1 / L.rate!;
        b.recoil = 1;
        const flight = 0.75 + Math.hypot(t.x - bx, t.y - by) * 0.06;
        const p = this.fireProjectile('shell', b, t, L.damage!, L.splash!, 0, b.def.color);
        p.tx = t.x + t.vx * flight * 0.9;
        p.ty = t.y + t.vy * flight * 0.9;
        p.flight = flight;
        p.after = b.def.id === 'naphtha' ? 'naphtha' : b.def.id === 'catapult' ? 'catapult' : 'bramble';
        p.poison = L.poison ?? L.burn;
        p.dur = L.duration;
        p.shots = L.shots;
        break;
      }
      case 'elderoak': {
        b.spin += dt;
        if (!ready) break;
        const cands = this.inRange(bx, by, L.range!, 'both');
        if (!cands.length) break;
        b.cd = 1 / L.rate!;
        b.firing = 1.2;
        for (const e of cands) {
          this.damageEnemy(e, L.damage! * (e.def.flying ? 0.6 : 1), 6, b.uid);
          if (!e.def.flying && !e.dead) e.stunT = Math.max(e.stunT, L.stun! * (e.def.boss ? 0.35 : 1));
        }
        this.fx('roots', bx, by, { r: L.range!, pts: cands.filter((e) => !e.def.flying).map((e) => ({ x: e.x, y: e.y })) });
        break;
      }
      // ---------------------------------------------------------- summer
      case 'mirror': {
        if (!ready) break;
        const t = this.findTarget(bx, by, L.range!, 'both', b.mode);
        if (!t) break;
        b.cd = 1 / L.rate!;
        b.firing = 0.25;
        b.angle = Math.atan2(t.y - by, t.x - bx);
        // nearby mirrors relay the flash, each relay strengthening it
        const relays: { x: number; y: number }[] = [];
        for (const m of this.buildings) {
          if (relays.length >= L.chain! || m === b || m.def.id !== 'mirror' || (m.disabledT ?? 0) > 0) continue;
          const mx = m.x + 0.5,
            my = m.y + 0.5;
          if ((mx - bx) ** 2 + (my - by) ** 2 > 3.5 * 3.5) continue;
          if ((t.x - mx) ** 2 + (t.y - my) ** 2 > m.def.levels[m.level].range! ** 2) continue;
          relays.push({ x: mx, y: my - 0.3 });
          m.firing = 0.25;
        }
        this.damageEnemy(t, L.damage! * (1 + 0.35 * relays.length), 3, b.uid);
        this.fx('beam', bx, by - 0.3, { pts: [{ x: bx, y: by - 0.3 }, ...relays, { x: t.x, y: t.y - (t.def.flying ? 0.45 : 0) }], color: b.def.color });
        break;
      }
      case 'sandblaster': {
        const t = this.findTarget(bx, by, L.range!, 'ground', 'close');
        if (!t) break;
        b.angle = turnToward(b.angle, Math.atan2(t.y - by, t.x - bx), 6 * dt);
        b.firing = 0.1;
        const cone = this.inRange(bx, by, L.range!, 'ground').filter((e) => Math.abs(angDiff(Math.atan2(e.y - by, e.x - bx), b.angle)) < 0.5);
        for (const e of cone) {
          this.damageEnemy(e, L.damage! * L.rate! * dt, 0, b.uid, true);
          e.slow = Math.max(e.slow, L.slow!);
          e.shred = Math.min(8, (e.shred ?? 0) + L.shred! * L.rate! * dt);
        }
        if (ready) {
          b.cd = 0.3;
          this.events.push({ type: 'shoot', kind: b.def.id, x: bx, y: by, tx: t.x, ty: t.y });
        }
        break;
      }
      case 'sundial': {
        b.spin += dt;
        if (!ready || this.phase !== 'wave') break;
        b.cd = 1 / L.rate!;
        b.firing = 1;
        // High Noon: every tower in its shadow quickens at once
        for (const o of this.buildings) {
          if (o.def.kind !== 'tower' || (o.x - b.x) ** 2 + (o.y - b.y) ** 2 > L.range! ** 2) continue;
          o.noonT = L.duration!;
          o.noonBuff = Math.max(o.noonT > 0 ? (o.noonBuff ?? 0) : 0, L.buff!);
        }
        this.fx('noon', bx, by, { r: L.range! });
        break;
      }
      case 'djinn': {
        if (!ready) break;
        const t = this.findTarget(bx, by, L.range!, 'both', b.mode);
        if (!t) break;
        b.cd = 1 / L.rate!;
        b.firing = 0.8;
        const ox = t.x,
          oy = t.y;
        this.damageEnemy(t, L.damage!, 2, b.uid);
        if (!t.dead) {
          this.pushBack(t, L.pull!);
          t.stunT = Math.max(t.stunT, L.stun! * (t.def.boss ? 0.3 : 1));
        }
        this.fx('whirl', ox, oy, { x2: t.x, y2: t.y });
        break;
      }
      case 'stinger': {
        if (!ready) break;
        const t = this.findTarget(bx, by, L.range!, 'both', b.mode);
        if (!t) break;
        b.angle = Math.atan2(t.y - by, t.x - bx);
        b.cd = 1 / L.rate!;
        b.recoil = 1;
        const p = this.fireProjectile('ballista', b, t, L.damage!, 0, 16, '#c8f060');
        p.pierce = 3;
        p.poison = L.poison;
        break;
      }
      case 'greatmirror': {
        // the beam sweeps all the way round, searing every foe once per turn
        const prev = b.spin;
        b.spin += dt * Math.PI * 2 * L.rate! * (1 + b.buff);
        b.firing = 0.1;
        let hits = this.sweepHits.get(b.uid);
        if (!hits || Math.floor(prev / (Math.PI * 2)) !== Math.floor(b.spin / (Math.PI * 2))) this.sweepHits.set(b.uid, (hits = new Set()));
        const a = b.spin;
        for (const e of this.enemies) {
          if (e.dead || hits.has(e.uid) || !this.hittable(e)) continue;
          const d2 = (e.x - bx) ** 2 + (e.y - by) ** 2;
          if (d2 > L.range! ** 2 || d2 < 0.2) continue;
          if (Math.abs(angDiff(Math.atan2(e.y - by, e.x - bx), a)) > 0.09 + e.def.radius / Math.sqrt(d2)) continue;
          hits.add(e.uid);
          this.damageEnemy(e, L.damage!, 6, b.uid);
          this.events.push({ type: 'hit', x: e.x, y: e.y, color: '#fff2b0' });
        }
        break;
      }
      // ---------------------------------------------------------- autumn
      case 'spiritlantern':
        b.spin += dt;
        break;
      case 'cauldron': {
        b.spin += dt;
        if (!ready) break;
        const t = this.findTarget(bx, by, L.range!, 'ground', 'first');
        if (!t) break;
        b.cd = 1 / L.rate!;
        b.firing = 0.6;
        const roll = this.rng.int(0, 2);
        const color = ['#7aff5a', '#c05aff', '#ff8a2a'][roll];
        if (roll === 0) this.hazards.push({ kind: 'poison', x: t.x, y: t.y, r: L.splash!, t: L.duration!, max: L.duration!, dps: L.poison!, slow: 0.15, src: b.uid });
        else if (roll === 1) {
          for (const e of this.enemies) if (!e.dead && (e.x - t.x) ** 2 + (e.y - t.y) ** 2 <= (L.splash! + e.def.radius) ** 2) e.curseT = L.duration!;
          this.damageEnemy(t, L.damage! * 0.5, 0, b.uid);
        } else this.explode(t.x, t.y, L.splash!, L.damage! * 1.4, 2, b.uid, false, true, color);
        this.fx('potion', t.x, t.y, { x2: bx, y2: by, r: L.splash!, color });
        break;
      }
      case 'ravens': {
        b.spin += dt;
        if (!ready) break;
        const cands = this.inRange(bx, by, L.range!, 'both');
        if (!cands.length) break;
        b.cd = 1 / L.rate!;
        b.firing = 0.4;
        // spread the flock over different foes, unmarked ones first
        cands.sort((a, c) => (a.greed ? 1 : 0) - (c.greed ? 1 : 0) || a.dist - c.dist);
        for (const e of cands.slice(0, L.shots!)) {
          this.damageEnemy(e, L.damage!, 1, b.uid);
          e.greed = Math.max(e.greed ?? 0, L.greed!);
          this.fx('sting', e.x, e.y - (e.def.flying ? 0.45 : 0), { x2: bx, y2: by - 0.4, color: '#2a2238' });
        }
        break;
      }
      case 'reanimator': {
        if (!ready) break;
        const t = this.findTarget(bx, by, L.range!, 'both', b.mode);
        if (!t) break;
        b.cd = 1 / L.rate!;
        b.firing = 0.15;
        const pts = [{ x: bx, y: by - 0.45 }];
        const hit = new Set<Enemy>();
        let cur: Enemy | null = t;
        let dmg = L.damage!;
        for (let k = 0; k < L.chain! && cur; k++) {
          hit.add(cur);
          pts.push({ x: cur.x, y: cur.y });
          this.damageEnemy(cur, dmg, 2, b.uid);
          dmg *= 0.85;
          let next: Enemy | null = null,
            nd = 2.2 * 2.2;
          for (const o of this.enemies) {
            if (o.dead || hit.has(o) || !this.hittable(o)) continue;
            const d2 = (o.x - cur.x) ** 2 + (o.y - cur.y) ** 2;
            if (d2 < nd) {
              nd = d2;
              next = o;
            }
          }
          cur = next;
        }
        this.events.push({ type: 'chain', pts });
        this.events.push({ type: 'shoot', kind: 'reanimator', x: bx, y: by, tx: t.x, ty: t.y });
        break;
      }
      case 'reaper': {
        if (!ready) break;
        const t = this.findTarget(bx, by, L.range!, 'both', b.mode);
        if (!t) break;
        b.cd = 1 / L.rate!;
        b.firing = 0.5;
        b.angle = Math.atan2(t.y - by, t.x - bx);
        const low = t.hp / t.maxHp < L.execute!;
        if (low && !t.def.boss) {
          t.hp = 0;
          this.kill(t, b.uid);
        } else this.damageEnemy(t, L.damage! * (low ? 2 : 1), 8, b.uid);
        this.fx('reap', t.x, t.y - (t.def.flying ? 0.45 : 0), { x2: bx, y2: by });
        break;
      }
      case 'clocktower': {
        b.spin += dt;
        if (!ready) break;
        const cands = this.inRange(bx, by, L.range!, 'both');
        if (!cands.length) break;
        b.cd = 1 / L.rate!;
        b.firing = 1.5;
        for (const e of cands) {
          this.damageEnemy(e, L.damage!, 6, b.uid);
          if (!e.dead) e.stunT = Math.max(e.stunT, L.stun! * (e.def.boss ? 0.35 : 1));
        }
        this.fx('timestop', bx, by, { r: L.range! });
        break;
      }
      // ---------------------------------------------------------- winter
      case 'harpoon': {
        if (!ready) break;
        const t = this.findTarget(bx, by, L.range!, 'both', b.mode);
        if (!t) break;
        b.angle = Math.atan2(t.y - by, t.x - bx);
        b.cd = 1 / L.rate!;
        b.recoil = 1;
        const ox = t.x,
          oy = t.y;
        this.damageEnemy(t, L.damage!, 4, b.uid);
        if (!t.dead) this.pushBack(t, L.pull!);
        this.fx('harpoon', bx, by, { x2: ox, y2: oy - (t.def.flying ? 0.45 : 0), pts: [{ x: t.x, y: t.y }] });
        break;
      }
      case 'brazier': {
        b.spin += dt;
        const r2 = L.range! ** 2;
        let any = false;
        for (const e of this.enemies) {
          if (e.dead || (e.x - bx) ** 2 + (e.y - by) ** 2 > r2 || !this.hittable(e)) continue;
          e.burn = Math.max(e.burn, L.burn!);
          e.burnT = Math.max(e.burnT, 0.5);
          any = true;
        }
        if (any) b.firing = 0.1;
        break;
      }
      case 'avalanche':
        // fired by the player (trigger)
        break;
      case 'snowcannon': {
        if (!ready) break;
        const t = this.findTarget(bx, by, L.range!, 'ground', 'first');
        if (!t) break;
        b.angle = Math.atan2(t.y - by, t.x - bx);
        b.cd = 1 / L.rate!;
        b.recoil = 1;
        const p = this.fireProjectile('rollball', b, t, L.damage!, 0, 9, '#f4faff');
        // lands on the target, then rolls back down the trail
        p.route = [{ x: t.x, y: t.y }, ...this.trailBack(t.x, t.y, L.duration! * 4, 2)];
        p.flight = L.duration!;
        p.hits = [];
        p.tx = t.x;
        p.ty = t.y;
        break;
      }
      case 'aurora': {
        let t = b.targetUid ? this.enemyByUid.get(b.targetUid) : undefined;
        if (!t || t.dead || !this.hittable(t) || (t.x - bx) ** 2 + (t.y - by) ** 2 > L.range! ** 2) {
          const n = this.findTarget(bx, by, L.range!, 'both', b.mode);
          b.targetUid = n ? n.uid : 0;
          t = n ?? undefined;
        }
        if (!t) break;
        b.angle = Math.atan2(t.y - by, t.x - bx);
        b.firing = 0.1;
        this.damageEnemy(t, L.damage! * dt * (1 + b.buff), 4, b.uid, true);
        // held long enough, the foe freezes solid and shatters
        t.frostBuild = (t.frostBuild ?? 0) + dt * (1 + b.buff);
        if (t.frostBuild >= 2 && !t.dead) {
          t.frostBuild = 0;
          t.stunT = Math.max(t.stunT, L.stun! * (t.def.boss ? 0.35 : 1));
          t.frozenT = L.stun!;
          this.damageEnemy(t, L.damage! * 3, 6, b.uid);
          this.fx('shatter', t.x, t.y - (t.def.flying ? 0.45 : 0), { r: t.def.radius });
          b.targetUid = 0;
        }
        if (ready) {
          b.cd = 0.5;
          this.events.push({ type: 'shoot', kind: b.def.id, x: bx, y: by, tx: t.x, ty: t.y });
        }
        break;
      }
      case 'mammoth': {
        if (!ready || this.allies.some((a) => a.src === b.uid)) break;
        // charge from the trail beside the pen back toward the rifts, but only into foes coming down that stretch
        const route = this.routeFrom(bx, by);
        if (route.length < 2) break;
        const reach = route.slice(Math.max(0, route.length - 1 - Math.ceil(L.range!)));
        const coming = this.enemies.some((e) => !e.dead && !e.def.flying && this.hittable(e) && reach.some((p) => (p.x - e.x) ** 2 + (p.y - e.y) ** 2 < 1.2));
        if (!coming) break;
        b.cd = 1 / L.rate!;
        b.firing = 1;
        this.allies.push({
          uid: this.uidSeq++,
          kind: 'mammoth',
          x: bx,
          y: by,
          hp: 1,
          maxHp: 1,
          dmg: L.damage!,
          speed: 3.2,
          life: 30,
          facing: 0,
          path: route,
          pi: route.length - 1,
          left: L.range!,
          hits: [],
          push: L.push!,
          hx: bx,
          hy: by,
          src: b.uid,
        });
        this.fx('mammoth', bx, by);
        break;
      }
      case 'winterheart': {
        b.spin += dt;
        if (!ready) break;
        const cands = this.inRange(bx, by, L.range!, 'both');
        if (!cands.length) break;
        b.cd = 1 / L.rate!;
        b.firing = 1.2;
        for (const e of cands) {
          this.damageEnemy(e, L.damage!, 6, b.uid);
          if (e.dead) continue;
          const st = e.def.boss ? 0.8 : L.stun!;
          e.stunT = Math.max(e.stunT, st);
          e.frozenT = st;
        }
        this.fx('freezepulse', bx, by, { r: L.range! });
        break;
      }
    }
  }
  private sweepHits = new Map<number, Set<number>>();

  private updateCore(dt: number) {
    const C = this.core;
    this.coreCd -= dt;
    if (this.coreCd > 0) return;
    const cx = CORE_X + 0.5,
      cy = CORE_Y + 0.5;
    const t = this.findTarget(cx, cy, C.range, 'both', 'close');
    if (!t) return;
    this.coreCd = 1 / C.rate;
    this.coreAngle = Math.atan2(t.y - cy, t.x - cx);
    const p = this.fireProjectile('core', null, t, C.damage, 0, 11, '#fff0b0');
    p.x = cx;
    p.y = cy - 0.6;
  }

  private fireProjectile(
    kind: Projectile['kind'],
    b: Building | null,
    t: Enemy,
    damage: number,
    splash: number,
    speed: number,
    color: string,
  ): Projectile {
    const x = b ? b.x + 0.5 : CORE_X + 0.5,
      y = b ? b.y + 0.5 : CORE_Y + 0.5;
    const p: Projectile = {
      kind,
      x,
      y,
      sx: x,
      sy: y,
      tx: t.x,
      ty: t.y,
      vx: 0,
      vy: 0,
      targetUid: t.uid,
      speed,
      damage,
      splash,
      pierce: kind === 'shell' ? 2 : 0,
      t: 0,
      flight: 0,
      air: kind !== 'shell',
      ground: true,
      src: b ? b.uid : -1,
      color,
      dead: false,
    };
    this.projectiles.push(p);
    this.events.push({ type: 'shoot', kind: b ? b.def.id : 'core', x, y, tx: t.x, ty: t.y });
    return p;
  }

  private updateProjectiles(dt: number) {
    for (const p of this.projectiles) {
      if (p.dead) continue;
      p.t += dt;
      if (p.t < 0) continue;
      if (p.kind === 'shell') {
        const k = Math.min(1, p.t / p.flight);
        p.x = p.sx + (p.tx - p.sx) * k;
        p.y = p.sy + (p.ty - p.sy) * k;
        if (k >= 1) {
          p.dead = true;
          this.explode(p.x, p.y, p.splash, p.damage, p.pierce, p.src, false, true, p.color);
          if (p.after) this.shellAfter(p);
        }
        continue;
      }
      if (p.kind === 'rollball') {
        this.stepRoll(p, dt);
        continue;
      }
      if (p.kind === 'javelin') {
        this.stepJavelin(p, dt);
        continue;
      }
      if (p.kind === 'falcon') {
        this.stepFalcon(p, dt);
        continue;
      }
      let t = this.enemyByUid.get(p.targetUid);
      if (t && t.dead) t = undefined;
      if (!t && p.kind === 'missile') {
        // retarget
        let best: Enemy | undefined,
          bd = 9;
        for (const e of this.enemies) {
          if (e.dead) continue;
          const d2 = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
          if (d2 < bd) {
            bd = d2;
            best = e;
          }
        }
        if (best) {
          t = best;
          p.targetUid = best.uid;
        }
      }
      if (t) {
        p.tx = t.x;
        p.ty = t.y;
      }
      const dx = p.tx - p.x,
        dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      if (p.kind === 'missile') {
        p.speed = Math.min(9, p.speed + dt * 6);
        const ax = (dx / (d || 1)) * p.speed,
          ay = (dy / (d || 1)) * p.speed;
        const k = Math.min(1, dt * 6);
        p.vx += (ax - p.vx) * k;
        p.vy += (ay - p.vy) * k;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (d < 0.25 || p.t > 4) {
          p.dead = true;
          this.explode(p.x, p.y, p.splash, p.damage, 1, p.src, true, true, p.color, t);
        }
        continue;
      }
      const step = p.speed * dt;
      if (d <= step + 0.1) {
        p.dead = true;
        if (t) {
          const exec = p.execute && t.hp / t.maxHp < p.execute ? 2 : 1;
          this.damageEnemy(t, p.damage * exec, p.pierce, p.src);
          this.events.push({ type: 'hit', x: t.x, y: t.y, color: exec > 1 ? '#ffffff' : p.color });
          if (p.slow && !t.dead) {
            t.slowAmt = t.slowT > 0 ? Math.max(t.slowAmt, p.slow) : p.slow;
            t.slowT = 1.2;
          }
          if (p.poison && !t.dead) {
            // venom stacks up to five times
            t.stacks = Math.min(5, (t.stacks ?? 0) + 1);
            t.poison = p.poison * t.stacks;
            t.poisonT = 4;
          }
        }
      } else {
        p.x += (dx / d) * step;
        p.y += (dy / d) * step;
      }
      if (p.t > 3) p.dead = true;
    }
  }

  /** What a lobbed shell leaves behind: brambles, burning oil, or a scatter of small pumpkins. */
  private shellAfter(p: Projectile) {
    if (p.after === 'bramble') this.hazards.push({ kind: 'bramble', x: p.x, y: p.y, r: p.splash, t: p.dur!, max: p.dur!, dps: p.poison!, slow: 0.4, src: p.src });
    else if (p.after === 'naphtha') {
      this.hazards.push({ kind: 'fire', x: p.x, y: p.y, r: p.splash, t: p.dur!, max: p.dur!, dps: p.poison!, slow: 0, src: p.src });
      this.weather.igniteAt(p.x, p.y, 0.6);
    } else if (p.after === 'catapult')
      for (let k = 0; k < (p.shots ?? 3); k++) {
        const a = (k / (p.shots ?? 3)) * Math.PI * 2 + this.rng.range(0, 1);
        const d = this.rng.range(0.6, 1.1);
        this.strikes.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, targetUid: 0, t: 0.25 + k * 0.05, damage: p.damage * 0.35, splash: 0.6, src: p.src, kind: 'bomblet' });
      }
  }

  /** Snow cannon: the snowball lands, then rolls back along the trail, growing as it flattens foes. */
  private stepRoll(p: Projectile, dt: number) {
    const route = p.route!;
    if (p.t < 0.35) {
      // still in the air
      const k = p.t / 0.35;
      p.x = p.sx + (route[0].x - p.sx) * k;
      p.y = p.sy + (route[0].y - p.sy) * k;
      return;
    }
    p.flight -= dt;
    let left = 3.6 * dt;
    while (left > 0 && route.length > 1) {
      const n = route[1];
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d <= left) {
        p.x = n.x;
        p.y = n.y;
        route.shift();
        left -= d;
      } else {
        p.x += ((n.x - p.x) / d) * left;
        p.y += ((n.y - p.y) / d) * left;
        left = 0;
      }
    }
    const size = 0.3 + p.hits!.length * 0.04;
    for (const e of this.enemies) {
      if (e.dead || e.def.flying || p.hits!.includes(e.uid) || (e.x - p.x) ** 2 + (e.y - p.y) ** 2 > (size + e.def.radius) ** 2) continue;
      p.hits!.push(e.uid);
      this.damageEnemy(e, p.damage * (1 + 0.12 * p.hits!.length), 3, p.src);
      e.slowT = 1;
      e.slowAmt = Math.max(e.slowAmt, 0.3);
      this.events.push({ type: 'hit', x: e.x, y: e.y, color: '#f4faff' });
    }
    if (p.flight <= 0 || route.length <= 1) {
      p.dead = true;
      this.events.push({ type: 'explode', x: p.x, y: p.y, r: size + 0.3, color: '#e8f4ff' });
    }
  }

  /** Javelin: flies straight, striking each foe it passes once, until its pierce is spent. */
  private stepJavelin(p: Projectile, dt: number) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.t * p.speed > p.flight || !inBounds(Math.floor(p.x), Math.floor(p.y))) {
      p.dead = true;
      return;
    }
    for (const e of this.enemies) {
      if (e.dead || p.hits!.includes(e.uid)) continue;
      const ey = e.y - (e.def.flying ? 0 : 0);
      if ((e.x - p.x) ** 2 + (ey - p.y) ** 2 > (0.3 + e.def.radius) ** 2) continue;
      p.hits!.push(e.uid);
      this.damageEnemy(e, p.damage, 1, p.src);
      this.events.push({ type: 'hit', x: e.x, y: e.y, color: p.color });
      if (--p.pierceLeft! <= 0) {
        p.dead = true;
        return;
      }
    }
  }

  /** Falcon: hunts near its roost (flyers first), strikes repeatedly, then flies off when its time is up. */
  private stepFalcon(p: Projectile, dt: number) {
    p.life! -= dt;
    p.cd! -= dt;
    const roost = this.byUid.get(p.src);
    if (p.life! <= 0 || !roost) {
      p.dead = true;
      this.events.push({ type: 'hit', x: p.x, y: p.y, color: '#ffe6b0' });
      return;
    }
    const L = roost.def.levels[roost.level];
    const rx = roost.x + 0.5,
      ry = roost.y + 0.5;
    const leash = L.range! * 1.3;
    let t = this.enemyByUid.get(p.targetUid);
    if (!t || t.dead || (t.x - rx) ** 2 + (t.y - ry) ** 2 > leash * leash) {
      const n = this.findTarget(rx, ry, L.range!, 'both', 'close', 0, true);
      p.targetUid = n ? n.uid : 0;
      t = n ?? undefined;
    }
    // with no prey, circle above the roost
    const gx = t ? t.x : rx + Math.cos(this.time * 2 + p.src) * 0.9;
    const gy = t ? t.y : ry - 0.6 + Math.sin(this.time * 2 + p.src) * 0.6;
    const dx = gx - p.x,
      dy = gy - p.y;
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, dt * 5);
    p.vx += ((dx / d) * p.speed - p.vx) * k;
    p.vy += ((dy / d) * p.speed - p.vy) * k;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (t && d < 0.35 + t.def.radius && p.cd! <= 0) {
      p.cd = 0.8;
      this.damageEnemy(t, p.damage * (1 + roost.buff), p.pierce, p.src);
      this.events.push({ type: 'hit', x: t.x, y: t.y, color: p.color });
      // bounce off after the strike
      p.vx = -p.vx * 0.6 + (Math.random() - 0.5) * 3;
      p.vy = -p.vy * 0.6 - 2;
    }
  }

  private explode(
    x: number,
    y: number,
    r: number,
    damage: number,
    pierce: number,
    src: number,
    air: boolean,
    ground: boolean,
    color: string,
    direct?: Enemy,
  ) {
    const r2 = r * r;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.def.flying ? !air : !ground) continue;
      // a blast scatters a collapsed skeleton's bones for good
      if (e.reviveT && e.reviveT > 0 && !e.def.boss && (e.x - x) ** 2 + (e.y - y) ** 2 <= (r + e.def.radius) ** 2) {
        e.reviveT = 0;
        e.revived = true;
        e.hp = 1;
        e.reviveT = 0;
        this.kill(e, src);
        continue;
      }
      const d2 = (e.x - x) ** 2 + (e.y - y) ** 2;
      const rr = r + e.def.radius;
      if (d2 > rr * rr && e !== direct) continue;
      const falloff = e === direct ? 1 : 1 - 0.4 * Math.min(1, d2 / Math.max(r2, 0.01));
      this.damageEnemy(e, damage * falloff, pierce, src);
    }
    this.events.push({ type: 'explode', x, y, r, color });
    if (ground && r >= 0.9) this.weather.igniteAt(x, y, 0.3);
  }

  private updateStrikes(dt: number) {
    if (!this.strikes.length) return;
    for (const s of this.strikes) {
      const t = this.enemyByUid.get(s.targetUid);
      if (t && !t.dead) {
        s.x += (t.x - s.x) * Math.min(1, dt * 8);
        s.y += (t.y - s.y) * Math.min(1, dt * 8);
      }
      s.t -= dt;
      if (s.t <= 0) {
        if (s.kind === 'sunstrike' || s.kind === 'comet' || s.kind === 'bomblet') {
          this.explode(s.x, s.y, s.splash, s.damage, s.kind === 'bomblet' ? 2 : 99, s.src, s.kind !== 'bomblet', true, s.kind === 'comet' ? '#ff9a4a' : s.kind === 'bomblet' ? '#ff8a20' : '#fff2b0');
          if (s.kind === 'bomblet') continue;
          this.weather.igniteAt(s.x, s.y, 1);
          if (s.kind === 'comet') {
            // the hearth's embers keep burning and thaw what they touch
            this.hazards.push({ kind: 'warm', x: s.x, y: s.y, r: s.splash, t: 6, max: 6, dps: s.damage * 0.04, slow: 0, src: -1 });
            for (const b of this.buildings) if ((b.x + 0.5 - s.x) ** 2 + (b.y + 0.5 - s.y) ** 2 <= s.splash ** 2) b.disabledT = 0;
          }
          this.events.push({ type: 'strike', x: s.x, y: s.y, r: s.splash });
        } else if (s.kind === 'slam') {
          this.explode(s.x, s.y, s.splash, s.damage, 6, s.src, true, true, '#fff6dc', t && !t.dead ? t : undefined);
          for (const e of this.enemies)
            if (!e.dead && (e.x - s.x) ** 2 + (e.y - s.y) ** 2 <= (s.splash + e.def.radius) ** 2) e.stunT = Math.max(e.stunT, (s.stun ?? 1) * (e.def.boss ? 0.4 : 1));
          this.events.push({ type: 'slam', x: s.x, y: s.y, r: s.splash });
        } else {
          this.explode(s.x, s.y, s.splash, s.damage, 99, s.src, true, true, '#fff1a8', t && !t.dead ? t : undefined);
          this.events.push({ type: 'strike', x: s.x, y: s.y, r: s.splash });
        }
      }
    }
    this.strikes = this.strikes.filter((s) => s.t > 0);
  }

  /** Follow the ground flow field from a tile to the core, for path previews. */
  tracePath(sx: number, sy: number, field = this.flowG): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    let x = sx,
      y = sy;
    for (let n = 0; n < 400; n++) {
      pts.push({ x: x + 0.5, y: y + 0.5 });
      const cur = field[idx(x, y)];
      if (cur <= 1.5) break;
      let best = cur,
        bx = -1,
        by = -1;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx,
          ny = y + dy;
        if (!inBounds(nx, ny)) continue;
        const ni = idx(nx, ny);
        if (this.groundCost(ni) >= INF) continue;
        if (dx && dy && (this.groundCost(idx(x + dx, y)) >= INF || this.groundCost(idx(x, y + dy)) >= INF)) continue;
        if (field[ni] < best) {
          best = field[ni];
          bx = nx;
          by = ny;
        }
      }
      if (bx < 0) break;
      x = bx;
      y = by;
    }
    return pts;
  }

  drainEvents(): GameEvent[] {
    const ev = this.events;
    this.events = [];
    return ev;
  }
}

function angDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function turnToward(cur: number, want: number, maxStep: number): number {
  const d = angDiff(want, cur);
  if (Math.abs(d) <= maxStep) return want;
  return cur + Math.sign(d) * maxStep;
}
