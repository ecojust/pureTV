# Asset credits

All third-party assets are CC0 (public domain); credit is given anyway. Files live in `assets/`.
Everything else (the vehicle and prop models, code) was made for this game: models are written as Blender scripts in `assets/src/` and built with the free asset-forge tool (`python forge.py build ...`).

## Textures (Poly Haven, CC0)

- **Asphalt 02** by Rob Tuytel: https://polyhaven.com/a/asphalt_02 (`assets/textures/asphalt.jpg`, grey-scale 512 px)
- **Cobblestone Floor 01** by Rob Tuytel: https://polyhaven.com/a/cobblestone_floor_01 (`assets/textures/pavement.jpg`, grey-scale 512 px)
- **Grass Ground** by Charlotte Baglioni: https://polyhaven.com/a/grass_ground (`assets/textures/grass.jpg`, grey-scale 512 px)

## Sky (Poly Haven, CC0)

- **Kloofendal 48d Partly Cloudy (Pure Sky)** by Greg Zaal, Jarod Guest: https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky (`assets/sky/sky.jpg`, the 1024x512 sky strip made from the 1k HDRI; the .hdr itself is not shipped)

## Sounds (Kenney, CC0)

Converted to mono 22 kHz MP3 (`assets/sfx/`).

- **RPG Audio** by Kenney: https://kenney.nl/assets/rpg-audio (`doorOpen_1`, `doorClose_2` -> `door_open.mp3`, `door_close.mp3`; `handleCoins`, `handleCoins2` -> `coin1.mp3`, `coin2.mp3`)
- **Impact Sounds** by Kenney: https://kenney.nl/assets/impact-sounds (`impactMetal_heavy_001`, `impactMetal_heavy_003` -> `crash1.mp3`, `crash2.mp3`; `impactGeneric_light_001`, `impactGeneric_light_003` -> `thud1.mp3`, `thud2.mp3`)
- **Interface Sounds** by Kenney: https://kenney.nl/assets/interface-sounds (`click_002`, `click_004` -> `click1.mp3`, `click2.mp3`)

## Mascot (original artwork, project owner)

- **The white Turkish Van kitten** (`assets/mascot/kedi-uyuyor.png`, `assets/mascot/kedi-kutlama.png`): the series mascot, copied from the project's own mascot set (`video-studio/public/maskot/`); the celebrating pose is downscaled to 256 px. It appears on the shift-summary card (asleep on the dolmuş back seat, awake and cheering on 3 stars) and is not loaded with `?noassets`.

## 3D chibi pictures (stil-3d, 23.11.2026; Leonardo AI, free plan, Auto/Lucid Origin model)

Made for this game in the style of its song video; white backgrounds removed locally (`atolye/oyun-stil/dolmus/kes.py`). Files in `assets/3d/`, loaded only with assets on (`?noassets` keeps the old look).

- Character sheet 1 (Leonardo AI): `sofor-yuz.webp` (the dolmuş driver: title, pause, shift report, top bar, driver seat chip), `turist-yuz.webp` (tourist: title, settings, tourist riders' seat chips), `nine-yuz.webp` (grandmother), `ogrenci-yuz.webp` (student)
- Character sheet 2 (Leonardo AI): `esnaf-yuz.webp` (shopkeeper), `memur-yuz.webp` (commuter and VIP)
- Yellow dolmuş with the driver at the wheel (Leonardo AI; the car-maker badge on the bonnet painted out): `dolmus-sofor.webp` (title card)
- Painted clay-cloud sky (Leonardo AI): `gok.webp` (daytime sky dome; its horizon colour also tints the fog)

The in-game people (chibi heads, round bodies, smooth clay shading) are still procedural geometry in `index.html` (`pedGeos`).
