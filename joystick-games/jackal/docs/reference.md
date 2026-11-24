# Jackal TV — independent NES gameplay rewrite

The runtime is newly written JavaScript with named game states. It does not load a ROM, emulate a CPU, interpret a game instruction stream, or incorporate another project's program implementation. The earlier three-stage original-style game has been replaced with the six-stage NES USA world model.

This document distinguishes evidence, converted game data, independently written logic, and remaining verification work. Passing unit tests does not establish that every arbitrary-input playthrough matches original hardware.

## Sources and rights

| Source | Pinned revision | What was consulted or converted | Rights boundary |
| --- | --- | --- | --- |
| [RayofJay's commented Jackal disassembly](https://github.com/RayofJay/NES-Jackal_Disassembly_Fully_Commented/tree/f6788304f7021cb50938238a66123bb1db03a9e6) | `f6788304f7021cb50938238a66123bb1db03a9e6` | Named states, constants, collision flags, controls, weapon/rescue rules, boss handlers | The author's README grants MIT-0 to disassembly/commentary work and disclaims ownership of the original Konami code. No original assembly is shipped or executed here. |
| [HungLo2020/Jackal](https://github.com/HungLo2020/Jackal/tree/b6d90a1c999dcb9d6f82cdc0e88ef876aac4ee77) | `b6d90a1c999dcb9d6f82cdc0e88ef876aac4ee77` | Six `assets/levels/stage_XX.json` files, entity facts, destruction patches, timing observations and audit | No explicit license was located. Original recovered content is attributed to Konami; it is **not** relicensed under the MIT license for our newly written runtime. Third-party program implementation was not copied. |
| [orsicreative/jackal-map-ripper](https://github.com/orsicreative/jackal-map-ripper/tree/744b58b430aba670ecdd46188bee94ef594428bb) | `744b58b430aba670ecdd46188bee94ef594428bb` | Corroboration of the map/metatile encoding | MIT tool; no ROM or generated artwork obtained from this tool. |
| [VGMaps stage reference](https://www.vgmaps.com/Atlas/NES/Jackal-Stage1.png) | Original NES screenshots, Stage1–Stage6 | Visual comparison of whole-stage arrangement | Reference images are original game visuals with mapper credits, not an assumed permissive asset library. |

The map and spawn bytes are **omitted** from the commented disassembly: its corresponding tables have labels and `.PAD` directives, not the complete payload. Therefore, the maps here must not be described as decoded from those blank tables. Their actual source is the pinned JSON dataset above. Each `data/stage-N.json` records its exact input URL and SHA-256. `data/entities.json` and `data/destruction.json` likewise record provenance.

Visual/audio files have their own asset manifest and rights assessment. Availability in a public repository does not establish permission to redistribute original artwork, maps, cinematics or music.

## Editable data and loading

`src/main/assets/data/stage-1.json` through `stage-6.json` contain flattened 8-pixel tile, palette and collision grids, original source-type spawn events, camera origins, and palette/forced-scroll commands. The event fields are:

| Field | Meaning |
| --- | --- |
| `distance` | Camera progress measured from the bottom of the complete world. Initial progress is 240 pixels. |
| `x` | Original world X in a 512-pixel-wide stage. |
| `source_type` | Original actor type with its priority bit removed. Use this for behavior; some legacy human-readable `kind` names in the recovered dataset are early approximations. |
| `raw_source_type` | Source actor byte including its high priority bit. |
| `priority_spawn` | Requests priority allocation in the original shared 16-actor pool. |
| `from_bottom` | Spawn at camera-relative Y239 instead of the top edge. |
| `odd_difficulty_only` | Odd trigger entries are suppressed unless the maximum weapon difficulty applies. |
| `source_page` | Original source page, retained for auditing. |

World Y is `worldHeight - distance + (from_bottom ? 239 : 0)`. Source pages stream **240** pixels, skipping the first two 8-pixel rows of each source section; treating them as 256-pixel pages makes scenery and actors drift apart.

| Stage | World | Spawn events | Initial camera X |
| --- | --- | --- | --- |
| 1 | 512 × 3120 | 74 | 0 |
| 2 | 512 × 3120 | 107 | 128 |
| 3 | 512 × 3120 | 133 | 68 |
| 4 | 512 × 3120 | 92 | 0 |
| 5 | 512 × 3120 | 138 | 144 |
| 6 | 512 × 3360 | 143 | 205 |

Run `node resource/apps/jackal/tools/build-levels.cjs` after editing JSON. Its `--check` mode detects bundle drift. Generated `levels.js` synchronously exposes `JackalLevels`; Android's asset WebView does not need network fetches. Load `levels.js`, `enemies.js`, then `game-model.js`.

`level.tiles`, `level.palettes`, and `level.collision` are live per-game copies. Permanent destruction modifies these arrays and appends `backgroundPatches`, while the source dataset remains immutable. Collision values are ground0, solid1, water2, special3; stage-four special tiles are slow traversable marsh.

## Reference-backed mechanics

Line references below refer to the pinned [`Bank7.ASM`](https://github.com/RayofJay/NES-Jackal_Disassembly_Fully_Commented/blob/f6788304f7021cb50938238a66123bb1db03a9e6/ASM%20Source/Code/Bank7.ASM) and [`Bank6.ASM`](https://github.com/RayofJay/NES-Jackal_Disassembly_Fully_Commented/blob/f6788304f7021cb50938238a66123bb1db03a9e6/ASM%20Source/Code/Bank6.ASM).

| Behavior | Evidence and implementation |
| --- | --- |
| Controls and lives | Start selects/pauses, Select switches title/Continue choices, A throws the main weapon, B fires north. Five initial lives, three continues. Bank7 1367–1377, 5260–5360. |
| Movement | One pixel per tick on each pressed axis; diagonal movement is not normalized. Facing rotates at the original four-tick cadence. Directional two-point terrain checks use Bank7 `table11`; marsh slows movement to half speed. |
| Camera | Native 256×240 viewport inside the 512-pixel world, both axes scroll, with up to64 pixels of recent backtracking and separate co-op thresholds. Bank7 `Label995` through `Label1135`. |
| Machine gun | Northward6 pixels per tick,16-tick flight, three projectile slots per player; held B repeats on global32-tick boundaries. Bank7 5911–5930. The named `$18` travel constant in `JeepAttributes.ASM` is unused; the handler actually writes `$10`. |
| Main weapon | Four levels: grenade, rocket, rocket with horizontal splash, rocket with horizontal and vertical splash. Grenade40-tick fuse and2 cardinal/1.5 diagonal-axis speed; rocket22-tick flight and4 cardinal/2.75 diagonal-axis speed. Final boss extends these to50/32 ticks. Main explosion24 ticks; directional splash40 ticks. Bank7 5990–6440. |
| Damage flags | HP bit7 distinguishes main-weapon damage subtraction from an immediate main-weapon kill; **it is not gun immunity**. Gun immunity comes from hitbox bit6. Prison huts use hitbox`0xC2`, so bullets ignore them and main weapons open them. Bank7 4590–4750 and `tblEnemyHitBoxIndex`. The recovered field `grenade_only` must not be treated as a complete collision rule. |
| POW buildings | Types`13/14` release2, `1c/1d` release4, type`15` releases one sparkling upgrade POW, and type`19` is a tank garage. Ordinary POWs wait in a queue until the preceding prisoner is collected. Ordinary buildings show HELP for64 ticks after the explosion; special huts have a distinct release path. Bank6 2910–3015, 7145–7235. |
| Rescue | No invented eight-passenger cap. Special POW increments weapon level; drop-off delay16 initially then32; upgrades at4,9,15 rescued. No invented pickup score; completing the96-tick walk into a helicopter awards the original500-point type`27` value (800 in two-player mode). Bank7 `POWPickedUp`, `JeepNormalState`. |
| Rescue helicopter | Landed wait128, no-passenger grace256, spinup64, upward departure, offscreen wait and return flyover. Type`3f` marks the actual interaction zone; stage-dependent harassment comes from its original table. Bank6 7320–7575. |
| Death | Weapon resets to grenade. Release `min(4, max(0, carried-1))` POWs. Three6-tick explosion frames then96-tick respawn wait,160 invulnerable ticks. An eliminated co-op partner may use A+B to take a life when the other has at least2. Bank7 5260–5330, 5812–5880; Bank6 3316–3366. |
| Score | First extra life at20,000 then every50,000, life cap9. Stage tally awards2,000 per **delivered** POW, carried POWs persist into the next stage. Large tallies extend the transition. Bank7 `tblPointValues`, `StageTransitionState3`. |

Enemy/boss module findings and limitations are documented separately in [reference-enemies.md](reference-enemies.md). Six distinct encounter compositions replace the previous three generic stationary bosses.

## Presentation state contract

Simulation runs at60.0988 fixed ticks per second. `step(dt, inputs)` accumulates time; large gaps are capped to avoid teleportation. `tick(inputs)` advances one native tick for deterministic tests. Inputs are `{id, connected, x, y, a, b, start, select}`.

Phases are `title`, `attract`, `intro`, `deployment`, `playing`, `paused`, `stageclear`, `continue`, `gameover`, and `ending`. Phone disconnection automatically pauses active play; this is a modern LAN-controller adaptation rather than original NES behavior.

`phaseFrame` is local to the named state. `cinematicKey` plus `cinematicFrame` identify the full presentation timeline across split intro/deployment states. Captured reference timings from the pinned reconstruction are:

| Presentation | Reference ticks |
| --- | --- |
| Title idle before attract | 385 |
| Attract capture | 1143, including the return transition frame |
| Start to gameplay, 1P / 2P | 632 / 648 |
| Continue load | 161 |
| Normal stage victory / next-stage load | 569 / 32, before extra tally delay |
| Exhausted-continue game-over capture | 450 |
| Ending until Start can restart / restart delay | 5162 / 84 |

The reference timelines identify historical static-translation revision `e8fc3391d5b27fcd98b82fd27984141840449708`; they are not claimed to be physical-hardware captures. The split at intro tick83 is a state naming boundary at the recorded deployment sound cue; it does not add or remove frames. A completed harder loop sets maximum difficulty and does not restore continues.

Renderer-facing players expose `frameId`, `flipX`, `flipY`, `palette` and world coordinates. Green player1 uses palette0; brown player2 uses palette1 outside invulnerability flashing. `.weapons` includes main projectiles, their explosion animation and directional splash; `.grenades` includes only flying grenades/rockets. Rescue actors are separate `.huts`, `.prisoners`, `.helipads`, `.helicopters`, `.pickups`; invisible zones should not be rendered as invented structures.

## Verification and remaining gaps

Run:

```sh
node resource/apps/jackal/tools/build-levels.cjs --check
node --test resource/apps/jackal/tests/game.test.cjs resource/apps/jackal/tests/enemies.test.cjs
```

Core tests check independent source facts, map dimensions and event anchors, controls, weapons, queued rescue, camera backtracking, co-op life sharing, all transition timings, score/tally rules and bounded deterministic combat. Enemy tests separately cover source-type behavior and six boss compositions.

Remaining comparison work is explicit:

- No complete arbitrary-input playthrough has been compared frame-for-frame against original NES hardware. Current timing references are a secondary historical reconstruction.
- Shared actor capacity is enforced, but exact descending hardware slot allocation and every priority eviction choice can affect later timing and are not yet byte-for-byte verified.
- Player collision uses recovered directional probes; corner/subpixel carry, co-op deaths at scrolling boundaries, scene-induced collision changes and escalator transitions still need recorded trace comparison.
- Main-weapon splash geometry and secondary pass-through behavior need complete per-frame multi-target comparisons. Ordinary gameplay tests cannot prove all overlapping-enemy collision order.
- POW wandering, helicopter departure under camera motion, and crowded rescue allocation require full reference traces. Respawn safety can relocate to a nearby free point if changed scenery would embed a jeep; this is an explicit modern safeguard.
- Palette preparation/change commands are exposed, but complete original graphics-upload scheduling, animated water/escalator tile updates, sprite priority and scanline overflow depend on renderer work and separate verification.
- Captured cinematic backgrounds do not by themselves validate live HUD/tally digits, all sprites and arbitrary rescue counts; the renderer must combine dynamic state appropriately.

These gaps must not be hidden behind a claim of exact restoration. They are follow-up fidelity work, distinct from the verified replacement of the old invented world and rules.
