# Battle City visual and audio reference

Tank TV runs an independently written JavaScript game model and renderer. It does not load a NES ROM, execute 6502 code, or include an emulator. The intended reference is **Namco's 1985 NES/Famicom Battle City**, rather than the Tank 1990 modifications.

## Provenance and notices

The bundled reference sprite pixels and eleven short OGG cues come from [newagebegins/BattleCity](https://github.com/newagebegins/BattleCity), commit [`a1b1741782dcf23fc814e9a7abc5f383900b2cda`](https://github.com/newagebegins/BattleCity/tree/a1b1741782dcf23fc814e9a7abc5f383900b2cda). That repository carries an MIT license, copyright 2021 Vyacheslav Rachek. Its complete license is retained in [newagebegins-BattleCity-MIT.txt](../licenses/newagebegins-BattleCity-MIT.txt).

The original game, title, character and terrain designs, and sound design are credited to **Namco**. The reference repository does not provide separate authorship records or asset-specific provenance for each image or recording. We therefore do not describe the Namco artwork or sound composition as newly authored by pureTV, or claim that the remake author created the original designs. The upstream repository license is reported as supplied; it is not a claim of ownership over Namco's original work. This is an unofficial independent recreation.

The exact source paths and SHA-256 checksums are retained in [reference-art-manifest.json](reference-art-manifest.json) and [reference-audio-manifest.json](reference-audio-manifest.json). The upstream game's runtime code is not used.

## Visual representation

The game draws to a **256 × 240** canvas with a **208 × 208** battlefield at **(16, 16)**. The right margin holds the remaining enemy icons, player reserves and stage flag. Scaling preserves square native pixels. Phone pairing and session controls belong to the surrounding TV host and are not painted inside this game image.

`battle-art.js` contains 160 named native sprites, including directional tread frames, player star upgrades, four enemy types, armor palettes, brick and steel tiles, water, trees, eagle and ruins, power-ups, spawn stars, shield, projectiles, explosions, score popups, and the title/game-over marks. Upstream PNGs are supplied at 2× pixel scale. Each 2×2 block is normalized to its modal RGBA value, then palette indices are losslessly run-length encoded. The manifest retains both the source PNG dimensions and resulting native dimensions. No image interpolation is used at runtime.

`nes-renderer.js` renders the model's 4-pixel terrain cells by clipping the appropriate region of each native terrain tile. This allows individual brick fragments to disappear without replacing the original brick pattern. Forest is drawn over tanks and bullets; timed power-ups, spawn frames and shields retain their separate animation layers. Two-player recoloring is performed explicitly from the player-one sprite palette.

The menu and status text use independently authored 8×8 bitmap glyphs on the same tile grid. The ice texture is independently drawn because this reference sprite collection does not contain an ice tile. These two details, display palette choice, two-player recoloring, some transition timings and exact results animation are approximations; the renderer is not claimed to be a pixel-for-pixel or cycle-accurate reproduction of every original screen.

Rendered phases are title/selection, stage introduction, playing, pause, construction, results and game over. Results tally counts are animated in type order. A loss banner rises over the battlefield before the results screen. Stage layout and collision rules are owned by `levels.js` and `game-model.js`, not by sprite data.

For an independent original-screen comparison, [VGMaps' Battle City atlas](https://www.vgmaps.com/Atlas/NES/index.htm#BattleCity) provides stage maps; [stage 1](https://www.vgmaps.com/Atlas/NES/BattleCity(J)-Stage1.png) was consulted for battlefield and HUD composition. Those atlas images are references and are not bundled into this application.

## Audio cues and timing

`nes-audio.js` fetches and decodes only the bundled local files below. OGG bytes are copied without modification from the attributed repository.

| Model event | Bundled file |
| --- | --- |
| Stage introduction | `audio/stage_start.ogg` |
| Player fires | `audio/bullet_shot.ogg` |
| Bullet hits brick | `audio/bullet_hit_1.ogg` |
| Bullet hits steel | `audio/bullet_hit_2.ogg` |
| Enemy tank explodes | `audio/explosion_1.ogg` |
| Player or base explodes | `audio/explosion_2.ogg` |
| Power-up appears | `audio/powerup_appear.ogg` |
| Power-up collected / extra life | `audio/powerup_pick.ogg` |
| Results tally increments | `audio/statistics_1.ogg` |
| Game over | `audio/game_over.ogg` |
| Pause | `audio/pause.ogg` |

The engine idle/movement texture is separately authored Web Audio synthesis: a band-limited narrow-duty pulse with a low-frequency gate and distinct idle/moving rates. It is deliberately documented as an approximation, not an original engine recording or a sample-perfect NES APU emulation. [NESdev's APU description](https://www.nesdev.org/wiki/APU) was used as a technical reference for the pulse/noise sound vocabulary; no ROM sound driver or original score data is embedded. The `ice` event currently has no separate sound sample. Extra life reuses the supplied power-up cue rather than claiming an independently verified original extra-life recording.

Events are deduplicated by object identity because the model retains a bounded event history. Old events are not replayed when attaching an audio engine to an already running game. An initial cue can wait briefly for its local file to decode. Repeated tally ticks follow displayed counts, while short overlapping effects remain separate sources. The engine is attenuated during the stage introduction cue.

## Host API and shutdown

Load `battle-art.js` before `nes-renderer.js`, and `nes-audio.js` before the TV host:

```js
const renderer = new TankRenderer(canvas);
const audio = new TankAudio();
await audio.unlock(); // from a TV/user/controller action
renderer.draw(game);
audio.update(game);
audio.pause(true);   // backgrounding: stop cues, suspend AudioContext
// ...
audio.pause(false);
audio.dispose();     // exit: stop sources/oscillators and close AudioContext
```

Only local `audio/*.ogg` requests are needed. The host should allow same-origin connections in CSP and serve them as `audio/ogg`. The game model remains deterministic and contains no Web Audio dependency.

## Verification

A Chromium canvas run exercised title, stage introduction, gameplay, two-player results, construction and game over with the independent model. All 160 sprite records decoded to their declared pixel count and valid palette indexes. All eleven bundled audio files decoded successfully; repeated updates did not replay retained events, pause removed active sources and suspended the context, and disposal closed it. These checks establish render/audio integration; they do not establish cycle-identical NES behavior or replace playback testing on an Android television.
