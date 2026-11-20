// The winning lap: the player's car drives the track's centreline by itself, filmed by the TV camera, with fireworks overhead.
// It is kinematic, not the race sim: the pose follows track.pointAt, so the car never crashes and takes no input.
import { createRaceController } from './raceController.js';
import { createFireworks, burstInFrame } from './fireworks.js';

export const LAP_SECONDS = 36;             // one lap of the winning run: about 30 m/s on the game tracks
export const LAUNCH_GAP = [0.5, 0.9];      // seconds between shells (random in this range)

/** Arc length per second for one lap of `length` metres in `seconds`. */
export const lapSpeed = (length, seconds = LAP_SECONDS) => length / Math.max(1, seconds);
/** A distance along the track wrapped into [0, length). */
export const wrapDistance = (s, length) => ((s % length) + length) % length;

/**
 * The race snapshot for one frame of the lap: only the player's car, placed at `pose` ({x, y, heading}) and rolling at `speed`.
 * `template` is the race's final snapshot, so the car keeps its model, livery and weapons. No rivals, wrecks, pickups or shots.
 */
export function victorySnapshot(template, pose, speed) {
  const base = template.cars.find((c) => c.isPlayer) || template.cars[0];
  const c = Math.cos(pose.heading), s = Math.sin(pose.heading);
  const car = {
    ...base, id: 0, isPlayer: true, x: pose.x, y: pose.y, heading: pose.heading,
    vx: c * speed, vy: s * speed, speed, steer: 0, throttle: 0.6, braking: false, ax: 0, ay: 0, yawRate: 0,
    wheelspin: 0, slip: 0, firing: false, wrecked: false, finished: false, surface: 'tarmac',
  };
  return { ...template, cars: [car], phase: 'racing', countdown: 0, events: [], projectiles: [], hazards: [], pickups: [] };
}

/**
 * createVictoryLap(host, track, template, { carId, seed, rng }) -> { update(dt), dispose(), progress, sparks }. Call host.render() after update().
 * The car runs the TV camera. Shells go up at random points in the camera's frame, and each one bursts there.
 */
export function createVictoryLap(host, track, template, { carId = 'hammer', seed = 1, rng = Math.random } = {}) {
  const config = { mode: 'race', hero: true, heroStyle: 'pbr', slice: true, seed, laps: 1, player: { carId }, rivals: [] };
  const controller = createRaceController(host, track, config);
  controller.setCamera('tv');
  const fireworks = createFireworks(host.scene, { rng });
  const speed = lapSpeed(track.length);
  let s = 0, toLaunch = 0.4;
  return {
    update(dt) {
      s = wrapDistance(s + speed * dt, track.length);
      const pose = track.pointAt(s);
      const snap = victorySnapshot(template, pose, speed);
      controller.update(snap, snap, 1, dt);
      toLaunch -= dt;
      if (toLaunch <= 0) {
        const p = burstInFrame(host.camera, rng);
        if (p) fireworks.launch(p);
        toLaunch = LAUNCH_GAP[0] + rng() * (LAUNCH_GAP[1] - LAUNCH_GAP[0]);
      }
      fireworks.update(dt);
    },
    /** How far round the lap the car is, 0..1 (for checks). */
    get progress() { return s / track.length; },
    /** Live sparks in the air (for checks). */
    get sparks() { return fireworks.count; },
    dispose() { fireworks.dispose(); controller.dispose(); },
  };
}
