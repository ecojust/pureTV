// Projectile positions blended between the two newest snapshots, on the same time base as the cars (cars are drawn between snapshot A
// and B at alpha). Drawing projectiles at B alone put them up to one sim tick (about 0.75 m for a missile) ahead of the cars they hit.
import { wrapAngle } from '../core/mathUtil.js';

/** interpolateProjectiles(prev, next, t) -> projectiles from `next`, with x, y and heading blended from the same id in `prev` by t. */
export function interpolateProjectiles(prev, next, t) {
  if (!next || !next.length) return next || [];
  if (!prev || !prev.length || !(t < 1)) return next;
  const k = Math.max(0, t);
  const before = new Map(prev.map((p) => [p.id, p]));
  return next.map((p) => {
    const a = before.get(p.id);
    if (!a) return p;
    return { ...p, x: a.x + (p.x - a.x) * k, y: a.y + (p.y - a.y) * k, heading: a.heading + wrapAngle(p.heading - a.heading) * k };
  });
}
