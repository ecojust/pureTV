# Joystick games

Follow the root AGENTS.md and current history record. This directory contains upstream game adaptations and their platform packages; it does not change the completed Game Kit hundred-game count.

- Follow the [game input and connection display standard (Chinese)](../docs/guide/game-controls.md). For each new port, verify PC keyboard and Wi-Fi controller play, Android TV phone pairing and Wi-Fi controller play, and a stable playfield as controllers join and leave.
- Keep each game's upstream commit, original dependency lock integrity and license facts. Retain its own rules, renderer and input conventions. Do not describe imported code as an original pureTV implementation.
- Edit each game's `src/`; rebuild and run `build:check` before freezing. Use the exact verified `dist/` bytes for Android and for each native desktop package the game ships.
- The shared controller bridge polls native input once per animation frame. All diagnostics and identity cards read the cached frame, never a second consuming snapshot. Keep nine physical keys independent.
- Disconnect, background and focus loss cancel controls without firing a weapon or awarding drift release. Reconnection never automatically resumes gameplay. START and all menus must work without a mouse pointer lock.
- Validate actual gameplay, menus and side panels at 960×540 and 1280×720. Identify the host and input path for each result, including bridge fixtures, TCP SDK, phone, installed Android APK, macOS and Windows. Preserve original failures, exact test scripts and source hashes.
- Only committed, fixed-certificate Android APKs and verified Mac packages go into game directories. Scratch outputs, keys, dependencies and caches stay outside the repository. Do not upload to the app market or change its catalog merely because these separate packages were built.
- Publish signed Android game APKs under `joystick-games/<id>/<versioned filename>.apk`. Update the game download links and checksum records in the same change. For APKs stored with Git LFS, enable **Include Git LFS objects in archives** in the repository settings and verify the downloaded source archive contains the package bytes. Keep existing Release attachments available at their historical URLs.
