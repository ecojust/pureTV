# Backroad Rally · 乡野拉力

Unofficial pureTV controller adaptation of jason-c-dev/backroad-rally.
Original repository: https://github.com/jason-c-dev/backroad-rally
Fixed upstream commit: e5542f96b9a9a2912fdaa160396054e81f022f23.

Copyright (c) 2026 jason-c-dev. The upstream README states that the code is MIT
licensed; its original LICENSE remains here and in src/upstream/LICENSE.
The complete fixed source, original assets and dependency lock are retained in
src/upstream/. Source identities and runtime asset hashes are recorded under docs/.

Upstream credits Three.js under MIT, Rapier under Apache-2.0, and Inter by
The Inter Project Authors under SIL Open Font License 1.1. Their notices are kept
in dist/THIRD-PARTY-NOTICES.txt and the original fonts/OFL.txt.
Upstream identifies its sound effects and music as generated with ElevenLabs,
with engine and UI sounds synthesized by its own scripts. These provenance
statements are retained without extending the code-license claim to other terms.

The original author describes art of rally as inspiration only, with no files,
code, assets, sounds, music or reverse-engineered binaries taken from it, and no
affiliation or sponsorship. This adaptation does not claim such affiliation.

The pureTV changes add controller/menu input, cancellation, read-only observations,
explicit finite native storage keys, and offline packaging. The package defaults
to the upstream renderer's existing WebGL2 backend. The same TSL materials,
vehicle physics, stages, career rules and original asset bytes remain in use.
Original GLB files are packaged directly rather than requiring a runtime gzip
DecompressionStream; archive compression remains lossless. Original mutable
development model handles are not exported by the installed page.

Build and source preparation do not imply completed native or physical-device QA.
