# Artwork and audio

The canvas renderer, 5×7 bitmap letter patterns, beveled block tiles, metal-style borders, title screen and SVG application icon are drawn directly by this project. No ROM, sprite extraction, screenshot, commercial font file or soundtrack recording is bundled.

The layout deliberately follows the familiar information hierarchy of an NES-era falling-block game: a 10×20 well, next piece, score, level, cleared-line count and piece statistics. The two-well screen is an additional local multiplayer presentation for this application.

Audio uses Web Audio square/triangle oscillators for newly written short effects and a newly composed repeating accompaniment. It does not reproduce the original game soundtrack. SELECT toggles background music during play or pause; pause and exit stop the app's scheduled voices and audio context.

These newly authored files use the repository's MIT license. The classic game name and rules are referenced to identify the independently implemented gameplay, without claiming to be the original game or an official release.
