# One-button runtime and asset notices

The 11 one-button adaptations retain their original three engine MIT notices and add 17 dependency/embedded notices under `joystick-games/shared/crisp/licenses/`. Their build combines every file into the offline distribution's `THIRD-PARTY-NOTICES.txt`; rebuild after this audit before freezing packages.

PixiJS 5.3.0 is the original unminified npm distribution, byte-for-byte. Its published source map identifies 20 external source files from 12 packages; each included file exactly matches the recorded npm reference package (resource-loader is compared through its own published source map). This verifies the included code and license reference, not an unrecovered historical dependency lock. Earcut is ISC, tslib 1.9.3 is Apache-2.0, FXAA retains its BSD-3-Clause notice, and the other listed runtime dependencies are MIT. Original embedded Joyent, Microsoft and FXAA notices remain in the JavaScript.

Sounds-some-sounds 3.1.1 declares ranges `@tonaljs/tonal ^4.6.5` and `mml-iterator ^1.1.0`; its full historical transitive version resolution was not recovered. Tonal 4.6.5 provides the original 2015 danigb MIT text used as a license reference. MML's npm and Git sources declare MIT but do not include a license file; its linked license site returned HTTP 403. The plain-text notice is reconstructed from the fixed public MIT-license provider template and Nao Yonamine's provider author entry, without inventing a year. These exact sources and the limitation are recorded in the JSON audit.

The sound library also vendors and explicitly credits loov/jsfx outside npm dependencies. The original upstream MIT notice, copyright 2017 Egon Elbre, is included; the exact upstream revision copied by sounds-some-sounds is not known.

All 18 MP3 files match their recorded upstream SHA256. Their source repositories' fixed root MIT licenses apply in the inspected tree; no contrary per-asset exception was present. No added license file replaces an original notice, no source audit is represented as an actual gameplay test, and no claim is made that the historical sounds-some-sounds dependency graph was completely restored.

Details, original-file hashes, source-map comparisons and fixed source links: [one-button-assets.json](one-button-assets.json).
