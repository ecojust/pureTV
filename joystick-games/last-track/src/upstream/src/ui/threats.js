// Incoming-threat warning: rockets, guided missiles and terminator drones in flight that are aimed at the player's car, or already
// locked onto it. Pure (no DOM): works from the race snapshot. A bearing is car-relative: 0 = dead ahead, +pi/2 = the player's right.
import { wrapAngle } from '../core/mathUtil.js';

export const THREAT_LABELS = Object.freeze({ rocket: 'ROCKET', guided: 'GUIDED MISSILE', terminator: 'TERMINATOR DRONE' });
export const AIM_CONE = 0.42;     // rad (~24°): a projectile whose heading points this close to the car
export const AIM_RANGE = 220;     // m: beyond this an aimed projectile is no threat yet
export const LOCK_RANGE = 260;    // m: a projectile already homing on the player

/**
 * threatsFor(snap) -> [{ id, type, label, bearing, dist, lock }], most urgent first (locked, then nearest).
 * Only the enemy's projectiles count: the player's own shots and wrecked or spectated players get none.
 */
export function threatsFor(snap) {
  const me = snap && snap.cars ? snap.cars.find((c) => c.isPlayer) : null;
  if (!me || me.wrecked || !snap.projectiles) return [];
  const out = [];
  for (const p of snap.projectiles) {
    if (!THREAT_LABELS[p.type] || p.ownerId === me.id) continue;
    const dx = me.x - p.x, dy = me.y - p.y, dist = Math.hypot(dx, dy);
    const lock = p.targetId === me.id && dist < LOCK_RANGE;
    const aimed = dist < AIM_RANGE && Math.abs(wrapAngle(Math.atan2(dy, dx) - p.heading)) < AIM_CONE;
    if (!lock && !aimed) continue;
    // where the threat sits, in the player's frame: forward = along the car, right = the car's right-hand side
    const rx = p.x - me.x, ry = p.y - me.y, c = Math.cos(me.heading), s = Math.sin(me.heading);
    const f = rx * c + ry * s, r = -rx * s + ry * c;
    out.push({ id: p.id, type: p.type, label: THREAT_LABELS[p.type], bearing: Math.atan2(r, f), dist, lock });
  }
  return out.sort((a, b) => (b.lock - a.lock) || (a.dist - b.dist));
}
