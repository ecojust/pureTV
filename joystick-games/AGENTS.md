# Joystick games

Follow the root AGENTS.md and current history record. This directory contains upstream game adaptations and their two platform packages; it does not change the completed Game Kit hundred-game count.

- Keep each game's upstream commit, original dependency lock integrity and license facts. Retain its own rules, renderer and input conventions. Do not describe imported code as an original pureTV implementation.
- Edit each game's `src/`; rebuild and run `build:check` before freezing. Native Android and Mac packages must use the exact verified `dist/` bytes.
- The shared controller bridge polls native input once per animation frame. All diagnostics and identity cards read the cached frame, never a second consuming snapshot. Keep nine physical keys independent.
- Disconnect, background and focus loss cancel controls without firing a weapon or awarding drift release. Reconnection never automatically resumes gameplay. START and all menus must work without a mouse pointer lock.
- Validate actual gameplay, menus and side panels at 960×540 and 1280×720. Keep synthetic bridge, original SDK TCP, installed APK and native Mac results separate. Preserve original failures, exact test scripts and source hashes.
- Only committed, fixed-certificate Android APKs and verified Mac packages go into game directories. Scratch outputs, keys, dependencies and caches stay outside the repository. Do not upload to the app market or change its catalog merely because these separate packages were built.
