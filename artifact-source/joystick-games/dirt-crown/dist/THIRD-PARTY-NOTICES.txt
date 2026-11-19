# Dirt Crown — upstream and dependencies

Original game: Andrew Wooldridge (triptych), https://github.com/triptych/web-games-andrew, game-069 at a7051c34fe2e7550fd206e6272f758df171855b0. MIT, original text in LICENSE. Original simulation, 20 tracks, 26 career events, procedural art, audio and dialogue remain upstream work. This is an unofficial pureTV adaptation, not an original pureTV game.

Three.js 0.165.0 (three.js authors): MIT; src/vendor/three/LICENSE. Modules retain original notices. Bungee and Rubik: SIL Open Font License 1.1; src/vendor/fonts/bungee-OFL.txt and rubik-OFL.txt. Exact downloaded dependency URLs, bytes and SHA256 are in dependency-lock.json. Font CSS is localized without changing font bytes.

pureTV additions: offline resource layout, controller bridge/menu navigation and lifecycle pause, local diagnostics and build verification. Shared pureTV web controller files are copied byte-for-byte by build.mjs; asset-provenance.json identifies the output bytes. No external network is needed at runtime. Author links and PWA registration are not included in the native page.
