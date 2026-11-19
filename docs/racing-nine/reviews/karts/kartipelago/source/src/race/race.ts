/**
 * Race rules for every kart in a race: "GET READY..." then "GO!" with a start boost for
 * good timing, laps, lap times, finishing order, race positions, and respawning.
 *
 * The start boost works the way Blake's notes on the N64 original describe it: what
 * counts is how many frames (at a 60 fps reference) before GO you first press the
 * throttle, and that you're still holding it at GO.
 *
 *   35 or more frames early   no boost           (too early)
 *   20 to 34 frames early     weak boost
 *   1 to 19 frames early      strong boost       (about 17 to 317 ms before GO)
 *
 * (Blake, Oct 25: the strong window is five frames more lenient than the notes' 1-14,
 * and the weak window moved along with it.)
 *   at or after GO            no boost, an ordinary start
 *
 * Only the first press during GET READY counts: let go before GO and the boost is lost
 * for this start (pressing again doesn't earn another try). A throttle already held
 * when the countdown begins isn't a press. Times are the race clock's, which advances
 * in fixed simulation steps, so the windows are the same at any frame rate; and presses
 * are timed to the step they happened in (core/input.ts), not to the rendered frame.
 *
 * Progress round the course is checkpoint progression (checkpoints.ts): invisible 3D
 * gates crossed in order, wherever you drive between them. Gate 0 is the start/finish
 * line. The road surface plays no part in it: leaving the road, flying and cutting
 * corners never cost progress. Only walled tracks (not open ones) still put a kart that
 * sits grounded off the road for a moment back at its last checkpoint: that's being
 * stuck outside the walls, not a progress rule.
 *
 * Racer 0 is the player.
 */
import type { KartState } from "../vehicles/kart";
import type { Track } from "../world/track";
import {
  DEFAULT_GATES,
  checkpointsFromRoute,
  gateAt,
  groupGates,
  newProgression,
  planeDist,
  rankValue,
  layChains,
  stepProgression,
  type Checkpoint,
  type CheckpointGate,
  type GateOptions,
  type Progression,
  type RouteSample,
  type Spot,
} from "./checkpoints";

export type { Spot } from "./checkpoints";

export interface RaceConfig {
  laps: number;
  /** How long "GET READY..." shows before GO, seconds. */
  readySec: number;
  /** The frame rate the start windows are counted in (the original's 60 fps). */
  startRefHz: number;
  /** A first press this many reference frames before GO or fewer (and more than 0)
   * is a strong start... */
  startStrongFrames: number;
  /** ...and up to this many, a weak one. Earlier than that: no boost. */
  startWeakFrames: number;
  /** How long "GO!" stays up, seconds. */
  goShowSec: number;
  /** The start boosts: a top-speed multiple the kart launches at and holds for so many
   * seconds (vehicles/kart.ts applyBoost; the strength the game has always had, which
   * Blake asked to keep). Tunable: not taken from the original. */
  startStrongMult: number;
  startStrongSec: number;
  startWeakMult: number;
  startWeakSec: number;
  /** Seconds grounded off the road before you're put back on it. */
  respawnAfterSec: number;
}

/** A checkpoint's main gate (see checkpoints.ts). */
export type Gate = CheckpointGate;

export type Phase = "countdown" | "racing";

/** strong / weak: a boost. early: pressed too soon. released: let go before GO.
 * none: no press during GET READY (including pressing at or after GO). */
export type StartTier = "strong" | "weak" | "early" | "released" | "none";

export interface StartResult {
  tier: StartTier;
  /** How many reference frames before GO the first press was. */
  frames?: number;
}

/** One kart's progress through the race. */
export interface Racer extends Progression {
  /** Current lap, 1-based. */
  lap: number;
  lapStart: number;
  lapTimes: number[];
  bestLap?: number;
  totalTime?: number;
  finished: boolean;
  offRoadFor: number;
  /** Kart position at the end of the previous step, for crossing tests. */
  px: number;
  py: number;
  pz: number;
  /** Clock time of the first throttle press during "GET READY...". */
  pressAt?: number;
  /** Let go of that press before GO (the boost is lost). */
  releasedEarly?: boolean;
  /** Throttle state last step; undefined before the first step. */
  throttleWas?: boolean;
  /** How the start went, once GO has happened. */
  start?: StartResult;
}

export interface Race {
  /** Open track: leaving the road never respawns you. */
  open: boolean;
  /** The checkpoints, in order (each with one or more gates). */
  course: Checkpoint[];
  /** Lap length over the checkpoints: progress() is in checkpoints, and times this it's
   * roughly metres along the lap (for gaps between racers). */
  metresPerCheckpoint: number;
  /** Each checkpoint's main gate, by index. */
  gates: Gate[];
  /** Track samples on the last 80 m before the line (x, z, metres before it): only for
   * ranking the starting grid, which can sit on the curve leading onto the line. */
  approach: { x: number; z: number; before: number }[];
  phase: Phase;
  /** Seconds since GO; negative during the countdown. */
  clock: number;
  /** True only on the step where GO happens. */
  goThisStep: boolean;
  racers: Racer[];
  /** Racer indices in the order they finished. */
  finishOrder: number[];
}

export interface RaceEvents {
  /** Put the kart back here (walled tracks: stuck off the road). */
  respawn?: Spot;
  /** Start boost to start right now, at GO. */
  boost?: { tier: "strong" | "weak"; mult: number; seconds: number };
  /** A checkpoint was validated, a lap completed, or a checkpoint lost by reversing. */
  checkpoint?: Gate;
  lap?: number;
  reversed?: Gate;
}

/** The track's route as checkpoint-placement samples (game coordinates). */
export function routeSamples(track: Track): RouteSample[] {
  return track.samples.map((p) => ({
    x: p.pos.x,
    y: p.pos.y,
    z: p.pos.z,
    fx: p.forward.x,
    fz: p.forward.z,
    width: p.width,
    dist: p.dist,
  }));
}

/** Gate sizes for a track: generous on open tracks, closer to the road between walls. */
export function gateOptions(track: Track): GateOptions {
  const d = track.data;
  return {
    ...DEFAULT_GATES,
    margin: d.gateMargin ?? (d.open ? DEFAULT_GATES.margin : 6),
    height: d.gateHeight ?? DEFAULT_GATES.height,
  };
}

/**
 * The track's checkpoints: Blender's gates (track.data.gates) if it has them, else the
 * ones listed in its data (track.data.checkpoints, by distance along the lap), else
 * placed automatically from the route.
 */
export function makeCourse(track: Track): Checkpoint[] {
  const d = track.data;
  if (d.gates?.length) return groupGates(d.gates);
  const s = routeSamples(track);
  const o = gateOptions(track);
  if (d.checkpoints?.length)
    return d.checkpoints.map((c, i) => {
      const g = gateAt(s, track.length, c.at, i, {
        ...o,
        ...(c.height !== undefined && { height: c.height }),
      });
      if (c.left !== undefined) g.left = c.left;
      if (c.right !== undefined) g.right = c.right;
      return { index: i, gates: [g] };
    });
  return checkpointsFromRoute(s, track.length, o);
}

/** Each checkpoint's main gate (kept for older callers and tests). */
export const makeGates = (track: Track): Gate[] => makeCourse(track).map((c) => c.gates[0]!);

function newRacer(course: Checkpoint[]): Racer {
  const start = course[0]!.gates[0]!;
  return {
    ...newProgression(course),
    lap: 1,
    lapStart: 0,
    lapTimes: [],
    finished: false,
    offRoadFor: 0,
    px: start.x,
    py: start.y,
    pz: start.z,
  };
}

export function createRace(
  track: Track,
  cfg: RaceConfig,
  racers = 1,
  course = makeCourse(track),
): Race {
  layChains(course, routeSamples(track), track.length);
  return {
    open: Boolean(track.data.open),
    course,
    metresPerCheckpoint: track.length / Math.max(1, course.length),
    gates: course.map((c) => c.gates[0]!),
    approach: track.samples
      .filter((p) => track.length - p.dist < 80)
      .map((p) => ({ x: p.pos.x, z: p.pos.z, before: track.length - p.dist })),
    phase: "countdown",
    clock: -cfg.readySec,
    goThisStep: false,
    racers: Array.from({ length: racers }, () => newRacer(course)),
    finishOrder: [],
  };
}

/** Where racer i goes if they need putting back: just past their last checkpoint. */
export const respawnSpot = (race: Race, i: number): Spot => race.racers[i]!.lastGate.respawn;

/** Tell the race a kart was moved (respawned): the jump isn't swept for crossings. */
export function teleported(race: Race, i: number, kart: { x: number; y: number; z: number }) {
  const r = race.racers[i]!;
  r.px = kart.x;
  r.py = kart.y;
  r.pz = kart.z;
}

/** Reference frames (startRefHz) between a press at clock time `pressAt` and GO (0).
 * A press in the step just before GO is frame 1. */
export function framesBeforeGo(pressAt: number, cfg: RaceConfig): number {
  return Math.ceil(-pressAt * cfg.startRefHz - 1e-6);
}

/**
 * Judge a start from the first press during GET READY: whether it was still held at
 * GO, and how many reference frames before GO it came.
 */
export function judgeStart(
  pressAt: number | undefined,
  heldAtGo: boolean,
  cfg: RaceConfig,
  releasedEarly = false,
): StartResult {
  if (pressAt === undefined) return { tier: "none" };
  const frames = framesBeforeGo(pressAt, cfg);
  if (releasedEarly || !heldAtGo) return { tier: "released", frames };
  if (frames <= 0) return { tier: "none", frames };
  if (frames <= cfg.startStrongFrames) return { tier: "strong", frames };
  if (frames <= cfg.startWeakFrames) return { tier: "weak", frames };
  return { tier: "early", frames };
}

export const canDrive = (race: Race) => race.phase !== "countdown";

/** Advance the shared race clock. Call once per step, before stepRacer. */
export function tickRace(race: Race, dt: number) {
  race.clock += dt;
  race.goThisStep = false;
  if (race.phase === "countdown" && race.clock >= 0) {
    race.phase = "racing";
    race.goThisStep = true;
  }
}

/** Advance one racer by a step, after its kart has moved. */
export function stepRacer(
  race: Race,
  index: number,
  kart: KartState,
  onRoad: boolean,
  throttle: number,
  cfg: RaceConfig,
  dt: number,
): RaceEvents {
  const r = race.racers[index]!;
  const events: RaceEvents = {};
  const pressed = throttle > 0.5;

  if (race.phase === "countdown" || race.goThisStep) {
    // A press is the moment the throttle goes down. One already held when the race
    // (re)starts doesn't count: on the first step we only note its state. Only the
    // first press counts, and letting go of it before GO loses the boost.
    if (race.phase === "countdown") {
      if (r.throttleWas === false && pressed && r.pressAt === undefined) r.pressAt = race.clock;
      if (r.pressAt !== undefined && !pressed) r.releasedEarly = true;
    }
    r.throttleWas = pressed;
    if (race.goThisStep) {
      r.start = judgeStart(r.pressAt, pressed, cfg, r.releasedEarly);
      if (r.start.tier === "strong")
        events.boost = { tier: "strong", mult: cfg.startStrongMult, seconds: cfg.startStrongSec };
      else if (r.start.tier === "weak")
        events.boost = { tier: "weak", mult: cfg.startWeakMult, seconds: cfg.startWeakSec };
    }
    r.px = kart.x;
    r.py = kart.y;
    r.pz = kart.z;
    return events;
  }

  if (!r.finished) {
    const step = stepProgression(race.course, r, { x: r.px, y: r.py, z: r.pz }, kart);
    if (step.passed) events.checkpoint = step.passed;
    if (step.reversed) events.reversed = step.reversed;
    if (step.lap) {
      const time = race.clock - r.lapStart;
      r.lapTimes.push(time);
      r.bestLap = Math.min(r.bestLap ?? Infinity, time);
      r.lapStart = race.clock;
      events.lap = step.lap;
      if (step.lap >= cfg.laps) {
        r.finished = true;
        r.totalTime = race.clock;
        race.finishOrder.push(index);
      } else {
        r.lap = step.lap + 1;
      }
    }
  }
  r.px = kart.x;
  r.py = kart.y;
  r.pz = kart.z;

  // Walled tracks only: grounded outside the walls for a moment means stuck.
  r.offRoadFor = !onRoad && !race.open && kart.grounded ? r.offRoadFor + dt : 0;
  if (r.offRoadFor > cfg.respawnAfterSec) {
    r.offRoadFor = 0;
    events.respawn = respawnSpot(race, index);
  }
  return events;
}

/**
 * How far round the race a racer is: checkpoints validated, plus how far from the last
 * one towards the next (between the two gate planes; negative behind the start line,
 * on the grid). Never from the nearest road: being off it changes nothing.
 */
export function progress(race: Race, index: number, x: number, z: number, y = 0): number {
  const r = race.racers[index]!;
  if (
    r.passed === 0 &&
    r.best === 0 &&
    race.approach.length &&
    planeDist(r.lastGate, { x, y, z }) < 0
  ) {
    // On the grid, behind the line: rank by distance along the road to the line.
    let best = race.approach[0]!;
    let bestD = Infinity;
    for (const p of race.approach) {
      const dd = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (dd < bestD) {
        bestD = dd;
        best = p;
      }
    }
    return -Math.min(0.999, best.before / 100);
  }
  return rankValue(race.course, r, { x, y, z });
}

/**
 * Racer indices from first place to last. Finished racers keep their finishing order;
 * the rest rank by progress, ties by racer index.
 */
export function standings(race: Race, positions: { x: number; y?: number; z: number }[]): number[] {
  const done = race.finishOrder;
  const value = race.racers.map((_, i) =>
    progress(race, i, positions[i]!.x, positions[i]!.z, positions[i]!.y ?? 0),
  );
  const rest = race.racers
    .map((_, i) => i)
    .filter((i) => !race.racers[i]!.finished)
    .sort((a, b) => value[b]! - value[a]! || a - b);
  return [...done, ...rest];
}

/** A racer's current lap time, or their last lap's once finished. */
export function lapClock(race: Race, index: number): number {
  const r = race.racers[index]!;
  if (race.phase === "countdown") return 0;
  return r.finished ? (r.lapTimes.at(-1) ?? 0) : race.clock - r.lapStart;
}

/** 83.456 → "1:23.45" */
export function formatTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return `${m}:${rest.toFixed(2).padStart(5, "0")}`;
}
