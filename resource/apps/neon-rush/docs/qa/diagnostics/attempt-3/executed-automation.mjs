// Normal keyboard strategy for the shared, wall-clock QA/recording harness.
// Receives deep-copy snapshots only; never writes browser or simulation state.
import { aiInput } from '../source/model.mjs';

export const budgets = { maxWebGLDrawCalls: 240 };
let previousTrack = '', previousTick = -1, steeringDebt = 0, lastKeys = [];
let resultStep = 0, resultTrack = '', lastNitroAt = -100;

export function keys(snapshot, { mode = 'qa' } = {}) {
  if (!snapshot || snapshot.paused) return [];
  const state = snapshot.model;
  if (!state?.player) return [];
  if (snapshot.phase !== 'playing') {
    if (mode !== 'record' || snapshot.phase !== 'won') return [];
    if (resultTrack !== state.trackId) { resultTrack = state.trackId; resultStep = 0; }
    // Record finished results before ordinary menu selection starts the next track.
    resultStep++;
    if ((snapshot.level ?? state.trackIndex) >= 2 || resultStep < 22) return [];
    if (resultStep === 22) return ['ArrowRight'];
    if (resultStep === 24) return ['Enter'];
    return [];
  }
  if (state.trackId !== previousTrack || snapshot.tick < previousTick) {
    steeringDebt = 0; lastKeys = []; lastNitroAt = -100;
    previousTrack = state.trackId;
  }
  if (snapshot.tick === previousTick) return [...lastKeys];
  previousTick = snapshot.tick;
  if (state.countdown > 0) return [];
  const requested = aiInput(state, state.player);
  const result = [];
  const turn = Number.isFinite(requested.x) ? Math.max(-1, Math.min(1, requested.x)) : 0;
  // A keyboard has no fractional steering axis. Signed pulse-density control
  // uses actual left/right keys and the game's own gradual steering response.
  steeringDebt += turn;
  if (steeringDebt >= 0.5) { result.push('ArrowRight');steeringDebt -= 1; }
  else if (steeringDebt <= -0.5) { result.push('ArrowLeft');steeringDebt += 1; }
  // The game accelerates automatically. Avoid an unnecessary Up chord, which
  // would normalize both direction axes and reduce the physical steering input.
  if (requested.y > 0.25) result.push('ArrowDown');
  if (requested.a) result.push('Space');
  const t = Number(state.raceTime) || 0;
  if (requested.bPressed && t - lastNitroAt > 0.35) { result.push('b'); lastNitroAt = t; }
  lastKeys = result;
  return result;
}

export function assertProgress({ before, after, trace }, assert) {
  const samples = [...trace.map(row => row.state), after].filter(row => row?.model?.player);
  assert.ok(after.tick > before.tick, 'Simulation must advance under ordinary keyboard input');
  assert.ok(samples.some(row => row.model.player.speed > 10), 'Player must actually accelerate');
  assert.ok(samples.some(row => row.model.player.progress > 30), 'Player must move along the race course');
  assert.ok(samples.some(row => row.model.stats?.nitros > 0), 'The real nitro action must be consumed');
  assert.ok(samples.some(row => row.model.stats?.drifts > 0), 'A moving corner drift must occur');
  for (const row of samples) {
    const car = row.model.player;
    assert.ok([car.x,car.y,car.z,car.yaw,car.speed,car.progress,car.nitro].every(Number.isFinite), 'Race state remains finite');
    assert.ok(car.nitro >= 0 && car.nitro <= 100, 'Nitro stays within its resource bounds');
  }
}

export function assertRetry({ after }, assert) {
  assert.equal(after.model.player.completedLaps, 0, 'Retry clears completed laps');
  assert.equal(after.model.player.finished, false, 'Retry clears the finished state');
  assert.equal(after.model.stats.nitros, 0, 'Retry clears nitro-use statistics');
  assert.equal(after.model.stats.drifts, 0, 'Retry clears drift statistics');
  assert.ok(after.model.countdown > 0, 'Retry returns to the ordinary countdown');
}
