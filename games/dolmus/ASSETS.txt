# Dolmuş: asset pass

Optional assets on top of the procedural game. Everything loads after the first frame, only on the High quality tier
(sounds on both tiers), and every item has a procedural fallback. Sources: Poly Haven and Kenney (CC0), the vehicle and
prop models are original Blender scripts in `assets/src/` (built with the asset-forge tool). Credits: [`CREDITS.md`](../CREDITS.md).

## Assets

| File | Source | Licence | KB | Where used | Triangles |
|---|---|---|---|---|---|
| `assets/models/dolmus.glb` | own Blender script `assets/src/dolmus.py` | project (MIT) | 152 | player's dolmus: `body`, `detail`, sliding `door` and one `wheel` (x4) | 1 988 (all parts) |
| `assets/models/car.glb` | own, `car.py` | project (MIT) | 95 | AI cars (instanced, tinted `body` + untinted `detail`) and parked cars | 1 248 |
| `assets/models/bus.glb` | own, `bus.py` | project (MIT) | 174 | city buses (instanced, tinted `body` + `detail`) | 2 320 |
| `assets/models/van.glb` | own, `van.py` | project (MIT) | 105 | double-parked delivery van | 1 388 |
| `assets/models/tram.glb` | own, `tram.py` | project (MIT) | 147 | tram (two instances per train) | 1 924 |
| `assets/models/shelter.glb` | own, `shelter.py` | project (MIT) | 67 | bus / dolmus stop shelters (instanced) | 828 |
| `assets/models/carts.glb` | own, `carts.py` | project (MIT) | 163 | simit cart and chestnut cart with vendor (two models, instanced) | 2 168 (both) |
| `assets/textures/asphalt.jpg` | Poly Haven `asphalt_02` (Rob Tuytel) | CC0 | 72 | road detail (grey-scale 512 px) | |
| `assets/textures/pavement.jpg` | Poly Haven `cobblestone_floor_01` (Rob Tuytel) | CC0 | 37 | pavement, plaza and quay detail (grey-scale 512 px) | |
| `assets/textures/grass.jpg` | Poly Haven `grass_ground` (Charlotte Baglioni) | CC0 | 30 | terrain detail (grey-scale 512 px) | |
| `assets/sky/sky.jpg` | Poly Haven `kloofendal_48d_partly_cloudy_puresky` (Greg Zaal, Jarod Guest), 1k HDRI as a 1024x512 sky strip | CC0 | 50 | clouds on the sky dome, reflections on the vehicles | |
| `assets/sfx/door_open.mp3`, `door_close.mp3` | Kenney RPG Audio `doorOpen_1`, `doorClose_2` | CC0 | 8 + 6 | door opens / closes | |
| `assets/sfx/coin1.mp3`, `coin2.mp3` | Kenney RPG Audio `handleCoins`, `handleCoins2` | CC0 | 7 + 3 | fare and tip coins | |
| `assets/sfx/crash1.mp3`, `crash2.mp3` | Kenney Impact Sounds `impactMetal_heavy_001`, `_003` | CC0 | 4 + 2 | car and wall crashes (plus a synthesised low thump) | |
| `assets/sfx/thud1.mp3`, `thud2.mp3` | Kenney Impact Sounds `impactGeneric_light_001`, `_003` | CC0 | 2 + 2 | pedestrian hit (plus a synthesised thump) | |
| `assets/sfx/click1.mp3`, `click2.mp3` | Kenney Interface Sounds `click_002`, `click_004` | CC0 | 1 + 1 | UI clicks | |

Total shipped: about 1.13 MB (models 903 KB, textures 142 KB, sky 50 KB, sounds 35 KB), budget 3 MB. Largest model 2 320
triangles (budget 3 000). Textures are 512 px; the sky is 1024x512. The 1k `.hdr` itself is not shipped (1.4 MB): the
vehicle reflections use the sky strip derived from it. The engine, horn, rain, skid, ambience, tram bell and the music stay
synthesised (the tram bell was left synthetic: I could not audition candidates, so none was judged clearly better).

## What changed in the game

- **Vehicles:** richer shapes with the same sizes, wheel positions and collision (sim code untouched): sloped hood and
  windscreen, wheel arches with liners, bumpers, grille, plates, mirrors, window panes, door recess; the dolmus keeps its
  separate sliding door (same animation) and wheels (same spin and steering); cars and buses keep the tinted-body plus
  untinted-detail split, so all 11 car colours still work. Parked cars, stop shelters and the vendor carts now use the same
  models (they were merged procedural geometry; that geometry now lives in its own meshes that are hidden once the models
  arrive).
- **Textures:** road, pavement/plaza/quay and terrain get a subtle detail texture projected in world space (no UVs needed;
  vertex colour decides which texture) multiplied into the existing palette, so the colours stay the same and the look
  stays flat-shaded. Two scales are blended to hide tiling.
- **Sky and lighting (High only):** the sky dome adds the photographed clouds, coloured by the existing hour-of-day, sunset,
  night and rain colours (faint dark clouds at night, flat grey in rain; the low-poly cloud puffs are hidden while the
  textured sky is on); vehicle bodies and glass use `MeshStandardMaterial` with reflections from the sky, with strength
  following the hour and rain.
- **Sounds:** door (open and close), coins, crash, thud and UI click are recorded samples with small random pitch changes,
  decoded once, played through the existing SFX bus (master / effects settings apply); the crash and thud keep a quiet
  synthesised low thump underneath.
- **Camera fix:** the chase camera shortens its distance (and lifts a little) when a wall, tree trunk or lamp post would be
  between it and the dolmus. Staged test: dolmus 6.5 m from a building facing away from it, camera 11 m behind: without the
  fix the camera sits 4.5 m inside the building (`assets-camfix-before.png`), with it the distance drops to 4.3 m and the
  camera stays on the street (`assets-camfix-after.png`). Ray test checked numerically (a facade 8 m away gives 7.0 m).
- **Minimap:** heading-up (rotates around the dolmus, stop badges stay upright, small N on the rim); `N`, a tap on the
  minimap or a Settings row toggle north-up; the choice is saved.

## Performance and draw calls (Intel UHD 630 laptop, headless Chrome, 1280x720, `?auto`, page rAF fps over 8 to 10 s)

| | fps | draw calls | triangles |
|---|---|---|---|
| Before (original game) | 60.1 | 38 to 40 | 149 481 |
| After, High tier with all assets | 59.6 to 60.3 (4 interleaved runs, median 60.0) | 42 | 188 005 |
| After, Low tier (`?low`) | 60.1 to 60.4 (4 runs) | 40 | 149 481 (identical to before) |
| After, `?noassets` | 60.1 to 60.4 (4 runs) | 40 | 149 481 |

60 fps is the vsync cap, so 720p hides the extra cost. A 1920x1080 stress run (other processes were using the machine, so
the numbers are noisy): `?noassets` 48.6 to 56.2 fps against 48.9 to 52.1 fps with all assets, so the assets cost roughly
5 to 8 % of GPU time. The High tier adds 2 draw calls (budget about 10): the new instanced meshes for parked cars, shelters and
carts replace two merged procedural meshes.

## Fallbacks

- `?noassets`, `file://`, offline or a 404: nothing is loaded and the game is the original procedural game. Tested:
  `?noassets` (no requests, campaign result unchanged) and the page opened from `file://` (every group fails, the game runs
  procedurally, 0 errors, `assets-after-fileurl.png`); a single failed group only drops that group (`ASSETS.failed`).
- Low tier: no models, textures or sky are downloaded, the procedural geometry and Lambert materials stay, so Low is not
  heavier than before (same calls and triangles). Switching High to Low at runtime restores the procedural geometry; Low
  to High fetches what is missing.
- Sounds: each sample has a synthesised version that plays when the file is missing or not decoded yet.

## Verification run

- `?auto&sim=4000` (whole campaign, no rendering) gives the same result with assets, `?noassets` and `?low`:
  levels 1 to 8 finished (stars/net: 1:2/306, 2:1/254, 3:2/282, 4:3/402, 5:2/272, 6:2/344, 7:3/459, 8:3/478 after one retry),
  `window.dolmus.errors` empty. Rendered real-time runs (dozens of page loads of 6 to 60 s each, levels 1, 2, 3, 5 and 8 driven by the bot) also
  had 0 JS errors and 0 console errors.
- Sounds: with a user click the audio context starts and all 10 samples decode (`ASSETS.snd` = 10); calling door, coin,
  crash, thud and click throws nothing. I could not listen to them in a headless browser: the samples were chosen by name
  and checked for peak level (`volumedetect`), not by ear.
- Not verified: phone hardware (the 390x844 touch layout was checked in headless Chrome only), other GPUs, Safari/Firefox.

## Screenshots (docs/)

`assets-before-*.png` and `assets-after-*.png` are the same views (title, close-up, tram, bus, van, plaza, dusk, phone, plus
the sky, the four hours/rain, the door open and closed, shelter, simit and chestnut carts, parked car, settings and
north-up minimap).
