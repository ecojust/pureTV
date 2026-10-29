# Mighty Bomb Jack TV

[中文](README.md) · [English](README.en.md)

An independent recreation inspired by NES Mighty Bomb Jack: 16 pyramid stages, action zones and 24-bomb palace rooms, variable jumps and floating, treasure chests, and blue/orange/green Mighty powers.

The planned **0.5.0** release requires Android 8.0 or later. Package: `com.ecojust.bombjacktv`. The TV displays the game and a room QR code; phones act as controllers.

<!-- apk-resource:start -->
[Download APK](bomb-jack-0.1.0.apk?raw=1) · [Checksums](SHA256SUMS.txt) · [Signing and build provenance](resource.json) · [Source code](src/) · [64×64 SVG icon](logo.svg)

The APK is signed with the pureTV release certificate.
<!-- apk-resource:end -->

## 0.5.0 release preparation and installation

All nine games are being prepared as version 0.5.0 with a new game release certificate. Package IDs stay unchanged, so Android cannot use the new certificate to replace an installation signed with the old one. Back up any data your device can export before uninstalling the old app and installing 0.5.0. Uninstalling clears local game saves and records. This project has no automatic save migration tool and cannot guarantee recovery of old saves.

Publication is complete only when the 0.5.0 APK, checksums and `resource.json` have all been updated.

## Gameplay changes in 0.5.0

Version 0.5.0 adds midair jump braking and floating, plus warned mummy transformations into flying hunters.

## Play

1. Connect the TV and phones to the same LAN and open the game on the TV.
2. Scan its QR code in a phone browser. Use one phone per player.
3. Press SELECT on the title screen to choose the player count, then START.
4. The left joystick stays hidden until touched. Each touch sets its center; drag to move, then release to stop and hide it. The right third of the screen is a full action surface: B on the upper half, A on the lower half. Touch anywhere in a half, including its edges; both actions support simultaneous touches with the stick. START/SELECT stay separate at the bottom left.

The controller disables text selection and long-press browser menus across the play surface.

| Control | Action |
| --- | --- |
| Floating joystick | Move left/right; Up enters an open door |
| A | Jump; Up+A high jump, Down+A low jump; press again in the air to brake, then hold to float |
| B | Spend a Mighty Coin to advance your power |
| SELECT | Change player count on title; toggle music while paused |
| START | Start, pause / resume |
| TV Back | Confirm exit |

Two players take **alternating turns**, retaining their own lives, score and stage. A lost life passes control to the next player. Phones show whose turn it is; waiting players cannot move the active character. Losing the active controller pauses the game until it reconnects. Manual pause remains paused. High score and music preference are stored on the TV.

## Screenshots

Actual bundled game pages rendered in Chromium with a simulated native room bridge, not physical TV captures.

![Game screen](docs/bomb-jack-tv.en.png)

![Phone controller](docs/controller.en.png)

![Floating stick during a drag](docs/controller-active.en.png)

## Room and exit

Up to two phones connect through a local HTTP/WebSocket server. Each launch creates a new port and random room token in the QR code. No cloud service is required. Losing focus, cancelling a touch or disconnecting releases held buttons.

Leaving with TV Home or confirming exit closes the room, disconnects phones, releases workers and wake locks, destroys the WebView and audio, and ends the app process. Scan the new QR code when reopening. Current game progress is not restored after exit.

## Implementation and verification

Maps, graphics, icons, sound effects and music are independently authored. No original ROM, extracted artwork or original soundtrack is bundled. See the [reference and implementation notes](docs/reference.md) for the exact scope and differences; this is not a claim of frame-perfect or tile-for-tile reproduction. Project-authored code and assets use the [MIT license](LICENSE).

```sh
node --test resource/apps/bomb-jack/tests/*.test.cjs
node resource/apps/bomb-jack/tests/controller.mjs
node resource/apps/bomb-jack/tests/compatibility.mjs
node resource/apps/bomb-jack/tests/capture.mjs

cd resource/launcher/puretv
./gradlew :bomb-jack:assembleRelease :bomb-jack:testDebugUnitTest :bomb-jack:lintDebug :bomb-jack:verifyReleaseSize
```

Browser tests use the desktop npm dependencies and Chromium; set `CHROMIUM_PATH` to select a browser. Physical TV and phone verification is still pending.
