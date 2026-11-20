# Ponpoko Kart · pureTV adaptation

Original game: **ぽんぽこカート**, by **たぬ / tanuu5**.
Source: https://github.com/tanuu5/ponpoko-kart
Fixed commit: `88edb72d25c2f957431cc4d12547d3138d1bca48`.
Original game source and procedural graphics/audio are distributed under the original MIT license, reproduced in `LICENSE` and `src/upstream/LICENSE`.
`upstream.json` records the unmodified baseline of every imported file; the deliberately changed files and reasons are listed in `docs/source-changes.json`.

This adaptation retains the original renderer, kart physics, races, characters, courses, HUD, menu art and synthesized audio. pureTV changes add a controller bridge, neutral cancellation and a read-only diagnostic snapshot. Original developer URL switches and writable debugging globals are not part of the packaged entry point. Upstream software was not authored by pureTV.

Runtime dependency **Three.js 0.186.1**, MIT, copyright 2010–2026 Three.js authors: https://github.com/mrdoob/three . Its exact npm integrity matches the original lock. Bundled dependency license follows this notice in `dist/THIRD-PARTY-NOTICES.txt`.
Build dependency **esbuild 0.28.2**, MIT, https://github.com/evanw/esbuild ; build tool is not shipped as runtime code.

The original Google Fonts families **Dela Gothic One**, **M PLUS Rounded 1c** (500/800), and **Yuji Syuku** are stored locally as Google's glyph-subset font responses covering all printable original UI/source characters plus ASCII. All are SIL Open Font License 1.1. Copyright notices, exact source URLs, byte hashes and fixed license URLs are recorded in `src/fonts/sources.json`; license texts follow in the distribution. M PLUS Rounded 1c's license is preserved from the historical `ofl/roundedmplus1c/OFL.txt` path, because the current `ofl/mplusrounded1c/` directory omits its license file. No runtime font download is required.

pureTV adapter additions are distributed under MIT. No upstream trademarks are claimed. No third-party paid service or game server is needed.
