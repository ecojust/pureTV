# Night Racer · 霓虹街区

Non-official pureTV adaptation of zhuqipaopao-maker/night-racer-public,
fixed commit 3a432cd3bf059dbaaa00d700f0f83e0e5313d40b.

Original game code and assets retain the upstream MIT LICENSE and its attribution.
The exact downloaded file list, Git blob IDs and SHA256 values are in
docs/upstream-full-source-audit.json. Original package and dependency lock are
preserved under src/. The pureTV changes add controller/menu input, cancellation,
native persistence and offline packaging; the original driving/track rules remain.

Three.js: MIT, https://github.com/mrdoob/three. The installed dependency's license
is reproduced in THIRD-PARTY-LICENSES.txt and in the distribution.

Forest Ground 04 textures: Rob Tuytel and Rico Cilliers, Poly Haven, CC0 1.0;
see the unchanged models/forest/LICENSE-textures.txt alongside the textures.
Other model-generation provenance is retained in the original src/tools/assets/
and upstream repository; the game is not affiliated with vehicle brands.

This edition runs offline. Hosted rooms and global leaderboards are unavailable;
local races, time trials, garage, progression, local records and ghosts remain.
The original Chakra Petch 500/700 fonts are bundled locally under OFL, with
exact URLs and hashes in docs/font-sources.json; fonts/OFL.txt keeps the license.
System fonts provide the original CJK fallback. CrazyGames SDK/ads are not bundled.

Build/preparation status does not imply completed Android, macOS or Windows QA.
