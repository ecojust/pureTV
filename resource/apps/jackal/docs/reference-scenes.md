# Jackal scene graphics adapter

`src/main/assets/scene-updates.js` connects model events to background tile rows and the changing tile/sprite atlases. It is newly written presentation code. It does not execute assembly, emulate a PPU, or interpret a game instruction stream.

## Data sources

The source revisions are fixed:

| Data | Reference | Use |
| --- | --- | --- |
| Final tank appearance and destruction rows | [RayofJay, Bank7.ASM, lines 2793–3050](https://github.com/RayofJay/NES-Jackal_Disassembly_Fully_Commented/blob/f6788304f7021cb50938238a66123bb1db03a9e6/ASM%20Source/Code/Bank7.ASM#L2793) | The 40 table entries at indices `0x3d..0x64`, including PPU destination addresses and tile values, converted to ordinary row data. Only the data tables are represented; the assembly handlers are not copied or run. |
| Stage graphics and palette transitions | [HungLo2020, texture_phases.json](https://github.com/HungLo2020/Jackal/blob/b6d90a1c999dcb9d6f82cdc0e88ef876aac4ee77/assets/texture_phases.json) | Six stages' `palette_prepare`, `palette_change`, and stage-six `headquarters_gate` timelines. Every recorded intermediate atlas is retained. |
| HQ collapse and final destruction | `assets/textures/hq_collapse/timeline.json`, `hq_final/timeline.json` at the same revision | Texture changes and their recorded tick offsets. These files do **not** contain background tile coordinates or row payloads; those come from the preceding assembly data tables. |
| Final tank tread transitions | `hq_building_initial_0`, `hq_building_0_1`, `hq_building_1_2`, `hq_building_2_3`, `hq_building_3_0` timelines at the same revision | Tile and sprite atlases corresponding to the current model's four tread states, including intermediate uploads. |

The HungLo2020 repository has no explicit license for the recovered original artwork. Public availability is not a redistribution grant. Original game assets retain their original ownership; the project's code license does not relicense them. Reference PNGs and source JSON are maintained separately in the local reference library, not added to the public source tree by this adapter. No Rust implementation was downloaded or translated for this work.

The local reference directory contains `scene-update-paths.json`, the exact list of 297 required PNGs, and `scene-updates-provenance.json`, recording source revision and SHA-256 hashes. The number of files includes intermediate uploads, not just a final palette for each stage.

## Runtime interface

Load `scene-updates.js` before the renderer. Both browser and CommonJS consumers receive `JackalSceneUpdates` / `{sceneUpdates, requiredAssets}`.

```js
const update = JackalSceneUpdates.sceneUpdates(game);
// update.tilesPath and spritesPath are relative to the art root.
// Load both images before drawing this state.
// When textureKey changes, rebuild cached background windows using the selected tiles image.
// Draw update.rows over the base level, using row.palettes for existing attributes.
```

| Result | Meaning |
| --- | --- |
| `tilesPath`, `spritesPath` | Exact source atlas paths, relative to the configured art root. |
| `textureKey` | Cache key for the current pair of atlas images. A new tile atlas changes previously drawn scenery too, so a changed key invalidates the entire cached background. |
| `phaseKey` | Human-readable stage/transition identity and the chosen source tick offset. |
| `rows` | Cumulative final-boss background updates. Each row has `index`, original `ppuAddress`, world-pixel `x/y`, `tiles`, unchanged live `palettes`, and originating model `frame`. Apply rows in order so the defeated tank replaces its earlier appearance. |
| `key` | Texture key plus the sequence of applied row indices. Useful for background cache invalidation. |

The function is pure: it does not mutate the model, renderer, source data, or input operations. Each returned row owns its tile and palette arrays. `requiredAssets()` returns the exact distinct additional PNG paths for copying or an Android asset allowlist. Stage-start atlas files remain part of the existing stage loader.

An optional second argument can provide `art.scenePhases` as a six-element array using the same schema as `texture_phases.json`; otherwise the pinned converted timeline is used.

The renderer consumes this interface directly. It caches 272×256-pixel background windows and retains at most 24 changing atlas images with an LRU policy. A texture change invalidates the cached window; permanent destruction and final-boss rows are composed over the stage's live tile data. This avoids rebuilding or retaining a complete world-sized image for every intermediate palette or graphics upload.

## Model inputs and coordinates

- Stage transitions read `game.commandLog`, matching both `command` and `distance`. The selected image is the latest recorded `tick_offset` no greater than `game.frame - command.frame`. This preserves the model's pause behavior and does not depend on wall-clock time.
- `headquarters_gate` must be logged when source actor `0x49` / decimal73 appears. Its trigger does not survive as an ordinary enemy, so reading the live enemy list loses its upload timeline.
- HQ transitions read `game.boss.phase`, `transition`, and `transitionAge`. The captured collapse begins its explosion phase at tick25; the final destruction starts at tick0. A phase that has completed retains its last atlas.
- Tank tread states read source actor75's `age`, matching the current independently written four-tick model. They do not treat PPU graphics indices `0x0a..0x0d` as `boss_patches.json` IDs: those are different namespaces.
- Tile rows read cumulative `game.backgroundOperations` entries of kind `boss-background-row`. Indices `0x3d..0x54` build the tank, and `0x55..0x64` replace it with the defeated image.

The recovered stage-six map includes a blank 240-pixel page above the final arena. Its PPU row29 maps to world Y232; PPU rows0..10 map to world Y240..320. Left/right nametables map to world X0..255 / X256..511. These are world coordinates, not camera-relative coordinates. The row updates preserve existing attribute-palette indices because the source writes only tile values. They do not replace gameplay collision data.

## Final tank movement

The tank body is background artwork; its gun and turret are sprites. [Bank6.ASM, lines3571–3574](https://github.com/RayofJay/NES-Jackal_Disassembly_Fully_Commented/blob/f6788304f7021cb50938238a66123bb1db03a9e6/ASM%20Source/Code/Bank6.ASM#L3571) records the tank's screen X in the boss-scroll variable. [Bank7.ASM, lines204–235](https://github.com/RayofJay/NES-Jackal_Disassembly_Fully_Commented/blob/f6788304f7021cb50938238a66123bb1db03a9e6/ASM%20Source/Code/Bank7.ASM#L204) writes the negative of its previous-frame value to horizontal scrolling, then restores normal scrolling after a timed delay. Death clears movement speed without clearing this scroll value.

The renderer consequently samples the upper background at `cameraX - previousTankOffset`, where the tank starts at world X256 and `tankOffset = tank.x - 256`. Sprites use their normal world coordinates and camera. The last offset is retained during the tank's explosion, and unrelated phases clear it. Lower scenery keeps the normal camera position.

The current split is clipped at the known background-row extent, `worldY328 - cameraY`, constrained to the viewport. This is an explicit geometric approximation, not a measured NES scanline boundary. The source establishes the direction, anchor, one-frame delay and use of split scrolling; exact cycle timing and collision alignment at every position remain separate verification work.

## Verification boundaries

Run the data-contract tests without external artwork or network access:

```sh
node --test resource/apps/jackal/tests/scenes.test.cjs
```

The tests check all 40 converted row entries and 494 tile bytes against a digest independently derived from the source tables. They reject embedded FE/FF control markers and rows crossing nametable boundaries, preserve the concrete index63 source example, and verify palette attributes and write order. Atlas selection is checked at transition boundaries, after pauses, through stage changes, and through both final-boss sequences. Frozen inputs and detached results verify that the adapter cannot modify the model. A second independently derived digest checks the complete 297-image path manifest. These Node tests do not require the reference PNGs; the actual downloaded images are separately hashed in the local provenance manifest.

This adapter restores the recorded data changes; it does not prove cycle-accurate hardware scheduling. The reference timelines come from the secondary reconstruction, not physical NES capture. Exact partial-CHR upload interleaving under concurrent effects, the final-boss split scanline and collision trace, health-dependent palette flashes, helipad palette cycles, and direction-dependent tread cadence still require separate reference trace comparison. They must not be described as fully verified by this adapter alone.
