# Last Track — Architecture & Module Contract (MVP v1)

Browser vehicular-combat racer. Three.js r170 (vendored), vanilla ES modules, no bundler. Modelled on `~/Projects/CarRace` (same layering, fixed-step sim, snapshot render). **This file is the single source of truth.** Four coders (A–D) work in parallel in separate sessions and do not talk: anything not in this spec → make the smallest local choice that does not change an exported API. **Do not rename or reshape exports listed here;** extra exports are fine.

## 0. Premise & MVP scope
Dystopian future America; drivers race for money and their lives. Player is "the rookie". Start with a meager purse ($5,000), pick one of 3 cars, practise, then race 4 named rivals on 3 tracks; winnings buy armor/engine/tyre upgrades, ammo, and weapons.

MVP content (data-driven so more can be added later):
- **3 cars**: `wasp` (fast, fragile, 1 weapon slot), `hammer` (firepower: 3 slots, medium), `bulwark` (armored, slow).
- **4 rivals** (original characters; each has a favourite weapon): `vex` Vex Calloway (machinegun, aggressive), `rust` "Mama" Rust (caltrops, defensive), `fuse` Doc Fuse (rockets, sniper-ish), `kane` Ironjaw Kane (terminator missile + ramming).
- **3 tracks** (closed loops): `scrapyard` Detroit Scrapyard (tight, 3 laps), `strip` Vegas Strip (long straights), `mojave` Mojave Run (fast sweepers). 3 laps default.
- **4 weapons**: `machinegun`, `rocket`, `caltrops`, `terminator` (heavy homing missile).
- **3 upgrade lines** × 3 levels: `armor`, `engine`, `tyres`; plus buying weapons & ammo refills.
- **Modes**: `practice` (alone or with rivals disabled, unlimited time, no money), `race` (prize money by position, kill bonus, repair bill).
- Look: **modern full-colour** low-poly 3D with PBR materials, IBL + bloom (the `render/pbr` stack is attached for the whole game), vector rival portraits generated in code, and a 'Neon Holo' glass UI (`styles.css`, `hud.css`). The old 16-colour palette/quantise pass is gone: `data/palette.js` survives only as a set of semantic colour ids (data files still reference indices 0..15) that `render/paletteRef.js` maps to `MODERN_HEX`.

## 1. Global conventions
- **Units**: metres, seconds, radians, m/s. UI: kph = m/s*3.6.
- **Axes**: Three.js x east, y up, z south. Sim is 2D `(x, y)`, **sim y == world z**. Mapping `(x,y)` → `(x, 0, y)`.
- **Heading θ**: forward = `(cos θ, sin θ)`; θ=0 faces +x. Right normal `(-sin θ, cos θ)`. Steer −1 left … +1 right; positive yaw rate increases θ. Normalise with `wrapAngle`.
- **Mesh orientation**: car model local **+X forward**, +Y up, +Z driver's right. `mesh.position.set(x,0,y); mesh.rotation.y = -heading`. Model origin = CG at ground.
- **Modules**: ES modules, explicit `.js` extensions on relative imports; only bare import is `'three'` (render/ and audio/ only). `core/`, `data/`, `sim/` are pure: no `three`, no `window/document/localStorage/AudioContext`, no side effects at import. **`Math.random` forbidden in `sim/` and `data/` logic** (use seeded `mulberry32` from `core/mathUtil.js`). `Date.now` only in persistence via injectable `now()`.
- **DAG**: `core/` ← `data/` ← `sim/`; `render/`,`audio/` depend only on `core/`,`data/`,`three`; `ui/`,`game/`,`main.js` may depend on everything. `sim/` must not import `render/` and vice-versa (they share only the snapshot shape §5).
- **Sim step**: fixed 120 Hz (`SIM_DT=1/120`) using `sim/fixedStep.js` (`advanceAccumulator`). Render via rAF, interpolated with `alpha`.
- **Already provided (copied from CarRace, owned by A/B, may be edited)**: `core/{eventBus,mathUtil,vec2,storage}.js`, `sim/fixedStep.js`, `vendor/three.module.js`, `package.json` (test script uses the glob form `node --test "tests/**/*.test.js"`; tests live in `tests/<pkg>/*.test.js`, Node ≥ 22, `node:test`).
- **Serving**: `npm run serve` → http://localhost:8123 (importmap + modules don't work on file://). `index.html` has `<script type="importmap">{"imports":{"three":"./vendor/three.module.js"}}</script>` before `<script type="module" src="./src/main.js">`, `<link rel="icon" href="data:,">`, relative URLs only.
- **Indexing**: `position`, `lap` are 1-based. `carId` is the 0-based index in `snapshot.cars` (player is always `0`).

## 2. Work packages & ownership (disjoint)
```
index.html styles.css main.js debug.js           D
src/core/    mathUtil vec2 eventBus storage      A   (trackModel.js new, A)
             trackModel.js
src/data/    palette.js cars.js weapons.js upgrades.js drivers.js economy.js
             raceConfig.js saveStore.js
             tracks/index.js scrapyard.js strip.js mojave.js          A
src/sim/     carPhysics.js damage.js weapons.js projectiles.js collisions.js
             raceSim.js raceDirector.js fixedStep.js                  B
src/sim/ai/  racingLine.js aiDriver.js                                B
src/render/  renderHost.js trackMesh.js carModel.js carPreview.js raceController.js
             cameras.js scenery.js effects.js minimap.js menuScene.js
             portraits.js geomUtil.js                                 C
src/audio/   audioEngine.js                                           C
src/game/    game.js                                                  D
src/ui/      flowMachine.js input.js inputMap.js dom.js hud.js
             screens/{title,carSelect,garage,shop,roster,trackSelect,loading,pause,results}.js   D
tests/<pkg>/*.test.js                                                 owner of pkg
```
Integration order: A is smallest — lands first; B/C/D code against this spec and run tests once A lands. Until a dependency exists, code against the documented API with a local stub (do not edit other packages' files).

## 2.1 Palette (`data/palette.js`, A) 
`export const PALETTE` — 16 hex strings, index-stable:
`0 #0b0b14 black, 1 #1d2b53 navy, 2 #7e2553 plum, 3 #008751 green, 4 #ab5236 rust, 5 #5f574f dark grey, 6 #c2c3c7 light grey, 7 #fff1e8 white, 8 #ff004d red, 9 #ffa300 orange, 10 #ffec27 yellow, 11 #00e436 lime, 12 #29adff sky, 13 #83769c lavender, 14 #ff77a8 pink, 15 #ffccaa sand`. Also `export const COLOR = {black:0,…}` name→index map and `paletteHex(i)`.

## 3. Data (owner A) — exact exports
```js
// cars.js — exports CARS (array), getCar(id)
Car = { id:'wasp', name:'Wasp', blurb:'...', price:0, color:8 /*palette idx*/,
  base:{ maxSpeed:62, accel:24, brake:40, grip:1.0, turn:1.0, mass:1100, armor:60, slots:1 },  // m/s, m/s², …
  startWeapons:[{id:'machinegun', ammo:200}] }
// weapons.js — exports WEAPONS, getWeapon(id)
Weapon = { id:'rocket', name:'Rocket Launcher', kind:'projectile'|'hitscan'|'drop',
  price:1800, ammoPrice:12 /*per unit*/, ammoPack:10, maxAmmo:30,
  damage:35, speed:90 /*m/s projectile*/, range:180, cooldown:0.8 /*s*/, spread:0.0, homing:0.0 /*turn rate rad/s, 0=none*/,
  radius:6 /*blast m, 0=single target*/, life:3 /*s*/, slot:1 /*slots consumed*/ }
// machinegun: hitscan-ish rapid, dmg 3, cd .08, spread .03; rocket: above; caltrops: kind 'drop', pops tyres (slowdown + grip loss ~6 s) and 8 dmg;
// terminator: homing 1.6, dmg 70, radius 9, price 6000, slot 2.
// upgrades.js — exports UPGRADES, getUpgrade(id), upgradeCost(id, level), applyUpgrades(carBase, levels) -> stats
Upgrade ids 'armor'|'engine'|'tyres', maxLevel 3, costs [1200,2800,5500]; armor +25%/lvl armorMax, engine +8%/lvl maxSpeed & accel, tyres +10%/lvl grip & turn.
// drivers.js — exports DRIVERS, getDriver(id)
Driver = { id:'vex', name:'Vex Calloway', nickname:'The Razor', bio:'...', carId:'wasp', color:9, helmet:10,
  skill:0.85 /*0.6..1: pace & precision*/, aggression:0.9 /*0..1: how much they shoot/ram*/,
  favoriteWeapon:'machinegun', loadout:[{id,ammo}], portrait:{ seed:1, skin:15, hair:4, accent:8 } }
// economy.js — pure functions
STARTING_CASH=5000; prizeFor(position, nCars, trackPrize) ; killBonus=500; repairCost(damageFraction, armorMax)
purchaseUpgrade(save, id) / purchaseWeapon(save, id) / buyAmmo(save, weaponId, n) / repairCar(save) -> {ok, save, error?}  (immutable: return new save)
// raceConfig.js — createRaceConfig({mode, trackId, laps, save, rivalIds}) -> RaceConfig
RaceConfig = { mode:'race'|'practice', trackId, laps, seed,
  player:{ carId, stats /*after upgrades*/, armor /*current*/, loadout:[{id,ammo}] },
  rivals:[{ driverId, stats, loadout, skill, aggression, favoriteWeapon }] }   // rivals in grid order
// saveStore.js — createSaveStore(storage) -> { load(), save(s), reset() } ; defaultSave()
Save = { version:1, cash, carId, upgrades:{armor:0,engine:0,tyres:0}, damage:0 /*0..1 unrepaired*/, weapons:[{id,ammo}], 
  wins:0, races:0, kills:0, bestTimes:{[trackId]:seconds}, passedTracks:[] }
// Track pass: a top-three finish without a wreck passes the track; every track can be raced. Prize per track in track def.
```
### 3.1 Tracks & `core/trackModel.js` (A)
```js
// data/tracks/index.js — TRACKS (array, order scrapyard, strip, mojave), getTrack(id)
TrackDef = { id, name, city, blurb, laps:3, prize:4000, width:16 /*m*/, theme:{ ground:5, road:0, curb:[8,7], sky:[12,1], scenery:'junk'|'neon'|'desert' },
  control:[[x,y],…] /*closed Catmull-Rom loop, metres, ≥16 pts, length 1.6–3 km*/, 
  pickups:[{s:0.25,type:'ammo'|'repair'|'cash'}] /*s as 0..1 fraction of lap*/ }
// core/trackModel.js
buildTrack(def, ds=2) -> Track
Track = { id, length, ds, n, closed:true, width, def,
  samples: Float32Arrays or objects [{x,y,heading,curv,s,width}] (index i ↔ s=i*ds),
  pointAt(s) -> {x,y,heading,curv,width}  // s wraps
  project(x, y, hintIndex?) -> { i, s, d /*signed lateral, +right*/, heading, onRoad:boolean }
  leftEdge(i), rightEdge(i) -> {x,y}   // for mesh + walls
  startGrid(nCars) -> [{x,y,heading}]  // 2-wide staggered grid behind start line, car 0 at front-left of pole row..., index = grid slot
  pickups -> [{id,type,s,x,y}] }
```
Tracks must not self-intersect and min corner radius ≥ 1.5× half-width. A writes `tools/plotTracks.mjs` to dump ASCII/SVG for eyeballing and a test asserting no self-intersection, closed loop, and length range.

## 4. Simulation (owner B) — exact exports
```js
// raceSim.js
createRaceSim(config /*RaceConfig*/, opts?) -> RaceSim
RaceSim = {
  step(playerInput) , snapshot() -> Snapshot, events -> eventBus (on 'shot','hit','explosion','wreck','lap','finish','pickup','countdown','go'),
  phase, isOver(), result() -> RaceResult }
PlayerInput = { throttle:0..1, brake:0..1, steer:-1..1, fire:boolean, cycleWeapon:boolean /*edge*/, selectWeapon:int|null, handbrake:boolean }
RaceResult = { trackId, laps, finishOrder:[{carId, driverId, isPlayer, position, time|null, wrecked, kills}],
  player:{ position, time, kills, wrecked, armorLeft, armorMax, damageFraction /*0..1 for repair bill*/, ammoLeft:[{id,ammo}] }, date:null }
```
- Physics (`carPhysics.js`): arcade 2D bicycle-ish model: throttle→accel up to `maxSpeed`, drag, lateral grip with slide (drift) when over grip limit, brake, handbrake, off-road drag (mud). Wall contact: track edges are solid walls — reflect lateral velocity, lose speed, small damage. Car-car: circle/OBB-ish collision with impulse; ramming damage ∝ relative speed (damage scaled by mass).
- Damage (`damage.js`): armor pool; below 30% armor smoke flag, 0 → `wrecked` (car stops, explodes, stays as obstacle for 5s then removed). `slowTimer`/`gripPenalty` from caltrops. Wrecked cars stop racing and are classified last (by distance).
- Weapons (`weapons.js`, `projectiles.js`): data from `getWeapon`. Machinegun = hitscan ray within `range` along heading with `spread`, tracer events; rockets/terminator = projectiles with life, optional homing (acquire nearest car ahead in a 25° cone), blast radius damage with falloff; caltrops = drop entity at rear lasting 20 s, hits any car (including owner after 1 s). Ammo per weapon; `cycleWeapon` selects next owned weapon with ammo. Kill credit tracked per car (`kills`).
- Race director (`raceDirector.js`): countdown 3-2-1 (cars held), lap counting via `track.project` progress with checkpoint monotonicity (no lap skipping/reversing), positions by (lap, s), finish when leader's laps complete (then 20 s timeout for others / or all wrecked) → `result()`. Pickups (ammo/repair/cash) respawn after 15 s. Practice mode: no rivals unless config.rivals non-empty; never ends until `finish` after laps.
- AI (`sim/ai/`): `racingLine.js` precomputes offset-to-centerline and target speed per sample from curvature (cache by trackId); `aiDriver.js` `driveAI(car, ctx, rng) -> PlayerInput` — pure-pursuit steering, speed control from target speed × (0.85+0.15·skill), avoid walls, avoid slow/wrecked cars, rubber-band ±8% pace by distance to player. Combat per `aggression`/`favoriteWeapon`: fire machinegun when a car is in front within range & small angle; rockets/terminator at targets ahead; caltrops when a car is close behind; ram when side-by-side if aggression high. Deterministic given seed.
- All randomness via seeded rng from `config.seed`. Same inputs ⇒ same snapshots. Tests: lap counting, no wall tunnelling at max speed, weapon damage/kill credit, AI completes 3 laps on every track alone under ~10% of the player-ideal time, determinism.

## 5. Snapshot shape (shared B → C, D) — frozen
```js
Snapshot = { t, tick, phase:'countdown'|'racing'|'finished', countdown:number /*s left, ≥0*/, lapsTotal,
  cars:[{ id, driverId, isPlayer, name, x, y, heading, vx, vy, speed, steer, yawRate,
          armor, armorMax, wrecked, smoke:boolean, burning:boolean, tyresPopped:boolean, 
          lap, s /*metres along lap*/, position, finished, finishTime, kills,
          weapons:[{id, ammo}], activeWeapon /*index into weapons*/, firing:boolean, color, helmetColor }],
  projectiles:[{ id, type /*weapon id*/, x, y, heading, ownerId }],
  hazards:[{ id, type:'caltrops'|'wreck'|'mine', x, y, heading }],
  pickups:[{ id, type, x, y, active }],
  events:[{ type, ...}] /* events emitted this frame, cleared next snapshot:
    {type:'shot', carId, weaponId}, {type:'hit', carId, byId, weaponId, dmg, x, y},
    {type:'explosion', x, y, radius}, {type:'wreck', carId, byId}, {type:'lap', carId, lap, lapTime},
    {type:'finish', carId, position}, {type:'pickup', carId, pickupType}, {type:'bump', carId, strength} */ }
```
`render/` and `audio/` read only this (plus `Track`). `ui/hud.js` too.

## 6. Rendering & audio (owner C) — exact exports
```js
// renderHost.js
createRenderHost(canvas, opts?) -> { renderer, scene, camera, resize(w,h), setPalettePass(bool), render(), dispose() }
// raceController.js — one per race
createRaceController(host, track /*Track*/, config /*RaceConfig*/) -> { update(snapA, snapB, alpha, dt), setCamera('chase'|'cockpit'|'top'), cycleCamera(), dispose(), minimapState() }
// carModel.js
buildCarMesh({ carId, color, helmetColor, wrecked? }) -> THREE.Group   // procedural low-poly; wheels spin via userData.wheels; distinct silhouettes per carId (wasp: low wedge; hammer: wide body + roof gun mount; bulwark: boxy, plated)
// carPreview.js
createCarPreview(canvas) -> { show({carId,color,upgrades}), setSpin(bool), dispose() }   // garage/car-select turntable
// portraits.js
drawPortrait(canvas2d, driver /*Driver*/) -> void   // modern vector/gradient cyberpunk bust (256 logical px, scaled), seeded from driver.portrait; pure part: portraitSpec(driver)
// effects.js: muzzle flash, tracers, rocket trail, explosion, smoke/fire on damaged cars, caltrop sprites, tyre skid marks — driven by snapshot.events
// minimap.js: draws track outline + car dots on a 2D canvas via createMinimap(canvas, track) -> { draw(snapshot) }
// (palettePass.js was removed — no quantise/dither pass exists.) menuScene.js: cinematic showroom stage rendered into the main host behind title/car select/garage/armory (game.stage); needs host.pbr, falls back to the CSS animated backdrop.
// audioEngine.js
createAudioEngine() -> { resume() /*after user gesture*/, startRace(), update(snapshot, dt), stop(), setMuted(b), setVolume(v), dispose() }
```
Audio is fully procedural WebAudio (engine hum from player speed + RPM-like pitch, MG rattle, rocket whoosh, explosion noise burst, impact thud, countdown beeps; optional simple chiptune loop). Everything guarded for non-browser envs. Builders (`buildCarMesh`, track geometry) must not touch `document`/WebGL at call time so they can be unit-tested in Node (`import 'three'` resolves to `node_modules/three`). Flat shading, vertex colours from the palette; `track.leftEdge/rightEdge` for the road ribbon, kerbs, wall mesh, scenery themed by `def.theme.scenery`.

## 7. UI, flow, game loop (owner D)
- **Flow** (`ui/flowMachine.js`, pure, tested): `title → carSelect(new game only) → garage(hub) ⇄ shop ⇄ roster → trackSelect → raceSettings(laps, mode practice|race) → loading → race ⇄ pause → results → garage`. Continue from saved game goes to `garage`. Results applies economy (prize, kill bonus, repair is a button in garage), then saves.
- `game/game.js`: `createGame({root, canvas, storage})` orchestrates screens, builds RaceConfig via A, runs `RaceSim` with fixed step, feeds snapshots to `RaceController`, `AudioEngine`, `HUD`; handles pause, restart, quit-to-garage, and save/load. Exposes `window.__game` in `debug.js` (`state`, `sim`, `snapshot()`, `skipToRace(trackId)`, `setCash(n)`) for smoke tests.
- **HUD**: speed, lap n/N, position, armor bar (colour by %), weapon bar with ammo & selected slot, rival standings strip, minimap, countdown, "WRECKED"/"FINISH" banners, kill feed.
- **Controls**: WASD/arrows drive, Space fire, E/Tab cycle weapon (1–4 direct), Shift drift, C camera, P/Esc pause, M mute. Touch controls for mobile (steer pad + fire/cycle buttons).
- **Screens**: car select shows the 3-car turntable and stat bars; garage shows cash, upgrade rows (level pips + cost), repair bill; shop lists weapons (buy/ammo); roster shows the 4 rivals with portraits, bios, favourite weapons; results show standings, prize, kills.
- Aesthetic: 'Neon Holo' — dark glass panels, thin cyan/magenta/amber neon lines, system font stack only (no external fonts), live 3D showroom behind the menus, SVG icons (`ui/icons.js`), settings sheet (`ui/settings.js`, stored in localStorage `lasttrack.settings`), keyboard/gamepad spatial focus (`ui/menuLogic.js` + `dom.attachMenuKeys`). Layout works at 1280×720 and phone landscape (844×390).

## 8. Verification (all packages)
- `npm test` green. Every package ships tests for its pure parts.
- D owns the smoke path: serve, open in a browser, load without console errors, click through new game → car select → garage → track → race → finish → results; screenshot once at the end only.
- Performance: 60 fps with 5 cars, ≤ ~150 draw calls; reuse geometries/materials, pool particles.

## 9. Hero Slice (`?slice=1`) — extension, slice-only
- `?slice=1` (title-screen "HERO SLICE" button) locks car = Hammer, track = Detroit Scrapyard, fresh in-memory save. Normal game untouched. `?q=low|med|high` (or `G` in race) = graphics quality.
- Default slice art = **PBR**: `render/pbr/` — `carBody.js` (lofted smooth body, canopy, dents), `heroCarPBR.js` (materials, wheels, turret, lights, suspension, damage, wet/dirt), `maps.js` (procedural normal/roughness/carbon/tread), `env.js` (HDR IBL), `post.js` (HDR RT, SSAO, bloom, motion blur, ACES), `pbrHost.js` (`attachPBR(host,{quality,env})`, key light + shadows), `quality.js`.
- Showroom: `tools/showroom.html?q=high&view=q34&stage=0..4&wet=&dirt=&env=showroom|dusk`.
- Sim additions (all modes): `carPhysics.js` engine/gears/limiter, friction-limited braking, weight transfer, slip curve, oversteer; `surfaces.js`; per-zone damage `dmgMap`; snapshot gains `gear rpm ax ay load slip wheelspin braking surface throttle limiter shifted dmg`. Player wreck no longer ends the race (20 s spectate, `WRECK_SPECTATE`).

## 10. Arcade handling, forgiving walls, destruction (extension, all modes incl. slice)
- **Handling** (`sim/carPhysics.js`, constants in `TUNING`): high forgiving grip (`mu` 2.5), snappy steering (`steerRate` 12, `yawResponse` 15, centring `steerReturn` 20), drift state (`driftTarget`: Shift (`handbrake` input) = full kick with no braking term, so the slide keeps its speed; sustained hard lock > 0.3–0.8 s at > 22 m/s = partial kick; taps never kick), auto counter-steer (`slideRecovery`, dead zone 0.1 rad, stiffens past 0.55 rad, rear grip restored past 0.9 rad => no spin-outs), +7.5 % straight-line boost after 1.6 s, optional **nitro** (`PlayerInput.nitro`, 2 s burn, 1.2 s cooldown, recharge 0.14/s; the game maps F / X), braking capped at ≈1.3 g (`brakeGrip` 0.55). `stepBody` mods: `kick` (0 for AI: clean lines), `noNitro`. AI plans corners on `AI_CORNER_GRIP` 0.78 and brakes on `AI_BRAKE_USE` 0.8 of `brakeLimit` (`ai/racingLine.js`).
- **Walls** (`sim/collisions.js`, `WALL`): soft run-off band 1.4 m (`softEdge`: inward push + outward-speed bleed + nose alignment), solid wall with Coulomb friction (tangential loss = 0.15·normal speed absorbed, restitution 0.12) so glancing hits keep their speed, nose swings along the wall, damage only above 9 m/s impact (`wallDamage`, 0.45 armor per m/s above). `sim/recovery.js`: human cars wrong-way (> 115° for 1.4 s below 14 m/s) or wedged (1.8 s) are swung round over 0.7 s ('recover' event).
- **Snapshot additions** (compatible): car `nitro nitroOn drift boost parts wreckT`; events `partLost {carId,part,wreck,power,x,y,dx,dy,vx,vy,heading,seed}` (parts in `sim/parts.js`: bumperF hood doorR doorL bumperR spoiler wheelFR turret wheelRL; zone damage or armor fraction thresholds; a wreck sheds the rest), `scrape {carId,x,y,speed,impact,side}`, `recover {carId,x,y}`; `explosion` gains `kind` (weapon id or `'wreck'`), `big`, `carId`/`ownerId`; `wreck` gains pose + seed. Wrecks stay solid for `WRECK_LIFETIME` = 45 s. Cosmetic seeds come from a separate PRNG stream (gameplay determinism unchanged).
- **Render**: `render/debris.js` (pure `DebrisField` + instanced renderer, 4 draw calls, 200 pieces), `render/effects.js` (staged explosions: fireball ramp, shockwave rings, secondary blasts, smoke column, scorch decals, burning wrecks, part-loss sparks, scrape sparks, nitro flames), `render/impactFx.js` (event -> shake / hit-stop / slow-mo; `controller.stepTime(dt)` returns the time scale game.js applies to the sim's frame time), `carModel.applyLostParts`, `heroCarPBR` `setPartLost`. Audio: tiered explosions, part tear, wall scrape, nitro whoosh.
