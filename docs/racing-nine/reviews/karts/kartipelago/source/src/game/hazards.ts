/**
 * Course hazards and creatures for Blender tracks, driven by track.json entities and
 * the collision surfaces under the wheels:
 *
 *   lava        a burning bounce (think of a cartoon hop off a hot stove): an upward
 *               kick, a push back towards the road, a sizzle and a yelp, and a speed
 *               penalty. You keep steering in the air, and you're immune for a moment
 *               after. Burn yourself three times in a few seconds and you're put back
 *               at the last checkpoint, held still briefly (the time penalty).
 *   deep water  a splash, then you bob in the water, slow, and are fished out at the
 *               last checkpoint after a moment. Shallow water is just a slow surface
 *               (with a splash going in).
 *   respawn     { "type": "respawn", "from": 820, "to": 845, "at": 852 }: falling in
 *               while between `from` and `to` along the lap (a jump's gap) puts you
 *               back at `at` instead of the last checkpoint, so a missed jump never
 *               loops.
 *   dinosaur    { "type": "dinosaur", "route": "Dino Path", "speed": 2.2 }: a friendly
 *               long-neck that walks round a path from route.json (draw it in Blender
 *               as a curve and mark it as a route). It stops when a kart comes close,
 *               nudges karts aside (it never traps them) and never jumps about.
 *               "model": "mammoth" makes it a woolly mammoth instead.
 *   waterfall   { "type": "waterfall", "x", "y", "z", "top", "width", "heading", "sound"? }:
 *               spray at its foot and its roar nearby; driving through it splashes.
 *   campfire    { "type": "campfire", "x", "y", "z" }: smoke and embers rising from a
 *               little bonfire (the fire itself is scenery). Purely visual.
 *   torch       { "type": "torch", "x", "y", "z" }: a torch flame (the torch is scenery).
 *               The few torches nearest the camera cast flickering warm light on the
 *               road, the walls and the karts, and drop the odd ember. Purely visual.
 *   bubbles     { "type": "bubbles", "x", "y", "z", "r", "molten"? }: a bubbling pool: glowing
 *               bubbles rising and popping over it, and now and then a big burp of
 *               swamp gas ("molten": true: orange lava bubbles and spatter). Purely
 *               visual.
 *   fireflies   { "type": "fireflies", "rate": 40, "radius": 36 }: little glowing
 *               motes drifting in the air round the camera. Purely visual.
 *   dragon      { "type": "dragon", ... } (see game/dragon.ts): a fire-breathing dragon on
 *               a fixed schedule from the race clock. Its fire burns exactly like
 *               lava (the same bounce, immunity and three-strikes respawn).
 *   eruption    { "type": "eruption", "x", "y", "z", "period": 12, "offset": 0 }: a
 *               volcano erupting on a fixed beat of the race clock: a rumble, then a
 *               blast of glowing lava bombs and a flash of red light, with a fountain
 *               of fire between. Purely visual.
 *   storm       { "type": "storm", "period": 9, "spread": 5, "distance": 900 } (see
 *               game/storm.ts): lightning forking down round the horizon now and then, a
 *               white-blue flash over everything and the thunder after. Purely visual.
 *   ashfall     { "type": "ashfall", "rate": 60, "radius": 40 }: grey ash drifting down
 *               and embers floating up round the camera. Purely visual.
 *   steam       { "type": "steam", "x", "y", "z" }: a vent puffing steam. Purely visual.
 *   snowball    { "type": "snowball", ... } (see game/movers.ts): a giant snowball rolling
 *               across the road on a fixed beat of the race clock. It's solid: hit it and
 *               you bounce off and slow down, like hitting the long-neck.
 *   sleigh      { "type": "sleigh", ... } (see game/movers.ts): a sleigh and two reindeer
 *               crossing the road on a fixed beat, bells jingling first. Solid, likewise.
 *   present     { "type": "present", "x", "y", "z", "size": 2.4, "variant": 0,
 *               "heading": 0 }: a big wrapped present by the road. Drive into it and it
 *               bursts into confetti and gives you a small boost (the session fires a
 *               level 1 blue balloon's boost on `smashed`); it's back a while later.
 *   bell        { "type": "bell", ... } (see game/movers.ts): the bell tower's bell,
 *               swinging and ringing on a fixed beat. Purely visual (and audible).
 *   ornament    { "type": "ornament", "x", "y", "z", "r": 1.5, "color": "#d82a3a" }: a
 *               giant bauble slowly turning and bobbing. Purely visual.
 *   chimney     { "type": "chimney", "x", "y", "z" }: smoke curling from a chimney.
 *   lantern     { "type": "lantern", "x", "y", "z" }: like a torch (it lights the scene
 *               when near), but a steady lantern glow: no embers.
 *   Snow powder puffs up behind karts driving through deep snow.
 *   geyser      { "type": "geyser", ... } (see game/geyser.ts): a hot spring blowing on a
 *               fixed beat of the race clock. A kart in its column as it blows is thrown
 *               into the air (keeping its speed: a free jump).
 *   icicle, thin_ice, shimmer, sparkles (see game/rift.ts): Aurora Rift's icicles that
 *               drop on a beat (a knock if you're under one), lake ice that cracks and
 *               gives way into slowing slush, crystals that flare as you pass, and ice
 *               motes glinting in the air.
 *   dust, dustwind, windmill, birds (see game/desert.ts): Desert World's dust kicked up
 *               behind karts on dirt and sand, dust blowing across the land, a ranch
 *               windmill's turning wheel and big birds circling over the canyon.
 *   boat, fountain (see game/oasis.ts): Oasis Haven's little sailing boats going round
 *               the lake on paths from route.json, with wakes, and fountains' jets.
 *   minecart    { "type": "minecart", ... } (see game/movers.ts): a runaway ore cart rattling
 *               across the mine's workings on a fixed beat, waiting glowing (and rattling)
 *               in the side tunnel first. Solid, like the sleigh.
 *   ghost, ghostrider, railcart, tumbleweed, door, wisps, mist, whispers, creak,
 *   ambience    (see game/haunt.ts): Dry Gulch's haunting: see-through ghosts at windows,
 *               over the graves and in the mine, the ghost rider on the far ridge, an ore
 *               cart rolling along the railway by itself, tumbleweeds bowling across the
 *               road, the saloon's doors swinging, green wisps and mist, whispers, creaking
 *               timber, and the night wind that falls away underground.
 *   pterosaur   { "type": "pterosaur", "route": "Flyer Path", "speed": 13, "scale": 1.6 }:
 *               a pterosaur circling high over the course along a route (its height
 *               comes from the route), flapping and gliding, banking into turns, with
 *               a cry now and then. Purely visual: it never comes down to the karts.
 *
 * Nothing here changes how the kart drives: it only reacts to where the kart is, the
 * way an item hit does (a vertical kick, a slower speed, a respawn).
 */
import * as THREE from "three";
import type { Sfx } from "../audio/sfx";
import { createKartState, type KartState } from "../vehicles/kart";
import type { GroundQuery } from "../physics/ground";
import type { Track } from "../world/track";
import type { SolidCircle } from "../world/solids";
import type { RouteFile } from "../world/trackPackage";
import { createDinoView, type DinoView } from "../render/dinosaur";
import { createDepthsLife, hasDepthsLife, type DepthsLife } from "./depthsLife";
import { createIslesLife, hasIslesLife, type IslesLife } from "./islesLife";
import { createStormView, parseStorm } from "./storm";
import { createSnowLife, hasSnowLife, type SnowLife } from "./snowLife";
import { createFestivalLife, hasFestivalLife, type FestivalLife } from "./festivalLife";
import { createMammothView } from "../render/mammoth";
import {
  createBellView,
  createOrnamentView,
  createPresentView,
  createSleighView,
  createSnowballView,
  type BellView,
  type OrnamentView,
  type PresentView,
  type SleighView,
  type SnowballView,
} from "../render/festive";
import { createPterosaurView, type PterosaurView } from "../render/pterosaur";
import {
  dustRate,
  parseBirds,
  parseDust,
  parseWind,
  parseWindmill,
  windAt,
  type DustConfig,
  type WindConfig,
} from "./desert";
import { jetVelocity, parseBoat, parseFountain, SPRAY_GRAVITY, type FountainConfig } from "./oasis";
import { createBoatView, type BoatView } from "../render/oasisFx";
import {
  createBirdsView,
  createWindmillView,
  type BirdsView,
  type WindmillView,
} from "../render/desertFx";
import { createPartyDinoView, DANCES, type Dance, type PartyDinoView } from "../render/partyDino";
import {
  doorSwing,
  ghostAt,
  openPath,
  parseAmbience,
  parseDoor,
  parseGhost,
  parseRailcart,
  parseRider,
  parseSpot,
  parseWisps,
  pathPoint,
  railcartAt,
  riderAt,
  underground,
  type AmbienceConfig,
  type DoorConfig,
  type GhostConfig,
  type RailcartConfig,
  type RiderConfig,
  type SoundSpot,
} from "./haunt";
import {
  createCartView,
  createDoorView,
  createGhostView,
  createRiderView,
  createTumbleweedView,
  createWispsView,
  type CartView,
  type DoorView,
  type GhostView,
  type RiderView,
  type TumbleweedView,
  type WispsView,
} from "../render/hauntFx";
import { createParticles } from "../render/particles";
import { createLavaBombs, type LavaBombs } from "../render/lavaBombs";
import {
  createIcicleView,
  createShimmerView,
  createThinIceView,
  type IcicleView,
  type ShimmerView,
  type ThinIceView,
} from "../render/riftFx";
import {
  icicleAt,
  icicleLanded,
  onThinIce,
  parseIcicle,
  parseThinIce,
  SLUSH_KEEP,
  stepThinIce,
  underIcicle,
  type IcicleConfig,
  type IciclePhase,
  type ThinIce,
} from "./rift";
import {
  createDragonFire,
  createDragonView,
  type DragonFireView,
  type DragonView,
} from "../render/dragon";
import {
  dragonBurns,
  dragonPhase,
  parseDragon,
  type DragonConfig,
  type DragonPhase,
} from "./dragon";
import {
  geyserBurns,
  geyserLifts,
  geyserPhase,
  parseGeyser,
  type GeyserConfig,
  type GeyserPhase,
} from "./geyser";
import {
  bellSwing,
  crossingAt,
  crossingLength,
  parseBell,
  parseCrossing,
  type BellConfig,
  type CrossingConfig,
  type CrossingPhase,
} from "./movers";

export interface HazardConfig {
  lavaBounce: number;
  lavaPush: number;
  lavaKeep: number;
  lavaImmuneSec: number;
  lavaStrikes: number;
  lavaStrikeWindowSec: number;
  lavaPenaltySec: number;
  deepWaterSec: number;
  deepWaterSink: number;
  splashSpeed: number;
  recoverImmuneSec: number;
  dinoSpeed: number;
  dinoYieldRadius: number;
  dinoBodyRadius: number;
  dinoSlow: number;
  waterfallRadius: number;
  volume: number;
}

/** Where to put a kart back: a point on the road and the way to face. */
export interface Spot {
  x: number;
  y: number;
  z: number;
  heading: number;
}

interface KartHazard {
  immune: number;
  strikes: number[];
  hold: number;
  holdAt?: Spot;
  deep: number;
  lastSurface?: string;
  /** How far the kart model sinks into water (visual). */
  sink: number;
  /** Burnt: a little smoke trail while it lasts. */
  smoking: number;
  /** Just thrown up by a geyser: not again for a moment. */
  lifted: number;
  /** Just bumped a snowball or the sleigh (for the noise, once per bump). */
  bumped: number;
}

interface Mover {
  cfg: CrossingConfig;
  sleigh: boolean;
  /** A runaway ore cart (two circles, waits glowing in the tunnel mouth first). */
  cart: boolean;
  x: number;
  y: number;
  z: number;
  heading: number;
  run: number;
  phase: CrossingPhase;
  last: CrossingPhase;
  solids: SolidCircle[];
  view?: SnowballView | SleighView | CartView;
}

interface Dino {
  path: { x: number; z: number; d: number }[];
  length: number;
  d: number;
  speed: number;
  pace: number;
  x: number;
  y: number;
  z: number;
  heading: number;
  look: number;
  solids: SolidCircle[];
  view?: DinoView;
  callIn: number;
  stepIn: number;
  mammoth: boolean;
}

interface Campfire {
  x: number;
  y: number;
  z: number;
  /** Time banked towards the next puff. */
  acc: number;
}

interface Flyer {
  path: { x: number; y: number; z: number; d: number }[];
  length: number;
  d: number;
  speed: number;
  heading: number;
  bank: number;
  view?: PterosaurView;
  callIn: number;
}

/** How many torches light the scene at once (the ones nearest the camera). */
export const TORCH_LIGHTS = 4;

interface Fall {
  x: number;
  y: number;
  z: number;
  top: number;
  width: number;
  heading: number;
  /** No roar (Celestial Dragon Festival's falls: the fireworks and music carry it). */
  silent: boolean;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);

export interface HazardEvents {
  /** The kart was burnt by lava (index). */
  burnt?: boolean;
  /** Splashed into water. */
  splashed?: "shallow" | "deep";
  /** Put back on the road. */
  respawned?: Spot;
  /** Thrown into the air by a geyser. */
  launched?: boolean;
  /** Smashed a present (a small boost: the session fires a level 1 blue boost). */
  smashed?: boolean;
  /** Bumped into a snowball or the sleigh. */
  bumped?: boolean;
  /** Hit by a falling icicle. */
  struck?: boolean;
}

/** A point in the world. */
type Point3 = { x: number; y: number; z: number };

export interface Hazards {
  /** Geysers held at rest (a cutscene playing by one: Blake, Oct 28, the geyser behind
   * Rex pulled the eye away). */
  calm: boolean;
  /** Called once per kart per physics step, after it has moved. */
  stepKart(
    i: number,
    s: KartState,
    surface: string | undefined,
    lastGate: Spot,
    dt: number,
    /** Where the kart was last on the road, grounded (for the respawn zones). */
    lastRoad?: Point3,
  ): HazardEvents;
  /** Once per physics step, after the karts: creatures walk. */
  step(karts: KartState[], dt: number): void;
  /** Solid circles of anything that walks about (for the usual solid collision). */
  readonly solids: SolidCircle[];
  /** Surfaces this module looks after (the session shouldn't respawn on them). */
  handles(surface: string | undefined): boolean;
  /** The kart's visual sink into water, metres. */
  sinkOf(i: number): number;
  /**
   * Where a kart here should be put back, if a respawn zone says (else undefined). A fall
   * can land well below the road (a wash under a jump's gap), nearer a later stretch of
   * the lap than the zone, so the kart's last spot on the road is tried too.
   */
  respawnSpot(x: number, y: number, z: number, lastRoad?: Point3): Spot | undefined;
  render(t: number, dt: number, listener: { x: number; y: number; z: number }): void;
  readonly dinos: { x: number; y: number; z: number }[];
  /** Where the flyers are (for tests and the camera). */
  readonly flyers: { x: number; y: number; z: number }[];
  /** Impact Depths' life and air (game/depthsLife.ts), if the course has any. */
  readonly depths?: DepthsLife;
  /** Dragon Isles' dragon, villagers and mill wheels (game/islesLife.ts), if any. */
  readonly isles?: IslesLife;
  /** Snow Dragon Pass's blizzard, prayer flags, bells and avalanches (game/snowLife.ts). */
  readonly snow?: SnowLife;
  /** Celestial Dragon Festival's fireworks, lanterns and observatory (game/festivalLife.ts). */
  readonly festival?: FestivalLife;
  dispose(): void;
}

export function createHazards(opts: {
  root: THREE.Object3D;
  track: Track;
  entities: unknown[];
  routes: RouteFile["routes"];
  makeGround: () => GroundQuery;
  sfx?: Sfx;
  cfg: HazardConfig;
  karts: number;
  /** Demo / headless: no sound. */
  quiet?: boolean;
  /** No 3D (tests). */
  headless?: boolean;
  /** The race clock (seconds; negative in the countdown). Timed hazards (the dragon)
   * follow it, so every race sees the same attacks. Defaults to the hazards' own. */
  clock?: () => number;
  /** The player's lap (the festival grows with it), if there's a race. */
  lap?: () => { lap: number; laps: number; finished: boolean } | undefined;
}): Hazards {
  const { cfg, track } = opts;
  const vol = () => (opts.quiet ? 0 : cfg.volume);
  const per: KartHazard[] = Array.from({ length: opts.karts }, () => ({
    immune: 0,
    strikes: [],
    hold: 0,
    deep: 0,
    sink: 0,
    smoking: 0,
    lifted: 0,
    bumped: 0,
  }));
  const group = new THREE.Group();
  group.name = "hazards";
  if (!opts.headless) opts.root.add(group);
  const spray = opts.headless ? undefined : createParticles(group, { max: 400, size: 0.55 });
  const smoke = opts.headless
    ? undefined
    : createParticles(group, { max: 200, size: 0.8, gravity: 2.5, opacity: 0.8 });
  const sparks = opts.headless
    ? undefined
    : createParticles(group, { max: 160, size: 0.4, gravity: -6, additive: true });
  // Snow: created only on tracks that ask for it (see the snowfall entity).
  let snow: ReturnType<typeof createParticles> | undefined;

  // ---------------------------------------------------------------- entities
  const zones: { from: number; to: number; at: number }[] = [];
  const dinos: Dino[] = [];
  const falls: Fall[] = [];
  const fires: Campfire[] = [];
  const torches: { x: number; y: number; z: number; acc: number; embers: boolean }[] = [];
  let snowfall: { rate: number; radius: number; acc: number } | undefined;
  /** Bubbling pools, and fireflies (see the bubbles and fireflies entities). */
  const pools: {
    x: number;
    y: number;
    z: number;
    r: number;
    acc: number;
    burp: number;
    lava: boolean;
  }[] = [];
  let fireflies: { rate: number; radius: number; acc: number } | undefined;
  /** Dragons, and what they were doing last frame (for their cues). */
  const dragons: {
    cfg: DragonConfig;
    view?: DragonView;
    flames?: DragonFireView;
    marker?: THREE.Mesh;
    last: DragonPhase;
    acc: number;
  }[] = [];
  let fire: ReturnType<typeof createParticles> | undefined;
  const eruptions: {
    x: number;
    y: number;
    z: number;
    period: number;
    offset: number;
    last: number;
    light?: THREE.PointLight;
  }[] = [];
  let ashfall: { rate: number; radius: number; acc: number } | undefined;
  let storm: ReturnType<typeof createStormView> | undefined;
  const vents: { x: number; y: number; z: number; acc: number }[] = [];
  /** Geysers, and what they were doing last frame (for their cues). */
  const geysers: {
    cfg: GeyserConfig;
    last: GeyserPhase;
    acc: number;
    column?: THREE.Mesh;
    /** A lava geyser's vent, glowing on the road as it gets ready to blow. */
    ring?: THREE.Mesh;
  }[] = [];
  let jets: ReturnType<typeof createParticles> | undefined;
  let lavaJets: ReturnType<typeof createParticles> | undefined;
  /** Rolling snowballs and the sleigh (see game/movers.ts). */
  const movers: Mover[] = [];
  /** Presents by the road: `down` counts down while one is smashed. */
  const presents: {
    x: number;
    y: number;
    z: number;
    size: number;
    down: number;
    view?: PresentView;
  }[] = [];
  const bells: { cfg: BellConfig; ringing: boolean; view?: BellView }[] = [];
  const ornaments: OrnamentView[] = [];
  const chimneys: { x: number; y: number; z: number; acc: number }[] = [];
  let confetti: ReturnType<typeof createParticles> | undefined;
  let bombs: ReturnType<typeof createParticles> | undefined;
  let rocks: LavaBombs | undefined;
  let bombSmoke: ReturnType<typeof createParticles> | undefined;
  let ash: ReturnType<typeof createParticles> | undefined;
  let glowing: ReturnType<typeof createParticles> | undefined;
  const flyers: (Flyer & { x: number; y: number; z: number })[] = [];
  /** Aurora Rift: falling icicles, cracking lake ice, flaring crystals, ice motes. */
  const icicles: { cfg: IcicleConfig; last: IciclePhase; view?: IcicleView }[] = [];
  const thin: { p: ThinIce; view?: ThinIceView }[] = [];
  const thinEvents: { x: number; y: number; z: number; kind: "crack" | "break" | "freeze" }[] = [];
  const shimmers: { x: number; y: number; z: number; level: number; view?: ShimmerView }[] = [];
  let sparkles: { rate: number; radius: number; acc: number } | undefined;
  /** Desert World: dust trails, blowing dust, the windmill, the birds. */
  let dust: DustConfig | undefined;
  let wind: (WindConfig & { acc: number }) | undefined;
  let dusty: ReturnType<typeof createParticles> | undefined;
  const dustAcc: number[] = Array.from({ length: opts.karts }, () => Math.random());
  const windmills: WindmillView[] = [];
  /** Dry Gulch: the haunting (see game/haunt.ts). */
  const ghosts: { cfg: GhostConfig; view?: GhostView; shown: boolean }[] = [];
  const riders: { cfg: RiderConfig; path: ReturnType<typeof openPath>; view?: RiderView }[] = [];
  const railcarts: {
    cfg: RailcartConfig;
    path: ReturnType<typeof openPath>;
    view?: CartView;
    moving: boolean;
  }[] = [];
  const tumbleweeds: {
    cfg: CrossingConfig;
    r: number;
    y: number;
    view?: TumbleweedView;
  }[] = [];
  const doors: { cfg: DoorConfig; view?: DoorView; open: boolean }[] = [];
  const wisps: WispsView[] = [];
  const mists: (SoundSpot & { rate: number; acc: number; color?: number })[] = [];
  let mistPuffs: ReturnType<typeof createParticles> | undefined;
  const whispers: (SoundSpot & { next: number })[] = [];
  const creaks: (SoundSpot & { next: number })[] = [];
  let ambience: AmbienceConfig | undefined;
  let windLoop: ReturnType<Sfx["ambience"]> | undefined;
  let droneLoop: ReturnType<Sfx["ambience"]> | undefined;
  /** Oasis Haven: boats on the lake, fountains. */
  const boats: (BoatView & { acc: number })[] = [];
  const fountains: (FountainConfig & { acc: number[] })[] = [];
  let fountainSpray: ReturnType<typeof createParticles> | undefined;
  const flocks: BirdsView[] = [];
  let motes: ReturnType<typeof createParticles> | undefined;
  /** Partygoers: dancing on the spot, or round a conga circle (`ring`). */
  const party: {
    x: number;
    y: number;
    z: number;
    heading: number;
    dance: Dance;
    phase: number;
    ring?: { x: number; y: number; z: number; r: number; speed: number; at: number };
    view?: PartyDinoView;
  }[] = [];
  const ground = opts.makeGround();
  for (const e of opts.entities) {
    if (!isObj(e)) continue;
    if (e.type === "respawn")
      zones.push({ from: num(e.from, 0), to: num(e.to, 0), at: num(e.at, 0) });
    else if (e.type === "campfire")
      fires.push({ x: num(e.x, 0), y: num(e.y, 0), z: num(e.z, 0), acc: 0 });
    else if (e.type === "snowfall")
      snowfall = {
        rate: Math.max(0, num(e.rate, 100)),
        radius: Math.max(5, num(e.radius, 40)),
        acc: 0,
      };
    else if (e.type === "bubbles")
      pools.push({
        x: num(e.x, 0),
        y: num(e.y, 0),
        z: num(e.z, 0),
        r: Math.max(0.5, num(e.r, 3)),
        acc: 0,
        burp: 2 + Math.random() * 6,
        lava: e.molten === true,
      });
    else if (e.type === "eruption") {
      const er = {
        x: num(e.x, 0),
        y: num(e.y, 0),
        z: num(e.z, 0),
        period: Math.max(4, num(e.period, 12)),
        offset: num(e.offset, 0),
        last: -1,
        light: undefined as THREE.PointLight | undefined,
      };
      if (!opts.headless) {
        er.light = new THREE.PointLight(0xff5a20, 0, 1400, 1.1);
        er.light.position.set(er.x, er.y + 40, er.z);
        group.add(er.light);
      }
      eruptions.push(er);
    } else if (e.type === "storm") {
      if (!opts.headless) storm = createStormView(group, parseStorm(e));
    } else if (e.type === "ashfall")
      ashfall = {
        rate: Math.max(0, num(e.rate, 60)),
        radius: Math.max(5, num(e.radius, 40)),
        acc: 0,
      };
    else if (e.type === "steam")
      vents.push({ x: num(e.x, 0), y: num(e.y, 0), z: num(e.z, 0), acc: 0 });
    else if (e.type === "geyser") {
      const g = parseGeyser(e);
      let column: THREE.Mesh | undefined;
      let ring: THREE.Mesh | undefined;
      if (!opts.headless) {
        // The column: a tall, pale, see-through cone, grown and shrunk as it blows (a
        // lava geyser's is fire).
        column = new THREE.Mesh(
          new THREE.CylinderGeometry(g.r * 0.75, g.r * 0.45, 1, 10, 1, true).translate(0, 0.5, 0),
          new THREE.MeshBasicMaterial({
            color: g.lava ? 0xff6a1a : 0xeafcff,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: g.lava ? THREE.AdditiveBlending : THREE.NormalBlending,
          }),
        );
        column.position.set(g.x, g.y, g.z);
        column.visible = false;
        column.renderOrder = 2;
        group.add(column);
        if (g.lava) {
          // The vent: a glowing ring on the road that brightens as it gets ready.
          ring = new THREE.Mesh(
            new THREE.CircleGeometry(g.r, 20).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({
              color: 0xff5a10,
              transparent: true,
              opacity: 0.25,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
              polygonOffset: true,
              polygonOffsetFactor: -4,
            }),
          );
          ring.position.set(g.x, g.y + 0.12, g.z);
          ring.renderOrder = 3;
          group.add(ring);
        }
      }
      geysers.push({ cfg: g, last: "idle", acc: 0, column, ring });
    } else if (e.type === "dragon") {
      const cfg = parseDragon(e);
      let marker: THREE.Mesh | undefined;
      if (!opts.headless) {
        // The burn zone, glowing on the road while the dragon draws breath.
        marker = new THREE.Mesh(
          new THREE.PlaneGeometry(cfg.fire.width, cfg.fire.length),
          new THREE.MeshBasicMaterial({
            color: 0xff3a10,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        );
        marker.rotation.order = "YXZ";
        marker.rotation.set(-Math.PI / 2, cfg.fire.heading, 0);
        marker.position.set(cfg.fire.x, cfg.fire.y + 0.25, cfg.fire.z);
        marker.renderOrder = 3;
        group.add(marker);
      }
      dragons.push({
        cfg,
        view: opts.headless
          ? undefined
          : createDragonView(
              group,
              { x: cfg.x, y: cfg.y, z: cfg.z },
              cfg.heading,
              cfg.scale,
              cfg.look,
            ),
        marker,
        flames: opts.headless ? undefined : createDragonFire(group, cfg.fire),
        last: "idle",
        acc: 0,
      });
    } else if (e.type === "fireflies")
      fireflies = {
        rate: Math.max(0, num(e.rate, 30)),
        radius: Math.max(5, num(e.radius, 30)),
        acc: 0,
      };
    else if (e.type === "torch")
      torches.push({
        x: num(e.x, 0),
        y: num(e.y, 0),
        z: num(e.z, 0),
        acc: Math.random(),
        embers: true,
      });
    else if (e.type === "lantern")
      torches.push({
        x: num(e.x, 0),
        y: num(e.y, 0),
        z: num(e.z, 0),
        acc: Math.random(),
        embers: false,
      });
    else if (e.type === "icicle") {
      const ic = parseIcicle(e);
      icicles.push({
        cfg: ic,
        last: "hanging",
        view: opts.headless ? undefined : createIcicleView(group, ic),
      });
    } else if (e.type === "thin_ice") {
      const p = parseThinIce(e, opts.karts);
      thin.push({
        p,
        view: opts.headless ? undefined : createThinIceView(group, p, thin.length + 1),
      });
    } else if (e.type === "shimmer") {
      const x = num(e.x, 0);
      const y = num(e.y, 0);
      const z = num(e.z, 0);
      shimmers.push({
        x,
        y,
        z,
        level: 0,
        view: opts.headless
          ? undefined
          : createShimmerView(
              group,
              x,
              y,
              z,
              Math.max(0.3, num(e.size, 1.4)),
              typeof e.color === "string" ? e.color : "#5ae8ff",
              shimmers.length * 0.7,
            ),
      });
    } else if (e.type === "sparkles")
      sparkles = {
        rate: Math.max(0, num(e.rate, 36)),
        radius: Math.max(5, num(e.radius, 34)),
        acc: 0,
      };
    else if (e.type === "dust") dust = parseDust(e);
    else if (e.type === "dustwind") wind = { ...parseWind(e), acc: 0 };
    else if (e.type === "boat") {
      const b = parseBoat(e, opts.routes);
      if (b && !opts.headless) boats.push(Object.assign(createBoatView(group, b), { acc: 0 }));
    } else if (e.type === "fountain") {
      const f = parseFountain(e);
      fountains.push({ ...f, acc: Array.from({ length: f.jets + 1 }, () => Math.random()) });
    } else if (e.type === "windmill") {
      if (!opts.headless) windmills.push(createWindmillView(group, parseWindmill(e)));
    } else if (e.type === "birds") {
      if (!opts.headless) flocks.push(createBirdsView(group, parseBirds(e)));
    } else if (e.type === "chimney")
      chimneys.push({ x: num(e.x, 0), y: num(e.y, 0), z: num(e.z, 0), acc: Math.random() });
    else if (e.type === "snowball" || e.type === "sleigh" || e.type === "minecart") {
      const sleigh = e.type === "sleigh";
      const cart = e.type === "minecart";
      const c = parseCrossing(e, sleigh, cart);
      const parts = sleigh ? 3 : cart ? 2 : 1;
      const mover: Mover = {
        cfg: c,
        sleigh,
        cart,
        x: c.a.x,
        y: c.a.y,
        z: c.a.z,
        heading: 0,
        run: 0,
        phase: "idle",
        last: "idle",
        solids: Array.from({ length: parts }, () => ({
          kind: "circle" as const,
          look: "creature" as const,
          x: 1e6,
          z: 1e6,
          radius: sleigh ? 1.9 : cart ? c.r : c.r * 0.92,
          height: -1e6,
        })),
      };
      if (!opts.headless)
        mover.view = cart
          ? createCartView(group)
          : sleigh
            ? createSleighView(group)
            : createSnowballView(group, c.r);
      movers.push(mover);
    } else if (e.type === "ghost") {
      const g = parseGhost(e);
      ghosts.push({
        cfg: g,
        view: opts.headless ? undefined : createGhostView(group, g.look, g.scale),
        shown: false,
      });
    } else if (e.type === "ghostrider" || e.type === "railcart") {
      const r = opts.routes.find((q) => q.id === e.route);
      if (!r || r.points.length < 2) continue;
      const path = openPath(r.points);
      if (e.type === "ghostrider")
        riders.push({
          cfg: parseRider(e),
          path,
          view: opts.headless ? undefined : createRiderView(group),
        });
      else
        railcarts.push({
          cfg: parseRailcart(e),
          path,
          view: opts.headless ? undefined : createCartView(group),
          moving: false,
        });
    } else if (e.type === "tumbleweed") {
      const c = parseCrossing(e);
      const r = Math.max(0.3, num(e.r, 0.8));
      tumbleweeds.push({
        cfg: c,
        r,
        y: c.a.y,
        view: opts.headless ? undefined : createTumbleweedView(group, r),
      });
    } else if (e.type === "door") {
      const d = parseDoor(e);
      doors.push({
        cfg: d,
        view: opts.headless ? undefined : createDoorView(group, d.x, d.y, d.z, d.heading, d.width),
        open: false,
      });
    } else if (e.type === "wisps") {
      if (!opts.headless) wisps.push(createWispsView(group, parseWisps(e)));
    } else if (e.type === "mist")
      mists.push({
        ...parseSpot(e, 10),
        rate: Math.max(0, num(e.rate, 6)),
        acc: 0,
        // (A colour of its own: a waterfall's white spray, low over its pool.)
        ...(typeof e.color === "string" ? { color: parseInt(e.color.replace("#", ""), 16) } : {}),
      });
    else if (e.type === "whispers")
      whispers.push({ ...parseSpot(e, 50), next: 2 + Math.random() * 4 });
    else if (e.type === "creak") creaks.push({ ...parseSpot(e, 30), next: Math.random() * 3 });
    else if (e.type === "ambience") ambience = parseAmbience(e);
    else if (e.type === "present") {
      const size = Math.max(0.8, num(e.size, 2.4));
      const x = num(e.x, 0);
      const y = num(e.y, 0);
      const z = num(e.z, 0);
      presents.push({
        x,
        y,
        z,
        size,
        down: 0,
        view: opts.headless
          ? undefined
          : createPresentView(
              group,
              x,
              y,
              z,
              size,
              num(e.variant, presents.length),
              num(e.heading, 0),
            ),
      });
    } else if (e.type === "bell") {
      const b = parseBell(e);
      bells.push({
        cfg: b,
        ringing: false,
        view: opts.headless
          ? undefined
          : createBellView(group, b.x, b.y, b.z, b.heading, num(e.scale, 1)),
      });
    } else if (e.type === "ornament") {
      if (!opts.headless)
        ornaments.push(
          createOrnamentView(
            group,
            num(e.x, 0),
            num(e.y, 0),
            num(e.z, 0),
            Math.max(0.3, num(e.r, 1.5)),
            typeof e.color === "string" ? e.color : "#d82a3a",
          ),
        );
    } else if (e.type === "partygoer") {
      const dance = (DANCES as readonly string[]).includes(String(e.dance))
        ? (e.dance as Dance)
        : "bounce";
      party.push({
        x: num(e.x, 0),
        y: num(e.y, 0),
        z: num(e.z, 0),
        heading: num(e.heading, 0),
        dance,
        phase: party.length * 0.37,
        view: opts.headless ? undefined : createPartyDinoView(group, num(e.variant, party.length)),
      });
    } else if (e.type === "conga") {
      const count = Math.max(1, Math.min(16, Math.round(num(e.count, 6))));
      const r = Math.max(2, num(e.radius, 6));
      for (let k = 0; k < count; k++)
        party.push({
          x: num(e.x, 0),
          y: num(e.y, 0),
          z: num(e.z, 0),
          heading: 0,
          dance: "conga",
          // In step: the whole line dances together.
          phase: 0,
          ring: {
            x: num(e.x, 0),
            y: num(e.y, 0),
            z: num(e.z, 0),
            r,
            speed: num(e.speed, 1.4),
            at: (k / count) * Math.PI * 2 * 0.8,
          },
          view: opts.headless ? undefined : createPartyDinoView(group, k + 2, 0.95),
        });
    } else if (e.type === "pterosaur") {
      const r = opts.routes.find((q) => q.id === e.route);
      if (!r || r.points.length < 3) continue;
      let d = 0;
      const path = r.points.map((p, k) => {
        if (k) d += Math.hypot(p.x - r.points[k - 1]!.x, p.z - r.points[k - 1]!.z);
        return { x: p.x, y: p.y, z: p.z, d };
      });
      const first = r.points[0]!;
      const last = r.points[r.points.length - 1]!;
      flyers.push({
        path,
        length: d + Math.hypot(first.x - last.x, first.z - last.z),
        d: num(e.start, 0),
        speed: num(e.speed, 12),
        heading: 0,
        bank: 0,
        x: first.x,
        y: first.y,
        z: first.z,
        view: opts.headless ? undefined : createPterosaurView(group, num(e.scale, 1)),
        callIn: 5,
      });
    } else if (e.type === "waterfall")
      falls.push({
        x: num(e.x, 0),
        y: num(e.y, 0),
        z: num(e.z, 0),
        top: num(e.top, 10),
        width: num(e.width, 10),
        heading: num(e.heading, 0),
        silent: e.sound === false,
      });
    else if (e.type === "dinosaur") {
      const r = opts.routes.find((q) => q.id === e.route);
      if (!r || r.points.length < 3) continue;
      const path: Dino["path"] = [];
      let d = 0;
      r.points.forEach((p, k) => {
        if (k) d += Math.hypot(p.x - r.points[k - 1]!.x, p.z - r.points[k - 1]!.z);
        path.push({ x: p.x, z: p.z, d });
      });
      const first = r.points[0]!;
      const last = r.points[r.points.length - 1]!;
      const length = d + Math.hypot(first.x - last.x, first.z - last.z);
      const scale = num(e.scale, 1);
      const dino: Dino = {
        path,
        length,
        d: num(e.start, 0),
        speed: num(e.speed, cfg.dinoSpeed),
        pace: 1,
        x: first.x,
        y: first.y,
        z: first.z,
        heading: 0,
        look: 0,
        solids: [0, 1].map(() => ({
          kind: "circle" as const,
          look: "creature" as const,
          x: 0,
          z: 0,
          radius: cfg.dinoBodyRadius * scale,
          height: 1e3,
        })),
        view: opts.headless
          ? undefined
          : e.model === "mammoth"
            ? createMammothView(group, scale)
            : createDinoView(group, scale),
        callIn: 6 + dinos.length * 2.5,
        stepIn: 0,
        mammoth: e.model === "mammoth",
      };
      dinos.push(dino);
    }
  }
  const solids: SolidCircle[] = [
    ...dinos.flatMap((d) => d.solids),
    ...movers.flatMap((m) => m.solids),
  ];

  /** Put a snowball or the sleigh where the race clock says, on the ground. */
  function placeMover(m: Mover) {
    const c = crossingAt(m.cfg, raceClock());
    m.phase = c.phase;
    m.heading = c.heading;
    const fx = Math.sin(c.heading);
    const fz = Math.cos(c.heading);
    if (c.phase !== "crossing") {
      if (m.cart && c.phase === "warning") {
        // Waiting in the side tunnel's mouth, creeping forward a little.
        m.x = c.x;
        m.z = c.z;
        m.y = ground.at(c.x, c.z, Math.max(c.y, m.y) + 4).height;
      }
      for (const sd of m.solids) {
        sd.x = 1e6;
        sd.z = 1e6;
        sd.height = -1e6;
      }
      m.run = 0;
      return;
    }
    const len = Math.hypot(m.cfg.b.x - m.cfg.a.x, m.cfg.b.z - m.cfg.a.z);
    m.run = c.u * len;
    m.x = c.x;
    m.z = c.z;
    m.y = ground.at(c.x, c.z, Math.max(c.y, m.y) + 4).height;
    // Snowball: one circle. Sleigh: the reindeer in front, the sleigh behind. Cart:
    // its front and back.
    const offs = m.sleigh ? [3.0, 0.0, -3.4] : m.cart ? [0.8, -0.8] : [0];
    m.solids.forEach((sd, k) => {
      sd.x = m.x + fx * offs[k]!;
      sd.z = m.z + fz * offs[k]!;
      sd.height = m.y + (m.sleigh ? 3.5 : m.cart ? 2.0 : m.cfg.r * 1.9);
    });
  }

  function pathAt(dn: Dino, d: number) {
    d = ((d % dn.length) + dn.length) % dn.length;
    const p = dn.path;
    let i = p.length - 1;
    for (let k = 1; k < p.length; k++)
      if (p[k]!.d > d) {
        i = k - 1;
        break;
      }
    const a = p[i]!;
    const b = p[(i + 1) % p.length]!;
    const span = (i + 1 < p.length ? b.d : dn.length) - a.d;
    const f = span > 0 ? (d - a.d) / span : 0;
    return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f };
  }

  function placeDino(dn: Dino) {
    const a = pathAt(dn, dn.d);
    const b = pathAt(dn, dn.d + 2);
    dn.x = a.x;
    dn.z = a.z;
    dn.heading = Math.atan2(b.x - a.x, b.z - a.z);
    dn.y = ground.at(dn.x, dn.z, dn.y + 2).height;
    // Two circles: chest and hips, along the body.
    const fx = Math.sin(dn.heading);
    const fz = Math.cos(dn.heading);
    const s = dn.solids[0]!.radius / cfg.dinoBodyRadius;
    dn.solids[0]!.x = dn.x + fx * 2.2 * s;
    dn.solids[0]!.z = dn.z + fz * 2.2 * s;
    dn.solids[1]!.x = dn.x - fx * 1.6 * s;
    dn.solids[1]!.z = dn.z - fz * 1.6 * s;
  }
  for (const d of dinos) {
    d.y = ground.at(d.x, d.z, d.y + 50).height;
    placeDino(d);
  }

  /** A smooth point on a flyer's loop (Catmull-Rom through the route's points). */
  function flyAt(f: Flyer, d: number) {
    d = ((d % f.length) + f.length) % f.length;
    const p = f.path;
    const n = p.length;
    let i = n - 1;
    for (let k = 1; k < n; k++)
      if (p[k]!.d > d) {
        i = k - 1;
        break;
      }
    const span = (i + 1 < n ? p[i + 1]!.d : f.length) - p[i]!.d;
    const u = span > 0 ? (d - p[i]!.d) / span : 0;
    const P = (k: number) => p[(((i + k) % n) + n) % n]!;
    const cr = (a: number, b: number, c: number, e: number) =>
      0.5 *
      (2 * b +
        (-a + c) * u +
        (2 * a - 5 * b + 4 * c - e) * u * u +
        (-a + 3 * b - 3 * c + e) * u * u * u);
    const [a, b, c, e] = [P(-1), P(0), P(1), P(2)];
    return {
      x: cr(a.x, b.x, c.x, e.x),
      y: cr(a.y, b.y, c.y, e.y),
      z: cr(a.z, b.z, c.z, e.z),
    };
  }
  function placeFlyer(f: (typeof flyers)[number], dt: number) {
    const a = flyAt(f, f.d);
    const b = flyAt(f, f.d + 4);
    const heading = Math.atan2(b.x - a.x, b.z - a.z);
    if (dt > 0) {
      // Bank into the turn: how fast the heading is changing.
      const turn = (((heading - f.heading + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) / dt;
      const want = Math.max(-0.7, Math.min(0.7, turn * 0.9));
      f.bank += (want - f.bank) * (1 - Math.exp(-2 * dt));
    }
    f.heading = heading;
    f.x = a.x;
    f.y = a.y;
    f.z = a.z;
  }
  for (const f of flyers) placeFlyer(f, 0);

  // The torchlight: a few warm point lights, moved to the torches nearest the camera.
  const torchLights: THREE.PointLight[] = [];
  if (torches.length && !opts.headless)
    for (let k = 0; k < Math.min(TORCH_LIGHTS, torches.length); k++) {
      const l = new THREE.PointLight(0xffa04a, 0, 20, 1.4);
      l.castShadow = false;
      group.add(l);
      torchLights.push(l);
    }

  /** The route position `at` metres along the lap, as a respawn spot. */
  function spotAt(at: number): Spot {
    const ss = track.samples;
    const L = track.length;
    const d = ((at % L) + L) % L;
    let best = ss[0]!;
    // A hair of slack: (at % L + L) % L can land a rounding error short of a sample's
    // own distance (it differs between JavaScript engines), which picked the one before.
    for (const q of ss) if (q.dist <= d + 1e-6) best = q;
    return {
      x: best.pos.x,
      y: best.pos.y,
      z: best.pos.z,
      heading: Math.atan2(best.forward.x, best.forward.z),
    };
  }

  /** The route sample nearest a point (height counts, for layered tracks). */
  function nearestSample(x: number, y: number, z: number) {
    let near = track.samples[0]!;
    let nd = Infinity;
    for (const q of track.samples) {
      const d = (q.pos.x - x) ** 2 + (q.pos.z - z) ** 2 + ((q.pos.y - y) * 2) ** 2;
      if (d < nd) {
        nd = d;
        near = q;
      }
    }
    return near;
  }

  function zoneAt(x: number, y: number, z: number): Spot | undefined {
    const p = nearestSample(x, y, z).dist;
    for (const zn of zones) if (p >= zn.from && p <= zn.to) return spotAt(zn.at);
    return undefined;
  }

  function respawnSpot(x: number, y: number, z: number, lastRoad?: Point3): Spot | undefined {
    if (!zones.length) return undefined;
    return (
      zoneAt(x, y, z) ??
      (lastRoad && Number.isFinite(lastRoad.x)
        ? zoneAt(lastRoad.x, lastRoad.y, lastRoad.z)
        : undefined)
    );
  }

  function putBack(s: KartState, at: Spot) {
    const bananas = s.bananas;
    Object.assign(s, createKartState(at.x, at.z, at.heading, at.y));
    s.bananas = bananas;
  }

  let rush: ReturnType<Sfx["rush"]> | undefined;
  /** Seconds of racing so far (for counting burns), advanced by step(). */
  let clock = 0;
  const lastPos = per.map(() => ({ x: NaN, z: NaN }));

  const tmpTarget = new THREE.Vector3();
  const tmpMouth = new THREE.Vector3();
  /** The race clock the timed hazards follow. */
  const raceClock = () => (opts.clock ? opts.clock() : clock);

  /**
   * The burning bounce, shared by lava and dragon fire: up, back towards the road and
   * slower, with a sizzle; three in a few seconds and you're put back at the last
   * checkpoint, held still a moment.
   */
  function burn(i: number, s: KartState, h: KartHazard, ev: HazardEvents, back: () => Spot) {
    h.strikes = h.strikes.filter((t) => clock - t < cfg.lavaStrikeWindowSec);
    h.strikes.push(clock);
    ev.burnt = true;
    if (h.strikes.length >= cfg.lavaStrikes) {
      // Too many: back to the checkpoint, held still for a moment.
      const at = back();
      putBack(s, at);
      h.hold = cfg.lavaPenaltySec;
      h.holdAt = at;
      h.strikes = [];
      h.immune = cfg.recoverImmuneSec + cfg.lavaPenaltySec;
      ev.respawned = at;
      if (i === 0) opts.sfx?.recover(vol());
    } else {
      // Up, and back towards the road, slower.
      const near = nearestSample(s.x, s.y, s.z);
      const dx = near.pos.x - s.x;
      const dz = near.pos.z - s.z;
      const dl = Math.hypot(dx, dz) || 1;
      const vx = Math.sin(s.velAngle) * s.speed * cfg.lavaKeep + (dx / dl) * cfg.lavaPush;
      const vz = Math.cos(s.velAngle) * s.speed * cfg.lavaKeep + (dz / dl) * cfg.lavaPush;
      s.speed = Math.hypot(vx, vz);
      s.velAngle = Math.atan2(vx, vz);
      s.vy = cfg.lavaBounce;
      s.y += 0.05;
      s.grounded = false;
      h.immune = cfg.lavaImmuneSec;
      h.smoking = 1.4;
      if (i === 0) opts.sfx?.sizzle(vol());
    }
    sparks?.burst(s.x, s.y + 0.4, s.z, 18, 4, 7, 0.7, 0xffa030);
    smoke?.burst(s.x, s.y + 0.6, s.z, 8, 1.5, 1.5, 1.1, 0x5a4a48);
  }

  // Celestial Dragon Festival: the fireworks, the lanterns, the observatory's rings.
  const festival = hasFestivalLife(opts.entities)
    ? createFestivalLife({
        group,
        entities: opts.entities,
        track,
        sfx: opts.sfx,
        volume: vol,
        clock: raceClock,
        lap: opts.lap,
        quiet: opts.quiet,
        headless: opts.headless,
      })
    : undefined;
  // Impact Depths: triceratops, raptors, meteors, the core, motes, glows and the air.
  // Dragon Isles: the great dragon, the villagers, the mill wheels.
  const isles = hasIslesLife(opts.entities)
    ? createIslesLife({
        group,
        entities: opts.entities,
        track,
        ground,
        sfx: opts.sfx,
        volume: vol,
        quiet: opts.quiet,
        headless: opts.headless,
        stage: festival ? () => festival.stage() : undefined,
      })
    : undefined;
  const depths = hasDepthsLife(opts.entities)
    ? createDepthsLife({
        group,
        entities: opts.entities,
        ground,
        sfx: opts.sfx,
        volume: vol,
        quiet: opts.quiet,
        headless: opts.headless,
        clock: raceClock,
        slow: cfg.dinoSlow,
        hush: isles ? () => isles.hush() : undefined,
      })
    : undefined;
  if (depths) solids.push(...depths.solids);
  // Snow Dragon Pass: the blizzard, the prayer flags, the bells, the avalanches.
  const snowLife = hasSnowLife(opts.entities)
    ? createSnowLife({
        group,
        entities: opts.entities,
        ground,
        sfx: opts.sfx,
        volume: vol,
        clock: raceClock,
        quiet: opts.quiet,
        headless: opts.headless,
      })
    : undefined;

  const hazards: Hazards = {
    calm: false,
    solids,
    depths,
    isles,
    snow: snowLife,
    festival,
    dinos,
    flyers,
    handles: (surface) => surface === "lava" || surface === "deep_water",
    sinkOf: (i) => per[i]?.sink ?? 0,
    respawnSpot,
    stepKart(i, s, surface, lastGate, dt, lastRoad) {
      const h = per[i]!;
      const ev: HazardEvents = {};
      h.immune = Math.max(0, h.immune - dt);
      h.smoking = Math.max(0, h.smoking - dt);
      // Held at a checkpoint (the penalty after too many burns).
      if (h.hold > 0) {
        h.hold -= dt;
        if (h.holdAt) putBack(s, h.holdAt);
        return ev;
      }
      const ground = s.grounded ? surface : undefined;
      const back = () => respawnSpot(s.x, s.y, s.z, lastRoad) ?? lastGate;
      // ---- lava, and dragon fire: the burning bounce
      const t = raceClock();
      const scorched = ground === "lava";
      const flamed =
        dragons.some((d) => dragonBurns(d.cfg, t, s.x, s.y, s.z)) ||
        geysers.some((g) => geyserBurns(g.cfg, t, s.x, s.y, s.z));
      if ((scorched || flamed) && h.immune <= 0) burn(i, s, h, ev, back);
      // ---- geysers: thrown into the air (speed and heading kept)
      h.lifted = Math.max(0, h.lifted - dt);
      if (h.lifted <= 0)
        for (const g of geysers)
          if (geyserLifts(g.cfg, t, s.x, s.y, s.z)) {
            s.vy = Math.max(s.vy, g.cfg.launch);
            s.y += 0.05;
            s.grounded = false;
            h.lifted = 1.0;
            ev.launched = true;
            spray?.burst(s.x, s.y + 0.3, s.z, 26, 4, 9, 0.9, 0xe8fbff);
            if (i === 0) opts.sfx?.splash(vol(), true);
            break;
          }
      // ---- presents: drive into one and it bursts
      for (const p of presents) {
        if (p.down > 0) continue;
        if (Math.hypot(s.x - p.x, s.z - p.z) < p.size * 0.75 + 1.1 && s.y < p.y + p.size * 1.3) {
          p.down = 14;
          ev.smashed = true;
          confetti?.burst(p.x, p.y + p.size * 0.6, p.z, 40, 6, 7, 1.6, 0xffffff);
          if (confetti)
            for (let k = 0; k < 40; k++)
              confetti.emit(
                p.x,
                p.y + p.size * 0.5,
                p.z,
                (Math.random() - 0.5) * 9,
                4 + Math.random() * 6,
                (Math.random() - 0.5) * 9,
                1.4 + Math.random(),
                [0xe8303a, 0x2eaa4a, 0xf6d040, 0x3a7ae8, 0xffffff][k % 5]!,
              );
          if (i === 0) opts.sfx?.present(vol());
        }
      }
      // ---- snowballs and the sleigh: a bump that slows you (the solid circles push
      // you out; this takes some speed, and makes the noise)
      for (const m of movers) {
        if (m.phase !== "crossing") continue;
        for (const c of m.solids)
          if (Math.hypot(s.x - c.x, s.z - c.z) < c.radius + 1.3 && s.y < c.height) {
            s.speed *= Math.pow(cfg.dinoSlow, dt * 6);
            if (h.bumped <= 0) {
              h.bumped = 0.8;
              ev.bumped = true;
              spray?.burst(s.x, s.y + 0.6, s.z, 18, 4, 4, 0.8, 0xf4f8ff);
              if (i === 0) opts.sfx?.thud(vol());
            }
          }
      }
      if (depths) {
        const r = depths.stepKart(s, dt);
        if (r.bumped && h.bumped <= 0) {
          h.bumped = 0.8;
          ev.bumped = true;
          if (i === 0) opts.sfx?.thud(vol());
        }
      }
      h.bumped = Math.max(0, h.bumped - dt);
      // ---- falling icicles: under one as it lands, you're knocked (slower, a hop)
      for (const ic of icicles)
        if (icicleLanded(ic.cfg, t - dt, t) && underIcicle(ic.cfg, s.x, s.y, s.z)) {
          s.speed *= 0.5;
          s.vy = Math.max(s.vy, 6);
          s.y += 0.05;
          s.grounded = false;
          ev.struck = true;
          spray?.burst(
            s.x,
            s.y + 1,
            s.z,
            24,
            5,
            5,
            0.9,
            ic.cfg.look === "ice" ? 0xe8f6ff : 0x8a7a70,
          );
          if (i === 0) opts.sfx?.thud(vol());
        }
      // ---- thin ice: broken, it's slush that drags you back
      for (const ti of thin)
        if (ti.p.broken > 0 && onThinIce(ti.p, s.x, s.y, s.z)) {
          s.speed *= Math.pow(SLUSH_KEEP, dt);
          if (Math.abs(s.speed) > 3 && Math.random() < 0.6)
            spray?.emit(
              s.x,
              s.y + 0.2,
              s.z,
              (Math.random() - 0.5) * 3,
              2 + Math.random() * 2,
              (Math.random() - 0.5) * 3,
              0.6,
              0xbfe8ff,
            );
        }
      // ---- desert dust: a reddish trail behind you on dirt and sand
      if (dust && !opts.headless) {
        dustAcc[i] = Math.min(2, dustAcc[i]! + dt * dustRate(dust, ground, s.speed));
        for (; dustAcc[i]! >= 1; dustAcc[i]! -= 1) {
          dusty ??= createParticles(group, { max: 700, size: 1.5, gravity: -0.5, opacity: 0.5 });
          const side = Math.random() < 0.5 ? -1 : 1;
          const back = 1.3 + Math.random() * 0.6;
          dusty.emit(
            s.x - Math.sin(s.heading) * back + Math.cos(s.heading) * side * 0.8,
            s.y + 0.25,
            s.z - Math.cos(s.heading) * back - Math.sin(s.heading) * side * 0.8,
            -Math.sin(s.heading) * 2 + (Math.random() - 0.5) * 2,
            0.6 + Math.random() * 1.2,
            -Math.cos(s.heading) * 2 + (Math.random() - 0.5) * 2,
            0.9 + Math.random() * 0.8,
            dust.color,
          );
        }
      }
      // ---- deep snow: a spray of powder behind you
      if (ground === "deep_snow" && Math.abs(s.speed) > 6 && Math.random() < 0.6)
        spray?.emit(
          s.x - Math.sin(s.heading) * 1.2,
          s.y + 0.2,
          s.z - Math.cos(s.heading) * 1.2,
          (Math.random() - 0.5) * 2.5,
          1.5 + Math.random() * 2,
          (Math.random() - 0.5) * 2.5,
          0.6,
          0xf4f8ff,
        );
      // ---- water
      const wet = ground === "water" || ground === "deep_water";
      if (
        wet &&
        h.lastSurface !== ground &&
        h.lastSurface !== "water" &&
        h.lastSurface !== "deep_water"
      ) {
        const big = ground === "deep_water" || Math.abs(s.speed) > 15;
        ev.splashed = ground === "deep_water" ? "deep" : "shallow";
        spray?.burst(s.x, s.y + 0.2, s.z, big ? 28 : 14, big ? 5 : 3, big ? 7 : 4.5, 0.9, 0xd8f4ff);
        if (i === 0) opts.sfx?.splash(vol(), big);
      }
      if (wet && Math.abs(s.speed) > cfg.splashSpeed && Math.random() < 0.5) {
        // The wake.
        const side = Math.random() < 0.5 ? -1 : 1;
        spray?.emit(
          s.x + Math.cos(s.heading) * side * 0.9,
          s.y + 0.1,
          s.z - Math.sin(s.heading) * side * 0.9,
          Math.cos(s.heading) * side * 2,
          2.5 + Math.random() * 2,
          -Math.sin(s.heading) * side * 2,
          0.5,
          0xe8fbff,
        );
      }
      if (ground === "deep_water") {
        h.deep += dt;
        if (h.deep > cfg.deepWaterSec) {
          const at = back();
          putBack(s, at);
          h.deep = 0;
          h.immune = cfg.recoverImmuneSec;
          ev.respawned = at;
          if (i === 0) opts.sfx?.recover(vol());
        }
      } else if (s.grounded) h.deep = 0;
      const sinkTo = ground === "deep_water" ? cfg.deepWaterSink : ground === "water" ? 0.12 : 0;
      h.sink += (sinkTo - h.sink) * (1 - Math.exp(-8 * dt));
      if (h.smoking > 0 && Math.random() < 0.25)
        smoke?.emit(s.x, s.y + 1, s.z, 0, 1.5, 0, 0.8, 0x6a5a58);
      if (s.grounded) h.lastSurface = surface;
      // Driving through a waterfall: a drenching splash.
      const lp = lastPos[i]!;
      for (const f of falls)
        if (!Number.isNaN(lp.x) && throughFall(f, lp.x, lp.z, s.x, s.z, s.y)) {
          spray?.burst(s.x, s.y + 1.2, s.z, 30, 4, 3, 0.8, 0xe8fbff);
          if (i === 0) opts.sfx?.splash(vol(), true);
          ev.splashed = "shallow";
        }
      lp.x = s.x;
      lp.z = s.z;
      return ev;
    },
    step(karts, dt) {
      clock += dt;
      depths?.step(dt);
      for (const ti of thin) {
        const ev = stepThinIce(ti.p, karts, dt);
        if (ev) thinEvents.push({ x: ti.p.x, y: ti.p.y, z: ti.p.z, kind: ev });
      }
      for (const sh of shimmers) {
        let near = false;
        for (const k of karts)
          if (Math.hypot(k.x - sh.x, k.z - sh.z) < 14 && Math.abs(k.y - sh.y) < 6) near = true;
        sh.level = near ? Math.min(1, sh.level + dt * 6) : sh.level * Math.exp(-1.4 * dt);
      }
      for (const m of movers) placeMover(m);
      for (const p of presents) p.down = Math.max(0, p.down - dt);
      for (const f of flyers) {
        f.d += f.speed * dt;
        placeFlyer(f, dt);
        f.callIn -= dt;
        if (f.callIn <= 0) {
          f.callIn = 7 + Math.random() * 6;
          const k = karts[0];
          const near = k ? Math.hypot(k.x - f.x, k.y - f.y, k.z - f.z) : Infinity;
          if (near < 110) opts.sfx?.screech(vol() * Math.max(0.15, 1 - near / 110));
        }
      }
      for (const dn of dinos) {
        // Stop for anything close; set off again gently once it's clear.
        let close = Infinity;
        let lookX = 0;
        let lookZ = 0;
        for (const k of karts) {
          const d = Math.hypot(k.x - dn.x, k.z - dn.z);
          if (d < close) {
            close = d;
            lookX = k.x;
            lookZ = k.z;
          }
        }
        const goal = close < cfg.dinoYieldRadius ? 0 : 1;
        dn.pace += (goal - dn.pace) * (1 - Math.exp(-(goal ? 0.8 : 4) * dt));
        dn.d += dn.speed * dn.pace * dt;
        placeDino(dn);
        // Turn its head towards a nearby kart.
        const want =
          close < 40
            ? Math.max(
                -1,
                Math.min(
                  1,
                  ((Math.atan2(lookX - dn.x, lookZ - dn.z) - dn.heading + 3 * Math.PI) %
                    (2 * Math.PI)) -
                    Math.PI,
                ),
              )
            : 0;
        dn.look += (want - dn.look) * (1 - Math.exp(-2 * dt));
        // Bumping into it slows you a little more than a tree would.
        for (const k of karts)
          for (const c of dn.solids)
            if (Math.hypot(k.x - c.x, k.z - c.z) < c.radius + 1.2 && k.y < dn.y + 4)
              k.speed *= Math.pow(cfg.dinoSlow, dt * 4);
        dn.callIn -= dt;
        if (dn.callIn <= 0) {
          dn.callIn = 9 + (dn.d % 5);
          if (close < 60) {
            const loud = vol() * Math.max(0.2, 1 - close / 60);
            if (dn.mammoth)
              opts.sfx?.trumpet(loud, dn.solids[0]!.radius < cfg.dinoBodyRadius * 0.8);
            else opts.sfx?.dinoCall(loud);
          }
        }
        dn.stepIn -= dt * dn.pace;
        if (dn.stepIn <= 0) {
          dn.stepIn = 0.7;
          if (close < 30 && dn.pace > 0.3) opts.sfx?.thud(vol() * (1 - close / 30));
        }
      }
    },
    render(t, dt, listener) {
      depths?.render(t, dt, listener);
      isles?.render(t, dt, listener);
      snowLife?.render(t, dt, listener);
      festival?.render(t, dt, listener);
      for (const dn of dinos)
        dn.view?.update(dn.x, dn.y, dn.z, dn.heading, dn.d, dn.pace, dn.look, t);
      for (const p of party) {
        if (p.ring) {
          // Round the circle, counter-clockwise, facing the way they go.
          const a = p.ring.at + (t * p.ring.speed) / p.ring.r;
          p.x = p.ring.x + Math.cos(a) * p.ring.r;
          p.z = p.ring.z + Math.sin(a) * p.ring.r;
          p.heading = Math.atan2(-Math.sin(a), Math.cos(a));
          p.y = ground.at(p.x, p.z, p.ring.y + 2).height;
        }
        p.view?.update(p.x, p.y, p.z, p.heading, p.dance, t, p.phase);
      }
      for (const f of flyers) {
        // Flap for a while, then glide: the beat comes and goes along the loop.
        const flap = Math.max(0, Math.min(1, 0.5 + 1.6 * Math.sin(f.d / 38)));
        f.view?.update(f.x, f.y, f.z, f.heading, f.bank, flap, t);
      }
      if (torchLights.length) {
        // The nearest torches (a partial sort: there are only a few lights).
        const near = torches
          .map((q) => ({
            q,
            d: (q.x - listener.x) ** 2 + (q.y - listener.y) ** 2 + (q.z - listener.z) ** 2,
          }))
          .sort((a, b) => a.d - b.d)
          .slice(0, torchLights.length);
        near.forEach(({ q, d }, k) => {
          const l = torchLights[k]!;
          l.position.set(q.x, q.y, q.z);
          const fade = Math.max(0, Math.min(1, (60 - Math.sqrt(d)) / 20));
          const flick =
            0.82 + 0.12 * Math.sin(t * 13 + q.acc * 40) + 0.08 * Math.sin(t * 29 + q.acc * 7);
          l.intensity = 34 * fade * flick;
          // The odd ember drifting up from the flame.
          q.acc = (q.acc + dt * 0.9) % 1e3;
          if (q.embers && fade > 0 && Math.random() < dt * 3)
            sparks?.emit(
              q.x,
              q.y + 0.3,
              q.z,
              (Math.random() - 0.5) * 0.6,
              1.5 + Math.random(),
              (Math.random() - 0.5) * 0.6,
              0.9,
              Math.random() < 0.5 ? 0xffc040 : 0xff7a20,
            );
        });
      }
      // Spray at the foot of each waterfall, and its roar when you're near.
      let nearest = Infinity;
      for (const f of falls) {
        const d = Math.hypot(listener.x - f.x, listener.z - f.z);
        if (!f.silent) nearest = Math.min(nearest, d);
        if (d > 160 || !spray) continue;
        for (let k = 0; k < 2; k++) {
          const u = (Math.random() - 0.5) * f.width;
          const cx = f.x + Math.cos(f.heading) * u;
          const cz = f.z - Math.sin(f.heading) * u;
          spray.emit(
            cx,
            f.y + 0.2,
            cz,
            (Math.random() - 0.5) * 3,
            3 + Math.random() * 3,
            (Math.random() - 0.5) * 3,
            0.8,
            0xffffff,
          );
        }
      }
      if (falls.some((f) => !f.silent) && !opts.quiet) {
        rush ??= opts.sfx?.rush();
        rush?.set(
          nearest < cfg.waterfallRadius
            ? (1 - nearest / cfg.waterfallRadius) * cfg.volume * 0.5
            : 0,
        );
      }
      // Smoke and embers over the campfires you're near.
      // (Not in a cutscene: the smoke draws the eye from the story. Blake, Oct 28.)
      for (const f of fires) {
        if (!smoke || hazards.calm || Math.hypot(listener.x - f.x, listener.z - f.z) > 140)
          continue;
        f.acc = Math.min(1, f.acc + dt);
        for (; f.acc > 0.16; f.acc -= 0.16) {
          const j = () => Math.random() - 0.5;
          smoke.emit(
            f.x + j() * 0.6,
            f.y + 1.8,
            f.z + j() * 0.6,
            j() * 0.5,
            1 + Math.random(),
            j() * 0.5,
            2.4,
            0xd2ccc4,
          );
          if (Math.random() < 0.7)
            sparks?.emit(
              f.x + j() * 0.8,
              f.y + 0.9,
              f.z + j() * 0.8,
              j() * 1.4,
              3.2 + Math.random() * 2.5,
              j() * 1.4,
              0.8,
              Math.random() < 0.5 ? 0xffc040 : 0xff6a20,
            );
        }
      }
      // Snow drifting down round the camera, swaying a little in the wind.
      if (snowfall && !opts.headless) {
        snow ??= createParticles(group, { max: 900, size: 0.22, gravity: 0, opacity: 0.95 });
        snowfall.acc = Math.min(2, snowfall.acc + dt * snowfall.rate);
        const r = snowfall.radius;
        for (; snowfall.acc >= 1; snowfall.acc -= 1)
          snow.emit(
            listener.x + (Math.random() - 0.5) * 2 * r,
            listener.y + 6 + Math.random() * 18,
            listener.z + (Math.random() - 0.5) * 2 * r,
            0.8 + Math.sin(t * 0.3) * 0.6 + (Math.random() - 0.5) * 0.6,
            -2.2 - Math.random() * 1.2,
            0.3 + (Math.random() - 0.5) * 0.6,
            8,
            Math.random() < 0.8 ? 0xffffff : 0xdfe6ff,
          );
        snow.step(dt);
      }
      // The dragons: posed for their attack, the burn zone glowing on the road as they
      // draw breath, then the fire (the flames fill exactly the zone that burns).
      if (dragons.length && !opts.headless) {
        fire ??= createParticles(group, { max: 1400, size: 2.2, gravity: 3.5, additive: true });
        const rc = raceClock();
        for (const d of dragons) {
          const { phase, t: pt } = dragonPhase(d.cfg, rc);
          const f = d.cfg.fire;
          tmpTarget.set(f.x, f.y, f.z);
          d.view?.update(phase, pt, t, tmpTarget);
          const far = Math.hypot(listener.x - d.cfg.x, listener.z - d.cfg.z);
          const loud = vol() * Math.max(0, 1 - far / 320);
          if (phase !== d.last) {
            if (phase === "warning" && loud > 0) opts.sfx?.roar(loud);
            if (phase === "breathing" && loud > 0) opts.sfx?.flame(loud);
            d.last = phase;
          }
          if (d.marker) {
            const m = d.marker.material as THREE.MeshBasicMaterial;
            m.opacity =
              phase === "warning"
                ? 0.18 + 0.22 * pt + 0.15 * Math.sin(t * 14)
                : phase === "breathing"
                  ? 0.35
                  : phase === "cooldown"
                    ? 0.35 * (1 - pt)
                    : 0;
          }
          d.view?.mouth(tmpMouth);
          d.flames?.update(phase, pt, t, tmpMouth);
          if (phase !== "breathing" || far > 400) continue;
          d.acc = Math.min(40, d.acc + dt * 420);
          const ca = Math.cos(f.heading);
          const sa = Math.sin(f.heading);
          for (; d.acc >= 1; d.acc -= 1) {
            // A point in the zone: along and across the road.
            const along = (Math.random() - 0.5) * f.length;
            const across = (Math.random() - 0.5) * f.width;
            const px = f.x + sa * along + ca * across;
            const pz = f.z + ca * along - sa * across;
            const col = Math.random() < 0.35 ? 0xffe070 : Math.random() < 0.6 ? 0xff8a20 : 0xff4a10;
            if (Math.random() < 0.3) {
              // The stream from the jaws to the road.
              const life = 0.35;
              fire.emit(
                tmpMouth.x,
                tmpMouth.y,
                tmpMouth.z,
                (px - tmpMouth.x) / life,
                (f.y + 1 - tmpMouth.y) / life - 0.5 * 3.5 * life,
                (pz - tmpMouth.z) / life,
                life,
                col,
              );
            } else {
              fire.emit(
                px,
                f.y + 0.3 + Math.random() * 0.8,
                pz,
                (Math.random() - 0.5) * 1.5,
                2 + Math.random() * 3,
                (Math.random() - 0.5) * 1.5,
                0.45 + Math.random() * 0.45,
                col,
              );
            }
          }
        }
      }
      fire?.step(dt);
      // Eruptions: on their beat of the race clock, a rumble, then a blast of lava bombs
      // arcing out of the crater and a red flash; a fountain of fire in between.
      if (eruptions.length && !opts.headless) {
        bombs ??= createParticles(group, { max: 500, size: 6, gravity: -16, additive: true });
        rocks ??= createLavaBombs(group, 260);
        bombSmoke ??= createParticles(group, { max: 600, size: 4.5, gravity: 1.2, opacity: 0.55 });
        const rc = raceClock();
        for (const er of eruptions) {
          const beat = Math.floor((rc - er.offset) / er.period);
          const u = rc - er.offset - beat * er.period;
          const far = Math.hypot(listener.x - er.x, listener.z - er.z);
          if (beat !== er.last) {
            er.last = beat;
            if (far < 1500) opts.sfx?.rumble(vol() * Math.max(0.25, 1 - far / 1500));
          }
          // The blast, 1.2 s after the rumble.
          const blast = u - 1.2;
          if (blast >= 0 && blast < dt + 1e-6) {
            // Lava bombs: tumbling lumps of molten rock, cooling as they fall, smoking.
            for (let k = 0; k < 70; k++) {
              const a = Math.random() * Math.PI * 2;
              const sp = 10 + Math.random() * 28;
              rocks.emit(
                er.x,
                er.y + 5,
                er.z,
                Math.cos(a) * sp,
                50 + Math.random() * 50,
                Math.sin(a) * sp,
                1.6 + Math.random() * 3.2,
                4.5 + Math.random() * 2.5,
              );
            }
            // And a burst of fire round the crater's mouth.
            for (let k = 0; k < 60; k++) {
              const a = Math.random() * Math.PI * 2;
              const sp = 6 + Math.random() * 14;
              bombs.emit(
                er.x,
                er.y + 4,
                er.z,
                Math.cos(a) * sp,
                25 + Math.random() * 30,
                Math.sin(a) * sp,
                1.6,
                0xff7a20,
              );
            }
          }
          if (er.light)
            er.light.intensity = blast >= 0 && blast < 2.5 ? 9000 * Math.exp(-blast * 1.8) : 0;
          // The fountain, always going: molten clots and a little fire.
          if (Math.random() < dt * 10)
            rocks.emit(
              er.x + (Math.random() - 0.5) * 16,
              er.y,
              er.z + (Math.random() - 0.5) * 16,
              (Math.random() - 0.5) * 8,
              30 + Math.random() * 20,
              (Math.random() - 0.5) * 8,
              0.8 + Math.random() * 1.4,
              2.8,
            );
          const n = Math.min(3, Math.floor(Math.random() + dt * 14));
          for (let k = 0; k < n; k++)
            bombs.emit(
              er.x + (Math.random() - 0.5) * 20,
              er.y,
              er.z + (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 8,
              35 + Math.random() * 25,
              (Math.random() - 0.5) * 8,
              3.2,
              Math.random() < 0.5 ? 0xff7a20 : 0xffc040,
            );
        }
        bombs.step(dt);
        const sm = bombSmoke;
        rocks.step(dt, (x, y, z) =>
          sm.emit(
            x,
            y,
            z,
            (Math.random() - 0.5) * 1.5,
            1 + Math.random(),
            (Math.random() - 0.5) * 1.5,
            2.2,
            0x4a4040,
          ),
        );
        bombSmoke.step(dt);
      }
      // The storm: lightning round the horizon, the flash, the thunder after it.
      storm?.update(dt, listener, (loud) => opts.sfx?.rumble(vol() * loud));
      // Ash drifting down and embers floating up round the camera; steam from vents.
      if ((ashfall || vents.length) && !opts.headless) {
        ash ??= createParticles(group, { max: 700, size: 0.3, gravity: 0, opacity: 0.9 });
        if (ashfall) {
          ashfall.acc = Math.min(3, ashfall.acc + dt * ashfall.rate);
          const r = ashfall.radius;
          for (; ashfall.acc >= 1; ashfall.acc -= 1) {
            const ember = Math.random() < 0.35;
            ash.emit(
              listener.x + (Math.random() - 0.5) * 2 * r,
              listener.y + (ember ? -2 + Math.random() * 6 : 4 + Math.random() * 16),
              listener.z + (Math.random() - 0.5) * 2 * r,
              (Math.random() - 0.5) * 1.6,
              ember ? 1 + Math.random() * 1.5 : -1.5 - Math.random(),
              (Math.random() - 0.5) * 1.6,
              ember ? 2.5 : 7,
              ember
                ? Math.random() < 0.5
                  ? 0xff8a20
                  : 0xffc040
                : Math.random() < 0.5
                  ? 0x7a6e6a
                  : 0x9a8e88,
            );
          }
        }
        for (const v of vents) {
          if (!smoke || Math.hypot(listener.x - v.x, listener.z - v.z) > 140) continue;
          v.acc = Math.min(1, v.acc + dt);
          for (; v.acc > 0.09; v.acc -= 0.09)
            smoke.emit(
              v.x + (Math.random() - 0.5) * 1.5,
              v.y + 0.5,
              v.z + (Math.random() - 0.5) * 1.5,
              (Math.random() - 0.5) * 0.8,
              4 + Math.random() * 3,
              (Math.random() - 0.5) * 0.8,
              1.6,
              0xe8e2dc,
            );
        }
        ash.step(dt);
      }
      // Snowballs rolling and the sleigh crossing (its bells jingling as a warning first),
      // presents popping back, the bell swinging, baubles turning, chimney smoke.
      for (const m of movers) {
        const far = Math.hypot(listener.x - m.x, listener.z - m.z);
        if (m.phase !== m.last) {
          const loud = vol() * Math.max(0, 1 - far / 200);
          if (loud > 0 && m.sleigh && m.phase === "warning") opts.sfx?.jingle(loud);
          if (loud > 0 && m.cart && m.phase !== "idle")
            opts.sfx?.rattle(loud * (m.phase === "crossing" ? 1 : 0.6));
          if (loud > 0 && !m.sleigh && !m.cart && m.phase === "crossing")
            opts.sfx?.rumble(loud * 0.35);
          m.last = m.phase;
        }
        const shown = m.phase === "crossing";
        if (m.cart) {
          const rc = crossingAt(m.cfg, raceClock());
          const t0 = (((raceClock() - m.cfg.offset) % m.cfg.period) + m.cfg.period) % m.cfg.period;
          const warmUp = Math.max(
            0,
            Math.min(1, (t0 - (m.cfg.period - m.cfg.travel - m.cfg.warn)) / m.cfg.warn),
          );
          (m.view as CartView | undefined)?.update(
            m.x,
            m.y,
            m.z,
            rc.heading,
            m.run,
            m.phase !== "idle",
            shown ? 1 : warmUp,
            t,
          );
          continue;
        }
        if (m.sleigh)
          (m.view as SleighView | undefined)?.update(m.x, m.y, m.z, m.heading, m.run, shown, t);
        else (m.view as SnowballView | undefined)?.update(m.x, m.y, m.z, m.heading, m.run, shown);
        // Snow kicked up as it goes.
        if (shown && far < 160 && Math.random() < 0.5)
          spray?.emit(
            m.x + (Math.random() - 0.5) * 3,
            m.y + 0.2,
            m.z + (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 2,
            2 + Math.random() * 2,
            (Math.random() - 0.5) * 2,
            0.7,
            0xf4f8ff,
          );
      }
      for (const p of presents) {
        // Popping back up (over half a second) after it's been smashed.
        const up = p.down > 0 ? (p.down < 0.5 ? 1 - p.down / 0.5 : 0) : 1;
        p.view?.update(up, t);
      }
      if (presents.length && !opts.headless) {
        confetti ??= createParticles(group, { max: 500, size: 0.5, gravity: -9 });
        confetti.step(dt);
      }
      for (const b of bells) {
        const sw = bellSwing(b.cfg, raceClock());
        b.view?.update(sw.angle);
        if (sw.ringing && !b.ringing) {
          const far = Math.hypot(listener.x - b.cfg.x, listener.z - b.cfg.z);
          const loud = vol() * Math.max(0, 1 - far / 450);
          if (loud > 0) opts.sfx?.bell(loud);
        }
        b.ringing = sw.ringing;
      }
      for (const o of ornaments) o.update(t);
      // Icicles: creaking as they shake, shattering where they land.
      const rcNow = raceClock();
      for (const ic of icicles) {
        const st = icicleAt(ic.cfg, rcNow);
        ic.view?.update(st.phase, st.u, st.tip, t);
        if (st.phase !== ic.last) {
          const far = Math.hypot(
            listener.x - ic.cfg.x,
            listener.y - ic.cfg.y,
            listener.z - ic.cfg.z,
          );
          const loud = vol() * Math.max(0, 1 - far / 120);
          const look = ic.cfg.look;
          if (st.phase === "warning" && loud > 0)
            look === "meteor" ? opts.sfx?.missile(loud * 0.6) : opts.sfx?.creak(loud);
          if (st.phase === "shattered") {
            if (look === "ice") {
              if (loud > 0) opts.sfx?.shatter(loud);
              spray?.burst(ic.cfg.x, ic.cfg.y + 0.4, ic.cfg.z, 30, 6, 6, 1.0, 0xdff4ff);
              sparks?.burst(ic.cfg.x, ic.cfg.y + 0.4, ic.cfg.z, 14, 4, 5, 0.6, 0x9aefff);
            } else {
              // A rock or a meteor: a crash, dust and (burning) sparks.
              if (loud > 0) opts.sfx?.explosion(loud * (look === "meteor" ? 0.9 : 0.6));
              smoke?.burst(
                ic.cfg.x,
                ic.cfg.y + 0.6,
                ic.cfg.z,
                22,
                5,
                3,
                1.6,
                look === "meteor" ? 0x4a3a36 : 0x6a5a50,
              );
              sparks?.burst(
                ic.cfg.x,
                ic.cfg.y + 0.4,
                ic.cfg.z,
                look === "meteor" ? 30 : 12,
                6,
                7,
                0.8,
                0xffa040,
              );
            }
          }
          ic.last = st.phase;
        }
      }
      // Thin ice: cracks spreading, giving way, freezing over.
      for (const ti of thin) ti.view?.update(ti.p, t);
      for (const ev of thinEvents.splice(0)) {
        const far = Math.hypot(listener.x - ev.x, listener.y - ev.y, listener.z - ev.z);
        const loud = vol() * Math.max(0, 1 - far / 90);
        if (ev.kind === "crack" && loud > 0) opts.sfx?.crack(loud);
        if (ev.kind === "break") {
          if (loud > 0) opts.sfx?.shatter(loud);
          spray?.burst(ev.x, ev.y + 0.3, ev.z, 36, 5, 5, 1.0, 0xcfeeff);
        }
      }
      for (const sh of shimmers) sh.view?.update(sh.level, t);
      // Ice motes glinting in the air round the camera.
      if (sparkles && !opts.headless) {
        motes ??= createParticles(group, { max: 600, size: 0.28, gravity: 0, additive: true });
        sparkles.acc = Math.min(2, sparkles.acc + dt * sparkles.rate);
        const r = sparkles.radius;
        for (; sparkles.acc >= 1; sparkles.acc -= 1)
          motes.emit(
            listener.x + (Math.random() - 0.5) * 2 * r,
            listener.y - 2 + Math.random() * 14,
            listener.z + (Math.random() - 0.5) * 2 * r,
            (Math.random() - 0.5) * 0.6,
            -0.3 + Math.random() * 0.5,
            (Math.random() - 0.5) * 0.6,
            3 + Math.random() * 3,
            [0xbff6ff, 0x7ae8ff, 0xd6b8ff, 0xffffff][Math.floor(Math.random() * 4)]!,
          );
        motes.step(dt);
      }
      // Desert dust blowing across the land round the camera; the windmills and birds.
      if (wind && !opts.headless) {
        dusty ??= createParticles(group, { max: 700, size: 1.5, gravity: -0.5, opacity: 0.5 });
        wind.acc = Math.min(3, wind.acc + dt * wind.rate);
        const w = windAt(t);
        const r = wind.radius;
        for (; wind.acc >= 1; wind.acc -= 1) {
          const x = listener.x + (Math.random() - 0.5) * 2 * r;
          const z = listener.z + (Math.random() - 0.5) * 2 * r;
          const y = ground.at(x, z, listener.y + 30).height;
          if (!Number.isFinite(y) || y > listener.y + 20) continue;
          for (let k = 0; k < 3; k++)
            dusty.emit(
              x + k * 0.8,
              y + 0.2 + Math.random() * 0.8,
              z + (Math.random() - 0.5),
              w.x * (0.8 + Math.random() * 0.4),
              0.2 + Math.random() * 0.4,
              w.z * (0.8 + Math.random() * 0.4),
              2.2 + Math.random() * 1.6,
              wind.color,
            );
        }
      }
      dusty?.step(dt);
      for (const v of windmills) v.update(t);
      // Boats sailing round the lake, a wake curling behind each one near you.
      for (const b of boats) {
        b.update(t);
        if (!spray) continue;
        if (Math.hypot(b.pos.x - listener.x, b.pos.z - listener.z) > 160) continue;
        b.acc = Math.min(2, b.acc + dt * 14);
        for (; b.acc >= 1; b.acc -= 1) {
          const side = Math.random() < 0.5 ? -1 : 1;
          const sx = Math.sin(b.heading);
          const sz = Math.cos(b.heading);
          spray.emit(
            b.pos.x - sx * 2.6 + sz * side * 0.9,
            b.pos.y + 0.05,
            b.pos.z - sz * 2.6 - sx * side * 0.9,
            sz * side * 1.2 - sx * 0.6,
            0.8 + Math.random() * 0.6,
            -sx * side * 1.2 - sz * 0.6,
            0.7,
            0xf4ffff,
          );
        }
      }
      // Fountains near you: a jet straight up and a ring of arcing jets.
      if (fountains.length && !opts.headless) {
        fountainSpray ??= createParticles(group, {
          max: 900,
          size: 0.42,
          gravity: -SPRAY_GRAVITY,
          opacity: 0.85,
        });
        for (const f of fountains) {
          if (Math.hypot(f.x - listener.x, f.z - listener.z) > 170) continue;
          for (let k = 0; k <= f.jets; k++) {
            f.acc[k] = Math.min(3, f.acc[k]! + dt * (k === 0 ? 40 : 14));
            const { v, t: flight } = jetVelocity(f, k);
            for (; f.acc[k]! >= 1; f.acc[k]! -= 1) {
              const j = 0.06;
              fountainSpray.emit(
                f.x,
                f.y,
                f.z,
                v[0] * (1 + (Math.random() - 0.5) * j) + (Math.random() - 0.5) * 0.3,
                v[1] * (1 + (Math.random() - 0.5) * j),
                v[2] * (1 + (Math.random() - 0.5) * j) + (Math.random() - 0.5) * 0.3,
                flight,
                Math.random() < 0.3 ? 0xffffff : 0xcff6ff,
              );
            }
          }
        }
        fountainSpray.step(dt);
      }
      for (const v of flocks) v.update(t);
      // ---- Dry Gulch's haunting
      const hc = raceClock();
      for (const g of ghosts) {
        const near = Math.hypot(listener.x - g.cfg.x, listener.y - g.cfg.y, listener.z - g.cfg.z);
        const a = ghostAt(g.cfg, hc, near);
        g.view?.set(g.cfg.x + a.dx, g.cfg.y + a.dy, g.cfg.z + a.dz, g.cfg.heading, a.alpha, t);
        const shown = a.alpha > 0.05;
        if (shown && !g.shown && near < 55 && g.cfg.look !== "window")
          opts.sfx?.moan(vol() * (1 - near / 55));
        g.shown = shown;
      }
      for (const r of riders) {
        const at = riderAt(r.cfg, hc);
        if (at.u < 0) {
          r.view?.set(0, 0, 0, 0, 0, t);
          continue;
        }
        const p = pathPoint(r.path, at.u * r.path.length);
        const gy = ground.at(p.x, p.z, p.y + 20).height;
        r.view?.set(p.x, gy, p.z, p.heading, at.alpha, t);
      }
      for (const rc of railcarts) {
        const at = railcartAt(rc.cfg, hc);
        const p = pathPoint(rc.path, at.u * rc.path.length);
        const ahead = pathPoint(rc.path, Math.min(rc.path.length, at.u * rc.path.length + 1));
        const far = Math.hypot(listener.x - p.x, listener.z - p.z);
        if (at.moving && !rc.moving && far < 120) opts.sfx?.rattle(vol() * 0.5 * (1 - far / 120));
        rc.moving = at.moving;
        rc.view?.update(p.x, p.y - 0.1, p.z, ahead.heading, at.u * rc.path.length, true, 0.35, t);
      }
      for (const tw of tumbleweeds) {
        const at = crossingAt(tw.cfg, hc);
        const shown = at.phase === "crossing";
        if (shown) tw.y = ground.at(at.x, at.z, Math.max(at.y, tw.y) + 4).height;
        tw.view?.update(at.x, tw.y, at.z, at.heading, at.u * crossingLength(tw.cfg), shown);
      }
      for (const d of doors) {
        const ang = doorSwing(d.cfg, hc);
        d.view?.update(ang);
        const open = Math.abs(ang) > 0.05;
        if (open && !d.open) {
          const far = Math.hypot(listener.x - d.cfg.x, listener.z - d.cfg.z);
          if (far < 45) opts.sfx?.squeak(vol() * (1 - far / 45));
        }
        d.open = open;
      }
      for (const w of wisps) w.update(t);
      if (mists.length && !opts.headless) {
        mistPuffs ??= createParticles(group, {
          max: 500,
          size: 3.2,
          gravity: -0.3,
          opacity: 0.32,
          additive: true,
        });
        for (const ms of mists) {
          const far = Math.hypot(listener.x - ms.x, listener.z - ms.z);
          if (far > 180) continue;
          ms.acc = Math.min(4, ms.acc + dt * ms.rate);
          for (; ms.acc >= 1; ms.acc -= 1) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * ms.radius;
            mistPuffs.emit(
              ms.x + Math.cos(a) * r,
              ms.y + 0.3 + Math.random() * 0.6,
              ms.z + Math.sin(a) * r,
              (Math.random() - 0.5) * (ms.color === undefined ? 0.8 : 1.6),
              ms.color === undefined ? 0.15 + Math.random() * 0.3 : 0.05 + Math.random() * 0.1,
              (Math.random() - 0.5) * (ms.color === undefined ? 0.8 : 1.6),
              3.0 + Math.random() * 2.0,
              ms.color ?? (Math.random() < 0.5 ? 0x2ac884 : 0x186a4a),
            );
          }
        }
        mistPuffs.step(dt);
      }
      for (const w of whispers) {
        const far = Math.hypot(listener.x - w.x, listener.y - w.y, listener.z - w.z);
        w.next -= dt;
        if (w.next <= 0) {
          w.next = 4 + Math.random() * 5;
          if (far < w.radius) opts.sfx?.whisper(vol() * (1 - far / w.radius));
        }
      }
      for (const c of creaks) {
        const far = Math.hypot(listener.x - c.x, listener.y - c.y, listener.z - c.z);
        c.next -= dt;
        if (c.next <= 0) {
          c.next = 1.5 + Math.random() * 3;
          if (far < c.radius) opts.sfx?.timber(vol() * (1 - far / c.radius));
        }
      }
      if (ambience && !opts.quiet) {
        const deep = underground(ambience, listener.x, listener.y, listener.z);
        windLoop ??= opts.sfx?.ambience("wind");
        droneLoop ??= opts.sfx?.ambience("drone");
        windLoop?.set(cfg.volume * ambience.wind * 0.5 * (1 - deep));
        droneLoop?.set(cfg.volume * 0.45 * deep);
      }
      for (const ch of chimneys) {
        if (!smoke || hazards.calm || Math.hypot(listener.x - ch.x, listener.z - ch.z) > 240)
          continue;
        ch.acc = Math.min(1, ch.acc + dt);
        for (; ch.acc > 0.4; ch.acc -= 0.4)
          smoke.emit(
            ch.x + (Math.random() - 0.5) * 0.6,
            ch.y,
            ch.z + (Math.random() - 0.5) * 0.6,
            0.5 + Math.random() * 0.4,
            1.2 + Math.random() * 0.6,
            (Math.random() - 0.5) * 0.4,
            3.2,
            0xcfc6dc,
          );
      }
      // Geysers: steam at rest, bubbling and gurgling before they blow, then a roaring
      // column of water and steam.
      if (geysers.length && !opts.headless) {
        jets ??= createParticles(group, { max: 1600, size: 0.9, gravity: -12 });
        const rc = raceClock();
        for (const g of geysers) {
          const c = g.cfg;
          const { phase, t: pt } = hazards.calm
            ? { phase: "idle" as const, t: 0 }
            : geyserPhase(c, rc);
          const far = Math.hypot(listener.x - c.x, listener.z - c.z);
          if (phase !== g.last) {
            const loud = vol() * Math.max(0, 1 - far / 220);
            if (loud > 0 && phase === "warning") opts.sfx?.gurgle(loud);
            if (loud > 0 && phase === "blast")
              c.lava ? opts.sfx?.flame(loud) : opts.sfx?.geyser(loud);
            g.last = phase;
          }
          if (g.ring) {
            const m = g.ring.material as THREE.MeshBasicMaterial;
            m.opacity =
              phase === "warning"
                ? 0.3 + 0.6 * pt + 0.15 * Math.sin(t * 30)
                : phase === "blast"
                  ? 0.9
                  : 0.18 + 0.05 * Math.sin(t * 2 + c.x);
          }
          if (c.lava) {
            // Fire: the column, sparks and lava thrown up, black smoke; spitting before.
            lavaJets ??= createParticles(group, {
              max: 900,
              size: 0.8,
              gravity: -12,
              additive: true,
            });
            if (g.column) {
              g.column.visible = phase === "blast";
              if (phase === "blast") {
                const rise = Math.min(1, pt * 5) * (pt > 0.8 ? Math.max(0.05, (1 - pt) / 0.2) : 1);
                g.column.scale.set(
                  1 + 0.1 * Math.sin(t * 23),
                  c.height * rise,
                  1 + 0.1 * Math.cos(t * 19),
                );
                (g.column.material as THREE.MeshBasicMaterial).opacity =
                  0.7 * (pt > 0.8 ? (1 - pt) / 0.2 : 1);
              }
            }
            if (far > 420) continue;
            const j = () => Math.random() - 0.5;
            if (phase === "blast" && pt < 0.85) {
              g.acc = Math.min(20, g.acc + dt * 220);
              const up = Math.sqrt(2 * 12 * c.height);
              for (; g.acc >= 1; g.acc -= 1)
                lavaJets.emit(
                  c.x + j() * c.r * 0.8,
                  c.y + Math.random() * 2,
                  c.z + j() * c.r * 0.8,
                  j() * 4,
                  up * (0.7 + Math.random() * 0.4),
                  j() * 4,
                  1.4 + Math.random() * 0.6,
                  Math.random() < 0.5 ? 0xffc040 : 0xff5a10,
                );
              if (Math.random() < 0.5)
                smoke?.emit(
                  c.x + j() * c.r,
                  c.y + c.height * (0.5 + Math.random() * 0.5),
                  c.z + j() * c.r,
                  j() * 2,
                  3,
                  j() * 2,
                  2.4,
                  0x3a3030,
                );
            } else if (phase === "warning" && Math.random() < 0.4 + pt * 0.6)
              lavaJets.burst(
                c.x + j() * c.r,
                c.y + 0.2,
                c.z + j() * c.r,
                5,
                1.5,
                4 + pt * 6,
                0.6,
                0xffa030,
              );
            continue;
          }
          if (g.column) {
            if (phase === "blast") {
              const rise = Math.min(1, pt * 5) * (pt > 0.8 ? Math.max(0.05, (1 - pt) / 0.2) : 1);
              g.column.visible = true;
              g.column.scale.set(
                1 + 0.08 * Math.sin(t * 23),
                c.height * rise,
                1 + 0.08 * Math.cos(t * 19),
              );
              (g.column.material as THREE.MeshBasicMaterial).opacity =
                0.55 * (pt > 0.8 ? (1 - pt) / 0.2 : 1);
            } else g.column.visible = false;
          }
          if (far > 420) continue;
          const j = () => Math.random() - 0.5;
          if (phase === "blast" && pt < 0.85) {
            // Water thrown up the column, falling back as spray.
            g.acc = Math.min(30, g.acc + dt * 320);
            const up = Math.sqrt(2 * 12 * c.height);
            for (; g.acc >= 1; g.acc -= 1)
              jets.emit(
                c.x + j() * c.r * 0.8,
                c.y + Math.random() * 2,
                c.z + j() * c.r * 0.8,
                j() * 5,
                up * (0.75 + Math.random() * 0.35),
                j() * 5,
                1.6 + Math.random() * 0.8,
                Math.random() < 0.7 ? 0xffffff : 0xbff2ff,
              );
            if (Math.random() < 0.6)
              smoke?.emit(
                c.x + j() * c.r,
                c.y + c.height * (0.4 + Math.random() * 0.6),
                c.z + j() * c.r,
                j() * 2,
                2 + Math.random() * 2,
                j() * 2,
                2.2,
                0xf4f8fa,
              );
          } else {
            // Steam drifting up, thickening as it gets ready to blow; bubbling before.
            const rate = phase === "warning" ? 12 + pt * 18 : 3;
            g.acc = Math.min(4, g.acc + dt * rate);
            for (; g.acc >= 1; g.acc -= 1)
              smoke?.emit(
                c.x + j() * c.r,
                c.y + 0.3,
                c.z + j() * c.r,
                j() * 0.6,
                2 + Math.random() * 2,
                j() * 0.6,
                2.4,
                0xeef4f6,
              );
            if (phase === "warning" && Math.random() < 0.3 + pt * 0.6)
              jets.burst(
                c.x + j() * c.r,
                c.y + 0.2,
                c.z + j() * c.r,
                6,
                1.5,
                3 + pt * 5,
                0.6,
                0xdff8ff,
              );
          }
        }
        jets.step(dt);
        lavaJets?.step(dt);
      }
      // Glowing bubbles over the pools you're near, the odd burp of swamp gas, and
      // fireflies drifting round the camera.
      if ((pools.length || fireflies) && !opts.headless) {
        glowing ??= createParticles(group, { max: 500, size: 0.45, gravity: 0.8, additive: true });
        for (const b of pools) {
          if (Math.hypot(listener.x - b.x, listener.z - b.z) > 130) continue;
          b.acc = Math.min(2, b.acc + dt * (3 + b.r));
          for (; b.acc >= 1; b.acc -= 1) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * b.r * 0.85;
            glowing.emit(
              b.x + Math.cos(a) * r,
              b.y,
              b.z + Math.sin(a) * r,
              0,
              0.6 + Math.random() * 0.8,
              0,
              0.7 + Math.random() * 0.6,
              b.lava
                ? Math.random() < 0.6
                  ? 0xff8a20
                  : 0xffd060
                : Math.random() < 0.6
                  ? 0xa8ff70
                  : 0xd8ffb0,
            );
          }
          b.burp -= dt;
          if (b.burp <= 0) {
            b.burp = 3 + Math.random() * 7;
            glowing.burst(b.x, b.y + 0.3, b.z, 14, 1.2, 2.2, 1.4, b.lava ? 0xff5a18 : 0x7aff5a);
          }
        }
        if (fireflies) {
          fireflies.acc = Math.min(2, fireflies.acc + dt * fireflies.rate);
          const r = fireflies.radius;
          for (; fireflies.acc >= 1; fireflies.acc -= 1)
            glowing.emit(
              listener.x + (Math.random() - 0.5) * 2 * r,
              listener.y + 0.5 + Math.random() * 9,
              listener.z + (Math.random() - 0.5) * 2 * r,
              (Math.random() - 0.5) * 1.2,
              -0.4 + Math.random() * 0.3,
              (Math.random() - 0.5) * 1.2,
              2.5 + Math.random() * 2.5,
              Math.random() < 0.7 ? 0xeaff7a : 0xfff2a0,
            );
        }
        glowing.step(dt);
      }
      spray?.step(dt);
      smoke?.step(dt);
      sparks?.step(dt);
    },
    dispose() {
      rush?.stop();
      for (const d of dinos) d.view?.dispose();
      for (const f of flyers) f.view?.dispose();
      for (const p of party) p.view?.dispose();
      spray?.dispose();
      snow?.dispose();
      rocks?.dispose();
      bombSmoke?.dispose();
      glowing?.dispose();
      fire?.dispose();
      bombs?.dispose();
      ash?.dispose();
      jets?.dispose();
      confetti?.dispose();
      for (const m of movers) m.view?.dispose();
      for (const p of presents) p.view?.dispose();
      for (const b of bells) b.view?.dispose();
      for (const o of ornaments) o.dispose();
      for (const ic of icicles) ic.view?.dispose();
      for (const ti of thin) ti.view?.dispose();
      for (const sh of shimmers) sh.view?.dispose();
      motes?.dispose();
      dusty?.dispose();
      for (const v of windmills) v.dispose();
      for (const b of boats) b.dispose();
      fountainSpray?.dispose();
      for (const v of flocks) v.dispose();
      for (const g of ghosts) g.view?.dispose();
      for (const r of riders) r.view?.dispose();
      for (const r of railcarts) r.view?.dispose();
      for (const tw of tumbleweeds) tw.view?.dispose();
      for (const d of doors) d.view?.dispose();
      for (const w of wisps) w.dispose();
      mistPuffs?.dispose();
      windLoop?.stop();
      droneLoop?.stop();
      for (const g of geysers)
        for (const m of [g.column, g.ring])
          if (m) {
            m.geometry.dispose();
            (m.material as THREE.Material).dispose();
            m.removeFromParent();
          }
      lavaJets?.dispose();
      depths?.dispose();
      isles?.dispose();
      snowLife?.dispose();
      festival?.dispose();
      for (const d of dragons) {
        d.view?.dispose();
        d.flames?.dispose();
        if (d.marker) {
          d.marker.geometry.dispose();
          (d.marker.material as THREE.Material).dispose();
        }
      }
      smoke?.dispose();
      sparks?.dispose();
      group.removeFromParent();
    },
  };
  return hazards;
}

/** Does a kart cross a waterfall's sheet this step? (For the splash as you drive through.) */
export function throughFall(f: Fall, ax: number, az: number, bx: number, bz: number, y: number) {
  const nx = Math.sin(f.heading);
  const nz = Math.cos(f.heading);
  const da = (ax - f.x) * nx + (az - f.z) * nz;
  const db = (bx - f.x) * nx + (bz - f.z) * nz;
  if (da * db > 0) return false;
  const u = (bx - f.x) * Math.cos(f.heading) - (bz - f.z) * Math.sin(f.heading);
  return Math.abs(u) < f.width / 2 && y > f.y - 1 && y < f.top;
}
