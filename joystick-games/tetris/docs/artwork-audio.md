# Artwork and audio

The canvas renderer, heavy 8-pixel HUD lettering, narrow statistics lettering, block tiles, grey maze background, layered frames, title screen and SVG application icon are drawn directly by this project. No ROM, sprite extraction, screenshot, commercial font file or soundtrack recording is bundled.

The single-player layout follows the Nintendo NES screen: A-TYPE and statistics on the left, LINES above the central 10×20 well, and TOP, SCORE, NEXT and LEVEL on the right. The two-well screen is an additional local multiplayer presentation for this application. The source image linked in the reference document is used for visual comparison only; background paths, letter masks and colors are independently drawn and are not claimed to match every original pixel or hardware palette.

Audio uses Web Audio square/triangle oscillators for newly written short effects and a newly composed repeating accompaniment. It does not reproduce the original game soundtrack. SELECT toggles background music during play or pause; pause and exit stop the app's scheduled voices and audio context.

These newly authored files use the repository's MIT license. The classic game name and rules are referenced to identify the independently implemented gameplay, without claiming to be the original game or an official release.
