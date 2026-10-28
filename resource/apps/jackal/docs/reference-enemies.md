# Jackal enemy reconstruction notes

`src/main/assets/enemies.js` is an independently authored JavaScript simulation. It reads no ROM, executes no 6502 instructions, and does not embed the original program. The reference below supplies observable rules, identifiers and numeric facts. It is not a claim of cycle-perfect equivalence.

## Reference and coordinate conventions

Reference: [RayofJay/NES-Jackal_Disassembly_Fully_Commented](https://github.com/RayofJay/NES-Jackal_Disassembly_Fully_Commented), revision `f6788304f7021cb50938238a66123bb1db03a9e6`, `ASM Source/Code/Bank6.ASM` and `Bank7.ASM`. The reference author's license applies to their annotation work, not a grant of rights to Konami's game program. No implementation code from the unrelated Rust reconstruction was reused.

- One `tick(context)` represents one game frame, approximately 60.0988 Hz. All timers below use frames.
- World coordinates use native pixels, x rightwards and y downwards. The world is 512 pixels wide; the camera viewport is 256 × 240. Camera scrolling does not change world actor positions.
- Native direction values are 0–31: 0 right, 8 down, 16 left, 24 up. Directional metasprite selection/mirroring follows Bank7's `tblSpriteMirroringAndIndexForDirection`.
- Movement uses the factual 16-entry native cosine table and speed encoding described by Bank7 `subCalculateObjectSpeed` (lines 7425–7526). The high nibble multiplies the base 0.5 px/frame velocity; a nonzero low nibble adds a successively halved fraction. Thus `0x11 = 0.75`, `0x22 = 1.125`, `0x31 = 1.75` px/frame on an axis. Negative fractional components round down to native 1/256-pixel units.
- HP, explosive-resistance flags, hitbox extents and score tiers come from Bank7's sprite hitbox, HP and points tables (approximately lines 7843–8120). Two active players advance one score tier at spawn, preserved even if player two later leaves, as in Bank7's two spawn routines (lines6616–6624 and6767–6775).

**Damage flags are separate:** bit7 of native HP means a direct grenade/rocket subtracts5 HP instead of instantly killing. It does not make an enemy immune to the machine gun. Gun immunity is bit6 of the hitbox flags. Thus the stage1 tank, raised stage3 cannon, final moving tank and its mounted turret accept gun damage1, while statue heads and the HQ ignore gun bullets. Infantry set the main-weapon pass-through bit. `damageAt` returns whether something was hit; `lastImpactStops` tells the host whether the main weapon should detonate. Splash (`kind: "blast"`) ignores HP-bit7 armor.

The reconstructed metadata previously labelled several IDs incorrectly. The implementation uses the handler table instead: `0x2f/0x30` are rocks, `0x47` is an HQ laser turret, `0x4a` is the HQ building and `0x4b` is the final moving tank.

## Integration interface

Browser global and CommonJS export: `JackalEnemies = { EnemySystem, SPECS, velocity, direction, CORE_TYPES }`.

```js
const enemies = new JackalEnemies.EnemySystem({ stage: 1, random });
enemies.externalActorCount = otherLiveEntities;
enemies.spawn({ source_type: 0x07, raw_source_type: 0x87, x: 240, y: 800 });
enemies.tick(context);
enemies.damageAt(x, y, radius, 5, 'grenade', playerId);
```

`context` provides `stage`, `difficulty` (0–3), `players`, `cameraX`, `cameraY`, `terrainBlocked(x,y,r)`, `terrainClass(x,y)`, `damagePlayer(player)`, `addScore(playerId,points)`, `onEffect(x,y,kind,details)`, `onBossStart()`, `onBossDefeated()`, optional `spawnEntity(event)` and optional `applyBackgroundPatch(sourceType,x,y)`. Hooks run synchronously. Core-owned entities are huts, POWs, rescue helicopters, drop-off zones and pickups. `spawnEntity` reveals the full-weapon star after the priority parked vehicle's explosion.

Actors expose `sourceType`/`source_type`, `kind`, `id`, `x/y`, `hp/maxHp`, `state`, `timer`, `visible`, `vulnerable`, `contact`, `bossPart`, `frameId`/`frame`, `dir`, `palette`, `flipX/flipY`, `backgroundFrame` and `data`. Frame IDs refer to original metasprite indices; frame 0 has no sprite. Background actors need the stage map/patch renderer. `backgroundFrame` is state metadata, not a promise that every value is a directly drawable metasprite. Projectiles expose `team: 'enemy'`, `owner: 0`, `life`, `damage`, `radius`, `frameId`, `visible` and velocity.

`actors` and `projectiles` are live arrays. `boss` contains `stage`, `phase`, `pending`, `parts`, `started`, `done` and `freezePlayers`. The core freezes movement/fire and player damage during the two final explosion transitions. Final phases are `headquarters`, `hq-dying`, `hq-exploding`, `hq-to-tank`, `flame-tank`, `tank-exploding`, `defeated`. The six encounter triggers lock vertical scrolling on their first tick; Bank6's boss State0 routines explicitly clear forced scrolling and set the lock. Horizontal camera movement remains the core's responsibility. Completion occurs once all required boss parts have finished their death animations, not merely when a controller appears or a single part dies.

The 16-slot budget includes this module's actors/projectiles and `externalActorCount`. Priority allocation evicts an ordinary projectile or non-boss actor when necessary. This preserves the shared limit, although its exact eviction choice is not the original memory-slot allocator.

## Boss encounters

| Stage | Native trigger / parts | Implemented source facts | Bank6 anchors |
| --- | --- | --- | --- |
| 1 | `09` → four `0a` tanks | 10 HP each, gun damage1/explosive damage5; alternate bottom/top entries; initial and repeat delay 240/208/176/144 according to difficulty; clamped random world x 160–352; base metasprite `33`; 16-frame shell cadence | `Level1BossState0/1`, `tblLevel1BossTankSpawnDelay`, `Level1BossTank*`, lines 913–1155 |
| 2 | `20` → four `18` statue heads | 15 HP each, grenade only; spawn every 24 frames at world x 308,228,268,188 and screen y28; 192 idle +24 eye flash +24 mouth frames; homing missiles, initial direction down | `Level2Boss*`, `Level2BossStatueHead*`, lines 1703–2063 |
| 3 | `25` → six priority `92` retracting cannons | Boss override6 HP with explosive resistance; raised cannons also take gun damage; six original coordinates; 24-frame spawn cadence; rising/retracting vulnerability; five-shot spread at aim offsets −4,−2,0,+2,+4; special last-cannon acceleration | `SpreadTurret*`, `Level3Boss*`, lines 2535–2723 and 2792–2909 |
| 4 | `c0` helicopter | 32 HP, grenade only; 128 hidden frames, 144-frame decelerating entry, 64-frame hover; three paratroopers at hover counters 48,32,16; reverse accelerated exit; aimed bullet type9 every32 frames while flying | `Level4Boss*`, `Paratrooper*`, lines 4941–5305 |
| 5 | `17` → four `31` tank doors + `26` electrified core | Door x128,176,384,432 at screen y72; 3 HP with explosive resistance, vulnerable to gun/main weapon only when open; staggered 48/96/144/192 initial waits; 32-frame opening/open/closing, then256 idle; doors release silver/red tanks after the full32 open frames, each door advances through35/36/36/35 and raises its population cap every64 openings; 1-HP core at x280/y64 protected until all doors are destroyed | `Level5Boss*`, `Level5BossGate*`, `Level5BossDoor*`, lines 5741–6092 |
| 6 | `45` → `4a` HQ and two `47` lasers → `4b` flame tank + `4f` turret | HQ63 HP, laser turrets15 HP at x302/210,y41; laser directions/flight-time pattern; HQ24-frame initial death plus280-frame explosion/24-row transition; separate127-HP moving tank and64-HP following turret; 1.25px/frame horizontal motion, flame bursts, tank palette thresholds42/21 HP;208-frame final explosion/16-row sequence before completion | `Level6BossLoad*`, `Level6FinalBoss*`, `Level6FinalBossTank*`, `Level6BossLaserTurret*`, lines 3411–4103 and 6317–6759 |

The encounter types and major phases are distinct. There is no generic repeat-boss replacement.

The final transition follows Bank7 `subEraseLevel6BossFlags` (1530), `Label474` and `subFinalBossBuildingTransitionToFinalBossTank`/`Label1364` (8347–8519). HQ uses a cleared8-bit countdown: initialization takes1 frame, zero wraps to255, then255 countdown frames and24 consecutive row updates cover palette/background indices `3d` through `54` (280 frames total). Together with the HQ's preceding24-frame death and the subsequent tank-spawn state, the tank appears305 frames after the lethal hit. The final tank initializes the byte to `c0` and applies16 row updates `55` through `64`, totaling208 frames before completion. Each sequence exposes `graphicsIndex` and emits `boss-background-row` metadata for the renderer; three explosions every16 frames use the original13 coordinate entries. The attached tank turret disappears with its parent and does not grant an unearned additional kill score.

## Ordinary enemy and hazard coverage

| IDs | Behaviour implemented | Reference anchors |
| --- | --- | --- |
| `01–04` | Mobile/stationary/flame/swamp infantry; native difficulty tables for shooting warning and intervals, minimum firing distance; grenade/gun response, run-over death, corpse frame `18` for32 frames | Bank6 `MobileInfantry*`, `StationaryInfantry*`, lines334–781; swamp4457–4564; Bank7 `subInfantryDeath` |
| `05/06` | Rotating white/yellow platform turrets; 32-way aim, difficulty-scaled turn/lock delay,16-frame shots,3+3 recoil, proper bullet types and barrel offsets | Bank6 6760–7132, `SpawnTurretProjectile` |
| `07/0b/0e/0f/23/24` | Red/silver/flame tanks, fast enemy jeep and door tanks; independent speed, move/fire durations, shell/flame/bomb attacks and native base frames | Bank6 158–333,1184–1255,1437–1512,5480–5740 |
| `08/1a` | Diagonal patrol boat / downward gunboat,96-frame movement,48-frame aimed fire and wake animation | Bank6 840–912,2724–2791 |
| `0c` | Mounted cliff turret: hidden/rise/fire/lower phases;64–88 active frames by difficulty,16-frame shell cadence,4-frame recoil | Bank6 5306–5421 |
| `10/1e/1f` | Pillar proximity trigger below within112 pixels; explosion, separate falling top,32-frame diagonal fall and48-frame roll | Bank6 1513–1702 |
| `11` | Truck waits32, moves144 at0.625px/frame, stops16, unloads8 infantry129 frames apart | Bank6 2064–2148 |
| `12` | Ordinary retracting spread turret, distinct from boss variant | Bank6 2535–2723 |
| `1b` | Destructible background gate, patch hook on destruction | Bank6 7588–7617 |
| `21/22` | Ordinary statue missiles; dormant variant requires difficulty≥2 | Bank6 1817–1917 |
| `29` | Submarine:32-frame initial wait/rise/pre-fire,64 post-fire,48 dive,128 upward move,96 subsequent underwater wait; submarine missile subtype3 | Bank6 2149–2346 |
| `2a/2b` | Mirrored spread trucks: center then ±1/±2 three-wave five-shot volleys,9-frame wave separation,48-frame reload | Bank6 4188–4308 |
| `2c/2d/2e` | Cliff/submerged/bay missile launchers;128 idle, distinct opening/closing frames, upward homing subtype2 | Bank6 4565–4763,6227–6316 |
| `2f/30` | Falling rocks; player within64 vertical pixels,96-frame speed progression and alternating direction/mirror | Bank6 4309–4456 |
| `32/33` | Train controller plus engine/seven cars,24-frame spacing,upward1.5px/frame,alternating cars with native half-rate double-shot pattern; each destroyed car triggers the next after its24-frame explosion, without another score award | Bank6 4764–4940 |
| `34/35/37` | Flame, proximity mine, bomber/jeep bomb with a damaging explosion after landing | Bank6 flame helpers,5422–5479,1331–1436 |
| `0d/38` | Stationary stage3 laser: three columns x240/304/368,32-frame warning,24-frame live beam and separate16-frame charge flashes; short beam selectable via event metadata | Bank6 2347–2534 |
| `36/39` | Sixteen round-bullet configurations; bullets cross water, respect stage6-only terrain3 rules, and retain8 harmless impact frames; four missile modes with native turn delay, lifetime, speed and explosion | Bank6 20–145,7618–7814 |
| `3a/3b` | Attack planes moving2px/frame, alternating frame `4e/4f`, bombs every32 frames beginning16 | Bank6 1256–1436 |
| `3c/41/42/43` | Flyover, helicopter explosion, falling paratrooper→10-point infantry, stage6 decelerating/diagonal attack helicopter | Bank6 7259–7306,4941–5305,6093–6226 |
| `44/46/49` | Escalator marker / end-check / HQ graphics trigger; escalator movement itself belongs to terrain/core | Bank6 corresponding handlers |
| `48/4c/4d` | HQ laser flight, expanding tank flame and separate fast flame-tip collision object | Bank6 6468–6534,3628–3743 |
| `4e/53` | Background parked vehicle, destruction patch; priority powerup version reveals original full-weapon `d1` after explosion | Bank6 4104–4187 |

## Remaining fidelity limits

The implementation deliberately exposes these gaps instead of describing the whole game as an exact reproduction:

- Moving enemies choose the nearest live jeep and use simplified terrain steering. The original retains a periodically reassigned target, slot-specific turn decisions, detailed look-ahead probes and per-enemy collision rules. Mobile/swamp infantry movement is an approximation of the original orbit/meander logic.
- Some state entry/exit frames and slot-derived delays differ by a frame; sprite-slot-dependent delays use authored actor IDs/explicit boss slot indices. The random generator is supplied by the host, not the original CPU/RAM state.
- Hitboxes preserve table extents, but the continuous world-space collision API replaces the original byte arithmetic and asymmetric projectile checks. Main weapons pass through infantry, and blast splash skips armored enemies; remaining state-specific collision quirks are not all reproduced.
- Tank movement randomization uses a bounded interval rather than the original RNG/player-position mixture. Flame, pillar sawtooth movement, mine, swamp infantry and flyover details need comparison against original gameplay.
- Laser short/long selection currently accepts `shortLaser` event metadata; automatic selection based on the original screen index needs host integration. Escalator motion and background patches belong to core/renderer, not this module.
- Metasprite/background animation IDs are reference-driven where listed, but final sprite-bank selection, palette changes, destroyed backgrounds, visual overlap and sound timing require integrated render/audio verification. Standalone tests cannot certify appearance or sound.

## Verification

Run `node --test resource/apps/jackal/tests/enemies.test.cjs` from the repository root. The suite checks independent numeric facts and observable sequences: speed encoding, HP/score ownership, separate gun-immunity/explosive-resistance rules, all six encounter structures, original spawn positions/delays, statue phases, cannon spread, helicopter drops, door/core protection, HQ→tank transition, projectile lifetime/visibility, shared pool capacity, truck volleys, laser phases, parked reward and pillar trigger. A deterministic600-frame smoke case covers every supported non-controller source type for finite coordinates and bounded allocation. Further regressions cover a natural64-opening door cycle, delayed train-car chain destruction, co-op score-at-spawn and bullet terrain rules.

The integrated stage6 test loads the actual final-stage map and its final spawn records at an explicit saved checkpoint, then uses only normal A/B and direction inputs for combat. It observes HQ63→0 HP, the source-derived transition, tank127→0 HP, the208-frame final explosion and the model's `ending` phase. A long initial spawn shield isolates progression from the test pilot's survival; it is not evidence of an unassisted full-stage clear. No boss completion hook or direct HP mutation is used.
