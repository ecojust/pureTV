// Slice-only short circuit: "Neon Loop" — Detroit ruins at dusk. ~1 km: long straight, fast sweeper, hairpin, back leg with a chicane.
// Not in TRACKS (the normal game never lists it); resolved by getTrack() via SLICE_TRACKS.
const RAW = [
  [140, 0], [220, 0], [300, 0], [380, 0],
  [432, 10], [470, 42], [488, 92], [490, 140], [490, 190],        // fast sweeper to the south
  [484, 232], [455, 258], [420, 250], [402, 215],                 // hairpin
  [400, 175], [378, 140], [335, 122], [285, 118],                 // back to the west
  [240, 130], [200, 112], [160, 126],                             // chicane
  [110, 126], [60, 105], [20, 70], [10, 30], [40, 6], [90, 0],    // final sweep onto the straight
];
export const NEON_LOOP = {
  id: 'neonloop', name: 'Neon Loop', city: 'Detroit',
  blurb: 'A short, wet, neon-lit circuit through the ruins. One long straight, one nasty hairpin.',
  laps: 3, prize: 4000, width: 16,
  theme: { ground: 5, road: 0, curb: [8, 7], sky: [12, 1], scenery: 'junk' },
  control: RAW.map(([x, y]) => [x * 0.88, y * 0.88]),
  pickups: [{ s: 0.2, type: 'ammo' }, { s: 0.5, type: 'repair' }, { s: 0.8, type: 'ammo' }],
  // surface zones (sim/surfaces.js): wet patches and an oil slick
  surfaces: {
    oil: [{ s: 0.42, d: -4.5, r: 2.6 }],
    puddles: [{ s: 0.1, d: 3.5, r: 3.2 }, { s: 0.3, d: -3, r: 3.4 }, { s: 0.55, d: 2.5, r: 3 }, { s: 0.7, d: -3.2, r: 3.2 }, { s: 0.9, d: 3, r: 3.2 }],
    dirt: [],
  },
};
/** Foundry Run: the Neon Loop's mirror image, stretched (left-hand hairpin, reversed chicane) with a hotter, industrial look. */
export const FOUNDRY_RUN = {
  id: 'foundry', name: 'Foundry Run', city: 'Detroit',
  blurb: 'Left-handers through a dead steelworks. Hot light, long shadows, a hairpin that bites.',
  laps: 3, prize: 6000, width: 16,
  theme: { ground: 5, road: 0, curb: [9, 7], sky: [9, 2], scenery: 'junk' },
  look: {
    kit: 'steelworks', env: 'forge', seed: 191,       // prop kit (render/pbr/steelworks.js) and sky (render/pbr/env.js)
    fog: 0x5a2e1c, fogDensity: 0.0065, key: 0xff8a4a, keyIntensity: 1.7, bgIntensity: 0.32,
    sunElev: 0.16,                                    // low sun for long shadows; = FORGE_SUN_ELEV in render/pbr/env.js
    hemi: 0x7a4a32, hemiGround: 0x2a1812, ground: 0x4a3a33,
  },
  control: RAW.map(([x, y]) => [y * 1.12, x * 1.12]),
  pickups: [{ s: 0.15, type: 'ammo' }, { s: 0.4, type: 'repair' }, { s: 0.65, type: 'cash' }, { s: 0.85, type: 'ammo' }],
  surfaces: {
    oil: [{ s: 0.3, d: 4.6, r: 2.6 }, { s: 0.74, d: -4.2, r: 2.5 }],
    puddles: [{ s: 0.08, d: -3, r: 3.2 }, { s: 0.22, d: 3.2, r: 3.3 }, { s: 0.47, d: -2.6, r: 3 }, { s: 0.6, d: 3, r: 3.2 }, { s: 0.92, d: -3.4, r: 3 }],
    dirt: [],
  },
};
/**
 * Daylite: a sunset in red dust on the lower Manhattan waterfront. The quay straight runs along the harbour (east); the towers
 * stand in haze on the land side (west), and the Statue of Liberty stands out on her island in the water.
 * Sun behind the city (= sunDir(DUST_SUN_ELEV) in render/pbr/env.js), so the statue is backlit and the road shadows fall to the water.
 */
export const DAYLITE = {
  id: 'daylite', name: 'Daylite', city: 'New York',
  blurb: 'Last light through red dust. The quay straight runs along the harbour, and the Lady watches from her island.',
  laps: 3, prize: 8000, width: 16,
  theme: { ground: 5, road: 0, curb: [9, 7], sky: [9, 2], scenery: 'skyline' },
  look: {
    kit: 'manhattan', env: 'dust', seed: 233,         // prop kit (render/pbr/manhattan.js) and sky (render/pbr/env.js)
    fog: 0xc3bdb2, fogDensity: 0.0028, key: 0xfff0dc, keyIntensity: 1.9, bgIntensity: 1.25,   // bright daylight haze; bgIntensity is the sky's own brightness
    sunElev: 0.09,                                    // low afternoon sun; = DUST_SUN_ELEV in render/pbr/env.js
    hemi: 0x9fb4cc, hemiGround: 0x4a4238, ground: 0x6e6257,
  },
  control: [
    [60, 0], [150, -4], [250, -2], [320, 14], [366, 50], [388, 120],     // start straight, SE sweep
    [388, 200], [372, 270], [330, 310], [270, 322],                      // quay straight, NE corner, top straight
    [206, 318], [160, 300], [124, 270], [96, 256],                       // chicane: a wide S down to the west run
    [60, 250], [22, 236], [-4, 206], [-10, 166], [-4, 126], [6, 92],     // west run, hairpin, back down the west side
    [2, 50], [36, 22],                                                   // bend onto the start straight
  ],
  pickups: [{ s: 0.15, type: 'ammo' }, { s: 0.4, type: 'repair' }, { s: 0.65, type: 'cash' }, { s: 0.85, type: 'ammo' }],
  surfaces: {
    oil: [{ s: 0.3, d: 4.6, r: 2.6 }],
    puddles: [{ s: 0.08, d: -3, r: 3.2 }, { s: 0.22, d: 3.2, r: 3.3 }, { s: 0.6, d: -2.6, r: 3 }],
    dirt: [{ s0: 0.66, s1: 0.78, side: -1 }],          // red dust drifted over one kerb through the chicane and west run
  },
};
export const SLICE_TRACKS = [NEON_LOOP, FOUNDRY_RUN, DAYLITE];
/** The tracks of the game, in difficulty order. */
export const GAME_TRACKS = SLICE_TRACKS;
