// Per-campaign art registry. Each seasonal campaign's sprite module registers its drawers here
// (imported for its side effect from sprites.ts); anything missing falls back to placeholder art.
import type { EnemyId, Realm } from '../../game/config';
import type { Ally, Building, Enemy, Game } from '../../game/game';

type C = CanvasRenderingContext2D;

/** Pose of an enemy for drawing; local units are scaled so 1 = the enemy's radius. */
export interface Pose {
  x: number;
  y: number;
  s: number;
  a: number;
  flip: number;
  ph: number;
}
export type Mode = 'body' | 'glow';
export type EnemyDraw = (c: C, e: Enemy, t: number, P: Pose, mode: Mode) => void;

export interface RealmArt {
  /** Draw a structure of this campaign (world units, 1 = one tile; the tile is (b.x, b.y)–(b.x+1, b.y+1)). */
  building?(ctx: C, b: Building, t: number, game: Game): void;
  /** How tall a structure is, for framing its icon: 0 squat, 0.5 tall, 1 very tall, 1.25 colossal. */
  iconTall?(id: string): number;
  /** Enemy drawers, called with the context translated to the enemy and scaled by its radius. */
  enemies?: Partial<Record<EnemyId, EnemyDraw>>;
  /** The core (3×3 tiles centred on CORE_X+0.5, CORE_Y+0.5). */
  core?(ctx: C, game: Game, t: number): void;
  /** An enemy spawn point at tile (x, y). */
  rift?(ctx: C, x: number, y: number, t: number, state: 'open' | 'forming'): void;
  /** Allied units (raised zombies, the war mammoth). */
  ally?(ctx: C, a: Ally, t: number): void;
}

export const REALM_ART: Partial<Record<Realm, RealmArt>> = {};

export function registerArt(realm: Realm, art: RealmArt) {
  REALM_ART[realm] = art;
}
