# Tank TV

<!-- apk-resource:start -->
[Download APK](tank-0.3.0.apk?raw=1) · [Checksums](SHA256SUMS.txt) · [Signing and build provenance](resource.json) · [Source code](src/) · [64×64 SVG icon](logo.svg)

The APK in this directory is signed with the pureTV release certificate.
<!-- apk-resource:end -->

[中文](README.md) · [English](README.en.md)

The published version is **`0.3.0`**, independently reimplementing the 1985 NES Battle City rules, 35 stages and presentation. Install and play without importing a ROM. The unchanged package ID and signing certificate allow updating an earlier installation. Physical-TV and frame-by-frame comparisons are incomplete.

The rewrite retains QR pairing and two phone controllers over the local network, with a native 256×240 display and 208×208 battlefield. It does not load or execute a ROM. The 35 maps, 20-enemy stage sequences, four enemy classes, six power-ups, upgrades, co-op tallies and Construction mode have source references. AI, some collisions and animation timings still need frame-by-frame comparison. See [rules and maps](docs/reference.md) and [artwork and audio](docs/reference-art-audio.md) for evidence and limitations.

Requires Android 8.0 or later; package `com.ecojust.tanktv`. The room UI and phone controllers support Chinese and English. In-game menus retain the original English labels.

## Changes in 0.3.0

Fixes a black game screen and missing player status on older TV WebViews by removing newer JavaScript syntax and API dependencies. Room status now updates independently of game rendering, and startup/render failures display a readable error. Regression tests cover legacy syntax, missing APIs, failure messages, player joins/disconnects and cleanup on exit. Includes a 64×64 SVG icon with matching Android app artwork.

## Play

1. Install the new test build and connect the TV and phones to the same router.
2. Scan the TV's QR code; up to two phones can join.
3. Use **SELECT** to choose 1 PLAYER, 2 PLAYERS or CONSTRUCTION; confirm with **START**.
4. On the initial stage selector, A/B changes the stage and START begins. During play, START pauses or resumes.

| Control | Action |
| --- | --- |
| Joystick | Move and turn |
| A / B | Fire on each press; holding does not autofire |
| SELECT | Change menu selection |
| START | Start, confirm, pause or resume |
| TV Back | Exit confirmation |

Defend the base and defeat the enemy wave. Helmet, clock, shovel, star, grenade and tank are collectible power-ups; B no longer creates a custom shield. Stars increase shell speed, simultaneous shell capacity and steel-breaking ability. Friendly fire temporarily freezes the other tank, and player shells can destroy the base.

These images show this rewritten version running its actual bundled game page in Chromium with simulated room data. They are not physical-TV captures.

![Rewritten game page](docs/tank-tv.en.png)

![Phone controller](docs/controller.en.png)

## Local connections

The TV app runs an HTTP and WebSocket room server on a port assigned at startup. The QR code contains the current TV address, port and random room token. Use the code currently shown by the app after each launch. Controller input is not sent to a pureTV cloud service.

Up to two players can connect at once. Temporary disconnections clear held controls; a returning phone attempts to resume its previous player slot. Switching the phone to the background or locking its screen also releases the joystick and buttons. Pressing Home closes the room. Confirming exit closes the server, disconnects every controller, destroys the game page and terminates this app’s process. Reopening creates a new room.

If the phone cannot connect, check that both devices share the same local network and that the router does not isolate guest or Wi-Fi clients. Open the local HTTP address in a phone browser with local-network access. There is no public Internet relay.

## Build and verify

Run from the repository root:

```bash
node --test resource/apps/tank/tests/game.test.cjs
npm ci --prefix desktop
cd desktop && npx playwright install chromium && cd ..
node resource/apps/tank/tests/compatibility.mjs
node resource/apps/tank/tests/controller.mjs
node resource/apps/tank/tests/capture.mjs
cd resource/launcher/puretv
./gradlew :tank:assembleDebug :tank:testDebugUnitTest :tank:lintDebug :tank:verifyReleaseSize
```

APKs are generated under `resource/apps/tank/build/outputs/apk/`. Release builds enable code and resource shrinking and enforce a 5 MiB size limit. Published resource APKs are signed with the pureTV release certificate. Android tests cover the room server and lifecycle, Node tests cover game rules, and browser tests cover phone input.

Set `TANK_UI_CAPTURE_DIR` and run `tests/capture.mjs` to export Chinese and English game previews. These capture the actual bundled page in Chromium using test data for the native room bridge; they are not measurements of physical TV performance or phone network latency. This directory contains the signed 0.3.0 package with the compatibility fix. See [resource.json](resource.json) for its source commit, APK checksum and build method, and [resource maintenance](../../../docs/resource-maintenance.md) for catalog maintenance.

## Artwork and licensing

The independently written application code is MIT licensed. Upstream reference images and short audio cues, their supplied license records, and attribution to the original Namco game are documented in the [artwork and audio notes](docs/reference-art-audio.md). The project does not claim authorship of the original designs or extend its code license to all third-party content.
