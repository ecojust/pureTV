# Turbo Kart Rush · pureTV adaptation

Original game by **BridgeMind**, https://github.com/bridge-mind/turbo-kart-rush .
Fixed upstream commit: `6c0456c7642447eae29e0832e7e542fec07ec07d`.
Copyright (c) 2026 BridgeMind. Original MIT license retained in `LICENSE` and `src/upstream/LICENSE`, and reproduced in the distribution.

All original procedural track scenery, eight kart characters, four courses, music synthesis, visual effects, physics, race logic and item variants are retained. pureTV adds nine-key Wi-Fi controller input, identity cards, cancellation/manual recovery, offline packaging and read-only diagnostics. These additions are MIT licensed; upstream work is not claimed as pureTV original work.

Runtime **Three.js 0.185.1**, MIT, copyright 2010–2026 Three.js authors, https://github.com/mrdoob/three . Its exact package integrity is retained from the upstream lock and its license is included in the distribution. No third-party fonts, remote textures, audio files or online game service are loaded at runtime.

Build/typecheck tools retain upstream versions: TypeScript 7.0.2 (Apache-2.0), @types/three 0.185.4 (MIT), Vite 8.2.2 (MIT). esbuild 0.28.2 (MIT) creates the flat offline bundle. The upstream dependency closure is retained in `package-lock.json`, with esbuild added; build tools are not shipped as runtime code.

`upstream.json` records original file hashes. `docs/source-changes.json` records adapted originals. The original Mario Kart comparison describes mechanics; it is not a grant of Nintendo trademarks or character rights. Only the project's supplied procedural artwork and code are included.
