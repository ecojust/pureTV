// Hero-slice race setup: the player's Hammer vs four enemy Hammers on the Neon Loop. Pure data (no three).
import { createRaceConfig } from './raceConfig.js';
import { getCar } from './cars.js';
import { getDriver } from './drivers.js';
import { applyUpgrades } from './upgrades.js';
import { pickDrivers, assignLiveries } from './fieldPick.js';
import { playerLivery, resolveFieldLiveries } from './liveries.js';

export const SLICE_TRACK_ID = 'neonloop';
export const SLICE_LAPS = 3;
/** Enemy field (grid order is set by createRaceConfig): name -> livery palette index (player's Hammer is orange 9). */
export const SLICE_FIELD = [
  { id: 'vex', color: 12, number: '07' },     // fast, aggressive, machine gun
  { id: 'fuse', color: 11, number: '33' },    // precise, rockets
  { id: 'kane', color: 2, number: '66' },     // champion, terminator missile + ramming
  { id: 'cinder', color: 8, number: '13' },   // brawler, flamethrower
];

export function createSliceConfig({ save, seed, laps = SLICE_LAPS, field = SLICE_FIELD } = {}) {
  const cfg = createRaceConfig({ mode: 'race', trackId: SLICE_TRACK_ID, laps, save, seed, rivalIds: field.map((f) => f.id) });
  cfg.rivals = cfg.rivals.map((r) => {
    const f = field.find((x) => x.id === r.driverId), d = getDriver(r.driverId);
    return { ...r, carId: 'hammer', color: f ? f.color : r.color, number: f ? f.number : '00', stats: applyUpgrades(getCar('hammer').base, d.upgrades), hunt: true };
  });
  cfg.slice = true;
  return cfg;
}

// ---------------------------------------------------------------- the game's own race setup (6 cars: player + 5 of the 8 drivers)
export const FIELD_ENEMIES = 5;
const LIVERY_POOL = [12, 11, 2, 8, 14, 13, 5, 4, 10, 3, 9, 15, 1, 6];
/** Pure: pick `n` distinct drivers for a race (seeded, so a given seed always gives the same field), mixing all three cars. */
export function pickField(seed, n = FIELD_ENEMIES) { return pickDrivers(seed, n); }

/**
 * Pure: the driver ids that actually race in this setup, in grid order. Race mode: the field drawn with the track.
 * Practice: that same field only when rivals are on, otherwise nobody, unless a contract is running: its named racers
 * must race for it to show, so the field is on the grid. Bids name racers only from this list.
 */
export function gridIds({ mode = 'race', practiceRivals = false, field = null, contract = null } = {}) {
  if (mode === 'practice' && !practiceRivals && !contract) return [];
  return field && field.length ? [...field] : [];
}

/**
 * Pure: the drawn field with a running contract's named racers put on the grid, in the drawn order. A contract that is
 * still open (accepted, not yet settled) can only settle if its racers race, so they replace drawn racers from the back.
 */
export function fieldKeeping(drawn = [], contract = null) {
  const named = (contract?.targets || []).filter((id) => getDriver(id));
  const missing = named.filter((id) => !drawn.includes(id));
  const out = [...drawn];
  for (let i = out.length - 1; i >= 0 && missing.length; i--) {
    if (!named.includes(out[i])) out[i] = missing.shift();
  }
  return out;
}

/**
 * createGameConfig({ mode, trackId, laps, save, seed, practiceRivals, field }) -> RaceConfig with `hero`/`heroStyle` set:
 * the player's car from the save + 5 enemies (each driver keeps their own car, weapons, skill and aggression), distinct liveries.
 * `field` = the driver ids drawn when the track was chosen (the racers the bids name); without one, the seed draws it.
 */
export function createGameConfig({ mode = 'race', trackId = SLICE_TRACK_ID, laps, save, seed, practiceRivals = false, field = null } = {}) {
  const practice = mode === 'practice';
  const contract = save?.contract || null;
  const onGrid = gridIds({ mode, practiceRivals, field, contract });
  // no field drawn (a debug skip): the seed draws one, keeping a running contract's racers on it; practice without rivals has nobody
  const nobody = practice && !practiceRivals && !contract;
  const ids = onGrid.length || nobody ? onGrid : fieldKeeping(pickDrivers(seed ?? 1, FIELD_ENEMIES), contract);
  const cfg = createRaceConfig({ mode, trackId, laps, save, seed, rivalIds: ids });
  const colors = assignLiveries(cfg.rivals.map((r) => r.color), cfg.player.color, LIVERY_POOL);
  const pl = playerLivery(save || {});
  const lives = resolveFieldLiveries(cfg.rivals.map((r) => getDriver(r.driverId)), pl.paint);
  cfg.player.livery = pl;
  cfg.rivals = cfg.rivals.map((r, i) => ({ ...r, color: colors[i], number: lives[i].number, livery: lives[i], hunt: true }));
  cfg.hero = true; cfg.heroStyle = 'pbr'; cfg.slice = true;
  return cfg;
}
