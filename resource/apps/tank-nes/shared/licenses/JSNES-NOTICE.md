# JSNES 2.1.0

- Upstream: https://github.com/bfirsh/jsnes
- Package: https://registry.npmjs.org/jsnes/-/jsnes-2.1.0.tgz
- Authors: Ben Firshman and JSNES contributors; originally based on vNES by Bjørn Erik Ekstrøm.
- License: Apache License 2.0, reproduced in `JSNES-LICENSE.txt`.
- Vendored file: `../src/main/assets/vendor/jsnes.min.js`, npm distribution transformed with esbuild 0.25.12 (`target: chrome61`, `minify: true`, `legalComments: inline`), plus an ES5 `globalThis` alias for older WebViews. Emulator behavior is not intentionally changed; class fields and other newer syntax are lowered for Android 8-era WebViews.
- Tarball SHA-256: `167081846a907e19bdd7cba75c648d827d49ea50e0fb58c079ad1a6613dee3c1`.
- Original npm JavaScript SHA-256: `84946f0dae4bcf3b2dfebe84ad3bfeb1dbcb413bd9b1a69e1f45910a95fd7b41`.

The repository-authored Android shell, controller transport and browser adapter are separate from the emulator core. No commercial game ROM is distributed. NES games, names and artwork belong to their respective owners; the emulator license does not license ROM content.

- Generated bundled JavaScript SHA-256: `fee1ae5bb33739bd217657bf40ca7986b7775336fc0fc17a5c79cdbc51e33d4f`.

To reproduce, extract the pinned npm tarball, run `npm ci --prefix desktop` at the repository root, then:

```bash
node resource/apps/tank-nes/shared/tools/vendor-jsnes.cjs /absolute/path/to/package/dist/jsnes.min.js
```

The script validates both input and output hashes and the transformer version.
